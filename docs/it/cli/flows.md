---
read_when:
    - Potresti trovare `openclaw flows` nella documentazione precedente o nelle note di rilascio
    - Vuoi un riferimento rapido per l'ispezione di TaskFlow
summary: 'Reindirizzamento: i comandi di flusso si trovano in `openclaw tasks flow`'
title: Flussi (reindirizzamento)
x-i18n:
    generated_at: "2026-07-12T06:53:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05d27154190d6087649612d81ce15f0cbc9459aa89ab22211582c18f4fc2943c
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

Non esiste un comando di primo livello `openclaw flows`. L'ispezione persistente di TaskFlow è disponibile in `openclaw tasks flow`.

## Sottocomandi

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| Sottocomando | Descrizione                       | Argomenti / opzioni                                                                          |
| ------------- | --------------------------------- | -------------------------------------------------------------------------------------------- |
| `list`        | Elenca i TaskFlow monitorati.     | Output leggibile dalla macchina con `--json`; filtro `--status <name>` (vedi i valori sotto). |
| `show`        | Mostra un TaskFlow.               | ID del flusso o chiave del proprietario `<lookup>`; output leggibile dalla macchina con `--json`. |
| `cancel`      | Annulla un TaskFlow in esecuzione. | ID del flusso o chiave del proprietario `<lookup>`.                                         |

`<lookup>` accetta un ID del flusso (restituito da `list` / `show`) oppure la chiave del proprietario del flusso (l'identificatore stabile utilizzato dal sottosistema proprietario per monitorare il flusso).

### Valori del filtro di stato

`--status` per `list` accetta uno dei seguenti valori: `queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`.

## Esempi

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

Per i concetti e la creazione di TaskFlow, consulta [TaskFlow](/it/automation/taskflow). Per il comando padre `tasks`, consulta il [riferimento CLI di `tasks`](/it/cli/tasks).

## Argomenti correlati

- [Riferimento CLI](/it/cli)
- [Automazione](/it/automation)
- [TaskFlow](/it/automation/taskflow)
