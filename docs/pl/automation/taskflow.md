---
read_when:
    - Chcesz zrozumieć, jak Task Flow odnosi się do zadań w tle
    - Natrafiasz na Task Flow lub openclaw tasks flow w informacjach o wydaniu albo dokumentacji
    - Chcesz sprawdzić lub zarządzać trwałym stanem przepływu
summary: Warstwa orkiestracji przepływu Task Flow ponad zadaniami w tle
title: Task Flow
x-i18n:
    generated_at: "2026-04-05T13:42:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 172871206b839845db807d9c627015890f7733b862e276853d5dbfbe29e03883
    source_path: automation/taskflow.md
    workflow: 15
---

# Task Flow

Task Flow to warstwa orkiestracji przepływu, która znajduje się ponad [zadaniami w tle](/automation/tasks). Zarządza trwałymi, wieloetapowymi przepływami z własnym stanem, śledzeniem rewizji i semantyką synchronizacji, podczas gdy pojedyncze zadania pozostają jednostką odłączonej pracy.

## Kiedy używać Task Flow

Używaj Task Flow, gdy praca obejmuje wiele sekwencyjnych lub rozgałęzionych etapów i potrzebujesz trwałego śledzenia postępu po restartach bramy. W przypadku pojedynczych operacji w tle wystarczy zwykłe [zadanie](/automation/tasks).

| Scenariusz                            | Użycie                |
| ------------------------------------- | --------------------- |
| Pojedyncze zadanie w tle              | Zwykłe zadanie        |
| Wieloetapowy potok (A potem B potem C) | Task Flow (zarządzany) |
| Obserwowanie zadań utworzonych zewnętrznie | Task Flow (odwzorowany) |
| Jednorazowe przypomnienie             | Zadanie cron          |

## Tryby synchronizacji

### Tryb zarządzany

Task Flow zarządza całym cyklem życia od początku do końca. Tworzy zadania jako kroki przepływu, doprowadza je do ukończenia i automatycznie przechodzi dalej w stanie przepływu.

Przykład: przepływ cotygodniowego raportu, który (1) zbiera dane, (2) generuje raport i (3) go dostarcza. Task Flow tworzy każdy krok jako zadanie w tle, czeka na ukończenie, a następnie przechodzi do kolejnego kroku.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Tryb odwzorowany

Task Flow obserwuje zadania utworzone zewnętrznie i utrzymuje stan przepływu w synchronizacji bez przejmowania odpowiedzialności za tworzenie zadań. Jest to przydatne, gdy zadania pochodzą z zadań cron, poleceń CLI lub innych źródeł i chcesz mieć ujednolicony widok ich postępu jako przepływu.

Przykład: trzy niezależne zadania cron, które razem tworzą rutynę „porannych operacji”. Odwzorowany przepływ śledzi ich łączny postęp bez kontrolowania, kiedy ani jak są uruchamiane.

## Trwały stan i śledzenie rewizji

Każdy przepływ utrwala własny stan i śledzi rewizje, dzięki czemu postęp przetrwa restarty bramy. Śledzenie rewizji umożliwia wykrywanie konfliktów, gdy wiele źródeł próbuje jednocześnie przesunąć ten sam przepływ dalej.

## Zachowanie anulowania

`openclaw tasks flow cancel` ustawia trwały zamiar anulowania dla przepływu. Aktywne zadania w ramach przepływu są anulowane i nie są uruchamiane żadne nowe kroki. Zamiar anulowania utrzymuje się po restartach, więc anulowany przepływ pozostaje anulowany, nawet jeśli brama uruchomi się ponownie, zanim wszystkie zadania podrzędne zostaną zakończone.

## Polecenia CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Polecenie                        | Opis                                           |
| -------------------------------- | ---------------------------------------------- |
| `openclaw tasks flow list`        | Pokazuje śledzone przepływy wraz ze statusem i trybem synchronizacji |
| `openclaw tasks flow show <id>`   | Sprawdź jeden przepływ według identyfikatora przepływu lub klucza wyszukiwania |
| `openclaw tasks flow cancel <id>` | Anuluj uruchomiony przepływ i jego aktywne zadania |

## Jak przepływy odnoszą się do zadań

Przepływy koordynują zadania, a nie je zastępują. Pojedynczy przepływ może w czasie swojego życia sterować wieloma zadaniami w tle. Użyj `openclaw tasks`, aby sprawdzić poszczególne rekordy zadań, oraz `openclaw tasks flow`, aby sprawdzić przepływ orkiestrujący.

## Powiązane

- [Zadania w tle](/automation/tasks) — rejestr odłączonej pracy, którą koordynują przepływy
- [CLI: tasks](/cli/index#tasks) — dokumentacja poleceń CLI dla `openclaw tasks flow`
- [Przegląd automatyzacji](/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania cron](/automation/cron-jobs) — zaplanowane zadania, które mogą zasilać przepływy
