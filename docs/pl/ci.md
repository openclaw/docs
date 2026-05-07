---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI zostało lub nie zostało uruchomione
    - Debugujesz niepowodzące się sprawdzenie GitHub Actions
    - Koordynujesz uruchomienie lub ponowne uruchomienie walidacji wydania
    - Zmieniasz wysyłanie ClawSweeper lub przekazywanie aktywności GitHub
summary: Graf zadań CI, bramki zakresu, parasole wydań i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-05-07T01:51:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 284b83d7baf451a3e6bb557832f53513d7191f0b6d7c34fc4f7483a0851676cd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI uruchamia się przy każdym pushu do `main` i każdym pull requeście. Zadanie `preflight` klasyfikuje diff i wyłącza kosztowne ścieżki, gdy zmieniły się tylko niepowiązane obszary. Ręczne uruchomienia `workflow_dispatch` celowo omijają inteligentne zawężanie zakresu i rozwijają pełny graf dla kandydatów do wydania oraz szerokiej walidacji. Ścieżki Androida pozostają opcjonalne przez `include_android`. Pokrycie pluginów wyłącznie dla wydania znajduje się w osobnym workflow [`Plugin Prerelease`](#plugin-prerelease) i uruchamia się tylko z [`Full Release Validation`](#full-release-validation) albo przez jawne ręczne wywołanie.

## Przegląd potoku

| Zadanie                          | Cel                                                                                                       | Kiedy się uruchamia                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Wykrywa zmiany tylko w dokumentacji, zmienione zakresy, zmienione rozszerzenia i buduje manifest CI       | Zawsze przy pushach i PR-ach niebędących draftami |
| `security-scm-fast`              | Wykrywanie kluczy prywatnych i audyt workflow przez `zizmor`                                              | Zawsze przy pushach i PR-ach niebędących draftami |
| `security-dependency-audit`      | Audyt produkcyjnego lockfile bez zależności względem advisory npm                                         | Zawsze przy pushach i PR-ach niebędących draftami |
| `security-fast`                  | Wymagany agregat dla szybkich zadań bezpieczeństwa                                                        | Zawsze przy pushach i PR-ach niebędących draftami |
| `check-dependencies`             | Produkcyjny przebieg Knip tylko dla zależności oraz strażnik allowlisty nieużywanych plików               | Zmiany istotne dla Node            |
| `build-artifacts`                | Buduje `dist/`, Control UI, kontrole zbudowanych artefaktów i artefakty wielokrotnego użytku dla zadań podrzędnych | Zmiany istotne dla Node            |
| `checks-fast-core`               | Szybkie linuksowe ścieżki poprawności, takie jak kontrole bundled/plugin-contract/protocol                | Zmiany istotne dla Node            |
| `checks-fast-contracts-channels` | Shardowane kontrole kontraktów kanałów ze stabilnym zagregowanym wynikiem kontroli                        | Zmiany istotne dla Node            |
| `checks-node-core-test`          | Shardy testów core Node, z wyłączeniem ścieżek kanałów, bundled, kontraktów i rozszerzeń                  | Zmiany istotne dla Node            |
| `check`                          | Shardowany odpowiednik głównej lokalnej bramki: typy produkcyjne, lint, strażniki, typy testów i ścisły smoke | Zmiany istotne dla Node            |
| `check-additional`               | Architektura, shardowany drift granic/promptów, strażniki rozszerzeń, granica pakietu i gateway watch     | Zmiany istotne dla Node            |
| `build-smoke`                    | Testy smoke zbudowanego CLI i smoke pamięci startowej                                                     | Zmiany istotne dla Node            |
| `checks`                         | Weryfikator testów kanałów zbudowanych artefaktów                                                         | Zmiany istotne dla Node            |
| `checks-node-compat-node22`      | Ścieżka budowania i smoke zgodności z Node 22                                                             | Ręczne wywołanie CI dla wydań      |
| `check-docs`                     | Formatowanie dokumentacji, lint i kontrole uszkodzonych linków                                           | Zmieniono dokumentację             |
| `skills-python`                  | Ruff + pytest dla Skills opartych na Pythonie                                                             | Zmiany istotne dla Skills w Pythonie |
| `checks-windows`                 | Testy procesów/ścieżek specyficzne dla Windows oraz współdzielone regresje specyfikatorów importu runtime | Zmiany istotne dla Windows         |
| `macos-node`                     | Ścieżka testów TypeScript na macOS używająca współdzielonych zbudowanych artefaktów                       | Zmiany istotne dla macOS           |
| `macos-swift`                    | Swift lint, build i testy dla aplikacji macOS                                                             | Zmiany istotne dla macOS           |
| `android`                        | Testy jednostkowe Androida dla obu wariantów oraz jedna kompilacja debug APK                              | Zmiany istotne dla Androida        |
| `test-performance-agent`         | Codzienna optymalizacja wolnych testów przez Codex po zaufanej aktywności                                 | Sukces głównego CI lub ręczne wywołanie |
| `openclaw-performance`           | Codzienne/na żądanie raporty wydajności runtime Kova ze ścieżkami mock-provider, deep-profile i GPT 5.4 live | Harmonogram i ręczne wywołanie     |

## Kolejność fail-fast

1. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie osobne zadania.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` szybko kończą się niepowodzeniem bez czekania na cięższe zadania artefaktów i macierzy platform.
3. `build-artifacts` nakłada się z szybkimi ścieżkami Linuksa, aby konsumenci podrzędni mogli wystartować od razu, gdy współdzielony build jest gotowy.
4. Cięższe ścieżki platform i runtime rozwijają się później: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowszy push trafi do tego samego PR-a lub referencji `main`. Traktuj to jako szum CI, chyba że najnowsze uruchomienie dla tej samej referencji również kończy się niepowodzeniem. Zagregowane kontrole shardów używają `!cancelled() && always()`, więc nadal raportują normalne awarie shardów, ale nie ustawiają się w kolejce po tym, jak cały workflow został już zastąpiony. Automatyczny klucz współbieżności CI jest wersjonowany (`CI-v7-*`), aby zombie po stronie GitHuba w starej grupie kolejki nie mogło bezterminowo blokować nowszych uruchomień main. Ręczne uruchomienia pełnego zestawu używają `CI-manual-v1-*` i nie anulują trwających uruchomień.

Zadanie `ci-timings-summary` przesyła kompaktowy artefakt `ci-timings-summary` dla każdego uruchomienia CI niebędącego draftem. Rejestruje czas ścienny, czas w kolejce, najwolniejsze zadania i zadania zakończone niepowodzeniem dla bieżącego uruchomienia, więc kontrole kondycji CI nie muszą wielokrotnie skrobać pełnego payloadu Actions.

## Zakres i trasowanie

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest pokryta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`. Ręczne wywołanie pomija wykrywanie changed-scope i sprawia, że manifest preflight zachowuje się tak, jakby zmienił się każdy obszar objęty zakresem.

- **Edycje workflow CI** walidują graf CI Node oraz lint workflow, ale same z siebie nie wymuszają natywnych buildów Windows, Androida ani macOS; te ścieżki platform pozostają ograniczone do zmian w źródłach platformowych.
- **Edycje wyłącznie trasowania CI, wybrane tanie edycje fixture’ów core-test oraz wąskie edycje helperów/test-routing kontraktów pluginów** używają szybkiej ścieżki manifestu tylko dla Node: `preflight`, bezpieczeństwo i jedno zadanie `checks-fast-core`. Ta ścieżka pomija artefakty buildu, zgodność z Node 22, kontrakty kanałów, pełne shardy core, shardy bundled-plugin i dodatkowe macierze strażników, gdy zmiana ogranicza się do powierzchni trasowania lub helperów, które szybkie zadanie ćwiczy bezpośrednio.
- **Kontrole Windows Node** są ograniczone do specyficznych dla Windows wrapperów procesów/ścieżek, helperów runnerów npm/pnpm/UI, konfiguracji menedżera pakietów oraz powierzchni workflow CI, które wykonują tę ścieżkę; niepowiązane zmiany źródeł, pluginów, install-smoke i samych testów pozostają na linuksowych ścieżkach Node.

Najwolniejsze rodziny testów Node są podzielone lub zrównoważone tak, aby każde zadanie pozostawało małe bez nadmiernego rezerwowania runnerów: kontrakty kanałów działają jako trzy ważone shardy, szybkie/wspierające ścieżki jednostkowe core działają osobno, infrastruktura runtime core jest podzielona między shardy state, process/config, cron i shared, auto-reply działa jako zrównoważeni workerzy (z poddrzewem reply podzielonym na shardy agent-runner, dispatch oraz commands/state-routing), a konfiguracje agentic gateway/server są podzielone między ścieżki chat/auth/model/http-plugin/runtime/startup zamiast czekać na zbudowane artefakty. Szerokie testy przeglądarkowe, QA, mediów i różne testy pluginów używają swoich dedykowanych konfiguracji Vitest zamiast wspólnego catch-all dla pluginów. Shardy include-pattern zapisują wpisy czasowe z użyciem nazwy sharda CI, więc `.artifacts/vitest-shard-timings.json` może odróżnić całą konfigurację od filtrowanego sharda. `check-additional` trzyma razem pracę compile/canary granicy pakietu i oddziela architekturę topologii runtime od pokrycia gateway watch; lista strażników granic jest rozłożona na cztery shardy macierzy, z których każdy uruchamia wybrane niezależne strażniki równolegle i wypisuje czasy poszczególnych kontroli. Kosztowna kontrola driftu snapshotu promptu szczęśliwej ścieżki Codex uruchamia się tylko dla ręcznego CI i dla zmian wpływających na prompty, więc normalne niepowiązane zmiany Node nie czekają za zimnym generowaniem snapshotów promptów, a drift promptu nadal jest przypięty do PR-a, który go spowodował; ta sama flaga pomija generowanie Vitest snapshotów promptów wewnątrz sharda support-boundary core dla zbudowanych artefaktów. Gateway watch, testy kanałów i shard support-boundary core działają równolegle wewnątrz `build-artifacts` po tym, jak `dist/` i `dist-runtime/` są już zbudowane.

Android CI uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a następnie buduje Play debug APK. Wariant third-party nie ma osobnego zestawu źródeł ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje wariant z flagami BuildConfig SMS/call-log, jednocześnie unikając duplikatu zadania pakowania debug APK przy każdym pushu istotnym dla Androida.

Shard `check-dependencies` uruchamia `pnpm deadcode:dependencies` (produkcyjny przebieg Knip tylko dla zależności przypięty do najnowszej wersji Knip, z wyłączonym minimalnym wiekiem wydania pnpm dla instalacji `dlx`) oraz `pnpm deadcode:unused-files`, który porównuje produkcyjne ustalenia Knip dotyczące nieużywanych plików z `scripts/deadcode-unused-files.allowlist.mjs`. Strażnik nieużywanych plików kończy się niepowodzeniem, gdy PR dodaje nowy nieprzejrzany nieużywany plik albo zostawia przestarzały wpis allowlisty, zachowując jednocześnie celowe powierzchnie dynamicznych pluginów, generowane, build, live-test i mostków pakietów, których Knip nie może rozwiązać statycznie.

## Przekazywanie aktywności ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` to most po stronie celu z aktywności repozytorium OpenClaw do ClawSweeper. Nie checkoutuje ani nie wykonuje niezaufanego kodu pull requestu. Workflow tworzy token GitHub App z `CLAWSWEEPER_APP_PRIVATE_KEY`, a następnie wysyła zwarte payloady `repository_dispatch` do `openclaw/clawsweeper`.

Workflow ma cztery ścieżki:

- `clawsweeper_item` dla dokładnych próśb o przegląd issue i pull requestów;
- `clawsweeper_comment` dla jawnych poleceń ClawSweeper w komentarzach issue;
- `clawsweeper_commit_review` dla próśb o przegląd na poziomie commita przy pushach do `main`;
- `github_activity` dla ogólnej aktywności GitHuba, którą agent ClawSweeper może sprawdzić.

Ścieżka `github_activity` przekazuje tylko znormalizowane metadane: typ zdarzenia, akcję, aktora, repozytorium, numer elementu, URL, tytuł, stan oraz krótkie fragmenty komentarzy lub przeglądów, gdy są obecne. Celowo unika przekazywania pełnego body Webhooka. Odbierający workflow w `openclaw/clawsweeper` to `.github/workflows/github-activity.yml`, który publikuje znormalizowane zdarzenie do hooka OpenClaw Gateway dla agenta ClawSweeper.

Ogólna aktywność jest obserwacją, a nie domyślnym dostarczaniem. Agent ClawSweeper otrzymuje cel Discord w swoim prompcie i powinien publikować na `#clawsweeper` tylko wtedy, gdy zdarzenie jest zaskakujące, możliwe do działania, ryzykowne albo użyteczne operacyjnie. Rutynowe otwarcia, edycje, ruch botów, szum zduplikowanych Webhooków i normalny ruch przeglądów powinny skutkować `NO_REPLY`.

Traktuj tytuły, komentarze, treści, teksty recenzji, nazwy gałęzi i komunikaty commitów z GitHuba jako niezaufane dane w całej tej ścieżce. Są one danymi wejściowymi do podsumowania i triage'u, a nie instrukcjami dla workflow ani środowiska uruchomieniowego agenta.

## Ręczne uruchomienia

Ręczne uruchomienia CI wykonują ten sam graf zadań co zwykłe CI, ale wymuszają włączenie każdej ścieżki zakresowej poza Androidem: shardy Linux Node, shardy dołączonych Pluginów, kontrakty kanałów, zgodność z Node 22, `check`, `check-additional`, build smoke, kontrole dokumentacji, Python skills, Windows, macOS oraz Control UI i18n. Samodzielne ręczne uruchomienia CI wykonują tylko Androida z `include_android=true`; pełny parasol wydania włącza Androida przez przekazanie `include_android=true`. Statyczne kontrole prerelease Pluginów, shard `agentic-plugins` używany tylko przy wydaniu, pełny wsadowy sweep rozszerzeń oraz dockerowe ścieżki prerelease Pluginów są wyłączone z CI. Zestaw prerelease Docker uruchamia się tylko wtedy, gdy `Full Release Validation` uruchomi oddzielny workflow `Plugin Prerelease` z włączoną bramką walidacji wydania.

Ręczne przebiegi używają unikalnej grupy współbieżności, aby pełny zestaw dla kandydata do wydania nie został anulowany przez inny push lub przebieg PR na tym samym refie. Opcjonalne wejście `target_ref` pozwala zaufanemu wywołującemu uruchomić ten graf względem gałęzi, tagu lub pełnego SHA commita, używając pliku workflow z wybranego refa uruchomienia.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnery

| Runner                           | Zadania                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, szybkie zadania bezpieczeństwa i agregaty (`security-scm-fast`, `security-dependency-audit`, `security-fast`), szybkie kontrole protokołu/kontraktów/dołączonych komponentów, shardowane kontrole kontraktów kanałów, shardy `check` poza lintem, agregaty `check-additional`, weryfikatory agregatów testów Node, kontrole dokumentacji, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke także używa Ubuntu hostowanego przez GitHub, aby macierz Blacksmith mogła kolejkować się wcześniej |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lżejsze shardy rozszerzeń, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` i `check-test-types`                                                                                                                                                                                                                                                                                                               |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shardy testów Linux Node, shardy testów dołączonych Pluginów, shardy `check-additional`, `android`                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (na tyle wrażliwy na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało); buildy Docker install-smoke (czas kolejki 32 vCPU kosztował więcej, niż oszczędzał)                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` na `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` na `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |

CI w kanonicznym repozytorium utrzymuje Blacksmith jako domyślną ścieżkę runnerów. Podczas `preflight` skrypt `scripts/ci-runner-labels.mjs` sprawdza ostatnie kolejkowane i trwające przebiegi Actions pod kątem kolejkowanych zadań Blacksmith. Jeśli konkretna etykieta Blacksmith ma już zakolejkowane zadania, dalsze zadania, które użyłyby dokładnie tej etykiety, wracają tylko dla tego przebiegu do odpowiadającego runnera hostowanego przez GitHub (`ubuntu-24.04`, `windows-2025` lub `macos-latest`). Inne rozmiary Blacksmith w tej samej rodzinie systemu operacyjnego pozostają na swoich głównych etykietach. Jeśli sonda API zawiedzie, fallback nie jest stosowany.

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

`OpenClaw Performance` to workflow wydajności produktu/środowiska uruchomieniowego. Uruchamia się codziennie na `main` i można go uruchomić ręcznie:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ręczne uruchomienie zwykle mierzy ref workflow. Ustaw `target_ref`, aby zmierzyć tag wydania lub inną gałąź z bieżącą implementacją workflow. Opublikowane ścieżki raportów i wskaźniki najnowszych wyników są kluczowane testowanym refem, a każdy `index.md` zapisuje testowany ref/SHA, ref/SHA workflow, ref Kova, profil, tryb uwierzytelniania ścieżki, model, liczbę powtórzeń i filtry scenariuszy.

Workflow instaluje OCM z przypiętego wydania oraz Kova z `openclaw/Kova` przy przypiętym wejściu `kova_ref`, a następnie uruchamia trzy ścieżki:

- `mock-provider`: scenariusze diagnostyczne Kova wobec lokalnie zbudowanego środowiska uruchomieniowego z deterministycznym fałszywym uwierzytelnianiem zgodnym z OpenAI.
- `mock-deep-profile`: profilowanie CPU/sterty/śledzenia dla hotspotów startu, gatewaya i tury agenta.
- `live-gpt54`: rzeczywista tura agenta OpenAI `openai/gpt-5.4`, pomijana, gdy `OPENAI_API_KEY` jest niedostępny.

Ścieżka mock-provider uruchamia także natywne dla OpenClaw sondy źródłowe po przebiegu Kova: pomiar czasu uruchamiania gatewaya i pamięci w domyślnych przypadkach startu, z hookami oraz z 50 Pluginami; powtarzane pętle powitania mock-OpenAI `channel-chat-baseline`; oraz polecenia startowe CLI wobec uruchomionego gatewaya. Podsumowanie Markdown sond źródłowych znajduje się w `source/index.md` w pakiecie raportu, obok surowego JSON.

Każda ścieżka przesyła artefakty GitHuba. Gdy skonfigurowany jest `CLAWGRIT_REPORTS_TOKEN`, workflow także commituje `report.json`, `report.md`, pakiety, `index.md` i artefakty sond źródłowych do `openclaw/clawgrit-reports` pod `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Bieżący wskaźnik testowanego refa jest zapisywany jako `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Pełna walidacja wydania

`Full Release Validation` to ręczny parasolowy workflow dla „uruchom wszystko przed wydaniem”. Przyjmuje gałąź, tag lub pełny SHA commita, uruchamia ręczny workflow `CI` z tym celem, uruchamia `Plugin Prerelease` dla dowodów właściwych tylko wydaniu dotyczących Pluginów/pakietów/statycznych kontroli/Dockera oraz uruchamia `OpenClaw Release Checks` dla install smoke, package acceptance, międzyplatformowych kontroli pakietów, parytetu QA Lab, Matrixa i ścieżek Telegram. Stabilne/domyślne przebiegi utrzymują wyczerpujące live/E2E oraz pokrycie ścieżki wydania Docker za `run_release_soak=true`; `release_profile=full` wymusza włączenie tego pokrycia soak, aby szeroka walidacja advisory pozostała szeroka. Z `rerun_group=all` i `release_profile=full` uruchamia także `NPM Telegram Beta E2E` wobec artefaktu `release-package-under-test` z kontroli wydania. Po publikacji przekaż `npm_telegram_package_spec`, aby ponownie uruchomić tę samą ścieżkę pakietu Telegram wobec opublikowanego pakietu npm.

Zobacz [Pełna walidacja wydania](/pl/reference/full-release-validation), aby poznać
macierz etapów, dokładne nazwy zadań workflow, różnice między profilami, artefakty oraz
uchwyty do ukierunkowanych ponownych uruchomień.

`OpenClaw Release Publish` to ręczny mutujący workflow wydania. Uruchom go
z `release/YYYY.M.D` lub `main` po utworzeniu tagu wydania i po tym, jak
preflight npm OpenClaw zakończy się powodzeniem. Weryfikuje `pnpm plugins:sync:check`,
uruchamia `Plugin NPM Release` dla wszystkich publikowalnych pakietów Pluginów, uruchamia
`Plugin ClawHub Release` dla tego samego SHA wydania i dopiero wtedy uruchamia
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

Refy uruchamiania workflow GitHub muszą być gałęziami albo tagami, a nie surowymi SHA commitów. Helper wypycha tymczasową gałąź `release-ci/<sha>-...` na docelowym SHA, uruchamia `Full Release Validation` z tego przypiętego refa, weryfikuje, że każdy `headSha` workflow potomnego pasuje do celu, i usuwa tymczasową gałąź po zakończeniu uruchomienia. Weryfikator nadrzędny kończy się też niepowodzeniem, jeśli jakikolwiek workflow potomny działał na innym SHA.

`release_profile` steruje zakresem live/dostawców przekazywanym do kontroli wydania. Ręczne workflow wydania domyślnie używają `stable`; używaj `full` tylko wtedy, gdy celowo chcesz szeroką macierz doradczą dostawców/mediów. `run_release_soak` steruje tym, czy stabilne/domyślne kontrole wydania uruchamiają wyczerpujące testy live/E2E oraz soak ścieżki wydania Docker; `full` wymusza włączenie soak.

- `minimum` zachowuje najszybsze krytyczne ścieżki wydania OpenAI/core.
- `stable` dodaje stabilny zestaw dostawców/backendów.
- `full` uruchamia szeroką macierz doradczą dostawców/mediów.

Workflow nadrzędny zapisuje identyfikatory uruchomionych workflow potomnych, a końcowe zadanie `Verify full validation` ponownie sprawdza bieżące wyniki workflow potomnych i dodaje tabele najwolniejszych zadań dla każdego uruchomienia potomnego. Jeśli workflow potomny zostanie uruchomiony ponownie i przejdzie na zielono, uruchom ponownie tylko nadrzędne zadanie weryfikatora, aby odświeżyć wynik workflow nadrzędnego i podsumowanie czasów.

Do odzyskiwania zarówno `Full Release Validation`, jak i `OpenClaw Release Checks` akceptują `rerun_group`. Użyj `all` dla kandydata do wydania, `ci` tylko dla zwykłego potomka pełnego CI, `plugin-prerelease` tylko dla potomka przedwydania Plugin, `release-checks` dla każdego potomka wydania albo węższej grupy: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` lub `npm-telegram` w workflow nadrzędnym. Dzięki temu ponowne uruchomienie nieudanego środowiska wydania pozostaje ograniczone po ukierunkowanej poprawce. Dla jednej nieudanej ścieżki między systemami operacyjnymi połącz `rerun_group=cross-os` z `cross_os_suite_filter`, na przykład `windows/packaged-upgrade`; długie polecenia między systemami operacyjnymi emitują wiersze Heartbeat, a podsumowania packaged-upgrade zawierają czasy dla poszczególnych faz. Ścieżki kontroli wydania QA są doradcze, więc awarie tylko QA ostrzegają, ale nie blokują weryfikatora kontroli wydania.

`OpenClaw Release Checks` używa zaufanego refa workflow, aby jednorazowo rozwiązać wybrany ref do tarballa `release-package-under-test`, a następnie przekazuje ten artefakt do kontroli między systemami operacyjnymi i Package Acceptance oraz do workflow Docker ścieżki wydania live/E2E, gdy uruchamiane jest pokrycie soak. To utrzymuje spójne bajty pakietu we wszystkich środowiskach wydania i unika ponownego pakowania tego samego kandydata w wielu zadaniach potomnych.

Zduplikowane uruchomienia `Full Release Validation` dla `ref=main` i `rerun_group=all` zastępują starszy workflow nadrzędny. Monitor nadrzędny anuluje każdy workflow potomny, który już uruchomił, gdy rodzic zostanie anulowany, więc nowsza walidacja main nie stoi za przestarzałym dwugodzinnym uruchomieniem kontroli wydania. Walidacja gałęzi/tagów wydania i ukierunkowane grupy ponownego uruchamiania zachowują `cancel-in-progress: false`.

## Fragmenty live i E2E

Potomek wydania live/E2E zachowuje szerokie natywne pokrycie `pnpm test:live`, ale uruchamia je jako nazwane fragmenty przez `scripts/test-live-shard.mjs` zamiast jednego zadania sekwencyjnego:

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
- podzielone fragmenty audio/wideo mediów i fragmenty muzyki filtrowane według dostawcy

To zachowuje takie samo pokrycie plików, a jednocześnie ułatwia ponowne uruchamianie i diagnozowanie wolnych awarii dostawców live. Zbiorcze nazwy fragmentów `native-live-extensions-o-z`, `native-live-extensions-media` i `native-live-extensions-media-music` pozostają prawidłowe dla ręcznych jednorazowych ponownych uruchomień.

Natywne fragmenty live mediów działają w `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, budowanym przez workflow `Live Media Runner Image`. Ten obraz ma wstępnie zainstalowane `ffmpeg` i `ffprobe`; zadania mediów tylko weryfikują binaria przed konfiguracją. Zestawy live oparte na Dockerze trzymaj na zwykłych runnerach Blacksmith — zadania kontenerowe nie są właściwym miejscem do uruchamiania zagnieżdżonych testów Dockera.

Fragmenty live modeli/backendów oparte na Dockerze używają oddzielnego współdzielonego obrazu `ghcr.io/openclaw/openclaw-live-test:<sha>` dla każdego wybranego commita. Workflow wydania live buduje i wypycha ten obraz raz, a następnie fragmenty modelu live Docker, Gateway podzielony według dostawców, backend CLI, wiązanie ACP i harness Codex działają z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Fragmenty Gateway Docker mają jawne limity `timeout` na poziomie skryptu poniżej limitu czasu zadania workflow, aby zablokowany kontener lub ścieżka sprzątania kończyły się szybko niepowodzeniem zamiast zużywać cały budżet kontroli wydania. Jeśli te fragmenty niezależnie przebudowują pełny docelowy obraz Dockera ze źródeł, uruchomienie wydania jest źle skonfigurowane i zmarnuje czas zegarowy na zduplikowane budowanie obrazów.

## Package Acceptance

Użyj `Package Acceptance`, gdy pytanie brzmi: „czy ten instalowalny pakiet OpenClaw działa jako produkt?”. Różni się to od zwykłego CI: zwykłe CI waliduje drzewo źródeł, a package acceptance waliduje pojedynczy tarball przez ten sam harness Docker E2E, którego użytkownicy używają po instalacji lub aktualizacji.

### Zadania

1. `resolve_package` sprawdza `workflow_ref`, rozwiązuje jednego kandydata pakietu, zapisuje `.artifacts/docker-e2e-package/openclaw-current.tgz`, zapisuje `.artifacts/docker-e2e-package/package-candidate.json`, przesyła oba jako artefakt `package-under-test` i wypisuje źródło, ref workflow, ref pakietu, wersję, SHA-256 oraz profil w podsumowaniu kroku GitHub.
2. `docker_acceptance` wywołuje `openclaw-live-and-e2e-checks-reusable.yml` z `ref=workflow_ref` i `package_artifact_name=package-under-test`. Workflow wielokrotnego użytku pobiera ten artefakt, waliduje inwentarz tarballa, przygotowuje obrazy Docker z digestem pakietu, gdy są potrzebne, i uruchamia wybrane ścieżki Docker względem tego pakietu zamiast pakować checkout workflow. Gdy profil wybiera wiele ukierunkowanych `docker_lanes`, workflow wielokrotnego użytku przygotowuje pakiet i współdzielone obrazy raz, a następnie rozdziela te ścieżki jako równoległe ukierunkowane zadania Docker z unikalnymi artefaktami.
3. `package_telegram` opcjonalnie wywołuje `NPM Telegram Beta E2E`. Działa, gdy `telegram_mode` nie jest `none`, i instaluje ten sam artefakt `package-under-test`, gdy Package Acceptance go rozwiązało; samodzielne uruchomienie Telegram nadal może instalować opublikowaną specyfikację npm.
4. `summary` kończy workflow niepowodzeniem, jeśli rozwiązywanie pakietu, akceptacja Docker albo opcjonalna ścieżka Telegram zakończyły się niepowodzeniem.

### Źródła kandydata

- `source=npm` akceptuje tylko `openclaw@beta`, `openclaw@latest` albo dokładną wersję wydania OpenClaw, taką jak `openclaw@2026.4.27-beta.2`. Użyj tego do akceptacji opublikowanych wydań przedpremierowych/stabilnych.
- `source=ref` pakuje zaufaną gałąź `package_ref`, tag albo pełny SHA commita. Resolver pobiera gałęzie/tagi OpenClaw, weryfikuje, że wybrany commit jest osiągalny z historii gałęzi repozytorium albo z taga wydania, instaluje zależności w odłączonym worktree i pakuje go przez `scripts/package-openclaw-for-docker.mjs`.
- `source=url` pobiera HTTPS `.tgz`; `package_sha256` jest wymagane.
- `source=artifact` pobiera jeden `.tgz` z `artifact_run_id` i `artifact_name`; `package_sha256` jest opcjonalne, ale powinno być podane dla artefaktów udostępnianych zewnętrznie.

Trzymaj `workflow_ref` i `package_ref` oddzielnie. `workflow_ref` to zaufany kod workflow/harnessu, który uruchamia test. `package_ref` to commit źródłowy, który jest pakowany, gdy `source=ref`. Dzięki temu bieżący harness testowy może walidować starsze zaufane commity źródłowe bez uruchamiania starej logiki workflow.

### Profile zestawów

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — pełne części ścieżki wydania Docker z OpenWebUI
- `custom` — dokładne `docker_lanes`; wymagane, gdy `suite_profile=custom`

Profil `package` używa pokrycia Plugin offline, aby walidacja opublikowanego pakietu nie była blokowana przez dostępność live ClawHub. Opcjonalna ścieżka Telegram ponownie używa artefaktu `package-under-test` w `NPM Telegram Beta E2E`, a ścieżka opublikowanej specyfikacji npm pozostaje dla samodzielnych uruchomień.

Dedykowaną politykę testowania aktualizacji i Plugin, w tym polecenia lokalne, ścieżki Docker, wejścia Package Acceptance, domyślne wartości wydania i triage awarii, znajdziesz w [Testowanie aktualizacji i Plugin](/pl/help/testing-updates-plugins).

Kontrole wydania wywołują Package Acceptance z `source=artifact`, przygotowanym artefaktem pakietu wydania, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` oraz `telegram_mode=mock-openai`. To utrzymuje migrację pakietu, aktualizację, czyszczenie przestarzałych zależności Plugin, naprawę instalacji skonfigurowanego Plugin, Plugin offline, aktualizację Plugin i dowód Telegram na tym samym rozwiązanym tarballu pakietu. Ustaw `package_acceptance_package_spec` w Full Release Validation albo OpenClaw Release Checks, aby uruchomić tę samą macierz względem wysłanego pakietu npm zamiast artefaktu zbudowanego z SHA. Kontrole wydania między systemami operacyjnymi nadal obejmują onboarding specyficzny dla systemu operacyjnego, instalator i zachowanie platformy; walidacja produktu pakietu/aktualizacji powinna zaczynać się od Package Acceptance. Ścieżka Docker `published-upgrade-survivor` waliduje jedną opublikowaną bazę pakietu na uruchomienie w blokującej ścieżce wydania. W Package Acceptance rozwiązany tarball `package-under-test` jest zawsze kandydatem, a `published_upgrade_survivor_baseline` wybiera zapasową opublikowaną bazę, domyślnie `openclaw@latest`; polecenia ponownego uruchomienia nieudanej ścieżki zachowują tę bazę. Full Release Validation z `run_release_soak=true` albo `release_profile=full` ustawia `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` i `published_upgrade_survivor_scenarios=reported-issues`, aby rozszerzyć zakres na cztery najnowsze stabilne wydania npm oraz przypięte wydania graniczne kompatybilności Plugin i fixture’y w kształcie zgłoszeń dla konfiguracji Feishu, zachowanych plików bootstrap/persona, skonfigurowanych instalacji Plugin OpenClaw, ścieżek logów z tyldą oraz przestarzałych korzeni zależności legacy Plugin. Wybory published-upgrade survivor z wieloma bazami są dzielone według bazy na oddzielne ukierunkowane zadania runnera Docker. Oddzielny workflow `Update Migration` używa ścieżki Docker `update-migration` z `all-since-2026.4.23` i `plugin-deps-cleanup`, gdy pytaniem jest wyczerpujące czyszczenie opublikowanych aktualizacji, a nie zwykły zakres Full Release CI. Lokalne uruchomienia zbiorcze mogą przekazywać dokładne specyfikacje pakietów przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, zachować pojedynczą ścieżkę przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, taką jak `openclaw@2026.4.15`, albo ustawić `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` dla macierzy scenariuszy. Opublikowana ścieżka konfiguruje bazę za pomocą wbudowanej receptury polecenia `openclaw config set`, zapisuje kroki receptury w `summary.json` i bada `/healthz`, `/readyz` oraz status RPC po starcie Gateway. Świeże ścieżki Windows packaged i installer weryfikują też, że zainstalowany pakiet może zaimportować override kontroli przeglądarki z surowej bezwzględnej ścieżki Windows. Smoke OpenAI agent-turn między systemami operacyjnymi domyślnie używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy jest ustawione, w przeciwnym razie `openai/gpt-5.4`, dzięki czemu dowód instalacji i Gateway pozostaje na modelu testowym GPT-5, unikając jednocześnie domyślnych wartości GPT-4.x.

### Okna zgodności legacy

Package Acceptance ma ograniczone okna zgodności wstecznej dla już opublikowanych pakietów. Pakiety do `2026.4.25` włącznie, w tym `2026.4.25-beta.*`, mogą używać ścieżki zgodności:

- znane prywatne wpisy QA w `dist/postinstall-inventory.json` mogą wskazywać na pliki pominięte w tarballu;
- `doctor-switch` może pominąć podprzypadek utrwalania `gateway install --wrapper`, gdy pakiet nie udostępnia tej flagi;
- `update-channel-switch` może usuwać brakujące `pnpm.patchedDependencies` z fałszywego fixture git pochodzącego z tarballa i może logować brak utrwalonego `update.channel`;
- smoke testy pluginów mogą odczytywać starsze lokalizacje rekordów instalacji albo akceptować brak utrwalenia rekordu instalacji z marketplace;
- `plugin-update` może zezwolić na migrację metadanych konfiguracji, nadal wymagając, aby rekord instalacji i zachowanie bez ponownej instalacji pozostały bez zmian.

Opublikowany pakiet `2026.4.26` może również ostrzegać o plikach znaczników metadanych lokalnego buildu, które już zostały wydane. Późniejsze pakiety muszą spełniać nowoczesne kontrakty; te same warunki powodują błąd zamiast ostrzeżenia lub pominięcia.

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

Podczas debugowania nieudanego uruchomienia Package Acceptance zacznij od podsumowania `resolve_package`, aby potwierdzić źródło pakietu, wersję i SHA-256. Następnie sprawdź podrzędne uruchomienie `docker_acceptance` i jego artefakty Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logi lane’ów, czasy faz i polecenia ponownego uruchomienia. Preferuj ponowne uruchomienie nieudanego profilu pakietu albo dokładnych lane’ów Docker zamiast ponownego uruchamiania pełnej walidacji wydania.

## Smoke test instalacji

Oddzielny workflow `Install Smoke` ponownie używa tego samego skryptu zakresu przez własne zadanie `preflight`. Dzieli pokrycie smoke na `run_fast_install_smoke` i `run_full_install_smoke`.

- **Szybka ścieżka** uruchamia się dla pull requestów dotykających powierzchni Docker/pakietów, zmian pakietów/manifestów dołączonych pluginów albo powierzchni głównych pluginów/kanałów/Gateway/Plugin SDK, które wykonują zadania smoke Docker. Zmiany tylko w kodzie źródłowym dołączonych pluginów, edycje wyłącznie testów i edycje wyłącznie dokumentacji nie rezerwują workerów Docker. Szybka ścieżka buduje obraz głównego Dockerfile raz, sprawdza CLI, uruchamia smoke CLI usuwania agentów ze współdzielonej przestrzeni roboczej, uruchamia kontenerowy e2e sieci Gateway, weryfikuje argument buildu dołączonego rozszerzenia i uruchamia ograniczony profil Docker dołączonego pluginu z łącznym limitem czasu polecenia 240 sekund (każde uruchomienie Docker scenariusza jest ograniczone osobno).
- **Pełna ścieżka** zachowuje instalację pakietu QR oraz pokrycie Docker/update instalatora dla nocnych zaplanowanych uruchomień, ręcznych dispatchy, release checków przez workflow-call oraz pull requestów, które rzeczywiście dotykają powierzchni instalatora/pakietów/Docker. W trybie pełnym install-smoke przygotowuje albo ponownie używa jednego obrazu GHCR smoke głównego Dockerfile dla docelowego SHA, a następnie uruchamia instalację pakietu QR, smoke głównego Dockerfile/Gateway, smoke instalatora/update oraz szybkie Docker E2E dołączonego pluginu jako oddzielne zadania, aby prace instalatora nie czekały za smoke testami głównego obrazu.

Pushe na `main` (w tym commity merge) nie wymuszają pełnej ścieżki; gdy logika zakresu zmian żądałaby pełnego pokrycia przy pushu, workflow zachowuje szybki smoke Docker i pozostawia pełny smoke instalacji na nocną lub wydaniową walidację.

Wolny smoke dostawcy obrazów dla globalnej instalacji Bun jest osobno bramkowany przez `run_bun_global_install_smoke`. Uruchamia się w nocnym harmonogramie i z workflow release checków, a ręczne dispatche `Install Smoke` mogą go włączyć, ale pull requesty i pushe na `main` tego nie robią. Testy QR i Docker instalatora zachowują własne Dockerfile skupione na instalacji.

## Lokalne Docker E2E

`pnpm test:docker:all` wstępnie buduje jeden współdzielony obraz live-test, pakuje OpenClaw raz jako tarball npm i buduje dwa współdzielone obrazy `scripts/e2e/Dockerfile`:

- podstawowy runner Node/Git dla lane’ów instalatora/update/zależności pluginów;
- obraz funkcjonalny, który instaluje ten sam tarball w `/app` dla zwykłych lane’ów funkcjonalności.

Definicje lane’ów Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`, logika planera w `scripts/lib/docker-e2e-plan.mjs`, a runner wykonuje tylko wybrany plan. Scheduler wybiera obraz dla lane’a za pomocą `OPENCLAW_DOCKER_E2E_BARE_IMAGE` i `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, a następnie uruchamia lane’y z `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametry

| Zmienna                                | Domyślnie | Cel                                                                                           |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Liczba slotów głównej puli dla normalnych lane’ów.                                            |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Liczba slotów puli końcowej wrażliwej na dostawców.                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limit równoległych live lane’ów, aby dostawcy nie throttlowali.                               |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | Limit równoległych lane’ów instalacji npm.                                                     |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limit równoległych lane’ów z wieloma usługami.                                                 |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Odstęp między startami lane’ów, aby uniknąć burz tworzenia w demonie Docker; ustaw `0`, aby wyłączyć odstęp. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Zapasowy limit czasu na lane (120 minut); wybrane live/tail lane’y używają ciaśniejszych limitów. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset     | `1` wypisuje plan schedulera bez uruchamiania lane’ów.                                        |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset     | Lista dokładnych lane’ów rozdzielona przecinkami; pomija smoke czyszczenia, aby agenci mogli odtworzyć jeden nieudany lane. |

Lane cięższy niż jego efektywny limit nadal może wystartować z pustej puli, a potem działa sam, dopóki nie zwolni pojemności. Lokalne preflighty agregatu sprawdzają Docker, usuwają nieaktualne kontenery OpenClaw E2E, emitują status aktywnych lane’ów, utrwalają czasy lane’ów dla kolejności od najdłuższych i domyślnie przestają planować nowe lane’y z puli po pierwszej awarii.

### Wielokrotnego użytku workflow live/E2E

Wielokrotnego użytku workflow live/E2E pyta `scripts/test-docker-all.mjs --plan-json`, jaki pakiet, rodzaj obrazu, obraz live, lane i pokrycie poświadczeń są wymagane. `scripts/docker-e2e.mjs` następnie konwertuje ten plan na wyjścia i podsumowania GitHub. Albo pakuje OpenClaw przez `scripts/package-openclaw-for-docker.mjs`, pobiera artefakt pakietu z bieżącego uruchomienia, albo pobiera artefakt pakietu z `package_artifact_run_id`; waliduje inwentarz tarballa; buduje i wypycha oznaczone digestem pakietu obrazy GHCR Docker E2E typu bare/functional przez cache warstw Docker Blacksmitha, gdy plan potrzebuje lane’ów z zainstalowanym pakietem; oraz ponownie używa podanych wejść `docker_e2e_bare_image`/`docker_e2e_functional_image` albo istniejących obrazów digestu pakietu zamiast przebudowywać. Pobieranie obrazów Docker jest ponawiane z ograniczonym 180-sekundowym limitem czasu na próbę, aby zablokowany strumień registry/cache ponawiał się szybko zamiast zużywać większość krytycznej ścieżki CI.

### Chunks ścieżki wydania

Pokrycie Docker dla wydania uruchamia mniejsze podzielone zadania z `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby każdy chunk pobierał tylko potrzebny rodzaj obrazu i wykonywał wiele lane’ów przez ten sam ważony scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Aktualne chunki Docker wydania to `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` oraz od `plugins-runtime-install-a` do `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` i `plugins-integrations` pozostają agregującymi aliasami plugin/runtime. Alias lane’a `install-e2e` pozostaje agregującym ręcznym aliasem ponownego uruchomienia dla obu lane’ów instalatora dostawcy.

OpenWebUI jest składany do `plugins-runtime-services`, gdy żąda tego pełne pokrycie release-path, i zachowuje samodzielny chunk `openwebui` tylko dla dispatchy dotyczących wyłącznie OpenWebUI. Lane’y aktualizacji dołączonych kanałów ponawiają próbę raz przy przejściowych awariach sieci npm.

Każdy chunk przesyła `.artifacts/docker-tests/` z logami lane’ów, czasami, `summary.json`, `failures.json`, czasami faz, JSON planu schedulera, tabelami wolnych lane’ów oraz poleceniami ponownego uruchomienia per lane. Wejście workflow `docker_lanes` uruchamia wybrane lane’y na przygotowanych obrazach zamiast zadań chunków, co ogranicza debugowanie nieudanego lane’a do jednego ukierunkowanego zadania Docker oraz przygotowuje, pobiera albo ponownie używa artefaktu pakietu dla tego uruchomienia; jeśli wybrany lane jest live lane’em Docker, ukierunkowane zadanie buduje lokalnie obraz live-test dla tego ponownego uruchomienia. Wygenerowane polecenia ponownego uruchomienia GitHub per lane zawierają `package_artifact_run_id`, `package_artifact_name` i wejścia przygotowanych obrazów, gdy te wartości istnieją, aby nieudany lane mógł ponownie użyć dokładnego pakietu i obrazów z nieudanego uruchomienia.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zaplanowany workflow live/E2E uruchamia pełny zestaw Docker release-path codziennie.

## Wydanie przedpremierowe pluginów

`Plugin Prerelease` to droższe pokrycie produktu/pakietu, więc jest osobnym workflow uruchamianym przez `Full Release Validation` albo przez jawnego operatora. Zwykłe pull requesty, pushe na `main` i samodzielne ręczne dispatche CI utrzymują ten zestaw wyłączony. Równoważy testy dołączonych pluginów na ośmiu workerach rozszerzeń; te zadania shardów rozszerzeń uruchamiają jednocześnie do dwóch grup konfiguracji pluginów z jednym workerem Vitest na grupę i większym heapem Node, aby ciężkie importami partie pluginów nie tworzyły dodatkowych zadań CI. Ścieżka przedpremierowa Docker tylko dla wydań grupuje ukierunkowane lane’y Docker w małe grupy, aby nie rezerwować dziesiątek runnerów dla zadań trwających od jednej do trzech minut.

## QA Lab

QA Lab ma dedykowane lane’y CI poza głównym smart-scoped workflow. Parity agentowe jest zagnieżdżone pod szerokimi harnessami QA i wydań, a nie jako samodzielny workflow PR. Użyj `Full Release Validation` z `rerun_group=qa-parity`, gdy parity powinno iść razem z szerokim uruchomieniem walidacji.

- Workflow `QA-Lab - All Lanes` uruchamia się nocą na `main` i przy ręcznym dispatchu; rozdziela lane mock parity, live lane Matrix oraz live lane’y Telegram i Discord jako równoległe zadania. Zadania live używają środowiska `qa-live-shared`, a Telegram/Discord używają dzierżaw Convex.

Kontrole wydania uruchamiają ścieżki Matrix i Telegram dla transportu live z deterministycznym dostawcą mock i modelami kwalifikowanymi jako mock (`mock-openai/gpt-5.5` i `mock-openai/gpt-5.5-alt`), dzięki czemu kontrakt kanału jest odizolowany od opóźnień modeli live i normalnego uruchamiania Plugin dostawcy. Gateway transportu live wyłącza wyszukiwanie pamięci, ponieważ parytet QA osobno obejmuje zachowanie pamięci; łączność dostawców jest obejmowana przez osobne zestawy testów modelu live, natywnego dostawcy i dostawcy Docker.

Matrix używa `--profile fast` dla zaplanowanych bramek i bramek wydania, dodając `--fail-fast` tylko wtedy, gdy obsługuje to checkoutowany CLI. Domyślna wartość CLI i ręczne wejście workflow pozostają `all`; ręczne wywołanie `matrix_profile=all` zawsze dzieli pełne pokrycie Matrix na zadania `transport`, `media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`.

`OpenClaw Release Checks` uruchamia również krytyczne dla wydania ścieżki QA Lab przed zatwierdzeniem wydania; jego bramka parytetu QA uruchamia pakiety kandydata i bazowe jako równoległe zadania ścieżek, a następnie pobiera oba artefakty do małego zadania raportującego na potrzeby końcowego porównania parytetu.

Dla zwykłych PR-ów kieruj się zakreślonymi dowodami z CI/kontroli zamiast traktować parytet jako wymagany status.

## Kody zakończenia

Workflow `CodeQL` jest celowo wąskim skanerem bezpieczeństwa pierwszego przebiegu, a nie pełnym przeglądem repozytorium. Codzienne, ręczne i ochronne uruchomienia dla pull requestów innych niż szkice skanują kod workflow Actions oraz najbardziej ryzykowne powierzchnie JavaScript/TypeScript za pomocą zapytań bezpieczeństwa o wysokiej pewności, filtrowanych do wysokiej/krytycznej wartości `security-severity`.

Ochrona pull requestu pozostaje lekka: startuje tylko dla zmian w `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` lub `src` i uruchamia tę samą macierz bezpieczeństwa o wysokiej pewności co zaplanowany workflow. Android i macOS CodeQL pozostają poza domyślnymi ustawieniami PR.

### Kategorie bezpieczeństwa

| Kategoria                                         | Powierzchnia                                                                                                                           |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, sekrety, piaskownica, Cron i bazowa warstwa Gateway                                                                               |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrakty implementacji kanałów rdzenia oraz runtime Plugin kanałów, Gateway, Plugin SDK, sekrety i punkty styku audytu                |
| `/codeql-security-high/network-ssrf-boundary`     | Powierzchnie SSRF rdzenia, parsowania IP, ochrony sieci, web-fetch oraz polityki SSRF w Plugin SDK                                     |
| `/codeql-security-high/mcp-process-tool-boundary` | Serwery MCP, pomocniki wykonywania procesów, dostarczanie wychodzące i bramki wykonywania narzędzi agentów                             |
| `/codeql-security-high/plugin-trust-boundary`     | Powierzchnie zaufania instalacji Plugin, loadera, manifestu, rejestru, instalacji menedżera pakietów, ładowania źródeł i kontraktu pakietu Plugin SDK |

### Shardy bezpieczeństwa specyficzne dla platform

- `CodeQL Android Critical Security` — zaplanowany shard bezpieczeństwa Androida. Ręcznie buduje aplikację Android dla CodeQL na najmniejszym runnerze Blacksmith Linux akceptowanym przez sanity workflow. Przesyła pod `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — tygodniowy/ręczny shard bezpieczeństwa macOS. Ręcznie buduje aplikację macOS dla CodeQL na Blacksmith macOS, odfiltrowuje wyniki budowania zależności z przesyłanego SARIF i przesyła pod `/codeql-critical-security/macos`. Utrzymywany poza codziennymi domyślnymi ustawieniami, ponieważ budowa macOS dominuje czas działania nawet przy czystym przebiegu.

### Kategorie jakości krytycznej

`CodeQL Critical Quality` to odpowiadający shard niezwiązany z bezpieczeństwem. Uruchamia tylko zapytania jakości JavaScript/TypeScript o poziomie błędu, niezwiązane z bezpieczeństwem, na wąskich powierzchniach o wysokiej wartości na mniejszym runnerze Blacksmith Linux. Jego ochrona pull requestu jest celowo mniejsza niż profil zaplanowany: PR-y inne niż szkice uruchamiają tylko odpowiadające shardy `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` i `plugin-sdk-reply-runtime` dla zmian w kodzie wykonywania poleceń/modeli/narzędzi agenta i wysyłki odpowiedzi, schematu konfiguracji/migracji/IO, auth/sekretów/piaskownicy/bezpieczeństwa, kanału rdzenia i runtime dołączonego Plugin kanału, protokołu Gateway/metod serwera, kleju runtime pamięci/SDK, MCP/procesu/dostarczania wychodzącego, katalogu runtime/modeli dostawcy, diagnostyki sesji/kolejek dostarczania, loadera Plugin, Plugin SDK/kontraktu pakietu lub runtime odpowiedzi Plugin SDK. Zmiany konfiguracji CodeQL i workflow jakości uruchamiają wszystkie dwanaście shardów jakości PR.

Ręczne wywołanie przyjmuje:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Wąskie profile są hookami dydaktycznymi/iteracyjnymi do uruchamiania jednego shardu jakości w izolacji.

| Kategoria                                               | Powierzchnia                                                                                                                                                                  |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, sekrety, piaskownica, Cron i kod granicy bezpieczeństwa Gateway                                                                                                         |
| `/codeql-critical-quality/config-boundary`              | Schemat konfiguracji, migracja, normalizacja i kontrakty IO                                                                                                                   |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schematy protokołu Gateway i kontrakty metod serwera                                                                                                                          |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrakty implementacji kanału rdzenia i dołączonego Plugin kanału                                                                                                            |
| `/codeql-critical-quality/agent-runtime-boundary`       | Wykonywanie poleceń, wysyłka modeli/dostawców, wysyłka i kolejki automatycznych odpowiedzi oraz kontrakty runtime płaszczyzny sterowania ACP                                  |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serwery MCP i mosty narzędzi, pomocniki nadzoru procesów oraz kontrakty dostarczania wychodzącego                                                                             |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hosta pamięci, fasady runtime pamięci, aliasy pamięci w Plugin SDK, klej aktywacji runtime pamięci i polecenia doctor dla pamięci                                         |
| `/codeql-critical-quality/session-diagnostics-boundary` | Wewnętrzne mechanizmy kolejki odpowiedzi, kolejki dostarczania sesji, pomocniki wiązania/dostarczania sesji wychodzących, powierzchnie zdarzeń diagnostycznych/pakietów logów i kontrakty CLI doctor sesji |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Wysyłka odpowiedzi przychodzących w Plugin SDK, pomocniki payloadów/fragmentacji/runtime odpowiedzi, opcje odpowiedzi kanału, kolejki dostarczania i pomocniki wiązania sesji/wątku |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizacja katalogu modeli, auth i wykrywanie dostawców, rejestracja runtime dostawców, domyślne ustawienia/katalogi dostawców oraz rejestry web/search/fetch/embedding      |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, lokalna trwałość, przepływy sterowania Gateway i kontrakty runtime płaszczyzny sterowania zadaniami                                                    |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrakty runtime dla web fetch/search rdzenia, media IO, rozumienia mediów, generowania obrazów i generowania mediów                                                         |
| `/codeql-critical-quality/plugin-boundary`              | Kontrakty loadera, rejestru, publicznej powierzchni i punktu wejścia Plugin SDK                                                                                                |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Opublikowane źródło Plugin SDK po stronie pakietu i pomocniki kontraktu pakietu Plugin                                                                                         |

Jakość pozostaje oddzielona od bezpieczeństwa, aby ustalenia jakości mogły być planowane, mierzone, wyłączane lub rozszerzane bez zaciemniania sygnału bezpieczeństwa. Rozszerzenia CodeQL dla Swift, Python i dołączonych Plugin powinny zostać dodane z powrotem jako zakreślone lub podzielone na shardy dalsze prace dopiero po ustabilizowaniu czasu działania i sygnału wąskich profili.

## Workflow utrzymaniowe

### Docs Agent

Workflow `Docs Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex służąca do utrzymywania istniejącej dokumentacji w zgodności z niedawno scalonymi zmianami. Nie ma czystego harmonogramu: udane uruchomienie CI po pushu na `main`, niepochodzące od bota, może je wyzwolić, a ręczne wywołanie może uruchomić je bezpośrednio. Wywołania workflow-run są pomijane, gdy `main` poszedł dalej albo gdy w ostatniej godzinie utworzono inne niepominięte uruchomienie Docs Agent. Gdy działa, przegląda zakres commitów od poprzedniego niepominiętego źródłowego SHA Docs Agent do bieżącego `main`, więc jedno godzinne uruchomienie może objąć wszystkie zmiany na main nagromadzone od ostatniego przebiegu dokumentacji.

### Test Performance Agent

Workflow `Test Performance Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex dla wolnych testów. Nie ma czystego harmonogramu: udane uruchomienie CI po pushu na `main`, niepochodzące od bota, może je wyzwolić, ale jest pomijane, jeśli inne wywołanie workflow-run już działało albo działa tego dnia UTC. Ręczne wywołanie omija tę dzienną bramkę aktywności. Ścieżka buduje pogrupowany raport wydajności Vitest dla pełnego zestawu, pozwala Codex wprowadzać tylko małe poprawki wydajności testów zachowujące pokrycie zamiast szerokich refaktoryzacji, następnie ponownie uruchamia raport pełnego zestawu i odrzuca zmiany zmniejszające bazową liczbę przechodzących testów. Jeśli baseline ma nieprzechodzące testy, Codex może naprawić tylko oczywiste awarie, a raport pełnego zestawu po agencie musi przejść, zanim cokolwiek zostanie commitowane. Gdy `main` przejdzie dalej przed pushem bota, ścieżka rebase’uje zwalidowaną łatkę, ponownie uruchamia `pnpm check:changed` i ponawia push; konfliktujące nieaktualne łatki są pomijane. Używa Ubuntu hostowanego przez GitHub, aby akcja Codex mogła zachować tę samą postawę bezpieczeństwa drop-sudo co agent dokumentacji.

### Zduplikowane PR-y po scaleniu

Workflow `Duplicate PRs After Merge` to ręczny workflow maintenera do czyszczenia duplikatów po lądowaniu. Domyślnie działa jako dry-run i zamyka tylko jawnie wymienione PR-y, gdy `apply=true`. Przed modyfikowaniem GitHuba weryfikuje, że wylądowany PR jest scalony oraz że każdy duplikat ma albo wspólne przywołane issue, albo nakładające się zmienione hunki.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokalne bramki kontroli i routing zmian

Lokalna logika changed-lane znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka kontroli jest bardziej rygorystyczna względem granic architektury niż szeroki zakres platformy CI:

- zmiany produkcyjne w rdzeniu uruchamiają sprawdzanie typów dla produkcji rdzenia i testów rdzenia oraz lint/guards rdzenia;
- zmiany dotyczące wyłącznie testów rdzenia uruchamiają tylko sprawdzanie typów testów rdzenia oraz lint rdzenia;
- zmiany produkcyjne w rozszerzeniach uruchamiają sprawdzanie typów produkcji rozszerzeń i testów rozszerzeń oraz lint rozszerzeń;
- zmiany dotyczące wyłącznie testów rozszerzeń uruchamiają sprawdzanie typów testów rozszerzeń oraz lint rozszerzeń;
- zmiany w publicznym Plugin SDK lub kontrakcie Plugin rozszerzają zakres na sprawdzanie typów rozszerzeń, ponieważ rozszerzenia zależą od tych kontraktów rdzenia (przeglądy rozszerzeń Vitest pozostają jawną pracą testową);
- podbicia wersji dotyczące wyłącznie metadanych wydania uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności głównych;
- nieznane zmiany w katalogu głównym/konfiguracji bezpiecznie przechodzą awaryjnie na wszystkie ścieżki kontroli.

Lokalne kierowanie zmienionych testów znajduje się w `scripts/test-projects.test-support.mjs` i jest celowo tańsze niż `check:changed`: bezpośrednie edycje testów uruchamiają same siebie, edycje źródeł preferują jawne mapowania, a potem testy sąsiednie i zależne z grafu importów. Konfiguracja dostarczania współdzielonego pokoju grupowego jest jednym z jawnych mapowań: zmiany w konfiguracji widocznych odpowiedzi grupowych, trybie dostarczania odpowiedzi źródłowej lub prompcie systemowym narzędzia wiadomości przechodzą przez testy odpowiedzi rdzenia oraz regresje dostarczania Discord i Slack, aby zmiana współdzielonej wartości domyślnej zakończyła się błędem przed pierwszym wypchnięciem PR. Używaj `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy zmiana jest na tyle szeroka dla całego harnessa, że tani zmapowany zestaw nie jest wiarygodnym przybliżeniem.

## Walidacja Testbox

Uruchamiaj Testbox z katalogu głównego repozytorium i preferuj świeżo rozgrzane pudełko dla szerokiego potwierdzenia. Przed wydaniem czasu na wolną bramkę na pudełku, które było ponownie użyte, wygasło albo właśnie zgłosiło nieoczekiwanie dużą synchronizację, najpierw uruchom `pnpm testbox:sanity` wewnątrz pudełka.

Kontrola poprawności szybko kończy się błędem, gdy wymagane pliki główne, takie jak `pnpm-lock.yaml`, zniknęły albo gdy `git status --short` pokazuje co najmniej 200 śledzonych usunięć. Zwykle oznacza to, że zdalny stan synchronizacji nie jest wiarygodną kopią PR; zatrzymaj to pudełko i rozgrzej świeże zamiast debugować błąd testu produktu. Dla celowych PR z dużą liczbą usunięć ustaw `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` dla tego uruchomienia kontroli poprawności.

`pnpm testbox:run` kończy także lokalne wywołanie Blacksmith CLI, które pozostaje w fazie synchronizacji przez ponad pięć minut bez wyjścia po synchronizacji. Ustaw `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, aby wyłączyć tę osłonę, albo użyj większej wartości w milisekundach dla nietypowo dużych lokalnych różnic.

Crabbox to należący do repo wrapper zdalnego pudełka do potwierdzeń Linuksa dla maintainerów. Używaj go, gdy kontrola jest zbyt szeroka dla lokalnej pętli edycji, gdy ważna jest zgodność z CI albo gdy potwierdzenie wymaga sekretów, Docker, ścieżek pakietów, pudełek wielokrotnego użytku lub zdalnych logów. Normalny backend OpenClaw to `blacksmith-testbox`; należąca do nas pojemność AWS/Hetzner jest ścieżką awaryjną dla awarii Blacksmith, problemów z limitem albo jawnego testowania należącej do nas pojemności.

Przed pierwszym uruchomieniem sprawdź wrapper z katalogu głównego repozytorium:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repozytorium odrzuca nieaktualny plik binarny Crabbox, który nie reklamuje `blacksmith-testbox`. Przekaż dostawcę jawnie, mimo że `.crabbox.yaml` ma wartości domyślne chmury własnej.

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

Odczytaj końcowe podsumowanie JSON. Przydatne pola to `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` i `totalMs`. Jednorazowe uruchomienia Crabbox oparte na Blacksmith powinny automatycznie zatrzymać Testbox; jeśli uruchomienie zostanie przerwane albo czyszczenie jest niejasne, sprawdź aktywne pudełka i zatrzymaj tylko te, które utworzyłeś:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Używaj ponownego użycia tylko wtedy, gdy celowo potrzebujesz wielu poleceń na tym samym nawodnionym pudełku:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Jeśli Crabbox jest uszkodzoną warstwą, ale sam Blacksmith działa, użyj bezpośredniego Blacksmith jako wąskiej ścieżki awaryjnej:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Jeśli `blacksmith testbox list --all` i `blacksmith testbox status` działają, ale nowe rozgrzewki pozostają w stanie `queued` bez adresu IP albo adresu URL uruchomienia Actions po kilku minutach, traktuj to jako presję dostawcy Blacksmith, kolejki, rozliczeń albo limitu organizacji. Zatrzymaj utworzone przez siebie identyfikatory w kolejce, unikaj uruchamiania kolejnych Testboxów i przenieś potwierdzenie na ścieżkę należącej do nas pojemności Crabbox poniżej, gdy ktoś sprawdzi pulpit Blacksmith, rozliczenia i limity organizacji.

Eskaluje do należącej do nas pojemności Crabbox tylko wtedy, gdy Blacksmith jest niedostępny, ograniczony limitem, nie ma potrzebnego środowiska albo należąca do nas pojemność jest jawnym celem:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Przy presji AWS unikaj `class=beast`, chyba że zadanie naprawdę potrzebuje CPU klasy 48xlarge. Żądanie `beast` zaczyna się od 192 vCPU i jest najłatwiejszym sposobem na trafienie w regionalny limit EC2 Spot albo On-Demand Standard. Należący do repo `.crabbox.yaml` domyślnie używa `standard`, wielu regionów pojemności i `capacity.hints: true`, więc pośredniczone dzierżawy AWS wypisują wybrany region/rynek, presję limitów, awarię na Spot oraz ostrzeżenia o klasach pod wysoką presją. Używaj `fast` dla cięższych szerokich kontroli, `large` dopiero po tym, gdy standard/fast nie wystarczą, a `beast` tylko dla wyjątkowych ścieżek ograniczonych CPU, takich jak pełny zestaw albo macierze Docker wszystkich Pluginów, jawna walidacja wydania/blokera albo profilowanie wydajności przy dużej liczbie rdzeni. Nie używaj `beast` dla `pnpm check:changed`, ukierunkowanych testów, pracy wyłącznie nad dokumentacją, zwykłego lintu/sprawdzania typów, małych reprodukcji E2E ani triage awarii Blacksmith. Używaj `--market on-demand` do diagnostyki pojemności, aby zmienność rynku Spot nie mieszała się z sygnałem.

`.crabbox.yaml` jest właścicielem wartości domyślnych dostawcy, synchronizacji i nawodnienia GitHub Actions dla ścieżek chmury własnej. Wyklucza lokalne `.git`, aby nawodniony checkout Actions zachował własne zdalne metadane Git zamiast synchronizować lokalne zdalne repozytoria i magazyny obiektów maintainera, oraz wyklucza lokalne artefakty czasu działania/budowania, które nigdy nie powinny być przesyłane. `.github/workflows/crabbox-hydrate.yml` jest właścicielem checkoutu, konfiguracji Node/pnpm, pobrania `origin/main` i przekazania niesekretnego środowiska dla poleceń chmury własnej `crabbox run --id <cbx_id>`.

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Kanały deweloperskie](/pl/install/development-channels)
