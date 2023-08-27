repository_root := $(shell git rev-parse --show-toplevel)
repository_root := $(or $(repository_root), $(CURDIR))
include $(repository_root)/variables.mk

.PHONY: dev/start
dev/start:
	cargo run | bunyan

.PHONY: dev/build
dev/build:
	cargo build

.PHONY: dev/website
dev/website:
	cd website
	docker compose up

.PHONY: docker/build
docker/build:
	nix build .#docker
	$(DOCKER) load < result
	rm -f result

.PHONY: docker/build/website
docker/build/website:
	nix build .#website-docker
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

.PHONY: tests
tests:
	cd tests/ && docker compose up --exit-code-from k6
	cd tests/ && docker compose down

