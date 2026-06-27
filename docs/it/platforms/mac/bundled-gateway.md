---
read_when:
    - Creazione del pacchetto OpenClaw.app
    - Debug del servizio launchd del Gateway macOS
    - Installazione della CLI Gateway per macOS
summary: Runtime Gateway su macOS (servizio launchd esterno)
title: Gateway su macOS
x-i18n:
    generated_at: "2026-06-27T17:45:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c55e3d24e5bc743233e11be4897f4f2a865c97f2e0d795a472caeb6d097d34
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app non include più Node/Bun o il runtime Gateway. L'app macOS
si aspetta un'installazione **esterna** della CLI `openclaw`, non avvia il Gateway come
processo figlio e gestisce un servizio launchd per utente per mantenere il Gateway
in esecuzione (oppure si collega a un Gateway locale esistente se è già in esecuzione).

## Installare la CLI (richiesta per la modalità locale)

Node 24 è il runtime predefinito su Mac. Node 22 LTS, attualmente `22.19+`, funziona ancora per compatibilità. Quindi installa `openclaw` globalmente:

```bash
npm install -g openclaw@<version>
```

Il pulsante **Installa CLI** dell'app macOS esegue lo stesso flusso di installazione globale che l'app
usa internamente: preferisce prima npm, poi pnpm, poi bun se è l'unico
gestore di pacchetti rilevato. Node rimane il runtime Gateway consigliato.

## Launchd (Gateway come LaunchAgent)

Etichetta:

- `ai.openclaw.gateway` (o `ai.openclaw.<profile>`; il legacy `com.openclaw.*` può rimanere)

Posizione del plist (per utente):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (o `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Gestore:

- L'app macOS gestisce l'installazione/aggiornamento del LaunchAgent in modalità Locale.
- Anche la CLI può installarlo: `openclaw gateway install`.

Comportamento:

- "OpenClaw Active" abilita/disabilita il LaunchAgent.
- L'uscita dall'app **non** arresta il gateway (launchd lo mantiene attivo).
- Se un Gateway è già in esecuzione sulla porta configurata, l'app si collega a
  esso invece di avviarne uno nuovo.

Logging:

- stdout di launchd: `~/Library/Logs/openclaw/gateway.log` (i profili usano `gateway-<profile>.log`)
- stderr di launchd: soppresso

## Compatibilità delle versioni

L'app macOS verifica la versione del gateway rispetto alla propria versione. Se sono
incompatibili, aggiorna la CLI globale in modo che corrisponda alla versione dell'app.

## Controllo rapido

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

Quindi:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## Correlati

- [app macOS](/it/platforms/macos)
- [runbook del Gateway](/it/gateway)
