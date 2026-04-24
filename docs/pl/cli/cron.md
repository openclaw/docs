---
read_when:
    - Chcesz zaplanowanych zadań i wybudzeń
    - Debugujesz wykonywanie Cron i logi
summary: Dokumentacja CLI dla `openclaw cron` (planowanie i uruchamianie zadań w tle)
title: Cron
x-i18n:
    generated_at: "2026-04-24T09:02:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3f5c262092b9b5b821ec824bc02dbbd806936d91f1d03ac6eb789f7e71ffc07
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Zarządzaj zadaniami Cron dla harmonogramu Gateway.

Powiązane:

- Zadania Cron: [Zadania Cron](/pl/automation/cron-jobs)

Wskazówka: uruchom `openclaw cron --help`, aby zobaczyć pełną powierzchnię poleceń.

Uwaga: `openclaw cron list` i `openclaw cron show <job-id>` pokazują podgląd
rozwiązanej trasy dostarczania. Dla `channel: "last"` podgląd pokazuje, czy
trasa została rozwiązana z sesji głównej/bieżącej, czy zakończy się bezpieczną odmową.

Uwaga: izolowane zadania `cron add` domyślnie używają dostarczania `--announce`. Użyj `--no-deliver`, aby zachować
wyniki wewnętrznie. `--deliver` pozostaje przestarzałym aliasem dla `--announce`.

Uwaga: dostarczanie czatu przez izolowany Cron jest współdzielone. `--announce` to awaryjne
dostarczanie przez runner dla końcowej odpowiedzi; `--no-deliver` wyłącza to awaryjne zachowanie, ale
nie usuwa narzędzia `message` agenta, gdy dostępna jest trasa czatu.

Uwaga: zadania jednorazowe (`--at`) są domyślnie usuwane po powodzeniu. Użyj `--keep-after-run`, aby je zachować.

Uwaga: `--session` obsługuje `main`, `isolated`, `current` i `session:<id>`.
Użyj `current`, aby powiązać z aktywną sesją w chwili tworzenia, lub `session:<id>`, aby wskazać
jawny trwały klucz sesji.

Uwaga: dla jednorazowych zadań CLI daty i godziny `--at` bez przesunięcia strefy są traktowane jako UTC, chyba że przekażesz też
`--tz <iana>`, co interpretuje ten lokalny czas ścienny w podanej strefie czasowej.

Uwaga: zadania cykliczne używają teraz wykładniczego opóźnienia ponownych prób po kolejnych błędach (30s → 1m → 5m → 15m → 60m), a następnie wracają do normalnego harmonogramu po kolejnym udanym uruchomieniu.

Uwaga: `openclaw cron run` zwraca teraz wynik, gdy tylko ręczne uruchomienie zostanie zakolejkowane do wykonania. Pomyślne odpowiedzi zawierają `{ ok: true, enqueued: true, runId }`; użyj `openclaw cron runs --id <job-id>`, aby śledzić ostateczny wynik.

Uwaga: `openclaw cron run <job-id>` domyślnie wymusza uruchomienie. Użyj `--due`, aby zachować
starsze zachowanie „uruchom tylko, jeśli termin już nadszedł”.

Uwaga: izolowane tury Cron pomijają nieaktualne odpowiedzi zawierające tylko potwierdzenie. Jeśli
pierwszy wynik jest jedynie tymczasową aktualizacją statusu i żadne potomne uruchomienie podagenta
nie odpowiada za ostateczną odpowiedź, Cron ponawia prompt raz, aby uzyskać rzeczywisty wynik
przed dostarczeniem.

Uwaga: jeśli izolowane uruchomienie zwraca tylko cichy token (`NO_REPLY` /
`no_reply`), Cron pomija zarówno bezpośrednie dostarczanie wychodzące, jak i awaryjną ścieżkę
kolejkowanego podsumowania, więc nic nie jest publikowane z powrotem na czacie.

Uwaga: `cron add|edit --model ...` używa wybranego dozwolonego modelu dla zadania.
Jeśli model nie jest dozwolony, Cron ostrzega i wraca do wyboru modelu agenta/dom
yślnego dla zadania. Skonfigurowane łańcuchy awaryjne nadal obowiązują, ale zwykłe
nadpisanie modelu bez jawnej listy awaryjnej per task nie dołącza już głównego modelu
agenta jako ukrytego dodatkowego celu ponownej próby.

Uwaga: pierwszeństwo modelu w izolowanym Cron to najpierw nadpisanie Gmail-hook, potem per-task
`--model`, potem dowolne zapisane nadpisanie modelu sesji Cron, a następnie zwykły
wybór agenta/dom
yślny.

Uwaga: tryb szybki izolowanego Cron podąża za rozwiązanym wyborem modelu na żywo. Konfiguracja modelu
`params.fastMode` obowiązuje domyślnie, ale zapisane nadpisanie sesji `fastMode` nadal ma pierwszeństwo nad konfiguracją.

Uwaga: jeśli izolowane uruchomienie zgłosi `LiveSessionModelSwitchError`, Cron zapisuje
przełączonego providera/model (oraz przełączone nadpisanie profilu auth, jeśli występuje) przed
ponowieniem próby. Zewnętrzna pętla ponownych prób jest ograniczona do 2 prób przełączenia po
początkowej próbie, a potem przerywa zamiast zapętlać się w nieskończoność.

Uwaga: powiadomienia o niepowodzeniu używają najpierw `delivery.failureDestination`, potem
globalnego `cron.failureDestination`, a na końcu wracają do podstawowego celu
ogłoszenia zadania, gdy nie skonfigurowano jawnego miejsca docelowego dla niepowodzeń.

Uwaga: retencja/przycinanie są kontrolowane w konfiguracji:

- `cron.sessionRetention` (domyślnie `24h`) przycina ukończone sesje izolowanych uruchomień.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` przycinają `~/.openclaw/cron/runs/<jobId>.jsonl`.

Uwaga dotycząca aktualizacji: jeśli masz starsze zadania Cron sprzed bieżącego formatu dostarczania/przechowywania, uruchom
`openclaw doctor --fix`. Doctor teraz normalizuje starsze pola Cron (`jobId`, `schedule.cron`,
pola dostarczania najwyższego poziomu, w tym starsze `threadId`, aliasy dostarczania `provider` w ładunku) i migruje proste
zadania awaryjne Webhook z `notify: true` do jawnego dostarczania Webhook, gdy `cron.webhook` jest
skonfigurowane.

## Typowe edycje

Zaktualizuj ustawienia dostarczania bez zmiany wiadomości:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Wyłącz dostarczanie dla izolowanego zadania:

```bash
openclaw cron edit <job-id> --no-deliver
```

Włącz lekki kontekst bootstrap dla izolowanego zadania:

```bash
openclaw cron edit <job-id> --light-context
```

Ogłoś do konkretnego kanału:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Utwórz izolowane zadanie z lekkim kontekstem bootstrap:

```bash
openclaw cron add \
  --name "Lekki poranny przegląd" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Podsumuj nocne aktualizacje." \
  --light-context \
  --no-deliver
```

`--light-context` dotyczy tylko izolowanych zadań typu agent-turn. Dla uruchomień Cron tryb lekki pozostawia kontekst bootstrap pusty zamiast wstrzykiwać pełny zestaw bootstrap obszaru roboczego.

Uwaga dotycząca własności dostarczania:

- Dostarczanie czatu przez izolowany Cron jest współdzielone. Agent może wysyłać bezpośrednio za pomocą
  narzędzia `message`, gdy dostępna jest trasa czatu.
- `announce` awaryjnie dostarcza końcową odpowiedź tylko wtedy, gdy agent nie wysłał jej
  bezpośrednio do rozwiązanego celu. `webhook` wysyła gotowy ładunek do URL-a.
  `none` wyłącza awaryjne dostarczanie przez runner.

## Typowe polecenia administracyjne

Ręczne uruchomienie:

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Wpisy `cron runs` zawierają diagnostykę dostarczania z zamierzonym celem Cron,
rozwiązanym celem, wysłaniami przez narzędzie message, użyciem awaryjnym i stanem dostarczenia.

Przekierowanie agenta/sesji:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Dostosowania dostarczania:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Uwaga dotycząca dostarczania niepowodzeń:

- `delivery.failureDestination` jest obsługiwane dla zadań izolowanych.
- Zadania sesji głównej mogą używać `delivery.failureDestination` tylko wtedy, gdy podstawowy
  tryb dostarczania to `webhook`.
- Jeśli nie ustawisz żadnego miejsca docelowego niepowodzeń, a zadanie już ogłasza do
  kanału, powiadomienia o niepowodzeniu użyją ponownie tego samego celu ogłoszenia.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Zaplanowane zadania](/pl/automation/cron-jobs)
