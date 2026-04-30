---
read_when: Connecting the macOS app to a remote gateway over SSH
summary: SSH-Tunnel-Einrichtung für OpenClaw.app zur Verbindung mit einem entfernten Gateway
title: Remote-Gateway einrichten
x-i18n:
    generated_at: "2026-04-30T06:55:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: fccc75e672bf3295c335fc4d2f610e9cbb3f1882edd12ffb9d009120291bd2d9
    source_path: gateway/remote-gateway-readme.md
    workflow: 16
---

> Dieser Inhalt wurde in [Remotezugriff](/de/gateway/remote#macos-persistent-ssh-tunnel-via-launchagent) zusammengeführt. Die aktuelle Anleitung finden Sie auf dieser Seite.

# OpenClaw.app mit einem Remote-Gateway ausführen

OpenClaw.app verwendet SSH-Tunneling, um eine Verbindung zu einem Remote-Gateway herzustellen. Diese Anleitung zeigt Ihnen, wie Sie dies einrichten.

## Übersicht

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

## Schnelle Einrichtung

### Schritt 1: SSH-Konfiguration hinzufügen

Bearbeiten Sie `~/.ssh/config` und fügen Sie Folgendes hinzu:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>          # e.g., 172.27.187.184
    User <REMOTE_USER>            # e.g., jefferson
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Ersetzen Sie `<REMOTE_IP>` und `<REMOTE_USER>` durch Ihre Werte.

### Schritt 2: SSH-Schlüssel kopieren

Kopieren Sie Ihren öffentlichen Schlüssel auf den Remote-Rechner (Passwort einmal eingeben):

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

### Schritt 3: Authentifizierung für den Remote-Gateway konfigurieren

```bash
openclaw config set gateway.remote.token "<your-token>"
```

Verwenden Sie stattdessen `gateway.remote.password`, wenn Ihr Remote-Gateway Passwortauthentifizierung nutzt.
`OPENCLAW_GATEWAY_TOKEN` ist weiterhin als Override auf Shell-Ebene gültig, aber die dauerhafte Einrichtung
für Remote-Clients ist `gateway.remote.token` / `gateway.remote.password`.

### Schritt 4: SSH-Tunnel starten

```bash
ssh -N remote-gateway &
```

### Schritt 5: OpenClaw.app neu starten

```bash
# Quit OpenClaw.app (⌘Q), then reopen:
open /path/to/OpenClaw.app
```

Die App verbindet sich nun über den SSH-Tunnel mit dem Remote-Gateway.

---

## Tunnel beim Anmelden automatisch starten

Damit der SSH-Tunnel automatisch startet, wenn Sie sich anmelden, erstellen Sie einen Launch Agent.

### PLIST-Datei erstellen

Speichern Sie dies als `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

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

### Launch Agent laden

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Der Tunnel wird nun:

- Automatisch gestartet, wenn Sie sich anmelden
- Neu gestartet, wenn er abstürzt
- Im Hintergrund weiter ausgeführt

Hinweis zu älteren Versionen: Entfernen Sie alle verbliebenen `com.openclaw.ssh-tunnel`-LaunchAgents, falls vorhanden.

---

## Fehlerbehebung

**Prüfen, ob der Tunnel ausgeführt wird:**

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

**Tunnel neu starten:**

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

**Tunnel stoppen:**

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

---

## Funktionsweise

| Komponente                           | Funktion                                                     |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Leitet den lokalen Port 18789 an den Remote-Port 18789 weiter |
| `ssh -N`                             | SSH ohne Ausführen von Remote-Befehlen (nur Portweiterleitung) |
| `KeepAlive`                          | Startet den Tunnel automatisch neu, wenn er abstürzt         |
| `RunAtLoad`                          | Startet den Tunnel, wenn der Agent geladen wird              |

OpenClaw.app verbindet sich auf Ihrem Client-Rechner mit `ws://127.0.0.1:18789`. Der SSH-Tunnel leitet diese Verbindung an Port 18789 auf dem Remote-Rechner weiter, auf dem der Gateway ausgeführt wird.

## Verwandte Themen

- [Remotezugriff](/de/gateway/remote)
- [Tailscale](/de/gateway/tailscale)
