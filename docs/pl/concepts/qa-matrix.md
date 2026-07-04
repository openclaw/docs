---
read_when:
    - Uruchamianie pnpm openclaw qa matrix lokalnie
    - Dodawanie lub wybieranie scenariuszy QA Matrix
    - Klasyfikowanie błędów QA Matrix, przekroczeń czasu lub zablokowanego czyszczenia
summary: 'Materiały referencyjne dla maintainerów dotyczące ścieżki live QA Matrix opartej na Dockerze: CLI, profile, zmienne środowiskowe, scenariusze i artefakty wyjściowe.'
title: QA macierzy
x-i18n:
    generated_at: "2026-07-04T20:45:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4f7fd98b5e7fef7a30c8820c5a1fc48c199e4d09db34255e8b2287a047b339f
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Ścieżka Matrix QA uruchamia dołączony Plugin `@openclaw/matrix` względem jednorazowego serwera domowego Tuwunel w Dockerze, z tymczasowymi kontami drivera, SUT i obserwatora oraz wstępnie przygotowanymi pokojami. To jest pokrycie live z rzeczywistym transportem dla Matrix.

To narzędzie wyłącznie dla opiekunów. Spakowane wydania OpenClaw celowo pomijają `qa-lab`, więc `openclaw qa` jest dostępne tylko z checkoutu źródeł. Checkouty źródeł ładują dołączony runner bezpośrednio - krok instalacji Plugin nie jest potrzebny.

Szerszy kontekst frameworka QA znajdziesz w [przeglądzie QA](/pl/concepts/qa-e2e-automation).

## Szybki start

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Zwykłe `pnpm openclaw qa matrix` uruchamia `--profile all` i nie zatrzymuje się po pierwszym niepowodzeniu. Użyj `--profile fast --fail-fast` jako bramki wydania; podziel katalog za pomocą `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`, gdy uruchamiasz pełny inwentarz równolegle.

## Co robi ta ścieżka

1. Tworzy jednorazowy serwer domowy Tuwunel w Dockerze (domyślny obraz `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nazwa serwera `matrix-qa.test`, port `28008`) za ograniczonym rejestratorem żądań/odpowiedzi z redakcją danych.
2. Rejestruje trzech tymczasowych użytkowników - `driver` (wysyła ruch przychodzący), `sut` (testowane konto OpenClaw Matrix), `observer` (przechwytywanie ruchu strony trzeciej).
3. Przygotowuje pokoje wymagane przez wybrane scenariusze (główny, wątki, media, restart, pomocniczy, lista dozwolonych, E2EE, DM weryfikacyjny itd.).
4. Uruchamia neutralną względem substratu sondę protokołu `matrix-qa-v1` względem rejestrowanej granicy Tuwunel. Testy jednostkowe potwierdzają kontrakt sondy z fiksturą protokołu Matrix; kanoniczny host adaptera transportu QA w [#99707](https://github.com/openclaw/openclaw/pull/99707) odpowiada za rzeczywiste okablowanie celu Crabline.
5. Uruchamia potomny Gateway OpenClaw z rzeczywistym Plugin Matrix ograniczonym do konta SUT; `qa-channel` nie jest ładowany w procesie potomnym.
6. Uruchamia scenariusze po kolei, obserwując zdarzenia przez klientów Matrix drivera/obserwatora i wyprowadzając oczekiwania dotyczące tras/stanu z zarejestrowanego ruchu.
7. Zamyka serwer domowy, zapisuje raport i artefakty dowodowe, a następnie kończy działanie.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Typowe flagi

| Flaga                 | Domyślnie                                    | Opis                                                                                                                                              |
| --------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                        | Profil scenariuszy. Zobacz [Profile](#profiles).                                                                                                  |
| `--fail-fast`         | wyłączone                                    | Zatrzymaj po pierwszym nieudanym sprawdzeniu lub scenariuszu.                                                                                     |
| `--scenario <id>`     | -                                            | Uruchom tylko ten scenariusz. Można powtarzać. Zobacz [Scenariusze](#scenarios).                                                                  |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Miejsce zapisu raportów, podsumowania, inwentarza tras/stanu, zaobserwowanych zdarzeń i dziennika wyjściowego. Ścieżki względne są rozwiązywane względem `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                              | Katalog główny repozytorium przy wywołaniu z neutralnego katalogu roboczego.                                                                       |
| `--sut-account <id>`  | `sut`                                        | Identyfikator konta Matrix w konfiguracji Gateway QA.                                                                                             |

### Flagi dostawcy

Ścieżka używa rzeczywistego transportu Matrix, ale dostawca modelu jest konfigurowalny:

| Flaga                    | Domyślnie          | Opis                                                                                                                                       |
| ------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `--provider-mode <mode>` | `live-frontier`    | `mock-openai` dla deterministycznego dispatchu mock albo `live-frontier` dla żywych dostawców frontier. Starszy alias `live-openai` nadal działa. |
| `--model <ref>`          | domyślna wartość dostawcy | Główna referencja `provider/model`.                                                                                                        |
| `--alt-model <ref>`      | domyślna wartość dostawcy | Alternatywna referencja `provider/model`, gdy scenariusze przełączają model w trakcie uruchomienia.                                        |
| `--fast`                 | wyłączone          | Włącz szybki tryb dostawcy tam, gdzie jest obsługiwany.                                                                                    |

Matrix QA nie przyjmuje `--credential-source` ani `--credential-role`. Ścieżka lokalnie tworzy jednorazowych użytkowników; nie ma współdzielonej puli poświadczeń do dzierżawienia.

## Profile

Wybrany profil decyduje, które scenariusze zostaną uruchomione.

| Profil          | Zastosowanie                                                                                                                                                                                                                              |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (domyślnie) | Pełny katalog. Wolny, ale wyczerpujący.                                                                                                                                                                                                 |
| `fast`          | Podzbiór bramki wydania, który ćwiczy kontrakt żywego transportu: canary, bramkowanie wzmianek, blokada listy dozwolonych, kształt odpowiedzi, wznowienie po restarcie, kontynuacja wątku, izolacja wątku, obserwacja reakcji i dostarczanie metadanych zatwierdzeń exec. |
| `transport`     | Scenariusze na poziomie transportu: wątki, DM, pokój, automatyczne dołączanie, wzmianki/lista dozwolonych, zatwierdzenia i reakcje.                                                                                                      |
| `media`         | Pokrycie załączników obrazu, audio, wideo, PDF i EPUB.                                                                                                                                                                                   |
| `e2ee-smoke`    | Minimalne pokrycie E2EE - podstawowa zaszyfrowana odpowiedź, kontynuacja wątku, powodzenie bootstrapu.                                                                                                                                   |
| `e2ee-deep`     | Wyczerpujące scenariusze E2EE dotyczące utraty stanu, kopii zapasowej, kluczy i odzyskiwania.                                                                                                                                            |
| `e2ee-cli`      | Scenariusze CLI `openclaw matrix encryption setup` i `verify *` uruchamiane przez harness QA.                                                                                                                                            |

Dokładne mapowanie znajduje się w `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Scenariusze

Pełna lista identyfikatorów scenariuszy to unia `MatrixQaScenarioId` w `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Kategorie obejmują:

- wątki - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- najwyższy poziom / DM / pokój - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- strumieniowanie i postęp narzędzi - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- trasowanie - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reakcje - `matrix-reaction-*`
- zatwierdzenia - `matrix-approval-*` (metadane exec/Plugin, fallback dzielony na fragmenty, reakcje odmowy, wątki i trasowanie `target: "both"`)
- restart i odtwarzanie - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- bramkowanie wzmianek, bot-do-bota i listy dozwolonych - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (podstawowa odpowiedź, kontynuacja wątku, bootstrap, cykl życia klucza odzyskiwania, warianty utraty stanu, zachowanie kopii zapasowej serwera, higiena urządzeń, weryfikacja SAS / QR / DM, restart, redakcja artefaktów)
- E2EE CLI - `matrix-e2ee-cli-*` (konfiguracja szyfrowania, idempotentna konfiguracja, niepowodzenie bootstrapu, cykl życia klucza odzyskiwania, wiele kont, pełna ścieżka odpowiedzi Gateway, samoweryfikacja)

Przekaż `--scenario <id>` (można powtarzać), aby uruchomić ręcznie wybrany zestaw; połącz z `--profile all`, aby pominąć bramkowanie profilu.

## Zmienne środowiskowe

| Zmienna                                | Domyślnie                                   | Efekt                                                                                                                                                                                         |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 min)                        | Twarda górna granica całego uruchomienia.                                                                                                                                                            |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Limit dla początkowej odpowiedzi kanarkowej. CI wydania podnosi go na współdzielonych runnerach, aby wolna pierwsza tura gatewaya nie zakończyła się niepowodzeniem przed rozpoczęciem pokrycia scenariuszy.                                       |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Ciche okno dla negatywnych asercji braku odpowiedzi. Ograniczane do `≤` limitu czasu uruchomienia.                                                                                                                 |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Limit dla sprzątania Dockera. Powierzchnie błędów obejmują polecenie odzyskiwania `docker compose ... down --remove-orphans`.                                                                           |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Nadpisuje obraz homeservera podczas walidacji względem innej wersji Tuwunel.                                                                                                             |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | włączone                                        | `0` wycisza wiersze postępu `[matrix-qa] ...` na stderr. `1` wymusza ich włączenie.                                                                                                                   |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | zredagowane                                  | `1` zachowuje treść wiadomości i `formatted_body` w `matrix-qa-observed-events.json`. Domyślnie dane są redagowane, aby artefakty CI były bezpieczne.                                                                    |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | wyłączone                                       | `1` pomija deterministyczne `process.exit` po zapisaniu artefaktów. Domyślnie wyjście jest wymuszane, ponieważ natywne uchwyty kryptograficzne matrix-js-sdk mogą utrzymywać pętlę zdarzeń przy życiu po ukończeniu artefaktów. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | nieustawione                                     | Gdy ustawione przez zewnętrzny launcher (np. `scripts/run-node.mjs`), Matrix QA ponownie używa tej ścieżki dziennika zamiast uruchamiać własne tee.                                                                   |

## Artefakty wyjściowe

Zapisywane do `--output-dir`:

- `matrix-qa-report.md` - raport protokołu Markdown (co przeszło, zakończyło się niepowodzeniem, zostało pominięte i dlaczego).
- `matrix-qa-summary.json` - ustrukturyzowane podsumowanie odpowiednie do parsowania przez CI i dashboardów.
- `matrix-qa-route-state-manifest.json` - dynamiczny spis `matrix-qa-v1` indeksowany według identyfikatora scenariusza. Rejestruje zredagowane kształty tras/treści, kolejność żądań, zaobserwowane ponowienia, błędy, ciągłość tokenu synchronizacji oraz rodziny stanów urządzeń/kluczy/mediów/kopii zapasowych zaobserwowane podczas danego uruchomienia. To wykonywalny dowód, a nie zaewidencjonowana baza odniesienia.
- `matrix-qa-observed-events.json` - zaobserwowane zdarzenia Matrix z klientów sterownika i obserwatora. Treści są redagowane, chyba że ustawiono `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; metadane zatwierdzania są podsumowywane z wybranymi bezpiecznymi polami i przyciętym podglądem polecenia.
- `matrix-qa-output.log` - połączone stdout/stderr z uruchomienia. Jeśli ustawiono `OPENCLAW_RUN_NODE_OUTPUT_LOG`, zamiast tego ponownie używany jest dziennik zewnętrznego launchera.

Domyślny katalog wyjściowy to `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, więc kolejne uruchomienia nie nadpisują się nawzajem.

## Wskazówki dotyczące triage

- **Uruchomienie zawiesza się pod koniec:** natywne uchwyty kryptograficzne `matrix-js-sdk` mogą żyć dłużej niż harness. Domyślnie wymuszane jest czyste `process.exit` po zapisaniu artefaktów; jeśli usunięto ustawienie `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, spodziewaj się, że proces będzie się utrzymywał.
- **Błąd sprzątania:** poszukaj wydrukowanego polecenia odzyskiwania (wywołania `docker compose ... down --remove-orphans`) i uruchom je ręcznie, aby zwolnić port homeservera.
- **Niestabilne okna negatywnych asercji w CI:** obniż `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (domyślnie 8 s), gdy CI jest szybkie; podnieś je na wolnych współdzielonych runnerach.
- **Potrzebujesz zredagowanych treści do raportu błędu:** uruchom ponownie z `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` i załącz `matrix-qa-observed-events.json`. Traktuj wynikowy artefakt jako wrażliwy.
- **Inna wersja Tuwunel:** skieruj `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` na testowaną wersję. Lane ewidencjonuje tylko przypięty obraz domyślny.

## Kontrakt transportu live

Matrix jest jedną z trzech lane transportu live (Matrix, Telegram, Discord), które współdzielą jedną listę kontrolną kontraktu zdefiniowaną w [Przegląd QA → Pokrycie transportu live](/pl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` pozostaje szerokim zestawem syntetycznym i celowo nie jest częścią tej macierzy.

## Powiązane

- [Przegląd QA](/pl/concepts/qa-e2e-automation) - ogólny stos QA i kontrakt transportu live
- [QA Channel](/pl/channels/qa-channel) - adapter kanału syntetycznego dla scenariuszy opartych na repozytorium
- [Testowanie](/pl/help/testing) - uruchamianie testów i dodawanie pokrycia QA
- [Matrix](/pl/channels/matrix) - testowany Plugin kanału
