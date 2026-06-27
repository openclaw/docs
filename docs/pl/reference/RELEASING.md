---
read_when:
    - Szukanie publicznych definicji kanałów wydania
    - Uruchamianie walidacji wydania lub akceptacji pakietu
    - Szukam nazewnictwa wersji i harmonogramu wydań
summary: Ścieżki wydań, lista kontrolna operatora, pola walidacji, nazewnictwo wersji i rytm wydań
title: Zasady wydań
x-i18n:
    generated_at: "2026-06-27T18:17:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16873b02f09bd0f67ea16644630defc1b17b6f236572715df598a2253dba3b2d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw ma trzy publiczne ścieżki wydań:

- stabilna: tagowane wydania publikowane domyślnie do npm `beta` albo do npm `latest`, gdy zostanie to jawnie zażądane
- beta: tagi przedwydań publikowane do npm `beta`
- dev: ruchoma głowica `main`

## Nazewnictwo wersji

- Wersja wydania stabilnego: `YYYY.M.PATCH`
  - Tag Git: `vYYYY.M.PATCH`
- Wersja wydania poprawkowego stabilnego: `YYYY.M.PATCH-N`
  - Tag Git: `vYYYY.M.PATCH-N`
- Wersja przedwydania beta: `YYYY.M.PATCH-beta.N`
  - Tag Git: `vYYYY.M.PATCH-beta.N`
- Nie dodawaj zer wiodących do miesiąca ani poprawki
- Od aktualizacji procesu wydań z czerwca 2026 trzeci komponent jest
  sekwencyjnym miesięcznym numerem pociągu wydań, a nie dniem kalendarzowym.
  Wydania stabilne i beta wyznaczają bieżący pociąg; tagi wyłącznie alfa nie
  zużywają ani nie przesuwają numeru poprawki beta/stabilnej. Tagi sprzed
  aktualizacji oraz wersje npm zachowują istniejące nazwy i pozostają ważne;
  automatyzacja wydań nadal porównuje je według roku, miesiąca, poprawki,
  kanału oraz numeru przedwydania lub poprawki.
- Kompilacje alfa/nocne używają następnego niewydanego pociągu poprawek i
  zwiększają tylko `alpha.N` dla powtarzanych kompilacji. Gdy dana poprawka ma
  już wersję beta, nowe kompilacje alfa przechodzą do kolejnej poprawki. Przy
  wyborze pociągu beta lub stabilnego ignoruj starsze tagi wyłącznie alfa z
  wyższymi numerami poprawek.
- Wersje npm są niemutowalne. Jeśli tag beta został już opublikowany, nie
  usuwaj go, nie publikuj ponownie ani nie używaj ponownie; utwórz kolejny numer
  beta albo następną miesięczną poprawkę. Ponieważ `2026.6.5-beta.1` zostało już
  opublikowane podczas przejścia, pociągi wydań z czerwca 2026 muszą używać
  poprawki `5` lub wyższej. Nie publikuj nowych pociągów stabilnych ani beta z
  czerwca 2026 jako `2026.6.2`, `2026.6.3` ani `2026.6.4`.
- Po stabilnym `2026.6.5` następnym nowym pociągiem beta jest
  `2026.6.6-beta.1`, nawet jeśli istnieją już automatyczne tagi wyłącznie alfa
  z wyższymi numerami poprawek.
- `latest` oznacza bieżące promowane stabilne wydanie npm
- `beta` oznacza bieżący cel instalacji beta
- Wydania stabilne i stabilne poprawkowe publikują domyślnie do npm `beta`;
  operatorzy wydań mogą jawnie wskazać `latest` albo później wypromować
  zweryfikowaną kompilację beta
- Każde stabilne wydanie OpenClaw dostarcza razem pakiet npm, aplikację macOS i
  podpisane instalatory Windows Hub; wydania beta zwykle najpierw walidują i
  publikują ścieżkę npm/pakietu, a kompilowanie, podpisywanie, notaryzację i
  promocję natywnych aplikacji rezerwują dla wydań stabilnych, chyba że jawnie
  zażądano inaczej

## Rytm wydań

- Wydania przechodzą najpierw przez beta
- Wydanie stabilne następuje dopiero po zwalidowaniu najnowszej wersji beta
- Maintainerzy zwykle tworzą wydania z gałęzi `release/YYYY.M.PATCH` utworzonej
  z bieżącego `main`, aby walidacja wydań i poprawki nie blokowały nowego
  rozwoju na `main`
- Jeśli tag beta został wypchnięty lub opublikowany i wymaga poprawki,
  maintainerzy tworzą następny tag `-beta.N` zamiast usuwać lub odtwarzać stary
  tag beta
- Szczegółowa procedura wydania, zatwierdzenia, poświadczenia i notatki
  odzyskiwania są dostępne tylko dla maintainerów

## Lista kontrolna operatora wydania

Ta lista kontrolna pokazuje publiczny kształt przepływu wydania. Prywatne
poświadczenia, podpisywanie, notaryzacja, odzyskiwanie dist-tag i szczegóły
awaryjnego wycofania pozostają w podręczniku wydań dostępnym tylko dla
maintainerów.

1. Zacznij od bieżącego `main`: pobierz najnowsze zmiany, potwierdź, że
   docelowy commit został wypchnięty, i potwierdź, że bieżące CI `main` jest
   wystarczająco zielone, aby utworzyć z niego gałąź.
2. Wygeneruj górną sekcję `CHANGELOG.md` ze scalonych PR-ów i wszystkich
   bezpośrednich commitów od ostatniego osiągalnego taga wydania. Utrzymuj wpisy
   w formie skierowanej do użytkownika, deduplikuj nakładające się wpisy
   PR/bezpośrednich commitów, zatwierdź przepisanie, wypchnij je i jeszcze raz
   wykonaj rebase/pull przed utworzeniem gałęzi.
3. Przejrzyj rekordy zgodności wydań w
   `src/plugins/compat/registry.ts` i
   `src/commands/doctor/shared/deprecation-compat.ts`. Usuwaj wygasłą zgodność
   tylko wtedy, gdy ścieżka aktualizacji pozostaje pokryta, albo zapisz, dlaczego
   jest celowo utrzymywana.
4. Utwórz `release/YYYY.M.PATCH` z bieżącego `main`; nie wykonuj zwykłych prac
   nad wydaniem bezpośrednio na `main`.
5. Podbij każdą wymaganą lokalizację wersji dla zamierzonego taga, a następnie
   uruchom `pnpm release:prep`. Odświeża to wersje pluginów, inwentarz pluginów,
   schemat konfiguracji, metadane konfiguracji dołączonych kanałów, baseline
   dokumentacji konfiguracji, eksporty SDK pluginów i baseline API SDK pluginów
   we właściwej kolejności. Zatwierdź wszelkie wygenerowane odchylenia przed
   tagowaniem. Następnie uruchom lokalny deterministyczny preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` oraz `pnpm release:check`.
6. Uruchom `OpenClaw NPM Release` z `preflight_only=true`. Zanim tag istnieje,
   pełny 40-znakowy SHA gałęzi wydania jest dozwolony tylko do walidacyjnego
   preflight. Preflight generuje dowody wydania zależności dla dokładnie
   checkoutowanego grafu zależności i zapisuje je w artefakcie npm preflight.
   Zapisz udany `preflight_run_id`.
7. Uruchom wszystkie testy przedwydaniowe przez `Full Release Validation` dla
   gałęzi wydania, taga albo pełnego SHA commita. To jest jeden ręczny punkt
   wejścia dla czterech dużych pól testowych wydania: Vitest, Docker, QA Lab i
   Package.
8. Jeśli walidacja się nie powiedzie, napraw problem na gałęzi wydania i uruchom
   ponownie najmniejszy nieudany plik, pas, zadanie workflow, profil pakietu,
   providera lub listę dozwolonych modeli, które dowodzą poprawki. Uruchamiaj
   ponownie pełny parasol tylko wtedy, gdy zmieniona powierzchnia dezaktualizuje
   wcześniejsze dowody.
9. Dla otagowanego kandydata beta uruchom
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` z pasującej gałęzi
   `release/YYYY.M.PATCH`. Dla wersji stabilnej przekaż także wymagane wydanie
   źródłowe Windows:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   Helper uruchamia lokalne kontrole wygenerowanego wydania, wysyła lub
   weryfikuje pełną walidację wydania i dowody npm preflight, uruchamia dowód
   świeżej instalacji/aktualizacji Parallels wobec dokładnie przygotowanego
   tarballa plus dowód pakietu Telegram, zapisuje plany npm pluginów i ClawHub,
   a dokładne polecenie `OpenClaw Release Publish` wypisuje dopiero, gdy pakiet
   dowodów jest zielony.
   `OpenClaw Release Publish` wysyła wybrane lub wszystkie możliwe do publikacji
   pakiety pluginów do npm i ten sam zestaw równolegle do ClawHub, a następnie
   promuje przygotowany artefakt npm preflight OpenClaw z pasującym dist-tag,
   gdy tylko publikacja pluginów npm się powiedzie.
   Po powodzeniu procesu potomnego publikacji npm OpenClaw tworzy lub aktualizuje
   pasującą stronę wydania/przedwydania GitHub z kompletnej pasującej sekcji
   `CHANGELOG.md`. Wydania stabilne opublikowane do npm `latest` stają się
   najnowszym wydaniem GitHub; stabilne wydania utrzymaniowe pozostawione na npm
   `beta` są tworzone z GitHub `latest=false`. Workflow przesyła także dowody
   zależności z preflight, manifest pełnej walidacji i dowody weryfikacji
   rejestru po publikacji do wydania GitHub na potrzeby obsługi incydentów po
   wydaniu. Workflow publikacji natychmiast wypisuje identyfikatory uruchomień
   potomnych, automatycznie zatwierdza bramki środowiska wydania, które token
   workflow może zatwierdzić, podsumowuje nieudane zadania potomne ogonami
   logów, zamyka wydanie GitHub i dowody zależności, gdy tylko publikacja npm
   OpenClaw się powiedzie, czeka na ClawHub zawsze, gdy OpenClaw npm jest
   publikowane, następnie uruchamia `pnpm release:verify-beta` i przesyła dowody
   po publikacji dla wydania GitHub, pakietu npm, wybranych pakietów pluginów
   npm, wybranych pakietów ClawHub, identyfikatorów uruchomień workflow
   potomnych i opcjonalnego identyfikatora uruchomienia NPM Telegram. Ścieżka
   ClawHub ponawia przejściowe awarie instalacji zależności CLI, publikuje
   pluginy z pozytywnym podglądem nawet wtedy, gdy jedna komórka podglądu jest
   niestabilna, i kończy weryfikacją rejestru dla każdej oczekiwanej wersji
   pluginu, aby częściowe publikacje pozostały widoczne i możliwe do ponowienia.
   Następnie uruchom akceptację pakietu po publikacji wobec opublikowanego
   pakietu `openclaw@YYYY.M.PATCH-beta.N` albo `openclaw@beta`. Jeśli wypchnięte
   lub opublikowane przedwydanie wymaga poprawki, utwórz następny pasujący numer
   przedwydania; nie usuwaj ani nie przepisuj starego przedwydania.
10. Dla wersji stabilnej kontynuuj dopiero wtedy, gdy zweryfikowana beta lub
    kandydat wydania ma wymagane dowody walidacji. Publikacja stabilnego npm
    również przechodzi przez `OpenClaw Release Publish`, ponownie używając
    udanego artefaktu preflight przez `preflight_run_id`; gotowość stabilnego
    wydania macOS wymaga także spakowanych `.zip`, `.dmg`, `.dSYM.zip` oraz
    zaktualizowanego `appcast.xml` na `main`. Workflow publikacji macOS
    automatycznie publikuje podpisany appcast do publicznego `main` po
    weryfikacji zasobów wydania; jeśli ochrona gałęzi blokuje bezpośrednie
    wypchnięcie, otwiera lub aktualizuje PR appcast. Gotowość stabilnego
    Windows Hub wymaga podpisanych zasobów `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe` i
    `OpenClawCompanion-SHA256SUMS.txt` w wydaniu GitHub OpenClaw.
    Przekaż dokładny tag podpisanego wydania `openclaw/openclaw-windows-node`
    jako `windows_node_tag` oraz zatwierdzoną dla kandydata mapę digestów
    instalatorów jako `windows_node_installer_digests`; `OpenClaw Release
    Publish` zachowuje szkic wydania, wysyła `Windows Node Release` i weryfikuje
    wszystkie trzy zasoby przed publikacją.
11. Po publikacji uruchom weryfikator npm po publikacji, opcjonalny samodzielny
    Telegram E2E opublikowanego npm, gdy potrzebujesz dowodu kanału po
    publikacji, promocję dist-tag, gdy jest potrzebna, zweryfikuj wygenerowaną
    stronę wydania GitHub, uruchom kroki ogłoszenia wydania, a następnie wykonaj
    [Zamknięcie stabilnego main](#stable-main-closeout), zanim uznasz wydanie
    stabilne za ukończone.

## Zamknięcie stabilnego main

Publikacja stabilna nie jest kompletna, dopóki `main` nie zawiera faktycznego
stanu wysłanego wydania.

1. Zacznij od świeżego, najnowszego `main`. Zaaudytuj `release/YYYY.M.PATCH` względem niego i
   przenieś do przodu rzeczywiste poprawki, których brakuje w `main`. Nie scalaj bezrefleksyjnie
   adapterów zgodności, testów ani walidacji wyłącznie z wydania do nowszego `main`.
2. Ustaw `main` na wydaną wersję stabilną, a nie spekulacyjny następny cykl. Uruchom
   `pnpm release:prep` po zmianie wersji głównej, a następnie
   `pnpm deps:shrinkwrap:generate`.
3. Spraw, aby sekcja `## YYYY.M.PATCH` w `CHANGELOG.md` na `main` dokładnie odpowiadała
   otagowanej gałęzi wydania. Dołącz stabilną aktualizację `appcast.xml`, jeśli wydanie na mac
   ją opublikowało.
4. Nie dodawaj `YYYY.M.PATCH+1`, wersji beta ani pustej przyszłej sekcji dziennika zmian
   do `main`, dopóki operator wyraźnie nie rozpocznie tego cyklu wydawniczego.
5. Uruchom `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` oraz
   `OPENCLAW_TESTBOX=1 pnpm check:changed`. Wypchnij zmiany, a następnie zweryfikuj, że `origin/main`
   zawiera wydaną wersję i dziennik zmian, zanim uznasz stabilne wydanie za
   ukończone.
6. Utrzymuj zmienne repozytorium `RELEASE_ROLLBACK_DRILL_ID` i
   `RELEASE_ROLLBACK_DRILL_DATE` jako aktualne po każdym prywatnym ćwiczeniu wycofania.
   `OpenClaw Stable Main Closeout` zaczyna się od wypchnięcia do `main`, które zawiera
   wydaną wersję, dziennik zmian i appcast po publikacji stabilnej wersji. Odczytuje
   niezmienne dowody po publikacji, aby powiązać wydany tag z jego przebiegami Full Release
   Validation i Publish, a następnie weryfikuje stabilny stan main, wydanie,
   obowiązkowy stabilny okres obserwacji oraz blokujące dowody wydajności. Dołącza
   niezmienny manifest zamknięcia i sumę kontrolną do wydania GitHub. Automatyczny
   wyzwalacz push pomija starsze wydania, które poprzedzają niezmienne dowody po publikacji;
   nigdy nie traktuje tego pominięcia jako ukończonego zamknięcia. Pełne
   zamknięcie wymaga zarówno zasobów, jak i pasującej sumy kontrolnej. Częściowy manifest
   odtwarza zapisany SHA `main` i ćwiczenie wycofania, aby ponownie wygenerować identyczne
   bajty, a następnie dołącza brakującą sumę kontrolną; nieprawidłowa para albo suma kontrolna
   bez manifestu pozostaje blokująca. Przebieg wyzwolony pushem bez zmiennych repozytorium
   ćwiczenia wycofania pomija wykonanie bez ukończenia zamknięcia; brakujący lub
   starszy niż 90 dni rekord ćwiczenia nadal blokuje ręczne zamknięcie oparte na dowodach.
   Prywatne polecenia odzyskiwania pozostają w runbooku tylko dla maintainerów.
   Używaj ręcznego dispatch tylko do naprawy lub odtworzenia opartego na dowodach zamknięcia stabilnego wydania.
   Starszy tag korekty awaryjnej może ponownie użyć dowodów pakietu bazowego tylko wtedy, gdy
   tag korekty rozwiązuje się do tego samego commita źródłowego co bazowy tag stabilny.
   Korekta z innym źródłem musi opublikować i zweryfikować własne dowody
   pakietu.

## Preflight wydania

- Uruchom `pnpm check:test-types` przed kontrolą wstępną wydania, aby testowy TypeScript pozostał
  objęty kontrolą poza szybszą lokalną bramką `pnpm check`
- Uruchom `pnpm check:architecture` przed kontrolą wstępną wydania, aby szersze kontrole cykli
  importów i granic architektury były zielone poza szybszą lokalną bramką
- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane
  artefakty wydania `dist/*` i pakiet Control UI istniały na potrzeby kroku
  walidacji pakowania
- Uruchom `pnpm release:prep` po podbiciu wersji w katalogu głównym i przed tagowaniem. Uruchamia
  każdy deterministyczny generator wydania, który często rozjeżdża się po zmianie
  wersji/konfiguracji/API: wersje pluginów, inwentarz pluginów, bazowy schemat
  konfiguracji, metadane konfiguracji dołączonych kanałów, bazę dokumentacji konfiguracji, eksporty plugin SDK
  oraz bazę API plugin SDK. `pnpm release:check` ponownie uruchamia te
  zabezpieczenia w trybie sprawdzania i zgłasza każdą znalezioną awarię dryfu wygenerowanych plików w jednym
  przebiegu przed uruchomieniem kontroli wydania pakietu.
- Synchronizacja wersji pluginów domyślnie aktualizuje wersje oficjalnych pakietów pluginów i istniejące
  progi `openclaw.compat.pluginApi` do wersji wydania OpenClaw.
  Traktuj to pole jako próg API plugin SDK/runtime, a nie tylko kopię
  wersji pakietu: w przypadku wydań tylko pluginów, które celowo pozostają
  kompatybilne ze starszymi hostami OpenClaw, pozostaw próg na najstarszym obsługiwanym
  API hosta i udokumentuj ten wybór w dowodzie wydania pluginu.
- Uruchom ręczny workflow `Full Release Validation` przed zatwierdzeniem wydania, aby
  uruchomić wszystkie przedwydaniowe boksy testowe z jednego punktu wejścia. Przyjmuje gałąź,
  tag lub pełny SHA commita, dispatchuje ręczny `CI` oraz dispatchuje
  `OpenClaw Release Checks` dla smoke testu instalacji, akceptacji pakietu, międzyplatformowych
  kontroli pakietu, parytetu QA Lab, Matrix i ścieżek Telegram. Stabilne i pełne
  przebiegi zawsze obejmują wyczerpujące live/E2E oraz Docker soak ścieżki wydania;
  `run_release_soak=true` pozostaje dostępne dla jawnego beta soak. Package
  Acceptance dostarcza kanoniczne pakietowe Telegram E2E podczas walidacji kandydata,
  unikając drugiego równoległego pollera live.
  Podaj `release_package_spec` po opublikowaniu bety, aby ponownie użyć dostarczonego
  pakietu npm w kontrolach wydania, Package Acceptance i pakietowym Telegram
  E2E bez ponownego budowania tarballa wydania. Podaj
  `npm_telegram_package_spec` tylko wtedy, gdy Telegram powinien używać innego
  opublikowanego pakietu niż reszta walidacji wydania. Podaj
  `package_acceptance_package_spec`, gdy Package Acceptance powinno używać
  innego opublikowanego pakietu niż specyfikacja pakietu wydania. Podaj
  `evidence_package_spec`, gdy raport dowodów wydania powinien wykazać, że
  walidacja odpowiada opublikowanemu pakietowi npm bez wymuszania Telegram E2E.
  Przykład:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- Uruchom ręczny workflow `Package Acceptance`, gdy chcesz uzyskać dowód bocznym kanałem
  dla kandydata pakietu, podczas gdy prace nad wydaniem trwają. Użyj `source=npm` dla
  `openclaw@beta`, `openclaw@latest` lub dokładnej wersji wydania; `source=ref`
  do spakowania zaufanej gałęzi/tagu/SHA `package_ref` z bieżącym
  harness `workflow_ref`; `source=url` dla publicznego tarballa HTTPS z
  wymaganym SHA-256 i ścisłą polityką publicznych URL; `source=trusted-url` dla
  nazwanej polityki zaufanego źródła z wymaganym `trusted_source_id` i SHA-256; albo
  `source=artifact` dla tarballa przesłanego przez inny przebieg GitHub Actions. Workflow
  rozwiązuje kandydata do
  `package-under-test`, ponownie używa harmonogramu wydania Docker E2E wobec tego
  tarballa i może uruchomić QA Telegram wobec tego samego tarballa z
  `telegram_mode=mock-openai` lub `telegram_mode=live-frontier`. Gdy
  wybrane ścieżki Docker obejmują `published-upgrade-survivor`, artefakt pakietu
  jest kandydatem, a `published_upgrade_survivor_baseline` wybiera
  opublikowaną bazę. `update-restart-auth` używa pakietu kandydata jako
  zainstalowanego CLI i jako package-under-test, dzięki czemu sprawdza zarządzaną
  ścieżkę restartu komendy aktualizacji kandydata.
  Przykład: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Typowe profile:
  - `smoke`: ścieżki instalacji/kanału/agenta, sieci Gateway i przeładowania konfiguracji
  - `package`: natywne dla artefaktu ścieżki pakietu/aktualizacji/restartu/pluginu bez OpenWebUI ani live ClawHub
  - `product`: profil pakietu plus kanały MCP, czyszczenie cron/subagent,
    wyszukiwanie webowe OpenAI i OpenWebUI
  - `full`: fragmenty ścieżki wydania Docker z OpenWebUI
  - `custom`: dokładny wybór `docker_lanes` dla ukierunkowanego ponownego przebiegu
- Uruchom ręczny workflow `CI` bezpośrednio, gdy potrzebujesz tylko deterministycznego normalnego
  pokrycia CI dla kandydata wydania. Ręczne dispatchowanie CI omija zakres zmian
  i wymusza shardy Linux Node, shardy dołączonych pluginów, shardy kontraktów pluginów i
  kanałów, kompatybilność Node 22, `check-*`, `check-additional-*`,
  smoke testy zbudowanych artefaktów, kontrole docs, Python skills, Windows, macOS i
  ścieżki i18n Control UI. Samodzielne ręczne przebiegi CI uruchamiają Android tylko po dispatchu
  z `include_android=true`; `Full Release Validation` przekazuje ten input do
  swojego dziecka CI.
  Przykład z Android: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- Uruchom `pnpm qa:otel:smoke` podczas walidacji telemetrii wydania. Sprawdza
  QA-lab przez lokalny odbiornik OTLP/HTTP i weryfikuje eksport śladów, metryk i logów
  oraz ograniczone atrybuty śladów i redakcję treści/identyfikatorów bez
  wymagania Opik, Langfuse ani innego zewnętrznego kolektora.
- Uruchom `pnpm qa:otel:collector-smoke` podczas walidacji kompatybilności kolektora.
  Kieruje ten sam eksport OTLP QA-lab przez prawdziwy kontener Docker OpenTelemetry Collector
  przed asercjami lokalnego odbiornika.
- Uruchom `pnpm qa:prometheus:smoke` podczas walidacji chronionego scrapingu Prometheus.
  Sprawdza QA-lab, odrzuca nieuwierzytelnione scrapingi i weryfikuje, że
  krytyczne dla wydania rodziny metryk pozostają wolne od treści promptów, surowych identyfikatorów,
  tokenów auth i ścieżek lokalnych.
- Uruchom `pnpm qa:observability:smoke`, gdy chcesz wykonać ścieżki smoke
  OpenTelemetry i Prometheus w checkout źródłowym jedna po drugiej.
- Uruchom `pnpm release:check` przed każdym tagowanym wydaniem
- Kontrola wstępna `OpenClaw NPM Release` generuje dowody wydania zależności przed
  spakowaniem tarballa npm. Bramka podatności z advisory npm
  blokuje wydanie. Raporty ryzyka manifestu przechodniego, powierzchni własności/instalacji zależności
  oraz zmian zależności są tylko dowodami wydania. Raport
  zmian zależności porównuje kandydata wydania z poprzednim
  osiągalnym tagiem wydania.
- Kontrola wstępna przesyła dowody zależności jako
  `openclaw-release-dependency-evidence-<tag>` i osadza je również pod
  `dependency-evidence/` wewnątrz przygotowanego artefaktu kontroli wstępnej npm. Rzeczywista
  ścieżka publikacji ponownie używa tego artefaktu kontroli wstępnej, a następnie dołącza te same dowody
  do wydania GitHub jako `openclaw-<version>-dependency-evidence.zip`.
- Uruchom `OpenClaw Release Publish` dla mutującej sekwencji publikacji po
  utworzeniu tagu. Dispatchuj z `release/YYYY.M.PATCH` (albo `main` przy publikowaniu
  tagu osiągalnego z main), przekaż tag wydania, udany
  `preflight_run_id` OpenClaw npm i udany `full_release_validation_run_id`, oraz pozostaw
  domyślny zakres publikacji pluginów `all-publishable`, chyba że celowo
  uruchamiasz ukierunkowaną naprawę. Workflow serializuje publikację pluginów w npm, publikację pluginów
  w ClawHub i publikację OpenClaw npm, aby pakiet core nie został opublikowany
  przed swoimi zewnętrznymi pluginami.
- Stabilne `OpenClaw Release Publish` wymaga dokładnego `windows_node_tag` po
  istnieniu pasującego, nie-prerelease wydania `openclaw/openclaw-windows-node`.
  Wymaga też zaakceptowanej dla kandydata mapy `windows_node_installer_digests`.
  Przed dispatchowaniem dowolnego dziecka publikacji weryfikuje, że wydanie źródłowe jest
  opublikowane, nie-prerelease, zawiera wymagane instalatory x64/ARM64 i
  nadal odpowiada tej zaakceptowanej mapie. Następnie dispatchuje `Windows Node Release`,
  gdy wydanie OpenClaw jest jeszcze szkicem, przenosząc przypiętą mapę skrótów instalatorów
  bez zmian. Workflow dziecka pobiera podpisane instalatory Windows Hub z tego dokładnego tagu,
  porównuje je z przypiętymi skrótami, weryfikuje na runnerze Windows, że ich podpisy
  Authenticode używają oczekiwanego podpisującego OpenClaw Foundation,
  zapisuje manifest SHA-256 i przesyła instalatory oraz manifest do
  kanonicznego wydania OpenClaw GitHub, a następnie ponownie pobiera wypromowane zasoby i
  weryfikuje członkostwo oraz hashe manifestu. Rodzic weryfikuje bieżący
  kontrakt zasobów x64, ARM64 i sum kontrolnych przed publikacją. Bezpośrednie odzyskiwanie
  odrzuca nieoczekiwane nazwy zasobów `OpenClawCompanion-*` przed zastąpieniem
  oczekiwanych zasobów kontraktowych przypiętymi bajtami źródłowymi. Ręcznie dispatchuj
  `Windows Node Release` tylko do odzyskiwania i zawsze przekazuj dokładny tag, nigdy
  `latest`, plus jawną mapę JSON `expected_installer_digests` z
  zatwierdzonego wydania źródłowego. Linki pobierania na stronie powinny wskazywać dokładne URL-e zasobów wydania OpenClaw
  dla bieżącego wydania stabilnego albo
  `releases/latest/download/...` dopiero po zweryfikowaniu, że przekierowanie GitHub latest
  wskazuje na to samo wydanie; nie linkuj wyłącznie do strony wydania repozytorium companion.
- Kontrole wydania działają teraz w osobnym ręcznym workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` uruchamia też ścieżkę parytetu mock QA Lab oraz szybki
  profil live Matrix i ścieżkę QA Telegram przed zatwierdzeniem wydania. Ścieżki live
  używają środowiska `qa-live-shared`; Telegram używa również dzierżaw danych uwierzytelniających Convex CI.
  Uruchom ręczny workflow `QA-Lab - All Lanes` z
  `matrix_profile=all` i `matrix_shards=true`, gdy chcesz uzyskać pełny spis transportu,
  mediów i E2EE Matrix równolegle.
- Walidacja runtime instalacji i aktualizacji między systemami operacyjnymi jest częścią publicznych
  `OpenClaw Release Checks` i `Full Release Validation`, które wywołują
  reusable workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml` bezpośrednio
- Ten podział jest celowy: utrzymuje rzeczywistą ścieżkę wydania npm krótką,
  deterministyczną i skoncentrowaną na artefaktach, podczas gdy wolniejsze kontrole live pozostają w swojej
  własnej ścieżce, aby nie opóźniały ani nie blokowały publikacji
- Kontrole wydania niosące sekrety powinny być dispatchowane przez `Full Release
Validation` albo z ref workflow `main`/release, aby logika workflow i
  sekrety pozostały kontrolowane
- `OpenClaw Release Checks` akceptuje gałąź, tag lub pełny SHA commita, o ile
  rozwiązany commit jest osiągalny z gałęzi OpenClaw lub tagu wydania
- Walidacyjna kontrola wstępna `OpenClaw NPM Release` także akceptuje bieżący
  pełny 40-znakowy SHA commita gałęzi workflow bez wymagania wypchniętego tagu
- Ta ścieżka SHA jest tylko walidacyjna i nie może zostać wypromowana do rzeczywistej publikacji
- W trybie SHA workflow syntetyzuje `v<package.json version>` tylko na potrzeby
  kontroli metadanych pakietu; rzeczywista publikacja nadal wymaga prawdziwego tagu wydania
- Oba workflow utrzymują rzeczywistą ścieżkę publikacji i promocji na runnerach
  hostowanych przez GitHub, podczas gdy niemutująca ścieżka walidacji może używać większych
  runnerów Blacksmith Linux
- Ten workflow uruchamia
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  z użyciem sekretów workflow `OPENAI_API_KEY` i `ANTHROPIC_API_KEY`
- Kontrola wstępna wydania npm nie czeka już na osobną ścieżkę kontroli wydania
- Przed lokalnym tagowaniem kandydata wydania uruchom
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. Pomocnik
  uruchamia szybkie zabezpieczenia wydania, kontrole wydania pluginów npm/ClawHub, build,
  build UI oraz `release:openclaw:npm:check` w kolejności, która wyłapuje typowe
  błędy blokujące zatwierdzenie przed startem workflow publikacji GitHub.
- Uruchom `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (albo pasujący tag beta/korekty) przed zatwierdzeniem
- Po publikacji npm uruchom
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (lub odpowiadającej wersji beta/korekty), aby zweryfikować ścieżkę instalacji
  z opublikowanego rejestru w świeżym prefiksie tymczasowym
- Po publikacji wersji beta uruchom `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`,
  aby zweryfikować wdrażanie zainstalowanego pakietu, konfigurację Telegram oraz rzeczywisty E2E Telegram
  względem opublikowanego pakietu npm z użyciem wspólnej puli dzierżawionych danych uwierzytelniających Telegram.
  Jednorazowe lokalne uruchomienia przez opiekunów mogą pominąć zmienne Convex
  i przekazać bezpośrednio trzy dane uwierzytelniające środowiska `OPENCLAW_QA_TELEGRAM_*`.
- Aby uruchomić pełny test smoke po publikacji wersji beta z maszyny opiekuna, użyj `pnpm release:beta-smoke -- --beta betaN`. Narzędzie pomocnicze uruchamia walidację aktualizacji npm w Parallels i świeżego celu, uruchamia `NPM Telegram Beta E2E`, sonduje dokładne uruchomienie przepływu pracy, pobiera artefakt i wypisuje raport Telegram.
- Opiekunowie mogą uruchomić tę samą kontrolę po publikacji z GitHub Actions przez
  ręczny przepływ pracy `NPM Telegram Beta E2E`. Jest on celowo wyłącznie ręczny
  i nie uruchamia się przy każdym scaleniu.
- Automatyzacja wydań opiekunów używa teraz schematu preflight, a potem promocja:
  - rzeczywista publikacja npm musi mieć udany npm `preflight_run_id`
  - rzeczywista publikacja npm musi zostać uruchomiona z tej samej gałęzi `main` lub
    `release/YYYY.M.PATCH` co udane uruchomienie preflight
  - stabilne wydania npm domyślnie używają `beta`
  - stabilna publikacja npm może jawnie wskazać `latest` przez dane wejściowe przepływu pracy
  - mutacja npm dist-tag oparta na tokenie znajduje się teraz w
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, ponieważ
    `npm dist-tag add` nadal wymaga `NPM_TOKEN`, podczas gdy repozytorium źródłowe zachowuje
    publikowanie wyłącznie przez OIDC
  - publiczny `macOS Release` służy wyłącznie do walidacji; gdy tag istnieje tylko na
    gałęzi wydania, ale przepływ pracy jest uruchamiany z `main`, ustaw
    `public_release_branch=release/YYYY.M.PATCH`
  - rzeczywista publikacja macOS musi mieć udane macOS `preflight_run_id` i
    `validate_run_id`
  - rzeczywiste ścieżki publikacji promują przygotowane artefakty zamiast budować je
    ponownie
- Dla stabilnych wydań korekcyjnych, takich jak `YYYY.M.PATCH-N`, weryfikator po publikacji
  sprawdza także tę samą ścieżkę aktualizacji w prefiksie tymczasowym z `YYYY.M.PATCH` do `YYYY.M.PATCH-N`,
  aby korekty wydań nie mogły po cichu zostawić starszych instalacji globalnych z
  bazowym stabilnym ładunkiem
- Preflight wydania npm kończy się niepowodzeniem w trybie zamkniętym, chyba że tarball zawiera zarówno
  `dist/control-ui/index.html`, jak i niepusty ładunek `dist/control-ui/assets/`,
  abyśmy ponownie nie wysłali pustego panelu przeglądarkowego
- Weryfikacja po publikacji sprawdza także, czy opublikowane punkty wejścia Plugin i
  metadane pakietu są obecne w układzie zainstalowanym z rejestru. Wydanie, które
  wysyła brakujące ładunki uruchomieniowe Plugin, nie przechodzi weryfikatora po publikacji i
  nie może zostać promowane do `latest`.
- `pnpm test:install:smoke` wymusza także budżet npm pack `unpackedSize` dla
  kandydującego tarballa aktualizacji, dzięki czemu instalator e2e wykrywa przypadkowe powiększenie paczki
  przed ścieżką publikacji wydania
- Jeśli prace nad wydaniem dotknęły planowania CI, manifestów czasów rozszerzeń lub
  macierzy testów rozszerzeń, przed zatwierdzeniem wygeneruj ponownie i przejrzyj należące do planera
  wyjścia macierzy `plugin-prerelease-extension-shard` z
  `.github/workflows/plugin-prerelease.yml`, aby informacje o wydaniu nie opisywały
  nieaktualnego układu CI
- Gotowość stabilnego wydania macOS obejmuje także powierzchnie aktualizatora:
  - wydanie GitHub musi ostatecznie zawierać spakowane `.zip`, `.dmg` i `.dSYM.zip`
  - `appcast.xml` na `main` musi po publikacji wskazywać na nowy stabilny zip; przepływ pracy
    publikacji macOS zatwierdza go automatycznie albo otwiera PR appcast,
    gdy bezpośrednie wypchnięcie jest zablokowane
  - spakowana aplikacja musi zachować niedebugowy identyfikator pakietu, niepusty URL kanału
    Sparkle oraz `CFBundleVersion` równy lub wyższy od kanonicznego minimalnego numeru kompilacji Sparkle
    dla tej wersji wydania

## Maszyny testowe wydania

`Full Release Validation` to sposób, w jaki operatorzy uruchamiają wszystkie testy przedwydaniowe z
jednego punktu wejścia. Aby uzyskać dowód przypiętego commita na szybko zmieniającej się gałęzi, użyj
pomocnika, aby każdy workflow potomny działał z tymczasowej gałęzi ustalonej na docelowym
SHA:

```bash
pnpm ci:full-release --sha <full-sha>
```

Pomocnik wypycha `release-ci/<sha>-...`, uruchamia `Full Release Validation`
z tej gałęzi z `ref=<sha>`, weryfikuje, że każdy `headSha` workflow potomnego
pasuje do celu, a następnie usuwa tymczasową gałąź. Zapobiega to przypadkowemu udowodnieniu
nowszego uruchomienia potomnego z `main`.

Do walidacji gałęzi lub tagu wydania uruchom ją z zaufanego refa workflow
`main` i przekaż gałąź lub tag wydania jako `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

Workflow rozwiązuje docelowy ref, uruchamia ręczne `CI` z
`target_ref=<release-ref>`, a następnie uruchamia `OpenClaw Release Checks`.
`OpenClaw Release Checks` rozgałęzia się na smoke test instalacji, międzyplatformowe kontrole wydania,
pokrycie ścieżki wydania live/E2E Docker, gdy soak jest włączony, Package Acceptance
z kanonicznym pakietowym E2E Telegram, parytet QA Lab, live Matrix i live
Telegram. Pełne uruchomienie lub uruchomienie all jest akceptowalne tylko wtedy, gdy podsumowanie `Full Release Validation`
pokazuje `normal_ci`, `plugin_prerelease` i `release_checks` jako
zakończone sukcesem, chyba że ukierunkowane ponowne uruchomienie celowo pominęło osobny potomny `Plugin
Prerelease`. Używaj samodzielnego potomnego `npm-telegram` tylko do ukierunkowanego
ponownego uruchomienia opublikowanego pakietu z `release_package_spec` lub
`npm_telegram_package_spec`. Końcowe
podsumowanie weryfikatora zawiera tabele najwolniejszych zadań dla każdego uruchomienia potomnego, aby menedżer wydania
mógł zobaczyć bieżącą ścieżkę krytyczną bez pobierania logów.
Zobacz [Pełna walidacja wydania](/pl/reference/full-release-validation), aby poznać
pełną macierz etapów, dokładne nazwy zadań workflow, różnice między profilem stabilnym i pełnym,
artefakty oraz uchwyty ukierunkowanych ponownych uruchomień.
Workflow potomne są uruchamiane z zaufanego refa, który uruchamia `Full Release
Validation`, zwykle `--ref main`, nawet gdy docelowy `ref` wskazuje na
starszą gałąź lub tag wydania. Nie ma osobnego wejścia refa workflow dla Full Release Validation;
wybierz zaufany harness, wybierając ref uruchomienia workflow.
Nie używaj `--ref main -f ref=<sha>` do dokładnego dowodu commita na ruchomym `main`;
surowe SHA commitów nie mogą być refami uruchamiania workflow, więc użyj
`pnpm ci:full-release --sha <sha>`, aby utworzyć przypiętą tymczasową gałąź.

Użyj `release_profile`, aby wybrać zakres live/dostawcy:

- `minimum`: najszybsza krytyczna dla wydania ścieżka live i Docker dla OpenAI/core
- `stable`: minimum plus stabilne pokrycie dostawców/backendów do zatwierdzenia wydania
- `full`: stable plus szerokie doradcze pokrycie dostawców/mediów

Walidacja stable i full zawsze uruchamia wyczerpujący przegląd live/E2E, ścieżki wydania Docker
oraz ograniczony sweep przetrwania opublikowanych aktualizacji przed promocją.
Użyj `run_release_soak=true`, aby zażądać tego samego sweepu dla wersji beta. Ten sweep obejmuje
najnowsze cztery stabilne pakiety plus przypięte bazowe `2026.4.23` i `2026.5.2`
oraz starsze pokrycie `2026.4.15`, z usuniętymi duplikatami bazowych wersji i
każdą bazą shardowaną do osobnego zadania runnera Docker.

`OpenClaw Release Checks` używa zaufanego refa workflow, aby raz rozwiązać docelowy
ref jako `release-package-under-test` i ponownie używa tego artefaktu w kontrolach cross-OS,
Package Acceptance oraz ścieżki wydania Docker, gdy działa soak. Dzięki temu
wszystkie maszyny dotyczące pakietu używają tych samych bajtów i unika się powtarzania kompilacji pakietu.
Gdy beta jest już w npm, ustaw `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`,
aby kontrole wydania raz pobrały wysłany pakiet, wyodrębniły SHA źródła kompilacji
z `dist/build-info.json` i ponownie użyły tego artefaktu dla cross-OS,
Package Acceptance, ścieżki wydania Docker oraz pakietowych torów Telegram.
Smoke test instalacji OpenAI na cross-OS używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy
zmienna repo/organizacji jest ustawiona, w przeciwnym razie `openai/gpt-5.4`, ponieważ ten tor
udowadnia instalację pakietu, onboarding, start Gateway oraz jedną turę agenta live,
a nie benchmarkuje najwolniejszy model domyślny. Szersza macierz dostawców live
pozostaje miejscem na pokrycie specyficzne dla modeli.

Używaj tych wariantów w zależności od etapu wydania:

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

Nie używaj pełnego parasola jako pierwszego ponownego uruchomienia po ukierunkowanej poprawce. Jeśli jedna maszyna
zawiedzie, użyj nieudanego workflow potomnego, zadania, toru Docker, profilu pakietu, dostawcy
modelu lub toru QA jako następnego dowodu. Uruchom pełny parasol ponownie tylko wtedy, gdy
poprawka zmieniła wspólną orkiestrację wydania albo sprawiła, że wcześniejszy dowód all-box
stał się nieaktualny. Końcowy weryfikator parasola ponownie sprawdza zapisane identyfikatory uruchomień workflow
potomnych, więc po pomyślnym ponownym uruchomieniu workflow potomnego uruchom ponownie tylko nieudane
zadanie nadrzędne `Verify full validation`.

Do ograniczonego odzyskiwania przekaż `rerun_group` do parasola. `all` to rzeczywiste
uruchomienie kandydata do wydania, `ci` uruchamia tylko normalne potomne CI, `plugin-prerelease`
uruchamia tylko potomne wydaniowe pluginów, `release-checks` uruchamia każdą maszynę
wydania, a węższe grupy wydania to `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` i `npm-telegram`.
Ukierunkowane ponowne uruchomienia `npm-telegram` wymagają `release_package_spec` lub
`npm_telegram_package_spec`; pełne uruchomienia/all używają kanonicznego pakietowego E2E Telegram
wewnątrz Package Acceptance. Ukierunkowane
ponowne uruchomienia cross-OS mogą dodać `cross_os_suite_filter=windows/packaged-upgrade` lub
inny filtr systemu operacyjnego/zestawu. Awarie QA release-check blokują normalną walidację
wydania, w tym wymagany dryf dynamicznych narzędzi OpenClaw w standardowym poziomie.
Uruchomienia alpha Tideclaw nadal mogą traktować tory release-check niezwiązane z bezpieczeństwem pakietu jako
doradcze. Gdy `live_suite_filter` jawnie żąda bramkowanego toru QA live, takiego
jak Discord, WhatsApp lub Slack, odpowiednia
zmienna repo `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` musi być włączona; w przeciwnym razie
przechwytywanie wejścia kończy się niepowodzeniem zamiast cicho pominąć tor.

### Vitest

Maszyna Vitest to ręczny workflow potomny `CI`. Ręczne CI celowo
omija zakres zmian i wymusza normalny graf testów dla kandydata do wydania:
shardy Linux Node, shardy dołączonych pluginów, shardy kontraktów pluginów i kanałów,
zgodność Node 22, `check-*`, `check-additional-*`,
smoke testy zbudowanych artefaktów, kontrole dokumentacji, Python skills, Windows, macOS
oraz i18n Control UI. Android jest uwzględniany, gdy `Full Release Validation` uruchamia tę
maszynę, ponieważ parasol przekazuje `include_android=true`; samodzielne ręczne CI
wymaga `include_android=true`, aby uzyskać pokrycie Androida.

Użyj tej maszyny, aby odpowiedzieć: „czy drzewo źródłowe przeszło pełny normalny zestaw testów?”
Nie jest to to samo co walidacja produktu ścieżki wydania. Dowody do zachowania:

- podsumowanie `Full Release Validation` pokazujące URL uruchomionego `CI`
- zielone uruchomienie `CI` na dokładnym docelowym SHA
- nazwy nieudanych lub wolnych shardów z zadań CI podczas badania regresji
- artefakty czasów Vitest, takie jak `.artifacts/vitest-shard-timings.json`, gdy
  uruchomienie wymaga analizy wydajności

Uruchamiaj ręczne CI bezpośrednio tylko wtedy, gdy wydanie wymaga deterministycznego normalnego CI, ale
nie maszyn Docker, QA Lab, live, cross-OS ani pakietowych. Użyj pierwszego polecenia
dla bezpośredniego CI bez Androida. Dodaj `include_android=true`, gdy bezpośrednie
CI kandydata do wydania musi obejmować Androida:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Maszyna Docker znajduje się w `OpenClaw Release Checks` przez
`openclaw-live-and-e2e-checks-reusable.yml` oraz workflow trybu wydania
`install-smoke`. Waliduje kandydata do wydania przez pakietowane
środowiska Docker, a nie tylko testy na poziomie źródeł.

Pokrycie Docker wydania obejmuje:

- pełny smoke test instalacji z włączonym wolnym globalnym smoke testem instalacji Bun
- przygotowanie/ponowne użycie obrazu smoke głównego Dockerfile według docelowego SHA, z zadaniami QR,
  root/Gateway i installer/Bun smoke działającymi jako osobne shardy install-smoke
- tory E2E repozytorium
- chunki Docker ścieżki wydania: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` i `plugins-runtime-install-h`
- pokrycie OpenWebUI wewnątrz chunka `plugins-runtime-services`, gdy jest wymagane
- podzielone tory instalacji/deinstalacji dołączonych pluginów
  od `bundled-plugin-install-uninstall-0` do
  `bundled-plugin-install-uninstall-23`
- zestawy dostawców live/E2E oraz pokrycie modeli live Docker, gdy kontrole wydania
  obejmują zestawy live

Użyj artefaktów Docker przed ponownym uruchomieniem. Harmonogram ścieżki wydania przesyła
`.artifacts/docker-tests/` z logami torów, `summary.json`, `failures.json`,
czasami faz, JSON planu harmonogramu oraz poleceniami ponownego uruchomienia. Do ukierunkowanego odzyskiwania
użyj `docker_lanes=<lane[,lane]>` w reużywalnym workflow live/E2E zamiast
ponownie uruchamiać wszystkie chunki wydania. Wygenerowane polecenia ponownego uruchomienia zawierają wcześniejsze
`package_artifact_run_id` oraz przygotowane wejścia obrazu Docker, gdy są dostępne, aby
nieudany tor mógł ponownie użyć tego samego tarballa i obrazów GHCR.

### QA Lab

Maszyna QA Lab jest także częścią `OpenClaw Release Checks`. To bramka wydania dla
zachowania agentowego i poziomu kanałów, oddzielna od Vitest i mechaniki pakietów
Docker.

Pokrycie QA Lab wydania obejmuje:

- tor parytetu mock porównujący tor kandydata OpenAI z bazą Opus 4.6
  przy użyciu pakietu parytetu agentowego
- szybki profil QA live Matrix używający środowiska `qa-live-shared`
- tor QA live Telegram używający dzierżaw poświadczeń CI Convex
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`,
  `pnpm qa:prometheus:smoke` lub
  `pnpm qa:observability:smoke`, gdy telemetria wydania wymaga jawnego lokalnego
  dowodu

Użyj tej maszyny, aby odpowiedzieć: „czy wydanie zachowuje się poprawnie w scenariuszach QA i
przepływach kanałów live?” Zachowaj URL-e artefaktów dla torów parytetu, Matrix i Telegram
podczas zatwierdzania wydania. Pełne pokrycie Matrix pozostaje dostępne jako
ręczne shardowane uruchomienie QA-Lab, a nie domyślny krytyczny dla wydania tor.

### Pakiet

Maszyna Pakiet to bramka instalowalnego produktu. Opiera się na
`Package Acceptance` i resolverze
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver normalizuje
kandydata do tarballa `package-under-test` używanego przez Docker E2E, waliduje
inwentarz pakietu, zapisuje wersję pakietu i SHA-256 oraz oddziela
ref harnessu workflow od refa źródła pakietu.

Obsługiwane źródła kandydatów:

- `source=npm`: `openclaw@beta`, `openclaw@latest` lub dokładna wersja wydania OpenClaw
- `source=ref`: spakuj zaufaną gałąź `package_ref`, tag lub pełny SHA commita
  z wybranym mechanizmem `workflow_ref`
- `source=url`: pobierz publiczny plik HTTPS `.tgz` z wymaganym `package_sha256`;
  poświadczenia w URL, niestandardowe porty HTTPS, prywatne/wewnętrzne/specjalnego użycia
  nazwy hostów lub rozpoznane adresy oraz niebezpieczne przekierowania są odrzucane
- `source=trusted-url`: pobierz plik HTTPS `.tgz` z wymaganymi
  `package_sha256` i `trusted_source_id` z nazwanej polityki w
  `.github/package-trusted-sources.json`; użyj tego dla należących do maintainerów
  lustrzanych repozytoriów enterprise lub prywatnych repozytoriów pakietów zamiast dodawać
  obejście sieci prywatnej na poziomie wejścia do `source=url`
- `source=artifact`: użyj ponownie pliku `.tgz` przesłanego przez inne uruchomienie GitHub Actions

`OpenClaw Release Checks` uruchamia Package Acceptance z `source=artifact`,
przygotowanym artefaktem pakietu wydania, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance utrzymuje migrację, aktualizację,
ponowne uruchomienie po aktualizacji skonfigurowanego uwierzytelniania, instalację Skills z ClawHub na żywo, czyszczenie nieaktualnych zależności Plugin, fixture’y Plugin offline, aktualizację Plugin oraz QA pakietu Telegram względem tego samego rozpoznanego
tarballa. Blokujące kontrole wydania używają domyślnej bazy odniesienia najnowszego opublikowanego pakietu;
profil beta z `run_release_soak=true`, `release_profile=stable` lub
`release_profile=full` rozszerza zakres do każdej stabilnej bazy odniesienia opublikowanej w npm od
`2026.4.23` do `latest` oraz fixture’ów zgłoszonych problemów. Użyj
Package Acceptance z `source=npm` dla już wydanego kandydata,
`source=ref` dla lokalnego tarballa npm opartego na SHA przed publikacją,
`source=trusted-url` dla należącego do maintainerów firmowego/prywatnego mirrora lub
`source=artifact` dla przygotowanego tarballa przesłanego przez inne uruchomienie GitHub Actions.
Jest to natywne dla GitHuba
zastępstwo większości pokrycia pakietów/aktualizacji, które wcześniej wymagało
Parallels. Międzyplatformowe kontrole wydania nadal mają znaczenie dla specyficznych dla systemu operacyjnego zachowań onboardingu,
instalatora i platformy, ale walidacja produktu w zakresie pakietów/aktualizacji powinna
preferować Package Acceptance.

Kanoniczna lista kontrolna walidacji aktualizacji i Plugin to
[Testowanie aktualizacji i Plugin](/pl/help/testing-updates-plugins). Używaj jej podczas
decydowania, która lokalna ścieżka, Docker, Package Acceptance lub kontrola wydania dowodzi
instalacji/aktualizacji Plugin, czyszczenia przez doctor albo zmiany migracji opublikowanego pakietu.
Wyczerpująca migracja opublikowanych aktualizacji z każdego stabilnego pakietu `2026.4.23+` jest
osobnym ręcznym workflow `Update Migration`, a nie częścią Full Release CI.

Starsza pobłażliwość package-acceptance jest celowo ograniczona czasowo. Pakiety do
`2026.4.25` włącznie mogą używać ścieżki zgodności dla luk w metadanych już opublikowanych
w npm: prywatnych wpisów inwentarza QA brakujących w tarballu, brakującego
`gateway install --wrapper`, brakujących plików łatek w fixture git
pochodzącej z tarballa, brakującego utrwalonego `update.channel`, starszych lokalizacji rekordów instalacji Plugin,
brakującego utrwalania rekordów instalacji marketplace oraz migracji metadanych konfiguracji
podczas `plugins update`. Opublikowany pakiet `2026.4.26` może ostrzegać
o plikach stempli metadanych lokalnego builda, które zostały już wydane. Późniejsze pakiety
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

- `smoke`: szybkie ścieżki instalacji pakietu/kanału/agenta, sieci Gateway i ponownego wczytania konfiguracji
- `package`: kontrakty pakietów instalacji/aktualizacji/ponownego uruchomienia/Plugin oraz dowód instalacji Skills z ClawHub na żywo; to domyślna wartość kontroli wydania
- `product`: `package` oraz kanały MCP, czyszczenie cron/subagenta, wyszukiwanie w sieci OpenAI i OpenWebUI
- `full`: fragmenty ścieżki wydania Docker z OpenWebUI
- `custom`: dokładna lista `docker_lanes` dla ukierunkowanych ponownych uruchomień

Dla dowodu Telegram kandydata pakietu włącz `telegram_mode=mock-openai` lub
`telegram_mode=live-frontier` w Package Acceptance. Workflow przekazuje
rozpoznany tarball `package-under-test` do ścieżki Telegram; samodzielny
workflow Telegram nadal akceptuje opublikowaną specyfikację npm dla kontroli po publikacji.

## Automatyzacja publikacji wydania

`OpenClaw Release Publish` jest normalnym mutującym punktem wejścia publikacji. Orkiestruje
workflow zaufanego wydawcy w kolejności wymaganej przez wydanie:

1. Wyewidencjonuj tag wydania i rozpoznaj jego SHA commita.
2. Zweryfikuj, że tag jest osiągalny z `main` lub `release/*`.
3. Uruchom `pnpm plugins:sync:check`.
4. Wyślij `Plugin NPM Release` z `publish_scope=all-publishable` i
   `ref=<release-sha>`.
5. Wyślij `Plugin ClawHub Release` z tym samym zakresem i SHA.
6. Wyślij `OpenClaw NPM Release` z tagiem wydania, npm dist-tag oraz
   zapisanym `preflight_run_id` po zweryfikowaniu zapisanego
   `full_release_validation_run_id`.
7. Dla stabilnych wydań utwórz lub zaktualizuj wydanie GitHub jako wersję roboczą, wyślij
   `Windows Node Release` z jawnym `windows_node_tag` i
   zatwierdzonymi dla kandydata `windows_node_installer_digests`, a następnie zweryfikuj kanoniczne
   zasoby instalatora/sum kontrolnych przed opublikowaniem wersji roboczej.

Przykład publikacji beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Stabilna publikacja do domyślnego dist-tag beta:

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

Używaj niższopoziomowych workflow `Plugin NPM Release` i `Plugin ClawHub Release`
tylko do ukierunkowanej naprawy lub ponownej publikacji. `OpenClaw Release Publish` odrzuca
`plugin_publish_scope=selected`, gdy `publish_openclaw_npm=true`, aby pakiet core
nie mógł zostać wydany bez każdego publikowalnego oficjalnego Plugin, w tym
`@openclaw/diffs-language-pack`. Dla naprawy wybranego Plugin ustaw
`publish_openclaw_npm=false` z `plugin_publish_scope=selected` i
`plugins=@openclaw/name` albo wyślij workflow podrzędny bezpośrednio.

## Wejścia workflow NPM

`OpenClaw NPM Release` akceptuje te wejścia kontrolowane przez operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1` lub
  `v2026.4.2-beta.1`; gdy `preflight_only=true`, może to być także bieżący
  pełny 40-znakowy SHA commita gałęzi workflow do preflightu tylko walidacyjnego
- `preflight_only`: `true` dla wyłącznie walidacji/builda/pakietu, `false` dla
  rzeczywistej ścieżki publikacji
- `preflight_run_id`: wymagany w rzeczywistej ścieżce publikacji, aby workflow ponownie użył
  przygotowanego tarballa z udanego uruchomienia preflight
- `npm_dist_tag`: docelowy tag npm dla ścieżki publikacji; domyślnie `beta`

`OpenClaw Release Publish` akceptuje te wejścia kontrolowane przez operatora:

- `tag`: wymagany tag wydania; musi już istnieć
- `preflight_run_id`: identyfikator udanego uruchomienia preflight `OpenClaw NPM Release`;
  wymagany, gdy `publish_openclaw_npm=true`
- `full_release_validation_run_id`: identyfikator udanego uruchomienia `Full Release Validation`;
  wymagany, gdy `publish_openclaw_npm=true`
- `windows_node_tag`: dokładny tag wydania `openclaw/openclaw-windows-node` bez oznaczenia prerelease;
  wymagany dla stabilnej publikacji OpenClaw
- `windows_node_installer_digests`: zatwierdzona dla kandydata zwarta mapa JSON bieżących nazw instalatorów Windows do ich przypiętych skrótów `sha256:`; wymagana
  dla stabilnej publikacji OpenClaw
- `npm_dist_tag`: docelowy tag npm dla pakietu OpenClaw
- `plugin_publish_scope`: domyślnie `all-publishable`; używaj `selected` tylko
  do ukierunkowanych prac naprawczych wyłącznie dla Plugin z `publish_openclaw_npm=false`
- `plugins`: rozdzielone przecinkami nazwy pakietów `@openclaw/*`, gdy
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: domyślnie `true`; ustaw `false` tylko podczas używania
  workflow jako orkiestratora napraw wyłącznie dla Plugin
- `wait_for_clawhub`: domyślnie `false`, aby dostępność npm nie była blokowana przez
  sidecar ClawHub; ustaw `true` tylko wtedy, gdy ukończenie workflow musi obejmować
  ukończenie ClawHub

`OpenClaw Release Checks` akceptuje te wejścia kontrolowane przez operatora:

- `ref`: gałąź, tag lub pełny SHA commita do walidacji. Kontrole używające sekretów
  wymagają, aby rozpoznany commit był osiągalny z gałęzi OpenClaw lub
  tagu wydania.
- `run_release_soak`: włącz wyczerpujące ścieżki live/E2E, Docker release-path oraz
  soak all-since upgrade-survivor dla kontroli wydania beta. Jest wymuszane przez
  `release_profile=stable` i `release_profile=full`.

Zasady:

- Tagi stabilne i korygujące mogą być publikowane do `beta` albo `latest`
- Tagi prerelease beta mogą być publikowane tylko do `beta`
- Dla `OpenClaw NPM Release` pełny SHA commita jest dozwolony tylko wtedy, gdy
  `preflight_only=true`
- `OpenClaw Release Checks` i `Full Release Validation` są zawsze
  wyłącznie walidacyjne
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, którego użyto podczas preflight;
  workflow weryfikuje te metadane przed kontynuowaniem publikacji

## Sekwencja stabilnego wydania npm

Podczas przygotowywania stabilnego wydania npm:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`
   - Zanim istnieje tag, możesz użyć bieżącego pełnego SHA commita gałęzi
     workflow do suchego przebiegu workflow preflight wyłącznie w celu walidacji
2. Wybierz `npm_dist_tag=beta` dla normalnego przepływu beta-first albo `latest` tylko
   wtedy, gdy celowo chcesz bezpośrednio opublikować wydanie stabilne
3. Uruchom `Full Release Validation` na gałęzi wydania, tagu wydania albo pełnym
   SHA commita, gdy chcesz uzyskać normalne CI oraz pokrycie live prompt cache,
   Docker, QA Lab, Matrix i Telegram z jednego ręcznego workflow
4. Jeśli celowo potrzebujesz tylko deterministycznego normalnego grafu testów, uruchom
   zamiast tego ręczny workflow `CI` na referencji wydania
5. Wybierz dokładny tag wydania `openclaw/openclaw-windows-node` bez prerelease,
   którego podpisane instalatory x64 i ARM64 mają zostać wydane. Zapisz go jako
   `windows_node_tag`, a ich zwalidowaną mapę skrótów zapisz jako
   `windows_node_installer_digests`. Pomocnik release-candidate zapisuje oba
   i dołącza je do wygenerowanego polecenia publikowania.
6. Zapisz pomyślne `preflight_run_id` i `full_release_validation_run_id`
7. Uruchom `OpenClaw Release Publish` z tym samym `tag`, tym samym `npm_dist_tag`,
   wybranym `windows_node_tag`, zapisanym `windows_node_installer_digests`,
   zapisanym `preflight_run_id` oraz zapisanym `full_release_validation_run_id`;
   publikuje zewnętrzne pluginy do npm i ClawHub przed wypromowaniem pakietu
   npm OpenClaw
8. Jeśli wydanie trafiło na `beta`, użyj workflow
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`,
   aby wypromować tę wersję stabilną z `beta` do `latest`
9. Jeśli wydanie celowo opublikowano bezpośrednio do `latest`, a `beta`
   ma od razu wskazywać tę samą stabilną kompilację, użyj tego samego workflow
   wydania, aby skierować oba dist-tagi na wersję stabilną, albo pozwól, aby jego
   zaplanowana samonaprawiająca synchronizacja przeniosła `beta` później

Mutacja dist-tag znajduje się w repozytorium dziennika wydań, ponieważ nadal wymaga
`NPM_TOKEN`, a repozytorium źródłowe utrzymuje publikowanie wyłącznie przez OIDC.

Dzięki temu bezpośrednia ścieżka publikowania i ścieżka promocji beta-first są
udokumentowane i widoczne dla operatora.

Jeśli maintainer musi awaryjnie użyć lokalnego uwierzytelniania npm, uruchamiaj wszystkie
polecenia CLI 1Password (`op`) tylko wewnątrz dedykowanej sesji tmux. Nie wywołuj `op`
bezpośrednio z głównej powłoki agenta; utrzymywanie go w tmux sprawia, że prompty,
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
