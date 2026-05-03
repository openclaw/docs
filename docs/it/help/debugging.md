---
read_when:
    - Devi ispezionare l'output grezzo del modello per rilevare eventuali fughe di ragionamento
    - Vuoi eseguire il Gateway in modalità watch durante l'iterazione
    - È necessario un flusso di lavoro di debug ripetibile
summary: 'Strumenti di debug: modalità di monitoraggio, flussi grezzi del modello e tracciamento delle perdite di ragionamento'
title: Debug
x-i18n:
    generated_at: "2026-05-03T21:35:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7230112013a8db8d6a3853b765f4302a61609051ac4ffaf35a6f09de328deafc
    source_path: help/debugging.md
    workflow: 16
---

Helper di debug per l'output in streaming, soprattutto quando un provider mescola il ragionamento nel testo normale.

## Override di debug a runtime

Usa `/debug` nella chat per impostare override di configurazione **solo a runtime** (in memoria, non su disco).
`/debug` è disabilitato per impostazione predefinita; abilitalo con `commands.debug: true`.
È utile quando devi attivare o disattivare impostazioni poco visibili senza modificare `openclaw.json`.

Esempi:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` cancella tutti gli override e torna alla configurazione su disco.

## Output di trace della sessione

Usa `/trace` quando vuoi vedere righe di trace/debug gestite dai Plugin in una singola sessione
senza attivare la modalità verbose completa.

Esempi:

```text
/trace
/trace on
/trace off
```

Usa `/trace` per la diagnostica dei Plugin, come i riepiloghi di debug di Active Memory.
Continua a usare `/verbose` per il normale output verbose di stato/strumenti e continua a usare
`/debug` per gli override di configurazione solo a runtime.

## Trace del ciclo di vita dei Plugin

Usa `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` quando i comandi del ciclo di vita dei Plugin sembrano lenti
e ti serve una scomposizione integrata delle fasi per metadati dei Plugin, discovery, registry,
mirror runtime, modifica della configurazione e operazioni di refresh. Il trace è opt-in e scrive
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

Usalo per indagare il ciclo di vita dei Plugin prima di ricorrere a un profiler CPU.
Se il comando viene eseguito da un checkout sorgente, preferisci misurare il runtime compilato
con `node dist/entry.js ...` dopo `pnpm build`; anche `pnpm openclaw ...`
misura l'overhead del source runner.

## Avvio della CLI e profilazione dei comandi

Usa il benchmark di avvio incluso nel repository quando un comando sembra lento:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Per una profilazione una tantum tramite il normale source runner, imposta
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Il source runner aggiunge i flag di profilo CPU di Node e scrive un `.cpuprofile` per il
comando. Usalo prima di aggiungere strumentazione temporanea al codice dei comandi.

## Modalità watch del Gateway

Per iterazioni rapide, esegui il Gateway sotto il file watcher:

```bash
pnpm gateway:watch
```

Per impostazione predefinita, questo avvia o riavvia una sessione tmux chiamata
`openclaw-gateway-watch-main` (o una variante specifica per profilo/porta come
`openclaw-gateway-watch-dev-19001`) e si collega automaticamente dai terminali interattivi.
Le shell non interattive, la CI e le chiamate exec degli agenti restano scollegate e stampano invece
le istruzioni per collegarsi. Collegati manualmente quando necessario:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Il riquadro tmux esegue il watcher grezzo:

```bash
node scripts/watch-node.mjs gateway --force
```

Usa la modalità in foreground quando tmux non è desiderato:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Disabilita il collegamento automatico mantenendo la gestione tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profila il tempo CPU del Gateway osservato quando fai debug di hotspot di avvio/runtime:

```bash
pnpm gateway:watch --benchmark
```

Il wrapper watch consuma `--benchmark` prima di invocare il Gateway e scrive
un `.cpuprofile` V8 per ogni uscita del processo figlio del Gateway sotto
`.artifacts/gateway-watch-profiles/`. Arresta o riavvia il Gateway osservato per
scaricare il profilo corrente, poi aprilo con Chrome DevTools o Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Usa `--benchmark-dir <path>` quando vuoi i profili in un'altra posizione.
Usa `--benchmark-no-force` quando vuoi che il processo figlio sottoposto a benchmark salti la
pulizia predefinita della porta `--force` e fallisca rapidamente se la porta del Gateway è già
in uso.

Il wrapper tmux porta nel riquadro i selettori runtime comuni non segreti, come
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` e `OPENCLAW_SKIP_CHANNELS`. Inserisci le credenziali dei
provider nel tuo profilo/configurazione normale, oppure usa la modalità foreground grezza
per segreti effimeri una tantum.
Se il Gateway osservato esce durante l'avvio, il watcher esegue
`openclaw doctor --fix --non-interactive` una volta e riavvia il processo figlio del Gateway.
Usa `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` quando vuoi il fallimento di avvio originale
senza il passaggio di riparazione riservato allo sviluppo.
Il riquadro tmux gestito usa anche per impostazione predefinita log del Gateway colorati per una migliore leggibilità;
imposta `FORCE_COLOR=0` quando avvii `pnpm gateway:watch` per disabilitare l'output ANSI.

Il watcher si riavvia su file rilevanti per la build sotto `src/`, file sorgente delle estensioni,
metadati `package.json` e `openclaw.plugin.json` delle estensioni, `tsconfig.json`,
`package.json` e `tsdown.config.ts`. Le modifiche ai metadati delle estensioni riavviano il
Gateway senza forzare una ricompilazione `tsdown`; le modifiche a sorgenti e configurazione continuano
a ricompilare prima `dist`.

Aggiungi eventuali flag CLI del gateway dopo `gateway:watch` e verranno passati a ogni
riavvio. Rieseguire lo stesso comando watch ricrea il riquadro tmux nominato, e
il watcher grezzo mantiene comunque il suo blocco a watcher singolo, così i processi padre watcher duplicati
vengono sostituiti invece di accumularsi.

## Profilo dev + Gateway dev (--dev)

Usa il profilo dev per isolare lo stato e avviare una configurazione sicura e usa e getta per
il debug. Ci sono **due** flag `--dev`:

- **`--dev` globale (profilo):** isola lo stato sotto `~/.openclaw-dev` e
  imposta per impostazione predefinita la porta del gateway su `19001` (le porte derivate si spostano di conseguenza).
- **`gateway --dev`: indica al Gateway di creare automaticamente una configurazione +
  workspace predefiniti** quando mancano (e saltare BOOTSTRAP.md).

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
   - Scrive una configurazione minima se manca (`gateway.mode=local`, bind su loopback).
   - Imposta `agent.workspace` sul workspace dev.
   - Imposta `agent.skipBootstrap=true` (nessun BOOTSTRAP.md).
   - Inizializza i file del workspace se mancano:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identità predefinita: **C3‑PO** (droide protocollare).
   - Salta i provider dei canali in modalità dev (`OPENCLAW_SKIP_CHANNELS=1`).

Flusso di reset (nuovo avvio):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` è un flag di profilo **globale** e viene consumato da alcuni runner. Se devi esplicitarlo, usa la forma con variabile d'ambiente:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` cancella configurazione, credenziali, sessioni e il workspace dev (usando
`trash`, non `rm`), poi ricrea la configurazione dev predefinita.

<Tip>
Se un gateway non dev è già in esecuzione (launchd o systemd), arrestalo prima:

```bash
openclaw gateway stop
```

</Tip>

## Logging dello stream grezzo (OpenClaw)

OpenClaw può registrare lo **stream grezzo dell'assistente** prima di qualsiasi filtro/formattazione.
Questo è il modo migliore per vedere se il ragionamento arriva come delta di testo normale
(o come blocchi di thinking separati).

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

## Logging dei chunk grezzi (pi-mono)

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

> Nota: questo viene emesso solo dai processi che usano il provider
> `openai-completions` di pi-mono.

## Note di sicurezza

- I log dello stream grezzo possono includere prompt completi, output degli strumenti e dati utente.
- Mantieni i log locali ed eliminali dopo il debug.
- Se condividi i log, rimuovi prima segreti e PII.

## Correlati

- [Risoluzione dei problemi](/it/help/troubleshooting)
- [FAQ](/it/help/faq)
