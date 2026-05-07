---
read_when:
    - Creazione del pacchetto OpenClaw.app
    - Debug del servizio launchd del Gateway macOS
    - Installazione della CLI del Gateway per macOS
summary: Runtime del Gateway su macOS (servizio launchd esterno)
title: Gateway su macOS
x-i18n:
    generated_at: "2026-05-07T13:21:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: caf129918c46f8f54026e9db04e8ad5a033148899d3029fe1a362bb14c7f25f8
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app non include più Node/Bun né il runtime del Gateway. L'app macOS
si aspetta un'installazione **esterna** della CLI `openclaw`, non avvia il Gateway come
processo figlio e gestisce un servizio launchd per utente per mantenere il Gateway
in esecuzione (oppure si collega a un Gateway locale esistente, se uno è già in esecuzione).

## Installa la CLI (richiesta per la modalità locale)

Node 24 è il runtime predefinito su Mac. Node 22 LTS, attualmente `22.16+`, funziona ancora per compatibilità. Quindi installa `openclaw` globalmente:

```bash
npm install -g openclaw@<version>
```

Il pulsante **Installa CLI** dell'app macOS esegue lo stesso flusso di installazione globale che l'app
usa internamente: preferisce prima npm, poi pnpm, poi bun se è l'unico
gestore di pacchetti rilevato. Node rimane il runtime consigliato per il Gateway.

## Launchd (Gateway come LaunchAgent)

Etichetta:

- `ai.openclaw.gateway` (oppure `ai.openclaw.<profile>`; il legacy `com.openclaw.*` può rimanere)

Posizione del plist (per utente):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (oppure `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Gestore:

- L'app macOS gestisce l'installazione/aggiornamento del LaunchAgent in modalità locale.
- Anche la CLI può installarlo: `openclaw gateway install`.

Comportamento:

- "OpenClaw attivo" abilita/disabilita il LaunchAgent.
- L'uscita dall'app **non** arresta il gateway (launchd lo mantiene attivo).
- Se un Gateway è già in esecuzione sulla porta configurata, l'app si collega a
  esso invece di avviarne uno nuovo.

Registrazione:

- stdout/err di launchd: `/tmp/openclaw/openclaw-gateway.log`

## Compatibilità delle versioni

L'app macOS controlla la versione del gateway rispetto alla propria versione. Se sono
incompatibili, aggiorna la CLI globale in modo che corrisponda alla versione dell'app.

## Controllo smoke

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

Poi:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## Correlati

- [App macOS](/it/platforms/macos)
- [Runbook del Gateway](/it/gateway)
