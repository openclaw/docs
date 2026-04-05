---
read_when:
    - Modifica dei contratti IPC o dell'IPC dell'app della barra dei menu
summary: Architettura IPC macOS per app OpenClaw, trasporto nodo del gateway e PeekabooBridge
title: IPC macOS
x-i18n:
    generated_at: "2026-04-05T13:58:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: d0211c334a4a59b71afb29dd7b024778172e529fa618985632d3d11d795ced92
    source_path: platforms/mac/xpc.md
    workflow: 15
---

# Architettura IPC macOS di OpenClaw

**Modello attuale:** un socket Unix locale collega il **servizio host del nodo** all'**app macOS** per le approvazioni exec + `system.run`. Esiste una CLI di debug `openclaw-mac` per i controlli di rilevamento/connessione; le azioni dell'agente continuano però a passare tramite il Gateway WebSocket e `node.invoke`. L'automazione UI usa PeekabooBridge.

## Obiettivi

- Un'unica istanza dell'app GUI che gestisce tutto il lavoro rivolto a TCC (notifiche, registrazione schermo, microfono, sintesi vocale, AppleScript).
- Una piccola superficie per l'automazione: Gateway + comandi del nodo, più PeekabooBridge per l'automazione UI.
- Permessi prevedibili: sempre lo stesso bundle ID firmato, avviato da launchd, così le autorizzazioni TCC restano persistenti.

## Come funziona

### Gateway + trasporto del nodo

- L'app esegue il Gateway (modalità locale) e si connette a esso come nodo.
- Le azioni dell'agente vengono eseguite tramite `node.invoke` (ad es. `system.run`, `system.notify`, `canvas.*`).

### Servizio nodo + IPC dell'app

- Un servizio host del nodo headless si connette al Gateway WebSocket.
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
- Ordine di preferenza dell'host (lato client): Peekaboo.app → Claude.app → OpenClaw.app → esecuzione locale.
- Sicurezza: gli host bridge richiedono un TeamID consentito; la via di fuga same-UID solo DEBUG è protetta da `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (convenzione Peekaboo).
- Vedi: [uso di PeekabooBridge](/platforms/mac/peekaboo) per i dettagli.

## Flussi operativi

- Riavvio/rebuild: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Termina le istanze esistenti
  - Esegue Swift build + packaging
  - Scrive/avvia/kickstarta il LaunchAgent
- Istanza singola: l'app termina subito se è già in esecuzione un'altra istanza con lo stesso bundle ID.

## Note di hardening

- Preferisci richiedere una corrispondenza del TeamID per tutte le superfici privilegiate.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (solo DEBUG) può consentire chiamanti same-UID per lo sviluppo locale.
- Tutte le comunicazioni restano solo locali; non vengono esposti socket di rete.
- I prompt TCC provengono solo dal bundle dell'app GUI; mantieni stabile il bundle ID firmato tra una rebuild e l'altra.
- Hardening IPC: modalità del socket `0600`, token, controlli peer-UID, challenge/response HMAC, TTL breve.
