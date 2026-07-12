---
read_when:
    - Uruchamianie lokalnie pnpm openclaw qa matrix
    - Dodawanie lub wybieranie scenariuszy kontroli jakości Matrix
    - Klasyfikowanie błędów kontroli jakości Matrix, przekroczeń limitu czasu i zablokowanego czyszczenia
summary: 'Dokumentacja dla maintainerów dotycząca opartej na Dockerze ścieżki testów jakości na żywo dla Matrix: CLI, profile, zmienne środowiskowe, scenariusze i artefakty wyjściowe.'
title: Kontrola jakości Matrix
x-i18n:
    generated_at: "2026-07-12T15:06:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8034570f5a52619c88bee1f6708bd710744d3cb52a1eb82726aa118844045ef
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Ścieżka QA dla Matrix uruchamia dołączony Plugin `@openclaw/matrix` względem jednorazowego serwera domowego Tuwunel w Dockerze, korzystając z tymczasowych kont sterownika, testowanego systemu (SUT) i obserwatora oraz wstępnie utworzonych pokojów. Zapewnia testy rzeczywistego transportu Matrix na żywo.

Narzędzia przeznaczone wyłącznie dla opiekunów. Pakietowe wydania OpenClaw nie zawierają `qa-lab`, dlatego polecenie `openclaw qa` działa tylko z kopii roboczej kodu źródłowego, która ładuje dołączony moduł uruchamiający bezpośrednio, bez instalowania Pluginu.

Szerszy kontekst platformy QA opisano w dokumencie [Omówienie QA](/pl/concepts/qa-e2e-automation).

## Szybki start

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Zwykłe polecenie `pnpm openclaw qa matrix` uruchamia `--profile all` i nie zatrzymuje się po pierwszym niepowodzeniu. Pełny zestaw można podzielić między równoległe zadania za pomocą `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`.

## Działanie ścieżki

1. Tworzy jednorazowy serwer domowy Tuwunel w Dockerze (domyślny obraz `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nazwa serwera `matrix-qa.test`, port `28008`) za ograniczonym rejestratorem żądań i odpowiedzi, który usuwa dane wrażliwe.
2. Rejestruje trzech tymczasowych użytkowników: `driver` (wysyła ruch przychodzący), `sut` (testowane konto OpenClaw Matrix) i `observer` (rejestruje ruch podmiotów zewnętrznych).
3. Tworzy pokoje wymagane przez wybrane scenariusze (główny, wątków, multimediów, ponownego uruchomienia, dodatkowy, listy dozwolonych, E2EE, wiadomości prywatnych do weryfikacji itd.).
4. Uruchamia niezależną od warstwy bazowej sondę protokołu `matrix-qa-v1` względem zarejestrowanej granicy Tuwunel. Testy jednostkowe potwierdzają kontrakt sondy przy użyciu danych testowych protokołu Matrix; kanoniczny host adaptera transportu QA w [#99707](https://github.com/openclaw/openclaw/pull/99707) odpowiada za rzeczywistą konfigurację celu Crabline.
5. Uruchamia podrzędny Gateway OpenClaw z rzeczywistym Pluginem Matrix ograniczonym do konta SUT.
6. Uruchamia scenariusze kolejno, obserwując zdarzenia za pośrednictwem klientów Matrix sterownika i obserwatora oraz wyprowadzając oczekiwania dotyczące tras i stanu z zarejestrowanego ruchu.
7. Usuwa serwer domowy, zapisuje raport i artefakty dowodowe, a następnie kończy działanie.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Typowe flagi

| Flaga                 | Wartość domyślna                              | Opis                                                                                                                                                                   |
| --------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Profil scenariuszy. Zobacz [Profile](#profiles).                                                                                                                        |
| `--fail-fast`         | wyłączona                                     | Zatrzymaj po pierwszej zakończonej niepowodzeniem kontroli lub pierwszym takim scenariuszu.                                                                              |
| `--scenario <id>`     | -                                             | Uruchom tylko ten scenariusz. Flagę można powtarzać. Zobacz [Scenariusze](#scenarios).                                                                                   |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Miejsce zapisu raportów, podsumowania, zestawu tras i stanów, zaobserwowanych zdarzeń oraz dziennika wyjściowego. Ścieżki względne są rozwiązywane względem `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                               | Katalog główny repozytorium podczas wywoływania z neutralnego katalogu roboczego.                                                                                        |
| `--sut-account <id>`  | `sut`                                         | Identyfikator konta Matrix w konfiguracji Gateway QA.                                                                                                                   |

### Flagi dostawcy

Ścieżka korzysta z rzeczywistego transportu Matrix, ale dostawcę modelu można skonfigurować:

| Flaga                    | Wartość domyślna  | Opis                                                                                                                                                                                  |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`   | `mock-openai` zapewnia deterministyczną pozorowaną obsługę, a `live-frontier` korzysta z rzeczywistych dostawców modeli najwyższej klasy. Starszy alias `live-openai` nadal działa. |
| `--model <ref>`          | domyślna dostawcy | Główne odwołanie `provider/model`.                                                                                                                                                     |
| `--alt-model <ref>`      | domyślna dostawcy | Alternatywne odwołanie `provider/model` używane w scenariuszach, które zmieniają model w trakcie działania.                                                                            |
| `--fast`                 | wyłączona         | Włącz szybki tryb dostawcy, jeśli jest obsługiwany.                                                                                                                                    |

QA dla Matrix nie przyjmuje flag `--credential-source` ani `--credential-role`. Ścieżka lokalnie tworzy jednorazowych użytkowników; nie ma współdzielonej puli poświadczeń, z której można je wydzierżawić.

## Profile

| Profil          | Zastosowanie                                                                                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (domyślny) | Pełny katalog. Powolny, ale wyczerpujący.                                                                                                                                                                                                                     |
| `fast`          | Podzbiór kontroli wydania sprawdzający imperatywny kontrakt rzeczywistego transportu: bramkowanie wzmianek, blokowanie przez listę dozwolonych, format odpowiedzi, wznowienie po ponownym uruchomieniu, obserwację reakcji, dostarczanie metadanych zatwierdzeń wykonania i podstawową odpowiedź E2EE. |
| `transport`     | Scenariusze dotyczące wątków na poziomie transportu, wiadomości prywatnych, pokojów, automatycznego dołączania, wzmianek i list dozwolonych, zatwierdzeń oraz reakcji.                                                                                           |
| `media`         | Testy załączników obrazów, dźwięku, filmów, plików PDF i EPUB.                                                                                                                                                                                                |
| `e2ee-smoke`    | Minimalny zakres E2EE: podstawowa zaszyfrowana odpowiedź, kontynuacja wątku i pomyślna inicjalizacja.                                                                                                                                                          |
| `e2ee-deep`     | Wyczerpujące scenariusze utraty stanu, kopii zapasowych, kluczy i odzyskiwania E2EE.                                                                                                                                                                          |
| `e2ee-cli`      | Scenariusze CLI `openclaw matrix encryption setup` i `verify *` wykonywane za pośrednictwem platformy testowej QA.                                                                                                                                             |

Dokładne mapowanie znajduje się w pliku `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Scenariusze

Współdzielony adapter Matrix udostępnia następujące kanoniczne scenariusze YAML za pośrednictwem polecenia `openclaw qa suite --channel-driver live --channel matrix`:

- `channel-chat-baseline`
- `thread-follow-up`
- `thread-isolation`
- `thread-reply-override`
- `dm-shared-session`
- `dm-per-room-session`

Scenariusz `subagent-thread-spawn` pozostaje dostępny po jawnym wybraniu za pomocą `--scenario subagent-thread-spawn`, ale nie należy do domyślnego współdzielonego zestawu Matrix, dopóki dowód zakończenia działania elementu podrzędnego na żywo nie będzie stabilny.

Pozostała imperatywna lista identyfikatorów scenariuszy to unia `MatrixQaScenarioId` w pliku `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`. Kategorie:

- wątki: `matrix-thread-root-preservation`, `matrix-thread-nested-reply-shape`
- najwyższy poziom / wiadomości prywatne / pokoje: `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- strumieniowanie i postęp narzędzi: `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- multimedia: `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- wyznaczanie tras: `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reakcje: `matrix-reaction-*`
- zatwierdzenia: `matrix-approval-*` (metadane wykonania/Pluginu, fragmentowany mechanizm zastępczy, reakcje odmowy, wątki i wyznaczanie tras `target: "both"`)
- ponowne uruchamianie i odtwarzanie: `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- bramkowanie wzmianek, komunikacja między botami i listy dozwolonych: `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE: `matrix-e2ee-*` (podstawowa odpowiedź, kontynuacja wątku, inicjalizacja, cykl życia klucza odzyskiwania, warianty utraty stanu, zachowanie kopii zapasowej serwera, higiena urządzeń, weryfikacja SAS / QR / przez wiadomość prywatną, ponowne uruchamianie, usuwanie danych wrażliwych z artefaktów)
- CLI E2EE: `matrix-e2ee-cli-*` (konfiguracja szyfrowania, idempotentna konfiguracja, niepowodzenie inicjalizacji, cykl życia klucza odzyskiwania, wiele kont, pełny obieg odpowiedzi Gateway, samodzielna weryfikacja)

Przekaż `--scenario <id>` (flagę można powtarzać), aby uruchomić ręcznie wybrany zestaw; połącz z `--profile all`, aby zignorować ograniczenia profilu.

## Zmienne środowiskowe

| Zmienna                                 | Wartość domyślna                          | Działanie                                                                                                                                                                                                 |
| --------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 min)                        | Bezwzględny górny limit czasu całego uruchomienia.                                                                                                                                                        |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Limit czasu początkowej odpowiedzi kontrolnej. W wydaniowym CI jest zwiększany na współdzielonych runnerach, aby powolna pierwsza tura Gateway nie powodowała błędu przed rozpoczęciem pokrywania scenariuszy. |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Okno ciszy dla negatywnych asercji braku odpowiedzi. Ograniczane do wartości `<=` limitowi czasu uruchomienia.                                                                                            |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Limit czasu wyłączania środowiska Docker. Informacje o błędzie zawierają polecenie odzyskiwania `docker compose ... down --remove-orphans`.                                                               |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Zastępuje obraz serwera domowego podczas walidacji względem innej wersji Tuwunel.                                                                                                                         |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | włączone                                  | `0` wycisza wiersze postępu `[matrix-qa] ...` w stderr. `1` wymusza ich wyświetlanie.                                                                                                                     |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | zredagowane                               | `1` zachowuje treść wiadomości i `formatted_body` w `matrix-qa-observed-events.json`. Domyślnie dane są redagowane, aby artefakty CI były bezpieczne.                                                      |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | wyłączone                                 | `1` pomija deterministyczne wywołanie `process.exit` po zapisaniu artefaktów. Domyślnie wyjście jest wymuszane, ponieważ natywne uchwyty kryptograficzne matrix-js-sdk mogą utrzymywać aktywną pętlę zdarzeń po zakończeniu tworzenia artefaktów. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | nieustawione                              | Gdy zmienną ustawi zewnętrzny program uruchamiający (np. `scripts/run-node.mjs`), QA Matrix ponownie wykorzystuje tę ścieżkę dziennika zamiast uruchamiać własne tee.                                       |

## Artefakty wyjściowe

Zapisywane w `--output-dir` (domyślnie `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, dzięki czemu kolejne uruchomienia nie nadpisują się wzajemnie):

- `matrix-qa-report.md`: raport protokołu w formacie Markdown (co przeszło, co zakończyło się niepowodzeniem, co pominięto i dlaczego).
- `matrix-qa-summary.json`: ustrukturyzowane podsumowanie odpowiednie do przetwarzania przez CI i użycia w panelach.
- `matrix-qa-route-state-manifest.json`: dynamiczny wykaz `matrix-qa-v1` indeksowany według identyfikatora scenariusza. Rejestruje zredagowane kształty tras i treści, kolejność żądań, zaobserwowane ponowienia, błędy, ciągłość tokenów synchronizacji oraz rodziny stanów urządzeń, kluczy, multimediów i kopii zapasowych zaobserwowane podczas danego uruchomienia. Jest to wykonywalny dowód, a nie bazowy plik przechowywany w repozytorium.
- `matrix-qa-observed-events.json`: zdarzenia Matrix zaobserwowane przez klientów sterujących i obserwujących. Treści są redagowane, chyba że ustawiono `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; metadane zatwierdzeń są podsumowywane przy użyciu wybranych bezpiecznych pól i skróconego podglądu polecenia.
- `matrix-qa-output.log`: połączone stdout/stderr z uruchomienia. Jeśli ustawiono `OPENCLAW_RUN_NODE_OUTPUT_LOG`, zamiast tego ponownie wykorzystywany jest dziennik zewnętrznego programu uruchamiającego.

## Wskazówki dotyczące diagnostyki

- **Uruchomienie zawiesza się pod koniec:** natywne uchwyty kryptograficzne `matrix-js-sdk` mogą działać dłużej niż środowisko testowe. Domyślnie po zapisaniu artefaktów wymuszane jest czyste wywołanie `process.exit`; jeśli ustawisz `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, proces może nadal działać.
- **Błąd czyszczenia:** znajdź wyświetlone polecenie odzyskiwania (wywołanie `docker compose ... down --remove-orphans`) i uruchom je ręcznie, aby zwolnić port serwera domowego.
- **Niestabilne okna negatywnych asercji w CI:** zmniejsz `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (domyślnie 8 s), gdy CI działa szybko; zwiększ je na powolnych współdzielonych runnerach.
- **Potrzebujesz zredagowanych treści do zgłoszenia błędu:** uruchom ponownie z `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` i dołącz `matrix-qa-observed-events.json`. Traktuj powstały artefakt jako poufny.
- **Inna wersja Tuwunel:** ustaw `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` na testowaną wersję. W repozytorium dla tej ścieżki przechowywany jest wyłącznie przypięty obraz domyślny.

## Kontrakt transportu na żywo

Matrix jest jedną z trzech ścieżek transportu na żywo (Matrix, Telegram, Discord), które współdzielą jedną listę kontrolną kontraktu zdefiniowaną w sekcji [Przegląd QA: pokrycie transportu na żywo](/pl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` pozostaje szerokim syntetycznym zestawem testów i celowo nie jest częścią tej macierzy.

## Powiązane materiały

- [Przegląd QA](/pl/concepts/qa-e2e-automation): ogólny stos QA i kontrakt transportu na żywo
- [Kanał QA](/pl/channels/qa-channel): syntetyczny adapter kanału dla scenariuszy opartych na repozytorium
- [Testowanie](/pl/help/testing): uruchamianie testów i dodawanie pokrycia QA
- [Matrix](/pl/channels/matrix): testowany Plugin kanału
