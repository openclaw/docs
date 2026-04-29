---
read_when:
    - Foutopsporing van Bonjour-detectieproblemen op macOS/iOS
    - mDNS-servicetypen, TXT-records of detectie-UX wijzigen
summary: Bonjour/mDNS-detectie + foutopsporing (Gateway-bakens, clients en veelvoorkomende foutmodi)
title: Bonjour-detectie
x-i18n:
    generated_at: "2026-04-29T22:42:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0720451843aae0509949324e51f3a23dc69e366e68de851c595ce76c8ab0eec9
    source_path: gateway/bonjour.md
    workflow: 16
---

# Bonjour- / mDNS-detectie

OpenClaw gebruikt Bonjour (mDNS / DNS‑SD) om een actieve Gateway (WebSocket-eindpunt) te detecteren.
Multicast-browsen van `local.` is **alleen bedoeld als gemak op een LAN**. De gebundelde `bonjour`
Plugin beheert LAN-advertising en is standaard ingeschakeld. Voor detectie over netwerken heen
kan hetzelfde baken ook worden gepubliceerd via een geconfigureerd wide-area DNS-SD-domein.
Detectie blijft op basis van best effort en vervangt **geen** connectiviteit op basis van SSH of Tailnet.

## Wide-area Bonjour (Unicast DNS-SD) via Tailscale

Als de node en Gateway zich op verschillende netwerken bevinden, gaat multicast-mDNS niet over de
grens heen. Je kunt dezelfde detectie-UX behouden door over te schakelen naar **unicast DNS‑SD**
("Wide‑Area Bonjour") via Tailscale.

Stappen op hoofdlijnen:

1. Draai een DNS-server op de Gateway-host (bereikbaar via Tailnet).
2. Publiceer DNS‑SD-records voor `_openclaw-gw._tcp` onder een toegewezen zone
   (voorbeeld: `openclaw.internal.`).
3. Configureer Tailscale **split DNS**, zodat je gekozen domein voor clients
   (inclusief iOS) via die DNS-server wordt opgelost.

OpenClaw ondersteunt elk detectiedomein; `openclaw.internal.` is slechts een voorbeeld.
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

Dit installeert CoreDNS en configureert het om:

- alleen op poort 53 te luisteren op de Tailscale-interfaces van de Gateway
- je gekozen domein (voorbeeld: `openclaw.internal.`) te bedienen vanuit `~/.openclaw/dns/<domain>.db`

Valideer vanaf een machine die met de tailnet is verbonden:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS-instellingen

In de Tailscale-beheerconsole:

- Voeg een nameserver toe die verwijst naar het tailnet-IP van de Gateway (UDP/TCP 53).
- Voeg split DNS toe zodat je detectiedomein die nameserver gebruikt.

Zodra clients tailnet-DNS accepteren, kunnen iOS-nodes en CLI-detectie
`_openclaw-gw._tcp` in je detectiedomein browsen zonder multicast.

### Beveiliging van de Gateway-listener (aanbevolen)

De Gateway WS-poort (standaard `18789`) bindt standaard aan loopback. Voor LAN-/tailnet-
toegang moet je expliciet binden en authenticatie ingeschakeld houden.

Voor configuraties die alleen via tailnet werken:

- Stel `gateway.bind: "tailnet"` in `~/.openclaw/openclaw.json` in.
- Herstart de Gateway (of herstart de macOS-menubalkapp).

## Wat adverteert

Alleen de Gateway adverteert `_openclaw-gw._tcp`. LAN-multicastadvertising wordt
geleverd door de gebundelde `bonjour` Plugin; wide-area DNS-SD-publicatie blijft
eigendom van de Gateway.

## Servicetypen

- `_openclaw-gw._tcp` — transportbaken van de Gateway (gebruikt door macOS-/iOS-/Android-nodes).

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
- `tailnetDns=<magicdns>` (alleen mDNS volledige modus, optionele hint wanneer Tailnet beschikbaar is)
- `sshPort=<port>` (alleen mDNS volledige modus; wide-area DNS-SD kan dit weglaten)
- `cliPath=<path>` (alleen mDNS volledige modus; wide-area DNS-SD schrijft dit nog steeds als hint voor installatie op afstand)

Beveiligingsnotities:

- Bonjour-/mDNS-TXT-records zijn **niet geauthenticeerd**. Clients mogen TXT niet als gezaghebbende routering beschouwen.
- Clients moeten routeren met het opgeloste service-eindpunt (SRV + A/AAAA). Behandel `lanHost`, `tailnetDns`, `gatewayPort` en `gatewayTlsSha256` alleen als hints.
- Automatisch SSH-targeten moet eveneens de opgeloste servicehost gebruiken, niet uitsluitend TXT-hints.
- TLS-pinning mag nooit toestaan dat een geadverteerde `gatewayTlsSha256` een eerder opgeslagen pin overschrijft.
- iOS-/Android-nodes moeten directe verbindingen op basis van detectie als **alleen TLS** behandelen en expliciete gebruikersbevestiging vereisen voordat een fingerprint voor de eerste keer wordt vertrouwd.

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

Als browsen werkt maar oplossen mislukt, heb je meestal te maken met LAN-beleid of
een probleem met de mDNS-resolver.

## Debuggen in Gateway-logs

De Gateway schrijft een roterend logbestand (bij het opstarten afgedrukt als
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

De iOS-node gebruikt `NWBrowser` om `_openclaw-gw._tcp` te detecteren.

Logs vastleggen:

- Instellingen → Gateway → Geavanceerd → **Debuglogs voor detectie**
- Instellingen → Gateway → Geavanceerd → **Detectielogs** → reproduceren → **Kopiëren**

De log bevat browserstatusovergangen en wijzigingen in de resultatenset.

## Wanneer Bonjour uitschakelen

Schakel Bonjour alleen uit wanneer LAN-multicastadvertising niet beschikbaar of schadelijk is.
Het gebruikelijke geval is een Gateway die achter Docker bridge networking, WSL of een
netwerkbeleid draait dat mDNS-multicast blokkeert. In die omgevingen is de Gateway
nog steeds bereikbaar via de gepubliceerde URL, SSH, Tailnet of wide-area DNS-SD,
maar LAN-autodetectie is niet betrouwbaar.

Gebruik bij voorkeur de bestaande omgevingsoverschrijving wanneer het probleem implementatiegebonden is:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Dat schakelt LAN-multicastadvertising uit zonder de Plugin-configuratie te wijzigen.
Het is veilig voor Docker-images, servicebestanden, startscripts en eenmalig
debuggen, omdat de instelling verdwijnt wanneer de omgeving dat doet.

Gebruik Plugin-configuratie alleen wanneer je de gebundelde LAN-detectie-Plugin
bewust wilt uitschakelen voor die OpenClaw-configuratie:

```bash
openclaw plugins disable bonjour
```

## Docker-valkuilen

De gebundelde Bonjour-Plugin schakelt LAN-multicastadvertising automatisch uit in gedetecteerde
containers wanneer `OPENCLAW_DISABLE_BONJOUR` niet is ingesteld. Docker bridge networks
sturen mDNS-multicast (`224.0.0.251:5353`) meestal niet door tussen de container
en het LAN, waardoor advertising vanuit de container zelden detectie laat werken.

Belangrijke valkuilen:

- Bonjour uitschakelen stopt de Gateway niet. Het stopt alleen LAN-multicast-
  advertising.
- Bonjour uitschakelen wijzigt `gateway.bind` niet; Docker gebruikt nog steeds standaard
  `OPENCLAW_GATEWAY_BIND=lan`, zodat de gepubliceerde hostpoort kan werken.
- Bonjour uitschakelen schakelt wide-area DNS-SD niet uit. Gebruik wide-area detectie
  of Tailnet wanneer de Gateway en node zich niet op hetzelfde LAN bevinden.
- Hetzelfde `OPENCLAW_CONFIG_DIR` buiten Docker hergebruiken bewaart het beleid voor
  automatisch uitschakelen van containers niet.
- Stel `OPENCLAW_DISABLE_BONJOUR=0` alleen in voor host networking, macvlan of een ander
  netwerk waarvan bekend is dat mDNS-multicast wordt doorgelaten; stel het in op `1` om uitschakelen af te dwingen.

## Problemen met uitgeschakelde Bonjour oplossen

Als een node de Gateway niet meer automatisch detecteert na Docker-configuratie:

1. Bevestig of de Gateway in automatische, geforceerd ingeschakelde of geforceerd uitgeschakelde modus draait:

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
   - Clients over netwerken heen: Tailnet MagicDNS, Tailnet-IP, SSH-tunnel of
     wide-area DNS-SD

4. Als je Bonjour bewust in Docker hebt ingeschakeld met
   `OPENCLAW_DISABLE_BONJOUR=0`, test dan multicast vanaf de host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Als browsen leeg is of de Gateway-logs herhaalde ciao-watchdogannuleringen
   tonen, herstel dan `OPENCLAW_DISABLE_BONJOUR=1` en gebruik een directe route of
   Tailnet-route.

## Veelvoorkomende foutmodi

- **Bonjour gaat niet over netwerken heen**: gebruik Tailnet of SSH.
- **Multicast geblokkeerd**: sommige Wi‑Fi-netwerken schakelen mDNS uit.
- **Advertiser blijft hangen in probing/announcing**: hosts met geblokkeerde multicast,
  container-bridges, WSL of interfacewisselingen kunnen de ciao-advertiser in een
  niet-aangekondigde status achterlaten. OpenClaw probeert het een paar keer opnieuw en schakelt Bonjour
  vervolgens uit voor het huidige Gateway-proces in plaats van de advertiser eindeloos opnieuw te starten.
- **Docker bridge networking**: Bonjour schakelt zichzelf automatisch uit in gedetecteerde containers.
  Stel `OPENCLAW_DISABLE_BONJOUR=0` alleen in voor host, macvlan of een ander
  mDNS-geschikt netwerk.
- **Slaapstand / interfacewisselingen**: macOS kan mDNS-resultaten tijdelijk laten wegvallen; probeer opnieuw.
- **Browsen werkt maar oplossen mislukt**: houd machinenamen eenvoudig (vermijd emoji of
  interpunctie) en herstart daarna de Gateway. De service-instantienaam wordt afgeleid van
  de hostnaam, dus te complexe namen kunnen sommige resolvers in verwarring brengen.

## Geëscapete instantienamen (`\032`)

Bonjour/DNS‑SD escapt bytes in service-instantienamen vaak als decimale `\DDD`-
reeksen (spaties worden bijvoorbeeld `\032`).

- Dit is normaal op protocolniveau.
- UI’s moeten decoderen voor weergave (iOS gebruikt `BonjourEscapes.decode`).

## Uitschakelen / configuratie

- `openclaw plugins disable bonjour` schakelt LAN-multicastadvertising uit door de gebundelde Plugin uit te schakelen.
- `openclaw plugins enable bonjour` herstelt de standaard LAN-detectie-Plugin.
- `OPENCLAW_DISABLE_BONJOUR=1` schakelt LAN-multicastadvertising uit zonder de Plugin-configuratie te wijzigen; geaccepteerde truthy waarden zijn `1`, `true`, `yes` en `on` (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` dwingt LAN-multicastadvertising af, ook binnen gedetecteerde containers; geaccepteerde falsy waarden zijn `0`, `false`, `no` en `off`.
- Wanneer `OPENCLAW_DISABLE_BONJOUR` niet is ingesteld, adverteert Bonjour op normale hosts en schakelt het zichzelf automatisch uit binnen gedetecteerde containers.
- `gateway.bind` in `~/.openclaw/openclaw.json` regelt de bindmodus van de Gateway.
- `OPENCLAW_SSH_PORT` overschrijft de SSH-poort wanneer `sshPort` wordt geadverteerd (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publiceert een MagicDNS-hint in TXT wanneer mDNS volledige modus is ingeschakeld (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` overschrijft het geadverteerde CLI-pad (legacy: `OPENCLAW_CLI_PATH`).

## Gerelateerde documentatie

- Detectiebeleid en transportselectie: [Detectie](/nl/gateway/discovery)
- Node-koppeling + goedkeuringen: [Gateway-koppeling](/nl/gateway/pairing)
