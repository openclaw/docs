---
read_when:
    - Goedkeuringen voor Node-koppeling implementeren zonder macOS-UI
    - CLI-stromen toevoegen voor het goedkeuren van externe nodes
    - Gateway-protocol uitbreiden met Node-beheer
summary: 'Goedkeuringen voor Node-mogelijkheden: hoe nodes na het koppelen van apparaten toegang krijgen tot opdrachten'
title: Node-koppeling
x-i18n:
    generated_at: "2026-07-12T08:55:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 753b01681fa9be17df853b63210f54374d054a6dde37746a3b5fda69073af71d
    source_path: gateway/pairing.md
    workflow: 16
---

Node-koppeling bestaat uit twee lagen, die beide worden opgeslagen in de record van het gekoppelde apparaat in de SQLite-statusdatabase van de Gateway:

- **Apparaatkoppeling** (rol `node`) beveiligt de `connect`-handshake. Zie
  [Automatische goedkeuring van apparaten via vertrouwde CIDR](#trusted-cidr-device-auto-approval)
  hieronder en [Kanaalkoppeling](/nl/channels/pairing).
- **Goedkeuring van Node-mogelijkheden** (`node.pair.*`) bepaalt welke opgegeven
  mogelijkheden/opdrachten een verbonden Node beschikbaar mag stellen. De Gateway is de
  gezaghebbende bron; UI's (macOS-app, Control UI) zijn frontends waarmee openstaande verzoeken worden
  goedgekeurd of afgewezen.

De voormalige zelfstandige opslag voor Node-koppelingen (`nodes/paired.json` met een token per Node,
in januari 2026 buiten gebruik gesteld voor het verbindingspad) is verdwenen: gateways voegen
eventuele resterende rijen bij het opstarten eenmalig samen met de apparaatrecords en archiveren de
verouderde bestanden met het achtervoegsel `.migrated`. Ondersteuning voor de verouderde TCP-bridge is
verwijderd.

## Hoe goedkeuring van mogelijkheden werkt

1. Een Node maakt verbinding met de Gateway-WS (apparaatkoppeling beveiligt deze stap).
2. De Gateway vergelijkt de opgegeven mogelijkheden/opdrachten met de
   goedgekeurde set; nieuwe of uitgebreidere sets worden als een **openstaand verzoek** opgeslagen in de
   apparaatrecord en `node.pair.requested` wordt uitgezonden.
3. U keurt het verzoek goed of wijst het af (CLI of UI).
4. Tot de goedkeuring blijven Node-opdrachten gefilterd; na goedkeuring wordt de opgegeven
   set beschikbaar, onder voorbehoud van het normale opdrachtbeleid.

Openstaande verzoeken verlopen automatisch **5 minuten na de laatste
nieuwe poging van de Node** — een Node die actief opnieuw verbinding maakt, houdt zijn ene openstaande verzoek actief
in plaats van bij elke poging een nieuw verzoek (en een nieuwe goedkeuringsvraag) te genereren.

## CLI-workflow (geschikt voor headless gebruik)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` toont gekoppelde/verbonden Nodes en hun mogelijkheden.

## API-oppervlak (Gateway-protocol)

Gebeurtenissen:

- `node.pair.requested` - uitgezonden wanneer een nieuw openstaand verzoek wordt aangemaakt.
- `node.pair.resolved` - uitgezonden wanneer een verzoek wordt goedgekeurd, afgewezen of
  verloopt.

Methoden:

- `node.pair.list` - geeft openstaande en gekoppelde Nodes weer (`operator.pairing`).
- `node.pair.approve` - keurt een openstaand verzoek goed.
- `node.pair.reject` - wijst een openstaand verzoek af.
- `node.pair.remove` - verwijdert een gekoppelde Node. Hiermee wordt de rol `node` van het apparaat
  ingetrokken in de opslag voor gekoppelde apparaten, wordt de goedgekeurde Node-set eveneens verwijderd en
  worden de Node-rolsessies van dat apparaat ongeldig gemaakt en verbroken. Een apparaat met **gemengde rollen**
  (bijvoorbeeld een apparaat dat ook `operator` heeft) behoudt zijn rij en verliest alleen
  de rol `node`; de rij van een apparaat met uitsluitend de Node-rol wordt verwijderd. Autorisatie:
  `operator.pairing` mag Node-rijen zonder operatorrol verwijderen; een aanroeper met een apparaattoken
  die zijn **eigen** Node-rol op een apparaat met gemengde rollen intrekt, heeft daarnaast
  `operator.admin` nodig.
- `node.rename` - wijzigt de voor operators zichtbare weergavenaam van een gekoppelde Node.

Verwijderd in 2026.7: `node.pair.request` en `node.pair.verify`. Openstaande
verzoeken worden door de Gateway zelf aangemaakt wanneer Nodes verbinding maken, en het
zelfstandige token per Node waarvoor deze methoden dienden, bestaat niet meer; Node-authenticatie gebruikt het
apparaatkoppelingstoken.

Opmerkingen:

- Bij opnieuw verbinden met een ongewijzigde set wordt het openstaande verzoek hergebruikt; herhaalde
  verzoeken vernieuwen de opgeslagen Node-metadata en de nieuwste momentopname van opgegeven opdrachten
  op de toelatingslijst, zodat operators deze kunnen inzien.
- Niveaus van operatorbereiken en controles tijdens de goedkeuring worden samengevat in
  [Operatorbereiken](/nl/gateway/operator-scopes).
- `node.pair.approve` gebruikt de opgegeven opdrachten van het openstaande verzoek om
  aanvullende goedkeuringsbereiken af te dwingen:
  - verzoek zonder opdrachten: `operator.pairing`
  - verzoek met opdrachten die niet voor uitvoering dienen: `operator.pairing` + `operator.write`
  - verzoek voor `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Goedkeuring van Node-koppeling legt de vertrouwde set mogelijkheden vast. Hiermee wordt de actuele set Node-opdrachten **niet** per Node vastgezet.

- Actuele Node-opdrachten zijn afkomstig uit wat de Node bij het verbinden opgeeft, gefilterd door
  het algemene Node-opdrachtbeleid van de Gateway (`gateway.nodes.allowCommands` en
  `denyCommands`).
- Het beleid voor toestaan en vragen van `system.run` per Node bevindt zich op de Node in
  `exec.approvals.node.*`, niet in de koppelingsrecord.

</Warning>

## Beveiliging van Node-opdrachten (2026.3.31+)

<Warning>
**Incompatibele wijziging:** vanaf `2026.3.31` zijn Node-opdrachten uitgeschakeld totdat de Node-koppeling is goedgekeurd. Alleen apparaatkoppeling is niet langer voldoende om opgegeven Node-opdrachten beschikbaar te stellen.
</Warning>

Wanneer een Node voor het eerst verbinding maakt, wordt automatisch om koppeling verzocht.
Totdat dit verzoek is goedgekeurd, worden alle openstaande Node-opdrachten van die Node
gefilterd en niet uitgevoerd. Zodra de koppeling is goedgekeurd, worden de door de Node opgegeven
opdrachten beschikbaar, onder voorbehoud van het normale opdrachtbeleid.

Dit betekent:

- Nodes die voorheen alleen op apparaatkoppeling vertrouwden om opdrachten beschikbaar te stellen, moeten
  nu ook de Node-koppeling voltooien.
- Opdrachten die vóór de goedkeuring van de koppeling in de wachtrij zijn geplaatst, worden verwijderd en niet uitgesteld.

## Vertrouwensgrenzen voor Node-gebeurtenissen (2026.3.31+)

<Warning>
**Incompatibele wijziging:** door Nodes geïnitieerde uitvoeringen blijven voortaan beperkt tot een kleiner vertrouwd oppervlak.
</Warning>

Door Nodes geïnitieerde samenvattingen en gerelateerde sessiegebeurtenissen zijn beperkt tot het
beoogde vertrouwde oppervlak. Door meldingen of Nodes geactiveerde stromen die
voorheen afhankelijk waren van ruimere toegang tot host- of sessiehulpmiddelen, moeten mogelijk worden aangepast.
Deze beveiliging voorkomt dat Node-gebeurtenissen escaleren naar toegang tot hulpmiddelen op hostniveau
buiten wat de vertrouwensgrens van de Node toestaat.

Duurzame updates van Node-aanwezigheid volgen dezelfde identiteitsgrens: de gebeurtenis
`node.presence.alive` wordt alleen geaccepteerd van geauthenticeerde apparaatsessies van Nodes
en werkt koppelingsmetadata alleen bij wanneer de apparaat-/Node-identiteit
al is gekoppeld. Een zelf opgegeven waarde voor `client.id` is niet voldoende om de
status van de laatste waarneming vast te leggen.

## Via SSH geverifieerde automatische apparaatgoedkeuring (standaard)

Apparaatkoppeling bij de eerste aanvraag voor `role: node` vanaf een privé-/CGNAT-adres wordt
automatisch goedgekeurd wanneer de Gateway **het eigendom van de machine via SSH kan bewijzen**: de Gateway
maakt een terugverbinding met de koppelingshost (`BatchMode`, `StrictHostKeyChecking=yes`),
voert daar `openclaw node identity --json` uit en keurt alleen goed wanneer de externe
apparaat-id en openbare sleutel exact overeenkomen met het openstaande verzoek. De overeenkomst van de sleutel
maakt dit veilig: alleen bereikbaarheid leidt nooit tot goedkeuring, zodat medehuurders achter dezelfde NAT,
andere gebruikers op een gedeelde host en spoofing op het LAN allemaal terugvallen op de normale
vraag om goedkeuring.

Standaard ingeschakeld. Vereisten voor activering:

- De gebruiker van het Gateway-proces (of `sshVerify.user`) kan zonder interactie via SSH verbinding maken met de Node-host
  (sleutels/agent; Tailscale SSH werkt ook) en de hostsleutel is
  al vertrouwd.
- `openclaw` kan via de externe `PATH` worden gevonden voor niet-interactieve `sh -lc`.
- Het verbindende IP-adres is een rechtstreeks (niet via een proxy, niet via loopback) privé-, ULA-,
  link-local- of CGNAT-adres, of komt overeen met `sshVerify.cidrs` wanneer dit is ingesteld.
- Dezelfde minimale geschiktheid als voor goedkeuring via vertrouwde CIDR: uitsluitend nieuwe Node-koppeling
  zonder bereiken; upgrades, browsers, Control UI en WebChat vragen altijd om goedkeuring.

Terwijl een controle wordt uitgevoerd, krijgt de Node-client de instructie om te blijven proberen
(`wait_then_retry`) in plaats van te pauzeren voor handmatige goedkeuring; als de controle
mislukt, valt de volgende poging terug op de normale goedkeuringsstroom. Mislukte doelen
krijgen een korte afkoelperiode (5 minuten na een niet-overeenkomende sleutel).

Bij goedgekeurde apparaten wordt `approvedVia: "ssh-verified"` vastgelegd en hun eerste opgegeven
set mogelijkheden wordt in dezelfde stap goedgekeurd — de overeenkomst van de sleutel bewijst al
dat de Node wordt uitgevoerd onder het account van de operator op een machine waarvan die eigenaar is, wat
dezelfde bewering is die een handmatige goedkeuring van mogelijkheden bevestigt. Latere uitbreidingen van de set
vragen nog steeds om goedkeuring.

Aanscherpen of uitschakelen:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        // Disable entirely:
        sshVerify: false,
        // ...or scope/tune the probe:
        // sshVerify: { user: "me", identity: "~/.ssh/probe", timeoutMs: 7000, cidrs: ["10.0.0.0/8"] },
      },
    },
  },
}
```

## Automatische goedkeuring (macOS-app)

De macOS-app kan proberen verzoeken om Node-mogelijkheden **stilzwijgend goed te keuren**
wanneer:

- het verzoek als `silent` is gemarkeerd (de Gateway markeert de eerste set mogelijkheden
  als stil wanneer de apparaatkoppeling zonder interactie is goedgekeurd), en
- de app een SSH-verbinding met de Gateway-host kan verifiëren met dezelfde
  gebruiker.

Als stilzwijgende goedkeuring mislukt, valt de app terug op de normale vraag met Approve/Reject.

## Automatische apparaatgoedkeuring via vertrouwde CIDR

WS-apparaatkoppeling voor `role: node` blijft standaard handmatig. Voor privé-
Node-netwerken waarvan de Gateway het netwerkpad al vertrouwt, kunnen operators dit
inschakelen met expliciete CIDR's of exacte IP-adressen:

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
- Er bestaat geen algemene modus voor automatische goedkeuring via LAN of privénetwerk; via SSH geverifieerde
  automatische goedkeuring (hierboven) vereist een cryptografische overeenkomst met de apparaatsleutel en nooit
  alleen netwerklokaliteit.
- Alleen een nieuw apparaatkoppelingsverzoek voor `role: node` zonder aangevraagde bereiken
  komt in aanmerking.
- Clients voor operators, browsers, Control UI en WebChat blijven handmatig.
- Upgrades van rollen, bereiken, metadata en openbare sleutels blijven handmatig.
- Vertrouwde-proxyheaderpaden via local loopback op dezelfde host komen niet in aanmerking, omdat dit
  pad door lokale aanroepers kan worden vervalst.

## Opschoning bij vervanging van stilzwijgende koppelingen

Niet-interactieve goedkeuringen leggen hun herkomst vast in de rij voor het gekoppelde apparaat:
goedkeuringen volgens lokaal beleid op dezelfde host als `silent`, Node-goedkeuringen via vertrouwde CIDR als
`trusted-cidr` en via SSH geverifieerde Node-goedkeuringen als `ssh-verified`. Clients met een tijdelijke statusmap (tijdelijke basismappen,
containers, sandboxes per uitvoering) maken per uitvoering een nieuw apparaatssleutelpaar en elke
uitvoering wordt stilzwijgend opnieuw gekoppeld als een volledig nieuw apparaat — zonder opschoning groeit de lijst met gekoppelde apparaten
bij elke uitvoering met één verouderde rij.

Wanneer de Gateway een **lokale** apparaatkoppeling stilzwijgend goedkeurt, trekt deze
oudere met `silent` goedgekeurde records in die tot hetzelfde clientcluster behoren
(overeenkomstige `clientId`, `clientMode` en weergavenaam) en momenteel niet
verbonden zijn. Lokale clients worden uitgevoerd op de Gateway-host zelf, zodat de clustersleutel
niet met een andere machine kan overeenkomen. Tokens van ingetrokken rijen worden onmiddellijk ongeldig;
overeenkomende verouderde Node-koppelingsvermeldingen worden gewist en een verwijderingsgebeurtenis
`node.pair.resolved` wordt uitgezonden.

Grenzen:

- Alleen records waarvan de nieuwste goedkeuring lokaal op dezelfde host (`silent`) was, komen
  in aanmerking, zowel als aanleiding als als doel. Koppelingen via vertrouwde CIDR en via SSH geverifieerde koppelingen
  lopen over hosts heen waar weergavemetadata geen machine-identiteit is, zodat ze
  nooit automatisch worden verwijderd — gebruik daarvoor de opschoning in Control UI of
  `openclaw nodes remove`.
- Door de eigenaar goedgekeurde koppelingen en koppelingen via QR-/installatiecode (bootstrap) worden nooit
  automatisch verwijderd. Records die zijn goedgekeurd voordat herkomst werd vastgelegd, blijven beschermd,
  zelfs na een latere stilzwijgende hergoedkeuring van dezelfde apparaat-id.
- Momenteel verbonden apparaten worden overgeslagen, zodat gelijktijdige lokale sessies met
  afzonderlijke statusmappen hun tokens behouden zolang ze actief zijn. Records die
  in de afgelopen minuut zijn goedgekeurd, worden eveneens overgeslagen, zodat gelijktijdige koppelingshandshakes
  elkaar niet kunnen intrekken voordat hun verbindingen zijn geregistreerd.
- Betrokken clients zijn per definitie lokaal, zodat ze bij hun volgende verbinding
  opnieuw stilzwijgend worden gekoppeld.

## Automatische goedkeuring van metadata-upgrades

Wanneer een al gekoppeld apparaat opnieuw verbinding maakt met uitsluitend niet-gevoelige wijzigingen in metadata
(bijvoorbeeld de weergavenaam of aanwijzingen over het clientplatform), behandelt OpenClaw
dit als een `metadata-upgrade`. Stilzwijgende automatische goedkeuring is beperkt: deze geldt alleen
voor vertrouwde lokale herverbindingen buiten de browser die al hebben bewezen dat ze over
lokale of gedeelde aanmeldgegevens beschikken, waaronder herverbindingen van systeemeigen apps op dezelfde host na
wijzigingen in metadata over de versie van het besturingssysteem. Clients voor browsers/Control UI en externe clients
gebruiken nog steeds de expliciete stroom voor hergoedkeuring. Upgrades van bereiken (lezen naar
schrijven/beheer) en wijzigingen in de openbare sleutel komen **niet** in aanmerking voor
automatische goedkeuring als metadata-upgrade; hiervoor blijven expliciete verzoeken om hergoedkeuring vereist.

## Hulpmiddelen voor QR-koppeling

`/pair qr` geeft de koppelingspayload weer als gestructureerde media, zodat mobiele
clients en browserclients deze rechtstreeks kunnen scannen.

Als een apparaat wordt verwijderd, worden ook alle verouderde openstaande koppelingsverzoeken voor die
apparaat-id opgeschoond, zodat `nodes pending` na intrekking geen verweesde rijen toont.

## Lokale herkomst en doorgestuurde headers

Gateway-koppeling beschouwt een verbinding alleen als local loopback wanneer zowel de onbewerkte socket
als eventueel bewijs van een bovenliggende proxy daarmee overeenstemmen. Als een verzoek via local loopback binnenkomt maar
bewijs bevat in de vorm van de header `Forwarded`, een `X-Forwarded-*`-header of een `X-Real-IP`-header, sluit dat
bewijs uit doorgestuurde headers de claim van lokale herkomst via local loopback uit en vereist
het koppelingspad expliciete goedkeuring, in plaats van het verzoek stilzwijgend als een verbinding
vanaf dezelfde host te behandelen. Zie
[Verificatie via vertrouwde proxy](/nl/gateway/trusted-proxy-auth) voor de overeenkomstige regel voor
operatorverificatie.

## Opslag (lokaal, privé)

De koppelingsstatus wordt opgeslagen in de records van gekoppelde apparaten in de gedeelde SQLite-statusdatabase
in de statusmap van de Gateway (standaard `~/.openclaw`):

- `~/.openclaw/state/openclaw.sqlite` (gekoppelde apparaten met apparaatverificatie,
  goedgekeurde Node-oppervlakken, openstaande oppervlakteverzoeken, openstaande koppelingsverzoeken voor
  apparaten en bootstrap-tokens)

Als u `OPENCLAW_STATE_DIR` overschrijft, wordt de database mee verplaatst. Gateways
die zijn bijgewerkt vanaf releases met JSON-opslag importeren deze bij het opstarten en laten
de archieven `devices/*.json.migrated` en `nodes/*.json.migrated` achter.

Beveiligingsopmerkingen:

- Apparaattokens zijn geheimen; behandel de statusdatabase als gevoelige gegevens.
- U roteert een apparaattoken met `openclaw devices rotate` /
  `device.token.rotate`.

## Transportgedrag

- Het transport is **staatloos**; het slaat geen lidmaatschap op.
- Als de Gateway offline is of koppeling is uitgeschakeld, kunnen Nodes niet koppelen.
- In de externe modus vindt de koppeling plaats met de opslag van de externe Gateway.

## Gerelateerd

- [Kanaalkoppeling](/nl/channels/pairing)
- [CLI voor Nodes](/nl/cli/nodes)
- [CLI voor apparaten](/nl/cli/devices)
