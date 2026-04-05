---
read_when:
    - Vuoi cercare nella documentazione live di OpenClaw dal terminale
summary: Riferimento CLI per `openclaw docs` (cerca nell'indice live della documentazione)
title: docs
x-i18n:
    generated_at: "2026-04-05T13:47:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfcceed872d7509b9843af3fae733a136bc5e26ded55c2ac47a16489a1636989
    source_path: cli/docs.md
    workflow: 15
---

# `openclaw docs`

Cerca nell'indice live della documentazione.

Argomenti:

- `[query...]`: termini di ricerca da inviare all'indice live della documentazione

Esempi:

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Note:

- Senza query, `openclaw docs` apre il punto di ingresso della ricerca nella documentazione live.
- Le query composte da più parole vengono inoltrate come un'unica richiesta di ricerca.
