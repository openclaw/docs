---
read_when:
    - Ti serve una panoramica del logging adatta ai principianti
    - Vuoi configurare livelli o formati di log
    - Stai risolvendo un problema e devi trovare rapidamente i log
summary: 'Panoramica del logging: log su file, output della console, tailing CLI e Control UI'
title: Panoramica del logging
x-i18n:
    generated_at: "2026-04-05T13:57:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a5e3800b7c5128602d05d5a35df4f88c373cfbe9397cca7e7154fff56a7f7ef
    source_path: logging.md
    workflow: 15
---

# Logging

OpenClaw ha due superfici di log principali:

- **Log su file** (righe JSON) scritti dal Gateway.
- **Output della console** mostrato nei terminali e nella Gateway Debug UI.

La scheda **Logs** della Control UI mostra il tail del file di log del gateway. Questa pagina spiega dove
si trovano i log, come leggerli e come configurare livelli e formati di log.

## Dove si trovano i log

Per impostazione predefinita, il Gateway scrive un file di log a rotazione in:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La data usa il fuso orario locale dell'host del gateway.

Puoi sovrascriverlo in `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Come leggere i log

### CLI: tail live (consigliato)

Usa la CLI per leggere in tail il file di log del gateway tramite RPC:

```bash
openclaw logs --follow
```

Opzioni attuali utili:

- `--local-time`: visualizza i timestamp nel tuo fuso orario locale
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flag RPC Gateway standard
- `--expect-final`: flag di attesa della risposta finale RPC supportata da agenti (accettato qui tramite il layer client condiviso)

Modalità di output:

- **Sessioni TTY**: righe di log strutturate, leggibili e con colori.
- **Sessioni non TTY**: testo semplice.
- `--json`: JSON delimitato da righe (un evento di log per riga).
- `--plain`: forza il testo semplice nelle sessioni TTY.
- `--no-color`: disabilita i colori ANSI.

Quando passi un `--url` esplicito, la CLI non applica automaticamente credenziali di configurazione o
d'ambiente; includi tu `--token` se il Gateway di destinazione
richiede autenticazione.

In modalità JSON, la CLI emette oggetti contrassegnati con `type`:

- `meta`: metadati dello stream (file, cursore, dimensione)
- `log`: voce di log analizzata
- `notice`: suggerimenti di troncamento / rotazione
- `raw`: riga di log non analizzata

Se il Gateway loopback locale richiede pairing, `openclaw logs` usa come fallback
automaticamente il file di log locale configurato. Le destinazioni `--url` esplicite non
usano questo fallback.

Se il Gateway non è raggiungibile, la CLI stampa un breve suggerimento per eseguire:

```bash
openclaw doctor
```

### Control UI (web)

La scheda **Logs** della Control UI legge in tail lo stesso file usando `logs.tail`.
Vedi [/web/control-ui](/web/control-ui) per sapere come aprirla.

### Log solo canale

Per filtrare l'attività del canale (WhatsApp/Telegram/ecc.), usa:

```bash
openclaw channels logs --channel whatsapp
```

## Formati di log

### Log su file (JSONL)

Ogni riga nel file di log è un oggetto JSON. La CLI e la Control UI analizzano queste
voci per mostrare output strutturato (ora, livello, sottosistema, messaggio).

### Output della console

I log della console sono **consapevoli del TTY** e formattati per la leggibilità:

- Prefissi del sottosistema (ad esempio `gateway/channels/whatsapp`)
- Colori del livello (info/warn/error)
- Modalità compatta o JSON facoltativa

La formattazione della console è controllata da `logging.consoleStyle`.

### Log WebSocket del Gateway

`openclaw gateway` ha anche il logging del protocollo WebSocket per il traffico RPC:

- modalità normale: solo risultati interessanti (errori, errori di parsing, chiamate lente)
- `--verbose`: tutto il traffico richiesta/risposta
- `--ws-log auto|compact|full`: scegli lo stile di rendering dettagliato
- `--compact`: alias di `--ws-log compact`

Esempi:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Configurazione del logging

Tutta la configurazione del logging si trova sotto `logging` in `~/.openclaw/openclaw.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### Livelli di log

- `logging.level`: livello dei **log su file** (JSONL).
- `logging.consoleLevel`: livello di verbosità della **console**.

Puoi sovrascrivere entrambi tramite la variabile d'ambiente **`OPENCLAW_LOG_LEVEL`** (ad esempio `OPENCLAW_LOG_LEVEL=debug`). La variabile env ha la precedenza sul file di configurazione, quindi puoi aumentare la verbosità per una singola esecuzione senza modificare `openclaw.json`. Puoi anche passare l'opzione CLI globale **`--log-level <level>`** (ad esempio `openclaw --log-level debug gateway run`), che sovrascrive la variabile d'ambiente per quel comando.

`--verbose` influisce solo sull'output della console e sulla verbosità del log WS; non cambia
i livelli dei log su file.

### Stili della console

`logging.consoleStyle`:

- `pretty`: adatto agli esseri umani, colorato, con timestamp.
- `compact`: output più compatto (ideale per sessioni lunghe).
- `json`: JSON per riga (per elaboratori di log).

### Redazione

I riepiloghi degli strumenti possono oscurare token sensibili prima che arrivino alla console:

- `logging.redactSensitive`: `off` | `tools` (predefinito: `tools`)
- `logging.redactPatterns`: elenco di stringhe regex per sovrascrivere il set predefinito

La redazione influisce **solo sull'output della console** e non altera i log su file.

## Diagnostics + OpenTelemetry

La diagnostica consiste in eventi strutturati e leggibili dalle macchine per le esecuzioni dei modelli **e**
per la telemetria del flusso dei messaggi (webhook, accodamento, stato delle sessioni). **Non**
sostituisce i log; esiste per alimentare metriche, trace e altri esportatori.

Gli eventi diagnostici vengono emessi in-process, ma gli esportatori si collegano solo quando
diagnostica + plugin esportatore sono abilitati.

### OpenTelemetry vs OTLP

- **OpenTelemetry (OTel)**: il modello dati + gli SDK per trace, metriche e log.
- **OTLP**: il protocollo wire usato per esportare i dati OTel verso un collector/backend.
- OpenClaw esporta oggi tramite **OTLP/HTTP (protobuf)**.

### Segnali esportati

- **Metriche**: contatori + istogrammi (uso token, flusso dei messaggi, accodamento).
- **Trace**: span per uso del modello + elaborazione di webhook/messaggi.
- **Log**: esportati tramite OTLP quando `diagnostics.otel.logs` è abilitato. Il
  volume dei log può essere elevato; tieni presenti `logging.level` e i filtri dell'esportatore.

### Catalogo degli eventi diagnostici

Uso del modello:

- `model.usage`: token, costo, durata, contesto, provider/modello/canale, id sessione.

Flusso dei messaggi:

- `webhook.received`: ingresso webhook per canale.
- `webhook.processed`: webhook gestito + durata.
- `webhook.error`: errori del gestore webhook.
- `message.queued`: messaggio accodato per l'elaborazione.
- `message.processed`: esito + durata + eventuale errore.

Coda + sessione:

- `queue.lane.enqueue`: accodamento in una corsia della coda comandi + profondità.
- `queue.lane.dequeue`: estrazione da una corsia della coda comandi + tempo di attesa.
- `session.state`: transizione di stato della sessione + motivo.
- `session.stuck`: avviso di sessione bloccata + età.
- `run.attempt`: metadati di tentativo/retry dell'esecuzione.
- `diagnostic.heartbeat`: contatori aggregati (webhook/coda/sessione).

### Abilitare la diagnostica (senza esportatore)

Usa questa opzione se vuoi rendere disponibili gli eventi diagnostici a plugin o sink personalizzati:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Flag diagnostici (log mirati)

Usa i flag per attivare log di debug extra e mirati senza alzare `logging.level`.
I flag non distinguono tra maiuscole e minuscole e supportano wildcard (ad esempio `telegram.*` o `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Override env (una tantum):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Note:

- I log dei flag vanno nel file di log standard (lo stesso di `logging.file`).
- L'output viene comunque redatto in base a `logging.redactSensitive`.
- Guida completa: [/diagnostics/flags](/diagnostics/flags).

### Esportazione verso OpenTelemetry

La diagnostica può essere esportata tramite il plugin `diagnostics-otel` (OTLP/HTTP). Questo
funziona con qualsiasi collector/backend OpenTelemetry che accetti OTLP/HTTP.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000
    }
  }
}
```

Note:

- Puoi anche abilitare il plugin con `openclaw plugins enable diagnostics-otel`.
- `protocol` attualmente supporta solo `http/protobuf`. `grpc` viene ignorato.
- Le metriche includono uso dei token, costo, dimensione del contesto, durata dell'esecuzione e
  contatori/istogrammi del flusso dei messaggi (webhook, accodamento, stato delle sessioni, profondità/attesa della coda).
- Trace/metriche possono essere attivati o disattivati con `traces` / `metrics` (predefiniti: attivi). Le trace
  includono span di uso del modello più span di elaborazione di webhook/messaggi quando abilitati.
- Imposta `headers` quando il tuo collector richiede autenticazione.
- Variabili d'ambiente supportate: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.

### Metriche esportate (nomi + tipi)

Uso del modello:

- `openclaw.tokens` (contatore, attributi: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (contatore, attributi: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (istogramma, attributi: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (istogramma, attributi: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Flusso dei messaggi:

- `openclaw.webhook.received` (contatore, attributi: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (contatore, attributi: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (istogramma, attributi: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (contatore, attributi: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (contatore, attributi: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (istogramma, attributi: `openclaw.channel`,
  `openclaw.outcome`)

Code + sessioni:

- `openclaw.queue.lane.enqueue` (contatore, attributi: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (contatore, attributi: `openclaw.lane`)
- `openclaw.queue.depth` (istogramma, attributi: `openclaw.lane` oppure
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (istogramma, attributi: `openclaw.lane`)
- `openclaw.session.state` (contatore, attributi: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (contatore, attributi: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (istogramma, attributi: `openclaw.state`)
- `openclaw.run.attempt` (contatore, attributi: `openclaw.attempt`)

### Span esportati (nomi + attributi chiave)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.sessionKey`, `openclaw.sessionId`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.sessionKey`, `openclaw.sessionId`,
    `openclaw.reason`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`,
    `openclaw.sessionKey`, `openclaw.sessionId`

### Sampling + flush

- Campionamento delle trace: `diagnostics.otel.sampleRate` (0.0–1.0, solo span radice).
- Intervallo di esportazione delle metriche: `diagnostics.otel.flushIntervalMs` (minimo 1000ms).

### Note sul protocollo

- Gli endpoint OTLP/HTTP possono essere impostati tramite `diagnostics.otel.endpoint` oppure
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Se l'endpoint contiene già `/v1/traces` o `/v1/metrics`, viene usato così com'è.
- Se l'endpoint contiene già `/v1/logs`, viene usato così com'è per i log.
- `diagnostics.otel.logs` abilita l'esportazione dei log OTLP per l'output del logger principale.

### Comportamento dell'esportazione dei log

- I log OTLP usano gli stessi record strutturati scritti in `logging.file`.
- Rispettano `logging.level` (livello dei log su file). La redazione della console **non** si applica
  ai log OTLP.
- Le installazioni ad alto volume dovrebbero preferire il campionamento/filtraggio del collector OTLP.

## Suggerimenti per la risoluzione dei problemi

- **Gateway non raggiungibile?** Esegui prima `openclaw doctor`.
- **Log vuoti?** Controlla che il Gateway sia in esecuzione e stia scrivendo nel percorso file
  indicato in `logging.file`.
- **Serve più dettaglio?** Imposta `logging.level` su `debug` o `trace` e riprova.

## Correlati

- [Elementi interni del logging del Gateway](/gateway/logging) — stili dei log WS, prefissi dei sottosistemi e acquisizione della console
- [Diagnostics](/gateway/configuration-reference#diagnostics) — esportazione OpenTelemetry e configurazione delle cache trace
