---
read_when:
    - Chcesz wielowarstwowej ochrony przed atakami SSRF i DNS rebinding
    - Konfigurowanie zewnętrznego serwera proxy dla ruchu wychodzącego środowiska wykonawczego OpenClaw
summary: Jak kierować ruch HTTP i WebSocket środowiska uruchomieniowego OpenClaw przez zarządzany przez operatora filtrujący serwer proxy
title: Proxy sieciowe
x-i18n:
    generated_at: "2026-05-01T10:03:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9207d349e4410e38631ae7665be19b536e4a4128a4e80dd095e802804dfd66a3
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy sieciowy

OpenClaw może kierować ruch HTTP i WebSocket środowiska wykonawczego przez zarządzany przez operatora proxy przekazujący. Jest to opcjonalna obrona warstwowa dla wdrożeń, które potrzebują centralnej kontroli ruchu wychodzącego, silniejszej ochrony przed SSRF i lepszej audytowalności sieci.

OpenClaw nie dostarcza, nie pobiera, nie uruchamia, nie konfiguruje ani nie certyfikuje proxy. Uruchamiasz technologię proxy pasującą do Twojego środowiska, a OpenClaw kieruje przez nią zwykłe lokalne dla procesu klienty HTTP i WebSocket.

## Dlaczego używać proxy?

Proxy daje operatorom jeden punkt kontroli sieci dla wychodzącego ruchu HTTP i WebSocket. Może to być przydatne nawet poza wzmacnianiem ochrony przed SSRF:

- Centralna polityka: utrzymuj jedną politykę ruchu wychodzącego zamiast polegać na tym, że każde miejsce wywołania HTTP w aplikacji poprawnie zastosuje reguły sieciowe.
- Kontrole w czasie połączenia: oceń miejsce docelowe po rozwiązaniu DNS i bezpośrednio przed otwarciem przez proxy połączenia nadrzędnego.
- Ochrona przed DNS rebinding: zmniejsz lukę między kontrolą DNS na poziomie aplikacji a faktycznym połączeniem wychodzącym.
- Szersze pokrycie JavaScript: kieruj zwykłe klienty `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch i podobne tą samą ścieżką.
- Audytowalność: rejestruj dozwolone i odrzucone miejsca docelowe na granicy ruchu wychodzącego.
- Kontrola operacyjna: egzekwuj reguły miejsc docelowych, segmentację sieci, limity szybkości lub listy dozwolonego ruchu wychodzącego bez przebudowy OpenClaw.

Trasowanie przez proxy jest zabezpieczeniem na poziomie procesu dla zwykłego wychodzącego ruchu HTTP i WebSocket. Daje operatorom ścieżkę fail-closed do kierowania obsługiwanych klientów HTTP JavaScript przez własny filtrujący proxy, ale nie jest piaskownicą sieciową na poziomie systemu operacyjnego i nie sprawia, że OpenClaw certyfikuje politykę miejsc docelowych proxy.

## Jak OpenClaw kieruje ruch

Gdy `proxy.enabled=true` i skonfigurowano URL proxy, chronione procesy środowiska wykonawczego, takie jak `openclaw gateway run`, `openclaw node run` i `openclaw agent --local`, kierują zwykły wychodzący ruch HTTP i WebSocket przez skonfigurowany proxy:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Publicznym kontraktem jest zachowanie trasowania, a nie wewnętrzne haki Node używane do jego implementacji. Klienty WebSocket płaszczyzny sterowania OpenClaw Gateway używają wąskiej ścieżki bezpośredniej dla ruchu RPC Gateway przez local loopback, gdy URL Gateway używa `localhost` albo dosłownego adresu IP pętli zwrotnej, takiego jak `127.0.0.1` lub `[::1]`. Ta ścieżka płaszczyzny sterowania musi móc dotrzeć do Gateway przez pętlę zwrotną nawet wtedy, gdy proxy operatora blokuje miejsca docelowe pętli zwrotnej. Zwykłe żądania HTTP i WebSocket środowiska wykonawczego nadal używają skonfigurowanego proxy.

Wewnętrznie OpenClaw używa dwóch haków trasowania na poziomie procesu dla tej funkcji:

- Trasowanie dyspozytora Undici obejmuje `fetch`, klientów opartych na undici oraz transporty, które udostępniają własny dyspozytor undici.
- Trasowanie `global-agent` obejmuje wywołujących z rdzenia Node `node:http` i `node:https`, w tym wiele bibliotek zbudowanych na `http.request`, `https.request`, `http.get` i `https.get`. Tryb zarządzanego proxy wymusza tego globalnego agenta, aby jawni agenci HTTP Node nie omijali przypadkowo proxy operatora.

Niektóre pluginy posiadają własne transporty, które wymagają jawnego podłączenia proxy nawet wtedy, gdy istnieje trasowanie na poziomie procesu. Na przykład transport Bot API Telegram używa własnego dyspozytora HTTP/1 undici, dlatego respektuje środowisko proxy procesu oraz zarządzany awaryjny `OPENCLAW_PROXY_URL` w tej ścieżce transportu należącej do konkretnego właściciela.

Sam URL proxy musi używać `http://`. Miejsca docelowe HTTPS nadal są obsługiwane przez proxy za pomocą HTTP `CONNECT`; oznacza to tylko, że OpenClaw oczekuje zwykłego nasłuchującego proxy przekazującego HTTP, takiego jak `http://127.0.0.1:3128`.

Gdy proxy jest aktywny, OpenClaw czyści `no_proxy`, `NO_PROXY` i `GLOBAL_AGENT_NO_PROXY`. Te listy obejść są oparte na miejscach docelowych, więc pozostawienie tam `localhost` lub `127.0.0.1` pozwoliłoby celom SSRF wysokiego ryzyka ominąć filtrujący proxy.

Podczas zamykania OpenClaw przywraca poprzednie środowisko proxy i resetuje zbuforowany stan trasowania procesu.

## Powiązane terminy proxy

- `proxy.enabled` / `proxy.proxyUrl`: trasowanie ruchu wychodzącego środowiska wykonawczego OpenClaw przez proxy przekazujący. Ta strona dokumentuje tę funkcję.
- `gateway.auth.mode: "trusted-proxy"`: uwierzytelnianie przychodzące z uwzględnieniem tożsamości przez reverse proxy dla dostępu do Gateway. Zobacz [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth).
- `openclaw proxy`: lokalny debugujący proxy i inspektor przechwytywania do rozwoju i wsparcia. Zobacz [openclaw proxy](/pl/cli/proxy).
- Ustawienia proxy specyficzne dla kanału lub dostawcy: nadpisania należące do konkretnego właściciela dla danego transportu. Preferuj zarządzany proxy sieciowy, gdy celem jest centralna kontrola ruchu wychodzącego w całym środowisku wykonawczym.

## Konfiguracja

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Możesz także podać URL przez środowisko, zachowując `proxy.enabled=true` w konfiguracji:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` ma pierwszeństwo przed `OPENCLAW_PROXY_URL`.

Jeśli `enabled=true`, ale nie skonfigurowano prawidłowego URL proxy, chronione polecenia przerywają uruchamianie zamiast wracać do bezpośredniego dostępu do sieci.

W przypadku zarządzanych usług gateway uruchamianych przez `openclaw gateway start` preferuj przechowywanie URL w konfiguracji:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Awaryjne użycie środowiska najlepiej sprawdza się przy uruchomieniach pierwszoplanowych. Jeśli używasz go z zainstalowaną usługą, umieść `OPENCLAW_PROXY_URL` w trwałym środowisku usługi, takim jak `$OPENCLAW_STATE_DIR/.env` lub `~/.openclaw/.env`, a następnie zainstaluj usługę ponownie, aby launchd, systemd lub Zaplanowane zadania uruchamiały gateway z tą wartością.

Dla poleceń `openclaw --container ...` OpenClaw przekazuje `OPENCLAW_PROXY_URL` do podrzędnego CLI skierowanego na kontener, gdy jest ustawiony. URL musi być osiągalny z wnętrza kontenera; `127.0.0.1` odnosi się do samego kontenera, a nie hosta. OpenClaw odrzuca URL proxy pętli zwrotnej dla poleceń skierowanych na kontener, chyba że jawnie nadpiszesz tę kontrolę bezpieczeństwa.

## Wymagania proxy

Polityka proxy jest granicą bezpieczeństwa. OpenClaw nie może zweryfikować, że proxy blokuje właściwe cele.

Skonfiguruj proxy tak, aby:

- Wiązał się tylko z pętlą zwrotną albo prywatnym zaufanym interfejsem.
- Ograniczał dostęp tak, aby mógł go używać tylko proces, host, kontener lub konto usługi OpenClaw.
- Samodzielnie rozwiązywał miejsca docelowe i blokował adresy IP miejsc docelowych po rozwiązaniu DNS.
- Stosował politykę w czasie połączenia zarówno dla zwykłych żądań HTTP, jak i tuneli HTTPS `CONNECT`.
- Odrzucał obejścia oparte na miejscu docelowym dla zakresów pętli zwrotnej, prywatnych, link-local, metadanych, multicast, zarezerwowanych lub dokumentacyjnych.
- Unikał list dozwolonych nazw hostów, chyba że w pełni ufasz ścieżce rozwiązywania DNS.
- Rejestrował miejsce docelowe, decyzję, status i powód bez rejestrowania treści żądań, nagłówków autoryzacji, plików cookie ani innych sekretów.
- Przechowywał politykę proxy w kontroli wersji i przeglądał zmiany jak konfigurację wrażliwą pod względem bezpieczeństwa.

## Zalecane blokowane miejsca docelowe

Użyj tej listy zablokowanych jako punktu wyjścia dla dowolnego proxy przekazującego, zapory lub polityki ruchu wychodzącego.

Logika klasyfikatora na poziomie aplikacji OpenClaw znajduje się w `src/infra/net/ssrf.ts` i `src/shared/net/ip.ts`. Odpowiednie haki zgodności to `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` oraz wbudowana obsługa sentinel IPv4 dla NAT64, 6to4, Teredo, ISATAP i form mapowanych na IPv4. Te pliki są przydatnymi odniesieniami podczas utrzymywania zewnętrznej polityki proxy, ale OpenClaw nie eksportuje ani nie egzekwuje automatycznie tych reguł w Twoim proxy.

| Zakres lub host                                                                      | Dlaczego blokować                                  |
| ------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Pętla zwrotna IPv4                                 |
| `::1/128`                                                                            | Pętla zwrotna IPv6                                 |
| `0.0.0.0/8`, `::/128`                                                                | Adresy nieokreślone i adresy tej sieci             |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Sieci prywatne RFC1918                             |
| `169.254.0.0/16`, `fe80::/10`                                                        | Adresy link-local i typowe ścieżki metadanych chmurowych |
| `169.254.169.254`, `metadata.google.internal`                                        | Usługi metadanych chmurowych                       |
| `100.64.0.0/10`                                                                      | Współdzielona przestrzeń adresowa NAT klasy operatorskiej |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Zakresy testów wydajnościowych                     |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Zakresy specjalnego użycia i dokumentacyjne        |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                          |
| `240.0.0.0/4`                                                                        | Zarezerwowane IPv4                                 |
| `fc00::/7`, `fec0::/10`                                                              | Lokalne/prywatne zakresy IPv6                      |
| `100::/64`, `2001:20::/28`                                                           | Zakresy IPv6 discard i ORCHIDv2                    |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefiksy NAT64 z osadzonym IPv4                    |
| `2002::/16`, `2001::/32`                                                             | 6to4 i Teredo z osadzonym IPv4                     |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 zgodne z IPv4 i IPv6 mapowane na IPv4         |

Jeśli Twój dostawca chmury lub platforma sieciowa dokumentuje dodatkowe hosty metadanych albo zarezerwowane zakresy, także je dodaj.

## Walidacja

Zweryfikuj proxy z tego samego hosta, kontenera lub konta usługi, które uruchamia OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Domyślnie, gdy nie podano niestandardowych miejsc docelowych, polecenie sprawdza, czy `https://example.com/` kończy się powodzeniem, i uruchamia tymczasowy kanarek pętli zwrotnej, do którego proxy nie może dotrzeć. Domyślna kontrola odmowy przechodzi, gdy proxy zwraca odpowiedź odmowy spoza zakresu 2xx albo blokuje kanarka błędem transportu; kończy się niepowodzeniem, jeśli udana odpowiedź dotrze do kanarka. Jeśli żaden proxy nie jest włączony i skonfigurowany, walidacja zgłasza problem z konfiguracją; użyj `--proxy-url` do jednorazowego sprawdzenia przed zmianą konfiguracji. Użyj `--allowed-url` i `--denied-url`, aby przetestować oczekiwania specyficzne dla wdrożenia. Niestandardowe odrzucane miejsca docelowe działają fail-closed: dowolna odpowiedź HTTP oznacza, że miejsce docelowe było osiągalne przez proxy, a każdy błąd transportu jest zgłaszany jako nierozstrzygający, ponieważ OpenClaw nie może udowodnić, że proxy zablokował osiągalne źródło. W przypadku niepowodzenia walidacji polecenie kończy działanie kodem 1.

Użyj `--json` do automatyzacji. Wynik JSON zawiera ogólny rezultat, efektywne źródło konfiguracji proxy, wszelkie błędy konfiguracji oraz każdą kontrolę miejsca docelowego. Dane uwierzytelniające URL proxy są redagowane w wyniku tekstowym i JSON:

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

Żądanie publiczne powinno się powieść. Żądania loopback i do metadanych powinny zostać zablokowane przez proxy. W przypadku `openclaw proxy validate` wbudowany kanarek loopback potrafi odróżnić odmowę proxy od osiągalnego źródła. Niestandardowe sprawdzenia `--denied-url` nie mają tego kanarka, więc traktuj zarówno odpowiedzi HTTP, jak i niejednoznaczne awarie transportu jako niepowodzenia walidacji, chyba że Twoje proxy udostępnia specyficzny dla wdrożenia sygnał odmowy, który możesz zweryfikować osobno.

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

- Proxy zwiększa pokrycie dla lokalnych w procesie klientów HTTP i WebSocket JavaScript, ale nie jest sandboxem sieciowym na poziomie systemu operacyjnego.
- Surowe gniazda `net`, `tls` i `http2`, natywne dodatki oraz procesy podrzędne mogą omijać routing proxy na poziomie Node, chyba że dziedziczą i respektują zmienne środowiskowe proxy.
- Lokalne WebUI użytkownika i lokalne serwery modeli powinny zostać dodane do listy dozwolonych w zasadach proxy operatora, gdy jest to potrzebne; OpenClaw nie udostępnia dla nich ogólnego obejścia sieci lokalnej.
- Obejście proxy płaszczyzny sterowania Gateway jest celowo ograniczone do `localhost` i dosłownych adresów URL IP loopback. Użyj `ws://127.0.0.1:18789`, `ws://[::1]:18789` lub `ws://localhost:18789` dla lokalnych bezpośrednich połączeń z płaszczyzną sterowania Gateway; inne nazwy hostów są trasowane jak zwykły ruch oparty na nazwie hosta.
- OpenClaw nie sprawdza, nie testuje ani nie certyfikuje Twoich zasad proxy.
- Zmiany zasad proxy traktuj jako wrażliwe operacyjnie zmiany dotyczące bezpieczeństwa.
