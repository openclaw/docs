---
read_when:
    - Ti serve una panoramica adatta ai principianti sulla registrazione degli eventi in OpenClaw
    - Vuoi configurare i livelli di log, i formati o l'oscuramento
    - Stai diagnosticando un problema e devi trovare rapidamente i log
summary: Log su file, output della console, tailing della CLI e scheda Log della UI di controllo
title: Registrazione dei log
x-i18n:
    generated_at: "2026-04-30T09:00:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 916fb03219d571f0302560a4cb6755940575c92fff0b4eab024b9dad53f841ce
    source_path: logging.md
    workflow: 16
---

OpenClaw ha due superfici di log principali:

- **Log su file** (righe JSON) scritti dal Gateway.
- **Output console** mostrato nei terminali e nella Gateway Debug UI.

La scheda **Logs** della Control UI segue in tempo reale il log su file del gateway. Questa pagina spiega dove si trovano
i log, come leggerli e come configurare livelli e formati di log.

## Dove si trovano i log

Per impostazione predefinita, il Gateway scrive un file di log a rotazione in:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La data usa il fuso orario locale dell'host del gateway.

Ogni file ruota quando raggiunge `logging.maxFileBytes` (predefinito: 100 MB).
OpenClaw mantiene fino a cinque archivi numerati accanto al file attivo, come
`openclaw-YYYY-MM-DD.1.log`, e continua a scrivere in un nuovo log attivo invece di
sopprimere la diagnostica.

Puoi sovrascrivere questa impostazione in `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Come leggere i log

### CLI: tail live (consigliato)

Usa la CLI per seguire in tempo reale il file di log del gateway tramite RPC:

```bash
openclaw logs --follow
```

Opzioni attuali utili:

- `--local-time`: visualizza i timestamp nel tuo fuso orario locale
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flag RPC standard del Gateway
- `--expect-final`: flag di attesa della risposta finale RPC supportata da agente (accettato qui tramite il livello client condiviso)

Modalita' di output:

- **Sessioni TTY**: righe di log strutturate, colorate e leggibili.
- **Sessioni non TTY**: testo semplice.
- `--json`: JSON delimitato da righe (un evento di log per riga).
- `--plain`: forza il testo semplice nelle sessioni TTY.
- `--no-color`: disabilita i colori ANSI.

Quando passi un `--url` esplicito, la CLI non applica automaticamente le credenziali di configurazione o
di ambiente; includi tu `--token` se il Gateway di destinazione
richiede autenticazione.

In modalita' JSON, la CLI emette oggetti con tag `type`:

- `meta`: metadati dello stream (file, cursore, dimensione)
- `log`: voce di log analizzata
- `notice`: suggerimenti di troncamento / rotazione
- `raw`: riga di log non analizzata

Se il Gateway local loopback implicito richiede l'abbinamento, si chiude durante la connessione,
o va in timeout prima che `logs.tail` risponda, `openclaw logs` ripiega automaticamente sul
log su file del Gateway configurato. Le destinazioni `--url` esplicite non usano
questo fallback.

Se il Gateway non e' raggiungibile, la CLI stampa un breve suggerimento per eseguire:

```bash
openclaw doctor
```

### Control UI (web)

La scheda **Logs** della Control UI segue in tempo reale lo stesso file usando `logs.tail`.
Vedi [/web/control-ui](/it/web/control-ui) per sapere come aprirla.

### Log solo canale

Per filtrare l'attivita' dei canali (WhatsApp/Telegram/ecc.), usa:

```bash
openclaw channels logs --channel whatsapp
```

## Formati di log

### Log su file (JSONL)

Ogni riga nel file di log e' un oggetto JSON. La CLI e la Control UI analizzano queste
voci per visualizzare output strutturato (ora, livello, sottosistema, messaggio).

I record JSONL dei log su file includono anche campi di primo livello filtrabili da macchina quando
disponibili:

- `hostname`: nome host del gateway.
- `message`: testo del messaggio di log appiattito per la ricerca full-text.
- `agent_id`: id dell'agente attivo quando la chiamata di log porta il contesto dell'agente.
- `session_id`: id/chiave della sessione attiva quando la chiamata di log porta il contesto della sessione.
- `channel`: canale attivo quando la chiamata di log porta il contesto del canale.

OpenClaw conserva gli argomenti originali del log strutturato accanto a questi campi
cosi' i parser esistenti che leggono le chiavi numerate degli argomenti tslog continuano a funzionare.

### Output console

I log console sono **consapevoli del TTY** e formattati per la leggibilita':

- Prefissi di sottosistema (ad es. `gateway/channels/whatsapp`)
- Colorazione del livello (info/warn/error)
- Modalita' compatta o JSON opzionale

La formattazione della console e' controllata da `logging.consoleStyle`.

### Log WebSocket del Gateway

`openclaw gateway` ha anche logging del protocollo WebSocket per il traffico RPC:

- modalita' normale: solo risultati interessanti (errori, errori di parsing, chiamate lente)
- `--verbose`: tutto il traffico richiesta/risposta
- `--ws-log auto|compact|full`: scegli lo stile di rendering verboso
- `--compact`: alias di `--ws-log compact`

Esempi:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Configurare il logging

Tutta la configurazione di logging si trova sotto `logging` in `~/.openclaw/openclaw.json`.

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
- `logging.consoleLevel`: livello di verbosita' della **console**.

Puoi sovrascrivere entrambi tramite la variabile d'ambiente **`OPENCLAW_LOG_LEVEL`** (ad es. `OPENCLAW_LOG_LEVEL=debug`). La variabile d'ambiente ha precedenza sul file di configurazione, quindi puoi aumentare la verbosita' per una singola esecuzione senza modificare `openclaw.json`. Puoi anche passare l'opzione globale della CLI **`--log-level <level>`** (per esempio, `openclaw --log-level debug gateway run`), che sovrascrive la variabile d'ambiente per quel comando.

`--verbose` influisce solo sull'output console e sulla verbosita' dei log WS; non cambia
i livelli dei log su file.

### Correlazione delle tracce

I log su file sono JSONL. Quando una chiamata di log porta un contesto di traccia diagnostica valido,
OpenClaw scrive i campi della traccia come chiavi JSON di primo livello (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) cosi' i processori di log esterni possono correlare la riga
con span OTEL e propagazione `traceparent` dei provider.

Le richieste HTTP del Gateway e i frame WebSocket del Gateway stabiliscono un ambito di traccia interno
della richiesta. I log e gli eventi diagnostici emessi dentro quell'ambito async ereditano
la traccia della richiesta quando non passano un contesto di traccia esplicito. Le tracce di esecuzione agente e
di chiamata al modello diventano figlie della traccia di richiesta attiva, quindi log locali,
snapshot diagnostici, span OTEL e header `traceparent` di provider fidati possono
essere uniti tramite `traceId` senza registrare contenuto grezzo della richiesta o del modello.

### Dimensione e temporizzazione delle chiamate al modello

La diagnostica delle chiamate al modello registra misurazioni limitate di richiesta/risposta senza
catturare contenuto grezzo di prompt o risposta:

- `requestPayloadBytes`: dimensione in byte UTF-8 del payload finale della richiesta al modello
- `responseStreamBytes`: dimensione in byte UTF-8 degli eventi di risposta del modello in streaming
- `timeToFirstByteMs`: tempo trascorso prima del primo evento di risposta in streaming
- `durationMs`: durata totale della chiamata al modello

Questi campi sono disponibili per snapshot diagnostici, hook dei plugin per chiamate al modello e
span/metriche OTEL delle chiamate al modello quando l'esportazione diagnostica e' abilitata.

### Stili console

`logging.consoleStyle`:

- `pretty`: leggibile per persone, colorato, con timestamp.
- `compact`: output piu' compatto (ideale per sessioni lunghe).
- `json`: JSON per riga (per processori di log).

### Redazione

OpenClaw puo' redigere token sensibili prima che raggiungano output console, log su file,
record di log OTLP, testo della trascrizione di sessione persistito o payload degli eventi degli strumenti della Control UI
(argomenti di avvio strumento, payload di risultati parziali/finali, output exec derivato e riepiloghi patch):

- `logging.redactSensitive`: `off` | `tools` (predefinito: `tools`)
- `logging.redactPatterns`: elenco di stringhe regex per sovrascrivere il set predefinito. I pattern personalizzati si applicano in aggiunta ai valori predefiniti integrati per i payload degli strumenti della Control UI, quindi aggiungere un pattern non indebolisce mai la redazione dei valori gia' intercettati dai valori predefiniti.

I log su file e le trascrizioni di sessione restano JSONL, ma i valori segreti corrispondenti vengono
mascherati prima che la riga o il messaggio venga scritto su disco. La redazione e' best-effort:
si applica al contenuto dei messaggi testuali e alle stringhe di log, non a ogni
identificatore o campo di payload binario.

`logging.redactSensitive: "off"` disabilita solo questa policy generale di log/trascrizioni.
OpenClaw redige comunque i payload di confine di sicurezza che possono essere mostrati ai client UI,
ai bundle di supporto, agli osservatori diagnostici, ai prompt di approvazione o agli strumenti agente.
Gli esempi includono eventi di chiamata strumento della Control UI, output `sessions_history`,
esportazioni di supporto diagnostico, osservazioni di errori dei provider, visualizzazione del comando di approvazione exec
e log del protocollo WebSocket del Gateway. I `logging.redactPatterns` personalizzati
possono comunque aggiungere pattern specifici del progetto su queste superfici.

## Diagnostica e OpenTelemetry

La diagnostica e' composta da eventi strutturati, leggibili da macchina per esecuzioni del modello e
telemetria del flusso messaggi (webhook, accodamento, stato della sessione). **Non**
sostituiscono i log: alimentano metriche, tracce ed esportatori. Gli eventi vengono emessi
nel processo indipendentemente dal fatto che tu li esporti o meno.

Due superfici adiacenti:

- **Esportazione OpenTelemetry** — invia metriche, tracce e log tramite OTLP/HTTP a
  qualsiasi collector o backend compatibile con OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, ecc.). Configurazione completa, catalogo dei segnali,
  nomi di metriche/span, variabili d'ambiente e modello di privacy si trovano in una pagina dedicata:
  [Esportazione OpenTelemetry](/it/gateway/opentelemetry).
- **Flag diagnostici** — flag di log di debug mirati che indirizzano log extra a
  `logging.file` senza aumentare `logging.level`. I flag non distinguono maiuscole/minuscole
  e supportano caratteri jolly (`telegram.*`, `*`). Configurali sotto `diagnostics.flags`
  o tramite l'override env `OPENCLAW_DIAGNOSTICS=...`. Guida completa:
  [Flag diagnostici](/it/diagnostics/flags).

Per abilitare eventi diagnostici per plugin o sink personalizzati senza esportazione OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Per esportazione OTLP verso un collector, vedi [Esportazione OpenTelemetry](/it/gateway/opentelemetry).

## Suggerimenti per la risoluzione dei problemi

- **Gateway non raggiungibile?** Esegui prima `openclaw doctor`.
- **Log vuoti?** Verifica che il Gateway sia in esecuzione e stia scrivendo nel percorso file
  in `logging.file`.
- **Serve piu' dettaglio?** Imposta `logging.level` su `debug` o `trace` e riprova.

## Correlati

- [Esportazione OpenTelemetry](/it/gateway/opentelemetry) — esportazione OTLP/HTTP, catalogo metriche/span, modello di privacy
- [Flag diagnostici](/it/diagnostics/flags) — flag di log di debug mirati
- [Interni del logging del Gateway](/it/gateway/logging) — stili di log WS, prefissi di sottosistema e cattura della console
- [Riferimento di configurazione](/it/gateway/configuration-reference#diagnostics) — riferimento completo dei campi `diagnostics.*`
