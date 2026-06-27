---
read_when:
    - OpenClaw unter Windows installieren
    - Auswahl zwischen Windows Hub, nativem Windows und WSL2
    - Windows-Begleit-App oder Windows-Node-Modus einrichten
summary: 'Windows-Unterstützung: Windows Hub, native CLI und Gateway, WSL2-Gateway-Einrichtung, Node-Modus und Fehlerbehebung'
title: Windows
x-i18n:
    generated_at: "2026-06-27T17:44:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7c7bde33f27bce6c1136ccf688547ee82750d317a997c4a45b354c52ae1b690
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw liefert eine native **Windows Hub**-Begleit-App sowie Windows-CLI-Unterstützung aus.
Verwenden Sie Windows Hub, wenn Sie eine Desktop-App mit Einrichtung, Tray-Status, Chat,
Command Center-Diagnosen und Windows-Node-Funktionen möchten. Verwenden Sie den PowerShell-
Installer, wenn Sie die CLI/den Gateway direkt nutzen möchten. Verwenden Sie WSL2, wenn Sie die
Linux-kompatibelste Gateway-Laufzeitumgebung möchten.

## Empfohlen: Windows Hub

Windows Hub ist die native WinUI-Begleit-App für Windows 10 20H2+ und Windows 11. Sie wird ohne Administratorrechte installiert und mit signierten
x64- und ARM64-Installern in OpenClaw-Releases veröffentlicht.

Laden Sie den neuesten stabilen Installer von der [OpenClaw-Releases-Seite](https://github.com/openclaw/openclaw/releases) herunter:

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-arm64.exe)
- [Prüfsummen](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-SHA256SUMS.txt)

Wenn einer der obigen Download-Links einen 404-Fehler zurückgibt, besuchen Sie die [Releases-Seite](https://github.com/openclaw/openclaw/releases) und suchen Sie in der neuesten Version nach den `OpenClawCompanion-Setup-*`-Assets.

Starten Sie nach der Installation **OpenClaw Companion** über das Startmenü oder das System-
Tray. Der Installer fügt außerdem Verknüpfungen für Gateway-Einrichtung, Chat, Einstellungen,
Updateprüfung und Deinstallation hinzu.

### Was Windows Hub enthält

- System-Tray-Status und Start bei Anmeldung
- Ersteinrichtung für einen lokalen, app-eigenen WSL-Gateway
- Verbindungseinstellungen für lokale, entfernte und per SSH-Tunnel erreichbare Gateways
- natives Chat-Fenster sowie Zugriff auf die browserbasierte Control UI
- Command Center-Diagnosen für Sitzungen, Nutzung, Kanäle, Nodes, Kopplung und
  Reparaturbefehle
- Windows-Node-Modus für agentengesteuerten Canvas, Bildschirm, Kamera, Benachrichtigungen,
  Gerätestatus, Text-to-Speech, Speech-to-Text und kontrolliertes `system.run`
- lokaler MCP-Servermodus für MCP-Clients wie Claude Desktop, Claude Code und
  Cursor

### Erster Start

Beim ersten Start öffnet Windows Hub die Einrichtung, wenn kein verwendbarer gespeicherter Gateway vorhanden ist.
Der schnellste Weg ist **Lokal einrichten**. Dabei wird eine app-eigene
`OpenClawGateway`-WSL-Distribution bereitgestellt, der Gateway darin installiert und die App gekoppelt.
Ihre bestehende Ubuntu-Distribution wird dabei weder exportiert noch verändert.

Wählen Sie **Erweiterte Einrichtung** oder öffnen Sie den Tab „Verbindungen“, wenn Sie bereits einen
Gateway haben. Sie können eine Verbindung herstellen zu:

- einem lokalen Gateway auf diesem PC
- einem WSL-Gateway auf diesem PC
- einem entfernten Gateway per URL und Token oder Einrichtungscode
- einem Gateway, der über einen SSH-Tunnel erreichbar ist

Wenn die Einrichtung abgeschlossen ist, wird das Tray-Symbol grün. Öffnen Sie **Command Center** über das
Tray, um Verbindung, Kopplung, Node-Status und Kanalzustand zu prüfen.

## Windows-Node-Modus

Windows Hub kann sich als vollwertiger OpenClaw-Node registrieren. Der Agent kann dann
deklarierte native Windows-Funktionen über den Gateway verwenden.

Häufige Befehle sind:

- `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`,
  `canvas.snapshot`
- `screen.snapshot` und, mit ausdrücklicher Zustimmung, `screen.record`
- `camera.list` und, mit ausdrücklicher Zustimmung, `camera.snap`, `camera.clip`
- `system.notify`, `system.run`, `system.run.prepare`, `system.which`
- `location.get`, `device.info`, `device.status`
- `stt.transcribe`, `tts.speak`

Der Node-Modus erfordert Gateway-Kopplung. Wenn die App eine Kopplungsanfrage anzeigt, genehmigen
Sie sie vom Gateway-Host aus:

```powershell
openclaw devices list
openclaw devices approve <request-id>
openclaw nodes status
```

Der Gateway leitet nur Befehle weiter, die der Node deklariert und die die Serverrichtlinie
erlaubt. Datenschutzsensible Befehle wie `screen.record`, `camera.snap` und
`camera.clip` erfordern eine ausdrückliche `gateway.nodes.allowCommands`-Zustimmung.

## Lokaler MCP-Modus

Windows Hub kann dieselbe Registry nativer Windows-Funktionen als lokalen
MCP-Server auf loopback bereitstellen. Das ist nützlich, wenn lokale MCP-Clients
Windows-Funktionen ohne laufenden OpenClaw Gateway steuern sollen.

Aktivieren Sie dies in den Windows Hub-Einstellungen im Entwickler-/erweiterten Bereich. Die App
zeigt den loopback-Endpunkt und das Bearer-Token an, nachdem der Server aktiviert wurde.

Modusmatrix:

| Node-Modus | MCP-Server | Verhalten                          |
| ---------- | ---------- | ---------------------------------- |
| aus        | aus        | Nur Bediener-Desktop-App           |
| ein        | aus        | Mit Gateway verbundener Windows-Node |
| aus        | ein        | Nur lokaler MCP-Server             |
| ein        | ein        | Gateway-Node plus lokaler MCP-Server |

## Native Windows-CLI und Gateway

Für terminalorientierte Nutzung installieren Sie OpenClaw über PowerShell:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

Prüfen:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

Native Windows-CLI- und Gateway-Flows werden unterstützt und fortlaufend verbessert.
Der verwaltete Start verwendet Windows-Aufgabenplanung, wenn verfügbar. Die Aufgabe behält das
lesbare `gateway.cmd`-Skript im OpenClaw-Zustandsverzeichnis, startet es aber über
einen generierten `gateway.vbs`-WScript-Wrapper, damit der Hintergrund-Gateway kein
sichtbares Konsolenfenster öffnet. Wenn die Aufgabenerstellung verweigert wird, fällt OpenClaw auf ein
benutzerspezifisches Anmeldeelement im Autostart-Ordner zurück.

So installieren Sie den Gateway-Dienst:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Wenn Sie nur die CLI ohne verwalteten Gateway-Dienst verwenden möchten:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## WSL2-Gateway

WSL2 bleibt die Linux-kompatibelste Gateway-Laufzeitumgebung unter Windows. Windows Hub
kann einen app-eigenen WSL-Gateway für Sie einrichten, oder Sie installieren manuell in
Ihrer eigenen Distribution.

Manuelle Einrichtung:

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Aktivieren Sie systemd innerhalb von WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Starten Sie WSL aus PowerShell neu:

```powershell
wsl --shutdown
```

Installieren Sie OpenClaw anschließend innerhalb von WSL mit dem Linux-Schnellstart:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Automatischer Gateway-Start vor der Windows-Anmeldung

Stellen Sie bei headless WSL-Setups sicher, dass die vollständige Boot-Kette ausgeführt wird, auch wenn sich niemand
bei Windows anmeldet.

Innerhalb von WSL:

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

In PowerShell als Administrator:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

Ersetzen Sie `Ubuntu` durch den Namen Ihrer Distribution aus:

```powershell
wsl --list --verbose
```

> **Hinweis:** Zwei Änderungen gegenüber älteren Rezepten:
>
> - **`dbus-launch true` statt `/bin/true`** — Unter WSL ≥ 2.6.1.0 führt eine Regression ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416)) dazu, dass die Distribution 15–20 Sekunden nach dem Beenden des letzten Clients im Leerlauf beendet wird, selbst wenn linger aktiviert ist. `dbus-launch true` hält als Workaround einen Kindprozess von init am Leben ([Community-Diskussion, microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
> - **`/ru "$env:USERNAME"` statt `/ru SYSTEM`** — Benutzerspezifische WSL-Distributionen (die Standardeinrichtung) sind für das SYSTEM-Konto nicht sichtbar; die Aufgabe scheint zu laufen, aber die Distribution wird nie gestartet. Die Ausführung unter Ihrem eigenen Konto vermeidet dies. Windows fordert Sie beim Erstellen der Aufgabe zur Eingabe Ihres Passworts auf.

Prüfen Sie nach dem Neustart aus WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## WSL-Dienste über LAN verfügbar machen

WSL hat ein eigenes virtuelles Netzwerk. Wenn ein anderer Rechner einen Dienst innerhalb von
WSL erreichen muss, leiten Sie einen Windows-Port an die aktuelle WSL-IP weiter. Die WSL-IP kann sich nach
Neustarts ändern. Aktualisieren Sie die Weiterleitungsregel daher bei Bedarf.

Beispiel in PowerShell als Administrator:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort

New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Hinweise:

- SSH von einem anderen Rechner richtet sich an die IP des Windows-Hosts, zum Beispiel
  `ssh user@windows-host -p 2222`.
- Entfernte Nodes müssen auf eine erreichbare Gateway-URL zeigen, nicht auf `127.0.0.1`.
- Verwenden Sie `listenaddress=0.0.0.0` für LAN-Zugriff. Verwenden Sie `127.0.0.1` für ausschließlich lokalen
  Zugriff.

## Fehlerbehebung

### Das Tray-Symbol erscheint nicht

Prüfen Sie im Task-Manager auf `OpenClaw.Tray.WinUI.exe`. Wenn es ausgeführt wird, öffnen Sie den
Bereich für ausgeblendete Tray-Symbole und heften Sie es an. Wenn es nicht ausgeführt wird, starten Sie **OpenClaw
Companion** über das Startmenü.

### Lokale Einrichtung schlägt fehl

Öffnen Sie das Einrichtungsprotokoll in Windows Hub oder prüfen Sie:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

Häufige Ursachen sind deaktiviertes WSL, blockierte Virtualisierung, veralteter app-eigener WSL-
Zustand oder ein Netzwerkfehler beim Installieren des Gateway-Pakets.

### Die App meldet, dass eine Kopplung erforderlich ist

Genehmigen Sie die Bediener- oder Node-Anfrage vom Gateway aus:

```powershell
openclaw devices list
openclaw devices approve <request-id>
```

Wenn das Gerät bereits ein Token hatte, verbinden Sie es nach der Genehmigung über den Tab „Verbindungen“ erneut.

### Webchat kann einen entfernten Gateway nicht erreichen

Entfernter Webchat benötigt HTTPS oder localhost. Vertrauen Sie bei selbstsignierten Zertifikaten
dem Zertifikat in Windows, oder verwenden Sie einen SSH-Tunnel zu einer localhost-URL.

### `screen.snapshot`, Kamera- oder Audiobefehle schlagen fehl

Prüfen Sie die Windows-Berechtigungen für Kamera, Mikrofon, Bildschirmaufnahme und
Benachrichtigungen. Paketierte Installationen deklarieren die geschützten Funktionen, aber Windows
kann beim ersten Verwenden eines Befehls trotzdem nachfragen.

### Git- oder GitHub-Konnektivität schlägt fehl

Einige Netzwerke blockieren oder drosseln HTTPS zu GitHub. Wenn `git clone` oder `gh auth
login` fehlschlägt, versuchen Sie ein anderes Netzwerk, ein VPN oder einen HTTP/HTTPS-Proxy.

Für tokenbasierte `gh`-Authentifizierung in der aktuellen Sitzung:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

Committen Sie niemals Tokens und fügen Sie sie nicht in Issues oder Pull Requests ein.

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Node.js-Einrichtung](/de/install/node)
- [Nodes](/de/nodes)
- [Control UI](/de/web/control-ui)
- [Gateway-Konfiguration](/de/gateway/configuration)
