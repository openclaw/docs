---
read_when:
    - Foutopsporing van Bonjour-detectieproblemen op macOS/iOS
    - mDNS-servicetypen, TXT-records of detectie-UX wijzigen
summary: Bonjour/mDNS-detectie + foutopsporing (Gateway-bakens, clients en veelvoorkomende storingsmodi)
title: Bonjour-detectie
x-i18n:
    generated_at: "2026-05-11T20:29:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03bd9403591a389c06d3131e4c110d4ccf711eee56cbe9a5c9baed2b6df8fb80
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw kan Bonjour (mDNS / DNS-SD) gebruiken om een actieve Gateway (WebSocket-endpoint) te ontdekken.
Multicast `local.`-browsen is een **LAN-only gemak**. De meegeleverde `bonjour`
plugin beheert LAN-adverteren. Deze start automatisch op macOS-hosts en is opt-in op
Linux, Windows en gecontaineriseerde Gateway-deployments. Voor ontdekking over netwerken heen kan dezelfde
beacon ook worden gepubliceerd via een geconfigureerd wide-area DNS-SD-domein. Discovery
blijft best-effort en vervangt **niet** connectiviteit via SSH of Tailnet.

## Wide-area Bonjour (Unicast DNS-SD) via Tailscale

Als de node en Gateway zich op verschillende netwerken bevinden, gaat multicast mDNS niet over de
grens heen. Je kunt dezelfde discovery-UX behouden door over te schakelen naar **unicast DNS-SD**
("Wide-Area Bonjour") via Tailscale.

Stappen op hoofdlijnen:

1. Voer een DNS-server uit op de Gateway-host (bereikbaar via Tailnet).
2. Publiceer DNS-SD-records voor `_openclaw-gw._tcp` onder een toegewezen zone
   (voorbeeld: `openclaw.internal.`).
3. Configureer Tailscale **split DNS** zodat je gekozen domein via die
   DNS-server wordt opgelost voor clients (inclusief iOS).

OpenClaw ondersteunt elk discovery-domein; `openclaw.internal.` is slechts een voorbeeld.
iOS-/Android-nodes browsen zowel `local.` als je geconfigureerde wide-area domein.

### Gateway-configuratie (aanbevolen)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### Eenmalige DNS-serverconfiguratie (Gateway-host)

```bash
openclaw dns setup --apply
```

Dit installeert CoreDNS en configureert deze om:

- alleen op poort 53 te luisteren op de Tailscale-interfaces van de Gateway
- je gekozen domein (voorbeeld: `openclaw.internal.`) te serveren vanuit `~/.openclaw/dns/<domain>.db`

Valideer vanaf een machine die met de Tailnet is verbonden:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale-DNS-instellingen

In de Tailscale-beheerconsole:

- Voeg een nameserver toe die naar het Tailnet-IP van de Gateway wijst (UDP/TCP 53).
- Voeg split DNS toe zodat je discovery-domein die nameserver gebruikt.

Zodra clients Tailnet-DNS accepteren, kunnen iOS-nodes en CLI-discovery
`_openclaw-gw._tcp` in je discovery-domein browsen zonder multicast.

### Beveiliging van Gateway-listener (aanbevolen)

De Gateway-WS-poort (standaard `18789`) bindt standaard aan loopback. Voor LAN-/Tailnet-
toegang bind je expliciet en houd je auth ingeschakeld.

Voor tailnet-only setups:

- Stel `gateway.bind: "tailnet"` in `~/.openclaw/openclaw.json` in.
- Herstart de Gateway (of herstart de macOS-menubalk-app).

## Wat adverteert

Alleen de Gateway adverteert `_openclaw-gw._tcp`. LAN-multicast-adverteren wordt
geleverd door de meegeleverde `bonjour` plugin wanneer de plugin is ingeschakeld; wide-area
DNS-SD-publicatie blijft eigendom van de Gateway.

## Servicetypen

- `_openclaw-gw._tcp` - transportbeacon van de Gateway (gebruikt door macOS-/iOS-/Android-nodes).

## TXT-sleutels (niet-geheime hints)

De Gateway adverteert kleine niet-geheime hints om UI-flows handig te maken:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (alleen wanneer TLS is ingeschakeld)
- `gatewayTlsSha256=<sha256>` (alleen wanneer TLS is ingeschakeld en fingerprint beschikbaar is)
- `canvasPort=<port>` (alleen wanneer de canvas-host is ingeschakeld; momenteel hetzelfde als `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (alleen mDNS full-modus, optionele hint wanneer Tailnet beschikbaar is)
- `sshPort=<port>` (alleen mDNS full-modus; wide-area DNS-SD kan dit weglaten)
- `cliPath=<path>` (alleen mDNS full-modus; wide-area DNS-SD schrijft dit nog steeds als remote-install-hint)

Beveiligingsnotities:

- Bonjour-/mDNS-TXT-records zijn **niet geauthenticeerd**. Clients mogen TXT niet behandelen als gezaghebbende routering.
- Clients moeten routeren met het opgeloste service-endpoint (SRV + A/AAAA). Behandel `lanHost`, `tailnetDns`, `gatewayPort` en `gatewayTlsSha256` alleen als hints.
- SSH-auto-targeting moet eveneens de opgeloste servicehost gebruiken, niet alleen TXT-hints.
- TLS-pinning mag nooit toestaan dat een geadverteerde `gatewayTlsSha256` een eerder opgeslagen pin overschrijft.
- iOS-/Android-nodes moeten discovery-gebaseerde directe verbindingen als **alleen TLS** behandelen en expliciete gebruikersbevestiging vereisen voordat ze een eerste fingerprint vertrouwen.

## Debuggen op macOS

Handige ingebouwde tools:

- Instanties browsen:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Eén instantie oplossen (vervang `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Als browsen werkt maar oplossen mislukt, loop je meestal tegen een LAN-beleid of
mDNS-resolverprobleem aan.

## Debuggen in Gateway-logs

De Gateway schrijft een roterend logbestand (bij opstarten afgedrukt als
`gateway log file: ...`). Zoek naar `bonjour:`-regels, vooral:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

De watchdog behandelt actieve `probing`, `announcing` en recente conflict-hernoemingen als
lopende statussen. Als de service nooit `announced` bereikt, maakt OpenClaw uiteindelijk
de advertiser opnieuw aan en schakelt, na herhaalde fouten, Bonjour uit voor dat
Gateway-proces in plaats van eindeloos opnieuw te adverteren.

Bonjour gebruikt de systeemhostnaam voor de geadverteerde `.local`-host wanneer deze een
geldig DNS-label is. Als de systeemhostnaam spaties, underscores of een ander
ongeldig DNS-labelteken bevat, valt OpenClaw terug op `openclaw.local`. Stel
`OPENCLAW_MDNS_HOSTNAME=<name>` in voordat je de Gateway start wanneer je een
expliciet hostlabel nodig hebt.

## Debuggen op iOS-node

De iOS-node gebruikt `NWBrowser` om `_openclaw-gw._tcp` te ontdekken.

Logs vastleggen:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → reproduce → **Copy**

Het log bevat browserstatusovergangen en wijzigingen in de resultatenset.

## Wanneer Bonjour inschakelen

Bonjour start automatisch bij het opstarten van de Gateway met lege configuratie op macOS-hosts, omdat de
lokale app en nabije iOS-/Android-nodes vaak afhankelijk zijn van discovery op hetzelfde LAN.

Schakel Bonjour expliciet in wanneer auto-discovery op hetzelfde LAN nuttig is op Linux,
Windows of een andere niet-macOS-host:

```bash
openclaw plugins enable bonjour
```

Wanneer ingeschakeld gebruikt Bonjour `discovery.mdns.mode` om te bepalen hoeveel TXT-metadata
wordt gepubliceerd. De standaardmodus is `minimal`; gebruik `full` alleen wanneer lokale clients
`cliPath`- of `sshPort`-hints nodig hebben, en gebruik `off` om LAN-multicast te onderdrukken zonder
plugininschakeling te wijzigen.

## Wanneer Bonjour uitschakelen

Laat Bonjour uitgeschakeld wanneer LAN-multicast-adverteren onnodig, niet beschikbaar
of schadelijk is. Veelvoorkomende gevallen zijn niet-macOS-servers, Docker-bridgenetwerken,
WSL of een netwerkbeleid dat mDNS-multicast dropt. In die omgevingen is de
Gateway nog steeds bereikbaar via de gepubliceerde URL, SSH, Tailnet of wide-area
DNS-SD, maar LAN-auto-discovery is niet betrouwbaar.

Gebruik bij voorkeur de bestaande omgevings-override wanneer het probleem deployment-gebonden is:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Dat schakelt LAN-multicast-adverteren uit zonder de pluginconfiguratie te wijzigen.
Het is veilig voor Docker-images, servicebestanden, launch-scripts en eenmalige
debugging, omdat de instelling verdwijnt wanneer de omgeving dat doet.

Gebruik pluginconfiguratie wanneer je de meegeleverde LAN-discovery-plugin bewust wilt uitschakelen
voor die OpenClaw-configuratie:

```bash
openclaw plugins disable bonjour
```

## Docker-valkuilen

De meegeleverde Bonjour-plugin schakelt LAN-multicast-adverteren automatisch uit in gedetecteerde
containers wanneer `OPENCLAW_DISABLE_BONJOUR` niet is ingesteld. Docker-bridgenetwerken
sturen mDNS-multicast (`224.0.0.251:5353`) meestal niet door tussen de container
en het LAN, dus adverteren vanuit de container zorgt zelden dat discovery werkt.

Belangrijke valkuilen:

- Bonjour start automatisch op macOS-hosts en is elders opt-in. Het uitgeschakeld laten
  stopt de Gateway niet; het slaat alleen LAN-multicast-adverteren over.
- Bonjour uitschakelen wijzigt `gateway.bind` niet; Docker gebruikt nog steeds standaard
  `OPENCLAW_GATEWAY_BIND=lan` zodat de gepubliceerde hostpoort kan werken.
- Bonjour uitschakelen schakelt wide-area DNS-SD niet uit. Gebruik wide-area discovery
  of Tailnet wanneer de Gateway en node zich niet op hetzelfde LAN bevinden.
- Hetzelfde `OPENCLAW_CONFIG_DIR` buiten Docker hergebruiken behoudt het
  container-auto-disable-beleid niet.
- Stel `OPENCLAW_DISABLE_BONJOUR=0` alleen in voor host networking, macvlan of een ander
  netwerk waarvan bekend is dat mDNS-multicast passeert; stel het in op `1` om uitschakeling af te dwingen.

## Problemen oplossen met uitgeschakelde Bonjour

Als een node de Gateway niet langer automatisch ontdekt na Docker-configuratie:

1. Bevestig of de Gateway draait in auto-, forced-on- of forced-off-modus:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Bevestig dat de Gateway zelf bereikbaar is via de gepubliceerde poort:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Gebruik een direct target wanneer Bonjour is uitgeschakeld:
   - Control UI of lokale tools: `http://127.0.0.1:18789`
   - LAN-clients: `http://<gateway-host>:18789`
   - Cross-network clients: Tailnet MagicDNS, Tailnet-IP, SSH-tunnel of
     wide-area DNS-SD

4. Als je de Bonjour-plugin in Docker bewust hebt ingeschakeld en adverteren hebt afgedwongen
   met `OPENCLAW_DISABLE_BONJOUR=0`, test dan multicast vanaf de host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Als browsen leeg is of de Gateway-logs herhaalde ciao-watchdog-
   annuleringen tonen, herstel dan `OPENCLAW_DISABLE_BONJOUR=1` en gebruik een directe of
   Tailnet-route.

## Veelvoorkomende foutmodi

- **Bonjour gaat niet over netwerken heen**: gebruik Tailnet of SSH.
- **Multicast geblokkeerd**: sommige Wi-Fi-netwerken schakelen mDNS uit.
- **Advertiser vast in probing/announcing**: hosts met geblokkeerde multicast,
  containerbridges, WSL of interfaceverloop kunnen de ciao-advertiser in een
  niet-aangekondigde staat laten. OpenClaw probeert het een paar keer opnieuw en schakelt Bonjour daarna
  uit voor het huidige Gateway-proces in plaats van de advertiser eindeloos te herstarten.
- **Docker-bridgenetwerken**: Bonjour schakelt automatisch uit in gedetecteerde containers.
  Stel `OPENCLAW_DISABLE_BONJOUR=0` alleen in voor host, macvlan of een ander
  mDNS-capabel netwerk.
- **Slaapstand / interfaceverloop**: macOS kan mDNS-resultaten tijdelijk laten wegvallen; probeer opnieuw.
- **Browsen werkt maar oplossen mislukt**: houd machinenamen eenvoudig (vermijd emoji's of
  leestekens) en herstart daarna de Gateway. De service-instantienaam wordt afgeleid van
  de hostnaam, dus te complexe namen kunnen sommige resolvers in verwarring brengen.

## Geëscapete instantienamen (`\032`)

Bonjour/DNS-SD escapet bytes in service-instantienamen vaak als decimale `\DDD`-
reeksen (bijv. spaties worden `\032`).

- Dit is normaal op protocolniveau.
- UI's moeten decoderen voor weergave (iOS gebruikt `BonjourEscapes.decode`).

## Inschakelen / uitschakelen / configuratie

- macOS-hosts starten standaard automatisch de gebundelde Plugin voor LAN-detectie.
- `openclaw plugins enable bonjour` schakelt de gebundelde Plugin voor LAN-detectie in op hosts waar deze niet standaard is ingeschakeld.
- `openclaw plugins disable bonjour` schakelt LAN-multicast-advertenties uit door de gebundelde Plugin uit te schakelen.
- `OPENCLAW_DISABLE_BONJOUR=1` schakelt LAN-multicast-advertenties uit zonder de Plugin-configuratie te wijzigen; geaccepteerde truthy waarden zijn `1`, `true`, `yes` en `on` (verouderd: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` forceert LAN-multicast-advertenties aan, ook binnen gedetecteerde containers; geaccepteerde falsy waarden zijn `0`, `false`, `no` en `off`.
- Wanneer de Bonjour-Plugin is ingeschakeld en `OPENCLAW_DISABLE_BONJOUR` niet is ingesteld, adverteert Bonjour op normale hosts en schakelt het zichzelf automatisch uit binnen gedetecteerde containers.
- `gateway.bind` in `~/.openclaw/openclaw.json` beheert de bindmodus van de Gateway.
- `OPENCLAW_SSH_PORT` overschrijft de SSH-poort wanneer `sshPort` wordt geadverteerd (verouderd: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publiceert een MagicDNS-hint in TXT wanneer de volledige mDNS-modus is ingeschakeld (verouderd: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` overschrijft het geadverteerde CLI-pad (verouderd: `OPENCLAW_CLI_PATH`).

## Verwante documentatie

- Detectiebeleid en transportselectie: [Detectie](/nl/gateway/discovery)
- Node-koppeling + goedkeuringen: [Gateway-koppeling](/nl/gateway/pairing)
