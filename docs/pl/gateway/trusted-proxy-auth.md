---
read_when:
    - Uruchamianie OpenClaw za proxy rozpoznającym tożsamość მომხმარителя
    - Konfigurowanie Pomerium, Caddy lub nginx z OAuth przed OpenClaw
    - Naprawianie błędów WebSocket 1008 unauthorized w konfiguracjach z odwrotnym proxy
    - Decydowanie, gdzie ustawić HSTS i inne nagłówki utwardzające HTTP
summary: Deleguj uwierzytelnianie gateway do zaufanego odwrotnego proxy (Pomerium, Caddy, nginx + OAuth)
title: Uwierzytelnianie trusted proxy
x-i18n:
    generated_at: "2026-04-24T09:13:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: af406f218fb91c5ae2fed04921670bfc4cd3d06f51b08eec91cddde4521bf771
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

> ⚠️ **Funkcja wrażliwa z punktu widzenia bezpieczeństwa.** Ten tryb całkowicie deleguje uwierzytelnianie do Twojego odwrotnego proxy. Błędna konfiguracja może narazić Gateway na nieautoryzowany dostęp. Przed włączeniem przeczytaj tę stronę uważnie.

## Kiedy używać

Używaj trybu uwierzytelniania `trusted-proxy`, gdy:

- Uruchamiasz OpenClaw za **proxy rozpoznającym tożsamość** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- Twoje proxy obsługuje całe uwierzytelnianie i przekazuje tożsamość użytkownika przez nagłówki
- Działasz w środowisku Kubernetes lub kontenerowym, gdzie proxy jest jedyną ścieżką do Gateway
- Napotykasz błędy WebSocket `1008 unauthorized`, ponieważ przeglądarki nie mogą przekazywać tokenów w payloadach WS

## Kiedy NIE używać

- Jeśli Twoje proxy nie uwierzytelnia użytkowników (jest tylko terminatorem TLS lub load balancerem)
- Jeśli istnieje jakakolwiek ścieżka do Gateway omijająca proxy (luki w firewallu, dostęp z sieci wewnętrznej)
- Jeśli nie masz pewności, czy proxy poprawnie usuwa/nadpisuje przekazywane nagłówki
- Jeśli potrzebujesz tylko osobistego dostępu dla jednego użytkownika (rozważ Tailscale Serve + loopback dla prostszej konfiguracji)

## Jak to działa

1. Twoje odwrotne proxy uwierzytelnia użytkowników (OAuth, OIDC, SAML itd.)
2. Proxy dodaje nagłówek z tożsamością uwierzytelnionego użytkownika (np. `x-forwarded-user: nick@example.com`)
3. OpenClaw sprawdza, czy żądanie przyszło z **zaufanego IP proxy** (skonfigurowanego w `gateway.trustedProxies`)
4. OpenClaw wyodrębnia tożsamość użytkownika ze skonfigurowanego nagłówka
5. Jeśli wszystko się zgadza, żądanie zostaje autoryzowane

## Zachowanie parowania w Control UI

Gdy aktywne jest `gateway.auth.mode = "trusted-proxy"` i żądanie przejdzie
kontrole trusted-proxy, sesje WebSocket Control UI mogą łączyć się bez
tożsamości parowania urządzenia.

Konsekwencje:

- Parowanie nie jest już podstawową bramką dostępu do Control UI w tym trybie.
- Twoje zasady uwierzytelniania odwrotnego proxy i `allowUsers` stają się skuteczną kontrolą dostępu.
- Utrzymuj ingress gateway zablokowany wyłącznie do IP zaufanych proxy (`gateway.trustedProxies` + firewall).

## Konfiguracja

```json5
{
  gateway: {
    // Trusted-proxy auth expects requests from a non-loopback trusted proxy source
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
      },
    },
  },
}
```

Ważna zasada runtime:

- Uwierzytelnianie trusted-proxy odrzuca żądania ze źródła loopback (`127.0.0.1`, `::1`, zakresy CIDR loopback).
- Odwrotne proxy loopback na tym samym hoście **nie** spełniają wymagań uwierzytelniania trusted-proxy.
- W konfiguracjach z proxy loopback na tym samym hoście używaj zamiast tego uwierzytelniania tokenem/hasłem albo kieruj ruch przez adres trusted proxy spoza loopback, który OpenClaw może zweryfikować.
- Wdrożenia Control UI poza loopback nadal wymagają jawnego `gateway.controlUi.allowedOrigins`.
- **Dowody z nagłówków forwarded mają pierwszeństwo nad lokalnością loopback.** Jeśli żądanie przychodzi przez loopback, ale zawiera nagłówki `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` wskazujące na źródło nielokalne, taki dowód unieważnia twierdzenie o lokalności loopback. Żądanie jest traktowane jako zdalne na potrzeby parowania, uwierzytelniania trusted-proxy i bramkowania tożsamości urządzenia w Control UI. Zapobiega to temu, by proxy loopback na tym samym hoście „prało” tożsamość z nagłówków forwarded do uwierzytelniania trusted-proxy.

### Dokumentacja referencyjna konfiguracji

| Pole                                        | Wymagane | Opis                                                                      |
| ------------------------------------------- | -------- | ------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Tak      | Tablica adresów IP proxy, którym można ufać. Żądania z innych IP są odrzucane. |
| `gateway.auth.mode`                         | Tak      | Musi mieć wartość `"trusted-proxy"`                                       |
| `gateway.auth.trustedProxy.userHeader`      | Tak      | Nazwa nagłówka zawierającego tożsamość uwierzytelnionego użytkownika      |
| `gateway.auth.trustedProxy.requiredHeaders` | Nie      | Dodatkowe nagłówki, które muszą być obecne, aby żądanie było uznane za zaufane |
| `gateway.auth.trustedProxy.allowUsers`      | Nie      | Lista dozwolonych tożsamości użytkowników. Puste oznacza zezwolenie wszystkim uwierzytelnionym użytkownikom. |

## Terminacja TLS i HSTS

Używaj jednego punktu terminacji TLS i stosuj tam HSTS.

### Zalecany wzorzec: terminacja TLS w proxy

Gdy Twoje odwrotne proxy obsługuje HTTPS dla `https://control.example.com`, ustaw
`Strict-Transport-Security` w proxy dla tej domeny.

- Dobrze pasuje do wdrożeń wystawionych do Internetu.
- Utrzymuje certyfikaty i politykę utwardzania HTTP w jednym miejscu.
- OpenClaw może pozostać na HTTP loopback za proxy.

Przykładowa wartość nagłówka:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Terminacja TLS w Gateway

Jeśli sam OpenClaw serwuje HTTPS bez proxy terminującego TLS, ustaw:

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

`strictTransportSecurity` akceptuje wartość nagłówka jako string albo `false`, aby jawnie wyłączyć.

### Wskazówki dotyczące wdrażania

- Zacznij najpierw od krótkiego `max-age` (na przykład `max-age=300`), podczas weryfikacji ruchu.
- Zwiększaj do wartości długoterminowych (na przykład `max-age=31536000`) dopiero, gdy zaufanie będzie wysokie.
- Dodawaj `includeSubDomains` tylko wtedy, gdy każda subdomena jest gotowa na HTTPS.
- Używaj preload tylko wtedy, gdy celowo spełniasz wymagania preload dla całego zestawu domen.
- Lokalne programowanie tylko na loopback nie korzysta z HSTS.

## Przykłady konfiguracji proxy

### Pomerium

Pomerium przekazuje tożsamość w `x-pomerium-claim-email` (lub innych nagłówkach claim) oraz JWT w `x-pomerium-jwt-assertion`.

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

### Caddy z OAuth

Caddy z Pluginem `caddy-security` może uwierzytelniać użytkowników i przekazywać nagłówki tożsamości.

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

### nginx + oauth2-proxy

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

### Traefik z Forward Auth

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

## Mieszana konfiguracja tokenu

OpenClaw odrzuca niejednoznaczne konfiguracje, w których jednocześnie aktywne są `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`) i tryb `trusted-proxy`. Mieszane konfiguracje tokenów mogą sprawić, że żądania loopback będą po cichu uwierzytelniane nieprawidłową ścieżką uwierzytelniania.

Jeśli przy uruchamianiu zobaczysz błąd `mixed_trusted_proxy_token`:

- Usuń współdzielony token przy używaniu trybu trusted-proxy albo
- Przełącz `gateway.auth.mode` na `"token"`, jeśli zamierzasz używać uwierzytelniania opartego na tokenie.

Uwierzytelnianie trusted-proxy przez loopback również kończy się bezpieczną blokadą: wywołujący z tego samego hosta muszą dostarczyć skonfigurowane nagłówki tożsamości przez zaufane proxy zamiast być po cichu uwierzytelniani.

## Nagłówek zakresów operatora

Uwierzytelnianie trusted-proxy to tryb HTTP **oparty na tożsamości**, więc wywołujący mogą
opcjonalnie deklarować zakresy operatora przez `x-openclaw-scopes`.

Przykłady:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Zachowanie:

- Gdy nagłówek jest obecny, OpenClaw respektuje zadeklarowany zestaw zakresów.
- Gdy nagłówek jest obecny, ale pusty, żądanie deklaruje **brak** zakresów operatora.
- Gdy nagłówek jest nieobecny, zwykłe API HTTP oparte na tożsamości wracają do standardowego domyślnego zestawu zakresów operatora.
- Trasy HTTP Pluginów z uwierzytelnianiem gateway są domyślnie węższe: gdy `x-openclaw-scopes` jest nieobecny, ich zakres runtime wraca do `operator.write`.
- Żądania HTTP pochodzące z przeglądarki nadal muszą przejść `gateway.controlUi.allowedOrigins` (lub celowy tryb awaryjny Host-header), nawet po udanym uwierzytelnianiu trusted-proxy.

Praktyczna zasada:

- Wysyłaj `x-openclaw-scopes` jawnie, gdy chcesz, aby żądanie trusted-proxy
  było węższe niż wartości domyślne albo gdy trasa Pluginu z uwierzytelnianiem gateway potrzebuje
  czegoś silniejszego niż zakres zapisu.

## Lista kontrolna bezpieczeństwa

Przed włączeniem uwierzytelniania trusted-proxy upewnij się, że:

- [ ] **Proxy jest jedyną ścieżką**: port Gateway jest odgrodzony firewallem od wszystkiego poza Twoim proxy
- [ ] **trustedProxies jest minimalne**: tylko rzeczywiste IP Twojego proxy, a nie całe podsieci
- [ ] **Brak źródła proxy na loopback**: uwierzytelnianie trusted-proxy kończy się bezpieczną blokadą dla żądań ze źródła loopback
- [ ] **Proxy usuwa nagłówki**: Twoje proxy nadpisuje (a nie dopisuje) nagłówki `x-forwarded-*` od klientów
- [ ] **Terminacja TLS**: Twoje proxy obsługuje TLS; użytkownicy łączą się przez HTTPS
- [ ] **allowedOrigins jest jawne**: Control UI poza loopback używa jawnego `gateway.controlUi.allowedOrigins`
- [ ] **allowUsers jest ustawione** (zalecane): ogranicz do znanych użytkowników zamiast zezwalać każdemu uwierzytelnionemu
- [ ] **Brak mieszanej konfiguracji tokenu**: nie ustawiaj jednocześnie `gateway.auth.token` i `gateway.auth.mode: "trusted-proxy"`

## Audyt bezpieczeństwa

`openclaw security audit` oznaczy uwierzytelnianie trusted-proxy jako ustalenie o **krytycznej** wadze. Jest to zamierzone — ma przypominać, że delegujesz bezpieczeństwo do konfiguracji proxy.

Audyt sprawdza:

- Bazowe ostrzeżenie/przypomnienie krytyczne `gateway.trusted_proxy_auth`
- Brakującą konfigurację `trustedProxies`
- Brakującą konfigurację `userHeader`
- Puste `allowUsers` (zezwala każdemu uwierzytelnionemu użytkownikowi)
- Wieloznaczną lub brakującą politykę pochodzenia przeglądarki na wystawionych powierzchniach Control UI

## Rozwiązywanie problemów

### „trusted_proxy_untrusted_source”

Żądanie nie przyszło z IP znajdującego się w `gateway.trustedProxies`. Sprawdź:

- Czy IP proxy jest poprawne? (IP kontenerów Docker może się zmieniać)
- Czy przed proxy znajduje się load balancer?
- Użyj `docker inspect` lub `kubectl get pods -o wide`, aby znaleźć rzeczywiste IP

### „trusted_proxy_loopback_source”

OpenClaw odrzucił żądanie trusted-proxy ze źródła loopback.

Sprawdź:

- Czy proxy łączy się z `127.0.0.1` / `::1`?
- Czy próbujesz używać uwierzytelniania trusted-proxy z odwrotnym proxy loopback na tym samym hoście?

Poprawka:

- Użyj uwierzytelniania tokenem/hasłem w konfiguracjach z proxy loopback na tym samym hoście albo
- Kieruj ruch przez adres trusted proxy spoza loopback i utrzymuj ten IP w `gateway.trustedProxies`.

### „trusted_proxy_user_missing”

Nagłówek użytkownika był pusty lub nieobecny. Sprawdź:

- Czy Twoje proxy jest skonfigurowane do przekazywania nagłówków tożsamości?
- Czy nazwa nagłówka jest poprawna? (wielkość liter nie ma znaczenia, ale pisownia już tak)
- Czy użytkownik jest rzeczywiście uwierzytelniony w proxy?

### „trusted*proxy_missing_header*\*”

Wymagany nagłówek nie był obecny. Sprawdź:

- Konfigurację proxy dla tych konkretnych nagłówków
- Czy nagłówki nie są usuwane gdzieś po drodze

### „trusted_proxy_user_not_allowed”

Użytkownik jest uwierzytelniony, ale nie znajduje się w `allowUsers`. Albo go dodaj, albo usuń listę dozwolonych.

### „trusted_proxy_origin_not_allowed”

Uwierzytelnianie trusted-proxy się powiodło, ale nagłówek przeglądarki `Origin` nie przeszedł kontroli origin w Control UI.

Sprawdź:

- Czy `gateway.controlUi.allowedOrigins` zawiera dokładny origin przeglądarki
- Czy nie polegasz na originach wieloznacznych, chyba że celowo chcesz zezwalać wszystkim
- Jeśli celowo używasz trybu awaryjnego Host-header, czy `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` jest ustawione świadomie

### WebSocket nadal nie działa

Upewnij się, że Twoje proxy:

- Obsługuje ulepszenia WebSocket (`Upgrade: websocket`, `Connection: upgrade`)
- Przekazuje nagłówki tożsamości przy żądaniach ulepszenia WebSocket (nie tylko dla HTTP)
- Nie ma oddzielnej ścieżki uwierzytelniania dla połączeń WebSocket

## Migracja z uwierzytelniania tokenem

Jeśli przechodzisz z uwierzytelniania tokenem na trusted-proxy:

1. Skonfiguruj proxy tak, aby uwierzytelniało użytkowników i przekazywało nagłówki
2. Przetestuj konfigurację proxy niezależnie (`curl` z nagłówkami)
3. Zaktualizuj konfigurację OpenClaw o uwierzytelnianie trusted-proxy
4. Uruchom ponownie Gateway
5. Przetestuj połączenia WebSocket z Control UI
6. Uruchom `openclaw security audit` i przejrzyj ustalenia

## Powiązane

- [Security](/pl/gateway/security) — pełny przewodnik bezpieczeństwa
- [Configuration](/pl/gateway/configuration) — dokumentacja referencyjna konfiguracji
- [Remote Access](/pl/gateway/remote) — inne wzorce dostępu zdalnego
- [Tailscale](/pl/gateway/tailscale) — prostsza alternatywa dla dostępu tylko przez tailnet
