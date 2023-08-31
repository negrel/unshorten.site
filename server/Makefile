repository_root := $(shell git rev-parse --show-toplevel)
repository_root := $(or $(repository_root), $(CURDIR))
include $(repository_root)/variables.mk

UNSHORTEN_ADMIN_LOGIN ?= "admin"
UNSHORTEN_ADMIN_PASSWORD ?= "admin"
UNSHORTEN_TLS_KEY_FILEPATH ?= "certs/key.pem"
UNSHORTEN_TLS_CERT_FILEPATH ?= "certs/cert.pem"

.PHONY: dev/start
dev/start:
	test -f certs/env.sh && source certs/env.sh; UNSHORTEN_ADMIN_LOGIN=$(UNSHORTEN_ADMIN_LOGIN) UNSHORTEN_ADMIN_PASSWORD=$(UNSHORTEN_ADMIN_PASSWORD) \
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
test: certs
	cd tests/ && docker compose up --force-recreate --exit-code-from k6
	cd tests/ && docker compose down

certs:
	mkdir -p certs
	mkcert -key-file certs/key.pem -cert-file certs/cert.pem 127.0.0.1 localhost unshorten-site
	echo "export UNSHORTEN_TLS_KEY_FILEPATH=certs/key.pem" > certs/env.sh
	echo "export UNSHORTEN_TLS_CERT_FILEPATH=certs/cert.pem" >> certs/env.sh

