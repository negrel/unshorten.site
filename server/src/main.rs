use std::{
    env,
    error::Error,
    fmt,
    fs::File,
    future::{ready, Ready},
    io::{self, BufReader},
};

use actix_files::Files;
use actix_web::{
    error::{InternalError, JsonPayloadError, PathError, QueryPayloadError, UrlencodedError},
    http::{header::Header, StatusCode},
    web, App, FromRequest, HttpRequest, HttpResponse, HttpServer, ResponseError,
};
use actix_web_httpauth::{
    headers::authorization::{self, Authorization},
    middleware::HttpAuthentication,
};
use mime::APPLICATION_JSON;
use rustls::{Certificate, PrivateKey, ServerConfig};
use rustls_pemfile::{certs, pkcs8_private_keys};
use tracing_actix_web::TracingLogger;

mod metrics;
mod tracing;
mod unshorten;

use metrics::setup_metrics;
use unshorten::{get_unshorten_url, post_unshorten_urls};

#[tokio::main]
async fn main() -> Result<(), io::Error> {
    // Setup tracing.
    tracing::setup_tracing(
        "unshorten.site".to_string(),
        "info".to_string(),
        std::io::stdout,
    );

    let prometheus_metrics = setup_metrics();
    let tls_config = load_rustls_config();

    let server = HttpServer::new(move || {
        App::new()
            .wrap(prometheus_metrics.clone())
            .wrap(admin_authentication_middleware())
            .wrap(TracingLogger::default())
            .app_data(web::JsonConfig::default().error_handler(json_error_handler))
            .app_data(web::PathConfig::default().error_handler(path_error_handler))
            .app_data(web::FormConfig::default().error_handler(form_error_handler))
            .app_data(web::QueryConfig::default().error_handler(query_error_handler))
            .route("/admin/health", web::get().to(health_check))
            .service(web::resource("/api/v1/unshorten").route(web::post().to(post_unshorten_urls)))
            .service(
                web::resource("/api/v1/unshorten/{url:.*}").route(web::get().to(get_unshorten_url)),
            )
            .service(
                Files::new("/", "/usr/share/actix/static")
                    .prefer_utf8(true)
                    .index_file("index.html"),
            )
    })
    .bind("0.0.0.0:8080")?
    .bind_rustls_021("0.0.0.0:8443", tls_config)?;

    ::tracing::info!("Server listening at http://0.0.0.0:8080 and https://0.0.0.0:8443");
    server.run().await
}

fn error_handler(
    err: impl Error + 'static,
    _req: &HttpRequest,
    error_code: &'static str,
) -> actix_web::Error {
    let err_msg = err.to_string();
    InternalError::from_response(
        err,
        HttpResponse::BadRequest()
            .content_type(APPLICATION_JSON.to_string())
            .body(format!(
                r#"{{"error_code":"{error_code}","error_message":"{err_msg}"}}"#
            )),
    )
    .into()
}

fn json_error_handler(err: JsonPayloadError, req: &HttpRequest) -> actix_web::Error {
    error_handler(err, req, "InvalidJsonPayload")
}

fn path_error_handler(err: PathError, req: &HttpRequest) -> actix_web::Error {
    error_handler(err, req, "InvalidPathPayload")
}

fn form_error_handler(err: UrlencodedError, req: &HttpRequest) -> actix_web::Error {
    error_handler(err, req, "InvalidFormPayload")
}

fn query_error_handler(err: QueryPayloadError, req: &HttpRequest) -> actix_web::Error {
    error_handler(err, req, "InvalidQueryPayload")
}

async fn health_check() -> HttpResponse {
    HttpResponse::Ok().finish()
}

fn admin_authentication_middleware() -> HttpAuthentication<
    AdminAuth,
    impl Fn(
        actix_web::dev::ServiceRequest,
        AdminAuth,
    ) -> Ready<
        Result<actix_web::dev::ServiceRequest, (actix_web::Error, actix_web::dev::ServiceRequest)>,
    >,
> {
    let admin_login = env::var("UNSHORTEN_ADMIN_LOGIN")
        .expect("UNSHORTEN_ADMIN_LOGIN environment variable is not set");
    let admin_passwd = env::var("UNSHORTEN_ADMIN_PASSWORD")
        .expect("UNSHORTEN_ADMIN_PASSWORD environment variable is not set");

    HttpAuthentication::with_fn(move |req, credentials: AdminAuth| {
        if !req.path().starts_with("/admin") {
            return ready(Ok(req));
        }

        let credentials = credentials.0;

        if let Some(password) = credentials.password() {
            if credentials.user_id() == admin_login && password == admin_passwd {
                return ready(Ok(req));
            }
        }

        ready(Err((
            actix_web::error::Error::from(AdminAuthenticationError),
            req,
        )))
    })
}

fn load_rustls_config() -> rustls::ServerConfig {
    // init server config builder with safe defaults
    let config = ServerConfig::builder()
        .with_safe_defaults()
        .with_no_client_auth();

    // load TLS key/cert files
    let key_filepath = env::var("UNSHORTEN_TLS_KEY_FILEPATH")
        .expect("UNSHORTEN_TLS_KEY_FILEPATH environment variable is not set");
    let cert_filepath = env::var("UNSHORTEN_TLS_CERT_FILEPATH")
        .expect("UNSHORTEN_TLS_CERT_FILEPATH environment variable is not set");

    let cert_file = &mut BufReader::new(File::open(cert_filepath).unwrap());
    let key_file = &mut BufReader::new(File::open(key_filepath).unwrap());

    // convert files to key/cert objects
    let cert_chain = certs(cert_file)
        .unwrap()
        .into_iter()
        .map(Certificate)
        .collect();
    let mut keys: Vec<PrivateKey> = pkcs8_private_keys(key_file)
        .unwrap()
        .into_iter()
        .map(PrivateKey)
        .collect();

    // exit if no keys could be parsed
    if keys.is_empty() {
        eprintln!("Could not locate PKCS 8 private keys.");
        std::process::exit(1);
    }

    config.with_single_cert(cert_chain, keys.remove(0)).unwrap()
}

#[derive(Debug)]
pub struct AdminAuthenticationError;

impl ResponseError for AdminAuthenticationError {
    fn status_code(&self) -> StatusCode {
        // Hide admin interface.
        StatusCode::NOT_FOUND
    }

    fn error_response(&self) -> HttpResponse<actix_web::body::BoxBody> {
        HttpResponse::build(self.status_code()).finish()
    }
}

impl fmt::Display for AdminAuthenticationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt::Display::fmt(&self.status_code(), f)
    }
}

#[derive(Debug)]
struct AdminAuth(authorization::Basic);

impl FromRequest for AdminAuth {
    type Error = AdminAuthenticationError;

    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _payload: &mut actix_web::dev::Payload) -> Self::Future {
        ready(match Authorization::<authorization::Basic>::parse(req) {
            Ok(auth) => Ok(AdminAuth(auth.into_scheme())),
            Err(_) => Ok(AdminAuth(authorization::Basic::new(
                "",
                None::<&'static str>,
            ))),
        })
    }
}
