---
read_when:
    - Chcesz ochrony wielowarstwowej przed atakami SSRF i DNS rebinding
    - Konfigurowanie zewnętrznego forward proxy dla ruchu środowiska wykonawczego OpenClaw
summary: Jak kierować ruch HTTP i WebSocket środowiska uruchomieniowego OpenClaw przez zarządzany przez operatora filtrujący serwer proxy
title: Proxy sieciowy
x-i18n:
    generated_at: "2026-05-05T01:50:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7ab345d172d63e388ff1221535efd19934dcbf3173f95bc69131f9ad672e0df
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy sieciowy

OpenClaw może kierować ruch HTTP i WebSocket w czasie działania przez zarządzany przez operatora proxy przekazujący. To opcjonalna warstwa obrony dla wdrożeń, które wymagają centralnej kontroli ruchu wychodzącego, silniejszej ochrony przed SSRF i lepszej audytowalności sieci.

OpenClaw nie dostarcza, nie pobiera, nie uruchamia, nie konfiguruje ani nie certyfikuje proxy. Uruchamiasz technologię proxy pasującą do swojego środowiska, a OpenClaw kieruje przez nią zwykłe lokalne dla procesu klienty HTTP i WebSocket.

## Dlaczego używać proxy?

Proxy daje operatorom jeden punkt kontroli sieci dla wychodzącego ruchu HTTP i WebSocket. Może to być przydatne nawet poza wzmacnianiem ochrony przed SSRF:

- Centralna polityka: utrzymuj jedną politykę ruchu wychodzącego zamiast polegać na tym, że każde miejsce wywołań HTTP w aplikacji poprawnie obsłuży reguły sieciowe.
- Kontrole podczas łączenia: oceniaj cel po rozwiązaniu DNS i bezpośrednio przed otwarciem przez proxy połączenia do usługi nadrzędnej.
- Obrona przed DNS rebinding: zmniejsz lukę między kontrolą DNS na poziomie aplikacji a faktycznym połączeniem wychodzącym.
- Szersze pokrycie JavaScript: kieruj zwykłe `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch i podobne klienty tą samą ścieżką.
- Audytowalność: rejestruj dozwolone i zablokowane cele na granicy ruchu wychodzącego.
- Kontrola operacyjna: wymuszaj reguły celów, segmentację sieci, limity szybkości lub listy dozwolonego ruchu wychodzącego bez przebudowywania OpenClaw.

Kierowanie przez proxy jest zabezpieczeniem na poziomie procesu dla zwykłego wychodzącego ruchu HTTP i WebSocket. Daje operatorom ścieżkę zamkniętą w razie błędu do kierowania obsługiwanych klientów HTTP JavaScript przez ich własne filtrujące proxy, ale nie jest piaskownicą sieciową na poziomie systemu operacyjnego i nie sprawia, że OpenClaw certyfikuje politykę celów proxy.

## Jak OpenClaw kieruje ruch

Gdy skonfigurowano `proxy.enabled=true` i URL proxy, chronione procesy czasu działania, takie jak `openclaw gateway run`, `openclaw node run` i `openclaw agent --local`, kierują zwykły wychodzący ruch HTTP i WebSocket przez skonfigurowane proxy:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Publiczną umową jest zachowanie routingu, a nie wewnętrzne hooki Node używane do jego implementacji. Klienty WebSocket płaszczyzny sterowania OpenClaw Gateway używają wąskiej ścieżki bezpośredniej dla ruchu RPC Gateway przez local loopback, gdy URL Gateway używa `localhost` albo literalnego adresu IP pętli zwrotnej, takiego jak `127.0.0.1` lub `[::1]`. Ta ścieżka płaszczyzny sterowania musi móc docierać do Gateway przez pętlę zwrotną nawet wtedy, gdy proxy operatora blokuje cele pętli zwrotnej. Zwykłe żądania HTTP i WebSocket w czasie działania nadal używają skonfigurowanego proxy.

Wewnętrznie OpenClaw używa dwóch hooków routingu na poziomie procesu dla tej funkcji:

- Routing dyspozytora Undici obejmuje `fetch`, klienty oparte na undici oraz transporty, które udostępniają własny dyspozytor undici.
- Routing `global-agent` obejmuje wywołujących z rdzenia Node `node:http` i `node:https`, w tym wiele bibliotek zbudowanych na `http.request`, `https.request`, `http.get` i `https.get`. Zarządzany tryb proxy wymusza tego globalnego agenta, aby jawni agenci HTTP Node nie mogli przypadkowo ominąć proxy operatora.

Niektóre pluginy mają własne transporty, które wymagają jawnego podłączenia proxy nawet wtedy, gdy istnieje routing na poziomie procesu. Na przykład transport Bot API Telegram używa własnego dyspozytora HTTP/1 undici i dlatego respektuje zmienne środowiskowe proxy procesu oraz zarządzany fallback `OPENCLAW_PROXY_URL` w tej ścieżce transportu specyficznej dla właściciela.

Sam URL proxy musi używać `http://`. Cele HTTPS nadal są obsługiwane przez proxy z użyciem HTTP `CONNECT`; oznacza to tylko, że OpenClaw oczekuje zwykłego nasłuchującego proxy przekazującego HTTP, takiego jak `http://127.0.0.1:3128`.

Gdy proxy jest aktywne, OpenClaw czyści `no_proxy`, `NO_PROXY` i `GLOBAL_AGENT_NO_PROXY`. Te listy obejść są oparte na celach, więc pozostawienie tam `localhost` lub `127.0.0.1` pozwoliłoby celom SSRF wysokiego ryzyka pominąć filtrujące proxy.

Przy zamykaniu OpenClaw przywraca poprzednie środowisko proxy i resetuje buforowany stan routingu procesu.

## Powiązane terminy proxy

- `proxy.enabled` / `proxy.proxyUrl`: kierowanie wychodzącego ruchu OpenClaw w czasie działania przez proxy przekazujące. Ta strona dokumentuje tę funkcję.
- `gateway.auth.mode: "trusted-proxy"`: uwierzytelnianie przychodzące z użyciem zwrotnego proxy świadomego tożsamości dla dostępu do Gateway. Zobacz [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth).
- `openclaw proxy`: lokalne proxy debugowania i inspektor przechwytywania na potrzeby programowania i wsparcia. Zobacz [openclaw proxy](/pl/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: opcja opt-in dla `web_fetch`, pozwalająca kontrolowanemu przez operatora proxy środowiskowemu HTTP(S) rozwiązywać DNS przy zachowaniu domyślnie ścisłego przypinania DNS i polityki nazw hostów. Zobacz [Web fetch](/pl/tools/web-fetch#trusted-env-proxy).
- Ustawienia proxy specyficzne dla kanału lub dostawcy: nadpisania specyficzne dla właściciela dla konkretnego transportu. Preferuj zarządzane proxy sieciowe, gdy celem jest centralna kontrola ruchu wychodzącego w całym środowisku czasu działania.

## Konfiguracja

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Możesz także podać URL przez środowisko, pozostawiając `proxy.enabled=true` w konfiguracji:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` ma pierwszeństwo przed `OPENCLAW_PROXY_URL`.

Jeśli `enabled=true`, ale nie skonfigurowano prawidłowego URL proxy, chronione polecenia kończą uruchamianie niepowodzeniem zamiast wracać do bezpośredniego dostępu do sieci.

W przypadku zarządzanych usług gateway uruchamianych poleceniem `openclaw gateway start` preferuj przechowywanie URL w konfiguracji:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Fallback środowiskowy najlepiej nadaje się do uruchomień pierwszoplanowych. Jeśli używasz go z zainstalowaną usługą, umieść `OPENCLAW_PROXY_URL` w trwałym środowisku usługi, takim jak `$OPENCLAW_STATE_DIR/.env` lub `~/.openclaw/.env`, a następnie ponownie zainstaluj usługę, aby launchd, systemd lub Scheduled Tasks uruchamiały gateway z tą wartością.

Dla poleceń `openclaw --container ...` OpenClaw przekazuje `OPENCLAW_PROXY_URL` do potomnego CLI kierowanego do kontenera, gdy jest ustawiony. URL musi być osiągalny z wnętrza kontenera; `127.0.0.1` odnosi się do samego kontenera, a nie hosta. OpenClaw odrzuca URL-e proxy pętli zwrotnej dla poleceń kierowanych do kontenera, chyba że jawnie nadpiszesz tę kontrolę bezpieczeństwa.

## Wymagania proxy

Polityka proxy jest granicą bezpieczeństwa. OpenClaw nie może zweryfikować, że proxy blokuje właściwe cele.

Skonfiguruj proxy tak, aby:

- Było powiązane tylko z pętlą zwrotną albo prywatnym zaufanym interfejsem.
- Ograniczało dostęp tak, aby tylko proces, host, kontener lub konto usługi OpenClaw mogły go używać.
- Samodzielnie rozwiązywało cele i blokowało docelowe adresy IP po rozwiązaniu DNS.
- Stosowało politykę w momencie łączenia zarówno dla zwykłych żądań HTTP, jak i tuneli HTTPS `CONNECT`.
- Odrzucało obejścia oparte na celach dla pętli zwrotnej, zakresów prywatnych, link-local, metadanych, multicast, zarezerwowanych lub dokumentacyjnych.
- Unikało list dozwolonych nazw hostów, chyba że w pełni ufasz ścieżce rozwiązywania DNS.
- Rejestrowało cel, decyzję, status i powód bez rejestrowania treści żądań, nagłówków autoryzacji, ciasteczek ani innych sekretów.
- Trzymało politykę proxy pod kontrolą wersji i przeglądało zmiany jak konfigurację wrażliwą z punktu widzenia bezpieczeństwa.

## Zalecane blokowane cele

Użyj tej listy blokad jako punktu wyjścia dla dowolnego proxy przekazującego, zapory lub polityki ruchu wychodzącego.

Logika klasyfikatora na poziomie aplikacji OpenClaw znajduje się w `src/infra/net/ssrf.ts` i `src/shared/net/ip.ts`. Odpowiednie hooki parytetu to `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` oraz wbudowana obsługa sentinel IPv4 dla NAT64, 6to4, Teredo, ISATAP i form mapowanych z IPv4. Te pliki są przydatnymi odniesieniami podczas utrzymywania zewnętrznej polityki proxy, ale OpenClaw nie eksportuje ani nie wymusza automatycznie tych reguł w Twoim proxy.

| Zakres lub host                                                                       | Dlaczego blokować                                    |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Pętla zwrotna IPv4                                   |
| `::1/128`                                                                            | Pętla zwrotna IPv6                                   |
| `0.0.0.0/8`, `::/128`                                                                | Adresy nieokreślone i tej sieci                      |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Prywatne sieci RFC1918                               |
| `169.254.0.0/16`, `fe80::/10`                                                        | Adresy link-local i typowe ścieżki metadanych chmury |
| `169.254.169.254`, `metadata.google.internal`                                        | Usługi metadanych chmury                             |
| `100.64.0.0/10`                                                                      | Współdzielona przestrzeń adresowa NAT klasy operatorskiej |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Zakresy testów wydajności                            |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Zakresy specjalnego użycia i dokumentacyjne          |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                            |
| `240.0.0.0/4`                                                                        | Zarezerwowane IPv4                                   |
| `fc00::/7`, `fec0::/10`                                                              | Lokalne/prywatne zakresy IPv6                        |
| `100::/64`, `2001:20::/28`                                                           | Zakresy IPv6 discard i ORCHIDv2                      |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefiksy NAT64 z osadzonym IPv4                      |
| `2002::/16`, `2001::/32`                                                             | 6to4 i Teredo z osadzonym IPv4                       |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 zgodne z IPv4 i mapowane z IPv4                 |

Jeśli Twój dostawca chmury lub platforma sieciowa dokumentuje dodatkowe hosty metadanych albo zarezerwowane zakresy, dodaj je również.

## Walidacja

Zweryfikuj proxy z tego samego hosta, kontenera lub konta usługi, które uruchamia OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Domyślnie, gdy nie podano niestandardowych celów, polecenie sprawdza, czy `https://example.com/` kończy się powodzeniem, oraz uruchamia tymczasowy canary pętli zwrotnej, do którego proxy nie może dotrzeć. Domyślna kontrola odmowy przechodzi, gdy proxy zwraca odpowiedź odmowną inną niż 2xx albo blokuje canary błędem transportu; kończy się niepowodzeniem, jeśli pomyślna odpowiedź dotrze do canary. Jeśli żadne proxy nie jest włączone i skonfigurowane, walidacja zgłasza problem z konfiguracją; użyj `--proxy-url` do jednorazowego sprawdzenia przed zmianą konfiguracji. Użyj `--allowed-url` i `--denied-url`, aby przetestować oczekiwania specyficzne dla wdrożenia. Dodaj `--apns-reachable`, aby także zweryfikować, że bezpośrednie dostarczanie APNs HTTP/2 może otworzyć tunel CONNECT przez proxy i odebrać odpowiedź sandbox APNs; próba używa celowo nieprawidłowego tokena dostawcy, więc `403 InvalidProviderToken` jest oczekiwane i liczy się jako osiągalność. Niestandardowe cele zabronione są zamknięte w razie błędu: każda odpowiedź HTTP oznacza, że cel był osiągalny przez proxy, a każdy błąd transportu jest zgłaszany jako nierozstrzygający, ponieważ OpenClaw nie może udowodnić, że proxy zablokowało osiągalne źródło. Przy niepowodzeniu walidacji polecenie kończy działanie kodem 1.

Użyj `--json` do automatyzacji. Wynik JSON zawiera ogólny rezultat, efektywne źródło konfiguracji proxy, wszelkie błędy konfiguracji oraz każdy test miejsca docelowego. Dane uwierzytelniające w adresie URL proxy są redagowane w wyjściu tekstowym i JSON:

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

Możesz też zweryfikować ręcznie za pomocą `curl`:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

Żądanie publiczne powinno się powieść. Żądania do pętli zwrotnej i metadanych powinny zostać zablokowane przez proxy. W przypadku `openclaw proxy validate` wbudowany kanarek pętli zwrotnej potrafi odróżnić odmowę proxy od osiągalnego źródła. Niestandardowe testy `--denied-url` nie mają tego kanarka, dlatego traktuj zarówno odpowiedzi HTTP, jak i niejednoznaczne błędy transportu jako niepowodzenia walidacji, chyba że Twoje proxy udostępnia sygnał odmowy specyficzny dla wdrożenia, który możesz zweryfikować osobno.

Następnie włącz routing proxy OpenClaw:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway run
```

albo ustaw:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

## Ograniczenia

- Proxy poprawia pokrycie dla lokalnych dla procesu klientów JavaScript HTTP i WebSocket, ale nie jest piaskownicą sieciową na poziomie systemu operacyjnego.
- Surowe gniazda `net`, `tls` i `http2`, dodatki natywne oraz procesy potomne mogą omijać routing proxy na poziomie Node, chyba że dziedziczą i respektują zmienne środowiskowe proxy.
- IRC jest surowym kanałem TCP/TLS poza routingiem przez forward proxy zarządzanym przez operatora. We wdrożeniach, które wymagają całego ruchu wychodzącego przez ten forward proxy, ustaw `channels.irc.enabled=false`, chyba że bezpośredni ruch wychodzący IRC został jawnie zatwierdzony.
- Lokalne debugujące proxy jest narzędziem diagnostycznym, a jego bezpośrednie przekazywanie upstream dla żądań proxy i tuneli CONNECT jest domyślnie wyłączone, gdy aktywny jest zarządzany tryb proxy; włączaj bezpośrednie przekazywanie tylko dla zatwierdzonej diagnostyki lokalnej.
- Lokalne WebUI użytkownika i lokalne serwery modeli powinny być w razie potrzeby dodane do listy dozwolonych w polityce proxy operatora; OpenClaw nie udostępnia dla nich ogólnego obejścia sieci lokalnej.
- Obejście proxy płaszczyzny sterowania Gateway jest celowo ograniczone do `localhost` i literalnych adresów URL IP pętli zwrotnej. Używaj `ws://127.0.0.1:18789`, `ws://[::1]:18789` lub `ws://localhost:18789` dla lokalnych bezpośrednich połączeń z płaszczyzną sterowania Gateway; inne nazwy hostów są trasowane jak zwykły ruch oparty na nazwach hostów.
- OpenClaw nie sprawdza, nie testuje ani nie certyfikuje Twojej polityki proxy.
- Traktuj zmiany polityki proxy jako operacyjne zmiany wrażliwe z punktu widzenia bezpieczeństwa.
