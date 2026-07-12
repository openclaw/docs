---
read_when:
    - Hai bisogno di una panoramica dei log di OpenClaw adatta ai principianti
    - Vuoi configurare i livelli, i formati o l'oscuramento dei log
    - Stai risolvendo un problema e devi trovare rapidamente i log
summary: Log su file, output della console, visualizzazione in tempo reale tramite CLI e scheda Log dell'interfaccia di controllo
title: Registrazione eventi
x-i18n:
    generated_at: "2026-07-12T07:12:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: add41e125c22ca1b2343a3a1fb1e88e94ef9c81a07c48b9eb67f4d4b2510dd08
    source_path: logging.md
    workflow: 16
---

OpenClaw dispone di due superfici principali per i log:

- **Log su file** (righe JSON) scritti dal Gateway.
- **Output della console** nel terminale in cui è in esecuzione il Gateway.

La scheda **Log** dell'interfaccia di controllo segue in tempo reale il file di log del Gateway. Questa pagina spiega dove
si trovano i log, come leggerli e come configurarne i livelli e i formati.

## Dove si trovano i log

Per impostazione predefinita, il Gateway scrive un file di log giornaliero con rotazione:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La data usa il fuso orario locale dell'host del Gateway. Quando `/tmp/openclaw` non è sicura
o non è disponibile (e sempre in Windows), OpenClaw usa invece una directory
`openclaw-<uid>` specifica dell'utente nella directory temporanea del sistema operativo. I file di log
con data vengono eliminati dopo 24 ore.

Ogni file viene ruotato quando la scrittura successiva supererebbe `logging.maxFileBytes`
(valore predefinito: 100 MB). OpenClaw conserva fino a cinque archivi numerati accanto al
file attivo, ad esempio `openclaw-YYYY-MM-DD.1.log`, e continua a scrivere in un nuovo
log attivo anziché sopprimere le informazioni diagnostiche.

Puoi sovrascrivere il percorso in `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Come leggere i log

### CLI: visualizzazione in tempo reale (consigliata)

Segui in tempo reale il file di log del Gateway tramite RPC:

```bash
openclaw logs --follow
```

Opzioni:

| Flag                | Valore predefinito | Comportamento                                                                                                           |
| ------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `--follow`          | disattivato        | Continua a seguire il log; in caso di disconnessione si riconnette con attese progressive                              |
| `--limit <n>`       | `200`              | Numero massimo di righe per recupero                                                                                    |
| `--max-bytes <n>`   | `250000`           | Numero massimo di byte da leggere per recupero                                                                          |
| `--interval <ms>`   | `1000`             | Intervallo di polling durante la visualizzazione in tempo reale                                                         |
| `--json`            | disattivato        | JSON delimitato da righe (un evento per riga)                                                                           |
| `--plain`           | disattivato        | Forza il testo normale nelle sessioni TTY                                                                                |
| `--no-color`        | —                  | Disabilita i colori ANSI                                                                                                 |
| `--utc`             | disattivato        | Mostra le marche temporali in UTC (per impostazione predefinita viene usata l'ora locale)                               |
| `--local-time`      | disattivato        | Variante accettata per compatibilità dell'impostazione predefinita dell'ora locale; non produce altri effetti           |
| `--url` / `--token` | —                  | Flag RPC standard del Gateway                                                                                           |
| `--timeout <ms>`    | `30000`            | Timeout RPC del Gateway                                                                                                  |
| `--expect-final`    | disattivato        | Flag di attesa della risposta finale RPC supportata da un agente (accettato qui tramite il livello client condiviso)    |

Modalità di output:

- **Sessioni TTY**: righe di log strutturate, curate e colorate.
- **Sessioni non TTY**: testo normale.

Quando passi un `--url` esplicito, la CLI non applica automaticamente le credenziali
della configurazione o dell'ambiente; specifica direttamente `--token`, altrimenti la chiamata non riesce con
`gateway url override requires explicit credentials`.

In modalità JSON, la CLI emette oggetti contrassegnati tramite `type`:

- `meta`: metadati del flusso (file, origine, tipo di origine, servizio, cursore, dimensione)
- `log`: voce di log analizzata
- `notice`: indicazioni su troncamento o rotazione
- `raw`: riga di log non analizzata
- `error`: errori di connessione al Gateway (scritti su stderr)

Se il Gateway local loopback implicito richiede l'associazione, chiude la connessione durante il collegamento
o scade prima che `logs.tail` risponda, `openclaw logs` ripiega automaticamente sul
file di log del Gateway configurato. Le destinazioni `--url` esplicite non usano
questo ripiego. `openclaw logs --follow` è più rigoroso: su Linux usa il journal del Gateway
systemd dell'utente attivo in base al PID, quando disponibile, altrimenti riprova a connettersi al
Gateway attivo con attese progressive, anziché seguire un file affiancato potenzialmente obsoleto.

Se il Gateway non è raggiungibile, la CLI mostra un breve suggerimento per eseguire:

```bash
openclaw doctor
```

### Interfaccia di controllo (web)

La scheda **Log** dell'interfaccia di controllo segue in tempo reale lo stesso file tramite `logs.tail`.
Consulta [Interfaccia di controllo](/it/web/control-ui) per sapere come aprirla.

### Log relativi a un solo canale

Per filtrare l'attività dei canali (WhatsApp/Telegram/ecc.), usa:

```bash
openclaw channels logs --channel whatsapp
```

Il valore predefinito di `--channel` è `all`; sono disponibili anche `--lines <n>` (valore predefinito: 200) e `--json`.

## Formati dei log

### Log su file (JSONL)

Ogni riga del file di log è un oggetto JSON. La CLI e l'interfaccia di controllo analizzano queste
voci per mostrare un output strutturato (ora, livello, sottosistema, messaggio).

Quando disponibili, i record JSONL dei log su file includono anche campi di primo livello
filtrabili automaticamente:

- `hostname`: nome dell'host del Gateway.
- `message`: testo appiattito del messaggio di log per la ricerca full-text.
- `agent_id`: ID dell'agente attivo quando la chiamata di log include il contesto dell'agente.
- `session_id`: ID/chiave della sessione attiva quando la chiamata di log include il contesto della sessione.
- `channel`: canale attivo quando la chiamata di log include il contesto del canale.

OpenClaw conserva gli argomenti strutturati originali del log insieme a questi campi,
in modo che i parser esistenti che leggono le chiavi numerate degli argomenti tslog continuino a funzionare.

Le attività di conversazione, voce in tempo reale e stanze gestite generano record di log
del ciclo di vita con dimensioni limitate attraverso la stessa pipeline dei log su file. Questi record includono il tipo di evento,
la modalità, il trasporto, il provider e, quando disponibili, le misurazioni di dimensioni e tempi, ma omettono
il testo della trascrizione, i payload audio, gli ID dei turni, gli ID delle chiamate e gli ID degli elementi del provider.

### Output della console

I log della console sono **compatibili con il contesto TTY** e formattati per facilitarne la lettura:

- Prefissi dei sottosistemi (ad es. `gateway/channels/whatsapp`)
- Colorazione dei livelli (informazioni/avvisi/errori)
- Modalità compatta o JSON facoltativa

La formattazione della console è controllata da `logging.consoleStyle`.

### Log WebSocket del Gateway

`openclaw gateway` dispone inoltre della registrazione del protocollo WebSocket per il traffico RPC:

- modalità normale: solo risultati rilevanti (errori, errori di analisi, chiamate lente)
- `--verbose`: tutto il traffico di richieste e risposte
- `--ws-log auto|compact|full`: seleziona lo stile di visualizzazione dettagliata
- `--compact`: alias di `--ws-log compact`

Esempi:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Configurazione dei log

Tutta la configurazione dei log si trova sotto `logging` in `~/.openclaw/openclaw.json`.

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

Livelli: `silent`, `fatal`, `error`, `warn`, `info`, `debug`, `trace`.

- `logging.level`: livello dei **log su file** (JSONL) (valore predefinito: `info`).
- `logging.consoleLevel`: livello di dettaglio della **console**.

Puoi sovrascriverli entrambi tramite la variabile di ambiente **`OPENCLAW_LOG_LEVEL`** (ad es. `OPENCLAW_LOG_LEVEL=debug`). La variabile di ambiente ha la precedenza sul file di configurazione, quindi puoi aumentare il livello di dettaglio per una singola esecuzione senza modificare `openclaw.json`. Puoi anche passare l'opzione CLI globale **`--log-level <level>`** (ad esempio, `openclaw --log-level debug gateway run`), che per quel comando sovrascrive la variabile di ambiente.

`--verbose` influisce solo sull'output della console e sul livello di dettaglio dei log WS; non modifica
i livelli dei log su file.

### Diagnostica mirata del trasporto del modello

Durante il debug delle chiamate al provider, usa flag di ambiente mirati anziché aumentare
tutti i log al livello `debug`:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

Flag disponibili:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: registra l'avvio della richiesta, la risposta del recupero, le intestazioni
  dell'SDK, il primo evento di streaming, il completamento del flusso e gli errori di trasporto al
  livello `info`.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: include nei log delle richieste al modello un riepilogo
  di dimensioni limitate del payload della richiesta.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: include nel riepilogo del payload tutti i nomi degli strumenti
  esposti al modello.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: include un'istantanea JSON oscurata e di dimensioni
  limitate del payload. Usala solo durante il debug; i segreti vengono oscurati, ma i prompt
  e il testo dei messaggi potrebbero essere ancora presenti.
- `OPENCLAW_DEBUG_SSE=events`: registra i tempi del primo evento e del completamento del flusso.
- `OPENCLAW_DEBUG_SSE=peek`: registra anche i primi cinque payload oscurati degli eventi SSE,
  con dimensioni limitate per evento.
- `OPENCLAW_DEBUG_CODE_MODE=1`: registra le informazioni diagnostiche della superficie del modello in modalità codice,
  anche quando gli strumenti nativi del provider vengono nascosti perché la modalità codice gestisce la
  superficie degli strumenti.

Questi flag registrano gli eventi tramite il normale sistema di log di OpenClaw, quindi `openclaw logs --follow`
e la scheda Log dell'interfaccia di controllo li mostrano. Senza i flag, le stesse informazioni diagnostiche
rimangono disponibili al livello `debug`.

I metadati di avvio e risposta di `[model-fetch]` (provider, API, modello, stato,
latenza e campi della richiesta come metodo, URL, timeout, proxy e criterio)
vengono sempre registrati al livello `info`, indipendentemente da
`OPENCLAW_DEBUG_MODEL_TRANSPORT`, affinché le informazioni essenziali sul trasporto del modello siano visibili
senza flag di debug.

### Correlazione delle tracce

I log su file sono in formato JSONL. Quando una chiamata di log include un contesto valido di traccia diagnostica,
OpenClaw scrive i campi di traccia come chiavi JSON di primo livello (`traceId`, `spanId`,
`parentSpanId`, `traceFlags`), affinché i processori esterni dei log possano correlare la riga
con gli span OTEL e la propagazione di `traceparent` del provider.

Le richieste HTTP e i frame WebSocket del Gateway stabiliscono un ambito interno di traccia della richiesta.
I log e gli eventi diagnostici generati in tale ambito asincrono ereditano
la traccia della richiesta quando non passano un contesto di traccia esplicito. Le tracce delle esecuzioni degli agenti e
delle chiamate al modello diventano figlie della traccia della richiesta attiva, quindi i log locali,
le istantanee diagnostiche, gli span OTEL e le intestazioni `traceparent` attendibili del provider possono
essere collegati tramite `traceId` senza registrare il contenuto non elaborato delle richieste o del modello.

Anche i record di log del ciclo di vita delle conversazioni vengono inviati all'esportazione dei log diagnostics-otel quando
l'esportazione dei log OpenTelemetry è abilitata, usando gli stessi attributi limitati dei log su
file. Configura `diagnostics.otel.logsExporter` per scegliere OTLP, JSONL su stdout o
entrambe le destinazioni.

### Dimensioni e tempi delle chiamate al modello

La diagnostica delle chiamate al modello registra misurazioni limitate di richieste e risposte senza
acquisire il contenuto non elaborato del prompt o della risposta:

- `requestPayloadBytes`: dimensione in byte UTF-8 del payload finale della richiesta al modello
- `responseStreamBytes`: dimensione in byte UTF-8 dei payload dei frammenti della risposta del modello
  trasmessa in streaming. Gli eventi ad alta frequenza relativi a testo, ragionamento e variazioni delle chiamate agli strumenti conteggiano
  solo i byte incrementali di `delta` anziché le istantanee `partial` complete.
- `timeToFirstByteMs`: tempo trascorso prima del primo evento di risposta in streaming
- `durationMs`: durata totale della chiamata al modello

Questi campi sono disponibili per le istantanee diagnostiche, gli hook dei Plugin per le chiamate al modello e
gli span/le metriche OTEL delle chiamate al modello quando l'esportazione della diagnostica è abilitata.

### Stili della console

`logging.consoleStyle`:

- `pretty`: facile da leggere, colorato e con marche temporali.
- `compact`: output più conciso (ideale per sessioni lunghe).
- `json`: un oggetto JSON per riga (per i processori di log).

### Oscuramento

OpenClaw può oscurare i token sensibili prima che raggiungano l'output della console, i log su file,
i record di log OTLP, il testo persistente delle trascrizioni delle sessioni o i payload degli eventi degli strumenti
dell'interfaccia di controllo (argomenti di avvio degli strumenti, payload dei risultati parziali/finali, output
derivato dell'esecuzione e riepiloghi delle patch):

- `logging.redactSensitive`: `off` | `tools` (valore predefinito: `tools`)
- `logging.redactPatterns`: elenco di stringhe di espressioni regolari che sostituisce l'insieme predefinito per l'output dei log/delle trascrizioni. Per i payload degli strumenti dell'interfaccia di controllo, i modelli personalizzati si applicano in aggiunta a quelli predefiniti integrati, quindi l'aggiunta di un modello non riduce mai l'oscuramento dei valori già rilevati dai modelli predefiniti.

I log su file e le trascrizioni delle sessioni rimangono in formato JSONL, ma i valori segreti corrispondenti vengono
mascherati prima che la riga o il messaggio vengano scritti su disco. L'oscuramento avviene secondo il principio del massimo impegno:
si applica al contenuto testuale dei messaggi e alle stringhe di log, non a ogni
identificatore o campo di payload binario.

Le impostazioni predefinite integrate coprono le comuni credenziali API e i nomi
dei campi delle credenziali di pagamento, come numero della carta, CVC/CVV, token
di pagamento condiviso e credenziale di pagamento, quando compaiono come campi
JSON, parametri URL, flag della CLI o assegnazioni.

`logging.redactSensitive: "off"` disabilita solo questa policy generale per
log/trascrizioni. OpenClaw continua a oscurare i payload dei confini di sicurezza
che possono essere mostrati ai client dell'interfaccia utente, nei pacchetti di
supporto, agli osservatori diagnostici, nelle richieste di approvazione o agli
strumenti degli agenti. Alcuni esempi sono gli eventi di chiamata agli strumenti
della Control UI, l'output di `sessions_history`, le esportazioni diagnostiche per
il supporto, le osservazioni degli errori dei provider, la visualizzazione dei
comandi per l'approvazione dell'esecuzione e i log del protocollo WebSocket del
Gateway. I valori personalizzati di `logging.redactPatterns` possono comunque
aggiungere schemi specifici del progetto a queste superfici.

## Diagnostica e OpenTelemetry

La diagnostica è costituita da eventi strutturati e leggibili dalle macchine per
le esecuzioni dei modelli e la telemetria del flusso dei messaggi (webhook,
accodamento, stato della sessione). **Non** sostituisce i log: alimenta metriche,
tracce ed esportatori. Per impostazione predefinita, gli eventi vengono emessi
all'interno del processo (impostare `diagnostics.enabled: false` per
disattivarli); la loro esportazione è separata.

Due superfici adiacenti:

- **Esportazione OpenTelemetry** — invia metriche, tracce e log tramite OTLP/HTTP
  a qualsiasi raccoglitore o backend compatibile con OpenTelemetry (Datadog,
  Grafana, Honeycomb, New Relic, Tempo e così via). La configurazione completa,
  il catalogo dei segnali, i nomi di metriche/intervalli, le variabili di
  ambiente e il modello di privacy sono disponibili in una pagina dedicata:
  [Esportazione OpenTelemetry](/it/gateway/opentelemetry).
- **Flag di diagnostica** — flag mirati per i log di debug che indirizzano log
  aggiuntivi a `logging.file` senza aumentare `logging.level`. I flag non
  distinguono tra maiuscole e minuscole e supportano i caratteri jolly
  (`telegram.*`, `*`). Configurali in `diagnostics.flags` oppure tramite la
  sostituzione della variabile di ambiente `OPENCLAW_DIAGNOSTICS=...`. Guida
  completa: [Flag di diagnostica](/it/diagnostics/flags).

Per l'esportazione OTLP verso un raccoglitore, consulta
[Esportazione OpenTelemetry](/it/gateway/opentelemetry).

## Suggerimenti per la risoluzione dei problemi

- **Gateway non raggiungibile?** Esegui prima `openclaw doctor`.
- **Log vuoti?** Verifica che il Gateway sia in esecuzione e scriva nel percorso
  del file specificato in `logging.file`.
- **Servono maggiori dettagli?** Imposta `logging.level` su `debug` o `trace` e
  riprova.

## Contenuti correlati

- [Esportazione OpenTelemetry](/it/gateway/opentelemetry) — esportazione OTLP/HTTP, catalogo di metriche/intervalli, modello di privacy
- [Flag di diagnostica](/it/diagnostics/flags) — flag mirati per i log di debug
- [Meccanismi interni di registrazione del Gateway](/it/gateway/logging) — stili dei log WS, prefissi dei sottosistemi e acquisizione della console
- [Riferimento della configurazione](/it/gateway/configuration-reference#diagnostics) — riferimento completo dei campi `diagnostics.*`
