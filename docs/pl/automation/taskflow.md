---
read_when:
    - Chcesz zrozumieć, jak TaskFlow wiąże się z zadaniami działającymi w tle
    - W informacjach o wydaniu lub dokumentacji możesz napotkać Task Flow albo openclaw tasks flow
    - Chcesz sprawdzić trwały stan przepływu lub nim zarządzać
summary: Warstwa orkiestracji TaskFlow nad zadaniami działającymi w tle
title: Przepływ zadań
x-i18n:
    generated_at: "2026-07-12T14:52:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ccc6acf58b4b44c2989e3061bff08dabce8ef385706102360c756a1286ddd1b
    source_path: automation/taskflow.md
    workflow: 16
---

Przepływ zadań jest warstwą orkiestracji ponad [zadaniami w tle](/pl/automation/tasks). Przepływ jest trwałym rekordem wieloetapowej pracy z własnym stanem, stanem JSON, licznikiem rewizji i powiązanymi rekordami zadań. Przepływy zachowują się po ponownym uruchomieniu Gateway; poszczególne zadania pozostają jednostką pracy odłączonej.

## Kiedy używać przepływu zadań

| Scenariusz                                      | Zastosowanie                                          |
| ----------------------------------------------- | ----------------------------------------------------- |
| Pojedyncze zadanie w tle                        | Zwykłe zadanie                                        |
| Wieloetapowy potok sterowany przez kod pluginu  | Przepływ zadań (zarządzany)                           |
| Odłączone uruchomienie ACP lub podagenta        | Przepływ zadań (odzwierciedlany, tworzony automatycznie) |
| Jednorazowe przypomnienie                       | Zadanie Cron                                          |

## Tryby synchronizacji

### Tryb zarządzany

Zarządzany przepływ ma kontroler: kod pluginu, który tworzy przepływ za pośrednictwem interfejsu API przepływu zadań środowiska uruchomieniowego pluginu, podając cel i wymagany identyfikator kontrolera, a następnie jawnie nim steruje.

- Każdy krok działa jako zadanie w tle utworzone w ramach przepływu; klucz właściciela przepływu i pochodzenie zleceniodawcy są przekazywane do zadań podrzędnych.
- Kontroler przełącza przepływ między stanami `running`, `waiting` i stanami końcowymi oraz przechowuje dowolny stan kroku w formacie JSON w rekordzie przepływu.
- Każda modyfikacja przekazuje oczekiwaną rewizję przepływu. Nieaktualny zapis jest odrzucany jako konflikt rewizji, zamiast nadpisywać nowszy stan.
- Po zażądaniu anulowania nowe zadania podrzędne są odrzucane, a przepływ kończy się stanem `cancelled`, gdy żadne zadanie podrzędne nie pozostaje aktywne.

Przykład: cotygodniowy przepływ raportu, który (1) zbiera dane, (2) generuje raport i (3) go dostarcza, z jednym zadaniem w tle na każdy krok:

```
Przepływ: weekly-report
  Krok 1: gather-data     → zadanie utworzone → zakończone powodzeniem
  Krok 2: generate-report → zadanie utworzone → zakończone powodzeniem
  Krok 3: deliver         → zadanie utworzone → uruchomione
```

### Tryb odzwierciedlany

OpenClaw automatycznie tworzy odzwierciedlany przepływ z jednym zadaniem, gdy rozpoczyna się odłączone uruchomienie ACP lub podagenta (zadania o zakresie sesji z dostarczanym wynikiem końcowym). Rekord przepływu odzwierciedla pojedyncze zadanie bazowe — jego stan, cel i czasy — dzięki czemu odłączone uruchomienia otrzymują stabilny uchwyt przepływu do sprawdzania stanu i ponawiania prób bez kontrolera. Odzwierciedlane przepływy są wyświetlane w CLI z trybem synchronizacji `task_mirrored`.

## Stany przepływu

| Stan        | Znaczenie                                                                    |
| ----------- | ---------------------------------------------------------------------------- |
| `queued`    | Utworzony, jeszcze nie jest realizowany                                       |
| `running`   | Przepływ jest aktywnie realizowany                                            |
| `waiting`   | Zarządzany przepływ jest wstrzymany zgodnie z metadanymi oczekiwania (czasomierz, zdarzenie zewnętrzne) |
| `blocked`   | Krok zakończył się bez użytecznego wyniku; `blockedTaskId`/podsumowanie wskazują który |
| `succeeded` | Zakończony powodzeniem                                                        |
| `failed`    | Zakończony błędem                                                             |
| `cancelled` | Zażądano anulowania i wszystkie zadania podrzędne zostały zakończone          |
| `lost`      | Przepływ utracił swój autorytatywny stan bazowy                               |

## Trwały stan i śledzenie rewizji

Rekordy przepływów są przechowywane we współdzielonej bazie danych stanu SQLite (`~/.openclaw/state/openclaw.sqlite`, tabela `flow_runs`) wraz z rekordami zadań, dzięki czemu postęp nie jest tracony po ponownym uruchomieniu Gateway. Każdy zapis zwiększa wartość `revision` przepływu; równocześni zapisujący, którzy przekażą nieaktualną oczekiwaną rewizję, otrzymują konflikt i muszą ponownie odczytać dane. Wzrost WAL jest ograniczany przez automatyczne punkty kontrolne SQLite oraz okresowe pasywne punkty kontrolne, a podczas zamykania wykonywane są punkty kontrolne z obcięciem. Starszy plik pomocniczy `flows/registry.sqlite` z wcześniejszych instalacji jest importowany przez `openclaw doctor`.

## Zachowanie podczas anulowania

`openclaw tasks flow cancel` ustawia trwały zamiar anulowania przepływu, anuluje jego aktywne zadania podrzędne i odrzuca nowe zarządzane zadania podrzędne. Gdy żadne zadanie podrzędne nie pozostaje aktywne, przepływ kończy się stanem `cancelled` — natychmiast lub podczas przebiegu konserwacyjnego, jeśli zakończenie zadań podrzędnych trwa dłużej. Zamiar jest utrwalany, więc anulowany przepływ pozostaje anulowany nawet wtedy, gdy Gateway zostanie ponownie uruchomiony przed zakończeniem wszystkich zadań podrzędnych.

## Polecenia CLI

```bash
# Wyświetl aktywne i ostatnie przepływy
openclaw tasks flow list [--status <status>] [--json]

# Wyświetl szczegóły określonego przepływu
openclaw tasks flow show <lookup> [--json]

# Anuluj uruchomiony przepływ i jego aktywne zadania
openclaw tasks flow cancel <lookup>
```

| Polecenie                         | Opis                                                                  |
| --------------------------------- | --------------------------------------------------------------------- |
| `openclaw tasks flow list`        | Śledzone przepływy z trybem synchronizacji, stanem, rewizją, kontrolerem i liczbą zadań |
| `openclaw tasks flow show <id>`   | Sprawdza jeden przepływ według identyfikatora przepływu lub klucza właściciela, wraz z powiązanymi zadaniami |
| `openclaw tasks flow cancel <id>` | Anuluje uruchomiony przepływ i jego aktywne zadania                     |

Przepływy są również uwzględniane przez `openclaw tasks audit` (wykrywanie nieaktualnych lub uszkodzonych przepływów) oraz `openclaw tasks maintenance` (finalizowanie zablokowanych anulowań i usuwanie końcowych przepływów po 7 dniach).

## Wzorzec niezawodnego zaplanowanego przepływu pracy

W przypadku cyklicznych przepływów pracy, takich jak raporty analizy rynku, traktuj harmonogram, orkiestrację i kontrole niezawodności jako osobne warstwy:

1. Używaj [zaplanowanych zadań](/pl/automation/cron-jobs) do określania czasu.
2. Używaj trwałej sesji Cron, gdy przepływ pracy powinien wykorzystywać wcześniejszy kontekst.
3. Używaj [Lobster](/pl/tools/lobster) do deterministycznych kroków, punktów zatwierdzania i tokenów wznawiania.
4. Używaj przepływu zadań do śledzenia wieloetapowego uruchomienia obejmującego zadania podrzędne, oczekiwanie, ponowne próby i ponowne uruchomienia Gateway.

Przykładowa postać zadania Cron:

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

Używaj `--session session:<id>` zamiast `isolated`, gdy cykliczny przepływ pracy wymaga celowego zachowywania historii, podsumowań poprzednich uruchomień lub stałego kontekstu. Używaj `isolated`, gdy każde uruchomienie powinno rozpoczynać się od nowa, a cały wymagany stan jest jawnie określony w przepływie pracy.

W przepływie pracy umieść kontrole niezawodności przed krokiem podsumowania przez LLM:

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

- Dostępność przeglądarki i wybór profilu, na przykład `openclaw` dla zarządzanego stanu lub `user`, gdy wymagana jest zalogowana sesja Chrome. Zobacz [Przeglądarka](/pl/tools/browser).
- Dane uwierzytelniające API i limit dla każdego źródła.
- Dostępność sieciowa wymaganych punktów końcowych.
- Wymagane narzędzia włączone dla agenta, takie jak `lobster`, `browser` i `llm-task`.
- Skonfigurowane miejsce docelowe błędów dla Cron, aby niepowodzenia kontroli wstępnych były widoczne. Zobacz [Zaplanowane zadania](/pl/automation/cron-jobs#delivery-and-output).

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

Przepływ pracy powinien odrzucać lub oznaczać nieaktualne elementy przed podsumowaniem. Krok LLM powinien otrzymywać wyłącznie ustrukturyzowany JSON i powinien mieć polecenie zachowania pól `sourceUrl`, `retrievedAt` oraz `asOf` w danych wyjściowych. Używaj [zadania LLM](/pl/tools/llm-task), gdy potrzebujesz w przepływie pracy kroku modelu z walidacją względem schematu.

W przypadku przepływów pracy wielokrotnego użytku przeznaczonych dla zespołu lub społeczności spakuj CLI, pliki `.lobster` i wszelkie instrukcje konfiguracji jako skill lub plugin oraz opublikuj je za pośrednictwem [ClawHub](/clawhub). Zabezpieczenia właściwe dla przepływu pracy przechowuj w tym pakiecie, chyba że w interfejsie API pluginu brakuje wymaganej ogólnej funkcji.

## Relacja między przepływami a zadaniami

Przepływy koordynują zadania, a nie je zastępują. Pojedynczy przepływ może sterować wieloma zadaniami w tle w całym swoim cyklu życia. Używaj `openclaw tasks`, aby sprawdzać poszczególne rekordy zadań, oraz `openclaw tasks flow`, aby sprawdzać przepływ orkiestrujący.

## Powiązane materiały

- [Zadania w tle](/pl/automation/tasks) — rejestr odłączonej pracy koordynowanej przez przepływy
- [CLI: zadania](/pl/cli/tasks) — dokumentacja poleceń CLI dla `openclaw tasks flow`
- [Omówienie automatyzacji](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Zadania Cron](/pl/automation/cron-jobs) — zaplanowane zadania, które mogą zasilać przepływy
