---
read_when:
    - Hai bisogno di una panoramica introduttiva del logging di OpenClaw
    - Vuoi configurare livelli, formati o redazione dei log
    - Stai risolvendo un problema e devi trovare rapidamente i log
summary: Registri file, output della console, monitoraggio della CLI e scheda Log dell'interfaccia di controllo
title: Registrazione
x-i18n:
    generated_at: "2026-06-27T17:41:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caf2780dfeeaf29f4ee94429894a03422b211a4414e63062642d1134f38b6b3f
    source_path: logging.md
    workflow: 16
---

OpenClaw ha due superfici di log principali:

- **Log su file** (righe JSON) scritti dal Gateway.
- **Output della console** mostrato nei terminali e nella UI di debug del Gateway.

La scheda **Log** della UI di controllo segue in tempo reale il log su file del gateway. Questa pagina spiega dove
si trovano i log, come leggerli e come configurare livelli e formati di log.

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

Usa la CLI per seguire in tempo reale il file di log del gateway tramite RPC:

```bash
openclaw logs --follow
```

Opzioni correnti utili:

- `--local-time`: visualizza i timestamp nel tuo fuso orario locale
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flag RPC standard del Gateway
- `--expect-final`: flag di attesa della risposta finale RPC supportata da agente (accettato qui tramite il livello client condiviso)

Modalità di output:

- **Sessioni TTY**: righe di log strutturate, leggibili e colorate.
- **Sessioni non TTY**: testo semplice.
- `--json`: JSON delimitato da righe (un evento di log per riga).
- `--plain`: forza il testo semplice nelle sessioni TTY.
- `--no-color`: disabilita i colori ANSI.

Quando passi un `--url` esplicito, la CLI non applica automaticamente le
credenziali di configurazione o di ambiente; includi tu `--token` se il Gateway di destinazione
richiede autenticazione.

In modalità JSON, la CLI emette oggetti contrassegnati da `type`:

- `meta`: metadati del flusso (file, cursore, dimensione)
- `log`: voce di log analizzata
- `notice`: suggerimenti di troncamento / rotazione
- `raw`: riga di log non analizzata

Se il Gateway local loopback implicito richiede l'abbinamento, chiude durante la connessione
o va in timeout prima che `logs.tail` risponda, `openclaw logs` ripiega automaticamente sul
log su file del Gateway configurato. Le destinazioni `--url` esplicite non usano
questo fallback. `openclaw logs --follow` è più rigoroso: su Linux usa il journal Gateway
user-systemd attivo per PID quando disponibile, altrimenti continua a ritentare
il Gateway live invece di seguire un file affiancato potenzialmente obsoleto.

Se il Gateway non è raggiungibile, la CLI stampa un breve suggerimento per eseguire:

```bash
openclaw doctor
```

### UI di controllo (web)

La scheda **Log** della UI di controllo segue in tempo reale lo stesso file usando `logs.tail`.
Vedi [UI di controllo](/it/web/control-ui) per sapere come aprirla.

### Log solo canale

Per filtrare l'attività dei canali (WhatsApp/Telegram/ecc.), usa:

```bash
openclaw channels logs --channel whatsapp
```

## Formati dei log

### Log su file (JSONL)

Ogni riga nel file di log è un oggetto JSON. La CLI e la UI di controllo analizzano queste
voci per visualizzare un output strutturato (ora, livello, sottosistema, messaggio).

I record JSONL dei log su file includono anche campi di primo livello filtrabili dalla macchina quando
disponibili:

- `hostname`: nome host del gateway.
- `message`: testo del messaggio di log appiattito per la ricerca full-text.
- `agent_id`: id dell'agente attivo quando la chiamata di log trasporta il contesto dell'agente.
- `session_id`: id/chiave della sessione attiva quando la chiamata di log trasporta il contesto della sessione.
- `channel`: canale attivo quando la chiamata di log trasporta il contesto del canale.

OpenClaw preserva gli argomenti originali del log strutturato accanto a questi campi
così i parser esistenti che leggono le chiavi numerate degli argomenti tslog continuano a funzionare.

Le attività di conversazione, voce in tempo reale e stanze gestite emettono record di log
di ciclo di vita limitati attraverso questa stessa pipeline di log su file. Questi record includono tipo di evento,
modalità, trasporto, provider e misure di dimensione/temporizzazione quando disponibili, ma omettono
testo della trascrizione, payload audio, id dei turni, id delle chiamate e id degli elementi del provider.

### Output della console

I log della console sono **consapevoli del TTY** e formattati per la leggibilità:

- Prefissi dei sottosistemi (ad es. `gateway/channels/whatsapp`)
- Colorazione del livello (info/warn/error)
- Modalità compatta o JSON opzionale

La formattazione della console è controllata da `logging.consoleStyle`.

### Log WebSocket del Gateway

`openclaw gateway` dispone anche di logging del protocollo WebSocket per il traffico RPC:

- modalità normale: solo risultati interessanti (errori, errori di analisi, chiamate lente)
- `--verbose`: tutto il traffico richiesta/risposta
- `--ws-log auto|compact|full`: sceglie lo stile di rendering dettagliato
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
- `logging.consoleLevel`: livello di verbosità della **console**.

Puoi sovrascriverli entrambi tramite la variabile di ambiente **`OPENCLAW_LOG_LEVEL`** (ad es. `OPENCLAW_LOG_LEVEL=debug`). La variabile di ambiente ha precedenza sul file di configurazione, quindi puoi aumentare la verbosità per una singola esecuzione senza modificare `openclaw.json`. Puoi anche passare l'opzione globale della CLI **`--log-level <level>`** (per esempio, `openclaw --log-level debug gateway run`), che sovrascrive la variabile di ambiente per quel comando.

`--verbose` influisce solo sull'output della console e sulla verbosità dei log WS; non modifica
i livelli dei log su file.

### Diagnostica mirata del trasporto del modello

Quando esegui il debug delle chiamate ai provider, usa flag di ambiente mirati invece di impostare
tutti i log su `debug`:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Flag disponibili:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: emette avvio richiesta, risposta fetch, intestazioni SDK,
  primo evento di streaming, completamento dello stream ed errori di trasporto al livello
  `info`.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: include un riepilogo limitato del payload della richiesta
  nei log delle richieste al modello.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: include tutti i nomi degli strumenti visibili al modello nel
  riepilogo del payload.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: include uno snapshot JSON redatto e limitato del
  payload. Usalo solo durante il debug; i segreti vengono redatti ma prompt
  e testo dei messaggi potrebbero essere ancora presenti.
- `OPENCLAW_DEBUG_SSE=events`: emette le tempistiche del primo evento e del completamento dello stream.
- `OPENCLAW_DEBUG_SSE=peek`: emette anche i primi cinque payload degli eventi SSE redatti,
  limitati per evento.
- `OPENCLAW_DEBUG_CODE_MODE=1`: emette diagnostica della superficie del modello in modalità codice,
  incluso quando gli strumenti nativi del provider sono nascosti perché la modalità codice possiede la
  superficie degli strumenti.

Questi flag scrivono tramite il normale logging di OpenClaw, quindi `openclaw logs --follow`
e la scheda Log della UI di controllo li mostrano. Senza i flag, la stessa diagnostica
rimane disponibile al livello `debug`.

I metadati di avvio e risposta `[model-fetch]` (provider, API, modello, stato,
latenza e campi della richiesta come metodo, URL, timeout, proxy e policy)
sono sempre emessi al livello `info` indipendentemente da
`OPENCLAW_DEBUG_MODEL_TRANSPORT`, quindi l'igiene di base del trasporto del modello è visibile
senza flag di debug.

### Correlazione delle tracce

I log su file sono JSONL. Quando una chiamata di log trasporta un contesto di traccia diagnostica valido,
OpenClaw scrive i campi di traccia come chiavi JSON di primo livello (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) così i processori di log esterni possono correlare la riga
con span OTEL e propagazione `traceparent` del provider.

Le richieste HTTP del Gateway e i frame WebSocket del Gateway stabiliscono un ambito di traccia
richiesta interno. I log e gli eventi diagnostici emessi dentro quell'ambito async ereditano
la traccia della richiesta quando non passano un contesto di traccia esplicito. Le tracce di esecuzione agente e
di chiamata modello diventano figlie della traccia richiesta attiva, così log locali,
snapshot diagnostici, span OTEL e intestazioni `traceparent` del provider attendibili possono
essere uniti tramite `traceId` senza registrare contenuto grezzo della richiesta o del modello.

Anche i record di log del ciclo di vita delle conversazioni fluiscono all'esportazione log diagnostics-otel quando
l'esportazione log OpenTelemetry è abilitata, usando gli stessi attributi limitati dei log su file.
Configura `diagnostics.otel.logsExporter` per scegliere OTLP, stdout JSONL o
entrambi i sink.

### Dimensione e temporizzazione delle chiamate al modello

La diagnostica delle chiamate al modello registra misure limitate di richiesta/risposta senza
catturare contenuto grezzo del prompt o della risposta:

- `requestPayloadBytes`: dimensione in byte UTF-8 del payload finale della richiesta al modello
- `responseStreamBytes`: dimensione in byte UTF-8 dei payload dei chunk di risposta del modello in streaming.
  Gli eventi ad alta frequenza di testo, ragionamento e delta delle chiamate agli strumenti contano
  solo i byte incrementali `delta` invece degli snapshot `partial` completi.
- `timeToFirstByteMs`: tempo trascorso prima del primo evento di risposta in streaming
- `durationMs`: durata totale della chiamata al modello

Questi campi sono disponibili per snapshot diagnostici, hook Plugin delle chiamate al modello e
span/metriche OTEL delle chiamate al modello quando l'esportazione diagnostica è abilitata.

### Stili della console

`logging.consoleStyle`:

- `pretty`: leggibile per gli esseri umani, colorato, con timestamp.
- `compact`: output più conciso (ideale per sessioni lunghe).
- `json`: JSON per riga (per processori di log).

### Redazione

OpenClaw può redigere token sensibili prima che raggiungano l'output della console, i log su file,
i record di log OTLP, il testo persistito delle trascrizioni di sessione o i payload degli eventi
strumento della UI di controllo (argomenti di avvio strumento, payload di risultato parziale/finale, output
exec derivato e riepiloghi delle patch):

- `logging.redactSensitive`: `off` | `tools` (predefinito: `tools`)
- `logging.redactPatterns`: elenco di stringhe regex per sovrascrivere l'insieme predefinito. I pattern personalizzati si applicano sopra i valori predefiniti integrati per i payload degli strumenti della UI di controllo, quindi aggiungere un pattern non indebolisce mai la redazione dei valori già intercettati dai predefiniti.

I log su file e le trascrizioni di sessione restano JSONL, ma i valori segreti corrispondenti vengono
mascherati prima che la riga o il messaggio venga scritto su disco. La redazione è best-effort:
si applica ai contenuti dei messaggi che portano testo e alle stringhe di log, non a ogni
identificatore o campo di payload binario.

I valori predefiniti integrati coprono credenziali API comuni e nomi di campi di credenziali di pagamento
come numero di carta, CVC/CVV, token di pagamento condiviso e credenziale di pagamento
quando appaiono come campi JSON, parametri URL, flag CLI o assegnazioni.

`logging.redactSensitive: "off"` disabilita solo questa policy generale di log/trascrizione.
OpenClaw redige comunque i payload del perimetro di sicurezza che possono essere mostrati a client UI,
bundle di supporto, osservatori diagnostici, prompt di approvazione o strumenti agente.
Esempi includono eventi di chiamata strumento della UI di controllo, output `sessions_history`,
esportazioni di supporto diagnostico, osservazioni di errori dei provider, visualizzazione dei comandi di approvazione exec
e log del protocollo WebSocket del Gateway. `logging.redactPatterns` personalizzati
possono comunque aggiungere pattern specifici del progetto su quelle superfici.

## Diagnostica e OpenTelemetry

La diagnostica è composta da eventi strutturati e leggibili dalla macchina per esecuzioni di modelli e
telemetria del flusso dei messaggi (webhook, accodamento, stato della sessione). **Non**
sostituisce i log: alimenta metriche, tracce ed esportatori. Gli eventi sono emessi
in-process indipendentemente dal fatto che tu li esporti o meno.

Due superfici adiacenti:

- **Esportazione OpenTelemetry** — invia metriche, tracce e log tramite OTLP/HTTP a
  qualsiasi collector o backend compatibile con OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, ecc.). La configurazione completa, il catalogo dei segnali,
  i nomi di metriche/span, le variabili di ambiente e il modello di privacy sono su una pagina dedicata:
  [Esportazione OpenTelemetry](/it/gateway/opentelemetry).
- **Flag di diagnostica** — flag di log di debug mirati che instradano log extra a
  `logging.file` senza aumentare `logging.level`. I flag non distinguono tra maiuscole e minuscole
  e supportano caratteri jolly (`telegram.*`, `*`). Configura in `diagnostics.flags`
  o tramite l'override env `OPENCLAW_DIAGNOSTICS=...`. Guida completa:
  [Flag di diagnostica](/it/diagnostics/flags).

Per abilitare gli eventi diagnostici per Plugin o sink personalizzati senza esportazione OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Per l’esportazione OTLP verso un collector, vedi [esportazione OpenTelemetry](/it/gateway/opentelemetry).

## Suggerimenti per la risoluzione dei problemi

- **Gateway non raggiungibile?** Esegui prima `openclaw doctor`.
- **Log vuoti?** Controlla che il Gateway sia in esecuzione e stia scrivendo nel percorso file
  in `logging.file`.
- **Serve più dettaglio?** Imposta `logging.level` su `debug` o `trace` e riprova.

## Correlati

- [Esportazione OpenTelemetry](/it/gateway/opentelemetry) — esportazione OTLP/HTTP, catalogo di metriche/span, modello di privacy
- [Flag di diagnostica](/it/diagnostics/flags) — flag mirati per log di debug
- [Interni di logging del Gateway](/it/gateway/logging) — stili di log WS, prefissi dei sottosistemi e acquisizione della console
- [Riferimento della configurazione](/it/gateway/configuration-reference#diagnostics) — riferimento completo dei campi `diagnostics.*`
