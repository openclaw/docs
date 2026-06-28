---
read_when:
    - Creazione del pacchetto OpenClaw.app
    - Debug del servizio launchd del Gateway macOS
    - Installazione della CLI del Gateway per macOS
summary: Runtime Gateway su macOS (servizio launchd esterno)
title: Gateway su macOS
x-i18n:
    generated_at: "2026-06-28T00:12:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5317e82435ecf179407116339507a666957a8e23a07a49665233b22f22f5b155
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app non include più Node/Bun né il runtime del Gateway. L'app macOS
si aspetta un'installazione **esterna** della CLI `openclaw`, non avvia il Gateway
come processo figlio e gestisce un servizio launchd per utente per mantenere il Gateway
in esecuzione (oppure si collega a un Gateway locale esistente, se uno è già in esecuzione).

## Installare la CLI (richiesta per la modalità locale)

Node 24 è il runtime predefinito su Mac. Node 22 LTS, attualmente `22.19+`, funziona ancora per compatibilità. Quindi installa `openclaw` globalmente:

```bash
npm install -g openclaw@<version>
```

Il pulsante **Install CLI** dell'app macOS esegue lo stesso flusso di installazione globale che l'app
usa internamente: preferisce prima npm, poi pnpm, poi bun se è l'unico
gestore di pacchetti rilevato. Node rimane il runtime Gateway consigliato.

## Launchd (Gateway come LaunchAgent)

Etichetta:

- `ai.openclaw.gateway` (o `ai.openclaw.<profile>`; il legacy `com.openclaw.*` può rimanere)

Posizione plist (per utente):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (o `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Gestore:

- L'app macOS gestisce l'installazione/aggiornamento di LaunchAgent in modalità locale.
- Anche la CLI può installarlo: `openclaw gateway install`.

Comportamento:

- "OpenClaw Active" abilita/disabilita il LaunchAgent.
- L'uscita dall'app **non** arresta il gateway (launchd lo mantiene attivo).
- Se un Gateway è già in esecuzione sulla porta configurata, l'app si collega a
  esso invece di avviarne uno nuovo.

Log:

- stdout di launchd: `~/Library/Logs/openclaw/gateway.log` (i profili usano `gateway-<profile>.log`)
- stderr di launchd: soppresso

## Compatibilità delle versioni

L'app macOS verifica la versione del gateway rispetto alla propria versione. Se sono
incompatibili, aggiorna la CLI globale in modo che corrisponda alla versione dell'app.

## Directory di stato su macOS

Mantieni lo stato di OpenClaw su un disco locale non sincronizzato. Evita iCloud Drive e altre
cartelle sincronizzate con il cloud, perché latenza di sincronizzazione e blocchi dei file possono influire su sessioni,
credenziali e stato del Gateway.

Imposta `OPENCLAW_STATE_DIR` su un percorso locale solo quando ti serve un override.
`openclaw doctor` avvisa dei comuni percorsi di stato sincronizzati con il cloud e consiglia
di tornare allo storage locale. Vedi
[variabili d'ambiente](/it/help/environment#path-related-env-vars) e
[Doctor](/it/gateway/doctor).

## Debug della connettività dell'app

Usa la CLI di debug macOS da un checkout sorgente per esercitare lo stesso handshake
WebSocket del Gateway e la stessa logica di discovery usati dall'app:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` accetta `--url`, `--token`, `--timeout` e `--json`. `discover`
accetta `--timeout`, `--json` e `--include-local`. Confronta l'output di discovery
con `openclaw gateway discover --json` quando devi separare la discovery della CLI
dai problemi di connessione lato app.

## Smoke check

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
