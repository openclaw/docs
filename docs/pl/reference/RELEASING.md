---
read_when:
    - Szukam definicji publicznych kanałów wydań
    - Uruchamianie walidacji wydania lub akceptacji pakietu
    - Szukasz nazewnictwa wersji i harmonogramu wydań
summary: Ścieżki wydań, lista kontrolna operatora, środowiska walidacyjne, nazewnictwo wersji i harmonogram
title: Polityka wydań
x-i18n:
    generated_at: "2026-05-01T10:01:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfe579099a9580e2d0400cd0b24f26d3fa3ee917899423604ebc13aa2519b4ee
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ma trzy publiczne ścieżki wydań:

- stable: wydania oznaczone tagami, które domyślnie publikują do npm `beta`, albo do npm `latest`, gdy zostanie to wyraźnie zażądane
- beta: tagi przedpremierowe, które publikują do npm `beta`
- dev: ruchoma głowica `main`

## Nazewnictwo wersji

- Wersja wydania stabilnego: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Wersja stabilnego wydania poprawkowego: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Wersja przedpremierowa beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Nie dodawaj zer wiodących do miesiąca ani dnia
- `latest` oznacza bieżące promowane stabilne wydanie npm
- `beta` oznacza bieżący cel instalacji beta
- Wydania stabilne i stabilne wydania poprawkowe domyślnie publikują do npm `beta`; operatorzy wydania mogą jawnie wskazać `latest` albo później promować sprawdzoną kompilację beta
- Każde stabilne wydanie OpenClaw dostarcza razem pakiet npm i aplikację macOS;
  wydania beta zwykle najpierw weryfikują i publikują ścieżkę npm/pakietu, a
  budowanie/podpisywanie/notaryzację aplikacji na Maca rezerwują dla wydań stabilnych, chyba że zostanie to wyraźnie zażądane

## Rytm wydań

- Wydania przechodzą najpierw przez beta
- Stabilne wydanie następuje dopiero po zweryfikowaniu najnowszej wersji beta
- Maintainerzy zwykle przygotowują wydania z gałęzi `release/YYYY.M.D` utworzonej
  z bieżącego `main`, aby walidacja wydania i poprawki nie blokowały nowego
  rozwoju na `main`
- Jeśli tag beta został wypchnięty lub opublikowany i wymaga poprawki, maintainerzy tworzą
  następny tag `-beta.N` zamiast usuwać lub odtwarzać stary tag beta
- Szczegółowa procedura wydania, zgody, poświadczenia i notatki dotyczące odzyskiwania są
  dostępne tylko dla maintainerów

## Lista kontrolna operatora wydania

Ta lista kontrolna pokazuje publiczny kształt przepływu wydania. Prywatne poświadczenia,
podpisywanie, notaryzacja, odzyskiwanie dist-tag i szczegóły awaryjnego wycofania pozostają w
runbooku wydawniczym dostępnym tylko dla maintainerów.

1. Zacznij od bieżącego `main`: pobierz najnowsze zmiany, potwierdź, że docelowy commit został wypchnięty,
   i potwierdź, że bieżące CI `main` jest wystarczająco zielone, aby utworzyć z niego gałąź.
2. Przepisz najwyższą sekcję `CHANGELOG.md` na podstawie rzeczywistej historii commitów za pomocą
   `/changelog`, zachowaj wpisy zorientowane na użytkownika, zacommituj ją, wypchnij i wykonaj rebase/pull
   jeszcze raz przed utworzeniem gałęzi.
3. Przejrzyj rekordy kompatybilności wydania w
   `src/plugins/compat/registry.ts` i
   `src/commands/doctor/shared/deprecation-compat.ts`. Usuwaj wygasłą
   kompatybilność tylko wtedy, gdy ścieżka aktualizacji pozostaje objęta obsługą, albo zapisz, dlaczego jest
   celowo utrzymywana.
4. Utwórz `release/YYYY.M.D` z bieżącego `main`; nie wykonuj zwykłych prac wydawniczych
   bezpośrednio na `main`.
5. Podbij każdą wymaganą lokalizację wersji dla zamierzonego tagu, a następnie uruchom
   lokalny deterministyczny preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` oraz `pnpm release:check`.
6. Uruchom `OpenClaw NPM Release` z `preflight_only=true`. Zanim tag istnieje,
   pełny 40-znakowy SHA gałęzi wydania jest dozwolony dla preflight tylko walidacyjnego.
   Zapisz pomyślny `preflight_run_id`.
7. Uruchom wszystkie testy przedwydaniowe za pomocą `Full Release Validation` dla
   gałęzi wydania, tagu albo pełnego SHA commita. To jest jedyny ręczny punkt wejścia
   dla czterech dużych maszyn testowych wydania: Vitest, Docker, QA Lab i Package.
8. Jeśli walidacja się nie powiedzie, napraw problem na gałęzi wydania i uruchom ponownie najmniejszy nieudany
   plik, ścieżkę, zadanie workflow, profil pakietu, dostawcę albo listę dozwolonych modeli, które
   potwierdzają poprawkę. Uruchamiaj ponownie pełny parasol tylko wtedy, gdy zmieniony zakres powoduje,
   że wcześniejsze dowody są nieaktualne.
9. Dla beta oznacz tagiem `vYYYY.M.D-beta.N`, opublikuj z dist-tag npm `beta`, a następnie uruchom
   powydaniową akceptację pakietu względem opublikowanego pakietu `openclaw@YYYY.M.D-beta.N`
   albo `openclaw@beta`. Jeśli wypchnięta lub opublikowana beta wymaga poprawki, utwórz
   następny `-beta.N`; nie usuwaj ani nie przepisuj starej bety.
10. Dla wydania stabilnego kontynuuj dopiero po tym, jak sprawdzona beta lub kandydat do wydania ma
    wymagane dowody walidacji. Stabilna publikacja npm ponownie używa pomyślnego
    artefaktu preflight przez `preflight_run_id`; gotowość stabilnego wydania macOS
    wymaga również spakowanych `.zip`, `.dmg`, `.dSYM.zip` oraz zaktualizowanego
    `appcast.xml` na `main`.
11. Po publikacji uruchom weryfikator npm po publikacji, opcjonalne samodzielne
    E2E Telegram z opublikowanego npm, gdy potrzebujesz powydaniowego potwierdzenia kanału,
    promocję dist-tag, gdy jest potrzebna, notatki wydania/przedpremierowe GitHub z
    pełnej pasującej sekcji `CHANGELOG.md` oraz kroki ogłoszenia wydania.

## Preflight wydania

- Uruchom `pnpm check:test-types` przed wstępną kontrolą wydania, aby testowy TypeScript pozostał objęty sprawdzaniem poza szybszą lokalną bramką `pnpm check`
- Uruchom `pnpm check:architecture` przed wstępną kontrolą wydania, aby szersze kontrole cykli importów i granic architektury były zielone poza szybszą lokalną bramką
- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane artefakty wydania `dist/*` i pakiet Control UI istniały na potrzeby kroku walidacji pakowania
- Uruchom ręczny workflow `Full Release Validation` przed zatwierdzeniem wydania, aby zainicjować wszystkie przedwydaniowe pola testowe z jednego punktu wejścia. Przyjmuje gałąź, tag albo pełny SHA commita, uruchamia ręcznie `CI` oraz uruchamia `OpenClaw Release Checks` dla smoke testu instalacji, akceptacji pakietu, zestawów ścieżki wydania Dockera, live/E2E, OpenWebUI, parytetu QA Lab, Matrix i ścieżek Telegram. Podaj `npm_telegram_package_spec` dopiero po opublikowaniu pakietu, gdy po publikacji ma też zostać uruchomione Telegram E2E. Podaj `evidence_package_spec`, gdy prywatny raport dowodowy ma potwierdzić, że walidacja odpowiada opublikowanemu pakietowi npm bez wymuszania Telegram E2E.
  Przykład:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Uruchom ręczny workflow `Package Acceptance`, gdy potrzebujesz dowodu kanałem bocznym dla kandydata pakietu, podczas gdy prace nad wydaniem trwają dalej. Użyj `source=npm` dla `openclaw@beta`, `openclaw@latest` albo dokładnej wersji wydania; `source=ref`, aby spakować zaufaną gałąź/tag/SHA `package_ref` z aktualnym zestawem `workflow_ref`; `source=url` dla tarballa HTTPS z wymaganym SHA-256; albo `source=artifact` dla tarballa przesłanego przez inny przebieg GitHub Actions. Workflow rozwiązuje kandydata do `package-under-test`, ponownie używa harmonogramu wydania Docker E2E wobec tego tarballa i może uruchomić Telegram QA wobec tego samego tarballa z `telegram_mode=mock-openai` albo `telegram_mode=live-frontier`. Gdy wybrane ścieżki Dockera obejmują `published-upgrade-survivor`, artefakt pakietu jest kandydatem, a `published_upgrade_survivor_baseline` wybiera opublikowaną bazę.
  Przykład: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Typowe profile:
  - `smoke`: ścieżki instalacji/kanału/agenta, sieci Gateway i przeładowania konfiguracji
  - `package`: natywne dla artefaktu ścieżki pakietu/aktualizacji/pluginu bez OpenWebUI ani live ClawHub
  - `product`: profil pakietu plus kanały MCP, czyszczenie cron/subagent, wyszukiwanie internetowe OpenAI i OpenWebUI
  - `full`: fragmenty ścieżki wydania Dockera z OpenWebUI
  - `custom`: dokładny wybór `docker_lanes` dla ukierunkowanego ponownego uruchomienia
- Uruchom ręczny workflow `CI` bezpośrednio, gdy potrzebujesz tylko pełnego normalnego pokrycia CI dla kandydata wydania. Ręczne uruchomienia CI omijają zawężanie według zmian i wymuszają ścieżki shardów Linux Node, shardów dołączonych pluginów, kontraktów kanałów, zgodności Node 22, `check`, `check-additional`, smoke testu budowania, kontroli dokumentacji, Python skills, Windows, macOS, Android i i18n Control UI.
  Przykład: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Uruchom `pnpm qa:otel:smoke` podczas walidacji telemetrii wydania. Testuje QA-lab przez lokalny odbiornik OTLP/HTTP i weryfikuje eksportowane nazwy spanów trace, ograniczone atrybuty oraz redakcję treści/identyfikatorów bez wymagania Opik, Langfuse ani innego zewnętrznego kolektora.
- Uruchom `pnpm release:check` przed każdym tagowanym wydaniem
- Kontrole wydania działają teraz w osobnym ręcznym workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` uruchamia także bramkę parytetu mock QA Lab oraz szybki profil live Matrix i ścieżkę Telegram QA przed zatwierdzeniem wydania. Ścieżki live używają środowiska `qa-live-shared`; Telegram używa także dzierżaw poświadczeń Convex CI. Uruchom ręczny workflow `QA-Lab - All Lanes` z `matrix_profile=all` i `matrix_shards=true`, gdy chcesz uzyskać pełny spis transportu, mediów i E2EE Matrix równolegle.
- Walidacja środowiska uruchomieniowego instalacji i aktualizacji między systemami operacyjnymi jest częścią publicznych `OpenClaw Release Checks` i `Full Release Validation`, które wywołują bezpośrednio wielokrotnego użytku workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Ten podział jest celowy: utrzymuje rzeczywistą ścieżkę wydania npm krótką, deterministyczną i skupioną na artefaktach, podczas gdy wolniejsze kontrole live pozostają we własnej ścieżce, aby nie opóźniały ani nie blokowały publikacji
- Kontrole wydania zawierające sekrety powinny być uruchamiane przez `Full Release Validation` albo z referencji workflow `main`/release, aby logika workflow i sekrety pozostały kontrolowane
- `OpenClaw Release Checks` akceptuje gałąź, tag albo pełny SHA commita, o ile rozwiązany commit jest osiągalny z gałęzi OpenClaw albo tagu wydania
- Wstępna kontrola `OpenClaw NPM Release` tylko do walidacji akceptuje również bieżący pełny 40-znakowy SHA commita gałęzi workflow bez wymagania wypchniętego tagu
- Ta ścieżka SHA służy wyłącznie do walidacji i nie może zostać awansowana do rzeczywistej publikacji
- W trybie SHA workflow syntetyzuje `v<package.json version>` tylko na potrzeby kontroli metadanych pakietu; rzeczywista publikacja nadal wymaga prawdziwego tagu wydania
- Oba workflow utrzymują rzeczywistą ścieżkę publikacji i promocji na runnerach hostowanych przez GitHub, podczas gdy niemodyfikująca ścieżka walidacji może używać większych runnerów Blacksmith Linux
- Ten workflow uruchamia
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  z użyciem sekretów workflow `OPENAI_API_KEY` i `ANTHROPIC_API_KEY`
- Wstępna kontrola wydania npm nie czeka już na osobną ścieżkę kontroli wydania
- Uruchom `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (albo odpowiadający tag beta/poprawki) przed zatwierdzeniem
- Po publikacji npm uruchom
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (albo odpowiadającą wersję beta/poprawki), aby zweryfikować ścieżkę instalacji opublikowanego rejestru w świeżym tymczasowym prefiksie
- Po publikacji beta uruchom `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`, aby zweryfikować onboarding zainstalowanego pakietu, konfigurację Telegram i rzeczywiste Telegram E2E wobec opublikowanego pakietu npm z użyciem współdzielonej puli dzierżawionych poświadczeń Telegram. Jednorazowe lokalne uruchomienia maintainerów mogą pominąć zmienne Convex i przekazać trzy poświadczenia środowiskowe `OPENCLAW_QA_TELEGRAM_*` bezpośrednio.
- Maintainerzy mogą uruchomić tę samą kontrolę po publikacji z GitHub Actions przez ręczny workflow `NPM Telegram Beta E2E`. Jest celowo wyłącznie ręczny i nie uruchamia się przy każdym scaleniu.
- Automatyzacja wydań maintainerów używa teraz modelu wstępna kontrola, potem promocja:
  - rzeczywista publikacja npm musi przejść pomyślny `preflight_run_id` npm
  - rzeczywista publikacja npm musi zostać uruchomiona z tej samej gałęzi `main` albo `release/YYYY.M.D`, co udany przebieg wstępnej kontroli
  - stabilne wydania npm domyślnie wskazują `beta`
  - stabilna publikacja npm może jawnie wskazać `latest` przez wejście workflow
  - mutacja tokenowego npm dist-tag znajduje się teraz w `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` ze względów bezpieczeństwa, ponieważ `npm dist-tag add` nadal wymaga `NPM_TOKEN`, podczas gdy publiczne repo zachowuje publikację wyłącznie OIDC
  - publiczny `macOS Release` służy wyłącznie do walidacji; gdy tag istnieje tylko na gałęzi wydania, ale workflow jest uruchamiany z `main`, ustaw `public_release_branch=release/YYYY.M.D`
  - rzeczywista prywatna publikacja mac musi przejść pomyślny prywatny mac `preflight_run_id` i `validate_run_id`
  - rzeczywiste ścieżki publikacji promują przygotowane artefakty zamiast budować je ponownie
- Dla stabilnych wydań poprawek, takich jak `YYYY.M.D-N`, weryfikator po publikacji sprawdza też tę samą ścieżkę aktualizacji w tymczasowym prefiksie z `YYYY.M.D` do `YYYY.M.D-N`, aby poprawki wydania nie mogły po cichu pozostawić starszych globalnych instalacji na bazowym stabilnym ładunku
- Wstępna kontrola wydania npm kończy się niepowodzeniem w sposób zamknięty, chyba że tarball zawiera zarówno `dist/control-ui/index.html`, jak i niepusty ładunek `dist/control-ui/assets/`, abyśmy ponownie nie wysłali pustego panelu przeglądarkowego
- Weryfikacja po publikacji sprawdza także, czy opublikowana instalacja z rejestru zawiera niepuste zależności uruchomieniowe dołączonych pluginów w głównym układzie `dist/*`. Wydanie dostarczone z brakującymi lub pustymi ładunkami zależności dołączonych pluginów nie przechodzi weryfikatora po publikacji i nie może zostać awansowane do `latest`.
- `pnpm test:install:smoke` egzekwuje również budżet `unpackedSize` pakietu npm wobec tarballa kandydata aktualizacji, więc installer e2e wychwytuje przypadkowe rozdęcie pakietu przed ścieżką publikacji wydania
- Jeśli prace nad wydaniem dotknęły planowania CI, manifestów czasowych rozszerzeń albo macierzy testów rozszerzeń, wygeneruj ponownie i przejrzyj należące do planera wyjścia macierzy `plugin-prerelease-extension-shard` z `.github/workflows/plugin-prerelease.yml` przed zatwierdzeniem, aby informacje o wydaniu nie opisywały nieaktualnego układu CI
- Gotowość stabilnego wydania macOS obejmuje też powierzchnie aktualizatora:
  - wydanie GitHub musi ostatecznie zawierać spakowane `.zip`, `.dmg` i `.dSYM.zip`
  - `appcast.xml` na `main` musi po publikacji wskazywać nowy stabilny zip
  - spakowana aplikacja musi zachować niedebugowy identyfikator pakietu, niepusty URL feedu Sparkle oraz `CFBundleVersion` równy lub wyższy od kanonicznego minimalnego buildu Sparkle dla tej wersji wydania

## Pola testowe wydania

`Full Release Validation` to sposób, w jaki operatorzy inicjują wszystkie testy przedwydaniowe z jednego punktu wejścia. Uruchom go z zaufanej referencji workflow `main` i przekaż gałąź wydania, tag albo pełny SHA commita jako `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow rozwiązuje docelową referencję, uruchamia ręczne `CI` z `target_ref=<release-ref>`, uruchamia `OpenClaw Release Checks` i opcjonalnie uruchamia samodzielne Telegram E2E po publikacji, gdy ustawione jest `npm_telegram_package_spec`. `OpenClaw Release Checks` następnie rozdziela się na smoke test instalacji, międzyplatformowe kontrole wydania, pokrycie ścieżki wydania Docker live/E2E, Package Acceptance z QA pakietu Telegram, parytet QA Lab, live Matrix i live Telegram. Pełny przebieg jest akceptowalny tylko wtedy, gdy podsumowanie `Full Release Validation` pokazuje `normal_ci` i `release_checks` jako udane, a każde opcjonalne dziecko `npm_telegram` jest udane albo celowo pominięte. Końcowe podsumowanie weryfikatora zawiera tabele najwolniejszych zadań dla każdego przebiegu podrzędnego, aby release manager mógł zobaczyć aktualną ścieżkę krytyczną bez pobierania logów.
Zobacz [Pełna walidacja wydania](/pl/reference/full-release-validation), aby uzyskać kompletną macierz etapów, dokładne nazwy zadań workflow, różnice między profilami stabilnym i pełnym, artefakty oraz uchwyty do ukierunkowanego ponownego uruchomienia.
Workflow podrzędne są uruchamiane z zaufanej referencji, która uruchamia `Full Release Validation`, zwykle `--ref main`, nawet gdy docelowy `ref` wskazuje starszą gałąź wydania albo tag. Nie ma osobnego wejścia referencji workflow Full Release Validation; wybierz zaufany zestaw, wybierając referencję przebiegu workflow.

Użyj `release_profile`, aby wybrać zakres live/providera:

- `minimum`: najszybsza krytyczna dla wydania ścieżka OpenAI/core live i Docker
- `stable`: minimum plus stabilne pokrycie provider/backend do zatwierdzenia wydania
- `full`: stable plus szerokie pokrycie doradcze provider/media

`OpenClaw Release Checks` używa zaufanego odwołania workflow do jednokrotnego rozwiązania docelowego
odwołania jako `release-package-under-test` i ponownie używa tego artefaktu zarówno w
sprawdzeniach Dockera dla ścieżki wydania, jak i w Akceptacji pakietu. Dzięki temu wszystkie
środowiska dotyczące pakietu pracują na tych samych bajtach i unika się wielokrotnego budowania pakietu.
Cross-OS smoke test instalacji OpenAI używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy ustawiona jest
zmienna repozytorium/organizacji, w przeciwnym razie `openai/gpt-5.4-mini`, ponieważ ta ścieżka
potwierdza instalację pakietu, onboarding, uruchomienie gatewaya i jedną żywą turę agenta,
a nie benchmark najwolniejszego modelu domyślnego. Szersza macierz żywych providerów
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
zawiedzie, użyj nieudanego workflow podrzędnego, zadania, ścieżki Dockera, profilu pakietu, providera
modelu lub ścieżki QA jako kolejnego potwierdzenia. Uruchom pełny parasol ponownie tylko wtedy, gdy
poprawka zmieniła współdzieloną orkiestrację wydania albo sprawiła, że wcześniejsze dowody ze wszystkich środowisk
stały się nieaktualne. Końcowy weryfikator parasola ponownie sprawdza zapisane identyfikatory uruchomień
workflow podrzędnych, więc po pomyślnym ponownym uruchomieniu workflow podrzędnego uruchom ponownie tylko nieudane
zadanie nadrzędne `Verify full validation`.

Dla ograniczonego odzyskiwania przekaż `rerun_group` do parasola. `all` to właściwe
uruchomienie kandydata do wydania, `ci` uruchamia tylko zwykłe podrzędne CI, `plugin-prerelease`
uruchamia tylko podrzędne zadanie pluginu właściwe dla wydania, `release-checks` uruchamia każde środowisko
wydania, a węższe grupy wydania to `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` i `npm-telegram`, gdy
dostarczona jest samodzielna ścieżka pakietu Telegram.

### Vitest

Środowisko Vitest to ręczny podrzędny workflow `CI`. Ręczne CI celowo
pomija zakresowanie zmian i wymusza zwykły graf testów dla kandydata
do wydania: shardy Linux Node, shardy bundled-plugin, kontrakty kanałów, zgodność z Node 22,
`check`, `check-additional`, smoke test buildu, sprawdzenia dokumentacji, Python
skills, Windows, macOS, Android i i18n Control UI.

Użyj tego środowiska, aby odpowiedzieć na pytanie „czy drzewo źródeł przeszło pełny normalny zestaw testów?”.
Nie jest to to samo co walidacja produktu na ścieżce wydania. Dowody do zachowania:

- podsumowanie `Full Release Validation` pokazujące URL uruchomionego `CI`
- zielone uruchomienie `CI` na dokładnym docelowym SHA
- nazwy nieudanych lub wolnych shardów z zadań CI podczas badania regresji
- artefakty czasów Vitest, takie jak `.artifacts/vitest-shard-timings.json`, gdy
  uruchomienie wymaga analizy wydajności

Uruchamiaj ręczne CI bezpośrednio tylko wtedy, gdy wydanie potrzebuje deterministycznego zwykłego CI, ale
nie środowisk Dockera, QA Lab, live, cross-OS ani pakietowych:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Środowisko Docker znajduje się w `OpenClaw Release Checks` przez
`openclaw-live-and-e2e-checks-reusable.yml` oraz workflow `install-smoke`
w trybie wydania. Waliduje ono kandydata do wydania przez spakowane
środowiska Dockera, a nie tylko testy na poziomie źródeł.

Pokrycie Dockera dla wydania obejmuje:

- pełny smoke test instalacji z włączonym wolnym smoke testem globalnej instalacji Bun
- przygotowanie/ponowne użycie obrazu smoke głównego Dockerfile według docelowego SHA, z zadaniami QR,
  root/gateway oraz installer/Bun smoke uruchamianymi jako osobne shardy install-smoke
- ścieżki E2E repozytorium
- części Dockera dla ścieżki wydania: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, `plugins-runtime-install-h`,
  `bundled-channels-core`, `bundled-channels-update-a`,
  `bundled-channels-update-discord`, `bundled-channels-update-b` i
  `bundled-channels-contracts`
- pokrycie OpenWebUI wewnątrz części `plugins-runtime-services`, gdy jest wymagane
- podzielone ścieżki zależności bundled-channel na channel-smoke, update-target
  i części kontraktów setup/runtime zamiast jednego dużego zadania bundled-channel
- podzielone ścieżki instalacji/deinstalacji bundled pluginów
  od `bundled-plugin-install-uninstall-0` do
  `bundled-plugin-install-uninstall-23`
- zestawy live/E2E providerów oraz pokrycie modeli Docker live, gdy sprawdzenia wydania
  obejmują zestawy live

Użyj artefaktów Dockera przed ponownym uruchomieniem. Harmonogram ścieżki wydania przesyła
`.artifacts/docker-tests/` z logami ścieżek, `summary.json`, `failures.json`,
czasami faz, JSON-em planu harmonogramu i poleceniami ponownego uruchomienia. Do ukierunkowanego odzyskiwania
użyj `docker_lanes=<lane[,lane]>` w wielokrotnego użytku workflow live/E2E zamiast
ponownie uruchamiać wszystkie części wydania. Wygenerowane polecenia ponownego uruchomienia zawierają wcześniejsze
`package_artifact_run_id` i przygotowane wejścia obrazu Dockera, gdy są dostępne, więc
nieudana ścieżka może ponownie użyć tego samego tarballa i obrazów GHCR.

### QA Lab

Środowisko QA Lab jest także częścią `OpenClaw Release Checks`. Jest to bramka wydania
dla zachowania agentowego i poziomu kanałów, oddzielna od mechaniki pakietów Vitest i Docker.

Pokrycie QA Lab dla wydania obejmuje:

- bramkę parytetu mock porównującą kandydującą ścieżkę OpenAI z bazą Opus 4.6
  przy użyciu agentowego pakietu parytetu
- szybki profil live Matrix QA używający środowiska `qa-live-shared`
- ścieżkę live Telegram QA używającą dzierżaw poświadczeń Convex CI
- `pnpm qa:otel:smoke`, gdy telemetria wydania wymaga jawnego lokalnego potwierdzenia

Użyj tego środowiska, aby odpowiedzieć na pytanie „czy wydanie zachowuje się poprawnie w scenariuszach QA i
przepływach kanałów live?” Zachowaj URL-e artefaktów dla ścieżek parytetu, Matrix i Telegram
podczas zatwierdzania wydania. Pełne pokrycie Matrix pozostaje dostępne jako
ręczny shardowany przebieg QA-Lab, a nie domyślna ścieżka krytyczna dla wydania.

### Pakiet

Środowisko pakietu jest bramką produktu instalowalnego. Jest obsługiwane przez
`Package Acceptance` i resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver normalizuje
kandydata do tarballa `package-under-test` konsumowanego przez Docker E2E, waliduje
inwentarz pakietu, zapisuje wersję pakietu i SHA-256 oraz utrzymuje
odwołanie uprzęży workflow oddzielnie od odwołania źródła pakietu.

Obsługiwane źródła kandydatów:

- `source=npm`: `openclaw@beta`, `openclaw@latest` albo dokładna wersja wydania OpenClaw
- `source=ref`: spakuj zaufaną gałąź `package_ref`, tag albo pełne SHA commita
  z wybraną uprzężą `workflow_ref`
- `source=url`: pobierz HTTPS `.tgz` z wymaganym `package_sha256`
- `source=artifact`: ponownie użyj `.tgz` przesłanego przez inne uruchomienie GitHub Actions

`OpenClaw Release Checks` uruchamia Akceptację pakietu z `source=ref`,
`package_ref=<release-ref>`, `suite_profile=custom`,
`docker_lanes=bundled-channel-deps-compat plugins-offline` i
`telegram_mode=mock-openai`. Części Dockera na ścieżce wydania pokrywają
nakładające się ścieżki instalacji, aktualizacji i aktualizacji pluginów; Akceptacja pakietu zachowuje
natywną dla artefaktów zgodność bundled-channel, offline fixtures pluginów oraz pakietowe QA Telegram
wobec tego samego rozwiązanego tarballa. Jest to natywny dla GitHuba
zamiennik większości pokrycia pakiet/aktualizacja, które wcześniej wymagało
Parallels. Cross-OS checks wydania nadal mają znaczenie dla onboardingu,
instalatora i zachowania platformy specyficznych dla OS, ale walidacja produktu pakiet/aktualizacja powinna
preferować Akceptację pakietu.

Dziedziczna pobłażliwość package-acceptance jest celowo ograniczona czasowo. Pakiety do
`2026.4.25` mogą używać ścieżki zgodności dla luk metadanych już opublikowanych
w npm: prywatnych wpisów inwentarza QA brakujących w tarballu, brakującego
`gateway install --wrapper`, brakujących plików łatek w fixture git pochodzącym z tarballa,
brakującego utrwalonego `update.channel`, dziedzicznych lokalizacji rekordów instalacji pluginów,
brakującego utrwalania rekordów instalacji marketplace oraz migracji metadanych konfiguracji
podczas `plugins update`. Opublikowany pakiet `2026.4.26` może ostrzegać
o lokalnych plikach znaczników metadanych buildu, które zostały już wydane. Późniejsze pakiety
muszą spełniać nowoczesne kontrakty pakietów; te same luki powodują niepowodzenie walidacji
wydania.

Używaj szerszych profili Akceptacji pakietu, gdy pytanie wydania dotyczy
rzeczywistego instalowalnego pakietu:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Typowe profile pakietów:

- `smoke`: szybkie ścieżki instalacji pakietu/kanału/agenta, sieci gatewaya i
  przeładowania konfiguracji
- `package`: kontrakty instalacji/aktualizacji/pakietów pluginów bez live ClawHub; to jest domyślna wartość
  release-check
- `product`: `package` plus kanały MCP, czyszczenie cron/subagent, wyszukiwanie webowe OpenAI
  i OpenWebUI
- `full`: części ścieżki wydania Docker z OpenWebUI
- `custom`: dokładna lista `docker_lanes` dla ukierunkowanych ponownych uruchomień

Dla pakietowego potwierdzenia Telegram kandydata włącz `telegram_mode=mock-openai` albo
`telegram_mode=live-frontier` w Akceptacji pakietu. Workflow przekazuje
rozwiązany tarball `package-under-test` do ścieżki Telegram; samodzielny
workflow Telegram nadal akceptuje opublikowaną specyfikację npm dla sprawdzeń po publikacji.

## Wejścia workflow NPM

`OpenClaw NPM Release` akceptuje te wejścia kontrolowane przez operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1` albo
  `v2026.4.2-beta.1`; gdy `preflight_only=true`, może to być także obecne
  pełne 40-znakowe SHA commita gałęzi workflow do preflight wyłącznie walidacyjnego
- `preflight_only`: `true` dla samej walidacji/buildu/pakietu, `false` dla
  rzeczywistej ścieżki publikacji
- `preflight_run_id`: wymagane na rzeczywistej ścieżce publikacji, aby workflow ponownie użył
  przygotowanego tarballa z pomyślnego uruchomienia preflight
- `npm_dist_tag`: docelowy tag npm dla ścieżki publikacji; domyślnie `beta`

`OpenClaw Release Checks` akceptuje te wejścia kontrolowane przez operatora:

- `ref`: gałąź, tag albo pełne SHA commita do walidacji. Sprawdzenia zawierające sekrety
  wymagają, aby rozwiązany commit był osiągalny z gałęzi OpenClaw albo
  tagu wydania.

Zasady:

- Tagi stabilne i korekcyjne mogą publikować do `beta` albo `latest`
- Tagi prerelease beta mogą publikować tylko do `beta`
- Dla `OpenClaw NPM Release` wejście pełnego SHA commita jest dozwolone tylko wtedy, gdy
  `preflight_only=true`
- `OpenClaw Release Checks` i `Full Release Validation` są zawsze
  wyłącznie walidacyjne
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, który był użyty podczas preflight;
  workflow weryfikuje te metadane przed kontynuowaniem publikacji

## Sekwencja stabilnego wydania npm

Podczas przygotowywania stabilnego wydania npm:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`
   - Zanim istnieje tag, możesz użyć bieżącego pełnego SHA commita gałęzi
     workflow do suchego przebiegu walidacyjnego workflow preflight-only
2. Wybierz `npm_dist_tag=beta` dla normalnego przepływu beta-first albo `latest` tylko
   wtedy, gdy celowo chcesz bezpośrednio opublikować stabilne wydanie
3. Uruchom `Full Release Validation` na gałęzi wydania, tagu wydania albo pełnym
   SHA commita, gdy chcesz normalne CI oraz pokrycie live prompt cache, Docker, QA Lab,
   Matrix i Telegram z jednego ręcznego workflow
4. Jeśli celowo potrzebujesz tylko deterministycznego normalnego grafu testów, uruchom
   zamiast tego ręczny workflow `CI` na refie wydania
5. Zapisz pomyślny `preflight_run_id`
6. Uruchom `OpenClaw NPM Release` ponownie z `preflight_only=false`, tym samym
   `tag`, tym samym `npm_dist_tag` i zapisanym `preflight_run_id`
7. Jeśli wydanie trafiło na `beta`, użyj prywatnego workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   aby wypromować tę stabilną wersję z `beta` do `latest`
8. Jeśli wydanie celowo opublikowano bezpośrednio do `latest`, a `beta`
   powinna od razu wskazywać tę samą stabilną kompilację, użyj tego samego prywatnego
   workflow, aby skierować oba dist-tagi na stabilną wersję, albo pozwól jego zaplanowanej
   samonaprawiającej synchronizacji przenieść `beta` później

Mutacja dist-tagów znajduje się w prywatnym repo ze względów bezpieczeństwa, ponieważ nadal
wymaga `NPM_TOKEN`, podczas gdy publiczne repo zachowuje publikowanie wyłącznie przez OIDC.

Dzięki temu zarówno ścieżka bezpośredniej publikacji, jak i ścieżka promocji beta-first
są udokumentowane i widoczne dla operatora.

Jeśli maintainer musi awaryjnie użyć lokalnego uwierzytelniania npm, uruchamiaj wszystkie
polecenia CLI 1Password (`op`) tylko w dedykowanej sesji tmux. Nie wywołuj `op`
bezpośrednio z głównej powłoki agenta; trzymanie go w tmux sprawia, że prompty,
alerty i obsługa OTP są obserwowalne oraz zapobiega powtarzającym się alertom hosta.

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

Maintainerzy używają prywatnej dokumentacji wydań w
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
jako właściwego runbooka.

## Powiązane

- [Kanały wydań](/pl/install/development-channels)
