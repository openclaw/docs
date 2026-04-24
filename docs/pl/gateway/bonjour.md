---
read_when:
    - Debugowanie problemów z wykrywaniem Bonjour na macOS/iOS
    - Zmiana typów usług mDNS, rekordów TXT lub UX wykrywania
summary: Wykrywanie Bonjour/mDNS + debugowanie (beacony Gateway, klienci i typowe tryby awarii)
title: Wykrywanie Bonjour
x-i18n:
    generated_at: "2026-04-24T09:08:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62961714a0c9880be457c254e1cfc1701020ea51b89f2582757cddc8b3dd2113
    source_path: gateway/bonjour.md
    workflow: 15
---

# Wykrywanie Bonjour / mDNS

OpenClaw używa Bonjour (mDNS / DNS‑SD) do wykrywania aktywnego Gateway (punkt końcowy WebSocket).
Przeglądanie multicast `local.` to **wygoda tylko dla LAN**. Dołączony
Plugin `bonjour` odpowiada za ogłaszanie w LAN i jest domyślnie włączony. W przypadku wykrywania między sieciami
ten sam beacon może być również publikowany przez skonfigurowaną domenę szerokiego obszaru DNS-SD.
Wykrywanie nadal działa w trybie best-effort i **nie** zastępuje łączności przez SSH ani Tailscale.

## Szerokoobszarowy Bonjour (Unicast DNS-SD) przez Tailscale

Jeśli Node i gateway są w różnych sieciach, multicast mDNS nie przekroczy
tej granicy. Możesz zachować ten sam UX wykrywania, przełączając się na **unicast DNS‑SD**
(„Wide‑Area Bonjour”) przez Tailscale.

Kroki na wysokim poziomie:

1. Uruchom serwer DNS na hoście gateway (osiągalny przez Tailnet).
2. Opublikuj rekordy DNS‑SD dla `_openclaw-gw._tcp` w dedykowanej strefie
   (przykład: `openclaw.internal.`).
3. Skonfiguruj Tailscale **split DNS**, aby wybrana domena była rozstrzygana przez ten
   serwer DNS dla klientów (w tym iOS).

OpenClaw obsługuje dowolną domenę wykrywania; `openclaw.internal.` to tylko przykład.
Node iOS/Android przeglądają zarówno `local.`, jak i skonfigurowaną domenę szerokoobszarową.

### Konfiguracja Gateway (zalecana)

```json5
{
  gateway: { bind: "tailnet" }, // tylko tailnet (zalecane)
  discovery: { wideArea: { enabled: true } }, // włącza publikowanie szerokoobszarowego DNS-SD
}
```

### Jednorazowa konfiguracja serwera DNS (host gateway)

```bash
openclaw dns setup --apply
```

To instaluje CoreDNS i konfiguruje go tak, aby:

- nasłuchiwał na porcie 53 tylko na interfejsach Tailscale gateway
- obsługiwał wybraną domenę (przykład: `openclaw.internal.`) z `~/.openclaw/dns/<domain>.db`

Zweryfikuj z maszyny połączonej z tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Ustawienia DNS Tailscale

W konsoli administracyjnej Tailscale:

- Dodaj nameserver wskazujący na adres IP gateway w tailnet (UDP/TCP 53).
- Dodaj split DNS, aby Twoja domena wykrywania używała tego nameservera.

Gdy klienci zaakceptują DNS tailnet, Node iOS i wykrywanie CLI będą mogły przeglądać
`_openclaw-gw._tcp` w Twojej domenie wykrywania bez multicastu.

### Bezpieczeństwo listenera Gateway (zalecane)

Port Gateway WS (domyślnie `18789`) jest domyślnie powiązany z loopback. W przypadku dostępu z LAN/tailnet
jawnie ustaw bind i pozostaw uwierzytelnianie włączone.

Dla konfiguracji tylko z tailnet:

- Ustaw `gateway.bind: "tailnet"` w `~/.openclaw/openclaw.json`.
- Uruchom ponownie Gateway (albo uruchom ponownie aplikację menubar na macOS).

## Co się ogłasza

Tylko Gateway ogłasza `_openclaw-gw._tcp`. Ogłaszanie multicast w LAN jest
dostarczane przez dołączony Plugin `bonjour`; publikowanie szerokoobszarowego DNS-SD pozostaje
własnością Gateway.

## Typy usług

- `_openclaw-gw._tcp` — beacon transportu gateway (używany przez Node macOS/iOS/Android).

## Klucze TXT (niejawne wskazówki)

Gateway ogłasza niewielkie, niejawnosekretne wskazówki, aby ułatwić przepływy UI:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (tylko gdy TLS jest włączony)
- `gatewayTlsSha256=<sha256>` (tylko gdy TLS jest włączony i odcisk palca jest dostępny)
- `canvasPort=<port>` (tylko gdy host canvas jest włączony; obecnie taki sam jak `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (tylko pełny tryb mDNS; opcjonalna wskazówka, gdy Tailnet jest dostępny)
- `sshPort=<port>` (tylko pełny tryb mDNS; szerokoobszarowy DNS-SD może go pomijać)
- `cliPath=<path>` (tylko pełny tryb mDNS; szerokoobszarowy DNS-SD nadal zapisuje go jako wskazówkę zdalnej instalacji)

Uwagi dotyczące bezpieczeństwa:

- Rekordy TXT Bonjour/mDNS są **nieuwierzytelnione**. Klienci nie mogą traktować TXT jako autorytatywnego routingu.
- Klienci powinni kierować ruch na podstawie rozstrzygniętego punktu końcowego usługi (SRV + A/AAAA). Traktuj `lanHost`, `tailnetDns`, `gatewayPort` i `gatewayTlsSha256` wyłącznie jako wskazówki.
- Automatyczne kierowanie SSH powinno również używać rozstrzygniętego hosta usługi, a nie wskazówek tylko z TXT.
- Pinning TLS nigdy nie może pozwalać, aby ogłoszone `gatewayTlsSha256` nadpisywało wcześniej zapisany pin.
- Node iOS/Android powinny traktować bezpośrednie połączenia oparte na wykrywaniu jako **wyłącznie TLS** i wymagać jawnego potwierdzenia użytkownika przed zaufaniem odciskowi palca widzianemu po raz pierwszy.

## Debugowanie na macOS

Przydatne wbudowane narzędzia:

- Przeglądanie instancji:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Rozstrzygnięcie jednej instancji (zastąp `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Jeśli przeglądanie działa, ale rozstrzyganie nie, zwykle oznacza to problem z polityką LAN albo
resolverem mDNS.

## Debugowanie w logach Gateway

Gateway zapisuje rotujący plik logu (wypisywany przy starcie jako
`gateway log file: ...`). Szukaj wierszy `bonjour:`, szczególnie:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## Debugowanie na Node iOS

Node iOS używa `NWBrowser` do wykrywania `_openclaw-gw._tcp`.

Aby przechwycić logi:

- Ustawienia → Gateway → Zaawansowane → **Discovery Debug Logs**
- Ustawienia → Gateway → Zaawansowane → **Discovery Logs** → odtwórz problem → **Copy**

Log zawiera przejścia stanów przeglądarki i zmiany zestawu wyników.

## Typowe tryby awarii

- **Bonjour nie działa między sieciami**: użyj Tailnet lub SSH.
- **Multicast jest blokowany**: niektóre sieci Wi‑Fi wyłączają mDNS.
- **Uśpienie / zmiany interfejsów**: macOS może tymczasowo gubić wyniki mDNS; ponów próbę.
- **Przeglądanie działa, ale rozstrzyganie nie**: utrzymuj proste nazwy maszyn (unikaj emoji lub
  znaków interpunkcyjnych), a następnie uruchom ponownie Gateway. Nazwa instancji usługi jest wyprowadzana z
  nazwy hosta, więc zbyt złożone nazwy mogą mylić niektóre resolvery.

## Escapowane nazwy instancji (`\032`)

Bonjour/DNS‑SD często escapuje bajty w nazwach instancji usług jako dziesiętne sekwencje `\DDD`
(np. spacje stają się `\032`).

- To jest normalne na poziomie protokołu.
- UI powinno dekodować to do wyświetlania (iOS używa `BonjourEscapes.decode`).

## Wyłączanie / konfiguracja

- `openclaw plugins disable bonjour` wyłącza ogłaszanie multicast w LAN przez wyłączenie dołączonego Pluginu.
- `openclaw plugins enable bonjour` przywraca domyślny Plugin wykrywania LAN.
- `OPENCLAW_DISABLE_BONJOUR=1` wyłącza ogłaszanie multicast w LAN bez zmiany konfiguracji Pluginu; akceptowane wartości truthy to `1`, `true`, `yes` i `on` (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `gateway.bind` w `~/.openclaw/openclaw.json` kontroluje tryb bind Gateway.
- `OPENCLAW_SSH_PORT` nadpisuje port SSH, gdy ogłaszane jest `sshPort` (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publikuje wskazówkę MagicDNS w TXT, gdy włączony jest pełny tryb mDNS (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` nadpisuje ogłaszaną ścieżkę CLI (legacy: `OPENCLAW_CLI_PATH`).

## Powiązana dokumentacja

- Zasady wykrywania i wybór transportu: [Wykrywanie](/pl/gateway/discovery)
- Parowanie Node + zatwierdzenia: [Parowanie Gateway](/pl/gateway/pairing)
