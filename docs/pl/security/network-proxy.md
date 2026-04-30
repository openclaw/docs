---
read_when:
    - Chcesz ochrony warstwowej przed atakami SSRF i atakami polegającymi na ponownym wiązaniu DNS
    - Konfigurowanie zewnętrznego serwera proxy typu forward dla ruchu środowiska uruchomieniowego OpenClaw
summary: Jak kierować ruch HTTP i WebSocket środowiska uruchomieniowego OpenClaw przez filtrujący serwer proxy zarządzany przez operatora
title: Proxy sieciowy
x-i18n:
    generated_at: "2026-04-30T10:19:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4e879f787571410acdda55dcdbb5fd77aef1d24045af5c9208cba51330a70ca
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy sieciowy

OpenClaw może kierować ruch HTTP i WebSocket środowiska uruchomieniowego przez zarządzany przez operatora proxy przekazujący. To opcjonalna warstwa obrony w głąb dla wdrożeń, które wymagają centralnej kontroli ruchu wychodzącego, silniejszej ochrony przed SSRF i lepszej audytowalności sieci.

OpenClaw nie dostarcza, nie pobiera, nie uruchamia, nie konfiguruje ani nie certyfikuje proxy. Uruchamiasz technologię proxy pasującą do swojego środowiska, a OpenClaw kieruje przez nie zwykłych lokalnych dla procesu klientów HTTP i WebSocket.

## Dlaczego warto używać proxy?

Proxy daje operatorom jeden punkt kontroli sieci dla wychodzącego ruchu HTTP i WebSocket. Może to być przydatne nawet poza wzmacnianiem ochrony przed SSRF:

- Centralna polityka: utrzymuj jedną politykę ruchu wychodzącego zamiast polegać na tym, że każde miejsce wywołania HTTP w aplikacji poprawnie zastosuje reguły sieciowe.
- Kontrole w czasie łączenia: oceniaj miejsce docelowe po rozwiązaniu DNS i bezpośrednio przed otwarciem przez proxy połączenia do usługi nadrzędnej.
- Obrona przed DNS rebinding: zmniejsz lukę między sprawdzeniem DNS na poziomie aplikacji a faktycznym połączeniem wychodzącym.
- Szersze pokrycie JavaScript: kieruj zwykłe `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch i podobnych klientów tą samą ścieżką.
- Audytowalność: rejestruj dozwolone i odrzucone miejsca docelowe na granicy ruchu wychodzącego.
- Kontrola operacyjna: egzekwuj reguły miejsc docelowych, segmentację sieci, limity szybkości lub listy dozwolonych miejsc docelowych bez przebudowywania OpenClaw.

Kierowanie przez proxy to zabezpieczenie na poziomie procesu dla zwykłego wychodzącego ruchu HTTP i WebSocket. Daje operatorom ścieżkę domyślnie zamkniętą do kierowania obsługiwanych klientów HTTP JavaScript przez własne filtrujące proxy, ale nie jest piaskownicą sieciową na poziomie systemu operacyjnego i nie sprawia, że OpenClaw certyfikuje politykę miejsc docelowych tego proxy.

## Jak OpenClaw kieruje ruch

Gdy `proxy.enabled=true` i skonfigurowano URL proxy, chronione procesy środowiska uruchomieniowego, takie jak `openclaw gateway run`, `openclaw node run` i `openclaw agent --local`, kierują zwykły wychodzący ruch HTTP i WebSocket przez skonfigurowane proxy:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Publicznym kontraktem jest zachowanie kierowania ruchu, a nie wewnętrzne haki Node użyte do jego wdrożenia. Klienci WebSocket płaszczyzny sterowania OpenClaw Gateway używają wąskiej ścieżki bezpośredniej dla ruchu RPC Gateway local loopback, gdy URL Gateway używa `localhost` albo dosłownego adresu IP pętli zwrotnej, takiego jak `127.0.0.1` lub `[::1]`. Ta ścieżka płaszczyzny sterowania musi móc docierać do Gateway na pętli zwrotnej nawet wtedy, gdy proxy operatora blokuje miejsca docelowe pętli zwrotnej. Zwykłe żądania HTTP i WebSocket środowiska uruchomieniowego nadal używają skonfigurowanego proxy.

Wewnętrznie OpenClaw używa dwóch haków kierowania na poziomie procesu dla tej funkcji:

- Kierowanie przez dispatcher Undici obejmuje `fetch`, klientów opartych na undici oraz transporty, które udostępniają własny dispatcher undici.
- Kierowanie `global-agent` obejmuje wywołujących Node core `node:http` i `node:https`, w tym wiele bibliotek zbudowanych na `http.request`, `https.request`, `http.get` i `https.get`. Tryb zarządzanego proxy wymusza tego globalnego agenta, aby jawni agenci HTTP Node nie omijali przypadkowo proxy operatora.

Niektóre Pluginy posiadają własne niestandardowe transporty, które wymagają jawnego podłączenia proxy nawet wtedy, gdy istnieje kierowanie na poziomie procesu. Na przykład transport Bot API Telegram używa własnego dispatchera HTTP/1 undici i dlatego respektuje środowisko proxy procesu oraz zarządzany awaryjny mechanizm `OPENCLAW_PROXY_URL` w tej ścieżce transportu specyficznej dla właściciela.

Sam URL proxy musi używać `http://`. Miejsca docelowe HTTPS nadal są obsługiwane przez proxy z użyciem HTTP `CONNECT`; oznacza to jedynie, że OpenClaw oczekuje zwykłego nasłuchującego proxy przekazującego HTTP, takiego jak `http://127.0.0.1:3128`.

Gdy proxy jest aktywne, OpenClaw czyści `no_proxy`, `NO_PROXY` i `GLOBAL_AGENT_NO_PROXY`. Te listy obejść są oparte na miejscach docelowych, więc pozostawienie tam `localhost` lub `127.0.0.1` pozwoliłoby celom SSRF wysokiego ryzyka pominąć filtrujące proxy.

Podczas zamykania OpenClaw przywraca poprzednie środowisko proxy i resetuje zbuforowany stan kierowania procesu.

## Powiązane terminy proxy

- `proxy.enabled` / `proxy.proxyUrl`: kierowanie wychodzącego ruchu OpenClaw środowiska uruchomieniowego przez proxy przekazujące. Ta strona dokumentuje tę funkcję.
- `gateway.auth.mode: "trusted-proxy"`: przychodzące uwierzytelnianie reverse proxy świadome tożsamości dla dostępu do Gateway. Zobacz [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth).
- `openclaw proxy`: lokalne proxy debugowania i inspektor przechwytywania do rozwoju i wsparcia. Zobacz [openclaw proxy](/pl/cli/proxy).
- Ustawienia proxy specyficzne dla kanału lub dostawcy: nadpisania specyficzne dla właściciela dla konkretnego transportu. Preferuj zarządzane proxy sieciowe, gdy celem jest centralna kontrola ruchu wychodzącego w całym środowisku uruchomieniowym.

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

Jeśli `enabled=true`, ale nie skonfigurowano prawidłowego URL proxy, chronione polecenia kończą uruchamianie niepowodzeniem zamiast przechodzić awaryjnie na bezpośredni dostęp do sieci.

W przypadku zarządzanych usług gateway uruchamianych przez `openclaw gateway start` preferuj przechowywanie URL w konfiguracji:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Awaryjny mechanizm środowiskowy najlepiej sprawdza się w uruchomieniach pierwszoplanowych. Jeśli używasz go z zainstalowaną usługą, umieść `OPENCLAW_PROXY_URL` w trwałym środowisku usługi, takim jak `$OPENCLAW_STATE_DIR/.env` lub `~/.openclaw/.env`, a następnie zainstaluj usługę ponownie, aby launchd, systemd lub Scheduled Tasks uruchamiały gateway z tą wartością.

W przypadku poleceń `openclaw --container ...` OpenClaw przekazuje `OPENCLAW_PROXY_URL` do potomnego CLI przeznaczonego dla kontenera, gdy jest ustawiony. URL musi być osiągalny z wnętrza kontenera; `127.0.0.1` odnosi się do samego kontenera, a nie hosta. OpenClaw odrzuca URL proxy pętli zwrotnej dla poleceń przeznaczonych dla kontenera, chyba że jawnie nadpiszesz tę kontrolę bezpieczeństwa.

## Wymagania dotyczące proxy

Polityka proxy jest granicą bezpieczeństwa. OpenClaw nie może zweryfikować, czy proxy blokuje właściwe cele.

Skonfiguruj proxy tak, aby:

- Wiązało się tylko z pętlą zwrotną lub prywatnym zaufanym interfejsem.
- Ograniczało dostęp tak, aby mogły go używać tylko proces OpenClaw, host, kontener lub konto usługi.
- Samodzielnie rozwiązywało miejsca docelowe i blokowało docelowe adresy IP po rozwiązaniu DNS.
- Stosowało politykę w czasie łączenia zarówno dla zwykłych żądań HTTP, jak i tuneli HTTPS `CONNECT`.
- Odrzucało obejścia oparte na miejscach docelowych dla pętli zwrotnej, zakresów prywatnych, link-local, metadanych, multicast, zarezerwowanych lub dokumentacyjnych.
- Unikało list dozwolonych nazw hostów, chyba że w pełni ufasz ścieżce rozwiązywania DNS.
- Rejestrowało miejsce docelowe, decyzję, status i powód bez rejestrowania treści żądań, nagłówków autoryzacji, plików cookie ani innych sekretów.
- Utrzymywało politykę proxy pod kontrolą wersji i przeglądało zmiany tak jak konfigurację wrażliwą pod kątem bezpieczeństwa.

## Zalecane blokowane miejsca docelowe

Użyj tej listy odmów jako punktu wyjścia dla dowolnego proxy przekazującego, zapory lub polityki ruchu wychodzącego.

Logika klasyfikatora na poziomie aplikacji OpenClaw znajduje się w `src/infra/net/ssrf.ts` i `src/shared/net/ip.ts`. Odpowiednie haki zgodności to `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` oraz osadzona obsługa wartownika IPv4 dla NAT64, 6to4, Teredo, ISATAP i form mapowanych na IPv4. Te pliki są przydatnymi odniesieniami podczas utrzymywania zewnętrznej polityki proxy, ale OpenClaw nie eksportuje ani nie egzekwuje automatycznie tych reguł w Twoim proxy.

| Zakres lub host                                                                       | Dlaczego blokować                                   |
| ------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Pętla zwrotna IPv4                                  |
| `::1/128`                                                                            | Pętla zwrotna IPv6                                  |
| `0.0.0.0/8`, `::/128`                                                                | Adresy nieokreślone i adresy tej sieci              |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Sieci prywatne RFC1918                              |
| `169.254.0.0/16`, `fe80::/10`                                                        | Adresy link-local i typowe ścieżki metadanych chmur |
| `169.254.169.254`, `metadata.google.internal`                                        | Usługi metadanych chmur                             |
| `100.64.0.0/10`                                                                      | Współdzielona przestrzeń adresowa NAT klasy operatorskiej |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Zakresy testów wydajnościowych                      |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Zakresy specjalnego użycia i dokumentacyjne         |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                           |
| `240.0.0.0/4`                                                                        | Zarezerwowane IPv4                                  |
| `fc00::/7`, `fec0::/10`                                                              | Lokalne/prywatne zakresy IPv6                       |
| `100::/64`, `2001:20::/28`                                                           | Zakresy IPv6 discard i ORCHIDv2                     |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefiksy NAT64 z osadzonym IPv4                     |
| `2002::/16`, `2001::/32`                                                             | 6to4 i Teredo z osadzonym IPv4                      |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 zgodne z IPv4 i IPv6 mapowane na IPv4          |

Jeśli Twój dostawca chmury lub platforma sieciowa dokumentuje dodatkowe hosty metadanych albo zarezerwowane zakresy, dodaj je również.

## Walidacja

Zweryfikuj proxy z tego samego hosta, kontenera lub konta usługi, które uruchamia OpenClaw:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

Żądanie publiczne powinno się powieść. Żądania do pętli zwrotnej i metadanych powinny zakończyć się niepowodzeniem na proxy.

Następnie włącz kierowanie OpenClaw przez proxy:

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

- Proxy poprawia pokrycie dla lokalnych dla procesu klientów HTTP i WebSocket JavaScript, ale nie jest piaskownicą sieciową na poziomie systemu operacyjnego.
- Surowe gniazda `net`, `tls` i `http2`, natywne dodatki oraz procesy potomne mogą omijać kierowanie przez proxy na poziomie Node, chyba że dziedziczą i respektują zmienne środowiskowe proxy.
- Lokalne WebUI użytkownika i lokalne serwery modeli powinny zostać dodane do listy dozwolonych w polityce proxy operatora, gdy jest to potrzebne; OpenClaw nie udostępnia dla nich ogólnego obejścia sieci lokalnej.
- Obejście proxy płaszczyzny sterowania Gateway jest celowo ograniczone do `localhost` i dosłownych URL z adresami IP pętli zwrotnej. Użyj `ws://127.0.0.1:18789`, `ws://[::1]:18789` lub `ws://localhost:18789` dla lokalnych bezpośrednich połączeń z płaszczyzną sterowania Gateway; inne nazwy hostów są kierowane jak zwykły ruch oparty na nazwach hostów.
- OpenClaw nie sprawdza, nie testuje ani nie certyfikuje Twojej polityki proxy.
- Traktuj zmiany polityki proxy jako operacyjne zmiany wrażliwe pod kątem bezpieczeństwa.
