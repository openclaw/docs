---
read_when:
    - Je wilt zien welke Skills beschikbaar zijn en klaar zijn om te worden uitgevoerd
    - Je wilt Skills van ClawHub zoeken, installeren of bijwerken
    - Je wilt ontbrekende binaire bestanden/env/config voor Skills debuggen
summary: CLI-referentie voor `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-05-02T20:42:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: d819cdc421151a0093423f57a9e974489e9cc02de644358bd5700ee75181192e
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

Inspecteer lokale Skills en installeer/update Skills vanuit ClawHub.

Gerelateerd:

- Skills-systeem: [Skills](/nl/tools/skills)
- Skills-configuratie: [Skills config](/nl/tools/skills-config)
- ClawHub-installaties: [ClawHub](/nl/tools/clawhub)

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
actieve `skills/`-map van de werkruimte. `list`/`info`/`check` inspecteren nog
steeds de lokale Skills die zichtbaar zijn voor de huidige werkruimte en
configuratie. Werkruimtegebaseerde commando's bepalen de doelwerkruimte via
`--agent <id>`, daarna via de huidige werkmap wanneer die zich binnen een
geconfigureerde agentwerkruimte bevindt, en daarna via de standaardagent.

Dit CLI-`install`-commando downloadt skillmappen vanuit ClawHub. Door de Gateway
ondersteunde installaties van skillafhankelijkheden die vanuit onboarding of
Skills-instellingen worden geactiveerd, gebruiken in plaats daarvan het aparte
`skills.install`-aanvraagpad.

Opmerkingen:

- `search [query...]` accepteert een optionele query; laat deze weg om door de
  standaardzoekfeed van ClawHub te bladeren.
- `search --limit <n>` beperkt het aantal geretourneerde resultaten.
- `install --force` overschrijft een bestaande skillmap in de werkruimte voor
  dezelfde slug.
- `--agent <id>` richt zich op één geconfigureerde agentwerkruimte en overschrijft
  afleiding op basis van de huidige werkmap.
- `update --all` updatet alleen gevolgde ClawHub-installaties in de actieve werkruimte.
- `check --agent <id>` controleert de werkruimte van de geselecteerde agent en rapporteert welke
  gereedstaande Skills daadwerkelijk zichtbaar zijn voor de prompt of commando-interface van die agent.
- `list` is de standaardactie wanneer er geen subcommando is opgegeven.
- `list`, `info` en `check` schrijven hun gerenderde uitvoer naar stdout. Met
  `--json` betekent dit dat de machinaal leesbare payload op stdout blijft voor pipes
  en scripts.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Skills](/nl/tools/skills)
