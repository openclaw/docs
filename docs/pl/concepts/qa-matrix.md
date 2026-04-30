---
read_when:
    - Uruchamianie pnpm openclaw qa matrix lokalnie
    - Dodawanie lub wybieranie scenariuszy QA dla Matrix
    - Diagnozowanie błędów Matrix QA, przekroczeń limitu czasu lub zablokowanego czyszczenia
summary: 'Dokumentacja referencyjna dla opiekunów dotycząca opartej na Dockerze ścieżki testów QA Matrix na żywo: CLI, profile, zmienne środowiskowe, scenariusze i artefakty wyjściowe.'
title: Macierz QA
x-i18n:
    generated_at: "2026-04-30T09:49:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab862474e2abe45a1dcd66f025e3a3dd52a3417b0c1f42a26cd7944dd4053f5
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Ścieżka QA dla Matrix uruchamia dołączony Plugin `@openclaw/matrix` względem jednorazowego homeservera Tuwunel w Dockerze, z tymczasowymi kontami sterownika, SUT i obserwatora oraz wstępnie przygotowanymi pokojami. Jest to pokrycie Matrix dla rzeczywistego transportu na żywo.

Są to narzędzia wyłącznie dla opiekunów. Pakietowane wydania OpenClaw celowo pomijają `qa-lab`, więc `openclaw qa` jest dostępne tylko z checkoutu źródeł. Checkouty źródeł ładują dołączony runner bezpośrednio — krok instalacji Plugin nie jest potrzebny.

Szerszy kontekst frameworka QA znajdziesz w [omówieniu QA](/pl/concepts/qa-e2e-automation).

## Szybki start

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Zwykłe `pnpm openclaw qa matrix` uruchamia `--profile all` i nie zatrzymuje się po pierwszej porażce. Użyj `--profile fast --fail-fast` jako bramki wydania; podziel katalog za pomocą `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`, gdy uruchamiasz pełny spis równolegle.

## Co robi ta ścieżka

1. Tworzy jednorazowy homeserver Tuwunel w Dockerze (domyślny obraz `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nazwa serwera `matrix-qa.test`, port `28008`).
2. Rejestruje trzech tymczasowych użytkowników — `driver` (wysyła ruch przychodzący), `sut` (testowane konto OpenClaw Matrix), `observer` (przechwytywanie ruchu strony trzeciej).
3. Przygotowuje pokoje wymagane przez wybrane scenariusze (główny, wątki, media, restart, pomocniczy, allowlist, E2EE, DM weryfikacyjny itd.).
4. Uruchamia podrzędny Gateway OpenClaw z prawdziwym Plugin Matrix ograniczonym do konta SUT; `qa-channel` nie jest ładowany w procesie podrzędnym.
5. Uruchamia scenariusze sekwencyjnie, obserwując zdarzenia przez klientów Matrix sterownika/obserwatora.
6. Zamyka homeserver, zapisuje artefakty raportu i podsumowania, a następnie kończy działanie.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Typowe flagi

| Flaga                 | Domyślnie                                     | Opis                                                                                                                       |
| --------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Profil scenariusza. Zobacz [Profile](#profiles).                                                                          |
| `--fail-fast`         | wyłączone                                     | Zatrzymaj po pierwszym nieudanym sprawdzeniu lub scenariuszu.                                                             |
| `--scenario <id>`     | —                                             | Uruchom tylko ten scenariusz. Powtarzalne. Zobacz [Scenariusze](#scenarios).                                              |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Miejsce zapisu raportów, podsumowania, zaobserwowanych zdarzeń i dziennika wyjściowego. Ścieżki względne są rozwiązywane względem `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                               | Katalog główny repozytorium przy wywołaniu z neutralnego katalogu roboczego.                                              |
| `--sut-account <id>`  | `sut`                                         | Identyfikator konta Matrix w konfiguracji Gateway QA.                                                                      |

### Flagi providera

Ścieżka używa prawdziwego transportu Matrix, ale provider modelu jest konfigurowalny:

| Flaga                    | Domyślnie          | Opis                                                                                                                              |
| ------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`    | `mock-openai` dla deterministycznego mockowanego dispatchu albo `live-frontier` dla providerów frontier na żywo. Starszy alias `live-openai` nadal działa. |
| `--model <ref>`          | domyślne providera | Podstawowy ref `provider/model`.                                                                                                  |
| `--alt-model <ref>`      | domyślne providera | Alternatywny ref `provider/model`, gdy scenariusze przełączają się w trakcie uruchomienia.                                        |
| `--fast`                 | wyłączone          | Włącz szybki tryb providera tam, gdzie jest obsługiwany.                                                                          |

Matrix QA nie akceptuje `--credential-source` ani `--credential-role`. Ścieżka tworzy jednorazowych użytkowników lokalnie; nie ma współdzielonej puli poświadczeń do dzierżawy.

## Profile

Wybrany profil decyduje, które scenariusze zostaną uruchomione.

| Profil          | Użyj do                                                                                                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all` (domyślny) | Pełny katalog. Wolny, ale wyczerpujący.                                                                                                                                                                                             |
| `fast`          | Podzbiór bramki wydania, który ćwiczy kontrakt transportu na żywo: kanarek, bramkowanie wzmianką, blokada allowlist, kształt odpowiedzi, wznowienie po restarcie, kontynuacja wątku, izolacja wątków, obserwacja reakcji oraz dostarczanie metadanych zatwierdzeń exec. |
| `transport`     | Scenariusze wątków, DM, pokoju, autojoin, wzmianki/allowlist, zatwierdzeń i reakcji na poziomie transportu.                                                                                                                         |
| `media`         | Pokrycie załączników obrazu, audio, wideo, PDF i EPUB.                                                                                                                                                                              |
| `e2ee-smoke`    | Minimalne pokrycie E2EE — podstawowa zaszyfrowana odpowiedź, kontynuacja wątku, powodzenie bootstrapu.                                                                                                                              |
| `e2ee-deep`     | Wyczerpujące scenariusze E2EE utraty stanu, kopii zapasowej, kluczy i odzyskiwania.                                                                                                                                                 |
| `e2ee-cli`      | Scenariusze CLI `openclaw matrix encryption setup` i `verify *` prowadzone przez harness QA.                                                                                                                                        |

Dokładne mapowanie znajduje się w `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Scenariusze

Pełna lista identyfikatorów scenariuszy to unia `MatrixQaScenarioId` w `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Kategorie obejmują:

- wątki — `matrix-thread-*`, `matrix-subagent-thread-spawn`
- poziom najwyższy / DM / pokój — `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- strumieniowanie i postęp narzędzi — `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media — `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routing — `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reakcje — `matrix-reaction-*`
- zatwierdzenia — `matrix-approval-*` (metadane exec/Plugin, chunked fallback, reakcje odmowy, wątki i routing `target: "both"`)
- restart i odtwarzanie — `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- bramkowanie wzmianką, bot-do-bota i allowlisty — `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE — `matrix-e2ee-*` (podstawowa odpowiedź, kontynuacja wątku, bootstrap, cykl życia klucza odzyskiwania, warianty utraty stanu, zachowanie kopii zapasowej serwera, higiena urządzeń, weryfikacja SAS / QR / DM, restart, redakcja artefaktów)
- CLI E2EE — `matrix-e2ee-cli-*` (konfiguracja szyfrowania, idempotentna konfiguracja, niepowodzenie bootstrapu, cykl życia klucza odzyskiwania, wiele kont, pełny obieg odpowiedzi Gateway, samoweryfikacja)

Przekaż `--scenario <id>` (powtarzalne), aby uruchomić ręcznie wybrany zestaw; połącz z `--profile all`, aby zignorować bramkowanie profilu.

## Zmienne środowiskowe

| Zmienna                                 | Domyślnie                                 | Efekt                                                                                                                                                                                                |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 min)                        | Twarda górna granica całego uruchomienia.                                                                                                                                                            |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Limit dla początkowej odpowiedzi canary. CI wydania podnosi go na współdzielonych runnerach, aby powolna pierwsza tura Gateway nie zakończyła się niepowodzeniem przed rozpoczęciem pokrycia scenariuszy. |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Okno ciszy dla negatywnych asercji braku odpowiedzi. Ograniczane do `≤` limitu czasu uruchomienia.                                                                                                   |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Limit dla sprzątania Docker. Powierzchnie błędów obejmują polecenie odzyskiwania `docker compose ... down --remove-orphans`.                                                                         |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Zastępuje obraz homeservera podczas walidacji względem innej wersji Tuwunel.                                                                                                                         |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | włączone                                  | `0` wycisza linie postępu `[matrix-qa] ...` na stderr. `1` wymusza ich włączenie.                                                                                                                     |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | zredagowane                               | `1` zachowuje treść wiadomości i `formatted_body` w `matrix-qa-observed-events.json`. Domyślnie redaguje je, aby artefakty CI były bezpieczne.                                                       |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | wyłączone                                 | `1` pomija deterministyczne `process.exit` po zapisaniu artefaktów. Domyślne zachowanie wymusza zakończenie, ponieważ natywne uchwyty kryptograficzne matrix-js-sdk mogą utrzymywać pętlę zdarzeń aktywną po ukończeniu artefaktów. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | nieustawiona                              | Gdy ustawiona przez zewnętrzny launcher (np. `scripts/run-node.mjs`), Matrix QA ponownie używa tej ścieżki dziennika zamiast uruchamiać własne tee.                                                   |

## Artefakty wyjściowe

Zapisywane do `--output-dir`:

- `matrix-qa-report.md` — raport protokołu Markdown (co przeszło, nie powiodło się, zostało pominięte i dlaczego).
- `matrix-qa-summary.json` — ustrukturyzowane podsumowanie odpowiednie do parsowania przez CI i pulpitów.
- `matrix-qa-observed-events.json` — zaobserwowane zdarzenia Matrix z klientów sterownika i obserwatora. Treści są redagowane, chyba że ustawiono `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; metadane zatwierdzeń są podsumowywane z wybranymi bezpiecznymi polami i skróconym podglądem polecenia.
- `matrix-qa-output.log` — połączone stdout/stderr z uruchomienia. Jeśli ustawiono `OPENCLAW_RUN_NODE_OUTPUT_LOG`, zamiast tego ponownie używany jest dziennik zewnętrznego launchera.

Domyślny katalog wyjściowy to `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, więc kolejne uruchomienia nie nadpisują się nawzajem.

## Wskazówki triage

- **Uruchomienie zawiesza się pod koniec:** natywne uchwyty kryptograficzne `matrix-js-sdk` mogą przeżyć harness. Domyślne zachowanie wymusza czyste `process.exit` po zapisaniu artefaktów; jeśli ustawiono `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, należy oczekiwać, że proces pozostanie aktywny.
- **Błąd sprzątania:** znajdź wydrukowane polecenie odzyskiwania (wywołanie `docker compose ... down --remove-orphans`) i uruchom je ręcznie, aby zwolnić port homeservera.
- **Niestabilne okna negatywnych asercji w CI:** obniż `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (domyślnie 8 s), gdy CI jest szybkie; podnieś je na wolnych współdzielonych runnerach.
- **Potrzebujesz zredagowanych treści do zgłoszenia błędu:** uruchom ponownie z `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` i dołącz `matrix-qa-observed-events.json`. Traktuj wynikowy artefakt jako wrażliwy.
- **Inna wersja Tuwunel:** skieruj `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` na testowaną wersję. Lane sprawdza tylko przypięty obraz domyślny.

## Kontrakt transportu live

Matrix jest jednym z trzech lane transportu live (Matrix, Telegram, Discord), które współdzielą jedną listę kontrolną kontraktu zdefiniowaną w [przeglądzie QA → Pokrycie transportu live](/pl/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` pozostaje szerokim zestawem syntetycznym i celowo nie jest częścią tej macierzy.

## Powiązane

- [Przegląd QA](/pl/concepts/qa-e2e-automation) — ogólny stos QA i kontrakt transportu live
- [Kanał QA](/pl/channels/qa-channel) — syntetyczny adapter kanału dla scenariuszy opartych na repozytorium
- [Testowanie](/pl/help/testing) — uruchamianie testów i dodawanie pokrycia QA
- [Matrix](/pl/channels/matrix) — testowany Plugin kanału
