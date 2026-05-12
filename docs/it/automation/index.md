---
doc-schema-version: 1
read_when:
    - Decidere come automatizzare il lavoro con OpenClaw
    - Scegliere tra Heartbeat, Cron, impegni, agganci e istruzioni permanenti
    - Cercare il punto di ingresso corretto per l'automazione
summary: 'Panoramica dei meccanismi di automazione: attività, Cron, agganci, ordini permanenti e flusso di attività'
title: Automazione
x-i18n:
    generated_at: "2026-05-12T00:56:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: c75e7604ca27feddacf48166ca2813ac63336559c115cabe0740fb5d57e93a06
    source_path: automation/index.md
    workflow: 16
---

OpenClaw esegue lavoro in background tramite attività, job pianificati, impegni
inferiti, hook di evento e istruzioni permanenti. Questa pagina ti aiuta a
scegliere il meccanismo giusto e a capire come si integrano tra loro.

## Guida rapida alla scelta

```mermaid
flowchart TD
    START([What do you need?]) --> Q1{Schedule work?}
    START --> Q2{Track detached work?}
    START --> Q3{Orchestrate multi-step flows?}
    START --> Q4{React to lifecycle events?}
    START --> Q5{Give the agent persistent instructions?}
    START --> Q6{Remember a natural follow-up?}

    Q1 -->|Yes| Q1a{Exact timing or flexible?}
    Q1a -->|Exact| CRON["Scheduled Tasks (Cron)"]
    Q1a -->|Flexible| HEARTBEAT[Heartbeat]

    Q2 -->|Yes| TASKS[Background Tasks]
    Q3 -->|Yes| FLOW[Task Flow]
    Q4 -->|Yes| HOOKS[Hooks]
    Q5 -->|Yes| SO[Standing Orders]
    Q6 -->|Yes| COMMITMENTS[Inferred Commitments]
```

| Caso d'uso                                      | Consigliato                       | Perché                                                |
| ----------------------------------------------- | --------------------------------- | ----------------------------------------------------- |
| Inviare un report giornaliero alle 9 precise    | Attività pianificate (Cron)       | Tempistica esatta, esecuzione isolata                 |
| Ricordami tra 20 minuti                         | Attività pianificate (Cron)       | Singola esecuzione con tempistica precisa (`--at`)    |
| Eseguire un'analisi approfondita settimanale    | Attività pianificate (Cron)       | Attività autonoma, può usare un modello diverso       |
| Controllare la posta ogni 30 min                | Heartbeat                         | Raggruppa con altri controlli, consapevole del contesto |
| Monitorare il calendario per eventi imminenti   | Heartbeat                         | Adattamento naturale alla consapevolezza periodica    |
| Ricontrollare dopo un colloquio menzionato      | Impegni inferiti                  | Follow-up simile a una memoria, nessuna richiesta di promemoria esatto |
| Check-in delicato di cura dopo il contesto utente | Impegni inferiti                | Limitato allo stesso agente e canale                  |
| Ispezionare lo stato di un subagente o di un'esecuzione ACP | Attività in background | Il registro delle attività traccia tutto il lavoro distaccato |
| Verificare cosa è stato eseguito e quando       | Attività in background            | `openclaw tasks list` e `openclaw tasks audit`        |
| Ricerca in più passaggi e poi riepilogo         | Task Flow                         | Orchestrazione durevole con tracciamento delle revisioni |
| Eseguire uno script al reset della sessione     | Hook                              | Guidato da eventi, si attiva sugli eventi del ciclo di vita |
| Eseguire codice a ogni chiamata di tool         | Hook dei Plugin                   | Gli hook in-process possono intercettare le chiamate di tool |
| Controllare sempre la conformità prima di rispondere | Ordini permanenti            | Inseriti automaticamente in ogni sessione             |

### Attività pianificate (Cron) e Heartbeat

| Dimensione        | Attività pianificate (Cron)         | Heartbeat                              |
| ----------------- | ----------------------------------- | -------------------------------------- |
| Tempistica        | Esatta (espressioni cron, singola esecuzione) | Approssimativa (predefinita ogni 30 min) |
| Contesto sessione | Nuovo (isolato) o condiviso         | Contesto completo della sessione principale |
| Record attività   | Creati sempre                       | Mai creati                             |
| Consegna          | Canale, webhook o silenziosa        | In linea nella sessione principale     |
| Ideale per        | Report, promemoria, job in background | Controlli posta, calendario, notifiche |

Usa le attività pianificate (Cron) quando ti serve una tempistica precisa o un'esecuzione isolata. Usa Heartbeat quando il lavoro trae vantaggio dal contesto completo della sessione e una tempistica approssimativa è accettabile.

## Concetti principali

### Attività pianificate (cron)

Cron è lo scheduler integrato del Gateway per tempistiche precise. Conserva i job, risveglia l'agente al momento giusto e può consegnare l'output a un canale chat o a un endpoint webhook. Supporta promemoria a singola esecuzione, espressioni ricorrenti e trigger webhook in ingresso.

Vedi [Attività pianificate](/it/automation/cron-jobs).

### Attività

Il registro delle attività in background traccia tutto il lavoro distaccato: esecuzioni ACP, avvii di subagenti, esecuzioni cron isolate e operazioni CLI. Le attività sono record, non scheduler. Usa `openclaw tasks list` e `openclaw tasks audit` per ispezionarle.

Vedi [Attività in background](/it/automation/tasks).

### Impegni inferiti

Gli impegni sono memorie di follow-up facoltative e di breve durata. OpenClaw li inferisce
dalle conversazioni normali, li limita allo stesso agente e canale e
consegna i check-in dovuti tramite Heartbeat. I promemoria esatti richiesti dall'utente
appartengono comunque a Cron.

Vedi [Impegni inferiti](/it/concepts/commitments).

### Task Flow

Task Flow è il substrato di orchestrazione dei flussi sopra le attività in background. Gestisce flussi durevoli in più passaggi con modalità di sincronizzazione gestite e mirror, tracciamento delle revisioni e `openclaw tasks flow list|show|cancel` per l'ispezione.

Vedi [Task Flow](/it/automation/taskflow).

### Ordini permanenti

Gli ordini permanenti concedono all'agente autorità operativa permanente per programmi definiti. Vivono nei file dell'area di lavoro (di solito `AGENTS.md`) e vengono inseriti in ogni sessione. Combinali con Cron per l'applicazione basata sul tempo.

Vedi [Ordini permanenti](/it/automation/standing-orders).

### Hook

Gli hook interni sono script guidati da eventi attivati dagli eventi del ciclo di vita dell'agente
(`/new`, `/reset`, `/stop`), dalla Compaction della sessione, dall'avvio del Gateway e dal flusso
dei messaggi. Vengono scoperti automaticamente dalle directory e possono essere gestiti
con `openclaw hooks`. Per l'intercettazione in-process delle chiamate di tool, usa
[hook dei Plugin](/it/plugins/hooks).

Vedi [Hook](/it/automation/hooks).

### Heartbeat

Heartbeat è un turno periodico della sessione principale (predefinito ogni 30 minuti). Raggruppa più controlli (posta, calendario, notifiche) in un unico turno dell'agente con il contesto completo della sessione. I turni Heartbeat non creano record attività e non estendono la freschezza del reset di sessione giornaliero/inattivo. Usa `HEARTBEAT.md` per una piccola checklist, oppure un blocco `tasks:` quando vuoi controlli periodici solo alla scadenza all'interno di Heartbeat stesso. I file Heartbeat vuoti vengono saltati come `empty-heartbeat-file`; la modalità attività solo alla scadenza viene saltata come `no-tasks-due`. Gli Heartbeat vengono rinviati mentre lavoro Cron è attivo o in coda, e `heartbeat.skipWhenBusy` può rinviarli anche mentre corsie di subagenti o nidificate sono occupate.

Vedi [Heartbeat](/it/gateway/heartbeat).

## Come funzionano insieme

- **Cron** gestisce pianificazioni precise (report giornalieri, revisioni settimanali) e promemoria a singola esecuzione. Tutte le esecuzioni Cron creano record attività.
- **Heartbeat** gestisce il monitoraggio di routine (posta, calendario, notifiche) in un unico turno raggruppato ogni 30 minuti.
- **Hook** reagiscono a eventi specifici (reset di sessione, Compaction, flusso messaggi) con script personalizzati. Gli hook dei Plugin coprono le chiamate di tool.
- **Ordini permanenti** danno all'agente contesto persistente e confini di autorità.
- **Task Flow** coordina flussi in più passaggi sopra le singole attività.
- **Attività** tracciano automaticamente tutto il lavoro distaccato così puoi ispezionarlo e auditarlo.

## Correlati

- [Attività pianificate](/it/automation/cron-jobs) — pianificazione precisa e promemoria a singola esecuzione
- [Impegni inferiti](/it/concepts/commitments) — check-in di follow-up simili a una memoria
- [Attività in background](/it/automation/tasks) — registro attività per tutto il lavoro distaccato
- [Task Flow](/it/automation/taskflow) — orchestrazione durevole di flussi in più passaggi
- [Hook](/it/automation/hooks) — script del ciclo di vita guidati da eventi
- [Hook dei Plugin](/it/plugins/hooks) — hook in-process per tool, prompt, messaggi e ciclo di vita
- [Ordini permanenti](/it/automation/standing-orders) — istruzioni persistenti dell'agente
- [Heartbeat](/it/gateway/heartbeat) — turni periodici della sessione principale
- [Riferimento configurazione](/it/gateway/configuration-reference) — tutte le chiavi di configurazione
