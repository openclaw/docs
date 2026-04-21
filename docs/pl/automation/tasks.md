---
read_when:
    - Sprawdzanie zadań w tle będących w toku lub niedawno ukończonych
    - Debugowanie niepowodzeń dostarczania dla odłączonych uruchomień agentów
    - Zrozumienie, jak uruchomienia w tle są powiązane z sesjami, Cron i Heartbeat
summary: Śledzenie zadań w tle dla uruchomień ACP, subagentów, izolowanych zadań Cron oraz operacji CLI
title: Zadania w tle
x-i18n:
    generated_at: "2026-04-21T19:20:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: a4cd666b3eaffde8df0b5e1533eb337e44a0824824af6f8a240f18a89f71b402
    source_path: automation/tasks.md
    workflow: 15
---

# Zadania w tle

> **Szukasz harmonogramowania?** Zobacz [Automatyzacja i zadania](/pl/automation), aby wybrać właściwy mechanizm. Ta strona opisuje **śledzenie** pracy w tle, a nie jej planowanie.

Zadania w tle śledzą pracę uruchamianą **poza główną sesją rozmowy**:
uruchomienia ACP, uruchomienia subagentów, izolowane wykonania zadań Cron oraz operacje inicjowane przez CLI.

Zadania **nie** zastępują sesji, zadań Cron ani Heartbeat — są **rejestrem aktywności**, który zapisuje, jaka odłączona praca miała miejsce, kiedy się odbyła i czy zakończyła się powodzeniem.

<Note>
Nie każde uruchomienie agenta tworzy zadanie. Tury Heartbeat i zwykły interaktywny czat tego nie robią. Wszystkie wykonania Cron, uruchomienia ACP, uruchomienia subagentów i polecenia agenta z CLI — tak.
</Note>

## W skrócie

- Zadania to **rekordy**, a nie planery — Cron i Heartbeat decydują, _kiedy_ praca ma się uruchomić, a zadania śledzą, _co się wydarzyło_.
- ACP, subagenci, wszystkie zadania Cron i operacje CLI tworzą zadania. Tury Heartbeat nie.
- Każde zadanie przechodzi przez `queued → running → terminal` (succeeded, failed, timed_out, cancelled lub lost).
- Zadania Cron pozostają aktywne, dopóki środowisko wykonawcze Cron nadal jest właścicielem zadania; zadania CLI oparte na czacie pozostają aktywne tylko tak długo, jak aktywny jest ich kontekst uruchomienia.
- Zakończenie jest sterowane zdarzeniami push: odłączona praca może powiadomić bezpośrednio lub wybudzić
  sesję żądającą/Heartbeat po zakończeniu, więc pętle odpytywania statusu
  zwykle nie są właściwym podejściem.
- Izolowane uruchomienia Cron i zakończenia subagentów w miarę możliwości czyszczą śledzone karty/przetwarzania przeglądarki dla sesji potomnej przed końcową ewidencją czyszczenia.
- Dostarczanie dla izolowanego Cron tłumi nieaktualne odpowiedzi pośrednie rodzica, gdy
  praca potomnych subagentów nadal się opróżnia, i preferuje końcowy wynik potomny,
  jeśli dotrze on przed dostarczeniem.
- Powiadomienia o zakończeniu są dostarczane bezpośrednio do kanału lub kolejkowane do następnego Heartbeat.
- `openclaw tasks list` pokazuje wszystkie zadania; `openclaw tasks audit` ujawnia problemy.
- Rekordy końcowe są przechowywane przez 7 dni, a następnie automatycznie usuwane.

## Szybki start

```bash
# Wyświetl wszystkie zadania (od najnowszych)
openclaw tasks list

# Filtruj według środowiska wykonawczego lub statusu
openclaw tasks list --runtime acp
openclaw tasks list --status running

# Pokaż szczegóły konkretnego zadania (według ID, ID uruchomienia lub klucza sesji)
openclaw tasks show <lookup>

# Anuluj uruchomione zadanie (kończy sesję potomną)
openclaw tasks cancel <lookup>

# Zmień politykę powiadomień dla zadania
openclaw tasks notify <lookup> state_changes

# Uruchom audyt kondycji
openclaw tasks audit

# Wyświetl podgląd lub zastosuj konserwację
openclaw tasks maintenance
openclaw tasks maintenance --apply

# Sprawdź stan TaskFlow
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## Co tworzy zadanie

| Źródło                 | Typ środowiska wykonawczego | Kiedy tworzony jest rekord zadania                    | Domyślna polityka powiadomień |
| ---------------------- | --------------------------- | ----------------------------------------------------- | ----------------------------- |
| Uruchomienia ACP w tle | `acp`                       | Utworzenie potomnej sesji ACP                         | `done_only`                   |
| Orkiestracja subagentów | `subagent`                 | Utworzenie subagenta przez `sessions_spawn`           | `done_only`                   |
| Zadania Cron (wszystkie typy) | `cron`              | Każde wykonanie Cron (sesja główna i izolowana)       | `silent`                      |
| Operacje CLI           | `cli`                       | Polecenia `openclaw agent`, które działają przez Gateway | `silent`                   |
| Zadania multimedialne agenta | `cli`                 | Uruchomienia `video_generate` oparte na sesji         | `silent`                      |

Zadania Cron w sesji głównej domyślnie używają polityki powiadomień `silent` — tworzą rekordy do śledzenia, ale nie generują powiadomień. Izolowane zadania Cron również domyślnie używają `silent`, ale są bardziej widoczne, ponieważ działają we własnej sesji.

Uruchomienia `video_generate` oparte na sesji również używają domyślnie polityki powiadomień `silent`. Nadal tworzą rekordy zadań, ale zakończenie jest przekazywane z powrotem do oryginalnej sesji agenta jako wewnętrzne wybudzenie, aby agent mógł sam napisać wiadomość uzupełniającą i dołączyć gotowy film. Jeśli włączysz `tools.media.asyncCompletion.directSend`, asynchroniczne zakończenia `music_generate` i `video_generate` najpierw próbują bezpośredniego dostarczenia do kanału, zanim wrócą do ścieżki wybudzenia sesji żądającej.

Dopóki zadanie `video_generate` oparte na sesji jest nadal aktywne, narzędzie działa też jako zabezpieczenie: powtórne wywołania `video_generate` w tej samej sesji zwracają status aktywnego zadania zamiast uruchamiać drugie współbieżne generowanie. Użyj `action: "status"`, jeśli chcesz jawnego sprawdzenia postępu/statusu po stronie agenta.

**Czego nie tworzy zadań:**

- Tury Heartbeat — sesja główna; zobacz [Heartbeat](/pl/gateway/heartbeat)
- Zwykłe interaktywne tury czatu
- Bezpośrednie odpowiedzi `/command`

## Cykl życia zadania

```mermaid
stateDiagram-v2
    [*] --> queued
    queued --> running : agent starts
    running --> succeeded : completes ok
    running --> failed : error
    running --> timed_out : timeout exceeded
    running --> cancelled : operator cancels
    queued --> lost : session gone > 5 min
    running --> lost : session gone > 5 min
```

| Status      | Co oznacza                                                                |
| ----------- | ------------------------------------------------------------------------- |
| `queued`    | Utworzone, oczekuje na uruchomienie przez agenta                          |
| `running`   | Tura agenta jest aktywnie wykonywana                                      |
| `succeeded` | Zakończone pomyślnie                                                      |
| `failed`    | Zakończone błędem                                                         |
| `timed_out` | Przekroczono skonfigurowany limit czasu                                   |
| `cancelled` | Zatrzymane przez operatora przez `openclaw tasks cancel`                  |
| `lost`      | Środowisko wykonawcze utraciło autorytatywny stan zaplecza po 5-minutowym okresie karencji |

Przejścia następują automatycznie — gdy powiązane uruchomienie agenta się kończy, status zadania jest aktualizowany odpowiednio do wyniku.

`lost` zależy od środowiska wykonawczego:

- Zadania ACP: zniknęły metadane potomnej sesji ACP w zapleczu.
- Zadania subagentów: potomna sesja zniknęła z docelowego magazynu agentów.
- Zadania Cron: środowisko wykonawcze Cron nie śledzi już zadania jako aktywnego.
- Zadania CLI: izolowane zadania potomnej sesji używają potomnej sesji; zadania CLI oparte na czacie używają zamiast tego aktywnego kontekstu uruchomienia, więc zalegające wiersze sesji kanału/grupy/bezpośredniej nie utrzymują ich przy życiu.

## Dostarczanie i powiadomienia

Gdy zadanie osiąga stan końcowy, OpenClaw Cię powiadamia. Istnieją dwie ścieżki dostarczania:

**Dostarczenie bezpośrednie** — jeśli zadanie ma cel kanałowy (`requesterOrigin`), wiadomość o zakończeniu trafia bezpośrednio do tego kanału (Telegram, Discord, Slack itd.). W przypadku zakończeń subagentów OpenClaw zachowuje również powiązane kierowanie wątkiem/tematem, gdy jest dostępne, i może uzupełnić brakujące `to` / konto z zapisanej trasy sesji żądającej (`lastChannel` / `lastTo` / `lastAccountId`), zanim zrezygnuje z bezpośredniego dostarczenia.

**Dostarczenie kolejkowane do sesji** — jeśli bezpośrednie dostarczenie się nie powiedzie lub nie ustawiono origin, aktualizacja jest kolejkowana jako zdarzenie systemowe w sesji żądającej i pojawia się przy następnym Heartbeat.

<Tip>
Zakończenie zadania wyzwala natychmiastowe wybudzenie Heartbeat, dzięki czemu szybko widzisz wynik — nie musisz czekać na następny zaplanowany takt Heartbeat.
</Tip>

Oznacza to, że typowy przepływ pracy jest oparty na push: uruchom odłączoną pracę raz, a potem
pozwól środowisku wykonawczemu wybudzić Cię lub powiadomić po zakończeniu. Odpytuj stan zadania tylko wtedy, gdy
potrzebujesz debugowania, interwencji lub jawnego audytu.

### Polityki powiadomień

Kontroluj, ile informacji otrzymujesz o każdym zadaniu:

| Polityka              | Co jest dostarczane                                                      |
| --------------------- | ------------------------------------------------------------------------ |
| `done_only` (domyślna) | Tylko stan końcowy (succeeded, failed itd.) — **to jest wartość domyślna** |
| `state_changes`       | Każda zmiana stanu i aktualizacja postępu                                |
| `silent`              | Nic                                                                      |

Zmień politykę, gdy zadanie jest uruchomione:

```bash
openclaw tasks notify <lookup> state_changes
```

## Dokumentacja CLI

### `tasks list`

```bash
openclaw tasks list [--runtime <acp|subagent|cron|cli>] [--status <status>] [--json]
```

Kolumny wyjściowe: ID zadania, rodzaj, status, dostarczanie, ID uruchomienia, sesja potomna, podsumowanie.

### `tasks show`

```bash
openclaw tasks show <lookup>
```

Token lookup akceptuje ID zadania, ID uruchomienia lub klucz sesji. Pokazuje pełny rekord, w tym czasy, stan dostarczania, błąd i końcowe podsumowanie.

### `tasks cancel`

```bash
openclaw tasks cancel <lookup>
```

W przypadku zadań ACP i subagentów kończy to sesję potomną. W przypadku zadań śledzonych przez CLI anulowanie jest rejestrowane w rejestrze zadań (nie ma osobnego uchwytu potomnego środowiska wykonawczego). Status przechodzi do `cancelled`, a jeśli ma to zastosowanie, wysyłane jest powiadomienie o dostarczeniu.

### `tasks notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

### `tasks audit`

```bash
openclaw tasks audit [--json]
```

Ujawnia problemy operacyjne. Wykryte problemy pojawiają się również w `openclaw status`.

| Ustalenie                 | Poziom ważności | Wyzwalacz                                            |
| ------------------------- | --------------- | ---------------------------------------------------- |
| `stale_queued`            | warn            | Oczekiwanie przez ponad 10 minut                     |
| `stale_running`           | error           | Uruchomione przez ponad 30 minut                     |
| `lost`                    | error           | Zniknęła własność zadania oparta na środowisku wykonawczym |
| `delivery_failed`         | warn            | Dostarczenie nie powiodło się, a polityka powiadomień nie jest `silent` |
| `missing_cleanup`         | warn            | Zadanie końcowe bez sygnatury czasowej czyszczenia   |
| `inconsistent_timestamps` | warn            | Naruszenie osi czasu (na przykład zakończenie przed rozpoczęciem) |

### `tasks maintenance`

```bash
openclaw tasks maintenance [--json]
openclaw tasks maintenance --apply [--json]
```

Użyj tego, aby wyświetlić podgląd lub zastosować uzgadnianie, oznaczanie czyszczenia i przycinanie dla
zadań oraz stanu Task Flow.

Uzgadnianie zależy od środowiska wykonawczego:

- Zadania ACP/subagentów sprawdzają swoją potomną sesję zaplecza.
- Zadania Cron sprawdzają, czy środowisko wykonawcze Cron nadal jest właścicielem zadania.
- Zadania CLI oparte na czacie sprawdzają aktywny kontekst uruchomienia będący właścicielem, a nie tylko wiersz sesji czatu.

Czyszczenie po zakończeniu również zależy od środowiska wykonawczego:

- Zakończenie subagenta w miarę możliwości zamyka śledzone karty/procesy przeglądarki dla sesji potomnej, zanim będzie kontynuowane czyszczenie po ogłoszeniu.
- Zakończenie izolowanego Cron w miarę możliwości zamyka śledzone karty/procesy przeglądarki dla sesji Cron, zanim uruchomienie zostanie całkowicie zamknięte.
- Dostarczanie dla izolowanego Cron w razie potrzeby czeka na dalsze działania potomnych subagentów
  i tłumi nieaktualny tekst potwierdzenia rodzica zamiast go ogłaszać.
- Dostarczanie zakończenia subagenta preferuje najnowszy widoczny tekst asystenta; jeśli jest pusty, wraca do oczyszczonego najnowszego tekstu tool/toolResult, a uruchomienia zawierające wyłącznie wywołania narzędzia zakończone limitem czasu mogą zostać zredukowane do krótkiego podsumowania częściowego postępu. Końcowe nieudane uruchomienia ogłaszają status niepowodzenia bez odtwarzania przechwyconego tekstu odpowiedzi.
- Błędy czyszczenia nie maskują rzeczywistego wyniku zadania.

### `tasks flow list|show|cancel`

```bash
openclaw tasks flow list [--status <status>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Używaj tych poleceń, gdy interesuje Cię orkiestrujący TaskFlow, a nie
pojedynczy rekord zadania w tle.

## Tablica zadań czatu (`/tasks`)

Użyj `/tasks` w dowolnej sesji czatu, aby zobaczyć zadania w tle powiązane z tą sesją. Tablica pokazuje
aktywne i niedawno zakończone zadania wraz ze środowiskiem wykonawczym, statusem, czasem oraz szczegółami postępu lub błędu.

Gdy bieżąca sesja nie ma widocznych powiązanych zadań, `/tasks` przełącza się na lokalne dla agenta liczniki zadań,
dzięki czemu nadal otrzymujesz przegląd bez ujawniania szczegółów innych sesji.

Aby zobaczyć pełny rejestr operatora, użyj CLI: `openclaw tasks list`.

## Integracja statusu (obciążenie zadaniami)

`openclaw status` zawiera krótkie podsumowanie zadań:

```
Tasks: 3 queued · 2 running · 1 issues
```

Podsumowanie raportuje:

- **active** — liczba `queued` + `running`
- **failures** — liczba `failed` + `timed_out` + `lost`
- **byRuntime** — podział według `acp`, `subagent`, `cron`, `cli`

Zarówno `/status`, jak i narzędzie `session_status` używają uwzględniającej czyszczenie migawki zadań: aktywne zadania są
preferowane, nieaktualne ukończone wiersze są ukrywane, a niedawne niepowodzenia są pokazywane tylko wtedy, gdy nie
pozostała żadna aktywna praca. Dzięki temu karta statusu skupia się na tym, co ma znaczenie teraz.

## Przechowywanie i konserwacja

### Gdzie przechowywane są zadania

Rekordy zadań są trwale zapisywane w SQLite pod adresem:

```
$OPENCLAW_STATE_DIR/tasks/runs.sqlite
```

Rejestr jest ładowany do pamięci przy starcie Gateway i synchronizuje zapisy do SQLite, aby zapewnić trwałość po restartach.

### Automatyczna konserwacja

Co **60 sekund** uruchamiany jest proces czyszczący, który obsługuje trzy rzeczy:

1. **Uzgadnianie** — sprawdza, czy aktywne zadania nadal mają autorytatywne zaplecze środowiska wykonawczego. Zadania ACP/subagentów używają stanu sesji potomnej, zadania Cron używają własności aktywnego zadania, a zadania CLI oparte na czacie używają kontekstu uruchomienia będącego właścicielem. Jeśli ten stan zaplecza zniknie na ponad 5 minut, zadanie zostanie oznaczone jako `lost`.
2. **Oznaczanie czyszczenia** — ustawia znacznik czasu `cleanupAfter` dla zadań końcowych (`endedAt` + 7 dni).
3. **Przycinanie** — usuwa rekordy po dacie `cleanupAfter`.

**Retencja**: rekordy zadań końcowych są przechowywane przez **7 dni**, a następnie automatycznie przycinane. Nie jest wymagana żadna konfiguracja.

## Jak zadania odnoszą się do innych systemów

### Zadania i Task Flow

[Task Flow](/pl/automation/taskflow) to warstwa orkiestracji przepływów ponad zadaniami w tle. Pojedynczy przepływ może w ciągu swojego życia koordynować wiele zadań, używając zarządzanych lub lustrzanych trybów synchronizacji. Użyj `openclaw tasks`, aby sprawdzić poszczególne rekordy zadań, oraz `openclaw tasks flow`, aby sprawdzić przepływ orkiestrujący.

Szczegóły znajdziesz w [Task Flow](/pl/automation/taskflow).

### Zadania i Cron

**Definicja** zadania Cron znajduje się w `~/.openclaw/cron/jobs.json`; stan wykonania środowiska uruchomieniowego znajduje się obok w `~/.openclaw/cron/jobs-state.json`. **Każde** wykonanie Cron tworzy rekord zadania — zarówno w sesji głównej, jak i izolowane. Zadania Cron w sesji głównej domyślnie używają polityki powiadomień `silent`, dzięki czemu są śledzone bez generowania powiadomień.

Zobacz [Zadania Cron](/pl/automation/cron-jobs).

### Zadania i Heartbeat

Uruchomienia Heartbeat to tury sesji głównej — nie tworzą rekordów zadań. Gdy zadanie się zakończy, może wywołać wybudzenie Heartbeat, aby szybko pokazać wynik.

Zobacz [Heartbeat](/pl/gateway/heartbeat).

### Zadania i sesje

Zadanie może odwoływać się do `childSessionKey` (gdzie uruchamiana jest praca) oraz `requesterSessionKey` (kto ją uruchomił). Sesje to kontekst rozmowy; zadania to warstwa śledzenia aktywności ponad nim.

### Zadania i uruchomienia agentów

`runId` zadania łączy je z uruchomieniem agenta wykonującym pracę. Zdarzenia cyklu życia agenta (start, koniec, błąd) automatycznie aktualizują status zadania — nie musisz ręcznie zarządzać cyklem życia.

## Powiązane

- [Automatyzacja i zadania](/pl/automation) — przegląd wszystkich mechanizmów automatyzacji
- [Task Flow](/pl/automation/taskflow) — orkiestracja przepływów ponad zadaniami
- [Zaplanowane zadania](/pl/automation/cron-jobs) — planowanie pracy w tle
- [Heartbeat](/pl/gateway/heartbeat) — okresowe tury sesji głównej
- [CLI: Tasks](/cli/index#tasks) — dokumentacja poleceń CLI
