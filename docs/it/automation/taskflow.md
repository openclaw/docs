---
read_when:
    - Vuoi capire come Task Flow si relaziona alle attività in background
    - Incontri Task Flow o openclaw tasks flow nelle note di rilascio o nella documentazione
    - Vuoi ispezionare o gestire uno stato di flusso durevole
summary: Livello di orchestrazione dei flussi Task Flow sopra le attività in background
title: Task Flow
x-i18n:
    generated_at: "2026-04-05T13:41:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 172871206b839845db807d9c627015890f7733b862e276853d5dbfbe29e03883
    source_path: automation/taskflow.md
    workflow: 15
---

# Task Flow

Task Flow è il substrato di orchestrazione dei flussi che si colloca sopra le [attività in background](/automation/tasks). Gestisce flussi durevoli a più fasi con un proprio stato, tracciamento delle revisioni e semantica di sincronizzazione, mentre le singole attività restano l'unità di lavoro scollegato.

## Quando usare Task Flow

Usa Task Flow quando il lavoro si estende su più passaggi sequenziali o ramificati e hai bisogno di un tracciamento durevole dell'avanzamento attraverso i riavvii del gateway. Per singole operazioni in background, è sufficiente una semplice [attività](/automation/tasks).

| Scenario                              | Uso                  |
| ------------------------------------- | -------------------- |
| Singolo processo in background        | Attività semplice    |
| Pipeline a più fasi (A poi B poi C)   | Task Flow (gestito)  |
| Osservare attività create esternamente| Task Flow (rispecchiato) |
| Promemoria una tantum                 | Cron job             |

## Modalità di sincronizzazione

### Modalità gestita

Task Flow possiede l'intero ciclo di vita end-to-end. Crea attività come passaggi del flusso, le porta a completamento e fa avanzare automaticamente lo stato del flusso.

Esempio: un flusso di report settimanale che (1) raccoglie i dati, (2) genera il report e (3) lo consegna. Task Flow crea ogni passaggio come attività in background, attende il completamento e poi passa al passaggio successivo.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Modalità rispecchiata

Task Flow osserva attività create esternamente e mantiene sincronizzato lo stato del flusso senza assumere il controllo della creazione delle attività. Questo è utile quando le attività hanno origine da cron job, comandi CLI o altre fonti e vuoi una vista unificata del loro avanzamento come flusso.

Esempio: tre cron job indipendenti che insieme formano una routine "operazioni del mattino". Un flusso rispecchiato tiene traccia del loro avanzamento complessivo senza controllare quando o come vengono eseguiti.

## Stato durevole e tracciamento delle revisioni

Ogni flusso rende persistente il proprio stato e tiene traccia delle revisioni in modo che l'avanzamento sopravviva ai riavvii del gateway. Il tracciamento delle revisioni consente il rilevamento dei conflitti quando più fonti tentano di far avanzare contemporaneamente lo stesso flusso.

## Comportamento di annullamento

`openclaw tasks flow cancel` imposta un'intenzione di annullamento persistente sul flusso. Le attività attive all'interno del flusso vengono annullate e non vengono avviati nuovi passaggi. L'intenzione di annullamento persiste attraverso i riavvii, quindi un flusso annullato resta annullato anche se il gateway si riavvia prima che tutte le attività figlie siano terminate.

## Comandi CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Command                           | Descrizione                                       |
| --------------------------------- | ------------------------------------------------- |
| `openclaw tasks flow list`        | Mostra i flussi tracciati con stato e modalità di sincronizzazione |
| `openclaw tasks flow show <id>`   | Ispeziona un flusso per ID del flusso o chiave di ricerca |
| `openclaw tasks flow cancel <id>` | Annulla un flusso in esecuzione e le sue attività attive |

## Come i flussi si relazionano alle attività

I flussi coordinano le attività, non le sostituiscono. Un singolo flusso può gestire più attività in background nel corso del suo ciclo di vita. Usa `openclaw tasks` per ispezionare i singoli record delle attività e `openclaw tasks flow` per ispezionare il flusso di orchestrazione.

## Correlati

- [Attività in background](/automation/tasks) — il registro del lavoro scollegato che i flussi coordinano
- [CLI: tasks](/cli/index#tasks) — riferimento ai comandi CLI per `openclaw tasks flow`
- [Panoramica dell'automazione](/automation) — tutti i meccanismi di automazione a colpo d'occhio
- [Cron Jobs](/automation/cron-jobs) — lavori pianificati che possono alimentare i flussi
