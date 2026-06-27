---
read_when:
    - Vuoi rimuovere il servizio gateway e/o lo stato locale
    - Vuoi prima un'esecuzione di prova
summary: Riferimento CLI per `openclaw uninstall` (rimuovi il servizio Gateway + i dati locali)
title: Disinstallazione
x-i18n:
    generated_at: "2026-06-27T17:22:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f90fa8cf513e2e8cd422c3b8a880e7fd20fb71131a3ec88260e765daa2ace543
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Disinstalla il servizio Gateway + i dati locali (la CLI rimane).

Opzioni:

- `--service`: rimuove il servizio Gateway
- `--state`: rimuove stato e configurazione
- `--workspace`: rimuove le directory di workspace
- `--app`: rimuove l'app macOS
- `--all`: rimuove servizio, stato, workspace e app
- `--yes`: salta le richieste di conferma
- `--non-interactive`: disabilita le richieste; richiede `--yes`
- `--dry-run`: stampa le azioni senza rimuovere file

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

- Esegui prima `openclaw backup create` se vuoi uno snapshot ripristinabile prima di rimuovere stato o workspace.
- `--state` preserva le directory di workspace configurate, a meno che non sia selezionato anche `--workspace`.
- `--all` è un'abbreviazione per rimuovere insieme servizio, stato, workspace e app.
- `--non-interactive` richiede `--yes`.

## Correlati

- [Riferimento CLI](/it/cli)
- [Disinstallazione](/it/install/uninstall)
