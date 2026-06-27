---
read_when:
    - Implementatie van goedkeuringen voor Node-koppeling zonder macOS-gebruikersinterface
    - CLI-flows toevoegen voor het goedkeuren van externe nodes
    - Gateway-protocol uitbreiden met nodebeheer
summary: Gateway-beheerde node-koppeling (Optie B) voor iOS en andere externe nodes
title: Door Gateway beheerde koppeling
x-i18n:
    generated_at: "2026-06-27T17:36:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aefddafaef419fc59b04ee17dae8ef21685b4f514f4286530bf07362663a8996
    source_path: gateway/pairing.md
    workflow: 16
---

Bij door Gateway beheerde koppeling is de **Gateway** de bron van waarheid voor welke nodes
mogen deelnemen. UI's (macOS-app, toekomstige clients) zijn alleen frontends die
wachtende verzoeken goedkeuren of afwijzen.

**Belangrijk:** WS-nodes gebruiken **apparaatkoppeling** (rol `node`) tijdens `connect`.
`node.pair.*` is een aparte koppelingsopslag en blokkeert de WS-handshake **niet**.
Alleen clients die expliciet `node.pair.*` aanroepen gebruiken deze flow.

## Concepten

- **Wachtend verzoek**: een node vroeg om deel te nemen; vereist goedkeuring.
- **Gekoppelde node**: goedgekeurde node met een uitgegeven auth-token.
- **Transport**: het Gateway-WS-eindpunt stuurt verzoeken door, maar beslist niet
  over lidmaatschap. (Ondersteuning voor de legacy TCP-bridge is verwijderd.)

## Hoe koppeling werkt

1. Een node maakt verbinding met de Gateway-WS en vraagt koppeling aan.
2. De Gateway slaat een **wachtend verzoek** op en emitteert `node.pair.requested`.
3. Je keurt het verzoek goed of wijst het af (CLI of UI).
4. Bij goedkeuring geeft de Gateway een **nieuw token** uit (tokens worden geroteerd bij opnieuw koppelen).
5. De node maakt opnieuw verbinding met het token en is nu "paired".

Wachtende verzoeken verlopen automatisch na **5 minuten**.

## CLI-workflow (geschikt voor headless gebruik)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` toont gekoppelde/verbonden nodes en hun capabilities.

## API-oppervlak (gatewayprotocol)

Events:

- `node.pair.requested` - geëmiteerd wanneer een nieuw wachtend verzoek wordt aangemaakt.
- `node.pair.resolved` - geëmiteerd wanneer een verzoek wordt goedgekeurd/afgewezen/verlopen.

Methoden:

- `node.pair.request` - maak een wachtend verzoek aan of hergebruik het.
- `node.pair.list` - lijst wachtende + gekoppelde nodes op (`operator.pairing`).
- `node.pair.approve` - keur een wachtend verzoek goed (geeft token uit).
- `node.pair.reject` - wijs een wachtend verzoek af.
- `node.pair.remove` - verwijder een gekoppelde node. Voor apparaatondersteunde koppelingen
  trekt dit de `node`-rol van het apparaat in: het muteert `devices/paired.json` en
  maakt node-rolsessies van dat apparaat ongeldig/verbreekt ze. Een **gemengde-rollen**
  apparaat (bijvoorbeeld als het ook `operator` heeft) behoudt zijn rij en verliest alleen de `node`
  rol; een apparaatrij met alleen node wordt verwijderd. Het verwijdert ook elke overeenkomende legacy
  door gateway beheerde node-koppelingsvermelding. Authz: `operator.pairing` mag
  niet-operator-node-rijen verwijderen; een apparaat-token-aanroeper die zijn **eigen** node-rol op
  een gemengde-rollen apparaat intrekt heeft daarnaast `operator.admin` nodig.
- `node.pair.verify` - verifieer `{ nodeId, token }`.

Notities:

- `node.pair.request` is idempotent per node: herhaalde aanroepen retourneren hetzelfde
  wachtende verzoek.
- Herhaalde verzoeken voor dezelfde wachtende node verversen ook de opgeslagen node
  metadata en de nieuwste allowlisted declaratieve opdracht-snapshot voor zichtbaarheid voor de operator.
- Goedkeuring genereert **altijd** een vers token; er wordt nooit een token geretourneerd door
  `node.pair.request`.
- Operator-scope-niveaus en controles tijdens goedkeuring worden samengevat in
  [Operator-scopes](/nl/gateway/operator-scopes).
- Verzoeken kunnen `silent: true` bevatten als hint voor automatische-goedkeuringsflows.
- `node.pair.approve` gebruikt de gedeclareerde opdrachten van het wachtende verzoek om
  extra goedkeuringsscopes af te dwingen:
  - verzoek zonder opdracht: `operator.pairing`
  - verzoek met niet-exec-opdracht: `operator.pairing` + `operator.write`
  - verzoek voor `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Node-koppeling is een vertrouwens- en identiteitsflow plus tokenuitgifte. Het pint het live node-opdrachtoppervlak per node **niet** vast.

- Live node-opdrachten komen voort uit wat de node declareert bij verbinding nadat het globale node-opdrachtbeleid van de gateway (`gateway.nodes.allowCommands` en `denyCommands`) is toegepast.
- Per-node `system.run` toestaan- en vraagbeleid leeft op de node in `exec.approvals.node.*`, niet in de koppelingsrecord.

</Warning>

## Node-opdrachtbeperking (2026.3.31+)

<Warning>
**Incompatibele wijziging:** Vanaf `2026.3.31` zijn node-opdrachten uitgeschakeld totdat node-koppeling is goedgekeurd. Alleen apparaatkoppeling is niet langer genoeg om gedeclareerde node-opdrachten bloot te stellen.
</Warning>

Wanneer een node voor het eerst verbinding maakt, wordt koppeling automatisch aangevraagd. Totdat het koppelingsverzoek is goedgekeurd, worden alle wachtende node-opdrachten van die node gefilterd en niet uitgevoerd. Zodra vertrouwen is vastgesteld via koppelingsgoedkeuring, worden de gedeclareerde opdrachten van de node beschikbaar, onderworpen aan het normale opdrachtbeleid.

Dit betekent:

- Nodes die eerder alleen op apparaatkoppeling vertrouwden om opdrachten bloot te stellen, moeten nu node-koppeling voltooien.
- Opdrachten die vóór koppelingsgoedkeuring in de wachtrij stonden, worden gedropt, niet uitgesteld.

## Vertrouwensgrenzen voor node-events (2026.3.31+)

<Warning>
**Incompatibele wijziging:** Door nodes gestarte runs blijven nu op een verkleind vertrouwd oppervlak.
</Warning>

Door nodes gestarte samenvattingen en gerelateerde sessie-events zijn beperkt tot het beoogde vertrouwde oppervlak. Door notificaties gedreven of door nodes getriggerde flows die eerder op bredere host- of sessietooltoegang vertrouwden, moeten mogelijk worden aangepast. Deze verharding zorgt ervoor dat node-events niet kunnen escaleren naar hostniveau-tooltoegang buiten wat de vertrouwensgrens van de node toestaat.

Duurzame updates van node-aanwezigheid volgen dezelfde identiteitsgrens. Het `node.presence.alive`-event wordt
alleen geaccepteerd van geauthenticeerde node-apparaatsessies en werkt koppelingsmetadata alleen bij wanneer de
apparaat-/node-identiteit al gekoppeld is. Zelfgedeclareerde `client.id`-waarden zijn niet genoeg om
laatst-gezien-status te schrijven.

## Automatische goedkeuring (macOS-app)

De macOS-app kan optioneel proberen een **stille goedkeuring** uit te voeren wanneer:

- het verzoek is gemarkeerd als `silent`, en
- de app een SSH-verbinding met de gatewayhost kan verifiëren met dezelfde gebruiker.

Als stille goedkeuring mislukt, valt de app terug op de normale prompt "Approve/Reject".

## Automatische goedkeuring voor vertrouwde CIDR-apparaten

WS-apparaatkoppeling voor `role: node` blijft standaard handmatig. Voor private
nodenetwerken waarbij de Gateway het netwerkpad al vertrouwt, kunnen operators
zich aanmelden met expliciete CIDR's of exacte IP's:

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
- Er bestaat geen algemene LAN- of privatenetwerkmodus voor automatische goedkeuring.
- Alleen verse `role: node`-apparaatkoppeling zonder gevraagde scopes komt in aanmerking.
- Operator-, browser-, Control UI- en WebChat-clients blijven handmatig.
- Rol-, scope-, metadata- en publieke-sleutel-upgrades blijven handmatig.
- Same-host loopback trusted-proxy-headerpaden komen niet in aanmerking omdat dat
  pad kan worden gespooft door lokale aanroepers.

## Automatische goedkeuring voor metadata-upgrade

Wanneer een al gekoppeld apparaat opnieuw verbinding maakt met alleen niet-gevoelige metadata
wijzigingen (bijvoorbeeld weergavenaam of hints voor clientplatform), behandelt OpenClaw
dat als een `metadata-upgrade`. Stille automatische goedkeuring is smal: deze geldt alleen
voor vertrouwde niet-browser lokale herverbindingen die al bezit van lokale
of gedeelde referenties hebben bewezen, inclusief same-host native app-herverbindingen na OS
versie-metadatawijzigingen. Browser-/Control UI-clients en externe clients gebruiken nog steeds
de expliciete hergoedkeuringsflow. Scope-upgrades (lezen naar schrijven/admin) en
publieke-sleutelwijzigingen komen **niet** in aanmerking voor automatische goedkeuring van metadata-upgrades -
ze blijven expliciete hergoedkeuringsverzoeken.

## QR-koppelingshelpers

`/pair qr` rendert de koppelingspayload als gestructureerde media zodat mobiele en
browserclients deze direct kunnen scannen.

Het verwijderen van een apparaat ruimt ook alle verouderde wachtende koppelingsverzoeken voor dat
apparaat-id op, zodat `nodes pending` na een intrekking geen verweesde rijen toont.

## Localiteit en doorgestuurde headers

Gateway-koppeling behandelt een verbinding alleen als loopback wanneer zowel de ruwe socket
als eventueel upstream-proxybewijs overeenkomen. Als een verzoek op loopback binnenkomt maar
`Forwarded`, een `X-Forwarded-*`- of `X-Real-IP`-headerbewijs bevat, diskwalificeert dat
doorgestuurde-headerbewijs de loopback-localiteitsclaim. Het koppelingspad
vereist dan expliciete goedkeuring in plaats van het verzoek stilzwijgend als een
same-host-verbinding te behandelen. Zie [Vertrouwde-proxy-auth](/nl/gateway/trusted-proxy-auth) voor
de equivalente regel voor operator-auth.

## Opslag (lokaal, privé)

Koppelingsstatus wordt opgeslagen onder de Gateway-statusdirectory (standaard `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Als je `OPENCLAW_STATE_DIR` overschrijft, verhuist de map `nodes/` mee.

Beveiligingsnotities:

- Tokens zijn geheimen; behandel `paired.json` als gevoelig.
- Rotatie van een token vereist hergoedkeuring (of verwijdering van de node-vermelding).

## Transportgedrag

- Het transport is **stateless**; het slaat geen lidmaatschap op.
- Als de Gateway offline is of koppeling is uitgeschakeld, kunnen nodes niet koppelen.
- Als de Gateway in externe modus staat, gebeurt koppeling nog steeds tegen de opslag van de externe Gateway.

## Gerelateerd

- [Kanaalkoppeling](/nl/channels/pairing)
- [Nodes](/nl/nodes)
- [Apparaten-CLI](/nl/cli/devices)
