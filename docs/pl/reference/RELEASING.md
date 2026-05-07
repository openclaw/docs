---
read_when:
    - Wyszukiwanie definicji publicznych kanałów wydań
    - Uruchamianie walidacji wydania lub akceptacji pakietu
    - Szukam informacji o nazewnictwie wersji i harmonogramie wydań
summary: Ścieżki wydań, lista kontrolna operatora, środowiska walidacyjne, nazewnictwo wersji i kadencja
title: Polityka wydań
x-i18n:
    generated_at: "2026-05-07T15:08:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6843c7bd0d0a4f3815661f7d392ae7e60b0485a03f1cc53a4c3f13ad3e9a5f8
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ma trzy publiczne ścieżki wydań:

- stabilna: oznaczone wydania, które domyślnie publikują do npm `beta`, albo do npm `latest`, gdy zostanie to wyraźnie zażądane
- beta: tagi przedwydaniowe publikowane do npm `beta`
- deweloperska: ruchoma głowica gałęzi `main`

## Nazewnictwo wersji

- Wersja stabilnego wydania: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Wersja stabilnego wydania korygującego: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Wersja przedwydania beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Nie dodawaj zer wiodących do miesiąca ani dnia
- `latest` oznacza bieżące promowane stabilne wydanie npm
- `beta` oznacza bieżący docelowy wariant instalacji beta
- Wydania stabilne i stabilne wydania korygujące domyślnie publikują do npm `beta`; operatorzy wydań mogą jawnie wskazać `latest` albo później wypromować sprawdzoną kompilację beta
- Każde stabilne wydanie OpenClaw dostarcza razem pakiet npm i aplikację macOS;
  wydania beta zwykle najpierw walidują i publikują ścieżkę npm/pakietu, a
  kompilacja/podpisywanie/notaryzacja aplikacji Mac jest zarezerwowana dla wydań stabilnych, chyba że zostanie wyraźnie zażądana

## Harmonogram wydań

- Wydania idą najpierw przez beta
- Stabilne wydanie następuje dopiero po zwalidowaniu najnowszej bety
- Opiekunowie zwykle przygotowują wydania z gałęzi `release/YYYY.M.D` utworzonej
  z bieżącej gałęzi `main`, aby walidacja wydania i poprawki nie blokowały nowego
  rozwoju na `main`
- Jeśli tag beta został wypchnięty lub opublikowany i wymaga poprawki, opiekunowie tworzą
  następny tag `-beta.N` zamiast usuwać albo odtwarzać stary tag beta
- Szczegółowa procedura wydania, zatwierdzenia, poświadczenia i notatki odzyskiwania są
  dostępne tylko dla opiekunów

## Lista kontrolna operatora wydania

Ta lista kontrolna pokazuje publiczny kształt przepływu wydania. Prywatne poświadczenia,
podpisywanie, notaryzacja, odzyskiwanie dist-tagów i szczegóły awaryjnego wycofania pozostają w
runbooku wydaniowym dostępnym tylko dla opiekunów.

1. Zacznij od bieżącej gałęzi `main`: pobierz najnowsze zmiany, potwierdź, że docelowy commit został wypchnięty,
   i potwierdź, że bieżące CI gałęzi `main` jest wystarczająco zielone, aby utworzyć z niej gałąź.
2. Przepisz górną sekcję `CHANGELOG.md` na podstawie rzeczywistej historii commitów za pomocą
   `/changelog`, utrzymaj wpisy jako skierowane do użytkowników, zatwierdź je commitem, wypchnij i wykonaj rebase/pull
   jeszcze raz przed utworzeniem gałęzi.
3. Przejrzyj rekordy zgodności wydania w
   `src/plugins/compat/registry.ts` oraz
   `src/commands/doctor/shared/deprecation-compat.ts`. Usuń wygasłą
   zgodność tylko wtedy, gdy ścieżka aktualizacji pozostaje pokryta, albo zapisz, dlaczego jest
   celowo utrzymywana.
4. Utwórz `release/YYYY.M.D` z bieżącej gałęzi `main`; nie wykonuj normalnej pracy wydaniowej
   bezpośrednio na `main`.
5. Podbij każdą wymaganą lokalizację wersji dla zamierzonego tagu, a następnie uruchom
   `pnpm release:prep`. Odświeża to wersje pluginów, inwentarz pluginów, schemat
   konfiguracji, metadane konfiguracji dołączonych kanałów, bazę odniesienia dokumentacji konfiguracji, eksporty SDK pluginów
   oraz bazę odniesienia API SDK pluginów we właściwej kolejności. Zatwierdź commitem każdy wygenerowany
   dryf przed tagowaniem. Następnie uruchom lokalny deterministyczny preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` oraz `pnpm release:check`.
6. Uruchom `OpenClaw NPM Release` z `preflight_only=true`. Zanim tag istnieje,
   pełny 40-znakowy SHA gałęzi wydania jest dozwolony dla preflightu wyłącznie walidacyjnego.
   Zapisz udany `preflight_run_id`.
7. Uruchom wszystkie testy przedwydaniowe za pomocą `Full Release Validation` dla
   gałęzi wydania, tagu lub pełnego SHA commita. To jest jedyny ręczny punkt wejścia
   dla czterech dużych pól testowych wydania: Vitest, Docker, QA Lab i Package.
8. Jeśli walidacja się nie powiedzie, napraw problem na gałęzi wydania i uruchom ponownie najmniejszy nieudany
   plik, ścieżkę, zadanie workflow, profil pakietu, dostawcę albo allowlistę modelu, które
   dowodzą poprawki. Uruchom ponownie pełny parasol tylko wtedy, gdy zmieniona powierzchnia sprawia, że
   wcześniejsze dowody są nieaktualne.
9. Dla bety oznacz tagiem `vYYYY.M.D-beta.N`, a następnie uruchom `OpenClaw Release Publish` z
   odpowiadającej gałęzi `release/YYYY.M.D`. Workflow weryfikuje `pnpm plugins:sync:check`,
   wysyła wszystkie publikowalne pakiety pluginów do npm i ten sam zestaw równolegle do
   ClawHub, a następnie promuje przygotowany artefakt preflightu npm OpenClaw
   z odpowiadającym dist-tagiem, gdy tylko publikacja pluginów do npm się powiedzie.
   Publikowanie do ClawHub może nadal trwać, gdy OpenClaw publikuje się do npm, ale
   workflow publikacji wydania natychmiast wypisuje identyfikatory podrzędnych uruchomień. Domyślnie
   nie czeka na ClawHub po wysłaniu zadania, więc dostępność OpenClaw w npm
   nie jest blokowana przez wolniejsze zatwierdzenia ClawHub ani pracę rejestru; ustaw
   `wait_for_clawhub=true`, gdy ClawHub musi blokować ukończenie workflow. Ścieżka
   ClawHub ponawia przejściowe niepowodzenia instalacji zależności CLI, publikuje
   pluginy z zaliczonym podglądem nawet wtedy, gdy jedna komórka podglądu sporadycznie zawiedzie, i kończy się
   weryfikacją rejestru dla każdej oczekiwanej wersji pluginu, aby częściowe publikacje
   pozostawały widoczne i możliwe do ponowienia. Po publikacji uruchom
   akceptację pakietu po publikacji
   względem opublikowanego pakietu `openclaw@YYYY.M.D-beta.N` albo
   `openclaw@beta`. Jeśli wypchnięte lub opublikowane przedwydanie wymaga poprawki,
   utwórz następny odpowiadający numer przedwydania; nie usuwaj ani nie przepisuj starego
   przedwydania.
10. Dla wydania stabilnego kontynuuj dopiero wtedy, gdy sprawdzona beta albo kandydat do wydania ma
    wymagane dowody walidacji. Publikacja stabilna do npm również przechodzi przez
    `OpenClaw Release Publish`, ponownie używając udanego artefaktu preflightu przez
    `preflight_run_id`; gotowość stabilnego wydania macOS wymaga również
    spakowanych `.zip`, `.dmg`, `.dSYM.zip` oraz zaktualizowanego `appcast.xml` na `main`.
11. Po publikacji uruchom weryfikator npm po publikacji, opcjonalne samodzielne
    E2E Telegram z opublikowanego npm, gdy potrzebujesz dowodu kanału po publikacji,
    promocję dist-tagu, gdy jest potrzebna, notatki wydania/przedwydania GitHub z
    kompletnej odpowiadającej sekcji `CHANGELOG.md` oraz kroki ogłoszenia
    wydania.

## Preflight wydania

- Uruchom `pnpm check:test-types` przed kontrolą wstępną wydania, aby TypeScript testów pozostał
  objęty sprawdzaniem poza szybszą lokalną bramką `pnpm check`
- Uruchom `pnpm check:architecture` przed kontrolą wstępną wydania, aby szersze kontrole cykli
  importów i granic architektury były zielone poza szybszą lokalną bramką
- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane
  artefakty wydania `dist/*` i pakiet Control UI istniały na potrzeby kroku
  walidacji pakietu
- Uruchom `pnpm release:prep` po podbiciu wersji w katalogu głównym i przed tagowaniem. Uruchamia
  każdy deterministyczny generator wydania, który często rozjeżdża się po
  zmianie wersji/konfiguracji/API: wersje pluginów, inwentarz pluginów, bazowy schemat
  konfiguracji, metadane konfiguracji dołączonego kanału, bazę dokumentacji konfiguracji, eksporty SDK
  pluginów oraz bazę API SDK pluginów. `pnpm release:check` ponownie uruchamia te
  zabezpieczenia w trybie sprawdzania i zgłasza wszystkie znalezione błędy driftu wygenerowanych plików w jednym
  przebiegu przed uruchomieniem kontroli wydania pakietu.
- Uruchom ręczny workflow `Full Release Validation` przed zatwierdzeniem wydania, aby
  uruchomić wszystkie przedwydaniowe test boxy z jednego punktu wejścia. Przyjmuje gałąź,
  tag albo pełny SHA commita, uruchamia ręczny `CI` i uruchamia
  `OpenClaw Release Checks` dla smoke testu instalacji, akceptacji pakietu, międzyplatformowych
  kontroli pakietów, parytetu QA Lab, ścieżek Matrix i Telegram. Stabilne/domyślne przebiegi
  trzymają wyczerpujące live/E2E i długotrwały test ścieżki wydania Docker za
  `run_release_soak=true`; `release_profile=full` wymusza ich włączenie. Z
  `release_profile=full` i `rerun_group=all` uruchamia też pakietowe Telegram
  E2E względem artefaktu `release-package-under-test` z kontroli wydania.
  Podaj `npm_telegram_package_spec` po publikacji, gdy to samo
  Telegram E2E ma potwierdzić także opublikowany pakiet npm. Podaj
  `package_acceptance_package_spec` po publikacji, gdy Package Acceptance
  ma uruchomić swoją macierz pakiet/aktualizacja względem wysłanego pakietu npm zamiast
  artefaktu zbudowanego z SHA. Podaj
  `evidence_package_spec`, gdy prywatny raport dowodowy ma potwierdzić, że
  walidacja odpowiada opublikowanemu pakietowi npm bez wymuszania Telegram E2E.
  Przykład:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Uruchom ręczny workflow `Package Acceptance`, gdy chcesz mieć dowód bocznym kanałem
  dla kandydata pakietu, podczas gdy prace wydaniowe trwają. Użyj `source=npm` dla
  `openclaw@beta`, `openclaw@latest` albo dokładnej wersji wydania; `source=ref`
  do spakowania zaufanej gałęzi/tagu/SHA `package_ref` z bieżącym
  zestawem testowym `workflow_ref`; `source=url` dla archiwum tarball HTTPS z wymaganym
  SHA-256; albo `source=artifact` dla archiwum tarball przesłanego przez inny przebieg GitHub
  Actions. Workflow rozwiązuje kandydata do
  `package-under-test`, ponownie używa harmonogramu wydania Docker E2E względem tego
  archiwum tarball i może uruchomić QA Telegram względem tego samego archiwum tarball z
  `telegram_mode=mock-openai` albo `telegram_mode=live-frontier`. Gdy
  wybrane ścieżki Docker obejmują `published-upgrade-survivor`, artefakt
  pakietu jest kandydatem, a `published_upgrade_survivor_baseline` wybiera
  opublikowaną bazę. `update-restart-auth` używa pakietu kandydata jako
  zainstalowanego CLI i `package-under-test`, więc sprawdza ścieżkę zarządzanego restartu
  polecenia aktualizacji kandydata.
  Przykład: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Typowe profile:
  - `smoke`: ścieżki instalacji/kanału/agenta, sieci Gateway i przeładowania konfiguracji
  - `package`: natywne dla artefaktu ścieżki pakietu/aktualizacji/restartu/pluginu bez OpenWebUI ani live ClawHub
  - `product`: profil pakietu plus kanały MCP, czyszczenie cron/subagenta,
    wyszukiwanie webowe OpenAI i OpenWebUI
  - `full`: fragmenty ścieżki wydania Docker z OpenWebUI
  - `custom`: dokładny wybór `docker_lanes` dla ukierunkowanego ponownego przebiegu
- Uruchom ręczny workflow `CI` bezpośrednio, gdy potrzebujesz tylko pełnego zwykłego pokrycia CI
  dla kandydata wydania. Ręczne uruchomienia CI omijają zakresowanie po zmianach
  i wymuszają shardy Linux Node, shardy dołączonych pluginów, kontrakty kanałów,
  zgodność z Node 22, `check`, `check-additional`, smoke test kompilacji,
  kontrole dokumentacji, Python skills, Windows, macOS, Android oraz ścieżki i18n
  Control UI.
  Przykład: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Uruchom `pnpm qa:otel:smoke` podczas walidacji telemetrii wydania. Sprawdza
  QA-lab przez lokalny odbiornik OTLP/HTTP i weryfikuje wyeksportowane nazwy
  spanów trace, ograniczone atrybuty oraz redakcję treści/identyfikatorów bez
  wymagania Opik, Langfuse ani innego zewnętrznego kolektora.
- Uruchom `pnpm release:check` przed każdym tagowanym wydaniem
- Uruchom `OpenClaw Release Publish` dla mutującej sekwencji publikacji po tym, jak
  tag istnieje. Uruchom go z `release/YYYY.M.D` (albo `main`, gdy publikujesz
  tag osiągalny z main), przekaż tag wydania i pomyślny `preflight_run_id` OpenClaw npm
  oraz zachowaj domyślny zakres publikacji pluginów
  `all-publishable`, chyba że celowo wykonujesz ukierunkowaną naprawę. Ten
  workflow serializuje publikację npm pluginów, publikację ClawHub pluginów i publikację npm OpenClaw,
  aby pakiet core nie został opublikowany przed swoimi zewnętrznymi
  pluginami.
- Kontrole wydania działają teraz w osobnym ręcznym workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` uruchamia też ścieżkę parytetu mock QA Lab oraz szybki
  profil live Matrix i ścieżkę QA Telegram przed zatwierdzeniem wydania. Ścieżki live
  używają środowiska `qa-live-shared`; Telegram używa też dzierżaw poświadczeń Convex CI.
  Uruchom ręczny workflow `QA-Lab - All Lanes` z
  `matrix_profile=all` i `matrix_shards=true`, gdy chcesz pełny inwentarz transportu
  Matrix, multimediów i E2EE równolegle.
- Walidacja runtime instalacji i aktualizacji między systemami operacyjnymi jest częścią publicznych
  `OpenClaw Release Checks` oraz `Full Release Validation`, które wywołują
  wielokrotnego użytku workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` bezpośrednio
- Ten podział jest celowy: utrzymuje rzeczywistą ścieżkę wydania npm krótką,
  deterministyczną i skupioną na artefaktach, podczas gdy wolniejsze kontrole live pozostają we własnej
  ścieżce, aby nie wstrzymywały ani nie blokowały publikacji
- Kontrole wydania zawierające sekrety należy uruchamiać przez `Full Release
Validation` albo z refa workflow `main`/release, aby logika workflow i
  sekrety pozostały kontrolowane
- `OpenClaw Release Checks` przyjmuje gałąź, tag albo pełny SHA commita, o ile
  rozwiązany commit jest osiągalny z gałęzi OpenClaw albo tagu wydania
- Kontrola wstępna tylko walidacyjna `OpenClaw NPM Release` akceptuje także bieżący
  pełny, 40-znakowy SHA commita gałęzi workflow bez wymagania wypchniętego tagu
- Ta ścieżka SHA jest tylko walidacyjna i nie może zostać promowana do rzeczywistej publikacji
- W trybie SHA workflow syntetyzuje `v<package.json version>` tylko na potrzeby
  kontroli metadanych pakietu; rzeczywista publikacja nadal wymaga prawdziwego tagu wydania
- Oba workflow utrzymują rzeczywistą ścieżkę publikacji i promocji na runnerach hostowanych przez GitHub,
  podczas gdy niemutująca ścieżka walidacji może używać większych
  runnerów Blacksmith Linux
- Ten workflow uruchamia
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  z użyciem sekretów workflow `OPENAI_API_KEY` i `ANTHROPIC_API_KEY`
- Kontrola wstępna wydania npm nie czeka już na osobną ścieżkę kontroli wydania
- Uruchom `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (albo odpowiadający tag beta/korekty) przed zatwierdzeniem
- Po publikacji npm uruchom
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (albo odpowiadającą wersję beta/korekty), aby zweryfikować ścieżkę instalacji z opublikowanego rejestru
  w świeżym tymczasowym prefiksie
- Po publikacji beta uruchom `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  aby zweryfikować onboarding zainstalowanego pakietu, konfigurację Telegram i rzeczywiste Telegram E2E
  względem opublikowanego pakietu npm przy użyciu współdzielonej puli dzierżawionych poświadczeń Telegram.
  Lokalne jednorazowe przebiegi maintainerów mogą pominąć zmienne Convex i przekazać trzy
  poświadczenia env `OPENCLAW_QA_TELEGRAM_*` bezpośrednio.
- Aby uruchomić pełny smoke test beta po publikacji z maszyny maintainera, użyj `pnpm release:beta-smoke -- --beta betaN`. Helper uruchamia walidację aktualizacji npm/fresh-target w Parallels, uruchamia `NPM Telegram Beta E2E`, odpytuje dokładny przebieg workflow, pobiera artefakt i wypisuje raport Telegram.
- Maintainerzy mogą uruchomić tę samą kontrolę po publikacji z GitHub Actions przez
  ręczny workflow `NPM Telegram Beta E2E`. Jest celowo wyłącznie ręczny i
  nie uruchamia się przy każdym scaleniu.
- Automatyzacja wydania dla maintainerów używa teraz modelu kontrola wstępna, potem promocja:
  - rzeczywista publikacja npm musi przejść pomyślny `preflight_run_id` npm
  - rzeczywista publikacja npm musi być uruchomiona z tej samej gałęzi `main` albo
    `release/YYYY.M.D` co pomyślny przebieg kontroli wstępnej
  - stabilne wydania npm domyślnie używają `beta`
  - stabilna publikacja npm może jawnie wskazać `latest` przez wejście workflow
  - mutacja npm dist-tag oparta na tokenie znajduje się teraz w
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    ze względów bezpieczeństwa, ponieważ `npm dist-tag add` nadal potrzebuje `NPM_TOKEN`, podczas gdy
    publiczne repo zachowuje publikację wyłącznie przez OIDC
  - publiczny `macOS Release` jest tylko walidacyjny; gdy tag istnieje wyłącznie na
    gałęzi wydania, ale workflow jest uruchamiany z `main`, ustaw
    `public_release_branch=release/YYYY.M.D`
  - rzeczywista prywatna publikacja mac musi przejść pomyślny prywatny mac
    `preflight_run_id` i `validate_run_id`
  - rzeczywiste ścieżki publikacji promują przygotowane artefakty zamiast budować
    je ponownie
- Dla stabilnych wydań korygujących, takich jak `YYYY.M.D-N`, weryfikator po publikacji
  sprawdza także tę samą ścieżkę aktualizacji z tymczasowym prefiksem z `YYYY.M.D` do `YYYY.M.D-N`,
  aby korekty wydania nie mogły po cichu pozostawić starszych globalnych instalacji na
  bazowym stabilnym ładunku
- Kontrola wstępna wydania npm kończy się niepowodzeniem w trybie fail-closed, chyba że archiwum tarball zawiera zarówno
  `dist/control-ui/index.html`, jak i niepusty ładunek `dist/control-ui/assets/`,
  abyśmy ponownie nie wysłali pustego panelu przeglądarkowego
- Weryfikacja po publikacji sprawdza też, czy opublikowane entrypointy pluginów i
  metadane pakietu są obecne w zainstalowanym układzie rejestru. Wydanie, które
  wysyła brakujące ładunki runtime pluginów, nie przechodzi weryfikatora po publikacji i
  nie może zostać promowane do `latest`.
- `pnpm test:install:smoke` wymusza także budżet `unpackedSize` pakietu npm na
  archiwum tarball kandydata aktualizacji, więc installer e2e wychwytuje przypadkowy wzrost rozmiaru pakietu
  przed ścieżką publikacji wydania
- Jeśli prace wydaniowe dotknęły planowania CI, manifestów czasu pluginów albo
  macierzy testów pluginów, wygeneruj ponownie i przejrzyj należące do planera
  wyjścia macierzy `plugin-prerelease-extension-shard` z
  `.github/workflows/plugin-prerelease.yml` przed zatwierdzeniem, aby notatki wydania
  nie opisywały nieaktualnego układu CI
- Gotowość stabilnego wydania macOS obejmuje też powierzchnie aktualizatora:
  - GitHub release musi ostatecznie zawierać spakowane `.zip`, `.dmg` i `.dSYM.zip`
  - `appcast.xml` na `main` musi wskazywać nowy stabilny zip po publikacji
  - spakowana aplikacja musi zachować niedebugowy identyfikator pakietu, niepusty URL feedu Sparkle
    oraz `CFBundleVersion` na poziomie lub powyżej kanonicznego dolnego progu builda Sparkle
    dla tej wersji wydania

## Test boxy wydania

`Full Release Validation` to sposób, w jaki operatorzy uruchamiają wszystkie testy przedwydaniowe z
jednego punktu wejścia. Aby uzyskać dowód przypiętego commita na szybko zmieniającej się gałęzi, użyj
helpera, aby każdy podrzędny workflow działał z tymczasowej gałęzi ustalonej na docelowym
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper wypycha `release-ci/<sha>-...`, uruchamia `Full Release Validation`
z tej gałęzi z `ref=<sha>`, weryfikuje, że `headSha` każdego podrzędnego workflow
odpowiada celowi, a następnie usuwa tymczasową gałąź. Zapobiega to przypadkowemu potwierdzeniu
nowszego podrzędnego przebiegu `main`.

W przypadku walidacji gałęzi lub tagu wydania uruchom ją z zaufanego odwołania
workflow `main` i przekaż gałąź lub tag wydania jako `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow rozwiązuje docelowe odwołanie, uruchamia ręczne `CI` z
`target_ref=<release-ref>`, uruchamia `OpenClaw Release Checks`, przygotowuje
nadrzędny artefakt `release-package-under-test` na potrzeby kontroli dotyczących pakietów oraz
uruchamia samodzielne pakietowe Telegram E2E, gdy `release_profile=full` z
`rerun_group=all` albo gdy ustawiono `npm_telegram_package_spec`. Następnie `OpenClaw Release
Checks` rozdziela się na install smoke, międzyplatformowe kontrole wydania, pokrycie ścieżki
wydania Docker live/E2E, gdy soak jest włączony, Package Acceptance z pakietowym QA Telegram,
parytet QA Lab, live Matrix i live Telegram. Pełny przebieg jest akceptowalny tylko wtedy, gdy
podsumowanie `Full Release Validation`
pokazuje `normal_ci` i `release_checks` jako zakończone powodzeniem. W trybie full/all
podrzędny przebieg `npm_telegram` również musi zakończyć się powodzeniem; poza full/all jest pomijany,
chyba że podano opublikowany `npm_telegram_package_spec`. Końcowe
podsumowanie weryfikatora zawiera tabele najwolniejszych zadań dla każdego przebiegu podrzędnego, dzięki czemu menedżer wydania może zobaczyć bieżącą ścieżkę krytyczną bez pobierania logów.
Zobacz [Pełna walidacja wydania](/pl/reference/full-release-validation), aby poznać
pełną macierz etapów, dokładne nazwy zadań workflow, różnice między profilami stable i full,
artefakty oraz uchwyty do ukierunkowanych ponownych uruchomień.
Podrzędne workflow są uruchamiane z zaufanego odwołania, które uruchamia `Full Release
Validation`, zwykle `--ref main`, nawet gdy docelowe `ref` wskazuje na
starszą gałąź lub tag wydania. Nie ma osobnego wejścia workflow-ref dla Full Release Validation;
wybierz zaufany harness, wybierając odwołanie uruchomienia workflow.
Nie używaj `--ref main -f ref=<sha>` do dowodu dokładnego commita na ruchomym `main`;
surowe SHA commitów nie mogą być odwołaniami dispatch workflow, więc użyj
`pnpm ci:full-release --sha <sha>`, aby utworzyć przypiętą gałąź tymczasową.

Użyj `release_profile`, aby wybrać zakres live/dostawców:

- `minimum`: najszybsza krytyczna dla wydania ścieżka OpenAI/core live i Docker
- `stable`: minimum plus stabilne pokrycie dostawców/backendów do zatwierdzenia wydania
- `full`: stable plus szerokie doradcze pokrycie dostawców/mediów

Użyj `run_release_soak=true` ze `stable`, gdy blokujące wydanie ścieżki są
zielone i chcesz wykonać wyczerpujące live/E2E, ścieżkę wydania Docker oraz
ograniczony przegląd przetrwania aktualizacji z opublikowanych wersji przed promocją. Ten przegląd obejmuje
najnowsze cztery stabilne pakiety plus przypięte linie bazowe `2026.4.23` i `2026.5.2`
oraz starsze pokrycie `2026.4.15`, z usuniętymi zduplikowanymi liniami bazowymi i
każdą linią bazową podzieloną do osobnego zadania Docker runner. `full` implikuje
`run_release_soak=true`.

`OpenClaw Release Checks` używa zaufanego odwołania workflow, aby jednorazowo rozwiązać docelowe
odwołanie jako `release-package-under-test`, i ponownie używa tego artefaktu w kontrolach cross-OS,
Package Acceptance oraz Docker ścieżki wydania, gdy uruchamiany jest soak. Dzięki temu
wszystkie środowiska dotyczące pakietów używają tych samych bajtów i unika się powtarzania buildów pakietu.
Międzyplatformowy OpenAI install smoke używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy
zmienna repo/organizacji jest ustawiona, w przeciwnym razie `openai/gpt-5.4`, ponieważ ta ścieżka
dowodzi instalacji pakietu, onboardingu, startu Gateway i jednej live tury agenta,
a nie benchmarkuje najwolniejszego modelu domyślnego. Szersza macierz dostawców live
pozostaje miejscem na pokrycie specyficzne dla modeli.

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

Nie używaj pełnego parasola jako pierwszego ponownego uruchomienia po ukierunkowanej poprawce. Jeśli jedno środowisko
zawiedzie, użyj nieudanego podrzędnego workflow, zadania, ścieżki Docker, profilu pakietu, dostawcy
modelu albo ścieżki QA jako kolejnego dowodu. Uruchom pełny parasol ponownie tylko wtedy, gdy
poprawka zmieniła współdzieloną orkiestrację wydania albo wcześniejsze dowody ze wszystkich środowisk
stały się nieaktualne. Końcowy weryfikator parasola ponownie sprawdza zapisane identyfikatory uruchomień workflow podrzędnych, więc po pomyślnym ponownym uruchomieniu workflow podrzędnego uruchom ponownie tylko nieudane
nadrzędne zadanie `Verify full validation`.

Dla ograniczonego odzyskiwania przekaż `rerun_group` do parasola. `all` to rzeczywisty
przebieg kandydata do wydania, `ci` uruchamia tylko podrzędny normalny CI, `plugin-prerelease`
uruchamia tylko podrzędny release-only plugin, `release-checks` uruchamia każde środowisko wydania,
a węższe grupy wydania to `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` i `npm-telegram`.
Ukierunkowane ponowne uruchomienia `npm-telegram` wymagają `npm_telegram_package_spec`; przebiegi full/all
z `release_profile=full` używają artefaktu pakietu z release-checks. Ukierunkowane
ponowne uruchomienia cross-OS mogą dodać `cross_os_suite_filter=windows/packaged-upgrade` albo
inny filtr OS/zestawu. Niepowodzenia QA release-check są doradcze; niepowodzenie tylko QA
nie blokuje walidacji wydania.

### Vitest

Sekcja Vitest to ręczne podrzędne workflow `CI`. Ręczne CI celowo
pomija zawężanie zmian i wymusza normalny graf testów dla kandydata do wydania:
shardy Linux Node, shardy bundled-plugin, kontrakty kanałów, zgodność Node 22,
`check`, `check-additional`, build smoke, kontrole dokumentacji, Python
skills, Windows, macOS, Android i i18n Control UI.

Użyj tej sekcji, aby odpowiedzieć na pytanie „czy drzewo źródeł przeszło pełny normalny zestaw testów?”
To nie jest to samo co walidacja produktu ścieżki wydania. Dowody do zachowania:

- podsumowanie `Full Release Validation` pokazujące URL uruchomionego przebiegu `CI`
- zielony przebieg `CI` na dokładnym docelowym SHA
- nazwy nieudanych lub wolnych shardów z zadań CI podczas badania regresji
- artefakty czasów Vitest, takie jak `.artifacts/vitest-shard-timings.json`, gdy
  przebieg wymaga analizy wydajności

Uruchom ręczne CI bezpośrednio tylko wtedy, gdy wydanie wymaga deterministycznego normalnego CI, ale
nie środowisk Docker, QA Lab, live, cross-OS ani package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Sekcja Docker znajduje się w `OpenClaw Release Checks` przez
`openclaw-live-and-e2e-checks-reusable.yml` oraz workflow `install-smoke`
w trybie wydania. Waliduje kandydata do wydania przez spakowane
środowiska Docker, a nie tylko testy na poziomie źródeł.

Pokrycie Docker wydania obejmuje:

- pełny install smoke z włączonym wolnym Bun global install smoke
- przygotowanie/ponowne użycie obrazu smoke root Dockerfile według docelowego SHA, z zadaniami QR,
  root/gateway oraz installer/Bun smoke działającymi jako osobne shardy install-smoke
- ścieżki E2E repozytorium
- chunki Docker ścieżki wydania: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` i `plugins-runtime-install-h`
- pokrycie OpenWebUI wewnątrz chunka `plugins-runtime-services`, gdy jest wymagane
- podzielone ścieżki instalacji/deinstalacji bundled plugin
  `bundled-plugin-install-uninstall-0` do
  `bundled-plugin-install-uninstall-23`
- zestawy dostawców live/E2E oraz pokrycie modeli Docker live, gdy kontrole wydania
  obejmują zestawy live

Użyj artefaktów Docker przed ponownym uruchomieniem. Harmonogram ścieżki wydania przesyła
`.artifacts/docker-tests/` z logami ścieżek, `summary.json`, `failures.json`,
czasami faz, JSON planu harmonogramu i poleceniami ponownego uruchomienia. Dla ukierunkowanego odzyskiwania
użyj `docker_lanes=<lane[,lane]>` w wielokrotnego użytku workflow live/E2E zamiast
ponownie uruchamiać wszystkie chunki wydania. Wygenerowane polecenia ponownego uruchomienia zawierają wcześniejsze
`package_artifact_run_id` i przygotowane wejścia obrazów Docker, gdy są dostępne, więc
nieudana ścieżka może ponownie użyć tego samego tarballa i obrazów GHCR.

### QA Lab

Sekcja QA Lab jest także częścią `OpenClaw Release Checks`. To bramka wydania dla
zachowania agentowego i poziomu kanałów, osobna od Vitest i mechaniki pakietów Docker.

Pokrycie QA Lab wydania obejmuje:

- ścieżkę mock parity porównującą kandydacką ścieżkę OpenAI z linią bazową Opus 4.6
  przy użyciu pakietu agentic parity
- szybki profil live Matrix QA używający środowiska `qa-live-shared`
- ścieżkę live Telegram QA używającą dzierżaw poświadczeń Convex CI
- `pnpm qa:otel:smoke`, gdy telemetryka wydania wymaga jawnego lokalnego dowodu

Użyj tej sekcji, aby odpowiedzieć na pytanie „czy wydanie zachowuje się poprawnie w scenariuszach QA i
przepływach kanałów live?” Zachowaj URL-e artefaktów dla ścieżek parity, Matrix i Telegram
podczas zatwierdzania wydania. Pełne pokrycie Matrix pozostaje dostępne jako
ręczny shardowany przebieg QA-Lab, a nie domyślna ścieżka krytyczna wydania.

### Package

Sekcja Package to bramka instalowalnego produktu. Opiera się na
`Package Acceptance` i resolverze
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver normalizuje
kandydata do tarballa `package-under-test` używanego przez Docker E2E, waliduje
inwentarz pakietu, zapisuje wersję pakietu i SHA-256 oraz utrzymuje
odwołanie harness workflow osobno od odwołania źródła pakietu.

Obsługiwane źródła kandydatów:

- `source=npm`: `openclaw@beta`, `openclaw@latest` albo dokładna wersja wydania OpenClaw
- `source=ref`: spakuj zaufaną gałąź, tag albo pełne SHA commita `package_ref`
  z wybranym harness `workflow_ref`
- `source=url`: pobierz HTTPS `.tgz` z wymaganym `package_sha256`
- `source=artifact`: ponownie użyj `.tgz` przesłanego przez inny przebieg GitHub Actions

`OpenClaw Release Checks` uruchamia Package Acceptance z `source=artifact`,
przygotowanym artefaktem pakietu wydania, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance utrzymuje migrację, aktualizację,
restart aktualizacji skonfigurowanego auth, czyszczenie przestarzałych zależności Plugin, offline fixtures Plugin,
aktualizację Plugin oraz pakietowe QA Telegram względem tego samego rozwiązanego
tarballa. Blokujące kontrole wydania używają domyślnej najnowszej opublikowanej linii bazowej pakietu;
`run_release_soak=true` albo
`release_profile=full` rozszerza zakres do każdej stabilnej linii bazowej opublikowanej w npm od
`2026.4.23` do `latest` plus fixtures zgłoszonych problemów. Użyj
Package Acceptance z `source=npm` dla kandydata już wysłanego, albo
`source=ref`/`source=artifact` dla lokalnego tarballa npm opartego na SHA przed
publikacją. To natywny dla GitHub
zamiennik większości pokrycia pakietów/aktualizacji, które wcześniej wymagało
Parallels. Międzyplatformowe kontrole wydania nadal mają znaczenie dla onboardingu,
instalatora i zachowania platform specyficznych dla OS, ale walidacja produktu pakietów/aktualizacji powinna
preferować Package Acceptance.

Kanoniczna lista kontrolna dla walidacji aktualizacji i Plugin jest dostępna w
[Testowanie aktualizacji i Plugin](/pl/help/testing-updates-plugins). Użyj jej przy
decydowaniu, która lokalna, Docker, Package Acceptance albo release-check ścieżka dowodzi
instalacji/aktualizacji Plugin, czyszczenia przez doctor albo zmiany migracji opublikowanego pakietu.
Wyczerpująca migracja aktualizacji opublikowanych z każdego stabilnego pakietu `2026.4.23+` jest
osobnym ręcznym workflow `Update Migration`, a nie częścią Full Release CI.

Starsza pobłażliwość akceptacji pakietów jest celowo ograniczona czasowo. Pakiety do
`2026.4.25` mogą używać ścieżki zgodności dla luk w metadanych już opublikowanych
w npm: prywatnych wpisów inwentarza QA brakujących w tarballu, brakującego
`gateway install --wrapper`, brakujących plików poprawek w fixture git
pochodzącej z tarballa, brakującego utrwalonego `update.channel`, starszych
lokalizacji rekordów instalacji Plugin, brakującego utrwalania rekordów
instalacji z marketplace oraz migracji metadanych konfiguracji podczas
`plugins update`. Opublikowany pakiet `2026.4.26` może ostrzegać o lokalnych
plikach znaczników metadanych kompilacji, które zostały już wydane. Późniejsze
pakiety muszą spełniać współczesne kontrakty pakietów; te same luki powodują
niepowodzenie walidacji wydania.

Użyj szerszych profili Package Acceptance, gdy pytanie dotyczące wydania dotyczy
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

- `smoke`: szybkie ścieżki instalacji pakietu/kanału/agenta, sieci Gateway i
  ponownego wczytania konfiguracji
- `package`: kontrakty instalacji/aktualizacji/restartu/pakietu Plugin bez live
  ClawHub; to domyślny profil kontroli wydania
- `product`: `package` plus kanały MCP, czyszczenie cron/subagenta, wyszukiwanie
  webowe OpenAI i OpenWebUI
- `full`: fragmenty ścieżki wydania Docker z OpenWebUI
- `custom`: dokładna lista `docker_lanes` do ukierunkowanych ponowień

Dla dowodu Telegram kandydata pakietu włącz `telegram_mode=mock-openai` lub
`telegram_mode=live-frontier` w Package Acceptance. Workflow przekazuje
rozwiązany tarball `package-under-test` do ścieżki Telegram; samodzielny
workflow Telegram nadal akceptuje opublikowaną specyfikację npm do kontroli po
publikacji.

## Automatyzacja publikacji wydania

`OpenClaw Release Publish` to zwykły modyfikujący punkt wejścia publikacji.
Orkiestruje workflowy zaufanego wydawcy w kolejności wymaganej przez wydanie:

1. Pobierz tag wydania i rozwiąż jego SHA commita.
2. Sprawdź, czy tag jest osiągalny z `main` lub `release/*`.
3. Uruchom `pnpm plugins:sync:check`.
4. Uruchom `Plugin NPM Release` z `publish_scope=all-publishable` i
   `ref=<release-sha>`.
5. Uruchom `Plugin ClawHub Release` z tym samym zakresem i SHA.
6. Uruchom `OpenClaw NPM Release` z tagiem wydania, npm dist-tag i zapisanym
   `preflight_run_id`.

Przykład publikacji beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Publikacja stabilna do domyślnego dist-tag beta:

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

Używaj niższopoziomowych workflowów `Plugin NPM Release` i
`Plugin ClawHub Release` tylko do ukierunkowanej naprawy lub ponownej publikacji.
Dla wybranej naprawy Plugin przekaż `plugin_publish_scope=selected` i
`plugins=@openclaw/name` do `OpenClaw Release Publish`, albo uruchom workflow
podrzędny bezpośrednio, gdy pakiet OpenClaw nie może zostać opublikowany.

## Dane wejściowe workflow NPM

`OpenClaw NPM Release` akceptuje następujące dane wejściowe kontrolowane przez
operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1` lub
  `v2026.4.2-beta.1`; gdy `preflight_only=true`, może to być także bieżący
  pełny 40-znakowy SHA commita gałęzi workflow do preflightu tylko walidacyjnego
- `preflight_only`: `true` tylko dla walidacji/kompilacji/pakietu, `false` dla
  rzeczywistej ścieżki publikacji
- `preflight_run_id`: wymagane na rzeczywistej ścieżce publikacji, aby workflow
  ponownie użył przygotowanego tarballa z udanego uruchomienia preflight
- `npm_dist_tag`: docelowy tag npm dla ścieżki publikacji; domyślnie `beta`

`OpenClaw Release Publish` akceptuje następujące dane wejściowe kontrolowane
przez operatora:

- `tag`: wymagany tag wydania; musi już istnieć
- `preflight_run_id`: id udanego uruchomienia preflight `OpenClaw NPM Release`;
  wymagane, gdy `publish_openclaw_npm=true`
- `npm_dist_tag`: docelowy tag npm dla pakietu OpenClaw
- `plugin_publish_scope`: domyślnie `all-publishable`; używaj `selected` tylko
  do ukierunkowanej naprawy
- `plugins`: rozdzielone przecinkami nazwy pakietów `@openclaw/*`, gdy
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: domyślnie `true`; ustaw `false` tylko wtedy, gdy
  używasz workflow jako orkiestratora naprawy wyłącznie dla Plugin

`OpenClaw Release Checks` akceptuje następujące dane wejściowe kontrolowane przez
operatora:

- `ref`: gałąź, tag lub pełny SHA commita do walidacji. Kontrole używające
  sekretów wymagają, aby rozwiązany commit był osiągalny z gałęzi OpenClaw lub
  taga wydania.
- `run_release_soak`: włącza wyczerpujące live/E2E, ścieżkę wydania Docker i
  soak all-since upgrade-survivor w stabilnych/domyślnych kontrolach wydania.
  Jest wymuszane przez `release_profile=full`.

Zasady:

- Tagi stabilne i korygujące mogą publikować do `beta` albo `latest`
- Tagi prerelease beta mogą publikować tylko do `beta`
- Dla `OpenClaw NPM Release` wejście pełnego SHA commita jest dozwolone tylko,
  gdy `preflight_only=true`
- `OpenClaw Release Checks` i `Full Release Validation` są zawsze wyłącznie
  walidacyjne
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, którego
  użyto podczas preflightu; workflow weryfikuje te metadane przed kontynuacją
  publikacji

## Sekwencja stabilnego wydania npm

Podczas przygotowywania stabilnego wydania npm:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`
   - Zanim tag istnieje, możesz użyć bieżącego pełnego SHA commita gałęzi
     workflow do walidacyjnego próbnego uruchomienia workflow preflight
2. Wybierz `npm_dist_tag=beta` dla normalnego przepływu beta-first albo `latest`
   tylko wtedy, gdy celowo chcesz bezpośredniej publikacji stabilnej
3. Uruchom `Full Release Validation` na gałęzi wydania, tagu wydania lub pełnym
   SHA commita, gdy chcesz uzyskać normalne CI plus live prompt cache, Docker,
   QA Lab, Matrix i pokrycie Telegram z jednego ręcznego workflow
4. Jeśli celowo potrzebujesz tylko deterministycznego zwykłego grafu testów,
   uruchom ręczny workflow `CI` na ref wydania
5. Zapisz udane `preflight_run_id`
6. Uruchom `OpenClaw Release Publish` z tym samym `tag`, tym samym
   `npm_dist_tag` i zapisanym `preflight_run_id`; publikuje zewnętrzne Pluginy
   do npm i ClawHub przed promowaniem pakietu npm OpenClaw
7. Jeśli wydanie trafiło na `beta`, użyj prywatnego workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   aby promować tę stabilną wersję z `beta` do `latest`
8. Jeśli wydanie celowo opublikowano bezpośrednio do `latest`, a `beta` ma
   natychmiast wskazywać tę samą stabilną kompilację, użyj tego samego
   prywatnego workflow, aby skierować oba dist-tag na wersję stabilną, albo
   pozwól, aby jego zaplanowana samonaprawiająca synchronizacja przeniosła
   `beta` później

Mutacja dist-tag znajduje się w prywatnym repo ze względów bezpieczeństwa,
ponieważ nadal wymaga `NPM_TOKEN`, podczas gdy publiczne repo zachowuje
publikowanie wyłącznie przez OIDC.

Dzięki temu zarówno bezpośrednia ścieżka publikacji, jak i ścieżka promocji
beta-first są udokumentowane i widoczne dla operatora.

Jeśli maintainer musi awaryjnie użyć lokalnego uwierzytelniania npm, uruchamiaj
wszelkie polecenia CLI 1Password (`op`) tylko w dedykowanej sesji tmux. Nie
wywołuj `op` bezpośrednio z głównej powłoki agenta; trzymanie go w tmux sprawia,
że monity, alerty i obsługa OTP są obserwowalne oraz zapobiega powtarzanym
alertom hosta.

## Odniesienia publiczne

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
jako właściwej instrukcji operacyjnej.

## Powiązane

- [Kanały wydań](/pl/install/development-channels)
