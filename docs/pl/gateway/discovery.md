---
read_when:
    - Implementowanie lub zmienianie wykrywania/reklamowania Bonjour
    - Dostosowywanie zdalnych trybów połączenia (bezpośrednio vs SSH)
    - Projektowanie wykrywania węzłów i parowania dla zdalnych węzłów
summary: Wykrywanie węzłów i transporty (Bonjour, Tailscale, SSH) do znajdowania gateway
title: Discovery and Transports
x-i18n:
    generated_at: "2026-04-05T13:52:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: e76cca9279ca77b55e30d6e746f6325e5644134ef06b9c58f2cf3d793d092685
    source_path: gateway/discovery.md
    workflow: 15
---

# Discovery & transports

OpenClaw ma dwa różne problemy, które na pierwszy rzut oka wyglądają podobnie:

1. **Zdalne sterowanie przez operatora**: aplikacja paska menu macOS sterująca gateway działającym gdzie indziej.
2. **Parowanie węzłów**: iOS/Android (oraz przyszłe węzły) znajdują gateway i bezpiecznie się z nim parują.

Celem projektu jest utrzymanie całego wykrywania/reklamowania sieciowego w **Node Gateway** (`openclaw gateway`) i pozostawienie klientów (aplikacja Mac, iOS) jako odbiorców.

## Terminy

- **Gateway**: pojedynczy długotrwale działający proces gateway, który zarządza stanem (sesje, parowanie, rejestr węzłów) i uruchamia kanały. Większość konfiguracji używa jednego na host; możliwe są izolowane konfiguracje z wieloma gateway.
- **Gateway WS (płaszczyzna sterowania)**: endpoint WebSocket na `127.0.0.1:18789` domyślnie; można go powiązać z LAN/tailnet przez `gateway.bind`.
- **Transport bezpośredni WS**: endpoint Gateway WS dostępny w LAN/tailnet (bez SSH).
- **Transport SSH (fallback)**: zdalne sterowanie przez przekierowanie `127.0.0.1:18789` przez SSH.
- **Starszy most TCP (usunięty)**: starszy transport węzła (zobacz
  [Bridge protocol](/gateway/bridge-protocol)); nie jest już reklamowany do
  wykrywania i nie jest już częścią bieżących buildów.

Szczegóły protokołu:

- [Gateway protocol](/gateway/protocol)
- [Bridge protocol (legacy)](/gateway/bridge-protocol)

## Dlaczego utrzymujemy zarówno tryb „bezpośredni”, jak i SSH

- **Bezpośredni WS** zapewnia najlepsze UX w tej samej sieci i w tailnet:
  - automatyczne wykrywanie w LAN przez Bonjour
  - tokeny parowania + ACL zarządzane przez gateway
  - nie wymaga dostępu do powłoki; powierzchnia protokołu może pozostać wąska i łatwa do audytu
- **SSH** pozostaje uniwersalnym fallbackiem:
  - działa wszędzie tam, gdzie masz dostęp SSH (nawet przez niepowiązane sieci)
  - działa mimo problemów z multicast/mDNS
  - nie wymaga nowych portów przychodzących poza SSH

## Wejścia wykrywania (jak klienci dowiadują się, gdzie jest gateway)

### 1) Wykrywanie Bonjour / DNS-SD

Multicast Bonjour działa best-effort i nie przechodzi między sieciami. OpenClaw może także przeglądać
ten sam beacon gateway przez skonfigurowaną domenę DNS-SD typu wide-area, więc wykrywanie może obejmować:

- `local.` w tej samej sieci LAN
- skonfigurowaną domenę unicast DNS-SD do wykrywania między sieciami

Docelowy kierunek:

- **Gateway** reklamuje swój endpoint WS przez Bonjour.
- Klienci przeglądają i pokazują listę „wybierz gateway”, a następnie zapisują wybrany endpoint.

Szczegóły beacona i rozwiązywanie problemów: [Bonjour](/gateway/bonjour).

#### Szczegóły beacona usługi

- Typy usług:
  - `_openclaw-gw._tcp` (beacon transportu gateway)
- Klucze TXT (niebędące sekretami):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (nazwa wyświetlana skonfigurowana przez operatora)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (tylko gdy TLS jest włączony)
  - `gatewayTlsSha256=<sha256>` (tylko gdy TLS jest włączony i odcisk palca jest dostępny)
  - `canvasPort=<port>` (port hosta canvas; obecnie taki sam jak `gatewayPort`, gdy host canvas jest włączony)
  - `tailnetDns=<magicdns>` (opcjonalna wskazówka; wykrywana automatycznie, gdy Tailscale jest dostępny)
  - `sshPort=<port>` (tylko pełny tryb mDNS; wide-area DNS-SD może go pomijać, w takim przypadku pozostają domyślne ustawienia SSH `22`)
  - `cliPath=<path>` (tylko pełny tryb mDNS; wide-area DNS-SD nadal zapisuje to jako wskazówkę do zdalnej instalacji)

Uwagi dotyczące bezpieczeństwa:

- Rekordy TXT Bonjour/mDNS są **nieuwierzytelnione**. Klienci muszą traktować wartości TXT wyłącznie jako wskazówki UX.
- Routing (host/port) powinien preferować **rozwiązany endpoint usługi** (SRV + A/AAAA) zamiast wartości TXT `lanHost`, `tailnetDns` lub `gatewayPort`.
- Przypinanie TLS nigdy nie może pozwolić, aby reklamowany `gatewayTlsSha256` nadpisał wcześniej zapisany pin.
- Węzły iOS/Android powinny wymagać jawnego potwierdzenia „ufaj temu odciskowi palca” przed zapisaniem pierwszego pinu (weryfikacja poza pasmem), gdy wybrana trasa jest bezpieczna/oparta na TLS.

Wyłączanie/nadpisania:

- `OPENCLAW_DISABLE_BONJOUR=1` wyłącza reklamowanie.
- `gateway.bind` w `~/.openclaw/openclaw.json` kontroluje tryb powiązania Gateway.
- `OPENCLAW_SSH_PORT` nadpisuje reklamowany port SSH, gdy emitowany jest `sshPort`.
- `OPENCLAW_TAILNET_DNS` publikuje wskazówkę `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` nadpisuje reklamowaną ścieżkę CLI.

### 2) Tailnet (między sieciami)

W konfiguracjach w stylu Londyn/Wiedeń Bonjour nie pomoże. Zalecanym celem „bezpośrednim” jest:

- nazwa Tailscale MagicDNS (preferowana) lub stabilny adres IP tailnet.

Jeśli gateway może wykryć, że działa w Tailscale, publikuje `tailnetDns` jako opcjonalną wskazówkę dla klientów (w tym beaconów wide-area).

Aplikacja macOS teraz preferuje nazwy MagicDNS zamiast surowych adresów IP Tailscale do wykrywania gateway. Poprawia to niezawodność, gdy adresy IP tailnet się zmieniają (na przykład po restartach węzłów lub ponownym przydziale CGNAT), ponieważ nazwy MagicDNS automatycznie rozwiązują się na bieżący adres IP.

W przypadku parowania mobilnych węzłów wskazówki wykrywania nie rozluźniają bezpieczeństwa transportu na trasach tailnet/public:

- iOS/Android nadal wymagają bezpiecznej ścieżki pierwszego połączenia tailnet/public (`wss://` lub Tailscale Serve/Funnel).
- Wykryty surowy adres IP tailnet jest wskazówką routingu, a nie zgodą na użycie zdalnego jawnotekstowego `ws://`.
- Bezpośrednie połączenie `ws://` w prywatnym LAN nadal jest obsługiwane.
- Jeśli chcesz najprostszą ścieżkę Tailscale dla mobilnych węzłów, użyj Tailscale Serve, aby zarówno wykrywanie, jak i kod konfiguracji rozwiązywały się do tego samego bezpiecznego endpointu MagicDNS.

### 3) Cel ręczny / SSH

Gdy nie ma trasy bezpośredniej (albo bezpośrednia jest wyłączona), klienci zawsze mogą łączyć się przez SSH, przekierowując port loopback gateway.

Zobacz [Remote access](/gateway/remote).

## Wybór transportu (polityka klienta)

Zalecane zachowanie klienta:

1. Jeśli skonfigurowano sparowany bezpośredni endpoint i jest osiągalny, użyj go.
2. W przeciwnym razie, jeśli wykrywanie znajdzie gateway w `local.` lub skonfigurowanej domenie wide-area, zaoferuj wybór „Użyj tego gateway” jednym kliknięciem i zapisz go jako bezpośredni endpoint.
3. W przeciwnym razie, jeśli skonfigurowano DNS/IP tailnet, spróbuj połączenia bezpośredniego.
   Dla mobilnych węzłów na trasach tailnet/public połączenie bezpośrednie oznacza bezpieczny endpoint, a nie zdalne jawnotekstowe `ws://`.
4. W przeciwnym razie przejdź do SSH.

## Parowanie + uwierzytelnianie (transport bezpośredni)

Gateway jest źródłem prawdy dla dopuszczania węzłów/klientów.

- Żądania parowania są tworzone/zatwierdzane/odrzucane w gateway (zobacz [Gateway pairing](/gateway/pairing)).
- Gateway wymusza:
  - uwierzytelnianie (token / para kluczy)
  - zakresy/ACL (gateway nie jest surowym proxy do każdej metody)
  - limity szybkości

## Odpowiedzialności według komponentu

- **Gateway**: reklamuje beacony wykrywania, zarządza decyzjami parowania i hostuje endpoint WS.
- **Aplikacja macOS**: pomaga wybrać gateway, pokazuje monity parowania i używa SSH tylko jako fallbacku.
- **Węzły iOS/Android**: przeglądają Bonjour jako ułatwienie i łączą się z sparowanym Gateway WS.
