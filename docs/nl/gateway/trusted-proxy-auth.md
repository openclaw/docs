---
read_when:
    - OpenClaw uitvoeren achter een identiteitsbewuste proxy
    - Pomerium, Caddy of nginx met OAuth vóór OpenClaw instellen
    - WebSocket 1008-fouten wegens ontbrekende autorisatie oplossen bij reverse-proxyconfiguraties
    - Bepalen waar HSTS en andere HTTP-beveiligingsheaders moeten worden ingesteld
sidebarTitle: Trusted proxy auth
summary: Delegeer Gateway-authenticatie aan een vertrouwde reverse proxy (Pomerium, Caddy, nginx + OAuth)
title: Verificatie via vertrouwde proxy
x-i18n:
    generated_at: "2026-07-12T08:57:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 612070e4872af23c2ac41b529c8b2fa8513bf18fccc053783f55ad00b44e1a5f
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Beveiligingsgevoelige functie.** In deze modus wordt de authenticatie volledig aan je reverse proxy gedelegeerd. Een onjuiste configuratie kan je Gateway blootstellen aan ongeautoriseerde toegang. Lees deze pagina zorgvuldig voordat je deze modus inschakelt.
</Warning>

## Wanneer te gebruiken

- Je voert OpenClaw uit achter een **identiteitsbewuste proxy** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Je proxy handelt alle authenticatie af en geeft de gebruikersidentiteit door via headers.
- Je bevindt je in een Kubernetes- of containeromgeving waarin de proxy het enige pad naar de Gateway is.
- Je krijgt WebSocket-fouten met `1008 unauthorized` omdat browsers geen tokens in WS-payloads kunnen doorgeven.

## Wanneer NIET te gebruiken

- Je proxy authenticeert geen gebruikers (en is slechts een TLS-terminator of loadbalancer).
- Er bestaat een pad naar de Gateway dat de proxy omzeilt (gaten in de firewall, toegang via het interne netwerk).
- Je weet niet zeker of je proxy doorgestuurde headers correct verwijdert of overschrijft.
- Je hebt alleen persoonlijke toegang voor één gebruiker nodig (overweeg in plaats daarvan Tailscale Serve + local loopback).

## Hoe het werkt

<Steps>
  <Step title="Proxy authenticeert de gebruiker">
    Je reverse proxy authenticeert gebruikers (OAuth, OIDC, SAML enzovoort).
  </Step>
  <Step title="Proxy voegt een identiteitsheader toe">
    De proxy voegt een header toe met de geauthenticeerde gebruikersidentiteit (bijvoorbeeld `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway verifieert de vertrouwde bron">
    OpenClaw controleert of het verzoek afkomstig is van een **vertrouwd proxy-IP-adres** (`gateway.trustedProxies`) en niet van het eigen local loopback- of lokale interfaceadres van de Gateway.
  </Step>
  <Step title="Gateway extraheert de identiteit">
    OpenClaw leest de vereiste headers en vervolgens de gebruikersidentiteit uit de geconfigureerde header.
  </Step>
  <Step title="Autoriseren">
    Als alle controles slagen en de gebruiker voldoet aan `allowUsers` (indien ingesteld), wordt het verzoek geautoriseerd.
  </Step>
</Steps>

## Configuratie

```json5
{
  gateway: {
    // Trusted-proxy auth expects the proxy's source IP to be non-loopback by default
    bind: "lan",

    // CRITICAL: Only add your proxy's IP(s) here
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header containing authenticated user identity (required)
        userHeader: "x-forwarded-user",

        // Optional: headers that MUST be present (proxy verification)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Optional: restrict to specific users (empty = allow all)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // Optional: allow a same-host loopback proxy after explicit opt-in
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**Runtime-regels, in volgorde van evaluatie**

1. Het bron-IP-adres van het verzoek moet overeenkomen met `gateway.trustedProxies` (met ondersteuning voor CIDR), anders wordt het afgewezen (`trusted_proxy_untrusted_source`).
2. Verzoeken van een local loopback-bron (`127.0.0.1`, `::1`) worden afgewezen, tenzij `gateway.auth.trustedProxy.allowLoopback = true` en het local loopback-adres ook in `trustedProxies` staat (`trusted_proxy_loopback_source`). Deze controle wordt vóór de headercontroles uitgevoerd, waardoor een local loopback-bron op deze manier faalt, zelfs als vereiste headers eveneens ontbreken.
3. Niet-local loopback-bronnen die overeenkomen met een van de eigen lokale netwerkinterfaceadressen van de Gateway, worden ter bescherming tegen spoofing afgewezen (`trusted_proxy_local_interface_source`). Als het detecteren van interfaces zelf mislukt, wordt het verzoek eveneens afgewezen (`trusted_proxy_local_interface_check_failed`).
4. `requiredHeaders` en `userHeader` moeten aanwezig en niet leeg zijn.
5. Als `allowUsers` niet leeg is, moet deze lijst de geëxtraheerde gebruiker bevatten.

**Bewijs uit doorgestuurde headers heeft voor lokale directe terugval voorrang op de local loopback-lokaliteit.** Als een verzoek via local loopback binnenkomt maar een `Forwarded`-, een `X-Forwarded-*`- of een `X-Real-IP`-header bevat, wordt het door dat bewijs uitgesloten van lokale directe wachtwoordterugval en controle op apparaatidentiteit, ook al slaagt trusted-proxy-authenticatie vanwege local loopback nog steeds niet.

`allowLoopback` vertrouwt lokale processen op de Gateway-host in dezelfde mate als de reverse proxy. Schakel dit alleen in wanneer de Gateway nog steeds door een firewall tegen directe externe toegang is afgeschermd en de lokale proxy door clients aangeleverde identiteitsheaders verwijdert of overschrijft.

Interne Gateway-clients die niet via de reverse proxy lopen, moeten `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` gebruiken, niet trusted-proxy-identiteitsheaders. Control UI-implementaties buiten local loopback vereisen nog steeds een expliciete `gateway.controlUi.allowedOrigins`.
</Warning>

### Configuratiereferentie

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Lijst met te vertrouwen proxy-IP-adressen (of CIDR's). Verzoeken van andere IP-adressen worden afgewezen.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Moet `"trusted-proxy"` zijn.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Naam van de header die de geauthenticeerde gebruikersidentiteit bevat.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Aanvullende headers die aanwezig moeten zijn om het verzoek te vertrouwen.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Toegestane lijst met gebruikersidentiteiten. Leeg betekent dat alle geauthenticeerde gebruikers worden toegestaan.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  Expliciet in te schakelen ondersteuning voor reverse proxy's op dezelfde host via local loopback.
</ParamField>

<Warning>
Schakel `allowLoopback` alleen in wanneer de lokale reverse proxy de beoogde vertrouwensgrens is. Elk lokaal proces dat verbinding kan maken met de Gateway, kan proberen proxy-identiteitsheaders te verzenden. Houd directe toegang tot de Gateway daarom privé voor de host en vereis headers die door de proxy worden beheerd, zoals `x-forwarded-proto`, of een ondertekende bevestigingsheader als je proxy die ondersteunt.
</Warning>

## Koppelingsgedrag van de Control UI

Wanneer `gateway.auth.mode = "trusted-proxy"` actief is en het verzoek de trusted-proxy-controles doorstaat, kunnen WebSocket-sessies van de Control UI verbinding maken zonder identiteit voor apparaatkoppeling.

Gevolgen voor het bereik:

- WebSocket-sessies van de Control UI zonder apparaat maken verbinding, maar ontvangen standaard geen operatorbereiken. OpenClaw wist de aangevraagde bereiklijst naar `[]`, zodat een sessie die niet aan een goedgekeurd gekoppeld apparaat/token is gebonden, niet zelf machtigingen kan declareren.
- Als methoden na een geslaagde WebSocket-verbinding mislukken met `missing scope`, gebruik dan HTTPS zodat de browser een apparaatidentiteit kan genereren en de koppeling kan voltooien. Zie [onveilige HTTP voor de Control UI](/nl/web/control-ui#insecure-http).
- Alleen voor noodgevallen: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` behoudt aangevraagde bereiken, zelfs zonder apparaatidentiteit. Dit is een ernstige verlaging van de beveiliging; draai dit snel terug. Zie [onveilige HTTP voor de Control UI](/nl/web/control-ui#insecure-http).

Beperking van bereiken door de reverse proxy: als je proxy `x-openclaw-scopes` meestuurt bij het WebSocket-upgradeverzoek van de Control UI, beperkt OpenClaw de sessiebereiken tot de doorsnede van de aangevraagde en gedeclareerde bereiken. Deze header verleent geen bereiken; deze beperkt alleen wat de sessie kan bevatten.

Gevolgen:

- Koppeling is in deze modus niet langer de primaire toegangspoort voor de Control UI.
- Het authenticatiebeleid van je reverse proxy en `allowUsers` vormen de effectieve toegangscontrole.
- Beperk inkomend Gateway-verkeer uitsluitend tot vertrouwde proxy-IP-adressen (`gateway.trustedProxies` + firewall).

Aangepaste WebSocket-clients zijn geen Control UI-sessies. `gateway.controlUi.dangerouslyDisableDeviceAuth` verleent geen bereiken aan willekeurige clients met `client.mode: "backend"` of clients met een CLI-vorm. Aangepaste automatisering moet apparaatidentiteit/koppeling gebruiken, het gereserveerde directe lokale backend-hulppad `client.id: "gateway-client"`, of de [Plugin voor HTTP-RPC voor beheerders](/nl/plugins/admin-http-rpc) wanneer een HTTP-verzoek/antwoord-interface beter past.

## Header voor operatorbereiken

Trusted-proxy-authenticatie is een HTTP-modus die **een identiteit bevat**, zodat aanroepers bij HTTP-API-verzoeken optioneel operatorbereiken kunnen declareren met `x-openclaw-scopes`.

Opmerking: WebSocket-bereiken worden bepaald door de Gateway-protocolhandshake en de binding aan de apparaatidentiteit. Bij WebSocket-upgradeverzoeken van de Control UI vormt `x-openclaw-scopes` alleen een bovengrens voor de onderhandelde sessiebereiken en verleent deze geen bereiken. Zie [Koppelingsgedrag van de Control UI](#control-ui-pairing-behavior).

Voorbeelden:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Gedrag:

- Wanneer de header aanwezig is, respecteert OpenClaw de gedeclareerde verzameling bereiken.
- Wanneer de header aanwezig maar leeg is, declareert het verzoek **geen** operatorbereiken.
- Wanneer de header ontbreekt, vallen normale HTTP-API's die een identiteit bevatten terug op de standaardverzameling operatorbereiken (`operator.admin`, `operator.read`, `operator.write`, `operator.approvals`, `operator.pairing`, `operator.talk.secrets`).
- Met Gateway-authenticatie beveiligde **HTTP-routes van Plugins** zijn standaard beperkter: wanneer `x-openclaw-scopes` ontbreekt, valt hun runtime-bereik alleen terug op `operator.write`.
- HTTP-verzoeken vanuit een browserorigin moeten nog steeds voldoen aan `gateway.controlUi.allowedOrigins` (of de bewust gekozen terugvalmodus voor de Host-header), zelfs nadat trusted-proxy-authenticatie is geslaagd.

Praktische regel: stuur `x-openclaw-scopes` expliciet wanneer je een trusted-proxy-verzoek beperkter wilt maken dan de standaardwaarden, of wanneer een met Gateway-authenticatie beveiligde Plugin-route iets krachtigers nodig heeft dan het schrijfbereik.

## TLS-beëindiging en HSTS

Gebruik één TLS-beëindigingspunt en pas HSTS daar toe.

<Tabs>
  <Tab title="TLS-beëindiging bij de proxy (aanbevolen)">
    Wanneer je reverse proxy HTTPS afhandelt voor `https://control.example.com`, stel je `Strict-Transport-Security` bij de proxy in voor dat domein.

    - Geschikt voor implementaties die vanaf internet toegankelijk zijn.
    - Houdt het certificaat en het beleid voor HTTP-versterking op één plek.
    - OpenClaw kan achter de proxy op HTTP via local loopback blijven.

    Voorbeeldwaarde voor de header:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="TLS-beëindiging bij de Gateway">
    Als OpenClaw zelf rechtstreeks HTTPS aanbiedt (zonder proxy die TLS beëindigt), stel je het volgende in:

    ```json5
    {
      gateway: {
        tls: { enabled: true },
        http: {
          securityHeaders: {
            strictTransportSecurity: "max-age=31536000; includeSubDomains",
          },
        },
      },
    }
    ```

    `strictTransportSecurity` accepteert een tekenreeks als headerwaarde, of `false` om dit expliciet uit te schakelen.

  </Tab>
</Tabs>

### Richtlijnen voor uitrol

- Begin met een korte maximale leeftijd (bijvoorbeeld `max-age=300`) terwijl je het verkeer valideert.
- Verhoog deze pas naar waarden met een lange levensduur (bijvoorbeeld `max-age=31536000`) wanneer het vertrouwen groot is.
- Voeg `includeSubDomains` alleen toe als elk subdomein gereed is voor HTTPS.
- Gebruik preload alleen als je bewust voldoet aan de preloadvereisten voor je volledige verzameling domeinen.
- Lokale ontwikkeling uitsluitend via local loopback heeft geen voordeel van HSTS.

## Voorbeelden van proxyconfiguraties

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium geeft de identiteit door in `x-pomerium-claim-email` (of andere claimheaders) en een JWT in `x-pomerium-jwt-assertion`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Pomerium's IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-pomerium-claim-email",
            requiredHeaders: ["x-pomerium-jwt-assertion"],
          },
        },
      },
    }
    ```

    Configuratiefragment voor Pomerium:

    ```yaml
    routes:
      - from: https://openclaw.example.com
        to: http://openclaw-gateway:18789
        policy:
          - allow:
              or:
                - email:
                    is: nick@example.com
        pass_identity_headers: true
    ```

  </Accordion>
  <Accordion title="Caddy met OAuth">
    Caddy kan met de Plugin `caddy-security` gebruikers authenticeren en identiteitsheaders doorgeven.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP-adres van Caddy/sidecar-proxy
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```

    Caddyfile-fragment:

    ```caddy
    openclaw.example.com {
        authenticate with oauth2_provider
        authorize with policy1

        reverse_proxy openclaw:18789 {
            header_up X-Forwarded-User {http.auth.user.email}
        }
    }
    ```

  </Accordion>
  <Accordion title="nginx + oauth2-proxy">
    oauth2-proxy verifieert gebruikers en geeft de identiteit door in `x-auth-request-email`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP-adres van nginx/oauth2-proxy
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-auth-request-email",
          },
        },
      },
    }
    ```

    nginx-configuratiefragment:

    ```nginx
    location / {
        auth_request /oauth2/auth;
        auth_request_set $user $upstream_http_x_auth_request_email;

        proxy_pass http://openclaw:18789;
        proxy_set_header X-Auth-Request-Email $user;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    ```

  </Accordion>
  <Accordion title="Traefik met doorgestuurde authenticatie">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // IP-adres van Traefik-container
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Gemengde tokenconfiguratie

Het starten van de Gateway wordt bij authenticatie via een vertrouwde proxy geweigerd als er ook een gedeeld token is geconfigureerd (`gateway.auth.token` of `OPENCLAW_GATEWAY_TOKEN`). Deze twee sluiten elkaar uit, omdat een gedeeld token aan aanroepers op dezelfde host de mogelijkheid zou geven zich via een volledig ander pad te verifiëren dan met de door de proxy geverifieerde identiteit die deze modus moet afdwingen.

Als het starten mislukt met een fout zoals `gateway auth mode is trusted-proxy, but a shared token is also configured`:

- Verwijder het gedeelde token wanneer u de modus met een vertrouwde proxy gebruikt, of
- Stel `gateway.auth.mode` in op `"token"` als u authenticatie op basis van tokens wilt gebruiken.

Identiteitsheaders van vertrouwde proxy's via local loopback worden nog steeds standaard geweigerd: aanroepers op dezelfde host worden niet stilzwijgend geverifieerd als proxygebruikers. Interne aanroepers van OpenClaw die de proxy omzeilen, kunnen zich in plaats daarvan verifiëren met `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Terugvallen op tokens wordt in de modus met een vertrouwde proxy bewust niet ondersteund.

## Beveiligingscontrolelijst

Controleer het volgende voordat u authenticatie via een vertrouwde proxy inschakelt:

- [ ] **De proxy is het enige pad**: De Gateway-poort is met een firewall afgeschermd van alles behalve uw proxy.
- [ ] **trustedProxies is minimaal**: Alleen de daadwerkelijke IP-adressen van uw proxy's, geen volledige subnetten.
- [ ] **Een proxybron via local loopback is een bewuste keuze**: Authenticatie via een vertrouwde proxy wordt standaard geweigerd voor aanvragen uit local loopback, tenzij `gateway.auth.trustedProxy.allowLoopback` expliciet is ingeschakeld voor een proxy op dezelfde host.
- [ ] **De proxy verwijdert headers**: Uw proxy overschrijft `x-forwarded-*`-headers van clients in plaats van ze aan te vullen.
- [ ] **TLS-beëindiging**: Uw proxy handelt TLS af; gebruikers maken verbinding via HTTPS.
- [ ] **allowedOrigins is expliciet**: Een Control UI buiten local loopback gebruikt expliciete `gateway.controlUi.allowedOrigins`.
- [ ] **allowUsers is ingesteld** (aanbevolen): Beperk de toegang tot bekende gebruikers in plaats van elke geverifieerde gebruiker toe te laten.
- [ ] **Geen gemengde tokenconfiguratie**: Stel niet zowel `gateway.auth.token` als `gateway.auth.mode: "trusted-proxy"` in.
- [ ] **Lokale terugval via wachtwoord is afgeschermd**: Als u `gateway.auth.password` configureert voor interne rechtstreekse aanroepers, schermt u de Gateway-poort met een firewall af zodat externe clients die de proxy omzeilen deze niet rechtstreeks kunnen bereiken.

## Beveiligingsaudit

`openclaw security audit` markeert authenticatie via een vertrouwde proxy met de ernst **kritiek**. Dit is opzettelijk; het herinnert u eraan dat u de beveiliging delegeert aan uw proxyconfiguratie.

De audit controleert op:

- Algemene waarschuwing/kritieke herinnering `gateway.trusted_proxy_auth`.
- Ontbrekende configuratie van `trustedProxies`.
- Ontbrekende configuratie van `userHeader`.
- Lege `allowUsers` (staat elke geverifieerde gebruiker toe).
- Ingeschakelde `allowLoopback` voor proxybronnen op dezelfde host.

Afzonderlijke bevindingen die niet specifiek zijn voor vertrouwde proxy's gelden ook wanneer de Control UI toegankelijk is: ontbrekende `gateway.controlUi.allowedOrigins` of jokertekens daarin, en terugval op de oorsprong uit de Host-header.

## Problemen oplossen

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    De aanvraag kwam niet van een IP-adres in `gateway.trustedProxies`. Controleer:

    - Is het IP-adres van de proxy correct? (IP-adressen van Docker-containers kunnen veranderen.)
    - Staat er een loadbalancer vóór uw proxy?
    - Gebruik `docker inspect` of `kubectl get pods -o wide` om de daadwerkelijke IP-adressen te vinden.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw heeft een aanvraag via een vertrouwde proxy uit local loopback geweigerd.

    Controleer:

    - Maakt de proxy verbinding vanaf `127.0.0.1` / `::1`?
    - Probeert u authenticatie via een vertrouwde proxy te gebruiken met een reverse proxy via local loopback op dezelfde host?

    Oplossing:

    - Gebruik bij voorkeur authenticatie met een token/wachtwoord voor interne clients op dezelfde host die niet via de proxy gaan, of
    - Leid het verkeer via een vertrouwd proxyadres buiten local loopback en houd dat IP-adres opgenomen in `gateway.trustedProxies`, of
    - Stel voor een bewust gebruikte reverse proxy op dezelfde host `gateway.auth.trustedProxy.allowLoopback = true` in, houd het local loopback-adres opgenomen in `gateway.trustedProxies` en zorg ervoor dat de proxy identiteitsheaders verwijdert of overschrijft.

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    Het bron-IP-adres van de aanvraag kwam overeen met een van de eigen netwerkinterfaceadressen buiten local loopback van de Gateway-host (niet met de proxy), als bescherming tegen vervalst verkeer vanaf dezelfde host op tailnets of Docker-bridgenetwerken. `..._check_failed` betekent dat het detecteren van interfaces zelf een fout opleverde, zodat OpenClaw de aanvraag standaard weigert.

    Controleer:

    - Verstuurt een proces op de Gateway-host zelf rechtstreeks identiteitsheaders en omzeilt het daarmee de proxy?
    - Draait de proxy in dezelfde netwerknaamruimte als de Gateway, met een IP-adres dat ook als lokale interface wordt weergegeven?

    Oplossing: leid proxyverkeer via een adres dat niet ook lokaal aan de Gateway-host is gebonden, of gebruik `allowLoopback` alleen voor een echte proxyconfiguratie op dezelfde host.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    De gebruikersheader was leeg of ontbrak. Controleer:

    - Is uw proxy geconfigureerd om identiteitsheaders door te geven?
    - Is de headernaam correct? (hoofdletterongevoelig, maar de spelling moet kloppen)
    - Is de gebruiker daadwerkelijk bij de proxy geverifieerd?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Een vereiste header ontbrak. Controleer:

    - Uw proxyconfiguratie voor die specifieke headers.
    - Of headers ergens in de keten worden verwijderd.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    De gebruiker is geverifieerd, maar staat niet in `allowUsers`. Voeg de gebruiker toe of verwijder de toestemmingslijst.
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    `gateway.auth.mode` is `"trusted-proxy"`, maar `gateway.trustedProxies` is leeg, of `gateway.auth.trustedProxy` zelf ontbreekt. Elke aanvraag wordt geweigerd totdat beide zijn ingesteld.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Authenticatie via een vertrouwde proxy is geslaagd, maar de browserheader `Origin` voldeed niet aan de oorsprongscontroles van de Control UI.

    Controleer:

    - `gateway.controlUi.allowedOrigins` bevat de exacte oorsprong van de browser.
    - U vertrouwt niet op jokertekenoorsprongen, tenzij u bewust alles wilt toestaan.
    - Als u bewust de terugvalmodus via de Host-header gebruikt, is `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` doelbewust ingesteld.

  </Accordion>
  <Accordion title="Verbinding slaagt, maar methoden melden ontbrekend bereik">
    De WebSocket maakt verbinding, maar `chat.history`, `sessions.list` of
    `models.list` mislukt met `missing scope: operator.read`.

    Veelvoorkomende oorzaken:

    - Control UI-sessie zonder apparaat: authenticatie via een vertrouwde proxy kan de WebSocket-verbinding zonder apparaatidentiteit toelaten, maar OpenClaw verwijdert bewust de bereiken van sessies zonder apparaat.
    - Aangepaste backendclient: `gateway.controlUi.dangerouslyDisableDeviceAuth` is beperkt tot de Control UI en kent geen bereiken toe aan willekeurige WebSocket-clients voor backends of met een CLI-vorm.
    - Te beperkte `x-openclaw-scopes`: als uw proxy deze header injecteert bij de WebSocket-upgradeaanvraag van de Control UI, worden de sessiebereiken beperkt tot die verzameling. Een lege headerwaarde resulteert in geen bereiken.

    Oplossing:

    - Gebruik voor de Control UI HTTPS, zodat de browser een apparaatidentiteit kan genereren en de koppeling kan voltooien.
    - Gebruik voor aangepaste automatisering apparaatidentiteit/koppeling, het gereserveerde rechtstreekse lokale backendhelperpad `gateway-client`, of [HTTP-RPC voor beheerders](/nl/plugins/admin-http-rpc).
    - Gebruik `gateway.controlUi.dangerouslyDisableDeviceAuth: true` alleen als tijdelijke noodoplossing voor de Control UI.

  </Accordion>
  <Accordion title="WebSocket mislukt nog steeds">
    Zorg ervoor dat uw proxy:

    - WebSocket-upgrades ondersteunt (`Upgrade: websocket`, `Connection: upgrade`).
    - De identiteitsheaders doorgeeft bij WebSocket-upgradeaanvragen (niet alleen bij HTTP).
    - Geen afzonderlijk authenticatiepad voor WebSocket-verbindingen heeft.

  </Accordion>
</AccordionGroup>

## Migratie vanaf tokenauthenticatie

<Steps>
  <Step title="De proxy configureren">
    Configureer uw proxy om gebruikers te verifiëren en headers door te geven.
  </Step>
  <Step title="De proxy afzonderlijk testen">
    Test de proxyconfiguratie afzonderlijk (curl met headers).
  </Step>
  <Step title="De OpenClaw-configuratie bijwerken">
    Werk de OpenClaw-configuratie bij met authenticatie via een vertrouwde proxy.
  </Step>
  <Step title="De Gateway opnieuw starten">
    Start de Gateway opnieuw.
  </Step>
  <Step title="WebSocket testen">
    Test WebSocket-verbindingen vanuit de Control UI.
  </Step>
  <Step title="Audit">
    Voer `openclaw security audit` uit en beoordeel de bevindingen.
  </Step>
</Steps>

## Gerelateerd

- [Configuratie](/nl/gateway/configuration) — configuratiereferentie
- [Operatorbereiken](/nl/gateway/operator-scopes) — rollen, bereiken en goedkeuringscontroles
- [Externe toegang](/nl/gateway/remote) — andere patronen voor externe toegang
- [Beveiliging](/nl/gateway/security) — volledige beveiligingsgids
- [Tailscale](/nl/gateway/tailscale) — eenvoudiger alternatief voor toegang die beperkt is tot het tailnet
