---
read_when:
    - Ti serve una panoramica introduttiva del sistema di log di OpenClaw
    - Vuoi configurare i livelli di log, i formati o l'oscuramento
    - Stai risolvendo un problema e devi trovare rapidamente i log
summary: Log su file, output della console, tailing della CLI e scheda Log dell'interfaccia di controllo
title: Registrazione dei log
x-i18n:
    generated_at: "2026-05-11T20:31:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49b28755998bbe667dd986ae8440d9006d03b0704679bb6d64b5a148a25fc50e
    source_path: logging.md
    workflow: 16
---

OpenClaw ha due superfici principali per i log:

- **Log su file** (righe JSON) scritti dal Gateway.
- **Output della console** mostrato nei terminali e nella UI di debug del Gateway.

La scheda **Log** della Control UI segue in tempo reale il file di log del gateway. Questa pagina spiega dove
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

### CLI: tail live (consigliato)

Usa la CLI per seguire il file di log del gateway tramite RPC:

```bash
openclaw logs --follow
```

Opzioni correnti utili:

- `--local-time`: mostra i timestamp nel tuo fuso orario locale
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flag RPC standard del Gateway
- `--expect-final`: flag di attesa della risposta finale RPC basata su agente (accettato qui tramite il livello client condiviso)

Modalità di output:

- **Sessioni TTY**: righe di log strutturate, leggibili e colorate.
- **Sessioni non TTY**: testo semplice.
- `--json`: JSON delimitato da righe (un evento di log per riga).
- `--plain`: forza il testo semplice nelle sessioni TTY.
- `--no-color`: disabilita i colori ANSI.

Quando passi un `--url` esplicito, la CLI non applica automaticamente la configurazione o
le credenziali dell'ambiente; includi tu stesso `--token` se il Gateway di destinazione
richiede l'autenticazione.

In modalità JSON, la CLI emette oggetti contrassegnati da `type`:

- `meta`: metadati dello stream (file, cursore, dimensione)
- `log`: voce di log analizzata
- `notice`: suggerimenti su troncamento / rotazione
- `raw`: riga di log non analizzata

Se il Gateway local loopback implicito richiede l'abbinamento, si chiude durante la connessione,
o va in timeout prima che `logs.tail` risponda, `openclaw logs` ripiega automaticamente sul
file di log del Gateway configurato. Le destinazioni esplicite `--url` non usano
questo fallback.

Se il Gateway non è raggiungibile, la CLI stampa un breve suggerimento per eseguire:

```bash
openclaw doctor
```

### Control UI (web)

La scheda **Log** della Control UI segue lo stesso file usando `logs.tail`.
Consulta [Control UI](/it/web/control-ui) per sapere come aprirla.

### Log solo canale

Per filtrare l'attività dei canali (WhatsApp/Telegram/ecc.), usa:

```bash
openclaw channels logs --channel whatsapp
```

## Formati dei log

### Log su file (JSONL)

Ogni riga nel file di log è un oggetto JSON. La CLI e la Control UI analizzano queste
voci per visualizzare output strutturato (ora, livello, sottosistema, messaggio).

I record JSONL dei log su file includono anche campi di primo livello filtrabili dalla macchina quando
disponibili:

- `hostname`: nome dell'host del gateway.
- `message`: testo del messaggio di log appiattito per la ricerca full-text.
- `agent_id`: id dell'agente attivo quando la chiamata di log porta con sé il contesto dell'agente.
- `session_id`: id/chiave della sessione attiva quando la chiamata di log porta con sé il contesto della sessione.
- `channel`: canale attivo quando la chiamata di log porta con sé il contesto del canale.

OpenClaw conserva gli argomenti originali del log strutturato insieme a questi campi,
così i parser esistenti che leggono le chiavi numerate degli argomenti tslog continuano a funzionare.

Le attività di conversazione, voce in tempo reale e stanza gestita emettono record di log
del ciclo di vita con limiti attraverso questa stessa pipeline di log su file. Questi record includono tipo di evento,
modalità, trasporto, provider e misurazioni di dimensione/tempistica quando disponibili, ma omettono
testo della trascrizione, payload audio, id dei turni, id delle chiamate e id degli elementi del provider.

### Output della console

I log della console sono **TTY-aware** e formattati per la leggibilità:

- Prefissi dei sottosistemi (ad es. `gateway/channels/whatsapp`)
- Colorazione dei livelli (info/warn/error)
- Modalità compatta o JSON opzionale

La formattazione della console è controllata da `logging.consoleStyle`.

### Log WebSocket del Gateway

`openclaw gateway` ha anche log del protocollo WebSocket per il traffico RPC:

- modalità normale: solo risultati interessanti (errori, errori di parsing, chiamate lente)
- `--verbose`: tutto il traffico di richiesta/risposta
- `--ws-log auto|compact|full`: scegli lo stile di rendering dettagliato
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

Puoi sovrascrivere entrambi tramite la variabile d'ambiente **`OPENCLAW_LOG_LEVEL`** (ad es. `OPENCLAW_LOG_LEVEL=debug`). La variabile d'ambiente ha precedenza sul file di configurazione, quindi puoi aumentare la verbosità per una singola esecuzione senza modificare `openclaw.json`. Puoi anche passare l'opzione globale della CLI **`--log-level <level>`** (per esempio, `openclaw --log-level debug gateway run`), che sovrascrive la variabile d'ambiente per quel comando.

`--verbose` influisce solo sull'output della console e sulla verbosità dei log WS; non cambia
i livelli dei log su file.

### Diagnostica mirata del trasporto del modello

Quando esegui il debug delle chiamate ai provider, usa flag d'ambiente mirati invece di aumentare
tutti i log a `debug`:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Flag disponibili:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: emette avvio della richiesta, risposta fetch, header SDK,
  primo evento di streaming, completamento dello stream ed errori di trasporto al
  livello `info`.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: include un riepilogo limitato del payload della richiesta
  nei log delle richieste del modello.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: include tutti i nomi degli strumenti esposti al modello nel
  riepilogo del payload.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: include uno snapshot JSON redatto e limitato
  del payload. Usalo solo durante il debug; i segreti sono redatti ma prompt
  e testo dei messaggi potrebbero essere ancora presenti.
- `OPENCLAW_DEBUG_SSE=events`: emette la tempistica del primo evento e del completamento dello stream.
- `OPENCLAW_DEBUG_SSE=peek`: emette anche i primi cinque payload redatti degli eventi SSE,
  con limite per evento.
- `OPENCLAW_DEBUG_CODE_MODE=1`: emette diagnostica della superficie del modello in code mode,
  incluso quando gli strumenti nativi del provider sono nascosti perché la code mode possiede la
  superficie degli strumenti.

Questi flag registrano tramite il normale logging di OpenClaw, quindi `openclaw logs --follow`
e la scheda Log della Control UI li mostrano. Senza i flag, la stessa diagnostica
rimane disponibile al livello `debug`.

### Correlazione delle tracce

I log su file sono JSONL. Quando una chiamata di log porta con sé un contesto di traccia diagnostica valido,
OpenClaw scrive i campi della traccia come chiavi JSON di primo livello (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) così i processori di log esterni possono correlare la riga
con gli span OTEL e la propagazione `traceparent` del provider.

Le richieste HTTP del Gateway e i frame WebSocket del Gateway stabiliscono un ambito interno di traccia
della richiesta. I log e gli eventi diagnostici emessi dentro quell'ambito async ereditano
la traccia della richiesta quando non passano un contesto di traccia esplicito. Le tracce delle esecuzioni agente e
delle chiamate al modello diventano figli della traccia di richiesta attiva, quindi log locali,
snapshot diagnostici, span OTEL e header `traceparent` attendibili del provider possono
essere uniti tramite `traceId` senza registrare contenuto grezzo della richiesta o del modello.

I record di log del ciclo di vita delle conversazioni confluiscono anche nei log OTLP quando l'esportazione dei log OpenTelemetry
è abilitata, usando gli stessi attributi limitati dei log su file.

### Dimensione e tempistica delle chiamate al modello

La diagnostica delle chiamate al modello registra misurazioni limitate di richiesta/risposta senza
catturare il contenuto grezzo di prompt o risposta:

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

OpenClaw può redarre token sensibili prima che raggiungano l'output della console, i log su file,
i record di log OTLP, il testo persistito della trascrizione della sessione o i payload degli eventi
strumento della Control UI (argomenti di avvio strumento, payload di risultato parziali/finali, output
exec derivato e riepiloghi delle patch):

- `logging.redactSensitive`: `off` | `tools` (predefinito: `tools`)
- `logging.redactPatterns`: elenco di stringhe regex per sovrascrivere il set predefinito. I pattern personalizzati si applicano sopra i valori predefiniti integrati per i payload degli strumenti della Control UI, quindi aggiungere un pattern non indebolisce mai la redazione dei valori già intercettati dai predefiniti.

I log su file e le trascrizioni delle sessioni restano JSONL, ma i valori segreti corrispondenti vengono
mascherati prima che la riga o il messaggio venga scritto su disco. La redazione è best-effort:
si applica al contenuto dei messaggi che contiene testo e alle stringhe di log, non a ogni
identificatore o campo di payload binario.

I valori predefiniti integrati coprono credenziali API comuni e nomi di campi di credenziali di pagamento
come numero di carta, CVC/CVV, token di pagamento condiviso e credenziale di pagamento
quando compaiono come campi JSON, parametri URL, flag CLI o assegnazioni.

`logging.redactSensitive: "off"` disabilita solo questa policy generale di log/trascrizione.
OpenClaw redige comunque i payload di confine di sicurezza che possono essere mostrati a client UI,
bundle di supporto, osservatori diagnostici, prompt di approvazione o strumenti degli agenti.
Gli esempi includono eventi di chiamata strumento della Control UI, output `sessions_history`,
esportazioni di supporto diagnostico, osservazioni di errore del provider, visualizzazione del comando di approvazione exec
e log del protocollo WebSocket del Gateway. `logging.redactPatterns` personalizzati
possono comunque aggiungere pattern specifici del progetto su quelle superfici.

## Diagnostica e OpenTelemetry

La diagnostica è composta da eventi strutturati e leggibili dalla macchina per esecuzioni del modello e
telemetria del flusso dei messaggi (webhook, accodamento, stato della sessione). Non
sostituisce i log: alimenta metriche, tracce ed esportatori. Gli eventi sono emessi
nel processo, indipendentemente dal fatto che vengano esportati o meno.

Due superfici adiacenti:

- **Esportazione OpenTelemetry** — invia metriche, tracce e log tramite OTLP/HTTP a
  qualsiasi collector o backend compatibile con OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, ecc.). Configurazione completa, catalogo dei segnali,
  nomi di metriche/span, variabili d'ambiente e modello di privacy si trovano in una pagina dedicata:
  [Esportazione OpenTelemetry](/it/gateway/opentelemetry).
- **Flag diagnostici** — flag di log di debug mirati che instradano log extra verso
  `logging.file` senza aumentare `logging.level`. I flag non distinguono maiuscole/minuscole
  e supportano wildcard (`telegram.*`, `*`). Configurali sotto `diagnostics.flags`
  o tramite l'override env `OPENCLAW_DIAGNOSTICS=...`. Guida completa:
  [Flag diagnostici](/it/diagnostics/flags).

Per abilitare eventi diagnostici per Plugin o sink personalizzati senza esportazione OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Per l'esportazione OTLP verso un collector, consulta [Esportazione OpenTelemetry](/it/gateway/opentelemetry).

## Suggerimenti per la risoluzione dei problemi

- **Gateway non raggiungibile?** Esegui prima `openclaw doctor`.
- **Log vuoti?** Controlla che il Gateway sia in esecuzione e stia scrivendo nel percorso file
  in `logging.file`.
- **Serve più dettaglio?** Imposta `logging.level` su `debug` o `trace` e riprova.

## Correlati

- [Esportazione OpenTelemetry](/it/gateway/opentelemetry) — esportazione OTLP/HTTP, catalogo metriche/span, modello di privacy
- [Flag diagnostici](/it/diagnostics/flags) — flag di log di debug mirati
- [Interni del logging del Gateway](/it/gateway/logging) — stili dei log WS, prefissi dei sottosistemi e cattura della console
- [Riferimento di configurazione](/it/gateway/configuration-reference#diagnostics) — riferimento completo dei campi `diagnostics.*`
