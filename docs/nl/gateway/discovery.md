---
read_when:
    - Bonjour-detectie en -advertering implementeren of wijzigen
    - Externe verbindingsmodi aanpassen (direct versus SSH)
    - Ontwerp van Node-detectie + koppeling voor externe Nodes
summary: Node-detectie en transportmechanismen (Bonjour, Tailscale, SSH) om de Gateway te vinden
title: Detectie en transporten
x-i18n:
    generated_at: "2026-04-29T22:44:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: c396e6e07808e2571c6d7f539922b94443adbf39339027e6e962596c6f13deaa
    source_path: gateway/discovery.md
    workflow: 16
---

# Detectie en transporten

OpenClaw heeft twee afzonderlijke problemen die aan de oppervlakte op elkaar lijken:

1. **Externe bediening door de operator**: de macOS-menubalk-app die een Gateway bestuurt die elders draait.
2. **Node-koppeling**: iOS/Android (en toekomstige nodes) die een Gateway vinden en veilig koppelen.

Het ontwerpdoel is om alle netwerkdetectie/-advertering in de **Node Gateway** (`openclaw gateway`) te houden en clients (mac-app, iOS) consumenten te laten zijn.

## Termen

- **Gateway**: een enkel langlopend Gateway-proces dat eigenaar is van status (sessies, koppeling, node-register) en kanalen uitvoert. De meeste configuraties gebruiken er één per host; geïsoleerde configuraties met meerdere gateways zijn mogelijk.
- **Gateway WS (control plane)**: het WebSocket-eindpunt op standaard `127.0.0.1:18789`; kan via `gateway.bind` aan LAN/tailnet worden gebonden.
- **Direct WS-transport**: een naar LAN/tailnet gericht Gateway WS-eindpunt (geen SSH).
- **SSH-transport (fallback)**: externe bediening door `127.0.0.1:18789` via SSH door te sturen.
- **Verouderde TCP-bridge (verwijderd)**: ouder node-transport (zie
  [Bridge-protocol](/nl/gateway/bridge-protocol)); wordt niet meer geadverteerd voor
  detectie en maakt geen deel meer uit van huidige builds.

Protocoldetails:

- [Gateway-protocol](/nl/gateway/protocol)
- [Bridge-protocol (verouderd)](/nl/gateway/bridge-protocol)

## Waarom we zowel "direct" als SSH behouden

- **Direct WS** biedt de beste UX op hetzelfde netwerk en binnen een tailnet:
  - automatische detectie op LAN via Bonjour
  - koppelingstokens + ACL's die eigendom zijn van de Gateway
  - geen shell-toegang vereist; het protocoloppervlak kan strak en controleerbaar blijven
- **SSH** blijft de universele fallback:
  - werkt overal waar je SSH-toegang hebt (zelfs over niet-gerelateerde netwerken)
  - overleeft multicast-/mDNS-problemen
  - vereist geen nieuwe inkomende poorten naast SSH

## Detectie-invoer (hoe clients leren waar de Gateway is)

### 1) Bonjour- / DNS-SD-detectie

Multicast-Bonjour is best effort en gaat niet over netwerken heen. OpenClaw kan ook naar hetzelfde Gateway-baken bladeren via een geconfigureerd wide-area DNS-SD-domein, zodat detectie het volgende kan dekken:

- `local.` op hetzelfde LAN
- een geconfigureerd unicast DNS-SD-domein voor detectie over netwerken heen

Beoogde richting:

- De **Gateway** adverteert zijn WS-eindpunt via Bonjour.
- Clients bladeren en tonen een lijst "kies een Gateway" en slaan vervolgens het gekozen eindpunt op.

Probleemoplossing en bakendetails: [Bonjour](/nl/gateway/bonjour).

#### Details van servicebaken

- Servicetypen:
  - `_openclaw-gw._tcp` (Gateway-transportbaken)
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
  - `sshPort=<port>` (alleen volledige mDNS-modus; wide-area DNS-SD kan dit weglaten, in welk geval SSH-standaarden op `22` blijven)
  - `cliPath=<path>` (alleen volledige mDNS-modus; wide-area DNS-SD schrijft dit nog steeds als hint voor installatie op afstand)

Beveiligingsnotities:

- Bonjour-/mDNS-TXT-records zijn **niet-geauthenticeerd**. Clients moeten TXT-waarden alleen als UX-hints behandelen.
- Routering (host/poort) moet de voorkeur geven aan het **opgeloste service-eindpunt** (SRV + A/AAAA) boven via TXT opgegeven `lanHost`, `tailnetDns` of `gatewayPort`.
- TLS-pinning mag nooit toestaan dat een geadverteerde `gatewayTlsSha256` een eerder opgeslagen pin overschrijft.
- iOS-/Android-nodes moeten een expliciete bevestiging "vertrouw deze fingerprint" vereisen voordat ze een eerste pin opslaan (out-of-band verificatie) wanneer de gekozen route veilig/op TLS gebaseerd is.

Uitschakelen/overschrijven:

- `OPENCLAW_DISABLE_BONJOUR=1` schakelt adverteren uit.
- Wanneer `OPENCLAW_DISABLE_BONJOUR` niet is ingesteld, adverteert Bonjour op normale hosts
  en schakelt het automatisch uit binnen gedetecteerde containers. Gebruik `0` alleen op host, macvlan,
  of een ander mDNS-capabel netwerk; gebruik `1` om uitschakelen af te dwingen.
- `gateway.bind` in `~/.openclaw/openclaw.json` bepaalt de bindmodus van de Gateway.
- `OPENCLAW_SSH_PORT` overschrijft de geadverteerde SSH-poort wanneer `sshPort` wordt uitgegeven.
- `OPENCLAW_TAILNET_DNS` publiceert een `tailnetDns`-hint (MagicDNS).
- `OPENCLAW_CLI_PATH` overschrijft het geadverteerde CLI-pad.

### 2) Tailnet (over netwerken heen)

Voor configuraties in de stijl Londen/Wenen helpt Bonjour niet. Het aanbevolen "directe" doel is:

- Tailscale MagicDNS-naam (voorkeur) of een stabiel tailnet-IP.

Als de Gateway kan detecteren dat hij onder Tailscale draait, publiceert hij `tailnetDns` als een optionele hint voor clients (inclusief wide-area bakens).

De macOS-app geeft nu de voorkeur aan MagicDNS-namen boven ruwe Tailscale-IP's voor Gateway-detectie. Dit verbetert de betrouwbaarheid wanneer tailnet-IP's veranderen (bijvoorbeeld na node-herstarts of CGNAT-hertoewijzing), omdat MagicDNS-namen automatisch naar het huidige IP verwijzen.

Voor koppeling van mobiele nodes versoepelen detectiehints de transportbeveiliging op tailnet-/openbare routes niet:

- iOS/Android vereisen nog steeds een veilig eerste tailnet-/openbaar verbindingspad (`wss://` of Tailscale Serve/Funnel).
- Een gedetecteerd ruw tailnet-IP is een routeringshint, geen toestemming om externe plaintext `ws://` te gebruiken.
- Private LAN direct-connect `ws://` blijft ondersteund.
- Als je het eenvoudigste Tailscale-pad voor mobiele nodes wilt, gebruik dan Tailscale Serve zodat detectie en de instelcode beide naar hetzelfde veilige MagicDNS-eindpunt verwijzen.

### 3) Handmatig / SSH-doel

Wanneer er geen directe route is (of direct is uitgeschakeld), kunnen clients altijd via SSH verbinden door de loopback-Gateway-poort door te sturen.

Zie [Externe toegang](/nl/gateway/remote).

## Transportselectie (clientbeleid)

Aanbevolen clientgedrag:

1. Als een gekoppeld direct eindpunt is geconfigureerd en bereikbaar is, gebruik dat.
2. Anders, als detectie een Gateway op `local.` of het geconfigureerde wide-area domein vindt, bied een one-tap keuze "Gebruik deze Gateway" aan en sla die op als het directe eindpunt.
3. Anders, als een tailnet-DNS/IP is geconfigureerd, probeer direct.
   Voor mobiele nodes op tailnet-/openbare routes betekent direct een veilig eindpunt, geen externe plaintext `ws://`.
4. Anders, val terug op SSH.

## Koppeling + auth (direct transport)

De Gateway is de source of truth voor toelating van nodes/clients.

- Koppelingsverzoeken worden aangemaakt/goedgekeurd/afgewezen in de Gateway (zie [Gateway-koppeling](/nl/gateway/pairing)).
- De Gateway dwingt af:
  - auth (token / sleutelpaar)
  - scopes/ACL's (de Gateway is geen ruwe proxy naar elke methode)
  - rate limits

## Verantwoordelijkheden per component

- **Gateway**: adverteert detectiebakens, is eigenaar van koppelingsbeslissingen en host het WS-eindpunt.
- **macOS-app**: helpt je een Gateway te kiezen, toont koppelingsprompts en gebruikt SSH alleen als fallback.
- **iOS-/Android-nodes**: bladeren voor gemak door Bonjour en verbinden met de gekoppelde Gateway WS.

## Gerelateerd

- [Externe toegang](/nl/gateway/remote)
- [Tailscale](/nl/gateway/tailscale)
- [Bonjour-detectie](/nl/gateway/bonjour)
