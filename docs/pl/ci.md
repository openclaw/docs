---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI zostało lub nie zostało uruchomione
    - Debugujesz nieudane sprawdzenie GitHub Actions
    - Koordynujesz uruchomienie lub ponowne uruchomienie walidacji wydania
summary: Graf zadań CI, bramki zakresu, parasole wydań i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-04-30T09:41:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9c18f0801864ca1030aac9ea81117b011bd7936388984a1809ce3ae6e906e62
    source_path: ci.md
    workflow: 16
---

OpenClaw CI uruchamia się przy każdym wypchnięciu do `main` i dla każdego pull requestu. Zadanie `preflight` klasyfikuje diff i wyłącza kosztowne ścieżki, gdy zmieniły się tylko niepowiązane obszary. Ręczne uruchomienia `workflow_dispatch` celowo omijają inteligentne zawężanie zakresu i rozwijają pełny graf dla kandydatów do wydania oraz szerokiej walidacji. Ścieżki Androida pozostają opcjonalne przez `include_android`. Pokrycie Plugin tylko dla wydań znajduje się w osobnym workflow [`Plugin Prerelease`](#plugin-prerelease) i uruchamia się tylko z [`Full Release Validation`](#full-release-validation) albo przez jawne ręczne wywołanie.

## Przegląd potoku

| Zadanie                          | Cel                                                                                          | Kiedy się uruchamia               |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Wykrywa zmiany wyłącznie w dokumentacji, zmienione zakresy, zmienione rozszerzenia i buduje manifest CI | Zawsze dla niedraftowych wypchnięć i PR-ów |
| `security-scm-fast`              | Wykrywanie kluczy prywatnych i audyt workflow przez `zizmor`                                  | Zawsze dla niedraftowych wypchnięć i PR-ów |
| `security-dependency-audit`      | Audyt produkcyjnego lockfile bez instalowania zależności względem advisory npm                | Zawsze dla niedraftowych wypchnięć i PR-ów |
| `security-fast`                  | Wymagany agregat dla szybkich zadań bezpieczeństwa                                           | Zawsze dla niedraftowych wypchnięć i PR-ów |
| `check-dependencies`             | Produkcyjny przebieg Knip tylko dla zależności oraz strażnik listy dozwolonych nieużywanych plików | Zmiany istotne dla Node |
| `build-artifacts`                | Buduje `dist/`, Control UI, kontrole zbudowanych artefaktów i artefakty wielokrotnego użytku dla dalszych zadań | Zmiany istotne dla Node |
| `checks-fast-core`               | Szybkie linuksowe ścieżki poprawności, takie jak kontrole dołączonych Pluginów, kontraktów Pluginów i protokołu | Zmiany istotne dla Node |
| `checks-fast-contracts-channels` | Shardowane kontrole kontraktów kanałów ze stabilnym zagregowanym wynikiem kontroli           | Zmiany istotne dla Node |
| `checks-node-core-test`          | Shardy testów rdzenia Node, z wyłączeniem ścieżek kanałów, dołączonych elementów, kontraktów i rozszerzeń | Zmiany istotne dla Node |
| `check`                          | Shardowany odpowiednik głównej lokalnej bramki: typy produkcyjne, lint, strażniki, typy testów i rygorystyczny smoke test | Zmiany istotne dla Node |
| `check-additional`               | Shardy architektury, granic, strażników powierzchni rozszerzeń, granic pakietów i gateway-watch | Zmiany istotne dla Node |
| `build-smoke`                    | Smoke testy zbudowanego CLI i smoke test pamięci przy uruchomieniu                           | Zmiany istotne dla Node |
| `checks`                         | Weryfikator testów kanałów dla zbudowanych artefaktów                                        | Zmiany istotne dla Node |
| `checks-node-compat-node22`      | Ścieżka budowania zgodności z Node 22 i smoke testu                                          | Ręczne wywołanie CI dla wydań |
| `check-docs`                     | Formatowanie dokumentacji, lint i kontrole uszkodzonych linków                               | Zmieniona dokumentacja |
| `skills-python`                  | Ruff + pytest dla Skills opartych na Pythonie                                                | Zmiany istotne dla pythonowych Skills |
| `checks-windows`                 | Testy procesów/ścieżek specyficzne dla Windows oraz regresje współdzielonych specyfikatorów importu runtime | Zmiany istotne dla Windows |
| `macos-node`                     | Ścieżka testów TypeScript na macOS używająca współdzielonych zbudowanych artefaktów          | Zmiany istotne dla macOS |
| `macos-swift`                    | Swift lint, budowanie i testy aplikacji macOS                                                | Zmiany istotne dla macOS |
| `android`                        | Testy jednostkowe Androida dla obu wariantów oraz jedno zbudowanie debug APK                 | Zmiany istotne dla Androida |
| `test-performance-agent`         | Codzienna optymalizacja wolnych testów przez Codex po zaufanej aktywności                    | Powodzenie CI na main albo ręczne wywołanie |

## Kolejność fail-fast

1. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie osobne zadania.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` kończą się niepowodzeniem szybko, bez czekania na cięższe zadania artefaktów i macierzy platform.
3. `build-artifacts` nakłada się z szybkimi ścieżkami Linuksa, aby dalsi konsumenci mogli wystartować, gdy tylko wspólna kompilacja będzie gotowa.
4. Cięższe ścieżki platform i runtime rozwijają się potem: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowsze wypchnięcie trafi do tego samego PR-a albo refa `main`. Traktuj to jako szum CI, chyba że najnowsze uruchomienie dla tego samego refa również kończy się niepowodzeniem. Zagregowane kontrole shardów używają `!cancelled() && always()`, więc nadal raportują zwykłe niepowodzenia shardów, ale nie kolejkują się po tym, jak całe workflow zostało już zastąpione. Automatyczny klucz współbieżności CI jest wersjonowany (`CI-v7-*`), aby zombie po stronie GitHuba w starej grupie kolejki nie mogło bezterminowo blokować nowszych uruchomień main. Ręczne uruchomienia pełnego zestawu używają `CI-manual-v1-*` i nie anulują trwających uruchomień.

## Zakres i routowanie

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest pokryta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`. Ręczne wywołanie pomija wykrywanie changed-scope i sprawia, że manifest preflight zachowuje się tak, jakby zmienił się każdy obszar objęty zakresem.

- **Edycje workflow CI** walidują graf CI Node oraz linting workflow, ale same nie wymuszają natywnych buildów Windows, Androida ani macOS; te ścieżki platform pozostają ograniczone do zmian źródeł platformowych.
- **Edycje wyłącznie routingu CI, wybrane tanie edycje fixture’ów testów rdzenia oraz wąskie edycje pomocnicze/routingu testów kontraktów Pluginów** używają szybkiej ścieżki manifestu tylko dla Node: `preflight`, bezpieczeństwo i jedno zadanie `checks-fast-core`. Ta ścieżka pomija artefakty budowania, zgodność z Node 22, kontrakty kanałów, pełne shardy rdzenia, shardy dołączonych Pluginów i dodatkowe macierze strażników, gdy zmiana ogranicza się do powierzchni routingu lub pomocniczych, które szybkie zadanie ćwiczy bezpośrednio.
- **Kontrole Node dla Windows** są ograniczone do specyficznych dla Windows wrapperów procesów/ścieżek, helperów runnerów npm/pnpm/UI, konfiguracji menedżera pakietów oraz powierzchni workflow CI, które wykonują tę ścieżkę; niepowiązane zmiany źródeł, Pluginów, install-smoke i wyłącznie testowe pozostają na linuksowych ścieżkach Node.

Najwolniejsze rodziny testów Node są dzielone lub równoważone, aby każde zadanie pozostawało małe bez nadmiernej rezerwacji runnerów: kontrakty kanałów działają jako trzy ważone shardy, małe ścieżki jednostkowe rdzenia są parowane, auto-reply działa jako czterech zrównoważonych workerów (z poddrzewem odpowiedzi podzielonym na shardy agent-runner, dispatch oraz commands/state-routing), a agentic konfiguracje Gateway/Plugin są rozłożone między istniejące zadania agentic Node tylko dla źródeł zamiast czekać na zbudowane artefakty. Szerokie testy przeglądarki, QA, mediów i różne testy Pluginów używają własnych dedykowanych konfiguracji Vitest zamiast wspólnego catch-all dla Pluginów. Shardy include-pattern zapisują wpisy czasów z użyciem nazwy sharda CI, więc `.artifacts/vitest-shard-timings.json` może odróżnić całą konfigurację od filtrowanego sharda. `check-additional` trzyma razem prace kompilacji/canary granic pakietów i oddziela architekturę topologii runtime od pokrycia gateway watch; shard strażnika granic uruchamia swoje małe niezależne strażniki współbieżnie w jednym zadaniu. Gateway watch, testy kanałów i shard granicy wsparcia rdzenia działają współbieżnie wewnątrz `build-artifacts` po tym, jak `dist/` i `dist-runtime/` są już zbudowane.

CI Androida uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a następnie buduje Play debug APK. Wariant third-party nie ma osobnego zestawu źródeł ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje wariant z flagami BuildConfig SMS/call-log, unikając jednocześnie duplikowania zadania pakowania debug APK przy każdym wypchnięciu istotnym dla Androida.

Shard `check-dependencies` uruchamia `pnpm deadcode:dependencies` (produkcyjny przebieg Knip tylko dla zależności przypięty do najnowszej wersji Knip, z wyłączonym minimalnym wiekiem wydania pnpm dla instalacji `dlx`) oraz `pnpm deadcode:unused-files`, które porównuje produkcyjne znaleziska nieużywanych plików Knip z `scripts/deadcode-unused-files.allowlist.mjs`. Strażnik nieużywanych plików kończy się niepowodzeniem, gdy PR dodaje nowy nieprzejrzany nieużywany plik albo zostawia przestarzały wpis na liście dozwolonych, zachowując przy tym celowe dynamiczne powierzchnie Pluginów, wygenerowane, build, live-test i mosty pakietów, których Knip nie może rozwiązać statycznie.

## Ręczne wywołania

Ręczne wywołania CI uruchamiają ten sam graf zadań co normalne CI, ale wymuszają każdą nieandroidową ścieżkę objętą zakresem: shardy Linux Node, shardy dołączonych Pluginów, kontrakty kanałów, zgodność z Node 22, `check`, `check-additional`, build smoke, kontrole dokumentacji, pythonowe Skills, Windows, macOS i i18n Control UI. Samodzielne ręczne wywołania CI uruchamiają Androida tylko z `include_android=true`; parasol pełnego wydania włącza Androida przez przekazanie `include_android=true`. Statyczne kontrole prerelease Pluginów, wyłącznie wydaniowy shard `agentic-plugins`, pełny wsadowy przegląd rozszerzeń i dockerowe ścieżki prerelease Pluginów są wyłączone z CI. Zestaw Docker prerelease uruchamia się tylko wtedy, gdy `Full Release Validation` wywołuje osobny workflow `Plugin Prerelease` z włączoną bramką release-validation.

Ręczne uruchomienia używają unikalnej grupy współbieżności, więc pełny zestaw dla kandydata do wydania nie jest anulowany przez inne wypchnięcie albo uruchomienie PR na tym samym refie. Opcjonalne wejście `target_ref` pozwala zaufanemu wywołującemu uruchomić ten graf względem brancha, taga albo pełnego SHA commita, używając pliku workflow z wybranego refa wywołania.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnery

| Uruchamiacz                     | Zadania                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, szybkie zadania bezpieczeństwa i agregaty (`security-scm-fast`, `security-dependency-audit`, `security-fast`), szybkie kontrole protokołu/kontraktu/pakietów, shardowane kontrole kontraktów kanałów, shardy `check` z wyjątkiem lint, shardy i agregaty `check-additional`, weryfikatory agregatów testów Node, kontrole dokumentacji, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke także używa Ubuntu hostowanego przez GitHub, aby macierz Blacksmith mogła wcześniej trafić do kolejki |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lżejsze shardy rozszerzeń, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` i `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shardy testów Node w Linuksie, shardy testów pakietowych pluginów, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (na tyle wrażliwe na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało); buildy Docker install-smoke (czas oczekiwania w kolejce dla 32 vCPU kosztował więcej, niż oszczędzał)                                                                                                                                                                                                                                                                                                                     |
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

`Full Release Validation` to ręczny nadrzędny workflow do „uruchomienia wszystkiego przed wydaniem”. Przyjmuje gałąź, tag lub pełny SHA commita, uruchamia ręczny workflow `CI` z tym celem, uruchamia `Plugin Prerelease` dla dowodu dotyczącego wyłącznie wydania: pluginów/pakietów/statyki/Dockera, oraz uruchamia `OpenClaw Release Checks` dla install smoke, package acceptance, zestawów ścieżki wydania Dockera, live/E2E, OpenWebUI, parytetu QA Lab, Matrix i ścieżek Telegram. Może też uruchomić powydaniowy workflow `NPM Telegram Beta E2E`, gdy podano specyfikację opublikowanego pakietu.

`release_profile` kontroluje zakres live/provider przekazywany do kontroli wydania:

- `minimum` zachowuje najszybsze krytyczne dla wydania ścieżki OpenAI/core.
- `stable` dodaje stabilny zestaw provider/backend.
- `full` uruchamia szeroką macierz doradczą provider/media.

Nadrzędny workflow zapisuje identyfikatory uruchomionych workflow potomnych, a końcowe zadanie `Verify full validation` ponownie sprawdza bieżące wyniki workflow potomnych i dołącza tabele najwolniejszych zadań dla każdego uruchomienia potomnego. Jeśli workflow potomny zostanie ponownie uruchomiony i zakończy się powodzeniem, uruchom ponownie tylko zadanie weryfikatora nadrzędnego, aby odświeżyć wynik nadrzędny i podsumowanie czasu.

Do odzyskiwania zarówno `Full Release Validation`, jak i `OpenClaw Release Checks` akceptują `rerun_group`. Użyj `all` dla kandydata do wydania, `ci` tylko dla normalnego pełnego workflow potomnego CI, `release-checks` dla każdego potomnego zadania wydania albo węższej grupy: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` lub `npm-telegram` w workflow nadrzędnym. Dzięki temu ponowne uruchomienie nieudanego środowiska wydania pozostaje ograniczone po ukierunkowanej poprawce.

`OpenClaw Release Checks` używa zaufanego ref workflow, aby jednorazowo rozwiązać wybrany ref do tarballa `release-package-under-test`, a następnie przekazuje ten artefakt zarówno do workflow Dockera dla ścieżki wydania live/E2E, jak i do sharda package acceptance. Dzięki temu bajty pakietu pozostają spójne między środowiskami wydania i unika się ponownego pakowania tego samego kandydata w wielu zadaniach potomnych.

## Shardy live i E2E

Potomny workflow live/E2E wydania zachowuje szeroki natywny zakres `pnpm test:live`, ale uruchamia go jako nazwane shardy przez `scripts/test-live-shard.mjs` zamiast jednego zadania szeregowego:

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
- rozdzielone shardy mediów audio/wideo oraz shardy muzyki filtrowane według providera

Zachowuje to ten sam zakres plików, a jednocześnie ułatwia ponowne uruchamianie i diagnozowanie wolnych awarii providerów live. Zbiorcze nazwy shardów `native-live-extensions-o-z`, `native-live-extensions-media` i `native-live-extensions-media-music` pozostają prawidłowe dla ręcznych jednorazowych ponownych uruchomień.

Natywne shardy mediów live działają w `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, zbudowanym przez workflow `Live Media Runner Image`. Ten obraz wstępnie instaluje `ffmpeg` i `ffprobe`; zadania mediów przed konfiguracją tylko weryfikują binaria. Zachowaj pakiety testów live oparte na Dockerze na normalnych runnerach Blacksmith — zadania kontenerowe nie są właściwym miejscem do uruchamiania zagnieżdżonych testów Dockera.

Shardy modeli/backendów live oparte na Dockerze używają osobnego współdzielonego obrazu `ghcr.io/openclaw/openclaw-live-test:<sha>` dla wybranego commita. Workflow wydania live buduje i wypycha ten obraz raz, a następnie shardy modelu live Dockera, Gateway, backendu CLI, wiązania ACP i harnessa Codex działają z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Jeśli te shardy niezależnie przebudowują pełny docelowy obraz Dockera ze źródeł, uruchomienie wydania jest błędnie skonfigurowane i zmarnuje czas zegarowy na zduplikowane buildy obrazu.

## Package Acceptance

Użyj `Package Acceptance`, gdy pytanie brzmi: „czy ten instalowalny pakiet OpenClaw działa jako produkt?”. Różni się to od normalnego CI: normalne CI waliduje drzewo źródłowe, a package acceptance waliduje pojedynczy tarball przez ten sam harness Docker E2E, którego użytkownicy używają po instalacji lub aktualizacji.

### Zadania

1. `resolve_package` pobiera `workflow_ref`, rozwiązuje jednego kandydata pakietu, zapisuje `.artifacts/docker-e2e-package/openclaw-current.tgz`, zapisuje `.artifacts/docker-e2e-package/package-candidate.json`, przesyła oba jako artefakt `package-under-test` oraz wypisuje źródło, ref workflow, ref pakietu, wersję, SHA-256 i profil w podsumowaniu kroku GitHub.
2. `docker_acceptance` wywołuje `openclaw-live-and-e2e-checks-reusable.yml` z `ref=workflow_ref` i `package_artifact_name=package-under-test`. Workflow wielokrotnego użytku pobiera ten artefakt, waliduje inwentarz tarballa, przygotowuje obrazy Dockera z digestem pakietu, gdy są potrzebne, i uruchamia wybrane ścieżki Dockera względem tego pakietu zamiast pakować pobraną kopię workflow. Gdy profil wybiera wiele ukierunkowanych `docker_lanes`, workflow wielokrotnego użytku przygotowuje pakiet i współdzielone obrazy raz, a następnie rozdziela te ścieżki jako równoległe ukierunkowane zadania Dockera z unikalnymi artefaktami.
3. `package_telegram` opcjonalnie wywołuje `NPM Telegram Beta E2E`. Działa, gdy `telegram_mode` nie jest `none`, i instaluje ten sam artefakt `package-under-test`, gdy Package Acceptance rozwiązało pakiet; samodzielne uruchomienie Telegram nadal może instalować opublikowaną specyfikację npm.
4. `summary` kończy workflow niepowodzeniem, jeśli rozwiązywanie pakietu, Docker acceptance lub opcjonalna ścieżka Telegram zakończyły się niepowodzeniem.

### Źródła kandydatów

- `source=npm` akceptuje tylko `openclaw@beta`, `openclaw@latest` albo dokładną wersję wydania OpenClaw, taką jak `openclaw@2026.4.27-beta.2`. Używaj tego do akceptacji opublikowanych wersji beta/stabilnych.
- `source=ref` pakuje zaufaną gałąź, tag lub pełny SHA commita `package_ref`. Resolver pobiera gałęzie/tagi OpenClaw, weryfikuje, że wybrany commit jest osiągalny z historii gałęzi repozytorium lub tagu wydania, instaluje zależności w odłączonym worktree i pakuje go za pomocą `scripts/package-openclaw-for-docker.mjs`.
- `source=url` pobiera `.tgz` przez HTTPS; `package_sha256` jest wymagane.
- `source=artifact` pobiera jeden `.tgz` z `artifact_run_id` i `artifact_name`; `package_sha256` jest opcjonalne, ale powinno zostać podane dla artefaktów udostępnianych zewnętrznie.

Trzymaj `workflow_ref` i `package_ref` oddzielnie. `workflow_ref` to zaufany kod workflow/harness, który uruchamia test. `package_ref` to commit źródłowy, który zostaje spakowany, gdy `source=ref`. Dzięki temu bieżący harness testowy może walidować starsze zaufane commity źródłowe bez uruchamiania starej logiki workflow.

### Profile zestawów

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — pełne fragmenty ścieżki wydania Docker z OpenWebUI
- `custom` — dokładne `docker_lanes`; wymagane, gdy `suite_profile=custom`

Profil `package` używa offline pokrycia pluginów, aby walidacja opublikowanego pakietu nie była zależna od dostępności ClawHub na żywo. Opcjonalna ścieżka Telegram ponownie używa artefaktu `package-under-test` w `NPM Telegram Beta E2E`, przy czym opublikowana ścieżka specyfikacji npm pozostaje dostępna dla samodzielnych uruchomień.

Kontrole wydania wywołują Package Acceptance z `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` i `telegram_mode=mock-openai`. Fragmenty Docker ścieżki wydania obejmują nakładające się ścieżki pakietu/aktualizacji/pluginów; Package Acceptance zachowuje natywny dla artefaktu dowód zgodności dołączonego kanału, offline pluginów i Telegram względem tego samego rozwiązanego tarballa pakietu. Międzyplatformowe kontrole wydania nadal obejmują specyficzne dla systemów operacyjnych wdrożenie, instalator i zachowanie platformy; walidacja produktu w zakresie pakietu/aktualizacji powinna zaczynać się od Package Acceptance. Ścieżki świeżej instalacji pakietu i instalatora Windows weryfikują też, że zainstalowany pakiet może importować nadpisanie sterowania przeglądarką z surowej bezwzględnej ścieżki Windows. Międzyplatformowy smoke zwrotu agenta OpenAI domyślnie używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy jest ustawione, w przeciwnym razie `openai/gpt-5.4-mini`, dzięki czemu dowód instalacji i Gateway pozostaje szybki oraz deterministyczny.

### Okna zgodności ze starszymi wersjami

Package Acceptance ma ograniczone okna zgodności ze starszymi wersjami dla już opublikowanych pakietów. Pakiety do `2026.4.25` włącznie, w tym `2026.4.25-beta.*`, mogą używać ścieżki zgodności:

- znane prywatne wpisy QA w `dist/postinstall-inventory.json` mogą wskazywać na pliki pominięte w tarballu;
- `doctor-switch` może pominąć podprzypadek utrwalania `gateway install --wrapper`, gdy pakiet nie udostępnia tej flagi;
- `update-channel-switch` może przyciąć brakujące `pnpm.patchedDependencies` z fałszywej fixture git pochodzącej z tarballa i może logować brakujące utrwalone `update.channel`;
- smoki pluginów mogą odczytywać starsze lokalizacje rekordów instalacji albo akceptować brak utrwalania rekordu instalacji marketplace;
- `plugin-update` może zezwolić na migrację metadanych konfiguracji, nadal wymagając, aby rekord instalacji i zachowanie bez ponownej instalacji pozostały niezmienione.

Opublikowany pakiet `2026.4.26` może też ostrzegać o plikach znaczników metadanych lokalnej kompilacji, które zostały już wydane. Późniejsze pakiety muszą spełniać nowoczesne kontrakty; te same warunki kończą się niepowodzeniem zamiast ostrzeżeniem lub pominięciem.

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

Podczas debugowania nieudanego uruchomienia akceptacji pakietu zacznij od podsumowania `resolve_package`, aby potwierdzić źródło pakietu, wersję i SHA-256. Następnie sprawdź podrzędne uruchomienie `docker_acceptance` oraz jego artefakty Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logi ścieżek, czasy faz i polecenia ponownego uruchomienia. Preferuj ponowne uruchomienie nieudanego profilu pakietu lub dokładnych ścieżek Docker zamiast ponownego uruchamiania pełnej walidacji wydania.

## Smoke instalacji

Oddzielny workflow `Install Smoke` ponownie używa tego samego skryptu zakresu przez własne zadanie `preflight`. Dzieli pokrycie smoke na `run_fast_install_smoke` i `run_full_install_smoke`.

- **Szybka ścieżka** działa dla pull requestów dotykających powierzchni Docker/pakietu, zmian pakietu/manifestu dołączonego pluginu albo powierzchni rdzeniowego pluginu/kanału/Gateway/Plugin SDK, które wykonują zadania smoke Docker. Zmiany wyłącznie źródłowe w dołączonych pluginach, edycje wyłącznie testów i edycje wyłącznie dokumentacji nie rezerwują workerów Docker. Szybka ścieżka buduje obraz głównego Dockerfile raz, sprawdza CLI, uruchamia smoke CLI usuwania agentów ze współdzielonego workspace, uruchamia kontenerowe e2e gateway-network, weryfikuje argument kompilacji dołączonego rozszerzenia i uruchamia ograniczony profil Docker dołączonego pluginu w ramach 240-sekundowego łącznego limitu czasu polecenia (każde uruchomienie Docker scenariusza jest limitowane osobno).
- **Pełna ścieżka** utrzymuje instalację pakietu QR i pokrycie Docker instalatora/aktualizacji dla nocnych zaplanowanych uruchomień, ręcznych uruchomień, kontroli wydania workflow-call oraz pull requestów, które rzeczywiście dotykają powierzchni instalatora/pakietu/Docker. W trybie pełnym install-smoke przygotowuje lub ponownie używa jednego obrazu GHCR smoke głównego Dockerfile dla docelowego SHA, a następnie uruchamia instalację pakietu QR, smoki głównego Dockerfile/Gateway, smoki instalatora/aktualizacji oraz szybkie Docker E2E dołączonego pluginu jako oddzielne zadania, aby praca instalatora nie czekała za smokami obrazu głównego.

Push do `main` (w tym commity merge) nie wymuszają pełnej ścieżki; gdy logika zakresu zmian żądałaby pełnego pokrycia przy pushu, workflow zachowuje szybki smoke Docker i pozostawia pełny smoke instalacji walidacji nocnej lub wydania.

Wolny smoke dostawcy obrazu z globalną instalacją Bun jest bramkowany osobno przez `run_bun_global_install_smoke`. Działa w harmonogramie nocnym i z workflow kontroli wydania, a ręczne uruchomienia `Install Smoke` mogą go włączyć, ale pull requesty i pushe do `main` nie. Testy Docker QR i instalatora zachowują własne Dockerfile skoncentrowane na instalacji.

## Lokalne Docker E2E

`pnpm test:docker:all` wstępnie buduje jeden współdzielony obraz live-test, pakuje OpenClaw raz jako tarball npm i buduje dwa współdzielone obrazy `scripts/e2e/Dockerfile`:

- czysty runner Node/Git dla ścieżek instalatora/aktualizacji/zależności pluginów;
- obraz funkcjonalny, który instaluje ten sam tarball w `/app` dla zwykłych ścieżek funkcjonalności.

Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`, logika planisty w `scripts/lib/docker-e2e-plan.mjs`, a runner wykonuje tylko wybrany plan. Scheduler wybiera obraz dla każdej ścieżki za pomocą `OPENCLAW_DOCKER_E2E_BARE_IMAGE` i `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, a następnie uruchamia ścieżki z `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametry dostrajania

| Zmienna                                | Domyślnie | Cel                                                                                           |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10        | Liczba slotów głównej puli dla zwykłych ścieżek.                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10        | Liczba slotów puli końcowej wrażliwej na dostawców.                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9         | Limit równoczesnych ścieżek live, aby dostawcy nie ograniczali przepustowości.                 |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10        | Limit równoczesnych ścieżek instalacji npm.                                                    |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7         | Limit równoczesnych ścieżek wielousługowych.                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000      | Odstęp między startami ścieżek, aby uniknąć burz tworzenia przez demona Docker; ustaw `0`, aby wyłączyć odstęp. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000   | Zapasowy limit czasu na ścieżkę (120 minut); wybrane ścieżki live/końcowe używają ciaśniejszych limitów. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | nieustawione | `1` wypisuje plan schedulera bez uruchamiania ścieżek.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | nieustawione | Lista dokładnych ścieżek rozdzielona przecinkami; pomija smoke czyszczenia, aby agenci mogli odtworzyć jedną nieudaną ścieżkę. |

Ścieżka cięższa niż jej efektywny limit nadal może wystartować z pustej puli, a następnie działa sama, dopóki nie zwolni pojemności. Lokalny agregat wykonuje preflight Docker, usuwa przestarzałe kontenery OpenClaw E2E, emituje status aktywnych ścieżek, utrwala czasy ścieżek do porządkowania od najdłuższych i domyślnie zatrzymuje planowanie nowych ścieżek z puli po pierwszym niepowodzeniu.

### Wielokrotnego użytku workflow live/E2E

Wielokrotnego użytku workflow live/E2E pyta `scripts/test-docker-all.mjs --plan-json`, jaki pakiet, rodzaj obrazu, obraz live, ścieżka i pokrycie poświadczeń są wymagane. `scripts/docker-e2e.mjs` następnie konwertuje ten plan na wyjścia i podsumowania GitHub. Albo pakuje OpenClaw przez `scripts/package-openclaw-for-docker.mjs`, pobiera artefakt pakietu z bieżącego uruchomienia, albo pobiera artefakt pakietu z `package_artifact_run_id`; waliduje inwentarz tarballa; buduje i wypycha tagowane digestem pakietu obrazy GHCR Docker E2E bare/functional przez cache warstw Docker Blacksmith, gdy plan potrzebuje ścieżek z zainstalowanym pakietem; oraz ponownie używa podanych wejść `docker_e2e_bare_image`/`docker_e2e_functional_image` lub istniejących obrazów z digestem pakietu zamiast przebudowy. Pobierania obrazów Docker są ponawiane z ograniczonym 180-sekundowym limitem czasu na próbę, aby zablokowany strumień registry/cache był szybko ponawiany zamiast zużywać większość krytycznej ścieżki CI.

### Fragmenty ścieżki wydania

Pokrycie Docker wydania uruchamia mniejsze pofragmentowane zadania z `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby każdy fragment pobierał tylko potrzebny rodzaj obrazu i wykonywał wiele ścieżek przez ten sam ważony scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Bieżące części wydania Docker to `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, od `plugins-runtime-install-a` do `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` oraz `bundled-channels-contracts`. Zbiorcza część `bundled-channels` pozostaje dostępna do ręcznych, jednorazowych ponownych uruchomień, a `plugins-runtime-core`, `plugins-runtime` i `plugins-integrations` pozostają zbiorczymi aliasami plugin/runtime. Alias linii `install-e2e` pozostaje zbiorczym aliasem ręcznego ponownego uruchomienia dla obu linii instalatorów dostawców. Część `bundled-channels` uruchamia podzielone linie `bundled-channel-*` i `bundled-channel-update-*` zamiast szeregowej, całościowej linii `bundled-channel-deps`.

OpenWebUI jest włączany do `plugins-runtime-services`, gdy wymaga tego pełne pokrycie ścieżki wydania, i zachowuje samodzielną część `openwebui` tylko dla uruchomień dotyczących wyłącznie OpenWebUI. Linie aktualizacji kanałów w pakiecie ponawiają próbę raz w przypadku przejściowych awarii sieci npm.

Każda część przesyła `.artifacts/docker-tests/` z dziennikami linii, czasami, `summary.json`, `failures.json`, czasami faz, JSON planu harmonogramu, tabelami wolnych linii i poleceniami ponownego uruchomienia dla poszczególnych linii. Wejście workflow `docker_lanes` uruchamia wybrane linie względem przygotowanych obrazów zamiast zadań części, dzięki czemu debugowanie nieudanych linii jest ograniczone do jednego ukierunkowanego zadania Docker i przygotowuje, pobiera albo ponownie używa artefaktu pakietu dla tego uruchomienia; jeśli wybrana linia jest linią live Docker, ukierunkowane zadanie buduje lokalnie obraz testów live na potrzeby tego ponownego uruchomienia. Wygenerowane polecenia GitHub ponownego uruchomienia dla poszczególnych linii zawierają `package_artifact_run_id`, `package_artifact_name` i wejścia przygotowanych obrazów, gdy te wartości istnieją, dzięki czemu nieudana linia może ponownie użyć dokładnie tego pakietu i tych obrazów z nieudanego uruchomienia.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zaplanowany workflow live/E2E uruchamia codziennie pełny zestaw Docker dla ścieżki wydania.

## Wersja przedpremierowa Plugin

`Plugin Prerelease` zapewnia droższe pokrycie produktu/pakietu, więc jest osobnym workflow uruchamianym przez `Full Release Validation` albo przez jawnego operatora. Zwykłe pull requesty, wypchnięcia do `main` i samodzielne ręczne uruchomienia CI nie włączają tego zestawu. Równoważy testy Plugin w pakiecie między ośmioma workerami rozszerzeń; te zadania shardów rozszerzeń uruchamiają do dwóch grup konfiguracji Plugin naraz, z jednym workerem Vitest na grupę i większą stertą Node, aby partie Plugin intensywnie importujące moduły nie tworzyły dodatkowych zadań CI.

## QA Lab

QA Lab ma dedykowane linie CI poza głównym workflow o inteligentnym zakresie.

- Workflow `Parity gate` uruchamia się przy pasujących zmianach PR i ręcznym uruchomieniu; buduje prywatne środowisko uruchomieniowe QA i porównuje agentowe pakiety mock GPT-5.5 oraz Opus 4.6.
- Workflow `QA-Lab - All Lanes` uruchamia się co noc na `main` i przy ręcznym uruchomieniu; rozdziela bramkę parytetu mock, linię live Matrix oraz linie live Telegram i Discord jako zadania równoległe. Zadania live używają środowiska `qa-live-shared`, a Telegram/Discord używają dzierżaw Convex.

Kontrole wydania uruchamiają linie transportu live Matrix i Telegram z deterministycznym dostawcą mock oraz modelami kwalifikowanymi jako mock (`mock-openai/gpt-5.5` i `mock-openai/gpt-5.5-alt`), aby kontrakt kanału był odizolowany od opóźnień modelu live i normalnego uruchamiania Plugin dostawcy. Gateway transportu live wyłącza wyszukiwanie pamięci, ponieważ parytet QA obejmuje zachowanie pamięci osobno; łączność dostawcy jest obejmowana przez osobne zestawy modelu live, natywnego dostawcy i dostawcy Docker.

Matrix używa `--profile fast` dla zaplanowanych bramek i bramek wydania, dodając `--fail-fast` tylko wtedy, gdy sprawdzony CLI to obsługuje. Domyślna wartość CLI i ręczne wejście workflow pozostają `all`; ręczne uruchomienie `matrix_profile=all` zawsze dzieli pełne pokrycie Matrix na zadania `transport`, `media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`.

`OpenClaw Release Checks` uruchamia też krytyczne dla wydania linie QA Lab przed zatwierdzeniem wydania; jego bramka parytetu QA uruchamia pakiety kandydujące i bazowe jako równoległe zadania linii, a następnie pobiera oba artefakty do małego zadania raportującego na potrzeby końcowego porównania parytetu.

Nie umieszczaj ścieżki lądowania PR za `Parity gate`, chyba że zmiana rzeczywiście dotyka środowiska uruchomieniowego QA, parytetu pakietów modeli albo powierzchni, którą posiada workflow parytetu. W przypadku zwykłych poprawek kanałów, konfiguracji, dokumentacji albo testów jednostkowych traktuj to jako opcjonalny sygnał i kieruj się dowodami z CI/kontroli o odpowiednim zakresie.

## CodeQL

Workflow `CodeQL` jest celowo wąskim skanerem bezpieczeństwa pierwszego przebiegu, a nie pełnym przeglądem repozytorium. Codzienne, ręczne i ochronne uruchomienia pull requestów innych niż wersje robocze skanują kod workflow Actions oraz powierzchnie JavaScript/TypeScript o najwyższym ryzyku, używając zapytań bezpieczeństwa o wysokiej pewności filtrowanych do wysokiego/krytycznego `security-severity`.

Ochrona pull requestów pozostaje lekka: uruchamia się tylko dla zmian w `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` lub `src` i uruchamia tę samą macierz bezpieczeństwa o wysokiej pewności co zaplanowany workflow. Android i macOS CodeQL pozostają poza domyślnymi ustawieniami PR.

### Kategorie bezpieczeństwa

| Kategoria                                         | Powierzchnia                                                                                                                           |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Uwierzytelnianie, sekrety, piaskownica, cron i bazowy Gateway                                                                          |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrakty implementacji kanałów core oraz środowisko uruchomieniowe Plugin kanałów, Gateway, Plugin SDK, sekrety, punkty styku audytu  |
| `/codeql-security-high/network-ssrf-boundary`     | Powierzchnie core SSRF, parsowanie IP, straż sieciowa, web-fetch oraz polityka SSRF Plugin SDK                                         |
| `/codeql-security-high/mcp-process-tool-boundary` | Serwery MCP, pomocniki wykonywania procesów, dostarczanie wychodzące i bramki wykonywania narzędzi agentów                             |
| `/codeql-security-high/plugin-trust-boundary`     | Instalacja Plugin, loader, manifest, rejestr, staging zależności runtime, ładowanie źródeł i powierzchnie zaufania kontraktu pakietu Plugin SDK |

### Shardy bezpieczeństwa specyficzne dla platform

- `CodeQL Android Critical Security` — zaplanowany shard bezpieczeństwa Android. Buduje aplikację Android ręcznie dla CodeQL na najmniejszym runnerze Blacksmith Linux akceptowanym przez workflow sanity. Przesyła pod `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — tygodniowy/ręczny shard bezpieczeństwa macOS. Buduje aplikację macOS ręcznie dla CodeQL na Blacksmith macOS, filtruje wyniki budowania zależności z przesyłanego SARIF i przesyła pod `/codeql-critical-security/macos`. Trzymany poza codziennymi domyślnymi ustawieniami, ponieważ kompilacja macOS dominuje czas działania nawet wtedy, gdy jest czysta.

### Kategorie jakości krytycznej

`CodeQL Critical Quality` to odpowiadający shard niezwiązany z bezpieczeństwem. Uruchamia tylko zapytania jakości JavaScript/TypeScript o ważności błędu, niezwiązane z bezpieczeństwem, na wąskich powierzchniach o wysokiej wartości na mniejszym runnerze Blacksmith Linux. Jego ochrona pull requestów jest celowo mniejsza niż zaplanowany profil: PR-y inne niż wersje robocze uruchamiają tylko odpowiadające shardy `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` i `plugin-sdk-reply-runtime` dla zmian w kodzie wykonywania poleceń/modeli/narzędzi agenta i wysyłania odpowiedzi, kodzie schematów/migracji/IO konfiguracji, kodzie uwierzytelniania/sekretów/piaskownicy/bezpieczeństwa, core kanału i środowisku uruchomieniowym Plugin kanałów w pakiecie, protokole Gateway/metodach serwera, spoiwie runtime/SDK pamięci, MCP/procesie/dostarczaniu wychodzącym, runtime dostawcy/katalogu modeli, diagnostyce sesji/kolejkach dostarczania, loaderze Plugin, kontrakcie Plugin SDK/pakietu albo runtime odpowiedzi Plugin SDK. Zmiany konfiguracji CodeQL i workflow jakości uruchamiają wszystkie dwanaście shardów jakości PR.

Ręczne uruchomienie akceptuje:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Wąskie profile są punktami zaczepienia do nauki/iteracji, służącymi do uruchamiania jednego sharda jakości w izolacji.

| Kategoria                                               | Powierzchnia                                                                                                                                                                            |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Uwierzytelnianie, sekrety, piaskownica, Cron oraz kod granicy zabezpieczeń Gateway                                                                                                      |
| `/codeql-critical-quality/config-boundary`              | Schemat konfiguracji, migracja, normalizacja oraz kontrakty IO                                                                                                                          |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schematy protokołu Gateway oraz kontrakty metod serwera                                                                                                                                 |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrakty implementacji kanału rdzenia oraz dołączonego Plugin kanału                                                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`       | Wykonywanie poleceń, dyspozycja modeli/dostawców, dyspozycja i kolejki automatycznych odpowiedzi oraz kontrakty środowiska wykonawczego płaszczyzny sterowania ACP                     |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serwery MCP i mosty narzędzi, pomocniki nadzoru procesów oraz kontrakty dostarczania wychodzącego                                                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hosta pamięci, fasady środowiska wykonawczego pamięci, aliasy SDK Plugin pamięci, warstwa aktywacji środowiska wykonawczego pamięci oraz polecenia doctor pamięci                  |
| `/codeql-critical-quality/session-diagnostics-boundary` | Wewnętrzna logika kolejki odpowiedzi, kolejki dostarczania sesji, pomocniki wiązania/dostarczania sesji wychodzących, powierzchnie pakietów zdarzeń/logów diagnostycznych oraz kontrakty CLI doctor sesji |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dyspozycja odpowiedzi przychodzących SDK Plugin, pomocniki ładunku odpowiedzi/fragmentacji/środowiska wykonawczego, opcje odpowiedzi kanału, kolejki dostarczania oraz pomocniki wiązania sesji/wątku |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizacja katalogu modeli, uwierzytelnianie i odkrywanie dostawców, rejestracja środowiska wykonawczego dostawców, domyślne ustawienia/katalogi dostawców oraz rejestry web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap interfejsu sterowania, lokalna trwałość danych, przepływy sterowania Gateway oraz kontrakty środowiska wykonawczego płaszczyzny sterowania zadań                              |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrakty środowiska wykonawczego bazowego pobierania/wyszukiwania WWW, IO mediów, rozumienia mediów, generowania obrazów oraz generowania mediów                                       |
| `/codeql-critical-quality/plugin-boundary`              | Kontrakty punktów wejścia loadera, rejestru, powierzchni publicznej oraz SDK Plugin                                                                                                     |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Opublikowane źródło SDK Plugin po stronie pakietu oraz pomocniki kontraktu pakietu Plugin                                                                                               |

Jakość pozostaje oddzielona od bezpieczeństwa, aby ustalenia jakościowe można było planować, mierzyć, wyłączać lub rozszerzać bez zaciemniania sygnału bezpieczeństwa. Rozszerzenie CodeQL dla Swift, Python i dołączonych Plugin należy dodać ponownie jako zawężone lub podzielone na odłamki prace następcze dopiero wtedy, gdy wąskie profile będą miały stabilne środowisko wykonawcze i sygnał.

## Przepływy prac utrzymaniowych

### Docs Agent

Przepływ pracy `Docs Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex służąca utrzymywaniu istniejącej dokumentacji w zgodności z niedawno wylądowanymi zmianami. Nie ma czystego harmonogramu: może go wyzwolić udane uruchomienie CI po wypchnięciu przez użytkownika innego niż bot do `main`, a ręczne wywołanie może uruchomić go bezpośrednio. Wywołania przez workflow-run są pomijane, gdy `main` przesunął się dalej albo gdy w ostatniej godzinie utworzono inne niepominięte uruchomienie Docs Agent. Gdy działa, przegląda zakres commitów od poprzedniego niepominiętego źródłowego SHA Docs Agent do bieżącego `main`, więc jedno godzinowe uruchomienie może objąć wszystkie zmiany w main nagromadzone od ostatniego przejścia przez dokumentację.

### Test Performance Agent

Przepływ pracy `Test Performance Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex dla wolnych testów. Nie ma czystego harmonogramu: może go wyzwolić udane uruchomienie CI po wypchnięciu przez użytkownika innego niż bot do `main`, ale pomija się, jeśli tego dnia UTC inne wywołanie przez workflow-run już zostało uruchomione lub jest uruchomione. Ręczne wywołanie omija tę dzienną bramkę aktywności. Ścieżka buduje zgrupowany raport wydajności pełnego zestawu Vitest, pozwala Codex wprowadzać tylko niewielkie poprawki wydajności testów zachowujące pokrycie zamiast szerokich refaktoryzacji, następnie ponownie uruchamia raport pełnego zestawu i odrzuca zmiany, które zmniejszają bazową liczbę przechodzących testów. Jeśli baza ma testy kończące się niepowodzeniem, Codex może naprawiać tylko oczywiste awarie, a raport pełnego zestawu po agencie musi przejść, zanim cokolwiek zostanie zatwierdzone. Gdy `main` przesunie się przed wylądowaniem wypchnięcia bota, ścieżka wykonuje rebase zweryfikowanej poprawki, ponownie uruchamia `pnpm check:changed` i ponawia wypchnięcie; konfliktujące nieaktualne poprawki są pomijane. Używa Ubuntu hostowanego przez GitHub, aby akcja Codex mogła zachować tę samą bezpieczną postawę bez sudo co agent dokumentacji.

### Zduplikowane PR po scaleniu

Przepływ pracy `Duplicate PRs After Merge` to ręczny przepływ pracy maintainerów do sprzątania duplikatów po wylądowaniu. Domyślnie działa w trybie dry-run i zamyka tylko jawnie wymienione PR, gdy `apply=true`. Przed mutacją GitHub weryfikuje, że wylądowany PR jest scalony oraz że każdy duplikat ma albo wspólny wskazywany problem, albo nakładające się zmienione fragmenty.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokalne bramki sprawdzania i trasowanie zmian

Lokalna logika changed-lane znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka sprawdzania jest bardziej rygorystyczna wobec granic architektury niż szeroki zakres platformy CI:

- zmiany produkcyjne rdzenia uruchamiają typecheck produkcji rdzenia i testów rdzenia oraz lint/strażników rdzenia;
- zmiany wyłącznie w testach rdzenia uruchamiają tylko typecheck testów rdzenia oraz lint rdzenia;
- zmiany produkcyjne rozszerzeń uruchamiają typecheck produkcji rozszerzeń i testów rozszerzeń oraz lint rozszerzeń;
- zmiany wyłącznie w testach rozszerzeń uruchamiają typecheck testów rozszerzeń oraz lint rozszerzeń;
- zmiany publicznego SDK Plugin lub kontraktu Plugin rozszerzają się do typecheck rozszerzeń, ponieważ rozszerzenia zależą od tych kontraktów rdzenia (przemiatania rozszerzeń Vitest pozostają jawną pracą testową);
- zmiany wersji obejmujące wyłącznie metadane wydań uruchamiają ukierunkowane sprawdzenia wersji/konfiguracji/zależności katalogu głównego;
- nieznane zmiany katalogu głównego/konfiguracji dla bezpieczeństwa przechodzą do wszystkich ścieżek sprawdzania.

Lokalne trasowanie changed-test znajduje się w `scripts/test-projects.test-support.mjs` i jest celowo tańsze niż `check:changed`: bezpośrednie edycje testów uruchamiają same siebie, edycje źródeł preferują jawne mapowania, a potem testy siostrzane i zależności z grafu importów. Współdzielona konfiguracja dostarczania do pokoju grupowego jest jednym z jawnych mapowań: zmiany konfiguracji odpowiedzi widocznych dla grupy, trybu dostarczania odpowiedzi źródłowych lub systemowego promptu narzędzia wiadomości przechodzą przez bazowe testy odpowiedzi oraz regresje dostarczania Discord i Slack, aby zmiana współdzielonej wartości domyślnej zakończyła się niepowodzeniem przed pierwszym wypchnięciem PR. Używaj `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy zmiana jest na tyle szeroka dla harnessu, że tani zmapowany zestaw nie jest wiarygodnym przybliżeniem.

## Walidacja Testbox

Uruchamiaj Testbox z katalogu głównego repozytorium i preferuj świeżo rozgrzany box dla szerokiego dowodu. Przed poświęceniem wolnej bramki na box, który został użyty ponownie, wygasł lub właśnie zgłosił nieoczekiwanie dużą synchronizację, uruchom najpierw `pnpm testbox:sanity` wewnątrz boxa.

Sprawdzenie sanity szybko kończy się niepowodzeniem, gdy wymagane pliki katalogu głównego, takie jak `pnpm-lock.yaml`, zniknęły albo gdy `git status --short` pokazuje co najmniej 200 śledzonych usunięć. Zwykle oznacza to, że zdalny stan synchronizacji nie jest wiarygodną kopią PR; zatrzymaj ten box i rozgrzej świeży zamiast debugować awarię testu produktu. Dla celowych PR z dużymi usunięciami ustaw `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` dla tego uruchomienia sanity.

`pnpm testbox:run` kończy również lokalne wywołanie Blacksmith CLI, które pozostaje w fazie synchronizacji przez ponad pięć minut bez wyjścia po synchronizacji. Ustaw `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, aby wyłączyć tę osłonę, albo użyj większej wartości w milisekundach dla nietypowo dużych lokalnych różnic.

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Kanały deweloperskie](/pl/install/development-channels)
