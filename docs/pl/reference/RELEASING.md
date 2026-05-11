---
read_when:
    - Wyszukiwanie definicji publicznych kanałów wydań
    - Uruchamianie walidacji wydania lub akceptacji pakietu
    - Szukasz nazewnictwa wersji i rytmu wydań
summary: Ścieżki wydań, lista kontrolna operatora, pola walidacyjne, nazewnictwo wersji i cykl
title: Zasady wydawania
x-i18n:
    generated_at: "2026-05-11T20:37:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4f3aaa53534bb6d1af5e72900a48f52fc89ff8188af7b19ecf75543bfcb1ecb
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ma trzy publiczne ścieżki wydań:

- stable: oznaczone tagami wydania publikowane domyślnie do npm `beta` albo do npm `latest`, gdy zostanie to wyraźnie zażądane
- beta: tagi wydań wstępnych publikowane do npm `beta`
- dev: ruchoma głowica gałęzi `main`

## Nazewnictwo wersji

- Wersja wydania stabilnego: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Wersja poprawkowego wydania stabilnego: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Wersja wydania wstępnego beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Nie dodawaj zer wiodących do miesiąca ani dnia
- `latest` oznacza bieżące promowane stabilne wydanie npm
- `beta` oznacza bieżący cel instalacji beta
- Wydania stabilne i poprawkowe wydania stabilne domyślnie publikują do npm `beta`; operatorzy wydania mogą jawnie wskazać `latest` albo później wypromować sprawdzony build beta
- Każde stabilne wydanie OpenClaw dostarcza razem pakiet npm i aplikację macOS;
  wydania beta zwykle najpierw walidują i publikują ścieżkę npm/pakietu, a
  build/podpisywanie/notaryzacja aplikacji Mac są zarezerwowane dla wydań stabilnych, chyba że wyraźnie zażądano inaczej

## Rytm wydań

- Wydania przechodzą najpierw przez beta
- Stable następuje dopiero po zwalidowaniu najnowszej beta
- Opiekunowie zwykle przygotowują wydania z gałęzi `release/YYYY.M.D` utworzonej
  z bieżącej `main`, aby walidacja wydania i poprawki nie blokowały nowego
  rozwoju na `main`
- Jeśli tag beta został wypchnięty lub opublikowany i wymaga poprawki, opiekunowie przygotowują
  następny tag `-beta.N` zamiast usuwać lub odtwarzać stary tag beta
- Szczegółowa procedura wydania, zatwierdzenia, poświadczenia i notatki odzyskiwania są
  dostępne tylko dla opiekunów

## Lista kontrolna operatora wydania

Ta lista kontrolna pokazuje publiczny kształt przepływu wydania. Prywatne poświadczenia,
podpisywanie, notaryzacja, odzyskiwanie dist-tagów i szczegóły awaryjnego wycofania pozostają w
runbooku wydań dostępnym tylko dla opiekunów.

1. Zacznij od bieżącej `main`: pobierz najnowsze zmiany, potwierdź, że docelowy commit jest wypchnięty,
   i potwierdź, że bieżące CI `main` jest wystarczająco zielone, aby utworzyć z niej gałąź.
2. Przepisz górną sekcję `CHANGELOG.md` na podstawie rzeczywistej historii commitów za pomocą
   `/changelog`, zachowaj wpisy ukierunkowane na użytkownika, scommituj je, wypchnij i jeszcze raz wykonaj rebase/pull
   przed utworzeniem gałęzi.
3. Przejrzyj rekordy kompatybilności wydania w
   `src/plugins/compat/registry.ts` i
   `src/commands/doctor/shared/deprecation-compat.ts`. Usuń wygasłą
   kompatybilność tylko wtedy, gdy ścieżka aktualizacji pozostaje obsłużona, albo zapisz, dlaczego jest
   celowo zachowana.
4. Utwórz `release/YYYY.M.D` z bieżącej `main`; nie wykonuj normalnej pracy wydaniowej
   bezpośrednio na `main`.
5. Podbij każdą wymaganą lokalizację wersji dla zamierzonego tagu, a następnie uruchom
   `pnpm release:prep`. Odświeża to wersje pluginów, inwentarz pluginów, schemat
   konfiguracji, metadane konfiguracji dołączonego kanału, baseline dokumentacji konfiguracji, eksporty SDK
   pluginów i baseline API SDK pluginów we właściwej kolejności. Scommituj każdy wygenerowany
   dryf przed tagowaniem. Następnie uruchom lokalny deterministyczny preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` oraz `pnpm release:check`.
6. Uruchom `OpenClaw NPM Release` z `preflight_only=true`. Zanim tag istnieje,
   pełny 40-znakowy SHA gałęzi wydania jest dozwolony dla preflightu wyłącznie walidacyjnego.
   Zapisz udany `preflight_run_id`.
7. Uruchom wszystkie testy przedwydaniowe za pomocą `Full Release Validation` dla
   gałęzi wydania, tagu lub pełnego SHA commita. To jest jeden ręczny punkt wejścia
   dla czterech dużych boksów testowych wydania: Vitest, Docker, QA Lab i Package.
8. Jeśli walidacja się nie powiedzie, napraw na gałęzi wydania i uruchom ponownie najmniejszy nieudany
   plik, ścieżkę, zadanie workflow, profil pakietu, dostawcę lub listę dozwolonych modeli, które
   dowodzą poprawki. Uruchom ponownie pełny umbrella tylko wtedy, gdy zmieniona powierzchnia sprawia,
   że wcześniejsze dowody są nieaktualne.
9. Dla beta otaguj `vYYYY.M.D-beta.N`, a następnie uruchom `OpenClaw Release Publish` z
   pasującej gałęzi `release/YYYY.M.D`. Weryfikuje ono `pnpm plugins:sync:check`,
   wysyła wszystkie publikowalne pakiety pluginów do npm i ten sam zestaw do
   ClawHub równolegle, a następnie promuje przygotowany artefakt preflight npm OpenClaw
   z pasującym dist-tagiem, gdy tylko publikacja pluginów npm się powiedzie.
   Po powodzeniu podrzędnego zadania publikacji npm OpenClaw tworzy lub aktualizuje
   pasującą stronę wydania/prerelease GitHub na podstawie pełnej pasującej
   sekcji `CHANGELOG.md`. Wydania stabilne opublikowane do npm `latest` stają się
   najnowszym wydaniem GitHub; stabilne wydania utrzymaniowe pozostawione na npm `beta` są
   tworzone z GitHub `latest=false`.
   Publikowanie ClawHub może nadal trwać, gdy OpenClaw publikuje do npm, ale workflow
   publikacji wydania natychmiast wypisuje identyfikatory podrzędnych uruchomień. Domyślnie
   nie czeka na ClawHub po jego wysłaniu, więc dostępność OpenClaw w npm
   nie jest blokowana przez wolniejsze zatwierdzenia ClawHub ani pracę rejestru; ustaw
   `wait_for_clawhub=true`, gdy ClawHub musi blokować ukończenie workflow. Ścieżka
   ClawHub ponawia przejściowe awarie instalacji zależności CLI, publikuje
   pluginy z zaliczonym podglądem nawet wtedy, gdy jedna komórka podglądu jest niestabilna, i kończy się
   weryfikacją rejestru dla każdej oczekiwanej wersji pluginu, dzięki czemu częściowe publikacje
   pozostają widoczne i możliwe do ponowienia. Po publikacji uruchom
   akceptację pakietu po publikacji
   względem opublikowanego pakietu `openclaw@YYYY.M.D-beta.N` lub
   `openclaw@beta`. Jeśli wypchnięte lub opublikowane wydanie wstępne wymaga poprawki,
   przygotuj następny pasujący numer wydania wstępnego; nie usuwaj ani nie przepisuj starego
   wydania wstępnego.
10. Dla stabilnego wydania kontynuuj dopiero po tym, jak sprawdzona beta lub kandydat wydania ma
    wymagane dowody walidacji. Publikacja stabilna npm również przechodzi przez
    `OpenClaw Release Publish`, ponownie używając udanego artefaktu preflight przez
    `preflight_run_id`; gotowość stabilnego wydania macOS wymaga również
    spakowanych `.zip`, `.dmg`, `.dSYM.zip` i zaktualizowanego `appcast.xml` na `main`.
    Prywatny workflow publikacji macOS publikuje podpisany appcast do publicznej
    `main` automatycznie po zweryfikowaniu zasobów wydania; jeśli ochrona gałęzi blokuje
    bezpośredni push, otwiera lub aktualizuje PR appcast.
11. Po publikacji uruchom weryfikator npm po publikacji, opcjonalny samodzielny
    Telegram E2E dla opublikowanego npm, gdy potrzebujesz dowodu kanału po publikacji,
    promocję dist-tagu, gdy jest potrzebna, zweryfikuj wygenerowaną stronę wydania GitHub
    i uruchom kroki ogłoszenia wydania.

## Preflight wydania

- Uruchom `pnpm check:test-types` przed wstępną kontrolą wydania, aby testowy TypeScript pozostawał
  objęty sprawdzeniem poza szybszą lokalną bramką `pnpm check`
- Uruchom `pnpm check:architecture` przed wstępną kontrolą wydania, aby szersze sprawdzenia cykli
  importów i granic architektury były zielone poza szybszą lokalną bramką
- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane
  artefakty wydania `dist/*` i pakiet Control UI istniały na potrzeby kroku
  walidacji pakietu
- Uruchom `pnpm release:prep` po podbiciu wersji w katalogu głównym i przed tagowaniem. Uruchamia
  każdy deterministyczny generator wydania, który często rozjeżdża się po zmianie
  wersji/konfiguracji/API: wersje pluginów, inwentarz pluginów, schemat konfiguracji
  bazowej, metadane konfiguracji dołączonych kanałów, bazowy stan dokumentacji konfiguracji, eksporty plugin SDK
  oraz bazowy stan API plugin SDK. `pnpm release:check` ponownie uruchamia te
  zabezpieczenia w trybie sprawdzania i raportuje wszystkie wykryte rozbieżności
  wygenerowanych plików w jednym przebiegu przed uruchomieniem sprawdzeń wydania pakietu.
- Uruchom ręczny workflow `Full Release Validation` przed zatwierdzeniem wydania, aby
  uruchomić wszystkie przedwydaniowe środowiska testowe z jednego punktu wejścia. Akceptuje gałąź,
  tag lub pełny SHA commita, wywołuje ręczny `CI` oraz wywołuje
  `OpenClaw Release Checks` dla smoke testu instalacji, akceptacji pakietu, międzyplatformowych
  sprawdzeń pakietu, zgodności QA Lab, Matrix i ścieżek Telegram. Stabilne/domyślne przebiegi
  trzymają wyczerpujące live/E2E i długie sprawdzenie ścieżki wydania Docker za
  `run_release_soak=true`; `release_profile=full` wymusza długie sprawdzenie. Przy
  `release_profile=full` i `rerun_group=all` uruchamia też pakietowe Telegram
  E2E względem artefaktu `release-package-under-test` ze sprawdzeń wydania.
  Podaj `release_package_spec` po opublikowaniu beta, aby ponownie użyć wysłanego
  pakietu npm w sprawdzeniach wydania, Package Acceptance i pakietowym Telegram
  E2E bez ponownego budowania tarballa wydania. Podaj
  `npm_telegram_package_spec` tylko wtedy, gdy Telegram powinien użyć innego
  opublikowanego pakietu niż reszta walidacji wydania. Podaj
  `package_acceptance_package_spec`, gdy Package Acceptance powinno użyć
  innego opublikowanego pakietu niż specyfikacja pakietu wydania. Podaj
  `evidence_package_spec`, gdy prywatny raport dowodowy powinien wykazać, że
  walidacja odpowiada opublikowanemu pakietowi npm bez wymuszania Telegram E2E.
  Przykład:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Uruchom ręczny workflow `Package Acceptance`, gdy potrzebujesz dowodu z kanału bocznego
  dla kandydata pakietu, podczas gdy prace wydaniowe trwają dalej. Użyj `source=npm` dla
  `openclaw@beta`, `openclaw@latest` lub dokładnej wersji wydania; `source=ref`
  do spakowania zaufanej gałęzi/tagu/SHA `package_ref` z bieżącym
  harness `workflow_ref`; `source=url` dla tarballa HTTPS z wymaganym
  SHA-256; albo `source=artifact` dla tarballa przesłanego przez inny przebieg
  GitHub Actions. Workflow rozwiązuje kandydata do
  `package-under-test`, ponownie używa harmonogramu wydania Docker E2E względem tego
  tarballa i może uruchomić QA Telegram względem tego samego tarballa z
  `telegram_mode=mock-openai` lub `telegram_mode=live-frontier`. Gdy wybrane
  ścieżki Docker zawierają `published-upgrade-survivor`, artefakt pakietu jest
  kandydatem, a `published_upgrade_survivor_baseline` wybiera opublikowaną bazę.
  `update-restart-auth` używa pakietu kandydata zarówno jako zainstalowanego CLI,
  jak i package-under-test, więc ćwiczy zarządzaną ścieżkę restartu polecenia aktualizacji
  kandydata.
  Przykład: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Typowe profile:
  - `smoke`: ścieżki instalacji/kanału/agenta, sieci Gateway i przeładowania konfiguracji
  - `package`: ścieżki pakietu/aktualizacji/restartu/pluginów natywne dla artefaktu bez OpenWebUI ani live ClawHub
  - `product`: profil pakietowy plus kanały MCP, sprzątanie cron/subagenta,
    wyszukiwanie webowe OpenAI i OpenWebUI
  - `full`: fragmenty ścieżki wydania Docker z OpenWebUI
  - `custom`: dokładny wybór `docker_lanes` dla ukierunkowanego ponownego przebiegu
- Uruchom ręczny workflow `CI` bezpośrednio, gdy potrzebujesz tylko pełnego normalnego pokrycia
  CI dla kandydata wydania. Ręczne wywołania CI omijają zakresowanie zmian
  i wymuszają shardy Linux Node, shardy dołączonych pluginów, kontrakty kanałów,
  zgodność Node 22, `check`, `check-additional`, smoke test kompilacji,
  sprawdzenia dokumentacji, Skills Python, Windows, macOS, Android oraz ścieżki i18n
  Control UI.
  Przykład: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Uruchom `pnpm qa:otel:smoke` podczas walidacji telemetrii wydania. Ćwiczy
  QA-lab przez lokalny odbiornik OTLP/HTTP i weryfikuje wyeksportowane nazwy
  spanów trace, ograniczone atrybuty oraz redakcję treści/identyfikatorów bez
  wymagania Opik, Langfuse ani innego zewnętrznego kolektora.
- Uruchom `pnpm release:check` przed każdym tagowanym wydaniem
- Uruchom `OpenClaw Release Publish` dla mutującej sekwencji publikowania po tym, jak
  tag istnieje. Wywołaj go z `release/YYYY.M.D` (albo `main`, gdy publikujesz
  tag osiągalny z main), przekaż tag wydania i udany OpenClaw npm
  `preflight_run_id`, a domyślny zakres publikacji pluginów
  `all-publishable` zachowaj, chyba że celowo wykonujesz ukierunkowaną naprawę. Workflow
  serializuje publikację pluginów npm, publikację pluginów ClawHub i publikację OpenClaw
  npm, aby pakiet core nie został opublikowany przed swoimi zewnętrznymi
  pluginami.
- Sprawdzenia wydania działają teraz w oddzielnym ręcznym workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` uruchamia też ścieżkę zgodności mock QA Lab oraz szybki
  profil live Matrix i ścieżkę QA Telegram przed zatwierdzeniem wydania. Ścieżki live
  używają środowiska `qa-live-shared`; Telegram używa też dzierżaw poświadczeń Convex CI.
  Uruchom ręczny workflow `QA-Lab - All Lanes` z
  `matrix_profile=all` i `matrix_shards=true`, gdy potrzebujesz pełnego inwentarza
  transportu Matrix, mediów i E2EE równolegle.
- Międzyplatformowa walidacja instalacji i aktualizacji w runtime jest częścią publicznych
  `OpenClaw Release Checks` oraz `Full Release Validation`, które bezpośrednio wywołują
  wielokrotnego użytku workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Ten podział jest celowy: utrzymuje prawdziwą ścieżkę wydania npm krótką,
  deterministyczną i skoncentrowaną na artefaktach, a wolniejsze sprawdzenia live pozostają
  w swojej własnej ścieżce, aby nie wstrzymywały ani nie blokowały publikacji
- Sprawdzenia wydania niosące sekrety powinny być wywoływane przez `Full Release
Validation` albo z refa workflow `main`/wydania, aby logika workflow i
  sekrety pozostały kontrolowane
- `OpenClaw Release Checks` akceptuje gałąź, tag lub pełny SHA commita, o ile
  rozwiązany commit jest osiągalny z gałęzi OpenClaw albo tagu wydania
- Wstępna kontrola tylko walidacyjna `OpenClaw NPM Release` akceptuje też bieżący
  pełny 40-znakowy SHA commita gałęzi workflow bez wymagania wypchniętego tagu
- Ta ścieżka SHA służy wyłącznie do walidacji i nie może zostać awansowana do prawdziwej publikacji
- W trybie SHA workflow syntetyzuje `v<package.json version>` tylko na potrzeby
  sprawdzenia metadanych pakietu; prawdziwa publikacja nadal wymaga prawdziwego tagu wydania
- Oba workflow utrzymują prawdziwą ścieżkę publikacji i promocji na runnerach
  hostowanych przez GitHub, podczas gdy niemutująca ścieżka walidacji może używać większych
  runnerów Blacksmith Linux
- Ten workflow uruchamia
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  z użyciem sekretów workflow `OPENAI_API_KEY` i `ANTHROPIC_API_KEY`
- Wstępna kontrola wydania npm nie czeka już na oddzielną ścieżkę sprawdzeń wydania
- Uruchom `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (albo pasujący tag beta/poprawkowy) przed zatwierdzeniem
- Po publikacji npm uruchom
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (albo pasującą wersję beta/poprawkową), aby zweryfikować ścieżkę instalacji
  opublikowanego rejestru w świeżym tymczasowym prefiksie
- Po publikacji beta uruchom `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  aby zweryfikować onboarding zainstalowanego pakietu, konfigurację Telegram i prawdziwe Telegram E2E
  względem opublikowanego pakietu npm przy użyciu współdzielonej puli dzierżawionych poświadczeń Telegram.
  Lokalne jednorazowe przebiegi maintainerów mogą pominąć zmienne Convex i przekazać trzy
  poświadczenia env `OPENCLAW_QA_TELEGRAM_*` bezpośrednio.
- Aby uruchomić pełny smoke test beta po publikacji z maszyny maintainera, użyj `pnpm release:beta-smoke -- --beta betaN`. Helper uruchamia walidację aktualizacji npm Parallels/świeżego celu, wywołuje `NPM Telegram Beta E2E`, sonduje dokładny przebieg workflow, pobiera artefakt i drukuje raport Telegram.
- Maintainerzy mogą uruchomić to samo sprawdzenie po publikacji z GitHub Actions przez
  ręczny workflow `NPM Telegram Beta E2E`. Jest celowo tylko ręczny i
  nie uruchamia się przy każdym scaleniu.
- Automatyzacja wydań maintainerów używa teraz schematu wstępna kontrola, potem promocja:
  - prawdziwa publikacja npm musi mieć udany npm `preflight_run_id`
  - prawdziwa publikacja npm musi być wywołana z tej samej gałęzi `main` lub
    `release/YYYY.M.D` co udany przebieg wstępnej kontroli
  - stabilne wydania npm domyślnie trafiają do `beta`
  - stabilna publikacja npm może jawnie celować w `latest` przez wejście workflow
  - mutacja tokenowego npm dist-tag znajduje się teraz w
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    ze względów bezpieczeństwa, ponieważ `npm dist-tag add` nadal potrzebuje `NPM_TOKEN`, a
    publiczne repo utrzymuje publikację wyłącznie OIDC
  - publiczne `macOS Release` służy tylko do walidacji; gdy tag istnieje tylko na
    gałęzi wydania, ale workflow jest wywoływany z `main`, ustaw
    `public_release_branch=release/YYYY.M.D`
  - prawdziwa prywatna publikacja mac musi mieć udane prywatne mac
    `preflight_run_id` i `validate_run_id`
  - prawdziwe ścieżki publikacji promują przygotowane artefakty zamiast budować
    je ponownie
- Dla stabilnych wydań poprawkowych takich jak `YYYY.M.D-N`, weryfikator po publikacji
  sprawdza też tę samą ścieżkę aktualizacji z tymczasowym prefiksem z `YYYY.M.D` do `YYYY.M.D-N`,
  aby poprawki wydania nie mogły po cichu zostawić starszych globalnych instalacji na
  bazowym stabilnym ładunku
- Wstępna kontrola wydania npm kończy się niepowodzeniem w trybie fail-closed, chyba że tarball zawiera zarówno
  `dist/control-ui/index.html`, jak i niepusty ładunek `dist/control-ui/assets/`,
  abyśmy ponownie nie wysłali pustego panelu przeglądarkowego
- Weryfikacja po publikacji sprawdza też, czy opublikowane punkty wejścia pluginów i
  metadane pakietu są obecne w układzie zainstalowanym z rejestru. Wydanie, które
  wysyła brakujące ładunki runtime pluginów, oblewa weryfikator postpublish i
  nie może zostać awansowane do `latest`.
- `pnpm test:install:smoke` wymusza też budżet npm pack `unpackedSize` na
  tarballu aktualizacji kandydata, więc installer e2e wychwytuje przypadkowe rozrośnięcie pakietu
  przed ścieżką publikacji wydania
- Jeśli prace wydaniowe dotknęły planowania CI, manifestów czasów rozszerzeń lub
  macierzy testów rozszerzeń, wygeneruj ponownie i przejrzyj należące do planera
  wyjścia macierzy `plugin-prerelease-extension-shard` z
  `.github/workflows/plugin-prerelease.yml` przed zatwierdzeniem, aby notatki wydania nie
  opisywały nieaktualnego układu CI
- Gotowość stabilnego wydania macOS obejmuje też powierzchnie updatera:
  - wydanie GitHub musi finalnie zawierać spakowane `.zip`, `.dmg` i `.dSYM.zip`
  - `appcast.xml` na `main` musi wskazywać na nowy stabilny zip po publikacji; prywatny
    workflow publikacji macOS commitnie go automatycznie albo otworzy PR appcast,
    gdy bezpośredni push jest zablokowany
  - spakowana aplikacja musi zachować niedebugowy identyfikator pakietu, niepusty URL feedu
    Sparkle oraz `CFBundleVersion` równy lub wyższy od kanonicznego progu kompilacji Sparkle
    dla tej wersji wydania

## Środowiska testowe wydania

`Full Release Validation` to sposób, w jaki operatorzy uruchamiają wszystkie testy przedwydaniowe z
jednego punktu wejścia. Aby uzyskać dowód przypiętego commita na szybko zmieniającej się gałęzi, użyj
helpera, aby każdy podrzędny workflow uruchamiał się z tymczasowej gałęzi ustalonej na docelowym
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Pomocnik wypycha `release-ci/<sha>-...`, uruchamia `Full Release Validation`
z tej gałęzi z `ref=<sha>`, weryfikuje, że każdy podrzędny workflow `headSha`
pasuje do celu, a następnie usuwa gałąź tymczasową. Zapobiega to przypadkowemu
udowodnieniu nowszego podrzędnego uruchomienia z `main`.

Aby zweryfikować gałąź lub tag wydania, uruchom to z zaufanego workflow `main`
jako ref i przekaż gałąź lub tag wydania jako `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow rozwiązuje docelowy ref, uruchamia ręcznie `CI` z
`target_ref=<release-ref>`, uruchamia `OpenClaw Release Checks`, przygotowuje
nadrzędny artefakt `release-package-under-test` dla sprawdzeń dotyczących
pakietów oraz uruchamia autonomiczne pakietowe E2E Telegram, gdy
`release_profile=full` z `rerun_group=all` albo gdy ustawiono
`release_package_spec` lub `npm_telegram_package_spec`. `OpenClaw Release
Checks` następnie rozdziela zadania na install smoke, sprawdzenia wydania
cross-OS, pokrycie ścieżki wydania live/E2E Docker, gdy soak jest włączony,
Package Acceptance z pakietowym QA Telegram, parytet QA Lab, live Matrix oraz
live Telegram. Pełne uruchomienie jest akceptowalne tylko wtedy, gdy podsumowanie
`Full Release Validation` pokazuje `normal_ci` i `release_checks` jako udane. W
trybie full/all podrzędny `npm_telegram` także musi być udany; poza full/all jest
pomijany, chyba że podano opublikowany `release_package_spec` lub
`npm_telegram_package_spec`. Końcowe podsumowanie weryfikatora zawiera tabele
najwolniejszych zadań dla każdego podrzędnego uruchomienia, dzięki czemu menedżer
wydania może zobaczyć bieżącą ścieżkę krytyczną bez pobierania logów.
Zobacz [Pełna weryfikacja wydania](/pl/reference/full-release-validation), aby
poznać kompletną macierz etapów, dokładne nazwy zadań workflow, różnice między
profilami stable i full, artefakty oraz uchwyty ukierunkowanych ponownych
uruchomień.
Podrzędne workflow są uruchamiane z zaufanego ref, który uruchamia `Full Release
Validation`, zwykle `--ref main`, nawet gdy docelowy `ref` wskazuje starszą gałąź
lub tag wydania. Nie ma osobnego wejścia ref workflow dla Full Release
Validation; wybierz zaufany harness, wybierając ref uruchomienia workflow.
Nie używaj `--ref main -f ref=<sha>` do dowodu dokładnego commita na ruchomym
`main`; surowe SHA commitów nie mogą być refami uruchamiania workflow, więc użyj
`pnpm ci:full-release --sha <sha>`, aby utworzyć przypiętą gałąź tymczasową.

Użyj `release_profile`, aby wybrać zakres live/provider:

- `minimum`: najszybsza krytyczna dla wydania ścieżka OpenAI/core live i Docker
- `stable`: minimum plus stabilne pokrycie provider/backend do zatwierdzenia wydania
- `full`: stable plus szerokie doradcze pokrycie provider/media

Użyj `run_release_soak=true` ze `stable`, gdy blokujące wydanie ścieżki są
zielone i chcesz wykonać wyczerpujący live/E2E, ścieżkę wydania Docker oraz
ograniczony przegląd przetrwania aktualizacji z opublikowanych pakietów przed
promocją. Ten przegląd obejmuje najnowsze cztery stabilne pakiety oraz przypięte
baseline `2026.4.23` i `2026.5.2` plus starsze pokrycie `2026.4.15`, z usuniętymi
duplikatami baseline i z każdym baseline podzielonym do osobnego zadania runnera
Docker. `full` implikuje `run_release_soak=true`.

`OpenClaw Release Checks` używa zaufanego ref workflow, aby raz rozwiązać
docelowy ref jako `release-package-under-test`, i ponownie wykorzystuje ten
artefakt w sprawdzeniach cross-OS, Package Acceptance oraz Docker dla ścieżki
wydania, gdy działa soak. Dzięki temu wszystkie maszyny dotyczące pakietów
używają tych samych bajtów i unikają powtarzanych buildów pakietu.
Gdy beta jest już w npm, ustaw `release_package_spec=openclaw@YYYY.M.D-beta.N`,
aby sprawdzenia wydania jednorazowo pobrały wysłany pakiet, wyodrębniły jego
źródłowy SHA buildu z `dist/build-info.json` i ponownie wykorzystały ten artefakt
w ścieżkach cross-OS, Package Acceptance, Docker dla ścieżki wydania oraz
pakietowych ścieżkach Telegram.
Install smoke OpenAI cross-OS używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy
zmienna repo/org jest ustawiona, w przeciwnym razie `openai/gpt-5.4`, ponieważ
ta ścieżka udowadnia instalację pakietu, onboarding, start Gateway i jedną
turę agenta live, a nie benchmarkuje najwolniejszy domyślny model. Szersza
macierz live provider pozostaje miejscem na pokrycie specyficzne dla modelu.

Użyj tych wariantów w zależności od etapu wydania:

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
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Nie używaj pełnego parasola jako pierwszego ponownego uruchomienia po
ukierunkowanej poprawce. Jeśli jedna maszyna zawiedzie, użyj nieudanego
podrzędnego workflow, zadania, ścieżki Docker, profilu pakietu, provider modelu
lub ścieżki QA dla następnego dowodu. Uruchom pełny parasol ponownie tylko
wtedy, gdy poprawka zmieniła współdzieloną orkiestrację wydania albo sprawiła,
że wcześniejszy dowód ze wszystkich maszyn stał się nieaktualny. Końcowy
weryfikator parasola ponownie sprawdza zapisane identyfikatory uruchomień
podrzędnych workflow, więc po pomyślnym ponownym uruchomieniu podrzędnego
workflow uruchom ponownie tylko nieudane nadrzędne zadanie `Verify full validation`.

Do ograniczonego odzyskiwania przekaż `rerun_group` do parasola. `all` to
rzeczywiste uruchomienie release-candidate, `ci` uruchamia tylko podrzędne
normalne CI, `plugin-prerelease` uruchamia tylko podrzędny element Plugin
wyłącznie dla wydania, `release-checks` uruchamia każdą maszynę wydania, a węższe
grupy wydania to `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live` oraz `npm-telegram`. Ukierunkowane ponowne uruchomienia
`npm-telegram` wymagają `release_package_spec` lub `npm_telegram_package_spec`;
pełne/wszystkie uruchomienia z `release_profile=full` używają artefaktu pakietu
release-checks. Ukierunkowane ponowne uruchomienia cross-OS mogą dodać
`cross_os_suite_filter=windows/packaged-upgrade` lub inny filtr OS/suite.
Niepowodzenia QA release-check są doradcze; niepowodzenie tylko QA nie blokuje
weryfikacji wydania.

### Vitest

Maszyna Vitest to ręczny podrzędny workflow `CI`. Ręczne CI celowo omija
zakres zmian i wymusza normalny graf testów dla kandydata wydania: shardy Linux
Node, shardy bundled-plugin, kontrakty kanałów, zgodność Node 22, `check`,
`check-additional`, build smoke, sprawdzenia dokumentacji, Python skills,
Windows, macOS, Android oraz i18n Control UI.

Użyj tej maszyny, aby odpowiedzieć „czy drzewo źródeł przeszło pełny normalny
zestaw testów?”. To nie jest to samo co walidacja produktu w ścieżce wydania.
Dowody do zachowania:

- podsumowanie `Full Release Validation` pokazujące URL uruchomionego `CI`
- zielone uruchomienie `CI` na dokładnym docelowym SHA
- nazwy nieudanych lub wolnych shardów z zadań CI podczas badania regresji
- artefakty czasów Vitest, takie jak `.artifacts/vitest-shard-timings.json`, gdy
  uruchomienie wymaga analizy wydajności

Uruchom ręczne CI bezpośrednio tylko wtedy, gdy wydanie potrzebuje
deterministycznego normalnego CI, ale nie maszyn Docker, QA Lab, live, cross-OS
ani pakietowych:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Maszyna Docker znajduje się w `OpenClaw Release Checks` przez
`openclaw-live-and-e2e-checks-reusable.yml` oraz workflow `install-smoke` w
trybie wydania. Weryfikuje kandydata wydania przez spakowane środowiska Docker,
a nie tylko testy na poziomie źródeł.

Pokrycie Docker dla wydania obejmuje:

- pełny install smoke z włączonym wolnym globalnym install smoke Bun
- przygotowanie/ponowne użycie obrazu smoke root Dockerfile według docelowego SHA,
  z zadaniami QR, root/gateway oraz installer/Bun smoke działającymi jako osobne
  shardy install-smoke
- ścieżki E2E repozytorium
- fragmenty Docker ścieżki wydania: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` oraz `plugins-runtime-install-h`
- pokrycie OpenWebUI wewnątrz fragmentu `plugins-runtime-services`, gdy jest
  wymagane
- podzielone ścieżki instalacji/dezinstalacji bundled Plugin
  `bundled-plugin-install-uninstall-0` do
  `bundled-plugin-install-uninstall-23`
- zestawy live/E2E provider i pokrycie modelu Docker live, gdy sprawdzenia
  wydania obejmują zestawy live

Użyj artefaktów Docker przed ponownym uruchomieniem. Harmonogram ścieżki wydania
przesyła `.artifacts/docker-tests/` z logami ścieżek, `summary.json`,
`failures.json`, czasami faz, JSON planu harmonogramu i poleceniami ponownego
uruchomienia. Do ukierunkowanego odzyskiwania użyj
`docker_lanes=<lane[,lane]>` w wielokrotnego użytku workflow live/E2E zamiast
ponownie uruchamiać wszystkie fragmenty wydania. Wygenerowane polecenia
ponownego uruchomienia zawierają wcześniejsze `package_artifact_run_id` oraz
przygotowane wejścia obrazu Docker, gdy są dostępne, więc nieudana ścieżka może
ponownie użyć tego samego tarballa i obrazów GHCR.

### QA Lab

Maszyna QA Lab jest także częścią `OpenClaw Release Checks`. To agentowa bramka
wydania dla zachowania i poziomu kanałów, oddzielna od mechaniki pakietów Vitest
i Docker.

Pokrycie QA Lab dla wydania obejmuje:

- ścieżkę mock parity porównującą ścieżkę kandydata OpenAI z baseline Opus 4.6
  przy użyciu agentowego pakietu parytetu
- szybki profil QA live Matrix używający środowiska `qa-live-shared`
- ścieżkę QA live Telegram używającą dzierżaw poświadczeń Convex CI
- `pnpm qa:otel:smoke`, gdy telemetria wydania wymaga jawnego lokalnego dowodu

Użyj tej maszyny, aby odpowiedzieć „czy wydanie zachowuje się poprawnie w
scenariuszach QA i przepływach kanałów live?”. Zachowaj URL-e artefaktów dla
ścieżek parytetu, Matrix i Telegram podczas zatwierdzania wydania. Pełne
pokrycie Matrix pozostaje dostępne jako ręczne shardowane uruchomienie QA-Lab,
a nie domyślna ścieżka krytyczna dla wydania.

### Pakiet

Maszyna pakietu to bramka produktu instalowalnego. Jest oparta na
`Package Acceptance` oraz resolverze
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver normalizuje kandydata
do tarballa `package-under-test` używanego przez Docker E2E, weryfikuje
inwentarz pakietu, zapisuje wersję pakietu i SHA-256 oraz utrzymuje ref harness
workflow oddzielnie od ref źródła pakietu.

Obsługiwane źródła kandydatów:

- `source=npm`: `openclaw@beta`, `openclaw@latest` lub dokładna wersja wydania
  OpenClaw
- `source=ref`: spakuj zaufaną gałąź `package_ref`, tag lub pełny SHA commita z
  wybranym harness `workflow_ref`
- `source=url`: pobierz HTTPS `.tgz` z wymaganym `package_sha256`
- `source=artifact`: użyj ponownie `.tgz` przesłanego przez inne uruchomienie
  GitHub Actions

`OpenClaw Release Checks` uruchamia Package Acceptance z `source=artifact`,
przygotowanym artefaktem pakietu wydania, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance utrzymuje migrację, aktualizację,
restart aktualizacji skonfigurowanego auth, instalację live ClawHub skill,
czyszczenie nieaktualnych zależności Plugin, fixtures Plugin offline,
aktualizację Plugin oraz pakietowe QA Telegram względem tego samego rozwiązanego
tarballa. Blokujące sprawdzenia wydania używają domyślnego najnowszego
opublikowanego baseline pakietu; `run_release_soak=true` lub
`release_profile=full` rozszerza je na każdy stabilny baseline opublikowany w npm
od `2026.4.23` do `latest` plus fixtures zgłoszonych problemów. Użyj Package
Acceptance z `source=npm` dla już wysłanego kandydata albo
`source=ref`/`source=artifact` dla lokalnego tarballa npm opartego na SHA przed
publikacją. To natywny dla GitHub zamiennik większości pokrycia pakietu/aktualizacji,
które wcześniej wymagało Parallels. Sprawdzenia wydania cross-OS nadal mają
znaczenie dla specyficznego dla OS onboardingu, instalatora i zachowania
platformy, ale walidacja produktu dla pakietu/aktualizacji powinna preferować
Package Acceptance.

Kanoniczna lista kontrolna do walidacji aktualizacji i Pluginów to
[Testowanie aktualizacji i Pluginów](/pl/help/testing-updates-plugins). Używaj jej przy
wyborze, która ścieżka lokalna, Docker, Package Acceptance lub release-check potwierdza
instalację/aktualizację Pluginu, czyszczenie przez doctor albo zmianę migracji
opublikowanego pakietu. Wyczerpująca migracja opublikowanej aktualizacji z każdego
stabilnego pakietu `2026.4.23+` jest osobnym ręcznym workflow `Update Migration`,
a nie częścią Full Release CI.

Łagodniejsze reguły starszego package-acceptance są celowo ograniczone czasowo.
Pakiety do `2026.4.25` włącznie mogą używać ścieżki zgodności dla luk metadanych
już opublikowanych w npm: prywatnych wpisów inwentarza QA brakujących w tarballu,
brakującego `gateway install --wrapper`, brakujących plików poprawek w fixture git
pochodzącym z tarballa, brakującego utrwalonego `update.channel`, starszych lokalizacji
rekordów instalacji Pluginów, brakującego utrwalania rekordów instalacji marketplace
oraz migracji metadanych konfiguracji podczas `plugins update`. Opublikowany pakiet
`2026.4.26` może ostrzegać o lokalnych plikach znaczników metadanych kompilacji,
które zostały już wydane. Późniejsze pakiety muszą spełniać nowoczesne kontrakty
pakietów; te same luki powodują niepowodzenie walidacji wydania.

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
  ponownego wczytania konfiguracji
- `package`: kontrakty instalacji/aktualizacji/restartu/pakietu Pluginów oraz
  dowód instalacji Skills z live ClawHub; to domyślna wartość release-check
- `product`: `package` plus kanały MCP, czyszczenie cron/subagent, wyszukiwanie
  internetowe OpenAI oraz OpenWebUI
- `full`: fragmenty ścieżki wydania Docker z OpenWebUI
- `custom`: dokładna lista `docker_lanes` do ukierunkowanych ponownych uruchomień

Aby uzyskać dowód Telegram dla kandydata pakietu, włącz `telegram_mode=mock-openai`
lub `telegram_mode=live-frontier` w Package Acceptance. Workflow przekazuje
rozwiązany tarball `package-under-test` do ścieżki Telegram; samodzielny workflow
Telegram nadal akceptuje opublikowaną specyfikację npm do kontroli po publikacji.

## Automatyzacja publikacji wydania

`OpenClaw Release Publish` jest standardowym mutującym punktem wejścia publikacji.
Orkiestruje workflow trusted-publisher w kolejności wymaganej przez wydanie:

1. Pobierz tag wydania i rozwiąż jego SHA commita.
2. Zweryfikuj, że tag jest osiągalny z `main` lub `release/*`.
3. Uruchom `pnpm plugins:sync:check`.
4. Wyślij `Plugin NPM Release` z `publish_scope=all-publishable` i
   `ref=<release-sha>`.
5. Wyślij `Plugin ClawHub Release` z tym samym zakresem i SHA.
6. Wyślij `OpenClaw NPM Release` z tagiem wydania, npm dist-tag oraz
   zapisanym `preflight_run_id`.

Przykład publikacji beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Stabilna publikacja do domyślnego beta dist-tag:

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

Używaj niższopoziomowych workflow `Plugin NPM Release` i `Plugin ClawHub Release`
tylko do ukierunkowanych napraw lub ponownej publikacji. Dla wybranej naprawy Pluginu
przekaż `plugin_publish_scope=selected` oraz `plugins=@openclaw/name` do
`OpenClaw Release Publish` albo wyślij workflow potomny bezpośrednio, gdy pakiet
OpenClaw nie może zostać opublikowany.

## Dane wejściowe workflow NPM

`OpenClaw NPM Release` akceptuje te dane wejściowe kontrolowane przez operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1` lub
  `v2026.4.2-beta.1`; gdy `preflight_only=true`, może to być także bieżący
  pełny 40-znakowy SHA commita gałęzi workflow do preflight tylko walidacyjnego
- `preflight_only`: `true` tylko dla walidacji/kompilacji/pakietu, `false` dla
  rzeczywistej ścieżki publikacji
- `preflight_run_id`: wymagane na rzeczywistej ścieżce publikacji, aby workflow
  ponownie użył przygotowanego tarballa z udanego przebiegu preflight
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
  workflow jako orkiestratora napraw wyłącznie Pluginów

`OpenClaw Release Checks` akceptuje te dane wejściowe kontrolowane przez operatora:

- `ref`: gałąź, tag lub pełny SHA commita do walidacji. Kontrole zawierające
  sekrety wymagają, aby rozwiązany commit był osiągalny z gałęzi OpenClaw albo
  tagu wydania.
- `run_release_soak`: włącza wyczerpujące live/E2E, ścieżkę wydania Docker oraz
  soak upgrade-survivor od wszystkich wydań przy stabilnych/domyślnych kontrolach
  wydania. Jest wymuszane przez `release_profile=full`.

Reguły:

- Tagi stabilne i korekcyjne mogą publikować do `beta` albo `latest`
- Tagi prerelease beta mogą publikować tylko do `beta`
- Dla `OpenClaw NPM Release` wejście pełnego SHA commita jest dozwolone tylko,
  gdy `preflight_only=true`
- `OpenClaw Release Checks` i `Full Release Validation` są zawsze wyłącznie
  walidacyjne
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, którego
  użyto podczas preflight; workflow weryfikuje te metadane przed kontynuowaniem
  publikacji

## Sekwencja stabilnego wydania npm

Podczas przygotowywania stabilnego wydania npm:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`
   - Zanim istnieje tag, możesz użyć bieżącego pełnego SHA commita gałęzi workflow
     do walidacyjnego suchego przebiegu workflow preflight
2. Wybierz `npm_dist_tag=beta` dla normalnego przepływu najpierw beta albo `latest`
   tylko wtedy, gdy celowo chcesz bezpośredniej stabilnej publikacji
3. Uruchom `Full Release Validation` na gałęzi wydania, tagu wydania albo pełnym
   SHA commita, gdy chcesz uzyskać normalne CI plus pokrycie live prompt cache,
   Docker, QA Lab, Matrix i Telegram z jednego ręcznego workflow
4. Jeśli celowo potrzebujesz tylko deterministycznego normalnego grafu testów,
   uruchom ręczny workflow `CI` na ref wydania
5. Zapisz udany `preflight_run_id`
6. Uruchom `OpenClaw Release Publish` z tym samym `tag`, tym samym `npm_dist_tag`
   i zapisanym `preflight_run_id`; publikuje on zewnętrzne Pluginy do npm i
   ClawHub przed promocją pakietu npm OpenClaw
7. Jeśli wydanie trafiło na `beta`, użyj prywatnego workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   aby promować tę stabilną wersję z `beta` do `latest`
8. Jeśli wydanie celowo opublikowano bezpośrednio do `latest` i `beta` ma od razu
   wskazywać tę samą stabilną kompilację, użyj tego samego prywatnego workflow,
   aby skierować oba dist-tagi na stabilną wersję, albo pozwól jego zaplanowanej
   synchronizacji samonaprawczej przenieść `beta` później

Mutacja dist-tag znajduje się w prywatnym repozytorium ze względów bezpieczeństwa,
ponieważ nadal wymaga `NPM_TOKEN`, podczas gdy publiczne repozytorium utrzymuje
publikację wyłącznie przez OIDC.

Dzięki temu zarówno bezpośrednia ścieżka publikacji, jak i ścieżka promocji
najpierw beta pozostają udokumentowane i widoczne dla operatorów.

Jeśli maintainer musi wrócić do lokalnego uwierzytelniania npm, uruchamiaj wszelkie
komendy CLI 1Password (`op`) tylko wewnątrz dedykowanej sesji tmux. Nie wywołuj
`op` bezpośrednio z głównej powłoki agenta; utrzymywanie go w tmux sprawia, że
prompty, alerty i obsługa OTP są obserwowalne oraz zapobiega powtarzającym się
alertom hosta.

## Odnośniki publiczne

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainerzy używają prywatnej dokumentacji wydania w
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
jako właściwego runbooka.

## Powiązane

- [Kanały wydań](/pl/install/development-channels)
