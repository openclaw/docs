---
read_when:
    - Potrzebujesz zaplanowanych zadań i wybudzeń
    - Debugowanie wykonywania zadań Cron i dzienników
summary: Dokumentacja CLI dla `openclaw cron` (planowanie i uruchamianie zadań w tle)
title: Cron
x-i18n:
    generated_at: "2026-07-16T18:10:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: eb897fde0798563144703cd2f3a2bc6c20229aa4135af9c6db41995e66ffd2d1
    source_path: cli/cron.md
    workflow: 16
---

# `openclaw cron`

Zarządzanie zadaniami Cron harmonogramu Gateway.

<Tip>
Uruchom `openclaw cron --help`, aby wyświetlić wszystkie dostępne polecenia. Przewodnik koncepcyjny znajduje się w sekcji [Zadania Cron](/pl/automation/cron-jobs).
</Tip>

<Note>
Wszystkie modyfikacje Cron (`add`/`create`, `update`/`edit`, `remove`, `run`) wymagają `operator.admin`. Uruchomienia z ładunkiem polecenia są wykonywane bezpośrednio w procesie Gateway, a nie jako wywołanie narzędzia `tools.exec` agenta; `tools.exec.*` i zatwierdzenia wykonywania nadal kontrolują narzędzia wykonywania widoczne dla modelu.
</Note>

## Szybkie tworzenie zadań

`openclaw cron create` jest aliasem `openclaw cron add`. W przypadku nowych zadań należy najpierw podać harmonogram, a następnie prompt:

```bash
openclaw cron create "0 7 * * *" \
  "Podsumuj aktualizacje z nocy." \
  --name "Poranny skrót" \
  --agent ops
```

Należy użyć `--webhook <url>`, gdy zadanie powinno wysłać gotowy ładunek metodą POST zamiast dostarczyć go do docelowego czatu:

```bash
openclaw cron create "0 18 * * 1-5" \
  "Podsumuj dzisiejsze wdrożenia w formacie JSON." \
  --name "Podsumowanie wdrożeń" \
  --webhook "https://example.invalid/openclaw/cron"
```

Należy użyć `--command` w przypadku deterministycznych zadań w stylu powłoki, które działają wewnątrz Cron OpenClaw bez uruchamiania izolowanego przebiegu agenta/modelu:

```bash
openclaw cron create "*/15 * * * *" \
  --name "Sonda głębokości kolejki" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` przechowuje `argv: ["sh", "-lc", <shell>]`. Do dokładnego wykonywania argv należy użyć `--command-argv '["node","scripts/report.mjs"]'`. Zadania poleceń przechwytują stdout/stderr, zapisują standardową historię Cron i kierują dane wyjściowe za pomocą tych samych trybów dostarczania `announce`, `webhook` lub `none` co zadania izolowane. Polecenie, które wypisuje wyłącznie `NO_REPLY`, jest pomijane.

## Sesje

`--session` przyjmuje `main`, `isolated`, `current` lub `session:<id>`.

<AccordionGroup>
  <Accordion title="Klucze sesji">
    - `main` wiąże zadanie z główną sesją agenta.
    - `isolated` tworzy nowy transkrypt i identyfikator sesji dla każdego uruchomienia.
    - `current` wiąże zadanie z sesją aktywną w chwili jego utworzenia.
    - `session:<id>` przypina zadanie do jawnego, trwałego klucza sesji.

  </Accordion>
  <Accordion title="Semantyka sesji izolowanej">
    Izolowane uruchomienia resetują kontekst otaczającej konwersacji. Dla nowego uruchomienia resetowane są kierowanie do kanału i grupy, zasady wysyłania i kolejkowania, podwyższenie uprawnień, źródło oraz powiązanie ze środowiskiem wykonawczym ACP. Bezpieczne preferencje oraz jawnie wybrane przez użytkownika nadpisania modelu lub uwierzytelniania mogą być przenoszone między uruchomieniami.
  </Accordion>
</AccordionGroup>

## Dostarczanie

`openclaw cron list` i `openclaw cron show <job-id>` wyświetlają podgląd wyznaczonej trasy dostarczania. W przypadku `channel: "last"` podgląd wskazuje, czy trasa została wyznaczona na podstawie sesji głównej lub bieżącej, czy też zakończy się bezpiecznym niepowodzeniem.

Cele z prefiksem dostawcy mogą rozstrzygać niejednoznaczność nierozpoznanych kanałów ogłoszeń. Na przykład `to: "telegram:123"` wybiera Telegram, gdy `delivery.channel` pominięto lub ustawiono na `last`. Selektorami dostawców są wyłącznie prefiksy udostępniane przez załadowany Plugin. Jeśli `delivery.channel` podano jawnie, prefiks musi odpowiadać temu kanałowi; `channel: "whatsapp"` z `to: "telegram:123"` zostanie odrzucone. Prefiksy usług, takie jak `imessage:` i `sms:`, pozostają składnią celu należącą do kanału.

<Note>
Izolowane zadania `cron add` domyślnie korzystają z dostarczania `--announce`. Aby zachować dane wyjściowe wewnętrznie, należy użyć `--no-deliver`. `--deliver` pozostaje przestarzałym aliasem `--announce`.
</Note>

### Odpowiedzialność za dostarczanie

Za dostarczanie izolowanych wiadomości czatu Cron wspólnie odpowiadają agent i mechanizm uruchamiający:

- Agent może wysyłać bezpośrednio za pomocą narzędzia `message`, gdy dostępna jest trasa czatu.
- `announce` awaryjnie dostarcza końcową odpowiedź tylko wtedy, gdy agent nie wysłał jej bezpośrednio do wyznaczonego celu.
- `webhook` wysyła gotowy ładunek pod adres URL.
- `none` wyłącza awaryjne dostarczanie przez mechanizm uruchamiający.

Do ustawienia dostarczania przez Webhook należy użyć `cron add|create --webhook <url>` lub `cron edit <job-id> --webhook <url>`. Nie należy łączyć `--webhook` z flagami dostarczania do czatu, takimi jak `--announce`, `--no-deliver`, `--channel`, `--to`, `--thread-id` lub `--account`.

`cron edit <job-id>` może usuwać wartości poszczególnych pól kierowania dostarczaniem za pomocą `--clear-channel`, `--clear-to`, `--clear-thread-id` i `--clear-account` (każde z nich zostanie odrzucone w połączeniu z odpowiadającą mu flagą ustawiającą). W przeciwieństwie do `--no-deliver`, które jedynie wyłącza awaryjne dostarczanie przez mechanizm uruchamiający, opcje te usuwają zapisane pole, dzięki czemu zadanie ponownie wyznacza tę część trasy na podstawie wartości domyślnych.

`--announce` oznacza awaryjne dostarczanie końcowej odpowiedzi przez mechanizm uruchamiający. `--no-deliver` wyłącza to dostarczanie awaryjne, ale nie usuwa narzędzia `message` agenta, gdy dostępna jest trasa czatu.

Przypomnienia utworzone z aktywnego czatu zachowują aktywny cel dostarczania czatu na potrzeby awaryjnego dostarczania ogłoszeń. Wewnętrzne klucze sesji mogą zawierać małe litery; nie należy traktować ich jako źródła prawdy dla identyfikatorów dostawców uwzględniających wielkość liter, takich jak identyfikatory pokojów Matrix.

### Dostarczanie powiadomień o błędach

Powiadomienia o błędach są wyznaczane w następującej kolejności:

1. `delivery.failureDestination` w zadaniu.
2. Globalne `cron.failureDestination`.
3. Główny cel ogłoszeń zadania (gdy żadna z powyższych opcji nie wskazuje konkretnego miejsca docelowego).

<Note>
Zadania sesji głównej mogą używać `delivery.failureDestination` tylko wtedy, gdy podstawowym trybem dostarczania jest `webhook`. Zadania izolowane akceptują tę opcję we wszystkich trybach.
</Note>

Izolowane uruchomienia Cron traktują błędy agenta na poziomie uruchomienia jako błędy zadania, nawet jeśli nie powstanie ładunek odpowiedzi, dzięki czemu błędy modelu lub dostawcy nadal zwiększają liczniki błędów i wyzwalają powiadomienia o błędach.

Zadania poleceń Cron nie rozpoczynają izolowanej tury agenta. Kod wyjścia równy zero zapisuje `ok`; niezerowy kod wyjścia, sygnał, przekroczenie limitu czasu lub przekroczenie limitu czasu braku danych wyjściowych zapisuje `error` i może wyzwolić tę samą ścieżkę powiadomień o błędach.

Jeśli izolowane uruchomienie przekroczy limit czasu przed pierwszym żądaniem do modelu, `openclaw cron show` i `openclaw cron runs` zawierają błąd właściwy dla fazy, taki jak `setup timed out before runner start`, lub komunikat o zastoju wskazujący ostatnią znaną fazę uruchamiania (na przykład `context-engine`). W przypadku dostawców opartych na CLI mechanizm nadzorujący etap poprzedzający model pozostaje aktywny do rozpoczęcia zewnętrznej tury CLI, dlatego zastoje podczas wyszukiwania sesji, obsługi hooka, uwierzytelniania, przygotowywania promptu i konfiguracji CLI są zgłaszane jako błędy Cron poprzedzające użycie modelu.

## Planowanie

### Zadania jednorazowe

`--at <datetime>` planuje jednorazowe uruchomienie. Daty i godziny bez przesunięcia są traktowane jako UTC, chyba że przekazano również `--tz <iana>`, które interpretuje czas zegarowy w podanej strefie czasowej.

<Note>
Zadania jednorazowe są domyślnie usuwane po pomyślnym wykonaniu. Aby je zachować, należy użyć `--keep-after-run`.
</Note>

### Zadania cykliczne

Po kolejnych błędach zadania cykliczne używają wykładniczego opóźnienia ponownych prób: 30s, 1m, 5m, 15m, 60m. Harmonogram powraca do normalnego działania po następnym pomyślnym uruchomieniu.

Pominięte uruchomienia są śledzone oddzielnie od błędów wykonywania. Nie wpływają na opóźnienie ponownych prób, ale `openclaw cron edit <job-id> --failure-alert-include-skipped` może włączyć powiadomienia o błędach dla powtarzających się pominiętych uruchomień.

W przypadku zadań izolowanych korzystających z lokalnego, skonfigurowanego dostawcy modelu (bazowy adres URL wskazujący interfejs loopback, sieć prywatną lub `.local`) Cron przeprowadza uproszczoną kontrolę wstępną dostawcy przed rozpoczęciem tury agenta: dostawcy `api: "ollama"` są sprawdzani pod adresem `/api/tags`; inni lokalni dostawcy zgodni z OpenAI (`api: "openai-completions"`, np. vLLM, SGLang, LM Studio) są sprawdzani pod adresem `/models`. Jeśli punkt końcowy jest nieosiągalny, uruchomienie zostaje zapisane jako `skipped` i ponowione podczas późniejszego terminu harmonogramu; wynik kontroli osiągalności jest przechowywany w pamięci podręcznej osobno dla każdego punktu końcowego przez 5 minut, aby wiele zadań korzystających z tego samego lokalnego serwera nie obciążało go powtarzającymi się testami.

Zadania Cron, oczekujący stan środowiska wykonawczego oraz historia uruchomień znajdują się we współdzielonej bazie danych stanu SQLite. Starsze pliki `jobs.json`, `<name>-state.json` i `runs/*.jsonl` są importowane jednokrotnie, a ich nazwy są zmieniane przez dodanie sufiksu `.migrated`. Po zaimportowaniu harmonogramy należy edytować za pomocą `openclaw cron add|edit|remove`, zamiast modyfikować pliki JSON.

### Uruchomienia ręczne

`openclaw cron run <job-id>` domyślnie wymusza uruchomienie i zwraca wynik natychmiast po dodaniu ręcznego uruchomienia do kolejki. Pomyślne odpowiedzi zawierają `{ ok: true, enqueued: true, runId }`. Zwróconego `runId` należy użyć do sprawdzenia późniejszego wyniku:

```bash
openclaw cron run <job-id>
openclaw cron runs --id <job-id> --run-id <run-id>
```

Należy dodać `--wait`, gdy skrypt powinien czekać, aż dokładnie to uruchomienie z kolejki zapisze stan końcowy:

```bash
openclaw cron run <job-id> --wait --wait-timeout 10m --poll-interval 2s
```

W przypadku `--wait` CLI nadal najpierw wywołuje `cron.run`, a następnie odpytuje `cron.runs` dla zwróconego `runId`. Polecenie kończy działanie z kodem `0` tylko wtedy, gdy uruchomienie zakończy się ze stanem `ok`. Kończy działanie z kodem niezerowym, gdy uruchomienie zakończy się ze stanem `error` lub `skipped`, gdy odpowiedź Gateway nie zawiera `runId` albo gdy upłynie `--wait-timeout` (domyślnie `10m`, z odpytywaniem domyślnie co `2s`). `--poll-interval` musi być większe od zera.

<Note>
Należy użyć `--due`, jeśli polecenie ręczne ma zostać uruchomione tylko wtedy, gdy aktualnie przypada termin wykonania zadania. Jeśli `--due --wait` nie doda uruchomienia do kolejki, polecenie zwraca standardową odpowiedź o braku uruchomienia zamiast rozpoczynać odpytywanie.
</Note>

## Modele

`cron add|edit --model <ref>` wybiera dozwolony model dla zadania. `cron add|edit --fallbacks <list>` ustawia modele rezerwowe dla danego zadania, na przykład `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`; aby wykonać ścisłe uruchomienie bez modeli rezerwowych, należy przekazać `--fallbacks ""`. `cron edit <job-id> --clear-fallbacks` usuwa nadpisanie modeli rezerwowych danego zadania. `cron edit <job-id> --clear-model` usuwa nadpisanie modelu danego zadania, dzięki czemu zadanie stosuje standardową kolejność wyboru modelu Cron (zapisane nadpisanie sesji Cron, jeśli istnieje, a w przeciwnym razie model agenta lub model domyślny); nie można go łączyć z `--model`. `cron add|edit --thinking <level>` ustawia nadpisanie poziomu rozumowania dla danego zadania; `cron edit <job-id> --clear-thinking` usuwa je, dzięki czemu zadanie stosuje standardową kolejność wyboru poziomu rozumowania Cron, i nie można go łączyć z `--thinking`.

<Warning>
Jeśli model nie jest dozwolony lub nie można go rozpoznać, Cron kończy uruchomienie niepowodzeniem z jawnym błędem walidacji, zamiast wracać do modelu agenta zadania lub domyślnego wyboru modelu.
</Warning>

`--model` Cron jest **modelem głównym zadania**, a nie nadpisaniem `/model` sesji czatu. Oznacza to, że:

- Skonfigurowane modele rezerwowe nadal mają zastosowanie, gdy wybrany model zadania zawiedzie.
- `fallbacks` ładunku danego zadania zastępuje skonfigurowaną listę modeli rezerwowych, jeśli jest obecne.
- Pusta lista modeli rezerwowych danego zadania (`--fallbacks ""` lub `fallbacks: []` w ładunku/API zadania) wymusza ścisłe uruchomienie Cron.
- Gdy zadanie ma `--model`, ale nie skonfigurowano listy modeli rezerwowych, OpenClaw przekazuje jawne nadpisanie pustą listą modeli rezerwowych, aby model główny agenta nie został dołączony jako ukryty cel ponownej próby.
- Kontrole wstępne lokalnego dostawcy przechodzą przez skonfigurowane modele rezerwowe, zanim oznaczą uruchomienie Cron jako `skipped`.

`openclaw doctor` zgłasza zadania, które mają już ustawione `payload.model`, w tym liczbę wystąpień przestrzeni nazw dostawców oraz niezgodności z `agents.defaults.model`. Tej kontroli należy użyć, gdy zachowanie uwierzytelniania, dostawcy lub rozliczeń różni się między aktywnym czatem a zaplanowanymi zadaniami.

### Kolejność wyboru modelu izolowanego zadania Cron

Izolowane zadanie Cron wyznacza aktywny model w następującej kolejności:

1. Nadpisanie hooka Gmail.
2. `--model` danego zadania.
3. Zapisane nadpisanie modelu sesji Cron (jeśli użytkownik wybrał model).
4. Wybór modelu agenta lub modelu domyślnego.

### Tryb szybki

Tryb szybki izolowanego Cronu jest zgodny z rozstrzygniętym wyborem aktywnego modelu. Domyślnie obowiązuje konfiguracja modelu `params.fastMode`, ale zapisane w sesji nadpisanie `fastMode` nadal ma pierwszeństwo przed konfiguracją. Gdy rozstrzygniętym trybem jest `auto`, limit czasu wykorzystuje wartość `params.fastAutoOnSeconds` wybranego modelu, domyślnie 60 sekund.

### Ponowne próby po przełączeniu aktywnego modelu

Jeśli izolowane uruchomienie zgłosi `LiveSessionModelSwitchError`, przed ponowną próbą Cron zapisuje przełączonego dostawcę i model (oraz nadpisanie przełączonego profilu uwierzytelniania, jeśli jest obecne) dla aktywnego uruchomienia. Zewnętrzna pętla ponownych prób jest ograniczona do dwóch prób przełączenia po próbie początkowej, a następnie przerywa działanie zamiast wykonywać się bez końca.

## Dane wyjściowe uruchomienia i odmowy

### Pomijanie nieaktualnych potwierdzeń

Izolowane przebiegi Cronu pomijają nieaktualne odpowiedzi zawierające wyłącznie potwierdzenie. Jeśli pierwszy wynik jest jedynie tymczasową aktualizacją stanu i żadne uruchomienie podagenta potomnego nie odpowiada za ostateczną odpowiedź, przed dostarczeniem Cron jednokrotnie ponawia monit o właściwy wynik.

### Pomijanie tokenu ciszy

Jeśli izolowane uruchomienie Cronu zwróci wyłącznie token ciszy (`NO_REPLY` lub `no_reply`), Cron pomija zarówno bezpośrednie dostarczenie wychodzące, jak i rezerwową ścieżkę podsumowania umieszczanego w kolejce, dzięki czemu nic nie zostaje wysłane z powrotem na czat.

### Ustrukturyzowane odmowy

Izolowane uruchomienia Cronu używają ustrukturyzowanych metadanych odmowy wykonania z osadzonego uruchomienia (krytycznych błędów narzędzia wykonawczego o kodzie `SYSTEM_RUN_DENIED` lub `INVALID_REQUEST`) jako rozstrzygającego sygnału odmowy. Uwzględniają również opakowania `UNAVAILABLE` hosta Node wokół zagnieżdżonego ustrukturyzowanego błędu zawierającego jeden z tych kodów.

Cron nie klasyfikuje prozy w końcowych danych wyjściowych ani zwrotów odmowy przypominających żądanie zatwierdzenia jako odmów, chyba że osadzone uruchomienie udostępnia również ustrukturyzowane metadane odmowy, dlatego zwykły tekst asystenta nie jest traktowany jako zablokowane polecenie.

`cron list` i historia uruchomień przedstawiają przyczynę odmowy zamiast zgłaszać zablokowane polecenie jako `ok`.

## Przechowywanie

Zachowanie dotyczące przechowywania:

- `cron.sessionRetention` (domyślnie `24h` lub `false`, aby wyłączyć) usuwa ukończone sesje izolowanych uruchomień.
- Historia uruchomień zachowuje najnowsze 2000 końcowych wierszy dla każdego zadania Cron. Utracone wiersze podlegają standardowemu 24-godzinnemu okresowi czyszczenia utraconych zadań.

## Migrowanie starszych zadań

<Note>
Jeśli istnieją zadania Cron utworzone przed wprowadzeniem bieżącego formatu dostarczania i przechowywania, należy uruchomić `openclaw doctor --fix`. Doctor normalizuje starsze pola Cronu (`jobId`, `schedule.cron`, pola dostarczania najwyższego poziomu, w tym starsze `threadId`, oraz aliasy dostarczania `provider` w ładunku) i migruje zadania rezerwowego Webhooka `notify: true` z `cron.webhook` do jawnego dostarczania przez Webhook. Zadania, które już wysyłają komunikaty na czat, zachowują ten sposób dostarczania i otrzymują miejsce docelowe Webhooka zakończenia. Gdy `cron.webhook` nie jest ustawione, nieaktywny znacznik najwyższego poziomu `notify` jest usuwany z zadań bez celu migracji (istniejący sposób dostarczania zostaje zachowany bez zmian), dzięki czemu `doctor --fix` nie wyświetla już wielokrotnie ostrzeżeń dotyczących tych zadań.
</Note>

## Typowe zmiany

Zaktualizuj ustawienia dostarczania bez zmiany wiadomości:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

Wyłącz dostarczanie dla izolowanego zadania:

```bash
openclaw cron edit <job-id> --no-deliver
```

Włącz uproszczony kontekst inicjalizacyjny dla izolowanego zadania:

```bash
openclaw cron edit <job-id> --light-context
```

Wyślij komunikat do określonego kanału:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

Wyślij komunikat do tematu forum Telegram:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
```

Utwórz izolowane zadanie z uproszczonym kontekstem inicjalizacyjnym:

```bash
openclaw cron create "0 7 * * *" \
  "Podsumuj aktualizacje z nocy." \
  --name "Lekkie poranne podsumowanie" \
  --session isolated \
  --light-context \
  --no-deliver
```

`--light-context` ma zastosowanie wyłącznie do izolowanych zadań przebiegu agenta. W przypadku uruchomień Cronu tryb uproszczony pozostawia kontekst inicjalizacyjny pusty zamiast wstrzykiwać pełny zestaw inicjalizacyjny obszaru roboczego.

Utwórz zadanie polecenia z dokładnie określonymi wartościami argv, cwd, env, stdin oraz limitami danych wyjściowych:

```bash
openclaw cron create "*/30 * * * *" \
  --name "Eksport pozycji" \
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

Ręczne uruchamianie i sprawdzanie:

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

`openclaw cron list` domyślnie wyświetla wszystkie pasujące zadania. Przekaż `--agent <id>`, aby wyświetlić tylko zadania, których efektywny znormalizowany identyfikator agenta jest zgodny; zadania bez zapisanego identyfikatora agenta są uznawane za przypisane do skonfigurowanego agenta domyślnego.

`openclaw cron get <job-id>` zwraca bezpośrednio zapisany kod JSON zadania. Użyj `cron show <job-id>`, aby uzyskać widok czytelny dla człowieka z podglądem trasy dostarczania.

`cron list --json` i `cron show <job-id> --json` zawierają w każdym zadaniu pole najwyższego poziomu `status`, obliczane na podstawie `enabled`, `state.runningAtMs` i `state.lastRunStatus`. Wartości: `disabled`, `running`, `ok`, `error`, `skipped` lub `idle`. Stan JSON pozostaje kanoniczny i nieozdobiony, dzięki czemu narzędzia zewnętrzne mogą odczytać stan zadania bez jego ponownego wyprowadzania; dane wyjściowe przeznaczone dla człowieka mogą uzupełniać powtarzające się stany `error` o liczbę niepowodzeń.

Wpisy `cron runs` zawierają diagnostykę dostarczania z zamierzonym celem Cronu, rozstrzygniętym celem, wysyłkami narzędzia wiadomości, użyciem mechanizmu rezerwowego i stanem dostarczenia.

Zmiana przypisania agenta i sesji:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` ostrzega, gdy w zadaniach przebiegu agenta pominięto `--agent`, i używa agenta domyślnego (`main`). Podczas tworzenia przekaż `--agent <id>`, aby przypisać określonego agenta.

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
