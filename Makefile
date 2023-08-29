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

.PHONY: docker/build
docker/build:
	nix build .#docker
	docker load < result
	if [ "${REMOVE_RESULT:=1}" = "1" ]; then rm -f result; fi
