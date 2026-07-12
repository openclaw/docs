---
read_when:
    - Vuoi capire in che modo TaskFlow si rapporta alle attività in background
    - Incontri TaskFlow o il flusso delle attività di OpenClaw nelle note di rilascio o nella documentazione
    - Vuoi esaminare o gestire lo stato persistente del flusso
summary: Livello di orchestrazione TaskFlow sopra le attività in background
title: Flusso delle attività
x-i18n:
    generated_at: "2026-07-12T06:49:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ccc6acf58b4b44c2989e3061bff08dabce8ef385706102360c756a1286ddd1b
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow è il livello di orchestrazione sopra le [attività in background](/it/automation/tasks). Un flusso è un record persistente di un lavoro in più passaggi, con stato, stato JSON, contatore di revisione e record delle attività collegate propri. I flussi sopravvivono ai riavvii del Gateway; le singole attività rimangono l'unità di lavoro disaccoppiato.

## Quando usare Task Flow

| Scenario                                        | Utilizzo                                        |
| ----------------------------------------------- | ----------------------------------------------- |
| Singolo processo in background                  | Attività semplice                               |
| Pipeline in più passaggi gestita dal codice del Plugin | Task Flow (gestito)                       |
| Avvio disaccoppiato di ACP o di un sottoagente  | Task Flow (rispecchiato, creato automaticamente) |
| Promemoria una tantum                           | Processo Cron                                   |

## Modalità di sincronizzazione

### Modalità gestita

Un flusso gestito dispone di un controller: codice del Plugin che crea il flusso tramite l'API Task Flow del runtime del Plugin, specificando un obiettivo e un ID controller obbligatorio, quindi lo gestisce esplicitamente.

- Ogni passaggio viene eseguito come attività in background creata nel flusso; la chiave del proprietario e l'origine del richiedente del flusso vengono propagate alle attività figlie.
- Il controller fa avanzare il flusso tra gli stati `running`, `waiting` e terminali e memorizza uno stato JSON arbitrario dei passaggi nel record del flusso.
- Ogni modifica include la revisione prevista del flusso. Una scrittura obsoleta viene rifiutata come conflitto di revisione anziché sovrascrivere uno stato più recente.
- Dopo la richiesta di annullamento, le nuove attività figlie vengono rifiutate e il flusso termina con lo stato `cancelled` quando nessuna attività figlia rimane attiva.

Esempio: un flusso di report settimanale che (1) raccoglie i dati, (2) genera il report e (3) lo consegna, con un'attività in background per ogni passaggio:

```
Flusso: weekly-report
  Passaggio 1: gather-data     → attività creata → riuscita
  Passaggio 2: generate-report → attività creata → riuscita
  Passaggio 3: deliver         → attività creata → in esecuzione
```

### Modalità rispecchiata

OpenClaw crea automaticamente un flusso rispecchiato con una singola attività quando viene avviata un'esecuzione disaccoppiata di ACP o di un sottoagente (attività con ambito di sessione e completamento consegnabile). Il record del flusso rispecchia la singola attività sottostante, inclusi stato, obiettivo e tempistiche, in modo che gli avvii disaccoppiati dispongano di un riferimento stabile al flusso per le superfici di stato e nuovo tentativo senza un controller. I flussi rispecchiati mostrano la modalità di sincronizzazione `task_mirrored` nella CLI.

## Stati dei flussi

| Stato       | Significato                                                                       |
| ----------- | --------------------------------------------------------------------------------- |
| `queued`    | Creato, ma non ancora in avanzamento                                              |
| `running`   | Il flusso sta avanzando attivamente                                               |
| `waiting`   | Il flusso gestito è sospeso in base ai metadati di attesa (timer, evento esterno) |
| `blocked`   | Un passaggio è terminato senza un risultato utilizzabile; `blockedTaskId`/riepilogo indicano quale |
| `succeeded` | Completato correttamente                                                          |
| `failed`    | Completato con un errore                                                          |
| `cancelled` | Annullamento richiesto e tutte le attività figlie terminate                       |
| `lost`      | Il flusso ha perso il proprio stato sottostante autorevole                        |

## Stato persistente e tracciamento delle revisioni

I record dei flussi vengono conservati nel database di stato SQLite condiviso (`~/.openclaw/state/openclaw.sqlite`, tabella `flow_runs`) insieme ai record delle attività, affinché l'avanzamento sopravviva ai riavvii del Gateway. Ogni scrittura incrementa la `revision` del flusso; gli autori concorrenti che specificano una revisione prevista obsoleta ricevono un conflitto e devono rileggere i dati. La crescita del WAL è limitata dai checkpoint automatici di SQLite e da checkpoint passivi periodici, con checkpoint di troncamento durante l'arresto. Il database laterale precedente `flows/registry.sqlite` delle installazioni meno recenti viene importato da `openclaw doctor`.

## Comportamento dell'annullamento

`openclaw tasks flow cancel` imposta nel flusso un'intenzione di annullamento permanente, annulla le attività figlie attive e rifiuta nuove attività figlie gestite. Quando nessuna attività figlia rimane attiva, il flusso termina con lo stato `cancelled`, immediatamente oppure tramite la scansione di manutenzione se le attività figlie richiedono più tempo per terminare. L'intenzione viene conservata, quindi un flusso annullato rimane tale anche se il Gateway viene riavviato prima che tutte le attività figlie siano terminate.

## Comandi CLI

```bash
# Elenca i flussi attivi e recenti
openclaw tasks flow list [--status <status>] [--json]

# Mostra i dettagli di un flusso specifico
openclaw tasks flow show <lookup> [--json]

# Annulla un flusso in esecuzione e le relative attività attive
openclaw tasks flow cancel <lookup>
```

| Comando                           | Descrizione                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------- |
| `openclaw tasks flow list`        | Flussi tracciati con modalità di sincronizzazione, stato, revisione, controller e conteggi delle attività |
| `openclaw tasks flow show <id>`   | Esamina un flusso tramite ID del flusso o chiave del proprietario, incluse le attività collegate |
| `openclaw tasks flow cancel <id>` | Annulla un flusso in esecuzione e le relative attività attive                   |

I flussi sono inclusi anche in `openclaw tasks audit` (rilevamenti di flussi obsoleti o danneggiati) e `openclaw tasks maintenance` (completa gli annullamenti bloccati ed elimina i flussi terminali dopo 7 giorni).

## Schema affidabile per flussi di lavoro pianificati

Per i flussi di lavoro ricorrenti, come i briefing di intelligence di mercato, considera la pianificazione, l'orchestrazione e i controlli di affidabilità come livelli separati:

1. Usa le [attività pianificate](/it/automation/cron-jobs) per la temporizzazione.
2. Usa una sessione Cron persistente quando il flusso di lavoro deve basarsi sul contesto precedente.
3. Usa [Lobster](/it/tools/lobster) per passaggi deterministici, punti di approvazione e token di ripresa.
4. Usa Task Flow per tracciare l'esecuzione in più passaggi tra attività figlie, attese, nuovi tentativi e riavvii del Gateway.

Esempio di struttura Cron:

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

Usa `--session session:<id>` anziché `isolated` quando il flusso di lavoro ricorrente richiede una cronologia deliberata, riepiloghi delle esecuzioni precedenti o un contesto permanente. Usa `isolated` quando ogni esecuzione deve iniziare da zero e tutto lo stato richiesto è esplicito nel flusso di lavoro.

Nel flusso di lavoro, inserisci i controlli di affidabilità prima del passaggio di riepilogo del LLM:

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

- Disponibilità del browser e scelta del profilo, ad esempio `openclaw` per lo stato gestito o `user` quando è richiesta una sessione Chrome con accesso effettuato. Consulta [Browser](/it/tools/browser).
- Credenziali API e quota per ogni fonte.
- Raggiungibilità di rete degli endpoint richiesti.
- Strumenti richiesti abilitati per l'agente, come `lobster`, `browser` e `llm-task`.
- Destinazione degli errori configurata per Cron, affinché gli errori dei controlli preliminari siano visibili. Consulta le [attività pianificate](/it/automation/cron-jobs#delivery-and-output).

Campi consigliati per la provenienza dei dati di ogni elemento raccolto:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Configura il flusso di lavoro affinché rifiuti o contrassegni come obsoleti gli elementi prima del riepilogo. Il passaggio del LLM deve ricevere soltanto JSON strutturato e deve essere istruito a conservare `sourceUrl`, `retrievedAt` e `asOf` nel proprio output. Usa [LLM Task](/it/tools/llm-task) quando è necessario un passaggio del modello con convalida dello schema all'interno del flusso di lavoro.

Per flussi di lavoro riutilizzabili da team o comunità, distribuisci la CLI, i file `.lobster` ed eventuali note di configurazione come Skill o Plugin e pubblicali tramite [ClawHub](/clawhub). Mantieni le misure di protezione specifiche del flusso di lavoro in quel pacchetto, a meno che nell'API del Plugin non manchi una funzionalità generica necessaria.

## Relazione tra flussi e attività

I flussi coordinano le attività, non le sostituiscono. Un singolo flusso può gestire più attività in background durante il proprio ciclo di vita. Usa `openclaw tasks` per esaminare i singoli record delle attività e `openclaw tasks flow` per esaminare il flusso di orchestrazione.

## Argomenti correlati

- [Attività in background](/it/automation/tasks) - il registro del lavoro disaccoppiato coordinato dai flussi
- [CLI: attività](/it/cli/tasks) - riferimento ai comandi CLI per `openclaw tasks flow`
- [Panoramica dell'automazione](/it/automation) - tutti i meccanismi di automazione in sintesi
- [Processi Cron](/it/automation/cron-jobs) - processi pianificati che possono alimentare i flussi
