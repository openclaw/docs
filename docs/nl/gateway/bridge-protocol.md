---
read_when:
    - Node-clients bouwen of debuggen (iOS/Android/macOS-node-modus)
    - Onderzoeken van koppelings- of bridge-authenticatiefouten
    - Controle van het Node-oppervlak dat door de Gateway wordt blootgesteld
summary: 'Historisch brugprotocol (verouderde nodes): TCP JSONL, koppeling, RPC met beperkte scope'
title: Brugprotocol
x-i18n:
    generated_at: "2026-06-27T17:31:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 485d18f94b731018c6e0df493068b0b6aceff9afba6bebf1350db63c04cee98c
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
De TCP-bridge is **verwijderd**. Huidige OpenClaw-builds leveren de bridge-listener niet mee en `bridge.*`-configuratiesleutels staan niet meer in het schema. Deze pagina wordt alleen bewaard als historische referentie. Gebruik het [Gateway Protocol](/nl/gateway/protocol) voor alle Node-/operatorclients.
</Warning>

## Waarom het bestond

- **Beveiligingsgrens**: de bridge stelt een kleine toestemmingslijst beschikbaar in plaats van het
  volledige Gateway-API-oppervlak.
- **Koppeling + Node-identiteit**: Node-toelating is eigendom van de Gateway en gekoppeld
  aan een token per Node.
- **Ontdekkings-UX**: Nodes kunnen Gateways ontdekken via Bonjour op LAN, of rechtstreeks
  verbinding maken via een tailnet.
- **Loopback-WS**: het volledige WS-besturingsvlak blijft lokaal tenzij het via SSH wordt getunneld.

## Transport

- TCP, één JSON-object per regel (JSONL).
- Optionele TLS (wanneer `bridge.tls.enabled` waar is).
- De historische standaard luisterpoort was `18790` (huidige builds starten geen
  TCP-bridge).

Wanneer TLS is ingeschakeld, bevatten discovery-TXT-records `bridgeTls=1` plus
`bridgeTlsSha256` als niet-geheime hint. Let op dat Bonjour/mDNS-TXT-records
niet geauthenticeerd zijn; clients mogen de geadverteerde vingerafdruk niet als
gezaghebbende pin behandelen zonder expliciete gebruikersintentie of andere out-of-band verificatie.

## Handshake + koppeling

1. Client stuurt `hello` met Node-metadata + token (als al gekoppeld).
2. Als er geen koppeling is, antwoordt de Gateway met `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Client stuurt `pair-request`.
4. Gateway wacht op goedkeuring en stuurt daarna `pair-ok` en `hello-ok`.

Historisch gaf `hello-ok` `serverName` terug; gehoste Plugin-oppervlakken worden nu
geadverteerd via `pluginSurfaceUrls`. Canvas/A2UI gebruikt
`pluginSurfaceUrls.canvas`; de verouderde alias `canvasHostUrl` maakt geen deel uit van
het gerefactorde protocol.

## Frames

Client → Gateway:

- `req` / `res`: scoped Gateway-RPC (chat, sessies, configuratie, gezondheid, voicewake, skills.bins)
- `event`: Node-signalen (spraaktranscript, agentverzoek, chatabonnement, exec-levenscyclus)

Gateway → Client:

- `invoke` / `invoke-res`: Node-commando's (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: chatupdates voor geabonneerde sessies
- `ping` / `pong`: keepalive

Verouderde handhaving van de toestemmingslijst stond in `src/gateway/server-bridge.ts` (verwijderd).

## Exec-levenscyclusgebeurtenissen

Nodes kunnen `exec.finished`-gebeurtenissen uitzenden om voltooide `system.run`-activiteit zichtbaar te maken.
Deze worden in de Gateway naar systeemgebeurtenissen gemapt. (Verouderde Nodes kunnen nog steeds `exec.started` uitzenden.)
Nodes kunnen `exec.denied` uitzenden voor geweigerde `system.run`-pogingen; de Gateway accepteert
de gebeurtenis als een terminale weigering en plaatst geen systeemgebeurtenis in de wachtrij en wekt geen agentwerk.

Payloadvelden (allemaal optioneel tenzij vermeld):

- `sessionKey` (verplicht): agentsessie voor gebeurteniscorrelatie en, voor
  `exec.finished`, levering van systeemgebeurtenissen.
- `runId`: unieke exec-id voor groepering.
- `command`: ruwe of geformatteerde commandoreeks.
- `exitCode`, `timedOut`, `success`, `output`: voltooiingsdetails (alleen voltooid).
- `reason`: reden van weigering (alleen geweigerd).

## Historisch tailnet-gebruik

- Bind de bridge aan een tailnet-IP: `bridge.bind: "tailnet"` in
  `~/.openclaw/openclaw.json` (alleen historisch; `bridge.*` is niet langer geldig).
- Clients maken verbinding via MagicDNS-naam of tailnet-IP.
- Bonjour werkt **niet** tussen netwerken; gebruik indien nodig een handmatige host/poort of wide-area DNS-SD.

## Versiebeheer

De bridge was **impliciet v1** (geen min/max-onderhandeling). Deze sectie is
alleen historische referentie; huidige Node-/operatorclients gebruiken het WebSocket-
[Gateway Protocol](/nl/gateway/protocol).

## Gerelateerd

- [Gateway-protocol](/nl/gateway/protocol)
- [Nodes](/nl/nodes)
