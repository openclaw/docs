---
read_when:
    - Vuoi cercare nella documentazione live di OpenClaw dal terminale
summary: Riferimento CLI per `openclaw docs` (cercare nell'indice live della documentazione)
title: Documentazione
x-i18n:
    generated_at: "2026-04-24T08:33:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d208f5b9a3576ce0597abca600df109db054d20068359a9f2070ac30b1a8f69
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
- Le query composte da più parole vengono passate come un'unica richiesta di ricerca.

## Correlati

- [Riferimento CLI](/it/cli)
