---
read_when:
    - Debugowanie problemów z wykrywaniem Bonjour w systemach macOS/iOS
    - Zmiana typów usług mDNS, rekordów TXT lub UX wykrywania
summary: Wykrywanie Bonjour/mDNS i debugowanie (beacony Gateway, klienci i typowe tryby awarii)
title: Wykrywanie Bonjour
x-i18n:
    generated_at: "2026-05-06T09:11:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7b7d029e6eb6bee90eb96e7ea169ecadf3bda6d969b2450349c5716a950e205
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw może używać Bonjour (mDNS / DNS-SD), aby wykrywać aktywny Gateway (punkt końcowy WebSocket).
Przeglądanie multicast `local.` to **udogodnienie tylko dla sieci LAN**. Dołączony Plugin `bonjour`
jest właścicielem rozgłaszania w sieci LAN. Uruchamia się automatycznie na hostach macOS i jest opcjonalny na
Linux, Windows oraz w konteneryzowanych wdrożeniach Gateway. W przypadku wykrywania między sieciami ten sam
beacon może być także publikowany przez skonfigurowaną domenę wide-area DNS-SD. Wykrywanie
nadal działa na zasadzie best-effort i **nie** zastępuje łączności opartej na SSH ani Tailnet.

## Wide-area Bonjour (Unicast DNS-SD) przez Tailscale

Jeśli węzeł i Gateway znajdują się w różnych sieciach, multicast mDNS nie przekroczy
tej granicy. Możesz zachować ten sam UX wykrywania, przełączając się na **unicast DNS-SD**
(„Wide-Area Bonjour”) przez Tailscale.

Kroki ogólne:

1. Uruchom serwer DNS na hoście Gateway (osiągalny przez Tailnet).
2. Opublikuj rekordy DNS-SD dla `_openclaw-gw._tcp` w dedykowanej strefie
   (przykład: `openclaw.internal.`).
3. Skonfiguruj **split DNS** Tailscale, aby wybrana domena była rozwiązywana przez ten
   serwer DNS dla klientów (w tym iOS).

OpenClaw obsługuje dowolną domenę wykrywania; `openclaw.internal.` to tylko przykład.
Węzły iOS/Android przeglądają zarówno `local.`, jak i skonfigurowaną domenę wide-area.

### Konfiguracja Gateway (zalecane)

```json5
{
  gateway: { bind: "tailnet" }, // tylko tailnet (zalecane)
  discovery: { wideArea: { enabled: true } }, // włącza publikowanie wide-area DNS-SD
}
```

### Jednorazowa konfiguracja serwera DNS (host Gateway)

```bash
openclaw dns setup --apply
```

To instaluje CoreDNS i konfiguruje go tak, aby:

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

Gdy klienci zaakceptują DNS tailnet, węzły iOS i wykrywanie CLI mogą przeglądać
`_openclaw-gw._tcp` w Twojej domenie wykrywania bez multicast.

### Bezpieczeństwo listenera Gateway (zalecane)

Port WS Gateway (domyślnie `18789`) domyślnie wiąże się z loopback. Dla dostępu
LAN/tailnet ustaw wiązanie jawnie i pozostaw uwierzytelnianie włączone.

Dla konfiguracji wyłącznie tailnet:

- Ustaw `gateway.bind: "tailnet"` w `~/.openclaw/openclaw.json`.
- Zrestartuj Gateway (lub zrestartuj aplikację paska menu macOS).

## Co rozgłasza

Tylko Gateway rozgłasza `_openclaw-gw._tcp`. Rozgłaszanie multicast w LAN
zapewnia dołączony Plugin `bonjour`, gdy Plugin jest włączony; publikowanie
wide-area DNS-SD pozostaje własnością Gateway.

## Typy usług

- `_openclaw-gw._tcp` - beacon transportu Gateway (używany przez węzły macOS/iOS/Android).

## Klucze TXT (niesekretne wskazówki)

Gateway rozgłasza małe niesekretne wskazówki, aby ułatwić przepływy UI:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (tylko gdy TLS jest włączony)
- `gatewayTlsSha256=<sha256>` (tylko gdy TLS jest włączony i fingerprint jest dostępny)
- `canvasPort=<port>` (tylko gdy host canvas jest włączony; obecnie taki sam jak `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (tylko pełny tryb mDNS, opcjonalna wskazówka, gdy Tailnet jest dostępny)
- `sshPort=<port>` (tylko pełny tryb mDNS; wide-area DNS-SD może go pominąć)
- `cliPath=<path>` (tylko pełny tryb mDNS; wide-area DNS-SD nadal zapisuje go jako wskazówkę zdalnej instalacji)

Uwagi dotyczące bezpieczeństwa:

- Rekordy TXT Bonjour/mDNS są **nieuwierzytelnione**. Klienci nie mogą traktować TXT jako autorytatywnego źródła routingu.
- Klienci powinni routować przy użyciu rozwiązanego punktu końcowego usługi (SRV + A/AAAA). Traktuj `lanHost`, `tailnetDns`, `gatewayPort` i `gatewayTlsSha256` wyłącznie jako wskazówki.
- Automatyczne wybieranie celu SSH powinno podobnie używać rozwiązanego hosta usługi, a nie wskazówek wyłącznie z TXT.
- Przypinanie TLS nigdy nie może pozwolić, aby rozgłaszany `gatewayTlsSha256` nadpisał wcześniej zapisany pin.
- Węzły iOS/Android powinny traktować bezpośrednie połączenia oparte na wykrywaniu jako **tylko TLS** i wymagać wyraźnego potwierdzenia użytkownika przed zaufaniem fingerprintowi po raz pierwszy.

## Debugowanie na macOS

Przydatne wbudowane narzędzia:

- Przeglądanie instancji:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Rozwiązanie jednej instancji (zastąp `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Jeśli przeglądanie działa, ale rozwiązywanie się nie udaje, zwykle trafiasz na politykę LAN lub
problem resolvera mDNS.

## Debugowanie w logach Gateway

Gateway zapisuje rotacyjny plik dziennika (wypisywany przy starcie jako
`gateway log file: ...`). Szukaj linii `bonjour:`, zwłaszcza:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour używa nazwy hosta systemu dla rozgłaszanego hosta `.local`, gdy jest ona
prawidłową etykietą DNS. Jeśli nazwa hosta systemu zawiera spacje, podkreślenia lub inny
nieprawidłowy znak etykiety DNS, OpenClaw przełącza się na `openclaw.local`. Ustaw
`OPENCLAW_MDNS_HOSTNAME=<name>` przed uruchomieniem Gateway, gdy potrzebujesz
jawnej etykiety hosta.

## Debugowanie na węźle iOS

Węzeł iOS używa `NWBrowser` do wykrywania `_openclaw-gw._tcp`.

Aby przechwycić logi:

- Ustawienia → Gateway → Zaawansowane → **Logi debugowania wykrywania**
- Ustawienia → Gateway → Zaawansowane → **Logi wykrywania** → odtwórz → **Kopiuj**

Log zawiera przejścia stanów przeglądarki i zmiany zestawu wyników.

## Kiedy włączyć Bonjour

Bonjour uruchamia się automatycznie przy starcie Gateway z pustą konfiguracją na hostach macOS, ponieważ
aplikacja lokalna oraz pobliskie węzły iOS/Android często polegają na wykrywaniu w tej samej sieci LAN.

Włącz Bonjour jawnie, gdy automatyczne wykrywanie w tej samej sieci LAN jest przydatne na Linux,
Windows lub innym hoście innym niż macOS:

```bash
openclaw plugins enable bonjour
```

Gdy Bonjour jest włączony, używa `discovery.mdns.mode`, aby zdecydować, ile metadanych TXT
publikować. Tryb domyślny to `minimal`; używaj `full` tylko wtedy, gdy lokalni klienci potrzebują
wskazówek `cliPath` lub `sshPort`, a `off` użyj, aby wyciszyć multicast LAN bez
zmieniania włączenia Plugin.

## Kiedy wyłączyć Bonjour

Pozostaw Bonjour wyłączony, gdy rozgłaszanie multicast LAN jest niepotrzebne, niedostępne
lub szkodliwe. Typowe przypadki to serwery inne niż macOS, sieci mostkowane Docker,
WSL lub polityka sieciowa, która odrzuca multicast mDNS. W tych środowiskach
Gateway nadal jest osiągalny przez opublikowany URL, SSH, Tailnet lub wide-area
DNS-SD, ale automatyczne wykrywanie LAN nie jest niezawodne.

Preferuj istniejące nadpisanie środowiskowe, gdy problem dotyczy wdrożenia:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

To wyłącza rozgłaszanie multicast LAN bez zmieniania konfiguracji Plugin.
Jest bezpieczne dla obrazów Docker, plików usług, skryptów uruchomieniowych i jednorazowego
debugowania, ponieważ ustawienie znika razem ze środowiskiem.

Użyj konfiguracji Plugin, gdy celowo chcesz wyłączyć dołączony Plugin wykrywania LAN
dla tej konfiguracji OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Pułapki Docker

Dołączony Plugin Bonjour automatycznie wyłącza rozgłaszanie multicast LAN w wykrytych
kontenerach, gdy `OPENCLAW_DISABLE_BONJOUR` nie jest ustawione. Sieci mostkowane Docker
zwykle nie przekazują multicast mDNS (`224.0.0.251:5353`) między kontenerem
a LAN, więc rozgłaszanie z kontenera rzadko sprawia, że wykrywanie działa.

Ważne pułapki:

- Bonjour uruchamia się automatycznie na hostach macOS i jest opcjonalny gdzie indziej. Pozostawienie go
  wyłączonego nie zatrzymuje Gateway; pomija tylko rozgłaszanie multicast LAN.
- Wyłączenie Bonjour nie zmienia `gateway.bind`; Docker nadal domyślnie używa
  `OPENCLAW_GATEWAY_BIND=lan`, aby opublikowany port hosta mógł działać.
- Wyłączenie Bonjour nie wyłącza wide-area DNS-SD. Używaj wykrywania wide-area
  albo Tailnet, gdy Gateway i węzeł nie są w tej samej sieci LAN.
- Ponowne użycie tego samego `OPENCLAW_CONFIG_DIR` poza Docker nie utrwala
  polityki automatycznego wyłączenia kontenera.
- Ustaw `OPENCLAW_DISABLE_BONJOUR=0` tylko dla host networking, macvlan lub innej
  sieci, w której wiadomo, że multicast mDNS przechodzi; ustaw na `1`, aby wymusić wyłączenie.

## Rozwiązywanie problemów z wyłączonym Bonjour

Jeśli węzeł nie wykrywa już automatycznie Gateway po konfiguracji Docker:

1. Potwierdź, czy Gateway działa w trybie auto, wymuszonym włączeniu czy wymuszonym wyłączeniu:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Potwierdź, że sam Gateway jest osiągalny przez opublikowany port:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Użyj bezpośredniego celu, gdy Bonjour jest wyłączony:
   - Control UI lub lokalne narzędzia: `http://127.0.0.1:18789`
   - Klienci LAN: `http://<gateway-host>:18789`
   - Klienci między sieciami: Tailnet MagicDNS, IP Tailnet, tunel SSH lub
     wide-area DNS-SD

4. Jeśli celowo włączyłeś Plugin Bonjour w Docker i wymusiłeś rozgłaszanie
   przez `OPENCLAW_DISABLE_BONJOUR=0`, przetestuj multicast z hosta:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Jeśli przeglądanie jest puste albo logi Gateway pokazują powtarzające się anulowania
   watchdog ciao, przywróć `OPENCLAW_DISABLE_BONJOUR=1` i użyj trasy bezpośredniej lub
   Tailnet.

## Typowe tryby awarii

- **Bonjour nie przechodzi między sieciami**: użyj Tailnet lub SSH.
- **Multicast zablokowany**: niektóre sieci Wi-Fi wyłączają mDNS.
- **Advertiser utknął w probing/announcing**: hosty z zablokowanym multicast,
  mostki kontenerów, WSL lub zmiany interfejsów mogą pozostawić advertiser ciao w
  stanie nierozgłoszonym. OpenClaw ponawia próbę kilka razy, a następnie wyłącza Bonjour
  dla bieżącego procesu Gateway zamiast restartować advertiser bez końca.
- **Sieć mostkowana Docker**: Bonjour automatycznie wyłącza się w wykrytych kontenerach.
  Ustaw `OPENCLAW_DISABLE_BONJOUR=0` tylko dla hosta, macvlan lub innej
  sieci obsługującej mDNS.
- **Uśpienie / zmiany interfejsów**: macOS może tymczasowo gubić wyniki mDNS; spróbuj ponownie.
- **Przeglądanie działa, ale rozwiązywanie się nie udaje**: utrzymuj proste nazwy maszyn (unikaj emoji lub
  interpunkcji), a następnie zrestartuj Gateway. Nazwa instancji usługi pochodzi od
  nazwy hosta, więc zbyt złożone nazwy mogą dezorientować niektóre resolvery.

## Escapowane nazwy instancji (`\032`)

Bonjour/DNS-SD często escapuje bajty w nazwach instancji usług jako dziesiętne sekwencje
`\DDD` (np. spacje stają się `\032`).

- To normalne na poziomie protokołu.
- UI powinny dekodować do wyświetlania (iOS używa `BonjourEscapes.decode`).

## Włączanie / wyłączanie / konfiguracja

- Hosty macOS domyślnie automatycznie uruchamiają dołączony Plugin wykrywania LAN.
- `openclaw plugins enable bonjour` włącza dołączony Plugin wykrywania LAN na hostach, gdzie nie jest on domyślnie włączony.
- `openclaw plugins disable bonjour` wyłącza rozgłaszanie multicast LAN przez wyłączenie dołączonego Plugin.
- `OPENCLAW_DISABLE_BONJOUR=1` wyłącza rozgłaszanie multicast LAN bez zmieniania konfiguracji Plugin; akceptowane wartości prawdziwe to `1`, `true`, `yes` i `on` (starsze: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` wymusza włączenie rozgłaszania multicast LAN, także wewnątrz wykrytych kontenerów; akceptowane wartości fałszywe to `0`, `false`, `no` i `off`.
- Gdy Plugin Bonjour jest włączony i `OPENCLAW_DISABLE_BONJOUR` nie jest ustawione, Bonjour rozgłasza na zwykłych hostach i automatycznie wyłącza się wewnątrz wykrytych kontenerów.
- `gateway.bind` w `~/.openclaw/openclaw.json` kontroluje tryb wiązania Gateway.
- `OPENCLAW_SSH_PORT` nadpisuje port SSH, gdy `sshPort` jest rozgłaszany (starsze: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publikuje wskazówkę MagicDNS w TXT, gdy włączony jest pełny tryb mDNS (starsze: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` nadpisuje rozgłaszaną ścieżkę CLI (starsze: `OPENCLAW_CLI_PATH`).

## Powiązana dokumentacja

- Polityka wykrywania i wybór transportu: [Wykrywanie](/pl/gateway/discovery)
- Parowanie węzłów + zatwierdzenia: [Parowanie Gateway](/pl/gateway/pairing)
