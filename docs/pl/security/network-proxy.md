---
read_when:
    - Chcesz wielowarstwowej ochrony przed atakami SSRF i DNS rebinding
    - Konfigurowanie zewnętrznego serwera proxy przekazującego ruch środowiska wykonawczego OpenClaw
summary: Jak kierować ruch HTTP i WebSocket środowiska wykonawczego OpenClaw przez zarządzany przez operatora filtrujący serwer proxy
title: Proxy sieciowy
x-i18n:
    generated_at: "2026-05-04T18:24:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: eedbf3bac14800c34c7ca2e3b6879dac360a88d51b5b7449ddf41a4dd471648b
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy sieciowy

OpenClaw może kierować ruch HTTP i WebSocket w czasie wykonywania przez zarządzany przez operatora proxy przekazujący. To opcjonalna warstwa obrony dla wdrożeń, które wymagają centralnej kontroli ruchu wychodzącego, silniejszej ochrony przed SSRF oraz lepszej audytowalności sieci.

OpenClaw nie dostarcza, nie pobiera, nie uruchamia, nie konfiguruje ani nie certyfikuje proxy. Uruchamiasz technologię proxy dopasowaną do swojego środowiska, a OpenClaw kieruje przez nią zwykłych lokalnych dla procesu klientów HTTP i WebSocket.

## Dlaczego warto używać proxy?

Proxy daje operatorom jeden punkt kontroli sieci dla wychodzącego ruchu HTTP i WebSocket. Może to być przydatne także poza wzmacnianiem ochrony przed SSRF:

- Centralna polityka: utrzymuj jedną politykę ruchu wychodzącego zamiast polegać na tym, że każde miejsce wywołań HTTP w aplikacji poprawnie zastosuje reguły sieciowe.
- Kontrole w czasie łączenia: oceniaj miejsce docelowe po rozwiązaniu DNS i bezpośrednio przed tym, jak proxy otworzy połączenie upstream.
- Obrona przed DNS rebinding: zmniejsz odstęp między sprawdzeniem DNS na poziomie aplikacji a faktycznym połączeniem wychodzącym.
- Szersze pokrycie JavaScript: kieruj zwykłe klienty `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch i podobne przez tę samą ścieżkę.
- Audytowalność: rejestruj dozwolone i odrzucone miejsca docelowe na granicy ruchu wychodzącego.
- Kontrola operacyjna: wymuszaj reguły miejsc docelowych, segmentację sieci, limity szybkości lub listy dozwolone dla ruchu wychodzącego bez przebudowywania OpenClaw.

Kierowanie przez proxy jest zabezpieczeniem na poziomie procesu dla zwykłego ruchu wychodzącego HTTP i WebSocket. Daje operatorom ścieżkę fail-closed do kierowania obsługiwanych klientów HTTP JavaScript przez ich własne filtrujące proxy, ale nie jest sandboxem sieciowym na poziomie systemu operacyjnego i nie sprawia, że OpenClaw certyfikuje politykę miejsc docelowych proxy.

## Jak OpenClaw kieruje ruch

Gdy `proxy.enabled=true` i skonfigurowano URL proxy, chronione procesy czasu wykonywania, takie jak `openclaw gateway run`, `openclaw node run` i `openclaw agent --local`, kierują zwykły ruch wychodzący HTTP i WebSocket przez skonfigurowane proxy:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Publicznym kontraktem jest zachowanie routingu, a nie wewnętrzne hooki Node używane do jego implementacji. Klienty WebSocket płaszczyzny sterowania OpenClaw Gateway używają wąskiej ścieżki bezpośredniej dla ruchu RPC Gateway przez local loopback, gdy URL Gateway używa `localhost` albo dosłownego adresu IP pętli zwrotnej, takiego jak `127.0.0.1` lub `[::1]`. Ta ścieżka płaszczyzny sterowania musi móc dotrzeć do Gateway działających na pętli zwrotnej nawet wtedy, gdy proxy operatora blokuje miejsca docelowe pętli zwrotnej. Zwykłe żądania HTTP i WebSocket czasu wykonywania nadal używają skonfigurowanego proxy.

Wewnętrznie OpenClaw używa dwóch hooków routingu na poziomie procesu dla tej funkcji:

- Routing dyspozytora Undici obejmuje `fetch`, klientów opartych na undici oraz transporty, które zapewniają własny dyspozytor undici.
- Routing `global-agent` obejmuje wywołujących Node core `node:http` i `node:https`, w tym wiele bibliotek zbudowanych na `http.request`, `https.request`, `http.get` i `https.get`. Zarządzany tryb proxy wymusza tego globalnego agenta, aby jawni agenci HTTP Node nie omijali przypadkowo proxy operatora.

Niektóre pluginy posiadają niestandardowe transporty, które wymagają jawnego podłączenia proxy nawet wtedy, gdy istnieje routing na poziomie procesu. Na przykład transport Bot API Telegram używa własnego dyspozytora HTTP/1 undici i dlatego respektuje środowisko proxy procesu oraz zarządzany fallback `OPENCLAW_PROXY_URL` w tej ścieżce transportu specyficznej dla właściciela.

Sam URL proxy musi używać `http://`. Miejsca docelowe HTTPS nadal są obsługiwane przez proxy z użyciem HTTP `CONNECT`; oznacza to tylko, że OpenClaw oczekuje zwykłego nasłuchującego proxy przekazującego HTTP, takiego jak `http://127.0.0.1:3128`.

Gdy proxy jest aktywne, OpenClaw czyści `no_proxy`, `NO_PROXY` i `GLOBAL_AGENT_NO_PROXY`. Te listy obejść są oparte na miejscach docelowych, więc pozostawienie tam `localhost` lub `127.0.0.1` pozwoliłoby celom SSRF wysokiego ryzyka ominąć filtrujące proxy.

Podczas zamykania OpenClaw przywraca poprzednie środowisko proxy i resetuje buforowany stan routingu procesu.

## Powiązane terminy proxy

- `proxy.enabled` / `proxy.proxyUrl`: routing wychodzący przez proxy przekazujące dla ruchu wychodzącego czasu wykonywania OpenClaw. Ta strona dokumentuje tę funkcję.
- `gateway.auth.mode: "trusted-proxy"`: uwierzytelnianie przychodzące przez odwrotne proxy świadome tożsamości dla dostępu do Gateway. Zobacz [Uwierzytelnianie przez zaufane proxy](/pl/gateway/trusted-proxy-auth).
- `openclaw proxy`: lokalne proxy debugowania i inspektor przechwytywania dla prac rozwojowych i wsparcia. Zobacz [openclaw proxy](/pl/cli/proxy).
- Ustawienia proxy specyficzne dla kanału lub dostawcy: nadpisania specyficzne dla właściciela dla konkretnego transportu. Preferuj zarządzany proxy sieciowy, gdy celem jest centralna kontrola ruchu wychodzącego w całym środowisku czasu wykonywania.

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

Jeśli `enabled=true`, ale nie skonfigurowano poprawnego URL proxy, chronione polecenia nie uruchomią się zamiast przechodzić awaryjnie na bezpośredni dostęp do sieci.

W przypadku zarządzanych usług Gateway uruchamianych za pomocą `openclaw gateway start` preferuj przechowywanie URL w konfiguracji:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Fallback środowiskowy najlepiej nadaje się do uruchomień pierwszoplanowych. Jeśli używasz go z zainstalowaną usługą, umieść `OPENCLAW_PROXY_URL` w trwałym środowisku usługi, takim jak `$OPENCLAW_STATE_DIR/.env` lub `~/.openclaw/.env`, a następnie zainstaluj usługę ponownie, aby launchd, systemd lub Scheduled Tasks uruchamiały gateway z tą wartością.

Dla poleceń `openclaw --container ...` OpenClaw przekazuje `OPENCLAW_PROXY_URL` do podrzędnego CLI kierowanego do kontenera, gdy jest ustawiony. URL musi być osiągalny z wnętrza kontenera; `127.0.0.1` odnosi się do samego kontenera, nie do hosta. OpenClaw odrzuca adresy URL proxy wskazujące na pętlę zwrotną dla poleceń kierowanych do kontenera, chyba że jawnie nadpiszesz tę kontrolę bezpieczeństwa.

## Wymagania proxy

Polityka proxy jest granicą bezpieczeństwa. OpenClaw nie może zweryfikować, że proxy blokuje właściwe cele.

Skonfiguruj proxy tak, aby:

- Wiązało się tylko z pętlą zwrotną lub prywatnym zaufanym interfejsem.
- Ograniczało dostęp tak, aby mogły z niego korzystać tylko proces OpenClaw, host, kontener lub konto usługi.
- Samodzielnie rozwiązywało miejsca docelowe i blokowało docelowe adresy IP po rozwiązaniu DNS.
- Stosowało politykę w czasie łączenia zarówno dla zwykłych żądań HTTP, jak i tuneli HTTPS `CONNECT`.
- Odrzucało obejścia oparte na miejscach docelowych dla pętli zwrotnej, zakresów prywatnych, link-local, metadanych, multicast, zarezerwowanych lub dokumentacyjnych.
- Unikało list dozwolonych nazw hostów, chyba że w pełni ufasz ścieżce rozwiązywania DNS.
- Rejestrowało miejsce docelowe, decyzję, status i powód bez rejestrowania treści żądań, nagłówków autoryzacji, cookies ani innych sekretów.
- Utrzymywało politykę proxy w kontroli wersji i przeglądało zmiany tak jak konfigurację wrażliwą pod względem bezpieczeństwa.

## Zalecane blokowane miejsca docelowe

Użyj tej listy odmów jako punktu wyjścia dla dowolnego proxy przekazującego, zapory lub polityki ruchu wychodzącego.

Logika klasyfikatora na poziomie aplikacji OpenClaw znajduje się w `src/infra/net/ssrf.ts` i `src/shared/net/ip.ts`. Odpowiednie hooki parzystości to `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` oraz obsługa osadzonego sentinel IPv4 dla NAT64, 6to4, Teredo, ISATAP i form mapowanych na IPv4. Te pliki są przydatnymi odniesieniami podczas utrzymywania zewnętrznej polityki proxy, ale OpenClaw nie eksportuje ani nie egzekwuje automatycznie tych reguł w Twoim proxy.

| Zakres lub host                                                                       | Dlaczego blokować                                  |
| ------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Pętla zwrotna IPv4                                 |
| `::1/128`                                                                            | Pętla zwrotna IPv6                                 |
| `0.0.0.0/8`, `::/128`                                                                | Adresy nieokreślone i tej sieci                    |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Prywatne sieci RFC1918                             |
| `169.254.0.0/16`, `fe80::/10`                                                        | Adresy link-local i typowe ścieżki metadanych chmurowych |
| `169.254.169.254`, `metadata.google.internal`                                        | Usługi metadanych chmurowych                       |
| `100.64.0.0/10`                                                                      | Wspólna przestrzeń adresowa NAT klasy operatorskiej |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Zakresy testów wydajnościowych                     |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Zakresy specjalnego użycia i dokumentacyjne        |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                          |
| `240.0.0.0/4`                                                                        | Zarezerwowane IPv4                                 |
| `fc00::/7`, `fec0::/10`                                                              | Lokalne/prywatne zakresy IPv6                      |
| `100::/64`, `2001:20::/28`                                                           | Zakresy IPv6 discard i ORCHIDv2                    |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefiksy NAT64 z osadzonym IPv4                    |
| `2002::/16`, `2001::/32`                                                             | 6to4 i Teredo z osadzonym IPv4                     |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 zgodne z IPv4 i IPv6 mapowane na IPv4         |

Jeśli Twój dostawca chmury lub platforma sieciowa dokumentuje dodatkowe hosty metadanych albo zakresy zarezerwowane, również je dodaj.

## Walidacja

Zweryfikuj proxy z tego samego hosta, kontenera lub konta usługi, które uruchamia OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Domyślnie, gdy nie podano niestandardowych miejsc docelowych, polecenie sprawdza, czy `https://example.com/` działa, i uruchamia tymczasowy kanarek na pętli zwrotnej, do którego proxy nie może dotrzeć. Domyślna kontrola odmowy przechodzi, gdy proxy zwraca odpowiedź odmowy inną niż 2xx albo blokuje kanarka błędem transportu; kończy się niepowodzeniem, jeśli udana odpowiedź dociera do kanarka. Jeśli żadne proxy nie jest włączone i skonfigurowane, walidacja zgłasza problem z konfiguracją; użyj `--proxy-url` do jednorazowej kontroli preflight przed zmianą konfiguracji. Użyj `--allowed-url` i `--denied-url`, aby przetestować oczekiwania specyficzne dla wdrożenia. Dodaj `--apns-reachable`, aby także zweryfikować, że bezpośrednie dostarczanie APNs HTTP/2 może otworzyć tunel CONNECT przez proxy i otrzymać odpowiedź sandbox APNs; sonda używa celowo nieprawidłowego tokenu dostawcy, więc `403 InvalidProviderToken` jest oczekiwane i liczy się jako osiągalność. Niestandardowe odrzucone miejsca docelowe działają w trybie fail-closed: każda odpowiedź HTTP oznacza, że miejsce docelowe było osiągalne przez proxy, a każdy błąd transportu jest zgłaszany jako nierozstrzygający, ponieważ OpenClaw nie może udowodnić, że proxy zablokowało osiągalne źródło. W przypadku niepowodzenia walidacji polecenie kończy się kodem 1.

Użyj `--json` do automatyzacji. Dane wyjściowe JSON zawierają wynik ogólny, efektywne źródło konfiguracji proxy, wszelkie błędy konfiguracji oraz każdą kontrolę miejsca docelowego. Dane uwierzytelniające URL proxy są redagowane w danych wyjściowych tekstowych i JSON:

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

Żądanie publiczne powinno się powieść. Żądania loopback i metadanych powinny zostać zablokowane przez proxy. W przypadku `openclaw proxy validate` wbudowany kanarek loopback może odróżnić odmowę proxy od osiągalnego źródła. Niestandardowe kontrole `--denied-url` nie mają tego kanarka, więc traktuj zarówno odpowiedzi HTTP, jak i niejednoznaczne błędy transportu jako niepowodzenia walidacji, chyba że proxy udostępnia specyficzny dla wdrożenia sygnał odmowy, który możesz zweryfikować oddzielnie.

Następnie włącz trasowanie proxy OpenClaw:

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

## Limity

- Proxy poprawia pokrycie dla lokalnych dla procesu klientów JavaScript HTTP i WebSocket, ale nie jest sandboxem sieciowym na poziomie systemu operacyjnego.
- Surowe gniazda `net`, `tls` i `http2`, natywne dodatki oraz procesy podrzędne mogą omijać trasowanie proxy na poziomie Node, chyba że dziedziczą zmienne środowiskowe proxy i ich przestrzegają.
- IRC to surowy kanał TCP/TLS poza trasowaniem zarządzanego przez operatora proxy przekazującego. We wdrożeniach wymagających całego ruchu wychodzącego przez ten proxy przekazujący ustaw `channels.irc.enabled=false`, chyba że bezpośredni ruch wychodzący IRC został wyraźnie zatwierdzony.
- Lokalne debugujące proxy jest narzędziem diagnostycznym, a jego bezpośrednie przekazywanie do upstreamu dla żądań proxy i tuneli CONNECT jest domyślnie wyłączone, gdy aktywny jest tryb zarządzanego proxy; włącz bezpośrednie przekazywanie tylko dla zatwierdzonej diagnostyki lokalnej.
- Lokalne WebUI użytkownika i lokalne serwery modeli powinny zostać dodane do listy dozwolonych w polityce proxy operatora, gdy jest to potrzebne; OpenClaw nie udostępnia dla nich ogólnego obejścia sieci lokalnej.
- Obejście proxy dla płaszczyzny sterowania Gateway jest celowo ograniczone do `localhost` oraz dosłownych adresów URL IP loopback. Użyj `ws://127.0.0.1:18789`, `ws://[::1]:18789` lub `ws://localhost:18789` dla lokalnych bezpośrednich połączeń z płaszczyzną sterowania Gateway; inne nazwy hostów są trasowane jak zwykły ruch oparty na nazwach hostów.
- OpenClaw nie sprawdza, nie testuje ani nie certyfikuje Twojej polityki proxy.
- Traktuj zmiany polityki proxy jako wrażliwe operacyjnie zmiany związane z bezpieczeństwem.
