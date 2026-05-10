---
read_when:
    - Chcesz zrozumieć, jak przepływ zadań wiąże się z zadaniami w tle
    - W notatkach o wydaniu lub dokumentacji napotkasz Task Flow albo openclaw tasks flow
    - Chcesz sprawdzić trwały stan przepływu lub nim zarządzać
summary: Warstwa orkiestracji przepływu TaskFlow nad zadaniami w tle
title: Przepływ zadań
x-i18n:
    generated_at: "2026-05-10T19:21:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 135227b250840cd579f10a8ab4211e9319c447bb4d6df25907738ea138fc2d2a
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow to warstwa orkiestracji przepływów znajdująca się ponad [zadaniami w tle](/pl/automation/tasks). Zarządza trwałymi, wieloetapowymi przepływami z własnym stanem, śledzeniem rewizji i semantyką synchronizacji, podczas gdy poszczególne zadania pozostają jednostką odłączonej pracy.

## Kiedy używać Task Flow

Używaj Task Flow, gdy praca obejmuje wiele sekwencyjnych lub rozgałęzionych kroków i potrzebujesz trwałego śledzenia postępu między restartami Gateway. W przypadku pojedynczych operacji w tle wystarczy zwykłe [zadanie](/pl/automation/tasks).

| Scenariusz                          | Użycie                         |
| ----------------------------------- | ------------------------------ |
| Pojedyncze zadanie w tle            | Zwykłe zadanie                 |
| Wieloetapowy potok (A, potem B, potem C) | Task Flow (zarządzany)    |
| Obserwowanie zadań utworzonych zewnętrznie | Task Flow (lustrzany) |
| Jednorazowe przypomnienie           | Zadanie Cron                   |

## Wzorzec niezawodnego zaplanowanego przepływu pracy

W przypadku cyklicznych przepływów pracy, takich jak briefingi z analizy rynku, traktuj harmonogram, orkiestrację i kontrole niezawodności jako oddzielne warstwy:

1. Użyj [zaplanowanych zadań](/pl/automation/cron-jobs) do obsługi czasu.
2. Użyj trwałej sesji Cron, gdy przepływ pracy powinien bazować na wcześniejszym kontekście.
3. Użyj [Lobster](/pl/tools/lobster) do deterministycznych kroków, bramek zatwierdzania i tokenów wznowienia.
4. Użyj Task Flow do śledzenia wieloetapowego przebiegu obejmującego zadania podrzędne, oczekiwania, ponowienia i restarty Gateway.

Przykładowy kształt Cron:

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

Użyj `session:<id>` zamiast `isolated`, gdy cykliczny przepływ pracy potrzebuje zamierzonej historii, podsumowań poprzednich uruchomień lub stałego kontekstu. Użyj `isolated`, gdy każde uruchomienie powinno zaczynać od nowa, a cały wymagany stan jest jawnie określony w przepływie pracy.

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
- Poświadczenia API i limity dla każdego źródła.
- Osiągalność sieciowa wymaganych punktów końcowych.
- Wymagane narzędzia włączone dla agenta, takie jak `lobster`, `browser` i `llm-task`.
- Miejsce docelowe błędów skonfigurowane dla Cron, aby niepowodzenia kontroli wstępnych były widoczne. Zobacz [Zaplanowane zadania](/pl/automation/cron-jobs#delivery-and-output).

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

Przepływ pracy powinien odrzucać lub oznaczać nieaktualne elementy przed podsumowaniem. Krok LLM powinien otrzymywać wyłącznie ustrukturyzowany JSON i powinien mieć polecenie zachowania `sourceUrl`, `retrievedAt` oraz `asOf` w swoim wyniku. Użyj [LLM Task](/pl/tools/llm-task), gdy potrzebujesz kroku modelu z walidacją schematu wewnątrz przepływu pracy.

W przypadku przepływów pracy wielokrotnego użytku dla zespołu lub społeczności spakuj CLI, pliki `.lobster` oraz wszelkie notatki konfiguracyjne jako Skills lub plugin i opublikuj je przez [ClawHub](/pl/clawhub). Zachowaj zabezpieczenia specyficzne dla przepływu pracy w tym pakiecie, chyba że API pluginu nie ma potrzebnej ogólnej funkcji.

## Tryby synchronizacji

### Tryb zarządzany

Task Flow posiada cały cykl życia od początku do końca. Tworzy zadania jako kroki przepływu, doprowadza je do ukończenia i automatycznie przesuwa stan przepływu.

Przykład: cotygodniowy przepływ raportu, który (1) zbiera dane, (2) generuje raport i (3) dostarcza go. Task Flow tworzy każdy krok jako zadanie w tle, czeka na ukończenie, a następnie przechodzi do następnego kroku.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Tryb lustrzany

Task Flow obserwuje zadania utworzone zewnętrznie i utrzymuje stan przepływu w synchronizacji bez przejmowania odpowiedzialności za tworzenie zadań. Jest to przydatne, gdy zadania pochodzą z zadań Cron, poleceń CLI lub innych źródeł, a chcesz mieć ujednolicony widok ich postępu jako przepływu.

Przykład: trzy niezależne zadania Cron, które razem tworzą rutynę „porannych operacji”. Przepływ lustrzany śledzi ich łączny postęp bez kontrolowania, kiedy ani jak działają.

## Trwały stan i śledzenie rewizji

Każdy przepływ utrwala własny stan i śledzi rewizje, aby postęp przetrwał restarty Gateway. Śledzenie rewizji umożliwia wykrywanie konfliktów, gdy wiele źródeł próbuje jednocześnie przesunąć ten sam przepływ.
Rejestr przepływów używa SQLite z ograniczoną konserwacją dziennika write-ahead log, w tym
okresowymi punktami kontrolnymi i punktami kontrolnymi przy zamykaniu, dzięki czemu długo działające Gateway nie przechowują
nieograniczonych plików pomocniczych `registry.sqlite-wal`.

## Zachowanie anulowania

`openclaw tasks flow cancel` ustawia trwały zamiar anulowania w przepływie. Aktywne zadania w przepływie są anulowane i żadne nowe kroki nie są uruchamiane. Zamiar anulowania utrzymuje się między restartami, więc anulowany przepływ pozostaje anulowany nawet wtedy, gdy Gateway uruchomi się ponownie, zanim wszystkie zadania podrzędne zostaną zakończone.

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

Przepływy koordynują zadania, nie zastępują ich. Pojedynczy przepływ może uruchamiać wiele zadań w tle w ciągu swojego życia. Użyj `openclaw tasks`, aby sprawdzić poszczególne rekordy zadań, oraz `openclaw tasks flow`, aby sprawdzić przepływ orkiestrujący.

## Powiązane

- [Zadania w tle](/pl/automation/tasks) — rejestr odłączonej pracy koordynowanej przez przepływy
- [CLI: zadania](/pl/cli/tasks) — dokumentacja poleceń CLI dla `openclaw tasks flow`
- [Przegląd automatyzacji](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania Cron](/pl/automation/cron-jobs) — zaplanowane zadania, które mogą zasilać przepływy
