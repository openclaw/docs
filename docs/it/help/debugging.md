---
read_when:
    - Devi ispezionare l'output grezzo del modello per individuare perdite di ragionamento
    - Vuoi eseguire il Gateway in modalità watch durante l'iterazione
    - Hai bisogno di un flusso di lavoro di debugging ripetibile
summary: 'Strumenti di debug: modalità watch, stream grezzi del modello e tracciamento delle perdite di ragionamento'
title: Debugging
x-i18n:
    generated_at: "2026-04-24T08:43:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d52070204e21cd7e5bff565fadab96fdeee0ad906c4c8601572761a096d9025
    source_path: help/debugging.md
    workflow: 15
---

Questa pagina copre gli helper di debugging per l'output in streaming, soprattutto quando un
provider mescola il ragionamento nel testo normale.

## Override di debug runtime

Usa `/debug` in chat per impostare override di configurazione **solo runtime** (in memoria, non su disco).
`/debug` è disabilitato per impostazione predefinita; abilitalo con `commands.debug: true`.
È utile quando devi attivare o disattivare impostazioni poco comuni senza modificare `openclaw.json`.

Esempi:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` cancella tutti gli override e torna alla configurazione su disco.

## Output trace della sessione

Usa `/trace` quando vuoi vedere in una sessione le righe trace/debug gestite dal Plugin
senza attivare la modalità verbose completa.

Esempi:

```text
/trace
/trace on
/trace off
```

Usa `/trace` per la diagnostica dei Plugin come i riepiloghi di debug di Active Memory.
Continua a usare `/verbose` per il normale output verbose di stato/strumenti e continua a usare
`/debug` per gli override di configurazione solo runtime.

## Timing di debug CLI temporaneo

OpenClaw mantiene `src/cli/debug-timing.ts` come piccolo helper per indagini
locali. Intenzionalmente non è collegato all'avvio della CLI, all'instradamento dei comandi
o a nessun comando per impostazione predefinita. Usalo solo mentre esegui il debug di un comando lento, poi
rimuovi l'import e gli span prima di pubblicare la modifica di comportamento.

Usalo quando un comando è lento e hai bisogno di una rapida scomposizione per fasi prima di
decidere se usare un profiler CPU o correggere un sottosistema specifico.

### Aggiungere span temporanei

Aggiungi l'helper vicino al codice che stai analizzando. Per esempio, durante il debug di
`openclaw models list`, una patch temporanea in
`src/commands/models/list.list-command.ts` potrebbe essere così:

```ts
// Solo debugging temporaneo. Rimuovere prima della pubblicazione.
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

Linee guida:

- Anteponi ai nomi delle fasi temporanee il prefisso `debug:`.
- Aggiungi solo pochi span attorno alle sezioni sospettate di essere lente.
- Preferisci fasi ampie come `registry`, `auth_store` o `rows` invece dei nomi degli helper.
- Usa `time()` per lavoro sincrono e `timeAsync()` per promise.
- Mantieni stdout pulito. L'helper scrive su stderr, così l'output JSON del comando resta analizzabile.
- Rimuovi import e span temporanei prima di aprire la PR finale.
- Includi l'output dei tempi o un breve riepilogo nell'issue o nella PR che spiega l'ottimizzazione.

### Eseguire con output leggibile

La modalità leggibile è la migliore per il debug live:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

Esempio di output da un'indagine temporanea su `models list`:

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

Risultati da questo output:

| Fase                                     |     Tempo | Cosa significa                                                                                           |
| ---------------------------------------- | --------: | -------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |     20.3s | Il caricamento del negozio auth-profile è il costo maggiore e va investigato per primo.                |
| `debug:models:list:ensure_models_json`   |      5.0s | La sincronizzazione di `models.json` è abbastanza costosa da meritare un'analisi di cache o skip condition. |
| `debug:models:list:load_model_registry`  |      5.9s | Anche la costruzione del registry e il lavoro di disponibilità del provider hanno costi significativi. |
| `debug:models:list:read_registry_models` |      2.4s | Leggere tutti i modelli del registry non è gratis e può contare per `--all`.                           |
| fasi di append delle righe               | 3.2s totali | Costruire cinque righe visualizzate richiede comunque diversi secondi, quindi il percorso di filtro merita un esame più approfondito. |
| `debug:models:list:print_model_table`    |       0ms | Il rendering non è il collo di bottiglia.                                                               |

Questi risultati bastano per guidare la patch successiva senza mantenere il codice di timing
nei percorsi di produzione.

### Eseguire con output JSON

Usa la modalità JSON quando vuoi salvare o confrontare i dati di timing:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

Ogni riga stderr è un oggetto JSON:

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### Pulizia prima della pubblicazione

Prima di aprire la PR finale:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

Il comando non deve restituire call site di strumentazione temporanea a meno che la PR
non stia esplicitamente aggiungendo una superficie diagnostica permanente. Per le normali
correzioni di prestazioni, mantieni solo il cambiamento di comportamento, i test e una breve nota con l'evidenza dei tempi.

Per hotspot CPU più profondi, usa il profiling Node (`--cpu-prof`) o un profiler
esterno invece di aggiungere altri wrapper di timing.

## Modalità watch del Gateway

Per un'iterazione rapida, esegui il gateway sotto il file watcher:

```bash
pnpm gateway:watch
```

Questo corrisponde a:

```bash
node scripts/watch-node.mjs gateway --force
```

Il watcher riavvia in caso di file rilevanti per la build sotto `src/`, file sorgente delle estensioni,
`package.json` delle estensioni e metadati `openclaw.plugin.json`, `tsconfig.json`,
`package.json` e `tsdown.config.ts`. Le modifiche ai metadati delle estensioni riavviano il
gateway senza forzare una ricostruzione `tsdown`; le modifiche a sorgenti e configurazione
ricostruiscono comunque prima `dist`.

Aggiungi eventuali flag CLI del gateway dopo `gateway:watch` e verranno passati a ogni
riavvio. Rieseguire lo stesso comando watch per la stessa combinazione repo/flag ora
sostituisce il watcher precedente invece di lasciare watcher parent duplicati.

## Profilo dev + gateway dev (`--dev`)

Usa il profilo dev per isolare lo stato e avviare una configurazione sicura e usa-e-getta per il
debugging. Esistono **due** flag `--dev`:

- **Globale `--dev` (profilo):** isola lo stato sotto `~/.openclaw-dev` e
  imposta come predefinita la porta del gateway a `19001` (le porte derivate si spostano con essa).
- **`gateway --dev`**: dice al Gateway di creare automaticamente una configurazione + workspace predefiniti
  quando mancano (e saltare `BOOTSTRAP.md`).

Flusso consigliato (profilo dev + bootstrap dev):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Se non hai ancora un'installazione globale, esegui la CLI tramite `pnpm openclaw ...`.

Cosa fa:

1. **Isolamento del profilo** (globale `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas si spostano di conseguenza)

2. **Bootstrap dev** (`gateway --dev`)
   - Scrive una configurazione minima se manca (`gateway.mode=local`, bind loopback).
   - Imposta `agent.workspace` al workspace dev.
   - Imposta `agent.skipBootstrap=true` (nessun `BOOTSTRAP.md`).
   - Inizializza i file del workspace se mancano:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identità predefinita: **C3‑PO** (droide protocollo).
   - Salta i provider di canale in modalità dev (`OPENCLAW_SKIP_CHANNELS=1`).

Flusso di reset (ripartenza pulita):

```bash
pnpm gateway:dev:reset
```

Nota: `--dev` è un flag di profilo **globale** e viene intercettato da alcuni runner.
Se devi specificarlo esplicitamente, usa la forma con variabile d'ambiente:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` cancella configurazione, credenziali, sessioni e il workspace dev (usando
`trash`, non `rm`), poi ricrea la configurazione dev predefinita.

Suggerimento: se un gateway non-dev è già in esecuzione (launchd/systemd), fermalo prima:

```bash
openclaw gateway stop
```

## Logging dello stream grezzo (OpenClaw)

OpenClaw può registrare lo **stream grezzo dell'assistente** prima di qualsiasi filtro/formattazione.
Questo è il modo migliore per vedere se il ragionamento arriva come delta di testo semplice
(o come blocchi di thinking separati).

Abilitalo via CLI:

```bash
pnpm gateway:watch --raw-stream
```

Override facoltativo del percorso:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Variabili d'ambiente equivalenti:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

File predefinito:

`~/.openclaw/logs/raw-stream.jsonl`

## Logging dei chunk grezzi (pi-mono)

Per acquisire i **chunk raw OpenAI-compat** prima che vengano analizzati in blocchi,
pi-mono espone un logger separato:

```bash
PI_RAW_STREAM=1
```

Percorso facoltativo:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

File predefinito:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Nota: questo viene emesso solo dai processi che usano il provider
> `openai-completions` di pi-mono.

## Note di sicurezza

- I log dello stream grezzo possono includere prompt completi, output degli strumenti e dati utente.
- Mantieni i log in locale ed eliminali dopo il debugging.
- Se condividi i log, rimuovi prima segreti e PII.

## Correlati

- [Risoluzione dei problemi](/it/help/troubleshooting)
- [FAQ](/it/help/faq)
