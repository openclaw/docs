---
read_when:
    - Devi esaminare l'output grezzo del modello per rilevare eventuali fughe di ragionamento
    - Vuoi eseguire il Gateway in modalità watch durante lo sviluppo iterativo
    - Hai bisogno di un flusso di lavoro di debug ripetibile
summary: 'Strumenti di debug: modalità watch, flussi grezzi del modello e tracciamento della fuoriuscita del ragionamento'
title: Debugging
x-i18n:
    generated_at: "2026-07-12T07:06:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7723dfffdcd74e8e6b7bdec2507f9b008f5e0e8f82295a4e687f3b84f142df9
    source_path: help/debugging.md
    workflow: 16
---

Strumenti di supporto al debug per l'output in streaming, l'iterazione del Gateway e la profilazione dell'avvio.

## Override di debug in fase di esecuzione

`/debug` imposta override di configurazione **solo in fase di esecuzione** (in memoria, non su disco). È disabilitato per impostazione predefinita; abilitalo con `commands.debug: true`.

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` cancella tutti gli override e ripristina la configurazione su disco.

## Output di traccia della sessione

`/trace` mostra le righe di traccia/debug gestite dal plugin per una singola sessione senza abilitare la modalità completamente dettagliata. Usalo per la diagnostica dei plugin, ad esempio i riepiloghi di debug di Active Memory; usa `/verbose` per il normale output di stato/degli strumenti.

```text
/trace
/trace on
/trace off
```

## Traccia del ciclo di vita dei plugin

Imposta `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` per ottenere una suddivisione fase per fase delle operazioni relative a metadati dei plugin, rilevamento, registro, mirror di runtime, modifica della configurazione e aggiornamento. Scrive su stderr, così l'output JSON dei comandi rimane analizzabile.

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Usalo prima di ricorrere a un profiler della CPU. Da un checkout del sorgente, misura il runtime compilato con `node dist/entry.js ...` dopo `pnpm build`; anche `pnpm openclaw ...` misura l'overhead dell'esecutore del sorgente.

## Profilazione dell'avvio e dei comandi della CLI

Benchmark di avvio inclusi nel repository:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Per una profilazione una tantum tramite il normale esecutore del sorgente, imposta `OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

L'esecutore del sorgente aggiunge i flag del profilo CPU di Node e scrive un file `.cpuprofile` per il comando. Usalo prima di aggiungere strumentazione temporanea al codice del comando.

Per blocchi durante l'avvio che sembrano dovuti a operazioni sincrone del file system o del caricatore di moduli, aggiungi il flag di traccia I/O sincrono di Node tramite l'esecutore del sorgente:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` lascia questo flag disabilitato per impostazione predefinita per il processo figlio Gateway monitorato; imposta `OPENCLAW_TRACE_SYNC_IO=1` quando vuoi l'output della traccia I/O sincrono anche in modalità di monitoraggio.

## Modalità di monitoraggio del Gateway

```bash
pnpm gateway:watch
```

Per impostazione predefinita, questo comando avvia o riavvia una sessione tmux denominata `openclaw-gateway-watch-<profile>` (ad esempio `openclaw-gateway-watch-main`), con un suffisso della porta come `openclaw-gateway-watch-dev-19001` aggiunto solo quando `OPENCLAW_GATEWAY_PORT` differisce dalla porta predefinita `18789`. Si collega automaticamente dai terminali interattivi; le shell non interattive, la CI e le chiamate di esecuzione degli agenti rimangono scollegate e mostrano invece le istruzioni per il collegamento:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Il riquadro tmux esegue direttamente il processo di monitoraggio:

```bash
node scripts/watch-node.mjs gateway --force
```

Arresta un servizio Gateway installato prima di monitorare la stessa porta:

```bash
pnpm openclaw gateway stop
```

L'opzione `--force` del processo di monitoraggio rimuove il listener corrente, ma non disabilita un servizio supervisionato. In caso contrario, un servizio launchd, systemd o Scheduled Task può riavviarsi e sostituire il Gateway monitorato.

Modalità in primo piano senza tmux:

```bash
pnpm gateway:watch:raw
# oppure
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Mantieni la gestione tramite tmux ma disabilita il collegamento automatico:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profila il tempo CPU del Gateway monitorato durante il debug dei punti critici di avvio/runtime:

```bash
pnpm gateway:watch --benchmark
```

Il wrapper di monitoraggio elabora `--benchmark` prima di invocare il Gateway e scrive un file V8 `.cpuprofile` per ogni terminazione del processo figlio Gateway in `.artifacts/gateway-watch-profiles/`. Arresta o riavvia il Gateway monitorato per completare il profilo corrente, quindi aprilo con Chrome DevTools o Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`: scrive i profili in un'altra posizione.
- `--benchmark-no-force`: evita la pulizia predefinita della porta tramite `--force` e termina immediatamente con un errore se la porta del Gateway è già in uso.

Per impostazione predefinita, la modalità benchmark elimina l'eccesso di messaggi della traccia I/O sincrono. Imposta `OPENCLAW_TRACE_SYNC_IO=1` insieme a `--benchmark` per ottenere sia i profili CPU sia le tracce dello stack dell'I/O sincrono; in modalità benchmark, questi blocchi di traccia vengono scritti in `gateway-watch-output.log` nella directory del benchmark (e filtrati dal riquadro del terminale), mentre i normali log del Gateway rimangono visibili.

Il wrapper tmux trasferisce nel riquadro i comuni selettori di runtime non segreti, inclusi `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` e `OPENCLAW_SKIP_CHANNELS`. Inserisci le credenziali del provider nel normale profilo/nella configurazione oppure usa la modalità raw in primo piano per segreti temporanei una tantum.

Se il Gateway monitorato termina durante l'avvio, il processo di monitoraggio esegue una volta `openclaw doctor --fix --non-interactive` e riavvia il processo figlio Gateway. Imposta `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` per visualizzare l'errore di avvio originale senza il passaggio di riparazione riservato allo sviluppo.

Il riquadro tmux gestito usa per impostazione predefinita log colorati del Gateway; imposta `FORCE_COLOR=0` all'avvio di `pnpm gateway:watch` per disabilitare l'output ANSI.

Il processo di monitoraggio si riavvia quando cambiano i file rilevanti per la compilazione in `src/`, i file sorgente delle estensioni, i metadati `package.json` e `openclaw.plugin.json` delle estensioni, `tsconfig.json`, `package.json` e `tsdown.config.ts`. Le modifiche ai metadati delle estensioni riavviano il Gateway senza forzare una ricompilazione; le modifiche al sorgente e alla configurazione continuano invece a ricompilare prima `dist`.

Aggiungi i flag della CLI del Gateway dopo `gateway:watch`: verranno trasmessi a ogni riavvio. La riesecuzione dello stesso comando di monitoraggio rigenera il riquadro tmux denominato; il processo di monitoraggio raw mantiene un blocco per una singola istanza, così i processi di monitoraggio principali duplicati vengono sostituiti anziché accumularsi.

## Profilo di sviluppo + Gateway di sviluppo (--dev)

Due flag `--dev` **distinti**:

- **`--dev` globale (profilo):** isola lo stato in `~/.openclaw-dev` e imposta per impostazione predefinita la porta del Gateway su `19001` (le porte derivate cambiano di conseguenza).
- **`gateway --dev`:** indica al Gateway di creare automaticamente una configurazione e uno spazio di lavoro predefiniti quando mancanti (e di saltare il bootstrap).

Flusso consigliato (profilo di sviluppo + bootstrap di sviluppo):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Senza un'installazione globale, esegui la CLI tramite `pnpm openclaw ...`.

Cosa comporta:

1. **Isolamento del profilo** (`--dev` globale)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (le porte del browser/canvas cambiano di conseguenza)

2. **Bootstrap di sviluppo** (`gateway --dev`)
   - Scrive una configurazione minima se mancante (`gateway.mode=local`, associazione a local loopback).
   - Imposta `agents.defaults.workspace` sullo spazio di lavoro di sviluppo e `agents.defaults.skipBootstrap=true`.
   - Inizializza i file dello spazio di lavoro se mancanti: `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`.
   - Identità predefinita: **C3-PO** (droide protocollare).
   - `pnpm gateway:dev` imposta inoltre `OPENCLAW_SKIP_CHANNELS=1` per ignorare i provider dei canali.

Flusso di reimpostazione (nuovo avvio):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` è un flag di profilo **globale** e viene intercettato da alcuni esecutori. Se devi specificarlo esplicitamente, usa la forma con variabile d'ambiente:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` cancella configurazione, credenziali, sessioni e spazio di lavoro di sviluppo (spostandoli nel cestino, senza eliminarli), quindi ricrea la configurazione di sviluppo predefinita.

<Tip>
Se è già in esecuzione un Gateway non di sviluppo (launchd o systemd), arrestalo prima:

```bash
openclaw gateway stop
```

</Tip>

## Registrazione dello stream raw

OpenClaw può registrare lo **stream raw dell'assistente** prima di qualsiasi filtro/formattazione. È il modo migliore per verificare se il ragionamento arriva come delta di testo normale oppure come blocchi di pensiero separati.

Abilitalo tramite la CLI:

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

File predefinito: `~/.openclaw/logs/raw-stream.jsonl`

## Note sulla sicurezza

- I log dello stream raw possono includere prompt completi, output degli strumenti e dati degli utenti.
- Mantieni i log in locale ed eliminali al termine del debug.
- Se condividi i log, rimuovi prima i segreti e i dati personali identificabili.

## Debug in VSCode

Le mappe del sorgente sono necessarie perché la compilazione genera nomi di file con hash. Il file `launch.json` incluso è configurato per il servizio Gateway:

1. **Rebuild and Debug Gateway** - elimina `/dist` e ricompila con il debug abilitato prima di avviare il Gateway.
2. **Debug Gateway** - esegue il debug di una compilazione esistente senza modificare `/dist`.

### Configurazione

1. Apri **Run and Debug** (nella barra delle attività oppure con `Ctrl`+`Shift`+`D`).
2. Seleziona **Rebuild and Debug Gateway** e premi **Start Debugging**.

In alternativa, per gestire manualmente il ciclo di compilazione/debug:

1. Abilita le mappe del sorgente in un terminale:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Ricompila: `pnpm clean:dist && pnpm build`
3. Seleziona **Debug Gateway** e premi **Start Debugging**.

Imposta i punti di interruzione nei file TypeScript in `src/`; il debugger li associa al codice JavaScript compilato tramite le mappe del sorgente.

### Note

- **Rebuild and Debug Gateway** elimina `/dist` ed esegue una compilazione completa con `pnpm build` e mappe del sorgente a ogni avvio.
- **Debug Gateway** può essere avviato/arrestato senza influire su `/dist`, ma devi gestire il ciclo di compilazione in un terminale separato.
- Modifica `args` in `launch.json` per eseguire il debug di altri sottocomandi della CLI.
- Per usare la CLI compilata per altre attività (ad esempio `dashboard --no-open` se la sessione di debug genera un nuovo token di autenticazione), eseguila da un altro terminale: `node ./openclaw.mjs` oppure usa un alias come `alias openclaw-build="node $(pwd)/openclaw.mjs"`.

## Contenuti correlati

- [Risoluzione dei problemi](/it/help/troubleshooting)
- [Domande frequenti](/it/help/faq)
