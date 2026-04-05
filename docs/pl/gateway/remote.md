---
read_when:
    - Uruchamiasz zdalne konfiguracje gateway lub rozwiązujesz ich problemy
summary: Dostęp zdalny z użyciem tuneli SSH (Gateway WS) i tailnetów
title: Dostęp zdalny
x-i18n:
    generated_at: "2026-04-05T13:54:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8596fa2a7fd44117dfe92b70c9d8f28c0e16d7987adf0d0769a9eff71d5bc081
    source_path: gateway/remote.md
    workflow: 15
---

# Dostęp zdalny (SSH, tunele i tailnety)

To repo obsługuje „zdalnie przez SSH” przez utrzymywanie pojedynczego Gateway (głównego) uruchomionego na dedykowanym hoście (desktop/serwer) i łączenie z nim klientów.

- Dla **operatorów (Ciebie / aplikacji macOS)**: tunelowanie SSH to uniwersalny mechanizm zapasowy.
- Dla **węzłów (iOS/Android i przyszłe urządzenia)**: łącz się z gateway **WebSocket** (LAN/tailnet lub tunel SSH, jeśli to potrzebne).

## Główna idea

- Gateway WebSocket nasłuchuje na **local loopback** na skonfigurowanym porcie (domyślnie 18789).
- Do użycia zdalnego przekazujesz ten port local loopback przez SSH (lub używasz tailnetu/VPN i tunelujesz mniej).

## Typowe konfiguracje VPN/tailnet (gdzie znajduje się agent)

Myśl o **hoście Gateway** jako o miejscu „gdzie znajduje się agent”. To on zarządza sesjami, profilami uwierzytelniania, kanałami i stanem.
Twój laptop/desktop (oraz węzły) łączą się z tym hostem.

### 1) Zawsze aktywny Gateway w Twoim tailnecie (VPS lub serwer domowy)

Uruchom Gateway na trwałym hoście i uzyskuj do niego dostęp przez **Tailscale** lub SSH.

- **Najlepszy UX:** ustaw `gateway.bind: "loopback"` i użyj **Tailscale Serve** dla Control UI.
- **Mechanizm zapasowy:** pozostaw loopback + tunel SSH z każdej maszyny, która potrzebuje dostępu.
- **Przykłady:** [exe.dev](/install/exe-dev) (prosta VM) lub [Hetzner](/install/hetzner) (produkcyjny VPS).

To jest idealne, gdy laptop często usypia, ale chcesz, aby agent był zawsze aktywny.

### 2) Domowy desktop uruchamia Gateway, laptop służy do zdalnego sterowania

Laptop **nie** uruchamia agenta. Łączy się zdalnie:

- Użyj trybu aplikacji macOS **Remote over SSH** (Ustawienia → Ogólne → „OpenClaw runs”).
- Aplikacja otwiera i zarządza tunelem, więc WebChat + kontrole stanu „po prostu działają”.

Instrukcja: [zdalny dostęp macOS](/platforms/mac/remote).

### 3) Laptop uruchamia Gateway, zdalny dostęp z innych maszyn

Zachowaj Gateway lokalnie, ale udostępnij go bezpiecznie:

- tunel SSH do laptopa z innych maszyn, albo
- Tailscale Serve dla Control UI i pozostawienie Gateway dostępnego tylko przez loopback.

Przewodnik: [Tailscale](/gateway/tailscale) i [przegląd Web](/web).

## Przepływ poleceń (co działa gdzie)

Jedna usługa gateway zarządza stanem + kanałami. Węzły są urządzeniami peryferyjnymi.

Przykładowy przepływ (Telegram → węzeł):

- Wiadomość Telegram trafia do **Gateway**.
- Gateway uruchamia **agenta** i decyduje, czy wywołać narzędzie węzła.
- Gateway wywołuje **węzeł** przez Gateway WebSocket (`node.*` RPC).
- Węzeł zwraca wynik; Gateway odsyła odpowiedź do Telegrama.

Uwagi:

- **Węzły nie uruchamiają usługi gateway.** Na host powinien przypadać tylko jeden gateway, chyba że celowo uruchamiasz odizolowane profile (zobacz [Wiele gateway](/gateway/multiple-gateways)).
- „Tryb węzła” w aplikacji macOS to po prostu klient węzła przez Gateway WebSocket.

## Tunel SSH (CLI + narzędzia)

Utwórz lokalny tunel do zdalnego Gateway WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Po uruchomieniu tunelu:

- `openclaw health` i `openclaw status --deep` docierają teraz do zdalnego gateway przez `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` i `openclaw gateway call` mogą też kierować ruch do przekazanego URL przez `--url`, gdy jest to potrzebne.

Uwaga: zastąp `18789` swoją skonfigurowaną wartością `gateway.port` (lub `--port`/`OPENCLAW_GATEWAY_PORT`).
Uwaga: gdy przekazujesz `--url`, CLI nie używa zapasowo poświadczeń z konfiguracji ani środowiska.
Jawnie dołącz `--token` lub `--password`. Brak jawnych poświadczeń jest błędem.

## Domyślne ustawienia zdalne CLI

Możesz utrwalić cel zdalny, aby polecenia CLI domyślnie go używały:

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

## Pierwszeństwo poświadczeń

Rozwiązywanie poświadczeń gateway opiera się na jednym współdzielonym kontrakcie dla ścieżek call/probe/status oraz monitorowania zatwierdzeń exec w Discord. Host węzła używa tego samego bazowego kontraktu z jednym wyjątkiem dla trybu lokalnego (celowo ignoruje `gateway.remote.*`):

- Jawne poświadczenia (`--token`, `--password` lub narzędzie `gatewayToken`) zawsze mają pierwszeństwo w ścieżkach wywołań, które akceptują jawne uwierzytelnianie.
- Bezpieczeństwo nadpisania URL:
  - Nadpisania URL CLI (`--url`) nigdy nie używają ponownie niejawnych poświadczeń z konfiguracji/env.
  - Nadpisania URL przez env (`OPENCLAW_GATEWAY_URL`) mogą używać tylko poświadczeń z env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Domyślne ustawienia trybu lokalnego:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (fallback zdalny ma zastosowanie tylko wtedy, gdy lokalne wejście tokena uwierzytelniania nie jest ustawione)
  - hasło: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (fallback zdalny ma zastosowanie tylko wtedy, gdy lokalne wejście hasła uwierzytelniania nie jest ustawione)
- Domyślne ustawienia trybu zdalnego:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - hasło: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Wyjątek hosta węzła w trybie lokalnym: `gateway.remote.token` / `gateway.remote.password` są ignorowane.
- Zdalne kontrole tokena probe/status są domyślnie ścisłe: używają tylko `gateway.remote.token` (bez fallbacku do lokalnego tokena) przy kierowaniu do trybu zdalnego.
- Nadpisania env gateway używają tylko `OPENCLAW_GATEWAY_*`.

## Interfejs czatu przez SSH

WebChat nie używa już oddzielnego portu HTTP. Interfejs czatu SwiftUI łączy się bezpośrednio z Gateway WebSocket.

- Przekaż port `18789` przez SSH (zobacz wyżej), a następnie połącz klientów z `ws://127.0.0.1:18789`.
- W systemie macOS preferuj tryb aplikacji „Remote over SSH”, który zarządza tunelem automatycznie.

## Aplikacja macOS „Remote over SSH”

Aplikacja paska menu macOS może obsłużyć tę samą konfigurację end-to-end (zdalne sprawdzanie stanu, WebChat i przekazywanie Voice Wake).

Instrukcja: [zdalny dostęp macOS](/platforms/mac/remote).

## Zasady bezpieczeństwa (zdalnie/VPN)

Krótko: **utrzymuj Gateway dostępny tylko przez loopback**, chyba że masz pewność, że potrzebujesz bind.

- **Loopback + SSH/Tailscale Serve** to najbezpieczniejsza wartość domyślna (brak publicznej ekspozycji).
- Niejawnie szyfrowane `ws://` jest domyślnie ograniczone do loopback. Dla zaufanych sieci prywatnych
  ustaw `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` w procesie klienta jako rozwiązanie awaryjne.
- **Bindowanie poza loopback** (`lan`/`tailnet`/`custom` lub `auto`, gdy loopback jest niedostępny) musi używać uwierzytelniania gateway: tokenu, hasła albo reverse proxy uwzględniającego tożsamość z `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` są źródłami poświadczeń klienta. Same z siebie **nie** konfigurują uwierzytelniania serwera.
- Lokalne ścieżki wywołań mogą używać `gateway.remote.*` jako fallback tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
- Jeśli `gateway.auth.token` / `gateway.auth.password` są jawnie skonfigurowane przez SecretRef i nierozwiązane, rozwiązywanie kończy się bezpieczną odmową (bez maskowania przez zdalny fallback).
- `gateway.remote.tlsFingerprint` przypina zdalny certyfikat TLS przy użyciu `wss://`.
- **Tailscale Serve** może uwierzytelniać ruch Control UI/WebSocket przez nagłówki tożsamości, gdy `gateway.auth.allowTailscale: true`; endpointy HTTP API nie używają tego uwierzytelniania nagłówkami Tailscale i zamiast tego stosują zwykły tryb uwierzytelniania HTTP gateway. Ten przepływ bez tokena zakłada, że host gateway jest zaufany. Ustaw `false`, jeśli chcesz uwierzytelniania współdzielonym sekretem wszędzie.
- Uwierzytelnianie **trusted-proxy** jest przeznaczone tylko dla konfiguracji proxy uwzględniających tożsamość poza loopback.
  Reverse proxy z loopback na tym samym hoście nie spełniają wymagań `gateway.auth.mode: "trusted-proxy"`.
- Traktuj sterowanie przeglądarką jak dostęp operatora: tylko tailnet + celowe parowanie węzłów.

Dogłębnie: [Bezpieczeństwo](/gateway/security).

### macOS: trwały tunel SSH przez LaunchAgent

Dla klientów macOS łączących się ze zdalnym gateway najłatwiejsza trwała konfiguracja używa wpisu SSH `LocalForward` oraz LaunchAgent, aby utrzymać tunel przy życiu po restartach i awariach.

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

Zapisz token w konfiguracji, aby był trwały po restartach:

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

Tunel będzie uruchamiany automatycznie przy logowaniu, restartowany po awarii i utrzymywał przekazany port aktywny.

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

| Wpis konfiguracji                     | Co robi                                                      |
| ------------------------------------- | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789`  | Przekazuje lokalny port 18789 na zdalny port 18789           |
| `ssh -N`                              | SSH bez wykonywania zdalnych poleceń (tylko przekazywanie portów) |
| `KeepAlive`                           | Automatycznie restartuje tunel, jeśli ulegnie awarii         |
| `RunAtLoad`                           | Uruchamia tunel przy załadowaniu LaunchAgent podczas logowania |
