---
read_when:
    - È necessario esaminare il risultato grezzo del modello per individuare fughe di ragionamento
    - Vuoi eseguire il Gateway in modalità di monitoraggio durante le iterazioni
    - È necessario un flusso di lavoro di debug ripetibile
summary: 'Strumenti di debug: modalità di monitoraggio, flussi grezzi del modello e tracciamento delle perdite di ragionamento'
title: Diagnostica
x-i18n:
    generated_at: "2026-05-05T01:47:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d86bd9b5dd08615d3c283f3fcb2a885f5134fa7e1cdece86b6a796d08a659ec
    source_path: help/debugging.md
    workflow: 16
---

Helper di debug per l’output in streaming, specialmente quando un provider mescola il ragionamento nel testo normale.

## Override di debug runtime

Usa `/debug` in chat per impostare override di configurazione **solo runtime** (memoria, non disco).
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

## Output di trace della sessione

Usa `/trace` quando vuoi vedere righe di trace/debug di proprietà dei Plugin in una sessione
senza attivare la modalità verbose completa.

Esempi:

```text
/trace
/trace on
/trace off
```

Usa `/trace` per la diagnostica dei Plugin, ad esempio i riepiloghi di debug di Active Memory.
Continua a usare `/verbose` per il normale output verbose di stato/strumenti e continua a usare
`/debug` per gli override di configurazione solo runtime.

## Trace del ciclo di vita dei Plugin

Usa `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` quando i comandi del ciclo di vita dei Plugin sembrano lenti
e ti serve una scomposizione integrata delle fasi per metadati dei Plugin, discovery, registro,
mirror runtime, mutazione della configurazione e lavoro di refresh. Il trace è opt-in e scrive
su stderr, quindi l’output JSON dei comandi resta analizzabile.

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

Usalo per indagare il ciclo di vita dei Plugin prima di ricorrere a un profiler CPU.
Se il comando viene eseguito da un checkout dei sorgenti, preferisci misurare il runtime
compilato con `node dist/entry.js ...` dopo `pnpm build`; `pnpm openclaw ...`
misura anche l’overhead del source runner.

## Startup della CLI e profiling dei comandi

Usa il benchmark di startup incluso nel repository quando un comando sembra lento:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Per un profiling una tantum tramite il normale source runner, imposta
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Il source runner aggiunge i flag del profilo CPU di Node e scrive un `.cpuprofile` per il
comando. Usalo prima di aggiungere strumentazione temporanea al codice del comando.

Per blocchi di startup che sembrano lavoro sincrono del filesystem o del module loader,
aggiungi il flag di trace I/O sincrono di Node tramite il source runner:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` abilita questo flag per impostazione predefinita per il processo figlio Gateway osservato.
Imposta `OPENCLAW_TRACE_SYNC_IO=0` per sopprimere l’output di trace I/O sincrono di Node in modalità watch.

## Modalità watch del Gateway

Per iterazioni rapide, esegui il Gateway sotto il file watcher:

```bash
pnpm gateway:watch
```

Per impostazione predefinita, questo avvia o riavvia una sessione tmux chiamata
`openclaw-gateway-watch-main` (o una variante specifica per profilo/porta come
`openclaw-gateway-watch-dev-19001`) e si collega automaticamente dai terminali interattivi.
Shell non interattive, CI e chiamate exec degli agenti restano scollegate e stampano invece
le istruzioni per collegarsi. Collegati manualmente quando necessario:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Il riquadro tmux esegue il watcher grezzo:

```bash
node scripts/watch-node.mjs gateway --force
```

Usa la modalità foreground quando non vuoi tmux:

```bash
pnpm gateway:watch:raw
# oppure
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Disabilita l’auto-attach mantenendo la gestione tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profila il tempo CPU del Gateway osservato durante il debug di hotspot di startup/runtime:

```bash
pnpm gateway:watch --benchmark
```

Il wrapper watch consuma `--benchmark` prima di invocare il Gateway e scrive
un `.cpuprofile` V8 per ogni uscita del processo figlio Gateway sotto
`.artifacts/gateway-watch-profiles/`. Arresta o riavvia il gateway osservato per
scaricare il profilo corrente, poi aprilo con Chrome DevTools o Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Usa `--benchmark-dir <path>` quando vuoi i profili altrove.
Usa `--benchmark-no-force` quando vuoi che il processo figlio sottoposto a benchmark salti la
pulizia predefinita della porta `--force` e fallisca rapidamente se la porta del Gateway è già in
uso.
La modalità benchmark sopprime per impostazione predefinita il rumore del trace sync-I/O. Imposta
`OPENCLAW_TRACE_SYNC_IO=1` con `--benchmark` quando vuoi esplicitamente sia i profili CPU
sia gli stack trace sync-I/O di Node. In modalità benchmark questi blocchi di trace
vengono scritti in `gateway-watch-output.log` sotto la directory del benchmark e
filtrati dal riquadro del terminale; i normali log del Gateway restano visibili.

Il wrapper tmux trasferisce nel riquadro i selettori runtime comuni non segreti, come
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` e `OPENCLAW_SKIP_CHANNELS`. Inserisci
le credenziali dei provider nel tuo profilo/configurazione normale, oppure usa la modalità foreground grezza
per segreti effimeri una tantum.
Se il Gateway osservato esce durante lo startup, il watcher esegue
`openclaw doctor --fix --non-interactive` una volta e riavvia il processo figlio Gateway.
Usa `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` quando vuoi l’errore di startup originale
senza il passaggio di riparazione solo dev.
Il riquadro tmux gestito usa inoltre per impostazione predefinita log Gateway colorati per leggibilità;
imposta `FORCE_COLOR=0` quando avvii `pnpm gateway:watch` per disabilitare l’output ANSI.

Il watcher si riavvia sui file rilevanti per la build sotto `src/`, sui file sorgente delle estensioni,
sui metadati `package.json` e `openclaw.plugin.json` delle estensioni, `tsconfig.json`,
`package.json` e `tsdown.config.ts`. Le modifiche ai metadati delle estensioni riavviano il
gateway senza forzare una rebuild `tsdown`; modifiche a sorgenti e configurazione
ricompilano comunque prima `dist`.

Aggiungi eventuali flag CLI del gateway dopo `gateway:watch` e verranno passati a ogni
riavvio. Rieseguire lo stesso comando watch rigenera il riquadro tmux nominato, e
il watcher grezzo mantiene comunque il suo lock a watcher singolo, così i parent watcher duplicati
vengono sostituiti invece di accumularsi.

## Profilo dev + gateway dev (--dev)

Usa il profilo dev per isolare lo stato e avviare una configurazione sicura e usa e getta per
il debug. Ci sono **due** flag `--dev`:

- **`--dev` globale (profilo):** isola lo stato sotto `~/.openclaw-dev` e
  imposta per impostazione predefinita la porta del gateway a `19001` (le porte derivate si spostano con essa).
- **`gateway --dev`: indica al Gateway di creare automaticamente una configurazione predefinita +
  workspace** quando mancano (e di saltare BOOTSTRAP.md).

Flusso consigliato (profilo dev + bootstrap dev):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Se non hai ancora un’installazione globale, esegui la CLI tramite `pnpm openclaw ...`.

Cosa fa:

1. **Isolamento del profilo** (`--dev` globale)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas si spostano di conseguenza)

2. **Bootstrap dev** (`gateway --dev`)
   - Scrive una configurazione minima se manca (`gateway.mode=local`, bind loopback).
   - Imposta `agent.workspace` al workspace dev.
   - Imposta `agent.skipBootstrap=true` (nessun BOOTSTRAP.md).
   - Crea i file del workspace se mancano:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identità predefinita: **C3‑PO** (droide protocollare).
   - Salta i provider di canale in modalità dev (`OPENCLAW_SKIP_CHANNELS=1`).

Flusso di reset (nuovo avvio):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` è un flag di profilo **globale** e viene consumato da alcuni runner. Se devi esplicitarlo, usa la forma con variabile d’ambiente:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` cancella configurazione, credenziali, sessioni e workspace dev (usando
`trash`, non `rm`), quindi ricrea la configurazione dev predefinita.

<Tip>
Se è già in esecuzione un gateway non dev (launchd o systemd), arrestalo prima:

```bash
openclaw gateway stop
```

</Tip>

## Logging dello stream grezzo (OpenClaw)

OpenClaw può registrare lo **stream grezzo dell’assistente** prima di qualsiasi filtraggio/formattazione.
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

## Logging dei chunk grezzi (pi-mono)

Per acquisire i **chunk OpenAI-compat grezzi** prima che vengano analizzati in blocchi,
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

- I log dello stream grezzo possono includere prompt completi, output degli strumenti e dati utente.
- Mantieni i log in locale ed eliminali dopo il debug.
- Se condividi i log, elimina prima segreti e PII.

## Correlati

- [Risoluzione dei problemi](/it/help/troubleshooting)
- [FAQ](/it/help/faq)
