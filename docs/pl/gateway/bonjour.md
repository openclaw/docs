---
read_when:
    - Rozwiązywanie problemów z wykrywaniem Bonjour w systemach macOS/iOS
    - Zmiana typów usług mDNS, rekordów TXT lub interfejsu wykrywania
summary: Wykrywanie i debugowanie Bonjour/mDNS (sygnały nawigacyjne Gateway, klienty i typowe tryby awarii)
title: Wykrywanie Bonjour
x-i18n:
    generated_at: "2026-07-12T15:02:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0526c9e20dd02d143ae7aa4c8e1e6830763763e95c9a74c4d73332c5e5e155e
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw może używać Bonjour (mDNS/DNS-SD) do wykrywania aktywnego Gateway (punktu końcowego WebSocket). Przeglądanie multiemisji `local.` jest **udogodnieniem działającym wyłącznie w sieci LAN**: dołączony Plugin `bonjour` odpowiada za rozgłaszanie w sieci LAN, uruchamiając się automatycznie na hostach macOS, a na systemach Linux, Windows i we wdrożeniach Gateway w kontenerach wymaga jawnego włączenia. Ten sam sygnał może być również publikowany za pośrednictwem skonfigurowanej domeny DNS-SD sieci rozległej, aby umożliwić wykrywanie między sieciami. Wykrywanie działa na zasadzie najlepszej dostępnej możliwości i **nie** zastępuje łączności opartej na SSH ani Tailnet.

## Bonjour w sieci rozległej (DNS-SD unicast) przez Tailscale

Jeśli Node i Gateway znajdują się w różnych sieciach, multiemisja mDNS nie może przekroczyć ich granicy. Zachowaj ten sam sposób wykrywania, przełączając się na **DNS-SD unicast** („Bonjour sieci rozległej”) przez Tailscale:

1. Uruchom serwer DNS na hoście Gateway, dostępny przez Tailnet.
2. Opublikuj rekordy DNS-SD dla `_openclaw-gw._tcp` w dedykowanej strefie (przykład: `openclaw.internal.`).
3. Skonfiguruj w Tailscale **dzielony DNS**, aby wybrana domena była rozwiązywana dla klientów, w tym iOS, przez ten serwer DNS.

Powyższa domena `openclaw.internal.` jest tylko przykładem — OpenClaw obsługuje dowolną domenę wykrywania. Węzły iOS/Android przeglądają zarówno domenę `local.`, jak i skonfigurowaną domenę sieci rozległej.

### Konfiguracja Gateway

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

Gdy `discovery.wideArea.domain` nie jest ustawione, jako wartość zapasową można również podać zmienną środowiskową `OPENCLAW_WIDE_AREA_DOMAIN`.

### Jednorazowa konfiguracja serwera DNS (host Gateway, tylko macOS)

```bash
openclaw dns setup --apply
```

To polecenie działa tylko w systemie macOS i wymaga Homebrew oraz aktywnego połączenia Tailscale. Instaluje CoreDNS (`brew install coredns`) i konfiguruje go tak, aby:

- nasłuchiwał na porcie 53 wyłącznie na interfejsach Tailscale hosta Gateway
- obsługiwał wybraną domenę (przykład: `openclaw.internal.`) z pliku `~/.openclaw/dns/<domain>.db`

Najpierw uruchom polecenie bez `--apply`, aby wyświetlić podgląd planu (domenę, ścieżkę pliku strefy, wykryty adres IP Tailnet i zalecaną konfigurację) bez instalowania czegokolwiek.

Sprawdź działanie z komputera połączonego z Tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Ustawienia DNS Tailscale

W konsoli administracyjnej Tailscale:

- Dodaj serwer nazw wskazujący adres IP Tailnet hosta Gateway (UDP/TCP 53).
- Dodaj dzielony DNS, aby domena wykrywania korzystała z tego serwera nazw.

Gdy klienci zaakceptują DNS Tailnet, węzły iOS oraz mechanizm wykrywania CLI mogą przeglądać `_openclaw-gw._tcp` w domenie wykrywania bez multiemisji.

### Bezpieczeństwo nasłuchiwania Gateway

Port WS Gateway (domyślnie `18789`) jest domyślnie wiązany z interfejsem local loopback. Aby uzyskać dostęp przez LAN/Tailnet, jawnie skonfiguruj wiązanie i pozostaw uwierzytelnianie włączone. W konfiguracjach używających wyłącznie Tailnet ustaw `gateway.bind: "tailnet"` w pliku `~/.openclaw/openclaw.json` i ponownie uruchom Gateway (lub aplikację paska menu macOS).

## Co jest rozgłaszane

Tylko Gateway rozgłasza `_openclaw-gw._tcp`. Za rozgłaszanie multiemisji w sieci LAN odpowiada dołączony Plugin `bonjour`, gdy jest włączony; publikowanie DNS-SD w sieci rozległej pozostaje zadaniem Gateway.

## Typy usług

- `_openclaw-gw._tcp` — sygnał transportowy Gateway używany przez węzły macOS/iOS/Android.

## Klucze TXT (wskazówki niezawierające danych poufnych)

| Klucz                         | Kiedy występuje                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| `role=gateway`                | Zawsze.                                                                                                 |
| `displayName=<friendly name>` | Zawsze.                                                                                                 |
| `lanHost=<hostname>.local`    | Zawsze.                                                                                                 |
| `gatewayPort=<port>`          | Zawsze (WS + HTTP Gateway).                                                                              |
| `transport=gateway`           | Zawsze.                                                                                                 |
| `gatewayTls=1`                | Tylko gdy TLS jest włączony.                                                                             |
| `gatewayTlsSha256=<sha256>`   | Tylko gdy TLS jest włączony i dostępny jest odcisk.                                                      |
| `gatewayDirectReachable=1`    | Tylko gdy Gateway jest dostępny bezpośrednio (a nie wyłącznie przez ścieżkę przekaźnika/serwera proxy). |
| `canvasPort=<port>`           | Tylko gdy host obszaru roboczego jest włączony; obecnie jest taki sam jak `gatewayPort`.                 |
| `tailnetDns=<magicdns>`       | Tylko w pełnym trybie mDNS; opcjonalna wskazówka, gdy Tailnet jest dostępny.                             |
| `sshPort=<port>`              | Tylko w pełnym trybie; pomijany w trybach minimalnym i wyłączonym.                                      |
| `cliPath=<path>`              | Tylko w pełnym trybie; pomijany w trybach minimalnym i wyłączonym.                                      |

Uwagi dotyczące bezpieczeństwa:

- Rekordy TXT Bonjour/mDNS **nie są uwierzytelniane**. Klienci nie mogą traktować rekordów TXT jako wiarygodnego źródła informacji o routingu.
- Klienci powinni wyznaczać trasę przy użyciu rozwiązanego punktu końcowego usługi (SRV + A/AAAA). Wartości `lanHost`, `tailnetDns`, `gatewayPort` i `gatewayTlsSha256` należy traktować wyłącznie jako wskazówki.
- Automatyczne wybieranie celu SSH powinno analogicznie używać rozwiązanego hosta usługi, a nie wskazówek pochodzących wyłącznie z TXT.
- Przypinanie TLS nigdy nie może pozwalać, aby rozgłaszana wartość `gatewayTlsSha256` zastąpiła wcześniej zapisane przypięcie.
- Węzły iOS/Android powinny traktować bezpośrednie połączenia oparte na wykrywaniu jako obsługujące **wyłącznie TLS** i wymagać wyraźnego potwierdzenia użytkownika przed zaufaniem odciskowi widzianemu po raz pierwszy.

## Debugowanie w systemie macOS

Wbudowane narzędzia:

```bash
# Browse instances
dns-sd -B _openclaw-gw._tcp local.

# Resolve one instance (replace <instance>)
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

Jeśli przeglądanie działa, ale rozwiązywanie kończy się niepowodzeniem, zwykle przyczyną jest polityka sieci LAN lub problem z mechanizmem rozwiązywania mDNS.

## Debugowanie w dziennikach Gateway

Gateway zapisuje rotacyjny plik dziennika (wyświetlany podczas uruchamiania jako `gateway log file: ...`). Szukaj wierszy `bonjour:`, zwłaszcza:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Mechanizm nadzorujący traktuje aktywne stany `probing`, `announcing` oraz niedawne zmiany nazw po konfliktach jako operacje w toku. Jeśli usługa nigdy nie osiągnie stanu `announced`, OpenClaw ponownie tworzy mechanizm rozgłaszający, a po kolejnych niepowodzeniach wyłącza Bonjour dla danego procesu Gateway, zamiast bez końca ponawiać rozgłaszanie.

Bonjour używa systemowej nazwy hosta dla rozgłaszanego hosta `.local`, jeśli jest ona prawidłową etykietą DNS. Jeśli systemowa nazwa hosta zawiera spacje, podkreślenia lub inny znak niedozwolony w etykiecie DNS, OpenClaw używa wartości zapasowej `openclaw.local`. Jeśli potrzebujesz jawnie określonej etykiety hosta, ustaw `OPENCLAW_MDNS_HOSTNAME=<name>` przed uruchomieniem Gateway.

## Debugowanie w węźle iOS

Węzeł iOS używa `NWBrowser` do wykrywania `_openclaw-gw._tcp`.

Aby przechwycić dzienniki: Ustawienia -> Gateway -> Zaawansowane -> **Dzienniki debugowania wykrywania**, następnie Ustawienia -> Gateway -> Zaawansowane -> **Dzienniki wykrywania** -> odtwórz problem -> **Kopiuj**. Dziennik zawiera zmiany stanów przeglądarki i zestawu wyników.

## Kiedy włączyć Bonjour

Bonjour uruchamia się automatycznie przy uruchamianiu Gateway z pustą konfiguracją na hostach macOS, ponieważ lokalna aplikacja oraz pobliskie węzły iOS/Android często korzystają z wykrywania w tej samej sieci LAN.

Włącz go jawnie, gdy automatyczne wykrywanie w tej samej sieci LAN jest przydatne w systemie Linux, Windows lub na innym hoście bez macOS:

```bash
openclaw plugins enable bonjour
```

Gdy Bonjour jest włączony, używa `discovery.mdns.mode` do określenia ilości publikowanych metadanych TXT; ten sam tryb steruje opcjonalnymi wskazówkami TXT w rekordach DNS-SD sieci rozległej. Tryby:

| Tryb                | Działanie                                                                                                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` (domyślny) | Tylko podstawowe klucze TXT; pomija `sshPort`, `cliPath`, `tailnetDns`.                                                                                                                                   |
| `full`              | Dodaje `sshPort`, `cliPath`, `tailnetDns` — używaj, gdy klienci potrzebują tych wskazówek.                                                                                                                |
| `off`               | Wyłącza multiemisję w sieci LAN bez zmiany stanu włączenia Pluginu; DNS-SD sieci rozległej nadal może publikować minimalny sygnał, gdy `discovery.wideArea.enabled` ma wartość `true`.                       |

## Kiedy wyłączyć Bonjour

Pozostaw Bonjour wyłączony, gdy rozgłaszanie multiemisji w sieci LAN jest zbędne, niedostępne lub szkodliwe — typowe przypadki to serwery bez macOS, sieci mostkowe Docker, WSL lub polityka sieciowa odrzucająca multiemisję mDNS. Gateway pozostaje dostępny przez opublikowany adres URL, SSH, Tailnet lub DNS-SD sieci rozległej; zawodny jest jedynie mechanizm automatycznego wykrywania w sieci LAN.

Użyj zmiennej środowiskowej, gdy problem dotyczy konkretnego wdrożenia (jest to bezpieczne dla obrazów Docker, plików usług, skryptów uruchamiających i jednorazowego debugowania — ustawienie znika wraz ze środowiskiem):

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Użyj konfiguracji Pluginu, gdy celowo chcesz wyłączyć dołączony Plugin wykrywania w sieci LAN dla danej konfiguracji OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Pułapki związane z Docker

Dołączony Plugin Bonjour automatycznie wyłącza rozgłaszanie multiemisji w sieci LAN w wykrytych kontenerach, gdy `OPENCLAW_DISABLE_BONJOUR` nie jest ustawione. Sieci mostkowe Docker zwykle nie przekazują multiemisji mDNS (`224.0.0.251:5353`) między kontenerem a siecią LAN, dlatego rozgłaszanie z kontenera rzadko umożliwia działanie wykrywania.

Pułapki:

- Bonjour uruchamia się automatycznie na hostach macOS, a w innych systemach wymaga jawnego włączenia. Pozostawienie go wyłączonego nie zatrzymuje Gateway — pomija jedynie rozgłaszanie multiemisji w sieci LAN.
- Wyłączenie Bonjour nie zmienia `gateway.bind`; Docker nadal domyślnie używa `OPENCLAW_GATEWAY_BIND=lan`, dzięki czemu opublikowany port hosta działa.
- Wyłączenie Bonjour nie wyłącza DNS-SD sieci rozległej. Gdy Gateway i Node nie znajdują się w tej samej sieci LAN, użyj wykrywania w sieci rozległej lub Tailnet.
- Ponowne użycie tego samego `OPENCLAW_CONFIG_DIR` poza Docker nie utrwala zasad automatycznego wyłączania stosowanych w kontenerze.
- Ustaw `OPENCLAW_DISABLE_BONJOUR=0` tylko dla sieci hosta, macvlan lub innej sieci, o której wiadomo, że przepuszcza multiemisję mDNS; ustaw wartość `1`, aby wymusić wyłączenie.

## Rozwiązywanie problemów z wyłączonym Bonjour

Jeśli po skonfigurowaniu Docker Node przestanie automatycznie wykrywać Gateway:

1. Sprawdź, czy Gateway działa w trybie automatycznym, wymuszonego włączenia czy wymuszonego wyłączenia:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Sprawdź, czy sam Gateway jest dostępny przez opublikowany port:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Gdy Bonjour jest wyłączony, użyj bezpośredniego celu:
   - Interfejs sterowania lub narzędzia lokalne: `http://127.0.0.1:18789`
   - Klienci LAN: `http://<gateway-host>:18789`
   - Klienci w innych sieciach: MagicDNS Tailnet, adres IP Tailnet, tunel SSH lub DNS-SD sieci rozległej

4. Jeśli celowo włączono Plugin Bonjour w Docker i wymuszono rozgłaszanie za pomocą `OPENCLAW_DISABLE_BONJOUR=0`, przetestuj multiemisję z hosta:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Jeśli przeglądanie nie zwraca wyników lub dzienniki Gateway pokazują powtarzające się anulowania mechanizmu nadzorującego ciao, przywróć `OPENCLAW_DISABLE_BONJOUR=1` i użyj trasy bezpośredniej lub Tailnet.

## Typowe tryby awarii

- **Bonjour nie działa między sieciami**: użyj Tailnetu lub SSH.
- **Multiemisja jest zablokowana**: niektóre sieci Wi-Fi wyłączają mDNS.
- **Moduł rozgłaszający utknął w fazie sondowania/ogłaszania**: hosty z zablokowaną multiemisją, mosty kontenerów, WSL lub częste zmiany interfejsów mogą pozostawić moduł rozgłaszający ciao w stanie bez ogłoszenia. OpenClaw ponawia próbę kilka razy, a następnie wyłącza Bonjour dla bieżącego procesu Gateway, zamiast bez końca ponownie uruchamiać moduł rozgłaszający.
- **Sieć mostkowa Dockera**: Bonjour jest automatycznie wyłączany w wykrytych kontenerach. Ustaw `OPENCLAW_DISABLE_BONJOUR=0` tylko dla sieci hosta, macvlan lub innej sieci obsługującej mDNS.
- **Uśpienie/zmiany interfejsów**: macOS może tymczasowo przestać zwracać wyniki mDNS; ponów próbę.
- **Przeglądanie działa, ale rozpoznawanie nie**: używaj prostych nazw komputerów (unikaj emoji i znaków interpunkcyjnych), a następnie uruchom ponownie Gateway. Nazwa instancji usługi pochodzi od nazwy hosta, dlatego zbyt złożone nazwy mogą sprawiać problemy niektórym mechanizmom rozpoznawania.

## Nazwy instancji ze znakami ucieczki (`\032`)

Bonjour/DNS-SD często zapisuje bajty w nazwach instancji usług jako dziesiętne sekwencje `\DDD` (spacje stają się `\032`). Jest to normalne na poziomie protokołu; interfejsy użytkownika powinny je dekodować na potrzeby wyświetlania (iOS używa `BonjourEscapes.decode`).

## Włączanie / wyłączanie / konfiguracja

| Ustawienie                                           | Efekt                                                                                                      |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | Włącza dołączony Plugin wykrywania w sieci LAN na hostach, na których nie jest domyślnie włączony.         |
| `openclaw plugins disable bonjour`                   | Wyłącza rozgłaszanie multiemisji w sieci LAN przez wyłączenie dołączonego Pluginu.                         |
| `OPENCLAW_DISABLE_BONJOUR=1` (lub `true`/`yes`/`on`) | Wyłącza rozgłaszanie multiemisji w sieci LAN bez zmiany konfiguracji Pluginu.                              |
| `OPENCLAW_DISABLE_BONJOUR=0` (lub `false`/`no`/`off`)| Wymusza rozgłaszanie multiemisji w sieci LAN, również wewnątrz wykrytych kontenerów.                       |
| `discovery.mdns.mode`                                | `off` \| `minimal` (domyślnie) \| `full` — zobacz tryby powyżej.                                           |
| `gateway.bind`                                       | Określa tryb powiązania Gateway w `~/.openclaw/openclaw.json`.                                            |
| `OPENCLAW_SSH_PORT`                                  | Zastępuje port SSH, gdy rozgłaszany jest `sshPort` (tryb pełny).                                           |
| `OPENCLAW_TAILNET_DNS`                               | Publikuje wskazówkę MagicDNS w rekordzie TXT, gdy włączony jest pełny tryb mDNS.                           |
| `OPENCLAW_CLI_PATH`                                  | Zastępuje rozgłaszaną ścieżkę CLI (tryb pełny).                                                            |

Hosty z systemem macOS domyślnie automatycznie uruchamiają dołączony Plugin wykrywania w sieci LAN. Gdy Plugin Bonjour jest włączony, a zmienna `OPENCLAW_DISABLE_BONJOUR` nie jest ustawiona, Bonjour rozgłasza usługi na zwykłych hostach i automatycznie wyłącza się wewnątrz wykrytych kontenerów (Docker, maszyny Fly.io i popularne środowiska uruchomieniowe kontenerów).

## Powiązana dokumentacja

- Zasady wykrywania i wybór transportu: [Wykrywanie](/pl/gateway/discovery)
- Parowanie Node + zatwierdzenia: [Parowanie Gateway](/pl/gateway/pairing)
