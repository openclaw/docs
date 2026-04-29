---
read_when:
    - U wilt OpenClaw van een machine verwijderen
    - De Gateway-service draait nog na de-installatie
summary: OpenClaw volledig verwijderen (CLI, service, status, werkruimte)
title: De-installeren
x-i18n:
    generated_at: "2026-04-29T22:56:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6d73bc46f4878510706132e5c6cfec3c27cdb55578ed059dc12a785712616d75
    source_path: install/uninstall.md
    workflow: 16
---

Twee paden:

- **Eenvoudig pad** als `openclaw` nog is geïnstalleerd.
- **Handmatige serviceverwijdering** als de CLI weg is maar de service nog draait.

## Eenvoudig pad (CLI nog geïnstalleerd)

Aanbevolen: gebruik het ingebouwde verwijderprogramma:

```bash
openclaw uninstall
```

Niet-interactief (automatisering / npx):

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Handmatige stappen (zelfde resultaat):

1. Stop de Gateway-service:

```bash
openclaw gateway stop
```

2. Verwijder de Gateway-service (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Verwijder status + configuratie:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Als je `OPENCLAW_CONFIG_PATH` hebt ingesteld op een aangepaste locatie buiten de statusmap, verwijder dat bestand dan ook.

4. Verwijder je werkruimte (optioneel, verwijdert agentbestanden):

```bash
rm -rf ~/.openclaw/workspace
```

5. Verwijder de CLI-installatie (kies degene die je hebt gebruikt):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Als je de macOS-app hebt geïnstalleerd:

```bash
rm -rf /Applications/OpenClaw.app
```

Opmerkingen:

- Als je profielen hebt gebruikt (`--profile` / `OPENCLAW_PROFILE`), herhaal stap 3 voor elke statusmap (standaardwaarden zijn `~/.openclaw-<profile>`).
- In externe modus staat de statusmap op de **Gateway-host**, dus voer stap 1-4 daar ook uit.

## Handmatige serviceverwijdering (CLI niet geïnstalleerd)

Gebruik dit als de Gateway-service blijft draaien maar `openclaw` ontbreekt.

### macOS (launchd)

Het standaardlabel is `ai.openclaw.gateway` (of `ai.openclaw.<profile>`; legacy `com.openclaw.*` kan nog bestaan):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Als je een profiel hebt gebruikt, vervang dan het label en de plist-naam door `ai.openclaw.<profile>`. Verwijder eventuele legacy `com.openclaw.*`-plists als die aanwezig zijn.

### Linux (systemd-gebruikerseenheid)

De standaardnaam van de eenheid is `openclaw-gateway.service` (of `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

De standaardtaaknaam is `OpenClaw Gateway` (of `OpenClaw Gateway (<profile>)`).
Het taakscript staat onder je statusmap.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

Als je een profiel hebt gebruikt, verwijder dan de bijbehorende taaknaam en `~\.openclaw-<profile>\gateway.cmd`.

## Normale installatie versus source-checkout

### Normale installatie (install.sh / npm / pnpm / bun)

Als je `https://openclaw.ai/install.sh` of `install.ps1` hebt gebruikt, is de CLI geïnstalleerd met `npm install -g openclaw@latest`.
Verwijder deze met `npm rm -g openclaw` (of `pnpm remove -g` / `bun remove -g` als je op die manier hebt geïnstalleerd).

### Source-checkout (git clone)

Als je vanuit een repo-checkout draait (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Verwijder de Gateway-service **voordat** je de repo verwijdert (gebruik het eenvoudige pad hierboven of handmatige serviceverwijdering).
2. Verwijder de repo-map.
3. Verwijder status + werkruimte zoals hierboven getoond.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Migratiehandleiding](/nl/install/migrating)
