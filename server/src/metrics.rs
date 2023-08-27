use actix_web::http::StatusCode;
use actix_web_prom::{PrometheusMetrics, PrometheusMetricsBuilder};

pub fn setup_metrics() -> PrometheusMetrics {
    PrometheusMetricsBuilder::new(&env!("CARGO_PKG_NAME").replace('-', "_"))
        .endpoint("/admin/metrics")
        .exclude_status(StatusCode::NOT_FOUND)
        .build()
        .expect("Failed to build prometheus metrics")
}
