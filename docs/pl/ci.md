---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI zostało lub nie zostało uruchomione
    - Debugujesz nieudaną kontrolę GitHub Actions
    - Koordynujesz uruchomienie lub ponowne uruchomienie walidacji wydania
    - Zmieniasz wysyłanie ClawSweeper lub przekazywanie aktywności GitHub
summary: Graf zadań CI, bramki zakresu, parasole wydań i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-05-06T09:05:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 189f717fac369d6374102612308c73705f19eca9baca81b24f052dbd5357e15f
    source_path: ci.md
    workflow: 16
---

OpenClaw CI działa przy każdym wypchnięciu do `main` i każdym pull requeście. Zadanie `preflight` klasyfikuje diff i wyłącza kosztowne ścieżki, gdy zmieniły się tylko niepowiązane obszary. Ręczne uruchomienia `workflow_dispatch` celowo omijają inteligentne zawężanie zakresu i rozwijają pełny graf dla kandydatów do wydania oraz szerokiej walidacji. Ścieżki Android pozostają opcjonalne przez `include_android`. Pokrycie Plugin tylko dla wydań znajduje się w osobnym workflow [`Plugin Prerelease`](#plugin-prerelease) i uruchamia się wyłącznie z [`Full Release Validation`](#full-release-validation) albo jawnego ręcznego dispatcha.

## Przegląd Pipeline

| Zadanie                          | Cel                                                                                                       | Kiedy się uruchamia                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `preflight`                      | Wykrywa zmiany tylko w dokumentacji, zmienione zakresy, zmienione rozszerzenia i buduje manifest CI      | Zawsze przy niedraftowych pushach i PR   |
| `security-scm-fast`              | Wykrywanie kluczy prywatnych i audyt workflow przez `zizmor`                                              | Zawsze przy niedraftowych pushach i PR   |
| `security-dependency-audit`      | Audyt produkcyjnego lockfile bez zależności względem advisories npm                                       | Zawsze przy niedraftowych pushach i PR   |
| `security-fast`                  | Wymagany agregat dla szybkich zadań bezpieczeństwa                                                        | Zawsze przy niedraftowych pushach i PR   |
| `check-dependencies`             | Produkcyjny przebieg Knip tylko dla zależności oraz strażnik allowlisty nieużywanych plików              | Zmiany istotne dla Node                  |
| `build-artifacts`                | Buduje `dist/`, Control UI, kontrole zbudowanych artefaktów i artefakty wielokrotnego użytku dalej       | Zmiany istotne dla Node                  |
| `checks-fast-core`               | Szybkie linuksowe ścieżki poprawności, takie jak kontrole bundled/plugin-contract/protocol                | Zmiany istotne dla Node                  |
| `checks-fast-contracts-channels` | Shardowane kontrole kontraktów kanałów ze stabilnym zagregowanym wynikiem kontroli                       | Zmiany istotne dla Node                  |
| `checks-node-core-test`          | Shardy testów core Node, z wyłączeniem ścieżek kanałów, bundled, kontraktów i rozszerzeń                  | Zmiany istotne dla Node                  |
| `check`                          | Shardowany odpowiednik głównej lokalnej bramki: typy prod, lint, strażniki, typy testów i ścisły smoke   | Zmiany istotne dla Node                  |
| `check-additional`               | Architektura, shardowany drift boundary/prompt, strażniki rozszerzeń, granica pakietu i gateway watch     | Zmiany istotne dla Node                  |
| `build-smoke`                    | Testy smoke zbudowanego CLI i smoke pamięci startowej                                                     | Zmiany istotne dla Node                  |
| `checks`                         | Weryfikator testów kanałów dla zbudowanych artefaktów                                                     | Zmiany istotne dla Node                  |
| `checks-node-compat-node22`      | Ścieżka budowania i smoke zgodności z Node 22                                                             | Ręczny dispatch CI dla wydań             |
| `check-docs`                     | Formatowanie dokumentacji, lint i kontrole uszkodzonych linków                                           | Zmieniona dokumentacja                   |
| `skills-python`                  | Ruff + pytest dla Skills opartych na Pythonie                                                             | Zmiany istotne dla Skills Python         |
| `checks-windows`                 | Testy procesów/ścieżek specyficzne dla Windows oraz regresje współdzielonych specyfikatorów importu runtime | Zmiany istotne dla Windows               |
| `macos-node`                     | Ścieżka testów TypeScript na macOS z użyciem współdzielonych zbudowanych artefaktów                      | Zmiany istotne dla macOS                 |
| `macos-swift`                    | Swift lint, build i testy dla aplikacji macOS                                                             | Zmiany istotne dla macOS                 |
| `android`                        | Testy jednostkowe Android dla obu wariantów oraz jedna kompilacja debug APK                               | Zmiany istotne dla Android               |
| `test-performance-agent`         | Codzienna optymalizacja wolnych testów przez Codex po zaufanej aktywności                                 | Sukces CI main albo ręczny dispatch      |
| `openclaw-performance`           | Dzienne/na żądanie raporty wydajności runtime Kova ze ścieżkami mock-provider, deep-profile i GPT 5.4 live | Harmonogram i ręczny dispatch            |

## Kolejność fail-fast

1. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie osobne zadania.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` szybko kończą się błędem, nie czekając na cięższe zadania artefaktów i macierzy platform.
3. `build-artifacts` nakłada się na szybkie ścieżki Linuksa, aby downstreamowi konsumenci mogli ruszyć, gdy tylko współdzielony build będzie gotowy.
4. Cięższe ścieżki platform i runtime rozwijają się później: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowszy push trafi do tego samego PR lub refa `main`. Traktuj to jako szum CI, chyba że najnowszy przebieg dla tego samego refa również kończy się błędem. Zagregowane kontrole shardów używają `!cancelled() && always()`, więc nadal raportują zwykłe błędy shardów, ale nie kolejkowane są po tym, jak cały workflow został już zastąpiony. Automatyczny klucz współbieżności CI jest wersjonowany (`CI-v7-*`), więc zombie po stronie GitHub w starej grupie kolejki nie może bezterminowo blokować nowszych przebiegów main. Ręczne przebiegi pełnego zestawu używają `CI-manual-v1-*` i nie anulują przebiegów w toku.

## Zakres i routing

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest pokryta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`. Ręczny dispatch pomija wykrywanie changed-scope i sprawia, że manifest preflight zachowuje się tak, jakby każdy zakresowy obszar uległ zmianie.

- **Edycje workflow CI** walidują graf CI Node oraz lint workflow, ale same z siebie nie wymuszają natywnych buildów Windows, Android ani macOS; te ścieżki platform pozostają ograniczone do zmian w źródłach platformowych.
- **Edycje tylko routingu CI, wybrane tanie edycje fixture testów core oraz wąskie edycje helperów/test-routingu kontraktów Plugin** używają szybkiej ścieżki manifestu tylko dla Node: `preflight`, bezpieczeństwo i jedno zadanie `checks-fast-core`. Ta ścieżka pomija artefakty builda, zgodność Node 22, kontrakty kanałów, pełne shardy core, shardy bundled-plugin i dodatkowe macierze strażników, gdy zmiana ogranicza się do powierzchni routingu lub helperów bezpośrednio ćwiczonych przez szybkie zadanie.
- **Kontrole Windows Node** są ograniczone do specyficznych dla Windows wrapperów procesów/ścieżek, helperów runnerów npm/pnpm/UI, konfiguracji menedżera pakietów oraz powierzchni workflow CI, które wykonują tę ścieżkę; niepowiązane zmiany źródeł, Plugin, install-smoke i wyłącznie testowe pozostają na linuksowych ścieżkach Node.

Najwolniejsze rodziny testów Node są podzielone lub zbalansowane, aby każde zadanie pozostawało małe bez nadmiernej rezerwacji runnerów: kontrakty kanałów działają jako trzy ważone shardy, szybkie/pomocnicze ścieżki jednostkowe core działają osobno, infrastruktura runtime core jest podzielona między shardy state i process/config, auto-reply działa jako zbalansowani workerzy (z poddrzewem reply podzielonym na shardy agent-runner, dispatch i commands/state-routing), a konfiguracje agentic gateway/server są podzielone między ścieżki chat/auth/model/http-plugin/runtime/startup zamiast czekać na zbudowane artefakty. Szerokie testy przeglądarkowe, QA, mediów i różnych Plugin używają własnych dedykowanych konfiguracji Vitest zamiast współdzielonego catch-all dla Plugin. Shardy include-pattern zapisują wpisy czasów z użyciem nazwy sharda CI, więc `.artifacts/vitest-shard-timings.json` może odróżnić całą konfigurację od filtrowanego sharda. `check-additional` trzyma razem pracę compile/canary granic pakietów i oddziela architekturę topologii runtime od pokrycia gateway watch; lista strażników boundary jest rozłożona pasmowo na cztery shardy macierzy, z których każdy uruchamia wybrane niezależne strażniki współbieżnie i wypisuje czasy poszczególnych kontroli, w tym `pnpm prompt:snapshots:check`, aby drift promptów szczęśliwej ścieżki runtime Codex był przypięty do PR, który go spowodował. Gateway watch, testy kanałów i shard support-boundary core działają współbieżnie w `build-artifacts` po zbudowaniu `dist/` i `dist-runtime/`.

Android CI uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a następnie buduje Play debug APK. Wariant third-party nie ma osobnego zestawu źródeł ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje wariant z flagami BuildConfig SMS/call-log, unikając jednocześnie duplikowania zadania pakowania debug APK przy każdym pushu istotnym dla Android.

Shard `check-dependencies` uruchamia `pnpm deadcode:dependencies` (produkcyjny przebieg Knip tylko dla zależności przypięty do najnowszej wersji Knip, z wyłączonym minimalnym wiekiem wydania pnpm dla instalacji `dlx`) oraz `pnpm deadcode:unused-files`, który porównuje produkcyjne wyniki nieużywanych plików Knip z `scripts/deadcode-unused-files.allowlist.mjs`. Strażnik nieużywanych plików kończy się błędem, gdy PR dodaje nowy nieprzejrzany nieużywany plik albo zostawia nieaktualny wpis allowlisty, zachowując jednocześnie celowe powierzchnie dynamicznych Plugin, generowane, build, live-test i mostów pakietów, których Knip nie potrafi statycznie rozwiązać.

## Przekazywanie aktywności ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` jest mostem po stronie celu z aktywności repozytorium OpenClaw do ClawSweeper. Nie pobiera ani nie wykonuje niezaufanego kodu pull requesta. Workflow tworzy token GitHub App z `CLAWSWEEPER_APP_PRIVATE_KEY`, a następnie wysyła zwarte ładunki `repository_dispatch` do `openclaw/clawsweeper`.

Workflow ma cztery ścieżki:

- `clawsweeper_item` dla dokładnych żądań przeglądu issue i pull requestów;
- `clawsweeper_comment` dla jawnych poleceń ClawSweeper w komentarzach issue;
- `clawsweeper_commit_review` dla żądań przeglądu na poziomie commitów przy pushach do `main`;
- `github_activity` dla ogólnej aktywności GitHub, którą agent ClawSweeper może sprawdzić.

Ścieżka `github_activity` przekazuje wyłącznie znormalizowane metadane: typ zdarzenia, akcję, aktora, repozytorium, numer elementu, URL, tytuł, stan oraz krótkie fragmenty komentarzy lub recenzji, gdy występują. Celowo unika przekazywania pełnego ciała webhooka. Odbierający workflow w `openclaw/clawsweeper` to `.github/workflows/github-activity.yml`, który publikuje znormalizowane zdarzenie do hooka OpenClaw Gateway dla agenta ClawSweeper.

Ogólna aktywność jest obserwacją, a nie domyślnym dostarczaniem. Agent ClawSweeper otrzymuje cel Discord w swoim prompcie i powinien publikować w `#clawsweeper` tylko wtedy, gdy zdarzenie jest zaskakujące, możliwe do działania, ryzykowne albo operacyjnie użyteczne. Rutynowe otwarcia, edycje, ruch botów, szum zduplikowanych Webhook i zwykły ruch recenzji powinny skutkować `NO_REPLY`.

Traktuj tytuły, komentarze, treści, tekst recenzji, nazwy branchy i komunikaty commitów GitHub jako niezaufane dane w całej tej ścieżce. Są wejściem do podsumowywania i triage, a nie instrukcjami dla workflow ani runtime agenta.

## Ręczne dispatche

Ręczne uruchomienia CI wykonują ten sam graf zadań co zwykłe CI, ale wymuszają włączenie każdej ścieżki zakresowej innej niż Android: shardy Linux Node, shardy dołączonych Pluginów, kontrakty kanałów, zgodność z Node 22, `check`, `check-additional`, build smoke, kontrole dokumentacji, Python skills, Windows, macOS oraz i18n Control UI. Samodzielne ręczne uruchomienia CI wykonują tylko Android z `include_android=true`; pełny parasol wydania włącza Android przez przekazanie `include_android=true`. Statyczne kontrole przedwydaniowe Pluginów, wyłącznie wydaniowy shard `agentic-plugins`, pełny wsadowy przegląd rozszerzeń oraz przedwydaniowe ścieżki Docker dla Pluginów są wyłączone z CI. Pakiet przedwydaniowy Docker uruchamia się tylko wtedy, gdy `Full Release Validation` uruchamia osobny workflow `Plugin Prerelease` z włączoną bramką walidacji wydania.

Ręczne uruchomienia używają unikalnej grupy współbieżności, więc pełny pakiet kandydata do wydania nie zostanie anulowany przez inne uruchomienie push lub PR na tym samym refie. Opcjonalne wejście `target_ref` pozwala zaufanemu wywołującemu uruchomić ten graf względem gałęzi, tagu lub pełnego SHA commita, używając pliku workflow z wybranego refa uruchomienia.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnery

| Runner                           | Zadania                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, szybkie zadania i agregaty bezpieczeństwa (`security-scm-fast`, `security-dependency-audit`, `security-fast`), szybkie kontrole protokołu/kontraktów/dołączonych elementów, shardowane kontrole kontraktów kanałów, shardy `check` poza lintem, agregaty `check-additional`, weryfikatory agregatów testów Node, kontrole dokumentacji, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke także używa Ubuntu hostowanego przez GitHub, aby macierz Blacksmith mogła wcześniej wejść do kolejki |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lżejsze shardy rozszerzeń, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` oraz `check-test-types`                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shardy testów Linux Node, shardy testów dołączonych Pluginów, shardy `check-additional`, `android`                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (wystarczająco wrażliwy na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało); buildy Docker install-smoke (czas oczekiwania w kolejce 32-vCPU kosztował więcej, niż oszczędzał)                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` w `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` w `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |

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
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ręczne uruchomienie zwykle benchmarkuje ref workflow. Ustaw `target_ref`, aby zbenchmarkować tag wydania lub inną gałąź z bieżącą implementacją workflow. Opublikowane ścieżki raportów i najnowsze wskaźniki są kluczowane według testowanego refa, a każdy `index.md` zapisuje testowany ref/SHA, ref/SHA workflow, ref Kova, profil, tryb autoryzacji ścieżki, model, liczbę powtórzeń i filtry scenariuszy.

Workflow instaluje OCM z przypiętego wydania oraz Kova z `openclaw/Kova` na przypiętym wejściu `kova_ref`, a następnie uruchamia trzy ścieżki:

- `mock-provider`: scenariusze diagnostyczne Kova względem runtime z lokalnego buildu z deterministyczną fałszywą autoryzacją zgodną z OpenAI.
- `mock-deep-profile`: profilowanie CPU/sterty/trace dla hotspotów uruchamiania, Gateway i tury agenta.
- `live-gpt54`: rzeczywista tura agenta OpenAI `openai/gpt-5.4`, pomijana, gdy `OPENAI_API_KEY` jest niedostępny.

Ścieżka mock-provider uruchamia także natywne sondy źródłowe OpenClaw po przejściu Kova: czas bootowania Gateway i pamięć w przypadkach uruchamiania domyślnego, z hookiem oraz z 50 Pluginami; powtarzane pętle hello mock-OpenAI `channel-chat-baseline`; oraz polecenia startowe CLI względem uruchomionego Gateway. Podsumowanie Markdown sondy źródłowej znajduje się w `source/index.md` w pakiecie raportu, z surowym JSON obok.

Każda ścieżka przesyła artefakty GitHub. Gdy skonfigurowany jest `CLAWGRIT_REPORTS_TOKEN`, workflow także commituję `report.json`, `report.md`, pakiety, `index.md` oraz artefakty sond źródłowych do `openclaw/clawgrit-reports` pod `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Bieżący wskaźnik testowanego refa jest zapisywany jako `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Pełna walidacja wydania

`Full Release Validation` to ręczny workflow-parasol dla „uruchom wszystko przed wydaniem”. Przyjmuje gałąź, tag lub pełny SHA commita, uruchamia ręczny workflow `CI` z tym celem, uruchamia `Plugin Prerelease` dla wyłącznie wydaniowego dowodu Pluginów/pakietów/statycznego/Docker oraz uruchamia `OpenClaw Release Checks` dla install smoke, akceptacji pakietów, kontroli pakietów między systemami OS, parytetu QA Lab, Matrix i ścieżek Telegram. Stabilne/domyślne uruchomienia trzymają wyczerpujące live/E2E i pokrycie ścieżki wydaniowej Docker za `run_release_soak=true`; `release_profile=full` wymusza włączenie tego pokrycia soak, aby szeroka walidacja doradcza pozostała szeroka. Z `rerun_group=all` i `release_profile=full` uruchamia także `NPM Telegram Beta E2E` względem artefaktu `release-package-under-test` z kontroli wydania. Po publikacji przekaż `npm_telegram_package_spec`, aby ponownie uruchomić tę samą ścieżkę pakietu Telegram względem opublikowanego pakietu npm.

Zobacz [Pełna walidacja wydania](/pl/reference/full-release-validation), aby poznać
macierz etapów, dokładne nazwy zadań workflow, różnice profili, artefakty oraz
uchwyty ukierunkowanego ponownego uruchomienia.

`OpenClaw Release Publish` to ręczny mutujący workflow wydania. Uruchom go
z `release/YYYY.M.D` lub `main` po tym, jak tag wydania już istnieje i po
powodzeniu preflightu npm OpenClaw. Weryfikuje `pnpm plugins:sync:check`,
uruchamia `Plugin NPM Release` dla wszystkich publikowalnych pakietów Plugin,
uruchamia `Plugin ClawHub Release` dla tego samego SHA wydania i dopiero wtedy
uruchamia `OpenClaw NPM Release` z zapisanym `preflight_run_id`.

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

Refy uruchomienia workflow GitHub muszą być gałęziami lub tagami, a nie surowymi SHA commitów. Helper wypycha tymczasową gałąź `release-ci/<sha>-...` na docelowym SHA, uruchamia `Full Release Validation` z tego przypiętego refa, weryfikuje, że każdy workflow potomny `headSha` pasuje do celu, i usuwa tymczasową gałąź po zakończeniu uruchomienia. Weryfikator parasola także kończy się niepowodzeniem, jeśli jakikolwiek workflow potomny działał na innym SHA.

`release_profile` kontroluje zakres live/dostawców przekazywany do kontroli wydania. Ręczne przepływy pracy wydania domyślnie używają `stable`; użyj `full` tylko wtedy, gdy celowo chcesz uruchomić szeroką macierz doradczą dostawców/mediów. `run_release_soak` kontroluje, czy stabilne/domyślne kontrole wydania uruchamiają wyczerpujące testy live/E2E oraz Docker release-path soak; `full` wymusza włączenie soak.

- `minimum` zachowuje najszybsze krytyczne dla wydania ścieżki OpenAI/core.
- `stable` dodaje stabilny zestaw dostawców/backendów.
- `full` uruchamia szeroką macierz doradczą dostawców/mediów.

Nadrzędny przebieg zapisuje identyfikatory uruchomionych przebiegów podrzędnych, a końcowe zadanie `Verify full validation` ponownie sprawdza bieżące wyniki przebiegów podrzędnych i dołącza tabele najwolniejszych zadań dla każdego przebiegu podrzędnego. Jeśli podrzędny przepływ pracy zostanie uruchomiony ponownie i zakończy się powodzeniem, uruchom ponownie tylko nadrzędne zadanie weryfikatora, aby odświeżyć wynik nadrzędny i podsumowanie czasów.

Do odzyskiwania zarówno `Full Release Validation`, jak i `OpenClaw Release Checks` akceptują `rerun_group`. Użyj `all` dla kandydata do wydania, `ci` tylko dla zwykłego podrzędnego pełnego CI, `plugin-prerelease` tylko dla podrzędnego prerelease Plugin, `release-checks` dla każdego podrzędnego sprawdzenia wydania albo węższej grupy: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` lub `npm-telegram` w przebiegu nadrzędnym. Dzięki temu ponowne uruchomienie nieudanego pola wydania pozostaje ograniczone po ukierunkowanej poprawce. Dla jednej nieudanej ścieżki cross-OS połącz `rerun_group=cross-os` z `cross_os_suite_filter`, na przykład `windows/packaged-upgrade`; długie polecenia cross-OS emitują linie heartbeat, a podsumowania packaged-upgrade zawierają czasy poszczególnych faz. Ścieżki QA kontroli wydania mają charakter doradczy, więc awarie wyłącznie QA ostrzegają, ale nie blokują weryfikatora kontroli wydania.

`OpenClaw Release Checks` używa zaufanego odwołania przepływu pracy, aby jednorazowo rozwiązać wybrane odwołanie do archiwum `release-package-under-test`, a następnie przekazuje ten artefakt do kontroli cross-OS i Package Acceptance oraz do przepływu pracy live/E2E release-path Docker, gdy uruchamiane jest pokrycie soak. Dzięki temu bajty pakietu pozostają spójne między polami wydania i unika się ponownego pakowania tego samego kandydata w wielu zadaniach podrzędnych.

Zduplikowane uruchomienia `Full Release Validation` dla `ref=main` i `rerun_group=all`
zastępują starszy przebieg nadrzędny. Monitor nadrzędny anuluje każdy podrzędny przepływ pracy, który
już uruchomił, gdy przebieg nadrzędny zostanie anulowany, więc nowsza walidacja main
nie czeka za przestarzałym dwugodzinnym przebiegiem kontroli wydania. Walidacja gałęzi/tagu wydania
oraz ukierunkowane grupy ponownego uruchomienia zachowują `cancel-in-progress: false`.

## Shardy live i E2E

Podrzędny przebieg live/E2E wydania zachowuje szerokie natywne pokrycie `pnpm test:live`, ale uruchamia je jako nazwane shardy przez `scripts/test-live-shard.mjs` zamiast jednego zadania szeregowego:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- zadania `native-live-src-gateway-profiles` filtrowane według dostawcy
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- podzielone shardy audio/wideo mediów oraz shardy muzyki filtrowane według dostawcy

Zachowuje to to samo pokrycie plików, a jednocześnie ułatwia ponowne uruchamianie i diagnozowanie powolnych awarii dostawców live. Zagregowane nazwy shardów `native-live-extensions-o-z`, `native-live-extensions-media` i `native-live-extensions-media-music` pozostają ważne dla ręcznych jednorazowych ponownych uruchomień.

Natywne shardy mediów live działają w `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, budowanym przez przepływ pracy `Live Media Runner Image`. Ten obraz ma wstępnie zainstalowane `ffmpeg` i `ffprobe`; zadania mediów tylko weryfikują pliki binarne przed konfiguracją. Zestawy live oparte na Dockerze trzymaj na zwykłych runnerach Blacksmith — zadania kontenerowe są niewłaściwym miejscem do uruchamiania zagnieżdżonych testów Docker.

Shardy modeli/backendów live oparte na Dockerze używają osobnego współdzielonego obrazu `ghcr.io/openclaw/openclaw-live-test:<sha>` dla wybranego commita. Przepływ pracy wydania live buduje i wypycha ten obraz raz, a następnie shardy modelu live Docker, Gateway podzielonego według dostawcy, backendu CLI, powiązania ACP i uprzęży Codex działają z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shardy Gateway Docker mają jawne limity `timeout` na poziomie skryptu poniżej limitu czasu zadania przepływu pracy, aby zablokowany kontener lub ścieżka czyszczenia szybko kończyły się niepowodzeniem zamiast zużywać cały budżet kontroli wydania. Jeśli te shardy niezależnie odbudowują pełny docelowy obraz Docker źródeł, przebieg wydania jest błędnie skonfigurowany i zmarnuje czas zegarowy na zduplikowane budowanie obrazów.

## Package Acceptance

Użyj `Package Acceptance`, gdy pytanie brzmi: „czy ten instalowalny pakiet OpenClaw działa jako produkt?”. Różni się to od zwykłego CI: zwykłe CI waliduje drzewo źródeł, natomiast package acceptance waliduje pojedyncze archiwum przez tę samą uprząż Docker E2E, której użytkownicy używają po instalacji lub aktualizacji.

### Zadania

1. `resolve_package` pobiera `workflow_ref`, rozwiązuje jednego kandydata pakietu, zapisuje `.artifacts/docker-e2e-package/openclaw-current.tgz`, zapisuje `.artifacts/docker-e2e-package/package-candidate.json`, przesyła oba jako artefakt `package-under-test` oraz wypisuje źródło, odwołanie przepływu pracy, odwołanie pakietu, wersję, SHA-256 i profil w podsumowaniu kroku GitHub.
2. `docker_acceptance` wywołuje `openclaw-live-and-e2e-checks-reusable.yml` z `ref=workflow_ref` i `package_artifact_name=package-under-test`. Wielokrotnego użytku przepływ pracy pobiera ten artefakt, waliduje inwentarz archiwum, przygotowuje obrazy Docker z digestem pakietu, gdy jest to potrzebne, i uruchamia wybrane ścieżki Docker względem tego pakietu zamiast pakować checkout przepływu pracy. Gdy profil wybiera wiele ukierunkowanych `docker_lanes`, wielokrotnego użytku przepływ pracy przygotowuje pakiet i współdzielone obrazy raz, a następnie rozdziela te ścieżki jako równoległe ukierunkowane zadania Docker z unikalnymi artefaktami.
3. `package_telegram` opcjonalnie wywołuje `NPM Telegram Beta E2E`. Działa, gdy `telegram_mode` nie jest `none`, i instaluje ten sam artefakt `package-under-test`, gdy Package Acceptance rozwiązało pakiet; samodzielne uruchomienie Telegram nadal może zainstalować opublikowaną specyfikację npm.
4. `summary` kończy przepływ pracy niepowodzeniem, jeśli rozwiązywanie pakietu, akceptacja Docker albo opcjonalna ścieżka Telegram zakończyły się niepowodzeniem.

### Źródła kandydatów

- `source=npm` akceptuje tylko `openclaw@beta`, `openclaw@latest` albo dokładną wersję wydania OpenClaw, taką jak `openclaw@2026.4.27-beta.2`. Używaj tego do akceptacji opublikowanego prerelease/stable.
- `source=ref` pakuje zaufaną gałąź, tag albo pełny SHA commita `package_ref`. Resolver pobiera gałęzie/tagi OpenClaw, weryfikuje, że wybrany commit jest osiągalny z historii gałęzi repozytorium albo tagu wydania, instaluje zależności w odłączonym worktree i pakuje go za pomocą `scripts/package-openclaw-for-docker.mjs`.
- `source=url` pobiera HTTPS `.tgz`; `package_sha256` jest wymagane.
- `source=artifact` pobiera jedno `.tgz` z `artifact_run_id` i `artifact_name`; `package_sha256` jest opcjonalne, ale należy je podać dla artefaktów udostępnianych zewnętrznie.

Trzymaj `workflow_ref` i `package_ref` osobno. `workflow_ref` to zaufany kod przepływu pracy/uprzęży, który uruchamia test. `package_ref` to commit źródłowy, który zostaje spakowany, gdy `source=ref`. Pozwala to bieżącej uprzęży testowej walidować starsze zaufane commity źródłowe bez uruchamiania starej logiki przepływu pracy.

### Profile zestawów

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — pełne fragmenty Docker release-path z OpenWebUI
- `custom` — dokładne `docker_lanes`; wymagane, gdy `suite_profile=custom`

Profil `package` używa offline pokrycia Plugin, aby walidacja opublikowanego pakietu nie była uzależniona od dostępności ClawHub live. Opcjonalna ścieżka Telegram ponownie używa artefaktu `package-under-test` w `NPM Telegram Beta E2E`, a ścieżka opublikowanej specyfikacji npm jest zachowana dla samodzielnych uruchomień.

Dedykowane zasady testowania aktualizacji i Plugin, w tym lokalne polecenia,
ścieżki Docker, wejścia Package Acceptance, domyślne ustawienia wydań i triage awarii,
zobacz w [Testowanie aktualizacji i Plugin](/pl/help/testing-updates-plugins).

Kontrole wydania wywołują Package Acceptance z `source=artifact`, przygotowanym artefaktem pakietu wydania, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` i `telegram_mode=mock-openai`. Dzięki temu migracja pakietu, aktualizacja, czyszczenie przestarzałych zależności Plugin, naprawa instalacji skonfigurowanego Plugin, offline Plugin, plugin-update oraz dowód Telegram działają na tym samym rozwiązanym archiwum pakietu. Ustaw `package_acceptance_package_spec` w Full Release Validation lub OpenClaw Release Checks, aby uruchomić tę samą macierz względem dostarczonego pakietu npm zamiast artefaktu zbudowanego z SHA. Kontrole wydania cross-OS nadal obejmują specyficzne dla systemu operacyjnego onboardowanie, instalator i zachowanie platformy; walidację produktu pakietu/aktualizacji należy zaczynać od Package Acceptance. Ścieżka Docker `published-upgrade-survivor` waliduje jedną opublikowaną bazę pakietu na przebieg w blokującej ścieżce wydania. W Package Acceptance rozwiązane archiwum `package-under-test` jest zawsze kandydatem, a `published_upgrade_survivor_baseline` wybiera zastępczą opublikowaną bazę, domyślnie `openclaw@latest`; polecenia ponownego uruchomienia nieudanej ścieżki zachowują tę bazę. Full Release Validation z `run_release_soak=true` albo `release_profile=full` ustawia `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` i `published_upgrade_survivor_scenarios=reported-issues`, aby rozszerzyć zakres na cztery najnowsze stabilne wydania npm oraz przypięte wydania graniczne kompatybilności Plugin i fixture'y odwzorowujące zgłoszenia dla konfiguracji Feishu, zachowanych plików bootstrap/persona, instalacji skonfigurowanych Plugin OpenClaw, ścieżek logów z tyldą i przestarzałych katalogów głównych zależności starszych Plugin. Wybory published-upgrade survivor z wieloma bazami są dzielone według bazy na osobne ukierunkowane zadania runnera Docker. Osobny przepływ pracy `Update Migration` używa ścieżki Docker `update-migration` z `all-since-2026.4.23` i `plugin-deps-cleanup`, gdy pytanie dotyczy wyczerpującego czyszczenia opublikowanych aktualizacji, a nie zwykłego zakresu Full Release CI. Lokalne przebiegi zagregowane mogą przekazywać dokładne specyfikacje pakietów przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, zachować pojedynczą ścieżkę z `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, taką jak `openclaw@2026.4.15`, albo ustawić `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` dla macierzy scenariuszy. Opublikowana ścieżka konfiguruje bazę z wbudowanym przepisem polecenia `openclaw config set`, zapisuje kroki przepisu w `summary.json` oraz sprawdza `/healthz`, `/readyz` i status RPC po starcie Gateway. Ścieżki świeżej instalacji pakietowej i instalatora Windows weryfikują także, że zainstalowany pakiet może zaimportować override kontroli przeglądarki z surowej bezwzględnej ścieżki Windows. Smoke cross-OS agent-turn OpenAI domyślnie używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy jest ustawione, w przeciwnym razie `openai/gpt-5.4`, dzięki czemu dowód instalacji i Gateway pozostaje na modelu testowym GPT-5, unikając domyślnych wartości GPT-4.x.

### Okna zgodności ze starszymi wersjami

Package Acceptance ma ograniczone okna zgodności ze starszymi wersjami dla już opublikowanych pakietów. Pakiety do `2026.4.25` włącznie, w tym `2026.4.25-beta.*`, mogą używać ścieżki zgodności:

- znane prywatne wpisy QA w `dist/postinstall-inventory.json` mogą wskazywać pliki pominięte w archiwum;
- `doctor-switch` może pominąć podprzypadek trwałości `gateway install --wrapper`, gdy pakiet nie udostępnia tej flagi;
- `update-channel-switch` może przycinać brakujące `pnpm.patchedDependencies` z fałszywego fixture git pochodzącego z archiwum i może logować brak utrwalonego `update.channel`;
- smoke testy Plugin mogą odczytywać starsze lokalizacje rekordów instalacji albo akceptować brak trwałości rekordu instalacji marketplace;
- `plugin-update` może zezwolić na migrację metadanych konfiguracji, nadal wymagając, aby rekord instalacji i zachowanie bez reinstalacji pozostały bez zmian.

Opublikowany pakiet `2026.4.26` może też ostrzegać o lokalnych plikach znaczników metadanych kompilacji, które zostały już wydane. Późniejsze pakiety muszą spełniać nowoczesne kontrakty; te same warunki powodują błąd zamiast ostrzeżenia albo pominięcia.

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

Podczas debugowania nieudanego przebiegu akceptacji pakietu zacznij od podsumowania `resolve_package`, aby potwierdzić źródło pakietu, wersję i SHA-256. Następnie sprawdź przebieg potomny `docker_acceptance` oraz jego artefakty Dockera: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logi ścieżek, czasy faz i polecenia ponownego uruchomienia. Preferuj ponowne uruchomienie nieudanego profilu pakietu albo dokładnych ścieżek Dockera zamiast ponownego uruchamiania pełnej walidacji wydania.

## Smoke test instalacji

Oddzielny workflow `Install Smoke` używa ponownie tego samego skryptu zakresu przez własne zadanie `preflight`. Dzieli pokrycie smoke testów na `run_fast_install_smoke` i `run_full_install_smoke`.

- **Szybka ścieżka** działa dla pull requestów dotykających powierzchni Dockera/pakietów, zmian pakietów/manifestów dołączonych Plugin, albo powierzchni rdzenia Plugin/kanału/Gateway/Plugin SDK, które sprawdzają zadania smoke testów Dockera. Zmiany dotyczące wyłącznie źródeł dołączonych Plugin, edycje wyłącznie testowe oraz edycje wyłącznie dokumentacji nie rezerwują workerów Dockera. Szybka ścieżka buduje obraz z głównego pliku Dockerfile raz, sprawdza CLI, uruchamia smoke test CLI usuwania agentów ze współdzielonego workspace, uruchamia e2e sieci Gateway w kontenerze, weryfikuje argument kompilacji dołączonego rozszerzenia i uruchamia ograniczony profil Dockera dla dołączonych Plugin z łącznym limitem czasu polecenia 240 sekund (każdy przebieg Dockera scenariusza jest limitowany osobno).
- **Pełna ścieżka** zachowuje instalację pakietu QR oraz pokrycie instalatora Docker/aktualizacji dla nocnych zaplanowanych przebiegów, ręcznych uruchomień, wywoływanych workflow kontroli wydania oraz pull requestów, które rzeczywiście dotykają powierzchni instalatora/pakietu/Dockera. W trybie pełnym install-smoke przygotowuje albo ponownie używa jednego obrazu smoke testu GHCR z głównym Dockerfile dla docelowego SHA, a następnie uruchamia instalację pakietu QR, smoke testy głównego Dockerfile/Gateway, smoke testy instalatora/aktualizacji oraz szybkie Docker E2E dołączonych Plugin jako oddzielne zadania, aby prace instalatora nie czekały za smoke testami głównego obrazu.

Wypchnięcia na `main` (w tym commity scalające) nie wymuszają pełnej ścieżki; gdy logika zakresu zmian zażądałaby pełnego pokrycia przy wypchnięciu, workflow zachowuje szybki smoke test Dockera i pozostawia pełny smoke test instalacji dla przebiegów nocnych albo walidacji wydania.

Wolny smoke test globalnej instalacji Bun z dostawcą obrazu jest bramkowany osobno przez `run_bun_global_install_smoke`. Działa według harmonogramu nocnego oraz z workflow kontroli wydania, a ręczne uruchomienia `Install Smoke` mogą go włączyć, ale pull requesty i wypchnięcia na `main` tego nie robią. Testy Dockera QR i instalatora zachowują własne, skupione na instalacji pliki Dockerfile.

## Lokalne Docker E2E

`pnpm test:docker:all` wstępnie buduje jeden współdzielony obraz live-test, pakuje OpenClaw raz jako tarball npm i buduje dwa współdzielone obrazy `scripts/e2e/Dockerfile`:

- podstawowy runner Node/Git dla ścieżek instalatora/aktualizacji/zależności Plugin;
- funkcjonalny obraz, który instaluje ten sam tarball w `/app` dla zwykłych ścieżek funkcjonalności.

Definicje ścieżek Dockera znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`, logika planera w `scripts/lib/docker-e2e-plan.mjs`, a runner wykonuje tylko wybrany plan. Scheduler wybiera obraz dla każdej ścieżki za pomocą `OPENCLAW_DOCKER_E2E_BARE_IMAGE` i `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, a następnie uruchamia ścieżki z `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametry

| Zmienna                                | Domyślnie | Cel                                                                                           |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Liczba slotów głównej puli dla zwykłych ścieżek.                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Liczba slotów puli końcowej wrażliwej na dostawców.                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limit współbieżnych ścieżek live, aby dostawcy nie ograniczali przepustowości.                |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | Limit współbieżnych ścieżek instalacji npm.                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limit współbieżnych ścieżek z wieloma usługami.                                               |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Odstęp między startami ścieżek, aby uniknąć burz tworzenia demona Dockera; ustaw `0`, aby go wyłączyć. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Awaryjny limit czasu na ścieżkę (120 minut); wybrane ścieżki live/końcowe używają ciaśniejszych limitów. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset     | `1` wypisuje plan schedulera bez uruchamiania ścieżek.                                        |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset     | Dokładna lista ścieżek oddzielona przecinkami; pomija smoke test czyszczenia, aby agenci mogli odtworzyć jedną nieudaną ścieżkę. |

Ścieżka cięższa niż jej efektywny limit nadal może wystartować z pustej puli, po czym działa sama, dopóki nie zwolni pojemności. Lokalny agregat wykonuje preflight Dockera, usuwa przestarzałe kontenery OpenClaw E2E, emituje status aktywnych ścieżek, utrwala czasy ścieżek do sortowania od najdłuższych i domyślnie przestaje planować nowe ścieżki pulowane po pierwszej awarii.

### Workflow live/E2E do ponownego użycia

Workflow live/E2E do ponownego użycia pyta `scripts/test-docker-all.mjs --plan-json`, jaki pakiet, rodzaj obrazu, obraz live, ścieżka i pokrycie poświadczeń są wymagane. `scripts/docker-e2e.mjs` następnie przekształca ten plan w wyjścia i podsumowania GitHub. Albo pakuje OpenClaw przez `scripts/package-openclaw-for-docker.mjs`, pobiera artefakt pakietu z bieżącego przebiegu, albo pobiera artefakt pakietu z `package_artifact_run_id`; waliduje inwentarz tarballa; buduje i wypycha obrazy Docker E2E GHCR bare/functional tagowane skrótem pakietu przez cache warstw Dockera Blacksmitha, gdy plan wymaga ścieżek z zainstalowanym pakietem; oraz ponownie używa podanych wejść `docker_e2e_bare_image`/`docker_e2e_functional_image` albo istniejących obrazów ze skrótem pakietu zamiast przebudowy. Pobieranie obrazów Dockera jest ponawiane z ograniczonym limitem 180 sekund na próbę, aby zablokowany strumień rejestru/cache szybko ponowił próbę zamiast zużywać większość krytycznej ścieżki CI.

### Fragmenty ścieżki wydania

Pokrycie Dockera dla wydania uruchamia mniejsze zadania we fragmentach z `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby każdy fragment pobierał tylko potrzebny rodzaj obrazu i wykonywał wiele ścieżek przez ten sam ważony scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Obecne fragmenty Dockera dla wydania to `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` oraz `plugins-runtime-install-a` do `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` i `plugins-integrations` pozostają zagregowanymi aliasami Plugin/runtime. Alias ścieżki `install-e2e` pozostaje zagregowanym aliasem ręcznego ponownego uruchomienia dla obu ścieżek instalatora dostawcy.

OpenWebUI jest włączany do `plugins-runtime-services`, gdy żąda tego pełne pokrycie ścieżki wydania, i zachowuje samodzielny fragment `openwebui` tylko dla uruchomień dotyczących wyłącznie OpenWebUI. Ścieżki aktualizacji dołączonych kanałów ponawiają raz próbę przy przejściowych awariach sieci npm.

Każdy fragment przesyła `.artifacts/docker-tests/` z logami ścieżek, czasami, `summary.json`, `failures.json`, czasami faz, JSON-em planu schedulera, tabelami wolnych ścieżek oraz poleceniami ponownego uruchomienia dla każdej ścieżki. Wejście workflow `docker_lanes` uruchamia wybrane ścieżki na przygotowanych obrazach zamiast zadań fragmentów, co ogranicza debugowanie nieudanej ścieżki do jednego ukierunkowanego zadania Dockera i przygotowuje, pobiera albo ponownie używa artefaktu pakietu dla tego przebiegu; jeśli wybrana ścieżka jest ścieżką live Dockera, ukierunkowane zadanie buduje obraz live-test lokalnie dla tego ponownego uruchomienia. Wygenerowane polecenia GitHub do ponownego uruchomienia dla każdej ścieżki zawierają `package_artifact_run_id`, `package_artifact_name` i wejścia przygotowanych obrazów, gdy te wartości istnieją, aby nieudana ścieżka mogła ponownie użyć dokładnego pakietu i obrazów z nieudanego przebiegu.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zaplanowany workflow live/E2E uruchamia codziennie pełny zestaw Dockera ścieżki wydania.

## Wydanie wstępne Plugin

`Plugin Prerelease` to droższe pokrycie produktu/pakietu, więc jest oddzielnym workflow uruchamianym przez `Full Release Validation` albo przez wyraźne działanie operatora. Zwykłe pull requesty, wypchnięcia na `main` i samodzielne ręczne uruchomienia CI pozostawiają ten zestaw wyłączony. Równoważy testy dołączonych Plugin między ośmioma workerami rozszerzeń; te zadania shardów rozszerzeń uruchamiają do dwóch grup konfiguracji Plugin naraz, z jednym workerem Vitest na grupę i większym stosem Node, aby partie Plugin intensywnie importujące moduły nie tworzyły dodatkowych zadań CI. Ścieżka Docker prerelease tylko dla wydania grupuje ukierunkowane ścieżki Dockera w małe grupy, aby uniknąć rezerwowania dziesiątek runnerów dla zadań trwających od jednej do trzech minut.

## QA Lab

QA Lab ma dedykowane ścieżki CI poza głównym workflow inteligentnie ograniczanym zakresem. Parzystość agentowa jest zagnieżdżona pod szerokimi harnessami QA i wydania, a nie jako samodzielny workflow PR. Użyj `Full Release Validation` z `rerun_group=qa-parity`, gdy parzystość ma iść razem z szerokim przebiegiem walidacji.

- Workflow `QA-Lab - All Lanes` działa nocą na `main` i przy ręcznym uruchomieniu; rozdziela ścieżkę mock parity, ścieżkę live Matrix oraz ścieżki live Telegram i Discord jako zadania równoległe. Zadania live używają środowiska `qa-live-shared`, a Telegram/Discord używają dzierżaw Convex.

Kontrole wydania uruchamiają ścieżki transportu live Matrix i Telegram z deterministycznym dostawcą mock i modelami kwalifikowanymi jako mock (`mock-openai/gpt-5.5` oraz `mock-openai/gpt-5.5-alt`), aby kontrakt kanału był odizolowany od opóźnień modelu live i zwykłego uruchamiania provider-plugin. Gateway transportu live wyłącza wyszukiwanie pamięci, ponieważ QA parity pokrywa zachowanie pamięci osobno; łączność dostawców jest pokrywana przez oddzielne zestawy modeli live, natywnych dostawców i dostawców Dockera.

Matrix używa `--profile fast` dla bramek zaplanowanych i wydania, dodając `--fail-fast` tylko wtedy, gdy obsługuje to pobrany CLI. Domyślna wartość CLI i ręczne wejście workflow pozostają `all`; ręczne uruchomienie `matrix_profile=all` zawsze sharduje pełne pokrycie Matrix na zadania `transport`, `media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`.

`OpenClaw Release Checks` uruchamia także krytyczne dla wydania ścieżki QA Lab przed zatwierdzeniem wydania; jego bramka QA parity uruchamia pakiety kandydata i bazowe jako równoległe zadania ścieżek, a następnie pobiera oba artefakty do małego zadania raportującego dla końcowego porównania parzystości.

W przypadku zwykłych PR-ów stosuj dowody ze scoped CI/check zamiast traktować parity jako wymagany status.

## CodeQL

Workflow `CodeQL` jest celowo wąskim skanerem bezpieczeństwa pierwszego przejścia, a nie pełnym przeglądem repozytorium. Codzienne, ręczne oraz ochronne uruchomienia dla pull requestów, które nie są szkicami, skanują kod workflow Actions oraz powierzchnie JavaScript/TypeScript o najwyższym ryzyku, używając zapytań bezpieczeństwa o wysokiej pewności filtrowanych do wysokiego/krytycznego `security-severity`.

Ochrona pull requestów pozostaje lekka: uruchamia się tylko dla zmian w `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` lub `src`, i wykonuje tę samą macierz bezpieczeństwa o wysokiej pewności co zaplanowany workflow. Android i macOS CodeQL pozostają poza domyślnymi ustawieniami PR.

### Kategorie bezpieczeństwa

| Kategoria                                         | Powierzchnia                                                                                                                        |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, sekrety, sandbox, cron oraz bazowy gateway                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrakty implementacji kanałów rdzenia oraz runtime pluginu kanału, gateway, Plugin SDK, sekrety, punkty styku audytu             |
| `/codeql-security-high/network-ssrf-boundary`     | Powierzchnie zasad SSRF rdzenia, parsowania IP, ochrony sieci, web-fetch oraz Plugin SDK SSRF                                      |
| `/codeql-security-high/mcp-process-tool-boundary` | Serwery MCP, helpery wykonywania procesów, dostarczanie wychodzące oraz bramki wykonywania narzędzi agentów                        |
| `/codeql-security-high/plugin-trust-boundary`     | Powierzchnie zaufania instalacji Plugin, loadera, manifestu, registry, instalacji package-manager, ładowania źródeł oraz kontraktu pakietu Plugin SDK |

### Shardy bezpieczeństwa specyficzne dla platform

- `CodeQL Android Critical Security` — zaplanowany shard bezpieczeństwa Androida. Buduje aplikację Android ręcznie dla CodeQL na najmniejszym runnerze Blacksmith Linux akceptowanym przez workflow sanity. Przesyła pod `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — tygodniowy/ręczny shard bezpieczeństwa macOS. Buduje aplikację macOS ręcznie dla CodeQL na Blacksmith macOS, odfiltrowuje wyniki buildów zależności z przesyłanego SARIF i przesyła pod `/codeql-critical-security/macos`. Utrzymywany poza codziennymi domyślnymi ustawieniami, ponieważ build macOS dominuje czas wykonania nawet gdy jest czysty.

### Kategorie Critical Quality

`CodeQL Critical Quality` to odpowiadający shard niezwiązany z bezpieczeństwem. Uruchamia tylko zapytania jakości JavaScript/TypeScript o ważności błędu i niezwiązane z bezpieczeństwem, na wąskich powierzchniach o wysokiej wartości, na mniejszym runnerze Blacksmith Linux. Jego ochrona pull requestów jest celowo mniejsza niż profil zaplanowany: PR-y, które nie są szkicami, uruchamiają tylko odpowiadające shardy `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` oraz `plugin-sdk-reply-runtime` dla zmian w kodzie wykonywania poleceń/modeli/narzędzi agentów i dispatchu odpowiedzi, schematu config/migracji/IO, auth/sekretów/sandboxu/bezpieczeństwa, runtime rdzenia kanału i dołączonego pluginu kanału, protokołu/metod serwera gateway, runtime pamięci/spoiwa SDK, MCP/procesu/dostarczania wychodzącego, runtime providerów/katalogu modeli, diagnostyki sesji/kolejek dostarczania, loadera pluginów, Plugin SDK/kontraktu pakietu albo runtime odpowiedzi Plugin SDK. Zmiany konfiguracji CodeQL i workflow jakości uruchamiają wszystkie dwanaście shardów jakości PR.

Ręczne dispatch przyjmuje:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Wąskie profile są punktami zaczepienia do nauki/iteracji przy uruchamianiu jednego shardu jakości w izolacji.

| Kategoria                                               | Powierzchnia                                                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kod granicy bezpieczeństwa auth, sekretów, sandboxu, cron oraz gateway                                                                                              |
| `/codeql-critical-quality/config-boundary`              | Schemat config, migracja, normalizacja oraz kontrakty IO                                                                                                            |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schematy protokołu Gateway oraz kontrakty metod serwera                                                                                                             |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrakty implementacji kanałów rdzenia i dołączonych pluginów kanałów                                                                                              |
| `/codeql-critical-quality/agent-runtime-boundary`       | Wykonywanie poleceń, dispatch modeli/providerów, dispatch i kolejki auto-reply oraz kontrakty runtime płaszczyzny sterowania ACP                                   |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serwery MCP i mosty narzędzi, helpery nadzoru procesów oraz kontrakty dostarczania wychodzącego                                                                    |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, fasady runtime pamięci, aliasy memory Plugin SDK, spoiwo aktywacji runtime pamięci oraz polecenia memory doctor                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Wnętrza kolejki odpowiedzi, kolejki dostarczania sesji, helpery wiązania/dostarczania sesji wychodzących, powierzchnie zdarzeń diagnostycznych/pakietów logów oraz kontrakty session doctor CLI |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch odpowiedzi przychodzących Plugin SDK, helpery payload/chunking/runtime odpowiedzi, opcje odpowiedzi kanału, kolejki dostarczania oraz helpery wiązania sesji/wątków |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizacja katalogu modeli, auth i discovery providerów, rejestracja runtime providerów, domyślne ustawienia/katalogi providerów oraz rejestry web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, lokalna trwałość, przepływy sterowania gateway oraz kontrakty runtime płaszczyzny sterowania zadaniami                                       |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrakty runtime podstawowego web fetch/search, media IO, rozumienia mediów, generowania obrazów oraz generowania mediów                                          |
| `/codeql-critical-quality/plugin-boundary`              | Kontrakty loadera, registry, powierzchni publicznej oraz punktów wejścia Plugin SDK                                                                                 |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Opublikowane źródła Plugin SDK po stronie pakietu oraz helpery kontraktu pakietu pluginu                                                                            |

Jakość pozostaje oddzielona od bezpieczeństwa, aby ustalenia jakościowe można było planować, mierzyć, wyłączać lub rozszerzać bez zaciemniania sygnału bezpieczeństwa. Rozszerzenia CodeQL dla Swift, Python i dołączonych pluginów należy dodać z powrotem jako scoped lub sharded follow-up work dopiero po tym, jak wąskie profile będą miały stabilny runtime i sygnał.

## Workflow utrzymaniowe

### Docs Agent

Workflow `Docs Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex służąca do utrzymywania istniejącej dokumentacji w zgodzie z niedawno wprowadzonymi zmianami. Nie ma czystego harmonogramu: pomyślne uruchomienie CI po pushu niebota na `main` może ją wyzwolić, a ręczne dispatch może uruchomić ją bezpośrednio. Wywołania workflow-run są pomijane, gdy `main` poszedł dalej albo gdy w ostatniej godzinie utworzono inne niepominięte uruchomienie Docs Agent. Gdy działa, przegląda zakres commitów od poprzedniego niepominiętego źródłowego SHA Docs Agent do bieżącego `main`, więc jedno godzinne uruchomienie może objąć wszystkie zmiany na main nagromadzone od ostatniego przebiegu dokumentacji.

### Test Performance Agent

Workflow `Test Performance Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex dla wolnych testów. Nie ma czystego harmonogramu: pomyślne uruchomienie CI po pushu niebota na `main` może ją wyzwolić, ale pomija się ją, jeśli inne wywołanie workflow-run już uruchomiło się lub działa tego dnia UTC. Ręczne dispatch omija tę dzienną bramkę aktywności. Ścieżka buduje pogrupowany raport wydajności Vitest dla pełnego zestawu, pozwala Codex wprowadzać tylko małe poprawki wydajności testów zachowujące pokrycie zamiast szerokich refaktoryzacji, następnie ponownie uruchamia raport pełnego zestawu i odrzuca zmiany, które zmniejszają bazową liczbę przechodzących testów. Jeśli baseline ma failing tests, Codex może naprawić tylko oczywiste awarie, a raport pełnego zestawu po agencie musi przejść, zanim cokolwiek zostanie zacommitowane. Gdy `main` przesunie się przed wejściem pushu bota, ścieżka wykonuje rebase zwalidowanego patcha, ponownie uruchamia `pnpm check:changed` i ponawia push; konfliktujące przestarzałe patche są pomijane. Używa GitHub-hosted Ubuntu, aby akcja Codex mogła zachować tę samą postawę bezpieczeństwa drop-sudo co docs agent.

### Zduplikowane PR-y po scaleniu

Workflow `Duplicate PRs After Merge` to ręczny workflow maintainerów do sprzątania duplikatów po landowaniu. Domyślnie działa jako dry-run i zamyka tylko jawnie wymienione PR-y, gdy `apply=true`. Przed mutowaniem GitHub weryfikuje, że landed PR został scalony oraz że każdy duplikat ma albo wspólne referencjonowane issue, albo nakładające się zmienione hunki.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokalne bramki check i routing zmian

Lokalna logika changed-lane znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka check jest bardziej rygorystyczna wobec granic architektury niż szeroki zakres platformy CI:

- zmiany produkcyjne rdzenia uruchamiają typecheck core prod i core test oraz core lint/guards;
- zmiany wyłącznie testowe rdzenia uruchamiają tylko typecheck core test oraz core lint;
- zmiany produkcyjne rozszerzeń uruchamiają typecheck extension prod i extension test oraz extension lint;
- zmiany wyłącznie testowe rozszerzeń uruchamiają typecheck extension test oraz extension lint;
- zmiany publicznego Plugin SDK lub plugin-contract rozszerzają się do typecheck rozszerzeń, ponieważ rozszerzenia zależą od tych kontraktów rdzenia (przeglądy rozszerzeń Vitest pozostają jawną pracą testową);
- bump'y wersji dotyczące wyłącznie metadanych release uruchamiają ukierunkowane kontrole wersji/config/root-dependency;
- nieznane zmiany root/config fail safe do wszystkich ścieżek check.

Lokalny routing changed-test znajduje się w `scripts/test-projects.test-support.mjs` i jest celowo tańszy niż `check:changed`: bezpośrednie edycje testów uruchamiają same siebie, edycje źródeł preferują jawne mapowania, następnie testy sąsiednie i zależne z grafu importów. Współdzielona konfiguracja dostarczania group-room jest jednym z jawnych mapowań: zmiany w konfiguracji widocznej odpowiedzi grupy, trybie dostarczania odpowiedzi źródłowej albo prompt systemowym message-tool przechodzą przez testy odpowiedzi rdzenia oraz regresje dostarczania Discord i Slack, aby wspólna zmiana domyślna zawiodła przed pierwszym pushem PR. Używaj `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy zmiana jest na tyle szeroka dla harnessu, że tani zestaw mapowany nie jest wiarygodnym proxy.

## Walidacja Testbox

Uruchamiaj Testbox z katalogu głównego repozytorium i preferuj świeżo przygotowaną instancję do szerokiej weryfikacji. Zanim poświęcisz wolną bramkę na instancję, która została ponownie użyta, wygasła albo właśnie zgłosiła nieoczekiwanie dużą synchronizację, najpierw uruchom `pnpm testbox:sanity` wewnątrz tej instancji.

Kontrola sanity kończy się szybko niepowodzeniem, gdy wymagane pliki główne, takie jak `pnpm-lock.yaml`, zniknęły albo gdy `git status --short` pokazuje co najmniej 200 śledzonych usunięć. Zwykle oznacza to, że stan zdalnej synchronizacji nie jest wiarygodną kopią PR; zatrzymaj tę instancję i przygotuj świeżą zamiast debugować błąd testu produktu. W przypadku celowych PR z dużą liczbą usunięć ustaw `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` dla tego uruchomienia sanity.

`pnpm testbox:run` kończy także lokalne wywołanie Blacksmith CLI, które pozostaje w fazie synchronizacji przez ponad pięć minut bez danych wyjściowych po synchronizacji. Ustaw `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, aby wyłączyć tę ochronę, albo użyj większej wartości w milisekundach dla nietypowo dużych lokalnych różnic.

Crabbox to należący do repozytorium wrapper zdalnej instancji do dowodów maintainerskich na Linux. Używaj go, gdy sprawdzenie jest zbyt szerokie dla lokalnej pętli edycji, gdy znaczenie ma zgodność z CI albo gdy dowód wymaga sekretów, Docker, ścieżek pakietów, instancji wielokrotnego użytku lub zdalnych logów. Normalny backend OpenClaw to `blacksmith-testbox`; własna pojemność AWS/Hetzner jest rozwiązaniem awaryjnym na przerwy w działaniu Blacksmith, problemy z limitami albo jawne testowanie własnej pojemności.

Przed pierwszym uruchomieniem sprawdź wrapper z katalogu głównego repozytorium:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repozytorium odrzuca przestarzały plik binarny Crabbox, który nie ogłasza `blacksmith-testbox`. Przekaż dostawcę jawnie, mimo że `.crabbox.yaml` ma domyślne ustawienia własnej chmury.

Bramka zmian:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
```

Ukierunkowane ponowne uruchomienie testu:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test <path-or-filter>"
```

Pełny zestaw:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

Przeczytaj końcowe podsumowanie JSON. Przydatne pola to `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` i `totalMs`. Jednorazowe uruchomienia Crabbox wspierane przez Blacksmith powinny automatycznie zatrzymać Testbox; jeśli uruchomienie zostanie przerwane albo czyszczenie jest niejasne, sprawdź aktywne instancje i zatrzymaj tylko te, które utworzyłeś:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Używaj ponownego użycia tylko wtedy, gdy celowo potrzebujesz wielu poleceń na tej samej nawodnionej instancji:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Jeśli uszkodzoną warstwą jest Crabbox, ale sam Blacksmith działa, użyj bezpośrednio Blacksmith jako wąskiego rozwiązania awaryjnego:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Eskaluj do własnej pojemności Crabbox tylko wtedy, gdy Blacksmith nie działa, jest ograniczony limitem, brakuje mu potrzebnego środowiska albo własna pojemność jest wyraźnym celem:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` definiuje domyślne ustawienia dostawcy, synchronizacji i nawadniania GitHub Actions dla ścieżek własnej chmury. Wyklucza lokalny `.git`, aby nawodniony checkout Actions zachował własne zdalne metadane Git zamiast synchronizować lokalne zdalne repozytoria i magazyny obiektów maintainera, oraz wyklucza lokalne artefakty runtime/build, których nigdy nie należy przenosić. `.github/workflows/crabbox-hydrate.yml` definiuje checkout, konfigurację Node/pnpm, pobranie `origin/main` oraz przekazanie niesekretnego środowiska dla poleceń własnej chmury `crabbox run --id <cbx_id>`.

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Kanały deweloperskie](/pl/install/development-channels)
