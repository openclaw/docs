---
read_when:
    - Scegliere come automatizzare il lavoro con OpenClaw
    - Scegliere tra Heartbeat, Cron, impegni, agganci e istruzioni permanenti
    - Trovare il punto di ingresso giusto per l'automazione
summary: 'Panoramica dei meccanismi di automazione: attività, Cron, hook, istruzioni permanenti e flusso di attività'
title: Automazione e attività
x-i18n:
    generated_at: "2026-04-30T08:36:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2465c39f21db8bcb98f980a2c4b2c03018dddd5f43de59d8bf6ce0d6e97d9ef
    source_path: automation/index.md
    workflow: 16
---

OpenClaw esegue lavoro in background tramite attività, processi pianificati, impegni inferiti, hook di eventi e istruzioni permanenti. Questa pagina ti aiuta a scegliere il meccanismo giusto e a capire come si integrano tra loro.

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

| Caso d'uso                               | Consigliato            | Perché                                           |
| ---------------------------------------- | ---------------------- | ------------------------------------------------ |
| Inviare il report giornaliero esattamente alle 9:00 | Processi pianificati (Cron) | Tempistica esatta, esecuzione isolata            |
| Ricordami tra 20 minuti                  | Processi pianificati (Cron) | Esecuzione singola con tempistica precisa (`--at`) |
| Eseguire un'analisi approfondita settimanale | Processi pianificati (Cron) | Attività autonoma, può usare un modello diverso  |
| Controllare la posta ogni 30 min         | Heartbeat              | Raggruppa con altri controlli, consapevole del contesto |
| Monitorare il calendario per eventi imminenti | Heartbeat              | Scelta naturale per consapevolezza periodica     |
| Verificare dopo un colloquio menzionato  | Impegni inferiti       | Follow-up simile alla memoria, nessuna richiesta di promemoria esatto |
| Check-in delicato di attenzione dopo il contesto dell'utente | Impegni inferiti       | Limitato allo stesso agente e canale             |
| Ispezionare lo stato di un subagente o di un'esecuzione ACP | Attività in background | Il registro delle attività traccia tutto il lavoro scollegato |
| Verificare cosa è stato eseguito e quando | Attività in background | `openclaw tasks list` e `openclaw tasks audit` |
| Ricerca in più passaggi e poi riepilogo  | Task Flow              | Orchestrazione durevole con tracciamento delle revisioni |
| Eseguire uno script al reset della sessione | Hook                   | Guidato da eventi, si attiva sugli eventi del ciclo di vita |
| Eseguire codice a ogni chiamata di strumento | Hook dei Plugin        | Gli hook in-process possono intercettare le chiamate agli strumenti |
| Controllare sempre la conformità prima di rispondere | Ordini permanenti      | Inseriti automaticamente in ogni sessione        |

### Processi pianificati (Cron) vs Heartbeat

| Dimensione       | Processi pianificati (Cron)         | Heartbeat                             |
| ---------------- | ----------------------------------- | ------------------------------------- |
| Tempistica       | Esatta (espressioni cron, esecuzione singola) | Approssimativa (predefinita ogni 30 min) |
| Contesto della sessione | Nuovo (isolato) o condiviso         | Contesto completo della sessione principale |
| Record attività  | Sempre creati                       | Mai creati                            |
| Recapito         | Canale, webhook o silenzioso        | Inline nella sessione principale      |
| Ideale per       | Report, promemoria, processi in background | Controlli posta, calendario, notifiche |

Usa Processi pianificati (Cron) quando hai bisogno di una tempistica precisa o di un'esecuzione isolata. Usa Heartbeat quando il lavoro beneficia del contesto completo della sessione e una tempistica approssimativa va bene.

## Concetti fondamentali

### Processi pianificati (cron)

Cron è lo scheduler integrato del Gateway per la tempistica precisa. Mantiene i processi, risveglia l'agente al momento giusto e può recapitare l'output a un canale chat o a un endpoint webhook. Supporta promemoria a esecuzione singola, espressioni ricorrenti e trigger webhook in ingresso.

Vedi [Processi pianificati](/it/automation/cron-jobs).

### Attività

Il registro delle attività in background traccia tutto il lavoro scollegato: esecuzioni ACP, avvii di subagenti, esecuzioni cron isolate e operazioni CLI. Le attività sono record, non scheduler. Usa `openclaw tasks list` e `openclaw tasks audit` per ispezionarle.

Vedi [Attività in background](/it/automation/tasks).

### Impegni inferiti

Gli impegni sono memorie di follow-up opzionali e di breve durata. OpenClaw li inferisce
dalle conversazioni normali, li limita allo stesso agente e canale e
recapita i check-in dovuti tramite heartbeat. I promemoria esatti richiesti dall'utente restano
di competenza di cron.

Vedi [Impegni inferiti](/it/concepts/commitments).

### Task Flow

Task Flow è il substrato di orchestrazione dei flussi sopra le attività in background. Gestisce flussi durevoli in più passaggi con modalità di sincronizzazione gestite e rispecchiate, tracciamento delle revisioni e `openclaw tasks flow list|show|cancel` per l'ispezione.

Vedi [Task Flow](/it/automation/taskflow).

### Ordini permanenti

Gli ordini permanenti concedono all'agente autorità operativa permanente per programmi definiti. Vivono in file dell'area di lavoro (di solito `AGENTS.md`) e vengono inseriti in ogni sessione. Combinali con cron per l'applicazione basata sul tempo.

Vedi [Ordini permanenti](/it/automation/standing-orders).

### Hook

Gli hook interni sono script guidati da eventi attivati dagli eventi del ciclo di vita dell'agente
(`/new`, `/reset`, `/stop`), dalla Compaction della sessione, dall'avvio del gateway e dal flusso dei messaggi.
Vengono rilevati automaticamente dalle directory e possono essere gestiti
con `openclaw hooks`. Per l'intercettazione in-process delle chiamate agli strumenti, usa
[Hook dei Plugin](/it/plugins/hooks).

Vedi [Hook](/it/automation/hooks).

### Heartbeat

Heartbeat è un turno periodico della sessione principale (predefinito ogni 30 minuti). Raggruppa più controlli (posta, calendario, notifiche) in un solo turno dell'agente con il contesto completo della sessione. I turni Heartbeat non creano record attività e non estendono la freschezza del reset giornaliero/inattivo della sessione. Usa `HEARTBEAT.md` per una piccola checklist, oppure un blocco `tasks:` quando vuoi controlli periodici solo se dovuti all'interno dello stesso heartbeat. I file heartbeat vuoti vengono saltati come `empty-heartbeat-file`; la modalità attività solo se dovute viene saltata come `no-tasks-due`. Gli heartbeat vengono rinviati mentre il lavoro cron è attivo o in coda, e anche `heartbeat.skipWhenBusy` può rinviarli mentre subagenti o corsie annidate sono occupati.

Vedi [Heartbeat](/it/gateway/heartbeat).

## Come funzionano insieme

- **Cron** gestisce pianificazioni precise (report giornalieri, revisioni settimanali) e promemoria a esecuzione singola. Tutte le esecuzioni cron creano record attività.
- **Heartbeat** gestisce il monitoraggio di routine (posta, calendario, notifiche) in un unico turno raggruppato ogni 30 minuti.
- **Hook** reagiscono a eventi specifici (reset della sessione, Compaction, flusso dei messaggi) con script personalizzati. Gli hook dei Plugin coprono le chiamate agli strumenti.
- **Ordini permanenti** danno all'agente contesto persistente e limiti di autorità.
- **Task Flow** coordina flussi in più passaggi sopra le singole attività.
- **Attività** tracciano automaticamente tutto il lavoro scollegato, così puoi ispezionarlo e verificarlo.

## Correlati

- [Processi pianificati](/it/automation/cron-jobs) — pianificazione precisa e promemoria a esecuzione singola
- [Impegni inferiti](/it/concepts/commitments) — check-in di follow-up simili alla memoria
- [Attività in background](/it/automation/tasks) — registro attività per tutto il lavoro scollegato
- [Task Flow](/it/automation/taskflow) — orchestrazione durevole di flussi in più passaggi
- [Hook](/it/automation/hooks) — script del ciclo di vita guidati da eventi
- [Hook dei Plugin](/it/plugins/hooks) — hook in-process per strumenti, prompt, messaggi e ciclo di vita
- [Ordini permanenti](/it/automation/standing-orders) — istruzioni persistenti per l'agente
- [Heartbeat](/it/gateway/heartbeat) — turni periodici della sessione principale
- [Riferimento di configurazione](/it/gateway/configuration-reference) — tutte le chiavi di configurazione
