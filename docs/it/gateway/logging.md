---
read_when:
    - Modifica dell'output o dei formati di registrazione
    - Debug dell'output della CLI o del Gateway
summary: Superfici di logging, log su file, stili dei log WS e formattazione della console
title: Registrazione del Gateway
x-i18n:
    generated_at: "2026-07-12T07:05:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6717be5eac3dfc1acf36b2f21b049d46c7fc3678945295b10ae69781d89d35ad
    source_path: gateway/logging.md
    workflow: 16
---

# Registrazione

Per una panoramica destinata agli utenti (CLI + interfaccia di controllo + configurazione), consulta [/logging](/it/logging).

OpenClaw dispone di due modalità di registrazione:

- **Output della console** - ciò che viene visualizzato nel terminale o nell'interfaccia di debug.
- **Log su file** - righe JSON scritte dal logger del Gateway.

All'avvio, il Gateway registra il modello predefinito risolto dell'agente e le modalità predefinite che influiscono sulle nuove sessioni:

```text
agent model: openai/gpt-5.6-sol (thinking=medium, fast=on)
```

`thinking` deriva dall'agente predefinito, dai parametri del modello o dall'impostazione globale predefinita dell'agente; se non è impostato, mostra `medium`. `fast` deriva dall'agente predefinito o dai parametri `fastMode` del modello.

## Logger basato su file

- Il file di log a rotazione predefinito si trova in `/tmp/openclaw/` (un file al giorno): `openclaw-YYYY-MM-DD.log`, datato in base al fuso orario locale dell'host del Gateway. Se tale directory non è sicura o non è scrivibile (proprietario errato, scrivibile da tutti o collegamento simbolico), OpenClaw utilizza invece un percorso `os.tmpdir()/openclaw-<uid>` specifico per l'utente; su Windows utilizza sempre questo percorso alternativo nella directory temporanea del sistema operativo.
- I file di log attivi vengono ruotati al raggiungimento di `logging.maxFileBytes` (valore predefinito: 100 MB), conservando fino a cinque archivi numerati (da `.1` a `.5`) e continuando a scrivere in un nuovo file attivo.
- Configura il percorso e il livello del file di log tramite `~/.openclaw/openclaw.json`: `logging.file`, `logging.level`.
- Il formato del file prevede un oggetto JSON per riga.

I percorsi di codice per le conversazioni, la voce in tempo reale e le stanze gestite utilizzano il logger di file condiviso per registrazioni limitate del ciclo di vita, destinate al debug operativo e all'esportazione dei log OTLP. Il testo delle trascrizioni, i payload audio, gli ID dei turni, gli ID delle chiamate e gli ID degli elementi del fornitore non vengono mai copiati nelle registrazioni di log.

La scheda Log dell'interfaccia di controllo segue questo file tramite il Gateway (`logs.tail`). La CLI fa lo stesso:

```bash
openclaw logs --follow
```

### Modalità dettagliata e livelli di log

- I **log su file** sono controllati esclusivamente da `logging.level`.
- `--verbose` influisce solo sul **livello di dettaglio della console** (e sullo stile dei log WS) e **non** aumenta il livello dei log su file.
- Per acquisire nei log su file i dettagli disponibili solo in modalità dettagliata, imposta `logging.level` su `debug` o `trace`.
- La registrazione a livello `trace` include anche riepiloghi diagnostici delle tempistiche per alcuni percorsi critici, come la preparazione della factory degli strumenti dei Plugin. Consulta [/tools/plugin#slow-plugin-tool-setup](/it/tools/plugin#slow-plugin-tool-setup).

## Acquisizione della console

La CLI acquisisce `console.log/info/warn/error/debug/trace`, li scrive nei log su file e continua a stamparli su stdout/stderr.

Regola separatamente il livello di dettaglio della console:

- `logging.consoleLevel` (valore predefinito: `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`; valore predefinito: `pretty` su una TTY, altrimenti `compact`)

## Oscuramento

OpenClaw maschera i token sensibili prima che l'output dei log o delle trascrizioni lasci il processo. Questa politica di oscuramento si applica alle destinazioni di testo della console, dei log su file, delle registrazioni di log OTLP e delle trascrizioni delle sessioni, in modo che i valori segreti corrispondenti siano mascherati prima che le righe JSONL o i messaggi vengano scritti su disco.

- `logging.redactSensitive`: `off` | `tools` (valore predefinito: `tools`)
- `logging.redactPatterns`: matrice di stringhe di espressioni regolari (sostituisce i valori predefiniti)
  - Utilizza stringhe di espressioni regolari non elaborate (`gi` automatico) oppure `/pattern/flags` per flag personalizzati.
  - Le corrispondenze vengono mascherate mantenendo i primi 6 e gli ultimi 4 caratteri (per valori di almeno 18 caratteri); i valori più brevi diventano `***`.
  - I valori predefiniti coprono le comuni assegnazioni di chiavi, i flag della CLI, i campi JSON, le intestazioni bearer, i blocchi PEM, i prefissi dei token dei fornitori più diffusi e i nomi dei campi delle credenziali di pagamento (numero della carta, CVC/CVV, token di pagamento condiviso, credenziale di pagamento).

Alcuni limiti di sicurezza applicano sempre l'oscuramento, indipendentemente da `logging.redactSensitive`: gli eventi di chiamata degli strumenti dell'interfaccia di controllo, l'output dello strumento `sessions_history`, le esportazioni diagnostiche per l'assistenza, le osservazioni degli errori del fornitore, la visualizzazione dei comandi per l'approvazione dell'esecuzione e i log del protocollo WebSocket del Gateway. Queste superfici rispettano comunque `logging.redactPatterns` come modelli aggiuntivi, ma `redactSensitive: "off"` non consente loro di emettere segreti non elaborati.

## Log WebSocket del Gateway

Il Gateway stampa i log del protocollo WebSocket in due modalità:

- **Modalità normale (senza `--verbose`)**: vengono stampati solo i risultati RPC «rilevanti»: errori (`ok=false`), chiamate lente (soglia predefinita: `>= 50ms`) ed errori di analisi.
- **Modalità dettagliata (`--verbose`)**: stampa tutto il traffico di richieste e risposte WS.

### Stile dei log WS

`openclaw gateway` supporta un'opzione di stile per ogni Gateway:

- `--ws-log auto` (valore predefinito): la modalità normale è ottimizzata; la modalità dettagliata utilizza un output compatto.
- `--ws-log compact`: output compatto (richiesta/risposta abbinate) in modalità dettagliata.
- `--ws-log full`: output completo per ogni frame in modalità dettagliata.
- `--compact`: alias di `--ws-log compact`.

```bash
# ottimizzato (solo errori/chiamate lente)
openclaw gateway

# mostra tutto il traffico WS (abbinato)
openclaw gateway --verbose --ws-log compact

# mostra tutto il traffico WS (metadati completi)
openclaw gateway --verbose --ws-log full
```

## Formattazione della console (registrazione dei sottosistemi)

Il formattatore della console riconosce le **TTY** e stampa righe uniformi con prefissi. I logger dei sottosistemi mantengono l'output raggruppato e facilmente consultabile:

- **Prefissi dei sottosistemi** su ogni riga (ad esempio `[gateway]`, `[canvas]`, `[tailscale]`).
- **Colori dei sottosistemi** (stabili per ogni sottosistema, derivati tramite hash dal nome) oltre alla colorazione in base al livello.
- **Colore quando l'output è una TTY** o l'ambiente appare come un terminale avanzato (`TERM`/`COLORTERM`/`TERM_PROGRAM`); rispetta `NO_COLOR` e `FORCE_COLOR`.
- **Prefissi abbreviati dei sottosistemi**: rimuove un segmento iniziale `gateway/`, `channels/` o `providers/`, quindi conserva al massimo gli ultimi 2 segmenti rimanenti (ad esempio, `channels/turn/kernel` viene visualizzato come `turn/kernel`). I sottosistemi di canale noti (`telegram`, `whatsapp`, `slack` e così via) vengono sempre ridotti al solo nome del canale.
- **Logger secondari per sottosistema** (prefisso automatico + campo strutturato `{ subsystem }`).
- **`logRaw()`** per l'output QR/UX (senza prefisso né formattazione).
- **Stili della console**: `pretty` | `compact` | `json`.
- **Il livello di log della console** è separato dal livello di log su file (il file conserva tutti i dettagli quando `logging.level` è `debug`/`trace`).
- **I corpi dei messaggi WhatsApp** vengono registrati a livello `debug` (utilizza `--verbose` per visualizzarli).

In questo modo, i log su file rimangono stabili mentre l'output interattivo resta facilmente consultabile.

## Contenuti correlati

- [Registrazione](/it/logging)
- [Esportazione OpenTelemetry](/it/gateway/opentelemetry)
- [Esportazione diagnostica](/it/gateway/diagnostics)
