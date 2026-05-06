---
read_when:
    - Remote-Gateway-Setups ausführen oder Fehler beheben
summary: Remotezugriff mit SSH-Tunneln (Gateway-WS) und Tailnets
title: Fernzugriff
x-i18n:
    generated_at: "2026-05-06T06:49:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6272f4ee9fa52091d461cd70be05ccf01c209c3b26fe98a71752f6ea86ea448
    source_path: gateway/remote.md
    workflow: 16
---

Dieses Repository unterstützt „Remote über SSH“, indem ein einzelner Gateway (der Master) auf einem dedizierten Host (Desktop/Server) läuft und Clients sich damit verbinden.

- Für **Operatoren (Sie / die macOS-App)**: SSH-Tunneling ist der universelle Fallback.
- Für **Nodes (iOS/Android und zukünftige Geräte)**: Verbinden Sie sich mit dem Gateway-**WebSocket** (LAN/Tailnet oder SSH-Tunnel nach Bedarf).

## Die Grundidee

- Der Gateway-WebSocket bindet auf Ihrem konfigurierten Port an **Loopback** (Standard: 18789).
- Für die Remote-Nutzung leiten Sie diesen Loopback-Port über SSH weiter (oder verwenden ein Tailnet/VPN und benötigen weniger Tunneling).

## Gängige VPN- und Tailnet-Setups

Betrachten Sie den **Gateway-Host** als den Ort, an dem der Agent läuft. Er besitzt Sessions, Auth-Profile, Kanäle und Zustand. Ihr Laptop, Desktop und Ihre Nodes verbinden sich mit diesem Host.

### Always-on-Gateway in Ihrem Tailnet

Führen Sie den Gateway auf einem persistenten Host (VPS oder Heimserver) aus und erreichen Sie ihn über **Tailscale** oder SSH.

- **Beste UX:** Behalten Sie `gateway.bind: "loopback"` bei und verwenden Sie **Tailscale Serve** für die Steuerungs-UI.
- **Fallback:** Behalten Sie Loopback bei und nutzen Sie zusätzlich einen SSH-Tunnel von jedem Rechner, der Zugriff benötigt.
- **Beispiele:** [exe.dev](/de/install/exe-dev) (einfache VM) oder [Hetzner](/de/install/hetzner) (Produktions-VPS).

Ideal, wenn Ihr Laptop häufig schläft, Sie den Agent aber ständig verfügbar halten möchten.

### Heim-Desktop führt den Gateway aus

Der Laptop führt den Agent **nicht** aus. Er verbindet sich remote:

- Verwenden Sie den Modus **Remote über SSH** der macOS-App (Einstellungen → Allgemein → OpenClaw läuft).
- Die App öffnet und verwaltet den Tunnel, sodass WebChat und Health-Checks einfach funktionieren.

Runbook: [macOS-Remotezugriff](/de/platforms/mac/remote).

### Laptop führt den Gateway aus

Halten Sie den Gateway lokal, aber stellen Sie ihn sicher bereit:

- SSH-Tunnel von anderen Rechnern zum Laptop, oder
- Tailscale Serve für die Steuerungs-UI und den Gateway weiterhin nur über Loopback erreichbar halten.

Anleitungen: [Tailscale](/de/gateway/tailscale) und [Web-Übersicht](/de/web).

## Befehlsfluss (was wo läuft)

Ein Gateway-Dienst besitzt Zustand + Kanäle. Nodes sind Peripheriegeräte.

Beispielfluss (Telegram → Node):

- Telegram-Nachricht kommt am **Gateway** an.
- Gateway führt den **Agent** aus und entscheidet, ob ein Node-Tool aufgerufen werden soll.
- Gateway ruft den **Node** über den Gateway-WebSocket auf (`node.*` RPC).
- Node gibt das Ergebnis zurück; Gateway antwortet wieder an Telegram.

Hinweise:

- **Nodes führen den Gateway-Dienst nicht aus.** Pro Host sollte nur ein Gateway laufen, es sei denn, Sie führen absichtlich isolierte Profile aus (siehe [Mehrere Gateways](/de/gateway/multiple-gateways)).
- Der „Node-Modus“ der macOS-App ist lediglich ein Node-Client über den Gateway-WebSocket.

## SSH-Tunnel (CLI + Tools)

Erstellen Sie einen lokalen Tunnel zum Remote-Gateway-WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Wenn der Tunnel aktiv ist:

- `openclaw health` und `openclaw status --deep` erreichen den Remote-Gateway nun über `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` und `openclaw gateway call` können bei Bedarf über `--url` ebenfalls auf die weitergeleitete URL zeigen.

<Note>
Ersetzen Sie `18789` durch Ihr konfiguriertes `gateway.port` (oder `--port` oder `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Wenn Sie `--url` übergeben, fällt die CLI nicht auf Konfigurations- oder Umgebungs-Credentials zurück. Geben Sie `--token` oder `--password` explizit an. Fehlende explizite Credentials sind ein Fehler.
</Warning>

## Remote-Standardeinstellungen der CLI

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

Wenn der Gateway nur über Loopback erreichbar ist, belassen Sie die URL bei `ws://127.0.0.1:18789` und öffnen Sie zuerst den SSH-Tunnel.
Beim SSH-Tunnel-Transport der macOS-App gehören erkannte Gateway-Hostnamen in
`gateway.remote.sshTarget`; `gateway.remote.url` bleibt die lokale Tunnel-URL.

## Credential-Priorität

Die Auflösung von Gateway-Credentials folgt einem gemeinsamen Vertrag über Call-/Probe-/Status-Pfade und Discord-Exec-Approval-Monitoring hinweg. Node-Host verwendet denselben Basisvertrag mit einer Local-Mode-Ausnahme (er ignoriert absichtlich `gateway.remote.*`):

- Explizite Credentials (`--token`, `--password` oder Tool-`gatewayToken`) gewinnen immer auf Call-Pfaden, die explizite Authentifizierung akzeptieren.
- Sicherheit bei URL-Overrides:
  - CLI-URL-Overrides (`--url`) verwenden niemals implizite Config-/Env-Credentials wieder.
  - Env-URL-Overrides (`OPENCLAW_GATEWAY_URL`) dürfen nur Env-Credentials verwenden (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Local-Mode-Standards:
  - Token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (Remote-Fallback gilt nur, wenn die lokale Auth-Token-Eingabe nicht gesetzt ist)
  - Passwort: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (Remote-Fallback gilt nur, wenn die lokale Auth-Passwort-Eingabe nicht gesetzt ist)
- Remote-Mode-Standards:
  - Token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - Passwort: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Local-Mode-Ausnahme für Node-Host: `gateway.remote.token` / `gateway.remote.password` werden ignoriert.
- Token-Prüfungen für Remote-Probe/-Status sind standardmäßig strikt: Sie verwenden beim Ziel Remote-Mode nur `gateway.remote.token` (kein lokaler Token-Fallback).
- Gateway-Env-Overrides verwenden ausschließlich `OPENCLAW_GATEWAY_*`.

## Chat-UI über SSH

WebChat verwendet keinen separaten HTTP-Port mehr. Die SwiftUI-Chat-UI verbindet sich direkt mit dem Gateway-WebSocket.

- Leiten Sie `18789` über SSH weiter (siehe oben) und verbinden Sie Clients anschließend mit `ws://127.0.0.1:18789`.
- Unter macOS bevorzugen Sie den Modus „Remote über SSH“ der App, der den Tunnel automatisch verwaltet.

## macOS-App Remote über SSH

Die macOS-Menüleisten-App kann dasselbe Setup Ende-zu-Ende steuern (Remote-Statusprüfungen, WebChat und Voice-Wake-Weiterleitung).

Runbook: [macOS-Remotezugriff](/de/platforms/mac/remote).

## Sicherheitsregeln (Remote/VPN)

Kurzfassung: **Halten Sie den Gateway nur über Loopback erreichbar**, sofern Sie nicht sicher sind, dass Sie ein Binding benötigen.

- **Loopback + SSH/Tailscale Serve** ist die sicherste Standardeinstellung (keine öffentliche Exponierung).
- Klartext-`ws://` ist standardmäßig nur über Loopback zulässig. Für vertrauenswürdige private Netzwerke setzen Sie `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` im Client-Prozess als Notfallmaßnahme. Es gibt kein `openclaw.json`-Äquivalent; dies muss in der Prozessumgebung des Clients gesetzt werden, der die WebSocket-Verbindung herstellt.
- **Nicht-Loopback-Bindings** (`lan`/`tailnet`/`custom` oder `auto`, wenn Loopback nicht verfügbar ist) müssen Gateway-Auth verwenden: Token, Passwort oder einen identitätsbewussten Reverse Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sind Client-Credential-Quellen. Sie konfigurieren **nicht** von selbst die Server-Auth.
- Lokale Call-Pfade können `gateway.remote.*` nur dann als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit per SecretRef konfiguriert und nicht auflösbar ist, schlägt die Auflösung geschlossen fehl (kein maskierender Remote-Fallback).
- `gateway.remote.tlsFingerprint` pinnt das Remote-TLS-Zertifikat bei Verwendung von `wss://`.
- **Tailscale Serve** kann Steuerungs-UI-/WebSocket-Traffic über Identity-Header authentifizieren, wenn `gateway.auth.allowTailscale: true`; HTTP-API-Endpunkte verwenden diese Tailscale-Header-Auth nicht und folgen stattdessen dem normalen HTTP-Auth-Modus des Gateways. Dieser tokenlose Ablauf setzt voraus, dass der Gateway-Host vertrauenswürdig ist. Setzen Sie ihn auf `false`, wenn Sie überall Shared-Secret-Auth verwenden möchten.
- **Trusted-Proxy**-Auth erwartet standardmäßig Nicht-Loopback-Setups mit identitätsbewusstem Proxy. Same-Host-Loopback-Reverse-Proxies erfordern explizit `gateway.auth.trustedProxy.allowLoopback = true`.
- Behandeln Sie Browser-Steuerung wie Operatorzugriff: nur Tailnet + bewusste Node-Kopplung.

Details: [Sicherheit](/de/gateway/security).

### macOS: persistenter SSH-Tunnel per LaunchAgent

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

Der Tunnel startet automatisch bei der Anmeldung, startet nach einem Absturz neu und hält den weitergeleiteten Port aktiv.

<Note>
Wenn Sie noch einen alten `com.openclaw.ssh-tunnel`-LaunchAgent aus einem früheren Setup haben, entladen und löschen Sie ihn.
</Note>

#### Fehlerbehebung

Prüfen Sie, ob der Tunnel läuft:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Starten Sie den Tunnel neu:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Stoppen Sie den Tunnel:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Konfigurationseintrag                | Zweck                                                        |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Leitet den lokalen Port 18789 an den Remote-Port 18789 weiter |
| `ssh -N`                             | SSH ohne Ausführung von Remote-Befehlen (nur Portweiterleitung) |
| `KeepAlive`                          | Startet den Tunnel automatisch neu, wenn er abstürzt         |
| `RunAtLoad`                          | Startet den Tunnel, wenn der LaunchAgent bei der Anmeldung geladen wird |

## Verwandt

- [Tailscale](/de/gateway/tailscale)
- [Authentifizierung](/de/gateway/authentication)
- [Remote-Gateway-Setup](/de/gateway/remote-gateway-readme)
