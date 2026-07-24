---
read_when:
    - Remote-Gateway-Setups ausführen oder Fehler beheben
summary: Remotezugriff über Gateway-WS, SSH-Tunnel und Tailnets
title: Fernzugriff
x-i18n:
    generated_at: "2026-07-24T03:52:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f05e32fcfa16d5ddfcd684d0550c9af311914e2b4d91c95edad3490dc2e56d9
    source_path: gateway/remote.md
    workflow: 16
---

OpenClaw führt einen Gateway (den Master) auf einem Host aus und verbindet jeden Client damit. Der Gateway verwaltet Sitzungen, Authentifizierungsprofile, Kanäle und Zustand; alles andere ist ein Client.

- **Operatoren** (Sie oder die macOS-App): Eine direkte LAN-/Tailnet-WebSocket-Verbindung ist am einfachsten, wenn der Gateway erreichbar ist; SSH-Tunneling ist die universelle Ausweichlösung.
- **Nodes** (iOS/Android und andere Geräte): Stellen eine Verbindung zum **WebSocket** des Gateways her (LAN/Tailnet oder SSH-Tunnel).

## Das Grundprinzip

Der Gateway-WebSocket bindet standardmäßig an **Loopback** auf Port `18789` (`gateway.port`). Für die Remote-Nutzung können Sie ihn entweder über Tailscale Serve beziehungsweise eine vertrauenswürdige LAN-/Tailnet-Bindung bereitstellen oder den Loopback-Port über SSH weiterleiten.

## Topologieoptionen

| Einrichtung                              | Ausführungsort des Gateways                                                                                          | Am besten geeignet für                                                                                                                                                        |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dauerhaft aktiver Gateway in Ihrem Tailnet | Permanenter Host (VPS oder Heimserver), erreichbar über Tailscale oder SSH                                            | Laptops, die häufig in den Ruhezustand wechseln, den Agenten aber dauerhaft aktiv benötigen. Siehe [exe.dev](/de/install/exe-dev) (einfache VM) oder [Hetzner](/de/install/hetzner) (Produktions-VPS). |
| Heim-Desktop                             | Desktop; der Laptop verbindet sich remote über den Remote-Modus der macOS-App (Einstellungen → Verbindung → OpenClaw wird ausgeführt) | Ausführung des Agenten auf dauerhaft eingeschalteter Hardware. Anleitung: [macOS-Remotezugriff](/de/platforms/mac/remote).                                                       |
| Laptop                                   | Laptop, sicher über einen SSH-Tunnel oder Tailscale Serve bereitgestellt (`gateway.bind: "loopback"` beibehalten)             | Einrichtungen mit einem einzelnen Computer. Siehe [Tailscale](/de/gateway/tailscale) und [Web](/de/web).                                                                            |

Für dauerhaft aktive Gateway- und Laptop-Einrichtungen sollten Sie `gateway.bind: "loopback"` beibehalten und **Tailscale Serve** für die Control UI oder eine vertrauenswürdige LAN-/Tailnet-Bindung mit `gateway.remote.transport: "direct"` verwenden. Ein SSH-Tunnel ist die Ausweichlösung, die von jedem Computer aus funktioniert.

## Befehlsablauf (was wo ausgeführt wird)

Ein Gateway verwaltet Zustand und Kanäle; Nodes sind Peripheriegeräte. Beispiel (eine Telegram-Nachricht wird an ein Node-Tool weitergeleitet):

1. Die Telegram-Nachricht trifft beim **Gateway** ein.
2. Der Gateway führt den **Agenten** aus, der entscheidet, ob ein Node-Tool aufgerufen wird.
3. Der Gateway ruft den **Node** über den Gateway-WebSocket auf (`node.invoke`-RPC).
4. Der Node gibt das Ergebnis zurück; der Gateway antwortet über Telegram.

Nodes führen den Gateway-Dienst nicht aus. Pro Host sollte nur ein Gateway ausgeführt werden, sofern Sie nicht absichtlich isolierte Profile verwenden (siehe [Mehrere Gateways](/de/gateway/multiple-gateways)). Der „Node-Modus“ der macOS-App ist lediglich ein Node-Client, der den Gateway-WebSocket verwendet.

## SSH-Tunnel (CLI + Tools)

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Wenn der Tunnel aktiv ist, erreichen `openclaw health` und `openclaw status --deep` den Remote-Gateway über `ws://127.0.0.1:18789`. `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` und `openclaw gateway call` können über `--url` ebenfalls eine weitergeleitete URL ansprechen.

<Note>
Ersetzen Sie `18789` durch Ihren konfigurierten `gateway.port` (oder `--port` / `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
`--url` greift niemals auf Anmeldedaten aus der Konfiguration oder Umgebung zurück. Übergeben Sie `--token` oder `--password` ausdrücklich; ohne diese sendet der Client keine Anmeldedaten, und die Verbindung schlägt fehl, wenn der Ziel-Gateway eine Authentifizierung erfordert.
</Warning>

## Remote-Standardeinstellungen der CLI

Speichern Sie ein Remote-Ziel dauerhaft, damit CLI-Befehle es standardmäßig verwenden:

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

Wenn der Gateway ausschließlich an Loopback gebunden ist, belassen Sie die URL auf `ws://127.0.0.1:18789` und öffnen Sie zuerst den SSH-Tunnel. Beim SSH-Tunnel-Transport der macOS-App wird der erkannte Gateway-Hostname in `gateway.remote.sshTarget` eingetragen (`user@host` oder `user@host:port`); `gateway.remote.url` bleibt die lokale Tunnel-URL. Wenn sich der Remote-Port vom lokalen Port unterscheidet, legen Sie `gateway.remote.remotePort` fest.

Die Hostschlüsselüberprüfung ist standardmäßig strikt (`gateway.remote.sshHostKeyPolicy: "strict"`). Setzen Sie sie auf `"openssh"`, um sie stattdessen an Ihre wirksame OpenSSH-Konfiguration zu delegieren; prüfen Sie Ihre benutzerspezifischen und systemweiten SSH-Einstellungen, bevor Sie diese Option aktivieren.

Für einen Gateway, der bereits über ein vertrauenswürdiges LAN oder Tailnet erreichbar ist, verwenden Sie den direkten Modus:

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

Die Auflösung der Gateway-Anmeldedaten folgt für Aufruf-, Prüf- und Statuspfade sowie für die Überwachung von Discord-Ausführungsgenehmigungen einem gemeinsamen Vertrag. Der Node-Host verwendet denselben Vertrag mit einer Ausnahme im lokalen Modus (er ignoriert `gateway.remote.*`).

- Explizite Anmeldedaten (`--token`, `--password` oder `gatewayToken` eines Tools) haben bei Aufrufpfaden, die eine explizite Authentifizierung akzeptieren, immer Vorrang.
- Sicherheit bei URL-Überschreibungen:
  - CLI-`--url` verwendet niemals implizite Anmeldedaten aus Konfiguration oder Umgebung.
  - Umgebungs-`OPENCLAW_GATEWAY_URL` darf ausschließlich Anmeldedaten aus der Umgebung verwenden (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Standardeinstellungen des lokalen Modus:
  - Token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (Remote-Ausweichwert nur, wenn das lokale Token nicht gesetzt ist)
  - Passwort: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (Remote-Ausweichwert nur, wenn das lokale Passwort nicht gesetzt ist)
- Standardeinstellungen des Remote-Modus:
  - Token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - Passwort: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Ausnahme für den lokalen Modus des Node-Hosts: `gateway.remote.token` / `gateway.remote.password` werden ignoriert.
- Token-Prüfungen für Remote-Prüfungen und -Status sind standardmäßig strikt: Beim Ansprechen des Remote-Modus verwenden sie ausschließlich `gateway.remote.token` (kein Rückgriff auf das lokale Token).
- Umgebungsüberschreibungen des Gateways verwenden ausschließlich `OPENCLAW_GATEWAY_*`.

## Remote-Zugriff auf die Chat-Benutzeroberfläche

WebChat besitzt keinen separaten HTTP-Port; die SwiftUI-Chat-Benutzeroberfläche stellt eine direkte Verbindung zum Gateway-WebSocket her.

- Leiten Sie `18789` über SSH weiter (siehe oben) und verbinden Sie die Clients anschließend mit `ws://127.0.0.1:18789`.
- Verbinden Sie die Clients im direkten LAN-/Tailnet-Modus mit der konfigurierten privaten `ws://`- oder sicheren `wss://`-URL.
- Unter macOS verwaltet der Remote-Modus der App den ausgewählten Transport automatisch.

## Remote-Modus der macOS-App

Die macOS-Menüleisten-App steuert dieselbe Einrichtung vollständig: Remote-Statusprüfungen, WebChat und die Weiterleitung von Voice Wake. Anleitung: [macOS-Remotezugriff](/de/platforms/mac/remote).

## Sicherheitsregeln (Remote/VPN)

Belassen Sie den Gateway **ausschließlich auf Loopback**, sofern Sie nicht sicher sind, dass Sie eine Bindung benötigen.

- **Loopback + SSH/Tailscale Serve** ist die sicherste Standardeinstellung (keine öffentliche Bereitstellung).
- Unverschlüsseltes `ws://` wird für Loopback, private Netze/LANs (RFC 1918), Link-Local, CGNAT sowie `.local`- und `.ts.net`-Hosts akzeptiert. Öffentliche Remote-Hosts müssen `wss://` verwenden.
- **Nicht an Loopback gebundene Bindungen** (`lan`/`tailnet`/`custom` oder `auto`, wenn Loopback nicht verfügbar ist) müssen die Gateway-Authentifizierung verwenden: Token, Passwort oder einen identitätsbewussten Reverse-Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sind Quellen für Client-Anmeldedaten; sie konfigurieren nicht eigenständig die Serverauthentifizierung.
- Lokale Aufrufpfade dürfen nur dann auf `gateway.remote.*` zurückgreifen, wenn `gateway.auth.*` nicht gesetzt ist.
- Wenn `gateway.auth.token` / `gateway.auth.password` ausdrücklich über SecretRef konfiguriert ist und nicht aufgelöst werden kann, schlägt die Auflösung geschlossen fehl (keine Verschleierung durch einen Remote-Ausweichwert).
- `gateway.remote.tlsFingerprint` fixiert das Remote-TLS-Zertifikat für `wss://`, einschließlich des Operator-/Steuerungsverkehrs und des zugehörigen Nodes im direkten macOS-Modus. Ohne gespeicherten Fingerabdruck fixiert macOS das Zertifikat bei der ersten Verwendung erst, nachdem die normale Systemvertrauensprüfung bestanden wurde; selbstsignierte Gateways oder Gateways mit privater Zertifizierungsstelle benötigen einen expliziten Fingerabdruck oder „Remote über SSH“.
- **Tailscale Serve** kann Control-UI-/WebSocket-Datenverkehr über Identitätsheader authentifizieren, wenn `gateway.auth.allowTailscale: true`. HTTP-API-Endpunkte verwenden diese Header-Authentifizierung nicht, sondern folgen stattdessen dem normalen HTTP-Authentifizierungsmodus des Gateways. Dieser Ablauf ohne Token setzt voraus, dass der Gateway-Host vertrauenswürdig ist; setzen Sie die Option auf `false`, um überall eine Authentifizierung mit gemeinsamem Geheimnis zu verwenden.
- Die **Trusted-Proxy**-Authentifizierung erwartet standardmäßig einen identitätsbewussten Proxy, der nicht an Loopback gebunden ist. Loopback-Reverse-Proxys auf demselben Host erfordern ausdrücklich `gateway.auth.trustedProxy.allowLoopback = true`.
- Behandeln Sie die Browsersteuerung wie Operatorzugriff: ausschließlich im Tailnet und mit bewusster Node-Kopplung.

Ausführliche Informationen: [Sicherheit](/de/gateway/security).

### macOS: permanenter SSH-Tunnel über LaunchAgent

Für macOS-Clients verwendet die einfachste dauerhafte Einrichtung einen SSH-`LocalForward`-Konfigurationseintrag sowie einen LaunchAgent, der den Tunnel nach Neustarts und Abstürzen aktiv hält.

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

Verwenden Sie stattdessen `gateway.remote.password`, wenn der Remote-Gateway eine Passwortauthentifizierung verwendet. `OPENCLAW_GATEWAY_TOKEN` ist weiterhin als Überschreibung auf Shell-Ebene gültig, die dauerhafte Einrichtung des Remote-Clients erfolgt jedoch über `gateway.remote.token` / `gateway.remote.password`.

#### Schritt 4: LaunchAgent erstellen

Speichern Sie die Datei als `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

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
Wenn noch ein `com.openclaw.ssh-tunnel`-LaunchAgent aus einer älteren Einrichtung vorhanden ist, entladen und löschen Sie ihn.
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

| Konfigurationseintrag                | Funktion                                                     |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Leitet den lokalen Port 18789 an den Remote-Port 18789 weiter |
| `ssh -N`                             | SSH ohne Ausführung von Remote-Befehlen (nur Portweiterleitung) |
| `KeepAlive`                          | Startet den Tunnel automatisch neu, wenn er abstürzt          |
| `RunAtLoad`                          | Startet den Tunnel, wenn der LaunchAgent bei der Anmeldung geladen wird |

## Verwandte Themen

- [Tailscale](/de/gateway/tailscale)
- [Authentifizierung](/de/gateway/authentication)
- [Einrichtung eines Remote-Gateways](/de/gateway/remote-gateway-readme)
