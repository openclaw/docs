---
read_when:
    - Je wilt records van achtergrondtaken inspecteren, auditen of annuleren
    - Je documenteert Task Flow-opdrachten onder `openclaw tasks flow`
summary: CLI-referentie voor `openclaw tasks` (register voor achtergrondtaken en taakstroomstatus)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-07T13:15:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: ca3f05d7c2a3fa7790ad6059ce15721ebffb548ac4a2c627188ac17986442dc6
    source_path: cli/tasks.md
    workflow: 16
---

Inspecteer persistente achtergrondtaken en de Task Flow-status. Zonder subopdracht is
`openclaw tasks` equivalent aan `openclaw tasks list`.

Zie [Achtergrondtaken](/nl/automation/tasks) voor de levenscyclus en het leveringsmodel.

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

Toont bijgehouden achtergrondtaken, nieuwste eerst.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Toont één taak op taak-ID, run-ID of sessiesleutel.

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

Brengt verouderde, verloren, mislukte levering of anderszins inconsistente taak- en Task Flow-records aan het licht. Verloren taken die tot `cleanupAfter` worden bewaard, zijn waarschuwingen; verlopen of niet-gestempelde verloren taken zijn fouten.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Geeft een voorbeeldweergave van, of past afstemming, cleanup-stempeling en opschoning van taken en Task Flow toe.
Voor cron-taken gebruikt afstemming gepersistente run-logboeken/taakstatus voordat een
oude actieve taak als `lost` wordt gemarkeerd, zodat voltooide cron-runs geen valse auditfouten worden
alleen omdat de in-memory Gateway-runtime-status verdwenen is. Offline CLI-audit is
niet gezaghebbend voor de proceslokale actieve-taakset van de Gateway voor cron. CLI-taken
met een run-ID/bron-ID worden als `lost` gemarkeerd wanneer hun live Gateway-runcontext
verdwenen is, zelfs als er nog een oude child-session-rij bestaat.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Inspecteert of annuleert persistente Task Flow-status onder het taakgrootboek.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Achtergrondtaken](/nl/automation/tasks)
