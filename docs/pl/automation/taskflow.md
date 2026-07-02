---
read_when:
    - Chcesz zrozumieć, jak Task Flow wiąże się z zadaniami w tle
    - Napotykasz TaskFlow lub przepływ zadań openclaw w informacjach o wydaniu lub dokumentacji
    - Chcesz sprawdzić lub zarządzać trwałym stanem przepływu
summary: Warstwa orkiestracji TaskFlow nad zadaniami w tle
title: Przepływ zadań
x-i18n:
    generated_at: "2026-07-02T01:16:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b74a773e34c02421d22ce11ae0aa29fed82664383f0680e7623787db7d79c8e
    source_path: automation/taskflow.md
    workflow: 16
---

Przepływ zadań to warstwa orkiestracji przepływów znajdująca się ponad [zadaniami w tle](/pl/automation/tasks). Zarządza trwałymi, wieloetapowymi przepływami z własnym stanem, śledzeniem rewizji i semantyką synchronizacji, podczas gdy pojedyncze zadania pozostają jednostką pracy odłączonej.

## Kiedy używać przepływu zadań

Używaj przepływu zadań, gdy praca obejmuje wiele kolejnych lub rozgałęziających się kroków i potrzebujesz trwałego śledzenia postępu między restartami Gateway. W przypadku pojedynczych operacji w tle wystarczy zwykłe [zadanie](/pl/automation/tasks).

| Scenariusz                          | Użyj                          |
| ----------------------------------- | ----------------------------- |
| Pojedyncze zadanie w tle            | Zwykłe zadanie                |
| Wieloetapowy potok (A, potem B, potem C) | Przepływ zadań (zarządzany) |
| Obserwowanie zadań utworzonych zewnętrznie | Przepływ zadań (odzwierciedlany) |
| Jednorazowe przypomnienie           | Zadanie Cron                  |

## Wzorzec niezawodnego zaplanowanego przepływu pracy

W przypadku cyklicznych przepływów pracy, takich jak briefingi analiz rynkowych, traktuj harmonogram, orkiestrację i kontrole niezawodności jako oddzielne warstwy:

1. Użyj [zaplanowanych zadań](/pl/automation/cron-jobs) do określenia czasu.
2. Przechowuj wcześniejszy kontekst we własnych plikach, bazie danych lub stanie narzędzia przepływu pracy.
3. Użyj [Lobster](/pl/tools/lobster) do deterministycznych kroków, bramek zatwierdzania i tokenów wznawiania.
4. Użyj przepływu zadań do śledzenia wieloetapowego uruchomienia przez zadania podrzędne, oczekiwania, ponowienia i restarty Gateway.

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

Użyj `session:<id>`, gdy zadanie ma kierować wynik do znanego czatu/sesji w celu zachowania kontekstu dostarczania lub bezpiecznego ustawienia preferencji początkowych. Cron nadal wykonuje każde uruchomienie w odłączonej sesji, więc umieść podsumowania poprzednich uruchomień i stały stan przepływu pracy w jawnej pamięci, którą zadanie może odczytać.

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

- Dostępność przeglądarki i wybór profilu, na przykład `openclaw` dla stanu zarządzanego albo `user`, gdy wymagana jest zalogowana sesja Chrome. Zobacz [Przeglądarka](/pl/tools/browser).
- Dane uwierzytelniające API i limit dla każdego źródła.
- Osiągalność sieciowa wymaganych punktów końcowych.
- Wymagane narzędzia włączone dla agenta, takie jak `lobster`, `browser` i `llm-task`.
- Miejsce docelowe błędów skonfigurowane dla Cron, aby błędy kontroli wstępnych były widoczne. Zobacz [Zaplanowane zadania](/pl/automation/cron-jobs#delivery-and-output).

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

Przepływ pracy powinien odrzucać lub oznaczać nieaktualne elementy przed podsumowaniem. Krok LLM powinien otrzymywać wyłącznie ustrukturyzowany JSON i powinien mieć polecenie zachowania `sourceUrl`, `retrievedAt` i `asOf` w swoim wyniku. Użyj [zadania LLM](/pl/tools/llm-task), gdy potrzebujesz kroku modelu z walidacją schematu wewnątrz przepływu pracy.

W przypadku wielokrotnego użytku w zespołach lub społeczności spakuj CLI, pliki `.lobster` i wszelkie uwagi dotyczące konfiguracji jako skill lub plugin i opublikuj je przez [ClawHub](/clawhub). Zabezpieczenia specyficzne dla przepływu pracy trzymaj w tym pakiecie, chyba że w API pluginu brakuje potrzebnej ogólnej możliwości.

## Tryby synchronizacji

### Tryb zarządzany

Przepływ zadań jest właścicielem cyklu życia od początku do końca. Tworzy zadania jako kroki przepływu, doprowadza je do ukończenia i automatycznie przesuwa stan przepływu dalej.

Przykład: cotygodniowy przepływ raportu, który (1) zbiera dane, (2) generuje raport i (3) dostarcza go. Przepływ zadań tworzy każdy krok jako zadanie w tle, czeka na ukończenie, a następnie przechodzi do następnego kroku.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Tryb odzwierciedlany

Przepływ zadań obserwuje zadania utworzone zewnętrznie i utrzymuje stan przepływu w synchronizacji bez przejmowania własności nad tworzeniem zadań. Jest to przydatne, gdy zadania pochodzą z zadań Cron, poleceń CLI lub innych źródeł, a chcesz mieć ujednolicony widok ich postępu jako przepływu.

Przykład: trzy niezależne zadania Cron, które razem tworzą rutynę „porannych operacji”. Odzwierciedlany przepływ śledzi ich łączny postęp bez kontrolowania, kiedy ani jak działają.

## Trwały stan i śledzenie rewizji

Każdy przepływ utrwala własny stan i śledzi rewizje, aby postęp przetrwał restarty Gateway. Śledzenie rewizji umożliwia wykrywanie konfliktów, gdy wiele źródeł próbuje jednocześnie przesunąć ten sam przepływ dalej.
Rejestr przepływów używa SQLite z ograniczoną konserwacją dziennika zapisu z wyprzedzeniem, w tym
okresowymi punktami kontrolnymi i punktami kontrolnymi przy zamykaniu, dzięki czemu długo działające Gateway nie przechowują
nieograniczonych plików towarzyszących `registry.sqlite-wal`.

## Zachowanie anulowania

`openclaw tasks flow cancel` ustawia trwałą intencję anulowania dla przepływu. Aktywne zadania w przepływie są anulowane i nie są uruchamiane żadne nowe kroki. Intencja anulowania utrzymuje się między restartami, więc anulowany przepływ pozostaje anulowany nawet wtedy, gdy Gateway uruchomi się ponownie, zanim wszystkie zadania podrzędne zostaną zakończone.

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
| `openclaw tasks flow show <id>`   | Sprawdź jeden przepływ według identyfikatora przepływu lub klucza wyszukiwania |
| `openclaw tasks flow cancel <id>` | Anuluj działający przepływ i jego aktywne zadania |

## Jak przepływy odnoszą się do zadań

Przepływy koordynują zadania, a nie je zastępują. Jeden przepływ może uruchamiać wiele zadań w tle w trakcie swojego życia. Użyj `openclaw tasks`, aby sprawdzić pojedyncze rekordy zadań, oraz `openclaw tasks flow`, aby sprawdzić orkiestrujący przepływ.

## Powiązane

- [Zadania w tle](/pl/automation/tasks) — odłączony rejestr pracy koordynowanej przez przepływy
- [CLI: zadania](/pl/cli/tasks) — dokumentacja poleceń CLI dla `openclaw tasks flow`
- [Przegląd automatyzacji](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania Cron](/pl/automation/cron-jobs) — zaplanowane zadania, które mogą zasilać przepływy
