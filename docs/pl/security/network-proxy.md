---
read_when:
    - Chcesz obrony wielowarstwowej przed atakami SSRF i DNS rebinding
    - Konfigurowanie zewnętrznego proxy przekazującego dla ruchu środowiska uruchomieniowego OpenClaw
summary: Jak kierować ruch HTTP i WebSocket środowiska uruchomieniowego OpenClaw przez zarządzane przez operatora proxy filtrujące
title: Proxy sieciowe
x-i18n:
    generated_at: "2026-06-27T18:21:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3fc68d950037922ba3dc983c94a71bac3374750a02ef25f2c046cf782410be68
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw może kierować ruch HTTP i WebSocket środowiska uruchomieniowego przez zarządzany przez operatora forward proxy. To opcjonalna warstwa obrony dla wdrożeń, które wymagają centralnej kontroli ruchu wychodzącego, silniejszej ochrony przed SSRF i lepszej audytowalności sieci.

OpenClaw nie dostarcza, nie pobiera, nie uruchamia, nie konfiguruje ani nie certyfikuje proxy. Uruchamiasz technologię proxy dopasowaną do swojego środowiska, a OpenClaw kieruje przez nią zwykłych lokalnych dla procesu klientów HTTP i WebSocket.

## Dlaczego używać proxy

Proxy daje operatorom jeden punkt kontroli sieci dla wychodzącego ruchu HTTP i WebSocket. Może to być przydatne nawet poza wzmacnianiem ochrony przed SSRF:

- Centralna polityka: utrzymuj jedną politykę ruchu wychodzącego zamiast polegać na tym, że każde miejsce wywołań HTTP w aplikacji poprawnie zastosuje reguły sieciowe.
- Kontrole w czasie łączenia: oceniaj miejsce docelowe po rozwiązaniu DNS i bezpośrednio przed otwarciem przez proxy połączenia z usługą nadrzędną.
- Ochrona przed DNS rebinding: zmniejsz odstęp między kontrolą DNS na poziomie aplikacji a faktycznym połączeniem wychodzącym.
- Szersze pokrycie JavaScript: kieruj zwykłe klienty `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch i podobne przez tę samą ścieżkę.
- Audytowalność: rejestruj dozwolone i odrzucone miejsca docelowe na granicy ruchu wychodzącego.
- Kontrola operacyjna: wymuszaj reguły miejsc docelowych, segmentację sieci, limity szybkości lub listy dozwolonych miejsc docelowych bez przebudowywania OpenClaw.

Trasowanie przez proxy jest zabezpieczeniem na poziomie procesu dla zwykłego wychodzącego ruchu HTTP i WebSocket. Daje operatorom ścieżkę fail-closed do kierowania obsługiwanych klientów HTTP JavaScript przez własne filtrujące proxy, ale nie jest piaskownicą sieciową na poziomie systemu operacyjnego i nie sprawia, że OpenClaw certyfikuje politykę miejsc docelowych proxy.

## Jak OpenClaw kieruje ruch

Gdy `proxy.enabled=true` i skonfigurowano URL proxy, chronione procesy środowiska uruchomieniowego, takie jak `openclaw gateway run`, `openclaw node run` i `openclaw agent --local`, kierują zwykły wychodzący ruch HTTP i WebSocket przez skonfigurowane proxy:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Publicznym kontraktem jest zachowanie trasowania, a nie wewnętrzne haki Node używane do jego implementacji. Klienci WebSocket płaszczyzny sterowania OpenClaw Gateway używają wąskiej ścieżki bezpośredniej dla ruchu RPC Gateway local loopback, gdy URL Gateway używa `localhost` albo literalnego adresu IP pętli zwrotnej, takiego jak `127.0.0.1` lub `[::1]`. Ta ścieżka płaszczyzny sterowania musi móc docierać do Gateway działających na pętli zwrotnej nawet wtedy, gdy proxy operatora blokuje docelowe adresy pętli zwrotnej. Zwykłe żądania HTTP i WebSocket środowiska uruchomieniowego nadal używają skonfigurowanego proxy.

Wewnętrznie OpenClaw instaluje Proxyline jako środowisko trasowania na poziomie procesu dla tej funkcji. Proxyline obejmuje `fetch`, klientów opartych na undici, wywołujących z podstawowych modułów Node `node:http` / `node:https`, typowych klientów WebSocket oraz tunele CONNECT tworzone przez pomocnicze funkcje. Tryb zarządzanego proxy zastępuje dostarczone przez wywołującego agenty HTTP Node, aby jawne agenty nie omijały przypadkowo proxy operatora.

Niektóre pluginy mają własne transporty, które wymagają jawnego podłączenia proxy nawet wtedy, gdy istnieje trasowanie na poziomie procesu. Na przykład transport Telegram Bot API używa własnego dyspozytora HTTP/1 undici i dlatego respektuje zmienne środowiskowe proxy procesu oraz zarządzane zastąpienie awaryjne `OPENCLAW_PROXY_URL` w tej ścieżce transportu właściwej dla właściciela.

Sam URL proxy może używać `http://` albo `https://`. Te schematy opisują połączenie z OpenClaw do punktu końcowego proxy:

- `http://proxy.example:3128`: OpenClaw otwiera zwykłe połączenie TCP do forward proxy i wysyła żądania proxy HTTP, w tym `CONNECT` dla miejsc docelowych HTTPS.
- `https://proxy.example:8443`: OpenClaw otwiera TLS do punktu końcowego proxy, weryfikuje certyfikat proxy, a następnie wysyła żądania proxy HTTP wewnątrz tej sesji TLS.

HTTPS miejsca docelowego jest niezależny od TLS punktu końcowego proxy. Dla miejsca docelowego HTTPS OpenClaw nadal prosi proxy o tunel HTTP `CONNECT`, a następnie uruchamia TLS miejsca docelowego przez ten tunel.

Gdy proxy jest aktywne, OpenClaw czyści `no_proxy` i `NO_PROXY`. Te listy obejść są oparte na miejscach docelowych, więc pozostawienie tam `localhost` lub `127.0.0.1` pozwoliłoby celom SSRF wysokiego ryzyka pominąć filtrujące proxy.

Podczas zamykania OpenClaw przywraca poprzednie środowisko proxy i resetuje pamięć podręczną stanu trasowania procesu.

## Powiązane terminy proxy

- `proxy.enabled` / `proxy.proxyUrl`: trasowanie wychodzące przez forward proxy dla ruchu wychodzącego środowiska uruchomieniowego OpenClaw. Ta strona dokumentuje tę funkcję.
- `gateway.auth.mode: "trusted-proxy"`: uwierzytelnianie przychodzące przez reverse proxy świadome tożsamości dla dostępu do Gateway. Zobacz [Uwierzytelnianie przez zaufane proxy](/pl/gateway/trusted-proxy-auth).
- `openclaw proxy`: lokalne debugujące proxy i inspektor przechwytywania do prac deweloperskich i wsparcia. Zobacz [openclaw proxy](/pl/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: opcja włączana jawnie dla `web_fetch`, aby pozwolić kontrolowanemu przez operatora proxy HTTP(S) ze środowiska rozwiązywać DNS przy zachowaniu domyślnego ścisłego przypinania DNS i polityki nazw hostów. Zobacz [Pobieranie z sieci](/pl/tools/web-fetch#trusted-env-proxy).
- Ustawienia proxy właściwe dla kanału lub dostawcy: zastąpienia właściwe dla właściciela dla konkretnego transportu. Preferuj zarządzane proxy sieciowe, gdy celem jest centralna kontrola ruchu wychodzącego w całym środowisku uruchomieniowym.

## Konfiguracja

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Dla punktu końcowego proxy HTTPS z prywatnym CA proxy:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

Możesz także podać URL przez środowisko, pozostawiając `proxy.enabled=true` w konfiguracji:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` ma pierwszeństwo przed `OPENCLAW_PROXY_URL`.

### Tryb pętli zwrotnej Gateway

Lokalni klienci płaszczyzny sterowania Gateway zwykle łączą się z WebSocketem pętli zwrotnej, takim jak `ws://127.0.0.1:18789`. Użyj `proxy.loopbackMode`, aby wybrać, jak mają zachowywać się wyjątki pętli zwrotnej zarządzanego proxy, gdy zarządzane proxy jest aktywne:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (domyślnie): OpenClaw rejestruje autorytet pętli zwrotnej Gateway w zarządzanej polityce obejść Proxyline, aby lokalny ruch WebSocket Gateway mógł łączyć się bezpośrednio. Niestandardowe porty Gateway na pętli zwrotnej działają, ponieważ host i port aktywnego URL Gateway są rejestrowane. Dołączony plugin przeglądarki może również rejestrować dokładne lokalne punkty końcowe gotowości CDP i WebSocket DevTools dla zarządzanych przeglądarek uruchomionych przez OpenClaw, a dołączony dostawca osadzeń pamięci Ollama może używać własnej, węższej, chronionej ścieżki bezpośredniej dla dokładnie skonfigurowanego lokalnego dla hosta źródła osadzeń na pętli zwrotnej.
- `proxy`: OpenClaw nie rejestruje obejść pętli zwrotnej Gateway ani Ollama, więc ten ruch pętli zwrotnej jest wysyłany przez zarządzane proxy. Jeśli proxy jest zdalne, musi zapewniać specjalne trasowanie do usługi pętli zwrotnej hosta OpenClaw, na przykład mapując ją na nazwę hosta, adres IP lub tunel osiągalny z proxy. Standardowe zdalne proxy rozwiązują `127.0.0.1` i `localhost` z hosta proxy, a nie z hosta OpenClaw.
- `block`: OpenClaw odmawia połączeń płaszczyzny sterowania Gateway przez pętlę zwrotną oraz chronionych lokalnych dla hosta połączeń pętli zwrotnej osadzeń Ollama przed otwarciem gniazda.

Jeśli `enabled=true`, ale nie skonfigurowano prawidłowego URL proxy, chronione polecenia kończą uruchamianie błędem zamiast wracać do bezpośredniego dostępu do sieci.

Dla zarządzanych usług Gateway uruchamianych za pomocą `openclaw gateway start` preferuj przechowywanie URL w konfiguracji:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Zastąpienie awaryjne ze środowiska najlepiej nadaje się do uruchomień pierwszoplanowych. Jeśli używasz go z zainstalowaną usługą, umieść `OPENCLAW_PROXY_URL` w trwałym środowisku usługi, takim jak `$OPENCLAW_STATE_DIR/.env` lub `~/.openclaw/.env`, a następnie zainstaluj usługę ponownie, aby launchd, systemd lub Scheduled Tasks uruchamiały gateway z tą wartością.

Dla poleceń `openclaw --container ...` OpenClaw przekazuje `OPENCLAW_PROXY_URL` do podrzędnego CLI skierowanego do kontenera, gdy jest ustawiony. URL musi być osiągalny z wnętrza kontenera; `127.0.0.1` odnosi się do samego kontenera, a nie do hosta. OpenClaw odrzuca URL proxy pętli zwrotnej dla poleceń skierowanych do kontenera, chyba że jawnie nadpiszesz tę kontrolę bezpieczeństwa.

## Wymagania dotyczące proxy

Polityka proxy jest granicą bezpieczeństwa. OpenClaw nie może zweryfikować, czy proxy blokuje właściwe cele.

Skonfiguruj proxy tak, aby:

- Nasłuchiwało tylko na pętli zwrotnej lub prywatnym zaufanym interfejsie.
- Ograniczało dostęp tak, aby mogły go używać tylko proces, host, kontener lub konto usługi OpenClaw.
- Samodzielnie rozwiązywało miejsca docelowe i blokowało docelowe adresy IP po rozwiązaniu DNS.
- Stosowało politykę w czasie łączenia zarówno dla zwykłych żądań HTTP, jak i tuneli HTTPS `CONNECT`.
- Odrzucało obejścia oparte na miejscach docelowych dla pętli zwrotnej, zakresów prywatnych, link-local, metadata, multicast, reserved lub documentation.
- Unikało list dozwolonych nazw hostów, chyba że w pełni ufasz ścieżce rozwiązywania DNS.
- Rejestrowało miejsce docelowe, decyzję, status i przyczynę bez rejestrowania treści żądań, nagłówków autoryzacji, cookies ani innych sekretów.
- Utrzymywało politykę proxy pod kontrolą wersji i przeglądało zmiany jak konfigurację wrażliwą na bezpieczeństwo.

## Zalecane blokowane miejsca docelowe

Użyj tej listy odmów jako punktu wyjścia dla dowolnego forward proxy, zapory lub polityki ruchu wychodzącego.

Logika klasyfikatora na poziomie aplikacji OpenClaw znajduje się w `src/infra/net/ssrf.ts` i `packages/net-policy/src/ip.ts`. Odpowiednie haki zgodności to `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` oraz wbudowana obsługa sentinel IPv4 dla NAT64, 6to4, Teredo, ISATAP i form mapowanych na IPv4. Te pliki są użytecznymi odniesieniami podczas utrzymywania zewnętrznej polityki proxy, ale OpenClaw nie eksportuje automatycznie ani nie wymusza tych reguł w Twoim proxy.

| Zakres lub host                                                                       | Dlaczego blokować                                      |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Pętla zwrotna IPv4                                     |
| `::1/128`                                                                            | Pętla zwrotna IPv6                                     |
| `0.0.0.0/8`, `::/128`                                                                | Adresy nieokreślone i adresy tej sieci                 |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Sieci prywatne RFC1918                                 |
| `169.254.0.0/16`, `fe80::/10`                                                        | Adresy link-local i typowe ścieżki metadanych chmury   |
| `169.254.169.254`, `metadata.google.internal`                                        | Usługi metadanych chmury                               |
| `100.64.0.0/10`                                                                      | Wspólna przestrzeń adresowa Carrier-grade NAT          |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Zakresy testów wydajnościowych                         |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Zakresy specjalnego użytku i dokumentacyjne            |
| `224.0.0.0/4`, `ff00::/8`                                                            | Rozsyłanie grupowe                                     |
| `240.0.0.0/4`                                                                        | Zarezerwowane IPv4                                     |
| `fc00::/7`, `fec0::/10`                                                              | Lokalne/prywatne zakresy IPv6                          |
| `100::/64`, `2001:20::/28`                                                           | Zakresy odrzucania IPv6 i ORCHIDv2                     |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefiksy NAT64 z osadzonym IPv4                        |
| `2002::/16`, `2001::/32`                                                             | 6to4 i Teredo z osadzonym IPv4                         |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4-compatible i IPv4-mapped IPv6                     |

Jeśli Twój dostawca chmury lub platforma sieciowa dokumentuje dodatkowe hosty metadanych albo zarezerwowane zakresy, dodaj je również.

## Walidacja

Zweryfikuj proxy z tego samego hosta, kontenera lub konta usługi, na którym działa OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Dla punktu końcowego proxy HTTPS podpisanego przez prywatny CA:

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

Domyślnie, gdy nie podano niestandardowych miejsc docelowych, polecenie sprawdza, czy `https://example.com/` działa, i uruchamia tymczasową sondę canary na pętli zwrotnej, do której proxy nie może dotrzeć. Domyślna kontrola odmowy przechodzi, gdy proxy zwraca odpowiedź odmowy inną niż 2xx albo blokuje sondę canary błędem transportu; kończy się niepowodzeniem, jeśli do sondy canary dotrze pomyślna odpowiedź. Jeśli proxy nie jest włączone i skonfigurowane, walidacja zgłasza problem z konfiguracją; użyj `--proxy-url` do jednorazowego sprawdzenia wstępnego przed zmianą konfiguracji. Użyj `--allowed-url` i `--denied-url`, aby przetestować oczekiwania specyficzne dla wdrożenia. Dodaj `--apns-reachable`, aby dodatkowo sprawdzić, czy bezpośrednie dostarczanie APNs HTTP/2 może otworzyć tunel CONNECT przez proxy i odebrać odpowiedź sandbox APNs; próba używa celowo nieprawidłowego tokenu dostawcy, więc `403 InvalidProviderToken` jest oczekiwane i liczy się jako osiągalność. Niestandardowe zablokowane miejsca docelowe działają w trybie fail-closed: każda odpowiedź HTTP oznacza, że miejsce docelowe było osiągalne przez proxy, a każdy błąd transportu jest zgłaszany jako nierozstrzygający, ponieważ OpenClaw nie może udowodnić, że proxy zablokowało osiągalne źródło. W razie niepowodzenia walidacji polecenie kończy działanie z kodem 1.

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

Żądanie publiczne powinno się powieść. Żądania do pętli zwrotnej i metadanych powinny zostać zablokowane przez proxy. W przypadku `openclaw proxy validate` wbudowana sonda canary na pętli zwrotnej potrafi odróżnić odmowę proxy od osiągalnego źródła. Niestandardowe kontrole `--denied-url` nie mają tej sondy canary, więc traktuj zarówno odpowiedzi HTTP, jak i niejednoznaczne błędy transportu jako niepowodzenia walidacji, chyba że Twoje proxy udostępnia sygnał odmowy specyficzny dla wdrożenia, który możesz zweryfikować osobno.

## Zaufanie CA proxy

Użyj zarządzanego `proxy.tls.caFile`, gdy sam punkt końcowy proxy używa certyfikatu podpisanego przez prywatny CA:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

Ten CA jest używany do weryfikacji TLS punktu końcowego proxy. Nie jest to ustawienie zaufania MITM dla miejsca docelowego, certyfikat klienta ani zamiennik polityki miejsc docelowych proxy.

Używaj `NODE_EXTRA_CA_CERTS` tylko wtedy, gdy cały proces Node musi ufać dodatkowemu CA od chwili startu procesu, na przykład gdy korporacyjny system inspekcji TLS ponownie podpisuje certyfikaty miejsc docelowych dla każdego klienta HTTPS w procesie. `NODE_EXTRA_CA_CERTS` ma zasięg globalny dla procesu i musi być obecne przed uruchomieniem Node. Preferuj `proxy.tls.caFile` dla zaufania do punktu końcowego proxy HTTPS, ponieważ jest ograniczone do zarządzanego routingu proxy.

Następnie włącz routing proxy OpenClaw:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

albo ustaw:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

## Ograniczenia

- Proxy poprawia pokrycie dla lokalnych w procesie klientów JavaScript HTTP i WebSocket, ale nie jest piaskownicą sieciową na poziomie systemu operacyjnego.
- Ruch płaszczyzny sterowania local loopback Gateway domyślnie używa bezpośredniego lokalnego obejścia przez `proxy.loopbackMode: "gateway-only"`. OpenClaw implementuje to obejście, rejestrując aktywny autorytet pętli zwrotnej Gateway w zarządzanej polityce obejść Proxyline. Operatorzy mogą ustawić `proxy.loopbackMode: "proxy"`, aby wysyłać ruch pętli zwrotnej Gateway przez zarządzane proxy, albo `proxy.loopbackMode: "block"`, aby odmawiać połączeń Gateway przez pętlę zwrotną. Zobacz [Tryb pętli zwrotnej Gateway](#gateway-loopback-mode), aby poznać zastrzeżenie dotyczące zdalnego proxy.
- Surowe gniazda `net`, `tls` i `http2`, natywne dodatki oraz procesy potomne spoza OpenClaw mogą omijać routing proxy na poziomie Node, chyba że dziedziczą i respektują zmienne środowiskowe proxy. Rozwidlone potomne CLI OpenClaw dziedziczą zarządzany URL proxy oraz stan `proxy.loopbackMode`.
- IRC to surowy kanał TCP/TLS poza zarządzanym przez operatora routingiem proxy przekazującego. We wdrożeniach, które wymagają całego ruchu wychodzącego przez to proxy przekazujące, ustaw `channels.irc.enabled=false`, chyba że bezpośredni ruch wychodzący IRC jest wyraźnie zatwierdzony.
- Lokalne proxy debugowania jest narzędziem diagnostycznym, a jego bezpośrednie przekazywanie upstream dla żądań proxy i tuneli CONNECT jest domyślnie wyłączone, gdy aktywny jest zarządzany tryb proxy; włącz bezpośrednie przekazywanie tylko dla zatwierdzonej diagnostyki lokalnej.
- Lokalne WebUI użytkownika i lokalne serwery modeli powinny być w razie potrzeby dodane do listy dozwolonych w polityce proxy operatora; OpenClaw nie udostępnia dla nich ogólnego obejścia sieci lokalnej. Dołączony dostawca osadzeń pamięci Ollama jest węższy: może używać chronionej ścieżki bezpośredniej tylko dla dokładnego źródła osadzeń host-local loopback wyprowadzonego ze skonfigurowanego `baseUrl`, aby osadzenia host-local nadal działały, gdy zarządzane proxy nie może dotrzeć do pętli zwrotnej hosta. Hosty osadzeń Ollama w LAN, tailnet, sieci prywatnej i publiczne nadal używają ścieżki zarządzanego proxy. `proxy.loopbackMode: "proxy"` wysyła ten ruch pętli zwrotnej Ollama przez zarządzane proxy, a `proxy.loopbackMode: "block"` odmawia go przed otwarciem połączenia.
- Obejście proxy płaszczyzny sterowania Gateway jest celowo ograniczone do `localhost` i dosłownych adresów IP pętli zwrotnej w URL. Użyj `ws://127.0.0.1:18789`, `ws://[::1]:18789` albo `ws://localhost:18789` dla lokalnych bezpośrednich połączeń płaszczyzny sterowania Gateway; inne nazwy hostów są routowane jak zwykły ruch oparty na nazwie hosta.
- OpenClaw nie sprawdza, nie testuje ani nie certyfikuje Twojej polityki proxy.
- Traktuj zmiany polityki proxy jako operacyjne zmiany wrażliwe pod względem bezpieczeństwa.

| Powierzchnia                                                 | Status zarządzanego proxy                                                                           |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, typowi klienci WebSocket | Routowane przez zarządzane haki proxy, gdy są skonfigurowane.                                       |
| Bezpośrednie APNs HTTP/2                                     | Routowane przez zarządzany helper CONNECT APNs.                                                     |
| Pętla zwrotna płaszczyzny sterowania Gateway                 | Bezpośrednio tylko dla skonfigurowanego lokalnego URL pętli zwrotnej Gateway.                       |
| Przekazywanie upstream proxy debugowania                     | Wyłączone, gdy aktywny jest zarządzany tryb proxy, chyba że wyraźnie włączono lokalną diagnostykę.  |
| IRC                                                          | Surowy TCP/TLS; nie jest proxyfikowany przez zarządzany tryb proxy HTTP. Wyłącz, chyba że bezpośredni ruch wychodzący IRC jest zatwierdzony. |
| Inne surowe wywołania klientów `net`, `tls` lub `http2`      | Muszą zostać sklasyfikowane przez strażnika surowych gniazd przed wdrożeniem.                       |
