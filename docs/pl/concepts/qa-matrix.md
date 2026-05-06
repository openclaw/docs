---
read_when:
    - Lokalne uruchamianie pnpm openclaw qa matrix
    - Dodawanie lub wybieranie scenariuszy QA Matrix
    - Triage niepowodzeń Matrix QA, przekroczeń limitu czasu lub zablokowanego czyszczenia
summary: 'Dokumentacja referencyjna dla opiekunów dotycząca opartej na Dockerze ścieżki QA na żywo dla Matrix: CLI, profile, zmienne środowiskowe, scenariusze i artefakty wyjściowe.'
title: Kontrola jakości Matrix
x-i18n:
    generated_at: "2026-05-06T09:09:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c6d836492368c470468547950d3765a64187694852222a5a1f0ae4185569abe
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Ścieżka Matrix QA uruchamia dołączony Plugin `@openclaw/matrix` względem jednorazowego homeservera Tuwunel w Dockerze, z tymczasowymi kontami drivera, SUT i obserwatora oraz wstępnie przygotowanymi pokojami. Jest to pokrycie Matrix działające na rzeczywistym transporcie live.

To narzędzia wyłącznie dla maintainerów. Spakowane wydania OpenClaw celowo pomijają `qa-lab`, więc `openclaw qa` jest dostępne tylko z checkoutu źródeł. Checkouty źródeł ładują dołączony runner bezpośrednio - krok instalacji Plugin nie jest potrzebny.

Szerszy kontekst frameworka QA znajdziesz w [omówieniu QA](/pl/concepts/qa-e2e-automation).

## Szybki start

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Zwykłe `pnpm openclaw qa matrix` uruchamia `--profile all` i nie zatrzymuje się po pierwszym niepowodzeniu. Użyj `--profile fast --fail-fast` jako bramki wydania; podziel katalog na shardy za pomocą `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`, gdy uruchamiasz pełny inwentarz równolegle.

## Co robi ta ścieżka

1. Udostępnia jednorazowy homeserver Tuwunel w Dockerze (domyślny obraz `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nazwa serwera `matrix-qa.test`, port `28008`).
2. Rejestruje trzech tymczasowych użytkowników - `driver` (wysyła ruch przychodzący), `sut` (konto OpenClaw Matrix pod testem), `observer` (przechwytywanie ruchu strony trzeciej).
3. Przygotowuje pokoje wymagane przez wybrane scenariusze (główny, wątki, media, restart, pomocniczy, allowlist, E2EE, DM weryfikacyjny itd.).
4. Uruchamia podrzędny Gateway OpenClaw z rzeczywistym Plugin Matrix ograniczonym do konta SUT; `qa-channel` nie jest ładowany w procesie podrzędnym.
5. Uruchamia scenariusze sekwencyjnie, obserwując zdarzenia przez klientów Matrix drivera/obserwatora.
6. Zamyka homeserver, zapisuje artefakty raportu i podsumowania, a następnie kończy działanie.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Typowe flagi

| Flaga                 | Domyślnie                                    | Opis                                                                                                                        |
| --------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Profil scenariuszy. Zobacz [Profile](#profiles).                                                                            |
| `--fail-fast`         | wyłączone                                     | Zatrzymaj po pierwszym nieudanym sprawdzeniu lub scenariuszu.                                                               |
| `--scenario <id>`     | -                                             | Uruchom tylko ten scenariusz. Powtarzalne. Zobacz [Scenariusze](#scenarios).                                                |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Miejsce zapisu raportów, podsumowania, zaobserwowanych zdarzeń i dziennika wyjściowego. Ścieżki względne są rozwiązywane względem `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                               | Katalog główny repozytorium przy wywołaniu z neutralnego katalogu roboczego.                                                |
| `--sut-account <id>`  | `sut`                                         | Identyfikator konta Matrix w konfiguracji Gateway QA.                                                                       |

### Flagi dostawcy

Ścieżka używa rzeczywistego transportu Matrix, ale dostawca modelu jest konfigurowalny:

| Flaga                    | Domyślnie        | Opis                                                                                                                                              |
| ------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` dla deterministycznej wysyłki mocków albo `live-frontier` dla dostawców live frontier. Starszy alias `live-openai` nadal działa. |
| `--model <ref>`          | domyślne dostawcy | Główne odwołanie `provider/model`.                                                                                                                |
| `--alt-model <ref>`      | domyślne dostawcy | Alternatywne odwołanie `provider/model`, gdy scenariusze przełączają model w trakcie przebiegu.                                                   |
| `--fast`                 | wyłączone        | Włącz szybki tryb dostawcy tam, gdzie jest obsługiwany.                                                                                           |

Matrix QA nie akceptuje `--credential-source` ani `--credential-role`. Ścieżka udostępnia jednorazowych użytkowników lokalnie; nie ma współdzielonej puli poświadczeń do dzierżawienia.

## Profile

Wybrany profil decyduje, które scenariusze zostaną uruchomione.

| Profil          | Do czego go używać                                                                                                                                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all` (domyślny) | Pełny katalog. Wolny, ale wyczerpujący.                                                                                                                                                                                                    |
| `fast`          | Podzbiór bramki wydania, który ćwiczy kontrakt transportu live: kanarek, bramkowanie wzmianek, blokada allowlist, kształt odpowiedzi, wznowienie po restarcie, kontynuacja wątku, izolacja wątku, obserwacja reakcji i dostarczenie metadanych zatwierdzenia exec. |
| `transport`     | Scenariusze na poziomie transportu: wątki, DM, pokój, automatyczne dołączanie, wzmianki/allowlist, zatwierdzenia i reakcje.                                                                                                                |
| `media`         | Pokrycie załączników: obraz, audio, wideo, PDF, EPUB.                                                                                                                                                                                      |
| `e2ee-smoke`    | Minimalne pokrycie E2EE - podstawowa zaszyfrowana odpowiedź, kontynuacja wątku, powodzenie bootstrapu.                                                                                                                                     |
| `e2ee-deep`     | Wyczerpujące scenariusze E2EE dotyczące utraty stanu, kopii zapasowej, kluczy i odzyskiwania.                                                                                                                                              |
| `e2ee-cli`      | Scenariusze CLI `openclaw matrix encryption setup` i `verify *` uruchamiane przez harness QA.                                                                                                                                              |

Dokładne mapowanie znajduje się w `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Scenariusze

Pełna lista identyfikatorów scenariuszy to unia `MatrixQaScenarioId` w `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Kategorie obejmują:

- wątki - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- najwyższy poziom / DM / pokój - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming i postęp narzędzi - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routing - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reakcje - `matrix-reaction-*`
- zatwierdzenia - `matrix-approval-*` (metadane exec/Plugin, fallback dzielony na fragmenty, reakcje odmowy, wątki i routing `target: "both"`)
- restart i odtwarzanie - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- bramkowanie wzmianek, bot-do-bota i allowlisty - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (podstawowa odpowiedź, kontynuacja wątku, bootstrap, cykl życia klucza odzyskiwania, warianty utraty stanu, zachowanie kopii zapasowej serwera, higiena urządzeń, weryfikacja SAS / QR / DM, restart, redakcja artefaktów)
- E2EE CLI - `matrix-e2ee-cli-*` (konfiguracja szyfrowania, idempotentna konfiguracja, niepowodzenie bootstrapu, cykl życia klucza odzyskiwania, wiele kont, round-trip odpowiedzi Gateway, samoweryfikacja)

Przekaż `--scenario <id>` (powtarzalne), aby uruchomić ręcznie wybrany zestaw; połącz z `--profile all`, aby zignorować bramkowanie profilu.

## Zmienne środowiskowe

| Zmienna                                | Domyślna wartość                                   | Efekt                                                                                                                                                                                         |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 min)                        | Twarda górna granica dla całego przebiegu.                                                                                                                                                            |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Limit dla początkowej odpowiedzi canary. CI wydania zwiększa go na współdzielonych runnerach, aby wolna pierwsza tura Gateway nie kończyła się niepowodzeniem przed rozpoczęciem pokrycia scenariuszy.                                       |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Okno ciszy dla negatywnych asercji braku odpowiedzi. Ograniczane do wartości `≤` limitowi czasu przebiegu.                                                                                                                 |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Limit dla zamykania Docker. Powierzchnie błędów obejmują polecenie odzyskiwania `docker compose ... down --remove-orphans`.                                                                           |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Nadpisuje obraz homeservera podczas walidacji względem innej wersji Tuwunel.                                                                                                             |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | włączone                                        | `0` wycisza wiersze postępu `[matrix-qa] ...` na stderr. `1` wymusza ich włączenie.                                                                                                                   |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | zredagowane                                  | `1` zachowuje treść wiadomości i `formatted_body` w `matrix-qa-observed-events.json`. Domyślnie redaguje dane, aby artefakty CI były bezpieczne.                                                                    |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | wyłączone                                       | `1` pomija deterministyczne `process.exit` po zapisaniu artefaktu. Wartość domyślna wymusza zakończenie, ponieważ natywne uchwyty kryptograficzne matrix-js-sdk mogą utrzymywać pętlę zdarzeń przy życiu po ukończeniu artefaktu. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | nieustawione                                     | Gdy jest ustawione przez zewnętrzny launcher (np. `scripts/run-node.mjs`), Matrix QA ponownie używa tej ścieżki dziennika zamiast uruchamiać własne tee.                                                                   |

## Artefakty wyjściowe

Zapisywane do `--output-dir`:

- `matrix-qa-report.md` - raport protokołu Markdown (co przeszło, zakończyło się niepowodzeniem, zostało pominięte i dlaczego).
- `matrix-qa-summary.json` - ustrukturyzowane podsumowanie odpowiednie do parsowania przez CI i pulpitów.
- `matrix-qa-observed-events.json` - zaobserwowane zdarzenia Matrix z klientów sterownika i obserwatora. Treści są redagowane, chyba że ustawiono `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; metadane zatwierdzeń są podsumowywane z wybranymi bezpiecznymi polami i skróconym podglądem polecenia.
- `matrix-qa-output.log` - połączone stdout/stderr z przebiegu. Jeśli ustawiono `OPENCLAW_RUN_NODE_OUTPUT_LOG`, zamiast tego ponownie używany jest dziennik zewnętrznego launchera.

Domyślny katalog wyjściowy to `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, dzięki czemu kolejne przebiegi nie nadpisują się nawzajem.

## Wskazówki triage

- **Przebieg zawiesza się pod koniec:** natywne uchwyty kryptograficzne `matrix-js-sdk` mogą przeżyć harness. Domyślnie wymuszane jest czyste `process.exit` po zapisaniu artefaktu; jeśli ustawiono `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, można oczekiwać, że proces pozostanie uruchomiony.
- **Błąd sprzątania:** znajdź wydrukowane polecenie odzyskiwania (wywołanie `docker compose ... down --remove-orphans`) i uruchom je ręcznie, aby zwolnić port homeservera.
- **Niestabilne okna negatywnych asercji w CI:** obniż `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (domyślnie 8 s), gdy CI jest szybkie; zwiększ je na wolnych współdzielonych runnerach.
- **Potrzebujesz zredagowanych treści do zgłoszenia błędu:** uruchom ponownie z `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` i dołącz `matrix-qa-observed-events.json`. Traktuj wynikowy artefakt jako wrażliwy.
- **Inna wersja Tuwunel:** ustaw `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` na testowaną wersję. Ścieżka sprawdza tylko przypięty domyślny obraz.

## Kontrakt transportu na żywo

Matrix jest jedną z trzech ścieżek transportu na żywo (Matrix, Telegram, Discord), które współdzielą jedną listę kontrolną kontraktu zdefiniowaną w [Omówienie QA → Pokrycie transportu na żywo](/pl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` pozostaje szerokim syntetycznym zestawem i celowo nie jest częścią tej macierzy.

## Powiązane

- [Omówienie QA](/pl/concepts/qa-e2e-automation) - ogólny stos QA i kontrakt transportu na żywo
- [Kanał QA](/pl/channels/qa-channel) - syntetyczny adapter kanału dla scenariuszy opartych na repozytorium
- [Testowanie](/pl/help/testing) - uruchamianie testów i dodawanie pokrycia QA
- [Matrix](/pl/channels/matrix) - testowany Plugin kanału
