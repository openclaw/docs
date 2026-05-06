---
read_when:
    - Potrzebujesz wielowarstwowej ochrony przed atakami SSRF i atakami polegającymi na ponownym wiązaniu DNS
    - Konfigurowanie zewnętrznego serwera proxy przekazującego ruch środowiska wykonawczego OpenClaw
summary: Jak kierować ruch HTTP i WebSocket środowiska uruchomieniowego OpenClaw przez proxy filtrujące zarządzane przez operatora
title: Proxy sieciowy
x-i18n:
    generated_at: "2026-05-06T18:00:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: aed1cd94ce6a32cd8a3f6c7e579011992af87c1ccc40eb53efaa83b020a6792b
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw może kierować ruch HTTP i WebSocket w czasie wykonywania przez zarządzany przez operatora forward proxy. To opcjonalna obrona warstwowa dla wdrożeń, które wymagają centralnej kontroli ruchu wychodzącego, silniejszej ochrony przed SSRF i lepszej audytowalności sieci.

OpenClaw nie dostarcza, nie pobiera, nie uruchamia, nie konfiguruje ani nie certyfikuje proxy. Uruchamiasz technologię proxy dopasowaną do swojego środowiska, a OpenClaw kieruje przez nią zwykłe lokalne dla procesu klienty HTTP i WebSocket.

## Dlaczego używać proxy

Proxy daje operatorom jeden punkt kontroli sieci dla wychodzącego ruchu HTTP i WebSocket. Może to być przydatne także poza wzmacnianiem ochrony przed SSRF:

- Centralna polityka: utrzymuj jedną politykę ruchu wychodzącego zamiast polegać na tym, że każde miejsce wywołań HTTP w aplikacji poprawnie zastosuje reguły sieciowe.
- Kontrole w momencie połączenia: oceniaj cel po rozpoznaniu DNS i bezpośrednio przed otwarciem przez proxy połączenia upstream.
- Obrona przed DNS rebinding: zmniejsz odstęp między kontrolą DNS na poziomie aplikacji a faktycznym połączeniem wychodzącym.
- Szersze pokrycie JavaScript: kieruj zwykłe klienty `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch i podobne tą samą ścieżką.
- Audytowalność: rejestruj dozwolone i odrzucone cele na granicy ruchu wychodzącego.
- Kontrola operacyjna: egzekwuj reguły celów, segmentację sieci, limity szybkości lub listy dozwolonych celów wychodzących bez przebudowywania OpenClaw.

Kierowanie przez proxy jest zabezpieczeniem na poziomie procesu dla zwykłego wychodzącego ruchu HTTP i WebSocket. Daje operatorom ścieżkę fail-closed do kierowania obsługiwanych klientów HTTP JavaScript przez ich własne filtrujące proxy, ale nie jest piaskownicą sieciową na poziomie systemu operacyjnego i nie sprawia, że OpenClaw certyfikuje politykę celów proxy.

## Jak OpenClaw kieruje ruch

Gdy skonfigurowano `proxy.enabled=true` oraz URL proxy, chronione procesy uruchomieniowe, takie jak `openclaw gateway run`, `openclaw node run` i `openclaw agent --local`, kierują zwykły wychodzący ruch HTTP i WebSocket przez skonfigurowane proxy:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Publiczną umową jest zachowanie kierowania ruchu, a nie wewnętrzne haki Node używane do jego implementacji. Klienty WebSocket płaszczyzny sterowania OpenClaw Gateway używają wąskiej ścieżki bezpośredniej dla ruchu RPC do local loopback Gateway, gdy URL Gateway używa `localhost` albo dosłownego adresu IP pętli zwrotnej, takiego jak `127.0.0.1` lub `[::1]`. Ta ścieżka płaszczyzny sterowania musi móc docierać do Gateway w pętli zwrotnej nawet wtedy, gdy proxy operatora blokuje cele w pętli zwrotnej. Zwykłe żądania HTTP i WebSocket w czasie wykonywania nadal używają skonfigurowanego proxy.

Wewnętrznie OpenClaw używa dla tej funkcji dwóch haków kierowania na poziomie procesu:

- Kierowanie przez dispatcher Undici obejmuje `fetch`, klientów opartych na undici oraz transporty, które udostępniają własny dispatcher undici.
- Kierowanie `global-agent` obejmuje wywołujących z rdzenia Node `node:http` i `node:https`, w tym wiele bibliotek zbudowanych na `http.request`, `https.request`, `http.get` i `https.get`. Zarządzany tryb proxy wymusza tego globalnego agenta, aby jawni agenci HTTP Node nie ominęli przypadkowo proxy operatora.

Niektóre pluginy są właścicielami niestandardowych transportów, które wymagają jawnego podłączenia proxy nawet wtedy, gdy istnieje kierowanie na poziomie procesu. Na przykład transport Bot API Telegram używa własnego dispatchera HTTP/1 undici, dlatego respektuje zmienne środowiskowe proxy procesu oraz zarządzany fallback `OPENCLAW_PROXY_URL` w tej ścieżce transportu właściwej dla właściciela.

Sam URL proxy musi używać `http://`. Cele HTTPS są nadal obsługiwane przez proxy za pomocą HTTP `CONNECT`; oznacza to tylko, że OpenClaw oczekuje zwykłego nasłuchu HTTP forward-proxy, takiego jak `http://127.0.0.1:3128`.

Gdy proxy jest aktywne, OpenClaw czyści `no_proxy`, `NO_PROXY` i `GLOBAL_AGENT_NO_PROXY`. Te listy obejść są oparte na celu, więc pozostawienie tam `localhost` lub `127.0.0.1` pozwoliłoby celom SSRF wysokiego ryzyka ominąć filtrujące proxy.

Podczas zamykania OpenClaw przywraca poprzednie środowisko proxy i resetuje buforowany stan kierowania procesu.

## Powiązane terminy proxy

- `proxy.enabled` / `proxy.proxyUrl`: wychodzące kierowanie przez forward-proxy dla ruchu OpenClaw w czasie wykonywania. Ta strona dokumentuje tę funkcję.
- `gateway.auth.mode: "trusted-proxy"`: przychodzące uwierzytelnianie przez reverse-proxy świadome tożsamości dla dostępu do Gateway. Zobacz [Uwierzytelnianie przez zaufane proxy](/pl/gateway/trusted-proxy-auth).
- `openclaw proxy`: lokalne proxy debugowania i inspektor przechwytywania dla rozwoju i wsparcia. Zobacz [openclaw proxy](/pl/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: opcja włączana jawnie dla `web_fetch`, aby umożliwić kontrolowanemu przez operatora proxy HTTP(S) ze środowiska rozpoznawanie DNS przy zachowaniu domyślnego ścisłego przypięcia DNS i polityki nazw hostów. Zobacz [Pobieranie z sieci](/pl/tools/web-fetch#trusted-env-proxy).
- Ustawienia proxy specyficzne dla kanału lub dostawcy: nadpisania właściwe dla właściciela konkretnego transportu. Preferuj zarządzane proxy sieciowe, gdy celem jest centralna kontrola ruchu wychodzącego w całym środowisku wykonawczym.

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

Lokalne klienty płaszczyzny sterowania Gateway zwykle łączą się z WebSocket w pętli zwrotnej, takim jak `ws://127.0.0.1:18789`. Użyj `proxy.loopbackMode`, aby wybrać zachowanie tego ruchu, gdy zarządzane proxy jest aktywne:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (domyślnie): OpenClaw rejestruje autorytet pętli zwrotnej Gateway w aktywnym kontrolerze `NO_PROXY` `global-agent`, aby lokalny ruch WebSocket Gateway mógł łączyć się bezpośrednio. Niestandardowe porty Gateway w pętli zwrotnej działają, ponieważ host i port aktywnego URL Gateway są rejestrowane.
- `proxy`: OpenClaw nie rejestruje autorytetu `NO_PROXY` dla Gateway w pętli zwrotnej, więc lokalny ruch Gateway jest wysyłany przez zarządzane proxy. Jeśli proxy jest zdalne, musi zapewniać specjalne kierowanie do usługi pętli zwrotnej hosta OpenClaw, na przykład mapowanie jej na nazwę hosta, adres IP lub tunel osiągalny z proxy. Standardowe zdalne proxy rozpoznają `127.0.0.1` i `localhost` z hosta proxy, a nie z hosta OpenClaw.
- `block`: OpenClaw odrzuca połączenia płaszczyzny sterowania Gateway w pętli zwrotnej przed otwarciem gniazda.

Jeśli `enabled=true`, ale nie skonfigurowano prawidłowego URL proxy, chronione polecenia kończą uruchamianie niepowodzeniem zamiast wracać do bezpośredniego dostępu do sieci.

Dla zarządzanych usług Gateway uruchamianych przez `openclaw gateway start` preferuj przechowywanie URL w konfiguracji:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Fallback środowiskowy najlepiej sprawdza się przy uruchomieniach pierwszoplanowych. Jeśli używasz go z zainstalowaną usługą, umieść `OPENCLAW_PROXY_URL` w trwałym środowisku usługi, takim jak `$OPENCLAW_STATE_DIR/.env` lub `~/.openclaw/.env`, a następnie zainstaluj usługę ponownie, aby launchd, systemd lub Scheduled Tasks uruchamiały Gateway z tą wartością.

Dla poleceń `openclaw --container ...` OpenClaw przekazuje `OPENCLAW_PROXY_URL` do docelowego dla kontenera procesu potomnego CLI, gdy jest ustawiony. URL musi być osiągalny z wnętrza kontenera; `127.0.0.1` odnosi się do samego kontenera, a nie do hosta. OpenClaw odrzuca URL-e proxy w pętli zwrotnej dla poleceń docelowych dla kontenera, chyba że jawnie nadpiszesz tę kontrolę bezpieczeństwa.

## Wymagania proxy

Polityka proxy jest granicą bezpieczeństwa. OpenClaw nie może zweryfikować, czy proxy blokuje właściwe cele.

Skonfiguruj proxy tak, aby:

- Wiązało się tylko z pętlą zwrotną lub prywatnym zaufanym interfejsem.
- Ograniczało dostęp tak, aby używać go mógł tylko proces, host, kontener lub konto usługi OpenClaw.
- Samodzielnie rozpoznawało cele i blokowało docelowe adresy IP po rozpoznaniu DNS.
- Stosowało politykę w momencie połączenia zarówno dla zwykłych żądań HTTP, jak i tuneli HTTPS `CONNECT`.
- Odrzucało obejścia oparte na celu dla zakresów pętli zwrotnej, prywatnych, link-local, metadanych, multicast, zarezerwowanych lub dokumentacyjnych.
- Unikało list dozwolonych nazw hostów, chyba że w pełni ufasz ścieżce rozpoznawania DNS.
- Rejestrowało cel, decyzję, status i powód bez rejestrowania treści żądań, nagłówków autoryzacji, plików cookie ani innych sekretów.
- Utrzymywało politykę proxy pod kontrolą wersji i przeglądało zmiany tak jak konfigurację wrażliwą na bezpieczeństwo.

## Zalecane blokowane cele

Użyj tej denylist jako punktu wyjścia dla dowolnego forward proxy, zapory sieciowej lub polityki ruchu wychodzącego.

Logika klasyfikatora na poziomie aplikacji OpenClaw znajduje się w `src/infra/net/ssrf.ts` i `src/shared/net/ip.ts`. Odpowiednie haki zgodności to `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` oraz obsługa osadzonych sentinel IPv4 dla NAT64, 6to4, Teredo, ISATAP i form IPv4-mapped. Te pliki są przydatnymi odniesieniami podczas utrzymywania zewnętrznej polityki proxy, ale OpenClaw nie eksportuje automatycznie ani nie egzekwuje tych reguł w Twoim proxy.

| Zakres lub host                                                                       | Dlaczego blokować                                      |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Pętla zwrotna IPv4                                     |
| `::1/128`                                                                            | Pętla zwrotna IPv6                                     |
| `0.0.0.0/8`, `::/128`                                                                | Adresy nieokreślone i adresy tej sieci                 |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Prywatne sieci RFC1918                                 |
| `169.254.0.0/16`, `fe80::/10`                                                        | Adresy link-local i typowe ścieżki metadanych chmury   |
| `169.254.169.254`, `metadata.google.internal`                                        | Usługi metadanych chmury                               |
| `100.64.0.0/10`                                                                      | Współdzielona przestrzeń adresowa NAT klasy operatorskiej |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Zakresy testów wydajnościowych                         |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Zakresy specjalnego użycia i dokumentacyjne            |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                              |
| `240.0.0.0/4`                                                                        | Zarezerwowane IPv4                                     |
| `fc00::/7`, `fec0::/10`                                                              | Lokalne/prywatne zakresy IPv6                          |
| `100::/64`, `2001:20::/28`                                                           | Zakresy odrzucania IPv6 i ORCHIDv2                     |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefiksy NAT64 z osadzonym IPv4                        |
| `2002::/16`, `2001::/32`                                                             | 6to4 i Teredo z osadzonym IPv4                         |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 zgodne z IPv4 i IPv6 mapowane na IPv4             |

Jeśli Twój dostawca chmury lub platforma sieciowa dokumentuje dodatkowe hosty metadanych albo zarezerwowane zakresy, dodaj również je.

## Walidacja

Zweryfikuj proxy z tego samego hosta, kontenera lub konta usługi, które uruchamia OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Domyślnie, gdy nie podano niestandardowych miejsc docelowych, polecenie sprawdza, czy `https://example.com/` kończy się powodzeniem, i uruchamia tymczasowy znacznik testowy pętli zwrotnej, do którego proxy nie może dotrzeć. Domyślna kontrola odmowy przechodzi pomyślnie, gdy proxy zwraca odpowiedź odmowy inną niż 2xx albo blokuje znacznik testowy błędem transportu; kończy się niepowodzeniem, jeśli skuteczna odpowiedź dotrze do znacznika testowego. Jeśli żadne proxy nie jest włączone i skonfigurowane, walidacja zgłasza problem z konfiguracją; użyj `--proxy-url` do jednorazowej kontroli wstępnej przed zmianą konfiguracji. Użyj `--allowed-url` i `--denied-url`, aby przetestować oczekiwania specyficzne dla wdrożenia. Dodaj `--apns-reachable`, aby sprawdzić również, czy bezpośrednie dostarczanie APNs przez HTTP/2 może otworzyć tunel CONNECT przez proxy i odebrać odpowiedź z piaskownicy APNs; sonda używa celowo nieprawidłowego tokenu dostawcy, więc `403 InvalidProviderToken` jest oczekiwane i liczy się jako osiągalność. Niestandardowe zabronione miejsca docelowe działają w trybie zamkniętym przy błędzie: każda odpowiedź HTTP oznacza, że miejsce docelowe było osiągalne przez proxy, a każdy błąd transportu jest raportowany jako nierozstrzygający, ponieważ OpenClaw nie może udowodnić, że proxy zablokowało osiągalne źródło. W przypadku niepowodzenia walidacji polecenie kończy działanie z kodem 1.

Użyj `--json` do automatyzacji. Dane wyjściowe JSON zawierają ogólny wynik, efektywne źródło konfiguracji proxy, wszelkie błędy konfiguracji oraz każdą kontrolę miejsca docelowego. Dane uwierzytelniające w URL proxy są redagowane w danych wyjściowych tekstowych i JSON:

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

Możesz też przeprowadzić walidację ręcznie za pomocą `curl`:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

Żądanie publiczne powinno zakończyć się powodzeniem. Żądania do pętli zwrotnej i metadanych powinny zostać zablokowane przez proxy. W przypadku `openclaw proxy validate` wbudowany znacznik testowy pętli zwrotnej potrafi odróżnić odmowę proxy od osiągalnego źródła. Niestandardowe kontrole `--denied-url` nie mają tego znacznika testowego, więc traktuj zarówno odpowiedzi HTTP, jak i niejednoznaczne awarie transportu jako niepowodzenia walidacji, chyba że twoje proxy udostępnia specyficzny dla wdrożenia sygnał odmowy, który możesz zweryfikować oddzielnie.

Następnie włącz routing proxy OpenClaw:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway run
```

lub ustaw:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

## Ograniczenia

- Proxy poprawia pokrycie dla lokalnych dla procesu klientów HTTP i WebSocket w JavaScript, ale nie jest sieciową piaskownicą na poziomie systemu operacyjnego.
- Ruch płaszczyzny sterowania Gateway przez pętlę zwrotną domyślnie używa bezpośredniego lokalnego obejścia przez `proxy.loopbackMode: "gateway-only"`. OpenClaw implementuje to obejście, rejestrując aktywny autorytet pętli zwrotnej Gateway w zarządzanym kontrolerze `NO_PROXY` `global-agent`. Operatorzy mogą ustawić `proxy.loopbackMode: "proxy"`, aby wysyłać ruch Gateway przez pętlę zwrotną przez zarządzane proxy, albo `proxy.loopbackMode: "block"`, aby odmawiać połączeń Gateway przez pętlę zwrotną. Zobacz [Tryb pętli zwrotnej Gateway](#gateway-loopback-mode), aby poznać zastrzeżenie dotyczące zdalnego proxy.
- Surowe gniazda `net`, `tls` i `http2`, dodatki natywne oraz procesy podrzędne spoza OpenClaw mogą omijać routing proxy na poziomie Node, chyba że dziedziczą i respektują zmienne środowiskowe proxy. Rozwidlane podrzędne CLI OpenClaw dziedziczą zarządzany URL proxy oraz stan `proxy.loopbackMode`.
- IRC jest surowym kanałem TCP/TLS poza routingiem przez zarządzane przez operatora proxy przekazujące. We wdrożeniach, które wymagają całego ruchu wychodzącego przez to proxy przekazujące, ustaw `channels.irc.enabled=false`, chyba że bezpośredni ruch wychodzący IRC jest jawnie zatwierdzony.
- Lokalne proxy debugowania jest narzędziem diagnostycznym, a jego bezpośrednie przekazywanie do źródła nadrzędnego dla żądań proxy i tuneli CONNECT jest domyślnie wyłączone, gdy aktywny jest tryb zarządzanego proxy; włącz bezpośrednie przekazywanie tylko dla zatwierdzonej diagnostyki lokalnej.
- Lokalne interfejsy WebUI użytkownika i lokalne serwery modeli powinny być w razie potrzeby dodane do listy dozwolonych w polityce proxy operatora; OpenClaw nie udostępnia dla nich ogólnego obejścia sieci lokalnej.
- Obejście proxy dla płaszczyzny sterowania Gateway jest celowo ograniczone do `localhost` i dosłownych URL-i IP pętli zwrotnej. Użyj `ws://127.0.0.1:18789`, `ws://[::1]:18789` lub `ws://localhost:18789` dla lokalnych bezpośrednich połączeń z płaszczyzną sterowania Gateway; inne nazwy hostów są routowane jak zwykły ruch oparty na nazwie hosta.
- OpenClaw nie sprawdza, nie testuje ani nie certyfikuje twojej polityki proxy.
- Traktuj zmiany polityki proxy jako wrażliwe pod względem bezpieczeństwa zmiany operacyjne.
