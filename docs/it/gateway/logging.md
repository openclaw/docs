---
read_when:
    - Modifica dell'output o dei formati di logging
    - Debug dell'output della CLI o del Gateway
summary: Superfici di logging, log su file, stili dei log WS e formattazione della console
title: Registrazione dei log del Gateway
x-i18n:
    generated_at: "2026-05-01T08:30:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: f843812a41c25f9ca1884543ad3a5663c8e0bc327027cbd2b58ea6557c466aa9
    source_path: gateway/logging.md
    workflow: 16
---

# Registrazione

Per una panoramica rivolta all'utente (CLI + Control UI + configurazione), vedi [/logging](/it/logging).

OpenClaw ha due “superfici” di log:

- **Output della console** (ciò che vedi nel terminale / Debug UI).
- **Log su file** (righe JSON) scritti dal logger del Gateway.

## Logger basato su file

- Il file di log rolling predefinito si trova sotto `/tmp/openclaw/` (un file per giorno): `openclaw-YYYY-MM-DD.log`
  - La data usa il fuso orario locale dell'host del Gateway.
- I file di log attivi ruotano a `logging.maxFileBytes` (predefinito: 100 MB), mantenendo
  fino a cinque archivi numerati e continuando a scrivere un nuovo file attivo.
- Il percorso e il livello del file di log possono essere configurati tramite `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Il formato del file è un oggetto JSON per riga.

La scheda Log della Control UI segue questo file tramite il Gateway (`logs.tail`).
La CLI può fare lo stesso:

```bash
openclaw logs --follow
```

**Verboso e livelli di log**

- I **log su file** sono controllati esclusivamente da `logging.level`.
- `--verbose` influisce solo sulla **verbosità della console** (e sullo stile dei log WS); **non**
  aumenta il livello dei log su file.
- Per acquisire nei log su file i dettagli disponibili solo in modalità verbosa, imposta `logging.level` su `debug` o
  `trace`.

## Cattura della console

La CLI cattura `console.log/info/warn/error/debug/trace` e li scrive nei log su file,
continuando comunque a stampare su stdout/stderr.

Puoi regolare la verbosità della console in modo indipendente tramite:

- `logging.consoleLevel` (predefinito `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redazione

OpenClaw può mascherare i token sensibili prima che l'output di log o trascrizione lasci il
processo. Questa politica di redazione dei log viene applicata ai sink di testo per console, log su file, record
di log OTLP e trascrizioni di sessione, quindi i valori segreti corrispondenti vengono
mascherati prima che righe JSONL o messaggi vengano scritti su disco.

- `logging.redactSensitive`: `off` | `tools` (predefinito: `tools`)
- `logging.redactPatterns`: array di stringhe regex (sostituisce i valori predefiniti)
  - Usa stringhe regex grezze (auto `gi`), oppure `/pattern/flags` se hai bisogno di flag personalizzati.
  - Le corrispondenze vengono mascherate mantenendo i primi 6 + gli ultimi 4 caratteri (lunghezza >= 18), altrimenti `***`.
  - I valori predefiniti coprono assegnazioni di chiavi comuni, flag CLI, campi JSON, intestazioni bearer, blocchi PEM, prefissi di token diffusi e nomi di campi per credenziali di pagamento come numero di carta, CVC/CVV, token di pagamento condiviso e credenziale di pagamento.

Alcuni limiti di sicurezza applicano sempre la redazione indipendentemente da `logging.redactSensitive`.
Ciò include eventi di chiamata strumento della Control UI, output dello strumento `sessions_history`,
esportazioni di supporto diagnostico, osservazioni di errore dei provider, visualizzazione dei comandi di approvazione
exec e log del protocollo WebSocket del Gateway. Queste superfici possono comunque usare
`logging.redactPatterns` come pattern aggiuntivi, ma `redactSensitive: "off"`
non fa sì che emettano segreti non elaborati.

## Log WebSocket del Gateway

Il Gateway stampa i log del protocollo WebSocket in due modalità:

- **Modalità normale (senza `--verbose`)**: vengono stampati solo i risultati RPC “interessanti”:
  - errori (`ok=false`)
  - chiamate lente (soglia predefinita: `>= 50ms`)
  - errori di parsing
- **Modalità verbosa (`--verbose`)**: stampa tutto il traffico di richiesta/risposta WS.

### Stile dei log WS

`openclaw gateway` supporta un selettore di stile per Gateway:

- `--ws-log auto` (predefinito): la modalità normale è ottimizzata; la modalità verbosa usa output compatto
- `--ws-log compact`: output compatto (richiesta/risposta accoppiate) quando verboso
- `--ws-log full`: output completo per frame quando verboso
- `--compact`: alias di `--ws-log compact`

Esempi:

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## Formattazione della console (logging dei sottosistemi)

Il formatter della console è **consapevole del TTY** e stampa righe coerenti con prefisso.
I logger dei sottosistemi mantengono l'output raggruppato e facile da leggere.

Comportamento:

- **Prefissi dei sottosistemi** su ogni riga (ad es. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Colori dei sottosistemi** (stabili per sottosistema) più colorazione del livello
- **Colore quando l'output è un TTY o l'ambiente sembra un terminale avanzato** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), rispetta `NO_COLOR`
- **Prefissi dei sottosistemi abbreviati**: rimuove `gateway/` + `channels/` iniziali, mantiene gli ultimi 2 segmenti (ad es. `whatsapp/outbound`)
- **Sotto-logger per sottosistema** (prefisso automatico + campo strutturato `{ subsystem }`)
- **`logRaw()`** per output QR/UX (nessun prefisso, nessuna formattazione)
- **Stili della console** (ad es. `pretty | compact | json`)
- **Livello di log della console** separato dal livello di log su file (il file mantiene il dettaglio completo quando `logging.level` è impostato su `debug`/`trace`)
- **Corpi dei messaggi WhatsApp** registrati a `debug` (usa `--verbose` per vederli)

Questo mantiene stabili i log su file esistenti rendendo al contempo leggibile l'output interattivo.

## Correlati

- [Logging](/it/logging)
- [Esportazione OpenTelemetry](/it/gateway/opentelemetry)
- [Esportazione diagnostica](/it/gateway/diagnostics)
