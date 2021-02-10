CURRENT_DIR = ${CURDIR}
PACKAGE_BIN = node_modules/.bin
SRC_DIR = $(CURRENT_DIR)/src
DIST_DIR = $(CURRENT_DIR)/build
DATE_STR := $(shell date "+%Y%m%d_%H%M%S")
OUTPUT_FILE = $(CURRENT_DIR)/edm-templates

default: help

clean: ## cleanup uneeded folders
	cd ${CURRENT_DIR}; rm -Rfv node_modules ${DIST_DIR} ${OUTPUT_FILE}*;

node_modules:
	cd ${CURRENT_DIR}; npm install;
install: node_modules ## install dev dependencies
setup: install

build: setup ## Build all the EDM
	cd ${CURRENT_DIR}; $(PACKAGE_BIN)/grunt default
	cd ${CURRENT_DIR}; zip -r ${OUTPUT_FILE}_${DATE_STR}.zip ${DIST_DIR} -x *.DS_Store;

scan: ## Scan template for placeholder
	cd ${CURRENT_DIR}; $(PACKAGE_BIN)/grunt shell:scan

help: ## Display a list of commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
