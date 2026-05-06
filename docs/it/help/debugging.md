---
read_when:
    - Devi ispezionare l'output grezzo del modello per individuare perdite di ragionamento
    - Vuoi eseguire il Gateway in modalità di monitoraggio durante l'iterazione
    - È necessario un flusso di lavoro di debug ripetibile
summary: 'Strumenti di debug: modalità di monitoraggio, flussi grezzi del modello e tracciamento delle fughe di ragionamento'
title: Individuazione e correzione degli errori
x-i18n:
    generated_at: "2026-05-06T08:53:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b59845244a1e2920ca15b9b85ce5b29424e3a1528eece8c18ddeab69feaf86f
    source_path: help/debugging.md
    workflow: 16
---

Helper di debug per l'output in streaming, specialmente quando un provider mescola il ragionamento nel testo normale.

## Override di debug runtime

Usa `/debug` nella chat per impostare override di configurazione **solo runtime** (memoria, non disco).
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

## Output della traccia di sessione

Usa `/trace` quando vuoi vedere le righe di traccia/debug di proprietà del plugin in una sessione
senza attivare la modalità verbose completa.

Esempi:

```text
/trace
/trace on
/trace off
```

Usa `/trace` per la diagnostica dei plugin, ad esempio i riepiloghi di debug di Active Memory.
Continua a usare `/verbose` per il normale output verbose di stato/strumenti, e continua a usare
`/debug` per gli override di configurazione solo runtime.

## Traccia del ciclo di vita del Plugin

Usa `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` quando i comandi del ciclo di vita del plugin sembrano lenti
e ti serve una scomposizione integrata per fasi di metadati plugin, discovery, registry,
mirror runtime, mutazione della configurazione e lavoro di aggiornamento. La traccia è opt-in e scrive
su stderr, quindi l'output JSON dei comandi resta analizzabile.

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

Usalo per indagini sul ciclo di vita dei plugin prima di ricorrere a un profiler CPU.
Se il comando viene eseguito da un checkout sorgente, preferisci misurare il runtime compilato
con `node dist/entry.js ...` dopo `pnpm build`; `pnpm openclaw ...`
misura anche l'overhead del runner sorgente.

## Avvio CLI e profilazione dei comandi

Usa il benchmark di avvio incluso quando un comando sembra lento:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Per una profilazione una tantum tramite il normale runner sorgente, imposta
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Il runner sorgente aggiunge i flag del profilo CPU di Node e scrive un `.cpuprofile` per il
comando. Usalo prima di aggiungere strumentazione temporanea al codice del comando.

Per blocchi di avvio che sembrano lavoro sincrono del filesystem o del module loader,
aggiungi il flag di traccia I/O sincrono di Node tramite il runner sorgente:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` abilita questo flag per impostazione predefinita per il processo figlio Gateway osservato.
Imposta `OPENCLAW_TRACE_SYNC_IO=0` per sopprimere l'output della traccia I/O sincrono di Node in modalità watch.

## Modalità watch del Gateway

Per iterazioni rapide, esegui il gateway sotto il file watcher:

```bash
pnpm gateway:watch
```

Per impostazione predefinita, questo avvia o riavvia una sessione tmux chiamata
`openclaw-gateway-watch-main` (o una variante specifica per profilo/porta come
`openclaw-gateway-watch-dev-19001`) e si collega automaticamente dai terminali interattivi.
Shell non interattive, CI e chiamate exec degli agenti restano scollegate e stampano invece
istruzioni di collegamento. Collegati manualmente quando necessario:

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

Profila il tempo CPU del Gateway osservato durante il debug di hotspot di avvio/runtime:

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
pulizia della porta predefinita `--force` e fallisca rapidamente se la porta Gateway è già in
uso.
La modalità benchmark sopprime per impostazione predefinita lo spam della traccia sync-I/O. Imposta
`OPENCLAW_TRACE_SYNC_IO=1` con `--benchmark` quando vuoi esplicitamente sia i profili CPU
sia gli stack trace sync-I/O di Node. In modalità benchmark quei blocchi di traccia
vengono scritti in `gateway-watch-output.log` sotto la directory del benchmark e
filtrati dal riquadro terminale; i normali log Gateway restano visibili.

Il wrapper tmux porta nel riquadro i comuni selettori runtime non segreti, come
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` e `OPENCLAW_SKIP_CHANNELS`. Metti
le credenziali del provider nel tuo normale profilo/configurazione, oppure usa la modalità grezza in primo piano
per segreti effimeri una tantum.
Se il Gateway osservato esce durante l'avvio, il watcher esegue
`openclaw doctor --fix --non-interactive` una volta e riavvia il processo figlio Gateway.
Usa `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` quando vuoi l'errore di avvio originale
senza il passaggio di riparazione solo dev.
Il riquadro tmux gestito usa inoltre per impostazione predefinita log Gateway colorati per leggibilità;
imposta `FORCE_COLOR=0` quando avvii `pnpm gateway:watch` per disabilitare l'output ANSI.

Il watcher si riavvia sui file rilevanti per la build sotto `src/`, sui file sorgente delle estensioni,
sui metadati `package.json` e `openclaw.plugin.json` delle estensioni, `tsconfig.json`,
`package.json` e `tsdown.config.ts`. Le modifiche ai metadati delle estensioni riavviano il
gateway senza forzare una rebuild `tsdown`; le modifiche a sorgente e configurazione continuano
a ricostruire prima `dist`.

Aggiungi eventuali flag CLI del gateway dopo `gateway:watch` e verranno inoltrati a
ogni riavvio. Rieseguire lo stesso comando watch rigenera il riquadro tmux nominato, e
il watcher grezzo mantiene comunque il suo lock a watcher singolo, così i processi parent watcher duplicati
vengono sostituiti invece di accumularsi.

## Profilo dev + gateway dev (--dev)

Usa il profilo dev per isolare lo stato e avviare una configurazione sicura e usa e getta per
il debug. Ci sono **due** flag `--dev`:

- **`--dev` globale (profilo):** isola lo stato sotto `~/.openclaw-dev` e
  imposta per impostazione predefinita la porta gateway a `19001` (le porte derivate si spostano di conseguenza).
- **`gateway --dev`: dice al Gateway di creare automaticamente una configurazione +
  workspace predefiniti** quando mancanti (e di saltare BOOTSTRAP.md).

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
   - Identità predefinita: **C3-PO** (droide protocollare).
   - Salta i provider di canale in modalità dev (`OPENCLAW_SKIP_CHANNELS=1`).

Flusso di reset (avvio pulito):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` è un flag di profilo **globale** e viene consumato da alcuni runner. Se devi esplicitarlo, usa la forma con variabile d'ambiente:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` cancella configurazione, credenziali, sessioni e workspace dev (usando
`trash`, non `rm`), poi ricrea la configurazione dev predefinita.

<Tip>
Se un gateway non dev è già in esecuzione (launchd o systemd), arrestalo prima:

```bash
openclaw gateway stop
```

</Tip>

## Logging dello stream grezzo (OpenClaw)

OpenClaw può registrare lo **stream assistente grezzo** prima di qualunque filtro/formattazione.
Questo è il modo migliore per vedere se il ragionamento arriva come delta di testo semplice
(o come blocchi di pensiero separati).

Abilitalo tramite CLI:

```bash
pnpm gateway:watch --raw-stream
```

Override percorso opzionale:

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

> Nota: viene emesso solo dai processi che usano il provider
> `openai-completions` di pi-mono.

## Note di sicurezza

- I log dello stream grezzo possono includere prompt completi, output degli strumenti e dati utente.
- Mantieni i log locali ed eliminali dopo il debug.
- Se condividi i log, rimuovi prima segreti e PII.

## Debug in VSCode

Le source map sono necessarie per abilitare il debug negli IDE basati su VSCode perché molti dei file generati finiscono con nomi hashati come parte del processo di build. Le configurazioni `launch.json` incluse puntano al servizio Gateway, ma possono essere adattate rapidamente per altri scopi:

1. **Ricostruisci ed esegui il debug del Gateway** - Esegue il debug del servizio Gateway dopo aver creato una nuova build
2. **Debug Gateway** - Esegue il debug del servizio Gateway di una build preesistente

### Configurazione

La configurazione predefinita **Ricostruisci ed esegui il debug del Gateway** è completa, eliminerà automaticamente la cartella `/dist` e ricostruirà il progetto con il debug abilitato:

1. Apri il pannello **Esegui e debug** dalla Barra attività o premi `Ctrl`+`Shift`+`D`
2. Nell'IDE, assicurati che **Ricostruisci ed esegui il debug del Gateway** sia selezionato nel menu a discesa delle configurazioni e poi premi il pulsante **Avvia debug**

In alternativa, se preferisci gestire manualmente i processi di build e debug:

1. Apri un terminale e abilita le source map:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Nello stesso terminale, ricostruisci il progetto: `pnpm clean:dist && pnpm build`
3. Nell'IDE, seleziona l'opzione **Debug Gateway** nel menu a discesa della configurazione **Esegui e debug** e poi premi il pulsante **Avvia debug**

Ora puoi impostare breakpoint nei tuoi file sorgente TypeScript (directory `src/`) e il debugger mapperà correttamente i breakpoint sul JavaScript compilato tramite source map. Potrai ispezionare variabili, eseguire il codice passo passo ed esaminare gli stack di chiamate come previsto.

### Note

- Se usi l'opzione **"Ricostruisci ed esegui il debug del Gateway"**, ogni volta che il debugger viene avviato eliminerà completamente la cartella `/dist` ed eseguirà un `pnpm build` completo con le source map abilitate prima di avviare il Gateway
- Se usi l'opzione **"Debug Gateway"**, le sessioni di debug possono essere avviate e arrestate in qualsiasi momento senza influire sulla cartella `/dist`, ma devi usare un processo terminale separato sia per abilitare il debug sia per gestire il ciclo di build
- Modifica le impostazioni `launch.json` per `args` per eseguire il debug di altre sezioni del progetto
- Se devi usare la CLI OpenClaw compilata per altre attività (cioè `dashboard --no-open` se la tua sessione di debug genera un nuovo token di autenticazione), puoi eseguirla in un altro terminale come `node ./openclaw.mjs` o creare un alias shell come `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## Correlati

- [Risoluzione dei problemi](/it/help/troubleshooting)
- [FAQ](/it/help/faq)
