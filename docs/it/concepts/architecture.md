---
read_when:
    - Lavorare sul protocollo del Gateway, sui client o sui trasporti
summary: Architettura del gateway WebSocket, componenti e flussi client
title: Architettura del Gateway
x-i18n:
    generated_at: "2026-04-24T08:35:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91c553489da18b6ad83fc860014f5bfb758334e9789cb7893d4d00f81c650f02
    source_path: concepts/architecture.md
    workflow: 15
---

## Panoramica

- Un singolo **Gateway** a lunga durata possiede tutte le superfici di messaggistica (WhatsApp tramite
  Baileys, Telegram tramite grammY, Slack, Discord, Signal, iMessage, WebChat).
- I client del control plane (app macOS, CLI, web UI, automazioni) si connettono al
  Gateway tramite **WebSocket** sull'host di bind configurato (predefinito
  `127.0.0.1:18789`).
- Anche i **Node** (macOS/iOS/Android/headless) si connettono tramite **WebSocket**, ma
  dichiarano `role: node` con caps/comandi espliciti.
- Un Gateway per host; è l'unico punto che apre una sessione WhatsApp.
- Il **canvas host** è servito dal server HTTP del Gateway in:
  - `/__openclaw__/canvas/` (HTML/CSS/JS modificabili dall'agente)
  - `/__openclaw__/a2ui/` (host A2UI)
    Usa la stessa porta del Gateway (predefinita `18789`).

## Componenti e flussi

### Gateway (demone)

- Mantiene le connessioni ai provider.
- Espone un'API WS tipizzata (richieste, risposte, eventi push dal server).
- Convalida i frame in ingresso rispetto a JSON Schema.
- Emette eventi come `agent`, `chat`, `presence`, `health`, `heartbeat`, `cron`.

### Client (app macOS / CLI / web admin)

- Una connessione WS per client.
- Invia richieste (`health`, `status`, `send`, `agent`, `system-presence`).
- Si sottoscrive agli eventi (`tick`, `agent`, `presence`, `shutdown`).

### Node (macOS / iOS / Android / headless)

- Si connettono allo **stesso server WS** con `role: node`.
- Forniscono un'identità del dispositivo in `connect`; l'abbinamento è **basato sul dispositivo** (ruolo `node`) e
  l'approvazione risiede nello store di abbinamento del dispositivo.
- Espongono comandi come `canvas.*`, `camera.*`, `screen.record`, `location.get`.

Dettagli del protocollo:

- [Protocollo Gateway](/it/gateway/protocol)

### WebChat

- UI statica che usa l'API WS del Gateway per la cronologia chat e gli invii.
- Nelle configurazioni remote, si connette tramite lo stesso tunnel SSH/Tailscale degli altri
  client.

## Ciclo di vita della connessione (singolo client)

```mermaid
sequenceDiagram
    participant Client
    participant Gateway

    Client->>Gateway: req:connect
    Gateway-->>Client: res (ok)
    Note right of Gateway: oppure errore res + chiusura
    Note left of Client: payload=hello-ok<br>istantanea: presence + health

    Gateway-->>Client: event:presence
    Gateway-->>Client: event:tick

    Client->>Gateway: req:agent
    Gateway-->>Client: res:agent<br>ack {runId, status:"accepted"}
    Gateway-->>Client: event:agent<br>(streaming)
    Gateway-->>Client: res:agent<br>final {runId, status, summary}
```

## Protocollo wire (riepilogo)

- Trasporto: WebSocket, frame testuali con payload JSON.
- Il primo frame **deve** essere `connect`.
- Dopo l'handshake:
  - Richieste: `{type:"req", id, method, params}` → `{type:"res", id, ok, payload|error}`
  - Eventi: `{type:"event", event, payload, seq?, stateVersion?}`
- `hello-ok.features.methods` / `events` sono metadati di individuazione, non un
  dump generato di ogni percorso helper invocabile.
- L'autenticazione con secret condiviso usa `connect.params.auth.token` oppure
  `connect.params.auth.password`, a seconda della modalità di autenticazione del gateway configurata.
- Le modalità con identità, come Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o `gateway.auth.mode: "trusted-proxy"`
  non loopback, soddisfano l'autenticazione dagli header della richiesta
  invece che da `connect.params.auth.*`.
- L'ingresso privato `gateway.auth.mode: "none"` disabilita completamente l'autenticazione con secret condiviso;
  mantieni questa modalità disattivata su ingressi pubblici/non attendibili.
- Le chiavi di idempotenza sono obbligatorie per i metodi con effetti collaterali (`send`, `agent`) per
  ritentare in sicurezza; il server mantiene una cache dedupe a breve durata.
- I Node devono includere `role: "node"` più caps/comandi/permessi in `connect`.

## Abbinamento + trust locale

- Tutti i client WS (operatori + Node) includono una **identità del dispositivo** in `connect`.
- I nuovi ID dispositivo richiedono l'approvazione dell'abbinamento; il Gateway emette un **token dispositivo**
  per le connessioni successive.
- Le connessioni dirette locali loopback possono essere auto-approvate per mantenere fluida
  l'esperienza UX sullo stesso host.
- OpenClaw ha anche un percorso ristretto di self-connect backend/container-local per
  flussi helper trusted con secret condiviso.
- Le connessioni tailnet e LAN, incluse quelle tailnet sullo stesso host, richiedono comunque un'approvazione di abbinamento esplicita.
- Tutte le connessioni devono firmare il nonce `connect.challenge`.
- Il payload di firma `v3` associa anche `platform` + `deviceFamily`; il gateway
  fissa i metadati associati in fase di riconnessione e richiede un abbinamento di riparazione per i cambiamenti di metadati.
- Le connessioni **non locali** richiedono comunque un'approvazione esplicita.
- L'autenticazione del gateway (`gateway.auth.*`) si applica comunque a **tutte** le connessioni, locali o
  remote.

Dettagli: [Protocollo Gateway](/it/gateway/protocol), [Abbinamento](/it/channels/pairing),
[Sicurezza](/it/gateway/security).

## Tipizzazione del protocollo e codegen

- Gli schemi TypeBox definiscono il protocollo.
- JSON Schema viene generato a partire da questi schemi.
- I modelli Swift vengono generati dal JSON Schema.

## Accesso remoto

- Preferito: Tailscale o VPN.
- Alternativa: tunnel SSH

  ```bash
  ssh -N -L 18789:127.0.0.1:18789 user@host
  ```

- Lo stesso handshake + token di autenticazione si applicano sul tunnel.
- TLS + pinning facoltativo possono essere abilitati per WS nelle configurazioni remote.

## Istantanea operativa

- Avvio: `openclaw gateway` (foreground, log su stdout).
- Stato di salute: `health` su WS (incluso anche in `hello-ok`).
- Supervisione: launchd/systemd per il riavvio automatico.

## Invarianti

- Esattamente un Gateway controlla una singola sessione Baileys per host.
- L'handshake è obbligatorio; qualsiasi primo frame non JSON o non `connect` comporta una chiusura forzata.
- Gli eventi non vengono riprodotti; i client devono aggiornarsi in caso di gap.

## Correlati

- [Agent Loop](/it/concepts/agent-loop) — ciclo dettagliato di esecuzione dell'agente
- [Protocollo Gateway](/it/gateway/protocol) — contratto del protocollo WebSocket
- [Queue](/it/concepts/queue) — coda dei comandi e concorrenza
- [Sicurezza](/it/gateway/security) — modello di trust e hardening
