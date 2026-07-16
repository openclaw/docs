---
read_when:
    - Problemen met Bonjour-detectie op macOS/iOS oplossen
    - mDNS-servicetypen, TXT-records of de gebruikerservaring voor detectie wijzigen
summary: Bonjour/mDNS-detectie + foutopsporing (Gateway-bakens, clients en veelvoorkomende foutmodi)
title: Bonjour-detectie
x-i18n:
    generated_at: "2026-07-16T15:34:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 42a46dc34e94dc86ee0432b12fcb59b3855371c745d79825a00aa557e1369160
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw kan Bonjour (mDNS/DNS-SD) gebruiken om een actieve Gateway (WebSocket-eindpunt) te detecteren. Browsen via multicast `local.` is een **gemaksfunctie die alleen binnen het LAN werkt**: de meegeleverde `bonjour`-Plugin beheert LAN-advertenties, start automatisch op macOS-hosts en is optioneel op Linux, Windows en gecontaineriseerde Gateway-implementaties. Dezelfde beacon kan ook via een geconfigureerd wide-area DNS-SD-domein worden gepubliceerd voor detectie tussen netwerken. Detectie werkt op basis van beste inspanning en vervangt **geen** connectiviteit via SSH of Tailnet.

## Wide-area Bonjour (unicast DNS-SD) via Tailscale

Als de Node en Gateway zich in verschillende netwerken bevinden, kan multicast-mDNS de grens niet passeren. Behoud dezelfde detectie-UX door over te schakelen op **unicast DNS-SD** ("Wide-Area Bonjour") via Tailscale:

1. Voer een DNS-server uit op de Gateway-host die via het Tailnet bereikbaar is.
2. Publiceer DNS-SD-records voor `_openclaw-gw._tcp` onder een afzonderlijke zone (voorbeeld: `openclaw.internal.`).
3. Configureer **split DNS** van Tailscale zodat je gekozen domein voor clients, waaronder iOS, via die DNS-server wordt omgezet.

`openclaw.internal.` hierboven is slechts een voorbeeld — OpenClaw ondersteunt elk detectiedomein. iOS-/Android-Nodes browsen zowel `local.` als je geconfigureerde wide-area-domein.

### Gateway-configuratie

```json5
{
  gateway: { bind: "tailnet" }, // alleen Tailnet (aanbevolen)
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

`discovery.wideArea.domain` accepteert ook de omgevingsvariabele `OPENCLAW_WIDE_AREA_DOMAIN` als fallback wanneer deze niet is ingesteld.

### Eenmalige configuratie van de DNS-server (Gateway-host, alleen macOS)

```bash
openclaw dns setup --apply
```

Deze opdracht werkt alleen op macOS en vereist Homebrew en een actieve Tailscale-verbinding. De opdracht installeert CoreDNS (`brew install coredns`) en configureert dit om:

- alleen op de Tailscale-interfaces van de Gateway op poort 53 te luisteren
- je gekozen domein (voorbeeld: `openclaw.internal.`) vanuit `~/.openclaw/dns/<domain>.db` aan te bieden

Voer de opdracht eerst zonder `--apply` uit om het plan (domein, pad van het zonebestand, gedetecteerd Tailnet-IP-adres en aanbevolen configuratie) te bekijken zonder iets te installeren.

Valideer vanaf een machine die met het Tailnet is verbonden:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### DNS-instellingen van Tailscale

In de Tailscale-beheerconsole:

- Voeg een nameserver toe die naar het Tailnet-IP-adres van de Gateway verwijst (UDP/TCP 53).
- Voeg split DNS toe zodat je detectiedomein die nameserver gebruikt.

Zodra clients Tailnet-DNS accepteren, kunnen iOS-Nodes en CLI-detectie zonder multicast door `_openclaw-gw._tcp` in je detectiedomein bladeren.

### Beveiliging van de Gateway-listener

De WS-poort van de Gateway (standaard `18789`) bindt standaard aan loopback. Bind expliciet en houd authenticatie ingeschakeld voor toegang via LAN/Tailnet. Stel voor configuraties die alleen Tailnet gebruiken `gateway.bind: "tailnet"` in `~/.openclaw/openclaw.json` in en start de Gateway (of de macOS-menubalkapp) opnieuw.

## Wat wordt geadverteerd

Alleen de Gateway adverteert `_openclaw-gw._tcp`. LAN-multicastadvertenties zijn afkomstig van de meegeleverde `bonjour`-Plugin wanneer deze is ingeschakeld; het publiceren via wide-area DNS-SD blijft onder beheer van de Gateway.

## Servicetypen

- `_openclaw-gw._tcp` - transportbeacon van de Gateway, gebruikt door macOS-/iOS-/Android-Nodes.

## TXT-sleutels (niet-geheime hints)

| Sleutel                       | Wanneer aanwezig                                                               |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `role=gateway`                | Altijd.                                                                        |
| `displayName=<friendly name>` | Altijd.                                                                        |
| `lanHost=<hostname>.local`    | Altijd.                                                                        |
| `gatewayPort=<port>`          | Altijd (WS + HTTP van de Gateway).                                              |
| `transport=gateway`           | Altijd.                                                                        |
| `gatewayTls=1`                | Alleen wanneer TLS is ingeschakeld.                                             |
| `gatewayTlsSha256=<sha256>`   | Alleen wanneer TLS is ingeschakeld en een fingerprint beschikbaar is.          |
| `gatewayDirectReachable=1`    | Alleen wanneer de Gateway rechtstreeks bereikbaar is (niet alleen via een relay-/proxypad). |
| `canvasPort=<port>`           | Alleen wanneer de canvashost is ingeschakeld; momenteel hetzelfde als `gatewayPort`. |
| `tailnetDns=<magicdns>`       | Alleen in volledige mDNS-modus; optionele hint wanneer Tailnet beschikbaar is. |
| `sshPort=<port>`              | Alleen in volledige modus; weggelaten in minimale en uitgeschakelde modi.       |
| `cliPath=<path>`              | Alleen in volledige modus; weggelaten in minimale en uitgeschakelde modi.       |

Beveiligingsopmerkingen:

- TXT-records van Bonjour/mDNS zijn **niet geauthenticeerd**. Clients mogen TXT niet als gezaghebbende routeringsinformatie behandelen.
- Clients moeten routeren via het omgezette service-eindpunt (SRV + A/AAAA). Behandel `lanHost`, `tailnetDns`, `gatewayPort` en `gatewayTlsSha256` uitsluitend als hints.
- Automatische SSH-doelbepaling moet eveneens de omgezette servicehost gebruiken en niet uitsluitend TXT-hints.
- Bij TLS-pinning mag een geadverteerde `gatewayTlsSha256` nooit een eerder opgeslagen pin overschrijven.
- iOS-/Android-Nodes moeten directe verbindingen op basis van detectie als **uitsluitend TLS** behandelen en expliciete bevestiging van de gebruiker vereisen voordat een fingerprint voor het eerst wordt vertrouwd.

## Foutopsporing op macOS

Ingebouwde hulpprogramma's:

```bash
# Blader door instanties
dns-sd -B _openclaw-gw._tcp local.

# Zet één instantie om (vervang <instance>)
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

Als browsen werkt maar omzetten mislukt, is er meestal sprake van een LAN-beleidsprobleem of een probleem met de mDNS-resolver.

## Foutopsporing in Gateway-logboeken

De Gateway schrijft een roulerend logbestand (bij het opstarten weergegeven als `gateway log file: ...`). Zoek naar regels met `bonjour:`, met name:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao netmask assertion ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`

OpenClaw start elke Bonjour-service één keer en laat probing, nieuwe pogingen, het oplossen van naamconflicten en opnieuw publiceren na interfacewijzigingen over aan de mDNS-responder. Dit voorkomt overlappende publicatiepogingen tijdens normale netwerkwijzigingen. Herhaalde interne zelfprobeberichten worden onderdrukt, zodat ze het Gateway-logboek niet kunnen overspoelen.

Wanneer meerdere OpenClaw-Gateways vanaf dezelfde host adverteren, kan Bonjour achtervoegsels zoals `(2)` of `(3)` toevoegen om namen van service-instanties uniek te houden. Deze achtervoegsels zijn het normale resultaat van conflictoplossing en duiden niet op dubbel OCM-toezicht.

Bonjour gebruikt de systeemhostnaam voor de geadverteerde `.local`-host wanneer deze een geldig DNS-label is. Als de systeemhostnaam spaties, underscores of een ander ongeldig teken voor een DNS-label bevat, valt OpenClaw terug op `openclaw.local`. Stel `OPENCLAW_MDNS_HOSTNAME=<name>` in voordat je de Gateway start wanneer je een expliciet hostlabel nodig hebt.

## Foutopsporing op een iOS-Node

De iOS-Node gebruikt `NWBrowser` om `_openclaw-gw._tcp` te detecteren.

Logboeken vastleggen: Settings -> Gateway -> Advanced -> **Discovery Debug Logs**, vervolgens Settings -> Gateway -> Advanced -> **Discovery Logs** -> reproduceren -> **Copy**. Het logboek bevat statusovergangen van de browser en wijzigingen in de resultatenset.

## Wanneer Bonjour moet worden ingeschakeld

Bonjour start automatisch wanneer de Gateway op een macOS-host met een lege configuratie wordt gestart, omdat de lokale app en nabijgelegen iOS-/Android-Nodes doorgaans afhankelijk zijn van detectie binnen hetzelfde LAN.

Schakel het expliciet in wanneer automatische detectie binnen hetzelfde LAN nuttig is op Linux, Windows of een andere niet-macOS-host:

```bash
openclaw plugins enable bonjour
```

Wanneer Bonjour is ingeschakeld, gebruikt het `discovery.mdns.mode` om te bepalen hoeveel TXT-metadata moet worden gepubliceerd; dezelfde modus beheert optionele TXT-hints in wide-area DNS-SD-records. Modi:

| Modus               | Gedrag                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` (standaard) | Alleen kern-TXT-sleutels; laat `sshPort`, `cliPath` en `tailnetDns` weg.                                                                                              |
| `full`              | Voegt `sshPort`, `cliPath` en `tailnetDns` toe — gebruik dit wanneer clients die hints nodig hebben.                                                                 |
| `off`               | Onderdrukt LAN-multicast zonder de inschakeling van de Plugin te wijzigen; wide-area DNS-SD kan de minimale beacon nog steeds publiceren wanneer `discovery.wideArea.enabled` waar is. |

## Wanneer Bonjour moet worden uitgeschakeld

Laat Bonjour uitgeschakeld wanneer LAN-multicastadvertenties onnodig, niet beschikbaar of schadelijk zijn — veelvoorkomende gevallen zijn niet-macOS-servers, Docker-bridge-netwerken, WSL of een netwerkbeleid dat mDNS-multicast blokkeert. De Gateway blijft bereikbaar via de gepubliceerde URL, SSH, Tailnet of wide-area DNS-SD; alleen automatische LAN-detectie is onbetrouwbaar.

Gebruik de omgevingsoverschrijving voor implementatiespecifieke problemen (veilig voor Docker-images, servicebestanden, startscripts en eenmalige foutopsporing — deze verdwijnt wanneer de omgeving verdwijnt):

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Gebruik de Plugin-configuratie wanneer je de meegeleverde LAN-detectie-Plugin voor die OpenClaw-configuratie bewust wilt uitschakelen:

```bash
openclaw plugins disable bonjour
```

## Aandachtspunten voor Docker

De meegeleverde Bonjour-Plugin schakelt LAN-multicastadvertenties automatisch uit in gedetecteerde containers wanneer `OPENCLAW_DISABLE_BONJOUR` niet is ingesteld. Docker-bridge-netwerken sturen mDNS-multicast (`224.0.0.251:5353`) doorgaans niet door tussen de container en het LAN, waardoor adverteren vanuit de container er zelden voor zorgt dat detectie werkt.

Aandachtspunten:

- Bonjour start automatisch op macOS-hosts en is elders optioneel. Als je het uitgeschakeld laat, stopt de Gateway niet — alleen LAN-multicastadvertenties worden overgeslagen.
- Het uitschakelen van Bonjour wijzigt `gateway.bind` niet; Docker gebruikt nog steeds standaard `OPENCLAW_GATEWAY_BIND=lan`, zodat de gepubliceerde hostpoort werkt.
- Het uitschakelen van Bonjour schakelt wide-area DNS-SD niet uit. Gebruik wide-area-detectie of Tailnet wanneer de Gateway en Node zich niet in hetzelfde LAN bevinden.
- Het hergebruiken van dezelfde `OPENCLAW_CONFIG_DIR` buiten Docker maakt het beleid voor automatisch uitschakelen van containers niet permanent.
- Stel `OPENCLAW_DISABLE_BONJOUR=0` alleen in voor hostnetwerken, macvlan of een ander netwerk waarvan bekend is dat mDNS-multicast erdoorheen komt; stel dit in op `1` om uitschakeling af te dwingen.

## Problemen met uitgeschakeld Bonjour oplossen

Als een Node de Gateway na de Docker-configuratie niet meer automatisch detecteert:

1. Controleer of de Gateway in de automatische, geforceerd ingeschakelde of geforceerd uitgeschakelde modus wordt uitgevoerd:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Controleer of de Gateway zelf via de gepubliceerde poort bereikbaar is:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Gebruik een rechtstreeks doel wanneer Bonjour is uitgeschakeld:
   - Control UI of lokale hulpprogramma's: `http://127.0.0.1:18789`
   - LAN-clients: `http://<gateway-host>:18789`
   - Clients in andere netwerken: Tailnet MagicDNS, Tailnet-IP-adres, SSH-tunnel of wide-area DNS-SD

4. Als je de Bonjour-Plugin in Docker bewust hebt ingeschakeld en adverteren hebt afgedwongen met `OPENCLAW_DISABLE_BONJOUR=0`, test je multicast vanaf de host:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Als browsen geen resultaten oplevert of de Gateway-logboeken herhaaldelijke ciao-probefouten tonen, herstel je `OPENCLAW_DISABLE_BONJOUR=1` en gebruik je een rechtstreekse route of Tailnet-route.

## Veelvoorkomende foutscenario's

- **Bonjour werkt niet over verschillende netwerken**: gebruik Tailnet of SSH.
- **Multicast geblokkeerd**: sommige Wi-Fi-netwerken schakelen mDNS uit.
- **Adverteerder blijft hangen bij detecteren/aankondigen**: hosts met geblokkeerde multicast, containerbridges, WSL of wisselende interfaces kunnen ervoor zorgen dat de responder in een niet-aangekondigde toestand blijft. De Gateway blijft beschikbaar via directe, SSH-, Tailnet- of wide-area DNS-SD-routes; schakel LAN Bonjour uit met `discovery.mdns.mode: "off"` of `OPENCLAW_DISABLE_BONJOUR=1` wanneer multicast niet beschikbaar is.
- **Docker-bridgenetwerken**: Bonjour wordt automatisch uitgeschakeld in gedetecteerde containers. Stel `OPENCLAW_DISABLE_BONJOUR=0` alleen in voor een host-, macvlan- of ander mDNS-compatibel netwerk.
- **Slaapstand/wisselende interfaces**: macOS kan mDNS-resultaten tijdelijk kwijtraken; probeer het opnieuw.
- **Bladeren werkt, maar omzetten mislukt**: houd computernamen eenvoudig (vermijd emoji's en leestekens) en start daarna de Gateway opnieuw. De naam van de service-instantie wordt afgeleid van de hostnaam, waardoor te complexe namen sommige resolvers in de war kunnen brengen.

## Geëscapete instantienamen (`\032`)

Bonjour/DNS-SD escapeert bytes in namen van service-instanties vaak als decimale `\DDD`-reeksen (spaties worden `\032`). Dit is normaal op protocolniveau; gebruikersinterfaces moeten deze decoderen voor weergave (iOS gebruikt `BonjourEscapes.decode`).

## Inschakelen / uitschakelen / configuratie

| Instelling                                              | Effect                                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | Schakelt de gebundelde Plugin voor LAN-detectie in op hosts waarop deze niet standaard is ingeschakeld. |
| `openclaw plugins disable bonjour`                   | Schakelt multicastadvertenties op het LAN uit door de gebundelde Plugin uit te schakelen.               |
| `OPENCLAW_DISABLE_BONJOUR=1` (of `true`/`yes`/`on`)  | Schakelt multicastadvertenties op het LAN uit zonder de Plugin-configuratie te wijzigen.                |
| `OPENCLAW_DISABLE_BONJOUR=0` (of `false`/`no`/`off`) | Dwingt multicastadvertenties op het LAN af, ook binnen gedetecteerde containers.        |
| `discovery.mdns.mode`                                | `off` \| `minimal` (standaard) \| `full` — zie de modi hierboven.                         |
| `gateway.bind`                                       | Bepaalt de bindmodus van de Gateway in `~/.openclaw/openclaw.json`.                    |
| `OPENCLAW_SSH_PORT`                                  | Overschrijft de SSH-poort wanneer `sshPort` wordt geadverteerd (volledige modus).                  |
| `OPENCLAW_TAILNET_DNS`                               | Publiceert een MagicDNS-hint in TXT wanneer de volledige mDNS-modus is ingeschakeld.                  |
| `OPENCLAW_CLI_PATH`                                  | Overschrijft het geadverteerde CLI-pad (volledige modus).                                    |

macOS-hosts starten de gebundelde Plugin voor LAN-detectie standaard automatisch. Wanneer de Bonjour-Plugin is ingeschakeld en `OPENCLAW_DISABLE_BONJOUR` niet is ingesteld, adverteert Bonjour op normale hosts en wordt het automatisch uitgeschakeld binnen gedetecteerde containers (Docker, Fly.io-machines en gangbare containerruntimes).

## Gerelateerde documentatie

- Detectiebeleid en transportselectie: [Detectie](/nl/gateway/discovery)
- Node-koppeling en goedkeuringen: [Gateway-koppeling](/nl/gateway/pairing)
