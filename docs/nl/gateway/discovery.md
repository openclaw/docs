---
read_when:
    - Bonjour-detectie/advertering implementeren of wijzigen
    - Externe verbindingsmodi aanpassen (direct versus SSH)
    - Ontwerp van node-ontdekking + koppeling voor externe nodes
summary: Node-detectie en transporten (Bonjour, Tailscale, SSH) om de Gateway te vinden
title: Detectie en transporten
x-i18n:
    generated_at: "2026-05-06T09:13:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f53e1292d9e5b402186c48c777e7e665c790981a64679c783ae8d8a1f170ee1
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw heeft twee verschillende problemen die aan de oppervlakte op elkaar lijken:

1. **Externe bediening door operator**: de macOS-menubalkapp die een Gateway bestuurt die elders draait.
2. **Node-koppeling**: iOS/Android (en toekomstige nodes) die een Gateway vinden en veilig koppelen.

Het ontwerpdoel is om alle netwerkdetectie/advertering in de **Node Gateway** (`openclaw gateway`) te houden en clients (Mac-app, iOS) als consumenten te houden.

## Termen

- **Gateway**: een enkel langlopend Gateway-proces dat eigenaar is van state (sessies, koppeling, node-register) en kanalen uitvoert. De meeste setups gebruiken er een per host; geisoleerde setups met meerdere Gateways zijn mogelijk.
- **Gateway WS (besturingsvlak)**: het WebSocket-eindpunt standaard op `127.0.0.1:18789`; kan aan LAN/tailnet worden gebonden via `gateway.bind`.
- **Direct WS-transport**: een Gateway WS-eindpunt gericht op LAN/tailnet (geen SSH).
- **SSH-transport (terugvaloptie)**: externe bediening door `127.0.0.1:18789` via SSH door te sturen.
- **Verouderde TCP-brug (verwijderd)**: ouder node-transport (zie
  [Brugprotocol](/nl/gateway/bridge-protocol)); wordt niet langer geadverteerd voor
  detectie en maakt geen deel meer uit van huidige builds.

Protocoldetails:

- [Gateway-protocol](/nl/gateway/protocol)
- [Brugprotocol (verouderd)](/nl/gateway/bridge-protocol)

## Waarom we zowel direct als SSH behouden

- **Direct WS** biedt de beste UX op hetzelfde netwerk en binnen een tailnet:
  - automatische detectie op LAN via Bonjour
  - koppelingstokens + ACL's beheerd door de Gateway
  - geen shelltoegang vereist; het protocoloppervlak kan strak en controleerbaar blijven
- **SSH** blijft de universele terugvaloptie:
  - werkt overal waar je SSH-toegang hebt (zelfs over niet-gerelateerde netwerken)
  - blijft werken bij multicast-/mDNS-problemen
  - vereist geen nieuwe inkomende poorten naast SSH

## Detectie-inputs (hoe clients leren waar de Gateway is)

### 1) Bonjour- / DNS-SD-detectie

Multicast Bonjour is best effort en werkt niet over netwerken heen. OpenClaw kan ook dezelfde Gateway-beacon doorzoeken via een geconfigureerd wide-area DNS-SD-domein, zodat detectie het volgende kan dekken:

- `local.` op hetzelfde LAN
- een geconfigureerd unicast DNS-SD-domein voor detectie over netwerken heen

Doelrichting:

- De **Gateway** adverteert zijn WS-eindpunt via Bonjour wanneer de gebundelde
  `bonjour`-Plugin is ingeschakeld. De Plugin start automatisch op macOS-hosts en is
  elders opt-in.
- Clients bladeren en tonen een lijst "kies een Gateway" en slaan daarna het gekozen eindpunt op.

Details voor probleemoplossing en beacons: [Bonjour](/nl/gateway/bonjour).

#### Servicebeacondetails

- Servicetypen:
  - `_openclaw-gw._tcp` (Gateway-transportbeacon)
- TXT-sleutels (niet geheim):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (door operator geconfigureerde weergavenaam)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (alleen wanneer TLS is ingeschakeld)
  - `gatewayTlsSha256=<sha256>` (alleen wanneer TLS is ingeschakeld en de fingerprint beschikbaar is)
  - `canvasPort=<port>` (canvas-hostpoort; momenteel hetzelfde als `gatewayPort` wanneer de canvas-host is ingeschakeld)
  - `tailnetDns=<magicdns>` (optionele hint; automatisch gedetecteerd wanneer Tailscale beschikbaar is)
  - `sshPort=<port>` (alleen mDNS-volledige modus; wide-area DNS-SD kan dit weglaten, in welk geval SSH-standaarden op `22` blijven)
  - `cliPath=<path>` (alleen mDNS-volledige modus; wide-area DNS-SD schrijft dit nog steeds als remote-install-hint)

Beveiligingsopmerkingen:

- Bonjour-/mDNS-TXT-records zijn **niet geauthenticeerd**. Clients moeten TXT-waarden alleen als UX-hints behandelen.
- Routing (host/poort) moet de voorkeur geven aan het **opgeloste service-eindpunt** (SRV + A/AAAA) boven door TXT geleverde `lanHost`, `tailnetDns` of `gatewayPort`.
- TLS-pinning mag nooit toestaan dat een geadverteerde `gatewayTlsSha256` een eerder opgeslagen pin overschrijft.
- iOS-/Android-nodes moeten een expliciete bevestiging "vertrouw deze fingerprint" vereisen voordat een eerste pin wordt opgeslagen (out-of-band verificatie) wanneer de gekozen route veilig/op TLS gebaseerd is.

Inschakelen/uitschakelen/overschrijven:

- `openclaw plugins enable bonjour` schakelt LAN-multicastadvertenties in.
- `OPENCLAW_DISABLE_BONJOUR=1` schakelt advertering uit.
- Wanneer de Bonjour-Plugin is ingeschakeld en `OPENCLAW_DISABLE_BONJOUR` niet is ingesteld,
  adverteert Bonjour op normale hosts en schakelt automatisch uit binnen gedetecteerde containers.
  Opstarten van de macOS-Gateway met lege configuratie schakelt de Plugin automatisch in; Linux,
  Windows en containerized deployments moeten expliciet worden ingeschakeld.
  Gebruik `0` alleen op host, macvlan of een ander mDNS-geschikt netwerk; gebruik `1` om
  uitschakeling af te dwingen.
- `gateway.bind` in `~/.openclaw/openclaw.json` beheert de Gateway-bindmodus.
- `OPENCLAW_SSH_PORT` overschrijft de geadverteerde SSH-poort wanneer `sshPort` wordt uitgestuurd.
- `OPENCLAW_TAILNET_DNS` publiceert een `tailnetDns`-hint (MagicDNS).
- `OPENCLAW_CLI_PATH` overschrijft het geadverteerde CLI-pad.

### 2) Tailnet (over netwerken heen)

Voor setups in de stijl Londen/Wenen helpt Bonjour niet. Het aanbevolen "directe" doel is:

- Tailscale MagicDNS-naam (voorkeur) of een stabiel tailnet-IP.

Als de Gateway kan detecteren dat deze onder Tailscale draait, publiceert deze `tailnetDns` als een optionele hint voor clients (inclusief wide-area beacons).

De macOS-app geeft nu de voorkeur aan MagicDNS-namen boven ruwe Tailscale-IP's voor Gateway-detectie. Dit verbetert de betrouwbaarheid wanneer tailnet-IP's wijzigen (bijvoorbeeld na node-herstarts of CGNAT-hertoewijzing), omdat MagicDNS-namen automatisch naar het huidige IP verwijzen.

Voor koppeling van mobiele nodes versoepelen detectiehints de transportbeveiliging op tailnet-/publieke routes niet:

- iOS/Android vereisen nog steeds een veilig eerste tailnet-/publiek verbindingspad (`wss://` of Tailscale Serve/Funnel).
- Een ontdekt ruw tailnet-IP is een routinghint, geen toestemming om plaintext externe `ws://` te gebruiken.
- Private LAN-direct-connect `ws://` blijft ondersteund.
- Als je het eenvoudigste Tailscale-pad voor mobiele nodes wilt, gebruik Tailscale Serve zodat detectie en de setupcode beide naar hetzelfde veilige MagicDNS-eindpunt verwijzen.

### 3) Handmatig / SSH-doel

Wanneer er geen directe route is (of direct is uitgeschakeld), kunnen clients altijd via SSH verbinden door de loopback-Gateway-poort door te sturen.

Zie [Externe toegang](/nl/gateway/remote).

## Transportselectie (clientbeleid)

Aanbevolen clientgedrag:

1. Als een gekoppeld direct eindpunt is geconfigureerd en bereikbaar is, gebruik dat.
2. Anders, als detectie een Gateway vindt op `local.` of het geconfigureerde wide-area domein, bied een een-tik-keuze "Deze Gateway gebruiken" aan en sla die op als het directe eindpunt.
3. Anders, als een tailnet-DNS/IP is geconfigureerd, probeer direct.
   Voor mobiele nodes op tailnet-/publieke routes betekent direct een veilig eindpunt, geen plaintext externe `ws://`.
4. Anders, val terug op SSH.

## Koppeling + auth (direct transport)

De Gateway is de bron van waarheid voor toelating van nodes/clients.

- Koppelingsverzoeken worden in de Gateway aangemaakt/goedgekeurd/geweigerd (zie [Gateway-koppeling](/nl/gateway/pairing)).
- De Gateway dwingt het volgende af:
  - auth (token / sleutelpaar)
  - scopes/ACL's (de Gateway is geen ruwe proxy naar elke methode)
  - rate limits

## Verantwoordelijkheden per component

- **Gateway**: adverteert detectiebeacons, beheert koppelingsbeslissingen en host het WS-eindpunt.
- **macOS-app**: helpt je een Gateway te kiezen, toont koppelingsprompts en gebruikt SSH alleen als terugvaloptie.
- **iOS-/Android-nodes**: bladeren door Bonjour voor gemak en verbinden met de gekoppelde Gateway WS.

## Gerelateerd

- [Externe toegang](/nl/gateway/remote)
- [Tailscale](/nl/gateway/tailscale)
- [Bonjour-detectie](/nl/gateway/bonjour)
