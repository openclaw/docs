---
read_when:
    - Bonjour-detectieproblemen op macOS/iOS debuggen
    - mDNS-servicetypen, TXT-records of de gebruikservaring voor detectie wijzigen
summary: Bonjour/mDNS-detectie + foutopsporing (Gateway-bakens, clients en veelvoorkomende foutmodi)
title: Bonjour-detectie
x-i18n:
    generated_at: "2026-05-06T09:12:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7b7d029e6eb6bee90eb96e7ea169ecadf3bda6d969b2450349c5716a950e205
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw kan Bonjour (mDNS / DNS-SD) gebruiken om een actieve Gateway (WebSocket-eindpunt) te ontdekken.
Multicast `local.`-browsen is een **gemak voor alleen LAN**. De meegeleverde `bonjour`
plugin beheert LAN-advertering. Deze start automatisch op macOS-hosts en is opt-in op
Linux, Windows en gecontaineriseerde Gateway-implementaties. Voor ontdekking tussen netwerken kan dezelfde
beacon ook via een geconfigureerd wide-area DNS-SD-domein worden gepubliceerd. Ontdekking
blijft best-effort en vervangt **geen** connectiviteit op basis van SSH of Tailnet.

## Wide-area Bonjour (Unicast DNS-SD) via Tailscale

Als de node en Gateway zich op verschillende netwerken bevinden, steekt multicast mDNS de
grens niet over. Je kunt dezelfde ontdekkingservaring behouden door over te schakelen naar **unicast DNS-SD**
("Wide-Area Bonjour") via Tailscale.

Stappen op hoofdlijnen:

1. Voer een DNS-server uit op de Gateway-host (bereikbaar via Tailnet).
2. Publiceer DNS-SD-records voor `_openclaw-gw._tcp` onder een toegewezen zone
   (voorbeeld: `openclaw.internal.`).
3. Configureer Tailscale **split DNS** zodat je gekozen domein via die
   DNS-server wordt opgelost voor clients (inclusief iOS).

OpenClaw ondersteunt elk ontdekkingsdomein; `openclaw.internal.` is slechts een voorbeeld.
iOS/Android-nodes browsen zowel `local.` als je geconfigureerde wide-area domein.

### Gateway-configuratie (aanbevolen)

```json5
{
  gateway: { bind: "tailnet" }, // alleen tailnet (aanbevolen)
  discovery: { wideArea: { enabled: true } }, // schakelt wide-area DNS-SD-publicatie in
}
```

### Eenmalige DNS-serverinstallatie (Gateway-host)

```bash
openclaw dns setup --apply
```

Dit installeert CoreDNS en configureert het om:

- alleen op poort 53 te luisteren op de Tailscale-interfaces van de Gateway
- je gekozen domein (voorbeeld: `openclaw.internal.`) te serveren vanuit `~/.openclaw/dns/<domain>.db`

Valideer vanaf een met Tailnet verbonden machine:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS-instellingen

In de Tailscale-beheerconsole:

- Voeg een nameserver toe die naar het tailnet-IP van de Gateway wijst (UDP/TCP 53).
- Voeg split DNS toe zodat je ontdekkingsdomein die nameserver gebruikt.

Zodra clients tailnet-DNS accepteren, kunnen iOS-nodes en CLI-ontdekking
`_openclaw-gw._tcp` in je ontdekkingsdomein browsen zonder multicast.

### Beveiliging van de Gateway-listener (aanbevolen)

De Gateway WS-poort (standaard `18789`) bindt standaard aan loopback. Voor LAN-/tailnet-
toegang moet je expliciet binden en authenticatie ingeschakeld houden.

Voor alleen-tailnet-installaties:

- Stel `gateway.bind: "tailnet"` in `~/.openclaw/openclaw.json` in.
- Herstart de Gateway (of herstart de macOS-menubalk-app).

## Wat adverteert

Alleen de Gateway adverteert `_openclaw-gw._tcp`. LAN-multicastadvertering wordt
geleverd door de meegeleverde `bonjour` plugin wanneer de plugin is ingeschakeld; wide-area
DNS-SD-publicatie blijft eigendom van de Gateway.

## Servicetypen

- `_openclaw-gw._tcp` - gateway-transportbeacon (gebruikt door macOS/iOS/Android-nodes).

## TXT-sleutels (niet-geheime hints)

De Gateway adverteert kleine niet-geheime hints om UI-flows handig te maken:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (alleen wanneer TLS is ingeschakeld)
- `gatewayTlsSha256=<sha256>` (alleen wanneer TLS is ingeschakeld en de fingerprint beschikbaar is)
- `canvasPort=<port>` (alleen wanneer de canvas-host is ingeschakeld; momenteel hetzelfde als `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (alleen mDNS full-modus, optionele hint wanneer Tailnet beschikbaar is)
- `sshPort=<port>` (alleen mDNS full-modus; wide-area DNS-SD kan dit weglaten)
- `cliPath=<path>` (alleen mDNS full-modus; wide-area DNS-SD schrijft dit nog steeds als remote-install-hint)

Beveiligingsnotities:

- Bonjour/mDNS TXT-records zijn **niet-geauthenticeerd**. Clients mogen TXT niet als gezaghebbende routering behandelen.
- Clients moeten routeren via het opgeloste service-eindpunt (SRV + A/AAAA). Behandel `lanHost`, `tailnetDns`, `gatewayPort` en `gatewayTlsSha256` alleen als hints.
- SSH-auto-targeting moet eveneens de opgeloste servicehost gebruiken, niet alleen TXT-hints.
- TLS-pinning mag nooit toestaan dat een geadverteerde `gatewayTlsSha256` een eerder opgeslagen pin overschrijft.
- iOS/Android-nodes moeten directe verbindingen op basis van ontdekking als **alleen TLS** behandelen en expliciete gebruikersbevestiging vereisen voordat een eerste fingerprint wordt vertrouwd.

## Debuggen op macOS

Nuttige ingebouwde tools:

- Instanties browsen:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Eén instantie oplossen (vervang `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Als browsen werkt maar oplossen mislukt, heb je meestal te maken met een LAN-beleid of
mDNS-resolverprobleem.

## Debuggen in Gateway-logs

De Gateway schrijft een roterend logbestand (bij opstarten afgedrukt als
`gateway log file: ...`). Zoek naar `bonjour:`-regels, vooral:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

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

De log bevat browserstatusovergangen en wijzigingen in de resultatenset.

## Wanneer Bonjour inschakelen

Bonjour start automatisch bij een Gateway-opstart met lege configuratie op macOS-hosts omdat de
lokale app en nabijgelegen iOS/Android-nodes vaak vertrouwen op ontdekking binnen hetzelfde LAN.

Schakel Bonjour expliciet in wanneer automatische ontdekking binnen hetzelfde LAN nuttig is op Linux,
Windows of een andere niet-macOS-host:

```bash
openclaw plugins enable bonjour
```

Wanneer ingeschakeld gebruikt Bonjour `discovery.mdns.mode` om te bepalen hoeveel TXT-metadata
moet worden gepubliceerd. De standaardmodus is `minimal`; gebruik `full` alleen wanneer lokale clients
`cliPath`- of `sshPort`-hints nodig hebben, en gebruik `off` om LAN-multicast te onderdrukken zonder
de plugin-inschakeling te wijzigen.

## Wanneer Bonjour uitschakelen

Laat Bonjour uitgeschakeld wanneer LAN-multicastadvertering onnodig, niet beschikbaar
of schadelijk is. Veelvoorkomende gevallen zijn niet-macOS-servers, Docker-bridge-netwerken,
WSL of een netwerkbeleid dat mDNS-multicast laat vallen. In die omgevingen is de
Gateway nog steeds bereikbaar via de gepubliceerde URL, SSH, Tailnet of wide-area
DNS-SD, maar automatische LAN-ontdekking is niet betrouwbaar.

Gebruik bij voorkeur de bestaande omgevingsoverschrijving wanneer het probleem implementatiegebonden is:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Dit schakelt LAN-multicastadvertering uit zonder de plugin-configuratie te wijzigen.
Het is veilig voor Docker-images, servicebestanden, startscripts en eenmalig
debuggen omdat de instelling verdwijnt wanneer de omgeving dat doet.

Gebruik plugin-configuratie wanneer je de meegeleverde LAN-
ontdekkingsplugin bewust wilt uitschakelen voor die OpenClaw-configuratie:

```bash
openclaw plugins disable bonjour
```

## Docker-valkuilen

De meegeleverde Bonjour-plugin schakelt LAN-multicastadvertering automatisch uit in gedetecteerde
containers wanneer `OPENCLAW_DISABLE_BONJOUR` niet is ingesteld. Docker-bridge-netwerken
sturen mDNS-multicast (`224.0.0.251:5353`) meestal niet door tussen de container
en het LAN, dus adverteren vanuit de container laat ontdekking zelden werken.

Belangrijke valkuilen:

- Bonjour start automatisch op macOS-hosts en is elders opt-in. Het
  uitgeschakeld laten stopt de Gateway niet; het slaat alleen LAN-multicastadvertering over.
- Bonjour uitschakelen wijzigt `gateway.bind` niet; Docker gebruikt nog steeds standaard
  `OPENCLAW_GATEWAY_BIND=lan` zodat de gepubliceerde hostpoort kan werken.
- Bonjour uitschakelen schakelt wide-area DNS-SD niet uit. Gebruik wide-area ontdekking
  of Tailnet wanneer de Gateway en node zich niet op hetzelfde LAN bevinden.
- Hetzelfde `OPENCLAW_CONFIG_DIR` buiten Docker hergebruiken houdt het
  containerbeleid voor automatisch uitschakelen niet vast.
- Stel `OPENCLAW_DISABLE_BONJOUR=0` alleen in voor hostnetwerken, macvlan of een ander
  netwerk waarvan bekend is dat mDNS-multicast passeert; stel het in op `1` om geforceerd uit te schakelen.

## Problemen oplossen met uitgeschakelde Bonjour

Als een node de Gateway niet meer automatisch ontdekt na Docker-installatie:

1. Bevestig of de Gateway draait in automatische, geforceerd-aan- of geforceerd-uit-modus:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Bevestig dat de Gateway zelf bereikbaar is via de gepubliceerde poort:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Gebruik een direct doel wanneer Bonjour is uitgeschakeld:
   - Control UI of lokale tools: `http://127.0.0.1:18789`
   - LAN-clients: `http://<gateway-host>:18789`
   - Clients tussen netwerken: Tailnet MagicDNS, Tailnet-IP, SSH-tunnel of
     wide-area DNS-SD

4. Als je de Bonjour-plugin in Docker bewust hebt ingeschakeld en advertering hebt geforceerd
   met `OPENCLAW_DISABLE_BONJOUR=0`, test multicast vanaf de host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Als browsen leeg is of de Gateway-logs herhaalde ciao-watchdog-
   annuleringen tonen, herstel dan `OPENCLAW_DISABLE_BONJOUR=1` en gebruik een directe of
   Tailnet-route.

## Veelvoorkomende foutmodi

- **Bonjour steekt geen netwerken over**: gebruik Tailnet of SSH.
- **Multicast geblokkeerd**: sommige Wi-Fi-netwerken schakelen mDNS uit.
- **Advertiser blijft hangen in probing/announcing**: hosts met geblokkeerde multicast,
  container-bridges, WSL of interfaceverloop kunnen de ciao-advertiser in een
  niet-aangekondigde status achterlaten. OpenClaw probeert het een paar keer opnieuw en schakelt daarna Bonjour
  uit voor het huidige Gateway-proces in plaats van de advertiser eindeloos te herstarten.
- **Docker-bridge-netwerken**: Bonjour schakelt automatisch uit in gedetecteerde containers.
  Stel `OPENCLAW_DISABLE_BONJOUR=0` alleen in voor host, macvlan of een ander
  mDNS-capabel netwerk.
- **Slaapstand / interfaceverloop**: macOS kan tijdelijk mDNS-resultaten laten vallen; probeer opnieuw.
- **Browsen werkt maar oplossen mislukt**: houd machinenamen eenvoudig (vermijd emoji's of
  leestekens) en herstart daarna de Gateway. De service-instantienaam is afgeleid van
  de hostnaam, dus te complexe namen kunnen sommige resolvers in de war brengen.

## Geëscapete instantienamen (`\032`)

Bonjour/DNS-SD escapet bytes in service-instantienamen vaak als decimale `\DDD`-
reeksen (bijv. spaties worden `\032`).

- Dit is normaal op protocolniveau.
- UI's moeten decoderen voor weergave (iOS gebruikt `BonjourEscapes.decode`).

## Inschakelen / uitschakelen / configuratie

- macOS-hosts starten de meegeleverde LAN-ontdekkingsplugin standaard automatisch.
- `openclaw plugins enable bonjour` schakelt de meegeleverde LAN-ontdekkingsplugin in op hosts waar deze niet standaard is ingeschakeld.
- `openclaw plugins disable bonjour` schakelt LAN-multicastadvertering uit door de meegeleverde plugin uit te schakelen.
- `OPENCLAW_DISABLE_BONJOUR=1` schakelt LAN-multicastadvertering uit zonder plugin-configuratie te wijzigen; geaccepteerde truthy-waarden zijn `1`, `true`, `yes` en `on` (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` forceert LAN-multicastadvertering aan, ook binnen gedetecteerde containers; geaccepteerde falsy-waarden zijn `0`, `false`, `no` en `off`.
- Wanneer de Bonjour-plugin is ingeschakeld en `OPENCLAW_DISABLE_BONJOUR` niet is ingesteld, adverteert Bonjour op normale hosts en schakelt automatisch uit binnen gedetecteerde containers.
- `gateway.bind` in `~/.openclaw/openclaw.json` bepaalt de Gateway-bindmodus.
- `OPENCLAW_SSH_PORT` overschrijft de SSH-poort wanneer `sshPort` wordt geadverteerd (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publiceert een MagicDNS-hint in TXT wanneer mDNS full-modus is ingeschakeld (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` overschrijft het geadverteerde CLI-pad (legacy: `OPENCLAW_CLI_PATH`).

## Gerelateerde documentatie

- Ontdekkingsbeleid en transportselectie: [Ontdekking](/nl/gateway/discovery)
- Node-koppeling + goedkeuringen: [Gateway-koppeling](/nl/gateway/pairing)
