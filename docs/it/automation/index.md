---
doc-schema-version: 1
read_when:
    - Decidere come automatizzare il lavoro con OpenClaw
    - Scegliere tra Heartbeat, Cron, impegni, agganci e ordini permanenti
    - Cercare il punto di ingresso di automazione giusto
summary: 'Panoramica dei meccanismi di automazione: attività, Cron, hook, ordini permanenti e Task Flow'
title: Automazione
x-i18n:
    generated_at: "2026-05-12T23:29:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 311ebbd557e40e38cd25b2f11b887baa4576657095d5a0841d4cb7f71898927d
    source_path: automation/index.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw esegue lavoro in background tramite attività, lavori pianificati, impegni
dedotti, hook di eventi e istruzioni permanenti. Questa pagina ti aiuta a scegliere
il meccanismo corretto e a capire come si integrano.

## Guida rapida alla decisione

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

| Caso d'uso                              | Consigliato            | Perché                                           |
| --------------------------------------- | ---------------------- | ------------------------------------------------ |
| Inviare il report giornaliero alle 9:00 precise | Attività pianificate (Cron) | Tempistiche esatte, esecuzione isolata          |
| Ricordami tra 20 minuti                 | Attività pianificate (Cron) | Esecuzione una tantum con tempistiche precise (`--at`) |
| Eseguire un'analisi approfondita settimanale | Attività pianificate (Cron) | Attività autonoma, può usare un modello diverso |
| Controllare la posta ogni 30 min        | Heartbeat              | Raggruppa con altri controlli, sensibile al contesto |
| Monitorare il calendario per eventi imminenti | Heartbeat              | Adatto naturalmente alla consapevolezza periodica |
| Fare un controllo dopo un colloquio menzionato | Impegni dedotti        | Follow-up simile alla memoria, senza richiesta di promemoria esatto |
| Check-in di cura leggero dopo il contesto utente | Impegni dedotti        | Limitato allo stesso agente e canale             |
| Ispezionare lo stato di un sottoagente o di un'esecuzione ACP | Attività in background | Il registro attività traccia tutto il lavoro separato |
| Verificare cosa è stato eseguito e quando | Attività in background | `openclaw tasks list` e `openclaw tasks audit` |
| Ricerca in più passaggi e poi riepilogo | Task Flow              | Orchestrazione durevole con tracciamento delle revisioni |
| Eseguire uno script al reset della sessione | Hook                   | Basato su eventi, si attiva sugli eventi del ciclo di vita |
| Eseguire codice a ogni chiamata di strumento | Hook Plugin            | Gli hook in-process possono intercettare le chiamate di strumento |
| Controllare sempre la conformità prima di rispondere | Ordini permanenti      | Iniettati automaticamente in ogni sessione       |

### Attività pianificate (Cron) rispetto a Heartbeat

| Dimensione      | Attività pianificate (Cron)          | Heartbeat                             |
| --------------- | ----------------------------------- | ------------------------------------- |
| Tempistiche     | Esatte (espressioni cron, una tantum) | Approssimative (predefinito ogni 30 min) |
| Contesto sessione | Nuovo (isolato) o condiviso        | Contesto completo della sessione principale |
| Record attività | Sempre creati                       | Mai creati                            |
| Consegna        | Canale, webhook o silenziosa        | Inline nella sessione principale      |
| Ideale per      | Report, promemoria, lavori in background | Controlli posta, calendario, notifiche |

Usa le Attività pianificate (Cron) quando servono tempistiche precise o un'esecuzione isolata. Usa Heartbeat quando il lavoro trae beneficio dal contesto completo della sessione e tempistiche approssimative vanno bene.

## Concetti principali

### Attività pianificate (cron)

Cron è lo scheduler integrato del Gateway per tempistiche precise. Persiste i lavori, risveglia l'agente al momento giusto e può consegnare l'output a un canale chat o a un endpoint webhook. Supporta promemoria una tantum, espressioni ricorrenti e trigger webhook in ingresso.

Vedi [Attività pianificate](/it/automation/cron-jobs).

### Attività

Il registro delle attività in background traccia tutto il lavoro separato: esecuzioni ACP, avvii di sottoagenti, esecuzioni cron isolate e operazioni CLI. Le attività sono record, non scheduler. Usa `openclaw tasks list` e `openclaw tasks audit` per ispezionarle.

Vedi [Attività in background](/it/automation/tasks).

### Impegni dedotti

Gli impegni sono memorie di follow-up facoltative e di breve durata. OpenClaw li deduce
dalle conversazioni normali, li limita allo stesso agente e canale e
consegna i check-in dovuti tramite heartbeat. I promemoria esatti richiesti dall'utente
restano di competenza di cron.

Vedi [Impegni dedotti](/it/concepts/commitments).

### Task Flow

Task Flow è il substrato di orchestrazione dei flussi sopra le attività in background. Gestisce flussi durevoli in più passaggi con modalità di sincronizzazione gestite e rispecchiate, tracciamento delle revisioni e `openclaw tasks flow list|show|cancel` per l'ispezione.

Vedi [Task Flow](/it/automation/taskflow).

### Ordini permanenti

Gli ordini permanenti concedono all'agente autorità operativa permanente per programmi definiti. Vivono nei file dell'area di lavoro (in genere `AGENTS.md`) e vengono iniettati in ogni sessione. Combinali con cron per l'applicazione basata sul tempo.

Vedi [Ordini permanenti](/it/automation/standing-orders).

### Hook

Gli hook interni sono script basati su eventi attivati da eventi del ciclo di vita dell'agente
(`/new`, `/reset`, `/stop`), Compaction della sessione, avvio del gateway e flusso
dei messaggi. Vengono scoperti automaticamente dalle directory e possono essere gestiti
con `openclaw hooks`. Per l'intercettazione in-process delle chiamate di strumento, usa
[Hook Plugin](/it/plugins/hooks).

Vedi [Hook](/it/automation/hooks).

### Heartbeat

Heartbeat è un turno periodico della sessione principale (predefinito ogni 30 minuti). Raggruppa più controlli (posta, calendario, notifiche) in un unico turno dell'agente con il contesto completo della sessione. I turni Heartbeat non creano record attività e non estendono la freschezza del reset giornaliero/inattivo della sessione. Usa `HEARTBEAT.md` per una piccola checklist, oppure un blocco `tasks:` quando vuoi controlli periodici solo se dovuti dentro heartbeat stesso. I file heartbeat vuoti vengono saltati come `empty-heartbeat-file`; la modalità attività solo se dovute viene saltata come `no-tasks-due`. Gli Heartbeat vengono rinviati mentre il lavoro cron è attivo o in coda, e `heartbeat.skipWhenBusy` può anche rinviare un agente mentre il sottoagente con chiave di sessione dello stesso agente o le lane annidate sono occupati.

Vedi [Heartbeat](/it/gateway/heartbeat).

## Come funzionano insieme

- **Cron** gestisce pianificazioni precise (report giornalieri, revisioni settimanali) e promemoria una tantum. Tutte le esecuzioni cron creano record attività.
- **Heartbeat** gestisce il monitoraggio di routine (posta, calendario, notifiche) in un unico turno raggruppato ogni 30 minuti.
- **Hook** reagiscono a eventi specifici (reset della sessione, Compaction, flusso dei messaggi) con script personalizzati. Gli hook Plugin coprono le chiamate di strumento.
- **Ordini permanenti** danno all'agente contesto persistente e confini di autorità.
- **Task Flow** coordina flussi in più passaggi sopra le singole attività.
- **Attività** traccia automaticamente tutto il lavoro separato, così puoi ispezionarlo e verificarlo.

## Correlati

- [Attività pianificate](/it/automation/cron-jobs) — pianificazione precisa e promemoria una tantum
- [Impegni dedotti](/it/concepts/commitments) — check-in di follow-up simili alla memoria
- [Attività in background](/it/automation/tasks) — registro attività per tutto il lavoro separato
- [Task Flow](/it/automation/taskflow) — orchestrazione durevole di flussi in più passaggi
- [Hook](/it/automation/hooks) — script del ciclo di vita basati su eventi
- [Hook Plugin](/it/plugins/hooks) — hook in-process di strumenti, prompt, messaggi e ciclo di vita
- [Ordini permanenti](/it/automation/standing-orders) — istruzioni persistenti per l'agente
- [Heartbeat](/it/gateway/heartbeat) — turni periodici della sessione principale
- [Riferimento configurazione](/it/gateway/configuration-reference) — tutte le chiavi di configurazione
