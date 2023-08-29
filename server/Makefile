repository_root := $(shell git rev-parse --show-toplevel)
repository_root := $(or $(repository_root), $(CURDIR))
include $(repository_root)/variables.mk

.PHONY: dev/start
dev/start:
	cargo run | bunyan

.PHONY: dev/build
dev/build:
	cargo build

.PHONY: audit
audit:
	cargo audit

.PHONY: lint
lint:
	cargo clippy -- -D warnings
	cargo fmt -- --check

.PHONY: test
test:
	cd tests/ && docker compose up --exit-code-from k6
	cd tests/ && docker compose down
