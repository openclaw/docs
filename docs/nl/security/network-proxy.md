---
read_when:
    - Je wilt gelaagde verdediging tegen SSRF- en DNS-rebindingaanvallen
    - Een externe forward proxy configureren voor OpenClaw-runtimeverkeer
summary: OpenClaw-runtime-HTTP- en WebSocket-verkeer routeren via een door de operator beheerde filterproxy
title: Netwerkproxy
x-i18n:
    generated_at: "2026-04-29T23:18:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: d5f6c2ba03ef9826675bb82957be21ec690631fcf5eca1e99775c3c145cd1531
    source_path: security/network-proxy.md
    workflow: 16
---

# Netwerkproxy

OpenClaw kan runtime HTTP- en WebSocket-verkeer routeren via een door de operator beheerde forward proxy. Dit is optionele defense-in-depth voor implementaties die centrale egress-controle, sterkere SSRF-bescherming en betere netwerkcontroleerbaarheid willen.

OpenClaw levert, downloadt, start, configureert of certificeert geen proxy. U gebruikt de proxytechnologie die bij uw omgeving past, en OpenClaw routeert normale proceslokale HTTP- en WebSocket-clients via deze proxy.

## Waarom een proxy gebruiken?

Een proxy geeft operators één netwerkcontrolepunt voor uitgaand HTTP- en WebSocket-verkeer. Dat kan zelfs buiten SSRF-verharding nuttig zijn:

- Centraal beleid: onderhoud één egress-beleid in plaats van erop te vertrouwen dat elke HTTP-aanroepplaats in de applicatie de netwerkregels correct toepast.
- Controles bij verbindingstijd: evalueer de bestemming na DNS-resolutie en direct voordat de proxy de upstreamverbinding opent.
- Verdediging tegen DNS rebinding: verklein de kloof tussen een DNS-controle op applicatieniveau en de daadwerkelijke uitgaande verbinding.
- Bredere JavaScript-dekking: routeer gewone `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch en vergelijkbare clients via hetzelfde pad.
- Controleerbaarheid: log toegestane en geweigerde bestemmingen aan de egress-grens.
- Operationele controle: dwing bestemmingsregels, netwerksegmentatie, snelheidslimieten of uitgaande allowlists af zonder OpenClaw opnieuw te bouwen.

Proxyrouting is een bewakingsrail op procesniveau voor normale HTTP- en WebSocket-egress. Het geeft operators een fail-closed pad om ondersteunde JavaScript HTTP-clients via hun eigen filterende proxy te routeren, maar het is geen netwerksandbox op OS-niveau en zorgt er niet voor dat OpenClaw het bestemmingsbeleid van de proxy certificeert.

## Hoe OpenClaw verkeer routeert

Wanneer `proxy.enabled=true` en een proxy-URL is geconfigureerd, routeren beschermde runtimeprocessen zoals `openclaw gateway run`, `openclaw node run` en `openclaw agent --local` normale HTTP- en WebSocket-egress via de geconfigureerde proxy:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Het publieke contract is het routeringsgedrag, niet de interne Node-hooks die worden gebruikt om het te implementeren. OpenClaw Gateway-controlplane WebSocket-clients gebruiken een smal direct pad voor local loopback Gateway RPC-verkeer wanneer de Gateway-URL `localhost` of een letterlijk loopback-IP gebruikt, zoals `127.0.0.1` of `[::1]`. Dat controlplane-pad moet loopback-Gateways kunnen bereiken, zelfs wanneer de operatorproxy loopbackbestemmingen blokkeert. Normale runtime HTTP- en WebSocket-aanvragen blijven de geconfigureerde proxy gebruiken.

De proxy-URL zelf moet `http://` gebruiken. HTTPS-bestemmingen worden nog steeds ondersteund via de proxy met HTTP `CONNECT`; dit betekent alleen dat OpenClaw een gewone HTTP-forward-proxylistener verwacht, zoals `http://127.0.0.1:3128`.

Terwijl de proxy actief is, wist OpenClaw `no_proxy`, `NO_PROXY` en `GLOBAL_AGENT_NO_PROXY`. Die bypasslijsten zijn gebaseerd op bestemming, dus als `localhost` of `127.0.0.1` daar zou blijven staan, zouden risicovolle SSRF-doelen de filterende proxy kunnen overslaan.

Bij afsluiten herstelt OpenClaw de vorige proxyomgeving en reset het de gecachte procesrouteringsstatus.

## Configuratie

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

U kunt de URL ook via de omgeving opgeven, terwijl `proxy.enabled=true` in de configuratie blijft staan:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` heeft voorrang op `OPENCLAW_PROXY_URL`.

Als `enabled=true` maar er geen geldige proxy-URL is geconfigureerd, mislukken beschermde opdrachten bij het starten in plaats van terug te vallen op directe netwerktoegang.

Voor beheerde gatewayservices die met `openclaw gateway start` worden gestart, verdient het de voorkeur de URL in de configuratie op te slaan:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

De omgevingsfallback is het meest geschikt voor foreground-uitvoeringen. Als u deze met een geïnstalleerde service gebruikt, zet `OPENCLAW_PROXY_URL` dan in de duurzame omgeving van de service, zoals `$OPENCLAW_STATE_DIR/.env` of `~/.openclaw/.env`, en installeer de service daarna opnieuw zodat launchd, systemd of Scheduled Tasks de gateway met die waarde start.

Voor `openclaw --container ...`-opdrachten geeft OpenClaw `OPENCLAW_PROXY_URL` door aan de containergerichte child-CLI wanneer deze is ingesteld. De URL moet bereikbaar zijn vanuit de container; `127.0.0.1` verwijst naar de container zelf, niet naar de host. OpenClaw weigert loopback-proxy-URL's voor containergerichte opdrachten, tenzij u die veiligheidscontrole expliciet overschrijft.

## Proxyvereisten

Het proxybeleid is de beveiligingsgrens. OpenClaw kan niet verifiëren dat de proxy de juiste doelen blokkeert.

Configureer de proxy om:

- Alleen te binden aan loopback of een vertrouwde privé-interface.
- Toegang te beperken zodat alleen het OpenClaw-proces, de host, container of serviceaccount deze kan gebruiken.
- Bestemmingen zelf te resolveren en bestemmings-IP's na DNS-resolutie te blokkeren.
- Beleid toe te passen bij verbindingstijd voor zowel gewone HTTP-aanvragen als HTTPS `CONNECT`-tunnels.
- Op bestemming gebaseerde bypasses te weigeren voor loopback-, privé-, link-local-, metadata-, multicast-, gereserveerde of documentatiebereiken.
- Hostnaam-allowlists te vermijden, tenzij u het DNS-resolutiepad volledig vertrouwt.
- Bestemming, beslissing, status en reden te loggen zonder request bodies, autorisatieheaders, cookies of andere geheimen te loggen.
- Proxybeleid onder versiebeheer te houden en wijzigingen te beoordelen als beveiligingsgevoelige configuratie.

## Aanbevolen geblokkeerde bestemmingen

Gebruik deze denylist als startpunt voor elke forward proxy, firewall of egress-beleid.

De classificatielogica op OpenClaw-applicatieniveau staat in `src/infra/net/ssrf.ts` en `src/shared/net/ip.ts`. De relevante parity-hooks zijn `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` en de ingebedde IPv4-sentinelafhandeling voor NAT64, 6to4, Teredo, ISATAP en IPv4-mapped vormen. Die bestanden zijn nuttige referenties bij het onderhouden van een extern proxybeleid, maar OpenClaw exporteert of dwingt die regels niet automatisch af in uw proxy.

| Bereik of host                                                                       | Waarom blokkeren                                    |
| ------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4-loopback                                       |
| `::1/128`                                                                            | IPv6-loopback                                       |
| `0.0.0.0/8`, `::/128`                                                                | Ongespecificeerde adressen en this-network-adressen |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918-privénetwerken                             |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-local adressen en gangbare cloudmetadatapaden |
| `169.254.169.254`, `metadata.google.internal`                                        | Cloudmetadataservices                              |
| `100.64.0.0/10`                                                                      | Gedeelde adresruimte voor carrier-grade NAT         |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Benchmarkbereiken                                  |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Bereiken voor speciaal gebruik en documentatie      |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                           |
| `240.0.0.0/4`                                                                        | Gereserveerde IPv4                                  |
| `fc00::/7`, `fec0::/10`                                                              | Lokale/privébereiken voor IPv6                      |
| `100::/64`, `2001:20::/28`                                                           | IPv6-discard- en ORCHIDv2-bereiken                  |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | NAT64-prefixes met ingebedde IPv4                   |
| `2002::/16`, `2001::/32`                                                             | 6to4 en Teredo met ingebedde IPv4                   |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-compatibele en IPv4-mapped IPv6                |

Als uw cloudprovider of netwerkplatform aanvullende metadatahosts of gereserveerde bereiken documenteert, voeg die dan ook toe.

## Validatie

Valideer de proxy vanaf dezelfde host, container of serviceaccount waarop OpenClaw draait:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

De publieke aanvraag zou moeten slagen. De loopback- en metadata-aanvragen zouden bij de proxy moeten mislukken.

Schakel daarna OpenClaw-proxyrouting in:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway run
```

of stel in:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

## Beperkingen

- De proxy verbetert de dekking voor proceslokale JavaScript HTTP- en WebSocket-clients, maar is geen netwerksandbox op OS-niveau.
- Raw `net`-, `tls`- en `http2`-sockets, native addons en childprocessen kunnen Node-proxyrouting op niveau omzeilen, tenzij ze proxyomgevingsvariabelen erven en respecteren.
- Lokale WebUI's van gebruikers en lokale modelservers moeten waar nodig worden opgenomen in allowlists in het operatorproxybeleid; OpenClaw biedt geen algemene lokale-netwerkbypass voor deze systemen.
- Gateway-controlplane-proxybypass is bewust beperkt tot `localhost` en letterlijke loopback-IP-URL's. Gebruik `ws://127.0.0.1:18789`, `ws://[::1]:18789` of `ws://localhost:18789` voor lokale directe Gateway-controlplane-verbindingen; andere hostnamen worden gerouteerd als gewoon hostnaamgebaseerd verkeer.
- OpenClaw inspecteert, test of certificeert uw proxybeleid niet.
- Behandel wijzigingen in proxybeleid als beveiligingsgevoelige operationele wijzigingen.
