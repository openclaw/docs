---
read_when:
    - Wyszukiwanie definicji publicznych kanałów wydań
    - Uruchamianie walidacji wydania lub akceptacji pakietu
    - Szukasz nazewnictwa wersji i cyklu wydań
summary: Ścieżki wydań, lista kontrolna operatora, boksy walidacyjne, nazewnictwo wersji i rytm
title: Polityka wydań
x-i18n:
    generated_at: "2026-05-03T21:35:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566088d826e1e2bac21b11443b82b62cb73ed1fd9c508c3fb865149cf8a428ba
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ma trzy publiczne kanały wydań:

- stabilny: oznaczone tagami wydania, które domyślnie publikują do npm `beta`, albo do npm `latest`, gdy zostanie to wyraźnie zażądane
- beta: tagi wydań przedpremierowych, które publikują do npm `beta`
- dev: ruchoma głowica gałęzi `main`

## Nazewnictwo wersji

- Wersja stabilnego wydania: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Wersja stabilnego wydania poprawkowego: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Wersja wydania przedpremierowego beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Nie dopełniaj miesiąca ani dnia zerami
- `latest` oznacza bieżące promowane stabilne wydanie npm
- `beta` oznacza bieżący docelowy wariant instalacji beta
- Wydania stabilne i stabilne wydania poprawkowe domyślnie publikują do npm `beta`; operatorzy wydania mogą jawnie wskazać `latest` albo później promować sprawdzoną kompilację beta
- Każde stabilne wydanie OpenClaw dostarcza razem pakiet npm i aplikację macOS;
  wydania beta zwykle najpierw weryfikują i publikują ścieżkę npm/pakietu, a
  kompilowanie/podpisywanie/notaryzacja aplikacji Mac są zarezerwowane dla wydań stabilnych, chyba że zostaną wyraźnie zażądane

## Rytm wydań

- Wydania przechodzą najpierw przez beta
- Wydanie stabilne następuje dopiero po zweryfikowaniu najnowszej wersji beta
- Opiekunowie zwykle tworzą wydania z gałęzi `release/YYYY.M.D` utworzonej
  z bieżącej `main`, aby weryfikacja wydania i poprawki nie blokowały nowego
  rozwoju na `main`
- Jeśli tag beta został wypchnięty lub opublikowany i wymaga poprawki, opiekunowie tworzą
  następny tag `-beta.N` zamiast usuwać lub odtwarzać stary tag beta
- Szczegółowa procedura wydania, zatwierdzenia, poświadczenia i notatki odzyskiwania są
  dostępne tylko dla opiekunów

## Lista kontrolna operatora wydania

Ta lista kontrolna pokazuje publiczny kształt przepływu wydania. Prywatne poświadczenia,
podpisywanie, notaryzacja, odzyskiwanie dist-tagów i szczegóły awaryjnego wycofywania pozostają w
runbooku wydań dostępnym tylko dla opiekunów.

1. Zacznij od bieżącej `main`: pobierz najnowsze zmiany, potwierdź, że docelowy commit został wypchnięty,
   i potwierdź, że bieżące CI `main` jest wystarczająco zielone, aby utworzyć z niej gałąź.
2. Przepisz najwyższą sekcję `CHANGELOG.md` na podstawie rzeczywistej historii commitów za pomocą
   `/changelog`, utrzymaj wpisy jako skierowane do użytkowników, zatwierdź je commitem, wypchnij, a następnie jeszcze raz wykonaj rebase/pull
   przed utworzeniem gałęzi.
3. Przejrzyj rekordy zgodności wydań w
   `src/plugins/compat/registry.ts` i
   `src/commands/doctor/shared/deprecation-compat.ts`. Usuwaj wygasłą
   zgodność tylko wtedy, gdy ścieżka aktualizacji pozostaje pokryta, albo zapisz, dlaczego jest
   celowo utrzymywana.
4. Utwórz `release/YYYY.M.D` z bieżącej `main`; nie wykonuj normalnej pracy nad wydaniem
   bezpośrednio na `main`.
5. Podbij każdą wymaganą lokalizację wersji dla zamierzonego tagu, uruchom
   `pnpm plugins:sync`, aby publikowalne pakiety Plugin miały wspólną wersję wydania
   i metadane zgodności, a następnie uruchom lokalny deterministyczny preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` i
   `pnpm release:check`.
6. Uruchom `OpenClaw NPM Release` z `preflight_only=true`. Zanim tag istnieje,
   pełny 40-znakowy SHA gałęzi wydania jest dozwolony wyłącznie do walidacji
   preflight. Zapisz pomyślny `preflight_run_id`.
7. Uruchom wszystkie testy przedwydaniowe za pomocą `Full Release Validation` dla
   gałęzi wydania, tagu albo pełnego SHA commita. To jedyny ręczny punkt wejścia
   dla czterech dużych testowych środowisk wydań: Vitest, Docker, QA Lab i Package.
8. Jeśli walidacja się nie powiedzie, napraw na gałęzi wydania i ponownie uruchom najmniejszy nieudany
   plik, kanał, zadanie workflow, profil pakietu, dostawcę albo listę dozwolonych modeli, które
   potwierdzają poprawkę. Ponownie uruchom pełny parasol tylko wtedy, gdy zmieniona powierzchnia sprawia, że
   wcześniejsze dowody są nieaktualne.
9. Dla beta oznacz tagiem `vYYYY.M.D-beta.N`, a następnie uruchom `OpenClaw Release Publish` z
   odpowiadającej gałęzi `release/YYYY.M.D`. Weryfikuje `pnpm plugins:sync:check`,
   najpierw publikuje wszystkie publikowalne pakiety Plugin do npm, następnie publikuje ten sam
   zestaw do ClawHub jako tarballe ClawPack npm-pack, a potem promuje
   przygotowany artefakt preflight npm OpenClaw z pasującym dist-tagiem. Po
   publikacji uruchom akceptację pakietu po publikacji
   względem opublikowanego pakietu `openclaw@YYYY.M.D-beta.N` albo
   `openclaw@beta`. Jeśli wypchnięte lub opublikowane wydanie przedpremierowe wymaga poprawki,
   utwórz następny pasujący numer wydania przedpremierowego; nie usuwaj ani nie przepisuj starego
   wydania przedpremierowego.
10. Dla wydania stabilnego kontynuuj dopiero po tym, jak sprawdzona beta lub kandydat do wydania ma
    wymagane dowody walidacji. Publikacja stabilna npm również przechodzi przez
    `OpenClaw Release Publish`, ponownie używając pomyślnego artefaktu preflight przez
    `preflight_run_id`; gotowość stabilnego wydania macOS wymaga także
    spakowanych `.zip`, `.dmg`, `.dSYM.zip` i zaktualizowanego `appcast.xml` na `main`.
11. Po publikacji uruchom weryfikator npm po publikacji, opcjonalne samodzielne
    E2E opublikowanego npm dla Telegram, gdy potrzebujesz dowodu kanału po publikacji,
    promocję dist-tagu, gdy jest potrzebna, notatki wydania/przedpremierowego GitHub z
    kompletnej pasującej sekcji `CHANGELOG.md` oraz kroki ogłoszenia wydania.

## Preflight wydania

- Uruchom `pnpm check:test-types` przed kontrolą wstępną wydania, aby testowy TypeScript pozostał objęty kontrolą poza szybszą lokalną bramką `pnpm check`
- Uruchom `pnpm check:architecture` przed kontrolą wstępną wydania, aby szersze kontrole cykli importu i granic architektury były zielone poza szybszą lokalną bramką
- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane artefakty wydania `dist/*` i pakiet Control UI istniały dla kroku walidacji pakietu
- Uruchom `pnpm plugins:sync` po podbiciu wersji w katalogu głównym i przed tagowaniem. Aktualizuje wersje pakietów publikowalnych pluginów, metadane zgodności peer/API OpenClaw, metadane kompilacji i szkice dzienników zmian pluginów tak, aby pasowały do wersji wydania rdzenia. `pnpm plugins:sync:check` to niemutująca straż wydania; przepływ publikowania kończy się niepowodzeniem przed jakąkolwiek mutacją rejestru, jeśli ten krok został pominięty.
- Uruchom ręczny przepływ `Full Release Validation` przed zatwierdzeniem wydania, aby uruchomić wszystkie przedwydaniowe boksy testowe z jednego punktu wejścia. Przyjmuje gałąź, tag albo pełny SHA commita, uruchamia ręczny `CI` i uruchamia `OpenClaw Release Checks` dla testu instalacji, akceptacji pakietu, zestawów ścieżki wydania Dockera, testów live/E2E, OpenWebUI, parytetu QA Lab, Matrix i ścieżek Telegram. Z `release_profile=full` oraz `rerun_group=all` uruchamia też pakietowe Telegram E2E względem artefaktu `release-package-under-test` z kontroli wydania. Podaj `npm_telegram_package_spec` po publikacji, gdy ten sam Telegram E2E ma także zweryfikować opublikowany pakiet npm. Podaj `package_acceptance_package_spec` po publikacji, gdy Package Acceptance ma uruchomić swoją macierz pakietu/aktualizacji względem wysłanego pakietu npm zamiast artefaktu zbudowanego z SHA. Podaj `evidence_package_spec`, gdy prywatny raport dowodowy ma potwierdzić, że walidacja odpowiada opublikowanemu pakietowi npm bez wymuszania Telegram E2E. Przykład:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Uruchom ręczny przepływ `Package Acceptance`, gdy chcesz uzyskać dowód kanałem pobocznym dla kandydata pakietu, podczas gdy prace nad wydaniem trwają. Użyj `source=npm` dla `openclaw@beta`, `openclaw@latest` albo dokładnej wersji wydania; `source=ref`, aby spakować zaufaną gałąź/tag/SHA `package_ref` z bieżącym zestawem `workflow_ref`; `source=url` dla tarballa HTTPS z wymaganym SHA-256; albo `source=artifact` dla tarballa przesłanego przez inny przebieg GitHub Actions. Przepływ rozwiązuje kandydata do `package-under-test`, ponownie używa harmonogramu wydania Docker E2E względem tego tarballa i może uruchomić QA Telegram względem tego samego tarballa z `telegram_mode=mock-openai` albo `telegram_mode=live-frontier`. Gdy wybrane ścieżki Dockera obejmują `published-upgrade-survivor`, artefakt pakietu jest kandydatem, a `published_upgrade_survivor_baseline` wybiera opublikowaną bazę.
  Przykład: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Typowe profile:
  - `smoke`: ścieżki instalacji/kanału/agenta, sieci Gateway i ponownego wczytania konfiguracji
  - `package`: natywne dla artefaktu ścieżki pakietu/aktualizacji/pluginu bez OpenWebUI ani live ClawHub
  - `product`: profil pakietu plus kanały MCP, czyszczenie cron/subagenta, wyszukiwanie internetowe OpenAI i OpenWebUI
  - `full`: fragmenty ścieżki wydania Dockera z OpenWebUI
  - `custom`: dokładny wybór `docker_lanes` dla ukierunkowanego ponownego uruchomienia
- Uruchom ręczny przepływ `CI` bezpośrednio, gdy potrzebujesz tylko pełnego normalnego pokrycia CI dla kandydata wydania. Ręczne uruchomienia CI omijają zakresowanie zmian i wymuszają ścieżki shardów Linux Node, shardów bundled-plugin, kontraktów kanałów, zgodności Node 22, `check`, `check-additional`, testu kompilacji, kontroli dokumentacji, Python skills, Windows, macOS, Android oraz Control UI i18n.
  Przykład: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Uruchom `pnpm qa:otel:smoke` podczas walidacji telemetrii wydania. Ćwiczy QA-lab przez lokalny odbiornik OTLP/HTTP i weryfikuje wyeksportowane nazwy spanów śladu, ograniczone atrybuty oraz redakcję treści/identyfikatorów bez wymagania Opik, Langfuse ani innego zewnętrznego kolektora.
- Uruchom `pnpm release:check` przed każdym tagowanym wydaniem
- Uruchom `OpenClaw Release Publish` dla mutującej sekwencji publikowania po utworzeniu taga. Wywołaj go z `release/YYYY.M.D` (albo `main`, gdy publikujesz tag osiągalny z main), przekaż tag wydania i udany `preflight_run_id` npm OpenClaw oraz zachowaj domyślny zakres publikowania pluginów `all-publishable`, chyba że celowo uruchamiasz ukierunkowaną naprawę. Przepływ serializuje publikowanie pluginów npm, publikowanie pluginów ClawHub i publikowanie npm OpenClaw, aby pakiet rdzenia nie został opublikowany przed jego zewnętrznymi pluginami.
- Kontrole wydania działają teraz w osobnym ręcznym przepływie:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` uruchamia też ścieżkę parytetu mock QA Lab oraz szybki profil live Matrix i ścieżkę QA Telegram przed zatwierdzeniem wydania. Ścieżki live używają środowiska `qa-live-shared`; Telegram używa też dzierżaw poświadczeń Convex CI. Uruchom ręczny przepływ `QA-Lab - All Lanes` z `matrix_profile=all` i `matrix_shards=true`, gdy chcesz pełny spis transportu Matrix, mediów i E2EE równolegle.
- Międzysystemowa walidacja instalacji i aktualizacji w czasie działania jest częścią publicznych `OpenClaw Release Checks` i `Full Release Validation`, które wywołują bezpośrednio przepływ wielokrotnego użytku `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Ten podział jest celowy: utrzymuje rzeczywistą ścieżkę wydania npm krótką, deterministyczną i skupioną na artefaktach, podczas gdy wolniejsze kontrole live pozostają we własnej ścieżce, aby nie opóźniały ani nie blokowały publikacji
- Kontrole wydania zawierające sekrety powinny być uruchamiane przez `Full Release Validation` albo z referencji przepływu `main`/release, aby logika przepływu i sekrety pozostały kontrolowane
- `OpenClaw Release Checks` przyjmuje gałąź, tag albo pełny SHA commita, o ile rozwiązany commit jest osiągalny z gałęzi OpenClaw albo taga wydania
- Kontrola wstępna tylko walidacyjna `OpenClaw NPM Release` przyjmuje też bieżący pełny 40-znakowy SHA commita gałęzi przepływu bez wymagania wypchniętego taga
- Ta ścieżka SHA jest wyłącznie walidacyjna i nie może zostać wypromowana do rzeczywistej publikacji
- W trybie SHA przepływ syntetyzuje `v<package.json version>` tylko dla kontroli metadanych pakietu; rzeczywista publikacja nadal wymaga prawdziwego taga wydania
- Oba przepływy utrzymują rzeczywistą ścieżkę publikowania i promocji na runnerach hostowanych przez GitHub, podczas gdy niemutująca ścieżka walidacji może używać większych runnerów Blacksmith Linux
- Ten przepływ uruchamia
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  używając sekretów przepływu `OPENAI_API_KEY` i `ANTHROPIC_API_KEY`
- Kontrola wstępna wydania npm nie czeka już na osobną ścieżkę kontroli wydania
- Uruchom `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (albo odpowiadający tag beta/korekty) przed zatwierdzeniem
- Po publikacji npm uruchom
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (albo odpowiadającą wersję beta/korekty), aby zweryfikować opublikowaną ścieżkę instalacji z rejestru w świeżym tymczasowym prefiksie
- Po publikacji beta uruchom `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`, aby zweryfikować onboarding zainstalowanego pakietu, konfigurację Telegram i rzeczywiste Telegram E2E względem opublikowanego pakietu npm przy użyciu współdzielonej puli dzierżawionych poświadczeń Telegram. Jednorazowe lokalne uruchomienia maintainerów mogą pominąć zmienne Convex i przekazać trzy poświadczenia środowiskowe `OPENCLAW_QA_TELEGRAM_*` bezpośrednio.
- Maintainerzy mogą uruchomić tę samą kontrolę po publikacji z GitHub Actions przez ręczny przepływ `NPM Telegram Beta E2E`. Jest celowo wyłącznie ręczny i nie uruchamia się przy każdym scaleniu.
- Automatyzacja wydań maintainerów używa teraz schematu kontrola wstępna, potem promocja:
  - rzeczywista publikacja npm musi przejść pomyślny `preflight_run_id` npm
  - rzeczywista publikacja npm musi być uruchomiona z tej samej gałęzi `main` albo `release/YYYY.M.D` co udany przebieg kontroli wstępnej
  - stabilne wydania npm domyślnie trafiają do `beta`
  - stabilna publikacja npm może jawnie celować w `latest` przez wejście przepływu
  - mutacja npm dist-tag oparta na tokenie znajduje się teraz w `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` ze względów bezpieczeństwa, ponieważ `npm dist-tag add` nadal potrzebuje `NPM_TOKEN`, podczas gdy publiczne repo utrzymuje publikowanie wyłącznie przez OIDC
  - publiczny `macOS Release` jest wyłącznie walidacyjny; gdy tag istnieje tylko na gałęzi wydania, ale przepływ jest uruchamiany z `main`, ustaw `public_release_branch=release/YYYY.M.D`
  - rzeczywista prywatna publikacja mac musi przejść pomyślny prywatny mac `preflight_run_id` i `validate_run_id`
  - rzeczywiste ścieżki publikowania promują przygotowane artefakty zamiast budować je ponownie
- Dla stabilnych wydań korekcyjnych takich jak `YYYY.M.D-N` weryfikator po publikacji sprawdza też tę samą ścieżkę aktualizacji z tymczasowym prefiksem z `YYYY.M.D` do `YYYY.M.D-N`, aby korekty wydania nie mogły po cichu pozostawić starszych globalnych instalacji na bazowym stabilnym ładunku
- Kontrola wstępna wydania npm kończy się niepowodzeniem w trybie fail-closed, chyba że tarball zawiera zarówno `dist/control-ui/index.html`, jak i niepusty ładunek `dist/control-ui/assets/`, abyśmy ponownie nie wysłali pustego panelu przeglądarkowego
- Weryfikacja po publikacji sprawdza też, czy opublikowane punkty wejścia pluginów i metadane pakietu są obecne w zainstalowanym układzie rejestru. Wydanie, które wysyła brakujące ładunki runtime pluginów, kończy się niepowodzeniem w weryfikatorze postpublish i nie może zostać wypromowane do `latest`.
- `pnpm test:install:smoke` wymusza też budżet npm pack `unpackedSize` na tarballu kandydata aktualizacji, dzięki czemu instalator e2e wykrywa przypadkowe rozdęcie paczki przed ścieżką publikowania wydania
- Jeśli prace nad wydaniem dotknęły planowania CI, manifestów czasowania pluginów albo macierzy testów pluginów, przed zatwierdzeniem zregeneruj i przejrzyj należące do planera wyjścia macierzy `plugin-prerelease-extension-shard` z `.github/workflows/plugin-prerelease.yml`, aby informacje o wydaniu nie opisywały nieaktualnego układu CI
- Gotowość stabilnego wydania macOS obejmuje też powierzchnie aktualizatora:
  - wydanie GitHub musi ostatecznie zawierać spakowane `.zip`, `.dmg` i `.dSYM.zip`
  - `appcast.xml` na `main` musi wskazywać na nowy stabilny zip po publikacji
  - spakowana aplikacja musi zachować niedebugowy identyfikator pakietu, niepusty URL kanału Sparkle i `CFBundleVersion` na poziomie kanonicznego minimalnego buildu Sparkle dla tej wersji wydania albo wyższym

## Boksy testowe wydania

`Full Release Validation` to sposób, w jaki operatorzy uruchamiają wszystkie testy przedwydaniowe z jednego punktu wejścia. Aby uzyskać dowód przypiętego commita na szybko zmieniającej się gałęzi, użyj pomocnika, aby każdy przepływ podrzędny działał z tymczasowej gałęzi ustalonej na docelowy SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Pomocnik wypycha `release-ci/<sha>-...`, uruchamia `Full Release Validation` z tej gałęzi z `ref=<sha>`, weryfikuje, że każdy `headSha` przepływu podrzędnego pasuje do celu, a następnie usuwa gałąź tymczasową. Zapobiega to przypadkowemu potwierdzeniu nowszego przebiegu podrzędnego `main`.

Dla walidacji gałęzi wydania albo taga uruchom ją z zaufanej referencji przepływu `main` i przekaż gałąź wydania albo tag jako `ref`:

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
nadrzędny artefakt `release-package-under-test` dla kontroli dotyczących
pakietów oraz uruchamia samodzielne pakietowe Telegram E2E, gdy
`release_profile=full` z `rerun_group=all` albo gdy ustawiono
`npm_telegram_package_spec`. Następnie `OpenClaw Release
Checks` rozdziela się na smoke test instalacji, międzyplatformowe kontrole wydania, pokrycie ścieżki wydania live/E2E Docker, Package Acceptance z pakietową QA Telegram, parzystość QA Lab, live Matrix i live Telegram. Pełne uruchomienie jest akceptowalne tylko wtedy, gdy podsumowanie
`Full Release Validation`
pokazuje `normal_ci` i `release_checks` jako zakończone powodzeniem. W trybie full/all podrzędny `npm_telegram` także musi zakończyć się powodzeniem; poza full/all jest pomijany, chyba że podano opublikowany `npm_telegram_package_spec`. Końcowe podsumowanie weryfikatora zawiera tabele najwolniejszych zadań dla każdego uruchomienia podrzędnego, dzięki czemu menedżer wydania może zobaczyć bieżącą ścieżkę krytyczną bez pobierania logów.
Zobacz [Pełna walidacja wydania](/pl/reference/full-release-validation), aby uzyskać pełną macierz etapów, dokładne nazwy zadań przepływu pracy, różnice między profilami stable i full, artefakty oraz uchwyty ukierunkowanych ponownych uruchomień.
Podrzędne przepływy pracy są uruchamiane z zaufanego ref, który uruchamia `Full Release
Validation`, zwykle `--ref main`, nawet gdy docelowy `ref` wskazuje na starszą gałąź lub tag wydania. Nie ma oddzielnego wejścia ref przepływu pracy Full Release Validation; wybierz zaufany mechanizm, wybierając ref uruchomienia przepływu pracy.
Nie używaj `--ref main -f ref=<sha>` do dowodu dokładnego commita na ruchomym `main`;
surowe SHA commitów nie mogą być refami uruchomienia przepływu pracy, więc użyj
`pnpm ci:full-release --sha <sha>`, aby utworzyć przypiętą tymczasową gałąź.

Użyj `release_profile`, aby wybrać zakres live/dostawcy:

- `minimum`: najszybsza krytyczna dla wydania ścieżka live OpenAI/core i Docker
- `stable`: minimum plus stabilne pokrycie dostawców/backendów do zatwierdzenia wydania
- `full`: stable plus szerokie doradcze pokrycie dostawców/mediów

`OpenClaw Release Checks` używa zaufanego ref przepływu pracy, aby jednorazowo rozwiązać docelowy ref jako `release-package-under-test` i ponownie używa tego artefaktu zarówno w kontrolach Docker ścieżki wydania, jak i w Package Acceptance. Dzięki temu wszystkie środowiska dotyczące pakietów pracują na tych samych bajtach i unikają powtarzania buildów pakietu.
Międzyplatformowy smoke test instalacji OpenAI używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy ustawiona jest zmienna repo/org, w przeciwnym razie `openai/gpt-5.4`, ponieważ ta ścieżka dowodzi instalacji pakietu, onboardingu, uruchomienia Gateway i jednej tury agenta live, a nie benchmarkuje najwolniejszego domyślnego modelu. Szersza macierz dostawców live pozostaje miejscem dla pokrycia specyficznego dla modeli.

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

Nie używaj pełnego parasola jako pierwszego ponownego uruchomienia po ukierunkowanej poprawce. Jeśli jedno środowisko zawiedzie, użyj nieudanego podrzędnego przepływu pracy, zadania, ścieżki Docker, profilu pakietu, dostawcy modelu lub ścieżki QA jako następnego dowodu. Uruchom pełny parasol ponownie tylko wtedy, gdy poprawka zmieniła wspólną orkiestrację wydania albo sprawiła, że wcześniejsze dowody ze wszystkich środowisk stały się nieaktualne. Końcowy weryfikator parasola ponownie sprawdza zapisane identyfikatory uruchomień podrzędnych przepływów pracy, więc po pomyślnym ponownym uruchomieniu podrzędnego przepływu pracy uruchom ponownie tylko nieudane nadrzędne zadanie `Verify full validation`.

Do ograniczonego odzyskiwania przekaż `rerun_group` do parasola. `all` to rzeczywiste uruchomienie release-candidate, `ci` uruchamia tylko normalny podrzędny CI, `plugin-prerelease`
uruchamia tylko podrzędny plugin wyłącznie dla wydania, `release-checks` uruchamia każde środowisko wydania, a węższe grupy wydania to `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` i `npm-telegram`.
Ukierunkowane ponowne uruchomienia `npm-telegram` wymagają `npm_telegram_package_spec`; pełne/wszystkie uruchomienia z `release_profile=full` używają artefaktu pakietu release-checks.

### Vitest

Środowisko Vitest to ręczny podrzędny przepływ pracy `CI`. Ręczny CI celowo omija zakres zmian i wymusza normalny graf testów dla release candidate: shardy Linux Node, shardy wbudowanych pluginów, kontrakty kanałów, zgodność Node 22, `check`, `check-additional`, smoke test buildu, kontrole dokumentacji, Python skills, Windows, macOS, Android oraz Control UI i18n.

Użyj tego środowiska, aby odpowiedzieć na pytanie „czy drzewo źródłowe przeszło pełny normalny zestaw testów?”
Nie jest to to samo co walidacja produktu ścieżki wydania. Dowody do zachowania:

- podsumowanie `Full Release Validation` pokazujące URL uruchomionego `CI`
- zielone uruchomienie `CI` na dokładnym docelowym SHA
- nazwy nieudanych lub wolnych shardów z zadań CI podczas badania regresji
- artefakty czasów Vitest, takie jak `.artifacts/vitest-shard-timings.json`, gdy uruchomienie wymaga analizy wydajności

Uruchom ręczny CI bezpośrednio tylko wtedy, gdy wydanie potrzebuje deterministycznego normalnego CI, ale nie środowisk Docker, QA Lab, live, cross-OS ani pakietowych:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Środowisko Docker znajduje się w `OpenClaw Release Checks` przez
`openclaw-live-and-e2e-checks-reusable.yml` oraz przepływ pracy `install-smoke` w trybie wydania. Waliduje release candidate przez spakowane środowiska Docker zamiast wyłącznie testów na poziomie źródeł.

Pokrycie Docker wydania obejmuje:

- pełny smoke test instalacji z włączonym wolnym smoke testem globalnej instalacji Bun
- przygotowanie/ponowne użycie obrazu smoke głównego Dockerfile według docelowego SHA, z zadaniami QR, root/gateway oraz installer/Bun smoke działającymi jako oddzielne shardy install-smoke
- ścieżki E2E repozytorium
- fragmenty Docker ścieżki wydania: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` i `plugins-runtime-install-h`
- pokrycie OpenWebUI wewnątrz fragmentu `plugins-runtime-services`, gdy jest wymagane
- podzielone ścieżki instalacji/deinstalacji wbudowanych pluginów
  `bundled-plugin-install-uninstall-0` do
  `bundled-plugin-install-uninstall-23`
- zestawy dostawców live/E2E i pokrycie modeli Docker live, gdy kontrole wydania obejmują zestawy live

Użyj artefaktów Docker przed ponownym uruchomieniem. Harmonogram ścieżki wydania przesyła
`.artifacts/docker-tests/` z logami ścieżek, `summary.json`, `failures.json`,
czasami faz, JSON planu harmonogramu oraz poleceniami ponownego uruchomienia. Do ukierunkowanego odzyskiwania użyj `docker_lanes=<lane[,lane]>` w wielokrotnego użytku przepływie pracy live/E2E zamiast ponownie uruchamiać wszystkie fragmenty wydania. Wygenerowane polecenia ponownego uruchomienia zawierają wcześniejsze `package_artifact_run_id` i przygotowane wejścia obrazu Docker, gdy są dostępne, więc nieudana ścieżka może ponownie użyć tego samego tarballa i obrazów GHCR.

### QA Lab

Środowisko QA Lab jest również częścią `OpenClaw Release Checks`. Jest to bramka wydania dla zachowania agentowego i poziomu kanału, oddzielna od Vitest oraz mechaniki pakietów Docker.

Pokrycie QA Lab wydania obejmuje:

- ścieżkę parzystości mock porównującą ścieżkę kandydata OpenAI z baseline Opus 4.6 przy użyciu pakietu parzystości agentowej
- szybki profil QA live Matrix używający środowiska `qa-live-shared`
- ścieżkę QA live Telegram używającą dzierżaw poświadczeń Convex CI
- `pnpm qa:otel:smoke`, gdy telemetria wydania potrzebuje wyraźnego lokalnego dowodu

Użyj tego środowiska, aby odpowiedzieć na pytanie „czy wydanie zachowuje się poprawnie w scenariuszach QA i przepływach kanałów live?” Zachowaj URL-e artefaktów dla ścieżek parzystości, Matrix i Telegram podczas zatwierdzania wydania. Pełne pokrycie Matrix pozostaje dostępne jako ręczne shardowane uruchomienie QA-Lab, a nie domyślna ścieżka krytyczna dla wydania.

### Pakiet

Środowisko Package jest bramką produktu instalowalnego. Jest wspierane przez
`Package Acceptance` i resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver normalizuje kandydata do tarballa `package-under-test` używanego przez Docker E2E, waliduje inwentarz pakietu, zapisuje wersję pakietu i SHA-256 oraz oddziela ref mechanizmu przepływu pracy od ref źródła pakietu.

Obsługiwane źródła kandydatów:

- `source=npm`: `openclaw@beta`, `openclaw@latest` albo dokładna wersja wydania OpenClaw
- `source=ref`: spakuj zaufaną gałąź `package_ref`, tag albo pełny SHA commita z wybranym mechanizmem `workflow_ref`
- `source=url`: pobierz HTTPS `.tgz` z wymaganym `package_sha256`
- `source=artifact`: użyj ponownie `.tgz` przesłanego przez inne uruchomienie GitHub Actions

`OpenClaw Release Checks` uruchamia Package Acceptance z `source=artifact`, przygotowanym artefaktem pakietu wydania, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues` i
`telegram_mode=mock-openai`. Package Acceptance utrzymuje migrację, aktualizację, czyszczenie przestarzałych zależności pluginów, offline fixtures pluginów, aktualizację pluginów oraz pakietową QA Telegram wobec tego samego rozwiązanego tarballa. Macierz upgrade obejmuje każdy stabilny baseline opublikowany w npm od `2026.4.23` do `latest`; użyj
Package Acceptance z `source=npm` dla już wydanego kandydata albo
`source=ref`/`source=artifact` dla lokalnego tarballa npm opartego na SHA przed publikacją. Jest to natywne dla GitHub
zastępstwo dla większości pokrycia pakietu/aktualizacji, które wcześniej wymagało Parallels. Międzyplatformowe kontrole wydania nadal mają znaczenie dla onboardingu, instalatora i zachowania platformowego specyficznego dla systemu operacyjnego, ale walidacja produktu pakietu/aktualizacji powinna preferować Package Acceptance.

Kanoniczna lista kontrolna dla walidacji aktualizacji i pluginów to
[Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins). Użyj jej, gdy decydujesz, która lokalna ścieżka, Docker, Package Acceptance albo release-check potwierdza zmianę instalacji/aktualizacji pluginu, czyszczenia przez doctor albo migracji opublikowanego pakietu.
Wyczerpująca migracja aktualizacji opublikowanych pakietów z każdego stabilnego pakietu `2026.4.23+` to oddzielny ręczny przepływ pracy `Update Migration`, a nie część Full Release CI.

Łagodność legacy package-acceptance jest celowo ograniczona czasowo. Pakiety do
`2026.4.25` mogą używać ścieżki zgodności dla luk metadanych już opublikowanych w npm: prywatnych wpisów inwentarza QA brakujących w tarballu, brakującego
`gateway install --wrapper`, brakujących plików patch w fixture git pochodzącej z tarballa, brakującego utrwalonego `update.channel`, legacy lokalizacji rekordów instalacji pluginów, brakującego utrwalenia rekordów instalacji marketplace oraz migracji metadanych konfiguracji podczas `plugins update`. Opublikowany pakiet `2026.4.26` może ostrzegać o lokalnych plikach znacznika metadanych buildu, które zostały już wydane. Późniejsze pakiety muszą spełniać nowoczesne kontrakty pakietów; te same luki powodują niepowodzenie walidacji wydania.

Użyj szerszych profili Package Acceptance, gdy pytanie o wydanie dotyczy rzeczywistego instalowalnego pakietu:

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
- `package`: kontrakty instalacji/aktualizacji/pakietu Plugin bez aktywnego ClawHub; to jest domyślna
  ścieżka sprawdzania wydania
- `product`: `package` plus kanały MCP, czyszczenie Cron/podagentów, wyszukiwanie
  internetowe OpenAI oraz OpenWebUI
- `full`: fragmenty ścieżki wydania Docker z OpenWebUI
- `custom`: dokładna lista `docker_lanes` do ukierunkowanych ponownych uruchomień

Aby uzyskać dowód Telegram dla kandydata pakietu, włącz `telegram_mode=mock-openai` lub
`telegram_mode=live-frontier` w Package Acceptance. Workflow przekazuje
rozwiązany tarball `package-under-test` do ścieżki Telegram; samodzielny
workflow Telegram nadal przyjmuje opublikowaną specyfikację npm do kontroli po publikacji.

## Automatyzacja publikacji wydania

`OpenClaw Release Publish` to normalny modyfikujący punkt wejścia publikacji. Orkiestruje
workflowy zaufanego wydawcy w kolejności wymaganej przez wydanie:

1. Pobierz tag wydania i rozwiąż jego SHA commita.
2. Zweryfikuj, że tag jest osiągalny z `main` lub `release/*`.
3. Uruchom `pnpm plugins:sync:check`.
4. Wywołaj `Plugin NPM Release` z `publish_scope=all-publishable` oraz
   `ref=<release-sha>`.
5. Wywołaj `Plugin ClawHub Release` z tym samym zakresem i SHA.
6. Wywołaj `OpenClaw NPM Release` z tagiem wydania, dist-tagiem npm oraz
   zapisanym `preflight_run_id`.

Przykład publikacji beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Publikacja stabilna do domyślnego dist-tagu beta:

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

Używaj workflowów niższego poziomu `Plugin NPM Release` i `Plugin ClawHub Release`
tylko do ukierunkowanej naprawy lub ponownej publikacji. Przy naprawie wybranego Plugin przekaż
`plugin_publish_scope=selected` oraz `plugins=@openclaw/name` do
`OpenClaw Release Publish`, albo wywołaj workflow podrzędny bezpośrednio, gdy
pakiet OpenClaw nie może zostać opublikowany.

## Dane wejściowe workflow NPM

`OpenClaw NPM Release` przyjmuje te dane wejściowe kontrolowane przez operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1` lub
  `v2026.4.2-beta.1`; gdy `preflight_only=true`, może to być także bieżący
  pełny 40-znakowy SHA commita gałęzi workflow do preflightu wyłącznie walidacyjnego
- `preflight_only`: `true` tylko dla walidacji/builda/pakietu, `false` dla
  rzeczywistej ścieżki publikacji
- `preflight_run_id`: wymagane w rzeczywistej ścieżce publikacji, aby workflow ponownie użył
  przygotowanego tarballa z udanego przebiegu preflight
- `npm_dist_tag`: docelowy tag npm dla ścieżki publikacji; domyślnie `beta`

`OpenClaw Release Publish` przyjmuje te dane wejściowe kontrolowane przez operatora:

- `tag`: wymagany tag wydania; musi już istnieć
- `preflight_run_id`: identyfikator udanego przebiegu preflight `OpenClaw NPM Release`;
  wymagany, gdy `publish_openclaw_npm=true`
- `npm_dist_tag`: docelowy tag npm dla pakietu OpenClaw
- `plugin_publish_scope`: domyślnie `all-publishable`; używaj `selected` tylko
  do ukierunkowanych prac naprawczych
- `plugins`: rozdzielone przecinkami nazwy pakietów `@openclaw/*`, gdy
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: domyślnie `true`; ustaw `false` tylko wtedy, gdy używasz
  workflow jako orkiestratora naprawy wyłącznie Plugin

`OpenClaw Release Checks` przyjmuje te dane wejściowe kontrolowane przez operatora:

- `ref`: gałąź, tag lub pełny SHA commita do walidacji. Kontrole wymagające sekretów
  wymagają, aby rozwiązany commit był osiągalny z gałęzi OpenClaw lub
  taga wydania.

Zasady:

- Tagi stabilne i korekcyjne mogą publikować do `beta` albo `latest`
- Tagi przedwydaniowe beta mogą publikować wyłącznie do `beta`
- Dla `OpenClaw NPM Release` pełny SHA commita jest dozwolony tylko wtedy, gdy
  `preflight_only=true`
- `OpenClaw Release Checks` oraz `Full Release Validation` zawsze są
  wyłącznie walidacyjne
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, którego użyto podczas preflightu;
  workflow weryfikuje te metadane przed kontynuowaniem publikacji

## Sekwencja stabilnego wydania npm

Podczas przygotowywania stabilnego wydania npm:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`
   - Zanim tag będzie istnieć, możesz użyć bieżącego pełnego SHA commita gałęzi workflow
     do walidacyjnego próbnego uruchomienia workflow preflight
2. Wybierz `npm_dist_tag=beta` dla normalnego przepływu najpierw do beta albo `latest` tylko
   wtedy, gdy celowo chcesz bezpośredniej stabilnej publikacji
3. Uruchom `Full Release Validation` na gałęzi wydania, tagu wydania lub pełnym
   SHA commita, gdy chcesz uzyskać z jednego ręcznego workflow normalne CI oraz pokrycie aktywnej pamięci podręcznej promptów, Docker, QA Lab,
   Matrix i Telegram
4. Jeśli celowo potrzebujesz tylko deterministycznego normalnego grafu testów, uruchom
   ręczny workflow `CI` na refie wydania
5. Zapisz udane `preflight_run_id`
6. Uruchom `OpenClaw Release Publish` z tym samym `tag`, tym samym `npm_dist_tag`
   oraz zapisanym `preflight_run_id`; publikuje zewnętrzne pluginy do npm
   i ClawHub przed promowaniem pakietu npm OpenClaw
7. Jeśli wydanie trafiło do `beta`, użyj prywatnego workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   aby promować tę stabilną wersję z `beta` do `latest`
8. Jeśli wydanie celowo opublikowano bezpośrednio do `latest`, a `beta`
   powinien od razu wskazywać ten sam stabilny build, użyj tego samego prywatnego
   workflow, aby skierować oba dist-tagi na stabilną wersję, albo pozwól jego zaplanowanej
   samonaprawczej synchronizacji później przesunąć `beta`

Mutacja dist-tagu znajduje się w prywatnym repo ze względów bezpieczeństwa, ponieważ nadal
wymaga `NPM_TOKEN`, podczas gdy publiczne repo utrzymuje publikację wyłącznie przez OIDC.

Dzięki temu zarówno bezpośrednia ścieżka publikacji, jak i ścieżka promocji najpierw do beta
pozostają udokumentowane i widoczne dla operatorów.

Jeśli maintainer musi wrócić do lokalnego uwierzytelniania npm, uruchamiaj wszelkie polecenia 1Password
CLI (`op`) tylko w dedykowanej sesji tmux. Nie wywołuj `op`
bezpośrednio z głównej powłoki agenta; trzymanie go w tmux sprawia, że prompty,
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
jako właściwej instrukcji operacyjnej.

## Powiązane

- [Kanały wydania](/pl/install/development-channels)
