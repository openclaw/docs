---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI zostało lub nie zostało uruchomione
    - Debugujesz nieudaną kontrolę GitHub Actions
    - Koordynujesz uruchomienie lub ponowne uruchomienie walidacji wydania
summary: Graf zadań CI, bramki zakresu, parasole wydań i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-04-30T18:39:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: a24afc27606ac7f4e9ead89acdd319bffa23336610f8a6cd8b576ea1a5b233dd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI uruchamia się przy każdym wypchnięciu do `main` i dla każdego pull requesta. Zadanie `preflight` klasyfikuje różnicę i wyłącza kosztowne ścieżki, gdy zmieniły się tylko niepowiązane obszary. Ręczne uruchomienia `workflow_dispatch` celowo omijają inteligentne zawężanie zakresu i rozgałęziają pełny graf dla kandydatów do wydania oraz szerokiej walidacji. Ścieżki Android pozostają opcjonalne przez `include_android`. Pokrycie Plugin tylko dla wydań znajduje się w osobnym workflow [`Wstępne wydanie Plugin`](#plugin-prerelease) i uruchamia się tylko z [`Pełnej walidacji wydania`](#full-release-validation) albo przez jawne ręczne wywołanie.

## Przegląd potoku

| Zadanie                          | Cel                                                                                          | Kiedy się uruchamia               |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Wykrywa zmiany tylko w dokumentacji, zmienione zakresy, zmienione rozszerzenia i buduje manifest CI | Zawsze przy wypchnięciach i PR-ach, które nie są szkicami |
| `security-scm-fast`              | Wykrywanie kluczy prywatnych i audyt workflow przez `zizmor`                                  | Zawsze przy wypchnięciach i PR-ach, które nie są szkicami |
| `security-dependency-audit`      | Audyt produkcyjnego lockfile bez zależności względem ostrzeżeń npm                            | Zawsze przy wypchnięciach i PR-ach, które nie są szkicami |
| `security-fast`                  | Wymagany agregat dla szybkich zadań bezpieczeństwa                                            | Zawsze przy wypchnięciach i PR-ach, które nie są szkicami |
| `check-dependencies`             | Produkcyjne przejście Knip tylko dla zależności oraz strażnik listy dozwolonych nieużywanych plików | Zmiany istotne dla Node           |
| `build-artifacts`                | Buduje `dist/`, Control UI, sprawdzenia zbudowanych artefaktów i artefakty wielokrotnego użytku dla zadań podrzędnych | Zmiany istotne dla Node           |
| `checks-fast-core`               | Szybkie linuksowe ścieżki poprawności, takie jak sprawdzenia bundled/plugin-contract/protocol | Zmiany istotne dla Node           |
| `checks-fast-contracts-channels` | Shardowane sprawdzenia kontraktów kanałów ze stabilnym zagregowanym wynikiem sprawdzenia      | Zmiany istotne dla Node           |
| `checks-node-core-test`          | Shardy testów rdzenia Node, z wyłączeniem ścieżek kanałów, bundled, kontraktów i rozszerzeń   | Zmiany istotne dla Node           |
| `check`                          | Shardowany odpowiednik głównej lokalnej bramki: typy produkcyjne, lint, strażniki, typy testów i rygorystyczny smoke | Zmiany istotne dla Node           |
| `check-additional`               | Shardy architektury, granic, strażników powierzchni rozszerzeń, granic pakietów i gateway-watch | Zmiany istotne dla Node           |
| `build-smoke`                    | Testy smoke zbudowanego CLI i smoke pamięci startowej                                        | Zmiany istotne dla Node           |
| `checks`                         | Weryfikator testów kanałów dla zbudowanych artefaktów                                        | Zmiany istotne dla Node           |
| `checks-node-compat-node22`      | Ścieżka budowania i smoke zgodności z Node 22                                                | Ręczne wywołanie CI dla wydań     |
| `check-docs`                     | Formatowanie dokumentacji, lint i sprawdzenia niedziałających linków                         | Zmieniono dokumentację            |
| `skills-python`                  | Ruff + pytest dla Skills opartych na Pythonie                                                | Zmiany istotne dla Python-skill   |
| `checks-windows`                 | Testy procesów/ścieżek specyficzne dla Windows oraz współdzielone regresje specyfikatorów importu runtime | Zmiany istotne dla Windows        |
| `macos-node`                     | Ścieżka testów TypeScript na macOS używająca współdzielonych zbudowanych artefaktów           | Zmiany istotne dla macOS          |
| `macos-swift`                    | Swift lint, budowanie i testy aplikacji macOS                                                | Zmiany istotne dla macOS          |
| `android`                        | Testy jednostkowe Android dla obu wariantów oraz jedna kompilacja debug APK                  | Zmiany istotne dla Android        |
| `test-performance-agent`         | Codzienna optymalizacja wolnych testów przez Codex po zaufanej aktywności                     | Sukces CI na main albo ręczne wywołanie |

## Kolejność szybkiego niepowodzenia

1. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki wewnątrz tego zadania, a nie samodzielne zadania.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` szybko kończą się niepowodzeniem bez czekania na cięższe zadania artefaktów i macierzy platform.
3. `build-artifacts` nakłada się z szybkimi ścieżkami Linuksa, aby konsumenci podrzędni mogli wystartować, gdy tylko współdzielone budowanie będzie gotowe.
4. Cięższe ścieżki platform i runtime rozgałęziają się później: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowsze wypchnięcie trafi do tego samego PR-a albo referencji `main`. Traktuj to jako szum CI, chyba że najnowsze uruchomienie dla tej samej referencji również kończy się niepowodzeniem. Zagregowane sprawdzenia shardów używają `!cancelled() && always()`, więc nadal zgłaszają normalne niepowodzenia shardów, ale nie kolejkowują się po tym, jak cały workflow został już zastąpiony. Automatyczny klucz współbieżności CI jest wersjonowany (`CI-v7-*`), aby zombie po stronie GitHub w starej grupie kolejki nie mogło bezterminowo blokować nowszych uruchomień main. Ręczne uruchomienia pełnego zestawu używają `CI-manual-v1-*` i nie anulują uruchomień w toku.

## Zakres i routowanie

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest objęta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`. Ręczne wywołanie pomija wykrywanie changed-scope i sprawia, że manifest preflight zachowuje się tak, jakby zmienił się każdy zakresowy obszar.

- **Edycje workflow CI** walidują graf CI Node oraz linting workflow, ale same nie wymuszają natywnych buildów Windows, Android ani macOS; te ścieżki platform pozostają zawężone do zmian w źródłach platform.
- **Edycje dotyczące tylko routowania CI, wybrane tanie edycje fixture testów rdzenia oraz wąskie edycje pomocnicze/routingu testów kontraktu Plugin** używają szybkiej ścieżki manifestu tylko dla Node: `preflight`, bezpieczeństwo i jedno zadanie `checks-fast-core`. Ta ścieżka pomija artefakty budowania, zgodność z Node 22, kontrakty kanałów, pełne shardy rdzenia, shardy bundled-plugin oraz dodatkowe macierze strażników, gdy zmiana jest ograniczona do powierzchni routingu lub pomocniczych, które szybkie zadanie ćwiczy bezpośrednio.
- **Sprawdzenia Node na Windows** są zawężone do specyficznych dla Windows wrapperów procesów/ścieżek, pomocników runnerów npm/pnpm/UI, konfiguracji menedżera pakietów oraz powierzchni workflow CI, które wykonują tę ścieżkę; niepowiązane zmiany źródeł, Plugin, install-smoke i tylko testów pozostają na linuksowych ścieżkach Node.

Najwolniejsze rodziny testów Node są dzielone lub balansowane tak, aby każde zadanie pozostało małe bez nadmiernego rezerwowania runnerów: kontrakty kanałów uruchamiają się jako trzy ważone shardy, małe ścieżki jednostkowe rdzenia są parowane, auto-reply działa jako czterech zbalansowanych workerów (z poddrzewem reply podzielonym na shardy agent-runner, dispatch oraz commands/state-routing), a agentowe konfiguracje Gateway/Plugin są rozłożone na istniejące agentowe zadania Node tylko ze źródeł zamiast czekać na zbudowane artefakty. Szerokie testy przeglądarkowe, QA, multimediów i różne testy Plugin używają dedykowanych konfiguracji Vitest zamiast współdzielonego catch-all dla Plugin. Shardy include-pattern zapisują wpisy czasów z użyciem nazwy sharda CI, więc `.artifacts/vitest-shard-timings.json` może odróżnić całą konfigurację od przefiltrowanego sharda. `check-additional` trzyma razem pracę kompilacji/canary dla granic pakietów i oddziela architekturę topologii runtime od pokrycia gateway watch; shard strażnika granic uruchamia swoje małe niezależne strażniki współbieżnie w jednym zadaniu. Gateway watch, testy kanałów i shard granic wsparcia rdzenia działają współbieżnie wewnątrz `build-artifacts` po tym, jak `dist/` i `dist-runtime/` są już zbudowane.

Android CI uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a następnie buduje Play debug APK. Wariant third-party nie ma osobnego zestawu źródeł ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje wariant z flagami BuildConfig SMS/call-log, unikając jednocześnie zduplikowanego zadania pakowania debug APK przy każdym wypchnięciu istotnym dla Android.

Shard `check-dependencies` uruchamia `pnpm deadcode:dependencies` (produkcyjne przejście Knip tylko dla zależności przypięte do najnowszej wersji Knip, z wyłączonym minimalnym wiekiem wydania pnpm dla instalacji `dlx`) oraz `pnpm deadcode:unused-files`, które porównuje produkcyjne znaleziska nieużywanych plików z Knip z `scripts/deadcode-unused-files.allowlist.mjs`. Strażnik nieużywanych plików kończy się niepowodzeniem, gdy PR dodaje nowy, niezweryfikowany nieużywany plik albo pozostawia nieaktualny wpis listy dozwolonych, zachowując jednocześnie intencjonalne dynamiczne powierzchnie Plugin, generowane, build, live-test i mosty pakietów, których Knip nie może rozwiązać statycznie.

## Ręczne wywołania

Ręczne wywołania CI uruchamiają ten sam graf zadań co normalne CI, ale wymuszają każdą zakresową ścieżkę poza Android: shardy Linux Node, shardy bundled-plugin, kontrakty kanałów, zgodność Node 22, `check`, `check-additional`, build smoke, sprawdzenia dokumentacji, Python skills, Windows, macOS i i18n Control UI. Samodzielne ręczne wywołania CI uruchamiają Android tylko z `include_android=true`; parasol pełnego wydania włącza Android, przekazując `include_android=true`. Statyczne sprawdzenia wstępnego wydania Plugin, shard tylko dla wydania `agentic-plugins`, pełny sweep batch rozszerzeń oraz ścieżki Docker wstępnego wydania Plugin są wykluczone z CI. Pakiet Docker wstępnego wydania uruchamia się tylko wtedy, gdy `Full Release Validation` wywołuje osobny workflow `Plugin Prerelease` z włączoną bramką release-validation.

Ręczne uruchomienia używają unikalnej grupy współbieżności, więc pełny zestaw dla kandydata do wydania nie jest anulowany przez inne wypchnięcie ani uruchomienie PR na tej samej referencji. Opcjonalne wejście `target_ref` pozwala zaufanemu wywołującemu uruchomić ten graf względem brancha, tagu albo pełnego SHA commita, używając pliku workflow z wybranej referencji wywołania.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runery

| Runner                           | Zadania                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, szybkie zadania i agregaty bezpieczeństwa (`security-scm-fast`, `security-dependency-audit`, `security-fast`), szybkie kontrole protokołu/kontraktu/wbudowanych elementów, shardowane kontrole kontraktu kanałów, shardy `check` z wyjątkiem lintingu, shardy i agregaty `check-additional`, weryfikatory agregatów testów Node, kontrole dokumentacji, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke także używa Ubuntu hostowanego przez GitHub, aby macierz Blacksmith mogła kolejkować się wcześniej |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lżejsze shardy rozszerzeń, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` oraz `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shardy testów Node dla Linuksa, shardy testów wbudowanych pluginów, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (wystarczająco wrażliwy na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało); kompilacje Docker install-smoke (czas kolejki 32 vCPU kosztował więcej, niż oszczędzał)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` w `openclaw/openclaw`; forki przechodzą awaryjnie na `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` w `openclaw/openclaw`; forki przechodzą awaryjnie na `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

`Full Release Validation` to ręczny nadrzędny workflow dla „uruchom wszystko przed wydaniem”. Przyjmuje gałąź, tag lub pełny SHA commita, uruchamia ręczny workflow `CI` z tym celem, uruchamia `Plugin Prerelease` dla dowodu dotyczącego wyłącznie wydania: pluginu/pakietu/statycznych zasobów/Docker, oraz uruchamia `OpenClaw Release Checks` dla smoke testów instalacji, akceptacji pakietu, zestawów ścieżki wydania Docker, live/E2E, OpenWebUI, zgodności QA Lab, Matrix i ścieżek Telegram. Może także uruchomić powydaniowy workflow `NPM Telegram Beta E2E`, gdy podano specyfikację opublikowanego pakietu.

`release_profile` steruje zakresem live/provider przekazywanym do kontroli wydania:

- `minimum` zachowuje najszybsze krytyczne dla wydania ścieżki OpenAI/rdzenia.
- `stable` dodaje stabilny zestaw provider/backend.
- `full` uruchamia szeroką macierz doradczą provider/media.

Workflow nadrzędny zapisuje identyfikatory uruchomionych workflow podrzędnych, a końcowe zadanie `Verify full validation` ponownie sprawdza bieżące konkluzje uruchomień podrzędnych i dołącza tabele najwolniejszych zadań dla każdego uruchomienia podrzędnego. Jeśli workflow podrzędny zostanie uruchomiony ponownie i zakończy się powodzeniem, uruchom ponownie tylko zadanie weryfikujące rodzica, aby odświeżyć wynik workflow nadrzędnego i podsumowanie czasów.

Do odzyskiwania zarówno `Full Release Validation`, jak i `OpenClaw Release Checks` przyjmują `rerun_group`. Użyj `all` dla kandydata do wydania, `ci` tylko dla zwykłego pełnego podrzędnego CI, `release-checks` dla każdego podrzędnego zadania wydania albo węższej grupy: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` lub `npm-telegram` w workflow nadrzędnym. Dzięki temu ponowne uruchomienie nieudanego zestawu wydania pozostaje ograniczone po ukierunkowanej poprawce.

`OpenClaw Release Checks` używa zaufanego odniesienia workflow, aby jednorazowo rozwiązać wybrane odniesienie do tarballa `release-package-under-test`, a następnie przekazuje ten artefakt zarówno do workflow Docker ścieżki wydania live/E2E, jak i do sharda akceptacji pakietu. To utrzymuje spójne bajty pakietu między zestawami wydania i unika ponownego pakowania tego samego kandydata w wielu zadaniach podrzędnych.

## Shardy live i E2E

Podrzędny workflow wydania live/E2E zachowuje szerokie natywne pokrycie `pnpm test:live`, ale uruchamia je jako nazwane shardy przez `scripts/test-live-shard.mjs` zamiast jednego zadania szeregowego:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- filtrowane według providera zadania `native-live-src-gateway-profiles`
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- podzielone shardy audio/wideo mediów oraz filtrowane według providera shardy muzyki

Dzięki temu zachowane jest to samo pokrycie plików, a powolne awarie providerów live są łatwiejsze do ponownego uruchomienia i diagnozowania. Nazwy agregatów shardów `native-live-extensions-o-z`, `native-live-extensions-media` i `native-live-extensions-media-music` pozostają prawidłowe dla ręcznych jednorazowych ponownych uruchomień.

Natywne shardy mediów live działają w `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, zbudowanym przez workflow `Live Media Runner Image`. Ten obraz wstępnie instaluje `ffmpeg` i `ffprobe`; zadania mediów tylko weryfikują pliki binarne przed konfiguracją. Utrzymuj zestawy live oparte na Docker na zwykłych runnerach Blacksmith — zadania kontenerowe są niewłaściwym miejscem do uruchamiania zagnieżdżonych testów Docker.

Shardy modeli/backendów live oparte na Docker używają oddzielnego współdzielonego obrazu `ghcr.io/openclaw/openclaw-live-test:<sha>` dla wybranego commita. Workflow wydania live buduje i wypycha ten obraz raz, a następnie shardy modelu live Docker, Gateway, backendu CLI, wiązania ACP i harnessa Codex działają z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Jeśli te shardy niezależnie przebudowują pełny cel źródłowy Docker, uruchomienie wydania jest błędnie skonfigurowane i zmarnuje czas zegarowy na duplikaty kompilacji obrazów.

## Akceptacja pakietu

Użyj `Package Acceptance`, gdy pytanie brzmi: „czy ten instalowalny pakiet OpenClaw działa jako produkt?”. Różni się to od zwykłego CI: zwykłe CI waliduje drzewo źródeł, podczas gdy akceptacja pakietu waliduje pojedynczy tarball przez ten sam harness Docker E2E, którego użytkownicy używają po instalacji lub aktualizacji.

### Zadania

1. `resolve_package` pobiera `workflow_ref`, rozwiązuje jednego kandydata pakietu, zapisuje `.artifacts/docker-e2e-package/openclaw-current.tgz`, zapisuje `.artifacts/docker-e2e-package/package-candidate.json`, przesyła oba jako artefakt `package-under-test` oraz wypisuje źródło, odniesienie workflow, odniesienie pakietu, wersję, SHA-256 i profil w podsumowaniu kroku GitHub.
2. `docker_acceptance` wywołuje `openclaw-live-and-e2e-checks-reusable.yml` z `ref=workflow_ref` i `package_artifact_name=package-under-test`. Workflow wielokrotnego użytku pobiera ten artefakt, waliduje inwentarz tarballa, przygotowuje obrazy Docker z digestem pakietu, gdy są potrzebne, i uruchamia wybrane ścieżki Docker względem tego pakietu zamiast pakować checkout workflow. Gdy profil wybiera wiele ukierunkowanych `docker_lanes`, workflow wielokrotnego użytku przygotowuje pakiet i współdzielone obrazy raz, a następnie rozdziela te ścieżki jako równoległe ukierunkowane zadania Docker z unikalnymi artefaktami.
3. `package_telegram` opcjonalnie wywołuje `NPM Telegram Beta E2E`. Działa, gdy `telegram_mode` nie jest `none`, i instaluje ten sam artefakt `package-under-test`, gdy Package Acceptance rozwiązało jeden; samodzielne uruchomienie Telegram nadal może zainstalować opublikowaną specyfikację npm.
4. `summary` powoduje niepowodzenie workflow, jeśli rozwiązanie pakietu, akceptacja Docker albo opcjonalna ścieżka Telegram zakończyły się niepowodzeniem.

### Źródła kandydatów

- `source=npm` akceptuje tylko `openclaw@beta`, `openclaw@latest` albo dokładną wersję wydania OpenClaw, taką jak `openclaw@2026.4.27-beta.2`. Używaj tego do akceptacji opublikowanych wersji beta/stabilnych.
- `source=ref` pakuje zaufaną gałąź, tag albo pełny SHA commita `package_ref`. Resolver pobiera gałęzie/tagi OpenClaw, sprawdza, czy wybrany commit jest osiągalny z historii gałęzi repozytorium albo z tagu wydania, instaluje zależności w odłączonym worktree i pakuje go za pomocą `scripts/package-openclaw-for-docker.mjs`.
- `source=url` pobiera HTTPS `.tgz`; `package_sha256` jest wymagane.
- `source=artifact` pobiera jeden `.tgz` z `artifact_run_id` i `artifact_name`; `package_sha256` jest opcjonalne, ale powinno być podane dla artefaktów udostępnianych zewnętrznie.

Trzymaj `workflow_ref` i `package_ref` oddzielnie. `workflow_ref` to zaufany kod workflow/harnessu, który uruchamia test. `package_ref` to commit źródłowy pakowany, gdy `source=ref`. Dzięki temu bieżący harness testowy może weryfikować starsze zaufane commity źródłowe bez uruchamiania starej logiki workflow.

### Profile zestawu

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — pełne fragmenty ścieżki wydania Docker z OpenWebUI
- `custom` — dokładne `docker_lanes`; wymagane, gdy `suite_profile=custom`

Profil `package` używa offline pokrycia pluginów, aby walidacja opublikowanego pakietu nie zależała od dostępności ClawHub na żywo. Opcjonalna ścieżka Telegram ponownie używa artefaktu `package-under-test` w `NPM Telegram Beta E2E`, z zachowaną ścieżką specyfikacji opublikowanego npm dla samodzielnych uruchomień.

Kontrole wydania wywołują Package Acceptance z `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` oraz `telegram_mode=mock-openai`. Fragmenty Docker ścieżki wydania pokrywają nakładające się ścieżki pakietu/aktualizacji/pluginów; Package Acceptance utrzymuje natywny dla artefaktu dowód zgodności bundled-channel, pluginów offline oraz Telegram względem tego samego rozwiązanego tarballa pakietu. Kontrole wydań między systemami operacyjnymi nadal obejmują specyficzne dla OS zachowanie onboardingu, instalatora i platformy; walidację produktu pakietu/aktualizacji należy zaczynać od Package Acceptance. Ścieżki świeżego pakietu i instalatora Windows sprawdzają także, czy zainstalowany pakiet może zaimportować nadpisanie browser-control z surowej bezwzględnej ścieżki Windows. Smoke między systemami operacyjnymi dla tury agenta OpenAI domyślnie używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy jest ustawione, w przeciwnym razie `openai/gpt-5.4-mini`, aby dowód instalacji i Gateway pozostał szybki oraz deterministyczny.

### Okna zgodności ze starszymi wersjami

Package Acceptance ma ograniczone okna zgodności ze starszymi wersjami dla już opublikowanych pakietów. Pakiety do `2026.4.25` włącznie, w tym `2026.4.25-beta.*`, mogą używać ścieżki zgodności:

- znane prywatne wpisy QA w `dist/postinstall-inventory.json` mogą wskazywać pliki pominięte w tarballu;
- `doctor-switch` może pominąć podprzypadek utrwalania `gateway install --wrapper`, gdy pakiet nie udostępnia tej flagi;
- `update-channel-switch` może przyciąć brakujące `pnpm.patchedDependencies` z fałszywego fixture git pochodzącego z tarballa i może logować brakujące utrwalone `update.channel`;
- smoke testy pluginów mogą czytać starsze lokalizacje rekordów instalacji albo akceptować brak utrwalenia rekordu instalacji z marketplace;
- `plugin-update` może zezwolić na migrację metadanych konfiguracji, nadal wymagając, aby rekord instalacji i zachowanie bez ponownej instalacji pozostały niezmienione.

Opublikowany pakiet `2026.4.26` może także ostrzegać o plikach stempli metadanych lokalnego builda, które zostały już dostarczone. Późniejsze pakiety muszą spełniać nowoczesne kontrakty; te same warunki powodują błąd zamiast ostrzeżenia albo pominięcia.

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

Podczas debugowania nieudanego uruchomienia akceptacji pakietu zacznij od podsumowania `resolve_package`, aby potwierdzić źródło pakietu, wersję i SHA-256. Następnie sprawdź uruchomienie potomne `docker_acceptance` i jego artefakty Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logi ścieżek, czasy faz i polecenia ponownego uruchomienia. Preferuj ponowne uruchomienie nieudanego profilu pakietu albo dokładnych ścieżek Docker zamiast ponownego uruchamiania pełnej walidacji wydania.

## Smoke instalacji

Oddzielny workflow `Install Smoke` ponownie używa tego samego skryptu zakresu przez własne zadanie `preflight`. Dzieli pokrycie smoke na `run_fast_install_smoke` i `run_full_install_smoke`.

- **Szybka ścieżka** uruchamia się dla pull requestów dotykających powierzchni Docker/pakietu, zmian pakietu/manifestu bundled pluginów albo powierzchni core plugin/channel/gateway/Plugin SDK, które wykonują zadania smoke Docker. Zmiany wyłącznie źródłowe w bundled pluginach, edycje tylko testów i edycje tylko dokumentacji nie rezerwują workerów Docker. Szybka ścieżka buduje obraz głównego Dockerfile raz, sprawdza CLI, uruchamia smoke CLI usuwania współdzielonego workspace agentów, uruchamia kontenerowy e2e gateway-network, weryfikuje argument builda bundled extension i uruchamia ograniczony profil Docker bundled-plugin w ramach 240-sekundowego łącznego limitu czasu polecenia (każde uruchomienie Docker scenariusza jest ograniczone osobno).
- **Pełna ścieżka** zachowuje instalację pakietu QR oraz pokrycie Docker instalatora/aktualizacji dla nocnych uruchomień harmonogramu, ręcznych uruchomień, kontroli wydań przez workflow-call i pull requestów, które faktycznie dotykają powierzchni instalatora/pakietu/Docker. W trybie pełnym install-smoke przygotowuje albo ponownie używa jednego obrazu smoke GHCR głównego Dockerfile dla docelowego SHA, a następnie uruchamia instalację pakietu QR, smoke testy głównego Dockerfile/Gateway, smoke testy instalatora/aktualizacji oraz szybkie Docker E2E bundled-plugin jako osobne zadania, aby praca instalatora nie czekała za smoke testami obrazu głównego.

Push’e do `main` (w tym commity merge) nie wymuszają pełnej ścieżki; gdy logika zakresu zmian zażądałaby pełnego pokrycia przy pushu, workflow zachowuje szybki smoke Docker i pozostawia pełny install smoke walidacji nocnej albo wydaniowej.

Wolny smoke globalnej instalacji Bun dla image-provider jest osobno bramkowany przez `run_bun_global_install_smoke`. Uruchamia się w nocnym harmonogramie i z workflow kontroli wydań, a ręczne uruchomienia `Install Smoke` mogą go włączyć, ale pull requesty i push’e do `main` nie. Testy Docker QR i instalatora zachowują własne instalacyjne Dockerfile.

## Lokalne Docker E2E

`pnpm test:docker:all` prebuduje jeden współdzielony obraz live-test, pakuje OpenClaw raz jako tarball npm i buduje dwa współdzielone obrazy `scripts/e2e/Dockerfile`:

- surowy runner Node/Git dla ścieżek instalatora/aktualizacji/zależności pluginów;
- funkcjonalny obraz, który instaluje ten sam tarball do `/app` dla normalnych ścieżek funkcjonalnych.

Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`, logika planera w `scripts/lib/docker-e2e-plan.mjs`, a runner wykonuje tylko wybrany plan. Scheduler wybiera obraz dla ścieżki za pomocą `OPENCLAW_DOCKER_E2E_BARE_IMAGE` i `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, a następnie uruchamia ścieżki z `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametry dostrajania

| Variable                               | Default | Purpose                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Liczba slotów puli głównej dla normalnych ścieżek.                                            |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Liczba slotów puli końcowej wrażliwej na dostawców.                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Limit równoczesnych ścieżek live, aby dostawcy nie throttlowali.                               |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Limit równoczesnych ścieżek instalacji npm.                                                    |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Limit równoczesnych ścieżek wielousługowych.                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Odstęp między startami ścieżek, aby uniknąć burz tworzenia w daemonie Docker; ustaw `0`, aby wyłączyć odstęp. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Zapasowy limit czasu na ścieżkę (120 minut); wybrane ścieżki live/tail używają ciaśniejszych limitów. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` wypisuje plan schedulera bez uruchamiania ścieżek.                                        |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Rozdzielona przecinkami dokładna lista ścieżek; pomija cleanup smoke, aby agenci mogli odtworzyć jedną nieudaną ścieżkę. |

Ścieżka cięższa niż jej efektywny limit może nadal wystartować z pustej puli, a następnie działa sama, dopóki nie zwolni pojemności. Lokalny agregat wykonuje preflight Docker, usuwa przestarzałe kontenery OpenClaw E2E, emituje status aktywnych ścieżek, utrwala czasy ścieżek dla kolejności od najdłuższych i domyślnie przestaje planować nowe ścieżki z puli po pierwszym błędzie.

### Wielokrotnego użytku workflow live/E2E

Wielokrotnego użytku workflow live/E2E pyta `scripts/test-docker-all.mjs --plan-json`, jaki pakiet, rodzaj obrazu, obraz live, ścieżka i pokrycie poświadczeń są wymagane. `scripts/docker-e2e.mjs` następnie konwertuje ten plan na wyjścia i podsumowania GitHub. Albo pakuje OpenClaw przez `scripts/package-openclaw-for-docker.mjs`, pobiera artefakt pakietu z bieżącego uruchomienia, albo pobiera artefakt pakietu z `package_artifact_run_id`; waliduje inventory tarballa; buduje i wypycha tagowane digestem pakietu obrazy bare/functional GHCR Docker E2E przez cache warstw Docker Blacksmith, gdy plan potrzebuje ścieżek z zainstalowanym pakietem; oraz ponownie używa podanych wejść `docker_e2e_bare_image`/`docker_e2e_functional_image` albo istniejących obrazów z digestem pakietu zamiast przebudowywać. Pobrania obrazów Docker są ponawiane z ograniczonym 180-sekundowym limitem czasu na próbę, aby zablokowany strumień registry/cache szybko ponowił próbę zamiast zużywać większość ścieżki krytycznej CI.

### Fragmenty ścieżki wydania

Pokrycie Docker wydania uruchamia mniejsze fragmentowane zadania z `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby każdy fragment pobierał tylko potrzebny rodzaj obrazu i wykonywał wiele ścieżek przez ten sam ważony scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Obecne fragmenty Docker wydania to `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, od `plugins-runtime-install-a` do `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` oraz `bundled-channels-contracts`. Zbiorczy fragment `bundled-channels` pozostaje dostępny do ręcznych, jednorazowych ponowień, a `plugins-runtime-core`, `plugins-runtime` i `plugins-integrations` pozostają zbiorczymi aliasami Plugin/runtime. Alias pasa `install-e2e` pozostaje zbiorczym aliasem ręcznego ponowienia dla obu pasów instalatora dostawców. Fragment `bundled-channels` uruchamia podzielone pasy `bundled-channel-*` i `bundled-channel-update-*` zamiast szeregowego pasa all-in-one `bundled-channel-deps`.

OpenWebUI jest włączany do `plugins-runtime-services`, gdy wymaga tego pełne pokrycie ścieżki wydania, i zachowuje samodzielny fragment `openwebui` tylko dla wywołań dotyczących wyłącznie OpenWebUI. Pasy aktualizacji kanałów wbudowanych ponawiają próbę raz w przypadku przejściowych awarii sieci npm.

Każdy fragment przesyła `.artifacts/docker-tests/` z logami pasów, czasami, `summary.json`, `failures.json`, czasami faz, JSON planu harmonogramu, tabelami wolnych pasów i poleceniami ponownego uruchomienia dla poszczególnych pasów. Wejście workflow `docker_lanes` uruchamia wybrane pasy względem przygotowanych obrazów zamiast zadań fragmentów, co ogranicza debugowanie pasa z błędem do jednego docelowego zadania Docker i przygotowuje, pobiera lub ponownie wykorzystuje artefakt pakietu dla tego uruchomienia; jeśli wybrany pas jest pasem live Docker, docelowe zadanie buduje lokalnie obraz live-test dla tego ponowienia. Wygenerowane polecenia GitHub do ponowienia dla poszczególnych pasów zawierają `package_artifact_run_id`, `package_artifact_name` i wejścia przygotowanych obrazów, gdy te wartości istnieją, dzięki czemu pas z błędem może ponownie użyć dokładnie tego pakietu i tych obrazów z nieudanego uruchomienia.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Zaplanowany workflow live/E2E codziennie uruchamia pełny zestaw Docker ścieżki wydania.

## Przedpremiera Plugin

`Plugin Prerelease` zapewnia droższe pokrycie produktu/pakietu, dlatego jest osobnym workflow wywoływanym przez `Full Release Validation` albo jawnie przez operatora. Zwykłe pull requesty, wypchnięcia do `main` i samodzielne ręczne wywołania CI nie uruchamiają tego zestawu. Równoważy testy wbudowanych Plugin między ośmioma workerami rozszerzeń; te zadania shardów rozszerzeń uruchamiają do dwóch grup konfiguracji Plugin naraz, z jednym workerem Vitest na grupę i większą stertą Node, aby partie Plugin intensywnie używające importów nie tworzyły dodatkowych zadań CI.

## QA Lab

QA Lab ma dedykowane pasy CI poza głównym workflow o inteligentnym zakresie.

- Workflow `Parity gate` uruchamia się przy pasujących zmianach PR i ręcznym wywołaniu; buduje prywatny runtime QA i porównuje mockowe pakiety agentowe GPT-5.5 oraz Opus 4.6.
- Workflow `QA-Lab - All Lanes` uruchamia się co noc na `main` i przy ręcznym wywołaniu; rozdziela mockową bramkę parzystości, live pas Matrix oraz live pasy Telegram i Discord jako równoległe zadania. Zadania live używają środowiska `qa-live-shared`, a Telegram/Discord używają dzierżaw Convex.

Kontrole wydania uruchamiają live pasy transportu Matrix i Telegram z deterministycznym mockowym dostawcą oraz modelami zakwalifikowanymi jako mock (`mock-openai/gpt-5.5` i `mock-openai/gpt-5.5-alt`), aby kontrakt kanału był odizolowany od opóźnień live modelu i normalnego uruchamiania provider-plugin. Live transport gateway wyłącza wyszukiwanie pamięci, ponieważ parzystość QA osobno obejmuje zachowanie pamięci; łączność dostawcy jest objęta osobnymi zestawami live model, native provider i Docker provider.

Matrix używa `--profile fast` dla zaplanowanych bramek i bramek wydania, dodając `--fail-fast` tylko wtedy, gdy obsługuje to sprawdzony CLI. Domyślna wartość CLI i ręczne wejście workflow pozostają `all`; ręczne wywołanie `matrix_profile=all` zawsze dzieli pełne pokrycie Matrix na zadania `transport`, `media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`.

`OpenClaw Release Checks` uruchamia również krytyczne dla wydania pasy QA Lab przed zatwierdzeniem wydania; jego bramka parzystości QA uruchamia pakiety kandydata i bazowe jako równoległe zadania pasów, a następnie pobiera oba artefakty do małego zadania raportu na potrzeby końcowego porównania parzystości.

Nie umieszczaj ścieżki lądowania PR za `Parity gate`, chyba że zmiana rzeczywiście dotyka runtime QA, parzystości pakietów modeli albo powierzchni należącej do workflow parzystości. W przypadku zwykłych poprawek kanałów, konfiguracji, dokumentacji lub testów jednostkowych traktuj to jako opcjonalny sygnał i korzystaj z dowodów z właściwego zakresu CI/kontroli.

## CodeQL

Workflow `CodeQL` jest celowo wąskim skanerem bezpieczeństwa pierwszego przejścia, a nie pełnym przeglądem repozytorium. Codzienne, ręczne oraz ochronne uruchomienia dla pull requestów innych niż szkic skanują kod workflow Actions oraz powierzchnie JavaScript/TypeScript najwyższego ryzyka za pomocą zapytań bezpieczeństwa o wysokiej pewności, filtrowanych do `security-severity` high/critical.

Ochrona pull requestów pozostaje lekka: uruchamia się tylko dla zmian pod `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` lub `src` i wykonuje tę samą macierz bezpieczeństwa o wysokiej pewności co zaplanowany workflow. Android i macOS CodeQL pozostają poza domyślnymi PR.

### Kategorie bezpieczeństwa

| Kategoria                                         | Powierzchnia                                                                                                                           |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, sekrety, sandbox, cron i bazowy gateway                                                                                          |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrakty implementacji kanałów core oraz runtime Plugin kanału, gateway, Plugin SDK, sekrety, punkty styku audytu                     |
| `/codeql-security-high/network-ssrf-boundary`     | Powierzchnie core SSRF, parsowania IP, ochrony sieci, web-fetch i polityki SSRF Plugin SDK                                             |
| `/codeql-security-high/mcp-process-tool-boundary` | Serwery MCP, helpery wykonywania procesów, dostarczanie wychodzące i bramki wykonywania narzędzi agenta                                |
| `/codeql-security-high/plugin-trust-boundary`     | Instalacja Plugin, loader, manifest, registry, etapowanie zależności runtime, ładowanie źródeł i powierzchnie zaufania kontraktu pakietu Plugin SDK |

### Shardy bezpieczeństwa specyficzne dla platform

- `CodeQL Android Critical Security` — zaplanowany shard bezpieczeństwa Android. Buduje aplikację Android ręcznie dla CodeQL na najmniejszym runnerze Blacksmith Linux akceptowanym przez workflow sanity. Przesyła pod `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — tygodniowy/ręczny shard bezpieczeństwa macOS. Buduje aplikację macOS ręcznie dla CodeQL na Blacksmith macOS, odfiltrowuje wyniki budowania zależności z przesyłanego SARIF i przesyła pod `/codeql-critical-security/macos`. Utrzymywany poza codziennymi domyślnymi uruchomieniami, ponieważ budowanie macOS dominuje czas wykonania nawet przy czystym stanie.

### Kategorie jakości krytycznej

`CodeQL Critical Quality` to odpowiadający shard niezwiązany z bezpieczeństwem. Uruchamia tylko zapytania jakości JavaScript/TypeScript o poziomie błędu i niezwiązane z bezpieczeństwem, na wąskich powierzchniach o wysokiej wartości, na mniejszym runnerze Blacksmith Linux. Jego ochrona pull requestów jest celowo mniejsza niż profil zaplanowany: PR inne niż szkic uruchamiają tylko pasujące shardy `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` i `plugin-sdk-reply-runtime` dla zmian w kodzie poleceń/modeli/wykonywania narzędzi agenta i dyspozycji odpowiedzi, kodzie schematu/migracji/IO konfiguracji, kodzie auth/sekretów/sandboxu/bezpieczeństwa, core channel i runtime wbudowanych channel plugin, gateway protocol/server-method, runtime pamięci/spoiwie SDK, MCP/procesie/dostarczaniu wychodzącym, runtime dostawcy/katalogu modeli, diagnostyce sesji/kolejkach dostarczania, loaderze Plugin, Plugin SDK/kontrakcie pakietu albo runtime odpowiedzi Plugin SDK. Zmiany konfiguracji CodeQL i workflow jakości uruchamiają wszystkie dwanaście shardów jakości PR.

Ręczne wywołanie akceptuje:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Wąskie profile są zaczepami szkoleniowymi/iteracyjnymi do uruchamiania jednego shardu jakości w izolacji.

| Kategoria                                               | Powierzchnia                                                                                                                                                           |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kod granicy bezpieczeństwa Auth, sekretów, piaskownicy, Cron i Gateway                                                                                                 |
| `/codeql-critical-quality/config-boundary`              | Schemat konfiguracji, migracja, normalizacja i kontrakty IO                                                                                                            |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schematy protokołu Gateway i kontrakty metod serwera                                                                                                                   |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrakty implementacji głównego kanału i dołączonego kanału Plugin                                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`       | Wykonywanie poleceń, dyspozycja modeli/dostawców, dyspozycja i kolejki automatycznych odpowiedzi oraz kontrakty środowiska wykonawczego płaszczyzny sterowania ACP    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serwery MCP i mosty narzędziowe, pomocniki nadzoru procesów oraz kontrakty dostarczania wychodzącego                                                                  |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hosta pamięci, fasady środowiska wykonawczego pamięci, aliasy SDK pamięci Plugin, kod wiążący aktywację środowiska wykonawczego pamięci oraz polecenia doctor pamięci |
| `/codeql-critical-quality/session-diagnostics-boundary` | Wewnętrzne elementy kolejki odpowiedzi, kolejki dostarczania sesji, pomocniki wiązania/dostarczania sesji wychodzących, powierzchnie pakietów zdarzeń/logów diagnostycznych oraz kontrakty CLI doctor sesji |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dyspozycja odpowiedzi przychodzących w SDK Plugin, pomocniki ładunków/kawałkowania/środowiska wykonawczego odpowiedzi, opcje odpowiedzi kanału, kolejki dostarczania oraz pomocniki wiązania sesji/wątków |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizacja katalogu modeli, uwierzytelnianie i wykrywanie dostawców, rejestracja środowiska wykonawczego dostawców, domyślne ustawienia/katalogi dostawców oraz rejestry web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Inicjalizacja Control UI, lokalna trwałość danych, przepływy sterowania Gateway oraz kontrakty środowiska wykonawczego płaszczyzny sterowania zadaniami                |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kontrakty środowiska wykonawczego głównego pobierania/wyszukiwania w sieci, IO multimediów, rozumienia multimediów, generowania obrazów i generowania multimediów      |
| `/codeql-critical-quality/plugin-boundary`              | Kontrakty loadera, rejestru, powierzchni publicznej i punktów wejścia SDK Plugin                                                                                       |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Opublikowane źródło SDK Plugin po stronie pakietu i pomocniki kontraktu pakietu Plugin                                                                                 |

Jakość pozostaje oddzielona od bezpieczeństwa, aby ustalenia jakościowe można było planować, mierzyć, wyłączać lub rozszerzać bez zaciemniania sygnału bezpieczeństwa. Rozszerzenie CodeQL dla Swift, Python i dołączonych Plugin powinno zostać ponownie dodane jako zakresowane lub shardowane prace następcze dopiero po ustabilizowaniu środowiska wykonawczego i sygnału w wąskich profilach.

## Przepływy utrzymania

### Agent dokumentacji

Workflow `Docs Agent` to sterowana zdarzeniami ścieżka utrzymania Codex, która utrzymuje istniejącą dokumentację w zgodności z niedawno wprowadzonymi zmianami. Nie ma czystego harmonogramu: udane uruchomienie CI dla wypchnięcia na `main` przez użytkownika innego niż bot może ją wyzwolić, a ręczne wywołanie może uruchomić ją bezpośrednio. Wywołania workflow-run są pomijane, gdy `main` przesunął się dalej albo gdy w ostatniej godzinie utworzono inne niepominięte uruchomienie Docs Agent. Gdy działa, przegląda zakres commitów od poprzedniego niepominiętego źródłowego SHA Docs Agent do bieżącego `main`, więc jedno godzinne uruchomienie może objąć wszystkie zmiany na main zgromadzone od ostatniego przebiegu dokumentacji.

### Agent wydajności testów

Workflow `Test Performance Agent` to sterowana zdarzeniami ścieżka utrzymania Codex dla wolnych testów. Nie ma czystego harmonogramu: udane uruchomienie CI dla wypchnięcia na `main` przez użytkownika innego niż bot może ją wyzwolić, ale jest pomijana, jeśli inne wywołanie workflow-run już działało lub działa danego dnia UTC. Ręczne wywołanie omija tę dzienną bramkę aktywności. Ścieżka buduje raport wydajności zgrupowanego pełnego zestawu Vitest, pozwala Codex wprowadzać tylko małe, zachowujące pokrycie poprawki wydajności testów zamiast szerokich refaktoryzacji, następnie ponownie uruchamia raport pełnego zestawu i odrzuca zmiany, które zmniejszają bazową liczbę przechodzących testów. Jeśli baza ma testy zakończone niepowodzeniem, Codex może naprawiać tylko oczywiste awarie, a raport pełnego zestawu po agencie musi przejść, zanim cokolwiek zostanie zatwierdzone. Gdy `main` posunie się naprzód, zanim wypchnięcie bota trafi do repozytorium, ścieżka wykonuje rebase zweryfikowanej poprawki, ponownie uruchamia `pnpm check:changed` i ponawia wypchnięcie; konfliktujące nieaktualne poprawki są pomijane. Używa GitHub-hosted Ubuntu, aby akcja Codex mogła zachować tę samą postawę bezpieczeństwa drop-sudo co agent dokumentacji.

### Zduplikowane PR po scaleniu

Workflow `Duplicate PRs After Merge` to ręczny workflow utrzymaniowy dla osób utrzymujących, służący do sprzątania duplikatów po wylądowaniu zmian. Domyślnie działa jako dry-run i zamyka tylko jawnie wymienione PR, gdy `apply=true`. Przed modyfikacją GitHub weryfikuje, że PR, który wylądował, został scalony oraz że każdy duplikat ma albo wspólne przywołane zgłoszenie, albo nakładające się zmienione hunki.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokalne bramki sprawdzania i routing zmian

Logika lokalnych ścieżek zmian znajduje się w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka sprawdzania jest surowsza wobec granic architektury niż szeroki zakres platformy CI:

- zmiany produkcyjne core uruchamiają typecheck produkcji core i testów core oraz lint/guardy core;
- zmiany wyłącznie w testach core uruchamiają tylko typecheck testów core oraz lint core;
- zmiany produkcyjne rozszerzeń uruchamiają typecheck produkcji rozszerzeń i testów rozszerzeń oraz lint rozszerzeń;
- zmiany wyłącznie w testach rozszerzeń uruchamiają typecheck testów rozszerzeń oraz lint rozszerzeń;
- publiczne zmiany SDK Plugin lub kontraktu Plugin rozszerzają zakres do typecheck rozszerzeń, ponieważ rozszerzenia zależą od tych kontraktów core (przebiegi rozszerzeń Vitest pozostają jawną pracą testową);
- wersjonowania obejmujące tylko metadane wydania uruchamiają ukierunkowane sprawdzenia wersji/konfiguracji/zależności root;
- nieznane zmiany root/konfiguracji przechodzą bezpiecznie na wszystkie ścieżki sprawdzania.

Lokalny routing zmienionych testów znajduje się w `scripts/test-projects.test-support.mjs` i celowo jest tańszy niż `check:changed`: bezpośrednie edycje testów uruchamiają same siebie, edycje źródeł preferują jawne mapowania, następnie testy siostrzane i zależności z grafu importów. Wspólna konfiguracja dostarczania group-room jest jednym z jawnych mapowań: zmiany w konfiguracji widocznych odpowiedzi grupowych, trybie dostarczania odpowiedzi źródłowych lub systemowym prompcie narzędzia wiadomości przechodzą przez główne testy odpowiedzi oraz regresje dostarczania Discord i Slack, aby wspólna zmiana domyślna zakończyła się niepowodzeniem przed pierwszym wypchnięciem PR. Używaj `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy zmiana jest na tyle szeroka dla całego harnessu, że tani zmapowany zestaw nie jest wiarygodnym przybliżeniem.

## Walidacja Testbox

Uruchamiaj Testbox z katalogu głównego repozytorium i preferuj świeżo rozgrzane pudełko do szerokiego dowodu. Przed przeznaczeniem wolnej bramki na pudełko, które zostało ponownie użyte, wygasło albo właśnie zgłosiło nieoczekiwanie dużą synchronizację, najpierw uruchom `pnpm testbox:sanity` wewnątrz pudełka.

Sprawdzenie sanity szybko kończy się niepowodzeniem, gdy wymagane pliki root, takie jak `pnpm-lock.yaml`, zniknęły albo gdy `git status --short` pokazuje co najmniej 200 śledzonych usunięć. Zwykle oznacza to, że zdalny stan synchronizacji nie jest wiarygodną kopią PR; zatrzymaj to pudełko i rozgrzej świeże zamiast debugować awarię testu produktu. Dla celowych PR z dużą liczbą usunięć ustaw `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` dla tego przebiegu sanity.

`pnpm testbox:run` kończy także lokalne wywołanie Blacksmith CLI, które pozostaje w fazie synchronizacji przez ponad pięć minut bez danych wyjściowych po synchronizacji. Ustaw `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, aby wyłączyć tę osłonę, albo użyj większej wartości w milisekundach dla wyjątkowo dużych lokalnych różnic.

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Kanały deweloperskie](/pl/install/development-channels)
