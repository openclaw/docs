---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI zostało lub nie zostało uruchomione
    - Debugujesz niezaliczoną kontrolę GitHub Actions
    - Koordynujesz uruchomienie lub ponowne uruchomienie walidacji wydania
    - Zmieniasz wysyłanie ClawSweeper lub przekazywanie aktywności GitHub
summary: Graf zadań CI, bramki zakresu, parasole wydań i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-05-02T20:41:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39410c5ceb3598e9e1771f98fba79485b13967df372c7a3f55ef5a5350416435
    source_path: ci.md
    workflow: 16
---

OpenClaw CI działa przy każdym wypchnięciu do `main` i każdym pull requeście. Zadanie `preflight` klasyfikuje diff i wyłącza kosztowne ścieżki, gdy zmieniły się tylko niepowiązane obszary. Ręczne uruchomienia `workflow_dispatch` celowo pomijają inteligentne ograniczanie zakresu i rozgałęziają pełny graf dla kandydatów wydań oraz szerokiej walidacji. Ścieżki Androida pozostają opcjonalne przez `include_android`. Pokrycie pluginów przeznaczone wyłącznie dla wydań znajduje się w osobnym workflow [`Plugin Prerelease`](#plugin-prerelease) i uruchamia się tylko z [`Pełnej walidacji wydania`](#full-release-validation) albo przez jawne ręczne uruchomienie.

## Przegląd pipeline’u

| Zadanie                          | Cel                                                                                                      | Kiedy się uruchamia                         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `preflight`                      | Wykrywa zmiany dotyczące tylko docs, zmienione zakresy, zmienione rozszerzenia i buduje manifest CI      | Zawsze przy niedraftowych pushach i PR-ach  |
| `security-scm-fast`              | Wykrywanie kluczy prywatnych i audyt workflow przez `zizmor`                                             | Zawsze przy niedraftowych pushach i PR-ach  |
| `security-dependency-audit`      | Bez-zależnościowy audyt produkcyjnego lockfile’a względem advisory npm                                   | Zawsze przy niedraftowych pushach i PR-ach  |
| `security-fast`                  | Wymagany agregat dla szybkich zadań bezpieczeństwa                                                       | Zawsze przy niedraftowych pushach i PR-ach  |
| `check-dependencies`             | Produkcyjny przebieg Knip tylko dla zależności oraz strażnik listy dozwolonych nieużywanych plików       | Zmiany istotne dla Node                     |
| `build-artifacts`                | Buduje `dist/`, Control UI, kontrole zbudowanych artefaktów i artefakty wielokrotnego użytku dalej       | Zmiany istotne dla Node                     |
| `checks-fast-core`               | Szybkie ścieżki poprawności Linuxa, takie jak kontrole bundled/plugin-contract/protocol                  | Zmiany istotne dla Node                     |
| `checks-fast-contracts-channels` | Shardowane kontrole kontraktów kanałów ze stabilnym zagregowanym wynikiem kontroli                       | Zmiany istotne dla Node                     |
| `checks-node-core-test`          | Shardy testów core Node, z wyłączeniem ścieżek kanałów, bundled, kontraktów i rozszerzeń                 | Zmiany istotne dla Node                     |
| `check`                          | Shardowany odpowiednik głównej lokalnej bramki: typy prod, lint, strażniki, typy testów i strict smoke   | Zmiany istotne dla Node                     |
| `check-additional`               | Shardy architektury, granic, strażników powierzchni rozszerzeń, granic pakietów i gateway-watch          | Zmiany istotne dla Node                     |
| `build-smoke`                    | Testy smoke zbudowanego CLI i smoke pamięci startowej                                                    | Zmiany istotne dla Node                     |
| `checks`                         | Weryfikator testów kanałów zbudowanych artefaktów                                                        | Zmiany istotne dla Node                     |
| `checks-node-compat-node22`      | Ścieżka build i smoke zgodności z Node 22                                                                | Ręczne uruchomienie CI dla wydań            |
| `check-docs`                     | Formatowanie docs, lint i kontrole uszkodzonych linków                                                   | Docs zmienione                              |
| `skills-python`                  | Ruff + pytest dla skills opartych na Pythonie                                                            | Zmiany istotne dla Pythonowych skills       |
| `checks-windows`                 | Testy procesów/ścieżek specyficzne dla Windows oraz regresje współdzielonych specyfikatorów importu runtime | Zmiany istotne dla Windows               |
| `macos-node`                     | Ścieżka testów TypeScript na macOS używająca współdzielonych zbudowanych artefaktów                      | Zmiany istotne dla macOS                    |
| `macos-swift`                    | Swift lint, build i testy dla aplikacji macOS                                                            | Zmiany istotne dla macOS                    |
| `android`                        | Testy jednostkowe Androida dla obu wariantów oraz jeden build debug APK                                  | Zmiany istotne dla Androida                 |
| `test-performance-agent`         | Codzienna optymalizacja wolnych testów przez Codex po zaufanej aktywności                                | Sukces głównego CI albo ręczne uruchomienie |
| `openclaw-performance`           | Codzienne/na żądanie raporty wydajności runtime Kova ze ścieżkami mock-provider, deep-profile i GPT 5.4 live | Harmonogram i ręczne uruchomienie      |

## Kolejność fail-fast

1. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie samodzielne zadania.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` zawodzą szybko, nie czekając na cięższe zadania macierzy artefaktów i platform.
3. `build-artifacts` nakłada się z szybkimi ścieżkami Linuxa, aby dalsi konsumenci mogli ruszyć, gdy tylko współdzielony build będzie gotowy.
4. Cięższe ścieżki platform i runtime rozgałęziają się potem: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowszy push trafi na ten sam PR albo ref `main`. Traktuj to jako szum CI, chyba że najnowsze uruchomienie dla tego samego refa również kończy się niepowodzeniem. Zagregowane kontrole shardów używają `!cancelled() && always()`, więc nadal raportują normalne niepowodzenia shardów, ale nie kolejkują się po tym, jak cały workflow został już zastąpiony. Automatyczny klucz współbieżności CI jest wersjonowany (`CI-v7-*`), dzięki czemu zombie po stronie GitHuba w starej grupie kolejki nie może bezterminowo blokować nowszych uruchomień main. Ręczne uruchomienia pełnego zestawu używają `CI-manual-v1-*` i nie anulują uruchomień w toku.

## Zakres i routing

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest pokryta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`. Ręczne uruchomienie pomija wykrywanie changed-scope i sprawia, że manifest preflight działa tak, jakby zmienił się każdy obszar objęty zakresem.

- **Edycje workflow CI** walidują graf CI Node oraz linting workflow, ale same z siebie nie wymuszają natywnych buildów Windows, Androida ani macOS; te ścieżki platform pozostają ograniczone do zmian źródeł platform.
- **Edycje dotyczące tylko routingu CI, wybrane tanie edycje fixture’ów core-test oraz wąskie edycje helperów/test-routingu kontraktów pluginów** używają szybkiej ścieżki manifestu tylko dla Node: `preflight`, bezpieczeństwo i pojedyncze zadanie `checks-fast-core`. Ta ścieżka pomija artefakty buildu, zgodność z Node 22, kontrakty kanałów, pełne shardy core, shardy bundled-plugin oraz dodatkowe macierze strażników, gdy zmiana ogranicza się do powierzchni routingu lub helperów, które szybkie zadanie ćwiczy bezpośrednio.
- **Kontrole Windows Node** są ograniczone do specyficznych dla Windows wrapperów procesów/ścieżek, helperów runnerów npm/pnpm/UI, konfiguracji menedżera pakietów i powierzchni workflow CI wykonujących tę ścieżkę; niepowiązane zmiany źródeł, pluginów, install-smoke i wyłącznie testowe pozostają na ścieżkach Linux Node.

Najwolniejsze rodziny testów Node są dzielone lub równoważone, aby każde zadanie pozostało małe bez nadmiernej rezerwacji runnerów: kontrakty kanałów uruchamiają się jako trzy ważone shardy, małe ścieżki jednostkowe core są parowane, auto-reply działa jako cztery zrównoważone workery (z poddrzewem reply podzielonym na shardy agent-runner, dispatch oraz commands/state-routing), a konfiguracje agentic gateway/plugin są rozproszone po istniejących zadaniach agentic Node tylko dla źródeł, zamiast czekać na zbudowane artefakty. Szerokie testy przeglądarkowe, QA, media i różne testy pluginów używają swoich dedykowanych konfiguracji Vitest zamiast współdzielonego catch-all dla pluginów. Shardy include-pattern zapisują wpisy timingów z użyciem nazwy sharda CI, więc `.artifacts/vitest-shard-timings.json` może odróżnić całą konfigurację od filtrowanego sharda. `check-additional` trzyma razem pracę compile/canary granic pakietów i oddziela architekturę topologii runtime od pokrycia gateway watch; shard strażnika granic uruchamia swoje małe niezależne strażniki współbieżnie w jednym zadaniu. Gateway watch, testy kanałów i shard granic wsparcia core działają współbieżnie wewnątrz `build-artifacts` po zbudowaniu `dist/` i `dist-runtime/`.

CI Androida uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a następnie buduje Play debug APK. Wariant third-party nie ma osobnego source setu ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje wariant z flagami BuildConfig dla SMS/call-log, unikając jednocześnie duplikowania zadania pakowania debug APK przy każdym pushu istotnym dla Androida.

Shard `check-dependencies` uruchamia `pnpm deadcode:dependencies` (produkcyjny przebieg Knip tylko dla zależności przypięty do najnowszej wersji Knip, z wyłączonym minimalnym wiekiem wydania pnpm dla instalacji `dlx`) oraz `pnpm deadcode:unused-files`, który porównuje produkcyjne znaleziska nieużywanych plików Knip z `scripts/deadcode-unused-files.allowlist.mjs`. Strażnik nieużywanych plików zawodzi, gdy PR dodaje nowy nieprzejrzany nieużywany plik albo zostawia nieaktualny wpis na liście dozwolonych, zachowując jednocześnie celowe powierzchnie dynamicznych pluginów, wygenerowane, buildowe, live-test i mostków pakietów, których Knip nie może rozwiązać statycznie.

## Przekazywanie aktywności ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` jest mostem po stronie celu z aktywności repozytorium OpenClaw do ClawSweeper. Nie checkoutuje ani nie wykonuje niezaufanego kodu z pull requestów. Workflow tworzy token GitHub App z `CLAWSWEEPER_APP_PRIVATE_KEY`, a następnie wysyła zwarte payloady `repository_dispatch` do `openclaw/clawsweeper`.

Workflow ma cztery ścieżki:

- `clawsweeper_item` dla dokładnych próśb o przegląd issue i pull requestów;
- `clawsweeper_comment` dla jawnych poleceń ClawSweeper w komentarzach issue;
- `clawsweeper_commit_review` dla próśb o przegląd na poziomie commitów przy pushach do `main`;
- `github_activity` dla ogólnej aktywności GitHuba, którą agent ClawSweeper może sprawdzić.

Ścieżka `github_activity` przekazuje tylko znormalizowane metadane: typ zdarzenia, akcję, aktora, repozytorium, numer elementu, URL, tytuł, stan oraz krótkie fragmenty komentarzy lub review, gdy są obecne. Celowo unika przekazywania pełnego webhook body. Odbierający workflow w `openclaw/clawsweeper` to `.github/workflows/github-activity.yml`, który wysyła znormalizowane zdarzenie do hooka OpenClaw Gateway dla agenta ClawSweeper.

Ogólna aktywność jest obserwacją, a nie domyślnym dostarczeniem. Agent ClawSweeper otrzymuje cel Discord w swoim prompcie i powinien publikować na `#clawsweeper` tylko wtedy, gdy zdarzenie jest zaskakujące, wykonalne, ryzykowne albo operacyjnie użyteczne. Rutynowe otwarcia, edycje, ruch botów, duplikaty szumu webhooków i normalny ruch review powinny skutkować `NO_REPLY`.

Traktuj tytuły, komentarze, treści, tekst review, nazwy branchy i komunikaty commitów z GitHuba jako niezaufane dane w całej tej ścieżce. Są wejściem do podsumowania i triage’u, a nie instrukcjami dla workflow ani runtime agenta.

## Ręczne uruchomienia

Ręczne uruchomienia CI wykonują ten sam graf zadań co zwykłe CI, ale wymuszają włączenie każdej zakresowej ścieżki innej niż Android: shardy Linux Node, shardy dołączonych Plugin, kontrakty kanałów, zgodność z Node 22, `check`, `check-additional`, build smoke, kontrole dokumentacji, Python skills, Windows, macOS oraz i18n Control UI. Samodzielne ręczne uruchomienia CI wykonują tylko Android z `include_android=true`; pełny parasol wydania włącza Android, przekazując `include_android=true`. Przedwydaniowe statyczne kontrole Plugin, przeznaczony tylko dla wydań shard `agentic-plugins`, pełny wsadowy przegląd rozszerzeń oraz przedwydaniowe ścieżki Docker dla Plugin są wyłączone z CI. Przedwydaniowy zestaw Docker uruchamia się tylko wtedy, gdy `Full Release Validation` uruchamia osobny workflow `Plugin Prerelease` z włączoną bramką walidacji wydania.

Ręczne uruchomienia używają unikalnej grupy współbieżności, aby pełny zestaw kandydata do wydania nie został anulowany przez inne uruchomienie push lub PR na tym samym refie. Opcjonalne wejście `target_ref` pozwala zaufanemu wywołującemu uruchomić ten graf względem gałęzi, tagu lub pełnego SHA commita, używając pliku workflow z wybranego refa uruchomienia.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnery

| Runner                           | Zadania                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, szybkie zadania bezpieczeństwa i agregaty (`security-scm-fast`, `security-dependency-audit`, `security-fast`), szybkie kontrole protokołów/kontraktów/dołączonych pakietów, shardowane kontrole kontraktów kanałów, shardy `check` z wyjątkiem lint, shardy i agregaty `check-additional`, weryfikatory agregatów testów Node, kontrole dokumentacji, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight używa także Ubuntu hostowanego przez GitHub, aby macierz Blacksmith mogła wcześniej wejść do kolejki |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lżejsze shardy rozszerzeń, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` i `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shardy testów Linux Node, shardy testów dołączonych Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (na tyle wrażliwe na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało); buildy Docker install-smoke (czas kolejki 32 vCPU kosztował więcej, niż oszczędzał)                                                                                                                                                                                                                                                                                                                     |
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
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Wydajność OpenClaw

`OpenClaw Performance` to workflow wydajności produktu/runtime. Uruchamia się codziennie na `main` i można go uruchomić ręcznie:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

Workflow instaluje OCM z przypiętego wydania oraz Kova z przypiętego wejścia `kova_ref`, a następnie uruchamia trzy ścieżki:

- `mock-provider`: scenariusze diagnostyczne Kova względem runtime zbudowanego lokalnie, z deterministycznym fałszywym uwierzytelnianiem zgodnym z OpenAI.
- `mock-deep-profile`: profilowanie CPU/sterty/śladu dla punktów krytycznych uruchamiania, Gateway i tury agenta.
- `live-gpt54`: rzeczywista tura agenta OpenAI `openai/gpt-5.4`, pomijana, gdy `OPENAI_API_KEY` jest niedostępny.

Ścieżka mock-provider uruchamia także natywne sondy źródłowe OpenClaw po przebiegu Kova: pomiar czasu startu Gateway i pamięci w domyślnych przypadkach startowych, z hookiem oraz z 50 Plugin; powtarzane pętle powitalne mock-OpenAI `channel-chat-baseline`; oraz polecenia startowe CLI względem uruchomionego Gateway. Podsumowanie Markdown sondy źródłowej znajduje się pod `source/index.md` w pakiecie raportu, z surowym JSON obok.

Każda ścieżka przesyła artefakty GitHub. Gdy `CLAWGRIT_REPORTS_TOKEN` jest skonfigurowany, workflow dodatkowo commit-uje `report.json`, `report.md`, pakiety, `index.md` oraz artefakty sond źródłowych do `openclaw/clawgrit-reports` pod `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Bieżący wskaźnik gałęzi jest zapisywany jako `openclaw-performance/<ref>/latest-<lane>.json`.

## Pełna Walidacja Wydania

`Full Release Validation` to ręczny parasolowy workflow do „uruchomienia wszystkiego przed wydaniem”. Przyjmuje gałąź, tag lub pełny SHA commita, uruchamia ręczny workflow `CI` z tym celem, uruchamia `Plugin Prerelease` dla dowodów przeznaczonych tylko dla wydania: Plugin/pakiet/statyczne/Docker, oraz uruchamia `OpenClaw Release Checks` dla install smoke, akceptacji pakietu, zestawów ścieżki wydania Docker, live/E2E, OpenWebUI, parytetu QA Lab, Matrix i ścieżek Telegram. Z `rerun_group=all` i `release_profile=full` uruchamia także `NPM Telegram Beta E2E` względem artefaktu `release-package-under-test` z kontroli wydania. Po opublikowaniu przekaż `npm_telegram_package_spec`, aby ponownie uruchomić tę samą ścieżkę pakietu Telegram względem opublikowanego pakietu npm.

Zobacz [Pełna walidacja wydania](/pl/reference/full-release-validation), aby poznać
macierz etapów, dokładne nazwy zadań workflow, różnice profili, artefakty i
uchwyty skoncentrowanych ponownych uruchomień.

`OpenClaw Release Publish` to ręczny mutujący workflow wydania. Uruchom go
z `release/YYYY.M.D` lub `main` po tym, jak tag wydania już istnieje i po tym, jak
preflight npm OpenClaw zakończył się powodzeniem. Weryfikuje `pnpm plugins:sync:check`,
uruchamia `Plugin NPM Release` dla wszystkich publikowalnych pakietów Plugin,
uruchamia `Plugin ClawHub Release` dla tego samego SHA wydania i dopiero wtedy uruchamia
`OpenClaw NPM Release` z zapisanym `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Aby uzyskać dowód przypiętego commita na szybko zmieniającej się gałęzi, użyj helpera zamiast
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refy uruchamiania workflow GitHub muszą być gałęziami lub tagami, nie surowymi SHA commitów. Helper wypycha tymczasową gałąź `release-ci/<sha>-...` na docelowym SHA,
uruchamia `Full Release Validation` z tego przypiętego refa, weryfikuje, że każdy potomny workflow `headSha` pasuje do celu, i usuwa tymczasową gałąź po zakończeniu uruchomienia. Weryfikator parasola także kończy się niepowodzeniem, jeśli dowolny potomny workflow został uruchomiony na innym SHA.

`release_profile` kontroluje zakres live/provider przekazywany do kontroli wydania. Ręczne workflow wydania domyślnie używają `stable`; używaj `full` tylko wtedy, gdy
celowo chcesz szeroką doradczą macierz provider/media.

- `minimum` zachowuje najszybsze ścieżki krytyczne dla wydania OpenAI/core.
- `stable` dodaje stabilny zestaw provider/backend.
- `full` uruchamia szeroką doradczą macierz provider/media.

Parasol zapisuje identyfikatory uruchomionych potomnych przebiegów, a końcowe zadanie `Verify full validation` ponownie sprawdza bieżące wnioski potomnych przebiegów i dopisuje tabele najwolniejszych zadań dla każdego potomnego przebiegu. Jeśli potomny workflow zostanie ponownie uruchomiony i przejdzie na zielono, uruchom ponownie tylko zadanie weryfikatora nadrzędnego, aby odświeżyć wynik parasola i podsumowanie czasów.

Do odzyskiwania zarówno `Full Release Validation`, jak i `OpenClaw Release Checks` akceptują `rerun_group`. Użyj `all` dla kandydata wydania, `ci` tylko dla zwykłego podrzędnego pełnego CI, `plugin-prerelease` tylko dla podrzędnego przedwydania pluginu, `release-checks` dla każdego podrzędnego zadania wydania albo węższej grupy: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` lub `npm-telegram` w nadrzędnym przebiegu. Dzięki temu ponowne uruchomienie nieudanego środowiska wydania pozostaje ograniczone po ukierunkowanej poprawce.

`OpenClaw Release Checks` używa zaufanego ref przepływu pracy, aby jednorazowo rozwiązać wybrany ref do archiwum tarball `release-package-under-test`, a następnie przekazuje ten artefakt zarówno do Dockerowego przepływu pracy live/E2E ścieżki wydania, jak i do sharda akceptacji pakietu. Dzięki temu bajty pakietu pozostają spójne we wszystkich środowiskach wydania i unika się ponownego pakowania tego samego kandydata w wielu zadaniach podrzędnych.

Zduplikowane przebiegi `Full Release Validation` dla `ref=main` i `rerun_group=all`
zastępują starszy przebieg nadrzędny. Monitor nadrzędny anuluje każdy podrzędny przepływ pracy,
który już uruchomił, gdy zadanie nadrzędne zostanie anulowane, więc nowsza walidacja main
nie czeka za przestarzałym dwugodzinnym przebiegiem release-check. Walidacja gałęzi/tagów
wydania i ukierunkowane grupy ponownych uruchomień zachowują `cancel-in-progress: false`.

## Shardy live i E2E

Podrzędne zadanie release live/E2E zachowuje szerokie natywne pokrycie `pnpm test:live`, ale uruchamia je jako nazwane shardy przez `scripts/test-live-shard.mjs`, zamiast jako jedno zadanie sekwencyjne:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- zadania `native-live-src-gateway-profiles` filtrowane według providera
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- podzielone shardy audio/wideo mediów oraz shardy muzyki filtrowane według providera

Dzięki temu zachowane jest to samo pokrycie plików, a powolne awarie providerów live łatwiej ponownie uruchamiać i diagnozować. Zbiorcze nazwy shardów `native-live-extensions-o-z`, `native-live-extensions-media` i `native-live-extensions-media-music` pozostają prawidłowe dla ręcznych jednorazowych ponownych uruchomień.

Natywne shardy mediów live działają w `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, budowanym przez przepływ pracy `Live Media Runner Image`. Ten obraz wstępnie instaluje `ffmpeg` i `ffprobe`; zadania mediów tylko weryfikują binaria przed konfiguracją. Zostaw Dockerowe zestawy live na zwykłych runnerach Blacksmith — zadania kontenerowe nie są właściwym miejscem do uruchamiania zagnieżdżonych testów Docker.

Dockerowe shardy modeli/backendów live używają osobnego współdzielonego obrazu `ghcr.io/openclaw/openclaw-live-test:<sha>` dla wybranego commitu. Przepływ pracy wydania live buduje i wypycha ten obraz raz, a następnie shardy modelu Docker live, Gateway podzielonego według providerów, backendu CLI, powiązania ACP i uprzęży Codex działają z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shardy Docker Gateway mają jawne limity `timeout` na poziomie skryptu poniżej limitu czasu zadania przepływu pracy, aby zablokowany kontener lub ścieżka sprzątania szybko kończyły się niepowodzeniem zamiast zużywać cały budżet release-check. Jeśli te shardy niezależnie przebudowują pełny docelowy obraz Docker ze źródeł, przebieg wydania jest błędnie skonfigurowany i zmarnuje czas ścienny na duplikowane budowanie obrazów.

## Akceptacja pakietu

Użyj `Package Acceptance`, gdy pytanie brzmi: „czy ten instalowalny pakiet OpenClaw działa jako produkt?”. Różni się to od zwykłego CI: zwykłe CI waliduje drzewo źródłowe, natomiast akceptacja pakietu waliduje pojedynczy tarball przez ten sam Dockerowy zestaw E2E, którego użytkownicy używają po instalacji lub aktualizacji.

### Zadania

1. `resolve_package` pobiera `workflow_ref`, rozwiązuje jednego kandydata pakietu, zapisuje `.artifacts/docker-e2e-package/openclaw-current.tgz`, zapisuje `.artifacts/docker-e2e-package/package-candidate.json`, przesyła oba jako artefakt `package-under-test` oraz wypisuje źródło, ref przepływu pracy, ref pakietu, wersję, SHA-256 i profil w podsumowaniu kroku GitHub.
2. `docker_acceptance` wywołuje `openclaw-live-and-e2e-checks-reusable.yml` z `ref=workflow_ref` i `package_artifact_name=package-under-test`. Wielokrotnego użytku przepływ pracy pobiera ten artefakt, waliduje inwentarz tarballa, przygotowuje obrazy Docker z digestem pakietu, gdy jest to potrzebne, i uruchamia wybrane ścieżki Docker względem tego pakietu zamiast pakować checkout przepływu pracy. Gdy profil wybiera wiele ukierunkowanych `docker_lanes`, przepływ pracy wielokrotnego użytku przygotowuje pakiet i współdzielone obrazy raz, a następnie rozdziela te ścieżki jako równoległe ukierunkowane zadania Docker z unikalnymi artefaktami.
3. `package_telegram` opcjonalnie wywołuje `NPM Telegram Beta E2E`. Uruchamia się, gdy `telegram_mode` nie jest `none`, i instaluje ten sam artefakt `package-under-test`, jeśli Package Acceptance go rozwiązał; samodzielne uruchomienie Telegram nadal może instalować opublikowaną specyfikację npm.
4. `summary` kończy przepływ pracy niepowodzeniem, jeśli rozwiązanie pakietu, akceptacja Docker lub opcjonalna ścieżka Telegram zakończyły się niepowodzeniem.

### Źródła kandydatów

- `source=npm` akceptuje tylko `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` albo dokładną wersję wydania OpenClaw, taką jak `openclaw@2026.4.27-beta.2`. Użyj tego do akceptacji opublikowanego przedwydania/stabilnej wersji.
- `source=ref` pakuje zaufaną gałąź, tag lub pełny SHA commitu `package_ref`. Resolver pobiera gałęzie/tagi OpenClaw, weryfikuje, że wybrany commit jest osiągalny z historii gałęzi repozytorium lub tagu wydania, instaluje zależności w odłączonym worktree i pakuje go przy użyciu `scripts/package-openclaw-for-docker.mjs`.
- `source=url` pobiera HTTPS `.tgz`; `package_sha256` jest wymagane.
- `source=artifact` pobiera jeden `.tgz` z `artifact_run_id` i `artifact_name`; `package_sha256` jest opcjonalne, ale powinno być podane dla zewnętrznie udostępnianych artefaktów.

Trzymaj `workflow_ref` i `package_ref` osobno. `workflow_ref` to zaufany kod przepływu pracy/uprzęży, który uruchamia test. `package_ref` to commit źródłowy, który zostaje spakowany, gdy `source=ref`. Dzięki temu obecna uprząż testowa może walidować starsze zaufane commity źródłowe bez uruchamiania starej logiki przepływu pracy.

### Profile zestawów

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — pełne fragmenty Docker ścieżki wydania z OpenWebUI
- `custom` — dokładne `docker_lanes`; wymagane, gdy `suite_profile=custom`

Profil `package` używa offline’owego pokrycia pluginów, aby walidacja opublikowanego pakietu nie była blokowana dostępnością live ClawHub. Opcjonalna ścieżka Telegram ponownie używa artefaktu `package-under-test` w `NPM Telegram Beta E2E`, przy czym ścieżka opublikowanej specyfikacji npm pozostaje dla samodzielnych uruchomień.

Dedykowane zasady testowania aktualizacji i pluginów, w tym polecenia lokalne,
ścieżki Docker, wejścia Package Acceptance, domyślne ustawienia wydania i triage awarii,
zobacz w [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins).

Kontrole wydania wywołują Package Acceptance z `source=artifact`, przygotowanym artefaktem pakietu wydania, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` i `telegram_mode=mock-openai`. Dzięki temu dowody migracji pakietu, aktualizacji, sprzątania nieaktualnych zależności pluginów, naprawy instalacji skonfigurowanego pluginu, offline’owego pluginu, aktualizacji pluginu i Telegram działają na tym samym rozwiązanym tarballu pakietu. Ustaw `package_acceptance_package_spec` w Full Release Validation lub OpenClaw Release Checks, aby uruchomić tę samą macierz względem wysłanego pakietu npm zamiast artefaktu zbudowanego z SHA. Kontrole wydania cross-OS nadal obejmują specyficzne dla systemu operacyjnego onboarding, instalator i zachowanie platformy; walidacja produktu pakietu/aktualizacji powinna zaczynać się od Package Acceptance. Ścieżka Docker `published-upgrade-survivor` waliduje jedną opublikowaną bazę pakietu na przebieg. W Package Acceptance rozwiązany tarball `package-under-test` zawsze jest kandydatem, a `published_upgrade_survivor_baseline` wybiera zapasową opublikowaną bazę, domyślnie `openclaw@latest`; polecenia ponownego uruchomienia nieudanej ścieżki zachowują tę bazę. Ustaw `published_upgrade_survivor_baselines=all-since-2026.4.23`, aby rozszerzyć Full Release CI na każde stabilne wydanie npm od `2026.4.23` do `latest`; `release-history` pozostaje dostępne do ręcznego szerszego próbkowania ze starszym punktem odniesienia sprzed tej daty. Ustaw `published_upgrade_survivor_scenarios=reported-issues`, aby rozszerzyć te same bazy na fixture’y ukształtowane jak zgłoszenia dla konfiguracji Feishu, zachowanych plików bootstrap/persona, skonfigurowanych instalacji pluginów OpenClaw, ścieżek logów z tyldą i nieaktualnych korzeni zależności starszych pluginów. Osobny przepływ pracy `Update Migration` używa ścieżki Docker `update-migration` z `all-since-2026.4.23` i `plugin-deps-cleanup`, gdy pytaniem jest wyczerpujące sprzątanie opublikowanych aktualizacji, a nie zwykła szerokość Full Release CI. Lokalne przebiegi zbiorcze mogą przekazywać dokładne specyfikacje pakietów przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, zachować pojedynczą ścieżkę z `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, taką jak `openclaw@2026.4.15`, albo ustawić `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` dla macierzy scenariuszy. Opublikowana ścieżka konfiguruje bazę za pomocą wbudowanej receptury polecenia `openclaw config set`, zapisuje kroki receptury w `summary.json` i sonduje `/healthz`, `/readyz` oraz status RPC po starcie Gateway. Świeże ścieżki pakietu i instalatora Windows weryfikują też, że zainstalowany pakiet może zaimportować nadpisanie kontroli przeglądarki z surowej bezwzględnej ścieżki Windows. Smoke test tury agenta OpenAI cross-OS domyślnie używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy jest ustawione, w przeciwnym razie `openai/gpt-5.4`, więc dowód instalacji i Gateway pozostaje na modelu testowym GPT-5, unikając domyślnych ustawień GPT-4.x.

### Okna zgodności ze starszymi wersjami

Package Acceptance ma ograniczone okna zgodności ze starszymi wersjami dla już opublikowanych pakietów. Pakiety do `2026.4.25` włącznie, w tym `2026.4.25-beta.*`, mogą używać ścieżki zgodności:

- znane prywatne wpisy QA w `dist/postinstall-inventory.json` mogą wskazywać na pliki pominięte w tarballu;
- `doctor-switch` może pominąć podprzypadek trwałości `gateway install --wrapper`, gdy pakiet nie udostępnia tej flagi;
- `update-channel-switch` może usuwać brakujące `pnpm.patchedDependencies` z fałszywego fixture git pochodzącego z tarballa i może logować brakujące utrwalone `update.channel`;
- smoke testy pluginów mogą odczytywać starsze lokalizacje rekordów instalacji albo akceptować brak trwałości rekordu instalacji marketplace;
- `plugin-update` może zezwolić na migrację metadanych konfiguracji, nadal wymagając, aby rekord instalacji i zachowanie bez ponownej instalacji pozostały niezmienione.

Opublikowany pakiet `2026.4.26` może też ostrzegać o plikach znaczników metadanych lokalnej kompilacji, które zostały już wysłane. Późniejsze pakiety muszą spełniać nowoczesne kontrakty; te same warunki kończą się niepowodzeniem zamiast ostrzeżeniem lub pominięciem.

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

Podczas debugowania nieudanego uruchomienia akceptacji pakietu zacznij od podsumowania `resolve_package`, aby potwierdzić źródło pakietu, wersję i SHA-256. Następnie sprawdź podrzędne uruchomienie `docker_acceptance` i jego artefakty Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, dzienniki ścieżek, czasy faz i polecenia ponownego uruchomienia. Preferuj ponowne uruchomienie nieudanego profilu pakietu lub dokładnych ścieżek Docker zamiast ponownego uruchamiania pełnej walidacji wydania.

## Smoke test instalacji

Osobny workflow `Install Smoke` ponownie używa tego samego skryptu zakresu przez własne zadanie `preflight`. Dzieli pokrycie smoke testów na `run_fast_install_smoke` i `run_full_install_smoke`.

- **Szybka ścieżka** uruchamia się dla pull requestów dotykających powierzchni Docker/pakietów, zmian pakietów/manifestów dołączonych pluginów albo powierzchni core plugin/kanał/gateway/Plugin SDK, które ćwiczą zadania smoke testów Docker. Zmiany wyłącznie w źródłach dołączonych pluginów, edycje dotyczące tylko testów i edycje dotyczące tylko dokumentacji nie rezerwują workerów Docker. Szybka ścieżka buduje obraz głównego Dockerfile raz, sprawdza CLI, uruchamia smoke test CLI usuwania agentów we współdzielonym obszarze roboczym, uruchamia kontenerowy e2e gateway-network, weryfikuje argument budowania dołączonego rozszerzenia i uruchamia ograniczony profil Docker dołączonych pluginów z łącznym limitem czasu polecenia 240 sekund (każde uruchomienie Docker danego scenariusza ma osobny limit).
- **Pełna ścieżka** zachowuje instalację pakietu QR oraz pokrycie Docker instalatora/aktualizacji dla nocnych zaplanowanych uruchomień, ręcznych wywołań, release checks przez workflow-call oraz pull requestów, które faktycznie dotykają powierzchni instalatora/pakietu/Docker. W trybie pełnym install-smoke przygotowuje albo ponownie używa jednego obrazu smoke GHCR głównego Dockerfile dla docelowego SHA, a następnie uruchamia instalację pakietu QR, smoke testy głównego Dockerfile/gateway, smoke testy instalatora/aktualizacji oraz szybki Docker E2E dołączonych pluginów jako osobne zadania, aby prace instalatora nie czekały za smoke testami obrazu głównego.

Wypchnięcia na `main` (w tym commity merge) nie wymuszają pełnej ścieżki; gdy logika zakresu zmian zażądałaby pełnego pokrycia przy pushu, workflow zachowuje szybki smoke test Docker i pozostawia pełny smoke test instalacji nocnej lub walidacji wydania.

Wolny smoke test globalnej instalacji Bun dostawcy obrazów jest osobno bramkowany przez `run_bun_global_install_smoke`. Uruchamia się w harmonogramie nocnym i z workflow release checks, a ręczne wywołania `Install Smoke` mogą go włączyć, ale pull requesty i wypchnięcia na `main` tego nie robią. Testy Docker QR i instalatora zachowują własne Dockerfile skoncentrowane na instalacji.

## Lokalne Docker E2E

`pnpm test:docker:all` wstępnie buduje jeden współdzielony obraz live-test, pakuje OpenClaw raz jako archiwum tar npm i buduje dwa współdzielone obrazy `scripts/e2e/Dockerfile`:

- podstawowy runner Node/Git dla ścieżek instalatora/aktualizacji/zależności pluginów;
- obraz funkcjonalny, który instaluje to samo archiwum tar w `/app` dla zwykłych ścieżek funkcjonalnych.

Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`, logika planera w `scripts/lib/docker-e2e-plan.mjs`, a runner wykonuje tylko wybrany plan. Harmonogram wybiera obraz dla ścieżki za pomocą `OPENCLAW_DOCKER_E2E_BARE_IMAGE` i `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, a następnie uruchamia ścieżki z `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametry konfiguracyjne

| Zmienna                                | Domyślnie | Cel                                                                                           |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Liczba slotów głównej puli dla zwykłych ścieżek.                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Liczba slotów puli końcowej wrażliwej na dostawców.                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limit współbieżnych ścieżek live, aby dostawcy nie throttlowali.                              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | Limit współbieżnych ścieżek instalacji npm.                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limit współbieżnych ścieżek wielousługowych.                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Odstęp między startami ścieżek, aby uniknąć burz tworzenia w demonie Docker; ustaw `0`, aby nie stosować odstępu. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Awaryjny limit czasu na ścieżkę (120 minut); wybrane ścieżki live/końcowe używają ciaśniejszych limitów. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset     | `1` wypisuje plan harmonogramu bez uruchamiania ścieżek.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset     | Lista dokładnych ścieżek rozdzielona przecinkami; pomija smoke test czyszczenia, aby agenci mogli odtworzyć jedną nieudaną ścieżkę. |

Ścieżka cięższa niż jej efektywny limit może nadal wystartować z pustej puli, a potem działa sama, dopóki nie zwolni pojemności. Lokalne preflighty agregujące sprawdzają Docker, usuwają stare kontenery OpenClaw E2E, emitują status aktywnych ścieżek, zapisują czasy ścieżek dla sortowania od najdłuższych i domyślnie przestają planować nowe ścieżki z puli po pierwszej awarii.

### Workflow live/E2E wielokrotnego użytku

Workflow live/E2E wielokrotnego użytku pyta `scripts/test-docker-all.mjs --plan-json`, jakie pokrycie pakietu, rodzaju obrazu, obrazu live, ścieżki i poświadczeń jest wymagane. `scripts/docker-e2e.mjs` następnie konwertuje ten plan na wyjścia i podsumowania GitHub. Albo pakuje OpenClaw przez `scripts/package-openclaw-for-docker.mjs`, pobiera artefakt pakietu z bieżącego uruchomienia, albo pobiera artefakt pakietu z `package_artifact_run_id`; waliduje inwentarz archiwum tar; buduje i wypycha oznaczone skrótem pakietu obrazy bare/functional GHCR Docker E2E przez cache warstw Docker Blacksmith, gdy plan potrzebuje ścieżek z zainstalowanym pakietem; oraz ponownie używa podanych wejść `docker_e2e_bare_image`/`docker_e2e_functional_image` lub istniejących obrazów z digestem pakietu zamiast je odbudowywać. Pobrania obrazów Docker są ponawiane z ograniczonym limitem 180 sekund na próbę, aby zablokowany strumień rejestru/cache szybko spróbował ponownie zamiast zużywać większość krytycznej ścieżki CI.

### Fragmenty ścieżki wydania

Pokrycie Docker dla wydania uruchamia mniejsze zadania w fragmentach z `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby każdy fragment pobierał tylko potrzebny rodzaj obrazu i wykonywał wiele ścieżek przez ten sam ważony harmonogram:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Bieżące fragmenty Docker dla wydania to `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` oraz od `plugins-runtime-install-a` do `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` i `plugins-integrations` pozostają agregującymi aliasami pluginów/runtime. Alias ścieżki `install-e2e` pozostaje agregującym ręcznym aliasem ponownego uruchomienia dla obu ścieżek instalatora dostawców.

OpenWebUI jest składany do `plugins-runtime-services`, gdy prosi o to pełne pokrycie release-path, i zachowuje osobny fragment `openwebui` tylko dla wywołań dotyczących wyłącznie OpenWebUI. Ścieżki aktualizacji dołączonych kanałów ponawiają próbę raz przy przejściowych awariach sieci npm.

Każdy fragment przesyła `.artifacts/docker-tests/` z dziennikami ścieżek, czasami, `summary.json`, `failures.json`, czasami faz, JSON planu harmonogramu, tabelami wolnych ścieżek i poleceniami ponownego uruchomienia dla każdej ścieżki. Wejście workflow `docker_lanes` uruchamia wybrane ścieżki względem przygotowanych obrazów zamiast zadań fragmentów, co utrzymuje debugowanie nieudanych ścieżek w granicach jednego ukierunkowanego zadania Docker i przygotowuje, pobiera albo ponownie używa artefaktu pakietu dla tego uruchomienia; jeśli wybrana ścieżka jest ścieżką live Docker, zadanie ukierunkowane buduje obraz live-test lokalnie dla tego ponownego uruchomienia. Wygenerowane polecenia GitHub ponownego uruchomienia dla każdej ścieżki zawierają `package_artifact_run_id`, `package_artifact_name` i przygotowane wejścia obrazów, gdy te wartości istnieją, dzięki czemu nieudana ścieżka może ponownie użyć dokładnego pakietu i obrazów z nieudanego uruchomienia.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zaplanowany workflow live/E2E codziennie uruchamia pełny zestaw Docker release-path.

## Wersja przedpremierowa Plugin

`Plugin Prerelease` to droższe pokrycie produktu/pakietu, więc jest osobnym workflow wywoływanym przez `Full Release Validation` albo przez jawnego operatora. Zwykłe pull requesty, wypchnięcia na `main` i samodzielne ręczne wywołania CI utrzymują ten zestaw wyłączony. Równoważy testy dołączonych pluginów między ośmiu workerów rozszerzeń; te zadania shardów rozszerzeń uruchamiają do dwóch grup konfiguracji pluginów naraz z jednym workerem Vitest na grupę i większym stertą Node, aby partie pluginów ciężkie importami nie tworzyły dodatkowych zadań CI. Ścieżka przedpremierowa Docker tylko dla wydań grupuje ukierunkowane ścieżki Docker w małych grupach, aby uniknąć rezerwowania dziesiątek runnerów dla zadań trwających od jednej do trzech minut.

## QA Lab

QA Lab ma dedykowane ścieżki CI poza głównym inteligentnie zakresowanym workflow. Parity agentowe jest zagnieżdżone pod szerokimi harnessami QA i wydań, a nie samodzielnym workflow PR. Użyj `Full Release Validation` z `rerun_group=qa-parity`, gdy parity powinno iść razem z szerokim uruchomieniem walidacyjnym.

- Workflow `QA-Lab - All Lanes` uruchamia się nocą na `main` i przy ręcznym wywołaniu; rozdziela mockowaną ścieżkę parity, ścieżkę live Matrix oraz ścieżki live Telegram i Discord jako równoległe zadania. Zadania live używają środowiska `qa-live-shared`, a Telegram/Discord używają dzierżaw Convex.

Release checks uruchamiają ścieżki transportu live Matrix i Telegram z deterministycznym mockowanym dostawcą oraz modelami kwalifikowanymi przez mock (`mock-openai/gpt-5.5` i `mock-openai/gpt-5.5-alt`), aby kontrakt kanału był odizolowany od opóźnień modeli live i normalnego startu pluginu dostawcy. Gateway transportu live wyłącza wyszukiwanie pamięci, ponieważ QA parity pokrywa zachowanie pamięci osobno; łączność dostawcy jest pokrywana przez osobne zestawy live model, native provider i Docker provider.

Matrix używa `--profile fast` dla zaplanowanych bramek i bramek wydania, dodając `--fail-fast` tylko wtedy, gdy wyewidencjonowane CLI to obsługuje. Domyślna wartość CLI i ręczne wejście workflow pozostają `all`; ręczne wywołanie `matrix_profile=all` zawsze sharduje pełne pokrycie Matrix na zadania `transport`, `media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`.

`OpenClaw Release Checks` uruchamia również krytyczne dla wydania ścieżki QA Lab przed zatwierdzeniem wydania; jego bramka QA parity uruchamia paczki kandydata i bazowe jako równoległe zadania ścieżek, a następnie pobiera oba artefakty do małego zadania raportującego dla końcowego porównania parity.

Dla zwykłych PR-ów kieruj się dowodami z zakresowanego CI/check zamiast traktować parity jako wymagany status.

## CodeQL

Workflow `CodeQL` jest celowo wąskim skanerem bezpieczeństwa pierwszego przejścia, a nie pełnym przeglądem repozytorium. Codzienne, ręczne oraz ochronne uruchomienia dla pull requestów bez statusu wersji roboczej skanują kod workflow Actions oraz powierzchnie JavaScript/TypeScript najwyższego ryzyka, używając zapytań bezpieczeństwa o wysokiej pewności, filtrowanych do wysokiego/krytycznego poziomu `security-severity`.

Ochrona pull requestów pozostaje lekka: uruchamia się tylko dla zmian w `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` lub `src` i wykonuje tę samą macierz bezpieczeństwa o wysokiej pewności co workflow harmonogramowany. Android i macOS CodeQL pozostają poza domyślnymi uruchomieniami PR.

### Kategorie bezpieczeństwa

| Kategoria                                         | Powierzchnia                                                                                                                         |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, sekrety, sandbox, cron i bazowy zakres gateway                                                                                 |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrakty implementacji kanałów core oraz runtime Pluginu kanału, gateway, Plugin SDK, sekrety, punkty styku audytu                 |
| `/codeql-security-high/network-ssrf-boundary`     | Powierzchnie core SSRF, parsowania IP, ochrony sieci, web-fetch oraz polityki SSRF Plugin SDK                                       |
| `/codeql-security-high/mcp-process-tool-boundary` | Serwery MCP, pomocnicze funkcje wykonywania procesów, dostarczanie wychodzące oraz bramki wykonywania narzędzi agentów              |
| `/codeql-security-high/plugin-trust-boundary`     | Powierzchnie zaufania instalacji Pluginu, loadera, manifestu, rejestru, instalacji przez menedżer pakietów, ładowania źródeł oraz kontraktu pakietu Plugin SDK |

### Shardy bezpieczeństwa specyficzne dla platform

- `CodeQL Android Critical Security` — harmonogramowany shard bezpieczeństwa Androida. Ręcznie buduje aplikację Android dla CodeQL na najmniejszym runnerze Blacksmith Linux akceptowanym przez sanity workflow. Przesyła pod `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — cotygodniowy/ręczny shard bezpieczeństwa macOS. Ręcznie buduje aplikację macOS dla CodeQL na Blacksmith macOS, odfiltrowuje wyniki budowania zależności z przesyłanego SARIF i przesyła pod `/codeql-critical-security/macos`. Pozostaje poza codziennymi ustawieniami domyślnymi, ponieważ build macOS dominuje czas działania nawet przy czystym przebiegu.

### Kategorie Critical Quality

`CodeQL Critical Quality` to odpowiadający shard niezwiązany z bezpieczeństwem. Uruchamia wyłącznie zapytania jakości JavaScript/TypeScript o istotności błędu i niezwiązane z bezpieczeństwem, na wąskich powierzchniach o wysokiej wartości, na mniejszym runnerze Blacksmith Linux. Jego ochrona pull requestów jest celowo mniejsza niż profil harmonogramowany: PR-y bez statusu wersji roboczej uruchamiają tylko odpowiadające shardy `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` i `plugin-sdk-reply-runtime` dla zmian w kodzie wykonywania komend/modeli/narzędzi agenta i dyspozycji odpowiedzi, schematu config/migracji/IO, auth/sekretów/sandboxu/bezpieczeństwa, kanału core i runtime dołączonego Pluginu kanału, protokołu/metod serwera Gateway, runtime pamięci/spoiwa SDK, MCP/procesu/dostarczania wychodzącego, runtime providera/katalogu modeli, diagnostyki sesji/kolejek dostarczania, loadera Pluginu, kontraktu Plugin SDK/pakietu albo runtime odpowiedzi Plugin SDK. Zmiany config CodeQL i workflow jakości uruchamiają wszystkie dwanaście shardów jakości PR.

Ręczne wywołanie przyjmuje:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Wąskie profile są hakami dydaktycznymi/iteracyjnymi do uruchamiania jednego sharda jakości w izolacji.

| Kategoria                                               | Powierzchnia                                                                                                                                                       |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kod granicy bezpieczeństwa auth, sekretów, sandboxu, cron i gateway                                                                                               |
| `/codeql-critical-quality/config-boundary`              | Kontrakty schematu config, migracji, normalizacji i IO                                                                                                            |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schematy protokołu Gateway i kontrakty metod serwera                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrakty implementacji kanału core i dołączonego Pluginu kanału                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Kontrakty runtime wykonywania komend, dyspozycji model/provider, dyspozycji i kolejek auto-odpowiedzi oraz płaszczyzny sterowania ACP                             |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serwery MCP i mostki narzędzi, pomocnicze funkcje nadzoru procesów oraz kontrakty dostarczania wychodzącego                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hosta pamięci, fasady runtime pamięci, aliasy pamięci Plugin SDK, spoiwo aktywacji runtime pamięci oraz komendy doctor pamięci                                |
| `/codeql-critical-quality/session-diagnostics-boundary` | Wewnętrzne elementy kolejki odpowiedzi, kolejki dostarczania sesji, pomocnicze funkcje wiązania/dostarczania sesji wychodzących, powierzchnie zdarzeń diagnostycznych/pakietów logów oraz kontrakty CLI doctor sesji |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dyspozycja odpowiedzi przychodzących Plugin SDK, payload odpowiedzi/chunking/pomocnicze funkcje runtime, opcje odpowiedzi kanału, kolejki dostarczania oraz pomocnicze funkcje wiązania sesji/wątku |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizacja katalogu modeli, auth i odkrywanie providerów, rejestracja runtime providera, domyślne ustawienia/katalogi providerów oraz rejestry web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, lokalna trwałość, przepływy sterowania Gateway oraz kontrakty runtime płaszczyzny sterowania zadaniami                                      |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrakty runtime core web fetch/search, media IO, rozumienia mediów, generowania obrazów i generowania mediów                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Kontrakty loadera, rejestru, powierzchni publicznej i punktu wejścia Plugin SDK                                                                                   |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Opublikowane źródło Plugin SDK po stronie pakietu i pomocnicze funkcje kontraktu pakietu Pluginu                                                                  |

Jakość pozostaje oddzielona od bezpieczeństwa, aby ustalenia jakości mogły być harmonogramowane, mierzone, wyłączane lub rozszerzane bez zaciemniania sygnału bezpieczeństwa. Rozszerzenie CodeQL dla Swift, Python i dołączonych Pluginów powinno zostać dodane ponownie jako zakresowane lub shardowane prace następcze dopiero po ustabilizowaniu czasu działania i sygnału wąskich profili.

## Workflow utrzymaniowe

### Docs Agent

Workflow `Docs Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex służąca do utrzymywania istniejącej dokumentacji w zgodności z niedawno wprowadzonymi zmianami. Nie ma czystego harmonogramu: udane uruchomienie CI po pushu niebota na `main` może go wyzwolić, a ręczne wywołanie może uruchomić go bezpośrednio. Wywołania workflow-run są pomijane, gdy `main` przesunął się dalej albo gdy w ostatniej godzinie utworzono inne niepominięte uruchomienie Docs Agent. Gdy działa, przegląda zakres commitów od poprzedniego źródłowego SHA niepominiętego Docs Agent do bieżącego `main`, więc jedno godzinne uruchomienie może objąć wszystkie zmiany na main zgromadzone od ostatniego przejścia dokumentacji.

### Test Performance Agent

Workflow `Test Performance Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex dla wolnych testów. Nie ma czystego harmonogramu: udane uruchomienie CI po pushu niebota na `main` może go wyzwolić, ale jest pomijany, jeśli inne wywołanie workflow-run już działało albo działa tego dnia UTC. Ręczne wywołanie omija tę dzienną bramkę aktywności. Ścieżka buduje pogrupowany raport wydajności Vitest dla pełnego zestawu, pozwala Codex wprowadzać wyłącznie małe poprawki wydajności testów zachowujące pokrycie zamiast szerokich refaktoryzacji, następnie ponownie uruchamia raport pełnego zestawu i odrzuca zmiany, które zmniejszają bazową liczbę przechodzących testów. Jeśli baza ma testy zakończone niepowodzeniem, Codex może naprawić tylko oczywiste niepowodzenia, a raport pełnego zestawu po agencie musi przejść, zanim cokolwiek zostanie zatwierdzone. Gdy `main` posunie się naprzód przed pushowaniem zmian przez bota, ścieżka rebase’uje zwalidowaną poprawkę, ponownie uruchamia `pnpm check:changed` i ponawia push; konfliktowe, nieaktualne poprawki są pomijane. Używa GitHub-hosted Ubuntu, aby akcja Codex mogła utrzymać taką samą bezpieczną postawę drop-sudo jak agent dokumentacji.

### Duplicate PRs After Merge

Workflow `Duplicate PRs After Merge` to ręczny workflow maintainerów do czyszczenia duplikatów po wdrożeniu. Domyślnie działa jako dry-run i zamyka tylko jawnie wskazane PR-y, gdy `apply=true`. Przed modyfikacją GitHub weryfikuje, że wdrożony PR został scalony oraz że każdy duplikat ma albo wspólny przywołany issue, albo nakładające się zmienione hunki.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokalne bramki sprawdzania i routing zmian

Lokalna logika changed-lane znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka sprawdzania jest bardziej rygorystyczna względem granic architektury niż szeroki zakres platformy CI:

- zmiany produkcyjne core uruchamiają typecheck produkcyjny i testowy core oraz lint/guardy core;
- zmiany tylko w testach core uruchamiają wyłącznie typecheck testowy core oraz lint core;
- zmiany produkcyjne rozszerzeń uruchamiają typecheck produkcyjny i testowy rozszerzeń oraz lint rozszerzeń;
- zmiany tylko w testach rozszerzeń uruchamiają typecheck testowy rozszerzeń oraz lint rozszerzeń;
- zmiany publicznego Plugin SDK lub kontraktu Pluginu rozszerzają się do typechecku rozszerzeń, ponieważ rozszerzenia zależą od tych kontraktów core (przeglądy rozszerzeń Vitest pozostają jawną pracą testową);
- wyłącznie metadane wydania z podbiciami wersji uruchamiają ukierunkowane sprawdzenia wersji/config/root-dependency;
- nieznane zmiany root/config bezpiecznie przechodzą do wszystkich ścieżek sprawdzania.

Lokalny routing changed-test znajduje się w `scripts/test-projects.test-support.mjs` i jest celowo tańszy niż `check:changed`: bezpośrednie edycje testów uruchamiają same siebie, edycje źródeł preferują jawne mapowania, a następnie testy sąsiednie i zależne z grafu importów. Wspólna konfiguracja dostarczania group-room jest jednym z jawnych mapowań: zmiany w konfiguracji visible-reply grupy, trybie dostarczania odpowiedzi źródłowej albo prompcie systemowym message-tool przechodzą przez testy odpowiedzi core oraz regresje dostarczania Discord i Slack, aby zmiana wspólnej wartości domyślnej zakończyła się niepowodzeniem przed pierwszym pushem PR. Użyj `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy zmiana jest na tyle szeroka dla całego harnessu, że tani zestaw mapowany nie jest wiarygodnym przybliżeniem.

## Walidacja Testbox

Uruchamiaj Testbox z katalogu głównego repozytorium i preferuj świeżo wstępnie uruchomioną instancję do szerokiej weryfikacji. Przed poświęceniem czasu na wolną bramkę na instancji, która została użyta ponownie, wygasła albo właśnie zgłosiła nieoczekiwanie dużą synchronizację, uruchom najpierw `pnpm testbox:sanity` wewnątrz tej instancji.

Kontrola poprawności szybko kończy się niepowodzeniem, gdy zniknęły wymagane pliki główne, takie jak `pnpm-lock.yaml`, albo gdy `git status --short` pokazuje co najmniej 200 śledzonych usunięć. Zwykle oznacza to, że stan zdalnej synchronizacji nie jest wiarygodną kopią PR; zatrzymaj tę instancję i rozgrzej świeżą, zamiast debugować niepowodzenie testu produktu. W przypadku celowych PR z dużą liczbą usunięć ustaw `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` dla tego uruchomienia kontroli poprawności.

`pnpm testbox:run` kończy też lokalne wywołanie Blacksmith CLI, które pozostaje w fazie synchronizacji przez ponad pięć minut bez danych wyjściowych po synchronizacji. Ustaw `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, aby wyłączyć tę osłonę, albo użyj większej wartości w milisekundach dla nietypowo dużych lokalnych różnic.

Crabbox to należąca do repozytorium druga ścieżka zdalnej instancji do weryfikacji na Linux, gdy Blacksmith jest niedostępny albo gdy preferowana jest własna pojemność w chmurze. Rozgrzej instancję, zainicjalizuj ją przez przepływ pracy projektu, a następnie uruchamiaj polecenia przez Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` definiuje domyślne ustawienia dostawcy, synchronizacji i inicjalizacji GitHub Actions. Wyklucza lokalne `.git`, aby zainicjalizowany checkout Actions zachował własne zdalne metadane Git zamiast synchronizować lokalne zdalne repozytoria i magazyny obiektów maintainerów, oraz wyklucza lokalne artefakty uruchomieniowe/budowania, których nigdy nie należy przesyłać. `.github/workflows/crabbox-hydrate.yml` definiuje checkout, konfigurację Node/pnpm, pobranie `origin/main` oraz przekazanie niepoufnego środowiska, z którego korzystają późniejsze polecenia `crabbox run --id <cbx_id>`.

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Kanały rozwojowe](/pl/install/development-channels)
