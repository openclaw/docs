---
read_when:
    - Remote-Gateway-Setups ausführen oder Fehler beheben
summary: Remote-Zugriff mit SSH-Tunneln (Gateway WS) und tailnets
title: Remote-Zugriff
x-i18n:
    generated_at: "2026-04-26T11:30:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 208f0e6a4dbb342df878ea99d70606327efdfd3df36b07dfa3e68aafcae98e5c
    source_path: gateway/remote.md
    workflow: 15
---

Dieses Repo unterstützt „remote over SSH“, indem ein einzelnes Gateway (das Master-Gateway) auf einem dedizierten Host (Desktop/Server) läuft und Clients sich damit verbinden.

- Für **Operatoren (Sie / die macOS-App)**: SSH-Tunneling ist der universelle Fallback.
- Für **Nodes (iOS/Android und zukünftige Geräte)**: Verbindung zum Gateway **WebSocket** (LAN/tailnet oder bei Bedarf SSH-Tunnel).

## Die Grundidee

- Das Gateway-WebSocket bindet an **loopback** auf Ihrem konfigurierten Port (Standard: 18789).
- Für Remote-Nutzung leiten Sie diesen loopback-Port über SSH weiter (oder verwenden ein tailnet/VPN und brauchen weniger Tunneling).

## Gängige VPN-/tailnet-Setups (wo der Agent lebt)

Denken Sie beim **Gateway-Host** an den Ort, **an dem der Agent lebt**. Dort befinden sich Sitzungen, Auth-Profile, Kanäle und Status.
Ihr Laptop/Desktop (und Nodes) verbinden sich mit diesem Host.

### 1) Immer aktives Gateway in Ihrem tailnet (VPS oder Heimserver)

Führen Sie das Gateway auf einem persistenten Host aus und greifen Sie über **Tailscale** oder SSH darauf zu.

- **Beste UX:** Lassen Sie `gateway.bind: "loopback"` und verwenden Sie **Tailscale Serve** für die Control UI.
- **Fallback:** Behalten Sie loopback bei + SSH-Tunnel von jedem Rechner, der Zugriff benötigt.
- **Beispiele:** [exe.dev](/de/install/exe-dev) (einfache VM) oder [Hetzner](/de/install/hetzner) (Produktions-VPS).

Das ist ideal, wenn Ihr Laptop oft schläft, Sie aber möchten, dass der Agent immer aktiv ist.

### 2) Heim-Desktop führt das Gateway aus, Laptop ist die Fernsteuerung

Der Laptop führt den Agenten **nicht** aus. Er verbindet sich remote:

- Verwenden Sie den Modus **Remote over SSH** der macOS-App (Einstellungen → Allgemein → „OpenClaw runs“).
- Die App öffnet und verwaltet den Tunnel, sodass WebChat + Health checks „einfach funktionieren“.

Runbook: [macOS-Remote-Zugriff](/de/platforms/mac/remote).

### 3) Laptop führt das Gateway aus, Remote-Zugriff von anderen Rechnern

Behalten Sie das Gateway lokal, aber stellen Sie es sicher bereit:

- SSH-Tunnel zum Laptop von anderen Rechnern aus, oder
- Tailscale Serve für die Control UI und das Gateway weiterhin nur auf loopback.

Anleitung: [Tailscale](/de/gateway/tailscale) und [Web-Überblick](/de/web).

## Befehlsfluss (was wo läuft)

Ein Gateway-Dienst besitzt Status + Kanäle. Nodes sind Peripherie.

Beispielfluss (Telegram → Node):

- Eine Telegram-Nachricht trifft beim **Gateway** ein.
- Das Gateway führt den **Agenten** aus und entscheidet, ob ein Node-Tool aufgerufen werden soll.
- Das Gateway ruft den **Node** über das Gateway-WebSocket auf (`node.*` RPC).
- Der Node gibt das Ergebnis zurück; das Gateway antwortet zurück an Telegram.

Hinweise:

- **Nodes führen den Gateway-Dienst nicht aus.** Pro Host sollte nur ein Gateway laufen, außer Sie betreiben absichtlich isolierte Profile (siehe [Mehrere Gateways](/de/gateway/multiple-gateways)).
- Der „Node-Modus“ der macOS-App ist einfach ein Node-Client über das Gateway-WebSocket.

## SSH-Tunnel (CLI + Tools)

Einen lokalen Tunnel zum entfernten Gateway-WS erstellen:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Wenn der Tunnel aktiv ist:

- `openclaw health` und `openclaw status --deep` erreichen jetzt das entfernte Gateway über `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` und `openclaw gateway call` können bei Bedarf ebenfalls die weitergeleitete URL über `--url` ansprechen.

Hinweis: Ersetzen Sie `18789` durch Ihren konfigurierten `gateway.port` (oder `--port`/`OPENCLAW_GATEWAY_PORT`).
Hinweis: Wenn Sie `--url` übergeben, greift die CLI nicht auf Konfigurations- oder Umgebungs-Anmeldedaten zurück.
Geben Sie `--token` oder `--password` explizit an. Fehlende explizite Anmeldedaten führen zu einem Fehler.

## CLI-Remote-Standardwerte

Sie können ein Remote-Ziel persistent speichern, sodass CLI-Befehle es standardmäßig verwenden:

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

Wenn das Gateway nur an loopback gebunden ist, belassen Sie die URL auf `ws://127.0.0.1:18789` und öffnen Sie zuerst den SSH-Tunnel.
Beim SSH-Tunnel-Transport der macOS-App gehören erkannte Gateway-Hostnamen in
`gateway.remote.sshTarget`; `gateway.remote.url` bleibt die lokale Tunnel-URL.

## Priorität der Anmeldedaten

Die Auflösung von Gateway-Anmeldedaten folgt einem gemeinsamen Vertrag über Aufruf-/Probe-/Status-Pfade und die Überwachung von Discord-Exec-Genehmigungen. Node-host verwendet denselben Grundvertrag mit einer Ausnahme im lokalen Modus (dort wird `gateway.remote.*` absichtlich ignoriert):

- Explizite Anmeldedaten (`--token`, `--password` oder Tool `gatewayToken`) haben bei Aufrufpfaden, die explizite Auth akzeptieren, immer Vorrang.
- Sicherheit bei URL-Overrides:
  - CLI-URL-Overrides (`--url`) verwenden niemals implizite Konfigurations-/Umgebungs-Anmeldedaten erneut.
  - URL-Overrides aus Umgebungsvariablen (`OPENCLAW_GATEWAY_URL`) dürfen nur Anmeldedaten aus Umgebungsvariablen verwenden (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Standardwerte im lokalen Modus:
  - Token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (Remote-Fallback gilt nur, wenn lokale Eingabe für das Auth-Token nicht gesetzt ist)
  - Passwort: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (Remote-Fallback gilt nur, wenn lokale Eingabe für das Auth-Passwort nicht gesetzt ist)
- Standardwerte im Remote-Modus:
  - Token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - Passwort: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Ausnahme Node-host im lokalen Modus: `gateway.remote.token` / `gateway.remote.password` werden ignoriert.
- Token-Prüfungen für Remote-Probe/Status sind standardmäßig strikt: Sie verwenden bei Zielmodus remote nur `gateway.remote.token` (kein lokaler Token-Fallback).
- Gateway-Umgebungs-Overrides verwenden nur `OPENCLAW_GATEWAY_*`.

## Chat-UI über SSH

WebChat verwendet keinen separaten HTTP-Port mehr. Die SwiftUI-Chat-UI verbindet sich direkt mit dem Gateway-WebSocket.

- Leiten Sie `18789` über SSH weiter (siehe oben), und verbinden Sie Clients dann mit `ws://127.0.0.1:18789`.
- Unter macOS sollten Sie den Modus „Remote over SSH“ der App bevorzugen, der den Tunnel automatisch verwaltet.

## macOS-App „Remote over SSH“

Die macOS-Menüleisten-App kann dasselbe Setup Ende zu Ende steuern (Remote-Statusprüfungen, WebChat und Voice-Wake-Weiterleitung).

Runbook: [macOS-Remote-Zugriff](/de/platforms/mac/remote).

## Sicherheitsregeln (remote/VPN)

Kurzfassung: **Belassen Sie das Gateway nur auf loopback**, außer Sie sind sicher, dass Sie eine andere Bindung benötigen.

- **Loopback + SSH/Tailscale Serve** ist der sicherste Standard (keine öffentliche Exponierung).
- Unverschlüsseltes `ws://` ist standardmäßig nur für loopback erlaubt. Für vertrauenswürdige private Netzwerke
  setzen Sie im Client-Prozess
  `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` als Notfallmaßnahme.
  Es gibt kein Äquivalent in `openclaw.json`; dies muss in der Prozessumgebung
  des Clients gesetzt werden, der die WebSocket-Verbindung herstellt.
- **Nicht-loopback-Bindungen** (`lan`/`tailnet`/`custom`, oder `auto`, wenn loopback nicht verfügbar ist) müssen Gateway-Auth verwenden: Token, Passwort oder einen identitätsbewussten Reverse Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sind Quellen für Client-Anmeldedaten. Sie konfigurieren **nicht** selbstständig Server-Auth.
- Lokale Aufrufpfade können `gateway.remote.*` nur dann als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit per SecretRef konfiguriert und nicht auflösbar sind, schlägt die Auflösung geschlossen fehl (kein Remote-Fallback, das dies überdeckt).
- `gateway.remote.tlsFingerprint` pinnt das entfernte TLS-Zertifikat bei Verwendung von `wss://`.
- **Tailscale Serve** kann Traffic der Control UI/WebSocket über Identity-Header authentifizieren,
  wenn `gateway.auth.allowTailscale: true`; HTTP-API-Endpunkte verwenden diese
  Tailscale-Header-Auth nicht und folgen stattdessen dem normalen HTTP-Auth-Modus des Gateway. Dieser tokenlose Ablauf setzt voraus, dass dem Gateway-Host vertraut wird. Setzen Sie dies auf
  `false`, wenn Sie überall Shared-Secret-Auth möchten.
- Auth per **trusted-proxy** ist nur für Identitäts-Setups mit nicht-loopback Reverse Proxy gedacht.
  Same-Host-loopback-Reverse-Proxys erfüllen `gateway.auth.mode: "trusted-proxy"` nicht.
- Behandeln Sie Browser-Steuerung wie Operator-Zugriff: nur tailnet + bewusstes Node-Pairing.

Ausführlich: [Sicherheit](/de/gateway/security).

### macOS: persistenter SSH-Tunnel via LaunchAgent

Für macOS-Clients, die sich mit einem entfernten Gateway verbinden, verwendet das einfachste persistente Setup einen SSH-Eintrag mit `LocalForward` in der Konfiguration plus einen LaunchAgent, der den Tunnel über Neustarts und Abstürze hinweg aktiv hält.

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

#### Schritt 3: das Gateway-Token konfigurieren

Speichern Sie das Token in der Konfiguration, damit es Neustarts überdauert:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Schritt 4: den LaunchAgent erstellen

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

#### Schritt 5: den LaunchAgent laden

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Der Tunnel wird beim Anmelden automatisch gestartet, bei einem Absturz neu gestartet und hält den weitergeleiteten Port aktiv.

Hinweis: Wenn Sie einen übrig gebliebenen LaunchAgent `com.openclaw.ssh-tunnel` aus einem älteren Setup haben, entladen und löschen Sie ihn.

#### Fehlerbehebung

Prüfen, ob der Tunnel läuft:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Den Tunnel neu starten:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Den Tunnel stoppen:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Konfigurationseintrag                 | Was er bewirkt                                               |
| ------------------------------------- | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789`  | Leitet den lokalen Port 18789 auf den entfernten Port 18789 weiter |
| `ssh -N`                              | SSH ohne Ausführung entfernter Befehle (nur Port-Weiterleitung) |
| `KeepAlive`                           | Startet den Tunnel automatisch neu, wenn er abstürzt         |
| `RunAtLoad`                           | Startet den Tunnel, wenn der LaunchAgent bei der Anmeldung geladen wird |

## Verwandt

- [Tailscale](/de/gateway/tailscale)
- [Authentifizierung](/de/gateway/authentication)
- [Remote-Gateway-Setup](/de/gateway/remote-gateway-readme)
