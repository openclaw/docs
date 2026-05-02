---
read_when:
    - È necessario esaminare l'output grezzo del modello per rilevare perdite di ragionamento
    - Vuoi eseguire il Gateway in modalità watch durante l'iterazione
    - È necessario un flusso di lavoro di debug ripetibile
summary: 'Strumenti di debug: modalità watch, flussi grezzi del modello e tracciamento delle fughe di ragionamento'
title: Debug
x-i18n:
    generated_at: "2026-05-02T08:24:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7e28dd5f352abd8d751def61bb56acb6f22663600effdada14bf4a40214f62b
    source_path: help/debugging.md
    workflow: 16
---

Helper di debug per l'output in streaming, in particolare quando un provider mescola il ragionamento nel testo normale.

## Override di debug a runtime

Usa `/debug` in chat per impostare override di configurazione **solo a runtime** (memoria, non disco).
`/debug` è disabilitato per impostazione predefinita; abilitalo con `commands.debug: true`.
È utile quando devi attivare o disattivare impostazioni poco note senza modificare `openclaw.json`.

Esempi:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` cancella tutti gli override e torna alla configurazione su disco.

## Output della traccia di sessione

Usa `/trace` quando vuoi vedere le righe di traccia/debug di proprietà del plugin in una sessione
senza attivare la modalità verbosa completa.

Esempi:

```text
/trace
/trace on
/trace off
```

Usa `/trace` per la diagnostica dei plugin, come i riepiloghi di debug di Active Memory.
Continua a usare `/verbose` per il normale output verboso di stato/strumenti, e continua a usare
`/debug` per gli override di configurazione solo a runtime.

## Traccia del ciclo di vita del plugin

Usa `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` quando i comandi del ciclo di vita del plugin sembrano lenti
e hai bisogno di una scomposizione integrata delle fasi per metadati del plugin, rilevamento, registro,
mirror di runtime, mutazione della configurazione e lavoro di aggiornamento. La traccia è opt-in e scrive
su stderr, quindi l'output JSON del comando resta analizzabile.

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

Usalo per indagare il ciclo di vita dei plugin prima di ricorrere a un profiler CPU.
Se il comando viene eseguito da un checkout sorgente, preferisci misurare il runtime compilato
con `node dist/entry.js ...` dopo `pnpm build`; `pnpm openclaw ...`
misura anche l'overhead del runner sorgente.

## Temporizzazione temporanea di debug della CLI

OpenClaw mantiene `src/cli/debug-timing.ts` come piccolo helper per indagini locali.
Intenzionalmente non è collegato all'avvio della CLI, al routing dei comandi
o ad alcun comando per impostazione predefinita. Usalo solo mentre esegui il debug di un comando lento, poi
rimuovi import e span prima di integrare la modifica di comportamento.

Usalo quando un comando è lento e ti serve una rapida scomposizione delle fasi prima
di decidere se usare un profiler CPU o correggere un sottosistema specifico.

### Aggiungi span temporanei

Aggiungi l'helper vicino al codice che stai indagando. Per esempio, durante il debug di
`openclaw models list`, una patch temporanea in
`src/commands/models/list.list-command.ts` potrebbe essere così:

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

- Prefissa i nomi delle fasi temporanee con `debug:`.
- Aggiungi solo pochi span attorno alle sezioni sospettate di essere lente.
- Preferisci fasi ampie come `registry`, `auth_store` o `rows` ai nomi degli helper.
- Usa `time()` per il lavoro sincrono e `timeAsync()` per le promise.
- Mantieni stdout pulito. L'helper scrive su stderr, quindi l'output JSON del comando resta
  analizzabile.
- Rimuovi import e span temporanei prima di aprire la PR finale di correzione.
- Includi l'output della temporizzazione o un breve riepilogo nell'issue o nella PR che spiega
  l'ottimizzazione.

### Esegui con output leggibile

La modalità leggibile è la migliore per il debug dal vivo:

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

| Fase                                     |       Tempo | Significato                                                                                             |
| ---------------------------------------- | ----------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |       20.3s | Il caricamento dello store dei profili di autenticazione è il costo maggiore e va indagato per primo.   |
| `debug:models:list:ensure_models_json`   |        5.0s | La sincronizzazione di `models.json` è abbastanza costosa da meritare un'ispezione per caching o condizioni di salto. |
| `debug:models:list:load_model_registry`  |        5.9s | Anche la costruzione del registro e il lavoro sulla disponibilità del provider sono costi significativi. |
| `debug:models:list:read_registry_models` |        2.4s | Leggere tutti i modelli del registro non è gratis e può contare per `--all`.                            |
| fasi di aggiunta delle righe             | 3.2s totali | Costruire cinque righe visualizzate richiede comunque diversi secondi, quindi il percorso di filtro merita uno sguardo più attento. |
| `debug:models:list:print_model_table`    |         0ms | Il rendering non è il collo di bottiglia.                                                               |

Questi risultati sono sufficienti per guidare la patch successiva senza mantenere codice di temporizzazione nei
percorsi di produzione.

### Esegui con output JSON

Usa la modalità JSON quando vuoi salvare o confrontare dati di temporizzazione:

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

### Pulisci prima di integrare

Prima di aprire la PR finale:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

Il comando non dovrebbe restituire alcun sito di chiamata di strumentazione temporanea, a meno che la PR
non stia aggiungendo esplicitamente una superficie diagnostica permanente. Per le normali correzioni di prestazioni,
mantieni solo la modifica di comportamento, i test e una breve nota con le prove di temporizzazione.

Per hotspot CPU più profondi, usa la profilazione Node (`--cpu-prof`) o un profiler esterno
invece di aggiungere altri wrapper di temporizzazione.

## Modalità watch del Gateway

Per iterazioni rapide, esegui il gateway sotto il watcher dei file:

```bash
pnpm gateway:watch
```

Per impostazione predefinita, questo avvia o riavvia una sessione tmux denominata
`openclaw-gateway-watch-main` (o una variante specifica per profilo/porta come
`openclaw-gateway-watch-dev-19001`) e si collega automaticamente dai terminali interattivi.
Shell non interattive, CI e chiamate exec degli agenti restano scollegate e stampano invece
le istruzioni per collegarsi. Collegati manualmente quando serve:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Il pannello tmux esegue il watcher grezzo:

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

Il wrapper tmux porta nel pannello selettori di runtime comuni non segreti come
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` e `OPENCLAW_SKIP_CHANNELS`. Inserisci
le credenziali del provider nel tuo profilo/configurazione normale, oppure usa la modalità grezza in primo piano
per segreti effimeri una tantum.
Il pannello tmux gestito usa anche per impostazione predefinita log del Gateway colorati per leggibilità;
imposta `FORCE_COLOR=0` all'avvio di `pnpm gateway:watch` per disabilitare l'output ANSI.

Il watcher si riavvia sui file rilevanti per la build sotto `src/`, sui file sorgente delle estensioni,
sui metadati `package.json` e `openclaw.plugin.json` delle estensioni, su `tsconfig.json`,
`package.json` e `tsdown.config.ts`. Le modifiche ai metadati delle estensioni riavviano il
gateway senza forzare una rebuild `tsdown`; le modifiche a sorgenti e configurazione continuano
a ricostruire prima `dist`.

Aggiungi eventuali flag CLI del gateway dopo `gateway:watch` e verranno passati a ogni
riavvio. Rieseguire lo stesso comando watch rigenera il pannello tmux nominato, e
il watcher grezzo mantiene comunque il suo lock da singolo watcher, quindi i processi padre watcher duplicati
vengono sostituiti invece di accumularsi.

## Profilo dev + gateway dev (`--dev`)

Usa il profilo dev per isolare lo stato e avviare una configurazione sicura e usa e getta per il
debug. Ci sono **due** flag `--dev`:

- **`--dev` globale (profilo):** isola lo stato sotto `~/.openclaw-dev` e
  imposta per impostazione predefinita la porta del gateway a `19001` (le porte derivate si spostano di conseguenza).
- **`gateway --dev`: dice al Gateway di creare automaticamente una configurazione predefinita +
  workspace** quando mancano (e di saltare BOOTSTRAP.md).

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
   - Scrive una configurazione minima se manca (`gateway.mode=local`, bind local loopback).
   - Imposta `agent.workspace` al workspace dev.
   - Imposta `agent.skipBootstrap=true` (nessun BOOTSTRAP.md).
   - Inizializza i file del workspace se mancano:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identità predefinita: **C3‑PO** (droide protocollare).
   - Salta i provider di canale in modalità dev (`OPENCLAW_SKIP_CHANNELS=1`).

Flusso di reset (nuovo avvio):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` è un flag di profilo **globale** e viene consumato da alcuni runner. Se devi esplicitarlo, usa la forma con variabile env:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` elimina configurazione, credenziali, sessioni e workspace dev (usando
`trash`, non `rm`), poi ricrea la configurazione dev predefinita.

<Tip>
Se un gateway non dev è già in esecuzione (launchd o systemd), fermalo prima:

```bash
openclaw gateway stop
```

</Tip>

## Logging dello stream grezzo (OpenClaw)

OpenClaw può registrare il **flusso grezzo dell'assistente** prima di qualsiasi filtro/formattazione.
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

Variabili d'ambiente equivalenti:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

File predefinito:

`~/.openclaw/logs/raw-stream.jsonl`

## Registrazione dei chunk grezzi (pi-mono)

Per acquisire **chunk grezzi compatibili con OpenAI** prima che vengano analizzati in blocchi,
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

## Note sulla sicurezza

- I log del flusso grezzo possono includere prompt completi, output degli strumenti e dati utente.
- Mantieni i log in locale ed eliminali dopo il debug.
- Se condividi i log, prima rimuovi segreti e PII.

## Correlati

- [Risoluzione dei problemi](/it/help/troubleshooting)
- [FAQ](/it/help/faq)
