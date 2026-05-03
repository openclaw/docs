---
read_when:
    - Implementowanie lub zmiana wykrywania/rozgłaszania Bonjour
    - Dostosowywanie trybów połączeń zdalnych (bezpośredni vs SSH)
    - Projektowanie wykrywania węzłów + parowania dla zdalnych węzłów
summary: Wykrywanie Node i transporty (Bonjour, Tailscale, SSH) do znajdowania Gateway
title: Wykrywanie i transporty
x-i18n:
    generated_at: "2026-05-03T21:32:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41a5ed7a910ae4bbdfa21a81882c3b1af0c16622fa20a5e616b666390dccdc9c
    source_path: gateway/discovery.md
    workflow: 16
---

# Wykrywanie i transporty

OpenClaw ma dwa różne problemy, które z zewnątrz wyglądają podobnie:

1. **Zdalne sterowanie operatora**: aplikacja paska menu macOS sterująca Gateway działającym gdzie indziej.
2. **Parowanie Node**: iOS/Android (i przyszłe Node) znajdują Gateway i parują się bezpiecznie.

Celem projektu jest utrzymanie całego wykrywania/ogłaszania sieciowego w **Node Gateway** (`openclaw gateway`) oraz traktowanie klientów (aplikacja na Maca, iOS) jako konsumentów.

## Terminy

- **Gateway**: pojedynczy, długo działający proces Gateway, który jest właścicielem stanu (sesje, parowanie, rejestr Node) i uruchamia kanały. Większość konfiguracji używa jednego na host; możliwe są izolowane konfiguracje z wieloma Gateway.
- **Gateway WS (płaszczyzna sterowania)**: punkt końcowy WebSocket domyślnie na `127.0.0.1:18789`; może być powiązany z LAN/tailnet przez `gateway.bind`.
- **Bezpośredni transport WS**: punkt końcowy Gateway WS dostępny z LAN/tailnet (bez SSH).
- **Transport SSH (wariant awaryjny)**: zdalne sterowanie przez przekierowanie `127.0.0.1:18789` przez SSH.
- **Starszy most TCP (usunięty)**: starszy transport Node (zobacz
  [Protokół mostu](/pl/gateway/bridge-protocol)); nie jest już ogłaszany do
  wykrywania i nie jest już częścią aktualnych kompilacji.

Szczegóły protokołu:

- [Protokół Gateway](/pl/gateway/protocol)
- [Protokół mostu (starszy)](/pl/gateway/bridge-protocol)

## Dlaczego zachowujemy zarówno tryb „bezpośredni”, jak i SSH

- **Bezpośredni WS** zapewnia najlepsze UX w tej samej sieci i w tailnet:
  - automatyczne wykrywanie w LAN przez Bonjour
  - tokeny parowania + ACL kontrolowane przez Gateway
  - brak wymaganego dostępu do powłoki; powierzchnia protokołu może pozostać ścisła i łatwa do audytu
- **SSH** pozostaje uniwersalnym wariantem awaryjnym:
  - działa wszędzie tam, gdzie masz dostęp SSH (nawet między niepowiązanymi sieciami)
  - jest odporne na problemy z multicast/mDNS
  - nie wymaga nowych portów przychodzących poza SSH

## Dane wejściowe wykrywania (jak klienci dowiadują się, gdzie jest Gateway)

### 1) Wykrywanie Bonjour / DNS-SD

Multicast Bonjour działa w trybie najlepszej próby i nie przechodzi między sieciami. OpenClaw może także przeglądać
ten sam sygnał Gateway przez skonfigurowaną domenę DNS-SD rozległego obszaru, dzięki czemu wykrywanie może obejmować:

- `local.` w tej samej sieci LAN
- skonfigurowaną domenę unicast DNS-SD do wykrywania między sieciami

Docelowy kierunek:

- **Gateway** ogłasza swój punkt końcowy WS przez Bonjour, gdy dołączony
  Plugin `bonjour` jest włączony. Plugin uruchamia się automatycznie na hostach macOS i jest
  opcjonalny gdzie indziej.
- Klienci przeglądają i pokazują listę „wybierz Gateway”, a następnie zapisują wybrany punkt końcowy.

Rozwiązywanie problemów i szczegóły sygnału: [Bonjour](/pl/gateway/bonjour).

#### Szczegóły sygnału usługi

- Typy usług:
  - `_openclaw-gw._tcp` (sygnał transportu Gateway)
- Klucze TXT (niepoufne):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (nazwa wyświetlana skonfigurowana przez operatora)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (tylko gdy TLS jest włączony)
  - `gatewayTlsSha256=<sha256>` (tylko gdy TLS jest włączony i odcisk jest dostępny)
  - `canvasPort=<port>` (port hosta canvas; obecnie taki sam jak `gatewayPort`, gdy host canvas jest włączony)
  - `tailnetDns=<magicdns>` (opcjonalna wskazówka; wykrywana automatycznie, gdy Tailscale jest dostępny)
  - `sshPort=<port>` (tylko pełny tryb mDNS; DNS-SD rozległego obszaru może go pominąć, w takim przypadku domyślne wartości SSH pozostają przy `22`)
  - `cliPath=<path>` (tylko pełny tryb mDNS; DNS-SD rozległego obszaru nadal zapisuje go jako wskazówkę zdalnej instalacji)

Uwagi dotyczące bezpieczeństwa:

- Rekordy TXT Bonjour/mDNS są **nieuwierzytelnione**. Klienci muszą traktować wartości TXT wyłącznie jako wskazówki UX.
- Routing (host/port) powinien preferować **rozwiązany punkt końcowy usługi** (SRV + A/AAAA) zamiast `lanHost`, `tailnetDns` lub `gatewayPort` podanych w TXT.
- Przypinanie TLS nigdy nie może pozwolić, aby ogłoszony `gatewayTlsSha256` nadpisał wcześniej zapisane przypięcie.
- Node iOS/Android powinny wymagać jawnego potwierdzenia „ufaj temu odciskowi” przed zapisaniem przypięcia po raz pierwszy (weryfikacja poza pasmem), gdy wybrana trasa jest oparta na secure/TLS.

Włączanie/wyłączanie/nadpisywanie:

- `openclaw plugins enable bonjour` włącza ogłaszanie multicast w LAN.
- `OPENCLAW_DISABLE_BONJOUR=1` wyłącza ogłaszanie.
- Gdy Plugin Bonjour jest włączony, a `OPENCLAW_DISABLE_BONJOUR` nie jest ustawione,
  Bonjour ogłasza się na zwykłych hostach i automatycznie wyłącza się w wykrytych kontenerach.
  Uruchomienie macOS Gateway z pustą konfiguracją włącza Plugin automatycznie; wdrożenia Linux,
  Windows i konteneryzowane wymagają jawnego włączenia.
  Użyj `0` tylko na hoście, macvlan lub innej sieci obsługującej mDNS; użyj `1`, aby
  wymusić wyłączenie.
- `gateway.bind` w `~/.openclaw/openclaw.json` kontroluje tryb wiązania Gateway.
- `OPENCLAW_SSH_PORT` nadpisuje ogłaszany port SSH, gdy emitowany jest `sshPort`.
- `OPENCLAW_TAILNET_DNS` publikuje wskazówkę `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` nadpisuje ogłaszaną ścieżkę CLI.

### 2) Tailnet (między sieciami)

W konfiguracjach w stylu Londyn/Wiedeń Bonjour nie pomoże. Zalecanym celem „bezpośrednim” jest:

- nazwa Tailscale MagicDNS (preferowana) lub stabilny adres IP tailnet.

Jeśli Gateway potrafi wykryć, że działa pod Tailscale, publikuje `tailnetDns` jako opcjonalną wskazówkę dla klientów (w tym sygnałów rozległego obszaru).

Aplikacja macOS preferuje teraz nazwy MagicDNS zamiast surowych adresów IP Tailscale przy wykrywaniu Gateway. Zwiększa to niezawodność, gdy adresy IP tailnet się zmieniają (na przykład po ponownym uruchomieniu Node lub ponownym przypisaniu CGNAT), ponieważ nazwy MagicDNS automatycznie rozwiązują się do bieżącego adresu IP.

W przypadku parowania mobilnego Node wskazówki wykrywania nie łagodzą bezpieczeństwa transportu na trasach tailnet/publicznych:

- iOS/Android nadal wymagają bezpiecznej ścieżki pierwszego połączenia tailnet/publicznego (`wss://` lub Tailscale Serve/Funnel).
- Wykryty surowy adres IP tailnet jest wskazówką routingu, a nie pozwoleniem na użycie zdalnego plaintext `ws://`.
- Prywatne bezpośrednie połączenie LAN `ws://` pozostaje obsługiwane.
- Jeśli chcesz najprostszej ścieżki Tailscale dla mobilnych Node, użyj Tailscale Serve, aby wykrywanie i kod konfiguracji rozwiązywały się do tego samego bezpiecznego punktu końcowego MagicDNS.

### 3) Cel ręczny / SSH

Gdy nie ma trasy bezpośredniej (lub tryb bezpośredni jest wyłączony), klienci zawsze mogą połączyć się przez SSH, przekierowując port Gateway local loopback.

Zobacz [Zdalny dostęp](/pl/gateway/remote).

## Wybór transportu (polityka klienta)

Zalecane zachowanie klienta:

1. Jeśli skonfigurowany sparowany bezpośredni punkt końcowy jest osiągalny, użyj go.
2. W przeciwnym razie, jeśli wykrywanie znajdzie Gateway w `local.` lub skonfigurowanej domenie rozległego obszaru, zaoferuj jedno dotknięcie „Użyj tego Gateway” i zapisz go jako bezpośredni punkt końcowy.
3. W przeciwnym razie, jeśli skonfigurowano DNS/IP tailnet, spróbuj bezpośrednio.
   Dla mobilnych Node na trasach tailnet/publicznych tryb bezpośredni oznacza bezpieczny punkt końcowy, a nie zdalny plaintext `ws://`.
4. W przeciwnym razie przejdź na SSH.

## Parowanie + uwierzytelnianie (transport bezpośredni)

Gateway jest źródłem prawdy dla dopuszczania Node/klientów.

- Żądania parowania są tworzone/zatwierdzane/odrzucane w Gateway (zobacz [Parowanie Gateway](/pl/gateway/pairing)).
- Gateway egzekwuje:
  - uwierzytelnianie (token / para kluczy)
  - zakresy/ACL (Gateway nie jest surowym proxy do każdej metody)
  - limity szybkości

## Odpowiedzialności według komponentu

- **Gateway**: ogłasza sygnały wykrywania, jest właścicielem decyzji parowania i hostuje punkt końcowy WS.
- **Aplikacja macOS**: pomaga wybrać Gateway, pokazuje monity parowania i używa SSH tylko jako wariantu awaryjnego.
- **Node iOS/Android**: przeglądają Bonjour dla wygody i łączą się ze sparowanym Gateway WS.

## Powiązane

- [Zdalny dostęp](/pl/gateway/remote)
- [Tailscale](/pl/gateway/tailscale)
- [Wykrywanie Bonjour](/pl/gateway/bonjour)
