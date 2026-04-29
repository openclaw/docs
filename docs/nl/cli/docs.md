---
read_when:
    - Je wilt de live OpenClaw-documentatie vanuit de terminal doorzoeken
summary: CLI-referentie voor `openclaw docs` (doorzoek de live documentatie-index)
title: Documentatie
x-i18n:
    generated_at: "2026-04-29T22:32:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d208f5b9a3576ce0597abca600df109db054d20068359a9f2070ac30b1a8f69
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Doorzoek de live documentatie-index.

Argumenten:

- `[query...]`: zoektermen om naar de live documentatie-index te sturen

Voorbeelden:

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Opmerkingen:

- Zonder query opent `openclaw docs` het zoekingangspunt van de live documentatie.
- Zoekopdrachten met meerdere woorden worden als één zoekverzoek doorgegeven.

## Gerelateerd

- [CLI-referentie](/nl/cli)
