---
read_when:
    - Node-clients bouwen of debuggen (iOS/Android/macOS Node-modus)
    - Onderzoek naar fouten bij koppeling of bridge-authenticatie
    - Controle van het door de Gateway blootgestelde Node-oppervlak
summary: 'Historisch brugprotocol (verouderde nodes): TCP JSONL, koppeling, RPC met beperkte scope'
title: Brugprotocol
x-i18n:
    generated_at: "2026-05-06T17:55:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84c4b5c344d880d4283eebd8596e8b5b0aad5cae747694784011deb1547db30
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
De TCP-bridge is **verwijderd**. Huidige OpenClaw-builds leveren de bridge-listener niet mee en `bridge.*`-configuratiesleutels staan niet meer in het schema. Deze pagina wordt alleen bewaard als historische referentie. Gebruik het [Gateway-protocol](/nl/gateway/protocol) voor alle node-/operatorclients.
</Warning>

## Waarom het bestond

- **Beveiligingsgrens**: de bridge stelt een kleine allowlist bloot in plaats van het
  volledige Gateway-API-oppervlak.
- **Koppeling + node-identiteit**: node-toelating is eigendom van de Gateway en gekoppeld
  aan een token per node.
- **Ontdekkings-UX**: nodes kunnen gateways ontdekken via Bonjour op LAN, of rechtstreeks
  verbinding maken via een tailnet.
- **Loopback-WS**: het volledige WS-besturingsvlak blijft lokaal tenzij getunneld via SSH.

## Transport

- TCP, één JSON-object per regel (JSONL).
- Optionele TLS (wanneer `bridge.tls.enabled` waar is).
- De historische standaard luisterpoort was `18790` (huidige builds starten geen
  TCP-bridge).

Wanneer TLS is ingeschakeld, bevatten discovery-TXT-records `bridgeTls=1` plus
`bridgeTlsSha256` als niet-geheime hint. Merk op dat Bonjour/mDNS-TXT-records
niet geauthenticeerd zijn; clients mogen de geadverteerde fingerprint niet behandelen als een
autoritatieve pin zonder expliciete gebruikersintentie of andere out-of-band-verificatie.

## Handshake + koppeling

1. Client stuurt `hello` met node-metadata + token (als al gekoppeld).
2. Als er niet is gekoppeld, antwoordt de Gateway met `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Client stuurt `pair-request`.
4. Gateway wacht op goedkeuring en stuurt daarna `pair-ok` en `hello-ok`.

Historisch retourneerde `hello-ok` `serverName` en kon het
`canvasHostUrl` bevatten.

## Frames

Client → Gateway:

- `req` / `res`: gescopeerde Gateway-RPC (chat, sessions, config, health, voicewake, skills.bins)
- `event`: node-signalen (spraaktranscript, agentverzoek, chatabonnement, exec-levenscyclus)

Gateway → Client:

- `invoke` / `invoke-res`: node-opdrachten (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: chatupdates voor geabonneerde sessies
- `ping` / `pong`: keepalive

Legacy-allowlistafdwinging stond in `src/gateway/server-bridge.ts` (verwijderd).

## Exec-levenscyclusgebeurtenissen

Nodes kunnen `exec.finished`- of `exec.denied`-gebeurtenissen uitsturen om system.run-activiteit zichtbaar te maken.
Deze worden toegewezen aan systeemgebeurtenissen in de Gateway. (Legacy-nodes kunnen nog steeds `exec.started` uitsturen.)

Payloadvelden (allemaal optioneel tenzij vermeld):

- `sessionKey` (verplicht): agentsessie die de systeemgebeurtenis ontvangt.
- `runId`: unieke exec-id voor groepering.
- `command`: ruwe of geformatteerde opdrachtstring.
- `exitCode`, `timedOut`, `success`, `output`: voltooiingsdetails (alleen finished).
- `reason`: reden voor weigering (alleen denied).

## Historisch tailnet-gebruik

- Bind de bridge aan een tailnet-IP: `bridge.bind: "tailnet"` in
  `~/.openclaw/openclaw.json` (alleen historisch; `bridge.*` is niet meer geldig).
- Clients maken verbinding via MagicDNS-naam of tailnet-IP.
- Bonjour werkt **niet** over netwerken heen; gebruik handmatige host/poort of wide-area DNS-SD
  wanneer nodig.

## Versiebeheer

De bridge was **impliciet v1** (geen min/max-onderhandeling). Deze sectie is
alleen historische referentie; huidige node-/operatorclients gebruiken het WebSocket-
[Gateway-protocol](/nl/gateway/protocol).

## Gerelateerd

- [Gateway-protocol](/nl/gateway/protocol)
- [Nodes](/nl/nodes)
