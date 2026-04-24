---
read_when:
    - Chcesz zrozumieć, jak przepływ zadań ma się do zadań w tle
    - Napotykasz przepływ zadań lub przepływ zadań openclaw w informacjach o wydaniu albo dokumentacji
    - Chcesz sprawdzić lub zarządzać trwałym stanem przepływu
summary: Warstwa orkiestracji przepływu Task Flow ponad zadaniami w tle
title: Przepływ zadań
x-i18n:
    generated_at: "2026-04-24T08:57:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90286fb783db5417ab5e781377a85be76cd3f9e9b32da57558c2d8f02b813dba
    source_path: automation/taskflow.md
    workflow: 15
---

Przepływ zadań to warstwa orkiestracji przepływów, która znajduje się ponad [zadaniami w tle](/pl/automation/tasks). Zarządza trwałymi, wieloetapowymi przepływami z własnym stanem, śledzeniem rewizji i semantyką synchronizacji, podczas gdy pojedyncze zadania pozostają jednostką pracy odłączonej.

## Kiedy używać przepływu zadań

Używaj przepływu zadań, gdy praca obejmuje wiele kolejnych lub rozgałęzionych etapów i potrzebujesz trwałego śledzenia postępu po ponownych uruchomieniach Gateway. W przypadku pojedynczych operacji w tle wystarczy zwykłe [zadanie](/pl/automation/tasks).

| Scenariusz                            | Użycie                      |
| ------------------------------------- | --------------------------- |
| Pojedyncze zadanie w tle              | Zwykłe zadanie              |
| Wieloetapowy potok (A potem B potem C) | Przepływ zadań (zarządzany) |
| Obserwowanie zadań utworzonych zewnętrznie | Przepływ zadań (lustrzany)  |
| Jednorazowe przypomnienie             | Zadanie Cron                |

## Tryby synchronizacji

### Tryb zarządzany

Przepływ zadań zarządza całym cyklem życia od początku do końca. Tworzy zadania jako kroki przepływu, doprowadza je do ukończenia i automatycznie przechodzi do kolejnego stanu przepływu.

Przykład: tygodniowy przepływ raportu, który (1) zbiera dane, (2) generuje raport i (3) go dostarcza. Przepływ zadań tworzy każdy krok jako zadanie w tle, czeka na ukończenie, a następnie przechodzi do kolejnego kroku.

```bash
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Tryb lustrzany

Przepływ zadań obserwuje zadania utworzone zewnętrznie i utrzymuje stan przepływu zsynchronizowany bez przejmowania odpowiedzialności za tworzenie zadań. Jest to przydatne, gdy zadania pochodzą z zadań Cron, poleceń CLI lub innych źródeł, a chcesz mieć ujednolicony widok ich postępu jako przepływu.

Przykład: trzy niezależne zadania Cron, które razem tworzą procedurę „porannych operacji”. Lustrzany przepływ śledzi ich łączny postęp bez kontrolowania tego, kiedy i jak są uruchamiane.

## Trwały stan i śledzenie rewizji

Każdy przepływ zachowuje własny stan i śledzi rewizje, dzięki czemu postęp przetrwa ponowne uruchomienia Gateway. Śledzenie rewizji umożliwia wykrywanie konfliktów, gdy wiele źródeł próbuje równocześnie przesunąć ten sam przepływ dalej.

## Zachowanie anulowania

`openclaw tasks flow cancel` ustawia trwały zamiar anulowania na przepływie. Aktywne zadania w ramach przepływu są anulowane i nie są uruchamiane żadne nowe kroki. Zamiar anulowania utrzymuje się po ponownych uruchomieniach, więc anulowany przepływ pozostaje anulowany, nawet jeśli Gateway uruchomi się ponownie, zanim wszystkie zadania podrzędne zostaną zakończone.

## Polecenia CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Polecenie                        | Opis                                               |
| -------------------------------- | -------------------------------------------------- |
| `openclaw tasks flow list`        | Pokazuje śledzone przepływy ze statusem i trybem synchronizacji |
| `openclaw tasks flow show <id>`   | Sprawdź pojedynczy przepływ według identyfikatora przepływu lub klucza wyszukiwania |
| `openclaw tasks flow cancel <id>` | Anuluj uruchomiony przepływ i jego aktywne zadania |

## Jak przepływy mają się do zadań

Przepływy koordynują zadania, a nie je zastępują. Pojedynczy przepływ może w trakcie swojego istnienia sterować wieloma zadaniami w tle. Użyj `openclaw tasks`, aby sprawdzić rekordy poszczególnych zadań, oraz `openclaw tasks flow`, aby sprawdzić przepływ orkiestrujący.

## Powiązane

- [Zadania w tle](/pl/automation/tasks) — rejestr pracy odłączonej, którą koordynują przepływy
- [CLI: tasks](/pl/cli/tasks) — dokumentacja poleceń CLI dla `openclaw tasks flow`
- [Przegląd automatyzacji](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania Cron](/pl/automation/cron-jobs) — zadania harmonogramu, które mogą zasilać przepływy
