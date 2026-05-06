---
read_when:
    - Werken aan Gateway-protocol, clients of transports
summary: WebSocket Gateway-architectuur, componenten en clientstromen
title: Gateway-architectuur
x-i18n:
    generated_at: "2026-05-06T09:07:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 433489081bfe07691b211f5076ec45ce0ed3fd043eb86128f73121f2cab71cd3
    source_path: concepts/architecture.md
    workflow: 16
---

## Overzicht

- Eén langlevende **Gateway** beheert alle berichtinterfaces (WhatsApp via
  Baileys, Telegram via grammY, Slack, Discord, Signal, iMessage, WebChat).
- Besturingsvlakclients (macOS-app, CLI, webinterface, automatiseringen) verbinden met de
  Gateway via **WebSocket** op de geconfigureerde bind-host (standaard
  `127.0.0.1:18789`).
- **Nodes** (macOS/iOS/Android/headless) verbinden ook via **WebSocket**, maar
  declareren `role: node` met expliciete mogelijkheden/opdrachten.
- Eén Gateway per host; dit is de enige plek die een WhatsApp-sessie opent.
- De **canvas-host** wordt aangeboden door de HTTP-server van de Gateway onder:
  - `/__openclaw__/canvas/` (door agent bewerkbare HTML/CSS/JS)
  - `/__openclaw__/a2ui/` (A2UI-host)
    Deze gebruikt dezelfde poort als de Gateway (standaard `18789`).

## Componenten en stromen

### Gateway (daemon)

- Onderhoudt providerverbindingen.
- Biedt een getypeerde WS-API (verzoeken, antwoorden, server-pushgebeurtenissen).
- Valideert inkomende frames tegen JSON Schema.
- Verzendt gebeurtenissen zoals `agent`, `chat`, `presence`, `health`, `heartbeat`, `cron`.

### Clients (Mac-app / CLI / webbeheer)

- Eén WS-verbinding per client.
- Versturen verzoeken (`health`, `status`, `send`, `agent`, `system-presence`).
- Abonneren zich op gebeurtenissen (`tick`, `agent`, `presence`, `shutdown`).

### Nodes (macOS / iOS / Android / headless)

- Verbinden met dezelfde **WS-server** met `role: node`.
- Geven een apparaatidentiteit op in `connect`; koppeling is **apparaatgebaseerd** (rol `node`) en
  goedkeuring leeft in de opslag voor apparaatkoppelingen.
- Bieden opdrachten zoals `canvas.*`, `camera.*`, `screen.record`, `location.get`.

Protocoldetails:

- [Gateway-protocol](/nl/gateway/protocol)

### WebChat

- Statische interface die de Gateway-WS-API gebruikt voor chatgeschiedenis en verzenden.
- In externe opstellingen verbindt deze via dezelfde SSH-/Tailscale-tunnel als andere
  clients.

## Verbindingslevenscyclus (één client)

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

## Wireprotocol (samenvatting)

- Transport: WebSocket, tekstframes met JSON-payloads.
- Eerste frame **moet** `connect` zijn.
- Na handshake:
  - Verzoeken: `{type:"req", id, method, params}` → `{type:"res", id, ok, payload|error}`
  - Gebeurtenissen: `{type:"event", event, payload, seq?, stateVersion?}`
- `hello-ok.features.methods` / `events` zijn ontdekkingsmetadata, geen
  gegenereerde dump van elke aanroepbare hulproute.
- Authenticatie met gedeeld geheim gebruikt `connect.params.auth.token` of
  `connect.params.auth.password`, afhankelijk van de geconfigureerde Gateway-authenticatiemodus.
- Modi met identiteit, zoals Tailscale Serve
  (`gateway.auth.allowTailscale: true`) of niet-loopback
  `gateway.auth.mode: "trusted-proxy"` voldoen aan authenticatie via verzoekheaders
  in plaats van `connect.params.auth.*`.
- Privé-ingress `gateway.auth.mode: "none"` schakelt authenticatie met gedeeld geheim
  volledig uit; houd die modus uitgeschakeld voor publieke/onvertrouwde ingress.
- Idempotentiesleutels zijn vereist voor methoden met neveneffecten (`send`, `agent`) om
  veilig opnieuw te proberen; de server bewaart een kortlevende deduplicatiecache.
- Nodes moeten `role: "node"` plus mogelijkheden/opdrachten/rechten opnemen in `connect`.

## Koppeling + lokaal vertrouwen

- Alle WS-clients (operators + nodes) nemen een **apparaatidentiteit** op bij `connect`.
- Nieuwe apparaat-ID's vereisen koppelingsgoedkeuring; de Gateway geeft een **apparaat-token**
  uit voor latere verbindingen.
- Directe local loopback-verbindingen kunnen automatisch worden goedgekeurd om de gebruikerservaring op dezelfde host
  soepel te houden.
- OpenClaw heeft ook een smal backend-/containerlokaal zelfverbindingspad voor
  vertrouwde hulpstromen met gedeeld geheim.
- Tailnet- en LAN-verbindingen, inclusief tailnet-binds op dezelfde host, vereisen nog steeds
  expliciete koppelingsgoedkeuring.
- Alle verbindingen moeten de `connect.challenge`-nonce ondertekenen.
- Handtekeningpayload `v3` bindt ook `platform` + `deviceFamily`; de gateway
  pint gekoppelde metadata bij opnieuw verbinden en vereist herstelkoppeling voor metadatawijzigingen.
- **Niet-lokale** verbindingen vereisen nog steeds expliciete goedkeuring.
- Gateway-authenticatie (`gateway.auth.*`) geldt nog steeds voor **alle** verbindingen, lokaal of
  extern.

Details: [Gateway-protocol](/nl/gateway/protocol), [Koppeling](/nl/channels/pairing),
[Beveiliging](/nl/gateway/security).

## Protocoltypering en codegeneratie

- TypeBox-schema's definiëren het protocol.
- JSON Schema wordt uit die schema's gegenereerd.
- Swift-modellen worden gegenereerd uit het JSON Schema.

## Externe toegang

- Voorkeur: Tailscale of VPN.
- Alternatief: SSH-tunnel

  ```bash
  ssh -N -L 18789:127.0.0.1:18789 user@host
  ```

- Dezelfde handshake + authenticatietoken gelden via de tunnel.
- TLS + optionele pinning kunnen voor WS worden ingeschakeld in externe opstellingen.

## Operationele momentopname

- Start: `openclaw gateway` (voorgrond, logt naar stdout).
- Gezondheid: `health` via WS (ook opgenomen in `hello-ok`).
- Supervisie: launchd/systemd voor automatisch herstarten.

## Invarianten

- Exact één Gateway beheert één Baileys-sessie per host.
- Handshake is verplicht; elk niet-JSON of niet-connect eerste frame leidt tot een harde sluiting.
- Gebeurtenissen worden niet opnieuw afgespeeld; clients moeten vernieuwen bij hiaten.

## Gerelateerd

- [Agentlus](/nl/concepts/agent-loop) — gedetailleerde uitvoeringscyclus van de agent
- [Gateway-protocol](/nl/gateway/protocol) — WebSocket-protocolcontract
- [Wachtrij](/nl/concepts/queue) — opdrachtenwachtrij en gelijktijdigheid
- [Beveiliging](/nl/gateway/security) — vertrouwensmodel en hardening
