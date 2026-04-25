---
read_when:
    - Ausführen oder Fehlerbehebung bei Remote-Gateway-Setups
summary: Remote-Zugriff mit SSH-Tunneln (Gateway-WS) und Tailnets
title: Remote-Zugriff
x-i18n:
    generated_at: "2026-04-25T13:48:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91f53a1f6798f56b3752c96c01f6944c4b5e9ee649ae58975a2669a099203e40
    source_path: gateway/remote.md
    workflow: 15
---

Dieses Repo unterstützt „remote über SSH“, indem ein einzelnes Gateway (das Master-Gateway) auf einem dedizierten Host (Desktop/Server) läuft und Clients sich damit verbinden.

- Für **Operatoren (Sie / die macOS-App)**: SSH-Tunneling ist der universelle Fallback.
- Für **Nodes (iOS/Android und zukünftige Geräte)**: Verbindung mit dem Gateway-**WebSocket** (LAN/Tailnet oder SSH-Tunnel nach Bedarf).

## Die Grundidee

- Der Gateway-WebSocket bindet an **Loopback** auf Ihrem konfigurierten Port (Standard: 18789).
- Für die Remote-Nutzung leiten Sie diesen Loopback-Port per SSH weiter (oder verwenden ein Tailnet/VPN und tunneln weniger).

## Häufige VPN-/Tailnet-Setups (wo der Agent lebt)

Betrachten Sie den **Gateway-Host** als „den Ort, an dem der Agent lebt“. Er besitzt Sitzungen, Auth-Profile, Kanäle und Status.
Ihr Laptop/Desktop (und Nodes) verbinden sich mit diesem Host.

### 1) Immer aktives Gateway in Ihrem Tailnet (VPS oder Heimserver)

Führen Sie das Gateway auf einem persistenten Host aus und greifen Sie über **Tailscale** oder SSH darauf zu.

- **Beste UX:** Behalten Sie `gateway.bind: "loopback"` bei und verwenden Sie **Tailscale Serve** für die Control UI.
- **Fallback:** Behalten Sie Loopback bei + SSH-Tunnel von jeder Maschine, die Zugriff benötigt.
- **Beispiele:** [exe.dev](/de/install/exe-dev) (einfache VM) oder [Hetzner](/de/install/hetzner) (Produktions-VPS).

Das ist ideal, wenn Ihr Laptop oft schläft, Sie den Agenten aber immer aktiv haben möchten.

### 2) Heim-Desktop führt das Gateway aus, Laptop dient als Fernsteuerung

Der Laptop führt den Agenten **nicht** aus. Er verbindet sich remote:

- Verwenden Sie den Modus **Remote over SSH** der macOS-App (Settings → General → „OpenClaw runs“).
- Die App öffnet und verwaltet den Tunnel, sodass WebChat + Integritätsprüfungen „einfach funktionieren“.

Runbook: [macOS remote access](/de/platforms/mac/remote).

### 3) Laptop führt das Gateway aus, Remote-Zugriff von anderen Maschinen

Behalten Sie das Gateway lokal, exponieren Sie es aber sicher:

- SSH-Tunnel zum Laptop von anderen Maschinen aus, oder
- Tailscale Serve für die Control UI und das Gateway nur auf Loopback.

Anleitung: [Tailscale](/de/gateway/tailscale) und [Web overview](/de/web).

## Befehlsfluss (was wo läuft)

Ein Gateway-Dienst besitzt Status + Kanäle. Nodes sind Peripheriegeräte.

Beispielablauf (Telegram → Node):

- Telegram-Nachricht trifft beim **Gateway** ein.
- Das Gateway führt den **Agenten** aus und entscheidet, ob ein Node-Tool aufgerufen werden soll.
- Das Gateway ruft den **Node** über den Gateway-WebSocket auf (`node.*`-RPC).
- Der Node gibt das Ergebnis zurück; das Gateway antwortet zurück an Telegram.

Hinweise:

- **Nodes führen den Gateway-Dienst nicht aus.** Pro Host sollte nur ein Gateway laufen, es sei denn, Sie betreiben absichtlich isolierte Profile (siehe [Multiple gateways](/de/gateway/multiple-gateways)).
- Der „Node mode“ der macOS-App ist nur ein Node-Client über den Gateway-WebSocket.

## SSH-Tunnel (CLI + Tools)

Erstellen Sie einen lokalen Tunnel zum entfernten Gateway-WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Wenn der Tunnel aktiv ist:

- erreichen `openclaw health` und `openclaw status --deep` jetzt das entfernte Gateway über `ws://127.0.0.1:18789`.
- können `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` und `openclaw gateway call` bei Bedarf ebenfalls die weitergeleitete URL über `--url` ansprechen.

Hinweis: Ersetzen Sie `18789` durch Ihren konfigurierten `gateway.port` (oder `--port`/`OPENCLAW_GATEWAY_PORT`).
Hinweis: Wenn Sie `--url` übergeben, greift die CLI nicht auf Konfigurations- oder Umgebungs-Anmeldedaten zurück.
Geben Sie `--token` oder `--password` explizit an. Fehlende explizite Anmeldedaten sind ein Fehler.

## Standardwerte für CLI-Remote-Zugriff

Sie können ein Remote-Ziel persistent speichern, damit CLI-Befehle es standardmäßig verwenden:

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

Wenn das Gateway nur auf Loopback läuft, belassen Sie die URL auf `ws://127.0.0.1:18789` und öffnen zuerst den SSH-Tunnel.

## Priorität von Anmeldedaten

Die Auflösung von Gateway-Anmeldedaten folgt einem gemeinsamen Vertrag über Call-/Probe-/Status-Pfade und die Überwachung von Exec-Genehmigungen in Discord hinweg. Der Node-Host verwendet denselben Basisvertrag mit einer Ausnahme im lokalen Modus (er ignoriert absichtlich `gateway.remote.*`):

- Explizite Anmeldedaten (`--token`, `--password` oder Tool-`gatewayToken`) haben auf Call-Pfaden, die explizite Auth akzeptieren, immer Vorrang.
- Sicherheit bei URL-Overrides:
  - CLI-URL-Overrides (`--url`) verwenden niemals implizite Anmeldedaten aus Konfiguration/Umgebung erneut.
  - URL-Overrides aus der Umgebung (`OPENCLAW_GATEWAY_URL`) dürfen nur Env-Anmeldedaten verwenden (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Standardwerte im lokalen Modus:
  - Token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (Remote-Fallback gilt nur, wenn kein lokaler Auth-Token-Eingang gesetzt ist)
  - Passwort: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (Remote-Fallback gilt nur, wenn kein lokaler Auth-Passwort-Eingang gesetzt ist)
- Standardwerte im Remote-Modus:
  - Token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - Passwort: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Ausnahme des Node-Hosts im lokalen Modus: `gateway.remote.token` / `gateway.remote.password` werden ignoriert.
- Token-Prüfungen für Remote-Probe/Status sind standardmäßig strikt: Sie verwenden nur `gateway.remote.token` (kein lokaler Token-Fallback), wenn sie auf den Remote-Modus zielen.
- Gateway-Env-Overrides verwenden nur `OPENCLAW_GATEWAY_*`.

## Chat-UI über SSH

WebChat verwendet keinen separaten HTTP-Port mehr. Die SwiftUI-Chat-UI verbindet sich direkt mit dem Gateway-WebSocket.

- Leiten Sie `18789` per SSH weiter (siehe oben), und verbinden Sie Clients dann mit `ws://127.0.0.1:18789`.
- Unter macOS bevorzugen Sie den Modus „Remote over SSH“ der App, der den Tunnel automatisch verwaltet.

## macOS-App „Remote over SSH“

Die macOS-Menüleisten-App kann dasselbe Setup Ende-zu-Ende steuern (Remote-Statusprüfungen, WebChat und Weiterleitung von Voice Wake).

Runbook: [macOS remote access](/de/platforms/mac/remote).

## Sicherheitsregeln (Remote/VPN)

Kurzfassung: **Behalten Sie das Gateway nur auf Loopback**, es sei denn, Sie sind sicher, dass Sie ein anderes Binding benötigen.

- **Loopback + SSH/Tailscale Serve** ist der sicherste Standard (keine öffentliche Exponierung).
- Einfaches `ws://` ist standardmäßig nur für Loopback vorgesehen. Für vertrauenswürdige private Netzwerke
  setzen Sie `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` auf dem Client-Prozess als
  Break-Glass. Es gibt kein Äquivalent in `openclaw.json`; dies muss als Prozess-
  Umgebung für den Client gesetzt werden, der die WebSocket-Verbindung herstellt.
- **Nicht-Loopback-Bindings** (`lan`/`tailnet`/`custom`, oder `auto`, wenn Loopback nicht verfügbar ist) müssen Gateway-Authentifizierung verwenden: Token, Passwort oder einen identitätsbewussten Reverse Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sind Anmeldedatenquellen für Clients. Sie konfigurieren **nicht** selbst die Server-Authentifizierung.
- Lokale Call-Pfade können `gateway.remote.*` nur dann als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht aufgelöst sind, schlägt die Auflösung fail-closed fehl (kein Maskieren durch Remote-Fallback).
- `gateway.remote.tlsFingerprint` pinnt das entfernte TLS-Zertifikat bei Verwendung von `wss://`.
- **Tailscale Serve** kann Control-UI-/WebSocket-Datenverkehr über Identity-
  Header authentifizieren, wenn `gateway.auth.allowTailscale: true`; HTTP-API-Endpunkte verwenden diese Tailscale-Header-Authentifizierung nicht und folgen stattdessen dem normalen HTTP-
  Auth-Modus des Gateways. Dieser tokenlose Ablauf setzt voraus, dass dem Gateway-Host vertraut wird. Setzen Sie dies auf
  `false`, wenn Sie überall Authentifizierung mit gemeinsamem Secret möchten.
- **Trusted-proxy**-Authentifizierung ist nur für identitätsbewusste Proxy-Setups ohne Loopback-Bindung gedacht.
  Reverse Proxys auf demselben Host über Loopback erfüllen `gateway.auth.mode: "trusted-proxy"` nicht.
- Behandeln Sie Browser-Steuerung wie Operator-Zugriff: nur Tailnet + bewusstes Node-Pairing.

Ausführlicher: [Security](/de/gateway/security).

### macOS: persistenter SSH-Tunnel per LaunchAgent

Für macOS-Clients, die sich mit einem entfernten Gateway verbinden, verwendet das einfachste persistente Setup einen SSH-`LocalForward`-Konfigurationseintrag plus einen LaunchAgent, um den Tunnel über Neustarts und Abstürze hinweg am Leben zu halten.

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

Speichern Sie das Token in der Konfiguration, damit es Neustarts überdauert:

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

Der Tunnel startet dann automatisch bei der Anmeldung, startet nach Abstürzen neu und hält den weitergeleiteten Port aktiv.

Hinweis: Wenn Sie einen übrig gebliebenen LaunchAgent `com.openclaw.ssh-tunnel` aus einer älteren Einrichtung haben, entladen und löschen Sie ihn.

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

| Konfigurationseintrag                  | Bedeutung                                                    |
| -------------------------------------- | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789`   | Leitet lokalen Port 18789 auf entfernten Port 18789 weiter   |
| `ssh -N`                               | SSH ohne Ausführung entfernter Befehle (nur Portweiterleitung) |
| `KeepAlive`                            | Startet den Tunnel automatisch neu, wenn er abstürzt         |
| `RunAtLoad`                            | Startet den Tunnel, wenn der LaunchAgent bei der Anmeldung geladen wird |

## Verwandt

- [Tailscale](/de/gateway/tailscale)
- [Authentication](/de/gateway/authentication)
- [Remote gateway setup](/de/gateway/remote-gateway-readme)
