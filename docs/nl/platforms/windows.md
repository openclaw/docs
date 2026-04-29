---
read_when:
    - OpenClaw installeren op Windows
    - Kiezen tussen native Windows en WSL2
    - Status van de begeleidende Windows-app zoeken
summary: 'Windows-ondersteuning: systeemeigen en WSL2-installatiepaden, daemon en huidige kanttekeningen'
title: Windows
x-i18n:
    generated_at: "2026-04-29T23:01:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc147a9da97ab911ba7529c2170526c50c86711efe6fdf4854e6e0370e4d64ea
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw ondersteunt zowel **native Windows** als **WSL2**. WSL2 is de stabielere
route en wordt aanbevolen voor de volledige ervaring: de CLI, Gateway en
tooling draaien binnen Linux met volledige compatibiliteit. Native Windows werkt voor
kerngebruik van de CLI en Gateway, met enkele kanttekeningen die hieronder staan.

Native Windows-begeleidende apps zijn gepland.

## WSL2 (aanbevolen)

- [Aan de slag](/nl/start/getting-started) (gebruik binnen WSL)
- [Installatie en updates](/nl/install/updating)
- Officiële WSL2-gids (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Status van native Windows

Native Windows CLI-flows worden beter, maar WSL2 is nog steeds de aanbevolen route.

Wat vandaag goed werkt op native Windows:

- website-installatieprogramma via `install.ps1`
- lokaal CLI-gebruik zoals `openclaw --version`, `openclaw doctor` en `openclaw plugins list --json`
- embedded local-agent/provider-smoke zoals:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Huidige kanttekeningen:

- `openclaw onboard --non-interactive` verwacht nog steeds een bereikbare lokale gateway, tenzij je `--skip-health` meegeeft
- `openclaw onboard --non-interactive --install-daemon` en `openclaw gateway install` proberen eerst Windows Scheduled Tasks
- als het aanmaken van Scheduled Tasks wordt geweigerd, valt OpenClaw terug op een login-item per gebruiker in de Startup-map en start de gateway meteen
- als `schtasks` zelf vastloopt of niet meer reageert, breekt OpenClaw dat pad nu snel af en valt terug in plaats van voor altijd te blijven hangen
- Scheduled Tasks hebben nog steeds de voorkeur wanneer ze beschikbaar zijn, omdat ze een betere supervisorstatus bieden

Als je alleen de native CLI wilt, zonder installatie van de gateway-service, gebruik dan een van deze:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Als je wel beheerd opstarten op native Windows wilt:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Als het aanmaken van Scheduled Tasks wordt geblokkeerd, start de fallback-servicemodus nog steeds automatisch na het inloggen via de Startup-map van de huidige gebruiker.

## Gateway

- [Gateway-runbook](/nl/gateway)
- [Configuratie](/nl/gateway/configuration)

## Gateway-service installeren (CLI)

Binnen WSL2:

```
openclaw onboard --install-daemon
```

Of:

```
openclaw gateway install
```

Of:

```
openclaw configure
```

Selecteer **Gateway-service** wanneer daarom wordt gevraagd.

Repareren/migreren:

```
openclaw doctor
```

## Gateway automatisch starten vóór Windows-login

Zorg er bij headless setups voor dat de volledige opstartketen draait, zelfs wanneer niemand inlogt op
Windows.

### 1) Gebruikersservices actief houden zonder login

Binnen WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) De OpenClaw gateway-gebruikersservice installeren

Binnen WSL:

```bash
openclaw gateway install
```

### 3) WSL automatisch starten bij Windows-boot

In PowerShell als Administrator:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

Vervang `Ubuntu` door je distronaam uit:

```powershell
wsl --list --verbose
```

### Opstartketen verifiëren

Controleer na een reboot (vóór Windows-aanmelding) vanuit WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Geavanceerd: WSL-services beschikbaar maken via LAN (portproxy)

WSL heeft een eigen virtueel netwerk. Als een andere machine een service moet bereiken
die **binnen WSL** draait (SSH, een lokale TTS-server of de Gateway), moet je
een Windows-poort doorsturen naar het huidige WSL-IP. Het WSL-IP verandert na herstarts,
dus je moet de doorstuurregel mogelijk vernieuwen.

Voorbeeld (PowerShell **als Administrator**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Sta de poort toe via Windows Firewall (eenmalig):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Vernieuw de portproxy nadat WSL opnieuw is gestart:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

Opmerkingen:

- SSH vanaf een andere machine gebruikt het **Windows-host-IP** als doel (voorbeeld: `ssh user@windows-host -p 2222`).
- Externe nodes moeten verwijzen naar een **bereikbare** Gateway-URL (niet `127.0.0.1`); gebruik
  `openclaw status --all` om dit te bevestigen.
- Gebruik `listenaddress=0.0.0.0` voor LAN-toegang; `127.0.0.1` houdt het alleen lokaal.
- Als je dit automatisch wilt maken, registreer dan een Scheduled Task om de vernieuwingsstap
  bij login uit te voeren.

## Stapsgewijze WSL2-installatie

### 1) WSL2 + Ubuntu installeren

Open PowerShell (Admin):

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Start opnieuw op als Windows daarom vraagt.

### 2) systemd inschakelen (vereist voor gateway-installatie)

In je WSL-terminal:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Vervolgens vanuit PowerShell:

```powershell
wsl --shutdown
```

Open Ubuntu opnieuw en verifieer daarna:

```bash
systemctl --user status
```

### 3) OpenClaw installeren (binnen WSL)

Voor een normale eerste setup binnen WSL volg je de Linux-flow Aan de slag:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

Als je ontwikkelt vanuit de broncode in plaats van een eerste onboarding doet, gebruik dan de
source-dev-loop uit [Setup](/nl/start/setup):

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

Volledige gids: [Aan de slag](/nl/start/getting-started)

## Windows-begeleidende app

We hebben nog geen Windows-begeleidende app. Bijdragen zijn welkom als je wilt
helpen om dit mogelijk te maken.

## Gerelateerd

- [Installatie-overzicht](/nl/install)
- [Platforms](/nl/platforms)
