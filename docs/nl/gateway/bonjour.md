---
read_when:
    - Foutopsporing voor Bonjour-detectieproblemen op macOS/iOS
    - mDNS-servicetypen, TXT-records of detectie-UX wijzigen
summary: Bonjour/mDNS-detectie + foutopsporing (Gateway-bakens, clients en veelvoorkomende foutmodi)
title: Bonjour-detectie
x-i18n:
    generated_at: "2026-05-12T12:50:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05892ee8f0dc880f68f7cf024de9452b8d999ff1af3c7ca9850fb4f2d732af0c
    source_path: gateway/bonjour.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw kan Bonjour (mDNS / DNS-SD) gebruiken om een actieve Gateway (WebSocket-eindpunt) te ontdekken.
Multicast `local.`-browsen is een **gemakfunctie die alleen voor LAN is**. De meegeleverde `bonjour`
plugin beheert LAN-advertering. Deze start automatisch op macOS-hosts en is opt-in op
Linux, Windows en gecontaineriseerde Gateway-implementaties. Voor ontdekking over netwerken heen kan dezelfde
beacon ook worden gepubliceerd via een geconfigureerd wide-area DNS-SD-domein. Ontdekking
blijft best-effort en vervangt **niet** SSH of connectiviteit op basis van Tailnet.

## Wide-area Bonjour (Unicast DNS-SD) via Tailscale

Als de node en de gateway zich op verschillende netwerken bevinden, gaat multicast-mDNS niet over de
grens heen. Je kunt dezelfde ontdekkings-UX behouden door over te schakelen naar **unicast DNS-SD**
("Wide-Area Bonjour") via Tailscale.

Stappen op hoofdlijnen:

1. Voer een DNS-server uit op de gateway-host (bereikbaar via Tailnet).
2. Publiceer DNS-SD-records voor `_openclaw-gw._tcp` onder een toegewezen zone
   (voorbeeld: `openclaw.internal.`).
3. Configureer Tailscale **split DNS** zodat je gekozen domein voor clients
   (inclusief iOS) via die DNS-server wordt opgelost.

OpenClaw ondersteunt elk ontdekkingsdomein; `openclaw.internal.` is slechts een voorbeeld.
iOS-/Android-nodes browsen zowel `local.` als je geconfigureerde wide-area-domein.

### Gateway-configuratie (aanbevolen)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### Eenmalige DNS-serverinstallatie (gateway-host)

```bash
openclaw dns setup --apply
```

Dit installeert CoreDNS en configureert het om:

- alleen op poort 53 te luisteren op de Tailscale-interfaces van de gateway
- je gekozen domein (voorbeeld: `openclaw.internal.`) te serveren vanuit `~/.openclaw/dns/<domain>.db`

Valideer vanaf een met tailnet verbonden machine:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale-DNS-instellingen

In de Tailscale-beheerconsole:

- Voeg een nameserver toe die verwijst naar het tailnet-IP van de gateway (UDP/TCP 53).
- Voeg split DNS toe zodat je ontdekkingsdomein die nameserver gebruikt.

Zodra clients tailnet-DNS accepteren, kunnen iOS-nodes en CLI-ontdekking
`_openclaw-gw._tcp` in je ontdekkingsdomein browsen zonder multicast.

### Beveiliging van de Gateway-listener (aanbevolen)

De Gateway-WS-poort (standaard `18789`) bindt standaard aan loopback. Bind expliciet voor LAN-/tailnet-
toegang en laat auth ingeschakeld.

Voor tailnet-only-configuraties:

- Stel `gateway.bind: "tailnet"` in `~/.openclaw/openclaw.json` in.
- Herstart de Gateway (of herstart de macOS-menubalkapp).

## Wat adverteert

Alleen de Gateway adverteert `_openclaw-gw._tcp`. LAN-multicastadvertering wordt
geleverd door de meegeleverde `bonjour` plugin wanneer de plugin is ingeschakeld; wide-area
DNS-SD-publicatie blijft eigendom van de Gateway.

## Servicetypen

- `_openclaw-gw._tcp` - gateway-transportbeacon (gebruikt door macOS-/iOS-/Android-nodes).

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
- `tailnetDns=<magicdns>` (alleen volledige mDNS-modus, optionele hint wanneer Tailnet beschikbaar is)
- `sshPort=<port>` (alleen volledige modus; weggelaten in minimale en uitgeschakelde modi)
- `cliPath=<path>` (alleen volledige modus; weggelaten in minimale en uitgeschakelde modi)

Beveiligingsopmerkingen:

- Bonjour-/mDNS-TXT-records zijn **niet geauthenticeerd**. Clients mogen TXT niet behandelen als gezaghebbende routering.
- Clients moeten routeren met het opgeloste service-eindpunt (SRV + A/AAAA). Behandel `lanHost`, `tailnetDns`, `gatewayPort` en `gatewayTlsSha256` alleen als hints.
- Automatische SSH-targeting moet eveneens de opgeloste service-host gebruiken, niet alleen TXT-hints.
- TLS-pinning mag nooit toestaan dat een geadverteerde `gatewayTlsSha256` een eerder opgeslagen pin overschrijft.
- iOS-/Android-nodes moeten directe verbindingen op basis van ontdekking behandelen als **alleen TLS** en expliciete gebruikersbevestiging vereisen voordat een eerste fingerprint wordt vertrouwd.

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

Als browsen werkt maar oplossen mislukt, heb je meestal te maken met een LAN-beleid of
een mDNS-resolverprobleem.

## Debuggen in Gateway-logs

De Gateway schrijft een roterend logbestand (bij het opstarten afgedrukt als
`gateway log file: ...`). Zoek naar `bonjour:`-regels, vooral:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

De watchdog behandelt actieve `probing`, `announcing` en recente conflict-hernoemingen als
lopende statussen. Als de service nooit `announced` bereikt, maakt OpenClaw uiteindelijk
de advertiser opnieuw aan en schakelt het, na herhaalde fouten, Bonjour uit voor dat
Gateway-proces in plaats van eindeloos opnieuw te adverteren.

Bonjour gebruikt de systeemhostnaam voor de geadverteerde `.local`-host wanneer die een
geldig DNS-label is. Als de systeemhostnaam spaties, underscores of een ander
ongeldig DNS-labelteken bevat, valt OpenClaw terug op `openclaw.local`. Stel
`OPENCLAW_MDNS_HOSTNAME=<name>` in voordat je de Gateway start wanneer je een
expliciet hostlabel nodig hebt.

## Debuggen op iOS-node

De iOS-node gebruikt `NWBrowser` om `_openclaw-gw._tcp` te ontdekken.

Logs vastleggen:

- Instellingen → Gateway → Geavanceerd → **Discovery Debug Logs**
- Instellingen → Gateway → Geavanceerd → **Discovery Logs** → reproduceer → **Kopieer**

De log bevat browserstatusovergangen en wijzigingen in de resultatenset.

## Wanneer Bonjour inschakelen

Bonjour start automatisch voor het opstarten van de Gateway met lege configuratie op macOS-hosts omdat de
lokale app en nabije iOS-/Android-nodes vaak afhankelijk zijn van ontdekking op hetzelfde LAN.

Schakel Bonjour expliciet in wanneer automatische ontdekking op hetzelfde LAN nuttig is op Linux,
Windows of een andere niet-macOS-host:

```bash
openclaw plugins enable bonjour
```

Wanneer ingeschakeld, gebruikt Bonjour `discovery.mdns.mode` om te bepalen hoeveel TXT-metadata
moet worden gepubliceerd. Dezelfde modus beheert optionele TXT-hints in wide-area DNS-SD-records.
De standaardmodus is `minimal`; gebruik `full` alleen wanneer clients `cliPath`- of
`sshPort`-hints nodig hebben. Gebruik `off` om LAN-multicast te onderdrukken zonder de plugin-
inschakeling te wijzigen; wide-area DNS-SD kan nog steeds de minimale Gateway-beacon publiceren wanneer
`discovery.wideArea.enabled` waar is.

## Wanneer Bonjour uitschakelen

Laat Bonjour uitgeschakeld wanneer LAN-multicastadvertering onnodig, niet beschikbaar
of schadelijk is. Veelvoorkomende gevallen zijn niet-macOS-servers, Docker bridge-netwerken,
WSL of een netwerkbeleid dat mDNS-multicast blokkeert. In die omgevingen is de
Gateway nog steeds bereikbaar via de gepubliceerde URL, SSH, Tailnet of wide-area
DNS-SD, maar automatische LAN-ontdekking is niet betrouwbaar.

Geef de voorkeur aan de bestaande omgevings-override wanneer het probleem implementatiegebonden is:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Dat schakelt LAN-multicastadvertering uit zonder de pluginconfiguratie te wijzigen.
Het is veilig voor Docker-images, servicebestanden, startscripts en eenmalig
debuggen, omdat de instelling verdwijnt wanneer de omgeving dat doet.

Gebruik pluginconfiguratie wanneer je de meegeleverde LAN-
ontdekkingsplugin bewust wilt uitschakelen voor die OpenClaw-configuratie:

```bash
openclaw plugins disable bonjour
```

## Docker-valkuilen

De meegeleverde Bonjour-plugin schakelt LAN-multicastadvertering automatisch uit in gedetecteerde
containers wanneer `OPENCLAW_DISABLE_BONJOUR` niet is ingesteld. Docker bridge-netwerken
sturen mDNS-multicast (`224.0.0.251:5353`) meestal niet door tussen de container
en het LAN, dus adverteren vanuit de container laat ontdekking zelden werken.

Belangrijke valkuilen:

- Bonjour start automatisch op macOS-hosts en is elders opt-in. Het uitgeschakeld laten
  stopt de Gateway niet; het slaat alleen LAN-multicastadvertering over.
- Bonjour uitschakelen wijzigt `gateway.bind` niet; Docker gebruikt nog steeds standaard
  `OPENCLAW_GATEWAY_BIND=lan` zodat de gepubliceerde hostpoort kan werken.
- Bonjour uitschakelen schakelt wide-area DNS-SD niet uit. Gebruik wide-area-ontdekking
  of Tailnet wanneer de Gateway en node zich niet op hetzelfde LAN bevinden.
- Het opnieuw gebruiken van dezelfde `OPENCLAW_CONFIG_DIR` buiten Docker bewaart het
  automatische uitschakelbeleid van de container niet.
- Stel `OPENCLAW_DISABLE_BONJOUR=0` alleen in voor host networking, macvlan of een ander
  netwerk waarvan bekend is dat mDNS-multicast erdoorheen komt; stel het in op `1` om geforceerd uit te schakelen.

## Problemen oplossen met uitgeschakelde Bonjour

Als een node de Gateway niet meer automatisch ontdekt na Docker-installatie:

1. Controleer of de Gateway draait in automatische, geforceerd ingeschakelde of geforceerd uitgeschakelde modus:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Controleer of de Gateway zelf bereikbaar is via de gepubliceerde poort:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Gebruik een direct target wanneer Bonjour is uitgeschakeld:
   - Control UI of lokale tools: `http://127.0.0.1:18789`
   - LAN-clients: `http://<gateway-host>:18789`
   - Clients over netwerken heen: Tailnet MagicDNS, Tailnet-IP, SSH-tunnel of
     wide-area DNS-SD

4. Als je de Bonjour-plugin bewust hebt ingeschakeld in Docker en adverteren hebt geforceerd
   met `OPENCLAW_DISABLE_BONJOUR=0`, test multicast vanaf de host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Als browsen leeg is of de Gateway-logs herhaalde ciao-watchdog-
   annuleringen tonen, herstel dan `OPENCLAW_DISABLE_BONJOUR=1` en gebruik een directe of
   Tailnet-route.

## Veelvoorkomende foutmodi

- **Bonjour gaat niet over netwerken heen**: gebruik Tailnet of SSH.
- **Multicast geblokkeerd**: sommige Wi-Fi-netwerken schakelen mDNS uit.
- **Advertiser blijft hangen in probing/announcing**: hosts met geblokkeerde multicast,
  container bridges, WSL of interfacefluctuaties kunnen de ciao-advertiser in een
  niet-aangekondigde status achterlaten. OpenClaw probeert het een paar keer opnieuw en schakelt daarna Bonjour
  uit voor het huidige Gateway-proces in plaats van de advertiser eindeloos opnieuw te starten.
- **Docker bridge networking**: Bonjour schakelt automatisch uit in gedetecteerde containers.
  Stel `OPENCLAW_DISABLE_BONJOUR=0` alleen in voor host, macvlan of een ander
  mDNS-geschikt netwerk.
- **Slaapstand / interfacefluctuaties**: macOS kan mDNS-resultaten tijdelijk laten wegvallen; probeer opnieuw.
- **Browsen werkt maar oplossen mislukt**: houd machinenamen eenvoudig (vermijd emoji's of
  interpunctie) en herstart daarna de Gateway. De service-instantienaam wordt afgeleid van
  de hostnaam, dus te complexe namen kunnen sommige resolvers verwarren.

## Geëscapete instantienamen (`\032`)

Bonjour/DNS-SD escapet bytes in service-instantienamen vaak als decimale `\DDD`-
reeksen (bijvoorbeeld spaties worden `\032`).

- Dit is normaal op protocolniveau.
- UI's moeten decoderen voor weergave (iOS gebruikt `BonjourEscapes.decode`).

## Inschakelen / uitschakelen / configuratie

- macOS-hosts starten standaard automatisch de gebundelde LAN-detectie-Plugin.
- `openclaw plugins enable bonjour` schakelt de gebundelde LAN-detectie-Plugin in op hosts waar deze niet standaard is ingeschakeld.
- `openclaw plugins disable bonjour` schakelt LAN-multicastadvertising uit door de gebundelde Plugin uit te schakelen.
- `OPENCLAW_DISABLE_BONJOUR=1` schakelt LAN-multicastadvertising uit zonder de Plugin-configuratie te wijzigen; geaccepteerde waarheidswaarden zijn `1`, `true`, `yes` en `on` (verouderd: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` dwingt LAN-multicastadvertising af, ook binnen gedetecteerde containers; geaccepteerde onwaarheidswaarden zijn `0`, `false`, `no` en `off`.
- Wanneer de Bonjour-Plugin is ingeschakeld en `OPENCLAW_DISABLE_BONJOUR` niet is ingesteld, adverteert Bonjour op normale hosts en schakelt het zichzelf automatisch uit binnen gedetecteerde containers.
- `gateway.bind` in `~/.openclaw/openclaw.json` bepaalt de bindmodus van de Gateway.
- `OPENCLAW_SSH_PORT` overschrijft de SSH-poort wanneer `sshPort` wordt geadverteerd (verouderd: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publiceert een MagicDNS-hint in TXT wanneer de volledige mDNS-modus is ingeschakeld (verouderd: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` overschrijft het geadverteerde CLI-pad (verouderd: `OPENCLAW_CLI_PATH`).

## Gerelateerde documentatie

- Detectiebeleid en transportselectie: [Detectie](/nl/gateway/discovery)
- Node-koppeling + goedkeuringen: [Gateway-koppeling](/nl/gateway/pairing)
