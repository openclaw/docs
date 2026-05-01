---
read_when:
    - Hai bisogno di una panoramica introduttiva del logging di OpenClaw
    - Vuoi configurare i livelli, i formati o l'oscuramento dei log
    - Stai risolvendo un problema e devi trovare rapidamente i log
summary: File di log, output della console, accodamento dalla CLI e scheda Log dell'interfaccia di controllo
title: Registrazione dei log
x-i18n:
    generated_at: "2026-05-01T08:31:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: d41ce5b1ae30fe1ca65577abe387fc266bd281686acb10098f82b8e78dfaa357
    source_path: logging.md
    workflow: 16
---

OpenClaw ha due superfici principali per i log:

- **Log su file** (righe JSON) scritti dal Gateway.
- **Output della console** mostrato nei terminali e nell’interfaccia di debug del Gateway.

La scheda **Log** della Control UI segue in tempo reale il log su file del gateway. Questa pagina spiega dove
si trovano i log, come leggerli e come configurare livelli e formati dei log.

## Dove si trovano i log

Per impostazione predefinita, il Gateway scrive un file di log a rotazione in:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La data usa il fuso orario locale dell’host del gateway.

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

### CLI: coda live (consigliata)

Usa la CLI per seguire il file di log del gateway tramite RPC:

```bash
openclaw logs --follow
```

Opzioni attuali utili:

- `--local-time`: visualizza i timestamp nel tuo fuso orario locale
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flag RPC standard del Gateway
- `--expect-final`: flag di attesa della risposta finale RPC con agent (accettato qui tramite il livello client condiviso)

Modalità di output:

- **Sessioni TTY**: righe di log strutturate, eleganti e colorate.
- **Sessioni non TTY**: testo semplice.
- `--json`: JSON delimitato da righe (un evento di log per riga).
- `--plain`: forza il testo semplice nelle sessioni TTY.
- `--no-color`: disabilita i colori ANSI.

Quando passi un `--url` esplicito, la CLI non applica automaticamente la configurazione o
le credenziali d’ambiente; includi tu stesso `--token` se il Gateway di destinazione
richiede autenticazione.

In modalità JSON, la CLI emette oggetti con tag `type`:

- `meta`: metadati dello stream (file, cursore, dimensione)
- `log`: voce di log analizzata
- `notice`: suggerimenti su troncamento / rotazione
- `raw`: riga di log non analizzata

Se il Gateway local loopback implicito richiede l’associazione, si chiude durante la connessione,
o va in timeout prima che `logs.tail` risponda, `openclaw logs` ripiega automaticamente sul
log su file del Gateway configurato. Le destinazioni `--url` esplicite non usano
questo fallback.

Se il Gateway non è raggiungibile, la CLI stampa un breve suggerimento per eseguire:

```bash
openclaw doctor
```

### Control UI (web)

La scheda **Log** della Control UI segue lo stesso file usando `logs.tail`.
Vedi [/web/control-ui](/it/web/control-ui) per sapere come aprirla.

### Log solo canale

Per filtrare l’attività del canale (WhatsApp/Telegram/ecc.), usa:

```bash
openclaw channels logs --channel whatsapp
```

## Formati dei log

### Log su file (JSONL)

Ogni riga nel file di log è un oggetto JSON. La CLI e la Control UI analizzano queste
voci per mostrare output strutturato (ora, livello, sottosistema, messaggio).

I record JSONL dei log su file includono anche campi di primo livello filtrabili dalla macchina quando
disponibili:

- `hostname`: nome dell’host del gateway.
- `message`: testo del messaggio di log appiattito per la ricerca full-text.
- `agent_id`: id dell’agent attivo quando la chiamata di log include il contesto dell’agent.
- `session_id`: id/chiave della sessione attiva quando la chiamata di log include il contesto della sessione.
- `channel`: canale attivo quando la chiamata di log include il contesto del canale.

OpenClaw conserva gli argomenti originali del log strutturato accanto a questi campi
così i parser esistenti che leggono le chiavi argomento numerate di tslog continuano a funzionare.

### Output della console

I log della console sono **consapevoli del TTY** e formattati per la leggibilità:

- Prefissi dei sottosistemi (ad es. `gateway/channels/whatsapp`)
- Colorazione dei livelli (info/warn/error)
- Modalità compatta o JSON opzionale

La formattazione della console è controllata da `logging.consoleStyle`.

### Log WebSocket del Gateway

`openclaw gateway` ha anche logging del protocollo WebSocket per il traffico RPC:

- modalità normale: solo risultati interessanti (errori, errori di analisi, chiamate lente)
- `--verbose`: tutto il traffico richiesta/risposta
- `--ws-log auto|compact|full`: seleziona lo stile di rendering dettagliato
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

Puoi sovrascriverli entrambi tramite la variabile d’ambiente **`OPENCLAW_LOG_LEVEL`** (ad es. `OPENCLAW_LOG_LEVEL=debug`). La variabile d’ambiente ha precedenza sul file di configurazione, così puoi aumentare la verbosità per una singola esecuzione senza modificare `openclaw.json`. Puoi anche passare l’opzione globale della CLI **`--log-level <level>`** (per esempio, `openclaw --log-level debug gateway run`), che sovrascrive la variabile d’ambiente per quel comando.

`--verbose` influisce solo sull’output della console e sulla verbosità dei log WS; non modifica
i livelli dei log su file.

### Correlazione delle tracce

I log su file sono JSONL. Quando una chiamata di log include un contesto di traccia diagnostica valido,
OpenClaw scrive i campi di traccia come chiavi JSON di primo livello (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`) così i processori di log esterni possono correlare la riga
con gli span OTEL e la propagazione `traceparent` del provider.

Le richieste HTTP del Gateway e i frame WebSocket del Gateway stabiliscono un ambito interno di traccia
della richiesta. I log e gli eventi diagnostici emessi dentro quell’ambito async ereditano
la traccia della richiesta quando non passano un contesto di traccia esplicito. Le tracce di esecuzione dell’agent e
delle chiamate al modello diventano figlie della traccia di richiesta attiva, così log locali,
snapshot diagnostici, span OTEL e intestazioni `traceparent` attendibili del provider possono
essere uniti tramite `traceId` senza registrare il contenuto grezzo della richiesta o del modello.

### Dimensione e tempi delle chiamate al modello

La diagnostica delle chiamate al modello registra misurazioni limitate di richiesta/risposta senza
acquisire il contenuto grezzo del prompt o della risposta:

- `requestPayloadBytes`: dimensione in byte UTF-8 del payload finale della richiesta al modello
- `responseStreamBytes`: dimensione in byte UTF-8 degli eventi di risposta del modello in streaming
- `timeToFirstByteMs`: tempo trascorso prima del primo evento di risposta in streaming
- `durationMs`: durata totale della chiamata al modello

Questi campi sono disponibili per snapshot diagnostici, hook del Plugin per chiamate al modello e
span/metriche OTEL delle chiamate al modello quando l’esportazione diagnostica è abilitata.

### Stili della console

`logging.consoleStyle`:

- `pretty`: leggibile per le persone, colorato, con timestamp.
- `compact`: output più compatto (ideale per sessioni lunghe).
- `json`: JSON per riga (per processori di log).

### Redazione

OpenClaw può redigere token sensibili prima che raggiungano l’output della console, i log su file,
i record di log OTLP, il testo persistito della trascrizione della sessione o i payload degli eventi
degli strumenti della Control UI (argomenti di avvio dello strumento, payload di risultato parziale/finale, output
exec derivato e riepiloghi delle patch):

- `logging.redactSensitive`: `off` | `tools` (predefinito: `tools`)
- `logging.redactPatterns`: elenco di stringhe regex per sovrascrivere il set predefinito. I pattern personalizzati si applicano sopra i valori predefiniti integrati per i payload degli strumenti della Control UI, quindi aggiungere un pattern non indebolisce mai la redazione dei valori già intercettati dai predefiniti.

I log su file e le trascrizioni delle sessioni restano JSONL, ma i valori segreti corrispondenti vengono
mascherati prima che la riga o il messaggio siano scritti su disco. La redazione è best-effort:
si applica al contenuto dei messaggi che contiene testo e alle stringhe di log, non a ogni
identificatore o campo di payload binario.

I valori predefiniti integrati coprono credenziali API comuni e nomi di campi per credenziali di pagamento
come numero della carta, CVC/CVV, token di pagamento condiviso e credenziale di pagamento
quando compaiono come campi JSON, parametri URL, flag CLI o assegnazioni.

`logging.redactSensitive: "off"` disabilita solo questa policy generale di log/trascrizione.
OpenClaw redige comunque i payload dei confini di sicurezza che possono essere mostrati a client UI,
bundle di supporto, osservatori diagnostici, prompt di approvazione o strumenti dell’agent.
Esempi includono eventi di chiamata strumento della Control UI, output `sessions_history`,
esportazioni di supporto diagnostico, osservazioni di errore del provider, visualizzazione del comando
di approvazione exec e log del protocollo WebSocket del Gateway. I `logging.redactPatterns`
personalizzati possono comunque aggiungere pattern specifici del progetto su queste superfici.

## Diagnostica e OpenTelemetry

La diagnostica è composta da eventi strutturati e leggibili dalla macchina per esecuzioni del modello e
telemetria del flusso dei messaggi (webhook, accodamento, stato della sessione). **Non**
sostituiscono i log: alimentano metriche, tracce ed esportatori. Gli eventi vengono emessi
in-process indipendentemente dal fatto che tu li esporti o meno.

Due superfici adiacenti:

- **Esportazione OpenTelemetry** — invia metriche, tracce e log tramite OTLP/HTTP a
  qualsiasi collector o backend compatibile con OpenTelemetry (Grafana, Datadog,
  Honeycomb, New Relic, Tempo, ecc.). Configurazione completa, catalogo dei segnali,
  nomi di metriche/span, variabili d’ambiente e modello di privacy sono in una pagina dedicata:
  [Esportazione OpenTelemetry](/it/gateway/opentelemetry).
- **Flag diagnostici** — flag mirati per log di debug che indirizzano log extra a
  `logging.file` senza aumentare `logging.level`. I flag non distinguono maiuscole/minuscole
  e supportano wildcard (`telegram.*`, `*`). Configura sotto `diagnostics.flags`
  o tramite l’override d’ambiente `OPENCLAW_DIAGNOSTICS=...`. Guida completa:
  [Flag diagnostici](/it/diagnostics/flags).

Per abilitare eventi diagnostici per Plugin o sink personalizzati senza esportazione OTLP:

```json5
{
  diagnostics: { enabled: true },
}
```

Per l’esportazione OTLP a un collector, vedi [Esportazione OpenTelemetry](/it/gateway/opentelemetry).

## Suggerimenti per la risoluzione dei problemi

- **Gateway non raggiungibile?** Esegui prima `openclaw doctor`.
- **Log vuoti?** Controlla che il Gateway sia in esecuzione e stia scrivendo nel percorso file
  in `logging.file`.
- **Serve più dettaglio?** Imposta `logging.level` su `debug` o `trace` e riprova.

## Correlati

- [Esportazione OpenTelemetry](/it/gateway/opentelemetry) — esportazione OTLP/HTTP, catalogo metriche/span, modello di privacy
- [Flag diagnostici](/it/diagnostics/flags) — flag mirati per log di debug
- [Interni del logging del Gateway](/it/gateway/logging) — stili dei log WS, prefissi dei sottosistemi e acquisizione della console
- [Riferimento della configurazione](/it/gateway/configuration-reference#diagnostics) — riferimento completo dei campi `diagnostics.*`
