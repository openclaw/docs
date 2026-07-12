---
read_when:
    - Bonjour-detectie/-advertenties implementeren of wijzigen
    - Verbindingsmodi op afstand aanpassen (direct versus SSH)
    - Node-detectie en -koppeling voor externe nodes ontwerpen
summary: Node-detectie en transportmethoden (Bonjour, Tailscale, SSH) om de Gateway te vinden
title: Detectie en transporten
x-i18n:
    generated_at: "2026-07-12T08:52:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a3f1a6a1212ab0bc7021e77c88de059edcb8e09eff90d3e1e59451b9b20876b
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw heeft twee gerelateerde maar afzonderlijke detectievraagstukken:

1. **Externe bediening door de beheerder**: de macOS-menubalkapp die een Gateway bestuurt die elders draait.
2. **Node-koppeling**: iOS/Android (en toekomstige Nodes) die een Gateway zoeken en veilig koppelen.

Alle netwerkdetectie en -advertenties bevinden zich in de **Node Gateway**
(`openclaw gateway`); clients (Mac-app, iOS) zijn uitsluitend afnemers.

## Termen

- **Gateway**: één langlopend proces dat de status beheert (sessies,
  koppelingen, Node-register) en kanalen uitvoert. De meeste configuraties gebruiken er één per host;
  geïsoleerde configuraties met meerdere Gateways zijn mogelijk.
- **Gateway-WS (besturingslaag)**: het WebSocket-eindpunt, standaard op `127.0.0.1:18789`;
  bind dit via `gateway.bind` aan het LAN/de tailnet.
- **Rechtstreeks WS-transport**: een Gateway-WS-eindpunt dat toegankelijk is vanaf het LAN/de tailnet (zonder SSH).
- **SSH-transport (terugvaloptie)**: externe bediening door
  `127.0.0.1:18789` door te sturen via SSH.
- **Verouderde TCP-bridge (verwijderd)**: ouder Node-transport (zie
  [Bridge-protocol](/nl/gateway/bridge-protocol)); wordt niet meer geadverteerd voor
  detectie en maakt geen deel meer uit van huidige builds.

Protocoldetails: [Gateway-protocol](/nl/gateway/protocol),
[Bridge-protocol (verouderd)](/nl/gateway/bridge-protocol).

## Waarom zowel rechtstreeks transport als SSH bestaan

- **Rechtstreeks WS** biedt de beste gebruikerservaring op hetzelfde netwerk en binnen een tailnet: automatische LAN-detectie
  via Bonjour, koppelingstokens en ACL's die door de Gateway worden beheerd,
  en geen vereiste shelltoegang.
- **SSH** is de universele terugvaloptie: werkt overal waar u SSH-toegang hebt, zelfs
  tussen niet-gerelateerde netwerken, blijft werken bij problemen met multicast/mDNS en vereist naast SSH geen nieuwe
  inkomende poort.

## Detectie-invoer

### 1) Bonjour / DNS-SD

Multicast-Bonjour werkt op basis van optimale inspanning en overschrijdt geen netwerkgrenzen. OpenClaw ondersteunt ook
het zoeken naar hetzelfde Gateway-baken via een geconfigureerd domein voor wide-area DNS-SD,
zodat detectie zowel `local.` op hetzelfde LAN als een geconfigureerd
unicast-DNS-SD-domein voor detectie tussen netwerken kan omvatten.

De **Gateway** adverteert zijn WS-eindpunt via Bonjour wanneer de meegeleverde
`bonjour`-Plugin is ingeschakeld; clients zoeken en tonen een lijst om een Gateway te kiezen,
en slaan vervolgens het gekozen eindpunt op.

Probleemoplossing en details over het baken: [Bonjour](/nl/gateway/bonjour).

#### Details van het servicebaken

- Servicetype: `_openclaw-gw._tcp` (transportbaken van de Gateway).
- TXT-sleutels (niet-geheim):

  | Sleutel                      | Opmerkingen                                                                                                                                                       |
  | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `role=gateway`              | Altijd aanwezig.                                                                                                                                                 |
  | `transport=gateway`         | Altijd aanwezig.                                                                                                                                                 |
  | `displayName=<name>`        | Door de beheerder geconfigureerde weergavenaam.                                                                                                                  |
  | `lanHost=<hostname>.local`  | Alleen voor de LAN-mDNS-adverteerder; wordt niet door wide-area DNS-SD geschreven.                                                                                |
  | `gatewayPort=18789`         | Poort voor Gateway-WS en HTTP.                                                                                                                                   |
  | `gatewayTls=1`              | Alleen wanneer TLS is ingeschakeld.                                                                                                                              |
  | `gatewayTlsSha256=<sha256>` | Alleen wanneer TLS is ingeschakeld en een vingerafdruk beschikbaar is.                                                                                           |
  | `tailnetDns=<magicdns>`     | Optionele aanwijzing; wordt automatisch gedetecteerd wanneer Tailscale beschikbaar is.                                                                           |
  | `sshPort=<port>`            | Alleen aanwezig wanneer `discovery.mdns.mode="full"`; weggelaten (SSH gebruikt standaard `22`) in de standaardmodus `"minimal"`, zowel in de LAN-adverteerder als in wide-area DNS-SD. |
  | `cliPath=<path>`            | Dezelfde voorwaarde `discovery.mdns.mode="full"` als voor `sshPort`; een aanwijzing voor installaties op afstand naar het CLI-pad.                                |

  In het detectiecontract van de Plugin is een TXT-sleutel `canvasPort` gedefinieerd voor een
  toekomstige hostpoort voor canvas, maar geen huidig codepad stelt een waarde in, waardoor deze
  momenteel nooit wordt uitgezonden.

Beveiligingsopmerkingen:

- Bonjour/mDNS-TXT-records zijn **niet-geverifieerd**. Clients moeten TXT-waarden
  uitsluitend als aanwijzingen voor de gebruikerservaring behandelen.
- Voor routering (host/poort) moet de voorkeur uitgaan naar het **opgeloste service-eindpunt**
  (SRV + A/AAAA) boven via TXT verstrekte waarden voor `lanHost`, `tailnetDns` of `gatewayPort`.
- Bij TLS-pinning mag een geadverteerde `gatewayTlsSha256` nooit een
  eerder opgeslagen pin overschrijven.
- iOS/Android-Nodes moeten een expliciete bevestiging "vertrouw deze vingerafdruk"
  vereisen voordat een nieuwe pin wordt opgeslagen (verificatie buiten het communicatiekanaal),
  wanneer de gekozen route beveiligd of op TLS gebaseerd is.

Inschakelen, uitschakelen en overschrijven:

- `openclaw plugins enable bonjour` schakelt LAN-multicastadvertenties in.
- `discovery.mdns.mode` in `openclaw.json` regelt mDNS-uitzendingen:
  `"minimal"` (standaard), `"full"` (voegt `cliPath`/`sshPort` toe aan zowel het LAN-baken
  als elke wide-area DNS-SD-zone), of `"off"` (schakelt mDNS uit).
- `OPENCLAW_DISABLE_BONJOUR=1` schakelt advertenties geforceerd uit; `discovery.mdns.mode="off"`
  schakelt deze onafhankelijk uit. `OPENCLAW_DISABLE_BONJOUR=0` is een expliciete
  inschakeling die het automatisch uitschakelen van de Plugin binnen een gedetecteerde container
  (Docker, containerd, Kubernetes, LXC) overschrijft; dit overschrijft
  `discovery.mdns.mode="off"` niet. De meegeleverde `bonjour`-Plugin start automatisch op
  macOS-hosts (`enabledByDefaultOnPlatforms: ["darwin"]`) en schakelt zichzelf automatisch uit
  binnen gedetecteerde containers; Linux, Windows en andere gecontaineriseerde
  implementaties moeten de Plugin expliciet inschakelen met `plugins enable bonjour`.
- `gateway.bind` in `~/.openclaw/openclaw.json` regelt de bindmodus van de Gateway.
- `OPENCLAW_SSH_PORT` overschrijft de geadverteerde SSH-poort (wordt alleen van kracht
  wanneer `discovery.mdns.mode="full"`).
- `OPENCLAW_TAILNET_DNS` publiceert een `tailnetDns`-aanwijzing (MagicDNS).
- `OPENCLAW_CLI_PATH` overschrijft het geadverteerde CLI-pad.

### 2) Tailnet (tussen netwerken)

Voor Gateways op verschillende fysieke netwerken helpt Bonjour niet. Het
aanbevolen rechtstreekse doel is een Tailscale MagicDNS-naam (voorkeur) of een
stabiel tailnet-IP-adres.

Als de Gateway detecteert dat deze onder Tailscale draait, publiceert deze
`tailnetDns` als optionele aanwijzing voor clients (ook in wide-area-bakens).
De macOS-app geeft voor Gateway-detectie de voorkeur aan MagicDNS-namen boven onbewerkte Tailscale-IP-adressen,
wat betrouwbaar blijft wanneer tailnet-IP-adressen veranderen (herstarts van Nodes,
CGNAT-hertoewijzing), omdat MagicDNS automatisch naar het huidige IP-adres verwijst.

Voor koppeling van mobiele Nodes versoepelen detectieaanwijzingen de transportbeveiliging op
tailnet-/openbare routes nooit:

- iOS/Android vereisen nog steeds een beveiligd eerste verbindingspad via tailnet/openbaar netwerk
  (`wss://` of Tailscale Serve/Funnel).
- Een gedetecteerd onbewerkt tailnet-IP-adres is een routeringsaanwijzing, geen toestemming om
  onbeveiligd extern `ws://` te gebruiken.
- Rechtstreeks verbinden via `ws://` op een privé-LAN blijft ondersteund.
- Gebruik voor de eenvoudigste Tailscale-route op mobiele Nodes Tailscale Serve, zodat
  detectie en configuratie beide naar hetzelfde beveiligde MagicDNS-eindpunt verwijzen.

### 3) Handmatig / SSH-doel

Wanneer er geen rechtstreekse route is (of rechtstreeks transport is uitgeschakeld), kunnen clients altijd
verbinding maken via SSH door de local loopback-poort van de Gateway door te sturen. Zie
[Externe toegang](/nl/gateway/remote).

## Transportselectie (clientbeleid)

1. Als een gekoppeld rechtstreeks eindpunt is geconfigureerd en bereikbaar is, gebruikt u dit.
2. Anders, als detectie een Gateway vindt op `local.` of het geconfigureerde wide-area-
   domein, biedt u met één tik de keuze "Gebruik deze Gateway" aan en slaat u deze op als het
   rechtstreekse eindpunt.
3. Anders, als een tailnet-DNS/IP is geconfigureerd, probeert u rechtstreeks verbinding te maken. Voor mobiele Nodes op
   tailnet-/openbare routes betekent rechtstreeks een beveiligd eindpunt, niet onbeveiligd
   extern `ws://`.
4. Anders valt u terug op SSH.

## Koppeling en verificatie (rechtstreeks transport)

De Gateway is de bron van waarheid voor toelating van Nodes/clients:

- Koppelingsverzoeken worden in de Gateway aangemaakt/goedgekeurd/afgewezen (zie
  [Gateway-koppeling](/nl/gateway/pairing)).
- De Gateway dwingt verificatie (token/sleutelpaar), bereiken/ACL's (het is geen onbewerkte
  proxy naar elke methode) en snelheidslimieten af.

## Verantwoordelijkheden per onderdeel

- **Gateway**: adverteert detectiebakens, beheert koppelingsbeslissingen en host
  het WS-eindpunt.
- **macOS-app**: helpt u een Gateway te kiezen, toont koppelingsverzoeken en gebruikt SSH
  uitsluitend als terugvaloptie.
- **iOS/Android-Nodes**: zoeken voor het gemak via Bonjour en maken verbinding met de
  gekoppelde Gateway-WS.

## Gerelateerd

- [Externe toegang](/nl/gateway/remote)
- [Tailscale](/nl/gateway/tailscale)
- [Bonjour-detectie](/nl/gateway/bonjour)
