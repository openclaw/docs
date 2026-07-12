---
read_when:
    - U wilt afgeleide vervolgtoezeggingen inspecteren
    - Je wilt openstaande check-ins negeren
    - U controleert wat de Heartbeat mogelijk aflevert
summary: CLI-referentie voor `openclaw commitments` (afgeleide vervolgacties bekijken en negeren)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-12T08:43:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4323273a5d73975532f4728dc5e40c5d59e0c6d2e31a538f96bf3451e3fdf4d9
    source_path: cli/commitments.md
    workflow: 16
---

Afgeleide vervolgtoezeggingen weergeven en beheren.

Toezeggingen zijn opt-in (`commitments.enabled`), kortstondige herinneringen aan vervolgacties die worden aangemaakt op basis van de gesprekscontext en door Heartbeat worden afgeleverd. Zie [Afgeleide toezeggingen](/nl/concepts/commitments) voor de conceptuele handleiding en configuratie.

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
  `dismissed`, `snoozed` of `expired`. Onbekende waarden sluiten af met een foutmelding.
- `--json`: machineleesbare JSON uitvoeren.

`dismiss` markeert de opgegeven toezeggings-id's als `dismissed`, zodat Heartbeat
ze niet aflevert.

## Voorbeelden

Openstaande toezeggingen weergeven:

```bash
openclaw commitments
```

Alle opgeslagen toezeggingen weergeven:

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

Tekstuitvoer toont het aantal toezeggingen, het opslagpad, eventuele actieve filters
en één rij per toezegging:

- toezeggings-id
- status
- type (`event_check_in`, `deadline_check`, `care_check_in` of `open_loop`)
- vroegste vervaltijd
- bereik (agent/kanaal/doel)
- voorgestelde tekst voor de check-in

JSON-uitvoer bevat het aantal, de actieve status- en agentfilters, het
opslagpad voor toezeggingen en de volledige opgeslagen records.

## Gerelateerd

- [Afgeleide toezeggingen](/nl/concepts/commitments)
- [Overzicht van geheugen](/nl/concepts/memory)
- [Heartbeat](/nl/gateway/heartbeat)
- [Geplande taken](/nl/automation/cron-jobs)
