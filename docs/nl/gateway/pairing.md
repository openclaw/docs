---
read_when:
    - Node-koppelingsgoedkeuringen implementeren zonder macOS-UI
    - CLI-flows toevoegen voor het goedkeuren van externe nodes
    - Gateway-protocol uitbreiden met Node-beheer
summary: Door de Gateway beheerde nodekoppeling (Optie B) voor iOS en andere externe nodes
title: Door Gateway beheerde koppeling
x-i18n:
    generated_at: "2026-05-06T09:15:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75713e04e37dcbae151d170e2eb459d0e9b9a799c64a10db731b61d7b53998b4
    source_path: gateway/pairing.md
    workflow: 16
---

Bij door Gateway beheerde koppeling is de **Gateway** de bron van waarheid voor welke nodes
mogen deelnemen. UI’s (macOS-app, toekomstige clients) zijn alleen frontends die
openstaande aanvragen goedkeuren of afwijzen.

**Belangrijk:** WS-nodes gebruiken **apparaatkoppeling** (rol `node`) tijdens `connect`.
`node.pair.*` is een aparte koppelingsopslag en blokkeert de WS-handshake **niet**.
Alleen clients die expliciet `node.pair.*` aanroepen, gebruiken deze flow.

## Concepten

- **Openstaande aanvraag**: een node heeft gevraagd om deel te nemen; vereist goedkeuring.
- **Gepaarde node**: goedgekeurde node met een uitgegeven auth-token.
- **Transport**: het Gateway WS-eindpunt stuurt aanvragen door, maar beslist niet over
  lidmaatschap. (Ondersteuning voor de legacy TCP-bridge is verwijderd.)

## Hoe koppeling werkt

1. Een node verbindt met de Gateway WS en vraagt koppeling aan.
2. De Gateway slaat een **openstaande aanvraag** op en emitteert `node.pair.requested`.
3. Je keurt de aanvraag goed of wijst deze af (CLI of UI).
4. Bij goedkeuring geeft de Gateway een **nieuw token** uit (tokens worden geroteerd bij opnieuw koppelen).
5. De node verbindt opnieuw met het token en is nu "gekoppeld".

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

- `node.pair.requested` - wordt geëmitteerd wanneer een nieuwe openstaande aanvraag wordt gemaakt.
- `node.pair.resolved` - wordt geëmitteerd wanneer een aanvraag is goedgekeurd/afgewezen/verlopen.

Methoden:

- `node.pair.request` - maak een openstaande aanvraag of hergebruik deze.
- `node.pair.list` - toon openstaande + gekoppelde nodes (`operator.pairing`).
- `node.pair.approve` - keur een openstaande aanvraag goed (geeft token uit).
- `node.pair.reject` - wijs een openstaande aanvraag af.
- `node.pair.remove` - verwijder een verouderde gekoppelde node-entry.
- `node.pair.verify` - verifieer `{ nodeId, token }`.

Opmerkingen:

- `node.pair.request` is idempotent per node: herhaalde aanroepen retourneren dezelfde
  openstaande aanvraag.
- Herhaalde aanvragen voor dezelfde openstaande node vernieuwen ook de opgeslagen node-
  metadata en de meest recente allowlist-snapshot van gedeclareerde commando’s voor zichtbaarheid voor operators.
- Goedkeuring genereert **altijd** een vers token; er wordt nooit een token geretourneerd vanuit
  `node.pair.request`.
- Operator-scope-niveaus en controles tijdens goedkeuring worden samengevat in
  [Operator-scopes](/nl/gateway/operator-scopes).
- Aanvragen kunnen `silent: true` bevatten als hint voor flows met automatische goedkeuring.
- `node.pair.approve` gebruikt de gedeclareerde commando’s van de openstaande aanvraag om
  extra goedkeuringsscopes af te dwingen:
  - aanvraag zonder commando’s: `operator.pairing`
  - aanvraag met niet-exec-commando: `operator.pairing` + `operator.write`
  - aanvraag voor `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Node-koppeling is een vertrouwens- en identiteitsflow plus tokenuitgifte. Het pint **niet** het live node-commando-oppervlak per node vast.

- Live node-commando’s komen voort uit wat de node declareert bij verbinden nadat het globale node-commandobeleid van de gateway (`gateway.nodes.allowCommands` en `denyCommands`) is toegepast.
- Per-node `system.run`-allow- en vraagbeleid staat op de node in `exec.approvals.node.*`, niet in de koppelingsrecord.

</Warning>

## Node-commandogating (2026.3.31+)

<Warning>
**Breaking change:** Vanaf `2026.3.31` zijn node-commando’s uitgeschakeld totdat node-koppeling is goedgekeurd. Alleen apparaatkoppeling is niet langer genoeg om gedeclareerde node-commando’s beschikbaar te maken.
</Warning>

Wanneer een node voor het eerst verbindt, wordt koppeling automatisch aangevraagd. Totdat de koppelingsaanvraag is goedgekeurd, worden alle openstaande node-commando’s van die node gefilterd en worden ze niet uitgevoerd. Zodra vertrouwen is vastgesteld via koppelingsgoedkeuring, worden de gedeclareerde commando’s van de node beschikbaar, onder voorbehoud van het normale commandobeleid.

Dit betekent:

- Nodes die eerder alleen op apparaatkoppeling vertrouwden om commando’s beschikbaar te maken, moeten nu node-koppeling voltooien.
- Commando’s die vóór koppelingsgoedkeuring in de wachtrij zijn geplaatst, worden verwijderd, niet uitgesteld.

## Vertrouwensgrenzen voor node-events (2026.3.31+)

<Warning>
**Breaking change:** Runs die door nodes worden gestart, blijven nu op een beperkt vertrouwd oppervlak.
</Warning>

Door nodes gestarte samenvattingen en gerelateerde sessie-events zijn beperkt tot het bedoelde vertrouwde oppervlak. Door meldingen aangestuurde of door nodes getriggerde flows die eerder vertrouwden op bredere toegang tot host- of sessietools moeten mogelijk worden aangepast. Deze verharding zorgt ervoor dat node-events niet kunnen escaleren naar hostniveau-tooltoegang buiten wat de vertrouwensgrens van de node toestaat.

Duurzame updates van node-aanwezigheid volgen dezelfde identiteitsgrens. Het event `node.presence.alive` wordt
alleen geaccepteerd vanuit geauthenticeerde node-apparaatsessies en werkt koppelingsmetadata alleen bij wanneer de
apparaat-/node-identiteit al gekoppeld is. Zelf gedeclareerde `client.id`-waarden zijn niet genoeg om
last-seen-status te schrijven.

## Automatische goedkeuring (macOS-app)

De macOS-app kan optioneel een **stille goedkeuring** proberen wanneer:

- de aanvraag is gemarkeerd als `silent`, en
- de app een SSH-verbinding met de gatewayhost kan verifiëren met dezelfde gebruiker.

Als stille goedkeuring mislukt, valt de app terug op de normale prompt "Goedkeuren/Afwijzen".

## Automatische goedkeuring van apparaten via vertrouwde CIDR’s

WS-apparaatkoppeling voor `role: node` blijft standaard handmatig. Voor private
node-netwerken waar de Gateway het netwerkpad al vertrouwt, kunnen operators
zich aanmelden met expliciete CIDR’s of exacte IP’s:

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
- Er bestaat geen algemene automatische goedkeuringsmodus voor LAN of privénetwerken.
- Alleen nieuwe `role: node`-apparaatkoppeling zonder aangevraagde scopes komt in aanmerking.
- Operator-, browser-, Control UI- en WebChat-clients blijven handmatig.
- Upgrades van rol, scope, metadata en publieke sleutel blijven handmatig.
- Vertrouwde-proxy-headerpaden via same-host loopback komen niet in aanmerking, omdat dat
  pad kan worden gespooft door lokale aanroepers.

## Automatische goedkeuring van metadata-upgrades

Wanneer een al gekoppeld apparaat opnieuw verbindt met alleen niet-gevoelige metadata-
wijzigingen (bijvoorbeeld weergavenaam of hints voor clientplatform), behandelt OpenClaw
dat als een `metadata-upgrade`. Stille automatische goedkeuring is smal: deze geldt alleen
voor vertrouwde lokale niet-browserreconnects die al bezit van lokale
of gedeelde referenties hebben bewezen, inclusief same-host native-app-reconnects na wijzigingen in
OS-versiemetadata. Browser-/Control UI-clients en remote clients gebruiken nog steeds
de expliciete hergoedkeuringsflow. Scope-upgrades (lezen naar schrijven/admin) en
wijzigingen in publieke sleutels komen **niet** in aanmerking voor automatische goedkeuring van metadata-upgrades -
ze blijven expliciete hergoedkeuringsaanvragen.

## QR-koppelingshelpers

`/pair qr` rendert de koppelingspayload als gestructureerde media, zodat mobiele en
browserclients deze direct kunnen scannen.

Het verwijderen van een apparaat ruimt ook alle verouderde openstaande koppelingsaanvragen voor dat
apparaat-id op, zodat `nodes pending` na een intrekking geen verweesde rijen toont.

## Localiteit en forwarded headers

Gateway-koppeling behandelt een verbinding alleen als loopback wanneer zowel de ruwe socket
als eventuele upstream-proxybewijzen overeenkomen. Als een aanvraag binnenkomt via loopback maar
`X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`-headers bevat
die naar een niet-lokale oorsprong wijzen, diskwalificeert dat forwarded-header-bewijs
de claim van loopback-localiteit. Het koppelingspad vereist dan expliciete goedkeuring
in plaats van de aanvraag stilzwijgend als een same-host-verbinding te behandelen. Zie
[Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth) voor de equivalente regel voor
operator-auth.

## Opslag (lokaal, privé)

Koppelingsstatus wordt opgeslagen onder de Gateway-statusmap (standaard `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Als je `OPENCLAW_STATE_DIR` overschrijft, verhuist de map `nodes/` mee.

Beveiligingsopmerkingen:

- Tokens zijn geheimen; behandel `paired.json` als gevoelig.
- Het roteren van een token vereist hergoedkeuring (of het verwijderen van de node-entry).

## Transportgedrag

- Het transport is **stateless**; het slaat geen lidmaatschap op.
- Als de Gateway offline is of koppeling is uitgeschakeld, kunnen nodes niet koppelen.
- Als de Gateway in remote-modus staat, gebeurt koppeling nog steeds tegen de store van de remote Gateway.

## Gerelateerd

- [Kanaalkoppeling](/nl/channels/pairing)
- [Nodes](/nl/nodes)
- [Apparaten-CLI](/nl/cli/devices)
