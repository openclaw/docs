---
read_when:
    - Debugowanie problemów z wykrywaniem Bonjour w systemach macOS/iOS
    - Zmiana typów usług mDNS, rekordów TXT lub interfejsu wykrywania
summary: Wykrywanie Bonjour/mDNS i debugowanie (sygnały nawigacyjne Gateway, klienty i typowe tryby awarii)
title: Wykrywanie Bonjour
x-i18n:
    generated_at: "2026-07-16T18:17:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 42a46dc34e94dc86ee0432b12fcb59b3855371c745d79825a00aa557e1369160
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw może używać Bonjour (mDNS/DNS-SD) do wykrywania aktywnego Gateway (punktu końcowego WebSocket). Przeglądanie multiemisji `local.` jest **udogodnieniem działającym wyłącznie w sieci LAN**: dołączony Plugin `bonjour` odpowiada za rozgłaszanie w sieci LAN, uruchamiając się automatycznie na hostach macOS oraz opcjonalnie w systemach Linux i Windows, a także we wdrożeniach Gateway w kontenerach. Ten sam sygnał może być również publikowany za pośrednictwem skonfigurowanej domeny DNS-SD sieci rozległej w celu wykrywania między sieciami. Wykrywanie działa na zasadzie najlepszych starań i **nie** zastępuje łączności opartej na SSH ani Tailnet.

## Bonjour w sieci rozległej (DNS-SD unicast) przez Tailscale

Jeśli Node i Gateway znajdują się w różnych sieciach, multiemisja mDNS nie może przekroczyć ich granicy. Można zachować ten sam sposób korzystania z wykrywania, przełączając się na **DNS-SD unicast** („Bonjour w sieci rozległej”) przez Tailscale:

1. Uruchom serwer DNS na hoście Gateway, dostępny przez Tailnet.
2. Opublikuj rekordy DNS-SD dla `_openclaw-gw._tcp` w dedykowanej strefie (przykład: `openclaw.internal.`).
3. Skonfiguruj **split DNS** w Tailscale, aby wybrana domena była rozwiązywana dla klientów, w tym iOS, za pośrednictwem tego serwera DNS.

Powyższa domena `openclaw.internal.` jest tylko przykładem — OpenClaw obsługuje dowolną domenę wykrywania. Node iOS/Android przeglądają zarówno `local.`, jak i skonfigurowaną domenę sieci rozległej.

### Konfiguracja Gateway

```json5
{
  gateway: { bind: "tailnet" }, // tylko Tailnet (zalecane)
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

`discovery.wideArea.domain` akceptuje również zmienną środowiskową `OPENCLAW_WIDE_AREA_DOMAIN` jako wartość zapasową, gdy nie jest ustawiona.

### Jednorazowa konfiguracja serwera DNS (host Gateway, tylko macOS)

```bash
openclaw dns setup --apply
```

To polecenie działa tylko w systemie macOS i wymaga Homebrew oraz aktywnego połączenia Tailscale. Instaluje CoreDNS (`brew install coredns`) i konfiguruje go tak, aby:

- nasłuchiwał na porcie 53 wyłącznie na interfejsach Tailscale hosta Gateway
- obsługiwał wybraną domenę (przykład: `openclaw.internal.`) z `~/.openclaw/dns/<domain>.db`

Najpierw uruchom bez `--apply`, aby wyświetlić plan (domenę, ścieżkę pliku strefy, wykryty adres IP Tailnet i zalecaną konfigurację) bez instalowania czegokolwiek.

Sprawdź z maszyny połączonej z Tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Ustawienia DNS Tailscale

W konsoli administracyjnej Tailscale:

- Dodaj serwer nazw wskazujący adres IP Tailnet hosta Gateway (UDP/TCP 53).
- Dodaj split DNS, aby domena wykrywania używała tego serwera nazw.

Gdy klienci zaakceptują DNS Tailnet, Node iOS oraz wykrywanie przez CLI mogą przeglądać `_openclaw-gw._tcp` w domenie wykrywania bez multiemisji.

### Bezpieczeństwo nasłuchiwania Gateway

Port WS Gateway (domyślnie `18789`) jest domyślnie powiązany z interfejsem pętli zwrotnej. Aby uzyskać dostęp przez LAN/Tailnet, należy jawnie skonfigurować powiązanie i pozostawić uwierzytelnianie włączone. W konfiguracjach działających wyłącznie przez Tailnet ustaw `gateway.bind: "tailnet"` w `~/.openclaw/openclaw.json` i uruchom ponownie Gateway (lub aplikację macOS na pasku menu).

## Co jest rozgłaszane

Tylko Gateway rozgłasza `_openclaw-gw._tcp`. Rozgłaszanie multiemisji w sieci LAN pochodzi z dołączonego Pluginu `bonjour`, gdy jest włączony; publikowanie DNS-SD w sieci rozległej pozostaje własnością Gateway.

## Typy usług

- `_openclaw-gw._tcp` — sygnał transportowy Gateway używany przez Node macOS/iOS/Android.

## Klucze TXT (niejawne wskazówki)

| Klucz                           | Kiedy występuje                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `role=gateway`                | Zawsze.                                                                        |
| `displayName=<friendly name>` | Zawsze.                                                                        |
| `lanHost=<hostname>.local`    | Zawsze.                                                                        |
| `gatewayPort=<port>`          | Zawsze (WS + HTTP Gateway).                                                    |
| `transport=gateway`           | Zawsze.                                                                        |
| `gatewayTls=1`                | Tylko gdy TLS jest włączony.                                                      |
| `gatewayTlsSha256=<sha256>`   | Tylko gdy TLS jest włączony i dostępny jest odcisk.                       |
| `gatewayDirectReachable=1`    | Tylko gdy Gateway jest osiągalny bezpośrednio (nie wyłącznie przez ścieżkę przekaźnika/proxy). |
| `canvasPort=<port>`           | Tylko gdy host obszaru roboczego jest włączony; obecnie ma tę samą wartość co `gatewayPort`.     |
| `tailnetDns=<magicdns>`       | Tylko pełny tryb mDNS; opcjonalna wskazówka, gdy Tailnet jest dostępny.                  |
| `sshPort=<port>`              | Tylko tryb pełny; pomijany w trybach minimalnym i wyłączonym.                              |
| `cliPath=<path>`              | Tylko tryb pełny; pomijany w trybach minimalnym i wyłączonym.                              |

Uwagi dotyczące bezpieczeństwa:

- Rekordy TXT Bonjour/mDNS są **nieuwierzytelnione**. Klienci nie mogą traktować TXT jako autorytatywnego źródła routingu.
- Klienci powinni wyznaczać trasę przy użyciu rozwiązanego punktu końcowego usługi (SRV + A/AAAA). Traktuj `lanHost`, `tailnetDns`, `gatewayPort` i `gatewayTlsSha256` wyłącznie jako wskazówki.
- Automatyczny wybór celu SSH powinien podobnie używać rozwiązanego hosta usługi, a nie wskazówek pochodzących wyłącznie z TXT.
- Przypinanie TLS nigdy nie może pozwalać, aby rozgłaszany `gatewayTlsSha256` zastąpił wcześniej zapisane przypięcie.
- Node iOS/Android powinny traktować bezpośrednie połączenia oparte na wykrywaniu jako działające **wyłącznie przez TLS** oraz wymagać wyraźnego potwierdzenia przed zaufaniem odciskowi po raz pierwszy.

## Debugowanie w systemie macOS

Wbudowane narzędzia:

```bash
# Przeglądanie instancji
dns-sd -B _openclaw-gw._tcp local.

# Rozwiązywanie jednej instancji (zastąp <instance>)
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

Jeśli przeglądanie działa, ale rozwiązywanie kończy się niepowodzeniem, zwykle przyczyną jest polityka sieci LAN lub problem z mechanizmem rozwiązywania mDNS.

## Debugowanie w dziennikach Gateway

Gateway zapisuje rotacyjny plik dziennika (wyświetlany podczas uruchamiania jako `gateway log file: ...`). Poszukaj wierszy `bonjour:`, zwłaszcza:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao netmask assertion ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`

OpenClaw uruchamia każdą usługę Bonjour jeden raz, a sondowanie, ponawianie prób, rozwiązywanie konfliktów nazw i ponowne publikowanie po zmianie interfejsu pozostawia mechanizmowi odpowiedzi mDNS. Pozwala to uniknąć nakładających się prób publikowania podczas zwykłych zmian stanu sieci. Powtarzające się wewnętrzne komunikaty samoczynnego sondowania są pomijane, aby nie mogły zapełnić dziennika Gateway.

Gdy wiele Gateway OpenClaw rozgłasza się z tego samego hosta, Bonjour może dodawać sufiksy, takie jak `(2)` lub `(3)`, aby zachować unikatowe nazwy instancji usług. Takie sufiksy są normalnym wynikiem rozwiązywania konfliktów i nie wskazują na zduplikowany nadzór OCM.

Bonjour używa systemowej nazwy hosta dla rozgłaszanego hosta `.local`, jeśli jest ona prawidłową etykietą DNS. Jeśli systemowa nazwa hosta zawiera spacje, podkreślenia lub inny znak niedozwolony w etykiecie DNS, OpenClaw używa zamiast niej `openclaw.local`. Ustaw `OPENCLAW_MDNS_HOSTNAME=<name>` przed uruchomieniem Gateway, gdy wymagana jest jawna etykieta hosta.

## Debugowanie w Node iOS

Node iOS używa `NWBrowser` do wykrywania `_openclaw-gw._tcp`.

Aby przechwycić dzienniki: Settings -> Gateway -> Advanced -> **Discovery Debug Logs**, następnie Settings -> Gateway -> Advanced -> **Discovery Logs** -> odtwórz problem -> **Copy**. Dziennik zawiera przejścia stanu przeglądarki i zmiany zestawu wyników.

## Kiedy włączyć Bonjour

Bonjour uruchamia się automatycznie przy uruchamianiu Gateway z pustą konfiguracją na hostach macOS, ponieważ lokalna aplikacja oraz pobliskie Node iOS/Android często korzystają z wykrywania w tej samej sieci LAN.

Włącz go jawnie, gdy automatyczne wykrywanie w tej samej sieci LAN jest przydatne w systemie Linux, Windows lub na innym hoście bez macOS:

```bash
openclaw plugins enable bonjour
```

Po włączeniu Bonjour używa `discovery.mdns.mode`, aby określić ilość publikowanych metadanych TXT; ten sam tryb steruje opcjonalnymi wskazówkami TXT w rekordach DNS-SD sieci rozległej. Tryby:

| Tryb                | Zachowanie                                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` (domyślny) | Tylko podstawowe klucze TXT; pomija `sshPort`, `cliPath`, `tailnetDns`.                                                                                                 |
| `full`              | Dodaje `sshPort`, `cliPath`, `tailnetDns` — użyj, gdy klienci potrzebują tych wskazówek.                                                                                  |
| `off`               | Pomija multiemisję w sieci LAN bez zmiany stanu włączenia Pluginu; DNS-SD sieci rozległej nadal może publikować minimalny sygnał, gdy `discovery.wideArea.enabled` ma wartość true. |

## Kiedy wyłączyć Bonjour

Pozostaw Bonjour wyłączony, gdy rozgłaszanie multiemisji w sieci LAN jest zbędne, niedostępne lub szkodliwe — częste przypadki to serwery bez macOS, sieć mostkowa Docker, WSL albo polityka sieciowa odrzucająca multiemisję mDNS. Gateway pozostaje osiągalny przez opublikowany adres URL, SSH, Tailnet lub DNS-SD sieci rozległej; zawodna staje się jedynie funkcja automatycznego wykrywania w sieci LAN.

Użyj nadpisania przez zmienną środowiskową w przypadku problemów dotyczących konkretnego wdrożenia (bezpieczne dla obrazów Docker, plików usług, skryptów uruchomieniowych i jednorazowego debugowania — znika wraz ze środowiskiem):

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Użyj konfiguracji Pluginu, gdy dołączony Plugin wykrywania w sieci LAN ma zostać celowo wyłączony dla danej konfiguracji OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Pułapki związane z Dockerem

Dołączony Plugin Bonjour automatycznie wyłącza rozgłaszanie multiemisji w sieci LAN w wykrytych kontenerach, gdy `OPENCLAW_DISABLE_BONJOUR` nie jest ustawiona. Sieci mostkowe Docker zwykle nie przekazują multiemisji mDNS (`224.0.0.251:5353`) między kontenerem a siecią LAN, dlatego rozgłaszanie z kontenera rzadko umożliwia działanie wykrywania.

Pułapki:

- Bonjour uruchamia się automatycznie na hostach macOS, a w innych środowiskach wymaga jawnego włączenia. Pozostawienie go wyłączonego nie zatrzymuje Gateway — pomija jedynie rozgłaszanie multiemisji w sieci LAN.
- Wyłączenie Bonjour nie zmienia `gateway.bind`; Docker nadal domyślnie używa `OPENCLAW_GATEWAY_BIND=lan`, dzięki czemu opublikowany port hosta działa.
- Wyłączenie Bonjour nie wyłącza DNS-SD sieci rozległej. Użyj wykrywania w sieci rozległej lub Tailnet, gdy Gateway i Node nie znajdują się w tej samej sieci LAN.
- Ponowne użycie tej samej `OPENCLAW_CONFIG_DIR` poza Dockerem nie zachowuje zasady automatycznego wyłączania z kontenera.
- Ustaw `OPENCLAW_DISABLE_BONJOUR=0` tylko w przypadku sieci hosta, macvlan lub innej sieci, w której multiemisja mDNS na pewno jest przekazywana; ustaw wartość `1`, aby wymusić wyłączenie.

## Rozwiązywanie problemów z wyłączonym Bonjour

Jeśli po skonfigurowaniu Dockera Node przestanie automatycznie wykrywać Gateway:

1. Sprawdź, czy Gateway działa w trybie automatycznym, wymuszonego włączenia czy wymuszonego wyłączenia:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Sprawdź, czy sam Gateway jest osiągalny przez opublikowany port:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Gdy Bonjour jest wyłączony, użyj bezpośredniego celu:
   - Interfejs sterowania lub narzędzia lokalne: `http://127.0.0.1:18789`
   - Klienci sieci LAN: `http://<gateway-host>:18789`
   - Klienci między sieciami: MagicDNS Tailnet, adres IP Tailnet, tunel SSH lub DNS-SD sieci rozległej

4. Jeśli Plugin Bonjour został celowo włączony w Dockerze, a rozgłaszanie wymuszono za pomocą `OPENCLAW_DISABLE_BONJOUR=0`, przetestuj multiemisję z hosta:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Jeśli przeglądanie nie zwraca wyników lub dzienniki Gateway wskazują powtarzające się błędy sondowania ciao, przywróć `OPENCLAW_DISABLE_BONJOUR=1` i użyj trasy bezpośredniej lub Tailnet.

## Typowe tryby awarii

- **Bonjour nie działa między sieciami**: użyj Tailnet lub SSH.
- **Multiemisja jest zablokowana**: niektóre sieci Wi-Fi wyłączają mDNS.
- **Moduł rozgłaszający utknął na sondowaniu/ogłaszaniu**: hosty z zablokowaną multiemisją, mosty kontenerów, WSL lub częste zmiany interfejsów mogą pozostawić responder w stanie bez ogłoszenia. Gateway pozostaje dostępny przez trasy bezpośrednie, SSH, Tailnet lub rozległego DNS-SD; gdy multiemisja jest niedostępna, wyłącz Bonjour w sieci LAN za pomocą `discovery.mdns.mode: "off"` lub `OPENCLAW_DISABLE_BONJOUR=1`.
- **Sieć mostkowa Docker**: Bonjour wyłącza się automatycznie w wykrytych kontenerach. Ustaw `OPENCLAW_DISABLE_BONJOUR=0` tylko dla sieci hosta, macvlan lub innej sieci obsługującej mDNS.
- **Uśpienie/częste zmiany interfejsów**: macOS może tymczasowo przestać zwracać wyniki mDNS; spróbuj ponownie.
- **Przeglądanie działa, ale rozpoznawanie kończy się niepowodzeniem**: używaj prostych nazw maszyn (unikaj emoji i znaków interpunkcyjnych), a następnie uruchom ponownie Gateway. Nazwa instancji usługi pochodzi od nazwy hosta, więc nadmiernie złożone nazwy mogą dezorientować niektóre resolvery.

## Nazwy instancji ze znakami ucieczki (`\032`)

Bonjour/DNS-SD często zapisuje bajty w nazwach instancji usług jako dziesiętne sekwencje `\DDD` (spacje stają się `\032`). Jest to normalne na poziomie protokołu; interfejsy użytkownika powinny je dekodować na potrzeby wyświetlania (iOS używa `BonjourEscapes.decode`).

## Włączanie / wyłączanie / konfiguracja

| Ustawienie                                              | Efekt                                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | Włącza dołączony Plugin wykrywania w sieci LAN na hostach, na których nie jest on domyślnie włączony. |
| `openclaw plugins disable bonjour`                   | Wyłącza rozgłaszanie multiemisji w sieci LAN przez wyłączenie dołączonego Pluginu.               |
| `OPENCLAW_DISABLE_BONJOUR=1` (lub `true`/`yes`/`on`)  | Wyłącza rozgłaszanie multiemisji w sieci LAN bez zmiany konfiguracji Pluginu.                |
| `OPENCLAW_DISABLE_BONJOUR=0` (lub `false`/`no`/`off`) | Wymusza włączenie rozgłaszania multiemisji w sieci LAN, również wewnątrz wykrytych kontenerów.        |
| `discovery.mdns.mode`                                | `off` \| `minimal` (domyślnie) \| `full` — zobacz tryby powyżej.                         |
| `gateway.bind`                                       | Steruje trybem powiązania Gateway w `~/.openclaw/openclaw.json`.                    |
| `OPENCLAW_SSH_PORT`                                  | Zastępuje port SSH, gdy rozgłaszane jest `sshPort` (tryb pełny).                  |
| `OPENCLAW_TAILNET_DNS`                               | Publikuje wskazówkę MagicDNS w rekordzie TXT, gdy włączony jest pełny tryb mDNS.                  |
| `OPENCLAW_CLI_PATH`                                  | Zastępuje rozgłaszaną ścieżkę CLI (tryb pełny).                                    |

Hosty macOS domyślnie automatycznie uruchamiają dołączony Plugin wykrywania w sieci LAN. Gdy Plugin Bonjour jest włączony, a `OPENCLAW_DISABLE_BONJOUR` nie jest ustawione, Bonjour rozgłasza się na zwykłych hostach i automatycznie wyłącza wewnątrz wykrytych kontenerów (Docker, maszyny Fly.io i popularne środowiska uruchomieniowe kontenerów).

## Powiązana dokumentacja

- Zasady wykrywania i wybór transportu: [Wykrywanie](/pl/gateway/discovery)
- Parowanie Node + zatwierdzenia: [Parowanie Gateway](/pl/gateway/pairing)
