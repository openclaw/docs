---
read_when:
    - Modifica dell'output o dei formati di logging
    - Debug dell'output della CLI o del Gateway
summary: Superfici di logging, log su file, stili di log WS e formattazione della console
title: Logging del Gateway
x-i18n:
    generated_at: "2026-06-27T17:33:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde5e589bb48cd8c41ac6dd0d74780fec1cc1ee79d82d433b4e7c7450dc5c8b6
    source_path: gateway/logging.md
    workflow: 16
---

# Logging

Per una panoramica rivolta all'utente (CLI + Control UI + configurazione), vedi [/logging](/it/logging).

OpenClaw ha due "superfici" di log:

- **Output della console** (quello che vedi nel terminale / Debug UI).
- **Log su file** (righe JSON) scritti dal logger del Gateway.

All'avvio, il Gateway registra nei log il modello agente predefinito risolto insieme ai
valori predefiniti della modalità che influenzano le nuove sessioni, ad esempio:

```text
agent model: openai/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` deriva dall'agente predefinito, dai parametri del modello o dal valore predefinito globale dell'agente;
quando non è impostato, il riepilogo di avvio mostra `medium`. `fast` deriva
dall'agente predefinito o dai parametri `fastMode` del modello.

## Logger basato su file

- Il file di log rolling predefinito si trova sotto `/tmp/openclaw/` (un file al giorno): `openclaw-YYYY-MM-DD.log`
  - La data usa il fuso orario locale dell'host del Gateway.
- I file di log attivi ruotano a `logging.maxFileBytes` (predefinito: 100 MB), mantenendo
  fino a cinque archivi numerati e continuando a scrivere un nuovo file attivo.
- Il percorso e il livello del file di log possono essere configurati tramite `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Il formato del file è un oggetto JSON per riga.

I percorsi di codice per talk, voce in tempo reale e stanze gestite usano il logger file condiviso per
record di ciclo di vita limitati. Questi record sono pensati per il debug operativo
e l'esportazione dei log OTLP; testo della trascrizione, payload audio, ID turno, ID chiamata e
ID degli elementi del provider non vengono copiati nel record di log.

La scheda Logs della Control UI segue questo file tramite il Gateway (`logs.tail`).
La CLI può fare lo stesso:

```bash
openclaw logs --follow
```

**Verbose vs. livelli di log**

- I **log su file** sono controllati esclusivamente da `logging.level`.
- `--verbose` influisce solo sulla **verbosità della console** (e sullo stile dei log WS); **non**
  aumenta il livello dei log su file.
- Per acquisire nei log su file dettagli visibili solo in modalità verbose, imposta `logging.level` su `debug` o
  `trace`.
- Il logging trace include anche riepiloghi diagnostici dei tempi per hot path selezionati,
  come la preparazione della factory degli strumenti del Plugin. Vedi
  [/tools/plugin#slow-plugin-tool-setup](/it/tools/plugin#slow-plugin-tool-setup).

## Acquisizione della console

La CLI acquisisce `console.log/info/warn/error/debug/trace` e li scrive nei log su file,
continuando comunque a stampare su stdout/stderr.

Puoi regolare la verbosità della console in modo indipendente tramite:

- `logging.consoleLevel` (predefinito `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redazione

OpenClaw può mascherare token sensibili prima che l'output di log o trascrizione lasci il
processo. Questa policy di redazione dei log viene applicata a console, log su file, record di log OTLP
e sink di testo delle trascrizioni di sessione, quindi i valori segreti corrispondenti vengono
mascherati prima che righe JSONL o messaggi vengano scritti su disco.

- `logging.redactSensitive`: `off` | `tools` (predefinito: `tools`)
- `logging.redactPatterns`: array di stringhe regex (sostituisce i valori predefiniti)
  - Usa stringhe regex grezze (auto `gi`), oppure `/pattern/flags` se ti servono flag personalizzati.
  - Le corrispondenze vengono mascherate mantenendo i primi 6 + ultimi 4 caratteri (lunghezza >= 18), altrimenti `***`.
  - I valori predefiniti coprono assegnazioni di chiavi comuni, flag CLI, campi JSON, header bearer, blocchi PEM, prefissi di token popolari e nomi di campi per credenziali di pagamento come numero di carta, CVC/CVV, token di pagamento condiviso e credenziale di pagamento.

Alcuni confini di sicurezza vengono sempre redatti indipendentemente da `logging.redactSensitive`.
Questo include eventi di chiamata strumento della Control UI, output dello strumento `sessions_history`,
esportazioni di supporto diagnostico, osservazioni di errore del provider, visualizzazione dei comandi di approvazione exec
e log del protocollo WebSocket del Gateway. Queste superfici possono comunque usare
`logging.redactPatterns` come pattern aggiuntivi, ma `redactSensitive: "off"`
non fa sì che emettano segreti grezzi.

## Log WebSocket del Gateway

Il Gateway stampa i log del protocollo WebSocket in due modalità:

- **Modalità normale (senza `--verbose`)**: vengono stampati solo i risultati RPC "interessanti":
  - errori (`ok=false`)
  - chiamate lente (soglia predefinita: `>= 50ms`)
  - errori di parsing
- **Modalità verbose (`--verbose`)**: stampa tutto il traffico di richiesta/risposta WS.

### Stile dei log WS

`openclaw gateway` supporta uno switch di stile per Gateway:

- `--ws-log auto` (predefinito): la modalità normale è ottimizzata; la modalità verbose usa output compatto
- `--ws-log compact`: output compatto (richiesta/risposta abbinate) quando verbose
- `--ws-log full`: output completo per frame quando verbose
- `--compact`: alias per `--ws-log compact`

Esempi:

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## Formattazione della console (logging per sottosistema)

Il formatter della console è **TTY-aware** e stampa righe coerenti con prefisso.
I logger dei sottosistemi mantengono l'output raggruppato e facilmente scansionabile.

Comportamento:

- **Prefissi dei sottosistemi** su ogni riga (ad es. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Colori dei sottosistemi** (stabili per sottosistema) più colorazione del livello
- **Colore quando l'output è un TTY o l'ambiente sembra un terminale ricco** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), rispetta `NO_COLOR`
- **Prefissi dei sottosistemi abbreviati**: rimuove `gateway/` + `channels/` iniziali, mantiene gli ultimi 2 segmenti (ad es. `whatsapp/outbound`)
- **Sotto-logger per sottosistema** (prefisso automatico + campo strutturato `{ subsystem }`)
- **`logRaw()`** per output QR/UX (nessun prefisso, nessuna formattazione)
- **Stili della console** (ad es. `pretty | compact | json`)
- **Livello di log della console** separato dal livello di log su file (il file conserva il dettaglio completo quando `logging.level` è impostato su `debug`/`trace`)
- I **corpi dei messaggi WhatsApp** vengono registrati a `debug` (usa `--verbose` per vederli)

Questo mantiene stabili i log su file esistenti rendendo al contempo scansionabile l'output interattivo.

## Correlati

- [Logging](/it/logging)
- [Esportazione OpenTelemetry](/it/gateway/opentelemetry)
- [Esportazione diagnostica](/it/gateway/diagnostics)
