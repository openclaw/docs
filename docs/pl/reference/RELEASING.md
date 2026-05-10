---
read_when:
    - Wyszukiwanie definicji publicznych kanałów wydań
    - Uruchamianie walidacji wydania lub akceptacji pakietu
    - Szukasz nazewnictwa wersji i rytmu wydań
summary: Ścieżki wydań, lista kontrolna operatora, pola walidacji, nazewnictwo wersji i cykl
title: Polityka wydań
x-i18n:
    generated_at: "2026-05-10T19:53:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ac11cfd0b5b1ebcc2fc010463c60e257a7e51802116b4b86d38d3a0da8a1dab
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ma trzy publiczne ścieżki wydań:

- stable: oznaczone tagami wydania, które domyślnie są publikowane do npm `beta`, albo do npm `latest`, gdy zażądano tego jawnie
- beta: tagi przedwydań publikowane do npm `beta`
- dev: ruchoma głowica `main`

## Nazewnictwo wersji

- Wersja wydania stabilnego: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Wersja poprawkowego wydania stabilnego: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Wersja przedwydania beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Nie dodawaj zer wiodących do miesiąca ani dnia
- `latest` oznacza bieżące promowane stabilne wydanie npm
- `beta` oznacza bieżący cel instalacji beta
- Wydania stabilne i poprawkowe wydania stabilne domyślnie publikują do npm `beta`; operatorzy wydań mogą jawnie wskazać `latest` albo później wypromować zweryfikowaną kompilację beta
- Każde stabilne wydanie OpenClaw dostarcza razem pakiet npm i aplikację macOS;
  wydania beta zwykle najpierw walidują i publikują ścieżkę npm/pakietu, a
  kompilacja, podpisywanie i notaryzacja aplikacji Mac są zarezerwowane dla stabilnych wydań, chyba że zażądano ich jawnie

## Rytm wydań

- Wydania przechodzą najpierw przez beta
- Stable następuje dopiero po zwalidowaniu najnowszej beta
- Maintainerzy zwykle wycinają wydania z gałęzi `release/YYYY.M.D` utworzonej
  z bieżącego `main`, aby walidacja wydania i poprawki nie blokowały nowego
  rozwoju na `main`
- Jeśli tag beta został wypchnięty lub opublikowany i wymaga poprawki, maintainerzy wycinają
  następny tag `-beta.N` zamiast usuwać lub odtwarzać stary tag beta
- Szczegółowa procedura wydania, zatwierdzenia, dane uwierzytelniające i notatki odzyskiwania są
  dostępne tylko dla maintainerów

## Lista kontrolna operatora wydania

Ta lista kontrolna pokazuje publiczny kształt przepływu wydania. Prywatne dane uwierzytelniające,
podpisywanie, notaryzacja, odzyskiwanie dist-tagów i szczegóły awaryjnego wycofywania pozostają w
runbooku wydań dostępnym tylko dla maintainerów.

1. Zacznij od bieżącego `main`: pobierz najnowsze zmiany, potwierdź, że docelowy commit został wypchnięty,
   i potwierdź, że bieżące CI `main` jest wystarczająco zielone, aby utworzyć z niego gałąź.
2. Przepisz górną sekcję `CHANGELOG.md` na podstawie rzeczywistej historii commitów za pomocą
   `/changelog`, utrzymaj wpisy jako zorientowane na użytkownika, zacommituj je, wypchnij i wykonaj rebase/pull
   jeszcze raz przed utworzeniem gałęzi.
3. Przejrzyj rekordy zgodności wydań w
   `src/plugins/compat/registry.ts` oraz
   `src/commands/doctor/shared/deprecation-compat.ts`. Usuń wygasłą
   zgodność tylko wtedy, gdy ścieżka aktualizacji pozostaje pokryta, albo odnotuj, dlaczego jest
   celowo utrzymywana.
4. Utwórz `release/YYYY.M.D` z bieżącego `main`; nie wykonuj normalnej pracy wydawniczej
   bezpośrednio na `main`.
5. Zwiększ każdą wymaganą lokalizację wersji dla zamierzonego tagu, a następnie uruchom
   `pnpm release:prep`. Odświeża to wersje pluginów, inwentarz pluginów, schemat
   konfiguracji, metadane konfiguracji wbudowanych kanałów, bazę dokumentacji konfiguracji, eksporty SDK
   pluginów i bazę API SDK pluginów we właściwej kolejności. Zacommituj każdy wygenerowany
   drift przed tagowaniem. Następnie uruchom lokalny deterministyczny preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` oraz `pnpm release:check`.
6. Uruchom `OpenClaw NPM Release` z `preflight_only=true`. Zanim tag istnieje,
   pełny 40-znakowy SHA gałęzi wydania jest dozwolony tylko do walidacyjnego
   preflightu. Zachowaj pomyślny `preflight_run_id`.
7. Uruchom wszystkie testy przedwydaniowe za pomocą `Full Release Validation` dla
   gałęzi wydania, tagu lub pełnego SHA commita. To jedyny ręczny punkt wejścia
   dla czterech dużych środowisk testowych wydania: Vitest, Docker, QA Lab i Package.
8. Jeśli walidacja się nie powiedzie, napraw problem na gałęzi wydania i ponownie uruchom najmniejszy nieudany
   plik, ścieżkę, zadanie workflow, profil pakietu, providera lub allowlistę modeli, która
   dowodzi poprawki. Uruchamiaj pełny parasol ponownie tylko wtedy, gdy zmieniona powierzchnia sprawia, że
   wcześniejsze dowody są nieaktualne.
9. Dla beta oznacz tagiem `vYYYY.M.D-beta.N`, a następnie uruchom `OpenClaw Release Publish` z
   pasującej gałęzi `release/YYYY.M.D`. Weryfikuje to `pnpm plugins:sync:check`,
   wysyła wszystkie publikowalne pakiety pluginów do npm i ten sam zestaw do
   ClawHub równolegle, a następnie promuje przygotowany artefakt preflight npm OpenClaw
   z pasującym dist-tagiem, gdy tylko publikacja pluginów npm się powiedzie.
   Po powodzeniu podrzędnego publish npm OpenClaw tworzy lub aktualizuje
   pasującą stronę wydania/przedwydania GitHub z kompletnej pasującej
   sekcji `CHANGELOG.md`. Stabilne wydania opublikowane do npm `latest` stają się
   najnowszym wydaniem GitHub; stabilne wydania utrzymaniowe pozostawione na npm `beta` są
   tworzone z GitHub `latest=false`.
   Publikowanie ClawHub może nadal trwać, gdy OpenClaw npm jest publikowany, ale
   workflow publikacji wydania od razu wypisuje identyfikatory podrzędnych uruchomień. Domyślnie
   nie czeka na ClawHub po jego wysłaniu, więc dostępność OpenClaw npm
   nie jest blokowana przez wolniejsze zatwierdzenia ClawHub ani prace rejestru; ustaw
   `wait_for_clawhub=true`, gdy ClawHub musi blokować ukończenie workflow. Ścieżka
   ClawHub ponawia przejściowe błędy instalacji zależności CLI, publikuje
   pluginy z zaliczonym preview nawet wtedy, gdy jedna komórka preview zawiedzie, i kończy
   weryfikacją rejestru dla każdej oczekiwanej wersji pluginu, aby częściowe publikacje
   pozostały widoczne i możliwe do ponowienia. Po publikacji uruchom
   popublikacyjną akceptację pakietu
   względem opublikowanego pakietu `openclaw@YYYY.M.D-beta.N` lub
   `openclaw@beta`. Jeśli wypchnięte lub opublikowane przedwydanie wymaga poprawki,
   wytnij następny pasujący numer przedwydania; nie usuwaj ani nie przepisuj starego
   przedwydania.
10. Dla stable kontynuuj tylko po tym, jak zweryfikowana beta lub kandydat do wydania ma
    wymagane dowody walidacji. Stabilna publikacja npm także przechodzi przez
    `OpenClaw Release Publish`, ponownie używając pomyślnego artefaktu preflight przez
    `preflight_run_id`; gotowość stabilnego wydania macOS wymaga także
    spakowanych `.zip`, `.dmg`, `.dSYM.zip` oraz zaktualizowanego `appcast.xml` na `main`.
    Prywatny workflow publikacji macOS publikuje podpisany appcast do publicznego
    `main` automatycznie po zweryfikowaniu zasobów wydania; jeśli ochrona gałęzi blokuje
    bezpośredni push, otwiera lub aktualizuje PR appcast.
11. Po publikacji uruchom weryfikator popublikacyjny npm, opcjonalny samodzielny
    Telegram E2E dla opublikowanego npm, gdy potrzebujesz popublikacyjnego dowodu kanału,
    promocję dist-tagu, gdy jest potrzebna, zweryfikuj wygenerowaną stronę wydania GitHub
    i uruchom kroki ogłoszenia wydania.

## Preflight wydania

- Uruchom `pnpm check:test-types` przed kontrolą wstępną wydania, aby TypeScript testów
  pozostawał objęty kontrolą poza szybszą lokalną bramką `pnpm check`
- Uruchom `pnpm check:architecture` przed kontrolą wstępną wydania, aby szersze kontrole cykli
  importów i granic architektury były zielone poza szybszą lokalną bramką
- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane
  artefakty wydania `dist/*` i pakiet Control UI istniały na potrzeby kroku
  walidacji pakietu
- Uruchom `pnpm release:prep` po podbiciu wersji w katalogu głównym i przed tagowaniem. Uruchamia
  każdy deterministyczny generator wydania, który często rozjeżdża się po zmianie
  wersji/konfiguracji/API: wersje Pluginów, spis Pluginów, schemat konfiguracji bazowej,
  metadane konfiguracji wbudowanego kanału, bazę dokumentacji konfiguracji, eksporty SDK
  Pluginów oraz bazę API SDK Pluginów. `pnpm release:check` ponownie uruchamia te
  zabezpieczenia w trybie sprawdzania i raportuje wszystkie znalezione rozjazdy wygenerowanych
  danych w jednym przebiegu przed uruchomieniem kontroli wydania pakietu.
- Uruchom ręczny workflow `Full Release Validation` przed zatwierdzeniem wydania, aby
  uruchomić wszystkie przedwydaniowe środowiska testowe z jednego punktu wejścia. Przyjmuje gałąź,
  tag lub pełny SHA commita, uruchamia ręcznie `CI` oraz uruchamia
  `OpenClaw Release Checks` dla testu instalacji, akceptacji pakietu, kontroli pakietów
  między systemami operacyjnymi, zgodności QA Lab, Matrix i ścieżek Telegram. Stabilne/domyślne przebiegi
  trzymają wyczerpujące testy live/E2E i Dockerowe wygrzewanie ścieżki wydania za
  `run_release_soak=true`; `release_profile=full` wymusza wygrzewanie. Z
  `release_profile=full` i `rerun_group=all` uruchamia także pakietowe Telegram
  E2E względem artefaktu `release-package-under-test` z kontroli wydania.
  Podaj `npm_telegram_package_spec` po publikacji, gdy to samo
  Telegram E2E ma potwierdzić również opublikowany pakiet npm. Podaj
  `package_acceptance_package_spec` po publikacji, gdy Package Acceptance
  ma uruchomić swoją macierz pakietu/aktualizacji względem wysłanego pakietu npm zamiast
  artefaktu zbudowanego z SHA. Podaj
  `evidence_package_spec`, gdy prywatny raport dowodowy ma potwierdzić, że
  walidacja pasuje do opublikowanego pakietu npm bez wymuszania Telegram E2E.
  Przykład:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Uruchom ręczny workflow `Package Acceptance`, gdy chcesz uzyskać poboczny dowód
  dla kandydata pakietu, podczas gdy prace nad wydaniem trwają. Użyj `source=npm` dla
  `openclaw@beta`, `openclaw@latest` lub dokładnej wersji wydania; `source=ref`,
  aby spakować zaufaną gałąź/tag/SHA `package_ref` z bieżącym
  harness `workflow_ref`; `source=url` dla archiwum tarball HTTPS z wymaganym
  SHA-256; albo `source=artifact` dla archiwum tarball przesłanego przez inny przebieg
  GitHub Actions. Workflow rozwiązuje kandydata do
  `package-under-test`, ponownie używa Dockerowego harmonogramu E2E wydania względem tego
  archiwum tarball i może uruchomić Telegram QA względem tego samego archiwum tarball z
  `telegram_mode=mock-openai` lub `telegram_mode=live-frontier`. Gdy wybrane
  ścieżki Docker zawierają `published-upgrade-survivor`, artefakt pakietu jest kandydatem,
  a `published_upgrade_survivor_baseline` wybiera opublikowaną bazę. `update-restart-auth`
  używa pakietu kandydata jako zainstalowanego CLI i pakietu-under-test, więc sprawdza
  zarządzaną ścieżkę restartu polecenia aktualizacji kandydata.
  Przykład: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Typowe profile:
  - `smoke`: ścieżki instalacji/kanału/agenta, sieci Gateway i przeładowania konfiguracji
  - `package`: natywne dla artefaktu ścieżki pakietu/aktualizacji/restartu/Pluginów bez OpenWebUI ani live ClawHub
  - `product`: profil pakietowy plus kanały MCP, czyszczenie cron/subagent,
    wyszukiwanie webowe OpenAI i OpenWebUI
  - `full`: fragmenty Dockerowej ścieżki wydania z OpenWebUI
  - `custom`: dokładny wybór `docker_lanes` dla ukierunkowanego ponownego przebiegu
- Uruchom ręczny workflow `CI` bezpośrednio, gdy potrzebujesz tylko pełnego normalnego
  pokrycia CI dla kandydata wydania. Ręczne uruchomienia CI pomijają zakresowanie według zmian
  i wymuszają ścieżki shardów Linux Node, shardów wbudowanych Pluginów, kontraktów kanałów,
  zgodności Node 22, `check`, `check-additional`, testu kompilacji,
  kontroli dokumentacji, Python skills, Windows, macOS, Android i i18n Control UI.
  Przykład: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Uruchom `pnpm qa:otel:smoke` podczas walidacji telemetrii wydania. Sprawdza
  QA-lab przez lokalny odbiornik OTLP/HTTP i weryfikuje nazwy wyeksportowanych spanów
  śladu, ograniczone atrybuty oraz redakcję treści/identyfikatorów bez
  wymagania Opik, Langfuse ani innego zewnętrznego kolektora.
- Uruchom `pnpm release:check` przed każdym tagowanym wydaniem
- Uruchom `OpenClaw Release Publish` dla mutującej sekwencji publikacji po tym, jak
  tag istnieje. Uruchom go z `release/YYYY.M.D` (lub `main`, gdy publikujesz tag
  osiągalny z main), przekaż tag wydania i pomyślny `preflight_run_id` npm
  OpenClaw, oraz zachowaj domyślny zakres publikacji Pluginów
  `all-publishable`, chyba że celowo wykonujesz ukierunkowaną naprawę. Workflow
  szereguje publikację Pluginu do npm, publikację Pluginu w ClawHub i publikację OpenClaw
  do npm, aby pakiet core nie został opublikowany przed swoimi zewnętrznymi
  Pluginami.
- Kontrole wydania są teraz uruchamiane w osobnym ręcznym workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` uruchamia także ścieżkę zgodności mock QA Lab oraz szybki
  profil live Matrix i ścieżkę Telegram QA przed zatwierdzeniem wydania. Ścieżki live
  używają środowiska `qa-live-shared`; Telegram używa także dzierżaw danych uwierzytelniających Convex CI.
  Uruchom ręczny workflow `QA-Lab - All Lanes` z
  `matrix_profile=all` i `matrix_shards=true`, gdy chcesz równolegle uzyskać pełny spis
  transportu Matrix, mediów i E2EE.
- Walidacja runtime instalacji i aktualizacji między systemami operacyjnymi jest częścią publicznych
  `OpenClaw Release Checks` i `Full Release Validation`, które wywołują
  bezpośrednio workflow wielokrotnego użytku
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Ten podział jest celowy: utrzymuje rzeczywistą ścieżkę wydania npm krótką,
  deterministyczną i skupioną na artefaktach, podczas gdy wolniejsze kontrole live pozostają
  we własnej ścieżce, aby nie zatrzymywały ani nie blokowały publikacji
- Kontrole wydania przenoszące sekrety powinny być uruchamiane przez `Full Release
Validation` albo z refa workflow `main`/release, aby logika workflow i
  sekrety pozostawały kontrolowane
- `OpenClaw Release Checks` przyjmuje gałąź, tag lub pełny SHA commita, o ile
  rozwiązany commit jest osiągalny z gałęzi OpenClaw lub tagu wydania
- Kontrola wstępna tylko do walidacji `OpenClaw NPM Release` przyjmuje także bieżący
  pełny 40-znakowy SHA commita gałęzi workflow bez wymagania wypchniętego tagu
- Ta ścieżka SHA służy tylko do walidacji i nie może zostać promowana do rzeczywistej publikacji
- W trybie SHA workflow syntetyzuje `v<package.json version>` tylko na potrzeby
  kontroli metadanych pakietu; rzeczywista publikacja nadal wymaga prawdziwego tagu wydania
- Oba workflow utrzymują rzeczywistą ścieżkę publikacji i promocji na runnerach
  hostowanych przez GitHub, podczas gdy niemutująca ścieżka walidacji może używać większych
  runnerów Blacksmith Linux
- Ten workflow uruchamia
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  używając sekretów workflow `OPENAI_API_KEY` i `ANTHROPIC_API_KEY`
- Kontrola wstępna wydania npm nie czeka już na osobną ścieżkę kontroli wydania
- Uruchom `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (lub pasujący tag beta/korekty) przed zatwierdzeniem
- Po publikacji npm uruchom
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (lub pasującą wersję beta/korekty), aby zweryfikować ścieżkę instalacji z opublikowanego rejestru
  w świeżym tymczasowym prefiksie
- Po publikacji beta uruchom `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  aby zweryfikować onboarding zainstalowanego pakietu, konfigurację Telegram i rzeczywiste Telegram E2E
  względem opublikowanego pakietu npm z użyciem współdzielonej puli dzierżawionych danych uwierzytelniających Telegram.
  Lokalne jednorazowe przebiegi maintainerów mogą pominąć zmienne Convex i przekazać trzy
  dane uwierzytelniające env `OPENCLAW_QA_TELEGRAM_*` bezpośrednio.
- Aby uruchomić pełny test smoke beta po publikacji z maszyny maintainera, użyj `pnpm release:beta-smoke -- --beta betaN`. Helper uruchamia walidację aktualizacji npm Parallels/świeżego celu, uruchamia `NPM Telegram Beta E2E`, odpytuje dokładny przebieg workflow, pobiera artefakt i wypisuje raport Telegram.
- Maintainerzy mogą uruchomić tę samą kontrolę po publikacji z GitHub Actions przez
  ręczny workflow `NPM Telegram Beta E2E`. Jest on celowo wyłącznie ręczny i
  nie uruchamia się przy każdym merge.
- Automatyzacja wydań maintainerów używa teraz schematu kontrola wstępna-potem-promocja:
  - rzeczywista publikacja npm musi przejść pomyślny `preflight_run_id` npm
  - rzeczywista publikacja npm musi zostać uruchomiona z tej samej gałęzi `main` lub
    `release/YYYY.M.D`, co pomyślny przebieg kontroli wstępnej
  - stabilne wydania npm domyślnie trafiają do `beta`
  - stabilna publikacja npm może jawnie wskazać `latest` przez wejście workflow
  - mutacja tokenowego tagu dystrybucji npm znajduje się teraz w
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    ze względów bezpieczeństwa, ponieważ `npm dist-tag add` nadal wymaga `NPM_TOKEN`, podczas gdy
    publiczne repo zachowuje publikację wyłącznie przez OIDC
  - publiczne `macOS Release` służy tylko do walidacji; gdy tag istnieje tylko na
    gałęzi wydania, ale workflow jest uruchamiany z `main`, ustaw
    `public_release_branch=release/YYYY.M.D`
  - rzeczywista prywatna publikacja mac musi przejść pomyślne prywatne mac
    `preflight_run_id` i `validate_run_id`
  - rzeczywiste ścieżki publikacji promują przygotowane artefakty zamiast budować
    je ponownie
- Dla stabilnych wydań korygujących, takich jak `YYYY.M.D-N`, weryfikator po publikacji
  sprawdza także tę samą ścieżkę aktualizacji w tymczasowym prefiksie z `YYYY.M.D` do `YYYY.M.D-N`,
  aby korekty wydania nie mogły po cichu zostawić starszych instalacji globalnych na
  bazowym stabilnym ładunku
- Kontrola wstępna wydania npm kończy się niepowodzeniem zamkniętym, chyba że archiwum tarball zawiera zarówno
  `dist/control-ui/index.html`, jak i niepusty ładunek `dist/control-ui/assets/`,
  abyśmy ponownie nie wysłali pustego dashboardu przeglądarkowego
- Weryfikacja po publikacji sprawdza także, czy entrypointy opublikowanych Pluginów i
  metadane pakietu są obecne w zainstalowanym układzie rejestru. Wydanie, które
  wysyła brakujące ładunki runtime Pluginów, nie przechodzi weryfikatora po publikacji i
  nie może zostać promowane do `latest`.
- `pnpm test:install:smoke` egzekwuje także budżet `unpackedSize` pakietu npm dla
  archiwum tarball aktualizacji kandydata, aby installer e2e wyłapywał przypadkowe rozdęcie pakietu
  przed ścieżką publikacji wydania
- Jeśli prace nad wydaniem dotknęły planowania CI, manifestów czasu rozszerzeń lub
  macierzy testów rozszerzeń, wygeneruj ponownie i przejrzyj należące do plannera
  wyjścia macierzy `plugin-prerelease-extension-shard` z
  `.github/workflows/plugin-prerelease.yml` przed zatwierdzeniem, aby notatki wydania nie
  opisywały nieaktualnego układu CI
- Gotowość stabilnego wydania macOS obejmuje także powierzchnie aktualizatora:
  - wydanie GitHub musi ostatecznie zawierać spakowane `.zip`, `.dmg` i `.dSYM.zip`
  - `appcast.xml` na `main` musi wskazywać nowy stabilny zip po publikacji; prywatny
    workflow publikacji macOS commitujego go automatycznie albo otwiera PR appcast,
    gdy bezpośredni push jest zablokowany
  - spakowana aplikacja musi zachować nie-debugowy bundle id, niepusty URL kanału Sparkle
    oraz `CFBundleVersion` na poziomie lub powyżej kanonicznego progu builda Sparkle
    dla tej wersji wydania

## Środowiska testowe wydania

`Full Release Validation` to sposób, w jaki operatorzy uruchamiają wszystkie testy przedwydaniowe z
jednego punktu wejścia. Aby uzyskać dowód przypiętego commita na szybko zmieniającej się gałęzi, użyj
helpera, aby każdy workflow potomny uruchamiał się z tymczasowej gałęzi ustalonej na docelowym
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Narzędzie pomocnicze wypycha `release-ci/<sha>-...`, wywołuje `Full Release Validation`
z tej gałęzi z `ref=<sha>`, weryfikuje, że każdy przepływ pracy podrzędny `headSha`
pasuje do celu, a następnie usuwa gałąź tymczasową. Pozwala to uniknąć przypadkowego potwierdzenia
nowszego uruchomienia podrzędnego z `main`.

Aby zweryfikować gałąź wydania lub tag, uruchom to z zaufanego odwołania przepływu pracy `main`
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

Przepływ pracy rozwiązuje docelowe odwołanie, wywołuje ręczne `CI` z
`target_ref=<release-ref>`, wywołuje `OpenClaw Release Checks`, przygotowuje
artefakt nadrzędny `release-package-under-test` dla kontroli dotyczących pakietu i
wywołuje samodzielne pakietowe Telegram E2E, gdy `release_profile=full` z
`rerun_group=all` lub gdy ustawiono `npm_telegram_package_spec`. Następnie `OpenClaw Release
Checks` rozdziela się na smoke test instalacji, międzyplatformowe kontrole wydania, pokrycie live/E2E Docker
ścieżki wydania, gdy włączony jest soak, Package Acceptance z Telegram
package QA, parytet QA Lab, live Matrix oraz live Telegram. Pełne uruchomienie jest akceptowalne tylko wtedy, gdy
podsumowanie `Full Release Validation`
pokazuje `normal_ci` i `release_checks` jako zakończone sukcesem. W trybie full/all
dziecko `npm_telegram` również musi zakończyć się sukcesem; poza full/all jest pomijane,
chyba że podano opublikowane `npm_telegram_package_spec`. Końcowe
podsumowanie weryfikatora zawiera tabele najwolniejszych zadań dla każdego uruchomienia podrzędnego, dzięki czemu menedżer wydania może zobaczyć bieżącą ścieżkę krytyczną bez pobierania logów.
Zobacz [Pełna walidacja wydania](/pl/reference/full-release-validation), aby uzyskać
pełną macierz etapów, dokładne nazwy zadań przepływu pracy, różnice między profilami stable i full,
artefakty oraz uchwyty do ukierunkowanego ponownego uruchamiania.
Przepływy pracy podrzędne są wywoływane z zaufanego odwołania, które uruchamia `Full Release
Validation`, zwykle `--ref main`, nawet gdy docelowe `ref` wskazuje
starszą gałąź wydania lub tag. Nie ma osobnego wejścia odwołania przepływu pracy Full Release Validation;
wybierz zaufany mechanizm testowy, wybierając odwołanie uruchomienia przepływu pracy.
Nie używaj `--ref main -f ref=<sha>` do dowodu dokładnego commita na zmieniającym się `main`;
surowe SHA commitów nie mogą być odwołaniami wywołania przepływu pracy, więc użyj
`pnpm ci:full-release --sha <sha>`, aby utworzyć przypiętą gałąź tymczasową.

Użyj `release_profile`, aby wybrać zakres live/provider:

- `minimum`: najszybsza krytyczna dla wydania ścieżka OpenAI/core live i Docker
- `stable`: minimum plus stabilne pokrycie dostawcy/backendu do zatwierdzenia wydania
- `full`: stable plus szerokie doradcze pokrycie dostawców/mediów

Użyj `run_release_soak=true` ze `stable`, gdy pasma blokujące wydanie są
zielone i przed promocją chcesz wyczerpujący live/E2E, ścieżkę wydania Docker oraz
ograniczony przegląd odporności aktualizacji z opublikowanych wersji. Ten przegląd obejmuje
cztery najnowsze stabilne pakiety plus przypięte bazowe `2026.4.23` i `2026.5.2`
oraz starsze pokrycie `2026.4.15`, z usuniętymi duplikatami bazowymi i
każdą bazą podzieloną do osobnego zadania uruchamiającego Docker. `full` implikuje
`run_release_soak=true`.

`OpenClaw Release Checks` używa zaufanego odwołania przepływu pracy, aby raz rozwiązać docelowe
odwołanie jako `release-package-under-test` i ponownie używa tego artefaktu w kontrolach międzyplatformowych,
Package Acceptance oraz kontrolach Docker ścieżki wydania, gdy działa soak. Dzięki temu
wszystkie maszyny dotyczące pakietu działają na tych samych bajtach i unika się powtarzanych kompilacji pakietu.
Międzyplatformowy smoke test instalacji OpenAI używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy
ustawiona jest zmienna repozytorium/organizacji, w przeciwnym razie `openai/gpt-5.4`, ponieważ to pasmo
potwierdza instalację pakietu, onboarding, uruchomienie Gateway i jedną turę agenta live,
a nie benchmark najwolniejszego modelu domyślnego. Szersza macierz dostawców live
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

Nie używaj pełnej parasolowej walidacji jako pierwszego ponownego uruchomienia po ukierunkowanej poprawce. Jeśli jedna maszyna
zawiedzie, użyj nieudanego przepływu pracy podrzędnego, zadania, pasma Docker, profilu pakietu, dostawcy
modelu lub pasma QA dla następnego dowodu. Uruchom pełną parasolową walidację ponownie tylko wtedy, gdy
poprawka zmieniła wspólną orkiestrację wydania albo sprawiła, że wcześniejsze dowody ze wszystkich maszyn
stały się nieaktualne. Końcowy weryfikator walidacji parasolowej ponownie sprawdza zapisane identyfikatory uruchomień przepływów pracy podrzędnych,
więc po pomyślnym ponownym uruchomieniu przepływu pracy podrzędnego uruchom ponownie tylko nieudane
zadanie nadrzędne `Verify full validation`.

Do ograniczonego odzyskiwania przekaż `rerun_group` do walidacji parasolowej. `all` to właściwe
uruchomienie kandydata wydania, `ci` uruchamia tylko normalne dziecko CI, `plugin-prerelease`
uruchamia tylko dziecko pluginów wyłącznie dla wydania, `release-checks` uruchamia każdą maszynę wydania,
a węższe grupy wydania to `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` i `npm-telegram`.
Ukierunkowane ponowne uruchomienia `npm-telegram` wymagają `npm_telegram_package_spec`; uruchomienia full/all
z `release_profile=full` używają artefaktu pakietu z release-checks. Ukierunkowane
ponowne uruchomienia cross-OS mogą dodać `cross_os_suite_filter=windows/packaged-upgrade` lub
inny filtr systemu operacyjnego/zestawu. Niepowodzenia QA release-check są doradcze; niepowodzenie wyłącznie QA
nie blokuje walidacji wydania.

### Vitest

Maszyna Vitest to ręczny przepływ pracy podrzędny `CI`. Ręczne CI celowo
omija zakres zmian i wymusza normalny graf testów dla kandydata wydania:
shardy Linux Node, shardy bundled-plugin, kontrakty kanałów, zgodność Node 22,
`check`, `check-additional`, smoke test kompilacji, kontrole dokumentacji, Python
skills, Windows, macOS, Android oraz i18n Control UI.

Użyj tej maszyny, aby odpowiedzieć na pytanie „czy drzewo źródłowe przeszło pełny normalny zestaw testów?”
To nie jest to samo co walidacja produktu ścieżki wydania. Dowody do zachowania:

- podsumowanie `Full Release Validation` pokazujące URL wywołanego uruchomienia `CI`
- zielone uruchomienie `CI` na dokładnym docelowym SHA
- nazwy nieudanych lub wolnych shardów z zadań CI podczas badania regresji
- artefakty czasów Vitest, takie jak `.artifacts/vitest-shard-timings.json`, gdy
  uruchomienie wymaga analizy wydajności

Uruchom ręczne CI bezpośrednio tylko wtedy, gdy wydanie wymaga deterministycznego normalnego CI, ale
nie maszyn Docker, QA Lab, live, cross-OS ani package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Maszyna Docker znajduje się w `OpenClaw Release Checks` poprzez
`openclaw-live-and-e2e-checks-reusable.yml` oraz przepływ pracy `install-smoke`
w trybie wydania. Weryfikuje kandydata wydania przez spakowane
środowiska Docker, a nie tylko testy na poziomie źródeł.

Pokrycie Docker wydania obejmuje:

- pełny smoke test instalacji z włączonym wolnym smoke testem globalnej instalacji Bun
- przygotowanie/ponowne użycie obrazu smoke root Dockerfile według docelowego SHA, z zadaniami QR,
  root/gateway oraz installer/Bun smoke uruchamianymi jako osobne shardy install-smoke
- pasma E2E repozytorium
- fragmenty Docker ścieżki wydania: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` i `plugins-runtime-install-h`
- pokrycie OpenWebUI we fragmencie `plugins-runtime-services`, gdy jest wymagane
- podzielone pasma instalacji/dezinstalacji bundled plugin
  `bundled-plugin-install-uninstall-0` do
  `bundled-plugin-install-uninstall-23`
- zestawy dostawców live/E2E i pokrycie modeli live Docker, gdy kontrole wydania
  obejmują zestawy live

Użyj artefaktów Docker przed ponownym uruchomieniem. Harmonogram ścieżki wydania przesyła
`.artifacts/docker-tests/` z logami pasm, `summary.json`, `failures.json`,
czasami faz, planem harmonogramu JSON i poleceniami ponownego uruchamiania. Do ukierunkowanego odzyskiwania
użyj `docker_lanes=<lane[,lane]>` w przepływie pracy wielokrotnego użytku live/E2E zamiast
ponownie uruchamiać wszystkie fragmenty wydania. Wygenerowane polecenia ponownego uruchamiania zawierają wcześniejsze
`package_artifact_run_id` i przygotowane wejścia obrazu Docker, gdy są dostępne, dzięki czemu
nieudane pasmo może ponownie użyć tego samego tarballa i obrazów GHCR.

### QA Lab

Maszyna QA Lab jest również częścią `OpenClaw Release Checks`. Jest to bramka wydania dla zachowań agentowych
i poziomu kanałów, oddzielona od Vitest oraz mechaniki pakietów Docker.

Pokrycie QA Lab wydania obejmuje:

- pasmo parytetu mock porównujące pasmo kandydata OpenAI z bazą Opus 4.6
  przy użyciu pakietu parytetu agentowego
- szybki profil live Matrix QA używający środowiska `qa-live-shared`
- pasmo live Telegram QA używające dzierżaw poświadczeń Convex CI
- `pnpm qa:otel:smoke`, gdy telemetria wydania wymaga jawnego lokalnego dowodu

Użyj tej maszyny, aby odpowiedzieć na pytanie „czy wydanie zachowuje się poprawnie w scenariuszach QA i
przepływach kanałów live?” Zachowaj URL-e artefaktów dla pasm parytetu, Matrix i Telegram
podczas zatwierdzania wydania. Pełne pokrycie Matrix pozostaje dostępne jako
ręczne shardowane uruchomienie QA-Lab, a nie domyślne pasmo krytyczne dla wydania.

### Package

Maszyna Package to bramka produktu instalowalnego. Jest wspierana przez
`Package Acceptance` i resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver normalizuje
kandydata do tarballa `package-under-test` używanego przez Docker E2E, weryfikuje
inwentarz pakietu, zapisuje wersję pakietu i SHA-256 oraz utrzymuje
odwołanie mechanizmu testowego przepływu pracy oddzielone od odwołania źródła pakietu.

Obsługiwane źródła kandydatów:

- `source=npm`: `openclaw@beta`, `openclaw@latest` albo dokładna wersja wydania OpenClaw
- `source=ref`: spakuj zaufaną gałąź `package_ref`, tag albo pełny SHA commita
  z wybranym mechanizmem testowym `workflow_ref`
- `source=url`: pobierz HTTPS `.tgz` z wymaganym `package_sha256`
- `source=artifact`: użyj ponownie `.tgz` przesłanego przez inne uruchomienie GitHub Actions

`OpenClaw Release Checks` uruchamia Package Acceptance z `source=artifact`,
przygotowanym artefaktem pakietu wydania, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance utrzymuje migrację, aktualizację,
restart aktualizacji skonfigurowanego uwierzytelniania, instalację live Skills z ClawHub, czyszczenie przestarzałych zależności pluginów, fixture’y pluginów offline,
aktualizację pluginów i Telegram package QA względem tego samego rozwiązanego
tarballa. Blokujące kontrole wydania używają domyślnej najnowszej opublikowanej bazy pakietu;
`run_release_soak=true` lub
`release_profile=full` rozszerza zakres do każdej stabilnej bazy opublikowanej w npm od
`2026.4.23` do `latest` plus fixture’y zgłoszonych problemów. Użyj
Package Acceptance z `source=npm` dla już dostarczonego kandydata albo
`source=ref`/`source=artifact` dla lokalnego tarballa npm opartego na SHA przed
publikacją. Jest to natywny dla GitHub
zamiennik większości pokrycia pakietów/aktualizacji, które wcześniej wymagało
Parallels. Międzyplatformowe kontrole wydania nadal mają znaczenie dla specyficznego dla systemu onboardingu,
instalatora i zachowania platformy, ale walidacja produktu dotycząca pakietów/aktualizacji powinna
preferować Package Acceptance.

Kanoniczna lista kontrolna dla walidacji aktualizacji i Pluginów to
[Testowanie aktualizacji i Pluginów](/pl/help/testing-updates-plugins). Używaj jej przy
wyborze, która ścieżka lokalna, Docker, Package Acceptance lub release-check potwierdza
instalację/aktualizację Pluginu, porządkowanie przez doctor albo zmianę migracji opublikowanego pakietu.
Wyczerpująca migracja opublikowanych aktualizacji z każdego stabilnego pakietu `2026.4.23+` jest
osobnym ręcznym przepływem pracy `Update Migration`, a nie częścią Full Release CI.

Celowo ograniczono czasowo łagodniejsze wymagania dla starszego package-acceptance. Pakiety do
`2026.4.25` włącznie mogą używać ścieżki zgodności dla luk w metadanych już opublikowanych
w npm: prywatnych wpisów inwentarza QA brakujących w tarballu, brakującego
`gateway install --wrapper`, brakujących plików poprawek w fixture git pochodzącym z tarballa,
brakującego utrwalonego `update.channel`, starszych lokalizacji rekordów instalacji Pluginów,
brakującego utrwalania rekordów instalacji z marketplace oraz migracji metadanych konfiguracji
podczas `plugins update`. Opublikowany pakiet `2026.4.26` może ostrzegać
o plikach znaczników metadanych lokalnej kompilacji, które zostały już wydane. Późniejsze pakiety
muszą spełniać nowoczesne kontrakty pakietów; te same luki powodują niepowodzenie
walidacji wydania.

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

- `smoke`: szybkie ścieżki instalacji pakietu/kanału/agenta, sieci Gateway i ponownego
  ładowania konfiguracji
- `package`: kontrakty instalacji/aktualizacji/restartu/pakietu Pluginów oraz dowód instalacji
  Skills z użyciem ClawHub na żywo; to domyślna wartość release-check
- `product`: `package` plus kanały MCP, czyszczenie cron/subagent, wyszukiwanie w sieci OpenAI
  oraz OpenWebUI
- `full`: fragmenty ścieżki wydania Docker z OpenWebUI
- `custom`: dokładna lista `docker_lanes` do ukierunkowanych ponownych uruchomień

Dla dowodu Telegram dla kandydata pakietu włącz `telegram_mode=mock-openai` albo
`telegram_mode=live-frontier` w Package Acceptance. Przepływ pracy przekazuje
rozwiązany tarball `package-under-test` do ścieżki Telegram; samodzielny przepływ pracy
Telegram nadal przyjmuje opublikowaną specyfikację npm dla kontroli po publikacji.

## Automatyzacja publikacji wydania

`OpenClaw Release Publish` jest standardowym mutującym punktem wejścia publikacji. Orkiestruje
przepływy pracy trusted-publisher w kolejności wymaganej przez wydanie:

1. Pobierz tag wydania i ustal jego SHA commita.
2. Zweryfikuj, że tag jest osiągalny z `main` albo `release/*`.
3. Uruchom `pnpm plugins:sync:check`.
4. Uruchom `Plugin NPM Release` z `publish_scope=all-publishable` i
   `ref=<release-sha>`.
5. Uruchom `Plugin ClawHub Release` z tym samym zakresem i SHA.
6. Uruchom `OpenClaw NPM Release` z tagiem wydania, npm dist-tag i
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

Używaj niższopoziomowych przepływów pracy `Plugin NPM Release` i `Plugin ClawHub Release`
tylko do ukierunkowanych napraw albo ponownych publikacji. Dla naprawy wybranego Pluginu przekaż
`plugin_publish_scope=selected` i `plugins=@openclaw/name` do
`OpenClaw Release Publish`, albo uruchom przepływ podrzędny bezpośrednio, gdy
pakiet OpenClaw nie może zostać opublikowany.

## Dane wejściowe przepływu pracy NPM

`OpenClaw NPM Release` przyjmuje te dane wejściowe kontrolowane przez operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1` albo
  `v2026.4.2-beta.1`; gdy `preflight_only=true`, może to być także bieżący
  pełny 40-znakowy SHA commita gałęzi przepływu pracy dla preflight wyłącznie walidacyjnego
- `preflight_only`: `true` tylko dla walidacji/kompilacji/pakietu, `false` dla
  rzeczywistej ścieżki publikacji
- `preflight_run_id`: wymagane w rzeczywistej ścieżce publikacji, aby przepływ pracy ponownie użył
  przygotowanego tarballa z udanego przebiegu preflight
- `npm_dist_tag`: docelowy tag npm dla ścieżki publikacji; domyślnie `beta`

`OpenClaw Release Publish` przyjmuje te dane wejściowe kontrolowane przez operatora:

- `tag`: wymagany tag wydania; musi już istnieć
- `preflight_run_id`: identyfikator udanego przebiegu preflight `OpenClaw NPM Release`;
  wymagany, gdy `publish_openclaw_npm=true`
- `npm_dist_tag`: docelowy tag npm dla pakietu OpenClaw
- `plugin_publish_scope`: domyślnie `all-publishable`; używaj `selected` tylko
  do ukierunkowanych napraw
- `plugins`: rozdzielone przecinkami nazwy pakietów `@openclaw/*`, gdy
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: domyślnie `true`; ustaw `false` tylko wtedy, gdy używasz
  przepływu pracy jako orkiestratora napraw wyłącznie Pluginów

`OpenClaw Release Checks` przyjmuje te dane wejściowe kontrolowane przez operatora:

- `ref`: gałąź, tag albo pełny SHA commita do walidacji. Kontrole z dostępem do sekretów
  wymagają, aby rozwiązany commit był osiągalny z gałęzi OpenClaw albo
  tagu wydania.
- `run_release_soak`: włącza wyczerpujące sprawdzenie live/E2E, ścieżkę wydania Docker oraz
  sprawdzenie all-since upgrade-survivor przy stabilnych/domyślnych kontrolach wydania. Jest wymuszane
  przez `release_profile=full`.

Zasady:

- Tagi stabilne i korekcyjne mogą publikować do `beta` albo `latest`
- Tagi prerelease beta mogą publikować tylko do `beta`
- Dla `OpenClaw NPM Release` wejściowy pełny SHA commita jest dozwolony tylko wtedy, gdy
  `preflight_only=true`
- `OpenClaw Release Checks` i `Full Release Validation` zawsze służą
  wyłącznie do walidacji
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, którego użyto podczas preflight;
  przepływ pracy weryfikuje te metadane przed kontynuowaniem publikacji

## Sekwencja stabilnego wydania npm

Przy tworzeniu stabilnego wydania npm:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`
   - Zanim tag będzie istnieć, możesz użyć bieżącego pełnego SHA commita gałęzi przepływu pracy
     do walidacyjnego suchego przebiegu przepływu pracy preflight
2. Wybierz `npm_dist_tag=beta` dla standardowego przepływu najpierw-beta albo `latest` tylko
   wtedy, gdy celowo chcesz bezpośrednią stabilną publikację
3. Uruchom `Full Release Validation` na gałęzi wydania, tagu wydania albo pełnym
   SHA commita, gdy chcesz uzyskać normalne CI oraz pokrycie live prompt cache, Docker, QA Lab,
   Matrix i Telegram z jednego ręcznego przepływu pracy
4. Jeśli celowo potrzebujesz tylko deterministycznego zwykłego grafu testów, uruchom
   ręczny przepływ pracy `CI` na refie wydania
5. Zapisz udany `preflight_run_id`
6. Uruchom `OpenClaw Release Publish` z tym samym `tag`, tym samym `npm_dist_tag`
   i zapisanym `preflight_run_id`; publikuje zewnętrzne Pluginy do npm
   i ClawHub przed promowaniem pakietu npm OpenClaw
7. Jeśli wydanie trafiło na `beta`, użyj prywatnego przepływu pracy
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   aby wypromować tę stabilną wersję z `beta` do `latest`
8. Jeśli wydanie celowo opublikowano bezpośrednio do `latest`, a `beta`
   powinno od razu wskazywać tę samą stabilną kompilację, użyj tego samego prywatnego
   przepływu pracy, aby skierować oba dist-tag na stabilną wersję, albo pozwól, by jego zaplanowana
   samonaprawiająca synchronizacja przeniosła `beta` później

Mutacja dist-tag znajduje się w prywatnym repo ze względów bezpieczeństwa, ponieważ nadal
wymaga `NPM_TOKEN`, podczas gdy publiczne repo utrzymuje publikację wyłącznie przez OIDC.

Dzięki temu bezpośrednia ścieżka publikacji i ścieżka promocji najpierw-beta są
udokumentowane i widoczne dla operatora.

Jeśli maintainer musi użyć awaryjnie lokalnego uwierzytelniania npm, uruchamiaj wszystkie polecenia
CLI 1Password (`op`) tylko w dedykowanej sesji tmux. Nie wywołuj `op`
bezpośrednio z głównej powłoki agenta; utrzymywanie go w tmux sprawia, że monity,
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

- [Kanały wydania](/pl/install/development-channels)
