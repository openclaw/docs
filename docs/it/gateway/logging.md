---
read_when:
    - Modifica dell'output o dei formati di logging
    - Debug dell'uscita della CLI o del Gateway
summary: Superfici di logging, log su file, stili dei log WS e formattazione della console
title: Registrazione dei log del Gateway
x-i18n:
    generated_at: "2026-04-30T08:53:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ce9c78201d2e26760282b08eacb17826b1eac84e80b99d3a9d5cbff4078b5b3
    source_path: gateway/logging.md
    workflow: 16
---

# Registrazione dei log

Per una panoramica rivolta all'utente (CLI + Control UI + configurazione), consulta [/logging](/it/logging).

OpenClaw ha due “superfici” di log:

- **Output della console** (ciò che vedi nel terminale / nell'interfaccia di debug).
- **Log su file** (righe JSON) scritti dal logger del Gateway.

## Logger basato su file

- Il file di log a rotazione predefinito si trova in `/tmp/openclaw/` (un file al giorno): `openclaw-YYYY-MM-DD.log`
  - La data usa il fuso orario locale dell'host del Gateway.
- I file di log attivi ruotano a `logging.maxFileBytes` (predefinito: 100 MB), conservando
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

**Verbose rispetto ai livelli di log**

- I **log su file** sono controllati esclusivamente da `logging.level`.
- `--verbose` influisce solo sulla **verbosità della console** (e sullo stile dei log WS); **non**
  aumenta il livello dei log su file.
- Per acquisire nei log su file dettagli disponibili solo in modalità verbose, imposta `logging.level` su `debug` o
  `trace`.

## Acquisizione della console

La CLI acquisisce `console.log/info/warn/error/debug/trace` e li scrive nei log su file,
continuando comunque a stampare su stdout/stderr.

Puoi regolare la verbosità della console in modo indipendente tramite:

- `logging.consoleLevel` (predefinito `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redazione

OpenClaw può mascherare i token sensibili prima che l'output di log o di trascrizione lasci il
processo. Questa policy di redazione dei log viene applicata alla console, ai log su file, ai record di log OTLP
e ai sink di testo delle trascrizioni di sessione, quindi i valori segreti corrispondenti vengono
mascherati prima che righe JSONL o messaggi vengano scritti su disco.

- `logging.redactSensitive`: `off` | `tools` (predefinito: `tools`)
- `logging.redactPatterns`: array di stringhe regex (sostituisce i valori predefiniti)
  - Usa stringhe regex raw (auto `gi`), oppure `/pattern/flags` se hai bisogno di flag personalizzati.
  - Le corrispondenze vengono mascherate mantenendo i primi 6 + ultimi 4 caratteri (lunghezza >= 18), altrimenti `***`.
  - I valori predefiniti coprono assegnazioni di chiavi comuni, flag CLI, campi JSON, header bearer, blocchi PEM e prefissi di token popolari.

Alcuni confini di sicurezza redigono sempre, indipendentemente da `logging.redactSensitive`.
Questo include eventi di chiamata strumenti della Control UI, output dello strumento `sessions_history`,
esportazioni di supporto diagnostico, osservazioni di errori dei provider, visualizzazione dei comandi di approvazione exec
e log del protocollo WebSocket del Gateway. Queste superfici possono comunque usare
`logging.redactPatterns` come pattern aggiuntivi, ma `redactSensitive: "off"`
non fa emettere loro segreti raw.

## Log WebSocket del Gateway

Il Gateway stampa i log del protocollo WebSocket in due modalità:

- **Modalità normale (senza `--verbose`)**: vengono stampati solo i risultati RPC “interessanti”:
  - errori (`ok=false`)
  - chiamate lente (soglia predefinita: `>= 50ms`)
  - errori di parsing
- **Modalità verbose (`--verbose`)**: stampa tutto il traffico di richiesta/risposta WS.

### Stile dei log WS

`openclaw gateway` supporta un selettore di stile per Gateway:

- `--ws-log auto` (predefinito): la modalità normale è ottimizzata; la modalità verbose usa un output compatto
- `--ws-log compact`: output compatto (richiesta/risposta abbinate) quando verbose
- `--ws-log full`: output completo per frame quando verbose
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

## Formattazione della console (log dei sottosistemi)

Il formatter della console è **consapevole del TTY** e stampa righe coerenti con prefisso.
I logger dei sottosistemi mantengono l'output raggruppato e facile da scansionare.

Comportamento:

- **Prefissi dei sottosistemi** su ogni riga (ad esempio `[gateway]`, `[canvas]`, `[tailscale]`)
- **Colori dei sottosistemi** (stabili per sottosistema) più colorazione del livello
- **Colore quando l'output è un TTY o l'ambiente assomiglia a un terminale ricco** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), rispetta `NO_COLOR`
- **Prefissi dei sottosistemi abbreviati**: rimuove `gateway/` + `channels/` iniziali, mantiene gli ultimi 2 segmenti (ad esempio `whatsapp/outbound`)
- **Sub-logger per sottosistema** (prefisso automatico + campo strutturato `{ subsystem }`)
- **`logRaw()`** per output QR/UX (nessun prefisso, nessuna formattazione)
- **Stili della console** (ad esempio `pretty | compact | json`)
- **Livello di log della console** separato dal livello di log su file (il file conserva tutti i dettagli quando `logging.level` è impostato su `debug`/`trace`)
- **I corpi dei messaggi WhatsApp** vengono registrati a `debug` (usa `--verbose` per vederli)

Questo mantiene stabili i log su file esistenti rendendo l'output interattivo facile da scansionare.

## Correlati

- [Log](/it/logging)
- [Esportazione OpenTelemetry](/it/gateway/opentelemetry)
- [Esportazione diagnostica](/it/gateway/diagnostics)
