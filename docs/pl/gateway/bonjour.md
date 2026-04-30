---
read_when:
    - Debugowanie problemów z wykrywaniem Bonjour w systemach macOS/iOS
    - Zmiana typów usług mDNS, rekordów TXT lub UX wykrywania
summary: Wykrywanie i debugowanie Bonjour/mDNS (rozgłoszenia Gateway, klienci i typowe tryby awarii)
title: Wykrywanie Bonjour
x-i18n:
    generated_at: "2026-04-30T09:51:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0720451843aae0509949324e51f3a23dc69e366e68de851c595ce76c8ab0eec9
    source_path: gateway/bonjour.md
    workflow: 16
---

# Wykrywanie Bonjour / mDNS

OpenClaw używa Bonjour (mDNS / DNS‑SD), aby wykryć aktywny Gateway (punkt końcowy WebSocket).
Przeglądanie multicast `local.` to **udogodnienie wyłącznie w sieci LAN**. Dołączony Plugin `bonjour`
odpowiada za rozgłaszanie w sieci LAN i jest domyślnie włączony. Do wykrywania między sieciami
ten sam sygnał beacon można również opublikować przez skonfigurowaną domenę wide-area DNS-SD.
Wykrywanie nadal działa na zasadzie najlepszych starań i **nie** zastępuje łączności opartej na SSH ani Tailnet.

## Wide-area Bonjour (Unicast DNS-SD) przez Tailscale

Jeśli węzeł i gateway znajdują się w różnych sieciach, multicast mDNS nie przekroczy
granicy. Możesz zachować ten sam UX wykrywania, przełączając się na **unicast DNS‑SD**
("Wide‑Area Bonjour") przez Tailscale.

Kroki ogólne:

1. Uruchom serwer DNS na hoście gatewaya (osiągalny przez Tailnet).
2. Opublikuj rekordy DNS‑SD dla `_openclaw-gw._tcp` w dedykowanej strefie
   (przykład: `openclaw.internal.`).
3. Skonfiguruj **split DNS** Tailscale tak, aby wybrana domena była rozwiązywana przez ten
   serwer DNS dla klientów (w tym iOS).

OpenClaw obsługuje dowolną domenę wykrywania; `openclaw.internal.` to tylko przykład.
Węzły iOS/Android przeglądają zarówno `local.`, jak i skonfigurowaną domenę wide‑area.

### Konfiguracja Gatewaya (zalecana)

```json5
{
  gateway: { bind: "tailnet" }, // tylko tailnet (zalecane)
  discovery: { wideArea: { enabled: true } }, // włącza publikowanie wide-area DNS-SD
}
```

### Jednorazowa konfiguracja serwera DNS (host gatewaya)

```bash
openclaw dns setup --apply
```

Instaluje to CoreDNS i konfiguruje go tak, aby:

- nasłuchiwał na porcie 53 tylko na interfejsach Tailscale gatewaya
- obsługiwał wybraną domenę (przykład: `openclaw.internal.`) z `~/.openclaw/dns/<domain>.db`

Zweryfikuj z maszyny połączonej z tailnetem:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Ustawienia DNS Tailscale

W konsoli administracyjnej Tailscale:

- Dodaj nameserver wskazujący na adres IP gatewaya w tailnecie (UDP/TCP 53).
- Dodaj split DNS, aby domena wykrywania używała tego nameservera.

Gdy klienci zaakceptują DNS tailnetu, węzły iOS i wykrywanie CLI mogą przeglądać
`_openclaw-gw._tcp` w domenie wykrywania bez multicastu.

### Bezpieczeństwo nasłuchiwania Gatewaya (zalecane)

Port WS Gatewaya (domyślnie `18789`) domyślnie wiąże się z loopback. Dla dostępu LAN/tailnet
jawnie ustaw wiązanie i pozostaw włączone uwierzytelnianie.

Dla konfiguracji tylko tailnet:

- Ustaw `gateway.bind: "tailnet"` w `~/.openclaw/openclaw.json`.
- Uruchom ponownie Gateway (lub aplikację paska menu macOS).

## Co rozgłasza

Tylko Gateway rozgłasza `_openclaw-gw._tcp`. Rozgłaszanie multicast w sieci LAN jest
zapewniane przez dołączony Plugin `bonjour`; publikowanie wide-area DNS-SD pozostaje
własnością Gatewaya.

## Typy usług

- `_openclaw-gw._tcp` — beacon transportu gatewaya (używany przez węzły macOS/iOS/Android).

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
- `sshPort=<port>` (tylko pełny tryb mDNS; wide-area DNS-SD może go pomijać)
- `cliPath=<path>` (tylko pełny tryb mDNS; wide-area DNS-SD nadal zapisuje go jako wskazówkę zdalnej instalacji)

Uwagi dotyczące bezpieczeństwa:

- Rekordy TXT Bonjour/mDNS są **nieuwierzytelnione**. Klienci nie mogą traktować TXT jako autorytatywnego źródła routingu.
- Klienci powinni wyznaczać trasę przy użyciu rozwiązanego punktu końcowego usługi (SRV + A/AAAA). Traktuj `lanHost`, `tailnetDns`, `gatewayPort` i `gatewayTlsSha256` wyłącznie jako wskazówki.
- Automatyczne wybieranie celu SSH powinno analogicznie używać rozwiązanego hosta usługi, a nie wyłącznie wskazówek TXT.
- Przypinanie TLS nigdy nie może pozwolić, aby rozgłoszony `gatewayTlsSha256` nadpisał wcześniej zapisany pin.
- Węzły iOS/Android powinny traktować bezpośrednie połączenia oparte na wykrywaniu jako **wyłącznie TLS** i wymagać jawnego potwierdzenia użytkownika przed zaufaniem fingerprintowi po raz pierwszy.

## Debugowanie na macOS

Przydatne narzędzia wbudowane:

- Przeglądanie instancji:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Rozwiązanie jednej instancji (zastąp `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Jeśli przeglądanie działa, ale rozwiązywanie się nie udaje, zwykle trafiasz na zasadę LAN lub
problem resolvera mDNS.

## Debugowanie w logach Gatewaya

Gateway zapisuje rotowany plik logu (drukowany przy starcie jako
`gateway log file: ...`). Szukaj wierszy `bonjour:`, zwłaszcza:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour używa nazwy hosta systemu dla rozgłaszanego hosta `.local`, gdy jest ona
poprawną etykietą DNS. Jeśli nazwa hosta systemu zawiera spacje, podkreślenia lub inny
nieprawidłowy znak etykiety DNS, OpenClaw przełącza się na `openclaw.local`. Ustaw
`OPENCLAW_MDNS_HOSTNAME=<name>` przed uruchomieniem Gatewaya, gdy potrzebujesz
jawnej etykiety hosta.

## Debugowanie na węźle iOS

Węzeł iOS używa `NWBrowser` do wykrywania `_openclaw-gw._tcp`.

Aby przechwycić logi:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → odtwórz problem → **Copy**

Log zawiera przejścia stanu przeglądarki oraz zmiany zestawu wyników.

## Kiedy wyłączyć Bonjour

Wyłącz Bonjour tylko wtedy, gdy rozgłaszanie multicast w sieci LAN jest niedostępne lub szkodliwe.
Typowym przypadkiem jest Gateway działający za siecią mostkową Docker, WSL lub
zasadą sieciową, która odrzuca multicast mDNS. W tych środowiskach Gateway jest
nadal osiągalny przez opublikowany URL, SSH, Tailnet lub wide-area DNS-SD,
ale automatyczne wykrywanie w LAN nie jest niezawodne.

Preferuj istniejące nadpisanie środowiskowe, gdy problem dotyczy wdrożenia:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Wyłącza to rozgłaszanie multicast w LAN bez zmiany konfiguracji Pluginu.
Jest bezpieczne dla obrazów Docker, plików usług, skryptów uruchamiania i jednorazowego
debugowania, ponieważ ustawienie znika wraz ze środowiskiem.

Użyj konfiguracji Pluginu tylko wtedy, gdy celowo chcesz wyłączyć
dołączony Plugin wykrywania LAN dla tej konfiguracji OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Pułapki Dockera

Dołączony Plugin Bonjour automatycznie wyłącza rozgłaszanie multicast w LAN w wykrytych
kontenerach, gdy `OPENCLAW_DISABLE_BONJOUR` nie jest ustawione. Sieci mostkowe Docker
zwykle nie przekazują multicast mDNS (`224.0.0.251:5353`) między kontenerem
a siecią LAN, więc rozgłaszanie z kontenera rzadko sprawia, że wykrywanie działa.

Ważne pułapki:

- Wyłączenie Bonjour nie zatrzymuje Gatewaya. Zatrzymuje tylko rozgłaszanie multicast
  w LAN.
- Wyłączenie Bonjour nie zmienia `gateway.bind`; Docker nadal domyślnie używa
  `OPENCLAW_GATEWAY_BIND=lan`, aby opublikowany port hosta mógł działać.
- Wyłączenie Bonjour nie wyłącza wide-area DNS-SD. Użyj wykrywania wide-area
  lub Tailnet, gdy Gateway i węzeł nie są w tej samej sieci LAN.
- Ponowne użycie tego samego `OPENCLAW_CONFIG_DIR` poza Dockerem nie utrwala
  polityki automatycznego wyłączenia kontenera.
- Ustaw `OPENCLAW_DISABLE_BONJOUR=0` tylko dla sieci hosta, macvlan lub innej
  sieci, w której wiadomo, że multicast mDNS przechodzi; ustaw na `1`, aby wymusić wyłączenie.

## Rozwiązywanie problemów z wyłączonym Bonjour

Jeśli węzeł nie wykrywa już automatycznie Gatewaya po konfiguracji Dockera:

1. Potwierdź, czy Gateway działa w trybie automatycznym, wymuszonego włączenia czy wymuszonego wyłączenia:

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

4. Jeśli celowo włączyłeś Bonjour w Dockerze za pomocą
   `OPENCLAW_DISABLE_BONJOUR=0`, przetestuj multicast z hosta:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Jeśli przeglądanie jest puste albo logi Gatewaya pokazują powtarzające się anulowania
   watchdog ciao, przywróć `OPENCLAW_DISABLE_BONJOUR=1` i użyj trasy bezpośredniej lub
   Tailnet.

## Typowe tryby awarii

- **Bonjour nie przekracza sieci**: użyj Tailnet lub SSH.
- **Multicast zablokowany**: niektóre sieci Wi‑Fi wyłączają mDNS.
- **Advertiser utknął w probing/announcing**: hosty z zablokowanym multicastem,
  mostki kontenerów, WSL lub zmiany interfejsów mogą pozostawić advertiser ciao w
  stanie nierozgłoszonym. OpenClaw próbuje ponownie kilka razy, a następnie wyłącza Bonjour
  dla bieżącego procesu Gatewaya zamiast restartować advertiser bez końca.
- **Sieć mostkowa Docker**: Bonjour automatycznie wyłącza się w wykrytych kontenerach.
  Ustaw `OPENCLAW_DISABLE_BONJOUR=0` tylko dla hosta, macvlan lub innej
  sieci obsługującej mDNS.
- **Uśpienie / zmiany interfejsów**: macOS może tymczasowo utracić wyniki mDNS; spróbuj ponownie.
- **Przeglądanie działa, ale rozwiązywanie zawodzi**: utrzymuj proste nazwy maszyn (unikaj emoji i
  interpunkcji), a następnie uruchom ponownie Gateway. Nazwa instancji usługi pochodzi od
  nazwy hosta, więc zbyt złożone nazwy mogą mylić niektóre resolvery.

## Escapowane nazwy instancji (`\032`)

Bonjour/DNS‑SD często escapuje bajty w nazwach instancji usług jako dziesiętne sekwencje `\DDD`
(np. spacje stają się `\032`).

- Jest to normalne na poziomie protokołu.
- UI powinny dekodować je do wyświetlania (iOS używa `BonjourEscapes.decode`).

## Wyłączanie / konfiguracja

- `openclaw plugins disable bonjour` wyłącza rozgłaszanie multicast w LAN przez wyłączenie dołączonego Pluginu.
- `openclaw plugins enable bonjour` przywraca domyślny Plugin wykrywania LAN.
- `OPENCLAW_DISABLE_BONJOUR=1` wyłącza rozgłaszanie multicast w LAN bez zmiany konfiguracji Pluginu; akceptowane wartości prawdziwe to `1`, `true`, `yes` i `on` (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` wymusza włączenie rozgłaszania multicast w LAN, także wewnątrz wykrytych kontenerów; akceptowane wartości fałszywe to `0`, `false`, `no` i `off`.
- Gdy `OPENCLAW_DISABLE_BONJOUR` nie jest ustawione, Bonjour rozgłasza na zwykłych hostach i automatycznie wyłącza się wewnątrz wykrytych kontenerów.
- `gateway.bind` w `~/.openclaw/openclaw.json` kontroluje tryb wiązania Gatewaya.
- `OPENCLAW_SSH_PORT` nadpisuje port SSH, gdy `sshPort` jest rozgłaszany (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publikuje wskazówkę MagicDNS w TXT, gdy pełny tryb mDNS jest włączony (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` nadpisuje rozgłaszaną ścieżkę CLI (legacy: `OPENCLAW_CLI_PATH`).

## Powiązana dokumentacja

- Polityka wykrywania i wybór transportu: [Wykrywanie](/pl/gateway/discovery)
- Parowanie węzłów i zatwierdzenia: [Parowanie Gatewaya](/pl/gateway/pairing)
