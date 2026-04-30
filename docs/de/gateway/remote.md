---
read_when:
    - Remote-Gateway-Setups betreiben oder Fehler beheben
summary: Remotezugriff über SSH-Tunnel (Gateway WS) und Tailnets
title: Remote-Zugriff
x-i18n:
    generated_at: "2026-04-30T06:56:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 116ffba71801d3363eba293997ee4a5c8ad083a82298e57e68f678510263650a
    source_path: gateway/remote.md
    workflow: 16
---

Dieses Repo unterstützt „Remote über SSH“, indem ein einzelner Gateway (der Master) auf einem dedizierten Host (Desktop/Server) ausgeführt wird und Clients damit verbunden werden.

- Für **Operatoren (Sie / die macOS-App)**: SSH-Tunneling ist der universelle Fallback.
- Für **Nodes (iOS/Android und zukünftige Geräte)**: Verbindung zum Gateway-**WebSocket** herstellen (LAN/Tailnet oder SSH-Tunnel nach Bedarf).

## Die Grundidee

- Der Gateway-WebSocket bindet auf Ihrem konfigurierten Port an **Loopback** (Standard: 18789).
- Für Remote-Nutzung leiten Sie diesen Loopback-Port über SSH weiter (oder verwenden ein Tailnet/VPN und tunneln weniger).

## Häufige VPN- und Tailnet-Setups

Betrachten Sie den **Gateway-Host** als den Ort, an dem der Agent lebt. Er besitzt Sitzungen, Auth-Profile, Kanäle und Zustand. Ihr Laptop, Desktop und Ihre Nodes verbinden sich mit diesem Host.

### Immer aktiver Gateway in Ihrem Tailnet

Führen Sie den Gateway auf einem persistenten Host aus (VPS oder Heimserver) und erreichen Sie ihn über **Tailscale** oder SSH.

- **Beste UX:** Behalten Sie `gateway.bind: "loopback"` bei und verwenden Sie **Tailscale Serve** für die Control UI.
- **Fallback:** Loopback beibehalten plus SSH-Tunnel von jedem Computer, der Zugriff benötigt.
- **Beispiele:** [exe.dev](/de/install/exe-dev) (einfache VM) oder [Hetzner](/de/install/hetzner) (Produktions-VPS).

Ideal, wenn Ihr Laptop häufig im Ruhezustand ist, Sie den Agent aber dauerhaft aktiv haben möchten.

### Heim-Desktop führt den Gateway aus

Der Laptop führt den Agent **nicht** aus. Er verbindet sich remote:

- Verwenden Sie den Modus **Remote über SSH** der macOS-App (Einstellungen → Allgemein → OpenClaw wird ausgeführt).
- Die App öffnet und verwaltet den Tunnel, sodass WebChat und Integritätsprüfungen einfach funktionieren.

Runbook: [macOS-Remotezugriff](/de/platforms/mac/remote).

### Laptop führt den Gateway aus

Behalten Sie den Gateway lokal bei, aber stellen Sie ihn sicher bereit:

- SSH-Tunnel von anderen Computern zum Laptop, oder
- Tailscale Serve für die Control UI verwenden und den Gateway nur auf Loopback belassen.

Anleitungen: [Tailscale](/de/gateway/tailscale) und [Web-Übersicht](/de/web).

## Befehlsablauf (was wo ausgeführt wird)

Ein Gateway-Dienst besitzt Zustand + Kanäle. Nodes sind Peripherie.

Ablaufbeispiel (Telegram → Node):

- Telegram-Nachricht trifft beim **Gateway** ein.
- Gateway führt den **Agent** aus und entscheidet, ob ein Node-Tool aufgerufen werden soll.
- Gateway ruft den **Node** über den Gateway-WebSocket auf (`node.*` RPC).
- Node gibt das Ergebnis zurück; Gateway antwortet zurück an Telegram.

Hinweise:

- **Nodes führen den Gateway-Dienst nicht aus.** Pro Host sollte nur ein Gateway laufen, es sei denn, Sie führen absichtlich isolierte Profile aus (siehe [Mehrere Gateways](/de/gateway/multiple-gateways)).
- Der „Node-Modus“ der macOS-App ist nur ein Node-Client über den Gateway-WebSocket.

## SSH-Tunnel (CLI + Tools)

Erstellen Sie einen lokalen Tunnel zum Remote-Gateway-WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Wenn der Tunnel aktiv ist:

- `openclaw health` und `openclaw status --deep` erreichen jetzt den Remote-Gateway über `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` und `openclaw gateway call` können bei Bedarf ebenfalls die weitergeleitete URL über `--url` ansteuern.

<Note>
Ersetzen Sie `18789` durch Ihren konfigurierten `gateway.port` (oder `--port` oder `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Wenn Sie `--url` übergeben, fällt die CLI nicht auf Konfigurations- oder Umgebungs-Credentials zurück. Geben Sie `--token` oder `--password` explizit an. Fehlende explizite Credentials sind ein Fehler.
</Warning>

## Remote-Standardwerte der CLI

Sie können ein Remote-Ziel dauerhaft speichern, damit CLI-Befehle es standardmäßig verwenden:

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

Wenn der Gateway nur auf Loopback lauscht, belassen Sie die URL bei `ws://127.0.0.1:18789` und öffnen Sie zuerst den SSH-Tunnel.
Im SSH-Tunnel-Transport der macOS-App gehören erkannte Gateway-Hostnamen in
`gateway.remote.sshTarget`; `gateway.remote.url` bleibt die lokale Tunnel-URL.

## Credential-Priorität

Die Auflösung von Gateway-Credentials folgt über Call-/Probe-/Status-Pfade und Discord-Exec-Approval-Monitoring hinweg einem gemeinsamen Vertrag. Node-Host verwendet denselben Basisvertrag mit einer Local-Mode-Ausnahme (er ignoriert `gateway.remote.*` absichtlich):

- Explizite Credentials (`--token`, `--password` oder Tool-`gatewayToken`) gewinnen immer auf Call-Pfaden, die explizite Auth akzeptieren.
- Sicherheit bei URL-Overrides:
  - CLI-URL-Overrides (`--url`) verwenden niemals implizite Credentials aus Konfiguration/Umgebung wieder.
  - Env-URL-Overrides (`OPENCLAW_GATEWAY_URL`) dürfen nur Env-Credentials verwenden (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Standardwerte im Local Mode:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (Remote-Fallback gilt nur, wenn lokale Auth-Token-Eingabe nicht gesetzt ist)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (Remote-Fallback gilt nur, wenn lokale Auth-Passwort-Eingabe nicht gesetzt ist)
- Standardwerte im Remote Mode:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Local-Mode-Ausnahme für Node-Host: `gateway.remote.token` / `gateway.remote.password` werden ignoriert.
- Remote-Probe-/Status-Tokenprüfungen sind standardmäßig strikt: Sie verwenden nur `gateway.remote.token` (kein lokaler Token-Fallback), wenn Remote Mode angesteuert wird.
- Gateway-Env-Overrides verwenden nur `OPENCLAW_GATEWAY_*`.

## Chat-UI über SSH

WebChat verwendet keinen separaten HTTP-Port mehr. Die SwiftUI-Chat-UI verbindet sich direkt mit dem Gateway-WebSocket.

- Leiten Sie `18789` über SSH weiter (siehe oben), und verbinden Sie dann Clients mit `ws://127.0.0.1:18789`.
- Unter macOS bevorzugen Sie den Modus „Remote über SSH“ der App, der den Tunnel automatisch verwaltet.

## Remote über SSH in der macOS-App

Die macOS-Menüleisten-App kann dasselbe Setup durchgängig steuern (Remote-Statusprüfungen, WebChat und Weiterleitung für Voice Wake).

Runbook: [macOS-Remotezugriff](/de/platforms/mac/remote).

## Sicherheitsregeln (Remote/VPN)

Kurzfassung: **Belassen Sie den Gateway nur auf Loopback**, es sei denn, Sie sind sicher, dass Sie ein Binding benötigen.

- **Loopback + SSH/Tailscale Serve** ist der sicherste Standard (keine öffentliche Exposition).
- Klartext-`ws://` ist standardmäßig nur Loopback. Für vertrauenswürdige private Netzwerke
  setzen Sie `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` auf dem Client-Prozess als
  Notfalloption. Es gibt kein `openclaw.json`-Äquivalent; dies muss die Prozessumgebung
  für den Client sein, der die WebSocket-Verbindung herstellt.
- **Nicht-Loopback-Bindings** (`lan`/`tailnet`/`custom` oder `auto`, wenn Loopback nicht verfügbar ist) müssen Gateway-Auth verwenden: Token, Passwort oder einen identitätsbewussten Reverse Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sind Quellen für Client-Credentials. Sie konfigurieren **nicht** selbst Server-Auth.
- Lokale Call-Pfade können `gateway.remote.*` nur als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht auflösbar ist, schlägt die Auflösung geschlossen fehl (keine Maskierung durch Remote-Fallback).
- `gateway.remote.tlsFingerprint` pinnt das Remote-TLS-Zertifikat bei Verwendung von `wss://`.
- **Tailscale Serve** kann Control-UI-/WebSocket-Traffic über Identity-Header authentifizieren,
  wenn `gateway.auth.allowTailscale: true`; HTTP-API-Endpunkte verwenden diese
  Tailscale-Header-Auth nicht und folgen stattdessen dem normalen HTTP-Auth-Modus
  des Gateway. Dieser tokenlose Ablauf setzt voraus, dass der Gateway-Host vertrauenswürdig ist. Setzen Sie ihn auf
  `false`, wenn Sie überall Shared-Secret-Auth verwenden möchten.
- **Trusted-proxy**-Auth erwartet standardmäßig Nicht-Loopback-Setups mit identitätsbewusstem Proxy.
  Same-Host-Loopback-Reverse-Proxys benötigen explizit `gateway.auth.trustedProxy.allowLoopback = true`.
- Behandeln Sie Browser-Steuerung wie Operatorzugriff: nur Tailnet + bewusstes Node-Pairing.

Vertiefung: [Sicherheit](/de/gateway/security).

### macOS: persistenter SSH-Tunnel über LaunchAgent

Für macOS-Clients, die sich mit einem Remote-Gateway verbinden, verwendet das einfachste persistente Setup einen SSH-`LocalForward`-Konfigurationseintrag plus einen LaunchAgent, um den Tunnel über Neustarts und Abstürze hinweg aktiv zu halten.

#### Schritt 1: SSH-Konfiguration hinzufügen

Bearbeiten Sie `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Ersetzen Sie `<REMOTE_IP>` und `<REMOTE_USER>` durch Ihre Werte.

#### Schritt 2: SSH-Schlüssel kopieren (einmalig)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Schritt 3: Gateway-Token konfigurieren

Speichern Sie den Token in der Konfiguration, damit er über Neustarts hinweg erhalten bleibt:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Schritt 4: LaunchAgent erstellen

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

#### Schritt 5: LaunchAgent laden

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Der Tunnel startet automatisch bei der Anmeldung, startet nach einem Absturz neu und hält den weitergeleiteten Port aktiv.

<Note>
Wenn Sie noch einen `com.openclaw.ssh-tunnel`-LaunchAgent aus einem älteren Setup haben, entladen und löschen Sie ihn.
</Note>

#### Fehlerbehebung

Prüfen, ob der Tunnel läuft:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Tunnel neu starten:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Tunnel stoppen:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Konfigurationseintrag                | Funktion                                                     |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Leitet lokalen Port 18789 an Remote-Port 18789 weiter        |
| `ssh -N`                             | SSH ohne Ausführung von Remote-Befehlen (nur Port-Forwarding) |
| `KeepAlive`                          | Startet den Tunnel automatisch neu, wenn er abstürzt         |
| `RunAtLoad`                          | Startet den Tunnel, wenn der LaunchAgent bei der Anmeldung geladen wird |

## Verwandt

- [Tailscale](/de/gateway/tailscale)
- [Authentifizierung](/de/gateway/authentication)
- [Remote-Gateway-Einrichtung](/de/gateway/remote-gateway-readme)
