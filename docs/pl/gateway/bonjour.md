---
read_when:
    - Debugowanie problemów z wykrywaniem Bonjour w macOS/iOS
    - Zmiana typów usług mDNS, rekordów TXT lub UX wykrywania
summary: Wykrywanie i debugowanie Bonjour/mDNS (sygnały rozgłoszeniowe Gateway, klienci i typowe tryby awarii)
title: Odkrywanie Bonjour
x-i18n:
    generated_at: "2026-05-12T12:50:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05892ee8f0dc880f68f7cf024de9452b8d999ff1af3c7ca9850fb4f2d732af0c
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw może używać Bonjour (mDNS / DNS-SD) do wykrywania aktywnego Gateway (punktu końcowego WebSocket).
Przeglądanie multicast `local.` to **udogodnienie wyłącznie w LAN**. Dołączony
plugin `bonjour` odpowiada za ogłaszanie w LAN. Uruchamia się automatycznie na hostach macOS i wymaga włączenia na
Linux, Windows oraz w kontenerowych wdrożeniach Gateway. W przypadku wykrywania między sieciami ten sam
beacon może być także publikowany przez skonfigurowaną domenę wide-area DNS-SD. Wykrywanie
nadal działa na zasadzie best-effort i **nie** zastępuje łączności opartej na SSH ani Tailnet.

## Wide-area Bonjour (Unicast DNS-SD) przez Tailscale

Jeśli węzeł i gateway są w różnych sieciach, multicast mDNS nie przejdzie przez
granicę. Możesz zachować ten sam UX wykrywania, przełączając się na **unicast DNS-SD**
(„Wide-Area Bonjour”) przez Tailscale.

Kroki ogólne:

1. Uruchom serwer DNS na hoście gateway (osiągalny przez Tailnet).
2. Opublikuj rekordy DNS-SD dla `_openclaw-gw._tcp` w dedykowanej strefie
   (przykład: `openclaw.internal.`).
3. Skonfiguruj Tailscale **split DNS**, aby wybrana domena była rozwiązywana przez ten
   serwer DNS dla klientów (w tym iOS).

OpenClaw obsługuje dowolną domenę wykrywania; `openclaw.internal.` to tylko przykład.
Węzły iOS/Android przeglądają zarówno `local.`, jak i skonfigurowaną domenę wide-area.

### Konfiguracja Gateway (zalecana)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### Jednorazowa konfiguracja serwera DNS (host gateway)

```bash
openclaw dns setup --apply
```

Instaluje to CoreDNS i konfiguruje go tak, aby:

- nasłuchiwał na porcie 53 tylko na interfejsach Tailscale gateway
- obsługiwał wybraną domenę (przykład: `openclaw.internal.`) z `~/.openclaw/dns/<domain>.db`

Zweryfikuj z maszyny połączonej z tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Ustawienia DNS Tailscale

W konsoli administracyjnej Tailscale:

- Dodaj serwer nazw wskazujący adres IP tailnet gateway (UDP/TCP 53).
- Dodaj split DNS, aby domena wykrywania używała tego serwera nazw.

Gdy klienci zaakceptują DNS tailnet, węzły iOS i wykrywanie CLI mogą przeglądać
`_openclaw-gw._tcp` w domenie wykrywania bez multicast.

### Bezpieczeństwo listenera Gateway (zalecane)

Port WS Gateway (domyślnie `18789`) domyślnie wiąże się z loopback. W przypadku dostępu
LAN/tailnet ustaw wiązanie jawnie i pozostaw uwierzytelnianie włączone.

Dla konfiguracji tylko tailnet:

- Ustaw `gateway.bind: "tailnet"` w `~/.openclaw/openclaw.json`.
- Uruchom ponownie Gateway (lub aplikację paska menu macOS).

## Co ogłasza usługi

Tylko Gateway ogłasza `_openclaw-gw._tcp`. Ogłaszanie multicast w LAN jest
zapewniane przez dołączony plugin `bonjour`, gdy plugin jest włączony; publikowanie
wide-area DNS-SD pozostaje własnością Gateway.

## Typy usług

- `_openclaw-gw._tcp` - beacon transportowy gateway (używany przez węzły macOS/iOS/Android).

## Klucze TXT (niesekretne wskazówki)

Gateway ogłasza małe, niesekretne wskazówki, aby ułatwić przepływy UI:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (tylko gdy TLS jest włączony)
- `gatewayTlsSha256=<sha256>` (tylko gdy TLS jest włączony i odcisk palca jest dostępny)
- `canvasPort=<port>` (tylko gdy host canvas jest włączony; obecnie taki sam jak `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (tylko pełny tryb mDNS, opcjonalna wskazówka, gdy Tailnet jest dostępny)
- `sshPort=<port>` (tylko pełny tryb; pomijane w trybach minimalnym i wyłączonym)
- `cliPath=<path>` (tylko pełny tryb; pomijane w trybach minimalnym i wyłączonym)

Uwagi dotyczące bezpieczeństwa:

- Rekordy TXT Bonjour/mDNS są **nieuwierzytelnione**. Klienci nie mogą traktować TXT jako autorytatywnego źródła trasowania.
- Klienci powinni trasować z użyciem rozwiązanego punktu końcowego usługi (SRV + A/AAAA). Traktuj `lanHost`, `tailnetDns`, `gatewayPort` i `gatewayTlsSha256` wyłącznie jako wskazówki.
- Automatyczne wybieranie celu SSH powinno podobnie używać rozwiązanego hosta usługi, a nie wskazówek wyłącznie z TXT.
- Przypinanie TLS nigdy nie może pozwolić, aby ogłoszony `gatewayTlsSha256` nadpisał wcześniej zapisany pin.
- Węzły iOS/Android powinny traktować bezpośrednie połączenia oparte na wykrywaniu jako **wyłącznie TLS** i wymagać jawnego potwierdzenia użytkownika przed zaufaniem pierwszemu odciskowi palca.

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

Gateway zapisuje rotowany plik logu (wypisywany przy starcie jako
`gateway log file: ...`). Szukaj wierszy `bonjour:`, zwłaszcza:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Watchdog traktuje aktywne `probing`, `announcing` i świeże zmiany nazw po konfliktach jako
stany w toku. Jeśli usługa nigdy nie osiągnie `announced`, OpenClaw ostatecznie
odtwarza advertiser i, po powtarzających się niepowodzeniach, wyłącza Bonjour dla tego
procesu Gateway zamiast ogłaszać usługę w nieskończoność.

Bonjour używa systemowej nazwy hosta dla ogłaszanego hosta `.local`, gdy jest ona
prawidłową etykietą DNS. Jeśli systemowa nazwa hosta zawiera spacje, podkreślenia lub inny
nieprawidłowy znak etykiety DNS, OpenClaw przechodzi na `openclaw.local`. Ustaw
`OPENCLAW_MDNS_HOSTNAME=<name>` przed uruchomieniem Gateway, gdy potrzebujesz
jawnej etykiety hosta.

## Debugowanie na węźle iOS

Węzeł iOS używa `NWBrowser` do wykrywania `_openclaw-gw._tcp`.

Aby przechwycić logi:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → odtwórz problem → **Copy**

Log zawiera przejścia stanów przeglądarki i zmiany zestawu wyników.

## Kiedy włączyć Bonjour

Bonjour uruchamia się automatycznie przy starcie Gateway z pustą konfiguracją na hostach macOS, ponieważ
lokalna aplikacja oraz pobliskie węzły iOS/Android często polegają na wykrywaniu w tej samej sieci LAN.

Włącz Bonjour jawnie, gdy automatyczne wykrywanie w tej samej sieci LAN jest przydatne na Linux,
Windows lub innym hoście innym niż macOS:

```bash
openclaw plugins enable bonjour
```

Po włączeniu Bonjour używa `discovery.mdns.mode`, aby zdecydować, ile metadanych TXT
opublikować. Ten sam tryb kontroluje opcjonalne wskazówki TXT w rekordach wide-area DNS-SD.
Domyślny tryb to `minimal`; używaj `full` tylko wtedy, gdy klienci potrzebują wskazówek `cliPath` lub
`sshPort`. Użyj `off`, aby wyłączyć multicast LAN bez zmiany
włączenia pluginu; wide-area DNS-SD nadal może publikować minimalny beacon Gateway, gdy
`discovery.wideArea.enabled` ma wartość true.

## Kiedy wyłączyć Bonjour

Pozostaw Bonjour wyłączony, gdy ogłaszanie multicast w LAN jest niepotrzebne, niedostępne
lub szkodliwe. Typowe przypadki to serwery inne niż macOS, sieci mostkowane Docker,
WSL albo polityka sieciowa, która odrzuca multicast mDNS. W tych środowiskach
Gateway nadal jest osiągalny przez opublikowany URL, SSH, Tailnet lub wide-area
DNS-SD, ale automatyczne wykrywanie w LAN nie jest niezawodne.

Preferuj istniejące nadpisanie środowiskowe, gdy problem dotyczy zakresu wdrożenia:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Wyłącza to ogłaszanie multicast w LAN bez zmiany konfiguracji pluginu.
Jest bezpieczne dla obrazów Docker, plików usług, skryptów uruchomieniowych i jednorazowego
debugowania, ponieważ ustawienie znika razem ze środowiskiem.

Użyj konfiguracji pluginu, gdy celowo chcesz wyłączyć dołączony plugin wykrywania LAN
dla tej konfiguracji OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Pułapki Docker

Dołączony plugin Bonjour automatycznie wyłącza ogłaszanie multicast w LAN w wykrytych
kontenerach, gdy `OPENCLAW_DISABLE_BONJOUR` nie jest ustawione. Sieci mostkowane Docker
zwykle nie przekazują multicast mDNS (`224.0.0.251:5353`) między kontenerem
a LAN, więc ogłaszanie z kontenera rzadko sprawia, że wykrywanie działa.

Ważne pułapki:

- Bonjour uruchamia się automatycznie na hostach macOS i wymaga włączenia gdzie indziej. Pozostawienie go
  wyłączonego nie zatrzymuje Gateway; jedynie pomija ogłaszanie multicast w LAN.
- Wyłączenie Bonjour nie zmienia `gateway.bind`; Docker nadal domyślnie używa
  `OPENCLAW_GATEWAY_BIND=lan`, aby opublikowany port hosta mógł działać.
- Wyłączenie Bonjour nie wyłącza wide-area DNS-SD. Użyj wykrywania wide-area
  lub Tailnet, gdy Gateway i węzeł nie są w tej samej sieci LAN.
- Ponowne użycie tego samego `OPENCLAW_CONFIG_DIR` poza Docker nie utrwala
  polityki automatycznego wyłączenia kontenera.
- Ustaw `OPENCLAW_DISABLE_BONJOUR=0` tylko dla sieci hosta, macvlan lub innej
  sieci, w której wiadomo, że multicast mDNS przechodzi; ustaw `1`, aby wymusić wyłączenie.

## Rozwiązywanie problemów z wyłączonym Bonjour

Jeśli węzeł nie wykrywa już automatycznie Gateway po konfiguracji Docker:

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
   - Klienci między sieciami: Tailnet MagicDNS, IP Tailnet, tunel SSH lub
     wide-area DNS-SD

4. Jeśli celowo włączyłeś plugin Bonjour w Docker i wymusiłeś ogłaszanie
   za pomocą `OPENCLAW_DISABLE_BONJOUR=0`, przetestuj multicast z hosta:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Jeśli przeglądanie jest puste albo logi Gateway pokazują powtarzające się anulowania
   watchdog ciao, przywróć `OPENCLAW_DISABLE_BONJOUR=1` i użyj bezpośredniej trasy lub
   trasy Tailnet.

## Typowe tryby awarii

- **Bonjour nie działa między sieciami**: użyj Tailnet lub SSH.
- **Multicast zablokowany**: niektóre sieci Wi-Fi wyłączają mDNS.
- **Advertiser utknął w probing/announcing**: hosty z zablokowanym multicast,
  mostki kontenerów, WSL lub zmiany interfejsów mogą pozostawić advertiser ciao w
  stanie nieogłoszonym. OpenClaw ponawia próbę kilka razy, a potem wyłącza Bonjour
  dla bieżącego procesu Gateway zamiast restartować advertiser w nieskończoność.
- **Sieć mostkowana Docker**: Bonjour automatycznie wyłącza się w wykrytych kontenerach.
  Ustaw `OPENCLAW_DISABLE_BONJOUR=0` tylko dla hosta, macvlan lub innej
  sieci zdolnej do mDNS.
- **Uśpienie / zmiany interfejsów**: macOS może tymczasowo tracić wyniki mDNS; spróbuj ponownie.
- **Przeglądanie działa, ale rozwiązywanie się nie udaje**: utrzymuj proste nazwy maszyn (unikaj emoji i
  interpunkcji), a następnie uruchom ponownie Gateway. Nazwa instancji usługi pochodzi od
  nazwy hosta, więc nadmiernie złożone nazwy mogą mylić niektóre resolvery.

## Nazwy instancji z sekwencjami escape (`\032`)

Bonjour/DNS-SD często zapisuje bajty w nazwach instancji usługi jako dziesiętne sekwencje
`\DDD` (np. spacje stają się `\032`).

- To normalne na poziomie protokołu.
- UI powinny dekodować je do wyświetlania (iOS używa `BonjourEscapes.decode`).

## Włączanie / wyłączanie / konfiguracja

- Hosty macOS domyślnie automatycznie uruchamiają wbudowany Plugin wykrywania LAN.
- `openclaw plugins enable bonjour` włącza wbudowany Plugin wykrywania LAN na hostach, na których nie jest domyślnie włączony.
- `openclaw plugins disable bonjour` wyłącza rozgłaszanie multicast LAN przez wyłączenie wbudowanego Plugin.
- `OPENCLAW_DISABLE_BONJOUR=1` wyłącza rozgłaszanie multicast LAN bez zmiany konfiguracji Plugin; akceptowane wartości prawdziwe to `1`, `true`, `yes` i `on` (starsza wersja: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` wymusza włączenie rozgłaszania multicast LAN, także wewnątrz wykrytych kontenerów; akceptowane wartości fałszywe to `0`, `false`, `no` i `off`.
- Gdy Plugin Bonjour jest włączony, a `OPENCLAW_DISABLE_BONJOUR` nie jest ustawione, Bonjour rozgłasza się na zwykłych hostach i automatycznie wyłącza się wewnątrz wykrytych kontenerów.
- `gateway.bind` w `~/.openclaw/openclaw.json` kontroluje tryb wiązania Gateway.
- `OPENCLAW_SSH_PORT` zastępuje port SSH, gdy rozgłaszane jest `sshPort` (starsza wersja: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publikuje wskazówkę MagicDNS w TXT, gdy włączony jest pełny tryb mDNS (starsza wersja: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` zastępuje rozgłaszaną ścieżkę CLI (starsza wersja: `OPENCLAW_CLI_PATH`).

## Powiązana dokumentacja

- Zasady wykrywania i wybór transportu: [Wykrywanie](/pl/gateway/discovery)
- Parowanie Node + zatwierdzenia: [Parowanie Gateway](/pl/gateway/pairing)
