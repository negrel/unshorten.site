use actix_web_prom::{PrometheusMetrics, PrometheusMetricsBuilder};

pub fn setup_metrics() -> PrometheusMetrics {
    PrometheusMetricsBuilder::new(&env!("CARGO_PKG_NAME").replace('-', "_"))
        .endpoint("/metrics")
        .build()
        .expect("Failed to build prometheus metrics")
}
