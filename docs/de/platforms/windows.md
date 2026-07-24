---
read_when:
    - OpenClaw unter Windows installieren
    - Auswahl zwischen Windows Hub, nativem Windows und WSL2
    - Einrichten der Windows-Begleit-App oder des Windows-Node-Modus
summary: 'Windows-Unterstützung: Windows Hub, native CLI und Gateway, WSL2-Gateway-Einrichtung, Node-Modus und Fehlerbehebung'
title: Windows
x-i18n:
    generated_at: "2026-07-24T04:00:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c231b81971e1df9f3ee4de1b102c25328c242109331c6465dc802ec003af722b
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw umfasst eine native Begleit-App namens **Windows Hub** sowie Windows-CLI-Unterstützung.
Verwenden Sie Windows Hub als Desktop-App mit Einrichtung, Taskleistenstatus, Chat, Diagnosen im Command
Center und Windows-Node-Funktionen. Verwenden Sie das PowerShell-
Installationsprogramm direkt für CLI/Gateway. Verwenden Sie WSL2 für die am stärksten
Linux-kompatible Gateway-Laufzeitumgebung.

## Empfohlen: Windows Hub

Windows Hub ist die native WinUI-Begleit-App für Windows 10 20H2+ und
Windows 11. Sie lässt sich ohne Administratorrechte installieren und bietet signierte x64-
und ARM64-Installationsprogramme über eine eigene Release-Seite.

Windows Hub wird unabhängig von der OpenClaw-CLI und dem Gateway veröffentlicht. Laden Sie
das neueste stabile Hub-Installationsprogramm von der
[Windows-Hub-Releases-Seite](https://github.com/openclaw/openclaw-windows-node/releases/latest)
oder direkt über `releases/latest/download` herunter:

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-arm64.exe)

Wenn ein Link oben einen 404-Fehler zurückgibt, besuchen Sie die [Windows-Hub-Releases-Seite](https://github.com/openclaw/openclaw-windows-node/releases)
und öffnen Sie das neueste stabile Windows-Hub-Release. Reguläre stabile OpenClaw-Releases
spiegeln außerdem einen festgelegten, für das Release validierten Windows-Hub-Build; dieser Spiegel kann einem
neueren eigenständigen Hub-Release hinterherhinken.

Starten Sie nach der Installation **OpenClaw Companion** über das Startmenü oder den
Infobereich der Taskleiste. Das Installationsprogramm fügt außerdem Verknüpfungen für Gateway Setup, Chat, Settings,
Check for Updates und die Deinstallation hinzu.

### Inhalt von Windows Hub

- Systemstatus im Infobereich und Start bei der Anmeldung.
- Ersteinrichtung für ein lokales, von der App verwaltetes WSL-Gateway.
- Verbindungseinstellungen für lokale, entfernte und über SSH-Tunnel erreichbare Gateways.
- Natives Chatfenster sowie Zugriff auf die browserbasierte Control UI.
- Diagnosen im Command Center für Sitzungen, Nutzung, Kanäle, Nodes, Kopplung
  und Reparaturbefehle.
- Windows-Node-Modus für agentengesteuerte Canvas-, Bildschirm-, Kamera-,
  Benachrichtigungs-, Gerätestatus-, Sprach- und kontrollierte `system.run`-Funktionen.
- Lokaler MCP-Servermodus für MCP-Clients wie Claude Desktop, Claude Code
  und Cursor.

### Erster Start

Beim ersten Start öffnet Windows Hub die Einrichtung, wenn kein verwendbares gespeichertes
Gateway vorhanden ist. Der schnellste Weg ist **Set up locally**. Dabei wird eine
app-eigene `OpenClawGateway`-WSL-Distribution bereitgestellt, das Gateway darin installiert und
die App gekoppelt. Ihre vorhandene Ubuntu-Distribution wird dabei weder exportiert noch verändert.

Wählen Sie **Advanced setup** oder öffnen Sie die Registerkarte Connections, wenn Sie bereits über ein
Gateway verfügen. Sie können eine Verbindung herstellen zu:

- einem lokalen Gateway auf diesem PC
- einem WSL-Gateway auf diesem PC
- einem entfernten Gateway über URL und Token oder Einrichtungscode
- einem über einen SSH-Tunnel erreichbaren Gateway

Nach Abschluss der Einrichtung wird das Taskleistensymbol grün. Öffnen Sie **Command Center** über
den Infobereich, um Verbindung, Kopplung, Node-Status und Kanalzustand zu überprüfen.

## Windows-Node-Modus

Windows Hub kann sich als OpenClaw-Node registrieren, sodass der Agent deklarierte
native Windows-Funktionen über das Gateway verwenden kann. Node-Befehle müssen
vom Node deklariert und von der Gateway-Richtlinie zugelassen sein, bevor sie ausgeführt werden; das vollständige
Zulassungs-/Ablehnungsmodell finden Sie unter [Nodes](/de/nodes#command-policy).

Häufig verwendete Befehle:

| Familie | Befehle                                                                              |
| ------ | ------------------------------------------------------------------------------------ |
| Canvas | `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot` |
| Bildschirm | `screen.snapshot`; `screen.record` erfordert eine ausdrückliche Aktivierung                          |
| Kamera | `camera.list`; `camera.snap`, `camera.clip` erfordern eine ausdrückliche Aktivierung                  |
| System | `system.notify`, `system.run`, `system.run.prepare`, `system.which`                  |
| Gerät | `location.get`, `device.info`, `device.status`                                       |
| Sprache   | `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`, `talk.speak`  |

Der Node-Modus erfordert eine Gateway-Kopplung. Wenn die App eine Kopplungsanfrage anzeigt,
genehmigen Sie diese auf dem Gateway-Host:

```powershell
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Das Gateway leitet nur Befehle weiter, die der Node deklariert und die
Serverrichtlinie zulässt. Datenschutzrelevante Befehle wie `screen.record`, `camera.snap`
und `camera.clip` benötigen eine ausdrückliche `gateway.nodes.commands.allow`-Aktivierung.

## Lokaler MCP-Modus

Windows Hub kann dieselbe Registry nativer Windows-Funktionen als lokalen
MCP-Server über die Loopback-Schnittstelle bereitstellen, sodass lokale MCP-Clients Windows-Funktionen
ohne laufendes OpenClaw-Gateway steuern können.

Aktivieren Sie ihn in den Windows-Hub-Einstellungen im Entwickler-/erweiterten Bereich. Die
App zeigt den Loopback-Endpunkt und das Bearer-Token an, sobald der Server aktiviert ist.

Modusmatrix:

| Node-Modus | MCP-Server | Verhalten                           |
| --------- | ---------- | ---------------------------------- |
| aus       | aus        | Desktop-App nur für Bediener          |
| ein       | aus        | Mit dem Gateway verbundener Windows-Node     |
| aus       | ein        | Nur lokaler MCP-Server              |
| ein       | ein        | Gateway-Node plus lokaler MCP-Server |

## Native Windows-CLI und Gateway

Installieren Sie OpenClaw für die primäre Verwendung im Terminal über PowerShell:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

Überprüfen Sie die Installation:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

Der verwaltete Start verwendet Windows-Aufgabenplanung, sofern verfügbar. Die Aufgabe behält
das lesbare `gateway.cmd`-Skript im OpenClaw-Zustandsverzeichnis bei, startet es jedoch
über einen generierten `gateway.vbs`-WScript-Wrapper, sodass das Gateway im Hintergrund
kein sichtbares Konsolenfenster öffnet. Wenn die Aufgabenerstellung verweigert wird, verwendet OpenClaw
ersatzweise ein benutzerspezifisches Anmeldeelement im Autostart-Ordner.

Installieren Sie den Gateway-Dienst:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Für die ausschließliche CLI-Nutzung ohne verwalteten Gateway-Dienst:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## WSL2-Gateway

WSL2 bleibt die am stärksten Linux-kompatible Gateway-Laufzeitumgebung unter Windows. Windows
Hub kann ein app-eigenes WSL-Gateway für Sie einrichten, oder Sie installieren es manuell in
Ihrer eigenen Distribution.

Manuelle Einrichtung:

```powershell
wsl --install
# Oder wählen Sie explizit eine Distribution aus:
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

Starten Sie WSL über PowerShell neu:

```powershell
wsl --shutdown
```

Installieren Sie anschließend OpenClaw innerhalb von WSL mit dem Linux-Schnellstart:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Automatischer Gateway-Start vor der Windows-Anmeldung

Stellen Sie bei monitorlosen WSL-Einrichtungen sicher, dass die vollständige Startkette ausgeführt wird, auch wenn sich niemand
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

<Note>
Zwei Änderungen gegenüber älteren Anleitungen:

- **`dbus-launch true` anstelle von `/bin/true`**: Unter WSL >= 2.6.1.0 beendet eine
  Regression ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416))
  die inaktive Distribution 15–20 Sekunden nach Beendigung des letzten Clients, selbst
  wenn Linger aktiviert ist. `dbus-launch true` hält als Behelfslösung einen Unterprozess von init
  am Leben (Community-Diskussion, [microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
- **`/ru "$env:USERNAME"` anstelle von `/ru SYSTEM`**: Benutzerspezifische WSL-Distributionen (die
  Standardeinrichtung) sind für das SYSTEM-Konto nicht sichtbar. Daher scheint die Aufgabe
  ausgeführt zu werden, die Distribution startet jedoch nie. Durch die Ausführung unter Ihrem eigenen Konto wird
  dies vermieden; Windows fragt bei der Erstellung der Aufgabe nach Ihrem Passwort.

</Note>

Überprüfen Sie nach dem Neustart in WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## WSL-Dienste im LAN bereitstellen

WSL verfügt über ein eigenes virtuelles Netzwerk. Wenn ein anderer Computer einen Dienst
innerhalb von WSL erreichen muss, leiten Sie einen Windows-Port an die aktuelle WSL-IP-Adresse weiter. Die WSL-IP-Adresse kann
sich nach Neustarts ändern. Aktualisieren Sie daher die Weiterleitungsregel bei Bedarf.

Beispiel in PowerShell als Administrator:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL-IP-Adresse nicht gefunden." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort

New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Hinweise:

- SSH-Verbindungen von einem anderen Computer verwenden die IP-Adresse des Windows-Hosts als Ziel, z. B. `ssh user@windows-host -p 2222`.
- Entfernte Nodes müssen auf eine erreichbare Gateway-URL verweisen, nicht auf `127.0.0.1`.
- Verwenden Sie `listenaddress=0.0.0.0` für den LAN-Zugriff und `127.0.0.1` für ausschließlich lokalen Zugriff.

## Fehlerbehebung

### Das Taskleistensymbol wird nicht angezeigt

Suchen Sie im Task-Manager nach `OpenClaw.Tray.WinUI.exe`. Wenn der Prozess ausgeführt wird, öffnen Sie den
Bereich für ausgeblendete Taskleistensymbole und heften Sie ihn an. Andernfalls starten Sie **OpenClaw Companion** über
das Startmenü.

### Die lokale Einrichtung schlägt fehl

Öffnen Sie das Einrichtungsprotokoll in Windows Hub oder prüfen Sie:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

Häufige Ursachen: deaktiviertes WSL, blockierte Virtualisierung, veralteter app-eigener WSL-
Zustand oder ein Netzwerkfehler bei der Installation des Gateway-Pakets.

### Die App meldet, dass eine Kopplung erforderlich ist

Genehmigen Sie die Bediener- oder Node-Anfrage über das Gateway:

```powershell
openclaw devices list
openclaw devices approve <requestId>
```

Wenn das Gerät bereits über ein Token verfügte, stellen Sie nach der
Genehmigung über die Registerkarte Connections erneut eine Verbindung her.

### Der Webchat kann ein entferntes Gateway nicht erreichen

Ein entfernter Webchat benötigt HTTPS oder localhost. Vertrauen Sie bei selbstsignierten Zertifikaten
dem Zertifikat in Windows oder verwenden Sie einen SSH-Tunnel zu einer localhost-URL.

### `screen.snapshot`-, Kamera- oder Audiobefehle schlagen fehl

Überprüfen Sie die Windows-Berechtigungen für Kamera, Mikrofon, Bildschirmaufnahme und
Benachrichtigungen. Paketierte Installationen deklarieren die geschützten Funktionen, aber
Windows kann bei der ersten Verwendung durch einen Befehl dennoch nachfragen.

### Die Git- oder GitHub-Verbindung schlägt fehl

Einige Netzwerke blockieren oder drosseln HTTPS-Verbindungen zu GitHub. Wenn `git clone` oder
`gh auth login` fehlschlägt, versuchen Sie es über ein anderes Netzwerk, ein VPN oder einen HTTP-/HTTPS-Proxy.

Für tokenbasierte `gh`-Authentifizierung in der aktuellen Sitzung:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

Committen Sie Tokens niemals und fügen Sie sie nicht in Issues oder Pull Requests ein.

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Node.js-Einrichtung](/de/install/node)
- [Nodes](/de/nodes)
- [Control UI](/de/web/control-ui)
- [Gateway-Konfiguration](/de/gateway/configuration)
