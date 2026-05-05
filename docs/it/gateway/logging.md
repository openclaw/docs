---
read_when:
    - Modificare l'output o i formati dei log
    - Debug dell'output della CLI o del Gateway
summary: Superfici di logging, log su file, stili dei log WS e formattazione della console
title: Registrazione dei log del Gateway
x-i18n:
    generated_at: "2026-05-05T01:46:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: d49ca112d3cc4ec76ecfc8b14d16dae64f74ca1f761fdb2b7bb470f73b66a246
    source_path: gateway/logging.md
    workflow: 16
---

# Registrazione dei log

Per una panoramica rivolta all'utente (CLI + UI di controllo + configurazione), consulta [/logging](/it/logging).

OpenClaw ha due “superfici” di log:

- **Output della console** (ciò che vedi nel terminale / UI di debug).
- **Log su file** (righe JSON) scritti dal logger del Gateway.

All'avvio, il Gateway registra il modello agente predefinito risolto insieme ai
valori predefiniti della modalità che influenzano le nuove sessioni, ad esempio:

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` deriva dall'agente predefinito, dai parametri del modello o dal valore predefinito globale dell'agente;
quando non è impostato, il riepilogo di avvio mostra `medium`. `fast` deriva
dall'agente predefinito o dai parametri `fastMode` del modello.

## Logger basato su file

- Il file di log rotativo predefinito si trova in `/tmp/openclaw/` (un file al giorno): `openclaw-YYYY-MM-DD.log`
  - La data usa il fuso orario locale dell'host del Gateway.
- I file di log attivi ruotano a `logging.maxFileBytes` (predefinito: 100 MB), mantenendo
  fino a cinque archivi numerati e continuando a scrivere un nuovo file attivo.
- Il percorso e il livello del file di log possono essere configurati tramite `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Il formato del file è un oggetto JSON per riga.

La scheda Log della UI di controllo segue questo file tramite il Gateway (`logs.tail`).
La CLI può fare lo stesso:

```bash
openclaw logs --follow
```

**Verboso vs. livelli di log**

- **I log su file** sono controllati esclusivamente da `logging.level`.
- `--verbose` influisce solo sulla **verbosità della console** (e sullo stile dei log WS); **non**
  aumenta il livello dei log su file.
- Per acquisire nei log su file dettagli disponibili solo in modalità verbosa, imposta `logging.level` su `debug` o
  `trace`.
- Il logging di traccia include anche riepiloghi diagnostici dei tempi per alcuni percorsi critici selezionati,
  come la preparazione della factory degli strumenti Plugin. Consulta
  [/tools/plugin#slow-plugin-tool-setup](/it/tools/plugin#slow-plugin-tool-setup).

## Acquisizione della console

La CLI acquisisce `console.log/info/warn/error/debug/trace` e li scrive nei log su file,
continuando comunque a stampare su stdout/stderr.

Puoi regolare la verbosità della console in modo indipendente tramite:

- `logging.consoleLevel` (predefinito `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redazione

OpenClaw può mascherare i token sensibili prima che l'output di log o trascrizione lasci il
processo. Questa policy di redazione dei log viene applicata ai sink di testo della console, dei log su file, dei
record di log OTLP e delle trascrizioni di sessione, quindi i valori segreti corrispondenti vengono
mascherati prima che righe JSONL o messaggi siano scritti su disco.

- `logging.redactSensitive`: `off` | `tools` (predefinito: `tools`)
- `logging.redactPatterns`: array di stringhe regex (sovrascrive i valori predefiniti)
  - Usa stringhe regex grezze (auto `gi`), oppure `/pattern/flags` se hai bisogno di flag personalizzati.
  - Le corrispondenze vengono mascherate mantenendo i primi 6 + gli ultimi 4 caratteri (lunghezza >= 18), altrimenti `***`.
  - I valori predefiniti coprono assegnazioni di chiavi comuni, flag CLI, campi JSON, intestazioni bearer, blocchi PEM, prefissi di token diffusi e nomi di campi per credenziali di pagamento come numero di carta, CVC/CVV, token di pagamento condiviso e credenziale di pagamento.

Alcuni confini di sicurezza redigono sempre, indipendentemente da `logging.redactSensitive`.
Questo include gli eventi di chiamata strumenti della UI di controllo, l'output dello strumento `sessions_history`,
le esportazioni di supporto diagnostico, le osservazioni di errori dei provider, la visualizzazione dei comandi di approvazione exec
e i log del protocollo WebSocket del Gateway. Queste superfici possono comunque usare
`logging.redactPatterns` come pattern aggiuntivi, ma `redactSensitive: "off"`
non fa sì che emettano segreti grezzi.

## Log WebSocket del Gateway

Il gateway stampa i log del protocollo WebSocket in due modalità:

- **Modalità normale (senza `--verbose`)**: vengono stampati solo i risultati RPC “interessanti”:
  - errori (`ok=false`)
  - chiamate lente (soglia predefinita: `>= 50ms`)
  - errori di parsing
- **Modalità verbosa (`--verbose`)**: stampa tutto il traffico di richiesta/risposta WS.

### Stile dei log WS

`openclaw gateway` supporta un selettore di stile per Gateway:

- `--ws-log auto` (predefinito): la modalità normale è ottimizzata; la modalità verbosa usa output compatto
- `--ws-log compact`: output compatto (richiesta/risposta abbinate) in modalità verbosa
- `--ws-log full`: output completo per frame in modalità verbosa
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
I logger dei sottosistemi mantengono l'output raggruppato e facile da scansionare.

Comportamento:

- **Prefissi dei sottosistemi** su ogni riga (ad es. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Colori dei sottosistemi** (stabili per sottosistema) più colorazione del livello
- **Colore quando l'output è un TTY o l'ambiente sembra un terminale ricco** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), rispetta `NO_COLOR`
- **Prefissi dei sottosistemi abbreviati**: rimuove `gateway/` + `channels/` iniziali, mantiene gli ultimi 2 segmenti (ad es. `whatsapp/outbound`)
- **Sotto-logger per sottosistema** (prefisso automatico + campo strutturato `{ subsystem }`)
- **`logRaw()`** per output QR/UX (nessun prefisso, nessuna formattazione)
- **Stili della console** (ad es. `pretty | compact | json`)
- **Livello di log della console** separato dal livello di log su file (il file mantiene tutti i dettagli quando `logging.level` è impostato su `debug`/`trace`)
- **I corpi dei messaggi WhatsApp** vengono registrati a livello `debug` (usa `--verbose` per vederli)

Questo mantiene stabili i log su file esistenti rendendo l'output interattivo facile da scansionare.

## Correlati

- [Registrazione dei log](/it/logging)
- [Esportazione OpenTelemetry](/it/gateway/opentelemetry)
- [Esportazione diagnostica](/it/gateway/diagnostics)
