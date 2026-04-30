---
read_when:
    - Implementowanie lub zmienianie wykrywania/rozgłaszania Bonjour
    - Dostosowywanie trybów połączenia zdalnego (bezpośredni vs SSH)
    - Projektowanie wykrywania węzłów + parowania zdalnych węzłów
summary: Wykrywanie Node i transporty (Bonjour, Tailscale, SSH) do odnajdywania Gateway
title: Wykrywanie i transporty
x-i18n:
    generated_at: "2026-04-30T09:52:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: c396e6e07808e2571c6d7f539922b94443adbf39339027e6e962596c6f13deaa
    source_path: gateway/discovery.md
    workflow: 16
---

# Wykrywanie i transporty

OpenClaw ma dwa odrębne problemy, które powierzchownie wyglądają podobnie:

1. **Zdalne sterowanie operatora**: aplikacja paska menu macOS sterująca Gateway działającym gdzie indziej.
2. **Parowanie Node**: iOS/Android (i przyszłe Node) odnajdują Gateway i parują się bezpiecznie.

Celem projektu jest utrzymanie całego wykrywania/rozgłaszania sieciowego w **Node Gateway** (`openclaw gateway`) oraz utrzymanie klientów (aplikacja Mac, iOS) jako konsumentów.

## Terminy

- **Gateway**: pojedynczy, długotrwale działający proces Gateway, który jest właścicielem stanu (sesje, parowanie, rejestr Node) i uruchamia kanały. Większość konfiguracji używa jednego na host; izolowane konfiguracje z wieloma Gateway są możliwe.
- **Gateway WS (płaszczyzna sterowania)**: punkt końcowy WebSocket domyślnie na `127.0.0.1:18789`; może być zbindowany do LAN/tailnet przez `gateway.bind`.
- **Bezpośredni transport WS**: punkt końcowy Gateway WS dostępny z LAN/tailnet (bez SSH).
- **Transport SSH (awaryjny)**: zdalne sterowanie przez przekierowanie `127.0.0.1:18789` przez SSH.
- **Starszy most TCP (usunięty)**: starszy transport Node (zobacz
  [Protokół mostu](/pl/gateway/bridge-protocol)); nie jest już rozgłaszany do
  wykrywania i nie jest już częścią bieżących kompilacji.

Szczegóły protokołu:

- [Protokół Gateway](/pl/gateway/protocol)
- [Protokół mostu (starszy)](/pl/gateway/bridge-protocol)

## Dlaczego utrzymujemy zarówno „bezpośredni”, jak i SSH

- **Bezpośredni WS** zapewnia najlepszy UX w tej samej sieci i w obrębie tailnet:
  - automatyczne wykrywanie w LAN przez Bonjour
  - tokeny parowania + ACL zarządzane przez Gateway
  - brak wymaganego dostępu do powłoki; powierzchnia protokołu może pozostać wąska i audytowalna
- **SSH** pozostaje uniwersalnym mechanizmem awaryjnym:
  - działa wszędzie tam, gdzie masz dostęp SSH (nawet między niepowiązanymi sieciami)
  - działa mimo problemów z multicast/mDNS
  - nie wymaga nowych portów przychodzących poza SSH

## Dane wejściowe wykrywania (jak klienci dowiadują się, gdzie jest Gateway)

### 1) Wykrywanie Bonjour / DNS-SD

Multicast Bonjour działa na zasadzie najlepszej próby i nie przechodzi między sieciami. OpenClaw może też przeglądać ten sam sygnał Gateway przez skonfigurowaną domenę DNS-SD obszaru rozległego, więc wykrywanie może obejmować:

- `local.` w tej samej sieci LAN
- skonfigurowaną domenę unicast DNS-SD do wykrywania między sieciami

Docelowy kierunek:

- **Gateway** rozgłasza swój punkt końcowy WS przez Bonjour.
- Klienci przeglądają i pokazują listę „wybierz Gateway”, a następnie zapisują wybrany punkt końcowy.

Rozwiązywanie problemów i szczegóły sygnału: [Bonjour](/pl/gateway/bonjour).

#### Szczegóły sygnału usługi

- Typy usług:
  - `_openclaw-gw._tcp` (sygnał transportu Gateway)
- Klucze TXT (nietajne):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (nazwa wyświetlana skonfigurowana przez operatora)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (tylko gdy TLS jest włączony)
  - `gatewayTlsSha256=<sha256>` (tylko gdy TLS jest włączony i odcisk jest dostępny)
  - `canvasPort=<port>` (port hosta canvas; obecnie taki sam jak `gatewayPort`, gdy host canvas jest włączony)
  - `tailnetDns=<magicdns>` (opcjonalna wskazówka; wykrywana automatycznie, gdy dostępny jest Tailscale)
  - `sshPort=<port>` (tylko pełny tryb mDNS; DNS-SD obszaru rozległego może go pominąć, wtedy domyślne wartości SSH pozostają przy `22`)
  - `cliPath=<path>` (tylko pełny tryb mDNS; DNS-SD obszaru rozległego nadal zapisuje go jako wskazówkę zdalnej instalacji)

Uwagi dotyczące bezpieczeństwa:

- Rekordy TXT Bonjour/mDNS są **nieuwierzytelnione**. Klienci muszą traktować wartości TXT wyłącznie jako wskazówki UX.
- Routing (host/port) powinien preferować **rozwiązany punkt końcowy usługi** (SRV + A/AAAA) zamiast dostarczonych przez TXT wartości `lanHost`, `tailnetDns` lub `gatewayPort`.
- Pinning TLS nigdy nie może pozwolić, aby rozgłaszany `gatewayTlsSha256` zastąpił wcześniej zapisany pin.
- Node iOS/Android powinny wymagać jawnego potwierdzenia „zaufaj temu odciskowi” przed zapisaniem pierwszego pinu (weryfikacja poza kanałem), gdy wybrana trasa jest oparta na zabezpieczonym/TLS połączeniu.

Wyłączenie/nadpisanie:

- `OPENCLAW_DISABLE_BONJOUR=1` wyłącza rozgłaszanie.
- Gdy `OPENCLAW_DISABLE_BONJOUR` nie jest ustawione, Bonjour rozgłasza na normalnych hostach
  i wyłącza się automatycznie wewnątrz wykrytych kontenerów. Użyj `0` tylko na hoście, macvlan
  lub w innej sieci obsługującej mDNS; użyj `1`, aby wymusić wyłączenie.
- `gateway.bind` w `~/.openclaw/openclaw.json` kontroluje tryb bindowania Gateway.
- `OPENCLAW_SSH_PORT` nadpisuje port SSH rozgłaszany, gdy emitowany jest `sshPort`.
- `OPENCLAW_TAILNET_DNS` publikuje wskazówkę `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` nadpisuje rozgłaszaną ścieżkę CLI.

### 2) Tailnet (między sieciami)

W konfiguracjach typu Londyn/Wiedeń Bonjour nie pomoże. Zalecany cel „bezpośredni” to:

- nazwa Tailscale MagicDNS (preferowana) albo stabilny adres IP tailnet.

Jeśli Gateway może wykryć, że działa pod Tailscale, publikuje `tailnetDns` jako opcjonalną wskazówkę dla klientów (w tym sygnałów obszaru rozległego).

Aplikacja macOS preferuje teraz nazwy MagicDNS zamiast surowych adresów IP Tailscale podczas wykrywania Gateway. Poprawia to niezawodność, gdy adresy IP tailnet się zmieniają (na przykład po restartach Node lub ponownym przydziale CGNAT), ponieważ nazwy MagicDNS automatycznie rozwiązują się do bieżącego adresu IP.

W przypadku parowania mobilnych Node wskazówki wykrywania nie łagodzą bezpieczeństwa transportu na trasach tailnet/publicznych:

- iOS/Android nadal wymagają bezpiecznej ścieżki pierwszego połączenia tailnet/publicznego (`wss://` lub Tailscale Serve/Funnel).
- Wykryty surowy adres IP tailnet jest wskazówką routingu, a nie pozwoleniem na użycie zdalnego połączenia jawnym tekstem `ws://`.
- Prywatne bezpośrednie połączenie LAN `ws://` pozostaje obsługiwane.
- Jeśli chcesz najprostszą ścieżkę Tailscale dla mobilnych Node, użyj Tailscale Serve, aby zarówno wykrywanie, jak i kod konfiguracji rozwiązywały się do tego samego zabezpieczonego punktu końcowego MagicDNS.

### 3) Cel ręczny / SSH

Gdy nie ma trasy bezpośredniej (lub bezpośrednia jest wyłączona), klienci zawsze mogą połączyć się przez SSH, przekierowując port Gateway local loopback.

Zobacz [Zdalny dostęp](/pl/gateway/remote).

## Wybór transportu (polityka klienta)

Zalecane zachowanie klienta:

1. Jeśli skonfigurowano sparowany bezpośredni punkt końcowy i jest osiągalny, użyj go.
2. W przeciwnym razie, jeśli wykrywanie znajdzie Gateway w `local.` lub skonfigurowanej domenie obszaru rozległego, zaoferuj wybór jednym dotknięciem „Użyj tego Gateway” i zapisz go jako bezpośredni punkt końcowy.
3. W przeciwnym razie, jeśli skonfigurowano DNS/IP tailnet, spróbuj bezpośrednio.
   W przypadku mobilnych Node na trasach tailnet/publicznych bezpośrednio oznacza zabezpieczony punkt końcowy, a nie zdalne połączenie jawnym tekstem `ws://`.
4. W przeciwnym razie użyj SSH jako mechanizmu awaryjnego.

## Parowanie + uwierzytelnianie (transport bezpośredni)

Gateway jest źródłem prawdy dla dopuszczania Node/klientów.

- Żądania parowania są tworzone/zatwierdzane/odrzucane w Gateway (zobacz [Parowanie Gateway](/pl/gateway/pairing)).
- Gateway wymusza:
  - uwierzytelnianie (token / para kluczy)
  - zakresy/ACL (Gateway nie jest surowym proxy do każdej metody)
  - limity szybkości

## Odpowiedzialności według komponentu

- **Gateway**: rozgłasza sygnały wykrywania, jest właścicielem decyzji parowania i hostuje punkt końcowy WS.
- **Aplikacja macOS**: pomaga wybrać Gateway, pokazuje monity parowania i używa SSH tylko jako mechanizmu awaryjnego.
- **Node iOS/Android**: przeglądają Bonjour dla wygody i łączą się ze sparowanym Gateway WS.

## Powiązane

- [Zdalny dostęp](/pl/gateway/remote)
- [Tailscale](/pl/gateway/tailscale)
- [Wykrywanie Bonjour](/pl/gateway/bonjour)
