---
read_when:
    - Creazione del pacchetto di OpenClaw.app
    - Debug del servizio Gateway launchd di macOS
    - Installazione della CLI del Gateway per macOS
summary: Runtime del Gateway su macOS (servizio launchd esterno)
title: Gateway su macOS
x-i18n:
    generated_at: "2026-07-16T14:35:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 30c1ae14d8f8eaab73d0e2b725292d7411c2c8b5e0e0c32ad13989c01340d054
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app non include Node né il runtime del Gateway. L'app macOS
richiede un'installazione **esterna** della CLI `openclaw`, non avvia il Gateway come
processo figlio e gestisce un servizio launchd per utente per mantenere il Gateway
in esecuzione (oppure si collega a un Gateway locale già in esecuzione).

## Configurazione automatica

Su un Mac nuovo, selezionare **This Mac** durante la configurazione iniziale. L'app esegue il proprio
script di installazione firmato e incluso prima della procedura guidata del Gateway: installa un
runtime Node nello spazio utente e la CLI `openclaw` corrispondente in `~/.openclaw`,
quindi installa e avvia il servizio launchd per utente. Questo percorso non richiede
Terminale, Homebrew né accesso amministrativo.

L'app include solo lo script di installazione, non il payload di Node o del Gateway;
la configurazione richiede una connessione Internet per scaricare il runtime e il pacchetto
OpenClaw corrispondente.

## Ripristino manuale

Per un'installazione manuale è consigliato Node 24.15+; funziona anche Node 22.22.3+. Installare
`openclaw` globalmente:

```bash
npm install -g openclaw@<version>
```

Usare **Retry setup** dopo una configurazione automatica non riuscita. Se continua a non riuscire,
installare manualmente la CLI con il comando precedente, quindi selezionare **Check again**
durante la configurazione iniziale.

## Launchd (Gateway come LaunchAgent)

Etichetta: `ai.openclaw.gateway` (profilo predefinito) oppure `ai.openclaw.<profile>`
per un profilo denominato.

Posizione del plist (per utente): `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
(oppure `ai.openclaw.<profile>.plist`).

L'app macOS gestisce l'installazione e l'aggiornamento del LaunchAgent per il profilo predefinito in
modalità locale. Anche la CLI può installarlo direttamente: `openclaw gateway install`
(i profili denominati vengono selezionati tramite la variabile di ambiente `OPENCLAW_PROFILE`).

Comportamento:

- "OpenClaw Active" abilita/disabilita il LaunchAgent.
- La chiusura dell'app **non** arresta il Gateway (launchd lo mantiene in esecuzione).
- Se un Gateway è già in esecuzione sulla porta configurata, l'app si collega
  a esso invece di avviarne uno nuovo.

Registrazione:

- stdout di launchd: `~/Library/Logs/openclaw/gateway.log` (i profili usano
  `gateway-<profile>.log`)
- stderr di launchd: soppresso
- Se l'host entra in un ciclo con ripetuti `EADDRINUSE` o riavvii rapidi, verificare la presenza di
  LaunchAgent `ai.openclaw.gateway` / `ai.openclaw.node` duplicati e la
  soluzione alternativa basata sul marcatore launchd in
  [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#macos-launchd-supervisor-loop-with-duplicate-gatewaynode-launchagents).

## Compatibilità delle versioni

L'app macOS verifica la versione del Gateway rispetto alla propria versione. La configurazione iniziale
esegue automaticamente la configurazione gestita quando una CLI esistente è assente o
incompatibile. Usare **Retry setup** per ripetere l'installazione oppure **Check again**
dopo aver ripristinato una CLI esterna.

## Directory di stato su macOS

Conservare lo stato di OpenClaw su un disco locale non sincronizzato. Evitare iCloud Drive e altre
cartelle sincronizzate con il cloud; la latenza di sincronizzazione e i blocchi dei file possono influire su sessioni,
credenziali e stato del Gateway.

Impostare `OPENCLAW_STATE_DIR` su un percorso locale solo quando è necessaria una sostituzione.
`openclaw doctor` segnala i comuni percorsi di stato sincronizzati con il cloud e consiglia
di tornare all'archiviazione locale. Vedere
[variabili di ambiente](/it/help/environment#path-related-env-vars) e
[Doctor](/it/gateway/doctor).

## Debug della connettività dell'app

Usare la CLI di debug per macOS da un checkout del codice sorgente per verificare lo stesso handshake
WebSocket del Gateway e la stessa logica di rilevamento usati dall'app:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` accetta `--url`, `--token`, `--timeout`, `--probe` e `--json`
(oltre alle sostituzioni dell'identità del client; eseguire con `--help` per l'elenco completo).
`discover` accetta `--timeout`, `--json` e `--include-local`. Confrontare
l'output del rilevamento con `openclaw gateway discover --json` quando occorre
distinguere il rilevamento della CLI dai problemi di connessione lato app.

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

## Contenuti correlati

- [App macOS](/it/platforms/macos)
- [Manuale operativo del Gateway](/it/gateway)
