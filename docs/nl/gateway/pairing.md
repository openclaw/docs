---
read_when:
    - Goedkeuringen voor Node-koppeling implementeren zonder macOS-UI
    - CLI-stromen toevoegen voor het goedkeuren van externe nodes
    - Gateway-protocol uitbreiden met Node-beheer
summary: 'Goedkeuringen voor Node-mogelijkheden: hoe Nodes na apparaatkoppeling toegang tot opdrachten krijgen'
title: Node-koppeling
x-i18n:
    generated_at: "2026-07-16T15:47:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9e4221d7ad6aa6a9cd8ae33f2d4330c2aa49783340fcf7a657c20d6a94c126d9
    source_path: gateway/pairing.md
    workflow: 16
---

Node-koppeling bestaat uit twee lagen, die beide worden opgeslagen in de record van het gekoppelde apparaat in de SQLite-statusdatabase van de Gateway:

- **Apparaatkoppeling** (rol `node`) schermt de `connect`-handshake af. Zie
  [Automatische apparaatgoedkeuring via vertrouwde CIDR](#trusted-cidr-device-auto-approval)
  hieronder en [Kanaalkoppeling](/nl/channels/pairing).
- **Goedkeuring van Node-mogelijkheden** (`node.pair.*`) bepaalt welke gedeclareerde
  mogelijkheden/opdrachten een verbonden Node beschikbaar mag stellen. De Gateway is de
  gezaghebbende bron; UI's (macOS-app, Control UI) zijn frontends die openstaande verzoeken
  goedkeuren of afwijzen.

De voormalige zelfstandige opslag voor Node-koppelingen (`nodes/paired.json` met een token
per Node, in januari 2026 uit het verbindingspad verwijderd) is verdwenen: Gateways voegen
eventuele resterende rijen bij het opstarten eenmalig samen met de apparaatrecords en archiveren
de verouderde bestanden met het achtervoegsel `.migrated`. Ondersteuning voor de
verouderde TCP-bridge is verwijderd.

## Hoe goedkeuring van mogelijkheden werkt

1. Een Node maakt verbinding met de Gateway-WS (apparaatkoppeling schermt deze stap af).
2. De Gateway vergelijkt het gedeclareerde oppervlak van mogelijkheden/opdrachten met het
   goedgekeurde oppervlak; nieuwe of uitgebreidere oppervlakken slaan een **openstaand verzoek**
   op in de apparaatrecord en zenden `node.pair.requested` uit.
3. Je keurt het verzoek goed of wijst het af (CLI of UI).
4. Tot de goedkeuring blijven Node-opdrachten gefilterd; na goedkeuring wordt het
   gedeclareerde oppervlak beschikbaar, met inachtneming van het normale opdrachtbeleid.

Openstaande verzoeken verlopen automatisch **5 minuten na de laatste
nieuwe poging van de Node** — een Node die actief opnieuw verbinding probeert te maken, houdt
zijn ene openstaande verzoek actief in plaats van bij elke poging een nieuw verzoek
(en een nieuwe goedkeuringsprompt) te genereren.

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

- `node.pair.requested` - wordt uitgezonden wanneer een nieuw openstaand verzoek wordt aangemaakt.
- `node.pair.resolved` - wordt uitgezonden wanneer een verzoek wordt goedgekeurd, afgewezen of
  verloopt.

Methoden:

- `node.pair.list` - vermeldt openstaande en gekoppelde Nodes (`operator.pairing`).
- `node.pair.approve` - keurt een openstaand verzoek goed.
- `node.pair.reject` - wijst een openstaand verzoek af.
- `node.pair.remove` - verwijdert een gekoppelde Node. Dit trekt de rol `node`
  van het apparaat in de opslag voor gekoppelde apparaten in, verwijdert daarmee het
  goedgekeurde Node-oppervlak en maakt de Node-rolsessies van dat apparaat ongeldig en
  verbreekt ze. Een apparaat met **gemengde rollen** (bijvoorbeeld een apparaat dat ook
  `operator` heeft) behoudt zijn rij en verliest alleen de rol
  `node`; de rij van een apparaat met uitsluitend een Node-rol wordt verwijderd.
  Autorisatie: `operator.pairing` mag Node-rijen van niet-operators verwijderen; een aanroeper
  met een apparaattoken die zijn **eigen** Node-rol op een apparaat met gemengde rollen
  intrekt, heeft daarnaast `operator.admin` nodig.
- `node.rename` - wijzigt de voor operators zichtbare weergavenaam van een gekoppelde Node.

Verwijderd in 2026.7: `node.pair.request` en `node.pair.verify`. Openstaande
verzoeken worden door de Gateway zelf aangemaakt wanneer Nodes verbinding maken, en het
zelfstandige token per Node waarvoor ze dienden bestaat niet meer; Node-authenticatie gebruikt
het apparaatkoppelingstoken.

Opmerkingen:

- Nieuwe verbindingen met een ongewijzigd oppervlak hergebruiken het openstaande verzoek;
  herhaalde verzoeken vernieuwen de opgeslagen Node-metadata en de nieuwste momentopname
  van gedeclareerde opdrachten op de toelatingslijst, zodat operators deze kunnen bekijken.
- De niveaus van operatorbereiken en controles tijdens de goedkeuring worden samengevat in
  [Operatorbereiken](/nl/gateway/operator-scopes).
- `node.pair.approve` gebruikt de gedeclareerde opdrachten van het openstaande verzoek om
  aanvullende goedkeuringsbereiken af te dwingen:
  - verzoek zonder opdrachten: `operator.pairing`
  - normaal opdrachtverzoek: `operator.pairing` + `operator.write`
  - beheerdergevoelig verzoek dat `system.run`, `system.run.prepare`,
    `system.which`, `browser.proxy`, `fs.listDir` of
    `system.execApprovals.get/set` bevat: `operator.pairing` + `operator.admin`

<Warning>
Bij goedkeuring van Node-koppeling wordt het vertrouwde oppervlak van mogelijkheden vastgelegd. Het actuele Node-opdrachtoppervlak wordt daarmee **niet** per Node vastgezet.

- Actuele Node-opdrachten zijn afkomstig van wat de Node bij het verbinden declareert,
  gefilterd door het algemene Node-opdrachtbeleid van de Gateway (`gateway.nodes.allowCommands` en
  `denyCommands`).
- Het beleid voor toestaan en navragen via `system.run` per Node staat bij de Node in
  `exec.approvals.node.*`, niet in de koppelingsrecord.

</Warning>

## Afscherming van Node-opdrachten (2026.3.31+)

<Warning>
**Incompatibele wijziging:** vanaf `2026.3.31` zijn Node-opdrachten uitgeschakeld totdat de Node-koppeling is goedgekeurd. Alleen apparaatkoppeling is niet langer voldoende om gedeclareerde Node-opdrachten beschikbaar te stellen.
</Warning>

Wanneer een Node voor het eerst verbinding maakt, wordt automatisch een koppeling aangevraagd.
Totdat dat verzoek is goedgekeurd, worden alle openstaande Node-opdrachten van die Node
gefilterd en niet uitgevoerd. Zodra de koppeling is goedgekeurd, worden de gedeclareerde
opdrachten van de Node beschikbaar, met inachtneming van het normale opdrachtbeleid.

Dit betekent:

- Nodes die voorheen uitsluitend op apparaatkoppeling vertrouwden om opdrachten beschikbaar
  te stellen, moeten nu ook de Node-koppeling voltooien.
- Opdrachten die vóór de koppelingsgoedkeuring in de wachtrij zijn geplaatst, worden verwijderd
  en niet uitgesteld.

## Vertrouwensgrenzen voor Node-gebeurtenissen (2026.3.31+)

<Warning>
**Incompatibele wijziging:** door Nodes geïnitieerde uitvoeringen blijven nu binnen een beperkt vertrouwd oppervlak.
</Warning>

Door Nodes geïnitieerde samenvattingen en gerelateerde sessiegebeurtenissen zijn beperkt tot
het beoogde vertrouwde oppervlak. Door meldingen aangestuurde of door Nodes geactiveerde
stromen die voorheen afhankelijk waren van bredere toegang tot host- of sessiehulpmiddelen
moeten mogelijk worden aangepast. Deze versterking voorkomt dat Node-gebeurtenissen escaleren
tot toegang tot hulpmiddelen op hostniveau buiten wat de vertrouwensgrens van de Node toestaat.

Duurzame updates van de aanwezigheid van Nodes volgen dezelfde identiteitsgrens: de gebeurtenis
`node.presence.alive` wordt alleen geaccepteerd vanuit geauthenticeerde apparaatsessies van Nodes
en werkt koppelingsmetadata alleen bij wanneer de apparaat-/Node-identiteit al is gekoppeld.
Een zelfgedeclareerde waarde `client.id` is niet voldoende om de status van het laatste
contactmoment weg te schrijven.

## Via SSH geverifieerde automatische apparaatgoedkeuring (standaard)

Een eerste `role: node`-apparaatkoppeling vanaf een privé-/CGNAT-adres wordt
automatisch goedgekeurd wanneer de Gateway **eigendom van de machine via SSH kan bewijzen**:
deze maakt een terugverbinding met de koppelingshost (`BatchMode`, `StrictHostKeyChecking=yes`),
voert daar `openclaw node identity --json` uit en keurt alleen goed wanneer de externe
apparaat-id en openbare sleutel exact overeenkomen met het openstaande verzoek. De
sleutelovereenkomst maakt dit veilig: alleen bereikbaarheid leidt nooit tot goedkeuring, zodat
medehuurders achter dezelfde NAT, andere gebruikers op een gedeelde host en LAN-spoofing
allemaal terugvallen op de normale prompt.

Standaard ingeschakeld. Vereisten om dit te activeren:

- De gebruiker van het Gateway-proces (of `sshVerify.user`) kan niet-interactief via SSH
  verbinding maken met de Node-host (sleutels/agent; Tailscale SSH werkt ook), en de
  hostsleutel wordt al vertrouwd.
- `openclaw` wordt op de externe `PATH` gevonden voor niet-interactieve `sh -lc`.
- Het IP-adres van de verbinding is een direct (niet via een proxy en geen loopback)
  privé-, ULA-, link-local- of CGNAT-adres, of komt overeen met `sshVerify.cidrs` wanneer
  dit is ingesteld.
- Dezelfde minimale geschiktheid als voor goedkeuring via vertrouwde CIDR: alleen een
  nieuwe Node-koppeling zonder bereiken; upgrades, browsers, Control UI en WebChat tonen
  altijd een prompt.

Terwijl een controle wordt uitgevoerd, krijgt de Node-client de opdracht opnieuw te blijven
proberen (`wait_then_retry`) in plaats van te pauzeren voor handmatige goedkeuring; als de
controle mislukt, valt de volgende poging terug op de normale promptstroom. Mislukte doelen
krijgen een korte afkoelperiode (5 minuten na een niet-overeenkomende sleutel).

Bij goedgekeurde apparaten wordt `approvedVia: "ssh-verified"` vastgelegd en hun eerste gedeclareerde
oppervlak van mogelijkheden wordt in dezelfde stap goedgekeurd — de sleutelovereenkomst bewijst
al dat de Node wordt uitgevoerd onder het account van de operator op een machine waarvan die
operator eigenaar is, dezelfde bewering die een handmatige goedkeuring van mogelijkheden
bevestigt. Latere uitbreidingen van het oppervlak tonen nog steeds een prompt.

Versterken of uitschakelen:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        // Volledig uitschakelen:
        sshVerify: false,
        // ...of het bereik/de controle afstemmen:
        // sshVerify: { user: "me", identity: "~/.ssh/probe", timeoutMs: 7000, cidrs: ["10.0.0.0/8"] },
      },
    },
  },
}
```

## Automatische goedkeuring (macOS-app)

De macOS-app kan proberen Node-mogelijkheidsverzoeken **stilzwijgend goed te keuren**
wanneer:

- het verzoek is gemarkeerd als `silent` (de Gateway markeert het eerste
  oppervlak van mogelijkheden als stil wanneer de apparaatkoppeling niet-interactief is
  goedgekeurd), en
- de app een SSH-verbinding met de Gateway-host kan verifiëren met dezelfde
  gebruiker.

Als stilzwijgende goedkeuring mislukt, valt de app terug op de normale prompt Approve/Reject.

## Automatische apparaatgoedkeuring via vertrouwde CIDR

WS-apparaatkoppeling voor `role: node` blijft standaard handmatig. Voor privé-
Node-netwerken waarbij de Gateway het netwerkpad al vertrouwt, kunnen operators dit inschakelen
met expliciete CIDR's of exacte IP-adressen:

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
- Er bestaat geen algemene modus voor automatische goedkeuring van LAN's of privénetwerken;
  via SSH geverifieerde automatische goedkeuring (hierboven) vereist een cryptografische
  overeenkomst van de apparaatsleutel, nooit alleen netwerklocatie.
- Alleen een nieuw `role: node`-apparaatkoppelingsverzoek zonder aangevraagde bereiken
  komt in aanmerking.
- Clients voor operators, browsers, Control UI en WebChat blijven handmatig.
- Upgrades van rollen, bereiken, metadata en openbare sleutels blijven handmatig.
- Paden via vertrouwde-proxyheaders met loopback op dezelfde host komen niet in aanmerking,
  omdat lokale aanroepers dat pad kunnen spoofen.

## Opschoning bij vervanging van stille koppelingen

Niet-interactieve goedkeuringen leggen hun herkomst vast in de rij van het gekoppelde apparaat:
goedkeuringen via lokaal beleid op dezelfde host als `silent`, goedkeuringen van Nodes
via vertrouwde CIDR als `trusted-cidr`, en via SSH geverifieerde goedkeuringen van Nodes als
`ssh-verified`. Clients met een tijdelijke statusmap (tijdelijke thuismappen,
containers, sandboxes per uitvoering) genereren bij elke uitvoering een nieuw sleutelpaar voor
het apparaat en worden elke keer stilzwijgend opnieuw gekoppeld als een volledig nieuw apparaat
— zonder opschoning groeit de lijst met gekoppelde apparaten bij elke uitvoering met één
verouderde rij.

Wanneer de Gateway een **lokale** apparaatkoppeling stilzwijgend goedkeurt, trekt deze oudere
door `silent` goedgekeurde records in die tot hetzelfde clientcluster behoren
(overeenkomstige `clientId`, `clientMode` en weergavenaam) en momenteel niet
verbonden zijn. Lokale clients worden op de Gateway-host zelf uitgevoerd, zodat de
clustersleutel niet met een andere machine kan overeenkomen. Ingetrokken rijen verliezen
onmiddellijk hun tokens; elke overeenkomende verouderde Node-koppelingsvermelding wordt gewist
en een verwijderingsgebeurtenis `node.pair.resolved` wordt uitgezonden.

Grenzen:

- Alleen records waarvan de meest recente goedkeuring lokaal op dezelfde host plaatsvond (`silent`), komen
  in aanmerking, zowel als trigger als doel. Koppelingen die via een vertrouwde CIDR of SSH zijn geverifieerd,
  lopen over verschillende hosts, waarbij weergavemetadata geen machine-identiteit is. Daarom worden ze
  nooit automatisch verwijderd — gebruik daarvoor de opschoonfunctie van de Control UI of
  `openclaw nodes remove`.
- Door de eigenaar goedgekeurde koppelingen en koppelingen via QR-/installatiecode (bootstrap) worden nooit
  automatisch verwijderd. Records die zijn goedgekeurd voordat herkomstgegevens bestonden, blijven beschermd,
  zelfs na een latere stille hergoedkeuring van dezelfde apparaat-id.
- Momenteel verbonden apparaten worden overgeslagen, zodat gelijktijdige lokale sessies met
  afzonderlijke statusmappen hun tokens behouden zolang ze actief zijn. Records die
  in de afgelopen minuut zijn goedgekeurd, worden ook overgeslagen, zodat gelijktijdige koppelingshandshakes
  elkaar niet kunnen intrekken voordat hun verbindingen zijn geregistreerd.
- De betrokken clients zijn per definitie lokaal en worden daarom bij
  hun volgende verbinding stil opnieuw gekoppeld.

## Automatische goedkeuring van metadata-upgrades

Wanneer een reeds gekoppeld apparaat opnieuw verbinding maakt met uitsluitend wijzigingen in
niet-gevoelige metadata (bijvoorbeeld de weergavenaam of hints over het clientplatform), behandelt OpenClaw
dit als een `metadata-upgrade`. Stille automatische goedkeuring is strikt begrensd: deze geldt alleen
voor vertrouwde lokale herverbindingen buiten de browser die al hebben bewezen
over lokale of gedeelde inloggegevens te beschikken, waaronder herverbindingen van native apps op
dezelfde host na wijzigingen in metadata over de OS-versie. Browser-/Control UI-clients en externe clients
gebruiken nog steeds de expliciete stroom voor hergoedkeuring. Scope-upgrades (van lezen naar
schrijven/beheren) en wijzigingen van de openbare sleutel komen **niet** in aanmerking voor
automatische goedkeuring van metadata-upgrades; dit blijven expliciete verzoeken om hergoedkeuring.

## Hulpmiddelen voor QR-koppeling

`/pair qr` geeft de koppelingspayload weer als gestructureerde media, zodat mobiele clients en
browserclients deze rechtstreeks kunnen scannen.

Als een apparaat wordt verwijderd, worden ook alle verouderde openstaande koppelingsverzoeken voor die
apparaat-id opgeruimd, zodat `nodes pending` na een intrekking geen verweesde rijen toont.

## Lokale herkomst en doorgestuurde headers

Gateway-koppeling behandelt een verbinding alleen als loopback wanneer zowel de onbewerkte socket
als eventueel bewijs van een upstreamproxy hiermee overeenstemmen. Als een verzoek via loopback binnenkomt maar
bewijs bevat in de header `Forwarded`, een van de headers `X-Forwarded-*` of de header `X-Real-IP`, maakt dat
bewijs uit doorgestuurde headers de claim van lokale loopback-herkomst ongeldig en vereist het
koppelingspad expliciete goedkeuring, in plaats van het verzoek stil te behandelen als een
verbinding vanaf dezelfde host. Zie
[Authenticatie via vertrouwde proxy](/nl/gateway/trusted-proxy-auth) voor de overeenkomstige regel voor
operatorauthenticatie.

## Opslag (lokaal, privé)

De koppelingsstatus bevindt zich in de records van gekoppelde apparaten in de gedeelde SQLite-statusdatabase
onder de statusmap van de Gateway (standaard `~/.openclaw`):

- `~/.openclaw/state/openclaw.sqlite` (gekoppelde apparaten met apparaatauthenticatie,
  goedgekeurde Node-oppervlakken, openstaande oppervlakteverzoeken, openstaande verzoeken om apparaten te
  koppelen en bootstrap-tokens)

Als je `OPENCLAW_STATE_DIR` overschrijft, wordt de database mee verplaatst. Gateways
die zijn bijgewerkt vanaf releases met JSON-opslag, importeren deze bij het opstarten en laten
de archieven `devices/*.json.migrated` en `nodes/*.json.migrated` achter.

Beveiligingsopmerkingen:

- Apparaattokens zijn geheimen; behandel de statusdatabase als gevoelige gegevens.
- Voor het roteren van een apparaattoken gebruik je `openclaw devices rotate` /
  `device.token.rotate`.

## Transportgedrag

- Het transport is **staatloos**; het slaat geen lidmaatschap op.
- Als de Gateway offline is of koppeling is uitgeschakeld, kunnen Nodes niet worden gekoppeld.
- In de externe modus vindt de koppeling plaats met de opslag van de externe Gateway.

## Gerelateerd

- [Kanaalkoppeling](/nl/channels/pairing)
- [Nodes-CLI](/nl/cli/nodes)
- [Apparaten-CLI](/nl/cli/devices)
