---
read_when:
    - Chcesz sprawdzić, audytować lub anulować rekordy zadań w tle
    - Dokumentujesz polecenia TaskFlow w `openclaw tasks flow`
summary: Dokumentacja referencyjna CLI dla `openclaw tasks` (rejestr zadań w tle i stan TaskFlow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-07T13:14:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: ca3f05d7c2a3fa7790ad6059ce15721ebffb548ac4a2c627188ac17986442dc6
    source_path: cli/tasks.md
    workflow: 16
---

Sprawdzaj trwałe zadania w tle oraz stan Task Flow. Bez podpolecenia
`openclaw tasks` jest równoważne z `openclaw tasks list`.

Zobacz [Zadania w tle](/pl/automation/tasks), aby poznać cykl życia i model dostarczania.

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

- `--json`: wypisz JSON.
- `--runtime <name>`: filtruj według rodzaju: `subagent`, `acp`, `cron` lub `cli`.
- `--status <name>`: filtruj według statusu: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` lub `lost`.

## Podpolecenia

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Wyświetla śledzone zadania w tle, od najnowszych.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Pokazuje jedno zadanie według identyfikatora zadania, identyfikatora uruchomienia lub klucza sesji.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Zmienia zasady powiadomień dla uruchomionego zadania.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Anuluje uruchomione zadanie w tle.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Ujawnia nieaktualne, utracone, niedostarczone lub w inny sposób niespójne rekordy zadań i Task Flow. Utracone zadania zachowane do `cleanupAfter` są ostrzeżeniami; wygasłe albo utracone zadania bez znacznika czasu są błędami.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Podgląda lub stosuje uzgadnianie zadań i Task Flow, oznaczanie do czyszczenia oraz przycinanie.
W przypadku zadań Cron uzgadnianie używa utrwalonych dzienników uruchomień/stanu zadań przed oznaczeniem
starego aktywnego zadania jako `lost`, dzięki czemu ukończone uruchomienia Cron nie stają się fałszywymi błędami audytu
tylko dlatego, że stan środowiska uruchomieniowego Gateway w pamięci zniknął. Audyt CLI offline nie jest
autorytatywny dla procesowo lokalnego zestawu aktywnych zadań Cron Gateway. Zadania CLI
z identyfikatorem uruchomienia/identyfikatorem źródła są oznaczane jako `lost`, gdy ich kontekst uruchomienia Gateway na żywo
zniknął, nawet jeśli pozostaje stary wiersz sesji podrzędnej.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Sprawdza lub anuluje trwały stan Task Flow w rejestrze zadań.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Zadania w tle](/pl/automation/tasks)
