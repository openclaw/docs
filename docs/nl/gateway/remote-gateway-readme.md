---
read_when: Connecting the macOS app to a remote gateway over SSH
summary: SSH-tunnelconfiguratie voor OpenClaw.app die verbinding maakt met een externe Gateway
title: Externe Gateway instellen
x-i18n:
    generated_at: "2026-04-29T22:47:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: fccc75e672bf3295c335fc4d2f610e9cbb3f1882edd12ffb9d009120291bd2d9
    source_path: gateway/remote-gateway-readme.md
    workflow: 16
---

> Deze inhoud is samengevoegd in [Externe toegang](/nl/gateway/remote#macos-persistent-ssh-tunnel-via-launchagent). Zie die pagina voor de huidige handleiding.

# OpenClaw.app uitvoeren met een externe Gateway

OpenClaw.app gebruikt SSH-tunneling om verbinding te maken met een externe Gateway. Deze handleiding laat zien hoe je dit instelt.

## Overzicht

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

## Snelle configuratie

### Stap 1: SSH-configuratie toevoegen

Bewerk `~/.ssh/config` en voeg toe:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>          # e.g., 172.27.187.184
    User <REMOTE_USER>            # e.g., jefferson
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Vervang `<REMOTE_IP>` en `<REMOTE_USER>` door je eigen waarden.

### Stap 2: SSH-sleutel kopiëren

Kopieer je openbare sleutel naar de externe machine (voer het wachtwoord één keer in):

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

### Stap 3: Authenticatie voor externe Gateway configureren

```bash
openclaw config set gateway.remote.token "<your-token>"
```

Gebruik in plaats daarvan `gateway.remote.password` als je externe Gateway wachtwoordauthenticatie gebruikt.
`OPENCLAW_GATEWAY_TOKEN` is nog steeds geldig als override op shellniveau, maar de duurzame
configuratie voor externe clients is `gateway.remote.token` / `gateway.remote.password`.

### Stap 4: SSH-tunnel starten

```bash
ssh -N remote-gateway &
```

### Stap 5: OpenClaw.app opnieuw starten

```bash
# Quit OpenClaw.app (⌘Q), then reopen:
open /path/to/OpenClaw.app
```

De app maakt nu via de SSH-tunnel verbinding met de externe Gateway.

---

## Tunnel automatisch starten bij inloggen

Maak een Launch Agent aan om de SSH-tunnel automatisch te laten starten wanneer je inlogt.

### Het PLIST-bestand maken

Sla dit op als `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

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

### De Launch Agent laden

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

De tunnel zal nu:

- Automatisch starten wanneer je inlogt
- Opnieuw starten als deze crasht
- Op de achtergrond blijven draaien

Legacy-opmerking: verwijder eventuele overgebleven `com.openclaw.ssh-tunnel` LaunchAgent als die aanwezig is.

---

## Problemen oplossen

**Controleren of de tunnel draait:**

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

**De tunnel opnieuw starten:**

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

**De tunnel stoppen:**

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

---

## Hoe het werkt

| Component                            | Wat het doet                                                 |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Stuurt lokale poort 18789 door naar externe poort 18789      |
| `ssh -N`                             | SSH zonder externe opdrachten uit te voeren (alleen poortdoorschakeling) |
| `KeepAlive`                          | Start de tunnel automatisch opnieuw als deze crasht          |
| `RunAtLoad`                          | Start de tunnel wanneer de agent wordt geladen               |

OpenClaw.app maakt verbinding met `ws://127.0.0.1:18789` op je clientmachine. De SSH-tunnel stuurt die verbinding door naar poort 18789 op de externe machine waarop de Gateway draait.

## Gerelateerd

- [Externe toegang](/nl/gateway/remote)
- [Tailscale](/nl/gateway/tailscale)
