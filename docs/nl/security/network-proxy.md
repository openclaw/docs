---
read_when:
    - U wilt gelaagde bescherming tegen SSRF- en DNS-rebindingaanvallen
    - Een externe doorstuurproxy configureren voor OpenClaw-runtimeverkeer
summary: Hoe u OpenClaw-runtime-HTTP- en WebSocket-verkeer routeert via een door de operator beheerde filterproxy
title: Netwerkproxy
x-i18n:
    generated_at: "2026-05-07T16:23:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22895b7c5521927b7145f55dff9b777e701691f01a6421db0f5b1ff489734775
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw kan HTTP- en WebSocket-verkeer tijdens runtime routeren via een door de operator beheerde forward proxy. Dit is optionele defense in depth voor deployments die centrale egresscontrole, sterkere SSRF-bescherming en betere netwerkauditbaarheid willen.

OpenClaw levert, downloadt, start, configureert of certificeert geen proxy. Je draait de proxytechnologie die bij je omgeving past, en OpenClaw routeert normale proceslokale HTTP- en WebSocket-clients erdoorheen.

## Waarom een proxy gebruiken

Een proxy geeft operators één netwerkcontrolepunt voor uitgaand HTTP- en WebSocket-verkeer. Dat kan ook buiten SSRF-verharding nuttig zijn:

- Centraal beleid: beheer één egressbeleid in plaats van erop te vertrouwen dat elke HTTP-aanroepplaats in de applicatie de netwerkregels correct toepast.
- Controles tijdens verbinden: evalueer de bestemming na DNS-resolutie en direct voordat de proxy de upstreamverbinding opent.
- Verdediging tegen DNS-rebinding: verklein de kloof tussen een DNS-controle op applicatieniveau en de daadwerkelijke uitgaande verbinding.
- Bredere JavaScript-dekking: routeer gewone `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch en vergelijkbare clients via hetzelfde pad.
- Auditbaarheid: log toegestane en geweigerde bestemmingen aan de egressgrens.
- Operationele controle: dwing bestemmingsregels, netwerksegmentatie, snelheidslimieten of uitgaande allowlists af zonder OpenClaw opnieuw te bouwen.

Proxyrouting is een procesniveau-vangrail voor normale HTTP- en WebSocket-egress. Het geeft operators een fail-closed pad om ondersteunde JavaScript HTTP-clients via hun eigen filterende proxy te routeren, maar het is geen netwerk-sandbox op OS-niveau en zorgt er niet voor dat OpenClaw het bestemmingsbeleid van de proxy certificeert.

## Hoe OpenClaw verkeer routeert

Wanneer `proxy.enabled=true` en er een proxy-URL is geconfigureerd, routeren beschermde runtimeprocessen zoals `openclaw gateway run`, `openclaw node run` en `openclaw agent --local` normale HTTP- en WebSocket-egress via de geconfigureerde proxy:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Het publieke contract is het routeringsgedrag, niet de interne Node-hooks die worden gebruikt om het te implementeren. OpenClaw Gateway control-plane WebSocket-clients gebruiken een smal direct pad voor local loopback Gateway RPC-verkeer wanneer de Gateway-URL `localhost` of een letterlijk loopback-IP gebruikt, zoals `127.0.0.1` of `[::1]`. Dat control-plane-pad moet loopback-Gateways kunnen bereiken, zelfs wanneer de operatorproxy loopbackbestemmingen blokkeert. Normale HTTP- en WebSocket-aanvragen tijdens runtime gebruiken nog steeds de geconfigureerde proxy.

Intern gebruikt OpenClaw twee procesniveau-routeringshooks voor deze functie:

- Undici-dispatcherrouting dekt `fetch`, undici-gebaseerde clients en transports die hun eigen undici-dispatcher leveren.
- `global-agent`-routing dekt Node core `node:http`- en `node:https`-aanroepers, waaronder veel bibliotheken die zijn gebouwd bovenop `http.request`, `https.request`, `http.get` en `https.get`. Beheerde proxymodus forceert die globale agent zodat expliciete Node HTTP-agents de operatorproxy niet per ongeluk omzeilen.

Sommige plugins bezitten aangepaste transports die expliciete proxybedrading nodig hebben, zelfs wanneer procesniveau-routing bestaat. De Bot API-transportlaag van Telegram gebruikt bijvoorbeeld zijn eigen HTTP/1 undici-dispatcher en respecteert daarom procesproxy-env plus de beheerde `OPENCLAW_PROXY_URL`-fallback in dat eigenaarsspecifieke transportpad.

De proxy-URL zelf moet `http://` gebruiken. HTTPS-bestemmingen worden nog steeds ondersteund via de proxy met HTTP `CONNECT`; dit betekent alleen dat OpenClaw een gewone HTTP forward-proxy-listener verwacht, zoals `http://127.0.0.1:3128`.

Terwijl de proxy actief is, wist OpenClaw `no_proxy`, `NO_PROXY` en `GLOBAL_AGENT_NO_PROXY`. Die bypasslijsten zijn bestemmingsgebaseerd, dus als `localhost` of `127.0.0.1` daarin blijft staan, zouden SSRF-doelen met hoog risico de filterende proxy kunnen overslaan.

Bij afsluiten herstelt OpenClaw de vorige proxyomgeving en reset het de gecachte procesrouteringsstatus.

## Gerelateerde proxytermen

- `proxy.enabled` / `proxy.proxyUrl`: uitgaande forward-proxy-routing voor OpenClaw runtime-egress. Deze pagina documenteert die functie.
- `gateway.auth.mode: "trusted-proxy"`: inkomende identiteitsbewuste reverse-proxy-authenticatie voor Gateway-toegang. Zie [Vertrouwde proxy-authenticatie](/nl/gateway/trusted-proxy-auth).
- `openclaw proxy`: lokale debugproxy en capture-inspector voor ontwikkeling en ondersteuning. Zie [openclaw proxy](/nl/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: opt-in voor `web_fetch` om een door de operator beheerde HTTP(S)-env-proxy DNS te laten oplossen, terwijl standaard strikte DNS-pinning en hostnaambeleiid behouden blijven. Zie [Web fetch](/nl/tools/web-fetch#trusted-env-proxy).
- Kanaal- of providerspecifieke proxyinstellingen: eigenaarsspecifieke overrides voor een specifieke transportlaag. Geef de voorkeur aan de beheerde netwerkproxy wanneer het doel centrale egresscontrole over de runtime is.

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

### Gateway Loopback-modus

Lokale Gateway control-plane-clients verbinden meestal met een loopback-WebSocket zoals `ws://127.0.0.1:18789`. Gebruik `proxy.loopbackMode` om te kiezen hoe dat verkeer zich gedraagt terwijl de beheerde proxy actief is:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (standaard): OpenClaw registreert de Gateway-loopbackautoriteit in de actieve `global-agent` `NO_PROXY`-controller zodat lokaal Gateway WebSocket-verkeer direct kan verbinden. Aangepaste loopback-Gatewaypoorten werken omdat de host en poort van de actieve Gateway-URL worden geregistreerd.
- `proxy`: OpenClaw registreert geen Gateway-loopback-`NO_PROXY`-autoriteit, dus lokaal Gateway-verkeer wordt via de beheerde proxy verzonden. Als de proxy extern is, moet deze speciale routering bieden voor de loopbackservice van de OpenClaw-host, zoals het mappen daarvan naar een door de proxy bereikbare hostnaam, IP of tunnel. Standaard externe proxy's lossen `127.0.0.1` en `localhost` op vanaf de proxyhost, niet vanaf de OpenClaw-host.
- `block`: OpenClaw weigert loopback Gateway control-plane-verbindingen voordat er een socket wordt geopend.

Als `enabled=true` maar er geen geldige proxy-URL is geconfigureerd, mislukken beschermde opdrachten tijdens het starten in plaats van terug te vallen op directe netwerktoegang.

Voor beheerde gatewayservices die met `openclaw gateway start` worden gestart, heeft het de voorkeur de URL in configuratie op te slaan:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

De omgevingsfallback is het meest geschikt voor foreground-runs. Als je die gebruikt met een geïnstalleerde service, plaats `OPENCLAW_PROXY_URL` dan in de duurzame omgeving van de service, zoals `$OPENCLAW_STATE_DIR/.env` of `~/.openclaw/.env`, en installeer de service vervolgens opnieuw zodat launchd, systemd of Scheduled Tasks de gateway met die waarde start.

Voor `openclaw --container ...`-opdrachten geeft OpenClaw `OPENCLAW_PROXY_URL` door aan de containergerichte child-CLI wanneer deze is ingesteld. De URL moet bereikbaar zijn vanuit de container; `127.0.0.1` verwijst naar de container zelf, niet naar de host. OpenClaw weigert loopback-proxy-URL's voor containergerichte opdrachten, tenzij je die veiligheidscontrole expliciet overschrijft.

## Proxyvereisten

Het proxybeleid is de beveiligingsgrens. OpenClaw kan niet verifiëren dat de proxy de juiste doelen blokkeert.

Configureer de proxy om:

- Alleen aan loopback of een privé vertrouwde interface te binden.
- Toegang te beperken zodat alleen het OpenClaw-proces, de host, container of serviceaccount deze kan gebruiken.
- Bestemmingen zelf op te lossen en bestemmings-IP's na DNS-resolutie te blokkeren.
- Beleid toe te passen tijdens verbinden voor zowel gewone HTTP-aanvragen als HTTPS `CONNECT`-tunnels.
- Bestemmingsgebaseerde bypasses te weigeren voor loopback-, privé-, link-local-, metadata-, multicast-, gereserveerde of documentatiebereiken.
- Hostnaam-allowlists te vermijden, tenzij je het DNS-resolutiepad volledig vertrouwt.
- Bestemming, beslissing, status en reden te loggen zonder request bodies, authorization-headers, cookies of andere geheimen te loggen.
- Proxybeleid onder versiebeheer te houden en wijzigingen te beoordelen als beveiligingsgevoelige configuratie.

## Aanbevolen geblokkeerde bestemmingen

Gebruik deze denylist als uitgangspunt voor elke forward proxy, firewall of elk egressbeleid.

De classificatielogica op OpenClaw-applicatieniveau staat in `src/infra/net/ssrf.ts` en `src/shared/net/ip.ts`. De relevante parity-hooks zijn `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` en de ingebedde IPv4-sentinelafhandeling voor NAT64, 6to4, Teredo, ISATAP en IPv4-mapped vormen. Die bestanden zijn nuttige referenties bij het onderhouden van een extern proxybeleid, maar OpenClaw exporteert of handhaaft die regels niet automatisch in je proxy.

| Bereik of host                                                                        | Waarom blokkeren                                      |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4-loopback                                        |
| `::1/128`                                                                            | IPv6-loopback                                        |
| `0.0.0.0/8`, `::/128`                                                                | Ongespecificeerde en dit-netwerk-adressen            |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918-privénetwerken                               |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-local-adressen en gangbare cloudmetadatapaden   |
| `169.254.169.254`, `metadata.google.internal`                                        | Cloudmetadataservices                                |
| `100.64.0.0/10`                                                                      | Gedeelde adresruimte voor carrier-grade NAT          |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Benchmarkingbereiken                                 |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Special-use- en documentatiebereiken                 |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                            |
| `240.0.0.0/4`                                                                        | Gereserveerde IPv4                                   |
| `fc00::/7`, `fec0::/10`                                                              | IPv6-lokale/privébereiken                            |
| `100::/64`, `2001:20::/28`                                                           | IPv6-discard- en ORCHIDv2-bereiken                   |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | NAT64-prefixen met ingebedde IPv4                    |
| `2002::/16`, `2001::/32`                                                             | 6to4 en Teredo met ingebedde IPv4                    |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-compatible en IPv4-mapped IPv6                  |

Als je cloudprovider of netwerkplatform aanvullende metadatahosts of gereserveerde bereiken documenteert, voeg die dan ook toe.

## Validatie

Valideer de proxy vanaf dezelfde host, container of serviceaccount waarop OpenClaw draait:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Standaard controleert de opdracht, wanneer er geen aangepaste bestemmingen zijn opgegeven, of `https://example.com/` slaagt en start deze een tijdelijke loopback-canary die de proxy niet mag bereiken. De standaard geweigerde controle slaagt wanneer de proxy een niet-2xx-weigeringsrespons retourneert of de canary blokkeert met een transportfout; deze mislukt als een succesvolle respons de canary bereikt. Als er geen proxy is ingeschakeld en geconfigureerd, meldt de validatie een configuratieprobleem; gebruik `--proxy-url` voor een eenmalige preflight voordat je de configuratie wijzigt. Gebruik `--allowed-url` en `--denied-url` om implementatiespecifieke verwachtingen te testen. Voeg `--apns-reachable` toe om ook te verifiëren dat directe APNs HTTP/2-aflevering een CONNECT-tunnel via de proxy kan openen en een sandbox-APNs-respons kan ontvangen; de probe gebruikt opzettelijk een ongeldig provider-token, dus `403 InvalidProviderToken` wordt verwacht en telt als bereikbaar. Aangepaste geweigerde bestemmingen zijn fail-closed: elke HTTP-respons betekent dat de bestemming via de proxy bereikbaar was, en elke transportfout wordt als onbeslist gerapporteerd omdat OpenClaw niet kan bewijzen dat de proxy een bereikbare oorsprong heeft geblokkeerd. Bij validatiefout sluit de opdracht af met code 1.

Gebruik `--json` voor automatisering. De JSON-uitvoer bevat het algehele resultaat, de effectieve bron van de proxyconfiguratie, eventuele configuratiefouten en elke bestemmingscontrole. Referenties in proxy-URL's worden geredigeerd in tekst- en JSON-uitvoer:

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

Het openbare verzoek moet slagen. De loopback- en metadataverzoeken moeten door de proxy worden geblokkeerd. Voor `openclaw proxy validate` kan de ingebouwde loopback-canary onderscheid maken tussen een proxyweigering en een bereikbare oorsprong. Aangepaste `--denied-url`-controles hebben die canary niet, dus behandel zowel HTTP-responsen als dubbelzinnige transportfouten als validatiefouten, tenzij je proxy een implementatiespecifiek weigeringssignaal blootlegt dat je afzonderlijk kunt verifiëren.

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

- De proxy verbetert de dekking voor proceslokale JavaScript-HTTP- en WebSocket-clients, maar is geen netwerk-sandbox op OS-niveau.
- Gateway-loopbackverkeer voor het control-plane gebruikt standaard een directe lokale bypass via `proxy.loopbackMode: "gateway-only"`. OpenClaw implementeert die bypass door de actieve Gateway-loopbackautoriteit te registreren in de beheerde `global-agent`-`NO_PROXY`-controller. Operators kunnen `proxy.loopbackMode: "proxy"` instellen om Gateway-loopbackverkeer via de beheerde proxy te verzenden, of `proxy.loopbackMode: "block"` om loopback-Gateway-verbindingen te weigeren. Zie [Gateway-loopbackmodus](#gateway-loopback-mode) voor de kanttekening bij externe proxy's.
- Ruwe `net`-, `tls`- en `http2`-sockets, native add-ons en niet-OpenClaw-kindprocessen kunnen Node-proxyrouting omzeilen, tenzij ze proxy-omgevingsvariabelen erven en respecteren. Geforkte OpenClaw-kind-CLI's erven de beheerde proxy-URL en de status van `proxy.loopbackMode`.
- IRC is een ruw TCP/TLS-kanaal buiten door operators beheerde forward-proxyrouting. Stel in implementaties die alle uitgaande verbindingen via die forward-proxy vereisen `channels.irc.enabled=false` in, tenzij directe IRC-uitgang expliciet is goedgekeurd.
- De lokale debugproxy is diagnostische tooling en de directe upstream-forwarding voor proxyverzoeken en CONNECT-tunnels is standaard uitgeschakeld terwijl de beheerde proxymodus actief is; schakel directe forwarding alleen in voor goedgekeurde lokale diagnostiek.
- Lokale WebUI's van gebruikers en lokale modelservers moeten waar nodig op de allowlist in het proxybeleid van de operator worden geplaatst; OpenClaw stelt geen algemene bypass voor lokale netwerken voor hen beschikbaar.
- De Gateway-proxybypass voor het control-plane is bewust beperkt tot `localhost` en letterlijke loopback-IP-URL's. Gebruik `ws://127.0.0.1:18789`, `ws://[::1]:18789` of `ws://localhost:18789` voor lokale directe Gateway-control-plane-verbindingen; andere hostnamen routeren zoals gewoon hostnaamgebaseerd verkeer.
- OpenClaw inspecteert, test of certificeert je proxybeleid niet.
- Behandel wijzigingen in het proxybeleid als beveiligingsgevoelige operationele wijzigingen.

| Oppervlak                                                    | Status van beheerde proxy                                                                          |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, gangbare WebSocket-clients | Gerouteerd via beheerde proxyhooks wanneer geconfigureerd.                                         |
| Directe APNs HTTP/2                                          | Gerouteerd via de APNs beheerde CONNECT-helper.                                                    |
| Gateway-control-plane-loopback                               | Alleen direct voor de geconfigureerde local loopback Gateway-URL.                                  |
| Upstream-forwarding van debugproxy                           | Uitgeschakeld terwijl beheerde proxymodus actief is, tenzij expliciet ingeschakeld voor lokale diagnostiek. |
| IRC                                                          | Ruw TCP/TLS; niet geproxyd door beheerde HTTP-proxymodus. Uitschakelen tenzij directe IRC-uitgang is goedgekeurd. |
| Andere ruwe `net`-, `tls`- of `http2`-clientaanroepen        | Moeten door de raw-socket-guard worden geclassificeerd voordat ze worden geland.                   |
