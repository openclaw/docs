---
read_when:
    - Vuoi capire in che modo TaskFlow si collega alle attività in background
    - Ti imbatti in TaskFlow o nel flusso di attività openclaw nelle note di rilascio o nella documentazione
    - Vuoi ispezionare o gestire lo stato persistente del flusso
summary: Livello di orchestrazione dei flussi del Flusso di attività sopra le attività in background
title: Flusso di attività
x-i18n:
    generated_at: "2026-04-30T08:36:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ab261dea0ec3beb10b53c641bd188288cada5345aef6ddbbc8071d37eb57bdc
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow è il substrato di orchestrazione dei flussi che si colloca sopra le [attività in background](/it/automation/tasks). Gestisce flussi durevoli a più passaggi con stato proprio, tracciamento delle revisioni e semantiche di sincronizzazione, mentre le singole attività restano l'unità di lavoro scollegato.

## Quando usare Task Flow

Usa Task Flow quando il lavoro si estende su più passaggi sequenziali o ramificati e hai bisogno di un tracciamento durevole dell'avanzamento attraverso i riavvii del gateway. Per singole operazioni in background, una semplice [attività](/it/automation/tasks) è sufficiente.

| Scenario                              | Uso                  |
| ------------------------------------- | -------------------- |
| Singolo job in background             | Attività semplice    |
| Pipeline a più passaggi (A poi B poi C) | Task Flow (gestito)  |
| Osservare attività create esternamente | Task Flow (specchiato) |
| Promemoria una tantum                 | Job Cron             |

## Modello affidabile per workflow pianificati

Per workflow ricorrenti come briefing di market intelligence, tratta pianificazione, orchestrazione e controlli di affidabilità come livelli separati:

1. Usa [Attività pianificate](/it/automation/cron-jobs) per la temporizzazione.
2. Usa una sessione cron persistente quando il workflow deve basarsi sul contesto precedente.
3. Usa [Lobster](/it/tools/lobster) per passaggi deterministici, gate di approvazione e token di ripresa.
4. Usa Task Flow per tracciare l'esecuzione a più passaggi attraverso attività figlie, attese, tentativi e riavvii del gateway.

Esempio di forma cron:

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

Usa `session:<id>` invece di `isolated` quando il workflow ricorrente richiede cronologia intenzionale, riepiloghi delle esecuzioni precedenti o contesto permanente. Usa `isolated` quando ogni esecuzione deve iniziare da zero e tutto lo stato richiesto è esplicito nel workflow.

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

Controlli preflight consigliati:

- Disponibilità del browser e scelta del profilo, per esempio `openclaw` per lo stato gestito o `user` quando è richiesta una sessione Chrome con accesso effettuato. Vedi [Browser](/it/tools/browser).
- Credenziali API e quota per ogni sorgente.
- Raggiungibilità di rete per gli endpoint richiesti.
- Strumenti richiesti abilitati per l'agente, come `lobster`, `browser` e `llm-task`.
- Destinazione di errore configurata per cron, così gli errori preflight sono visibili. Vedi [Attività pianificate](/it/automation/cron-jobs#delivery-and-output).

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

Fai in modo che il workflow rifiuti o contrassegni come obsoleti gli elementi prima del riepilogo. Il passaggio LLM dovrebbe ricevere solo JSON strutturato e dovrebbe essere istruito a preservare `sourceUrl`, `retrievedAt` e `asOf` nel suo output. Usa [LLM Task](/it/tools/llm-task) quando hai bisogno di un passaggio del modello con schema validato all'interno del workflow.

Per workflow riutilizzabili da team o community, impacchetta la CLI, i file `.lobster` ed eventuali note di configurazione come skill o plugin e pubblicali tramite [ClawHub](/it/tools/clawhub). Mantieni le guardrail specifiche del workflow in quel pacchetto, a meno che l'API del Plugin non manchi di una capacità generica necessaria.

## Modalità di sincronizzazione

### Modalità gestita

Task Flow possiede il ciclo di vita end-to-end. Crea attività come passaggi del flusso, le porta a completamento e fa avanzare automaticamente lo stato del flusso.

Esempio: un flusso di report settimanale che (1) raccoglie dati, (2) genera il report e (3) lo consegna. Task Flow crea ogni passaggio come attività in background, attende il completamento, quindi passa al passaggio successivo.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Modalità specchiata

Task Flow osserva attività create esternamente e mantiene sincronizzato lo stato del flusso senza assumere la proprietà della creazione delle attività. È utile quando le attività hanno origine da job cron, comandi CLI o altre sorgenti e vuoi una vista unificata del loro avanzamento come flusso.

Esempio: tre job cron indipendenti che insieme formano una routine "morning ops". Un flusso specchiato traccia il loro avanzamento collettivo senza controllare quando o come vengono eseguiti.

## Stato durevole e tracciamento delle revisioni

Ogni flusso persiste il proprio stato e traccia le revisioni, così l'avanzamento sopravvive ai riavvii del gateway. Il tracciamento delle revisioni abilita il rilevamento dei conflitti quando più sorgenti tentano di far avanzare contemporaneamente lo stesso flusso.
Il registro dei flussi usa SQLite con manutenzione bounded del write-ahead log, inclusi checkpoint periodici e allo spegnimento, così i gateway a lunga esecuzione non conservano file sidecar `registry.sqlite-wal` senza limiti.

## Comportamento di annullamento

`openclaw tasks flow cancel` imposta sul flusso un intento di annullamento persistente. Le attività attive all'interno del flusso vengono annullate e non vengono avviati nuovi passaggi. L'intento di annullamento persiste attraverso i riavvii, quindi un flusso annullato resta annullato anche se il gateway si riavvia prima che tutte le attività figlie siano terminate.

## Comandi CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Comando                           | Descrizione                                      |
| --------------------------------- | ------------------------------------------------ |
| `openclaw tasks flow list`        | Mostra i flussi tracciati con stato e modalità di sincronizzazione |
| `openclaw tasks flow show <id>`   | Ispeziona un flusso tramite ID del flusso o chiave di lookup |
| `openclaw tasks flow cancel <id>` | Annulla un flusso in esecuzione e le sue attività attive |

## Come i flussi si relazionano alle attività

I flussi coordinano le attività, non le sostituiscono. Un singolo flusso può guidare più attività in background durante il suo ciclo di vita. Usa `openclaw tasks` per ispezionare i singoli record delle attività e `openclaw tasks flow` per ispezionare il flusso di orchestrazione.

## Correlati

- [Attività in background](/it/automation/tasks) — il registro del lavoro scollegato coordinato dai flussi
- [CLI: attività](/it/cli/tasks) — riferimento dei comandi CLI per `openclaw tasks flow`
- [Panoramica dell'automazione](/it/automation) — tutti i meccanismi di automazione in sintesi
- [Job Cron](/it/automation/cron-jobs) — job pianificati che possono alimentare i flussi
