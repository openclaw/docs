---
read_when:
    - Chcesz sprawdzać, audytować lub anulować rekordy zadań w tle
    - Dokumentujesz polecenia Przepływu zadań w `openclaw tasks flow`
summary: Dokumentacja referencyjna CLI dla `openclaw tasks` (rejestr zadań w tle i stan Task Flow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-05-10T19:30:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7bbb97690124a8e59ec5e6a517f33166ad449ee6268894ab132ad9cb69dcaa81
    source_path: cli/tasks.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Sprawdzaj trwałe zadania w tle oraz stan przepływu zadań. Bez podpolecenia
`openclaw tasks` jest równoważne `openclaw tasks list`.

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

- `--json`: wypisuje JSON.
- `--runtime <name>`: filtruje według rodzaju: `subagent`, `acp`, `cron` lub `cli`.
- `--status <name>`: filtruje według statusu: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` lub `lost`.

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

Zmienia zasadę powiadomień dla uruchomionego zadania.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Anuluje uruchomione zadanie w tle.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Ujawnia nieaktualne, utracone, niedostarczone lub w inny sposób niespójne rekordy zadań i przepływu zadań. Utracone zadania przechowywane do `cleanupAfter` są ostrzeżeniami; wygasłe lub nieostemplowane utracone zadania są błędami.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Podgląda lub stosuje uzgadnianie zadań i przepływu zadań, stemplowanie czyszczenia, przycinanie
oraz czyszczenie rejestru sesji nieaktualnych uruchomień Cron.
W przypadku zadań Cron uzgadnianie używa utrwalonych dzienników uruchomień/stanu zadań przed oznaczeniem
starego aktywnego zadania jako `lost`, dzięki czemu ukończone uruchomienia Cron nie stają się fałszywymi błędami audytu
tylko dlatego, że stan środowiska wykonawczego Gateway w pamięci zniknął. Audyt CLI w trybie offline
nie jest autorytatywny dla lokalnego dla procesu zestawu aktywnych zadań Cron w Gateway. Zadania CLI
z identyfikatorem uruchomienia/identyfikatorem źródła są oznaczane jako `lost`, gdy ich aktywny kontekst uruchomienia Gateway
zniknął, nawet jeśli pozostał stary wiersz sesji podrzędnej.
Po zastosowaniu konserwacja przycina także wiersze rejestru sesji `cron:<jobId>:run:<uuid>`
starsze niż 7 dni, zachowując obecnie uruchomione zadania Cron i pozostawiając
wiersze sesji inne niż Cron bez zmian.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Sprawdza lub anuluje trwały stan przepływu zadań w rejestrze zadań.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Zadania w tle](/pl/automation/tasks)
