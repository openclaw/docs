---
read_when:
    - Vuoi capire come Task Flow si relaziona alle attività in background
    - Incontri Task Flow o il flusso di attività di openclaw nelle note di rilascio o nella documentazione
    - Vuoi ispezionare o gestire lo stato persistente del flusso
summary: Livello di orchestrazione dei flussi Task Flow al di sopra delle attività in background
title: Flusso di attività
x-i18n:
    generated_at: "2026-04-23T08:23:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: f94a3cda89db5bfcc6c396358bc3fcee40f9313e102dc697d985f40707381468
    source_path: automation/taskflow.md
    workflow: 15
---

# Flusso di attività

Il Flusso di attività è il substrato di orchestrazione dei flussi che si colloca al di sopra delle [attività in background](/it/automation/tasks). Gestisce flussi persistenti a più passaggi con stato proprio, tracciamento delle revisioni e semantica di sincronizzazione, mentre le singole attività rimangono l'unità di lavoro scollegato.

## Quando usare il Flusso di attività

Usa il Flusso di attività quando il lavoro copre più passaggi sequenziali o ramificati e hai bisogno di un tracciamento persistente dell'avanzamento attraverso i riavvii del Gateway. Per singole operazioni in background, è sufficiente una semplice [attività](/it/automation/tasks).

| Scenario                              | Uso                      |
| ------------------------------------- | ------------------------ |
| Singolo processo in background        | Attività semplice        |
| Pipeline a più passaggi (A poi B poi C) | Flusso di attività (gestito) |
| Osservare attività create esternamente | Flusso di attività (rispecchiato) |
| Promemoria una tantum                 | Processo Cron            |

## Modalità di sincronizzazione

### Modalità gestita

Il Flusso di attività possiede il ciclo di vita end-to-end. Crea attività come passaggi del flusso, le porta al completamento e fa avanzare automaticamente lo stato del flusso.

Esempio: un flusso di report settimanale che (1) raccoglie i dati, (2) genera il report e (3) lo consegna. Il Flusso di attività crea ogni passaggio come attività in background, attende il completamento, quindi passa al passaggio successivo.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Modalità rispecchiata

Il Flusso di attività osserva attività create esternamente e mantiene sincronizzato lo stato del flusso senza assumere la responsabilità della creazione delle attività. Questo è utile quando le attività hanno origine da processi Cron, comandi CLI o altre fonti e vuoi una vista unificata del loro avanzamento come flusso.

Esempio: tre processi Cron indipendenti che insieme formano una routine di "operazioni mattutine". Un flusso rispecchiato tiene traccia del loro avanzamento complessivo senza controllare quando o come vengono eseguiti.

## Stato persistente e tracciamento delle revisioni

Ogni flusso persiste il proprio stato e tiene traccia delle revisioni in modo che l'avanzamento sopravviva ai riavvii del Gateway. Il tracciamento delle revisioni consente il rilevamento dei conflitti quando più fonti tentano di far avanzare contemporaneamente lo stesso flusso.

## Comportamento di annullamento

`openclaw tasks flow cancel` imposta un intento di annullamento persistente sul flusso. Le attività attive all'interno del flusso vengono annullate e non vengono avviati nuovi passaggi. L'intento di annullamento persiste attraverso i riavvii, quindi un flusso annullato rimane annullato anche se il Gateway si riavvia prima che tutte le attività figlie siano terminate.

## Comandi CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Comando                           | Descrizione                                       |
| --------------------------------- | ------------------------------------------------- |
| `openclaw tasks flow list`        | Mostra i flussi tracciati con stato e modalità di sincronizzazione |
| `openclaw tasks flow show <id>`   | Ispeziona un flusso per id del flusso o chiave di ricerca     |
| `openclaw tasks flow cancel <id>` | Annulla un flusso in esecuzione e le sue attività attive    |

## Come i flussi si relazionano alle attività

I flussi coordinano le attività, non le sostituiscono. Un singolo flusso può gestire più attività in background nel corso della sua esistenza. Usa `openclaw tasks` per ispezionare i singoli record delle attività e `openclaw tasks flow` per ispezionare il flusso di orchestrazione.

## Correlati

- [Attività in background](/it/automation/tasks) — il registro del lavoro scollegato che i flussi coordinano
- [CLI: tasks](/it/cli/tasks) — riferimento dei comandi CLI per `openclaw tasks flow`
- [Panoramica dell'automazione](/it/automation) — tutti i meccanismi di automazione in un colpo d'occhio
- [Processi Cron](/it/automation/cron-jobs) — processi pianificati che possono alimentare i flussi
