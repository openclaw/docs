---
read_when:
    - Problemen met Bonjour-detectie op macOS/iOS oplossen
    - mDNS-servicetypen, TXT-records of de detectie-UX wijzigen
summary: Bonjour-/mDNS-detectie en foutopsporing (Gateway-bakens, clients en veelvoorkomende foutmodi)
title: Bonjour-detectie
x-i18n:
    generated_at: "2026-07-12T08:50:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0526c9e20dd02d143ae7aa4c8e1e6830763763e95c9a74c4d73332c5e5e155e
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw kan Bonjour (mDNS/DNS-SD) gebruiken om een actieve Gateway (WebSocket-eindpunt) te ontdekken. Multicastnavigatie in `local.` is een **gemaksfunctie uitsluitend voor het LAN**: de meegeleverde `bonjour`-Plugin beheert LAN-advertenties, start automatisch op macOS-hosts en is opt-in op Linux, Windows en gecontaineriseerde Gateway-implementaties. Dezelfde beacon kan ook via een geconfigureerd domein voor wide-area DNS-SD worden gepubliceerd voor ontdekking tussen netwerken. Ontdekking werkt op basis van beste inspanning en vervangt **geen** connectiviteit via SSH of Tailnet.

## Wide-area Bonjour (unicast-DNS-SD) via Tailscale

Als de Node en Gateway zich op verschillende netwerken bevinden, kan multicast-mDNS de grens niet overschrijden. Behoud dezelfde ontdekkingservaring door over te schakelen op **unicast-DNS-SD** ("Wide-Area Bonjour") via Tailscale:

1. Voer een DNS-server uit op de Gateway-host die via het Tailnet bereikbaar is.
2. Publiceer DNS-SD-records voor `_openclaw-gw._tcp` onder een afzonderlijke zone (voorbeeld: `openclaw.internal.`).
3. Configureer **split DNS** van Tailscale zodat het gekozen domein voor clients, waaronder iOS, via die DNS-server wordt omgezet.

`openclaw.internal.` hierboven is slechts een voorbeeld — OpenClaw ondersteunt elk ontdekkingsdomein. iOS-/Android-nodes doorzoeken zowel `local.` als het geconfigureerde wide-area-domein.

### Gateway-configuratie

```json5
{
  gateway: { bind: "tailnet" }, // alleen tailnet (aanbevolen)
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

`discovery.wideArea.domain` accepteert ook de omgevingsvariabele `OPENCLAW_WIDE_AREA_DOMAIN` als terugval wanneer deze niet is ingesteld.

### Eenmalige installatie van de DNS-server (Gateway-host, alleen macOS)

```bash
openclaw dns setup --apply
```

Deze opdracht werkt alleen op macOS en vereist Homebrew en een actieve Tailscale-verbinding. De opdracht installeert CoreDNS (`brew install coredns`) en configureert dit om:

- alleen op poort 53 van de Tailscale-interfaces van de Gateway te luisteren
- het gekozen domein (voorbeeld: `openclaw.internal.`) vanuit `~/.openclaw/dns/<domain>.db` aan te bieden

Voer de opdracht eerst zonder `--apply` uit om het plan (domein, pad van het zonebestand, gedetecteerd Tailnet-IP-adres, aanbevolen configuratie) vooraf te bekijken zonder iets te installeren.

Valideer vanaf een met Tailnet verbonden machine:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### DNS-instellingen van Tailscale

In de Tailscale-beheerconsole:

- Voeg een naamserver toe die naar het Tailnet-IP-adres van de Gateway verwijst (UDP/TCP 53).
- Voeg split DNS toe zodat het ontdekkingsdomein die naamserver gebruikt.

Zodra clients Tailnet-DNS accepteren, kunnen iOS-nodes en CLI-ontdekking `_openclaw-gw._tcp` zonder multicast in het ontdekkingsdomein doorzoeken.

### Beveiliging van de Gateway-listener

De WS-poort van de Gateway (standaard `18789`) bindt standaard aan local loopback. Bind expliciet voor LAN-/Tailnet-toegang en houd authenticatie ingeschakeld. Stel voor installaties die uitsluitend Tailnet gebruiken `gateway.bind: "tailnet"` in `~/.openclaw/openclaw.json` in en start de Gateway (of de macOS-menubalkapp) opnieuw.

## Wat adverteert

Alleen de Gateway adverteert `_openclaw-gw._tcp`. LAN-multicastadvertenties zijn afkomstig van de meegeleverde `bonjour`-Plugin wanneer deze is ingeschakeld; de publicatie van wide-area DNS-SD blijft eigendom van de Gateway.

## Servicetypen

- `_openclaw-gw._tcp` - transportbeacon van de Gateway, gebruikt door macOS-/iOS-/Android-nodes.

## TXT-sleutels (niet-geheime hints)

| Sleutel                        | Indien aanwezig                                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| `role=gateway`                | Altijd.                                                                                         |
| `displayName=<friendly name>` | Altijd.                                                                                         |
| `lanHost=<hostname>.local`    | Altijd.                                                                                         |
| `gatewayPort=<port>`          | Altijd (WS + HTTP van de Gateway).                                                              |
| `transport=gateway`           | Altijd.                                                                                         |
| `gatewayTls=1`                | Alleen wanneer TLS is ingeschakeld.                                                             |
| `gatewayTlsSha256=<sha256>`   | Alleen wanneer TLS is ingeschakeld en een vingerafdruk beschikbaar is.                          |
| `gatewayDirectReachable=1`    | Alleen wanneer de Gateway rechtstreeks bereikbaar is (niet uitsluitend via een relay/proxy-pad). |
| `canvasPort=<port>`           | Alleen wanneer de canvashost is ingeschakeld; momenteel hetzelfde als `gatewayPort`.            |
| `tailnetDns=<magicdns>`       | Alleen in volledige mDNS-modus; optionele hint wanneer Tailnet beschikbaar is.                  |
| `sshPort=<port>`              | Alleen in volledige modus; weggelaten in de minimale en uitgeschakelde modus.                   |
| `cliPath=<path>`              | Alleen in volledige modus; weggelaten in de minimale en uitgeschakelde modus.                   |

Beveiligingsopmerkingen:

- TXT-records van Bonjour/mDNS zijn **niet geauthenticeerd**. Clients mogen TXT niet als gezaghebbende routeringsinformatie beschouwen.
- Clients moeten routeren via het omgezette service-eindpunt (SRV + A/AAAA). Beschouw `lanHost`, `tailnetDns`, `gatewayPort` en `gatewayTlsSha256` uitsluitend als hints.
- Automatische SSH-doelselectie moet eveneens de omgezette servicehost gebruiken, niet uitsluitend TXT-hints.
- TLS-pinning mag nooit toestaan dat een geadverteerde `gatewayTlsSha256` een eerder opgeslagen pin overschrijft.
- iOS-/Android-nodes moeten rechtstreekse verbindingen op basis van ontdekking als **uitsluitend TLS** behandelen en expliciete gebruikersbevestiging vereisen voordat een eerste vingerafdruk wordt vertrouwd.

## Foutopsporing op macOS

Ingebouwde hulpmiddelen:

```bash
# Instanties doorzoeken
dns-sd -B _openclaw-gw._tcp local.

# Eén instantie omzetten (vervang <instance>)
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

Als doorzoeken werkt maar omzetten mislukt, wordt dit doorgaans veroorzaakt door een LAN-beleid of een probleem met de mDNS-resolver.

## Foutopsporing in Gateway-logboeken

De Gateway schrijft een roterend logbestand (bij het opstarten weergegeven als `gateway log file: ...`). Zoek naar regels met `bonjour:`, met name:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

De watchdog beschouwt actieve `probing`, `announcing` en recente hernoemingen vanwege conflicten als lopende toestanden. Als de service nooit de toestand `announced` bereikt, maakt OpenClaw de adverteerder opnieuw aan en schakelt het Bonjour na herhaalde fouten voor dat Gateway-proces uit, in plaats van eindeloos opnieuw te adverteren.

Bonjour gebruikt de systeemhostnaam voor de geadverteerde `.local`-host wanneer deze een geldig DNS-label is. Als de systeemhostnaam spaties, underscores of een ander ongeldig teken voor DNS-labels bevat, valt OpenClaw terug op `openclaw.local`. Stel `OPENCLAW_MDNS_HOSTNAME=<name>` in voordat u de Gateway start wanneer u een expliciet hostlabel nodig hebt.

## Foutopsporing op de iOS-node

De iOS-node gebruikt `NWBrowser` om `_openclaw-gw._tcp` te ontdekken.

Om logboeken vast te leggen: Settings -> Gateway -> Advanced -> **Discovery Debug Logs**, vervolgens Settings -> Gateway -> Advanced -> **Discovery Logs** -> reproduceren -> **Copy**. Het logboek bevat toestandsovergangen van de browser en wijzigingen in de resultatenset.

## Wanneer Bonjour inschakelen

Bonjour start automatisch wanneer de Gateway op een macOS-host met een lege configuratie wordt gestart, omdat de lokale app en nabijgelegen iOS-/Android-nodes vaak afhankelijk zijn van ontdekking op hetzelfde LAN.

Schakel het expliciet in wanneer automatische ontdekking op hetzelfde LAN nuttig is op Linux, Windows of een andere niet-macOS-host:

```bash
openclaw plugins enable bonjour
```

Wanneer Bonjour is ingeschakeld, gebruikt het `discovery.mdns.mode` om te bepalen hoeveel TXT-metagegevens worden gepubliceerd; dezelfde modus regelt optionele TXT-hints in wide-area DNS-SD-records. Modi:

| Modus               | Gedrag                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` (standaard) | Alleen de belangrijkste TXT-sleutels; laat `sshPort`, `cliPath` en `tailnetDns` weg.                                                                         |
| `full`              | Voegt `sshPort`, `cliPath` en `tailnetDns` toe — gebruik dit wanneer clients deze hints nodig hebben.                                                         |
| `off`               | Onderdrukt LAN-multicast zonder de inschakeling van de Plugin te wijzigen; wide-area DNS-SD kan de minimale beacon nog steeds publiceren wanneer `discovery.wideArea.enabled` waar is. |

## Wanneer Bonjour uitschakelen

Laat Bonjour uitgeschakeld wanneer LAN-multicastadvertenties onnodig, niet beschikbaar of schadelijk zijn — veelvoorkomende gevallen zijn niet-macOS-servers, Docker-bridgenetwerken, WSL of een netwerkbeleid dat mDNS-multicast blokkeert. De Gateway blijft bereikbaar via de gepubliceerde URL, SSH, Tailnet of wide-area DNS-SD; alleen automatische LAN-ontdekking is onbetrouwbaar.

Gebruik de omgevingsoverschrijving voor implementatiespecifieke problemen (veilig voor Docker-images, servicebestanden, opstartscripts en eenmalige foutopsporing — deze verdwijnt wanneer de omgeving verdwijnt):

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Gebruik de Plugin-configuratie wanneer u de meegeleverde LAN-ontdekkings-Plugin voor die OpenClaw-configuratie bewust wilt uitschakelen:

```bash
openclaw plugins disable bonjour
```

## Aandachtspunten voor Docker

De meegeleverde Bonjour-Plugin schakelt LAN-multicastadvertenties automatisch uit in gedetecteerde containers wanneer `OPENCLAW_DISABLE_BONJOUR` niet is ingesteld. Docker-bridgenetwerken sturen mDNS-multicast (`224.0.0.251:5353`) doorgaans niet door tussen de container en het LAN, waardoor advertenties vanuit de container ontdekking zelden laten werken.

Aandachtspunten:

- Bonjour start automatisch op macOS-hosts en is elders opt-in. Als het uitgeschakeld blijft, stopt de Gateway niet — alleen LAN-multicastadvertenties worden overgeslagen.
- Het uitschakelen van Bonjour wijzigt `gateway.bind` niet; Docker gebruikt nog steeds standaard `OPENCLAW_GATEWAY_BIND=lan`, zodat de gepubliceerde hostpoort werkt.
- Het uitschakelen van Bonjour schakelt wide-area DNS-SD niet uit. Gebruik wide-area-ontdekking of Tailnet wanneer de Gateway en Node zich niet op hetzelfde LAN bevinden.
- Hergebruik van dezelfde `OPENCLAW_CONFIG_DIR` buiten Docker maakt het beleid voor automatische uitschakeling in containers niet persistent.
- Stel `OPENCLAW_DISABLE_BONJOUR=0` alleen in voor hostnetwerken, macvlan of een ander netwerk waarvan bekend is dat mDNS-multicast wordt doorgelaten; stel dit in op `1` om uitschakeling af te dwingen.

## Problemen met uitgeschakelde Bonjour oplossen

Als een Node de Gateway na de Docker-installatie niet meer automatisch ontdekt:

1. Controleer of de Gateway in automatische, geforceerd ingeschakelde of geforceerd uitgeschakelde modus wordt uitgevoerd:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Controleer of de Gateway zelf bereikbaar is via de gepubliceerde poort:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Gebruik een rechtstreeks doel wanneer Bonjour is uitgeschakeld:
   - Control UI of lokale hulpmiddelen: `http://127.0.0.1:18789`
   - LAN-clients: `http://<gateway-host>:18789`
   - Clients op andere netwerken: Tailnet MagicDNS, Tailnet-IP-adres, SSH-tunnel of wide-area DNS-SD

4. Als u de Bonjour-Plugin bewust in Docker hebt ingeschakeld en advertenties hebt afgedwongen met `OPENCLAW_DISABLE_BONJOUR=0`, test u multicast vanaf de host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Als het doorzoeken geen resultaten oplevert of de Gateway-logboeken herhaalde annuleringen door de ciao-watchdog tonen, herstelt u `OPENCLAW_DISABLE_BONJOUR=1` en gebruikt u een rechtstreekse route of Tailnet-route.

## Veelvoorkomende foutmodi

- **Bonjour werkt niet over netwerkgrenzen heen**: gebruik Tailnet of SSH.
- **Multicast geblokkeerd**: sommige wifi-netwerken schakelen mDNS uit.
- **Advertiser blijft hangen tijdens detecteren/aankondigen**: hosts met geblokkeerde multicast, containerbridges, WSL of wisselende interfaces kunnen ervoor zorgen dat de ciao-advertiser in een niet-aangekondigde toestand blijft. OpenClaw probeert het enkele keren opnieuw en schakelt vervolgens Bonjour uit voor het huidige Gateway-proces, in plaats van de advertiser eindeloos opnieuw te starten.
- **Docker-bridgenetwerken**: Bonjour wordt automatisch uitgeschakeld in gedetecteerde containers. Stel `OPENCLAW_DISABLE_BONJOUR=0` alleen in voor host-, macvlan- of andere netwerken die mDNS ondersteunen.
- **Slaapstand/wisselende interfaces**: macOS kan mDNS-resultaten tijdelijk verliezen; probeer het opnieuw.
- **Browsen werkt, maar omzetten mislukt**: houd computernamen eenvoudig (vermijd emoji's en leestekens) en start vervolgens de Gateway opnieuw. De naam van de service-instantie wordt afgeleid van de hostnaam, waardoor te complexe namen sommige resolvers in de war kunnen brengen.

## Geëscapete instantienamen (`\032`)

Bonjour/DNS-SD escapeert bytes in namen van service-instanties vaak als decimale `\DDD`-reeksen (spaties worden `\032`). Dit is normaal op protocolniveau; UI's moeten deze voor weergave decoderen (iOS gebruikt `BonjourEscapes.decode`).

## Inschakelen / uitschakelen / configuratie

| Instelling                                           | Effect                                                                                                                      |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | Schakelt de meegeleverde Plugin voor LAN-detectie in op hosts waar deze niet standaard is ingeschakeld.                      |
| `openclaw plugins disable bonjour`                   | Schakelt LAN-multicastadvertenties uit door de meegeleverde Plugin uit te schakelen.                                         |
| `OPENCLAW_DISABLE_BONJOUR=1` (of `true`/`yes`/`on`)  | Schakelt LAN-multicastadvertenties uit zonder de Plugin-configuratie te wijzigen.                                            |
| `OPENCLAW_DISABLE_BONJOUR=0` (of `false`/`no`/`off`) | Forceert LAN-multicastadvertenties, ook binnen gedetecteerde containers.                                                     |
| `discovery.mdns.mode`                                | `off` \| `minimal` (standaard) \| `full` — zie de modi hierboven.                                                            |
| `gateway.bind`                                       | Bepaalt de bindmodus van de Gateway in `~/.openclaw/openclaw.json`.                                                          |
| `OPENCLAW_SSH_PORT`                                  | Overschrijft de SSH-poort wanneer `sshPort` wordt geadverteerd (volledige modus).                                            |
| `OPENCLAW_TAILNET_DNS`                               | Publiceert een MagicDNS-hint in TXT wanneer de volledige mDNS-modus is ingeschakeld.                                        |
| `OPENCLAW_CLI_PATH`                                  | Overschrijft het geadverteerde CLI-pad (volledige modus).                                                                   |

macOS-hosts starten de meegeleverde Plugin voor LAN-detectie standaard automatisch. Wanneer de Bonjour-Plugin is ingeschakeld en `OPENCLAW_DISABLE_BONJOUR` niet is ingesteld, adverteert Bonjour op normale hosts en wordt het automatisch uitgeschakeld binnen gedetecteerde containers (Docker, Fly.io-machines en gangbare containerruntimes).

## Gerelateerde documentatie

- Detectiebeleid en transportselectie: [Detectie](/nl/gateway/discovery)
- Node-koppeling en goedkeuringen: [Gateway-koppeling](/nl/gateway/pairing)
