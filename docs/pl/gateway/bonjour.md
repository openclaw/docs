---
read_when:
    - Debugowanie problemów z wykrywaniem Bonjour w systemach macOS/iOS
    - Zmiana typów usług mDNS, rekordów TXT lub doświadczenia użytkownika przy wykrywaniu
summary: Wykrywanie Bonjour/mDNS i debugowanie (sygnały rozgłoszeniowe Gateway, klienci i typowe tryby awarii)
title: Wykrywanie Bonjour
x-i18n:
    generated_at: "2026-05-11T20:29:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03bd9403591a389c06d3131e4c110d4ccf711eee56cbe9a5c9baed2b6df8fb80
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw może używać Bonjour (mDNS / DNS-SD) do wykrywania aktywnego Gateway (punktu końcowego WebSocket).
Przeglądanie multicast `local.` to **wygoda tylko w sieci LAN**. Dołączony Plugin `bonjour`
jest właścicielem ogłaszania w sieci LAN. Uruchamia się automatycznie na hostach macOS i jest opcjonalny w
Linuksie, Windows oraz konteneryzowanych wdrożeniach Gateway. Do wykrywania między sieciami ten sam
beacon może być również publikowany przez skonfigurowaną domenę DNS-SD sieci rozległej. Wykrywanie
nadal działa na zasadzie best-effort i **nie** zastępuje łączności przez SSH ani opartej na Tailnet.

## Bonjour dla sieci rozległych (unicast DNS-SD) przez Tailscale

Jeśli węzeł i Gateway są w różnych sieciach, multicast mDNS nie przejdzie przez
granicę. Możesz zachować ten sam UX wykrywania, przełączając się na **unicast DNS-SD**
(„Wide-Area Bonjour”) przez Tailscale.

Kroki ogólne:

1. Uruchom serwer DNS na hoście Gateway (osiągalnym przez Tailnet).
2. Opublikuj rekordy DNS-SD dla `_openclaw-gw._tcp` w dedykowanej strefie
   (przykład: `openclaw.internal.`).
3. Skonfiguruj **split DNS** Tailscale, aby wybrana domena była rozwiązywana przez ten
   serwer DNS dla klientów (w tym iOS).

OpenClaw obsługuje dowolną domenę wykrywania; `openclaw.internal.` to tylko przykład.
Węzły iOS/Android przeglądają zarówno `local.`, jak i skonfigurowaną domenę sieci rozległej.

### Konfiguracja Gateway (zalecane)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### Jednorazowa konfiguracja serwera DNS (host Gateway)

```bash
openclaw dns setup --apply
```

Instaluje to CoreDNS i konfiguruje go tak, aby:

- nasłuchiwał na porcie 53 tylko na interfejsach Tailscale Gateway
- obsługiwał wybraną domenę (przykład: `openclaw.internal.`) z `~/.openclaw/dns/<domain>.db`

Zweryfikuj z maszyny połączonej z tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Ustawienia DNS Tailscale

W konsoli administracyjnej Tailscale:

- Dodaj serwer nazw wskazujący na adres IP tailnet Gateway (UDP/TCP 53).
- Dodaj split DNS, aby domena wykrywania używała tego serwera nazw.

Gdy klienci zaakceptują DNS tailnet, węzły iOS oraz wykrywanie CLI mogą przeglądać
`_openclaw-gw._tcp` w domenie wykrywania bez multicast.

### Bezpieczeństwo nasłuchiwania Gateway (zalecane)

Port WS Gateway (domyślnie `18789`) domyślnie wiąże się z adresem loopback. Dla dostępu LAN/tailnet
jawnie ustaw wiązanie i pozostaw uwierzytelnianie włączone.

Dla konfiguracji tylko przez tailnet:

- Ustaw `gateway.bind: "tailnet"` w `~/.openclaw/openclaw.json`.
- Uruchom ponownie Gateway (albo uruchom ponownie aplikację paska menu macOS).

## Co ogłasza

Tylko Gateway ogłasza `_openclaw-gw._tcp`. Ogłaszanie multicast w sieci LAN jest
zapewniane przez dołączony Plugin `bonjour`, gdy Plugin jest włączony; publikowanie
DNS-SD dla sieci rozległych pozostaje własnością Gateway.

## Typy usług

- `_openclaw-gw._tcp` - beacon transportu Gateway (używany przez węzły macOS/iOS/Android).

## Klucze TXT (niejawne wskazówki)

Gateway ogłasza małe, niejawne wskazówki ułatwiające przepływy UI:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (tylko gdy TLS jest włączony)
- `gatewayTlsSha256=<sha256>` (tylko gdy TLS jest włączony i odcisk jest dostępny)
- `canvasPort=<port>` (tylko gdy host canvas jest włączony; obecnie taki sam jak `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (tylko pełny tryb mDNS, opcjonalna wskazówka, gdy Tailnet jest dostępny)
- `sshPort=<port>` (tylko pełny tryb mDNS; DNS-SD sieci rozległej może go pominąć)
- `cliPath=<path>` (tylko pełny tryb mDNS; DNS-SD sieci rozległej nadal zapisuje go jako wskazówkę zdalnej instalacji)

Uwagi dotyczące bezpieczeństwa:

- Rekordy TXT Bonjour/mDNS są **nieuwierzytelnione**. Klienci nie mogą traktować TXT jako autorytatywnego routingu.
- Klienci powinni wyznaczać trasę przy użyciu rozwiązanego punktu końcowego usługi (SRV + A/AAAA). Traktuj `lanHost`, `tailnetDns`, `gatewayPort` i `gatewayTlsSha256` wyłącznie jako wskazówki.
- Automatyczne wskazywanie celu SSH również powinno używać rozwiązanego hosta usługi, a nie wskazówek wyłącznie z TXT.
- Przypinanie TLS nie może nigdy pozwolić, aby ogłoszony `gatewayTlsSha256` nadpisał wcześniej zapisany pin.
- Węzły iOS/Android powinny traktować bezpośrednie połączenia oparte na wykrywaniu jako **tylko TLS** i wymagać jawnego potwierdzenia użytkownika przed zaufaniem odciskowi po raz pierwszy.

## Debugowanie na macOS

Przydatne wbudowane narzędzia:

- Przeglądaj instancje:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Rozwiąż jedną instancję (zastąp `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Jeśli przeglądanie działa, ale rozwiązywanie się nie udaje, zwykle trafiasz na politykę LAN albo
problem resolvera mDNS.

## Debugowanie w logach Gateway

Gateway zapisuje rotacyjny plik dziennika (wypisywany przy starcie jako
`gateway log file: ...`). Szukaj wierszy `bonjour:`, zwłaszcza:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Watchdog traktuje aktywne stany `probing`, `announcing` oraz świeże zmiany nazw po konflikcie jako
stany w toku. Jeśli usługa nigdy nie osiągnie stanu `announced`, OpenClaw ostatecznie
odtwarza ogłaszającego i po powtarzających się błędach wyłącza Bonjour dla tego
procesu Gateway zamiast ogłaszać ponownie bez końca.

Bonjour używa nazwy hosta systemu dla ogłaszanego hosta `.local`, gdy jest ona
prawidłową etykietą DNS. Jeśli nazwa hosta systemu zawiera spacje, podkreślenia albo inny
nieprawidłowy znak etykiety DNS, OpenClaw przełącza się na `openclaw.local`. Ustaw
`OPENCLAW_MDNS_HOSTNAME=<name>` przed uruchomieniem Gateway, gdy potrzebujesz
jawnej etykiety hosta.

## Debugowanie węzła iOS

Węzeł iOS używa `NWBrowser` do wykrywania `_openclaw-gw._tcp`.

Aby przechwycić logi:

- Ustawienia → Gateway → Zaawansowane → **Logi debugowania wykrywania**
- Ustawienia → Gateway → Zaawansowane → **Logi wykrywania** → odtwórz → **Kopiuj**

Log obejmuje przejścia stanu przeglądarki i zmiany zestawu wyników.

## Kiedy włączyć Bonjour

Bonjour uruchamia się automatycznie przy starcie Gateway z pustą konfiguracją na hostach macOS, ponieważ
lokalna aplikacja i pobliskie węzły iOS/Android często polegają na wykrywaniu w tej samej sieci LAN.

Włącz Bonjour jawnie, gdy automatyczne wykrywanie w tej samej sieci LAN jest przydatne w Linuksie,
Windows albo na innym hoście niebędącym macOS:

```bash
openclaw plugins enable bonjour
```

Gdy Bonjour jest włączony, używa `discovery.mdns.mode`, aby zdecydować, ile metadanych TXT
opublikować. Domyślnym trybem jest `minimal`; używaj `full` tylko wtedy, gdy lokalni klienci potrzebują
wskazówek `cliPath` lub `sshPort`, a `off`, aby wyciszyć multicast LAN bez
zmiany włączenia Plugin.

## Kiedy wyłączyć Bonjour

Pozostaw Bonjour wyłączony, gdy ogłaszanie multicast w sieci LAN jest niepotrzebne, niedostępne
albo szkodliwe. Typowe przypadki to serwery inne niż macOS, sieci mostkowane Docker,
WSL albo polityka sieciowa odrzucająca multicast mDNS. W tych środowiskach
Gateway nadal jest osiągalny przez opublikowany URL, SSH, Tailnet albo DNS-SD
sieci rozległej, ale automatyczne wykrywanie LAN nie jest niezawodne.

Preferuj istniejące nadpisanie środowiskowe, gdy problem dotyczy wdrożenia:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Wyłącza to ogłaszanie multicast w sieci LAN bez zmiany konfiguracji Plugin.
Jest bezpieczne dla obrazów Docker, plików usług, skryptów uruchamiających i jednorazowego
debugowania, ponieważ ustawienie znika razem ze środowiskiem.

Użyj konfiguracji Plugin, gdy celowo chcesz wyłączyć dołączony Plugin
wykrywania LAN dla tej konfiguracji OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Pułapki Dockera

Dołączony Plugin Bonjour automatycznie wyłącza ogłaszanie multicast w sieci LAN w wykrytych
kontenerach, gdy `OPENCLAW_DISABLE_BONJOUR` nie jest ustawione. Sieci mostkowane Docker
zwykle nie przekazują multicast mDNS (`224.0.0.251:5353`) między kontenerem
a siecią LAN, więc ogłaszanie z kontenera rzadko sprawia, że wykrywanie działa.

Ważne pułapki:

- Bonjour uruchamia się automatycznie na hostach macOS i jest opcjonalny gdzie indziej. Pozostawienie go
  wyłączonego nie zatrzymuje Gateway; pomija tylko ogłaszanie multicast w sieci LAN.
- Wyłączenie Bonjour nie zmienia `gateway.bind`; Docker nadal domyślnie używa
  `OPENCLAW_GATEWAY_BIND=lan`, aby opublikowany port hosta mógł działać.
- Wyłączenie Bonjour nie wyłącza DNS-SD sieci rozległej. Użyj wykrywania w sieci rozległej
  albo Tailnet, gdy Gateway i węzeł nie są w tej samej sieci LAN.
- Ponowne użycie tego samego `OPENCLAW_CONFIG_DIR` poza Dockerem nie utrwala
  polityki automatycznego wyłączania z kontenera.
- Ustaw `OPENCLAW_DISABLE_BONJOUR=0` tylko dla sieci hosta, macvlan albo innej
  sieci, w której wiadomo, że multicast mDNS przechodzi; ustaw na `1`, aby wymusić wyłączenie.

## Rozwiązywanie problemów z wyłączonym Bonjour

Jeśli węzeł przestaje automatycznie wykrywać Gateway po konfiguracji Dockera:

1. Potwierdź, czy Gateway działa w trybie automatycznym, wymuszonego włączenia czy wymuszonego wyłączenia:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Potwierdź, że sam Gateway jest osiągalny przez opublikowany port:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Użyj bezpośredniego celu, gdy Bonjour jest wyłączony:
   - UI sterowania lub narzędzia lokalne: `http://127.0.0.1:18789`
   - Klienci LAN: `http://<gateway-host>:18789`
   - Klienci między sieciami: Tailnet MagicDNS, adres IP Tailnet, tunel SSH albo
     DNS-SD sieci rozległej

4. Jeśli celowo włączyłeś Plugin Bonjour w Dockerze i wymusiłeś ogłaszanie
   przez `OPENCLAW_DISABLE_BONJOUR=0`, przetestuj multicast z hosta:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Jeśli przeglądanie jest puste albo logi Gateway pokazują powtarzające się anulowania
   watchdog ciao, przywróć `OPENCLAW_DISABLE_BONJOUR=1` i użyj trasy bezpośredniej albo
   Tailnet.

## Typowe tryby awarii

- **Bonjour nie przechodzi między sieciami**: użyj Tailnet albo SSH.
- **Multicast zablokowany**: niektóre sieci Wi-Fi wyłączają mDNS.
- **Ogłaszający utknął w probing/announcing**: hosty z zablokowanym multicast,
  mostki kontenerów, WSL albo zmiany interfejsów mogą pozostawić ogłaszającego ciao w
  stanie nieogłoszonym. OpenClaw ponawia próbę kilka razy, a następnie wyłącza Bonjour
  dla bieżącego procesu Gateway zamiast restartować ogłaszającego bez końca.
- **Sieć mostkowana Docker**: Bonjour automatycznie wyłącza się w wykrytych kontenerach.
  Ustaw `OPENCLAW_DISABLE_BONJOUR=0` tylko dla hosta, macvlan albo innej
  sieci obsługującej mDNS.
- **Uśpienie / zmiany interfejsów**: macOS może tymczasowo gubić wyniki mDNS; ponów próbę.
- **Przeglądanie działa, ale rozwiązywanie się nie udaje**: utrzymuj proste nazwy maszyn (unikaj emoji i
  interpunkcji), a następnie uruchom ponownie Gateway. Nazwa instancji usługi pochodzi od
  nazwy hosta, więc zbyt złożone nazwy mogą mylić niektóre resolvery.

## Escapowane nazwy instancji (`\032`)

Bonjour/DNS-SD często escapuje bajty w nazwach instancji usług jako dziesiętne sekwencje `\DDD`
(np. spacje stają się `\032`).

- Jest to normalne na poziomie protokołu.
- UI powinny dekodować do wyświetlania (iOS używa `BonjourEscapes.decode`).

## Włączanie / wyłączanie / konfiguracja

- Hosty macOS domyślnie automatycznie uruchamiają dołączony Plugin wykrywania w sieci LAN.
- `openclaw plugins enable bonjour` włącza dołączony Plugin wykrywania w sieci LAN na hostach, na których nie jest domyślnie włączony.
- `openclaw plugins disable bonjour` wyłącza rozgłaszanie multicast w sieci LAN przez wyłączenie dołączonego Plugin.
- `OPENCLAW_DISABLE_BONJOUR=1` wyłącza rozgłaszanie multicast w sieci LAN bez zmiany konfiguracji Plugin; akceptowane wartości traktowane jako prawda to `1`, `true`, `yes` i `on` (starsze: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` wymusza włączenie rozgłaszania multicast w sieci LAN, także wewnątrz wykrytych kontenerów; akceptowane wartości traktowane jako fałsz to `0`, `false`, `no` i `off`.
- Gdy Plugin Bonjour jest włączony, a `OPENCLAW_DISABLE_BONJOUR` nie jest ustawione, Bonjour rozgłasza na zwykłych hostach i automatycznie wyłącza się wewnątrz wykrytych kontenerów.
- `gateway.bind` w `~/.openclaw/openclaw.json` kontroluje tryb powiązania Gateway.
- `OPENCLAW_SSH_PORT` zastępuje port SSH, gdy rozgłaszany jest `sshPort` (starsze: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publikuje wskazówkę MagicDNS w TXT, gdy włączony jest pełny tryb mDNS (starsze: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` zastępuje rozgłaszaną ścieżkę CLI (starsze: `OPENCLAW_CLI_PATH`).

## Powiązana dokumentacja

- Zasady wykrywania i wybór transportu: [Wykrywanie](/pl/gateway/discovery)
- Parowanie Node i zatwierdzenia: [Parowanie Gateway](/pl/gateway/pairing)
