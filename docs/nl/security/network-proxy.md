---
read_when:
    - Je wilt gelaagde verdediging tegen SSRF- en DNS-rebindingaanvallen
    - Een externe doorstuurproxy configureren voor OpenClaw-runtimeverkeer
summary: OpenClaw-runtime-HTTP- en WebSocket-verkeer routeren via een door de operator beheerde filterproxy
title: Netwerkproxy
x-i18n:
    generated_at: "2026-05-01T11:23:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9207d349e4410e38631ae7665be19b536e4a4128a4e80dd095e802804dfd66a3
    source_path: security/network-proxy.md
    workflow: 16
---

# Netwerkproxy

OpenClaw kan HTTP- en WebSocket-verkeer tijdens runtime routeren via een door de operator beheerde forward proxy. Dit is optionele defense-in-depth voor implementaties die centrale egress-controle, sterkere SSRF-bescherming en betere netwerkauditbaarheid willen.

OpenClaw levert, downloadt, start, configureert of certificeert geen proxy. Je gebruikt de proxytechnologie die bij je omgeving past, en OpenClaw routeert normale proceslokale HTTP- en WebSocket-clients erdoorheen.

## Waarom een proxy gebruiken?

Een proxy geeft operators één netwerkcontrolepunt voor uitgaand HTTP- en WebSocket-verkeer. Dat kan ook buiten SSRF-verharding nuttig zijn:

- Centraal beleid: onderhoud één egress-beleid in plaats van erop te vertrouwen dat elke HTTP-aanroepplek in de applicatie de netwerkregels goed toepast.
- Controles tijdens verbinden: evalueer de bestemming na DNS-resolutie en direct voordat de proxy de upstreamverbinding opent.
- Verdediging tegen DNS-rebinding: verklein het gat tussen een DNS-controle op applicatieniveau en de daadwerkelijke uitgaande verbinding.
- Bredere JavaScript-dekking: routeer gewone `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch en vergelijkbare clients via hetzelfde pad.
- Auditbaarheid: log toegestane en geweigerde bestemmingen aan de egress-grens.
- Operationele controle: dwing bestemmingsregels, netwerksegmentatie, snelheidslimieten of uitgaande allowlists af zonder OpenClaw opnieuw te bouwen.

Proxyrouting is een procesniveau-guardrail voor normale HTTP- en WebSocket-egress. Het geeft operators een fail-closed pad om ondersteunde JavaScript-HTTP-clients via hun eigen filterende proxy te routeren, maar het is geen netwerksandbox op OS-niveau en zorgt er niet voor dat OpenClaw het bestemmingsbeleid van de proxy certificeert.

## Hoe OpenClaw verkeer routeert

Wanneer `proxy.enabled=true` en er een proxy-URL is geconfigureerd, routeren beschermde runtimeprocessen zoals `openclaw gateway run`, `openclaw node run` en `openclaw agent --local` normale HTTP- en WebSocket-egress via de geconfigureerde proxy:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Het publieke contract is het routeringsgedrag, niet de interne Node-hooks die worden gebruikt om het te implementeren. OpenClaw Gateway-control-plane WebSocket-clients gebruiken een smal direct pad voor local loopback Gateway-RPC-verkeer wanneer de Gateway-URL `localhost` gebruikt of een letterlijk loopback-IP zoals `127.0.0.1` of `[::1]`. Dat control-plane-pad moet loopback-Gateways kunnen bereiken, zelfs wanneer de operatorproxy loopbackbestemmingen blokkeert. Normale runtime-HTTP- en WebSocket-verzoeken gebruiken nog steeds de geconfigureerde proxy.

Intern gebruikt OpenClaw twee procesniveau-routeringshooks voor deze functie:

- Undici-dispatcherrouting dekt `fetch`, clients op basis van undici en transports die hun eigen undici-dispatcher leveren.
- `global-agent`-routing dekt Node-core-aanroepers van `node:http` en `node:https`, waaronder veel bibliotheken die bovenop `http.request`, `https.request`, `http.get` en `https.get` zijn gebouwd. Beheerde proxymodus forceert die globale agent, zodat expliciete Node-HTTP-agents de operatorproxy niet per ongeluk omzeilen.

Sommige plugins beheren aangepaste transports die expliciete proxybedrading nodig hebben, zelfs wanneer procesniveau-routing bestaat. Telegram's Bot API-transport gebruikt bijvoorbeeld zijn eigen HTTP/1-undici-dispatcher en respecteert daarom procesproxy-env plus de beheerde `OPENCLAW_PROXY_URL`-fallback in dat eigenaarspecifieke transportpad.

De proxy-URL zelf moet `http://` gebruiken. HTTPS-bestemmingen worden nog steeds ondersteund via de proxy met HTTP `CONNECT`; dit betekent alleen dat OpenClaw een gewone HTTP-forward-proxylistener verwacht, zoals `http://127.0.0.1:3128`.

Terwijl de proxy actief is, wist OpenClaw `no_proxy`, `NO_PROXY` en `GLOBAL_AGENT_NO_PROXY`. Die bypasslijsten zijn bestemmingsgebaseerd, dus als `localhost` of `127.0.0.1` daarin blijft staan, kunnen SSRF-doelen met hoog risico de filterende proxy overslaan.

Bij afsluiten herstelt OpenClaw de eerdere proxyomgeving en reset het de gecachte procesrouteringsstatus.

## Gerelateerde proxytermen

- `proxy.enabled` / `proxy.proxyUrl`: uitgaande forward-proxyrouting voor OpenClaw-runtime-egress. Deze pagina documenteert die functie.
- `gateway.auth.mode: "trusted-proxy"`: inkomende identity-aware reverse-proxy-authenticatie voor Gateway-toegang. Zie [Trusted proxy-authenticatie](/nl/gateway/trusted-proxy-auth).
- `openclaw proxy`: lokale debugproxy en capture-inspector voor ontwikkeling en ondersteuning. Zie [openclaw proxy](/nl/cli/proxy).
- Kanaal- of providerspecifieke proxyinstellingen: eigenaarspecifieke overrides voor een bepaald transport. Geef de voorkeur aan de beheerde netwerkproxy wanneer het doel centrale egress-controle over de runtime is.

## Configuratie

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Je kunt de URL ook via de omgeving opgeven, terwijl `proxy.enabled=true` in de configuratie blijft staan:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` heeft voorrang op `OPENCLAW_PROXY_URL`.

Als `enabled=true` maar er geen geldige proxy-URL is geconfigureerd, falen beschermde opdrachten bij het opstarten in plaats van terug te vallen op directe netwerktoegang.

Voor beheerde Gateway-services die met `openclaw gateway start` worden gestart, sla je de URL bij voorkeur op in de configuratie:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

De omgevingsfallback is het beste voor foreground-runs. Als je die gebruikt met een geïnstalleerde service, zet `OPENCLAW_PROXY_URL` dan in de duurzame omgeving van de service, zoals `$OPENCLAW_STATE_DIR/.env` of `~/.openclaw/.env`, en installeer de service daarna opnieuw zodat launchd, systemd of Scheduled Tasks de gateway met die waarde start.

Voor `openclaw --container ...`-opdrachten stuurt OpenClaw `OPENCLAW_PROXY_URL` door naar de containergerichte child-CLI wanneer die is ingesteld. De URL moet bereikbaar zijn vanuit de container; `127.0.0.1` verwijst naar de container zelf, niet naar de host. OpenClaw weigert loopback-proxy-URL's voor containergerichte opdrachten, tenzij je die veiligheidscontrole expliciet overschrijft.

## Proxyvereisten

Het proxybeleid is de beveiligingsgrens. OpenClaw kan niet verifiëren dat de proxy de juiste doelen blokkeert.

Configureer de proxy om:

- Alleen te binden aan loopback of een privé vertrouwde interface.
- Toegang te beperken zodat alleen het OpenClaw-proces, de host, container of serviceaccount hem kan gebruiken.
- Bestemmingen zelf te resolven en bestemmings-IP's na DNS-resolutie te blokkeren.
- Beleid toe te passen tijdens het verbinden voor zowel gewone HTTP-verzoeken als HTTPS-`CONNECT`-tunnels.
- Bestemmingsgebaseerde bypasses te weigeren voor loopback-, private, link-local-, metadata-, multicast-, gereserveerde of documentatiebereiken.
- Hostname-allowlists te vermijden, tenzij je het DNS-resolutiepad volledig vertrouwt.
- Bestemming, beslissing, status en reden te loggen zonder request bodies, authorization-headers, cookies of andere geheimen te loggen.
- Proxybeleid onder versiebeheer te houden en wijzigingen te beoordelen als beveiligingsgevoelige configuratie.

## Aanbevolen geblokkeerde bestemmingen

Gebruik deze denylist als startpunt voor elke forward proxy, firewall of egress-beleid.

OpenClaw-classificatielogica op applicatieniveau staat in `src/infra/net/ssrf.ts` en `src/shared/net/ip.ts`. De relevante pariteitshooks zijn `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` en de ingebedde IPv4-sentinelafhandeling voor NAT64, 6to4, Teredo, ISATAP en IPv4-mapped vormen. Die bestanden zijn nuttige referenties bij het onderhouden van een extern proxybeleid, maar OpenClaw exporteert of handhaaft die regels niet automatisch in je proxy.

| Bereik of host                                                                        | Waarom blokkeren                                    |
| ------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                   | IPv4-loopback                                       |
| `::1/128`                                                                             | IPv6-loopback                                       |
| `0.0.0.0/8`, `::/128`                                                                 | Ongespecificeerde en this-network-adressen          |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                       | RFC1918-private netwerken                           |
| `169.254.0.0/16`, `fe80::/10`                                                         | Link-local-adressen en veelvoorkomende cloudmetadatapaden |
| `169.254.169.254`, `metadata.google.internal`                                         | Cloudmetadataservices                               |
| `100.64.0.0/10`                                                                       | Gedeelde adresruimte voor carrier-grade NAT         |
| `198.18.0.0/15`, `2001:2::/48`                                                        | Benchmarkbereiken                                   |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32`  | Bereiken voor speciaal gebruik en documentatie      |
| `224.0.0.0/4`, `ff00::/8`                                                             | Multicast                                           |
| `240.0.0.0/4`                                                                         | Gereserveerd IPv4                                   |
| `fc00::/7`, `fec0::/10`                                                               | IPv6-lokale/private bereiken                        |
| `100::/64`, `2001:20::/28`                                                            | IPv6-discard- en ORCHIDv2-bereiken                  |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                      | NAT64-prefixen met ingebedde IPv4                   |
| `2002::/16`, `2001::/32`                                                              | 6to4 en Teredo met ingebedde IPv4                   |
| `::/96`, `::ffff:0:0/96`                                                              | IPv4-compatibele en IPv4-mapped IPv6                |

Als je cloudprovider of netwerkplatform aanvullende metadatahosts of gereserveerde bereiken documenteert, voeg die dan ook toe.

## Validatie

Valideer de proxy vanaf dezelfde host, container of serviceaccount waarop OpenClaw draait:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Standaard, wanneer er geen aangepaste bestemmingen zijn opgegeven, controleert de opdracht dat `https://example.com/` slaagt en start hij een tijdelijke loopback-canary die de proxy niet mag bereiken. De standaard geweigerde controle slaagt wanneer de proxy een niet-2xx-weigeringsrespons teruggeeft of de canary blokkeert met een transportfout; hij faalt als een succesvolle respons de canary bereikt. Als er geen proxy is ingeschakeld en geconfigureerd, rapporteert validatie een configuratieprobleem; gebruik `--proxy-url` voor een eenmalige preflight voordat je de configuratie wijzigt. Gebruik `--allowed-url` en `--denied-url` om implementatiespecifieke verwachtingen te testen. Aangepaste geweigerde bestemmingen zijn fail-closed: elke HTTP-respons betekent dat de bestemming via de proxy bereikbaar was, en elke transportfout wordt als niet-sluitend gerapporteerd omdat OpenClaw niet kan bewijzen dat de proxy een bereikbare origin heeft geblokkeerd. Bij validatiefout sluit de opdracht af met code 1.

Gebruik `--json` voor automatisering. De JSON-uitvoer bevat het algemene resultaat, de effectieve proxyconfiguratiebron, eventuele configuratiefouten en elke bestemmingscontrole. Referenties in proxy-URL's worden geredigeerd in tekst- en JSON-uitvoer:

```json
{
  "ok": true,
  "config": {
    "enabled": true,
    "proxyUrl": "http://127.0.0.1:3128/",
    "source": "override",
    "errors": []
  },
  "checks": [
    {
      "kind": "allowed",
      "url": "https://example.com/",
      "ok": true,
      "status": 200
    }
  ]
}
```

Je kunt ook handmatig valideren met `curl`:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

Het openbare verzoek zou moeten slagen. De loopback- en metadataverzoeken zouden door de proxy moeten worden geblokkeerd. Voor `openclaw proxy validate` kan de ingebouwde loopback-canary een proxyweigering onderscheiden van een bereikbare oorsprong. Aangepaste `--denied-url`-controles hebben die canary niet, dus behandel zowel HTTP-responses als dubbelzinnige transportfouten als validatiefouten, tenzij je proxy een implementatiespecifiek weigeringssignaal blootstelt dat je afzonderlijk kunt verifiëren.

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

## Limieten

- De proxy verbetert de dekking voor proceslokale JavaScript-HTTP- en WebSocket-clients, maar is geen netwerksandbox op OS-niveau.
- Ruwe `net`-, `tls`- en `http2`-sockets, native add-ons en childprocessen kunnen Node-proxyrouting omzeilen, tenzij ze proxy-omgevingsvariabelen erven en respecteren.
- Lokale WebUI's van gebruikers en lokale modelservers moeten waar nodig op de allowlist in het proxybeleid van de operator worden gezet; OpenClaw biedt hiervoor geen algemene bypass voor het lokale netwerk.
- De proxybypass voor het Gateway-control plane is bewust beperkt tot `localhost` en letterlijke loopback-IP-URL's. Gebruik `ws://127.0.0.1:18789`, `ws://[::1]:18789` of `ws://localhost:18789` voor lokale directe Gateway-control-plane-verbindingen; andere hostnamen worden gerouteerd als gewoon hostnaamgebaseerd verkeer.
- OpenClaw inspecteert, test of certificeert je proxybeleid niet.
- Behandel wijzigingen in proxybeleid als beveiligingsgevoelige operationele wijzigingen.
