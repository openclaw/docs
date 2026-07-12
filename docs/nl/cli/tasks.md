---
read_when:
    - U wilt records van achtergrondtaken inspecteren, controleren of annuleren
    - Je documenteert TaskFlow-opdrachten onder `openclaw tasks flow`
summary: CLI-referentie voor `openclaw tasks` (register voor achtergrondtaken en TaskFlow-status)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-07-12T08:47:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b03a4aa9fab12b6e5773259a76a1e89fd6e6398c73e5b0533a31e5e3a3894f9c
    source_path: cli/tasks.md
    workflow: 16
---

Inspecteer duurzame achtergrondtaken en de TaskFlow-status. Zonder subopdracht is
`openclaw tasks` gelijk aan `openclaw tasks list`.

Zie [Achtergrondtaken](/nl/automation/tasks) voor het levenscyclus- en afleveringsmodel
en de sectie `tasks audit` daarin voor volledige beschrijvingen van bevindingen.

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

| Vlag               | Beschrijving                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `--json`           | Voer JSON uit.                                                                                     |
| `--runtime <name>` | Filter op type: `subagent`, `acp`, `cron` of `cli`.                                                |
| `--status <name>`  | Filter op status: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` of `lost`.  |

## Subopdrachten

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Toont bijgehouden achtergrondtaken, met de nieuwste eerst.

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

Brengt verouderde, verloren, niet-afgeleverde of anderszins inconsistente taak- en
TaskFlow-records aan het licht. Verloren taken die tot `cleanupAfter` worden bewaard, zijn waarschuwingen;
verlopen of niet van een tijdstempel voorziene verloren taken zijn fouten.

`--code` accepteert taakcodes (`stale_queued`, `stale_running`, `lost`,
`delivery_failed`, `missing_cleanup`, `inconsistent_timestamps`) en TaskFlow-codes
(`restore_failed`, `stale_waiting`, `stale_blocked`,
`cancel_stuck`, `missing_linked_tasks`, `blocked_task_missing`). Zie
[Achtergrondtaken](/nl/automation/tasks) voor details over de ernst en activering per
code.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Geeft een voorbeeld van of past afstemming van taken en TaskFlow, markering voor
opschoning, verwijdering en opschoning van het register van verouderde Cron-uitvoeringssessies toe.

Voor Cron-taken gebruikt de afstemming opgeslagen uitvoeringslogboeken en taakstatussen voordat
een oude actieve taak als `lost` wordt gemarkeerd, zodat voltooide Cron-uitvoeringen geen
onterechte auditfouten worden alleen omdat de Gateway-runtimestatus in het geheugen verdwenen is.
Offline CLI-audit is niet gezaghebbend voor de proceslokale verzameling actieve Cron-taken
van de Gateway. CLI-taken met een uitvoerings-ID/bron-ID worden als `lost` gemarkeerd wanneer
hun actieve Gateway-uitvoeringscontext verdwenen is, zelfs als er nog een oude rij voor een
onderliggende sessie bestaat.

Wanneer toegepast, verwijdert onderhoud ook rijen uit het sessieregister met het patroon
`cron:<jobId>:run:<uuid>` die ouder zijn dan 7 dagen, terwijl momenteel actieve Cron-taken
behouden blijven en rijen van niet-Cron-sessies ongewijzigd blijven.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Inspecteert of annuleert de duurzame TaskFlow-status in het takenlogboek.
`flow list --status` accepteert `queued`, `running`, `waiting`, `blocked`,
`succeeded`, `failed`, `cancelled` of `lost`.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Achtergrondtaken](/nl/automation/tasks)
