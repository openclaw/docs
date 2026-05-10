---
read_when:
    - Puoi incontrare `openclaw flows` nella documentazione meno recente o nelle note di rilascio
    - Vuoi un riferimento rapido per l'ispezione di TaskFlow
summary: 'Reindirizzamento: i comandi di flusso si trovano sotto `openclaw tasks flow`'
title: Flussi (reindirizzamento)
x-i18n:
    generated_at: "2026-05-10T19:28:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: b41e8a911cfbba32f3a1af059df34f73443ea7649bce46a5926cdf26c8399c12
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

Non esiste un comando di primo livello `openclaw flows`. L'ispezione persistente di TaskFlow si trova in `openclaw tasks flow`.

## Sottocomandi

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| Sottocomando | Descrizione                | Argomenti / opzioni                                                                   |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `list`     | Elenca i TaskFlow monitorati.    | Output leggibile dalla macchina con `--json`; filtro `--status <name>` (vedi i valori di stato sotto). |
| `show`     | Mostra un TaskFlow.         | `<lookup>` id del flusso o chiave del proprietario; output leggibile dalla macchina con `--json`.                    |
| `cancel`   | Annulla un TaskFlow in esecuzione. | `<lookup>` id del flusso o chiave del proprietario.                                                      |

`<lookup>` accetta un id del flusso (restituito da `list` / `show`) oppure la chiave del proprietario del flusso (l'identificatore stabile usato dal sottosistema proprietario per tracciare il flusso).

### Valori del filtro di stato

`--status` su `list` accetta uno dei seguenti:

`queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`

## Esempi

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

Per i concetti completi di TaskFlow e la creazione, vedi [TaskFlow](/it/automation/taskflow). Per il comando padre `tasks`, vedi [riferimento CLI di tasks](/it/cli/tasks).

## Correlati

- [Riferimento CLI](/it/cli)
- [Automazione](/it/automation)
- [TaskFlow](/it/automation/taskflow)
