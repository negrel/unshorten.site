use actix_web::{web, HttpResponse};
use futures::future::join_all;
use reqwest::IntoUrl;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct UnshortenRequest {
    urls: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct UnshortenResponse {
    results: Vec<UnshortenResult>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "snake_case")]
enum UnshortenResult {
    Url(String),
    Error(String),
}

#[tracing::instrument(skip_all)]
pub async fn post_unshorten_urls(body: web::Json<UnshortenRequest>) -> HttpResponse {
    let request = body.into_inner();

    let mut futures = Vec::with_capacity(request.urls.len());
    for url in request.urls {
        futures.push(async move { unshorten_url(url).await })
    }

    let results = join_all(futures).await;

    HttpResponse::Ok().json(UnshortenResponse { results })
}

#[tracing::instrument(skip_all)]
pub async fn get_unshorten_url(url: web::Path<String>) -> HttpResponse {
    let result = unshorten_url(url.into_inner()).await;
    match result {
        UnshortenResult::Url(_) => HttpResponse::Ok().json(result),
        UnshortenResult::Error(_) => HttpResponse::BadRequest().json(result),
    }
}

async fn unshorten_url<T: IntoUrl>(url: T) -> UnshortenResult {
    let url = url.as_str();

    match reqwest::get(url).await {
        Ok(response) => UnshortenResult::Url(response.url().to_string()),
        Err(err) => {
            if let Some(err_url) = err.url() {
                if err_url.as_str() != url {
                    return UnshortenResult::Url(err_url.to_string());
                }
            }

            let err = err.to_string();
            tracing::error!(err);
            UnshortenResult::Error(err)
        }
    }
}
