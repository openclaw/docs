---
read_when:
    - Musisz zrozumieć, dlaczego zadanie CI zostało lub nie zostało uruchomione
    - Diagnozujesz nieudane sprawdzenie GitHub Actions
    - Koordynujesz uruchomienie lub ponowienie walidacji wydania
summary: Graf zadań CI, bramki zakresu, parasole wydań i lokalne odpowiedniki poleceń
title: Potok CI
x-i18n:
    generated_at: "2026-05-01T09:56:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 679913539743f9495fffa010489ec95e05ce875751afa8a93bf8bf7045d6d9de
    source_path: ci.md
    workflow: 16
---

OpenClaw CI działa przy każdym wypchnięciu do `main` i każdym pull requeście. Zadanie `preflight` klasyfikuje różnicę i wyłącza kosztowne ścieżki, gdy zmieniły się tylko niepowiązane obszary. Ręczne uruchomienia `workflow_dispatch` celowo omijają inteligentne zawężanie zakresu i rozwijają pełny graf dla kandydatów do wydania oraz szerokiej walidacji. Ścieżki Androida pozostają opcjonalne przez `include_android`. Pokrycie Plugin tylko dla wydań znajduje się w osobnym przepływie pracy [`Wstępna wersja Plugin`](#plugin-prerelease) i działa wyłącznie z poziomu [`Pełnej walidacji wydania`](#full-release-validation) albo jawnego ręcznego dispatcha.

## Przegląd pipeline’u

| Zadanie                          | Cel                                                                                          | Kiedy działa                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Wykrywa zmiany tylko w dokumentacji, zmienione zakresy, zmienione rozszerzenia i buduje manifest CI | Zawsze przy wypchnięciach i PR-ach innych niż draft |
| `security-scm-fast`              | Wykrywanie kluczy prywatnych i audyt workflow przez `zizmor`                                  | Zawsze przy wypchnięciach i PR-ach innych niż draft |
| `security-dependency-audit`      | Audyt produkcyjnego lockfile’a bez instalowania zależności względem advisory npm              | Zawsze przy wypchnięciach i PR-ach innych niż draft |
| `security-fast`                  | Wymagany agregat dla szybkich zadań bezpieczeństwa                                           | Zawsze przy wypchnięciach i PR-ach innych niż draft |
| `check-dependencies`             | Produkcyjny przebieg Knip tylko dla zależności oraz strażnik listy dozwolonych nieużywanych plików | Zmiany istotne dla Node            |
| `build-artifacts`                | Buduje `dist/`, Control UI, kontrole zbudowanych artefaktów i artefakty wielokrotnego użycia dla dalszych zadań | Zmiany istotne dla Node            |
| `checks-fast-core`               | Szybkie linuksowe ścieżki poprawności, takie jak kontrole pakietów wbudowanych/kontraktu Plugin/protokołu | Zmiany istotne dla Node            |
| `checks-fast-contracts-channels` | Shardowane kontrole kontraktów kanałów ze stabilnym zagregowanym wynikiem kontroli            | Zmiany istotne dla Node            |
| `checks-node-core-test`          | Shardy testów rdzenia Node, z wyłączeniem ścieżek kanałów, pakietów wbudowanych, kontraktów i rozszerzeń | Zmiany istotne dla Node            |
| `check`                          | Shardowany odpowiednik głównej lokalnej bramki: typy produkcyjne, lint, strażnicy, typy testów i rygorystyczny smoke | Zmiany istotne dla Node            |
| `check-additional`               | Shardy architektury, granic, strażników powierzchni rozszerzeń, granic pakietów i obserwowania Gateway | Zmiany istotne dla Node            |
| `build-smoke`                    | Testy smoke zbudowanego CLI i smoke pamięci startowej                                        | Zmiany istotne dla Node            |
| `checks`                         | Weryfikator testów kanałów zbudowanych artefaktów                                             | Zmiany istotne dla Node            |
| `checks-node-compat-node22`      | Ścieżka budowania zgodności i smoke dla Node 22                                               | Ręczny dispatch CI dla wydań       |
| `check-docs`                     | Formatowanie dokumentacji, lint i kontrole uszkodzonych linków                               | Zmieniona dokumentacja             |
| `skills-python`                  | Ruff + pytest dla Skills opartych na Pythonie                                                | Zmiany istotne dla Skills w Pythonie |
| `checks-windows`                 | Testy procesów/ścieżek specyficzne dla Windows oraz współdzielone regresje specyfikatorów importu runtime | Zmiany istotne dla Windows         |
| `macos-node`                     | Ścieżka testów TypeScript na macOS z użyciem współdzielonych zbudowanych artefaktów           | Zmiany istotne dla macOS           |
| `macos-swift`                    | Swift lint, budowanie i testy dla aplikacji macOS                                             | Zmiany istotne dla macOS           |
| `android`                        | Testy jednostkowe Androida dla obu flavorów oraz jedno budowanie APK debug                    | Zmiany istotne dla Androida        |
| `test-performance-agent`         | Codzienna optymalizacja wolnych testów przez Codex po zaufanej aktywności                    | Sukces CI na main albo ręczny dispatch |

## Kolejność szybkiego przerywania

1. `preflight` decyduje, które ścieżki w ogóle istnieją. Logika `docs-scope` i `changed-scope` to kroki w tym zadaniu, a nie samodzielne zadania.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` i `skills-python` kończą się niepowodzeniem szybko, bez czekania na cięższe zadania macierzy artefaktów i platform.
3. `build-artifacts` nakłada się na szybkie ścieżki Linuksa, aby dalsi konsumenci mogli ruszyć, gdy tylko współdzielone budowanie będzie gotowe.
4. Cięższe ścieżki platform i runtime rozwijają się potem: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` i `android`.

GitHub może oznaczać zastąpione zadania jako `cancelled`, gdy nowsze wypchnięcie trafi do tego samego PR-a albo refa `main`. Traktuj to jako szum CI, chyba że najnowsze uruchomienie dla tego samego refa również kończy się niepowodzeniem. Zagregowane kontrole shardów używają `!cancelled() && always()`, więc nadal raportują zwykłe awarie shardów, ale nie ustawiają się w kolejce po tym, jak cały workflow został już zastąpiony. Automatyczny klucz współbieżności CI jest wersjonowany (`CI-v7-*`), aby zombie po stronie GitHuba w starej grupie kolejki nie mogło bezterminowo blokować nowszych uruchomień main. Ręczne uruchomienia pełnego zestawu używają `CI-manual-v1-*` i nie anulują trwających uruchomień.

## Zakres i routing

Logika zakresu znajduje się w `scripts/ci-changed-scope.mjs` i jest pokryta testami jednostkowymi w `src/scripts/ci-changed-scope.test.ts`. Ręczny dispatch pomija wykrywanie zmienionego zakresu i sprawia, że manifest preflight zachowuje się tak, jakby zmienił się każdy zakresowany obszar.

- **Edycje workflow CI** walidują graf CI Node oraz lint workflow, ale same nie wymuszają natywnych buildów Windows, Androida ani macOS; te ścieżki platform pozostają ograniczone do zmian w źródłach platform.
- **Edycje tylko routingu CI, wybrane tanie edycje fixture’ów testów rdzenia i wąskie edycje pomocników/routingu testów kontraktu Plugin** używają szybkiej ścieżki manifestu tylko dla Node: `preflight`, bezpieczeństwo i jedno zadanie `checks-fast-core`. Ta ścieżka pomija artefakty builda, zgodność Node 22, kontrakty kanałów, pełne shardy rdzenia, shardy wbudowanych Plugin i dodatkowe macierze strażników, gdy zmiana jest ograniczona do powierzchni routingu lub pomocników, które szybkie zadanie ćwiczy bezpośrednio.
- **Kontrole Node na Windows** są ograniczone do wrapperów procesów/ścieżek specyficznych dla Windows, pomocników runnerów npm/pnpm/UI, konfiguracji menedżera pakietów oraz powierzchni workflow CI, które wykonują tę ścieżkę; niepowiązane zmiany źródeł, Plugin, install-smoke i zmiany tylko w testach pozostają na linuksowych ścieżkach Node.

Najwolniejsze rodziny testów Node są dzielone lub równoważone tak, aby każde zadanie pozostawało małe bez nadmiernego rezerwowania runnerów: kontrakty kanałów działają jako trzy ważone shardy, małe ścieżki jednostkowe rdzenia są parowane, auto-reply działa jako cztery zrównoważone workery (z poddrzewem reply podzielonym na shardy agent-runner, dispatch oraz commands/state-routing), a konfiguracje agentic Gateway/Plugin są rozłożone po istniejących zadaniach agentic Node tylko ze źródeł zamiast czekać na zbudowane artefakty. Szerokie testy przeglądarkowe, QA, media i różne testy Plugin używają swoich dedykowanych konfiguracji Vitest zamiast współdzielonego ogólnego zestawu Plugin. Shardy wzorców uwzględniania zapisują wpisy czasów z użyciem nazwy shardu CI, więc `.artifacts/vitest-shard-timings.json` może odróżnić całą konfigurację od filtrowanego shardu. `check-additional` utrzymuje razem prace kompilacji/canary granic pakietów i oddziela architekturę topologii runtime od pokrycia obserwowania Gateway; shard strażnika granic uruchamia swoje małe niezależne strażniki współbieżnie w jednym zadaniu. Obserwowanie Gateway, testy kanałów i shard granic wsparcia rdzenia działają współbieżnie w `build-artifacts` po tym, jak `dist/` i `dist-runtime/` są już zbudowane.

Android CI uruchamia zarówno `testPlayDebugUnitTest`, jak i `testThirdPartyDebugUnitTest`, a następnie buduje debug APK Play. Flavor third-party nie ma osobnego zestawu źródeł ani manifestu; jego ścieżka testów jednostkowych nadal kompiluje flavor z flagami BuildConfig dla SMS/rejestru połączeń, unikając jednocześnie duplikowania zadania pakowania debug APK przy każdym wypchnięciu istotnym dla Androida.

Shard `check-dependencies` uruchamia `pnpm deadcode:dependencies` (produkcyjny przebieg Knip tylko dla zależności, przypięty do najnowszej wersji Knip, z wyłączonym minimalnym wiekiem wydania pnpm dla instalacji `dlx`) oraz `pnpm deadcode:unused-files`, które porównuje produkcyjne wyniki nieużywanych plików z Knip z `scripts/deadcode-unused-files.allowlist.mjs`. Strażnik nieużywanych plików kończy się niepowodzeniem, gdy PR dodaje nowy, nieprzejrzany nieużywany plik albo zostawia nieaktualny wpis na liście dozwolonych, zachowując jednocześnie celowe powierzchnie dynamicznych Plugin, wygenerowane, buildów, testów live i mostków pakietów, których Knip nie potrafi rozwiązać statycznie.

## Ręczne dispatche

Ręczne dispatche CI uruchamiają ten sam graf zadań co zwykłe CI, ale wymuszają wszystkie zakresowane ścieżki nieandroidowe: shardy Linux Node, shardy wbudowanych Plugin, kontrakty kanałów, zgodność Node 22, `check`, `check-additional`, build smoke, kontrole dokumentacji, Python skills, Windows, macOS i i18n Control UI. Samodzielne ręczne dispatche CI uruchamiają Androida tylko z `include_android=true`; pełny parasol wydania włącza Androida przez przekazanie `include_android=true`. Statyczne kontrole prerelease Plugin, shard tylko dla wydań `agentic-plugins`, pełny wsadowy sweep rozszerzeń i dockerowe ścieżki prerelease Plugin są wyłączone z CI. Zestaw dockerowy prerelease działa tylko wtedy, gdy `Pełna walidacja wydania` dispatchuje osobny workflow `Wstępna wersja Plugin` z włączoną bramką walidacji wydania.

Ręczne uruchomienia używają unikalnej grupy współbieżności, więc pełny zestaw kandydata do wydania nie jest anulowany przez kolejne wypchnięcie ani uruchomienie PR na tym samym refie. Opcjonalne wejście `target_ref` pozwala zaufanemu wywołującemu uruchomić ten graf względem gałęzi, taga albo pełnego SHA commita, używając pliku workflow z wybranego refa dispatcha.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runnery

| Runner                           | Zadania                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, szybkie zadania i agregaty bezpieczeństwa (`security-scm-fast`, `security-dependency-audit`, `security-fast`), szybkie kontrole protokołu/kontraktów/dołączonych elementów, podzielone kontrole kontraktów kanałów, fragmenty `check` z wyjątkiem lintu, fragmenty i agregaty `check-additional`, weryfikatory agregatów testów Node, kontrole dokumentacji, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight także używa Ubuntu hostowanego przez GitHub, aby macierz Blacksmith mogła wcześniej trafić do kolejki |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, lżejsze fragmenty Pluginów, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` oraz `check-test-types`                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragmenty testów Linux Node, fragmenty testów dołączonych Pluginów, `android`                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (na tyle wrażliwe na CPU, że 8 vCPU kosztowało więcej, niż oszczędzało); kompilacje Docker install-smoke (czas oczekiwania w kolejce 32-vCPU kosztował więcej, niż oszczędzał)                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` w `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` w `openclaw/openclaw`; forki wracają do `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                            |

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

`Full Release Validation` to ręczny nadrzędny workflow dla „uruchomienia wszystkiego przed wydaniem”. Przyjmuje gałąź, tag albo pełny SHA commita, uruchamia ręczny workflow `CI` z tym celem, uruchamia `Plugin Prerelease` dla dowodów dotyczących wyłącznie wydania: Pluginów, pakietów, statycznych zasobów i Docker, oraz uruchamia `OpenClaw Release Checks` dla install smoke, package acceptance, zestawów ścieżki wydania Docker, live/E2E, OpenWebUI, parytetu QA Lab, Matrix oraz ścieżek Telegram. Może także uruchomić powydaniowy workflow `NPM Telegram Beta E2E`, gdy podano opublikowaną specyfikację pakietu.

Zobacz [Pełna walidacja wydania](/pl/reference/full-release-validation), aby poznać
macierz etapów, dokładne nazwy zadań workflow, różnice między profilami, artefakty oraz
uchwyty do ukierunkowanych ponownych uruchomień.

`release_profile` steruje zakresem live/provider przekazywanym do kontroli wydania. Ręczne workflow wydania domyślnie używają `stable`; użyj `full` tylko wtedy, gdy celowo potrzebujesz szerokiej doradczej macierzy dostawców/mediów.

- `minimum` zachowuje najszybsze, krytyczne dla wydania ścieżki OpenAI/core.
- `stable` dodaje stabilny zestaw provider/backend.
- `full` uruchamia szeroką doradczą macierz dostawców/mediów.

Workflow nadrzędny zapisuje identyfikatory uruchomionych workflow podrzędnych, a końcowe zadanie `Verify full validation` ponownie sprawdza bieżące wyniki uruchomień podrzędnych i dopisuje tabele najwolniejszych zadań dla każdego uruchomienia podrzędnego. Jeśli workflow podrzędny zostanie uruchomiony ponownie i zakończy się powodzeniem, uruchom ponownie tylko zadanie weryfikatora nadrzędnego, aby odświeżyć wynik workflow nadrzędnego i podsumowanie czasów.

Do odzyskiwania zarówno `Full Release Validation`, jak i `OpenClaw Release Checks` przyjmują `rerun_group`. Użyj `all` dla kandydata do wydania, `ci` tylko dla zwykłego pełnego workflow podrzędnego CI, `plugin-prerelease` tylko dla podrzędnego prerelease Pluginu, `release-checks` dla każdego podrzędnego workflow wydania albo węższej grupy: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` lub `npm-telegram` w workflow nadrzędnym. Dzięki temu ponowne uruchomienie nieudanego środowiska wydania pozostaje ograniczone po ukierunkowanej poprawce.

`OpenClaw Release Checks` używa zaufanego odwołania workflow, aby raz rozwiązać wybrane odwołanie do tarballa `release-package-under-test`, a następnie przekazuje ten artefakt zarówno do workflow Docker ścieżki wydania live/E2E, jak i do fragmentu package acceptance. Dzięki temu bajty pakietu pozostają spójne między środowiskami wydania i unika się ponownego pakowania tego samego kandydata w wielu zadaniach podrzędnych.

Zduplikowane uruchomienia `Full Release Validation` dla `ref=main` i `rerun_group=all`
zastępują starszy workflow nadrzędny. Monitor nadrzędny anuluje każdy workflow podrzędny,
który już uruchomił, gdy workflow nadrzędny zostaje anulowany, więc nowsza walidacja main
nie czeka za przestarzałym dwugodzinnym uruchomieniem release-check. Walidacja gałęzi/tagu wydania
oraz ukierunkowane grupy ponownego uruchomienia zachowują `cancel-in-progress: false`.

## Fragmenty live i E2E

Podrzędny workflow wydania live/E2E zachowuje szerokie natywne pokrycie `pnpm test:live`, ale uruchamia je jako nazwane fragmenty przez `scripts/test-live-shard.mjs` zamiast jednego zadania szeregowego:

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
- podzielone fragmenty mediów audio/wideo oraz fragmenty muzyki filtrowane według providera

Zachowuje to to samo pokrycie plików, jednocześnie ułatwiając ponowne uruchamianie i diagnozowanie wolnych awarii providerów live. Nazwy zagregowanych fragmentów `native-live-extensions-o-z`, `native-live-extensions-media` i `native-live-extensions-media-music` pozostają poprawne dla ręcznych jednorazowych ponownych uruchomień.

Natywne fragmenty mediów live działają w `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, zbudowanym przez workflow `Live Media Runner Image`. Ten obraz wstępnie instaluje `ffmpeg` i `ffprobe`; zadania mediów przed konfiguracją tylko weryfikują binaria. Zachowaj zestawy live oparte na Docker na zwykłych runnerach Blacksmith — zadania kontenerowe nie są właściwym miejscem do uruchamiania zagnieżdżonych testów Docker.

Fragmenty modeli/backendów live oparte na Docker używają oddzielnego współdzielonego obrazu `ghcr.io/openclaw/openclaw-live-test:<sha>` dla wybranego commita. Workflow wydania live buduje i wypycha ten obraz raz, a następnie fragmenty modelu live Docker, Gateway podzielony według providerów, backend CLI, powiązanie ACP oraz harness Codex działają z `OPENCLAW_SKIP_DOCKER_BUILD=1`. Fragmenty Gateway Docker mają jawne limity `timeout` na poziomie skryptu poniżej limitu czasu zadania workflow, aby zablokowany kontener lub ścieżka sprzątania szybko zakończyły się niepowodzeniem zamiast zużywać cały budżet release-check. Jeśli te fragmenty niezależnie przebudowują pełny docelowy obraz Docker źródeł, uruchomienie wydania jest błędnie skonfigurowane i zmarnuje czas na zegarze na zduplikowane kompilacje obrazów.

## Package Acceptance

Użyj `Package Acceptance`, gdy pytanie brzmi: „czy ten instalowalny pakiet OpenClaw działa jako produkt?”. Różni się to od zwykłego CI: zwykłe CI waliduje drzewo źródeł, podczas gdy package acceptance waliduje pojedynczy tarball przez ten sam harness Docker E2E, którego użytkownicy używają po instalacji lub aktualizacji.

### Zadania

1. `resolve_package` pobiera `workflow_ref`, rozwiązuje jednego kandydata pakietu, zapisuje `.artifacts/docker-e2e-package/openclaw-current.tgz`, zapisuje `.artifacts/docker-e2e-package/package-candidate.json`, przesyła oba jako artefakt `package-under-test` oraz wypisuje źródło, ref workflow, ref pakietu, wersję, SHA-256 i profil w podsumowaniu kroku GitHub.
2. `docker_acceptance` wywołuje `openclaw-live-and-e2e-checks-reusable.yml` z `ref=workflow_ref` i `package_artifact_name=package-under-test`. Wielokrotnie używany workflow pobiera ten artefakt, weryfikuje inwentarz archiwum tar, przygotowuje obrazy Docker z digestem pakietu, gdy jest to potrzebne, i uruchamia wybrane ścieżki Docker względem tego pakietu zamiast pakować checkout workflow. Gdy profil wybiera wiele docelowych `docker_lanes`, wielokrotnie używany workflow przygotowuje pakiet i obrazy współdzielone raz, a następnie rozdziela te ścieżki jako równoległe docelowe zadania Docker z unikalnymi artefaktami.
3. `package_telegram` opcjonalnie wywołuje `NPM Telegram Beta E2E`. Uruchamia się, gdy `telegram_mode` nie jest `none`, i instaluje ten sam artefakt `package-under-test`, gdy Package Acceptance rozwiązał pakiet; samodzielne wywołanie Telegram nadal może instalować opublikowaną specyfikację npm.
4. `summary` kończy workflow niepowodzeniem, jeśli rozwiązanie pakietu, akceptacja Docker albo opcjonalna ścieżka Telegram zakończyły się niepowodzeniem.

### Źródła kandydatów

- `source=npm` akceptuje tylko `openclaw@beta`, `openclaw@latest` albo dokładną wersję wydania OpenClaw, taką jak `openclaw@2026.4.27-beta.2`. Użyj tego do akceptacji opublikowanej wersji beta/stabilnej.
- `source=ref` pakuje zaufaną gałąź, tag albo pełny SHA commita `package_ref`. Resolver pobiera gałęzie/tagi OpenClaw, weryfikuje, że wybrany commit jest osiągalny z historii gałęzi repozytorium albo tagu wydania, instaluje zależności w odłączonym worktree i pakuje go za pomocą `scripts/package-openclaw-for-docker.mjs`.
- `source=url` pobiera HTTPS `.tgz`; `package_sha256` jest wymagane.
- `source=artifact` pobiera jeden `.tgz` z `artifact_run_id` i `artifact_name`; `package_sha256` jest opcjonalne, ale powinno być podane dla artefaktów udostępnianych zewnętrznie.

Trzymaj `workflow_ref` i `package_ref` osobno. `workflow_ref` to zaufany kod workflow/harnessa, który uruchamia test. `package_ref` to commit źródłowy, który zostaje spakowany, gdy `source=ref`. Dzięki temu bieżący harness testowy może weryfikować starsze zaufane commity źródłowe bez uruchamiania starej logiki workflow.

### Profile zestawów

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — pełne fragmenty ścieżki wydania Docker z OpenWebUI
- `custom` — dokładne `docker_lanes`; wymagane, gdy `suite_profile=custom`

Profil `package` używa pokrycia Plugin w trybie offline, aby walidacja opublikowanego pakietu nie była uzależniona od dostępności ClawHub na żywo. Opcjonalna ścieżka Telegram ponownie używa artefaktu `package-under-test` w `NPM Telegram Beta E2E`, zachowując ścieżkę opublikowanej specyfikacji npm dla samodzielnych wywołań.

Kontrole wydania wywołują Package Acceptance z `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` i `telegram_mode=mock-openai`. Fragmenty Docker ścieżki wydania obejmują nakładające się ścieżki pakietu/aktualizacji/Plugin; Package Acceptance zachowuje natywny dla artefaktu dowód kompatybilności dołączonych kanałów, offline Plugin i Telegram względem tego samego rozwiązanego archiwum tar pakietu. Kontrole wydania Cross-OS nadal obejmują specyficzne dla systemu operacyjnego wdrażanie, instalator i zachowanie platformy; walidacja produktu pakietu/aktualizacji powinna zaczynać się od Package Acceptance. Ścieżka Docker `published-upgrade-survivor` waliduje jedną opublikowaną bazę pakietu na uruchomienie. W Package Acceptance rozwiązane archiwum tar `package-under-test` zawsze jest kandydatem, a `published_upgrade_survivor_baseline` wybiera zastępczą opublikowaną bazę, domyślnie `openclaw@latest`; polecenia ponownego uruchomienia nieudanej ścieżki zachowują tę bazę. Ustaw `published_upgrade_survivor_baselines=release-history`, aby rozszerzyć ścieżkę na zdeduplikowaną macierz historii: sześć najnowszych wydań stabilnych, `2026.4.23` oraz najnowsze wydanie stabilne sprzed `2026-03-15`. Ustaw `published_upgrade_survivor_scenarios=reported-issues`, aby rozszerzyć te same bazy na fixtures ukształtowane jak zgłoszenia dla konfiguracji/runtime-deps Feishu, zachowanych plików bootstrap/persona, ścieżek logów z tyldą i nieaktualnych katalogów głównych wersjonowanych runtime-deps. Lokalne uruchomienia agregujące mogą przekazywać dokładne specyfikacje pakietów przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, zachować pojedynczą ścieżkę przez `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, taką jak `openclaw@2026.4.15`, albo ustawić `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` dla macierzy scenariuszy. Opublikowana ścieżka konfiguruje bazę za pomocą wbudowanej receptury polecenia `openclaw config set`, zapisuje kroki receptury w `summary.json` i sonduje `/healthz`, `/readyz` oraz status RPC po uruchomieniu Gateway. Świeże ścieżki pakietu i instalatora Windows także weryfikują, że zainstalowany pakiet może zaimportować nadpisanie browser-control z surowej bezwzględnej ścieżki Windows. Smoke między systemami operacyjnymi dla tury agenta OpenAI domyślnie używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy jest ustawione, w przeciwnym razie `openai/gpt-5.4-mini`, dzięki czemu dowód instalacji i Gateway pozostaje szybki i deterministyczny.

### Okna zgodności ze starszymi wersjami

Package Acceptance ma ograniczone okna zgodności ze starszymi wersjami dla już opublikowanych pakietów. Pakiety do `2026.4.25` włącznie, w tym `2026.4.25-beta.*`, mogą używać ścieżki zgodności:

- znane prywatne wpisy QA w `dist/postinstall-inventory.json` mogą wskazywać pliki pominięte w archiwum tar;
- `doctor-switch` może pominąć podprzypadek utrwalania `gateway install --wrapper`, gdy pakiet nie udostępnia tej flagi;
- `update-channel-switch` może usuwać brakujące `pnpm.patchedDependencies` z fałszywego fixture git pochodzącego z archiwum tar i może logować brak utrwalonego `update.channel`;
- testy smoke Plugin mogą odczytywać starsze lokalizacje rekordów instalacji albo akceptować brak utrwalenia rekordu instalacji marketplace;
- `plugin-update` może dopuścić migrację metadanych konfiguracji, nadal wymagając, aby rekord instalacji i zachowanie bez ponownej instalacji pozostały niezmienione.

Opublikowany pakiet `2026.4.26` może także ostrzegać o plikach znaczników metadanych lokalnego buildu, które zostały już wysłane. Późniejsze pakiety muszą spełniać nowoczesne kontrakty; te same warunki powodują błąd zamiast ostrzeżenia albo pominięcia.

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

Podczas debugowania nieudanego uruchomienia akceptacji pakietu zacznij od podsumowania `resolve_package`, aby potwierdzić źródło pakietu, wersję i SHA-256. Następnie sprawdź uruchomienie podrzędne `docker_acceptance` i jego artefakty Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logi ścieżek, czasy faz i polecenia ponownego uruchomienia. Preferuj ponowne uruchomienie nieudanego profilu pakietu albo dokładnych ścieżek Docker zamiast ponownego uruchamiania pełnej walidacji wydania.

## Smoke instalacji

Osobny workflow `Install Smoke` ponownie używa tego samego skryptu zakresu przez własne zadanie `preflight`. Dzieli pokrycie smoke na `run_fast_install_smoke` i `run_full_install_smoke`.

- **Szybka ścieżka** działa dla pull requestów dotykających powierzchni Docker/pakietu, zmian pakietów/manifestów dołączonych Plugin albo powierzchni rdzeniowego Plugin/kanału/gateway/Plugin SDK, które ćwiczą zadania smoke Docker. Zmiany wyłącznie w źródłach dołączonych Plugin, edycje wyłącznie testów i edycje wyłącznie dokumentacji nie rezerwują workerów Docker. Szybka ścieżka buduje obraz głównego Dockerfile raz, sprawdza CLI, uruchamia smoke CLI usuwania agentów ze współdzielonego workspace, uruchamia kontenerowe e2e gateway-network, weryfikuje argument buildu dołączonego rozszerzenia i uruchamia ograniczony profil Docker dołączonego Plugin z 240-sekundowym łącznym limitem czasu polecenia (każde uruchomienie Docker scenariusza jest ograniczone osobno).
- **Pełna ścieżka** zachowuje instalację pakietu QR oraz pokrycie Docker/aktualizacji instalatora dla nocnych uruchomień według harmonogramu, wywołań ręcznych, kontroli wydania przez workflow-call i pull requestów, które faktycznie dotykają powierzchni instalatora/pakietu/Docker. W trybie pełnym install-smoke przygotowuje albo ponownie używa jednego obrazu smoke GHCR głównego Dockerfile dla docelowego SHA, a następnie uruchamia instalację pakietu QR, smoke głównego Dockerfile/Gateway, smoke instalatora/aktualizacji i szybkie Docker E2E dołączonego Plugin jako osobne zadania, aby praca instalatora nie czekała za smoke głównego obrazu.

Wypchnięcia do `main` (w tym commity scalające) nie wymuszają pełnej ścieżki; gdy logika zakresu zmian zażądałaby pełnego pokrycia przy pushu, workflow zachowuje szybki smoke Docker i zostawia pełny smoke instalacji walidacji nocnej albo wydania.

Wolny smoke dostawcy obrazu dla globalnej instalacji Bun jest osobno bramkowany przez `run_bun_global_install_smoke`. Uruchamia się w nocnym harmonogramie i z workflow kontroli wydania, a ręczne wywołania `Install Smoke` mogą go włączyć, ale pull requesty i wypchnięcia do `main` tego nie robią. Testy Docker QR i instalatora zachowują własne Dockerfile skupione na instalacji.

## Lokalne Docker E2E

`pnpm test:docker:all` buduje z wyprzedzeniem jeden współdzielony obraz live-test, pakuje OpenClaw raz jako archiwum tar npm i buduje dwa współdzielone obrazy `scripts/e2e/Dockerfile`:

- czysty runner Node/Git dla ścieżek instalatora/aktualizacji/zależności Plugin;
- funkcjonalny obraz, który instaluje to samo archiwum tar w `/app` dla normalnych ścieżek funkcjonalności.

Definicje ścieżek Docker znajdują się w `scripts/lib/docker-e2e-scenarios.mjs`, logika planera znajduje się w `scripts/lib/docker-e2e-plan.mjs`, a runner wykonuje tylko wybrany plan. Scheduler wybiera obraz dla każdej ścieżki za pomocą `OPENCLAW_DOCKER_E2E_BARE_IMAGE` i `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, a następnie uruchamia ścieżki z `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parametry do dostrojenia

| Zmienna                                | Domyślna | Cel                                                                                               |
| -------------------------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Liczba slotów głównej puli dla zwykłych ścieżek.                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Liczba slotów puli końcowej wrażliwej na dostawców.                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Limit współbieżnych ścieżek live, aby dostawcy nie ograniczali przepustowości.                    |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Limit współbieżnych ścieżek instalacji npm.                                                       |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Limit współbieżnych ścieżek z wieloma usługami.                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Odstęp między startami ścieżek, aby uniknąć burz tworzenia w demonie Docker; ustaw `0`, aby go wyłączyć. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Awaryjny limit czasu dla każdej ścieżki (120 minut); wybrane ścieżki live/końcowe używają ciaśniejszych limitów. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset    | `1` wypisuje plan harmonogramu bez uruchamiania ścieżek.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset    | Dokładna lista ścieżek rozdzielona przecinkami; pomija smoke cleanup, aby agenci mogli odtworzyć jedną nieudaną ścieżkę. |

Ścieżka cięższa niż jej efektywny limit nadal może wystartować z pustej puli, a następnie działa sama, dopóki nie zwolni pojemności. Lokalny agregat wstępnie sprawdza Docker, usuwa przestarzałe kontenery OpenClaw E2E, emituje status aktywnej ścieżki, utrwala czasy ścieżek na potrzeby kolejności od najdłuższych oraz domyślnie zatrzymuje planowanie nowych ścieżek z puli po pierwszym niepowodzeniu.

### Wielokrotnego użytku workflow live/E2E

Wielokrotnego użytku workflow live/E2E pyta `scripts/test-docker-all.mjs --plan-json`, jaki pakiet, rodzaj obrazu, obraz live, ścieżka i pokrycie poświadczeń są wymagane. `scripts/docker-e2e.mjs` następnie konwertuje ten plan na wyjścia i podsumowania GitHub. Albo pakuje OpenClaw przez `scripts/package-openclaw-for-docker.mjs`, pobiera artefakt pakietu z bieżącego przebiegu albo pobiera artefakt pakietu z `package_artifact_run_id`; weryfikuje inwentarz archiwum tar; buduje i wypycha oznaczone skrótem pakietu obrazy bare/functional GHCR Docker E2E przez cache warstw Docker Blacksmith, gdy plan wymaga ścieżek z zainstalowanym pakietem; oraz ponownie używa podanych wejść `docker_e2e_bare_image`/`docker_e2e_functional_image` albo istniejących obrazów ze skrótem pakietu zamiast przebudowywać. Pobieranie obrazów Docker jest ponawiane z ograniczonym limitem 180 sekund na próbę, aby zablokowany strumień rejestru/cache szybko ponowił próbę zamiast zużywać większość krytycznej ścieżki CI.

### Fragmenty ścieżki wydania

Pokrycie Docker dla wydania uruchamia mniejsze zadania podzielone na fragmenty z `OPENCLAW_SKIP_DOCKER_BUILD=1`, więc każdy fragment pobiera tylko ten rodzaj obrazu, którego potrzebuje, i wykonuje wiele ścieżek przez ten sam ważony harmonogram:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Obecne fragmenty Docker dla wydania to `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` do `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` i `bundled-channels-contracts`. Agregujący fragment `bundled-channels` pozostaje dostępny do ręcznych jednorazowych ponownych uruchomień, a `plugins-runtime-core`, `plugins-runtime` i `plugins-integrations` pozostają agregującymi aliasami plugin/runtime. Alias ścieżki `install-e2e` pozostaje agregującym aliasem ręcznego ponownego uruchomienia dla obu ścieżek instalatora dostawców. Fragment `bundled-channels` uruchamia podzielone ścieżki `bundled-channel-*` i `bundled-channel-update-*` zamiast sekwencyjnej, wszystko-w-jednym ścieżki `bundled-channel-deps`.

OpenWebUI jest składany do `plugins-runtime-services`, gdy wymaga tego pełne pokrycie ścieżki wydania, i zachowuje samodzielny fragment `openwebui` tylko dla wywołań dotyczących wyłącznie OpenWebUI. Ścieżki aktualizacji kanałów wbudowanych ponawiają raz próbę w przypadku przejściowych awarii sieci npm.

Każdy fragment przesyła `.artifacts/docker-tests/` z logami ścieżek, czasami, `summary.json`, `failures.json`, czasami faz, JSON planu harmonogramu, tabelami wolnych ścieżek oraz poleceniami ponownego uruchomienia dla każdej ścieżki. Wejście workflow `docker_lanes` uruchamia wybrane ścieżki względem przygotowanych obrazów zamiast zadań fragmentów, co ogranicza debugowanie nieudanej ścieżki do jednego docelowego zadania Docker oraz przygotowuje, pobiera lub ponownie używa artefaktu pakietu dla tego przebiegu; jeśli wybrana ścieżka jest ścieżką live Docker, docelowe zadanie buduje lokalnie obraz testu live dla tego ponownego uruchomienia. Wygenerowane polecenia GitHub do ponownego uruchomienia dla każdej ścieżki zawierają `package_artifact_run_id`, `package_artifact_name` oraz wejścia przygotowanych obrazów, gdy te wartości istnieją, dzięki czemu nieudana ścieżka może ponownie użyć dokładnie tego pakietu i obrazów z nieudanego przebiegu.

```bash
pnpm test:docker:rerun <run-id>      # pobierz artefakty Docker i wypisz połączone/docelowe polecenia ponownego uruchomienia dla ścieżek
pnpm test:docker:timings <summary>   # podsumowania wolnych ścieżek i krytycznej ścieżki faz
```

Zaplanowany workflow live/E2E uruchamia codziennie pełny zestaw Docker ścieżki wydania.

## Przedpremierowa wersja Plugin

`Plugin Prerelease` to droższe pokrycie produktu/pakietu, więc jest osobnym workflow uruchamianym przez `Full Release Validation` albo przez jawnego operatora. Zwykłe pull requesty, wypchnięcia do `main` i samodzielne ręczne uruchomienia CI utrzymują ten zestaw wyłączony. Równoważy testy wbudowanych pluginów między ośmiu pracowników rozszerzeń; te zadania shardów rozszerzeń uruchamiają do dwóch grup konfiguracji pluginów naraz, z jednym pracownikiem Vitest na grupę i większą stertą Node, aby partie pluginów ciężkie pod względem importów nie tworzyły dodatkowych zadań CI. Ścieżka przedpremierowa Docker tylko dla wydań grupuje docelowe ścieżki Docker w małe grupy, aby uniknąć rezerwowania dziesiątek runnerów dla zadań trwających od jednej do trzech minut.

## QA Lab

QA Lab ma dedykowane ścieżki CI poza głównym workflow z inteligentnym zakresem.

- Workflow `Parity gate` działa przy pasujących zmianach PR i ręcznym uruchomieniu; buduje prywatne środowisko uruchomieniowe QA i porównuje agentowe pakiety mock GPT-5.5 oraz Opus 4.6.
- Workflow `QA-Lab - All Lanes` działa co noc na `main` i przy ręcznym uruchomieniu; rozdziela mock parity gate, ścieżkę live Matrix oraz ścieżki live Telegram i Discord jako równoległe zadania. Zadania live używają środowiska `qa-live-shared`, a Telegram/Discord używają dzierżaw Convex.

Kontrole wydania uruchamiają ścieżki live transportu Matrix i Telegram z deterministycznym dostawcą mock oraz modelami kwalifikowanymi jako mock (`mock-openai/gpt-5.5` i `mock-openai/gpt-5.5-alt`), dzięki czemu kontrakt kanału jest odizolowany od opóźnień modeli live i normalnego startu provider-plugin. Gateway transportu live wyłącza wyszukiwanie w pamięci, ponieważ parytet QA pokrywa zachowanie pamięci osobno; łączność dostawców jest pokryta przez osobne zestawy modeli live, natywnych dostawców i dostawców Docker.

Matrix używa `--profile fast` dla zaplanowanych bramek i bramek wydania, dodając `--fail-fast` tylko wtedy, gdy wyewidencjonowane CLI to obsługuje. Domyślne CLI i ręczne wejście workflow pozostają `all`; ręczne uruchomienie `matrix_profile=all` zawsze dzieli pełne pokrycie Matrix na zadania `transport`, `media`, `e2ee-smoke`, `e2ee-deep` i `e2ee-cli`.

`OpenClaw Release Checks` uruchamia także krytyczne dla wydania ścieżki QA Lab przed zatwierdzeniem wydania; jego bramka parytetu QA uruchamia pakiety kandydata i bazowe jako równoległe zadania ścieżek, a następnie pobiera oba artefakty do małego zadania raportu na potrzeby końcowego porównania parytetu.

Nie umieszczaj ścieżki lądowania PR za `Parity gate`, chyba że zmiana faktycznie dotyka środowiska uruchomieniowego QA, parytetu pakietów modeli albo powierzchni, której właścicielem jest workflow parytetu. Dla zwykłych poprawek kanału, konfiguracji, dokumentacji lub testów jednostkowych traktuj to jako opcjonalny sygnał i korzystaj zamiast tego z dowodów z CI/kontroli o odpowiednim zakresie.

## CodeQL

Workflow `CodeQL` jest celowo wąskim skanerem bezpieczeństwa pierwszego przebiegu, a nie pełnym przeglądem repozytorium. Codzienne, ręczne i niebędące szkicami uruchomienia strażnika pull requestów skanują kod workflow Actions oraz powierzchnie JavaScript/TypeScript o najwyższym ryzyku za pomocą zapytań bezpieczeństwa o wysokiej pewności, filtrowanych do wysokiego/krytycznego `security-severity`.

Strażnik pull requestów pozostaje lekki: startuje tylko dla zmian w `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` lub `src` i uruchamia tę samą macierz bezpieczeństwa o wysokiej pewności co zaplanowany workflow. Android i macOS CodeQL pozostają poza domyślnymi ustawieniami PR.

### Kategorie bezpieczeństwa

| Kategoria                                         | Powierzchnia                                                                                                                           |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Uwierzytelnianie, sekrety, sandbox, cron i bazowy gateway                                                                              |
| `/codeql-security-high/channel-runtime-boundary`  | Kontrakty implementacji kanału core oraz środowisko uruchomieniowe Plugin kanału, Gateway, Plugin SDK, sekrety, punkty styku audytu   |
| `/codeql-security-high/network-ssrf-boundary`     | Powierzchnie core SSRF, parsowania IP, ochrony sieci, web-fetch i polityki SSRF Plugin SDK                                             |
| `/codeql-security-high/mcp-process-tool-boundary` | Serwery MCP, pomocniki wykonywania procesów, dostarczanie wychodzące i bramki wykonywania narzędzi agentów                            |
| `/codeql-security-high/plugin-trust-boundary`     | Powierzchnie zaufania instalacji Plugin, loadera, manifestu, rejestru, przygotowania zależności uruchomieniowych, ładowania źródeł i kontraktu pakietu Plugin SDK |

### Shardy bezpieczeństwa specyficzne dla platform

- `CodeQL Android Critical Security` — zaplanowany shard bezpieczeństwa Android. Buduje aplikację Android ręcznie dla CodeQL na najmniejszym runnerze Blacksmith Linux akceptowanym przez sanity workflow. Przesyła pod `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — tygodniowy/ręczny shard bezpieczeństwa macOS. Buduje aplikację macOS ręcznie dla CodeQL na Blacksmith macOS, odfiltrowuje wyniki budowania zależności z przesyłanego SARIF i przesyła pod `/codeql-critical-security/macos`. Utrzymywany poza codziennymi domyślnymi ustawieniami, ponieważ budowanie macOS dominuje czas wykonania nawet przy czystym przebiegu.

### Kategorie krytycznej jakości

`CodeQL Critical Quality` to odpowiadający shard niezwiązany z bezpieczeństwem. Uruchamia tylko zapytania jakości JavaScript/TypeScript o poziomie błędu, niezwiązane z bezpieczeństwem, na wąskich powierzchniach o wysokiej wartości na mniejszym runnerze Blacksmith Linux. Jego strażnik pull requestów jest celowo mniejszy niż profil zaplanowany: PR-y niebędące szkicami uruchamiają tylko pasujące shardy `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` i `plugin-sdk-reply-runtime` dla zmian w kodzie wykonywania poleceń/modeli/narzędzi agentów i wysyłki odpowiedzi, schematu konfiguracji/migracji/IO, uwierzytelniania/sekretów/sandboxa/bezpieczeństwa, core channel i środowiska uruchomieniowego wbudowanego channel plugin, protokołu Gateway/metody serwera, środowiska uruchomieniowego pamięci/kleju SDK, MCP/procesu/dostarczania wychodzącego, środowiska uruchomieniowego dostawcy/katalogu modeli, diagnostyki sesji/kolejek dostarczania, loadera pluginów, kontraktu Plugin SDK/pakietu albo środowiska uruchomieniowego odpowiedzi Plugin SDK. Zmiany konfiguracji CodeQL i workflow jakości uruchamiają wszystkie dwanaście shardów jakości PR.

Ręczne uruchomienie akceptuje:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Wąskie profile są zaczepami do nauki/iteracji, służącymi do uruchamiania jednego fragmentu jakości w izolacji.

| Kategoria                                              | Powierzchnia                                                                                                                                                                  |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Kod granicy bezpieczeństwa uwierzytelniania, sekretów, sandboxa, Cron i Gateway                                                                                              |
| `/codeql-critical-quality/config-boundary`              | Schemat konfiguracji, migracja, normalizacja i kontrakty IO                                                                                                                   |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schematy protokołu Gateway i kontrakty metod serwera                                                                                                                          |
| `/codeql-critical-quality/channel-runtime-boundary`     | Kontrakty implementacyjne głównych kanałów i dołączonych Plugin kanałów                                                                                                       |
| `/codeql-critical-quality/agent-runtime-boundary`       | Wykonywanie poleceń, rozsyłanie modeli/dostawców, rozsyłanie i kolejki automatycznych odpowiedzi oraz kontrakty środowiska wykonawczego płaszczyzny sterowania ACP           |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Serwery MCP i mosty narzędzi, pomocniki nadzoru procesów oraz kontrakty dostarczania wychodzącego                                                                            |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK hosta pamięci, fasady środowiska wykonawczego pamięci, aliasy pamięci Plugin SDK, spoiwo aktywacji środowiska wykonawczego pamięci oraz polecenia doctor pamięci         |
| `/codeql-critical-quality/session-diagnostics-boundary` | Wewnętrzne mechanizmy kolejki odpowiedzi, kolejki dostarczania sesji, pomocniki wiązania/dostarczania sesji wychodzących, powierzchnie zdarzeń diagnostycznych/pakietów logów oraz kontrakty CLI doctor sesji |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Rozsyłanie odpowiedzi przychodzących w Plugin SDK, pomocniki ładunku odpowiedzi/fragmentowania/środowiska wykonawczego, opcje odpowiedzi kanału, kolejki dostarczania oraz pomocniki wiązania sesji/wątku |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalizacja katalogu modeli, uwierzytelnianie i wykrywanie dostawców, rejestracja środowiska wykonawczego dostawców, domyślne ustawienia/katalogi dostawców oraz rejestry web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, lokalna trwałość, przepływy sterowania Gateway oraz kontrakty środowiska wykonawczego płaszczyzny sterowania zadaniami                                 |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Główne kontrakty środowiska wykonawczego web fetch/search, IO mediów, rozumienia mediów, generowania obrazów i generowania mediów                                            |
| `/codeql-critical-quality/plugin-boundary`              | Kontrakty loadera, rejestru, powierzchni publicznej i punktu wejścia Plugin SDK                                                                                              |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Opublikowane źródło Plugin SDK po stronie pakietu i pomocniki kontraktu pakietu Plugin                                                                                       |

Jakość pozostaje oddzielona od bezpieczeństwa, aby ustalenia jakościowe można było planować, mierzyć, wyłączać lub rozszerzać bez zaciemniania sygnału bezpieczeństwa. Rozszerzenie CodeQL dla Swift, Python i dołączonych Plugin powinno zostać dodane z powrotem jako zakresowane lub podzielone na fragmenty prace następcze dopiero wtedy, gdy wąskie profile będą miały stabilne środowisko wykonawcze i sygnał.

## Przepływy utrzymaniowe

### Docs Agent

Przepływ pracy `Docs Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex do utrzymywania istniejącej dokumentacji w zgodzie z niedawno wprowadzonymi zmianami. Nie ma czystego harmonogramu: udany przebieg CI po wypchnięciu na `main` przez konto niebędące botem może go wyzwolić, a ręczne uruchomienie może go wykonać bezpośrednio. Wywołania z workflow-run są pomijane, gdy `main` przeszedł dalej albo gdy w ostatniej godzinie utworzono inny niepominięty przebieg Docs Agent. Gdy jest uruchamiany, przegląda zakres commitów od poprzedniego SHA źródłowego niepominiętego Docs Agent do bieżącego `main`, więc jeden godzinny przebieg może objąć wszystkie zmiany na main nagromadzone od ostatniego przejścia dokumentacji.

### Test Performance Agent

Przepływ pracy `Test Performance Agent` to sterowana zdarzeniami ścieżka utrzymaniowa Codex dla wolnych testów. Nie ma czystego harmonogramu: udany przebieg CI po wypchnięciu na `main` przez konto niebędące botem może go wyzwolić, ale zostanie pominięty, jeśli inne wywołanie workflow-run już zostało uruchomione lub działało danego dnia UTC. Ręczne uruchomienie omija tę dzienną bramkę aktywności. Ścieżka buduje raport wydajności pełnego zestawu zgrupowanych testów Vitest, pozwala Codex wprowadzać tylko małe, zachowujące pokrycie poprawki wydajności testów zamiast szerokich refaktoryzacji, następnie ponownie uruchamia raport pełnego zestawu i odrzuca zmiany, które zmniejszają bazową liczbę przechodzących testów. Jeśli baza ma nieprzechodzące testy, Codex może naprawić tylko oczywiste awarie, a raport pełnego zestawu po agencie musi przejść, zanim cokolwiek zostanie zatwierdzone. Gdy `main` przesunie się przed wypchnięciem bota, ścieżka wykonuje rebase zweryfikowanej łatki, ponownie uruchamia `pnpm check:changed` i ponawia wypchnięcie; konfliktujące, nieaktualne łatki są pomijane. Używa Ubuntu hostowanego przez GitHub, aby akcja Codex mogła zachować tę samą postawę bezpieczeństwa drop-sudo co agent dokumentacji.

### Zduplikowane PR po scaleniu

Przepływ pracy `Duplicate PRs After Merge` to ręczny przepływ utrzymaniowy dla porządkowania duplikatów po wylądowaniu zmian. Domyślnie działa w trybie dry-run i zamyka tylko jawnie wymienione PR, gdy `apply=true`. Przed modyfikacją GitHub weryfikuje, że wylądowany PR jest scalony oraz że każdy duplikat ma albo wspólne referencjonowane zgłoszenie, albo nakładające się zmienione fragmenty.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokalne bramki sprawdzania i routing zmian

Lokalna logika zmienionych ścieżek żyje w `scripts/changed-lanes.mjs` i jest wykonywana przez `scripts/check-changed.mjs`. Ta lokalna bramka sprawdzania jest bardziej rygorystyczna wobec granic architektury niż szeroki zakres platformy CI:

- zmiany produkcyjne core uruchamiają typecheck core prod i core test oraz lint/guardy core;
- zmiany dotyczące wyłącznie testów core uruchamiają tylko typecheck core test oraz lint core;
- zmiany produkcyjne rozszerzeń uruchamiają typecheck extension prod i extension test oraz lint rozszerzeń;
- zmiany dotyczące wyłącznie testów rozszerzeń uruchamiają typecheck extension test oraz lint rozszerzeń;
- zmiany publicznego Plugin SDK lub kontraktu Plugin rozszerzają się do typecheck rozszerzeń, ponieważ rozszerzenia zależą od tych kontraktów core (przeglądy rozszerzeń Vitest pozostają jawną pracą testową);
- podbicia wersji dotyczące tylko metadanych wydania uruchamiają ukierunkowane kontrole wersji/konfiguracji/zależności głównych;
- nieznane zmiany root/config bezpiecznie przechodzą w tryb wszystkich ścieżek sprawdzania.

Lokalny routing zmienionych testów żyje w `scripts/test-projects.test-support.mjs` i celowo jest tańszy niż `check:changed`: bezpośrednie edycje testów uruchamiają same siebie, edycje źródeł preferują jawne mapowania, następnie testy rodzeństwa i zależności grafu importów. Wspólna konfiguracja dostarczania group-room jest jednym z jawnych mapowań: zmiany konfiguracji widocznej odpowiedzi grupy, trybu dostarczania odpowiedzi źródłowej albo promptu systemowego narzędzia wiadomości przechodzą przez główne testy odpowiedzi oraz regresje dostarczania Discord i Slack, aby zmiana wspólnej wartości domyślnej zawiodła przed pierwszym wypchnięciem PR. Używaj `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` tylko wtedy, gdy zmiana jest na tyle szeroka dla harnessu, że tani zestaw mapowany nie jest wiarygodnym przybliżeniem.

## Walidacja Testbox

Uruchamiaj Testbox z katalogu głównego repozytorium i preferuj świeżo rozgrzany box dla szerokiego dowodu. Przed poświęceniem wolnej bramki na box, który był użyty ponownie, wygasł albo właśnie zgłosił nieoczekiwanie dużą synchronizację, uruchom najpierw `pnpm testbox:sanity` wewnątrz boxa.

Kontrola sanity szybko kończy się niepowodzeniem, gdy wymagane pliki główne, takie jak `pnpm-lock.yaml`, zniknęły albo gdy `git status --short` pokazuje co najmniej 200 śledzonych usunięć. Zwykle oznacza to, że zdalny stan synchronizacji nie jest wiarygodną kopią PR; zatrzymaj ten box i rozgrzej świeży zamiast debugować awarię testu produktu. Dla celowych PR z dużą liczbą usunięć ustaw `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` dla tego przebiegu sanity.

`pnpm testbox:run` kończy też lokalne wywołanie Blacksmith CLI, które pozostaje w fazie synchronizacji przez ponad pięć minut bez wyjścia po synchronizacji. Ustaw `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, aby wyłączyć ten guard, albo użyj większej wartości w milisekundach dla nietypowo dużych lokalnych diffów.

Crabbox to druga, należąca do repozytorium ścieżka zdalnego boxa dla dowodu linuksowego, gdy Blacksmith jest niedostępny albo gdy preferowana jest własna pojemność chmurowa. Rozgrzej box, uwodnij go przez przepływ pracy projektu, a następnie uruchamiaj polecenia przez Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` zawiera domyślne ustawienia dostawcy, synchronizacji i uwadniania GitHub Actions. Wyklucza lokalny `.git`, aby uwodniony checkout Actions zachował własne zdalne metadane Git zamiast synchronizować lokalne remotes i magazyny obiektów maintainerów, a także wyklucza lokalne artefakty środowiska wykonawczego/buildu, których nigdy nie należy przesyłać. `.github/workflows/crabbox-hydrate.yml` zawiera checkout, konfigurację Node/pnpm, pobranie `origin/main` oraz przekazanie niesekretnego środowiska, które późniejsze polecenia `crabbox run --id <cbx_id>` odczytują jako źródło.

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Kanały deweloperskie](/pl/install/development-channels)
