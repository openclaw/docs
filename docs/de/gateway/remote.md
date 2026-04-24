---
read_when:
    - Remote-Gateway-Setups ausführen oder Fehler beheben
summary: Fernzugriff mit SSH-Tunneln (Gateway WS) und Tailnets
title: Fernzugriff
x-i18n:
    generated_at: "2026-04-24T08:57:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66eebbe3762134f29f982201d7e79a789624b96042bd931e07d9855710d64bfe
    source_path: gateway/remote.md
    workflow: 15
---

# Fernzugriff (SSH, Tunnel und Tailnets)

Dieses Repo unterstützt „remote over SSH“, indem ein einzelnes Gateway (das Master-Gateway) auf einem dedizierten Host (Desktop/Server) läuft und Clients damit verbunden werden.

- Für **Operatoren (du / die macOS-App)**: SSH-Tunneling ist der universelle Fallback.
- Für **Nodes (iOS/Android und zukünftige Geräte)**: Verbindung zum Gateway-**WebSocket** (**LAN**/Tailnet oder SSH-Tunnel nach Bedarf).

## Die Grundidee

- Der Gateway-WebSocket bindet an **loopback** auf deinem konfigurierten Port (standardmäßig 18789).
- Für die Remote-Nutzung leitest du diesen loopback-Port per SSH weiter (oder verwendest ein Tailnet/VPN und brauchst weniger Tunnel).

## Gängige VPN-/Tailnet-Setups (wo der Agent lebt)

Betrachte den **Gateway-Host** als den Ort, „an dem der Agent lebt“. Er besitzt Sitzungen, Auth-Profile, Kanäle und Status.
Dein Laptop/Desktop (und Nodes) verbinden sich mit diesem Host.

### 1) Immer aktives Gateway in deinem Tailnet (VPS oder Heimserver)

Führe das Gateway auf einem persistenten Host aus und greife über **Tailscale** oder SSH darauf zu.

- **Beste UX:** Behalte `gateway.bind: "loopback"` bei und verwende **Tailscale Serve** für die Control UI.
- **Fallback:** loopback beibehalten + SSH-Tunnel von jedem Rechner, der Zugriff benötigt.
- **Beispiele:** [exe.dev](/de/install/exe-dev) (einfache VM) oder [Hetzner](/de/install/hetzner) (Produktions-VPS).

Das ist ideal, wenn dein Laptop oft im Ruhezustand ist, du den Agent aber immer aktiv haben möchtest.

### 2) Heim-Desktop führt das Gateway aus, Laptop dient als Fernsteuerung

Der Laptop führt den Agent **nicht** aus. Er verbindet sich remote:

- Verwende den Modus **Remote over SSH** der macOS-App (Einstellungen → Allgemein → „OpenClaw läuft“).
- Die App öffnet und verwaltet den Tunnel, sodass WebChat + Zustandsprüfungen „einfach funktionieren“.

Runbook: [macOS-Fernzugriff](/de/platforms/mac/remote).

### 3) Laptop führt das Gateway aus, Fernzugriff von anderen Rechnern

Behalte das Gateway lokal, aber stelle es sicher bereit:

- SSH-Tunnel zum Laptop von anderen Rechnern aus, oder
- Tailscale Serve für die Control UI und das Gateway nur auf loopback belassen.

Anleitung: [Tailscale](/de/gateway/tailscale) und [Web-Überblick](/de/web).

## Befehlsablauf (was wo läuft)

Ein Gateway-Dienst besitzt Status + Kanäle. Nodes sind Peripheriegeräte.

Beispielfluss (Telegram → Node):

- Eine Telegram-Nachricht trifft beim **Gateway** ein.
- Das Gateway führt den **Agent** aus und entscheidet, ob ein Node-Tool aufgerufen werden soll.
- Das Gateway ruft den **Node** über den Gateway-WebSocket auf (`node.*`-RPC).
- Der Node gibt das Ergebnis zurück; das Gateway antwortet über Telegram.

Hinweise:

- **Nodes führen den Gateway-Dienst nicht aus.** Pro Host sollte nur ein Gateway laufen, außer du betreibst absichtlich isolierte Profile (siehe [Mehrere Gateways](/de/gateway/multiple-gateways)).
- Der „Node-Modus“ der macOS-App ist lediglich ein Node-Client über den Gateway-WebSocket.

## SSH-Tunnel (CLI + Tools)

Erstelle einen lokalen Tunnel zum entfernten Gateway-WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Wenn der Tunnel aktiv ist:

- `openclaw health` und `openclaw status --deep` erreichen jetzt das entfernte Gateway über `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` und `openclaw gateway call` können bei Bedarf ebenfalls die weitergeleitete URL über `--url` ansprechen.

Hinweis: Ersetze `18789` durch deinen konfigurierten `gateway.port` (oder `--port`/`OPENCLAW_GATEWAY_PORT`).
Hinweis: Wenn du `--url` übergibst, greift die CLI nicht auf Konfigurations- oder Umgebungs-Credentials zurück.
Gib `--token` oder `--password` explizit an. Fehlende explizite Credentials führen zu einem Fehler.

## CLI-Remote-Standards

Du kannst ein Remote-Ziel dauerhaft speichern, damit CLI-Befehle es standardmäßig verwenden:

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

Wenn das Gateway nur auf loopback verfügbar ist, belasse die URL bei `ws://127.0.0.1:18789` und öffne zuerst den SSH-Tunnel.

## Credential-Priorität

Die Auflösung von Gateway-Credentials folgt einem gemeinsamen Vertrag für call/probe/status-Pfade und die Überwachung der Discord-Ausführungsfreigabe. Node-host verwendet denselben Grundvertrag mit einer Ausnahme im lokalen Modus (dort wird `gateway.remote.*` absichtlich ignoriert):

- Explizite Credentials (`--token`, `--password` oder Tool-`gatewayToken`) haben bei Call-Pfaden, die explizite Authentifizierung akzeptieren, immer Vorrang.
- Sicherheit bei URL-Overrides:
  - CLI-URL-Overrides (`--url`) verwenden niemals implizite Credentials aus Konfiguration/Umgebung erneut.
  - URL-Overrides aus Umgebungsvariablen (`OPENCLAW_GATEWAY_URL`) dürfen nur Credentials aus Umgebungsvariablen verwenden (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Standards im lokalen Modus:
  - Token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (der Remote-Fallback gilt nur, wenn keine lokale Auth-Token-Eingabe gesetzt ist)
  - Passwort: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (der Remote-Fallback gilt nur, wenn keine lokale Auth-Passwort-Eingabe gesetzt ist)
- Standards im Remote-Modus:
  - Token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - Passwort: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Ausnahme für Node-host im lokalen Modus: `gateway.remote.token` / `gateway.remote.password` werden ignoriert.
- Token-Prüfungen für Remote probe/status sind standardmäßig strikt: Sie verwenden nur `gateway.remote.token` (kein lokaler Token-Fallback), wenn der Remote-Modus angesprochen wird.
- Gateway-Umgebungs-Overrides verwenden nur `OPENCLAW_GATEWAY_*`.

## Chat-UI über SSH

WebChat verwendet keinen separaten HTTP-Port mehr. Die SwiftUI-Chat-UI verbindet sich direkt mit dem Gateway-WebSocket.

- Leite `18789` per SSH weiter (siehe oben) und verbinde dann Clients mit `ws://127.0.0.1:18789`.
- Unter macOS solltest du den Modus „Remote over SSH“ der App bevorzugen, da er den Tunnel automatisch verwaltet.

## macOS-App „Remote over SSH“

Die macOS-Menüleisten-App kann dasselbe Setup Ende-zu-Ende steuern (Remote-Statusprüfungen, WebChat und Voice-Wake-Weiterleitung).

Runbook: [macOS-Fernzugriff](/de/platforms/mac/remote).

## Sicherheitsregeln (Remote/VPN)

Kurzfassung: **Belasse das Gateway nur auf loopback**, außer du bist sicher, dass du ein anderes Binding brauchst.

- **Loopback + SSH/Tailscale Serve** ist der sicherste Standard (keine öffentliche Exposition).
- Klartext-`ws://` ist standardmäßig nur für loopback erlaubt. Für vertrauenswürdige private Netzwerke
  setze `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` im Client-Prozess als
  Break-Glass-Maßnahme. Es gibt kein `openclaw.json`-Äquivalent; dies muss in der
  Prozessumgebung des Clients gesetzt werden, der die WebSocket-Verbindung herstellt.
- **Nicht-loopback-Bindings** (`lan`/`tailnet`/`custom` oder `auto`, wenn loopback nicht verfügbar ist) müssen Gateway-Authentifizierung verwenden: Token, Passwort oder einen identitätsbewussten Reverse Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sind Quellen für Client-Credentials. Sie konfigurieren **nicht** eigenständig die Server-Authentifizierung.
- Lokale Call-Pfade können `gateway.remote.*` nur dann als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht aufgelöst werden, schlägt die Auflösung fail-closed fehl (kein verdeckender Remote-Fallback).
- `gateway.remote.tlsFingerprint` pinnt das entfernte TLS-Zertifikat bei Verwendung von `wss://`.
- **Tailscale Serve** kann Control-UI-/WebSocket-Verkehr über Identitäts-Header authentifizieren,
  wenn `gateway.auth.allowTailscale: true`; HTTP-API-Endpunkte verwenden diese
  Tailscale-Header-Authentifizierung nicht und folgen stattdessen dem normalen HTTP-
  Auth-Modus des Gateways. Dieser tokenlose Ablauf setzt voraus, dass dem Gateway-Host vertraut wird. Setze den Wert auf
  `false`, wenn du überall Authentifizierung mit gemeinsamem Geheimnis möchtest.
- Die **trusted-proxy**-Authentifizierung ist nur für nicht-loopback-Setups mit identitätsbewusstem Proxy gedacht.
  Reverse Proxies auf demselben Host mit loopback erfüllen `gateway.auth.mode: "trusted-proxy"` nicht.
- Betrachte Browser-Steuerung wie Operator-Zugriff: nur Tailnet + bewusstes Node-Pairing.

Ausführlich: [Sicherheit](/de/gateway/security).

### macOS: persistenter SSH-Tunnel per LaunchAgent

Für macOS-Clients, die sich mit einem entfernten Gateway verbinden, verwendet das einfachste persistente Setup einen SSH-`LocalForward`-Eintrag in der Konfiguration sowie einen LaunchAgent, um den Tunnel über Neustarts und Abstürze hinweg aktiv zu halten.

#### Schritt 1: SSH-Konfiguration hinzufügen

Bearbeite `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Ersetze `<REMOTE_IP>` und `<REMOTE_USER>` durch deine Werte.

#### Schritt 2: SSH-Schlüssel kopieren (einmalig)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Schritt 3: das Gateway-Token konfigurieren

Speichere das Token in der Konfiguration, damit es Neustarts überdauert:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Schritt 4: den LaunchAgent erstellen

Speichere dies als `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

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

Der Tunnel wird automatisch bei der Anmeldung gestartet, nach einem Absturz neu gestartet und hält den weitergeleiteten Port aktiv.

Hinweis: Wenn du einen übrig gebliebenen `com.openclaw.ssh-tunnel`-LaunchAgent aus einem älteren Setup hast, entlade und lösche ihn.

#### Fehlerbehebung

Prüfe, ob der Tunnel läuft:

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

| Konfigurationseintrag               | Funktion                                                     |
| ----------------------------------- | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Leitet den lokalen Port 18789 an den entfernten Port 18789 weiter |
| `ssh -N`                            | SSH ohne Ausführung entfernter Befehle (nur Port-Weiterleitung) |
| `KeepAlive`                         | Startet den Tunnel automatisch neu, wenn er abstürzt         |
| `RunAtLoad`                         | Startet den Tunnel, wenn der LaunchAgent bei der Anmeldung geladen wird |

## Verwandt

- [Tailscale](/de/gateway/tailscale)
- [Authentifizierung](/de/gateway/authentication)
- [Remote-Gateway-Setup](/de/gateway/remote-gateway-readme)
