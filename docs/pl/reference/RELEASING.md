---
read_when:
    - Szukanie definicji publicznych kanałów wydań
    - Uruchamianie walidacji wydania lub akceptacji pakietu
    - Szukasz nazewnictwa wersji i rytmu wydań
summary: Ścieżki wydań, lista kontrolna operatora, pola walidacji, nazewnictwo wersji i rytm wydań
title: Zasady wydań
x-i18n:
    generated_at: "2026-07-04T18:26:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00772c1a2ad62eb7138b1eda581786390835add0a96996114cac2fd77edb367
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw obecnie udostępnia trzy kanały aktualizacji widoczne dla użytkownika:

- stable: istniejący promowany kanał wydań, który nadal rozwiązuje się przez
  npm `latest`, dopóki nie zostanie ukończony osobny kamień milowy CLI/kanału
- beta: tagi wersji wstępnych publikowane do npm `beta`
- dev: ruchoma głowica `main`

Osobno operatorzy wydań mogą publikować pakiet rdzenia z zakończonego poprzedniego
miesiąca do npm `extended-stable`, zaczynając od poprawki `33`. Regularna
linia finalna bieżącego miesiąca nadal używa npm `latest`; ten operatorski
podział publikacji sam w sobie nie zmienia rozwiązywania kanału aktualizacji CLI.

## Nazewnictwo wersji

- Miesięczna wersja npm extended-stable: `YYYY.M.PATCH`, z `PATCH >= 33`
  - Tag Git: `vYYYY.M.PATCH`
- Dzienna/regularna wersja finalna: `YYYY.M.PATCH`, z `PATCH < 33`
  - Tag Git: `vYYYY.M.PATCH`
- Regularna wersja poprawki awaryjnej: `YYYY.M.PATCH-N`
  - Tag Git: `vYYYY.M.PATCH-N`
- Wersja wstępna beta: `YYYY.M.PATCH-beta.N`
  - Tag Git: `vYYYY.M.PATCH-beta.N`
- Nie dopełniaj miesiąca ani poprawki zerami
- Począwszy od aktualizacji procesu wydań z czerwca 2026 r., trzeci składnik jest
  sekwencyjnym miesięcznym numerem pociągu wydań, a nie dniem kalendarzowym.
  Wydania stable i beta wyznaczają bieżący pociąg; tagi wyłącznie alpha nie
  zużywają ani nie przesuwają numeru poprawki beta/stable. Tagi i wersje npm
  sprzed aktualizacji zachowują istniejące nazwy i pozostają prawidłowe;
  automatyzacja wydań nadal porównuje je według roku, miesiąca, poprawki, kanału
  oraz numeru wersji wstępnej lub poprawki.
- Kompilacje alpha/nightly używają następnego niewydanego pociągu poprawek i
  zwiększają tylko `alpha.N` dla kolejnych kompilacji. Gdy dana poprawka ma już
  wersję beta, nowe kompilacje alpha przechodzą do następnej poprawki. Ignoruj
  starsze tagi wyłącznie alpha z wyższymi numerami poprawek przy wyborze pociągu
  beta lub stable.
- Wersje npm są niezmienne. Jeśli tag beta został już opublikowany, nie usuwaj,
  nie publikuj ponownie ani nie używaj go ponownie; utwórz następny numer beta
  albo następną miesięczną poprawkę. Ponieważ `2026.6.5-beta.1` zostało już
  opublikowane podczas przejścia, pociągi wydań z czerwca 2026 r. muszą używać
  poprawki `5` lub wyższej. Nie publikuj nowych pociągów stable ani beta z
  czerwca 2026 r. jako `2026.6.2`, `2026.6.3` ani `2026.6.4`.
- Po regularnej wersji finalnej `2026.6.5` następnym nowym pociągiem beta jest
  `2026.6.6-beta.1`, nawet
  jeśli istnieją już automatyczne tagi wyłącznie alpha z wyższymi numerami poprawek.
- `latest` nadal podąża za bieżącą regularną/dzienną linią npm
- `beta` oznacza bieżący cel instalacji beta
- `extended-stable` oznacza wspierany pakiet npm z poprzedniego miesiąca,
  zaczynając od poprawki `33`; poprawka `34` i kolejne są wydaniami
  utrzymaniowymi w tej miesięcznej linii
- Dedykowana miesięczna ścieżka extended-stable publikuje tylko pakiet rdzenia
  npm. Nie publikuje Pluginów, artefaktów macOS ani Windows, GitHub Release,
  tagów dystrybucyjnych prywatnego repozytorium, obrazów Docker, artefaktów
  mobilnych ani pobrań ze strony internetowej.

## Rytm wydań

- Wydania przechodzą najpierw przez beta
- Stable następuje dopiero po zweryfikowaniu najnowszej wersji beta
- Opiekunowie zwykle tworzą wydania z gałęzi `release/YYYY.M.PATCH` utworzonej
  z bieżącego `main`, aby walidacja wydań i poprawki nie blokowały nowego
  rozwoju na `main`
- Jeśli tag beta został wypchnięty lub opublikowany i wymaga poprawki,
  opiekunowie tworzą następny tag `-beta.N` zamiast usuwać lub odtwarzać stary
  tag beta
- Szczegółowa procedura wydań, zatwierdzenia, poświadczenia i notatki dotyczące
  odzyskiwania są dostępne tylko dla opiekunów

## Miesięczna publikacja extended-stable tylko do npm

To dedykowany wyjątek od regularnej procedury wydania poniżej. Dla zakończonego
miesiąca `YYYY.M` utwórz `extended-stable/YYYY.M.33`; publikuj `vYYYY.M.33` i
późniejsze poprawki utrzymaniowe z tej samej gałęzi. Tag wydania, czubek gałęzi,
checkout, wersja pakietu, wstępna kontrola npm i uruchomienie pełnej walidacji
wydania muszą wskazywać ten sam commit. Chroniony `main` musi już zawierać
wersję finalną ściśle późniejszego miesiąca kalendarzowego poniżej poprawki `33`;
poprawki utrzymaniowe pozostają kwalifikowalne po tym, jak `main` przesunie się
o więcej niż jeden miesiąc.

Uruchom wstępną kontrolę npm i pełną walidację wydania z dokładnej gałęzi
extended-stable, a następnie zapisz oba identyfikatory uruchomień:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=true \
  -f npm_dist_tag=extended-stable

gh workflow run full-release-validation.yml \
  --ref extended-stable/YYYY.M.33 \
  -f ref=extended-stable/YYYY.M.33 \
  -f release_profile=stable
```

`release_profile=stable` to istniejący profil głębokości walidacji; jest
oddzielny od tagu dystrybucyjnego npm `extended-stable` i celowo pozostaje
niezmieniony.

Po powodzeniu obu uruchomień i przygotowaniu środowiska wydania npm wypromuj
dokładny tarball ze wstępnej kontroli. Poprawka `P` musi wynosić `33` lub więcej:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id>
```

Dla forka albo nieprodukcyjnej próby, która celowo nie może spełnić miesięcznej
polityki `.33` lub miesiąca chronionego `main`, dodaj
`-f bypass_extended_stable_guard=true` do dyspozycji wstępnej kontroli npm i
publikacji. Wartość domyślna to `false`. Obejście jest akceptowane tylko z
`npm_dist_tag=extended-stable` i jest zapisywane w podsumowaniu workflow. Nie
omija kanonicznego odwołania workflow `extended-stable/YYYY.M.33`, równości
czubka gałęzi/tagu/checkoutu, składni tagu finalnego, równości wersji pakietu i
tagu, tożsamości wskazanego uruchomienia i manifestu, pochodzenia tarballa,
zatwierdzenia środowiska, odczytu zwrotnego z rejestru ani dowodów naprawy
selektora.

Workflow publikacji weryfikuje tożsamości wskazanych uruchomień, skrót
przygotowanego tarballa i oba selektory rejestru npm. Niezależnie potwierdź
wynik po powodzeniu workflow:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Oba polecenia muszą zwrócić `YYYY.M.P`. Jeśli publikacja się powiedzie, ale
odczyt zwrotny selektora się nie powiedzie, nie publikuj ponownie niezmiennej
wersji pakietu. Użyj pojedynczego polecenia naprawy
`npm dist-tag add openclaw@YYYY.M.P extended-stable` wypisanego w zawsze
uruchamianym podsumowaniu nieudanego workflow, a następnie powtórz oba
niezależne odczyty zwrotne. Wycofanie do poprzedniego selektora jest osobną
decyzją operatora, a nie ścieżką naprawy odczytu zwrotnego.

Regularna lista kontrolna poniżej nadal odpowiada za beta, `latest`, GitHub
Release, Pluginy, macOS, Windows i publikacje na innych platformach. Nie
uruchamiaj tych kroków dla tej ścieżki extended-stable tylko do npm.

## Regularna lista kontrolna operatora wydania

Ta lista kontrolna jest publicznym kształtem przepływu wydania. Prywatne
poświadczenia, podpisywanie, notaryzacja, odzyskiwanie tagów dystrybucyjnych i
szczegóły awaryjnego wycofania pozostają w podręczniku wydań dostępnym tylko
dla opiekunów.

1. Zacznij od bieżącego `main`: pobierz najnowsze zmiany, potwierdź, że commit docelowy został wypchnięty,
   i potwierdź, że bieżące CI `main` jest wystarczająco zielone, aby utworzyć z niego gałąź.
2. Wygeneruj górną sekcję `CHANGELOG.md` ze scalonych PR-ów i wszystkich bezpośrednich
   commitów od ostatniego osiągalnego tagu wydania. Utrzymuj wpisy jako widoczne dla użytkownika,
   deduplikuj nakładające się wpisy PR/bezpośredni commit, zatwierdź przepisanie, wypchnij je
   i wykonaj jeszcze raz rebase/pull przed utworzeniem gałęzi.
3. Przejrzyj rekordy zgodności wydania w
   `src/plugins/compat/registry.ts` i
   `src/commands/doctor/shared/deprecation-compat.ts`. Usuwaj wygasłą
   zgodność tylko wtedy, gdy ścieżka aktualizacji pozostaje pokryta, albo zapisz, dlaczego jest
   celowo utrzymywana.
4. Utwórz `release/YYYY.M.PATCH` z bieżącego `main`; nie wykonuj zwykłych prac nad wydaniem
   bezpośrednio na `main`.
5. Podbij każdą wymaganą lokalizację wersji dla zamierzonego tagu, a następnie uruchom
   `pnpm release:prep`. Odświeża to wersje pluginów, inwentarz pluginów, schemat
   konfiguracji, metadane konfiguracji dołączonych kanałów, bazę dokumentacji konfiguracji, eksporty SDK
   pluginów oraz bazę API SDK pluginów we właściwej kolejności. Zatwierdź wszelkie wygenerowane
   odchylenia przed tagowaniem. Następnie uruchom lokalny deterministyczny preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` oraz `pnpm release:check`.
6. Uruchom `OpenClaw NPM Release` z `preflight_only=true`. Zanim tag istnieje,
   pełny 40-znakowy SHA gałęzi wydania jest dozwolony do preflight wyłącznie walidacyjnego.
   Preflight generuje dowody wydania zależności dla
   dokładnego wycheckoutowanego grafu zależności i zapisuje je w artefakcie npm preflight.
   Zapisz udany `preflight_run_id`.
7. Uruchom wszystkie testy przedwydaniowe przez `Full Release Validation` dla
   gałęzi wydania, tagu lub pełnego SHA commitu. To jest jedyny ręczny punkt wejścia
   dla czterech dużych pól testowych wydania: Vitest, Docker, QA Lab i Package.
8. Jeśli walidacja się nie powiedzie, napraw na gałęzi wydania i uruchom ponownie najmniejszy nieudany
   plik, ścieżkę, zadanie workflow, profil pakietu, dostawcę lub allowlist modelu, który
   dowodzi poprawki. Uruchom ponownie pełny parasol tylko wtedy, gdy zmieniona powierzchnia sprawia,
   że wcześniejsze dowody są nieaktualne.
9. Dla otagowanego kandydata beta uruchom
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` z pasującej
   gałęzi `release/YYYY.M.PATCH`. Dla stabilnego wydania przekaż także wymagane źródłowe
   wydanie Windows:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   Helper uruchamia lokalne kontrole wygenerowanego wydania, wysyła lub weryfikuje
   pełną walidację wydania i dowody npm preflight, uruchamia dowód Parallels
   świeżej instalacji/aktualizacji wobec dokładnie przygotowanego tarballa oraz dowód pakietu Telegram,
   zapisuje plany pluginów npm i ClawHub oraz wypisuje dokładne polecenie
   `OpenClaw Release Publish` dopiero po zazielenieniu pakietu dowodów.
   `OpenClaw Release Publish` wysyła wybrane albo wszystkie możliwe do opublikowania pakiety pluginów
   do npm i ten sam zestaw równolegle do ClawHub, a następnie promuje
   przygotowany artefakt OpenClaw npm preflight z pasującym dist-tag, gdy tylko
   publikacja pluginów npm się powiedzie.
   Po powodzeniu potomnego publikowania OpenClaw npm tworzy lub aktualizuje
   pasującą stronę wydania/przedwydania GitHub z kompletnej pasującej
   sekcji `CHANGELOG.md`. Stabilne wydania opublikowane do npm `latest` stają się
   najnowszym wydaniem GitHub; stabilne wydania utrzymaniowe pozostawione na npm `beta` są
   tworzone z GitHub `latest=false`. Workflow przesyła także dowody zależności
   preflight, manifest pełnej walidacji oraz dowody weryfikacji rejestru
   po publikacji do wydania GitHub na potrzeby obsługi incydentów po wydaniu.
   Workflow publikacji natychmiast wypisuje identyfikatory przebiegów potomnych, automatycznie zatwierdza
   bramki środowiska wydania, które token workflow może zatwierdzić, podsumowuje
   nieudane zadania potomne z końcówkami logów, zamyka stronę wydania GitHub i dowody
   zależności, gdy tylko publikacja OpenClaw npm się powiedzie, czeka na ClawHub, gdy
   OpenClaw npm jest publikowany, następnie uruchamia `pnpm release:verify-beta` i
   przesyła dowody po publikacji dla wydania GitHub, pakietu npm, wybranych
   pakietów pluginów npm, wybranych pakietów ClawHub, identyfikatorów przebiegów workflow potomnych oraz
   opcjonalnego identyfikatora przebiegu NPM Telegram. Ścieżka ClawHub ponawia przejściowe
   awarie instalacji zależności CLI, publikuje pluginy z udanym podglądem nawet wtedy, gdy jedna
   komórka podglądu zawodzi przejściowo, i kończy weryfikacją rejestru dla każdej oczekiwanej
   wersji pluginu, aby częściowe publikacje pozostały widoczne i możliwe do ponowienia. Następnie uruchom akceptację pakietu
   po publikacji wobec opublikowanego pakietu
   `openclaw@YYYY.M.PATCH-beta.N` albo
   `openclaw@beta`. Jeśli wypchnięte lub opublikowane przedwydanie wymaga poprawki,
   utwórz następny pasujący numer przedwydania; nie usuwaj ani nie przepisuj starego
   przedwydania.
10. Dla stabilnego wydania kontynuuj dopiero po tym, jak zweryfikowana beta lub kandydat wydania ma
    wymagane dowody walidacji. Stabilna publikacja npm także przechodzi przez
    `OpenClaw Release Publish`, używając ponownie udanego artefaktu preflight przez
    `preflight_run_id`; gotowość stabilnego wydania macOS wymaga także
    spakowanych `.zip`, `.dmg`, `.dSYM.zip` oraz zaktualizowanego `appcast.xml` na `main`.
    Workflow publikacji macOS automatycznie publikuje podpisany appcast do publicznego `main`
    po weryfikacji zasobów wydania; jeśli ochrona gałęzi blokuje
    bezpośredni push, otwiera lub aktualizuje PR appcast. Gotowość stabilnego Windows Hub
    wymaga podpisanych zasobów `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe` i
    `OpenClawCompanion-SHA256SUMS.txt` w wydaniu OpenClaw GitHub.
    Przekaż dokładny podpisany tag wydania `openclaw/openclaw-windows-node` jako
    `windows_node_tag` oraz zatwierdzoną przez kandydata mapę skrótów instalatorów jako
    `windows_node_installer_digests`; `OpenClaw Release Publish` utrzymuje
    szkic wydania, wysyła `Windows Node Release` i weryfikuje wszystkie trzy
    zasoby przed publikacją.
11. Po publikacji uruchom weryfikator npm po publikacji, opcjonalny samodzielny
    E2E opublikowanego npm Telegram, gdy potrzebujesz dowodu kanału po publikacji,
    promocję dist-tag, gdy jest potrzebna, zweryfikuj wygenerowaną stronę wydania GitHub,
    uruchom kroki ogłoszenia wydania, a następnie wykonaj [Zamknięcie stabilnego `main`](#stable-main-closeout), zanim uznasz stabilne wydanie za zakończone.

## Zamknięcie stabilnego `main`

Stabilna publikacja nie jest ukończona, dopóki `main` nie zawiera faktycznie wysłanego
stanu wydania.

1. Zacznij od świeżego najnowszego `main`. Przeprowadź audyt `release/YYYY.M.PATCH` względem niego i
   przenieś naprzód rzeczywiste poprawki, których brakuje na `main`. Nie scalaj ślepo
   adapterów zgodności, testów ani walidacji przeznaczonych tylko dla wydania do nowszego `main`.
2. Ustaw `main` na wysłaną stabilną wersję, a nie spekulacyjny następny pociąg wydań. Uruchom
   `pnpm release:prep` po zmianie wersji głównej, następnie
   `pnpm deps:shrinkwrap:generate`.
3. Spraw, aby sekcja `## YYYY.M.PATCH` w `CHANGELOG.md` na `main` dokładnie odpowiadała
   otagowanej gałęzi wydania. Uwzględnij stabilną aktualizację `appcast.xml`, gdy wydanie mac
   ją opublikowało.
4. Nie dodawaj `YYYY.M.PATCH+1`, wersji beta ani pustej przyszłej sekcji changeloga
   do `main`, dopóki operator wyraźnie nie rozpocznie tego pociągu wydań.
5. Uruchom `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` oraz
   `OPENCLAW_TESTBOX=1 pnpm check:changed`. Wypchnij, następnie zweryfikuj, że `origin/main`
   zawiera wysłaną wersję i changelog, zanim uznasz stabilne wydanie
   za wykonane.
6. Utrzymuj zmienne repozytorium `RELEASE_ROLLBACK_DRILL_ID` i
   `RELEASE_ROLLBACK_DRILL_DATE` jako aktualne po każdym prywatnym ćwiczeniu rollback.
   `OpenClaw Stable Main Closeout` zaczyna od pusha `main`, który zawiera
   wysłaną wersję, changelog i appcast po stabilnej publikacji. Odczytuje
   niezmienne dowody po publikacji, aby powiązać wysłany tag z jego przebiegami Full Release
   Validation i Publish, następnie weryfikuje stan stabilnego main, wydanie,
   obowiązkowy stabilny soak oraz blokujące dowody wydajnościowe. Dołącza
   niezmienny manifest zamknięcia i sumę kontrolną do wydania GitHub. Automatyczny
   wyzwalacz push pomija stare wydania sprzed niezmiennych dowodów po publikacji;
   nigdy nie traktuje tego pominięcia jako ukończonego zamknięcia. Kompletne
   zamknięcie wymaga zarówno zasobów, jak i pasującej sumy kontrolnej. Częściowy manifest
   odtwarza zapisany SHA `main` i ćwiczenie rollback, aby zregenerować identyczne
   bajty, następnie dołącza brakującą sumę kontrolną; nieprawidłowa para albo suma kontrolna
   bez manifestu pozostaje blokująca. Przebieg wyzwolony pushem bez zmiennych repozytorium
   ćwiczenia rollback pomija bez ukończenia zamknięcia; brakujący lub
   starszy niż 90 dni rekord ćwiczenia nadal blokuje ręczne zamknięcie
   oparte na dowodach. Prywatne polecenia odzyskiwania pozostają w runbooku tylko dla maintainerów.
   Używaj ręcznego wysyłania tylko do naprawy lub odtworzenia opartego na dowodach stabilnego zamknięcia.
   Stary tag korekty awaryjnej może ponownie użyć dowodów pakietu bazowego tylko wtedy, gdy
   tag korekty wskazuje ten sam commit źródłowy co bazowy stabilny tag.
   Korekta z innym źródłem musi opublikować i zweryfikować własne dowody
   pakietu.

## Preflight wydania

- Uruchom `pnpm check:test-types` przed wstępną kontrolą wydania, aby testowy TypeScript
  pozostawał objęty sprawdzaniem poza szybszą lokalną bramką `pnpm check`
- Uruchom `pnpm check:architecture` przed wstępną kontrolą wydania, aby szersze kontrole
  cykli importów i granic architektury były zielone poza szybszą lokalną bramką
- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane
  artefakty wydania `dist/*` i pakiet Control UI istniały na potrzeby kroku
  walidacji pakowania
- Uruchom `pnpm release:prep` po podbiciu wersji w katalogu głównym i przed tagowaniem. Uruchamia
  każdy deterministyczny generator wydania, który często rozjeżdża się po zmianie
  wersji/konfiguracji/API: wersje pluginów, inwentarz pluginów, bazowy schemat
  konfiguracji, metadane konfiguracji dołączonych kanałów, bazę dokumentacji
  konfiguracji, eksporty SDK pluginów oraz bazę API SDK pluginów. `pnpm release:check` ponownie uruchamia te
  strażniki w trybie sprawdzania i zgłasza każdą wykrytą niezgodność wygenerowanych plików w jednym
  przebiegu przed uruchomieniem kontroli wydania pakietów.
- Synchronizacja wersji pluginów domyślnie aktualizuje wersje oficjalnych pakietów pluginów oraz istniejące
  dolne granice `openclaw.compat.pluginApi` do wersji wydania OpenClaw.
  Traktuj to pole jako dolną granicę API SDK/runtime pluginów, a nie tylko kopię
  wersji pakietu: w przypadku wydań wyłącznie pluginów, które celowo pozostają
  zgodne ze starszymi hostami OpenClaw, pozostaw dolną granicę na najstarszym obsługiwanym
  API hosta i udokumentuj ten wybór w dowodzie wydania pluginu.
- Uruchom ręczny workflow `Full Release Validation` przed zatwierdzeniem wydania, aby
  uruchomić wszystkie przedwydaniowe środowiska testowe z jednego punktu wejścia. Przyjmuje branch,
  tag lub pełny SHA commita, wyzwala ręczny `CI` i wyzwala
  `OpenClaw Release Checks` dla dymnego testu instalacji, akceptacji pakietu, międzyplatformowych
  kontroli pakietu, parytetu QA Lab, Matrix i ścieżek Telegram. Stabilne i pełne
  przebiegi zawsze obejmują wyczerpujące live/E2E oraz długotrwały test ścieżki wydania Docker;
  `run_release_soak=true` zachowano dla jawnego długotrwałego testu beta. Package
  Acceptance zapewnia kanoniczne pakietowe Telegram E2E podczas walidacji kandydata,
  unikając drugiego równoległego pollera live.
  Podaj `release_package_spec` po opublikowaniu wersji beta, aby ponownie użyć wysłanego
  pakietu npm w kontrolach wydania, Package Acceptance i pakietowym Telegram
  E2E bez ponownego budowania tarballa wydania. Podaj
  `npm_telegram_package_spec` tylko wtedy, gdy Telegram ma używać innego
  opublikowanego pakietu niż reszta walidacji wydania. Podaj
  `package_acceptance_package_spec`, gdy Package Acceptance ma używać
  innego opublikowanego pakietu niż specyfikacja pakietu wydania. Podaj
  `evidence_package_spec`, gdy raport dowodowy wydania ma wykazać, że
  walidacja odpowiada opublikowanemu pakietowi npm bez wymuszania Telegram E2E.
  Przykład:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- Uruchom ręczny workflow `Package Acceptance`, gdy potrzebujesz dodatkowego dowodu
  dla kandydata pakietu, podczas gdy prace nad wydaniem trwają. Użyj `source=npm` dla
  `openclaw@beta`, `openclaw@latest` lub dokładnej wersji wydania; `source=ref`,
  aby spakować zaufany branch/tag/SHA `package_ref` z aktualną uprzężą
  `workflow_ref`; `source=url` dla publicznego tarballa HTTPS z wymaganym SHA-256
  i ścisłą polityką publicznego URL; `source=trusted-url` dla
  nazwanej polityki zaufanego źródła z wymaganym `trusted_source_id` i SHA-256; albo
  `source=artifact` dla tarballa przesłanego przez inny przebieg GitHub Actions. Workflow
  rozwiązuje kandydata do
  `package-under-test`, ponownie używa harmonogramu wydania Docker E2E wobec tego
  tarballa i może uruchomić QA Telegram wobec tego samego tarballa z
  `telegram_mode=mock-openai` lub `telegram_mode=live-frontier`. Gdy
  wybrane ścieżki Docker obejmują `published-upgrade-survivor`, artefakt
  pakietu jest kandydatem, a `published_upgrade_survivor_baseline` wybiera
  opublikowaną bazę. `update-restart-auth` używa pakietu kandydata jako
  zainstalowanego CLI oraz package-under-test, dzięki czemu ćwiczy zarządzaną
  ścieżkę restartu polecenia aktualizacji kandydata.
  Przykład: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Typowe profile:
  - `smoke`: ścieżki instalacji/kanału/agenta, sieci Gateway i przeładowania konfiguracji
  - `package`: natywne dla artefaktu ścieżki pakietu/aktualizacji/restartu/pluginu bez OpenWebUI ani live ClawHub
  - `product`: profil pakietu plus kanały MCP, czyszczenie cron/subagenta,
    wyszukiwanie web OpenAI i OpenWebUI
  - `full`: fragmenty ścieżki wydania Docker z OpenWebUI
  - `custom`: dokładny wybór `docker_lanes` dla ukierunkowanego ponownego przebiegu
- Uruchom ręczny workflow `CI` bezpośrednio, gdy potrzebujesz tylko deterministycznego, normalnego
  pokrycia CI dla kandydata wydania. Ręczne wyzwolenia CI omijają zakresowanie zmian
  i wymuszają shardy Linux Node, shardy dołączonych pluginów, shardy kontraktów pluginów i
  kanałów, zgodność z Node 22, `check-*`, `check-additional-*`,
  dymne kontrole zbudowanych artefaktów, kontrole dokumentacji, Python skills, Windows, macOS oraz
  ścieżki i18n Control UI. Samodzielne ręczne przebiegi CI uruchamiają Android tylko po wyzwoleniu
  z `include_android=true`; `Full Release Validation` przekazuje to wejście do
  swojego potomnego CI.
  Przykład z Android: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- Uruchom `pnpm qa:otel:smoke` podczas walidacji telemetrii wydania. Ćwiczy
  QA-lab przez lokalny odbiornik OTLP/HTTP i weryfikuje eksport śladów, metryk i logów
  oraz ograniczone atrybuty śladów i redakcję treści/identyfikatorów bez
  wymagania Opik, Langfuse ani innego zewnętrznego kolektora.
- Uruchom `pnpm qa:otel:collector-smoke` podczas walidacji zgodności kolektora.
  Kieruje ten sam eksport OTLP z QA-lab przez prawdziwy kontener Docker OpenTelemetry Collector
  przed asercjami lokalnego odbiornika.
- Uruchom `pnpm qa:prometheus:smoke` podczas walidacji chronionego scrapowania Prometheus.
  Ćwiczy QA-lab, odrzuca nieuwierzytelnione scrapowania i weryfikuje, że
  krytyczne dla wydania rodziny metryk pozostają wolne od treści promptów, surowych identyfikatorów,
  tokenów auth i lokalnych ścieżek.
- Uruchom `pnpm qa:observability:smoke`, gdy chcesz uruchomić ścieżki dymne
  OpenTelemetry i Prometheus z checkoutu źródłowego jedna po drugiej.
- Uruchom `pnpm release:check` przed każdym tagowanym wydaniem
- Wstępna kontrola `OpenClaw NPM Release` generuje dowody wydania zależności przed
  spakowaniem tarballa npm. Bramka podatności z advisory npm
  blokuje wydanie. Manifest ryzyk zależności przechodnich, powierzchnia własności/instalacji
  zależności oraz raporty zmian zależności są wyłącznie dowodami wydania. Raport
  zmian zależności porównuje kandydata wydania z poprzednim osiągalnym tagiem wydania.
- Wstępna kontrola przesyła dowody zależności jako
  `openclaw-release-dependency-evidence-<tag>` i osadza je także pod
  `dependency-evidence/` wewnątrz przygotowanego artefaktu wstępnej kontroli npm. Rzeczywista
  ścieżka publikacji ponownie używa tego artefaktu wstępnej kontroli, a następnie dołącza te same dowody
  do wydania GitHub jako `openclaw-<version>-dependency-evidence.zip`.
- Uruchom `OpenClaw Release Publish` dla mutującej sekwencji publikacji po tym, jak
  tag już istnieje. Wyzwól go z `release/YYYY.M.PATCH` (lub `main` podczas publikowania
  taga osiągalnego z main), przekaż tag wydania, udany `preflight_run_id`
  npm OpenClaw oraz udany `full_release_validation_run_id`, i pozostaw
  domyślny zakres publikacji pluginów `all-publishable`, chyba że celowo
  uruchamiasz ukierunkowaną naprawę. Workflow serializuje publikację pluginów npm, publikację pluginów
  ClawHub i publikację npm OpenClaw, aby pakiet rdzenia nie został opublikowany
  przed swoimi zewnętrznymi pluginami.
- Stabilny `OpenClaw Release Publish` wymaga dokładnego `windows_node_tag` po tym,
  jak istnieje odpowiadające mu nieprzedwydaniowe wydanie `openclaw/openclaw-windows-node`.
  Wymaga także zatwierdzonej dla kandydata mapy `windows_node_installer_digests`.
  Przed wyzwoleniem dowolnego potomnego procesu publikacji weryfikuje, że wydanie źródłowe jest
  opublikowane, nie jest przedwydaniowe, zawiera wymagane instalatory x64/ARM64 i
  nadal odpowiada tej zatwierdzonej mapie. Następnie wyzwala `Windows Node Release`,
  gdy wydanie OpenClaw nadal jest szkicem, przenosząc niezmienioną przypiętą mapę digestów instalatorów. Potomny
  workflow pobiera podpisane instalatory Windows Hub z tego dokładnego taga,
  dopasowuje je do przypiętych digestów, weryfikuje na runnerze Windows, że ich podpisy
  Authenticode używają oczekiwanego podpisującego OpenClaw Foundation,
  zapisuje manifest SHA-256 i przesyła instalatory oraz manifest do
  kanonicznego wydania OpenClaw na GitHub, a następnie ponownie pobiera wypromowane zasoby i
  weryfikuje przynależność do manifestu oraz hashe. Proces nadrzędny weryfikuje aktualny
  kontrakt zasobów x64, ARM64 i sum kontrolnych przed publikacją. Bezpośrednie odzyskiwanie
  odrzuca nieoczekiwane nazwy zasobów `OpenClawCompanion-*` przed zastąpieniem
  oczekiwanych zasobów kontraktu przypiętymi bajtami źródłowymi. Ręcznie wyzwalaj
  `Windows Node Release` tylko w celu odzyskania i zawsze przekazuj dokładny tag, nigdy
  `latest`, plus jawną mapę JSON `expected_installer_digests` z
  zatwierdzonego wydania źródłowego. Linki pobierania na stronie internetowej powinny wskazywać dokładne URL-e zasobów
  wydania OpenClaw dla bieżącego stabilnego wydania albo
  `releases/latest/download/...` tylko po zweryfikowaniu, że przekierowanie latest GitHub
  wskazuje to samo wydanie; nie linkuj wyłącznie do strony wydania repo companion.
- Kontrole wydania działają teraz w osobnym ręcznym workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` uruchamia także ścieżkę parytetu mock QA Lab oraz szybki
  profil live Matrix i ścieżkę QA Telegram przed zatwierdzeniem wydania. Ścieżki live
  używają środowiska `qa-live-shared`; Telegram używa także dzierżaw poświadczeń
  Convex CI. Uruchom ręczny workflow `QA-Lab - All Lanes` z
  `matrix_profile=all` i `matrix_shards=true`, gdy chcesz równolegle pełny inwentarz
  transportu Matrix, mediów i E2EE.
- Międzyplatformowa walidacja runtime instalacji i aktualizacji jest częścią publicznych
  `OpenClaw Release Checks` i `Full Release Validation`, które wywołują
  workflow wielokrotnego użytku
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` bezpośrednio
- Ten podział jest celowy: utrzymuje rzeczywistą ścieżkę wydania npm krótką,
  deterministyczną i skupioną na artefaktach, podczas gdy wolniejsze kontrole live pozostają we własnej
  ścieżce, aby nie opóźniały ani nie blokowały publikacji
- Kontrole wydania zawierające sekrety powinny być wyzwalane przez `Full Release
Validation` albo z referencji workflow `main`/release, aby logika workflow i
  sekrety pozostawały kontrolowane
- `OpenClaw Release Checks` akceptuje branch, tag lub pełny SHA commita, o ile
  rozwiązany commit jest osiągalny z brancha OpenClaw albo taga wydania
- Wstępna kontrola tylko walidacyjna `OpenClaw NPM Release` akceptuje także aktualny
  pełny 40-znakowy SHA commita brancha workflow bez wymagania wypchniętego taga
- Ta ścieżka SHA służy wyłącznie walidacji i nie może zostać wypromowana do rzeczywistej publikacji
- W trybie SHA workflow syntetyzuje `v<package.json version>` tylko dla
  kontroli metadanych pakietu; rzeczywista publikacja nadal wymaga prawdziwego taga wydania
- Oba workflow utrzymują rzeczywistą ścieżkę publikacji i promocji na runnerach
  hostowanych przez GitHub, podczas gdy niemutująca ścieżka walidacji może używać większych
  runnerów Linux Blacksmith
- Ten workflow uruchamia
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  z użyciem sekretów workflow `OPENAI_API_KEY` i `ANTHROPIC_API_KEY`
- Wstępna kontrola wydania npm nie czeka już na osobną ścieżkę kontroli wydania
- Przed lokalnym tagowaniem kandydata wydania uruchom
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. Pomocnik
  uruchamia szybkie zabezpieczenia wydania, kontrole wydania pluginów npm/ClawHub, build,
  build UI i `release:openclaw:npm:check` w kolejności, która wychwytuje typowe
  błędy blokujące zatwierdzenie przed startem workflow publikacji GitHub.
- Uruchom `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (albo odpowiadający tag beta/korekty) przed zatwierdzeniem
- Po publikacji npm uruchom
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (lub odpowiadającą wersję beta/korekcyjną), aby zweryfikować ścieżkę
  instalacji opublikowanego rejestru w świeżym tymczasowym prefiksie
- Po publikacji beta uruchom `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`,
  aby zweryfikować onboarding zainstalowanego pakietu, konfigurację Telegram oraz rzeczywiste E2E Telegram
  względem opublikowanego pakietu npm przy użyciu współdzielonej puli dzierżawionych poświadczeń Telegram.
  Jednorazowe lokalne uruchomienia maintainerów mogą pominąć zmienne Convex i przekazać trzy
  poświadczenia env `OPENCLAW_QA_TELEGRAM_*` bezpośrednio.
- Aby uruchomić pełny smoke test beta po publikacji z maszyny maintainera, użyj `pnpm release:beta-smoke -- --beta betaN`. Pomocnik uruchamia walidację aktualizacji npm/fresh-target w Parallels, wyzwala `NPM Telegram Beta E2E`, odpytuje dokładny przebieg workflow, pobiera artefakt i wypisuje raport Telegram.
- Maintainerzy mogą uruchomić tę samą kontrolę po publikacji z GitHub Actions za pomocą
  ręcznego workflow `NPM Telegram Beta E2E`. Jest on celowo wyłącznie ręczny i
  nie uruchamia się przy każdym scaleniu.
- Automatyzacja wydań maintainerów używa teraz modelu preflight, a potem promowanie:
  - rzeczywista publikacja npm musi mieć udany npm `preflight_run_id`
  - rzeczywista publikacja npm musi zostać wyzwolona z tej samej gałęzi `main` albo
    `release/YYYY.M.PATCH`, co udany przebieg preflight
  - stabilne wydania npm domyślnie używają `beta`
  - stabilna publikacja npm może jawnie wskazać `latest` przez dane wejściowe workflow
  - oparta na tokenie mutacja dist-tag npm znajduje się teraz w
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, ponieważ
    `npm dist-tag add` nadal wymaga `NPM_TOKEN`, podczas gdy repozytorium źródłowe zachowuje
    publikację wyłącznie przez OIDC
  - publiczny `macOS Release` służy tylko do walidacji; gdy tag istnieje tylko na
    gałęzi wydania, ale workflow jest wyzwalany z `main`, ustaw
    `public_release_branch=release/YYYY.M.PATCH`
  - rzeczywista publikacja macOS musi mieć udane macOS `preflight_run_id` oraz
    `validate_run_id`
  - rzeczywiste ścieżki publikacji promują przygotowane artefakty zamiast ponownie
    je budować
- Dla stabilnych wydań korekcyjnych, takich jak `YYYY.M.PATCH-N`, weryfikator po publikacji
  sprawdza także tę samą ścieżkę aktualizacji w tymczasowym prefiksie z `YYYY.M.PATCH` do `YYYY.M.PATCH-N`,
  aby korekty wydań nie mogły po cichu zostawić starszych globalnych instalacji na
  bazowym stabilnym pakiecie
- Preflight wydania npm kończy się odmową, chyba że tarball zawiera zarówno
  `dist/control-ui/index.html`, jak i niepusty pakiet `dist/control-ui/assets/`,
  abyśmy ponownie nie wysłali pustego dashboardu przeglądarkowego
- Weryfikacja po publikacji sprawdza również, czy opublikowane punkty wejścia Plugin oraz
  metadane pakietu są obecne w układzie zainstalowanym z rejestru. Wydanie, które
  wysyła brakujące ładunki runtime Plugin, nie przechodzi weryfikatora po publikacji i
  nie może zostać promowane do `latest`.
- `pnpm test:install:smoke` wymusza także budżet npm pack `unpackedSize` na
  kandydackim tarballu aktualizacji, dzięki czemu installer e2e wychwytuje przypadkowe rozdęcie paczki
  przed ścieżką publikacji wydania
- Jeśli prace nad wydaniem dotknęły planowania CI, manifestów czasu wykonywania rozszerzeń lub
  macierzy testów rozszerzeń, przed zatwierdzeniem wygeneruj ponownie i przejrzyj należące do planera
  wyjścia macierzy `plugin-prerelease-extension-shard` z
  `.github/workflows/plugin-prerelease.yml`, aby informacje o wydaniu nie
  opisywały nieaktualnego układu CI
- Gotowość stabilnego wydania macOS obejmuje także powierzchnie aktualizatora:
  - wydanie GitHub musi ostatecznie zawierać spakowane `.zip`, `.dmg` oraz `.dSYM.zip`
  - `appcast.xml` na `main` musi po publikacji wskazywać nowy stabilny zip; workflow
    publikacji macOS zatwierdza go automatycznie albo otwiera PR appcast,
    gdy bezpośredni push jest zablokowany
  - spakowana aplikacja musi zachować niedebugowy identyfikator pakietu, niepusty URL feedu Sparkle
    oraz `CFBundleVersion` równy kanonicznemu minimalnemu progowi buildu Sparkle
    dla tej wersji wydania albo od niego wyższy

## Boksy testów wydania

`Full Release Validation` to sposób, w jaki operatorzy uruchamiają wszystkie testy przedwydaniowe z
jednego punktu wejścia. Aby uzyskać dowód dla przypiętego commita na szybko zmieniającej się gałęzi, użyj
pomocnika, aby każdy workflow podrzędny działał z tymczasowej gałęzi przypiętej do docelowego
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Pomocnik wypycha `release-ci/<sha>-...`, uruchamia `Full Release Validation`
z tej gałęzi z `ref=<sha>`, weryfikuje, że każdy `headSha` workflow podrzędnego
pasuje do celu, a następnie usuwa tymczasową gałąź. Zapobiega to przypadkowemu udowodnieniu
nowszego uruchomienia podrzędnego z `main`.

Do walidacji gałęzi wydania lub tagu uruchom go z zaufanego refa workflow `main`
i przekaż gałąź wydania lub tag jako `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

Workflow rozwiązuje docelowy ref, uruchamia ręcznie `CI` z
`target_ref=<release-ref>`, a następnie uruchamia `OpenClaw Release Checks`.
`OpenClaw Release Checks` rozdziela zadania na smoke test instalacji, międzyplatformowe testy wydania,
pokrycie ścieżki wydania Docker live/E2E, gdy włączono testy długotrwałe, Package Acceptance
z kanonicznym E2E pakietu Telegram, parytet QA Lab, live Matrix oraz live
Telegram. Pełne uruchomienie typu all jest akceptowalne tylko wtedy, gdy podsumowanie `Full Release Validation`
pokazuje `normal_ci`, `plugin_prerelease` i `release_checks` jako
zakończone powodzeniem, chyba że ukierunkowane ponowne uruchomienie celowo pominęło osobne dziecko `Plugin
Prerelease`. Używaj samodzielnego dziecka `npm-telegram` tylko do ukierunkowanego
ponownego uruchomienia opublikowanego pakietu z `release_package_spec` lub
`npm_telegram_package_spec`. Końcowe podsumowanie
weryfikatora zawiera tabele najwolniejszych zadań dla każdego uruchomienia podrzędnego, aby menedżer wydania
mógł zobaczyć bieżącą ścieżkę krytyczną bez pobierania logów.
Zobacz [Pełna walidacja wydania](/pl/reference/full-release-validation), aby poznać
pełną macierz etapów, dokładne nazwy zadań workflow, różnice między profilami stable i full,
artefakty oraz uchwyty ukierunkowanych ponownych uruchomień.
Workflow podrzędne są uruchamiane z zaufanego refa, który uruchamia `Full Release
Validation`, zwykle `--ref main`, nawet gdy docelowy `ref` wskazuje na
starszą gałąź wydania lub tag. Nie ma osobnego wejścia refa workflow Full Release Validation;
wybierz zaufany harness, wybierając ref uruchomienia workflow.
Nie używaj `--ref main -f ref=<sha>` do dokładnego dowodu commita na ruchomym `main`;
surowe SHA commitów nie mogą być refami uruchomienia workflow, więc użyj
`pnpm ci:full-release --sha <sha>`, aby utworzyć przypiętą tymczasową gałąź.

Użyj `release_profile`, aby wybrać zakres live/provider:

- `minimum`: najszybsza ścieżka live OpenAI/core i Docker krytyczna dla wydania
- `stable`: minimum plus stabilne pokrycie provider/backend do zatwierdzenia wydania
- `full`: stable plus szerokie doradcze pokrycie provider/media

Walidacje stable i full zawsze uruchamiają wyczerpujące live/E2E, ścieżkę wydania Docker
oraz ograniczony przegląd przetrwania aktualizacji opublikowanego pakietu przed promocją.
Użyj `run_release_soak=true`, aby zażądać tego samego przeglądu dla wersji beta. Ten przegląd obejmuje
najnowsze cztery stabilne pakiety oraz przypięte baseline'y `2026.4.23` i `2026.5.2`,
a także starsze pokrycie `2026.4.15`, z usuniętymi duplikatami baseline'ów i
każdym baseline'em podzielonym na własne zadanie runnera Docker.

`OpenClaw Release Checks` używa zaufanego refa workflow, aby jednorazowo rozwiązać docelowy
ref jako `release-package-under-test` i ponownie używa tego artefaktu w testach międzyplatformowych,
Package Acceptance oraz testach Docker ścieżki wydania, gdy działają testy długotrwałe. Dzięki temu
wszystkie boksy dotyczące pakietów działają na tych samych bajtach i unikają powtarzanych buildów pakietu.
Gdy beta jest już w npm, ustaw `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`,
aby testy wydania pobrały wysłany pakiet raz, wyodrębniły jego źródłowy SHA builda
z `dist/build-info.json` i ponownie użyły tego artefaktu w testach międzyplatformowych,
Package Acceptance, Docker ścieżki wydania oraz torach pakietowego Telegram.
Międzyplatformowy smoke test instalacji OpenAI używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy
ustawiona jest zmienna repo/org, w przeciwnym razie `openai/gpt-5.4`, ponieważ ten tor
udowadnia instalację pakietu, onboarding, start Gateway i jedną turę agenta live,
a nie benchmarkuje najwolniejszego modelu domyślnego. Szersza macierz live provider
pozostaje miejscem pokrycia specyficznego dla modeli.

Użyj tych wariantów w zależności od etapu wydania:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
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
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Nie używaj pełnej parasolowej walidacji jako pierwszego ponownego uruchomienia po ukierunkowanej poprawce. Jeśli jeden boks
zawiedzie, użyj nieudanego workflow podrzędnego, zadania, toru Docker, profilu pakietu, modelu
provider lub toru QA do następnego dowodu. Uruchom pełną parasolową walidację ponownie tylko wtedy, gdy
poprawka zmieniła współdzieloną orkiestrację wydania lub sprawiła, że wcześniejsze dowody ze wszystkich boksów
stały się nieaktualne. Końcowy weryfikator parasola ponownie sprawdza zapisane identyfikatory uruchomień workflow
podrzędnych, więc po pomyślnym ponownym uruchomieniu workflow podrzędnego uruchom ponownie tylko nieudane
zadanie nadrzędne `Verify full validation`.

Do ograniczonego odzyskiwania przekaż `rerun_group` do parasola. `all` to prawdziwe
uruchomienie release-candidate, `ci` uruchamia tylko zwykłe dziecko CI, `plugin-prerelease`
uruchamia tylko dziecko Plugin przeznaczone wyłącznie dla wydania, `release-checks` uruchamia każdy boks wydania,
a węższe grupy wydania to `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` i `npm-telegram`.
Ukierunkowane ponowne uruchomienia `npm-telegram` wymagają `release_package_spec` lub
`npm_telegram_package_spec`; pełne uruchomienia all używają kanonicznego pakietowego E2E Telegram
w Package Acceptance. Ukierunkowane
ponowne uruchomienia cross-OS mogą dodać `cross_os_suite_filter=windows/packaged-upgrade` lub
inny filtr OS/zestawu. Niepowodzenia release-check QA blokują normalną walidację wydania,
w tym wymagane dryfowanie dynamicznych narzędzi OpenClaw w standardowym tierze.
Uruchomienia alpha Tideclaw nadal mogą traktować tory release-check niezwiązane z bezpieczeństwem pakietu jako
doradcze. Gdy `live_suite_filter` jawnie żąda bramkowanego toru QA live, takiego
jak Discord, WhatsApp lub Slack, odpowiednia zmienna repo
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` musi być włączona; w przeciwnym razie
przechwytywanie wejścia kończy się niepowodzeniem zamiast cicho pominąć tor.

### Vitest

Boks Vitest to ręczny workflow podrzędny `CI`. Ręczne CI celowo
omija zakresowanie zmian i wymusza normalny graf testów dla kandydata wydania:
shardy Linux Node, shardy bundled-plugin, shardy kontraktów Plugin i kanałów,
zgodność Node 22, `check-*`, `check-additional-*`,
smoke testy artefaktów builda, testy dokumentacji, Python skills, Windows, macOS
oraz i18n Control UI. Android jest uwzględniony, gdy `Full Release Validation` uruchamia
boks, ponieważ parasol przekazuje `include_android=true`; samodzielne ręczne CI
wymaga `include_android=true` dla pokrycia Android.

Użyj tego pola, aby odpowiedzieć na pytanie „czy drzewo źródłowe przeszło pełny normalny zestaw testów?”.
To nie to samo co walidacja produktu na ścieżce wydania. Dowody do zachowania:

- podsumowanie `Full Release Validation` pokazujące URL uruchomionego przebiegu `CI`
- zielony przebieg `CI` na dokładnym docelowym SHA
- nazwy nieudanych lub wolnych shardów z zadań CI podczas badania regresji
- artefakty czasów Vitest, takie jak `.artifacts/vitest-shard-timings.json`, gdy
  przebieg wymaga analizy wydajności

Uruchamiaj ręczne CI bezpośrednio tylko wtedy, gdy wydanie wymaga deterministycznego normalnego CI, ale
nie pól Docker, QA Lab, live, cross-OS ani package. Użyj pierwszego polecenia
dla bezpośredniego CI bez Androida. Dodaj `include_android=true`, gdy bezpośrednie
CI kandydata do wydania musi obejmować Androida:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Pole Docker znajduje się w `OpenClaw Release Checks` przez
`openclaw-live-and-e2e-checks-reusable.yml`, a także w trybie wydania
workflow `install-smoke`. Waliduje kandydata do wydania przez spakowane
środowiska Docker zamiast wyłącznie testów na poziomie źródeł.

Zakres Docker dla wydania obejmuje:

- pełny smoke test instalacji z włączonym wolnym globalnym smoke testem instalacji Bun
- przygotowanie/ponowne użycie obrazu smoke głównego Dockerfile według docelowego SHA, z zadaniami smoke QR,
  root/gateway oraz installer/Bun uruchamianymi jako osobne shardy install-smoke
- ścieżki E2E repozytorium
- fragmenty Docker ścieżki wydania: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` oraz `plugins-runtime-install-h`
- pokrycie OpenWebUI wewnątrz fragmentu `plugins-runtime-services`, gdy jest wymagane
- podzielone ścieżki instalacji/deinstalacji dołączonych pluginów
  od `bundled-plugin-install-uninstall-0` do
  `bundled-plugin-install-uninstall-23`
- zestawy live/E2E providerów oraz pokrycie modeli live w Docker, gdy kontrole wydania
  obejmują zestawy live

Użyj artefaktów Docker przed ponownym uruchomieniem. Harmonogram ścieżki wydania przesyła
`.artifacts/docker-tests/` z logami ścieżek, `summary.json`, `failures.json`,
czasami faz, JSON planu harmonogramu i poleceniami ponownego uruchomienia. Do ukierunkowanego odzyskiwania
użyj `docker_lanes=<lane[,lane]>` w wielokrotnego użytku workflow live/E2E zamiast
ponownie uruchamiać wszystkie fragmenty wydania. Wygenerowane polecenia ponownego uruchomienia zawierają wcześniejsze
`package_artifact_run_id` i przygotowane dane wejściowe obrazów Docker, gdy są dostępne, aby
nieudana ścieżka mogła ponownie użyć tego samego tarballa i obrazów GHCR.

### QA Lab

Pole QA Lab jest również częścią `OpenClaw Release Checks`. To agentowa
bramka wydania dla zachowania i poziomu kanałów, oddzielna od Vitest oraz mechaniki
pakietów Docker.

Zakres QA Lab dla wydania obejmuje:

- ścieżkę parytetu mock porównującą ścieżkę kandydata OpenAI z bazą Opus 4.6
  przy użyciu pakietu parytetu agentowego
- szybki profil QA live Matrix używający środowiska `qa-live-shared`
- ścieżkę QA live Telegram używającą dzierżaw poświadczeń Convex CI
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`,
  `pnpm qa:prometheus:smoke` lub
  `pnpm qa:observability:smoke`, gdy telemetria wydania wymaga jawnego lokalnego
  dowodu

Użyj tego pola, aby odpowiedzieć na pytanie „czy wydanie zachowuje się poprawnie w scenariuszach QA i
przepływach kanałów live?”. Zachowaj URL-e artefaktów dla ścieżek parity, Matrix i Telegram
podczas zatwierdzania wydania. Pełne pokrycie Matrix pozostaje dostępne jako
ręczny shardowany przebieg QA-Lab, a nie domyślna ścieżka krytyczna dla wydania.

### Pakiet

Pole Package jest bramką instalowalnego produktu. Jest wspierane przez
`Package Acceptance` oraz resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver normalizuje
kandydata do tarballa `package-under-test` używanego przez Docker E2E, waliduje
inwentarz pakietu, zapisuje wersję pakietu i SHA-256 oraz utrzymuje ref harnessu
workflow oddzielnie od refa źródła pakietu.

Obsługiwane źródła kandydatów:

- `source=npm`: `openclaw@beta`, `openclaw@latest` albo dokładna wersja wydania OpenClaw
- `source=ref`: spakuj zaufaną gałąź `package_ref`, tag albo pełny SHA commita
  z wybranym szkieletem `workflow_ref`
- `source=url`: pobierz publiczny plik HTTPS `.tgz` z wymaganym `package_sha256`;
  poświadczenia w URL, niestandardowe porty HTTPS, prywatne/wewnętrzne/specjalnego przeznaczenia
  nazwy hostów albo rozwiązane adresy oraz niebezpieczne przekierowania są odrzucane
- `source=trusted-url`: pobierz plik HTTPS `.tgz` z wymaganymi
  `package_sha256` i `trusted_source_id` z nazwanej polityki w
  `.github/package-trusted-sources.json`; używaj tego dla należących do maintainerów
  mirrorów enterprise albo prywatnych repozytoriów pakietów zamiast dodawać
  obejście sieci prywatnej na poziomie wejścia do `source=url`
- `source=artifact`: użyj ponownie pliku `.tgz` przesłanego przez inne uruchomienie GitHub Actions

`OpenClaw Release Checks` uruchamia Package Acceptance z `source=artifact`, przygotowanym artefaktem pakietu wydania, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance utrzymuje migrację, aktualizację,
restart aktualizacji ze skonfigurowanym uwierzytelnianiem, instalację live Skills z ClawHub, czyszczenie przestarzałych zależności Pluginu, offline
fixtures Pluginu, aktualizację Pluginu oraz QA pakietu Telegram względem tego samego rozwiązanego
tarballa. Blokujące kontrole wydania używają domyślnej najnowszej opublikowanej linii bazowej pakietu;
profil beta z `run_release_soak=true`, `release_profile=stable` albo
`release_profile=full` rozszerza zakres do każdej stabilnej linii bazowej opublikowanej w npm od
`2026.4.23` do `latest` oraz fixtures zgłoszonych problemów. Użyj
Package Acceptance z `source=npm` dla już wydanego kandydata,
`source=ref` dla lokalnego tarballa npm opartego na SHA przed publikacją,
`source=trusted-url` dla należącego do maintainerów mirrora enterprise/prywatnego albo
`source=artifact` dla przygotowanego tarballa przesłanego przez inne uruchomienie GitHub Actions.
Jest to natywny dla GitHub
zamiennik większości pokrycia pakietu/aktualizacji, które wcześniej wymagało
Parallels. Międzyplatformowe kontrole wydania nadal są ważne dla onboardingu,
instalatora i zachowania platformowego specyficznego dla systemu operacyjnego, ale walidacja produktu pakietu/aktualizacji powinna
preferować Package Acceptance.

Kanoniczna lista kontrolna walidacji aktualizacji i Pluginów to
[Testowanie aktualizacji i Pluginów](/pl/help/testing-updates-plugins). Używaj jej przy
decydowaniu, która ścieżka lokalna, Docker, Package Acceptance albo kontrola wydania potwierdza
instalację/aktualizację Pluginu, czyszczenie przez doctor albo zmianę migracji opublikowanego pakietu.
Wyczerpująca migracja opublikowanych aktualizacji z każdego stabilnego pakietu `2026.4.23+` to
osobny ręczny workflow `Update Migration`, a nie część Full Release CI.

Łagodność starszego package-acceptance jest celowo ograniczona czasowo. Pakiety do
`2026.4.25` mogą używać ścieżki zgodności dla luk metadanych już opublikowanych
w npm: prywatnych wpisów inwentarza QA brakujących w tarballu, brakującego
`gateway install --wrapper`, brakujących plików patchy w fixture git
wyprowadzonym z tarballa, brakującego utrwalonego `update.channel`, starszych lokalizacji
rekordów instalacji Pluginu, brakującego utrwalania rekordów instalacji z marketplace oraz migracji metadanych
konfiguracji podczas `plugins update`. Opublikowany pakiet `2026.4.26` może ostrzegać
o lokalnych plikach stempli metadanych kompilacji, które już wydano. Późniejsze pakiety
muszą spełniać współczesne kontrakty pakietu; te same luki powodują niepowodzenie
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
- `package`: kontrakty instalacji/aktualizacji/restartu/pakietu Pluginu plus dowód instalacji live
  Skills z ClawHub; to domyślna wartość kontroli wydania
- `product`: `package` plus kanały MCP, czyszczenie cron/subagent, wyszukiwanie webowe OpenAI
  i OpenWebUI
- `full`: fragmenty ścieżki wydania Docker z OpenWebUI
- `custom`: dokładna lista `docker_lanes` dla ukierunkowanych ponownych uruchomień

Dla dowodu Telegram kandydata pakietu włącz `telegram_mode=mock-openai` albo
`telegram_mode=live-frontier` w Package Acceptance. Workflow przekazuje
rozwiązany tarball `package-under-test` do ścieżki Telegram; samodzielny
workflow Telegram nadal akceptuje opublikowaną specyfikację npm dla kontroli po publikacji.

## Regularna automatyzacja publikacji wydania

Dla beta, `latest`, Pluginu, GitHub Release i publikacji platformowej
`OpenClaw Release Publish` jest normalnym mutującym punktem wejścia. Miesięczna
ścieżka npm-only extended-stable `.33+` nie używa tego orkiestratora. Regularny workflow
orkiestruje workflowy trusted-publisher w kolejności wymaganej przez wydanie:

1. Pobierz tag wydania i rozwiąż jego SHA commita.
2. Sprawdź, czy tag jest osiągalny z `main` albo `release/*`.
3. Uruchom `pnpm plugins:sync:check`.
4. Wywołaj `Plugin NPM Release` z `publish_scope=all-publishable` i
   `ref=<release-sha>`.
5. Wywołaj `Plugin ClawHub Release` z tym samym zakresem i SHA.
6. Wywołaj `OpenClaw NPM Release` z tagiem wydania, dist-tag npm oraz
   zapisanym `preflight_run_id` po zweryfikowaniu zapisanego
   `full_release_validation_run_id`.
7. Dla wydań stabilnych utwórz albo zaktualizuj wydanie GitHub jako szkic, wywołaj
   `Windows Node Release` z jawnym `windows_node_tag` i
   zatwierdzonymi dla kandydata `windows_node_installer_digests`, a następnie zweryfikuj kanoniczne
   zasoby instalatora/sum kontrolnych przed opublikowaniem szkicu.

Przykład publikacji beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Stabilna publikacja do domyślnego beta dist-tag:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Stabilna promocja bezpośrednio do `latest` jest jawna:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=latest
```

Używaj workflowów niższego poziomu `Plugin NPM Release` i `Plugin ClawHub Release`
tylko do ukierunkowanych napraw albo ponownych publikacji. `OpenClaw Release Publish` odrzuca
`plugin_publish_scope=selected`, gdy `publish_openclaw_npm=true`, aby główny
pakiet nie mógł zostać wydany bez każdego publikowalnego oficjalnego Pluginu, w tym
`@openclaw/diffs-language-pack`. Dla naprawy wybranego Pluginu ustaw
`publish_openclaw_npm=false` z `plugin_publish_scope=selected` i
`plugins=@openclaw/name` albo wywołaj workflow podrzędny bezpośrednio.

## Wejścia workflow NPM

`OpenClaw NPM Release` akceptuje te wejścia kontrolowane przez operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1` albo
  `v2026.4.2-beta.1`; gdy `preflight_only=true`, może to być także bieżący
  pełny 40-znakowy SHA commita gałęzi workflow do preflightu wyłącznie walidacyjnego
- `preflight_only`: `true` tylko dla walidacji/kompilacji/pakietu, `false` dla
  rzeczywistej ścieżki publikacji
- `preflight_run_id`: wymagane na rzeczywistej ścieżce publikacji, aby workflow ponownie użył
  przygotowanego tarballa z udanego uruchomienia preflight
- `full_release_validation_run_id`: wymagane dla rzeczywistej miesięcznej publikacji extended-stable i regularnej
  publikacji niebędącej beta, aby workflow uwierzytelnił dokładne uruchomienie walidacji
- `npm_dist_tag`: docelowy tag npm dla ścieżki publikacji; akceptuje `alpha`, `beta`,
  `latest` albo `extended-stable` i domyślnie używa `beta`. Ostateczny patch `33` i późniejsze muszą
  używać `extended-stable`; domyślnie `extended-stable` odrzuca wcześniejsze patche i zawsze
  odrzuca tagi nieostateczne.
- `bypass_extended_stable_guard`: wartość logiczna tylko do testów, domyślnie `false`; przy
  `npm_dist_tag=extended-stable` omija miesięczną kwalifikowalność extended-stable, zachowując
  tożsamość wydania, artefakt, zatwierdzenie i kontrole odczytu zwrotnego.

`OpenClaw Release Publish` akceptuje te wejścia kontrolowane przez operatora:

- `tag`: wymagany tag wydania; musi już istnieć
- `preflight_run_id`: id udanego uruchomienia preflight `OpenClaw NPM Release`;
  wymagane, gdy `publish_openclaw_npm=true`
- `full_release_validation_run_id`: id udanego uruchomienia `Full Release Validation`;
  wymagane, gdy `publish_openclaw_npm=true`
- `windows_node_tag`: dokładny tag wydania `openclaw/openclaw-windows-node` bez prerelease;
  wymagany dla stabilnej publikacji OpenClaw
- `windows_node_installer_digests`: zatwierdzona dla kandydata zwarta mapa JSON
  bieżących nazw instalatorów Windows do ich przypiętych skrótów `sha256:`; wymagana
  dla stabilnej publikacji OpenClaw
- `npm_dist_tag`: docelowy tag npm dla pakietu OpenClaw
- `plugin_publish_scope`: domyślnie `all-publishable`; używaj `selected` tylko
  do ukierunkowanych napraw wyłącznie Pluginów z `publish_openclaw_npm=false`
- `plugins`: oddzielone przecinkami nazwy pakietów `@openclaw/*`, gdy
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: domyślnie `true`; ustaw `false` tylko podczas używania
  workflow jako orkiestratora napraw wyłącznie Pluginów
- `wait_for_clawhub`: domyślnie `false`, aby dostępność npm nie była blokowana przez
  sidecar ClawHub; ustaw `true` tylko wtedy, gdy ukończenie workflow musi obejmować
  ukończenie ClawHub

`OpenClaw Release Checks` akceptuje te wejścia kontrolowane przez operatora:

- `ref`: gałąź, tag albo pełny SHA commita do walidacji. Kontrole używające sekretów
  wymagają, aby rozwiązany commit był osiągalny z gałęzi OpenClaw albo
  tagu wydania.
- `run_release_soak`: włącza wyczerpujące live/E2E, ścieżkę wydania Docker oraz
  soak upgrade-survivor dla wszystkiego od początku dla kontroli wydania beta. Jest wymuszane przez
  `release_profile=stable` i `release_profile=full`.

Reguły:

- Regularne wersje ostateczne i korekcyjne poniżej patcha `33` mogą publikować do
  `beta` albo `latest`. Wersje ostateczne od patcha `33` wzwyż muszą publikować do
  `extended-stable`, a wersje z sufiksem korekcyjnym na tej granicy są odrzucane.
- Tagi prerelease beta mogą publikować tylko do `beta`
- Dla `OpenClaw NPM Release` wejście pełnego SHA commita jest dozwolone tylko, gdy
  `preflight_only=true`
- `OpenClaw Release Checks` i `Full Release Validation` zawsze są
  wyłącznie walidacyjne
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, którego użyto podczas preflightu;
  workflow weryfikuje te metadane przed kontynuacją publikacji

## Regularna sekwencja wydania beta/latest stable

Ta starsza sekwencja dotyczy regularnego orkiestracyjnego wydania, które obejmuje także
Pluginy, GitHub Release, Windows i inne prace platformowe. Nie jest to
miesięczna ścieżka npm-only extended-stable `.33+` udokumentowana na początku tej strony.

Podczas przygotowywania regularnego orkiestracyjnego stabilnego wydania:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`
   - Zanim tag będzie istnieć, możesz użyć bieżącego pełnego SHA commita gałęzi
     workflow do suchego przebiegu workflow preflight służącego tylko do walidacji
2. Wybierz `npm_dist_tag=beta` dla normalnego przepływu najpierw beta albo `latest` tylko
   wtedy, gdy celowo chcesz bezpośrednio opublikować wersję stabilną
3. Uruchom `Full Release Validation` na gałęzi wydania, tagu wydania albo pełnym
   SHA commita, gdy chcesz normalne CI oraz pokrycie live prompt cache, Docker, QA Lab,
   Matrix i Telegram z jednego ręcznego workflow
4. Jeśli celowo potrzebujesz tylko deterministycznego normalnego grafu testów, uruchom
   ręczny workflow `CI` na ref wydania zamiast tego
5. Wybierz dokładny tag wydania `openclaw/openclaw-windows-node` niebędący prerelease,
   którego podpisane instalatory x64 i ARM64 mają zostać dostarczone. Zapisz go jako
   `windows_node_tag` i zapisz ich zwalidowaną mapę skrótów jako
   `windows_node_installer_digests`. Pomocnik release-candidate zapisuje oba
   i uwzględnia je w wygenerowanym poleceniu publikacji.
6. Zapisz zakończone powodzeniem `preflight_run_id` i `full_release_validation_run_id`
7. Uruchom `OpenClaw Release Publish` z tym samym `tag`, tym samym `npm_dist_tag`,
   wybranym `windows_node_tag`, zapisanym `windows_node_installer_digests`,
   zapisanym `preflight_run_id` i zapisanym `full_release_validation_run_id`;
   publikuje on zewnętrzne pluginy do npm i ClawHub przed promowaniem pakietu
   npm OpenClaw
8. Jeśli wydanie trafiło na `beta`, użyj workflow
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`,
   aby wypromować tę stabilną wersję z `beta` do `latest`
9. Jeśli wydanie celowo opublikowano bezpośrednio do `latest`, a `beta`
   ma natychmiast wskazywać ten sam stabilny build, użyj tego samego workflow
   wydania, aby ustawić oba dist-tags na stabilną wersję, albo pozwól jego zaplanowanej
   samonaprawiającej synchronizacji przenieść `beta` później

Mutacja dist-tag znajduje się w repozytorium rejestru wydań, ponieważ nadal wymaga
`NPM_TOKEN`, podczas gdy repozytorium źródłowe zachowuje publikowanie wyłącznie przez OIDC.

Dzięki temu zarówno ścieżka bezpośredniej publikacji, jak i ścieżka promocji najpierw beta
są udokumentowane i widoczne dla operatora.

Jeśli maintainer musi awaryjnie użyć lokalnego uwierzytelniania npm, uruchamiaj wszelkie
polecenia CLI 1Password (`op`) tylko w dedykowanej sesji tmux. Nie wywołuj `op`
bezpośrednio z głównej powłoki agenta; utrzymywanie go w tmux sprawia, że prompty,
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

Maintainerzy używają prywatnej dokumentacji wydań w
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
jako właściwego runbooka.

## Powiązane

- [Kanały wydań](/pl/install/development-channels)
