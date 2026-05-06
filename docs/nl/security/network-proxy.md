---
read_when:
    - Je wilt gelaagde verdediging tegen SSRF- en DNS-rebindingaanvallen
    - Een externe doorstuurproxy configureren voor OpenClaw-runtimeverkeer
summary: HTTP- en WebSocket-verkeer van de OpenClaw-runtime routeren via een door de operator beheerde filterproxy
title: Netwerkproxy
x-i18n:
    generated_at: "2026-05-06T09:32:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: d733c690b5f86ef62fe7a35d38fbfcd07910970bca12ca6f74fdb26c8ec4557b
    source_path: security/network-proxy.md
    workflow: 16
---

# Netwerkproxy

OpenClaw kan runtime-HTTP- en WebSocket-verkeer routeren via een door de operator beheerde forwardproxy. Dit is optionele verdediging in de diepte voor implementaties die centrale egresscontrole, sterkere SSRF-bescherming en betere netwerkauditbaarheid willen.

OpenClaw levert, downloadt, start, configureert of certificeert geen proxy. U gebruikt de proxytechnologie die bij uw omgeving past, en OpenClaw routeert normale proceslokale HTTP- en WebSocket-clients erdoorheen.

## Waarom een proxy gebruiken?

Een proxy geeft operators één netwerkcontrolepunt voor uitgaand HTTP- en WebSocket-verkeer. Dat kan ook buiten SSRF-verharding nuttig zijn:

- Centraal beleid: onderhoud één egressbeleid in plaats van erop te vertrouwen dat elke HTTP-aanroepplaats in de applicatie de netwerkregels correct toepast.
- Controles bij verbinden: evalueer de bestemming na DNS-resolutie en direct voordat de proxy de upstreamverbinding opent.
- Verdediging tegen DNS-rebinding: verklein de kloof tussen een DNS-controle op applicatieniveau en de daadwerkelijke uitgaande verbinding.
- Bredere JavaScript-dekking: routeer gewone `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch en vergelijkbare clients via hetzelfde pad.
- Auditbaarheid: log toegestane en geweigerde bestemmingen aan de egressgrens.
- Operationele controle: dwing bestemmingsregels, netwerksegmentatie, snelheidslimieten of uitgaande allowlists af zonder OpenClaw opnieuw te bouwen.

Proxyrouting is een vangrail op procesniveau voor normale HTTP- en WebSocket-egress. Het geeft operators een fail-closed pad om ondersteunde JavaScript-HTTP-clients via hun eigen filterende proxy te routeren, maar het is geen netwerk-sandbox op OS-niveau en laat OpenClaw het bestemmingsbeleid van de proxy niet certificeren.

## Hoe OpenClaw verkeer routeert

Wanneer `proxy.enabled=true` en een proxy-URL is geconfigureerd, routeren beschermde runtimeprocessen zoals `openclaw gateway run`, `openclaw node run` en `openclaw agent --local` normale HTTP- en WebSocket-egress via de geconfigureerde proxy:

```text
OpenClaw-proces
  fetch                  -> door operator beheerde filterende proxy -> openbaar internet
  node:http en https     -> door operator beheerde filterende proxy -> openbaar internet
  WebSocket-clients      -> door operator beheerde filterende proxy -> openbaar internet
```

Het publieke contract is het routeringsgedrag, niet de interne Node-hooks die worden gebruikt om het te implementeren. OpenClaw Gateway-controlplane-WebSocket-clients gebruiken een smal direct pad voor local loopback Gateway-RPC-verkeer wanneer de Gateway-URL `localhost` of een letterlijk loopback-IP gebruikt, zoals `127.0.0.1` of `[::1]`. Dat controlplane-pad moet loopback-Gateways kunnen bereiken, zelfs wanneer de operatorproxy loopbackbestemmingen blokkeert. Normale runtime-HTTP- en WebSocket-verzoeken gebruiken nog steeds de geconfigureerde proxy.

Intern gebruikt OpenClaw twee routinghooks op procesniveau voor deze functie:

- Undici-dispatcherrouting dekt `fetch`, op undici gebaseerde clients en transporten die hun eigen undici-dispatcher bieden.
- `global-agent`-routing dekt Node-core `node:http`- en `node:https`-aanroepers, waaronder veel bibliotheken die boven op `http.request`, `https.request`, `http.get` en `https.get` zijn gebouwd. Beheerde proxymodus forceert die globale agent zodat expliciete Node-HTTP-agents niet per ongeluk de operatorproxy omzeilen.

Sommige plugins bezitten aangepaste transporten die expliciete proxybedrading nodig hebben, zelfs wanneer routing op procesniveau bestaat. Telegrams Bot API-transport gebruikt bijvoorbeeld zijn eigen HTTP/1-undici-dispatcher en respecteert daarom procesproxy-env plus de beheerde `OPENCLAW_PROXY_URL`-fallback in dat eigenaarspecifieke transportpad.

De proxy-URL zelf moet `http://` gebruiken. HTTPS-bestemmingen worden nog steeds ondersteund via de proxy met HTTP `CONNECT`; dit betekent alleen dat OpenClaw een gewone HTTP-forwardproxy-listener verwacht, zoals `http://127.0.0.1:3128`.

Terwijl de proxy actief is, wist OpenClaw `no_proxy`, `NO_PROXY` en `GLOBAL_AGENT_NO_PROXY`. Die bypasslijsten zijn op bestemming gebaseerd, dus als `localhost` of `127.0.0.1` daarin blijft staan, kunnen risicovolle SSRF-doelen de filterende proxy overslaan.

Bij afsluiten herstelt OpenClaw de vorige proxyomgeving en reset het de gecachete procesroutingstatus.

## Verwante proxytermen

- `proxy.enabled` / `proxy.proxyUrl`: uitgaande forwardproxyrouting voor OpenClaw-runtime-egress. Deze pagina documenteert die functie.
- `gateway.auth.mode: "trusted-proxy"`: inkomende identity-aware reverseproxy-authenticatie voor Gateway-toegang. Zie [Vertrouwde proxy-authenticatie](/nl/gateway/trusted-proxy-auth).
- `openclaw proxy`: lokale debugproxy en capture-inspector voor ontwikkeling en ondersteuning. Zie [openclaw proxy](/nl/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: opt-in voor `web_fetch` om een door de operator beheerde HTTP(S)-env-proxy DNS te laten oplossen, terwijl de standaard strikte DNS-pinning en hostnaampolicy behouden blijven. Zie [Web fetch](/nl/tools/web-fetch#trusted-env-proxy).
- Kanaal- of providerspecifieke proxyinstellingen: eigenaarspecifieke overrides voor een bepaald transport. Geef de beheerde netwerkproxy de voorkeur wanneer het doel centrale egresscontrole over de runtime is.

## Configuratie

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

U kunt de URL ook via de omgeving aanbieden, terwijl `proxy.enabled=true` in de configuratie blijft staan:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` heeft voorrang op `OPENCLAW_PROXY_URL`.

### Gateway Loopback-modus

Lokale Gateway-controlplane-clients verbinden meestal met een loopback-WebSocket zoals `ws://127.0.0.1:18789`. Gebruik `proxy.loopbackMode` om te kiezen hoe dat verkeer zich gedraagt terwijl de beheerde proxy actief is:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (standaard): OpenClaw registreert de Gateway-loopbackauthority in de actieve `global-agent` `NO_PROXY`-controller, zodat lokaal Gateway-WebSocket-verkeer direct kan verbinden. Aangepaste loopback-Gateway-poorten werken omdat de host en poort van de actieve Gateway-URL worden geregistreerd.
- `proxy`: OpenClaw registreert geen Gateway-loopback-`NO_PROXY`-authority, dus lokaal Gateway-verkeer wordt via de beheerde proxy verzonden. Als de proxy extern is, moet die speciale routering bieden voor de loopbackservice van de OpenClaw-host, zoals mapping naar een voor de proxy bereikbare hostnaam, IP of tunnel. Standaard externe proxy's lossen `127.0.0.1` en `localhost` op vanaf de proxyhost, niet vanaf de OpenClaw-host.
- `block`: OpenClaw weigert loopback-Gateway-controlplane-verbindingen voordat een socket wordt geopend.

Als `enabled=true` maar geen geldige proxy-URL is geconfigureerd, mislukken beschermde commando's bij het opstarten in plaats van terug te vallen op directe netwerktoegang.

Voor beheerde gatewayservices die met `openclaw gateway start` zijn gestart, heeft het de voorkeur de URL in de configuratie op te slaan:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

De omgevingsfallback is het beste voor voorgrondruns. Als u deze met een geïnstalleerde service gebruikt, zet `OPENCLAW_PROXY_URL` dan in de duurzame omgeving van de service, zoals `$OPENCLAW_STATE_DIR/.env` of `~/.openclaw/.env`, en installeer de service vervolgens opnieuw zodat launchd, systemd of Scheduled Tasks de gateway met die waarde start.

Voor `openclaw --container ...`-commando's stuurt OpenClaw `OPENCLAW_PROXY_URL` door naar de containergerichte child-CLI wanneer deze is ingesteld. De URL moet bereikbaar zijn vanuit de container; `127.0.0.1` verwijst naar de container zelf, niet naar de host. OpenClaw weigert loopback-proxy-URL's voor containergerichte commando's, tenzij u die veiligheidscontrole expliciet overridet.

## Proxyvereisten

Het proxybeleid is de beveiligingsgrens. OpenClaw kan niet verifiëren dat de proxy de juiste doelen blokkeert.

Configureer de proxy om:

- Alleen te binden aan loopback of een private vertrouwde interface.
- Toegang te beperken zodat alleen het OpenClaw-proces, de host, container of serviceaccount deze kan gebruiken.
- Bestemmingen zelf op te lossen en bestemmings-IP's na DNS-resolutie te blokkeren.
- Beleid bij verbinden toe te passen voor zowel gewone HTTP-verzoeken als HTTPS-`CONNECT`-tunnels.
- Op bestemming gebaseerde bypasses te weigeren voor loopback-, private, link-local-, metadata-, multicast-, gereserveerde of documentatiebereiken.
- Hostnaam-allowlists te vermijden, tenzij u het DNS-resolutiepad volledig vertrouwt.
- Bestemming, beslissing, status en reden te loggen zonder request bodies, authorization-headers, cookies of andere geheimen te loggen.
- Proxybeleid onder versiebeheer te houden en wijzigingen te beoordelen zoals beveiligingsgevoelige configuratie.

## Aanbevolen geblokkeerde bestemmingen

Gebruik deze denylist als uitgangspunt voor elke forwardproxy, firewall of egresspolicy.

De classificatielogica op OpenClaw-applicatieniveau staat in `src/infra/net/ssrf.ts` en `src/shared/net/ip.ts`. De relevante parity-hooks zijn `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` en de ingebedde IPv4-sentinelafhandeling voor NAT64, 6to4, Teredo, ISATAP en IPv4-mapped vormen. Die bestanden zijn nuttige referenties bij het onderhouden van een extern proxybeleid, maar OpenClaw exporteert of handhaaft die regels niet automatisch in uw proxy.

| Bereik of host                                                                       | Waarom blokkeren                                      |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4-loopback                                         |
| `::1/128`                                                                            | IPv6-loopback                                         |
| `0.0.0.0/8`, `::/128`                                                                | Ongespecificeerde en this-network-adressen            |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Private RFC1918-netwerken                            |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-local-adressen en gangbare cloudmetadatapaden    |
| `169.254.169.254`, `metadata.google.internal`                                        | Cloudmetadataservices                                 |
| `100.64.0.0/10`                                                                      | Gedeelde carrier-grade NAT-adresruimte                |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Benchmarkingbereiken                                  |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Special-use- en documentatiebereiken                  |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                             |
| `240.0.0.0/4`                                                                        | Gereserveerd IPv4                                     |
| `fc00::/7`, `fec0::/10`                                                              | Lokale/private IPv6-bereiken                          |
| `100::/64`, `2001:20::/28`                                                           | IPv6-discard- en ORCHIDv2-bereiken                    |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | NAT64-prefixen met ingebed IPv4                       |
| `2002::/16`, `2001::/32`                                                             | 6to4 en Teredo met ingebed IPv4                       |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-compatibel en IPv4-mapped IPv6                   |

Als uw cloudprovider of netwerkplatform aanvullende metadatahosts of gereserveerde bereiken documenteert, voeg die dan ook toe.

## Validatie

Valideer de proxy vanaf dezelfde host, container of serviceaccount waarop OpenClaw draait:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Standaard, wanneer er geen aangepaste bestemmingen zijn opgegeven, controleert de opdracht of `https://example.com/` slaagt en start deze een tijdelijke loopback-canary die de proxy niet mag bereiken. De standaard geweigerde controle slaagt wanneer de proxy een niet-2xx-weigeringsrespons retourneert of de canary blokkeert met een transportfout; deze mislukt als een succesvolle respons de canary bereikt. Als er geen proxy is ingeschakeld en geconfigureerd, meldt validatie een configuratieprobleem; gebruik `--proxy-url` voor een eenmalige preflight voordat je de configuratie wijzigt. Gebruik `--allowed-url` en `--denied-url` om implementatiespecifieke verwachtingen te testen. Voeg `--apns-reachable` toe om ook te verifiëren dat directe APNs HTTP/2-levering een CONNECT-tunnel via de proxy kan openen en een sandbox-APNs-respons kan ontvangen; de probe gebruikt opzettelijk een ongeldig provider-token, dus `403 InvalidProviderToken` wordt verwacht en telt als bereikbaar. Aangepaste geweigerde bestemmingen zijn fail-closed: elke HTTP-respons betekent dat de bestemming via de proxy bereikbaar was, en elke transportfout wordt als onbeslist gerapporteerd omdat OpenClaw niet kan bewijzen dat de proxy een bereikbare origin heeft geblokkeerd. Bij een validatiefout sluit de opdracht af met code 1.

Gebruik `--json` voor automatisering. De JSON-uitvoer bevat het algemene resultaat, de effectieve bron van de proxyconfiguratie, eventuele configuratiefouten en elke bestemmingscontrole. Proxy-URL-referenties worden geredigeerd in tekst- en JSON-uitvoer:

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

Het openbare verzoek zou moeten slagen. De loopback- en metadataverzoeken zouden door de proxy moeten worden geblokkeerd. Voor `openclaw proxy validate` kan de ingebouwde loopback-canary een proxyweigering onderscheiden van een bereikbare origin. Aangepaste `--denied-url`-controles hebben die canary niet, dus behandel zowel HTTP-responsen als dubbelzinnige transportfouten als validatiefouten, tenzij je proxy een implementatiespecifiek weigeringssignaal blootstelt dat je afzonderlijk kunt verifiëren.

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

- De proxy verbetert de dekking voor proceslokale JavaScript HTTP- en WebSocket-clients, maar is geen netwerk-sandbox op OS-niveau.
- Gateway-loopbackverkeer voor het control plane gebruikt standaard een directe lokale bypass via `proxy.loopbackMode: "gateway-only"`. OpenClaw implementeert die bypass door de actieve Gateway-loopback-authority te registreren in de beheerde `global-agent` `NO_PROXY`-controller. Operators kunnen `proxy.loopbackMode: "proxy"` instellen om Gateway-loopbackverkeer via de beheerde proxy te sturen, of `proxy.loopbackMode: "block"` om loopback-Gateway-verbindingen te weigeren. Zie [Gateway-loopbackmodus](#gateway-loopback-mode) voor de kanttekening over externe proxy's.
- Ruwe `net`-, `tls`- en `http2`-sockets, native addons en niet-OpenClaw-childprocessen kunnen Node-proxyrouting omzeilen, tenzij ze proxy-omgevingsvariabelen erven en respecteren. Geforkte OpenClaw-child-CLI's erven de beheerde proxy-URL en de `proxy.loopbackMode`-status.
- IRC is een ruw TCP/TLS-kanaal buiten operator-beheerde forward-proxyrouting. Stel in implementaties die vereisen dat alle uitgaand verkeer via die forward proxy loopt `channels.irc.enabled=false` in, tenzij directe IRC-egress expliciet is goedgekeurd.
- De lokale debugproxy is diagnostische tooling en de directe upstream-forwarding voor proxyverzoeken en CONNECT-tunnels is standaard uitgeschakeld terwijl de beheerde proxymodus actief is; schakel directe forwarding alleen in voor goedgekeurde lokale diagnostiek.
- Lokale WebUI's van gebruikers en lokale modelservers moeten waar nodig op de allowlist in het operator-proxybeleid staan; OpenClaw biedt hiervoor geen algemene bypass voor het lokale netwerk.
- De proxybypass voor het Gateway-control plane is bewust beperkt tot `localhost` en letterlijke loopback-IP-URL's. Gebruik `ws://127.0.0.1:18789`, `ws://[::1]:18789` of `ws://localhost:18789` voor lokale directe Gateway-control-plane-verbindingen; andere hostnamen worden gerouteerd als gewoon op hostnaam gebaseerd verkeer.
- OpenClaw inspecteert, test of certificeert je proxybeleid niet.
- Behandel wijzigingen in proxybeleid als beveiligingsgevoelige operationele wijzigingen.
