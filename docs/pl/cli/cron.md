---
read_when:
    - Chcesz zaplanowanych zadań i wybudzeń
    - Debugujesz wykonywanie Cron i logi
summary: Dokumentacja referencyjna CLI dla `openclaw cron` (planowanie i uruchamianie zadań w tle)
title: Cron
x-i18n:
    generated_at: "2026-06-27T17:20:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa81e555d35b8982d1de9703c68dfb66aa9ad39407d46555eb0143e3cc5f52f5
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Zarządzaj zadaniami Cron harmonogramu Gateway.

<Tip>
Uruchom `openclaw cron --help`, aby zobaczyć pełny zakres poleceń. Zobacz [Zadania Cron](/pl/automation/cron-jobs), aby przeczytać przewodnik koncepcyjny.
</Tip>

## Szybkie tworzenie zadań

`openclaw cron create` jest aliasem dla `openclaw cron add`. W nowych zadaniach najpierw podaj harmonogram, a potem prompt:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Użyj `--webhook <url>`, gdy zadanie powinno wysłać ukończony ładunek metodą POST zamiast dostarczać go do celu czatu:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Użyj `--command` dla deterministycznych zadań w stylu powłoki, które powinny działać w OpenClaw cron bez uruchamiania izolowanego przebiegu agenta/modelu:

<Note>
Zadania Cron poleceń to automatyzacja Gateway tworzona przez administratora. Tworzenie, edytowanie,
usuwanie lub ręczne uruchamianie ich wymaga `operator.admin`; zaplanowany przebieg
wykonuje się później w procesie Gateway, a nie jako wywołanie narzędzia agenta `tools.exec`.
`tools.exec.*` i zatwierdzenia exec nadal zarządzają narzędziami exec widocznymi dla modelu.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` zapisuje `argv: ["sh", "-lc", <shell>]`. Użyj `--command-argv '["node","scripts/report.mjs"]'` do wykonania z dokładnym argv. Zadania poleceń przechwytują stdout/stderr, zapisują normalną historię Cron i kierują dane wyjściowe przez te same tryby dostarczania `announce`, `webhook` lub `none` co zadania izolowane. Polecenie, które wypisuje tylko `NO_REPLY`, jest wyciszane.

## Sesje

`--session` przyjmuje `main`, `isolated`, `current` lub `session:<id>`.

<AccordionGroup>
  <Accordion title="Klucze sesji">
    - `main` wiąże z główną sesją agenta.
    - `isolated` tworzy świeży transkrypt i identyfikator sesji dla każdego przebiegu.
    - `current` wiąże z aktywną sesją w chwili tworzenia.
    - `session:<id>` przypina do jawnego trwałego klucza sesji.

  </Accordion>
  <Accordion title="Semantyka sesji izolowanej">
    Izolowane przebiegi resetują otaczający kontekst konwersacji. Routing kanału i grupy, zasady wysyłania/kolejkowania, podniesienie uprawnień, źródło oraz powiązanie środowiska uruchomieniowego ACP są resetowane dla nowego przebiegu. Bezpieczne preferencje oraz jawnie wybrane przez użytkownika nadpisania modelu lub autoryzacji mogą być przenoszone między przebiegami.
  </Accordion>
</AccordionGroup>

## Dostarczanie

`openclaw cron list` i `openclaw cron show <job-id>` pokazują podgląd rozpoznanej trasy dostarczania. Dla `channel: "last"` podgląd pokazuje, czy trasa została rozpoznana z sesji głównej lub bieżącej, czy zakończy się odmową.

Cele z prefiksem dostawcy mogą rozstrzygać niejednoznaczne nierozpoznane kanały ogłoszeń. Na przykład `to: "telegram:123"` wybiera Telegram, gdy `delivery.channel` jest pominięte lub ma wartość `last`. Selektorami dostawcy są tylko prefiksy ogłaszane przez załadowany Plugin. Jeśli `delivery.channel` jest jawne, prefiks musi pasować do tego kanału; `channel: "whatsapp"` z `to: "telegram:123"` jest odrzucane. Prefiksy usług, takie jak `imessage:` i `sms:`, pozostają składnią celu należącą do kanału.

<Note>
Izolowane zadania `cron add` domyślnie używają dostarczania `--announce`. Użyj `--no-deliver`, aby zachować dane wyjściowe wewnętrznie. `--deliver` pozostaje przestarzałym aliasem dla `--announce`.
</Note>

### Własność dostarczania

Dostarczanie czatu przez izolowany Cron jest współdzielone między agentem i runnerem:

- Agent może wysyłać bezpośrednio za pomocą narzędzia `message`, gdy dostępna jest trasa czatu.
- `announce` awaryjnie dostarcza końcową odpowiedź tylko wtedy, gdy agent nie wysłał jej bezpośrednio do rozpoznanego celu.
- `webhook` publikuje ukończony ładunek pod URL.
- `none` wyłącza awaryjne dostarczanie runnera.

Użyj `cron add|create --webhook <url>` lub `cron edit <job-id> --webhook <url>`, aby ustawić dostarczanie Webhook. Nie łącz `--webhook` z flagami dostarczania czatu, takimi jak `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` lub `--account`.

`cron edit <job-id>` może usuwać poszczególne pola routingu dostarczania za pomocą `--clear-channel`, `--clear-to`, `--clear-thread-id` i `--clear-account` (każde z nich jest odrzucane w połączeniu z odpowiadającą mu flagą ustawiającą). W przeciwieństwie do `--no-deliver`, które tylko wyłącza awaryjne dostarczanie runnera, te flagi usuwają zapisane pole, aby zadanie ponownie rozpoznawało tę część trasy z wartości domyślnych.

`--announce` to awaryjne dostarczanie końcowej odpowiedzi przez runnera. `--no-deliver` wyłącza to awaryjne dostarczanie, ale nie usuwa narzędzia `message` agenta, gdy dostępna jest trasa czatu.

Przypomnienia utworzone z aktywnego czatu zachowują bieżący cel dostarczania czatu dla awaryjnego dostarczania ogłoszenia. Wewnętrzne klucze sesji mogą być zapisane małymi literami; nie używaj ich jako źródła prawdy dla identyfikatorów dostawców rozróżniających wielkość liter, takich jak identyfikatory pokoi Matrix.

### Dostarczanie awarii

Powiadomienia o awarii są rozpoznawane w tej kolejności:

1. `delivery.failureDestination` w zadaniu.
2. Globalne `cron.failureDestination`.
3. Główny cel ogłoszenia zadania (gdy nie ustawiono jawnego celu awarii).

<Note>
Zadania sesji głównej mogą używać `delivery.failureDestination` tylko wtedy, gdy podstawowym trybem dostarczania jest `webhook`. Zadania izolowane akceptują je we wszystkich trybach.
</Note>

Uwaga: izolowane przebiegi Cron traktują awarie agenta na poziomie przebiegu jako błędy zadania nawet wtedy, gdy
nie powstanie ładunek odpowiedzi, więc awarie modelu/dostawcy nadal zwiększają
liczniki błędów i wyzwalają powiadomienia o awarii.

Zadania Cron poleceń nie uruchamiają izolowanej tury agenta. Zerowy kod wyjścia zapisuje
`ok`; niezerowe wyjście, sygnał, przekroczenie limitu czasu lub przekroczenie limitu czasu bez danych wyjściowych zapisuje `error` i
może wyzwolić tę samą ścieżkę powiadomień o awarii.

Jeśli izolowany przebieg przekroczy limit czasu przed pierwszym żądaniem modelu, `openclaw cron show`
i `openclaw cron runs` zawierają błąd specyficzny dla fazy, taki jak
`setup timed out before runner start` lub
`stalled before first model call (last phase: context-engine)`.
W przypadku dostawców opartych na CLI watchdog przed modelem pozostaje aktywny do czasu rozpoczęcia zewnętrznej
tury CLI, więc zastoje wyszukiwania sesji, hooka, autoryzacji, promptu i konfiguracji CLI są
zgłaszane jako awarie Cron przed modelem.

## Harmonogram

### Zadania jednorazowe

`--at <datetime>` planuje jednorazowy przebieg. Daty i godziny bez przesunięcia są traktowane jako UTC, chyba że przekażesz też `--tz <iana>`, co interpretuje czas zegarowy w podanej strefie czasowej.

<Note>
Zadania jednorazowe są domyślnie usuwane po powodzeniu. Użyj `--keep-after-run`, aby je zachować.
</Note>

### Zadania cykliczne

Zadania cykliczne używają wykładniczego backoffu ponowień po kolejnych błędach: 30s, 1m, 5m, 15m, 60m. Harmonogram wraca do normy po następnym udanym przebiegu.

Pominięte przebiegi są śledzone oddzielnie od błędów wykonania. Nie wpływają na backoff ponowień, ale `openclaw cron edit <job-id> --failure-alert-include-skipped` może włączyć powiadomienia o awarii także dla powtarzających się powiadomień o pominiętych przebiegach.

Dla zadań izolowanych, które wskazują lokalnie skonfigurowanego dostawcę modelu, Cron uruchamia lekki preflight dostawcy przed rozpoczęciem tury agenta. Dostawcy `api: "ollama"` typu loopback, sieci prywatnej i `.local` są sprawdzani pod `/api/tags`; lokalni dostawcy zgodni z OpenAI, tacy jak vLLM, SGLang i LM Studio, są sprawdzani pod `/models`. Jeśli endpoint jest nieosiągalny, przebieg jest zapisywany jako `skipped` i ponawiany przy późniejszym harmonogramie; pasujące martwe endpointy są buforowane przez 5 minut, aby uniknąć przeciążania tego samego lokalnego serwera przez wiele zadań.

Uwaga: zadania Cron, oczekujący stan środowiska uruchomieniowego i historia przebiegów znajdują się we współdzielonej bazie stanu SQLite. Starsze pliki `jobs.json`, `jobs-state.json` i `runs/*.jsonl` są importowane jednorazowo i zmieniane z sufiksem `.migrated`. Po imporcie edytuj harmonogramy za pomocą `openclaw cron add|edit|remove` zamiast edytować pliki JSON.

### Ręczne przebiegi

`openclaw cron run <job-id>` domyślnie wymusza przebieg i zwraca odpowiedź, gdy tylko ręczny przebieg zostanie umieszczony w kolejce. Udane odpowiedzi zawierają `{ ok: true, enqueued: true, runId }`. Użyj zwróconego `runId`, aby sprawdzić późniejszy wynik:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Dodaj `--wait`, gdy skrypt powinien blokować do czasu, aż dokładnie ten zakolejkowany przebieg zapisze status terminalny:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Z `--wait` CLI nadal najpierw wywołuje `cron.run`, a potem odpytuje `cron.runs` o zwrócony `runId`. Polecenie kończy się kodem `0` tylko wtedy, gdy przebieg zakończy się statusem `ok`. Kończy się kodem niezerowym, gdy przebieg zakończy się statusem `error` lub `skipped`, gdy odpowiedź Gateway nie zawiera `runId` albo gdy upłynie `--wait-timeout`. `--poll-interval` musi być większe od zera.

<Note>
Użyj `--due`, gdy chcesz, aby polecenie ręczne uruchomiło się tylko wtedy, gdy zadanie jest obecnie wymagalne. Jeśli `--due --wait` nie zakolejkuje przebiegu, polecenie zwraca normalną odpowiedź bez przebiegu zamiast odpytywania.
</Note>

## Modele

`cron add|edit --model <ref>` wybiera dozwolony model dla zadania. `cron add|edit --fallbacks <list>` ustawia modele awaryjne dla zadania, na przykład `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; przekaż `--fallbacks ""` dla ścisłego przebiegu bez modeli awaryjnych. `cron edit <job-id> --clear-fallbacks` usuwa nadpisanie modeli awaryjnych dla zadania. `cron edit <job-id> --clear-model` usuwa nadpisanie modelu dla zadania, aby zadanie stosowało normalny priorytet wyboru modelu Cron (zapisane nadpisanie sesji Cron, jeśli istnieje, w przeciwnym razie model agenta/domyślny); nie można łączyć z `--model`.

<Warning>
Jeśli model nie jest dozwolony lub nie można go rozpoznać, Cron kończy przebieg jawnym błędem walidacji zamiast przechodzić awaryjnie do wyboru modelu agenta zadania lub modelu domyślnego.
</Warning>

Cron `--model` jest **modelem głównym zadania**, a nie nadpisaniem `/model` sesji czatu. Oznacza to:

- Skonfigurowane modele awaryjne nadal mają zastosowanie, gdy wybrany model zadania zawiedzie.
- Ładunek `fallbacks` dla zadania zastępuje skonfigurowaną listę modeli awaryjnych, gdy jest obecny.
- Pusta lista modeli awaryjnych dla zadania (`--fallbacks ""` lub `fallbacks: []` w ładunku/API zadania) sprawia, że przebieg Cron jest ścisły.
- Gdy zadanie ma `--model`, ale nie skonfigurowano listy modeli awaryjnych, OpenClaw przekazuje jawne puste nadpisanie modeli awaryjnych, aby model główny agenta nie został dołączony jako ukryty cel ponowienia.
- Kontrole preflight lokalnego dostawcy przechodzą po skonfigurowanych modelach awaryjnych, zanim oznaczą przebieg Cron jako `skipped`.

`openclaw doctor` zgłasza zadania, które mają już ustawione `payload.model`, w tym liczbę przestrzeni nazw dostawców i niezgodności względem `agents.defaults.model`. Użyj tej kontroli, gdy zachowanie autoryzacji, dostawcy lub rozliczeń wygląda inaczej między czatem na żywo a zaplanowanymi zadaniami.

### Priorytet modelu izolowanego Cron

Izolowany Cron rozpoznaje aktywny model w tej kolejności:

1. Nadpisanie hooka Gmail.
2. `--model` dla zadania.
3. Zapisane nadpisanie modelu sesji Cron (gdy użytkownik je wybrał).
4. Wybór modelu agenta lub modelu domyślnego.

### Tryb szybki

Tryb szybki izolowanego Cron podąża za rozpoznanym wyborem modelu na żywo. Konfiguracja modelu `params.fastMode` ma domyślnie zastosowanie, ale zapisane nadpisanie sesji `fastMode` nadal wygrywa z konfiguracją. Gdy rozpoznanym trybem jest `auto`, próg używa wartości `params.fastAutoOnSeconds` wybranego modelu, domyślnie 60 sekund.

### Ponowienia przełączenia modelu na żywo

Jeśli izolowany przebieg zgłosi `LiveSessionModelSwitchError`, Cron utrwala przełączonego dostawcę i model (oraz nadpisanie przełączonego profilu autoryzacji, gdy jest obecne) dla aktywnego przebiegu przed ponowieniem. Zewnętrzna pętla ponowień jest ograniczona do dwóch ponowień przełączenia po początkowej próbie, a następnie przerywa zamiast zapętlać się bez końca.

## Dane wyjściowe przebiegu i odmowy

### Wyciszanie nieaktualnych potwierdzeń

Izolowane tury Cron wyciszają nieaktualne odpowiedzi będące tylko potwierdzeniem. Jeśli pierwszy wynik jest jedynie tymczasową aktualizacją statusu i żaden przebieg potomnego subagenta nie odpowiada za ostateczną odpowiedź, Cron ponawia prompt raz, aby uzyskać rzeczywisty wynik przed dostarczeniem.

### Wyciszanie cichego tokenu

Jeśli izolowany przebieg Cron zwraca tylko cichy token (`NO_REPLY` lub `no_reply`), Cron wycisza zarówno bezpośrednie dostarczanie wychodzące, jak i awaryjną ścieżkę zakolejkowanego podsumowania, więc nic nie jest publikowane z powrotem na czacie.

### Ustrukturyzowane odmowy

Izolowane uruchomienia Cron używają ustrukturyzowanych metadanych odmowy wykonania z osadzonego uruchomienia jako autorytatywnego sygnału odmowy. Honorują też opakowania `UNAVAILABLE` z hosta węzła, gdy zagnieżdżony ustrukturyzowany komunikat błędu zaczyna się od `SYSTEM_RUN_DENIED` lub `INVALID_REQUEST`.

Cron nie klasyfikuje prozy w końcowym wyniku ani fraz odmowy wyglądających jak zatwierdzenie jako odmów, chyba że osadzone uruchomienie dostarcza również ustrukturyzowane metadane odmowy, więc zwykły tekst asystenta nie jest traktowany jako zablokowane polecenie.

`cron list` i historia uruchomień pokazują powód odmowy zamiast raportować zablokowane polecenie jako `ok`.

## Przechowywanie

Przechowywanie i przycinanie są kontrolowane w konfiguracji:

- `cron.sessionRetention` (domyślnie `24h`) przycina ukończone sesje izolowanych uruchomień.
- `cron.runLog.keepLines` przycina zachowane wiersze historii uruchomień SQLite dla każdego zadania. `cron.runLog.maxBytes` pozostaje akceptowane dla zgodności ze starszymi dziennikami uruchomień opartymi na plikach.

## Migrowanie starszych zadań

<Note>
Jeśli masz zadania Cron sprzed bieżącego formatu dostarczania i przechowywania, uruchom `openclaw doctor --fix`. Doctor normalizuje starsze pola Cron (`jobId`, `schedule.cron`, pola dostarczania najwyższego poziomu, w tym starsze `threadId`, aliasy dostarczania `provider` w ładunku) oraz migruje zadania awaryjne Webhook `notify: true` z `cron.webhook` do jawnego dostarczania Webhook. Zadania, które już ogłaszają do czatu, zachowują to dostarczanie i otrzymują docelowy Webhook ukończenia. Gdy `cron.webhook` nie jest ustawione, nieaktywny znacznik najwyższego poziomu `notify` jest usuwany dla zadań bez celu migracji (istniejące dostarczanie pozostaje zachowane bez zmian), więc `doctor --fix` nie ostrzega już o nich ponownie.
</Note>

## Typowe edycje

Zaktualizuj ustawienia dostarczania bez zmieniania wiadomości:

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

Ogłoś w temacie forum Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Utwórz izolowane zadanie z lekkim kontekstem bootstrap:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` dotyczy tylko izolowanych zadań tury agenta. Dla uruchomień Cron tryb lekki pozostawia kontekst bootstrap pusty zamiast wstrzykiwać pełny zestaw bootstrap obszaru roboczego.

Utwórz zadanie polecenia z dokładnymi argv, cwd, env, stdin i limitami wyjścia:

```bash
openclaw cron create "*/30 * * * *" \
  --name "Position export" \
  --command-argv '["node","scripts/export-position.mjs"]' \
  --command-cwd "/srv/app" \
  --command-env "NODE_ENV=production" \
  --command-input '{"mode":"summary"}' \
  --timeout-seconds 120 \
  --no-output-timeout-seconds 30 \
  --output-max-bytes 65536 \
  --webhook "https://example.invalid/openclaw/cron"
```

## Typowe polecenia administracyjne

Ręczne uruchomienie i inspekcja:

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron get <job-id>
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron run <job-id> --wait --wait-timeout 10m
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
openclaw cron runs --id <job-id> --limit 50
openclaw cron runs --id <job-id> --run-id <run-id>
```

`openclaw cron list` domyślnie pokazuje wszystkie pasujące zadania. Przekaż `--agent <id>`, aby pokazać tylko zadania, których efektywny znormalizowany identyfikator agenta pasuje; zadania bez zapisanego identyfikatora agenta są liczone jako skonfigurowany agent domyślny.

`openclaw cron get <job-id>` zwraca bezpośrednio zapisany JSON zadania. Użyj `cron show <job-id>`, gdy chcesz widok czytelny dla człowieka z podglądem trasy dostarczania.

`cron list --json` i `cron show <job-id> --json` zawierają pole najwyższego poziomu `status` przy każdym zadaniu, obliczane z `enabled`, `state.runningAtMs` i `state.lastRunStatus`. Wartości: `disabled`, `running`, `ok`, `error`, `skipped` lub `idle`. Odzwierciedla to kolumnę statusu czytelną dla człowieka, aby zewnętrzne narzędzia mogły odczytywać stan zadania bez ponownego wyprowadzania go.

Wpisy `cron runs` zawierają diagnostykę dostarczania z zamierzonym celem Cron, rozwiązanym celem, wysyłkami narzędzia wiadomości, użyciem mechanizmu awaryjnego i stanem dostarczenia.

Zmiana docelowego agenta i sesji:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` ostrzega, gdy `--agent` zostanie pominięte w zadaniach tury agenta, i wraca do domyślnego agenta (`main`). Przekaż `--agent <id>` podczas tworzenia, aby przypiąć konkretnego agenta.

Dostosowania dostarczania:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --webhook "https://example.invalid/openclaw/cron"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Zaplanowane zadania](/pl/automation/cron-jobs)
