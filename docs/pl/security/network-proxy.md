---
read_when:
    - Potrzebujesz wielowarstwowej ochrony przed atakami SSRF i DNS rebinding
    - Konfigurowanie zewnętrznego pośredniczącego serwera proxy dla ruchu OpenClaw w czasie działania
summary: Jak kierować ruch HTTP i WebSocket środowiska uruchomieniowego OpenClaw przez zarządzany przez operatora proxy filtrujący
title: Proxy sieciowy
x-i18n:
    generated_at: "2026-05-06T09:30:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: d733c690b5f86ef62fe7a35d38fbfcd07910970bca12ca6f74fdb26c8ec4557b
    source_path: security/network-proxy.md
    workflow: 16
---

# Sieciowy serwer proxy

OpenClaw może kierować ruch HTTP i WebSocket środowiska uruchomieniowego przez zarządzany przez operatora wychodzący serwer proxy. Jest to opcjonalna ochrona warstwowa dla wdrożeń, które wymagają centralnej kontroli ruchu wychodzącego, silniejszej ochrony przed SSRF i lepszej audytowalności sieci.

OpenClaw nie dostarcza, nie pobiera, nie uruchamia, nie konfiguruje ani nie certyfikuje serwera proxy. Uruchamiasz technologię proxy pasującą do swojego środowiska, a OpenClaw kieruje przez nią zwykłe lokalne dla procesu klienty HTTP i WebSocket.

## Dlaczego używać serwera proxy?

Serwer proxy daje operatorom jeden punkt kontroli sieci dla wychodzącego ruchu HTTP i WebSocket. Może to być przydatne nawet poza wzmacnianiem ochrony przed SSRF:

- Centralna polityka: utrzymuj jedną politykę ruchu wychodzącego zamiast polegać na tym, że każde miejsce wywołania HTTP w aplikacji poprawnie zastosuje reguły sieciowe.
- Kontrole w czasie łączenia: oceniaj miejsce docelowe po rozwiązaniu DNS i bezpośrednio przed otwarciem przez proxy połączenia z serwerem nadrzędnym.
- Obrona przed DNS rebinding: zmniejsz odstęp między kontrolą DNS na poziomie aplikacji a rzeczywistym połączeniem wychodzącym.
- Szersze pokrycie JavaScript: kieruj zwykłe klienty `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch i podobne tą samą ścieżką.
- Audytowalność: rejestruj dozwolone i odrzucone miejsca docelowe na granicy ruchu wychodzącego.
- Kontrola operacyjna: egzekwuj reguły miejsc docelowych, segmentację sieci, limity szybkości lub listy dozwolonych adresów wychodzących bez przebudowywania OpenClaw.

Kierowanie przez proxy jest zabezpieczeniem na poziomie procesu dla zwykłego ruchu wychodzącego HTTP i WebSocket. Daje operatorom ścieżkę fail-closed do kierowania obsługiwanych klientów HTTP JavaScript przez własny filtrujący serwer proxy, ale nie jest piaskownicą sieciową na poziomie systemu operacyjnego i nie sprawia, że OpenClaw certyfikuje politykę miejsc docelowych tego proxy.

## Jak OpenClaw kieruje ruch

Gdy `proxy.enabled=true` i skonfigurowano URL proxy, chronione procesy środowiska uruchomieniowego, takie jak `openclaw gateway run`, `openclaw node run` i `openclaw agent --local`, kierują zwykły ruch wychodzący HTTP i WebSocket przez skonfigurowany serwer proxy:

```text
Proces OpenClaw
  fetch                  -> filtrowanie przez proxy zarządzane przez operatora -> publiczny internet
  node:http i https      -> filtrowanie przez proxy zarządzane przez operatora -> publiczny internet
  Klienty WebSocket      -> filtrowanie przez proxy zarządzane przez operatora -> publiczny internet
```

Publicznym kontraktem jest zachowanie routingu, a nie wewnętrzne haki Node używane do jego implementacji. Klienty WebSocket płaszczyzny sterowania OpenClaw Gateway używają wąskiej ścieżki bezpośredniej dla ruchu RPC lokalnego Gateway przez local loopback, gdy URL Gateway używa `localhost` lub literalnego adresu IP pętli zwrotnej, takiego jak `127.0.0.1` albo `[::1]`. Ta ścieżka płaszczyzny sterowania musi być w stanie dotrzeć do Gateway działających przez pętlę zwrotną, nawet gdy proxy operatora blokuje miejsca docelowe pętli zwrotnej. Zwykłe żądania HTTP i WebSocket środowiska uruchomieniowego nadal używają skonfigurowanego proxy.

Wewnętrznie OpenClaw używa dwóch haków routingu na poziomie procesu dla tej funkcji:

- Routing dyspozytora Undici obejmuje `fetch`, klientów opartych na undici oraz transporty, które dostarczają własny dyspozytor undici.
- Routing `global-agent` obejmuje wywołujących z rdzenia Node `node:http` i `node:https`, w tym wiele bibliotek opartych na `http.request`, `https.request`, `http.get` i `https.get`. Zarządzany tryb proxy wymusza tego globalnego agenta, aby jawni agenci HTTP Node przypadkowo nie omijali proxy operatora.

Niektóre pluginy posiadają własne transporty, które wymagają jawnego podłączenia proxy nawet wtedy, gdy istnieje routing na poziomie procesu. Na przykład transport Bot API Telegram używa własnego dyspozytora HTTP/1 undici i dlatego respektuje zmienne środowiskowe proxy procesu oraz zarządzany fallback `OPENCLAW_PROXY_URL` w tej ścieżce transportu specyficznej dla właściciela.

Sam URL proxy musi używać `http://`. Miejsca docelowe HTTPS są nadal obsługiwane przez proxy z użyciem HTTP `CONNECT`; oznacza to jedynie, że OpenClaw oczekuje zwykłego nasłuchującego wychodzącego proxy HTTP, takiego jak `http://127.0.0.1:3128`.

Gdy proxy jest aktywne, OpenClaw czyści `no_proxy`, `NO_PROXY` i `GLOBAL_AGENT_NO_PROXY`. Te listy obejść są oparte na miejscu docelowym, więc pozostawienie tam `localhost` lub `127.0.0.1` pozwoliłoby wysokiego ryzyka celom SSRF ominąć filtrujące proxy.

Podczas zamykania OpenClaw przywraca poprzednie środowisko proxy i resetuje buforowany stan routingu procesu.

## Powiązane terminy proxy

- `proxy.enabled` / `proxy.proxyUrl`: kierowanie wychodzącego ruchu OpenClaw środowiska uruchomieniowego przez wychodzący serwer proxy. Ta strona dokumentuje tę funkcję.
- `gateway.auth.mode: "trusted-proxy"`: przychodzące uwierzytelnianie przez zwrotny serwer proxy świadomy tożsamości dla dostępu do Gateway. Zobacz [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth).
- `openclaw proxy`: lokalne proxy debugowania i inspektor przechwytywania do programowania i wsparcia. Zobacz [openclaw proxy](/pl/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: opcja włączana jawnie dla `web_fetch`, aby pozwolić kontrolowanemu przez operatora proxy HTTP(S) ze środowiska rozwiązywać DNS przy zachowaniu domyślnego ścisłego przypięcia DNS i polityki nazw hostów. Zobacz [Web fetch](/pl/tools/web-fetch#trusted-env-proxy).
- Ustawienia proxy specyficzne dla kanału lub dostawcy: nadpisania specyficzne dla właściciela dla konkretnego transportu. Preferuj zarządzane sieciowe proxy, gdy celem jest centralna kontrola ruchu wychodzącego w całym środowisku uruchomieniowym.

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

### Tryb pętli zwrotnej Gateway

Lokalni klienci płaszczyzny sterowania Gateway zwykle łączą się z WebSocket przez pętlę zwrotną, na przykład `ws://127.0.0.1:18789`. Użyj `proxy.loopbackMode`, aby wybrać, jak ten ruch ma się zachowywać, gdy zarządzane proxy jest aktywne:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy albo block
```

- `gateway-only` (domyślnie): OpenClaw rejestruje autorytet pętli zwrotnej Gateway w aktywnym kontrolerze `NO_PROXY` `global-agent`, aby lokalny ruch WebSocket Gateway mógł łączyć się bezpośrednio. Niestandardowe porty Gateway pętli zwrotnej działają, ponieważ host i port aktywnego URL Gateway są rejestrowane.
- `proxy`: OpenClaw nie rejestruje autorytetu pętli zwrotnej Gateway `NO_PROXY`, więc lokalny ruch Gateway jest wysyłany przez zarządzane proxy. Jeśli proxy jest zdalne, musi zapewnić specjalny routing do usługi pętli zwrotnej hosta OpenClaw, na przykład mapując ją na osiągalną przez proxy nazwę hosta, adres IP lub tunel. Standardowe zdalne proxy rozwiązują `127.0.0.1` i `localhost` z hosta proxy, a nie z hosta OpenClaw.
- `block`: OpenClaw odmawia połączeń płaszczyzny sterowania Gateway przez pętlę zwrotną przed otwarciem gniazda.

Jeśli `enabled=true`, ale nie skonfigurowano prawidłowego URL proxy, chronione polecenia kończą uruchamianie błędem zamiast wracać do bezpośredniego dostępu do sieci.

Dla zarządzanych usług Gateway uruchamianych za pomocą `openclaw gateway start` preferuj przechowywanie URL w konfiguracji:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Fallback środowiskowy najlepiej nadaje się do uruchomień pierwszoplanowych. Jeśli używasz go z zainstalowaną usługą, umieść `OPENCLAW_PROXY_URL` w trwałym środowisku usługi, takim jak `$OPENCLAW_STATE_DIR/.env` lub `~/.openclaw/.env`, a następnie ponownie zainstaluj usługę, aby launchd, systemd lub Scheduled Tasks uruchamiały Gateway z tą wartością.

Dla poleceń `openclaw --container ...` OpenClaw przekazuje `OPENCLAW_PROXY_URL` do podrzędnego CLI skierowanego do kontenera, gdy jest ustawiony. URL musi być osiągalny z wnętrza kontenera; `127.0.0.1` odnosi się do samego kontenera, a nie do hosta. OpenClaw odrzuca URL proxy pętli zwrotnej dla poleceń skierowanych do kontenera, chyba że jawnie nadpiszesz tę kontrolę bezpieczeństwa.

## Wymagania dotyczące proxy

Polityka proxy jest granicą bezpieczeństwa. OpenClaw nie może zweryfikować, czy proxy blokuje właściwe cele.

Skonfiguruj proxy tak, aby:

- Nasłuchiwało tylko na pętli zwrotnej lub prywatnym zaufanym interfejsie.
- Ograniczało dostęp tak, aby mogły go używać tylko proces, host, kontener lub konto usługi OpenClaw.
- Samodzielnie rozwiązywało miejsca docelowe i blokowało docelowe adresy IP po rozwiązaniu DNS.
- Stosowało politykę w czasie łączenia zarówno dla zwykłych żądań HTTP, jak i tuneli HTTPS `CONNECT`.
- Odrzucało obejścia oparte na miejscu docelowym dla pętli zwrotnej, zakresów prywatnych, link-local, metadanych, multicast, zarezerwowanych lub dokumentacyjnych.
- Unikało list dozwolonych nazw hostów, chyba że w pełni ufasz ścieżce rozwiązywania DNS.
- Rejestrowało miejsce docelowe, decyzję, status i powód bez rejestrowania treści żądań, nagłówków autoryzacji, ciasteczek ani innych sekretów.
- Utrzymywało politykę proxy pod kontrolą wersji i przeglądało zmiany jak konfigurację wrażliwą na bezpieczeństwo.

## Zalecane blokowane miejsca docelowe

Użyj tej listy odmów jako punktu wyjścia dla dowolnego wychodzącego serwera proxy, zapory lub polityki ruchu wychodzącego.

Logika klasyfikatora na poziomie aplikacji OpenClaw znajduje się w `src/infra/net/ssrf.ts` i `src/shared/net/ip.ts`. Odpowiednie haki zgodności to `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` oraz wbudowana obsługa wartownika IPv4 dla NAT64, 6to4, Teredo, ISATAP i form mapowanych na IPv4. Te pliki są przydatnymi odniesieniami przy utrzymywaniu zewnętrznej polityki proxy, ale OpenClaw nie eksportuje ani nie egzekwuje automatycznie tych reguł w twoim proxy.

| Zakres lub host                                                                       | Dlaczego blokować                                  |
| ------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Pętla zwrotna IPv4                                 |
| `::1/128`                                                                            | Pętla zwrotna IPv6                                 |
| `0.0.0.0/8`, `::/128`                                                                | Adresy nieokreślone i adresy tej sieci             |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Prywatne sieci RFC1918                             |
| `169.254.0.0/16`, `fe80::/10`                                                        | Adresy link-local i typowe ścieżki metadanych chmur |
| `169.254.169.254`, `metadata.google.internal`                                        | Usługi metadanych chmur                            |
| `100.64.0.0/10`                                                                      | Współdzielona przestrzeń adresowa NAT klasy operatorskiej |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Zakresy testów porównawczych                       |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Zakresy specjalnego przeznaczenia i dokumentacyjne |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                          |
| `240.0.0.0/4`                                                                        | Zarezerwowane IPv4                                 |
| `fc00::/7`, `fec0::/10`                                                              | Lokalne/prywatne zakresy IPv6                      |
| `100::/64`, `2001:20::/28`                                                           | Zakresy IPv6 discard i ORCHIDv2                    |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefiksy NAT64 z osadzonym IPv4                    |
| `2002::/16`, `2001::/32`                                                             | 6to4 i Teredo z osadzonym IPv4                     |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 zgodne z IPv4 i IPv6 mapowane na IPv4         |

Jeśli twój dostawca chmury lub platforma sieciowa dokumentuje dodatkowe hosty metadanych albo zarezerwowane zakresy, dodaj je również.

## Walidacja

Zweryfikuj proxy z tego samego hosta, kontenera lub konta usługi, które uruchamia OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Domyślnie, gdy nie podano niestandardowych miejsc docelowych, polecenie sprawdza, czy `https://example.com/` kończy się powodzeniem, i uruchamia tymczasowy kanarek loopback, do którego proxy nie może dotrzeć. Domyślne sprawdzenie odmowy przechodzi, gdy proxy zwraca odpowiedź odmowy inną niż 2xx albo blokuje kanarka przez błąd transportu; kończy się niepowodzeniem, jeśli pomyślna odpowiedź dotrze do kanarka. Jeśli żadne proxy nie jest włączone i skonfigurowane, walidacja zgłasza problem z konfiguracją; użyj `--proxy-url` do jednorazowego sprawdzenia wstępnego przed zmianą konfiguracji. Użyj `--allowed-url` i `--denied-url`, aby przetestować oczekiwania specyficzne dla wdrożenia. Dodaj `--apns-reachable`, aby dodatkowo sprawdzić, czy bezpośrednie dostarczanie APNs HTTP/2 może otworzyć tunel CONNECT przez proxy i otrzymać odpowiedź APNs z piaskownicy; sonda używa celowo nieprawidłowego tokenu dostawcy, więc `403 InvalidProviderToken` jest oczekiwane i oznacza osiągalność. Niestandardowe miejsca docelowe z odmową są fail-closed: każda odpowiedź HTTP oznacza, że miejsce docelowe było osiągalne przez proxy, a każdy błąd transportu jest zgłaszany jako nierozstrzygający, ponieważ OpenClaw nie może udowodnić, że proxy zablokowało osiągalne źródło. W przypadku niepowodzenia walidacji polecenie kończy działanie z kodem 1.

Użyj `--json` do automatyzacji. Dane wyjściowe JSON zawierają ogólny wynik, efektywne źródło konfiguracji proxy, wszelkie błędy konfiguracji oraz każde sprawdzenie miejsca docelowego. Dane uwierzytelniające w URL proxy są redagowane w danych wyjściowych tekstowych i JSON:

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

Możesz także zweryfikować ręcznie za pomocą `curl`:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

Żądanie publiczne powinno zakończyć się powodzeniem. Żądania loopback i metadanych powinny zostać zablokowane przez proxy. W przypadku `openclaw proxy validate` wbudowany kanarek loopback potrafi odróżnić odmowę proxy od osiągalnego źródła. Niestandardowe sprawdzenia `--denied-url` nie mają tego kanarka, więc traktuj zarówno odpowiedzi HTTP, jak i niejednoznaczne błędy transportu jako niepowodzenia walidacji, chyba że Twoje proxy udostępnia specyficzny dla wdrożenia sygnał odmowy, który możesz zweryfikować osobno.

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

- Proxy zwiększa pokrycie dla lokalnych w procesie klientów JavaScript HTTP i WebSocket, ale nie jest sieciową piaskownicą na poziomie systemu operacyjnego.
- Ruch płaszczyzny sterowania Gateway loopback domyślnie używa bezpośredniego obejścia lokalnego przez `proxy.loopbackMode: "gateway-only"`. OpenClaw implementuje to obejście przez rejestrowanie aktywnego autorytetu Gateway loopback w zarządzanym kontrolerze `global-agent` `NO_PROXY`. Operatorzy mogą ustawić `proxy.loopbackMode: "proxy"`, aby wysyłać ruch Gateway loopback przez zarządzane proxy, albo `proxy.loopbackMode: "block"`, aby odmawiać połączeń Gateway loopback. Zobacz [Tryb Gateway Loopback](#gateway-loopback-mode), aby poznać zastrzeżenie dotyczące zdalnego proxy.
- Surowe gniazda `net`, `tls` i `http2`, natywne dodatki oraz procesy potomne spoza OpenClaw mogą omijać routing proxy na poziomie Node, chyba że dziedziczą i respektują zmienne środowiskowe proxy. Rozwidlone potomne CLI OpenClaw dziedziczą zarządzany URL proxy i stan `proxy.loopbackMode`.
- IRC jest surowym kanałem TCP/TLS poza routingiem przez forward proxy zarządzanym przez operatora. We wdrożeniach, które wymagają całego ruchu wychodzącego przez to forward proxy, ustaw `channels.irc.enabled=false`, chyba że bezpośredni ruch wychodzący IRC jest jawnie zatwierdzony.
- Lokalny debug proxy jest narzędziem diagnostycznym, a jego bezpośrednie przekazywanie upstream dla żądań proxy i tuneli CONNECT jest domyślnie wyłączone, gdy aktywny jest zarządzany tryb proxy; włącz bezpośrednie przekazywanie tylko na potrzeby zatwierdzonej diagnostyki lokalnej.
- Lokalne WebUI użytkownika i lokalne serwery modeli powinny w razie potrzeby zostać dodane do listy dozwolonych w polityce proxy operatora; OpenClaw nie udostępnia dla nich ogólnego obejścia sieci lokalnej.
- Obejście proxy płaszczyzny sterowania Gateway jest celowo ograniczone do adresów URL `localhost` i literalnych adresów IP loopback. Użyj `ws://127.0.0.1:18789`, `ws://[::1]:18789` albo `ws://localhost:18789` dla lokalnych bezpośrednich połączeń płaszczyzny sterowania Gateway; inne nazwy hostów są trasowane jak zwykły ruch oparty na nazwie hosta.
- OpenClaw nie sprawdza, nie testuje ani nie certyfikuje Twojej polityki proxy.
- Traktuj zmiany polityki proxy jako zmiany operacyjne wrażliwe z punktu widzenia bezpieczeństwa.
