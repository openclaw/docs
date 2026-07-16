---
read_when:
    - OpenClaw installeren op Windows
    - Kiezen tussen Windows Hub, native Windows en WSL2
    - De Windows-begeleidende app of de Windows-Node-modus instellen
summary: 'Windows-ondersteuning: Windows Hub, systeemeigen CLI en Gateway, WSL2-Gatewayconfiguratie, Node-modus en probleemoplossing'
title: Windows
x-i18n:
    generated_at: "2026-07-16T16:09:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f1a756d3af3898f211c27c34e16bbcc08f71e214ca1e0d5680c15a091ae1c2ca
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw wordt geleverd met een native begeleidende **Windows Hub**-app plus ondersteuning voor de Windows-CLI.
Gebruik Windows Hub voor een desktop-app met configuratie, systeemvakstatus, chat, diagnostiek in Command
Center en Windows Node-mogelijkheden. Gebruik het PowerShell-
installatieprogramma rechtstreeks voor de CLI/Gateway. Gebruik WSL2 voor de meest
Linux-compatibele Gateway-runtime.

## Aanbevolen: Windows Hub

Windows Hub is de native WinUI-begeleidende app voor Windows 10 20H2+ en
Windows 11. De app wordt zonder beheerdersrechten geïnstalleerd en biedt ondertekende x64-
en ARM64-installatieprogramma's via een eigen releasepagina.

Windows Hub wordt onafhankelijk van de OpenClaw-CLI en Gateway uitgebracht. Download
het nieuwste stabiele Hub-installatieprogramma van de
[releasepagina van Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases/latest)
of rechtstreeks via `releases/latest/download`:

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-arm64.exe)

Als een bovenstaande link een 404-fout geeft, ga je naar de [releasepagina van Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases)
en open je de nieuwste stabiele Windows Hub-release. Reguliere stabiele OpenClaw-releases
bieden ook een gespiegeld, vastgezet en voor de release gevalideerd Windows Hub-build; die spiegel kan achterlopen op een
nieuwere zelfstandige Hub-release.

Start na de installatie **OpenClaw Companion** vanuit het menu Start of het
systeemvak. Het installatieprogramma voegt ook snelkoppelingen toe voor Gateway Setup, Chat, Settings,
Check for Updates en verwijderen.

### Wat Windows Hub bevat

- Systeemvakstatus en starten bij aanmelden.
- Configuratie bij de eerste uitvoering voor een lokale, door de app beheerde WSL-Gateway.
- Verbindingsinstellingen voor lokale, externe en via SSH getunnelde Gateways.
- Native chatvenster plus toegang tot de Control UI in de browser.
- Diagnostiek in Command Center voor sessies, gebruik, kanalen, Nodes, koppeling
  en herstelopdrachten.
- Windows Node-modus voor door agents bestuurd canvas, scherm, camera,
  meldingen, apparaatstatus, spraak en beheerde `system.run`.
- Lokale MCP-servermodus voor MCP-clients zoals Claude Desktop, Claude Code
  en Cursor.

### Eerste start

Bij de eerste start opent Windows Hub de configuratie als er geen bruikbare opgeslagen
Gateway is. De snelste route is **Set up locally**; hiermee wordt een
door de app beheerde `OpenClawGateway` WSL-distributie ingericht, wordt de Gateway daarin geïnstalleerd en
wordt de app gekoppeld. Hiermee wordt je bestaande Ubuntu-distributie niet geëxporteerd of gewijzigd.

Kies **Advanced setup** of open het tabblad Connections als je al een
Gateway hebt. Je kunt verbinding maken met:

- een lokale Gateway op deze pc
- een WSL-Gateway op deze pc
- een externe Gateway via een URL en token of configuratiecode
- een Gateway die via een SSH-tunnel bereikbaar is

Wanneer de configuratie is voltooid, wordt het systeemvakpictogram groen. Open **Command Center** vanuit
het systeemvak om de verbinding, koppeling, Node-status en kanaalstatus te controleren.

## Windows Node-modus

Windows Hub kan zich registreren als een OpenClaw-Node, zodat de agent opgegeven
native Windows-mogelijkheden via de Gateway kan gebruiken. Node-opdrachten moeten door
de Node zijn opgegeven en door het Gateway-beleid zijn toegestaan voordat ze worden uitgevoerd; zie
[Nodes](/nl/nodes#command-policy) voor het volledige toestaan/weigeren-model.

Veelgebruikte opdrachten:

| Familie | Opdrachten                                                                            |
| ------ | ------------------------------------------------------------------------------------ |
| Canvas | `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot` |
| Scherm | `screen.snapshot`; `screen.record` vereist expliciete aanmelding                          |
| Camera | `camera.list`; `camera.snap`, `camera.clip` vereisen expliciete aanmelding                 |
| Systeem | `system.notify`, `system.run`, `system.run.prepare`, `system.which`                  |
| Apparaat | `location.get`, `device.info`, `device.status`                                       |
| Spraak   | `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`, `talk.speak`  |

De Node-modus vereist koppeling met de Gateway. Als de app een koppelingsverzoek toont,
keur je dit goed vanaf de Gateway-host:

```powershell
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

De Gateway stuurt alleen opdrachten door die de Node opgeeft en die het serverbeleid
toestaat. Privacygevoelige opdrachten zoals `screen.record`, `camera.snap`
en `camera.clip` vereisen expliciete `gateway.nodes.allowCommands`-aanmelding.

## Lokale MCP-modus

Windows Hub kan hetzelfde register met native Windows-mogelijkheden beschikbaar stellen als een lokale
MCP-server op loopback, zodat lokale MCP-clients Windows-mogelijkheden kunnen aansturen
zonder dat een OpenClaw-Gateway actief is.

Schakel dit in Windows Hub Settings in onder het gedeelte voor ontwikkelaars/geavanceerde instellingen. De
app toont het loopback-eindpunt en bearer-token zodra de server is ingeschakeld.

Modusmatrix:

| Node-modus | MCP-server | Gedrag                             |
| --------- | ---------- | ---------------------------------- |
| uit       | uit        | Desktop-app alleen voor de operator |
| aan       | uit        | Met Gateway verbonden Windows-Node |
| uit       | aan        | Alleen lokale MCP-server           |
| aan       | aan        | Gateway-Node plus lokale MCP-server |

## Native Windows-CLI en Gateway

Installeer OpenClaw vanuit PowerShell voor gebruik dat voornamelijk via de terminal verloopt:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

Controleren:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

Beheerd opstarten gebruikt waar mogelijk Geplande taken van Windows. De taak bewaart
het leesbare `gateway.cmd`-script in de OpenClaw-statusmap, maar start het
via een gegenereerde `gateway.vbs` WScript-wrapper, zodat de Gateway op de achtergrond
geen zichtbaar consolevenster opent. Als het maken van een taak wordt geweigerd, valt OpenClaw
terug op een aanmeldingsitem per gebruiker in de map Opstarten.

Installeer de Gateway-service:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Voor gebruik van alleen de CLI zonder een beheerde Gateway-service:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## WSL2-Gateway

WSL2 blijft de meest Linux-compatibele Gateway-runtime op Windows. Windows
Hub kan een door de app beheerde WSL-Gateway voor je configureren, of je kunt deze handmatig in
je eigen distributie installeren.

Handmatige configuratie:

```powershell
wsl --install
# Of kies expliciet een distributie:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Schakel systemd in WSL in:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Start WSL opnieuw vanuit PowerShell:

```powershell
wsl --shutdown
```

Installeer OpenClaw vervolgens in WSL met de Linux-snelstart:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Gateway automatisch starten vóór aanmelden bij Windows

Zorg er bij headless WSL-configuraties voor dat de volledige opstartketen wordt uitgevoerd, zelfs als niemand
zich bij Windows aanmeldt.

In WSL:

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

In PowerShell als Administrator:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

Vervang `Ubuntu` door de naam van je distributie uit:

```powershell
wsl --list --verbose
```

<Note>
Twee wijzigingen ten opzichte van oudere instructies:

- **`dbus-launch true` in plaats van `/bin/true`**: in WSL >= 2.6.1.0 beëindigt
  een regressie ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416))
  de distributie wegens inactiviteit 15-20 seconden nadat de laatste client is afgesloten, zelfs
  als linger is ingeschakeld. `dbus-launch true` houdt als tijdelijke oplossing een onderliggend init-proces actief
  (discussie vanuit de community, [microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
- **`/ru "$env:USERNAME"` in plaats van `/ru SYSTEM`**: WSL-distributies per gebruiker (de
  standaardconfiguratie) zijn niet zichtbaar voor het SYSTEM-account, waardoor de taak lijkt
  te worden uitgevoerd, maar de distributie nooit start. Door de taak onder je eigen account uit te voeren,
  wordt dit voorkomen; Windows vraagt om je wachtwoord wanneer de taak wordt gemaakt.

</Note>

Controleer na het opnieuw opstarten vanuit WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## WSL-services beschikbaar stellen via LAN

WSL heeft een eigen virtueel netwerk. Als een andere machine toegang moet krijgen tot een service
in WSL, stuur je een Windows-poort door naar het huidige WSL-IP-adres. Het WSL-IP-adres kan
na opnieuw starten veranderen; werk de doorstuurregel daarom zo nodig bij.

Voorbeeld in PowerShell als Administrator:

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

- SSH vanaf een andere machine gebruikt het IP-adres van de Windows-host, bijvoorbeeld `ssh user@windows-host -p 2222`.
- Externe Nodes moeten verwijzen naar een bereikbare Gateway-URL, niet naar `127.0.0.1`.
- Gebruik `listenaddress=0.0.0.0` voor LAN-toegang en `127.0.0.1` voor uitsluitend lokale toegang.

## Problemen oplossen

### Het systeemvakpictogram verschijnt niet

Controleer Taakbeheer op `OpenClaw.Tray.WinUI.exe`. Als dit proces actief is, open je het
gebied met verborgen systeemvakpictogrammen en zet je het vast. Als het niet actief is, start je **OpenClaw Companion** vanuit
het menu Start.

### Lokale configuratie mislukt

Open het configuratielogboek vanuit Windows Hub of bekijk:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

Veelvoorkomende oorzaken: uitgeschakelde WSL, geblokkeerde virtualisatie, verouderde door de app beheerde WSL-
status of een netwerkfout tijdens het installeren van het Gateway-pakket.

### De app meldt dat koppeling vereist is

Keur het operator- of Node-verzoek goed vanuit de Gateway:

```powershell
openclaw devices list
openclaw devices approve <requestId>
```

Als het apparaat al een token had, maak je na
goedkeuring opnieuw verbinding via het tabblad Connections.

### Webchat kan geen externe Gateway bereiken

Externe webchat vereist HTTPS of localhost. Vertrouw bij zelfondertekende certificaten
het certificaat in Windows, of gebruik een SSH-tunnel naar een localhost-URL.

### `screen.snapshot`-, camera- of audio-opdrachten mislukken

Controleer de Windows-machtigingen voor de camera, microfoon, schermopname en
meldingen. Verpakte installaties geven de beschermde mogelijkheden op, maar
Windows kan nog steeds om toestemming vragen wanneer een opdracht deze voor het eerst gebruikt.

### Verbinding met Git of GitHub mislukt

Sommige netwerken blokkeren of beperken HTTPS-verkeer naar GitHub. Als `git clone` of
`gh auth login` mislukt, probeer je een ander netwerk, een VPN of een HTTP/HTTPS-proxy.

Voor tokengebaseerde `gh`-authenticatie in de huidige sessie:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

Commit tokens nooit en plak ze niet in issues of pull requests.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Node.js-configuratie](/nl/install/node)
- [Nodes](/nl/nodes)
- [Control UI](/nl/web/control-ui)
- [Gateway-configuratie](/nl/gateway/configuration)
