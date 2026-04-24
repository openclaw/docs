---
read_when:
    - Modifica dei contratti IPC o dell'IPC dell'app nella barra dei menu
summary: Architettura IPC macOS per l'app OpenClaw, il trasporto gateway Node e PeekabooBridge
title: IPC macOS
x-i18n:
    generated_at: "2026-04-24T08:50:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 359a33f1a4f5854bd18355f588b4465b5627d9c8fa10a37c884995375da32cac
    source_path: platforms/mac/xpc.md
    workflow: 15
---

# Architettura IPC macOS di OpenClaw

**Modello attuale:** un socket Unix locale connette il **servizio host Node** alla **app macOS** per approvazioni exec e `system.run`. Esiste una CLI di debug `openclaw-mac` per controlli di discovery/connessione; le azioni dell'agente continuano comunque a passare attraverso il Gateway WebSocket e `node.invoke`. L'automazione UI usa PeekabooBridge.

## Obiettivi

- Un'unica istanza dell'app GUI che possiede tutto il lavoro lato TCC (notifiche, registrazione schermo, microfono, voce, AppleScript).
- Una piccola superficie per l'automazione: Gateway + comandi Node, più PeekabooBridge per l'automazione UI.
- Permessi prevedibili: sempre lo stesso bundle ID firmato, avviato da launchd, così le concessioni TCC persistono.

## Come funziona

### Gateway + trasporto Node

- L'app esegue il Gateway (modalità locale) e si connette ad esso come Node.
- Le azioni dell'agente vengono eseguite tramite `node.invoke` (ad esempio `system.run`, `system.notify`, `canvas.*`).

### Servizio Node + IPC dell'app

- Un servizio host Node headless si connette al Gateway WebSocket.
- Le richieste `system.run` vengono inoltrate all'app macOS tramite un socket Unix locale.
- L'app esegue l'exec nel contesto UI, mostra un prompt se necessario e restituisce l'output.

Diagramma (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (automazione UI)

- L'automazione UI usa un socket UNIX separato chiamato `bridge.sock` e il protocollo JSON PeekabooBridge.
- Ordine di preferenza host (lato client): Peekaboo.app → Claude.app → OpenClaw.app → esecuzione locale.
- Sicurezza: gli host bridge richiedono un TeamID consentito; la via di fuga DEBUG-only per stesso UID è protetta da `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (convenzione Peekaboo).
- Vedi: [Uso di PeekabooBridge](/it/platforms/mac/peekaboo) per i dettagli.

## Flussi operativi

- Riavvio/ricostruzione: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Termina le istanze esistenti
  - Build + package Swift
  - Scrive/inizializza/riattiva il LaunchAgent
- Istanza singola: l'app esce subito se è già in esecuzione un'altra istanza con lo stesso bundle ID.

## Note di hardening

- Preferisci richiedere una corrispondenza di TeamID per tutte le superfici privilegiate.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (solo DEBUG) può consentire chiamanti con lo stesso UID per lo sviluppo locale.
- Tutta la comunicazione resta solo locale; non vengono esposti socket di rete.
- I prompt TCC provengono solo dal bundle dell'app GUI; mantieni stabile il bundle ID firmato tra una build e l'altra.
- Hardening IPC: modalità socket `0600`, token, controlli peer-UID, challenge/response HMAC, TTL breve.

## Correlati

- [App macOS](/it/platforms/macos)
- [Flusso IPC macOS (approvazioni Exec)](/it/tools/exec-approvals-advanced#macos-ipc-flow)
