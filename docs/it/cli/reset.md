---
read_when:
    - Vuoi cancellare lo stato locale mantenendo installata la CLI
    - Vuoi una simulazione di ciò che verrebbe rimosso
summary: Riferimento della CLI per `openclaw reset` (reimposta stato/configurazione locale)
title: Reimposta
x-i18n:
    generated_at: "2026-07-12T06:58:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f18af9c5e187217de4c02f4b55de9a1c94f7246b74056dc660aa172168edcef9
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

Reimposta la configurazione e lo stato locali (mantiene installata la CLI).

```bash
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

## Opzioni

- `--scope <scope>`: `config`, `config+creds+sessions` o `full`
- `--yes`: ignora le richieste di conferma
- `--non-interactive`: disabilita le richieste; richiede `--scope` e `--yes`
- `--dry-run`: mostra le azioni senza rimuovere i file

## Ambiti

| Ambito                  | Rimuove                                                                                                                 | Arresta prima il Gateway |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `config`                | solo il file di configurazione                                                                                          | no                       |
| `config+creds+sessions` | file di configurazione, directory OAuth/delle credenziali, directory delle sessioni per agente                          | sì                       |
| `full`                  | directory dello stato (incluse configurazione e credenziali, se annidate al suo interno), directory dello spazio di lavoro e relative attestazioni | sì                       |

`config+creds+sessions` e `full` arrestano un servizio Gateway gestito in esecuzione prima di eliminare lo stato.

## Note

- Esegui prima `openclaw backup create` per creare un'istantanea ripristinabile prima di rimuovere lo stato locale.
- Senza `--scope`, `openclaw reset` richiede interattivamente l'ambito da rimuovere.
- `--non-interactive` è valido solo quando sono impostati sia `--scope` sia `--yes`.
- Al termine, `config+creds+sessions` e `full` mostrano `Next: openclaw onboard --install-daemon`.

## Argomenti correlati

- [Riferimento della CLI](/it/cli)
