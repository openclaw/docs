---
read_when:
    - Node-koppelingsgoedkeuringen implementeren zonder macOS-UI
    - CLI-flows toevoegen voor het goedkeuren van externe nodes
    - Gateway-protocol uitbreiden met Node-beheer
summary: Door Gateway beheerde nodekoppeling (Optie B) voor iOS en andere externe nodes
title: Gateway-beheerde koppeling
x-i18n:
    generated_at: "2026-04-29T22:47:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c662b8f5c1bb44cfc306d42ae19ba1c8bc36e0d96130d730b322ee07e02cad8
    source_path: gateway/pairing.md
    workflow: 16
---

Bij door Gateway beheerde koppeling is de **Gateway** de bron van waarheid voor welke nodes
mogen deelnemen. UI’s (macOS-app, toekomstige clients) zijn alleen frontends die
openstaande aanvragen goedkeuren of afwijzen.

**Belangrijk:** WS-nodes gebruiken **apparaatkoppeling** (rol `node`) tijdens `connect`.
`node.pair.*` is een afzonderlijke koppelingsopslag en bewaakt de WS-handshake **niet**.
Alleen clients die expliciet `node.pair.*` aanroepen, gebruiken deze flow.

## Concepten

- **Openstaande aanvraag**: een node heeft gevraagd om deel te nemen; vereist goedkeuring.
- **Gekoppelde node**: goedgekeurde node met een uitgegeven auth-token.
- **Transport**: het Gateway-WS-eindpunt stuurt aanvragen door, maar beslist niet over
  lidmaatschap. (Ondersteuning voor de verouderde TCP-bridge is verwijderd.)

## Hoe koppeling werkt

1. Een node maakt verbinding met de Gateway-WS en vraagt om koppeling.
2. De Gateway slaat een **openstaande aanvraag** op en verzendt `node.pair.requested`.
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

## API-oppervlak (Gateway-protocol)

Gebeurtenissen:

- `node.pair.requested` — verzonden wanneer een nieuwe openstaande aanvraag wordt gemaakt.
- `node.pair.resolved` — verzonden wanneer een aanvraag is goedgekeurd/afgewezen/verlopen.

Methoden:

- `node.pair.request` — maak een openstaande aanvraag of hergebruik er een.
- `node.pair.list` — lijst met openstaande + gekoppelde nodes (`operator.pairing`).
- `node.pair.approve` — keur een openstaande aanvraag goed (geeft token uit).
- `node.pair.reject` — wijs een openstaande aanvraag af.
- `node.pair.remove` — verwijder een verouderde gekoppelde node-vermelding.
- `node.pair.verify` — verifieer `{ nodeId, token }`.

Notities:

- `node.pair.request` is idempotent per node: herhaalde aanroepen retourneren dezelfde
  openstaande aanvraag.
- Herhaalde aanvragen voor dezelfde openstaande node vernieuwen ook de opgeslagen node-
  metadata en de nieuwste allowlist-snapshot van gedeclareerde commando’s voor operatorzichtbaarheid.
- Goedkeuring genereert **altijd** een nieuw token; er wordt nooit een token geretourneerd door
  `node.pair.request`.
- Aanvragen kunnen `silent: true` bevatten als hint voor flows met automatische goedkeuring.
- `node.pair.approve` gebruikt de gedeclareerde commando’s van de openstaande aanvraag om
  extra goedkeuringsscopes af te dwingen:
  - aanvraag zonder commando’s: `operator.pairing`
  - aanvraag voor niet-exec-commando: `operator.pairing` + `operator.write`
  - aanvraag voor `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Node-koppeling is een vertrouwens- en identiteitsflow plus tokenuitgifte. Het pint **niet** het live node-commando-oppervlak per node vast.

- Live node-commando’s komen voort uit wat de node declareert bij verbinden nadat het globale node-commandobeleid van de gateway (`gateway.nodes.allowCommands` en `denyCommands`) is toegepast.
- Per-node `system.run`-allow- en ask-beleid staat op de node in `exec.approvals.node.*`, niet in het koppelingsrecord.

</Warning>

## Node-commandobeheer (2026.3.31+)

<Warning>
**Breukwijziging:** Vanaf `2026.3.31` zijn node-commando’s uitgeschakeld totdat node-koppeling is goedgekeurd. Alleen apparaatkoppeling is niet langer genoeg om gedeclareerde node-commando’s beschikbaar te maken.
</Warning>

Wanneer een node voor het eerst verbinding maakt, wordt koppeling automatisch aangevraagd. Totdat de koppelingsaanvraag is goedgekeurd, worden alle openstaande node-commando’s van die node gefilterd en niet uitgevoerd. Zodra vertrouwen is vastgesteld via koppelingsgoedkeuring, worden de gedeclareerde commando’s van de node beschikbaar, onderworpen aan het normale commandobeleid.

Dit betekent:

- Nodes die eerder alleen op apparaatkoppeling vertrouwden om commando’s beschikbaar te maken, moeten nu node-koppeling voltooien.
- Commando’s die vóór koppelingsgoedkeuring in de wachtrij staan, worden verwijderd, niet uitgesteld.

## Vertrouwensgrenzen voor node-gebeurtenissen (2026.3.31+)

<Warning>
**Breukwijziging:** Door nodes geïnitieerde runs blijven nu op een beperkt vertrouwd oppervlak.
</Warning>

Door nodes geïnitieerde samenvattingen en gerelateerde sessiegebeurtenissen zijn beperkt tot het bedoelde vertrouwde oppervlak. Door meldingen aangestuurde of door nodes getriggerde flows die eerder vertrouwden op bredere toegang tot host- of sessietools, moeten mogelijk worden aangepast. Deze versterking zorgt ervoor dat node-gebeurtenissen niet kunnen escaleren naar tooltoegang op hostniveau buiten wat de vertrouwensgrens van de node toestaat.

Duurzame aanwezigheidsupdates van nodes volgen dezelfde identiteitsgrens. De gebeurtenis `node.presence.alive` wordt
alleen geaccepteerd van geauthenticeerde node-apparaatsessies en werkt koppelingsmetadata alleen bij wanneer de
apparaat-/node-identiteit al gekoppeld is. Zelf gedeclareerde `client.id`-waarden zijn niet genoeg om
last-seen-status te schrijven.

## Automatische goedkeuring (macOS-app)

De macOS-app kan optioneel een **stille goedkeuring** proberen wanneer:

- de aanvraag is gemarkeerd als `silent`, en
- de app een SSH-verbinding met de gateway-host kan verifiëren met dezelfde gebruiker.

Als stille goedkeuring mislukt, valt deze terug op de normale prompt “Goedkeuren/Afwijzen”.

## Automatische goedkeuring van Trusted-CIDR-apparaten

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
- Er bestaat geen algemene LAN- of privénetwerkmodus voor automatische goedkeuring.
- Alleen nieuwe `role: node`-apparaatkoppeling zonder aangevraagde scopes komt in aanmerking.
- Operator-, browser-, Control UI- en WebChat-clients blijven handmatig.
- Rol-, scope-, metadata- en public-key-upgrades blijven handmatig.
- Same-host local loopback trusted-proxy-headerpaden komen niet in aanmerking omdat dat
  pad kan worden gespoofd door lokale aanroepers.

## Automatische goedkeuring van metadata-upgrades

Wanneer een al gekoppeld apparaat opnieuw verbinding maakt met alleen niet-gevoelige metadata-
wijzigingen (bijvoorbeeld weergavenaam of hints over het clientplatform), behandelt OpenClaw
dat als een `metadata-upgrade`. Stille automatische goedkeuring is nauw afgebakend: deze geldt alleen
voor vertrouwde lokale niet-browser-reconnects die al bezit van lokale
of gedeelde referenties hebben bewezen, inclusief same-host native app-reconnects na wijzigingen in
OS-versiemetadata. Browser-/Control UI-clients en externe clients gebruiken nog steeds
de expliciete flow voor hergoedkeuring. Scope-upgrades (read naar write/admin) en
wijzigingen in public key komen **niet** in aanmerking voor automatische goedkeuring van metadata-upgrades —
ze blijven expliciete aanvragen voor hergoedkeuring.

## QR-koppelingshelpers

`/pair qr` rendert de koppelingspayload als gestructureerde media zodat mobiele en
browserclients deze direct kunnen scannen.

Het verwijderen van een apparaat ruimt ook verouderde openstaande koppelingsaanvragen voor dat
apparaat-id op, zodat `nodes pending` geen verweesde rijen toont na intrekking.

## Localiteit en doorgestuurde headers

Gateway-koppeling behandelt een verbinding alleen als local loopback wanneer zowel de raw socket
als eventueel upstream-proxybewijs overeenkomen. Als een aanvraag binnenkomt via local loopback maar
`X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`-headers bevat
die naar een niet-lokale oorsprong wijzen, diskwalificeert dat forwarded-headerbewijs
de local loopback-localiteitsclaim. Het koppelingspad vereist dan expliciete goedkeuring
in plaats van de aanvraag stilzwijgend als same-host-verbinding te behandelen. Zie
[Trusted Proxy Auth](/nl/gateway/trusted-proxy-auth) voor de equivalente regel voor
operatorauthenticatie.

## Opslag (lokaal, privé)

Koppelingsstatus wordt opgeslagen onder de Gateway-statusdirectory (standaard `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Als je `OPENCLAW_STATE_DIR` overschrijft, verhuist de map `nodes/` mee.

Beveiligingsnotities:

- Tokens zijn geheimen; behandel `paired.json` als gevoelig.
- Het roteren van een token vereist hergoedkeuring (of het verwijderen van de node-vermelding).

## Transportgedrag

- Het transport is **stateless**; het slaat geen lidmaatschap op.
- Als de Gateway offline is of koppeling is uitgeschakeld, kunnen nodes niet koppelen.
- Als de Gateway in externe modus staat, vindt koppeling nog steeds plaats tegen de store van de externe Gateway.

## Gerelateerd

- [Kanaalkoppeling](/nl/channels/pairing)
- [Nodes](/nl/nodes)
- [Apparaten-CLI](/nl/cli/devices)
