---
read_when:
    - Vuoi capire in che modo Task Flow si relaziona alle attività in background
    - Ti imbatti in Task Flow o nel flusso di attività di openclaw nelle note di rilascio o nella documentazione
    - Vuoi ispezionare o gestire lo stato persistente del flusso
summary: Livello di orchestrazione del flusso di attività sopra le attività in background
title: Flusso di attività
x-i18n:
    generated_at: "2026-07-02T08:23:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4f5ff3c9a68eb0408a180bc947a03b410568d7914cb1c1d7f31d6013e036096
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow è il substrato di orchestrazione dei flussi che si colloca sopra le [attività in background](/it/automation/tasks). Gestisce flussi multi-passaggio durevoli con stato proprio, tracciamento delle revisioni e semantica di sincronizzazione, mentre le singole attività restano l'unità di lavoro disaccoppiato.

## Quando usare Task Flow

Usa Task Flow quando il lavoro comprende più passaggi sequenziali o ramificati e ti serve un tracciamento durevole dell'avanzamento tra i riavvii del Gateway. Per singole operazioni in background, è sufficiente una semplice [attività](/it/automation/tasks).

| Scenario                              | Uso                  |
| ------------------------------------- | -------------------- |
| Singolo job in background             | Attività semplice    |
| Pipeline multi-passaggio (A poi B poi C) | Task Flow (gestito)  |
| Osservare attività create esternamente | Task Flow (speculare) |
| Promemoria una tantum                 | Job Cron             |

## Pattern di workflow pianificato affidabile

Per workflow ricorrenti come briefing di market intelligence, tratta la pianificazione, l'orchestrazione e i controlli di affidabilità come livelli separati:

1. Usa le [Attività pianificate](/it/automation/cron-jobs) per la temporizzazione.
2. Usa una sessione cron persistente quando il workflow deve basarsi sul contesto precedente.
3. Usa [Lobster](/it/tools/lobster) per passaggi deterministici, gate di approvazione e token di ripresa.
4. Usa Task Flow per tracciare l'esecuzione multi-passaggio tra attività figlie, attese, tentativi e riavvii del Gateway.

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

Usa `session:<id>` invece di `isolated` quando il workflow ricorrente richiede cronologia deliberata, riepiloghi delle esecuzioni precedenti o contesto permanente. Usa `isolated` quando ogni esecuzione deve iniziare da zero e tutto lo stato richiesto è esplicito nel workflow.

Nel workflow, inserisci i controlli di affidabilità prima del passaggio di riepilogo LLM:

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

- Disponibilità del browser e scelta del profilo, per esempio `openclaw` per lo stato gestito o `user` quando è richiesta una sessione Chrome con accesso effettuato. Vedi [Browser](/it/tools/browser).
- Credenziali API e quota per ogni fonte.
- Raggiungibilità di rete per gli endpoint richiesti.
- Strumenti richiesti abilitati per l'agente, come `lobster`, `browser` e `llm-task`.
- Destinazione degli errori configurata per cron, così gli errori preliminari sono visibili. Vedi [Attività pianificate](/it/automation/cron-jobs#delivery-and-output).

Campi consigliati per la provenienza dei dati per ogni elemento raccolto:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Fai in modo che il workflow rifiuti o contrassegni come obsoleti gli elementi prima del riepilogo. Il passaggio LLM deve ricevere solo JSON strutturato e deve essere istruito a preservare `sourceUrl`, `retrievedAt` e `asOf` nel proprio output. Usa [LLM Task](/it/tools/llm-task) quando ti serve un passaggio del modello convalidato da schema all'interno del workflow.

Per workflow riutilizzabili da team o community, impacchetta la CLI, i file `.lobster` e le eventuali note di configurazione come skill o plugin e pubblicali tramite [ClawHub](/clawhub). Mantieni le protezioni specifiche del workflow in quel pacchetto, a meno che all'API del Plugin manchi una capacità generica necessaria.

## Modalità di sincronizzazione

### Modalità gestita

Task Flow possiede l'intero ciclo di vita. Crea attività come passaggi del flusso, le porta a completamento e fa avanzare automaticamente lo stato del flusso.

Esempio: un flusso di report settimanale che (1) raccoglie dati, (2) genera il report e (3) lo consegna. Task Flow crea ogni passaggio come attività in background, attende il completamento, poi passa al passaggio successivo.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Modalità speculare

Task Flow osserva attività create esternamente e mantiene sincronizzato lo stato del flusso senza assumere la proprietà della creazione delle attività. È utile quando le attività hanno origine da job cron, comandi CLI o altre fonti e vuoi una vista unificata del loro avanzamento come flusso.

Esempio: tre job cron indipendenti che insieme formano una routine di "operazioni mattutine". Un flusso speculare traccia il loro avanzamento collettivo senza controllare quando o come vengono eseguiti.

## Stato durevole e tracciamento delle revisioni

Ogni flusso persiste il proprio stato e traccia le revisioni, così l'avanzamento sopravvive ai riavvii del Gateway. Il tracciamento delle revisioni abilita il rilevamento dei conflitti quando più fonti tentano di far avanzare lo stesso flusso contemporaneamente.
Il registro dei flussi usa SQLite con manutenzione limitata del write-ahead log, inclusi
checkpoint periodici e allo spegnimento, così i Gateway a esecuzione prolungata non conservano
file collaterali `registry.sqlite-wal` senza limiti.

## Comportamento di annullamento

`openclaw tasks flow cancel` imposta sul flusso un intento di annullamento persistente. Le attività attive all'interno del flusso vengono annullate e non vengono avviati nuovi passaggi. L'intento di annullamento persiste tra i riavvii, quindi un flusso annullato resta annullato anche se il Gateway si riavvia prima che tutte le attività figlie siano terminate.

## Comandi CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Comando                           | Descrizione                                   |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list`        | Mostra i flussi tracciati con stato e modalità di sincronizzazione |
| `openclaw tasks flow show <id>`   | Ispeziona un flusso tramite ID flusso o chiave di lookup |
| `openclaw tasks flow cancel <id>` | Annulla un flusso in esecuzione e le sue attività attive |

## Come i flussi si relazionano alle attività

I flussi coordinano le attività, non le sostituiscono. Un singolo flusso può guidare più attività in background durante il proprio ciclo di vita. Usa `openclaw tasks` per ispezionare i singoli record delle attività e `openclaw tasks flow` per ispezionare il flusso di orchestrazione.

## Correlati

- [Attività in background](/it/automation/tasks) — il registro del lavoro disaccoppiato coordinato dai flussi
- [CLI: attività](/it/cli/tasks) — riferimento dei comandi CLI per `openclaw tasks flow`
- [Panoramica dell'automazione](/it/automation) — tutti i meccanismi di automazione in sintesi
- [Job Cron](/it/automation/cron-jobs) — job pianificati che possono alimentare i flussi
