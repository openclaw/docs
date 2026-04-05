---
read_when:
    - Hai bisogno di ispezionare l'output grezzo del modello per rilevare fuoriuscite del reasoning
    - Vuoi eseguire il Gateway in modalità watch mentre iteri
    - Hai bisogno di un flusso di debug ripetibile
summary: 'Strumenti di debug: modalità watch, stream grezzi del modello e tracciamento della fuoriuscita del reasoning'
title: Debug
x-i18n:
    generated_at: "2026-04-05T13:53:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: f90d944ecc2e846ca0b26a162126ceefb3a3c6cf065c99b731359ec79d4289e3
    source_path: help/debugging.md
    workflow: 15
---

# Debug

Questa pagina copre gli helper di debug per l'output in streaming, soprattutto quando un
provider mescola il reasoning nel testo normale.

## Override di debug a runtime

Usa `/debug` in chat per impostare override di configurazione **solo a runtime** (in memoria, non su disco).
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

## Modalità watch del Gateway

Per iterare rapidamente, esegui il gateway sotto il file watcher:

```bash
pnpm gateway:watch
```

Questo corrisponde a:

```bash
node scripts/watch-node.mjs gateway --force
```

Il watcher riavvia sui file rilevanti per la build sotto `src/`, sui file sorgente delle estensioni,
sui file `package.json` delle estensioni e sui metadati `openclaw.plugin.json`, `tsconfig.json`,
`package.json` e `tsdown.config.ts`. Le modifiche ai metadati delle estensioni riavviano il
gateway senza forzare una rebuild `tsdown`; le modifiche a sorgenti e configurazione
ricostruiscono comunque prima `dist`.

Aggiungi eventuali flag CLI del gateway dopo `gateway:watch` e verranno inoltrati a
ogni riavvio.

## Profilo dev + gateway dev (`--dev`)

Usa il profilo dev per isolare lo stato e avviare una configurazione sicura e usa e getta per il
debug. Ci sono **due** flag `--dev`:

- **`--dev` globale (profilo):** isola lo stato sotto `~/.openclaw-dev` e
  imposta per default la porta del gateway a `19001` (le porte derivate si spostano di conseguenza).
- **`gateway --dev`:** dice al Gateway di creare automaticamente una configurazione predefinita +
  workspace quando mancano (e di saltare `BOOTSTRAP.md`).

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
   - Imposta `agent.skipBootstrap=true` (nessun `BOOTSTRAP.md`).
   - Inizializza i file del workspace se mancano:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identità predefinita: **C3‑PO** (droide protocollare).
   - Salta i provider di canale in modalità dev (`OPENCLAW_SKIP_CHANNELS=1`).

Flusso di reset (nuovo inizio):

```bash
pnpm gateway:dev:reset
```

Nota: `--dev` è un flag di profilo **globale** e viene intercettato da alcuni runner.
Se devi specificarlo esplicitamente, usa la forma con variabile env:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` cancella configurazione, credenziali, sessioni e il workspace dev (usando
`trash`, non `rm`), poi ricrea la configurazione dev predefinita.

Suggerimento: se è già in esecuzione un gateway non dev (launchd/systemd), fermalo prima:

```bash
openclaw gateway stop
```

## Logging dello stream grezzo (OpenClaw)

OpenClaw può registrare lo **stream grezzo dell'assistente** prima di qualsiasi filtraggio/formattazione.
Questo è il modo migliore per vedere se il reasoning arriva come delta di testo semplice
(o come blocchi di thinking separati).

Abilitalo via CLI:

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

## Logging dei chunk grezzi (pi-mono)

Per acquisire i **chunk grezzi compatibili OpenAI** prima che vengano analizzati in blocchi,
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
- Mantieni i log in locale ed eliminali dopo il debug.
- Se condividi i log, rimuovi prima segreti e PII.
