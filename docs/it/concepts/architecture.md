---
read_when:
    - Lavorare sul protocollo Gateway, sui client o sui trasporti
summary: Architettura del Gateway WebSocket, componenti e flussi client
title: Architettura del Gateway
x-i18n:
    generated_at: "2026-05-06T08:44:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 433489081bfe07691b211f5076ec45ce0ed3fd043eb86128f73121f2cab71cd3
    source_path: concepts/architecture.md
    workflow: 16
---

## Panoramica

- Un singolo **Gateway** a lunga durata gestisce tutte le superfici di messaggistica (WhatsApp tramite
  Baileys, Telegram tramite grammY, Slack, Discord, Signal, iMessage, WebChat).
- I client del piano di controllo (app macOS, CLI, UI web, automazioni) si connettono al
  Gateway tramite **WebSocket** sull'host di bind configurato (predefinito
  `127.0.0.1:18789`).
- Anche i **Node** (macOS/iOS/Android/headless) si connettono tramite **WebSocket**, ma
  dichiarano `role: node` con capability/comandi espliciti.
- Un Gateway per host; è l'unico punto che apre una sessione WhatsApp.
- Il **canvas host** è servito dal server HTTP del Gateway sotto:
  - `/__openclaw__/canvas/` (HTML/CSS/JS modificabili dall'agente)
  - `/__openclaw__/a2ui/` (host A2UI)
    Usa la stessa porta del Gateway (predefinita `18789`).

## Componenti e flussi

### Gateway (demone)

- Mantiene le connessioni dei provider.
- Espone un'API WS tipizzata (richieste, risposte, eventi push del server).
- Convalida i frame in ingresso rispetto a JSON Schema.
- Emette eventi come `agent`, `chat`, `presence`, `health`, `heartbeat`, `cron`.

### Client (app Mac / CLI / amministrazione web)

- Una connessione WS per client.
- Inviano richieste (`health`, `status`, `send`, `agent`, `system-presence`).
- Si sottoscrivono agli eventi (`tick`, `agent`, `presence`, `shutdown`).

### Node (macOS / iOS / Android / headless)

- Si connettono allo **stesso server WS** con `role: node`.
- Forniscono un'identità del dispositivo in `connect`; l'abbinamento è **basato sul dispositivo** (ruolo `node`) e
  l'approvazione risiede nello store di abbinamento dei dispositivi.
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
    Note right of Gateway: or res error + close
    Note left of Client: payload=hello-ok<br>snapshot: presence + health

    Gateway-->>Client: event:presence
    Gateway-->>Client: event:tick

    Client->>Gateway: req:agent
    Gateway-->>Client: res:agent<br>ack {runId, status:"accepted"}
    Gateway-->>Client: event:agent<br>(streaming)
    Gateway-->>Client: res:agent<br>final {runId, status, summary}
```

## Protocollo wire (riepilogo)

- Trasporto: WebSocket, frame di testo con payload JSON.
- Il primo frame **deve** essere `connect`.
- Dopo l'handshake:
  - Richieste: `{type:"req", id, method, params}` → `{type:"res", id, ok, payload|error}`
  - Eventi: `{type:"event", event, payload, seq?, stateVersion?}`
- `hello-ok.features.methods` / `events` sono metadati di discovery, non un
  dump generato di ogni route helper richiamabile.
- L'autenticazione con segreto condiviso usa `connect.params.auth.token` oppure
  `connect.params.auth.password`, in base alla modalità di autenticazione del gateway configurata.
- Le modalità che trasportano identità, come Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o `gateway.auth.mode: "trusted-proxy"`
  non local loopback, soddisfano l'autenticazione tramite header della richiesta
  invece di `connect.params.auth.*`.
- `gateway.auth.mode: "none"` per ingress privato disabilita completamente
  l'autenticazione con segreto condiviso; mantieni questa modalità disattivata su ingress pubblico/non attendibile.
- Le chiavi di idempotenza sono obbligatorie per i metodi con effetti collaterali (`send`, `agent`) per
  poter riprovare in sicurezza; il server mantiene una cache di deduplica di breve durata.
- I Node devono includere `role: "node"` più capability/comandi/permessi in `connect`.

## Abbinamento + trust locale

- Tutti i client WS (operatori + node) includono un'**identità del dispositivo** in `connect`.
- I nuovi ID dispositivo richiedono l'approvazione dell'abbinamento; il Gateway emette un **token dispositivo**
  per le connessioni successive.
- Le connessioni dirette local loopback possono essere approvate automaticamente per mantenere fluida la UX
  sullo stesso host.
- OpenClaw dispone anche di un percorso ristretto di auto-connessione backend/container-locale per
  flussi helper attendibili con segreto condiviso.
- Le connessioni Tailnet e LAN, inclusi i bind tailnet sullo stesso host, richiedono comunque
  l'approvazione esplicita dell'abbinamento.
- Tutte le connessioni devono firmare il nonce `connect.challenge`.
- Il payload di firma `v3` vincola anche `platform` + `deviceFamily`; il gateway
  fissa i metadati abbinati alla riconnessione e richiede un abbinamento di riparazione per modifiche ai metadati.
- Le connessioni **non locali** richiedono comunque approvazione esplicita.
- L'autenticazione del Gateway (`gateway.auth.*`) si applica comunque a **tutte** le connessioni, locali o
  remote.

Dettagli: [Protocollo Gateway](/it/gateway/protocol), [Abbinamento](/it/channels/pairing),
[Sicurezza](/it/gateway/security).

## Tipizzazione del protocollo e generazione del codice

- Gli schemi TypeBox definiscono il protocollo.
- JSON Schema viene generato da questi schemi.
- I modelli Swift vengono generati da JSON Schema.

## Accesso remoto

- Preferito: Tailscale o VPN.
- Alternativa: tunnel SSH

  ```bash
  ssh -N -L 18789:127.0.0.1:18789 user@host
  ```

- Lo stesso token di handshake + autenticazione si applica tramite il tunnel.
- TLS + pinning opzionale possono essere abilitati per WS nelle configurazioni remote.

## Snapshot operativo

- Avvio: `openclaw gateway` (foreground, log su stdout).
- Integrità: `health` tramite WS (incluso anche in `hello-ok`).
- Supervisione: launchd/systemd per il riavvio automatico.

## Invarianti

- Esattamente un Gateway controlla una singola sessione Baileys per host.
- L'handshake è obbligatorio; qualsiasi primo frame non JSON o non-connect comporta una chiusura forzata.
- Gli eventi non vengono riprodotti; i client devono aggiornarsi in caso di gap.

## Correlati

- [Loop agente](/it/concepts/agent-loop) — ciclo dettagliato di esecuzione dell'agente
- [Protocollo Gateway](/it/gateway/protocol) — contratto del protocollo WebSocket
- [Coda](/it/concepts/queue) — coda dei comandi e concorrenza
- [Sicurezza](/it/gateway/security) — modello di trust e hardening
