---
read_when:
    - Debugowanie problemów z wykrywaniem Bonjour w systemach macOS/iOS
    - Zmiana typów usług mDNS, rekordów TXT lub UX wykrywania
summary: Wykrywanie Bonjour/mDNS + debugowanie (sygnały rozgłoszeniowe Gateway, klienci i typowe tryby awarii)
title: Wykrywanie Bonjour
x-i18n:
    generated_at: "2026-05-03T21:31:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2975fea03bc8fe8ccbd57f7a4ca8c15a59fb21b3f92c2b77b9a57ae4ebd5d374
    source_path: gateway/bonjour.md
    workflow: 16
---

# Wykrywanie Bonjour / mDNS

OpenClaw może używać Bonjour (mDNS / DNS-SD) do wykrywania aktywnego Gateway (punkt końcowy WebSocket).
Przeglądanie multicast `local.` to **udogodnienie tylko dla LAN**. Dołączony plugin `bonjour`
odpowiada za ogłaszanie w LAN. Uruchamia się automatycznie na hostach macOS i jest opcjonalny na
Linux, Windows oraz w skonteneryzowanych wdrożeniach Gateway. Do wykrywania między sieciami ten sam
beacon może być także publikowany przez skonfigurowaną domenę DNS-SD obszaru rozległego. Wykrywanie
nadal działa na zasadzie best-effort i **nie** zastępuje łączności opartej na SSH ani Tailnet.

## Bonjour obszaru rozległego (Unicast DNS-SD) przez Tailscale

Jeśli węzeł i Gateway znajdują się w różnych sieciach, multicast mDNS nie przekroczy tej
granicy. Możesz zachować ten sam UX wykrywania, przełączając się na **unicast DNS‑SD**
(„Wide‑Area Bonjour”) przez Tailscale.

Kroki ogólne:

1. Uruchom serwer DNS na hoście Gateway (osiągalny przez Tailnet).
2. Opublikuj rekordy DNS‑SD dla `_openclaw-gw._tcp` w dedykowanej strefie
   (przykład: `openclaw.internal.`).
3. Skonfiguruj **split DNS** Tailscale, aby wybrana domena była rozwiązywana przez ten
   serwer DNS dla klientów (w tym iOS).

OpenClaw obsługuje dowolną domenę wykrywania; `openclaw.internal.` to tylko przykład.
Węzły iOS/Android przeglądają zarówno `local.`, jak i skonfigurowaną domenę obszaru rozległego.

### Konfiguracja Gateway (zalecane)

```json5
{
  gateway: { bind: "tailnet" }, // tylko tailnet (zalecane)
  discovery: { wideArea: { enabled: true } }, // włącza publikowanie DNS-SD obszaru rozległego
}
```

### Jednorazowa konfiguracja serwera DNS (host Gateway)

```bash
openclaw dns setup --apply
```

Instaluje to CoreDNS i konfiguruje go tak, aby:

- nasłuchiwał na porcie 53 tylko na interfejsach Tailscale Gateway
- obsługiwał wybraną domenę (przykład: `openclaw.internal.`) z `~/.openclaw/dns/<domain>.db`

Sprawdź z maszyny połączonej z tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Ustawienia DNS Tailscale

W konsoli administracyjnej Tailscale:

- Dodaj nameserver wskazujący adres IP gateway w tailnet (UDP/TCP 53).
- Dodaj split DNS, aby domena wykrywania używała tego nameservera.

Gdy klienci zaakceptują DNS tailnet, węzły iOS i wykrywanie CLI mogą przeglądać
`_openclaw-gw._tcp` w Twojej domenie wykrywania bez multicastu.

### Bezpieczeństwo listenera Gateway (zalecane)

Port WS Gateway (domyślnie `18789`) domyślnie wiąże się z loopback. W przypadku dostępu
LAN/tailnet ustaw wiązanie jawnie i pozostaw uwierzytelnianie włączone.

Dla konfiguracji tylko tailnet:

- Ustaw `gateway.bind: "tailnet"` w `~/.openclaw/openclaw.json`.
- Uruchom ponownie Gateway (albo aplikację macOS na pasku menu).

## Co ogłasza

Tylko Gateway ogłasza `_openclaw-gw._tcp`. Ogłaszanie multicast w LAN jest
zapewniane przez dołączony plugin `bonjour`, gdy plugin jest włączony; publikowanie
DNS-SD obszaru rozległego pozostaje własnością Gateway.

## Typy usług

- `_openclaw-gw._tcp` — beacon transportu gateway (używany przez węzły macOS/iOS/Android).

## Klucze TXT (niesekretne wskazówki)

Gateway ogłasza małe niesekretne wskazówki, aby uprościć przepływy UI:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (tylko gdy TLS jest włączony)
- `gatewayTlsSha256=<sha256>` (tylko gdy TLS jest włączony i fingerprint jest dostępny)
- `canvasPort=<port>` (tylko gdy host canvas jest włączony; obecnie taki sam jak `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (tylko pełny tryb mDNS, opcjonalna wskazówka, gdy Tailnet jest dostępny)
- `sshPort=<port>` (tylko pełny tryb mDNS; DNS-SD obszaru rozległego może go pominąć)
- `cliPath=<path>` (tylko pełny tryb mDNS; DNS-SD obszaru rozległego nadal zapisuje go jako wskazówkę zdalnej instalacji)

Uwagi dotyczące bezpieczeństwa:

- Rekordy TXT Bonjour/mDNS są **nieuwierzytelnione**. Klienci nie mogą traktować TXT jako autorytatywnego routingu.
- Klienci powinni routować, używając rozwiązanego punktu końcowego usługi (SRV + A/AAAA). Traktuj `lanHost`, `tailnetDns`, `gatewayPort` i `gatewayTlsSha256` wyłącznie jako wskazówki.
- Automatyczne kierowanie SSH powinno podobnie używać rozwiązanego hosta usługi, a nie wskazówek wyłącznie z TXT.
- Przypinanie TLS nigdy nie może pozwalać, aby ogłoszony `gatewayTlsSha256` nadpisał wcześniej zapisany pin.
- Węzły iOS/Android powinny traktować bezpośrednie połączenia oparte na wykrywaniu jako **tylko TLS** i wymagać jawnego potwierdzenia użytkownika przed zaufaniem fingerprintowi po raz pierwszy.

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

Jeśli przeglądanie działa, ale rozwiązywanie kończy się niepowodzeniem, zwykle problemem jest polityka LAN albo
problem resolvera mDNS.

## Debugowanie w logach Gateway

Gateway zapisuje rotowany plik logu (drukowany przy starcie jako
`gateway log file: ...`). Szukaj wierszy `bonjour:`, zwłaszcza:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour używa nazwy hosta systemu dla ogłaszanego hosta `.local`, gdy jest ona
poprawną etykietą DNS. Jeśli nazwa hosta systemu zawiera spacje, podkreślenia lub inny
nieprawidłowy znak etykiety DNS, OpenClaw wraca do `openclaw.local`. Ustaw
`OPENCLAW_MDNS_HOSTNAME=<name>` przed uruchomieniem Gateway, gdy potrzebujesz
jawnej etykiety hosta.

## Debugowanie na węźle iOS

Węzeł iOS używa `NWBrowser` do wykrywania `_openclaw-gw._tcp`.

Aby przechwycić logi:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → odtwórz → **Copy**

Log zawiera przejścia stanu przeglądarki i zmiany zestawu wyników.

## Kiedy włączyć Bonjour

Bonjour uruchamia się automatycznie przy starcie Gateway z pustą konfiguracją na hostach macOS, ponieważ
lokalna aplikacja i pobliskie węzły iOS/Android często polegają na wykrywaniu w tej samej sieci LAN.

Włącz Bonjour jawnie, gdy automatyczne wykrywanie w tej samej sieci LAN jest przydatne na Linux,
Windows albo innym hoście innym niż macOS:

```bash
openclaw plugins enable bonjour
```

Gdy jest włączony, Bonjour używa `discovery.mdns.mode`, aby zdecydować, ile metadanych TXT
opublikować. Tryb domyślny to `minimal`; używaj `full` tylko wtedy, gdy lokalni klienci potrzebują
wskazówek `cliPath` lub `sshPort`, a `off`, aby wyciszyć multicast LAN bez
zmiany włączenia pluginu.

## Kiedy wyłączyć Bonjour

Pozostaw Bonjour wyłączony, gdy ogłaszanie multicast w LAN jest niepotrzebne, niedostępne
lub szkodliwe. Typowe przypadki to serwery inne niż macOS, sieci Docker bridge,
WSL albo polityka sieciowa, która odrzuca multicast mDNS. W tych środowiskach
Gateway jest nadal osiągalny przez opublikowany URL, SSH, Tailnet albo DNS-SD
obszaru rozległego, ale automatyczne wykrywanie w LAN nie jest niezawodne.

Preferuj istniejące nadpisanie środowiskowe, gdy problem dotyczy wdrożenia:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Wyłącza to ogłaszanie multicast w LAN bez zmiany konfiguracji pluginu.
Jest bezpieczne dla obrazów Docker, plików usług, skryptów uruchomieniowych i jednorazowego
debugowania, ponieważ ustawienie znika wraz ze środowiskiem.

Użyj konfiguracji pluginu, gdy celowo chcesz wyłączyć dołączony plugin wykrywania LAN
dla tej konfiguracji OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Pułapki Docker

Dołączony plugin Bonjour automatycznie wyłącza ogłaszanie multicast w LAN w wykrytych
kontenerach, gdy `OPENCLAW_DISABLE_BONJOUR` nie jest ustawione. Sieci Docker bridge
zwykle nie przekazują multicastu mDNS (`224.0.0.251:5353`) między kontenerem
a LAN, więc ogłaszanie z kontenera rzadko sprawia, że wykrywanie działa.

Ważne pułapki:

- Bonjour uruchamia się automatycznie na hostach macOS, a gdzie indziej jest opcjonalny. Pozostawienie go
  wyłączonego nie zatrzymuje Gateway; pomija tylko ogłaszanie multicast w LAN.
- Wyłączenie Bonjour nie zmienia `gateway.bind`; Docker nadal domyślnie używa
  `OPENCLAW_GATEWAY_BIND=lan`, aby opublikowany port hosta mógł działać.
- Wyłączenie Bonjour nie wyłącza DNS-SD obszaru rozległego. Użyj wykrywania obszaru rozległego
  lub Tailnet, gdy Gateway i węzeł nie są w tej samej sieci LAN.
- Ponowne użycie tego samego `OPENCLAW_CONFIG_DIR` poza Docker nie utrwala
  polityki automatycznego wyłączenia kontenera.
- Ustaw `OPENCLAW_DISABLE_BONJOUR=0` tylko dla host networking, macvlan albo innej
  sieci, w której multicast mDNS na pewno przechodzi; ustaw `1`, aby wymusić wyłączenie.

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
   - Control UI albo narzędzia lokalne: `http://127.0.0.1:18789`
   - Klienci LAN: `http://<gateway-host>:18789`
   - Klienci między sieciami: Tailnet MagicDNS, IP Tailnet, tunel SSH albo
     DNS-SD obszaru rozległego

4. Jeśli celowo włączyłeś plugin Bonjour w Docker i wymusiłeś ogłaszanie
   za pomocą `OPENCLAW_DISABLE_BONJOUR=0`, przetestuj multicast z hosta:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Jeśli przeglądanie jest puste albo logi Gateway pokazują powtarzające się anulowania
   ciao watchdog, przywróć `OPENCLAW_DISABLE_BONJOUR=1` i użyj bezpośredniej trasy albo
   trasy Tailnet.

## Typowe tryby awarii

- **Bonjour nie działa między sieciami**: użyj Tailnet albo SSH.
- **Multicast zablokowany**: niektóre sieci Wi‑Fi wyłączają mDNS.
- **Ogłaszający utknął w probing/announcing**: hosty z zablokowanym multicastem,
  mostki kontenerów, WSL albo zmiany interfejsów mogą pozostawić ogłaszający ciao w
  stanie nieogłoszonym. OpenClaw ponawia kilka razy, a następnie wyłącza Bonjour
  dla bieżącego procesu Gateway, zamiast restartować ogłaszającego w nieskończoność.
- **Sieć Docker bridge**: Bonjour automatycznie wyłącza się w wykrytych kontenerach.
  Ustaw `OPENCLAW_DISABLE_BONJOUR=0` tylko dla hosta, macvlan albo innej
  sieci obsługującej mDNS.
- **Uśpienie / zmiany interfejsów**: macOS może tymczasowo porzucić wyniki mDNS; ponów próbę.
- **Przeglądanie działa, ale rozwiązywanie zawodzi**: utrzymuj proste nazwy maszyn (unikaj emoji i
  interpunkcji), a potem uruchom ponownie Gateway. Nazwa instancji usługi pochodzi od
  nazwy hosta, więc zbyt złożone nazwy mogą mylić niektóre resolvery.

## Ucieczkowane nazwy instancji (`\032`)

Bonjour/DNS‑SD często ucieczkuje bajty w nazwach instancji usług jako dziesiętne sekwencje `\DDD`
(np. spacje stają się `\032`).

- To normalne na poziomie protokołu.
- UI powinny dekodować je do wyświetlania (iOS używa `BonjourEscapes.decode`).

## Włączanie / wyłączanie / konfiguracja

- Hosty macOS domyślnie automatycznie uruchamiają dołączony plugin wykrywania LAN.
- `openclaw plugins enable bonjour` włącza dołączony plugin wykrywania LAN na hostach, na których nie jest domyślnie włączony.
- `openclaw plugins disable bonjour` wyłącza ogłaszanie multicast w LAN przez wyłączenie dołączonego pluginu.
- `OPENCLAW_DISABLE_BONJOUR=1` wyłącza ogłaszanie multicast w LAN bez zmiany konfiguracji pluginu; akceptowane wartości prawdziwe to `1`, `true`, `yes` i `on` (starsze: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` wymusza włączenie ogłaszania multicast w LAN, także wewnątrz wykrytych kontenerów; akceptowane wartości fałszywe to `0`, `false`, `no` i `off`.
- Gdy plugin Bonjour jest włączony i `OPENCLAW_DISABLE_BONJOUR` nie jest ustawione, Bonjour ogłasza na zwykłych hostach i automatycznie wyłącza się wewnątrz wykrytych kontenerów.
- `gateway.bind` w `~/.openclaw/openclaw.json` kontroluje tryb wiązania Gateway.
- `OPENCLAW_SSH_PORT` nadpisuje port SSH, gdy `sshPort` jest ogłaszany (starsze: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publikuje wskazówkę MagicDNS w TXT, gdy pełny tryb mDNS jest włączony (starsze: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` nadpisuje ogłaszaną ścieżkę CLI (starsze: `OPENCLAW_CLI_PATH`).

## Powiązana dokumentacja

- Polityka wykrywania i wybór transportu: [Wykrywanie](/pl/gateway/discovery)
- Parowanie węzłów + zatwierdzenia: [Parowanie Gateway](/pl/gateway/pairing)
