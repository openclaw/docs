---
read_when:
    - Vuoi cancellare lo stato locale mantenendo la CLI installata
    - Vuoi una simulazione di ciò che verrebbe rimosso
summary: Riferimento CLI per `openclaw reset` (reimpostare stato/configurazione locale)
title: reset
x-i18n:
    generated_at: "2026-04-05T13:48:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad464700f948bebe741ec309f25150714f0b280834084d4f531327418a42c79b
    source_path: cli/reset.md
    workflow: 15
---

# `openclaw reset`

Reimposta configurazione/stato locale (mantiene la CLI installata).

Opzioni:

- `--scope <scope>`: `config`, `config+creds+sessions` oppure `full`
- `--yes`: salta i prompt di conferma
- `--non-interactive`: disabilita i prompt; richiede `--scope` e `--yes`
- `--dry-run`: stampa le azioni senza rimuovere file

Esempi:

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

Note:

- Esegui prima `openclaw backup create` se vuoi un'istantanea ripristinabile prima di rimuovere lo stato locale.
- Se ometti `--scope`, `openclaw reset` usa un prompt interattivo per scegliere cosa rimuovere.
- `--non-interactive` è valido solo quando sono impostati sia `--scope` sia `--yes`.
