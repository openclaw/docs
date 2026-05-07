---
read_when:
    - Wyszukiwanie definicji publicznych kanałów wydań
    - Uruchamianie walidacji wydania lub akceptacji pakietu
    - Szukanie nazewnictwa wersji i cyklu wydań
summary: Ścieżki wydań, lista kontrolna operatora, środowiska walidacyjne, nazewnictwo wersji i harmonogram
title: Zasady wydawania wersji
x-i18n:
    generated_at: "2026-05-07T13:25:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ma trzy publiczne ścieżki wydań:

- stabilna: oznaczone tagami wydania, które domyślnie publikują do npm `beta`, albo do npm `latest`, gdy zostanie to wyraźnie wskazane
- beta: tagi przedwydań publikowane do npm `beta`
- dev: ruchoma głowica `main`

## Nazewnictwo wersji

- Wersja stabilnego wydania: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Wersja poprawkowego stabilnego wydania: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Wersja przedwydania beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Nie uzupełniaj miesiąca ani dnia zerami z przodu
- `latest` oznacza aktualnie promowane stabilne wydanie npm
- `beta` oznacza aktualny cel instalacji beta
- Stabilne i poprawkowe stabilne wydania domyślnie publikują do npm `beta`; operatorzy wydań mogą wyraźnie wskazać `latest` albo później promować zweryfikowaną kompilację beta
- Każde stabilne wydanie OpenClaw dostarcza razem pakiet npm i aplikację macOS;
  wydania beta zwykle najpierw weryfikują i publikują ścieżkę npm/pakietu, a
  budowanie/podpisywanie/notaryzację aplikacji mac pozostawiają dla wydań stabilnych, chyba że wyraźnie zażądano inaczej

## Rytm wydań

- Wydania przechodzą najpierw przez beta
- Stabilne wydanie następuje dopiero po zweryfikowaniu najnowszej beta
- Maintainerzy zwykle wycinają wydania z gałęzi `release/YYYY.M.D` utworzonej
  z bieżącego `main`, aby walidacja wydania i poprawki nie blokowały nowego
  rozwoju na `main`
- Jeśli tag beta został wypchnięty lub opublikowany i wymaga poprawki, maintainerzy wycinają
  następny tag `-beta.N` zamiast usuwać lub odtwarzać stary tag beta
- Szczegółowa procedura wydania, zgody, poświadczenia i notatki dotyczące odzyskiwania są
  dostępne tylko dla maintainerów

## Lista kontrolna operatora wydania

Ta lista kontrolna przedstawia publiczny kształt przepływu wydania. Prywatne poświadczenia,
podpisywanie, notaryzacja, odzyskiwanie dist-tagów i szczegóły awaryjnego wycofania pozostają w
runbooku wydania dostępnym tylko dla maintainerów.

1. Zacznij od bieżącego `main`: pobierz najnowsze zmiany, potwierdź, że docelowy commit został wypchnięty,
   i potwierdź, że bieżące CI `main` jest wystarczająco zielone, aby utworzyć z niego gałąź.
2. Przepisz najwyższą sekcję `CHANGELOG.md` na podstawie rzeczywistej historii commitów za pomocą
   `/changelog`, zachowaj wpisy skierowane do użytkowników, zacommituj ją, wypchnij i jeszcze raz wykonaj rebase/pull
   przed utworzeniem gałęzi.
3. Przejrzyj rekordy zgodności wydań w
   `src/plugins/compat/registry.ts` i
   `src/commands/doctor/shared/deprecation-compat.ts`. Usuń wygasłą
   zgodność tylko wtedy, gdy ścieżka aktualizacji pozostaje pokryta, albo zapisz, dlaczego jest
   celowo utrzymywana.
4. Utwórz `release/YYYY.M.D` z bieżącego `main`; nie wykonuj zwykłej pracy wydaniowej
   bezpośrednio na `main`.
5. Podbij każdą wymaganą lokalizację wersji dla zamierzonego tagu, uruchom
   `pnpm plugins:sync`, aby publikowalne pakiety Plugin współdzieliły wersję wydania
   i metadane zgodności, a następnie uruchom lokalny deterministyczny preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` i
   `pnpm release:check`.
6. Uruchom `OpenClaw NPM Release` z `preflight_only=true`. Zanim tag istnieje,
   pełny 40-znakowy SHA gałęzi wydania jest dozwolony wyłącznie do walidacji
   preflight. Zapisz pomyślne `preflight_run_id`.
7. Uruchom wszystkie testy przedwydaniowe za pomocą `Full Release Validation` dla
   gałęzi wydania, tagu lub pełnego SHA commita. To jest jedyny ręczny punkt wejścia
   dla czterech dużych pól testowych wydania: Vitest, Docker, QA Lab i Package.
8. Jeśli walidacja się nie powiedzie, napraw na gałęzi wydania i ponownie uruchom najmniejszy nieudany
   plik, ścieżkę, zadanie workflow, profil pakietu, dostawcę lub allowlistę modelu, która
   potwierdza poprawkę. Ponownie uruchom pełny parasol tylko wtedy, gdy zmieniona powierzchnia sprawia,
   że wcześniejsze dowody są nieaktualne.
9. Dla beta oznacz tagiem `vYYYY.M.D-beta.N`, a następnie uruchom `OpenClaw Release Publish` z
   pasującej gałęzi `release/YYYY.M.D`. Weryfikuje `pnpm plugins:sync:check`,
   wysyła wszystkie publikowalne pakiety Plugin do npm oraz ten sam zestaw do
   ClawHub równolegle, a następnie promuje przygotowany artefakt preflight OpenClaw npm
   z pasującym dist-tagiem, gdy tylko publikacja Plugin do npm zakończy się powodzeniem.
   Publikacja do ClawHub może nadal trwać, gdy OpenClaw npm jest publikowany, ale
   workflow publikacji wydania nie kończy się, dopóki obie ścieżki publikacji Plugin i
   ścieżka publikacji OpenClaw npm nie zakończą się powodzeniem. Po publikacji uruchom
   akceptację pakietu po publikacji
   dla opublikowanego pakietu `openclaw@YYYY.M.D-beta.N` albo
   `openclaw@beta`. Jeśli wypchnięte lub opublikowane przedwydanie wymaga poprawki,
   wytnij następny pasujący numer przedwydania; nie usuwaj ani nie przepisuj starego
   przedwydania.
10. Dla stabilnego wydania kontynuuj tylko wtedy, gdy zweryfikowana beta lub kandydat wydania ma
    wymagane dowody walidacji. Publikacja stabilna npm również przechodzi przez
    `OpenClaw Release Publish`, ponownie używając pomyślnego artefaktu preflight przez
    `preflight_run_id`; gotowość stabilnego wydania macOS wymaga także
    spakowanych `.zip`, `.dmg`, `.dSYM.zip` oraz zaktualizowanego `appcast.xml` na `main`.
11. Po publikacji uruchom weryfikator npm po publikacji, opcjonalny samodzielny
    Telegram E2E dla opublikowanego npm, gdy potrzebujesz dowodu kanału po publikacji,
    promowanie dist-tagów, gdy jest potrzebne, notatki wydania/przedwydania GitHub z
    kompletnej pasującej sekcji `CHANGELOG.md` oraz kroki ogłoszenia wydania.

## Preflight wydania

- Uruchom `pnpm check:test-types` przed kontrolą wstępną wydania, aby testowy TypeScript pozostawał
  objęty poza szybszą lokalną bramką `pnpm check`
- Uruchom `pnpm check:architecture` przed kontrolą wstępną wydania, aby szersze kontrole cykli
  importów i granic architektury były zielone poza szybszą lokalną bramką
- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane
  artefakty wydania `dist/*` i pakiet Control UI istniały na potrzeby kroku
  walidacji pakietu
- Uruchom `pnpm plugins:sync` po podbiciu wersji w katalogu głównym i przed tagowaniem. Aktualizuje
  wersje publikowalnych pakietów pluginów, metadane zgodności peer/API OpenClaw,
  metadane kompilacji oraz szkielety changelogów pluginów tak, aby pasowały do wersji
  wydania core. `pnpm plugins:sync:check` jest niemodyfikującą osłoną wydania;
  przepływ publikowania kończy się niepowodzeniem przed jakąkolwiek mutacją rejestru, jeśli ten krok został
  pominięty.
- Uruchom ręczny przepływ pracy `Full Release Validation` przed zatwierdzeniem wydania, aby
  uruchomić wszystkie przedwydaniowe boksy testowe z jednego punktu wejścia. Przyjmuje gałąź,
  tag albo pełny SHA commita, uruchamia ręczny `CI` oraz uruchamia
  `OpenClaw Release Checks` dla smoke testu instalacji, akceptacji pakietu, międzyplatformowych
  kontroli pakietu, parytetu QA Lab, Matrix i ścieżek Telegram. Stabilne/domyślne uruchomienia
  trzymają wyczerpujące ścieżki live/E2E oraz długotrwały test ścieżki wydania Docker za
  `run_release_soak=true`; `release_profile=full` wymusza ten test. Z
  `release_profile=full` i `rerun_group=all` uruchamia też pakietowe Telegram
  E2E względem artefaktu `release-package-under-test` z kontroli wydania.
  Podaj `npm_telegram_package_spec` po publikacji, gdy ten sam
  Telegram E2E ma potwierdzić także opublikowany pakiet npm. Podaj
  `package_acceptance_package_spec` po publikacji, gdy Package Acceptance
  ma uruchomić swoją macierz pakietu/aktualizacji względem wysłanego pakietu npm zamiast
  artefaktu zbudowanego z SHA. Podaj
  `evidence_package_spec`, gdy prywatny raport dowodowy ma potwierdzić, że
  walidacja pasuje do opublikowanego pakietu npm bez wymuszania Telegram E2E.
  Przykład:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Uruchom ręczny przepływ pracy `Package Acceptance`, gdy chcesz uzyskać dowód bocznym kanałem
  dla kandydata pakietu, podczas gdy prace wydaniowe trwają dalej. Użyj `source=npm` dla
  `openclaw@beta`, `openclaw@latest` albo dokładnej wersji wydania; `source=ref`,
  aby spakować zaufaną gałąź/tag/SHA `package_ref` z bieżącą uprzężą
  `workflow_ref`; `source=url` dla archiwum tar przez HTTPS z wymaganym
  SHA-256; albo `source=artifact` dla archiwum tar przesłanego przez inne uruchomienie GitHub
  Actions. Przepływ pracy rozwiązuje kandydata do
  `package-under-test`, ponownie używa harmonogramu wydania Docker E2E względem tego
  archiwum tar i może uruchomić QA Telegram względem tego samego archiwum tar z
  `telegram_mode=mock-openai` albo `telegram_mode=live-frontier`. Gdy
  wybrane ścieżki Docker obejmują `published-upgrade-survivor`, artefakt
  pakietu jest kandydatem, a `published_upgrade_survivor_baseline` wybiera
  opublikowaną bazę. `update-restart-auth` używa pakietu kandydującego jako
  zainstalowanego CLI oraz package-under-test, więc ćwiczy zarządzaną ścieżkę
  restartu polecenia aktualizacji kandydata.
  Przykład: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Typowe profile:
  - `smoke`: ścieżki instalacji/kanału/agenta, sieci gateway i przeładowania konfiguracji
  - `package`: natywne dla artefaktu ścieżki pakietu/aktualizacji/restartu/pluginów bez OpenWebUI ani live ClawHub
  - `product`: profil pakietu plus kanały MCP, czyszczenie cron/subagentów,
    wyszukiwanie internetowe OpenAI i OpenWebUI
  - `full`: części ścieżki wydania Docker z OpenWebUI
  - `custom`: dokładny wybór `docker_lanes` do ukierunkowanego ponownego uruchomienia
- Uruchom ręczny przepływ pracy `CI` bezpośrednio, gdy potrzebujesz tylko pełnego zwykłego pokrycia CI
  dla kandydata wydania. Ręczne uruchomienia CI omijają zakresowanie zmian
  i wymuszają shardy Linux Node, shardy pakietów wbudowanych pluginów, kontrakty kanałów,
  zgodność z Node 22, `check`, `check-additional`, smoke test kompilacji,
  kontrole dokumentacji, Python skills, Windows, macOS, Android i ścieżki Control UI i18n.
  Przykład: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Uruchom `pnpm qa:otel:smoke` podczas walidowania telemetrii wydania. Ćwiczy
  QA-lab przez lokalny odbiornik OTLP/HTTP i weryfikuje wyeksportowane nazwy spanów
  śladu, ograniczone atrybuty oraz redakcję treści/identyfikatorów bez
  wymagania Opik, Langfuse albo innego zewnętrznego kolektora.
- Uruchom `pnpm release:check` przed każdym tagowanym wydaniem
- Uruchom `OpenClaw Release Publish` dla mutującej sekwencji publikowania po
  utworzeniu tagu. Uruchom go z `release/YYYY.M.D` (albo `main`, gdy publikujesz
  tag osiągalny z main), przekaż tag wydania i udany
  `preflight_run_id` npm OpenClaw oraz zachowaj domyślny zakres publikowania pluginów
  `all-publishable`, chyba że celowo uruchamiasz ukierunkowaną naprawę. Ten
  przepływ pracy szereguje publikację pluginów w npm, publikację pluginów w ClawHub i publikację OpenClaw
  w npm, aby pakiet core nie został opublikowany przed swoimi zewnętrznymi
  pluginami.
- Kontrole wydania działają teraz w osobnym ręcznym przepływie pracy:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` uruchamia też ścieżkę parytetu mock QA Lab oraz szybki
  profil live Matrix i ścieżkę QA Telegram przed zatwierdzeniem wydania. Ścieżki live
  używają środowiska `qa-live-shared`; Telegram używa też dzierżaw poświadczeń Convex CI.
  Uruchom ręczny przepływ pracy `QA-Lab - All Lanes` z
  `matrix_profile=all` i `matrix_shards=true`, gdy chcesz uzyskać pełny inwentarz
  transportu Matrix, mediów i E2EE równolegle.
- Międzyplatformowa walidacja czasu działania instalacji i aktualizacji jest częścią publicznych
  `OpenClaw Release Checks` oraz `Full Release Validation`, które wywołują
  wielokrotnego użytku przepływ pracy
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` bezpośrednio
- Ten podział jest celowy: utrzymuje rzeczywistą ścieżkę wydania npm krótką,
  deterministyczną i skupioną na artefaktach, podczas gdy wolniejsze kontrole live pozostają we
  własnej ścieżce, aby nie opóźniały ani nie blokowały publikacji
- Kontrole wydania zawierające sekrety powinny być uruchamiane przez `Full Release
Validation` albo z refa przepływu pracy `main`/release, aby logika przepływu pracy i
  sekrety pozostawały kontrolowane
- `OpenClaw Release Checks` przyjmuje gałąź, tag albo pełny SHA commita, o ile
  rozwiązany commit jest osiągalny z gałęzi OpenClaw albo tagu wydania
- Kontrola wstępna tylko do walidacji `OpenClaw NPM Release` przyjmuje też bieżący
  pełny 40-znakowy SHA commita gałęzi przepływu pracy bez wymagania wypchniętego tagu
- Ta ścieżka SHA służy tylko do walidacji i nie może zostać promowana do rzeczywistej publikacji
- W trybie SHA przepływ pracy syntetyzuje `v<package.json version>` tylko na potrzeby
  kontroli metadanych pakietu; rzeczywista publikacja nadal wymaga prawdziwego tagu wydania
- Oba przepływy pracy utrzymują rzeczywistą ścieżkę publikowania i promocji na runnerach
  hostowanych przez GitHub, podczas gdy niemutująca ścieżka walidacji może używać większych
  runnerów Blacksmith Linux
- Ten przepływ pracy uruchamia
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  używając sekretów przepływu pracy `OPENAI_API_KEY` i `ANTHROPIC_API_KEY`
- Kontrola wstępna wydania npm nie czeka już na osobną ścieżkę kontroli wydania
- Uruchom `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (albo pasujący tag beta/korekty) przed zatwierdzeniem
- Po publikacji npm uruchom
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (albo pasującą wersję beta/korekty), aby zweryfikować ścieżkę instalacji z opublikowanego rejestru
  w świeżym prefiksie tymczasowym
- Po publikacji beta uruchom `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  aby zweryfikować onboarding zainstalowanego pakietu, konfigurację Telegram oraz rzeczywiste Telegram E2E
  względem opublikowanego pakietu npm przy użyciu współdzielonej puli dzierżawionych poświadczeń Telegram.
  Jednorazowe lokalne uruchomienia maintainerów mogą pominąć zmienne Convex i przekazać trzy
  poświadczenia env `OPENCLAW_QA_TELEGRAM_*` bezpośrednio.
- Aby uruchomić pełny smoke test beta po publikacji z maszyny maintainera, użyj `pnpm release:beta-smoke -- --beta betaN`. Helper uruchamia walidację aktualizacji npm Parallels/świeżego celu, uruchamia `NPM Telegram Beta E2E`, odpytuje dokładne uruchomienie przepływu pracy, pobiera artefakt i wypisuje raport Telegram.
- Maintainerzy mogą uruchomić tę samą kontrolę po publikacji z GitHub Actions przez
  ręczny przepływ pracy `NPM Telegram Beta E2E`. Jest on celowo wyłącznie ręczny i
  nie uruchamia się przy każdym scaleniu.
- Automatyzacja wydań maintainerów używa teraz modelu kontrola wstępna, potem promocja:
  - rzeczywista publikacja npm musi przejść udany npm `preflight_run_id`
  - rzeczywista publikacja npm musi zostać uruchomiona z tej samej gałęzi `main` albo
    `release/YYYY.M.D`, co udane uruchomienie kontroli wstępnej
  - stabilne wydania npm domyślnie wskazują `beta`
  - stabilna publikacja npm może jawnie wskazać `latest` przez wejście przepływu pracy
  - mutacja npm dist-tag oparta na tokenie znajduje się teraz w
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    ze względów bezpieczeństwa, ponieważ `npm dist-tag add` nadal wymaga `NPM_TOKEN`, podczas gdy
    publiczne repo utrzymuje publikowanie wyłącznie przez OIDC
  - publiczny `macOS Release` służy tylko do walidacji; gdy tag istnieje tylko na
    gałęzi wydania, ale przepływ pracy jest uruchamiany z `main`, ustaw
    `public_release_branch=release/YYYY.M.D`
  - rzeczywista prywatna publikacja mac musi przejść udany prywatny mac
    `preflight_run_id` i `validate_run_id`
  - rzeczywiste ścieżki publikacji promują przygotowane artefakty zamiast budować
    je ponownie
- Dla stabilnych wydań korygujących, takich jak `YYYY.M.D-N`, weryfikator po publikacji
  sprawdza też tę samą ścieżkę aktualizacji w tymczasowym prefiksie z `YYYY.M.D` do `YYYY.M.D-N`,
  aby korekty wydania nie mogły po cichu zostawić starszych globalnych instalacji na
  bazowym stabilnym ładunku
- Kontrola wstępna wydania npm kończy się niepowodzeniem w trybie zamkniętym, chyba że archiwum tar zawiera zarówno
  `dist/control-ui/index.html`, jak i niepusty ładunek `dist/control-ui/assets/`,
  abyśmy ponownie nie wysłali pustego panelu przeglądarkowego
- Weryfikacja po publikacji sprawdza też, czy opublikowane punkty wejścia pluginów i
  metadane pakietu są obecne w zainstalowanym układzie rejestru. Wydanie, które
  wysyła brakujące ładunki runtime pluginów, oblewa weryfikator po publikacji i
  nie może zostać promowane do `latest`.
- `pnpm test:install:smoke` wymusza też budżet npm pack `unpackedSize` na
  kandydującym archiwum tar aktualizacji, więc instalator e2e wychwytuje przypadkowy rozrost pakietu
  przed ścieżką publikacji wydania
- Jeśli prace wydaniowe dotknęły planowania CI, manifestów czasów pluginów albo
  macierzy testów pluginów, zregeneruj i przejrzyj należące do planera
  wyjścia macierzy `plugin-prerelease-extension-shard` z
  `.github/workflows/plugin-prerelease.yml` przed zatwierdzeniem, aby notatki wydania nie
  opisywały nieaktualnego układu CI
- Gotowość stabilnego wydania macOS obejmuje też powierzchnie aktualizatora:
  - wydanie GitHub musi końcowo zawierać spakowane `.zip`, `.dmg` i `.dSYM.zip`
  - `appcast.xml` na `main` musi wskazywać nowy stabilny zip po publikacji
  - spakowana aplikacja musi zachować niedebugowy identyfikator pakietu, niepusty URL
    feedu Sparkle oraz `CFBundleVersion` na poziomie albo powyżej kanonicznego minimalnego buildu Sparkle
    dla tej wersji wydania

## Boksy testowe wydania

`Full Release Validation` to sposób, w jaki operatorzy uruchamiają wszystkie testy przedwydaniowe z
jednego punktu wejścia. Aby uzyskać dowód przypiętego commita na szybko zmieniającej się gałęzi, użyj
helpera, aby każdy podrzędny przepływ pracy działał z tymczasowej gałęzi ustalonej na docelowym
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper wypycha `release-ci/<sha>-...`, uruchamia `Full Release Validation`
z tej gałęzi z `ref=<sha>`, weryfikuje, że każdy podrzędny przepływ pracy `headSha`
pasuje do celu, a następnie usuwa tymczasową gałąź. To pozwala uniknąć przypadkowego potwierdzenia
nowszego uruchomienia podrzędnego `main`.

W przypadku walidacji gałęzi wydania albo tagu uruchom ją z zaufanego refa przepływu pracy `main`
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

Workflow rozwiązuje docelowy ref, uruchamia ręczne `CI` z
`target_ref=<release-ref>`, uruchamia `OpenClaw Release Checks`, przygotowuje
nadrzędny artefakt `release-package-under-test` dla kontroli dotyczących pakietu
oraz uruchamia samodzielne E2E pakietu Telegram, gdy `release_profile=full` z
`rerun_group=all` albo gdy ustawiono `npm_telegram_package_spec`. Następnie `OpenClaw Release
Checks` rozsyła zadania do install smoke, cross-OS release checks, live/E2E Docker
release-path coverage, gdy włączony jest soak, Package Acceptance z Telegram
package QA, QA Lab parity, live Matrix oraz live Telegram. Pełny przebieg jest akceptowalny tylko wtedy, gdy
podsumowanie `Full Release Validation`
pokazuje `normal_ci` i `release_checks` jako zakończone powodzeniem. W trybie full/all
proces potomny `npm_telegram` również musi zakończyć się powodzeniem; poza full/all jest pomijany,
chyba że podano opublikowany `npm_telegram_package_spec`. Końcowe
podsumowanie weryfikatora zawiera tabele najwolniejszych zadań dla każdego przebiegu potomnego, dzięki czemu release
manager może zobaczyć bieżącą ścieżkę krytyczną bez pobierania logów.
Zobacz [Full release validation](/pl/reference/full-release-validation), aby poznać
pełną macierz etapów, dokładne nazwy zadań workflow, różnice między profilami stable i full,
artefakty oraz uchwyty do zawężonych ponownych uruchomień.
Workflow potomne są uruchamiane z zaufanego ref, który uruchamia `Full Release
Validation`, zwykle `--ref main`, nawet gdy docelowy `ref` wskazuje na
starszą gałąź wydania lub tag. Nie ma oddzielnego wejścia workflow-ref dla Full Release Validation;
wybierz zaufany harness, wybierając ref uruchomienia workflow.
Nie używaj `--ref main -f ref=<sha>` do dowodu dokładnego commita na przesuwającym się `main`;
surowe SHA commitów nie mogą być refami dispatch workflow, więc użyj
`pnpm ci:full-release --sha <sha>`, aby utworzyć przypiętą gałąź tymczasową.

Użyj `release_profile`, aby wybrać zakres live/provider:

- `minimum`: najszybsza ścieżka live OpenAI/core i Docker krytyczna dla wydania
- `stable`: minimum plus stabilne pokrycie provider/backend do zatwierdzenia wydania
- `full`: stable plus szerokie pokrycie doradcze provider/media

Użyj `run_release_soak=true` ze `stable`, gdy lane blokujące wydanie są
zielone i chcesz wykonać wyczerpujące live/E2E, Docker release-path oraz
ograniczony przegląd published upgrade-survivor przed promocją. Ten przegląd obejmuje
najnowsze cztery stabilne pakiety oraz przypięte baseline `2026.4.23` i `2026.5.2`
plus starsze pokrycie `2026.4.15`, z usuniętymi duplikatami baseline i
każdym baseline podzielonym do osobnego zadania runnera Docker. `full` implikuje
`run_release_soak=true`.

`OpenClaw Release Checks` używa zaufanego ref workflow, aby raz rozwiązać docelowy
ref jako `release-package-under-test` i ponownie używa tego artefaktu w cross-OS,
Package Acceptance oraz kontrolach Docker release-path, gdy działa soak. Dzięki temu
wszystkie maszyny dotyczące pakietu używają tych samych bajtów i unika się powtarzanych buildów pakietu.
Cross-OS OpenAI install smoke używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy ustawiona jest
zmienna repo/org, w przeciwnym razie `openai/gpt-5.4`, ponieważ ta lane
udowadnia instalację pakietu, onboarding, uruchomienie Gateway oraz jedną turę live agent
zamiast benchmarkować najwolniejszy model domyślny. Szersza macierz live provider
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

Nie używaj pełnego parasola jako pierwszego ponownego uruchomienia po zawężonej poprawce. Jeśli jedna maszyna
zawiedzie, użyj nieudanego workflow potomnego, zadania, lane Docker, profilu pakietu, modelu
provider lub lane QA jako następnego dowodu. Uruchom pełny parasol ponownie tylko wtedy, gdy
poprawka zmieniła współdzieloną orkiestrację wydania albo sprawiła, że wcześniejszy dowód all-box
stał się nieaktualny. Końcowy weryfikator parasola ponownie sprawdza zapisane identyfikatory przebiegów workflow
potomnych, więc po pomyślnym ponownym uruchomieniu workflow potomnego uruchom ponownie tylko nieudane
nadrzędne zadanie `Verify full validation`.

Do ograniczonego odzyskiwania przekaż `rerun_group` do parasola. `all` to rzeczywisty
przebieg kandydata do wydania, `ci` uruchamia tylko zwykły proces potomny CI, `plugin-prerelease`
uruchamia tylko proces potomny plugin przeznaczony wyłącznie dla wydania, `release-checks` uruchamia każdą maszynę
wydania, a węższe grupy wydania to `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` i `npm-telegram`.
Zawężone ponowne uruchomienia `npm-telegram` wymagają `npm_telegram_package_spec`; przebiegi full/all
z `release_profile=full` używają artefaktu pakietu release-checks. Zawężone
ponowne uruchomienia cross-OS mogą dodać `cross_os_suite_filter=windows/packaged-upgrade` lub
inny filtr OS/suite. Niepowodzenia QA release-check są doradcze; niepowodzenie wyłącznie QA
nie blokuje walidacji wydania.

### Vitest

Maszyna Vitest to ręczny workflow potomny `CI`. Ręczne CI celowo
pomija zawężanie według zmian i wymusza normalny graf testów dla kandydata
do wydania: shardy Linux Node, shardy bundled-plugin, kontrakty kanałów, zgodność Node 22,
`check`, `check-additional`, build smoke, kontrole dokumentacji, Python
skills, Windows, macOS, Android oraz Control UI i18n.

Użyj tej maszyny, aby odpowiedzieć na pytanie „czy drzewo źródłowe przeszło pełny normalny zestaw testów?”.
To nie jest to samo co walidacja produktu na ścieżce wydania. Dowody do zachowania:

- podsumowanie `Full Release Validation` pokazujące URL uruchomionego przebiegu `CI`
- zielony przebieg `CI` na dokładnym docelowym SHA
- nazwy nieudanych lub wolnych shardów z zadań CI podczas badania regresji
- artefakty czasów Vitest, takie jak `.artifacts/vitest-shard-timings.json`, gdy
  przebieg wymaga analizy wydajności

Uruchamiaj ręczne CI bezpośrednio tylko wtedy, gdy wydanie potrzebuje deterministycznego normalnego CI, ale
nie maszyn Docker, QA Lab, live, cross-OS ani package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Maszyna Docker znajduje się w `OpenClaw Release Checks` przez
`openclaw-live-and-e2e-checks-reusable.yml` oraz workflow `install-smoke`
w trybie wydania. Waliduje kandydata do wydania przez spakowane
środowiska Docker zamiast wyłącznie testów na poziomie źródeł.

Pokrycie Docker dla wydania obejmuje:

- pełny install smoke z włączonym wolnym Bun global install smoke
- przygotowanie/ponowne użycie obrazu root Dockerfile smoke według docelowego SHA, z zadaniami QR,
  root/gateway oraz installer/Bun smoke działającymi jako osobne shardy install-smoke
- lane E2E repozytorium
- fragmenty Docker release-path: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` i `plugins-runtime-install-h`
- pokrycie OpenWebUI wewnątrz fragmentu `plugins-runtime-services`, gdy jest wymagane
- podzielone lane install/uninstall bundled plugin
  `bundled-plugin-install-uninstall-0` do
  `bundled-plugin-install-uninstall-23`
- zestawy live/E2E provider oraz pokrycie modeli live Docker, gdy release checks
  obejmują zestawy live

Użyj artefaktów Docker przed ponownym uruchomieniem. Harmonogram release-path przesyła
`.artifacts/docker-tests/` z logami lane, `summary.json`, `failures.json`,
czasami faz, JSON planu harmonogramu oraz poleceniami ponownego uruchomienia. Do zawężonego odzyskiwania
użyj `docker_lanes=<lane[,lane]>` w wielokrotnego użytku workflow live/E2E zamiast
ponownie uruchamiać wszystkie fragmenty wydania. Wygenerowane polecenia ponownego uruchomienia zawierają wcześniejsze
`package_artifact_run_id` oraz wejścia przygotowanego obrazu Docker, gdy są dostępne, więc
nieudana lane może ponownie użyć tego samego tarballa i obrazów GHCR.

### QA Lab

Maszyna QA Lab jest również częścią `OpenClaw Release Checks`. To agentic
behavior oraz bramka wydania na poziomie kanałów, oddzielna od mechaniki pakietów Vitest i Docker.

Pokrycie QA Lab dla wydania obejmuje:

- lane mock parity porównującą lane kandydata OpenAI z baseline Opus 4.6
  przy użyciu pakietu agentic parity
- szybki profil live Matrix QA używający środowiska `qa-live-shared`
- live Telegram QA lane używająca dzierżaw danych uwierzytelniających Convex CI
- `pnpm qa:otel:smoke`, gdy telemetria wydania wymaga jawnego lokalnego dowodu

Użyj tej maszyny, aby odpowiedzieć na pytanie „czy wydanie zachowuje się poprawnie w scenariuszach QA i
przepływach kanałów live?”. Zachowaj URL-e artefaktów dla lane parity, Matrix i Telegram
podczas zatwierdzania wydania. Pełne pokrycie Matrix pozostaje dostępne jako
ręczny shardowany przebieg QA-Lab, a nie domyślna lane krytyczna dla wydania.

### Package

Maszyna Package to bramka instalowalnego produktu. Jest oparta na
`Package Acceptance` i resolverze
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver normalizuje
kandydata do tarballa `package-under-test` używanego przez Docker E2E, waliduje
inventory pakietu, zapisuje wersję pakietu i SHA-256 oraz utrzymuje
ref harness workflow oddzielnie od ref źródła pakietu.

Obsługiwane źródła kandydatów:

- `source=npm`: `openclaw@beta`, `openclaw@latest` lub dokładna wersja wydania OpenClaw
- `source=ref`: spakuj zaufaną gałąź `package_ref`, tag lub pełny SHA commita
  z wybranym harness `workflow_ref`
- `source=url`: pobierz HTTPS `.tgz` z wymaganym `package_sha256`
- `source=artifact`: ponownie użyj `.tgz` przesłanego przez inny przebieg GitHub Actions

`OpenClaw Release Checks` uruchamia Package Acceptance z `source=artifact`,
przygotowanym artefaktem pakietu wydania, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance utrzymuje migrację, aktualizację,
restart aktualizacji configured-auth, czyszczenie przestarzałych zależności plugin, fixture offline plugin,
aktualizację plugin oraz Telegram package QA wobec tego samego rozwiązanego
tarballa. Blokujące release checks używają domyślnego baseline najnowszego opublikowanego pakietu;
`run_release_soak=true` lub
`release_profile=full` rozszerza zakres na każdy stabilny baseline opublikowany w npm od
`2026.4.23` do `latest` plus fixture zgłoszonych problemów. Użyj
Package Acceptance z `source=npm` dla już wysłanego kandydata albo
`source=ref`/`source=artifact` dla lokalnego tarballa npm opartego na SHA przed
publikacją. To natywne dla GitHub
zastępstwo większości pokrycia package/update, które wcześniej wymagało
Parallels. Cross-OS release checks nadal są ważne dla onboardingu specyficznego dla OS,
instalatora i zachowania platformy, ale walidacja produktu package/update powinna
preferować Package Acceptance.

Kanoniczna lista kontrolna dla walidacji aktualizacji i plugin to
[Testing updates and plugins](/pl/help/testing-updates-plugins). Użyj jej przy
decydowaniu, która lokalna, Docker, Package Acceptance lub release-check lane udowadnia
instalację/aktualizację plugin, czyszczenie doctor albo zmianę migracji opublikowanego pakietu.
Wyczerpująca migracja aktualizacji opublikowanych z każdego stabilnego pakietu `2026.4.23+` jest
osobnym ręcznym workflow `Update Migration`, a nie częścią Full Release CI.

Łagodność starszej akceptacji pakietów jest celowo ograniczona czasowo. Pakiety do
`2026.4.25` mogą używać ścieżki zgodności dla braków metadanych już opublikowanych
w npm: prywatnych wpisów inwentarza QA brakujących w tarballu, brakującego
`gateway install --wrapper`, brakujących plików poprawek w fixturze git
pochodzącej z tarballa, brakującego utrwalonego `update.channel`, starszych
lokalizacji rekordów instalacji Plugin, brakującego utrwalania rekordów instalacji
marketplace oraz migracji metadanych konfiguracji podczas `plugins update`. Opublikowany pakiet `2026.4.26` może ostrzegać
o lokalnych plikach znaczników metadanych kompilacji, które zostały już wydane. Późniejsze pakiety
muszą spełniać nowoczesne kontrakty pakietów; te same braki powodują niepowodzenie
walidacji wydania.

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

- `smoke`: szybkie ścieżki instalacji pakietu/kanału/agenta, sieci Gateway oraz
  przeładowania konfiguracji
- `package`: kontrakty instalacji/aktualizacji/restartu/pakietu Plugin bez aktywnego
  ClawHub; to jest domyślna wartość kontroli wydania
- `product`: `package` plus kanały MCP, czyszczenie cron/subagent, wyszukiwanie w sieci OpenAI
  oraz OpenWebUI
- `full`: fragmenty ścieżki wydania Docker z OpenWebUI
- `custom`: dokładna lista `docker_lanes` dla ukierunkowanych ponownych uruchomień

Dla dowodu Telegram kandydata pakietu włącz `telegram_mode=mock-openai` lub
`telegram_mode=live-frontier` w Package Acceptance. Workflow przekazuje
rozwiązany tarball `package-under-test` do ścieżki Telegram; samodzielny
workflow Telegram nadal akceptuje opublikowaną specyfikację npm do kontroli po publikacji.

## Automatyzacja publikacji wydania

`OpenClaw Release Publish` jest normalnym mutującym punktem wejścia publikacji. Orkiestruje
workflow zaufanego wydawcy w kolejności wymaganej przez wydanie:

1. Pobierz tag wydania i rozwiąż jego commit SHA.
2. Zweryfikuj, że tag jest osiągalny z `main` lub `release/*`.
3. Uruchom `pnpm plugins:sync:check`.
4. Wywołaj `Plugin NPM Release` z `publish_scope=all-publishable` i
   `ref=<release-sha>`.
5. Wywołaj `Plugin ClawHub Release` z tym samym zakresem i SHA.
6. Wywołaj `OpenClaw NPM Release` z tagiem wydania, npm dist-tag oraz
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
tylko do ukierunkowanej naprawy lub ponownej publikacji. Dla naprawy wybranego Plugin przekaż
`plugin_publish_scope=selected` i `plugins=@openclaw/name` do
`OpenClaw Release Publish` albo wywołaj workflow podrzędny bezpośrednio, gdy
pakiet OpenClaw nie może zostać opublikowany.

## Dane wejściowe workflow NPM

`OpenClaw NPM Release` akceptuje te dane wejściowe kontrolowane przez operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1` lub
  `v2026.4.2-beta.1`; gdy `preflight_only=true`, może być także bieżącym
  pełnym 40-znakowym commit SHA gałęzi workflow dla preflightu tylko walidacyjnego
- `preflight_only`: `true` tylko dla walidacji/kompilacji/pakietu, `false` dla
  rzeczywistej ścieżki publikacji
- `preflight_run_id`: wymagane na rzeczywistej ścieżce publikacji, aby workflow ponownie użył
  przygotowanego tarballa z udanego uruchomienia preflight
- `npm_dist_tag`: docelowy tag npm dla ścieżki publikacji; domyślnie `beta`

`OpenClaw Release Publish` akceptuje te dane wejściowe kontrolowane przez operatora:

- `tag`: wymagany tag wydania; musi już istnieć
- `preflight_run_id`: identyfikator udanego uruchomienia preflight `OpenClaw NPM Release`;
  wymagany, gdy `publish_openclaw_npm=true`
- `npm_dist_tag`: docelowy tag npm dla pakietu OpenClaw
- `plugin_publish_scope`: domyślnie `all-publishable`; używaj `selected` tylko
  do ukierunkowanych prac naprawczych
- `plugins`: rozdzielone przecinkami nazwy pakietów `@openclaw/*`, gdy
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: domyślnie `true`; ustaw `false` tylko wtedy, gdy używasz
  workflow jako orkiestratora naprawy wyłącznie dla Plugin

`OpenClaw Release Checks` akceptuje te dane wejściowe kontrolowane przez operatora:

- `ref`: gałąź, tag lub pełny commit SHA do zwalidowania. Kontrole wymagające sekretów
  wymagają, aby rozwiązany commit był osiągalny z gałęzi OpenClaw lub
  tagu wydania.
- `run_release_soak`: włącz wyczerpujące aktywne/E2E, ścieżkę wydania Docker oraz
  całe od ostatniego soak upgrade-survivor w stabilnych/domyślnych kontrolach wydania. Jest wymuszane
  przez `release_profile=full`.

Reguły:

- Tagi stabilne i korygujące mogą publikować do `beta` albo `latest`
- Tagi przedwydania beta mogą publikować tylko do `beta`
- Dla `OpenClaw NPM Release` pełny commit SHA jako wejście jest dozwolony tylko, gdy
  `preflight_only=true`
- `OpenClaw Release Checks` i `Full Release Validation` są zawsze
  wyłącznie walidacyjne
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, który został użyty podczas preflightu;
  workflow weryfikuje te metadane przed kontynuacją publikacji

## Sekwencja stabilnego wydania npm

Podczas przygotowywania stabilnego wydania npm:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`
   - Zanim tag istnieje, możesz użyć bieżącego pełnego commit SHA gałęzi workflow
     do walidacyjnego próbnego uruchomienia workflow preflight
2. Wybierz `npm_dist_tag=beta` dla normalnego przepływu najpierw beta albo `latest` tylko
   wtedy, gdy celowo chcesz bezpośredniej stabilnej publikacji
3. Uruchom `Full Release Validation` na gałęzi wydania, tagu wydania lub pełnym
   commit SHA, gdy chcesz normalne CI plus pokrycie aktywnego cache promptów, Docker, QA Lab,
   Matrix i Telegram z jednego ręcznego workflow
4. Jeśli celowo potrzebujesz tylko deterministycznego normalnego grafu testów, uruchom
   ręczny workflow `CI` na referencji wydania
5. Zapisz udany `preflight_run_id`
6. Uruchom `OpenClaw Release Publish` z tym samym `tag`, tym samym `npm_dist_tag`
   oraz zapisanym `preflight_run_id`; publikuje zewnętrzne pluginy do npm
   i ClawHub przed promowaniem pakietu npm OpenClaw
7. Jeśli wydanie trafiło na `beta`, użyj prywatnego workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   do promowania tej stabilnej wersji z `beta` do `latest`
8. Jeśli wydanie celowo opublikowano bezpośrednio do `latest`, a `beta`
   powinien natychmiast wskazywać tę samą stabilną kompilację, użyj tego samego prywatnego
   workflow, aby skierować oba dist-tagi na stabilną wersję, albo pozwól jego zaplanowanej
   samonaprawiającej synchronizacji przenieść `beta` później

Mutacja dist-tag znajduje się w prywatnym repo ze względów bezpieczeństwa, ponieważ nadal
wymaga `NPM_TOKEN`, podczas gdy publiczne repo utrzymuje publikację wyłącznie przez OIDC.

Dzięki temu zarówno bezpośrednia ścieżka publikacji, jak i ścieżka promocji najpierw beta
są udokumentowane i widoczne dla operatora.

Jeśli maintainer musi wrócić do lokalnego uwierzytelniania npm, uruchamiaj wszystkie polecenia
CLI 1Password (`op`) tylko wewnątrz dedykowanej sesji tmux. Nie wywołuj `op`
bezpośrednio z głównej powłoki agenta; trzymanie go wewnątrz tmux sprawia, że prompty,
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

Maintainerzy używają prywatnej dokumentacji wydania w
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
jako właściwego runbooka.

## Powiązane

- [Kanały wydania](/pl/install/development-channels)
