---
read_when:
    - Bonjour-detectie/-advertering implementeren of wijzigen
    - Externe verbindingsmodi aanpassen (direct versus SSH)
    - Node-detectie + koppeling ontwerpen voor externe Nodes
summary: Node-detectie en transportmechanismen (Bonjour, Tailscale, SSH) voor het vinden van de Gateway
title: Ontdekking en transporten
x-i18n:
    generated_at: "2026-05-03T21:32:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41a5ed7a910ae4bbdfa21a81882c3b1af0c16622fa20a5e616b666390dccdc9c
    source_path: gateway/discovery.md
    workflow: 16
---

# Detectie & transporten

OpenClaw heeft twee verschillende problemen die oppervlakkig gezien op elkaar lijken:

1. **Externe bediening door operator**: de macOS-menubalkapp die een gateway bestuurt die ergens anders draait.
2. **Node-koppeling**: iOS/Android (en toekomstige nodes) die een gateway vinden en veilig koppelen.

Het ontwerpdoel is om alle netwerkdetectie/-advertising in de **Node Gateway** (`openclaw gateway`) te houden en clients (Mac-app, iOS) als consumenten te houden.

## Termen

- **Gateway**: een enkel langlopend Gateway-proces dat eigenaar is van state (sessies, koppeling, Node-register) en kanalen uitvoert. De meeste setups gebruiken er een per host; geisoleerde multi-Gateway-setups zijn mogelijk.
- **Gateway WS (control plane)**: het WebSocket-eindpunt standaard op `127.0.0.1:18789`; kan via `gateway.bind` aan LAN/tailnet worden gebonden.
- **Direct WS-transport**: een naar LAN/tailnet gericht Gateway WS-eindpunt (geen SSH).
- **SSH-transport (fallback)**: externe bediening door `127.0.0.1:18789` via SSH door te sturen.
- **Verouderde TCP-bridge (verwijderd)**: ouder Node-transport (zie
  [Bridge-protocol](/nl/gateway/bridge-protocol)); wordt niet langer geadverteerd voor
  detectie en maakt geen deel meer uit van huidige builds.

Protocolgegevens:

- [Gateway-protocol](/nl/gateway/protocol)
- [Bridge-protocol (verouderd)](/nl/gateway/bridge-protocol)

## Waarom we zowel "direct" als SSH behouden

- **Direct WS** biedt de beste gebruikerservaring op hetzelfde netwerk en binnen een tailnet:
  - automatische detectie op LAN via Bonjour
  - koppeltokens + ACL's in beheer van de Gateway
  - geen shelltoegang vereist; het protocoloppervlak kan strak en controleerbaar blijven
- **SSH** blijft de universele fallback:
  - werkt overal waar je SSH-toegang hebt (zelfs over niet-gerelateerde netwerken)
  - blijft werken bij multicast-/mDNS-problemen
  - vereist geen nieuwe inkomende poorten naast SSH

## Detectie-invoer (hoe clients leren waar de Gateway is)

### 1) Bonjour-/DNS-SD-detectie

Multicast Bonjour is best-effort en kruist geen netwerken. OpenClaw kan ook naar hetzelfde Gateway-baken zoeken via een geconfigureerd wide-area DNS-SD-domein, zodat detectie het volgende kan dekken:

- `local.` op hetzelfde LAN
- een geconfigureerd unicast DNS-SD-domein voor detectie over netwerken heen

Doelrichting:

- De **Gateway** adverteert zijn WS-eindpunt via Bonjour wanneer de gebundelde
  `bonjour` Plugin is ingeschakeld. De Plugin start automatisch op macOS-hosts en is
  elders opt-in.
- Clients zoeken en tonen een lijst "kies een Gateway" en slaan daarna het gekozen eindpunt op.

Probleemoplossing en bakengegevens: [Bonjour](/nl/gateway/bonjour).

#### Servicebakengegevens

- Servicetypen:
  - `_openclaw-gw._tcp` (Gateway-transportbaken)
- TXT-sleutels (niet-geheim):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (door operator geconfigureerde weergavenaam)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (alleen wanneer TLS is ingeschakeld)
  - `gatewayTlsSha256=<sha256>` (alleen wanneer TLS is ingeschakeld en fingerprint beschikbaar is)
  - `canvasPort=<port>` (canvas-hostpoort; momenteel hetzelfde als `gatewayPort` wanneer de canvas-host is ingeschakeld)
  - `tailnetDns=<magicdns>` (optionele hint; automatisch gedetecteerd wanneer Tailscale beschikbaar is)
  - `sshPort=<port>` (alleen volledige mDNS-modus; wide-area DNS-SD kan dit weglaten, in welk geval SSH-standaarden op `22` blijven)
  - `cliPath=<path>` (alleen volledige mDNS-modus; wide-area DNS-SD schrijft dit nog steeds als remote-install-hint)

Beveiligingsnotities:

- Bonjour-/mDNS-TXT-records zijn **niet geauthenticeerd**. Clients moeten TXT-waarden alleen als UX-hints behandelen.
- Routering (host/poort) moet de voorkeur geven aan het **opgeloste service-eindpunt** (SRV + A/AAAA) boven via TXT aangeleverde `lanHost`, `tailnetDns` of `gatewayPort`.
- TLS-pinning mag nooit toestaan dat een geadverteerde `gatewayTlsSha256` een eerder opgeslagen pin overschrijft.
- iOS-/Android-nodes moeten een expliciete bevestiging "vertrouw deze fingerprint" vereisen voordat een eerste pin wordt opgeslagen (out-of-band-verificatie) wanneer de gekozen route beveiligd/op TLS gebaseerd is.

Inschakelen/uitschakelen/overschrijven:

- `openclaw plugins enable bonjour` schakelt LAN-multicast-advertising in.
- `OPENCLAW_DISABLE_BONJOUR=1` schakelt advertising uit.
- Wanneer de Bonjour Plugin is ingeschakeld en `OPENCLAW_DISABLE_BONJOUR` niet is ingesteld,
  adverteert Bonjour op normale hosts en schakelt het zichzelf automatisch uit binnen gedetecteerde containers.
  Een macOS Gateway-start met lege configuratie schakelt de Plugin automatisch in; Linux,
  Windows en gecontaineriseerde deployments vereisen expliciete inschakeling.
  Gebruik `0` alleen op een host, macvlan of een ander mDNS-geschikt netwerk; gebruik `1` om
  geforceerd uit te schakelen.
- `gateway.bind` in `~/.openclaw/openclaw.json` beheert de bindmodus van de Gateway.
- `OPENCLAW_SSH_PORT` overschrijft de geadverteerde SSH-poort wanneer `sshPort` wordt uitgezonden.
- `OPENCLAW_TAILNET_DNS` publiceert een `tailnetDns`-hint (MagicDNS).
- `OPENCLAW_CLI_PATH` overschrijft het geadverteerde CLI-pad.

### 2) Tailnet (cross-network)

Voor setups in Londen/Wenen-stijl helpt Bonjour niet. Het aanbevolen "directe" doel is:

- Tailscale MagicDNS-naam (voorkeur) of een stabiel tailnet-IP.

Als de Gateway kan detecteren dat hij onder Tailscale draait, publiceert hij `tailnetDns` als optionele hint voor clients (inclusief wide-area bakens).

De macOS-app geeft nu de voorkeur aan MagicDNS-namen boven ruwe Tailscale-IP's voor Gateway-detectie. Dit verbetert de betrouwbaarheid wanneer tailnet-IP's veranderen (bijvoorbeeld na Node-herstarts of CGNAT-herindeling), omdat MagicDNS-namen automatisch naar het huidige IP worden omgezet.

Voor mobiele Node-koppeling versoepelen detectiehints de transportbeveiliging op tailnet-/publieke routes niet:

- iOS/Android vereisen nog steeds een veilig eerste verbindingspad voor tailnet/publiek (`wss://` of Tailscale Serve/Funnel).
- Een ontdekt ruw tailnet-IP is een routeringshint, geen toestemming om plaintext remote `ws://` te gebruiken.
- Private LAN direct-connect `ws://` blijft ondersteund.
- Als je het eenvoudigste Tailscale-pad voor mobiele nodes wilt, gebruik dan Tailscale Serve zodat detectie en de setupcode beide naar hetzelfde veilige MagicDNS-eindpunt resolven.

### 3) Handmatig / SSH-doel

Wanneer er geen directe route is (of direct is uitgeschakeld), kunnen clients altijd via SSH verbinden door de local loopback Gateway-poort door te sturen.

Zie [Externe toegang](/nl/gateway/remote).

## Transportselectie (clientbeleid)

Aanbevolen clientgedrag:

1. Als een gekoppeld direct eindpunt is geconfigureerd en bereikbaar is, gebruik dat.
2. Anders, als detectie een Gateway vindt op `local.` of het geconfigureerde wide-area domein, bied een keuze met een tik "Deze Gateway gebruiken" aan en sla die op als het directe eindpunt.
3. Anders, als een tailnet-DNS/IP is geconfigureerd, probeer direct.
   Voor mobiele nodes op tailnet-/publieke routes betekent direct een veilig eindpunt, geen plaintext remote `ws://`.
4. Anders, val terug op SSH.

## Koppeling + auth (direct transport)

De Gateway is de bron van waarheid voor toelating van nodes/clients.

- Koppelverzoeken worden gemaakt/goedgekeurd/geweigerd in de Gateway (zie [Gateway-koppeling](/nl/gateway/pairing)).
- De Gateway dwingt het volgende af:
  - auth (token / keypair)
  - scopes/ACL's (de Gateway is geen ruwe proxy naar elke methode)
  - rate limits

## Verantwoordelijkheden per component

- **Gateway**: adverteert detectiebakens, is eigenaar van koppelbeslissingen en host het WS-eindpunt.
- **macOS-app**: helpt je een Gateway te kiezen, toont koppelprompts en gebruikt SSH alleen als fallback.
- **iOS-/Android-nodes**: zoeken in Bonjour als gemak en verbinden met de gekoppelde Gateway WS.

## Gerelateerd

- [Externe toegang](/nl/gateway/remote)
- [Tailscale](/nl/gateway/tailscale)
- [Bonjour-detectie](/nl/gateway/bonjour)
