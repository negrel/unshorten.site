use tracing::{subscriber::set_global_default, Subscriber};
use tracing_bunyan_formatter::{BunyanFormattingLayer, JsonStorageLayer};
use tracing_log::LogTracer;
use tracing_subscriber::{fmt::MakeWriter, layer::SubscriberExt, EnvFilter, Registry};

/// Create and returns a new [`tracing::Subscriber`] with the given name,
/// default log level filter, and output (sink).
fn new_subscriber<Sink>(
    name: String,
    log_level_filter: String,
    sink: Sink,
) -> impl Subscriber + Send + Sync
where
    Sink: for<'a> MakeWriter<'a> + Send + Sync + 'static,
{
    let env_filter =
        EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new(log_level_filter));
    let formatting_layer = BunyanFormattingLayer::new(name, sink);

    // Merge layers and returns subscriber.
    Registry::default()
        .with(env_filter)
        .with(JsonStorageLayer)
        .with(formatting_layer)
}

/// Setup tracing.
/// This function setups a global [`tracing::Subscriber`] that filters
/// log events and format them using [bunyan format](https://github.com/LukeMathWalker/bunyan).
pub fn setup_tracing<Sink>(application_name: String, default_log_level: String, log_output: Sink)
where
    Sink: for<'a> MakeWriter<'a> + Send + Sync + 'static,
{
    // Create subscriber that listen to [`tracing::Event`].
    let subscriber = new_subscriber(application_name, default_log_level, log_output);

    // Initialize LogTrace, a logger that converts log to [`tracing::Event`].
    LogTracer::init().expect("Failed to setup logger");

    // Define global [`tracing::Subscriber`].
    set_global_default(subscriber).expect("Failed to set tracing subscriber");
}
