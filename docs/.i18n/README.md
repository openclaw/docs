# OpenClaw docs i18n assets

This folder stores translation config for the source docs repo.

Generated locale pages and live locale translation memory now live in the publish repo (`openclaw/docs`, local sibling checkout `~/Projects/openclaw-docs`).

## Files

- `glossary.<lang>.json` — preferred term mappings (used in prompt guidance).
- `<lang>.tm.jsonl` — translation memory (cache) keyed by workflow + model + text hash. In this repo, locale TM files are generated on demand.

## Glossary format

`glossary.<lang>.json` is an array of entries:

```json
{
  "source": "troubleshooting",
  "target": "故障排除",
  "ignore_case": true,
  "whole_word": false
}
```

Fields:

- `source`: English (or source) phrase to prefer.
- `target`: preferred translation output.

## Notes

- Glossary entries are passed to the model as **prompt guidance** (no deterministic rewrites).
- `scripts/docs-i18n` still owns translation generation.
- The source repo syncs English docs into the publish repo; `translate-all.yml` debounces locale generation and commits one aggregate refresh.
- See `translation-workflow.md` for the intended debounced fan-in workflow.
