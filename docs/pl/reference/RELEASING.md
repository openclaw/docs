---
read_when:
    - Wyszukiwanie definicji publicznych kanałów wydań
    - Uruchamianie walidacji wydania lub akceptacji pakietu
    - Szukasz nazewnictwa wersji i cyklu wydań
summary: Ścieżki wydań, lista kontrolna operatora, środowiska walidacyjne, nazewnictwo wersji i rytm wydań
title: Polityka wydań
x-i18n:
    generated_at: "2026-05-05T01:49:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41886d3bb2f970e6a86944e5ff207b1b29b1b64b1f234d45f626fed19cf032b3
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ma trzy publiczne ścieżki wydań:

- stable: tagowane wydania publikowane domyślnie do npm `beta` albo do npm `latest`, gdy zostanie to jawnie zażądane
- beta: tagi wydań wstępnych publikowane do npm `beta`
- dev: bieżący stan gałęzi `main`

## Nazewnictwo wersji

- Wersja wydania stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Wersja wydania korekcyjnego stable: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Wersja wydania wstępnego beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Nie dodawaj zer wiodących do miesiąca ani dnia
- `latest` oznacza bieżące wypromowane stabilne wydanie npm
- `beta` oznacza bieżący cel instalacji beta
- Wydania stable i korekcyjne stable są domyślnie publikowane do npm `beta`; operatorzy wydań mogą jawnie wskazać `latest` albo później wypromować sprawdzony build beta
- Każde stabilne wydanie OpenClaw dostarcza razem pakiet npm i aplikację macOS;
  wydania beta zwykle najpierw weryfikują i publikują ścieżkę npm/pakietu, a
  kompilacja/podpisywanie/notaryzacja aplikacji macOS jest zarezerwowana dla wydań stable, chyba że zostanie jawnie zażądana

## Rytm wydań

- Wydania idą najpierw przez beta
- Stable następuje dopiero po zweryfikowaniu najnowszej wersji beta
- Maintainerzy zwykle przygotowują wydania z gałęzi `release/YYYY.M.D` utworzonej
  z bieżącej gałęzi `main`, aby walidacja wydania i poprawki nie blokowały nowego
  rozwoju na `main`
- Jeśli tag beta został wypchnięty lub opublikowany i wymaga poprawki, maintainerzy tworzą
  następny tag `-beta.N` zamiast usuwać albo odtwarzać stary tag beta
- Szczegółowa procedura wydania, zatwierdzenia, dane uwierzytelniające i notatki odzyskiwania są
  dostępne tylko dla maintainerów

## Lista kontrolna operatora wydania

Ta lista kontrolna pokazuje publiczny kształt przepływu wydania. Prywatne dane uwierzytelniające,
podpisywanie, notaryzacja, odzyskiwanie dist-tag i szczegóły awaryjnego rollbacku pozostają w
podręczniku wydaniowym dostępnym tylko dla maintainerów.

1. Zacznij od bieżącej gałęzi `main`: pobierz najnowsze zmiany, potwierdź, że docelowy commit został wypchnięty,
   oraz potwierdź, że bieżące CI na `main` jest wystarczająco zielone, aby utworzyć z niej gałąź.
2. Przepisz górną sekcję `CHANGELOG.md` na podstawie rzeczywistej historii commitów za pomocą
   `/changelog`, utrzymaj wpisy jako skierowane do użytkowników, skomituj ją, wypchnij i jeszcze raz wykonaj rebase/pull
   przed utworzeniem gałęzi.
3. Przejrzyj rekordy zgodności wydań w
   `src/plugins/compat/registry.ts` oraz
   `src/commands/doctor/shared/deprecation-compat.ts`. Usuń wygasłą
   zgodność tylko wtedy, gdy ścieżka aktualizacji pozostaje objęta wsparciem, albo zapisz, dlaczego jest
   celowo utrzymywana.
4. Utwórz `release/YYYY.M.D` z bieżącej gałęzi `main`; nie wykonuj zwykłych prac wydaniowych
   bezpośrednio na `main`.
5. Podbij każdą wymaganą lokalizację wersji dla planowanego tagu, uruchom
   `pnpm plugins:sync`, aby publikowalne pakiety Plugin współdzieliły wersję wydania
   i metadane zgodności, a następnie uruchom lokalny deterministyczny preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` oraz
   `pnpm release:check`.
6. Uruchom `OpenClaw NPM Release` z `preflight_only=true`. Zanim istnieje tag,
   pełny 40-znakowy SHA gałęzi wydania jest dozwolony tylko do walidacyjnego
   preflightu. Zapisz udany `preflight_run_id`.
7. Uruchom wszystkie testy przedwydaniowe za pomocą `Full Release Validation` dla
   gałęzi wydania, tagu albo pełnego SHA commita. To jest jedyny ręczny punkt wejścia
   dla czterech dużych środowisk testowych wydania: Vitest, Docker, QA Lab i Package.
8. Jeśli walidacja się nie powiedzie, napraw problem na gałęzi wydania i ponownie uruchom najmniejszy nieudany
   plik, ścieżkę, zadanie workflow, profil pakietu, dostawcę albo listę dozwolonych modeli, które
   potwierdzają poprawkę. Ponownie uruchom pełny parasol tylko wtedy, gdy zmieniona powierzchnia sprawia, że
   wcześniejsze dowody są nieaktualne.
9. Dla beta oznacz tagiem `vYYYY.M.D-beta.N`, a następnie uruchom `OpenClaw Release Publish` z
   pasującej gałęzi `release/YYYY.M.D`. Weryfikuje ono `pnpm plugins:sync:check`,
   najpierw publikuje wszystkie publikowalne pakiety Plugin do npm, następnie publikuje ten sam
   zestaw do ClawHub jako tarballe ClawPack npm-pack, a potem promuje
   przygotowany artefakt preflight npm OpenClaw z pasującym dist-tag. Po
   publikacji uruchom popublikacyjną akceptację pakietu
   względem opublikowanego pakietu `openclaw@YYYY.M.D-beta.N` albo
   `openclaw@beta`. Jeśli wypchnięte lub opublikowane wydanie wstępne wymaga poprawki,
   utwórz następny pasujący numer wydania wstępnego; nie usuwaj ani nie przepisuj starego
   wydania wstępnego.
10. Dla stable kontynuuj dopiero wtedy, gdy sprawdzona beta albo kandydat do wydania ma
    wymagane dowody walidacji. Stabilna publikacja npm również przechodzi przez
    `OpenClaw Release Publish`, używając ponownie udanego artefaktu preflight za pomocą
    `preflight_run_id`; gotowość stabilnego wydania macOS wymaga także
    spakowanych `.zip`, `.dmg`, `.dSYM.zip` oraz zaktualizowanego `appcast.xml` na `main`.
11. Po publikacji uruchom weryfikator npm po publikacji, opcjonalne samodzielne
    E2E Telegram opublikowanego pakietu npm, gdy potrzebujesz potwierdzenia kanału po publikacji,
    promocję dist-tag, gdy jest potrzebna, notatki GitHub release/prerelease z
    pełnej pasującej sekcji `CHANGELOG.md` oraz kroki ogłoszenia wydania.

## Preflight wydania

- Uruchom `pnpm check:test-types` przed wstępną kontrolą wydania, aby testowy TypeScript pozostawał
  objęty kontrolą poza szybszą lokalną bramką `pnpm check`
- Uruchom `pnpm check:architecture` przed wstępną kontrolą wydania, aby szersze sprawdzanie cykli
  importów i granic architektury było zielone poza szybszą lokalną bramką
- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane
  artefakty wydania `dist/*` i pakiet Control UI istniały na potrzeby kroku
  walidacji pakietu
- Uruchom `pnpm plugins:sync` po podbiciu wersji w katalogu głównym i przed tagowaniem. Aktualizuje
  wersje publikowalnych pakietów pluginów, metadane zgodności OpenClaw peer/API,
  metadane kompilacji oraz szkielety changelogów pluginów, aby pasowały do wersji
  wydania core. `pnpm plugins:sync:check` to niemutująca osłona wydania;
  workflow publikacji kończy się niepowodzeniem przed jakąkolwiek mutacją rejestru, jeśli ten krok
  został pominięty.
- Uruchom ręczny workflow `Full Release Validation` przed zatwierdzeniem wydania, aby
  uruchomić wszystkie przedwydaniowe test boxy z jednego punktu wejścia. Przyjmuje gałąź,
  tag lub pełny SHA commita, dispatchuje ręczny `CI` i dispatchuje
  `OpenClaw Release Checks` dla install smoke, package acceptance, sprawdzeń pakietów
  między systemami, parytetu QA Lab, Matrix i ścieżek Telegram. Stabilne/domyślne uruchomienia
  trzymają wyczerpujące live/E2E oraz soak ścieżki wydania Docker za
  `run_release_soak=true`; `release_profile=full` wymusza soak. Z
  `release_profile=full` i `rerun_group=all` uruchamia też pakietowe Telegram
  E2E względem artefaktu `release-package-under-test` z release checks.
  Podaj `npm_telegram_package_spec` po publikacji, gdy to samo
  Telegram E2E ma również udowodnić opublikowany pakiet npm. Podaj
  `package_acceptance_package_spec` po publikacji, gdy Package Acceptance
  ma uruchomić swoją macierz pakietu/aktualizacji względem wysłanego pakietu npm zamiast
  artefaktu zbudowanego z SHA. Podaj
  `evidence_package_spec`, gdy prywatny raport dowodowy ma wykazać, że
  walidacja odpowiada opublikowanemu pakietowi npm bez wymuszania Telegram E2E.
  Przykład:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Uruchom ręczny workflow `Package Acceptance`, gdy chcesz dowodu kanałem bocznym
  dla kandydata pakietu, podczas gdy prace nad wydaniem trwają. Użyj `source=npm` dla
  `openclaw@beta`, `openclaw@latest` lub dokładnej wersji wydania; `source=ref`
  do spakowania zaufanej gałęzi/tagu/SHA `package_ref` z bieżącym
  harness `workflow_ref`; `source=url` dla tarballa HTTPS z wymaganym
  SHA-256; albo `source=artifact` dla tarballa przesłanego przez inne uruchomienie GitHub
  Actions. Workflow rozwiązuje kandydata do
  `package-under-test`, używa ponownie planisty Docker E2E release względem tego
  tarballa i może uruchomić Telegram QA względem tego samego tarballa z
  `telegram_mode=mock-openai` lub `telegram_mode=live-frontier`. Gdy
  wybrane ścieżki Docker obejmują `published-upgrade-survivor`, artefakt pakietu
  jest kandydatem, a `published_upgrade_survivor_baseline` wybiera
  opublikowaną bazę.
  Przykład: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Wspólne profile:
  - `smoke`: ścieżki instalacji/kanału/agenta, sieci Gateway i ponownego ładowania konfiguracji
  - `package`: natywne dla artefaktu ścieżki pakietu/aktualizacji/pluginów bez OpenWebUI ani live ClawHub
  - `product`: profil pakietu plus kanały MCP, cleanup cron/subagent,
    wyszukiwanie webowe OpenAI i OpenWebUI
  - `full`: fragmenty ścieżki wydania Docker z OpenWebUI
  - `custom`: dokładny wybór `docker_lanes` do ukierunkowanego ponownego uruchomienia
- Uruchom ręczny workflow `CI` bezpośrednio, gdy potrzebujesz tylko pełnego normalnego pokrycia
  CI dla kandydata wydania. Ręczne dispatchowanie CI omija zakresowanie zmian
  i wymusza shardy Linux Node, shardy bundlowanych pluginów, kontrakty kanałów,
  zgodność Node 22, `check`, `check-additional`, build smoke,
  sprawdzenia dokumentacji, Python skills, Windows, macOS, Android oraz ścieżki i18n
  Control UI.
  Przykład: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Uruchom `pnpm qa:otel:smoke` podczas walidacji telemetrii wydania. Ćwiczy
  QA-lab przez lokalny odbiornik OTLP/HTTP i weryfikuje eksportowane nazwy spanów
  trace, ograniczone atrybuty oraz redakcję treści/identyfikatorów bez
  wymagania Opik, Langfuse ani innego zewnętrznego kolektora.
- Uruchom `pnpm release:check` przed każdym otagowanym wydaniem
- Uruchom `OpenClaw Release Publish` dla mutującej sekwencji publikacji po tym, jak
  tag istnieje. Dispatchuj go z `release/YYYY.M.D` (lub `main`, gdy publikujesz
  tag osiągalny z main), przekaż tag wydania i udany OpenClaw npm
  `preflight_run_id`, i zachowaj domyślny zakres publikacji pluginów
  `all-publishable`, chyba że celowo uruchamiasz ukierunkowaną naprawę. Workflow
  serializuje publikację pluginów w npm, publikację pluginów w ClawHub i publikację OpenClaw
  w npm, aby pakiet core nie został opublikowany przed swoimi zewnętrznymi
  pluginami.
- Release checks działają teraz w osobnym ręcznym workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` uruchamia też ścieżkę parytetu mock QA Lab oraz szybki
  profil live Matrix i ścieżkę Telegram QA przed zatwierdzeniem wydania. Ścieżki live
  używają środowiska `qa-live-shared`; Telegram używa także dzierżaw poświadczeń Convex CI.
  Uruchom ręczny workflow `QA-Lab - All Lanes` z
  `matrix_profile=all` i `matrix_shards=true`, gdy chcesz pełny inwentarz transportu,
  mediów i E2EE Matrix równolegle.
- Walidacja runtime instalacji i aktualizacji między systemami jest częścią publicznych
  `OpenClaw Release Checks` i `Full Release Validation`, które wywołują bezpośrednio
  workflow wielokrotnego użytku
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Ten podział jest celowy: utrzymuje prawdziwą ścieżkę wydania npm jako krótką,
  deterministyczną i skoncentrowaną na artefaktach, podczas gdy wolniejsze sprawdzenia live pozostają we własnej
  ścieżce, aby nie wstrzymywały ani nie blokowały publikacji
- Sprawdzenia wydania zawierające sekrety powinny być dispatchowane przez `Full Release
Validation` albo z ref workflow `main`/release, aby logika workflow i
  sekrety pozostawały kontrolowane
- `OpenClaw Release Checks` przyjmuje gałąź, tag lub pełny SHA commita, o ile
  rozwiązany commit jest osiągalny z gałęzi OpenClaw lub tagu wydania
- Wstępna kontrola tylko walidacyjna `OpenClaw NPM Release` akceptuje też bieżący
  pełny 40-znakowy SHA commita gałęzi workflow bez wymagania wypchniętego tagu
- Ta ścieżka SHA służy tylko do walidacji i nie może zostać promowana do prawdziwej publikacji
- W trybie SHA workflow syntetyzuje `v<package.json version>` tylko dla sprawdzenia
  metadanych pakietu; prawdziwa publikacja nadal wymaga prawdziwego tagu wydania
- Oba workflow utrzymują prawdziwą ścieżkę publikacji i promocji na runnerach
  hostowanych przez GitHub, podczas gdy niemutująca ścieżka walidacji może używać większych
  runnerów Blacksmith Linux
- Ten workflow uruchamia
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  używając sekretów workflow `OPENAI_API_KEY` i `ANTHROPIC_API_KEY`
- Wstępna kontrola wydania npm nie czeka już na osobną ścieżkę release checks
- Uruchom `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (lub pasujący tag beta/korekty) przed zatwierdzeniem
- Po publikacji npm uruchom
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (lub pasującą wersję beta/korekty), aby zweryfikować ścieżkę instalacji opublikowanego rejestru
  w świeżym tymczasowym prefiksie
- Po publikacji beta uruchom `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  aby zweryfikować onboarding zainstalowanego pakietu, konfigurację Telegram i prawdziwe Telegram E2E
  względem opublikowanego pakietu npm przy użyciu współdzielonej puli dzierżawionych poświadczeń Telegram.
  Lokalni maintainerzy w jednorazowych uruchomieniach mogą pominąć zmienne Convex i przekazać trzy
  poświadczenia env `OPENCLAW_QA_TELEGRAM_*` bezpośrednio.
- Aby uruchomić pełny post-publish beta smoke z maszyny maintainera, użyj `pnpm release:beta-smoke -- --beta betaN`. Helper uruchamia walidację Parallels npm update/fresh-target, dispatchuje `NPM Telegram Beta E2E`, odpytuje dokładne uruchomienie workflow, pobiera artefakt i wypisuje raport Telegram.
- Maintainerzy mogą uruchomić to samo sprawdzenie po publikacji z GitHub Actions przez
  ręczny workflow `NPM Telegram Beta E2E`. Jest celowo wyłącznie ręczny i
  nie działa przy każdym merge.
- Automatyzacja wydań maintainerów używa teraz preflight-then-promote:
  - prawdziwa publikacja npm musi przejść udany npm `preflight_run_id`
  - prawdziwa publikacja npm musi być dispatchowana z tej samej gałęzi `main` lub
    `release/YYYY.M.D` co udane uruchomienie preflight
  - stabilne wydania npm domyślnie trafiają do `beta`
  - stabilna publikacja npm może jawnie wskazywać `latest` przez wejście workflow
  - mutacja npm dist-tag oparta na tokenie znajduje się teraz w
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    ze względów bezpieczeństwa, ponieważ `npm dist-tag add` nadal wymaga `NPM_TOKEN`, podczas gdy
    publiczne repo utrzymuje publikację wyłącznie OIDC
  - publiczny `macOS Release` jest tylko walidacyjny; gdy tag istnieje tylko na
    gałęzi wydania, ale workflow jest dispatchowany z `main`, ustaw
    `public_release_branch=release/YYYY.M.D`
  - prawdziwa prywatna publikacja mac musi przejść udane prywatne mac
    `preflight_run_id` i `validate_run_id`
  - prawdziwe ścieżki publikacji promują przygotowane artefakty zamiast budować
    je ponownie
- Dla stabilnych wydań korygujących, takich jak `YYYY.M.D-N`, weryfikator po publikacji
  sprawdza też tę samą ścieżkę aktualizacji z tymczasowym prefiksem z `YYYY.M.D` do `YYYY.M.D-N`,
  aby korekty wydania nie mogły po cichu zostawić starszych instalacji globalnych na
  bazowym stabilnym ładunku
- Wstępna kontrola wydania npm kończy się bezpiecznie niepowodzeniem, jeśli tarball nie zawiera zarówno
  `dist/control-ui/index.html`, jak i niepustego ładunku `dist/control-ui/assets/`,
  abyśmy ponownie nie wysłali pustego panelu przeglądarkowego
- Weryfikacja po publikacji sprawdza też, czy opublikowane punkty wejścia pluginów i
  metadane pakietu są obecne w zainstalowanym układzie rejestru. Wydanie, które
  wysyła brakujące ładunki runtime pluginów, oblewa weryfikator postpublish i
  nie może zostać promowane do `latest`.
- `pnpm test:install:smoke` egzekwuje też budżet npm pack `unpackedSize` na
  tarballu kandydata aktualizacji, dzięki czemu installer e2e wykrywa przypadkowe rozdęcie pakietu
  przed ścieżką publikacji wydania
- Jeśli prace nad wydaniem dotknęły planowania CI, manifestów czasowania rozszerzeń lub
  macierzy testów rozszerzeń, wygeneruj ponownie i przejrzyj należące do planisty
  wyjścia macierzy `plugin-prerelease-extension-shard` z
  `.github/workflows/plugin-prerelease.yml` przed zatwierdzeniem, aby release notes nie
  opisywały nieaktualnego układu CI
- Gotowość stabilnego wydania macOS obejmuje też powierzchnie aktualizatora:
  - wydanie GitHub musi finalnie zawierać spakowane `.zip`, `.dmg` i `.dSYM.zip`
  - `appcast.xml` na `main` musi wskazywać nowy stabilny zip po publikacji
  - spakowana aplikacja musi zachować niedebugowy bundle id, niepusty URL kanału Sparkle
    oraz `CFBundleVersion` równy lub wyższy od kanonicznego minimalnego buildu Sparkle
    dla tej wersji wydania

## Test boxy wydania

`Full Release Validation` to sposób, w jaki operatorzy uruchamiają wszystkie testy przedwydaniowe z
jednego punktu wejścia. Dla dowodu przypiętego commita na szybko zmieniającej się gałęzi użyj
helpera, aby każdy workflow podrzędny działał z tymczasowej gałęzi przypiętej do docelowego
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper wypycha `release-ci/<sha>-...`, dispatchuje `Full Release Validation`
z tej gałęzi z `ref=<sha>`, weryfikuje, że każdy workflow podrzędny `headSha`
pasuje do celu, a następnie usuwa tymczasową gałąź. Zapobiega to przypadkowemu udowodnieniu
nowszego uruchomienia podrzędnego `main`.

W celu walidacji gałęzi wydania lub tagu uruchom ją z zaufanego ref workflow `main`
i przekaż gałąź wydania lub tag jako `ref`:

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
`target_ref=<release-ref>`, uruchamia `OpenClaw Release Checks`, przygotowuje
nadrzędny artefakt `release-package-under-test` dla sprawdzeń dotyczących pakietu oraz
uruchamia samodzielne pakietowe Telegram E2E, gdy `release_profile=full` z
`rerun_group=all` albo gdy ustawiono `npm_telegram_package_spec`. Następnie `OpenClaw Release
Checks` rozgałęzia się na install smoke, międzyplatformowe sprawdzenia wydania, pokrycie
live/E2E ścieżki wydania Docker, gdy włączono soak, Package Acceptance z Telegram
package QA, parytet QA Lab, live Matrix i live Telegram. Pełne uruchomienie jest akceptowalne tylko wtedy, gdy
podsumowanie `Full Release Validation`
pokazuje `normal_ci` i `release_checks` jako zakończone powodzeniem. W trybie full/all
proces potomny `npm_telegram` również musi zakończyć się powodzeniem; poza full/all jest pomijany,
chyba że podano opublikowany `npm_telegram_package_spec`. Końcowe
podsumowanie weryfikatora zawiera tabele najwolniejszych zadań dla każdego uruchomienia potomnego, aby menedżer
wydania mógł zobaczyć bieżącą ścieżkę krytyczną bez pobierania logów.
Zobacz [Pełna walidacja wydania](/pl/reference/full-release-validation), aby poznać
pełną macierz etapów, dokładne nazwy zadań przepływu pracy, różnice między profilami stable i full,
artefakty oraz uchwyty ukierunkowanego ponawiania.
Przepływy potomne są uruchamiane z zaufanego refa, który uruchamia `Full Release
Validation`, zwykle `--ref main`, nawet gdy docelowy `ref` wskazuje na
starszą gałąź wydania lub tag. Nie istnieje osobne wejście refa przepływu pracy Full Release Validation;
wybierz zaufany harness, wybierając ref uruchomienia przepływu pracy.
Nie używaj `--ref main -f ref=<sha>` do dowodu dokładnego commita na ruchomym `main`;
surowe SHA commitów nie mogą być refami dispatch przepływu pracy, więc użyj
`pnpm ci:full-release --sha <sha>`, aby utworzyć przypiętą tymczasową gałąź.

Użyj `release_profile`, aby wybrać zakres live/dostawców:

- `minimum`: najszybsza krytyczna dla wydania ścieżka OpenAI/core live i Docker
- `stable`: minimum plus stabilne pokrycie dostawców/backendów do zatwierdzenia wydania
- `full`: stable plus szerokie doradcze pokrycie dostawców/mediów

Użyj `run_release_soak=true` ze `stable`, gdy ścieżki blokujące wydanie są
zielone i chcesz przeprowadzić wyczerpujący przegląd live/E2E, ścieżki wydania Docker oraz
wszystkich testów upgrade-survivor od `2026.4.23` przed promocją. `full` implikuje
`run_release_soak=true`.

`OpenClaw Release Checks` używa zaufanego refa przepływu pracy, aby raz rozwiązać docelowy
ref jako `release-package-under-test`, i ponownie używa tego artefaktu w sprawdzeniach międzyplatformowych,
Package Acceptance oraz ścieżki wydania Docker, gdy działa soak. Dzięki temu
wszystkie maszyny dotyczące pakietu pracują na tych samych bajtach i unika się wielokrotnych buildów pakietu.
Międzyplatformowy OpenAI install smoke używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy
ustawiona jest zmienna repozytorium/organizacji, w przeciwnym razie `openai/gpt-5.4`, ponieważ ta ścieżka
dowodzi instalacji pakietu, onboardingu, uruchomienia Gateway oraz jednej tury agenta live,
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

Nie używaj pełnego parasola jako pierwszego ponowienia po ukierunkowanej poprawce. Jeśli jedna maszyna
zawiedzie, użyj nieudanego przepływu potomnego, zadania, ścieżki Docker, profilu pakietu, dostawcy
modelu albo ścieżki QA jako następnego dowodu. Uruchom pełny parasol ponownie tylko wtedy,
gdy poprawka zmieniła współdzieloną orkiestrację wydania albo sprawiła, że wcześniejsze dowody ze wszystkich maszyn
stały się nieaktualne. Końcowy weryfikator parasola ponownie sprawdza zarejestrowane identyfikatory uruchomień
przepływów potomnych, więc po pomyślnym ponownym uruchomieniu przepływu potomnego ponów tylko nieudane
zadanie nadrzędne `Verify full validation`.

Do ograniczonego odzyskiwania przekaż `rerun_group` do parasola. `all` to rzeczywiste
uruchomienie kandydata do wydania, `ci` uruchamia tylko normalny proces potomny CI, `plugin-prerelease`
uruchamia tylko proces potomny pluginów wyłącznie dla wydania, `release-checks` uruchamia wszystkie maszyny
wydania, a węższe grupy wydania to `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` i `npm-telegram`.
Ukierunkowane ponowienia `npm-telegram` wymagają `npm_telegram_package_spec`; pełne/wszystkie uruchomienia
z `release_profile=full` używają artefaktu pakietu z release-checks. Ukierunkowane
ponowienia cross-OS mogą dodać `cross_os_suite_filter=windows/packaged-upgrade` albo
inny filtr OS/zestawu. Niepowodzenia QA release-checks są doradcze; niepowodzenie wyłącznie QA
nie blokuje walidacji wydania.

### Vitest

Maszyna Vitest to ręczny potomny przepływ pracy `CI`. Ręczne CI celowo
pomija zakresowanie po zmianach i wymusza normalny graf testów dla kandydata
wydania: shardy Linux Node, shardy bundled-plugin, kontrakty kanałów, zgodność Node 22,
`check`, `check-additional`, build smoke, sprawdzenia dokumentacji, Python
skills, Windows, macOS, Android i Control UI i18n.

Użyj tej maszyny, aby odpowiedzieć: „czy drzewo źródłowe przeszło pełny normalny zestaw testów?”.
To nie jest to samo co walidacja produktu w ścieżce wydania. Dowody do zachowania:

- podsumowanie `Full Release Validation` pokazujące URL uruchomionego `CI`
- uruchomienie `CI` zielone na dokładnym docelowym SHA
- nazwy nieudanych lub wolnych shardów z zadań CI podczas badania regresji
- artefakty czasów Vitest, takie jak `.artifacts/vitest-shard-timings.json`, gdy
  uruchomienie wymaga analizy wydajności

Uruchamiaj ręczne CI bezpośrednio tylko wtedy, gdy wydanie wymaga deterministycznego normalnego CI, ale
nie maszyn Docker, QA Lab, live, cross-OS ani package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Maszyna Docker znajduje się w `OpenClaw Release Checks` przez
`openclaw-live-and-e2e-checks-reusable.yml`, plus przepływ pracy
`install-smoke` w trybie wydania. Waliduje kandydata wydania przez spakowane
środowiska Docker zamiast wyłącznie testów na poziomie źródeł.

Pokrycie Docker dla wydania obejmuje:

- pełny install smoke z włączonym wolnym globalnym Bun install smoke
- przygotowanie/ponowne użycie obrazu smoke głównego Dockerfile według docelowego SHA, z zadaniami QR,
  root/gateway i installer/Bun smoke działającymi jako osobne shardy install-smoke
- ścieżki E2E repozytorium
- chunki Docker ścieżki wydania: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` i `plugins-runtime-install-h`
- pokrycie OpenWebUI w chunku `plugins-runtime-services`, gdy jest wymagane
- podzielone ścieżki instalacji/deinstalacji bundled plugin
  `bundled-plugin-install-uninstall-0` do
  `bundled-plugin-install-uninstall-23`
- zestawy dostawców live/E2E i pokrycie modeli live Docker, gdy sprawdzenia wydania
  obejmują zestawy live

Użyj artefaktów Docker przed ponownym uruchomieniem. Harmonogram ścieżki wydania przesyła
`.artifacts/docker-tests/` z logami ścieżek, `summary.json`, `failures.json`,
czasami faz, JSON planu harmonogramu i poleceniami ponowienia. Do ukierunkowanego odzyskiwania
użyj `docker_lanes=<lane[,lane]>` w wielokrotnego użytku przepływie live/E2E zamiast
ponownie uruchamiać wszystkie chunki wydania. Wygenerowane polecenia ponowienia zawierają wcześniejsze
`package_artifact_run_id` i przygotowane wejścia obrazów Docker, gdy są dostępne, więc
nieudana ścieżka może ponownie użyć tego samego tarballa i obrazów GHCR.

### QA Lab

Maszyna QA Lab jest również częścią `OpenClaw Release Checks`. Jest agentową
bramką wydania dotyczącą zachowania i poziomu kanałów, osobną od Vitest i mechaniki
pakietów Docker.

Pokrycie QA Lab dla wydania obejmuje:

- ścieżkę parytetu mock porównującą ścieżkę kandydata OpenAI z bazą Opus 4.6
  przy użyciu agentowego pakietu parytetu
- szybki profil QA live Matrix używający środowiska `qa-live-shared`
- ścieżkę QA live Telegram używającą dzierżaw poświadczeń Convex CI
- `pnpm qa:otel:smoke`, gdy telemetria wydania wymaga wyraźnego lokalnego dowodu

Użyj tej maszyny, aby odpowiedzieć: „czy wydanie zachowuje się poprawnie w scenariuszach QA i
przepływach kanałów live?” Zachowaj URL-e artefaktów dla ścieżek parytetu, Matrix i Telegram
podczas zatwierdzania wydania. Pełne pokrycie Matrix pozostaje dostępne jako
ręczne shardowane uruchomienie QA-Lab, a nie domyślna ścieżka krytyczna dla wydania.

### Pakiet

Maszyna Package jest bramką produktu instalowalnego. Jest wspierana przez
`Package Acceptance` i resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver normalizuje
kandydata do tarballa `package-under-test` używanego przez Docker E2E, waliduje
inventory pakietu, zapisuje wersję pakietu i SHA-256 oraz utrzymuje
ref harnessa przepływu pracy oddzielnie od refa źródeł pakietu.

Obsługiwane źródła kandydatów:

- `source=npm`: `openclaw@beta`, `openclaw@latest` albo dokładna wersja wydania OpenClaw
- `source=ref`: spakuj zaufaną gałąź `package_ref`, tag albo pełny SHA commita
  z wybranym harnessem `workflow_ref`
- `source=url`: pobierz HTTPS `.tgz` z wymaganym `package_sha256`
- `source=artifact`: użyj ponownie `.tgz` przesłanego przez inne uruchomienie GitHub Actions

`OpenClaw Release Checks` uruchamia Package Acceptance z `source=artifact`, przygotowanym
artefaktem pakietu wydania, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance utrzymuje migrację, aktualizację, czyszczenie nieaktualnych
zależności pluginów, offline fixtures pluginów, aktualizację pluginów i Telegram
package QA wobec tego samego rozwiązanego tarballa. Blokujące sprawdzenia wydania używają
domyślnej najnowszej opublikowanej bazy pakietu; `run_release_soak=true` lub
`release_profile=full` rozszerza zakres do każdej stabilnej bazy opublikowanej w npm od
`2026.4.23` do `latest` plus fixtures zgłoszonych problemów. Użyj
Package Acceptance z `source=npm` dla już wysłanego kandydata albo
`source=ref`/`source=artifact` dla lokalnego tarballa npm opartego na SHA przed
publikacją. To natywne dla GitHuba
zastępstwo większości pokrycia pakietów/aktualizacji, które wcześniej wymagało
Parallels. Międzyplatformowe sprawdzenia wydania nadal mają znaczenie dla onboardingu,
instalatora i zachowania platformy specyficznych dla OS, ale walidacja produktu pakietu/aktualizacji powinna
preferować Package Acceptance.

Kanoniczna lista kontrolna walidacji aktualizacji i pluginów to
[Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins). Użyj jej przy
decydowaniu, która lokalna, Docker, Package Acceptance albo release-check ścieżka dowodzi
instalacji/aktualizacji pluginu, czyszczenia doctor albo zmiany migracji opublikowanego pakietu.
Wyczerpująca migracja aktualizacji opublikowanych z każdego stabilnego pakietu `2026.4.23+` jest
osobnym ręcznym przepływem pracy `Update Migration`, a nie częścią Full Release CI.

Starsza pobłażliwość package-acceptance jest celowo ograniczona czasowo. Pakiety do
`2026.4.25` mogą używać ścieżki zgodności dla luk metadanych już opublikowanych
w npm: prywatnych wpisów inventory QA brakujących w tarballu, brakującego
`gateway install --wrapper`, brakujących plików patch w fixture git wyprowadzonym z tarballa,
brakującego utrwalonego `update.channel`, starszych lokalizacji rekordów instalacji pluginów,
brakującego utrwalania rekordów instalacji marketplace oraz migracji metadanych konfiguracji
podczas `plugins update`. Opublikowany pakiet `2026.4.26` może ostrzegać
o lokalnych plikach stempla metadanych buildu, które zostały już wysłane. Późniejsze pakiety
muszą spełniać nowoczesne kontrakty pakietów; te same luki powodują niepowodzenie
walidacji wydania.

Użyj szerszych profili Package Acceptance, gdy pytanie o wydanie dotyczy
rzeczywistego pakietu instalowalnego:

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
  przeładowania konfiguracji
- `package`: kontrakty instalacji/aktualizacji/pakietu Plugin bez działającego ClawHub; to jest
  domyślne ustawienie kontroli wydania
- `product`: `package` plus kanały MCP, czyszczenie cron/subagent, wyszukiwanie
  webowe OpenAI i OpenWebUI
- `full`: fragmenty ścieżki wydania Docker z OpenWebUI
- `custom`: dokładna lista `docker_lanes` do ukierunkowanych ponownych uruchomień

Aby uzyskać dowód Telegram dla kandydata pakietu, włącz `telegram_mode=mock-openai` lub
`telegram_mode=live-frontier` w Package Acceptance. Workflow przekazuje
rozwiązany tarball `package-under-test` do ścieżki Telegram; samodzielny
workflow Telegram nadal akceptuje opublikowaną specyfikację npm do kontroli po publikacji.

## Automatyzacja publikacji wydania

`OpenClaw Release Publish` to standardowy mutujący punkt wejścia publikacji. 
Orkiestruje workflow zaufanego wydawcy w kolejności wymaganej przez wydanie:

1. Pobierz tag wydania i rozwiąż jego commit SHA.
2. Zweryfikuj, że tag jest osiągalny z `main` lub `release/*`.
3. Uruchom `pnpm plugins:sync:check`.
4. Wywołaj `Plugin NPM Release` z `publish_scope=all-publishable` i
   `ref=<release-sha>`.
5. Wywołaj `Plugin ClawHub Release` z tym samym zakresem i SHA.
6. Wywołaj `OpenClaw NPM Release` z tagiem wydania, dist-tag npm i
   zapisanym `preflight_run_id`.

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

Używaj niższopoziomowych workflow `Plugin NPM Release` i `Plugin ClawHub Release`
tylko do ukierunkowanych napraw lub ponownych publikacji. Dla naprawy wybranego pluginu przekaż
`plugin_publish_scope=selected` i `plugins=@openclaw/name` do
`OpenClaw Release Publish`, albo wywołaj workflow podrzędny bezpośrednio, gdy
pakiet OpenClaw nie może zostać opublikowany.

## Dane wejściowe workflow NPM

`OpenClaw NPM Release` akceptuje te dane wejściowe kontrolowane przez operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1` lub
  `v2026.4.2-beta.1`; gdy `preflight_only=true`, może to być też bieżący
  pełny 40-znakowy commit SHA gałęzi workflow dla wstępnej kontroli wyłącznie
  walidacyjnej
- `preflight_only`: `true` tylko dla walidacji/budowania/pakietu, `false` dla
  rzeczywistej ścieżki publikacji
- `preflight_run_id`: wymagane w rzeczywistej ścieżce publikacji, aby workflow ponownie użył
  przygotowanego tarballa z udanego uruchomienia preflight
- `npm_dist_tag`: docelowy tag npm dla ścieżki publikacji; domyślnie `beta`

`OpenClaw Release Publish` akceptuje te dane wejściowe kontrolowane przez operatora:

- `tag`: wymagany tag wydania; musi już istnieć
- `preflight_run_id`: identyfikator udanego uruchomienia preflight `OpenClaw NPM Release`;
  wymagany, gdy `publish_openclaw_npm=true`
- `npm_dist_tag`: docelowy tag npm dla pakietu OpenClaw
- `plugin_publish_scope`: domyślnie `all-publishable`; używaj `selected` tylko
  do ukierunkowanych napraw
- `plugins`: rozdzielone przecinkami nazwy pakietów `@openclaw/*`, gdy
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: domyślnie `true`; ustaw `false` tylko wtedy, gdy używasz
  workflow jako orkiestratora napraw wyłącznie dla pluginów

`OpenClaw Release Checks` akceptuje te dane wejściowe kontrolowane przez operatora:

- `ref`: gałąź, tag lub pełny commit SHA do zweryfikowania. Kontrole z sekretami
  wymagają, aby rozwiązany commit był osiągalny z gałęzi OpenClaw lub
  tagu wydania.
- `run_release_soak`: włącza wyczerpujące kontrole live/E2E, ścieżkę wydania Docker i
  soak wszystkich od ostatniego upgrade-survivor w stabilnych/domyślnych kontrolach wydania. Jest wymuszane
  przez `release_profile=full`.

Zasady:

- Tagi stabilne i korygujące mogą publikować do `beta` albo `latest`
- Tagi przedpremierowe beta mogą publikować tylko do `beta`
- Dla `OpenClaw NPM Release` wejście z pełnym commit SHA jest dozwolone tylko, gdy
  `preflight_only=true`
- `OpenClaw Release Checks` i `Full Release Validation` są zawsze
  wyłącznie walidacyjne
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, którego użyto podczas preflight;
  workflow weryfikuje te metadane przed kontynuowaniem publikacji

## Sekwencja stabilnego wydania npm

Podczas przygotowywania stabilnego wydania npm:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`
   - Zanim tag będzie istnieć, możesz użyć bieżącego pełnego commit SHA gałęzi workflow
     do walidacyjnego próbnego uruchomienia workflow preflight
2. Wybierz `npm_dist_tag=beta` dla standardowego przepływu najpierw beta, albo `latest` tylko
   wtedy, gdy celowo chcesz bezpośredniej stabilnej publikacji
3. Uruchom `Full Release Validation` na gałęzi wydania, tagu wydania lub pełnym
   commit SHA, gdy chcesz zwykłego CI plus pokrycia live prompt cache, Docker, QA Lab,
   Matrix i Telegram z jednego ręcznego workflow
4. Jeśli celowo potrzebujesz tylko deterministycznego zwykłego grafu testów, uruchom
   ręczny workflow `CI` na ref wydania
5. Zapisz udany `preflight_run_id`
6. Uruchom `OpenClaw Release Publish` z tym samym `tag`, tym samym `npm_dist_tag`
   i zapisanym `preflight_run_id`; publikuje on zewnętrzne pluginy do npm
   i ClawHub przed promocją pakietu npm OpenClaw
7. Jeśli wydanie trafiło na `beta`, użyj prywatnego workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   aby promować tę stabilną wersję z `beta` do `latest`
8. Jeśli wydanie celowo opublikowano bezpośrednio do `latest`, a `beta`
   powinna natychmiast wskazywać tę samą stabilną kompilację, użyj tego samego prywatnego
   workflow, aby ustawić oba dist-tag na stabilną wersję, albo pozwól, aby później zrobiła to
   jego zaplanowana samonaprawiająca synchronizacja

Mutacja dist-tag znajduje się w prywatnym repozytorium ze względów bezpieczeństwa, ponieważ nadal
wymaga `NPM_TOKEN`, podczas gdy publiczne repozytorium zachowuje publikację wyłącznie przez OIDC.

Dzięki temu bezpośrednia ścieżka publikacji i ścieżka promocji najpierw beta są
udokumentowane i widoczne dla operatora.

Jeśli maintainer musi awaryjnie użyć lokalnego uwierzytelniania npm, uruchamiaj wszystkie polecenia CLI 1Password
(`op`) tylko wewnątrz dedykowanej sesji tmux. Nie wywołuj `op`
bezpośrednio z głównej powłoki agenta; trzymanie go w tmux sprawia, że monity,
alerty i obsługa OTP są obserwowalne oraz zapobiega powtarzającym się alertom hosta.

## Publiczne odniesienia

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
