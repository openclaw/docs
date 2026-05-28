---
read_when:
    - Wyszukiwanie definicji publicznych kanałów wydań
    - Uruchamianie walidacji wydania lub akceptacji pakietu
    - Szukasz zasad nazewnictwa wersji i rytmu wydań
summary: Ścieżki wydań, lista kontrolna operatora, ramki walidacyjne, nazewnictwo wersji i rytm wydań
title: Polityka wydań
x-i18n:
    generated_at: "2026-05-12T08:46:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01fed02c15c4d1950c055f25117fd236942a8858f843022597fe5f56ba2eb724
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ma trzy publiczne tory wydań:

- stable: oznaczone wydania, które domyślnie publikują do npm `beta`, albo do npm `latest` na wyraźne żądanie
- beta: tagi przedwydań publikowane do npm `beta`
- dev: ruchoma głowica `main`

## Nazewnictwo wersji

- Wersja wydania stabilnego: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Wersja poprawkowego wydania stabilnego: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Wersja przedwydania beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Nie uzupełniaj miesiąca ani dnia zerami
- `latest` oznacza aktualnie promowane stabilne wydanie npm
- `beta` oznacza aktualny cel instalacji beta
- Wydania stabilne i poprawkowe wydania stabilne domyślnie publikują do npm `beta`; operatorzy wydań mogą wyraźnie wskazać `latest` albo później wypromować zweryfikowany build beta
- Każde stabilne wydanie OpenClaw dostarcza razem pakiet npm i aplikację macOS;
  wydania beta zwykle najpierw weryfikują i publikują ścieżkę npm/pakietu, a
  build/podpis/notaryzacja aplikacji Mac są zarezerwowane dla wydań stabilnych, chyba że wyraźnie zażądano inaczej

## Rytm wydań

- Wydania przechodzą najpierw przez beta
- Stabilne wydanie następuje dopiero po zweryfikowaniu najnowszej beta
- Maintainerzy zwykle tworzą wydania z gałęzi `release/YYYY.M.D` utworzonej
  z bieżącego `main`, aby walidacja wydania i poprawki nie blokowały nowego
  rozwoju na `main`
- Jeśli tag beta został wypchnięty lub opublikowany i wymaga poprawki, maintainerzy tworzą
  następny tag `-beta.N` zamiast usuwać albo odtwarzać stary tag beta
- Szczegółowa procedura wydania, zatwierdzenia, dane uwierzytelniające i notatki odzyskiwania są
  dostępne tylko dla maintainerów

## Lista kontrolna operatora wydania

Ta lista kontrolna pokazuje publiczny kształt przepływu wydania. Prywatne dane uwierzytelniające,
podpisywanie, notaryzacja, odzyskiwanie dist-tagów i szczegóły awaryjnego wycofania pozostają w
runbooku wydań dostępnym tylko dla maintainerów.

1. Zacznij od bieżącego `main`: pobierz najnowsze zmiany, potwierdź, że docelowy commit został wypchnięty,
   i potwierdź, że bieżące CI `main` jest wystarczająco zielone, aby utworzyć z niego gałąź.
2. Przepisz górną sekcję `CHANGELOG.md` na podstawie rzeczywistej historii commitów za pomocą
   `/changelog`, utrzymaj wpisy jako skierowane do użytkownika, zacommituj je, wypchnij je i wykonaj rebase/pull
   jeszcze raz przed utworzeniem gałęzi.
3. Przejrzyj rekordy zgodności wydań w
   `src/plugins/compat/registry.ts` oraz
   `src/commands/doctor/shared/deprecation-compat.ts`. Usuwaj wygasłą
   zgodność tylko wtedy, gdy ścieżka aktualizacji pozostaje pokryta, albo zanotuj, dlaczego jest
   celowo utrzymywana.
4. Utwórz `release/YYYY.M.D` z bieżącego `main`; nie wykonuj normalnej pracy wydaniowej
   bezpośrednio na `main`.
5. Podbij każdą wymaganą lokalizację wersji dla zamierzonego tagu, a następnie uruchom
   `pnpm release:prep`. Odświeża to wersje Plugin, inwentarz Plugin, schemat
   konfiguracji, metadane konfiguracji spakowanych kanałów, baseline dokumentacji konfiguracji, eksporty Plugin SDK
   oraz baseline API Plugin SDK we właściwej kolejności. Zacommituj wszelkie wygenerowane
   różnice przed tagowaniem. Następnie uruchom lokalny deterministyczny preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` oraz `pnpm release:check`.
6. Uruchom `OpenClaw NPM Release` z `preflight_only=true`. Zanim istnieje tag,
   pełny 40-znakowy SHA gałęzi wydania jest dozwolony dla preflight wyłącznie walidacyjnego.
   Zapisz udany `preflight_run_id`.
7. Uruchom wszystkie testy przedwydaniowe za pomocą `Full Release Validation` dla
   gałęzi wydania, tagu albo pełnego SHA commita. To jest jedyny ręczny punkt wejścia
   dla czterech dużych boksów testów wydaniowych: Vitest, Docker, QA Lab i Package.
8. Jeśli walidacja się nie powiedzie, napraw na gałęzi wydania i ponownie uruchom najmniejszy nieudany
   plik, tor, zadanie workflow, profil pakietu, dostawcę albo allowlistę modeli, która
   potwierdza poprawkę. Ponownie uruchom pełny parasol tylko wtedy, gdy zmieniona powierzchnia sprawia, że
   wcześniejsze dowody są nieaktualne.
9. Dla beta otaguj `vYYYY.M.D-beta.N`, a następnie uruchom `OpenClaw Release Publish` z
   odpowiadającej gałęzi `release/YYYY.M.D`. Weryfikuje `pnpm plugins:sync:check`,
   dispatchuje wszystkie publikowalne pakiety Plugin do npm i ten sam zestaw do
   ClawHub równolegle, a następnie promuje przygotowany artefakt preflight npm OpenClaw
   z pasującym dist-tagiem, gdy tylko publikacja npm Plugin się powiedzie.
   Po powodzeniu dziecka publikacji npm OpenClaw tworzy albo aktualizuje
   odpowiadającą stronę wydania/przedwydania GitHub z kompletnej pasującej
   sekcji `CHANGELOG.md`. Stabilne wydania opublikowane do npm `latest` stają się
   najnowszym wydaniem GitHub; stabilne wydania utrzymaniowe pozostawione na npm `beta` są
   tworzone z GitHub `latest=false`.
   Publikowanie do ClawHub może nadal trwać, gdy npm OpenClaw publikuje, ale workflow
   publikacji wydania od razu wypisuje identyfikatory uruchomień potomnych. Domyślnie
   nie czeka na ClawHub po dispatchu, więc dostępność npm OpenClaw
   nie jest blokowana przez wolniejsze zatwierdzenia ClawHub ani prace rejestrowe; ustaw
   `wait_for_clawhub=true`, gdy ClawHub musi blokować ukończenie workflow. Ścieżka
   ClawHub ponawia przejściowe błędy instalacji zależności CLI, publikuje
   Plugin, które przeszły preview, nawet gdy jedna komórka preview jest niestabilna, i kończy
   weryfikacją rejestru dla każdej oczekiwanej wersji Plugin, aby częściowe publikacje
   pozostawały widoczne i możliwe do ponowienia. Po publikacji uruchom
   `pnpm release:verify-beta -- YYYY.M.D-beta.N --openclaw-npm-run <run-id> --plugin-npm-run <run-id> --plugin-clawhub-run <run-id>`
   aby jednym poleceniem zweryfikować przedwydanie GitHub, dist-tagi npm `beta`, integralność npm,
   ścieżkę instalacji opublikowanego pakietu, dokładne wersje ClawHub, artefakty ClawHub oraz konkluzje
   workflow potomnych. Dodaj `--rerun-failed-clawhub`, gdy sidecar
   ClawHub nie powiódł się tylko w zadaniach możliwych do ponowienia i powinien zostać ponownie uruchomiony w miejscu.
   Następnie uruchom powydaniową akceptację pakietu wobec opublikowanego
   pakietu `openclaw@YYYY.M.D-beta.N` albo
   `openclaw@beta`. Jeśli wypchnięte lub opublikowane przedwydanie wymaga poprawki,
   utwórz następny pasujący numer przedwydania; nie usuwaj ani nie przepisuj starego
   przedwydania.
10. Dla wydania stabilnego kontynuuj dopiero po tym, jak zweryfikowana beta albo release candidate ma
    wymagane dowody walidacji. Stabilna publikacja npm również przechodzi przez
    `OpenClaw Release Publish`, ponownie używając udanego artefaktu preflight przez
    `preflight_run_id`; gotowość stabilnego wydania macOS wymaga także
    spakowanych `.zip`, `.dmg`, `.dSYM.zip` oraz zaktualizowanego `appcast.xml` na `main`.
    Prywatny workflow publikacji macOS automatycznie publikuje podpisany appcast do publicznego
    `main` po zweryfikowaniu zasobów wydania; jeśli ochrona gałęzi blokuje
    bezpośredni push, otwiera albo aktualizuje PR appcast.
11. Po publikacji uruchom weryfikator npm po publikacji, opcjonalny samodzielny
    opublikowany-npm Telegram E2E, gdy potrzebujesz dowodu kanału po publikacji,
    promocję dist-tagu, gdy jest potrzebna, zweryfikuj wygenerowaną stronę wydania GitHub
    i uruchom kroki ogłoszenia wydania.

## Preflight wydania

- Uruchom `pnpm check:test-types` przed preflightem wydania, aby testowy TypeScript
  pozostawał objęty sprawdzeniem poza szybszą lokalną bramką `pnpm check`
- Uruchom `pnpm check:architecture` przed preflightem wydania, aby szersze
  sprawdzenia cykli importów i granic architektury były zielone poza szybszą
  lokalną bramką
- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane
  artefakty wydania `dist/*` i pakiet Control UI istniały na potrzeby kroku
  walidacji pakietu
- Uruchom `pnpm release:prep` po podbiciu wersji w katalogu głównym i przed tagowaniem. Uruchamia
  wszystkie deterministyczne generatory wydania, które często rozjeżdżają się po
  zmianie wersji/konfiguracji/API: wersje pluginów, inwentarz pluginów, schemat
  konfiguracji bazowej, metadane konfiguracji dołączonych kanałów, bazę odniesienia
  dokumentacji konfiguracji, eksporty SDK pluginów i bazę odniesienia API SDK
  pluginów. `pnpm release:check` ponownie uruchamia te zabezpieczenia w trybie
  sprawdzania i zgłasza wszystkie znalezione rozjazdy wygenerowanych danych w jednym
  przebiegu przed uruchomieniem sprawdzeń wydania pakietu.
- Uruchom ręczny workflow `Full Release Validation` przed zatwierdzeniem wydania, aby
  uruchomić wszystkie przedwydaniowe środowiska testowe z jednego punktu wejścia. Przyjmuje gałąź,
  tag lub pełny SHA commita, dispatchuje ręczny `CI` i dispatchuje
  `OpenClaw Release Checks` dla install smoke, akceptacji pakietu, międzyplatformowych
  sprawdzeń pakietów, parzystości QA Lab, Matrix i ścieżek Telegram. Stabilne/domyślne uruchomienia
  trzymają wyczerpujące live/E2E i Docker release-path soak za
  `run_release_soak=true`; `release_profile=full` wymusza soak. Z
  `release_profile=full` i `rerun_group=all` uruchamia też pakietowe Telegram
  E2E względem artefaktu `release-package-under-test` ze sprawdzeń wydania.
  Podaj `release_package_spec` po opublikowaniu wersji beta, aby ponownie użyć wysłanego
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
- Uruchom ręczny workflow `Package Acceptance`, gdy chcesz uzyskać boczny dowód
  dla kandydata pakietu, podczas gdy prace nad wydaniem trwają. Użyj `source=npm` dla
  `openclaw@beta`, `openclaw@latest` lub dokładnej wersji wydania; `source=ref`,
  aby spakować zaufaną gałąź/tag/SHA `package_ref` z bieżącym harness
  `workflow_ref`; `source=url` dla tarballa HTTPS z wymaganym
  SHA-256; albo `source=artifact` dla tarballa przesłanego przez inny przebieg
  GitHub Actions. Workflow rozwiązuje kandydata do
  `package-under-test`, ponownie używa harmonogramu wydania Docker E2E względem tego
  tarballa i może uruchomić Telegram QA względem tego samego tarballa z
  `telegram_mode=mock-openai` lub `telegram_mode=live-frontier`. Gdy
  wybrane ścieżki Docker obejmują `published-upgrade-survivor`, artefakt pakietu
  jest kandydatem, a `published_upgrade_survivor_baseline` wybiera
  opublikowaną bazę odniesienia. `update-restart-auth` używa pakietu kandydata jako
  zarówno zainstalowanego CLI, jak i package-under-test, więc sprawdza ścieżkę
  zarządzanego restartu polecenia aktualizacji kandydata.
  Przykład: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Typowe profile:
  - `smoke`: ścieżki instalacji/kanału/agenta, sieci gateway i przeładowania konfiguracji
  - `package`: natywne dla artefaktu ścieżki pakietu/aktualizacji/restartu/pluginów bez OpenWebUI ani live ClawHub
  - `product`: profil pakietowy plus kanały MCP, czyszczenie cron/subagent,
    wyszukiwanie webowe OpenAI i OpenWebUI
  - `full`: fragmenty Docker release-path z OpenWebUI
  - `custom`: dokładny wybór `docker_lanes` dla ukierunkowanego ponownego uruchomienia
- Uruchom ręczny workflow `CI` bezpośrednio, gdy potrzebujesz tylko pełnego zwykłego
  pokrycia CI dla kandydata wydania. Ręczne dispatchowanie CI omija zakresowanie
  zmian i wymusza shardy Linux Node, shardy dołączonych pluginów, kontrakty
  kanałów, zgodność z Node 22, `check`, `check-additional`, build smoke,
  sprawdzenia dokumentacji, Python skills, Windows, macOS, Android i ścieżki
  i18n Control UI.
  Przykład: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Uruchom `pnpm qa:otel:smoke` podczas walidacji telemetrii wydania. Sprawdza
  QA-lab przez lokalny odbiornik OTLP/HTTP i weryfikuje wyeksportowane nazwy
  spanów śladu, ograniczone atrybuty oraz redakcję treści/identyfikatorów bez
  wymagania Opik, Langfuse ani innego zewnętrznego kolektora.
- Uruchom `pnpm release:check` przed każdym tagowanym wydaniem
- Uruchom `OpenClaw Release Publish` dla mutującej sekwencji publikacji po
  utworzeniu tagu. Dispatchuj go z `release/YYYY.M.D` (lub `main`, gdy publikujesz
  tag osiągalny z main), przekaż tag wydania i udany OpenClaw npm
  `preflight_run_id`, a domyślny zakres publikacji pluginów
  `all-publishable` pozostaw bez zmian, chyba że celowo uruchamiasz ukierunkowaną naprawę. Workflow
  szereguje publikację pluginów npm, publikację pluginów ClawHub i publikację OpenClaw
  npm, aby pakiet główny nie został opublikowany przed swoimi zewnętrznymi
  pluginami.
- Sprawdzenia wydania działają teraz w osobnym ręcznym workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` uruchamia też ścieżkę parzystości mock QA Lab oraz szybki
  profil live Matrix i ścieżkę Telegram QA przed zatwierdzeniem wydania. Ścieżki live
  używają środowiska `qa-live-shared`; Telegram używa też dzierżaw poświadczeń
  Convex CI. Uruchom ręczny workflow `QA-Lab - All Lanes` z
  `matrix_profile=all` i `matrix_shards=true`, gdy chcesz mieć równolegle pełny
  inwentarz transportu Matrix, multimediów i E2EE.
- Międzyplatformowa walidacja runtime instalacji i aktualizacji jest częścią publicznych
  `OpenClaw Release Checks` i `Full Release Validation`, które wywołują
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` bezpośrednio
- Ten podział jest celowy: utrzymuje rzeczywistą ścieżkę wydania npm jako krótką,
  deterministyczną i skoncentrowaną na artefaktach, podczas gdy wolniejsze sprawdzenia live pozostają
  we własnej ścieżce, aby nie opóźniały ani nie blokowały publikacji
- Sprawdzenia wydania zawierające sekrety powinny być dispatchowane przez `Full Release
Validation` albo z referencji workflow `main`/release, aby logika workflow i
  sekrety pozostawały kontrolowane
- `OpenClaw Release Checks` akceptuje gałąź, tag lub pełny SHA commita, o ile
  rozwiązany commit jest osiągalny z gałęzi OpenClaw albo tagu wydania
- Preflight tylko walidacyjny `OpenClaw NPM Release` akceptuje także bieżący
  pełny 40-znakowy SHA commita gałęzi workflow bez wymagania wypchniętego tagu
- Ta ścieżka SHA służy tylko do walidacji i nie może zostać promowana do rzeczywistej publikacji
- W trybie SHA workflow syntetyzuje `v<package.json version>` tylko na potrzeby
  sprawdzenia metadanych pakietu; rzeczywista publikacja nadal wymaga prawdziwego tagu wydania
- Oba workflow utrzymują rzeczywistą ścieżkę publikacji i promocji na runnerach
  hostowanych przez GitHub, podczas gdy niemutująca ścieżka walidacji może używać większych
  runnerów Blacksmith Linux
- Ten workflow uruchamia
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  używając sekretów workflow `OPENAI_API_KEY` i `ANTHROPIC_API_KEY`
- Preflight wydania npm nie czeka już na osobną ścieżkę sprawdzeń wydania
- Przed lokalnym tagowaniem kandydata wydania uruchom
  `RELEASE_TAG=vYYYY.M.D-beta.N pnpm release:fast-pretag-check`. Helper
  uruchamia szybkie zabezpieczenia wydania, sprawdzenia wydań pluginów npm/ClawHub, build,
  build UI i `release:openclaw:npm:check` w kolejności, która wyłapuje typowe
  błędy blokujące zatwierdzenie przed startem workflow publikacji GitHub.
- Uruchom `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (albo odpowiadający tag beta/korekty) przed zatwierdzeniem
- Po publikacji npm uruchom
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (albo odpowiadającą wersję beta/korekty), aby zweryfikować opublikowaną ścieżkę
  instalacji z rejestru w świeżym tymczasowym prefiksie
- Po publikacji beta uruchom `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  aby zweryfikować onboarding zainstalowanego pakietu, konfigurację Telegram i rzeczywiste Telegram E2E
  względem opublikowanego pakietu npm z użyciem wspólnej dzierżawionej puli poświadczeń
  Telegram. Lokalne jednorazowe uruchomienia maintainerów mogą pominąć zmienne Convex i przekazać trzy
  poświadczenia środowiskowe `OPENCLAW_QA_TELEGRAM_*` bezpośrednio.
- Aby uruchomić pełny post-publish beta smoke z maszyny maintainera, użyj `pnpm release:beta-smoke -- --beta betaN`. Helper uruchamia walidację aktualizacji npm w Parallels/świeżego celu, dispatchuje `NPM Telegram Beta E2E`, odpytuje dokładny przebieg workflow, pobiera artefakt i wypisuje raport Telegram.
- Maintainerzy mogą uruchomić to samo sprawdzenie post-publish z GitHub Actions przez
  ręczny workflow `NPM Telegram Beta E2E`. Jest celowo tylko ręczny i
  nie uruchamia się przy każdym merge.
- Automatyzacja wydań maintainerów używa teraz schematu preflight-then-promote:
  - rzeczywista publikacja npm musi przejść udany npm `preflight_run_id`
  - rzeczywista publikacja npm musi być dispatchowana z tej samej gałęzi `main` albo
    `release/YYYY.M.D` co udany przebieg preflight
  - stabilne wydania npm domyślnie trafiają na `beta`
  - stabilna publikacja npm może jawnie celować w `latest` przez wejście workflow
  - mutacja dist-tag npm oparta na tokenie znajduje się teraz w
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
    ze względów bezpieczeństwa, ponieważ `npm dist-tag add` nadal wymaga `NPM_TOKEN`, podczas gdy
    publiczne repo zachowuje publikację wyłącznie OIDC
  - publiczne `macOS Release` służy tylko do walidacji; gdy tag istnieje tylko na
    gałęzi release, ale workflow jest dispatchowany z `main`, ustaw
    `public_release_branch=release/YYYY.M.D`
  - rzeczywista prywatna publikacja mac musi przejść udane prywatne mac
    `preflight_run_id` i `validate_run_id`
  - rzeczywiste ścieżki publikacji promują przygotowane artefakty zamiast ponownie je budować
- Dla stabilnych wydań korekcyjnych takich jak `YYYY.M.D-N` weryfikator post-publish
  sprawdza także tę samą ścieżkę aktualizacji w tymczasowym prefiksie z `YYYY.M.D` do `YYYY.M.D-N`,
  aby korekty wydania nie mogły po cichu pozostawić starszych globalnych instalacji na
  bazowym stabilnym payloadzie
- Preflight wydania npm kończy się niepowodzeniem w trybie zamkniętym, chyba że tarball zawiera zarówno
  `dist/control-ui/index.html`, jak i niepusty payload `dist/control-ui/assets/`,
  abyśmy ponownie nie wysłali pustego dashboardu przeglądarkowego
- Weryfikacja post-publish sprawdza też, czy opublikowane entrypointy pluginów i
  metadane pakietu są obecne w zainstalowanym układzie z rejestru. Wydanie, które
  wysyła brakujące payloady runtime pluginów, nie przechodzi weryfikatora postpublish i
  nie może zostać promowane do `latest`.
- `pnpm test:install:smoke` egzekwuje też budżet `unpackedSize` npm pack dla
  tarballa kandydata aktualizacji, więc installer e2e wychwytuje przypadkowy rozrost pakietu
  przed ścieżką publikacji wydania
- Jeśli prace nad wydaniem dotknęły planowania CI, manifestów czasów rozszerzeń albo
  macierzy testów rozszerzeń, wygeneruj ponownie i przejrzyj zarządzane przez planner
  wyjścia macierzy `plugin-prerelease-extension-shard` z
  `.github/workflows/plugin-prerelease.yml` przed zatwierdzeniem, aby notatki wydania nie
  opisywały nieaktualnego układu CI
- Gotowość stabilnego wydania macOS obejmuje też powierzchnie aktualizatora:
  - wydanie GitHub musi finalnie zawierać spakowane `.zip`, `.dmg` i `.dSYM.zip`
  - `appcast.xml` na `main` musi wskazywać nowy stabilny zip po publikacji; prywatny
    workflow publikacji macOS commituje go automatycznie albo otwiera PR appcast,
    gdy bezpośredni push jest zablokowany
  - spakowana aplikacja musi zachować nie-debugowy identyfikator bundle, niepusty adres URL feedu
    Sparkle i `CFBundleVersion` na poziomie lub powyżej kanonicznego minimalnego builda Sparkle
    dla tej wersji wydania

## Testowe środowiska wydania

`Full Release Validation` to sposób, w jaki operatorzy uruchamiają wszystkie testy przedwydaniowe z jednego punktu wejścia. Aby uzyskać dowód przypiętego commita na szybko zmieniającej się gałęzi, użyj helpera, żeby każdy workflow podrzędny działał z tymczasowej gałęzi ustawionej na docelowy SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper wypycha `release-ci/<sha>-...`, uruchamia `Full Release Validation` z tej gałęzi z `ref=<sha>`, weryfikuje, że każdy `headSha` workflow podrzędnego pasuje do celu, a następnie usuwa tymczasową gałąź. Zapobiega to przypadkowemu udowodnieniu nowszego uruchomienia podrzędnego z `main`.

Do walidacji gałęzi wydania lub tagu uruchom go z zaufanego refa workflow `main` i przekaż gałąź wydania lub tag jako `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow rozwiązuje docelowy ref, uruchamia ręczny `CI` z `target_ref=<release-ref>`, uruchamia `OpenClaw Release Checks`, przygotowuje nadrzędny artefakt `release-package-under-test` dla kontroli dotyczących pakietu oraz uruchamia samodzielne pakietowe Telegram E2E, gdy `release_profile=full` z `rerun_group=all` albo gdy ustawiono `release_package_spec` lub `npm_telegram_package_spec`. `OpenClaw Release Checks` następnie rozgałęzia się na smoke test instalacji, międzyplatformowe kontrole wydania, live/E2E pokrycie ścieżki wydania Docker, gdy soak jest włączony, Package Acceptance z QA pakietu Telegram, parytet QA Lab, live Matrix i live Telegram. Pełne uruchomienie jest akceptowalne tylko wtedy, gdy podsumowanie `Full Release Validation` pokazuje `normal_ci` i `release_checks` jako zakończone sukcesem. W trybie full/all dziecko `npm_telegram` również musi zakończyć się sukcesem; poza full/all jest pomijane, chyba że podano opublikowany `release_package_spec` lub `npm_telegram_package_spec`. Końcowe podsumowanie weryfikatora zawiera tabele najwolniejszych zadań dla każdego uruchomienia podrzędnego, dzięki czemu menedżer wydania może zobaczyć aktualną ścieżkę krytyczną bez pobierania logów.
Zobacz [Pełna walidacja wydania](/pl/reference/full-release-validation), aby poznać kompletną macierz etapów, dokładne nazwy zadań workflow, różnice między profilami stable i full, artefakty oraz uchwyty do skoncentrowionych ponownych uruchomień.
Workflow podrzędne są uruchamiane z zaufanego refa, który uruchamia `Full Release Validation`, zwykle `--ref main`, nawet gdy docelowy `ref` wskazuje starszą gałąź wydania lub tag. Nie ma osobnego wejścia refa workflow Full Release Validation; wybierz zaufany harness, wybierając ref uruchomienia workflow.
Nie używaj `--ref main -f ref=<sha>` dla dokładnego dowodu commita na zmieniającym się `main`; surowe SHA commitów nie mogą być refami workflow dispatch, więc użyj `pnpm ci:full-release --sha <sha>`, aby utworzyć przypiętą tymczasową gałąź.

Użyj `release_profile`, aby wybrać zakres live/providera:

- `minimum`: najszybsza ścieżka release-critical OpenAI/core live i Docker
- `stable`: minimum plus stabilne pokrycie provider/backend do zatwierdzenia wydania
- `full`: stable plus szerokie doradcze pokrycie provider/media

Użyj `run_release_soak=true` z `stable`, gdy pasy blokujące wydanie są zielone i chcesz wykonać wyczerpujące live/E2E, ścieżkę wydania Docker oraz ograniczony sweep przetrwania aktualizacji opublikowanych pakietów przed promocją. Ten sweep obejmuje najnowsze cztery stabilne pakiety oraz przypięte baseline’y `2026.4.23` i `2026.5.2`, a także starsze pokrycie `2026.4.15`, z usuniętymi duplikatami baseline’ów i każdym baseline’em podzielonym na własne zadanie runnera Docker. `full` implikuje `run_release_soak=true`.

`OpenClaw Release Checks` używa zaufanego refa workflow, aby raz rozwiązać docelowy ref jako `release-package-under-test`, i ponownie używa tego artefaktu w kontrolach cross-OS, Package Acceptance oraz release-path Docker, gdy działa soak. Dzięki temu wszystkie środowiska dotyczące pakietu używają tych samych bajtów i unika się powtarzanych buildów pakietu.
Po tym, jak beta jest już w npm, ustaw `release_package_spec=openclaw@YYYY.M.D-beta.N`, aby kontrole wydania pobrały wysłany pakiet raz, wyodrębniły jego SHA źródła buildu z `dist/build-info.json` i ponownie użyły tego artefaktu dla pasów cross-OS, Package Acceptance, release-path Docker oraz pakietowego Telegram.
Smoke test instalacji OpenAI cross-OS używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy ustawiona jest zmienna repo/org, w przeciwnym razie `openai/gpt-5.4`, ponieważ ten pas dowodzi instalacji pakietu, onboardingu, uruchomienia Gateway i jednej live tury agenta, a nie benchmarkuje najwolniejszy model domyślny. Szersza macierz provider live pozostaje miejscem pokrycia specyficznego dla modelu.

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
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Nie używaj pełnego parasola jako pierwszego ponownego uruchomienia po ukierunkowanej poprawce. Jeśli jedno środowisko zawiedzie, użyj dla następnego dowodu nieudanego workflow podrzędnego, zadania, pasa Docker, profilu pakietu, providera modelu lub pasa QA. Uruchom pełny parasol ponownie tylko wtedy, gdy poprawka zmieniła współdzieloną orkiestrację wydania albo sprawiła, że wcześniejszy dowód wszystkich środowisk stał się nieaktualny. Końcowy weryfikator parasola ponownie sprawdza zapisane identyfikatory uruchomień workflow podrzędnych, więc po pomyślnym ponownym uruchomieniu workflow podrzędnego ponownie uruchom tylko nieudane zadanie nadrzędne `Verify full validation`.

Do ograniczonego odzyskiwania przekaż `rerun_group` do parasola. `all` to właściwe uruchomienie release-candidate, `ci` uruchamia tylko zwykłe dziecko CI, `plugin-prerelease` uruchamia tylko dziecko pluginu przeznaczone wyłącznie dla wydania, `release-checks` uruchamia każde środowisko wydania, a węższe grupy wydania to `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` i `npm-telegram`.
Skoncentrowane ponowne uruchomienia `npm-telegram` wymagają `release_package_spec` lub `npm_telegram_package_spec`; pełne/all uruchomienia z `release_profile=full` używają artefaktu pakietu z release-checks. Skoncentrowane ponowne uruchomienia cross-OS mogą dodać `cross_os_suite_filter=windows/packaged-upgrade` lub inny filtr OS/suite. Niepowodzenia QA release-check są doradcze; niepowodzenie tylko QA nie blokuje walidacji wydania.

### Vitest

Środowisko Vitest to ręczny workflow podrzędny `CI`. Ręczny CI celowo omija zakresowanie zmian i wymusza normalny graf testów dla release candidate: shardy Linux Node, shardy bundled-plugin, kontrakty kanałów, kompatybilność Node 22, `check`, `check-additional`, smoke test buildu, kontrole dokumentacji, Python skills, Windows, macOS, Android i i18n Control UI.

Użyj tego środowiska, aby odpowiedzieć: „czy drzewo źródłowe przeszło pełny normalny zestaw testów?” To nie to samo co walidacja produktu w ścieżce wydania. Dowody do zachowania:

- podsumowanie `Full Release Validation` pokazujące URL uruchomionego `CI`
- zielone uruchomienie `CI` na dokładnym docelowym SHA
- nazwy nieudanych lub wolnych shardów z zadań CI podczas badania regresji
- artefakty czasów Vitest, takie jak `.artifacts/vitest-shard-timings.json`, gdy uruchomienie wymaga analizy wydajności

Uruchamiaj ręczny CI bezpośrednio tylko wtedy, gdy wydanie potrzebuje deterministycznego normalnego CI, ale nie środowisk Docker, QA Lab, live, cross-OS ani pakietowych:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Środowisko Docker znajduje się w `OpenClaw Release Checks` przez `openclaw-live-and-e2e-checks-reusable.yml`, plus workflow `install-smoke` w trybie wydania. Waliduje release candidate przez spakowane środowiska Docker, a nie tylko testy na poziomie źródeł.

Pokrycie Docker wydania obejmuje:

- pełny smoke test instalacji z włączonym wolnym smoke testem globalnej instalacji Bun
- przygotowanie/ponowne użycie obrazu smoke z root Dockerfile według docelowego SHA, z zadaniami QR, root/gateway oraz installer/Bun smoke działającymi jako osobne shardy install-smoke
- pasy E2E repozytorium
- chunki release-path Docker: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` i `plugins-runtime-install-h`
- pokrycie OpenWebUI w chunku `plugins-runtime-services`, gdy jest wymagane
- podzielone pasy instalacji/deinstalacji bundled plugin
  `bundled-plugin-install-uninstall-0` do
  `bundled-plugin-install-uninstall-23`
- zestawy provider live/E2E i pokrycie modelu live Docker, gdy kontrole wydania obejmują zestawy live

Używaj artefaktów Docker przed ponownym uruchomieniem. Harmonogram release-path przesyła `.artifacts/docker-tests/` z logami pasów, `summary.json`, `failures.json`, czasami faz, JSON-em planu harmonogramu i poleceniami ponownego uruchomienia. Do skoncentrowanego odzyskiwania użyj `docker_lanes=<lane[,lane]>` w wielokrotnego użytku workflow live/E2E zamiast ponownie uruchamiać wszystkie chunki wydania. Wygenerowane polecenia ponownego uruchomienia zawierają wcześniejsze `package_artifact_run_id` i przygotowane wejścia obrazu Docker, gdy są dostępne, więc nieudany pas może ponownie użyć tego samego tarballa i obrazów GHCR.

### QA Lab

Środowisko QA Lab jest również częścią `OpenClaw Release Checks`. To brama wydania dla zachowania agentowego i poziomu kanału, oddzielna od Vitest i mechaniki pakietów Docker.

Pokrycie QA Lab wydania obejmuje:

- pas mock parity porównujący kandydujący pas OpenAI z baseline’em Opus 4.6 przy użyciu agentic parity pack
- szybki profil live Matrix QA używający środowiska `qa-live-shared`
- pas live Telegram QA używający dzierżaw poświadczeń Convex CI
- `pnpm qa:otel:smoke`, gdy telemetria wydania wymaga jawnego lokalnego dowodu

Użyj tego środowiska, aby odpowiedzieć: „czy wydanie zachowuje się poprawnie w scenariuszach QA i przepływach kanałów live?” Zachowaj URL-e artefaktów dla pasów parytetu, Matrix i Telegram podczas zatwierdzania wydania. Pełne pokrycie Matrix pozostaje dostępne jako ręczne sharded uruchomienie QA-Lab, a nie domyślny release-critical pas.

### Pakiet

Środowisko Package jest bramą instalowalnego produktu. Opiera się na `Package Acceptance` i resolverze `scripts/resolve-openclaw-package-candidate.mjs`. Resolver normalizuje kandydata do tarballa `package-under-test` używanego przez Docker E2E, waliduje inwentarz pakietu, zapisuje wersję pakietu i SHA-256 oraz utrzymuje ref harnessa workflow oddzielnie od refa źródła pakietu.

Obsługiwane źródła kandydata:

- `source=npm`: `openclaw@beta`, `openclaw@latest` lub dokładna wersja wydania OpenClaw
- `source=ref`: spakuj zaufaną gałąź `package_ref`, tag lub pełny SHA commita z wybranym harnessem `workflow_ref`
- `source=url`: pobierz HTTPS `.tgz` z wymaganym `package_sha256`
- `source=artifact`: ponownie użyj `.tgz` przesłanego przez inne uruchomienie GitHub Actions

`OpenClaw Release Checks` uruchamia Package Acceptance z `source=artifact`,
przygotowanym artefaktem pakietu wydania, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance utrzymuje migrację, aktualizację,
restart aktualizacji skonfigurowanego uwierzytelniania, instalację Skills z ClawHub na żywo, czyszczenie przestarzałych zależności pluginów, fixture’y pluginów offline, aktualizację pluginów i QA pakietu Telegram względem tego samego rozwiązanego tarballa. Blokujące kontrole wydania używają domyślnej najnowszej opublikowanej bazowej wersji pakietu; `run_release_soak=true` lub
`release_profile=full` rozszerza zakres do każdej stabilnej bazowej wersji opublikowanej w npm od
`2026.4.23` do `latest` oraz fixture’ów zgłoszonych problemów. Użyj
Package Acceptance z `source=npm` dla kandydata, który został już wydany, albo
`source=ref`/`source=artifact` dla lokalnego tarballa npm opartego na SHA przed
publikacją. To natywny dla GitHuba zamiennik większości pokrycia pakietów/aktualizacji, które wcześniej wymagało Parallels. Kontrole wydania między systemami operacyjnymi nadal są ważne dla specyficznego dla OS onboardingu, instalatora i zachowania platformy, ale walidacja produktu pakiet/aktualizacja powinna preferować Package Acceptance.

Kanoniczna lista kontrolna walidacji aktualizacji i pluginów to
[Testing updates and plugins](/pl/help/testing-updates-plugins). Używaj jej przy
decydowaniu, który lokalny, Dockerowy, Package Acceptance albo wydaniowy lane potwierdza zmianę instalacji/aktualizacji pluginu, czyszczenia przez doctor albo migracji opublikowanego pakietu.
Wyczerpująca migracja opublikowanych aktualizacji z każdego stabilnego pakietu `2026.4.23+` jest
osobnym ręcznym workflow `Update Migration`, a nie częścią Full Release CI.

Łagodność starszego package-acceptance jest celowo ograniczona czasowo. Pakiety do
`2026.4.25` mogą używać ścieżki zgodności dla luk metadanych już opublikowanych
w npm: prywatnych wpisów inwentarza QA brakujących w tarballu, brakującego
`gateway install --wrapper`, brakujących plików patchy w fixture git
pochodzącym z tarballa, brakującego utrwalonego `update.channel`, starszych lokalizacji rekordów instalacji pluginów, brakującej trwałości rekordów instalacji marketplace oraz migracji metadanych konfiguracji podczas `plugins update`. Opublikowany pakiet `2026.4.26` może ostrzegać
o plikach znaczników metadanych lokalnej kompilacji, które zostały już wydane. Późniejsze pakiety
muszą spełniać nowoczesne kontrakty pakietów; te same luki powodują niepowodzenie walidacji
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

- `smoke`: szybkie lane’y instalacji pakietu/kanału/agenta, sieci Gateway i
  przeładowania konfiguracji
- `package`: kontrakty pakietu instalacji/aktualizacji/restartu/pluginów oraz dowód instalacji Skills z ClawHub na żywo; to domyślna wartość kontroli wydania
- `product`: `package` plus kanały MCP, czyszczenie cron/subagent, wyszukiwanie w sieci OpenAI i OpenWebUI
- `full`: Dockerowe fragmenty ścieżki wydania z OpenWebUI
- `custom`: dokładna lista `docker_lanes` do ukierunkowanych ponownych uruchomień

Dla dowodu Telegram kandydata pakietu włącz `telegram_mode=mock-openai` albo
`telegram_mode=live-frontier` w Package Acceptance. Workflow przekazuje
rozwiązany tarball `package-under-test` do lane’u Telegram; samodzielny
workflow Telegram nadal akceptuje opublikowaną specyfikację npm dla kontroli po publikacji.

## Automatyzacja publikacji wydania

`OpenClaw Release Publish` jest standardowym mutującym punktem wejścia publikacji. Orkiestruje workflow zaufanego publikatora w kolejności potrzebnej wydaniu:

1. Pobierz tag wydania i rozwiąż jego commit SHA.
2. Zweryfikuj, że tag jest osiągalny z `main` albo `release/*`.
3. Uruchom `pnpm plugins:sync:check`.
4. Wyślij `Plugin NPM Release` z `publish_scope=all-publishable` i
   `ref=<release-sha>`.
5. Wyślij `Plugin ClawHub Release` z tym samym zakresem i SHA.
6. Wyślij `OpenClaw NPM Release` z tagiem wydania, dist-tag npm i
   zapisanym `preflight_run_id`.

Przykład publikacji beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Stabilna publikacja do domyślnego dist-tag beta:

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
tylko do ukierunkowanej naprawy albo ponownej publikacji. Dla wybranej naprawy pluginu przekaż
`plugin_publish_scope=selected` i `plugins=@openclaw/name` do
`OpenClaw Release Publish` albo wyślij workflow podrzędny bezpośrednio, gdy
pakiet OpenClaw nie może zostać opublikowany.

## Dane wejściowe workflow NPM

`OpenClaw NPM Release` akceptuje te dane wejściowe kontrolowane przez operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1` albo
  `v2026.4.2-beta.1`; gdy `preflight_only=true`, może to być również bieżący
  pełny 40-znakowy commit SHA gałęzi workflow dla preflight tylko walidacyjnego
- `preflight_only`: `true` dla samej walidacji/kompilacji/pakowania, `false` dla
  rzeczywistej ścieżki publikacji
- `preflight_run_id`: wymagane w rzeczywistej ścieżce publikacji, aby workflow ponownie użył
  przygotowanego tarballa z udanego przebiegu preflight
- `npm_dist_tag`: docelowy tag npm dla ścieżki publikacji; domyślnie `beta`

`OpenClaw Release Publish` akceptuje te dane wejściowe kontrolowane przez operatora:

- `tag`: wymagany tag wydania; musi już istnieć
- `preflight_run_id`: id udanego przebiegu preflight `OpenClaw NPM Release`;
  wymagane, gdy `publish_openclaw_npm=true`
- `npm_dist_tag`: docelowy tag npm dla pakietu OpenClaw
- `plugin_publish_scope`: domyślnie `all-publishable`; używaj `selected` tylko
  do ukierunkowanych napraw
- `plugins`: oddzielone przecinkami nazwy pakietów `@openclaw/*`, gdy
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: domyślnie `true`; ustaw `false` tylko wtedy, gdy używasz
  workflow jako orkiestratora napraw wyłącznie pluginów
- `wait_for_clawhub`: domyślnie `false`, aby dostępność npm nie była blokowana przez
  sidecar ClawHub; ustaw `true` tylko wtedy, gdy ukończenie workflow musi obejmować
  ukończenie ClawHub

`OpenClaw Release Checks` akceptuje te dane wejściowe kontrolowane przez operatora:

- `ref`: gałąź, tag albo pełny commit SHA do walidacji. Kontrole zawierające sekrety
  wymagają, aby rozwiązany commit był osiągalny z gałęzi OpenClaw albo
  tagu wydania.
- `run_release_soak`: włącza wyczerpujący soak live/E2E, Dockerową ścieżkę wydania oraz
  all-since upgrade-survivor w stabilnych/domyślnych kontrolach wydania. Jest wymuszane
  przez `release_profile=full`.

Zasady:

- Tagi stabilne i korygujące mogą publikować do `beta` albo `latest`
- Tagi prerelease beta mogą publikować tylko do `beta`
- Dla `OpenClaw NPM Release` pełny commit SHA jest dozwolony tylko wtedy, gdy
  `preflight_only=true`
- `OpenClaw Release Checks` i `Full Release Validation` zawsze są
  wyłącznie walidacyjne
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, którego użyto podczas preflight;
  workflow weryfikuje te metadane przed kontynuowaniem publikacji

## Sekwencja stabilnego wydania npm

Podczas przygotowywania stabilnego wydania npm:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`
   - Zanim tag będzie istnieć, możesz użyć bieżącego pełnego commit SHA gałęzi workflow
     do walidacyjnego suchego przebiegu workflow preflight
2. Wybierz `npm_dist_tag=beta` dla normalnego przepływu najpierw-beta albo `latest` tylko
   wtedy, gdy celowo chcesz bezpośredniej stabilnej publikacji
3. Uruchom `Full Release Validation` na gałęzi wydania, tagu wydania albo pełnym
   commit SHA, gdy chcesz uzyskać normalne CI oraz pokrycie live prompt cache, Docker, QA Lab,
   Matrix i Telegram z jednego ręcznego workflow
4. Jeśli celowo potrzebujesz tylko deterministycznego zwykłego grafu testów, uruchom
   ręczny workflow `CI` na refie wydania
5. Zapisz udany `preflight_run_id`
6. Uruchom `OpenClaw Release Publish` z tym samym `tag`, tym samym `npm_dist_tag`
   i zapisanym `preflight_run_id`; publikuje zewnętrzne pluginy do npm
   i ClawHub przed promowaniem pakietu npm OpenClaw
7. Jeśli wydanie trafiło na `beta`, użyj prywatnego workflow
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`,
   aby wypromować tę stabilną wersję z `beta` do `latest`
8. Jeśli wydanie celowo opublikowano bezpośrednio do `latest`, a `beta`
   powinna natychmiast wskazywać tę samą stabilną kompilację, użyj tego samego prywatnego
   workflow, aby skierować oba dist-tags na stabilną wersję, albo pozwól, by później zrobiła to jego zaplanowana synchronizacja samonaprawcza

Mutacja dist-tag znajduje się w prywatnym repozytorium ze względów bezpieczeństwa, ponieważ nadal
wymaga `NPM_TOKEN`, podczas gdy publiczne repozytorium zachowuje publikację wyłącznie przez OIDC.

Dzięki temu zarówno bezpośrednia ścieżka publikacji, jak i ścieżka promocji najpierw-beta
pozostają udokumentowane i widoczne dla operatora.

Jeśli maintainer musi wrócić do lokalnego uwierzytelniania npm, uruchamiaj wszystkie polecenia CLI 1Password
(`op`) tylko w dedykowanej sesji tmux. Nie wywołuj `op`
bezpośrednio z głównej powłoki agenta; trzymanie go w tmux sprawia, że prompty,
alerty i obsługa OTP są obserwowalne oraz zapobiega powtarzającym się alertom hosta.

## Odwołania publiczne

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
jako właściwej instrukcji wykonania.

## Powiązane

- [Kanały wydań](/pl/install/development-channels)
