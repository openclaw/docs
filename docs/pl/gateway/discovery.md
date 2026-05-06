---
read_when:
    - Implementowanie lub zmienianie wykrywania/rozgłaszania Bonjour
    - Dostosowywanie trybów połączenia zdalnego (bezpośredni vs SSH)
    - Projektowanie wykrywania węzłów + parowania zdalnych węzłów
summary: Wykrywanie Node i transporty (Bonjour, Tailscale, SSH) do odnajdywania Gateway
title: Wykrywanie i transporty
x-i18n:
    generated_at: "2026-05-06T09:12:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f53e1292d9e5b402186c48c777e7e665c790981a64679c783ae8d8a1f170ee1
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw ma dwa odrębne problemy, które powierzchownie wyglądają podobnie:

1. **Zdalne sterowanie operatora**: aplikacja paska menu macOS kontrolująca gateway uruchomiony gdzie indziej.
2. **Parowanie Node**: iOS/Android (i przyszłe nody) znajdujące gateway i parujące się bezpiecznie.

Celem projektu jest utrzymanie całego wykrywania/reklamowania w sieci w **Node Gateway** (`openclaw gateway`) oraz pozostawienie klientów (aplikacja Mac, iOS) jako konsumentów.

## Terminy

- **Gateway**: pojedynczy, długo działający proces gateway, który jest właścicielem stanu (sesje, parowanie, rejestr node) i uruchamia kanały. Większość konfiguracji używa jednego na host; możliwe są izolowane konfiguracje z wieloma gateway.
- **Gateway WS (płaszczyzna sterowania)**: endpoint WebSocket domyślnie pod `127.0.0.1:18789`; może być zbindowany do LAN/tailnet przez `gateway.bind`.
- **Bezpośredni transport WS**: endpoint Gateway WS dostępny z LAN/tailnet (bez SSH).
- **Transport SSH (awaryjny)**: zdalne sterowanie przez przekierowanie `127.0.0.1:18789` przez SSH.
- **Starszy most TCP (usunięty)**: starszy transport node (zobacz
  [Protokół mostu](/pl/gateway/bridge-protocol)); nie jest już reklamowany do
  wykrywania i nie jest już częścią bieżących buildów.

Szczegóły protokołu:

- [Protokół Gateway](/pl/gateway/protocol)
- [Protokół mostu (starszy)](/pl/gateway/bridge-protocol)

## Dlaczego utrzymujemy zarówno połączenie bezpośrednie, jak i SSH

- **Bezpośredni WS** zapewnia najlepsze UX w tej samej sieci i w obrębie tailnet:
  - automatyczne wykrywanie w LAN przez Bonjour
  - tokeny parowania + ACL należące do gateway
  - brak wymaganego dostępu do shella; powierzchnia protokołu może pozostać wąska i audytowalna
- **SSH** pozostaje uniwersalnym mechanizmem awaryjnym:
  - działa wszędzie tam, gdzie masz dostęp SSH (nawet między niepowiązanymi sieciami)
  - działa mimo problemów z multicast/mDNS
  - nie wymaga nowych portów przychodzących poza SSH

## Dane wejściowe wykrywania (jak klienci dowiadują się, gdzie jest gateway)

### 1) Wykrywanie Bonjour / DNS-SD

Multicast Bonjour działa na zasadzie best-effort i nie przechodzi między sieciami. OpenClaw może też przeglądać
ten sam beacon gateway przez skonfigurowaną domenę wide-area DNS-SD, więc wykrywanie może obejmować:

- `local.` w tej samej sieci LAN
- skonfigurowaną domenę unicast DNS-SD do wykrywania między sieciami

Docelowy kierunek:

- **Gateway** reklamuje swój endpoint WS przez Bonjour, gdy dołączony
  Plugin `bonjour` jest włączony. Plugin uruchamia się automatycznie na hostach macOS i jest
  opcjonalny gdzie indziej.
- Klienci przeglądają i pokazują listę „wybierz gateway”, a następnie zapisują wybrany endpoint.

Rozwiązywanie problemów i szczegóły beacon: [Bonjour](/pl/gateway/bonjour).

#### Szczegóły beacon usługi

- Typy usług:
  - `_openclaw-gw._tcp` (beacon transportu gateway)
- Klucze TXT (niepoufne):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (nazwa wyświetlana skonfigurowana przez operatora)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (tylko gdy TLS jest włączony)
  - `gatewayTlsSha256=<sha256>` (tylko gdy TLS jest włączony i odcisk palca jest dostępny)
  - `canvasPort=<port>` (port hosta canvas; obecnie taki sam jak `gatewayPort`, gdy host canvas jest włączony)
  - `tailnetDns=<magicdns>` (opcjonalna wskazówka; wykrywana automatycznie, gdy dostępny jest Tailscale)
  - `sshPort=<port>` (tylko pełny tryb mDNS; wide-area DNS-SD może go pominąć, wtedy domyślne wartości SSH pozostają przy `22`)
  - `cliPath=<path>` (tylko pełny tryb mDNS; wide-area DNS-SD nadal zapisuje go jako wskazówkę zdalnej instalacji)

Uwagi dotyczące bezpieczeństwa:

- Rekordy TXT Bonjour/mDNS są **nieuwierzytelnione**. Klienci muszą traktować wartości TXT wyłącznie jako wskazówki UX.
- Routing (host/port) powinien preferować **rozwiązany endpoint usługi** (SRV + A/AAAA) zamiast wartości `lanHost`, `tailnetDns` lub `gatewayPort` podanych przez TXT.
- Pinning TLS nigdy nie może pozwalać, aby reklamowany `gatewayTlsSha256` nadpisywał wcześniej zapisany pin.
- Nody iOS/Android powinny wymagać jawnego potwierdzenia „zaufaj temu odciskowi palca” przed zapisaniem pierwszego pinu (weryfikacja poza pasmem), gdy wybrana trasa jest oparta na bezpiecznym/TLS połączeniu.

Włączanie/wyłączanie/nadpisywanie:

- `openclaw plugins enable bonjour` włącza reklamowanie multicast w LAN.
- `OPENCLAW_DISABLE_BONJOUR=1` wyłącza reklamowanie.
- Gdy Plugin Bonjour jest włączony, a `OPENCLAW_DISABLE_BONJOUR` nie jest ustawione,
  Bonjour reklamuje na zwykłych hostach i automatycznie wyłącza się w wykrytych kontenerach.
  Uruchomienie Gateway macOS z pustą konfiguracją włącza Plugin automatycznie; wdrożenia Linux,
  Windows i kontenerowe wymagają jawnego włączenia.
  Użyj `0` tylko na hoście, macvlan lub innej sieci obsługującej mDNS; użyj `1`, aby
  wymusić wyłączenie.
- `gateway.bind` w `~/.openclaw/openclaw.json` kontroluje tryb bindowania Gateway.
- `OPENCLAW_SSH_PORT` nadpisuje reklamowany port SSH, gdy emitowany jest `sshPort`.
- `OPENCLAW_TAILNET_DNS` publikuje wskazówkę `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` nadpisuje reklamowaną ścieżkę CLI.

### 2) Tailnet (między sieciami)

W konfiguracjach typu Londyn/Wiedeń Bonjour nie pomoże. Zalecanym celem „bezpośrednim” jest:

- nazwa Tailscale MagicDNS (preferowana) albo stabilny adres IP tailnet.

Jeśli gateway może wykryć, że działa pod Tailscale, publikuje `tailnetDns` jako opcjonalną wskazówkę dla klientów (w tym beacon wide-area).

Aplikacja macOS preferuje teraz nazwy MagicDNS zamiast surowych adresów IP Tailscale do wykrywania gateway. Poprawia to niezawodność, gdy adresy IP tailnet się zmieniają (na przykład po restartach node lub ponownym przypisaniu CGNAT), ponieważ nazwy MagicDNS automatycznie rozwiązują się do bieżącego adresu IP.

W przypadku parowania node mobilnego wskazówki wykrywania nie rozluźniają bezpieczeństwa transportu na trasach tailnet/publicznych:

- iOS/Android nadal wymagają bezpiecznej ścieżki pierwszego połączenia tailnet/publicznego (`wss://` lub Tailscale Serve/Funnel).
- Wykryty surowy adres IP tailnet jest wskazówką routingu, a nie pozwoleniem na użycie zdalnego plaintext `ws://`.
- Prywatne bezpośrednie połączenie LAN przez `ws://` pozostaje obsługiwane.
- Jeśli chcesz najprostszą ścieżkę Tailscale dla node mobilnych, użyj Tailscale Serve, aby wykrywanie i kod konfiguracji rozwiązywały się do tego samego bezpiecznego endpointu MagicDNS.

### 3) Cel ręczny / SSH

Gdy nie ma trasy bezpośredniej (albo połączenie bezpośrednie jest wyłączone), klienci zawsze mogą połączyć się przez SSH, przekierowując port loopback gateway.

Zobacz [Zdalny dostęp](/pl/gateway/remote).

## Wybór transportu (polityka klienta)

Zalecane zachowanie klienta:

1. Jeśli skonfigurowany sparowany endpoint bezpośredni jest osiągalny, użyj go.
2. W przeciwnym razie, jeśli wykrywanie znajdzie gateway w `local.` lub skonfigurowanej domenie wide-area, zaoferuj jednorazowy wybór „Użyj tego gateway” i zapisz go jako endpoint bezpośredni.
3. W przeciwnym razie, jeśli skonfigurowano DNS/IP tailnet, spróbuj połączenia bezpośredniego.
   Dla node mobilnych na trasach tailnet/publicznych połączenie bezpośrednie oznacza bezpieczny endpoint, a nie zdalny plaintext `ws://`.
4. W przeciwnym razie przejdź awaryjnie na SSH.

## Parowanie + auth (transport bezpośredni)

Gateway jest źródłem prawdy dla dopuszczania node/klienta.

- Żądania parowania są tworzone/zatwierdzane/odrzucane w gateway (zobacz [Parowanie Gateway](/pl/gateway/pairing)).
- Gateway wymusza:
  - auth (token / para kluczy)
  - zakresy/ACL (gateway nie jest surowym proxy do każdej metody)
  - limity szybkości

## Odpowiedzialności według komponentu

- **Gateway**: reklamuje beacon wykrywania, jest właścicielem decyzji parowania i hostuje endpoint WS.
- **Aplikacja macOS**: pomaga wybrać gateway, pokazuje monity parowania i używa SSH tylko jako mechanizmu awaryjnego.
- **Nody iOS/Android**: przeglądają Bonjour dla wygody i łączą się ze sparowanym Gateway WS.

## Powiązane

- [Zdalny dostęp](/pl/gateway/remote)
- [Tailscale](/pl/gateway/tailscale)
- [Wykrywanie Bonjour](/pl/gateway/bonjour)
