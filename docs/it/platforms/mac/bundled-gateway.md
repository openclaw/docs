---
read_when:
    - Creazione del pacchetto di OpenClaw.app
    - Risoluzione dei problemi del servizio launchd del Gateway su macOS
    - Installazione della CLI Gateway per macOS
summary: Runtime del Gateway su macOS (servizio launchd esterno)
title: Gateway su macOS
x-i18n:
    generated_at: "2026-05-06T08:59:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f5dcc73671140d7599ffefceeb98ac7ce34da1f944c1e7c70bc9e5810e6ca66
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app non include più Node/Bun né il runtime del Gateway. L'app macOS
si aspetta un'installazione **esterna** della CLI `openclaw`, non avvia il Gateway come
processo figlio e gestisce un servizio launchd per utente per mantenere il Gateway
in esecuzione (o si collega a un Gateway locale esistente, se ne è già in esecuzione uno).

## Installa la CLI (richiesta per la modalità locale)

Node 24 è il runtime predefinito sul Mac. Node 22 LTS, attualmente `22.14+`, funziona ancora per compatibilità. Poi installa `openclaw` globalmente:

```bash
npm install -g openclaw@<version>
```

Il pulsante **Installa CLI** dell'app macOS esegue lo stesso flusso di installazione globale che l'app
usa internamente: preferisce prima npm, poi pnpm, poi bun se è l'unico
gestore di pacchetti rilevato. Node rimane il runtime consigliato per il Gateway.

## Launchd (Gateway come LaunchAgent)

Etichetta:

- `ai.openclaw.gateway` (o `ai.openclaw.<profile>`; il legacy `com.openclaw.*` può rimanere)

Posizione del plist (per utente):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (o `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Gestore:

- L'app macOS gestisce installazione/aggiornamento del LaunchAgent in modalità locale.
- Anche la CLI può installarlo: `openclaw gateway install`.

Comportamento:

- "OpenClaw attivo" abilita/disabilita il LaunchAgent.
- La chiusura dell'app **non** arresta il Gateway (launchd lo mantiene attivo).
- Se un Gateway è già in esecuzione sulla porta configurata, l'app si collega a
  quello invece di avviarne uno nuovo.

Logging:

- stdout/err di launchd: `/tmp/openclaw/openclaw-gateway.log`

## Compatibilità delle versioni

L'app macOS verifica la versione del Gateway rispetto alla propria versione. Se sono
incompatibili, aggiorna la CLI globale in modo che corrisponda alla versione dell'app.

## Verifica smoke

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

- [app macOS](/it/platforms/macos)
- [Runbook del Gateway](/it/gateway)
