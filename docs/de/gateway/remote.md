---
read_when:
    - Remote-Gateway-Setups ausführen oder Fehler beheben
summary: Remotezugriff über Gateway-WS, SSH-Tunnel und Tailnets
title: Fernzugriff
x-i18n:
    generated_at: "2026-07-12T15:22:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 78daaad7bcb9f80072eaa2d6946bff9f28ba1ec4f95a68edb0d24cf7f9c3fec2
    source_path: gateway/remote.md
    workflow: 16
---

OpenClaw führt einen Gateway (den Master) auf einem Host aus und verbindet jeden Client mit ihm. Der Gateway verwaltet Sitzungen, Authentifizierungsprofile, Kanäle und Zustand; alles andere ist ein Client.

- **Operatoren** (Sie oder die macOS-App): Eine direkte LAN-/Tailnet-WebSocket-Verbindung ist am einfachsten, wenn der Gateway erreichbar ist; SSH-Tunneling ist die universelle Ausweichlösung.
- **Nodes** (iOS/Android und andere Geräte): Stellen eine Verbindung zum **WebSocket** des Gateways her (LAN/Tailnet oder SSH-Tunnel).

## Das Grundprinzip

Der Gateway-WebSocket bindet sich standardmäßig an **Loopback**, und zwar an Port `18789` (`gateway.port`). Für die Remotenutzung können Sie ihn entweder über Tailscale Serve bzw. eine vertrauenswürdige LAN-/Tailnet-Bindung bereitstellen oder den Loopback-Port über SSH weiterleiten.

## Topologieoptionen

| Einrichtung                              | Ausführungsort des Gateways                                                                                     | Am besten geeignet für                                                                                                                                                         |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dauerhaft aktiver Gateway in Ihrem Tailnet | Persistenter Host (VPS oder Heimserver), erreichbar über Tailscale oder SSH                                     | Laptops, die häufig in den Ruhezustand wechseln, aber einen ständig aktiven Agenten benötigen. Siehe [exe.dev](/de/install/exe-dev) (einfache VM) oder [Hetzner](/de/install/hetzner) (Produktions-VPS). |
| Heim-Desktop                             | Desktop; der Laptop stellt über den Remotemodus der macOS-App eine Verbindung her (Settings → Connection → OpenClaw runs) | Den Agenten auf Hardware betreiben, die eingeschaltet bleibt. Runbook: [macOS-Remotezugriff](/de/platforms/mac/remote).                                                            |
| Laptop                                   | Laptop, sicher über SSH-Tunnel oder Tailscale Serve bereitgestellt (`gateway.bind: "loopback"` beibehalten)     | Konfigurationen mit einem einzelnen Computer. Siehe [Tailscale](/de/gateway/tailscale) und [Web](/de/web).                                                                            |

Für dauerhaft aktive und Laptop-Konfigurationen sollten Sie vorzugsweise `gateway.bind: "loopback"` beibehalten und **Tailscale Serve** für die Control UI oder eine vertrauenswürdige LAN-/Tailnet-Bindung mit `gateway.remote.transport: "direct"` verwenden. Ein SSH-Tunnel ist die Ausweichlösung, die von jedem Computer aus funktioniert.

## Befehlsablauf (was wo ausgeführt wird)

Ein Gateway verwaltet Zustand und Kanäle; Nodes sind Peripheriegeräte. Beispiel (eine Telegram-Nachricht wird an ein Node-Tool weitergeleitet):

1. Die Telegram-Nachricht trifft beim **Gateway** ein.
2. Der Gateway führt den **Agenten** aus, der entscheidet, ob ein Node-Tool aufgerufen wird.
3. Der Gateway ruft die **Node** über den Gateway-WebSocket auf (`node.invoke`-RPC).
4. Die Node gibt das Ergebnis zurück; der Gateway antwortet in Telegram.

Nodes führen den Gateway-Dienst nicht aus. Pro Host sollte nur ein Gateway ausgeführt werden, sofern Sie nicht bewusst isolierte Profile verwenden (siehe [Mehrere Gateways](/de/gateway/multiple-gateways)). Der „Node-Modus“ der macOS-App ist lediglich ein Node-Client über den Gateway-WebSocket.

## SSH-Tunnel (CLI + Tools)

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Bei aktivem Tunnel erreichen `openclaw health` und `openclaw status --deep` den entfernten Gateway über `ws://127.0.0.1:18789`. `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` und `openclaw gateway call` können über `--url` ebenfalls eine weitergeleitete URL ansprechen.

<Note>
Ersetzen Sie `18789` durch Ihren konfigurierten `gateway.port` (oder `--port` / `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
`--url` greift niemals auf Anmeldedaten aus der Konfiguration oder der Umgebung zurück. Übergeben Sie `--token` oder `--password` explizit; andernfalls sendet der Client keine Anmeldedaten, und die Verbindung schlägt fehl, wenn der Ziel-Gateway eine Authentifizierung erfordert.
</Warning>

## Remote-Standardwerte der CLI

Speichern Sie ein Remoteziel dauerhaft, damit CLI-Befehle es standardmäßig verwenden:

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

Wenn der Gateway nur an Loopback gebunden ist, belassen Sie die URL bei `ws://127.0.0.1:18789` und öffnen Sie zuerst den SSH-Tunnel. Beim SSH-Tunnel-Transport der macOS-App wird der ermittelte Gateway-Hostname in `gateway.remote.sshTarget` eingetragen (`user@host` oder `user@host:port`); `gateway.remote.url` bleibt die lokale Tunnel-URL. Wenn sich der Remoteport vom lokalen Port unterscheidet, legen Sie `gateway.remote.remotePort` fest.

Die Hostschlüsselüberprüfung ist standardmäßig strikt (`gateway.remote.sshHostKeyPolicy: "strict"`). Setzen Sie sie auf `"openssh"`, um stattdessen Ihre effektive OpenSSH-Konfiguration zu verwenden; prüfen Sie vor der Aktivierung Ihre benutzerspezifischen und systemweiten SSH-Einstellungen.

Verwenden Sie für einen Gateway, der bereits in einem vertrauenswürdigen LAN oder Tailnet erreichbar ist, den Direktmodus:

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

## Priorität der Anmeldedaten

Die Auflösung der Gateway-Anmeldedaten folgt für Aufruf-, Prüf- und Statuspfade sowie die Überwachung von Discord-Ausführungsgenehmigungen einem gemeinsamen Vertrag. Der Node-Host verwendet denselben Vertrag mit einer Ausnahme für den lokalen Modus (er ignoriert `gateway.remote.*`).

- Explizite Anmeldedaten (`--token`, `--password` oder das `gatewayToken` eines Tools) haben bei Aufrufpfaden, die eine explizite Authentifizierung akzeptieren, immer Vorrang.
- Sicherheit bei URL-Überschreibungen:
  - CLI-`--url` verwendet niemals implizite Anmeldedaten aus Konfiguration oder Umgebung.
  - Die Umgebungsvariable `OPENCLAW_GATEWAY_URL` darf nur Umgebungs-Anmeldedaten verwenden (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Standardwerte im lokalen Modus:
  - Token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (Remote-Ausweichwert nur, wenn das lokale Token nicht festgelegt ist)
  - Passwort: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (Remote-Ausweichwert nur, wenn das lokale Passwort nicht festgelegt ist)
- Standardwerte im Remotemodus:
  - Token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - Passwort: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Ausnahme für den lokalen Modus des Node-Hosts: `gateway.remote.token` / `gateway.remote.password` werden ignoriert.
- Token-Prüfungen für Remoteprüfung und -status sind standardmäßig strikt: Beim Ansprechen des Remotemodus verwenden sie ausschließlich `gateway.remote.token` (kein Rückgriff auf das lokale Token).
- Umgebungsüberschreibungen des Gateways verwenden ausschließlich `OPENCLAW_GATEWAY_*`.

## Remotezugriff auf die Chat-UI

WebChat besitzt keinen separaten HTTP-Port; die SwiftUI-Chat-UI stellt direkt eine Verbindung zum Gateway-WebSocket her.

- Leiten Sie `18789` über SSH weiter (siehe oben) und verbinden Sie anschließend Clients mit `ws://127.0.0.1:18789`.
- Verbinden Sie Clients im LAN-/Tailnet-Direktmodus mit der konfigurierten privaten `ws://`- oder sicheren `wss://`-URL.
- Unter macOS verwaltet der Remotemodus der App den ausgewählten Transport automatisch.

## Remotemodus der macOS-App

Die macOS-Menüleisten-App steuert dieselbe Einrichtung vollständig: Remotestatusprüfungen, WebChat und die Weiterleitung von Voice Wake. Runbook: [macOS-Remotezugriff](/de/platforms/mac/remote).

## Sicherheitsregeln (Remote/VPN)

Belassen Sie den Gateway **ausschließlich auf Loopback**, sofern Sie nicht sicher sind, dass Sie eine Bindung benötigen.

- **Loopback + SSH/Tailscale Serve** ist die sicherste Standardeinstellung (keine öffentliche Bereitstellung).
- Unverschlüsseltes `ws://` wird für Loopback-, private/LAN- (RFC 1918), Link-Local-, CGNAT-, `.local`- und `.ts.net`-Hosts akzeptiert. Öffentliche Remotehosts müssen `wss://` verwenden.
- **Nicht-Loopback-Bindungen** (`lan`/`tailnet`/`custom` oder `auto`, wenn Loopback nicht verfügbar ist) müssen die Gateway-Authentifizierung verwenden: Token, Passwort oder einen identitätsbewussten Reverse-Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sind Quellen für Client-Anmeldedaten; sie konfigurieren nicht eigenständig die Serverauthentifizierung.
- Lokale Aufrufpfade können nur dann auf `gateway.remote.*` zurückgreifen, wenn `gateway.auth.*` nicht festgelegt ist.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht aufgelöst ist, schlägt die Auflösung sicher fehl (kein kaschierender Remote-Ausweichwert).
- `gateway.remote.tlsFingerprint` fixiert das entfernte TLS-Zertifikat für `wss://`, einschließlich des macOS-Direktmodus. Ohne gespeicherten Fingerabdruck fixiert macOS das Zertifikat erst bei der ersten Verwendung, nachdem die normale Systemvertrauensprüfung erfolgreich war; selbstsignierte Gateways oder Gateways mit privater Zertifizierungsstelle benötigen einen expliziten Fingerabdruck oder Remotezugriff über SSH.
- **Tailscale Serve** kann Control-UI-/WebSocket-Datenverkehr über Identitätsheader authentifizieren, wenn `gateway.auth.allowTailscale: true` festgelegt ist. HTTP-API-Endpunkte verwenden diese Headerauthentifizierung nicht und folgen stattdessen dem normalen HTTP-Authentifizierungsmodus des Gateways. Dieser tokenlose Ablauf setzt voraus, dass der Gateway-Host vertrauenswürdig ist; setzen Sie ihn auf `false`, um überall eine Authentifizierung mit gemeinsamem Geheimnis zu verwenden.
- Die **Trusted-Proxy**-Authentifizierung erwartet standardmäßig einen identitätsbewussten Proxy ohne Loopback. Loopback-Reverse-Proxys auf demselben Host erfordern explizit `gateway.auth.trustedProxy.allowLoopback = true`.
- Behandeln Sie die Browsersteuerung wie Operatorzugriff: ausschließlich Tailnet plus bewusste Node-Kopplung.

Ausführliche Informationen: [Sicherheit](/de/gateway/security).

### macOS: persistenter SSH-Tunnel über LaunchAgent

Für macOS-Clients verwendet die einfachste persistente Einrichtung einen SSH-`LocalForward`-Konfigurationseintrag sowie einen LaunchAgent, der den Tunnel über Neustarts und Abstürze hinweg aktiv hält.

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

```bash
openclaw config set gateway.remote.token "<your-token>"
```

Verwenden Sie stattdessen `gateway.remote.password`, wenn der entfernte Gateway die Passwortauthentifizierung verwendet. `OPENCLAW_GATEWAY_TOKEN` ist weiterhin als Überschreibung auf Shell-Ebene gültig, die dauerhafte Einrichtung des Remoteclients erfolgt jedoch über `gateway.remote.token` / `gateway.remote.password`.

#### Schritt 4: LaunchAgent erstellen

Speichern Sie die Datei unter `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

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

Der Tunnel startet bei der Anmeldung automatisch, wird nach einem Absturz neu gestartet und hält den weitergeleiteten Port aktiv.

<Note>
Wenn von einer älteren Einrichtung noch ein `com.openclaw.ssh-tunnel`-LaunchAgent vorhanden ist, entladen und löschen Sie ihn.
</Note>

#### Fehlerbehebung

```bash
# Prüfen, ob der Tunnel ausgeführt wird
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789

# Tunnel neu starten
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel

# Tunnel stoppen
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Konfigurationseintrag                  | Funktion                                                            |
| -------------------------------------- | ------------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789`   | Leitet den lokalen Port 18789 an den entfernten Port 18789 weiter   |
| `ssh -N`                               | SSH ohne Ausführung entfernter Befehle (nur Portweiterleitung)      |
| `KeepAlive`                            | Startet den Tunnel nach einem Absturz automatisch neu               |
| `RunAtLoad`                            | Startet den Tunnel, wenn der LaunchAgent bei der Anmeldung geladen wird |

## Verwandte Themen

- [Tailscale](/de/gateway/tailscale)
- [Authentifizierung](/de/gateway/authentication)
- [Einrichtung eines entfernten Gateways](/de/gateway/remote-gateway-readme)
