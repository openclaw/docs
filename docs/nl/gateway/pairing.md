---
read_when:
    - Node-koppelingsgoedkeuringen implementeren zonder macOS-gebruikersinterface
    - CLI-flows toevoegen voor het goedkeuren van externe nodes
    - Gateway-protocol uitbreiden met Node-beheer
summary: Door Gateway beheerde node-koppeling (Optie B) voor iOS en andere externe nodes
title: Door Gateway beheerde koppeling
x-i18n:
    generated_at: "2026-05-03T11:10:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0ce46d487990860ac572c27cc9dd83839e87329132e2624944660bafaf723de
    source_path: gateway/pairing.md
    workflow: 16
---

Bij door de Gateway beheerde koppeling is de **Gateway** de bron van waarheid voor welke nodes
mogen deelnemen. UI's (macOS-app, toekomstige clients) zijn alleen frontends die
openstaande aanvragen goedkeuren of weigeren.

**Belangrijk:** WS-nodes gebruiken **apparaatkoppeling** (rol `node`) tijdens `connect`.
`node.pair.*` is een aparte koppelingsopslag en blokkeert de WS-handshake **niet**.
Alleen clients die expliciet `node.pair.*` aanroepen gebruiken deze flow.

## Concepten

- **Openstaande aanvraag**: een node heeft gevraagd om deel te nemen; vereist goedkeuring.
- **Gekoppelde node**: goedgekeurde node met een uitgegeven auth-token.
- **Transport**: het Gateway WS-eindpunt stuurt aanvragen door, maar beslist niet over
  lidmaatschap. (Ondersteuning voor de legacy TCP-bridge is verwijderd.)

## Hoe koppeling werkt

1. Een node maakt verbinding met de Gateway WS en vraagt koppeling aan.
2. De Gateway slaat een **openstaande aanvraag** op en emitteert `node.pair.requested`.
3. Je keurt de aanvraag goed of wijst deze af (CLI of UI).
4. Bij goedkeuring geeft de Gateway een **nieuw token** uit (tokens worden geroteerd bij opnieuw koppelen).
5. De node maakt opnieuw verbinding met het token en is nu “gekoppeld”.

Openstaande aanvragen verlopen automatisch na **5 minuten**.

## CLI-workflow (geschikt voor headless gebruik)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` toont gekoppelde/verbonden nodes en hun mogelijkheden.

## API-oppervlak (gatewayprotocol)

Events:

- `node.pair.requested` — geëmiteerd wanneer een nieuwe openstaande aanvraag wordt gemaakt.
- `node.pair.resolved` — geëmiteerd wanneer een aanvraag is goedgekeurd/geweigerd/verlopen.

Methoden:

- `node.pair.request` — maak een openstaande aanvraag of hergebruik deze.
- `node.pair.list` — lijst openstaande + gekoppelde nodes (`operator.pairing`).
- `node.pair.approve` — keur een openstaande aanvraag goed (geeft token uit).
- `node.pair.reject` — wijs een openstaande aanvraag af.
- `node.pair.remove` — verwijder een verouderde gekoppelde node-vermelding.
- `node.pair.verify` — verifieer `{ nodeId, token }`.

Opmerkingen:

- `node.pair.request` is idempotent per node: herhaalde aanroepen retourneren dezelfde
  openstaande aanvraag.
- Herhaalde aanvragen voor dezelfde openstaande node vernieuwen ook de opgeslagen node-
  metadata en de nieuwste allowlisted snapshot van gedeclareerde commando's voor operatorzichtbaarheid.
- Goedkeuring genereert **altijd** een nieuw token; er wordt nooit een token geretourneerd door
  `node.pair.request`.
- Operator-scopelevels en controles tijdens goedkeuring worden samengevat in
  [Operator-scopes](/nl/gateway/operator-scopes).
- Aanvragen kunnen `silent: true` bevatten als hint voor flows voor automatische goedkeuring.
- `node.pair.approve` gebruikt de gedeclareerde commando's van de openstaande aanvraag om
  extra goedkeuringsscopes af te dwingen:
  - aanvraag zonder commando's: `operator.pairing`
  - aanvraag voor non-exec-commando: `operator.pairing` + `operator.write`
  - aanvraag voor `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Node-koppeling is een vertrouwens- en identiteitsflow plus tokenuitgifte. Het pint **niet** het live node-commando-oppervlak per node vast.

- Live node-commando's komen voort uit wat de node declareert bij verbinding nadat het globale node-commandobeleid van de gateway (`gateway.nodes.allowCommands` en `denyCommands`) is toegepast.
- Per-node `system.run` allow- en ask-beleid staat op de node in `exec.approvals.node.*`, niet in het koppelingsrecord.

</Warning>

## Node-commandogating (2026.3.31+)

<Warning>
**Breaking change:** Vanaf `2026.3.31` zijn node-commando's uitgeschakeld totdat node-koppeling is goedgekeurd. Alleen apparaatkoppeling is niet langer genoeg om gedeclareerde node-commando's beschikbaar te maken.
</Warning>

Wanneer een node voor het eerst verbinding maakt, wordt koppeling automatisch aangevraagd. Totdat de koppelingsaanvraag is goedgekeurd, worden alle openstaande node-commando's van die node gefilterd en niet uitgevoerd. Zodra vertrouwen is vastgesteld via koppelingsgoedkeuring, worden de gedeclareerde commando's van de node beschikbaar, onderhevig aan het normale commandobeleid.

Dit betekent:

- Nodes die eerder alleen op apparaatkoppeling vertrouwden om commando's beschikbaar te maken, moeten nu node-koppeling voltooien.
- Commando's die vóór goedkeuring van de koppeling in de wachtrij zijn gezet, worden verwijderd, niet uitgesteld.

## Vertrouwensgrenzen voor node-events (2026.3.31+)

<Warning>
**Breaking change:** Door nodes gestarte runs blijven nu op een verkleind vertrouwd oppervlak.
</Warning>

Door nodes gestarte samenvattingen en gerelateerde sessie-events zijn beperkt tot het bedoelde vertrouwde oppervlak. Door notificaties aangestuurde of door nodes getriggerde flows die eerder vertrouwden op bredere host- of sessietooltoegang moeten mogelijk worden aangepast. Deze hardening zorgt ervoor dat node-events niet kunnen escaleren naar tooltoegang op hostniveau buiten wat de vertrouwensgrens van de node toestaat.

Duurzame updates van node-aanwezigheid volgen dezelfde identiteitsgrens. Het event `node.presence.alive` wordt
alleen geaccepteerd van geauthenticeerde node-apparaatsessies en werkt koppelingsmetadata alleen bij wanneer de
apparaat-/node-identiteit al is gekoppeld. Zelf gedeclareerde `client.id`-waarden zijn niet genoeg om
last-seen-status te schrijven.

## Automatische goedkeuring (macOS-app)

De macOS-app kan optioneel een **stille goedkeuring** proberen wanneer:

- de aanvraag is gemarkeerd als `silent`, en
- de app een SSH-verbinding naar de gatewayhost kan verifiëren met dezelfde gebruiker.

Als stille goedkeuring mislukt, valt deze terug op de normale prompt “Goedkeuren/Weigeren”.

## Automatische goedkeuring van Trusted-CIDR-apparaten

WS-apparaatkoppeling voor `role: node` blijft standaard handmatig. Voor private
node-netwerken waar de Gateway het netwerkpad al vertrouwt, kunnen operators
zich expliciet aanmelden met CIDR's of exacte IP's:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Beveiligingsgrens:

- Uitgeschakeld wanneer `gateway.nodes.pairing.autoApproveCidrs` niet is ingesteld.
- Er bestaat geen algemene modus voor automatische goedkeuring voor LAN of private netwerken.
- Alleen nieuwe `role: node`-apparaatkoppeling zonder aangevraagde scopes komt in aanmerking.
- Operator-, browser-, Control UI- en WebChat-clients blijven handmatig.
- Upgrades van rol, scope, metadata en publieke sleutel blijven handmatig.
- Trusted-proxy-headerpaden via loopback op dezelfde host komen niet in aanmerking omdat dat
  pad door lokale aanroepers kan worden gespooft.

## Automatische goedkeuring van metadata-upgrades

Wanneer een al gekoppeld apparaat opnieuw verbinding maakt met alleen niet-gevoelige metadata-
wijzigingen (bijvoorbeeld weergavenaam of hints over het clientplatform), behandelt OpenClaw
dat als een `metadata-upgrade`. Stille automatische goedkeuring is smal: deze geldt alleen
voor vertrouwde lokale reconnects van niet-browsers die al bezit van lokale
of gedeelde inloggegevens hebben bewezen, inclusief reconnects van native apps op dezelfde host na wijzigingen in
OS-versiemetadata. Browser-/Control UI-clients en externe clients gebruiken nog steeds
de expliciete flow voor hergoedkeuring. Scope-upgrades (read naar write/admin) en
wijzigingen van publieke sleutels komen **niet** in aanmerking voor automatische goedkeuring van metadata-upgrades —
ze blijven expliciete aanvragen voor hergoedkeuring.

## QR-koppelingshelpers

`/pair qr` rendert de koppelingspayload als gestructureerde media zodat mobiele en
browserclients deze direct kunnen scannen.

Het verwijderen van een apparaat ruimt ook eventuele verouderde openstaande koppelingsaanvragen voor dat
apparaat-id op, zodat `nodes pending` na een intrekking geen verweesde rijen toont.

## Locality en doorgestuurde headers

Gateway-koppeling behandelt een verbinding alleen als loopback wanneer zowel de ruwe socket
als eventueel bewijs van een upstreamproxy overeenkomen. Als een aanvraag via loopback binnenkomt maar
`X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`-headers bevat
die naar een niet-lokale oorsprong wijzen, maakt dat bewijs van doorgestuurde headers
de loopback-locality-claim ongeldig. Het koppelingspad vereist dan expliciete goedkeuring
in plaats van de aanvraag stilzwijgend te behandelen als een verbinding vanaf dezelfde host. Zie
[Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth) voor de equivalente regel voor
operatorauthenticatie.

## Opslag (lokaal, privé)

Koppelingsstatus wordt opgeslagen onder de Gateway-statusmap (standaard `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Als je `OPENCLAW_STATE_DIR` overschrijft, verhuist de map `nodes/` mee.

Beveiligingsopmerkingen:

- Tokens zijn geheimen; behandel `paired.json` als gevoelig.
- Het roteren van een token vereist hergoedkeuring (of het verwijderen van de node-vermelding).

## Transportgedrag

- Het transport is **stateless**; het slaat geen lidmaatschap op.
- Als de Gateway offline is of koppeling is uitgeschakeld, kunnen nodes niet koppelen.
- Als de Gateway in externe modus staat, gebeurt koppeling nog steeds tegen de opslag van de externe Gateway.

## Gerelateerd

- [Kanaalkoppeling](/nl/channels/pairing)
- [Nodes](/nl/nodes)
- [Apparaten-CLI](/nl/cli/devices)
