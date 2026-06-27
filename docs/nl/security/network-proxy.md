---
read_when:
    - Je wilt meerlaagse beveiliging tegen SSRF- en DNS-rebinding-aanvallen
    - Een externe forward proxy configureren voor OpenClaw-runtimeverkeer
summary: Hoe je HTTP- en WebSocket-verkeer van de OpenClaw-runtime via een door de operator beheerde filterproxy routeert
title: Netwerkproxy
x-i18n:
    generated_at: "2026-06-27T18:21:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3fc68d950037922ba3dc983c94a71bac3374750a02ef25f2c046cf782410be68
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw kan runtime-HTTP- en WebSocket-verkeer routeren via een door de beheerder beheerde forward proxy. Dit is optionele defense in depth voor deployments die centrale egress-controle, sterkere SSRF-bescherming en betere netwerkcontroleerbaarheid willen.

OpenClaw levert, downloadt, start, configureert of certificeert geen proxy. Je gebruikt de proxytechnologie die bij je omgeving past, en OpenClaw routeert normale proceslokale HTTP- en WebSocket-clients erdoorheen.

## Waarom een proxy gebruiken

Een proxy geeft beheerders één netwerkcontrolepunt voor uitgaand HTTP- en WebSocket-verkeer. Dat kan ook buiten SSRF-hardening nuttig zijn:

- Centraal beleid: onderhoud één egress-beleid in plaats van erop te vertrouwen dat elke HTTP-aanroeplocatie in de toepassing de netwerkregels goed toepast.
- Controles bij verbinding: evalueer de bestemming na DNS-resolutie en direct voordat de proxy de upstreamverbinding opent.
- Verdediging tegen DNS rebinding: verklein de kloof tussen een DNS-controle op toepassingsniveau en de daadwerkelijke uitgaande verbinding.
- Bredere JavaScript-dekking: routeer gewone `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch en vergelijkbare clients via hetzelfde pad.
- Controleerbaarheid: log toegestane en geweigerde bestemmingen aan de egress-grens.
- Operationele controle: dwing bestemmingsregels, netwerksegmentatie, snelheidslimieten of uitgaande allowlists af zonder OpenClaw opnieuw te bouwen.

Proxyroutering is een guardrail op procesniveau voor normale HTTP- en WebSocket-egress. Het geeft beheerders een fail-closed pad om ondersteunde JavaScript-HTTP-clients via hun eigen filterende proxy te routeren, maar het is geen netwerk-sandbox op OS-niveau en laat OpenClaw het bestemmingsbeleid van de proxy niet certificeren.

## Hoe OpenClaw verkeer routeert

Wanneer `proxy.enabled=true` en een proxy-URL is geconfigureerd, routeren beschermde runtimeprocessen zoals `openclaw gateway run`, `openclaw node run` en `openclaw agent --local` normale HTTP- en WebSocket-egress via de geconfigureerde proxy:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Het openbare contract is het routeringsgedrag, niet de interne Node-hooks die worden gebruikt om het te implementeren. OpenClaw Gateway-control-plane WebSocket-clients gebruiken een smal direct pad voor local loopback Gateway RPC-verkeer wanneer de Gateway-URL `localhost` of een letterlijk loopback-IP gebruikt, zoals `127.0.0.1` of `[::1]`. Dat control-plane-pad moet loopback-Gateways kunnen bereiken, zelfs wanneer de beheerdersproxy loopbackbestemmingen blokkeert. Normale runtime-HTTP- en WebSocket-aanvragen gebruiken nog steeds de geconfigureerde proxy.

Intern installeert OpenClaw Proxyline als de procesniveau-routeringsruntime voor deze functie. Proxyline dekt `fetch`, undici-gebaseerde clients, Node core `node:http` / `node:https`-aanroepers, gangbare WebSocket-clients en door helpers gemaakte CONNECT-tunnels. Beheerde proxymodus vervangt door aanroepers geleverde Node HTTP-agents, zodat expliciete agents de beheerdersproxy niet per ongeluk omzeilen.

Sommige Plugins beheren aangepaste transports die expliciete proxybedrading nodig hebben, zelfs wanneer routering op procesniveau bestaat. De Bot API-transportlaag van Telegram gebruikt bijvoorbeeld zijn eigen HTTP/1 undici-dispatcher en respecteert daarom procesproxy-env plus de beheerde `OPENCLAW_PROXY_URL`-fallback in dat eigenaarsspecifieke transportpad.

De proxy-URL zelf kan `http://` of `https://` gebruiken. Deze schema's beschrijven de verbinding van OpenClaw naar het proxy-eindpunt:

- `http://proxy.example:3128`: OpenClaw opent een gewone TCP-verbinding naar de forward proxy en verzendt HTTP-proxyverzoeken, inclusief `CONNECT` voor HTTPS-bestemmingen.
- `https://proxy.example:8443`: OpenClaw opent TLS naar het proxy-eindpunt, verifieert het proxycertificaat en verzendt vervolgens HTTP-proxyverzoeken binnen die TLS-sessie.

Bestemmings-HTTPS staat los van TLS voor het proxy-eindpunt. Voor een HTTPS-bestemming vraagt OpenClaw de proxy nog steeds om een HTTP `CONNECT`-tunnel en start vervolgens bestemming-TLS via die tunnel.

Terwijl de proxy actief is, wist OpenClaw `no_proxy` en `NO_PROXY`. Die omzeillijsten zijn bestemmingsgebaseerd, dus als `localhost` of `127.0.0.1` daarin blijft staan, kunnen SSRF-doelen met hoog risico de filterende proxy overslaan.

Bij afsluiten herstelt OpenClaw de vorige proxyomgeving en reset het gecachete procesrouteringsstatus.

## Gerelateerde proxytermen

- `proxy.enabled` / `proxy.proxyUrl`: uitgaande forward-proxyroutering voor OpenClaw-runtime-egress. Deze pagina documenteert die functie.
- `gateway.auth.mode: "trusted-proxy"`: inkomende identity-aware reverse-proxy-authenticatie voor Gateway-toegang. Zie [Trusted proxy-authenticatie](/nl/gateway/trusted-proxy-auth).
- `openclaw proxy`: lokale debugproxy en capture-inspector voor ontwikkeling en ondersteuning. Zie [openclaw proxy](/nl/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: opt-in voor `web_fetch` om een door de beheerder gecontroleerde HTTP(S)-env-proxy DNS te laten oplossen, terwijl standaard strikte DNS-pinning en hostnamebeleid behouden blijven. Zie [Web fetch](/nl/tools/web-fetch#trusted-env-proxy).
- Kanaal- of providerspecifieke proxyinstellingen: eigenaarsspecifieke overrides voor een bepaald transport. Geef de voorkeur aan de beheerde netwerkproxy wanneer het doel centrale egress-controle over de runtime is.

## Configuratie

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Voor een HTTPS-proxy-eindpunt met een private proxy-CA:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

Je kunt de URL ook via de omgeving opgeven, terwijl je `proxy.enabled=true` in de config houdt:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` heeft voorrang op `OPENCLAW_PROXY_URL`.

### Gateway Loopback-modus

Lokale Gateway-control-plane-clients maken meestal verbinding met een loopback-WebSocket zoals `ws://127.0.0.1:18789`. Gebruik `proxy.loopbackMode` om te kiezen hoe loopback-uitzonderingen voor de beheerde proxy zich gedragen terwijl de beheerde proxy actief is:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (standaard): OpenClaw registreert de Gateway-loopbackautoriteit in het beheerde bypassbeleid van Proxyline, zodat lokaal Gateway-WebSocket-verkeer direct verbinding kan maken. Aangepaste loopback-Gateway-poorten werken omdat de host en poort van de actieve Gateway-URL worden geregistreerd. De gebundelde browser-Plugin kan ook de exacte lokale CDP-readiness- en DevTools-WebSocket-eindpunten registreren voor door OpenClaw gestarte beheerde browsers, en de gebundelde Ollama memory embedding provider kan zijn eigen smallere bewaakte directe pad gebruiken voor de exact geconfigureerde hostlokale loopback-embedding-origin.
- `proxy`: OpenClaw registreert geen Gateway- of Ollama-loopbackbypasses, dus dat loopbackverkeer wordt via de beheerde proxy verzonden. Als de proxy extern is, moet deze speciale routering bieden voor de loopbackservice van de OpenClaw-host, zoals mapping naar een door de proxy bereikbare hostnaam, IP of tunnel. Standaard externe proxies lossen `127.0.0.1` en `localhost` op vanaf de proxyhost, niet vanaf de OpenClaw-host.
- `block`: OpenClaw weigert Gateway-loopback-control-plane-verbindingen en bewaakte Ollama-hostlokale embedding-loopbackverbindingen voordat een socket wordt geopend.

Als `enabled=true` maar er geen geldige proxy-URL is geconfigureerd, mislukken beschermde opdrachten bij het opstarten in plaats van terug te vallen op directe netwerktoegang.

Voor beheerde Gateway-services die met `openclaw gateway start` zijn gestart, heeft het de voorkeur de URL in config op te slaan:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

De omgevingsfallback is het best voor foreground-runs. Als je die gebruikt met een geïnstalleerde service, plaats `OPENCLAW_PROXY_URL` dan in de duurzame omgeving van de service, zoals `$OPENCLAW_STATE_DIR/.env` of `~/.openclaw/.env`, en installeer de service vervolgens opnieuw zodat launchd, systemd of Scheduled Tasks de Gateway met die waarde start.

Voor `openclaw --container ...`-opdrachten geeft OpenClaw `OPENCLAW_PROXY_URL` door aan de op containers gerichte child-CLI wanneer deze is ingesteld. De URL moet bereikbaar zijn vanuit de container; `127.0.0.1` verwijst naar de container zelf, niet naar de host. OpenClaw weigert loopback-proxy-URL's voor op containers gerichte opdrachten, tenzij je die veiligheidscontrole expliciet overschrijft.

## Proxyvereisten

Het proxybeleid is de beveiligingsgrens. OpenClaw kan niet verifiëren dat de proxy de juiste doelen blokkeert.

Configureer de proxy om:

- Alleen te binden aan loopback of een private vertrouwde interface.
- Toegang te beperken zodat alleen het OpenClaw-proces, de host, container of serviceaccount deze kan gebruiken.
- Bestemmingen zelf op te lossen en bestemmings-IP's na DNS-resolutie te blokkeren.
- Beleid toe te passen bij verbindingstijd voor zowel gewone HTTP-verzoeken als HTTPS `CONNECT`-tunnels.
- Bestemmingsgebaseerde omzeilingen te weigeren voor loopback-, private, link-local-, metadata-, multicast-, reserved- of documentatiereeksen.
- Hostname-allowlists te vermijden, tenzij je het DNS-resolutiepad volledig vertrouwt.
- Bestemming, beslissing, status en reden te loggen zonder request bodies, authorization-headers, cookies of andere geheimen te loggen.
- Proxybeleid onder versiebeheer te houden en wijzigingen te beoordelen als beveiligingsgevoelige configuratie.

## Aanbevolen geblokkeerde bestemmingen

Gebruik deze denylist als startpunt voor elke forward proxy, firewall of egressbeleid.

OpenClaw-classifierlogica op toepassingsniveau staat in `src/infra/net/ssrf.ts` en `packages/net-policy/src/ip.ts`. De relevante parity-hooks zijn `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` en de ingebedde IPv4-sentinelafhandeling voor NAT64, 6to4, Teredo, ISATAP en IPv4-mapped-vormen. Die bestanden zijn nuttige referenties bij het onderhouden van extern proxybeleid, maar OpenClaw exporteert of handhaaft die regels niet automatisch in je proxy.

| Bereik of host                                                                        | Waarom blokkeren                                      |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4-loopback                                        |
| `::1/128`                                                                            | IPv6-loopback                                        |
| `0.0.0.0/8`, `::/128`                                                                | Niet-gespecificeerde en dit-netwerkadressen          |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918-private netwerken                            |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-local-adressen en gangbare cloudmetadatapaden   |
| `169.254.169.254`, `metadata.google.internal`                                        | Cloudmetadataservices                                |
| `100.64.0.0/10`                                                                      | Gedeelde adresruimte voor carrier-grade NAT          |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Benchmarkingbereiken                                 |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Bereiken voor speciaal gebruik en documentatie       |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                            |
| `240.0.0.0/4`                                                                        | Gereserveerd IPv4                                    |
| `fc00::/7`, `fec0::/10`                                                              | Lokale/private IPv6-bereiken                         |
| `100::/64`, `2001:20::/28`                                                           | IPv6-discard- en ORCHIDv2-bereiken                   |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | NAT64-prefixen met ingebed IPv4                      |
| `2002::/16`, `2001::/32`                                                             | 6to4 en Teredo met ingebed IPv4                      |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-compatibele en IPv4-gemappede IPv6              |

Als je cloudprovider of netwerkplatform aanvullende metadatahosts of gereserveerde bereiken documenteert, voeg die dan ook toe.

## Validatie

Valideer de proxy vanaf dezelfde host, container of hetzelfde serviceaccount waarop OpenClaw draait:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Voor een HTTPS-proxyeindpunt dat is ondertekend door een private CA:

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

Standaard controleert de opdracht, wanneer er geen aangepaste bestemmingen zijn opgegeven, of `https://example.com/` slaagt en start deze een tijdelijke loopback-canary die de proxy niet mag bereiken. De standaard geweigerde controle slaagt wanneer de proxy een niet-2xx-weigeringsantwoord teruggeeft of de canary blokkeert met een transportfout; deze mislukt als een succesvol antwoord de canary bereikt. Als er geen proxy is ingeschakeld en geconfigureerd, meldt validatie een configuratieprobleem; gebruik `--proxy-url` voor een eenmalige preflight voordat je de configuratie wijzigt. Gebruik `--allowed-url` en `--denied-url` om implementatiespecifieke verwachtingen te testen. Voeg `--apns-reachable` toe om ook te verifiëren dat directe APNs HTTP/2-bezorging een CONNECT-tunnel via de proxy kan openen en een sandbox-APNs-antwoord kan ontvangen; de probe gebruikt opzettelijk een ongeldig providertoken, dus `403 InvalidProviderToken` wordt verwacht en telt als bereikbaar. Aangepaste geweigerde bestemmingen zijn fail-closed: elk HTTP-antwoord betekent dat de bestemming via de proxy bereikbaar was, en elke transportfout wordt als niet-overtuigend gerapporteerd omdat OpenClaw niet kan bewijzen dat de proxy een bereikbare origin heeft geblokkeerd. Bij validatiefout sluit de opdracht af met code 1.

Gebruik `--json` voor automatisering. De JSON-uitvoer bevat het algemene resultaat, de effectieve bron van de proxyconfiguratie, eventuele configuratiefouten en elke bestemmingscontrole. Referenties in proxy-URL's worden geredigeerd in tekst- en JSON-uitvoer:

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

Het openbare verzoek moet slagen. De loopback- en metadataverzoeken moeten door de proxy worden geblokkeerd. Voor `openclaw proxy validate` kan de ingebouwde loopback-canary onderscheid maken tussen een proxyweigering en een bereikbare origin. Aangepaste `--denied-url`-controles hebben die canary niet, dus behandel zowel HTTP-antwoorden als dubbelzinnige transportfouten als validatiefouten, tenzij je proxy een implementatiespecifiek weigeringssignaal blootstelt dat je afzonderlijk kunt verifiëren.

## Proxy-CA-vertrouwen

Gebruik beheerde `proxy.tls.caFile` wanneer het proxyeindpunt zelf een certificaat gebruikt dat door een private CA is ondertekend:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

Die CA wordt gebruikt voor TLS-verificatie van het proxyeindpunt. Het is geen instelling voor MITM-vertrouwen van bestemmingen, geen clientcertificaat en geen vervanging voor het bestemmingsbeleid van de proxy.

Gebruik `NODE_EXTRA_CA_CERTS` alleen wanneer het hele Node-proces vanaf processtart een aanvullende CA moet vertrouwen, bijvoorbeeld wanneer een enterprise TLS-inspectiesysteem bestemmingscertificaten opnieuw ondertekent voor elke HTTPS-client in het proces. `NODE_EXTRA_CA_CERTS` is procesglobaal en moet aanwezig zijn voordat Node start. Geef de voorkeur aan `proxy.tls.caFile` voor vertrouwen in HTTPS-proxyeindpunten, omdat dit is beperkt tot beheerde proxyrouting.

Schakel daarna OpenClaw-proxyrouting in:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

of stel het volgende in:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

## Limieten

- De proxy verbetert de dekking voor proceslokale JavaScript HTTP- en WebSocket-clients, maar is geen netwerk-sandbox op OS-niveau.
- Gateway-loopbackverkeer voor het control plane gebruikt standaard een directe lokale bypass via `proxy.loopbackMode: "gateway-only"`. OpenClaw implementeert die bypass door de actieve Gateway-loopbackautoriteit te registreren in het beheerde bypassbeleid van Proxyline. Operators kunnen `proxy.loopbackMode: "proxy"` instellen om Gateway-loopbackverkeer via de beheerde proxy te sturen, of `proxy.loopbackMode: "block"` om loopback-Gateway-verbindingen te weigeren. Zie [Gateway-loopbackmodus](#gateway-loopback-mode) voor de kanttekening bij externe proxy's.
- Raw `net`-, `tls`- en `http2`-sockets, native addons en niet-OpenClaw-kindprocessen kunnen proxyrouting op Node-niveau omzeilen, tenzij ze proxyomgevingsvariabelen erven en respecteren. Geforkte OpenClaw-kind-CLI's erven de beheerde proxy-URL en de status van `proxy.loopbackMode`.
- IRC is een raw TCP/TLS-kanaal buiten door operators beheerde forward-proxyrouting. Stel in implementaties die vereisen dat alle egress via die forward-proxy loopt `channels.irc.enabled=false` in, tenzij directe IRC-egress expliciet is goedgekeurd.
- De lokale debugproxy is diagnostische tooling en de directe upstream-forwarding voor proxyverzoeken en CONNECT-tunnels is standaard uitgeschakeld terwijl de beheerde proxymodus actief is; schakel directe forwarding alleen in voor goedgekeurde lokale diagnostiek.
- Lokale WebUI's van gebruikers en lokale modelservers moeten waar nodig worden geallowlist in het operatorproxybeleid; OpenClaw stelt daarvoor geen algemene bypass voor lokale netwerken beschikbaar. De gebundelde Ollama-provider voor geheugen-embeddings is beperkter: deze kan alleen een bewaakt direct pad gebruiken voor de exacte host-lokale loopback-embedding-origin die is afgeleid van de geconfigureerde `baseUrl`, zodat host-lokale embeddings blijven werken wanneer de beheerde proxy de host-loopback niet kan bereiken. LAN-, tailnet-, private-network- en openbare Ollama-embeddinghosts gebruiken nog steeds het beheerde proxypad. `proxy.loopbackMode: "proxy"` stuurt dit Ollama-loopbackverkeer via de beheerde proxy, en `proxy.loopbackMode: "block"` weigert het voordat een verbinding wordt geopend.
- Proxy-bypass voor het Gateway-control plane is bewust beperkt tot `localhost` en letterlijke loopback-IP-URL's. Gebruik `ws://127.0.0.1:18789`, `ws://[::1]:18789` of `ws://localhost:18789` voor lokale directe Gateway-control-plane-verbindingen; andere hostnamen worden gerouteerd als gewoon hostnaamgebaseerd verkeer.
- OpenClaw inspecteert, test of certificeert je proxybeleid niet.
- Behandel wijzigingen in proxybeleid als beveiligingsgevoelige operationele wijzigingen.

| Oppervlak                                                     | Status beheerde proxy                                                                              |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, gangbare WebSocket-clients | Gerouteerd via beheerde proxyhooks wanneer geconfigureerd.                                         |
| Directe APNs HTTP/2                                           | Gerouteerd via de beheerde CONNECT-helper voor APNs.                                               |
| Gateway-control-plane-loopback                                | Alleen direct voor de geconfigureerde lokale loopback-Gateway-URL.                                 |
| Upstream-forwarding van debugproxy                            | Uitgeschakeld terwijl beheerde proxymodus actief is, tenzij expliciet ingeschakeld voor lokale diagnostiek. |
| IRC                                                          | Raw TCP/TLS; niet geproxyd door beheerde HTTP-proxymodus. Uitschakelen tenzij directe IRC-egress is goedgekeurd. |
| Andere raw `net`-, `tls`- of `http2`-clientaanroepen          | Moeten door de raw-socketguard worden geclassificeerd voordat ze landen.                           |
