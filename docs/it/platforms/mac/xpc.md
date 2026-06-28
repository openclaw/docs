---
read_when:
    - Modifica dei contratti IPC o dell'IPC dell'app della barra dei menu
summary: Architettura IPC di macOS per l'app OpenClaw, il trasporto del nodo Gateway e PeekabooBridge
title: IPC di macOS
x-i18n:
    generated_at: "2026-06-28T00:13:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 436ea0a01dc544d246b4f2f506a2950fd05b36a8cf79f6f03cffe2843eef8c0d
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# Architettura IPC macOS di OpenClaw

**Modello attuale:** un socket Unix locale connette il **servizio host node** all'**app macOS** per approvazioni exec + `system.run`. Esiste una CLI di debug `openclaw-mac` per i controlli di discovery/connessione; le azioni degli agenti continuano a passare attraverso il WebSocket del Gateway e `node.invoke`. L'automazione dell'interfaccia utente usa PeekabooBridge.

## Obiettivi

- Una singola istanza dell'app GUI che possiede tutto il lavoro rivolto a TCC (notifiche, registrazione dello schermo, microfono, voce, AppleScript).
- Una superficie ridotta per l'automazione: Gateway + comandi node, più PeekabooBridge per l'automazione dell'interfaccia utente.
- Autorizzazioni prevedibili: sempre lo stesso bundle ID firmato, avviato da launchd, così le concessioni TCC rimangono valide.

## Come funziona

### Trasporto Gateway + node

- L'app esegue il Gateway (modalità locale) e si connette a esso come node.
- Le azioni degli agenti vengono eseguite tramite `node.invoke` (ad es. `system.run`, `system.notify`, `canvas.*`).
- I comandi node comuni su Mac includono `canvas.*`, `camera.snap`, `camera.clip`,
  `screen.snapshot`, `screen.record`, `system.run` e `system.notify`.
- Il node segnala una mappa `permissions` così gli agenti possono vedere se l'accesso a schermo,
  fotocamera, microfono, voce, automazione o accessibilità è disponibile.

### Servizio Node + IPC dell'app

- Un servizio host node headless si connette al WebSocket del Gateway.
- Le richieste `system.run` vengono inoltrate all'app macOS tramite un socket Unix locale.
- L'app esegue l'exec nel contesto dell'interfaccia utente, chiede conferma se necessario e restituisce l'output.

Diagramma (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (automazione dell'interfaccia utente)

- L'automazione dell'interfaccia utente usa un socket UNIX separato chiamato `bridge.sock` e il protocollo JSON PeekabooBridge.
- Ordine di preferenza degli host (lato client): Peekaboo.app → Claude.app → OpenClaw.app → esecuzione locale.
- Sicurezza: gli host bridge richiedono un TeamID consentito; la scappatoia solo DEBUG per lo stesso UID è protetta da `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (convenzione Peekaboo).
- Vedi: [uso di PeekabooBridge](/it/platforms/mac/peekaboo) per i dettagli.

## Flussi operativi

- Riavvio/ricostruzione: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Termina le istanze esistenti
  - Build Swift + pacchetto
  - Scrive/esegue bootstrap/kickstart del LaunchAgent
- Istanza singola: l'app esce anticipatamente se è in esecuzione un'altra istanza con lo stesso bundle ID.

## Note di hardening

- Preferire la richiesta di corrispondenza TeamID per tutte le superfici privilegiate.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (solo DEBUG) può consentire chiamanti con lo stesso UID per lo sviluppo locale.
- Tutte le comunicazioni restano solo locali; non vengono esposti socket di rete.
- I prompt TCC hanno origine solo dal bundle dell'app GUI; mantenere stabile il bundle ID firmato tra le ricostruzioni.
- Hardening IPC: modalità socket `0600`, token, controlli peer-UID, challenge/response HMAC, TTL breve.

## Correlati

- [app macOS](/it/platforms/macos)
- [flusso IPC macOS (approvazioni Exec)](/it/tools/exec-approvals-advanced#macos-ipc-flow)
