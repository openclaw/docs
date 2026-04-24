---
read_when: Connecting the macOS app to a remote gateway over SSH
summary: Konfiguracja tunelu SSH dla OpenClaw.app łączącego się ze zdalnym gateway
title: Konfiguracja zdalnego gateway
x-i18n:
    generated_at: "2026-04-24T09:11:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc5df551839db87a36be7c1b29023c687c418d13337075490436335a8bb1635d
    source_path: gateway/remote-gateway-readme.md
    workflow: 15
---

> Ta treść została scalona do [Remote Access](/pl/gateway/remote#macos-persistent-ssh-tunnel-via-launchagent). Aktualny przewodnik znajdziesz na tej stronie.

# Uruchamianie OpenClaw.app ze zdalnym gateway

OpenClaw.app używa tunelowania SSH do łączenia się ze zdalnym gateway. Ten przewodnik pokazuje, jak to skonfigurować.

## Przegląd

```mermaid
flowchart TB
    subgraph Client["Client Machine"]
        direction TB
        A["OpenClaw.app"]
        B["ws://127.0.0.1:18789\n(local port)"]
        T["SSH Tunnel"]

        A --> B
        B --> T
    end
    subgraph Remote["Remote Machine"]
        direction TB
        C["Gateway WebSocket"]
        D["ws://127.0.0.1:18789"]

        C --> D
    end
    T --> C
```

## Szybka konfiguracja

### Krok 1: Dodaj konfigurację SSH

Edytuj `~/.ssh/config` i dodaj:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>          # e.g., 172.27.187.184
    User <REMOTE_USER>            # e.g., jefferson
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Zastąp `<REMOTE_IP>` i `<REMOTE_USER>` własnymi wartościami.

### Krok 2: Skopiuj klucz SSH

Skopiuj swój klucz publiczny na zdalną maszynę (wpisz hasło raz):

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

### Krok 3: Skonfiguruj auth zdalnego Gateway

```bash
openclaw config set gateway.remote.token "<your-token>"
```

Użyj zamiast tego `gateway.remote.password`, jeśli zdalny gateway używa auth hasłem.
`OPENCLAW_GATEWAY_TOKEN` nadal działa jako nadpisanie na poziomie powłoki, ale trwała
konfiguracja klienta zdalnego to `gateway.remote.token` / `gateway.remote.password`.

### Krok 4: Uruchom tunel SSH

```bash
ssh -N remote-gateway &
```

### Krok 5: Uruchom ponownie OpenClaw.app

```bash
# Quit OpenClaw.app (⌘Q), then reopen:
open /path/to/OpenClaw.app
```

Aplikacja połączy się teraz ze zdalnym gateway przez tunel SSH.

---

## Automatyczne uruchamianie tunelu przy logowaniu

Aby tunel SSH uruchamiał się automatycznie po zalogowaniu, utwórz Launch Agent.

### Utwórz plik PLIST

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

### Załaduj Launch Agent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Tunel będzie teraz:

- uruchamiał się automatycznie po zalogowaniu
- restartował się po awarii
- działał w tle

Uwaga dotycząca starszych konfiguracji: usuń pozostały LaunchAgent `com.openclaw.ssh-tunnel`, jeśli istnieje.

---

## Rozwiązywanie problemów

**Sprawdź, czy tunel działa:**

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

**Uruchom tunel ponownie:**

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

**Zatrzymaj tunel:**

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

---

## Jak to działa

| Składnik                             | Co robi                                                      |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Przekierowuje lokalny port 18789 na zdalny port 18789        |
| `ssh -N`                             | SSH bez wykonywania zdalnych poleceń (tylko przekierowanie portu) |
| `KeepAlive`                          | Automatycznie restartuje tunel po awarii                     |
| `RunAtLoad`                          | Uruchamia tunel przy załadowaniu agenta                      |

OpenClaw.app łączy się z `ws://127.0.0.1:18789` na twojej maszynie klienckiej. Tunel SSH przekierowuje to połączenie na port 18789 na zdalnej maszynie, na której działa Gateway.

## Powiązane

- [Dostęp zdalny](/pl/gateway/remote)
- [Tailscale](/pl/gateway/tailscale)
