use actix_web::{web, HttpResponse};
use futures::future::join_all;
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

#[tracing::instrument[skip_all]]
pub async fn post_unshorten_urls(body: web::Json<UnshortenRequest>) -> HttpResponse {
    let request = body.into_inner();

    let mut futures = Vec::with_capacity(request.urls.len());
    for url in request.urls {
        futures.push(async move {
            match reqwest::get(url).await {
                Ok(response) => UnshortenResult::Url(response.url().to_string()),
                Err(err) => {
                    let err = err.to_string();
                    tracing::error!(err);
                    UnshortenResult::Error(err)
                }
            }
        })
    }

    let results = join_all(futures).await;

    HttpResponse::Ok().json(UnshortenResponse { results })
}
