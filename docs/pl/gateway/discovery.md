---
read_when:
    - Implementacja lub zmiana wykrywania/ogłaszania Bonjour
    - Dostosowywanie zdalnych trybów połączenia (bezpośrednio vs SSH)
    - Projektowanie wykrywania Node + parowania dla zdalnych Node
summary: Wykrywanie Node i transporty (Bonjour, Tailscale, SSH) do znajdowania gateway
title: Wykrywanie i transporty
x-i18n:
    generated_at: "2026-04-24T09:09:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 684e5aeb1f74a90bf8689f8b25830be2c9e497fcdeda390d98f204d7cb4134b8
    source_path: gateway/discovery.md
    workflow: 15
---

# Wykrywanie i transporty

OpenClaw ma dwa odrębne problemy, które na pierwszy rzut oka wyglądają podobnie:

1. **Zdalne sterowanie operatora**: aplikacja macOS na pasku menu sterująca gateway uruchomionym gdzie indziej.
2. **Parowanie Node**: iOS/Android (oraz przyszłe Node) odnajdujące gateway i bezpiecznie się z nim parujące.

Celem projektu jest utrzymanie całego wykrywania/ogłaszania sieciowego w **Node Gateway** (`openclaw gateway`) i pozostawienie klientów (aplikacja Mac, iOS) jako konsumentów.

## Terminy

- **Gateway**: pojedynczy długotrwały proces gateway, który posiada stan (sesje, parowanie, rejestr Node) i uruchamia kanały. Większość konfiguracji używa jednego na host; możliwe są izolowane konfiguracje wielo-gateway.
- **Gateway WS (płaszczyzna sterowania)**: punkt końcowy WebSocket domyślnie na `127.0.0.1:18789`; może być powiązany z LAN/tailnet przez `gateway.bind`.
- **Bezpośredni transport WS**: punkt końcowy Gateway WS dostępny z LAN/tailnet (bez SSH).
- **Transport SSH (fallback)**: zdalne sterowanie przez przekazanie `127.0.0.1:18789` przez SSH.
- **Starszy most TCP (usunięty)**: starszy transport Node (zobacz
  [Protokół Bridge](/pl/gateway/bridge-protocol)); nie jest już ogłaszany do
  wykrywania i nie jest już częścią bieżących kompilacji.

Szczegóły protokołu:

- [Protokół Gateway](/pl/gateway/protocol)
- [Protokół Bridge (starszy)](/pl/gateway/bridge-protocol)

## Dlaczego zachowujemy zarówno tryb „direct”, jak i SSH

- **Bezpośredni WS** daje najlepsze UX w tej samej sieci i wewnątrz tailnet:
  - automatyczne wykrywanie w LAN przez Bonjour
  - tokeny parowania + ACL należące do gateway
  - brak wymaganego dostępu do powłoki; powierzchnia protokołu może pozostać wąska i audytowalna
- **SSH** pozostaje uniwersalnym fallbackiem:
  - działa wszędzie tam, gdzie masz dostęp SSH (nawet między niepowiązanymi sieciami)
  - jest odporny na problemy z multicast/mDNS
  - nie wymaga nowych portów przychodzących poza SSH

## Wejścia wykrywania (jak klienci dowiadują się, gdzie jest gateway)

### 1) Wykrywanie Bonjour / DNS-SD

Multicast Bonjour działa best-effort i nie przechodzi między sieciami. OpenClaw może także przeglądać
ten sam beacon gateway przez skonfigurowaną domenę szerokoobszarową DNS-SD, dzięki czemu wykrywanie może obejmować:

- `local.` w tej samej sieci LAN
- skonfigurowaną domenę unicast DNS-SD dla wykrywania między sieciami

Kierunek celu:

- **gateway** ogłasza swój punkt końcowy WS przez Bonjour.
- Klienci przeglądają i pokazują listę „wybierz gateway”, a następnie zapisują wybrany punkt końcowy.

Rozwiązywanie problemów i szczegóły beaconów: [Bonjour](/pl/gateway/bonjour).

#### Szczegóły beacona usługi

- Typy usług:
  - `_openclaw-gw._tcp` (beacon transportu gateway)
- Klucze TXT (niebędące sekretami):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<przyjazna nazwa>` (nazwa wyświetlana skonfigurowana przez operatora)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (tylko gdy TLS jest włączone)
  - `gatewayTlsSha256=<sha256>` (tylko gdy TLS jest włączone i odcisk jest dostępny)
  - `canvasPort=<port>` (port hosta Canvas; obecnie taki sam jak `gatewayPort`, gdy host Canvas jest włączony)
  - `tailnetDns=<magicdns>` (opcjonalna wskazówka; wykrywana automatycznie, gdy Tailscale jest dostępny)
  - `sshPort=<port>` (tylko tryb pełnego mDNS; szerokoobszarowe DNS-SD może go pominąć, wtedy domyślny port SSH pozostaje `22`)
  - `cliPath=<path>` (tylko tryb pełnego mDNS; szerokoobszarowe DNS-SD nadal zapisuje to jako wskazówkę zdalnej instalacji)

Uwagi dotyczące bezpieczeństwa:

- Rekordy Bonjour/mDNS TXT są **nieuwierzytelnione**. Klienci muszą traktować wartości TXT wyłącznie jako wskazówki UX.
- Routing (host/port) powinien preferować **rozwiązany punkt końcowy usługi** (SRV + A/AAAA) zamiast `lanHost`, `tailnetDns` lub `gatewayPort` podawanych w TXT.
- Przypinanie TLS nigdy nie może pozwolić, aby ogłoszone `gatewayTlsSha256` nadpisało wcześniej zapisany pin.
- Node iOS/Android powinny wymagać jawnego potwierdzenia „zaufaj temu odciskowi” przed zapisaniem pierwszego pinu (weryfikacja poza pasmem), gdy wybrana trasa jest bezpieczna/oparta na TLS.

Wyłączanie/nadpisywanie:

- `OPENCLAW_DISABLE_BONJOUR=1` wyłącza ogłaszanie.
- `gateway.bind` w `~/.openclaw/openclaw.json` steruje trybem powiązania Gateway.
- `OPENCLAW_SSH_PORT` nadpisuje port SSH ogłaszany wtedy, gdy emitowane jest `sshPort`.
- `OPENCLAW_TAILNET_DNS` publikuje wskazówkę `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` nadpisuje ogłaszaną ścieżkę CLI.

### 2) Tailnet (między sieciami)

W konfiguracjach typu London/Vienna Bonjour nie pomoże. Zalecanym celem „direct” jest:

- nazwa Tailscale MagicDNS (preferowana) albo stabilny adres IP tailnet.

Jeśli gateway potrafi wykryć, że działa pod Tailscale, publikuje `tailnetDns` jako opcjonalną wskazówkę dla klientów (w tym beaconów szerokoobszarowych).

Aplikacja macOS preferuje teraz nazwy MagicDNS zamiast surowych adresów IP Tailscale przy wykrywaniu gateway. Poprawia to niezawodność, gdy adresy IP tailnet się zmieniają (na przykład po restartach Node albo ponownym przydziale CGNAT), ponieważ nazwy MagicDNS automatycznie rozwiązują się do bieżącego IP.

Dla parowania mobilnych Node wskazówki wykrywania nie łagodzą bezpieczeństwa transportu na trasach tailnet/public:

- iOS/Android nadal wymagają bezpiecznej ścieżki pierwszego połączenia tailnet/public (`wss://` albo Tailscale Serve/Funnel).
- Wykryty surowy adres IP tailnet jest wskazówką routingu, a nie pozwoleniem na użycie jawnego zdalnego `ws://`.
- Prywatne bezpośrednie połączenie LAN `ws://` nadal jest obsługiwane.
- Jeśli chcesz najprostszą ścieżkę Tailscale dla mobilnych Node, użyj Tailscale Serve, aby wykrywanie i kod konfiguracji rozwiązywały się do tego samego bezpiecznego punktu końcowego MagicDNS.

### 3) Ręczny / cel SSH

Gdy nie ma bezpośredniej trasy (albo direct jest wyłączony), klienci zawsze mogą połączyć się przez SSH, przekazując port loopback gateway.

Zobacz [Dostęp zdalny](/pl/gateway/remote).

## Wybór transportu (polityka klienta)

Zalecane zachowanie klienta:

1. Jeśli skonfigurowano sparowany bezpośredni punkt końcowy i jest on osiągalny, użyj go.
2. W przeciwnym razie, jeśli wykrywanie znajdzie gateway na `local.` lub w skonfigurowanej domenie szerokoobszarowej, zaoferuj wybór „Użyj tego gateway” jednym kliknięciem i zapisz go jako bezpośredni punkt końcowy.
3. W przeciwnym razie, jeśli skonfigurowano tailnet DNS/IP, spróbuj połączenia direct.
   Dla mobilnych Node na trasach tailnet/public direct oznacza bezpieczny punkt końcowy, a nie jawny zdalny `ws://`.
4. W przeciwnym razie wróć do SSH.

## Parowanie + auth (transport direct)

Gateway jest źródłem prawdy dla dopuszczania Node/klientów.

- Żądania parowania są tworzone/zatwierdzane/odrzucane w gateway (zobacz [Parowanie Gateway](/pl/gateway/pairing)).
- Gateway egzekwuje:
  - auth (token / para kluczy)
  - zakresy/ACL (gateway nie jest surowym proxy do każdej metody)
  - limity szybkości

## Odpowiedzialności według komponentu

- **Gateway**: ogłasza beacony wykrywania, posiada decyzje parowania i hostuje punkt końcowy WS.
- **Aplikacja macOS**: pomaga wybrać gateway, pokazuje prompty parowania i używa SSH tylko jako fallback.
- **Node iOS/Android**: przeglądają Bonjour dla wygody i łączą się ze sparowanym Gateway WS.

## Powiązane

- [Dostęp zdalny](/pl/gateway/remote)
- [Tailscale](/pl/gateway/tailscale)
- [Wykrywanie Bonjour](/pl/gateway/bonjour)
