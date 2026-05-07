---
read_when:
    - Potrzebujesz ochrony wielowarstwowej przed atakami polegającymi na fałszowaniu żądań po stronie serwera (SSRF) i ponownym wiązaniu DNS
    - Konfigurowanie zewnętrznego serwera proxy typu forward dla ruchu środowiska uruchomieniowego OpenClaw
summary: Jak kierować ruch HTTP i WebSocket środowiska wykonawczego OpenClaw przez zarządzany przez operatora filtrujący serwer proxy
title: Proxy sieciowy
x-i18n:
    generated_at: "2026-05-07T16:23:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22895b7c5521927b7145f55dff9b777e701691f01a6421db0f5b1ff489734775
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw może kierować ruch HTTP i WebSocket w czasie wykonywania przez zarządzany przez operatora forward proxy. To opcjonalna ochrona warstwowa dla wdrożeń, które wymagają centralnej kontroli ruchu wychodzącego, silniejszej ochrony przed SSRF i lepszej audytowalności sieci.

OpenClaw nie dostarcza, nie pobiera, nie uruchamia, nie konfiguruje ani nie certyfikuje serwera proxy. Uruchamiasz technologię proxy pasującą do swojego środowiska, a OpenClaw kieruje przez nią zwykłe lokalne dla procesu klienty HTTP i WebSocket.

## Dlaczego warto używać proxy

Proxy daje operatorom jeden punkt kontroli sieci dla wychodzącego ruchu HTTP i WebSocket. Może to być przydatne także poza wzmacnianiem ochrony przed SSRF:

- Centralna polityka: utrzymuj jedną politykę ruchu wychodzącego zamiast polegać na tym, że każde miejsce wywołań HTTP w aplikacji poprawnie zastosuje reguły sieciowe.
- Kontrole w momencie łączenia: oceniaj miejsce docelowe po rozpoznaniu DNS i bezpośrednio przed otwarciem przez proxy połączenia upstream.
- Obrona przed DNS rebinding: zmniejsz lukę między sprawdzeniem DNS na poziomie aplikacji a faktycznym połączeniem wychodzącym.
- Szersze pokrycie JavaScript: kieruj zwykłe klienty `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch i podobne przez tę samą ścieżkę.
- Audytowalność: rejestruj dozwolone i odrzucone miejsca docelowe na granicy ruchu wychodzącego.
- Kontrola operacyjna: wymuszaj reguły miejsc docelowych, segmentację sieci, limity szybkości lub allowlisty ruchu wychodzącego bez przebudowy OpenClaw.

Kierowanie przez proxy to zabezpieczenie na poziomie procesu dla zwykłego wychodzącego ruchu HTTP i WebSocket. Daje operatorom ścieżkę zamkniętą w razie awarii dla kierowania obsługiwanych klientów HTTP JavaScript przez ich własne proxy filtrujące, ale nie jest piaskownicą sieciową na poziomie systemu operacyjnego i nie sprawia, że OpenClaw certyfikuje politykę miejsc docelowych proxy.

## Jak OpenClaw kieruje ruch

Gdy `proxy.enabled=true` i skonfigurowany jest URL proxy, chronione procesy czasu wykonywania, takie jak `openclaw gateway run`, `openclaw node run` i `openclaw agent --local`, kierują zwykły wychodzący ruch HTTP i WebSocket przez skonfigurowane proxy:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Publicznym kontraktem jest zachowanie kierowania ruchu, a nie wewnętrzne hooki Node użyte do jego implementacji. Klienty WebSocket płaszczyzny sterowania OpenClaw Gateway używają wąskiej ścieżki bezpośredniej dla ruchu RPC Gateway przez local loopback, gdy URL Gateway używa `localhost` albo dosłownego adresu IP loopback, takiego jak `127.0.0.1` lub `[::1]`. Ta ścieżka płaszczyzny sterowania musi mieć możliwość dotarcia do Gateway działających przez loopback nawet wtedy, gdy proxy operatora blokuje miejsca docelowe loopback. Zwykłe żądania HTTP i WebSocket w czasie wykonywania nadal używają skonfigurowanego proxy.

Wewnętrznie OpenClaw używa dwóch hooków kierowania na poziomie procesu dla tej funkcji:

- Kierowanie dyspozytorem Undici obejmuje `fetch`, klienty oparte na undici oraz transporty, które udostępniają własny dyspozytor undici.
- Kierowanie `global-agent` obejmuje wywołujących z rdzenia Node `node:http` i `node:https`, w tym wiele bibliotek zbudowanych na `http.request`, `https.request`, `http.get` i `https.get`. Tryb zarządzanego proxy wymusza tego globalnego agenta, aby jawne agenty HTTP Node nie mogły przypadkowo ominąć proxy operatora.

Niektóre plugins posiadają własne transporty, które wymagają jawnego podłączenia proxy nawet wtedy, gdy istnieje kierowanie na poziomie procesu. Na przykład transport Bot API Telegram używa własnego dyspozytora HTTP/1 undici i dlatego respektuje zmienne środowiskowe proxy procesu oraz zarządzany fallback `OPENCLAW_PROXY_URL` w tej ścieżce transportu należącej do konkretnego właściciela.

Sam URL proxy musi używać `http://`. Miejsca docelowe HTTPS nadal są obsługiwane przez proxy za pomocą HTTP `CONNECT`; oznacza to tylko, że OpenClaw oczekuje zwykłego listenera HTTP forward-proxy, takiego jak `http://127.0.0.1:3128`.

Gdy proxy jest aktywne, OpenClaw czyści `no_proxy`, `NO_PROXY` i `GLOBAL_AGENT_NO_PROXY`. Te listy obejść są oparte na miejscu docelowym, więc pozostawienie tam `localhost` lub `127.0.0.1` pozwoliłoby wysokiego ryzyka celom SSRF pominąć proxy filtrujące.

Podczas wyłączania OpenClaw przywraca poprzednie środowisko proxy i resetuje buforowany stan kierowania procesu.

## Powiązane terminy proxy

- `proxy.enabled` / `proxy.proxyUrl`: kierowanie wychodzące przez forward-proxy dla ruchu OpenClaw w czasie wykonywania. Ta strona dokumentuje tę funkcję.
- `gateway.auth.mode: "trusted-proxy"`: przychodzące uwierzytelnianie reverse proxy świadome tożsamości dla dostępu do Gateway. Zobacz [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth).
- `openclaw proxy`: lokalne proxy debugowania i inspektor przechwytywania do programowania i wsparcia. Zobacz [openclaw proxy](/pl/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: opcjonalne włączenie dla `web_fetch`, aby pozwolić kontrolowanemu przez operatora proxy HTTP(S) ze środowiska rozwiązywać DNS przy zachowaniu domyślnego ścisłego przypinania DNS i polityki nazw hostów. Zobacz [Pobieranie z sieci](/pl/tools/web-fetch#trusted-env-proxy).
- Ustawienia proxy specyficzne dla kanału lub dostawcy: nadpisania właściciela dla konkretnego transportu. Preferuj zarządzane proxy sieciowe, gdy celem jest centralna kontrola ruchu wychodzącego w całym środowisku uruchomieniowym.

## Konfiguracja

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Możesz też podać URL przez środowisko, zachowując `proxy.enabled=true` w konfiguracji:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` ma pierwszeństwo przed `OPENCLAW_PROXY_URL`.

### Tryb loopback Gateway

Lokalne klienty płaszczyzny sterowania Gateway zwykle łączą się z WebSocket loopback, takim jak `ws://127.0.0.1:18789`. Użyj `proxy.loopbackMode`, aby wybrać zachowanie tego ruchu, gdy zarządzane proxy jest aktywne:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (domyślne): OpenClaw rejestruje autorytet loopback Gateway w aktywnym kontrolerze `NO_PROXY` `global-agent`, aby lokalny ruch WebSocket Gateway mógł łączyć się bezpośrednio. Niestandardowe porty Gateway loopback działają, ponieważ host i port aktywnego URL Gateway są rejestrowane.
- `proxy`: OpenClaw nie rejestruje autorytetu `NO_PROXY` dla loopback Gateway, więc lokalny ruch Gateway jest wysyłany przez zarządzane proxy. Jeśli proxy jest zdalne, musi zapewniać specjalne kierowanie do usługi loopback hosta OpenClaw, na przykład mapowanie jej na nazwę hosta, adres IP lub tunel osiągalny przez proxy. Standardowe zdalne proxy rozwiązują `127.0.0.1` i `localhost` z hosta proxy, a nie z hosta OpenClaw.
- `block`: OpenClaw odmawia połączeń płaszczyzny sterowania Gateway przez loopback przed otwarciem gniazda.

Jeśli `enabled=true`, ale nie skonfigurowano prawidłowego URL proxy, chronione polecenia nie uruchomią się zamiast przechodzić awaryjnie na bezpośredni dostęp do sieci.

Dla zarządzanych usług gateway uruchamianych za pomocą `openclaw gateway start` preferuj zapisanie URL w konfiguracji:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Fallback środowiskowy najlepiej nadaje się do uruchomień pierwszoplanowych. Jeśli używasz go z zainstalowaną usługą, umieść `OPENCLAW_PROXY_URL` w trwałym środowisku usługi, takim jak `$OPENCLAW_STATE_DIR/.env` lub `~/.openclaw/.env`, a następnie ponownie zainstaluj usługę, aby launchd, systemd lub Zaplanowane zadania uruchamiały gateway z tą wartością.

Dla poleceń `openclaw --container ...` OpenClaw przekazuje `OPENCLAW_PROXY_URL` do potomnego CLI kierowanego do kontenera, gdy jest ustawiony. URL musi być osiągalny z wnętrza kontenera; `127.0.0.1` odnosi się do samego kontenera, a nie do hosta. OpenClaw odrzuca adresy URL proxy loopback dla poleceń kierowanych do kontenera, chyba że jawnie nadpiszesz tę kontrolę bezpieczeństwa.

## Wymagania dotyczące proxy

Polityka proxy jest granicą bezpieczeństwa. OpenClaw nie może zweryfikować, czy proxy blokuje właściwe cele.

Skonfiguruj proxy tak, aby:

- Wiązało się tylko z loopback lub prywatnym zaufanym interfejsem.
- Ograniczało dostęp tak, aby mogły z niego korzystać tylko proces, host, kontener lub konto usługi OpenClaw.
- Samodzielnie rozwiązywało miejsca docelowe i blokowało docelowe adresy IP po rozpoznaniu DNS.
- Stosowało politykę w momencie łączenia zarówno dla zwykłych żądań HTTP, jak i tuneli HTTPS `CONNECT`.
- Odrzucało obejścia oparte na miejscu docelowym dla loopback, prywatnych, link-local, metadanych, multicast, zarezerwowanych lub dokumentacyjnych zakresów.
- Unikało allowlist nazw hostów, chyba że w pełni ufasz ścieżce rozpoznawania DNS.
- Rejestrowało miejsce docelowe, decyzję, status i przyczynę bez rejestrowania treści żądań, nagłówków autoryzacji, cookies ani innych sekretów.
- Utrzymywało politykę proxy pod kontrolą wersji i przeglądało zmiany jak konfigurację wrażliwą na bezpieczeństwo.

## Zalecane blokowane miejsca docelowe

Użyj tej denylisty jako punktu wyjścia dla dowolnego forward proxy, zapory lub polityki ruchu wychodzącego.

Logika klasyfikatora OpenClaw na poziomie aplikacji znajduje się w `src/infra/net/ssrf.ts` i `src/shared/net/ip.ts`. Odpowiednie hooki parytetu to `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` oraz obsługa osadzonego sentinela IPv4 dla NAT64, 6to4, Teredo, ISATAP i form mapowanych na IPv4. Te pliki są przydatnymi odniesieniami podczas utrzymywania zewnętrznej polityki proxy, ale OpenClaw nie eksportuje automatycznie ani nie wymusza tych reguł w twoim proxy.

| Zakres lub host                                                                       | Dlaczego blokować                                  |
| ------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 loopback                                      |
| `::1/128`                                                                            | IPv6 loopback                                      |
| `0.0.0.0/8`, `::/128`                                                                | Adresy nieokreślone i tej sieci                    |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Prywatne sieci RFC1918                             |
| `169.254.0.0/16`, `fe80::/10`                                                        | Adresy link-local i typowe ścieżki metadanych chmur |
| `169.254.169.254`, `metadata.google.internal`                                        | Usługi metadanych chmur                            |
| `100.64.0.0/10`                                                                      | Współdzielona przestrzeń adresowa NAT klasy operatorskiej |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Zakresy testów porównawczych                       |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Zakresy specjalnego użycia i dokumentacyjne        |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                          |
| `240.0.0.0/4`                                                                        | Zarezerwowane IPv4                                 |
| `fc00::/7`, `fec0::/10`                                                              | Lokalne/prywatne zakresy IPv6                      |
| `100::/64`, `2001:20::/28`                                                           | Zakresy odrzucania IPv6 i ORCHIDv2                 |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefiksy NAT64 z osadzonym IPv4                    |
| `2002::/16`, `2001::/32`                                                             | 6to4 i Teredo z osadzonym IPv4                     |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 zgodne z IPv4 i mapowane na IPv4              |

Jeśli twój dostawca chmury lub platforma sieciowa dokumentuje dodatkowe hosty metadanych lub zarezerwowane zakresy, również je dodaj.

## Walidacja

Zweryfikuj proxy z tego samego hosta, kontenera lub konta usługi, które uruchamia OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Domyślnie, gdy nie podano niestandardowych miejsc docelowych, polecenie sprawdza, czy `https://example.com/` kończy się powodzeniem, i uruchamia tymczasowy loopback canary, do którego proxy nie może dotrzeć. Domyślna kontrola odmowy przechodzi pomyślnie, gdy proxy zwraca odpowiedź odmowy inną niż 2xx albo blokuje canary błędem transportu; kończy się niepowodzeniem, jeśli pomyślna odpowiedź dociera do canary. Jeśli żadne proxy nie jest włączone i skonfigurowane, walidacja zgłasza problem z konfiguracją; użyj `--proxy-url` do jednorazowego sprawdzenia wstępnego przed zmianą konfiguracji. Użyj `--allowed-url` i `--denied-url`, aby przetestować oczekiwania specyficzne dla wdrożenia. Dodaj `--apns-reachable`, aby sprawdzić także, czy bezpośrednie dostarczanie APNs HTTP/2 może otworzyć tunel CONNECT przez proxy i otrzymać odpowiedź z sandboxa APNs; sonda używa celowo nieprawidłowego tokena dostawcy, więc `403 InvalidProviderToken` jest oczekiwane i liczy się jako osiągalność. Niestandardowe miejsca docelowe odmowy działają w trybie fail-closed: każda odpowiedź HTTP oznacza, że miejsce docelowe było osiągalne przez proxy, a każdy błąd transportu jest zgłaszany jako nierozstrzygający, ponieważ OpenClaw nie może udowodnić, że proxy zablokowało osiągalne źródło. W przypadku niepowodzenia walidacji polecenie kończy działanie kodem 1.

Użyj `--json` do automatyzacji. Dane wyjściowe JSON zawierają ogólny wynik, efektywne źródło konfiguracji proxy, wszelkie błędy konfiguracji oraz każdą kontrolę miejsca docelowego. Dane uwierzytelniające w adresie URL proxy są redagowane w wyjściu tekstowym i JSON:

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

Żądanie publiczne powinno zakończyć się powodzeniem. Żądania do loopback i metadanych powinny zostać zablokowane przez proxy. W przypadku `openclaw proxy validate` wbudowany loopback canary potrafi odróżnić odmowę proxy od osiągalnego źródła. Niestandardowe kontrole `--denied-url` nie mają tego canary, więc traktuj zarówno odpowiedzi HTTP, jak i niejednoznaczne błędy transportu jako niepowodzenia walidacji, chyba że proxy udostępnia specyficzny dla wdrożenia sygnał odmowy, który możesz zweryfikować osobno.

Następnie włącz trasowanie proxy OpenClaw:

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

- Proxy poprawia pokrycie dla lokalnych w procesie klientów JavaScript HTTP i WebSocket, ale nie jest sieciowym sandboxem na poziomie systemu operacyjnego.
- Ruch płaszczyzny sterowania Gateway przez loopback domyślnie korzysta z bezpośredniego lokalnego obejścia przez `proxy.loopbackMode: "gateway-only"`. OpenClaw implementuje to obejście przez zarejestrowanie aktywnego urzędu loopback Gateway w zarządzanym kontrolerze `global-agent` `NO_PROXY`. Operatorzy mogą ustawić `proxy.loopbackMode: "proxy"`, aby wysyłać ruch loopback Gateway przez zarządzane proxy, albo `proxy.loopbackMode: "block"`, aby odmawiać połączeń loopback Gateway. Zobacz [tryb loopback Gateway](#gateway-loopback-mode), aby poznać zastrzeżenie dotyczące zdalnego proxy.
- Surowe gniazda `net`, `tls` i `http2`, natywne dodatki oraz procesy potomne spoza OpenClaw mogą omijać trasowanie proxy na poziomie Node, chyba że dziedziczą i respektują zmienne środowiskowe proxy. Rozwidlonie potomne CLI OpenClaw dziedziczą zarządzany adres URL proxy oraz stan `proxy.loopbackMode`.
- IRC to surowy kanał TCP/TLS poza trasowaniem przez zarządzane przez operatora proxy pośredniczące. We wdrożeniach wymagających, aby cały ruch wychodzący przechodził przez to proxy pośredniczące, ustaw `channels.irc.enabled=false`, chyba że bezpośredni ruch wychodzący IRC jest jawnie zatwierdzony.
- Lokalne proxy debugowania jest narzędziem diagnostycznym, a jego bezpośrednie przekazywanie upstream dla żądań proxy i tuneli CONNECT jest domyślnie wyłączone, gdy aktywny jest zarządzany tryb proxy; włączaj bezpośrednie przekazywanie tylko dla zatwierdzonej lokalnej diagnostyki.
- Lokalne WebUI użytkownika i lokalne serwery modeli powinny zostać umieszczone na liście dozwolonych w polityce proxy operatora, gdy jest to potrzebne; OpenClaw nie udostępnia dla nich ogólnego obejścia sieci lokalnej.
- Obejście proxy płaszczyzny sterowania Gateway jest celowo ograniczone do `localhost` i dosłownych adresów URL IP loopback. Użyj `ws://127.0.0.1:18789`, `ws://[::1]:18789` albo `ws://localhost:18789` dla lokalnych bezpośrednich połączeń płaszczyzny sterowania Gateway; inne nazwy hostów są trasowane jak zwykły ruch oparty na nazwie hosta.
- OpenClaw nie sprawdza, nie testuje ani nie certyfikuje Twojej polityki proxy.
- Traktuj zmiany polityki proxy jako operacyjne zmiany wrażliwe pod względem bezpieczeństwa.

| Powierzchnia                                                 | Stan zarządzanego proxy                                                                            |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, typowi klienci WebSocket | Trasowane przez haki zarządzanego proxy, gdy jest skonfigurowane.                                  |
| Bezpośrednie APNs HTTP/2                                     | Trasowane przez zarządzany pomocnik CONNECT dla APNs.                                              |
| Loopback płaszczyzny sterowania Gateway                      | Bezpośrednio tylko dla skonfigurowanego lokalnego adresu URL loopback Gateway.                     |
| Przekazywanie upstream proxy debugowania                     | Wyłączone, gdy aktywny jest zarządzany tryb proxy, chyba że jawnie włączono lokalną diagnostykę.   |
| IRC                                                          | Surowe TCP/TLS; nie jest obsługiwane przez zarządzany tryb proxy HTTP. Wyłącz, chyba że bezpośredni ruch wychodzący IRC jest zatwierdzony. |
| Inne surowe wywołania klientów `net`, `tls` lub `http2`      | Muszą zostać sklasyfikowane przez strażnika surowych gniazd przed wdrożeniem.                      |
