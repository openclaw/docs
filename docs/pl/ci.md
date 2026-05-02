---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI zostało uruchomione albo nie zostało uruchomione
    - Debugujesz nieudane sprawdzenie GitHub Actions
    - Koordynujesz wykonanie lub ponowne wykonanie walidacji wydania
    - Zmieniasz mechanizm wysyłania ClawSweeper lub przekazywanie aktywności GitHub
summary: Graf zadań CI, bramki zakresu, parasole wydań i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-05-02T09:44:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39af4afcb3e7c847c44a9d47513ac4b99c62d13fb139ece0bee979f24687ea38
    source_path: ci.md
    workflow: 16
---

OpenClaw CI działa przy każdym wypchnięciu do `main` i każdym pull requeście. Zadanie `preflight` klasyfikuje różnicę i wyłącza kosztowne ścieżki, gdy zmieniły się tylko niepowiązane obszary. Ręczne uruchomienia `workflow_dispatch` celowo pomijają inteligentne zawężanie zakresu i rozwijają pełny graf dla kandydatów do wydania oraz szerokiej walidacji. Ścieżki Androida pozostają opcjonalne przez `include_android`. Pokrycie Plugin tylko dla wydań znajduje się w osobnym przepływie pracy [`Plugin Prerelease`](#plugin-prerelease) i działa tylko z [`Full Release Validation`](#full-release-validation) albo po jawnym ręcznym uruchomieniu.

## Przegląd potoku

| Zadanie                          | Cel                                                                                          | Kiedy działa                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Wykrywa zmiany tylko w dokumentacji, zmienione zakresy, zmienione Plugin oraz buduje manifest CI | Zawsze przy niedraftowych wypchnięciach i PR-ach |
| `security-scm-fast`              | Wykrywanie kluczy prywatnych i audyt przepływu pracy przez `zizmor`                          | Zawsze przy niedraftowych wypchnięciach i PR-ach |
| `security-dependency-audit`      | Audyt produkcyjnego lockfile bez instalowania zależności względem advisory npm                | Zawsze przy niedraftowych wypchnięciach i PR-ach |
| `security-fast`                  | Wymagany agregat dla szybkich zadań bezpieczeństwa                                           | Zawsze przy niedraftowych wypchnięciach i PR-ach |
| `check-dependencies`             | Produkcyjny przebieg Knip tylko dla zależności oraz strażnik allowlisty nieużywanych plików  | Zmiany istotne dla Node            |
| `build-artifacts`                | Buduje `dist/`, Control UI, sprawdzenia zbudowanych artefaktów i artefakty wielokrotnego użytku dla zadań podrzędnych | Zmiany istotne dla Node            |
| `checks-fast-core`               | Szybkie linuksowe ścieżki poprawności, takie jak sprawdzenia bundled/plugin-contract/protocol | Zmiany istotne dla Node            |
| `checks-fast-contracts-channels` | Szardowane sprawdzenia kontraktów kanałów ze stabilnym zagregowanym wynikiem sprawdzenia     | Zmiany istotne dla Node            |
| `checks-node-core-test`          | Szardy testów rdzenia Node, z wyłączeniem kanałów, bundled, kontraktów i ścieżek Plugin      | Zmiany istotne dla Node            |
| `check`                          | Szardowany odpowiednik głównej lokalnej bramki: typy produkcyjne, lint, strażniki, typy testów i strict smoke | Zmiany istotne dla Node            |
| `check-additional`               | Architektura, granice, strażniki powierzchni Plugin, granice pakietów i szardy gateway-watch | Zmiany istotne dla Node            |
| `build-smoke`                    | Testy smoke zbudowanego CLI i smoke pamięci startowej                                        | Zmiany istotne dla Node            |
| `checks`                         | Weryfikator testów kanałów zbudowanych artefaktów                                            | Zmiany istotne dla Node            |
| `checks-node-compat-node22`      | Budowanie zgodności z Node 22 i ścieżka smoke                                                | Ręczne uruchomienie CI dla wydań   |
| `check-docs`                     | Formatowanie dokumentacji, lint i sprawdzenia uszkodzonych linków                            | Dokumentacja zmieniona             |
| `skills-python`                  | Ruff + pytest dla Skills opartych na Pythonie                                                | Zmiany istotne dla Skills Pythona  |
| `checks-windows`                 | Testy procesów/ścieżek specyficzne dla Windows oraz regresje współdzielonych specyfikatorów importu runtime | Zmiany istotne dla Windows         |
| `macos-node`                     | Ścieżka testów TypeScript na macOS używająca współdzielonych zbudowanych artefaktów          | Zmiany istotne dla macOS           |
| `macos-swift`                    | Swift lint, build i testy dla aplikacji macOS                                                | Zmiany istotne dla macOS           |
| `android`                        | Testy jednostkowe Androida dla obu wariantów oraz jedno zbudowanie debug APK                 | Zmiany istotne dla Androida        |
| `test-performance-agent`         | Codzienna optymalizacja wolnych testów przez Codex po zaufanej aktywności                    | Sukces CI na main albo ręczne uruchomienie |

## Kolejność szybkiego przerywania

1. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki w tym zadaniu, a nie samodzielne zadania.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` szybko kończą się niepowodzeniem bez czekania na cięższe zadania artefaktów i macierzy platform.
3. `build-artifacts` nakłada się z szybkimi ścieżkami Linuksa, aby konsumenci podrzędni mogli startować, gdy tylko współdzielony build będzie gotowy.
4. Cięższe ścieżki platform i runtime rozwijają się potem: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowsze wypchnięcie trafi do tego samego PR-a albo referencji `main`. Traktuj to jako szum CI, chyba że najnowsze uruchomienie dla tej samej referencji również kończy się niepowodzeniem. Zagregowane sprawdzenia szardów używają `!cancelled() && always()`, więc nadal raportują normalne awarie szardów, ale nie ustawiają się w kolejce po tym, jak cały przepływ pracy został już zastąpiony. Automatyczny klucz współbieżności CI jest wersjonowany (`CI-v7-*`), aby zombie po stronie GitHuba w starej grupie kolejki nie mogło bezterminowo blokować nowszych uruchomień main. Ręczne uruchomienia pełnego zestawu używają `CI-manual-v1-*` i nie anulują uruchomień w toku.

## Zakres i trasowanie

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest pokryta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`. Ręczne uruchomienie pomija wykrywanie changed-scope i sprawia, że manifest preflight zachowuje się tak, jakby zmienił się każdy obszar objęty zakresem.

- **Edycje przepływów pracy CI** walidują graf Node CI oraz linting przepływów pracy, ale same nie wymuszają natywnych buildów Windows, Androida ani macOS; te ścieżki platform pozostają zawężone do zmian w źródłach platform.
- **Edycje wyłącznie trasowania CI, wybrane tanie edycje fixtures testów rdzenia oraz wąskie edycje pomocników/test-routing kontraktu Plugin** używają szybkiej ścieżki manifestu tylko dla Node: `preflight`, bezpieczeństwo i jedno zadanie `checks-fast-core`. Ta ścieżka pomija artefakty builda, zgodność Node 22, kontrakty kanałów, pełne szardy rdzenia, szardy bundled-plugin i dodatkowe macierze strażników, gdy zmiana ogranicza się do powierzchni trasowania lub pomocników, które szybkie zadanie ćwiczy bezpośrednio.
- **Sprawdzenia Node dla Windows** są zawężone do specyficznych dla Windows wrapperów procesów/ścieżek, pomocników runnerów npm/pnpm/UI, konfiguracji menedżera pakietów i powierzchni przepływów pracy CI, które wykonują tę ścieżkę; niepowiązane zmiany źródeł, Plugin, install-smoke i zmian tylko w testach pozostają na linuksowych ścieżkach Node.

Najwolniejsze rodziny testów Node są dzielone lub balansowane tak, aby każde zadanie pozostało małe bez nadmiernej rezerwacji runnerów: kontrakty kanałów działają jako trzy ważone szardy, małe ścieżki jednostkowe rdzenia są parowane, auto-reply działa jako czterech zbalansowanych workerów (z poddrzewem reply podzielonym na szardy agent-runner, dispatch i commands/state-routing), a agentowe konfiguracje Gateway/Plugin są rozłożone na istniejące agentowe zadania Node tylko dla źródeł zamiast czekać na zbudowane artefakty. Szerokie testy przeglądarkowe, QA, media i różne testy Plugin używają swoich dedykowanych konfiguracji Vitest zamiast współdzielonego catch-all Plugin. Szardy include-pattern zapisują wpisy czasowe przy użyciu nazwy szardu CI, dzięki czemu `.artifacts/vitest-shard-timings.json` może odróżnić całą konfigurację od filtrowanego szardu. `check-additional` trzyma razem pracę kompilacji/canary granic pakietów i oddziela architekturę topologii runtime od pokrycia gateway watch; szard strażnika granic uruchamia swoje małe niezależne strażniki współbieżnie w jednym zadaniu. Gateway watch, testy kanałów i szard granicy wsparcia rdzenia działają współbieżnie w `build-artifacts` po zbudowaniu `dist/` i `dist-runtime/`.

Android CI uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a potem buduje Play debug APK. Wariant third-party nie ma osobnego zestawu źródeł ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje wariant z flagami SMS/call-log BuildConfig, unikając jednocześnie duplikowania zadania pakowania debug APK przy każdym wypchnięciu istotnym dla Androida.

Szard `check-dependencies` uruchamia `pnpm deadcode:dependencies` (produkcyjny przebieg Knip tylko dla zależności przypięty do najnowszej wersji Knip, z wyłączonym minimalnym wiekiem wydania pnpm dla instalacji `dlx`) oraz `pnpm deadcode:unused-files`, które porównuje produkcyjne ustalenia Knip dotyczące nieużywanych plików z `scripts/deadcode-unused-files.allowlist.mjs`. Strażnik nieużywanych plików kończy się niepowodzeniem, gdy PR dodaje nowy, niezweryfikowany nieużywany plik albo pozostawia nieaktualny wpis allowlisty, zachowując jednocześnie zamierzone dynamiczne powierzchnie Plugin, wygenerowane, build, live-test i mosty pakietów, których Knip nie może statycznie rozwiązać.

## Przekazywanie aktywności ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` jest mostem po stronie docelowej z aktywności repozytorium OpenClaw do ClawSweeper. Nie pobiera ani nie wykonuje niezaufanego kodu pull requesta. Przepływ pracy tworzy token GitHub App z `CLAWSWEEPER_APP_PRIVATE_KEY`, a następnie wysyła zwarte ładunki `repository_dispatch` do `openclaw/clawsweeper`.

Przepływ pracy ma cztery ścieżki:

- `clawsweeper_item` dla dokładnych żądań przeglądu issue i pull requestów;
- `clawsweeper_comment` dla jawnych poleceń ClawSweeper w komentarzach issue;
- `clawsweeper_commit_review` dla żądań przeglądu na poziomie commita przy wypchnięciach do `main`;
- `github_activity` dla ogólnej aktywności GitHub, którą agent ClawSweeper może przejrzeć.

Ścieżka `github_activity` przekazuje tylko znormalizowane metadane: typ zdarzenia, akcję, aktora, repozytorium, numer elementu, URL, tytuł, stan i krótkie wyciągi dla komentarzy lub przeglądów, jeśli są obecne. Celowo unika przekazywania pełnej treści webhooka. Odbierający przepływ pracy w `openclaw/clawsweeper` to `.github/workflows/github-activity.yml`, który publikuje znormalizowane zdarzenie do haka OpenClaw Gateway dla agenta ClawSweeper.

Ogólna aktywność jest obserwacją, a nie domyślnym dostarczaniem. Agent ClawSweeper otrzymuje cel Discorda w swoim promptcie i powinien publikować na `#clawsweeper` tylko wtedy, gdy zdarzenie jest zaskakujące, wykonalne, ryzykowne albo operacyjnie użyteczne. Rutynowe otwarcia, edycje, ruch botów, zduplikowany szum webhooków i normalny ruch przeglądów powinny skutkować `NO_REPLY`.

Traktuj tytuły, komentarze, treści, teksty przeglądów, nazwy gałęzi i komunikaty commitów z GitHuba jako niezaufane dane w całej tej ścieżce. Są one wejściem do podsumowywania i triage, a nie instrukcjami dla przepływu pracy albo runtime agenta.

## Ręczne uruchomienia

Ręczne uruchomienia CI działają na tym samym grafie zadań co normalne CI, ale wymuszają włączenie każdej nieandroidowej ścieżki o zawężonym zakresie: szardy Linux Node, szardy bundled-plugin, kontrakty kanałów, zgodność Node 22, `check`, `check-additional`, build smoke, sprawdzenia dokumentacji, Python Skills, Windows, macOS i i18n Control UI. Samodzielne ręczne uruchomienia CI uruchamiają Androida tylko z `include_android=true`; parasol pełnego wydania włącza Androida przez przekazanie `include_android=true`. Statyczne sprawdzenia prerelease Plugin, szard `agentic-plugins` tylko dla wydań, pełny wsadowy przegląd Plugin oraz ścieżki Docker prerelease Plugin są wyłączone z CI. Zestaw Docker prerelease działa tylko wtedy, gdy `Full Release Validation` uruchamia osobny przepływ pracy `Plugin Prerelease` z włączoną bramką walidacji wydania.

Ręczne uruchomienia używają unikalnej grupy współbieżności, więc pełny zestaw dla kandydata do wydania nie jest anulowany przez inne wypchnięcie albo uruchomienie PR na tej samej referencji. Opcjonalne wejście `target_ref` pozwala zaufanemu wywołującemu uruchomić ten graf względem gałęzi, tagu albo pełnego SHA commita, używając pliku przepływu pracy z wybranej referencji uruchomienia.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnery

| Runner                           | Zadania                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, szybkie zadania i agregaty zabezpieczeń (`security-scm-fast`, `security-dependency-audit`, `security-fast`), szybkie kontrole protokołu/kontraktu/wbudowanych elementów, podzielone kontrole kontraktów kanałów, fragmenty `check` poza lintem, fragmenty i agregaty `check-additional`, weryfikatory agregatów testów Node, kontrole dokumentacji, Skills Pythona, workflow-sanity, labeler, auto-response; preflight install-smoke również używa hostowanego przez GitHub Ubuntu, aby macierz Blacksmith mogła wcześniej wejść do kolejki |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lżejsze fragmenty rozszerzeń, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` i `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragmenty testów Linux Node, fragmenty testów wbudowanych Pluginów, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (na tyle wrażliwy na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało); buildy Dockera install-smoke (czas oczekiwania w kolejce dla 32 vCPU kosztował więcej, niż oszczędzał)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` w `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` w `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## Lokalne odpowiedniki

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Pełna walidacja wydania

`Full Release Validation` to ręczny nadrzędny workflow do „uruchomienia wszystkiego przed wydaniem”. Przyjmuje gałąź, tag lub pełny SHA commita, uruchamia ręczny workflow `CI` z tym celem, uruchamia `Plugin Prerelease` dla dowodów dotyczących wyłącznie wydania Pluginów/pakietów/statycznych zasobów/Dockera oraz uruchamia `OpenClaw Release Checks` dla install smoke, akceptacji pakietu, zestawów ścieżki wydania Dockera, live/E2E, OpenWebUI, parytetu QA Lab, Matrix i ścieżek Telegram. Z `rerun_group=all` i `release_profile=full` uruchamia również `NPM Telegram Beta E2E` wobec artefaktu `release-package-under-test` z kontroli wydania. Po opublikowaniu przekaż `npm_telegram_package_spec`, aby ponownie uruchomić tę samą ścieżkę pakietu Telegram wobec opublikowanego pakietu npm.

Zobacz [Pełną walidację wydania](/pl/reference/full-release-validation), aby poznać
macierz etapów, dokładne nazwy zadań workflow, różnice profili, artefakty i
uchwyty ukierunkowanego ponownego uruchamiania.

`OpenClaw Release Publish` to ręczny mutujący workflow wydania. Uruchom go
z `release/YYYY.M.D` lub `main` po utworzeniu tagu wydania i po powodzeniu
preflightu npm OpenClaw. Weryfikuje `pnpm plugins:sync:check`,
uruchamia `Plugin NPM Release` dla wszystkich publikowalnych pakietów Pluginów,
uruchamia `Plugin ClawHub Release` dla tego samego SHA wydania i dopiero wtedy
uruchamia `OpenClaw NPM Release` z zapisanym `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Aby uzyskać dowód przypiętego commita na szybko zmieniającej się gałęzi, użyj
helpera zamiast `gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refy dispatch workflow GitHub muszą być gałęziami lub tagami, a nie surowymi SHA commitów. Helper wypycha tymczasową gałąź `release-ci/<sha>-...` na docelowym SHA, uruchamia `Full Release Validation` z tego przypiętego refa, weryfikuje, że `headSha` każdego workflow potomnego pasuje do celu, i usuwa tymczasową gałąź po zakończeniu uruchomienia. Nadrzędny weryfikator również kończy się niepowodzeniem, jeśli dowolny workflow potomny uruchomił się na innym SHA.

`release_profile` kontroluje zakres live/dostawców przekazywany do kontroli wydania. Ręczne workflow wydania domyślnie używają `stable`; użyj `full` tylko wtedy, gdy celowo chcesz szeroką doradczą macierz dostawców/mediów.

- `minimum` zachowuje najszybsze krytyczne dla wydania ścieżki OpenAI/rdzenia.
- `stable` dodaje stabilny zestaw dostawców/backendów.
- `full` uruchamia szeroką doradczą macierz dostawców/mediów.

Nadrzędny workflow zapisuje identyfikatory uruchomionych workflow potomnych, a końcowe zadanie `Verify full validation` ponownie sprawdza bieżące wyniki workflow potomnych i dołącza tabele najwolniejszych zadań dla każdego uruchomienia potomnego. Jeśli workflow potomny zostanie uruchomiony ponownie i zakończy się powodzeniem, uruchom ponownie tylko nadrzędne zadanie weryfikatora, aby odświeżyć wynik nadrzędny i podsumowanie czasów.

Do odzyskiwania zarówno `Full Release Validation`, jak i `OpenClaw Release Checks` przyjmują `rerun_group`. Użyj `all` dla kandydata do wydania, `ci` tylko dla normalnego pełnego potomnego CI, `plugin-prerelease` tylko dla potomnego prerelease Pluginów, `release-checks` dla każdego potomnego wydania albo węższej grupy: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` lub `npm-telegram` w nadrzędnym workflow. Dzięki temu ponowne uruchomienie nieudanego środowiska wydania pozostaje ograniczone po ukierunkowanej poprawce.

`OpenClaw Release Checks` używa zaufanego refa workflow, aby raz rozwiązać wybrany ref do tarballa `release-package-under-test`, a następnie przekazuje ten artefakt zarówno do workflow Dockera ścieżki wydania live/E2E, jak i do fragmentu akceptacji pakietu. Utrzymuje to spójne bajty pakietu między środowiskami wydania i zapobiega ponownemu pakowaniu tego samego kandydata w wielu zadaniach potomnych.

Zduplikowane uruchomienia `Full Release Validation` dla `ref=main` i `rerun_group=all`
zastępują starszy nadrzędny workflow. Monitor nadrzędny anuluje każdy workflow
potomny, który już uruchomił, gdy nadrzędny workflow zostanie anulowany, więc
nowsza walidacja main nie czeka za przestarzałym dwugodzinnym uruchomieniem
release-check. Walidacja gałęzi/tagu wydania i ukierunkowane grupy ponownych
uruchomień zachowują `cancel-in-progress: false`.

## Fragmenty live i E2E

Potomny workflow release live/E2E zachowuje szerokie natywne pokrycie `pnpm test:live`, ale uruchamia je jako nazwane fragmenty przez `scripts/test-live-shard.mjs` zamiast jednego zadania szeregowego:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- filtrowane według dostawcy zadania `native-live-src-gateway-profiles`
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- podzielone fragmenty audio/wideo mediów i filtrowane według dostawcy fragmenty muzyczne

Zachowuje to to samo pokrycie plików, a jednocześnie ułatwia ponowne uruchamianie i diagnozowanie wolnych awarii dostawców live. Zbiorcze nazwy fragmentów `native-live-extensions-o-z`, `native-live-extensions-media` i `native-live-extensions-media-music` pozostają poprawne dla ręcznych jednorazowych ponownych uruchomień.

Natywne fragmenty live mediów działają w `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, budowanym przez workflow `Live Media Runner Image`. Ten obraz wstępnie instaluje `ffmpeg` i `ffprobe`; zadania mediów jedynie weryfikują binaria przed konfiguracją. Utrzymuj zestawy live oparte na Dockerze na zwykłych runnerach Blacksmith — zadania kontenerowe nie są właściwym miejscem do uruchamiania zagnieżdżonych testów Dockera.

Fragmenty live modelu/backendu oparte na Dockerze używają osobnego współdzielonego obrazu `ghcr.io/openclaw/openclaw-live-test:<sha>` dla każdego wybranego commita. Workflow wydania live buduje i publikuje ten obraz raz, a następnie fragmenty live modelu Docker, Gateway podzielonego według providerów, backendu CLI, wiązania ACP i harnessa Codex działają z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Fragmenty Docker dla Gateway mają jawne limity `timeout` na poziomie skryptu, niższe niż limit czasu zadania workflow, aby zablokowany kontener lub ścieżka czyszczenia szybko kończyły się niepowodzeniem zamiast zużywać cały budżet sprawdzania wydania. Jeśli te fragmenty niezależnie przebudowują pełny docelowy obraz Docker ze źródeł, uruchomienie wydania jest błędnie skonfigurowane i zmarnuje czas rzeczywisty na zduplikowane budowanie obrazów.

## Akceptacja pakietu

Użyj `Package Acceptance`, gdy pytanie brzmi: „czy ten instalowalny pakiet OpenClaw działa jako produkt?”. Różni się to od normalnego CI: normalne CI waliduje drzewo źródeł, natomiast akceptacja pakietu waliduje pojedynczy tarball przez ten sam harness Docker E2E, którego użytkownicy używają po instalacji lub aktualizacji.

### Zadania

1. `resolve_package` pobiera `workflow_ref`, rozwiązuje jednego kandydata pakietu, zapisuje `.artifacts/docker-e2e-package/openclaw-current.tgz`, zapisuje `.artifacts/docker-e2e-package/package-candidate.json`, przesyła oba jako artefakt `package-under-test` oraz wypisuje źródło, referencję workflow, referencję pakietu, wersję, SHA-256 i profil w podsumowaniu kroku GitHub.
2. `docker_acceptance` wywołuje `openclaw-live-and-e2e-checks-reusable.yml` z `ref=workflow_ref` i `package_artifact_name=package-under-test`. Workflow wielokrotnego użytku pobiera ten artefakt, waliduje inwentarz tarballa, w razie potrzeby przygotowuje obrazy Docker z digestem pakietu i uruchamia wybrane ścieżki Docker wobec tego pakietu zamiast pakować checkout workflow. Gdy profil wybiera wiele docelowych `docker_lanes`, workflow wielokrotnego użytku przygotowuje pakiet i współdzielone obrazy raz, a następnie rozdziela te ścieżki jako równoległe docelowe zadania Docker z unikalnymi artefaktami.
3. `package_telegram` opcjonalnie wywołuje `NPM Telegram Beta E2E`. Działa, gdy `telegram_mode` nie jest `none`, i instaluje ten sam artefakt `package-under-test`, gdy akceptacja pakietu go rozwiązała; samodzielne uruchomienie Telegram nadal może zainstalować opublikowaną specyfikację npm.
4. `summary` powoduje niepowodzenie workflow, jeśli rozwiązanie pakietu, akceptacja Docker albo opcjonalna ścieżka Telegram zakończyły się niepowodzeniem.

### Źródła kandydatów

- `source=npm` akceptuje wyłącznie `openclaw@beta`, `openclaw@latest` albo dokładną wersję wydania OpenClaw, taką jak `openclaw@2026.4.27-beta.2`. Używaj tego do akceptacji opublikowanych wersji beta/stabilnych.
- `source=ref` pakuje zaufaną gałąź, tag albo pełny SHA commita `package_ref`. Resolver pobiera gałęzie/tagi OpenClaw, weryfikuje, że wybrany commit jest osiągalny z historii gałęzi repozytorium albo tagu wydania, instaluje zależności w odłączonym worktree i pakuje go za pomocą `scripts/package-openclaw-for-docker.mjs`.
- `source=url` pobiera HTTPS `.tgz`; `package_sha256` jest wymagane.
- `source=artifact` pobiera jeden `.tgz` z `artifact_run_id` i `artifact_name`; `package_sha256` jest opcjonalne, ale powinno być podane dla artefaktów udostępnianych zewnętrznie.

Trzymaj `workflow_ref` i `package_ref` osobno. `workflow_ref` to zaufany kod workflow/harnessa, który uruchamia test. `package_ref` to commit źródłowy, który zostaje spakowany, gdy `source=ref`. Pozwala to bieżącemu harnessowi testowemu walidować starsze zaufane commity źródłowe bez uruchamiania starej logiki workflow.

### Profile zestawu

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — pełne fragmenty ścieżki wydania Docker z OpenWebUI
- `custom` — dokładne `docker_lanes`; wymagane, gdy `suite_profile=custom`

Profil `package` używa pokrycia pluginów offline, aby walidacja opublikowanego pakietu nie była zależna od dostępności live ClawHub. Opcjonalna ścieżka Telegram ponownie używa artefaktu `package-under-test` w `NPM Telegram Beta E2E`, z pozostawioną ścieżką opublikowanej specyfikacji npm dla samodzielnych uruchomień.

Dedykowaną politykę testowania aktualizacji i pluginów, w tym lokalne polecenia,
ścieżki Docker, dane wejściowe akceptacji pakietu, domyślne ustawienia wydań i triage awarii,
zobacz w [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins).

Sprawdzenia wydania wywołują akceptację pakietu z `source=artifact`, przygotowanym artefaktem pakietu wydania, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=release-history`, `published_upgrade_survivor_scenarios=reported-issues` i `telegram_mode=mock-openai`. Dzięki temu dowód migracji pakietu, aktualizacji, czyszczenia przestarzałych zależności pluginów, pluginu offline, `plugin-update` i Telegram pozostaje na tym samym rozwiązanym tarballu pakietu. Sprawdzenia wydań dla wielu systemów operacyjnych nadal obejmują onboarding, instalator i zachowanie platformy specyficzne dla systemu operacyjnego; walidacja produktu w zakresie pakietu/aktualizacji powinna zaczynać się od akceptacji pakietu. Ścieżka Docker `published-upgrade-survivor` waliduje jedną opublikowaną bazę pakietu na uruchomienie. W akceptacji pakietu rozwiązany tarball `package-under-test` zawsze jest kandydatem, a `published_upgrade_survivor_baseline` wybiera zapasową opublikowaną bazę, domyślnie `openclaw@latest`; polecenia ponownego uruchomienia nieudanej ścieżki zachowują tę bazę. Ustaw `published_upgrade_survivor_baselines=release-history`, aby rozszerzyć ścieżkę na zdeduplikowaną macierz historii: sześć najnowszych stabilnych wydań, `2026.4.23` oraz najnowsze stabilne wydanie sprzed `2026-03-15`. Ustaw `published_upgrade_survivor_scenarios=reported-issues`, aby rozszerzyć te same bazy na fixtures ukształtowane jak zgłoszenia dla konfiguracji Feishu, zachowanych plików bootstrap/persona, ścieżek logów z tyldą i przestarzałych korzeni zależności starszych pluginów. Osobny workflow `Update Migration` używa ścieżki Docker `update-migration` z `all-since-2026.4.23` i `plugin-deps-cleanup`, gdy pytanie dotyczy wyczerpującego czyszczenia opublikowanych aktualizacji, a nie normalnego zakresu Full Release CI. Lokalne uruchomienia agregujące mogą przekazywać dokładne specyfikacje pakietów przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, zachować pojedynczą ścieżkę z `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, na przykład `openclaw@2026.4.15`, albo ustawić `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` dla macierzy scenariuszy. Opublikowana ścieżka konfiguruje bazę za pomocą wbudowanej receptury polecenia `openclaw config set`, zapisuje kroki receptury w `summary.json` i sonduje `/healthz`, `/readyz` oraz status RPC po starcie Gateway. Świeże ścieżki pakietu i instalatora Windows również weryfikują, że zainstalowany pakiet może zaimportować nadpisanie sterowania przeglądarką z surowej bezwzględnej ścieżki Windows. Test dymny tury agenta OpenAI dla wielu systemów operacyjnych domyślnie używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy jest ustawione, w przeciwnym razie `openai/gpt-5.5`, aby dowód instalacji i Gateway pozostał na preferowanym modelu testowym GPT-5.

### Okna zgodności ze starszymi wersjami

Akceptacja pakietu ma ograniczone okna zgodności ze starszymi wersjami dla już opublikowanych pakietów. Pakiety do `2026.4.25` włącznie, w tym `2026.4.25-beta.*`, mogą używać ścieżki zgodności:

- znane prywatne wpisy QA w `dist/postinstall-inventory.json` mogą wskazywać pliki pominięte w tarballu;
- `doctor-switch` może pominąć podprzypadek trwałości `gateway install --wrapper`, gdy pakiet nie udostępnia tej flagi;
- `update-channel-switch` może przycinać brakujące `pnpm.patchedDependencies` z fałszywego fixture git wyprowadzonego z tarballa i może logować brak utrwalonego `update.channel`;
- testy dymne pluginów mogą odczytywać starsze lokalizacje rekordów instalacji albo akceptować brak utrwalenia rekordu instalacji marketplace;
- `plugin-update` może zezwolić na migrację metadanych konfiguracji, nadal wymagając, aby rekord instalacji i zachowanie bez ponownej instalacji pozostały niezmienione.

Opublikowany pakiet `2026.4.26` może także ostrzegać o plikach znaczników metadanych lokalnego buildu, które zostały już wydane. Późniejsze pakiety muszą spełniać nowoczesne kontrakty; te same warunki kończą się niepowodzeniem zamiast ostrzeżeniem lub pominięciem.

### Przykłady

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Podczas debugowania nieudanego uruchomienia akceptacji pakietu zacznij od podsumowania `resolve_package`, aby potwierdzić źródło pakietu, wersję i SHA-256. Następnie sprawdź podrzędne uruchomienie `docker_acceptance` i jego artefakty Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logi ścieżek, czasy faz i polecenia ponownego uruchomienia. Preferuj ponowne uruchomienie nieudanego profilu pakietu albo dokładnych ścieżek Docker zamiast ponownego uruchamiania pełnej walidacji wydania.

## Test dymny instalacji

Osobny workflow `Install Smoke` ponownie używa tego samego skryptu zakresu przez własne zadanie `preflight`. Dzieli pokrycie testów dymnych na `run_fast_install_smoke` i `run_full_install_smoke`.

- **Szybka ścieżka** działa dla pull requestów dotykających powierzchni Docker/pakietu, zmian pakietu/manifestu bundlowanego pluginu albo powierzchni głównego pluginu/kanału/Gateway/Plugin SDK, które ćwiczą zadania testu dymnego Docker. Zmiany wyłącznie w źródłach bundlowanych pluginów, edycje dotyczące tylko testów i edycje dotyczące tylko dokumentacji nie rezerwują workerów Docker. Szybka ścieżka buduje obraz głównego Dockerfile raz, sprawdza CLI, uruchamia test dymny CLI usuwania współdzielonego workspace agentów, uruchamia kontenerowy e2e `gateway-network`, weryfikuje argument buildu bundlowanego rozszerzenia i uruchamia ograniczony profil Docker bundlowanego pluginu z 240-sekundowym łącznym limitem czasu polecenia (każde uruchomienie Docker scenariusza jest ograniczone osobno).
- **Pełna ścieżka** zachowuje instalację pakietu QR i pokrycie Docker instalatora/aktualizacji dla nocnych zaplanowanych uruchomień, uruchomień ręcznych, sprawdzeń wydania wywoływanych przez workflow oraz pull requestów, które rzeczywiście dotykają powierzchni instalatora/pakietu/Docker. W trybie pełnym install-smoke przygotowuje albo ponownie używa jednego obrazu testu dymnego GHCR z głównego Dockerfile dla docelowego SHA, a następnie uruchamia instalację pakietu QR, testy dymne głównego Dockerfile/Gateway, testy dymne instalatora/aktualizacji oraz szybki Docker E2E bundlowanego pluginu jako osobne zadania, aby praca instalatora nie czekała za testami dymnymi obrazu głównego.

Wypchnięcia na `main` (w tym commity scalające) nie wymuszają pełnej ścieżki; gdy logika zakresu zmian zażądałaby pełnego pokrycia przy wypchnięciu, workflow zachowuje szybki test dymny Docker i pozostawia pełny test dymny instalacji walidacji nocnej albo wydania.

Wolny test dymny providera obrazu przy globalnej instalacji Bun jest osobno bramkowany przez `run_bun_global_install_smoke`. Działa w harmonogramie nocnym i z workflow sprawdzeń wydania, a ręczne uruchomienia `Install Smoke` mogą się do niego włączyć, ale pull requesty i wypchnięcia na `main` tego nie robią. Testy Docker QR i instalatora zachowują własne Dockerfile skupione na instalacji.

## Lokalne Docker E2E

`pnpm test:docker:all` wstępnie buduje jeden współdzielony obraz live-test, pakuje OpenClaw raz jako tarball npm i buduje dwa współdzielone obrazy `scripts/e2e/Dockerfile`:

- goły runner Node/Git dla ścieżek instalatora/aktualizacji/zależności pluginów;
- funkcjonalny obraz, który instaluje ten sam tarball w `/app` dla normalnych ścieżek funkcjonalności.

Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`, logika planisty znajduje się w `scripts/lib/docker-e2e-plan.mjs`, a mechanizm uruchamiający wykonuje tylko wybrany plan. Planista wybiera obraz dla każdej ścieżki za pomocą `OPENCLAW_DOCKER_E2E_BARE_IMAGE` i `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, a następnie uruchamia ścieżki z `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametry dostrajania

| Zmienna                                | Domyślnie | Cel                                                                                           |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Liczba slotów puli głównej dla normalnych ścieżek.                                            |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Liczba slotów puli końcowej wrażliwej na dostawców.                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limit współbieżnych ścieżek live, aby dostawcy nie ograniczali przepustowości.                 |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | Limit współbieżnych ścieżek instalacji npm.                                                    |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limit współbieżnych ścieżek z wieloma usługami.                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Opóźnienie między startami ścieżek, aby uniknąć burz tworzenia w demonie Docker; ustaw `0`, aby je wyłączyć. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Zapasowy limit czasu dla każdej ścieżki (120 minut); wybrane ścieżki live/końcowe używają ciaśniejszych limitów. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | nieustawione | `1` wypisuje plan planisty bez uruchamiania ścieżek.                                         |
| `OPENCLAW_DOCKER_ALL_LANES`            | nieustawione | Rozdzielona przecinkami dokładna lista ścieżek; pomija smoke cleanup, aby agenci mogli odtworzyć jedną nieudaną ścieżkę. |

Ścieżka cięższa niż jej efektywny limit nadal może wystartować z pustej puli, po czym działa sama, dopóki nie zwolni pojemności. Lokalny agregat wykonuje wstępne kontrole Docker, usuwa przestarzałe kontenery OpenClaw E2E, emituje status aktywnych ścieżek, zapisuje czasy ścieżek dla kolejności od najdłuższych i domyślnie przestaje planować nowe ścieżki z puli po pierwszym niepowodzeniu.

### Przepływ pracy live/E2E wielokrotnego użytku

Przepływ pracy live/E2E wielokrotnego użytku pyta `scripts/test-docker-all.mjs --plan-json`, jaki pakiet, rodzaj obrazu, obraz live, ścieżka i pokrycie poświadczeń są wymagane. `scripts/docker-e2e.mjs` następnie przekształca ten plan na wyjścia i podsumowania GitHub. Albo pakuje OpenClaw przez `scripts/package-openclaw-for-docker.mjs`, pobiera artefakt pakietu z bieżącego przebiegu, albo pobiera artefakt pakietu z `package_artifact_run_id`; waliduje inwentarz archiwum tar; buduje i wypycha obrazy GHCR Docker E2E bare/functional oznaczone digestem pakietu przez cache warstw Docker Blacksmith, gdy plan wymaga ścieżek z zainstalowanym pakietem; oraz ponownie używa podanych wejść `docker_e2e_bare_image`/`docker_e2e_functional_image` albo istniejących obrazów z digestem pakietu zamiast budować je ponownie. Pobieranie obrazów Docker jest ponawiane z ograniczonym 180-sekundowym limitem czasu na próbę, aby zablokowany strumień rejestru/cache szybko ponowił próbę zamiast zużywać większość ścieżki krytycznej CI.

### Fragmenty ścieżki wydania

Pokrycie Docker dla wydania uruchamia mniejsze zadania podzielone na fragmenty z `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby każdy fragment pobierał tylko potrzebny rodzaj obrazu i wykonywał wiele ścieżek przez ten sam ważony planista:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Obecne fragmenty Docker dla wydania to `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` oraz `plugins-runtime-install-a` do `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` i `plugins-integrations` pozostają agregującymi aliasami plugin/runtime. Alias ścieżki `install-e2e` pozostaje agregującym aliasem ręcznego ponownego uruchomienia dla obu ścieżek instalatora dostawców.

OpenWebUI jest włączany do `plugins-runtime-services`, gdy pełne pokrycie release-path tego wymaga, i zachowuje samodzielny fragment `openwebui` tylko dla uruchomień dotyczących wyłącznie OpenWebUI. Ścieżki aktualizacji dołączonych kanałów ponawiają próbę raz w przypadku przejściowych awarii sieci npm.

Każdy fragment przesyła `.artifacts/docker-tests/` z logami ścieżek, czasami, `summary.json`, `failures.json`, czasami faz, JSON planu planisty, tabelami wolnych ścieżek i poleceniami ponownego uruchomienia dla każdej ścieżki. Wejście `docker_lanes` przepływu pracy uruchamia wybrane ścieżki na przygotowanych obrazach zamiast zadań fragmentów, co ogranicza debugowanie nieudanej ścieżki do jednego ukierunkowanego zadania Docker oraz przygotowuje, pobiera lub ponownie używa artefaktu pakietu dla tego przebiegu; jeśli wybrana ścieżka jest ścieżką Docker live, ukierunkowane zadanie buduje lokalnie obraz testu live dla tego ponownego uruchomienia. Wygenerowane polecenia GitHub ponownego uruchomienia dla każdej ścieżki zawierają `package_artifact_run_id`, `package_artifact_name` oraz wejścia przygotowanych obrazów, gdy te wartości istnieją, aby nieudana ścieżka mogła ponownie użyć dokładnego pakietu i obrazów z nieudanego przebiegu.

```bash
pnpm test:docker:rerun <run-id>      # pobierz artefakty Docker i wypisz połączone oraz ukierunkowane polecenia ponownego uruchomienia dla poszczególnych ścieżek
pnpm test:docker:timings <summary>   # podsumowania wolnych ścieżek i ścieżki krytycznej faz
```

Zaplanowany przepływ pracy live/E2E uruchamia codziennie pełny zestaw Docker release-path.

## Plugin Prerelease

`Plugin Prerelease` zapewnia droższe pokrycie produktu/pakietu, więc jest osobnym przepływem pracy uruchamianym przez `Full Release Validation` albo przez jawnego operatora. Normalne pull requesty, wypchnięcia do `main` i samodzielne ręczne uruchomienia CI mają ten zestaw wyłączony. Równoważy testy dołączonych pluginów między ośmioma workerami rozszerzeń; te zadania shardów rozszerzeń uruchamiają do dwóch grup konfiguracji pluginów naraz z jednym workerem Vitest na grupę i większym stosem Node, aby partie pluginów ciężkie importami nie tworzyły dodatkowych zadań CI. Ścieżka prerelease Docker tylko dla wydań grupuje ukierunkowane ścieżki Docker w małe grupy, aby uniknąć rezerwowania dziesiątek runnerów dla zadań trwających od jednej do trzech minut.

## QA Lab

QA Lab ma dedykowane ścieżki CI poza głównym inteligentnie zakresowanym przepływem pracy.

- Przepływ pracy `Parity gate` uruchamia się przy pasujących zmianach w PR i ręcznym uruchomieniu; buduje prywatne środowisko uruchomieniowe QA i porównuje mockowane pakiety agentowe GPT-5.5 oraz Opus 4.6.
- Przepływ pracy `QA-Lab - All Lanes` uruchamia się co noc na `main` i przy ręcznym uruchomieniu; rozdziela mockowany parity gate, ścieżkę live Matrix oraz ścieżki live Telegram i Discord jako równoległe zadania. Zadania live używają środowiska `qa-live-shared`, a Telegram/Discord używają dzierżaw Convex.

Kontrole wydania uruchamiają ścieżki transportu live Matrix i Telegram z deterministycznym mockowanym dostawcą oraz modelami kwalifikowanymi jako mock (`mock-openai/gpt-5.5` i `mock-openai/gpt-5.5-alt`), aby kontrakt kanału był odizolowany od opóźnień modeli live i normalnego startu pluginu dostawcy. Gateway transportu live wyłącza wyszukiwanie pamięci, ponieważ parytet QA obejmuje zachowanie pamięci osobno; łączność dostawców jest pokrywana przez oddzielne zestawy live model, native provider i Docker provider.

Matrix używa `--profile fast` dla zaplanowanych bramek i bramek wydań, dodając `--fail-fast` tylko wtedy, gdy sprawdzony CLI to obsługuje. Domyślna wartość CLI i ręczne wejście przepływu pracy pozostają `all`; ręczne uruchomienie `matrix_profile=all` zawsze sharduje pełne pokrycie Matrix na zadania `transport`, `media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`.

`OpenClaw Release Checks` uruchamia także krytyczne dla wydania ścieżki QA Lab przed zatwierdzeniem wydania; jego bramka parytetu QA uruchamia pakiety kandydata i bazowe jako równoległe zadania ścieżek, a następnie pobiera oba artefakty do małego zadania raportu w celu końcowego porównania parytetu.

Nie umieszczaj ścieżki lądowania PR za `Parity gate`, chyba że zmiana rzeczywiście dotyka środowiska uruchomieniowego QA, parytetu pakietów modeli albo powierzchni należącej do przepływu pracy parytetu. Dla normalnych poprawek kanałów, konfiguracji, dokumentacji lub testów jednostkowych traktuj to jako opcjonalny sygnał i kieruj się zakresowanymi dowodami CI/kontroli.

## CodeQL

Przepływ pracy `CodeQL` jest celowo wąskim skanerem bezpieczeństwa pierwszego przejścia, a nie pełnym przeglądem repozytorium. Codzienne, ręczne i niedraftowe przebiegi strażnika pull requestów skanują kod przepływów pracy Actions oraz powierzchnie JavaScript/TypeScript o najwyższym ryzyku przy użyciu zapytań bezpieczeństwa o wysokiej pewności, filtrowanych do wysokiego/krytycznego `security-severity`.

Strażnik pull requestów pozostaje lekki: startuje tylko dla zmian pod `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` lub `src` i uruchamia tę samą macierz bezpieczeństwa o wysokiej pewności co zaplanowany przepływ pracy. Android i macOS CodeQL pozostają poza domyślnymi PR.

### Kategorie bezpieczeństwa

| Kategoria                                          | Powierzchnia                                                                                                                        |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`          | Auth, sekrety, piaskownica, cron i bazowy gateway                                                                                   |
| `/codeql-security-high/channel-runtime-boundary`   | Kontrakty implementacji kanału core oraz środowisko uruchomieniowe pluginu kanału, gateway, Plugin SDK, sekrety, punkty audytu      |
| `/codeql-security-high/network-ssrf-boundary`      | Powierzchnie core SSRF, parsowania IP, strażnika sieci, web-fetch i polityki SSRF w Plugin SDK                                      |
| `/codeql-security-high/mcp-process-tool-boundary`  | Serwery MCP, pomocniki wykonywania procesów, dostarczanie wychodzące i bramki wykonywania narzędzi agenta                           |
| `/codeql-security-high/plugin-trust-boundary`      | Powierzchnie zaufania instalacji Plugin, loadera, manifestu, rejestru, instalacji menedżera pakietów, ładowania źródeł i kontraktu pakietu Plugin SDK |

### Shardy bezpieczeństwa specyficzne dla platform

- `CodeQL Android Critical Security` — zaplanowany shard bezpieczeństwa Android. Buduje aplikację Android ręcznie dla CodeQL na najmniejszym runnerze Blacksmith Linux akceptowanym przez sanity przepływu pracy. Przesyła pod `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — cotygodniowy/ręczny shard bezpieczeństwa macOS. Buduje aplikację macOS ręcznie dla CodeQL na Blacksmith macOS, odfiltrowuje wyniki budowania zależności z przesyłanego SARIF i przesyła pod `/codeql-critical-security/macos`. Utrzymywany poza codziennymi domyślnymi przebiegami, ponieważ build macOS dominuje czas działania nawet wtedy, gdy jest czysty.

### Kategorie Critical Quality

`CodeQL Critical Quality` to odpowiadający shard niezwiązany z bezpieczeństwem. Uruchamia tylko zapytania jakości JavaScript/TypeScript o ważności błędu i niezwiązane z bezpieczeństwem na wąskich powierzchniach o wysokiej wartości na mniejszym runnerze Blacksmith Linux. Jego strażnik pull requestów jest celowo mniejszy niż profil zaplanowany: niedraftowe PR uruchamiają tylko odpowiadające shardy `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` i `plugin-sdk-reply-runtime` dla zmian w kodzie wykonywania poleceń/modeli/narzędzi agenta i wysyłki odpowiedzi, schematu konfiguracji/migracji/IO, auth/sekretów/piaskownicy/bezpieczeństwa, core kanału i środowiska uruchomieniowego dołączonego pluginu kanału, protokołu Gateway/metody serwera, glue środowiska uruchomieniowego pamięci/SDK, MCP/procesu/dostarczania wychodzącego, środowiska uruchomieniowego dostawcy/katalogu modeli, diagnostyki sesji/kolejek dostarczania, loadera pluginów, Plugin SDK/kontraktu pakietu albo środowiska uruchomieniowego odpowiedzi Plugin SDK. Zmiany konfiguracji CodeQL i przepływu pracy jakości uruchamiają wszystkie dwanaście shardów jakości PR.

Ręczne uruchomienie akceptuje:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Wąskie profile są hookami dydaktycznymi/iteracyjnymi do uruchamiania jednego fragmentu jakości w izolacji.

| Kategoria                                               | Powierzchnia                                                                                                                                                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kod granicy bezpieczeństwa uwierzytelniania, sekretów, piaskownicy, Cron i Gateway                                                                                                                            |
| `/codeql-critical-quality/config-boundary`              | Kontrakty schematu konfiguracji, migracji, normalizacji i IO                                                                                                                                                  |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schematy protokołu Gateway i kontrakty metod serwera                                                                                                                                                          |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrakty implementacji kanału rdzenia i dołączonego Plugin kanału                                                                                                                                            |
| `/codeql-critical-quality/agent-runtime-boundary`       | Wykonywanie poleceń, dyspozycja modeli/dostawców, dyspozycja automatycznych odpowiedzi i kolejki oraz kontrakty środowiska wykonawczego płaszczyzny sterowania ACP                                           |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serwery MCP i mosty narzędzi, pomocniki nadzoru procesów oraz kontrakty dostarczania wychodzącego                                                                                                             |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hosta pamięci, fasady środowiska wykonawczego pamięci, aliasy SDK Plugin pamięci, kod łączący aktywację środowiska wykonawczego pamięci oraz polecenia doctor pamięci                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Elementy wewnętrzne kolejki odpowiedzi, kolejki dostarczania sesji, pomocniki wiązania/dostarczania sesji wychodzących, powierzchnie zdarzeń diagnostycznych/pakietów logów oraz kontrakty CLI doctor sesji |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dyspozycja odpowiedzi przychodzących SDK Plugin, pomocniki ładunku/fragmentowania/środowiska wykonawczego odpowiedzi, opcje odpowiedzi kanału, kolejki dostarczania oraz pomocniki wiązania sesji/wątków      |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizacja katalogu modeli, uwierzytelnianie i wykrywanie dostawców, rejestracja środowiska wykonawczego dostawców, domyślne ustawienia/katalogi dostawców oraz rejestry web/search/fetch/embedding       |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI sterowania, lokalna trwałość, przepływy sterowania Gateway oraz kontrakty środowiska wykonawczego płaszczyzny sterowania zadaniami                                                              |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrakty środowiska wykonawczego podstawowego pobierania/wyszukiwania w sieci, IO mediów, rozumienia mediów, generowania obrazów i generowania mediów                                                        |
| `/codeql-critical-quality/plugin-boundary`              | Kontrakty loadera, rejestru, powierzchni publicznej i punktów wejścia SDK Plugin                                                                                                                              |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Opublikowane źródło SDK Plugin po stronie pakietu i pomocniki kontraktu pakietu pluginu                                                                                                                       |

Jakość pozostaje oddzielona od bezpieczeństwa, aby ustalenia jakościowe można było planować, mierzyć, wyłączać lub rozszerzać bez zasłaniania sygnału bezpieczeństwa. Rozszerzenie CodeQL dla Swift, Python i dołączonych pluginów powinno zostać dodane z powrotem jako zakresowe lub shardowane prace uzupełniające dopiero wtedy, gdy wąskie profile będą miały stabilne środowisko wykonawcze i sygnał.

## Przepływy utrzymania

### Agent dokumentacji

Przepływ pracy `Docs Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex, służąca do utrzymywania istniejącej dokumentacji w zgodności z niedawno wprowadzonymi zmianami. Nie ma czystego harmonogramu: pomyślne uruchomienie CI po pushu niebota na `main` może ją wyzwolić, a ręczne uruchomienie może uruchomić ją bezpośrednio. Wywołania przez workflow-run są pomijane, gdy `main` posunął się dalej albo gdy w ostatniej godzinie utworzono inne niepominięte uruchomienie Docs Agent. Gdy działa, przegląda zakres commitów od poprzedniego niepominiętego SHA źródłowego Docs Agent do bieżącego `main`, więc jedno godzinne uruchomienie może objąć wszystkie zmiany w main nagromadzone od ostatniego przebiegu dokumentacji.

### Agent wydajności testów

Przepływ pracy `Test Performance Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex dla wolnych testów. Nie ma czystego harmonogramu: pomyślne uruchomienie CI po pushu niebota na `main` może ją wyzwolić, ale pomija się ją, jeśli inne wywołanie workflow-run już działało albo działa tego dnia UTC. Ręczne uruchomienie omija tę dzienną bramkę aktywności. Ścieżka buduje raport wydajności zgrupowanego pełnego zestawu Vitest, pozwala Codex wprowadzać tylko małe poprawki wydajności testów zachowujące pokrycie zamiast szerokich refaktoryzacji, następnie ponownie uruchamia raport pełnego zestawu i odrzuca zmiany, które zmniejszają bazową liczbę przechodzących testów. Jeśli baza ma testy zakończone niepowodzeniem, Codex może naprawić tylko oczywiste niepowodzenia, a raport pełnego zestawu po agencie musi przejść, zanim cokolwiek zostanie zatwierdzone. Gdy `main` przesunie się przed wypchnięciem zmian przez bota, ścieżka wykonuje rebase zweryfikowanej łatki, ponownie uruchamia `pnpm check:changed` i ponawia push; kolidujące przestarzałe łatki są pomijane. Używa Ubuntu hostowanego przez GitHub, aby akcja Codex mogła zachować tę samą postawę bezpieczeństwa drop-sudo co agent dokumentacji.

### Duplikaty PR po scaleniu

Przepływ pracy `Duplicate PRs After Merge` to ręczny przepływ pracy maintainerów do porządkowania duplikatów po lądowaniu. Domyślnie działa w trybie dry-run i zamyka tylko jawnie wymienione PR, gdy `apply=true`. Przed modyfikacją GitHub weryfikuje, że wylądowany PR został scalony i że każdy duplikat ma współdzielone odwołane zgłoszenie albo nakładające się zmienione hunki.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokalne bramki kontroli i routing zmian

Lokalna logika changed-lane znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka kontroli jest bardziej rygorystyczna wobec granic architektury niż szeroki zakres platformy CI:

- zmiany produkcyjne rdzenia uruchamiają typecheck produkcji rdzenia i testów rdzenia oraz lint/guardy rdzenia;
- zmiany wyłącznie w testach rdzenia uruchamiają tylko typecheck testów rdzenia oraz lint rdzenia;
- zmiany produkcyjne rozszerzeń uruchamiają typecheck produkcji rozszerzeń i testów rozszerzeń oraz lint rozszerzeń;
- zmiany wyłącznie w testach rozszerzeń uruchamiają typecheck testów rozszerzeń oraz lint rozszerzeń;
- zmiany publicznego SDK Plugin lub kontraktu pluginu rozszerzają zakres do typecheck rozszerzeń, ponieważ rozszerzenia zależą od tych kontraktów rdzenia (przebiegi Vitest rozszerzeń pozostają jawną pracą testową);
- zmiany wyłącznie metadanych wersji wydania uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności root;
- nieznane zmiany root/konfiguracji bezpiecznie przechodzą na wszystkie ścieżki kontroli.

Lokalny routing changed-test znajduje się w `scripts/test-projects.test-support.mjs` i celowo jest tańszy niż `check:changed`: bezpośrednie edycje testów uruchamiają same siebie, edycje źródeł preferują jawne mapowania, następnie testy siostrzane i zależności grafu importów. Współdzielona konfiguracja dostarczania group-room jest jednym z jawnych mapowań: zmiany konfiguracji odpowiedzi widocznej dla grupy, trybu dostarczania odpowiedzi źródłowej albo promptu systemowego narzędzia wiadomości przechodzą przez podstawowe testy odpowiedzi oraz regresje dostarczania Discord i Slack, aby zmiana współdzielonej wartości domyślnej zakończyła się niepowodzeniem przed pierwszym pushem PR. Użyj `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy zmiana jest na tyle szeroka dla całego harnessu, że tani mapowany zestaw nie jest wiarygodnym przybliżeniem.

## Walidacja Testbox

Uruchamiaj Testbox z katalogu root repozytorium i preferuj świeże, rozgrzane pudełko dla szerokiego dowodu. Przed wydaniem powolnej bramki na pudełko, które zostało użyte ponownie, wygasło albo właśnie zgłosiło niespodziewanie dużą synchronizację, najpierw uruchom `pnpm testbox:sanity` wewnątrz pudełka.

Kontrola sanity szybko kończy się niepowodzeniem, gdy wymagane pliki root, takie jak `pnpm-lock.yaml`, zniknęły albo gdy `git status --short` pokazuje co najmniej 200 śledzonych usunięć. Zwykle oznacza to, że zdalny stan synchronizacji nie jest wiarygodną kopią PR; zatrzymaj to pudełko i rozgrzej świeże zamiast debugować niepowodzenie testu produktu. Dla celowych PR z dużą liczbą usunięć ustaw `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` dla tego przebiegu sanity.

`pnpm testbox:run` kończy również lokalne wywołanie Blacksmith CLI, które pozostaje w fazie synchronizacji przez ponad pięć minut bez wyjścia po synchronizacji. Ustaw `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, aby wyłączyć ten guard, albo użyj większej wartości w milisekundach dla nietypowo dużych lokalnych diffów.

Crabbox to druga, należąca do repozytorium ścieżka zdalnego pudełka dla dowodu na Linuksie, gdy Blacksmith jest niedostępny albo gdy preferowana jest własna pojemność chmurowa. Rozgrzej pudełko, nawodnij je przez przepływ pracy projektu, a następnie uruchom polecenia przez Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` określa domyślne ustawienia dostawcy, synchronizacji i nawadniania GitHub Actions. Wyklucza lokalne `.git`, aby nawodniony checkout Actions zachował własne zdalne metadane Git zamiast synchronizować lokalne dla maintainera remotes i magazyny obiektów, oraz wyklucza lokalne artefakty środowiska wykonawczego/budowania, które nigdy nie powinny być przesyłane. `.github/workflows/crabbox-hydrate.yml` określa checkout, konfigurację Node/pnpm, pobranie `origin/main` oraz przekazanie środowiska bez sekretów, z którego późniejsze polecenia `crabbox run --id <cbx_id>` korzystają jako źródła.

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Kanały deweloperskie](/pl/install/development-channels)
