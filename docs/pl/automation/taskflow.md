---
read_when:
    - Chcesz zrozumieć, jaki jest związek między Task Flow a zadaniami w tle
    - Napotykasz Task Flow lub przepływ zadań openclaw w informacjach o wydaniu lub dokumentacji
    - Chcesz sprawdzić stan trwałego przepływu lub nim zarządzać
summary: Warstwa orkiestracji przepływów Task Flow nad zadaniami w tle
title: Przepływ zadań
x-i18n:
    generated_at: "2026-04-30T09:35:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ab261dea0ec3beb10b53c641bd188288cada5345aef6ddbbc8071d37eb57bdc
    source_path: automation/taskflow.md
    workflow: 16
---

Przepływ zadań to podłoże orkiestracji przepływów, które znajduje się nad [zadaniami w tle](/pl/automation/tasks). Zarządza trwałymi, wieloetapowymi przepływami z własnym stanem, śledzeniem rewizji i semantyką synchronizacji, podczas gdy pojedyncze zadania pozostają jednostką odłączonej pracy.

## Kiedy używać Przepływu zadań

Użyj Przepływu zadań, gdy praca obejmuje wiele kroków sekwencyjnych lub rozgałęzionych i potrzebujesz trwałego śledzenia postępu po restartach Gateway. W przypadku pojedynczych operacji w tle wystarczy zwykłe [zadanie](/pl/automation/tasks).

| Scenariusz                          | Użycie                         |
| ----------------------------------- | ------------------------------ |
| Pojedyncze zadanie w tle            | Zwykłe zadanie                 |
| Wieloetapowy potok (A, potem B, potem C) | Przepływ zadań (zarządzany) |
| Obserwowanie zadań utworzonych zewnętrznie | Przepływ zadań (odzwierciedlony) |
| Jednorazowe przypomnienie           | Zadanie Cron                   |

## Wzorzec niezawodnego zaplanowanego przepływu pracy

W przypadku powtarzalnych przepływów pracy, takich jak briefingi analizy rynku, traktuj harmonogram, orkiestrację i kontrole niezawodności jako oddzielne warstwy:

1. Użyj [Zaplanowanych zadań](/pl/automation/cron-jobs) do określania czasu.
2. Użyj trwałej sesji cron, gdy przepływ pracy powinien korzystać z wcześniejszego kontekstu.
3. Użyj [Lobster](/pl/tools/lobster) do deterministycznych kroków, bramek zatwierdzania i tokenów wznowienia.
4. Użyj Przepływu zadań, aby śledzić wieloetapowe uruchomienie obejmujące zadania podrzędne, oczekiwania, ponowienia i restarty Gateway.

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

W przepływie pracy umieść kontrole niezawodności przed krokiem podsumowania LLM:

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

- Dostępność przeglądarki i wybór profilu, na przykład `openclaw` dla stanu zarządzanego lub `user`, gdy wymagana jest zalogowana sesja Chrome. Zobacz [Przeglądarkę](/pl/tools/browser).
- Dane uwierzytelniające API i limit dla każdego źródła.
- Osiągalność sieciowa wymaganych punktów końcowych.
- Wymagane narzędzia włączone dla agenta, takie jak `lobster`, `browser` i `llm-task`.
- Miejsce docelowe awarii skonfigurowane dla cron, aby awarie kontroli wstępnych były widoczne. Zobacz [Zaplanowane zadania](/pl/automation/cron-jobs#delivery-and-output).

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

Niech przepływ pracy odrzuca lub oznacza jako nieaktualne elementy przed podsumowaniem. Krok LLM powinien otrzymywać tylko strukturalny JSON i powinien mieć polecenie zachowania `sourceUrl`, `retrievedAt` i `asOf` w swoich danych wyjściowych. Użyj [zadania LLM](/pl/tools/llm-task), gdy potrzebujesz kroku modelu z walidacją schematu wewnątrz przepływu pracy.

W przypadku wielokrotnego użytku przez zespół lub społeczność spakuj CLI, pliki `.lobster` i wszelkie notatki konfiguracyjne jako skill albo plugin i opublikuj je przez [ClawHub](/pl/tools/clawhub). Zabezpieczenia specyficzne dla przepływu pracy przechowuj w tym pakiecie, chyba że API pluginu nie udostępnia potrzebnej ogólnej możliwości.

## Tryby synchronizacji

### Tryb zarządzany

Przepływ zadań jest właścicielem cyklu życia od początku do końca. Tworzy zadania jako kroki przepływu, doprowadza je do ukończenia i automatycznie przesuwa stan przepływu do przodu.

Przykład: przepływ raportu tygodniowego, który (1) zbiera dane, (2) generuje raport i (3) dostarcza go. Przepływ zadań tworzy każdy krok jako zadanie w tle, czeka na ukończenie, a następnie przechodzi do następnego kroku.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Tryb odzwierciedlony

Przepływ zadań obserwuje zadania utworzone zewnętrznie i utrzymuje stan przepływu w synchronizacji bez przejmowania własności tworzenia zadań. Jest to przydatne, gdy zadania pochodzą z zadań cron, poleceń CLI lub innych źródeł, a chcesz mieć zunifikowany widok ich postępu jako przepływu.

Przykład: trzy niezależne zadania cron, które razem tworzą rutynę „porannych operacji”. Odzwierciedlony przepływ śledzi ich łączny postęp bez kontrolowania tego, kiedy ani jak są uruchamiane.

## Trwały stan i śledzenie rewizji

Każdy przepływ utrwala własny stan i śledzi rewizje, dzięki czemu postęp przetrwa restarty Gateway. Śledzenie rewizji umożliwia wykrywanie konfliktów, gdy wiele źródeł próbuje równocześnie przesunąć ten sam przepływ do przodu.
Rejestr przepływów używa SQLite z ograniczoną konserwacją dziennika wyprzedzającego zapisu, w tym
okresowymi punktami kontrolnymi oraz punktami kontrolnymi przy zamykaniu, dzięki czemu długo działające Gateway nie przechowują
nieograniczonych plików pomocniczych `registry.sqlite-wal`.

## Zachowanie anulowania

`openclaw tasks flow cancel` ustawia trwałą intencję anulowania w przepływie. Aktywne zadania w ramach przepływu są anulowane i nie są uruchamiane żadne nowe kroki. Intencja anulowania utrzymuje się po restartach, więc anulowany przepływ pozostaje anulowany nawet wtedy, gdy Gateway zrestartuje się, zanim wszystkie zadania podrzędne zakończą działanie.

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

Przepływy koordynują zadania, a nie je zastępują. Pojedynczy przepływ może w trakcie swojego życia sterować wieloma zadaniami w tle. Użyj `openclaw tasks`, aby sprawdzić pojedyncze rekordy zadań, oraz `openclaw tasks flow`, aby sprawdzić orkiestrujący przepływ.

## Powiązane

- [Zadania w tle](/pl/automation/tasks) — rejestr odłączonej pracy koordynowanej przez przepływy
- [CLI: zadania](/pl/cli/tasks) — dokumentacja polecenia CLI dla `openclaw tasks flow`
- [Przegląd automatyzacji](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania Cron](/pl/automation/cron-jobs) — zaplanowane zadania, które mogą zasilać przepływy
