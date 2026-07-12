---
read_when:
    - Chcesz przeglądać, kontrolować lub anulować rekordy zadań działających w tle
    - Dokumentujesz polecenia TaskFlow w sekcji `openclaw tasks flow`
summary: Dokumentacja CLI dla `openclaw tasks` (rejestr zadań w tle i stan TaskFlow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-07-12T15:03:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b03a4aa9fab12b6e5773259a76a1e89fd6e6398c73e5b0533a31e5e3a3894f9c
    source_path: cli/tasks.md
    workflow: 16
---

Sprawdzaj trwałe zadania w tle i stan Task Flow. Bez podkomendy
`openclaw tasks` jest równoważne `openclaw tasks list`.

Zobacz [Zadania w tle](/pl/automation/tasks), aby poznać model cyklu życia i dostarczania,
oraz sekcję `tasks audit`, aby uzyskać pełne opisy wykrytych problemów.

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

| Flaga              | Opis                                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| `--json`           | Wyświetla dane w formacie JSON.                                                                             |
| `--runtime <name>` | Filtruje według rodzaju: `subagent`, `acp`, `cron` lub `cli`.                                               |
| `--status <name>`  | Filtruje według stanu: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` lub `lost`.     |

## Podkomendy

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Wyświetla śledzone zadania w tle, zaczynając od najnowszych.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Wyświetla jedno zadanie na podstawie identyfikatora zadania, identyfikatora uruchomienia lub klucza sesji.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Zmienia zasady powiadamiania dla uruchomionego zadania.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Anuluje uruchomione zadanie w tle.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Wykrywa nieaktualne, utracone, niedostarczone lub w inny sposób niespójne rekordy zadań
i Task Flow. Utracone zadania zachowane do czasu określonego przez `cleanupAfter` generują ostrzeżenia;
utracone zadania, które wygasły lub nie mają sygnatury czasowej, generują błędy.

Opcja `--code` przyjmuje kody zadań (`stale_queued`, `stale_running`, `lost`,
`delivery_failed`, `missing_cleanup`, `inconsistent_timestamps`) oraz kody Task
Flow (`restore_failed`, `stale_waiting`, `stale_blocked`,
`cancel_stuck`, `missing_linked_tasks`, `blocked_task_missing`). Zobacz
[Zadania w tle](/pl/automation/tasks), aby poznać szczegóły poziomu ważności i warunków wyzwalania każdego
kodu.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Wyświetla podgląd lub stosuje uzgadnianie zadań i Task Flow, oznaczanie do czyszczenia,
usuwanie zbędnych danych oraz czyszczenie rejestru sesji nieaktualnych uruchomień cron.

W przypadku zadań cron uzgadnianie korzysta z zapisanych dzienników uruchomień i stanu zadania przed
oznaczeniem starego aktywnego zadania jako `lost`, dzięki czemu ukończone uruchomienia cron nie są
błędnie zgłaszane przez audyt tylko dlatego, że stan środowiska wykonawczego Gateway w pamięci już nie istnieje.
Audyt CLI w trybie offline nie jest miarodajny dla lokalnego dla procesu zbioru aktywnych zadań cron
Gateway. Zadania CLI z identyfikatorem uruchomienia lub identyfikatorem źródła są oznaczane jako `lost`, gdy
ich aktywny kontekst uruchomienia Gateway już nie istnieje, nawet jeśli pozostał stary wiersz sesji podrzędnej.

Po zastosowaniu konserwacja usuwa również z rejestru sesji wiersze
`cron:<jobId>:run:<uuid>` starsze niż 7 dni, zachowując aktualnie uruchomione zadania cron
i pozostawiając wiersze sesji niezwiązane z cron bez zmian.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Sprawdza lub anuluje trwały stan Task Flow w rejestrze zadań.
Opcja `flow list --status` przyjmuje `queued`, `running`, `waiting`, `blocked`,
`succeeded`, `failed`, `cancelled` lub `lost`.

## Powiązane materiały

- [Dokumentacja CLI](/pl/cli)
- [Zadania w tle](/pl/automation/tasks)
