---
read_when:
    - OpenClaw installeren op Windows
    - Kiezen tussen Windows Hub, native Windows en WSL2
    - De Windows-begeleidende app of Windows-node-modus instellen
summary: 'Windows-ondersteuning: Windows Hub, native CLI en Gateway, WSL2-gatewayconfiguratie, node-modus en probleemoplossing'
title: Windows
x-i18n:
    generated_at: "2026-06-27T17:49:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7c7bde33f27bce6c1136ccf688547ee82750d317a997c4a45b354c52ae1b690
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw levert een native **Windows Hub**-companion-app plus Windows CLI-ondersteuning.
Gebruik Windows Hub wanneer je een desktop-app wilt met setup, traystatus, chat,
diagnostiek in het Commandocentrum en Windows-node-mogelijkheden. Gebruik het PowerShell-
installatieprogramma wanneer je de CLI/Gateway direct wilt. Gebruik WSL2 wanneer je de
meest Linux-compatibele Gateway-runtime wilt.

## Aanbevolen: Windows Hub

Windows Hub is de native WinUI-companion-app voor Windows 10 20H2+ en Windows 11. Deze installeert zonder beheerdersrechten en wordt gepubliceerd met ondertekende
x64- en ARM64-installatieprogramma's op OpenClaw-releases.

Download het nieuwste stabiele installatieprogramma vanaf de [OpenClaw-releasepagina](https://github.com/openclaw/openclaw/releases):

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-arm64.exe)
- [Controlesommen](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-SHA256SUMS.txt)

Als een downloadlink hierboven een 404 retourneert, bezoek dan de [releasepagina](https://github.com/openclaw/openclaw/releases) en zoek naar de `OpenClawCompanion-Setup-*`-assets op de nieuwste release.

Start na installatie **OpenClaw Companion** vanuit het Startmenu of het systeemvak.
Het installatieprogramma voegt ook snelkoppelingen toe voor Gateway Setup, Chat, Instellingen,
Controleren op updates en verwijderen.

### Wat Windows Hub bevat

- status in het systeemvak en starten bij aanmelding
- eerste setup voor een lokale, app-eigen WSL Gateway
- verbindingsinstellingen voor lokale, externe en via SSH getunnelde Gateways
- native chatvenster plus toegang tot de browser-Bedienings-UI
- diagnostiek in het Commandocentrum voor sessies, gebruik, kanalen, nodes, koppeling en
  herstelopdrachten
- Windows-node-modus voor door agents aangestuurde canvas, scherm, camera, meldingen,
  apparaatstatus, tekst-naar-spraak, spraak-naar-tekst en beheerde `system.run`
- lokale MCP-servermodus voor MCP-clients zoals Claude Desktop, Claude Code en
  Cursor

### Eerste start

Bij de eerste start opent Windows Hub de setup wanneer er geen bruikbare opgeslagen Gateway is.
Het snelste pad is **Lokaal instellen**, waarmee een app-eigen
`OpenClawGateway` WSL-distro wordt ingericht, de Gateway daarin wordt geïnstalleerd en de app wordt gekoppeld.
Dit exporteert of wijzigt je bestaande Ubuntu-distro niet.

Kies **Geavanceerde setup** of open het tabblad Verbindingen wanneer je al een
Gateway hebt. Je kunt verbinding maken met:

- een lokale Gateway op deze pc
- een WSL Gateway op deze pc
- een externe Gateway via URL en token of setupcode
- een Gateway die via een SSH-tunnel wordt bereikt

Wanneer de setup is voltooid, wordt het traypictogram groen. Open **Commandocentrum** vanuit het
systeemvak om verbinding, koppeling, nodestatus en kanaalgezondheid te bevestigen.

## Windows-node-modus

Windows Hub kan zich registreren als een eersteklas OpenClaw-node. De agent kan vervolgens
gedeclareerde Windows-native mogelijkheden gebruiken via de Gateway.

Veelvoorkomende opdrachten zijn:

- `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`,
  `canvas.snapshot`
- `screen.snapshot` en, met expliciete opt-in, `screen.record`
- `camera.list` en, met expliciete opt-in, `camera.snap`, `camera.clip`
- `system.notify`, `system.run`, `system.run.prepare`, `system.which`
- `location.get`, `device.info`, `device.status`
- `stt.transcribe`, `tts.speak`

Node-modus vereist Gateway-koppeling. Als de app een koppelingsverzoek toont, keur
dit dan goed vanaf de Gateway-host:

```powershell
openclaw devices list
openclaw devices approve <request-id>
openclaw nodes status
```

De Gateway stuurt alleen opdrachten door die de node declareert en die serverbeleid
toestaat. Privacygevoelige opdrachten zoals `screen.record`, `camera.snap` en
`camera.clip` vereisen expliciete `gateway.nodes.allowCommands`-opt-in.

## Lokale MCP-modus

Windows Hub kan hetzelfde Windows-native mogelijkhedenregister aanbieden als een lokale
MCP-server op loopback. Dit is handig wanneer je lokale MCP-clients Windows-
mogelijkheden wilt laten aansturen zonder een actieve OpenClaw Gateway.

Schakel dit in Windows Hub Instellingen in onder de sectie voor ontwikkelaars/geavanceerd. De app
toont het loopback-eindpunt en bearer-token nadat de server is ingeschakeld.

Modusmatrix:

| Node-modus | MCP-server | Gedrag                            |
| ---------- | ---------- | --------------------------------- |
| uit        | uit        | Desktop-app alleen voor operatoren |
| aan        | uit        | Met Gateway verbonden Windows-node |
| uit        | aan        | Alleen lokale MCP-server          |
| aan        | aan        | Gateway-node plus lokale MCP-server |

## Native Windows CLI en Gateway

Voor terminal-eerst gebruik installeer je OpenClaw vanuit PowerShell:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

Verifieer:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

Native Windows CLI- en Gateway-flows worden ondersteund en blijven verbeteren.
Beheerd opstarten gebruikt Windows Geplande taken wanneer beschikbaar. De taak bewaart het
leesbare `gateway.cmd`-script in de OpenClaw-statusmap, maar start het via
een gegenereerde `gateway.vbs` WScript-wrapper zodat de Gateway op de achtergrond geen
zichtbaar consolevenster opent. Als het maken van de taak wordt geweigerd, valt OpenClaw terug op een
aanmelditem in de Startup-map per gebruiker.

Om de Gateway-service te installeren:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Als je alleen CLI-gebruik wilt zonder beheerde Gateway-service:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## WSL2 Gateway

WSL2 blijft de meest Linux-compatibele Gateway-runtime op Windows. Windows Hub
kan een app-eigen WSL Gateway voor je instellen, of je kunt handmatig installeren binnen
je eigen distro.

Handmatige setup:

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Schakel systemd in binnen WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Herstart WSL vanuit PowerShell:

```powershell
wsl --shutdown
```

Installeer vervolgens OpenClaw binnen WSL met de Linux-snelstart:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Gateway automatisch starten vóór Windows-aanmelding

Voor headless WSL-setups moet je ervoor zorgen dat de volledige opstartketen draait, zelfs wanneer niemand zich
bij Windows aanmeldt.

Binnen WSL:

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

In PowerShell als beheerder:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

Vervang `Ubuntu` door je distronaam uit:

```powershell
wsl --list --verbose
```

> **Opmerking:** Twee wijzigingen ten opzichte van oudere recepten:
>
> - **`dbus-launch true` in plaats van `/bin/true`** — In WSL ≥ 2.6.1.0 zorgt een regressie ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416)) ervoor dat de distro 15-20 seconden nadat de laatste client afsluit inactief wordt beëindigd, zelfs met linger ingeschakeld. `dbus-launch true` houdt als workaround een child-of-init-proces actief ([communitydiscussie, microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
> - **`/ru "$env:USERNAME"` in plaats van `/ru SYSTEM`** — WSL-distro's per gebruiker (de standaardsetup) zijn niet zichtbaar voor het SYSTEM-account; de taak lijkt te draaien, maar de distro wordt nooit gestart. Uitvoeren als je eigen account voorkomt dit. Windows vraagt om je wachtwoord wanneer de taak wordt gemaakt.

Verifieer na herstart vanuit WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## WSL-services via LAN beschikbaar maken

WSL heeft een eigen virtueel netwerk. Als een andere machine een service binnen
WSL moet bereiken, stuur dan een Windows-poort door naar het huidige WSL-IP. Het WSL-IP kan na
herstarts veranderen, dus vernieuw de doorstuurregel wanneer nodig.

Voorbeeld in PowerShell als beheerder:

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

Opmerkingen:

- SSH vanaf een andere machine richt zich op het IP-adres van de Windows-host, bijvoorbeeld
  `ssh user@windows-host -p 2222`.
- Externe nodes moeten verwijzen naar een bereikbare Gateway-URL, niet naar `127.0.0.1`.
- Gebruik `listenaddress=0.0.0.0` voor LAN-toegang. Gebruik `127.0.0.1` voor alleen lokale
  toegang.

## Probleemoplossing

### Het traypictogram verschijnt niet

Controleer Taakbeheer op `OpenClaw.Tray.WinUI.exe`. Als het draait, open dan het
gebied met verborgen traypictogrammen en pin het. Als het niet draait, start **OpenClaw
Companion** vanuit het Startmenu.

### Lokale setup mislukt

Open het setuplog vanuit Windows Hub of inspecteer:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

Veelvoorkomende oorzaken zijn uitgeschakelde WSL, geblokkeerde virtualisatie, verouderde app-eigen WSL-
status of een netwerkfout tijdens het installeren van het Gateway-pakket.

### De app zegt dat koppeling vereist is

Keur het operator- of nodeverzoek goed vanaf de Gateway:

```powershell
openclaw devices list
openclaw devices approve <request-id>
```

Als het apparaat al een token had, maak dan opnieuw verbinding vanaf het tabblad Verbindingen na
goedkeuring.

### Webchat kan een externe Gateway niet bereiken

Externe webchat heeft HTTPS of localhost nodig. Vertrouw voor zelfondertekende certificaten
het certificaat in Windows, of gebruik een SSH-tunnel naar een localhost-URL.

### `screen.snapshot`-, camera- of audio-opdrachten mislukken

Controleer Windows-machtigingen voor camera, microfoon, schermopname en
meldingen. Gepackagede installaties declareren de beschermde mogelijkheden, maar Windows
kan nog steeds de eerste keer dat een opdracht ze gebruikt om toestemming vragen.

### Git- of GitHub-connectiviteit mislukt

Sommige netwerken blokkeren of beperken HTTPS naar GitHub. Als `git clone` of `gh auth
login` mislukt, probeer dan een ander netwerk, een VPN of een HTTP/HTTPS-proxy.

Voor tokengebaseerde `gh`-authenticatie in de huidige sessie:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

Commit nooit tokens en plak ze niet in issues of pull requests.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Node.js-setup](/nl/install/node)
- [Nodes](/nl/nodes)
- [Bedienings-UI](/nl/web/control-ui)
- [Gateway-configuratie](/nl/gateway/configuration)
