---
read_when:
    - Uruchamianie OpenClaw za proxy świadomym tożsamości
    - Konfigurowanie Pomerium, Caddy lub nginx z OAuth przed OpenClaw
    - Naprawianie błędów WebSocket 1008 unauthorized w konfiguracjach reverse proxy
    - Decydowanie, gdzie ustawić HSTS i inne nagłówki utwardzające HTTP
sidebarTitle: Trusted proxy auth
summary: Przekaż uwierzytelnianie gateway zaufanemu reverse proxy (Pomerium, Caddy, nginx + OAuth)
title: Uwierzytelnianie trusted proxy
x-i18n:
    generated_at: "2026-04-26T11:32:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64e0f4dee942aedec548135f0408e7773e7b498f8262af13a4d0eff262cae646
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

<Warning>
**Funkcja wrażliwa bezpieczeństwa.** Ten tryb całkowicie deleguje uwierzytelnianie do Twojego reverse proxy. Błędna konfiguracja może wystawić Twój Gateway na nieautoryzowany dostęp. Przeczytaj uważnie tę stronę przed włączeniem tej funkcji.
</Warning>

## Kiedy używać

Używaj trybu uwierzytelniania `trusted-proxy`, gdy:

- Uruchamiasz OpenClaw za **proxy świadomym tożsamości** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Twoje proxy obsługuje całe uwierzytelnianie i przekazuje tożsamość użytkownika przez nagłówki.
- Działasz w środowisku Kubernetes lub kontenerowym, gdzie proxy jest jedyną ścieżką do Gateway.
- Napotykasz błędy WebSocket `1008 unauthorized`, ponieważ przeglądarki nie mogą przekazywać tokenów w ładunkach WS.

## Kiedy NIE używać

- Jeśli Twoje proxy nie uwierzytelnia użytkowników (jest tylko terminatorem TLS albo load balancerem).
- Jeśli istnieje jakakolwiek ścieżka do Gateway omijająca proxy (dziury w firewallu, dostęp z sieci wewnętrznej).
- Jeśli nie masz pewności, czy Twoje proxy poprawnie usuwa/nadpisuje przekazywane nagłówki.
- Jeśli potrzebujesz tylko osobistego dostępu dla jednego użytkownika (rozważ Tailscale Serve + loopback dla prostszej konfiguracji).

## Jak to działa

<Steps>
  <Step title="Proxy uwierzytelnia użytkownika">
    Twoje reverse proxy uwierzytelnia użytkowników (OAuth, OIDC, SAML itp.).
  </Step>
  <Step title="Proxy dodaje nagłówek tożsamości">
    Proxy dodaje nagłówek z tożsamością uwierzytelnionego użytkownika (np. `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway weryfikuje zaufane źródło">
    OpenClaw sprawdza, czy żądanie pochodzi z **zaufanego adresu IP proxy** (skonfigurowanego w `gateway.trustedProxies`).
  </Step>
  <Step title="Gateway wyodrębnia tożsamość">
    OpenClaw wyodrębnia tożsamość użytkownika ze skonfigurowanego nagłówka.
  </Step>
  <Step title="Autoryzacja">
    Jeśli wszystko się zgadza, żądanie zostaje autoryzowane.
  </Step>
</Steps>

## Zachowanie parowania Control UI

Gdy aktywne jest `gateway.auth.mode = "trusted-proxy"` i żądanie przejdzie kontrole trusted-proxy, sesje WebSocket Control UI mogą łączyć się bez tożsamości parowania urządzenia.

Implikacje:

- Parowanie nie jest już główną bramką dostępu do Control UI w tym trybie.
- Polityka uwierzytelniania Twojego reverse proxy oraz `allowUsers` stają się efektywną kontrolą dostępu.
- Utrzymuj ingress gateway zablokowany tylko do zaufanych adresów IP proxy (`gateway.trustedProxies` + firewall).

## Konfiguracja

```json5
{
  gateway: {
    // Uwierzytelnianie trusted-proxy oczekuje żądań z nie-loopbackowego zaufanego źródła proxy
    bind: "lan",

    // KRYTYCZNE: Dodaj tutaj tylko adresy IP swojego proxy
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Nagłówek zawierający tożsamość uwierzytelnionego użytkownika (wymagany)
        userHeader: "x-forwarded-user",

        // Opcjonalnie: nagłówki, które MUSZĄ być obecne (weryfikacja proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Opcjonalnie: ograniczenie do konkretnych użytkowników (puste = zezwól wszystkim)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

<Warning>
**Ważne reguły runtime**

- Uwierzytelnianie trusted-proxy odrzuca żądania ze źródła loopback (`127.0.0.1`, `::1`, zakresy CIDR loopback).
- Reverse proxy loopback na tym samym hoście **nie** spełniają wymagań uwierzytelniania trusted-proxy.
- Dla konfiguracji proxy loopback na tym samym hoście używaj zamiast tego uwierzytelniania tokenem/hasłem albo kieruj ruch przez nie-loopbackowy adres zaufanego proxy, który OpenClaw może zweryfikować.
- Wdrożenia Control UI spoza loopback nadal wymagają jawnego `gateway.controlUi.allowedOrigins`.
- **Dowód z forwarded-header ma pierwszeństwo przed lokalnością loopback.** Jeśli żądanie dociera przez loopback, ale zawiera nagłówki `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` wskazujące na nie-lokalne źródło, ten dowód unieważnia twierdzenie o lokalności loopback. Żądanie jest traktowane jako zdalne dla parowania, uwierzytelniania trusted-proxy i bramkowania tożsamości urządzenia Control UI. Zapobiega to sytuacji, w której proxy loopback na tym samym hoście „przepierze” tożsamość z forwarded-header do uwierzytelniania trusted-proxy.
</Warning>

### Dokumentacja konfiguracji

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Tablica adresów IP proxy, którym należy ufać. Żądania z innych adresów IP są odrzucane.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Musi mieć wartość `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Nazwa nagłówka zawierającego tożsamość uwierzytelnionego użytkownika.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Dodatkowe nagłówki, które muszą być obecne, aby żądanie było uznane za zaufane.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Lista dozwolonych tożsamości użytkowników. Pusta oznacza zezwolenie wszystkim uwierzytelnionym użytkownikom.
</ParamField>

## Terminacja TLS i HSTS

Używaj jednego punktu terminacji TLS i stosuj tam HSTS.

<Tabs>
  <Tab title="Terminacja TLS w proxy (zalecane)">
    Gdy Twoje reverse proxy obsługuje HTTPS dla `https://control.example.com`, ustaw `Strict-Transport-Security` w proxy dla tej domeny.

    - Dobre dopasowanie dla wdrożeń wystawionych do internetu.
    - Utrzymuje certyfikat i politykę utwardzania HTTP w jednym miejscu.
    - OpenClaw może pozostać na loopback HTTP za proxy.

    Przykładowa wartość nagłówka:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Terminacja TLS w Gateway">
    Jeśli sam OpenClaw bezpośrednio obsługuje HTTPS (bez proxy kończącego TLS), ustaw:

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

    `strictTransportSecurity` akceptuje wartość nagłówka jako ciąg albo `false`, aby jawnie wyłączyć.

  </Tab>
</Tabs>

### Wskazówki dotyczące wdrażania

- Zacznij od krótkiego `max-age` (na przykład `max-age=300`) podczas weryfikacji ruchu.
- Zwiększ do długich wartości (na przykład `max-age=31536000`) dopiero wtedy, gdy poziom pewności będzie wysoki.
- Dodaj `includeSubDomains` tylko wtedy, gdy każda subdomena jest gotowa na HTTPS.
- Używaj preload tylko wtedy, gdy celowo spełniasz wymagania preload dla pełnego zestawu swoich domen.
- Lokalny development oparty wyłącznie na loopback nie korzysta z HSTS.

## Przykłady konfiguracji proxy

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium przekazuje tożsamość w `x-pomerium-claim-email` (lub innych nagłówkach claim) oraz JWT w `x-pomerium-jwt-assertion`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // adres IP Pomerium
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

    Fragment konfiguracji Pomerium:

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
  <Accordion title="Caddy z OAuth">
    Caddy z pluginem `caddy-security` może uwierzytelniać użytkowników i przekazywać nagłówki tożsamości.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // adres IP Caddy/proxy sidecar
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```

    Fragment Caddyfile:

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
    oauth2-proxy uwierzytelnia użytkowników i przekazuje tożsamość w `x-auth-request-email`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // adres IP nginx/oauth2-proxy
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-auth-request-email",
          },
        },
      },
    }
    ```

    Fragment konfiguracji nginx:

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
  <Accordion title="Traefik z forward auth">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // adres IP kontenera Traefik
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

## Mieszana konfiguracja tokena

OpenClaw odrzuca niejednoznaczne konfiguracje, w których jednocześnie aktywne są `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`) oraz tryb `trusted-proxy`. Mieszane konfiguracje tokena mogą spowodować, że żądania loopback będą po cichu uwierzytelniane niewłaściwą ścieżką uwierzytelniania.

Jeśli przy starcie zobaczysz błąd `mixed_trusted_proxy_token`:

- Usuń współdzielony token podczas używania trybu trusted-proxy, albo
- Przełącz `gateway.auth.mode` na `"token"`, jeśli zamierzasz używać uwierzytelniania opartego na tokenie.

Uwierzytelnianie trusted-proxy dla loopback również kończy się w trybie fail-closed: wywołujący z tego samego hosta muszą dostarczyć skonfigurowane nagłówki tożsamości przez zaufane proxy zamiast być po cichu uwierzytelniani.

## Nagłówek zakresów operatora

Uwierzytelnianie trusted-proxy jest trybem HTTP **przenoszącym tożsamość**, więc wywołujący mogą opcjonalnie deklarować zakresy operatora przez `x-openclaw-scopes`.

Przykłady:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Zachowanie:

- Gdy nagłówek jest obecny, OpenClaw respektuje zadeklarowany zestaw zakresów.
- Gdy nagłówek jest obecny, ale pusty, żądanie deklaruje **brak** zakresów operatora.
- Gdy nagłówek jest nieobecny, zwykłe HTTP API przenoszące tożsamość używają fallback do standardowego domyślnego zestawu zakresów operatora.
- Trasy HTTP **pluginów** uwierzytelniania gateway są domyślnie węższe: gdy `x-openclaw-scopes` jest nieobecny, ich zakres runtime używa fallback do `operator.write`.
- Żądania HTTP pochodzące z przeglądarki nadal muszą przejść `gateway.controlUi.allowedOrigins` (albo celowy tryb fallback nagłówka Host), nawet po pomyślnym uwierzytelnieniu trusted-proxy.

Praktyczna zasada: wysyłaj `x-openclaw-scopes` jawnie, gdy chcesz, aby żądanie trusted-proxy było węższe niż wartości domyślne albo gdy trasa pluginu uwierzytelniania gateway potrzebuje czegoś silniejszego niż zakres write.

## Lista kontrolna bezpieczeństwa

Przed włączeniem uwierzytelniania trusted-proxy sprawdź:

- [ ] **Proxy jest jedyną ścieżką**: port Gateway jest odcięty firewallem od wszystkiego poza Twoim proxy.
- [ ] **trustedProxies jest minimalne**: tylko rzeczywiste adresy IP Twojego proxy, nie całe podsieci.
- [ ] **Brak źródła proxy loopback**: uwierzytelnianie trusted-proxy kończy się w trybie fail-closed dla żądań ze źródła loopback.
- [ ] **Proxy usuwa nagłówki**: Twoje proxy nadpisuje (a nie dopisuje) nagłówki `x-forwarded-*` od klientów.
- [ ] **Terminacja TLS**: Twoje proxy obsługuje TLS; użytkownicy łączą się przez HTTPS.
- [ ] **allowedOrigins jest jawne**: Control UI poza loopback używa jawnego `gateway.controlUi.allowedOrigins`.
- [ ] **allowUsers jest ustawione** (zalecane): ogranicz dostęp do znanych użytkowników zamiast zezwalać wszystkim uwierzytelnionym.
- [ ] **Brak mieszanej konfiguracji tokena**: nie ustawiaj jednocześnie `gateway.auth.token` i `gateway.auth.mode: "trusted-proxy"`.

## Audyt bezpieczeństwa

`openclaw security audit` oznaczy uwierzytelnianie trusted-proxy jako ustalenie o ważności **critical**. To zamierzone — ma przypominać, że delegujesz bezpieczeństwo do konfiguracji swojego proxy.

Audyt sprawdza:

- Podstawowe ostrzeżenie/przypomnienie `gateway.trusted_proxy_auth` o ważności warning/critical
- Brak konfiguracji `trustedProxies`
- Brak konfiguracji `userHeader`
- Puste `allowUsers` (zezwala każdemu uwierzytelnionemu użytkownikowi)
- Wildcard lub brak polityki pochodzenia przeglądarki na wystawionych powierzchniach Control UI

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    Żądanie nie pochodziło z adresu IP znajdującego się w `gateway.trustedProxies`. Sprawdź:

    - Czy adres IP proxy jest poprawny? (Adresy IP kontenerów Docker mogą się zmieniać.)
    - Czy przed proxy znajduje się load balancer?
    - Użyj `docker inspect` albo `kubectl get pods -o wide`, aby znaleźć rzeczywiste adresy IP.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw odrzucił żądanie trusted-proxy ze źródła loopback.

    Sprawdź:

    - Czy proxy łączy się z `127.0.0.1` / `::1`?
    - Czy próbujesz używać uwierzytelniania trusted-proxy z reverse proxy loopback na tym samym hoście?

    Naprawa:

    - Użyj uwierzytelniania tokenem/hasłem dla konfiguracji proxy loopback na tym samym hoście, albo
    - Kieruj ruch przez nie-loopbackowy adres zaufanego proxy i utrzymuj ten adres IP w `gateway.trustedProxies`.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    Nagłówek użytkownika był pusty albo nieobecny. Sprawdź:

    - Czy Twoje proxy jest skonfigurowane do przekazywania nagłówków tożsamości?
    - Czy nazwa nagłówka jest poprawna? (nie rozróżnia wielkości liter, ale pisownia ma znaczenie)
    - Czy użytkownik jest faktycznie uwierzytelniony w proxy?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Wymagany nagłówek nie był obecny. Sprawdź:

    - Konfigurację proxy dla tych konkretnych nagłówków.
    - Czy nagłówki nie są gdzieś po drodze usuwane.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    Użytkownik jest uwierzytelniony, ale nie znajduje się w `allowUsers`. Dodaj go albo usuń listę dozwolonych.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Uwierzytelnianie trusted-proxy zakończyło się powodzeniem, ale nagłówek przeglądarki `Origin` nie przeszedł kontroli pochodzenia Control UI.

    Sprawdź:

    - Czy `gateway.controlUi.allowedOrigins` zawiera dokładne pochodzenie przeglądarki.
    - Czy nie polegasz na wildcard origins, chyba że celowo chcesz zachowanie allow-all.
    - Jeśli celowo używasz trybu fallback nagłówka Host, czy `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` jest ustawione świadomie.

  </Accordion>
  <Accordion title="WebSocket nadal kończy się błędem">
    Upewnij się, że Twoje proxy:

    - Obsługuje upgrade WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Przekazuje nagłówki tożsamości przy żądaniach upgrade WebSocket (nie tylko HTTP).
    - Nie ma osobnej ścieżki uwierzytelniania dla połączeń WebSocket.

  </Accordion>
</AccordionGroup>

## Migracja z uwierzytelniania tokenem

Jeśli przechodzisz z uwierzytelniania tokenem na trusted-proxy:

<Steps>
  <Step title="Skonfiguruj proxy">
    Skonfiguruj proxy tak, aby uwierzytelniało użytkowników i przekazywało nagłówki.
  </Step>
  <Step title="Przetestuj proxy niezależnie">
    Przetestuj konfigurację proxy niezależnie (`curl` z nagłówkami).
  </Step>
  <Step title="Zaktualizuj konfigurację OpenClaw">
    Zaktualizuj konfigurację OpenClaw o uwierzytelnianie trusted-proxy.
  </Step>
  <Step title="Uruchom ponownie Gateway">
    Uruchom ponownie Gateway.
  </Step>
  <Step title="Przetestuj WebSocket">
    Przetestuj połączenia WebSocket z poziomu Control UI.
  </Step>
  <Step title="Przeprowadź audyt">
    Uruchom `openclaw security audit` i przejrzyj ustalenia.
  </Step>
</Steps>

## Powiązane

- [Konfiguracja](/pl/gateway/configuration) — dokumentacja konfiguracji
- [Dostęp zdalny](/pl/gateway/remote) — inne wzorce dostępu zdalnego
- [Bezpieczeństwo](/pl/gateway/security) — pełny przewodnik bezpieczeństwa
- [Tailscale](/pl/gateway/tailscale) — prostsza alternatywa dla dostępu tylko w tailnet
