---
read_when:
    - Je wilt gelaagde verdediging tegen SSRF- en DNS-rebinding-aanvallen
    - Een externe forward proxy configureren voor runtimeverkeer van OpenClaw
summary: OpenClaw-runtime-HTTP- en WebSocket-verkeer via een door de operator beheerde filterproxy routeren
title: Netwerkproxy
x-i18n:
    generated_at: "2026-05-05T01:50:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7ab345d172d63e388ff1221535efd19934dcbf3173f95bc69131f9ad672e0df
    source_path: security/network-proxy.md
    workflow: 16
---

# Netwerkproxy

OpenClaw kan runtime-HTTP- en WebSocket-verkeer routeren via een door de operator beheerde forwardproxy. Dit is optionele gelaagde beveiliging voor implementaties die centraal egressbeheer, sterkere SSRF-bescherming en betere netwerkauditbaarheid willen.

OpenClaw levert, downloadt, start, configureert of certificeert geen proxy. Jij draait de proxytechnologie die bij je omgeving past, en OpenClaw routeert normale proceslokale HTTP- en WebSocket-clients erdoorheen.

## Waarom een proxy gebruiken?

Een proxy geeft operators één netwerkcontrolepunt voor uitgaand HTTP- en WebSocket-verkeer. Dat kan ook buiten SSRF-hardening nuttig zijn:

- Centraal beleid: onderhoud één egressbeleid in plaats van erop te vertrouwen dat elke HTTP-aanroepplek in de applicatie de netwerkregels goed toepast.
- Controles bij verbinden: evalueer de bestemming na DNS-resolutie en direct voordat de proxy de upstreamverbinding opent.
- Verdediging tegen DNS-rebinding: verklein de kloof tussen een DNS-controle op applicatieniveau en de daadwerkelijke uitgaande verbinding.
- Bredere JavaScript-dekking: routeer gewone `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch en vergelijkbare clients via hetzelfde pad.
- Auditbaarheid: log toegestane en geweigerde bestemmingen bij de egressgrens.
- Operationele controle: dwing bestemmingsregels, netwerksegmentatie, snelheidslimieten of uitgaande allowlists af zonder OpenClaw opnieuw te bouwen.

Proxyroutering is een guardrail op procesniveau voor normale HTTP- en WebSocket-egress. Het geeft operators een fail-closed pad om ondersteunde JavaScript-HTTP-clients via hun eigen filterproxy te routeren, maar het is geen netwerksandbox op OS-niveau en laat OpenClaw het bestemmingsbeleid van de proxy niet certificeren.

## Hoe OpenClaw verkeer routeert

Wanneer `proxy.enabled=true` en een proxy-URL is geconfigureerd, routeren beschermde runtimeprocessen zoals `openclaw gateway run`, `openclaw node run` en `openclaw agent --local` normale HTTP- en WebSocket-egress via de geconfigureerde proxy:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Het publieke contract is het routeringsgedrag, niet de interne Node-hooks die worden gebruikt om het te implementeren. OpenClaw Gateway-controlplane-WebSocket-clients gebruiken een smal direct pad voor local loopback Gateway-RPC-verkeer wanneer de Gateway-URL `localhost` gebruikt of een letterlijk loopback-IP zoals `127.0.0.1` of `[::1]`. Dat controlplane-pad moet loopback-Gateways kunnen bereiken, zelfs wanneer de operatorproxy loopbackbestemmingen blokkeert. Normale runtime-HTTP- en WebSocket-verzoeken gebruiken nog steeds de geconfigureerde proxy.

Intern gebruikt OpenClaw twee routeringshooks op procesniveau voor deze functie:

- Undici-dispatcherroutering dekt `fetch`, clients die op undici zijn gebaseerd en transports die hun eigen undici-dispatcher bieden.
- `global-agent`-routering dekt Node core-aanroepers van `node:http` en `node:https`, inclusief veel bibliotheken die bovenop `http.request`, `https.request`, `http.get` en `https.get` zijn gebouwd. Beheerde proxymodus forceert die globale agent zodat expliciete Node HTTP-agents de operatorproxy niet per ongeluk omzeilen.

Sommige plugins bezitten aangepaste transports die expliciete proxybedrading nodig hebben, zelfs wanneer routering op procesniveau bestaat. De Bot API-transportlaag van Telegram gebruikt bijvoorbeeld zijn eigen HTTP/1-undici-dispatcher en respecteert daarom procesproxy-env plus de beheerde `OPENCLAW_PROXY_URL`-fallback in dat eigenaarspecifieke transportpad.

De proxy-URL zelf moet `http://` gebruiken. HTTPS-bestemmingen worden nog steeds via de proxy ondersteund met HTTP `CONNECT`; dit betekent alleen dat OpenClaw een gewone HTTP-forwardproxylistener verwacht, zoals `http://127.0.0.1:3128`.

Terwijl de proxy actief is, wist OpenClaw `no_proxy`, `NO_PROXY` en `GLOBAL_AGENT_NO_PROXY`. Die bypasslijsten zijn bestemmingsgebaseerd, dus als `localhost` of `127.0.0.1` daarin blijft staan, kunnen risicovolle SSRF-doelen de filterproxy overslaan.

Bij afsluiten herstelt OpenClaw de vorige proxyomgeving en reset het gecachte procesrouteringsstate.

## Gerelateerde proxytermen

- `proxy.enabled` / `proxy.proxyUrl`: uitgaande forwardproxyroutering voor OpenClaw-runtime-egress. Deze pagina documenteert die functie.
- `gateway.auth.mode: "trusted-proxy"`: inkomende identiteitsbewuste reverseproxy-authenticatie voor Gateway-toegang. Zie [Authenticatie via vertrouwde proxy](/nl/gateway/trusted-proxy-auth).
- `openclaw proxy`: lokale debugproxy en capture-inspector voor ontwikkeling en ondersteuning. Zie [openclaw proxy](/nl/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: opt-in voor `web_fetch` om een door de operator beheerde HTTP(S)-env-proxy DNS te laten oplossen, terwijl standaard strikte DNS-pinning en hostnaambelied behouden blijven. Zie [Web fetch](/nl/tools/web-fetch#trusted-env-proxy).
- Kanaal- of providerspecifieke proxyinstellingen: eigenaarspecifieke overrides voor een bepaalde transportlaag. Geef de voorkeur aan de beheerde netwerkproxy wanneer het doel centraal egressbeheer over de runtime is.

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

Als `enabled=true` maar er geen geldige proxy-URL is geconfigureerd, mislukken beschermde opdrachten bij het opstarten in plaats van terug te vallen op directe netwerktoegang.

Voor beheerde gatewayservices die met `openclaw gateway start` worden gestart, verdient het de voorkeur de URL in de configuratie op te slaan:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

De omgevingsfallback is het meest geschikt voor foreground-runs. Als je deze met een geïnstalleerde service gebruikt, zet `OPENCLAW_PROXY_URL` dan in de duurzame serviceomgeving, zoals `$OPENCLAW_STATE_DIR/.env` of `~/.openclaw/.env`, en installeer de service daarna opnieuw zodat launchd, systemd of Scheduled Tasks de gateway met die waarde start.

Voor `openclaw --container ...`-opdrachten stuurt OpenClaw `OPENCLAW_PROXY_URL` door naar de containergerichte child-CLI wanneer deze is ingesteld. De URL moet vanuit de container bereikbaar zijn; `127.0.0.1` verwijst naar de container zelf, niet naar de host. OpenClaw weigert loopbackproxy-URL's voor containergerichte opdrachten, tenzij je die veiligheidscontrole expliciet overschrijft.

## Proxyvereisten

Het proxybeleid is de beveiligingsgrens. OpenClaw kan niet verifiëren dat de proxy de juiste doelen blokkeert.

Configureer de proxy om:

- Alleen aan loopback of een privé vertrouwde interface te binden.
- Toegang te beperken zodat alleen het OpenClaw-proces, de host, container of serviceaccount deze kan gebruiken.
- Bestemmingen zelf op te lossen en bestemmings-IP's na DNS-resolutie te blokkeren.
- Beleid toe te passen bij het verbinden voor zowel gewone HTTP-verzoeken als HTTPS `CONNECT`-tunnels.
- Bestemmingsgebaseerde bypasses te weigeren voor loopback, privé, link-local, metadata, multicast, gereserveerde of documentatiebereiken.
- Hostnaam-allowlists te vermijden tenzij je het DNS-resolutiepad volledig vertrouwt.
- Bestemming, beslissing, status en reden te loggen zonder requestbodies, autorisatieheaders, cookies of andere geheimen te loggen.
- Proxybeleid onder versiebeheer te houden en wijzigingen te reviewen zoals beveiligingsgevoelige configuratie.

## Aanbevolen geblokkeerde bestemmingen

Gebruik deze denylist als startpunt voor elke forwardproxy, firewall of elk egressbeleid.

OpenClaw-logica voor classificatie op applicatieniveau staat in `src/infra/net/ssrf.ts` en `src/shared/net/ip.ts`. De relevante parity-hooks zijn `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` en de ingebedde IPv4-sentinelafhandeling voor NAT64, 6to4, Teredo, ISATAP en IPv4-mapped vormen. Die bestanden zijn nuttige referenties bij het onderhouden van extern proxybeleid, maar OpenClaw exporteert of handhaaft die regels niet automatisch in je proxy.

| Bereik of host                                                                        | Waarom blokkeren                                          |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4-loopback                                             |
| `::1/128`                                                                            | IPv6-loopback                                             |
| `0.0.0.0/8`, `::/128`                                                                | Ongespecificeerde en this-network-adressen                |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Privénetwerken volgens RFC1918                            |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-local-adressen en gangbare cloudmetadatapaden        |
| `169.254.169.254`, `metadata.google.internal`                                        | Cloudmetadataservices                                     |
| `100.64.0.0/10`                                                                      | Gedeelde adresruimte voor carrier-grade NAT               |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Benchmarkbereiken                                         |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Special-use- en documentatiebereiken                      |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                                 |
| `240.0.0.0/4`                                                                        | Gereserveerde IPv4                                        |
| `fc00::/7`, `fec0::/10`                                                              | IPv6-lokale/privébereiken                                 |
| `100::/64`, `2001:20::/28`                                                           | IPv6-discard- en ORCHIDv2-bereiken                        |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | NAT64-prefixen met ingebedde IPv4                         |
| `2002::/16`, `2001::/32`                                                             | 6to4 en Teredo met ingebedde IPv4                         |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-compatibele en IPv4-mapped IPv6                      |

Als je cloudprovider of netwerkplatform aanvullende metadatahosts of gereserveerde bereiken documenteert, voeg die dan ook toe.

## Validatie

Valideer de proxy vanaf dezelfde host, container of serviceaccount waarop OpenClaw draait:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Standaard, wanneer er geen aangepaste bestemmingen zijn opgegeven, controleert de opdracht of `https://example.com/` slaagt en start deze een tijdelijke loopback-canary die de proxy niet mag bereiken. De standaard geweigerde controle slaagt wanneer de proxy een niet-2xx-weigeringsrespons retourneert of de canary met een transportfout blokkeert; deze faalt als een succesvolle respons de canary bereikt. Als er geen proxy is ingeschakeld en geconfigureerd, meldt validatie een configuratieprobleem; gebruik `--proxy-url` voor een eenmalige preflight voordat je de configuratie wijzigt. Gebruik `--allowed-url` en `--denied-url` om implementatiespecifieke verwachtingen te testen. Voeg `--apns-reachable` toe om ook te verifiëren dat directe APNs-HTTP/2-bezorging een CONNECT-tunnel via de proxy kan openen en een sandbox-APNs-respons kan ontvangen; de probe gebruikt opzettelijk een ongeldig providertoken, dus `403 InvalidProviderToken` wordt verwacht en telt als bereikbaar. Aangepaste geweigerde bestemmingen zijn fail-closed: elke HTTP-respons betekent dat de bestemming via de proxy bereikbaar was, en elke transportfout wordt als onbeslist gerapporteerd omdat OpenClaw niet kan bewijzen dat de proxy een bereikbare origin heeft geblokkeerd. Bij validatiefout sluit de opdracht af met code 1.

Gebruik `--json` voor automatisering. De JSON-uitvoer bevat het algehele resultaat, de effectieve bron van de proxyconfiguratie, eventuele configuratiefouten en elke bestemmingscontrole. Inloggegevens voor proxy-URL's worden geredigeerd in tekst- en JSON-uitvoer:

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

Het openbare verzoek zou moeten slagen. De loopback- en metadataverzoeken zouden door de proxy moeten worden geblokkeerd. Voor `openclaw proxy validate` kan de ingebouwde loopback-canary een proxyweigering onderscheiden van een bereikbare origin. Aangepaste `--denied-url`-controles hebben die canary niet, dus behandel zowel HTTP-antwoorden als dubbelzinnige transportfouten als validatiefouten, tenzij je proxy een implementatiespecifiek weigeringssignaal blootlegt dat je afzonderlijk kunt verifiëren.

Schakel daarna OpenClaw-proxyrouting in:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway run
```

of stel het volgende in:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

## Beperkingen

- De proxy verbetert de dekking voor proceslokale JavaScript-HTTP- en WebSocket-clients, maar is geen netwerksandbox op OS-niveau.
- Ruwe `net`-, `tls`- en `http2`-sockets, native add-ons en childprocessen kunnen proxyrouting op Node-niveau omzeilen, tenzij ze proxy-omgevingsvariabelen erven en respecteren.
- IRC is een ruw TCP/TLS-kanaal buiten door de operator beheerde routering via een forward proxy. Stel in implementaties waarbij al het uitgaande verkeer via die forward proxy moet verlopen `channels.irc.enabled=false` in, tenzij directe uitgaande IRC expliciet is goedgekeurd.
- De lokale debugproxy is diagnostische tooling en het rechtstreeks doorsturen naar upstreams voor proxyverzoeken en CONNECT-tunnels is standaard uitgeschakeld zolang de beheerde proxymodus actief is; schakel rechtstreeks doorsturen alleen in voor goedgekeurde lokale diagnostiek.
- Lokale WebUI's van gebruikers en lokale modelservers moeten waar nodig op de allowlist in het proxybeleid van de operator worden gezet; OpenClaw stelt hiervoor geen algemene bypass voor het lokale netwerk beschikbaar.
- De proxy-bypass voor het Gateway-besturingsvlak is bewust beperkt tot `localhost` en letterlijke loopback-IP-URL's. Gebruik `ws://127.0.0.1:18789`, `ws://[::1]:18789` of `ws://localhost:18789` voor lokale rechtstreekse Gateway-verbindingen op het besturingsvlak; andere hostnamen worden gerouteerd als gewoon hostnaamgebaseerd verkeer.
- OpenClaw inspecteert, test of certificeert je proxybeleid niet.
- Behandel wijzigingen in proxybeleid als beveiligingsgevoelige operationele wijzigingen.
