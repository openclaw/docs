---
read_when:
    - Je wilt OpenClaw van een machine verwijderen
    - De Gateway-service is na het verwijderen nog steeds actief
summary: OpenClaw volledig verwijderen (CLI, service, status, werkruimte)
title: Verwijderen
x-i18n:
    generated_at: "2026-07-12T09:04:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84f01dc11defe6f19c89232375e48bad383b2e71379f47f43e759d3d7bb908b5
    source_path: install/uninstall.md
    workflow: 16
---

Twee paden:

- **Eenvoudige methode** als `openclaw` nog is geïnstalleerd.
- **Handmatige verwijdering van de service** als de CLI is verwijderd, maar de service nog actief is.

## Eenvoudige methode (CLI nog geïnstalleerd)

Aanbevolen: gebruik het ingebouwde verwijderprogramma:

```bash
openclaw uninstall
```

Bij het verwijderen van de status blijven geconfigureerde werkruimtemappen behouden, tenzij u ook `--workspace` selecteert.

Bekijk vooraf wat er wordt verwijderd (veilig):

```bash
openclaw uninstall --dry-run --all
```

Niet-interactief (automatisering / npx). Gebruik dit voorzichtig en alleen nadat u de bereiken hebt gecontroleerd:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Vlaggen: met `--service`, `--state`, `--workspace` en `--app` selecteert u afzonderlijke bereiken; met `--all` selecteert u alle vier.

Handmatige stappen (zelfde resultaat):

1. Stop de Gateway-service:

```bash
openclaw gateway stop
```

2. Verwijder de Gateway-service (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Verwijder status en configuratie:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Als u `OPENCLAW_CONFIG_PATH` hebt ingesteld op een aangepaste locatie buiten de statusmap, verwijdert u dat bestand ook.
Als u een werkruimte in de statusmap wilt behouden, zoals `~/.openclaw/workspace`, verplaatst u deze voordat u `rm -rf` uitvoert of verwijdert u de inhoud van de statusmap selectief.

4. Verwijder uw werkruimte (optioneel, verwijdert agentbestanden):

```bash
rm -rf ~/.openclaw/workspace
```

5. Verwijder de CLI-installatie (kies de methode die u hebt gebruikt):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Als u de macOS-app hebt geïnstalleerd:

```bash
rm -rf /Applications/OpenClaw.app
```

Opmerkingen:

- Als u profielen hebt gebruikt (`--profile` / `OPENCLAW_PROFILE`), herhaalt u stap 3 voor elke statusmap (standaard zijn dit `~/.openclaw-<profile>`).
- In de externe modus bevindt de statusmap zich op de **Gateway-host**, dus voert u stap 1-4 daar ook uit.

## Handmatige verwijdering van de service (CLI niet geïnstalleerd)

Gebruik dit als de Gateway-service actief blijft, maar `openclaw` ontbreekt.

### macOS (launchd)

Het standaardlabel is `ai.openclaw.gateway` (of `ai.openclaw.<profile>` met een profiel):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Als u een profiel hebt gebruikt, vervangt u het label en de plist-naam door `ai.openclaw.<profile>`.

### Linux (systemd-gebruikerseenheid)

De standaardeenheidsnaam is `openclaw-gateway.service` (of `openclaw-gateway-<profile>.service`). Op computers die vanuit zeer oude installaties zijn bijgewerkt, kan nog een eenheid met de oude naam `clawdbot-gateway.service` bestaan; `openclaw uninstall` / `openclaw gateway uninstall` detecteert en verwijdert deze automatisch.

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (geplande taak)

De standaardtaaknaam is `OpenClaw Gateway` (of `OpenClaw Gateway (<profile>)`).
De taak start een `gateway.vbs`-script zonder venster vanuit uw statusmap, dat vervolgens
`gateway.cmd` uitvoert; verwijder beide.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

Als u een profiel hebt gebruikt, verwijdert u de bijbehorende taaknaam en de bestanden `gateway.cmd` /
`gateway.vbs` onder `~\.openclaw-<profile>`.

## Normale installatie versus broncodecheckout

### Normale installatie (install.sh / npm / pnpm / bun)

Als u `https://openclaw.ai/install.sh` of `install.ps1` hebt gebruikt, is de CLI geïnstalleerd met `npm install -g openclaw@latest`.
Verwijder deze met `npm rm -g openclaw` (of `pnpm remove -g` / `bun remove -g` als u die methode hebt gebruikt).

### Broncodecheckout (git clone)

Als u vanuit een checkout van de repository werkt (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Verwijder de Gateway-service **voordat** u de repository verwijdert (gebruik de eenvoudige methode hierboven of de handmatige verwijdering van de service).
2. Verwijder de repositorymap.
3. Verwijder de status en werkruimte zoals hierboven beschreven.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Migratiehandleiding](/nl/install/migrating)
