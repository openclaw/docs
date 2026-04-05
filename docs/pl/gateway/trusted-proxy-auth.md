---
read_when:
    - Uruchamianie OpenClaw za proxy świadomym tożsamości
    - Konfigurowanie Pomerium, Caddy lub nginx z OAuth przed OpenClaw
    - Naprawianie błędów WebSocket 1008 unauthorized w konfiguracjach reverse proxy
    - Decydowanie, gdzie ustawić HSTS i inne nagłówki utwardzające HTTP
summary: Delegowanie uwierzytelniania gateway do zaufanego reverse proxy (Pomerium, Caddy, nginx + OAuth)
title: Trusted Proxy Auth
x-i18n:
    generated_at: "2026-04-05T13:55:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: ccd39736b43e8744de31566d5597b3fbf40ecb6ba9c8ba9d2343e1ab9bb8cd45
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

# Trusted Proxy Auth

> ⚠️ **Funkcja wrażliwa na bezpieczeństwo.** Ten tryb całkowicie deleguje uwierzytelnianie do reverse proxy. Błędna konfiguracja może narazić Twój Gateway na nieautoryzowany dostęp. Przeczytaj uważnie tę stronę przed włączeniem.

## Kiedy używać

Użyj trybu uwierzytelniania `trusted-proxy`, gdy:

- Uruchamiasz OpenClaw za **proxy świadomym tożsamości** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- Twoje proxy obsługuje całe uwierzytelnianie i przekazuje tożsamość użytkownika przez nagłówki
- Jesteś w środowisku Kubernetes lub kontenerowym, gdzie proxy jest jedyną drogą do Gateway
- Trafiasz na błędy WebSocket `1008 unauthorized`, ponieważ przeglądarki nie mogą przekazywać tokenów w ładunkach WS

## Kiedy NIE używać

- Jeśli Twoje proxy nie uwierzytelnia użytkowników (jest tylko terminatorem TLS lub load balancerem)
- Jeśli istnieje jakakolwiek ścieżka do Gateway, która omija proxy (dziury w firewallu, dostęp przez sieć wewnętrzną)
- Jeśli nie masz pewności, czy Twoje proxy poprawnie usuwa/nadpisuje przekazywane nagłówki
- Jeśli potrzebujesz tylko osobistego dostępu dla pojedynczego użytkownika (rozważ Tailscale Serve + loopback dla prostszej konfiguracji)

## Jak to działa

1. Twoje reverse proxy uwierzytelnia użytkowników (OAuth, OIDC, SAML itd.)
2. Proxy dodaje nagłówek z tożsamością uwierzytelnionego użytkownika (np. `x-forwarded-user: nick@example.com`)
3. OpenClaw sprawdza, czy żądanie pochodzi z **zaufanego adresu IP proxy** (skonfigurowanego w `gateway.trustedProxies`)
4. OpenClaw wyodrębnia tożsamość użytkownika ze skonfigurowanego nagłówka
5. Jeśli wszystko się zgadza, żądanie zostaje autoryzowane

## Zachowanie parowania w Control UI

Gdy `gateway.auth.mode = "trusted-proxy"` jest aktywne i żądanie przejdzie
kontrole trusted-proxy, sesje WebSocket Control UI mogą łączyć się bez
tożsamości parowania urządzenia.

Konsekwencje:

- Parowanie nie jest już główną bramką dostępu do Control UI w tym trybie.
- Polityka uwierzytelniania Twojego reverse proxy i `allowUsers` stają się skuteczną kontrolą dostępu.
- Utrzymuj ingress gateway zablokowany wyłącznie do zaufanych adresów IP proxy (`gateway.trustedProxies` + firewall).

## Konfiguracja

```json5
{
  gateway: {
    // Trusted-proxy auth oczekuje żądań ze źródła zaufanego proxy spoza loopback
    bind: "lan",

    // KRYTYCZNE: dodaj tu tylko adresy IP Twojego proxy
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Nagłówek zawierający tożsamość uwierzytelnionego użytkownika (wymagany)
        userHeader: "x-forwarded-user",

        // Opcjonalnie: nagłówki, które MUSZĄ być obecne (weryfikacja proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Opcjonalnie: ograniczenie do konkretnych użytkowników (puste = zezwalaj wszystkim)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

Ważna reguła środowiska uruchomieniowego:

- Uwierzytelnianie trusted-proxy odrzuca żądania ze źródła loopback (`127.0.0.1`, `::1`, zakresy CIDR loopback).
- Reverse proxy loopback na tym samym hoście **nie** spełniają wymagań uwierzytelniania trusted-proxy.
- Dla konfiguracji proxy loopback na tym samym hoście użyj zamiast tego uwierzytelniania tokenem/hasłem albo kieruj ruch przez zaufany adres proxy spoza loopback, który OpenClaw może zweryfikować.
- Wdrożenia Control UI spoza loopback nadal wymagają jawnego `gateway.controlUi.allowedOrigins`.

### Dokumentacja konfiguracji

| Pole                                        | Wymagane | Opis                                                                        |
| ------------------------------------------- | -------- | --------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Tak      | Tablica adresów IP proxy, którym można ufać. Żądania z innych adresów IP są odrzucane. |
| `gateway.auth.mode`                         | Tak      | Musi mieć wartość `"trusted-proxy"`                                         |
| `gateway.auth.trustedProxy.userHeader`      | Tak      | Nazwa nagłówka zawierającego tożsamość uwierzytelnionego użytkownika        |
| `gateway.auth.trustedProxy.requiredHeaders` | Nie      | Dodatkowe nagłówki, które muszą być obecne, aby żądanie było zaufane        |
| `gateway.auth.trustedProxy.allowUsers`      | Nie      | Allowlista tożsamości użytkowników. Puste oznacza zezwolenie wszystkim uwierzytelnionym użytkownikom. |

## Terminacja TLS i HSTS

Użyj jednego punktu terminacji TLS i zastosuj tam HSTS.

### Zalecany wzorzec: terminacja TLS na proxy

Gdy Twoje reverse proxy obsługuje HTTPS dla `https://control.example.com`, ustaw
`Strict-Transport-Security` na proxy dla tej domeny.

- Dobre dopasowanie do wdrożeń wystawionych do internetu.
- Utrzymuje certyfikat i politykę utwardzania HTTP w jednym miejscu.
- OpenClaw może pozostać na HTTP loopback za proxy.

Przykładowa wartość nagłówka:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Terminacja TLS w Gateway

Jeśli sam OpenClaw bezpośrednio udostępnia HTTPS (bez proxy terminującego TLS), ustaw:

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

### Wskazówki wdrożeniowe

- Zacznij najpierw od krótkiego `max-age` (na przykład `max-age=300`) podczas weryfikacji ruchu.
- Zwiększ do długotrwałych wartości (na przykład `max-age=31536000`) dopiero wtedy, gdy poziom pewności będzie wysoki.
- Dodaj `includeSubDomains` tylko wtedy, gdy każda subdomena jest gotowa na HTTPS.
- Używaj preload tylko wtedy, gdy celowo spełniasz wymagania preload dla pełnego zestawu swoich domen.
- Lokalny development tylko na loopback nie korzysta z HSTS.

## Przykłady konfiguracji proxy

### Pomerium

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

### Caddy z OAuth

Caddy z pluginem `caddy-security` może uwierzytelniać użytkowników i przekazywać nagłówki tożsamości.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // adres IP proxy Caddy/sidecar
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

### Traefik z Forward Auth

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

## Mieszana konfiguracja tokenów

OpenClaw odrzuca niejednoznaczne konfiguracje, w których zarówno `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`), jak i tryb `trusted-proxy` są aktywne jednocześnie. Mieszane konfiguracje tokenów mogą powodować, że żądania loopback będą po cichu uwierzytelniane niewłaściwą ścieżką uwierzytelniania.

Jeśli przy uruchamianiu widzisz błąd `mixed_trusted_proxy_token`:

- Usuń współdzielony token, gdy używasz trybu trusted-proxy, albo
- Przełącz `gateway.auth.mode` na `"token"`, jeśli zamierzasz używać uwierzytelniania tokenem.

Uwierzytelnianie trusted-proxy dla loopback także kończy się w trybie zamkniętym: wywołujący z tego samego hosta muszą dostarczyć skonfigurowane nagłówki tożsamości przez zaufane proxy, zamiast być po cichu uwierzytelniani.

## Nagłówek zakresów operatora

Uwierzytelnianie trusted-proxy to tryb HTTP **niosący tożsamość**, więc wywołujący mogą
opcjonalnie deklarować zakresy operatora za pomocą `x-openclaw-scopes`.

Przykłady:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Zachowanie:

- Gdy nagłówek jest obecny, OpenClaw honoruje zadeklarowany zestaw zakresów.
- Gdy nagłówek jest obecny, ale pusty, żądanie deklaruje **brak** zakresów operatora.
- Gdy nagłówek jest nieobecny, zwykłe interfejsy API HTTP niosące tożsamość wracają do standardowego domyślnego zestawu zakresów operatora.
- Trasy HTTP pluginów **gateway-auth** są domyślnie węższe: gdy `x-openclaw-scopes` jest nieobecny, ich zakres środowiska uruchomieniowego wraca do `operator.write`.
- Żądania HTTP pochodzące z przeglądarki nadal muszą przejść `gateway.controlUi.allowedOrigins` (lub zamierzony tryb fallbacku nagłówka Host) nawet po pomyślnym uwierzytelnieniu trusted-proxy.

Praktyczna zasada:

- Wysyłaj `x-openclaw-scopes` jawnie, gdy chcesz, aby żądanie trusted-proxy
  było węższe niż wartości domyślne, albo gdy trasa pluginu gateway-auth potrzebuje
  czegoś silniejszego niż zakres write.

## Lista kontrolna bezpieczeństwa

Przed włączeniem uwierzytelniania trusted-proxy sprawdź:

- [ ] **Proxy jest jedyną ścieżką**: port Gateway jest odgrodzony firewallem od wszystkiego poza Twoim proxy
- [ ] **trustedProxies jest minimalne**: tylko rzeczywiste adresy IP Twojego proxy, nie całe podsieci
- [ ] **Brak źródła proxy loopback**: uwierzytelnianie trusted-proxy kończy się w trybie zamkniętym dla żądań ze źródła loopback
- [ ] **Proxy usuwa nagłówki**: Twoje proxy nadpisuje (a nie dopisuje) nagłówki `x-forwarded-*` od klientów
- [ ] **Terminacja TLS**: Twoje proxy obsługuje TLS; użytkownicy łączą się przez HTTPS
- [ ] **allowedOrigins jest jawne**: Control UI spoza loopback używa jawnego `gateway.controlUi.allowedOrigins`
- [ ] **allowUsers jest ustawione** (zalecane): ogranicz do znanych użytkowników zamiast dopuszczać każdego uwierzytelnionego
- [ ] **Brak mieszanej konfiguracji tokenów**: nie ustawiaj jednocześnie `gateway.auth.token` i `gateway.auth.mode: "trusted-proxy"`

## Audyt bezpieczeństwa

`openclaw security audit` oznaczy uwierzytelnianie trusted-proxy jako wykrycie o **krytycznym** poziomie ważności. Jest to celowe — ma przypominać, że delegujesz bezpieczeństwo do konfiguracji swojego proxy.

Audyt sprawdza:

- Bazowe ostrzeżenie/przypomnienie krytyczne `gateway.trusted_proxy_auth`
- Brak konfiguracji `trustedProxies`
- Brak konfiguracji `userHeader`
- Puste `allowUsers` (zezwala każdemu uwierzytelnionemu użytkownikowi)
- Politykę pochodzenia przeglądarki z wildcardem lub brakującą na wystawionych powierzchniach Control UI

## Rozwiązywanie problemów

### `trusted_proxy_untrusted_source`

Żądanie nie przyszło z adresu IP znajdującego się w `gateway.trustedProxies`. Sprawdź:

- Czy adres IP proxy jest poprawny? (adresy IP kontenerów Docker mogą się zmieniać)
- Czy przed Twoim proxy znajduje się load balancer?
- Użyj `docker inspect` lub `kubectl get pods -o wide`, aby znaleźć rzeczywiste adresy IP

### `trusted_proxy_loopback_source`

OpenClaw odrzucił żądanie trusted-proxy ze źródła loopback.

Sprawdź:

- Czy proxy łączy się z `127.0.0.1` / `::1`?
- Czy próbujesz używać uwierzytelniania trusted-proxy z reverse proxy loopback na tym samym hoście?

Naprawa:

- Użyj uwierzytelniania tokenem/hasłem dla konfiguracji proxy loopback na tym samym hoście, albo
- Kieruj ruch przez zaufany adres proxy spoza loopback i utrzymuj ten adres IP w `gateway.trustedProxies`.

### `trusted_proxy_user_missing`

Nagłówek użytkownika był pusty lub go brakowało. Sprawdź:

- Czy Twoje proxy jest skonfigurowane do przekazywania nagłówków tożsamości?
- Czy nazwa nagłówka jest poprawna? (wielkość liter nie ma znaczenia, ale pisownia tak)
- Czy użytkownik jest faktycznie uwierzytelniony w proxy?

### `trusted*proxy_missing_header*\*`

Wymagany nagłówek nie był obecny. Sprawdź:

- Konfigurację Twojego proxy dla tych konkretnych nagłówków
- Czy nagłówki nie są gdzieś po drodze usuwane

### `trusted_proxy_user_not_allowed`

Użytkownik jest uwierzytelniony, ale nie znajduje się w `allowUsers`. Dodaj go albo usuń allowlistę.

### `trusted_proxy_origin_not_allowed`

Uwierzytelnianie trusted-proxy powiodło się, ale nagłówek przeglądarki `Origin` nie przeszedł kontroli pochodzenia Control UI.

Sprawdź:

- Czy `gateway.controlUi.allowedOrigins` zawiera dokładne pochodzenie przeglądarki
- Czy nie polegasz na wildcard origins, chyba że celowo chcesz zachowanie allow-all
- Jeśli celowo używasz trybu fallbacku nagłówka Host, czy `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` zostało ustawione świadomie

### WebSocket nadal nie działa

Upewnij się, że Twoje proxy:

- Obsługuje podniesienia WebSocket (`Upgrade: websocket`, `Connection: upgrade`)
- Przekazuje nagłówki tożsamości przy żądaniach podniesienia WebSocket (nie tylko dla HTTP)
- Nie ma osobnej ścieżki uwierzytelniania dla połączeń WebSocket

## Migracja z uwierzytelniania tokenem

Jeśli przechodzisz z uwierzytelniania tokenem na trusted-proxy:

1. Skonfiguruj proxy, aby uwierzytelniało użytkowników i przekazywało nagłówki
2. Przetestuj konfigurację proxy niezależnie (curl z nagłówkami)
3. Zaktualizuj konfigurację OpenClaw o uwierzytelnianie trusted-proxy
4. Zrestartuj Gateway
5. Przetestuj połączenia WebSocket z Control UI
6. Uruchom `openclaw security audit` i przejrzyj wykrycia

## Powiązane

- [Security](/gateway/security) — pełny przewodnik po bezpieczeństwie
- [Configuration](/gateway/configuration) — dokumentacja konfiguracji
- [Remote Access](/gateway/remote) — inne wzorce zdalnego dostępu
- [Tailscale](/gateway/tailscale) — prostsza alternatywa dla dostępu tylko przez tailnet
