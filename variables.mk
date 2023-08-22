current_dir := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))

export DOCKER ?= docker

