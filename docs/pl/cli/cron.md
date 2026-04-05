---
read_when:
    - Chcesz używać zaplanowanych zadań i wybudzeń
    - Debugujesz wykonanie cron i logi
summary: Dokumentacja CLI dla `openclaw cron` (planowanie i uruchamianie zadań w tle)
title: cron
x-i18n:
    generated_at: "2026-04-05T13:48:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: f74ec8847835f24b3970f1b260feeb69c7ab6c6ec7e41615cbb73f37f14a8112
    source_path: cli/cron.md
    workflow: 15
---

# `openclaw cron`

Zarządzaj zadaniami cron dla planisty Gateway.

Powiązane:

- Zadania cron: [Zadania cron](/pl/automation/cron-jobs)

Wskazówka: uruchom `openclaw cron --help`, aby zobaczyć pełną powierzchnię poleceń.

Uwaga: izolowane zadania `cron add` domyślnie używają dostarczania `--announce`. Użyj `--no-deliver`, aby zachować
wyjście wewnętrznie. `--deliver` pozostaje przestarzałym aliasem dla `--announce`.

Uwaga: izolowane uruchomienia należące do cron oczekują podsumowania w postaci zwykłego tekstu, a moduł uruchamiający odpowiada
za końcową ścieżkę wysyłki. `--no-deliver` zachowuje uruchomienie wewnętrznie; nie przekazuje
wysyłki z powrotem do narzędzia wiadomości agenta.

Uwaga: zadania jednorazowe (`--at`) są domyślnie usuwane po pomyślnym zakończeniu. Użyj `--keep-after-run`, aby je zachować.

Uwaga: `--session` obsługuje `main`, `isolated`, `current` i `session:<id>`.
Użyj `current`, aby powiązać z aktywną sesją w momencie tworzenia, albo `session:<id>` dla
jawnego trwałego klucza sesji.

Uwaga: dla jednorazowych zadań CLI daty i godziny `--at` bez przesunięcia strefy są traktowane jako UTC, chyba że dodatkowo podasz
`--tz <iana>`, co interpretuje ten lokalny czas ścienny w podanej strefie czasowej.

Uwaga: zadania cykliczne używają teraz wykładniczego opóźnienia ponowień po kolejnych błędach (30s → 1m → 5m → 15m → 60m), a następnie wracają do normalnego harmonogramu po następnym udanym uruchomieniu.

Uwaga: `openclaw cron run` zwraca teraz wynik, gdy tylko ręczne uruchomienie zostanie dodane do kolejki wykonania. Pomyślne odpowiedzi zawierają `{ ok: true, enqueued: true, runId }`; użyj `openclaw cron runs --id <job-id>`, aby śledzić ostateczny wynik.

Uwaga: `openclaw cron run <job-id>` domyślnie wymusza uruchomienie. Użyj `--due`, aby zachować
starsze zachowanie „uruchom tylko, jeśli już czas”.

Uwaga: izolowane tury cron pomijają nieaktualne odpowiedzi zawierające tylko potwierdzenie. Jeśli
pierwszy wynik jest jedynie tymczasową aktualizacją statusu i żadne podrzędne uruchomienie subagenta nie
odpowiada za ostateczną odpowiedź, cron ponownie wyśle prompt raz jeszcze po rzeczywisty wynik
przed dostarczeniem.

Uwaga: jeśli izolowane uruchomienie zwróci tylko cichy token (`NO_REPLY` /
`no_reply`), cron pomija zarówno bezpośrednie dostarczenie wychodzące, jak i zapasową ścieżkę
podsumowania w kolejce, więc nic nie zostanie opublikowane z powrotem na czacie.

Uwaga: `cron add|edit --model ...` używa wybranego dozwolonego modelu dla zadania.
Jeśli model nie jest dozwolony, cron wyświetla ostrzeżenie i wraca do wyboru
modelu zadania/agenta/domyślnego. Skonfigurowane łańcuchy fallback nadal obowiązują, ale zwykłe
nadpisanie modelu bez jawnej listy fallback per zadanie nie dopisuje już głównego modelu agenta
jako ukrytego dodatkowego celu ponowienia.

Uwaga: pierwszeństwo modelu dla izolowanego cron jest następujące: najpierw nadpisanie Gmail-hook, potem
`--model` per zadanie, następnie dowolne zapisane nadpisanie modelu sesji cron, a potem zwykły
wybór agenta/domyślny.

Uwaga: tryb szybki izolowanego cron podąża za rozwiązanym wyborem aktywnego modelu. Konfiguracja
modelu `params.fastMode` jest stosowana domyślnie, ale zapisane nadpisanie `fastMode` sesji nadal ma pierwszeństwo nad konfiguracją.

Uwaga: jeśli izolowane uruchomienie zgłosi `LiveSessionModelSwitchError`, cron zapisuje
przełączone provider/model (oraz przełączone nadpisanie profilu auth, jeśli występuje) przed
ponowieniem. Zewnętrzna pętla ponowień jest ograniczona do 2 ponowień przełączenia po początkowej
próbie, a potem przerywa zamiast zapętlać się bez końca.

Uwaga: powiadomienia o błędach używają najpierw `delivery.failureDestination`, potem
globalnego `cron.failureDestination`, a na końcu wracają do głównego celu
announce zadania, gdy nie skonfigurowano jawnego miejsca docelowego błędów.

Uwaga: retencja/przycinanie są kontrolowane w konfiguracji:

- `cron.sessionRetention` (domyślnie `24h`) przycina ukończone sesje izolowanych uruchomień.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` przycinają `~/.openclaw/cron/runs/<jobId>.jsonl`.

Uwaga dotycząca aktualizacji: jeśli masz starsze zadania cron sprzed obecnego formatu dostarczania/przechowywania, uruchom
`openclaw doctor --fix`. Doctor teraz normalizuje starsze pola cron (`jobId`, `schedule.cron`,
pola dostarczania najwyższego poziomu, w tym starsze `threadId`, aliasy dostarczania `provider` w payload) i migruje proste
zadania fallback webhook z `notify: true` do jawnego dostarczania webhook, gdy `cron.webhook` jest
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

Ogłoś na określonym kanale:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Utwórz izolowane zadanie z lekkim kontekstem bootstrap:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` dotyczy tylko izolowanych zadań agent-turn. Dla uruchomień cron tryb lekki pozostawia pusty kontekst bootstrap zamiast wstrzykiwać pełny zestaw bootstrap przestrzeni roboczej.

Uwaga dotycząca własności dostarczania:

- Izolowane zadania należące do cron zawsze kierują końcowe widoczne dla użytkownika dostarczenie przez
  moduł uruchamiający cron (`announce`, `webhook` lub tylko-wewnętrzne `none`).
- Jeśli zadanie wspomina o wysłaniu wiadomości do jakiegoś zewnętrznego odbiorcy, agent powinien
  opisać zamierzone miejsce docelowe w wyniku zamiast próbować wysłać je
  bezpośrednio.

## Typowe polecenia administracyjne

Ręczne uruchomienie:

```bash
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Przekierowanie agenta/sesji:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

Dostosowanie dostarczania:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

Uwaga dotycząca dostarczania błędów:

- `delivery.failureDestination` jest obsługiwane dla zadań izolowanych.
- Zadania głównej sesji mogą używać `delivery.failureDestination` tylko wtedy, gdy podstawowy
  tryb dostarczania to `webhook`.
- Jeśli nie ustawisz żadnego miejsca docelowego błędów, a zadanie już ogłasza na
  kanale, powiadomienia o błędach użyją ponownie tego samego celu announce.
