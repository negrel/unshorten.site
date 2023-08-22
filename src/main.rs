use std::{error::Error, io};

use actix_web::{
    error::{InternalError, JsonPayloadError, PathError, QueryPayloadError, UrlencodedError},
    web, App, HttpRequest, HttpResponse, HttpServer,
};
use mime::APPLICATION_JSON;
use tracing_actix_web::TracingLogger;

use crate::unshorten::{get_unshorten_url, post_unshorten_urls};

mod metrics;
mod tracing;
mod unshorten;

use metrics::setup_metrics;

#[actix_web::main]
async fn main() -> Result<(), io::Error> {
    // Setup tracing.
    tracing::setup_tracing(
        "unshorten.site".to_string(),
        "info".to_string(),
        std::io::stdout,
    );

    let prometheus_metrics = setup_metrics();

    let server = HttpServer::new(move || {
        App::new()
            .wrap(TracingLogger::default())
            .wrap(prometheus_metrics.clone())
            .app_data(web::JsonConfig::default().error_handler(json_error_handler))
            .app_data(web::PathConfig::default().error_handler(path_error_handler))
            .app_data(web::FormConfig::default().error_handler(form_error_handler))
            .app_data(web::QueryConfig::default().error_handler(query_error_handler))
            .service(web::resource("/api/v1/unshorten").route(web::post().to(post_unshorten_urls)))
            .service(
                web::resource("/api/v1/unshorten/{url:.*}").route(web::get().to(get_unshorten_url)),
            )
    })
    .bind(("0.0.0.0", 8080))?;

    ::tracing::info!("Server listening at http://0.0.0.0:8080");
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
