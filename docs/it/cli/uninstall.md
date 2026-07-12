---
read_when:
    - Vuoi rimuovere il servizio Gateway e/o lo stato locale
    - Vuoi prima un'esecuzione di prova
summary: Riferimento della CLI per `openclaw uninstall` (rimuove il servizio Gateway e i dati locali)
title: Disinstallazione
x-i18n:
    generated_at: "2026-07-12T06:58:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1e2e3996cf6d5c0fd11e5054c8fe60f7f8d25047193bb13944ca170bf77b581a
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

Disinstalla il servizio Gateway e/o i dati locali. La CLI stessa non viene
rimossa; disinstallala separatamente tramite npm/pnpm.

## Opzioni

| Flag                | Valore predefinito | Descrizione                                                   |
| ------------------- | ------------------ | ------------------------------------------------------------- |
| `--service`         | `false`            | Rimuove il servizio Gateway.                                  |
| `--state`           | `false`            | Rimuove lo stato e la configurazione.                          |
| `--workspace`       | `false`            | Rimuove le directory degli spazi di lavoro.                    |
| `--app`             | `false`            | Rimuove l'app per macOS.                                      |
| `--all`             | `false`            | Abbreviazione di `--service --state --workspace --app`.        |
| `--yes`             | `false`            | Ignora le richieste di conferma.                               |
| `--non-interactive` | `false`            | Disabilita le richieste interattive; richiede `--yes`.         |
| `--dry-run`         | `false`            | Mostra le azioni pianificate senza rimuovere alcun file.       |

Se non viene specificato alcun flag di ambito, una selezione multipla interattiva
richiede quali componenti rimuovere (per impostazione predefinita sono preselezionati
servizio, stato e spazio di lavoro).

## Esempi

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

## Note

- Esegui prima `openclaw backup create` per creare un'istantanea ripristinabile
  prima di rimuovere lo stato o gli spazi di lavoro.
- `--state` mantiene le directory degli spazi di lavoro configurate, a meno che
  non venga selezionato anche `--workspace`.

## Contenuti correlati

- [Riferimento della CLI](/it/cli)
- [Disinstallazione](/it/install/uninstall)
