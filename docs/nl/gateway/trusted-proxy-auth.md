---
read_when:
    - OpenClaw uitvoeren achter een identity-aware proxy
    - Pomerium, Caddy of nginx met OAuth voor OpenClaw instellen
    - WebSocket 1008-fouten voor niet-geautoriseerde toegang oplossen bij reverse-proxyconfiguraties
    - Bepalen waar HSTS en andere HTTP-hardeningheaders moeten worden ingesteld
sidebarTitle: Trusted proxy auth
summary: Delegeer Gateway-authenticatie aan een vertrouwde reverse proxy (Pomerium, Caddy, nginx + OAuth)
title: Vertrouwde proxy-authenticatie
x-i18n:
    generated_at: "2026-06-27T17:38:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 498a8aca666f88201302af3895b11ba43ab9c0b1bff00a262145fc9e21e80fa7
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Beveiligingsgevoelige functie.** Deze modus delegeert authenticatie volledig aan je reverse proxy. Een verkeerde configuratie kan je Gateway blootstellen aan onbevoegde toegang. Lees deze pagina zorgvuldig voordat je dit inschakelt.
</Warning>

## Wanneer gebruiken

Gebruik de authenticatiemodus `trusted-proxy` wanneer:

- Je OpenClaw achter een **identiteitsbewuste proxy** draait (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Je proxy alle authenticatie afhandelt en gebruikersidentiteit via headers doorgeeft.
- Je in een Kubernetes- of containeromgeving zit waar de proxy het enige pad naar de Gateway is.
- Je WebSocket-fouten `1008 unauthorized` krijgt omdat browsers geen tokens in WS-payloads kunnen doorgeven.

## Wanneer NIET gebruiken

- Als je proxy gebruikers niet authenticeert (alleen een TLS-terminator of load balancer).
- Als er een pad naar de Gateway is dat de proxy omzeilt (firewallgaten, interne netwerktoegang).
- Als je niet zeker weet of je proxy doorgestuurde headers correct verwijdert/overschrijft.
- Als je alleen persoonlijke toegang voor één gebruiker nodig hebt (overweeg Tailscale Serve + loopback voor een eenvoudigere setup).

## Hoe het werkt

<Steps>
  <Step title="Proxy authenticates the user">
    Je reverse proxy authenticeert gebruikers (OAuth, OIDC, SAML, enz.).
  </Step>
  <Step title="Proxy adds an identity header">
    De proxy voegt een header toe met de geauthenticeerde gebruikersidentiteit (bijv. `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway verifies trusted source">
    OpenClaw controleert of de aanvraag afkomstig is van een **vertrouwd proxy-IP** (geconfigureerd in `gateway.trustedProxies`).
  </Step>
  <Step title="Gateway extracts identity">
    OpenClaw haalt de gebruikersidentiteit uit de geconfigureerde header.
  </Step>
  <Step title="Authorize">
    Als alles klopt, wordt de aanvraag geautoriseerd.
  </Step>
</Steps>

## Koppelingsgedrag van Control UI

Wanneer `gateway.auth.mode = "trusted-proxy"` actief is en de aanvraag door de trusted-proxy-controles komt, kunnen Control UI-WebSocket-sessies verbinding maken zonder identiteit voor apparaatkoppeling.

Implicaties voor scopes:

- Control UI-WebSocket-sessies zonder apparaat maken verbinding, maar krijgen standaard geen operatorscopes. OpenClaw wist de gevraagde scopelijst naar `[]`, zodat een sessie die niet aan een goedgekeurd gekoppeld apparaat/token is gebonden geen rechten zelf kan declareren.
- Als methoden na een geslaagde WebSocket-verbinding mislukken met `missing scope`, gebruik dan HTTPS zodat de browser apparaatidentiteit kan genereren en koppeling kan voltooien. Zie [onveilige HTTP voor Control UI](/nl/web/control-ui#insecure-http).
- Alleen voor noodsituaties: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` behoudt gevraagde scopes zelfs zonder apparaatidentiteit. Dit is een ernstige beveiligingsverlaging; draai dit snel terug. Zie [onveilige HTTP voor Control UI](/nl/web/control-ui#insecure-http).

Scopebeperking via reverse proxy:

- Als je proxy `x-openclaw-scopes` verzendt op de Control UI-WebSocket-upgradeaanvraag, beperkt OpenClaw de sessiescopes tot de doorsnede van de gevraagde scopes en de gedeclareerde scopes. Deze header verleent geen scopes; hij beperkt alleen wat de sessie kan hebben.

Implicaties:

- Koppeling is in deze modus niet langer de primaire poort voor toegang tot Control UI.
- Je authenticatiebeleid van de reverse proxy en `allowUsers` worden de effectieve toegangscontrole.
- Houd Gateway-ingress beperkt tot alleen vertrouwde proxy-IP's (`gateway.trustedProxies` + firewall).

Aangepaste WebSocket-clients zijn geen Control UI-sessies. `gateway.controlUi.dangerouslyDisableDeviceAuth` verleent geen scopes aan willekeurige `client.mode: "backend"`- of CLI-vormige clients. Aangepaste automatisering moet apparaatidentiteit/koppeling gebruiken, het gereserveerde direct-lokale `client.id: "gateway-client"`-backendhulppad, of de [admin HTTP RPC-Plugin](/nl/plugins/admin-http-rpc) wanneer een HTTP-aanvraag/antwoordoppervlak beter past.

## Configuratie

```json5
{
  gateway: {
    // Trusted-proxy auth expects requests from a non-loopback trusted proxy source by default
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
**Belangrijke runtimeregels**

- Trusted-proxy-authenticatie weigert standaard aanvragen vanaf loopback-bronnen (`127.0.0.1`, `::1`, loopback-CIDR's).
- Same-host loopback-reverse proxies voldoen **niet** aan trusted-proxy-authenticatie, tenzij je expliciet `gateway.auth.trustedProxy.allowLoopback = true` instelt en het loopback-adres opneemt in `gateway.trustedProxies`.
- `allowLoopback` vertrouwt lokale processen op de Gateway-host in dezelfde mate als de reverse proxy. Schakel dit alleen in wanneer de Gateway nog steeds via de firewall is afgeschermd van directe externe toegang en de lokale proxy door clients aangeleverde identiteitsheaders verwijdert of overschrijft.
- Interne Gateway-clients die niet via de reverse proxy lopen, moeten `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` gebruiken, niet trusted-proxy-identiteitsheaders.
- Niet-loopback-Control UI-implementaties hebben nog steeds expliciet `gateway.controlUi.allowedOrigins` nodig.
- **Bewijs uit doorgestuurde headers overschrijft loopback-localiteit voor lokale directe fallback.** Als een aanvraag op loopback binnenkomt maar `Forwarded`, bewijs uit een `X-Forwarded-*`-header of een `X-Real-IP`-header bevat, diskwalificeert dat bewijs lokale directe wachtwoordfallback en apparaatidentiteitsgating. Met `allowLoopback: true` kan trusted-proxy-authenticatie de aanvraag nog steeds accepteren als een same-host proxy-aanvraag, terwijl `requiredHeaders` en `allowUsers` blijven gelden.

</Warning>

### Configuratiereferentie

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Array met te vertrouwen proxy-IP-adressen. Aanvragen vanaf andere IP's worden geweigerd.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Moet `"trusted-proxy"` zijn.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Headernaam met de geauthenticeerde gebruikersidentiteit.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Aanvullende headers die aanwezig moeten zijn voordat de aanvraag wordt vertrouwd.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Toelatingslijst van gebruikersidentiteiten. Leeg betekent dat alle geauthenticeerde gebruikers zijn toegestaan.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  Opt-in-ondersteuning voor same-host loopback-reverse proxies. Staat standaard op `false`.
</ParamField>

<Warning>
Schakel `allowLoopback` alleen in wanneer de lokale reverse proxy de beoogde vertrouwensgrens is. Elk lokaal proces dat verbinding kan maken met de Gateway kan proberen proxy-identiteitsheaders te verzenden, dus houd directe Gateway-toegang privé voor de host en vereis proxy-eigen headers zoals `x-forwarded-proto` of een ondertekende assertion-header waar je proxy die ondersteunt.
</Warning>

## TLS-terminatie en HSTS

Gebruik één TLS-terminatiepunt en pas HSTS daar toe.

<Tabs>
  <Tab title="Proxy TLS termination (recommended)">
    Wanneer je reverse proxy HTTPS afhandelt voor `https://control.example.com`, stel je `Strict-Transport-Security` op de proxy in voor dat domein.

    - Goede keuze voor internetgerichte implementaties.
    - Houdt certificaat- en HTTP-hardeningbeleid op één plek.
    - OpenClaw kan achter de proxy op loopback-HTTP blijven.

    Voorbeeldheaderwaarde:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway TLS termination">
    Als OpenClaw zelf rechtstreeks HTTPS serveert (geen TLS-terminerende proxy), stel dan in:

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

    `strictTransportSecurity` accepteert een stringheaderwaarde, of `false` om expliciet uit te schakelen.

  </Tab>
</Tabs>

### Richtlijnen voor uitrol

- Begin eerst met een korte maximale leeftijd (bijvoorbeeld `max-age=300`) terwijl je verkeer valideert.
- Verhoog pas naar langlevende waarden (bijvoorbeeld `max-age=31536000`) nadat het vertrouwen hoog is.
- Voeg `includeSubDomains` alleen toe als elk subdomein klaar is voor HTTPS.
- Gebruik preload alleen als je bewust voldoet aan de preload-vereisten voor je volledige domeinset.
- Alleen-loopback lokale ontwikkeling heeft geen voordeel van HSTS.

## Voorbeelden voor proxysetup

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium geeft identiteit door in `x-pomerium-claim-email` (of andere claimheaders) en een JWT in `x-pomerium-jwt-assertion`.

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

    Pomerium-configuratiefragment:

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
  <Accordion title="Caddy with OAuth">
    Caddy met de `caddy-security`-Plugin kan gebruikers authenticeren en identiteitsheaders doorgeven.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Caddy/sidecar proxy IP
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

    ```
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
    oauth2-proxy authenticeert gebruikers en geeft identiteit door in `x-auth-request-email`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxy IP
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
  <Accordion title="Traefik with forward auth">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // Traefik container IP
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

OpenClaw weigert dubbelzinnige configuraties waarbij zowel een `gateway.auth.token` (of `OPENCLAW_GATEWAY_TOKEN`) als de modus `trusted-proxy` tegelijk actief zijn. Gemengde tokenconfiguraties kunnen ertoe leiden dat loopback-aanvragen stilzwijgend via het verkeerde authenticatiepad worden geauthenticeerd.

Als je bij het starten een fout `mixed_trusted_proxy_token` ziet:

- Verwijder het gedeelde token wanneer je de trusted-proxy-modus gebruikt, of
- Zet `gateway.auth.mode` op `"token"` als je tokengebaseerde authenticatie bedoelt.

Loopback trusted-proxy-identiteitsheaders blijven fail-closed: aanroepers vanaf dezelfde host worden niet stilzwijgend geauthenticeerd als proxygebruikers. Interne OpenClaw-aanroepers die de proxy omzeilen, kunnen in plaats daarvan authenticeren met `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Tokenfallback blijft bewust niet ondersteund in trusted-proxy-modus.

## Header voor operator-scopes

Trusted-proxy-authenticatie is een **identiteitsdragende** HTTP-modus, dus aanroepers kunnen optioneel operator-scopes declareren met `x-openclaw-scopes` op HTTP-API-aanvragen.

Opmerking: WebSocket-scopes worden bepaald door de Gateway-protocolhandshake en binding van apparaatidentiteit. Op Control UI WebSocket-upgradeaanvragen is `x-openclaw-scopes` alleen een bovengrens voor de onderhandelde sessiescopes, geen toekenning. Zie [koppelingsgedrag van Control UI](#control-ui-pairing-behavior) voor WebSocket-scopegedrag met trusted-proxy.

Voorbeelden:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Gedrag:

- Wanneer de header aanwezig is, respecteert OpenClaw de gedeclareerde scopeset.
- Wanneer de header aanwezig maar leeg is, declareert de aanvraag **geen** operator-scopes.
- Wanneer de header afwezig is, vallen normale identiteitsdragende HTTP-API's terug op de standaard operatorscopeset.
- Gateway-auth **Plugin HTTP-routes** zijn standaard beperkter: wanneer `x-openclaw-scopes` afwezig is, valt hun runtime-scope terug op `operator.write`.
- HTTP-aanvragen met browser-origin moeten nog steeds slagen voor `gateway.controlUi.allowedOrigins` (of de bewuste Host-header-fallbackmodus), zelfs nadat trusted-proxy-authenticatie slaagt.
- Voor Control UI WebSocket-sessies is `x-openclaw-scopes` een scopebovengrens wanneer deze aanwezig is op de upgradeaanvraag. Een lege waarde levert geen scopes op.

Praktische regel: verstuur `x-openclaw-scopes` expliciet wanneer je wilt dat een trusted-proxy-aanvraag beperkter is dan de standaardwaarden, of wanneer een gateway-auth Plugin-route iets sterkers nodig heeft dan write-scope.

## Beveiligingschecklist

Controleer voordat je trusted-proxy-authenticatie inschakelt:

- [ ] **Proxy is het enige pad**: De Gateway-poort is met een firewall afgeschermd van alles behalve je proxy.
- [ ] **trustedProxies is minimaal**: Alleen je echte proxy-IP's, geen volledige subnetten.
- [ ] **Loopback-proxybron is bewust gekozen**: trusted-proxy-authenticatie faalt gesloten voor aanvragen met loopback-bron, tenzij `gateway.auth.trustedProxy.allowLoopback` expliciet is ingeschakeld voor een proxy op dezelfde host.
- [ ] **Proxy stript headers**: Je proxy overschrijft (voegt niet toe aan) `x-forwarded-*`-headers van clients.
- [ ] **TLS-beëindiging**: Je proxy handelt TLS af; gebruikers verbinden via HTTPS.
- [ ] **allowedOrigins is expliciet**: Niet-loopback Control UI gebruikt expliciete `gateway.controlUi.allowedOrigins`.
- [ ] **allowUsers is ingesteld** (aanbevolen): Beperk tot bekende gebruikers in plaats van iedereen toe te staan die is geauthenticeerd.
- [ ] **Geen gemengde tokenconfiguratie**: Stel niet zowel `gateway.auth.token` als `gateway.auth.mode: "trusted-proxy"` in.
- [ ] **Lokale wachtwoordfallback is privé**: Als je `gateway.auth.password` configureert voor interne directe aanroepers, houd de Gateway-poort dan met een firewall afgeschermd zodat externe niet-proxyclients deze niet rechtstreeks kunnen bereiken.

## Beveiligingsaudit

`openclaw security audit` markeert trusted-proxy-authenticatie met een bevinding van **kritieke** ernst. Dit is bewust: het is een herinnering dat je beveiliging delegeert aan je proxyconfiguratie.

De audit controleert op:

- Basiswaarschuwing/kritieke herinnering `gateway.trusted_proxy_auth`
- Ontbrekende `trustedProxies`-configuratie
- Ontbrekende `userHeader`-configuratie
- Lege `allowUsers` (staat elke geauthenticeerde gebruiker toe)
- Ingeschakelde `allowLoopback` voor proxybronnen op dezelfde host
- Wildcard- of ontbrekend browser-originbeleid op blootgestelde Control UI-oppervlakken

## Probleemoplossing

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    De aanvraag kwam niet van een IP in `gateway.trustedProxies`. Controleer:

    - Is het proxy-IP correct? (Docker-container-IP's kunnen veranderen.)
    - Staat er een loadbalancer voor je proxy?
    - Gebruik `docker inspect` of `kubectl get pods -o wide` om de werkelijke IP's te vinden.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw heeft een trusted-proxy-aanvraag met loopback-bron geweigerd.

    Controleer:

    - Maakt de proxy verbinding vanaf `127.0.0.1` / `::1`?
    - Probeer je trusted-proxy-authenticatie te gebruiken met een loopback-reverseproxy op dezelfde host?

    Oplossing:

    - Geef de voorkeur aan token-/wachtwoordauthenticatie voor interne clients op dezelfde host die niet via de proxy gaan, of
    - Routeer via een niet-loopback trusted-proxy-adres en houd dat IP in `gateway.trustedProxies`, of
    - Stel voor een bewuste reverseproxy op dezelfde host `gateway.auth.trustedProxy.allowLoopback = true` in, houd het loopback-adres in `gateway.trustedProxies`, en zorg dat de proxy identiteitsheaders stript of overschrijft.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    De gebruikersheader was leeg of ontbrak. Controleer:

    - Is je proxy geconfigureerd om identiteitsheaders door te geven?
    - Is de headernaam correct? (hoofdletterongevoelig, maar spelling telt)
    - Is de gebruiker daadwerkelijk geauthenticeerd bij de proxy?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Een vereiste header was niet aanwezig. Controleer:

    - Je proxyconfiguratie voor die specifieke headers.
    - Of headers ergens in de keten worden gestript.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    De gebruiker is geauthenticeerd, maar staat niet in `allowUsers`. Voeg de gebruiker toe of verwijder de allowlist.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Trusted-proxy-authenticatie is geslaagd, maar de browserheader `Origin` kwam niet door de Control UI-origincontroles.

    Controleer:

    - `gateway.controlUi.allowedOrigins` bevat de exacte browser-origin.
    - Je vertrouwt niet op wildcard-origins, tenzij je bewust allow-all-gedrag wilt.
    - Als je bewust Host-header-fallbackmodus gebruikt, is `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` bewust ingesteld.

  </Accordion>
  <Accordion title="Connection succeeds but methods report missing scope">
    De WebSocket maakt verbinding, maar `chat.history`, `sessions.list` of
    `models.list` faalt met `missing scope: operator.read`.

    Veelvoorkomende oorzaken:

    - Control UI-sessie zonder apparaat: trusted-proxy-authenticatie kan de WebSocket-verbinding toelaten zonder apparaatidentiteit, maar OpenClaw wist scopes op sessies zonder apparaat volgens ontwerp.
    - Aangepaste backendclient: `gateway.controlUi.dangerouslyDisableDeviceAuth` is beperkt tot Control UI en kent geen scopes toe aan willekeurige backend- of CLI-vormige WebSocket-clients.
    - Te beperkte `x-openclaw-scopes`: als je proxy deze header injecteert op de Control UI WebSocket-upgradeaanvraag, worden de sessiescopes begrensd tot die set. Een lege headerwaarde levert geen scopes op.

    Oplossing:

    - Gebruik voor Control UI HTTPS, zodat de browser apparaatidentiteit kan genereren en de koppeling kan voltooien.
    - Gebruik voor aangepaste automatisering apparaatidentiteit/koppeling, het gereserveerde directe lokale `gateway-client`-backendhulppad, of [admin HTTP RPC](/nl/plugins/admin-http-rpc).
    - Gebruik `gateway.controlUi.dangerouslyDisableDeviceAuth: true` alleen als tijdelijk break-glass-pad voor Control UI.

  </Accordion>
  <Accordion title="WebSocket still failing">
    Zorg dat je proxy:

    - WebSocket-upgrades ondersteunt (`Upgrade: websocket`, `Connection: upgrade`).
    - De identiteitsheaders doorgeeft op WebSocket-upgradeaanvragen (niet alleen HTTP).
    - Geen apart authenticatiepad heeft voor WebSocket-verbindingen.

  </Accordion>
</AccordionGroup>

## Migratie vanaf tokenauthenticatie

Als je overstapt van tokenauthenticatie naar trusted-proxy:

<Steps>
  <Step title="Configure the proxy">
    Configureer je proxy om gebruikers te authenticeren en headers door te geven.
  </Step>
  <Step title="Test the proxy independently">
    Test de proxyconfiguratie onafhankelijk (curl met headers).
  </Step>
  <Step title="Update OpenClaw config">
    Werk de OpenClaw-configuratie bij met trusted-proxy-authenticatie.
  </Step>
  <Step title="Restart the Gateway">
    Start de Gateway opnieuw.
  </Step>
  <Step title="Test WebSocket">
    Test WebSocket-verbindingen vanuit de Control UI.
  </Step>
  <Step title="Audit">
    Voer `openclaw security audit` uit en bekijk de bevindingen.
  </Step>
</Steps>

## Gerelateerd

- [Configuratie](/nl/gateway/configuration) — configuratiereferentie
- [Externe toegang](/nl/gateway/remote) — andere patronen voor externe toegang
- [Beveiliging](/nl/gateway/security) — volledige beveiligingsgids
- [Tailscale](/nl/gateway/tailscale) — eenvoudiger alternatief voor toegang uitsluitend via tailnet
