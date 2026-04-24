---
read_when:
    - Uruchamianie lub rozwiązywanie problemów ze zdalnymi konfiguracjami Gateway
summary: Dostęp zdalny przy użyciu tuneli SSH (Gateway WS) i tailnetów
title: Dostęp zdalny
x-i18n:
    generated_at: "2026-04-24T09:11:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66eebbe3762134f29f982201d7e79a789624b96042bd931e07d9855710d64bfe
    source_path: gateway/remote.md
    workflow: 15
---

# Dostęp zdalny (SSH, tunele i tailnety)

To repozytorium obsługuje scenariusz „zdalnie przez SSH”, utrzymując jeden Gateway (główny) uruchomiony na dedykowanym hoście (desktop/serwer) i łącząc z nim klientów.

- Dla **operatorów (Ty / aplikacja macOS)**: tunelowanie SSH jest uniwersalnym rozwiązaniem awaryjnym.
- Dla **Node (iOS/Android i przyszłe urządzenia)**: łącz się z **WebSocket** Gateway (LAN/tailnet lub tunel SSH, jeśli potrzeba).

## Główna idea

- WebSocket Gateway wiąże się z **loopback** na skonfigurowanym porcie (domyślnie 18789).
- Do użytku zdalnego przekierowujesz ten port loopback przez SSH (lub używasz tailnet/VPN i tunelujesz mniej).

## Typowe konfiguracje VPN/tailnet (gdzie żyje agent)

Myśl o **hoście Gateway** jako o miejscu, „gdzie żyje agent”. To on jest właścicielem sesji, profili auth, kanałów i stanu.
Twój laptop/desktop (oraz Node) łączą się z tym hostem.

### 1) Gateway zawsze aktywny w Twoim tailnet (VPS lub serwer domowy)

Uruchom Gateway na trwałym hoście i uzyskuj do niego dostęp przez **Tailscale** lub SSH.

- **Najlepszy UX:** pozostaw `gateway.bind: "loopback"` i użyj **Tailscale Serve** dla Control UI.
- **Awaryjnie:** pozostaw loopback + tunel SSH z dowolnej maszyny, która potrzebuje dostępu.
- **Przykłady:** [exe.dev](/pl/install/exe-dev) (łatwa VM) lub [Hetzner](/pl/install/hetzner) (produkcyjny VPS).

To idealne rozwiązanie, gdy Twój laptop często przechodzi w uśpienie, ale chcesz, aby agent był zawsze aktywny.

### 2) Domowy desktop uruchamia Gateway, laptop jest zdalnym sterowaniem

Laptop **nie** uruchamia agenta. Łączy się zdalnie:

- Użyj trybu **Remote over SSH** w aplikacji macOS (Settings → General → „OpenClaw runs”).
- Aplikacja otwiera i zarządza tunelem, więc WebChat + kontrole zdrowia „po prostu działają”.

Procedura: [zdalny dostęp macOS](/pl/platforms/mac/remote).

### 3) Laptop uruchamia Gateway, zdalny dostęp z innych maszyn

Pozostaw Gateway lokalnie, ale udostępniaj go bezpiecznie:

- Tunel SSH do laptopa z innych maszyn, lub
- Udostępnij Control UI przez Tailscale Serve i pozostaw Gateway tylko na loopback.

Przewodnik: [Tailscale](/pl/gateway/tailscale) i [Przegląd Web](/pl/web).

## Przepływ poleceń (co działa gdzie)

Jedna usługa Gateway jest właścicielem stanu + kanałów. Node są urządzeniami peryferyjnymi.

Przykładowy przepływ (Telegram → Node):

- Wiadomość Telegram dociera do **Gateway**.
- Gateway uruchamia **agenta** i decyduje, czy wywołać narzędzie Node.
- Gateway wywołuje **Node** przez WebSocket Gateway (`node.*` RPC).
- Node zwraca wynik; Gateway odsyła odpowiedź do Telegram.

Uwagi:

- **Node nie uruchamiają usługi Gateway.** Na hosta powinien działać tylko jeden gateway, chyba że celowo uruchamiasz izolowane profile (zobacz [Wiele Gateway](/pl/gateway/multiple-gateways)).
- Tryb „node mode” aplikacji macOS to po prostu klient Node przez WebSocket Gateway.

## Tunel SSH (CLI + narzędzia)

Utwórz lokalny tunel do zdalnego WS Gateway:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Po uruchomieniu tunelu:

- `openclaw health` i `openclaw status --deep` docierają teraz do zdalnego gateway przez `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` i `openclaw gateway call` mogą również kierować ruch do przekazanego URL przez `--url`, gdy jest to potrzebne.

Uwaga: zastąp `18789` swoim skonfigurowanym `gateway.port` (lub `--port`/`OPENCLAW_GATEWAY_PORT`).
Uwaga: gdy przekazujesz `--url`, CLI nie wraca do poświadczeń z konfiguracji ani środowiska.
Dołącz jawnie `--token` lub `--password`. Brak jawnych poświadczeń jest błędem.

## Zdalne ustawienia domyślne CLI

Możesz zapisać zdalny cel, aby polecenia CLI używały go domyślnie:

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

## Priorytet poświadczeń

Rozwiązywanie poświadczeń Gateway jest zgodne z jednym współdzielonym kontraktem na ścieżkach call/probe/status oraz monitorowaniu zatwierdzeń exec Discord. Node-host używa tego samego bazowego kontraktu z jednym wyjątkiem dla trybu lokalnego (celowo ignoruje `gateway.remote.*`):

- Jawne poświadczenia (`--token`, `--password` lub narzędzie `gatewayToken`) zawsze wygrywają na ścieżkach call, które akceptują jawne auth.
- Bezpieczeństwo nadpisania URL:
  - Nadpisania URL CLI (`--url`) nigdy nie używają ponownie niejawnych poświadczeń z config/env.
  - Nadpisania URL przez env (`OPENCLAW_GATEWAY_URL`) mogą używać tylko poświadczeń env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Domyślne ustawienia trybu lokalnego:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (awaryjny powrót do remote ma zastosowanie tylko wtedy, gdy lokalne wejście tokenu auth nie jest ustawione)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (awaryjny powrót do remote ma zastosowanie tylko wtedy, gdy lokalne wejście hasła auth nie jest ustawione)
- Domyślne ustawienia trybu zdalnego:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Wyjątek lokalnego trybu Node-host: `gateway.remote.token` / `gateway.remote.password` są ignorowane.
- Zdalne sprawdzanie tokenu probe/status jest domyślnie ścisłe: używa tylko `gateway.remote.token` (bez awaryjnego powrotu do lokalnego tokenu) przy kierowaniu do trybu zdalnego.
- Nadpisania env Gateway używają wyłącznie `OPENCLAW_GATEWAY_*`.

## Interfejs czatu przez SSH

WebChat nie używa już osobnego portu HTTP. Interfejs czatu SwiftUI łączy się bezpośrednio z WebSocket Gateway.

- Przekieruj `18789` przez SSH (zobacz wyżej), a następnie łącz klientów z `ws://127.0.0.1:18789`.
- Na macOS preferuj tryb „Remote over SSH” w aplikacji, który automatycznie zarządza tunelem.

## Aplikacja macOS „Remote over SSH”

Aplikacja macOS w pasku menu może obsługiwać tę samą konfigurację end-to-end (zdalne kontrole statusu, WebChat i przekazywanie Voice Wake).

Procedura: [zdalny dostęp macOS](/pl/platforms/mac/remote).

## Reguły bezpieczeństwa (remote/VPN)

Krótka wersja: **utrzymuj Gateway tylko na loopback**, chyba że masz pewność, że potrzebujesz powiązania.

- **Loopback + SSH/Tailscale Serve** to najbezpieczniejsza wartość domyślna (brak publicznej ekspozycji).
- Nieszyfrowane `ws://` jest domyślnie ograniczone do loopback. Dla zaufanych sieci prywatnych
  ustaw `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` w procesie klienta jako
  awaryjny przełącznik. Nie ma odpowiednika w `openclaw.json`; musi to być
  środowisko procesu klienta wykonującego połączenie WebSocket.
- **Powiązania poza loopback** (`lan`/`tailnet`/`custom` lub `auto`, gdy loopback jest niedostępny) muszą używać uwierzytelniania gateway: tokenu, hasła lub proxy świadomego tożsamości z `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` to źródła poświadczeń klienta. Same z siebie **nie** konfigurują uwierzytelniania serwera.
- Lokalne ścieżki call mogą używać `gateway.remote.*` jako awaryjnego powrotu tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
- Jeśli `gateway.auth.token` / `gateway.auth.password` są jawnie skonfigurowane przez SecretRef i nierozwiązane, rozwiązywanie kończy się bezpieczną odmową (bez maskującego awaryjnego powrotu do remote).
- `gateway.remote.tlsFingerprint` przypina zdalny certyfikat TLS przy użyciu `wss://`.
- **Tailscale Serve** może uwierzytelniać ruch Control UI/WebSocket przez nagłówki tożsamości, gdy `gateway.auth.allowTailscale: true`; punkty końcowe HTTP API nie
  używają tego uwierzytelniania przez nagłówki Tailscale i zamiast tego podążają za zwykłym trybem HTTP auth gateway. Ten beztokenowy przepływ zakłada, że host gateway jest zaufany. Ustaw `false`, jeśli chcesz współdzielonego sekretu wszędzie.
- Uwierzytelnianie **trusted-proxy** jest przeznaczone tylko dla konfiguracji świadomych tożsamości proxy poza loopback.
  Proxy loopback na tym samym hoście nie spełniają wymagań `gateway.auth.mode: "trusted-proxy"`.
- Traktuj sterowanie przeglądarką jak dostęp operatora: tylko tailnet + świadome parowanie Node.

Szczegóły: [Bezpieczeństwo](/pl/gateway/security).

### macOS: trwały tunel SSH przez LaunchAgent

Dla klientów macOS łączących się ze zdalnym gateway najłatwiejsza trwała konfiguracja używa wpisu SSH `LocalForward` oraz LaunchAgent, który utrzymuje tunel przy życiu po restartach i awariach.

#### Krok 1: dodaj konfigurację SSH

Edytuj `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Zastąp `<REMOTE_IP>` i `<REMOTE_USER>` własnymi wartościami.

#### Krok 2: skopiuj klucz SSH (jednorazowo)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Krok 3: skonfiguruj token gateway

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

Tunel uruchomi się automatycznie przy logowaniu, uruchomi ponownie po awarii i utrzyma aktywny przekierowany port.

Uwaga: jeśli masz pozostały LaunchAgent `com.openclaw.ssh-tunnel` ze starszej konfiguracji, wyładuj go i usuń.

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

| Wpis konfiguracji                      | Co robi                                                      |
| -------------------------------------- | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789`   | Przekierowuje lokalny port 18789 na zdalny port 18789        |
| `ssh -N`                               | SSH bez wykonywania zdalnych poleceń (tylko przekierowanie portu) |
| `KeepAlive`                            | Automatycznie uruchamia ponownie tunel po awarii             |
| `RunAtLoad`                            | Uruchamia tunel przy ładowaniu LaunchAgent podczas logowania |

## Powiązane

- [Tailscale](/pl/gateway/tailscale)
- [Uwierzytelnianie](/pl/gateway/authentication)
- [Konfiguracja zdalnego gateway](/pl/gateway/remote-gateway-readme)
