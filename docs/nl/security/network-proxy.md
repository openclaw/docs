---
read_when:
    - U wilt gelaagde verdediging tegen SSRF- en DNS-rebinding-aanvallen
    - Een externe doorstuurproxy configureren voor OpenClaw-runtimeverkeer
summary: HTTP- en WebSocket-verkeer van OpenClaw tijdens uitvoering via een door de beheerder beheerde filterproxy routeren
title: Netwerkproxy
x-i18n:
    generated_at: "2026-05-06T18:00:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: aed1cd94ce6a32cd8a3f6c7e579011992af87c1ccc40eb53efaa83b020a6792b
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw kan runtime-HTTP- en WebSocket-verkeer routeren via een door de operator beheerde forward proxy. Dit is optionele defense in depth voor deployments die centrale egress-controle, sterkere SSRF-bescherming en betere controleerbaarheid van het netwerk willen.

OpenClaw levert, downloadt, start, configureert of certificeert geen proxy. Je gebruikt de proxytechnologie die bij je omgeving past, en OpenClaw routeert normale proceslokale HTTP- en WebSocket-clients erdoorheen.

## Waarom een proxy gebruiken

Een proxy geeft operators één netwerkcontrolepunt voor uitgaand HTTP- en WebSocket-verkeer. Dat kan ook buiten SSRF-hardening nuttig zijn:

- Centraal beleid: onderhoud één egress-beleid in plaats van erop te vertrouwen dat elke HTTP-callsite van de applicatie de netwerkregels goed toepast.
- Controles tijdens verbinden: beoordeel de bestemming na DNS-resolutie en direct voordat de proxy de upstreamverbinding opent.
- Verdediging tegen DNS-rebinding: verklein het gat tussen een DNS-controle op applicatieniveau en de daadwerkelijke uitgaande verbinding.
- Bredere JavaScript-dekking: routeer gewone `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch en vergelijkbare clients via hetzelfde pad.
- Controleerbaarheid: log toegestane en geweigerde bestemmingen aan de egress-grens.
- Operationele controle: dwing bestemmingsregels, netwerksegmentatie, snelheidslimieten of uitgaande allowlists af zonder OpenClaw opnieuw te bouwen.

Proxyroutering is een procesniveau-guardrail voor normale HTTP- en WebSocket-egress. Het geeft operators een fail-closed pad om ondersteunde JavaScript-HTTP-clients via hun eigen filterproxy te routeren, maar het is geen netwerk-sandbox op OS-niveau en laat OpenClaw het bestemmingsbeleid van de proxy niet certificeren.

## Hoe OpenClaw verkeer routeert

Wanneer `proxy.enabled=true` en een proxy-URL is geconfigureerd, routeren beschermde runtimeprocessen zoals `openclaw gateway run`, `openclaw node run` en `openclaw agent --local` normale HTTP- en WebSocket-egress via de geconfigureerde proxy:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Het openbare contract is het routeringsgedrag, niet de interne Node-hooks die worden gebruikt om het te implementeren. OpenClaw Gateway control-plane WebSocket-clients gebruiken een smal direct pad voor local loopback Gateway RPC-verkeer wanneer de Gateway-URL `localhost` of een letterlijk loopback-IP zoals `127.0.0.1` of `[::1]` gebruikt. Dat control-plane-pad moet loopback-Gateways kunnen bereiken, zelfs wanneer de operatorproxy loopbackbestemmingen blokkeert. Normale runtime-HTTP- en WebSocket-verzoeken gebruiken nog steeds de geconfigureerde proxy.

Intern gebruikt OpenClaw twee routeringshooks op procesniveau voor deze functie:

- Undici-dispatcherroutering dekt `fetch`, clients op basis van undici en transports die hun eigen undici-dispatcher leveren.
- `global-agent`-routering dekt Node core-aanroepers van `node:http` en `node:https`, waaronder veel bibliotheken die bovenop `http.request`, `https.request`, `http.get` en `https.get` zijn gebouwd. Beheerde proxymodus forceert die globale agent zodat expliciete Node HTTP-agents de operatorproxy niet per ongeluk omzeilen.

Sommige plugins bezitten aangepaste transports die expliciete proxybedrading nodig hebben, zelfs wanneer routering op procesniveau bestaat. De Bot API-transportlaag van Telegram gebruikt bijvoorbeeld zijn eigen HTTP/1-undici-dispatcher en respecteert daarom de procesproxy-env plus de beheerde `OPENCLAW_PROXY_URL`-fallback in dat eigenaarspecifieke transportpad.

De proxy-URL zelf moet `http://` gebruiken. HTTPS-bestemmingen worden nog steeds ondersteund via de proxy met HTTP `CONNECT`; dit betekent alleen dat OpenClaw een gewone HTTP-forward-proxylistener verwacht, zoals `http://127.0.0.1:3128`.

Terwijl de proxy actief is, wist OpenClaw `no_proxy`, `NO_PROXY` en `GLOBAL_AGENT_NO_PROXY`. Die bypasslijsten zijn gebaseerd op bestemming, dus als `localhost` of `127.0.0.1` daarin blijft staan, zouden risicovolle SSRF-doelen de filterproxy kunnen overslaan.

Bij afsluiten herstelt OpenClaw de eerdere proxyomgeving en reset het gecachte procesrouteringsstatus.

## Gerelateerde proxytermen

- `proxy.enabled` / `proxy.proxyUrl`: uitgaande forward-proxyroutering voor OpenClaw runtime-egress. Deze pagina documenteert die functie.
- `gateway.auth.mode: "trusted-proxy"`: inkomende identiteitsbewuste reverse-proxy-authenticatie voor Gateway-toegang. Zie [Vertrouwde-proxy-authenticatie](/nl/gateway/trusted-proxy-auth).
- `openclaw proxy`: lokale debugproxy en capture-inspector voor ontwikkeling en support. Zie [openclaw proxy](/nl/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: opt-in voor `web_fetch` om een door de operator gecontroleerde HTTP(S)-env-proxy DNS te laten oplossen, terwijl standaard strikte DNS-pinning en hostnaambelied behouden blijven. Zie [Web fetch](/nl/tools/web-fetch#trusted-env-proxy).
- Kanaal- of providerspecifieke proxyinstellingen: eigenaarspecifieke overrides voor een bepaalde transportlaag. Geef de voorkeur aan de beheerde netwerkproxy wanneer het doel centrale egress-controle over de runtime is.

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

### Gateway Loopback-modus

Lokale Gateway control-plane-clients verbinden meestal met een loopback-WebSocket zoals `ws://127.0.0.1:18789`. Gebruik `proxy.loopbackMode` om te kiezen hoe dat verkeer zich gedraagt terwijl de beheerde proxy actief is:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (standaard): OpenClaw registreert de Gateway-loopback-authority in de actieve `global-agent` `NO_PROXY`-controller, zodat lokaal Gateway-WebSocket-verkeer direct kan verbinden. Aangepaste loopback-Gateway-poorten werken omdat de host en poort van de actieve Gateway-URL worden geregistreerd.
- `proxy`: OpenClaw registreert geen Gateway-loopback-`NO_PROXY`-authority, dus lokaal Gateway-verkeer wordt via de beheerde proxy verzonden. Als de proxy extern is, moet deze speciale routering bieden voor de loopbackservice van de OpenClaw-host, zoals mapping naar een door de proxy bereikbare hostnaam, IP of tunnel. Standaard externe proxy's lossen `127.0.0.1` en `localhost` op vanaf de proxyhost, niet vanaf de OpenClaw-host.
- `block`: OpenClaw weigert loopback-Gateway-control-plane-verbindingen voordat een socket wordt geopend.

Als `enabled=true` maar er geen geldige proxy-URL is geconfigureerd, mislukken beschermde opdrachten tijdens het opstarten in plaats van terug te vallen op directe netwerktoegang.

Voor beheerde gatewayservices die met `openclaw gateway start` worden gestart, heeft het de voorkeur de URL in de configuratie op te slaan:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

De omgevingsfallback is het meest geschikt voor voorgronduitvoeringen. Als je deze gebruikt met een geïnstalleerde service, plaats `OPENCLAW_PROXY_URL` dan in de duurzame omgeving van de service, zoals `$OPENCLAW_STATE_DIR/.env` of `~/.openclaw/.env`, en installeer de service daarna opnieuw zodat launchd, systemd of Scheduled Tasks de gateway met die waarde start.

Voor `openclaw --container ...`-opdrachten geeft OpenClaw `OPENCLAW_PROXY_URL` door aan de child CLI die op de container is gericht wanneer deze is ingesteld. De URL moet bereikbaar zijn vanuit de container; `127.0.0.1` verwijst naar de container zelf, niet naar de host. OpenClaw weigert loopback-proxy-URL's voor containergerichte opdrachten, tenzij je die veiligheidscontrole expliciet overschrijft.

## Proxyvereisten

Het proxybeleid is de beveiligingsgrens. OpenClaw kan niet verifiëren dat de proxy de juiste doelen blokkeert.

Configureer de proxy om:

- Alleen te binden aan loopback of een vertrouwde privé-interface.
- Toegang te beperken zodat alleen het OpenClaw-proces, de host, container of serviceaccount deze kan gebruiken.
- Bestemmingen zelf op te lossen en bestemmings-IP's na DNS-resolutie te blokkeren.
- Beleid toe te passen tijdens het verbinden voor zowel gewone HTTP-verzoeken als HTTPS-`CONNECT`-tunnels.
- Bestemmingsgebaseerde bypasses te weigeren voor loopback-, privé-, link-local-, metadata-, multicast-, gereserveerde of documentatiereeksen.
- Hostnaam-allowlists te vermijden tenzij je het DNS-resolutiepad volledig vertrouwt.
- Bestemming, beslissing, status en reden te loggen zonder request bodies, autorisatieheaders, cookies of andere geheimen te loggen.
- Proxybeleid onder versiebeheer te houden en wijzigingen te beoordelen als beveiligingsgevoelige configuratie.

## Aanbevolen geblokkeerde bestemmingen

Gebruik deze denylist als startpunt voor elk forward proxy-, firewall- of egress-beleid.

De classifierlogica op OpenClaw-applicatieniveau staat in `src/infra/net/ssrf.ts` en `src/shared/net/ip.ts`. De relevante parity-hooks zijn `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` en de verwerking van ingebedde IPv4-sentinels voor NAT64, 6to4, Teredo, ISATAP en IPv4-mapped vormen. Die bestanden zijn nuttige referenties bij het onderhouden van extern proxybeleid, maar OpenClaw exporteert of handhaaft die regels niet automatisch in je proxy.

| Bereik of host                                                                       | Waarom blokkeren                                    |
| ------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4-loopback                                       |
| `::1/128`                                                                            | IPv6-loopback                                       |
| `0.0.0.0/8`, `::/128`                                                                | Niet-gespecificeerde en this-network-adressen       |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918-privénetwerken                             |
| `169.254.0.0/16`, `fe80::/10`                                                        | Link-local-adressen en gangbare cloudmetadatapaden |
| `169.254.169.254`, `metadata.google.internal`                                        | Cloudmetadataservices                              |
| `100.64.0.0/10`                                                                      | Gedeelde adresruimte voor carrier-grade NAT         |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Benchmarkingreeksen                                |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Reeksen voor speciaal gebruik en documentatie       |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                           |
| `240.0.0.0/4`                                                                        | Gereserveerde IPv4                                  |
| `fc00::/7`, `fec0::/10`                                                              | Lokale/privé-IPv6-reeksen                          |
| `100::/64`, `2001:20::/28`                                                           | IPv6-discard- en ORCHIDv2-reeksen                  |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | NAT64-prefixen met ingebedde IPv4                  |
| `2002::/16`, `2001::/32`                                                             | 6to4 en Teredo met ingebedde IPv4                  |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-compatibele en IPv4-mapped IPv6               |

Als je cloudprovider of netwerkplatform aanvullende metadatahosts of gereserveerde reeksen documenteert, voeg die dan ook toe.

## Validatie

Valideer de proxy vanaf dezelfde host, container of serviceaccount waarop OpenClaw draait:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Standaard controleert de opdracht, wanneer er geen aangepaste bestemmingen zijn opgegeven, of `https://example.com/` slaagt en start deze een tijdelijke loopback-canary die de proxy niet mag bereiken. De standaard geweigerde controle slaagt wanneer de proxy een niet-2xx-weigeringsrespons retourneert of de canary blokkeert met een transportfout; de controle mislukt als een succesvolle respons de canary bereikt. Als er geen proxy is ingeschakeld en geconfigureerd, meldt de validatie een configuratieprobleem; gebruik `--proxy-url` voor een eenmalige preflight voordat je de configuratie wijzigt. Gebruik `--allowed-url` en `--denied-url` om implementatiespecifieke verwachtingen te testen. Voeg `--apns-reachable` toe om ook te verifiëren dat directe APNs HTTP/2-levering een CONNECT-tunnel via de proxy kan openen en een sandbox-APNs-respons kan ontvangen; de probe gebruikt opzettelijk een ongeldig providertoken, dus `403 InvalidProviderToken` wordt verwacht en telt als bereikbaar. Aangepaste geweigerde bestemmingen zijn fail-closed: elke HTTP-respons betekent dat de bestemming via de proxy bereikbaar was, en elke transportfout wordt als onbeslist gerapporteerd omdat OpenClaw niet kan bewijzen dat de proxy een bereikbare origin heeft geblokkeerd. Bij een validatiefout sluit de opdracht af met code 1.

Gebruik `--json` voor automatisering. De JSON-uitvoer bevat het algehele resultaat, de effectieve bron van de proxyconfiguratie, eventuele configuratiefouten en elke bestemmingscontrole. Proxy-URL-referenties worden geredigeerd in tekst- en JSON-uitvoer:

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

De openbare aanvraag zou moeten slagen. De loopback- en metadata-aanvragen zouden door de proxy moeten worden geblokkeerd. Voor `openclaw proxy validate` kan de ingebouwde loopback-canary een proxyweigering onderscheiden van een bereikbare origin. Aangepaste `--denied-url`-controles hebben die canary niet, dus behandel zowel HTTP-responsen als dubbelzinnige transportfouten als validatiefouten, tenzij je proxy een implementatiespecifiek weigeringssignaal blootlegt dat je afzonderlijk kunt verifiëren.

Schakel vervolgens OpenClaw-proxyrouting in:

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
- Gateway-loopback-control-plane-verkeer gaat standaard via een directe lokale bypass met `proxy.loopbackMode: "gateway-only"`. OpenClaw implementeert die bypass door de actieve Gateway-loopback-authority te registreren in de beheerde `global-agent` `NO_PROXY`-controller. Operators kunnen `proxy.loopbackMode: "proxy"` instellen om Gateway-loopback-verkeer via de beheerde proxy te sturen, of `proxy.loopbackMode: "block"` om loopback-Gateway-verbindingen te weigeren. Zie [Gateway-loopbackmodus](#gateway-loopback-mode) voor de kanttekening over externe proxy's.
- Ruwe `net`-, `tls`- en `http2`-sockets, native addons en niet-OpenClaw-childprocessen kunnen proxy-routing op Node-niveau omzeilen, tenzij ze proxy-omgevingsvariabelen overnemen en respecteren. Geforkte OpenClaw-child-CLI's nemen de beheerde proxy-URL en de status van `proxy.loopbackMode` over.
- IRC is een ruw TCP/TLS-kanaal buiten door operators beheerde forward-proxy-routing. Stel in implementaties die vereisen dat alle egress via die forward-proxy verloopt `channels.irc.enabled=false` in, tenzij directe IRC-egress expliciet is goedgekeurd.
- De lokale debugproxy is diagnostische tooling en de directe upstream-forwarding voor proxy-aanvragen en CONNECT-tunnels is standaard uitgeschakeld terwijl de beheerde proxymodus actief is; schakel directe forwarding alleen in voor goedgekeurde lokale diagnostiek.
- Lokale WebUI's van gebruikers en lokale modelservers moeten waar nodig worden toegestaan in het proxybeleid van de operator; OpenClaw stelt geen algemene bypass voor het lokale netwerk voor hen beschikbaar.
- Bypass van de Gateway-control-plane-proxy is bewust beperkt tot `localhost` en letterlijke loopback-IP-URL's. Gebruik `ws://127.0.0.1:18789`, `ws://[::1]:18789` of `ws://localhost:18789` voor lokale directe Gateway-control-plane-verbindingen; andere hostnamen worden gerouteerd zoals normaal hostnaamgebaseerd verkeer.
- OpenClaw inspecteert, test of certificeert je proxybeleid niet.
- Behandel wijzigingen in proxybeleid als beveiligingsgevoelige operationele wijzigingen.
