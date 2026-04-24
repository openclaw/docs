---
read_when:
    - Chcesz sprawdzać, audytować lub anulować rekordy zadań w tle
    - Dokumentujesz polecenia TaskFlow w sekcji `openclaw tasks flow`
summary: Dokumentacja CLI dla `openclaw tasks` (rejestr zadań w tle i stan TaskFlow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-24T09:04:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55aab29821578bf8c09e1b6cd5bbeb5e3dae4438e453b418fa7e8420412c8152
    source_path: cli/tasks.md
    workflow: 15
---

Sprawdzaj trwałe zadania w tle i stan TaskFlow. Bez podpolecenia
`openclaw tasks` jest równoważne `openclaw tasks list`.

Zobacz [Zadania w tle](/pl/automation/tasks), aby poznać model cyklu życia i dostarczania.

## Użycie

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

## Opcje główne

- `--json`: wyjście JSON.
- `--runtime <name>`: filtruj według rodzaju: `subagent`, `acp`, `cron` lub `cli`.
- `--status <name>`: filtruj według statusu: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` lub `lost`.

## Podpolecenia

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Wyświetla śledzone zadania w tle od najnowszych.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Pokazuje jedno zadanie według identyfikatora zadania, identyfikatora uruchomienia lub klucza sesji.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Zmienia politykę powiadomień dla działającego zadania.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Anuluje działające zadanie w tle.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Ujawnia nieaktualne, utracone, z niedostarczonymi wynikami lub w inny sposób niespójne rekordy zadań i TaskFlow.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Wyświetla podgląd lub stosuje uzgadnianie zadań i TaskFlow, oznaczanie czyszczenia oraz przycinanie.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Sprawdza lub anuluje trwały stan TaskFlow w rejestrze zadań.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Zadania w tle](/pl/automation/tasks)
