---
read_when:
    - Je wilt records van achtergrondtaken inspecteren, auditen of annuleren
    - Je documenteert Task Flow-opdrachten onder `openclaw tasks flow`
summary: CLI-referentie voor `openclaw tasks` (achtergrondtaaklogboek en TaskFlow-status)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-10T19:30:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7bbb97690124a8e59ec5e6a517f33166ad449ee6268894ab132ad9cb69dcaa81
    source_path: cli/tasks.md
    workflow: 16
---

Inspecteer duurzame achtergrondtaken en Task Flow-status. Zonder subcommando is
`openclaw tasks` gelijk aan `openclaw tasks list`.

Zie [Achtergrondtaken](/nl/automation/tasks) voor de levenscyclus en het bezorgmodel.

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

- `--json`: voert JSON uit.
- `--runtime <name>`: filter op soort: `subagent`, `acp`, `cron` of `cli`.
- `--status <name>`: filter op status: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` of `lost`.

## Subcommando's

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Geeft bijgehouden achtergrondtaken weer, nieuwste eerst.

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

Brengt verouderde, verloren, met mislukte bezorging of anderszins inconsistente taak- en Task Flow-records naar voren. Verloren taken die tot `cleanupAfter` worden bewaard, zijn waarschuwingen; verlopen of niet-gestempelde verloren taken zijn fouten.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Geeft een voorvertoning van taak- en Task Flow-reconciliatie, opruimstempeling, snoeien
en opschoning van het sessieregister voor verouderde cron-runs, of past deze toe.
Voor cron-taken gebruikt reconciliatie permanente runlogs/taakstatus voordat een
oude actieve taak als `lost` wordt gemarkeerd, zodat voltooide cron-runs geen valse auditfouten worden
alleen omdat de in-memory Gateway-runtime-status verdwenen is. Offline CLI-audit is
niet gezaghebbend voor de proceslokale actieve-taakset van cron in de Gateway. CLI-taken
met een run-ID/bron-ID worden als `lost` gemarkeerd wanneer hun live Gateway-runcontext
verdwenen is, zelfs als er nog een oude onderliggende sessierij bestaat.
Wanneer toegepast, snoeit onderhoud ook `cron:<jobId>:run:<uuid>`-sessieregisterrijen
die ouder zijn dan 7 dagen, terwijl momenteel actieve cron-taken behouden blijven en
niet-cron-sessierijen onaangeroerd blijven.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Inspecteert of annuleert duurzame Task Flow-status onder het taakregister.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Achtergrondtaken](/nl/automation/tasks)
