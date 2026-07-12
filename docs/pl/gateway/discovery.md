---
read_when:
    - Implementowanie lub zmiana wykrywania/ogłaszania Bonjour
    - Dostosowywanie trybów połączenia zdalnego (bezpośredniego i przez SSH)
    - Projektowanie wykrywania i parowania zdalnych węzłów
summary: Wykrywanie Node’ów i transporty (Bonjour, Tailscale, SSH) służące do odnajdywania Gatewaya
title: Wykrywanie i transporty
x-i18n:
    generated_at: "2026-07-12T15:09:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a3f1a6a1212ab0bc7021e77c88de059edcb8e09eff90d3e1e59451b9b20876b
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw ma dwa powiązane, lecz odrębne problemy z wykrywaniem:

1. **Zdalne sterowanie przez operatora**: aplikacja paska menu systemu macOS sterująca Gateway działającym w innym miejscu.
2. **Parowanie Node**: urządzenia z systemem iOS/Android (oraz przyszłe Node) znajdują Gateway i bezpiecznie się z nim parują.

Całe wykrywanie i ogłaszanie w sieci odbywa się w **Node Gateway**
(`openclaw gateway`); klienci (aplikacja na Maca, iOS) są wyłącznie odbiorcami.

## Terminy

- **Gateway**: pojedynczy, długotrwale działający proces, który zarządza stanem (sesjami,
  parowaniem, rejestrem Node) i uruchamia kanały. W większości konfiguracji używa się jednego na host;
  możliwe są odizolowane konfiguracje z wieloma instancjami Gateway.
- **Gateway WS (płaszczyzna sterowania)**: punkt końcowy WebSocket domyślnie pod adresem `127.0.0.1:18789`;
  powiąż go z siecią LAN/tailnet za pomocą `gateway.bind`.
- **Bezpośredni transport WS**: punkt końcowy Gateway WS dostępny z sieci LAN/tailnet (bez SSH).
- **Transport SSH (awaryjny)**: zdalne sterowanie przez przekierowanie
  `127.0.0.1:18789` przez SSH.
- **Starszy most TCP (usunięty)**: wcześniejszy transport Node (zobacz
  [Protokół mostu](/pl/gateway/bridge-protocol)); nie jest już ogłaszany na potrzeby
  wykrywania ani uwzględniany w bieżących kompilacjach.

Szczegóły protokołów: [Protokół Gateway](/pl/gateway/protocol),
[Protokół mostu (starszy)](/pl/gateway/bridge-protocol).

## Dlaczego istnieją zarówno połączenie bezpośrednie, jak i SSH

- **Bezpośredni WS** zapewnia najlepszą wygodę użytkowania w tej samej sieci i w obrębie tailnet: automatyczne
  wykrywanie w sieci LAN przez Bonjour, tokeny parowania i listy ACL zarządzane przez Gateway
  oraz brak wymogu dostępu do powłoki.
- **SSH** jest uniwersalnym rozwiązaniem awaryjnym: działa wszędzie, gdzie masz dostęp przez SSH, nawet
  między niezależnymi sieciami, jest odporny na problemy z multicastem/mDNS i nie wymaga
  żadnego nowego portu przychodzącego poza SSH.

## Źródła wykrywania

### 1) Bonjour / DNS-SD

Multicast Bonjour działa na zasadzie najlepszych starań i nie przekracza granic sieci. OpenClaw obsługuje również
przeglądanie tego samego sygnału Gateway za pośrednictwem skonfigurowanej domeny DNS-SD rozległego zasięgu,
dzięki czemu wykrywanie może obejmować zarówno `local.` w tej samej sieci LAN, jak i skonfigurowaną
domenę unicast DNS-SD do wykrywania między sieciami.

**Gateway** ogłasza swój punkt końcowy WS przez Bonjour, gdy wbudowany
Plugin `bonjour` jest włączony; klienci wyszukują dostępne instancje i wyświetlają listę „wybierz Gateway”,
a następnie zapisują wybrany punkt końcowy.

Rozwiązywanie problemów i szczegóły sygnału: [Bonjour](/pl/gateway/bonjour).

#### Szczegóły sygnału usługi

- Typ usługi: `_openclaw-gw._tcp` (sygnał transportu Gateway).
- Klucze TXT (niepoufne):

  | Klucz                       | Uwagi                                                                                                                                                            |
  | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `role=gateway`              | Zawsze obecny.                                                                                                                                                   |
  | `transport=gateway`         | Zawsze obecny.                                                                                                                                                   |
  | `displayName=<name>`        | Nazwa wyświetlana skonfigurowana przez operatora.                                                                                                                |
  | `lanHost=<hostname>.local`  | Tylko moduł ogłaszający mDNS w sieci LAN; nie jest zapisywany przez DNS-SD rozległego zasięgu.                                                                    |
  | `gatewayPort=18789`         | Port Gateway WS + HTTP.                                                                                                                                          |
  | `gatewayTls=1`              | Tylko gdy włączono TLS.                                                                                                                                          |
  | `gatewayTlsSha256=<sha256>` | Tylko gdy włączono TLS i dostępny jest odcisk.                                                                                                                   |
  | `tailnetDns=<magicdns>`     | Opcjonalna wskazówka; wykrywana automatycznie, gdy dostępny jest Tailscale.                                                                                       |
  | `sshPort=<port>`            | Obecny tylko wtedy, gdy `discovery.mdns.mode="full"`; pomijany (SSH domyślnie używa `22`) w domyślnym trybie `"minimal"`, zarówno w module ogłaszającym w sieci LAN, jak i w DNS-SD rozległego zasięgu. |
  | `cliPath=<path>`            | Podlega temu samemu warunkowi `discovery.mdns.mode="full"` co `sshPort`; wskazówka dotycząca ścieżki CLI w instalacji zdalnej.                                    |

  Klucz TXT `canvasPort` jest zdefiniowany w kontrakcie wykrywania Plugin na potrzeby
  przyszłego portu hosta kanwy, ale żadna bieżąca ścieżka kodu nie ustawia jego wartości, więc obecnie
  nigdy nie jest emitowany.

Uwagi dotyczące bezpieczeństwa:

- Rekordy TXT Bonjour/mDNS są **nieuwierzytelnione**. Klienci muszą traktować wartości TXT
  wyłącznie jako wskazówki dotyczące interfejsu użytkownika.
- Wyznaczanie trasy (host/port) powinno preferować **rozwiązany punkt końcowy usługi**
  (SRV + A/AAAA) zamiast podanych przez TXT wartości `lanHost`, `tailnetDns` lub `gatewayPort`.
- Przypinanie TLS nigdy nie może pozwolić, aby ogłoszony `gatewayTlsSha256` zastąpił
  wcześniej zapisane przypięcie.
- Node z systemem iOS/Android powinny wymagać jawnego potwierdzenia „zaufaj temu odciskowi”
  przed zapisaniem przypięcia po raz pierwszy (weryfikacja poza kanałem)
  zawsze wtedy, gdy wybrana trasa jest zabezpieczona/oparta na TLS.

Włączanie, wyłączanie i zastępowanie ustawień:

- `openclaw plugins enable bonjour` włącza ogłaszanie multicast w sieci LAN.
- `discovery.mdns.mode` w pliku `openclaw.json` steruje emisją mDNS:
  `"minimal"` (domyślnie), `"full"` (dodaje `cliPath`/`sshPort` zarówno do sygnału
  w sieci LAN, jak i do dowolnej strefy DNS-SD rozległego zasięgu) lub `"off"` (wyłącza mDNS).
- `OPENCLAW_DISABLE_BONJOUR=1` wymusza wyłączenie ogłaszania; `discovery.mdns.mode="off"`
  wyłącza je niezależnie. `OPENCLAW_DISABLE_BONJOUR=0` jest jawną
  zgodą, która zastępuje automatyczne wyłączenie Plugin wewnątrz wykrytego kontenera
  (Docker, containerd, Kubernetes, LXC); nie zastępuje
  `discovery.mdns.mode="off"`. Wbudowany Plugin `bonjour` uruchamia się automatycznie na
  hostach macOS (`enabledByDefaultOnPlatforms: ["darwin"]`) i wyłącza się automatycznie
  wewnątrz wykrytych kontenerów; wdrożenia na systemach Linux, Windows i innych środowiskach
  kontenerowych wymagają jawnego wykonania `plugins enable bonjour`.
- `gateway.bind` w pliku `~/.openclaw/openclaw.json` steruje trybem powiązania Gateway.
- `OPENCLAW_SSH_PORT` zastępuje ogłaszany port SSH (działa tylko,
  gdy `discovery.mdns.mode="full"`).
- `OPENCLAW_TAILNET_DNS` publikuje wskazówkę `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` zastępuje ogłaszaną ścieżkę CLI.

### 2) Tailnet (między sieciami)

W przypadku instancji Gateway w różnych sieciach fizycznych Bonjour nie pomoże. Zalecanym
celem bezpośrednim jest nazwa Tailscale MagicDNS (preferowana) lub
stabilny adres IP w tailnet.

Jeśli Gateway wykryje, że działa w środowisku Tailscale, publikuje
`tailnetDns` jako opcjonalną wskazówkę dla klientów (w tym w sygnałach rozległego zasięgu).
Aplikacja macOS preferuje nazwy MagicDNS zamiast nieprzetworzonych adresów IP Tailscale podczas
wykrywania Gateway, co zapewnia niezawodność w przypadku zmiany adresów IP w tailnet (ponowne uruchomienia
Node, ponowne przypisanie CGNAT), ponieważ MagicDNS automatycznie rozwiązuje nazwę na bieżący adres IP.

W przypadku parowania mobilnych Node wskazówki wykrywania nigdy nie łagodzą zabezpieczeń transportu na
trasach tailnet/publicznych:

- iOS/Android nadal wymagają bezpiecznej ścieżki pierwszego połączenia przez tailnet/sieć publiczną
  (`wss://` lub Tailscale Serve/Funnel).
- Wykryty nieprzetworzony adres IP w tailnet jest wskazówką routingu, a nie pozwoleniem na użycie
  nieszyfrowanego zdalnego połączenia `ws://`.
- Bezpośrednie połączenie `ws://` w prywatnej sieci LAN pozostaje obsługiwane.
- Aby uzyskać najprostszą ścieżkę Tailscale na mobilnych Node, użyj Tailscale Serve, aby
  zarówno wykrywanie, jak i konfiguracja wskazywały ten sam bezpieczny punkt końcowy MagicDNS.

### 3) Cel ręczny / SSH

Gdy nie istnieje trasa bezpośrednia (lub połączenie bezpośrednie jest wyłączone), klienci zawsze mogą
połączyć się przez SSH, przekierowując port Gateway na local loopback. Zobacz
[Zdalny dostęp](/pl/gateway/remote).

## Wybór transportu (zasady klienta)

1. Jeśli skonfigurowano sparowany bezpośredni punkt końcowy i jest on osiągalny, użyj go.
2. W przeciwnym razie, jeśli wykrywanie znajdzie Gateway w domenie `local.` lub skonfigurowanej domenie
   rozległego zasięgu, zaproponuj opcję „Użyj tego Gateway” wybieraną jednym dotknięciem i zapisz go jako
   bezpośredni punkt końcowy.
3. W przeciwnym razie, jeśli skonfigurowano DNS/IP tailnet, spróbuj połączenia bezpośredniego. W przypadku mobilnych Node na
   trasach tailnet/publicznych połączenie bezpośrednie oznacza bezpieczny punkt końcowy, a nie nieszyfrowane
   zdalne połączenie `ws://`.
4. W przeciwnym razie użyj awaryjnie SSH.

## Parowanie i uwierzytelnianie (transport bezpośredni)

Gateway jest źródłem prawdy dla dopuszczania Node/klientów:

- Żądania parowania są tworzone/zatwierdzane/odrzucane w Gateway (zobacz
  [Parowanie Gateway](/pl/gateway/pairing)).
- Gateway wymusza uwierzytelnianie (token/parę kluczy), zakresy/listy ACL (nie jest nieprzetworzonym
  serwerem proxy dla każdej metody) oraz limity szybkości.

## Obowiązki poszczególnych komponentów

- **Gateway**: ogłasza sygnały wykrywania, zarządza decyzjami dotyczącymi parowania, udostępnia
  punkt końcowy WS.
- **Aplikacja macOS**: pomaga wybrać Gateway, wyświetla monity dotyczące parowania, używa SSH
  wyłącznie jako rozwiązania awaryjnego.
- **Node z systemem iOS/Android**: dla wygody przeglądają Bonjour i łączą się ze
  sparowanym Gateway WS.

## Powiązane materiały

- [Zdalny dostęp](/pl/gateway/remote)
- [Tailscale](/pl/gateway/tailscale)
- [Wykrywanie Bonjour](/pl/gateway/bonjour)
