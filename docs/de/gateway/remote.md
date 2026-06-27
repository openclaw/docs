---
read_when:
    - Remote-Gateway-Einrichtungen ausführen oder Fehler beheben
summary: Remote-Zugriff mit Gateway WS, SSH-Tunneln und Tailnets
title: Remote-Zugriff
x-i18n:
    generated_at: "2026-06-27T17:32:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5f885026fe76acb46f49955c6e485e08714a5cc5e90c165d20e25cea1acf864
    source_path: gateway/remote.md
    workflow: 16
---

Dieses Repo unterstützt Remote-Gateway-Zugriff, indem ein einzelner Gateway (der Master) auf einem dedizierten Host (Desktop/Server) ausgeführt wird und Clients damit verbunden werden.

- Für **Operatoren (Sie / die macOS-App)**: Ein direkter LAN-/Tailnet-WebSocket ist am einfachsten, wenn der Gateway erreichbar ist; SSH-Tunneling ist der universelle Fallback.
- Für **Knoten (iOS/Android und künftige Geräte)**: Stellen Sie nach Bedarf eine Verbindung zum Gateway-**WebSocket** her (LAN/Tailnet oder SSH-Tunnel).

## Die Grundidee

- Der Gateway-WebSocket bindet normalerweise an **Loopback** auf Ihrem konfigurierten Port (standardmäßig 18789).
- Für Remote-Nutzung stellen Sie ihn über Tailscale Serve oder einen vertrauenswürdigen LAN-/Tailnet-Bind bereit, oder leiten Sie den Loopback-Port über SSH weiter.

## Übliche VPN- und Tailnet-Setups

Betrachten Sie den **Gateway-Host** als den Ort, an dem der Agent lebt. Er besitzt Sitzungen, Auth-Profile, Kanäle und Zustand. Ihr Laptop, Desktop und Ihre Knoten verbinden sich mit diesem Host.

### Immer aktiver Gateway in Ihrem Tailnet

Führen Sie den Gateway auf einem persistenten Host (VPS oder Heimserver) aus und erreichen Sie ihn über **Tailscale** oder SSH.

- **Beste UX:** Behalten Sie `gateway.bind: "loopback"` bei und verwenden Sie **Tailscale Serve** für die Steuerungs-UI.
- **Vertrauenswürdiges LAN/Tailnet:** Binden Sie den Gateway an eine private Schnittstelle und verbinden Sie sich direkt mit `gateway.remote.transport: "direct"`.
- **Fallback:** Behalten Sie Loopback plus SSH-Tunnel von jedem Rechner bei, der Zugriff benötigt.
- **Beispiele:** [exe.dev](/de/install/exe-dev) (einfache VM) oder [Hetzner](/de/install/hetzner) (Produktions-VPS).

Ideal, wenn Ihr Laptop häufig schläft, Sie den Agenten aber immer aktiv haben möchten.

### Heim-Desktop führt den Gateway aus

Der Laptop führt den Agenten **nicht** aus. Er verbindet sich remote:

- Verwenden Sie den Remote-Modus der macOS-App (Einstellungen → Allgemein → OpenClaw runs).
- Die App verbindet sich direkt, wenn der Gateway im LAN/Tailnet erreichbar ist, oder öffnet und verwaltet einen SSH-Tunnel, wenn Sie SSH wählen.

Ablaufplan: [macOS-Remotezugriff](/de/platforms/mac/remote).

### Laptop führt den Gateway aus

Halten Sie den Gateway lokal, stellen Sie ihn aber sicher bereit:

- SSH-Tunnel von anderen Rechnern zum Laptop, oder
- Tailscale Serve für die Steuerungs-UI und den Gateway nur über Loopback erreichbar halten.

Anleitungen: [Tailscale](/de/gateway/tailscale) und [Web-Übersicht](/de/web).

## Befehlsfluss (was wo ausgeführt wird)

Ein Gateway-Dienst besitzt Zustand und Kanäle. Knoten sind Peripheriegeräte.

Flussbeispiel (Telegram → Knoten):

- Telegram-Nachricht kommt beim **Gateway** an.
- Gateway führt den **Agenten** aus und entscheidet, ob ein Knoten-Tool aufgerufen werden soll.
- Gateway ruft den **Knoten** über den Gateway-WebSocket auf (`node.*` RPC).
- Der Knoten gibt das Ergebnis zurück; Gateway antwortet zurück an Telegram.

Hinweise:

- **Knoten führen den Gateway-Dienst nicht aus.** Pro Host sollte nur ein Gateway laufen, es sei denn, Sie führen absichtlich isolierte Profile aus (siehe [Mehrere Gateways](/de/gateway/multiple-gateways)).
- Der „Knotenmodus“ der macOS-App ist lediglich ein Knoten-Client über den Gateway-WebSocket.

## SSH-Tunnel (CLI + Tools)

Erstellen Sie einen lokalen Tunnel zum Remote-Gateway-WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Wenn der Tunnel aktiv ist:

- `openclaw health` und `openclaw status --deep` erreichen den Remote-Gateway jetzt über `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` und `openclaw gateway call` können bei Bedarf auch die weitergeleitete URL über `--url` ansteuern.

<Note>
Ersetzen Sie `18789` durch Ihren konfigurierten `gateway.port` (oder `--port` oder `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Wenn Sie `--url` übergeben, fällt die CLI nicht auf Konfigurations- oder Umgebungs-Zugangsdaten zurück. Geben Sie `--token` oder `--password` explizit an. Fehlende explizite Zugangsdaten sind ein Fehler.
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

Wenn der Gateway nur über Loopback erreichbar ist, belassen Sie die URL bei `ws://127.0.0.1:18789` und öffnen Sie zuerst den SSH-Tunnel.
Im SSH-Tunnel-Transport der macOS-App gehören erkannte Gateway-Hostnamen in
`gateway.remote.sshTarget`; `gateway.remote.url` bleibt die lokale Tunnel-URL.
Wenn sich diese Ports unterscheiden, setzen Sie `gateway.remote.remotePort` auf den Gateway-Port auf
dem SSH-Host.

Für einen Gateway, der bereits in einem vertrauenswürdigen LAN oder Tailnet erreichbar ist, verwenden Sie den direkten Modus:

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

## Rangfolge der Zugangsdaten

Die Gateway-Zugangsdatenauflösung folgt einem gemeinsamen Vertrag über call/probe/status-Pfade und die Discord-Exec-Approval-Überwachung hinweg. Node-host verwendet denselben Basisvertrag mit einer Local-Mode-Ausnahme (es ignoriert `gateway.remote.*` absichtlich):

- Explizite Zugangsdaten (`--token`, `--password` oder Tool-`gatewayToken`) gewinnen auf Aufrufpfaden, die explizite Authentifizierung akzeptieren, immer.
- Sicherheit bei URL-Overrides:
  - CLI-URL-Overrides (`--url`) verwenden niemals implizite Konfigurations-/Umgebungs-Zugangsdaten erneut.
  - Env-URL-Overrides (`OPENCLAW_GATEWAY_URL`) dürfen nur Env-Zugangsdaten verwenden (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Standardwerte im lokalen Modus:
  - Token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (Remote-Fallback gilt nur, wenn die lokale Auth-Token-Eingabe nicht gesetzt ist)
  - Passwort: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (Remote-Fallback gilt nur, wenn die lokale Auth-Passwort-Eingabe nicht gesetzt ist)
- Standardwerte im Remote-Modus:
  - Token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - Passwort: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host-Local-Mode-Ausnahme: `gateway.remote.token` / `gateway.remote.password` werden ignoriert.
- Remote-probe/status-Tokenprüfungen sind standardmäßig strikt: Sie verwenden nur `gateway.remote.token` (kein lokaler Token-Fallback), wenn der Remote-Modus angesteuert wird.
- Gateway-Env-Overrides verwenden nur `OPENCLAW_GATEWAY_*`.

## Remotezugriff auf die Chat-UI

WebChat verwendet keinen separaten HTTP-Port mehr. Die SwiftUI-Chat-UI verbindet sich direkt mit dem Gateway-WebSocket.

- Leiten Sie `18789` über SSH weiter (siehe oben) und verbinden Sie Clients dann mit `ws://127.0.0.1:18789`.
- Im direkten LAN-/Tailnet-Modus verbinden Sie Clients mit der konfigurierten privaten `ws://`- oder sicheren `wss://`-URL.
- Unter macOS bevorzugen Sie den Remote-Modus der App, der den ausgewählten Transport automatisch verwaltet.

## Remote-Modus der macOS-App

Die macOS-Menüleisten-App kann dasselbe Setup Ende zu Ende steuern (Remote-Statusprüfungen, WebChat und Voice-Wake-Weiterleitung).

Ablaufplan: [macOS-Remotezugriff](/de/platforms/mac/remote).

## Sicherheitsregeln (Remote/VPN)

Kurzfassung: **Halten Sie den Gateway nur über Loopback erreichbar**, sofern Sie nicht sicher sind, dass Sie einen Bind benötigen.

- **Loopback + SSH/Tailscale Serve** ist der sicherste Standard (keine öffentliche Exposition).
- Klartext-`ws://` wird für Loopback, LAN, Link-Local, `.local`, `.ts.net` und Tailscale-CGNAT-Hosts akzeptiert. Öffentliche Remote-Hosts müssen `wss://` verwenden.
- **Nicht-Loopback-Binds** (`lan`/`tailnet`/`custom` oder `auto`, wenn Loopback nicht verfügbar ist) müssen Gateway-Auth verwenden: Token, Passwort oder einen identitätsbewussten Reverse Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sind Client-Zugangsdatenquellen. Sie konfigurieren **nicht** von sich aus die Server-Auth.
- Lokale Aufrufpfade können `gateway.remote.*` nur als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht auflösbar ist, schlägt die Auflösung geschlossen fehl (keine Maskierung durch Remote-Fallback).
- `gateway.remote.tlsFingerprint` pinnt das Remote-TLS-Zertifikat bei Verwendung von `wss://`, einschließlich des direkten macOS-Modus. Ohne konfigurierten oder zuvor gespeicherten Pin pinnt macOS ein Erstverwendungszertifikat nur, nachdem die normale Systemvertrauensprüfung bestanden wurde; selbstsignierte oder Private-CA-Gateways, denen macOS noch nicht vertraut, benötigen einen expliziten Fingerprint oder Remote über SSH.
- **Tailscale Serve** kann Control-UI-/WebSocket-Traffic über Identitäts-
  Header authentifizieren, wenn `gateway.auth.allowTailscale: true`; HTTP-API-Endpunkte verwenden diese Tailscale-Header-Auth nicht
  und folgen stattdessen dem normalen HTTP-
  Auth-Modus des Gateways. Dieser tokenlose Fluss setzt voraus, dass der Gateway-Host vertrauenswürdig ist. Setzen Sie ihn auf
  `false`, wenn Sie überall Shared-Secret-Auth möchten.
- **Trusted-proxy**-Auth erwartet standardmäßig Nicht-Loopback-Setups mit identitätsbewusstem Proxy.
  Same-Host-Loopback-Reverse-Proxys erfordern explizit `gateway.auth.trustedProxy.allowLoopback = true`.
- Behandeln Sie Browser-Steuerung wie Operatorzugriff: nur Tailnet + bewusste Knoten-Kopplung.

Vertiefung: [Sicherheit](/de/gateway/security).

### macOS: persistenter SSH-Tunnel über LaunchAgent

Für macOS-Clients, die sich mit einem Remote-Gateway verbinden, verwendet das einfachste persistente Setup einen SSH-`LocalForward`-Konfigurationseintrag plus einen LaunchAgent, um den Tunnel über Neustarts und Abstürze hinweg am Leben zu halten.

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

Der Tunnel startet automatisch bei der Anmeldung, startet nach einem Absturz neu und hält den weitergeleiteten Port aktiv.

<Note>
Wenn Sie noch einen `com.openclaw.ssh-tunnel`-LaunchAgent aus einem älteren Setup haben, entladen und löschen Sie ihn.
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

| Konfigurationseintrag                | Funktion                                                     |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Leitet den lokalen Port 18789 an Remote-Port 18789 weiter    |
| `ssh -N`                             | SSH ohne Ausführung von Remote-Befehlen (nur Portweiterleitung) |
| `KeepAlive`                          | Startet den Tunnel automatisch neu, wenn er abstürzt         |
| `RunAtLoad`                          | Startet den Tunnel, wenn der LaunchAgent bei der Anmeldung geladen wird |

## Verwandte Themen

- [Tailscale](/de/gateway/tailscale)
- [Authentifizierung](/de/gateway/authentication)
- [Remote-Gateway-Setup](/de/gateway/remote-gateway-readme)
