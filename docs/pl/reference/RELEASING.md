---
read_when:
    - Wyszukiwanie definicji publicznych kanałów wydań
    - Uruchamianie walidacji wydania lub akceptacji pakietu
    - Szukasz informacji o nazewnictwie wersji i rytmie wydań
summary: Ścieżki wydań, lista kontrolna operatora, środowiska walidacyjne, nazewnictwo wersji i harmonogram
title: Polityka wydań
x-i18n:
    generated_at: "2026-05-05T06:18:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9980265c30c6a6571db5512749ec173cca79ac70494fd09968add793be9717a5
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ma trzy publiczne ścieżki wydań:

- stable: wydania oznaczone tagami, które domyślnie publikują do npm `beta`, albo do npm `latest`, gdy zostanie to wyraźnie zażądane
- beta: tagi przedwydań publikowane do npm `beta`
- dev: ruchoma głowica gałęzi `main`

## Nazewnictwo wersji

- Wersja wydania stabilnego: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Wersja wydania poprawkowego stabilnego: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Wersja przedwydania beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Nie dodawaj zer wiodących do miesiąca ani dnia
- `latest` oznacza aktualnie promowane stabilne wydanie npm
- `beta` oznacza aktualny docelowy pakiet instalacyjny beta
- Wydania stabilne i poprawkowe stabilne domyślnie publikują do npm `beta`; operatorzy wydania mogą jawnie wskazać `latest` albo później wypromować zweryfikowaną kompilację beta
- Każde stabilne wydanie OpenClaw dostarcza razem pakiet npm i aplikację macOS;
  wydania beta zwykle najpierw walidują i publikują ścieżkę npm/pakietu, a
  kompilacja/podpisywanie/notaryzacja aplikacji mac jest zarezerwowana dla wydań stabilnych, chyba że wyraźnie zażądano inaczej

## Rytm wydań

- Wydania przechodzą najpierw przez beta
- Stabilne wydanie następuje dopiero po zweryfikowaniu najnowszej bety
- Maintainerzy zwykle przygotowują wydania z gałęzi `release/YYYY.M.D` utworzonej
  z bieżącej `main`, aby walidacja wydania i poprawki nie blokowały nowego
  rozwoju na `main`
- Jeśli tag beta został wypchnięty lub opublikowany i wymaga poprawki, maintainerzy tworzą
  następny tag `-beta.N` zamiast usuwać albo odtwarzać stary tag beta
- Szczegółowa procedura wydania, zatwierdzenia, poświadczenia i notatki odzyskiwania są
  dostępne tylko dla maintainerów

## Lista kontrolna operatora wydania

Ta lista kontrolna pokazuje publiczny kształt procesu wydania. Prywatne poświadczenia,
podpisywanie, notaryzacja, odzyskiwanie dist-tagów i szczegóły awaryjnego wycofania pozostają w
runbooku wydania dostępnym tylko dla maintainerów.

1. Zacznij od bieżącej `main`: pobierz najnowsze zmiany, potwierdź, że docelowy commit został wypchnięty,
   i potwierdź, że bieżące CI `main` jest wystarczająco zielone, aby utworzyć z niego gałąź.
2. Przepisz górną sekcję `CHANGELOG.md` na podstawie rzeczywistej historii commitów za pomocą
   `/changelog`, utrzymuj wpisy jako skierowane do użytkowników, zatwierdź je, wypchnij i wykonaj jeszcze raz rebase/pull
   przed utworzeniem gałęzi.
3. Przejrzyj rekordy zgodności wydania w
   `src/plugins/compat/registry.ts` i
   `src/commands/doctor/shared/deprecation-compat.ts`. Usuwaj wygasłą
   zgodność tylko wtedy, gdy ścieżka aktualizacji pozostaje objęta ochroną, albo zapisz, dlaczego jest
   celowo utrzymywana.
4. Utwórz `release/YYYY.M.D` z bieżącej `main`; nie wykonuj normalnej pracy wydaniowej
   bezpośrednio na `main`.
5. Podbij wszystkie wymagane lokalizacje wersji dla zamierzonego tagu, uruchom
   `pnpm plugins:sync`, aby publikowalne pakiety Plugin miały wspólną wersję wydania
   i metadane zgodności, a następnie uruchom lokalną deterministyczną weryfikację wstępną:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` oraz
   `pnpm release:check`.
6. Uruchom `OpenClaw NPM Release` z `preflight_only=true`. Zanim tag istnieje,
   pełny 40-znakowy SHA gałęzi wydania jest dozwolony tylko do walidacji
   wstępnej. Zapisz udany `preflight_run_id`.
7. Uruchom wszystkie testy przedwydaniowe przez `Full Release Validation` dla
   gałęzi wydania, tagu albo pełnego SHA commitu. To jest jedyny ręczny punkt wejścia
   dla czterech dużych skrzynek testowych wydania: Vitest, Docker, QA Lab i Package.
8. Jeśli walidacja się nie powiedzie, napraw problem na gałęzi wydania i ponownie uruchom najmniejszy nieudany
   plik, ścieżkę, zadanie workflow, profil pakietu, dostawcę albo allowlistę modeli, które
   potwierdzają poprawkę. Ponownie uruchamiaj pełną parasolową walidację tylko wtedy, gdy zmieniony obszar sprawia,
   że wcześniejsze dowody są nieaktualne.
9. Dla beta oznacz tagiem `vYYYY.M.D-beta.N`, a następnie uruchom `OpenClaw Release Publish` z
   pasującej gałęzi `release/YYYY.M.D`. Sprawdza `pnpm plugins:sync:check`,
   najpierw publikuje wszystkie publikowalne pakiety Plugin do npm, następnie publikuje ten sam
   zestaw do ClawHub jako tarballe ClawPack npm-pack, a potem promuje
   przygotowany artefakt wstępny OpenClaw npm z pasującym dist-tagiem. Po
   publikacji uruchom akceptację pakietu po publikacji
   względem opublikowanego pakietu `openclaw@YYYY.M.D-beta.N` albo
   `openclaw@beta`. Jeśli wypchnięte lub opublikowane przedwydanie wymaga poprawki,
   utwórz następny pasujący numer przedwydania; nie usuwaj ani nie przepisuj starego
   przedwydania.
10. Dla wydania stabilnego kontynuuj dopiero po tym, jak zweryfikowana beta lub kandydat do wydania ma
    wymagane dowody walidacji. Stabilna publikacja npm również przechodzi przez
    `OpenClaw Release Publish`, ponownie używając udanego artefaktu wstępnego przez
    `preflight_run_id`; gotowość stabilnego wydania macOS wymaga także
    spakowanych `.zip`, `.dmg`, `.dSYM.zip` oraz zaktualizowanego `appcast.xml` na `main`.
11. Po publikacji uruchom weryfikator npm po publikacji, opcjonalny samodzielny
    opublikowany-npm Telegram E2E, gdy potrzebujesz dowodu kanału po publikacji,
    promocję dist-tagu, gdy jest potrzebna, notatki wydania/przedwydania GitHub z
    pełnej pasującej sekcji `CHANGELOG.md` oraz kroki ogłoszenia
    wydania.

## Weryfikacja wstępna wydania

- Uruchom `pnpm check:test-types` przed kontrolą wstępną wydania, aby testowy TypeScript pozostawał objęty sprawdzeniem poza szybszą lokalną bramką `pnpm check`
- Uruchom `pnpm check:architecture` przed kontrolą wstępną wydania, aby szersze sprawdzenia cykli importów i granic architektury były zielone poza szybszą lokalną bramką
- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane artefakty wydania `dist/*` i pakiet Control UI istniały na potrzeby kroku walidacji paczki
- Uruchom `pnpm plugins:sync` po podbiciu wersji głównej i przed tagowaniem. Aktualizuje wersje publikowalnych pakietów plugin, metadane zgodności peer/API OpenClaw, metadane kompilacji oraz szkice changelogów pluginów tak, aby odpowiadały wersji wydania rdzenia. `pnpm plugins:sync:check` to niemutująca osłona wydania; przepływ publikowania kończy się niepowodzeniem przed jakąkolwiek mutacją rejestru, jeśli ten krok został pominięty.
- Uruchom ręczny przepływ `Full Release Validation` przed zatwierdzeniem wydania, aby z jednego punktu wejścia uruchomić wszystkie przedwydaniowe testboxy. Przyjmuje gałąź, tag albo pełny SHA commita, wywołuje ręczny `CI` i wywołuje `OpenClaw Release Checks` dla smoke testu instalacji, akceptacji pakietu, międzyplatformowych sprawdzeń pakietu, parytetu QA Lab, torów Matrix i Telegram. Stabilne/domyślne uruchomienia trzymają wyczerpujące live/E2E oraz soak ścieżki wydania Docker za `run_release_soak=true`; `release_profile=full` wymusza soak. Z `release_profile=full` i `rerun_group=all` uruchamia też pakietowe E2E Telegram względem artefaktu `release-package-under-test` z kontroli wydania. Podaj `npm_telegram_package_spec` po publikacji, gdy to samo E2E Telegram ma również potwierdzić opublikowany pakiet npm. Podaj `package_acceptance_package_spec` po publikacji, gdy Package Acceptance ma uruchomić swoją macierz pakietu/aktualizacji względem wysłanego pakietu npm zamiast artefaktu zbudowanego z SHA. Podaj `evidence_package_spec`, gdy prywatny raport dowodowy ma potwierdzić, że walidacja odpowiada opublikowanemu pakietowi npm bez wymuszania E2E Telegram. Przykład:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Uruchom ręczny przepływ `Package Acceptance`, gdy chcesz uzyskać dowód kanałem bocznym dla kandydata pakietu, podczas gdy prace nad wydaniem trwają dalej. Użyj `source=npm` dla `openclaw@beta`, `openclaw@latest` albo dokładnej wersji wydania; `source=ref`, aby spakować zaufaną gałąź/tag/SHA `package_ref` z bieżącą uprzężą `workflow_ref`; `source=url` dla archiwum tarball HTTPS z wymaganym SHA-256; albo `source=artifact` dla archiwum tarball przesłanego przez inne uruchomienie GitHub Actions. Przepływ rozwiązuje kandydata do `package-under-test`, ponownie używa harmonogramu wydania Docker E2E względem tego archiwum tarball i może uruchomić QA Telegram względem tego samego archiwum tarball z `telegram_mode=mock-openai` albo `telegram_mode=live-frontier`. Gdy wybrane tory Docker obejmują `published-upgrade-survivor`, artefakt pakietu jest kandydatem, a `published_upgrade_survivor_baseline` wybiera opublikowaną bazę. `update-restart-auth` używa pakietu kandydata zarówno jako zainstalowanego CLI, jak i package-under-test, dzięki czemu ćwiczy zarządzaną ścieżkę restartu polecenia aktualizacji kandydata.
  Przykład: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Typowe profile:
  - `smoke`: tory instalacji/kanału/agenta, sieci Gateway i przeładowania konfiguracji
  - `package`: natywne dla artefaktu tory pakietu/aktualizacji/restartu/pluginów bez OpenWebUI ani live ClawHub
  - `product`: profil pakietu plus kanały MCP, czyszczenie cron/subagentów, wyszukiwanie internetowe OpenAI i OpenWebUI
  - `full`: fragmenty ścieżki wydania Docker z OpenWebUI
  - `custom`: dokładny wybór `docker_lanes` dla ukierunkowanego ponownego uruchomienia
- Uruchom ręczny przepływ `CI` bezpośrednio, gdy potrzebujesz tylko pełnego zwykłego pokrycia CI dla kandydata wydania. Ręczne wywołania CI omijają ograniczanie do zmienionego zakresu i wymuszają shardy Linux Node, shardy wbudowanych pluginów, kontrakty kanałów, zgodność Node 22, `check`, `check-additional`, smoke test kompilacji, sprawdzenia dokumentacji, Python skills, Windows, macOS, Android oraz tory i18n Control UI.
  Przykład: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Uruchom `pnpm qa:otel:smoke` podczas walidacji telemetrii wydania. Ćwiczy QA-lab przez lokalny odbiornik OTLP/HTTP i weryfikuje wyeksportowane nazwy spanów śladu, ograniczone atrybuty oraz redakcję treści/identyfikatorów bez wymagania Opik, Langfuse ani innego zewnętrznego kolektora.
- Uruchom `pnpm release:check` przed każdym tagowanym wydaniem
- Uruchom `OpenClaw Release Publish` dla mutującej sekwencji publikowania po utworzeniu taga. Wywołaj go z `release/YYYY.M.D` (albo `main`, gdy publikujesz tag osiągalny z main), przekaż tag wydania i udane OpenClaw npm `preflight_run_id`, a domyślny zakres publikowania pluginów `all-publishable` zachowaj, chyba że celowo uruchamiasz ukierunkowaną naprawę. Przepływ serializuje publikację npm pluginów, publikację pluginów ClawHub i publikację npm OpenClaw, aby pakiet rdzenia nie został opublikowany przed swoimi zewnętrznymi pluginami.
- Kontrole wydania działają teraz w osobnym ręcznym przepływie:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` uruchamia także tor parytetu mock QA Lab oraz szybki profil live Matrix i tor QA Telegram przed zatwierdzeniem wydania. Tory live używają środowiska `qa-live-shared`; Telegram używa też dzierżaw poświadczeń Convex CI. Uruchom ręczny przepływ `QA-Lab - All Lanes` z `matrix_profile=all` i `matrix_shards=true`, gdy chcesz pełny inwentarz transportu Matrix, multimediów i E2EE równolegle.
- Międzyplatformowa walidacja runtime instalacji i aktualizacji jest częścią publicznych `OpenClaw Release Checks` i `Full Release Validation`, które bezpośrednio wywołują przepływ wielokrotnego użytku `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Ten podział jest celowy: utrzymuje prawdziwą ścieżkę wydania npm krótką, deterministyczną i skoncentrowaną na artefaktach, podczas gdy wolniejsze kontrole live pozostają we własnym torze, aby nie wstrzymywały ani nie blokowały publikacji
- Kontrole wydania zawierające sekrety powinny być wywoływane przez `Full Release Validation` albo z referencji przepływu `main`/release, aby logika przepływu i sekrety pozostały kontrolowane
- `OpenClaw Release Checks` przyjmuje gałąź, tag albo pełny SHA commita, o ile rozwiązany commit jest osiągalny z gałęzi OpenClaw albo taga wydania
- Wstępna kontrola tylko walidacyjna `OpenClaw NPM Release` akceptuje też bieżący pełny 40-znakowy SHA commita gałęzi przepływu bez wymagania wypchniętego taga
- Ta ścieżka SHA służy tylko do walidacji i nie może zostać wypromowana do prawdziwej publikacji
- W trybie SHA przepływ syntetyzuje `v<package.json version>` tylko na potrzeby sprawdzenia metadanych pakietu; prawdziwa publikacja nadal wymaga prawdziwego taga wydania
- Oba przepływy utrzymują prawdziwą ścieżkę publikacji i promocji na runnerach hostowanych przez GitHub, podczas gdy niemutująca ścieżka walidacji może używać większych runnerów Blacksmith Linux
- Ten przepływ uruchamia `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`, używając sekretów przepływu `OPENAI_API_KEY` i `ANTHROPIC_API_KEY`
- Wstępna kontrola wydania npm nie czeka już na osobny tor kontroli wydania
- Uruchom `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` (albo pasujący tag beta/poprawki) przed zatwierdzeniem
- Po publikacji npm uruchom `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D` (albo pasującą wersję beta/poprawki), aby zweryfikować ścieżkę instalacji z opublikowanego rejestru w świeżym prefiksie tymczasowym
- Po publikacji beta uruchom `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`, aby zweryfikować onboarding zainstalowanego pakietu, konfigurację Telegram i prawdziwe E2E Telegram względem opublikowanego pakietu npm przy użyciu współdzielonej puli dzierżawionych poświadczeń Telegram. Lokalne jednorazowe uruchomienia maintainerów mogą pominąć zmienne Convex i przekazać trzy poświadczenia env `OPENCLAW_QA_TELEGRAM_*` bezpośrednio.
- Aby uruchomić pełny postpublikacyjny smoke test beta z maszyny maintainera, użyj `pnpm release:beta-smoke -- --beta betaN`. Helper uruchamia walidację aktualizacji npm Parallels/świeżego celu, wywołuje `NPM Telegram Beta E2E`, odpytuje dokładne uruchomienie przepływu, pobiera artefakt i wypisuje raport Telegram.
- Maintainerzy mogą uruchomić tę samą postpublikacyjną kontrolę z GitHub Actions przez ręczny przepływ `NPM Telegram Beta E2E`. Jest celowo tylko ręczny i nie działa przy każdym scaleniu.
- Automatyzacja wydań maintainerów używa teraz schematu preflight-then-promote:
  - prawdziwa publikacja npm musi przejść udane npm `preflight_run_id`
  - prawdziwa publikacja npm musi być wywołana z tej samej gałęzi `main` albo `release/YYYY.M.D`, co udane uruchomienie wstępnej kontroli
  - stabilne wydania npm domyślnie celują w `beta`
  - stabilna publikacja npm może jawnie celować w `latest` przez wejście przepływu
  - mutacja dist-tag npm oparta na tokenie znajduje się teraz w `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` ze względów bezpieczeństwa, ponieważ `npm dist-tag add` nadal wymaga `NPM_TOKEN`, podczas gdy publiczne repo zachowuje publikację wyłącznie przez OIDC
  - publiczny `macOS Release` służy tylko do walidacji; gdy tag istnieje wyłącznie na gałęzi wydania, ale przepływ jest wywoływany z `main`, ustaw `public_release_branch=release/YYYY.M.D`
  - prawdziwa prywatna publikacja Mac musi przejść udane prywatne mac `preflight_run_id` i `validate_run_id`
  - prawdziwe ścieżki publikacji promują przygotowane artefakty zamiast budować je ponownie
- Dla stabilnych wydań poprawkowych takich jak `YYYY.M.D-N` weryfikator postpublikacyjny sprawdza także tę samą ścieżkę aktualizacji z prefiksu tymczasowego z `YYYY.M.D` do `YYYY.M.D-N`, aby poprawki wydania nie mogły po cichu zostawić starszych globalnych instalacji na bazowym stabilnym ładunku
- Wstępna kontrola wydania npm kończy się niepowodzeniem domyślnie, chyba że archiwum tarball zawiera zarówno `dist/control-ui/index.html`, jak i niepusty ładunek `dist/control-ui/assets/`, abyśmy ponownie nie wysłali pustego panelu przeglądarkowego
- Weryfikacja postpublikacyjna sprawdza również, czy opublikowane punkty wejścia pluginów i metadane pakietu są obecne w zainstalowanym układzie rejestru. Wydanie, które wysyła brakujące ładunki runtime pluginów, nie przechodzi weryfikatora postpublish i nie może zostać wypromowane do `latest`.
- `pnpm test:install:smoke` egzekwuje też budżet `unpackedSize` paczki npm względem kandydującego archiwum tarball aktualizacji, więc e2e instalatora wykrywa przypadkowe nadmuchanie paczki przed ścieżką publikacji wydania
- Jeśli prace nad wydaniem dotknęły planowania CI, manifestów czasu rozszerzeń albo macierzy testów rozszerzeń, przed zatwierdzeniem wygeneruj ponownie i przejrzyj wyjścia macierzy `plugin-prerelease-extension-shard` zarządzanej przez planner z `.github/workflows/plugin-prerelease.yml`, aby informacje o wydaniu nie opisywały przestarzałego układu CI
- Gotowość stabilnego wydania macOS obejmuje też powierzchnie aktualizatora:
  - wydanie GitHub musi ostatecznie zawierać spakowane `.zip`, `.dmg` i `.dSYM.zip`
  - `appcast.xml` na `main` musi po publikacji wskazywać nowy stabilny zip
  - spakowana aplikacja musi zachować niedebugowy identyfikator pakietu, niepusty URL kanału Sparkle i `CFBundleVersion` co najmniej równy kanonicznemu minimalnemu numerowi kompilacji Sparkle dla tej wersji wydania

## Testboxy wydania

`Full Release Validation` to sposób, w jaki operatorzy uruchamiają wszystkie testy przedwydaniowe z jednego punktu wejścia. Aby uzyskać dowód przypiętego commita na szybko zmieniającej się gałęzi, użyj helpera, aby każdy przepływ potomny działał z gałęzi tymczasowej przypiętej do docelowego SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper wypycha `release-ci/<sha>-...`, wywołuje `Full Release Validation` z tej gałęzi z `ref=<sha>`, weryfikuje, że każdy `headSha` przepływu potomnego odpowiada celowi, a następnie usuwa gałąź tymczasową. Pozwala to uniknąć przypadkowego potwierdzenia nowszego uruchomienia potomnego z `main`.

Dla walidacji gałęzi wydania albo taga uruchom go z zaufanej referencji przepływu `main` i przekaż gałąź wydania albo tag jako `ref`:

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
nadrzędny artefakt `release-package-under-test` dla kontroli dotyczących pakietu
oraz uruchamia samodzielne pakietowe Telegram E2E, gdy `release_profile=full` z
`rerun_group=all` albo gdy ustawiono `npm_telegram_package_spec`. Następnie
`OpenClaw Release Checks` rozgałęzia się na install smoke, międzyplatformowe
kontrole wydania, pokrycie ścieżki wydania live/E2E Docker, gdy soak jest
włączony, Package Acceptance z Telegram package QA, parytet QA Lab, live Matrix
i live Telegram. Pełne uruchomienie jest akceptowalne tylko wtedy, gdy
podsumowanie `Full Release Validation`
pokazuje `normal_ci` i `release_checks` jako zakończone sukcesem. W trybie full/all
dziecko `npm_telegram` także musi zakończyć się sukcesem; poza full/all jest
pomijane, chyba że podano opublikowane `npm_telegram_package_spec`. Końcowe
podsumowanie weryfikatora zawiera tabele najwolniejszych zadań dla każdego
uruchomienia potomnego, dzięki czemu menedżer wydania może zobaczyć bieżącą
ścieżkę krytyczną bez pobierania logów.
Zobacz [pełną walidację wydania](/pl/reference/full-release-validation), aby poznać
pełną macierz etapów, dokładne nazwy zadań workflow, różnice między profilami
stable i full, artefakty oraz uchwyty ukierunkowanych ponownych uruchomień.
Workflow potomne są uruchamiane z zaufanego ref, który uruchamia `Full Release
Validation`, zwykle `--ref main`, nawet gdy docelowy `ref` wskazuje na starszą
gałąź wydania lub tag. Nie ma osobnego wejścia workflow-ref dla Full Release
Validation; wybierz zaufany harness, wybierając ref uruchomienia workflow.
Nie używaj `--ref main -f ref=<sha>` do dowodu dokładnego commita na ruchomym `main`;
surowe SHA commitów nie mogą być refami uruchomienia workflow, więc użyj
`pnpm ci:full-release --sha <sha>`, aby utworzyć przypiętą tymczasową gałąź.

Użyj `release_profile`, aby wybrać zakres live/dostawcy:

- `minimum`: najszybsza krytyczna dla wydania ścieżka live OpenAI/core i Docker
- `stable`: minimum plus stabilne pokrycie dostawców/backendów do zatwierdzenia wydania
- `full`: stable plus szerokie doradcze pokrycie dostawców/mediów

Użyj `run_release_soak=true` ze `stable`, gdy blokujące wydanie lane'y są
zielone i chcesz wykonać wyczerpujący live/E2E, ścieżkę wydania Docker oraz
ograniczony przegląd upgrade-survivor opublikowanych pakietów przed promocją.
Ten przegląd obejmuje najnowsze cztery stabilne pakiety oraz przypięte
bazowe wersje `2026.4.23` i `2026.5.2`, a także starsze pokrycie `2026.4.15`,
z usunięciem zduplikowanych baz i podziałem każdej bazy na osobne zadanie
runnera Docker. `full` implikuje `run_release_soak=true`.

`OpenClaw Release Checks` używa zaufanego ref workflow, aby jednorazowo rozwiązać
docelowy ref jako `release-package-under-test` i ponownie używa tego artefaktu w
kontrolach międzyplatformowych, Package Acceptance oraz kontrolach Docker ścieżki
wydania, gdy działa soak. Dzięki temu wszystkie maszyny dotyczące pakietu używają
tych samych bajtów i unikają wielokrotnych buildów pakietu. Międzyplatformowy
OpenAI install smoke używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy zmienna
repozytorium/organizacji jest ustawiona, w przeciwnym razie `openai/gpt-5.4`,
ponieważ ten lane sprawdza instalację pakietu, onboarding, uruchomienie Gateway
i jedną turę live agenta, a nie benchmarkuje najwolniejszy model domyślny.
Szersza macierz dostawców live pozostaje miejscem dla pokrycia specyficznego dla
modelu.

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
ukierunkowanej poprawce. Jeśli jedna maszyna zawiedzie, użyj nieudanego workflow
potomnego, zadania, lane'u Docker, profilu pakietu, dostawcy modelu lub lane'u QA
jako kolejnego dowodu. Uruchom pełny parasol ponownie tylko wtedy, gdy poprawka
zmieniła współdzieloną orkiestrację wydania albo sprawiła, że wcześniejszy dowód
ze wszystkich maszyn stał się nieaktualny. Końcowy weryfikator parasola ponownie
sprawdza zapisane identyfikatory uruchomień workflow potomnych, więc po udanym
ponownym uruchomieniu workflow potomnego uruchom ponownie tylko nieudane zadanie
nadrzędne `Verify full validation`.

Dla ograniczonego odzyskiwania przekaż `rerun_group` do parasola. `all` to
rzeczywiste uruchomienie kandydata wydania, `ci` uruchamia tylko normalne dziecko
CI, `plugin-prerelease` uruchamia tylko dziecko pluginów wyłącznie dla wydania,
`release-checks` uruchamia każdą maszynę wydania, a węższe grupy wydania to
`install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`
i `npm-telegram`. Ukierunkowane ponowne uruchomienia `npm-telegram` wymagają
`npm_telegram_package_spec`; uruchomienia full/all z `release_profile=full`
używają artefaktu pakietu z release-checks. Ukierunkowane ponowne uruchomienia
cross-OS mogą dodać `cross_os_suite_filter=windows/packaged-upgrade` albo inny
filtr OS/zestawu. Niepowodzenia QA release-check są doradcze; awaria tylko QA nie
blokuje walidacji wydania.

### Vitest

Maszyna Vitest to ręczny workflow potomny `CI`. Ręczne CI celowo omija
zakresowanie zmian i wymusza normalny graf testów dla kandydata wydania: shardy
Linux Node, shardy bundled-plugin, kontrakty kanałów, zgodność Node 22, `check`,
`check-additional`, build smoke, kontrole dokumentacji, Python skills, Windows,
macOS, Android i Control UI i18n.

Użyj tej maszyny, aby odpowiedzieć: „czy drzewo źródeł przeszło pełny normalny
zestaw testów?” To nie jest to samo co produktowa walidacja ścieżki wydania.
Dowody do zachowania:

- podsumowanie `Full Release Validation` pokazujące URL uruchomionego `CI`
- zielone uruchomienie `CI` na dokładnym docelowym SHA
- nazwy nieudanych lub wolnych shardów z zadań CI podczas badania regresji
- artefakty czasów Vitest, takie jak `.artifacts/vitest-shard-timings.json`, gdy
  uruchomienie wymaga analizy wydajności

Uruchom ręczne CI bezpośrednio tylko wtedy, gdy wydanie potrzebuje deterministycznego
normalnego CI, ale nie maszyn Docker, QA Lab, live, cross-OS ani pakietowych:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Maszyna Docker znajduje się w `OpenClaw Release Checks` przez
`openclaw-live-and-e2e-checks-reusable.yml` oraz workflow `install-smoke` w trybie
wydania. Waliduje kandydata wydania przez spakowane środowiska Docker, a nie
tylko testy na poziomie źródeł.

Pokrycie Docker wydania obejmuje:

- pełny install smoke z włączonym wolnym Bun global install smoke
- przygotowanie/ponowne użycie obrazu smoke root Dockerfile według docelowego SHA,
  z zadaniami QR, root/gateway i installer/Bun smoke działającymi jako osobne
  shardy install-smoke
- lane'y E2E repozytorium
- chunki Docker ścieżki wydania: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` i `plugins-runtime-install-h`
- pokrycie OpenWebUI w chunku `plugins-runtime-services`, gdy jest wymagane
- podzielone lane'y instalacji/odinstalowania bundled pluginów
  `bundled-plugin-install-uninstall-0` do
  `bundled-plugin-install-uninstall-23`
- zestawy dostawców live/E2E i pokrycie modeli live Docker, gdy kontrole wydania
  obejmują zestawy live

Użyj artefaktów Docker przed ponownym uruchamianiem. Harmonogram ścieżki wydania
przesyła `.artifacts/docker-tests/` z logami lane'ów, `summary.json`,
`failures.json`, czasami faz, JSON planu harmonogramu i poleceniami ponownego
uruchomienia. Dla ukierunkowanego odzyskiwania użyj
`docker_lanes=<lane[,lane]>` w wielokrotnego użytku workflow live/E2E zamiast
ponownie uruchamiać wszystkie chunki wydania. Wygenerowane polecenia ponownego
uruchomienia zawierają wcześniejsze `package_artifact_run_id` i przygotowane
wejścia obrazów Docker, gdy są dostępne, więc nieudany lane może ponownie użyć
tego samego tarballa i obrazów GHCR.

### QA Lab

Maszyna QA Lab także jest częścią `OpenClaw Release Checks`. Jest to bramka
wydania dla zachowania agentowego i poziomu kanałów, oddzielna od Vitest i
mechaniki pakietów Docker.

Pokrycie QA Lab wydania obejmuje:

- lane parytetu mock porównujący lane kandydata OpenAI z bazą Opus 4.6 przy użyciu
  agentowego pakietu parytetu
- szybki profil live Matrix QA używający środowiska `qa-live-shared`
- lane live Telegram QA używający dzierżaw poświadczeń Convex CI
- `pnpm qa:otel:smoke`, gdy telemetria wydania wymaga jawnego lokalnego dowodu

Użyj tej maszyny, aby odpowiedzieć: „czy wydanie zachowuje się poprawnie w
scenariuszach QA i przepływach kanałów live?” Zachowaj URL-e artefaktów dla lane'ów
parytetu, Matrix i Telegram podczas zatwierdzania wydania. Pełne pokrycie Matrix
pozostaje dostępne jako ręczne shardowane uruchomienie QA-Lab, a nie domyślny
lane krytyczny dla wydania.

### Package

Maszyna Package jest bramką instalowalnego produktu. Jest wspierana przez
`Package Acceptance` i resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver normalizuje kandydata
do tarballa `package-under-test` używanego przez Docker E2E, waliduje inwentarz
pakietu, zapisuje wersję pakietu i SHA-256 oraz utrzymuje ref harnessu workflow
oddzielnie od ref źródła pakietu.

Obsługiwane źródła kandydata:

- `source=npm`: `openclaw@beta`, `openclaw@latest` albo dokładna wersja wydania OpenClaw
- `source=ref`: spakuj zaufaną gałąź `package_ref`, tag albo pełny SHA commita
  z wybranym harnessem `workflow_ref`
- `source=url`: pobierz HTTPS `.tgz` z wymaganym `package_sha256`
- `source=artifact`: użyj ponownie `.tgz` przesłanego przez inne uruchomienie GitHub Actions

`OpenClaw Release Checks` uruchamia Package Acceptance z `source=artifact`,
przygotowanym artefaktem pakietu wydania, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance utrzymuje migrację, aktualizację,
restart po aktualizacji skonfigurowanego uwierzytelnienia, czyszczenie przestarzałych
zależności pluginów, offline fixtures pluginów, aktualizację pluginów i Telegram
package QA względem tego samego rozwiązanego tarballa. Blokujące kontrole wydania
używają domyślnej bazy najnowszego opublikowanego pakietu; `run_release_soak=true`
lub `release_profile=full` rozszerza to do każdego stabilnego bazowego pakietu
opublikowanego w npm od `2026.4.23` do `latest` plus fixtures zgłoszonych
problemów. Użyj Package Acceptance z `source=npm` dla już wydanego kandydata albo
`source=ref`/`source=artifact` dla lokalnego tarballa npm opartego na SHA przed
publikacją. Jest to natywny dla GitHub zamiennik większości pokrycia pakietu/
aktualizacji, które wcześniej wymagało Parallels. Międzyplatformowe kontrole
wydania nadal mają znaczenie dla onboardingu, instalatora i zachowania platformy
specyficznych dla OS, ale produktowa walidacja pakietu/aktualizacji powinna
preferować Package Acceptance.

Kanoniczna lista kontrolna dla walidacji aktualizacji i pluginów to
[Testowanie aktualizacji i pluginów](/pl/help/testing-updates-plugins). Użyj jej
przy decydowaniu, który lokalny lane, Docker, Package Acceptance albo release-check
dowodzi instalacji/aktualizacji pluginu, czyszczenia doctor albo zmiany migracji
opublikowanego pakietu. Wyczerpująca migracja opublikowanych aktualizacji z każdego
stabilnego pakietu `2026.4.23+` jest osobnym ręcznym workflow `Update Migration`,
a nie częścią Full Release CI.

Dotychczasowa pobłażliwość package-acceptance jest celowo ograniczona czasowo. Pakiety do
`2026.4.25` włącznie mogą używać ścieżki zgodności dla luk w metadanych już opublikowanych
w npm: prywatnych wpisów inwentarza QA brakujących w archiwum tarball, brakującego
`gateway install --wrapper`, brakujących plików poprawek w gitowym fixture pochodzącym
z archiwum tarball, brakującego utrwalonego `update.channel`, starszych lokalizacji
rekordów instalacji pluginów, brakującego utrwalania rekordów instalacji z marketplace
oraz migracji metadanych konfiguracji podczas `plugins update`. Opublikowany pakiet
`2026.4.26` może ostrzegać o lokalnych plikach znaczników metadanych kompilacji, które
zostały już wydane. Późniejsze pakiety muszą spełniać współczesne kontrakty pakietów;
te same luki powodują niepowodzenie walidacji wydania.

Używaj szerszych profili Package Acceptance, gdy pytanie o wydanie dotyczy
rzeczywistego pakietu możliwego do zainstalowania:

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
- `package`: kontrakty instalacji/aktualizacji/restartu/pakietu pluginu bez działającego
  ClawHub; to domyślny profil sprawdzania wydania
- `product`: `package` plus kanały MCP, czyszczenie cron/subagent, wyszukiwanie w sieci
  OpenAI i OpenWebUI
- `full`: fragmenty ścieżki wydania Docker z OpenWebUI
- `custom`: dokładna lista `docker_lanes` do ukierunkowanych ponownych uruchomień

Aby uzyskać dowód Telegram dla kandydata pakietu, włącz `telegram_mode=mock-openai` lub
`telegram_mode=live-frontier` w Package Acceptance. Workflow przekazuje rozwiązany
tarball `package-under-test` do ścieżki Telegram; samodzielny workflow Telegram nadal
akceptuje opublikowaną specyfikację npm do kontroli po publikacji.

## Automatyzacja publikacji wydania

`OpenClaw Release Publish` to normalny mutujący punkt wejścia publikacji. Orkiestruje
workflow zaufanego publikowania w kolejności wymaganej przez wydanie:

1. Pobiera tag wydania i ustala jego SHA commita.
2. Weryfikuje, że tag jest osiągalny z `main` lub `release/*`.
3. Uruchamia `pnpm plugins:sync:check`.
4. Uruchamia `Plugin NPM Release` z `publish_scope=all-publishable` i
   `ref=<release-sha>`.
5. Uruchamia `Plugin ClawHub Release` z tym samym zakresem i SHA.
6. Uruchamia `OpenClaw NPM Release` z tagiem wydania, npm dist-tag i
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

Stabilne promowanie bezpośrednio do `latest` jest jawne:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Używaj niskopoziomowych workflow `Plugin NPM Release` i `Plugin ClawHub Release`
tylko do ukierunkowanych napraw lub ponownych publikacji. Dla wybranej naprawy pluginu
przekaż `plugin_publish_scope=selected` i `plugins=@openclaw/name` do
`OpenClaw Release Publish` albo uruchom workflow podrzędny bezpośrednio, gdy
pakiet OpenClaw nie może zostać opublikowany.

## Dane wejściowe workflow NPM

`OpenClaw NPM Release` akceptuje te dane wejściowe kontrolowane przez operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1` lub
  `v2026.4.2-beta.1`; gdy `preflight_only=true`, może to być także bieżący
  pełny 40-znakowy SHA commita gałęzi workflow dla preflight wyłącznie walidacyjnego
- `preflight_only`: `true` tylko dla walidacji/kompilacji/pakietu, `false` dla
  rzeczywistej ścieżki publikacji
- `preflight_run_id`: wymagany w rzeczywistej ścieżce publikacji, aby workflow ponownie użył
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

- `ref`: gałąź, tag lub pełny SHA commita do walidacji. Kontrole wymagające sekretów
  wymagają, aby rozwiązany commit był osiągalny z gałęzi OpenClaw lub
  tagu wydania.
- `run_release_soak`: włącza wyczerpujące testy live/E2E, ścieżkę wydania Docker oraz
  soak wszystkich upgrade-survivor od początku dla stabilnych/domyślnych kontroli wydania.
  Jest wymuszane przez `release_profile=full`.

Zasady:

- Tagi stabilne i korygujące mogą być publikowane do `beta` albo `latest`
- Tagi prerelease beta mogą być publikowane tylko do `beta`
- Dla `OpenClaw NPM Release` pełny SHA commita jako dane wejściowe jest dozwolony tylko wtedy,
  gdy `preflight_only=true`
- `OpenClaw Release Checks` i `Full Release Validation` są zawsze
  wyłącznie walidacyjne
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, który został użyty podczas preflight;
  workflow weryfikuje te metadane przed kontynuowaniem publikacji

## Sekwencja stabilnego wydania npm

Podczas przygotowywania stabilnego wydania npm:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`
   - Zanim tag będzie istnieć, możesz użyć bieżącego pełnego SHA commita gałęzi workflow
     do walidacyjnego dry run workflow preflight
2. Wybierz `npm_dist_tag=beta` dla normalnego przepływu najpierw-do-beta albo `latest` tylko
   wtedy, gdy celowo chcesz bezpośredniej stabilnej publikacji
3. Uruchom `Full Release Validation` na gałęzi wydania, tagu wydania lub pełnym
   SHA commita, gdy chcesz uzyskać z jednego ręcznego workflow normalne CI oraz pokrycie
   live prompt cache, Docker, QA Lab, Matrix i Telegram
4. Jeśli celowo potrzebujesz tylko deterministycznego normalnego grafu testów, uruchom
   ręczny workflow `CI` na referencji wydania
5. Zapisz udany `preflight_run_id`
6. Uruchom `OpenClaw Release Publish` z tym samym `tag`, tym samym `npm_dist_tag`
   i zapisanym `preflight_run_id`; publikuje on zewnętrzne pluginy do npm
   i ClawHub przed promowaniem pakietu npm OpenClaw
7. Jeśli wydanie trafiło na `beta`, użyj prywatnego workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   aby promować tę stabilną wersję z `beta` do `latest`
8. Jeśli wydanie celowo opublikowano bezpośrednio do `latest`, a `beta`
   powinna natychmiast wskazywać tę samą stabilną kompilację, użyj tego samego prywatnego
   workflow, aby skierować oba dist-tags na stabilną wersję, albo pozwól, by jego zaplanowana
   samonaprawiająca synchronizacja przeniosła `beta` później

Mutacja dist-tag znajduje się w prywatnym repo ze względów bezpieczeństwa, ponieważ nadal
wymaga `NPM_TOKEN`, podczas gdy publiczne repo zachowuje publikację wyłącznie przez OIDC.

Dzięki temu zarówno bezpośrednia ścieżka publikacji, jak i ścieżka promowania najpierw-do-beta
pozostają udokumentowane i widoczne dla operatora.

Jeśli maintainer musi awaryjnie użyć lokalnego uwierzytelniania npm, uruchamiaj wszystkie
polecenia 1Password CLI (`op`) wyłącznie w dedykowanej sesji tmux. Nie wywołuj `op`
bezpośrednio z głównej powłoki agenta; trzymanie go w tmux sprawia, że monity,
alerty i obsługa OTP są obserwowalne oraz zapobiega powtarzającym się alertom hosta.

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

Maintainerzy używają prywatnej dokumentacji wydań w
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
jako właściwego runbooka.

## Powiązane

- [Kanały wydań](/pl/install/development-channels)
