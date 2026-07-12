---
read_when:
    - Potrzebujesz wielowarstwowej ochrony przed atakami SSRF i ponownym wiązaniem DNS
    - Konfigurowanie zewnętrznego serwera proxy przekazującego ruch środowiska uruchomieniowego OpenClaw
summary: Jak kierować ruch HTTP i WebSocket środowiska uruchomieniowego OpenClaw przez zarządzany przez operatora serwer proxy z filtrowaniem
title: Serwer proxy sieciowy
x-i18n:
    generated_at: "2026-07-12T15:40:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd82684a17a79242891eca69c549c0bfcdd5bde40fa4e791dda7f2b62c473c89
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw może kierować ruch HTTP i WebSocket środowiska uruchomieniowego przez zarządzany przez operatora serwer proxy przekazujący. Jest to opcjonalna ochrona warstwowa: scentralizowana kontrola ruchu wychodzącego, skuteczniejsza ochrona przed SSRF oraz możliwość audytowania miejsc docelowych na granicy sieci. Ponieważ serwer proxy ocenia miejsce docelowe w momencie nawiązywania połączenia — po rozwiązaniu DNS i bezpośrednio przed otwarciem połączenia z serwerem nadrzędnym — ogranicza również lukę wykorzystywaną przez ataki z ponownym wiązaniem DNS między wcześniejszą kontrolą DNS na poziomie aplikacji a rzeczywistym połączeniem wychodzącym. Jedna polityka serwera proxy zapewnia też operatorom jedno miejsce do egzekwowania reguł dotyczących miejsc docelowych, segmentacji sieci, limitów szybkości lub list dozwolonych połączeń wychodzących bez konieczności ponownego budowania OpenClaw.

OpenClaw nie dostarcza, nie pobiera, nie uruchamia, nie konfiguruje ani nie certyfikuje serwera proxy. Uruchamiasz technologię proxy odpowiednią dla swojego środowiska, a OpenClaw kieruje przez nią ruch własnych klientów HTTP i WebSocket.

## Konfiguracja

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Możesz również ustawić adres URL za pośrednictwem środowiska, pozostawiając `proxy.enabled: true` w konfiguracji:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` ma pierwszeństwo przed `OPENCLAW_PROXY_URL`. Jeśli `proxy.enabled` ma wartość `true`, ale nie uda się ustalić prawidłowego adresu URL, chronione polecenia nie uruchomią się, zamiast przełączyć się awaryjnie na bezpośredni dostęp do sieci.

| Klucz                | Typ                                  | Wartość domyślna | Uwagi                                                                                                                                                                  |
| -------------------- | ------------------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.enabled`      | wartość logiczna                     | nieustawiona     | Aby aktywować trasowanie, musi mieć wartość `true`.                                                                                                                     |
| `proxy.proxyUrl`     | ciąg znaków                          | nieustawiona     | Adres URL serwera proxy przekazującego z prefiksem `http://` lub `https://`. Dane uwierzytelniające osadzone w adresie URL są traktowane jako poufne i usuwane ze zrzutów oraz dzienników. |
| `proxy.tls.caFile`   | ciąg znaków                          | nieustawiona     | Pakiet CA do weryfikacji punktu końcowego proxy `https://` podpisanego przez prywatny urząd certyfikacji.                                                               |
| `proxy.loopbackMode` | `gateway-only` \| `proxy` \| `block` | `gateway-only`   | Steruje pomijaniem serwera proxy dla połączeń zwrotnych; patrz niżej.                                                                                                   |

W przypadku zarządzanych usług Gateway zapisz adres URL w konfiguracji, aby przetrwał ponowną instalację, zamiast polegać na zmiennej środowiskowej procesu pierwszoplanowego:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Awaryjna wartość ze zmiennej środowiskowej `OPENCLAW_PROXY_URL` najlepiej sprawdza się przy uruchamianiu na pierwszym planie. Aby używać jej z zainstalowaną usługą, umieść ją w trwałym środowisku usługi (`$OPENCLAW_STATE_DIR/.env`, domyślnie `~/.openclaw/.env`), a następnie zainstaluj usługę ponownie, aby mechanizm launchd/systemd/Zaplanowane zadania ją wczytał.

### Punkt końcowy proxy HTTPS z prywatnym urzędem certyfikacji

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

`proxy.tls.caFile` weryfikuje własny certyfikat TLS punktu końcowego proxy. Nie jest to ustawienie zaufania do ataku MITM wobec miejsca docelowego, certyfikat klienta ani zamiennik polityki miejsc docelowych serwera proxy. Zamiast tego używaj `NODE_EXTRA_CA_CERTS` tylko wtedy, gdy cały proces Node musi od chwili uruchomienia ufać dodatkowemu urzędowi certyfikacji (na przykład gdy firmowy system inspekcji TLS ponownie podpisuje każdy certyfikat docelowego serwera HTTPS) — ta zmienna obowiązuje w całym procesie i musi zostać ustawiona przed uruchomieniem Node, dlatego OpenClaw nie może zastosować jej w trakcie działania tak jak `proxy.tls.caFile`. Do ustanawiania zaufania do punktu końcowego proxy HTTPS preferuj `proxy.tls.caFile`: jego zakres jest ograniczony do zarządzanego trasowania przez proxy, a nie do całego procesu.

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

## Jak działa trasowanie

Gdy `proxy.enabled: true` i ustawiono prawidłowy adres URL, chronione procesy środowiska uruchomieniowego (`openclaw gateway run`, `openclaw node run`, `openclaw agent --local`) kierują zwykły wychodzący ruch HTTP i WebSocket przez serwer proxy:

```text
Proces OpenClaw
  klienci fetch, node:http, node:https i WebSocket  -> serwer proxy operatora -> miejsce docelowe
```

Wewnętrznie OpenClaw instaluje [Proxyline](https://github.com/openclaw/proxyline) jako środowisko trasowania na poziomie procesu. Obejmuje ono `fetch`, klientów opartych na undici, `node:http`/`node:https`, popularnych klientów WebSocket oraz tunele `CONNECT` tworzone przez funkcje pomocnicze, a także zastępuje agenty HTTP Node dostarczone przez kod wywołujący, dzięki czemu jawnie określone agenty (w tym `axios`, `got`, `node-fetch` i podobni klienci korzystający z agentów Node) nie mogą po cichu ominąć serwera proxy.

Schemat adresu URL proxy opisuje etap połączenia między OpenClaw a serwerem proxy, a nie końcowym miejscem docelowym:

- `http://proxy.example:3128` — zwykłe połączenie TCP z serwerem proxy; OpenClaw wysyła żądania proxy HTTP, w tym `CONNECT` dla miejsc docelowych HTTPS.
- `https://proxy.example:8443` — OpenClaw otwiera połączenie TLS z samym serwerem proxy (weryfikując jego certyfikat), a następnie wysyła żądania proxy HTTP wewnątrz tej sesji.

TLS miejsca docelowego jest niezależny od TLS punktu końcowego proxy: w przypadku miejsca docelowego HTTPS OpenClaw zawsze żąda od serwera proxy tunelu `CONNECT` i uruchamia przez niego TLS miejsca docelowego.

Gdy serwer proxy jest aktywny, OpenClaw usuwa wartości `no_proxy`/`NO_PROXY`. Te listy wyjątków są oparte na miejscach docelowych; pozostawienie na nich `localhost` lub `127.0.0.1` pozwoliłoby celom SSRF całkowicie ominąć serwer proxy. Podczas zamykania OpenClaw przywraca wcześniejsze środowisko proxy i resetuje buforowany stan trasowania.

Niektóre pluginy dysponują własnym transportem, który wymaga osobnej konfiguracji proxy nawet przy aktywnym trasowaniu na poziomie procesu. Klient Bot API Telegrama używa własnego programu rozsyłającego HTTP/1 biblioteki undici i oddzielnie uwzględnia zmienne środowiskowe proxy procesu oraz awaryjną wartość `OPENCLAW_PROXY_URL`.

### Tryb local loopback Gateway

Lokalni klienci płaszczyzny sterowania Gateway zwykle łączą się z adresem WebSocket local loopback, takim jak `ws://127.0.0.1:18789`. `proxy.loopbackMode` określa, czy ten ruch omija zarządzany serwer proxy:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy lub block
```

| Tryb                     | Zachowanie                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway-only` (domyślny) | OpenClaw rejestruje aktywny lokalny punkt Gateway jako wyjątek z połączeniem bezpośrednim, dzięki czemu lokalny ruch WebSocket Gateway łączy się bez użycia serwera proxy. Niestandardowe porty local loopback działają, ponieważ wyjątek dotyczy dokładnie skonfigurowanego hosta i portu. Dołączony plugin przeglądarki rejestruje wyjątek tego samego rodzaju dla dokładnych lokalnych adresów URL gotowości CDP oraz WebSocket DevTools zarządzanych przeglądarek uruchamianych przez OpenClaw; dołączony dostawca osadzeń pamięci Ollama ma węższą, chronioną ścieżkę bezpośrednią dla dokładnie skonfigurowanego lokalnego źródła osadzeń local loopback. |
| `proxy`                  | Nie są rejestrowane żadne wyjątki local loopback; ruch Gateway i Ollama kierowany do local loopback przechodzi przez serwer proxy. Zdalny serwer proxy musi być w stanie skierować ruch z powrotem do usługi local loopback na hoście OpenClaw (na przykład przez osiągalną nazwę hosta, adres IP lub tunel) — standardowy zdalny serwer proxy rozwiązuje `127.0.0.1`/`localhost` względem samego siebie, a nie hosta OpenClaw.                                                                                                                                                                                                 |
| `block`                  | OpenClaw odrzuca połączenia płaszczyzny sterowania Gateway kierowane do local loopback oraz chronione połączenia osadzeń Ollama kierowane do local loopback przed otwarciem gniazda.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

Pomijanie serwera proxy przez płaszczyznę sterowania Gateway jest ograniczone do `localhost` i adresów URL zawierających bezpośrednie adresy IP local loopback — użyj `ws://127.0.0.1:18789`, `ws://[::1]:18789` lub `ws://localhost:18789`. Inne nazwy hostów są trasowane jak zwykły ruch.

### Kontenery

W przypadku poleceń `openclaw --container ...` OpenClaw przekazuje `OPENCLAW_PROXY_URL` do podrzędnego CLI działającego w kontenerze, jeśli ta zmienna jest ustawiona. Adres URL musi być osiągalny z wnętrza kontenera — znajdujący się tam adres `127.0.0.1` odnosi się do samego kontenera, a nie hosta. OpenClaw odrzuca adresy URL proxy local loopback dla poleceń kierowanych do kontenera, chyba że ustawisz `OPENCLAW_CONTAINER_ALLOW_LOOPBACK_PROXY_URL=1`, aby jawnie zastąpić tę kontrolę.

## Powiązane terminy dotyczące proxy

- `proxy.enabled` / `proxy.proxyUrl` — wychodzące trasowanie przez serwer proxy przekazujący dla ruchu wychodzącego środowiska uruchomieniowego. Ta strona.
- `gateway.auth.mode: "trusted-proxy"` — uwierzytelnianie przychodzące za pomocą zwrotnego serwera proxy, uwzględniające tożsamość i służące do uzyskiwania dostępu do Gateway. Zobacz [Uwierzytelnianie za pomocą zaufanego serwera proxy](/pl/gateway/trusted-proxy-auth).
- `openclaw proxy` — lokalny serwer proxy do debugowania oraz inspektor przechwyconego ruchu na potrzeby rozwoju i pomocy technicznej. Zobacz [openclaw proxy](/pl/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy` — opcjonalne ustawienie dla `web_fetch`, które pozwala kontrolowanemu przez operatora serwerowi proxy HTTP(S) ze środowiska rozwiązywać DNS, zachowując domyślnie ścisłe przypinanie DNS i politykę nazw hostów. Zobacz [Pobieranie z internetu](/pl/tools/web-fetch#trusted-env-proxy).
- Ustawienia proxy właściwe dla kanału lub dostawcy — zastąpienia dotyczące jednego transportu, zarządzane przez jego właściciela. W celu scentralizowanej kontroli ruchu wychodzącego w całym środowisku uruchomieniowym preferuj zarządzany sieciowy serwer proxy.

## Weryfikowanie serwera proxy

Polityka miejsc docelowych serwera proxy stanowi właściwą granicę bezpieczeństwa; OpenClaw nie może sprawdzić, czy serwer proxy blokuje odpowiednie cele. Skonfiguruj go tak, aby:

- Nasłuchiwał tylko na interfejsie local loopback lub prywatnym zaufanym interfejsie, dostępnym wyłącznie dla procesu, hosta, kontenera lub konta usługi OpenClaw.
- Samodzielnie rozwiązywał miejsca docelowe i blokował je według adresu IP po rozwiązaniu DNS, w momencie nawiązywania połączenia, zarówno dla zwykłego HTTP, jak i tuneli HTTPS `CONNECT`.
- Odrzucał wyjątki oparte na miejscach docelowych dla zakresów local loopback, prywatnych, łącza lokalnego, metadanych, multicast, zastrzeżonych i dokumentacyjnych.
- Unikał list dozwolonych nazw hostów, chyba że w pełni ufasz ścieżce rozwiązywania DNS.
- Rejestrował miejsce docelowe, decyzję, stan i przyczynę — nigdy treści żądań, nagłówków autoryzacji, plików cookie ani innych sekretów.
- Przechowywał politykę w systemie kontroli wersji i traktował jej zmiany jako istotne dla bezpieczeństwa.

Przeprowadź weryfikację z tego samego hosta, kontenera lub konta usługi, które uruchamia OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

W przypadku punktu końcowego proxy HTTPS z prywatnym urzędem certyfikacji:

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

| Flaga                    | Przeznaczenie                                                                 |
| ------------------------ | ----------------------------------------------------------------------------- |
| `--proxy-url <url>`      | Sprawdza ten adres URL zamiast rozpoznawać konfigurację lub zmienne środowiskowe. |
| `--proxy-ca-file <path>` | Pakiet certyfikatów CA dla punktu końcowego proxy HTTPS.                      |
| `--allowed-url <url>`    | Miejsce docelowe, dla którego oczekiwane jest powodzenie (można powtarzać).   |
| `--denied-url <url>`     | Miejsce docelowe, dla którego oczekiwane jest zablokowanie (można powtarzać). |
| `--apns-reachable`       | Sprawdza również, czy proxy może tunelować bezpośrednią sondę HTTP/2 do środowiska testowego APNs. |
| `--apns-authority <url>` | Zastępuje adres APNs sprawdzany za pomocą `--apns-reachable`.                 |
| `--timeout-ms <ms>`      | Limit czasu dla pojedynczego żądania.                                         |
| `--json`                 | Dane wyjściowe w formacie czytelnym maszynowo.                                |

Jeśli `proxy.enabled` nie ma wartości `true` i nie podano `--proxy-url`, polecenie zgłasza problem z konfiguracją zamiast przeprowadzać sprawdzanie. Aby wykonać jednorazową kontrolę wstępną przed zmianą konfiguracji, podaj `--proxy-url`.

Jeśli nie podano `--allowed-url` ani `--denied-url`, domyślnie wykonywane są następujące kontrole: żądanie do `https://example.com/` musi się powieść, a połączenie z tymczasowym serwerem kontrolnym local loopback, do którego proxy nie powinno mieć dostępu, musi zostać zablokowane. Kontrola local loopback kończy się powodzeniem w przypadku błędu transportu lub odpowiedzi innej niż 2xx, która nie zawiera unikatowego tokenu serwera kontrolnego dla danego uruchomienia. Kończy się niepowodzeniem w przypadku odpowiedzi 2xx bez tokenu (nieoczekiwane powodzenie pochodzące z innego źródła niż serwer kontrolny), a zwłaszcza w przypadku dowolnej odpowiedzi zawierającej pasujący token, ponieważ dowodzi ona, że proxy faktycznie przekazało żądanie do miejsca docelowego local loopback, które powinno było odrzucić. Niestandardowe cele `--denied-url` nie mają takiego tokenu kontrolnego, dlatego stosowana jest wobec nich zasada blokowania w razie wątpliwości: każda odpowiedź HTTP oznacza, że cel jest osiągalny (niepowodzenie), natomiast błąd transportu jest zgłaszany jako wynik nierozstrzygający, a nie jako potwierdzone zablokowanie, ponieważ OpenClaw nie może ustalić, czy proxy odrzuciło osiągalne źródło, czy wystąpił inny problem. Opcja `--apns-reachable` wysyła celowo nieprawidłowy token dostawcy, dlatego odpowiedź `403 InvalidProviderToken` stanowi dowód, że tunel dotarł do Apple. Polecenie kończy działanie z kodem `1` w przypadku dowolnego niepowodzenia sprawdzania. Dane uwierzytelniające zawarte w adresie URL proxy są ukrywane zarówno w danych tekstowych, jak i JSON.

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
    { "kind": "allowed", "url": "https://example.com/", "ok": true, "status": 200 },
    { "kind": "apns", "url": "https://api.sandbox.push.apple.com", "ok": true, "status": 403 }
  ]
}
```

Ręczna kontrola za pomocą `curl` (żądanie publiczne powinno się powieść, natomiast żądania local loopback i metadanych powinny zostać zablokowane przez samo proxy — sam program `curl` nie potrafi odróżnić odrzucenia przez proxy od nieosiągalnego źródła tak, jak potrafi to wbudowany serwer kontrolny polecenia `openclaw proxy validate`):

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

## Zalecane blokowane miejsca docelowe

Początkowa lista blokad dla każdego proxy przekazującego, zapory lub zasad ruchu wychodzącego. Własny klasyfikator SSRF OpenClaw znajduje się w `src/infra/net/ssrf.ts` i `packages/net-policy/src/ip.ts` (`BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, prefiks testowy RFC 2544 oraz obsługa osadzonych adresów IPv4 dla formatów NAT64/6to4/Teredo/ISATAP/IPv4-mapped). Są to przydatne materiały referencyjne, ale OpenClaw nie eksportuje ani nie wymusza tych reguł w zewnętrznym proxy.

| Zakres lub host                                                                       | Powód blokowania                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Local loopback IPv4                                        |
| `::1/128`                                                                            | Local loopback IPv6                                        |
| `0.0.0.0/8`, `::/128`                                                                | Adresy nieokreślone lub adresy bieżącej sieci              |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Sieci prywatne RFC 1918                                    |
| `169.254.0.0/16`, `fe80::/10`                                                        | Adresy lokalne dla łącza, w tym typowe ścieżki metadanych chmurowych |
| `169.254.169.254`, `metadata.google.internal`                                        | Usługi metadanych chmurowych                               |
| `100.64.0.0/10`                                                                      | Współdzielona przestrzeń adresowa NAT klasy operatorskiej  |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Zakresy testów wydajności                                  |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Zakresy specjalnego przeznaczenia i dokumentacyjne         |
| `224.0.0.0/4`, `ff00::/8`                                                            | Adresy multicast                                           |
| `240.0.0.0/4`                                                                        | Zarezerwowane adresy IPv4                                  |
| `fc00::/7`, `fec0::/10`                                                              | Lokalne i prywatne zakresy IPv6                            |
| `100::/64`, `2001:20::/28`                                                           | Zakresy odrzucania IPv6 i ORCHIDv2                         |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefiksy NAT64 z osadzonym adresem IPv4                    |
| `2002::/16`, `2001::/32`                                                             | 6to4 i Teredo z osadzonym adresem IPv4                     |
| `::/96`, `::ffff:0:0/96`                                                             | Adresy IPv6 zgodne z IPv4 i IPv6 z mapowaniem IPv4         |

Dodaj wszelkie dodatkowe hosty metadanych lub zarezerwowane zakresy udokumentowane przez dostawcę chmury albo platformę sieciową.

## Ograniczenia

| Obszar                                                       | Stan zarządzanego proxy                                                                                                                                   |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, typowe klienty WebSocket | Po skonfigurowaniu kierowane przez mechanizmy zarządzanego proxy.                                                                                         |
| Bezpośrednie połączenia HTTP/2 APNs                          | Kierowane przez zarządzany mechanizm pomocniczy `CONNECT` dla APNs.                                                                                       |
| Local loopback płaszczyzny sterowania Gateway                | Połączenie bezpośrednie tylko dla dokładnego skonfigurowanego lokalnego adresu URL local loopback Gateway.                                                 |
| Przekazywanie ruchu do serwera nadrzędnego przez proxy debugowania | Wyłączone, gdy tryb zarządzanego proxy jest aktywny, chyba że jawnie włączono je na potrzeby diagnostyki lokalnej.                                    |
| IRC                                                          | Surowe połączenia TCP/TLS; nie są obsługiwane przez zarządzany tryb proxy HTTP. Ustaw `channels.irc.enabled: false`, jeśli wdrożenie wymaga kierowania całego ruchu wychodzącego przez proxy przekazujące. |
| Inne surowe wywołania klientów `net`, `tls` lub `http2`      | Przed wprowadzeniem zmian muszą zostać sklasyfikowane przez zabezpieczenie surowych gniazd.                                                                |

- Jest to ochrona na poziomie procesu dla klientów HTTP/WebSocket języka JavaScript, a nie piaskownica sieciowa na poziomie systemu operacyjnego.
- Surowe gniazda `net`, `tls` i `http2`, natywne dodatki oraz procesy potomne spoza OpenClaw mogą omijać routing na poziomie Node, chyba że dziedziczą i respektują zmienne środowiskowe proxy. Rozgałęzione procesy potomne CLI OpenClaw dziedziczą adres URL zarządzanego proxy oraz stan `proxy.loopbackMode`.
- Lokalne interfejsy WebUI użytkownika i lokalne serwery modeli nie są objęte ogólnym obejściem sieci lokalnej — w razie potrzeby dodaj je do listy dozwolonych w zasadach proxy operatora. Wyjątkiem jest zabezpieczona bezpośrednia ścieżka wbudowanego dostawcy osadzeń pamięci Ollama, ograniczona do dokładnego źródła local loopback hosta lokalnego określonego przez skonfigurowany parametr `baseUrl`; hosty Ollama w sieci LAN, sieci Tailscale, sieci prywatnej i sieci publicznej nadal korzystają z zarządzanego proxy.
- Bezpośrednie przekazywanie ruchu do serwera nadrzędnego przez lokalne proxy debugowania (dla żądań proxy i tuneli `CONNECT`) jest domyślnie wyłączone, gdy aktywny jest tryb zarządzanego proxy. Włączaj je wyłącznie na potrzeby zatwierdzonej diagnostyki lokalnej.
- OpenClaw nie sprawdza, nie testuje ani nie certyfikuje zasad proxy. Zmiany zasad proxy należy traktować jako zmiany operacyjne mające wpływ na bezpieczeństwo.
