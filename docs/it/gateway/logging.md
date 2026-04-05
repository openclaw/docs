---
read_when:
    - Stai modificando l'output o i formati del logging
    - Stai eseguendo il debug dell'output della CLI o del gateway
summary: Superfici di logging, file di log, stili di log WS e formattazione della console
title: Logging del Gateway
x-i18n:
    generated_at: "2026-04-05T13:52:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 465fe66ae6a3bc844e75d3898aed15b3371481c4fe89ede40e5a9377e19bb74c
    source_path: gateway/logging.md
    workflow: 15
---

# Logging

Per una panoramica rivolta all'utente (CLI + Control UI + configurazione), vedi [/logging](/logging).

OpenClaw ha due “superfici” di log:

- **Output della console** (quello che vedi nel terminale / Debug UI).
- **File di log** (righe JSON) scritti dal logger del gateway.

## Logger basato su file

- Il file di log rolling predefinito si trova sotto `/tmp/openclaw/` (un file al giorno): `openclaw-YYYY-MM-DD.log`
  - La data usa il fuso orario locale dell'host del gateway.
- Il percorso e il livello del file di log possono essere configurati tramite `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Il formato del file è un oggetto JSON per riga.

La scheda Logs della Control UI segue questo file tramite il gateway (`logs.tail`).
La CLI può fare lo stesso:

```bash
openclaw logs --follow
```

**Verbose vs. livelli di log**

- I **file di log** sono controllati esclusivamente da `logging.level`.
- `--verbose` influisce solo sulla **verbosità della console** (e sullo stile dei log WS); **non**
  aumenta il livello di log del file.
- Per acquisire nei file di log dettagli visibili solo in modalità verbose, imposta `logging.level` su `debug` o
  `trace`.

## Acquisizione della console

La CLI acquisisce `console.log/info/warn/error/debug/trace` e li scrive nei file di log,
continuando comunque a stamparli su stdout/stderr.

Puoi regolare la verbosità della console in modo indipendente tramite:

- `logging.consoleLevel` (predefinito `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redazione del riepilogo strumenti

I riepiloghi dettagliati degli strumenti (ad esempio `🛠️ Exec: ...`) possono mascherare token sensibili prima che raggiungano lo
stream della console. Questo vale **solo per gli strumenti** e non modifica i file di log.

- `logging.redactSensitive`: `off` | `tools` (predefinito: `tools`)
- `logging.redactPatterns`: array di stringhe regex (sovrascrive i valori predefiniti)
  - Usa stringhe regex grezze (auto `gi`), oppure `/pattern/flags` se ti servono flag personalizzati.
  - Le corrispondenze vengono mascherate mantenendo i primi 6 + gli ultimi 4 caratteri (lunghezza >= 18), altrimenti `***`.
  - I valori predefiniti coprono assegnazioni comuni di chiavi, flag CLI, campi JSON, header bearer, blocchi PEM e prefissi di token diffusi.

## Log WebSocket del gateway

Il gateway stampa i log del protocollo WebSocket in due modalità:

- **Modalità normale (senza `--verbose`)**: vengono stampati solo i risultati RPC “interessanti”:
  - errori (`ok=false`)
  - chiamate lente (soglia predefinita: `>= 50ms`)
  - errori di parsing
- **Modalità verbose (`--verbose`)**: stampa tutto il traffico WS richiesta/risposta.

### Stile dei log WS

`openclaw gateway` supporta un selettore di stile per gateway:

- `--ws-log auto` (predefinito): la modalità normale è ottimizzata; la modalità verbose usa output compatto
- `--ws-log compact`: output compatto (richiesta/risposta abbinate) in modalità verbose
- `--ws-log full`: output completo per frame in modalità verbose
- `--compact`: alias di `--ws-log compact`

Esempi:

```bash
# ottimizzato (solo errori/lentezza)
openclaw gateway

# mostra tutto il traffico WS (abbinato)
openclaw gateway --verbose --ws-log compact

# mostra tutto il traffico WS (meta completo)
openclaw gateway --verbose --ws-log full
```

## Formattazione della console (logging del sottosistema)

Il formatter della console è **consapevole del TTY** e stampa righe coerenti con prefisso.
I logger di sottosistema mantengono l'output raggruppato e facilmente leggibile.

Comportamento:

- **Prefissi di sottosistema** su ogni riga (ad esempio `[gateway]`, `[canvas]`, `[tailscale]`)
- **Colori di sottosistema** (stabili per sottosistema) più colorazione del livello
- **Colore quando l'output è un TTY o l'ambiente sembra un terminale avanzato** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), nel rispetto di `NO_COLOR`
- **Prefissi di sottosistema abbreviati**: rimuove `gateway/` + `channels/` iniziali, mantiene gli ultimi 2 segmenti (ad esempio `whatsapp/outbound`)
- **Sub-logger per sottosistema** (prefisso automatico + campo strutturato `{ subsystem }`)
- **`logRaw()`** per output QR/UX (senza prefisso, senza formattazione)
- **Stili console** (ad esempio `pretty | compact | json`)
- **Livello di log della console** separato dal livello di log del file (il file mantiene il dettaglio completo quando `logging.level` è impostato su `debug`/`trace`)
- **I corpi dei messaggi WhatsApp** vengono registrati a livello `debug` (usa `--verbose` per vederli)

Questo mantiene stabili i file di log esistenti, rendendo al tempo stesso più leggibile l'output interattivo.
