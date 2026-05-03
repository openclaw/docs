---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI zostało uruchomione albo dlaczego nie zostało uruchomione
    - Debugujesz nieudane sprawdzenie GitHub Actions
    - Koordynujesz uruchomienie lub ponowne uruchomienie walidacji wydania
    - Zmieniasz wywoływanie ClawSweeper lub przekazywanie aktywności GitHub
summary: Graf zadań CI, bramki zakresu, parasole wydań i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-05-03T21:27:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: e07fc44aa844cb66ce529c570cbbbbf502a61bcbcbc3d9488557abb459ef7678
    source_path: ci.md
    workflow: 16
---

OpenClaw CI uruchamia się przy każdym pushu do `main` i przy każdym pull requeście. Zadanie `preflight` klasyfikuje diff i wyłącza kosztowne ścieżki, gdy zmieniły się tylko niepowiązane obszary. Ręczne uruchomienia `workflow_dispatch` celowo omijają inteligentne zawężanie zakresu i rozwijają pełny graf dla kandydatów do wydania oraz szerokiej walidacji. Ścieżki Android pozostają opcjonalne przez `include_android`. Pokrycie Plugin wyłącznie dla wydań znajduje się w osobnym workflow [`Wersja przedpremierowa Plugin`](#plugin-prerelease) i uruchamia się tylko z [`Pełnej walidacji wydania`](#full-release-validation) albo po jawnym ręcznym dispatchu.

## Przegląd potoku

| Zadanie                          | Cel                                                                                                               | Kiedy się uruchamia                         |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `preflight`                      | Wykrywa zmiany wyłącznie w dokumentacji, zmienione zakresy, zmienione rozszerzenia i buduje manifest CI          | Zawsze przy pushach i PR-ach innych niż draft |
| `security-scm-fast`              | Wykrywanie kluczy prywatnych i audyt workflow przez `zizmor`                                                     | Zawsze przy pushach i PR-ach innych niż draft |
| `security-dependency-audit`      | Audyt produkcyjnego lockfile bez zależności względem ostrzeżeń npm                                                | Zawsze przy pushach i PR-ach innych niż draft |
| `security-fast`                  | Wymagany agregat dla szybkich zadań bezpieczeństwa                                                                | Zawsze przy pushach i PR-ach innych niż draft |
| `check-dependencies`             | Produkcyjny przebieg Knip tylko dla zależności oraz strażnik listy dozwolonych nieużywanych plików               | Zmiany istotne dla Node                     |
| `build-artifacts`                | Buduje `dist/`, Control UI, sprawdza zbudowane artefakty i tworzy artefakty wielokrotnego użytku dla kolejnych zadań | Zmiany istotne dla Node                     |
| `checks-fast-core`               | Szybkie linuxowe ścieżki poprawności, takie jak kontrole bundled/plugin-contract/protocol                         | Zmiany istotne dla Node                     |
| `checks-fast-contracts-channels` | Shardowane kontrole kontraktów kanałów ze stabilnym zagregowanym wynikiem sprawdzenia                            | Zmiany istotne dla Node                     |
| `checks-node-core-test`          | Shardy testów Core Node, z wyłączeniem ścieżek kanałów, bundled, kontraktów i rozszerzeń                         | Zmiany istotne dla Node                     |
| `check`                          | Shardowany odpowiednik głównej lokalnej bramki: typy produkcyjne, lint, strażniki, typy testów i rygorystyczny smoke | Zmiany istotne dla Node                     |
| `check-additional`               | Architektura, shardowany dryf granic/promptów, strażniki rozszerzeń, granica pakietu i gateway watch              | Zmiany istotne dla Node                     |
| `build-smoke`                    | Testy smoke zbudowanego CLI i smoke pamięci startowej                                                             | Zmiany istotne dla Node                     |
| `checks`                         | Weryfikator testów kanałów na zbudowanych artefaktach                                                             | Zmiany istotne dla Node                     |
| `checks-node-compat-node22`      | Build zgodności z Node 22 i ścieżka smoke                                                                         | Ręczny dispatch CI dla wydań                |
| `check-docs`                     | Formatowanie dokumentacji, lint i kontrole uszkodzonych linków                                                    | Zmieniona dokumentacja                      |
| `skills-python`                  | Ruff + pytest dla Skills wspieranych przez Python                                                                 | Zmiany istotne dla Skills Python            |
| `checks-windows`                 | Testy procesów/ścieżek specyficzne dla Windows oraz regresje wspólnych specyfikatorów importu runtime             | Zmiany istotne dla Windows                  |
| `macos-node`                     | Ścieżka testów TypeScript na macOS używająca wspólnych zbudowanych artefaktów                                     | Zmiany istotne dla macOS                    |
| `macos-swift`                    | Swift lint, build i testy aplikacji macOS                                                                         | Zmiany istotne dla macOS                    |
| `android`                        | Testy jednostkowe Android dla obu wariantów oraz jeden build APK debug                                           | Zmiany istotne dla Android                  |
| `test-performance-agent`         | Codzienna optymalizacja wolnych testów przez Codex po zaufanej aktywności                                         | Sukces CI na main albo ręczny dispatch      |
| `openclaw-performance`           | Codzienne/na żądanie raporty wydajności runtime Kova ze ścieżkami mock-provider, deep-profile i live GPT 5.4     | Harmonogram i ręczny dispatch               |

## Kolejność fail-fast

1. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie samodzielne zadania.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` szybko kończą się niepowodzeniem bez czekania na cięższe zadania artefaktów i macierzy platform.
3. `build-artifacts` nakłada się z szybkimi ścieżkami Linuksa, aby konsumenci downstream mogli zacząć, gdy tylko wspólny build będzie gotowy.
4. Cięższe ścieżki platform i runtime rozwijają się potem: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowszy push trafi do tego samego PR-a albo refa `main`. Traktuj to jako szum CI, chyba że najnowsze uruchomienie dla tego samego refa również kończy się niepowodzeniem. Zagregowane kontrole shardów używają `!cancelled() && always()`, więc nadal raportują zwykłe awarie shardów, ale nie ustawiają się w kolejce po tym, jak cały workflow został już zastąpiony. Automatyczny klucz współbieżności CI jest wersjonowany (`CI-v7-*`), więc zombie po stronie GitHuba w starej grupie kolejki nie może bezterminowo blokować nowszych uruchomień main. Ręczne uruchomienia pełnego zestawu używają `CI-manual-v1-*` i nie anulują uruchomień w toku.

## Zakres i routing

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest pokryta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`. Ręczny dispatch pomija wykrywanie changed-scope i sprawia, że manifest preflight zachowuje się tak, jakby zmienił się każdy obszar z zakresem.

- **Edycje workflow CI** walidują graf CI Node oraz lint workflow, ale same nie wymuszają natywnych buildów Windows, Android ani macOS; te ścieżki platformowe pozostają ograniczone do zmian źródeł platform.
- **Edycje dotyczące wyłącznie routingu CI, wybrane tanie edycje fixture testów core oraz wąskie edycje pomocników/test-routing kontraktów Plugin** używają szybkiej ścieżki manifestu tylko dla Node: `preflight`, bezpieczeństwo i pojedyncze zadanie `checks-fast-core`. Ta ścieżka pomija artefakty buildu, zgodność Node 22, kontrakty kanałów, pełne shardy core, shardy bundled-plugin i dodatkowe macierze strażników, gdy zmiana ogranicza się do powierzchni routingu lub pomocników bezpośrednio ćwiczonych przez szybkie zadanie.
- **Kontrole Windows Node** są ograniczone do specyficznych dla Windows wrapperów procesów/ścieżek, pomocników runnerów npm/pnpm/UI, konfiguracji menedżera pakietów i powierzchni workflow CI wykonujących tę ścieżkę; niepowiązane zmiany źródeł, Plugin, install-smoke i tylko testowe pozostają na linuxowych ścieżkach Node.

Najwolniejsze rodziny testów Node są dzielone lub równoważone, aby każde zadanie pozostawało małe bez nadmiernego rezerwowania runnerów: kontrakty kanałów działają jako trzy ważone shardy, szybkie/wspierające ścieżki jednostkowe core działają osobno, infrastruktura runtime core jest podzielona między shardy stanu i procesów/konfiguracji, auto-reply działa jako zrównoważeni workerzy (z poddrzewem odpowiedzi podzielonym na shardy agent-runner, dispatch i commands/state-routing), a agentic gateway/server configs są podzielone między ścieżki chat/auth/model/http-plugin/runtime/startup zamiast czekać na zbudowane artefakty. Szerokie testy przeglądarkowe, QA, media i różne testy Plugin używają własnych dedykowanych konfiguracji Vitest zamiast wspólnego catch-all dla Plugin. Shardy include-pattern zapisują wpisy czasów z użyciem nazwy sharda CI, więc `.artifacts/vitest-shard-timings.json` może odróżnić całą konfigurację od filtrowanego sharda. `check-additional` trzyma razem prace kompilacji/canary granicy pakietu i oddziela architekturę topologii runtime od pokrycia gateway watch; lista strażników granic jest rozłożona paskami na cztery shardy macierzy, z których każdy uruchamia wybrane niezależne strażniki współbieżnie i drukuje czasy poszczególnych kontroli, w tym `pnpm prompt:snapshots:check`, aby dryf promptu szczęśliwej ścieżki runtime Codex był przypięty do PR-a, który go spowodował. Gateway watch, testy kanałów i shard granicy wsparcia core działają współbieżnie wewnątrz `build-artifacts` po tym, jak `dist/` i `dist-runtime/` są już zbudowane.

Android CI uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a potem buduje APK debug Play. Wariant third-party nie ma osobnego zestawu źródeł ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje wariant z flagami SMS/call-log BuildConfig, unikając jednocześnie duplikowania zadania pakowania debug APK przy każdym pushu istotnym dla Android.

Shard `check-dependencies` uruchamia `pnpm deadcode:dependencies` (produkcyjny przebieg Knip tylko dla zależności przypięty do najnowszej wersji Knip, z wyłączonym minimalnym wiekiem wydania pnpm dla instalacji `dlx`) oraz `pnpm deadcode:unused-files`, który porównuje produkcyjne ustalenia Knip dotyczące nieużywanych plików z `scripts/deadcode-unused-files.allowlist.mjs`. Strażnik nieużywanych plików kończy się niepowodzeniem, gdy PR dodaje nowy niezweryfikowany nieużywany plik albo zostawia przestarzały wpis allowlisty, zachowując jednocześnie celowe dynamiczne powierzchnie Plugin, wygenerowane, build, live-test i mosty pakietów, których Knip nie może statycznie rozwiązać.

## Przekazywanie aktywności ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` to most po stronie celu z aktywności repozytorium OpenClaw do ClawSweeper. Nie pobiera ani nie wykonuje niezaufanego kodu z pull requestów. Workflow tworzy token GitHub App z `CLAWSWEEPER_APP_PRIVATE_KEY`, a następnie wysyła zwarte payloady `repository_dispatch` do `openclaw/clawsweeper`.

Workflow ma cztery ścieżki:

- `clawsweeper_item` dla dokładnych żądań przeglądu issue i pull requestów;
- `clawsweeper_comment` dla jawnych poleceń ClawSweeper w komentarzach issue;
- `clawsweeper_commit_review` dla żądań przeglądu na poziomie commitów przy pushach do `main`;
- `github_activity` dla ogólnej aktywności GitHub, którą agent ClawSweeper może sprawdzić.

Ścieżka `github_activity` przekazuje wyłącznie znormalizowane metadane: typ zdarzenia, akcję, aktora, repozytorium, numer elementu, URL, tytuł, stan oraz krótkie fragmenty komentarzy lub recenzji, gdy są obecne. Celowo unika przekazywania pełnej treści Webhook. Workflow odbierający w `openclaw/clawsweeper` to `.github/workflows/github-activity.yml`, który publikuje znormalizowane zdarzenie do hooka OpenClaw Gateway dla agenta ClawSweeper.

Ogólna aktywność jest obserwacją, a nie domyślnym dostarczaniem. Agent ClawSweeper otrzymuje cel Discord w swoim prompcie i powinien publikować na `#clawsweeper` tylko wtedy, gdy zdarzenie jest zaskakujące, wykonalne, ryzykowne lub operacyjnie użyteczne. Rutynowe otwarcia, edycje, szum botów, duplikaty szumu Webhook i zwykły ruch recenzji powinny skutkować `NO_REPLY`.

Traktuj tytuły, komentarze, treści, tekst recenzji, nazwy gałęzi i komunikaty commitów GitHub jako niezaufane dane w całej tej ścieżce. Są wejściem do podsumowania i triage, a nie instrukcjami dla workflow ani runtime agenta.

## Ręczne dispatche

Ręczne uruchomienia CI wykonują ten sam graf zadań co zwykłe CI, ale wymuszają włączenie każdej linii zakresowej spoza Androida: shardy Linux Node, shardy dołączonych Plugin, kontrakty kanałów, zgodność z Node 22, `check`, `check-additional`, build smoke, kontrole dokumentacji, Python Skills, Windows, macOS oraz i18n Control UI. Samodzielne ręczne uruchomienia CI wykonują tylko Androida z `include_android=true`; pełna parasolowa walidacja wydania włącza Androida przez przekazanie `include_android=true`. Kontrole statyczne przedwydania Plugin, dostępny tylko dla wydań shard `agentic-plugins`, pełny zbiorczy przegląd rozszerzeń oraz dockerowe linie przedwydania Plugin są wyłączone z CI. Zestaw dockerowy przedwydania działa tylko wtedy, gdy `Full Release Validation` uruchamia osobny workflow `Plugin Prerelease` z włączoną bramką walidacji wydania.

Ręczne przebiegi używają unikalnej grupy współbieżności, więc pełny zestaw dla kandydata do wydania nie zostanie anulowany przez inny przebieg push lub PR na tym samym refie. Opcjonalne wejście `target_ref` pozwala zaufanemu wywołującemu uruchomić ten graf względem gałęzi, taga lub pełnego SHA commita, używając pliku workflow z wybranego refa uruchomienia.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Uruchamiacze

| Uruchamiacz                      | Zadania                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, szybkie zadania bezpieczeństwa i agregaty (`security-scm-fast`, `security-dependency-audit`, `security-fast`), szybkie kontrole protokołu/kontraktów/dołączonych komponentów, shardowane kontrole kontraktów kanałów, shardy `check` z wyjątkiem lintu, shardy i agregaty `check-additional`, weryfikatory agregatów testów Node, kontrole dokumentacji, Python Skills, workflow-sanity, labeler, auto-response; preflight install-smoke również używa Ubuntu hostowanego przez GitHub, aby macierz Blacksmith mogła wcześniej trafić do kolejki |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lżejsze shardy rozszerzeń, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` oraz `check-test-types`                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shardy testów Linux Node, shardy testów dołączonych Plugin, `android`                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (na tyle wrażliwe na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało); buildy Docker install-smoke (czas w kolejce dla 32 vCPU kosztował więcej, niż oszczędzał)                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` w `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                     |
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

`OpenClaw Performance` to workflow wydajności produktu/runtime. Działa codziennie na `main` i można go uruchomić ręcznie:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ręczne uruchomienie zwykle mierzy wydajność refa workflow. Ustaw `target_ref`, aby zmierzyć wydajność taga wydania lub innej gałęzi przy użyciu bieżącej implementacji workflow. Opublikowane ścieżki raportów i najnowsze wskaźniki są kluczowane według testowanego refa, a każdy `index.md` zapisuje testowany ref/SHA, ref/SHA workflow, ref Kova, profil, tryb auth linii, model, liczbę powtórzeń i filtry scenariuszy.

Workflow instaluje OCM z przypiętego wydania oraz Kova z `openclaw/Kova` przy przypiętym wejściu `kova_ref`, a następnie uruchamia trzy linie:

- `mock-provider`: scenariusze diagnostyczne Kova względem runtime zbudowanego lokalnie z deterministycznym fałszywym authem zgodnym z OpenAI.
- `mock-deep-profile`: profilowanie CPU/sterty/trace dla hotspotów uruchamiania, Gateway i tury agenta.
- `live-gpt54`: rzeczywista tura agenta OpenAI `openai/gpt-5.4`, pomijana, gdy `OPENAI_API_KEY` jest niedostępny.

Linia mock-provider uruchamia też natywne sondy źródłowe OpenClaw po przebiegu Kova: pomiar czasu startu Gateway i pamięci w przypadkach uruchamiania domyślnego, z hookami oraz z 50 Plugin; powtarzane pętle hello mock-OpenAI `channel-chat-baseline`; oraz polecenia startowe CLI względem uruchomionego Gateway. Markdownowe podsumowanie sond źródłowych znajduje się w `source/index.md` w pakiecie raportu, z surowym JSON obok.

Każda linia przesyła artefakty GitHub. Gdy skonfigurowano `CLAWGRIT_REPORTS_TOKEN`, workflow zatwierdza również `report.json`, `report.md`, pakiety, `index.md` oraz artefakty sond źródłowych do `openclaw/clawgrit-reports` pod `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Bieżący wskaźnik testowanego refa jest zapisywany jako `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Pełna walidacja wydania

`Full Release Validation` to ręczny parasolowy workflow dla „uruchom wszystko przed wydaniem”. Przyjmuje gałąź, tag lub pełny SHA commita, uruchamia ręczny workflow `CI` z tym celem, uruchamia `Plugin Prerelease` dla dowodów statycznych/Docker oraz dotyczących pakietów i Plugin dostępnych tylko dla wydań, a także uruchamia `OpenClaw Release Checks` dla install smoke, akceptacji pakietu, zestawów ścieżki wydania Docker, live/E2E, OpenWebUI, parytetu QA Lab, Matrix oraz linii Telegram. Z `rerun_group=all` i `release_profile=full` uruchamia też `NPM Telegram Beta E2E` względem artefaktu `release-package-under-test` z kontroli wydania. Po publikacji przekaż `npm_telegram_package_spec`, aby ponownie uruchomić tę samą linię pakietu Telegram względem opublikowanego pakietu npm.

Zobacz [Pełna walidacja wydania](/pl/reference/full-release-validation), aby poznać
macierz etapów, dokładne nazwy zadań workflow, różnice profili, artefakty i
uchwyty ukierunkowanych ponownych uruchomień.

`OpenClaw Release Publish` to ręczny mutujący workflow wydania. Uruchom go
z `release/YYYY.M.D` lub `main` po utworzeniu taga wydania i po powodzeniu
preflight OpenClaw npm. Weryfikuje `pnpm plugins:sync:check`,
uruchamia `Plugin NPM Release` dla wszystkich publikowalnych pakietów Plugin,
uruchamia `Plugin ClawHub Release` dla tego samego SHA wydania, a dopiero potem
uruchamia `OpenClaw NPM Release` z zapisanym `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Dla dowodu przypiętego commita na szybko zmieniającej się gałęzi użyj helpera zamiast
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refy uruchamiania workflow GitHub muszą być gałęziami lub tagami, a nie surowymi SHA commitów. Helper wypycha tymczasową gałąź `release-ci/<sha>-...` na docelowym SHA,
uruchamia `Full Release Validation` z tego przypiętego refa, weryfikuje, że każdy potomny
workflow `headSha` pasuje do celu, i usuwa tymczasową gałąź po zakończeniu
przebiegu. Weryfikator parasolowy również kończy się błędem, jeśli którykolwiek potomny workflow działał na
innym SHA.

`release_profile` kontroluje zakres live/provider przekazywany do kontroli wydania. Ręczne workflow wydania domyślnie używają `stable`; użyj `full` tylko wtedy, gdy celowo chcesz szeroką macierz doradczą provider/media.

- `minimum` zachowuje najszybsze krytyczne dla wydania ścieżki OpenAI/core.
- `stable` dodaje stabilny zestaw provider/backend.
- `full` uruchamia szeroką macierz doradczą provider/media.

Workflow nadrzędny zapisuje identyfikatory uruchomionych workflow podrzędnych, a końcowe zadanie `Verify full validation` ponownie sprawdza bieżące wyniki workflow podrzędnych i dopisuje tabele najwolniejszych zadań dla każdego workflow podrzędnego. Jeśli workflow podrzędny zostanie uruchomiony ponownie i zakończy się powodzeniem, uruchom ponownie tylko zadanie weryfikatora nadrzędnego, aby odświeżyć wynik workflow nadrzędnego i podsumowanie czasów.

Do odzyskiwania zarówno `Full Release Validation`, jak i `OpenClaw Release Checks` akceptują `rerun_group`. Użyj `all` dla kandydata wydania, `ci` tylko dla zwykłego pełnego workflow podrzędnego CI, `plugin-prerelease` tylko dla workflow podrzędnego wersji przedpremierowej pluginu, `release-checks` dla każdego workflow podrzędnego wydania albo węższej grupy: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` lub `npm-telegram` w workflow nadrzędnym. Dzięki temu ponowne uruchomienie nieudanego środowiska wydania pozostaje ograniczone po ukierunkowanej poprawce.

`OpenClaw Release Checks` używa zaufanego odwołania workflow, aby jednorazowo rozwiązać wybrane odwołanie do archiwum tar `release-package-under-test`, a następnie przekazuje ten artefakt zarówno do workflow Docker ścieżki wydania live/E2E, jak i sharda akceptacji pakietu. Dzięki temu bajty pakietu pozostają spójne między środowiskami wydania i unika się ponownego pakowania tego samego kandydata w wielu zadaniach podrzędnych.

Zduplikowane uruchomienia `Full Release Validation` dla `ref=main` i `rerun_group=all`
zastępują starszy workflow nadrzędny. Monitor nadrzędny anuluje każdy workflow podrzędny, który
już uruchomił, gdy workflow nadrzędny zostanie anulowany, więc nowsza walidacja main
nie czeka za przestarzałym dwugodzinnym uruchomieniem release-check. Walidacja gałęzi/tagu
wydania i ukierunkowane grupy ponownych uruchomień zachowują `cancel-in-progress: false`.

## Shardy live i E2E

Workflow podrzędny live/E2E wydania zachowuje szerokie natywne pokrycie `pnpm test:live`, ale uruchamia je jako nazwane shardy przez `scripts/test-live-shard.mjs` zamiast jednego zadania sekwencyjnego:

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
- podzielone shardy audio/wideo mediów i shardy muzyki filtrowane według providera

Zachowuje to to samo pokrycie plików, a jednocześnie ułatwia ponowne uruchamianie i diagnozowanie powolnych awarii providerów live. Zagregowane nazwy shardów `native-live-extensions-o-z`, `native-live-extensions-media` i `native-live-extensions-media-music` pozostają poprawne dla ręcznych jednorazowych ponownych uruchomień.

Natywne shardy mediów live działają w `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, budowanym przez workflow `Live Media Runner Image`. Ten obraz wstępnie instaluje `ffmpeg` i `ffprobe`; zadania mediów tylko weryfikują binaria przed konfiguracją. Utrzymuj zestawy live oparte na Dockerze na zwykłych runnerach Blacksmith — zadania kontenerowe nie są właściwym miejscem do uruchamiania zagnieżdżonych testów Docker.

Shardy modeli/backendów live oparte na Dockerze używają osobnego współdzielonego obrazu `ghcr.io/openclaw/openclaw-live-test:<sha>` dla wybranego commita. Workflow live wydania buduje i publikuje ten obraz raz, a następnie shardy modelu live Docker, Gateway podzielonego według providerów, backendu CLI, powiązania ACP i harnessu Codex działają z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Shardy Docker Gateway mają jawne limity `timeout` na poziomie skryptu poniżej limitu czasu zadania workflow, aby zawieszony kontener lub ścieżka czyszczenia kończyły się szybko zamiast zużywać cały budżet release-check. Jeśli te shardy niezależnie przebudowują pełny docelowy obraz Docker ze źródeł, uruchomienie wydania jest błędnie skonfigurowane i zmarnuje czas ścienny na zduplikowane budowania obrazów.

## Akceptacja pakietu

Użyj `Package Acceptance`, gdy pytanie brzmi: „czy ten instalowalny pakiet OpenClaw działa jako produkt?”. Różni się to od zwykłego CI: zwykłe CI waliduje drzewo źródeł, natomiast akceptacja pakietu waliduje pojedyncze archiwum tar przez ten sam harness Docker E2E, którego użytkownicy używają po instalacji lub aktualizacji.

### Zadania

1. `resolve_package` pobiera `workflow_ref`, rozwiązuje jednego kandydata pakietu, zapisuje `.artifacts/docker-e2e-package/openclaw-current.tgz`, zapisuje `.artifacts/docker-e2e-package/package-candidate.json`, przesyła oba jako artefakt `package-under-test` i wypisuje źródło, odwołanie workflow, odwołanie pakietu, wersję, SHA-256 oraz profil w podsumowaniu kroku GitHub.
2. `docker_acceptance` wywołuje `openclaw-live-and-e2e-checks-reusable.yml` z `ref=workflow_ref` i `package_artifact_name=package-under-test`. Workflow wielokrotnego użytku pobiera ten artefakt, waliduje inwentarz archiwum tar, przygotowuje obrazy Docker z digestem pakietu, gdy są potrzebne, i uruchamia wybrane ścieżki Docker względem tego pakietu zamiast pakować checkout workflow. Gdy profil wybiera wiele ukierunkowanych `docker_lanes`, workflow wielokrotnego użytku przygotowuje pakiet i współdzielone obrazy raz, a następnie rozdziela te ścieżki jako równoległe ukierunkowane zadania Docker z unikalnymi artefaktami.
3. `package_telegram` opcjonalnie wywołuje `NPM Telegram Beta E2E`. Działa, gdy `telegram_mode` nie jest `none`, i instaluje ten sam artefakt `package-under-test`, gdy Package Acceptance rozwiązało pakiet; samodzielne uruchomienie Telegram nadal może zainstalować opublikowaną specyfikację npm.
4. `summary` kończy workflow niepowodzeniem, jeśli rozwiązywanie pakietu, akceptacja Docker lub opcjonalna ścieżka Telegram nie powiodły się.

### Źródła kandydata

- `source=npm` akceptuje tylko `openclaw@beta`, `openclaw@latest` albo dokładną wersję wydania OpenClaw, taką jak `openclaw@2026.4.27-beta.2`. Użyj tego do akceptacji opublikowanej wersji przedpremierowej/stabilnej.
- `source=ref` pakuje zaufaną gałąź, tag lub pełny SHA commita `package_ref`. Resolver pobiera gałęzie/tagi OpenClaw, weryfikuje, że wybrany commit jest osiągalny z historii gałęzi repozytorium lub tagu wydania, instaluje zależności w odłączonym worktree i pakuje go za pomocą `scripts/package-openclaw-for-docker.mjs`.
- `source=url` pobiera `.tgz` przez HTTPS; `package_sha256` jest wymagane.
- `source=artifact` pobiera jedno `.tgz` z `artifact_run_id` i `artifact_name`; `package_sha256` jest opcjonalne, ale powinno być podane dla artefaktów udostępnianych zewnętrznie.

Trzymaj `workflow_ref` i `package_ref` osobno. `workflow_ref` to zaufany kod workflow/harnessu, który uruchamia test. `package_ref` to commit źródłowy, który zostaje spakowany, gdy `source=ref`. Dzięki temu bieżący harness testowy może walidować starsze zaufane commity źródłowe bez uruchamiania starej logiki workflow.

### Profile zestawu

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — pełne fragmenty ścieżki wydania Docker z OpenWebUI
- `custom` — dokładne `docker_lanes`; wymagane, gdy `suite_profile=custom`

Profil `package` używa offline'owego pokrycia pluginów, więc walidacja opublikowanego pakietu nie jest zależna od dostępności live ClawHub. Opcjonalna ścieżka Telegram ponownie używa artefaktu `package-under-test` w `NPM Telegram Beta E2E`, a ścieżka opublikowanej specyfikacji npm jest zachowana dla samodzielnych uruchomień.

Dedykowaną politykę testowania aktualizacji i pluginów, w tym lokalne polecenia,
ścieżki Docker, wejścia Package Acceptance, domyślne ustawienia wydania i triage awarii,
zobacz w [Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins).

Kontrole wydania wywołują Package Acceptance z `source=artifact`, przygotowanym artefaktem pakietu wydania, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` i `telegram_mode=mock-openai`. Dzięki temu dowody migracji pakietu, aktualizacji, czyszczenia przestarzałych zależności pluginów, naprawy instalacji skonfigurowanego pluginu, pluginu offline, aktualizacji pluginu i Telegram pozostają na tym samym rozwiązanym archiwum tar pakietu. Ustaw `package_acceptance_package_spec` w Full Release Validation lub OpenClaw Release Checks, aby uruchomić tę samą macierz względem dostarczonego pakietu npm zamiast artefaktu zbudowanego z SHA. Kontrole wydania cross-OS nadal obejmują specyficzne dla systemu operacyjnego onboardowanie, instalator i zachowanie platformy; walidacja produktu pakietu/aktualizacji powinna zaczynać się od Package Acceptance. Ścieżka Docker `published-upgrade-survivor` waliduje jedną bazową opublikowaną paczkę na uruchomienie. W Package Acceptance rozwiązane archiwum tar `package-under-test` jest zawsze kandydatem, a `published_upgrade_survivor_baseline` wybiera zapasową opublikowaną bazę, domyślnie `openclaw@latest`; polecenia ponownego uruchomienia nieudanej ścieżki zachowują tę bazę. Ustaw `published_upgrade_survivor_baselines=all-since-2026.4.23`, aby rozszerzyć Full Release CI na każde stabilne wydanie npm od `2026.4.23` do `latest`; `release-history` pozostaje dostępne do ręcznego szerszego próbkowania ze starszym punktem początkowym sprzed tej daty. Ustaw `published_upgrade_survivor_scenarios=reported-issues`, aby rozszerzyć te same bazy o macierz fixture'ów odwzorowujących problemy dla konfiguracji Feishu, zachowanych plików bootstrap/persona, instalacji skonfigurowanych pluginów OpenClaw, ścieżek logów z tyldą i przestarzałych katalogów głównych zależności legacy pluginów. Osobny workflow `Update Migration` używa ścieżki Docker `update-migration` z `all-since-2026.4.23` i `plugin-deps-cleanup`, gdy pytaniem jest wyczerpujące czyszczenie aktualizacji opublikowanych pakietów, a nie zwykły zakres Full Release CI. Lokalne uruchomienia agregujące mogą przekazywać dokładne specyfikacje pakietów przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, zachować jedną ścieżkę z `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, taką jak `openclaw@2026.4.15`, albo ustawić `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` dla macierzy scenariuszy. Opublikowana ścieżka konfiguruje bazę za pomocą wbudowanego przepisu polecenia `openclaw config set`, zapisuje kroki przepisu w `summary.json` i sprawdza `/healthz`, `/readyz` oraz status RPC po starcie Gateway. Świeże ścieżki pakietu i instalatora Windows weryfikują także, że zainstalowany pakiet potrafi zaimportować nadpisanie browser-control z surowej bezwzględnej ścieżki Windows. Smoke test kroku agenta OpenAI cross-OS domyślnie używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, jeśli jest ustawione, w przeciwnym razie `openai/gpt-5.4`, więc dowód instalacji i Gateway pozostaje na modelu testowym GPT-5, unikając domyślnych wartości GPT-4.x.

### Okna zgodności legacy

Package Acceptance ma ograniczone okna zgodności legacy dla już opublikowanych pakietów. Pakiety do `2026.4.25` włącznie, w tym `2026.4.25-beta.*`, mogą używać ścieżki zgodności:

- znane prywatne wpisy QA w `dist/postinstall-inventory.json` mogą wskazywać pliki pominięte w archiwum tar;
- `doctor-switch` może pominąć podprzypadek trwałości `gateway install --wrapper`, gdy pakiet nie udostępnia tej flagi;
- `update-channel-switch` może przyciąć brakujące `pnpm.patchedDependencies` z fałszywego fixture'a git pochodzącego z archiwum tar i może logować brak utrwalonego `update.channel`;
- smoke testy pluginów mogą odczytywać legacy lokalizacje rekordów instalacji albo akceptować brak trwałości rekordu instalacji marketplace;
- `plugin-update` może zezwolić na migrację metadanych konfiguracji, nadal wymagając, aby rekord instalacji i zachowanie bez ponownej instalacji pozostały niezmienione.

Opublikowany pakiet `2026.4.26` może również ostrzegać o lokalnych plikach znaczników metadanych builda, które już zostały dostarczone. Późniejsze pakiety muszą spełniać nowoczesne kontrakty; te same warunki powodują niepowodzenie zamiast ostrzeżenia lub pominięcia.

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

Podczas debugowania nieudanego uruchomienia akceptacji pakietu zacznij od podsumowania `resolve_package`, aby potwierdzić źródło pakietu, wersję i SHA-256. Następnie sprawdź uruchomienie podrzędne `docker_acceptance` oraz jego artefakty Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logi torów, czasy faz i polecenia ponownego uruchomienia. Preferuj ponowne uruchomienie nieudanego profilu pakietu lub dokładnych torów Docker zamiast ponownego uruchamiania pełnej walidacji wydania.

## Smoke test instalacji

Osobny workflow `Install Smoke` ponownie używa tego samego skryptu zakresu przez własne zadanie `preflight`. Dzieli zakres smoke testów na `run_fast_install_smoke` i `run_full_install_smoke`.

- **Szybka ścieżka** uruchamia się dla pull requestów dotykających powierzchni Docker/pakietu, zmian pakietu/manifestu dołączonego Pluginu albo powierzchni rdzeniowego Pluginu/kanału/Gateway/Plugin SDK, które wykonują zadania smoke Docker. Zmiany dołączonego Pluginu dotyczące tylko źródeł, edycje wyłącznie testów i edycje wyłącznie dokumentacji nie rezerwują workerów Docker. Szybka ścieżka buduje obraz głównego Dockerfile raz, sprawdza CLI, uruchamia smoke CLI usuwania agentów ze współdzielonego obszaru roboczego, uruchamia e2e sieci Gateway kontenera, weryfikuje argument budowania dołączonego rozszerzenia i uruchamia ograniczony profil Docker dołączonego Pluginu z łącznym limitem czasu polecenia 240 sekund (każde uruchomienie Docker scenariusza jest limitowane osobno).
- **Pełna ścieżka** zachowuje instalację pakietu QR oraz zakres instalatora Docker/aktualizacji dla nocnych zaplanowanych uruchomień, ręcznych wywołań, release checków z workflow-call i pull requestów, które rzeczywiście dotykają powierzchni instalatora/pakietu/Docker. W trybie pełnym install-smoke przygotowuje lub ponownie używa jednego obrazu GHCR smoke głównego Dockerfile dla docelowego SHA, a następnie uruchamia instalację pakietu QR, smoke testy głównego Dockerfile/Gateway, smoke testy instalatora/aktualizacji oraz szybkie E2E Docker dołączonego Pluginu jako osobne zadania, aby praca instalatora nie czekała za smoke testami obrazu głównego.

Wypchnięcia do `main` (w tym commity scalające) nie wymuszają pełnej ścieżki; gdy logika zakresu zmian zażądałaby pełnego pokrycia przy wypchnięciu, workflow zachowuje szybki smoke test Docker i pozostawia pełny smoke test instalacji nocnym uruchomieniom lub walidacji wydania.

Powolny smoke test globalnej instalacji Bun dla dostawcy obrazów jest bramkowany osobno przez `run_bun_global_install_smoke`. Uruchamia się w nocnym harmonogramie i z workflow release checków, a ręczne wywołania `Install Smoke` mogą go włączyć, ale pull requesty i wypchnięcia do `main` tego nie robią. Testy Docker QR i instalatora zachowują własne Dockerfile skupione na instalacji.

## Lokalne Docker E2E

`pnpm test:docker:all` wstępnie buduje jeden współdzielony obraz live-test, pakuje OpenClaw raz jako tarball npm i buduje dwa współdzielone obrazy `scripts/e2e/Dockerfile`:

- podstawowy runner Node/Git dla torów instalatora/aktualizacji/zależności Pluginu;
- obraz funkcjonalny, który instaluje ten sam tarball w `/app` dla normalnych torów funkcjonalności.

Definicje torów Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`, logika planera w `scripts/lib/docker-e2e-plan.mjs`, a runner wykonuje tylko wybrany plan. Scheduler wybiera obraz dla toru za pomocą `OPENCLAW_DOCKER_E2E_BARE_IMAGE` i `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, a następnie uruchamia tory z `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametry

| Zmienna                                | Domyślnie | Cel                                                                                           |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Liczba slotów głównej puli dla normalnych torów.                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Liczba slotów puli końcowej wrażliwej na dostawców.                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limit współbieżnych torów live, aby dostawcy nie ograniczali przepustowości.                   |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | Limit współbieżnych torów instalacji npm.                                                     |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limit współbieżnych torów wielousługowych.                                                     |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Odstęp między startami torów, aby uniknąć nagłych fal tworzenia w daemonie Docker; ustaw `0`, aby wyłączyć odstęp. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Awaryjny limit czasu na tor (120 minut); wybrane tory live/końcowe używają ciaśniejszych limitów. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | nieustawione | `1` wypisuje plan schedulera bez uruchamiania torów.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | nieustawione | Oddzielona przecinkami dokładna lista torów; pomija smoke test czyszczenia, aby agenci mogli odtworzyć jeden nieudany tor. |

Tor cięższy niż jego efektywny limit nadal może wystartować z pustej puli, a potem działa samodzielnie, dopóki nie zwolni pojemności. Lokalne zbiorcze preflighty sprawdzają Docker, usuwają przestarzałe kontenery OpenClaw E2E, emitują status aktywnych torów, utrwalają czasy torów dla kolejności od najdłuższych i domyślnie przestają planować nowe tory z puli po pierwszym niepowodzeniu.

### Workflow live/E2E wielokrotnego użytku

Workflow live/E2E wielokrotnego użytku pyta `scripts/test-docker-all.mjs --plan-json`, jakie pokrycie pakietu, rodzaju obrazu, obrazu live, toru i poświadczeń jest wymagane. `scripts/docker-e2e.mjs` konwertuje następnie ten plan na wyjścia i podsumowania GitHub. Albo pakuje OpenClaw przez `scripts/package-openclaw-for-docker.mjs`, pobiera artefakt pakietu z bieżącego uruchomienia, albo pobiera artefakt pakietu z `package_artifact_run_id`; waliduje inwentarz tarballa; buduje i wypycha oznaczone digestem pakietu podstawowe/funkcjonalne obrazy GHCR Docker E2E przez cache warstw Docker Blacksmith, gdy plan wymaga torów z zainstalowanym pakietem; oraz ponownie używa podanych wejść `docker_e2e_bare_image`/`docker_e2e_functional_image` lub istniejących obrazów z digestem pakietu zamiast budować je ponownie. Pobieranie obrazów Docker jest ponawiane z ograniczonym limitem 180 sekund na próbę, aby zablokowany strumień rejestru/cache szybko ponawiał próbę zamiast zużywać większość ścieżki krytycznej CI.

### Fragmenty ścieżki wydania

Zakres Docker dla wydania uruchamia mniejsze, podzielone zadania z `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby każdy fragment pobierał tylko rodzaj obrazu, którego potrzebuje, i wykonywał wiele torów przez ten sam ważony scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Bieżące fragmenty Docker wydania to `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` oraz od `plugins-runtime-install-a` do `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` i `plugins-integrations` pozostają zbiorczymi aliasami Plugin/runtime. Alias toru `install-e2e` pozostaje zbiorczym aliasem ręcznego ponownego uruchomienia dla obu torów instalatora dostawcy.

OpenWebUI jest włączane do `plugins-runtime-services`, gdy żąda tego pełne pokrycie ścieżki wydania, i zachowuje samodzielny fragment `openwebui` tylko dla wywołań dotyczących wyłącznie OpenWebUI. Tory aktualizacji dołączonych kanałów ponawiają się raz przy przejściowych awariach sieci npm.

Każdy fragment przesyła `.artifacts/docker-tests/` z logami torów, czasami, `summary.json`, `failures.json`, czasami faz, JSON planu schedulera, tabelami wolnych torów i poleceniami ponownego uruchomienia dla każdego toru. Wejście workflow `docker_lanes` uruchamia wybrane tory względem przygotowanych obrazów zamiast zadań fragmentów, co ogranicza debugowanie nieudanego toru do jednego celowanego zadania Docker i przygotowuje, pobiera lub ponownie używa artefaktu pakietu dla tego uruchomienia; jeśli wybrany tor jest torem live Docker, celowane zadanie buduje lokalnie obraz live-test dla tego ponownego uruchomienia. Wygenerowane polecenia GitHub ponownego uruchomienia dla każdego toru zawierają `package_artifact_run_id`, `package_artifact_name` i wejścia przygotowanych obrazów, gdy te wartości istnieją, aby nieudany tor mógł ponownie użyć dokładnego pakietu i obrazów z nieudanego uruchomienia.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zaplanowany workflow live/E2E uruchamia codziennie pełny zestaw Docker ścieżki wydania.

## Plugin Prerelease

`Plugin Prerelease` to droższe pokrycie produktu/pakietu, więc jest osobnym workflow wywoływanym przez `Full Release Validation` albo jawnie przez operatora. Zwykłe pull requesty, wypchnięcia do `main` i samodzielne ręczne wywołania CI nie uruchamiają tego zestawu. Równoważy testy dołączonych Pluginów na ośmiu workerach rozszerzeń; te zadania shardów rozszerzeń uruchamiają do dwóch grup konfiguracji Pluginów naraz, z jednym workerem Vitest na grupę i większym stertą Node, aby ciężkie importowo partie Pluginów nie tworzyły dodatkowych zadań CI. Ścieżka prerelease Docker tylko dla wydania grupuje celowane tory Docker w małe grupy, aby uniknąć rezerwowania dziesiątek runnerów dla zadań trwających od jednej do trzech minut.

## QA Lab

QA Lab ma dedykowane tory CI poza głównym workflow z inteligentnym zakresem. Parzystość agentowa jest zagnieżdżona pod szerokimi harnessami QA i wydania, a nie samodzielnym workflow PR. Użyj `Full Release Validation` z `rerun_group=qa-parity`, gdy parzystość ma jechać razem z szerokim uruchomieniem walidacji.

- Workflow `QA-Lab - All Lanes` uruchamia się co noc na `main` i przy ręcznym wywołaniu; rozdziela tor parzystości mock, tor live Matrix oraz tory live Telegram i Discord jako zadania równoległe. Zadania live używają środowiska `qa-live-shared`, a Telegram/Discord używają dzierżaw Convex.

Release checki uruchamiają tory transportu live Matrix i Telegram z deterministycznym dostawcą mock i modelami kwalifikowanymi jako mock (`mock-openai/gpt-5.5` i `mock-openai/gpt-5.5-alt`), aby kontrakt kanału był odizolowany od opóźnień modeli live i normalnego startu provider-plugin. Gateway transportu live wyłącza wyszukiwanie pamięci, ponieważ parzystość QA pokrywa zachowanie pamięci osobno; łączność dostawcy pokrywają osobne zestawy modeli live, natywnych dostawców i dostawców Docker.

Matrix używa `--profile fast` dla zaplanowanych bramek i bramek wydania, dodając `--fail-fast` tylko wtedy, gdy sprawdzony CLI to obsługuje. Domyślne ustawienie CLI i wejście ręcznego workflow pozostają `all`; ręczne wywołanie `matrix_profile=all` zawsze sharduje pełne pokrycie Matrix na zadania `transport`, `media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`.

`OpenClaw Release Checks` uruchamia również krytyczne dla wydania tory QA Lab przed zatwierdzeniem wydania; jego bramka parzystości QA uruchamia paczki kandydata i bazową jako równoległe zadania torów, a następnie pobiera oba artefakty do małego zadania raportującego dla końcowego porównania parzystości.

Dla zwykłych PR-ów kieruj się dowodami z zakresowego CI/checków zamiast traktować parzystość jako wymagany status.

## CodeQL

Przepływ pracy `CodeQL` jest celowo wąskim skanerem bezpieczeństwa pierwszego przebiegu, a nie pełnym przeglądem repozytorium. Codzienne, ręczne oraz ochronne uruchomienia dla pull requestów niebędących wersjami roboczymi skanują kod przepływów pracy Actions oraz najbardziej ryzykowne powierzchnie JavaScript/TypeScript za pomocą zapytań bezpieczeństwa o wysokiej pewności, filtrowanych do wysokiego/krytycznego `security-severity`.

Ochrona pull requestów pozostaje lekka: uruchamia się tylko dla zmian w `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` lub `src` i wykonuje tę samą macierz bezpieczeństwa o wysokiej pewności co zaplanowany przepływ pracy. Android i macOS CodeQL pozostają poza domyślnymi ustawieniami PR.

### Kategorie bezpieczeństwa

| Kategoria                                          | Powierzchnia                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Uwierzytelnianie, sekrety, piaskownica, cron i linia bazowa Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrakty implementacji kanałów rdzenia oraz środowisko uruchomieniowe Plugin kanału, Gateway, Plugin SDK, sekrety i punkty styku audytu              |
| `/codeql-security-high/network-ssrf-boundary`     | Powierzchnie zasad SSRF rdzenia, parsowania IP, ochrony sieci, pobierania z sieci oraz SSRF w Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Serwery MCP, pomocnicze funkcje wykonywania procesów, dostarczanie wychodzące oraz bramki wykonywania narzędzi agenta                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Powierzchnie zaufania instalacji Plugin, loadera, manifestu, rejestru, instalacji menedżera pakietów, ładowania źródeł oraz kontraktu pakietu Plugin SDK |

### Shardy bezpieczeństwa specyficzne dla platform

- `CodeQL Android Critical Security` — zaplanowany shard bezpieczeństwa Androida. Ręcznie buduje aplikację Android dla CodeQL na najmniejszym runnerze Blacksmith Linux akceptowanym przez kontrolę poprawności przepływu pracy. Przesyła wyniki pod `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — cotygodniowy/ręczny shard bezpieczeństwa macOS. Ręcznie buduje aplikację macOS dla CodeQL na Blacksmith macOS, odfiltrowuje wyniki budowania zależności z przesyłanego SARIF i przesyła wyniki pod `/codeql-critical-security/macos`. Pozostaje poza codziennymi ustawieniami domyślnymi, ponieważ kompilacja macOS dominuje czas działania nawet przy czystym przebiegu.

### Kategorie jakości krytycznej

`CodeQL Critical Quality` to odpowiadający shard niezwiązany z bezpieczeństwem. Uruchamia tylko zapytania jakości JavaScript/TypeScript o poziomie błędu, niezwiązane z bezpieczeństwem, na wąskich powierzchniach o wysokiej wartości na mniejszym runnerze Blacksmith Linux. Jego ochrona pull requestów jest celowo mniejsza niż zaplanowany profil: PR-y niebędące wersjami roboczymi uruchamiają tylko odpowiadające shardy `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` i `plugin-sdk-reply-runtime` dla zmian w kodzie wykonywania poleceń/modeli/narzędzi agenta i wysyłania odpowiedzi, kodzie schematu konfiguracji/migracji/IO, kodzie uwierzytelniania/sekretów/piaskownicy/bezpieczeństwa, środowisku uruchomieniowym kanałów rdzenia i dołączonego Plugin kanału, protokole Gateway/metodzie serwera, kleju runtime/SDK pamięci, dostarczaniu MCP/procesów/wychodzącym, runtime dostawcy/katalogu modeli, diagnostyce sesji/kolejkach dostarczania, loaderze Plugin, kontrakcie Plugin SDK/pakietu lub runtime odpowiedzi Plugin SDK. Zmiany konfiguracji CodeQL i przepływu pracy jakości uruchamiają wszystkie dwanaście shardów jakości PR.

Ręczne wywołanie przyjmuje:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Wąskie profile są zaczepami do nauki/iteracji służącymi do uruchamiania jednego sharda jakości w izolacji.

| Kategoria                                                | Powierzchnia                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kod granicy bezpieczeństwa uwierzytelniania, sekretów, piaskownicy, cron i Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Schemat konfiguracji, migracja, normalizacja i kontrakty IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schematy protokołu Gateway i kontrakty metod serwera                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrakty implementacji kanału rdzenia i dołączonego Plugin kanału                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Wykonywanie poleceń, wysyłanie modelu/dostawcy, wysyłanie automatycznych odpowiedzi i kolejki oraz kontrakty runtime płaszczyzny sterowania ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serwery MCP i mosty narzędzi, pomocnicze funkcje nadzoru procesów oraz kontrakty dostarczania wychodzącego                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hosta pamięci, fasady runtime pamięci, aliasy Plugin SDK pamięci, klej aktywacji runtime pamięci oraz polecenia doctor pamięci                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Wewnętrzne elementy kolejki odpowiedzi, kolejki dostarczania sesji, pomocnicze funkcje wiązania/dostarczania sesji wychodzących, powierzchnie pakietów zdarzeń/logów diagnostycznych oraz kontrakty CLI doctor sesji |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Wysyłanie odpowiedzi przychodzących w Plugin SDK, pomocnicze funkcje payloadów/fragmentacji/runtime odpowiedzi, opcje odpowiedzi kanału, kolejki dostarczania oraz pomocnicze funkcje wiązania sesji/wątku             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizacja katalogu modeli, uwierzytelnianie i wykrywanie dostawców, rejestracja runtime dostawców, ustawienia domyślne/katalogi dostawców oraz rejestry sieci/wyszukiwania/pobierania/embeddingów    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap interfejsu sterowania, lokalna trwałość, przepływy sterowania Gateway oraz kontrakty runtime płaszczyzny sterowania zadaniami                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrakty runtime pobierania/wyszukiwania w sieci rdzenia, IO mediów, rozumienia mediów, generowania obrazów i generowania mediów                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Kontrakty loadera, rejestru, powierzchni publicznej oraz punktu wejścia Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Opublikowane źródło Plugin SDK po stronie pakietu oraz pomocnicze funkcje kontraktu pakietu pluginu                                                                                      |

Jakość pozostaje oddzielona od bezpieczeństwa, aby ustalenia jakości można było planować, mierzyć, wyłączać lub rozszerzać bez zaciemniania sygnału bezpieczeństwa. Rozszerzenie CodeQL dla Swift, Python i dołączonych pluginów należy dodać ponownie jako zakresowane lub shardowane prace następcze dopiero po tym, jak wąskie profile będą miały stabilny czas działania i sygnał.

## Przepływy pracy utrzymaniowej

### Docs Agent

Przepływ pracy `Docs Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex do utrzymywania istniejącej dokumentacji w zgodzie z niedawno wprowadzonymi zmianami. Nie ma czystego harmonogramu: udany przebieg CI po wypchnięciu przez nie-bota na `main` może go wyzwolić, a ręczne wywołanie może uruchomić go bezpośrednio. Wywołania workflow-run są pomijane, gdy `main` przesunął się dalej albo gdy inny niepominięty przebieg Docs Agent został utworzony w ostatniej godzinie. Gdy działa, przegląda zakres commitów od poprzedniego niepominiętego źródłowego SHA Docs Agent do bieżącego `main`, więc jeden godzinny przebieg może objąć wszystkie zmiany na main zgromadzone od ostatniego przeglądu dokumentacji.

### Test Performance Agent

Przepływ pracy `Test Performance Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex dla wolnych testów. Nie ma czystego harmonogramu: udany przebieg CI po wypchnięciu przez nie-bota na `main` może go wyzwolić, ale jest pomijany, jeśli inne wywołanie workflow-run już wykonało się lub działa tego dnia UTC. Ręczne wywołanie omija tę dzienną bramkę aktywności. Ścieżka buduje pogrupowany raport wydajności Vitest dla pełnego zestawu, pozwala Codex wprowadzać tylko małe poprawki wydajności testów zachowujące pokrycie zamiast szerokich refaktoryzacji, następnie ponownie uruchamia raport pełnego zestawu i odrzuca zmiany, które zmniejszają bazową liczbę przechodzących testów. Jeśli linia bazowa ma testy zakończone niepowodzeniem, Codex może naprawić tylko oczywiste awarie, a raport pełnego zestawu po agencie musi przejść, zanim cokolwiek zostanie zatwierdzone. Gdy `main` przesunie się, zanim wypchnięcie bota wyląduje, ścieżka rebazuje zweryfikowaną poprawkę, ponownie uruchamia `pnpm check:changed` i ponawia wypchnięcie; konfliktujące przestarzałe poprawki są pomijane. Używa GitHub-hosted Ubuntu, aby akcja Codex mogła zachować tę samą postawę bezpieczeństwa drop-sudo co agent dokumentacji.

### Zduplikowane PR-y po scaleniu

Przepływ pracy `Duplicate PRs After Merge` to ręczny przepływ pracy maintainerów do sprzątania duplikatów po wylądowaniu. Domyślnie działa w trybie dry-run i zamyka tylko jawnie wymienione PR-y, gdy `apply=true`. Przed modyfikacją GitHub weryfikuje, że wylądowany PR został scalony oraz że każdy duplikat ma albo wspólne odwołanie do issue, albo nakładające się zmienione hunki.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokalne bramki kontroli i routingu zmian

Lokalna logika changed-lane znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka kontroli jest bardziej rygorystyczna wobec granic architektury niż szeroki zakres platformy CI:

- zmiany produkcyjne rdzenia uruchamiają typecheck produkcji rdzenia i testów rdzenia oraz lint/guardy rdzenia;
- zmiany wyłącznie testowe rdzenia uruchamiają tylko typecheck testów rdzenia oraz lint rdzenia;
- zmiany produkcyjne rozszerzeń uruchamiają typecheck produkcji rozszerzeń i testów rozszerzeń oraz lint rozszerzeń;
- zmiany wyłącznie testowe rozszerzeń uruchamiają typecheck testów rozszerzeń oraz lint rozszerzeń;
- publiczne zmiany Plugin SDK lub kontraktu pluginu rozszerzają się do typechecku rozszerzeń, ponieważ rozszerzenia zależą od tych kontraktów rdzenia (przeglądy Vitest rozszerzeń pozostają jawną pracą testową);
- podbicia wersji wyłącznie w metadanych wydania uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności roota;
- nieznane zmiany roota/konfiguracji bezpiecznie przechodzą do wszystkich ścieżek kontroli.

Lokalny routing changed-test znajduje się w `scripts/test-projects.test-support.mjs` i jest celowo tańszy niż `check:changed`: bezpośrednie edycje testów uruchamiają same siebie, edycje źródeł preferują jawne mapowania, a następnie testy sąsiednie i zależne z grafu importów. Wspólna konfiguracja dostarczania group-room jest jednym z jawnych mapowań: zmiany w konfiguracji widocznych odpowiedzi grupy, trybie dostarczania odpowiedzi źródłowej lub systemowym promptcie narzędzia wiadomości są kierowane przez testy odpowiedzi rdzenia oraz regresje dostarczania Discord i Slack, aby wspólna zmiana domyślna zawiodła przed pierwszym wypchnięciem PR. Używaj `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy zmiana jest na tyle szeroka dla całego harnessu, że tani zestaw mapowany nie jest wiarygodnym przybliżeniem.

## Walidacja Testbox

Uruchamiaj Testbox z katalogu głównego repozytorium i preferuj świeżo rozgrzaną maszynę do szerokiego potwierdzenia. Zanim poświęcisz wolną bramkę na maszynie, która została użyta ponownie, wygasła albo właśnie zgłosiła nieoczekiwanie dużą synchronizację, najpierw uruchom `pnpm testbox:sanity` wewnątrz tej maszyny.

Kontrola sanity szybko kończy się niepowodzeniem, gdy wymagane pliki główne, takie jak `pnpm-lock.yaml`, zniknęły albo gdy `git status --short` pokazuje co najmniej 200 śledzonych usunięć. Zwykle oznacza to, że zdalny stan synchronizacji nie jest wiarygodną kopią PR-a; zatrzymaj tę maszynę i rozgrzej świeżą zamiast debugować niepowodzenie testu produktu. W przypadku PR-ów z celowo dużą liczbą usunięć ustaw `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` dla tego uruchomienia sanity.

`pnpm testbox:run` kończy również lokalne wywołanie Blacksmith CLI, które pozostaje w fazie synchronizacji przez ponad pięć minut bez danych wyjściowych po synchronizacji. Ustaw `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, aby wyłączyć tę ochronę, albo użyj większej wartości w milisekundach dla nietypowo dużych lokalnych różnic.

Crabbox to należąca do repozytorium druga ścieżka zdalnej maszyny do potwierdzenia w Linuksie, gdy Blacksmith jest niedostępny albo gdy preferowana jest własna pojemność w chmurze. Rozgrzej maszynę, zhydratyzuj ją przez przepływ pracy projektu, a następnie uruchamiaj polecenia przez Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` jest właścicielem domyślnych ustawień dostawcy, synchronizacji i hydratyzacji GitHub Actions. Wyklucza lokalne `.git`, dzięki czemu zhydratyzowany checkout Actions zachowuje własne zdalne metadane Git zamiast synchronizować zdalne repozytoria i magazyny obiektów lokalne dla maintainera, oraz wyklucza lokalne artefakty uruchomieniowe/kompilacji, które nigdy nie powinny być przesyłane. `.github/workflows/crabbox-hydrate.yml` jest właścicielem checkoutu, konfiguracji Node/pnpm, pobrania `origin/main` oraz przekazania niesekretnego środowiska, z którego później korzystają polecenia `crabbox run --id <cbx_id>`.

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Kanały deweloperskie](/pl/install/development-channels)
