---
read_when:
    - Ti serve una panoramica del logging adatta ai principianti
    - Vuoi configurare livelli o formati dei log
    - Stai facendo troubleshooting e devi trovare rapidamente i log
summary: 'Panoramica del logging: log su file, output della console, tailing dalla CLI e Control UI'
title: Panoramica del logging
x-i18n:
    generated_at: "2026-04-24T08:47:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b6f274600bcb9f5597c91aa6c30512871105a3e0de446773394abbe27276058
    source_path: logging.md
    workflow: 15
---

# Logging

OpenClaw ha due principali superfici di log:

- **Log su file** (righe JSON) scritti dal Gateway.
- **Output della console** mostrato nei terminali e nella Gateway Debug UI.

La scheda **Logs** della Control UI esegue il tail del file di log del gateway. Questa pagina spiega dove
si trovano i log, come leggerli e come configurare livelli e formati dei log.

## Dove si trovano i log

Per impostazione predefinita, il Gateway scrive un file di log rotante in:

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

Usa la CLI per eseguire il tail del file di log del gateway tramite RPC:

```bash
openclaw logs --follow
```

Opzioni utili attuali:

- `--local-time`: renderizza i timestamp nel tuo fuso orario locale
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flag RPC standard del Gateway
- `--expect-final`: flag di attesa della risposta finale per RPC supportate da agente (accettato qui tramite il layer client condiviso)

Modalità di output:

- **Sessioni TTY**: righe di log strutturate, leggibili e colorate.
- **Sessioni non TTY**: testo semplice.
- `--json`: JSON delimitato per riga (un evento di log per riga).
- `--plain`: forza il testo semplice nelle sessioni TTY.
- `--no-color`: disabilita i colori ANSI.

Quando passi un `--url` esplicito, la CLI non applica automaticamente le credenziali di configurazione o
ambiente; includi tu stesso `--token` se il Gateway di destinazione
richiede autenticazione.

In modalità JSON, la CLI emette oggetti con tag `type`:

- `meta`: metadati dello stream (file, cursore, dimensione)
- `log`: voce di log parsata
- `notice`: suggerimenti di troncamento / rotazione
- `raw`: riga di log non parsata

Se il Gateway locale su loopback richiede l'abbinamento, `openclaw logs` usa il fallback automatico al
file di log locale configurato. I target `--url` espliciti non
usano questo fallback.

Se il Gateway non è raggiungibile, la CLI stampa un breve suggerimento per eseguire:

```bash
openclaw doctor
```

### Control UI (web)

La scheda **Logs** della Control UI esegue il tail dello stesso file usando `logs.tail`.
Vedi [/web/control-ui](/it/web/control-ui) per sapere come aprirla.

### Log solo canale

Per filtrare l'attività del canale (WhatsApp/Telegram/ecc), usa:

```bash
openclaw channels logs --channel whatsapp
```

## Formati dei log

### Log su file (JSONL)

Ogni riga nel file di log è un oggetto JSON. La CLI e la Control UI parsano queste
voci per renderizzare output strutturato (ora, livello, sottosistema, messaggio).

### Output della console

I log della console sono **consapevoli del TTY** e formattati per la leggibilità:

- Prefissi di sottosistema (ad es. `gateway/channels/whatsapp`)
- Colorazione per livello (info/warn/error)
- Modalità compatta o JSON facoltativa

La formattazione della console è controllata da `logging.consoleStyle`.

### Log WebSocket del Gateway

`openclaw gateway` ha anche il logging del protocollo WebSocket per il traffico RPC:

- modalità normale: solo risultati interessanti (errori, errori di parsing, chiamate lente)
- `--verbose`: tutto il traffico richiesta/risposta
- `--ws-log auto|compact|full`: sceglie lo stile di rendering verboso
- `--compact`: alias di `--ws-log compact`

Esempi:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Configurare il logging

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
- `logging.consoleLevel`: verbosità della **console**.

Puoi sovrascrivere entrambi tramite la variabile d'ambiente **`OPENCLAW_LOG_LEVEL`** (ad es. `OPENCLAW_LOG_LEVEL=debug`). La variabile env ha la precedenza sul file di configurazione, quindi puoi aumentare la verbosità per una singola esecuzione senza modificare `openclaw.json`. Puoi anche passare l'opzione CLI globale **`--log-level <level>`** (ad esempio `openclaw --log-level debug gateway run`), che sovrascrive la variabile d'ambiente per quel comando.

`--verbose` influisce solo sull'output della console e sulla verbosità dei log WS; non cambia
i livelli dei log su file.

### Stili della console

`logging.consoleStyle`:

- `pretty`: leggibile per umani, colorato, con timestamp.
- `compact`: output più serrato (ideale per sessioni lunghe).
- `json`: JSON per riga (per processori di log).

### Redazione

I riepiloghi degli strumenti possono redigere token sensibili prima che raggiungano la console:

- `logging.redactSensitive`: `off` | `tools` (predefinito: `tools`)
- `logging.redactPatterns`: elenco di stringhe regex per sovrascrivere l'insieme predefinito

La redazione influisce **solo sull'output della console** e non altera i log su file.

## Diagnostica + OpenTelemetry

La diagnostica consiste in eventi strutturati, leggibili dalla macchina, per le esecuzioni del modello **e**
per la telemetria del flusso dei messaggi (webhook, accodamento, stato della sessione). **Non**
sostituiscono i log; esistono per alimentare metriche, trace e altri esportatori.

Gli eventi diagnostici vengono emessi in-process, ma gli esportatori si collegano solo quando
sono abilitati la diagnostica + il plugin esportatore.

### OpenTelemetry vs OTLP

- **OpenTelemetry (OTel)**: il modello dati + SDK per trace, metriche e log.
- **OTLP**: il protocollo wire usato per esportare i dati OTel verso un collector/backend.
- OpenClaw oggi esporta tramite **OTLP/HTTP (protobuf)**.

### Segnali esportati

- **Metriche**: contatori + istogrammi (uso dei token, flusso dei messaggi, accodamento).
- **Trace**: span per uso del modello + elaborazione di webhook/messaggi.
- **Log**: esportati tramite OTLP quando `diagnostics.otel.logs` è abilitato. Il
  volume dei log può essere alto; tieni presenti `logging.level` e i filtri dell'esportatore.

### Catalogo degli eventi diagnostici

Uso del modello:

- `model.usage`: token, costo, durata, contesto, provider/modello/canale, ID sessione.

Flusso dei messaggi:

- `webhook.received`: ingresso webhook per canale.
- `webhook.processed`: webhook gestito + durata.
- `webhook.error`: errori del gestore webhook.
- `message.queued`: messaggio accodato per l'elaborazione.
- `message.processed`: esito + durata + errore facoltativo.

Coda + sessione:

- `queue.lane.enqueue`: enqueue della lane della coda dei comandi + profondità.
- `queue.lane.dequeue`: dequeue della lane della coda dei comandi + tempo di attesa.
- `session.state`: transizione di stato della sessione + motivo.
- `session.stuck`: avviso di sessione bloccata + età.
- `run.attempt`: metadati di retry/tentativo dell'esecuzione.
- `diagnostic.heartbeat`: contatori aggregati (webhook/coda/sessione).

### Abilitare la diagnostica (senza esportatore)

Usa questo se vuoi che gli eventi diagnostici siano disponibili per plugin o sink personalizzati:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Flag di diagnostica (log mirati)

Usa i flag per attivare log di debug extra e mirati senza aumentare `logging.level`.
I flag non fanno distinzione tra maiuscole e minuscole e supportano wildcard (ad es. `telegram.*` o `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Sovrascrittura env (one-off):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Note:

- I log dei flag vanno nel file di log standard (lo stesso di `logging.file`).
- L'output continua a essere redatto secondo `logging.redactSensitive`.
- Guida completa: [/diagnostics/flags](/it/diagnostics/flags).

### Esportare verso OpenTelemetry

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
- `protocol` supporta attualmente solo `http/protobuf`. `grpc` viene ignorato.
- Le metriche includono uso dei token, costo, dimensione del contesto, durata dell'esecuzione e
  contatori/istogrammi del flusso dei messaggi (webhook, accodamento, stato della sessione, profondità/attesa della coda).
- Trace/metriche possono essere attivati/disattivati con `traces` / `metrics` (predefinito: attivi). Le trace
  includono span di uso del modello più span di elaborazione webhook/messaggi quando abilitati.
- Imposta `headers` quando il tuo collector richiede autenticazione.
- Variabili d'ambiente supportate: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.

### Metriche esportate (nomi + tipi)

Uso del modello:

- `openclaw.tokens` (counter, attributi: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (counter, attributi: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attributi: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attributi: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Flusso dei messaggi:

- `openclaw.webhook.received` (counter, attributi: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attributi: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attributi: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (counter, attributi: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (counter, attributi: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attributi: `openclaw.channel`,
  `openclaw.outcome`)

Code + sessioni:

- `openclaw.queue.lane.enqueue` (counter, attributi: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attributi: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attributi: `openclaw.lane` o
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attributi: `openclaw.lane`)
- `openclaw.session.state` (counter, attributi: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attributi: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, attributi: `openclaw.state`)
- `openclaw.run.attempt` (counter, attributi: `openclaw.attempt`)

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

### Sampling + flushing

- Sampling delle trace: `diagnostics.otel.sampleRate` (0.0–1.0, solo span root).
- Intervallo di esportazione delle metriche: `diagnostics.otel.flushIntervalMs` (minimo 1000ms).

### Note sul protocollo

- Gli endpoint OTLP/HTTP possono essere impostati tramite `diagnostics.otel.endpoint` o
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Se l'endpoint contiene già `/v1/traces` o `/v1/metrics`, viene usato così com'è.
- Se l'endpoint contiene già `/v1/logs`, viene usato così com'è per i log.
- `diagnostics.otel.logs` abilita l'esportazione OTLP dei log per l'output del logger principale.

### Comportamento dell'esportazione dei log

- I log OTLP usano gli stessi record strutturati scritti in `logging.file`.
- Rispettano `logging.level` (livello dei log su file). La redazione della console **non** si applica
  ai log OTLP.
- Installazioni ad alto volume dovrebbero preferire sampling/filtering nel collector OTLP.

## Suggerimenti per la risoluzione dei problemi

- **Gateway non raggiungibile?** Esegui prima `openclaw doctor`.
- **Log vuoti?** Controlla che il Gateway sia in esecuzione e stia scrivendo nel percorso file
  in `logging.file`.
- **Ti servono più dettagli?** Imposta `logging.level` su `debug` o `trace` e riprova.

## Correlati

- [Interni del logging del Gateway](/it/gateway/logging) — stili dei log WS, prefissi dei sottosistemi e acquisizione della console
- [Diagnostica](/it/gateway/configuration-reference#diagnostics) — esportazione OpenTelemetry e configurazione delle trace della cache
