---
read_when:
    - Vuoi capire come TaskFlow si relaziona alle attività in background
    - Incontri TaskFlow o il flusso delle attività di openclaw nelle note di rilascio o nella documentazione
    - Vuoi ispezionare o gestire lo stato persistente del flusso
summary: Livello di orchestrazione dei flussi Task Flow sopra le attività in background
title: TaskFlow
x-i18n:
    generated_at: "2026-04-24T08:29:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90286fb783db5417ab5e781377a85be76cd3f9e9b32da57558c2d8f02b813dba
    source_path: automation/taskflow.md
    workflow: 15
---

TaskFlow è il substrato di orchestrazione dei flussi che si colloca sopra le [attività in background](/it/automation/tasks). Gestisce flussi durevoli in più passaggi con stato proprio, tracciamento delle revisioni e semantica di sincronizzazione, mentre le singole attività restano l'unità di lavoro scollegato.

## Quando usare TaskFlow

Usa TaskFlow quando il lavoro si estende su più passaggi sequenziali o ramificati e hai bisogno di un tracciamento durevole dell'avanzamento attraverso i riavvii del Gateway. Per singole operazioni in background, è sufficiente una semplice [attività](/it/automation/tasks).

| Scenario                              | Uso                  |
| ------------------------------------- | -------------------- |
| Singolo processo in background        | Semplice attività    |
| Pipeline in più passaggi (A poi B poi C) | TaskFlow (gestito)   |
| Osservare attività create esternamente | TaskFlow (replicato) |
| Promemoria monouso                    | Processo Cron        |

## Modalità di sincronizzazione

### Modalità gestita

TaskFlow possiede l'intero ciclo di vita end-to-end. Crea attività come passaggi del flusso, le porta al completamento e fa avanzare automaticamente lo stato del flusso.

Esempio: un flusso di report settimanale che (1) raccoglie i dati, (2) genera il report e (3) lo consegna. TaskFlow crea ogni passaggio come attività in background, attende il completamento, quindi passa al passaggio successivo.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Modalità replicata

TaskFlow osserva le attività create esternamente e mantiene sincronizzato lo stato del flusso senza assumere il controllo della creazione delle attività. Questo è utile quando le attività provengono da processi cron, comandi CLI o altre fonti e vuoi una vista unificata del loro avanzamento come flusso.

Esempio: tre processi cron indipendenti che insieme formano una routine di "operazioni del mattino". Un flusso replicato tiene traccia del loro avanzamento complessivo senza controllare quando o come vengono eseguiti.

## Stato durevole e tracciamento delle revisioni

Ogni flusso persiste il proprio stato e tiene traccia delle revisioni, così l'avanzamento sopravvive ai riavvii del Gateway. Il tracciamento delle revisioni consente il rilevamento dei conflitti quando più fonti tentano di far avanzare contemporaneamente lo stesso flusso.

## Comportamento di annullamento

`openclaw tasks flow cancel` imposta un intento di annullamento persistente sul flusso. Le attività attive all'interno del flusso vengono annullate e non vengono avviati nuovi passaggi. L'intento di annullamento persiste attraverso i riavvii, quindi un flusso annullato resta annullato anche se il Gateway si riavvia prima che tutte le attività figlie siano terminate.

## Comandi CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Command                           | Description                                   |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list`        | Mostra i flussi tracciati con stato e modalità di sincronizzazione |
| `openclaw tasks flow show <id>`   | Ispeziona un flusso tramite ID del flusso o chiave di ricerca |
| `openclaw tasks flow cancel <id>` | Annulla un flusso in esecuzione e le sue attività attive |

## Come i flussi si relazionano alle attività

I flussi coordinano le attività, non le sostituiscono. Un singolo flusso può gestire più attività in background nel corso del suo ciclo di vita. Usa `openclaw tasks` per ispezionare i singoli record delle attività e `openclaw tasks flow` per ispezionare il flusso di orchestrazione.

## Correlati

- [Attività in background](/it/automation/tasks) — il registro del lavoro scollegato che i flussi coordinano
- [CLI: tasks](/it/cli/tasks) — riferimento ai comandi CLI per `openclaw tasks flow`
- [Panoramica dell'automazione](/it/automation) — tutti i meccanismi di automazione a colpo d'occhio
- [Processi Cron](/it/automation/cron-jobs) — processi pianificati che possono alimentare i flussi
