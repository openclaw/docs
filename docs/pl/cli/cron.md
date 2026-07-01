---
read_when:
    - Chcesz zaplanowanych zadań i wybudzeń
    - Debugujesz wykonywanie Cron i logi
summary: Dokumentacja referencyjna CLI dla `openclaw cron` (planowanie i uruchamianie zadań w tle)
title: Cron
x-i18n:
    generated_at: "2026-07-01T08:34:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aed39843e183b3d441908ad4ac0578d44b6f0d482905871efc3421fd9820a1cc
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Zarządzaj zadaniami Cron dla harmonogramu Gateway.

<Tip>
Uruchom `openclaw cron --help`, aby zobaczyć pełny zakres poleceń. Zobacz [Zadania Cron](/pl/automation/cron-jobs), aby przeczytać przewodnik koncepcyjny.
</Tip>

## Szybkie tworzenie zadań

`openclaw cron create` jest aliasem dla `openclaw cron add`. W przypadku nowych zadań najpierw podaj harmonogram, a potem prompt:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Użyj `--webhook <url>`, gdy zadanie ma wysłać ukończony payload metodą POST zamiast dostarczać go do celu czatu:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Użyj `--command` dla deterministycznych zadań w stylu powłoki, które powinny działać w OpenClaw cron bez uruchamiania izolowanego przebiegu agenta/modelu:

<Note>
Zadania Cron poleceń to automatyzacje Gateway tworzone przez administratora. Tworzenie, edytowanie,
usuwanie lub ręczne uruchamianie ich wymaga `operator.admin`; zaplanowany przebieg
wykonuje się później w procesie Gateway, a nie jako wywołanie narzędzia `tools.exec` agenta.
`tools.exec.*` oraz zatwierdzenia exec nadal kontrolują narzędzia exec widoczne dla modelu.
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

`--command <shell>` zapisuje `argv: ["sh", "-lc", <shell>]`. Użyj `--command-argv '["node","scripts/report.mjs"]'` do wykonania dokładnego argv. Zadania poleceń przechwytują stdout/stderr, zapisują normalną historię Cron i kierują wynik przez te same tryby dostarczania `announce`, `webhook` lub `none` co zadania izolowane. Polecenie, które wypisuje tylko `NO_REPLY`, jest wyciszane.

## Sesje

`--session` akceptuje `main`, `isolated`, `current` lub `session:<id>`.

<AccordionGroup>
  <Accordion title="Klucze sesji">
    - `main` wiąże się z główną sesją agenta.
    - `isolated` tworzy świeży transkrypt i identyfikator sesji dla każdego przebiegu.
    - `current` wiąże się z aktywną sesją w momencie utworzenia.
    - `session:<id>` przypina do jawnego trwałego klucza sesji.

  </Accordion>
  <Accordion title="Semantyka sesji izolowanej">
    Izolowane przebiegi resetują otaczający kontekst rozmowy. Routing kanału i grupy, zasady wysyłania/kolejkowania, podniesienie uprawnień, źródło oraz powiązanie runtime ACP są resetowane dla nowego przebiegu. Bezpieczne preferencje oraz jawnie wybrane przez użytkownika nadpisania modelu lub auth mogą być przenoszone między przebiegami.
  </Accordion>
</AccordionGroup>

## Dostarczanie

`openclaw cron list` i `openclaw cron show <job-id>` pokazują podgląd rozstrzygniętej trasy dostarczania. Dla `channel: "last"` podgląd pokazuje, czy trasa została rozstrzygnięta z sesji głównej lub bieżącej, czy zakończy się niepowodzeniem w trybie fail-closed.

Cele z prefiksem dostawcy mogą doprecyzować nierozstrzygnięte kanały announce. Na przykład `to: "telegram:123"` wybiera Telegram, gdy `delivery.channel` jest pominięte lub ma wartość `last`. Tylko prefiksy ogłaszane przez załadowany plugin są selektorami dostawcy. Jeśli `delivery.channel` jest jawne, prefiks musi pasować do tego kanału; `channel: "whatsapp"` z `to: "telegram:123"` jest odrzucane. Prefiksy usług, takie jak `imessage:` i `sms:`, pozostają składnią celu należącą do kanału.

<Note>
Izolowane zadania `cron add` domyślnie używają dostarczania `--announce`. Użyj `--no-deliver`, aby zachować wynik wewnętrznie. `--deliver` pozostaje przestarzałym aliasem dla `--announce`.
</Note>

### Własność dostarczania

Dostarczanie izolowanego Cron do czatu jest współdzielone między agentem a runnerem:

- Agent może wysyłać bezpośrednio przy użyciu narzędzia `message`, gdy dostępna jest trasa czatu.
- `announce` dostarcza awaryjnie ostateczną odpowiedź tylko wtedy, gdy agent nie wysłał bezpośrednio do rozstrzygniętego celu.
- `webhook` wysyła ukończony payload metodą POST do URL.
- `none` wyłącza awaryjne dostarczanie przez runner.

Użyj `cron add|create --webhook <url>` lub `cron edit <job-id> --webhook <url>`, aby ustawić dostarczanie Webhook. Nie łącz `--webhook` z flagami dostarczania do czatu, takimi jak `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` lub `--account`.

`cron edit <job-id>` może wyczyścić poszczególne pola routingu dostarczania za pomocą `--clear-channel`, `--clear-to`, `--clear-thread-id` i `--clear-account` (każde jest odrzucane, gdy zostanie połączone z odpowiadającą mu flagą ustawiania). W przeciwieństwie do `--no-deliver`, które tylko wyłącza awaryjne dostarczanie przez runner, te opcje usuwają zapisane pole, aby zadanie ponownie rozstrzygało tę część trasy z wartości domyślnych.

`--announce` to awaryjne dostarczanie przez runner dla ostatecznej odpowiedzi. `--no-deliver` wyłącza to awaryjne dostarczanie, ale nie usuwa narzędzia `message` agenta, gdy dostępna jest trasa czatu.

Przypomnienia utworzone z aktywnego czatu zachowują bieżący cel dostarczania czatu dla awaryjnego dostarczania announce. Wewnętrzne klucze sesji mogą być pisane małymi literami; nie używaj ich jako źródła prawdy dla identyfikatorów dostawców rozróżniających wielkość liter, takich jak identyfikatory pokojów Matrix.

### Dostarczanie awarii

Powiadomienia o awariach są rozstrzygane w tej kolejności:

1. `delivery.failureDestination` w zadaniu.
2. Globalne `cron.failureDestination`.
3. Główny cel announce zadania (gdy nie ustawiono jawnego celu awarii).

<Note>
Zadania sesji głównej mogą używać `delivery.failureDestination` tylko wtedy, gdy głównym trybem dostarczania jest `webhook`. Zadania izolowane akceptują je we wszystkich trybach.
</Note>

Uwaga: izolowane przebiegi Cron traktują awarie agenta na poziomie przebiegu jako błędy zadania nawet wtedy, gdy
nie powstanie payload odpowiedzi, więc awarie modelu/dostawcy nadal zwiększają
liczniki błędów i wyzwalają powiadomienia o awariach.

Zadania Cron poleceń nie rozpoczynają izolowanej tury agenta. Zerowy kod wyjścia zapisuje
`ok`; niezerowe wyjście, sygnał, timeout lub timeout braku wyjścia zapisuje `error` i
może wyzwolić tę samą ścieżkę powiadomień o awariach.

Jeśli izolowany przebieg przekroczy limit czasu przed pierwszym żądaniem modelu, `openclaw cron show`
i `openclaw cron runs` zawierają błąd specyficzny dla fazy, taki jak
`setup timed out before runner start` lub
`stalled before first model call (last phase: context-engine)`.
W przypadku dostawców opartych na CLI, watchdog przed modelem pozostaje aktywny do chwili rozpoczęcia zewnętrznej
tury CLI, więc zacięcia wyszukiwania sesji, hooka, auth, promptu i konfiguracji CLI są
zgłaszane jako awarie Cron przed modelem.

## Harmonogram

### Zadania jednorazowe

`--at <datetime>` planuje jednorazowy przebieg. Daty i godziny bez przesunięcia są traktowane jako UTC, chyba że przekażesz także `--tz <iana>`, co interpretuje czas zegarowy w podanej strefie czasowej.

<Note>
Zadania jednorazowe domyślnie usuwają się po sukcesie. Użyj `--keep-after-run`, aby je zachować.
</Note>

### Zadania cykliczne

Zadania cykliczne używają wykładniczego backoffu ponowień po kolejnych błędach: 30 s, 1 min, 5 min, 15 min, 60 min. Harmonogram wraca do normy po następnym udanym przebiegu.

Pominięte przebiegi są śledzone oddzielnie od błędów wykonania. Nie wpływają na backoff ponowień, ale `openclaw cron edit <job-id> --failure-alert-include-skipped` może włączyć powiadomienia o awariach dla powtarzających się pominiętych przebiegów.

W przypadku zadań izolowanych, których celem jest lokalnie skonfigurowany dostawca modelu, Cron wykonuje lekką kontrolę wstępną dostawcy przed rozpoczęciem tury agenta. Dostawcy `api: "ollama"` typu loopback, private-network i `.local` są sprawdzani pod `/api/tags`; lokalni dostawcy zgodni z OpenAI, tacy jak vLLM, SGLang i LM Studio, są sprawdzani pod `/models`. Jeśli endpoint jest nieosiągalny, przebieg jest zapisywany jako `skipped` i ponawiany w późniejszym harmonogramie; pasujące martwe endpointy są cache'owane przez 5 minut, aby uniknąć zasypywania tego samego lokalnego serwera przez wiele zadań.

Uwaga: zadania Cron, oczekujący stan runtime i historia przebiegów znajdują się we współdzielonej bazie danych stanu SQLite. Starsze pliki `jobs.json`, `jobs-state.json` i `runs/*.jsonl` są importowane raz i zmieniane z sufiksem `.migrated`. Po imporcie edytuj harmonogramy za pomocą `openclaw cron add|edit|remove` zamiast edytować pliki JSON.

### Ręczne przebiegi

`openclaw cron run <job-id>` domyślnie wymusza przebieg i zwraca wynik, gdy tylko ręczny przebieg zostanie zakolejkowany. Udane odpowiedzi zawierają `{ ok: true, enqueued: true, runId }`. Użyj zwróconego `runId`, aby sprawdzić późniejszy wynik:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Dodaj `--wait`, gdy skrypt powinien blokować do chwili, gdy dokładnie ten zakolejkowany przebieg zapisze stan terminalny:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Z `--wait` CLI nadal najpierw wywołuje `cron.run`, a następnie odpytuje `cron.runs` o zwrócony `runId`. Polecenie kończy się kodem `0` tylko wtedy, gdy przebieg zakończy się ze statusem `ok`. Kończy się kodem niezerowym, gdy przebieg zakończy się statusem `error` lub `skipped`, gdy odpowiedź Gateway nie zawiera `runId` albo gdy wygaśnie `--wait-timeout`. `--poll-interval` musi być większe od zera.

<Note>
Użyj `--due`, gdy chcesz, aby ręczne polecenie uruchomiło się tylko wtedy, gdy zadanie jest aktualnie wymagalne. Jeśli `--due --wait` nie zakolejkuje przebiegu, polecenie zwraca normalną odpowiedź bez przebiegu zamiast odpytywać.
</Note>

## Modele

`cron add|edit --model <ref>` wybiera dozwolony model dla zadania. `cron add|edit --fallbacks <list>` ustawia modele fallback dla zadania, na przykład `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; przekaż `--fallbacks ""` dla ścisłego przebiegu bez fallbacków. `cron edit <job-id> --clear-fallbacks` usuwa nadpisanie fallbacków dla zadania. `cron edit <job-id> --clear-model` usuwa nadpisanie modelu dla zadania, aby zadanie stosowało normalną kolejność wyboru modelu Cron (zapisane nadpisanie sesji Cron, jeśli istnieje, w przeciwnym razie model agenta/domyślny); nie można tego łączyć z `--model`. `cron add|edit --thinking <level>` ustawia nadpisanie thinking dla zadania; `cron edit <job-id> --clear-thinking` usuwa je, aby zadanie stosowało normalną kolejność thinking Cron, i nie można tego łączyć z `--thinking`.

<Warning>
Jeśli model nie jest dozwolony lub nie można go rozstrzygnąć, Cron kończy przebieg niepowodzeniem z jawnym błędem walidacji zamiast wracać do wyboru modelu agenta zadania lub modelu domyślnego.
</Warning>

Cron `--model` to **główny model zadania**, a nie nadpisanie `/model` sesji czatu. Oznacza to, że:

- Skonfigurowane fallbacki modeli nadal mają zastosowanie, gdy wybrany model zadania zawiedzie.
- Payload `fallbacks` dla zadania zastępuje skonfigurowaną listę fallbacków, gdy jest obecny.
- Pusta lista fallbacków dla zadania (`--fallbacks ""` lub `fallbacks: []` w payloadzie/API zadania) sprawia, że przebieg Cron jest ścisły.
- Gdy zadanie ma `--model`, ale nie skonfigurowano listy fallbacków, OpenClaw przekazuje jawne puste nadpisanie fallbacków, aby główny model agenta nie został dodany jako ukryty cel ponowienia.
- Kontrole wstępne lokalnych dostawców przechodzą przez skonfigurowane fallbacki przed oznaczeniem przebiegu Cron jako `skipped`.

`openclaw doctor` zgłasza zadania, które mają już ustawione `payload.model`, w tym liczniki przestrzeni nazw dostawców oraz niezgodności względem `agents.defaults.model`. Użyj tej kontroli, gdy zachowanie auth, dostawcy lub rozliczeń wygląda inaczej między czatem na żywo a zaplanowanymi zadaniami.

### Kolejność wyboru modelu izolowanego Cron

Izolowany Cron rozstrzyga aktywny model w tej kolejności:

1. Nadpisanie hooka Gmail.
2. `--model` dla zadania.
3. Zapisane nadpisanie modelu sesji Cron (gdy użytkownik je wybrał).
4. Wybór modelu agenta lub domyślnego.

### Tryb szybki

Tryb szybki izolowanego Cron podąża za rozstrzygniętym wyborem modelu live. Konfiguracja modelu `params.fastMode` ma zastosowanie domyślnie, ale zapisane nadpisanie sesji `fastMode` nadal wygrywa z konfiguracją. Gdy rozstrzygnięty tryb to `auto`, próg używa wartości `params.fastAutoOnSeconds` wybranego modelu, domyślnie 60 sekund.

### Ponowienia przełączania modelu live

Jeśli izolowany przebieg zgłosi `LiveSessionModelSwitchError`, Cron utrwala przełączonego dostawcę i model (oraz nadpisanie przełączonego profilu auth, gdy jest obecne) dla aktywnego przebiegu przed ponowieniem. Zewnętrzna pętla ponowień jest ograniczona do dwóch ponowień przełączenia po początkowej próbie, a potem przerywa zamiast zapętlać się bez końca.

## Wynik przebiegu i odmowy

### Wyciszanie nieaktualnych potwierdzeń

Izolowane tury Cron wyciszają nieaktualne odpowiedzi będące wyłącznie potwierdzeniem. Jeśli pierwszy wynik jest tylko tymczasową aktualizacją statusu, a żaden potomny przebieg subagenta nie odpowiada za ostateczną odpowiedź, Cron ponownie wysyła prompt raz, aby uzyskać rzeczywisty wynik przed dostarczeniem.

### Wyciszanie tokenów ciszy

Jeśli izolowane uruchomienie cron zwróci tylko cichy token (`NO_REPLY` lub `no_reply`), cron pomija zarówno bezpośrednie dostarczenie wychodzące, jak i awaryjną ścieżkę zakolejkowanego podsumowania, więc nic nie zostaje opublikowane z powrotem na czacie.

### Ustrukturyzowane odmowy

Izolowane uruchomienia cron używają metadanych ustrukturyzowanej odmowy wykonania z osadzonego uruchomienia jako autorytatywnego sygnału odmowy. Honorują też opakowania `UNAVAILABLE` hosta węzła, gdy zagnieżdżony ustrukturyzowany komunikat błędu zaczyna się od `SYSTEM_RUN_DENIED` lub `INVALID_REQUEST`.

Cron nie klasyfikuje prozy z końcowych wyników ani fraz odmowy wyglądających jak zatwierdzenie jako odmów, chyba że osadzone uruchomienie dostarcza też metadane ustrukturyzowanej odmowy, więc zwykły tekst asystenta nie jest traktowany jako zablokowane polecenie.

`cron list` i historia uruchomień pokazują powód odmowy zamiast zgłaszać zablokowane polecenie jako `ok`.

## Retencja

Retencja i przycinanie są kontrolowane w konfiguracji:

- `cron.sessionRetention` (domyślnie `24h`) przycina ukończone sesje izolowanych uruchomień.
- `cron.runLog.keepLines` przycina zachowane wiersze historii uruchomień SQLite na zadanie. `cron.runLog.maxBytes` pozostaje akceptowane dla zgodności ze starszymi dziennikami uruchomień opartymi na plikach.

## Migrowanie starszych zadań

<Note>
Jeśli masz zadania cron sprzed obecnego formatu dostarczania i przechowywania, uruchom `openclaw doctor --fix`. Doctor normalizuje starsze pola cron (`jobId`, `schedule.cron`, pola dostarczania najwyższego poziomu, w tym starsze `threadId`, aliasy dostarczania `provider` w ładunku) i migruje zadania awaryjnego webhooka `notify: true` z `cron.webhook` do jawnego dostarczania webhookiem. Zadania, które już ogłaszają na czacie, zachowują to dostarczanie i otrzymują docelowe miejsce webhooka ukończenia. Gdy `cron.webhook` nie jest ustawione, bezczynny znacznik najwyższego poziomu `notify` jest usuwany dla zadań bez celu migracji (istniejące dostarczanie zostaje zachowane bez zmian), więc `doctor --fix` nie ostrzega już ponownie o nich.
</Note>

## Typowe edycje

Zaktualizuj ustawienia dostarczania bez zmiany wiadomości:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Wyłącz dostarczanie dla izolowanego zadania:

```bash
openclaw cron edit <job-id> --no-deliver
```

Włącz lekki kontekst inicjalizacji dla izolowanego zadania:

```bash
openclaw cron edit <job-id> --light-context
```

Ogłoś na konkretnym kanale:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Ogłoś w temacie forum Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Utwórz izolowane zadanie z lekkim kontekstem inicjalizacji:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` dotyczy tylko izolowanych zadań tur agenta. W przypadku uruchomień cron tryb lekki pozostawia kontekst inicjalizacji pusty zamiast wstrzykiwać pełny zestaw inicjalizacji obszaru roboczego.

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

Ręczne uruchamianie i inspekcja:

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

`openclaw cron list` domyślnie pokazuje wszystkie pasujące zadania. Przekaż `--agent <id>`, aby pokazać tylko zadania, których efektywny znormalizowany identyfikator agenta pasuje; zadania bez zapisanego identyfikatora agenta są liczone jako skonfigurowany domyślny agent.

`openclaw cron get <job-id>` zwraca bezpośrednio zapisany JSON zadania. Użyj `cron show <job-id>`, gdy chcesz widok czytelny dla człowieka z podglądem trasy dostarczania.

`cron list --json` i `cron show <job-id> --json` zawierają pole najwyższego poziomu `status` przy każdym zadaniu, wyliczane z `enabled`, `state.runningAtMs` i `state.lastRunStatus`. Wartości: `disabled`, `running`, `ok`, `error`, `skipped` lub `idle`. Odzwierciedla to kolumnę stanu czytelną dla człowieka, aby narzędzia zewnętrzne mogły odczytywać stan zadania bez ponownego wyliczania go.

Wpisy `cron runs` zawierają diagnostykę dostarczania z zamierzonym celem cron, rozpoznanym celem, wysyłkami narzędzia wiadomości, użyciem ścieżki awaryjnej i stanem dostarczenia.

Ponowne kierowanie agenta i sesji:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` ostrzega, gdy `--agent` zostanie pominięte w zadaniach tur agenta, i używa domyślnego agenta (`main`). Przekaż `--agent <id>` podczas tworzenia, aby przypiąć konkretnego agenta.

Dostosowanie dostarczania:

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
