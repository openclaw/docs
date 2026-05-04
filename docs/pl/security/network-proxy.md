---
read_when:
    - Chcesz zapewnić wielowarstwową ochronę przed atakami SSRF i DNS rebinding
    - Konfigurowanie zewnętrznego przekazującego serwera proxy dla ruchu środowiska wykonawczego OpenClaw
summary: Jak kierować ruch HTTP i WebSocket środowiska uruchomieniowego OpenClaw przez zarządzany przez operatora filtrujący serwer proxy
title: Proxy sieciowe
x-i18n:
    generated_at: "2026-05-04T02:26:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd5594324e8c6b7da51d903e98fda0feacb8970e0b15d980f7a249d6641461c9
    source_path: security/network-proxy.md
    workflow: 16
---

# Sieciowy serwer proxy

OpenClaw może kierować ruch HTTP i WebSocket środowiska wykonawczego przez zarządzany przez operatora serwer proxy ruchu wychodzącego. Jest to opcjonalna obrona w głąb dla wdrożeń, które potrzebują centralnej kontroli ruchu wychodzącego, silniejszej ochrony przed SSRF i lepszej audytowalności sieci.

OpenClaw nie dostarcza, nie pobiera, nie uruchamia, nie konfiguruje ani nie certyfikuje serwera proxy. Uruchamiasz technologię proxy pasującą do Twojego środowiska, a OpenClaw kieruje przez nią zwykłe lokalne dla procesu klienty HTTP i WebSocket.

## Dlaczego używać serwera proxy?

Serwer proxy daje operatorom jeden punkt kontroli sieci dla wychodzącego ruchu HTTP i WebSocket. Może to być przydatne nawet poza utwardzaniem przeciw SSRF:

- Centralna polityka: utrzymuj jedną politykę ruchu wychodzącego zamiast polegać na tym, że każde miejsce wywołania HTTP w aplikacji poprawnie zastosuje reguły sieciowe.
- Sprawdzanie przy połączeniu: oceniaj miejsce docelowe po rozwiązaniu DNS i bezpośrednio przed otwarciem przez serwer proxy połączenia z upstreamem.
- Obrona przed DNS rebinding: zmniejsz odstęp między sprawdzeniem DNS na poziomie aplikacji a rzeczywistym połączeniem wychodzącym.
- Szersze pokrycie JavaScript: kieruj zwykłe `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch i podobne klienty tą samą ścieżką.
- Audytowalność: rejestruj dozwolone i odrzucone miejsca docelowe na granicy ruchu wychodzącego.
- Kontrola operacyjna: egzekwuj reguły miejsc docelowych, segmentację sieci, limity szybkości lub listy dozwolone ruchu wychodzącego bez przebudowy OpenClaw.

Kierowanie przez serwer proxy jest zabezpieczeniem na poziomie procesu dla zwykłego ruchu wychodzącego HTTP i WebSocket. Daje operatorom ścieżkę fail-closed do kierowania obsługiwanych klientów HTTP JavaScript przez własny filtrujący serwer proxy, ale nie jest piaskownicą sieciową na poziomie systemu operacyjnego i nie sprawia, że OpenClaw certyfikuje politykę miejsc docelowych serwera proxy.

## Jak OpenClaw kieruje ruch

Gdy `proxy.enabled=true` i skonfigurowano URL serwera proxy, chronione procesy środowiska wykonawczego, takie jak `openclaw gateway run`, `openclaw node run` i `openclaw agent --local`, kierują zwykły ruch wychodzący HTTP i WebSocket przez skonfigurowany serwer proxy:

```text
Proces OpenClaw
  fetch                  -> zarządzany przez operatora filtrujący serwer proxy -> publiczny internet
  node:http and https    -> zarządzany przez operatora filtrujący serwer proxy -> publiczny internet
  Klienty WebSocket      -> zarządzany przez operatora filtrujący serwer proxy -> publiczny internet
```

Publicznym kontraktem jest zachowanie kierowania ruchu, a nie wewnętrzne haki Node używane do jego implementacji. Klienty WebSocket płaszczyzny sterowania OpenClaw Gateway używają wąskiej ścieżki bezpośredniej dla ruchu local loopback Gateway RPC, gdy URL Gateway używa `localhost` albo literalnego adresu IP loopback, takiego jak `127.0.0.1` lub `[::1]`. Ta ścieżka płaszczyzny sterowania musi być w stanie dotrzeć do Gateway działających przez loopback, nawet gdy serwer proxy operatora blokuje miejsca docelowe loopback. Zwykłe żądania HTTP i WebSocket środowiska wykonawczego nadal używają skonfigurowanego serwera proxy.

Wewnętrznie OpenClaw używa dwóch haków kierowania na poziomie procesu dla tej funkcji:

- Kierowanie przez dispatcher Undici obejmuje `fetch`, klientów opartych na undici oraz transporty, które udostępniają własny dispatcher undici.
- Kierowanie `global-agent` obejmuje wywołujących z rdzenia Node `node:http` i `node:https`, w tym wiele bibliotek opartych na `http.request`, `https.request`, `http.get` i `https.get`. Zarządzany tryb proxy wymusza tego globalnego agenta, aby jawni agenci HTTP Node nie omijali przypadkowo serwera proxy operatora.

Niektóre pluginy mają własne transporty, które wymagają jawnego podłączenia proxy nawet wtedy, gdy istnieje kierowanie na poziomie procesu. Na przykład transport Bot API Telegram używa własnego dispatchera HTTP/1 undici i dlatego respektuje zmienne środowiskowe proxy procesu oraz zarządzaną rezerwę `OPENCLAW_PROXY_URL` w tej ścieżce transportu właściwej dla właściciela.

Sam URL serwera proxy musi używać `http://`. Miejsca docelowe HTTPS nadal są obsługiwane przez serwer proxy za pomocą HTTP `CONNECT`; oznacza to tylko, że OpenClaw oczekuje zwykłego nasłuchującego serwera forward proxy HTTP, takiego jak `http://127.0.0.1:3128`.

Gdy serwer proxy jest aktywny, OpenClaw czyści `no_proxy`, `NO_PROXY` i `GLOBAL_AGENT_NO_PROXY`. Te listy obejść są oparte na miejscach docelowych, więc pozostawienie tam `localhost` lub `127.0.0.1` pozwoliłoby wysokiego ryzyka celom SSRF ominąć filtrujący serwer proxy.

Podczas zamykania OpenClaw przywraca poprzednie środowisko proxy i resetuje buforowany stan kierowania procesu.

## Powiązane terminy proxy

- `proxy.enabled` / `proxy.proxyUrl`: kierowanie ruchu wychodzącego przez forward proxy dla ruchu wychodzącego środowiska wykonawczego OpenClaw. Ta strona dokumentuje tę funkcję.
- `gateway.auth.mode: "trusted-proxy"`: przychodzące uwierzytelnianie przez odwrotny serwer proxy świadomy tożsamości dla dostępu do Gateway. Zobacz [Uwierzytelnianie przez zaufany serwer proxy](/pl/gateway/trusted-proxy-auth).
- `openclaw proxy`: lokalny debugujący serwer proxy i inspektor przechwytywania do rozwoju i wsparcia. Zobacz [openclaw proxy](/pl/cli/proxy).
- Ustawienia proxy właściwe dla kanału lub dostawcy: nadpisania właściwe dla właściciela dla konkretnego transportu. Preferuj zarządzany sieciowy serwer proxy, gdy celem jest centralna kontrola ruchu wychodzącego w całym środowisku wykonawczym.

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

Jeśli `enabled=true`, ale nie skonfigurowano prawidłowego URL serwera proxy, chronione polecenia kończą uruchamianie niepowodzeniem zamiast wracać do bezpośredniego dostępu do sieci.

Dla zarządzanych usług Gateway uruchamianych za pomocą `openclaw gateway start` preferuj przechowywanie URL w konfiguracji:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Rezerwa środowiskowa najlepiej nadaje się do uruchomień pierwszoplanowych. Jeśli używasz jej z zainstalowaną usługą, umieść `OPENCLAW_PROXY_URL` w trwałym środowisku usługi, takim jak `$OPENCLAW_STATE_DIR/.env` lub `~/.openclaw/.env`, a następnie ponownie zainstaluj usługę, aby launchd, systemd lub Zaplanowane zadania uruchamiały Gateway z tą wartością.

Dla poleceń `openclaw --container ...` OpenClaw przekazuje `OPENCLAW_PROXY_URL` do podrzędnego CLI przeznaczonego dla kontenera, gdy jest ustawiony. URL musi być osiągalny z wnętrza kontenera; `127.0.0.1` odnosi się do samego kontenera, a nie hosta. OpenClaw odrzuca URL-e serwera proxy loopback dla poleceń przeznaczonych dla kontenera, chyba że jawnie nadpiszesz to sprawdzenie bezpieczeństwa.

## Wymagania dotyczące serwera proxy

Polityka serwera proxy jest granicą bezpieczeństwa. OpenClaw nie może zweryfikować, czy serwer proxy blokuje właściwe cele.

Skonfiguruj serwer proxy tak, aby:

- Wiązał się tylko z loopback lub prywatnym zaufanym interfejsem.
- Ograniczał dostęp tak, aby tylko proces OpenClaw, host, kontener lub konto usługi mogły go używać.
- Samodzielnie rozwiązywał miejsca docelowe i blokował docelowe adresy IP po rozwiązaniu DNS.
- Stosował politykę przy połączeniu zarówno dla zwykłych żądań HTTP, jak i tuneli HTTPS `CONNECT`.
- Odrzucał obejścia oparte na miejscu docelowym dla zakresów loopback, prywatnych, link-local, metadanych, multicast, zarezerwowanych lub dokumentacyjnych.
- Unikał list dozwolonych nazw hostów, chyba że w pełni ufasz ścieżce rozwiązywania DNS.
- Rejestrował miejsce docelowe, decyzję, status i powód bez rejestrowania treści żądań, nagłówków autoryzacji, plików cookie ani innych sekretów.
- Utrzymywał politykę proxy pod kontrolą wersji i przeglądał zmiany tak jak konfigurację wrażliwą na bezpieczeństwo.

## Zalecane blokowane miejsca docelowe

Użyj tej listy odmów jako punktu wyjścia dla dowolnego forward proxy, zapory lub polityki ruchu wychodzącego.

Logika klasyfikatora na poziomie aplikacji OpenClaw znajduje się w `src/infra/net/ssrf.ts` i `src/shared/net/ip.ts`. Odpowiednie haki zgodności to `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` oraz obsługa osadzonych wartowników IPv4 dla NAT64, 6to4, Teredo, ISATAP i form mapowanych na IPv4. Te pliki są przydatnymi odniesieniami podczas utrzymywania zewnętrznej polityki proxy, ale OpenClaw nie eksportuje ani nie egzekwuje automatycznie tych reguł w Twoim serwerze proxy.

| Zakres lub host                                                                       | Dlaczego blokować                                   |
| ------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 loopback                                      |
| `::1/128`                                                                            | IPv6 loopback                                      |
| `0.0.0.0/8`, `::/128`                                                                | Adresy nieokreślone i tej sieci                    |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Prywatne sieci RFC1918                             |
| `169.254.0.0/16`, `fe80::/10`                                                        | Adresy link-local i typowe ścieżki metadanych chmur |
| `169.254.169.254`, `metadata.google.internal`                                        | Usługi metadanych chmury                           |
| `100.64.0.0/10`                                                                      | Współdzielona przestrzeń adresowa NAT operatorskiego |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Zakresy testów wydajności                          |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Zakresy specjalnego użycia i dokumentacyjne        |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                          |
| `240.0.0.0/4`                                                                        | Zarezerwowane IPv4                                 |
| `fc00::/7`, `fec0::/10`                                                              | Lokalne/prywatne zakresy IPv6                      |
| `100::/64`, `2001:20::/28`                                                           | Zakresy odrzucania IPv6 i ORCHIDv2                 |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefiksy NAT64 z osadzonym IPv4                    |
| `2002::/16`, `2001::/32`                                                             | 6to4 i Teredo z osadzonym IPv4                     |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 zgodne z IPv4 i IPv6 mapowane na IPv4         |

Jeśli Twój dostawca chmury lub platforma sieciowa dokumentuje dodatkowe hosty metadanych albo zarezerwowane zakresy, dodaj je również.

## Walidacja

Zweryfikuj serwer proxy z tego samego hosta, kontenera lub konta usługi, które uruchamia OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Domyślnie, gdy nie podano niestandardowych miejsc docelowych, polecenie sprawdza, czy `https://example.com/` kończy się powodzeniem, i uruchamia tymczasowy kanarek loopback, do którego serwer proxy nie może dotrzeć. Domyślne sprawdzenie odmowy przechodzi, gdy serwer proxy zwraca odpowiedź odmowy inną niż 2xx albo blokuje kanarka błędem transportu; kończy się niepowodzeniem, jeśli skuteczna odpowiedź dotrze do kanarka. Jeśli żaden serwer proxy nie jest włączony i skonfigurowany, walidacja zgłasza problem z konfiguracją; użyj `--proxy-url` dla jednorazowego sprawdzenia wstępnego przed zmianą konfiguracji. Użyj `--allowed-url` i `--denied-url`, aby przetestować oczekiwania właściwe dla wdrożenia. Niestandardowe odrzucane miejsca docelowe działają fail-closed: dowolna odpowiedź HTTP oznacza, że miejsce docelowe było osiągalne przez serwer proxy, a każdy błąd transportu jest zgłaszany jako nierozstrzygający, ponieważ OpenClaw nie może udowodnić, że serwer proxy zablokował osiągalne źródło. Przy niepowodzeniu walidacji polecenie kończy działanie z kodem 1.

Użyj `--json` do automatyzacji. Dane wyjściowe JSON zawierają ogólny wynik, efektywne źródło konfiguracji proxy, wszelkie błędy konfiguracji oraz każde sprawdzenie miejsca docelowego. Poświadczenia URL serwera proxy są redagowane w danych wyjściowych tekstowych i JSON:

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

Żądanie publiczne powinno się powieść. Żądania do pętli zwrotnej i metadanych powinny zostać zablokowane przez proxy. W przypadku `openclaw proxy validate` wbudowany kanarek pętli zwrotnej może odróżnić odmowę proxy od osiągalnego źródła. Niestandardowe kontrole `--denied-url` nie mają tego kanarka, więc traktuj zarówno odpowiedzi HTTP, jak i niejednoznaczne awarie transportu jako błędy walidacji, chyba że proxy udostępnia specyficzny dla wdrożenia sygnał odmowy, który możesz zweryfikować osobno.

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
- Surowe gniazda `net`, `tls` i `http2`, natywne dodatki oraz procesy potomne mogą omijać routing proxy na poziomie Node, chyba że dziedziczą zmienne środowiskowe proxy i ich przestrzegają.
- IRC to surowy kanał TCP/TLS poza zarządzanym przez operatora routingiem przez proxy przekazujące. We wdrożeniach, które wymagają całego ruchu wychodzącego przez to proxy przekazujące, ustaw `channels.irc.enabled=false`, chyba że bezpośredni ruch wychodzący IRC jest jawnie zatwierdzony.
- Lokalne WebUI użytkownika i lokalne serwery modeli należy w razie potrzeby dodać do listy dozwolonych w polityce proxy operatora; OpenClaw nie udostępnia dla nich ogólnego obejścia sieci lokalnej.
- Obejście proxy płaszczyzny sterowania Gateway jest celowo ograniczone do `localhost` i URL-i z dosłownymi adresami IP pętli zwrotnej. Użyj `ws://127.0.0.1:18789`, `ws://[::1]:18789` albo `ws://localhost:18789` dla lokalnych bezpośrednich połączeń z płaszczyzną sterowania Gateway; inne nazwy hostów są routowane jak zwykły ruch oparty na nazwach hostów.
- OpenClaw nie sprawdza, nie testuje ani nie certyfikuje Twojej polityki proxy.
- Traktuj zmiany polityki proxy jako operacyjne zmiany wrażliwe pod względem bezpieczeństwa.
