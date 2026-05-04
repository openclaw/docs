---
read_when:
    - Je wilt gelaagde verdediging tegen SSRF- en DNS-rebindingaanvallen
    - Een externe doorstuurproxy configureren voor OpenClaw-runtimeverkeer
summary: OpenClaw-runtime-HTTP- en WebSocket-verkeer routeren via een door de operator beheerde filterproxy
title: Netwerkproxy
x-i18n:
    generated_at: "2026-05-04T11:26:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: eedbf3bac14800c34c7ca2e3b6879dac360a88d51b5b7449ddf41a4dd471648b
    source_path: security/network-proxy.md
    workflow: 16
---

# Netwerkproxy

OpenClaw kan runtime-HTTP- en WebSocket-verkeer routeren via een door de operator beheerde forward proxy. Dit is optionele defense-in-depth voor implementaties die centrale egress-controle, sterkere SSRF-bescherming en betere netwerkauditbaarheid willen.

OpenClaw levert, downloadt, start, configureert of certificeert geen proxy. U gebruikt de proxytechnologie die bij uw omgeving past, en OpenClaw routeert normale proceslokale HTTP- en WebSocket-clients erdoorheen.

## Waarom een proxy gebruiken?

Een proxy geeft operators één netwerkcontrolepunt voor uitgaand HTTP- en WebSocket-verkeer. Dat kan ook buiten SSRF-verharding nuttig zijn:

- Centraal beleid: onderhoud één egress-beleid in plaats van erop te vertrouwen dat elke HTTP-aanroeplocatie in de toepassing de netwerkregels correct toepast.
- Controles bij verbinden: evalueer de bestemming na DNS-resolutie en direct voordat de proxy de upstream-verbinding opent.
- Verdediging tegen DNS-rebinding: verklein het gat tussen een DNS-controle op toepassingsniveau en de daadwerkelijke uitgaande verbinding.
- Bredere JavaScript-dekking: routeer gewone `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch en vergelijkbare clients via hetzelfde pad.
- Auditbaarheid: log toegestane en geweigerde bestemmingen aan de egress-grens.
- Operationele controle: dwing bestemmingsregels, netwerksegmentatie, snelheidslimieten of uitgaande allowlists af zonder OpenClaw opnieuw te bouwen.

Proxyroutering is een procesniveau-guardrail voor normale HTTP- en WebSocket-egress. Het geeft operators een fail-closed pad om ondersteunde JavaScript-HTTP-clients via hun eigen filterende proxy te routeren, maar het is geen netwerk-sandbox op OS-niveau en laat OpenClaw het bestemmingsbeleid van de proxy niet certificeren.

## Hoe OpenClaw verkeer routeert

Wanneer `proxy.enabled=true` en een proxy-URL is geconfigureerd, routeren beschermde runtimeprocessen zoals `openclaw gateway run`, `openclaw node run` en `openclaw agent --local` normale HTTP- en WebSocket-egress via de geconfigureerde proxy:

```text
OpenClaw-proces
  fetch                  -> door operator beheerde filterende proxy -> openbaar internet
  node:http en https     -> door operator beheerde filterende proxy -> openbaar internet
  WebSocket-clients      -> door operator beheerde filterende proxy -> openbaar internet
```

Het publieke contract is het routeringsgedrag, niet de interne Node-hooks die worden gebruikt om het te implementeren. OpenClaw Gateway control-plane WebSocket-clients gebruiken een smal direct pad voor local loopback Gateway-RPC-verkeer wanneer de Gateway-URL `localhost` of een letterlijk loopback-IP gebruikt, zoals `127.0.0.1` of `[::1]`. Dat control-plane-pad moet loopback-Gateways kunnen bereiken, zelfs wanneer de operatorproxy loopback-bestemmingen blokkeert. Normale runtime-HTTP- en WebSocket-verzoeken gebruiken nog steeds de geconfigureerde proxy.

Intern gebruikt OpenClaw twee routeringshooks op procesniveau voor deze functie:

- Undici-dispatcherroutering dekt `fetch`, door undici ondersteunde clients en transports die hun eigen undici-dispatcher bieden.
- `global-agent`-routering dekt Node-core-aanroepers van `node:http` en `node:https`, waaronder veel bibliotheken die zijn gebouwd op `http.request`, `https.request`, `http.get` en `https.get`. Beheerde proxymodus dwingt die globale agent af zodat expliciete Node-HTTP-agents de operatorproxy niet per ongeluk omzeilen.

Sommige plugins beheren aangepaste transports die expliciete proxybedrading nodig hebben, zelfs wanneer routering op procesniveau bestaat. Het Bot API-transport van Telegram gebruikt bijvoorbeeld zijn eigen HTTP/1 undici-dispatcher en respecteert daarom de procesproxy-omgeving plus de beheerde `OPENCLAW_PROXY_URL`-fallback in dat eigenaarsspecifieke transportpad.

De proxy-URL zelf moet `http://` gebruiken. HTTPS-bestemmingen worden nog steeds via de proxy ondersteund met HTTP `CONNECT`; dit betekent alleen dat OpenClaw een gewone HTTP-forward-proxylistener verwacht, zoals `http://127.0.0.1:3128`.

Terwijl de proxy actief is, wist OpenClaw `no_proxy`, `NO_PROXY` en `GLOBAL_AGENT_NO_PROXY`. Die bypasslijsten zijn bestemmingsgebaseerd, dus als `localhost` of `127.0.0.1` daarin blijft staan, kunnen SSRF-doelen met hoog risico de filterende proxy overslaan.

Bij afsluiten herstelt OpenClaw de vorige proxy-omgeving en reset het de gecachete procesrouteringsstatus.

## Verwante proxytermen

- `proxy.enabled` / `proxy.proxyUrl`: uitgaande forward-proxyrouting voor OpenClaw-runtime-egress. Deze pagina documenteert die functie.
- `gateway.auth.mode: "trusted-proxy"`: inkomende identiteitsbewuste reverse-proxyauthenticatie voor Gateway-toegang. Zie [Vertrouwde-proxyauthenticatie](/nl/gateway/trusted-proxy-auth).
- `openclaw proxy`: lokale debugproxy en capture-inspector voor ontwikkeling en ondersteuning. Zie [openclaw proxy](/nl/cli/proxy).
- Kanaal- of providerspecifieke proxy-instellingen: eigenaarsspecifieke overrides voor een bepaald transport. Geef de voorkeur aan de beheerde netwerkproxy wanneer het doel centrale egress-controle over de runtime is.

## Configuratie

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

U kunt de URL ook via de omgeving opgeven, terwijl u `proxy.enabled=true` in de configuratie houdt:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` heeft voorrang op `OPENCLAW_PROXY_URL`.

Als `enabled=true` maar er geen geldige proxy-URL is geconfigureerd, falen beschermde opdrachten bij het opstarten in plaats van terug te vallen op directe netwerktoegang.

Voor beheerde gatewayservices die zijn gestart met `openclaw gateway start`, heeft het opslaan van de URL in configuratie de voorkeur:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

De omgevingsfallback is het meest geschikt voor foreground-runs. Als u deze met een geïnstalleerde service gebruikt, plaats `OPENCLAW_PROXY_URL` dan in de duurzame serviceomgeving, zoals `$OPENCLAW_STATE_DIR/.env` of `~/.openclaw/.env`, en installeer de service daarna opnieuw zodat launchd, systemd of Scheduled Tasks de gateway met die waarde start.

Voor `openclaw --container ...`-opdrachten geeft OpenClaw `OPENCLAW_PROXY_URL` door aan de containergerichte child-CLI wanneer deze is ingesteld. De URL moet bereikbaar zijn vanuit de container; `127.0.0.1` verwijst naar de container zelf, niet naar de host. OpenClaw weigert loopback-proxy-URL's voor containergerichte opdrachten, tenzij u die veiligheidscontrole expliciet overschrijft.

## Proxyvereisten

Het proxybeleid is de beveiligingsgrens. OpenClaw kan niet verifiëren dat de proxy de juiste doelen blokkeert.

Configureer de proxy om:

- Alleen te binden aan loopback of een privé vertrouwde interface.
- Toegang te beperken zodat alleen het OpenClaw-proces, de host, container of serviceaccount deze kan gebruiken.
- Bestemmingen zelf op te lossen en bestemmings-IP's na DNS-resolutie te blokkeren.
- Beleid toe te passen bij het verbinden voor zowel gewone HTTP-verzoeken als HTTPS `CONNECT`-tunnels.
- Bestemmingsgebaseerde bypasses te weigeren voor loopback-, privé-, link-local-, metadata-, multicast-, gereserveerde of documentatiebereiken.
- Hostname-allowlists te vermijden, tenzij u het DNS-resolutiepad volledig vertrouwt.
- Bestemming, beslissing, status en reden te loggen zonder request bodies, autorisatieheaders, cookies of andere geheimen te loggen.
- Proxybeleid onder versiebeheer te houden en wijzigingen te beoordelen als beveiligingsgevoelige configuratie.

## Aanbevolen geblokkeerde bestemmingen

Gebruik deze denylist als uitgangspunt voor elke forward proxy, firewall of egress-beleid.

De classifierlogica op OpenClaw-toepassingsniveau bevindt zich in `src/infra/net/ssrf.ts` en `src/shared/net/ip.ts`. De relevante pariteitshooks zijn `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` en de ingebedde IPv4-sentinelafhandeling voor NAT64, 6to4, Teredo, ISATAP en IPv4-mapped vormen. Die bestanden zijn nuttige referenties bij het onderhouden van een extern proxybeleid, maar OpenClaw exporteert of dwingt die regels niet automatisch af in uw proxy.

| Bereik of host                                                                        | Waarom blokkeren                                    |
| ------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4-loopback                                       |
| `::1/128`                                                                            | IPv6-loopback                                       |
| `0.0.0.0/8`, `::/128`                                                                | Ongespecificeerde en dit-netwerk-adressen           |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918-privénetwerken                              |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-local-adressen en gangbare cloudmetadatapaden  |
| `169.254.169.254`, `metadata.google.internal`                                        | Cloudmetadataservices                               |
| `100.64.0.0/10`                                                                      | Gedeelde adresruimte voor carrier-grade NAT         |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Benchmarkbereiken                                   |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Special-use- en documentatiebereiken                |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                           |
| `240.0.0.0/4`                                                                        | Gereserveerde IPv4                                  |
| `fc00::/7`, `fec0::/10`                                                              | Lokale/private IPv6-bereiken                        |
| `100::/64`, `2001:20::/28`                                                           | IPv6-discard- en ORCHIDv2-bereiken                  |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | NAT64-prefixen met ingebedde IPv4                   |
| `2002::/16`, `2001::/32`                                                             | 6to4 en Teredo met ingebedde IPv4                   |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-compatibele en IPv4-mapped IPv6                |

Als uw cloudprovider of netwerkplatform aanvullende metadatahosts of gereserveerde bereiken documenteert, voeg die dan ook toe.

## Validatie

Valideer de proxy vanaf dezelfde host, container of serviceaccount waarop OpenClaw draait:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Standaard controleert de opdracht, wanneer er geen aangepaste bestemmingen zijn opgegeven, dat `https://example.com/` slaagt en start deze een tijdelijke loopback-canary die de proxy niet mag bereiken. De standaard geweigerde controle slaagt wanneer de proxy een niet-2xx-weigeringsrespons retourneert of de canary blokkeert met een transportfout; deze faalt als een succesvolle respons de canary bereikt. Als er geen proxy is ingeschakeld en geconfigureerd, meldt validatie een configuratieprobleem; gebruik `--proxy-url` voor een eenmalige preflight voordat u de configuratie wijzigt. Gebruik `--allowed-url` en `--denied-url` om implementatiespecifieke verwachtingen te testen. Voeg `--apns-reachable` toe om ook te verifiëren dat directe APNs-HTTP/2-levering een CONNECT-tunnel via de proxy kan openen en een sandbox-APNs-respons kan ontvangen; de probe gebruikt een opzettelijk ongeldig provider-token, dus `403 InvalidProviderToken` wordt verwacht en telt als bereikbaar. Aangepaste geweigerde bestemmingen zijn fail-closed: elke HTTP-respons betekent dat de bestemming via de proxy bereikbaar was, en elke transportfout wordt als onbeslist gerapporteerd omdat OpenClaw niet kan bewijzen dat de proxy een bereikbare origin heeft geblokkeerd. Bij validatiefout sluit de opdracht af met code 1.

Gebruik `--json` voor automatisering. De JSON-uitvoer bevat het totale resultaat, de effectieve proxyconfiguratiebron, eventuele configuratiefouten en elke bestemmingscontrole. Referenties in proxy-URL's worden geredigeerd in tekst- en JSON-uitvoer:

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
    },
    {
      "kind": "apns",
      "url": "https://api.sandbox.push.apple.com",
      "ok": true,
      "status": 403
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

De openbare aanvraag zou moeten slagen. De loopback- en metadata-aanvragen zouden door de proxy moeten worden geblokkeerd. Voor `openclaw proxy validate` kan de ingebouwde loopback-canary een proxyweigering onderscheiden van een bereikbare oorsprong. Aangepaste `--denied-url`-controles hebben die canary niet, dus behandel zowel HTTP-responses als dubbelzinnige transportfouten als validatiefouten, tenzij je proxy een implementatiespecifiek weigeringssignaal blootstelt dat je afzonderlijk kunt verifiëren.

Schakel daarna OpenClaw-proxyroutering in:

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
- Ruwe `net`-, `tls`- en `http2`-sockets, native add-ons en onderliggende processen kunnen proxyroutering op Node-niveau omzeilen, tenzij ze proxy-omgevingsvariabelen erven en respecteren.
- IRC is een ruw TCP/TLS-kanaal buiten door de operator beheerde forward-proxyroutering. Stel in implementaties waarin alle uitgaande verbindingen via die forward proxy moeten lopen `channels.irc.enabled=false` in, tenzij directe IRC-uitgaande verbindingen expliciet zijn goedgekeurd.
- De lokale debugproxy is diagnostische tooling en de directe upstream-doorsturing voor proxyaanvragen en CONNECT-tunnels is standaard uitgeschakeld terwijl beheerde proxymodus actief is; schakel directe doorsturing alleen in voor goedgekeurde lokale diagnostiek.
- Lokale WebUI's van gebruikers en lokale modelservers moeten waar nodig op de allowlist in het operatorproxybeleid worden geplaatst; OpenClaw biedt daarvoor geen algemene omzeiling van het lokale netwerk.
- Proxy-omzeiling voor het Gateway-besturingsvlak is bewust beperkt tot `localhost` en letterlijke loopback-IP-URL's. Gebruik `ws://127.0.0.1:18789`, `ws://[::1]:18789` of `ws://localhost:18789` voor lokale directe verbindingen met het Gateway-besturingsvlak; andere hostnamen worden gerouteerd als gewoon hostnaamgebaseerd verkeer.
- OpenClaw inspecteert, test of certificeert je proxybeleid niet.
- Behandel wijzigingen in het proxybeleid als beveiligingsgevoelige operationele wijzigingen.
