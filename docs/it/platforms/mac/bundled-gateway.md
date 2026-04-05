---
read_when:
    - Stai creando il pacchetto di OpenClaw.app
    - Stai eseguendo il debug del servizio launchd del gateway su macOS
    - Stai installando la CLI del gateway per macOS
summary: Runtime del Gateway su macOS (servizio launchd esterno)
title: Gateway su macOS
x-i18n:
    generated_at: "2026-04-05T13:58:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e41528b35d69c13608cb9a34b39a7f02e1134204d1b496cbdd191798f39607
    source_path: platforms/mac/bundled-gateway.md
    workflow: 15
---

# Gateway su macOS (launchd esterno)

OpenClaw.app non include più Node/Bun né il runtime del Gateway. L'app macOS
si aspetta un'installazione **esterna** della CLI `openclaw`, non avvia il Gateway come
processo figlio e gestisce un servizio launchd per utente per mantenere il Gateway
in esecuzione (oppure si collega a un Gateway locale esistente se ne è già in esecuzione uno).

## Installare la CLI (obbligatorio per la modalità locale)

Node 24 è il runtime predefinito sul Mac. Anche Node 22 LTS, attualmente `22.14+`, continua a funzionare per compatibilità. Poi installa `openclaw` globalmente:

```bash
npm install -g openclaw@<version>
```

Il pulsante **Install CLI** dell'app macOS esegue lo stesso flusso di installazione globale che l'app
usa internamente: preferisce prima npm, poi pnpm, poi bun se quello è l'unico
package manager rilevato. Node resta il runtime Gateway consigliato.

## Launchd (Gateway come LaunchAgent)

Etichetta:

- `ai.openclaw.gateway` (oppure `ai.openclaw.<profile>`; i legacy `com.openclaw.*` possono rimanere)

Posizione del plist (per utente):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (oppure `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Gestore:

- L'app macOS gestisce l'installazione/aggiornamento del LaunchAgent in modalità locale.
- Anche la CLI può installarlo: `openclaw gateway install`.

Comportamento:

- “OpenClaw Active” abilita/disabilita il LaunchAgent.
- La chiusura dell'app **non** arresta il gateway (launchd lo mantiene attivo).
- Se un Gateway è già in esecuzione sulla porta configurata, l'app si collega a
  esso invece di avviarne uno nuovo.

Logging:

- stdout/err di launchd: `/tmp/openclaw/openclaw-gateway.log`

## Compatibilità delle versioni

L'app macOS controlla la versione del gateway rispetto alla propria versione. Se risultano
incompatibili, aggiorna la CLI globale in modo che corrisponda alla versione dell'app.

## Verifica rapida

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
