---
read_when:
    - Node-clients bouwen of debuggen (iOS/Android/macOS Node-modus)
    - Koppelings- of bridge-authenticatiefouten onderzoeken
    - Audit van het Node-oppervlak dat door de Gateway wordt blootgesteld
summary: 'Historisch brugprotocol (verouderde knooppunten): TCP JSONL, koppeling, gescopeerde RPC'
title: Bridgeprotocol
x-i18n:
    generated_at: "2026-04-29T22:42:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb07ec4dab4394dd03b4c0002d6a842a9d77d12a1fc2f141f01d5a306fab1615
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
De TCP-bridge is **verwijderd**. Huidige OpenClaw-builds leveren de bridge-listener niet mee en `bridge.*`-configuratiesleutels staan niet meer in het schema. Deze pagina wordt alleen bewaard als historische referentie. Gebruik het [Gateway-protocol](/nl/gateway/protocol) voor alle Node/operator-clients.
</Warning>

## Waarom deze bestond

- **Beveiligingsgrens**: de bridge stelt een kleine allowlist beschikbaar in plaats van het
  volledige Gateway-API-oppervlak.
- **Koppeling + Node-identiteit**: Node-toelating is eigendom van de Gateway en gekoppeld
  aan een token per Node.
- **Discovery-UX**: Nodes kunnen Gateways ontdekken via Bonjour op LAN, of rechtstreeks
  verbinden via een tailnet.
- **Loopback-WS**: het volledige WS-besturingsvlak blijft lokaal tenzij het via SSH wordt getunneld.

## Transport

- TCP, één JSON-object per regel (JSONL).
- Optionele TLS (wanneer `bridge.tls.enabled` true is).
- De historische standaard luisterpoort was `18790` (huidige builds starten geen
  TCP-bridge).

Wanneer TLS is ingeschakeld, bevatten discovery-TXT-records `bridgeTls=1` plus
`bridgeTlsSha256` als niet-geheime hint. Houd er rekening mee dat Bonjour/mDNS-TXT-records
niet geauthenticeerd zijn; clients mogen de geadverteerde vingerafdruk niet behandelen als een
gezaghebbende pin zonder expliciete gebruikersintentie of andere verificatie buiten de band.

## Handshake + koppeling

1. Client stuurt `hello` met Node-metadata + token (als deze al gekoppeld is).
2. Als deze niet gekoppeld is, antwoordt de Gateway met `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Client stuurt `pair-request`.
4. Gateway wacht op goedkeuring en stuurt daarna `pair-ok` en `hello-ok`.

Historisch gaf `hello-ok` `serverName` terug en kon het
`canvasHostUrl` bevatten.

## Frames

Client → Gateway:

- `req` / `res`: scoped Gateway-RPC (chat, sessies, configuratie, gezondheid, voicewake, skills.bins)
- `event`: Node-signalen (spraaktranscript, agentverzoek, chatabonnement, exec-levenscyclus)

Gateway → Client:

- `invoke` / `invoke-res`: Node-commando's (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: chatupdates voor geabonneerde sessies
- `ping` / `pong`: keepalive

Legacy allowlist-handhaving stond in `src/gateway/server-bridge.ts` (verwijderd).

## Exec-levenscyclusgebeurtenissen

Nodes kunnen `exec.finished`- of `exec.denied`-gebeurtenissen uitzenden om system.run-activiteit zichtbaar te maken.
Deze worden in de Gateway gekoppeld aan systeemgebeurtenissen. (Legacy Nodes kunnen nog steeds `exec.started` uitzenden.)

Payloadvelden (allemaal optioneel tenzij vermeld):

- `sessionKey` (vereist): agentsessie die de systeemgebeurtenis moet ontvangen.
- `runId`: unieke exec-id voor groepering.
- `command`: onbewerkte of opgemaakte commandostring.
- `exitCode`, `timedOut`, `success`, `output`: voltooiingsdetails (alleen finished).
- `reason`: reden voor weigering (alleen denied).

## Historisch tailnet-gebruik

- Bind de bridge aan een tailnet-IP: `bridge.bind: "tailnet"` in
  `~/.openclaw/openclaw.json` (alleen historisch; `bridge.*` is niet meer geldig).
- Clients verbinden via MagicDNS-naam of tailnet-IP.
- Bonjour werkt **niet** over netwerken heen; gebruik handmatige host/poort of wide-area DNS‑SD
  wanneer nodig.

## Versiebeheer

De bridge was **impliciet v1** (geen min/max-onderhandeling). Deze sectie is
alleen historische referentie; huidige Node/operator-clients gebruiken het WebSocket-
[Gateway-protocol](/nl/gateway/protocol).

## Gerelateerd

- [Gateway-protocol](/nl/gateway/protocol)
- [Nodes](/nl/nodes)
