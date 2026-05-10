---
read_when:
    - Je wilt zien welke Skills beschikbaar zijn en klaar zijn om uit te voeren
    - Je wilt Skills zoeken, installeren of bijwerken vanuit ClawHub
    - Je wilt ontbrekende uitvoerbare bestanden/omgevingsvariabelen/configuratie voor Skills debuggen
summary: CLI-referentie voor `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-05-10T19:30:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90663068f51cd3aabe9cfcf60e319ce9f9016e338488797869162608132a9e87
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Inspecteer lokale Skills en installeer/update Skills vanuit ClawHub.

Gerelateerd:

- Skills-systeem: [Skills](/nl/tools/skills)
- Skills-configuratie: [Skills-configuratie](/nl/tools/skills-config)
- ClawHub-installaties: [ClawHub](/nl/clawhub/cli)

## Commando's

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
openclaw skills check --agent <id>
openclaw skills check --json
```

`search`/`install`/`update` gebruiken ClawHub rechtstreeks en installeren in de
`skills/`-map van de actieve workspace. `list`/`info`/`check` inspecteren nog steeds de lokale
Skills die zichtbaar zijn voor de huidige workspace en configuratie. Opdrachten met workspace-ondersteuning
lossen de doel-workspace op via `--agent <id>`, daarna via de huidige werkmap
wanneer die zich in een geconfigureerde agent-workspace bevindt, en daarna via de standaardagent.

Deze CLI-opdracht `install` downloadt Skill-mappen van ClawHub. Door Gateway ondersteunde
installaties van Skill-afhankelijkheden die worden geactiveerd vanuit introductie of Skills-instellingen gebruiken in plaats daarvan het
aparte aanvraagpad `skills.install`.

Opmerkingen:

- `search [query...]` accepteert een optionele query; laat deze weg om door de standaard
  ClawHub-zoekfeed te bladeren.
- `search --limit <n>` begrenst de geretourneerde resultaten.
- `install --force` overschrijft een bestaande Skill-map in de workspace voor dezelfde
  slug.
- `--agent <id>` richt zich op een geconfigureerde agent-workspace en overschrijft de afleiding uit de huidige
  werkmap.
- `update --all` updatet alleen gevolgde ClawHub-installaties in de actieve workspace.
- `check --agent <id>` controleert de workspace van de geselecteerde agent en rapporteert welke
  gereedstaande Skills daadwerkelijk zichtbaar zijn voor de prompt- of opdrachtinterface van die agent.
- `list` is de standaardactie wanneer er geen subopdracht is opgegeven.
- `list`, `info` en `check` schrijven hun gerenderde uitvoer naar stdout. Met
  `--json` betekent dit dat de machineleesbare payload op stdout blijft voor pipes
  en scripts.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Skills](/nl/tools/skills)
