---
read_when:
    - Potrzebujesz wielowarstwowej ochrony przed atakami SSRF i atakami polegającymi na ponownym wiązaniu DNS
    - Konfigurowanie zewnętrznego serwera proxy typu forward dla ruchu środowiska uruchomieniowego OpenClaw
summary: Jak kierować ruch HTTP i WebSocket środowiska uruchomieniowego OpenClaw przez filtrujący serwer proxy zarządzany przez operatora
title: Proxy sieciowy
x-i18n:
    generated_at: "2026-05-04T07:06:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc7140c5ced0e7454a6f85d1ea8f3256bbd28cc0cb42eeafe8e5e6439b90e3f0
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy sieciowy

OpenClaw może kierować ruch HTTP i WebSocket środowiska uruchomieniowego przez zarządzany przez operatora proxy przekazujący. To opcjonalna, warstwowa ochrona dla wdrożeń, które potrzebują centralnej kontroli ruchu wychodzącego, silniejszej ochrony przed SSRF i lepszej audytowalności sieci.

OpenClaw nie dostarcza, nie pobiera, nie uruchamia, nie konfiguruje ani nie certyfikuje proxy. Uruchamiasz technologię proxy pasującą do swojego środowiska, a OpenClaw kieruje przez nią zwykłe lokalne dla procesu klienty HTTP i WebSocket.

## Dlaczego używać proxy?

Proxy daje operatorom jeden punkt kontroli sieciowej dla wychodzącego ruchu HTTP i WebSocket. Może to być przydatne nawet poza wzmacnianiem ochrony przed SSRF:

- Centralna polityka: utrzymuj jedną politykę ruchu wychodzącego zamiast polegać na tym, że każde miejsce wywołania HTTP w aplikacji poprawnie zastosuje reguły sieciowe.
- Kontrole w chwili połączenia: oceniaj miejsce docelowe po rozwiązaniu DNS i bezpośrednio przed otwarciem przez proxy połączenia nadrzędnego.
- Obrona przed DNS rebinding: zmniejsz lukę między sprawdzeniem DNS na poziomie aplikacji a faktycznym połączeniem wychodzącym.
- Szersze pokrycie JavaScript: kieruj zwykłe klienty `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch i podobne tą samą ścieżką.
- Audytowalność: rejestruj dozwolone i zablokowane miejsca docelowe na granicy ruchu wychodzącego.
- Kontrola operacyjna: wymuszaj reguły miejsc docelowych, segmentację sieci, limity szybkości lub listy dozwolonych adresów wychodzących bez przebudowywania OpenClaw.

Trasowanie przez proxy jest zabezpieczeniem na poziomie procesu dla zwykłego wychodzącego ruchu HTTP i WebSocket. Daje operatorom ścieżkę zamkniętą w razie awarii do kierowania obsługiwanych klientów HTTP JavaScript przez własny filtrujący proxy, ale nie jest piaskownicą sieciową na poziomie systemu operacyjnego i nie sprawia, że OpenClaw certyfikuje politykę miejsc docelowych proxy.

## Jak OpenClaw trasuje ruch

Gdy `proxy.enabled=true` i skonfigurowano URL proxy, chronione procesy środowiska uruchomieniowego, takie jak `openclaw gateway run`, `openclaw node run` i `openclaw agent --local`, kierują zwykły wychodzący ruch HTTP i WebSocket przez skonfigurowany proxy:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Publicznym kontraktem jest zachowanie trasowania, a nie wewnętrzne haki Node używane do jego implementacji. Klienty WebSocket płaszczyzny sterowania OpenClaw Gateway używają wąskiej ścieżki bezpośredniej dla ruchu RPC Gateway przez local loopback, gdy URL Gateway używa `localhost` albo literalnego adresu IP loopback, takiego jak `127.0.0.1` lub `[::1]`. Ta ścieżka płaszczyzny sterowania musi móc osiągać lokalne Gateway nawet wtedy, gdy proxy operatora blokuje miejsca docelowe loopback. Zwykłe żądania HTTP i WebSocket środowiska uruchomieniowego nadal używają skonfigurowanego proxy.

Wewnętrznie OpenClaw używa dla tej funkcji dwóch haków trasowania na poziomie procesu:

- Trasowanie dyspozytora Undici obejmuje `fetch`, klientów opartych na undici oraz transporty, które udostępniają własny dyspozytor undici.
- Trasowanie `global-agent` obejmuje wywołujących z rdzenia Node `node:http` i `node:https`, w tym wiele bibliotek opartych na `http.request`, `https.request`, `http.get` i `https.get`. Zarządzany tryb proxy wymusza tego globalnego agenta, aby jawni agenci HTTP Node nie omijali przypadkowo proxy operatora.

Niektóre Pluginy posiadają własne transporty, które wymagają jawnego podłączenia proxy nawet wtedy, gdy istnieje trasowanie na poziomie procesu. Na przykład transport Bot API Telegram używa własnego dyspozytora HTTP/1 undici i dlatego respektuje środowisko proxy procesu oraz zarządzane awaryjne `OPENCLAW_PROXY_URL` w tej ścieżce transportu specyficznej dla właściciela.

Sam URL proxy musi używać `http://`. Miejsca docelowe HTTPS nadal są obsługiwane przez proxy za pomocą HTTP `CONNECT`; oznacza to tylko, że OpenClaw oczekuje zwykłego nasłuchującego proxy przekazującego HTTP, takiego jak `http://127.0.0.1:3128`.

Gdy proxy jest aktywny, OpenClaw czyści `no_proxy`, `NO_PROXY` i `GLOBAL_AGENT_NO_PROXY`. Te listy obejść są oparte na miejscach docelowych, więc pozostawienie tam `localhost` lub `127.0.0.1` pozwoliłoby celom SSRF wysokiego ryzyka ominąć filtrujący proxy.

Podczas wyłączania OpenClaw przywraca poprzednie środowisko proxy i resetuje buforowany stan trasowania procesu.

## Powiązane terminy dotyczące proxy

- `proxy.enabled` / `proxy.proxyUrl`: trasowanie wychodzące przez proxy przekazujący dla ruchu środowiska uruchomieniowego OpenClaw. Ta strona dokumentuje tę funkcję.
- `gateway.auth.mode: "trusted-proxy"`: uwierzytelnianie przychodzące przez świadomy tożsamości reverse proxy dla dostępu do Gateway. Zobacz [Uwierzytelnianie przez zaufany proxy](/pl/gateway/trusted-proxy-auth).
- `openclaw proxy`: lokalny proxy debugowania i inspektor przechwytywania do rozwoju i wsparcia. Zobacz [openclaw proxy](/pl/cli/proxy).
- Ustawienia proxy specyficzne dla kanału lub dostawcy: nadpisania specyficzne dla właściciela dla konkretnego transportu. Preferuj zarządzany proxy sieciowy, gdy celem jest centralna kontrola ruchu wychodzącego w całym środowisku uruchomieniowym.

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

Jeśli `enabled=true`, ale nie skonfigurowano prawidłowego URL proxy, chronione polecenia kończą uruchamianie błędem zamiast wracać do bezpośredniego dostępu do sieci.

Dla zarządzanych usług Gateway uruchamianych za pomocą `openclaw gateway start` preferuj zapisanie URL w konfiguracji:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Awaryjne użycie środowiska najlepiej nadaje się do uruchomień pierwszoplanowych. Jeśli używasz go z zainstalowaną usługą, umieść `OPENCLAW_PROXY_URL` w trwałym środowisku usługi, takim jak `$OPENCLAW_STATE_DIR/.env` lub `~/.openclaw/.env`, a następnie zainstaluj usługę ponownie, aby launchd, systemd lub Scheduled Tasks uruchamiały gateway z tą wartością.

Dla poleceń `openclaw --container ...` OpenClaw przekazuje `OPENCLAW_PROXY_URL` do docelowego dla kontenera procesu potomnego CLI, gdy jest ustawiony. URL musi być osiągalny z wnętrza kontenera; `127.0.0.1` odnosi się do samego kontenera, a nie do hosta. OpenClaw odrzuca URL-e proxy loopback dla poleceń docelowych dla kontenera, chyba że jawnie nadpiszesz tę kontrolę bezpieczeństwa.

## Wymagania proxy

Polityka proxy jest granicą bezpieczeństwa. OpenClaw nie może zweryfikować, czy proxy blokuje właściwe cele.

Skonfiguruj proxy tak, aby:

- Wiązał się tylko z loopback albo prywatnym zaufanym interfejsem.
- Ograniczał dostęp tak, aby mógł go używać tylko proces, host, kontener lub konto usługi OpenClaw.
- Samodzielnie rozwiązywał miejsca docelowe i blokował docelowe adresy IP po rozwiązaniu DNS.
- Stosował politykę w chwili połączenia zarówno dla zwykłych żądań HTTP, jak i tuneli HTTPS `CONNECT`.
- Odrzucał obejścia oparte na miejscach docelowych dla zakresów loopback, prywatnych, link-local, metadanych, multicast, zarezerwowanych lub dokumentacyjnych.
- Unikał list dozwolonych nazw hostów, chyba że w pełni ufasz ścieżce rozwiązywania DNS.
- Rejestrował miejsce docelowe, decyzję, status i powód bez rejestrowania treści żądań, nagłówków autoryzacji, ciasteczek ani innych sekretów.
- Utrzymywał politykę proxy pod kontrolą wersji i przeglądał zmiany jak konfigurację wrażliwą pod kątem bezpieczeństwa.

## Zalecane blokowane miejsca docelowe

Użyj tej listy blokowania jako punktu wyjścia dla dowolnego proxy przekazującego, zapory lub polityki ruchu wychodzącego.

Logika klasyfikatora na poziomie aplikacji OpenClaw znajduje się w `src/infra/net/ssrf.ts` i `src/shared/net/ip.ts`. Odpowiednie haki zgodności to `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` oraz obsługa osadzonego wartownika IPv4 dla NAT64, 6to4, Teredo, ISATAP i form mapowanych z IPv4. Te pliki są przydatnymi odniesieniami podczas utrzymywania zewnętrznej polityki proxy, ale OpenClaw nie eksportuje automatycznie ani nie wymusza tych reguł w Twoim proxy.

| Zakres lub host                                                                       | Dlaczego blokować                                  |
| ------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 loopback                                      |
| `::1/128`                                                                            | IPv6 loopback                                      |
| `0.0.0.0/8`, `::/128`                                                                | Adresy nieokreślone i tej sieci                    |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Sieci prywatne RFC1918                             |
| `169.254.0.0/16`, `fe80::/10`                                                        | Adresy link-local i typowe ścieżki metadanych chmur |
| `169.254.169.254`, `metadata.google.internal`                                        | Usługi metadanych chmur                            |
| `100.64.0.0/10`                                                                      | Wspólna przestrzeń adresowa NAT klasy operatorskiej |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Zakresy testów wydajnościowych                     |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Zakresy specjalnego użycia i dokumentacyjne        |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                          |
| `240.0.0.0/4`                                                                        | Zarezerwowany IPv4                                 |
| `fc00::/7`, `fec0::/10`                                                              | Lokalne/prywatne zakresy IPv6                      |
| `100::/64`, `2001:20::/28`                                                           | Zakresy IPv6 discard i ORCHIDv2                    |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefiksy NAT64 z osadzonym IPv4                    |
| `2002::/16`, `2001::/32`                                                             | 6to4 i Teredo z osadzonym IPv4                     |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 zgodny z IPv4 i IPv6 mapowany z IPv4          |

Jeśli Twój dostawca chmury lub platforma sieciowa dokumentuje dodatkowe hosty metadanych albo zarezerwowane zakresy, dodaj je również.

## Walidacja

Zweryfikuj proxy z tego samego hosta, kontenera lub konta usługi, które uruchamia OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Domyślnie, gdy nie podano niestandardowych miejsc docelowych, polecenie sprawdza, czy `https://example.com/` kończy się powodzeniem, oraz uruchamia tymczasowego kanarka loopback, którego proxy nie może osiągnąć. Domyślna kontrola odmowy przechodzi, gdy proxy zwraca odpowiedź odmowną inną niż 2xx albo blokuje kanarka błędem transportu; kończy się niepowodzeniem, jeśli skuteczna odpowiedź dotrze do kanarka. Jeśli żaden proxy nie jest włączony i skonfigurowany, walidacja zgłasza problem z konfiguracją; użyj `--proxy-url` do jednorazowej kontroli przed zmianą konfiguracji. Użyj `--allowed-url` i `--denied-url`, aby przetestować oczekiwania specyficzne dla wdrożenia. Niestandardowe zablokowane miejsca docelowe działają w trybie zamkniętym w razie niepowodzenia: dowolna odpowiedź HTTP oznacza, że miejsce docelowe było osiągalne przez proxy, a dowolny błąd transportu jest zgłaszany jako nierozstrzygający, ponieważ OpenClaw nie może udowodnić, że proxy zablokował osiągalne źródło. W razie niepowodzenia walidacji polecenie kończy działanie z kodem 1.

Użyj `--json` do automatyzacji. Dane wyjściowe JSON zawierają ogólny wynik, efektywne źródło konfiguracji proxy, ewentualne błędy konfiguracji oraz każdą kontrolę miejsca docelowego. Dane uwierzytelniające w URL proxy są redagowane w danych wyjściowych tekstowych i JSON:

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

Żądanie publiczne powinno się powieść. Żądania loopback i metadanych powinny zostać zablokowane przez proxy. W przypadku `openclaw proxy validate` wbudowany kanarek loopback potrafi odróżnić odmowę proxy od osiągalnego źródła. Niestandardowe kontrole `--denied-url` nie mają tego kanarka, więc traktuj zarówno odpowiedzi HTTP, jak i niejednoznaczne awarie transportu jako niepowodzenia walidacji, chyba że Twoje proxy udostępnia specyficzny dla wdrożenia sygnał odmowy, który możesz zweryfikować osobno.

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

- Proxy poprawia pokrycie dla lokalnych dla procesu klientów HTTP i WebSocket w JavaScript, ale nie jest piaskownicą sieciową na poziomie systemu operacyjnego.
- Surowe gniazda `net`, `tls` i `http2`, natywne dodatki oraz procesy potomne mogą omijać trasowanie proxy na poziomie Node, chyba że dziedziczą i respektują zmienne środowiskowe proxy.
- IRC jest surowym kanałem TCP/TLS poza trasowaniem przez zarządzane przez operatora proxy przekazujące. We wdrożeniach, które wymagają całego ruchu wychodzącego przez takie proxy przekazujące, ustaw `channels.irc.enabled=false`, chyba że bezpośredni ruch wychodzący IRC jest wyraźnie zatwierdzony.
- Lokalne proxy debugowania jest narzędziem diagnostycznym, a jego bezpośrednie przekazywanie upstream dla żądań proxy i tuneli CONNECT jest domyślnie wyłączone, gdy aktywny jest tryb zarządzanego proxy; włącz bezpośrednie przekazywanie tylko dla zatwierdzonej lokalnej diagnostyki.
- Lokalne WebUI użytkownika i lokalne serwery modeli powinny być w razie potrzeby dodane do listy dozwolonych w polityce proxy operatora; OpenClaw nie udostępnia dla nich ogólnego obejścia sieci lokalnej.
- Obejście proxy dla płaszczyzny sterowania Gateway jest celowo ograniczone do `localhost` i dosłownych adresów URL IP loopback. Używaj `ws://127.0.0.1:18789`, `ws://[::1]:18789` lub `ws://localhost:18789` dla lokalnych bezpośrednich połączeń z płaszczyzną sterowania Gateway; inne nazwy hostów są trasowane jak zwykły ruch oparty na nazwie hosta.
- OpenClaw nie sprawdza, nie testuje ani nie certyfikuje Twojej polityki proxy.
- Traktuj zmiany polityki proxy jako operacyjne zmiany wrażliwe z punktu widzenia bezpieczeństwa.
