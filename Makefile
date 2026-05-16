SHELL := /bin/bash

DOCS_HOST ?= 127.0.0.1
DOCS_PORT ?= 4173
DOCS_URL := http://$(DOCS_HOST):$(DOCS_PORT)

.PHONY: docs-build docs-smoke docs-check docs-serve docs-elements docs-elements-open docs-health

docs-build:
	npm run docs:build:r2

docs-smoke:
	npm run docs:smoke

docs-check: docs-build docs-smoke

docs-serve:
	python3 -m http.server $(DOCS_PORT) --bind $(DOCS_HOST) -d dist/docs-site

docs-elements: docs-check
	@printf 'Hidden elements fixture: %s/__elements\n' "$(DOCS_URL)"
	@printf 'Run `make docs-serve` in another shell, then open that URL.\n'

docs-elements-open:
	open "$(DOCS_URL)/__elements"

docs-health:
	gh run list --repo openclaw/docs --branch main --limit 8 --json databaseId,workflowName,headSha,status,conclusion,url \
		--jq '.[] | [.databaseId,.workflowName,.headSha[0:8],.status,(.conclusion // ""),.url] | @tsv'
