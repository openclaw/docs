---
read_when:
    - Ti serve una panoramica adatta ai principianti sulla registrazione degli eventi in OpenClaw
    - Vuoi configurare livelli, formati o oscuramento dei log
    - Stai risolvendo un problema e devi trovare rapidamente i log
summary: Log su file, output della console, tailing della CLI e scheda Log dell'interfaccia di controllo
title: Registrazione
x-i18n:
    generated_at: "2026-05-06T17:58:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 218f68c5111b6de01dc14707dad132d15d5e78c8e906af8a5416e618807663ac
    source_path: logging.md
    workflow: 16
---

OpenClaw ha due principali superfici di log:

- **Log su file** (righe JSON) scritti dal Gateway.
- **Output della console** mostrato nei terminali e nella Gateway Debug UI.

La scheda **Logs** della Control UI segue in tempo reale il log su file del gateway. Questa pagina spiega dove
si trovano i log, come leggerli e come configurare livelli e formati dei log.

## Dove si trovano i log

Per impostazione predefinita, il Gateway scrive un file di log a rotazione in:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La data usa il fuso orario locale dell'host del gateway.

Ogni file ruota quando raggiunge `logging.maxFileBytes` (predefinito: 100 MB).
OpenClaw conserva fino a cinque archivi numerati accanto al file attivo, ad esempio
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
- `--expect-final`: flag di attesa della risposta finale RPC supportata da agenti (accettato qui tramite il livello client condiviso)

Modalità di output:

- **Sessioni TTY**: righe di log strutturate, colorate e leggibili.
- **Sessioni non TTY**: testo semplice.
- `--json`: JSON delimitato da righe (un evento di log per riga).
- `--plain`: forza testo semplice nelle sessioni TTY.
- `--no-color`: disabilita i colori ANSI.

Quando passi un `--url` esplicito, la CLI non applica automaticamente la configurazione o
le credenziali d'ambiente; includi tu stesso `--token` se il Gateway di destinazione
richiede autenticazione.

In modalità JSON, la CLI emette oggetti con tag `type`:

- `meta`: metadati dello stream (file, cursore, dimensione)
- `log`: voce di log analizzata
- `notice`: suggerimenti di troncamento / rotazione
- `raw`: riga di log non analizzata

Se il Gateway local loopback implicito richiede l'abbinamento, si chiude durante la connessione
o scade prima che `logs.tail` risponda, `openclaw logs` ripiega automaticamente sul
log su file del Gateway configurato. Le destinazioni `--url` esplicite non usano
questo fallback.

Se il Gateway non è raggiungibile, la CLI stampa un breve suggerimento per eseguire:

```bash
openclaw doctor
```

### Control UI (web)

La scheda **Logs** della Control UI segue in tempo reale lo stesso file usando `logs.tail`.
Consulta [Control UI](/it/web/control-ui) per sapere come aprirla.

### Log solo del canale

Per filtrare l'attività dei canali (WhatsApp/Telegram/ecc.), usa:

```bash
openclaw channels logs --channel whatsapp
```

## Formati dei log

### Log su file (JSONL)

Ogni riga nel file di log è un oggetto JSON. La CLI e la Control UI analizzano queste
voci per visualizzare un output strutturato (ora, livello, sottosistema, messaggio).

I record JSONL dei log su file includono anche campi di primo livello filtrabili da macchina quando
disponibili:

- `hostname`: nome host del gateway.
- `message`: testo del messaggio di log appiattito per la ricerca full-text.
- `agent_id`: id dell'agente attivo quando la chiamata di log porta contesto dell'agente.
- `session_id`: id/chiave della sessione attiva quando la chiamata di log porta contesto della sessione.
- `channel`: canale attivo quando la chiamata di log porta contesto del canale.

OpenClaw conserva gli argomenti originali del log strutturato accanto a questi campi,
così i parser esistenti che leggono le chiavi numerate degli argomenti tslog continuano a funzionare.

Le attività di conversazione, voce in tempo reale e stanze gestite emettono record di log
del ciclo di vita limitati tramite questa stessa pipeline di log su file. Questi record includono tipo di evento,
modalità, trasporto, provider e misurazioni di dimensioni/tempi quando disponibili, ma omettono
testo della trascrizione, payload audio, id dei turni, id delle chiamate e id degli elementi del provider.

### Output della console

I log della console sono **consapevoli del TTY** e formattati per la leggibilità:

- Prefissi dei sottosistemi (ad es. `gateway/channels/whatsapp`)
- Colorazione dei livelli (info/warn/error)
- Modalità compatta o JSON opzionale

La formattazione della console è controllata da `logging.consoleStyle`.

### Log WebSocket del Gateway

`openclaw gateway` ha anche log del protocollo WebSocket per il traffico RPC:

- modalità normale: solo risultati interessanti (errori, errori di parsing, chiamate lente)
- `--verbose`: tutto il traffico di richieste/risposte
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

Puoi sovrascriverli entrambi tramite la variabile d'ambiente **`OPENCLAW_LOG_LEVEL`** (ad es. `OPENCLAW_LOG_LEVEL=debug`). La variabile d'ambiente ha precedenza sul file di configurazione, quindi puoi aumentare la verbosità per una singola esecuzione senza modificare `openclaw.json`. Puoi anche passare l'opzione CLI globale **`--log-level <level>`** (ad esempio, `openclaw --log-level debug gateway run`), che sovrascrive la variabile d'ambiente per quel comando.

`--verbose` influisce solo sull'output della console e sulla verbosità dei log WS; non cambia
i livelli dei log su file.

### Correlazione delle tracce

I log su file sono JSONL. Quando una chiamata di log porta un contesto di traccia diagnostica valido,
OpenClaw scrive i campi della traccia come chiavi JSON di primo livello (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) così i processori di log esterni possono correlare la riga
con gli span OTEL e la propagazione `traceparent` del provider.

Le richieste HTTP del Gateway e i frame WebSocket del Gateway stabiliscono uno scope di traccia
di richiesta interno. I log e gli eventi diagnostici emessi dentro quello scope async ereditano
la traccia della richiesta quando non passano un contesto di traccia esplicito. Le tracce delle esecuzioni degli agenti e
delle chiamate ai modelli diventano figlie della traccia di richiesta attiva, così i log locali,
gli snapshot diagnostici, gli span OTEL e gli header `traceparent` attendibili dei provider possono
essere collegati tramite `traceId` senza registrare nei log il contenuto grezzo della richiesta o del modello.

I record di log del ciclo di vita delle conversazioni fluiscono anche verso i log OTLP quando l'esportazione dei log OpenTelemetry
è abilitata, usando gli stessi attributi limitati dei log su file.

### Dimensioni e tempi delle chiamate ai modelli

La diagnostica delle chiamate ai modelli registra misurazioni limitate di richiesta/risposta senza
acquisire il contenuto grezzo del prompt o della risposta:

- `requestPayloadBytes`: dimensione in byte UTF-8 del payload finale della richiesta al modello
- `responseStreamBytes`: dimensione in byte UTF-8 degli eventi di risposta del modello in streaming
- `timeToFirstByteMs`: tempo trascorso prima del primo evento di risposta in streaming
- `durationMs`: durata totale della chiamata al modello

Questi campi sono disponibili per gli snapshot diagnostici, gli hook dei Plugin per chiamate ai modelli e
gli span/metriche OTEL delle chiamate ai modelli quando l'esportazione diagnostica è abilitata.

### Stili della console

`logging.consoleStyle`:

- `pretty`: adatto alla lettura umana, colorato, con timestamp.
- `compact`: output più compatto (ideale per sessioni lunghe).
- `json`: JSON per riga (per processori di log).

### Redazione

OpenClaw può redigere token sensibili prima che raggiungano l'output della console, i log su file,
i record di log OTLP, il testo persistito delle trascrizioni di sessione o i payload degli eventi degli strumenti della Control UI
(argomenti di avvio dello strumento, payload dei risultati parziali/finali, output exec derivato e riepiloghi delle patch):

- `logging.redactSensitive`: `off` | `tools` (predefinito: `tools`)
- `logging.redactPatterns`: elenco di stringhe regex per sovrascrivere l'insieme predefinito. I pattern personalizzati si applicano in aggiunta ai valori predefiniti integrati per i payload degli strumenti della Control UI, quindi aggiungere un pattern non indebolisce mai la redazione dei valori già intercettati dai valori predefiniti.

I log su file e le trascrizioni di sessione restano JSONL, ma i valori segreti corrispondenti vengono
mascherati prima che la riga o il messaggio venga scritto su disco. La redazione è best-effort:
si applica al contenuto dei messaggi con testo e alle stringhe di log, non a ogni
identificatore o campo di payload binario.

I valori predefiniti integrati coprono credenziali API comuni e nomi di campi di credenziali di pagamento
come numero di carta, CVC/CVV, token di pagamento condiviso e credenziale di pagamento
quando appaiono come campi JSON, parametri URL, flag CLI o assegnazioni.

`logging.redactSensitive: "off"` disabilita solo questa policy generale di log/trascrizioni.
OpenClaw redige comunque i payload dei confini di sicurezza che possono essere mostrati a client UI,
bundle di supporto, osservatori diagnostici, prompt di approvazione o strumenti degli agenti.
Gli esempi includono eventi di chiamata strumenti della Control UI, output `sessions_history`,
esportazioni diagnostiche di supporto, osservazioni di errore dei provider, visualizzazione dei comandi di approvazione exec
e log del protocollo WebSocket del Gateway. I `logging.redactPatterns` personalizzati
possono comunque aggiungere pattern specifici del progetto su queste superfici.

## Diagnostica e OpenTelemetry

La diagnostica è composta da eventi strutturati, leggibili da macchina per esecuzioni dei modelli e
telemetria dei flussi di messaggi (webhook, code, stato della sessione). **Non**
sostituisce i log: alimenta metriche, tracce ed esportatori. Gli eventi vengono emessi
nel processo, indipendentemente dal fatto che vengano esportati o meno.

Due superfici adiacenti:

- **Esportazione OpenTelemetry** — invia metriche, tracce e log tramite OTLP/HTTP a
  qualsiasi collector o backend compatibile con OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, ecc.). Configurazione completa, catalogo dei segnali,
  nomi di metriche/span, variabili d'ambiente e modello di privacy si trovano in una pagina dedicata:
  [Esportazione OpenTelemetry](/it/gateway/opentelemetry).
- **Flag diagnostici** — flag mirati di log di debug che instradano log extra verso
  `logging.file` senza aumentare `logging.level`. I flag non distinguono maiuscole/minuscole
  e supportano wildcard (`telegram.*`, `*`). Configura sotto `diagnostics.flags`
  o tramite override env `OPENCLAW_DIAGNOSTICS=...`. Guida completa:
  [Flag diagnostici](/it/diagnostics/flags).

Per abilitare gli eventi diagnostici per plugin o sink personalizzati senza esportazione OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Per esportare OTLP verso un collector, consulta [Esportazione OpenTelemetry](/it/gateway/opentelemetry).

## Suggerimenti per la risoluzione dei problemi

- **Gateway non raggiungibile?** Esegui prima `openclaw doctor`.
- **Log vuoti?** Controlla che il Gateway sia in esecuzione e stia scrivendo nel percorso del file
  in `logging.file`.
- **Serve più dettaglio?** Imposta `logging.level` su `debug` o `trace` e riprova.

## Correlati

- [Esportazione OpenTelemetry](/it/gateway/opentelemetry) — esportazione OTLP/HTTP, catalogo metriche/span, modello di privacy
- [Flag diagnostici](/it/diagnostics/flags) — flag mirati di log di debug
- [Interni del logging del Gateway](/it/gateway/logging) — stili dei log WS, prefissi dei sottosistemi e cattura della console
- [Riferimento di configurazione](/it/gateway/configuration-reference#diagnostics) — riferimento completo dei campi `diagnostics.*`
