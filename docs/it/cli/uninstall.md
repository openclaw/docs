---
read_when:
    - Vuoi rimuovere il servizio Gateway e/o lo stato locale
    - Vuoi prima una prova a secco
summary: Riferimento CLI per `openclaw uninstall` (rimuovi il servizio Gateway e i dati locali)
title: Disinstalla
x-i18n:
    generated_at: "2026-04-24T08:35:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: b774fc006e989068b9126aff2a72888fd808a2e0e3d5ea8b57e6ab9d9f1b63ee
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

Disinstalla il servizio Gateway + i dati locali (la CLI resta).

Opzioni:

- `--service`: rimuove il servizio Gateway
- `--state`: rimuove stato e configurazione
- `--workspace`: rimuove le directory dello spazio di lavoro
- `--app`: rimuove l'app macOS
- `--all`: rimuove servizio, stato, spazio di lavoro e app
- `--yes`: salta i prompt di conferma
- `--non-interactive`: disattiva i prompt; richiede `--yes`
- `--dry-run`: stampa le azioni senza rimuovere i file

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

- Esegui prima `openclaw backup create` se vuoi un'istantanea ripristinabile prima di rimuovere stato o spazi di lavoro.
- `--all` è l'abbreviazione per rimuovere insieme servizio, stato, spazio di lavoro e app.
- `--non-interactive` richiede `--yes`.

## Correlati

- [Riferimento CLI](/it/cli)
- [Disinstallazione](/it/install/uninstall)
