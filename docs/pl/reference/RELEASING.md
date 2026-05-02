---
read_when:
    - Szukam definicji publicznych kanałów wydań
    - Uruchamianie walidacji wydania lub akceptacji pakietu
    - Szukasz informacji o nazewnictwie wersji i cyklu wydań
summary: Ścieżki wydania, lista kontrolna operatora, środowiska walidacyjne, nazewnictwo wersji i kadencja
title: Polityka wydań
x-i18n:
    generated_at: "2026-05-02T10:02:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce52c9144de3c8b914954db64f6ca5b2196edbbdcc7385984235a39c208bb59e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ma trzy publiczne tory wydań:

- stable: wydania oznaczone tagami, które domyślnie publikują do npm `beta` albo do npm `latest`, gdy zostanie to jawnie zażądane
- beta: tagi prerelease, które publikują do npm `beta`
- dev: ruchoma głowica `main`

## Nazewnictwo wersji

- Wersja wydania stabilnego: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Wersja poprawkowego wydania stabilnego: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Wersja prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Nie dodawaj zer wiodących do miesiąca ani dnia
- `latest` oznacza aktualnie promowane stabilne wydanie npm
- `beta` oznacza aktualny docelowy wariant instalacji beta
- Wydania stabilne i poprawkowe wydania stabilne domyślnie publikują do npm `beta`; operatorzy wydania mogą jawnie wskazać `latest` albo później promować sprawdzoną kompilację beta
- Każde stabilne wydanie OpenClaw dostarcza jednocześnie pakiet npm i aplikację macOS;
  wydania beta zwykle najpierw walidują i publikują ścieżkę npm/pakietu, a
  kompilacja/podpisanie/notaryzacja aplikacji mac są zarezerwowane dla wydań stabilnych, chyba że zostanie to jawnie zażądane

## Cykl wydań

- Wydania przechodzą najpierw przez beta
- Wydanie stabilne następuje dopiero po zwalidowaniu najnowszej wersji beta
- Opiekunowie zwykle tworzą wydania z gałęzi `release/YYYY.M.D` utworzonej
  z bieżącego `main`, dzięki czemu walidacja wydania i poprawki nie blokują nowego
  rozwoju na `main`
- Jeśli tag beta został wypchnięty lub opublikowany i wymaga poprawki, opiekunowie tworzą
  kolejny tag `-beta.N` zamiast usuwać albo odtwarzać stary tag beta
- Szczegółowa procedura wydania, zatwierdzenia, poświadczenia i notatki odzyskiwania są
  przeznaczone tylko dla opiekunów

## Lista kontrolna operatora wydania

Ta lista kontrolna przedstawia publiczny kształt przepływu wydania. Prywatne poświadczenia,
podpisywanie, notaryzacja, odzyskiwanie dist-tagów i szczegóły awaryjnego wycofania pozostają w
runbooku wydania przeznaczonym tylko dla opiekunów.

1. Zacznij od bieżącego `main`: pobierz najnowsze zmiany, potwierdź, że docelowy commit został wypchnięty,
   i potwierdź, że bieżące CI `main` jest wystarczająco zielone, aby utworzyć z niego gałąź.
2. Przepisz najwyższą sekcję `CHANGELOG.md` na podstawie rzeczywistej historii commitów za pomocą
   `/changelog`, utrzymuj wpisy jako skierowane do użytkowników, zatwierdź je, wypchnij i zrób rebase/pull
   jeszcze raz przed utworzeniem gałęzi.
3. Przejrzyj rekordy zgodności wydań w
   `src/plugins/compat/registry.ts` i
   `src/commands/doctor/shared/deprecation-compat.ts`. Usuń wygasłą
   zgodność tylko wtedy, gdy ścieżka aktualizacji pozostaje pokryta, albo zapisz, dlaczego jest
   celowo utrzymywana.
4. Utwórz `release/YYYY.M.D` z bieżącego `main`; nie wykonuj normalnej pracy wydawniczej
   bezpośrednio na `main`.
5. Podbij wszystkie wymagane lokalizacje wersji dla zamierzonego tagu, uruchom
   `pnpm plugins:sync`, aby publikowalne pakiety Plugin współdzieliły wersję wydania
   i metadane zgodności, a następnie uruchom lokalny deterministyczny preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` oraz
   `pnpm release:check`.
6. Uruchom `OpenClaw NPM Release` z `preflight_only=true`. Zanim istnieje tag,
   pełny 40-znakowy SHA gałęzi wydania jest dozwolony dla preflightu tylko walidacyjnego.
   Zapisz udany `preflight_run_id`.
7. Uruchom wszystkie testy przedwydaniowe za pomocą `Full Release Validation` dla
   gałęzi wydania, tagu albo pełnego SHA commitu. To jedyny ręczny punkt wejścia
   dla czterech dużych pudeł testowych wydania: Vitest, Docker, QA Lab i Package.
8. Jeśli walidacja się nie powiedzie, popraw na gałęzi wydania i ponownie uruchom najmniejszy nieudany
   plik, tor, zadanie workflow, profil pakietu, dostawcę albo allowlistę modelu, która
   dowodzi poprawki. Ponownie uruchom pełny parasol tylko wtedy, gdy zmieniona powierzchnia sprawia, że
   wcześniejsze dowody są nieaktualne.
9. Dla beta oznacz tagiem `vYYYY.M.D-beta.N`, a następnie uruchom `OpenClaw Release Publish` z
   pasującej gałęzi `release/YYYY.M.D`. Sprawdza ono `pnpm plugins:sync:check`,
   publikuje najpierw wszystkie publikowalne pakiety Plugin do npm, publikuje ten sam
   zestaw do ClawHub jako drugie, a następnie promuje przygotowany artefakt preflight npm OpenClaw
   z dist-tagiem `beta`. Po publikacji uruchom akceptację pakietu po publikacji
   względem opublikowanego pakietu `openclaw@YYYY.M.D-beta.N` albo `openclaw@beta`.
   Jeśli wypchnięta lub opublikowana beta wymaga poprawki, utwórz kolejne `-beta.N`;
   nie usuwaj ani nie przepisuj starej beta.
10. Dla wydania stabilnego kontynuuj dopiero po tym, jak sprawdzona beta albo kandydat do wydania ma
    wymagane dowody walidacji. Stabilna publikacja npm również przechodzi przez
    `OpenClaw Release Publish`, ponownie używając udanego artefaktu preflight za pomocą
    `preflight_run_id`; gotowość stabilnego wydania macOS wymaga również
    spakowanych `.zip`, `.dmg`, `.dSYM.zip` i zaktualizowanego `appcast.xml` na `main`.
11. Po publikacji uruchom weryfikator npm po publikacji, opcjonalny samodzielny
    E2E Telegram opublikowanego npm, gdy potrzebujesz dowodu kanału po publikacji,
    promocję dist-tagu, gdy jest potrzebna, notatki wydania/prerelease GitHub z
    pełnej pasującej sekcji `CHANGELOG.md` oraz kroki ogłoszenia wydania.

## Preflight wydania

- Uruchom `pnpm check:test-types` przed wstępną kontrolą wydania, aby testowy TypeScript pozostawał objęty sprawdzeniem poza szybszą lokalną bramką `pnpm check`
- Uruchom `pnpm check:architecture` przed wstępną kontrolą wydania, aby szersze kontrole cykli importu i granic architektury były zielone poza szybszą lokalną bramką
- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane artefakty wydania `dist/*` i pakiet Control UI istniały na potrzeby kroku walidacji pakowania
- Uruchom `pnpm plugins:sync` po podbiciu wersji w katalogu głównym i przed tagowaniem. Aktualizuje on wersje publikowalnych pakietów Plugin, metadane zgodności peer/API OpenClaw, metadane kompilacji oraz szkice dzienników zmian Plugin, aby odpowiadały wersji wydania rdzenia. `pnpm plugins:sync:check` to niemutująca osłona wydania; workflow publikowania zakończy się niepowodzeniem przed jakąkolwiek mutacją rejestru, jeśli ten krok został pominięty.
- Uruchom ręczny workflow `Full Release Validation` przed zatwierdzeniem wydania, aby uruchomić wszystkie przedwydaniowe pola testowe z jednego punktu wejścia. Przyjmuje gałąź, tag albo pełny SHA commita, uruchamia ręczny `CI` i uruchamia `OpenClaw Release Checks` dla install smoke, package acceptance, zestawów ścieżki wydania Docker, live/E2E, OpenWebUI, parytetu QA Lab, Matrix i ścieżek Telegram. Przy `release_profile=full` i `rerun_group=all` uruchamia również pakietowe Telegram E2E wobec artefaktu `release-package-under-test` z kontroli wydania. Podaj `npm_telegram_package_spec` po publikacji, gdy to samo Telegram E2E ma także potwierdzić opublikowany pakiet npm. Podaj `evidence_package_spec`, gdy prywatny raport dowodowy ma potwierdzić, że walidacja odpowiada opublikowanemu pakietowi npm bez wymuszania Telegram E2E.
  Przykład:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Uruchom ręczny workflow `Package Acceptance`, gdy chcesz uzyskać dowód pobocznym kanałem dla kandydata pakietu, podczas gdy prace wydaniowe trwają dalej. Użyj `source=npm` dla `openclaw@beta`, `openclaw@latest` albo dokładnej wersji wydania; `source=ref`, aby spakować zaufaną gałąź/tag/SHA `package_ref` przy użyciu bieżącej uprzęży `workflow_ref`; `source=url` dla archiwum tarball HTTPS z wymaganym SHA-256; albo `source=artifact` dla archiwum tarball przesłanego przez inny przebieg GitHub Actions. Workflow rozwiązuje kandydata do `package-under-test`, ponownie używa harmonogramu wydania Docker E2E wobec tego archiwum tarball i może uruchomić QA Telegram wobec tego samego archiwum tarball z `telegram_mode=mock-openai` albo `telegram_mode=live-frontier`. Gdy wybrane ścieżki Docker obejmują `published-upgrade-survivor`, artefakt pakietu jest kandydatem, a `published_upgrade_survivor_baseline` wybiera opublikowaną bazę odniesienia.
  Przykład: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Typowe profile:
  - `smoke`: ścieżki instalacji/kanału/agenta, sieci Gateway i ponownego ładowania konfiguracji
  - `package`: natywne dla artefaktu ścieżki pakietu/aktualizacji/Plugin bez OpenWebUI ani live ClawHub
  - `product`: profil pakietowy plus kanały MCP, czyszczenie cron/subagenta, wyszukiwanie internetowe OpenAI i OpenWebUI
  - `full`: fragmenty ścieżki wydania Docker z OpenWebUI
  - `custom`: dokładny wybór `docker_lanes` do ukierunkowanego ponownego uruchomienia
- Uruchom ręczny workflow `CI` bezpośrednio, gdy potrzebujesz wyłącznie pełnego zwykłego pokrycia CI dla kandydata wydania. Ręczne uruchomienia CI omijają zawężanie według zmian i wymuszają ścieżki Linux Node shards, bundled-plugin shards, kontraktów kanałów, zgodności Node 22, `check`, `check-additional`, build smoke, kontroli dokumentacji, Python skills, Windows, macOS, Android i i18n Control UI.
  Przykład: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Uruchom `pnpm qa:otel:smoke` podczas walidacji telemetrii wydania. Ćwiczy QA-lab przez lokalny odbiornik OTLP/HTTP i weryfikuje wyeksportowane nazwy spanów śladu, ograniczone atrybuty oraz redakcję treści/identyfikatorów bez wymagania Opik, Langfuse ani innego zewnętrznego kolektora.
- Uruchom `pnpm release:check` przed każdym otagowanym wydaniem
- Uruchom `OpenClaw Release Publish` dla mutującej sekwencji publikowania po utworzeniu taga. Uruchom go z `release/YYYY.M.D` (albo `main`, gdy publikujesz tag osiągalny z main), przekaż tag wydania i pomyślny `preflight_run_id` OpenClaw npm, a domyślny zakres publikowania Plugin pozostaw jako `all-publishable`, chyba że celowo wykonujesz ukierunkowaną naprawę. Workflow serializuje publikowanie Plugin npm, publikowanie Plugin ClawHub i publikowanie OpenClaw npm, aby pakiet rdzenia nie został opublikowany przed jego zewnętrznymi Plugin.
- Kontrole wydania działają teraz w osobnym ręcznym workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` uruchamia także bramkę parytetu makiet QA Lab oraz szybki profil live Matrix i ścieżkę QA Telegram przed zatwierdzeniem wydania. Ścieżki live używają środowiska `qa-live-shared`; Telegram używa także dzierżaw poświadczeń Convex CI. Uruchom ręczny workflow `QA-Lab - All Lanes` z `matrix_profile=all` i `matrix_shards=true`, gdy chcesz uzyskać pełny inwentarz transportu Matrix, multimediów i E2EE równolegle.
- Walidacja środowiska uruchomieniowego instalacji i aktualizacji między systemami operacyjnymi jest częścią publicznych `OpenClaw Release Checks` i `Full Release Validation`, które bezpośrednio wywołują wielokrotnego użytku workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Ten podział jest celowy: utrzymuje rzeczywistą ścieżkę wydania npm krótką, deterministyczną i skoncentrowaną na artefaktach, podczas gdy wolniejsze kontrole live pozostają we własnej ścieżce, aby nie wstrzymywały ani nie blokowały publikacji
- Kontrole wydania zawierające sekrety powinny być uruchamiane przez `Full Release Validation` albo z refa workflow `main`/release, aby logika workflow i sekrety pozostały kontrolowane
- `OpenClaw Release Checks` przyjmuje gałąź, tag albo pełny SHA commita, o ile rozwiązany commit jest osiągalny z gałęzi OpenClaw albo taga wydania
- Wstępna kontrola wyłącznie walidacyjna `OpenClaw NPM Release` przyjmuje także bieżący pełny 40-znakowy SHA commita gałęzi workflow bez wymagania wypchniętego taga
- Ta ścieżka SHA służy wyłącznie do walidacji i nie może zostać promowana do rzeczywistej publikacji
- W trybie SHA workflow syntetyzuje `v<package.json version>` tylko na potrzeby kontroli metadanych pakietu; rzeczywista publikacja nadal wymaga rzeczywistego taga wydania
- Oba workflow utrzymują rzeczywistą ścieżkę publikacji i promocji na runnerach hostowanych przez GitHub, podczas gdy niemutująca ścieżka walidacji może używać większych runnerów Blacksmith Linux
- Ten workflow uruchamia
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  przy użyciu sekretów workflow `OPENAI_API_KEY` i `ANTHROPIC_API_KEY`
- Wstępna kontrola wydania npm nie czeka już na osobną ścieżkę kontroli wydania
- Uruchom `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (albo odpowiadający tag beta/korekty) przed zatwierdzeniem
- Po publikacji npm uruchom
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (albo odpowiadającą wersję beta/korekty), aby zweryfikować opublikowaną ścieżkę instalacji z rejestru w świeżym tymczasowym prefiksie
- Po publikacji beta uruchom `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`, aby zweryfikować onboarding zainstalowanego pakietu, konfigurację Telegram i rzeczywiste Telegram E2E wobec opublikowanego pakietu npm przy użyciu współdzielonej puli dzierżawionych poświadczeń Telegram. Jednorazowe lokalne uruchomienia maintainerów mogą pominąć zmienne Convex i przekazać bezpośrednio trzy poświadczenia środowiskowe `OPENCLAW_QA_TELEGRAM_*`.
- Maintainerzy mogą uruchomić tę samą kontrolę po publikacji z GitHub Actions przez ręczny workflow `NPM Telegram Beta E2E`. Jest on celowo wyłącznie ręczny i nie uruchamia się przy każdym scaleniu.
- Automatyzacja wydania maintainerów używa teraz modelu preflight-then-promote:
  - rzeczywista publikacja npm musi przejść pomyślny npm `preflight_run_id`
  - rzeczywista publikacja npm musi zostać uruchomiona z tej samej gałęzi `main` albo `release/YYYY.M.D`, co pomyślny przebieg wstępnej kontroli
  - stabilne wydania npm domyślnie używają `beta`
  - stabilna publikacja npm może jawnie celować w `latest` przez wejście workflow
  - mutacja npm dist-tag oparta na tokenie znajduje się teraz w `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` ze względów bezpieczeństwa, ponieważ `npm dist-tag add` nadal wymaga `NPM_TOKEN`, podczas gdy publiczne repo zachowuje publikowanie wyłącznie z OIDC
  - publiczny `macOS Release` służy wyłącznie do walidacji; gdy tag istnieje tylko na gałęzi wydania, ale workflow jest uruchamiany z `main`, ustaw `public_release_branch=release/YYYY.M.D`
  - rzeczywista prywatna publikacja mac musi przejść pomyślny prywatny mac `preflight_run_id` i `validate_run_id`
  - rzeczywiste ścieżki publikowania promują przygotowane artefakty zamiast ponownie je budować
- Dla stabilnych wydań korekcyjnych, takich jak `YYYY.M.D-N`, weryfikator po publikacji sprawdza także tę samą ścieżkę aktualizacji z tymczasowego prefiksu z `YYYY.M.D` do `YYYY.M.D-N`, aby korekty wydania nie mogły po cichu pozostawić starszych globalnych instalacji na bazowym stabilnym ładunku
- Wstępna kontrola wydania npm kończy się niepowodzeniem w trybie fail closed, jeśli archiwum tarball nie zawiera zarówno `dist/control-ui/index.html`, jak i niepustego ładunku `dist/control-ui/assets/`, abyśmy ponownie nie wysłali pustego panelu przeglądarkowego
- Weryfikacja po publikacji sprawdza także, czy opublikowane punkty wejścia Plugin i metadane pakietu są obecne w zainstalowanym układzie rejestru. Wydanie, które dostarcza brakujące ładunki uruchomieniowe Plugin, nie przechodzi weryfikatora po publikacji i nie może zostać promowane do `latest`.
- `pnpm test:install:smoke` wymusza także budżet `unpackedSize` pakietu npm na kandydackim archiwum tarball aktualizacji, więc installer e2e wychwytuje przypadkowe rozrośnięcie pakietu przed ścieżką publikacji wydania
- Jeśli prace wydaniowe dotknęły planowania CI, manifestów czasów Plugin albo macierzy testów Plugin, przed zatwierdzeniem wygeneruj ponownie i przejrzyj należące do planisty wyjścia macierzy `plugin-prerelease-extension-shard` z `.github/workflows/plugin-prerelease.yml`, aby informacje o wydaniu nie opisywały nieaktualnego układu CI
- Gotowość stabilnego wydania macOS obejmuje także powierzchnie aktualizatora:
  - wydanie GitHub musi ostatecznie zawierać spakowane `.zip`, `.dmg` i `.dSYM.zip`
  - `appcast.xml` na `main` musi wskazywać nowy stabilny zip po publikacji
  - spakowana aplikacja musi zachować niedebugowy identyfikator pakietu, niepusty URL kanału Sparkle i `CFBundleVersion` równy albo wyższy od kanonicznej dolnej granicy buildu Sparkle dla tej wersji wydania

## Pola testowe wydania

`Full Release Validation` to sposób, w jaki operatorzy uruchamiają wszystkie testy przedwydaniowe z jednego punktu wejścia. Dla dowodu przypiętego commita na szybko zmieniającej się gałęzi użyj helpera, aby każdy podrzędny workflow działał z tymczasowej gałęzi ustalonej na docelowy SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper wypycha `release-ci/<sha>-...`, uruchamia `Full Release Validation` z tej gałęzi z `ref=<sha>`, weryfikuje, że każdy podrzędny workflow `headSha` odpowiada celowi, a następnie usuwa tymczasową gałąź. Zapobiega to przypadkowemu potwierdzeniu nowszego podrzędnego przebiegu `main`.

Dla walidacji gałęzi wydania albo taga uruchom go z zaufanego refa workflow `main` i przekaż gałąź wydania albo tag jako `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Przepływ pracy rozwiązuje docelowy ref, uruchamia ręczny `CI` z
`target_ref=<release-ref>`, uruchamia `OpenClaw Release Checks` oraz uruchamia
samodzielny pakiet Telegram E2E, gdy `release_profile=full` z
`rerun_group=all` albo gdy ustawiono `npm_telegram_package_spec`. `OpenClaw Release
Checks` następnie rozdziela pracę na install smoke, cross-OS release checks, pokrycie live/E2E Docker
ścieżki wydania, Package Acceptance z QA pakietu Telegram, QA Lab
parity, live Matrix i live Telegram. Pełne uruchomienie jest akceptowalne tylko wtedy, gdy
podsumowanie `Full Release Validation`
pokazuje `normal_ci` i `release_checks` jako zakończone powodzeniem. W trybie full/all
dziecko `npm_telegram` również musi zakończyć się powodzeniem; poza full/all jest pomijane,
chyba że podano opublikowane `npm_telegram_package_spec`. Końcowe
podsumowanie weryfikatora zawiera tabele najwolniejszych zadań dla każdego uruchomienia podrzędnego, dzięki czemu menedżer wydania
może zobaczyć aktualną ścieżkę krytyczną bez pobierania logów.
Zobacz [Pełna walidacja wydania](/pl/reference/full-release-validation), aby poznać
pełną macierz etapów, dokładne nazwy zadań przepływu pracy, różnice między profilami stable i full,
artefakty oraz uchwyty do ukierunkowanych ponownych uruchomień.
Podrzędne przepływy pracy są uruchamiane z zaufanego refa, który uruchamia `Full Release
Validation`, zwykle `--ref main`, nawet gdy docelowy `ref` wskazuje na
starszą gałąź wydania lub tag. Nie ma osobnego wejścia refa przepływu pracy dla Full Release Validation;
wybierz zaufany harness, wybierając ref uruchomienia przepływu pracy.
Nie używaj `--ref main -f ref=<sha>` do dowodu dokładnego commita na ruchomym `main`;
surowe SHA commitów nie mogą być refami dispatch przepływu pracy, więc użyj
`pnpm ci:full-release --sha <sha>`, aby utworzyć przypiętą gałąź tymczasową.

Użyj `release_profile`, aby wybrać zakres live/provider:

- `minimum`: najszybsza krytyczna dla wydania ścieżka live OpenAI/core i Docker
- `stable`: minimum plus stabilne pokrycie provider/backend do zatwierdzenia wydania
- `full`: stable plus szerokie pokrycie doradcze provider/media

`OpenClaw Release Checks` używa zaufanego refa przepływu pracy, aby raz rozwiązać docelowy
ref jako `release-package-under-test` i ponownie używa tego artefaktu zarówno w
sprawdzeniach Docker ścieżki wydania, jak i w Package Acceptance. Dzięki temu wszystkie
maszyny dotyczące pakietu pracują na tych samych bajtach i unikają powtarzania budowania pakietu.
Cross-OS OpenAI install smoke używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy
zmienna repo/org jest ustawiona, w przeciwnym razie `openai/gpt-5.5`, ponieważ ta ścieżka
dowodzi instalacji pakietu, onboardingu, uruchomienia gateway i jednej tury agenta live,
a nie benchmarkuje najwolniejszy model domyślny. Szersza macierz live provider
pozostaje miejscem dla pokrycia specyficznego dla modelu.

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

Nie używaj pełnego parasola jako pierwszego ponownego uruchomienia po ukierunkowanej poprawce. Jeśli jedna maszyna
zawiedzie, użyj nieudanego podrzędnego przepływu pracy, zadania, ścieżki Docker, profilu pakietu, modelu
provider lub ścieżki QA jako następnego dowodu. Uruchom pełny parasol ponownie tylko wtedy, gdy
poprawka zmieniła współdzieloną orkiestrację wydania albo unieważniła wcześniejsze dowody ze wszystkich maszyn.
Końcowy weryfikator parasola ponownie sprawdza zapisane identyfikatory uruchomień podrzędnych przepływów pracy,
więc po pomyślnym ponownym uruchomieniu podrzędnego przepływu pracy uruchom ponownie tylko nieudane
zadanie nadrzędne `Verify full validation`.

Do ograniczonego odzyskiwania przekaż `rerun_group` do parasola. `all` jest prawdziwym
uruchomieniem kandydata do wydania, `ci` uruchamia tylko normalne dziecko CI, `plugin-prerelease`
uruchamia tylko dziecko plugin wydaniowe, `release-checks` uruchamia każdą maszynę wydaniową,
a węższe grupy wydaniowe to `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` i `npm-telegram`.
Ukierunkowane ponowne uruchomienia `npm-telegram` wymagają `npm_telegram_package_spec`; uruchomienia full/all
z `release_profile=full` używają artefaktu pakietu z release-checks.

### Vitest

Maszyna Vitest to ręczny podrzędny przepływ pracy `CI`. Ręczne CI celowo
omija zakres zmian i wymusza normalny graf testów dla kandydata wydania:
shardy Linux Node, shardy bundled-plugin, kontrakty kanałów, zgodność Node 22,
`check`, `check-additional`, build smoke, sprawdzenia dokumentacji, Python
skills, Windows, macOS, Android i Control UI i18n.

Użyj tej maszyny, aby odpowiedzieć: „czy drzewo źródłowe przeszło pełny normalny zestaw testów?”.
To nie jest to samo co walidacja produktu ścieżki wydania. Zachowaj dowody:

- podsumowanie `Full Release Validation` pokazujące URL uruchomionego `CI`
- zielone uruchomienie `CI` na dokładnym docelowym SHA
- nazwy nieudanych lub wolnych shardów z zadań CI podczas badania regresji
- artefakty czasów Vitest, takie jak `.artifacts/vitest-shard-timings.json`, gdy
  uruchomienie wymaga analizy wydajności

Uruchom ręczne CI bezpośrednio tylko wtedy, gdy wydanie potrzebuje deterministycznego normalnego CI, ale
nie maszyn Docker, QA Lab, live, cross-OS ani package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Maszyna Docker znajduje się w `OpenClaw Release Checks` przez
`openclaw-live-and-e2e-checks-reusable.yml` oraz przepływ pracy `install-smoke`
w trybie wydania. Waliduje kandydata wydania przez spakowane
środowiska Docker, a nie tylko testy na poziomie źródeł.

Pokrycie Docker wydania obejmuje:

- pełny install smoke z włączonym wolnym smoke globalnej instalacji Bun
- przygotowanie/ponowne użycie obrazu smoke root Dockerfile według docelowego SHA, z zadaniami QR,
  root/gateway oraz installer/Bun smoke uruchamianymi jako osobne shardy install-smoke
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
- zestawy provider live/E2E oraz pokrycie modelu live Docker, gdy sprawdzenia wydania
  obejmują zestawy live

Używaj artefaktów Docker przed ponownym uruchomieniem. Harmonogram ścieżki wydania przesyła
`.artifacts/docker-tests/` z logami ścieżek, `summary.json`, `failures.json`,
czasami faz, JSON-em planu harmonogramu oraz poleceniami ponownego uruchomienia. Do ukierunkowanego odzyskiwania
użyj `docker_lanes=<lane[,lane]>` w wielokrotnego użytku przepływie pracy live/E2E zamiast
ponownego uruchamiania wszystkich chunków wydania. Wygenerowane polecenia ponownego uruchomienia zawierają wcześniejsze
`package_artifact_run_id` oraz przygotowane wejścia obrazu Docker, gdy są dostępne, więc
nieudana ścieżka może ponownie użyć tego samego tarballa i obrazów GHCR.

### QA Lab

Maszyna QA Lab jest również częścią `OpenClaw Release Checks`. To bramka wydaniowa
zachowania agentowego i poziomu kanałów, oddzielona od mechaniki pakietów Vitest i Docker.

Pokrycie QA Lab wydania obejmuje:

- bramkę mock parity porównującą ścieżkę kandydata OpenAI z bazą Opus 4.6
  przy użyciu agentic parity pack
- szybki profil QA live Matrix przy użyciu środowiska `qa-live-shared`
- ścieżkę QA live Telegram przy użyciu dzierżaw poświadczeń Convex CI
- `pnpm qa:otel:smoke`, gdy telemetria wydania wymaga wyraźnego lokalnego dowodu

Użyj tej maszyny, aby odpowiedzieć: „czy wydanie zachowuje się poprawnie w scenariuszach QA i
przepływach kanałów live?”. Zachowaj URL-e artefaktów dla ścieżek parity, Matrix i Telegram
podczas zatwierdzania wydania. Pełne pokrycie Matrix pozostaje dostępne jako
ręczne shardowane uruchomienie QA-Lab zamiast domyślnej ścieżki krytycznej dla wydania.

### Package

Maszyna Package jest bramką instalowalnego produktu. Jest oparta na
`Package Acceptance` oraz resolverze
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver normalizuje
kandydata do tarballa `package-under-test` używanego przez Docker E2E, waliduje
inwentarz pakietu, zapisuje wersję pakietu i SHA-256 oraz utrzymuje
ref harnessu przepływu pracy oddzielnie od refa źródła pakietu.

Obsługiwane źródła kandydatów:

- `source=npm`: `openclaw@beta`, `openclaw@latest` albo dokładna wersja wydania OpenClaw
- `source=ref`: spakuj zaufaną gałąź `package_ref`, tag albo pełny SHA commita
  z wybranym harnessem `workflow_ref`
- `source=url`: pobierz HTTPS `.tgz` z wymaganym `package_sha256`
- `source=artifact`: użyj ponownie `.tgz` przesłanego przez inne uruchomienie GitHub Actions

`OpenClaw Release Checks` uruchamia Package Acceptance z `source=artifact`,
przygotowanym artefaktem pakietu wydania, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=release-history`,
`published_upgrade_survivor_scenarios=reported-issues` oraz
`telegram_mode=mock-openai`. Package Acceptance utrzymuje migrację, aktualizację, czyszczenie przestarzałych
zależności plugin, offline fixtures plugin, aktualizację plugin oraz QA pakietu Telegram
względem tego samego rozwiązanego tarballa. Jest to natywny dla GitHuba
zamiennik większości pokrycia pakietu/aktualizacji, które wcześniej wymagało
Parallels. Cross-OS release checks nadal mają znaczenie dla specyficznego dla systemu operacyjnego onboardingu,
instalatora i zachowania platformy, ale walidacja produktu pakietu/aktualizacji powinna
preferować Package Acceptance.

Kanoniczna lista kontrolna dla walidacji aktualizacji i plugin to
[Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins). Używaj jej podczas
decydowania, która lokalna, Docker, Package Acceptance albo release-check ścieżka dowodzi
instalacji/aktualizacji plugin, czyszczenia doctor albo zmiany migracji opublikowanego pakietu.
Wyczerpująca migracja opublikowanych aktualizacji z każdego stabilnego pakietu `2026.4.23+` jest
osobnym ręcznym przepływem pracy `Update Migration`, a nie częścią Full Release CI.

Łagodność legacy package-acceptance jest celowo ograniczona czasowo. Pakiety do
`2026.4.25` mogą używać ścieżki zgodności dla luk metadanych już opublikowanych
w npm: prywatnych wpisów inwentarza QA brakujących w tarballu, brakującego
`gateway install --wrapper`, brakujących plików patch w fixture git pochodzącej z tarballa,
brakującego utrwalonego `update.channel`, starszych lokalizacji rekordów instalacji plugin,
brakującego utrwalania rekordów instalacji marketplace oraz migracji metadanych konfiguracji
podczas `plugins update`. Opublikowany pakiet `2026.4.26` może ostrzegać
o plikach znaczników metadanych lokalnego builda, które zostały już wydane. Późniejsze pakiety
muszą spełniać nowoczesne kontrakty pakietów; te same luki powodują niepowodzenie walidacji
wydania.

Używaj szerszych profili Package Acceptance, gdy pytanie wydaniowe dotyczy
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

- `smoke`: szybkie ścieżki instalacji pakietu/kanału/agenta, sieci gateway i przeładowania
  konfiguracji
- `package`: kontrakty pakietów instalacji/aktualizacji/plugin bez live ClawHub; to jest domyślne
  release-check
- `product`: `package` plus kanały MCP, czyszczenie cron/subagent, wyszukiwanie web OpenAI
  i OpenWebUI
- `full`: chunki Docker ścieżki wydania z OpenWebUI
- `custom`: dokładna lista `docker_lanes` do ukierunkowanych ponownych uruchomień

Aby zweryfikować kandydata pakietu Telegram, włącz `telegram_mode=mock-openai` lub
`telegram_mode=live-frontier` w Package Acceptance. Workflow przekazuje
rozwiązany tarball `package-under-test` do ścieżki Telegram; samodzielny
workflow Telegram nadal akceptuje opublikowaną specyfikację npm na potrzeby kontroli po publikacji.

## Automatyzacja publikacji wydania

`OpenClaw Release Publish` to standardowy mutujący punkt wejścia publikacji. 
Orkiestruje workflow zaufanego wydawcy w kolejności wymaganej przez wydanie:

1. Pobierz tag wydania i rozwiąż jego commit SHA.
2. Sprawdź, czy tag jest osiągalny z `main` lub `release/*`.
3. Uruchom `pnpm plugins:sync:check`.
4. Wywołaj `Plugin NPM Release` z `publish_scope=all-publishable` i
   `ref=<release-sha>`.
5. Wywołaj `Plugin ClawHub Release` z tym samym zakresem i SHA.
6. Wywołaj `OpenClaw NPM Release` z tagiem wydania, dist-tag npm oraz
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
tylko do ukierunkowanych napraw lub ponownych publikacji. W przypadku naprawy wybranego pluginu przekaż
`plugin_publish_scope=selected` i `plugins=@openclaw/name` do
`OpenClaw Release Publish` albo wywołaj workflow potomny bezpośrednio, gdy
pakiet OpenClaw nie może zostać opublikowany.

## Dane wejściowe workflow NPM

`OpenClaw NPM Release` akceptuje te dane wejściowe kontrolowane przez operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1` lub
  `v2026.4.2-beta.1`; gdy `preflight_only=true`, może to być także aktualny
  pełny 40-znakowy commit SHA gałęzi workflow dla preflightu wyłącznie walidacyjnego
- `preflight_only`: `true` tylko dla walidacji/kompilacji/pakietu, `false` dla
  rzeczywistej ścieżki publikacji
- `preflight_run_id`: wymagany na rzeczywistej ścieżce publikacji, aby workflow ponownie użył
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

- `ref`: gałąź, tag lub pełny commit SHA do walidacji. Kontrole wymagające sekretów
  wymagają, aby rozwiązany commit był osiągalny z gałęzi OpenClaw lub
  tagu wydania.

Reguły:

- Tagi stabilne i korekcyjne mogą być publikowane do `beta` albo `latest`
- Tagi wydań wstępnych beta mogą być publikowane tylko do `beta`
- W przypadku `OpenClaw NPM Release` wejście z pełnym commit SHA jest dozwolone tylko wtedy, gdy
  `preflight_only=true`
- `OpenClaw Release Checks` i `Full Release Validation` są zawsze
  wyłącznie walidacyjne
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, którego użyto podczas preflightu;
  workflow weryfikuje te metadane przed kontynuacją publikacji

## Sekwencja stabilnego wydania npm

Podczas przygotowywania stabilnego wydania npm:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`
   - Zanim tag istnieje, możesz użyć aktualnego pełnego commit SHA gałęzi workflow
     do wyłącznie walidacyjnego suchego przebiegu workflow preflight
2. Wybierz `npm_dist_tag=beta` dla normalnego przepływu najpierw-beta albo `latest` tylko
   wtedy, gdy celowo chcesz bezpośrednio opublikować wydanie stabilne
3. Uruchom `Full Release Validation` na gałęzi wydania, tagu wydania lub pełnym
   commit SHA, gdy chcesz uzyskać normalne CI oraz pokrycie live prompt cache, Docker, QA Lab,
   Matrix i Telegram z jednego ręcznego workflow
4. Jeśli celowo potrzebujesz tylko deterministycznego normalnego grafu testów, uruchom
   ręczny workflow `CI` na ref wydania zamiast tego
5. Zapisz udany `preflight_run_id`
6. Uruchom `OpenClaw Release Publish` z tym samym `tag`, tym samym `npm_dist_tag`
   i zapisanym `preflight_run_id`; publikuje zewnętrzne pluginy do npm
   i ClawHub przed promocją pakietu npm OpenClaw
7. Jeśli wydanie trafiło na `beta`, użyj prywatnego workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   aby promować tę stabilną wersję z `beta` do `latest`
8. Jeśli wydanie celowo opublikowano bezpośrednio do `latest`, a `beta`
   powinna natychmiast wskazywać tę samą stabilną kompilację, użyj tego samego prywatnego
   workflow, aby skierować oba dist-tags na stabilną wersję, albo pozwól, aby jego zaplanowana
   samonaprawiająca synchronizacja przeniosła `beta` później

Mutacja dist-tag znajduje się w prywatnym repozytorium ze względów bezpieczeństwa, ponieważ nadal
wymaga `NPM_TOKEN`, podczas gdy publiczne repozytorium zachowuje publikację wyłącznie przez OIDC.

Dzięki temu zarówno bezpośrednia ścieżka publikacji, jak i ścieżka promocji najpierw-beta
są udokumentowane i widoczne dla operatora.

Jeśli maintainer musi awaryjnie użyć lokalnego uwierzytelniania npm, uruchamiaj wszelkie polecenia 1Password
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

Maintainerzy używają prywatnej dokumentacji wydań w
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
jako właściwego runbooka.

## Powiązane

- [Kanały wydań](/pl/install/development-channels)
