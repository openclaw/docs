---
read_when:
    - Uruchamianie OpenClaw za proxy świadomym tożsamości
    - Konfigurowanie Pomerium, Caddy lub nginx z OAuth przed OpenClaw
    - Naprawianie błędów WebSocket 1008 unauthorized w konfiguracjach z reverse proxy
    - Decydowanie, gdzie ustawić HSTS i inne nagłówki wzmacniające zabezpieczenia HTTP
sidebarTitle: Trusted proxy auth
summary: Deleguj uwierzytelnianie Gateway do zaufanego odwrotnego proxy (Pomerium, Caddy, nginx + OAuth)
title: Uwierzytelnianie zaufanego proxy
x-i18n:
    generated_at: "2026-06-27T17:38:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 498a8aca666f88201302af3895b11ba43ab9c0b1bff00a262145fc9e21e80fa7
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Funkcja wrażliwa pod względem bezpieczeństwa.** Ten tryb deleguje uwierzytelnianie całkowicie do Twojego reverse proxy. Błędna konfiguracja może narazić Twój Gateway na nieautoryzowany dostęp. Przeczytaj tę stronę uważnie przed włączeniem.
</Warning>

## Kiedy używać

Używaj trybu uwierzytelniania `trusted-proxy`, gdy:

- Uruchamiasz OpenClaw za **proxy świadomym tożsamości** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Twoje proxy obsługuje całe uwierzytelnianie i przekazuje tożsamość użytkownika przez nagłówki.
- Pracujesz w środowisku Kubernetes lub kontenerowym, gdzie proxy jest jedyną ścieżką do Gateway.
- Napotykasz błędy WebSocket `1008 unauthorized`, ponieważ przeglądarki nie mogą przekazywać tokenów w ładunkach WS.

## Kiedy NIE używać

- Jeśli Twoje proxy nie uwierzytelnia użytkowników (jest tylko terminatorem TLS albo load balancerem).
- Jeśli istnieje jakakolwiek ścieżka do Gateway, która omija proxy (luki w firewallu, dostęp z sieci wewnętrznej).
- Jeśli nie masz pewności, czy Twoje proxy poprawnie usuwa/nadpisuje przekazywane nagłówki.
- Jeśli potrzebujesz tylko osobistego dostępu dla jednego użytkownika (rozważ Tailscale Serve + loopback dla prostszej konfiguracji).

## Jak to działa

<Steps>
  <Step title="Proxy uwierzytelnia użytkownika">
    Twoje reverse proxy uwierzytelnia użytkowników (OAuth, OIDC, SAML itd.).
  </Step>
  <Step title="Proxy dodaje nagłówek tożsamości">
    Proxy dodaje nagłówek z tożsamością uwierzytelnionego użytkownika (np. `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway weryfikuje zaufane źródło">
    OpenClaw sprawdza, czy żądanie przyszło z **zaufanego adresu IP proxy** (skonfigurowanego w `gateway.trustedProxies`).
  </Step>
  <Step title="Gateway wyodrębnia tożsamość">
    OpenClaw wyodrębnia tożsamość użytkownika ze skonfigurowanego nagłówka.
  </Step>
  <Step title="Autoryzacja">
    Jeśli wszystko się zgadza, żądanie zostaje autoryzowane.
  </Step>
</Steps>

## Zachowanie parowania Control UI

Gdy `gateway.auth.mode = "trusted-proxy"` jest aktywne, a żądanie przejdzie kontrole trusted-proxy, sesje WebSocket Control UI mogą łączyć się bez tożsamości parowania urządzenia.

Implikacje zakresu:

- Sesje WebSocket Control UI bez urządzenia łączą się, ale domyślnie nie otrzymują żadnych zakresów operatora. OpenClaw czyści żądaną listę zakresów do `[]`, aby sesja, która nie jest powiązana z zatwierdzonym sparowanym urządzeniem/tokenem, nie mogła samodzielnie deklarować uprawnień.
- Jeśli metody kończą się błędem `missing scope` po udanym połączeniu WebSocket, użyj HTTPS, aby przeglądarka mogła wygenerować tożsamość urządzenia i dokończyć parowanie. Zobacz [niezabezpieczony HTTP Control UI](/pl/web/control-ui#insecure-http).
- Tylko awaryjnie: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` zachowuje żądane zakresy nawet bez tożsamości urządzenia. To poważne obniżenie poziomu bezpieczeństwa; szybko je wycofaj. Zobacz [niezabezpieczony HTTP Control UI](/pl/web/control-ui#insecure-http).

Ograniczanie zakresów przez reverse proxy:

- Jeśli Twoje proxy wysyła `x-openclaw-scopes` w żądaniu aktualizacji WebSocket Control UI, OpenClaw ogranicza zakresy sesji do części wspólnej żądanych zakresów i zadeklarowanych zakresów. Ten nagłówek nie przyznaje zakresów; tylko zawęża to, co sesja może posiadać.

Implikacje:

- Parowanie nie jest już główną bramą dostępu do Control UI w tym trybie.
- Polityka uwierzytelniania Twojego reverse proxy i `allowUsers` stają się faktyczną kontrolą dostępu.
- Ogranicz dostęp przychodzący do Gateway wyłącznie do zaufanych adresów IP proxy (`gateway.trustedProxies` + firewall).

Niestandardowi klienci WebSocket nie są sesjami Control UI. `gateway.controlUi.dangerouslyDisableDeviceAuth` nie przyznaje zakresów dowolnym klientom `client.mode: "backend"` ani klientom o kształcie CLI. Niestandardowa automatyzacja powinna używać tożsamości urządzenia/parowania, zarezerwowanej bezpośredniej lokalnej ścieżki pomocniczej backendu `client.id: "gateway-client"` albo [Pluginu admin HTTP RPC](/pl/plugins/admin-http-rpc), gdy powierzchnia żądanie/odpowiedź HTTP pasuje lepiej.

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

- Uwierzytelnianie trusted-proxy domyślnie odrzuca żądania ze źródła loopback (`127.0.0.1`, `::1`, CIDR loopback).
- Reverse proxy loopback na tym samym hoście **nie** spełnia wymagań uwierzytelniania trusted-proxy, chyba że jawnie ustawisz `gateway.auth.trustedProxy.allowLoopback = true` i uwzględnisz adres loopback w `gateway.trustedProxies`.
- `allowLoopback` ufa lokalnym procesom na hoście Gateway w takim samym stopniu jak reverse proxy. Włączaj to tylko wtedy, gdy Gateway nadal jest chroniony firewallem przed bezpośrednim dostępem zdalnym, a lokalne proxy usuwa lub nadpisuje nagłówki tożsamości dostarczone przez klienta.
- Wewnętrzni klienci Gateway, którzy nie przechodzą przez reverse proxy, powinni używać `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, a nie nagłówków tożsamości trusted-proxy.
- Nieloopbackowe wdrożenia Control UI nadal wymagają jawnego `gateway.controlUi.allowedOrigins`.
- **Dowody z przekazywanych nagłówków zastępują lokalność loopback dla lokalnego bezpośredniego fallbacku.** Jeśli żądanie przychodzi przez loopback, ale zawiera dowody w nagłówkach `Forwarded`, dowolnym `X-Forwarded-*` lub `X-Real-IP`, te dowody dyskwalifikują fallback lokalnego bezpośredniego hasła i bramkowanie tożsamości urządzenia. Przy `allowLoopback: true` uwierzytelnianie trusted-proxy nadal może zaakceptować żądanie jako żądanie proxy na tym samym hoście, a `requiredHeaders` i `allowUsers` nadal mają zastosowanie.

</Warning>

### Referencja konfiguracji

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
  Dodatkowe nagłówki, które muszą być obecne, aby żądanie było zaufane.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Lista dozwolonych tożsamości użytkowników. Pusta oznacza zezwolenie wszystkim uwierzytelnionym użytkownikom.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  Opcjonalna obsługa reverse proxy loopback na tym samym hoście. Domyślnie `false`.
</ParamField>

<Warning>
Włączaj `allowLoopback` tylko wtedy, gdy lokalne reverse proxy jest zamierzoną granicą zaufania. Każdy lokalny proces, który może połączyć się z Gateway, może próbować wysyłać nagłówki tożsamości proxy, więc utrzymuj bezpośredni dostęp do Gateway jako prywatny dla hosta i wymagaj nagłówków należących do proxy, takich jak `x-forwarded-proto`, albo podpisanego nagłówka asercji, jeśli Twoje proxy go obsługuje.
</Warning>

## Terminacja TLS i HSTS

Użyj jednego punktu terminacji TLS i zastosuj tam HSTS.

<Tabs>
  <Tab title="Terminacja TLS w proxy (zalecane)">
    Gdy Twoje reverse proxy obsługuje HTTPS dla `https://control.example.com`, ustaw `Strict-Transport-Security` w proxy dla tej domeny.

    - Dobre dopasowanie do wdrożeń wystawionych do internetu.
    - Utrzymuje certyfikat i politykę utwardzania HTTP w jednym miejscu.
    - OpenClaw może pozostać za proxy na HTTP loopback.

    Przykładowa wartość nagłówka:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Terminacja TLS w Gateway">
    Jeśli sam OpenClaw obsługuje HTTPS bezpośrednio (bez proxy terminującego TLS), ustaw:

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

    `strictTransportSecurity` przyjmuje tekstową wartość nagłówka albo `false`, aby jawnie wyłączyć.

  </Tab>
</Tabs>

### Wskazówki wdrożeniowe

- Zacznij najpierw od krótkiego maksymalnego wieku (na przykład `max-age=300`) podczas walidacji ruchu.
- Zwiększ do wartości długotrwałych (na przykład `max-age=31536000`) dopiero po uzyskaniu wysokiej pewności.
- Dodaj `includeSubDomains` tylko wtedy, gdy każda subdomena jest gotowa na HTTPS.
- Używaj preload tylko wtedy, gdy celowo spełniasz wymagania preload dla całego zestawu domen.
- Lokalne programowanie wyłącznie na loopback nie odnosi korzyści z HSTS.

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
  <Accordion title="Caddy z OAuth">
    Caddy z pluginem `caddy-security` może uwierzytelniać użytkowników i przekazywać nagłówki tożsamości.

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
  <Accordion title="Traefik z forward auth">
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

OpenClaw odrzuca niejednoznaczne konfiguracje, w których jednocześnie aktywne są `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`) oraz tryb `trusted-proxy`. Mieszane konfiguracje tokenów mogą powodować, że żądania loopback po cichu uwierzytelniają się niewłaściwą ścieżką uwierzytelniania.

Jeśli zobaczysz błąd `mixed_trusted_proxy_token` podczas uruchamiania:

- Usuń współdzielony token podczas używania trybu trusted-proxy albo
- Przełącz `gateway.auth.mode` na `"token"`, jeśli zamierzasz używać uwierzytelniania opartego na tokenach.

Nagłówki tożsamości zaufanego proxy dla loopback nadal odmawiają dostępu domyślnie: wywołujący z tego samego hosta nie są po cichu uwierzytelniani jako użytkownicy proxy. Wewnętrzni wywołujący OpenClaw, którzy omijają proxy, mogą zamiast tego uwierzytelniać się za pomocą `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Awaryjne użycie tokena pozostaje celowo nieobsługiwane w trybie zaufanego proxy.

## Nagłówek zakresów operatora

Uwierzytelnianie przez zaufane proxy to tryb HTTP **niosący tożsamość**, więc wywołujący mogą opcjonalnie deklarować zakresy operatora za pomocą `x-openclaw-scopes` w żądaniach HTTP API.

Uwaga: zakresy WebSocket są określane przez uzgadnianie protokołu Gateway i powiązanie tożsamości urządzenia. W żądaniach aktualizacji WebSocket Control UI `x-openclaw-scopes` jest wyłącznie limitem wynegocjowanych zakresów sesji, a nie nadaniem uprawnień. Zachowanie zakresów WebSocket z zaufanym proxy opisuje sekcja [zachowanie parowania Control UI](#control-ui-pairing-behavior).

Przykłady:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Zachowanie:

- Gdy nagłówek jest obecny, OpenClaw respektuje zadeklarowany zestaw zakresów.
- Gdy nagłówek jest obecny, ale pusty, żądanie deklaruje **brak** zakresów operatora.
- Gdy nagłówka nie ma, zwykłe HTTP API niosące tożsamość wracają do standardowego domyślnego zestawu zakresów operatora.
- **Trasy HTTP Plugin** uwierzytelniane przez Gateway są domyślnie węższe: gdy `x-openclaw-scopes` nie występuje, ich zakres środowiska uruchomieniowego wraca do `operator.write`.
- Żądania HTTP pochodzące z przeglądarki nadal muszą przejść `gateway.controlUi.allowedOrigins` (albo celowy tryb awaryjny na podstawie nagłówka Host), nawet po powodzeniu uwierzytelniania przez zaufane proxy.
- Dla sesji WebSocket Control UI `x-openclaw-scopes` jest limitem zakresu, gdy występuje w żądaniu aktualizacji. Pusta wartość nie daje żadnych zakresów.

Praktyczna zasada: wysyłaj `x-openclaw-scopes` jawnie, gdy chcesz, aby żądanie zaufanego proxy było węższe niż wartości domyślne, albo gdy trasa Plugin uwierzytelniana przez Gateway potrzebuje czegoś silniejszego niż zakres zapisu.

## Lista kontrolna bezpieczeństwa

Przed włączeniem uwierzytelniania przez zaufane proxy sprawdź:

- [ ] **Proxy jest jedyną ścieżką**: port Gateway jest odgrodzony zaporą od wszystkiego poza Twoim proxy.
- [ ] **trustedProxies jest minimalne**: tylko rzeczywiste adresy IP proxy, nie całe podsieci.
- [ ] **Źródło proxy loopback jest celowe**: uwierzytelnianie przez zaufane proxy odmawia dostępu domyślnie dla żądań ze źródła loopback, chyba że `gateway.auth.trustedProxy.allowLoopback` jest jawnie włączone dla proxy na tym samym hoście.
- [ ] **Proxy usuwa nagłówki**: Twoje proxy nadpisuje (nie dopisuje) nagłówki `x-forwarded-*` od klientów.
- [ ] **Terminacja TLS**: Twoje proxy obsługuje TLS; użytkownicy łączą się przez HTTPS.
- [ ] **allowedOrigins jest jawne**: Control UI poza loopback używa jawnego `gateway.controlUi.allowedOrigins`.
- [ ] **allowUsers jest ustawione** (zalecane): ogranicz dostęp do znanych użytkowników zamiast dopuszczać każdego uwierzytelnionego.
- [ ] **Brak mieszanej konfiguracji tokenów**: nie ustawiaj jednocześnie `gateway.auth.token` i `gateway.auth.mode: "trusted-proxy"`.
- [ ] **Lokalny awaryjny dostęp hasłem jest prywatny**: jeśli konfigurujesz `gateway.auth.password` dla wewnętrznych bezpośrednich wywołujących, utrzymuj port Gateway za zaporą, aby zdalni klienci spoza proxy nie mogli dotrzeć do niego bezpośrednio.

## Audyt bezpieczeństwa

`openclaw security audit` oznaczy uwierzytelnianie przez zaufane proxy wynikiem o wadze **critical**. To celowe — jest to przypomnienie, że delegujesz bezpieczeństwo do konfiguracji swojego proxy.

Audyt sprawdza:

- Podstawowe ostrzeżenie/przypomnienie krytyczne `gateway.trusted_proxy_auth`
- Brak konfiguracji `trustedProxies`
- Brak konfiguracji `userHeader`
- Puste `allowUsers` (pozwala dowolnemu uwierzytelnionemu użytkownikowi)
- Włączone `allowLoopback` dla źródeł proxy na tym samym hoście
- Wieloznaczną albo brakującą politykę źródeł przeglądarki na wystawionych powierzchniach Control UI

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    Żądanie nie przyszło z adresu IP w `gateway.trustedProxies`. Sprawdź:

    - Czy adres IP proxy jest poprawny? (Adresy IP kontenerów Docker mogą się zmieniać).
    - Czy przed Twoim proxy znajduje się równoważnik obciążenia?
    - Użyj `docker inspect` albo `kubectl get pods -o wide`, aby znaleźć rzeczywiste adresy IP.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw odrzucił żądanie zaufanego proxy ze źródła loopback.

    Sprawdź:

    - Czy proxy łączy się z `127.0.0.1` / `::1`?
    - Czy próbujesz używać uwierzytelniania przez zaufane proxy z odwrotnym proxy loopback na tym samym hoście?

    Naprawa:

    - Preferuj uwierzytelnianie tokenem/hasłem dla wewnętrznych klientów na tym samym hoście, którzy nie przechodzą przez proxy, albo
    - kieruj ruch przez adres zaufanego proxy inny niż loopback i zachowaj ten adres IP w `gateway.trustedProxies`, albo
    - dla celowo używanego odwrotnego proxy na tym samym hoście ustaw `gateway.auth.trustedProxy.allowLoopback = true`, zachowaj adres loopback w `gateway.trustedProxies` i upewnij się, że proxy usuwa albo nadpisuje nagłówki tożsamości.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    Nagłówek użytkownika był pusty albo go brakowało. Sprawdź:

    - Czy Twoje proxy jest skonfigurowane do przekazywania nagłówków tożsamości?
    - Czy nazwa nagłówka jest poprawna? (wielkość liter nie ma znaczenia, ale pisownia tak)
    - Czy użytkownik jest faktycznie uwierzytelniony na proxy?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Brakowało wymaganego nagłówka. Sprawdź:

    - konfigurację proxy dla tych konkretnych nagłówków.
    - czy nagłówki nie są usuwane gdzieś w łańcuchu.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    Użytkownik jest uwierzytelniony, ale nie znajduje się w `allowUsers`. Dodaj go albo usuń listę dozwolonych.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Uwierzytelnianie przez zaufane proxy powiodło się, ale nagłówek przeglądarki `Origin` nie przeszedł kontroli źródeł Control UI.

    Sprawdź:

    - `gateway.controlUi.allowedOrigins` zawiera dokładne źródło przeglądarki.
    - Nie polegasz na źródłach wieloznacznych, chyba że celowo chcesz zachowania zezwalającego wszystkim.
    - Jeśli celowo używasz trybu awaryjnego na podstawie nagłówka Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` jest ustawione świadomie.

  </Accordion>
  <Accordion title="Connection succeeds but methods report missing scope">
    WebSocket łączy się, ale `chat.history`, `sessions.list` albo
    `models.list` kończy się błędem `missing scope: operator.read`.

    Typowe przyczyny:

    - Sesja Control UI bez urządzenia: uwierzytelnianie przez zaufane proxy może dopuścić połączenie WebSocket bez tożsamości urządzenia, ale OpenClaw z założenia czyści zakresy w sesjach bez urządzenia.
    - Niestandardowy klient backendu: `gateway.controlUi.dangerouslyDisableDeviceAuth` jest ograniczone do Control UI i nie nadaje zakresów dowolnym klientom WebSocket backendu albo w stylu CLI.
    - Zbyt wąskie `x-openclaw-scopes`: jeśli Twoje proxy wstrzykuje ten nagłówek w żądaniu aktualizacji WebSocket Control UI, zakresy sesji są ograniczane do tego zestawu. Pusta wartość nagłówka nie daje żadnych zakresów.

    Naprawa:

    - Dla Control UI użyj HTTPS, aby przeglądarka mogła wygenerować tożsamość urządzenia i ukończyć parowanie.
    - Dla niestandardowej automatyzacji użyj tożsamości urządzenia/parowania, zarezerwowanej bezpośredniej lokalnej ścieżki pomocniczej backendu `gateway-client` albo [admin HTTP RPC](/pl/plugins/admin-http-rpc).
    - Używaj `gateway.controlUi.dangerouslyDisableDeviceAuth: true` tylko jako tymczasowej ścieżki awaryjnej Control UI.

  </Accordion>
  <Accordion title="WebSocket still failing">
    Upewnij się, że Twoje proxy:

    - obsługuje aktualizacje WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - przekazuje nagłówki tożsamości w żądaniach aktualizacji WebSocket (nie tylko HTTP).
    - nie ma osobnej ścieżki uwierzytelniania dla połączeń WebSocket.

  </Accordion>
</AccordionGroup>

## Migracja z uwierzytelniania tokenem

Jeśli przechodzisz z uwierzytelniania tokenem na zaufane proxy:

<Steps>
  <Step title="Configure the proxy">
    Skonfiguruj proxy tak, aby uwierzytelniało użytkowników i przekazywało nagłówki.
  </Step>
  <Step title="Test the proxy independently">
    Przetestuj konfigurację proxy niezależnie (`curl` z nagłówkami).
  </Step>
  <Step title="Update OpenClaw config">
    Zaktualizuj konfigurację OpenClaw, używając uwierzytelniania przez zaufane proxy.
  </Step>
  <Step title="Restart the Gateway">
    Uruchom ponownie Gateway.
  </Step>
  <Step title="Test WebSocket">
    Przetestuj połączenia WebSocket z Control UI.
  </Step>
  <Step title="Audit">
    Uruchom `openclaw security audit` i przejrzyj wyniki.
  </Step>
</Steps>

## Powiązane

- [Konfiguracja](/pl/gateway/configuration) — dokumentacja konfiguracji
- [Dostęp zdalny](/pl/gateway/remote) — inne wzorce dostępu zdalnego
- [Bezpieczeństwo](/pl/gateway/security) — pełny przewodnik bezpieczeństwa
- [Tailscale](/pl/gateway/tailscale) — prostsza alternatywa dla dostępu wyłącznie z tailnet
