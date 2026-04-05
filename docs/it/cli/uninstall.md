---
read_when:
    - Vuoi rimuovere il servizio gateway e/o lo stato locale
    - Vuoi prima eseguire una simulazione
summary: Riferimento CLI per `openclaw uninstall` (rimuove il servizio gateway + i dati locali)
title: disinstalla
x-i18n:
    generated_at: "2026-04-05T13:48:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2123a4f9c7a070ef7e13c60dafc189053ef61ce189fa4f29449dd50987c1894c
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

Disinstalla il servizio gateway + i dati locali (la CLI rimane).

Opzioni:

- `--service`: rimuove il servizio gateway
- `--state`: rimuove stato e configurazione
- `--workspace`: rimuove le directory del workspace
- `--app`: rimuove l'app macOS
- `--all`: rimuove servizio, stato, workspace e app
- `--yes`: salta le richieste di conferma
- `--non-interactive`: disabilita le richieste; richiede `--yes`
- `--dry-run`: mostra le azioni senza rimuovere i file

Esempi:

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

Note:

- Esegui prima `openclaw backup create` se vuoi un'istantanea ripristinabile prima di rimuovere stato o workspace.
- `--all` è un'abbreviazione per rimuovere insieme servizio, stato, workspace e app.
- `--non-interactive` richiede `--yes`.
