---
read_when:
    - Chcesz zrozumieć, jak przepływ zadań ma się do zadań w tle
    - Napotykasz Task Flow lub przepływ zadań openclaw w informacjach o wydaniu lub dokumentacji
    - Chcesz sprawdzić lub zarządzać trwałym stanem przepływu
summary: Warstwa orkiestracji przepływu zadań nad zadaniami w tle
title: Przepływ zadań
x-i18n:
    generated_at: "2026-07-02T08:54:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4f5ff3c9a68eb0408a180bc947a03b410568d7914cb1c1d7f31d6013e036096
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow to warstwa bazowa orkiestracji przepływów umieszczona nad [zadaniami w tle](/pl/automation/tasks). Zarządza trwałymi, wieloetapowymi przepływami z własnym stanem, śledzeniem rewizji i semantyką synchronizacji, podczas gdy pojedyncze zadania pozostają jednostką odłączonej pracy.

## Kiedy używać Task Flow

Używaj Task Flow, gdy praca obejmuje wiele sekwencyjnych lub rozgałęzionych kroków i potrzebujesz trwałego śledzenia postępu po restartach Gateway. W przypadku pojedynczych operacji w tle wystarczy zwykłe [zadanie](/pl/automation/tasks).

| Scenariusz                           | Użycie                         |
| ------------------------------------ | ------------------------------ |
| Pojedyncze zadanie w tle             | Zwykłe zadanie                 |
| Wieloetapowy potok (A, potem B, potem C) | Task Flow (zarządzany)      |
| Obserwowanie zadań utworzonych zewnętrznie | Task Flow (lustrzany)     |
| Jednorazowe przypomnienie            | Zadanie Cron                   |

## Wzorzec niezawodnego zaplanowanego przepływu pracy

W przypadku cyklicznych przepływów pracy, takich jak briefingi wywiadu rynkowego, traktuj harmonogram, orkiestrację i kontrole niezawodności jako oddzielne warstwy:

1. Użyj [Zaplanowanych zadań](/pl/automation/cron-jobs) do określania czasu.
2. Użyj trwałej sesji cron, gdy przepływ pracy ma bazować na wcześniejszym kontekście.
3. Użyj [Lobster](/pl/tools/lobster) do deterministycznych kroków, bramek zatwierdzania i tokenów wznawiania.
4. Użyj Task Flow do śledzenia wieloetapowego uruchomienia obejmującego zadania podrzędne, oczekiwania, ponowienia i restarty Gateway.

Przykładowy kształt cron:

```bash
openclaw cron add \
  --name "Market intelligence brief" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "Run the market-intel Lobster workflow. Verify source freshness before summarizing." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Użyj `session:<id>` zamiast `isolated`, gdy cykliczny przepływ pracy potrzebuje świadomej historii, podsumowań poprzednich uruchomień lub stałego kontekstu. Użyj `isolated`, gdy każde uruchomienie powinno zaczynać od nowa, a cały wymagany stan jest jawnie określony w przepływie pracy.

Wewnątrz przepływu pracy umieść kontrole niezawodności przed krokiem podsumowania LLM:

```yaml
name: market-intel-brief
steps:
  - id: preflight
    command: market-intel check --json
  - id: collect
    command: market-intel collect --json
    stdin: $preflight.json
  - id: summarize
    command: market-intel summarize --json
    stdin: $collect.json
  - id: approve
    command: market-intel deliver --preview
    stdin: $summarize.json
    approval: required
  - id: deliver
    command: market-intel deliver --execute
    stdin: $summarize.json
    condition: $approve.approved
```

Zalecane kontrole wstępne:

- Dostępność przeglądarki i wybór profilu, na przykład `openclaw` dla stanu zarządzanego lub `user`, gdy wymagana jest zalogowana sesja Chrome. Zobacz [Przeglądarka](/pl/tools/browser).
- Dane uwierzytelniające API i limit dla każdego źródła.
- Dostępność sieciowa wymaganych punktów końcowych.
- Wymagane narzędzia włączone dla agenta, takie jak `lobster`, `browser` i `llm-task`.
- Miejsce docelowe awarii skonfigurowane dla cron, aby awarie kontroli wstępnej były widoczne. Zobacz [Zaplanowane zadania](/pl/automation/cron-jobs#delivery-and-output).

Zalecane pola pochodzenia danych dla każdego zebranego elementu:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Skonfiguruj przepływ pracy tak, aby odrzucał lub oznaczał nieaktualne elementy przed podsumowaniem. Krok LLM powinien otrzymywać tylko uporządkowany JSON i powinien mieć polecenie zachowania `sourceUrl`, `retrievedAt` oraz `asOf` w swoich danych wyjściowych. Użyj [LLM Task](/pl/tools/llm-task), gdy potrzebujesz w przepływie pracy kroku modelu walidowanego względem schematu.

W przypadku przepływów pracy wielokrotnego użytku dla zespołu lub społeczności spakuj CLI, pliki `.lobster` i wszelkie uwagi konfiguracyjne jako skill lub plugin i opublikuj je przez [ClawHub](/clawhub). Zabezpieczenia specyficzne dla przepływu pracy trzymaj w tym pakiecie, chyba że API pluginu nie ma wymaganej ogólnej możliwości.

## Tryby synchronizacji

### Tryb zarządzany

Task Flow jest właścicielem całego cyklu życia od początku do końca. Tworzy zadania jako kroki przepływu, doprowadza je do ukończenia i automatycznie przesuwa stan przepływu dalej.

Przykład: przepływ cotygodniowego raportu, który (1) zbiera dane, (2) generuje raport i (3) dostarcza go. Task Flow tworzy każdy krok jako zadanie w tle, czeka na ukończenie, a następnie przechodzi do następnego kroku.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Tryb lustrzany

Task Flow obserwuje zadania utworzone zewnętrznie i utrzymuje stan przepływu w synchronizacji bez przejmowania własności tworzenia zadań. Jest to przydatne, gdy zadania pochodzą z zadań cron, poleceń CLI lub innych źródeł, a potrzebujesz ujednoliconego widoku ich postępu jako przepływu.

Przykład: trzy niezależne zadania cron, które razem tworzą rutynę „morning ops”. Przepływ lustrzany śledzi ich łączny postęp bez kontrolowania, kiedy i jak działają.

## Trwały stan i śledzenie rewizji

Każdy przepływ utrwala własny stan i śledzi rewizje, więc postęp przetrwa restarty Gateway. Śledzenie rewizji umożliwia wykrywanie konfliktów, gdy wiele źródeł próbuje jednocześnie przesunąć ten sam przepływ dalej.
Rejestr przepływów używa SQLite z ograniczoną obsługą dziennika zapisu z wyprzedzeniem, w tym
okresowymi punktami kontrolnymi i punktami kontrolnymi przy zamykaniu, aby długo działające Gateway nie zachowywały
nieograniczonych plików towarzyszących `registry.sqlite-wal`.

## Zachowanie anulowania

`openclaw tasks flow cancel` ustawia trwałą intencję anulowania w przepływie. Aktywne zadania w ramach przepływu są anulowane i nie są uruchamiane żadne nowe kroki. Intencja anulowania utrzymuje się po restartach, więc anulowany przepływ pozostaje anulowany nawet wtedy, gdy Gateway zrestartuje się, zanim wszystkie zadania podrzędne zostaną zakończone.

## Polecenia CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Polecenie                         | Opis                                                  |
| --------------------------------- | ----------------------------------------------------- |
| `openclaw tasks flow list`        | Pokazuje śledzone przepływy ze statusem i trybem synchronizacji |
| `openclaw tasks flow show <id>`   | Sprawdź jeden przepływ według identyfikatora przepływu lub klucza wyszukiwania |
| `openclaw tasks flow cancel <id>` | Anuluj działający przepływ i jego aktywne zadania     |

## Jak przepływy odnoszą się do zadań

Przepływy koordynują zadania, a nie je zastępują. Pojedynczy przepływ może sterować wieloma zadaniami w tle w trakcie swojego życia. Użyj `openclaw tasks`, aby sprawdzać pojedyncze rekordy zadań, oraz `openclaw tasks flow`, aby sprawdzać przepływ orkiestrujący.

## Powiązane

- [Zadania w tle](/pl/automation/tasks) — rejestr odłączonej pracy koordynowanej przez przepływy
- [CLI: tasks](/pl/cli/tasks) — dokumentacja polecenia CLI dla `openclaw tasks flow`
- [Przegląd automatyzacji](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania Cron](/pl/automation/cron-jobs) — zaplanowane zadania, które mogą zasilać przepływy
