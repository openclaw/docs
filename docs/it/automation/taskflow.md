---
read_when:
    - Vuoi capire in che modo Task Flow si collega alle attività in background
    - Trovi TaskFlow o openclaw tasks flow nelle note di rilascio o nella documentazione
    - Vuoi ispezionare o gestire lo stato persistente del flusso
summary: Livello di orchestrazione del flusso di attività sopra le attività in background
title: Flusso delle attività
x-i18n:
    generated_at: "2026-07-02T00:59:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b74a773e34c02421d22ce11ae0aa29fed82664383f0680e7623787db7d79c8e
    source_path: automation/taskflow.md
    workflow: 16
---

TaskFlow è il substrato di orchestrazione dei flussi che si colloca sopra le [attività in background](/it/automation/tasks). Gestisce flussi durevoli a più passaggi con il proprio stato, tracciamento delle revisioni e semantica di sincronizzazione, mentre le singole attività restano l'unità di lavoro distaccato.

## Quando usare TaskFlow

Usa TaskFlow quando il lavoro si estende su più passaggi sequenziali o ramificati e hai bisogno di un tracciamento durevole dell'avanzamento attraverso i riavvii del gateway. Per singole operazioni in background, è sufficiente una semplice [attività](/it/automation/tasks).

| Scenario                              | Uso                      |
| ------------------------------------- | ------------------------ |
| Singolo job in background             | Attività semplice        |
| Pipeline a più passaggi (A poi B poi C) | TaskFlow (gestito)       |
| Osservare attività create esternamente | TaskFlow (specchiato)    |
| Promemoria una tantum                 | Job Cron                 |

## Pattern di workflow pianificato affidabile

Per workflow ricorrenti, come briefing di market intelligence, tratta la pianificazione, l'orchestrazione e i controlli di affidabilità come livelli separati:

1. Usa [Attività pianificate](/it/automation/cron-jobs) per la temporizzazione.
2. Archivia il contesto precedente nei file, nel database o nello stato degli strumenti propri del workflow.
3. Usa [Lobster](/it/tools/lobster) per passaggi deterministici, gate di approvazione e token di ripresa.
4. Usa TaskFlow per tracciare l'esecuzione a più passaggi attraverso attività figlie, attese, tentativi e riavvii del gateway.

Forma di cron di esempio:

```bash
openclaw cron add \
  --name "Market intelligence brief" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "Run the market-intel Lobster workflow. Verify source freshness before summarizing." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Usa `session:<id>` quando il job deve puntare a una chat/sessione nota per il contesto di consegna o per il seeding sicuro delle preferenze. Cron esegue comunque ogni run in una sessione distaccata, quindi inserisci i riepiloghi delle run precedenti e lo stato permanente del workflow in uno storage esplicito che il job possa leggere.

All'interno del workflow, inserisci i controlli di affidabilità prima del passaggio di riepilogo LLM:

```yaml
name: market-intel-brief
steps:
  - id: preflight
    command: market-intel check --json
  - id: collect
    command: market-intel collect --json
    stdin: $preflight.json
  - id: summarize
    command: market-intel summarize --json
    stdin: $collect.json
  - id: approve
    command: market-intel deliver --preview
    stdin: $summarize.json
    approval: required
  - id: deliver
    command: market-intel deliver --execute
    stdin: $summarize.json
    condition: $approve.approved
```

Controlli preliminari consigliati:

- Disponibilità del browser e scelta del profilo, ad esempio `openclaw` per lo stato gestito o `user` quando è richiesta una sessione Chrome con accesso effettuato. Vedi [Browser](/it/tools/browser).
- Credenziali API e quota per ogni fonte.
- Raggiungibilità di rete per gli endpoint richiesti.
- Strumenti richiesti abilitati per l'agente, come `lobster`, `browser` e `llm-task`.
- Destinazione di errore configurata per cron, in modo che gli errori dei controlli preliminari siano visibili. Vedi [Attività pianificate](/it/automation/cron-jobs#delivery-and-output).

Campi di provenienza dei dati consigliati per ogni elemento raccolto:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Fai in modo che il workflow rifiuti o contrassegni come obsoleti gli elementi prima del riepilogo. Il passaggio LLM dovrebbe ricevere solo JSON strutturato e dovrebbe essere istruito a preservare `sourceUrl`, `retrievedAt` e `asOf` nel proprio output. Usa [LLM Task](/it/tools/llm-task) quando hai bisogno di un passaggio del modello con schema validato all'interno del workflow.

Per workflow riutilizzabili da team o community, pacchettizza la CLI, i file `.lobster` e le eventuali note di configurazione come skill o plugin e pubblicalo tramite [ClawHub](/clawhub). Mantieni i guardrail specifici del workflow in quel pacchetto, a meno che all'API del plugin manchi una capacità generica necessaria.

## Modalità di sincronizzazione

### Modalità gestita

TaskFlow possiede il ciclo di vita end-to-end. Crea attività come passaggi del flusso, le porta a completamento e fa avanzare automaticamente lo stato del flusso.

Esempio: un flusso di report settimanale che (1) raccoglie dati, (2) genera il report e (3) lo consegna. TaskFlow crea ogni passaggio come attività in background, attende il completamento e poi passa al passaggio successivo.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Modalità specchiata

TaskFlow osserva attività create esternamente e mantiene sincronizzato lo stato del flusso senza assumere la proprietà della creazione delle attività. Questo è utile quando le attività provengono da job cron, comandi CLI o altre fonti e vuoi una vista unificata del loro avanzamento come flusso.

Esempio: tre job cron indipendenti che insieme formano una routine "morning ops". Un flusso specchiato traccia il loro avanzamento collettivo senza controllare quando o come vengono eseguiti.

## Stato durevole e tracciamento delle revisioni

Ogni flusso persiste il proprio stato e traccia le revisioni, così l'avanzamento sopravvive ai riavvii del gateway. Il tracciamento delle revisioni consente il rilevamento dei conflitti quando più fonti tentano di far avanzare lo stesso flusso contemporaneamente.
Il registro dei flussi usa SQLite con manutenzione bounded del write-ahead log, inclusi checkpoint
periodici e allo spegnimento, così i gateway a esecuzione prolungata non conservano
file sidecar `registry.sqlite-wal` illimitati.

## Comportamento di annullamento

`openclaw tasks flow cancel` imposta un intento di annullamento persistente sul flusso. Le attività attive all'interno del flusso vengono annullate e non vengono avviati nuovi passaggi. L'intento di annullamento persiste attraverso i riavvii, quindi un flusso annullato resta annullato anche se il gateway si riavvia prima che tutte le attività figlie siano terminate.

## Comandi CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Comando                           | Descrizione                                           |
| --------------------------------- | ----------------------------------------------------- |
| `openclaw tasks flow list`        | Mostra i flussi tracciati con stato e modalità di sincronizzazione |
| `openclaw tasks flow show <id>`   | Ispeziona un flusso per ID flusso o chiave di lookup  |
| `openclaw tasks flow cancel <id>` | Annulla un flusso in esecuzione e le sue attività attive |

## Come i flussi si relazionano alle attività

I flussi coordinano le attività, non le sostituiscono. Un singolo flusso può guidare più attività in background durante il suo ciclo di vita. Usa `openclaw tasks` per ispezionare i record delle singole attività e `openclaw tasks flow` per ispezionare il flusso orchestratore.

## Correlati

- [Attività in background](/it/automation/tasks) — il registro del lavoro distaccato che i flussi coordinano
- [CLI: tasks](/it/cli/tasks) — riferimento dei comandi CLI per `openclaw tasks flow`
- [Panoramica dell'automazione](/it/automation) — tutti i meccanismi di automazione in sintesi
- [Job Cron](/it/automation/cron-jobs) — job pianificati che possono alimentare i flussi
