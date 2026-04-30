---
read_when:
    - Uruchamianie OpenClaw za serwerem proxy świadomym tożsamości
    - Konfigurowanie Pomerium, Caddy lub nginx z OAuth przed OpenClaw
    - Naprawianie błędów WebSocket 1008 związanych z brakiem autoryzacji w konfiguracjach z odwrotnym proxy
    - Wybór miejsca ustawienia HSTS i innych nagłówków wzmacniających zabezpieczenia HTTP
sidebarTitle: Trusted proxy auth
summary: Deleguj uwierzytelnianie Gateway do zaufanego serwera proxy odwrotnego (Pomerium, Caddy, nginx + OAuth)
title: Uwierzytelnianie przez zaufane proxy
x-i18n:
    generated_at: "2026-04-30T09:57:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 311498b822d2dbf9833c71ec070ab5cee5b4dd2dfb0eeaad1d758eee367a2df3
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Funkcja wrażliwa bezpieczeństwowo.** Ten tryb w całości deleguje uwierzytelnianie do Twojego reverse proxy. Błędna konfiguracja może narazić Twój Gateway na nieautoryzowany dostęp. Przeczytaj tę stronę uważnie przed włączeniem.
</Warning>

## Kiedy używać

Użyj trybu uwierzytelniania `trusted-proxy`, gdy:

- Uruchamiasz OpenClaw za **proxy świadomym tożsamości** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Twoje proxy obsługuje całe uwierzytelnianie i przekazuje tożsamość użytkownika przez nagłówki.
- Działasz w środowisku Kubernetes lub kontenerowym, gdzie proxy jest jedyną ścieżką do Gateway.
- Trafiasz na błędy WebSocket `1008 unauthorized`, ponieważ przeglądarki nie mogą przekazywać tokenów w ładunkach WS.

## Kiedy NIE używać

- Jeśli Twoje proxy nie uwierzytelnia użytkowników (jest tylko terminatorem TLS lub równoważnikiem obciążenia).
- Jeśli istnieje jakakolwiek ścieżka do Gateway omijająca proxy (luki w zaporze, dostęp z sieci wewnętrznej).
- Jeśli nie masz pewności, czy Twoje proxy poprawnie usuwa/nadpisuje przekazywane nagłówki.
- Jeśli potrzebujesz tylko osobistego dostępu dla jednego użytkownika (rozważ Tailscale Serve + loopback dla prostszej konfiguracji).

## Jak to działa

<Steps>
  <Step title="Proxy authenticates the user">
    Twoje reverse proxy uwierzytelnia użytkowników (OAuth, OIDC, SAML itd.).
  </Step>
  <Step title="Proxy adds an identity header">
    Proxy dodaje nagłówek z tożsamością uwierzytelnionego użytkownika (np. `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway verifies trusted source">
    OpenClaw sprawdza, czy żądanie pochodzi z **zaufanego adresu IP proxy** (skonfigurowanego w `gateway.trustedProxies`).
  </Step>
  <Step title="Gateway extracts identity">
    OpenClaw wyodrębnia tożsamość użytkownika ze skonfigurowanego nagłówka.
  </Step>
  <Step title="Authorize">
    Jeśli wszystko się zgadza, żądanie zostaje autoryzowane.
  </Step>
</Steps>

## Zachowanie parowania Control UI

Gdy `gateway.auth.mode = "trusted-proxy"` jest aktywne, a żądanie przejdzie kontrole trusted-proxy, sesje WebSocket Control UI mogą łączyć się bez tożsamości parowania urządzenia.

Konsekwencje:

- Parowanie nie jest już główną bramką dostępu do Control UI w tym trybie.
- Polityka uwierzytelniania Twojego reverse proxy i `allowUsers` stają się skuteczną kontrolą dostępu.
- Ogranicz wejście do gateway wyłącznie do zaufanych adresów IP proxy (`gateway.trustedProxies` + zapora).

## Konfiguracja

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
**Ważne reguły wykonywania**

- Uwierzytelnianie trusted-proxy domyślnie odrzuca żądania ze źródeł loopback (`127.0.0.1`, `::1`, CIDR loopback).
- Reverse proxy loopback na tym samym hoście **nie** spełniają warunków uwierzytelniania trusted-proxy, chyba że jawnie ustawisz `gateway.auth.trustedProxy.allowLoopback = true` i uwzględnisz adres loopback w `gateway.trustedProxies`.
- `allowLoopback` ufa lokalnym procesom na hoście Gateway w takim samym stopniu jak reverse proxy. Włączaj to tylko wtedy, gdy Gateway nadal jest odgrodzony zaporą od bezpośredniego dostępu zdalnego, a lokalne proxy usuwa lub nadpisuje nagłówki tożsamości dostarczone przez klienta.
- Wewnętrzni klienci Gateway, którzy nie przechodzą przez reverse proxy, powinni używać `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, a nie nagłówków tożsamości trusted-proxy.
- Nieloopbackowe wdrożenia Control UI nadal wymagają jawnego `gateway.controlUi.allowedOrigins`.
- **Dowody z nagłówków przekazujących zastępują lokalność loopback dla lokalnego bezpośredniego trybu awaryjnego.** Jeśli żądanie przychodzi przez loopback, ale zawiera nagłówki `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` wskazujące na nielokalne pochodzenie, te dowody wykluczają lokalny bezpośredni awaryjny powrót do hasła i bramkowanie tożsamością urządzenia. Przy `allowLoopback: true` uwierzytelnianie trusted-proxy nadal może zaakceptować żądanie jako żądanie proxy z tego samego hosta, a `requiredHeaders` i `allowUsers` nadal mają zastosowanie.

</Warning>

### Opis konfiguracji

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Tablica adresów IP proxy, którym należy ufać. Żądania z innych adresów IP są odrzucane.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Musi być `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Nazwa nagłówka zawierającego tożsamość uwierzytelnionego użytkownika.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Dodatkowe nagłówki, które muszą być obecne, aby żądanie zostało uznane za zaufane.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Lista dozwolonych tożsamości użytkowników. Pusta oznacza zezwolenie wszystkim uwierzytelnionym użytkownikom.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  Jawnie włączane wsparcie dla reverse proxy loopback na tym samym hoście. Domyślnie `false`.
</ParamField>

<Warning>
Włączaj `allowLoopback` tylko wtedy, gdy lokalne reverse proxy jest zamierzoną granicą zaufania. Każdy lokalny proces, który może połączyć się z Gateway, może próbować wysyłać nagłówki tożsamości proxy, więc utrzymuj bezpośredni dostęp do Gateway jako prywatny dla hosta i wymagaj nagłówków należących do proxy, takich jak `x-forwarded-proto`, albo podpisanego nagłówka asercji tam, gdzie Twoje proxy go obsługuje.
</Warning>

## Terminacja TLS i HSTS

Użyj jednego punktu terminacji TLS i zastosuj tam HSTS.

<Tabs>
  <Tab title="Proxy TLS termination (recommended)">
    Gdy Twoje reverse proxy obsługuje HTTPS dla `https://control.example.com`, ustaw `Strict-Transport-Security` w proxy dla tej domeny.

    - Dobrze pasuje do wdrożeń wystawionych do internetu.
    - Utrzymuje certyfikat i politykę utwardzania HTTP w jednym miejscu.
    - OpenClaw może pozostać na HTTP loopback za proxy.

    Przykładowa wartość nagłówka:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway TLS termination">
    Jeśli sam OpenClaw bezpośrednio obsługuje HTTPS (bez proxy terminującego TLS), ustaw:

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

    `strictTransportSecurity` przyjmuje wartość nagłówka jako ciąg znaków albo `false`, aby jawnie wyłączyć.

  </Tab>
</Tabs>

### Wskazówki wdrożeniowe

- Zacznij najpierw od krótkiego maksymalnego wieku (na przykład `max-age=300`) podczas walidowania ruchu.
- Zwiększ do wartości długotrwałych (na przykład `max-age=31536000`) dopiero po uzyskaniu wysokiej pewności.
- Dodaj `includeSubDomains` tylko wtedy, gdy każda subdomena jest gotowa na HTTPS.
- Używaj preload tylko wtedy, gdy celowo spełniasz wymagania preload dla pełnego zestawu domen.
- Lokalne programowanie wyłącznie na loopback nie korzysta z HSTS.

## Przykłady konfiguracji proxy

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium przekazuje tożsamość w `x-pomerium-claim-email` (lub innych nagłówkach roszczeń) oraz JWT w `x-pomerium-jwt-assertion`.

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
  <Accordion title="Caddy with OAuth">
    Caddy z Plugin `caddy-security` może uwierzytelniać użytkowników i przekazywać nagłówki tożsamości.

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

## Mieszana konfiguracja tokenów

OpenClaw odrzuca niejednoznaczne konfiguracje, w których jednocześnie aktywne są `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`) i tryb `trusted-proxy`. Mieszane konfiguracje tokenów mogą sprawić, że żądania loopback zostaną po cichu uwierzytelnione na niewłaściwej ścieżce uwierzytelniania.

Jeśli podczas uruchamiania zobaczysz błąd `mixed_trusted_proxy_token`:

- Usuń współdzielony token podczas używania trybu trusted-proxy albo
- Przełącz `gateway.auth.mode` na `"token"`, jeśli zamierzasz używać uwierzytelniania opartego na tokenie.

Nagłówki tożsamości trusted-proxy z loopback nadal kończą się zamkniętą odmową: wywołujący z tego samego hosta nie są po cichu uwierzytelniani jako użytkownicy proxy. Wewnętrzni wywołujący OpenClaw, którzy omijają proxy, mogą zamiast tego uwierzytelniać się przez `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Awaryjny powrót do tokenu pozostaje celowo nieobsługiwany w trybie trusted-proxy.

## Nagłówek zakresów operatora

Uwierzytelnianie trusted-proxy jest trybem HTTP **niosącym tożsamość**, więc wywołujący mogą opcjonalnie deklarować zakresy operatora za pomocą `x-openclaw-scopes`.

Przykłady:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Zachowanie:

- Gdy nagłówek jest obecny, OpenClaw respektuje zadeklarowany zestaw zakresów.
- Gdy nagłówek jest obecny, ale pusty, żądanie deklaruje **brak** zakresów operatora.
- Gdy nagłówka nie ma, zwykłe interfejsy API HTTP niosące tożsamość wracają do standardowego domyślnego zestawu zakresów operatora.
- **Trasy HTTP Plugin** uwierzytelniane przez Gateway są domyślnie węższe: gdy `x-openclaw-scopes` jest nieobecny, ich zakres czasu wykonania wraca do `operator.write`.
- Żądania HTTP pochodzące z przeglądarki nadal muszą przejść `gateway.controlUi.allowedOrigins` (lub celowy tryb awaryjny oparty na nagłówku Host), nawet po powodzeniu uwierzytelniania trusted-proxy.

Praktyczna zasada: wysyłaj `x-openclaw-scopes` jawnie, gdy chcesz, aby żądanie trusted-proxy było węższe niż wartości domyślne, albo gdy trasa Plugin uwierzytelniana przez gateway wymaga czegoś silniejszego niż zakres zapisu.

## Lista kontrolna bezpieczeństwa

Przed włączeniem uwierzytelniania trusted-proxy sprawdź:

- [ ] **Proxy is the only path**: Port Gateway jest odizolowany zaporą od wszystkiego poza Twoim proxy.
- [ ] **trustedProxies is minimal**: Tylko rzeczywiste adresy IP Twojego proxy, a nie całe podsieci.
- [ ] **Loopback proxy source is deliberate**: Uwierzytelnianie trusted-proxy kończy się bezpieczną odmową dla żądań ze źródła loopback, chyba że `gateway.auth.trustedProxy.allowLoopback` jest jawnie włączone dla proxy na tym samym hoście.
- [ ] **Proxy strips headers**: Twoje proxy nadpisuje (nie dopisuje) nagłówki `x-forwarded-*` od klientów.
- [ ] **TLS termination**: Twoje proxy obsługuje TLS; użytkownicy łączą się przez HTTPS.
- [ ] **allowedOrigins is explicit**: Control UI poza loopback używa jawnego `gateway.controlUi.allowedOrigins`.
- [ ] **allowUsers is set** (zalecane): Ogranicz dostęp do znanych użytkowników zamiast zezwalać każdemu uwierzytelnionemu.
- [ ] **No mixed token config**: Nie ustawiaj jednocześnie `gateway.auth.token` i `gateway.auth.mode: "trusted-proxy"`.
- [ ] **Local password fallback is private**: Jeśli konfigurujesz `gateway.auth.password` dla wewnętrznych wywołań bezpośrednich, utrzymuj port Gateway za zaporą, aby zdalni klienci spoza proxy nie mogli dotrzeć do niego bezpośrednio.

## Audyt bezpieczeństwa

`openclaw security audit` oznaczy uwierzytelnianie trusted-proxy wynikiem o ważności **krytycznej**. To zamierzone — jest to przypomnienie, że delegujesz bezpieczeństwo do konfiguracji proxy.

Audyt sprawdza:

- Podstawowe ostrzeżenie/krytyczne przypomnienie `gateway.trusted_proxy_auth`
- Brak konfiguracji `trustedProxies`
- Brak konfiguracji `userHeader`
- Puste `allowUsers` (zezwala każdemu uwierzytelnionemu użytkownikowi)
- Włączone `allowLoopback` dla źródeł proxy na tym samym hoście
- Wieloznaczną lub brakującą politykę pochodzenia przeglądarki na wystawionych powierzchniach Control UI

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    Żądanie nie przyszło z adresu IP w `gateway.trustedProxies`. Sprawdź:

    - Czy adres IP proxy jest poprawny? (Adresy IP kontenerów Docker mogą się zmieniać.)
    - Czy przed proxy znajduje się load balancer?
    - Użyj `docker inspect` albo `kubectl get pods -o wide`, aby znaleźć rzeczywiste adresy IP.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw odrzucił żądanie trusted-proxy ze źródła loopback.

    Sprawdź:

    - Czy proxy łączy się z `127.0.0.1` / `::1`?
    - Czy próbujesz użyć uwierzytelniania trusted-proxy z odwrotnym proxy loopback na tym samym hoście?

    Naprawa:

    - Preferuj uwierzytelnianie tokenem/hasłem dla wewnętrznych klientów na tym samym hoście, którzy nie przechodzą przez proxy, albo
    - Kieruj ruch przez adres zaufanego proxy spoza loopback i utrzymuj ten adres IP w `gateway.trustedProxies`, albo
    - Dla celowo skonfigurowanego odwrotnego proxy na tym samym hoście ustaw `gateway.auth.trustedProxy.allowLoopback = true`, pozostaw adres loopback w `gateway.trustedProxies` i upewnij się, że proxy usuwa lub nadpisuje nagłówki tożsamości.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    Nagłówek użytkownika był pusty lub go brakowało. Sprawdź:

    - Czy proxy jest skonfigurowane do przekazywania nagłówków tożsamości?
    - Czy nazwa nagłówka jest poprawna? (wielkość liter nie ma znaczenia, ale pisownia tak)
    - Czy użytkownik jest faktycznie uwierzytelniony na proxy?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Wymagany nagłówek nie był obecny. Sprawdź:

    - Konfigurację proxy dla tych konkretnych nagłówków.
    - Czy nagłówki nie są usuwane gdzieś w łańcuchu.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    Użytkownik jest uwierzytelniony, ale nie znajduje się w `allowUsers`. Dodaj go albo usuń listę dozwolonych.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Uwierzytelnianie trusted-proxy powiodło się, ale nagłówek przeglądarki `Origin` nie przeszedł kontroli pochodzenia Control UI.

    Sprawdź:

    - `gateway.controlUi.allowedOrigins` zawiera dokładne pochodzenie przeglądarki.
    - Nie polegasz na wieloznacznych pochodzeniach, chyba że celowo chcesz zachowania zezwalającego na wszystko.
    - Jeśli celowo używasz trybu awaryjnego opartego na nagłówku Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` jest ustawione świadomie.

  </Accordion>
  <Accordion title="WebSocket nadal się nie udaje">
    Upewnij się, że Twoje proxy:

    - Obsługuje aktualizacje WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Przekazuje nagłówki tożsamości przy żądaniach aktualizacji WebSocket (nie tylko HTTP).
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
    Przetestuj konfigurację proxy niezależnie (curl z nagłówkami).
  </Step>
  <Step title="Zaktualizuj konfigurację OpenClaw">
    Zaktualizuj konfigurację OpenClaw z uwierzytelnianiem trusted-proxy.
  </Step>
  <Step title="Uruchom ponownie Gateway">
    Uruchom ponownie Gateway.
  </Step>
  <Step title="Przetestuj WebSocket">
    Przetestuj połączenia WebSocket z Control UI.
  </Step>
  <Step title="Audyt">
    Uruchom `openclaw security audit` i przejrzyj wyniki.
  </Step>
</Steps>

## Powiązane

- [Konfiguracja](/pl/gateway/configuration) — dokumentacja konfiguracji
- [Dostęp zdalny](/pl/gateway/remote) — inne wzorce dostępu zdalnego
- [Bezpieczeństwo](/pl/gateway/security) — pełny przewodnik po bezpieczeństwie
- [Tailscale](/pl/gateway/tailscale) — prostsza alternatywa dla dostępu tylko w tailnet
