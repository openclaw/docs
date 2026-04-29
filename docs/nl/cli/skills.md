---
read_when:
    - Je wilt zien welke Skills beschikbaar zijn en klaar zijn om te worden uitgevoerd
    - Je wilt Skills van ClawHub zoeken, installeren of bijwerken
    - Je wilt ontbrekende binaries/env/config voor Skills debuggen
summary: CLI-referentie voor `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-04-29T22:35:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5059bf04c68dabe289d2c376407a52989c970e3d16e7637a2c83f4e24ad6564c
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Inspecteer lokale Skills en installeer/update Skills vanuit ClawHub.

Gerelateerd:

- Skills-systeem: [Skills](/nl/tools/skills)
- Skills-configuratie: [Skills-configuratie](/nl/tools/skills-config)
- ClawHub-installaties: [ClawHub](/nl/tools/clawhub)

## Opdrachten

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills install <slug> --agent <id>
openclaw skills update <slug>
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --json
openclaw skills check --agent <id>
```

`search`/`install`/`update` gebruiken ClawHub rechtstreeks en installeren in de
map `skills/` van de actieve werkruimte. `list`/`info`/`check` inspecteren nog steeds de lokale
Skills die zichtbaar zijn voor de huidige werkruimte en configuratie. Op werkruimte gebaseerde opdrachten
bepalen de doelwerkruimte via `--agent <id>`, daarna via de huidige werkmap
wanneer die zich binnen een geconfigureerde agentwerkruimte bevindt, en daarna via de standaardagent.

Deze CLI-opdracht `install` downloadt Skills-mappen vanuit ClawHub. Door Gateway ondersteunde
installaties van Skills-afhankelijkheden die vanuit onboarding of Skills-instellingen worden geactiveerd, gebruiken in plaats daarvan het
aparte aanvraagpad `skills.install`.

Opmerkingen:

- `search [query...]` accepteert een optionele query; laat deze weg om door de standaard
  ClawHub-zoekfeed te bladeren.
- `search --limit <n>` beperkt het aantal geretourneerde resultaten.
- `install --force` overschrijft een bestaande Skills-map in de werkruimte voor dezelfde
  slug.
- `--agent <id>` richt zich op een geconfigureerde agentwerkruimte en overschrijft de afleiding uit de huidige
  werkmap.
- `update --all` updatet alleen gevolgde ClawHub-installaties in de actieve werkruimte.
- `list` is de standaardactie wanneer er geen subopdracht wordt opgegeven.
- `list`, `info` en `check` schrijven hun weergegeven uitvoer naar stdout. Met
  `--json` betekent dit dat de machineleesbare payload op stdout blijft voor pipes
  en scripts.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Skills](/nl/tools/skills)
