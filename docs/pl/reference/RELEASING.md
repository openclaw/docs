---
read_when:
    - Wyszukiwanie definicji publicznych kanałów wydań
    - Uruchamianie walidacji wydania lub akceptacji pakietu
    - Wyszukiwanie nazewnictwa wersji i częstotliwości wydań
summary: Ścieżki wydań, lista kontrolna operatora, boksy walidacyjne, nazewnictwo wersji i kadencja
title: Polityka wydań
x-i18n:
    generated_at: "2026-05-02T23:39:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba316d1736eae8edd2fb0a71b9a3da345f8895c3b536e9a1f619718ea12fc851
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ma trzy publiczne ścieżki wydań:

- stabilna: wydania oznaczone tagami, które domyślnie publikują do npm `beta`, albo do npm `latest`, gdy zostanie to wyraźnie zażądane
- beta: tagi przedpremierowe publikowane do npm `beta`
- deweloperska: ruchoma głowica `main`

## Nazewnictwo wersji

- Wersja stabilnego wydania: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Wersja stabilnego wydania poprawkowego: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Wersja przedpremierowa beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Nie dodawaj zer wiodących do miesiąca ani dnia
- `latest` oznacza aktualne promowane stabilne wydanie npm
- `beta` oznacza aktualny cel instalacji beta
- Stabilne wydania i stabilne wydania poprawkowe domyślnie publikują do npm `beta`; operatorzy wydań mogą jawnie wskazać `latest` albo później wypromować zweryfikowaną kompilację beta
- Każde stabilne wydanie OpenClaw dostarcza razem pakiet npm i aplikację macOS;
  wydania beta zwykle najpierw weryfikują i publikują ścieżkę npm/pakietu, a
  kompilowanie/podpisywanie/notaryzacja aplikacji Mac są zarezerwowane dla wydań
  stabilnych, chyba że zostanie to wyraźnie zażądane

## Rytm wydań

- Wydania przechodzą najpierw przez wersję beta
- Wydanie stabilne następuje dopiero po zweryfikowaniu najnowszej wersji beta
- Maintainerzy zwykle przygotowują wydania z gałęzi `release/YYYY.M.D` utworzonej
  z bieżącej gałęzi `main`, aby walidacja wydania i poprawki nie blokowały
  nowego rozwoju na `main`
- Jeśli tag beta został wypchnięty lub opublikowany i wymaga poprawki, maintainerzy tworzą
  następny tag `-beta.N` zamiast usuwać albo odtwarzać stary tag beta
- Szczegółowa procedura wydania, zatwierdzenia, poświadczenia i notatki odzyskiwania są
  przeznaczone wyłącznie dla maintainerów

## Lista kontrolna operatora wydania

Ta lista kontrolna opisuje publiczny kształt procesu wydania. Prywatne poświadczenia,
podpisywanie, notaryzacja, odzyskiwanie dist-tagów i szczegóły awaryjnego wycofania pozostają w
runbooku wydaniowym przeznaczonym wyłącznie dla maintainerów.

1. Zacznij od bieżącej gałęzi `main`: pobierz najnowsze zmiany, potwierdź, że docelowy commit został wypchnięty,
   i potwierdź, że bieżące CI na `main` jest wystarczająco zielone, aby utworzyć z niej gałąź.
2. Przepisz najwyższą sekcję `CHANGELOG.md` na podstawie rzeczywistej historii commitów za pomocą
   `/changelog`, zachowaj wpisy skierowane do użytkowników, commituj ją, wypchnij i wykonaj rebase/pull
   jeszcze raz przed utworzeniem gałęzi.
3. Przejrzyj rekordy zgodności wydania w
   `src/plugins/compat/registry.ts` i
   `src/commands/doctor/shared/deprecation-compat.ts`. Usuń wygasłą
   zgodność tylko wtedy, gdy ścieżka aktualizacji pozostaje pokryta, albo odnotuj, dlaczego jest
   celowo utrzymywana.
4. Utwórz `release/YYYY.M.D` z bieżącej gałęzi `main`; nie wykonuj zwykłych prac wydaniowych
   bezpośrednio na `main`.
5. Podbij każdą wymaganą lokalizację wersji dla zamierzonego tagu, uruchom
   `pnpm plugins:sync`, aby publikowalne pakiety Plugin współdzieliły wersję wydania
   i metadane zgodności, a następnie uruchom lokalny deterministyczny preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` oraz
   `pnpm release:check`.
6. Uruchom `OpenClaw NPM Release` z `preflight_only=true`. Zanim tag istnieje,
   pełny 40-znakowy SHA gałęzi wydania jest dozwolony wyłącznie do walidacyjnego
   preflightu. Zapisz pomyślny `preflight_run_id`.
7. Uruchom wszystkie testy przedwydaniowe za pomocą `Full Release Validation` dla
   gałęzi wydania, tagu albo pełnego SHA commitu. To jeden ręczny punkt wejścia
   dla czterech dużych boksów testów wydaniowych: Vitest, Docker, QA Lab i Package.
8. Jeśli walidacja się nie powiedzie, popraw na gałęzi wydania i ponownie uruchom najmniejszy nieudany
   plik, ścieżkę, zadanie workflow, profil pakietu, dostawcę albo allowlistę modeli, które
   dowodzą poprawki. Ponownie uruchom pełny parasol tylko wtedy, gdy zmieniona powierzchnia sprawia, że
   wcześniejsze dowody są nieaktualne.
9. Dla wersji beta oznacz `vYYYY.M.D-beta.N`, a następnie uruchom `OpenClaw Release Publish` z
   odpowiadającej gałęzi `release/YYYY.M.D`. Weryfikuje `pnpm plugins:sync:check`,
   najpierw publikuje wszystkie publikowalne pakiety Plugin do npm, jako drugie publikuje ten sam
   zestaw do ClawHub, a następnie promuje przygotowany artefakt preflight npm OpenClaw
   z pasującym dist-tagiem. Po publikacji uruchom powydaniową akceptację pakietu
   względem opublikowanego pakietu `openclaw@YYYY.M.D-beta.N` albo
   `openclaw@beta`. Jeśli wypchnięte albo opublikowane wydanie przedpremierowe wymaga poprawki,
   utwórz następny pasujący numer wydania przedpremierowego; nie usuwaj ani nie przepisuj starego
   wydania przedpremierowego.
10. Dla wydania stabilnego kontynuuj dopiero wtedy, gdy zweryfikowana beta albo kandydat wydania ma
    wymagane dowody walidacji. Publikacja stabilna npm także przechodzi przez
    `OpenClaw Release Publish`, ponownie używając pomyślnego artefaktu preflight za pomocą
    `preflight_run_id`; gotowość stabilnego wydania macOS wymaga również
    spakowanych plików `.zip`, `.dmg`, `.dSYM.zip` oraz zaktualizowanego `appcast.xml` na `main`.
11. Po publikacji uruchom powydaniowy weryfikator npm, opcjonalny samodzielny
    E2E Telegram opublikowanego npm, gdy potrzebujesz powydaniowego dowodu kanału,
    promocję dist-tagu, gdy jest potrzebna, notatki wydania/przedwydania GitHub z
    kompletnej pasującej sekcji `CHANGELOG.md` oraz kroki ogłoszenia wydania.

## Preflight wydania

- Uruchom `pnpm check:test-types` przed kontrolą wstępną wydania, aby testowy TypeScript pozostawał
  objęty kontrolą poza szybszą lokalną bramką `pnpm check`
- Uruchom `pnpm check:architecture` przed kontrolą wstępną wydania, aby szersze kontrole cykli
  importów i granic architektury były zielone poza szybszą lokalną bramką
- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane
  artefakty wydania `dist/*` oraz pakiet Control UI istniały na potrzeby kroku
  walidacji pakietu
- Uruchom `pnpm plugins:sync` po podbiciu wersji w katalogu głównym i przed tagowaniem. Aktualizuje
  wersje publikowalnych pakietów pluginów, metadane zgodności OpenClaw peer/API,
  metadane kompilacji oraz zalążki changelogów pluginów tak, aby pasowały do wersji wydania
  core. `pnpm plugins:sync:check` to niemutująca straż wydania;
  workflow publikowania kończy się niepowodzeniem przed jakąkolwiek mutacją rejestru, jeśli ten krok został
  pominięty.
- Uruchom ręczny workflow `Full Release Validation` przed zatwierdzeniem wydania, aby
  uruchomić wszystkie przedwydaniowe boxy testowe z jednego punktu wejścia. Przyjmuje branch,
  tag albo pełny SHA commita, dispatchuje ręczny `CI` oraz dispatchuje
  `OpenClaw Release Checks` dla install smoke, package acceptance, zestawów ścieżki wydania Docker,
  live/E2E, OpenWebUI, zgodności QA Lab, Matrix oraz pasów Telegram. Przy
  `release_profile=full` i `rerun_group=all` uruchamia też package
  Telegram E2E względem artefaktu `release-package-under-test` z release
  checks. Podaj `npm_telegram_package_spec` po opublikowaniu, gdy ten sam
  Telegram E2E ma także potwierdzić opublikowany pakiet npm. Podaj
  `package_acceptance_package_spec` po opublikowaniu, gdy Package Acceptance
  ma uruchomić swoją macierz pakietu/aktualizacji względem wysłanego pakietu npm zamiast
  artefaktu zbudowanego z SHA. Podaj
  `evidence_package_spec`, gdy prywatny raport dowodowy ma potwierdzić, że
  walidacja odpowiada opublikowanemu pakietowi npm bez wymuszania Telegram E2E.
  Przykład:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Uruchom ręczny workflow `Package Acceptance`, gdy chcesz uzyskać dowód bocznym kanałem
  dla kandydata pakietu, podczas gdy prace nad wydaniem trwają dalej. Użyj `source=npm` dla
  `openclaw@beta`, `openclaw@latest` albo dokładnej wersji wydania; `source=ref`,
  aby spakować zaufany branch/tag/SHA `package_ref` przy użyciu bieżącego harnessu
  `workflow_ref`; `source=url` dla tarballa HTTPS z wymaganym
  SHA-256; albo `source=artifact` dla tarballa przesłanego przez inne uruchomienie GitHub
  Actions. Workflow rozwiązuje kandydata do
  `package-under-test`, ponownie używa harmonogramu wydania Docker E2E względem tego
  tarballa i może uruchomić Telegram QA względem tego samego tarballa z
  `telegram_mode=mock-openai` albo `telegram_mode=live-frontier`. Gdy
  wybrane pasy Docker obejmują `published-upgrade-survivor`, artefakt pakietu
  jest kandydatem, a `published_upgrade_survivor_baseline` wybiera
  opublikowaną bazę.
  Przykład: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Typowe profile:
  - `smoke`: pasy instalacji/kanału/agenta, sieci Gateway i przeładowania konfiguracji
  - `package`: natywne dla artefaktu pasy pakietu/aktualizacji/pluginu bez OpenWebUI ani live ClawHub
  - `product`: profil pakietu plus kanały MCP, czyszczenie cron/subagent,
    wyszukiwanie w sieci OpenAI oraz OpenWebUI
  - `full`: fragmenty ścieżki wydania Docker z OpenWebUI
  - `custom`: dokładny wybór `docker_lanes` dla skupionego ponownego uruchomienia
- Uruchom ręczny workflow `CI` bezpośrednio, gdy potrzebujesz tylko pełnego normalnego
  pokrycia CI dla kandydata wydania. Ręczne dispatchowanie CI omija zakresowanie zmian
  i wymusza shardy Linux Node, shardy dołączonych pluginów, kontrakty kanałów,
  zgodność Node 22, `check`, `check-additional`, build smoke,
  kontrole dokumentacji, Python skills, Windows, macOS, Android oraz pasy i18n Control UI.
  Przykład: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Uruchom `pnpm qa:otel:smoke` podczas walidowania telemetrii wydania. Ćwiczy
  QA-lab przez lokalny odbiornik OTLP/HTTP i weryfikuje wyeksportowane nazwy
  spanów trace, ograniczone atrybuty oraz redakcję treści/identyfikatorów bez
  wymagania Opik, Langfuse ani innego zewnętrznego kolektora.
- Uruchom `pnpm release:check` przed każdym tagowanym wydaniem
- Uruchom `OpenClaw Release Publish` dla mutującej sekwencji publikowania po tym, jak
  tag już istnieje. Dispatchuj go z `release/YYYY.M.D` (albo `main`, gdy publikujesz
  tag osiągalny z main), przekaż tag wydania oraz udany OpenClaw npm
  `preflight_run_id` i zachowaj domyślny zakres publikowania pluginów
  `all-publishable`, chyba że celowo uruchamiasz skupioną naprawę. Workflow
  serializuje publikację pluginów npm, publikację pluginów ClawHub oraz publikację OpenClaw
  npm, aby pakiet core nie został opublikowany przed swoimi wyeksternalizowanymi
  pluginami.
- Kontrole wydania działają teraz w osobnym ręcznym workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` uruchamia też pas zgodności mock QA Lab oraz szybki
  profil live Matrix i pas Telegram QA przed zatwierdzeniem wydania. Pasy live
  używają środowiska `qa-live-shared`; Telegram używa także dzierżaw poświadczeń Convex CI.
  Uruchom ręczny workflow `QA-Lab - All Lanes` z
  `matrix_profile=all` i `matrix_shards=true`, gdy chcesz pełny inwentarz transportu,
  mediów i E2EE Matrix równolegle.
- Walidacja runtime instalacji i aktualizacji między systemami operacyjnymi jest częścią publicznych
  `OpenClaw Release Checks` oraz `Full Release Validation`, które wywołują
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` bezpośrednio
- Ten podział jest celowy: zachowuje realną ścieżkę wydania npm krótką,
  deterministyczną i skoncentrowaną na artefaktach, podczas gdy wolniejsze kontrole live pozostają we własnym
  pasie, aby nie opóźniały ani nie blokowały publikacji
- Kontrole wydania z sekretami powinny być dispatchowane przez `Full Release
Validation` albo z refa workflow `main`/release, aby logika workflow i
  sekrety pozostawały kontrolowane
- `OpenClaw Release Checks` przyjmuje branch, tag albo pełny SHA commita, o ile
  rozwiązany commit jest osiągalny z brancha OpenClaw albo tagu wydania
- Kontrola wstępna tylko do walidacji `OpenClaw NPM Release` akceptuje też bieżący
  pełny 40-znakowy SHA commita brancha workflow bez wymagania wypchniętego tagu
- Ta ścieżka SHA jest tylko walidacyjna i nie może zostać promowana do prawdziwej publikacji
- W trybie SHA workflow syntetyzuje `v<package.json version>` tylko na potrzeby
  kontroli metadanych pakietu; prawdziwa publikacja nadal wymaga prawdziwego tagu wydania
- Oba workflow utrzymują prawdziwą ścieżkę publikacji i promocji na runnerach hostowanych przez GitHub,
  podczas gdy niemutująca ścieżka walidacji może używać większych
  runnerów Blacksmith Linux
- Ten workflow uruchamia
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  z użyciem sekretów workflow `OPENAI_API_KEY` i `ANTHROPIC_API_KEY`
- Kontrola wstępna wydania npm nie czeka już na osobny pas kontroli wydania
- Uruchom `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (albo odpowiadający tag beta/korekty) przed zatwierdzeniem
- Po publikacji npm uruchom
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (albo odpowiadającą wersję beta/korekty), aby zweryfikować ścieżkę instalacji
  opublikowanego rejestru w świeżym prefiksie tymczasowym
- Po publikacji beta uruchom `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  aby zweryfikować onboarding zainstalowanego pakietu, konfigurację Telegram oraz rzeczywisty Telegram E2E
  względem opublikowanego pakietu npm przy użyciu wspólnej puli dzierżawionych poświadczeń Telegram.
  Jednorazowe lokalne uruchomienia maintainerów mogą pominąć zmienne Convex i przekazać trzy
  poświadczenia env `OPENCLAW_QA_TELEGRAM_*` bezpośrednio.
- Maintainerzy mogą uruchomić tę samą kontrolę po publikacji z GitHub Actions przez
  ręczny workflow `NPM Telegram Beta E2E`. Jest celowo tylko ręczny i
  nie uruchamia się przy każdym mergu.
- Automatyzacja wydań maintainerów używa teraz schematu kontrola wstępna, potem promocja:
  - prawdziwa publikacja npm musi przejść udany npm `preflight_run_id`
  - prawdziwa publikacja npm musi być dispatchowana z tego samego brancha `main` albo
    `release/YYYY.M.D` co udane uruchomienie kontroli wstępnej
  - stabilne wydania npm domyślnie trafiają do `beta`
  - stabilna publikacja npm może jawnie wskazać `latest` przez input workflow
  - mutacja dist-tagów npm oparta na tokenie znajduje się teraz w
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    ze względów bezpieczeństwa, ponieważ `npm dist-tag add` nadal potrzebuje `NPM_TOKEN`, podczas gdy
    publiczne repo utrzymuje publikację wyłącznie OIDC
  - publiczny `macOS Release` służy tylko do walidacji; gdy tag istnieje tylko na
    branchu wydania, ale workflow jest dispatchowany z `main`, ustaw
    `public_release_branch=release/YYYY.M.D`
  - prawdziwa prywatna publikacja mac musi przejść udany prywatny mac
    `preflight_run_id` i `validate_run_id`
  - prawdziwe ścieżki publikacji promują przygotowane artefakty zamiast budować
    je ponownie
- Dla stabilnych wydań korygujących, takich jak `YYYY.M.D-N`, weryfikator po publikacji
  sprawdza też tę samą ścieżkę aktualizacji w prefiksie tymczasowym z `YYYY.M.D` do `YYYY.M.D-N`,
  aby korekty wydań nie mogły po cichu zostawić starszych globalnych instalacji na
  bazowym stabilnym payloadzie
- Kontrola wstępna wydania npm kończy się zamkniętym niepowodzeniem, chyba że tarball zawiera zarówno
  `dist/control-ui/index.html`, jak i niepusty payload `dist/control-ui/assets/`,
  abyśmy ponownie nie wysłali pustego dashboardu przeglądarkowego
- Weryfikacja po publikacji sprawdza też, czy opublikowane entrypointy pluginów i
  metadane pakietu są obecne w zainstalowanym układzie rejestru. Wydanie, które
  wysyła brakujące runtime payloady pluginów, oblewa weryfikator po publikacji i
  nie może zostać promowane do `latest`.
- `pnpm test:install:smoke` egzekwuje też budżet `unpackedSize` paczki npm na
  tarballu kandydata aktualizacji, dzięki czemu installer e2e wyłapuje przypadkowe rozrośnięcie paczki
  przed ścieżką publikacji wydania
- Jeśli prace nad wydaniem dotknęły planowania CI, manifestów timingów rozszerzeń albo
  macierzy testów rozszerzeń, wygeneruj ponownie i przejrzyj należące do planera
  wyjścia macierzy `plugin-prerelease-extension-shard` z
  `.github/workflows/plugin-prerelease.yml` przed zatwierdzeniem, aby notatki wydania nie
  opisywały przestarzałego układu CI
- Gotowość stabilnego wydania macOS obejmuje też powierzchnie aktualizatora:
  - release GitHub musi ostatecznie zawierać spakowane `.zip`, `.dmg` i `.dSYM.zip`
  - `appcast.xml` na `main` musi wskazywać nowy stabilny zip po publikacji
  - spakowana aplikacja musi zachować niedebugowy identyfikator pakietu, niepusty adres URL feedu Sparkle
    oraz `CFBundleVersion` równy lub wyższy od kanonicznego progu builda Sparkle
    dla tej wersji wydania

## Boxy testowe wydania

`Full Release Validation` to sposób, w jaki operatorzy uruchamiają wszystkie testy przedwydaniowe z
jednego punktu wejścia. Aby uzyskać dowód przypiętego commita na szybko zmieniającym się branchu, użyj
helpera, aby każdy workflow potomny działał z tymczasowego brancha ustawionego na docelowy
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper wypycha `release-ci/<sha>-...`, dispatchuje `Full Release Validation`
z tego brancha z `ref=<sha>`, weryfikuje, że każdy workflow potomny `headSha`
pasuje do celu, a następnie usuwa tymczasowy branch. Zapobiega to przypadkowemu
potwierdzeniu nowszego uruchomienia potomnego `main`.

Dla walidacji brancha wydania albo tagu uruchom go z zaufanego refa workflow `main`
i przekaż branch wydania albo tag jako `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Przepływ pracy rozpoznaje docelowy ref, uruchamia ręcznie `CI` z
`target_ref=<release-ref>`, uruchamia `OpenClaw Release Checks` oraz uruchamia
samodzielne package Telegram E2E, gdy `release_profile=full` z
`rerun_group=all` albo gdy ustawiono `npm_telegram_package_spec`. Następnie `OpenClaw Release
Checks` rozdziela się na install smoke, cross-OS release checks, live/E2E Docker
release-path coverage, Package Acceptance z Telegram package QA, QA Lab
parity, live Matrix i live Telegram. Pełne uruchomienie jest akceptowalne tylko wtedy, gdy
podsumowanie `Full Release Validation`
pokazuje `normal_ci` i `release_checks` jako zakończone sukcesem. W trybie full/all
proces potomny `npm_telegram` także musi zakończyć się sukcesem; poza full/all jest pomijany,
chyba że podano opublikowany `npm_telegram_package_spec`. Końcowe
podsumowanie weryfikatora zawiera tabele najwolniejszych zadań dla każdego uruchomienia potomnego, dzięki czemu release
manager może zobaczyć bieżącą ścieżkę krytyczną bez pobierania logów.
Zobacz [Pełna walidacja wydania](/pl/reference/full-release-validation), aby poznać
pełną macierz etapów, dokładne nazwy zadań przepływu pracy, różnice między profilami stable i full,
artefakty oraz uchwyty do ukierunkowanych ponownych uruchomień.
Przepływy pracy potomne są uruchamiane z zaufanego ref, który uruchamia `Full Release
Validation`, zwykle `--ref main`, nawet gdy docelowy `ref` wskazuje na
starszą gałąź lub tag wydania. Nie ma osobnego wejścia workflow-ref dla Full Release Validation;
wybierz zaufany harness przez wybór ref uruchomienia przepływu pracy.
Nie używaj `--ref main -f ref=<sha>` do dowodu dokładnego commita na zmieniającym się `main`;
surowe SHA commitów nie mogą być refami uruchamiania przepływu pracy, więc użyj
`pnpm ci:full-release --sha <sha>`, aby utworzyć przypiętą tymczasową gałąź.

Użyj `release_profile`, aby wybrać zakres live/dostawców:

- `minimum`: najszybsza krytyczna dla wydania ścieżka OpenAI/core live i Docker
- `stable`: minimum plus stabilne pokrycie dostawców/backendów do zatwierdzenia wydania
- `full`: stable plus szerokie doradcze pokrycie dostawców/mediów

`OpenClaw Release Checks` używa zaufanego ref przepływu pracy, aby raz rozpoznać docelowy
ref jako `release-package-under-test` i ponownie używa tego artefaktu zarówno w
release-path Docker checks, jak i Package Acceptance. Dzięki temu wszystkie
środowiska skierowane na pakiet używają tych samych bajtów i unikają powtarzanych buildów pakietu.
Cross-OS OpenAI install smoke używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy
ustawiono zmienną repo/org, w przeciwnym razie `openai/gpt-5.4`, ponieważ ta ścieżka
potwierdza instalację pakietu, onboarding, uruchomienie Gateway i jedną turę agenta live,
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

Nie używaj pełnego umbrella jako pierwszego ponownego uruchomienia po ukierunkowanej poprawce. Jeśli jedno środowisko
zawiedzie, do następnego dowodu użyj nieudanego przepływu potomnego, zadania, ścieżki Docker,
profilu pakietu, dostawcy modelu albo ścieżki QA. Uruchom pełny umbrella ponownie tylko wtedy,
gdy poprawka zmieniła współdzieloną orkiestrację wydania albo unieważniła wcześniejszy dowód ze wszystkich środowisk.
Końcowy weryfikator umbrella ponownie sprawdza zapisane identyfikatory uruchomień potomnych przepływów pracy,
więc po udanym ponownym uruchomieniu przepływu potomnego ponownie uruchom tylko nieudane
zadanie nadrzędne `Verify full validation`.

W celu ograniczonego odzyskiwania przekaż `rerun_group` do umbrella. `all` to prawdziwe
uruchomienie release-candidate, `ci` uruchamia tylko normalny proces potomny CI, `plugin-prerelease`
uruchamia tylko proces potomny pluginu wyłącznie dla wydania, `release-checks` uruchamia każde środowisko wydania,
a węższe grupy wydania to `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` i `npm-telegram`.
Ukierunkowane ponowne uruchomienia `npm-telegram` wymagają `npm_telegram_package_spec`; uruchomienia full/all
z `release_profile=full` używają artefaktu pakietu release-checks.

### Vitest

Środowisko Vitest to ręczny potomny przepływ pracy `CI`. Ręczne CI celowo
omija zakres zmian i wymusza normalny graf testów dla kandydata wydania: shardy Linux Node,
shardy bundled-plugin, kontrakty kanałów, zgodność Node 22, `check`, `check-additional`,
build smoke, sprawdzenia dokumentacji, Python skills, Windows, macOS, Android i Control UI i18n.

Użyj tego środowiska, aby odpowiedzieć na pytanie „czy drzewo źródeł przeszło pełny normalny zestaw testów?”
To nie to samo co walidacja produktu w ścieżce wydania. Dowody do zachowania:

- podsumowanie `Full Release Validation` pokazujące URL uruchomionego `CI`
- zielone uruchomienie `CI` na dokładnym docelowym SHA
- nazwy nieudanych lub wolnych shardów z zadań CI podczas badania regresji
- artefakty czasów Vitest, takie jak `.artifacts/vitest-shard-timings.json`, gdy
  uruchomienie wymaga analizy wydajności

Uruchom ręczne CI bezpośrednio tylko wtedy, gdy wydanie wymaga deterministycznego normalnego CI, ale
nie środowisk Docker, QA Lab, live, cross-OS ani package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Środowisko Docker znajduje się w `OpenClaw Release Checks` przez
`openclaw-live-and-e2e-checks-reusable.yml`, plus przepływ pracy `install-smoke`
w trybie wydania. Waliduje kandydata wydania przez spakowane
środowiska Docker, a nie tylko testy na poziomie źródeł.

Pokrycie Docker dla wydania obejmuje:

- pełny install smoke z włączonym wolnym globalnym install smoke Bun
- przygotowanie/ponowne użycie obrazu smoke root Dockerfile według docelowego SHA, z zadaniami QR,
  root/gateway i installer/Bun smoke uruchamianymi jako osobne shardy install-smoke
- ścieżki E2E repozytorium
- fragmenty release-path Docker: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` i `plugins-runtime-install-h`
- pokrycie OpenWebUI wewnątrz fragmentu `plugins-runtime-services`, gdy jest wymagane
- podzielone ścieżki instalacji/deinstalacji bundled plugin
  od `bundled-plugin-install-uninstall-0` do
  `bundled-plugin-install-uninstall-23`
- zestawy dostawców live/E2E i pokrycie modeli Docker live, gdy release checks
  obejmują zestawy live

Użyj artefaktów Docker przed ponownym uruchomieniem. Harmonogram release-path przesyła
`.artifacts/docker-tests/` z logami ścieżek, `summary.json`, `failures.json`,
czasami faz, JSON planu harmonogramu i komendami ponownego uruchomienia. W celu ukierunkowanego odzyskiwania
użyj `docker_lanes=<lane[,lane]>` w wielokrotnego użytku przepływie live/E2E zamiast
ponownie uruchamiać wszystkie fragmenty wydania. Wygenerowane komendy ponownego uruchomienia obejmują wcześniejsze
`package_artifact_run_id` oraz przygotowane wejścia obrazu Docker, gdy są dostępne, więc
nieudana ścieżka może ponownie użyć tego samego tarballa i obrazów GHCR.

### QA Lab

Środowisko QA Lab także jest częścią `OpenClaw Release Checks`. To agentowa
bramka zachowania i poziomu kanałów dla wydania, oddzielna od Vitest i mechaniki
pakietów Docker.

Pokrycie QA Lab dla wydania obejmuje:

- ścieżkę mock parity porównującą ścieżkę kandydata OpenAI z bazą Opus 4.6
  przy użyciu agentowego pakietu parity
- szybki profil QA live Matrix używający środowiska `qa-live-shared`
- ścieżkę QA live Telegram używającą dzierżaw poświadczeń Convex CI
- `pnpm qa:otel:smoke`, gdy telemetria wydania wymaga jawnego lokalnego dowodu

Użyj tego środowiska, aby odpowiedzieć na pytanie „czy wydanie zachowuje się poprawnie w scenariuszach QA i
przepływach kanałów live?” Zachowaj URL-e artefaktów dla ścieżek parity, Matrix i Telegram
przy zatwierdzaniu wydania. Pełne pokrycie Matrix pozostaje dostępne jako
ręczne, shardowane uruchomienie QA-Lab, a nie domyślna ścieżka krytyczna dla wydania.

### Pakiet

Środowisko Package to bramka produktu instalowalnego. Opiera się na
`Package Acceptance` i resolverze
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver normalizuje
kandydata do tarballa `package-under-test` używanego przez Docker E2E, waliduje
inventory pakietu, zapisuje wersję pakietu i SHA-256 oraz utrzymuje
ref harnessu przepływu pracy oddzielnie od ref źródła pakietu.

Obsługiwane źródła kandydatów:

- `source=npm`: `openclaw@beta`, `openclaw@latest` albo dokładna wersja wydania OpenClaw
- `source=ref`: spakuj zaufaną gałąź, tag albo pełny SHA commita `package_ref`
  z wybranym harnessem `workflow_ref`
- `source=url`: pobierz HTTPS `.tgz` z wymaganym `package_sha256`
- `source=artifact`: użyj ponownie `.tgz` przesłanego przez inne uruchomienie GitHub Actions

`OpenClaw Release Checks` uruchamia Package Acceptance z `source=artifact`, przygotowanym
artefaktem pakietu wydania, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` i
`telegram_mode=mock-openai`. Package Acceptance utrzymuje migrację, update, czyszczenie przestarzałych
zależności pluginów, offline fixtures pluginów, update pluginów oraz Telegram
package QA względem tego samego rozpoznanego tarballa. Macierz upgrade obejmuje każdą stabilną bazę opublikowaną w npm od `2026.4.23` do `latest`; użyj
Package Acceptance z `source=npm` dla już wysłanego kandydata albo
`source=ref`/`source=artifact` dla lokalnego tarballa npm opartego na SHA przed
publikacją. Jest to natywne dla GitHub
zastępstwo większości pokrycia package/update, które wcześniej wymagało
Parallels. Cross-OS release checks nadal mają znaczenie dla onboardingu,
instalatora i zachowań platformowych specyficznych dla OS, ale walidacja produktu package/update powinna
preferować Package Acceptance.

Kanoniczna lista kontrolna dla walidacji update i pluginów to
[Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins). Użyj jej podczas
decydowania, która lokalna ścieżka, Docker, Package Acceptance albo release-check potwierdza
instalację/update pluginu, czyszczenie przez doctor albo zmianę migracji opublikowanego pakietu.
Wyczerpująca migracja opublikowanych update’ów z każdego stabilnego pakietu `2026.4.23+` to
osobny ręczny przepływ pracy `Update Migration`, nie część Full Release CI.

Pobłażliwość legacy package-acceptance jest celowo ograniczona czasowo. Pakiety do
`2026.4.25` mogą używać ścieżki zgodności dla luk w metadanych już opublikowanych
w npm: prywatnych wpisów inventory QA brakujących w tarballu, brakującego
`gateway install --wrapper`, brakujących plików patchy w fixture git pochodzącej z tarballa,
brakującego utrwalonego `update.channel`, legacy lokalizacji rekordów instalacji pluginów,
brakującego utrwalania rekordów instalacji marketplace oraz migracji metadanych config
podczas `plugins update`. Opublikowany pakiet `2026.4.26` może ostrzegać
o plikach znaczników metadanych lokalnego buildu, które już wysłano. Późniejsze pakiety
muszą spełniać nowoczesne kontrakty pakietów; te same luki powodują niepowodzenie walidacji
wydania.

Użyj szerszych profili Package Acceptance, gdy pytanie o wydanie dotyczy
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

- `smoke`: szybkie ścieżki instalacji pakietu/kanału/agenta, sieci Gateway i przeładowania config
- `package`: kontrakty pakietu install/update/plugin bez live ClawHub; to domyślny
  release-check
- `product`: `package` plus kanały MCP, czyszczenie cron/subagent, wyszukiwanie web OpenAI
  i OpenWebUI
- `full`: fragmenty release-path Docker z OpenWebUI
- `custom`: dokładna lista `docker_lanes` do ukierunkowanych ponownych uruchomień

W przypadku dowodu Telegram dla kandydata pakietu włącz `telegram_mode=mock-openai` lub
`telegram_mode=live-frontier` w Package Acceptance. Workflow przekazuje rozwiązany
tarball `package-under-test` do ścieżki Telegram; samodzielny workflow Telegram
nadal akceptuje opublikowaną specyfikację npm do kontroli po publikacji.

## Automatyzacja publikowania wydania

`OpenClaw Release Publish` to normalny mutujący punkt wejścia publikacji. 
Orkiestruje workflow zaufanego wydawcy w kolejności wymaganej przez wydanie:

1. Pobierz tag wydania i rozwiąż jego commit SHA.
2. Sprawdź, czy tag jest osiągalny z `main` lub `release/*`.
3. Uruchom `pnpm plugins:sync:check`.
4. Uruchom `Plugin NPM Release` z `publish_scope=all-publishable` i
   `ref=<release-sha>`.
5. Uruchom `Plugin ClawHub Release` z tym samym zakresem i SHA.
6. Uruchom `OpenClaw NPM Release` z tagiem wydania, tagiem dist npm oraz
   zapisanym `preflight_run_id`.

Przykład publikacji beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Stabilna publikacja do domyślnego tagu dist beta:

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

Używaj workflow niższego poziomu `Plugin NPM Release` i `Plugin ClawHub Release`
tylko do skoncentrowanej naprawy lub ponownej publikacji. Dla naprawy wybranego pluginu przekaż
`plugin_publish_scope=selected` i `plugins=@openclaw/name` do
`OpenClaw Release Publish` albo uruchom workflow podrzędny bezpośrednio, gdy
pakiet OpenClaw nie może zostać opublikowany.

## Dane wejściowe workflow NPM

`OpenClaw NPM Release` akceptuje następujące dane wejściowe kontrolowane przez operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1` albo
  `v2026.4.2-beta.1`; gdy `preflight_only=true`, może to być również bieżący
  pełny 40-znakowy commit SHA gałęzi workflow dla wstępnej kontroli wyłącznie
  walidacyjnej
- `preflight_only`: `true` tylko dla walidacji/budowania/pakietu, `false` dla
  rzeczywistej ścieżki publikacji
- `preflight_run_id`: wymagane w rzeczywistej ścieżce publikacji, aby workflow ponownie użył
  przygotowanego tarballa z udanego przebiegu wstępnej kontroli
- `npm_dist_tag`: docelowy tag npm dla ścieżki publikacji; domyślnie `beta`

`OpenClaw Release Publish` akceptuje następujące dane wejściowe kontrolowane przez operatora:

- `tag`: wymagany tag wydania; musi już istnieć
- `preflight_run_id`: identyfikator udanego przebiegu wstępnej kontroli `OpenClaw NPM Release`;
  wymagany, gdy `publish_openclaw_npm=true`
- `npm_dist_tag`: docelowy tag npm dla pakietu OpenClaw
- `plugin_publish_scope`: domyślnie `all-publishable`; używaj `selected` tylko
  do skoncentrowanych prac naprawczych
- `plugins`: rozdzielone przecinkami nazwy pakietów `@openclaw/*`, gdy
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: domyślnie `true`; ustaw `false` tylko wtedy, gdy używasz
  workflow jako orkiestratora napraw wyłącznie dla pluginów

`OpenClaw Release Checks` akceptuje następujące dane wejściowe kontrolowane przez operatora:

- `ref`: gałąź, tag lub pełny commit SHA do walidacji. Kontrole z sekretami
  wymagają, aby rozwiązany commit był osiągalny z gałęzi OpenClaw albo
  tagu wydania.

Zasady:

- Tagi stabilne i korygujące mogą publikować do `beta` albo `latest`
- Tagi wydań beta mogą publikować tylko do `beta`
- W `OpenClaw NPM Release` pełny commit SHA jest dozwolony tylko wtedy, gdy
  `preflight_only=true`
- `OpenClaw Release Checks` i `Full Release Validation` są zawsze
  wyłącznie walidacyjne
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, którego użyto podczas wstępnej kontroli;
  workflow weryfikuje te metadane przed kontynuowaniem publikacji

## Sekwencja stabilnego wydania npm

Podczas przygotowywania stabilnego wydania npm:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`
   - Zanim tag istnieje, możesz użyć bieżącego pełnego commit SHA gałęzi workflow
     do walidacyjnego suchego przebiegu workflow wstępnej kontroli
2. Wybierz `npm_dist_tag=beta` dla normalnego przepływu najpierw beta albo `latest` tylko
   wtedy, gdy celowo chcesz bezpośrednio stabilnej publikacji
3. Uruchom `Full Release Validation` na gałęzi wydania, tagu wydania albo pełnym
   commit SHA, gdy chcesz z jednego ręcznego workflow uzyskać normalne CI oraz pokrycie
   live prompt cache, Docker, QA Lab, Matrix i Telegram
4. Jeśli celowo potrzebujesz tylko deterministycznego normalnego grafu testów, uruchom
   ręczny workflow `CI` na referencji wydania
5. Zapisz udany `preflight_run_id`
6. Uruchom `OpenClaw Release Publish` z tym samym `tag`, tym samym `npm_dist_tag`
   oraz zapisanym `preflight_run_id`; publikuje zewnętrzne pluginy do npm
   i ClawHub przed promocją pakietu npm OpenClaw
7. Jeśli wydanie trafiło na `beta`, użyj prywatnego workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   aby wypromować tę stabilną wersję z `beta` do `latest`
8. Jeśli wydanie celowo opublikowano bezpośrednio do `latest`, a `beta`
   powinno natychmiast wskazywać tę samą stabilną kompilację, użyj tego samego prywatnego
   workflow, aby skierować oba tagi dist na stabilną wersję, albo pozwól, aby jego zaplanowana
   samonaprawiająca synchronizacja przeniosła `beta` później

Mutacja tagów dist znajduje się w prywatnym repo ze względów bezpieczeństwa, ponieważ nadal
wymaga `NPM_TOKEN`, podczas gdy publiczne repo zachowuje publikowanie wyłącznie przez OIDC.

Dzięki temu zarówno bezpośrednia ścieżka publikacji, jak i ścieżka promocji najpierw beta
są udokumentowane i widoczne dla operatora.

Jeśli maintainer musi awaryjnie użyć lokalnego uwierzytelniania npm, uruchamiaj wszystkie polecenia
CLI 1Password (`op`) tylko w dedykowanej sesji tmux. Nie wywołuj `op`
bezpośrednio z głównej powłoki agenta; utrzymywanie go wewnątrz tmux sprawia, że monity,
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

Maintainerzy używają prywatnej dokumentacji wydania w
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
jako właściwego runbooka.

## Powiązane

- [Kanały wydań](/pl/install/development-channels)
