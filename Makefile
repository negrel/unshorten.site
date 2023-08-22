repository_root := $(shell git rev-parse --show-toplevel)
repository_root := $(or $(repository_root), $(CURDIR))
include $(repository_root)/variables.mk

.PHONY: dev/start
dev/start:
	cargo run | bunyan

.PHONY: docker/build
docker/build:
	nix build .#docker
	$(DOCKER) load < result
	rm -f result

.PHONY: audit
audit:
	cargo audit

.PHONY: lint/rust
lint/rust:
	cargo clippy -- -D warnings
	cargo fmt -- --check

.PHONY: lint
lint: lint/rust

