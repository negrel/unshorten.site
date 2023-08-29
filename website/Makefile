repository_root := $(shell git rev-parse --show-toplevel)
repository_root := $(or $(repository_root), $(CURDIR))
include $(repository_root)/variables.mk

.PHONY: dev/start
dev/start:
	nix build ..#website-devserver
	$(DOCKER) load < result
	rm -f result
	$(DOCKER) compose up

.PHONY: dev/build
dev/build:
	npm run build

