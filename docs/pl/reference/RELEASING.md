---
read_when:
    - Szukanie definicji publicznych kanałów wydań
    - Uruchamianie walidacji wydania lub akceptacji pakietu
    - Szukasz nazewnictwa wersji i cyklu wydań
    - Planowanie miesięcznych linii wsparcia lub linii wydań LTS
summary: Ścieżki wydań, lista kontrolna operatora, środowiska walidacyjne, nazewnictwo wersji, planowane miesięczne linie wsparcia i harmonogram
title: Polityka wydań
x-i18n:
    generated_at: "2026-05-07T01:54:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbd86faf2aa3eeeb465203431c19c778719f291a2e2732fca1463bde89e42e80
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ma trzy publiczne ścieżki wydań:

- stable: oznaczone tagami wydania, które domyślnie publikują do npm `beta` albo do npm `latest`, gdy zostanie to wyraźnie zażądane
- beta: tagi wydań wstępnych publikowane do npm `beta`
- dev: ruchoma głowica `main`

## Nazewnictwo wersji

- Wersja wydania stabilnego: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Wersja starszego wydania korygującego stabilnego: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Wersja wydania wstępnego beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Nie dodawaj zera wiodącego do miesiąca ani dnia
- `latest` oznacza aktualne promowane stabilne wydanie npm
- `beta` oznacza aktualny cel instalacji beta
- Wydania stabilne i starsze wydania korygujące domyślnie publikują do npm `beta`; operatorzy wydań mogą wyraźnie wskazać `latest` albo później wypromować zweryfikowaną kompilację beta
- Każde stabilne wydanie OpenClaw dostarcza razem pakiet npm i aplikację macOS;
  wydania beta zwykle najpierw weryfikują i publikują ścieżkę npm/pakietu, a
  kompilowanie/podpisywanie/notaryzację aplikacji mac pozostawiają dla wydań stabilnych, chyba że zostanie to wyraźnie zażądane

### Planowane wersjonowanie miesięcznego wsparcia

OpenClaw nie ma jeszcze kanału LTS ani kanału miesięcznego wsparcia. Maintainerzy
pracują nad liniami miesięcznego wsparcia zgodnymi z SemVer, ale obecnie
dostarczane kanały aktualizacji nadal to `stable`, `beta` i `dev`.

Planowany kształt wersji to `YYYY.M.PATCH`:

- `YYYY` to rok.
- `M` to miesięczna linia wydania, bez zera wiodącego.
- `PATCH` zwiększa się w obrębie tej miesięcznej linii i może rosnąć tak wysoko, jak potrzeba.

Na przykład `2026.6.0`, `2026.6.1` i `2026.6.2` byłyby wszystkie w linii czerwcowej
2026. Przyszły miesięczny dist-tag wsparcia, taki jak `stable-2026-6` lub
`lts-2026-6`, może wskazywać na tę linię, podczas gdy `latest` nadal szybko się przesuwa.

Ten przyszły model zastępuje potrzebę tworzenia nowych wydań korygujących `YYYY.M.D-N`.
Istniejące starsze wersje korygujące pozostają rozpoznawane, aby starsze pakiety i
ścieżki aktualizacji nadal działały.

## Rytm wydań

- Wydania przechodzą najpierw przez beta
- Stable następuje dopiero po zweryfikowaniu najnowszej beta
- Maintainerzy zwykle przygotowują wydania z gałęzi `release/YYYY.M.D` utworzonej
  z bieżącego `main`, aby weryfikacja wydania i poprawki nie blokowały nowego
  rozwoju na `main`
- Jeśli tag beta został wypchnięty lub opublikowany i wymaga poprawki, maintainerzy tworzą
  następny tag `-beta.N` zamiast usuwać lub odtwarzać stary tag beta
- Szczegółowa procedura wydania, zatwierdzenia, poświadczenia i notatki odzyskiwania są
  dostępne tylko dla maintainerów

## Lista kontrolna operatora wydania

Ta lista kontrolna pokazuje publiczny kształt przepływu wydania. Prywatne poświadczenia,
podpisywanie, notaryzacja, odzyskiwanie dist-tagów i szczegóły awaryjnego wycofania pozostają w
runbooku wydania dostępnym tylko dla maintainerów.

1. Zacznij od bieżącego `main`: pobierz najnowsze zmiany, potwierdź, że docelowy commit jest wypchnięty,
   i potwierdź, że bieżące CI `main` jest wystarczająco zielone, aby utworzyć z niego gałąź.
2. Przepisz górną sekcję `CHANGELOG.md` na podstawie rzeczywistej historii commitów za pomocą
   `/changelog`, utrzymaj wpisy skierowane do użytkowników, zacommituj ją, wypchnij i wykonaj rebase/pull
   jeszcze raz przed utworzeniem gałęzi.
3. Przejrzyj rekordy zgodności wydania w
   `src/plugins/compat/registry.ts` i
   `src/commands/doctor/shared/deprecation-compat.ts`. Usuń wygasłą
   zgodność tylko wtedy, gdy ścieżka aktualizacji pozostaje objęta, albo zapisz, dlaczego jest
   celowo zachowana.
4. Utwórz `release/YYYY.M.D` z bieżącego `main`; nie wykonuj normalnej pracy wydawniczej
   bezpośrednio na `main`.
5. Podbij każdą wymaganą lokalizację wersji dla zamierzonego tagu, uruchom
   `pnpm plugins:sync`, aby publikowalne pakiety pluginów współdzieliły wersję wydania
   i metadane zgodności, a następnie uruchom lokalny deterministyczny preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check` oraz
   `pnpm release:check`.
6. Uruchom `OpenClaw NPM Release` z `preflight_only=true`. Zanim istnieje tag,
   pełny 40-znakowy SHA gałęzi wydania jest dozwolony tylko do weryfikacji
   preflight. Zapisz pomyślny `preflight_run_id`.
7. Uruchom wszystkie testy przedwydaniowe za pomocą `Full Release Validation` dla
   gałęzi wydania, tagu lub pełnego SHA commitu. To jest jedyny ręczny punkt wejścia
   dla czterech dużych pól testowych wydania: Vitest, Docker, QA Lab i Package.
8. Jeśli weryfikacja się nie powiedzie, popraw na gałęzi wydania i uruchom ponownie najmniejszy nieudany
   plik, ścieżkę, zadanie workflow, profil pakietu, dostawcę lub allowlistę modeli, które
   potwierdzają poprawkę. Uruchom ponownie pełny parasol tylko wtedy, gdy zmieniona powierzchnia sprawia, że
   wcześniejsze dowody są nieaktualne.
9. Dla beta oznacz tagiem `vYYYY.M.D-beta.N`, a następnie uruchom `OpenClaw Release Publish` z
   pasującej gałęzi `release/YYYY.M.D`. Weryfikuje `pnpm plugins:sync:check`,
   dispatchuje wszystkie publikowalne pakiety pluginów równolegle do npm i ten sam zestaw do
   ClawHub, a następnie promuje przygotowany artefakt preflight npm OpenClaw
   z pasującym dist-tagiem, gdy tylko publikacja pluginu do npm się powiedzie.
   Publikowanie do ClawHub może nadal trwać, gdy OpenClaw publikuje do npm, ale
   workflow publikacji wydania nie kończy się, dopóki obie ścieżki publikacji pluginów i
   ścieżka publikacji npm OpenClaw nie zakończą się pomyślnie. Po publikacji uruchom
   powydaniową akceptację pakietu
   względem opublikowanego pakietu `openclaw@YYYY.M.D-beta.N` lub
   `openclaw@beta`. Jeśli wypchnięte lub opublikowane wydanie wstępne wymaga poprawki,
   przygotuj następny pasujący numer wydania wstępnego; nie usuwaj ani nie przepisuj starego
   wydania wstępnego.
10. Dla stable kontynuuj dopiero po tym, jak zweryfikowana beta lub kandydat wydania ma
    wymagane dowody weryfikacji. Stabilna publikacja npm również przechodzi przez
    `OpenClaw Release Publish`, ponownie używając pomyślnego artefaktu preflight za pomocą
    `preflight_run_id`; gotowość stabilnego wydania macOS wymaga również
    spakowanych `.zip`, `.dmg`, `.dSYM.zip` oraz zaktualizowanego `appcast.xml` na `main`.
11. Po publikacji uruchom weryfikator npm po publikacji, opcjonalny samodzielny
    E2E Telegram z opublikowanego npm, gdy potrzebujesz dowodu kanału po publikacji,
    promocję dist-tagu, gdy jest potrzebna, notatki GitHub release/prerelease z
    kompletnej pasującej sekcji `CHANGELOG.md` oraz kroki ogłoszenia wydania.

## Preflight wydania

- Uruchom `pnpm check:test-types` przed kontrolą wstępną wydania, aby testowy TypeScript pozostał
  objęty poza szybszą lokalną bramką `pnpm check`
- Uruchom `pnpm check:architecture` przed kontrolą wstępną wydania, aby szersze kontrole cykli
  importów i granic architektury były zielone poza szybszą lokalną bramką
- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane
  artefakty wydania `dist/*` i pakiet Control UI istniały na potrzeby etapu
  walidacji pakietu
- Uruchom `pnpm plugins:sync` po podbiciu wersji w katalogu głównym i przed tagowaniem. Aktualizuje
  wersje publikowalnych pakietów pluginów, metadane zgodności peer/API OpenClaw,
  metadane kompilacji oraz szkielety changelogów pluginów, aby pasowały do wersji
  wydania core. `pnpm plugins:sync:check` to niemodyfikująca osłona wydania;
  przepływ publikacji kończy się niepowodzeniem przed jakąkolwiek mutacją rejestru, jeśli ten krok został
  pominięty.
- Uruchom ręczny przepływ pracy `Full Release Validation` przed zatwierdzeniem wydania, aby
  uruchomić wszystkie przedwydaniowe maszyny testowe z jednego punktu wejścia. Przyjmuje gałąź,
  tag albo pełny SHA commita, uruchamia ręczny `CI` i uruchamia
  `OpenClaw Release Checks` dla smoke testów instalacji, akceptacji pakietu, międzyplatformowych
  kontroli pakietu, parytetu QA Lab, Matrix i ścieżek Telegram. Stabilne/domyślne uruchomienia
  utrzymują wyczerpujące live/E2E i Dockerowe długie testy ścieżki wydania za
  `run_release_soak=true`; `release_profile=full` wymusza ich włączenie. Przy
  `release_profile=full` i `rerun_group=all` uruchamia także pakietowe Telegram
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
- Uruchom ręczny przepływ pracy `Package Acceptance`, gdy potrzebujesz dowodu pobocznego
  dla kandydata pakietu, podczas gdy prace wydaniowe trwają dalej. Użyj `source=npm` dla
  `openclaw@beta`, `openclaw@latest` albo dokładnej wersji wydania; `source=ref`,
  aby spakować zaufaną gałąź/tag/SHA `package_ref` z bieżącym szkieletem
  `workflow_ref`; `source=url` dla tarballa HTTPS z wymaganym
  SHA-256; albo `source=artifact` dla tarballa przesłanego przez inne uruchomienie
  GitHub Actions. Przepływ pracy rozwiązuje kandydata do
  `package-under-test`, ponownie używa harmonogramu wydania Docker E2E względem tego
  tarballa i może uruchomić QA Telegram względem tego samego tarballa z
  `telegram_mode=mock-openai` albo `telegram_mode=live-frontier`. Gdy
  wybrane ścieżki Docker zawierają `published-upgrade-survivor`, artefakt
  pakietu jest kandydatem, a `published_upgrade_survivor_baseline` wybiera
  opublikowaną bazę. `update-restart-auth` używa pakietu kandydata jako
  zainstalowanego CLI i jako package-under-test, więc ćwiczy zarządzaną ścieżkę
  restartu polecenia aktualizacji kandydata.
  Przykład: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Typowe profile:
  - `smoke`: ścieżki instalacji/kanału/agenta, sieci Gateway i przeładowania konfiguracji
  - `package`: natywne dla artefaktu ścieżki pakietu/aktualizacji/restartu/pluginów bez OpenWebUI ani live ClawHub
  - `product`: profil pakietu plus kanały MCP, sprzątanie cron/subagent,
    wyszukiwanie web OpenAI i OpenWebUI
  - `full`: fragmenty ścieżki wydania Docker z OpenWebUI
  - `custom`: dokładny wybór `docker_lanes` dla ukierunkowanego ponownego uruchomienia
- Uruchom ręczny przepływ pracy `CI` bezpośrednio, gdy potrzebujesz tylko pełnego normalnego pokrycia CI
  dla kandydata wydania. Ręczne uruchomienia CI omijają zawężanie według zmian
  i wymuszają fragmenty Linux Node, fragmenty bundlowanych pluginów, kontrakty kanałów,
  zgodność Node 22, ścieżki `check`, `check-additional`, smoke builda,
  kontrole dokumentacji, Python skills, Windows, macOS, Android i Control UI i18n.
  Przykład: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Uruchom `pnpm qa:otel:smoke` podczas walidowania telemetrii wydania. Ćwiczy
  QA-lab przez lokalny odbiornik OTLP/HTTP i weryfikuje wyeksportowane nazwy spanów
  śladu, ograniczone atrybuty oraz redakcję treści/identyfikatorów bez
  wymagania Opik, Langfuse ani innego zewnętrznego kolektora.
- Uruchom `pnpm release:check` przed każdym tagowanym wydaniem
- Uruchom `OpenClaw Release Publish` dla modyfikującej sekwencji publikacji po tym, jak
  tag już istnieje. Uruchom go z `release/YYYY.M.D` (albo `main`, gdy publikujesz
  tag osiągalny z main), przekaż tag wydania i pomyślny OpenClaw npm
  `preflight_run_id`, a domyślny zakres publikacji pluginów
  `all-publishable` zachowaj, chyba że celowo uruchamiasz ukierunkowaną naprawę. Ten
  przepływ pracy serializuje publikację pluginów do npm, publikację pluginów do ClawHub i publikację OpenClaw
  do npm, aby pakiet core nie został opublikowany przed swoimi uzewnętrznionymi
  pluginami.
- Kontrole wydania działają teraz w osobnym ręcznym przepływie pracy:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` uruchamia także ścieżkę parytetu mock QA Lab oraz szybki
  profil live Matrix i ścieżkę QA Telegram przed zatwierdzeniem wydania. Ścieżki live
  używają środowiska `qa-live-shared`; Telegram używa także dzierżaw danych uwierzytelniających Convex CI.
  Uruchom ręczny przepływ pracy `QA-Lab - All Lanes` z
  `matrix_profile=all` i `matrix_shards=true`, gdy chcesz pełną inwentaryzację
  transportu Matrix, multimediów i E2EE równolegle.
- Międzyplatformowa walidacja działania instalacji i aktualizacji jest częścią publicznych
  `OpenClaw Release Checks` i `Full Release Validation`, które wywołują
  przepływ pracy wielokrotnego użytku
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` bezpośrednio
- Ten podział jest celowy: utrzymuje prawdziwą ścieżkę wydania npm krótką,
  deterministyczną i skoncentrowaną na artefaktach, podczas gdy wolniejsze kontrole live pozostają we
  własnej ścieżce, aby nie wstrzymywały ani nie blokowały publikacji
- Kontrole wydania zawierające sekrety powinny być uruchamiane przez `Full Release
Validation` albo z referencji przepływu pracy `main`/wydania, aby logika przepływu pracy i
  sekrety pozostawały kontrolowane
- `OpenClaw Release Checks` przyjmuje gałąź, tag albo pełny SHA commita, o ile
  rozwiązany commit jest osiągalny z gałęzi OpenClaw albo tagu wydania
- Kontrola wstępna tylko do walidacji `OpenClaw NPM Release` przyjmuje także bieżący
  pełny 40-znakowy SHA commita gałęzi przepływu pracy bez wymagania wypchniętego tagu
- Ta ścieżka SHA służy tylko do walidacji i nie może zostać awansowana do prawdziwej publikacji
- W trybie SHA przepływ pracy syntetyzuje `v<package.json version>` tylko na potrzeby
  kontroli metadanych pakietu; prawdziwa publikacja nadal wymaga prawdziwego tagu wydania
- Oba przepływy pracy utrzymują prawdziwą ścieżkę publikacji i promocji na runnerach
  hostowanych przez GitHub, podczas gdy niemodyfikująca ścieżka walidacji może używać większych
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
  aby zweryfikować onboarding zainstalowanego pakietu, konfigurację Telegram i prawdziwe Telegram E2E
  względem opublikowanego pakietu npm przy użyciu współdzielonej puli dzierżawionych danych uwierzytelniających
  Telegram. Lokalne jednorazowe uruchomienia maintainerów mogą pominąć zmienne Convex i przekazać trzy
  dane uwierzytelniające env `OPENCLAW_QA_TELEGRAM_*` bezpośrednio.
- Aby uruchomić pełny smoke po publikacji beta z maszyny maintainera, użyj `pnpm release:beta-smoke -- --beta betaN`. Helper uruchamia walidację Parallels npm update/fresh-target, uruchamia `NPM Telegram Beta E2E`, odpytuje dokładne uruchomienie przepływu pracy, pobiera artefakt i wypisuje raport Telegram.
- Maintainerzy mogą uruchomić tę samą kontrolę po publikacji z GitHub Actions przez
  ręczny przepływ pracy `NPM Telegram Beta E2E`. Jest celowo wyłącznie ręczny i
  nie uruchamia się przy każdym scaleniu.
- Automatyzacja wydania maintainerów używa teraz schematu kontrola wstępna, potem promocja:
  - prawdziwa publikacja npm musi przejść pomyślny npm `preflight_run_id`
  - prawdziwa publikacja npm musi zostać uruchomiona z tej samej gałęzi `main` albo
    `release/YYYY.M.D` co pomyślne uruchomienie kontroli wstępnej
  - stabilne wydania npm domyślnie używają `beta`
  - stabilna publikacja npm może celować jawnie w `latest` przez dane wejściowe przepływu pracy
  - mutacja dist-tag npm oparta na tokenie znajduje się teraz w
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    ze względów bezpieczeństwa, ponieważ `npm dist-tag add` nadal potrzebuje `NPM_TOKEN`, podczas gdy
    publiczne repo zachowuje publikację wyłącznie OIDC
  - publiczny `macOS Release` służy tylko do walidacji; gdy tag istnieje tylko na
    gałęzi wydania, ale przepływ pracy jest uruchamiany z `main`, ustaw
    `public_release_branch=release/YYYY.M.D`
  - prawdziwa prywatna publikacja mac musi przejść pomyślny prywatny mac
    `preflight_run_id` i `validate_run_id`
  - prawdziwe ścieżki publikacji promują przygotowane artefakty zamiast ponownie je budować
- Dla starszych stabilnych wydań korekcyjnych, takich jak `YYYY.M.D-N`, weryfikator po publikacji
  sprawdza także tę samą ścieżkę aktualizacji z prefiksem tymczasowym z `YYYY.M.D` do `YYYY.M.D-N`,
  aby korekty wydania nie mogły po cichu pozostawić starszych instalacji globalnych na
  bazowym stabilnym ładunku
- Kontrola wstępna wydania npm kończy się niepowodzeniem w trybie fail closed, chyba że tarball zawiera zarówno
  `dist/control-ui/index.html`, jak i niepusty ładunek `dist/control-ui/assets/`,
  abyśmy ponownie nie wysłali pustego dashboardu przeglądarkowego
- Weryfikacja po publikacji sprawdza także, czy opublikowane entrypointy pluginów i
  metadane pakietów są obecne w zainstalowanym układzie rejestru. Wydanie, które
  wysyła brakujące ładunki runtime pluginów, nie przechodzi weryfikatora postpublish i
  nie może zostać awansowane do `latest`.
- `pnpm test:install:smoke` wymusza także budżet npm pack `unpackedSize` na
  tarballu aktualizacji kandydata, więc installer e2e wykrywa przypadkowe rozdęcie paczki
  przed ścieżką publikacji wydania
- Jeśli prace wydaniowe dotknęły planowania CI, manifestów czasowych rozszerzeń albo
  macierzy testów rozszerzeń, ponownie wygeneruj i przejrzyj zarządzane przez planner
  wyjścia macierzy `plugin-prerelease-extension-shard` z
  `.github/workflows/plugin-prerelease.yml` przed zatwierdzeniem, aby notatki wydania nie
  opisywały nieaktualnego układu CI
- Gotowość stabilnego wydania macOS obejmuje także powierzchnie aktualizatora:
  - wydanie GitHub musi ostatecznie zawierać spakowane `.zip`, `.dmg` i `.dSYM.zip`
  - `appcast.xml` na `main` musi wskazywać na nowy stabilny zip po publikacji
  - spakowana aplikacja musi zachować niedebugowy identyfikator pakietu, niepusty URL kanału
    Sparkle oraz `CFBundleVersion` równy kanonicznemu dolnemu progowi builda Sparkle
    dla tej wersji wydania albo od niego wyższy

## Maszyny testowe wydania

`Full Release Validation` to sposób, w jaki operatorzy uruchamiają wszystkie testy przedwydaniowe z
jednego punktu wejścia. Aby uzyskać dowód przypiętego commita na szybko zmieniającej się gałęzi, użyj
helpera, aby każdy podrzędny przepływ pracy działał z tymczasowej gałęzi przypiętej do docelowego
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper wypycha `release-ci/<sha>-...`, uruchamia `Full Release Validation`
z tej gałęzi z `ref=<sha>`, weryfikuje, że każdy podrzędny przepływ pracy `headSha`
pasuje do celu, a następnie usuwa gałąź tymczasową. Zapobiega to przypadkowemu potwierdzeniu
nowszego podrzędnego uruchomienia z `main`.

W przypadku walidacji gałęzi wydania albo tagu uruchom ją z zaufanej referencji przepływu pracy `main`
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
i uruchamia samodzielne Telegram E2E pakietu, gdy `release_profile=full` z
`rerun_group=all` albo gdy ustawiono `npm_telegram_package_spec`. Następnie
`OpenClaw Release Checks` rozgałęzia się na install smoke, cross-OS release checks,
live/E2E Docker release-path coverage, gdy włączono soak, Package Acceptance z Telegram
package QA, QA Lab parity, live Matrix i live Telegram. Pełny przebieg jest akceptowalny tylko wtedy, gdy
podsumowanie `Full Release Validation`
pokazuje `normal_ci` i `release_checks` jako zakończone powodzeniem. W trybie full/all
element potomny `npm_telegram` także musi zakończyć się powodzeniem; poza full/all jest pomijany,
chyba że podano opublikowany `npm_telegram_package_spec`. Końcowe
podsumowanie weryfikatora zawiera tabele najwolniejszych zadań dla każdego przebiegu potomnego, aby menedżer wydania
mógł zobaczyć bieżącą ścieżkę krytyczną bez pobierania logów.
Zobacz [pełną walidację wydania](/pl/reference/full-release-validation), aby poznać
pełną macierz etapów, dokładne nazwy zadań workflow, różnice między profilami stable i full,
artefakty oraz uchwyty do ukierunkowanych ponownych przebiegów.
Workflow potomne są uruchamiane z zaufanego ref, który uruchamia `Full Release
Validation`, zwykle `--ref main`, nawet gdy docelowy `ref` wskazuje
starszą gałąź lub tag wydania. Nie ma osobnego wejścia workflow-ref dla Full Release Validation;
wybierz zaufany harness, wybierając ref uruchomienia workflow.
Nie używaj `--ref main -f ref=<sha>` do dowodu dokładnego commita na ruchomym `main`;
surowe SHA commitów nie mogą być refami uruchomienia workflow, więc użyj
`pnpm ci:full-release --sha <sha>`, aby utworzyć przypiętą tymczasową gałąź.

Użyj `release_profile`, aby wybrać zakres live/provider:

- `minimum`: najszybsza krytyczna dla wydania ścieżka OpenAI/core live i Docker
- `stable`: minimum plus stabilne pokrycie provider/backend do zatwierdzenia wydania
- `full`: stable plus szerokie doradcze pokrycie provider/media

Użyj `run_release_soak=true` ze `stable`, gdy tory blokujące wydanie są
zielone i chcesz wykonać wyczerpujące live/E2E, Docker release-path oraz
ograniczony przegląd published upgrade-survivor przed promocją. Ten przegląd obejmuje
najnowsze cztery stabilne pakiety plus przypięte baseline’y `2026.4.23` i `2026.5.2`
oraz starsze pokrycie `2026.4.15`, z usuniętymi zduplikowanymi baseline’ami i
każdym baseline’em podzielonym do osobnego zadania Docker runnera. `full` implikuje
`run_release_soak=true`.

`OpenClaw Release Checks` używa zaufanego ref workflow, aby raz rozwiązać docelowy
ref jako `release-package-under-test` i ponownie używa tego artefaktu w cross-OS,
Package Acceptance oraz release-path Docker checks, gdy uruchamia się soak. Dzięki temu
wszystkie maszyny dotyczące pakietu pracują na tych samych bajtach i unika się powtarzanych buildów pakietu.
Cross-OS OpenAI install smoke używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy
ustawiona jest zmienna repo/org, w przeciwnym razie `openai/gpt-5.4`, ponieważ ten tor
sprawdza instalację pakietu, onboarding, start Gateway i jedną turę agenta live,
a nie benchmarkuje najwolniejszy model domyślny. Szersza macierz live provider
pozostaje miejscem na pokrycie specyficzne dla modelu.

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

Nie używaj pełnego parasola jako pierwszego ponownego przebiegu po ukierunkowanej poprawce. Jeśli jedna maszyna
zawiedzie, użyj workflow potomnego, zadania, toru Docker, profilu pakietu, providera modelu
lub toru QA, który zakończył się niepowodzeniem, jako następnego dowodu. Uruchom pełny parasol ponownie tylko wtedy, gdy
poprawka zmieniła współdzieloną orkiestrację wydania albo sprawiła, że wcześniejsze dowody ze wszystkich maszyn
stały się nieaktualne. Końcowy weryfikator parasola ponownie sprawdza zapisane identyfikatory przebiegów workflow potomnych,
więc po pomyślnym ponownym uruchomieniu workflow potomnego uruchom ponownie tylko nieudane
zadanie nadrzędne `Verify full validation`.

Do ograniczonego odzyskiwania przekaż `rerun_group` do parasola. `all` to rzeczywisty
przebieg release-candidate, `ci` uruchamia tylko zwykły element potomny CI, `plugin-prerelease`
uruchamia tylko element potomny plugin przeznaczony wyłącznie dla wydania, `release-checks` uruchamia każdą maszynę wydania,
a węższe grupy wydania to `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` i `npm-telegram`.
Ukierunkowane ponowne przebiegi `npm-telegram` wymagają `npm_telegram_package_spec`; przebiegi full/all
z `release_profile=full` używają artefaktu pakietu release-checks. Ukierunkowane
ponowne przebiegi cross-OS mogą dodać `cross_os_suite_filter=windows/packaged-upgrade` lub
inny filtr OS/suite. Niepowodzenia QA release-check są doradcze; niepowodzenie tylko QA
nie blokuje walidacji wydania.

### Vitest

Maszyna Vitest to ręczny workflow potomny `CI`. Ręczne CI celowo
pomija zakres zmian i wymusza zwykły graf testów dla kandydata wydania:
shardy Linux Node, shardy bundled-plugin, kontrakty kanałów, zgodność Node 22,
`check`, `check-additional`, build smoke, kontrole dokumentacji, Python
skills, Windows, macOS, Android i Control UI i18n.

Użyj tej maszyny, aby odpowiedzieć na pytanie „czy drzewo źródłowe przeszło pełny zwykły zestaw testów?”.
To nie jest to samo co walidacja produktu release-path. Dowody do zachowania:

- podsumowanie `Full Release Validation` pokazujące URL uruchomionego przebiegu `CI`
- przebieg `CI` zielony na dokładnym docelowym SHA
- nazwy nieudanych lub wolnych shardów z zadań CI podczas badania regresji
- artefakty czasu Vitest, takie jak `.artifacts/vitest-shard-timings.json`, gdy
  przebieg wymaga analizy wydajności

Uruchom ręczne CI bezpośrednio tylko wtedy, gdy wydanie wymaga deterministycznego zwykłego CI, ale
nie maszyn Docker, QA Lab, live, cross-OS ani package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Maszyna Docker znajduje się w `OpenClaw Release Checks` przez
`openclaw-live-and-e2e-checks-reusable.yml` oraz workflow `install-smoke`
w trybie wydania. Waliduje kandydata wydania przez spakowane
środowiska Docker, a nie tylko testy na poziomie źródeł.

Pokrycie Docker wydania obejmuje:

- pełny install smoke z włączonym wolnym globalnym install smoke Bun
- przygotowanie/ponowne użycie obrazu smoke root Dockerfile według docelowego SHA, z QR,
  root/gateway oraz zadaniami installer/Bun smoke uruchamianymi jako osobne shardy install-smoke
- tory E2E repozytorium
- fragmenty release-path Docker: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` i `plugins-runtime-install-h`
- pokrycie OpenWebUI wewnątrz fragmentu `plugins-runtime-services`, gdy jest wymagane
- podzielone tory instalacji/odinstalowania bundled plugin
  `bundled-plugin-install-uninstall-0` przez
  `bundled-plugin-install-uninstall-23`
- zestawy live/E2E provider oraz pokrycie Docker live model, gdy release checks
  obejmują zestawy live

Użyj artefaktów Docker przed ponownym uruchomieniem. Harmonogram release-path przesyła
`.artifacts/docker-tests/` z logami torów, `summary.json`, `failures.json`,
czasami faz, JSON planu harmonogramu i poleceniami ponownego uruchomienia. Do ukierunkowanego odzyskiwania
użyj `docker_lanes=<lane[,lane]>` w wielokrotnego użytku workflow live/E2E zamiast
ponownie uruchamiać wszystkie fragmenty wydania. Wygenerowane polecenia ponownego uruchomienia zawierają wcześniejsze
`package_artifact_run_id` i przygotowane wejścia obrazów Docker, gdy są dostępne, więc
nieudany tor może ponownie użyć tego samego tarballa i obrazów GHCR.

### QA Lab

Maszyna QA Lab jest także częścią `OpenClaw Release Checks`. To agentic
behavior i bramka wydania na poziomie kanału, oddzielna od mechaniki pakietów Vitest i Docker.

Pokrycie QA Lab wydania obejmuje:

- mock parity lane porównujący tor kandydata OpenAI z baseline’em Opus 4.6
  przy użyciu agentic parity pack
- szybki profil live Matrix QA używający środowiska `qa-live-shared`
- tor live Telegram QA używający dzierżaw poświadczeń Convex CI
- `pnpm qa:otel:smoke`, gdy telemetria wydania wymaga jawnego lokalnego dowodu

Użyj tej maszyny, aby odpowiedzieć na pytanie „czy wydanie zachowuje się poprawnie w scenariuszach QA i
przepływach kanałów live?”. Zachowaj URL-e artefaktów dla torów parity, Matrix i Telegram
podczas zatwierdzania wydania. Pełne pokrycie Matrix pozostaje dostępne jako
ręczny shardowany przebieg QA-Lab, a nie domyślny tor krytyczny dla wydania.

### Pakiet

Maszyna Package to bramka produktu instalowalnego. Jest oparta na
`Package Acceptance` i resolverze
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver normalizuje
kandydata do tarballa `package-under-test` używanego przez Docker E2E, waliduje
inventory pakietu, zapisuje wersję pakietu i SHA-256 oraz utrzymuje
ref harnessu workflow oddzielnie od ref źródła pakietu.

Obsługiwane źródła kandydatów:

- `source=npm`: `openclaw@beta`, `openclaw@latest` lub dokładna wersja wydania OpenClaw
- `source=ref`: spakuj zaufaną gałąź `package_ref`, tag albo pełne SHA commita
  z wybranym harnessem `workflow_ref`
- `source=url`: pobierz HTTPS `.tgz` z wymaganym `package_sha256`
- `source=artifact`: ponownie użyj `.tgz` przesłanego przez inny przebieg GitHub Actions

`OpenClaw Release Checks` uruchamia Package Acceptance z `source=artifact`,
przygotowanym artefaktem pakietu wydania, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance utrzymuje migrację, aktualizację,
restart aktualizacji skonfigurowanego auth, czyszczenie przestarzałych zależności plugin, offline plugin
fixtures, aktualizację plugin i Telegram package QA względem tego samego rozwiązanego
tarballa. Blokujące kontrole wydania używają domyślnego najnowszego opublikowanego pakietu
baseline; `run_release_soak=true` lub
`release_profile=full` rozszerza zakres do każdego stabilnego baseline’u opublikowanego w npm od
`2026.4.23` do `latest` plus fixtures zgłoszonych problemów. Użyj
Package Acceptance z `source=npm` dla kandydata już wydanego albo
`source=ref`/`source=artifact` dla lokalnego tarballa npm opartego na SHA przed
publikacją. To natywne dla GitHub
zastępstwo większości pokrycia package/update, które wcześniej wymagało
Parallels. Cross-OS release checks nadal mają znaczenie dla onboardingu specyficznego dla OS,
instalatora i zachowania platformy, ale walidacja produktu package/update powinna
preferować Package Acceptance.

Kanoniczna lista kontrolna walidacji aktualizacji i plugin to
[Testowanie aktualizacji i plugin](/pl/help/testing-updates-plugins). Użyj jej podczas
decydowania, który lokalny tor, Docker, Package Acceptance lub release-check dowodzi
instalacji/aktualizacji plugin, czyszczenia doctor albo zmiany migracji opublikowanego pakietu.
Wyczerpująca migracja opublikowanej aktualizacji z każdego stabilnego pakietu `2026.4.23+`
to osobny ręczny workflow `Update Migration`, a nie część Full Release CI.

Starsza łagodność akceptacji pakietów jest celowo ograniczona czasowo. Pakiety do
`2026.4.25` mogą używać ścieżki zgodności dla luk w metadanych już opublikowanych
w npm: prywatnych wpisów inwentarza QA brakujących w tarballu, brakującego
`gateway install --wrapper`, brakujących plików poprawek w fixture git
utworzonym z tarballa, brakującego utrwalonego `update.channel`, starszych
lokalizacji rekordów instalacji Plugin, brakującego utrwalania rekordów
instalacji z marketplace oraz migracji metadanych konfiguracji podczas
`plugins update`. Opublikowany pakiet `2026.4.26` może ostrzegać o lokalnych
plikach znaczników metadanych kompilacji, które zostały już wydane. Późniejsze
pakiety muszą spełniać nowoczesne kontrakty pakietów; te same luki powodują
niepowodzenie walidacji wydania.

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
- `package`: kontrakty instalacji/aktualizacji/restartu/pakietu Plugin bez live
  ClawHub; to domyślny profil kontroli wydania
- `product`: `package` plus kanały MCP, czyszczenie cron/subagent, wyszukiwanie
  web OpenAI oraz OpenWebUI
- `full`: fragmenty ścieżki wydania Docker z OpenWebUI
- `custom`: dokładna lista `docker_lanes` do ukierunkowanych ponownych uruchomień

Aby uzyskać dowód Telegram dla kandydata pakietu, włącz
`telegram_mode=mock-openai` albo `telegram_mode=live-frontier` w Package
Acceptance. Workflow przekazuje rozwiązany tarball `package-under-test` do
ścieżki Telegram; samodzielny workflow Telegram nadal akceptuje opublikowaną
specyfikację npm dla kontroli po publikacji.

## Automatyzacja publikacji wydania

`OpenClaw Release Publish` to normalny mutujący punkt wejścia publikacji.
Orkiestruje workflowy zaufanego wydawcy w kolejności wymaganej przez wydanie:

1. Pobierz tag wydania i rozwiąż jego commit SHA.
2. Zweryfikuj, że tag jest osiągalny z `main` albo `release/*`.
3. Uruchom `pnpm plugins:sync:check`.
4. Uruchom `Plugin NPM Release` z `publish_scope=all-publishable` i
   `ref=<release-sha>`.
5. Uruchom `Plugin ClawHub Release` z tym samym zakresem i SHA.
6. Uruchom `OpenClaw NPM Release` z tagiem wydania, tagiem dist npm i zapisanym
   `preflight_run_id`.

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

Używaj workflowów niższego poziomu `Plugin NPM Release` i
`Plugin ClawHub Release` tylko do ukierunkowanych napraw lub ponownej publikacji.
W przypadku naprawy wybranego Plugin przekaż `plugin_publish_scope=selected` i
`plugins=@openclaw/name` do `OpenClaw Release Publish` albo uruchom workflow
podrzędny bezpośrednio, gdy pakiet OpenClaw nie może zostać opublikowany.

## Dane wejściowe workflow NPM

`OpenClaw NPM Release` akceptuje następujące dane wejściowe kontrolowane przez
operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1` albo
  `v2026.4.2-beta.1`; gdy `preflight_only=true`, może to być także bieżący
  pełny 40-znakowy commit SHA gałęzi workflow do preflight tylko walidacyjnego
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
  do ukierunkowanych napraw
- `plugins`: rozdzielane przecinkami nazwy pakietów `@openclaw/*`, gdy
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: domyślnie `true`; ustaw `false` tylko przy używaniu
  workflow jako orkiestratora napraw wyłącznie Plugin

`OpenClaw Release Checks` akceptuje następujące dane wejściowe kontrolowane
przez operatora:

- `ref`: gałąź, tag albo pełny commit SHA do walidacji. Kontrole używające
  sekretów wymagają, aby rozwiązany commit był osiągalny z gałęzi OpenClaw albo
  tagu wydania.
- `run_release_soak`: włącza wyczerpujący live/E2E, ścieżkę wydania Docker oraz
  test długotrwały all-since upgrade-survivor na stabilnych/domyślnych
  kontrolach wydania. Jest wymuszany przez `release_profile=full`.

Reguły:

- Tagi stabilne i korekcyjne mogą publikować do `beta` albo `latest`
- Tagi przedwydania beta mogą publikować tylko do `beta`
- Dla `OpenClaw NPM Release` pełny commit SHA jest dozwolony tylko wtedy, gdy
  `preflight_only=true`
- `OpenClaw Release Checks` i `Full Release Validation` są zawsze wyłącznie
  walidacyjne
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, który
  użyto podczas preflight; workflow weryfikuje te metadane przed kontynuacją
  publikacji

## Sekwencja stabilnego wydania npm

Podczas tworzenia stabilnego wydania npm:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`
   - Zanim tag istnieje, możesz użyć bieżącego pełnego commit SHA gałęzi
     workflow do walidacyjnego suchego uruchomienia workflow preflight
2. Wybierz `npm_dist_tag=beta` dla normalnego przepływu najpierw beta albo
   `latest` tylko wtedy, gdy celowo chcesz bezpośrednią stabilną publikację
3. Uruchom `Full Release Validation` na gałęzi wydania, tagu wydania albo pełnym
   commit SHA, gdy chcesz normalne CI plus pokrycie live prompt cache, Docker,
   QA Lab, Matrix i Telegram z jednego ręcznego workflow
4. Jeśli celowo potrzebujesz tylko deterministycznego normalnego grafu testów,
   uruchom ręczny workflow `CI` na referencji wydania
5. Zapisz udany `preflight_run_id`
6. Uruchom `OpenClaw Release Publish` z tym samym `tag`, tym samym
   `npm_dist_tag` i zapisanym `preflight_run_id`; publikuje zewnętrzne Pluginy
   do npm i ClawHub przed promowaniem pakietu npm OpenClaw
7. Jeśli wydanie trafiło na `beta`, użyj prywatnego workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   aby promować tę stabilną wersję z `beta` do `latest`
8. Jeśli wydanie celowo opublikowano bezpośrednio do `latest`, a `beta` ma
   natychmiast wskazywać tę samą stabilną kompilację, użyj tego samego prywatnego
   workflow, aby skierować oba tagi dist na stabilną wersję, albo pozwól, aby
   zaplanowana samonaprawiająca synchronizacja przeniosła `beta` później

Mutacja tagu dist znajduje się w prywatnym repo ze względów bezpieczeństwa,
ponieważ nadal wymaga `NPM_TOKEN`, podczas gdy publiczne repo utrzymuje publikację
wyłącznie OIDC.

Dzięki temu zarówno bezpośrednia ścieżka publikacji, jak i ścieżka promocji
najpierw beta pozostają udokumentowane i widoczne dla operatora.

Jeśli maintainer musi wrócić do lokalnego uwierzytelniania npm, uruchamiaj
wszelkie polecenia 1Password CLI (`op`) tylko wewnątrz dedykowanej sesji tmux.
Nie wywołuj `op` bezpośrednio z głównej powłoki agenta; utrzymywanie go w tmux
sprawia, że prompty, alerty i obsługa OTP są obserwowalne, oraz zapobiega
powtarzającym się alertom hosta.

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
