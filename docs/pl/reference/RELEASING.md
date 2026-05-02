---
read_when:
    - Wyszukiwanie definicji publicznych kanałów wydań
    - Uruchamianie walidacji wydania lub akceptacji pakietu
    - Szukasz nazewnictwa wersji i harmonogramu wydań
summary: Ścieżki wydań, lista kontrolna operatora, środowiska walidacyjne, nazewnictwo wersji i harmonogram
title: Polityka wydań
x-i18n:
    generated_at: "2026-05-02T20:57:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 493cb8b42f0e15f3bf5f8fb9be7d01fd626f4f16db9ac0a85e6efa747ef12d12
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ma cztery publiczne ścieżki wydań:

- stable: oznaczone tagami wydania, które domyślnie są publikowane w npm `beta`, albo w npm `latest`, gdy zostanie to wyraźnie zażądane
- alpha: tagi przedwydań publikowane w npm `alpha`
- beta: tagi przedwydań publikowane w npm `beta`
- dev: ruchoma głowica `main`

## Nazewnictwo wersji

- Wersja wydania stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Wersja wydania poprawkowego stable: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Wersja przedwydania alpha: `YYYY.M.D-alpha.N`
  - Tag Git: `vYYYY.M.D-alpha.N`
- Wersja przedwydania beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Nie dodawaj zer wiodących do miesiąca ani dnia
- `latest` oznacza aktualnie promowane stabilne wydanie npm
- `alpha` oznacza aktualny cel instalacji alpha
- `beta` oznacza aktualny cel instalacji beta
- Wydania stable i poprawkowe stable są domyślnie publikowane w npm `beta`; operatorzy wydań mogą wyraźnie wskazać `latest` albo później wypromować sprawdzoną kompilację beta
- Każde stabilne wydanie OpenClaw dostarcza jednocześnie pakiet npm i aplikację macOS;
  wydania beta zwykle najpierw walidują i publikują ścieżkę npm/pakietu, a
  kompilowanie/podpisywanie/notaryzację aplikacji Mac rezerwuje się dla stable, chyba że wyraźnie zażądano inaczej

## Rytm wydań

- Wydania przechodzą najpierw przez beta
- Stable następuje dopiero po zwalidowaniu najnowszej beta
- Maintainerzy zwykle tworzą wydania z gałęzi `release/YYYY.M.D` utworzonej
  z bieżącego `main`, tak aby walidacja wydania i poprawki nie blokowały nowego
  rozwoju na `main`
- Jeśli tag beta został wypchnięty lub opublikowany i wymaga poprawki, maintainerzy tworzą
  następny tag `-beta.N` zamiast usuwać lub odtwarzać stary tag beta
- Szczegółowa procedura wydania, zatwierdzenia, dane uwierzytelniające i notatki odzyskiwania są
  dostępne tylko dla maintainerów

## Lista kontrolna operatora wydania

Ta lista kontrolna pokazuje publiczny kształt przepływu wydania. Prywatne dane uwierzytelniające,
podpisywanie, notaryzacja, odzyskiwanie dist-tagów i szczegóły awaryjnego wycofania pozostają w
runbooku wydania dostępnym tylko dla maintainerów.

1. Zacznij od bieżącego `main`: pobierz najnowsze zmiany, potwierdź, że commit docelowy został wypchnięty,
   i potwierdź, że bieżące CI `main` jest wystarczająco zielone, aby utworzyć z niego gałąź.
2. Przepisz najwyższą sekcję `CHANGELOG.md` na podstawie rzeczywistej historii commitów za pomocą
   `/changelog`, utrzymaj wpisy jako skierowane do użytkowników, zacommituj je, wypchnij i wykonaj rebase/pull
   jeszcze raz przed utworzeniem gałęzi.
3. Przejrzyj rekordy zgodności wydania w
   `src/plugins/compat/registry.ts` i
   `src/commands/doctor/shared/deprecation-compat.ts`. Usuń wygasłą
   zgodność tylko wtedy, gdy ścieżka aktualizacji pozostaje pokryta, albo zapisz, dlaczego jest
   celowo zachowana.
4. Utwórz `release/YYYY.M.D` z bieżącego `main`; nie wykonuj zwykłej pracy wydaniowej
   bezpośrednio na `main`.
5. Podbij każdą wymaganą lokalizację wersji dla zamierzonego tagu, uruchom
   `pnpm plugins:sync`, aby publikowalne pakiety Plugin miały wspólną wersję wydania
   i metadane zgodności, a następnie uruchom lokalny deterministyczny preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` i
   `pnpm release:check`.
6. Uruchom `OpenClaw NPM Release` z `preflight_only=true`. Zanim istnieje tag,
   pełny 40-znakowy SHA gałęzi wydania jest dozwolony dla preflight wyłącznie walidacyjnego.
   Zapisz pomyślny `preflight_run_id`.
7. Uruchom wszystkie testy przedwydaniowe za pomocą `Full Release Validation` dla
   gałęzi wydania, tagu lub pełnego SHA commitu. To jeden ręczny punkt wejścia
   dla czterech dużych pól testów wydaniowych: Vitest, Docker, QA Lab i Package.
8. Jeśli walidacja się nie powiedzie, napraw problem na gałęzi wydania i uruchom ponownie najmniejszy nieudany
   plik, ścieżkę, zadanie workflow, profil pakietu, dostawcę lub allowlistę modeli, które
   dowodzą poprawki. Uruchom ponownie cały parasol tylko wtedy, gdy zmieniona powierzchnia sprawia,
   że wcześniejsze dowody są nieaktualne.
9. Dla alpha lub beta oznacz `vYYYY.M.D-alpha.N` albo `vYYYY.M.D-beta.N`, a następnie uruchom `OpenClaw Release Publish` z
   pasującej gałęzi `release/YYYY.M.D`. Sprawdza `pnpm plugins:sync:check`,
   publikuje najpierw wszystkie publikowalne pakiety Plugin w npm, publikuje ten sam
   zestaw w ClawHub jako drugi krok, a następnie promuje przygotowany artefakt preflight npm OpenClaw
   z pasującym dist-tagiem. Po publikacji uruchom akceptację pakietu po publikacji
   wobec opublikowanego pakietu `openclaw@YYYY.M.D-alpha.N`, `openclaw@alpha`,
   `openclaw@YYYY.M.D-beta.N` lub `openclaw@beta`. Jeśli wypchnięte lub
   opublikowane przedwydanie wymaga poprawki, utwórz następny pasujący numer przedwydania;
   nie usuwaj ani nie przepisuj starego przedwydania.
10. Dla stable kontynuuj dopiero po tym, jak sprawdzona beta lub kandydat do wydania ma
    wymagane dowody walidacji. Publikacja stable npm również przechodzi przez
    `OpenClaw Release Publish`, ponownie używając pomyślnego artefaktu preflight przez
    `preflight_run_id`; gotowość stabilnego wydania macOS wymaga także
    spakowanych `.zip`, `.dmg`, `.dSYM.zip` oraz zaktualizowanego `appcast.xml` na `main`.
11. Po publikacji uruchom weryfikator npm po publikacji, opcjonalne samodzielne
    opublikowane-npm Telegram E2E, gdy potrzebujesz dowodu kanału po publikacji,
    promocję dist-tagu, gdy jest potrzebna, notatki wydania/przedwydania GitHub z
    kompletnej pasującej sekcji `CHANGELOG.md` oraz kroki ogłoszenia wydania.

## Preflight wydania

- Uruchom `pnpm check:test-types` przed przedstartową kontrolą wydania, aby testowy TypeScript pozostawał
  objęty sprawdzaniem poza szybszą lokalną bramką `pnpm check`
- Uruchom `pnpm check:architecture` przed przedstartową kontrolą wydania, aby szersze kontrole cykli
  importów i granic architektury były zielone poza szybszą lokalną bramką
- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane
  artefakty wydania `dist/*` i pakiet Control UI istniały dla kroku walidacji
  pakietu
- Uruchom `pnpm plugins:sync` po podbiciu wersji głównej i przed tagowaniem. Aktualizuje
  wersje publikowalnych pakietów pluginów, metadane zgodności peer/API OpenClaw,
  metadane kompilacji oraz zalążki changelogów pluginów tak, aby odpowiadały wersji
  wydania rdzenia. `pnpm plugins:sync:check` to niemutująca osłona wydania;
  przepływ publikowania kończy się niepowodzeniem przed jakąkolwiek mutacją rejestru, jeśli ten krok został
  pominięty.
- Uruchom ręczny workflow `Full Release Validation` przed zatwierdzeniem wydania, aby
  uruchomić wszystkie przedwydaniowe testboxy z jednego punktu wejścia. Przyjmuje gałąź,
  tag albo pełny SHA commita, wywołuje ręczny `CI` oraz wywołuje
  `OpenClaw Release Checks` dla instalacyjnego smoke testu, akceptacji pakietu, zestawów
  ścieżki wydania Docker, testów live/E2E, OpenWebUI, parytetu QA Lab, Matrix i ścieżek Telegram.
  Z `release_profile=full` i `rerun_group=all` uruchamia też pakietowe
  Telegram E2E względem artefaktu `release-package-under-test` z kontroli wydania.
  Podaj `npm_telegram_package_spec` po opublikowaniu, gdy to samo
  Telegram E2E ma także potwierdzić opublikowany pakiet npm. Podaj
  `package_acceptance_package_spec` po opublikowaniu, gdy Package Acceptance
  ma uruchomić swoją macierz pakietu/aktualizacji względem wysłanego pakietu npm zamiast
  artefaktu zbudowanego z SHA. Podaj
  `evidence_package_spec`, gdy prywatny raport dowodowy ma potwierdzić, że
  walidacja odpowiada opublikowanemu pakietowi npm bez wymuszania Telegram E2E.
  Przykład:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Uruchom ręczny workflow `Package Acceptance`, gdy chcesz uzyskać dowód kanałem bocznym
  dla kandydata pakietu, podczas gdy prace nad wydaniem trwają. Użyj `source=npm` dla
  `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` albo dokładnej wersji wydania; `source=ref`
  aby spakować zaufaną gałąź/tag/SHA `package_ref` z bieżącą
  uprzężą `workflow_ref`; `source=url` dla archiwum tarball HTTPS z wymaganym
  SHA-256; albo `source=artifact` dla archiwum tarball przesłanego przez inny przebieg GitHub
  Actions. Workflow rozwiązuje kandydata do
  `package-under-test`, ponownie używa harmonogramu wydania Docker E2E względem tego
  archiwum tarball i może uruchomić Telegram QA względem tego samego archiwum tarball z
  `telegram_mode=mock-openai` albo `telegram_mode=live-frontier`. Gdy
  wybrane ścieżki Docker obejmują `published-upgrade-survivor`, artefakt pakietu
  jest kandydatem, a `published_upgrade_survivor_baseline` wybiera opublikowaną
  bazę.
  Przykład: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Typowe profile:
  - `smoke`: ścieżki instalacji/kanału/agenta, sieci Gateway i przeładowania konfiguracji
  - `package`: natywne dla artefaktu ścieżki pakietu/aktualizacji/pluginów bez OpenWebUI ani live ClawHub
  - `product`: profil pakietu plus kanały MCP, czyszczenie cron/subagent,
    wyszukiwanie webowe OpenAI i OpenWebUI
  - `full`: fragmenty ścieżki wydania Docker z OpenWebUI
  - `custom`: dokładny wybór `docker_lanes` dla skoncentrowionego ponownego uruchomienia
- Uruchom ręczny workflow `CI` bezpośrednio, gdy potrzebujesz tylko pełnego zwykłego pokrycia CI
  dla kandydata wydania. Ręczne wywołania CI omijają zakresowanie zmian
  i wymuszają shardy Linux Node, shardy dołączonych pluginów, kontrakty kanałów,
  zgodność z Node 22, `check`, `check-additional`, smoke test kompilacji,
  kontrole dokumentacji, Python skills, Windows, macOS, Android oraz ścieżki i18n Control UI.
  Przykład: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Uruchom `pnpm qa:otel:smoke` podczas walidacji telemetrii wydania. Sprawdza
  QA-lab przez lokalny odbiornik OTLP/HTTP i weryfikuje wyeksportowane nazwy spanów
  śladu, ograniczone atrybuty oraz redakcję treści/identyfikatorów bez
  wymagania Opik, Langfuse ani innego zewnętrznego kolektora.
- Uruchom `pnpm release:check` przed każdym tagowanym wydaniem
- Uruchom `OpenClaw Release Publish` dla mutującej sekwencji publikowania po tym, jak
  tag już istnieje. Wywołaj go z `release/YYYY.M.D` (albo `main`, gdy publikujesz
  tag osiągalny z main), przekaż tag wydania i udany `preflight_run_id`
  OpenClaw npm oraz pozostaw domyślny zakres publikowania pluginów
  `all-publishable`, chyba że celowo uruchamiasz skoncentrowaną naprawę. Workflow
  serializuje publikowanie pluginów npm, publikowanie pluginów ClawHub i publikowanie OpenClaw
  npm, aby pakiet rdzenia nie został opublikowany przed swoimi zewnętrznymi
  pluginami.
- Kontrole wydania działają teraz w osobnym ręcznym workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` uruchamia też ścieżkę parytetu mock QA Lab oraz szybki
  profil live Matrix i ścieżkę Telegram QA przed zatwierdzeniem wydania. Ścieżki live
  używają środowiska `qa-live-shared`; Telegram używa też dzierżaw poświadczeń Convex CI.
  Uruchom ręczny workflow `QA-Lab - All Lanes` z
  `matrix_profile=all` i `matrix_shards=true`, gdy chcesz pełny inwentarz transportu,
  multimediów i E2EE Matrix równolegle.
- Walidacja runtime instalacji i aktualizacji między systemami operacyjnymi jest częścią publicznych
  `OpenClaw Release Checks` i `Full Release Validation`, które wywołują
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` bezpośrednio
- Ten podział jest zamierzony: utrzymuje prawdziwą ścieżkę wydania npm krótką,
  deterministyczną i skoncentrowaną na artefaktach, podczas gdy wolniejsze kontrole live pozostają we
  własnej ścieżce, aby nie wstrzymywać ani nie blokować publikowania
- Kontrole wydania zawierające sekrety powinny być wywoływane przez `Full Release
Validation` albo z refa workflow `main`/release, aby logika workflow i
  sekrety pozostawały kontrolowane
- `OpenClaw Release Checks` przyjmuje gałąź, tag albo pełny SHA commita, o ile
  rozwiązany commit jest osiągalny z gałęzi OpenClaw albo tagu wydania
- Przedstartowa kontrola tylko walidacyjna `OpenClaw NPM Release` akceptuje też bieżący
  pełny 40-znakowy SHA commita gałęzi workflow bez wymagania wypchniętego tagu
- Ta ścieżka SHA jest tylko walidacyjna i nie może zostać wypromowana do prawdziwego publikowania
- W trybie SHA workflow syntetyzuje `v<package.json version>` tylko dla
  kontroli metadanych pakietu; prawdziwe publikowanie nadal wymaga prawdziwego tagu wydania
- Oba workflow utrzymują prawdziwą ścieżkę publikowania i promowania na runnerach
  hostowanych przez GitHub, podczas gdy niemutująca ścieżka walidacji może używać większych
  runnerów Blacksmith Linux
- Ten workflow uruchamia
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  z użyciem sekretów workflow `OPENAI_API_KEY` i `ANTHROPIC_API_KEY`
- Przedstartowa kontrola wydania npm nie czeka już na osobną ścieżkę kontroli wydania
- Uruchom `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (albo odpowiadający tag beta/korekty) przed zatwierdzeniem
- Po opublikowaniu npm uruchom
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (albo odpowiadającą wersję beta/korekty), aby zweryfikować ścieżkę instalacji z opublikowanego rejestru
  w świeżym tymczasowym prefiksie
- Po opublikowaniu beta uruchom `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  aby zweryfikować onboarding zainstalowanego pakietu, konfigurację Telegram i prawdziwe Telegram E2E
  względem opublikowanego pakietu npm z użyciem współdzielonej puli dzierżawionych poświadczeń Telegram.
  Lokalne jednorazowe przebiegi maintainerów mogą pominąć zmienne Convex i przekazać trzy
  poświadczenia env `OPENCLAW_QA_TELEGRAM_*` bezpośrednio.
- Maintainerzy mogą uruchomić tę samą kontrolę po publikacji z GitHub Actions przez
  ręczny workflow `NPM Telegram Beta E2E`. Jest on celowo wyłącznie ręczny i
  nie uruchamia się przy każdym scaleniu.
- Automatyzacja wydań maintainerów używa teraz schematu preflight-then-promote:
  - prawdziwe publikowanie npm musi przejść udany npm `preflight_run_id`
  - prawdziwe publikowanie npm musi zostać wywołane z tej samej gałęzi `main` albo
    `release/YYYY.M.D`, co udany przebieg przedstartowy
  - stabilne wydania npm domyślnie trafiają do `beta`
  - stabilne publikowanie npm może jawnie celować w `latest` przez wejście workflow
  - mutacja npm dist-tag oparta na tokenie znajduje się teraz w
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    ze względów bezpieczeństwa, ponieważ `npm dist-tag add` nadal potrzebuje `NPM_TOKEN`, podczas gdy
    publiczne repo utrzymuje publikowanie wyłącznie OIDC
  - publiczny `macOS Release` jest tylko walidacyjny; gdy tag istnieje tylko na
    gałęzi wydania, ale workflow jest wywoływany z `main`, ustaw
    `public_release_branch=release/YYYY.M.D`
  - prawdziwe prywatne publikowanie mac musi przejść udane prywatne mac
    `preflight_run_id` i `validate_run_id`
  - prawdziwe ścieżki publikowania promują przygotowane artefakty zamiast budować
    je ponownie
- Dla stabilnych wydań korygujących, takich jak `YYYY.M.D-N`, weryfikator po publikacji
  sprawdza też tę samą ścieżkę aktualizacji w tymczasowym prefiksie z `YYYY.M.D` do `YYYY.M.D-N`,
  aby korekty wydania nie mogły po cichu pozostawić starszych globalnych instalacji na
  bazowym stabilnym ładunku
- Przedstartowa kontrola wydania npm kończy się zamknięciem niepowodzeniem, chyba że archiwum tarball zawiera zarówno
  `dist/control-ui/index.html`, jak i niepusty ładunek `dist/control-ui/assets/`,
  abyśmy ponownie nie wysłali pustego dashboardu przeglądarkowego
- Weryfikacja po publikacji sprawdza też, czy opublikowane entrypointy pluginów i
  metadane pakietu są obecne w zainstalowanym układzie rejestru. Wydanie, które
  wysyła brakujące ładunki runtime pluginów, oblewa weryfikator po publikacji i
  nie może zostać wypromowane do `latest`.
- `pnpm test:install:smoke` egzekwuje też budżet npm pack `unpackedSize` na
  kandydackim archiwum tarball aktualizacji, dzięki czemu instalacyjne e2e wyłapuje przypadkowe rozdęcie pakietu
  przed ścieżką publikowania wydania
- Jeśli prace nad wydaniem dotknęły planowania CI, manifestów timingów rozszerzeń albo
  macierzy testów rozszerzeń, przed zatwierdzeniem wygeneruj ponownie i przejrzyj należące do planera
  wyjścia macierzy `plugin-prerelease-extension-shard` z
  `.github/workflows/plugin-prerelease.yml`, aby notatki wydania nie opisywały
  nieaktualnego układu CI
- Gotowość stabilnego wydania macOS obejmuje też powierzchnie aktualizatora:
  - wydanie GitHub musi ostatecznie zawierać spakowane `.zip`, `.dmg` i `.dSYM.zip`
  - `appcast.xml` na `main` musi wskazywać na nowy stabilny zip po publikacji
  - spakowana aplikacja musi utrzymywać niedebugowy identyfikator bundle, niepusty adres URL kanału Sparkle
    oraz `CFBundleVersion` równy lub wyższy od kanonicznego dolnego progu kompilacji Sparkle
    dla tej wersji wydania

## Testboxy wydania

`Full Release Validation` to sposób, w jaki operatorzy uruchamiają wszystkie testy przedwydaniowe z
jednego punktu wejścia. Dla dowodu przypiętego commita na szybko zmieniającej się gałęzi użyj
helpera, aby każdy workflow potomny działał z tymczasowej gałęzi ustalonej na docelowy
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper wypycha `release-ci/<sha>-...`, wywołuje `Full Release Validation`
z tej gałęzi z `ref=<sha>`, weryfikuje, że każdy `headSha` workflow potomnego
odpowiada celowi, a następnie usuwa tymczasową gałąź. Zapobiega to przypadkowemu
potwierdzeniu nowszego przebiegu potomnego `main`.

Dla walidacji gałęzi wydania albo tagu uruchom go z zaufanego refa workflow `main`
i przekaż gałąź wydania albo tag jako `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Przepływ pracy rozwiązuje docelowy ref, uruchamia ręczne `CI` z
`target_ref=<release-ref>`, uruchamia `OpenClaw Release Checks` oraz uruchamia
samodzielny pakietowy Telegram E2E, gdy `release_profile=full` z
`rerun_group=all` albo gdy ustawiono `npm_telegram_package_spec`. Następnie
`OpenClaw Release Checks` rozgałęzia się na install smoke, międzyplatformowe
kontrole wydania, pokrycie live/E2E Docker dla ścieżki wydania, Package
Acceptance z QA pakietu Telegram, parytet QA Lab, live Matrix oraz live
Telegram. Pełny przebieg jest akceptowalny tylko wtedy, gdy podsumowanie
`Full Release Validation` pokazuje `normal_ci` i `release_checks` jako
zakończone powodzeniem. W trybie full/all proces potomny `npm_telegram` również
musi zakończyć się powodzeniem; poza full/all jest pomijany, chyba że podano
opublikowany `npm_telegram_package_spec`. Końcowe podsumowanie weryfikatora
zawiera tabele najwolniejszych zadań dla każdego przebiegu potomnego, dzięki
czemu release manager widzi bieżącą ścieżkę krytyczną bez pobierania logów.
Zobacz [Pełną walidację wydania](/pl/reference/full-release-validation), aby
poznać kompletną macierz etapów, dokładne nazwy zadań workflow, różnice między
profilami stable i full, artefakty oraz uchwyty do ukierunkowanych ponownych
uruchomień.
Workflow potomne są uruchamiane z zaufanego ref, który uruchamia `Full Release
Validation`, zwykle `--ref main`, nawet gdy docelowy `ref` wskazuje starszą
gałąź wydania lub tag. Nie ma osobnego wejścia workflow-ref dla Full Release
Validation; zaufany harness wybiera się przez wybór ref przebiegu workflow.
Nie używaj `--ref main -f ref=<sha>` do dowodu dokładnego commita na ruchomym
`main`; surowe SHA commitów nie mogą być refami dispatch workflow, więc użyj
`pnpm ci:full-release --sha <sha>`, aby utworzyć przypiętą tymczasową gałąź.

Użyj `release_profile`, aby wybrać zakres live/provider:

- `minimum`: najszybsza krytyczna dla wydania ścieżka OpenAI/core live i Docker
- `stable`: minimum plus stabilne pokrycie provider/backend do zatwierdzenia wydania
- `full`: stable plus szerokie pokrycie doradczych providerów i mediów

`OpenClaw Release Checks` używa zaufanego ref workflow, aby jednorazowo
rozwiązać docelowy ref jako `release-package-under-test` i ponownie używa tego
artefaktu zarówno w kontrolach Docker ścieżki wydania, jak i w Package
Acceptance. Dzięki temu wszystkie boksy obsługujące pakiet działają na tych
samych bajtach i unika się powtarzanych buildów pakietu.
Międzyplatformowy install smoke OpenAI używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`,
gdy ustawiona jest zmienna repo/org, w przeciwnym razie `openai/gpt-5.4`,
ponieważ ta ścieżka dowodzi instalacji pakietu, onboardingu, startu Gateway i
jednego obrotu agenta live, a nie benchmarkuje najwolniejszego modelu
domyślnego. Szersza macierz providerów live pozostaje miejscem na pokrycie
specyficzne dla modeli.

Używaj tych wariantów zależnie od etapu wydania:

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
ukierunkowanej poprawce. Jeśli jeden boks zawiedzie, użyj nieudanego workflow
potomnego, zadania, ścieżki Docker, profilu pakietu, providera modelu albo
ścieżki QA jako następnego dowodu. Uruchom pełny parasol ponownie tylko wtedy,
gdy poprawka zmieniła wspólną orkiestrację wydania albo sprawiła, że wcześniejsze
dowody ze wszystkich boksów stały się nieaktualne. Końcowy weryfikator parasola
ponownie sprawdza zapisane identyfikatory przebiegów workflow potomnych, więc po
udanym ponownym uruchomieniu workflow potomnego uruchom ponownie tylko nieudane
zadanie nadrzędne `Verify full validation`.

Do ograniczonego odzyskiwania przekaż `rerun_group` do parasola. `all` jest
rzeczywistym przebiegiem release-candidate, `ci` uruchamia tylko normalny proces
potomny CI, `plugin-prerelease` uruchamia tylko proces potomny Plugin wyłącznie
dla wydania, `release-checks` uruchamia każdy boks wydania, a węższe grupy
wydania to `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` oraz `npm-telegram`. Ukierunkowane ponowne uruchomienia
`npm-telegram` wymagają `npm_telegram_package_spec`; przebiegi full/all z
`release_profile=full` używają artefaktu pakietu z release-checks.

### Vitest

Boks Vitest to ręczny workflow potomny `CI`. Ręczne CI celowo omija zakres
zmian i wymusza normalny graf testów dla release candidate: shardy Linux Node,
shardy dołączonych Plugin, kontrakty kanałów, zgodność z Node 22, `check`,
`check-additional`, build smoke, kontrole dokumentacji, Python skills, Windows,
macOS, Android oraz i18n Control UI.

Użyj tego boksu, aby odpowiedzieć na pytanie „czy drzewo źródeł przeszło pełny
normalny zestaw testów?”. To nie to samo co walidacja produktu na ścieżce
wydania. Dowody do zachowania:

- podsumowanie `Full Release Validation` pokazujące URL uruchomionego przebiegu `CI`
- zielony przebieg `CI` na dokładnym docelowym SHA
- nazwy nieudanych lub wolnych shardów z zadań CI podczas badania regresji
- artefakty czasów Vitest, takie jak `.artifacts/vitest-shard-timings.json`, gdy
  przebieg wymaga analizy wydajności

Uruchom ręczne CI bezpośrednio tylko wtedy, gdy wydanie potrzebuje
deterministycznego normalnego CI, ale nie boksów Docker, QA Lab, live, cross-OS
ani pakietowych:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Boks Docker znajduje się w `OpenClaw Release Checks` przez
`openclaw-live-and-e2e-checks-reusable.yml` oraz workflow `install-smoke` w trybie
wydania. Waliduje release candidate przez spakowane środowiska Docker, a nie
tylko testy na poziomie źródeł.

Pokrycie Docker wydania obejmuje:

- pełny install smoke z włączonym wolnym globalnym install smoke Bun
- przygotowanie/ponowne użycie obrazu smoke root Dockerfile według docelowego
  SHA, z zadaniami QR, root/gateway oraz installer/Bun smoke działającymi jako
  osobne shardy install-smoke
- ścieżki E2E repozytorium
- chunki Docker ścieżki wydania: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` oraz `plugins-runtime-install-h`
- pokrycie OpenWebUI wewnątrz chunka `plugins-runtime-services`, gdy jest wymagane
- podzielone ścieżki instalacji/deinstalacji dołączonych Plugin
  `bundled-plugin-install-uninstall-0` do
  `bundled-plugin-install-uninstall-23`
- zestawy providerów live/E2E oraz pokrycie modeli Docker live, gdy release checks
  obejmują zestawy live

Używaj artefaktów Docker przed ponownym uruchomieniem. Scheduler ścieżki
wydania przesyła `.artifacts/docker-tests/` z logami ścieżek, `summary.json`,
`failures.json`, czasami faz, planem schedulera JSON oraz poleceniami
ponownego uruchomienia. Do ukierunkowanego odzyskiwania użyj
`docker_lanes=<lane[,lane]>` w reusable workflow live/E2E zamiast ponownie
uruchamiać wszystkie chunki wydania. Wygenerowane polecenia ponownego
uruchomienia obejmują wcześniejsze `package_artifact_run_id` i przygotowane
wejścia obrazów Docker, gdy są dostępne, więc nieudana ścieżka może ponownie użyć
tego samego tarballa i obrazów GHCR.

### QA Lab

Boks QA Lab jest również częścią `OpenClaw Release Checks`. To bramka wydania
dla zachowania agentowego i poziomu kanałów, osobna od mechaniki pakietów Vitest
i Docker.

Pokrycie QA Lab wydania obejmuje:

- ścieżkę parytetu mock porównującą ścieżkę kandydata OpenAI z baseline Opus 4.6
  przy użyciu pakietu parytetu agentowego
- szybki profil QA live Matrix używający środowiska `qa-live-shared`
- ścieżkę QA live Telegram używającą dzierżaw poświadczeń Convex CI
- `pnpm qa:otel:smoke`, gdy telemetria wydania wymaga jawnego lokalnego dowodu

Użyj tego boksu, aby odpowiedzieć na pytanie „czy wydanie zachowuje się poprawnie
w scenariuszach QA i przepływach kanałów live?”. Przy zatwierdzaniu wydania
zachowaj URL-e artefaktów dla ścieżek parytetu, Matrix i Telegram. Pełne
pokrycie Matrix pozostaje dostępne jako ręczny shardowany przebieg QA-Lab, a nie
domyślna ścieżka krytyczna dla wydania.

### Pakiet

Boks pakietu jest bramką produktu instalowalnego. Opiera się na
`Package Acceptance` i resolverze `scripts/resolve-openclaw-package-candidate.mjs`.
Resolver normalizuje kandydata do tarballa `package-under-test` używanego przez
Docker E2E, waliduje inwentarz pakietu, zapisuje wersję pakietu i SHA-256 oraz
oddziela ref harnessa workflow od ref źródła pakietu.

Obsługiwane źródła kandydatów:

- `source=npm`: `openclaw@beta`, `openclaw@latest` albo dokładna wersja wydania OpenClaw
- `source=ref`: spakuj zaufaną gałąź, tag albo pełny SHA commita `package_ref`
  z wybranym harnessem `workflow_ref`
- `source=url`: pobierz HTTPS `.tgz` z wymaganym `package_sha256`
- `source=artifact`: użyj ponownie `.tgz` przesłanego przez inny przebieg GitHub Actions

`OpenClaw Release Checks` uruchamia Package Acceptance z `source=artifact`,
przygotowanym artefaktem pakietu wydania, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` oraz
`telegram_mode=mock-openai`. Package Acceptance utrzymuje migrację, aktualizację,
czyszczenie przestarzałych zależności Plugin, offline fixtures Plugin,
aktualizację Plugin oraz QA pakietu Telegram względem tego samego rozwiązanego
tarballa. Macierz upgrade obejmuje każdy stabilny baseline opublikowany w npm od
`2026.4.23` do `latest`; użyj Package Acceptance z `source=npm` dla już
wysłanego kandydata albo `source=ref`/`source=artifact` dla lokalnego tarballa
npm opartego na SHA przed publikacją. To natywny dla GitHub zamiennik większości
pokrycia pakietu/aktualizacji, które wcześniej wymagało Parallels. Kontrole
wydania cross-OS nadal są ważne dla onboardingu, instalatora i zachowania
platformy specyficznych dla systemu operacyjnego, ale walidacja produktu w
zakresie pakietu/aktualizacji powinna preferować Package Acceptance.

Kanoniczna checklista dla walidacji aktualizacji i Plugin to
[Testowanie aktualizacji i Plugin](/pl/help/testing-updates-plugins). Używaj jej
przy decydowaniu, która lokalna ścieżka, Docker, Package Acceptance albo
release-check dowodzi zmiany instalacji/aktualizacji Plugin, czyszczenia doctor
albo migracji opublikowanego pakietu.
Wyczerpująca migracja opublikowanych aktualizacji z każdego stabilnego pakietu
`2026.4.23+` jest osobnym ręcznym workflow `Update Migration`, a nie częścią Full
Release CI.

Łagodność legacy package-acceptance jest celowo ograniczona czasowo. Pakiety do
`2026.4.25` włącznie mogą używać ścieżki zgodności dla luk metadanych już
opublikowanych w npm: prywatnych wpisów inwentarza QA brakujących w tarballu,
brakującego `gateway install --wrapper`, brakujących plików patchy w fixture git
pochodzącym z tarballa, brakującego utrwalonego `update.channel`, legacy
lokalizacji rekordów instalacji Plugin, brakującej trwałości rekordów instalacji
marketplace oraz migracji metadanych konfiguracji podczas `plugins update`.
Opublikowany pakiet `2026.4.26` może ostrzegać o plikach znaczników metadanych
lokalnego buildu, które już zostały wysłane. Późniejsze pakiety muszą spełniać
nowoczesne kontrakty pakietów; te same luki powodują niepowodzenie walidacji
wydania.

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

- `smoke`: szybkie ścieżki instalacji pakietu/kanału/agenta, sieci Gateway oraz
  przeładowania konfiguracji
- `package`: kontrakty instalacji/aktualizacji/pakietu Plugin bez live ClawHub; to domyślna wartość release-check
- `product`: `package` plus kanały MCP, czyszczenie cron/subagent, wyszukiwanie
  web OpenAI oraz OpenWebUI
- `full`: chunki Docker ścieżki wydania z OpenWebUI
- `custom`: dokładna lista `docker_lanes` do ukierunkowanych ponownych uruchomień

Do weryfikacji kandydata pakietu dla Telegram włącz `telegram_mode=mock-openai` lub
`telegram_mode=live-frontier` w Package Acceptance. Przepływ pracy przekazuje
rozwiązany tarball `package-under-test` do ścieżki Telegram; samodzielny
przepływ pracy Telegram nadal akceptuje opublikowaną specyfikację npm na potrzeby kontroli po publikacji.

## Automatyzacja publikowania wydania

`OpenClaw Release Publish` to standardowy mutujący punkt wejścia publikacji. 
Orkiestruje przepływy pracy zaufanego wydawcy w kolejności wymaganej przez wydanie:

1. Pobierz tag wydania i rozwiąż jego commit SHA.
2. Zweryfikuj, że tag jest osiągalny z `main` albo `release/*`.
3. Uruchom `pnpm plugins:sync:check`.
4. Uruchom `Plugin NPM Release` z `publish_scope=all-publishable` i
   `ref=<release-sha>`.
5. Uruchom `Plugin ClawHub Release` z tym samym zakresem i SHA.
6. Uruchom `OpenClaw NPM Release` z tagiem wydania, tagiem dystrybucji npm i
   zapisanym `preflight_run_id`.

Przykład publikacji beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Przykład publikacji alfa:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-alpha.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=alpha
```

Stabilna publikacja do domyślnego tagu dystrybucji beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Stabilna promocja bezpośrednio do `latest` jest jawna:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Używaj niższopoziomowych przepływów pracy `Plugin NPM Release` i `Plugin ClawHub Release`
tylko do ukierunkowanych napraw lub ponownych publikacji. Dla naprawy wybranego Plugin przekaż
`plugin_publish_scope=selected` i `plugins=@openclaw/name` do
`OpenClaw Release Publish`, albo uruchom podrzędny przepływ pracy bezpośrednio, gdy
pakiet OpenClaw nie może zostać opublikowany.

## Dane wejściowe przepływu pracy NPM

`OpenClaw NPM Release` akceptuje te dane wejściowe kontrolowane przez operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1` albo
  `v2026.4.2-alpha.1` lub `v2026.4.2-beta.1`; gdy `preflight_only=true`, może to być także bieżący
  pełny 40-znakowy commit SHA gałęzi przepływu pracy do preflightu wyłącznie walidacyjnego
- `preflight_only`: `true` tylko dla walidacji/budowania/pakietowania, `false` dla
  rzeczywistej ścieżki publikacji
- `preflight_run_id`: wymagane na rzeczywistej ścieżce publikacji, aby przepływ pracy ponownie użył
  przygotowanego tarballa z udanego przebiegu preflight
- `npm_dist_tag`: docelowy tag npm dla ścieżki publikacji; domyślnie `beta`

`OpenClaw Release Publish` akceptuje te dane wejściowe kontrolowane przez operatora:

- `tag`: wymagany tag wydania; musi już istnieć
- `preflight_run_id`: identyfikator udanego przebiegu preflight `OpenClaw NPM Release`;
  wymagany, gdy `publish_openclaw_npm=true`
- `npm_dist_tag`: docelowy tag npm dla pakietu OpenClaw
- `plugin_publish_scope`: domyślnie `all-publishable`; używaj `selected` tylko
  do ukierunkowanych napraw
- `plugins`: rozdzielone przecinkami nazwy pakietów `@openclaw/*`, gdy
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: domyślnie `true`; ustaw `false` tylko wtedy, gdy używasz
  przepływu pracy jako orkiestratora napraw wyłącznie dla Plugin

`OpenClaw Release Checks` akceptuje te dane wejściowe kontrolowane przez operatora:

- `ref`: gałąź, tag albo pełny commit SHA do walidacji. Kontrole używające sekretów
  wymagają, aby rozwiązany commit był osiągalny z gałęzi OpenClaw albo
  tagu wydania.

Reguły:

- Tagi stabilne i korekcyjne mogą publikować do `beta` albo `latest`
- Tagi przedwydania alfa mogą publikować tylko do `alpha`
- Tagi przedwydania beta mogą publikować tylko do `beta`
- Dla `OpenClaw NPM Release` pełny commit SHA jako dane wejściowe jest dozwolony tylko wtedy, gdy
  `preflight_only=true`
- `OpenClaw Release Checks` i `Full Release Validation` zawsze są
  wyłącznie walidacyjne
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, którego użyto podczas preflight;
  przepływ pracy weryfikuje te metadane przed kontynuacją publikacji

## Sekwencja stabilnego wydania npm

Podczas przygotowywania stabilnego wydania npm:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`
   - Zanim tag będzie istnieć, możesz użyć bieżącego pełnego SHA commita gałęzi przepływu pracy
     do wyłącznie walidacyjnego próbnego uruchomienia przepływu preflight
2. Wybierz `npm_dist_tag=beta` dla normalnego przepływu najpierw-beta albo `latest` tylko
   wtedy, gdy celowo chcesz bezpośrednią stabilną publikację
3. Uruchom `Full Release Validation` na gałęzi wydania, tagu wydania albo pełnym
   commicie SHA, gdy chcesz uzyskać z jednego ręcznego przepływu pracy normalne CI oraz pokrycie live prompt cache, Docker, QA Lab,
   Matrix i Telegram
4. Jeśli celowo potrzebujesz tylko deterministycznego normalnego grafu testów, uruchom
   ręczny przepływ pracy `CI` na refie wydania
5. Zapisz udany `preflight_run_id`
6. Uruchom `OpenClaw Release Publish` z tym samym `tag`, tym samym `npm_dist_tag`
   i zapisanym `preflight_run_id`; publikuje zewnętrzne pluginy do npm
   i ClawHub przed promocją pakietu npm OpenClaw
7. Jeśli wydanie trafiło na `beta`, użyj prywatnego przepływu pracy
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   aby wypromować tę stabilną wersję z `beta` do `latest`
8. Jeśli wydanie celowo opublikowano bezpośrednio do `latest`, a `beta`
   powinno natychmiast wskazywać ten sam stabilny build, użyj tego samego prywatnego
   przepływu pracy, aby skierować oba tagi dystrybucji na stabilną wersję, albo pozwól jego zaplanowanej
   samonaprawiającej synchronizacji przenieść `beta` później

Mutacja tagu dystrybucji znajduje się w prywatnym repozytorium ze względów bezpieczeństwa, ponieważ nadal
wymaga `NPM_TOKEN`, podczas gdy publiczne repozytorium zachowuje publikowanie wyłącznie przez OIDC.

Dzięki temu zarówno bezpośrednia ścieżka publikacji, jak i ścieżka promocji najpierw-beta
są udokumentowane i widoczne dla operatora.

Jeśli maintainer musi awaryjnie użyć lokalnego uwierzytelniania npm, uruchamiaj wszystkie polecenia 1Password
CLI (`op`) tylko w dedykowanej sesji tmux. Nie wywołuj `op`
bezpośrednio z głównej powłoki agenta; trzymanie go w tmux sprawia, że monity,
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
jako właściwej instrukcji wykonawczej.

## Powiązane

- [Kanały wydań](/pl/install/development-channels)
