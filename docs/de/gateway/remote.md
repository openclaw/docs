---
read_when:
    - Remote-Gateway-Setups ausführen oder Fehler beheben
summary: Remotezugriff mit Gateway WS, SSH-Tunneln und Tailnets
title: Remote-Zugriff
x-i18n:
    generated_at: "2026-07-03T23:30:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb6fd38698480f1dff93a6e4819082711e8e4395556a2fd85a8eb772ef6fbe31
    source_path: gateway/remote.md
    workflow: 16
---

Dieses Repo unterstützt entfernten Gateway-Zugriff, indem ein einzelnes Gateway (der Master) auf einem dedizierten Host (Desktop/Server) ausgeführt wird und Clients damit verbunden werden.

- Für **Betreiber (Sie / die macOS-App)**: Direkter LAN/Tailnet-WebSocket ist am einfachsten, wenn das Gateway erreichbar ist; SSH-Tunneling ist die universelle Ausweichlösung.
- Für **Nodes (iOS/Android und zukünftige Geräte)**: Verbindung mit dem Gateway-**WebSocket** herstellen (LAN/Tailnet oder SSH-Tunnel nach Bedarf).

## Die Kernidee

- Der Gateway-WebSocket bindet normalerweise an **loopback** auf Ihrem konfigurierten Port (standardmäßig 18789).
- Für die entfernte Nutzung stellen Sie ihn über Tailscale Serve oder ein vertrauenswürdiges LAN/Tailnet-Bind bereit, oder leiten Sie den loopback-Port über SSH weiter.

## Häufige VPN- und Tailnet-Setups

Betrachten Sie den **Gateway-Host** als den Ort, an dem der Agent läuft. Er besitzt Sessions, Auth-Profile, Channels und Zustand. Ihr Laptop, Desktop und Ihre Nodes verbinden sich mit diesem Host.

### Always-on-Gateway in Ihrem Tailnet

Führen Sie das Gateway auf einem persistenten Host (VPS oder Home-Server) aus und erreichen Sie es über **Tailscale** oder SSH.

- **Beste UX:** `gateway.bind: "loopback"` beibehalten und **Tailscale Serve** für die Control UI verwenden.
- **Vertrauenswürdiges LAN/Tailnet:** Binden Sie das Gateway an eine private Schnittstelle und verbinden Sie sich direkt mit `gateway.remote.transport: "direct"`.
- **Fallback:** loopback plus SSH-Tunnel von jedem Rechner beibehalten, der Zugriff benötigt.
- **Beispiele:** [exe.dev](/de/install/exe-dev) (einfache VM) oder [Hetzner](/de/install/hetzner) (Produktions-VPS).

Ideal, wenn Ihr Laptop häufig schläft, Sie den Agenten aber immer eingeschaltet haben möchten.

### Home-Desktop führt das Gateway aus

Der Laptop führt den Agenten **nicht** aus. Er verbindet sich entfernt:

- Verwenden Sie den Remote-Modus der macOS-App (Einstellungen → Allgemein → OpenClaw wird ausgeführt).
- Die App verbindet sich direkt, wenn das Gateway im LAN/Tailnet erreichbar ist, oder öffnet und verwaltet einen SSH-Tunnel, wenn Sie SSH auswählen.

Runbook: [macOS-Remote-Zugriff](/de/platforms/mac/remote).

### Laptop führt das Gateway aus

Halten Sie das Gateway lokal, stellen Sie es aber sicher bereit:

- SSH-Tunnel zum Laptop von anderen Rechnern aus, oder
- Tailscale Serve für die Control UI und das Gateway nur über loopback erreichbar halten.

Leitfäden: [Tailscale](/de/gateway/tailscale) und [Web-Übersicht](/de/web).

## Befehlsfluss (was wo läuft)

Ein Gateway-Dienst besitzt Zustand + Channels. Nodes sind Peripheriegeräte.

Ablaufbeispiel (Telegram → Node):

- Telegram-Nachricht trifft beim **Gateway** ein.
- Gateway führt den **Agenten** aus und entscheidet, ob ein Node-Tool aufgerufen wird.
- Gateway ruft den **Node** über den Gateway-WebSocket auf (`node.*` RPC).
- Node gibt das Ergebnis zurück; Gateway antwortet zurück an Telegram.

Hinweise:

- **Nodes führen den Gateway-Dienst nicht aus.** Pro Host sollte nur ein Gateway laufen, außer Sie führen absichtlich isolierte Profile aus (siehe [Mehrere Gateways](/de/gateway/multiple-gateways)).
- Der „Node-Modus“ der macOS-App ist nur ein Node-Client über den Gateway-WebSocket.

## SSH-Tunnel (CLI + Tools)

Erstellen Sie einen lokalen Tunnel zum entfernten Gateway-WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Wenn der Tunnel aktiv ist:

- `openclaw health` und `openclaw status --deep` erreichen das entfernte Gateway jetzt über `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` und `openclaw gateway call` können bei Bedarf auch mit `--url` auf die weitergeleitete URL zielen.

<Note>
Ersetzen Sie `18789` durch Ihr konfiguriertes `gateway.port` (oder `--port` oder `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Wenn Sie `--url` übergeben, fällt die CLI nicht auf Konfigurations- oder Umgebungs-Anmeldedaten zurück. Geben Sie `--token` oder `--password` explizit an. Fehlende explizite Anmeldedaten sind ein Fehler.
</Warning>

## CLI-Remote-Standardwerte

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

Wenn das Gateway nur über loopback erreichbar ist, belassen Sie die URL bei `ws://127.0.0.1:18789` und öffnen Sie zuerst den SSH-Tunnel.
Im SSH-Tunnel-Transport der macOS-App gehören erkannte Gateway-Hostnamen in
`gateway.remote.sshTarget`; `gateway.remote.url` bleibt die lokale Tunnel-URL.
Wenn sich diese Ports unterscheiden, setzen Sie `gateway.remote.remotePort` auf den Gateway-Port auf
dem SSH-Host.
Die Host-Key-Verifizierung ist standardmäßig strikt. Verwaltete Aliasse können explizit
ihre effektive OpenSSH-Vertrauensrichtlinie mit
`gateway.remote.sshHostKeyPolicy: "openssh"` verwenden; prüfen Sie die passenden Benutzer- und System-
SSH-Einstellungen, bevor Sie dies aktivieren.

Für ein Gateway, das bereits in einem vertrauenswürdigen LAN oder Tailnet erreichbar ist, verwenden Sie den Direktmodus:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      transport: "direct",
      url: "ws://192.168.0.202:18789",
      token: "your-token",
    },
  },
}
```

## Anmeldedaten-Priorität

Die Auflösung der Gateway-Anmeldedaten folgt einem gemeinsamen Vertrag über Aufruf-/Probe-/Status-Pfade und Discord-Exec-Approval-Überwachung hinweg. Node-Host verwendet denselben Basisvertrag mit einer lokalen Modus-Ausnahme (er ignoriert absichtlich `gateway.remote.*`):

- Explizite Anmeldedaten (`--token`, `--password` oder Tool-`gatewayToken`) gewinnen immer auf Aufrufpfaden, die explizite Auth akzeptieren.
- URL-Override-Sicherheit:
  - CLI-URL-Overrides (`--url`) verwenden niemals implizite Konfigurations-/Umgebungs-Anmeldedaten erneut.
  - Env-URL-Overrides (`OPENCLAW_GATEWAY_URL`) dürfen nur Env-Anmeldedaten verwenden (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Standardwerte im lokalen Modus:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (Remote-Fallback gilt nur, wenn lokale Auth-Token-Eingabe nicht gesetzt ist)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (Remote-Fallback gilt nur, wenn lokale Auth-Passwort-Eingabe nicht gesetzt ist)
- Standardwerte im Remote-Modus:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-Host-Ausnahme im lokalen Modus: `gateway.remote.token` / `gateway.remote.password` werden ignoriert.
- Remote-Probe-/Status-Token-Prüfungen sind standardmäßig strikt: Sie verwenden nur `gateway.remote.token` (kein lokaler Token-Fallback), wenn sie auf den Remote-Modus zielen.
- Gateway-Env-Overrides verwenden nur `OPENCLAW_GATEWAY_*`.

## Remote-Zugriff auf Chat-UI

WebChat verwendet keinen separaten HTTP-Port mehr. Die SwiftUI-Chat-UI verbindet sich direkt mit dem Gateway-WebSocket.

- Leiten Sie `18789` über SSH weiter (siehe oben), und verbinden Sie Clients dann mit `ws://127.0.0.1:18789`.
- Für den LAN/Tailnet-Direktmodus verbinden Sie Clients mit der konfigurierten privaten `ws://`- oder sicheren `wss://`-URL.
- Unter macOS bevorzugen Sie den Remote-Modus der App, der den ausgewählten Transport automatisch verwaltet.

## Remote-Modus der macOS-App

Die macOS-Menüleisten-App kann dasselbe Setup vollständig steuern (Remote-Statusprüfungen, WebChat und Voice-Wake-Weiterleitung).

Runbook: [macOS-Remote-Zugriff](/de/platforms/mac/remote).

## Sicherheitsregeln (Remote/VPN)

Kurzfassung: **Halten Sie das Gateway nur über loopback erreichbar**, sofern Sie nicht sicher sind, dass Sie ein Bind benötigen.

- **Loopback + SSH/Tailscale Serve** ist die sicherste Voreinstellung (keine öffentliche Exposition).
- Klartext-`ws://` wird für loopback, LAN, link-local, `.local`, `.ts.net` und Tailscale-CGNAT-Hosts akzeptiert. Öffentliche Remote-Hosts müssen `wss://` verwenden.
- **Nicht-loopback-Binds** (`lan`/`tailnet`/`custom` oder `auto`, wenn loopback nicht verfügbar ist) müssen Gateway-Auth verwenden: Token, Passwort oder einen identity-aware Reverse Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sind Quellen für Client-Anmeldedaten. Sie konfigurieren **nicht** von selbst Server-Auth.
- Lokale Aufrufpfade können `gateway.remote.*` nur als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht aufgelöst ist, schlägt die Auflösung geschlossen fehl (kein maskierender Remote-Fallback).
- `gateway.remote.tlsFingerprint` pinnt das Remote-TLS-Zertifikat bei Verwendung von `wss://`, einschließlich macOS-Direktmodus. Ohne konfigurierten oder zuvor gespeicherten Pin pinnt macOS ein First-Use-Zertifikat nur, nachdem normales Systemvertrauen bestanden wurde; selbstsignierte oder Private-CA-Gateways, denen macOS noch nicht vertraut, benötigen einen expliziten Fingerprint oder Remote über SSH.
- **Tailscale Serve** kann Control-UI-/WebSocket-Traffic über Identity-
  Header authentifizieren, wenn `gateway.auth.allowTailscale: true`; HTTP-API-Endpunkte verwenden diese Tailscale-Header-Auth nicht und folgen stattdessen dem normalen HTTP-
  Auth-Modus des Gateways. Dieser tokenlose Ablauf setzt voraus, dass der Gateway-Host vertrauenswürdig ist. Setzen Sie ihn auf
  `false`, wenn Sie überall Shared-Secret-Auth wünschen.
- **Trusted-proxy**-Auth erwartet standardmäßig Nicht-loopback-identity-aware-Proxy-Setups.
  Same-Host-loopback-Reverse-Proxys benötigen explizit `gateway.auth.trustedProxy.allowLoopback = true`.
- Behandeln Sie Browser-Steuerung wie Betreiberzugriff: nur Tailnet + bewusste Node-Kopplung.

Tiefer Einblick: [Sicherheit](/de/gateway/security).

### macOS: persistenter SSH-Tunnel über LaunchAgent

Für macOS-Clients, die sich mit einem entfernten Gateway verbinden, verwendet das einfachste persistente Setup einen SSH-`LocalForward`-Konfigurationseintrag plus einen LaunchAgent, um den Tunnel über Neustarts und Abstürze hinweg aktiv zu halten.

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

Speichern Sie das Token in der Konfiguration, damit es über Neustarts hinweg erhalten bleibt:

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

Der Tunnel startet automatisch bei der Anmeldung, wird nach einem Absturz neu gestartet und hält den weitergeleiteten Port aktiv.

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
| `ssh -N`                             | SSH ohne Ausführung entfernter Befehle (nur Port-Forwarding) |
| `KeepAlive`                          | Startet den Tunnel automatisch neu, wenn er abstürzt         |
| `RunAtLoad`                          | Startet den Tunnel, wenn der LaunchAgent bei der Anmeldung geladen wird |

## Verwandte Themen

- [Tailscale](/de/gateway/tailscale)
- [Authentifizierung](/de/gateway/authentication)
- [Remote-Gateway-Setup](/de/gateway/remote-gateway-readme)
