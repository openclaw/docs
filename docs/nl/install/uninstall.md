---
read_when:
    - Je wilt OpenClaw van een machine verwijderen
    - De Gateway-service draait nog na de-installatie
summary: OpenClaw volledig verwijderen (CLI, service, staat, werkruimte)
title: Verwijderen
x-i18n:
    generated_at: "2026-06-27T17:43:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0f63bde2769b3d35d928aed1668121086a2952338f2634d45d55da8cc637025b
    source_path: install/uninstall.md
    workflow: 16
---

Twee routes:

- **Eenvoudige route** als `openclaw` nog is geïnstalleerd.
- **Handmatige serviceverwijdering** als de CLI weg is maar de service nog draait.

## Eenvoudige route (CLI nog geïnstalleerd)

Aanbevolen: gebruik het ingebouwde de-installatieprogramma:

```bash
openclaw uninstall
```

Bij gebruik van de CLI blijven geconfigureerde werkruimtemappen behouden wanneer statusgegevens worden verwijderd, tenzij je ook `--workspace` selecteert.

Bekijk vooraf wat wordt verwijderd (veilig):

```bash
openclaw uninstall --dry-run --all
```

Niet-interactief (automatisering / npx). Gebruik dit voorzichtig en alleen nadat je de bereiken hebt bevestigd:

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

3. Verwijder statusgegevens + configuratie:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Als je `OPENCLAW_CONFIG_PATH` hebt ingesteld op een aangepaste locatie buiten de statusmap, verwijder dat bestand dan ook.
Als je een werkruimte binnen de statusmap wilt behouden, zoals `~/.openclaw/workspace`, verplaats die dan voordat je `rm -rf` uitvoert of verwijder de inhoud van de statusmap selectief.

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

- Als je profielen (`--profile` / `OPENCLAW_PROFILE`) hebt gebruikt, herhaal stap 3 dan voor elke statusmap (standaardwaarden zijn `~/.openclaw-<profile>`).
- In externe modus staat de statusmap op de **Gateway-host**, dus voer stappen 1-4 daar ook uit.

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

### Windows (geplande taak)

De standaardtaaknaam is `OpenClaw Gateway` (of `OpenClaw Gateway (<profile>)`).
Het taakscript staat onder je statusmap als `gateway.cmd`; huidige installaties kunnen
ook een vensterloze `gateway.vbs`-launcher aanmaken die door Taakplanner wordt uitgevoerd in plaats
van `gateway.cmd` rechtstreeks te openen.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

Als je een profiel hebt gebruikt, verwijder dan de overeenkomende taaknaam en de `gateway.cmd`- /
`gateway.vbs`-bestanden onder `~\.openclaw-<profile>`.

## Normale installatie versus bron-checkout

### Normale installatie (install.sh / npm / pnpm / bun)

Als je `https://openclaw.ai/install.sh` of `install.ps1` hebt gebruikt, is de CLI geïnstalleerd met `npm install -g openclaw@latest`.
Verwijder deze met `npm rm -g openclaw` (of `pnpm remove -g` / `bun remove -g` als je op die manier hebt geïnstalleerd).

### Bron-checkout (git clone)

Als je vanuit een repo-checkout draait (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Verwijder de Gateway-service **voordat** je de repo verwijdert (gebruik de eenvoudige route hierboven of handmatige serviceverwijdering).
2. Verwijder de repo-map.
3. Verwijder statusgegevens + werkruimte zoals hierboven getoond.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Migratiehandleiding](/nl/install/migrating)
