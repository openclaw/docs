---
read_when:
    - Szukam definicji publicznych kanałów wydań
    - Uruchamianie walidacji wydania lub akceptacji pakietu
    - Szukasz informacji o nazewnictwie wersji i cyklu wydań
summary: Ścieżki wydań, lista kontrolna operatora, środowiska walidacyjne, nazewnictwo wersji i kadencja
title: Polityka wydań
x-i18n:
    generated_at: "2026-04-30T10:16:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54dc9ad7918ac95ec535a0404bbcbc04461a2b977151db0c2039b91e7e69c15c
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ma trzy publiczne ścieżki wydań:

- stable: wydania oznaczone tagami, które domyślnie publikują do npm `beta`, albo do npm `latest`, gdy zostanie to wyraźnie zażądane
- beta: tagi przedpremierowe, które publikują do npm `beta`
- dev: ruchoma głowica `main`

## Nazewnictwo wersji

- Wersja wydania stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Wersja wydania korygującego stable: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Wersja przedpremierowa beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Nie dodawaj zer wiodących do miesiąca ani dnia
- `latest` oznacza bieżące promowane wydanie stable npm
- `beta` oznacza bieżący cel instalacji beta
- Wydania stable i korygujące stable domyślnie publikują do npm `beta`; operatorzy wydania mogą jawnie wskazać `latest` albo później promować sprawdzoną kompilację beta
- Każde wydanie stable OpenClaw dostarcza razem pakiet npm i aplikację macOS;
  wydania beta zwykle najpierw walidują i publikują ścieżkę npm/pakietu, a
  kompilacja/podpisywanie/notaryzacja aplikacji mac są zarezerwowane dla stable, chyba że wyraźnie zażądano inaczej

## Rytm wydań

- Wydania przechodzą najpierw przez beta
- Stable następuje dopiero po zwalidowaniu najnowszej wersji beta
- Maintainerzy zwykle tworzą wydania z gałęzi `release/YYYY.M.D` utworzonej
  z bieżącego `main`, aby walidacja wydania i poprawki nie blokowały nowego
  rozwoju na `main`
- Jeśli tag beta został wypchnięty lub opublikowany i wymaga poprawki, maintainerzy tworzą
  następny tag `-beta.N` zamiast usuwać lub odtwarzać stary tag beta
- Szczegółowa procedura wydania, zgody, poświadczenia i notatki dotyczące odzyskiwania
  są dostępne tylko dla maintainerów

## Lista kontrolna operatora wydania

Ta lista kontrolna pokazuje publiczny kształt przepływu wydania. Prywatne poświadczenia,
podpisywanie, notaryzacja, odzyskiwanie dist-tag i szczegóły awaryjnego wycofania pozostają w
runbooku wydania dostępnym tylko dla maintainerów.

1. Zacznij od bieżącego `main`: pobierz najnowsze zmiany, potwierdź, że docelowy commit został wypchnięty,
   i potwierdź, że bieżące CI `main` jest wystarczająco zielone, aby utworzyć z niego gałąź.
2. Przepisz górną sekcję `CHANGELOG.md` na podstawie rzeczywistej historii commitów za pomocą
   `/changelog`, pozostaw wpisy zorientowane na użytkownika, zacommituj je, wypchnij i wykonaj rebase/pull
   jeszcze raz przed utworzeniem gałęzi.
3. Przejrzyj rekordy kompatybilności wydania w
   `src/plugins/compat/registry.ts` oraz
   `src/commands/doctor/shared/deprecation-compat.ts`. Usuń wygasłą
   kompatybilność tylko wtedy, gdy ścieżka aktualizacji pozostaje pokryta, albo zapisz, dlaczego jest
   celowo zachowywana.
4. Utwórz `release/YYYY.M.D` z bieżącego `main`; nie wykonuj normalnej pracy nad wydaniem
   bezpośrednio na `main`.
5. Podbij każdą wymaganą lokalizację wersji dla zamierzonego tagu, a następnie uruchom
   lokalną deterministyczną kontrolę wstępną:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` oraz `pnpm release:check`.
6. Uruchom `OpenClaw NPM Release` z `preflight_only=true`. Zanim tag istnieje,
   pełny 40-znakowy SHA gałęzi wydania jest dozwolony do kontroli wstępnej tylko na potrzeby walidacji.
   Zapisz pomyślny `preflight_run_id`.
7. Uruchom wszystkie testy przedwydaniowe za pomocą `Full Release Validation` dla
   gałęzi wydania, tagu lub pełnego SHA commita. To jest jeden ręczny punkt wejścia
   dla czterech dużych pól testowych wydania: Vitest, Docker, QA Lab i Package.
8. Jeśli walidacja się nie powiedzie, napraw na gałęzi wydania i ponownie uruchom najmniejszy nieudany
   plik, ścieżkę, zadanie workflow, profil pakietu, providera lub listę dozwolonych modeli, które
   dowodzą poprawki. Ponownie uruchamiaj pełny parasol tylko wtedy, gdy zmieniona powierzchnia sprawia,
   że wcześniejsze dowody są nieaktualne.
9. Dla beta otaguj `vYYYY.M.D-beta.N`, opublikuj z npm dist-tag `beta`, a następnie uruchom
   akceptację pakietu po publikacji wobec opublikowanego pakietu `openclaw@YYYY.M.D-beta.N`
   lub `openclaw@beta`. Jeśli wypchnięta lub opublikowana beta wymaga poprawki, utwórz
   następne `-beta.N`; nie usuwaj ani nie przepisuj starej bety.
10. Dla stable kontynuuj dopiero po tym, jak sprawdzona beta lub kandydat do wydania ma
    wymagane dowody walidacji. Publikacja stable npm ponownie używa pomyślnego
    artefaktu kontroli wstępnej przez `preflight_run_id`; gotowość wydania stable macOS
    wymaga też spakowanych `.zip`, `.dmg`, `.dSYM.zip` oraz zaktualizowanego
    `appcast.xml` na `main`.
11. Po publikacji uruchom weryfikator npm po publikacji, opcjonalny samodzielny
    opublikowany-npm Telegram E2E, gdy potrzebujesz dowodu kanału po publikacji,
    promocję dist-tag, gdy jest potrzebna, notatki GitHub release/prerelease z
    kompletnej pasującej sekcji `CHANGELOG.md` oraz kroki ogłoszenia wydania.

## Kontrola wstępna wydania

- Uruchom `pnpm check:test-types` przed preflightem wydania, aby testowy TypeScript pozostawał
  objęty poza szybszą lokalną bramką `pnpm check`
- Uruchom `pnpm check:architecture` przed preflightem wydania, aby szersze kontrole cykli
  importów i granic architektury były zielone poza szybszą lokalną bramką
- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane
  artefakty wydania `dist/*` i pakiet Control UI istniały dla etapu walidacji
  paczki
- Uruchom ręczny workflow `Full Release Validation` przed zatwierdzeniem wydania, aby
  uruchomić wszystkie przedwydaniowe test boxes z jednego punktu wejścia. Przyjmuje on gałąź,
  tag albo pełny SHA commita, wywołuje ręczny `CI` oraz wywołuje
  `OpenClaw Release Checks` dla install smoke, package acceptance, zestawów ścieżki
  wydania Docker, live/E2E, OpenWebUI, parytetu QA Lab, Matrix i ścieżek Telegram.
  Podaj `npm_telegram_package_spec` tylko po opublikowaniu paczki i gdy powydaniowe
  Telegram E2E też ma zostać uruchomione. Podaj
  `evidence_package_spec`, gdy prywatny raport dowodowy ma udowodnić, że
  walidacja odpowiada opublikowanej paczce npm bez wymuszania Telegram E2E.
  Przykład:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Uruchom ręczny workflow `Package Acceptance`, gdy chcesz uzyskać dowód z kanału bocznego
  dla kandydata paczki, podczas gdy prace wydaniowe trwają dalej. Użyj `source=npm` dla
  `openclaw@beta`, `openclaw@latest` albo dokładnej wersji wydania; `source=ref`,
  aby spakować zaufaną gałąź/tag/SHA `package_ref` z bieżącym harness
  `workflow_ref`; `source=url` dla archiwum tarball HTTPS z wymaganym
  SHA-256; albo `source=artifact` dla archiwum tarball przesłanego przez inny przebieg
  GitHub Actions. Workflow rozwiązuje kandydata do
  `package-under-test`, ponownie używa planisty wydania Docker E2E względem tego
  archiwum tarball i może uruchomić Telegram QA względem tego samego archiwum tarball z
  `telegram_mode=mock-openai` albo `telegram_mode=live-frontier`.
  Przykład: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  Typowe profile:
  - `smoke`: ścieżki instalacji/kanału/agenta, sieci Gateway i przeładowania konfiguracji
  - `package`: natywne dla artefaktu ścieżki paczki/aktualizacji/Plugin bez OpenWebUI ani live ClawHub
  - `product`: profil paczki plus kanały MCP, czyszczenie cron/subagent,
    wyszukiwanie webowe OpenAI i OpenWebUI
  - `full`: fragmenty ścieżki wydania Docker z OpenWebUI
  - `custom`: dokładny wybór `docker_lanes` dla ukierunkowanego ponownego uruchomienia
- Uruchom ręczny workflow `CI` bezpośrednio, gdy potrzebujesz tylko pełnego zwykłego pokrycia CI
  dla kandydata wydania. Ręczne wywołania CI omijają zakresowanie zmian
  i wymuszają shardy Linux Node, shardy bundled-plugin, kontrakty kanałów,
  zgodność Node 22, `check`, `check-additional`, build smoke,
  kontrole dokumentacji, Python skills, Windows, macOS, Android i ścieżki i18n
  Control UI.
  Przykład: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Uruchom `pnpm qa:otel:smoke` podczas walidacji telemetrii wydania. Ćwiczy on
  QA-lab przez lokalny odbiornik OTLP/HTTP i weryfikuje wyeksportowane nazwy spanów
  śledzenia, ograniczone atrybuty oraz redakcję treści/identyfikatorów bez
  wymagania Opik, Langfuse ani innego zewnętrznego collectora.
- Uruchom `pnpm release:check` przed każdym tagowanym wydaniem
- Kontrole wydania działają teraz w osobnym ręcznym workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` uruchamia też bramkę parytetu mock QA Lab oraz szybki
  profil live Matrix i ścieżkę Telegram QA przed zatwierdzeniem wydania. Ścieżki live
  używają środowiska `qa-live-shared`; Telegram używa też dzierżaw poświadczeń Convex CI.
  Uruchom ręczny workflow `QA-Lab - All Lanes` z
  `matrix_profile=all` i `matrix_shards=true`, gdy chcesz pełny inwentarz transportu,
  mediów i E2EE Matrix równolegle.
- Walidacja uruchomieniowa instalacji i aktualizacji między systemami operacyjnymi jest częścią publicznych
  `OpenClaw Release Checks` i `Full Release Validation`, które wywołują
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` bezpośrednio
- Ten podział jest celowy: utrzymuje rzeczywistą ścieżkę wydania npm krótką,
  deterministyczną i skoncentrowaną na artefaktach, podczas gdy wolniejsze kontrole live pozostają
  we własnej ścieżce, aby nie wstrzymywały ani nie blokowały publikacji
- Kontrole wydania zawierające sekrety powinny być wywoływane przez `Full Release
Validation` albo z refa workflow `main`/release, aby logika workflow i
  sekrety pozostawały kontrolowane
- `OpenClaw Release Checks` przyjmuje gałąź, tag albo pełny SHA commita, o ile
  rozwiązany commit jest osiągalny z gałęzi OpenClaw albo tagu wydania
- Preflight tylko walidacyjny `OpenClaw NPM Release` przyjmuje też bieżący
  pełny 40-znakowy SHA commita gałęzi workflow bez wymagania wypchniętego tagu
- Ta ścieżka SHA jest tylko walidacyjna i nie może zostać promowana do rzeczywistej publikacji
- W trybie SHA workflow syntetyzuje `v<package.json version>` tylko dla kontroli
  metadanych paczki; rzeczywista publikacja nadal wymaga prawdziwego tagu wydania
- Oba workflow utrzymują rzeczywistą ścieżkę publikacji i promocji na runnerach
  hostowanych przez GitHub, podczas gdy niemutująca ścieżka walidacji może używać większych
  runnerów Blacksmith Linux
- Ten workflow uruchamia
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  z użyciem sekretów workflow `OPENAI_API_KEY` i `ANTHROPIC_API_KEY`
- Preflight wydania npm nie czeka już na osobną ścieżkę kontroli wydania
- Uruchom `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (albo odpowiadający tag beta/korekty) przed zatwierdzeniem
- Po publikacji npm uruchom
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (albo odpowiadającą wersję beta/korekty), aby zweryfikować opublikowaną ścieżkę
  instalacji z rejestru w świeżym prefiksie tymczasowym
- Po publikacji beta uruchom `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  aby zweryfikować onboarding zainstalowanej paczki, konfigurację Telegram i rzeczywiste Telegram E2E
  względem opublikowanej paczki npm z użyciem współdzielonej puli dzierżawionych poświadczeń Telegram.
  Lokalne jednorazowe uruchomienia maintainerów mogą pominąć zmienne Convex i przekazać trzy
  poświadczenia env `OPENCLAW_QA_TELEGRAM_*` bezpośrednio.
- Maintainerzy mogą uruchomić tę samą kontrolę powydaniową z GitHub Actions przez
  ręczny workflow `NPM Telegram Beta E2E`. Jest on celowo wyłącznie ręczny i
  nie uruchamia się przy każdym mergu.
- Automatyzacja wydań maintainerów używa teraz schematu preflight-potem-promocja:
  - rzeczywista publikacja npm musi przejść pomyślny npm `preflight_run_id`
  - rzeczywista publikacja npm musi zostać wywołana z tej samej gałęzi `main` albo
    `release/YYYY.M.D` co pomyślny przebieg preflight
  - stabilne wydania npm domyślnie trafiają do `beta`
  - stabilna publikacja npm może jawnie wskazać `latest` przez wejście workflow
  - mutacja npm dist-tag oparta na tokenie znajduje się teraz w
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    ze względów bezpieczeństwa, ponieważ `npm dist-tag add` nadal potrzebuje `NPM_TOKEN`, podczas gdy
    publiczne repo utrzymuje publikację wyłącznie przez OIDC
  - publiczne `macOS Release` jest tylko walidacyjne
  - rzeczywista prywatna publikacja mac musi przejść pomyślne prywatne mac
    `preflight_run_id` i `validate_run_id`
  - rzeczywiste ścieżki publikacji promują przygotowane artefakty zamiast budować
    je ponownie
- Dla stabilnych wydań korygujących takich jak `YYYY.M.D-N` weryfikator powydaniowy
  sprawdza też tę samą ścieżkę aktualizacji w prefiksie tymczasowym z `YYYY.M.D` do `YYYY.M.D-N`,
  aby korekty wydań nie mogły po cichu pozostawić starszych globalnych instalacji na
  bazowym stabilnym ładunku
- Preflight wydania npm kończy się niepowodzeniem w trybie zamkniętym, jeśli archiwum tarball nie zawiera zarówno
  `dist/control-ui/index.html`, jak i niepustego ładunku `dist/control-ui/assets/`,
  abyśmy ponownie nie wysłali pustego dashboardu przeglądarkowego
- Weryfikacja powydaniowa sprawdza też, czy opublikowana instalacja z rejestru
  zawiera niepuste zależności runtime bundled plugin pod głównym układem `dist/*`.
  Wydanie wysłane z brakującymi albo pustymi ładunkami zależności bundled plugin
  nie przechodzi weryfikatora postpublish i nie może zostać promowane
  do `latest`.
- `pnpm test:install:smoke` wymusza też budżet `unpackedSize` npm pack na
  archiwum tarball kandydata aktualizacji, dzięki czemu installer e2e wykrywa przypadkowy rozrost paczki
  przed ścieżką publikacji wydania
- Jeśli prace wydaniowe dotknęły planowania CI, manifestów timingów rozszerzeń albo
  macierzy testów rozszerzeń, wygeneruj ponownie i przejrzyj należące do planisty
  wyjścia macierzy `plugin-prerelease-extension-shard` z
  `.github/workflows/plugin-prerelease.yml` przed zatwierdzeniem, aby notatki wydania nie
  opisywały nieaktualnego układu CI
- Gotowość stabilnego wydania macOS obejmuje też powierzchnie aktualizatora:
  - wydanie GitHub musi ostatecznie zawierać spakowane `.zip`, `.dmg` i `.dSYM.zip`
  - `appcast.xml` na `main` musi wskazywać nowy stabilny zip po publikacji
  - spakowana aplikacja musi zachować niedebugowy bundle id, niepusty URL feedu Sparkle
    oraz `CFBundleVersion` na poziomie albo powyżej kanonicznego progu buildu Sparkle
    dla tej wersji wydania

## Release test boxes

`Full Release Validation` to sposób, w jaki operatorzy uruchamiają wszystkie testy przedwydaniowe z
jednego punktu wejścia. Uruchom go z zaufanego refa workflow `main` i przekaż gałąź
wydania, tag albo pełny SHA commita jako `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow rozwiązuje docelowy ref, wywołuje ręczny `CI` z
`target_ref=<release-ref>`, wywołuje `OpenClaw Release Checks` oraz
opcjonalnie wywołuje samodzielne powydaniowe Telegram E2E, gdy
`npm_telegram_package_spec` jest ustawione. `OpenClaw Release Checks` następnie rozgałęzia
install smoke, kontrole wydania cross-OS, pokrycie live/E2E Docker release-path,
Package Acceptance z Telegram package QA, parytet QA Lab, live Matrix i
live Telegram. Pełny przebieg jest akceptowalny tylko wtedy, gdy podsumowanie `Full Release Validation`
pokazuje `normal_ci` i `release_checks` jako pomyślne, a każdy opcjonalny
potomny `npm_telegram` jest pomyślny albo celowo pominięty. Końcowe
podsumowanie weryfikatora zawiera tabele najwolniejszych zadań dla każdego przebiegu potomnego, aby release
manager mógł zobaczyć bieżącą ścieżkę krytyczną bez pobierania logów.
Potomne workflow są wywoływane z zaufanego refa, który uruchamia `Full Release
Validation`, zwykle `--ref main`, nawet gdy docelowy `ref` wskazuje na
starszą gałąź wydania albo tag. Nie ma osobnego wejścia workflow-ref dla Full Release Validation;
wybierz zaufany harness, wybierając ref uruchomienia workflow.

Użyj `release_profile`, aby wybrać szerokość live/provider:

- `minimum`: najszybsza krytyczna dla wydania ścieżka OpenAI/core live i Docker
- `stable`: minimum plus stabilne pokrycie provider/backend do zatwierdzenia wydania
- `full`: stable plus szerokie doradcze pokrycie provider/media

`OpenClaw Release Checks` używa zaufanego refa workflow, aby raz rozwiązać docelowy
ref jako `release-package-under-test`, i ponownie używa tego artefaktu zarówno w
kontrolach Docker release-path, jak i Package Acceptance. Utrzymuje to wszystkie
test boxes skierowane na paczkę na tych samych bajtach i unika powtarzania buildów paczki.
Cross-OS OpenAI install smoke używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy
zmienna repo/org jest ustawiona, w przeciwnym razie `openai/gpt-5.4-mini`, ponieważ ta ścieżka
udowadnia instalację paczki, onboarding, start Gateway i jedną turę live agenta
zamiast benchmarkować najwolniejszy model domyślny. Szersza macierz live provider
pozostaje miejscem dla pokrycia specyficznego dla modeli.

Użyj tych wariantów zależnie od etapu wydania:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Nie używaj pełnego parasola jako pierwszego ponownego uruchomienia po ukierunkowanej poprawce. Jeśli jedno środowisko
zawiedzie, użyj nieudanego przepływu podrzędnego, zadania, ścieżki Docker, profilu pakietu, dostawcy
modelu albo ścieżki QA jako następnego dowodu. Uruchom pełny parasol ponownie tylko wtedy, gdy
poprawka zmieniła wspólną orkiestrację wydania albo sprawiła, że wcześniejsze dowody ze wszystkich środowisk
stały się nieaktualne. Końcowy weryfikator parasola ponownie sprawdza zapisane identyfikatory uruchomień
podrzędnych przepływów, więc po pomyślnym ponownym uruchomieniu podrzędnego przepływu uruchom ponownie tylko nieudane
nadrzędne zadanie `Verify full validation`.

W celu ograniczonego odzyskiwania przekaż `rerun_group` do parasola. `all` to rzeczywiste
uruchomienie kandydata do wydania, `ci` uruchamia tylko zwykły podrzędny CI, `plugin-prerelease`
uruchamia tylko podrzędny release-only plugin, `release-checks` uruchamia każde środowisko wydaniowe,
a węższe grupy wydaniowe to `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` i `npm-telegram`, gdy
dostarczona jest samodzielna ścieżka pakietowa Telegram.

### Vitest

Środowisko Vitest to ręczny podrzędny przepływ `CI`. Ręczne CI celowo
omija zakresowanie zmian i wymusza zwykły graf testów dla kandydata do wydania:
shardy Linux Node, shardy bundled-plugin, kontrakty kanałów, zgodność Node 22,
`check`, `check-additional`, build smoke, sprawdzenia dokumentacji, Python
skills, Windows, macOS, Android i Control UI i18n.

Użyj tego środowiska, aby odpowiedzieć na pytanie „czy drzewo źródeł przeszło pełny zwykły zestaw testów?”.
To nie jest to samo co walidacja produktu ścieżki wydaniowej. Zachowaj dowody:

- podsumowanie `Full Release Validation` pokazujące URL uruchomionego `CI`
- zielony przebieg `CI` na dokładnym docelowym SHA
- nazwy nieudanych lub wolnych shardów z zadań CI podczas badania regresji
- artefakty czasów Vitest, takie jak `.artifacts/vitest-shard-timings.json`, gdy
  uruchomienie wymaga analizy wydajności

Uruchamiaj ręczne CI bezpośrednio tylko wtedy, gdy wydanie potrzebuje deterministycznego zwykłego CI, ale
nie środowisk Docker, QA Lab, live, cross-OS ani pakietowych:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Środowisko Docker znajduje się w `OpenClaw Release Checks` przez
`openclaw-live-and-e2e-checks-reusable.yml`, plus przepływ `install-smoke`
w trybie wydaniowym. Waliduje ono kandydata do wydania przez spakowane
środowiska Docker, a nie wyłącznie testy na poziomie źródeł.

Zakres wydaniowy Docker obejmuje:

- pełny install smoke z włączonym wolnym Bun global install smoke
- przygotowanie/ponowne użycie obrazu smoke głównego Dockerfile według docelowego SHA, z zadaniami QR,
  root/gateway oraz installer/Bun smoke uruchamianymi jako osobne shardy install-smoke
- ścieżki E2E repozytorium
- wydaniowe fragmenty Docker: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, `plugins-runtime-install-h`,
  `bundled-channels-core`, `bundled-channels-update-a`,
  `bundled-channels-update-discord`, `bundled-channels-update-b` i
  `bundled-channels-contracts`
- pokrycie OpenWebUI we fragmencie `plugins-runtime-services`, gdy jest wymagane
- podzielone ścieżki zależności bundled-channel między fragmenty channel-smoke, update-target
  i kontraktów setup/runtime zamiast jednego dużego zadania bundled-channel
- podzielone ścieżki instalacji/odinstalowania bundled plugin
  `bundled-plugin-install-uninstall-0` do
  `bundled-plugin-install-uninstall-23`
- zestawy dostawców live/E2E i pokrycie modelu live Docker, gdy sprawdzenia wydaniowe
  obejmują zestawy live

Użyj artefaktów Docker przed ponownym uruchomieniem. Harmonogram ścieżki wydaniowej przesyła
`.artifacts/docker-tests/` z logami ścieżek, `summary.json`, `failures.json`,
czasami faz, JSON planu harmonogramu i poleceniami ponownego uruchomienia. Do ukierunkowanego odzyskiwania
użyj `docker_lanes=<lane[,lane]>` w wielokrotnego użytku przepływie live/E2E zamiast
ponownego uruchamiania wszystkich fragmentów wydaniowych. Wygenerowane polecenia ponownego uruchomienia zawierają wcześniejsze
`package_artifact_run_id` i przygotowane dane wejściowe obrazu Docker, gdy są dostępne, dzięki czemu
nieudana ścieżka może ponownie użyć tej samej paczki tarball i obrazów GHCR.

### QA Lab

Środowisko QA Lab jest również częścią `OpenClaw Release Checks`. Jest to agentic
bramka wydaniowa zachowania i poziomu kanałów, oddzielna od Vitest i mechaniki pakietów Docker.

Zakres wydaniowy QA Lab obejmuje:

- bramkę mock parity porównującą ścieżkę kandydata OpenAI z bazą Opus 4.6
  przy użyciu pakietu agentic parity
- szybki profil live Matrix QA używający środowiska `qa-live-shared`
- ścieżkę live Telegram QA używającą dzierżaw poświadczeń Convex CI
- `pnpm qa:otel:smoke`, gdy telemetria wydania wymaga jawnego lokalnego dowodu

Użyj tego środowiska, aby odpowiedzieć na pytanie „czy wydanie zachowuje się poprawnie w scenariuszach QA i
przepływach kanałów live?”. Zachowaj URL-e artefaktów dla ścieżek parity, Matrix i Telegram
podczas zatwierdzania wydania. Pełne pokrycie Matrix pozostaje dostępne jako
ręczne shardowane uruchomienie QA-Lab, a nie domyślna ścieżka krytyczna dla wydania.

### Package

Środowisko Package to bramka produktu instalowalnego. Jest obsługiwane przez
`Package Acceptance` i resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver normalizuje
kandydata do tarballa `package-under-test` używanego przez Docker E2E, waliduje
inwentarz pakietu, zapisuje wersję pakietu i SHA-256 oraz utrzymuje
ref uprzęży przepływu oddzielnie od ref źródła pakietu.

Obsługiwane źródła kandydatów:

- `source=npm`: `openclaw@beta`, `openclaw@latest` albo dokładna wersja wydania OpenClaw
- `source=ref`: spakuj zaufaną gałąź `package_ref`, tag albo pełny SHA commita
  z wybraną uprzężą `workflow_ref`
- `source=url`: pobierz HTTPS `.tgz` z wymaganym `package_sha256`
- `source=artifact`: użyj ponownie `.tgz` przesłanego przez inne uruchomienie GitHub Actions

`OpenClaw Release Checks` uruchamia Package Acceptance z `source=ref`,
`package_ref=<release-ref>`, `suite_profile=custom`,
`docker_lanes=bundled-channel-deps-compat plugins-offline` oraz
`telegram_mode=mock-openai`. Wydaniowe fragmenty Docker pokrywają
nakładające się ścieżki instalacji, aktualizacji i aktualizacji pluginów; Package Acceptance utrzymuje
natywną dla artefaktów zgodność bundled-channel, offline'owe fixture'y pluginów oraz Telegram
package QA względem tego samego rozwiązanego tarballa. Jest to natywny dla GitHub
zamiennik większości pokrycia pakietów/aktualizacji, które wcześniej wymagało
Parallels. Sprawdzenia wydaniowe cross-OS nadal mają znaczenie dla specyficznego dla OS onboardingu,
instalatora i zachowania platformy, ale walidacja produktu pakietu/aktualizacji powinna
preferować Package Acceptance.

Łagodność starszego package-acceptance jest celowo ograniczona czasowo. Pakiety do
`2026.4.25` mogą używać ścieżki zgodności dla luk metadanych już opublikowanych
do npm: prywatne wpisy inwentarza QA brakujące w tarballu, brakujące
`gateway install --wrapper`, brakujące pliki łatek w fixture git pochodzącym z tarballa,
brak utrwalonego `update.channel`, starsze lokalizacje rekordów instalacji pluginów,
brak utrwalania rekordów instalacji marketplace oraz migracja metadanych konfiguracji
podczas `plugins update`. Opublikowany pakiet `2026.4.26` może ostrzegać
dla lokalnych plików stempli metadanych builda, które zostały już wysłane. Późniejsze pakiety
muszą spełniać nowoczesne kontrakty pakietów; te same luki powodują niepowodzenie walidacji
wydania.

Użyj szerszych profili Package Acceptance, gdy pytanie wydaniowe dotyczy
rzeczywistego instalowalnego pakietu:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

Typowe profile pakietów:

- `smoke`: szybkie ścieżki instalacji pakietu/kanału/agenta, sieci Gateway i przeładowania
  konfiguracji
- `package`: kontrakty instalacji/aktualizacji/pakietów pluginów bez live ClawHub; to jest domyślne
  sprawdzenie wydaniowe
- `product`: `package` plus kanały MCP, czyszczenie cron/subagent, wyszukiwanie webowe OpenAI
  i OpenWebUI
- `full`: wydaniowe fragmenty Docker z OpenWebUI
- `custom`: dokładna lista `docker_lanes` do ukierunkowanych ponownych uruchomień

Dla dowodu Telegram kandydata pakietu włącz `telegram_mode=mock-openai` albo
`telegram_mode=live-frontier` w Package Acceptance. Przepływ przekazuje
rozwiązany tarball `package-under-test` do ścieżki Telegram; samodzielny
przepływ Telegram nadal akceptuje opublikowaną specyfikację npm do sprawdzeń po publikacji.

## Dane wejściowe przepływu NPM

`OpenClaw NPM Release` przyjmuje te dane wejściowe kontrolowane przez operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1` albo
  `v2026.4.2-beta.1`; gdy `preflight_only=true`, może to być także bieżący
  pełny 40-znakowy SHA commita gałęzi przepływu do preflightu wyłącznie walidacyjnego
- `preflight_only`: `true` dla samej walidacji/builda/pakietu, `false` dla
  rzeczywistej ścieżki publikacji
- `preflight_run_id`: wymagane na rzeczywistej ścieżce publikacji, aby przepływ ponownie użył
  przygotowanego tarballa z udanego uruchomienia preflight
- `npm_dist_tag`: docelowy tag npm dla ścieżki publikacji; domyślnie `beta`

`OpenClaw Release Checks` przyjmuje te dane wejściowe kontrolowane przez operatora:

- `ref`: gałąź, tag albo pełny SHA commita do zwalidowania. Sprawdzenia używające sekretów
  wymagają, aby rozwiązany commit był osiągalny z gałęzi OpenClaw albo
  tagu wydania.

Reguły:

- Stabilne tagi i tagi poprawek mogą publikować do `beta` albo `latest`
- Tagi przedwydań beta mogą publikować tylko do `beta`
- Dla `OpenClaw NPM Release` wejście pełnego SHA commita jest dozwolone tylko wtedy, gdy
  `preflight_only=true`
- `OpenClaw Release Checks` i `Full Release Validation` są zawsze
  wyłącznie walidacyjne
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, którego użyto podczas preflightu;
  przepływ weryfikuje te metadane przed kontynuacją publikacji

## Sekwencja stabilnego wydania npm

Podczas przygotowywania stabilnego wydania npm:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`
   - Zanim istnieje tag, możesz użyć bieżącego pełnego SHA commita gałęzi przepływu
     do walidacyjnego suchego przebiegu przepływu preflight
2. Wybierz `npm_dist_tag=beta` dla zwykłego przepływu najpierw-beta albo `latest` tylko
   wtedy, gdy celowo chcesz bezpośrednio opublikować stabilne wydanie
3. Uruchom `Full Release Validation` na gałęzi wydania, tagu wydania albo pełnym
   SHA commita, gdy chcesz zwykłego CI plus pokrycia live prompt cache, Docker, QA Lab,
   Matrix i Telegram z jednego ręcznego przepływu
4. Jeśli celowo potrzebujesz tylko deterministycznego zwykłego grafu testów, uruchom
   ręczny przepływ `CI` na ref wydania
5. Zapisz udany `preflight_run_id`
6. Uruchom `OpenClaw NPM Release` ponownie z `preflight_only=false`, tym samym
   `tag`, tym samym `npm_dist_tag` i zapisanym `preflight_run_id`
7. Jeśli wydanie trafiło na `beta`, użyj prywatnego przepływu
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   aby wypromować tę stabilną wersję z `beta` do `latest`
8. Jeśli wydanie celowo opublikowano bezpośrednio do `latest`, a `beta`
   ma natychmiast wskazywać ten sam stabilny build, użyj tego samego prywatnego
   przepływu, aby skierować oba dist-tagi na stabilną wersję, albo pozwól jego zaplanowanej
   samonaprawiającej synchronizacji przenieść `beta` później

Mutacja dist-tag znajduje się w prywatnym repozytorium ze względów bezpieczeństwa, ponieważ nadal
wymaga `NPM_TOKEN`, podczas gdy repozytorium publiczne utrzymuje publikowanie wyłącznie przez OIDC.

Dzięki temu zarówno bezpośrednia ścieżka publikacji, jak i ścieżka promocji najpierw-beta
pozostają udokumentowane i widoczne dla operatora.

Jeśli opiekun musi awaryjnie użyć lokalnego uwierzytelniania npm, uruchamiaj wszystkie polecenia CLI 1Password (`op`) tylko w dedykowanej sesji tmux. Nie wywołuj `op` bezpośrednio z głównej powłoki agenta; utrzymanie go w tmux sprawia, że monity, alerty i obsługa OTP są obserwowalne oraz zapobiega powtarzającym się alertom hosta.

## Publiczne odwołania

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Opiekunowie używają prywatnej dokumentacji wydań w
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
jako właściwej instrukcji operacyjnej.

## Powiązane

- [Kanały wydań](/pl/install/development-channels)
