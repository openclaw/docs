---
read_when:
    - Oude Node-clientcode of gearchiveerde koppelingslogboeken onderzoeken
    - Controleren wat het verouderde Node-oppervlak voorheen beschikbaar stelde
summary: 'Historisch bridgeprotocol (verouderde nodes): TCP JSONL, koppeling, bereikgebonden RPC'
title: Bridgeprotocol
x-i18n:
    generated_at: "2026-07-12T08:52:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e8b69c59f2170439f0e7b139bf5bbdb429d7c9d8dde7b36cd64aab63939c95d
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
De TCP-bridge is **verwijderd**. Huidige builds van OpenClaw bevatten de bridge-listener niet en de configuratiesleutels `bridge.*` maken niet langer deel uit van het schema. Deze pagina dient uitsluitend als historische referentie. Gebruik het [Gateway-protocol](/nl/gateway/protocol) voor alle Node-/operatorclients.
</Warning>

## Waarom deze bestond

- **Beveiligingsgrens**: stelde een kleine toestemmingslijst beschikbaar in plaats van het volledige API-oppervlak van de Gateway.
- **Koppeling + Node-identiteit**: de toelating van Nodes werd beheerd door de Gateway en was gekoppeld aan een token per Node.
- **Detectie-UX**: Nodes konden Gateways via Bonjour op het LAN detecteren of rechtstreeks via een tailnet verbinding maken.
- **Loopback-WS**: het volledige WS-besturingsvlak bleef lokaal, tenzij het via SSH werd getunneld.

## Transport

- TCP, één JSON-object per regel (JSONL).
- Optionele TLS (`bridge.tls.enabled: true`).
- De standaardpoort van de listener was `18790`.

Wanneer TLS was ingeschakeld, bevatten TXT-records voor detectie `bridgeTls=1` plus `bridgeTlsSha256` als niet-geheime aanwijzing. Bonjour-/mDNS-TXT-records zijn niet geauthenticeerd; clients konden de geadverteerde vingerafdruk zonder andere verificatie buiten het gebruikte kanaal niet als gezaghebbende pin beschouwen.

## Handshake en koppeling

1. De client verzendt `hello` met Node-metadata en een token (indien al gekoppeld).
2. Als de client niet gekoppeld is, antwoordt de Gateway met `error` (`NOT_PAIRED` / `UNAUTHORIZED`).
3. De client verzendt `pair-request`.
4. De Gateway wacht op goedkeuring en verzendt vervolgens `pair-ok` en `hello-ok`.

`hello-ok` retourneerde voorheen `serverName`; gehoste Plugin-oppervlakken worden nu via `pluginSurfaceUrls` in het huidige Gateway-protocol aangekondigd (Canvas/A2UI gebruikt `pluginSurfaceUrls.canvas`).

## Frames

Van client naar Gateway:

- `req` / `res`: afgebakende Gateway-RPC (chat, sessies, configuratie, status, spraakactivering, skills.bins).
- `event`: Node-signalen (spraaktranscript, agentverzoek, chatabonnement, exec-levenscyclus).

Van Gateway naar client:

- `invoke` / `invoke-res`: Node-opdrachten (`canvas.*`, `camera.*`, `screen.record`, `location.get`, `sms.send`).
- `event`: chatupdates voor sessies waarop is geabonneerd.
- `ping` / `pong`: verbinding actief houden.

De handhaving van de toestemmingslijst bevond zich in `src/gateway/server-bridge.ts` (verwijderd).

## Exec-levenscyclusgebeurtenissen

Nodes verzonden `exec.finished` om voltooide `system.run`-activiteit zichtbaar te maken; deze werd door de Gateway aan systeemgebeurtenissen gekoppeld (verouderde Nodes konden ook `exec.started` verzenden). `exec.denied` markeerde een geweigerde poging tot `system.run` als een definitieve weigering, zonder een systeemgebeurtenis in de wachtrij te plaatsen of agentwerk te activeren.

Payloadvelden (allemaal optioneel, tenzij anders vermeld):

| Veld                             | Opmerkingen                                                                                                                  |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `sessionKey`                     | Vereist. Agentsessie voor gebeurteniscorrelatie en, voor `exec.finished`, aflevering van systeemgebeurtenissen.              |
| `runId`                          | Unieke exec-id voor groepering.                                                                                              |
| `command`                        | Onbewerkte of opgemaakte opdrachttekst.                                                                                      |
| `exitCode`, `timedOut`, `output` | Voltooiingsgegevens (alleen bij voltooiing).                                                                                 |
| `reason`                         | Reden voor weigering (alleen bij weigering).                                                                                 |

## Historisch gebruik van tailnet

- Bind de bridge aan een tailnet-IP: `bridge.bind: "tailnet"` in `~/.openclaw/openclaw.json` (uitsluitend historisch; `bridge.*` is niet langer geldige configuratie).
- Clients maakten verbinding via een MagicDNS-naam of tailnet-IP.
- Bonjour werkt niet tussen netwerken; anders was breednetwerk-DNS-SD of een handmatig opgegeven host/poort vereist.

## Versiebeheer

De bridge was impliciet v1, zonder onderhandeling over minimum- en maximumversies. Huidige Node-/operatorclients gebruiken het WebSocket-[Gateway-protocol](/nl/gateway/protocol), dat wel een bereik van protocolversies onderhandelt.

## Gerelateerd

- [Gateway-protocol](/nl/gateway/protocol)
- [Nodes](/nl/nodes)
