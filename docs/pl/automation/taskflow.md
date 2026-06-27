---
read_when:
    - Chcesz zrozumieć, jak Task Flow wiąże się z zadaniami w tle
    - Napotykasz TaskFlow lub openclaw tasks flow w informacjach o wydaniu lub dokumentacji
    - Chcesz sprawdzić trwały stan przepływu lub nim zarządzać
summary: Warstwa orkiestracji TaskFlow nad zadaniami w tle
title: Przepływ zadań
x-i18n:
    generated_at: "2026-06-27T17:09:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4f5ff3c9a68eb0408a180bc947a03b410568d7914cb1c1d7f31d6013e036096
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow to podłoże orkiestracji przepływów działające ponad [zadaniami w tle](/pl/automation/tasks). Zarządza trwałymi, wieloetapowymi przepływami z własnym stanem, śledzeniem rewizji i semantyką synchronizacji, podczas gdy pojedyncze zadania pozostają jednostką pracy odłączonej.

## Kiedy używać Task Flow

Użyj Task Flow, gdy praca obejmuje wiele kolejnych lub rozgałęziających się kroków i potrzebujesz trwałego śledzenia postępu po restartach gateway. W przypadku pojedynczych operacji w tle wystarczy zwykłe [zadanie](/pl/automation/tasks).

| Scenariusz                          | Użycie                   |
| ----------------------------------- | ------------------------ |
| Pojedyncze zadanie w tle            | Zwykłe zadanie           |
| Wieloetapowy potok (A, potem B, potem C) | Task Flow (zarządzany)   |
| Obserwowanie zadań utworzonych zewnętrznie | Task Flow (odzwierciedlany) |
| Jednorazowe przypomnienie           | Zadanie Cron             |

## Wzorzec niezawodnego zaplanowanego przepływu pracy

W przypadku powtarzalnych przepływów pracy, takich jak briefingi z analizą rynku, traktuj harmonogram, orkiestrację i kontrole niezawodności jako oddzielne warstwy:

1. Użyj [Zaplanowanych zadań](/pl/automation/cron-jobs) do obsługi czasu.
2. Użyj trwałej sesji cron, gdy przepływ pracy ma opierać się na wcześniejszym kontekście.
3. Użyj [Lobster](/pl/tools/lobster) do deterministycznych kroków, bramek zatwierdzania i tokenów wznawiania.
4. Użyj Task Flow do śledzenia wieloetapowego uruchomienia przez zadania potomne, oczekiwania, ponowienia i restarty gateway.

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

Użyj `session:<id>` zamiast `isolated`, gdy powtarzalny przepływ pracy potrzebuje celowej historii, podsumowań poprzednich uruchomień lub stałego kontekstu. Użyj `isolated`, gdy każde uruchomienie powinno zaczynać od nowa, a cały wymagany stan jest jawnie określony w przepływie pracy.

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

- Dostępność przeglądarki i wybór profilu, na przykład `openclaw` dla stanu zarządzanego albo `user`, gdy wymagana jest zalogowana sesja Chrome. Zobacz [Przeglądarka](/pl/tools/browser).
- Dane uwierzytelniające API i limit użycia dla każdego źródła.
- Osiągalność sieciowa wymaganych punktów końcowych.
- Wymagane narzędzia włączone dla agenta, takie jak `lobster`, `browser` i `llm-task`.
- Skonfigurowane miejsce docelowe błędów dla cron, aby błędy kontroli wstępnych były widoczne. Zobacz [Zaplanowane zadania](/pl/automation/cron-jobs#delivery-and-output).

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

Przepływ pracy powinien odrzucać lub oznaczać nieaktualne elementy przed podsumowaniem. Krok LLM powinien otrzymywać wyłącznie ustrukturyzowany JSON i powinien mieć polecenie zachowania `sourceUrl`, `retrievedAt` i `asOf` w danych wyjściowych. Użyj [LLM Task](/pl/tools/llm-task), gdy potrzebujesz w przepływie pracy kroku modelu walidowanego schematem.

W przypadku przepływów pracy wielokrotnego użytku dla zespołu lub społeczności spakuj CLI, pliki `.lobster` i wszelkie notatki konfiguracyjne jako skill lub Plugin i opublikuj je przez [ClawHub](/pl/clawhub). Zabezpieczenia specyficzne dla przepływu pracy przechowuj w tym pakiecie, chyba że API pluginu nie ma wymaganej ogólnej możliwości.

## Tryby synchronizacji

### Tryb zarządzany

Task Flow odpowiada za cały cykl życia od początku do końca. Tworzy zadania jako kroki przepływu, doprowadza je do ukończenia i automatycznie przesuwa stan przepływu dalej.

Przykład: cotygodniowy przepływ raportu, który (1) zbiera dane, (2) generuje raport i (3) dostarcza go. Task Flow tworzy każdy krok jako zadanie w tle, czeka na ukończenie, a następnie przechodzi do następnego kroku.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Tryb odzwierciedlany

Task Flow obserwuje zadania utworzone zewnętrznie i utrzymuje stan przepływu w synchronizacji bez przejmowania własności tworzenia zadań. Jest to przydatne, gdy zadania pochodzą z zadań cron, poleceń CLI lub innych źródeł, a chcesz mieć ujednolicony widok ich postępu jako przepływu.

Przykład: trzy niezależne zadania cron, które razem tworzą rutynę „morning ops”. Odzwierciedlany przepływ śledzi ich łączny postęp bez kontrolowania, kiedy ani jak są uruchamiane.

## Trwały stan i śledzenie rewizji

Każdy przepływ utrwala własny stan i śledzi rewizje, dzięki czemu postęp przetrwa restarty gateway. Śledzenie rewizji umożliwia wykrywanie konfliktów, gdy wiele źródeł próbuje jednocześnie przesunąć ten sam przepływ dalej.
Rejestr przepływów używa SQLite z ograniczoną konserwacją dziennika write-ahead log, obejmującą
okresowe punkty kontrolne i punkty kontrolne przy zamykaniu, dzięki czemu długo działające gateway nie przechowują
nieograniczonych plików pomocniczych `registry.sqlite-wal`.

## Zachowanie anulowania

`openclaw tasks flow cancel` ustawia trwałą intencję anulowania w przepływie. Aktywne zadania w przepływie są anulowane i nie są uruchamiane żadne nowe kroki. Intencja anulowania utrzymuje się po restartach, więc anulowany przepływ pozostaje anulowany nawet wtedy, gdy gateway uruchomi się ponownie, zanim wszystkie zadania potomne zostaną zakończone.

## Polecenia CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Polecenie                         | Opis                                          |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list`        | Pokazuje śledzone przepływy ze statusem i trybem synchronizacji |
| `openclaw tasks flow show <id>`   | Sprawdza jeden przepływ według identyfikatora przepływu lub klucza wyszukiwania |
| `openclaw tasks flow cancel <id>` | Anuluje działający przepływ i jego aktywne zadania |

## Jak przepływy odnoszą się do zadań

Przepływy koordynują zadania, a nie je zastępują. Jeden przepływ może w trakcie swojego życia sterować wieloma zadaniami w tle. Użyj `openclaw tasks`, aby sprawdzić pojedyncze rekordy zadań, oraz `openclaw tasks flow`, aby sprawdzić orkiestrujący przepływ.

## Powiązane

- [Zadania w tle](/pl/automation/tasks) — odłączony rejestr pracy koordynowany przez przepływy
- [CLI: zadania](/pl/cli/tasks) — dokumentacja referencyjna poleceń CLI dla `openclaw tasks flow`
- [Omówienie automatyzacji](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania Cron](/pl/automation/cron-jobs) — zaplanowane zadania, które mogą zasilać przepływy
