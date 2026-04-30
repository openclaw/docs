---
read_when: Connecting the macOS app to a remote gateway over SSH
summary: Konfiguracja tunelu SSH dla OpenClaw.app do łączenia ze zdalnym Gateway
title: Konfiguracja zdalnego Gateway
x-i18n:
    generated_at: "2026-04-30T09:55:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: fccc75e672bf3295c335fc4d2f610e9cbb3f1882edd12ffb9d009120291bd2d9
    source_path: gateway/remote-gateway-readme.md
    workflow: 16
---

> Ta treść została przeniesiona do [Zdalny dostęp](/pl/gateway/remote#macos-persistent-ssh-tunnel-via-launchagent). Aktualny przewodnik znajdziesz na tej stronie.

# Uruchamianie OpenClaw.app ze zdalnym Gateway

OpenClaw.app używa tunelowania SSH do łączenia się ze zdalnym Gateway. Ten przewodnik pokazuje, jak to skonfigurować.

## Omówienie

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

Zastąp `<REMOTE_IP>` i `<REMOTE_USER>` swoimi wartościami.

### Krok 2: Skopiuj klucz SSH

Skopiuj swój klucz publiczny na zdalną maszynę (wpisz hasło jeden raz):

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

### Krok 3: Skonfiguruj uwierzytelnianie zdalnego Gateway

```bash
openclaw config set gateway.remote.token "<your-token>"
```

Zamiast tego użyj `gateway.remote.password`, jeśli zdalny Gateway używa uwierzytelniania hasłem.
`OPENCLAW_GATEWAY_TOKEN` nadal jest prawidłowe jako nadpisanie na poziomie powłoki, ale trwała
konfiguracja zdalnego klienta to `gateway.remote.token` / `gateway.remote.password`.

### Krok 4: Uruchom tunel SSH

```bash
ssh -N remote-gateway &
```

### Krok 5: Uruchom ponownie OpenClaw.app

```bash
# Quit OpenClaw.app (⌘Q), then reopen:
open /path/to/OpenClaw.app
```

Aplikacja połączy się teraz ze zdalnym Gateway przez tunel SSH.

---

## Automatyczne uruchamianie tunelu przy logowaniu

Aby tunel SSH uruchamiał się automatycznie po zalogowaniu, utwórz agenta uruchamiania.

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

### Załaduj agenta uruchamiania

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Tunel będzie teraz:

- Uruchamiać się automatycznie po zalogowaniu
- Uruchamiać się ponownie po awarii
- Działać w tle

Uwaga dotycząca starszej konfiguracji: usuń wszelki pozostały LaunchAgent `com.openclaw.ssh-tunnel`, jeśli istnieje.

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

| Komponent                            | Co robi                                                      |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Przekierowuje lokalny port 18789 na zdalny port 18789        |
| `ssh -N`                             | SSH bez wykonywania zdalnych poleceń (tylko przekierowanie portów) |
| `KeepAlive`                          | Automatycznie uruchamia tunel ponownie, jeśli ulegnie awarii |
| `RunAtLoad`                          | Uruchamia tunel po załadowaniu agenta                        |

OpenClaw.app łączy się z `ws://127.0.0.1:18789` na maszynie klienta. Tunel SSH przekierowuje to połączenie do portu 18789 na zdalnej maszynie, na której działa Gateway.

## Powiązane

- [Zdalny dostęp](/pl/gateway/remote)
- [Tailscale](/pl/gateway/tailscale)
