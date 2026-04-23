---
read_when:
    - Devi ispezionare l'output raw del modello per individuare perdite di ragionamento
    - Vuoi eseguire il Gateway in modalità watch mentre fai iterazioni
    - Hai bisogno di un flusso di lavoro di debugging ripetibile
summary: 'Strumenti di debug: modalità watch, stream raw del modello e tracciamento delle perdite di ragionamento'
title: Debugging
x-i18n:
    generated_at: "2026-04-23T08:29:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45f1c55268c02d2d52abf348760d1e00e7536788c3a9aa77854692c4d964fb6e
    source_path: help/debugging.md
    workflow: 15
---

# Debugging

Questa pagina copre gli helper di debugging per l'output in streaming, specialmente quando un
provider mescola il ragionamento nel normale testo.

## Override di debug del runtime

Usa `/debug` in chat per impostare override di config **solo runtime** (in memoria, non su disco).
`/debug` è disabilitato per impostazione predefinita; abilitalo con `commands.debug: true`.
Questo è utile quando devi attivare o disattivare impostazioni poco comuni senza modificare `openclaw.json`.

Esempi:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` cancella tutti gli override e torna alla config su disco.

## Output di trace della sessione

Usa `/trace` quando vuoi vedere righe di trace/debug gestite dal Plugin in una sessione
senza attivare la modalità verbose completa.

Esempi:

```text
/trace
/trace on
/trace off
```

Usa `/trace` per la diagnostica dei plugin, come i riepiloghi di debug di Active Memory.
Continua a usare `/verbose` per il normale output verbose di stato/strumenti e continua a usare
`/debug` per gli override di config solo runtime.

## Timing di debug CLI temporaneo

OpenClaw mantiene `src/cli/debug-timing.ts` come piccolo helper per
l'analisi locale. Intenzionalmente non è collegato all'avvio della CLI, all'instradamento dei comandi
o a nessun comando per impostazione predefinita. Usalo solo mentre esegui il debug di un comando lento, poi
rimuovi l'import e gli span prima di pubblicare la modifica di comportamento.

Usalo quando un comando è lento e ti serve una rapida scomposizione per fasi prima di
decidere se usare un profiler CPU o correggere un sottosistema specifico.

### Aggiungi span temporanei

Aggiungi l'helper vicino al codice che stai analizzando. Ad esempio, mentre fai il debug di
`openclaw models list`, una patch temporanea in
`src/commands/models/list.list-command.ts` potrebbe essere così:

```ts
// Solo per debugging temporaneo. Rimuovere prima di pubblicare.
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

- Prefissa i nomi delle fasi temporanee con `debug:`.
- Aggiungi solo pochi span attorno alle sezioni sospettate di essere lente.
- Preferisci fasi ampie come `registry`, `auth_store` o `rows` invece dei
  nomi degli helper.
- Usa `time()` per lavoro sincrono e `timeAsync()` per promise.
- Mantieni pulito stdout. L'helper scrive su stderr, quindi l'output JSON del comando resta
  analizzabile.
- Rimuovi import e span temporanei prima di aprire la PR finale.
- Includi l'output del timing o un breve riepilogo nel problema o nella PR che spiega
  l'ottimizzazione.

### Esegui con output leggibile

La modalità leggibile è la migliore per il debug dal vivo:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

Esempio di output da un'analisi temporanea di `models list`:

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

Risultati di questo output:

| Fase                                     |    Tempo | Cosa significa                                                                                           |
| ---------------------------------------- | -------: | -------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |    20.3s | Il caricamento dell'archivio dei profili auth è il costo maggiore e dovrebbe essere analizzato per primo. |
| `debug:models:list:ensure_models_json`   |     5.0s | La sincronizzazione di `models.json` è abbastanza costosa da meritare un'analisi su cache o condizioni di salto. |
| `debug:models:list:load_model_registry`  |     5.9s | Anche la costruzione del registro e il lavoro sulla disponibilità dei provider hanno costi significativi. |
| `debug:models:list:read_registry_models` |     2.4s | Leggere tutti i modelli del registro non è gratuito e può contare per `--all`.                          |
| fasi di aggiunta righe                   | 3.2s totali | Costruire cinque righe visualizzate richiede comunque diversi secondi, quindi il percorso di filtro merita un'analisi più attenta. |
| `debug:models:list:print_model_table`    |      0ms | Il rendering non è il collo di bottiglia.                                                                |

Questi risultati sono sufficienti per guidare la patch successiva senza mantenere codice di timing
nei percorsi di produzione.

### Esegui con output JSON

Usa la modalità JSON quando vuoi salvare o confrontare dati di timing:

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

### Ripulisci prima di pubblicare

Prima di aprire la PR finale:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

Il comando non dovrebbe restituire siti di chiamata di strumentazione temporanea, a meno che la PR
non stia esplicitamente aggiungendo una surface diagnostica permanente. Per le normali correzioni di
prestazioni, mantieni solo la modifica di comportamento, i test e una breve nota con le prove di timing.

Per hotspot CPU più profondi, usa il profiling Node (`--cpu-prof`) o un profiler
esterno invece di aggiungere altri wrapper di timing.

## Modalità watch del Gateway

Per iterazioni rapide, esegui il gateway con il file watcher:

```bash
pnpm gateway:watch
```

Questo corrisponde a:

```bash
node scripts/watch-node.mjs gateway --force
```

Il watcher riavvia per file rilevanti per la build sotto `src/`, file sorgente delle estensioni,
`package.json` delle estensioni e metadati `openclaw.plugin.json`, `tsconfig.json`,
`package.json` e `tsdown.config.ts`. Le modifiche ai metadati delle estensioni riavviano il
gateway senza forzare una ricompilazione `tsdown`; le modifiche ai sorgenti e alla config
ricompilano comunque prima `dist`.

Aggiungi eventuali flag CLI del gateway dopo `gateway:watch` e verranno passati a ogni
riavvio. Rieseguire lo stesso comando watch per lo stesso insieme repo/flag ora
sostituisce il watcher precedente invece di lasciare processi watcher duplicati.

## Profilo dev + gateway dev (`--dev`)

Usa il profilo dev per isolare lo stato e avviare una configurazione sicura e usa e getta per il
debugging. Esistono **due** flag `--dev`:

- **`--dev` globale (profilo):** isola lo stato sotto `~/.openclaw-dev` e
  imposta come predefinita la porta gateway su `19001` (le porte derivate si spostano di conseguenza).
- **`gateway --dev`: dice al Gateway di creare automaticamente una config + workspace predefiniti**
  se mancanti (e di saltare BOOTSTRAP.md).

Flusso consigliato (profilo dev + bootstrap dev):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Se non hai ancora un'installazione globale, esegui la CLI tramite `pnpm openclaw ...`.

Cosa fa:

1. **Isolamento del profilo** (`--dev` globale)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas si spostano di conseguenza)

2. **Bootstrap dev** (`gateway --dev`)
   - Scrive una config minima se manca (`gateway.mode=local`, bind loopback).
   - Imposta `agent.workspace` sul workspace dev.
   - Imposta `agent.skipBootstrap=true` (nessun BOOTSTRAP.md).
   - Inizializza i file del workspace se mancanti:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identità predefinita: **C3‑PO** (droide protocollare).
   - Salta i provider di canale in modalità dev (`OPENCLAW_SKIP_CHANNELS=1`).

Flusso di reset (nuovo inizio):

```bash
pnpm gateway:dev:reset
```

Nota: `--dev` è un flag di profilo **globale** e viene intercettato da alcuni runner.
Se devi esplicitarlo, usa la forma con variabile env:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` cancella config, credenziali, sessioni e workspace dev (usando
`trash`, non `rm`), poi ricrea la configurazione dev predefinita.

Suggerimento: se un gateway non-dev è già in esecuzione (launchd/systemd), fermalo prima:

```bash
openclaw gateway stop
```

## Logging dello stream raw (OpenClaw)

OpenClaw può registrare lo **stream raw dell'assistente** prima di qualsiasi filtro/formattazione.
Questo è il modo migliore per vedere se il ragionamento arriva come delta di testo semplice
(o come blocchi di thinking separati).

Abilitalo tramite CLI:

```bash
pnpm gateway:watch --raw-stream
```

Override facoltativo del percorso:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Variabili env equivalenti:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

File predefinito:

`~/.openclaw/logs/raw-stream.jsonl`

## Logging dei chunk raw (pi-mono)

Per catturare **chunk compatibili OpenAI raw** prima che vengano analizzati in blocchi,
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

- I log dello stream raw possono includere prompt completi, output degli strumenti e dati utente.
- Mantieni i log in locale ed eliminali dopo il debugging.
- Se condividi i log, rimuovi prima segreti e PII.
