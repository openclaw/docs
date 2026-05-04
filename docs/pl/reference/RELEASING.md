---
read_when:
    - Wyszukiwanie definicji publicznych kanałów wydań
    - Uruchamianie walidacji wydania lub akceptacji pakietu
    - Szukanie nazewnictwa wersji i cyklu wydań
summary: Ścieżki wydań, lista kontrolna operatora, środowiska walidacyjne, nazewnictwo wersji i kadencja
title: Polityka wydań
x-i18n:
    generated_at: "2026-05-04T07:06:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef50d3ef5d1e23b4e2c2b097fc4ca9f6d46bf8acb9aea0c9bca6d14e213b88b6
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ma trzy publiczne ścieżki wydań:

- stable: oznaczone wydania, które domyślnie publikują do npm `beta`, albo do npm `latest`, gdy zostanie to wyraźnie zażądane
- beta: tagi przedpremierowe, które publikują do npm `beta`
- dev: ruchoma głowica `main`

## Nazewnictwo wersji

- Wersja wydania stabilnego: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Wersja stabilnego wydania poprawkowego: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Wersja przedpremierowa beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Nie dopełniaj miesiąca ani dnia zerami
- `latest` oznacza bieżące promowane stabilne wydanie npm
- `beta` oznacza bieżący cel instalacji beta
- Wydania stabilne i stabilne wydania poprawkowe domyślnie publikują do npm `beta`; operatorzy wydania mogą jawnie wskazać `latest` albo później promować sprawdzony build beta
- Każde stabilne wydanie OpenClaw dostarcza razem pakiet npm i aplikację macOS;
  wydania beta zwykle najpierw walidują i publikują ścieżkę npm/pakietu, a
  build/podpisywanie/notaryzację aplikacji mac rezerwują dla wydań stabilnych, chyba że wyraźnie zażądano inaczej

## Cykl wydań

- Wydania przechodzą najpierw przez beta
- Stable następuje dopiero po zwalidowaniu najnowszej beta
- Maintainerzy zwykle odcinają wydania z gałęzi `release/YYYY.M.D` utworzonej
  z bieżącej `main`, aby walidacja wydania i poprawki nie blokowały nowego
  rozwoju na `main`
- Jeśli tag beta został wypchnięty lub opublikowany i wymaga poprawki, maintainerzy odcinają
  następny tag `-beta.N` zamiast usuwać albo odtwarzać stary tag beta
- Szczegółowa procedura wydania, zatwierdzenia, poświadczenia i notatki odzyskiwania są
  dostępne tylko dla maintainerów

## Lista kontrolna operatora wydania

Ta lista kontrolna pokazuje publiczny kształt przepływu wydania. Prywatne poświadczenia,
podpisywanie, notaryzacja, odzyskiwanie dist-tag i szczegóły awaryjnego rollbacku pozostają w
runbooku wydaniowym dostępnym tylko dla maintainerów.

1. Zacznij od bieżącej `main`: pobierz najnowsze zmiany, potwierdź, że docelowy commit został wypchnięty,
   i potwierdź, że bieżące CI `main` jest wystarczająco zielone, aby utworzyć z niej gałąź.
2. Przepisz górną sekcję `CHANGELOG.md` na podstawie rzeczywistej historii commitów za pomocą
   `/changelog`, zachowaj wpisy skierowane do użytkowników, zatwierdź ją commitem, wypchnij ją i wykonaj rebase/pull
   jeszcze raz przed utworzeniem gałęzi.
3. Przejrzyj rekordy kompatybilności wydania w
   `src/plugins/compat/registry.ts` i
   `src/commands/doctor/shared/deprecation-compat.ts`. Usuwaj wygasłą
   kompatybilność tylko wtedy, gdy ścieżka aktualizacji pozostaje pokryta, albo odnotuj, dlaczego jest
   celowo utrzymywana.
4. Utwórz `release/YYYY.M.D` z bieżącej `main`; nie wykonuj normalnych prac wydaniowych
   bezpośrednio na `main`.
5. Podbij każde wymagane miejsce wersji dla zamierzonego taga, uruchom
   `pnpm plugins:sync`, aby publikowalne pakiety Plugin współdzieliły wersję wydania
   i metadane kompatybilności, a następnie uruchom lokalny deterministyczny preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` i
   `pnpm release:check`.
6. Uruchom `OpenClaw NPM Release` z `preflight_only=true`. Zanim tag istnieje,
   pełny 40-znakowy SHA gałęzi wydania jest dozwolony dla preflight tylko walidacyjnego.
   Zapisz udany `preflight_run_id`.
7. Uruchom wszystkie testy przedwydaniowe za pomocą `Full Release Validation` dla
   gałęzi wydania, taga lub pełnego SHA commita. To jest jedyny ręczny punkt wejścia
   dla czterech dużych skrzynek testowych wydania: Vitest, Docker, QA Lab i Package.
8. Jeśli walidacja się nie powiedzie, napraw na gałęzi wydania i ponownie uruchom najmniejszy nieudany
   plik, ścieżkę, zadanie workflow, profil pakietu, providera lub allowlistę modelu, która
   dowodzi poprawki. Ponownie uruchamiaj pełną parasolową walidację tylko wtedy, gdy zmieniony obszar sprawia,
   że wcześniejsze dowody są nieaktualne.
9. Dla beta oznacz tagiem `vYYYY.M.D-beta.N`, a następnie uruchom `OpenClaw Release Publish` z
   pasującej gałęzi `release/YYYY.M.D`. Weryfikuje `pnpm plugins:sync:check`,
   najpierw publikuje wszystkie publikowalne pakiety Plugin do npm, następnie publikuje ten sam
   zestaw do ClawHub jako tarballe npm-pack ClawPack, a potem promuje
   przygotowany artefakt preflight npm OpenClaw z pasującym dist-tag. Po
   publikacji uruchom akceptację pakietu po publikacji
   względem opublikowanego pakietu `openclaw@YYYY.M.D-beta.N` lub
   `openclaw@beta`. Jeśli wypchnięte lub opublikowane wydanie przedpremierowe wymaga poprawki,
   odetnij następny pasujący numer wydania przedpremierowego; nie usuwaj ani nie przepisuj starego
   wydania przedpremierowego.
10. Dla stable kontynuuj dopiero po tym, jak sprawdzona beta lub release candidate ma
    wymagane dowody walidacji. Publikacja stabilnego npm również przechodzi przez
    `OpenClaw Release Publish`, ponownie używając udanego artefaktu preflight przez
    `preflight_run_id`; gotowość stabilnego wydania macOS wymaga również
    spakowanych `.zip`, `.dmg`, `.dSYM.zip` i zaktualizowanego `appcast.xml` na `main`.
11. Po publikacji uruchom weryfikator npm po publikacji, opcjonalny samodzielny
    opublikowany-npm Telegram E2E, gdy potrzebujesz dowodu kanału po publikacji,
    promocję dist-tag, gdy jest potrzebna, notatki GitHub wydania/wydania przedpremierowego z
    pełnej pasującej sekcji `CHANGELOG.md` oraz kroki ogłoszenia wydania.

## Preflight wydania

- Uruchom `pnpm check:test-types` przed preflightem wydania, aby testowy TypeScript pozostawał objęty sprawdzaniem poza szybszą lokalną bramką `pnpm check`
- Uruchom `pnpm check:architecture` przed preflightem wydania, aby szersze kontrole cykli importów i granic architektury były zielone poza szybszą lokalną bramką
- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane artefakty wydania `dist/*` i pakiet Control UI istniały na potrzeby etapu walidacji pakietu
- Uruchom `pnpm plugins:sync` po podbiciu wersji w katalogu głównym i przed tagowaniem. Aktualizuje wersje publikowalnych pakietów Plugin, metadane zgodności peer/API OpenClaw, metadane builda oraz szkielety changelogów Plugin, aby odpowiadały wersji wydania core. `pnpm plugins:sync:check` to niemutująca osłona wydania; workflow publikowania kończy się niepowodzeniem przed jakąkolwiek mutacją rejestru, jeśli ten krok został pominięty.
- Uruchom ręczny workflow `Full Release Validation` przed zatwierdzeniem wydania, aby z jednego punktu wejścia uruchomić wszystkie przedwydaniowe testboksy. Przyjmuje gałąź, tag lub pełny SHA commita, uruchamia ręczny `CI` oraz uruchamia `OpenClaw Release Checks` dla instalacyjnego smoke testu, akceptacji pakietu, zestawów ścieżki wydania Docker, live/E2E, OpenWebUI, parytetu QA Lab, Matrix i ścieżek Telegram. Przy `release_profile=full` i `rerun_group=all` uruchamia także pakietowe Telegram E2E względem artefaktu `release-package-under-test` z kontroli wydania. Podaj `npm_telegram_package_spec` po publikacji, gdy to samo Telegram E2E ma również potwierdzić opublikowany pakiet npm. Podaj `package_acceptance_package_spec` po publikacji, gdy Package Acceptance ma uruchomić swoją macierz pakietu/aktualizacji względem wysłanego pakietu npm zamiast artefaktu zbudowanego z SHA. Podaj `evidence_package_spec`, gdy prywatny raport dowodowy ma potwierdzić, że walidacja odpowiada opublikowanemu pakietowi npm bez wymuszania Telegram E2E. Przykład:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Uruchom ręczny workflow `Package Acceptance`, gdy chcesz uzyskać dowód kanałem bocznym dla kandydata pakietu, podczas gdy prace nad wydaniem trwają. Użyj `source=npm` dla `openclaw@beta`, `openclaw@latest` lub dokładnej wersji wydania; `source=ref`, aby spakować zaufaną gałąź/tag/SHA `package_ref` z bieżącym harness `workflow_ref`; `source=url` dla archiwum tarball HTTPS z wymaganym SHA-256; albo `source=artifact` dla archiwum tarball przesłanego przez inny przebieg GitHub Actions. Workflow rozwiązuje kandydata do `package-under-test`, ponownie używa harmonogramu wydania Docker E2E względem tego archiwum tarball i może uruchomić QA Telegram względem tego samego archiwum tarball z `telegram_mode=mock-openai` lub `telegram_mode=live-frontier`. Gdy wybrane ścieżki Docker obejmują `published-upgrade-survivor`, artefakt pakietu jest kandydatem, a `published_upgrade_survivor_baseline` wybiera opublikowaną bazę.
  Przykład: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Typowe profile:
  - `smoke`: ścieżki instalacji/kanału/agenta, sieci Gateway i przeładowania konfiguracji
  - `package`: natywne dla artefaktu ścieżki pakietu/aktualizacji/Plugin bez OpenWebUI ani live ClawHub
  - `product`: profil pakietu plus kanały MCP, czyszczenie cron/subagenta, wyszukiwanie webowe OpenAI i OpenWebUI
  - `full`: fragmenty ścieżki wydania Docker z OpenWebUI
  - `custom`: dokładny wybór `docker_lanes` dla ukierunkowanego ponownego uruchomienia
- Uruchom ręczny workflow `CI` bezpośrednio, gdy potrzebujesz tylko pełnego normalnego pokrycia CI dla kandydata wydania. Ręczne uruchomienia CI omijają zakresowanie zmian i wymuszają shardy Linux Node, shardy bundled-plugin, kontrakty kanałów, zgodność Node 22, `check`, `check-additional`, smoke test builda, kontrole dokumentacji, Python skills, Windows, macOS, Android oraz ścieżki i18n Control UI.
  Przykład: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Uruchom `pnpm qa:otel:smoke` podczas walidowania telemetrii wydania. Ćwiczy QA-lab przez lokalny odbiornik OTLP/HTTP i weryfikuje wyeksportowane nazwy spanów śledzenia, ograniczone atrybuty oraz redakcję treści/identyfikatorów bez wymagania Opik, Langfuse ani innego zewnętrznego kolektora.
- Uruchom `pnpm release:check` przed każdym tagowanym wydaniem
- Uruchom `OpenClaw Release Publish` dla mutującej sekwencji publikowania po utworzeniu tagu. Uruchom go z `release/YYYY.M.D` (lub `main`, gdy publikujesz tag osiągalny z main), przekaż tag wydania i zakończony powodzeniem `preflight_run_id` npm OpenClaw oraz zachowaj domyślny zakres publikowania Plugin `all-publishable`, chyba że celowo uruchamiasz ukierunkowaną naprawę. Workflow serializuje publikowanie Plugin do npm, publikowanie Plugin do ClawHub i publikowanie OpenClaw do npm, aby pakiet core nie został opublikowany przed jego zewnętrznymi Plugin.
- Kontrole wydania działają teraz w osobnym ręcznym workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` uruchamia także ścieżkę parytetu mock QA Lab oraz szybki profil live Matrix i ścieżkę QA Telegram przed zatwierdzeniem wydania. Ścieżki live używają środowiska `qa-live-shared`; Telegram używa także dzierżaw poświadczeń Convex CI. Uruchom ręczny workflow `QA-Lab - All Lanes` z `matrix_profile=all` i `matrix_shards=true`, gdy chcesz pełny transport Matrix, media i inwentarz E2EE równolegle.
- Walidacja runtime instalacji i aktualizacji między systemami OS jest częścią publicznych `OpenClaw Release Checks` i `Full Release Validation`, które wywołują bezpośrednio wielokrotnego użytku workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Ten podział jest celowy: utrzymuje rzeczywistą ścieżkę wydania npm krótką, deterministyczną i skoncentrowaną na artefaktach, podczas gdy wolniejsze kontrole live pozostają we własnej ścieżce, aby nie wstrzymywały ani nie blokowały publikacji
- Kontrole wydania przenoszące sekrety powinny być uruchamiane przez `Full Release Validation` albo z referencji workflow `main`/release, aby logika workflow i sekrety pozostały kontrolowane
- `OpenClaw Release Checks` przyjmuje gałąź, tag lub pełny SHA commita, o ile rozwiązany commit jest osiągalny z gałęzi OpenClaw albo tagu wydania
- Preflight tylko walidacyjny `OpenClaw NPM Release` akceptuje także bieżący pełny 40-znakowy SHA commita gałęzi workflow bez wymagania wypchniętego tagu
- Ta ścieżka SHA służy wyłącznie do walidacji i nie można jej awansować do rzeczywistej publikacji
- W trybie SHA workflow syntetyzuje `v<package.json version>` tylko na potrzeby kontroli metadanych pakietu; rzeczywista publikacja nadal wymaga prawdziwego tagu wydania
- Oba workflow utrzymują rzeczywistą ścieżkę publikowania i promocji na runnerach hostowanych przez GitHub, podczas gdy niemutująca ścieżka walidacji może używać większych runnerów Blacksmith Linux
- Ten workflow uruchamia
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  używając sekretów workflow `OPENAI_API_KEY` i `ANTHROPIC_API_KEY`
- Preflight wydania npm nie czeka już na osobną ścieżkę kontroli wydania
- Uruchom `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (albo odpowiadający tag beta/korekty) przed zatwierdzeniem
- Po publikacji npm uruchom
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (albo odpowiadającą wersję beta/korekty), aby zweryfikować ścieżkę instalacji z opublikowanego rejestru w świeżym tymczasowym prefiksie
- Po publikacji beta uruchom `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`, aby zweryfikować onboarding zainstalowanego pakietu, konfigurację Telegram i rzeczywiste Telegram E2E względem opublikowanego pakietu npm z użyciem współdzielonej puli dzierżawionych poświadczeń Telegram. Lokalne jednorazowe uruchomienia maintainerów mogą pominąć zmienne Convex i przekazać trzy poświadczenia env `OPENCLAW_QA_TELEGRAM_*` bezpośrednio.
- Aby uruchomić pełny smoke test beta po publikacji z maszyny maintainera, użyj `pnpm release:beta-smoke -- --beta betaN`. Helper uruchamia walidację npm update/fresh-target w Parallels, uruchamia `NPM Telegram Beta E2E`, odpytuje dokładny przebieg workflow, pobiera artefakt i wypisuje raport Telegram.
- Maintainerzy mogą uruchomić tę samą kontrolę po publikacji z GitHub Actions przez ręczny workflow `NPM Telegram Beta E2E`. Jest on celowo wyłącznie ręczny i nie uruchamia się przy każdym scaleniu.
- Automatyzacja wydań maintainerów używa teraz schematu preflight-then-promote:
  - rzeczywista publikacja npm musi przejść zakończony powodzeniem `preflight_run_id` npm
  - rzeczywista publikacja npm musi być uruchomiona z tej samej gałęzi `main` lub `release/YYYY.M.D` co zakończony powodzeniem przebieg preflight
  - stabilne wydania npm domyślnie używają `beta`
  - stabilna publikacja npm może jawnie celować w `latest` przez input workflow
  - mutacja npm dist-tag oparta na tokenie znajduje się teraz w `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` ze względów bezpieczeństwa, ponieważ `npm dist-tag add` nadal potrzebuje `NPM_TOKEN`, podczas gdy publiczne repo utrzymuje publikowanie tylko z OIDC
  - publiczny `macOS Release` służy wyłącznie do walidacji; gdy tag istnieje tylko na gałęzi wydania, ale workflow jest uruchamiany z `main`, ustaw `public_release_branch=release/YYYY.M.D`
  - rzeczywista prywatna publikacja mac musi przejść zakończone powodzeniem prywatne mac `preflight_run_id` i `validate_run_id`
  - rzeczywiste ścieżki publikowania promują przygotowane artefakty zamiast budować je ponownie
- Dla stabilnych wydań korekcyjnych takich jak `YYYY.M.D-N`, weryfikator po publikacji sprawdza także tę samą ścieżkę aktualizacji w tymczasowym prefiksie z `YYYY.M.D` do `YYYY.M.D-N`, aby korekty wydania nie mogły po cichu pozostawić starszych instalacji globalnych na bazowym stabilnym payloadzie
- Preflight wydania npm kończy się niepowodzeniem w trybie zamkniętym, chyba że tarball zawiera zarówno `dist/control-ui/index.html`, jak i niepusty payload `dist/control-ui/assets/`, abyśmy ponownie nie wysłali pustego dashboardu przeglądarkowego
- Weryfikacja po publikacji sprawdza także, czy opublikowane entrypointy Plugin i metadane pakietu są obecne w zainstalowanym układzie rejestru. Wydanie, które wysyła brakujące payloady runtime Plugin, nie przechodzi weryfikatora po publikacji i nie może zostać promowane do `latest`.
- `pnpm test:install:smoke` wymusza także budżet `unpackedSize` npm pack na kandydackim archiwum tarball aktualizacji, więc installer e2e wychwytuje przypadkowe rozrosty pakietu przed ścieżką publikacji wydania
- Jeśli prace nad wydaniem dotknęły planowania CI, manifestów czasu Plugin albo macierzy testów Plugin, wygeneruj ponownie i przejrzyj należące do planera wyjścia macierzy `plugin-prerelease-extension-shard` z `.github/workflows/plugin-prerelease.yml` przed zatwierdzeniem, aby informacje o wydaniu nie opisywały przestarzałego układu CI
- Gotowość stabilnego wydania macOS obejmuje także powierzchnie aktualizatora:
  - wydanie GitHub musi ostatecznie zawierać spakowane `.zip`, `.dmg` i `.dSYM.zip`
  - `appcast.xml` na `main` musi wskazywać nowy stabilny zip po publikacji
  - spakowana aplikacja musi zachować niedebugowy identyfikator pakietu, niepusty URL kanału Sparkle oraz `CFBundleVersion` na poziomie kanonicznego dolnego progu builda Sparkle dla tej wersji wydania lub powyżej

## Testboksy wydania

`Full Release Validation` to sposób, w jaki operatorzy uruchamiają wszystkie testy przedwydaniowe z jednego punktu wejścia. Aby uzyskać dowód przypiętego commita na szybko zmieniającej się gałęzi, użyj helpera, tak aby każdy podrzędny workflow działał z tymczasowej gałęzi ustalonej na docelowy SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper wypycha `release-ci/<sha>-...`, uruchamia `Full Release Validation` z tej gałęzi z `ref=<sha>`, weryfikuje, że każdy podrzędny workflow `headSha` odpowiada celowi, a następnie usuwa tymczasową gałąź. Pozwala to uniknąć przypadkowego udowodnienia nowszego podrzędnego przebiegu `main`.

Dla walidacji gałęzi wydania lub tagu uruchom ją z zaufanej referencji workflow `main` i przekaż gałąź wydania lub tag jako `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Przepływ pracy rozpoznaje docelową referencję, uruchamia ręcznie `CI` z
`target_ref=<release-ref>`, uruchamia `OpenClaw Release Checks`, przygotowuje
nadrzędny artefakt `release-package-under-test` dla kontroli dotyczących pakietu
oraz uruchamia samodzielne pakietowe E2E Telegram, gdy `release_profile=full` z
`rerun_group=all` albo gdy ustawiono `npm_telegram_package_spec`. Następnie
`OpenClaw Release Checks` rozdziela się na install smoke, kontrole wydania
między systemami operacyjnymi, pokrycie ścieżki wydania Docker live/E2E,
Package Acceptance z pakietowym QA Telegram, parytet QA Lab, live Matrix oraz
live Telegram. Pełny przebieg jest akceptowalny tylko wtedy, gdy podsumowanie
`Full Release Validation` pokazuje `normal_ci` i `release_checks` jako udane. W
trybie full/all proces potomny `npm_telegram` również musi zakończyć się
sukcesem; poza full/all jest pomijany, chyba że podano opublikowane
`npm_telegram_package_spec`. Końcowe podsumowanie weryfikatora zawiera tabele
najwolniejszych zadań dla każdego przebiegu potomnego, dzięki czemu kierownik
wydania może zobaczyć bieżącą ścieżkę krytyczną bez pobierania logów.
Zobacz [Pełna walidacja wydania](/pl/reference/full-release-validation), aby
uzyskać kompletną macierz etapów, dokładne nazwy zadań przepływu pracy, różnice
między profilami stable i full, artefakty oraz uchwyty do ukierunkowanych
ponownych uruchomień.
Przepływy potomne są uruchamiane z zaufanej referencji, która uruchamia
`Full Release Validation`, zwykle `--ref main`, nawet gdy docelowe `ref`
wskazuje na starszą gałąź wydania lub tag. Nie ma osobnego wejścia referencji
przepływu pracy dla Full Release Validation; wybierz zaufany harness, wybierając
referencję przebiegu przepływu pracy. Nie używaj `--ref main -f ref=<sha>` do
dowodu dokładnego commita na przesuwającym się `main`; surowe SHA commitów nie
mogą być referencjami uruchomienia przepływu pracy, więc użyj
`pnpm ci:full-release --sha <sha>`, aby utworzyć przypiętą tymczasową gałąź.

Użyj `release_profile`, aby wybrać zakres live/provider:

- `minimum`: najszybsza, krytyczna dla wydania ścieżka OpenAI/core live i Docker
- `stable`: minimum plus stabilne pokrycie provider/backend do zatwierdzenia wydania
- `full`: stable plus szerokie pokrycie doradczych providerów/mediów

`OpenClaw Release Checks` używa zaufanej referencji przepływu pracy, aby
jednorazowo rozpoznać docelową referencję jako `release-package-under-test`, i
ponownie używa tego artefaktu zarówno w kontrolach Docker ścieżki wydania, jak i
w Package Acceptance. Dzięki temu wszystkie maszyny dotyczące pakietu używają
tych samych bajtów i unika się powtarzania budowania pakietu. Cross-OS OpenAI
install smoke używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy ustawiona jest zmienna
repo/org, w przeciwnym razie `openai/gpt-5.4`, ponieważ ta ścieżka dowodzi
instalacji pakietu, onboardingu, startu Gateway i jednej rundy agenta live,
zamiast benchmarkować najwolniejszy model domyślny. Szersza macierz providerów
live pozostaje miejscem dla pokrycia specyficznego dla modeli.

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
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Nie używaj pełnego parasola jako pierwszego ponownego uruchomienia po
ukierunkowanej poprawce. Jeśli jedna maszyna zawiedzie, użyj nieudanego
przepływu potomnego, zadania, ścieżki Docker, profilu pakietu, providera modelu
lub ścieżki QA jako następnego dowodu. Uruchom pełny parasol ponownie tylko
wtedy, gdy poprawka zmieniła współdzieloną orkiestrację wydania albo sprawiła,
że wcześniejsze dowody ze wszystkich maszyn stały się nieaktualne. Końcowy
weryfikator parasola ponownie sprawdza zapisane identyfikatory przebiegów
potomnych przepływów pracy, więc po pomyślnym ponownym uruchomieniu przepływu
potomnego uruchom ponownie tylko nieudane zadanie nadrzędne
`Verify full validation`.

Do ograniczonego odzyskiwania przekaż `rerun_group` do parasola. `all` to
rzeczywisty przebieg release candidate, `ci` uruchamia tylko zwykły proces
potomny CI, `plugin-prerelease` uruchamia tylko proces potomny plugin wyłącznie
dla wydania, `release-checks` uruchamia każdą maszynę wydania, a węższe grupy
wydania to `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` i `npm-telegram`. Ukierunkowane ponowne uruchomienia
`npm-telegram` wymagają `npm_telegram_package_spec`; przebiegi full/all z
`release_profile=full` używają artefaktu pakietu z release-checks.

### Vitest

Maszyna Vitest to ręczny przepływ potomny `CI`. Ręczne CI celowo pomija
zakresowanie zmian i wymusza zwykły graf testów dla release candidate: shardy
Linux Node, shardy dołączonych pluginów, kontrakty kanałów, zgodność z Node 22,
`check`, `check-additional`, build smoke, kontrole dokumentacji, Python Skills,
Windows, macOS, Android oraz i18n Control UI.

Użyj tej maszyny, aby odpowiedzieć na pytanie „czy drzewo źródeł przeszło pełny
zwykły zestaw testów?”. To nie jest to samo co walidacja produktu w ścieżce
wydania. Dowody do zachowania:

- podsumowanie `Full Release Validation` pokazujące URL uruchomionego przebiegu `CI`
- zielony przebieg `CI` na dokładnym docelowym SHA
- nazwy nieudanych lub wolnych shardów z zadań CI podczas badania regresji
- artefakty czasów Vitest, takie jak `.artifacts/vitest-shard-timings.json`, gdy
  przebieg wymaga analizy wydajności

Uruchom ręczne CI bezpośrednio tylko wtedy, gdy wydanie potrzebuje
deterministycznego zwykłego CI, ale nie maszyn Docker, QA Lab, live, cross-OS ani
pakietowych:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Maszyna Docker znajduje się w `OpenClaw Release Checks` przez
`openclaw-live-and-e2e-checks-reusable.yml` oraz przepływ pracy
`install-smoke` w trybie wydania. Waliduje release candidate przez spakowane
środowiska Docker zamiast wyłącznie testów na poziomie źródeł.

Pokrycie Docker wydania obejmuje:

- pełny install smoke z włączonym wolnym smoke globalnej instalacji Bun
- przygotowanie/ponowne użycie obrazu smoke głównego Dockerfile według docelowego SHA, z zadaniami QR, root/gateway i installer/Bun smoke uruchamianymi jako osobne shardy install-smoke
- ścieżki E2E repozytorium
- fragmenty Docker ścieżki wydania: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` i `plugins-runtime-install-h`
- pokrycie OpenWebUI wewnątrz fragmentu `plugins-runtime-services`, gdy jest wymagane
- podzielone ścieżki instalacji/odinstalowania dołączonych pluginów
  `bundled-plugin-install-uninstall-0` do
  `bundled-plugin-install-uninstall-23`
- zestawy live/E2E providerów oraz pokrycie modeli Docker live, gdy kontrole wydania
  obejmują zestawy live

Użyj artefaktów Docker przed ponownym uruchomieniem. Harmonogram ścieżki wydania
przesyła `.artifacts/docker-tests/` z logami ścieżek, `summary.json`,
`failures.json`, czasami faz, JSON planu harmonogramu oraz poleceniami ponownego
uruchomienia. Do ukierunkowanego odzyskiwania użyj `docker_lanes=<lane[,lane]>`
w wielokrotnego użytku przepływie live/E2E zamiast ponownie uruchamiać wszystkie
fragmenty wydania. Wygenerowane polecenia ponownego uruchomienia obejmują
wcześniejsze `package_artifact_run_id` i przygotowane wejścia obrazu Docker,
gdy są dostępne, aby nieudana ścieżka mogła ponownie użyć tego samego archiwum
tarball i obrazów GHCR.

### QA Lab

Maszyna QA Lab jest również częścią `OpenClaw Release Checks`. To bramka wydania
dla zachowania agentowego i na poziomie kanałów, osobna od mechaniki pakietów
Vitest i Docker.

Pokrycie QA Lab wydania obejmuje:

- ścieżkę parytetu mock porównującą ścieżkę kandydata OpenAI z baseline Opus 4.6
  przy użyciu agentowego pakietu parytetu
- szybki profil QA live Matrix z użyciem środowiska `qa-live-shared`
- ścieżkę QA live Telegram z użyciem dzierżaw poświadczeń Convex CI
- `pnpm qa:otel:smoke`, gdy telemetria wydania wymaga jawnego lokalnego dowodu

Użyj tej maszyny, aby odpowiedzieć na pytanie „czy wydanie zachowuje się
poprawnie w scenariuszach QA i przepływach kanałów live?”. Zachowaj URL-e
artefaktów dla ścieżek parytetu, Matrix i Telegram podczas zatwierdzania
wydania. Pełne pokrycie Matrix pozostaje dostępne jako ręczny shardowany
przebieg QA-Lab, a nie domyślna ścieżka krytyczna dla wydania.

### Pakiet

Maszyna Package to bramka instalowalnego produktu. Jest obsługiwana przez
`Package Acceptance` i resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver normalizuje kandydata
do archiwum tarball `package-under-test` używanego przez Docker E2E, waliduje
inwentarz pakietu, zapisuje wersję pakietu i SHA-256 oraz utrzymuje referencję
harnessu przepływu pracy oddzielnie od referencji źródła pakietu.

Obsługiwane źródła kandydatów:

- `source=npm`: `openclaw@beta`, `openclaw@latest` lub dokładna wersja wydania OpenClaw
- `source=ref`: spakuj zaufaną gałąź `package_ref`, tag lub pełny SHA commita
  z wybranym harnessem `workflow_ref`
- `source=url`: pobierz HTTPS `.tgz` z wymaganym `package_sha256`
- `source=artifact`: ponownie użyj `.tgz` przesłanego przez inny przebieg GitHub Actions

`OpenClaw Release Checks` uruchamia Package Acceptance z `source=artifact`,
przygotowanym artefaktem pakietu wydania, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` oraz
`telegram_mode=mock-openai`. Package Acceptance utrzymuje migrację,
aktualizację, czyszczenie zależności nieaktualnych pluginów, offline fixtures
pluginów, aktualizację pluginów oraz pakietowe QA Telegram względem tego samego
rozpoznanego archiwum tarball. Macierz aktualizacji obejmuje każdy stabilny
baseline opublikowany w npm od `2026.4.23` do `latest`; użyj Package Acceptance z
`source=npm` dla już wysłanego kandydata albo `source=ref`/`source=artifact` dla
lokalnego archiwum tarball npm opartego na SHA przed publikacją. To natywne dla
GitHub zastępstwo większości pokrycia pakietów/aktualizacji, które wcześniej
wymagało Parallels. Kontrole wydania cross-OS nadal są ważne dla
specyficznego dla systemu onboardingu, instalatora i zachowania platformy, ale
walidacja produktu dotycząca pakietu/aktualizacji powinna preferować Package
Acceptance.

Kanoniczna lista kontrolna walidacji aktualizacji i pluginów to
[Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins). Użyj jej
podczas decydowania, która ścieżka lokalna, Docker, Package Acceptance lub
release-check dowodzi zmiany instalacji/aktualizacji pluginu, czyszczenia przez
doctor albo migracji opublikowanego pakietu. Wyczerpująca migracja
opublikowanych aktualizacji z każdego stabilnego pakietu `2026.4.23+` to osobny
ręczny przepływ pracy `Update Migration`, a nie część Full Release CI.

Tolerancja starszego package-acceptance jest celowo ograniczona czasowo. Pakiety
do `2026.4.25` włącznie mogą używać ścieżki zgodności dla luk w metadanych już
opublikowanych w npm: prywatnych wpisów inwentarza QA brakujących w archiwum
tarball, brakującego `gateway install --wrapper`, brakujących plików poprawek w
fixture git wyprowadzonym z tarballa, brakującego utrwalonego `update.channel`,
starszych lokalizacji rekordów instalacji pluginów, brakującej trwałości
rekordów instalacji marketplace oraz migracji metadanych konfiguracji podczas
`plugins update`. Opublikowany pakiet `2026.4.26` może ostrzegać o lokalnych
plikach znaczników metadanych builda, które już zostały wysłane. Późniejsze
pakiety muszą spełniać nowoczesne kontrakty pakietów; te same luki powodują
niepowodzenie walidacji wydania.

Używaj szerszych profili Package Acceptance, gdy pytanie o wydanie dotyczy
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

- `smoke`: szybkie ścieżki instalacji pakietu/kanału/agenta, sieci Gateway i ponownego
  ładowania konfiguracji
- `package`: kontrakty instalacji/aktualizacji/pakietu Plugin bez aktywnego ClawHub; jest to domyślna
  opcja sprawdzania wydania
- `product`: `package` plus kanały MCP, czyszczenie cron/subagenta, wyszukiwanie w sieci
  OpenAI i OpenWebUI
- `full`: fragmenty ścieżki wydania Docker z OpenWebUI
- `custom`: dokładna lista `docker_lanes` do ukierunkowanych ponownych uruchomień

Aby uzyskać dowód Telegram dla kandydata pakietu, włącz `telegram_mode=mock-openai` lub
`telegram_mode=live-frontier` w Package Acceptance. Workflow przekazuje
rozwiązany tarball `package-under-test` do ścieżki Telegram; samodzielny
workflow Telegram nadal akceptuje opublikowaną specyfikację npm na potrzeby kontroli po publikacji.

## Automatyzacja publikacji wydania

`OpenClaw Release Publish` to normalny punkt wejścia do publikacji mutującej. Orkiestruje
workflowy z zaufanym wydawcą w kolejności wymaganej przez wydanie:

1. Pobierz tag wydania i rozwiąż jego SHA commita.
2. Sprawdź, czy tag jest osiągalny z `main` lub `release/*`.
3. Uruchom `pnpm plugins:sync:check`.
4. Uruchom `Plugin NPM Release` z `publish_scope=all-publishable` i
   `ref=<release-sha>`.
5. Uruchom `Plugin ClawHub Release` z tym samym zakresem i SHA.
6. Uruchom `OpenClaw NPM Release` z tagiem wydania, npm dist-tag i
   zapisanym `preflight_run_id`.

Przykład publikacji beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Publikacja stabilna do domyślnego beta dist-tag:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Bezpośrednia promocja stabilna do `latest` jest jawna:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Używaj workflowów niższego poziomu `Plugin NPM Release` i `Plugin ClawHub Release`
tylko do ukierunkowanej naprawy lub ponownej publikacji. W przypadku naprawy wybranego pluginu przekaż
`plugin_publish_scope=selected` i `plugins=@openclaw/name` do
`OpenClaw Release Publish`, albo uruchom workflow podrzędny bezpośrednio, gdy
pakiet OpenClaw nie może zostać opublikowany.

## Dane wejściowe workflow npm

`OpenClaw NPM Release` akceptuje te dane wejściowe kontrolowane przez operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1` lub
  `v2026.4.2-beta.1`; gdy `preflight_only=true`, może to być także bieżący
  pełny 40-znakowy SHA commita gałęzi workflow do preflightu wyłącznie walidacyjnego
- `preflight_only`: `true` tylko dla walidacji/kompilacji/pakietu, `false` dla
  rzeczywistej ścieżki publikacji
- `preflight_run_id`: wymagane w rzeczywistej ścieżce publikacji, aby workflow ponownie użył
  przygotowanego tarballa z udanego przebiegu preflight
- `npm_dist_tag`: docelowy tag npm dla ścieżki publikacji; domyślnie `beta`

`OpenClaw Release Publish` akceptuje te dane wejściowe kontrolowane przez operatora:

- `tag`: wymagany tag wydania; musi już istnieć
- `preflight_run_id`: identyfikator udanego przebiegu preflight `OpenClaw NPM Release`;
  wymagany, gdy `publish_openclaw_npm=true`
- `npm_dist_tag`: docelowy tag npm dla pakietu OpenClaw
- `plugin_publish_scope`: domyślnie `all-publishable`; używaj `selected` tylko
  do ukierunkowanych prac naprawczych
- `plugins`: rozdzielone przecinkami nazwy pakietów `@openclaw/*`, gdy
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: domyślnie `true`; ustaw `false` tylko wtedy, gdy używasz
  workflow jako orkiestratora napraw wyłącznie dla pluginów

`OpenClaw Release Checks` akceptuje te dane wejściowe kontrolowane przez operatora:

- `ref`: gałąź, tag lub pełny SHA commita do walidacji. Kontrole korzystające z sekretów
  wymagają, aby rozwiązany commit był osiągalny z gałęzi OpenClaw lub
  tagu wydania.

Zasady:

- Tagi stabilne i korygujące mogą publikować do `beta` albo `latest`
- Tagi przedwydania beta mogą publikować tylko do `beta`
- W `OpenClaw NPM Release` pełny SHA commita jest dozwolony tylko wtedy, gdy
  `preflight_only=true`
- `OpenClaw Release Checks` i `Full Release Validation` są zawsze
  wyłącznie walidacyjne
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, którego użyto podczas preflight;
  workflow weryfikuje te metadane przed kontynuowaniem publikacji

## Sekwencja stabilnego wydania npm

Podczas przygotowywania stabilnego wydania npm:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`
   - Zanim tag istnieje, możesz użyć bieżącego pełnego SHA commita gałęzi workflow
     do wyłącznie walidacyjnego próbnego uruchomienia workflow preflight
2. Wybierz `npm_dist_tag=beta` dla normalnego przepływu najpierw beta albo `latest` tylko
   wtedy, gdy celowo chcesz bezpośredniej stabilnej publikacji
3. Uruchom `Full Release Validation` na gałęzi wydania, tagu wydania lub pełnym
   SHA commita, gdy chcesz uzyskać normalne CI oraz pokrycie aktywnego prompt cache, Docker, QA Lab,
   Matrix i Telegram z jednego ręcznego workflow
4. Jeśli celowo potrzebujesz tylko deterministycznego normalnego grafu testów, uruchom
   ręczny workflow `CI` na ref wydania
5. Zapisz udany `preflight_run_id`
6. Uruchom `OpenClaw Release Publish` z tym samym `tag`, tym samym `npm_dist_tag`
   i zapisanym `preflight_run_id`; publikuje zewnętrzne pluginy do npm
   i ClawHub przed promowaniem pakietu npm OpenClaw
7. Jeśli wydanie trafiło do `beta`, użyj prywatnego workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   aby promować tę stabilną wersję z `beta` do `latest`
8. Jeśli wydanie zostało celowo opublikowane bezpośrednio do `latest`, a `beta`
   powinna natychmiast wskazywać tę samą stabilną kompilację, użyj tego samego prywatnego
   workflow, aby skierować oba dist-tagi na stabilną wersję, albo pozwól jego zaplanowanej
   samonaprawiającej synchronizacji przenieść `beta` później

Mutacja dist-tag znajduje się w prywatnym repozytorium ze względów bezpieczeństwa, ponieważ nadal
wymaga `NPM_TOKEN`, podczas gdy publiczne repozytorium zachowuje publikację wyłącznie przez OIDC.

Dzięki temu bezpośrednia ścieżka publikacji i ścieżka promocji najpierw beta są
udokumentowane i widoczne dla operatora.

Jeśli maintainer musi awaryjnie użyć lokalnego uwierzytelniania npm, uruchamiaj polecenia
CLI 1Password (`op`) tylko w dedykowanej sesji tmux. Nie wywołuj `op`
bezpośrednio z głównej powłoki agenta; trzymanie go w tmux sprawia, że monity,
alerty i obsługa OTP są obserwowalne oraz zapobiega powtarzającym się alertom hosta.

## Publiczne odnośniki

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
jako właściwej procedury operacyjnej.

## Powiązane

- [Kanały wydań](/pl/install/development-channels)
