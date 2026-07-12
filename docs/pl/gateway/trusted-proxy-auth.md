---
read_when:
    - Uruchamianie OpenClaw za serwerem proxy uwzględniającym tożsamość
    - Konfigurowanie Pomerium, Caddy lub nginx z OAuth przed OpenClaw
    - Naprawianie błędów WebSocket 1008 „brak autoryzacji” w konfiguracjach z odwrotnym serwerem proxy
    - Wybór miejsca konfiguracji HSTS i innych nagłówków zwiększających bezpieczeństwo HTTP
sidebarTitle: Trusted proxy auth
summary: Delegowanie uwierzytelniania Gateway do zaufanego odwrotnego serwera proxy (Pomerium, Caddy, nginx + OAuth)
title: Uwierzytelnianie zaufanego serwera proxy
x-i18n:
    generated_at: "2026-07-12T15:12:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 612070e4872af23c2ac41b529c8b2fa8513bf18fccc053783f55ad00b44e1a5f
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Funkcja o krytycznym znaczeniu dla bezpieczeństwa.** Ten tryb przekazuje uwierzytelnianie w całości odwrotnemu serwerowi proxy. Błędna konfiguracja może narazić Gateway na nieautoryzowany dostęp. Przed włączeniem uważnie przeczytaj tę stronę.
</Warning>

## Kiedy używać

- Uruchamiasz OpenClaw za **serwerem proxy rozpoznającym tożsamość** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Serwer proxy obsługuje całe uwierzytelnianie i przekazuje tożsamość użytkownika w nagłówkach.
- Korzystasz ze środowiska Kubernetes lub kontenerowego, w którym serwer proxy jest jedyną drogą do Gateway.
- Napotykasz błędy WebSocket `1008 unauthorized`, ponieważ przeglądarki nie mogą przekazywać tokenów w ładunkach WS.

## Kiedy NIE używać

- Serwer proxy nie uwierzytelnia użytkowników (jest tylko terminatorem TLS lub modułem równoważenia obciążenia).
- Istnieje jakakolwiek droga do Gateway omijająca serwer proxy (luki w zaporze, dostęp z sieci wewnętrznej).
- Nie masz pewności, czy serwer proxy prawidłowo usuwa lub nadpisuje przekazywane nagłówki.
- Potrzebujesz tylko osobistego dostępu dla jednego użytkownika (zamiast tego rozważ Tailscale Serve + local loopback).

## Jak to działa

<Steps>
  <Step title="Serwer proxy uwierzytelnia użytkownika">
    Odwrotny serwer proxy uwierzytelnia użytkowników (OAuth, OIDC, SAML itd.).
  </Step>
  <Step title="Serwer proxy dodaje nagłówek tożsamości">
    Serwer proxy dodaje nagłówek z tożsamością uwierzytelnionego użytkownika (np. `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway weryfikuje zaufane źródło">
    OpenClaw sprawdza, czy żądanie pochodzi z **adresu IP zaufanego serwera proxy** (`gateway.trustedProxies`) i nie jest adresem local loopback ani adresem lokalnego interfejsu samego Gateway.
  </Step>
  <Step title="Gateway wyodrębnia tożsamość">
    OpenClaw odczytuje wymagane nagłówki, a następnie tożsamość użytkownika ze skonfigurowanego nagłówka.
  </Step>
  <Step title="Autoryzacja">
    Jeśli wszystkie kontrole zakończą się powodzeniem, a użytkownik przejdzie kontrolę `allowUsers` (gdy jest ustawiona), żądanie zostaje autoryzowane.
  </Step>
</Steps>

## Konfiguracja

```json5
{
  gateway: {
    // Uwierzytelnianie przez zaufany serwer proxy domyślnie wymaga, aby źródłowy adres IP serwera proxy nie był adresem pętli zwrotnej
    bind: "lan",

    // KRYTYCZNE: dodaj tutaj wyłącznie adresy IP swojego serwera proxy
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Nagłówek zawierający tożsamość uwierzytelnionego użytkownika (wymagany)
        userHeader: "x-forwarded-user",

        // Opcjonalnie: nagłówki, które MUSZĄ być obecne (weryfikacja serwera proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Opcjonalnie: ograniczenie do określonych użytkowników (pusta lista = zezwól wszystkim)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // Opcjonalnie: zezwolenie na serwer proxy local loopback na tym samym hoście po jawnym włączeniu
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**Reguły działania, w kolejności oceny**

1. Źródłowy adres IP żądania musi odpowiadać wpisowi w `gateway.trustedProxies` (z uwzględnieniem CIDR), w przeciwnym razie żądanie zostaje odrzucone (`trusted_proxy_untrusted_source`).
2. Żądania ze źródła local loopback (`127.0.0.1`, `::1`) są odrzucane, chyba że ustawiono `gateway.auth.trustedProxy.allowLoopback = true`, a adres local loopback znajduje się również w `trustedProxies` (`trusted_proxy_loopback_source`). Ta kontrola odbywa się przed sprawdzeniem nagłówków, dlatego źródło local loopback zakończy się tym błędem, nawet jeśli brakuje również wymaganych nagłówków.
3. Źródła inne niż local loopback, które odpowiadają jednemu z adresów własnych lokalnych interfejsów sieciowych hosta Gateway, są odrzucane w celu ochrony przed podszywaniem się (`trusted_proxy_local_interface_source`). Jeśli samo wykrywanie interfejsów nie powiedzie się, żądanie również zostaje odrzucone (`trusted_proxy_local_interface_check_failed`).
4. `requiredHeaders` i `userHeader` muszą być obecne i nie mogą być puste.
5. Jeśli `allowUsers` nie jest puste, musi zawierać wyodrębnionego użytkownika.

**Dowód w postaci przekazanych nagłówków ma pierwszeństwo przed lokalnością local loopback w przypadku lokalnego bezpośredniego mechanizmu awaryjnego.** Jeśli żądanie dociera przez local loopback, ale zawiera nagłówek `Forwarded`, dowolny `X-Forwarded-*` lub `X-Real-IP`, taki dowód wyklucza je z lokalnego bezpośredniego awaryjnego uwierzytelniania hasłem oraz kontroli tożsamości urządzenia, mimo że uwierzytelnianie przez zaufany serwer proxy nadal kończy się niepowodzeniem z powodu źródła local loopback.

`allowLoopback` przyznaje lokalnym procesom na hoście Gateway taki sam poziom zaufania jak odwrotnemu serwerowi proxy. Włącz tę opcję tylko wtedy, gdy Gateway jest nadal chroniony zaporą przed bezpośrednim dostępem zdalnym, a lokalny serwer proxy usuwa lub nadpisuje nagłówki tożsamości dostarczone przez klienta.

Wewnętrzni klienci Gateway, których ruch nie przechodzi przez odwrotny serwer proxy, powinni używać `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, a nie nagłówków tożsamości zaufanego serwera proxy. Wdrożenia interfejsu Control UI poza local loopback nadal wymagają jawnego ustawienia `gateway.controlUi.allowedOrigins`.
</Warning>

### Dokumentacja konfiguracji

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Tablica zaufanych adresów IP serwerów proxy (lub zakresów CIDR). Żądania z innych adresów IP są odrzucane.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Musi mieć wartość `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Nazwa nagłówka zawierającego tożsamość uwierzytelnionego użytkownika.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Dodatkowe nagłówki, które muszą być obecne, aby żądanie zostało uznane za zaufane.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Lista dozwolonych tożsamości użytkowników. Pusta lista oznacza zezwolenie wszystkim uwierzytelnionym użytkownikom.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  Opcjonalna obsługa odwrotnych serwerów proxy local loopback działających na tym samym hoście.
</ParamField>

<Warning>
Włączaj `allowLoopback` tylko wtedy, gdy lokalny odwrotny serwer proxy stanowi zamierzoną granicę zaufania. Każdy lokalny proces, który może połączyć się z Gateway, może próbować wysyłać nagłówki tożsamości serwera proxy, dlatego bezpośredni dostęp do Gateway należy ograniczyć do hosta i wymagać nagłówków kontrolowanych przez serwer proxy, takich jak `x-forwarded-proto`, lub podpisanego nagłówka potwierdzenia, jeśli serwer proxy go obsługuje.
</Warning>

## Zachowanie parowania interfejsu Control UI

Gdy aktywne jest `gateway.auth.mode = "trusted-proxy"`, a żądanie przejdzie kontrole zaufanego serwera proxy, sesje WebSocket interfejsu Control UI mogą łączyć się bez tożsamości parowanego urządzenia.

Konsekwencje dotyczące zakresów:

- Sesje WebSocket interfejsu Control UI bez urządzenia łączą się, ale domyślnie nie otrzymują żadnych zakresów operatora. OpenClaw czyści listę żądanych zakresów do `[]`, aby sesja niepowiązana z zatwierdzonym sparowanym urządzeniem lub tokenem nie mogła samodzielnie deklarować uprawnień.
- Jeśli po pomyślnym połączeniu WebSocket metody kończą się błędem `missing scope`, użyj HTTPS, aby przeglądarka mogła wygenerować tożsamość urządzenia i ukończyć parowanie. Zobacz [niezabezpieczony HTTP interfejsu Control UI](/pl/web/control-ui#insecure-http).
- Wyłącznie awaryjnie: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` zachowuje żądane zakresy nawet bez tożsamości urządzenia. Jest to poważne obniżenie poziomu bezpieczeństwa; szybko wycofaj tę zmianę. Zobacz [niezabezpieczony HTTP interfejsu Control UI](/pl/web/control-ui#insecure-http).

Ograniczanie zakresów przez odwrotny serwer proxy: jeśli serwer proxy wysyła `x-openclaw-scopes` w żądaniu uaktualnienia WebSocket interfejsu Control UI, OpenClaw ogranicza zakresy sesji do części wspólnej zakresów żądanych i zadeklarowanych. Ten nagłówek nie przyznaje zakresów; jedynie ogranicza zakresy, które może posiadać sesja.

Konsekwencje:

- W tym trybie parowanie nie jest już podstawową bramą dostępu do interfejsu Control UI.
- Zasady uwierzytelniania odwrotnego serwera proxy i `allowUsers` stają się faktycznym mechanizmem kontroli dostępu.
- Ogranicz ruch przychodzący do Gateway wyłącznie do adresów IP zaufanych serwerów proxy (`gateway.trustedProxies` + zapora).

Niestandardowi klienci WebSocket nie są sesjami interfejsu Control UI. `gateway.controlUi.dangerouslyDisableDeviceAuth` nie przyznaje zakresów dowolnym klientom o `client.mode: "backend"` ani klientom o strukturze CLI. Niestandardowa automatyzacja powinna używać tożsamości urządzenia i parowania, zastrzeżonej bezpośredniej lokalnej ścieżki pomocniczej zaplecza `client.id: "gateway-client"` albo [pluginu administracyjnego HTTP RPC](/pl/plugins/admin-http-rpc), gdy interfejs żądanie/odpowiedź HTTP jest lepiej dopasowany.

## Nagłówek zakresów operatora

Uwierzytelnianie przez zaufany serwer proxy jest trybem HTTP **przenoszącym tożsamość**, dlatego wywołujący mogą opcjonalnie deklarować zakresy operatora za pomocą `x-openclaw-scopes` w żądaniach API HTTP.

Uwaga: zakresy WebSocket są określane przez uzgadnianie protokołu Gateway i powiązanie tożsamości urządzenia. W żądaniach uaktualnienia WebSocket interfejsu Control UI nagłówek `x-openclaw-scopes` jedynie ogranicza wynegocjowane zakresy sesji, a ich nie przyznaje. Zobacz [zachowanie parowania interfejsu Control UI](#control-ui-pairing-behavior).

Przykłady:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Zachowanie:

- Gdy nagłówek jest obecny, OpenClaw respektuje zadeklarowany zestaw zakresów.
- Gdy nagłówek jest obecny, ale pusty, żądanie deklaruje **brak** zakresów operatora.
- Gdy nagłówek jest nieobecny, standardowe interfejsy API HTTP przenoszące tożsamość używają standardowego domyślnego zestawu zakresów operatora (`operator.admin`, `operator.read`, `operator.write`, `operator.approvals`, `operator.pairing`, `operator.talk.secrets`).
- **Trasy HTTP pluginów** uwierzytelniane przez Gateway są domyślnie bardziej ograniczone: gdy `x-openclaw-scopes` jest nieobecny, ich zakres działania ogranicza się wyłącznie do `operator.write`.
- Żądania HTTP pochodzące z przeglądarki nadal muszą przejść kontrolę `gateway.controlUi.allowedOrigins` (lub celowo włączony awaryjny tryb nagłówka Host), nawet po pomyślnym uwierzytelnieniu przez zaufany serwer proxy.

Praktyczna zasada: wysyłaj `x-openclaw-scopes` jawnie, gdy żądanie zaufanego serwera proxy ma mieć węższe uprawnienia niż domyślne albo gdy trasa pluginu uwierzytelniana przez Gateway wymaga zakresu silniejszego niż zakres zapisu.

## Terminowanie TLS i HSTS

Użyj jednego punktu terminowania TLS i zastosuj w nim HSTS.

<Tabs>
  <Tab title="Terminowanie TLS na serwerze proxy (zalecane)">
    Gdy odwrotny serwer proxy obsługuje HTTPS dla `https://control.example.com`, ustaw `Strict-Transport-Security` na serwerze proxy dla tej domeny.

    - Dobre rozwiązanie dla wdrożeń dostępnych z internetu.
    - Utrzymuje certyfikat i zasady zabezpieczeń HTTP w jednym miejscu.
    - OpenClaw może pozostać dostępny przez HTTP na local loopback za serwerem proxy.

    Przykładowa wartość nagłówka:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Terminowanie TLS w Gateway">
    Jeśli OpenClaw samodzielnie i bezpośrednio udostępnia HTTPS (bez serwera proxy terminującego TLS), ustaw:

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

    `strictTransportSecurity` przyjmuje wartość nagłówka jako ciąg znaków albo `false`, aby jawnie go wyłączyć.

  </Tab>
</Tabs>

### Wskazówki dotyczące wdrażania

- Zacznij od krótkiego maksymalnego czasu ważności (na przykład `max-age=300`) podczas weryfikowania ruchu.
- Zwiększ go do wartości długoterminowych (na przykład `max-age=31536000`) dopiero po uzyskaniu wysokiego poziomu pewności.
- Dodaj `includeSubDomains` tylko wtedy, gdy każda subdomena jest gotowa do obsługi HTTPS.
- Używaj preload tylko wtedy, gdy świadomie spełniasz wymagania wstępnego ładowania dla całego zestawu domen.
- Lokalne programowanie ograniczone wyłącznie do local loopback nie odnosi korzyści z HSTS.

## Przykłady konfiguracji serwera proxy

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium przekazuje tożsamość w `x-pomerium-claim-email` (lub innych nagłówkach deklaracji) oraz JWT w `x-pomerium-jwt-assertion`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Adres IP Pomerium
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

    Fragment pliku Caddyfile:

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
    oauth2-proxy uwierzytelnia użytkowników i przekazuje tożsamość w nagłówku `x-auth-request-email`.

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

## Konfiguracja mieszana z tokenem

Gateway odrzuca podczas uruchamiania uwierzytelnianie przez zaufane proxy, jeśli skonfigurowano również współdzielony token (`gateway.auth.token` lub `OPENCLAW_GATEWAY_TOKEN`). Te opcje wzajemnie się wykluczają, ponieważ współdzielony token umożliwiłby procesom na tym samym hoście uwierzytelnianie całkowicie inną ścieżką niż tożsamość zweryfikowana przez proxy, której egzekwowanie jest celem tego trybu.

Jeśli uruchamianie kończy się niepowodzeniem z błędem takim jak `gateway auth mode is trusted-proxy, but a shared token is also configured`:

- Usuń współdzielony token podczas korzystania z trybu zaufanego proxy albo
- Zmień `gateway.auth.mode` na `"token"`, jeśli zamierzasz korzystać z uwierzytelniania opartego na tokenie.

Nagłówki tożsamości zaufanego proxy pochodzące z interfejsu pętli zwrotnej nadal są odrzucane w razie wątpliwości: procesy na tym samym hoście nie są niejawnie uwierzytelniane jako użytkownicy proxy. Wewnętrzne procesy OpenClaw, które omijają proxy, mogą zamiast tego uwierzytelniać się za pomocą `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Uwierzytelnianie zapasowe tokenem pozostaje celowo nieobsługiwane w trybie zaufanego proxy.

## Lista kontrolna bezpieczeństwa

Przed włączeniem uwierzytelniania przez zaufane proxy sprawdź:

- [ ] **Proxy jest jedyną ścieżką**: Port Gateway jest chroniony zaporą przed wszystkim poza Twoim proxy.
- [ ] **Lista trustedProxies jest minimalna**: Zawiera wyłącznie rzeczywiste adresy IP proxy, a nie całe podsieci.
- [ ] **Źródło proxy w interfejsie pętli zwrotnej jest zamierzone**: Uwierzytelnianie przez zaufane proxy odrzuca w razie wątpliwości żądania pochodzące z interfejsu pętli zwrotnej, chyba że dla proxy na tym samym hoście jawnie włączono `gateway.auth.trustedProxy.allowLoopback`.
- [ ] **Proxy usuwa nagłówki**: Twoje proxy nadpisuje (zamiast dołączać) nagłówki `x-forwarded-*` pochodzące od klientów.
- [ ] **Terminacja TLS**: Twoje proxy obsługuje TLS; użytkownicy łączą się przez HTTPS.
- [ ] **Lista allowedOrigins jest jawna**: Interfejs sterowania używany poza interfejsem pętli zwrotnej korzysta z jawnej wartości `gateway.controlUi.allowedOrigins`.
- [ ] **Ustawiono allowUsers** (zalecane): Ogranicz dostęp do znanych użytkowników zamiast zezwalać każdemu uwierzytelnionemu użytkownikowi.
- [ ] **Brak mieszanej konfiguracji tokenu**: Nie ustawiaj jednocześnie `gateway.auth.token` i `gateway.auth.mode: "trusted-proxy"`.
- [ ] **Lokalne uwierzytelnianie zapasowe hasłem jest prywatne**: Jeśli konfigurujesz `gateway.auth.password` dla wewnętrznych klientów łączących się bezpośrednio, zabezpiecz port Gateway zaporą, aby zdalni klienci niekorzystający z proxy nie mogli uzyskać do niego bezpośredniego dostępu.

## Audyt bezpieczeństwa

Polecenie `openclaw security audit` zgłasza uwierzytelnianie przez zaufane proxy jako problem o **krytycznym** poziomie ważności. Jest to zamierzone przypomnienie, że przekazujesz odpowiedzialność za bezpieczeństwo konfiguracji proxy.

Audyt sprawdza:

- Podstawowe ostrzeżenie lub krytyczne przypomnienie `gateway.trusted_proxy_auth`.
- Brak konfiguracji `trustedProxies`.
- Brak konfiguracji `userHeader`.
- Pustą listę `allowUsers` (zezwala każdemu uwierzytelnionemu użytkownikowi).
- Włączoną opcję `allowLoopback` dla źródeł proxy na tym samym hoście.

Gdy interfejs sterowania jest udostępniony, obowiązują również osobne ustalenia niezwiązane bezpośrednio z zaufanym proxy: symbol wieloznaczny lub brak `gateway.controlUi.allowedOrigins` oraz zapasowe określanie źródła na podstawie nagłówka Host.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    Żądanie nie pochodziło z adresu IP znajdującego się w `gateway.trustedProxies`. Sprawdź:

    - Czy adres IP proxy jest prawidłowy? (Adresy IP kontenerów Docker mogą się zmieniać).
    - Czy przed Twoim proxy znajduje się moduł równoważenia obciążenia?
    - Użyj `docker inspect` lub `kubectl get pods -o wide`, aby znaleźć rzeczywiste adresy IP.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw odrzucił żądanie zaufanego proxy pochodzące z interfejsu pętli zwrotnej.

    Sprawdź:

    - Czy proxy łączy się z adresu `127.0.0.1` / `::1`?
    - Czy próbujesz używać uwierzytelniania przez zaufane proxy z odwrotnym proxy działającym na tym samym hoście i korzystającym z interfejsu pętli zwrotnej?

    Rozwiązanie:

    - Preferuj uwierzytelnianie tokenem lub hasłem dla wewnętrznych klientów na tym samym hoście, którzy nie korzystają z proxy, albo
    - Kieruj ruch przez adres zaufanego proxy spoza interfejsu pętli zwrotnej i zachowaj ten adres IP w `gateway.trustedProxies`, albo
    - W przypadku celowo skonfigurowanego odwrotnego proxy na tym samym hoście ustaw `gateway.auth.trustedProxy.allowLoopback = true`, zachowaj adres interfejsu pętli zwrotnej w `gateway.trustedProxies` i upewnij się, że proxy usuwa lub nadpisuje nagłówki tożsamości.

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    Źródłowy adres IP żądania odpowiadał jednemu z własnych adresów interfejsów sieciowych hosta Gateway innych niż interfejs pętli zwrotnej (a nie adresowi proxy). Jest to zabezpieczenie przed podszytym ruchem z tego samego hosta w sieciach tailnet lub sieciach mostkowych Docker. Błąd `..._check_failed` oznacza, że samo wykrywanie interfejsów zakończyło się błędem, dlatego OpenClaw odrzuca żądanie w razie wątpliwości.

    Sprawdź:

    - Czy proces działający bezpośrednio na hoście Gateway wysyła nagłówki tożsamości, omijając proxy?
    - Czy proxy działa w tej samej przestrzeni nazw sieci co Gateway, a jego adres IP jest również widoczny jako interfejs lokalny?

    Rozwiązanie: kieruj ruch proxy przez adres, który nie jest jednocześnie powiązany lokalnie z hostem Gateway, albo używaj `allowLoopback` wyłącznie w rzeczywistej konfiguracji proxy na tym samym hoście.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    Nagłówek użytkownika był pusty lub nieobecny. Sprawdź:

    - Czy Twoje proxy jest skonfigurowane do przekazywania nagłówków tożsamości?
    - Czy nazwa nagłówka jest prawidłowa? (Wielkość liter nie ma znaczenia, ale pisownia tak).
    - Czy użytkownik został rzeczywiście uwierzytelniony przez proxy?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Wymagany nagłówek nie był obecny. Sprawdź:

    - Konfigurację proxy dotyczącą tych konkretnych nagłówków.
    - Czy nagłówki nie są usuwane gdzieś w łańcuchu.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    Użytkownik jest uwierzytelniony, ale nie znajduje się na liście `allowUsers`. Dodaj go albo usuń listę dozwolonych użytkowników.
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    Wartość `gateway.auth.mode` to `"trusted-proxy"`, ale lista `gateway.trustedProxies` jest pusta albo brakuje samej konfiguracji `gateway.auth.trustedProxy`. Każde żądanie jest odrzucane, dopóki nie zostaną ustawione obie wartości.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Uwierzytelnianie przez zaufane proxy powiodło się, ale nagłówek przeglądarki `Origin` nie przeszedł kontroli źródła interfejsu sterowania.

    Sprawdź:

    - Czy `gateway.controlUi.allowedOrigins` zawiera dokładne źródło przeglądarki.
    - Czy nie polegasz na źródłach z symbolem wieloznacznym, chyba że celowo chcesz zezwolić na wszystkie źródła.
    - Jeśli celowo używasz trybu zapasowego opartego na nagłówku Host, upewnij się, że `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` ustawiono świadomie.

  </Accordion>
  <Accordion title="Connection succeeds but methods report missing scope">
    Połączenie WebSocket zostaje nawiązane, ale wywołanie `chat.history`, `sessions.list` lub
    `models.list` kończy się błędem `missing scope: operator.read`.

    Typowe przyczyny:

    - Sesja interfejsu sterowania bez tożsamości urządzenia: uwierzytelnianie przez zaufane proxy może dopuścić połączenie WebSocket bez tożsamości urządzenia, ale OpenClaw z założenia usuwa zakresy z sesji bez urządzenia.
    - Niestandardowy klient zaplecza: opcja `gateway.controlUi.dangerouslyDisableDeviceAuth` dotyczy interfejsu sterowania i nie przyznaje zakresów dowolnym klientom WebSocket zaplecza ani klientom o strukturze CLI.
    - Zbyt wąski zakres `x-openclaw-scopes`: jeśli proxy wstrzykuje ten nagłówek do żądania aktualizacji połączenia WebSocket interfejsu sterowania, zakresy sesji są ograniczane do tego zestawu. Pusta wartość nagłówka oznacza brak zakresów.

    Rozwiązanie:

    - W przypadku interfejsu sterowania użyj HTTPS, aby przeglądarka mogła wygenerować tożsamość urządzenia i ukończyć parowanie.
    - W przypadku niestandardowej automatyzacji użyj tożsamości urządzenia i parowania, zastrzeżonej bezpośredniej lokalnej ścieżki pomocniczej zaplecza `gateway-client` albo [administracyjnego RPC HTTP](/pl/plugins/admin-http-rpc).
    - Używaj `gateway.controlUi.dangerouslyDisableDeviceAuth: true` wyłącznie jako tymczasowej, awaryjnej ścieżki dostępu do interfejsu sterowania.

  </Accordion>
  <Accordion title="WebSocket still failing">
    Upewnij się, że Twoje proxy:

    - Obsługuje aktualizację połączeń WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Przekazuje nagłówki tożsamości w żądaniach aktualizacji połączenia WebSocket (nie tylko HTTP).
    - Nie ma osobnej ścieżki uwierzytelniania dla połączeń WebSocket.

  </Accordion>
</AccordionGroup>

## Migracja z uwierzytelniania tokenem

<Steps>
  <Step title="Configure the proxy">
    Skonfiguruj proxy tak, aby uwierzytelniało użytkowników i przekazywało nagłówki.
  </Step>
  <Step title="Test the proxy independently">
    Niezależnie przetestuj konfigurację proxy (użyj curl z nagłówkami).
  </Step>
  <Step title="Update OpenClaw config">
    Zaktualizuj konfigurację OpenClaw, dodając uwierzytelnianie przez zaufane proxy.
  </Step>
  <Step title="Restart the Gateway">
    Uruchom ponownie Gateway.
  </Step>
  <Step title="Test WebSocket">
    Przetestuj połączenia WebSocket z interfejsu sterowania.
  </Step>
  <Step title="Audit">
    Uruchom `openclaw security audit` i przejrzyj ustalenia.
  </Step>
</Steps>

## Powiązane materiały

- [Konfiguracja](/pl/gateway/configuration) — dokumentacja konfiguracji
- [Zakresy operatora](/pl/gateway/operator-scopes) — role, zakresy i kontrole zatwierdzeń
- [Dostęp zdalny](/pl/gateway/remote) — inne wzorce dostępu zdalnego
- [Bezpieczeństwo](/pl/gateway/security) — pełny przewodnik dotyczący bezpieczeństwa
- [Tailscale](/pl/gateway/tailscale) — prostsza alternatywa dla dostępu ograniczonego do sieci tailnet
