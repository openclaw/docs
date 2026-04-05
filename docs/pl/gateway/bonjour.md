---
read_when:
    - Debugowanie problemów z odkrywaniem Bonjour na macOS/iOS
    - Zmiana typów usług mDNS, rekordów TXT lub UX odkrywania
summary: Bonjour/mDNS discovery + debugowanie (beacony Gateway, klienci i typowe tryby awarii)
title: Odkrywanie Bonjour
x-i18n:
    generated_at: "2026-04-05T13:52:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f5a7f3211c74d4d10fdc570fc102b3c949c0ded9409c54995ab8820e5787f02
    source_path: gateway/bonjour.md
    workflow: 15
---

# Odkrywanie Bonjour / mDNS

OpenClaw używa Bonjour (mDNS / DNS‑SD) do odkrywania aktywnej Gateway (punktu końcowego WebSocket).
Przeglądanie multicast `local.` to **wygoda tylko dla LAN**. W przypadku odkrywania między sieciami
ten sam beacon może być również publikowany przez skonfigurowaną domenę szerokozasięgowego DNS-SD. Odkrywanie
nadal działa w trybie best-effort i **nie** zastępuje łączności opartej na SSH ani Tailnet.

## Szerokozasięgowy Bonjour (Unicast DNS-SD) przez Tailscale

Jeśli node i gateway znajdują się w różnych sieciach, multicast mDNS nie przekroczy
tej granicy. Możesz zachować ten sam UX odkrywania, przełączając się na **unicast DNS‑SD**
(„Wide‑Area Bonjour”) przez Tailscale.

Kroki na wysokim poziomie:

1. Uruchom serwer DNS na hoście gateway (dostępny przez Tailnet).
2. Opublikuj rekordy DNS‑SD dla `_openclaw-gw._tcp` w dedykowanej strefie
   (przykład: `openclaw.internal.`).
3. Skonfiguruj **split DNS** w Tailscale, aby wybrana domena była rozwiązywana przez
   ten serwer DNS dla klientów (w tym iOS).

OpenClaw obsługuje dowolną domenę odkrywania; `openclaw.internal.` to tylko przykład.
Node’y iOS/Android przeglądają zarówno `local.`, jak i skonfigurowaną domenę szerokozasięgową.

### Konfiguracja Gateway (zalecana)

```json5
{
  gateway: { bind: "tailnet" }, // tylko tailnet (zalecane)
  discovery: { wideArea: { enabled: true } }, // włącza publikowanie szerokozasięgowego DNS-SD
}
```

### Jednorazowa konfiguracja serwera DNS (host gateway)

```bash
openclaw dns setup --apply
```

To instaluje CoreDNS i konfiguruje go tak, aby:

- nasłuchiwał na porcie 53 tylko na interfejsach Tailscale gateway
- obsługiwał wybraną domenę (przykład: `openclaw.internal.`) z `~/.openclaw/dns/<domain>.db`

Zweryfikuj z maszyny podłączonej do tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Ustawienia DNS Tailscale

W konsoli administracyjnej Tailscale:

- Dodaj serwer nazw wskazujący na adres IP tailnet gateway (UDP/TCP 53).
- Dodaj split DNS, aby domena odkrywania używała tego serwera nazw.

Gdy klienci zaakceptują DNS tailnet, node’y iOS oraz odkrywanie w CLI będą mogły przeglądać
`_openclaw-gw._tcp` w domenie odkrywania bez multicastu.

### Bezpieczeństwo nasłuchu Gateway (zalecane)

Port Gateway WS (domyślnie `18789`) domyślnie wiąże się z loopback. Dla dostępu przez LAN/tailnet
powiąż go jawnie i pozostaw włączone uwierzytelnianie.

Dla konfiguracji tylko tailnet:

- Ustaw `gateway.bind: "tailnet"` w `~/.openclaw/openclaw.json`.
- Uruchom ponownie Gateway (lub uruchom ponownie aplikację macOS menubar).

## Co się reklamuje

Tylko Gateway reklamuje `_openclaw-gw._tcp`.

## Typy usług

- `_openclaw-gw._tcp` — beacon transportu gateway (używany przez node’y macOS/iOS/Android).

## Klucze TXT (niebędące sekretami wskazówki)

Gateway reklamuje małe, niebędące sekretami wskazówki, aby ułatwić przepływy UI:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (tylko gdy TLS jest włączony)
- `gatewayTlsSha256=<sha256>` (tylko gdy TLS jest włączony i fingerprint jest dostępny)
- `canvasPort=<port>` (tylko gdy host canvas jest włączony; obecnie taki sam jak `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (opcjonalna wskazówka, gdy Tailnet jest dostępny)
- `sshPort=<port>` (tylko tryb pełny mDNS; szerokozasięgowy DNS-SD może to pominąć)
- `cliPath=<path>` (tylko tryb pełny mDNS; szerokozasięgowy DNS-SD nadal zapisuje to jako wskazówkę zdalnej instalacji)

Uwagi dotyczące bezpieczeństwa:

- Rekordy TXT Bonjour/mDNS są **nieuwierzytelnione**. Klienci nie mogą traktować TXT jako autorytatywnego routingu.
- Klienci powinni kierować ruch przy użyciu rozwiązanego punktu końcowego usługi (SRV + A/AAAA). Traktuj `lanHost`, `tailnetDns`, `gatewayPort` i `gatewayTlsSha256` wyłącznie jako wskazówki.
- Automatyczne wybieranie celu SSH powinno podobnie używać rozwiązanego hosta usługi, a nie wskazówek tylko z TXT.
- Pinning TLS nigdy nie może pozwalać, by reklamowane `gatewayTlsSha256` nadpisało wcześniej zapisany pin.
- Node’y iOS/Android powinny traktować bezpośrednie połączenia oparte na odkrywaniu jako **tylko TLS** i wymagać jawnego potwierdzenia użytkownika przed zaufaniem fingerprintowi widzianemu po raz pierwszy.

## Debugowanie na macOS

Przydatne wbudowane narzędzia:

- Przeglądanie instancji:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Rozwiąż jedną instancję (zastąp `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Jeśli przeglądanie działa, ale rozwiązywanie nie, zwykle oznacza to problem z polityką LAN albo
resolverem mDNS.

## Debugowanie w logach Gateway

Gateway zapisuje rotujący plik logów (wypisywany przy uruchomieniu jako
`gateway log file: ...`). Szukaj wierszy `bonjour:`, szczególnie:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## Debugowanie na node iOS

Node iOS używa `NWBrowser` do odkrywania `_openclaw-gw._tcp`.

Aby przechwycić logi:

- Ustawienia → Gateway → Zaawansowane → **Discovery Debug Logs**
- Ustawienia → Gateway → Zaawansowane → **Discovery Logs** → odtwórz problem → **Copy**

Log zawiera przejścia stanu przeglądarki i zmiany zestawu wyników.

## Typowe tryby awarii

- **Bonjour nie przechodzi między sieciami**: użyj Tailnet lub SSH.
- **Multicast zablokowany**: niektóre sieci Wi‑Fi wyłączają mDNS.
- **Uśpienie / zmiany interfejsów**: macOS może tymczasowo gubić wyniki mDNS; spróbuj ponownie.
- **Przeglądanie działa, ale rozwiązywanie nie**: używaj prostych nazw maszyn (unikaj emoji lub
  interpunkcji), a następnie uruchom ponownie Gateway. Nazwa instancji usługi pochodzi od
  nazwy hosta, więc zbyt złożone nazwy mogą mylić niektóre resolvery.

## Escaped instance names (`\032`)

Bonjour/DNS‑SD często stosuje escape bajtów w nazwach instancji usługi jako dziesiętne sekwencje `\DDD`
(na przykład spacje stają się `\032`).

- To normalne na poziomie protokołu.
- UI powinno to dekodować do wyświetlania (iOS używa `BonjourEscapes.decode`).

## Wyłączanie / konfiguracja

- `OPENCLAW_DISABLE_BONJOUR=1` wyłącza reklamowanie (starsza nazwa: `OPENCLAW_DISABLE_BONJOUR`).
- `gateway.bind` w `~/.openclaw/openclaw.json` kontroluje tryb powiązania Gateway.
- `OPENCLAW_SSH_PORT` nadpisuje port SSH, gdy reklamowane jest `sshPort` (starsza nazwa: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publikuje wskazówkę MagicDNS w TXT (starsza nazwa: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` nadpisuje reklamowaną ścieżkę CLI (starsza nazwa: `OPENCLAW_CLI_PATH`).

## Powiązana dokumentacja

- Polityka discovery i wybór transportu: [Discovery](/gateway/discovery)
- Parowanie node + zatwierdzenia: [Gateway pairing](/gateway/pairing)
