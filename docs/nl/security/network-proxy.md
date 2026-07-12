---
read_when:
    - U wilt gelaagde beveiliging tegen SSRF- en DNS-rebindingaanvallen
    - Een externe forwardproxy configureren voor runtimeverkeer van OpenClaw
summary: OpenClaw-runtimeverkeer via HTTP en WebSocket routeren via een door de beheerder beheerde filterproxy
title: Netwerkproxy
x-i18n:
    generated_at: "2026-07-12T09:24:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd82684a17a79242891eca69c549c0bfcdd5bde40fa4e791dda7f2b62c473c89
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw kan HTTP- en WebSocket-verkeer tijdens runtime routeren via een door de operator beheerde forward proxy. Dit is optionele gelaagde beveiliging: centrale controle over uitgaand verkeer, sterkere SSRF-bescherming en controleerbaarheid van bestemmingen aan de netwerkgrens. Omdat de proxy de bestemming evalueert op het moment dat de verbinding wordt gemaakt, na DNS-resolutie en onmiddellijk voordat de upstreamverbinding wordt geopend, verkleint deze ook het tijdsvenster waarvan een DNS-rebindingaanval afhankelijk is tussen een eerdere DNS-controle op applicatieniveau en de daadwerkelijke uitgaande verbinding. Eén proxybeleid biedt operators bovendien één plek om bestemmingsregels, netwerksegmentatie, snelheidslimieten of allowlists voor uitgaand verkeer af te dwingen zonder OpenClaw opnieuw te bouwen.

OpenClaw levert, downloadt, start, configureert of certificeert geen proxy. U gebruikt de proxytechnologie die bij uw omgeving past; OpenClaw routeert zijn eigen HTTP- en WebSocket-clients erdoorheen.

## Configuratie

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

U kunt de URL ook via de omgeving instellen terwijl `proxy.enabled: true` in de configuratie blijft staan:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` heeft voorrang op `OPENCLAW_PROXY_URL`. Als `proxy.enabled` `true` is maar er geen geldige URL kan worden bepaald, mislukken beveiligde opdrachten bij het opstarten in plaats van terug te vallen op directe netwerktoegang.

| Sleutel               | Type                                 | Standaardwaarde | Opmerkingen                                                                                                                                        |
| --------------------- | ------------------------------------ | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.enabled`      | boolean                              | niet ingesteld  | Moet `true` zijn om routering te activeren.                                                                                                        |
| `proxy.proxyUrl`     | string                               | niet ingesteld  | URL van een `http://`- of `https://`-forward proxy. In de URL opgenomen inloggegevens worden als gevoelig behandeld en uit momentopnamen/logboeken verwijderd. |
| `proxy.tls.caFile`   | string                               | niet ingesteld  | CA-bundel voor het verifiëren van een `https://`-proxyeindpunt dat door een privé-CA is ondertekend.                                               |
| `proxy.loopbackMode` | `gateway-only` \| `proxy` \| `block` | `gateway-only`  | Bepaalt het omzeilingsgedrag voor local loopback; zie hieronder.                                                                                   |

Sla voor beheerde Gateway-services de URL op in de configuratie, zodat deze een herinstallatie overleeft, in plaats van te vertrouwen op omgevingsvariabelen van het voorgrondproces:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

De terugvaloptie via de omgevingsvariabele `OPENCLAW_PROXY_URL` is het meest geschikt voor uitvoeringen op de voorgrond. Als u deze met een geïnstalleerde service wilt gebruiken, plaatst u de variabele in de permanente omgeving van de service (`$OPENCLAW_STATE_DIR/.env`, standaard `~/.openclaw/.env`) en installeert u de service vervolgens opnieuw, zodat launchd/systemd/Geplande taken de instelling overneemt.

### HTTPS-proxyeindpunt met een privé-CA

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

`proxy.tls.caFile` verifieert het eigen TLS-certificaat van het proxyeindpunt. Het is geen vertrouwensinstelling voor MITM bij de bestemming, geen clientcertificaat en geen vervanging voor het bestemmingsbeleid van de proxy. Gebruik `NODE_EXTRA_CA_CERTS` alleen wanneer het volledige Node-proces vanaf het opstarten een aanvullende CA moet vertrouwen (bijvoorbeeld een bedrijfsbreed TLS-inspectiesysteem dat elk HTTPS-bestemmingscertificaat opnieuw ondertekent) — deze variabele geldt voor het hele proces en moet worden ingesteld voordat Node start. OpenClaw kan deze daarom niet tijdens de uitvoering toepassen zoals bij `proxy.tls.caFile`. Geef voor het vertrouwen van HTTPS-proxyeindpunten de voorkeur aan `proxy.tls.caFile`: dit is beperkt tot beheerde proxyrouting in plaats van het hele proces.

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

## Hoe routering werkt

Met `proxy.enabled: true` en een geldige URL routeren beveiligde runtimeprocessen (`openclaw gateway run`, `openclaw node run`, `openclaw agent --local`) normaal uitgaand HTTP- en WebSocket-verkeer via de proxy:

```text
OpenClaw-proces
  fetch, node:http, node:https, WebSocket-clients  -> operatorproxy -> bestemming
```

Intern installeert OpenClaw [Proxyline](https://github.com/openclaw/proxyline) als routeringsruntime op procesniveau. Dit omvat `fetch`, clients op basis van undici, `node:http`/`node:https`, gangbare WebSocket-clients en door helpers aangemaakte `CONNECT`-tunnels. Ook vervangt het door aanroepers verstrekte Node-HTTP-agents, zodat expliciete agents (waaronder `axios`, `got`, `node-fetch` en vergelijkbare clients op basis van Node-agents) de proxy niet ongemerkt kunnen omzeilen.

Het schema van de proxy-URL beschrijft de verbinding van OpenClaw naar de proxy, niet naar de uiteindelijke bestemming:

- `http://proxy.example:3128` — gewone TCP naar de proxy; OpenClaw verzendt HTTP-proxyverzoeken, waaronder `CONNECT` voor HTTPS-bestemmingen.
- `https://proxy.example:8443` — OpenClaw opent TLS naar de proxy zelf (waarbij het certificaat van de proxy wordt geverifieerd) en verzendt vervolgens HTTP-proxyverzoeken binnen die sessie.

TLS voor de bestemming staat los van TLS voor het proxyeindpunt: voor een HTTPS-bestemming vraagt OpenClaw de proxy altijd om een `CONNECT`-tunnel en start het TLS voor de bestemming via die tunnel.

Terwijl de proxy actief is, wist OpenClaw `no_proxy`/`NO_PROXY`. Deze omzeilingslijsten zijn gebaseerd op bestemmingen; als `localhost` of `127.0.0.1` daarin blijft staan, kunnen SSRF-doelen de proxy volledig omzeilen. Bij het afsluiten herstelt OpenClaw de eerdere proxyomgeving en stelt het de gecachete routeringsstatus opnieuw in.

Sommige plugins beheren een aangepast transport dat eigen proxyconfiguratie nodig heeft, zelfs wanneer routering op procesniveau actief is. De Bot API-client van Telegram gebruikt een eigen HTTP/1-undici-dispatcher en respecteert afzonderlijk de proxyomgevingsvariabelen van het proces plus de terugvaloptie `OPENCLAW_PROXY_URL`.

### Gateway-local-loopbackmodus

Lokale clients voor het Gateway-besturingsvlak maken normaal verbinding met een WebSocket via local loopback, zoals `ws://127.0.0.1:18789`. `proxy.loopbackMode` bepaalt of dit verkeer de beheerde proxy omzeilt:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

| Modus                    | Gedrag                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway-only` (standaard) | OpenClaw registreert de actieve Gateway-autoriteit via local loopback als uitzondering voor een directe verbinding, zodat lokaal Gateway-WebSocket-verkeer zonder de proxy verbinding maakt. Aangepaste local-loopbackpoorten werken omdat de uitzondering op de exact geconfigureerde host/poort is gericht. De meegeleverde browserplugin registreert hetzelfde soort uitzondering voor de exacte lokale CDP-gereedheids- en DevTools-WebSocket-URL's van door OpenClaw gestarte beheerde browsers; de meegeleverde Ollama-provider voor geheugen-embeddings heeft een beperktere, beveiligde directe route voor de exact geconfigureerde hostlokale local-loopbackoorsprong voor embeddings. |
| `proxy`                  | Er worden geen uitzonderingen voor local loopback geregistreerd; Gateway- en Ollama-verkeer via local loopback loopt door de proxy. Een externe proxy moet verkeer terug kunnen routeren naar de local-loopbackservice van de OpenClaw-host (bijvoorbeeld via een bereikbare hostnaam, IP-adres of tunnel) — een standaard externe proxy vertaalt `127.0.0.1`/`localhost` naar zichzelf, niet naar de OpenClaw-host.                                                                                                                                                                                                       |
| `block`                  | OpenClaw weigert Gateway-verbindingen met het besturingsvlak via local loopback en beveiligde Ollama-embeddingverbindingen via local loopback voordat een socket wordt geopend.                                                                                                                                                                                                                                                                                                                                                                                                       |

Het omzeilen van het Gateway-besturingsvlak is beperkt tot `localhost` en letterlijke IP-URL's voor local loopback — gebruik `ws://127.0.0.1:18789`, `ws://[::1]:18789` of `ws://localhost:18789`. Andere hostnamen worden als normaal verkeer gerouteerd.

### Containers

Voor opdrachten met `openclaw --container ...` stuurt OpenClaw `OPENCLAW_PROXY_URL` door naar de op de container gerichte onderliggende CLI wanneer deze variabele is ingesteld. De URL moet vanuit de container bereikbaar zijn — `127.0.0.1` verwijst daar naar de container zelf, niet naar de host. OpenClaw weigert proxy-URL's voor local loopback bij op containers gerichte opdrachten, tenzij u `OPENCLAW_CONTAINER_ALLOW_LOOPBACK_PROXY_URL=1` instelt om deze controle expliciet te omzeilen.

## Verwante proxytermen

- `proxy.enabled` / `proxy.proxyUrl` — uitgaande routering via een forward proxy voor runtimeverkeer. Deze pagina.
- `gateway.auth.mode: "trusted-proxy"` — inkomende, identiteitsbewuste authenticatie via een reverse proxy voor toegang tot de Gateway. Zie [Authenticatie via een vertrouwde proxy](/nl/gateway/trusted-proxy-auth).
- `openclaw proxy` — lokale debugproxy en inspectieprogramma voor vastgelegd verkeer voor ontwikkeling en ondersteuning. Zie [openclaw proxy](/nl/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy` — opt-in voor `web_fetch` waarmee een door de operator beheerde HTTP(S)-proxy uit de omgeving DNS kan omzetten, terwijl standaard strikte DNS-vastzetting en hostnaambeleid behouden blijven. Zie [Web ophalen](/nl/tools/web-fetch#trusted-env-proxy).
- Proxy-instellingen die specifiek zijn voor een kanaal of provider — eigenaarspecifieke overschrijvingen voor één transport. Geef de voorkeur aan de beheerde netwerkproxy voor centrale controle over uitgaand verkeer in de hele runtime.

## De proxy valideren

Het bestemmingsbeleid van de proxy vormt de daadwerkelijke beveiligingsgrens; OpenClaw kan niet controleren of uw proxy de juiste doelen blokkeert. Configureer de proxy om:

- Alleen te binden aan local loopback of een vertrouwde privé-interface die uitsluitend bereikbaar is voor het OpenClaw-proces, de host, container of het serviceaccount.
- Bestemmingen zelf om te zetten en na DNS-resolutie, op het moment dat de verbinding wordt gemaakt, te blokkeren op IP-adres, zowel voor gewone HTTP-verbindingen als voor HTTPS-`CONNECT`-tunnels.
- Omzeiling op basis van bestemmingen te weigeren voor local loopback, privé-, link-local-, metadata-, multicast-, gereserveerde en documentatiereeksen.
- Allowlists met hostnamen te vermijden, tenzij u het DNS-resolutiepad volledig vertrouwt.
- Bestemming, beslissing, status en reden te registreren — nooit aanvraaginhoud, autorisatieheaders, cookies of andere geheimen.
- Het beleid onder versiebeheer te houden en wijzigingen als beveiligingsgevoelig te beoordelen.

Valideer vanaf dezelfde host, container of hetzelfde serviceaccount waarop OpenClaw wordt uitgevoerd:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Met een HTTPS-proxyeindpunt met een privé-CA:

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

| Vlag                     | Doel                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| `--proxy-url <url>`      | Valideer deze URL in plaats van configuratie/omgevingsvariabelen te herleiden.            |
| `--proxy-ca-file <path>` | CA-bundel voor een HTTPS-proxyeindpunt.                                                   |
| `--allowed-url <url>`    | Bestemming die naar verwachting bereikbaar is (herhaalbaar).                             |
| `--denied-url <url>`     | Bestemming die naar verwachting wordt geblokkeerd (herhaalbaar).                         |
| `--apns-reachable`       | Controleer ook of de proxy een rechtstreekse APNs HTTP/2-probe naar de sandbox kan tunnelen. |
| `--apns-authority <url>` | Overschrijf de APNs-authoriteit die met `--apns-reachable` wordt getest.                  |
| `--timeout-ms <ms>`      | Time-out per aanvraag.                                                                   |
| `--json`                 | Machineleesbare uitvoer.                                                                 |

Als `proxy.enabled` niet `true` is en er geen `--proxy-url` is opgegeven, meldt de opdracht een configuratieprobleem in plaats van te valideren; geef `--proxy-url` door voor een eenmalige voorafgaande controle voordat u de configuratie wijzigt.

Zonder `--allowed-url`/`--denied-url` zijn dit de standaardcontroles: `https://example.com/` moet bereikbaar zijn en een tijdelijke local loopback-kanarieserver die de proxy niet mag bereiken, moet worden geblokkeerd. De local loopback-controle slaagt bij een transportfout, of bij een niet-2xx-antwoord zonder het token dat de kanarie per uitvoering gebruikt; de controle mislukt bij een 2xx-antwoord zonder het token (een onverwacht succesvol antwoord van iets anders dan de kanarie) en in het bijzonder bij elk antwoord met het overeenkomende token, omdat dit bewijst dat de proxy daadwerkelijk een local loopback-bestemming heeft doorgestuurd die deze had moeten weigeren. Aangepaste `--denied-url`-doelen hebben geen dergelijk kanarietoken en werken daarom volgens het fail-closed-principe: elk HTTP-antwoord telt als bereikbaar (mislukt) en een transportfout wordt als onbeslist gerapporteerd in plaats van als bewezen geblokkeerd, omdat OpenClaw niet kan bevestigen of uw proxy een bereikbare oorsprong heeft geweigerd of dat er iets anders is misgegaan. `--apns-reachable` verzendt opzettelijk een ongeldig providertoken, zodat een antwoord `403 InvalidProviderToken` geldt als bewijs dat de tunnel Apple heeft bereikt. De opdracht eindigt met `1` bij elke validatiefout; inloggegevens in de proxy-URL worden zowel in tekst- als JSON-uitvoer geredigeerd.

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
    { "kind": "allowed", "url": "https://example.com/", "ok": true, "status": 200 },
    { "kind": "apns", "url": "https://api.sandbox.push.apple.com", "ok": true, "status": 403 }
  ]
}
```

Handmatige controle met `curl` (de openbare aanvraag moet slagen; de local loopback- en metadata-aanvragen moeten door de proxy zelf worden geblokkeerd — alleen `curl` kan geen onderscheid maken tussen een weigering door de proxy en een onbereikbare oorsprong, zoals de ingebouwde kanarie van `openclaw proxy validate` dat wel kan):

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

## Aanbevolen geblokkeerde bestemmingen

Basisblokkeerlijst voor elke forward proxy, firewall of elk uitgaand-verkeersbeleid. OpenClaws eigen SSRF-classificatie bevindt zich in `src/infra/net/ssrf.ts` en `packages/net-policy/src/ip.ts` (`BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, het benchmarkprefix uit RFC 2544 en de verwerking van ingesloten IPv4 voor NAT64/6to4/Teredo/ISATAP/IPv4-mapped-vormen) — nuttige referenties, maar OpenClaw exporteert of handhaaft deze regels niet in uw externe proxy.

| Bereik of host                                                                        | Reden om te blokkeren                                      |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                   | IPv4-local loopback                                        |
| `::1/128`                                                                             | IPv6-local loopback                                        |
| `0.0.0.0/8`, `::/128`                                                                 | Niet-gespecificeerde adressen / adressen van dit netwerk   |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                       | Privénetwerken volgens RFC 1918                            |
| `169.254.0.0/16`, `fe80::/10`                                                         | Link-local, inclusief veelgebruikte cloudmetadatapaden     |
| `169.254.169.254`, `metadata.google.internal`                                         | Cloudmetadataservices                                      |
| `100.64.0.0/10`                                                                       | Gedeelde adresruimte voor carrier-grade NAT                |
| `198.18.0.0/15`, `2001:2::/48`                                                        | Benchmarkbereiken                                          |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32`  | Bereiken voor speciaal gebruik en documentatie             |
| `224.0.0.0/4`, `ff00::/8`                                                             | Multicast                                                  |
| `240.0.0.0/4`                                                                         | Gereserveerd IPv4                                          |
| `fc00::/7`, `fec0::/10`                                                               | Lokale/particuliere IPv6-bereiken                          |
| `100::/64`, `2001:20::/28`                                                            | IPv6-verwerp- en ORCHIDv2-bereiken                         |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                      | NAT64-prefixen met ingesloten IPv4                         |
| `2002::/16`, `2001::/32`                                                              | 6to4 en Teredo met ingesloten IPv4                         |
| `::/96`, `::ffff:0:0/96`                                                              | IPv4-compatibele en aan IPv4 toegewezen IPv6-adressen      |

Voeg eventuele aanvullende metadatahosts of gereserveerde bereiken toe die uw cloudprovider of netwerkplatform documenteert.

## Beperkingen

| Oppervlak                                                    | Status beheerde proxy                                                                                                                                                                |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `fetch`, `node:http`, `node:https`, gangbare WebSocket-clients | Worden via beheerde proxyhooks gerouteerd wanneer deze zijn geconfigureerd.                                                                                                           |
| Rechtstreekse APNs HTTP/2                                    | Wordt via de beheerde APNs-`CONNECT`-helper gerouteerd.                                                                                                                               |
| Local loopback van het Gateway-besturingsvlak                | Alleen rechtstreeks voor de exact geconfigureerde lokale local loopback-URL van de Gateway.                                                                                          |
| Doorsturen naar upstream door debugproxy                     | Uitgeschakeld wanneer de beheerde proxymodus actief is, tenzij dit expliciet voor lokale diagnostiek is ingeschakeld.                                                                 |
| IRC                                                          | Onbewerkte TCP/TLS; niet geproxyd door de beheerde HTTP-proxymodus. Stel `channels.irc.enabled: false` in als uw implementatie vereist dat al het uitgaande verkeer via de forward proxy loopt. |
| Overige onbewerkte clientaanroepen via `net`, `tls` of `http2` | Moeten vóór opname door de beveiliging voor onbewerkte sockets worden geclassificeerd.                                                                                                |

- Dit biedt dekking op procesniveau voor JavaScript HTTP/WebSocket-clients en is geen netwerksandbox op besturingssysteemniveau.
- Onbewerkte `net`-, `tls`- en `http2`-sockets, native add-ons en niet-OpenClaw-subprocessen kunnen routering op Node-niveau omzeilen, tenzij ze proxyomgevingsvariabelen overnemen en respecteren. Afgesplitste OpenClaw-subproces-CLI's nemen de beheerde proxy-URL en de status van `proxy.loopbackMode` over.
- Lokale WebUI's van gebruikers en lokale modelservers vallen niet onder een algemene omzeiling voor het lokale netwerk — voeg ze indien nodig toe aan de toelatingslijst van het proxybeleid van de beheerder. De uitzondering is het beveiligde rechtstreekse pad van de meegeleverde Ollama-provider voor geheugenembeddings, beperkt tot de exacte lokale local loopback-oorsprong van de host uit de geconfigureerde `baseUrl`; Ollama-hosts op LAN, tailnet, privénetwerken en openbare netwerken gebruiken nog steeds de beheerde proxy.
- Rechtstreeks doorsturen naar upstream door de lokale debugproxy (voor proxyaanvragen en `CONNECT`-tunnels) is standaard uitgeschakeld wanneer de beheerde proxymodus actief is; schakel dit alleen in voor goedgekeurde lokale diagnostiek.
- OpenClaw inspecteert, test of certificeert uw proxybeleid niet. Behandel wijzigingen in het proxybeleid als beveiligingsgevoelige operationele wijzigingen.
