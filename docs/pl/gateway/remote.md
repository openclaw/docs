---
read_when:
    - Uruchamianie lub rozwiązywanie problemów ze zdalnymi konfiguracjami Gateway
summary: Zdalny dostęp za pomocą tuneli SSH (Gateway WS) i sieci tailnet
title: Zdalny dostęp
x-i18n:
    generated_at: "2026-04-30T09:56:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 116ffba71801d3363eba293997ee4a5c8ad083a82298e57e68f678510263650a
    source_path: gateway/remote.md
    workflow: 16
---

To repozytorium obsługuje „zdalnie przez SSH”, utrzymując pojedynczy Gateway (master) działający na dedykowanym hoście (komputer stacjonarny/serwer) i podłączając do niego klientów.

- Dla **operatorów (Ty / aplikacja macOS)**: tunelowanie SSH jest uniwersalnym rozwiązaniem awaryjnym.
- Dla **węzłów (iOS/Android oraz przyszłe urządzenia)**: łącz się z **WebSocket** Gateway (LAN/tailnet lub tunel SSH w razie potrzeby).

## Główna idea

- WebSocket Gateway wiąże się z **loopback** na skonfigurowanym porcie (domyślnie 18789).
- Do użycia zdalnego przekierowujesz ten port loopback przez SSH (albo używasz tailnet/VPN i mniej tunelujesz).

## Typowe konfiguracje VPN i tailnet

Traktuj **host Gateway** jako miejsce, w którym działa agent. To on posiada sesje, profile uwierzytelniania, kanały i stan. Twój laptop, komputer stacjonarny i węzły łączą się z tym hostem.

### Stale działający Gateway w Twoim tailnet

Uruchom Gateway na trwałym hoście (VPS lub serwer domowy) i łącz się z nim przez **Tailscale** albo SSH.

- **Najlepszy UX:** zachowaj `gateway.bind: "loopback"` i użyj **Tailscale Serve** dla interfejsu sterowania.
- **Fallback:** zachowaj loopback oraz tunel SSH z dowolnej maszyny, która potrzebuje dostępu.
- **Przykłady:** [exe.dev](/pl/install/exe-dev) (łatwa VM) albo [Hetzner](/pl/install/hetzner) (produkcyjny VPS).

Idealne, gdy Twój laptop często zasypia, ale chcesz, aby agent działał stale.

### Domowy komputer stacjonarny uruchamia Gateway

Laptop **nie** uruchamia agenta. Łączy się zdalnie:

- Użyj trybu **Remote over SSH** aplikacji macOS (Ustawienia → Ogólne → OpenClaw runs).
- Aplikacja otwiera tunel i nim zarządza, więc WebChat i kontrole zdrowia po prostu działają.

Runbook: [zdalny dostęp macOS](/pl/platforms/mac/remote).

### Laptop uruchamia Gateway

Zachowaj Gateway lokalnie, ale udostępnij go bezpiecznie:

- tunel SSH do laptopa z innych maszyn albo
- Tailscale Serve dla interfejsu sterowania i Gateway tylko przez loopback.

Przewodniki: [Tailscale](/pl/gateway/tailscale) i [przegląd Web](/pl/web).

## Przepływ poleceń (co działa gdzie)

Jedna usługa Gateway posiada stan i kanały. Węzły są urządzeniami peryferyjnymi.

Przykładowy przepływ (Telegram → węzeł):

- Wiadomość Telegram dociera do **Gateway**.
- Gateway uruchamia **agenta** i decyduje, czy wywołać narzędzie węzła.
- Gateway wywołuje **węzeł** przez WebSocket Gateway (`node.*` RPC).
- Węzeł zwraca wynik; Gateway odpowiada z powrotem do Telegram.

Uwagi:

- **Węzły nie uruchamiają usługi Gateway.** Na host powinien działać tylko jeden gateway, chyba że celowo uruchamiasz odizolowane profile (zobacz [Wiele gatewayów](/pl/gateway/multiple-gateways)).
- „Tryb węzła” aplikacji macOS to po prostu klient węzła przez WebSocket Gateway.

## Tunel SSH (CLI + narzędzia)

Utwórz lokalny tunel do zdalnego WS Gateway:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Gdy tunel działa:

- `openclaw health` i `openclaw status --deep` docierają teraz do zdalnego gatewaya przez `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` i `openclaw gateway call` mogą też w razie potrzeby kierować ruch do przekierowanego URL przez `--url`.

<Note>
Zastąp `18789` skonfigurowanym `gateway.port` (albo `--port` lub `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Gdy podasz `--url`, CLI nie wraca do konfiguracji ani poświadczeń środowiskowych. Jawnie podaj `--token` albo `--password`. Brak jawnych poświadczeń jest błędem.
</Warning>

## Zdalne wartości domyślne CLI

Możesz utrwalić zdalny cel, aby polecenia CLI używały go domyślnie:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

Gdy gateway jest dostępny tylko przez loopback, pozostaw URL jako `ws://127.0.0.1:18789` i najpierw otwórz tunel SSH.
W transporcie tunelu SSH aplikacji macOS wykryte nazwy hostów gatewaya należą do
`gateway.remote.sshTarget`; `gateway.remote.url` pozostaje lokalnym URL tunelu.

## Priorytet poświadczeń

Rozwiązywanie poświadczeń Gateway podlega jednej wspólnej umowie w ścieżkach call/probe/status oraz monitorowaniu zgody na wykonanie w Discord. Node-host używa tej samej podstawowej umowy z jednym wyjątkiem trybu lokalnego (celowo ignoruje `gateway.remote.*`):

- Jawne poświadczenia (`--token`, `--password` albo narzędziowe `gatewayToken`) zawsze wygrywają na ścieżkach wywołań, które akceptują jawne uwierzytelnianie.
- Bezpieczeństwo nadpisania URL:
  - Nadpisania URL w CLI (`--url`) nigdy nie używają ponownie niejawnych poświadczeń z konfiguracji/środowiska.
  - Nadpisania URL ze środowiska (`OPENCLAW_GATEWAY_URL`) mogą używać tylko poświadczeń środowiskowych (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Domyślne wartości trybu lokalnego:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (zdalny fallback ma zastosowanie tylko wtedy, gdy lokalne wejście tokena auth nie jest ustawione)
  - hasło: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (zdalny fallback ma zastosowanie tylko wtedy, gdy lokalne wejście hasła auth nie jest ustawione)
- Domyślne wartości trybu zdalnego:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - hasło: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Wyjątek trybu lokalnego Node-host: `gateway.remote.token` / `gateway.remote.password` są ignorowane.
- Sprawdzanie tokena przy zdalnym probe/status jest domyślnie rygorystyczne: podczas kierowania do trybu zdalnego używa tylko `gateway.remote.token` (bez lokalnego fallbacku tokena).
- Nadpisania środowiskowe Gateway używają tylko `OPENCLAW_GATEWAY_*`.

## UI czatu przez SSH

WebChat nie używa już osobnego portu HTTP. UI czatu SwiftUI łączy się bezpośrednio z WebSocket Gateway.

- Przekieruj `18789` przez SSH (zobacz wyżej), a następnie połącz klientów z `ws://127.0.0.1:18789`.
- Na macOS preferuj tryb „Remote over SSH” aplikacji, który automatycznie zarządza tunelem.

## Remote over SSH w aplikacji macOS

Aplikacja paska menu macOS może obsłużyć tę samą konfigurację od początku do końca (zdalne kontrole statusu, WebChat i przekazywanie Voice Wake).

Runbook: [zdalny dostęp macOS](/pl/platforms/mac/remote).

## Reguły bezpieczeństwa (zdalnie/VPN)

W skrócie: **utrzymuj Gateway tylko przez loopback**, chyba że masz pewność, że potrzebujesz bindowania.

- **Loopback + SSH/Tailscale Serve** to najbezpieczniejsza wartość domyślna (brak publicznej ekspozycji).
- Jawny tekst `ws://` jest domyślnie tylko loopback. Dla zaufanych sieci prywatnych
  ustaw `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` w procesie klienta jako
  awaryjne obejście. Nie ma odpowiednika w `openclaw.json`; musi to być
  środowisko procesu klienta wykonującego połączenie WebSocket.
- **Bindowania inne niż loopback** (`lan`/`tailnet`/`custom` albo `auto`, gdy loopback jest niedostępny) muszą używać auth gatewaya: tokena, hasła albo reverse proxy świadomego tożsamości z `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` są źródłami poświadczeń klienta. Same z siebie **nie** konfigurują uwierzytelniania serwera.
- Lokalne ścieżki wywołań mogą używać `gateway.remote.*` jako fallbacku tylko wtedy, gdy `gateway.auth.*` jest nieustawione.
- Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nierozwiązane, rozwiązywanie kończy się bezpiecznym błędem (bez maskującego zdalnego fallbacku).
- `gateway.remote.tlsFingerprint` przypina zdalny certyfikat TLS podczas używania `wss://`.
- **Tailscale Serve** może uwierzytelniać ruch Control UI/WebSocket przez nagłówki tożsamości,
  gdy `gateway.auth.allowTailscale: true`; punkty końcowe HTTP API nie używają
  tego uwierzytelniania nagłówkiem Tailscale i zamiast tego podążają za normalnym
  trybem auth HTTP gatewaya. Ten przepływ bez tokena zakłada, że host gatewaya jest zaufany. Ustaw go na
  `false`, jeśli chcesz wszędzie uwierzytelniania współdzielonym sekretem.
- Auth **trusted-proxy** domyślnie oczekuje konfiguracji reverse proxy świadomego tożsamości poza loopback.
  Reverse proxy loopback na tym samym hoście wymaga jawnego `gateway.auth.trustedProxy.allowLoopback = true`.
- Traktuj kontrolę z przeglądarki jak dostęp operatora: tylko tailnet + celowe parowanie węzła.

Szczegóły: [Bezpieczeństwo](/pl/gateway/security).

### macOS: trwały tunel SSH przez LaunchAgent

Dla klientów macOS łączących się ze zdalnym gatewayem najłatwiejsza trwała konfiguracja używa wpisu konfiguracji SSH `LocalForward` oraz LaunchAgent, aby utrzymać tunel przy życiu między restartami i awariami.

#### Krok 1: dodaj konfigurację SSH

Edytuj `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Zastąp `<REMOTE_IP>` i `<REMOTE_USER>` swoimi wartościami.

#### Krok 2: skopiuj klucz SSH (jednorazowo)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Krok 3: skonfiguruj token gatewaya

Zapisz token w konfiguracji, aby przetrwał restarty:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Krok 4: utwórz LaunchAgent

Zapisz to jako `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### Krok 5: załaduj LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Tunel uruchomi się automatycznie przy logowaniu, zrestartuje po awarii i utrzyma przekierowany port aktywny.

<Note>
Jeśli masz pozostały LaunchAgent `com.openclaw.ssh-tunnel` ze starszej konfiguracji, wyładuj go i usuń.
</Note>

#### Rozwiązywanie problemów

Sprawdź, czy tunel działa:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Uruchom tunel ponownie:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Zatrzymaj tunel:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Wpis konfiguracji                    | Co robi                                                      |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Przekierowuje lokalny port 18789 na zdalny port 18789        |
| `ssh -N`                             | SSH bez wykonywania zdalnych poleceń (tylko przekierowanie portów) |
| `KeepAlive`                          | Automatycznie restartuje tunel, jeśli ulegnie awarii         |
| `RunAtLoad`                          | Uruchamia tunel, gdy LaunchAgent ładuje się przy logowaniu   |

## Powiązane

- [Tailscale](/pl/gateway/tailscale)
- [Uwierzytelnianie](/pl/gateway/authentication)
- [Konfiguracja zdalnego gatewaya](/pl/gateway/remote-gateway-readme)
