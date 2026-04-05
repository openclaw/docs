---
read_when: Connecting the macOS app to a remote gateway over SSH
summary: Konfiguracja tunelu SSH dla OpenClaw.app łączącego się ze zdalnym gateway
title: Konfiguracja zdalnego Gateway
x-i18n:
    generated_at: "2026-04-05T13:54:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55467956a3473fa36709715f017369471428f7566132f7feb47581caa98b4600
    source_path: gateway/remote-gateway-readme.md
    workflow: 15
---

> Ta treść została scalona z [Zdalny dostęp](/gateway/remote#macos-persistent-ssh-tunnel-via-launchagent). Aktualny przewodnik znajdziesz na tej stronie.

# Uruchamianie OpenClaw.app ze zdalnym Gateway

OpenClaw.app używa tunelowania SSH do łączenia się ze zdalnym gateway. Ten przewodnik pokazuje, jak to skonfigurować.

## Przegląd

```mermaid
flowchart TB
    subgraph Client["Maszyna kliencka"]
        direction TB
        A["OpenClaw.app"]
        B["ws://127.0.0.1:18789\n(port lokalny)"]
        T["Tunel SSH"]

        A --> B
        B --> T
    end
    subgraph Remote["Maszyna zdalna"]
        direction TB
        C["WebSocket Gateway"]
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
    HostName <REMOTE_IP>          # np. 172.27.187.184
    User <REMOTE_USER>            # np. jefferson
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Zastąp `<REMOTE_IP>` i `<REMOTE_USER>` własnymi wartościami.

### Krok 2: Skopiuj klucz SSH

Skopiuj swój klucz publiczny na zdalną maszynę (hasło wpiszesz raz):

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

### Krok 3: Skonfiguruj uwierzytelnianie zdalnego Gateway

```bash
openclaw config set gateway.remote.token "<your-token>"
```

Użyj zamiast tego `gateway.remote.password`, jeśli zdalny gateway używa uwierzytelniania hasłem.
`OPENCLAW_GATEWAY_TOKEN` nadal działa jako nadpisanie na poziomie powłoki, ale trwała
konfiguracja klienta zdalnego to `gateway.remote.token` / `gateway.remote.password`.

### Krok 4: Uruchom tunel SSH

```bash
ssh -N remote-gateway &
```

### Krok 5: Uruchom ponownie OpenClaw.app

```bash
# Zamknij OpenClaw.app (⌘Q), a następnie otwórz ponownie:
open /path/to/OpenClaw.app
```

Aplikacja będzie teraz łączyć się ze zdalnym gateway przez tunel SSH.

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

- Uruchamiał się automatycznie po zalogowaniu
- Uruchamiał się ponownie po awarii
- Działał w tle

Uwaga dotycząca starszej konfiguracji: usuń wszelkie pozostałości `com.openclaw.ssh-tunnel` LaunchAgent, jeśli istnieją.

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
| `KeepAlive`                          | Automatycznie restartuje tunel po awarii                     |
| `RunAtLoad`                          | Uruchamia tunel przy załadowaniu agenta                      |

OpenClaw.app łączy się z `ws://127.0.0.1:18789` na maszynie klienckiej. Tunel SSH przekierowuje to połączenie na port 18789 na zdalnej maszynie, na której działa Gateway.
