---
read_when:
    - Vuoi cancellare lo stato locale mantenendo installata la CLI
    - Vuoi una simulazione di ciò che verrebbe rimosso
summary: Riferimento CLI per `openclaw reset` (reimpostare stato/configurazione locali)
title: Reimposta
x-i18n:
    generated_at: "2026-04-24T08:34:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4a4aba32fb44905d079bf2a22e582a3affbe9809eac9af237ce3e48da72b42c
    source_path: cli/reset.md
    workflow: 15
---

# `openclaw reset`

Reimposta configurazione/stato locali (mantiene installata la CLI).

Opzioni:

- `--scope <scope>`: `config`, `config+creds+sessions` oppure `full`
- `--yes`: salta le richieste di conferma
- `--non-interactive`: disabilita i prompt; richiede `--scope` e `--yes`
- `--dry-run`: stampa le azioni senza rimuovere i file

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

- Esegui prima `openclaw backup create` se vuoi uno snapshot ripristinabile prima di rimuovere lo stato locale.
- Se ometti `--scope`, `openclaw reset` usa un prompt interattivo per scegliere cosa rimuovere.
- `--non-interactive` è valido solo quando sono impostati sia `--scope` sia `--yes`.

## Correlati

- [Riferimento CLI](/it/cli)
