---
read_when:
    - Creazione del pacchetto OpenClaw.app
    - Debug del servizio launchd del Gateway su macOS
    - Installazione della CLI del gateway per macOS
summary: Runtime del Gateway su macOS (servizio launchd esterno)
title: Gateway su macOS
x-i18n:
    generated_at: "2026-07-04T06:36:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a8b646f4cae43cb66acbf3527ef2af9ccaf4b6f2678a464586a110e5e9b3662
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app non include più Node/Bun o il runtime Gateway. L’app macOS
richiede un’installazione **esterna** della CLI `openclaw`, non avvia il Gateway
come processo figlio e gestisce un servizio launchd per utente per mantenere il
Gateway in esecuzione (oppure si collega a un Gateway locale esistente se è già
in esecuzione).

## Configurazione automatica

Su un Mac nuovo, scegli **Questo Mac** durante l’onboarding. L’app esegue il suo
installer firmato e incluso prima della procedura guidata Gateway, installa un
runtime Node nello spazio utente e la CLI `openclaw` corrispondente in
`~/.openclaw`, quindi installa e avvia il servizio launchd per utente. Questo
percorso non richiede Terminale, Homebrew o accesso da amministratore.

L’app include lo script di installazione, non il payload Node o Gateway. La
configurazione richiede quindi una connessione internet per scaricare il runtime
e il pacchetto OpenClaw corrispondente.

## Ripristino manuale

Node 24 è consigliato per un’installazione manuale. Funziona anche Node 22 LTS,
attualmente `22.19+`. Quindi installa `openclaw` globalmente:

```bash
npm install -g openclaw@<version>
```

Usa **Riprova configurazione** dopo una configurazione automatica non riuscita.
Se anche questo non riesce, installa manualmente la CLI con il comando sopra,
quindi scegli **Controlla di nuovo** nell’onboarding. Node rimane il runtime
Gateway consigliato.

## Launchd (Gateway come LaunchAgent)

Etichetta:

- `ai.openclaw.gateway` (o `ai.openclaw.<profile>`; il legacy `com.openclaw.*` può rimanere)

Posizione plist (per utente):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (o `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Gestore:

- L’app macOS gestisce installazione/aggiornamento del LaunchAgent in modalità locale.
- Anche la CLI può installarlo: `openclaw gateway install`.

Comportamento:

- "OpenClaw attivo" abilita/disabilita il LaunchAgent.
- L’uscita dall’app **non** arresta il gateway (launchd lo mantiene attivo).
- Se un Gateway è già in esecuzione sulla porta configurata, l’app vi si collega
  invece di avviarne uno nuovo.

Registrazione:

- stdout launchd: `~/Library/Logs/openclaw/gateway.log` (i profili usano `gateway-<profile>.log`)
- stderr launchd: soppresso

## Compatibilità delle versioni

L’app macOS controlla la versione del Gateway rispetto alla propria versione.
L’onboarding esegue automaticamente la configurazione gestita quando una CLI
esistente manca o è incompatibile. Usa **Riprova configurazione** per ripetere
l’installazione o **Controlla di nuovo** dopo aver riparato una CLI esterna.

## Directory di stato su macOS

Mantieni lo stato di OpenClaw su un disco locale non sincronizzato. Evita iCloud
Drive e altre cartelle sincronizzate con il cloud, perché la latenza di
sincronizzazione e i blocchi dei file possono influire su sessioni, credenziali
e stato del Gateway.

Imposta `OPENCLAW_STATE_DIR` su un percorso locale solo quando serve un override.
`openclaw doctor` avvisa dei percorsi di stato comuni sincronizzati con il cloud
e consiglia di tornare all’archiviazione locale. Vedi
[variabili d’ambiente](/it/help/environment#path-related-env-vars) e
[Doctor](/it/gateway/doctor).

## Debug della connettività dell’app

Usa la CLI di debug macOS da un checkout sorgente per esercitare la stessa logica
di handshake WebSocket e discovery del Gateway usata dall’app:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` accetta `--url`, `--token`, `--timeout` e `--json`. `discover`
accetta `--timeout`, `--json` e `--include-local`. Confronta l’output di discovery
con `openclaw gateway discover --json` quando devi separare la discovery della CLI
dai problemi di connessione lato app.

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

- [app macOS](/it/platforms/macos)
- [runbook Gateway](/it/gateway)
