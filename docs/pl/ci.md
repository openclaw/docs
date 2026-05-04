---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI zostało albo nie zostało uruchomione
    - Debugujesz kończące się niepowodzeniem sprawdzenie GitHub Actions
    - Koordynujesz uruchomienie lub ponowne uruchomienie walidacji wydania
    - Zmieniasz wysyłanie ClawSweeper lub przekazywanie aktywności GitHub
summary: Graf zadań CI, bramki zakresu, parasole wydań i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-05-04T07:03:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72959d0feaf1339f01c9da263153fd89cc4727da6f928933819931991222714d
    source_path: ci.md
    workflow: 16
---

OpenClaw CI działa przy każdym wypchnięciu do `main` i każdym pull request. Zadanie `preflight` klasyfikuje diff i wyłącza kosztowne ścieżki, gdy zmieniły się tylko niepowiązane obszary. Ręczne uruchomienia `workflow_dispatch` celowo pomijają inteligentne zawężanie zakresu i rozwijają pełny graf dla kandydatów do wydania oraz szerokiej walidacji. Ścieżki Androida pozostają opcjonalne przez `include_android`. Pokrycie Plugin dotyczące tylko wydań znajduje się w osobnym workflow [`Plugin Prerelease`](#plugin-prerelease) i działa tylko z [`Full Release Validation`](#full-release-validation) albo z jawnego ręcznego uruchomienia.

## Przegląd potoku

| Zadanie                          | Cel                                                                                                       | Kiedy działa                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Wykrywa zmiany tylko w dokumentacji, zmienione zakresy, zmienione rozszerzenia i buduje manifest CI       | Zawsze przy niedraftowych wypchnięciach i PR-ach |
| `security-scm-fast`              | Wykrywanie kluczy prywatnych i audyt workflow przez `zizmor`                                              | Zawsze przy niedraftowych wypchnięciach i PR-ach |
| `security-dependency-audit`      | Audyt produkcyjnego lockfile bez instalowania zależności względem zaleceń bezpieczeństwa npm              | Zawsze przy niedraftowych wypchnięciach i PR-ach |
| `security-fast`                  | Wymagana agregacja dla szybkich zadań bezpieczeństwa                                                      | Zawsze przy niedraftowych wypchnięciach i PR-ach |
| `check-dependencies`             | Produkcyjne sprawdzenie Knip tylko dla zależności oraz strażnik listy dozwolonych nieużywanych plików     | Zmiany istotne dla Node             |
| `build-artifacts`                | Buduje `dist/`, Control UI, sprawdzenia zbudowanych artefaktów i artefakty wielokrotnego użytku dla dalszych zadań | Zmiany istotne dla Node             |
| `checks-fast-core`               | Szybkie linuksowe ścieżki poprawności, takie jak sprawdzenia wbudowanych/kontraktów Plugin/protokołu      | Zmiany istotne dla Node             |
| `checks-fast-contracts-channels` | Shardowane sprawdzenia kontraktów kanałów ze stabilnym zagregowanym wynikiem sprawdzenia                  | Zmiany istotne dla Node             |
| `checks-node-core-test`          | Shardy testów rdzenia Node, z wyłączeniem ścieżek kanałów, wbudowanych, kontraktów i rozszerzeń           | Zmiany istotne dla Node             |
| `check`                          | Shardowany odpowiednik głównej lokalnej bramki: typy produkcyjne, lint, strażniki, typy testów i ścisły smoke | Zmiany istotne dla Node             |
| `check-additional`               | Architektura, shardowany drift granic/promptów, strażniki rozszerzeń, granica pakietu i obserwacja Gateway | Zmiany istotne dla Node             |
| `build-smoke`                    | Testy smoke zbudowanego CLI i smoke pamięci startowej                                                     | Zmiany istotne dla Node             |
| `checks`                         | Weryfikator testów kanałów na zbudowanych artefaktach                                                     | Zmiany istotne dla Node             |
| `checks-node-compat-node22`      | Ścieżka kompilacji i smoke zgodności z Node 22                                                            | Ręczne uruchomienie CI dla wydań    |
| `check-docs`                     | Formatowanie dokumentacji, lint i sprawdzenia uszkodzonych linków                                         | Zmieniona dokumentacja              |
| `skills-python`                  | Ruff + pytest dla Skills opartych na Pythonie                                                            | Zmiany istotne dla Skills w Pythonie |
| `checks-windows`                 | Testy procesów/ścieżek specyficzne dla Windows oraz współdzielone regresje specyfikatorów importu runtime | Zmiany istotne dla Windows          |
| `macos-node`                     | Ścieżka testów TypeScript na macOS używająca współdzielonych zbudowanych artefaktów                       | Zmiany istotne dla macOS            |
| `macos-swift`                    | Lint, kompilacja i testy Swift dla aplikacji macOS                                                        | Zmiany istotne dla macOS            |
| `android`                        | Testy jednostkowe Androida dla obu wariantów oraz jedna kompilacja debug APK                              | Zmiany istotne dla Androida         |
| `test-performance-agent`         | Codzienna optymalizacja wolnych testów przez Codex po zaufanej aktywności                                 | Sukces CI na main albo ręczne uruchomienie |
| `openclaw-performance`           | Codzienne/na żądanie raporty wydajności runtime Kova ze ścieżkami mock-provider, deep-profile i live GPT 5.4 | Harmonogram i ręczne uruchomienie   |

## Kolejność szybkiego przerywania

1. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie samodzielne zadania.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` kończą się niepowodzeniem szybko, bez czekania na cięższe zadania macierzy artefaktów i platform.
3. `build-artifacts` nakłada się z szybkimi ścieżkami Linuxa, dzięki czemu dalsi konsumenci mogą wystartować, gdy tylko współdzielona kompilacja będzie gotowa.
4. Cięższe ścieżki platform i runtime rozwijają się później: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowsze wypchnięcie trafi na ten sam PR albo referencję `main`. Traktuj to jako szum CI, chyba że najnowsze uruchomienie dla tej samej referencji również kończy się niepowodzeniem. Zagregowane sprawdzenia shardów używają `!cancelled() && always()`, więc nadal raportują normalne awarie shardów, ale nie ustawiają się w kolejce po tym, jak cały workflow został już zastąpiony. Automatyczny klucz współbieżności CI jest wersjonowany (`CI-v7-*`), więc zombie po stronie GitHub w starej grupie kolejki nie może bez końca blokować nowszych uruchomień main. Ręczne uruchomienia pełnego zestawu używają `CI-manual-v1-*` i nie anulują trwających uruchomień.

## Zakres i trasowanie

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest pokryta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`. Ręczne uruchomienie pomija wykrywanie zmienionego zakresu i sprawia, że manifest preflight zachowuje się tak, jakby każdy obszar zakresu się zmienił.

- **Edycje workflow CI** walidują graf CI Node oraz lint workflow, ale same nie wymuszają natywnych kompilacji Windows, Androida ani macOS; te ścieżki platform pozostają zawężone do zmian w źródłach platform.
- **Edycje dotyczące tylko trasowania CI, wybrane tanie edycje fixture testów rdzenia oraz wąskie edycje pomocników/test-routing kontraktów Plugin** używają szybkiej ścieżki manifestu tylko dla Node: `preflight`, bezpieczeństwo i pojedyncze zadanie `checks-fast-core`. Ta ścieżka pomija artefakty kompilacji, zgodność Node 22, kontrakty kanałów, pełne shardy rdzenia, shardy wbudowanych Plugin oraz dodatkowe macierze strażników, gdy zmiana jest ograniczona do powierzchni trasowania lub pomocników, które szybkie zadanie ćwiczy bezpośrednio.
- **Sprawdzenia Node dla Windows** są zawężone do wrapperów procesów/ścieżek specyficznych dla Windows, pomocników runnerów npm/pnpm/UI, konfiguracji menedżera pakietów oraz powierzchni workflow CI, które wykonują tę ścieżkę; niepowiązane zmiany źródeł, Plugin, install-smoke i tylko testów pozostają na linuksowych ścieżkach Node.

Najwolniejsze rodziny testów Node są dzielone albo równoważone tak, aby każde zadanie pozostało małe bez nadmiernego rezerwowania runnerów: kontrakty kanałów działają jako trzy ważone shardy, szybkie/pomocnicze ścieżki jednostkowe rdzenia działają osobno, infrastruktura runtime rdzenia jest podzielona między shardy stanu i procesu/konfiguracji, auto-reply działa jako zrównoważeni workerzy (z poddrzewem odpowiedzi podzielonym na shardy agent-runner, dispatch i commands/state-routing), a agentowe konfiguracje gateway/server są podzielone między ścieżki chat/auth/model/http-plugin/runtime/startup zamiast czekać na zbudowane artefakty. Szerokie testy przeglądarki, QA, mediów i różne testy Plugin używają swoich dedykowanych konfiguracji Vitest zamiast współdzielonego catch-all dla Plugin. Shardy include-pattern zapisują wpisy czasu z użyciem nazwy sharda CI, więc `.artifacts/vitest-shard-timings.json` może odróżnić całą konfigurację od filtrowanego sharda. `check-additional` trzyma razem prace kompilacji/canary granicy pakietu i oddziela architekturę topologii runtime od pokrycia obserwacji Gateway; lista strażników granicy jest paskowana przez cztery shardy macierzy, z których każdy uruchamia wybrane niezależne strażniki współbieżnie i wypisuje czasy poszczególnych sprawdzeń, w tym `pnpm prompt:snapshots:check`, aby drift promptów szczęśliwej ścieżki runtime Codex był przypięty do PR-a, który go spowodował. Obserwacja Gateway, testy kanałów i shard granicy wsparcia rdzenia działają współbieżnie wewnątrz `build-artifacts` po tym, jak `dist/` i `dist-runtime/` zostały już zbudowane.

CI Androida uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a następnie buduje Play debug APK. Wariant third-party nie ma osobnego zestawu źródeł ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje wariant z flagami BuildConfig SMS/call-log, unikając przy tym duplikowania zadania pakowania debug APK przy każdym wypchnięciu istotnym dla Androida.

Shard `check-dependencies` uruchamia `pnpm deadcode:dependencies` (produkcyjny przebieg Knip tylko dla zależności, przypięty do najnowszej wersji Knip, z wyłączonym minimalnym wiekiem wydania pnpm dla instalacji `dlx`) oraz `pnpm deadcode:unused-files`, który porównuje produkcyjne ustalenia Knip dotyczące nieużywanych plików z `scripts/deadcode-unused-files.allowlist.mjs`. Strażnik nieużywanych plików kończy się niepowodzeniem, gdy PR dodaje nowy nieprzejrzany nieużywany plik albo pozostawia nieaktualny wpis na liście dozwolonych, zachowując jednocześnie celowe dynamiczne powierzchnie Plugin, generowane, build, live-test i mosty pakietów, których Knip nie może rozwiązać statycznie.

## Przekazywanie aktywności ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` jest mostem po stronie celu z aktywności repozytorium OpenClaw do ClawSweeper. Nie pobiera ani nie wykonuje niezaufanego kodu pull request. Workflow tworzy token GitHub App z `CLAWSWEEPER_APP_PRIVATE_KEY`, a następnie wysyła kompaktowe payloady `repository_dispatch` do `openclaw/clawsweeper`.

Workflow ma cztery ścieżki:

- `clawsweeper_item` dla dokładnych żądań przeglądu issue i pull request;
- `clawsweeper_comment` dla jawnych poleceń ClawSweeper w komentarzach issue;
- `clawsweeper_commit_review` dla żądań przeglądu na poziomie commitów przy wypchnięciach do `main`;
- `github_activity` dla ogólnej aktywności GitHub, którą agent ClawSweeper może sprawdzać.

Ścieżka `github_activity` przekazuje tylko znormalizowane metadane: typ zdarzenia, akcję, aktora, repozytorium, numer elementu, URL, tytuł, stan oraz krótkie fragmenty komentarzy lub przeglądów, jeśli występują. Celowo unika przekazywania pełnego ciała Webhook. Odbierający workflow w `openclaw/clawsweeper` to `.github/workflows/github-activity.yml`, który publikuje znormalizowane zdarzenie do hooka OpenClaw Gateway dla agenta ClawSweeper.

Ogólna aktywność jest obserwacją, a nie domyślnym dostarczaniem. Agent ClawSweeper otrzymuje cel Discord w swoim prompcie i powinien publikować do `#clawsweeper` tylko wtedy, gdy zdarzenie jest zaskakujące, wykonalne, ryzykowne lub operacyjnie użyteczne. Rutynowe otwarcia, edycje, ruch botów, szum zduplikowanych Webhook i normalny ruch przeglądów powinny skutkować `NO_REPLY`.

Traktuj tytuły, komentarze, treści, tekst przeglądów, nazwy gałęzi i komunikaty commitów z GitHub jako niezaufane dane w całej tej ścieżce. Są wejściem do podsumowania i triage, a nie instrukcjami dla workflow ani runtime agenta.

## Ręczne uruchomienia

Ręczne uruchomienia CI wykonują ten sam graf zadań co standardowe CI, ale wymuszają włączenie każdego zakresowego toru innego niż Android: shardy Linux Node, shardy bundled-plugin, kontrakty kanałów, zgodność z Node 22, `check`, `check-additional`, smoke test kompilacji, kontrole dokumentacji, Python skills, Windows, macOS oraz Control UI i18n. Samodzielne ręczne uruchomienia CI wykonują tylko Android z `include_android=true`; pełny parasol wydania włącza Android, przekazując `include_android=true`. Statyczne kontrole prerelease Plugin, shard `agentic-plugins` tylko dla wydania, pełny wsadowy sweep rozszerzeń oraz dockerowe tory prerelease Plugin są wykluczone z CI. Zestaw Docker prerelease uruchamia się tylko wtedy, gdy `Full Release Validation` uruchamia osobny workflow `Plugin Prerelease` z włączoną bramką walidacji wydania.

Ręczne uruchomienia używają unikalnej grupy współbieżności, aby pełny zestaw release candidate nie został anulowany przez inne uruchomienie push lub PR na tej samej referencji. Opcjonalne wejście `target_ref` pozwala zaufanemu wywołującemu uruchomić ten graf względem gałęzi, taga lub pełnego SHA commita, używając pliku workflow z wybranej referencji uruchomienia.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnery

| Runner                           | Zadania                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, szybkie zadania bezpieczeństwa i agregaty (`security-scm-fast`, `security-dependency-audit`, `security-fast`), szybkie kontrole protokołu/kontraktu/bundled, shardowane kontrole kontraktów kanałów, shardy `check` poza lintem, shardy i agregaty `check-additional`, weryfikatory agregatów testów Node, kontrole dokumentacji, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke także używa Ubuntu hostowanego przez GitHub, aby macierz Blacksmith mogła wcześniej wejść do kolejki |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lżejsze shardy rozszerzeń, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` oraz `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shardy testów Linux Node, shardy testów bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (na tyle wrażliwe na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało); kompilacje Docker install-smoke (czas kolejki 32 vCPU kosztował więcej, niż oszczędzał)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` na `openclaw/openclaw`; forki przechodzą awaryjnie na `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` na `openclaw/openclaw`; forki przechodzą awaryjnie na `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

Ręczne uruchomienie zwykle benchmarkuje referencję workflow. Ustaw `target_ref`, aby benchmarkować tag wydania lub inną gałąź z bieżącą implementacją workflow. Opublikowane ścieżki raportów i wskaźniki najnowszych wyników są kluczowane według testowanej referencji, a każdy `index.md` zapisuje testowaną referencję/SHA, referencję/SHA workflow, referencję Kova, profil, tryb autoryzacji toru, model, liczbę powtórzeń i filtry scenariuszy.

Workflow instaluje OCM z przypiętego wydania oraz Kova z `openclaw/Kova` na przypiętym wejściu `kova_ref`, a następnie uruchamia trzy tory:

- `mock-provider`: scenariusze diagnostyczne Kova względem runtime z lokalnej kompilacji z deterministycznym fałszywym uwierzytelnianiem zgodnym z OpenAI.
- `mock-deep-profile`: profilowanie CPU/sterty/śladu dla hotspotów startu, Gateway i tury agenta.
- `live-gpt54`: rzeczywista tura agenta OpenAI `openai/gpt-5.4`, pomijana, gdy `OPENAI_API_KEY` jest niedostępny.

Tor mock-provider uruchamia także natywne sondy źródłowe OpenClaw po przebiegu Kova: pomiar czasu rozruchu Gateway i pamięci dla przypadków startu domyślnego, z hookiem i z 50 Plugin; powtarzane pętle hello mock-OpenAI `channel-chat-baseline`; oraz polecenia startowe CLI względem uruchomionego Gateway. Podsumowanie Markdown sondy źródłowej znajduje się w `source/index.md` w pakiecie raportu, z surowym JSON obok.

Każdy tor przesyła artefakty GitHub. Gdy `CLAWGRIT_REPORTS_TOKEN` jest skonfigurowany, workflow dodatkowo commituje `report.json`, `report.md`, pakiety, `index.md` oraz artefakty sond źródłowych do `openclaw/clawgrit-reports` pod `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Bieżący wskaźnik testowanej referencji jest zapisywany jako `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Pełna walidacja wydania

`Full Release Validation` to ręczny parasolowy workflow dla „uruchom wszystko przed wydaniem”. Przyjmuje gałąź, tag lub pełny SHA commita, uruchamia ręczny workflow `CI` z tym celem, uruchamia `Plugin Prerelease` dla dowodu plugin/package/static/Docker tylko dla wydania oraz uruchamia `OpenClaw Release Checks` dla install smoke, package acceptance, zestawów ścieżki wydania Docker, live/E2E, OpenWebUI, parzystości QA Lab, Matrix i torów Telegram. Z `rerun_group=all` i `release_profile=full` uruchamia także `NPM Telegram Beta E2E` względem artefaktu `release-package-under-test` z kontroli wydania. Po opublikowaniu przekaż `npm_telegram_package_spec`, aby ponownie uruchomić ten sam tor pakietu Telegram względem opublikowanego pakietu npm.

Zobacz [Pełna walidacja wydania](/pl/reference/full-release-validation), aby poznać
macierz etapów, dokładne nazwy zadań workflow, różnice profili, artefakty oraz
uchwyty ukierunkowanych ponownych uruchomień.

`OpenClaw Release Publish` to ręczny mutujący workflow wydania. Uruchom go
z `release/YYYY.M.D` lub `main` po tym, jak tag wydania istnieje i po tym, jak
preflight OpenClaw npm zakończył się powodzeniem. Weryfikuje `pnpm plugins:sync:check`,
uruchamia `Plugin NPM Release` dla wszystkich publikowalnych pakietów Plugin,
uruchamia `Plugin ClawHub Release` dla tego samego SHA wydania, a dopiero potem uruchamia
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

Referencje uruchomienia workflow GitHub muszą być gałęziami lub tagami, nie surowymi SHA commitów. Helper wypycha tymczasową gałąź `release-ci/<sha>-...` na docelowym SHA,
uruchamia `Full Release Validation` z tej przypiętej referencji, weryfikuje, że każdy potomny workflow `headSha` odpowiada celowi, i usuwa tymczasową gałąź po zakończeniu
uruchomienia. Weryfikator parasolowy kończy się też niepowodzeniem, jeśli jakikolwiek potomny workflow został uruchomiony na
innym SHA.

`release_profile` kontroluje zakres live/provider przekazywany do sprawdzeń wydania. Ręczne przepływy pracy wydania domyślnie używają `stable`; użyj `full` tylko wtedy, gdy celowo chcesz uruchomić szeroką macierz doradczą provider/media.

- `minimum` zachowuje najszybsze krytyczne dla wydania ścieżki OpenAI/core.
- `stable` dodaje stabilny zestaw provider/backend.
- `full` uruchamia szeroką macierz doradczą provider/media.

Przepływ nadrzędny zapisuje identyfikatory uruchomień wysłanych procesów potomnych, a końcowe zadanie `Verify full validation` ponownie sprawdza bieżące wyniki uruchomień potomnych i dołącza tabele najwolniejszych zadań dla każdego uruchomienia potomnego. Jeśli potomny przepływ pracy zostanie uruchomiony ponownie i zakończy się powodzeniem, uruchom ponownie tylko zadanie weryfikatora nadrzędnego, aby odświeżyć wynik przepływu nadrzędnego i podsumowanie czasu.

Do odzyskiwania zarówno `Full Release Validation`, jak i `OpenClaw Release Checks` akceptują `rerun_group`. Użyj `all` dla kandydata do wydania, `ci` tylko dla zwykłego pełnego potomnego CI, `plugin-prerelease` tylko dla potomnego przedwydania pluginu, `release-checks` dla każdego potomnego procesu wydania albo węższej grupy: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` lub `npm-telegram` w przepływie nadrzędnym. Dzięki temu ponowne uruchomienie nieudanego środowiska wydania pozostaje ograniczone po ukierunkowanej poprawce.

`OpenClaw Release Checks` używa zaufanego odwołania przepływu pracy, aby jednorazowo rozwiązać wybrane odwołanie do archiwum `release-package-under-test`, a następnie przekazuje ten artefakt zarówno do przepływu Docker ścieżki wydania live/E2E, jak i do fragmentu akceptacji pakietu. Dzięki temu bajty pakietu pozostają spójne we wszystkich środowiskach wydania i unika się ponownego pakowania tego samego kandydata w wielu zadaniach potomnych.

Duplikaty uruchomień `Full Release Validation` dla `ref=main` i `rerun_group=all`
zastępują starszy przepływ nadrzędny. Monitor nadrzędny anuluje każdy potomny przepływ pracy, który
już wysłał, gdy proces nadrzędny zostanie anulowany, więc nowsza walidacja gałęzi main
nie czeka za przestarzałym dwugodzinnym uruchomieniem sprawdzeń wydania. Walidacja gałęzi/tagów
wydania oraz ukierunkowane grupy ponownego uruchamiania zachowują `cancel-in-progress: false`.

## Fragmenty live i E2E

Potomny proces live/E2E wydania zachowuje szerokie natywne pokrycie `pnpm test:live`, ale uruchamia je jako nazwane fragmenty przez `scripts/test-live-shard.mjs`, zamiast jako jedno zadanie szeregowe:

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
- podzielone fragmenty audio/wideo mediów oraz fragmenty muzyki filtrowane według providera

Dzięki temu zachowane jest to samo pokrycie plików, a wolne awarie providerów live są łatwiejsze do ponownego uruchomienia i diagnozy. Zbiorcze nazwy fragmentów `native-live-extensions-o-z`, `native-live-extensions-media` i `native-live-extensions-media-music` pozostają prawidłowe dla ręcznych jednorazowych ponownych uruchomień.

Natywne fragmenty mediów live działają w `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, budowanym przez przepływ pracy `Live Media Runner Image`. Ten obraz wstępnie instaluje `ffmpeg` i `ffprobe`; zadania medialne tylko weryfikują binaria przed konfiguracją. Pakiety live oparte na Dockerze pozostaw na zwykłych runnerach Blacksmith — zadania kontenerowe nie są właściwym miejscem do uruchamiania zagnieżdżonych testów Docker.

Fragmenty live model/backend oparte na Dockerze używają osobnego współdzielonego obrazu `ghcr.io/openclaw/openclaw-live-test:<sha>` dla wybranego commita. Przepływ live wydania buduje i wypycha ten obraz raz, a następnie fragmenty modelu live Docker, Gateway podzielone według providerów, backendu CLI, wiązania ACP i harnessu Codex uruchamiają się z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Fragmenty Gateway Docker mają jawne limity `timeout` na poziomie skryptu, niższe od limitu czasu zadania przepływu pracy, aby zablokowany kontener lub ścieżka sprzątania szybko kończyły się niepowodzeniem zamiast zużywać cały budżet sprawdzeń wydania. Jeśli te fragmenty niezależnie przebudowują pełny docelowy obraz Docker ze źródeł, uruchomienie wydania jest błędnie skonfigurowane i zmarnuje czas ścienny na duplikujące się budowy obrazu.

## Akceptacja pakietu

Użyj `Package Acceptance`, gdy pytanie brzmi: „czy ten instalowalny pakiet OpenClaw działa jako produkt?”. Różni się to od zwykłego CI: zwykłe CI waliduje drzewo źródeł, podczas gdy akceptacja pakietu waliduje pojedyncze archiwum przez ten sam harness Docker E2E, z którego użytkownicy korzystają po instalacji lub aktualizacji.

### Zadania

1. `resolve_package` pobiera `workflow_ref`, rozwiązuje jednego kandydata pakietu, zapisuje `.artifacts/docker-e2e-package/openclaw-current.tgz`, zapisuje `.artifacts/docker-e2e-package/package-candidate.json`, przesyła oba jako artefakt `package-under-test` oraz wypisuje źródło, odwołanie przepływu pracy, odwołanie pakietu, wersję, SHA-256 i profil w podsumowaniu kroku GitHub.
2. `docker_acceptance` wywołuje `openclaw-live-and-e2e-checks-reusable.yml` z `ref=workflow_ref` i `package_artifact_name=package-under-test`. Wielokrotnego użytku przepływ pracy pobiera ten artefakt, waliduje inwentarz archiwum, przygotowuje obrazy Docker z digestem pakietu, gdy są potrzebne, i uruchamia wybrane ścieżki Docker względem tego pakietu zamiast pakować checkout przepływu pracy. Gdy profil wybiera wiele ukierunkowanych `docker_lanes`, wielokrotnego użytku przepływ pracy przygotowuje pakiet i współdzielone obrazy raz, a następnie rozsyła te ścieżki jako równoległe ukierunkowane zadania Docker z unikalnymi artefaktami.
3. `package_telegram` opcjonalnie wywołuje `NPM Telegram Beta E2E`. Uruchamia się, gdy `telegram_mode` nie jest `none`, i instaluje ten sam artefakt `package-under-test`, gdy Akceptacja pakietu rozwiązała pakiet; samodzielne wysłanie Telegram nadal może zainstalować opublikowaną specyfikację npm.
4. `summary` kończy przepływ pracy niepowodzeniem, jeśli rozwiązywanie pakietu, akceptacja Docker lub opcjonalna ścieżka Telegram zakończyły się niepowodzeniem.

### Źródła kandydatów

- `source=npm` akceptuje tylko `openclaw@beta`, `openclaw@latest` albo dokładną wersję wydania OpenClaw, taką jak `openclaw@2026.4.27-beta.2`. Użyj tego do akceptacji opublikowanego przedwydania/stabilnego wydania.
- `source=ref` pakuje zaufaną gałąź, tag lub pełny SHA commita `package_ref`. Resolver pobiera gałęzie/tagi OpenClaw, weryfikuje, że wybrany commit jest osiągalny z historii gałęzi repozytorium lub tagu wydania, instaluje zależności w odłączonym worktree i pakuje go za pomocą `scripts/package-openclaw-for-docker.mjs`.
- `source=url` pobiera plik HTTPS `.tgz`; `package_sha256` jest wymagane.
- `source=artifact` pobiera jedno `.tgz` z `artifact_run_id` i `artifact_name`; `package_sha256` jest opcjonalne, ale powinno zostać podane dla artefaktów udostępnianych zewnętrznie.

Trzymaj `workflow_ref` i `package_ref` oddzielnie. `workflow_ref` to zaufany kod przepływu pracy/harnessu, który uruchamia test. `package_ref` to commit źródłowy, który zostaje spakowany, gdy `source=ref`. Dzięki temu bieżący harness testowy może walidować starsze zaufane commity źródłowe bez uruchamiania starej logiki przepływu pracy.

### Profile pakietów testów

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — pełne części Docker ścieżki wydania z OpenWebUI
- `custom` — dokładne `docker_lanes`; wymagane, gdy `suite_profile=custom`

Profil `package` używa offline’owego pokrycia pluginów, aby walidacja opublikowanego pakietu nie zależała od dostępności ClawHub live. Opcjonalna ścieżka Telegram ponownie używa artefaktu `package-under-test` w `NPM Telegram Beta E2E`, zachowując ścieżkę opublikowanej specyfikacji npm dla samodzielnych wysłań.

Dedykowaną politykę testowania aktualizacji i pluginów, w tym polecenia lokalne,
ścieżki Docker, wejścia Akceptacji pakietu, domyślne ustawienia wydania i triage awarii,
zobacz w [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins).

Sprawdzenia wydania wywołują Akceptację pakietu z `source=artifact`, przygotowanym artefaktem pakietu wydania, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` i `telegram_mode=mock-openai`. Dzięki temu dowody migracji pakietu, aktualizacji, sprzątania nieaktualnych zależności pluginów, naprawy instalacji skonfigurowanego pluginu, offline’owego pluginu, aktualizacji pluginu i Telegram pozostają na tym samym rozwiązanym archiwum pakietu. Ustaw `package_acceptance_package_spec` w Full Release Validation lub OpenClaw Release Checks, aby uruchomić tę samą macierz względem wydanego pakietu npm zamiast artefaktu zbudowanego z SHA. Sprawdzenia wydania Cross-OS nadal pokrywają zachowanie specyficzne dla systemu operacyjnego przy wdrażaniu, instalatorze i platformie; walidacja produktu dla pakietu/aktualizacji powinna zaczynać się od Akceptacji pakietu. Ścieżka Docker `published-upgrade-survivor` waliduje jedną opublikowaną bazę pakietu na uruchomienie. W Akceptacji pakietu rozwiązane archiwum `package-under-test` jest zawsze kandydatem, a `published_upgrade_survivor_baseline` wybiera zapasową opublikowaną bazę, domyślnie `openclaw@latest`; polecenia ponownego uruchomienia nieudanej ścieżki zachowują tę bazę. Ustaw `published_upgrade_survivor_baselines=all-since-2026.4.23`, aby rozszerzyć Full Release CI na każde stabilne wydanie npm od `2026.4.23` do `latest`; `release-history` pozostaje dostępne do ręcznego szerszego próbkowania ze starszą kotwicą daty sprzed zakresu. Ustaw `published_upgrade_survivor_scenarios=reported-issues`, aby rozszerzyć te same bazy na fixture’y odpowiadające zgłoszeniom dla konfiguracji Feishu, zachowanych plików bootstrap/persona, instalacji skonfigurowanych pluginów OpenClaw, ścieżek logów z tyldą i nieaktualnych korzeni zależności starszych pluginów. Osobny przepływ pracy `Update Migration` używa ścieżki Docker `update-migration` z `all-since-2026.4.23` i `plugin-deps-cleanup`, gdy pytanie dotyczy wyczerpującego sprzątania opublikowanych aktualizacji, a nie zwykłego zakresu Full Release CI. Lokalne uruchomienia zbiorcze mogą przekazywać dokładne specyfikacje pakietów przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, zachować pojedynczą ścieżkę z `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, taką jak `openclaw@2026.4.15`, albo ustawić `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` dla macierzy scenariuszy. Opublikowana ścieżka konfiguruje bazę za pomocą wbudowanej receptury polecenia `openclaw config set`, zapisuje kroki receptury w `summary.json` i sprawdza `/healthz`, `/readyz` oraz status RPC po uruchomieniu Gateway. Świeże ścieżki pakietu i instalatora Windows weryfikują też, że zainstalowany pakiet może zaimportować nadpisanie browser-control z surowej bezwzględnej ścieżki Windows. Smoke test obrotu agenta OpenAI w Cross-OS domyślnie używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy jest ustawione, w przeciwnym razie `openai/gpt-5.4`, dzięki czemu dowód instalacji i Gateway pozostaje na modelu testowym GPT-5, unikając domyślnych ustawień GPT-4.x.

### Okna zgodności ze starszymi wersjami

Akceptacja pakietu ma ograniczone okna zgodności ze starszymi wersjami dla już opublikowanych pakietów. Pakiety do `2026.4.25` włącznie, w tym `2026.4.25-beta.*`, mogą używać ścieżki zgodności:

- znane prywatne wpisy QA w `dist/postinstall-inventory.json` mogą wskazywać pliki pominięte w archiwum;
- `doctor-switch` może pominąć podprzypadek utrwalania `gateway install --wrapper`, gdy pakiet nie udostępnia tej flagi;
- `update-channel-switch` może przyciąć brakujące `pnpm.patchedDependencies` z fałszywego fixture’a git pochodzącego z archiwum i może logować brakujące utrwalone `update.channel`;
- smoke testy pluginów mogą odczytywać starsze lokalizacje rekordów instalacji lub akceptować brak utrwalenia rekordu instalacji marketplace;
- `plugin-update` może pozwolić na migrację metadanych konfiguracji, nadal wymagając, aby rekord instalacji i zachowanie bez reinstalacji pozostały niezmienione.

Opublikowany pakiet `2026.4.26` może też ostrzegać o lokalnych plikach znaczników metadanych budowy, które zostały już wydane. Późniejsze pakiety muszą spełniać nowoczesne kontrakty; te same warunki powodują niepowodzenie zamiast ostrzeżenia lub pominięcia.

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

Podczas debugowania nieudanego uruchomienia akceptacji pakietu zacznij od podsumowania `resolve_package`, aby potwierdzić źródło pakietu, wersję i SHA-256. Następnie sprawdź uruchomienie podrzędne `docker_acceptance` oraz jego artefakty Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, dzienniki linii, czasy faz i polecenia ponownego uruchomienia. Preferuj ponowne uruchamianie nieudanego profilu pakietu lub dokładnych linii Docker zamiast ponownego uruchamiania pełnej walidacji wydania.

## Test instalacji

Oddzielny przepływ pracy `Install Smoke` ponownie używa tego samego skryptu zakresu przez własne zadanie `preflight`. Dzieli pokrycie testu instalacji na `run_fast_install_smoke` i `run_full_install_smoke`.

- **Szybka ścieżka** uruchamia się dla pull requestów dotykających powierzchni Docker/pakietu, zmian pakietu/manifestu dołączonego pluginu albo powierzchni głównego pluginu/kanału/Gateway/Plugin SDK, które ćwiczą zadania testów Docker. Zmiany tylko w źródłach dołączonych pluginów, edycje wyłącznie testów i edycje wyłącznie dokumentacji nie rezerwują workerów Docker. Szybka ścieżka buduje obraz głównego Dockerfile raz, sprawdza CLI, uruchamia test CLI usuwania agentów we wspólnej przestrzeni roboczej, uruchamia e2e gateway-network kontenera, weryfikuje argument budowania dołączonego rozszerzenia i uruchamia ograniczony profil Docker dołączonych pluginów z łącznym limitem czasu polecenia 240 sekund (każde uruchomienie Docker w scenariuszu jest ograniczone osobno).
- **Pełna ścieżka** zachowuje instalację pakietu QR oraz pokrycie Docker instalatora/aktualizacji dla nocnych uruchomień harmonogramu, ręcznych uruchomień, kontroli wydań przez workflow-call oraz pull requestów, które rzeczywiście dotykają powierzchni instalatora/pakietu/Docker. W trybie pełnym install-smoke przygotowuje lub ponownie używa jednego obrazu GHCR z testem głównego Dockerfile dla docelowego SHA, a następnie uruchamia instalację pakietu QR, testy głównego Dockerfile/Gateway, testy instalatora/aktualizacji oraz szybkie Docker E2E dołączonych pluginów jako osobne zadania, aby prace instalatora nie czekały za testami głównego obrazu.

Wypchnięcia na `main` (w tym commity scalające) nie wymuszają pełnej ścieżki; gdy logika zakresu zmian zażądałaby pełnego pokrycia przy wypchnięciu, przepływ pracy zachowuje szybki test Docker i zostawia pełny test instalacji nocnej walidacji albo walidacji wydania.

Wolny test dostawcy obrazu dla globalnej instalacji Bun jest oddzielnie bramkowany przez `run_bun_global_install_smoke`. Uruchamia się w nocnym harmonogramie i z przepływu kontroli wydania, a ręczne uruchomienia `Install Smoke` mogą go włączyć, ale pull requesty i wypchnięcia na `main` tego nie robią. Testy Docker dla QR i instalatora zachowują własne Dockerfile ukierunkowane na instalację.

## Lokalne Docker E2E

`pnpm test:docker:all` wstępnie buduje jeden współdzielony obraz testów live, pakuje OpenClaw raz jako archiwum tarball npm i buduje dwa współdzielone obrazy `scripts/e2e/Dockerfile`:

- prosty runner Node/Git dla linii instalatora/aktualizacji/zależności pluginów;
- obraz funkcjonalny, który instaluje to samo archiwum tarball w `/app` dla standardowych linii funkcjonalności.

Definicje linii Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`, logika planera w `scripts/lib/docker-e2e-plan.mjs`, a runner wykonuje tylko wybrany plan. Harmonogram wybiera obraz dla każdej linii za pomocą `OPENCLAW_DOCKER_E2E_BARE_IMAGE` i `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, a następnie uruchamia linie z `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametry

| Zmienna                                | Domyślnie | Cel                                                                                           |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Liczba slotów głównej puli dla standardowych linii.                                           |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Liczba slotów końcowej puli wrażliwej na dostawców.                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limit równoczesnych linii live, aby dostawcy nie ograniczali przepustowości.                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | Limit równoczesnych linii instalacji npm.                                                     |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limit równoczesnych linii wielousługowych.                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Odstęp między startami linii, aby uniknąć burz tworzenia w demonie Docker; ustaw `0`, aby go wyłączyć. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Zastępczy limit czasu na linię (120 minut); wybrane linie live/końcowe używają ciaśniejszych limitów. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | nieustawione | `1` wypisuje plan harmonogramu bez uruchamiania linii.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | nieustawione | Lista dokładnych linii rozdzielona przecinkami; pomija test czyszczenia, aby agenci mogli odtworzyć jedną nieudaną linię. |

Linia cięższa niż jej efektywny limit nadal może wystartować z pustej puli, a następnie działa sama, dopóki nie zwolni pojemności. Lokalny agregat wykonuje wstępne kontrole Docker, usuwa przestarzałe kontenery OpenClaw E2E, emituje status aktywnych linii, zapisuje czasy linii do sortowania od najdłuższych i domyślnie przestaje planować nowe linie z puli po pierwszej awarii.

### Wielokrotnego użytku przepływ pracy live/E2E

Wielokrotnego użytku przepływ pracy live/E2E pyta `scripts/test-docker-all.mjs --plan-json`, jaki pakiet, rodzaj obrazu, obraz live, linia i pokrycie poświadczeń są wymagane. `scripts/docker-e2e.mjs` przekształca następnie ten plan w wyjścia i podsumowania GitHub. Albo pakuje OpenClaw przez `scripts/package-openclaw-for-docker.mjs`, pobiera artefakt pakietu z bieżącego uruchomienia, albo pobiera artefakt pakietu z `package_artifact_run_id`; waliduje inwentarz archiwum tarball; buduje i wypycha obrazy GHCR Docker E2E bare/funkcjonalne tagowane skrótem pakietu przez cache warstw Docker Blacksmith, gdy plan wymaga linii z zainstalowanym pakietem; oraz ponownie używa podanych wejść `docker_e2e_bare_image`/`docker_e2e_functional_image` lub istniejących obrazów ze skrótem pakietu zamiast budować ponownie. Pobieranie obrazów Docker jest ponawiane z ograniczonym limitem 180 sekund na próbę, aby zablokowany strumień rejestru/cache szybko ponawiał próbę zamiast zużywać większość ścieżki krytycznej CI.

### Fragmenty ścieżki wydania

Pokrycie Docker dla wydania działa jako mniejsze podzielone zadania z `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby każdy fragment pobierał tylko potrzebny rodzaj obrazu i wykonywał wiele linii przez ten sam ważony harmonogram:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Bieżące fragmenty Docker wydania to `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` oraz od `plugins-runtime-install-a` do `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` i `plugins-integrations` pozostają agregującymi aliasami plugin/runtime. Alias linii `install-e2e` pozostaje agregującym ręcznym aliasem ponownego uruchomienia dla obu linii instalatora dostawcy.

OpenWebUI jest składany do `plugins-runtime-services`, gdy żąda tego pełne pokrycie release-path, i zachowuje samodzielny fragment `openwebui` tylko dla uruchomień dotyczących wyłącznie OpenWebUI. Linie aktualizacji dołączonych kanałów ponawiają raz w przypadku przejściowych awarii sieci npm.

Każdy fragment przesyła `.artifacts/docker-tests/` z dziennikami linii, czasami, `summary.json`, `failures.json`, czasami faz, JSON planu harmonogramu, tabelami wolnych linii i poleceniami ponownego uruchomienia na linię. Wejście przepływu pracy `docker_lanes` uruchamia wybrane linie względem przygotowanych obrazów zamiast zadań fragmentów, co utrzymuje debugowanie nieudanej linii w ramach jednego ukierunkowanego zadania Docker oraz przygotowuje, pobiera albo ponownie używa artefaktu pakietu dla tego uruchomienia; jeśli wybrana linia jest linią Docker live, ukierunkowane zadanie buduje lokalnie obraz testów live dla tego ponownego uruchomienia. Wygenerowane polecenia GitHub ponownego uruchomienia na linię zawierają `package_artifact_run_id`, `package_artifact_name` i wejścia przygotowanych obrazów, gdy te wartości istnieją, dzięki czemu nieudana linia może ponownie użyć dokładnego pakietu i obrazów z nieudanego uruchomienia.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zaplanowany przepływ pracy live/E2E uruchamia codziennie pełny zestaw Docker release-path.

## Wersja przedpremierowa Plugin

`Plugin Prerelease` to droższe pokrycie produktu/pakietu, dlatego jest osobnym przepływem pracy uruchamianym przez `Full Release Validation` albo przez jawnego operatora. Zwykłe pull requesty, wypchnięcia na `main` i samodzielne ręczne uruchomienia CI pozostawiają ten zestaw wyłączony. Równoważy testy dołączonych pluginów na ośmiu workerach rozszerzeń; te zadania shardów rozszerzeń uruchamiają do dwóch grup konfiguracji pluginów naraz, z jednym workerem Vitest na grupę i większą stertą Node, aby ciężkie importami partie pluginów nie tworzyły dodatkowych zadań CI. Ścieżka Docker przedwydaniowa tylko dla wydań grupuje ukierunkowane linie Docker w małe grupy, aby uniknąć rezerwowania dziesiątek runnerów dla zadań trwających od jednej do trzech minut.

## Laboratorium QA

QA Lab ma dedykowane linie CI poza głównym inteligentnie zakresowanym przepływem pracy. Parzystość agentowa jest zagnieżdżona pod szerokimi zestawami QA i wydania, a nie jako samodzielny przepływ pracy PR. Użyj `Full Release Validation` z `rerun_group=qa-parity`, gdy parzystość powinna iść razem z szerokim uruchomieniem walidacji.

- Przepływ pracy `QA-Lab - All Lanes` działa nocą na `main` i przy ręcznym uruchomieniu; rozdziela linię mock parity, linię live Matrix oraz linie live Telegram i Discord jako równoległe zadania. Zadania live używają środowiska `qa-live-shared`, a Telegram/Discord używają dzierżaw Convex.

Kontrole wydania uruchamiają linie transportu live Matrix i Telegram z deterministycznym dostawcą mock i modelami kwalifikowanymi mock (`mock-openai/gpt-5.5` i `mock-openai/gpt-5.5-alt`), aby kontrakt kanału był odizolowany od opóźnień modelu live i standardowego startu pluginu dostawcy. Gateway transportu live wyłącza wyszukiwanie pamięci, ponieważ parzystość QA obejmuje zachowanie pamięci osobno; łączność dostawcy jest pokryta przez osobne zestawy modelu live, natywnego dostawcy i dostawcy Docker.

Matrix używa `--profile fast` dla bramek harmonogramu i wydania, dodając `--fail-fast` tylko wtedy, gdy obsługuje to pobrane CLI. Domyślne CLI i ręczne wejście przepływu pracy pozostają `all`; ręczne uruchomienie `matrix_profile=all` zawsze dzieli pełne pokrycie Matrix na zadania `transport`, `media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`.

`OpenClaw Release Checks` uruchamia również krytyczne dla wydania linie QA Lab przed zatwierdzeniem wydania; jego bramka QA parity uruchamia pakiety kandydujące i bazowe jako równoległe zadania linii, a następnie pobiera oba artefakty do małego zadania raportu na potrzeby końcowego porównania parzystości.

Dla zwykłych PR-ów korzystaj z dowodów zakresowanego CI/kontroli zamiast traktować parzystość jako wymagany status.

## CodeQL

Przepływ pracy `CodeQL` jest celowo wąskim skanerem bezpieczeństwa pierwszego przebiegu, a nie pełnym przeglądem repozytorium. Codzienne, ręczne oraz ochronne uruchomienia dla nie-roboczych pull requestów skanują kod przepływów pracy Actions oraz powierzchnie JavaScript/TypeScript o najwyższym ryzyku, używając zapytań bezpieczeństwa o wysokiej pewności, filtrowanych do wysokiej/krytycznej wartości `security-severity`.

Ochrona pull requestów pozostaje lekka: uruchamia się tylko dla zmian w `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` lub `src` i wykonuje tę samą macierz bezpieczeństwa o wysokiej pewności co zaplanowany przepływ pracy. Android i macOS CodeQL pozostają poza domyślnymi ustawieniami PR.

### Kategorie bezpieczeństwa

| Kategoria                                         | Powierzchnia                                                                                                                        |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, sekrety, piaskownica, Cron i bazowe elementy Gateway                                                                          |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrakty implementacji kanałów rdzenia oraz środowisko uruchomieniowe Plugin kanału, Gateway, Plugin SDK, sekrety, punkty audytu  |
| `/codeql-security-high/network-ssrf-boundary`     | Powierzchnie rdzenia SSRF, parsowania IP, osłony sieciowej, web-fetch oraz polityki SSRF w Plugin SDK                               |
| `/codeql-security-high/mcp-process-tool-boundary` | Serwery MCP, pomocniki wykonywania procesów, dostarczanie wychodzące oraz bramki wykonywania narzędzi agenta                        |
| `/codeql-security-high/plugin-trust-boundary`     | Powierzchnie zaufania instalacji Plugin, loadera, manifestu, rejestru, instalacji menedżera pakietów, ładowania źródeł oraz kontraktu pakietu Plugin SDK |

### Shardy bezpieczeństwa zależne od platformy

- `CodeQL Android Critical Security` — zaplanowany shard bezpieczeństwa Androida. Buduje aplikację Android ręcznie dla CodeQL na najmniejszym runnerze Blacksmith Linux akceptowanym przez sanity przepływu pracy. Przesyła wyniki pod `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — tygodniowy/ręczny shard bezpieczeństwa macOS. Buduje aplikację macOS ręcznie dla CodeQL na Blacksmith macOS, odfiltrowuje wyniki budowania zależności z przesyłanego SARIF i przesyła pod `/codeql-critical-security/macos`. Utrzymywany poza codziennymi domyślnymi ustawieniami, ponieważ budowanie macOS dominuje czas działania nawet wtedy, gdy jest czyste.

### Kategorie krytycznej jakości

`CodeQL Critical Quality` to odpowiadający shard niezwiązany z bezpieczeństwem. Uruchamia wyłącznie zapytania jakości JavaScript/TypeScript o ważności błędu, niezwiązane z bezpieczeństwem, na wąskich powierzchniach o wysokiej wartości, na mniejszym runnerze Blacksmith Linux. Jego ochrona pull requestów jest celowo mniejsza niż zaplanowany profil: nie-robocze PR-y uruchamiają tylko odpowiadające shardy `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` i `plugin-sdk-reply-runtime` dla zmian w kodzie wykonywania poleceń/modeli/narzędzi agenta i wysyłania odpowiedzi, kodzie schematu/migracji/IO konfiguracji, kodzie auth/sekretów/piaskownicy/bezpieczeństwa, rdzeniowym środowisku uruchomieniowym kanału i dołączonego Plugin kanału, protokole Gateway/metodach serwera, środowisku uruchomieniowym pamięci/kleju SDK, MCP/procesie/dostarczaniu wychodzącym, środowisku uruchomieniowym dostawcy/katalogu modeli, diagnostyce sesji/kolejkach dostarczania, loaderze Plugin, Plugin SDK/kontrakcie pakietu lub środowisku uruchomieniowym odpowiedzi Plugin SDK. Zmiany konfiguracji CodeQL i przepływu pracy jakości uruchamiają wszystkie dwanaście shardów jakości PR.

Ręczne uruchomienie przyjmuje:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Wąskie profile są hakami dydaktycznymi/iteracyjnymi do uruchamiania jednego sharda jakości w izolacji.

| Kategoria                                               | Powierzchnia                                                                                                                                                       |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kod granicy bezpieczeństwa Auth, sekretów, piaskownicy, Cron i Gateway                                                                                           |
| `/codeql-critical-quality/config-boundary`              | Kontrakty schematu konfiguracji, migracji, normalizacji i IO                                                                                                      |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schematy protokołu Gateway i kontrakty metod serwera                                                                                                             |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrakty implementacji rdzeniowego kanału i dołączonego Plugin kanału                                                                                            |
| `/codeql-critical-quality/agent-runtime-boundary`       | Kontrakty środowiska uruchomieniowego wykonywania poleceń, wysyłania modeli/dostawców, automatycznego wysyłania odpowiedzi i kolejek oraz płaszczyzny sterowania ACP |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serwery MCP i mosty narzędzi, pomocniki nadzoru procesów oraz kontrakty dostarczania wychodzącego                                                                |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hosta pamięci, fasady środowiska uruchomieniowego pamięci, aliasy pamięci Plugin SDK, klej aktywacji środowiska uruchomieniowego pamięci i polecenia doctor pamięci |
| `/codeql-critical-quality/session-diagnostics-boundary` | Wewnętrzne elementy kolejki odpowiedzi, kolejki dostarczania sesji, pomocniki wiązania/dostarczania sesji wychodzących, powierzchnie zdarzeń diagnostycznych/pakietów logów oraz kontrakty CLI doctor sesji |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Wysyłanie przychodzących odpowiedzi Plugin SDK, pomocniki payloadów/fragmentacji/środowiska uruchomieniowego odpowiedzi, opcje odpowiedzi kanału, kolejki dostarczania oraz pomocniki wiązania sesji/wątków |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizacja katalogu modeli, auth i wykrywanie dostawców, rejestracja środowiska uruchomieniowego dostawcy, domyślne ustawienia/katalogi dostawców oraz rejestry web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, lokalna trwałość, przepływy sterowania Gateway oraz kontrakty środowiska uruchomieniowego płaszczyzny sterowania zadaniami                  |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrakty środowiska uruchomieniowego rdzeniowego web fetch/search, IO mediów, rozumienia mediów, generowania obrazów i generowania mediów                       |
| `/codeql-critical-quality/plugin-boundary`              | Kontrakty loadera, rejestru, powierzchni publicznej i punktów wejścia Plugin SDK                                                                                  |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Opublikowane źródło Plugin SDK po stronie pakietu i pomocniki kontraktu pakietu Plugin                                                                            |

Jakość pozostaje oddzielona od bezpieczeństwa, aby ustalenia jakościowe można było planować, mierzyć, wyłączać lub rozszerzać bez zasłaniania sygnału bezpieczeństwa. Rozszerzenie CodeQL dla Swift, Python i dołączonych Plugin powinno zostać dodane z powrotem jako zakresowana lub shardowana praca następcza dopiero po ustabilizowaniu czasu działania i sygnału wąskich profili.

## Przepływy pracy utrzymania

### Docs Agent

Przepływ pracy `Docs Agent` to sterowana zdarzeniami ścieżka utrzymania Codex do utrzymywania istniejącej dokumentacji w zgodzie z ostatnio wprowadzonymi zmianami. Nie ma czystego harmonogramu: udany przebieg CI dla push na `main` od nie-bota może go wyzwolić, a ręczne uruchomienie może wykonać go bezpośrednio. Wywołania przez workflow-run są pomijane, gdy `main` przesunął się dalej albo gdy w ostatniej godzinie utworzono inny niepominięty przebieg Docs Agent. Gdy działa, przegląda zakres commitów od poprzedniego niepominiętego źródłowego SHA Docs Agent do bieżącego `main`, więc jeden godzinowy przebieg może objąć wszystkie zmiany na main zgromadzone od ostatniego przebiegu dokumentacji.

### Test Performance Agent

Przepływ pracy `Test Performance Agent` to sterowana zdarzeniami ścieżka utrzymania Codex dla wolnych testów. Nie ma czystego harmonogramu: udany przebieg CI dla push na `main` od nie-bota może go wyzwolić, ale jest pomijany, jeśli inne wywołanie workflow-run już działało lub działa tego dnia UTC. Ręczne uruchomienie omija tę dzienną bramkę aktywności. Ścieżka buduje pogrupowany raport wydajności Vitest dla pełnego zestawu, pozwala Codex wprowadzać tylko małe poprawki wydajności testów zachowujące pokrycie zamiast szerokich refaktoryzacji, a następnie ponownie uruchamia raport pełnego zestawu i odrzuca zmiany zmniejszające bazową liczbę przechodzących testów. Jeśli baza ma testy zakończone niepowodzeniem, Codex może naprawić tylko oczywiste niepowodzenia, a raport pełnego zestawu po agencie musi przejść, zanim cokolwiek zostanie zacommitowane. Gdy `main` przesuwa się, zanim push bota trafi do repozytorium, ścieżka rebase'uje zweryfikowaną poprawkę, ponownie uruchamia `pnpm check:changed` i ponawia push; konfliktujące, nieaktualne poprawki są pomijane. Używa hostowanego przez GitHub Ubuntu, aby akcja Codex mogła zachować tę samą postawę bezpieczeństwa drop-sudo co agent dokumentacji.

### Zduplikowane PR-y po scaleniu

Przepływ pracy `Duplicate PRs After Merge` to ręczny przepływ pracy maintainerów do porządkowania duplikatów po wylądowaniu zmian. Domyślnie działa w trybie dry-run i zamyka tylko jawnie wymienione PR-y, gdy `apply=true`. Przed modyfikowaniem GitHub weryfikuje, że wylądowany PR jest scalony oraz że każdy duplikat ma wspólne powiązane issue albo nakładające się zmienione hunki.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokalne bramki sprawdzania i routing zmian

Lokalna logika changed-lane znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka sprawdzająca jest bardziej rygorystyczna wobec granic architektury niż szeroki zakres platformy CI:

- zmiany produkcyjne rdzenia uruchamiają typecheck produkcji rdzenia i testów rdzenia oraz lint/osłony rdzenia;
- zmiany dotyczące wyłącznie testów rdzenia uruchamiają tylko typecheck testów rdzenia oraz lint rdzenia;
- zmiany produkcyjne extension uruchamiają typecheck produkcji extension i testów extension oraz lint extension;
- zmiany dotyczące wyłącznie testów extension uruchamiają typecheck testów extension oraz lint extension;
- zmiany publicznego Plugin SDK lub kontraktu Plugin rozszerzają się do typecheck extension, ponieważ extension zależą od tych kontraktów rdzenia (przeglądy Vitest extension pozostają jawną pracą testową);
- wersje podbijane wyłącznie w metadanych wydania uruchamiają ukierunkowane sprawdzenia wersji/konfiguracji/zależności root;
- nieznane zmiany root/konfiguracji bezpiecznie przechodzą do wszystkich ścieżek sprawdzania.

Lokalny routing changed-test znajduje się w `scripts/test-projects.test-support.mjs` i jest celowo tańszy niż `check:changed`: bezpośrednie edycje testów uruchamiają same siebie, edycje źródeł preferują jawne mapowania, a następnie testy rodzeństwa i zależne elementy z grafu importów. Współdzielona konfiguracja dostarczania group-room jest jednym z jawnych mapowań: zmiany w konfiguracji odpowiedzi widocznej dla grupy, trybie dostarczania odpowiedzi źródłowej lub systemowym promptcie narzędzia wiadomości przechodzą przez testy odpowiedzi rdzenia oraz regresje dostarczania Discord i Slack, aby współdzielona zmiana domyślna zawiodła przed pierwszym pushem PR. Używaj `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy zmiana jest na tyle szeroka dla całego harnessu, że tani zmapowany zestaw nie jest wiarygodnym przybliżeniem.

## Walidacja Testbox

Uruchamiaj Testbox z katalogu głównego repozytorium i przy szerokiej weryfikacji preferuj świeżo przygotowaną instancję. Zanim poświęcisz wolną bramkę na instancję, która została użyta ponownie, wygasła albo właśnie zgłosiła nieoczekiwanie dużą synchronizację, najpierw uruchom w niej `pnpm testbox:sanity`.

Kontrola poprawności kończy się szybko niepowodzeniem, gdy wymagane pliki główne, takie jak `pnpm-lock.yaml`, zniknęły albo gdy `git status --short` pokazuje co najmniej 200 śledzonych usunięć. Zwykle oznacza to, że stan zdalnej synchronizacji nie jest wiarygodną kopią PR-a; zatrzymaj tę instancję i przygotuj świeżą, zamiast debugować błąd testu produktu. W przypadku PR-ów z celowym dużym usunięciem ustaw `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` dla tego uruchomienia kontroli poprawności.

`pnpm testbox:run` kończy też lokalne wywołanie Blacksmith CLI, które pozostaje w fazie synchronizacji przez ponad pięć minut bez danych wyjściowych po synchronizacji. Ustaw `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, aby wyłączyć tę osłonę, albo użyj większej wartości w milisekundach dla nietypowo dużych lokalnych diffów.

Crabbox to należący do repozytorium wrapper zdalnej instancji do maintainerowej weryfikacji na Linuksie. Używaj go, gdy sprawdzenie jest zbyt szerokie dla lokalnej pętli edycji, gdy liczy się zgodność z CI albo gdy weryfikacja wymaga sekretów, Dockera, ścieżek pakietowych, instancji wielokrotnego użytku lub zdalnych logów. Normalnym backendem OpenClaw jest `blacksmith-testbox`; należąca do projektu pojemność AWS/Hetzner jest fallbackiem na awarie Blacksmith, problemy z limitami albo jawne testowanie należącej pojemności.

Przed pierwszym uruchomieniem sprawdź wrapper z katalogu głównego repozytorium:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repozytorium odrzuca przestarzały binarny Crabbox, który nie reklamuje `blacksmith-testbox`. Przekaż providera jawnie, mimo że `.crabbox.yaml` ma domyślne ustawienia chmury należącej do projektu.

Brama zmian:

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

Ukierunkowione ponowne uruchomienie testu:

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

Przeczytaj końcowe podsumowanie JSON. Przydatne pola to `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` i `totalMs`. Jednorazowe uruchomienia Crabbox oparte na Blacksmith powinny automatycznie zatrzymać Testbox; jeśli uruchomienie zostanie przerwane albo czyszczenie jest niejasne, sprawdź aktywne instancje i zatrzymaj tylko te, które zostały przez ciebie utworzone:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Używaj ponownego wykorzystania tylko wtedy, gdy celowo potrzebujesz wielu poleceń na tej samej przygotowanej instancji:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Jeśli Crabbox jest uszkodzoną warstwą, ale sam Blacksmith działa, użyj bezpośredniego Blacksmith jako wąskiego fallbacku:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Eskaluj do należącej pojemności Crabbox tylko wtedy, gdy Blacksmith nie działa, jest ograniczony limitem, nie ma potrzebnego środowiska albo należąca pojemność jest jawnym celem:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` zawiera domyślne ustawienia providera, synchronizacji i hydratacji GitHub Actions dla ścieżek w chmurze należącej do projektu. Wyklucza lokalny `.git`, dzięki czemu przygotowany checkout Actions zachowuje własne zdalne metadane Git zamiast synchronizować lokalne maintainerowe zdalne repozytoria i magazyny obiektów, oraz wyklucza lokalne artefakty uruchomieniowe/budowania, które nigdy nie powinny być przesyłane. `.github/workflows/crabbox-hydrate.yml` odpowiada za checkout, konfigurację Node/pnpm, pobranie `origin/main` oraz przekazanie nieobjętego sekretami środowiska dla poleceń `crabbox run --id <cbx_id>` w chmurze należącej do projektu.

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Kanały deweloperskie](/pl/install/development-channels)
