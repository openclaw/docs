---
read_when:
    - Devi esaminare l'output grezzo del modello per individuare eventuali fughe di ragionamento
    - Vuoi eseguire il Gateway in modalità watch durante l'iterazione
    - Serve un flusso di lavoro di debug ripetibile
summary: 'Strumenti di debug: modalità di monitoraggio, stream grezzi del modello e tracciamento delle fughe di ragionamento'
title: Diagnostica
x-i18n:
    generated_at: "2026-04-30T08:55:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3c4ba151cf1ef1dd689077cee93467b7bc77b765665231028941a345b5345ea
    source_path: help/debugging.md
    workflow: 16
---

Helper di debug per l'output in streaming, specialmente quando un provider mescola il ragionamento al testo normale.

## Override di debug a runtime

Usa `/debug` in chat per impostare override di configurazione **solo runtime** (memoria, non disco).
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

## Output di trace della sessione

Usa `/trace` quando vuoi vedere righe di trace/debug di proprietà del plugin in una sessione
senza attivare la modalità verbose completa.

Esempi:

```text
/trace
/trace on
/trace off
```

Usa `/trace` per la diagnostica dei plugin, come i riepiloghi di debug di Active Memory.
Continua a usare `/verbose` per il normale output verbose di stato/strumenti, e continua a usare
`/debug` per gli override di configurazione solo runtime.

## Trace del ciclo di vita del plugin

Usa `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` quando i comandi del ciclo di vita del plugin sembrano lenti
e ti serve una scomposizione integrata per fasi per metadati del plugin, discovery, registro,
mirror runtime, mutazione della configurazione e lavoro di refresh. Il trace è opt-in e scrive
su stderr, quindi l'output JSON del comando resta parsabile.

Esempio:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

Output di esempio:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Usalo per l'indagine sul ciclo di vita del plugin prima di ricorrere a un profiler CPU.
Se il comando viene eseguito da un checkout sorgente, preferisci misurare il runtime compilato
con `node dist/entry.js ...` dopo `pnpm build`; `pnpm openclaw ...`
misura anche l'overhead del source-runner.

## Timing di debug temporaneo della CLI

OpenClaw mantiene `src/cli/debug-timing.ts` come piccolo helper per le indagini locali.
Intenzionalmente non è collegato all'avvio della CLI, al routing dei comandi
o ad alcun comando per impostazione predefinita. Usalo solo durante il debug di un comando lento, poi
rimuovi l'import e gli span prima di integrare la modifica di comportamento.

Usalo quando un comando è lento e ti serve una rapida scomposizione per fasi prima
di decidere se usare un profiler CPU o correggere un sottosistema specifico.

### Aggiungi span temporanei

Aggiungi l'helper vicino al codice che stai analizzando. Per esempio, durante il debug di
`openclaw models list`, una patch temporanea in
`src/commands/models/list.list-command.ts` potrebbe apparire così:

```ts
// Temporary debugging only. Remove before landing.
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

- Prefissa i nomi di fase temporanei con `debug:`.
- Aggiungi solo pochi span attorno alle sezioni sospettate di essere lente.
- Preferisci fasi ampie come `registry`, `auth_store` o `rows` rispetto ai nomi degli helper.
- Usa `time()` per il lavoro sincrono e `timeAsync()` per le promise.
- Mantieni stdout pulito. L'helper scrive su stderr, quindi l'output JSON del comando resta
  parsabile.
- Rimuovi import e span temporanei prima di aprire la PR di correzione finale.
- Includi l'output del timing o un breve riepilogo nell'issue o nella PR che spiega
  l'ottimizzazione.

### Esegui con output leggibile

La modalità leggibile è la migliore per il debug live:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

Output di esempio da un'indagine temporanea su `models list`:

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

| Fase                                     |       Tempo | Cosa significa                                                                                          |
| ---------------------------------------- | ----------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |       20.3s | Il caricamento dello store dei profili di autenticazione è il costo maggiore e va analizzato per primo. |
| `debug:models:list:ensure_models_json`   |        5.0s | La sincronizzazione di `models.json` è abbastanza costosa da meritare un'ispezione di caching o condizioni di salto. |
| `debug:models:list:load_model_registry`  |        5.9s | Anche la costruzione del registro e il lavoro sulla disponibilità dei provider sono costi significativi. |
| `debug:models:list:read_registry_models` |        2.4s | Leggere tutti i modelli del registro non è gratuito e può contare per `--all`.                          |
| fasi di append delle righe               | 3.2s totale | Costruire cinque righe visualizzate richiede comunque diversi secondi, quindi il percorso di filtro merita un'analisi più attenta. |
| `debug:models:list:print_model_table`    |         0ms | Il rendering non è il collo di bottiglia.                                                               |

Questi risultati bastano a guidare la patch successiva senza mantenere codice di timing nei
percorsi di produzione.

### Esegui con output JSON

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

### Pulisci prima del merge

Prima di aprire la PR finale:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

Il comando non dovrebbe restituire call site di strumentazione temporanea, a meno che la PR
non stia aggiungendo esplicitamente una superficie diagnostica permanente. Per le normali correzioni
prestazionali, mantieni solo la modifica di comportamento, i test e una breve nota con le prove
di timing.

Per hotspot CPU più profondi, usa il profiling di Node (`--cpu-prof`) o un profiler
esterno invece di aggiungere altri wrapper di timing.

## Modalità watch del Gateway

Per iterare rapidamente, esegui il gateway sotto il file watcher:

```bash
pnpm gateway:watch
```

Per impostazione predefinita, questo avvia o riavvia una sessione tmux chiamata
`openclaw-gateway-watch-main` (o una variante specifica per profilo/porta come
`openclaw-gateway-watch-dev-19001`) e si collega automaticamente dai terminali interattivi.
Shell non interattive, CI e chiamate exec degli agenti restano scollegate e stampano invece
le istruzioni per collegarsi. Collegati manualmente quando serve:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Il riquadro tmux esegue il watcher grezzo:

```bash
node scripts/watch-node.mjs gateway --force
```

Usa la modalità in primo piano quando tmux non è desiderato:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Disabilita l'auto-attach mantenendo la gestione tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Il wrapper tmux porta nel riquadro i selettori runtime comuni non segreti, come
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` e `OPENCLAW_SKIP_CHANNELS`. Metti
le credenziali dei provider nel tuo profilo/configurazione normale, oppure usa la modalità grezza in primo piano
per segreti effimeri una tantum.

Il watcher si riavvia sui file rilevanti per la build sotto `src/`, sui file sorgente delle estensioni,
sui metadati `package.json` e `openclaw.plugin.json` delle estensioni, su `tsconfig.json`,
`package.json` e `tsdown.config.ts`. Le modifiche ai metadati delle estensioni riavviano il
gateway senza forzare una rebuild `tsdown`; le modifiche a sorgenti e configurazione continuano
a ricostruire prima `dist`.

Aggiungi eventuali flag CLI del gateway dopo `gateway:watch` e saranno passati a ogni
riavvio. Rieseguire lo stesso comando watch respawna il riquadro tmux denominato, e
il watcher grezzo mantiene comunque il suo lock da watcher singolo, quindi i genitori watcher duplicati
vengono sostituiti invece di accumularsi.

## Profilo dev + Gateway dev (--dev)

Usa il profilo dev per isolare lo stato e avviare una configurazione sicura e usa e getta per
il debug. Ci sono **due** flag `--dev`:

- **`--dev` globale (profilo):** isola lo stato sotto `~/.openclaw-dev` e
  imposta la porta predefinita del gateway a `19001` (le porte derivate si spostano con essa).
- **`gateway --dev`: indica al Gateway di creare automaticamente una configurazione +
  workspace predefiniti** quando mancanti (e saltare BOOTSTRAP.md).

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
   - Scrive una configurazione minima se manca (`gateway.mode=local`, bind loopback).
   - Imposta `agent.workspace` sul workspace dev.
   - Imposta `agent.skipBootstrap=true` (nessun BOOTSTRAP.md).
   - Inizializza i file del workspace se mancanti:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identità predefinita: **C3‑PO** (droide protocollare).
   - Salta i provider di canale in modalità dev (`OPENCLAW_SKIP_CHANNELS=1`).

Flusso di reset (nuovo avvio):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` è un flag di profilo **globale** e alcuni runner lo consumano. Se devi esplicitarlo, usa la forma con variabile d'ambiente:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` cancella configurazione, credenziali, sessioni e il workspace dev (usando
`trash`, non `rm`), poi ricrea la configurazione dev predefinita.

<Tip>
Se un gateway non dev è già in esecuzione (launchd o systemd), fermalo prima:

```bash
openclaw gateway stop
```

</Tip>

## Logging dello stream grezzo (OpenClaw)

OpenClaw può registrare lo **stream grezzo dell'assistente** prima di qualsiasi filtro/formattazione.
Questo è il modo migliore per vedere se il ragionamento arriva come delta di testo semplice
(o come blocchi di pensiero separati).

Abilitalo tramite CLI:

```bash
pnpm gateway:watch --raw-stream
```

Override opzionale del percorso:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Variabili d’ambiente equivalenti:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

File predefinito:

`~/.openclaw/logs/raw-stream.jsonl`

## Registrazione dei chunk grezzi (pi-mono)

Per acquisire i **chunk grezzi compatibili con OpenAI** prima che vengano analizzati in blocchi,
pi-mono espone un logger separato:

```bash
PI_RAW_STREAM=1
```

Percorso opzionale:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

File predefinito:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Nota: viene emesso solo dai processi che usano il provider
> `openai-completions` di pi-mono.

## Note di sicurezza

- I log del flusso grezzo possono includere prompt completi, output degli strumenti e dati utente.
- Mantieni i log in locale ed eliminali dopo il debug.
- Se condividi i log, rimuovi prima segreti e PII.

## Correlati

- [Risoluzione dei problemi](/it/help/troubleshooting)
- [FAQ](/it/help/faq)
