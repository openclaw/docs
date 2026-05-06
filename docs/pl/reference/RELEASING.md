---
read_when:
    - Szukanie definicji publicznych kanałów wydań
    - Uruchamianie walidacji wydania lub akceptacji pakietu
    - Szukasz nazewnictwa wersji i cyklu wydań
summary: Ścieżki wydań, lista kontrolna operatora, środowiska walidacyjne, nazewnictwo wersji i cykl
title: Polityka wydań
x-i18n:
    generated_at: "2026-05-06T10:05:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ma trzy publiczne ścieżki wydań:

- stable: oznaczone tagami wydania, które domyślnie publikują do npm `beta`, albo do npm `latest`, gdy zostanie to jawnie zażądane
- beta: tagi przedwydaniowe, które publikują do npm `beta`
- dev: ruchoma głowica `main`

## Nazewnictwo wersji

- Wersja wydania stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Wersja wydania poprawkowego stable: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Wersja przedwydaniowa beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Nie dodawaj zer wiodących do miesiąca ani dnia
- `latest` oznacza aktualne promowane wydanie stable w npm
- `beta` oznacza aktualny cel instalacji beta
- Wydania stable i poprawkowe stable domyślnie publikują do npm `beta`; operatorzy wydania mogą jawnie wskazać `latest` albo później promować zweryfikowaną kompilację beta
- Każde wydanie stable OpenClaw dostarcza razem pakiet npm i aplikację macOS;
  wydania beta zwykle najpierw weryfikują i publikują ścieżkę npm/pakietu, a
  kompilacja/podpisywanie/notaryzacja aplikacji mac jest zarezerwowana dla wydań stable, chyba że zostanie jawnie zażądana

## Rytm wydań

- Wydania przechodzą najpierw przez beta
- Stable następuje dopiero po zweryfikowaniu najnowszej beta
- Maintainerzy zwykle przygotowują wydania z gałęzi `release/YYYY.M.D` utworzonej
  z aktualnego `main`, aby walidacja wydania i poprawki nie blokowały nowego
  rozwoju na `main`
- Jeśli tag beta został wypchnięty lub opublikowany i wymaga poprawki, maintainerzy tworzą
  następny tag `-beta.N` zamiast usuwać albo odtwarzać stary tag beta
- Szczegółowa procedura wydania, zatwierdzenia, poświadczenia i notatki odzyskiwania są
  dostępne tylko dla maintainerów

## Lista kontrolna operatora wydania

Ta lista kontrolna pokazuje publiczny kształt przepływu wydania. Prywatne poświadczenia,
podpisywanie, notaryzacja, odzyskiwanie dist-tag i szczegóły awaryjnego wycofania pozostają w
runbooku wydania dostępnym tylko dla maintainerów.

1. Zacznij od aktualnego `main`: pobierz najnowsze zmiany, potwierdź, że docelowy commit jest wypchnięty,
   i potwierdź, że bieżące CI `main` jest wystarczająco zielone, aby utworzyć z niego gałąź.
2. Przepisz najwyższą sekcję `CHANGELOG.md` na podstawie rzeczywistej historii commitów za pomocą
   `/changelog`, zachowaj wpisy zorientowane na użytkownika, commituj ją, wypchnij i wykonaj rebase/pull
   jeszcze raz przed utworzeniem gałęzi.
3. Przejrzyj rekordy kompatybilności wydania w
   `src/plugins/compat/registry.ts` i
   `src/commands/doctor/shared/deprecation-compat.ts`. Usuń wygasłą
   kompatybilność tylko wtedy, gdy ścieżka aktualizacji pozostaje pokryta, albo zapisz, dlaczego jest
   celowo utrzymywana.
4. Utwórz `release/YYYY.M.D` z aktualnego `main`; nie wykonuj normalnej pracy nad wydaniem
   bezpośrednio na `main`.
5. Podbij każdą wymaganą lokalizację wersji dla zamierzonego tagu, uruchom
   `pnpm plugins:sync`, aby publikowalne pakiety Plugin miały wspólną wersję wydania
   i metadane kompatybilności, a następnie uruchom lokalny deterministyczny preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` i
   `pnpm release:check`.
6. Uruchom `OpenClaw NPM Release` z `preflight_only=true`. Zanim tag istnieje,
   pełny 40-znakowy SHA gałęzi wydania jest dozwolony tylko do walidacji
   preflight. Zapisz udany `preflight_run_id`.
7. Uruchom wszystkie testy przedwydaniowe za pomocą `Full Release Validation` dla
   gałęzi wydania, tagu albo pełnego SHA commita. To jest jeden ręczny punkt wejścia
   dla czterech dużych testowych środowisk wydania: Vitest, Docker, QA Lab i Package.
8. Jeśli walidacja się nie powiedzie, napraw problem na gałęzi wydania i ponownie uruchom najmniejszy nieudany
   plik, ścieżkę, zadanie workflow, profil pakietu, providera albo allowlistę modeli, która
   potwierdza poprawkę. Ponownie uruchom pełny parasol tylko wtedy, gdy zmieniona powierzchnia sprawia,
   że wcześniejsze dowody są nieaktualne.
9. Dla beta otaguj `vYYYY.M.D-beta.N`, a następnie uruchom `OpenClaw Release Publish` z
   pasującej gałęzi `release/YYYY.M.D`. Weryfikuje `pnpm plugins:sync:check`,
   wysyła wszystkie publikowalne pakiety Plugin do npm i ten sam zestaw do
   ClawHub równolegle, a następnie promuje przygotowany artefakt preflight OpenClaw npm
   z pasującym dist-tag, gdy tylko publikacja pakietów Plugin do npm się powiedzie.
   Publikacja do ClawHub może nadal trwać, gdy OpenClaw npm jest publikowany, ale
   workflow publikacji wydania nie kończy się, dopóki obie ścieżki publikacji pakietów Plugin i
   ścieżka publikacji OpenClaw npm nie zakończą się pomyślnie. Po publikacji uruchom
   akceptację pakietu po publikacji
   względem opublikowanego pakietu `openclaw@YYYY.M.D-beta.N` albo
   `openclaw@beta`. Jeśli wypchnięte albo opublikowane wydanie przedwydaniowe wymaga poprawki,
   utwórz następny pasujący numer przedwydaniowy; nie usuwaj ani nie przepisuj starego
   wydania przedwydaniowego.
10. Dla stable kontynuuj dopiero wtedy, gdy zweryfikowana beta albo kandydat wydania ma
    wymagane dowody walidacji. Publikacja stable do npm również przechodzi przez
    `OpenClaw Release Publish`, ponownie używając udanego artefaktu preflight przez
    `preflight_run_id`; gotowość wydania stable na macOS wymaga też
    spakowanych `.zip`, `.dmg`, `.dSYM.zip` oraz zaktualizowanego `appcast.xml` na `main`.
11. Po publikacji uruchom weryfikator npm po publikacji, opcjonalne samodzielne
    opublikowane-npm Telegram E2E, gdy potrzebujesz dowodu kanału po publikacji,
    promocję dist-tag, gdy jest potrzebna, notatki wydania/przedwydania GitHub z
    kompletnej pasującej sekcji `CHANGELOG.md` oraz kroki ogłoszenia wydania.

## Preflight wydania

- Uruchom `pnpm check:test-types` przed kontrolą wstępną wydania, aby testowy TypeScript pozostał
  objęty sprawdzaniem poza szybszą lokalną bramką `pnpm check`
- Uruchom `pnpm check:architecture` przed kontrolą wstępną wydania, aby szersze
  sprawdzanie cykli importów i granic architektury było zielone poza szybszą lokalną bramką
- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane
  artefakty wydania `dist/*` i pakiet Control UI istniały dla kroku
  walidacji paczki
- Uruchom `pnpm plugins:sync` po podbiciu wersji w katalogu głównym i przed tagowaniem. Aktualizuje
  wersje publikowalnych pakietów pluginów, metadane zgodności OpenClaw peer/API,
  metadane kompilacji oraz szkielety dzienników zmian pluginów, aby pasowały do wersji
  wydania rdzenia. `pnpm plugins:sync:check` to niemodyfikująca bramka wydania;
  przepływ publikowania zawiedzie przed jakąkolwiek mutacją rejestru, jeśli ten krok został
  pominięty.
- Uruchom ręczny przepływ pracy `Full Release Validation` przed zatwierdzeniem wydania, aby
  uruchomić wszystkie przedwydaniowe środowiska testowe z jednego punktu wejścia. Przyjmuje gałąź,
  tag albo pełny SHA commita, uruchamia ręczny `CI` oraz uruchamia
  `OpenClaw Release Checks` dla smoke testu instalacji, akceptacji pakietu, międzyplatformowych
  sprawdzeń pakietów, zgodności QA Lab, ścieżek Matrix i Telegram. Stabilne/domyślne uruchomienia
  trzymają wyczerpujące live/E2E i soak ścieżki wydania Docker za
  `run_release_soak=true`; `release_profile=full` wymusza soak. Z
  `release_profile=full` i `rerun_group=all` uruchamia też pakietowe Telegram
  E2E względem artefaktu `release-package-under-test` ze sprawdzeń wydania.
  Podaj `npm_telegram_package_spec` po publikacji, gdy to samo
  Telegram E2E ma też potwierdzić opublikowany pakiet npm. Podaj
  `package_acceptance_package_spec` po publikacji, gdy Package Acceptance
  ma uruchomić swoją macierz pakietu/aktualizacji względem wysłanego pakietu npm zamiast
  artefaktu zbudowanego z SHA. Podaj
  `evidence_package_spec`, gdy prywatny raport dowodowy ma potwierdzić, że
  walidacja odpowiada opublikowanemu pakietowi npm bez wymuszania Telegram E2E.
  Przykład:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Uruchom ręczny przepływ pracy `Package Acceptance`, gdy chcesz uzyskać dowód kanałem bocznym
  dla kandydata pakietu, podczas gdy prace nad wydaniem trwają dalej. Użyj `source=npm` dla
  `openclaw@beta`, `openclaw@latest` albo dokładnej wersji wydania; `source=ref`
  do spakowania zaufanej gałęzi/tagu/SHA `package_ref` z bieżącą
  uprzężą `workflow_ref`; `source=url` dla tarballa HTTPS z wymaganym
  SHA-256; albo `source=artifact` dla tarballa przesłanego przez inne uruchomienie GitHub
  Actions. Przepływ pracy rozwiązuje kandydata do
  `package-under-test`, ponownie używa harmonogramu wydania Docker E2E względem tego
  tarballa i może uruchomić QA Telegram względem tego samego tarballa z
  `telegram_mode=mock-openai` albo `telegram_mode=live-frontier`. Gdy
  wybrane ścieżki Docker obejmują `published-upgrade-survivor`, artefakt
  pakietu jest kandydatem, a `published_upgrade_survivor_baseline` wybiera
  opublikowaną bazę. `update-restart-auth` używa pakietu kandydującego jako
  zarówno zainstalowanego CLI, jak i package-under-test, więc ćwiczy ścieżkę
  zarządzanego restartu polecenia aktualizacji kandydata.
  Przykład: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Typowe profile:
  - `smoke`: ścieżki instalacji/kanału/agenta, sieci Gateway i przeładowania konfiguracji
  - `package`: natywne dla artefaktu ścieżki pakietu/aktualizacji/restartu/pluginów bez OpenWebUI ani live ClawHub
  - `product`: profil pakietowy oraz kanały MCP, czyszczenie cron/subagenta,
    wyszukiwanie webowe OpenAI i OpenWebUI
  - `full`: fragmenty ścieżki wydania Docker z OpenWebUI
  - `custom`: dokładny wybór `docker_lanes` dla skoncentrowionego ponownego uruchomienia
- Uruchom ręczny przepływ pracy `CI` bezpośrednio, gdy potrzebujesz tylko pełnego normalnego
  pokrycia CI dla kandydata wydania. Ręczne uruchomienia CI omijają zakresowanie według zmian
  i wymuszają shardy Linux Node, shardy pakietowych pluginów, kontrakty kanałów,
  zgodność Node 22, `check`, `check-additional`, smoke test kompilacji,
  sprawdzenia dokumentacji, Python skills, Windows, macOS, Android oraz ścieżki i18n
  Control UI.
  Przykład: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Uruchom `pnpm qa:otel:smoke` podczas walidacji telemetrii wydania. Ćwiczy
  QA-lab przez lokalny odbiornik OTLP/HTTP i weryfikuje wyeksportowane nazwy spanów
  śladu, ograniczone atrybuty oraz redakcję treści/identyfikatorów bez
  wymagania Opik, Langfuse ani innego zewnętrznego kolektora.
- Uruchom `pnpm release:check` przed każdym otagowanym wydaniem
- Uruchom `OpenClaw Release Publish` dla modyfikującej sekwencji publikowania po
  utworzeniu tagu. Uruchom go z `release/YYYY.M.D` (albo `main`, gdy publikujesz
  tag osiągalny z main), przekaż tag wydania i udany `preflight_run_id` npm
  OpenClaw oraz pozostaw domyślny zakres publikacji pluginów
  `all-publishable`, chyba że celowo uruchamiasz skoncentrowaną naprawę. Ten
  przepływ pracy serializuje publikację pluginów npm, publikację pluginów ClawHub i publikację npm OpenClaw,
  aby pakiet rdzenia nie został opublikowany przed swoimi zewnętrznymi
  pluginami.
- Sprawdzenia wydania działają teraz w oddzielnym ręcznym przepływie pracy:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` uruchamia też ścieżkę zgodności mock QA Lab oraz szybki
  profil live Matrix i ścieżkę QA Telegram przed zatwierdzeniem wydania. Ścieżki live
  używają środowiska `qa-live-shared`; Telegram używa też dzierżaw poświadczeń Convex CI.
  Uruchom ręczny przepływ pracy `QA-Lab - All Lanes` z
  `matrix_profile=all` i `matrix_shards=true`, gdy chcesz pełny inwentarz transportu,
  mediów i E2EE Matrix równolegle.
- Walidacja uruchomieniowa instalacji i aktualizacji między systemami jest częścią publicznych
  `OpenClaw Release Checks` i `Full Release Validation`, które wywołują
  bezpośrednio wielokrotnego użytku przepływ pracy
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Ten podział jest celowy: utrzymuje prawdziwą ścieżkę wydania npm krótką,
  deterministyczną i skupioną na artefaktach, a wolniejsze sprawdzenia live pozostawia
  w ich własnej ścieżce, aby nie wstrzymywały ani nie blokowały publikacji
- Sprawdzenia wydania zawierające sekrety powinny być uruchamiane przez `Full Release
Validation` albo z referencji przepływu pracy `main`/wydania, aby logika przepływu pracy i
  sekrety pozostały kontrolowane
- `OpenClaw Release Checks` przyjmuje gałąź, tag albo pełny SHA commita, o ile
  rozwiązany commit jest osiągalny z gałęzi OpenClaw lub tagu wydania
- Walidacyjna tylko kontrola wstępna `OpenClaw NPM Release` przyjmuje też bieżący
  pełny 40-znakowy SHA commita gałęzi przepływu pracy bez wymagania wypchniętego tagu
- Ta ścieżka SHA służy tylko do walidacji i nie może zostać awansowana do prawdziwej publikacji
- W trybie SHA przepływ pracy syntetyzuje `v<package.json version>` tylko na potrzeby
  sprawdzenia metadanych pakietu; prawdziwa publikacja nadal wymaga prawdziwego tagu wydania
- Oba przepływy pracy trzymają prawdziwą ścieżkę publikacji i promocji na runnerach
  hostowanych przez GitHub, podczas gdy niemodyfikująca ścieżka walidacji może używać większych
  runnerów Blacksmith Linux
- Ten przepływ pracy uruchamia
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  z użyciem sekretów przepływu pracy `OPENAI_API_KEY` i `ANTHROPIC_API_KEY`
- Kontrola wstępna wydania npm nie czeka już na oddzielną ścieżkę sprawdzeń wydania
- Uruchom `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (albo odpowiadający tag beta/korekty) przed zatwierdzeniem
- Po publikacji npm uruchom
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (albo odpowiadającą wersję beta/korekty), aby zweryfikować ścieżkę instalacji z opublikowanego rejestru
  w świeżym tymczasowym prefiksie
- Po publikacji beta uruchom `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`,
  aby zweryfikować onboarding zainstalowanego pakietu, konfigurację Telegram oraz prawdziwe Telegram E2E
  względem opublikowanego pakietu npm z użyciem współdzielonej puli dzierżawionych poświadczeń Telegram.
  Lokalne jednorazowe uruchomienia maintainerów mogą pominąć zmienne Convex i przekazać trzy
  poświadczenia środowiskowe `OPENCLAW_QA_TELEGRAM_*` bezpośrednio.
- Aby uruchomić pełny smoke test beta po publikacji z maszyny maintainera, użyj `pnpm release:beta-smoke -- --beta betaN`. Helper uruchamia walidację aktualizacji npm Parallels/świeżego celu, uruchamia `NPM Telegram Beta E2E`, odpytuje dokładne uruchomienie przepływu pracy, pobiera artefakt i wypisuje raport Telegram.
- Maintainerzy mogą uruchomić to samo sprawdzenie po publikacji z GitHub Actions przez
  ręczny przepływ pracy `NPM Telegram Beta E2E`. Jest celowo wyłącznie ręczny i
  nie działa przy każdym scaleniu.
- Automatyzacja wydań maintainerów używa teraz modelu kontrola wstępna, potem promocja:
  - prawdziwa publikacja npm musi przejść udany `preflight_run_id` npm
  - prawdziwa publikacja npm musi zostać uruchomiona z tej samej gałęzi `main` lub
    `release/YYYY.M.D` co udane uruchomienie kontroli wstępnej
  - stabilne wydania npm domyślnie używają `beta`
  - stabilna publikacja npm może jawnie celować w `latest` przez wejście przepływu pracy
  - mutacja npm dist-tag oparta na tokenie znajduje się teraz w
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    ze względów bezpieczeństwa, ponieważ `npm dist-tag add` nadal potrzebuje `NPM_TOKEN`, podczas gdy
    publiczne repo zachowuje publikację wyłącznie przez OIDC
  - publiczny `macOS Release` służy tylko do walidacji; gdy tag istnieje tylko na
    gałęzi wydania, ale przepływ pracy jest uruchamiany z `main`, ustaw
    `public_release_branch=release/YYYY.M.D`
  - prawdziwa prywatna publikacja mac musi przejść udane prywatne mac
    `preflight_run_id` i `validate_run_id`
  - prawdziwe ścieżki publikacji promują przygotowane artefakty zamiast budować
    je ponownie
- Dla stabilnych wydań korekcyjnych takich jak `YYYY.M.D-N` weryfikator po publikacji
  sprawdza też tę samą ścieżkę aktualizacji z tymczasowym prefiksem z `YYYY.M.D` do `YYYY.M.D-N`,
  aby korekty wydania nie mogły po cichu zostawić starszych globalnych instalacji na
  bazowym stabilnym ładunku
- Kontrola wstępna wydania npm zawodzi bezpiecznie, chyba że tarball zawiera zarówno
  `dist/control-ui/index.html`, jak i niepusty ładunek `dist/control-ui/assets/`,
  abyśmy ponownie nie wysłali pustego panelu przeglądarkowego
- Weryfikacja po publikacji sprawdza też, czy opublikowane punkty wejścia pluginów i
  metadane pakietów są obecne w zainstalowanym układzie rejestru. Wydanie, które
  wysyła brakujące ładunki uruchomieniowe pluginów, zawodzi weryfikator po publikacji i
  nie może zostać promowane do `latest`.
- `pnpm test:install:smoke` egzekwuje też budżet `unpackedSize` paczki npm dla
  tarballa kandydującej aktualizacji, więc instalacyjne e2e wyłapuje przypadkowy rozrost paczki
  przed ścieżką publikacji wydania
- Jeśli prace nad wydaniem dotknęły planowania CI, manifestów czasu pluginów lub
  macierzy testów pluginów, wygeneruj ponownie i przejrzyj należące do planera
  wyniki macierzy `plugin-prerelease-extension-shard` z
  `.github/workflows/plugin-prerelease.yml` przed zatwierdzeniem, aby notatki wydania nie
  opisywały przestarzałego układu CI
- Gotowość stabilnego wydania macOS obejmuje też powierzchnie aktualizatora:
  - wydanie GitHub musi ostatecznie zawierać spakowane `.zip`, `.dmg` i `.dSYM.zip`
  - `appcast.xml` na `main` musi wskazywać nowy stabilny zip po publikacji
  - spakowana aplikacja musi zachować nie-debugowy identyfikator pakietu, niepusty URL
    kanału Sparkle oraz `CFBundleVersion` równy kanonicznemu minimalnemu progowi kompilacji Sparkle
    dla tej wersji wydania albo wyższy

## Środowiska testowe wydania

`Full Release Validation` to sposób, w jaki operatorzy uruchamiają wszystkie testy przedwydaniowe z
jednego punktu wejścia. Aby uzyskać dowód przypiętego commita na szybko zmieniającej się gałęzi, użyj
helpera, aby każdy podrzędny przepływ pracy działał z tymczasowej gałęzi ustalonej na docelowym
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper wypycha `release-ci/<sha>-...`, uruchamia `Full Release Validation`
z tej gałęzi z `ref=<sha>`, weryfikuje, że każdy podrzędny przepływ pracy `headSha`
pasuje do celu, a następnie usuwa tymczasową gałąź. Zapobiega to przypadkowemu potwierdzeniu
nowszego uruchomienia podrzędnego `main`.

W przypadku walidacji gałęzi wydania lub tagu uruchom ją z zaufanej referencji przepływu pracy `main`
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

Workflow rozwiązuje docelowy ref, uruchamia ręczne `CI` z
`target_ref=<release-ref>`, uruchamia `OpenClaw Release Checks`, przygotowuje
nadrzędny artefakt `release-package-under-test` dla testów pakietowych oraz
uruchamia samodzielne pakietowe Telegram E2E, gdy `release_profile=full` z
`rerun_group=all` albo gdy ustawiono `npm_telegram_package_spec`. Następnie
`OpenClaw Release Checks` rozdziela pracę na testy install smoke, międzyplatformowe
testy wydania, pokrycie ścieżki wydania live/E2E Docker, gdy soak jest włączony,
Package Acceptance z Telegram package QA, parytet QA Lab, live Matrix i live Telegram. Pełne uruchomienie jest akceptowalne tylko wtedy, gdy
podsumowanie `Full Release Validation`
pokazuje `normal_ci` i `release_checks` jako zakończone powodzeniem. W trybie full/all
proces podrzędny `npm_telegram` również musi zakończyć się powodzeniem; poza trybem full/all jest pomijany,
chyba że podano opublikowany `npm_telegram_package_spec`. Końcowe
podsumowanie weryfikatora zawiera tabele najwolniejszych zadań dla każdego uruchomienia podrzędnego, dzięki czemu menedżer wydania może zobaczyć obecną ścieżkę krytyczną bez pobierania logów.
Zobacz [Pełna walidacja wydania](/pl/reference/full-release-validation), aby uzyskać
pełną macierz etapów, dokładne nazwy zadań workflow, różnice między profilami stable i full,
artefakty oraz uchwyty do ukierunkowanych ponownych uruchomień.
Workflow podrzędne są uruchamiane z zaufanego ref, który uruchamia `Full Release
Validation`, zwykle `--ref main`, nawet gdy docelowy `ref` wskazuje
starszą gałąź wydania lub tag. Nie ma osobnego wejścia workflow-ref dla Full Release Validation; wybierz zaufany harness przez wybór ref uruchomienia workflow.
Nie używaj `--ref main -f ref=<sha>` do dowodu dokładnego commita na ruchomym `main`;
surowe SHA commitów nie mogą być refami uruchomienia workflow, więc użyj
`pnpm ci:full-release --sha <sha>`, aby utworzyć przypiętą tymczasową gałąź.

Użyj `release_profile`, aby wybrać zakres live/provider:

- `minimum`: najszybsza krytyczna dla wydania ścieżka OpenAI/core live i Docker
- `stable`: minimum plus stabilne pokrycie provider/backend do zatwierdzenia wydania
- `full`: stable plus szerokie doradcze pokrycie provider/media

Użyj `run_release_soak=true` ze `stable`, gdy pasma blokujące wydanie są
zielone i chcesz przeprowadzić wyczerpujące live/E2E, ścieżkę wydania Docker oraz
ograniczony przegląd upgrade-survivor opublikowanych pakietów przed promocją. Ten przegląd obejmuje
najnowsze cztery stabilne pakiety oraz przypięte punkty bazowe `2026.4.23` i `2026.5.2`
plus starsze pokrycie `2026.4.15`, z usuniętymi duplikatami punktów bazowych i
każdym punktem bazowym podzielonym do osobnego zadania runnera Docker. `full` implikuje
`run_release_soak=true`.

`OpenClaw Release Checks` używa zaufanego ref workflow, aby jednorazowo rozwiązać docelowy
ref jako `release-package-under-test` i ponownie używa tego artefaktu w testach międzyplatformowych,
Package Acceptance oraz testach Docker ścieżki wydania, gdy działa soak. Dzięki temu
wszystkie środowiska pakietowe używają tych samych bajtów i unikają powtarzanych buildów pakietów.
Międzyplatformowy install smoke OpenAI używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy
ustawiono zmienną repo/org, w przeciwnym razie `openai/gpt-5.4`, ponieważ to pasmo
dowodzi instalacji pakietu, onboardingu, uruchomienia gateway i jednego ruchu agenta live,
a nie benchmarkuje najwolniejszy domyślny model. Szersza macierz live provider
pozostaje miejscem dla pokrycia specyficznego dla modelu.

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
zawiedzie, użyj nieudanego workflow podrzędnego, zadania, pasma Docker, profilu pakietu, providera modelu
lub pasma QA do kolejnego dowodu. Uruchom pełny parasol ponownie tylko wtedy,
gdy poprawka zmieniła współdzieloną orkiestrację wydania albo sprawiła, że wcześniejsze dowody ze wszystkich środowisk
stały się nieaktualne. Końcowy weryfikator parasola ponownie sprawdza zapisane identyfikatory uruchomień workflow
podrzędnych, więc po pomyślnym ponownym uruchomieniu workflow podrzędnego uruchom ponownie tylko nieudane
nadrzędne zadanie `Verify full validation`.

Do ograniczonego odzyskiwania przekaż `rerun_group` do parasola. `all` to rzeczywiste
uruchomienie kandydata do wydania, `ci` uruchamia tylko normalny proces podrzędny CI, `plugin-prerelease`
uruchamia tylko podrzędny proces plugin przeznaczony wyłącznie dla wydania, `release-checks` uruchamia każde środowisko wydania,
a węższe grupy wydania to `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` i `npm-telegram`.
Ukierunkowane ponowne uruchomienia `npm-telegram` wymagają `npm_telegram_package_spec`; pełne/all uruchomienia
z `release_profile=full` używają artefaktu pakietu z release-checks. Ukierunkowane
ponowne uruchomienia cross-OS mogą dodać `cross_os_suite_filter=windows/packaged-upgrade` lub
inny filtr OS/suite. Niepowodzenia QA release-checks są doradcze; niepowodzenie wyłącznie QA
nie blokuje walidacji wydania.

### Vitest

Środowisko Vitest to ręczny podrzędny workflow `CI`. Ręczne CI celowo
omija zakres zmian i wymusza normalny graf testów dla kandydata
do wydania: shardy Linux Node, shardy bundled-plugin, kontrakty kanałów, zgodność Node 22,
`check`, `check-additional`, build smoke, testy dokumentacji, Python
skills, Windows, macOS, Android i Control UI i18n.

Użyj tego środowiska, aby odpowiedzieć: „czy drzewo źródłowe przeszło pełny normalny zestaw testów?”
Nie jest to to samo co walidacja produktu na ścieżce wydania. Dowody do zachowania:

- podsumowanie `Full Release Validation` pokazujące URL uruchomionego `CI`
- zielone uruchomienie `CI` na dokładnym docelowym SHA
- nazwy nieudanych lub wolnych shardów z zadań CI podczas badania regresji
- artefakty czasów Vitest, takie jak `.artifacts/vitest-shard-timings.json`, gdy
  uruchomienie wymaga analizy wydajności

Uruchamiaj ręczne CI bezpośrednio tylko wtedy, gdy wydanie wymaga deterministycznego normalnego CI, ale
nie środowisk Docker, QA Lab, live, cross-OS ani pakietowych:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Środowisko Docker znajduje się w `OpenClaw Release Checks` przez
`openclaw-live-and-e2e-checks-reusable.yml` oraz workflow `install-smoke`
w trybie wydania. Waliduje kandydata do wydania przez pakietowane
środowiska Docker zamiast wyłącznie testów na poziomie źródeł.

Pokrycie Docker wydania obejmuje:

- pełny install smoke z włączonym wolnym globalnym install smoke Bun
- przygotowanie/ponowne użycie obrazu smoke głównego Dockerfile według docelowego SHA, z QR,
  root/gateway oraz zadaniami installer/Bun smoke uruchamianymi jako osobne shardy install-smoke
- pasma E2E repozytorium
- fragmenty Docker ścieżki wydania: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` i `plugins-runtime-install-h`
- pokrycie OpenWebUI wewnątrz fragmentu `plugins-runtime-services`, gdy jest wymagane
- podzielone pasma instalacji/dezinstalacji bundled plugin
  `bundled-plugin-install-uninstall-0` do
  `bundled-plugin-install-uninstall-23`
- pakiety live/E2E provider i pokrycie modeli live Docker, gdy testy wydania
  obejmują pakiety live

Używaj artefaktów Docker przed ponownym uruchamianiem. Harmonogram ścieżki wydania przesyła
`.artifacts/docker-tests/` z logami pasm, `summary.json`, `failures.json`,
czasami faz, JSON planu harmonogramu i poleceniami ponownego uruchomienia. Do ukierunkowanego odzyskiwania
użyj `docker_lanes=<lane[,lane]>` w wielokrotnego użytku workflow live/E2E zamiast
ponownie uruchamiać wszystkie fragmenty wydania. Wygenerowane polecenia ponownego uruchomienia zawierają wcześniejsze
`package_artifact_run_id` oraz przygotowane wejścia obrazów Docker, gdy są dostępne, więc
nieudane pasmo może ponownie użyć tego samego tarballa i obrazów GHCR.

### QA Lab

Środowisko QA Lab jest także częścią `OpenClaw Release Checks`. To agentowa
bramka wydania na poziomie zachowania i kanałów, osobna od Vitest i mechaniki pakietów Docker.

Pokrycie QA Lab wydania obejmuje:

- pasmo parytetu mock porównujące pasmo kandydata OpenAI z punktem bazowym Opus 4.6
  przy użyciu pakietu agentic parity
- szybki profil live Matrix QA używający środowiska `qa-live-shared`
- pasmo live Telegram QA używające dzierżaw poświadczeń Convex CI
- `pnpm qa:otel:smoke`, gdy telemetria wydania wymaga jawnego lokalnego dowodu

Użyj tego środowiska, aby odpowiedzieć: „czy wydanie zachowuje się poprawnie w scenariuszach QA i przepływach kanałów live?”
Zachowaj URL-e artefaktów dla pasm parytetu, Matrix i Telegram podczas zatwierdzania wydania. Pełne pokrycie Matrix pozostaje dostępne jako
ręczne shardowane uruchomienie QA-Lab, a nie domyślne pasmo krytyczne dla wydania.

### Pakiet

Środowisko pakietowe jest bramką produktu instalowalnego. Jest wspierane przez
`Package Acceptance` i resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver normalizuje
kandydata do tarballa `package-under-test` używanego przez Docker E2E, waliduje
inwentarz pakietu, zapisuje wersję pakietu i SHA-256 oraz utrzymuje
ref harnessu workflow oddzielnie od ref źródła pakietu.

Obsługiwane źródła kandydatów:

- `source=npm`: `openclaw@beta`, `openclaw@latest` lub dokładna wersja wydania OpenClaw
- `source=ref`: spakuj zaufaną gałąź `package_ref`, tag lub pełny SHA commita
  z wybranym harmessem `workflow_ref`
- `source=url`: pobierz HTTPS `.tgz` z wymaganym `package_sha256`
- `source=artifact`: użyj ponownie `.tgz` przesłanego przez inne uruchomienie GitHub Actions

`OpenClaw Release Checks` uruchamia Package Acceptance z `source=artifact`,
przygotowanym artefaktem pakietu wydania, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance utrzymuje migrację, aktualizację,
restart aktualizacji skonfigurowanego uwierzytelniania, czyszczenie nieaktualnych zależności plugin, offline’owe
fixtures plugin, aktualizację plugin oraz Telegram package QA względem tego samego rozwiązanego
tarballa. Blokujące testy wydania używają domyślnego najnowszego opublikowanego
punktu bazowego pakietu; `run_release_soak=true` lub
`release_profile=full` rozszerza zakres na każdy stabilny punkt bazowy opublikowany w npm od
`2026.4.23` do `latest` plus fixtures zgłoszonych problemów. Użyj
Package Acceptance z `source=npm` dla już wydanego kandydata albo
`source=ref`/`source=artifact` dla lokalnego tarballa npm opartego na SHA przed
publikacją. To natywne dla GitHub
zastępstwo dla większości pokrycia pakietów/aktualizacji, które wcześniej wymagało
Parallels. Międzyplatformowe testy wydania nadal mają znaczenie dla onboardingu,
instalatora i zachowania platformy specyficznego dla OS, ale walidacja produktu pakietu/aktualizacji powinna
preferować Package Acceptance.

Kanoniczna lista kontrolna walidacji aktualizacji i plugin to
[Testowanie aktualizacji i plugin](/pl/help/testing-updates-plugins). Użyj jej podczas
decydowania, które lokalne pasmo, Docker, Package Acceptance lub release-checks dowodzi
instalacji/aktualizacji plugin, czyszczenia doctor albo zmiany migracji opublikowanego pakietu.
Wyczerpująca migracja aktualizacji opublikowanych z każdego stabilnego pakietu `2026.4.23+` jest
osobnym ręcznym workflow `Update Migration`, a nie częścią Full Release CI.

Dawne złagodzenia Package Acceptance są celowo ograniczone czasowo. Pakiety do
`2026.4.25` mogą używać ścieżki zgodności dla luk w metadanych już opublikowanych
w npm: prywatnych wpisów inwentarza QA brakujących w archiwum tarball, brakującego
`gateway install --wrapper`, brakujących plików poprawek w fixture git
pochodzącym z archiwum tarball, brakującego utrwalonego `update.channel`, dawnych
lokalizacji rekordu instalacji pluginu, brakującego utrwalania rekordu instalacji
z marketplace oraz migracji metadanych konfiguracji podczas `plugins update`.
Opublikowany pakiet `2026.4.26` może ostrzegać o plikach znaczników metadanych
lokalnej kompilacji, które zostały już wydane. Późniejsze pakiety muszą spełniać
współczesne kontrakty pakietów; te same luki powodują niepowodzenie walidacji
wydania.

Używaj szerszych profili Package Acceptance, gdy pytanie o wydanie dotyczy
rzeczywistego pakietu nadającego się do instalacji:

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
- `package`: kontrakty instalacji/aktualizacji/restartu/pakietu pluginu bez
  aktywnego ClawHub; to domyślna wartość sprawdzania wydania
- `product`: `package` oraz kanały MCP, czyszczenie cron/subagent, wyszukiwanie
  webowe OpenAI i OpenWebUI
- `full`: fragmenty ścieżki wydania Docker z OpenWebUI
- `custom`: dokładna lista `docker_lanes` do ukierunkowanych ponownych uruchomień

Aby uzyskać dowód Telegram dla kandydata pakietu, włącz `telegram_mode=mock-openai`
lub `telegram_mode=live-frontier` w Package Acceptance. Workflow przekazuje
rozwiązany tarball `package-under-test` do ścieżki Telegram; samodzielny workflow
Telegram nadal akceptuje opublikowaną specyfikację npm do kontroli po publikacji.

## Automatyzacja publikacji wydania

`OpenClaw Release Publish` jest normalnym mutującym punktem wejścia publikacji.
Koordynuje workflow zaufanego wydawcy w kolejności wymaganej przez wydanie:

1. Pobiera tag wydania i rozwiązuje jego SHA commitu.
2. Weryfikuje, że tag jest osiągalny z `main` lub `release/*`.
3. Uruchamia `pnpm plugins:sync:check`.
4. Uruchamia `Plugin NPM Release` z `publish_scope=all-publishable` i
   `ref=<release-sha>`.
5. Uruchamia `Plugin ClawHub Release` z tym samym zakresem i SHA.
6. Uruchamia `OpenClaw NPM Release` z tagiem wydania, tagiem dist npm oraz
   zapisanym `preflight_run_id`.

Przykład publikacji beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Publikacja stabilna do domyślnego tagu dist beta:

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
tylko do ukierunkowanych napraw lub ponownej publikacji. W przypadku naprawy
wybranego pluginu przekaż `plugin_publish_scope=selected` i `plugins=@openclaw/name`
do `OpenClaw Release Publish` albo uruchom workflow podrzędny bezpośrednio, gdy
pakiet OpenClaw nie może zostać opublikowany.

## Dane wejściowe workflow NPM

`OpenClaw NPM Release` akceptuje następujące dane wejściowe kontrolowane przez
operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1` lub
  `v2026.4.2-beta.1`; gdy `preflight_only=true`, może to być również bieżący
  pełny 40-znakowy SHA commitu gałęzi workflow na potrzeby preflight tylko do
  walidacji
- `preflight_only`: `true` tylko dla walidacji/kompilacji/pakietu, `false` dla
  rzeczywistej ścieżki publikacji
- `preflight_run_id`: wymagane na rzeczywistej ścieżce publikacji, aby workflow
  ponownie użył przygotowanego tarballa z pomyślnego uruchomienia preflight
- `npm_dist_tag`: docelowy tag npm dla ścieżki publikacji; domyślnie `beta`

`OpenClaw Release Publish` akceptuje następujące dane wejściowe kontrolowane przez
operatora:

- `tag`: wymagany tag wydania; musi już istnieć
- `preflight_run_id`: identyfikator pomyślnego uruchomienia preflight
  `OpenClaw NPM Release`; wymagany, gdy `publish_openclaw_npm=true`
- `npm_dist_tag`: docelowy tag npm dla pakietu OpenClaw
- `plugin_publish_scope`: domyślnie `all-publishable`; używaj `selected` tylko
  do ukierunkowanych napraw
- `plugins`: rozdzielone przecinkami nazwy pakietów `@openclaw/*`, gdy
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: domyślnie `true`; ustaw `false` tylko wtedy, gdy
  używasz workflow jako orkiestratora napraw wyłącznie dla pluginów

`OpenClaw Release Checks` akceptuje następujące dane wejściowe kontrolowane przez
operatora:

- `ref`: gałąź, tag lub pełny SHA commitu do zwalidowania. Kontrole wymagające
  sekretów wymagają, aby rozwiązany commit był osiągalny z gałęzi OpenClaw lub
  tagu wydania.
- `run_release_soak`: włącza wyczerpujące testy live/E2E, ścieżkę wydania Docker
  oraz soak upgrade-survivor od początku na stabilnych/domyślnych kontrolach
  wydania. Jest wymuszane przez `release_profile=full`.

Reguły:

- Tagi stabilne i korekcyjne mogą publikować do `beta` albo `latest`
- Tagi przedwydania beta mogą publikować tylko do `beta`
- W przypadku `OpenClaw NPM Release` wejście pełnego SHA commitu jest dozwolone
  tylko wtedy, gdy `preflight_only=true`
- `OpenClaw Release Checks` i `Full Release Validation` zawsze są wyłącznie
  walidacyjne
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, którego
  użyto podczas preflight; workflow weryfikuje te metadane przed kontynuowaniem
  publikacji

## Sekwencja stabilnego wydania npm

Podczas przygotowywania stabilnego wydania npm:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`
   - Zanim tag istnieje, możesz użyć bieżącego pełnego SHA commitu gałęzi
     workflow do suchego przebiegu workflow preflight tylko do walidacji
2. Wybierz `npm_dist_tag=beta` dla zwykłego przepływu beta-first albo `latest`
   tylko wtedy, gdy celowo chcesz bezpośredniej stabilnej publikacji
3. Uruchom `Full Release Validation` na gałęzi wydania, tagu wydania lub pełnym
   SHA commitu, gdy chcesz uzyskać zwykłe CI oraz pokrycie aktywnej pamięci
   podręcznej promptów, Docker, QA Lab, Matrix i Telegram z jednego ręcznego
   workflow
4. Jeśli celowo potrzebujesz tylko deterministycznego zwykłego grafu testów,
   uruchom ręczny workflow `CI` na refie wydania
5. Zapisz pomyślny `preflight_run_id`
6. Uruchom `OpenClaw Release Publish` z tym samym `tag`, tym samym `npm_dist_tag`
   oraz zapisanym `preflight_run_id`; publikuje zewnętrzne pluginy do npm i
   ClawHub przed promowaniem pakietu npm OpenClaw
7. Jeśli wydanie trafiło na `beta`, użyj prywatnego workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   aby promować tę stabilną wersję z `beta` do `latest`
8. Jeśli wydanie zostało celowo opublikowane bezpośrednio do `latest`, a `beta`
   ma natychmiast wskazywać tę samą stabilną kompilację, użyj tego samego
   prywatnego workflow, aby skierować oba tagi dist na stabilną wersję, albo
   pozwól zaplanowanej synchronizacji samonaprawiającej przenieść `beta` później

Mutacja tagu dist znajduje się w prywatnym repo ze względów bezpieczeństwa,
ponieważ nadal wymaga `NPM_TOKEN`, podczas gdy publiczne repo zachowuje publikację
wyłącznie przez OIDC.

Dzięki temu zarówno bezpośrednia ścieżka publikacji, jak i ścieżka promocji
beta-first są udokumentowane i widoczne dla operatora.

Jeśli maintainer musi awaryjnie użyć lokalnego uwierzytelniania npm, uruchamiaj
wszystkie polecenia CLI 1Password (`op`) wyłącznie w dedykowanej sesji tmux. Nie
wywołuj `op` bezpośrednio z głównej powłoki agenta; utrzymywanie go w tmux
sprawia, że prompty, alerty i obsługa OTP są obserwowalne, oraz zapobiega
powtarzającym się alertom hosta.

## Referencje publiczne

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
