---
read_when:
    - Je wilt afgeleide vervolgtoezeggingen inspecteren
    - Je wilt openstaande check-ins negeren
    - U controleert wat Heartbeat mag leveren
summary: CLI-referentie voor `openclaw commitments` (afgeleide vervolgacties inspecteren en afwijzen)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-04-29T22:31:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37d5e5dca25cf649a5069360aa4e41fcc33d042dea99f643b98c07189c58f21c
    source_path: cli/commitments.md
    workflow: 16
---

Lijst en beheer afgeleide vervolgtoezeggingen.

Toezeggingen zijn opt-in, kortlevende vervolgherinneringen die worden gemaakt op basis van
gesprekscontext. Zie [Afgeleide toezeggingen](/nl/concepts/commitments) voor de
conceptuele gids.

Zonder subopdracht toont `openclaw commitments` openstaande toezeggingen.

## Gebruik

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Opties

- `--all`: toon alle statussen in plaats van alleen openstaande toezeggingen.
- `--agent <id>`: filter op een agent-id.
- `--status <status>`: filter op status. Waarden: `pending`, `sent`,
  `dismissed`, `snoozed` of `expired`.
- `--json`: voer machineleesbare JSON uit.

## Voorbeelden

Openstaande toezeggingen weergeven:

```bash
openclaw commitments
```

Elke opgeslagen toezegging weergeven:

```bash
openclaw commitments --all
```

Filteren op een agent:

```bash
openclaw commitments --agent main
```

Gesnoozede toezeggingen vinden:

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

Tekstuitvoer bevat:

- toezegging-id
- status
- soort
- vroegste geplande tijd
- bereik
- voorgestelde tekst voor inchecken

JSON-uitvoer bevat ook het pad van de toezeggingenopslag en de volledige opgeslagen records.

## Gerelateerd

- [Afgeleide toezeggingen](/nl/concepts/commitments)
- [Overzicht van Memory](/nl/concepts/memory)
- [Heartbeat](/nl/gateway/heartbeat)
- [Geplande taken](/nl/automation/cron-jobs)
