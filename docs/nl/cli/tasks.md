---
read_when:
    - U wilt records van achtergrondtaken inspecteren, auditen of annuleren
    - Je documenteert TaskFlow-opdrachten onder `openclaw tasks flow`
summary: CLI-referentie voor `openclaw tasks` (achtergrondtaakregister en TaskFlow-status)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-29T22:35:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e61fb0b67a2bdd932b29543199fb219890f256260a66881c8e7ffeb9fadee33
    source_path: cli/tasks.md
    workflow: 16
---

Inspecteer duurzame achtergrondtaken en de Task Flow-status. Zonder subopdracht is
`openclaw tasks` gelijk aan `openclaw tasks list`.

Zie [Achtergrondtaken](/nl/automation/tasks) voor de levenscyclus en het aflevermodel.

## Gebruik

```bash
openclaw tasks
openclaw tasks list
openclaw tasks list --runtime acp
openclaw tasks list --status running
openclaw tasks show <lookup>
openclaw tasks notify <lookup> state_changes
openclaw tasks cancel <lookup>
openclaw tasks audit
openclaw tasks maintenance
openclaw tasks maintenance --apply
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## Hoofdopties

- `--json`: voer JSON uit.
- `--runtime <name>`: filter op soort: `subagent`, `acp`, `cron` of `cli`.
- `--status <name>`: filter op status: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` of `lost`.

## Subopdrachten

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Geeft bijgehouden achtergrondtaken weer, nieuwste eerst.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Toont één taak op taak-ID, uitvoerings-ID of sessiesleutel.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Wijzigt het meldingsbeleid voor een actieve taak.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Annuleert een actieve achtergrondtaak.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Brengt verouderde, verloren, met mislukte aflevering of anderszins inconsistente taak- en Task Flow-records aan het licht. Verloren taken die tot `cleanupAfter` worden bewaard, zijn waarschuwingen; verlopen of niet-gestempelde verloren taken zijn fouten.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Toont een voorbeeld van of past taak- en Task Flow-reconciliatie, opschoonstempeling en verwijdering toe.
Voor cron-taken gebruikt reconciliatie vastgelegde uitvoeringslogboeken/taakstatus voordat een
oude actieve taak als `lost` wordt gemarkeerd, zodat voltooide cron-uitvoeringen geen foutieve auditfouten worden
alleen omdat de in-memory Gateway-runtime-status verdwenen is. Offline CLI-audit is
niet gezaghebbend voor de proceslokale actieve-taakset van de Gateway voor cron.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Inspecteert of annuleert duurzame Task Flow-status onder het taaklogboek.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Achtergrondtaken](/nl/automation/tasks)
