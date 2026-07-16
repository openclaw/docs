---
read_when:
    - Je wilt afgeleide toezeggingen voor vervolgacties inspecteren
    - Je wilt openstaande check-ins negeren
    - Je controleert wat Heartbeat mogelijk kan afleveren
summary: CLI-referentie voor `openclaw commitments` (afgeleide vervolgacties bekijken en sluiten)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-16T15:19:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: db8a7d8f5756ccb18ed0990fcedf50d1072bb67e775c29eefdbd1a7dd795b7b0
    source_path: cli/commitments.md
    workflow: 16
---

Vervolgtoezeggingen weergeven en beheren die zijn afgeleid uit gesprekken.

Toezeggingen zijn opt-in (`commitments.enabled`), kortstondige herinneringen voor vervolgacties
die worden aangemaakt op basis van gesprekscontext en via Heartbeat worden afgeleverd. Zie
[Afgeleide toezeggingen](/nl/concepts/commitments) voor de conceptuele handleiding en configuratie.

Zonder subopdracht geeft `openclaw commitments` de openstaande toezeggingen weer.

## Gebruik

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Opties

- `--all`: alle statussen weergeven in plaats van alleen openstaande toezeggingen.
- `--agent <id>`: filteren op één agent-id.
- `--status <status>`: filteren op status. Waarden: `pending`, `sent`,
  `dismissed`, `snoozed` of `expired`. Bij onbekende waarden wordt het programma met een fout afgesloten.
- `--json`: machineleesbare JSON uitvoeren.

`dismiss` markeert de opgegeven toezeggings-id's als `dismissed`, zodat Heartbeat
ze niet aflevert.

## Voorbeelden

Openstaande toezeggingen weergeven:

```bash
openclaw commitments
```

Elke opgeslagen toezegging weergeven:

```bash
openclaw commitments --all
```

Filteren op één agent:

```bash
openclaw commitments --agent main
```

Uitgestelde toezeggingen zoeken:

```bash
openclaw commitments --status snoozed
```

Een of meer toezeggingen negeren:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

Exporteren als JSON:

```bash
openclaw commitments --all --json
```

## Uitvoer

Tekstuitvoer toont het aantal toezeggingen, het pad naar de gedeelde SQLite-database, eventuele actieve filters
en één rij per toezegging:

- toezeggings-id
- status
- soort (`event_check_in`, `deadline_check`, `care_check_in` of `open_loop`)
- vroegste vervaltijd
- bereik (agent/kanaal/doel)
- voorgestelde tekst voor het contactmoment

JSON-uitvoer bevat het aantal, de actieve status- en agentfilters, het
pad naar de gedeelde SQLite-database en de volledige opgeslagen records.

## Gerelateerd

- [Afgeleide toezeggingen](/nl/concepts/commitments)
- [Overzicht van geheugen](/nl/concepts/memory)
- [Heartbeat](/nl/gateway/heartbeat)
- [Geplande taken](/nl/automation/cron-jobs)
