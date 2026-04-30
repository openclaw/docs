---
read_when:
    - Je wilt gelaagde verdediging tegen SSRF- en DNS-rebindingaanvallen
    - Een externe forward proxy configureren voor OpenClaw-runtimeverkeer
summary: Hoe u HTTP- en WebSocket-verkeer van de OpenClaw-uitvoeringsomgeving via een door de operator beheerde filterproxy routeert
title: Netwerkproxy
x-i18n:
    generated_at: "2026-04-30T00:08:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4e879f787571410acdda55dcdbb5fd77aef1d24045af5c9208cba51330a70ca
    source_path: security/network-proxy.md
    workflow: 16
---

# Netwerkproxy

OpenClaw kan runtime-HTTP- en WebSocket-verkeer routeren via een door de operator beheerde forward proxy. Dit is optionele defense in depth voor implementaties die centrale egress-controle, sterkere SSRF-bescherming en betere netwerkauditbaarheid willen.

OpenClaw levert, downloadt, start, configureert of certificeert geen proxy. Je gebruikt de proxytechnologie die bij je omgeving past, en OpenClaw routeert normale proceslokale HTTP- en WebSocket-clients erdoorheen.

## Waarom een proxy gebruiken?

Een proxy geeft operators één netwerkcontrolepunt voor uitgaand HTTP- en WebSocket-verkeer. Dat kan ook buiten SSRF-verharding nuttig zijn:

- Centraal beleid: onderhoud één egress-beleid in plaats van erop te vertrouwen dat elke HTTP-aanroep in de applicatie de netwerkregels correct toepast.
- Controles bij verbinden: evalueer de bestemming na DNS-resolutie en direct voordat de proxy de upstreamverbinding opent.
- Verdediging tegen DNS-rebinding: verklein de kloof tussen een DNS-controle op applicatieniveau en de daadwerkelijke uitgaande verbinding.
- Bredere JavaScript-dekking: routeer gewone `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch en vergelijkbare clients via hetzelfde pad.
- Auditbaarheid: log toegestane en geweigerde bestemmingen aan de egress-grens.
- Operationele controle: dwing bestemmingsregels, netwerksegmentatie, snelheidslimieten of uitgaande allowlists af zonder OpenClaw opnieuw te bouwen.

Proxyroutering is een guardrail op procesniveau voor normale HTTP- en WebSocket-egress. Het geeft operators een fail-closed pad om ondersteunde JavaScript-HTTP-clients via hun eigen filterende proxy te routeren, maar het is geen netwerksandbox op OS-niveau en laat OpenClaw het bestemmingsbeleid van de proxy niet certificeren.

## Hoe OpenClaw verkeer routeert

Wanneer `proxy.enabled=true` en een proxy-URL is geconfigureerd, routeren beschermde runtimeprocessen zoals `openclaw gateway run`, `openclaw node run` en `openclaw agent --local` normale HTTP- en WebSocket-egress via de geconfigureerde proxy:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Het publieke contract is het routeringsgedrag, niet de interne Node-hooks die worden gebruikt om het te implementeren. OpenClaw Gateway-control-plane-WebSocket-clients gebruiken een smal direct pad voor local loopback Gateway-RPC-verkeer wanneer de Gateway-URL `localhost` gebruikt of een letterlijk loopback-IP zoals `127.0.0.1` of `[::1]`. Dat control-plane-pad moet loopback-Gateways kunnen bereiken, zelfs wanneer de operatorproxy loopback-bestemmingen blokkeert. Normale runtime-HTTP- en WebSocket-verzoeken gebruiken nog steeds de geconfigureerde proxy.

Intern gebruikt OpenClaw twee routeringshooks op procesniveau voor deze functie:

- Undici-dispatcherroutering dekt `fetch`, undici-gebaseerde clients en transporten die hun eigen undici-dispatcher leveren.
- `global-agent`-routering dekt Node core `node:http`- en `node:https`-aanroepers, inclusief veel bibliotheken die zijn gebouwd op `http.request`, `https.request`, `http.get` en `https.get`. Beheerde proxymodus dwingt die globale agent af zodat expliciete Node HTTP-agents de operatorproxy niet per ongeluk omzeilen.

Sommige plugins beheren aangepaste transporten die expliciete proxybedrading nodig hebben, zelfs wanneer routering op procesniveau bestaat. Telegrams Bot API-transport gebruikt bijvoorbeeld zijn eigen HTTP/1-undici-dispatcher en respecteert daarom procesproxy-env plus de beheerde `OPENCLAW_PROXY_URL`-fallback in dat owner-specifieke transportpad.

De proxy-URL zelf moet `http://` gebruiken. HTTPS-bestemmingen worden nog steeds ondersteund via de proxy met HTTP `CONNECT`; dit betekent alleen dat OpenClaw een gewone HTTP-forward-proxylistener verwacht, zoals `http://127.0.0.1:3128`.

Terwijl de proxy actief is, wist OpenClaw `no_proxy`, `NO_PROXY` en `GLOBAL_AGENT_NO_PROXY`. Die bypasslijsten zijn bestemmingsgebaseerd, dus als `localhost` of `127.0.0.1` daarin blijft staan, zouden risicovolle SSRF-doelen de filterende proxy kunnen overslaan.

Bij afsluiten herstelt OpenClaw de vorige proxyomgeving en reset het gecachte procesrouteringsstatus.

## Gerelateerde proxytermen

- `proxy.enabled` / `proxy.proxyUrl`: uitgaande forward-proxyrouting voor OpenClaw-runtime-egress. Deze pagina documenteert die functie.
- `gateway.auth.mode: "trusted-proxy"`: inkomende identity-aware reverse-proxy-authenticatie voor Gateway-toegang. Zie [Trusted proxy-authenticatie](/nl/gateway/trusted-proxy-auth).
- `openclaw proxy`: lokale debugproxy en capture-inspector voor ontwikkeling en ondersteuning. Zie [openclaw proxy](/nl/cli/proxy).
- Kanaal- of providerspecifieke proxyinstellingen: owner-specifieke overrides voor een bepaald transport. Geef de voorkeur aan de beheerde netwerkproxy wanneer centrale egress-controle over de runtime het doel is.

## Configuratie

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Je kunt de URL ook via de omgeving opgeven, terwijl je `proxy.enabled=true` in de configuratie houdt:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` heeft voorrang op `OPENCLAW_PROXY_URL`.

Als `enabled=true` maar er geen geldige proxy-URL is geconfigureerd, mislukken beschermde opdrachten bij het opstarten in plaats van terug te vallen op directe netwerktoegang.

Voor beheerde gateway-services die met `openclaw gateway start` worden gestart, kun je de URL het beste in de configuratie opslaan:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

De omgevingsfallback is het beste voor voorgrondruns. Als je die gebruikt met een geïnstalleerde service, zet `OPENCLAW_PROXY_URL` dan in de duurzame serviceomgeving, zoals `$OPENCLAW_STATE_DIR/.env` of `~/.openclaw/.env`, en installeer de service vervolgens opnieuw zodat launchd, systemd of Scheduled Tasks de gateway met die waarde start.

Voor `openclaw --container ...`-opdrachten geeft OpenClaw `OPENCLAW_PROXY_URL` door aan de containergerichte child CLI wanneer deze is ingesteld. De URL moet bereikbaar zijn vanuit de container; `127.0.0.1` verwijst naar de container zelf, niet naar de host. OpenClaw weigert loopback-proxy-URL's voor containergerichte opdrachten tenzij je die veiligheidscontrole expliciet overschrijft.

## Proxyvereisten

Het proxybeleid is de beveiligingsgrens. OpenClaw kan niet verifiëren dat de proxy de juiste doelen blokkeert.

Configureer de proxy om:

- Alleen te binden aan loopback of een vertrouwde private interface.
- Toegang te beperken zodat alleen het OpenClaw-proces, de host, container of serviceaccount deze kan gebruiken.
- Bestemmingen zelf te resolveren en bestemmings-IP's na DNS-resolutie te blokkeren.
- Beleid toe te passen bij het verbinden voor zowel gewone HTTP-verzoeken als HTTPS-`CONNECT`-tunnels.
- Bestemmingsgebaseerde bypasses te weigeren voor loopback-, private, link-local-, metadata-, multicast-, gereserveerde of documentatiebereiken.
- Hostname-allowlists te vermijden tenzij je het DNS-resolutiepad volledig vertrouwt.
- Bestemming, beslissing, status en reden te loggen zonder request bodies, autorisatieheaders, cookies of andere geheimen te loggen.
- Proxybeleid onder versiebeheer te houden en wijzigingen te beoordelen als beveiligingsgevoelige configuratie.

## Aanbevolen geblokkeerde bestemmingen

Gebruik deze denylist als startpunt voor elke forward proxy, firewall of egress-beleid.

De classifierlogica op OpenClaw-applicatieniveau staat in `src/infra/net/ssrf.ts` en `src/shared/net/ip.ts`. De relevante parity-hooks zijn `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` en de ingebedde IPv4-sentinelafhandeling voor NAT64, 6to4, Teredo, ISATAP en IPv4-mapped vormen. Die bestanden zijn nuttige referenties bij het onderhouden van extern proxybeleid, maar OpenClaw exporteert of handhaaft die regels niet automatisch in je proxy.

| Bereik of host                                                                        | Waarom blokkeren                                         |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4-loopback                                            |
| `::1/128`                                                                            | IPv6-loopback                                            |
| `0.0.0.0/8`, `::/128`                                                                | Niet-gespecificeerde en this-network-adressen            |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918-private netwerken                                |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-local-adressen en gangbare cloudmetadatapaden      |
| `169.254.169.254`, `metadata.google.internal`                                        | Cloudmetadataservices                                    |
| `100.64.0.0/10`                                                                      | Gedeelde adresruimte voor carrier-grade NAT              |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Benchmarkbereiken                                        |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Special-use- en documentatiebereiken                     |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                                |
| `240.0.0.0/4`                                                                        | Gereserveerde IPv4                                       |
| `fc00::/7`, `fec0::/10`                                                              | IPv6-lokale/private bereiken                            |
| `100::/64`, `2001:20::/28`                                                           | IPv6-discard- en ORCHIDv2-bereiken                      |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | NAT64-prefixen met ingebedde IPv4                        |
| `2002::/16`, `2001::/32`                                                             | 6to4 en Teredo met ingebedde IPv4                        |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-compatible en IPv4-mapped IPv6                      |

Als je cloudprovider of netwerkplatform aanvullende metadatahosts of gereserveerde bereiken documenteert, voeg die dan ook toe.

## Validatie

Valideer de proxy vanaf dezelfde host, container of serviceaccount waarop OpenClaw draait:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

Het publieke verzoek zou moeten slagen. De loopback- en metadataverzoeken zouden bij de proxy moeten mislukken.

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

- De proxy verbetert de dekking voor proceslokale JavaScript-HTTP- en WebSocket-clients, maar is geen netwerksandbox op OS-niveau.
- Raw `net`-, `tls`- en `http2`-sockets, native addons en child processes kunnen Node-proxyrouting op niveau omzeilen tenzij ze proxyomgevingsvariabelen overnemen en respecteren.
- Lokale WebUI's van gebruikers en lokale modelservers moeten waar nodig worden geallowlist in het operatorproxybeleid; OpenClaw stelt geen algemene local-network-bypass voor ze beschikbaar.
- De proxybypass voor het Gateway-control-plane is opzettelijk beperkt tot `localhost` en letterlijke loopback-IP-URL's. Gebruik `ws://127.0.0.1:18789`, `ws://[::1]:18789` of `ws://localhost:18789` voor lokale directe Gateway-control-plane-verbindingen; andere hostnamen worden gerouteerd zoals gewoon hostname-gebaseerd verkeer.
- OpenClaw inspecteert, test of certificeert je proxybeleid niet.
- Behandel wijzigingen in proxybeleid als beveiligingsgevoelige operationele wijzigingen.
