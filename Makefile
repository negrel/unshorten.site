repository_root := $(shell git rev-parse --show-toplevel)
repository_root := $(or $(repository_root), $(CURDIR))
include $(repository_root)/variables.mk

.PHONY: server/%
server/%:
	$(MAKE) -C server $*

.PHONY: website/
website/%:
	$(MAKE) -C website $*

.PHONY: audit
audit: server/audit

.PHONY: lint
lint: server/lint

.PHONY: tests
tests: server/test
