---
read_when:
    - Potrzebujesz zaplanowanych zadań i wybudzeń
    - Debugujesz wykonywanie zadań Cron i dzienniki
summary: Dokumentacja CLI dla `openclaw cron` (planowanie i uruchamianie zadań w tle)
title: Cron
x-i18n:
    generated_at: "2026-07-12T14:54:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e16335b13f92229df0ba49c320e2714e39ab3e503e8e72f376ec2c5b0803cf7
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Zarządzaj zadaniami cron harmonogramu Gateway.

<Tip>
Uruchom `openclaw cron --help`, aby wyświetlić pełny zestaw poleceń. Przewodnik koncepcyjny znajdziesz w sekcji [Zadania Cron](/pl/automation/cron-jobs).
</Tip>

<Note>
Wszystkie operacje modyfikujące zadania cron (`add`/`create`, `update`/`edit`, `remove`, `run`) wymagają uprawnienia `operator.admin`. Uruchomienia z ładunkiem polecenia są wykonywane bezpośrednio w procesie Gateway, a nie jako wywołanie narzędzia agenta `tools.exec`; ustawienia `tools.exec.*` i zatwierdzenia wykonania nadal kontrolują narzędzia wykonawcze dostępne dla modelu.
</Note>

## Szybkie tworzenie zadań

`openclaw cron create` jest aliasem polecenia `openclaw cron add`. W przypadku nowych zadań podaj najpierw harmonogram, a następnie prompt:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops
```

Użyj `--webhook <url>`, jeśli zadanie powinno wysłać gotowy ładunek żądaniem POST zamiast dostarczać go do miejsca docelowego czatu:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

Użyj `--command` w przypadku deterministycznych zadań w stylu powłoki, które działają wewnątrz Cron OpenClaw bez uruchamiania izolowanego przebiegu agenta/modelu:

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` przechowuje `argv: ["sh", "-lc", <shell>]`. Użyj `--command-argv '["node","scripts/report.mjs"]'`, aby wykonać dokładnie określone argumenty argv. Zadania poleceń przechwytują stdout/stderr, zapisują standardową historię Cron i kierują dane wyjściowe przez te same tryby dostarczania `announce`, `webhook` lub `none`, co zadania izolowane. Polecenie, które wypisuje wyłącznie `NO_REPLY`, jest pomijane.

## Sesje

`--session` przyjmuje wartości `main`, `isolated`, `current` lub `session:<id>`.

<AccordionGroup>
  <Accordion title="Klucze sesji">
    - `main` wiąże zadanie z główną sesją agenta.
    - `isolated` tworzy nowy zapis rozmowy i identyfikator sesji dla każdego uruchomienia.
    - `current` wiąże zadanie z sesją aktywną w chwili jego utworzenia.
    - `session:<id>` przypina zadanie do jawnie określonego trwałego klucza sesji.

  </Accordion>
  <Accordion title="Semantyka sesji izolowanej">
    Uruchomienia izolowane zerują kontekst bieżącej rozmowy. Trasowanie kanału i grupy, zasady wysyłania/kolejkowania, podniesienie uprawnień, pochodzenie oraz powiązanie środowiska wykonawczego ACP są zerowane dla nowego uruchomienia. Bezpieczne preferencje oraz jawnie wybrane przez użytkownika nadpisania modelu lub uwierzytelniania mogą być przenoszone między uruchomieniami.
  </Accordion>
</AccordionGroup>

## Dostarczanie

`openclaw cron list` i `openclaw cron show <job-id>` wyświetlają podgląd wyznaczonej trasy dostarczania. W przypadku `channel: "last"` podgląd pokazuje, czy trasa została wyznaczona na podstawie sesji głównej lub bieżącej, czy też operacja zakończy się bezpiecznym niepowodzeniem.

Miejsca docelowe z prefiksem dostawcy mogą jednoznacznie wskazywać nierozpoznane kanały ogłoszeń. Na przykład `to: "telegram:123"` wybiera Telegram, gdy `delivery.channel` jest pominięte lub ma wartość `last`. Selektorami dostawcy są wyłącznie prefiksy udostępniane przez załadowany Plugin. Jeśli `delivery.channel` określono jawnie, prefiks musi odpowiadać temu kanałowi; połączenie `channel: "whatsapp"` z `to: "telegram:123"` zostanie odrzucone. Prefiksy usług, takie jak `imessage:` i `sms:`, pozostają składnią miejsca docelowego zarządzaną przez kanał.

<Note>
Izolowane zadania `cron add` domyślnie używają dostarczania `--announce`. Użyj `--no-deliver`, aby zachować dane wyjściowe wewnętrznie. `--deliver` pozostaje przestarzałym aliasem `--announce`.
</Note>

### Odpowiedzialność za dostarczanie

Za dostarczanie wiadomości czatu przez izolowane zadania cron odpowiadają wspólnie agent i moduł uruchamiający:

- Agent może wysyłać wiadomości bezpośrednio za pomocą narzędzia `message`, gdy dostępna jest trasa czatu.
- Awaryjne dostarczanie `announce` przekazuje końcową odpowiedź tylko wtedy, gdy agent nie wysłał jej bezpośrednio do wyznaczonego miejsca docelowego.
- `webhook` wysyła gotowy ładunek pod adres URL.
- `none` wyłącza awaryjne dostarczanie przez moduł uruchamiający.

Użyj `cron add|create --webhook <url>` lub `cron edit <job-id> --webhook <url>`, aby skonfigurować dostarczanie przez Webhook. Nie łącz `--webhook` z flagami dostarczania do czatu, takimi jak `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` lub `--account`.

Polecenie `cron edit <job-id>` może usuwać poszczególne pola trasowania dostarczania za pomocą `--clear-channel`, `--clear-to`, `--clear-thread-id` i `--clear-account` (każda z tych flag jest odrzucana w połączeniu z odpowiadającą jej flagą ustawiającą). W przeciwieństwie do `--no-deliver`, które wyłącza wyłącznie awaryjne dostarczanie przez moduł uruchamiający, flagi te usuwają zapisane pole, dzięki czemu zadanie ponownie wyznacza tę część trasy na podstawie wartości domyślnych.

`--announce` służy do awaryjnego dostarczania końcowej odpowiedzi przez moduł uruchamiający. `--no-deliver` wyłącza tę funkcję, ale nie usuwa agentowi narzędzia `message`, gdy dostępna jest trasa czatu.

Przypomnienia tworzone z aktywnego czatu zachowują bieżące miejsce docelowe dostarczania czatu na potrzeby awaryjnego dostarczania ogłoszeń. Wewnętrzne klucze sesji mogą być zapisane małymi literami; nie należy traktować ich jako źródła prawdy dla identyfikatorów dostawców rozróżniających wielkość liter, takich jak identyfikatory pokojów Matrix.

### Dostarczanie powiadomień o niepowodzeniach

Miejsce docelowe powiadomień o niepowodzeniach jest wyznaczane w następującej kolejności:

1. `delivery.failureDestination` zadania.
2. Globalne `cron.failureDestination`.
3. Główne miejsce docelowe ogłoszeń zadania (gdy żaden z powyższych elementów nie wskazuje konkretnego miejsca docelowego).

<Note>
Zadania sesji głównej mogą używać `delivery.failureDestination` tylko wtedy, gdy głównym trybem dostarczania jest `webhook`. Zadania izolowane obsługują je we wszystkich trybach.
</Note>

Izolowane uruchomienia cron traktują niepowodzenia agenta na poziomie uruchomienia jako błędy zadania, nawet jeśli nie powstanie żaden ładunek odpowiedzi, dlatego błędy modelu/dostawcy nadal zwiększają liczniki błędów i wyzwalają powiadomienia o niepowodzeniach.

Zadania poleceń cron nie rozpoczynają izolowanej tury agenta. Kod wyjścia równy zero zapisuje stan `ok`; niezerowy kod wyjścia, sygnał, przekroczenie limitu czasu lub przekroczenie limitu czasu bez danych wyjściowych zapisuje stan `error` i może uruchomić tę samą ścieżkę powiadamiania o niepowodzeniach.

Jeśli izolowane uruchomienie przekroczy limit czasu przed pierwszym żądaniem do modelu, `openclaw cron show` i `openclaw cron runs` zawierają błąd właściwy dla danej fazy, taki jak `setup timed out before runner start`, lub komunikat o zastoju wskazujący ostatnią znaną fazę uruchamiania, na przykład `context-engine`. W przypadku dostawców opartych na CLI mechanizm nadzorujący fazę przed wywołaniem modelu pozostaje aktywny do chwili rozpoczęcia zewnętrznej tury CLI, dlatego zastoje podczas wyszukiwania sesji, wykonywania hooka, uwierzytelniania, przygotowywania promptu i konfiguracji CLI są zgłaszane jako błędy Cron występujące przed wywołaniem modelu.

## Planowanie

### Zadania jednorazowe

`--at <datetime>` planuje jednorazowe uruchomienie. Daty i godziny bez przesunięcia są traktowane jako UTC, chyba że podasz również `--tz <iana>`, co spowoduje interpretację czasu zegarowego w podanej strefie czasowej.

<Note>
Zadania jednorazowe są domyślnie usuwane po pomyślnym wykonaniu. Użyj `--keep-after-run`, aby je zachować.
</Note>

### Zadania cykliczne

Po kolejnych błędach zadania cykliczne stosują wykładnicze zwiększanie opóźnienia ponownych prób: 30 s, 1 min, 5 min, 15 min, 60 min. Po następnym pomyślnym uruchomieniu harmonogram wraca do normy.

Pominięte uruchomienia są śledzone oddzielnie od błędów wykonania. Nie wpływają na opóźnienie ponownych prób, ale `openclaw cron edit <job-id> --failure-alert-include-skipped` umożliwia uwzględnianie powtarzających się powiadomień o pominiętych uruchomieniach w alertach o niepowodzeniach.

W przypadku izolowanych zadań korzystających z lokalnie skonfigurowanego dostawcy modelu (bazowy adres URL wskazujący local loopback, sieć prywatną lub domenę `.local`) Cron przeprowadza uproszczoną kontrolę wstępną dostawcy przed rozpoczęciem tury agenta: dostawcy `api: "ollama"` są sprawdzani pod ścieżką `/api/tags`, a inni lokalni dostawcy zgodni z OpenAI (`api: "openai-completions"`, np. vLLM, SGLang, LM Studio) — pod ścieżką `/models`. Jeśli punkt końcowy jest nieosiągalny, uruchomienie zostaje zapisane jako `skipped`, a kolejna próba następuje w późniejszym terminie harmonogramu; wynik sprawdzenia osiągalności jest buforowany osobno dla każdego punktu końcowego przez 5 minut, aby wiele zadań korzystających z tego samego lokalnego serwera nie przeciążało go powtarzającymi się testami.

Zadania Cron, oczekujący stan środowiska wykonawczego i historia uruchomień znajdują się we współdzielonej bazie danych stanu SQLite. Starsze pliki `jobs.json`, `<name>-state.json` i `runs/*.jsonl` są importowane jednorazowo, a następnie otrzymują nazwy z sufiksem `.migrated`. Po zaimportowaniu edytuj harmonogramy za pomocą `openclaw cron add|edit|remove`, zamiast modyfikować pliki JSON.

### Uruchomienia ręczne

`openclaw cron run <job-id>` domyślnie wymusza uruchomienie i kończy działanie natychmiast po umieszczeniu ręcznego uruchomienia w kolejce. Pomyślne odpowiedzi zawierają `{ ok: true, enqueued: true, runId }`. Użyj zwróconego `runId`, aby później sprawdzić wynik:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Dodaj `--wait`, jeśli skrypt powinien czekać, aż dokładnie to uruchomienie z kolejki zapisze stan końcowy:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

Po użyciu `--wait` CLI nadal najpierw wywołuje `cron.run`, a następnie odpytuje `cron.runs` o zwrócony `runId`. Polecenie kończy się kodem `0` tylko wtedy, gdy uruchomienie zakończy się ze stanem `ok`. Zwraca kod niezerowy, gdy uruchomienie kończy się ze stanem `error` lub `skipped`, gdy odpowiedź Gateway nie zawiera `runId` albo gdy upłynie limit `--wait-timeout` (domyślnie `10m`, z odpytywaniem domyślnie co `2s`). Wartość `--poll-interval` musi być większa od zera.

<Note>
Użyj `--due`, jeśli polecenie ręczne powinno uruchomić zadanie tylko wtedy, gdy właśnie przypada termin jego wykonania. Jeśli `--due --wait` nie umieści uruchomienia w kolejce, polecenie zwróci standardową odpowiedź informującą o braku uruchomienia zamiast rozpoczynać odpytywanie.
</Note>

## Modele

`cron add|edit --model <ref>` wybiera dozwolony model dla zadania. `cron add|edit --fallbacks <list>` ustawia modele rezerwowe dla danego zadania, na przykład `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; podaj `--fallbacks ""`, aby wymusić ścisłe uruchomienie bez modeli rezerwowych. `cron edit <job-id> --clear-fallbacks` usuwa nadpisanie modeli rezerwowych dla danego zadania. `cron edit <job-id> --clear-model` usuwa nadpisanie modelu dla danego zadania, dzięki czemu zadanie stosuje standardową kolejność wyboru modelu Cron (zapisane nadpisanie sesji Cron, jeśli istnieje, a w przeciwnym razie model agenta lub model domyślny); tej flagi nie można łączyć z `--model`. `cron add|edit --thinking <level>` ustawia nadpisanie poziomu rozumowania dla danego zadania; `cron edit <job-id> --clear-thinking` usuwa je, dzięki czemu zadanie stosuje standardową kolejność wyboru poziomu rozumowania Cron, i nie można go łączyć z `--thinking`.

<Warning>
Jeśli model jest niedozwolony lub nie można go rozpoznać, Cron przerywa uruchomienie z jawnym błędem walidacji, zamiast powracać do modelu agenta zadania lub domyślnego wyboru modelu.
</Warning>

Opcja Cron `--model` określa **główny model zadania**, a nie nadpisanie `/model` sesji czatu. Oznacza to, że:

- Skonfigurowane modele rezerwowe nadal są stosowane, gdy wybrany model zadania zawiedzie.
- Jeśli w ładunku zadania podano `fallbacks`, zastępuje ono skonfigurowaną listę modeli rezerwowych.
- Pusta lista modeli rezerwowych dla zadania (`--fallbacks ""` lub `fallbacks: []` w ładunku zadania/API) sprawia, że uruchomienie Cron jest ścisłe.
- Gdy zadanie ma ustawione `--model`, ale nie skonfigurowano listy modeli rezerwowych, OpenClaw przekazuje jawne puste nadpisanie modeli rezerwowych, aby główny model agenta nie został dołączony jako ukryte miejsce docelowe ponownej próby.
- Kontrole wstępne lokalnego dostawcy sprawdzają skonfigurowane modele rezerwowe przed oznaczeniem uruchomienia Cron jako `skipped`.

`openclaw doctor` zgłasza zadania, które mają już ustawione `payload.model`, wraz z liczbą przestrzeni nazw dostawców i niezgodnościami względem `agents.defaults.model`. Użyj tej kontroli, gdy zachowanie uwierzytelniania, dostawcy lub rozliczeń różni się między czatem na żywo a zaplanowanymi zadaniami.

### Kolejność wyboru modelu izolowanego zadania cron

Izolowane zadanie cron wyznacza aktywny model w następującej kolejności:

1. Nadpisanie hooka Gmail.
2. `--model` dla danego zadania.
3. Zapisane nadpisanie modelu sesji Cron (jeśli użytkownik je wybrał).
4. Model agenta lub domyślny wybór modelu.

### Tryb szybki

Tryb szybki izolowanego zadania Cron jest zgodny z wyznaczonym wyborem aktywnego modelu. Ustawienie modelu `params.fastMode` jest stosowane domyślnie, ale zapisane nadpisanie sesji `fastMode` nadal ma pierwszeństwo przed konfiguracją. Gdy wyznaczony tryb ma wartość `auto`, próg używa wartości `params.fastAutoOnSeconds` wybranego modelu, domyślnie 60 sekund.

### Ponowne próby po zmianie modelu na żywo

Jeśli izolowane uruchomienie zgłosi wyjątek `LiveSessionModelSwitchError`, Cron przed ponowną próbą zapisuje przełączonego dostawcę i model oraz nadpisanie przełączonego profilu uwierzytelniania, jeśli je podano, dla aktywnego uruchomienia. Zewnętrzna pętla ponownych prób jest ograniczona do dwóch prób po zmianie modelu następujących po pierwszej próbie, a następnie zostaje przerwana, aby uniknąć nieskończonej pętli.

## Dane wyjściowe uruchomienia i odmowy

### Pomijanie nieaktualnych potwierdzeń

Izolowane tury Cron pomijają nieaktualne odpowiedzi zawierające wyłącznie potwierdzenie. Jeśli pierwszy wynik jest jedynie tymczasową aktualizacją stanu, a żadne potomne uruchomienie podagenta nie odpowiada za ostateczną odpowiedź, Cron jeden raz ponawia prompt z prośbą o właściwy wynik przed jego dostarczeniem.

### Pomijanie tokenu wyciszenia

Jeśli izolowane uruchomienie Cron zwróci wyłącznie token wyciszenia (`NO_REPLY` lub `no_reply`), Cron pomija zarówno bezpośrednie dostarczenie wychodzące, jak i awaryjną ścieżkę kolejkowanego podsumowania, więc nic nie zostaje opublikowane na czacie.

### Ustrukturyzowane odmowy

Izolowane uruchomienia Cron używają ustrukturyzowanych metadanych odmowy wykonania z osadzonego uruchomienia (krytycznych błędów narzędzia wykonawczego o kodzie `SYSTEM_RUN_DENIED` lub `INVALID_REQUEST`) jako wiążącego sygnału odmowy. Uwzględniają również opakowania hosta Node `UNAVAILABLE` wokół zagnieżdżonego ustrukturyzowanego błędu zawierającego jeden z tych kodów.

Cron nie klasyfikuje treści tekstowej końcowego wyniku ani sformułowań odmowy przypominających prośbę o zatwierdzenie jako odmów, chyba że osadzone uruchomienie udostępnia również ustrukturyzowane metadane odmowy. Dzięki temu zwykły tekst asystenta nie jest traktowany jako zablokowane polecenie.

`cron list` i historia uruchomień pokazują przyczynę odmowy zamiast zgłaszać zablokowane polecenie jako `ok`.

## Przechowywanie

Przechowywanie i czyszczenie są kontrolowane w konfiguracji:

- `cron.sessionRetention` (domyślnie `24h` lub `false`, aby wyłączyć) usuwa zakończone sesje izolowanych uruchomień.
- `cron.runLog.keepLines` (domyślnie `2000`) ogranicza liczbę zachowanych wierszy historii uruchomień SQLite dla każdego zadania. `cron.runLog.maxBytes` (domyślnie `2000000`) pozostaje obsługiwane dla zgodności ze starszymi dziennikami uruchomień przechowywanymi w plikach; czyszczenie SQLite opiera się na liczbie wierszy.

## Migrowanie starszych zadań

<Note>
Jeśli masz zadania Cron pochodzące sprzed wprowadzenia bieżącego formatu dostarczania i przechowywania, uruchom `openclaw doctor --fix`. Doctor normalizuje starsze pola Cron (`jobId`, `schedule.cron`, pola dostarczania najwyższego poziomu, w tym starsze `threadId`, oraz aliasy dostarczania `provider` w ładunku) i migruje zadania awaryjnego Webhooka z `notify: true` z `cron.webhook` do jawnego dostarczania przez Webhook. Zadania, które już wysyłają powiadomienia na czat, zachowują ten sposób dostarczania i otrzymują docelowy Webhook ukończenia. Gdy `cron.webhook` nie jest ustawione, nieaktywny znacznik najwyższego poziomu `notify` jest usuwany z zadań bez celu migracji (istniejący sposób dostarczania pozostaje niezmieniony), dzięki czemu `doctor --fix` nie wyświetla już wielokrotnie ostrzeżeń na ich temat.
</Note>

## Typowe modyfikacje

Zaktualizuj ustawienia dostarczania bez zmieniania wiadomości:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Wyłącz dostarczanie dla izolowanego zadania:

```bash
openclaw cron edit <job-id> --no-deliver
```

Włącz uproszczony kontekst inicjalizacji dla izolowanego zadania:

```bash
openclaw cron edit <job-id> --light-context
```

Wyślij powiadomienie do określonego kanału:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Wyślij powiadomienie do tematu na forum Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Utwórz izolowane zadanie z uproszczonym kontekstem inicjalizacji:

```bash
openclaw cron create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Lightweight morning brief" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` dotyczy wyłącznie izolowanych zadań tur agenta. W przypadku uruchomień Cron tryb uproszczony pozostawia kontekst inicjalizacji pusty zamiast wstrzykiwać pełny zestaw inicjalizacyjny obszaru roboczego.

Utwórz zadanie polecenia z dokładnie określonymi wartościami argv, cwd, env i stdin oraz limitami wyniku:

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

`openclaw cron list` domyślnie pokazuje wszystkie pasujące zadania. Przekaż `--agent <id>`, aby wyświetlić tylko zadania, których efektywny znormalizowany identyfikator agenta jest zgodny; zadania bez zapisanego identyfikatora agenta są przypisywane do skonfigurowanego agenta domyślnego.

`openclaw cron get <job-id>` zwraca bezpośrednio zapisany kod JSON zadania. Użyj `cron show <job-id>`, jeśli potrzebujesz czytelnego dla człowieka widoku z podglądem trasy dostarczania.

`cron list --json` i `cron show <job-id> --json` zawierają dla każdego zadania pole najwyższego poziomu `status`, obliczane na podstawie `enabled`, `state.runningAtMs` i `state.lastRunStatus`. Wartości: `disabled`, `running`, `ok`, `error`, `skipped` lub `idle`. Status JSON pozostaje kanoniczny i nieozdobiony, aby zewnętrzne narzędzia mogły odczytać stan zadania bez ponownego wyznaczania go; wynik przeznaczony dla człowieka może uzupełniać powtarzające się statusy `error` o liczbę niepowodzeń.

Wpisy `cron runs` zawierają informacje diagnostyczne dostarczania: zamierzony cel Cron, rozwiązany cel, wysyłki narzędzia wiadomości, użycie mechanizmu awaryjnego oraz stan dostarczenia.

Zmiana przypisania agenta i sesji:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` wyświetla ostrzeżenie, gdy w zadaniach tur agenta pominięto `--agent`, i używa agenta domyślnego (`main`). Przekaż `--agent <id>` podczas tworzenia, aby przypisać konkretnego agenta.

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
