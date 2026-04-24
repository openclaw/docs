---
read_when:
    - Modifica dell'output o dei formati di logging
    - Debug dell'output della CLI o del gateway
summary: Superfici di logging, log su file, stili di log WS e formattazione della console
title: Logging del Gateway
x-i18n:
    generated_at: "2026-04-24T08:40:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17ecbb9b781734727fc7aa8e3b0a59bc7ea22b455affd02fbc2db924c144b9f3
    source_path: gateway/logging.md
    workflow: 15
---

# Logging

Per una panoramica orientata all'utente (CLI + Control UI + configurazione), vedi [/logging](/it/logging).

OpenClaw ha due “superfici” di log:

- **Output della console** (quello che vedi nel terminale / Debug UI).
- **Log su file** (righe JSON) scritti dal logger del gateway.

## Logger basato su file

- Il file di log rolling predefinito si trova sotto `/tmp/openclaw/` (un file al giorno): `openclaw-YYYY-MM-DD.log`
  - La data usa il fuso orario locale dell'host del gateway.
- Il percorso del file di log e il livello possono essere configurati tramite `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Il formato del file è un oggetto JSON per riga.

La scheda Logs della Control UI segue questo file tramite il gateway (`logs.tail`).
Anche la CLI può fare lo stesso:

```bash
openclaw logs --follow
```

**Verbose vs. livelli di log**

- I **log su file** sono controllati esclusivamente da `logging.level`.
- `--verbose` influisce solo sulla **verbosità della console** (e sullo stile di log WS); **non**
  aumenta il livello di log del file.
- Per acquisire nei log su file dettagli visibili solo in modalità verbose, imposta `logging.level` su `debug` o
  `trace`.

## Acquisizione della console

La CLI cattura `console.log/info/warn/error/debug/trace` e li scrive nei log su file,
continuando comunque a stamparli su stdout/stderr.

Puoi regolare in modo indipendente la verbosità della console tramite:

- `logging.consoleLevel` (predefinito `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Oscuramento dei riepiloghi degli strumenti

I riepiloghi dettagliati degli strumenti (ad esempio `🛠️ Exec: ...`) possono mascherare token sensibili prima che raggiungano il flusso
della console. Questo vale **solo per gli strumenti** e non altera i log su file.

- `logging.redactSensitive`: `off` | `tools` (predefinito: `tools`)
- `logging.redactPatterns`: array di stringhe regex (sovrascrive i valori predefiniti)
  - Usa stringhe regex raw (auto `gi`), oppure `/pattern/flags` se ti servono flag personalizzati.
  - Le corrispondenze vengono mascherate mantenendo i primi 6 + ultimi 4 caratteri (lunghezza >= 18), altrimenti `***`.
  - I valori predefiniti coprono assegnazioni comuni di chiavi, flag CLI, campi JSON, header bearer, blocchi PEM e prefissi di token diffusi.

## Log WebSocket del Gateway

Il gateway stampa i log del protocollo WebSocket in due modalità:

- **Modalità normale (senza `--verbose`)**: vengono stampati solo i risultati RPC “interessanti”:
  - errori (`ok=false`)
  - chiamate lente (soglia predefinita: `>= 50ms`)
  - errori di parsing
- **Modalità verbose (`--verbose`)**: stampa tutto il traffico WS di richiesta/risposta.

### Stile di log WS

`openclaw gateway` supporta un selettore di stile per gateway:

- `--ws-log auto` (predefinito): la modalità normale è ottimizzata; la modalità verbose usa output compatto
- `--ws-log compact`: output compatto (richiesta/risposta accoppiate) in modalità verbose
- `--ws-log full`: output completo per frame in modalità verbose
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
I logger dei sottosistemi mantengono l'output raggruppato e facilmente scansionabile.

Comportamento:

- **Prefissi del sottosistema** su ogni riga (ad esempio `[gateway]`, `[canvas]`, `[tailscale]`)
- **Colori del sottosistema** (stabili per sottosistema) più colorazione del livello
- **Colore quando l'output è un TTY o l'ambiente sembra un terminale avanzato** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), con rispetto di `NO_COLOR`
- **Prefissi di sottosistema abbreviati**: elimina `gateway/` iniziale + `channels/`, mantiene gli ultimi 2 segmenti (ad esempio `whatsapp/outbound`)
- **Sotto-logger per sottosistema** (prefisso automatico + campo strutturato `{ subsystem }`)
- **`logRaw()`** per output QR/UX (senza prefisso, senza formattazione)
- **Stili della console** (ad esempio `pretty | compact | json`)
- **Livello di log della console** separato dal livello di log su file (il file mantiene il dettaglio completo quando `logging.level` è impostato su `debug`/`trace`)
- **I corpi dei messaggi WhatsApp** vengono registrati a livello `debug` (usa `--verbose` per vederli)

Questo mantiene stabili i log su file esistenti, rendendo al contempo l'output interattivo facile da scansionare.

## Correlati

- [Panoramica del logging](/it/logging)
- [Diagnostics export](/it/gateway/diagnostics)
