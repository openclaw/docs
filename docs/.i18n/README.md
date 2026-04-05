# OpenClaw docs i18n assets

This folder stores translation config plus generated zh-CN artifacts for the publish repo.

English docs are mirrored from the source repo (`openclaw/openclaw`). zh-CN pages and zh-CN translation memory are generated here.

## Files

- `glossary.<lang>.json` — preferred term mappings (used in prompt guidance).
- `<lang>.tm.jsonl` — translation memory (cache) keyed by workflow + model + text hash.

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
- The translation memory is updated by `scripts/docs-i18n`.
- Source metadata for each sync lives under `.openclaw-sync/source.json`.
