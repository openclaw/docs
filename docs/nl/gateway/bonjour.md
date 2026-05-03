---
read_when:
    - Bonjour-detectieproblemen op macOS/iOS debuggen
    - mDNS-servicetypen, TXT-records of detectie-UX wijzigen
summary: Bonjour/mDNS-detectie + foutopsporing (Gateway-bakens, clients en veelvoorkomende storingsmodi)
title: Bonjour-detectie
x-i18n:
    generated_at: "2026-05-03T21:31:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2975fea03bc8fe8ccbd57f7a4ca8c15a59fb21b3f92c2b77b9a57ae4ebd5d374
    source_path: gateway/bonjour.md
    workflow: 16
---

# Bonjour / mDNS-detectie

OpenClaw kan Bonjour (mDNS / DNS-SD) gebruiken om een actieve Gateway (WebSocket-eindpunt) te vinden.
Multicast-browsen op `local.` is een **gemak voor alleen LAN**. De gebundelde `bonjour`
Plugin is eigenaar van LAN-advertering. Deze start automatisch op macOS-hosts en is opt-in op
Linux, Windows en gecontaineriseerde Gateway-implementaties. Voor detectie tussen netwerken kan dezelfde
beacon ook worden gepubliceerd via een geconfigureerd wide-area DNS-SD-domein. Detectie
blijft best-effort en vervangt **niet** connectiviteit op basis van SSH of Tailnet.

## Wide-area Bonjour (Unicast DNS-SD) via Tailscale

Als de node en Gateway zich op verschillende netwerken bevinden, passeert multicast-mDNS de
grens niet. Je kunt dezelfde detectie-UX behouden door over te schakelen naar **unicast DNS‑SD**
("Wide‑Area Bonjour") via Tailscale.

Stappen op hoog niveau:

1. Voer een DNS-server uit op de Gateway-host (bereikbaar via Tailnet).
2. Publiceer DNS‑SD-records voor `_openclaw-gw._tcp` onder een speciale zone
   (voorbeeld: `openclaw.internal.`).
3. Configureer Tailscale **split DNS** zodat je gekozen domein voor clients
   (inclusief iOS) via die DNS-server wordt opgelost.

OpenClaw ondersteunt elk detectiedomein; `openclaw.internal.` is slechts een voorbeeld.
iOS/Android-nodes browsen zowel `local.` als je geconfigureerde wide-area domein.

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

Dit installeert CoreDNS en configureert het om:

- alleen op poort 53 te luisteren op de Tailscale-interfaces van de Gateway
- je gekozen domein (voorbeeld: `openclaw.internal.`) te bedienen vanuit `~/.openclaw/dns/<domain>.db`

Valideer vanaf een machine die met tailnet is verbonden:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS-instellingen

In de Tailscale-beheerconsole:

- Voeg een nameserver toe die naar het tailnet-IP van de Gateway wijst (UDP/TCP 53).
- Voeg split DNS toe zodat je detectiedomein die nameserver gebruikt.

Zodra clients tailnet-DNS accepteren, kunnen iOS-nodes en CLI-detectie
`_openclaw-gw._tcp` in je detectiedomein browsen zonder multicast.

### Beveiliging van de Gateway-listener (aanbevolen)

De Gateway WS-poort (standaard `18789`) bindt standaard aan loopback. Bind expliciet voor LAN-/tailnet-
toegang en houd authenticatie ingeschakeld.

Voor tailnet-only configuraties:

- Stel `gateway.bind: "tailnet"` in `~/.openclaw/openclaw.json` in.
- Herstart de Gateway (of herstart de macOS-menubalk-app).

## Wat adverteert

Alleen de Gateway adverteert `_openclaw-gw._tcp`. LAN-multicastadvertering wordt
geleverd door de gebundelde `bonjour` Plugin wanneer de Plugin is ingeschakeld; wide-area
DNS-SD-publicatie blijft eigendom van de Gateway.

## Servicetypen

- `_openclaw-gw._tcp` — Gateway-transportbeacon (gebruikt door macOS/iOS/Android-nodes).

## TXT-sleutels (niet-geheime hints)

De Gateway adverteert kleine, niet-geheime hints om UI-flows gemakkelijk te maken:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (alleen wanneer TLS is ingeschakeld)
- `gatewayTlsSha256=<sha256>` (alleen wanneer TLS is ingeschakeld en de vingerafdruk beschikbaar is)
- `canvasPort=<port>` (alleen wanneer de canvashost is ingeschakeld; momenteel hetzelfde als `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (alleen mDNS full-modus, optionele hint wanneer Tailnet beschikbaar is)
- `sshPort=<port>` (alleen mDNS full-modus; wide-area DNS-SD kan dit weglaten)
- `cliPath=<path>` (alleen mDNS full-modus; wide-area DNS-SD schrijft dit nog steeds als remote-install-hint)

Beveiligingsnotities:

- Bonjour/mDNS TXT-records zijn **niet geauthenticeerd**. Clients mogen TXT niet als gezaghebbende routering behandelen.
- Clients moeten routeren via het opgeloste service-eindpunt (SRV + A/AAAA). Behandel `lanHost`, `tailnetDns`, `gatewayPort` en `gatewayTlsSha256` alleen als hints.
- SSH-auto-targeting moet eveneens de opgeloste servicehost gebruiken, niet alleen TXT-hints.
- TLS-pinning mag nooit toestaan dat een geadverteerde `gatewayTlsSha256` een eerder opgeslagen pin overschrijft.
- iOS/Android-nodes moeten discovery-gebaseerde directe verbindingen als **alleen TLS** behandelen en expliciete gebruikersbevestiging vereisen voordat een eerste vingerafdruk wordt vertrouwd.

## Debuggen op macOS

Nuttige ingebouwde tools:

- Browse instanties:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Los één instantie op (vervang `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Als browsen werkt maar oplossen mislukt, loop je meestal tegen een LAN-beleid of
mDNS-resolverprobleem aan.

## Debuggen in Gateway-logboeken

De Gateway schrijft een roterend logbestand (bij opstarten afgedrukt als
`gateway log file: ...`). Zoek naar `bonjour:`-regels, vooral:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour gebruikt de systeemhostnaam voor de geadverteerde `.local`-host wanneer dit een
geldig DNS-label is. Als de systeemhostnaam spaties, underscores of een ander
ongeldig DNS-labelteken bevat, valt OpenClaw terug op `openclaw.local`. Stel
`OPENCLAW_MDNS_HOSTNAME=<name>` in voordat je de Gateway start wanneer je een
expliciet hostlabel nodig hebt.

## Debuggen op iOS-node

De iOS-node gebruikt `NWBrowser` om `_openclaw-gw._tcp` te vinden.

Logboeken vastleggen:

- Instellingen → Gateway → Geavanceerd → **Detectie-debuglogboeken**
- Instellingen → Gateway → Geavanceerd → **Detectielogboeken** → reproduceren → **Kopiëren**

Het logboek bevat browserstatusovergangen en wijzigingen in de resultatenset.

## Wanneer Bonjour inschakelen

Bonjour start automatisch bij een Gateway-opstart met lege configuratie op macOS-hosts omdat de
lokale app en nabijgelegen iOS/Android-nodes vaak afhankelijk zijn van detectie op hetzelfde LAN.

Schakel Bonjour expliciet in wanneer automatische detectie op hetzelfde LAN nuttig is op Linux,
Windows of een andere niet-macOS-host:

```bash
openclaw plugins enable bonjour
```

Wanneer ingeschakeld gebruikt Bonjour `discovery.mdns.mode` om te bepalen hoeveel TXT-metadata
moet worden gepubliceerd. De standaardmodus is `minimal`; gebruik `full` alleen wanneer lokale clients
`cliPath`- of `sshPort`-hints nodig hebben, en gebruik `off` om LAN-multicast te onderdrukken zonder
Plugin-inschakeling te wijzigen.

## Wanneer Bonjour uitschakelen

Laat Bonjour uitgeschakeld wanneer LAN-multicastadvertering onnodig, niet beschikbaar
of schadelijk is. Veelvoorkomende gevallen zijn niet-macOS-servers, Docker-bridgenetwerken,
WSL of een netwerkbeleid dat mDNS-multicast dropt. In die omgevingen is de
Gateway nog steeds bereikbaar via de gepubliceerde URL, SSH, Tailnet of wide-area
DNS-SD, maar automatische LAN-detectie is niet betrouwbaar.

Geef de voorkeur aan de bestaande omgevings-override wanneer het probleem implementatiegebonden is:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Dit schakelt LAN-multicastadvertering uit zonder de Plugin-configuratie te wijzigen.
Het is veilig voor Docker-images, servicebestanden, startscripts en eenmalig
debuggen omdat de instelling verdwijnt wanneer de omgeving dat doet.

Gebruik Plugin-configuratie wanneer je de gebundelde LAN-
detectie-Plugin bewust wilt uitschakelen voor die OpenClaw-configuratie:

```bash
openclaw plugins disable bonjour
```

## Docker-valkuilen

De gebundelde Bonjour-Plugin schakelt LAN-multicastadvertering automatisch uit in gedetecteerde
containers wanneer `OPENCLAW_DISABLE_BONJOUR` niet is ingesteld. Docker-bridgenetwerken
sturen mDNS-multicast (`224.0.0.251:5353`) meestal niet door tussen de container
en het LAN, waardoor adverteren vanuit de container zelden detectie laat werken.

Belangrijke valkuilen:

- Bonjour start automatisch op macOS-hosts en is elders opt-in. Het uitgeschakeld
  laten stopt de Gateway niet; het slaat alleen LAN-multicastadvertering over.
- Bonjour uitschakelen wijzigt `gateway.bind` niet; Docker gebruikt nog steeds standaard
  `OPENCLAW_GATEWAY_BIND=lan` zodat de gepubliceerde hostpoort kan werken.
- Bonjour uitschakelen schakelt wide-area DNS-SD niet uit. Gebruik wide-area detectie
  of Tailnet wanneer de Gateway en node zich niet op hetzelfde LAN bevinden.
- Hetzelfde `OPENCLAW_CONFIG_DIR` buiten Docker hergebruiken houdt het
  container-auto-disablebeleid niet vast.
- Stel `OPENCLAW_DISABLE_BONJOUR=0` alleen in voor hostnetwerken, macvlan of een ander
  netwerk waarvan bekend is dat mDNS-multicast erdoorheen komt; stel het in op `1` om geforceerd uit te schakelen.

## Problemen oplossen met uitgeschakelde Bonjour

Als een node na Docker-configuratie de Gateway niet meer automatisch vindt:

1. Controleer of de Gateway in auto-, forced-on- of forced-off-modus draait:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Controleer of de Gateway zelf bereikbaar is via de gepubliceerde poort:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Gebruik een direct doel wanneer Bonjour is uitgeschakeld:
   - Control UI of lokale tools: `http://127.0.0.1:18789`
   - LAN-clients: `http://<gateway-host>:18789`
   - Clients tussen netwerken: Tailnet MagicDNS, Tailnet-IP, SSH-tunnel of
     wide-area DNS-SD

4. Als je de Bonjour-Plugin bewust in Docker hebt ingeschakeld en adverteren hebt geforceerd
   met `OPENCLAW_DISABLE_BONJOUR=0`, test dan multicast vanaf de host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Als browsen leeg is of de Gateway-logboeken herhaalde ciao-watchdog-
   annuleringen tonen, herstel `OPENCLAW_DISABLE_BONJOUR=1` en gebruik een directe of
   Tailnet-route.

## Veelvoorkomende foutmodi

- **Bonjour passeert geen netwerken**: gebruik Tailnet of SSH.
- **Multicast geblokkeerd**: sommige Wi‑Fi-netwerken schakelen mDNS uit.
- **Advertiser vast in probing/announcing**: hosts met geblokkeerde multicast,
  containerbridges, WSL of interfaceflapping kunnen de ciao-advertiser in een
  niet-aangekondigde toestand achterlaten. OpenClaw probeert het een paar keer opnieuw en schakelt Bonjour
  vervolgens uit voor het huidige Gateway-proces in plaats van de advertiser eindeloos te herstarten.
- **Docker-bridgenetwerken**: Bonjour schakelt automatisch uit in gedetecteerde containers.
  Stel `OPENCLAW_DISABLE_BONJOUR=0` alleen in voor host, macvlan of een ander
  mDNS-geschikt netwerk.
- **Slaapstand / interfaceflapping**: macOS kan mDNS-resultaten tijdelijk verliezen; probeer opnieuw.
- **Browsen werkt maar oplossen mislukt**: houd machinenamen eenvoudig (vermijd emoji's of
  interpunctie) en herstart daarna de Gateway. De service-instantienaam wordt afgeleid van
  de hostnaam, waardoor te complexe namen sommige resolvers kunnen verwarren.

## Geëscapete instantienamen (`\032`)

Bonjour/DNS‑SD escapet bytes in service-instantienamen vaak als decimale `\DDD`-
reeksen (bijv. spaties worden `\032`).

- Dit is normaal op protocolniveau.
- UI's moeten decoderen voor weergave (iOS gebruikt `BonjourEscapes.decode`).

## Inschakelen / uitschakelen / configuratie

- macOS-hosts starten de gebundelde LAN-detectie-Plugin standaard automatisch.
- `openclaw plugins enable bonjour` schakelt de gebundelde LAN-detectie-Plugin in op hosts waar deze niet standaard is ingeschakeld.
- `openclaw plugins disable bonjour` schakelt LAN-multicastadvertering uit door de gebundelde Plugin uit te schakelen.
- `OPENCLAW_DISABLE_BONJOUR=1` schakelt LAN-multicastadvertering uit zonder Plugin-configuratie te wijzigen; geaccepteerde truthy waarden zijn `1`, `true`, `yes` en `on` (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` forceert LAN-multicastadvertering, ook binnen gedetecteerde containers; geaccepteerde falsy waarden zijn `0`, `false`, `no` en `off`.
- Wanneer de Bonjour-Plugin is ingeschakeld en `OPENCLAW_DISABLE_BONJOUR` niet is ingesteld, adverteert Bonjour op normale hosts en schakelt het automatisch uit binnen gedetecteerde containers.
- `gateway.bind` in `~/.openclaw/openclaw.json` bepaalt de Gateway-bindmodus.
- `OPENCLAW_SSH_PORT` overschrijft de SSH-poort wanneer `sshPort` wordt geadverteerd (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publiceert een MagicDNS-hint in TXT wanneer mDNS full-modus is ingeschakeld (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` overschrijft het geadverteerde CLI-pad (legacy: `OPENCLAW_CLI_PATH`).

## Gerelateerde documentatie

- Detectiebeleid en transportselectie: [Detectie](/nl/gateway/discovery)
- Node-koppeling + goedkeuringen: [Gateway-koppeling](/nl/gateway/pairing)
