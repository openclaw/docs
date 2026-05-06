---
read_when:
    - Ti serve una panoramica adatta ai principianti sulla registrazione dei log di OpenClaw
    - Vuoi configurare i livelli di log, i formati o l'oscuramento
    - Stai effettuando la risoluzione dei problemi e devi trovare rapidamente i log
summary: Log su file, output della console, visualizzazione in tempo reale tramite CLI e scheda Log della Control UI
title: Registrazione dei log
x-i18n:
    generated_at: "2026-05-06T08:57:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: abcdfeb0f9fbd13715762a1829198d0285738855c50f2ee531cab1e989d936b1
    source_path: logging.md
    workflow: 16
---

OpenClaw ha due superfici principali per i log:

- **Log su file** (righe JSON) scritti dal Gateway.
- **Output della console** mostrato nei terminali e nell'interfaccia di debug del Gateway.

La scheda **Log** della UI di controllo segue in tempo reale il log su file del gateway. Questa pagina spiega dove
si trovano i log, come leggerli e come configurare livelli e formati dei log.

## Dove si trovano i log

Per impostazione predefinita, il Gateway scrive un file di log a rotazione in:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La data usa il fuso orario locale dell'host del gateway.

Ogni file ruota quando raggiunge `logging.maxFileBytes` (predefinito: 100 MB).
OpenClaw conserva fino a cinque archivi numerati accanto al file attivo, come
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

### CLI: tail in tempo reale (consigliato)

Usa la CLI per seguire in tempo reale il file di log del gateway tramite RPC:

```bash
openclaw logs --follow
```

Opzioni attualmente utili:

- `--local-time`: mostra i timestamp nel tuo fuso orario locale
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flag RPC standard del Gateway
- `--expect-final`: flag di attesa della risposta finale RPC supportata da agente (accettato qui tramite il livello client condiviso)

Modalità di output:

- **Sessioni TTY**: righe di log strutturate, leggibili e colorate.
- **Sessioni non TTY**: testo semplice.
- `--json`: JSON delimitato da righe (un evento di log per riga).
- `--plain`: forza il testo semplice nelle sessioni TTY.
- `--no-color`: disabilita i colori ANSI.

Quando passi un `--url` esplicito, la CLI non applica automaticamente le credenziali di configurazione o
di ambiente; includi tu stesso `--token` se il Gateway di destinazione
richiede autenticazione.

In modalità JSON, la CLI emette oggetti con tag `type`:

- `meta`: metadati dello stream (file, cursore, dimensione)
- `log`: voce di log analizzata
- `notice`: suggerimenti di troncamento / rotazione
- `raw`: riga di log non analizzata

Se il Gateway local loopback implicito richiede l'associazione, si chiude durante la connessione
o va in timeout prima che `logs.tail` risponda, `openclaw logs` ripiega automaticamente sul
log su file del Gateway configurato. Le destinazioni `--url` esplicite non usano
questo fallback.

Se il Gateway non è raggiungibile, la CLI stampa un breve suggerimento per eseguire:

```bash
openclaw doctor
```

### UI di controllo (web)

La scheda **Log** della UI di controllo segue in tempo reale lo stesso file usando `logs.tail`.
Vedi [UI di controllo](/it/web/control-ui) per sapere come aprirla.

### Log solo dei canali

Per filtrare l'attività dei canali (WhatsApp/Telegram/ecc.), usa:

```bash
openclaw channels logs --channel whatsapp
```

## Formati dei log

### Log su file (JSONL)

Ogni riga nel file di log è un oggetto JSON. La CLI e la UI di controllo analizzano queste
voci per mostrare un output strutturato (ora, livello, sottosistema, messaggio).

I record JSONL dei log su file includono anche campi di primo livello filtrabili automaticamente quando
disponibili:

- `hostname`: nome host del gateway.
- `message`: testo del messaggio di log appiattito per la ricerca full-text.
- `agent_id`: id dell'agente attivo quando la chiamata di log trasporta il contesto dell'agente.
- `session_id`: id/chiave della sessione attiva quando la chiamata di log trasporta il contesto della sessione.
- `channel`: canale attivo quando la chiamata di log trasporta il contesto del canale.

OpenClaw conserva gli argomenti originali del log strutturato accanto a questi campi,
così i parser esistenti che leggono le chiavi numerate degli argomenti tslog continuano a funzionare.

### Output della console

I log della console sono **consapevoli del TTY** e formattati per la leggibilità:

- Prefissi dei sottosistemi (ad es. `gateway/channels/whatsapp`)
- Colorazione dei livelli (info/warn/error)
- Modalità compatta o JSON opzionale

La formattazione della console è controllata da `logging.consoleStyle`.

### Log WebSocket del Gateway

`openclaw gateway` ha anche il logging del protocollo WebSocket per il traffico RPC:

- modalità normale: solo risultati interessanti (errori, errori di parsing, chiamate lente)
- `--verbose`: tutto il traffico richiesta/risposta
- `--ws-log auto|compact|full`: sceglie lo stile di rendering dettagliato
- `--compact`: alias per `--ws-log compact`

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
- `logging.consoleLevel`: livello di verbosità della **console**.

Puoi sovrascrivere entrambi tramite la variabile di ambiente **`OPENCLAW_LOG_LEVEL`** (ad es. `OPENCLAW_LOG_LEVEL=debug`). La variabile di ambiente ha precedenza sul file di configurazione, quindi puoi aumentare la verbosità per una singola esecuzione senza modificare `openclaw.json`. Puoi anche passare l'opzione globale della CLI **`--log-level <level>`** (per esempio, `openclaw --log-level debug gateway run`), che sovrascrive la variabile di ambiente per quel comando.

`--verbose` influisce solo sull'output della console e sulla verbosità dei log WS; non cambia
i livelli dei log su file.

### Correlazione delle trace

I log su file sono JSONL. Quando una chiamata di log trasporta un contesto di trace diagnostica valido,
OpenClaw scrive i campi della trace come chiavi JSON di primo livello (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) così i processori di log esterni possono correlare la riga
con gli span OTEL e la propagazione `traceparent` del provider.

Le richieste HTTP del Gateway e i frame WebSocket del Gateway stabiliscono un ambito interno di trace
della richiesta. I log e gli eventi diagnostici emessi all'interno di quell'ambito asincrono ereditano
la trace della richiesta quando non passano un contesto di trace esplicito. Le trace di esecuzione degli agenti e
delle chiamate al modello diventano figli della trace della richiesta attiva, così log locali,
snapshot diagnostici, span OTEL e header `traceparent` affidabili del provider possono
essere uniti tramite `traceId` senza registrare il contenuto grezzo della richiesta o del modello.

### Dimensione e tempi delle chiamate al modello

La diagnostica delle chiamate al modello registra misurazioni limitate di richiesta/risposta senza
acquisire il contenuto grezzo del prompt o della risposta:

- `requestPayloadBytes`: dimensione in byte UTF-8 del payload finale della richiesta al modello
- `responseStreamBytes`: dimensione in byte UTF-8 degli eventi di risposta del modello in streaming
- `timeToFirstByteMs`: tempo trascorso prima del primo evento di risposta in streaming
- `durationMs`: durata totale della chiamata al modello

Questi campi sono disponibili per snapshot diagnostici, hook Plugin delle chiamate al modello e
span/metriche OTEL delle chiamate al modello quando l'esportazione della diagnostica è abilitata.

### Stili della console

`logging.consoleStyle`:

- `pretty`: leggibile per gli esseri umani, colorato, con timestamp.
- `compact`: output più compatto (ideale per sessioni lunghe).
- `json`: JSON per riga (per processori di log).

### Redazione

OpenClaw può redigere token sensibili prima che raggiungano l'output della console, i log su file,
i record di log OTLP, il testo persistito della trascrizione della sessione o i payload degli eventi
strumento della UI di controllo (argomenti di avvio dello strumento, payload dei risultati parziali/finali, output
exec derivato e riepiloghi delle patch):

- `logging.redactSensitive`: `off` | `tools` (predefinito: `tools`)
- `logging.redactPatterns`: elenco di stringhe regex per sovrascrivere il set predefinito. I pattern personalizzati si applicano sopra i valori predefiniti integrati per i payload degli strumenti della UI di controllo, quindi aggiungere un pattern non indebolisce mai la redazione dei valori già intercettati dai valori predefiniti.

I log su file e le trascrizioni di sessione restano JSONL, ma i valori segreti corrispondenti vengono
mascherati prima che la riga o il messaggio venga scritto su disco. La redazione è best-effort:
si applica al contenuto dei messaggi testuali e alle stringhe di log, non a ogni
identificatore o campo di payload binario.

I valori predefiniti integrati coprono credenziali API comuni e nomi di campi di credenziali di pagamento
come numero di carta, CVC/CVV, token di pagamento condiviso e credenziale di pagamento
quando compaiono come campi JSON, parametri URL, flag CLI o assegnazioni.

`logging.redactSensitive: "off"` disabilita solo questa policy generale per log/trascrizioni.
OpenClaw redige comunque i payload di confine di sicurezza che possono essere mostrati ai client
UI, bundle di supporto, osservatori diagnostici, prompt di approvazione o strumenti degli agenti.
Gli esempi includono eventi di chiamata strumento della UI di controllo, output `sessions_history`,
esportazioni diagnostiche per il supporto, osservazioni degli errori dei provider, visualizzazione dei comandi
di approvazione exec e log del protocollo WebSocket del Gateway. `logging.redactPatterns` personalizzati
possono comunque aggiungere pattern specifici del progetto su quelle superfici.

## Diagnostica e OpenTelemetry

La diagnostica è composta da eventi strutturati e leggibili automaticamente per esecuzioni del modello e
telemetria del flusso dei messaggi (webhook, accodamento, stato della sessione). Non
sostituisce i log: alimenta metriche, trace ed esportatori. Gli eventi vengono emessi
nel processo, indipendentemente dal fatto che vengano esportati o meno.

Due superfici adiacenti:

- **Esportazione OpenTelemetry** — invia metriche, trace e log tramite OTLP/HTTP a
  qualsiasi collettore o backend compatibile con OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, ecc.). Configurazione completa, catalogo dei segnali,
  nomi di metriche/span, variabili di ambiente e modello di privacy si trovano in una pagina dedicata:
  [Esportazione OpenTelemetry](/it/gateway/opentelemetry).
- **Flag diagnostici** — flag di log di debug mirati che instradano log extra verso
  `logging.file` senza aumentare `logging.level`. I flag non distinguono tra maiuscole e minuscole
  e supportano i caratteri jolly (`telegram.*`, `*`). Configura sotto `diagnostics.flags`
  o tramite l'override della variabile di ambiente `OPENCLAW_DIAGNOSTICS=...`. Guida completa:
  [Flag diagnostici](/it/diagnostics/flags).

Per abilitare eventi diagnostici per Plugin o sink personalizzati senza esportazione OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Per l'esportazione OTLP verso un collettore, vedi [Esportazione OpenTelemetry](/it/gateway/opentelemetry).

## Suggerimenti per la risoluzione dei problemi

- **Gateway non raggiungibile?** Esegui prima `openclaw doctor`.
- **Log vuoti?** Controlla che il Gateway sia in esecuzione e stia scrivendo nel percorso del file
  in `logging.file`.
- **Serve più dettaglio?** Imposta `logging.level` su `debug` o `trace` e riprova.

## Correlati

- [Esportazione OpenTelemetry](/it/gateway/opentelemetry) — esportazione OTLP/HTTP, catalogo metriche/span, modello di privacy
- [Flag diagnostici](/it/diagnostics/flags) — flag di log di debug mirati
- [Internals del logging del Gateway](/it/gateway/logging) — stili dei log WS, prefissi dei sottosistemi e acquisizione della console
- [Riferimento della configurazione](/it/gateway/configuration-reference#diagnostics) — riferimento completo dei campi `diagnostics.*`
