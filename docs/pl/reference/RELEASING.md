---
read_when:
    - Wyszukiwanie definicji publicznych kanałów wydań
    - Uruchamianie walidacji wydania lub testów akceptacyjnych pakietu
    - Informacje o nazewnictwie wersji i harmonogramie wydań
summary: Kanały wydań, lista kontrolna operatora, pola walidacji, nazewnictwo wersji i harmonogram publikacji
title: Zasady wydawania wersji
x-i18n:
    generated_at: "2026-07-12T15:37:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4270a96560ee908c09d26782ffa75dbc695f4ab83c5a80dfb7abe5befd8ca686
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw udostępnia obecnie trzy kanały aktualizacji przeznaczone dla użytkowników:

- stable: istniejący promowany kanał wydań, który nadal jest rozwiązywany przez npm `latest`, dopóki nie zostanie osiągnięty etap wdrożenia oddzielnego kanału CLI
- beta: tagi wersji przedpremierowych publikowane w npm `beta`
- dev: przesuwający się wierzchołek gałęzi `main`

Niezależnie od tego operatorzy wydań mogą publikować pakiet rdzenia z ostatniego
zakończonego miesiąca w npm `extended-stable`, począwszy od poprawki `33`. Regularna
linia wydań finalnych z bieżącego miesiąca pozostaje w npm `latest`; ten podział
publikacji po stronie operatora sam w sobie nie zmienia sposobu rozwiązywania
kanałów aktualizacji CLI.

Wersje alfa Tideclaw stanowią oddzielną wewnętrzną ścieżkę wydań przedpremierowych (tag dystrybucyjny npm `alpha`), opisaną w sekcjach [Parametry workflow npm](#npm-workflow-inputs) i [Środowiska testowe wydań](#release-test-boxes).

## Nazewnictwo wersji

- Wersja comiesięcznego wydania npm extended-stable: `YYYY.M.PATCH`, gdzie `PATCH >= 33`, tag git `vYYYY.M.PATCH`
- Wersja codziennego/regularnego wydania finalnego: `YYYY.M.PATCH`, gdzie `PATCH < 33`, tag git `vYYYY.M.PATCH`
- Wersja regularnego wydania korygującego w trybie awaryjnym: `YYYY.M.PATCH-N`, tag git `vYYYY.M.PATCH-N`
- Wersja przedpremierowa beta: `YYYY.M.PATCH-beta.N`, tag git `vYYYY.M.PATCH-beta.N`
- Wersja przedpremierowa alfa: `YYYY.M.PATCH-alpha.N`, tag git `vYYYY.M.PATCH-alpha.N`
- Nigdy nie uzupełniaj miesiąca ani numeru poprawki zerami wiodącymi
- `PATCH` jest kolejnym numerem w miesięcznym cyklu wydań, a nie dniem kalendarzowym. Regularne wydania finalne i beta przesuwają bieżący cykl; tagi zawierające wyłącznie wersję alfa nigdy nie zużywają ani nie zwiększają numeru poprawki beta/regularnej, dlatego przy wybieraniu cyklu beta lub regularnego należy ignorować starsze tagi zawierające wyłącznie wersję alfa z wyższymi numerami poprawek.
- Wersje alfa/nocne używają następnego niewydanego cyklu poprawek i przy kolejnych kompilacjach zwiększają wyłącznie `alpha.N`. Gdy dana poprawka otrzyma wersję beta, nowe wersje alfa przechodzą do kolejnej poprawki.
- Wersje npm są niezmienne: nigdy nie usuwaj, nie publikuj ponownie ani nie wykorzystuj ponownie opublikowanego tagu. Zamiast tego utwórz kolejny numer wersji przedpremierowej lub kolejną miesięczną poprawkę.
- `latest` nadal wskazuje bieżącą regularną/codzienną linię npm; `beta` jest bieżącym celem instalacji wersji beta
- `extended-stable` oznacza obsługiwany pakiet npm z poprzedniego miesiąca, począwszy od poprawki `33`; poprawka `34` i kolejne są wydaniami konserwacyjnymi tej miesięcznej linii
- Regularne wydania finalne i regularne wydania korygujące są domyślnie publikowane w npm `beta`; operatorzy wydań mogą jawnie wskazać `latest` lub później promować zweryfikowaną wersję beta
- Dedykowana miesięczna ścieżka extended-stable publikuje pakiet rdzenia npm oraz każdy oficjalny Plugin możliwy do opublikowania w npm dokładnie w tej samej wersji. Nie publikuje Pluginów w ClawHub ani artefaktów dla systemów macOS lub Windows, wydania GitHub, tagów dystrybucyjnych prywatnych repozytoriów, obrazów Docker, artefaktów mobilnych ani plików do pobrania z witryny.
- Każde regularne wydanie finalne dostarcza razem pakiet npm, aplikację macOS, podpisany samodzielny pakiet APK dla systemu Android oraz podpisane instalatory Windows Hub. Wydania beta zwykle najpierw weryfikują i publikują ścieżkę npm/pakietu, natomiast kompilowanie, podpisywanie, notaryzacja i promowanie aplikacji natywnych są zarezerwowane dla regularnego wydania finalnego, chyba że zostaną jawnie zażądane.

## Harmonogram wydań

- Wydania najpierw trafiają do kanału beta; kanał stable otrzymuje je dopiero po zweryfikowaniu najnowszej wersji beta
- Opiekunowie zwykle przygotowują wydania z gałęzi `release/YYYY.M.PATCH` utworzonej na podstawie bieżącego `main`, aby weryfikacja i poprawki wydania nie blokowały nowych prac programistycznych w `main`
- Jeśli tag beta został wypchnięty lub opublikowany i wymaga poprawki, opiekunowie tworzą kolejny tag `-beta.N`, zamiast usuwać lub ponownie tworzyć stary
- Szczegółowa procedura wydania, zatwierdzenia, dane uwierzytelniające i informacje o odzyskiwaniu są dostępne wyłącznie dla opiekunów

## Comiesięczna publikacja extended-stable wyłącznie w npm

Jest to dedykowany wyjątek od opisanej poniżej regularnej procedury wydania. Dla
zakończonego miesiąca `YYYY.M` utwórz `extended-stable/YYYY.M.33`; publikuj
`vYYYY.M.33` i późniejsze poprawki konserwacyjne z tej samej gałęzi. Tag wydania,
wierzchołek gałęzi, kopia robocza, wersja pakietu, kontrola wstępna npm i przebieg
pełnej weryfikacji wydania muszą wskazywać ten sam commit. Chroniona gałąź `main`
musi już zawierać wersję finalną ze ściśle późniejszego miesiąca kalendarzowego,
z numerem poprawki niższym niż `33`; poprawki konserwacyjne pozostają
dopuszczalne także wtedy, gdy `main` wyprzedza tę wersję o więcej niż jeden
miesiąc.

Na właściwej gałęzi extended-stable zmień wersję pakietu głównego na `YYYY.M.P`,
uruchom `pnpm release:prep` i sprawdź, czy każdy pakiet rozszerzenia możliwy do
opublikowania ma tę samą wersję. Zatwierdź i wypchnij wszystkie wygenerowane
zmiany, utwórz i wypchnij niezmienny tag `vYYYY.M.P` wskazujący ten commit,
a następnie zapisz wynikowy pełny SHA. Workflow używają tego przygotowanego
drzewa; nie zwiększają ani nie synchronizują wersji za Ciebie.

Uruchom kontrolę wstępną npm oraz pełną weryfikację wydania z dokładnie tego
przygotowanego wierzchołka gałęzi, a następnie zapisz identyfikatory obu
przebiegów oraz numer udanej próby przebiegu pełnej weryfikacji wydania:

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

`release_profile=stable` jest istniejącym profilem poziomu szczegółowości
weryfikacji; jest niezależny od tagu dystrybucyjnego npm `extended-stable`
i celowo pozostaje niezmieniony.

Po pomyślnym zakończeniu obu przebiegów opublikuj każdy oficjalny Plugin możliwy
do opublikowania w npm z dokładnie tego samego wierzchołka gałęzi. Poprawka `P`
musi mieć wartość `33` lub większą. Przekaż pełny SHA wydania jako `ref`,
zaczekaj na ukończenie całej macierzy i zwrotne odczytanie rejestru, a następnie
zapisz identyfikator pomyślnego przebiegu wydania Pluginów w npm:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

Workflow używa regularnego, przygotowanego spisu pakietów `all-publishable`,
w tym pakietów, których kod źródłowy nie uległ zmianie. Przed pomyślnym
zakończeniem weryfikuje każdy konkretny pakiet i każdy tag Pluginu
`extended-stable`. Jeśli częściowy przebieg zakończy się niepowodzeniem,
uruchom ponownie to samo polecenie: już opublikowane pakiety zostaną ponownie
wykorzystane, brakujące lub nieaktualne tagi Pluginów zostaną uzgodnione
w środowisku wydania npm, a końcowy odczyt zwrotny nadal obejmie pełny zestaw
pakietów.

Po pomyślnym zakończeniu workflow Pluginów i przygotowaniu środowiska wydania npm
opublikuj dokładny plik tarball rdzenia z kontroli wstępnej. Publikacja rdzenia
sprawdza, czy wskazany przebieg Pluginów ma stan `completed/success` dla tej samej
kanonicznej gałęzi i dokładnie tego samego SHA źródła:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id> \
  -f full_release_validation_run_attempt=<full-validation-run-attempt> \
  -f plugin_npm_run_id=<plugin-npm-run-id>
```

W przypadku forka lub nieprodukcyjnej próby, która celowo nie może spełnić
miesięcznej zasady `.33` albo zasady miesiąca chronionej gałęzi `main`, dodaj
`-f bypass_extended_stable_guard=true` zarówno do wywołania kontroli wstępnej
npm, jak i publikacji. Wartością domyślną jest `false`. Obejście jest akceptowane
wyłącznie z `npm_dist_tag=extended-stable` i zostaje odnotowane w podsumowaniu
workflow. Nie omija ono wymogu kanonicznego odwołania workflow
`extended-stable/YYYY.M.33`, zgodności wierzchołka gałęzi, tagu i kopii roboczej,
składni tagu finalnego, zgodności wersji pakietu i tagu, tożsamości wskazanego
przebiegu i manifestu, pochodzenia pliku tarball, zatwierdzenia środowiska,
zwrotnego odczytu rejestru ani dowodów naprawy selektora.

Workflow publikacji weryfikuje tożsamość wskazanych przebiegów kontroli wstępnej,
weryfikacji i Pluginów, skrót przygotowanego pliku tarball oraz selektory rdzenia
w rejestrze. Po pomyślnym zakończeniu workflow niezależnie potwierdź wynik:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Oba polecenia muszą zwrócić `YYYY.M.P`. Jeśli publikacja się powiedzie, ale
zwrotny odczyt selektora zakończy się niepowodzeniem, nie publikuj ponownie
niezmiennej wersji pakietu. Użyj pojedynczego polecenia naprawczego
`npm dist-tag add openclaw@YYYY.M.P extended-stable`, wydrukowanego w zawsze
wykonywanym podsumowaniu nieudanego workflow, a następnie powtórz oba niezależne
odczyty zwrotne. Wycofanie selektora do poprzedniej wartości jest oddzielną
decyzją operatora, a nie ścieżką naprawy odczytu zwrotnego.

Publiczna dokumentacja pomocy technicznej początkowo wskazuje Slack, Discord
i Codex jako objęte obsługą powierzchnie Pluginów extended-stable. Ta lista jest
deklaracją zakresu obsługi, a nie listą dozwolonych elementów w kodzie wydania:
każdy oficjalny Plugin możliwy do opublikowania w npm korzysta z tej samej
ścieżki publikacji dokładnej wersji.

Poniższa regularna lista kontrolna nadal obejmuje wersje beta, `latest`, wydanie
GitHub, Pluginy, macOS, Windows i publikację na innych platformach. Nie wykonuj
tych kroków dla tej ścieżki extended-stable przeznaczonej wyłącznie dla npm.

## Regularna lista kontrolna operatora wydania

Ta lista kontrolna przedstawia publiczny kształt procesu wydania. Prywatne dane uwierzytelniające, podpisywanie, notaryzacja, odzyskiwanie tagów dystrybucyjnych i szczegóły awaryjnego wycofywania pozostają w podręczniku wydań dostępnym wyłącznie dla opiekunów.

1. Zacznij od aktualnej gałęzi `main`: pobierz najnowsze zmiany, potwierdź, że docelowy commit został wypchnięty, i upewnij się, że stan CI gałęzi `main` pozwala na utworzenie z niej nowej gałęzi.
2. Wygeneruj najwyższą sekcję pliku `CHANGELOG.md` na podstawie scalonych PR-ów i wszystkich bezpośrednich commitów od ostatniego osiągalnego tagu wydania. Zadbaj, aby wpisy były przeznaczone dla użytkowników, usuń powielające się wpisy dotyczące tych samych PR-ów i bezpośrednich commitów, wykonaj commit, wypchnij zmiany, a przed utworzeniem gałęzi jeszcze raz wykonaj rebase lub pobierz zmiany. Gdy rozbieżny opublikowany tag lub późniejsze przeniesienie zmian do przodu ponownie powiąże już wydane PR-y, przekaż ten tag jawnie jako `--shipped-ref`; weryfikator korzysta z jawnych wierszy PR-ów pochodzących z kompletnych rekordów wkładu w numerowanych sekcjach migawki tagu, ignoruje sekcję `Unreleased` oraz zapisuje dokładną listę i liczbę wykluczonych PR-ów.
3. Przejrzyj rekordy zgodności wydań w `src/plugins/compat/registry.ts` oraz `src/commands/doctor/shared/deprecation-compat.ts`. Usuwaj wygasłą zgodność tylko wtedy, gdy ścieżka aktualizacji nadal jest obsługiwana, albo zapisz, dlaczego jest celowo zachowywana.
4. Utwórz gałąź `release/YYYY.M.PATCH` z aktualnej gałęzi `main`. Nie wykonuj zwykłych prac związanych z wydaniem bezpośrednio na `main`.
5. Zaktualizuj wszystkie wymagane wystąpienia wersji dla tagu, a następnie uruchom `pnpm release:prep`. Polecenie odświeża kolejno wersje pluginów, pliki shrinkwrap npm, spis pluginów, bazowy schemat konfiguracji, metadane konfiguracji wbudowanych kanałów, bazową wersję dokumentacji konfiguracji, eksporty SDK pluginów oraz bazową wersję API SDK pluginów. Przed utworzeniem tagu zatwierdź wszelkie wygenerowane różnice, a następnie uruchom lokalne, deterministyczne sprawdzenia wstępne: `pnpm check:test-types`, `pnpm check:architecture`, `pnpm build && pnpm ui:build` oraz `pnpm release:check`.
6. Uruchom `OpenClaw NPM Release` z parametrem `preflight_only=true`. Zanim powstanie tag, dozwolony jest pełny, 40-znakowy SHA gałęzi wydania na potrzeby sprawdzenia wstępnego służącego wyłącznie do walidacji. Sprawdzenie wstępne generuje dowody wydania zależności dla dokładnego grafu zależności z aktualnie pobranej kopii i zapisuje je w artefakcie sprawdzenia wstępnego npm. Zachowaj wartość `preflight_run_id` zakończonego pomyślnie uruchomienia.
7. Uruchom wszystkie testy przedwydaniowe za pomocą `Full Release Validation` dla gałęzi wydania, tagu lub pełnego SHA commitu. Jest to jedyny ręczny punkt wejścia dla czterech dużych zestawów testów wydania: Vitest, Docker, QA Lab i Package. Zachowaj wartości `full_release_validation_run_id` oraz dokładną `full_release_validation_run_attempt`; obie są wymaganymi danymi wejściowymi dla `OpenClaw NPM Release` i `OpenClaw Release Publish`.
8. Jeśli walidacja zakończy się niepowodzeniem, wprowadź poprawkę na gałęzi wydania i ponownie uruchom najmniejszy zestaw — plik, ścieżkę, zadanie przepływu pracy, profil pakietu, dostawcę lub listę dozwolonych modeli — który potwierdzi poprawkę. Uruchamiaj ponownie pełny nadrzędny zestaw tylko wtedy, gdy zmieniony obszar powoduje, że wcześniejsze dowody są nieaktualne.
9. Dla oznaczonego tagiem kandydata beta uruchom `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` z odpowiadającej mu gałęzi `release/YYYY.M.PATCH`. Dla wydania stabilnego przekaż również wymagane wydanie źródłowe Windows: `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`. Narzędzie pomocnicze używa zaufanej gałęzi `main` jako źródła przepływu pracy, a każdy przepływ pracy kieruje na dokładny tag. Utrwala niezmienną tożsamość kandydata i narzędzi oraz identyfikatory uruchomionych przebiegów w `.artifacts/release-candidate/<tag>/release-candidate-state.json`; ponowne uruchomienie tego samego polecenia wznawia dokładnie te przebiegi, natomiast każda zmiana kandydata, narzędzi, profilu lub opcji powoduje bezpieczne przerwanie. Przed uruchomieniem pełnej macierzy walidacji narzędzie deterministycznie renderuje dokładną treść wydania GitHub dla danego tagu i odrzuca brak nagłówka wersji, treść przekraczającą limit, dla której nie można użyć kanonicznej skróconej postaci, lub pochodzenie bazowego i docelowego rekordu wkładu, które nie jest osiągalne z tagu. Waliduje również wszelkie jawne metadane wykluczeń bazowej wersji wydania względem wskazanych skumulowanych rekordów tagów. Następnie uruchamia lokalne sprawdzenia wygenerowanego wydania, uruchamia lub weryfikuje pełną walidację wydania i dowody sprawdzenia wstępnego npm, wykonuje w Parallels testy czystej instalacji i aktualizacji względem dokładnie przygotowanego archiwum tar wraz z testem pakietu Telegram, zapisuje plany npm i ClawHub dla pluginów oraz wyświetla dokładne polecenie `OpenClaw Release Publish` dopiero po pomyślnej weryfikacji całego zestawu dowodów.

   `OpenClaw Release Publish` równolegle publikuje wybrane lub wszystkie możliwe do opublikowania pakiety pluginów w npm oraz ten sam zestaw w ClawHub, a następnie, po pomyślnym opublikowaniu pluginów w npm, promuje przygotowany artefakt sprawdzenia wstępnego npm OpenClaw z odpowiednim tagiem dystrybucyjnym. Kopia robocza wydania pozostaje głównym źródłem produktu i danych, natomiast planowanie i końcowa weryfikacja są wykonywane z dokładnej, zaufanej kopii roboczej źródła przepływu pracy, dzięki czemu starszy commit wydania nie może po cichu użyć przestarzałych narzędzi wydawniczych. Przed uruchomieniem któregokolwiek podrzędnego procesu publikacji renderuje i zapisuje w pamięci podręcznej dokładną treść wydania GitHub. Gdy kompletna, odpowiadająca wydaniu sekcja `CHANGELOG.md` mieści się w limicie GitHub wynoszącym 125 000 znaków oraz w odpowiadającym mu limicie bezpieczeństwa renderera wynoszącym 125 000 bajtów, strona zawiera dokładnie tę sekcję `## YYYY.M.PATCH` wraz z nagłówkiem. Gdy sekcja źródłowa się nie mieści, strona zachowuje dokładne, pogrupowane uwagi redakcyjne i zastępuje zbyt obszerny rekord wkładu stabilnym odnośnikiem do pełnego rekordu w przypiętym do tagu pliku `CHANGELOG.md`; częściowe rekordy ani ucięte punkty listy nigdy nie są publikowane. Przepływ pracy wybiera pełną lub skróconą treść przed dodaniem sekcji `### Weryfikacja wydania`; jeśli końcowa część z dowodami przekroczyłaby limit, zachowuje kanoniczną treść i opiera się na dołączonych, niezmiennych dowodach. Stabilne wydania opublikowane w npm z tagiem `latest` stają się najnowszym wydaniem GitHub, natomiast stabilne wydania konserwacyjne zachowane w npm pod tagiem `beta` są tworzone z ustawieniem GitHub `latest=false`. Przepływ pracy przesyła również do wydania GitHub dowody zależności ze sprawdzenia wstępnego, manifest pełnej walidacji oraz dowody weryfikacji rejestru po publikacji na potrzeby obsługi incydentów powydaniowych. Natychmiast wyświetla identyfikatory podrzędnych uruchomień, automatycznie zatwierdza te bramki środowiska wydania, które token przepływu pracy ma prawo zatwierdzić, podsumowuje zakończone niepowodzeniem zadania podrzędne wraz z końcowymi fragmentami dzienników, z wyprzedzeniem tworzy wersję roboczą strony wydania GitHub i równolegle z publikacją OpenClaw w npm promuje artefakty Windows i Android, finalizuje stronę wydania i dowody zależności po pomyślnym zakończeniu tych etapów, czeka na ClawHub zawsze wtedy, gdy publikowany jest OpenClaw w npm, a następnie uruchamia weryfikator wersji beta z zaufanej gałęzi `main` i przesyła dowody powydaniowe dotyczące wydania GitHub, pakietu npm, wybranych pakietów pluginów w npm, wybranych pakietów ClawHub, identyfikatorów podrzędnych przepływów pracy oraz opcjonalnego identyfikatora uruchomienia NPM Telegram. Weryfikator rozruchowy ClawHub wymaga dokładnej ścieżki i SHA zaufanego przepływu pracy z gałęzi `main`, numerów prób uruchomienia procesu wytwarzającego i końcowego, SHA wydania, żądanego zestawu pakietów, niezmiennej krotki artefaktu pakietu oraz końcowego artefaktu odczytu zwrotnego z rejestru; pomyślnie zakończone starsze uruchomienie dla referencji wydania nie jest akceptowane.

   Następnie uruchom powydaniową akceptację pakietu dla opublikowanego pakietu `openclaw@YYYY.M.PATCH-beta.N` lub `openclaw@beta`. Jeśli wypchnięte lub opublikowane wydanie wstępne wymaga poprawki, utwórz kolejne wydanie wstępne z następnym odpowiadającym numerem; nigdy nie usuwaj ani nie przepisuj poprzedniego.

10. W przypadku wydania stabilnego kontynuuj dopiero wtedy, gdy zweryfikowana wersja beta lub kandydat do wydania ma wymagane dowody walidacji. Stabilna publikacja npm również odbywa się za pośrednictwem `OpenClaw Release Publish`, z ponownym użyciem pomyślnie zweryfikowanego artefaktu sprawdzenia wstępnego poprzez `preflight_run_id`. Gotowość stabilnego wydania macOS wymaga również obecności spakowanych plików `.zip`, `.dmg`, `.dSYM.zip` oraz zaktualizowanego pliku `appcast.xml` na gałęzi `main`; przepływ pracy publikacji macOS automatycznie publikuje podpisany plik appcast w publicznej gałęzi `main` po zweryfikowaniu artefaktów wydania albo otwiera lub aktualizuje PR dotyczący appcast, jeśli ochrona gałęzi blokuje bezpośrednie wypchnięcie. Gotowość stabilnego wydania Windows Hub wymaga obecności podpisanych artefaktów `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` oraz `OpenClawCompanion-SHA256SUMS.txt` w wydaniu OpenClaw na GitHub. Przekaż dokładny tag podpisanego wydania `openclaw/openclaw-windows-node` jako `windows_node_tag` oraz zatwierdzoną dla kandydata mapę skrótów instalatora jako `windows_node_installer_digests`; `OpenClaw Release Publish` zachowuje wersję roboczą wydania, uruchamia `Windows Node Release` i weryfikuje wszystkie trzy artefakty przed publikacją.
11. Po publikacji uruchom powydaniowy weryfikator npm, opcjonalny niezależny test E2E Telegram dla opublikowanego pakietu npm, gdy potrzebujesz powydaniowego potwierdzenia działania kanału, w razie potrzeby wykonaj promocję tagu dystrybucyjnego, zweryfikuj wygenerowaną stronę wydania GitHub, przeprowadź kroki ogłoszenia wydania, a następnie ukończ procedurę [Finalizacja stabilnego wydania na gałęzi main](#stable-main-closeout), zanim uznasz stabilne wydanie za zakończone.

## Finalizacja stabilnego wydania na gałęzi main

Publikacja stabilnego wydania nie jest ukończona, dopóki gałąź `main` nie zawiera faktycznie opublikowanego stanu wydania.

1. Zacznij od świeżo zaktualizowanej gałęzi `main`. Porównaj z nią `release/YYYY.M.PATCH` i przenieś do przodu rzeczywiste poprawki, których brakuje w `main`. Nie scalaj automatycznie z nowszą gałęzią `main` adapterów zgodności, testowych ani walidacyjnych przeznaczonych wyłącznie dla wydania.
2. Ustaw na gałęzi `main` opublikowaną stabilną wersję, a nie hipotetyczną wersję kolejnego cyklu wydawniczego. Po zmianie wersji głównej uruchom `pnpm release:prep`, a następnie `pnpm deps:shrinkwrap:generate`.
3. Doprowadź sekcję `## YYYY.M.PATCH` pliku `CHANGELOG.md` na gałęzi `main` do dokładnej zgodności z otagowaną gałęzią wydania. Uwzględnij stabilną aktualizację `appcast.xml`, jeśli została opublikowana przez wydanie dla macOS.
4. Nie dodawaj do gałęzi `main` wersji `YYYY.M.PATCH+1`, wersji beta ani pustej sekcji przyszłych zmian, dopóki operator jawnie nie rozpocznie tego cyklu wydawniczego.
5. Uruchom `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` oraz `OPENCLAW_TESTBOX=1 pnpm check:changed`. Wypchnij zmiany, a następnie sprawdź, czy `origin/main` zawiera opublikowaną wersję i dziennik zmian, zanim uznasz stabilne wydanie za ukończone.
6. Po każdym prywatnym ćwiczeniu wycofania aktualizuj zmienne repozytorium `RELEASE_ROLLBACK_DRILL_ID` oraz `RELEASE_ROLLBACK_DRILL_DATE`.

`OpenClaw Stable Main Closeout` rozpoczyna działanie od wypchnięcia do gałęzi `main`, które po stabilnej publikacji zawiera opublikowaną wersję, dziennik zmian i plik appcast. Odczytuje niezmienne dowody powydaniowe, aby powiązać opublikowany tag z uruchomieniami Full Release Validation i Publish, a następnie weryfikuje stabilny stan gałęzi main, wydanie, obowiązkowy okres stabilizacji oraz wymagane dowody wydajnościowe. Dołącza do wydania GitHub niezmienny manifest finalizacji i sumę kontrolną. Automatyczny wyzwalacz wypchnięcia pomija starsze wydania sprzed wprowadzenia niezmiennych dowodów powydaniowych i nigdy nie uznaje takiego pominięcia za ukończoną finalizację.

Pełna finalizacja wymaga obu artefaktów oraz zgodnej sumy kontrolnej. Częściowy manifest odtwarza zapisane SHA gałęzi `main` i ćwiczenie wycofania, aby ponownie wygenerować identyczne bajty, a następnie dołącza brakującą sumę kontrolną; nieprawidłowa para lub suma kontrolna bez manifestu nadal blokuje proces. Uruchomienie wyzwolone wypchnięciem bez zmiennych repozytorium dotyczących ćwiczenia wycofania zostaje pominięte bez ukończenia finalizacji; brakujący lub starszy niż 90 dni rekord ćwiczenia nadal blokuje ręczną finalizację opartą na dowodach. Prywatne polecenia odzyskiwania pozostają w podręczniku dostępnym wyłącznie dla opiekunów. Ręcznego uruchomienia używaj wyłącznie do naprawy lub ponownego odtworzenia stabilnej finalizacji opartej na dowodach.

Starszy awaryjny tag korekcyjny może ponownie wykorzystać dowody pakietu bazowego tylko wtedy, gdy tag korekcyjny wskazuje ten sam commit źródłowy co bazowy tag stabilny. Jego wydanie na Androida ponownie wykorzystuje zweryfikowany plik APK tagu bazowego i dodaje pochodzenie tagu korekcyjnego. Korekta z innym źródłem musi opublikować i zweryfikować własne dowody pakietu oraz użyć wyższego `versionCode`.

## Sprawdzenie wstępne wydania

- Uruchom `pnpm check:test-types` przed wstępną weryfikacją wydania, aby typy TypeScript testów pozostawały objęte kontrolą poza szybszą lokalną bramką `pnpm check`.
- Uruchom `pnpm check:architecture` przed wstępną weryfikacją wydania, aby szersze kontrole cykli importów i granic architektury przechodziły pomyślnie poza szybszą lokalną bramką.
- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane artefakty wydania `dist/*` i pakiet Control UI istniały na potrzeby etapu walidacji pakowania.
- Uruchom `pnpm release:prep` po podniesieniu wersji głównego pakietu i przed utworzeniem tagu. Polecenie uruchamia wszystkie deterministyczne generatory wydania, których wyniki często tracą spójność po zmianie wersji, konfiguracji lub API: wersje pluginów, pliki shrinkwrap npm, wykaz pluginów, bazowy schemat konfiguracji, metadane konfiguracji wbudowanych kanałów, bazowy stan dokumentacji konfiguracji, eksporty zestawu SDK pluginów oraz bazowy stan API zestawu SDK pluginów. `pnpm release:check` ponownie uruchamia te zabezpieczenia w trybie kontroli (wraz z kontrolą budżetu powierzchni zestawu SDK pluginów) i zgłasza w jednym przebiegu wszystkie błędy rozbieżności wygenerowanych plików przed uruchomieniem kontroli wydania pakietów.
- Synchronizacja wersji pluginów domyślnie aktualizuje przeznaczony do publikacji pakiet środowiska wykonawczego `@openclaw/ai`, wersje oficjalnych pakietów pluginów oraz istniejące minimalne wersje `openclaw.compat.pluginApi` do wersji wydania OpenClaw. Traktuj to pole jako minimalną wersję API zestawu SDK/środowiska wykonawczego pluginów, a nie tylko kopię wersji pakietu: w przypadku wydań obejmujących wyłącznie pluginy, które celowo zachowują zgodność ze starszymi hostami OpenClaw, pozostaw minimalną wersję na poziomie najstarszego obsługiwanego API hosta i udokumentuj ten wybór w dowodach wydania pluginu.
- Uruchom ręczny przepływ pracy `Full Release Validation` przed zatwierdzeniem wydania, aby z jednego punktu wejścia uruchomić wszystkie przedwydaniowe środowiska testowe. Przyjmuje on gałąź, tag lub pełny SHA commitu, wyzwala ręczny przepływ `CI` oraz wyzwala `OpenClaw Release Checks` dla testów dymnych instalacji, akceptacji pakietu, międzyplatformowych kontroli pakietu, zgodności QA Lab oraz ścieżek Matrix i Telegram. Przebiegi stabilne i pełne zawsze obejmują wyczerpujące testy na żywo/E2E oraz długotrwałe testy ścieżki wydania w Dockerze; `run_release_soak=true` pozostaje dostępne do jawnego długotrwałego testu wersji beta. Package Acceptance zapewnia kanoniczny test E2E Telegram dla pakietu podczas walidacji kandydata, dzięki czemu nie jest potrzebny drugi równoległy mechanizm odpytywania na żywo.

  Podaj `release_package_spec` po opublikowaniu wersji beta, aby ponownie użyć wydanego pakietu npm w kontrolach wydania, Package Acceptance oraz teście E2E Telegram dla pakietu bez ponownego budowania archiwum tar wydania. Podaj `npm_telegram_package_spec` tylko wtedy, gdy Telegram ma używać innego opublikowanego pakietu niż pozostała część walidacji wydania. Podaj `package_acceptance_package_spec`, gdy Package Acceptance ma używać innego opublikowanego pakietu niż określony dla wydania. Podaj `evidence_package_spec`, gdy raport dowodów wydania ma wykazać, że walidacja odpowiada opublikowanemu pakietowi npm, bez wymuszania testu E2E Telegram.

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- Uruchom ręczny przepływ pracy `Package Acceptance`, gdy chcesz uzyskać niezależne dowody dla kandydata na pakiet podczas kontynuowania prac nad wydaniem. Użyj `source=npm` dla `openclaw@beta`, `openclaw@latest` lub dokładnej wersji wydania; `source=ref`, aby spakować zaufaną gałąź, tag lub SHA `package_ref` za pomocą bieżącego środowiska testowego `workflow_ref`; `source=url` dla publicznego archiwum tar dostępnego przez HTTPS, z wymaganym SHA-256 i rygorystycznymi zasadami dotyczącymi publicznych adresów URL; `source=trusted-url` dla nazwanych zasad zaufanego źródła, z wymaganymi `trusted_source_id` i SHA-256; albo `source=artifact` dla archiwum tar przesłanego przez inny przebieg GitHub Actions.

  Przepływ pracy przekształca kandydata w `package-under-test`, ponownie wykorzystuje harmonogram testów E2E wydania w Dockerze dla tego archiwum tar i może uruchamiać kontrolę jakości Telegram dla tego samego archiwum za pomocą `telegram_mode=mock-openai` lub `telegram_mode=live-frontier`. Gdy wybrane ścieżki Dockera obejmują `published-upgrade-survivor`, artefakt pakietu jest kandydatem, a `published_upgrade_survivor_baseline` wskazuje opublikowaną wersję bazową. `update-restart-auth` używa pakietu kandydata zarówno jako zainstalowanego CLI, jak i `package-under-test`, dzięki czemu sprawdza ścieżkę zarządzanego ponownego uruchomienia polecenia aktualizacji kandydata.

  Przykład:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Typowe profile:
  - `smoke`: ścieżki instalacji/kanału/agenta, sieci Gateway oraz przeładowania konfiguracji
  - `package`: natywne dla artefaktu ścieżki pakietu/aktualizacji/ponownego uruchomienia/pluginów bez OpenWebUI ani działającego ClawHub
  - `product`: profil pakietu rozszerzony o kanały MCP, porządkowanie Cron/podagentów, wyszukiwanie internetowe OpenAI oraz OpenWebUI
  - `full`: fragmenty ścieżki wydania w Dockerze z OpenWebUI
  - `custom`: dokładny wybór `docker_lanes` do ukierunkowanego ponownego przebiegu

- Uruchom ręczny przepływ pracy `CI` bezpośrednio, gdy potrzebujesz jedynie deterministycznego pokrycia standardowego CI dla kandydata do wydania. Ręcznie wyzwolone przebiegi CI pomijają ograniczanie zakresu według zmian i wymuszają fragmenty Linux Node, fragmenty wbudowanych pluginów, fragmenty kontraktów pluginów i kanałów, zgodność z Node 22, kontrole `check-*` i `check-additional-*`, testy dymne zbudowanych artefaktów, kontrole dokumentacji, Skills w Pythonie, Windows, macOS oraz ścieżki internacjonalizacji Control UI. Samodzielny ręczny przebieg CI uruchamia Androida tylko po wyzwoleniu z `include_android=true`; `Full Release Validation` przekazuje tę wartość wejściową podrzędnemu przebiegowi CI.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Uruchom `pnpm qa:otel:smoke` podczas walidacji telemetrii wydania. Polecenie sprawdza QA Lab za pośrednictwem lokalnego odbiornika OTLP/HTTP i weryfikuje eksport śladów, metryk i dzienników, a także ograniczone atrybuty śladów oraz redagowanie treści i identyfikatorów bez wymagania Opik, Langfuse ani innego zewnętrznego kolektora.
- Uruchom `pnpm qa:otel:collector-smoke` podczas walidacji zgodności z kolektorem. Polecenie kieruje ten sam eksport OTLP z QA Lab przez rzeczywisty kontener Docker OpenTelemetry Collector przed wykonaniem asercji lokalnego odbiornika.
- Uruchom `pnpm qa:prometheus:smoke` podczas walidacji chronionego pobierania danych przez Prometheus. Polecenie sprawdza QA Lab, odrzuca nieuwierzytelnione pobieranie danych i weryfikuje, że rodziny metryk kluczowe dla wydania nie zawierają treści promptów, surowych identyfikatorów, tokenów uwierzytelniających ani ścieżek lokalnych.
- Uruchom `pnpm qa:observability:smoke`, aby kolejno wykonać ścieżki testów dymnych OpenTelemetry i Prometheus dla kopii roboczej kodu źródłowego.
- Uruchom `pnpm release:check` przed każdym wydaniem oznaczonym tagiem.
- Wstępna weryfikacja `OpenClaw NPM Release` generuje dowody dotyczące zależności wydania przed spakowaniem archiwum tar npm. Bramka luk w zabezpieczeniach z ostrzeżeń npm blokuje wydanie. Ryzyko manifestu zależności przechodnich, powierzchnia własności/instalacji zależności oraz raporty zmian zależności służą wyłącznie jako dowody wydania. Raport zmian zależności porównuje kandydata do wydania z poprzednim osiągalnym tagiem wydania. Wstępna weryfikacja przesyła dowody zależności jako `openclaw-release-dependency-evidence-<tag>`, a także osadza je w katalogu `dependency-evidence/` wewnątrz przygotowanego artefaktu wstępnej weryfikacji npm. Właściwa ścieżka publikacji ponownie wykorzystuje ten artefakt wstępnej weryfikacji, a następnie dołącza te same dowody do wydania GitHub jako `openclaw-<version>-dependency-evidence.zip`.
- Uruchom `OpenClaw Release Publish`, aby wykonać sekwencję publikacji wprowadzającą zmiany po utworzeniu tagu. Wyzwalaj standardowe publikacje beta i stabilne z zaufanej gałęzi `main`; tag wydania nadal wskazuje dokładny docelowy commit i może wskazywać na `release/YYYY.M.PATCH`. Publikacje alfa Tideclaw pozostają na odpowiadającej im gałęzi alfa. Przekaż zakończony powodzeniem `preflight_run_id` npm OpenClaw, zakończony powodzeniem `full_release_validation_run_id` oraz dokładny `full_release_validation_run_attempt`, a domyślny zakres publikacji pluginów pozostaw jako `all-publishable`, chyba że celowo wykonujesz ukierunkowaną naprawę. Przepływ pracy wykonuje kolejno publikację pluginów npm, publikację pluginów w ClawHub oraz publikację npm OpenClaw, aby główny pakiet nie został opublikowany przed swoimi wydzielonymi pluginami; promocja dla Windows i Androida działa równolegle z publikacją głównego pakietu npm względem roboczej strony wydania. Ponowne przebiegi publikacji można wznawiać: jeśli główna wersja npm została już opublikowana, przepływ pomija wyzwolenie publikacji głównego pakietu po wykazaniu, że archiwum tar w rejestrze odpowiada artefaktowi wstępnej weryfikacji dla tagu, a promocja dla Windows/Androida jest pomijana, gdy wydanie zawiera już zweryfikowany kontrakt artefaktów, dzięki czemu ponowna próba wykonuje tylko etapy zakończone niepowodzeniem. Ukierunkowane naprawy obejmujące wyłącznie pluginy wymagają `plugin_publish_scope=selected` oraz niepustej listy pluginów. Przebiegi `all-publishable` obejmujące wyłącznie pluginy wymagają kompletnych, niezmiennych dowodów wstępnej weryfikacji i Full Release Validation; częściowe dowody są odrzucane.
- Stabilny przebieg `OpenClaw Release Publish` wymaga dokładnego `windows_node_tag` po utworzeniu odpowiadającego mu wydania `openclaw/openclaw-windows-node`, które nie jest wersją wstępną, oraz zatwierdzonej dla kandydata mapy `windows_node_installer_digests`. Przed wyzwoleniem jakiegokolwiek podrzędnego procesu publikacji sprawdza, czy wydanie źródłowe jest opublikowane, nie jest wersją wstępną, zawiera wymagane instalatory x64/ARM64 i nadal odpowiada zatwierdzonej mapie. Następnie wyzwala `Windows Node Release`, gdy wydanie OpenClaw jest jeszcze wersją roboczą, przekazując przypiętą mapę skrótów instalatorów bez zmian. Podrzędny przepływ pracy pobiera podpisane instalatory Windows Hub z dokładnie tego tagu, porównuje je z przypiętymi skrótami, sprawdza na maszynie wykonawczej Windows, czy ich podpisy Authenticode używają oczekiwanego podmiotu podpisującego OpenClaw Foundation, zapisuje manifest SHA-256 i przesyła instalatory wraz z manifestem do kanonicznego wydania OpenClaw w GitHub, po czym ponownie pobiera promowane artefakty i weryfikuje ich obecność w manifeście oraz skróty. Proces nadrzędny weryfikuje bieżący kontrakt artefaktów x64, ARM64 i sum kontrolnych przed publikacją. Bezpośrednie odzyskiwanie odrzuca nieoczekiwane nazwy artefaktów `OpenClawCompanion-*` przed zastąpieniem oczekiwanych artefaktów kontraktu przypiętymi bajtami źródłowymi.

  Ręcznie wyzwalaj `Windows Node Release` wyłącznie w celu odzyskiwania i zawsze przekazuj dokładny tag — nigdy `latest` — wraz z jawną mapą JSON `expected_installer_digests` z zatwierdzonego wydania źródłowego. Odnośniki pobierania w witrynie powinny wskazywać dokładne adresy URL artefaktów bieżącego stabilnego wydania OpenClaw albo `releases/latest/download/...` dopiero po sprawdzeniu, że przekierowanie GitHub do najnowszego wydania wskazuje to samo wydanie; nie zamieszczaj odnośnika wyłącznie do strony wydania repozytorium aplikacji towarzyszącej.

- Kontrole wydania są teraz uruchamiane w osobnym ręcznym przepływie pracy: `OpenClaw Release Checks`. Przed zatwierdzeniem wydania uruchamia on również ścieżkę zgodności atrap QA Lab, szybki profil rzeczywistego środowiska Matrix oraz ścieżkę QA Telegram. Ścieżki rzeczywistego środowiska używają środowiska `qa-live-shared`; Telegram używa także dzierżaw poświadczeń Convex CI. Uruchom ręczny przepływ pracy `QA-Lab - All Lanes` z `matrix_profile=all` i `matrix_shards=true`, gdy chcesz równolegle przetestować pełny zestaw transportu Matrix, multimediów i E2EE.
- Międzyplatformowa walidacja instalacji i aktualizacji w czasie działania jest częścią publicznych przepływów `OpenClaw Release Checks` i `Full Release Validation`, które bezpośrednio wywołują przepływ wielokrotnego użytku `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`. Ten podział jest celowy: rzeczywista ścieżka wydania npm pozostaje krótka, deterministyczna i skoncentrowana na artefaktach, natomiast wolniejsze kontrole w rzeczywistym środowisku pozostają we własnej ścieżce, dzięki czemu nie wstrzymują ani nie blokują publikacji.
- Kontrole wydania korzystające z sekretów należy uruchamiać za pośrednictwem `Full Release Validation` albo z referencji przepływu pracy `main`/wydania, aby logika przepływu pracy i sekrety pozostawały pod kontrolą.
- `OpenClaw Release Checks` przyjmuje gałąź, tag lub pełny SHA commitu, o ile rozpoznany commit jest osiągalny z gałęzi OpenClaw albo tagu wydania.
- Przebieg wstępny `OpenClaw NPM Release` służący tylko do walidacji również przyjmuje bieżący, pełny, 40-znakowy SHA commitu gałęzi przepływu pracy bez wymagania wypchniętego tagu. Ta ścieżka SHA służy wyłącznie do walidacji i nie może zostać przekształcona w rzeczywistą publikację. W trybie SHA przepływ pracy tworzy `v<package.json version>` tylko na potrzeby kontroli metadanych pakietu; rzeczywista publikacja nadal wymaga rzeczywistego tagu wydania.
- Oba przepływy pracy utrzymują rzeczywistą ścieżkę publikacji i promocji na runnerach hostowanych przez GitHub, natomiast niemodyfikująca ścieżka walidacji może używać większych runnerów Blacksmith Linux.
- Ten przepływ pracy uruchamia `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`, używając sekretów przepływu pracy `OPENAI_API_KEY` i `ANTHROPIC_API_KEY`.
- Przebieg wstępny wydania npm nie czeka już na osobną ścieżkę kontroli wydania.
- Przed lokalnym otagowaniem kandydata do wydania uruchom `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. Narzędzie pomocnicze uruchamia szybkie zabezpieczenia wydania, kontrole wydań npm/ClawHub pluginów, kompilację, kompilację interfejsu użytkownika oraz `release:openclaw:npm:check` w kolejności pozwalającej wykryć typowe błędy blokujące zatwierdzenie, zanim rozpocznie się przepływ publikacji GitHub.
- Przed zatwierdzeniem uruchom `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (lub odpowiedni tag wydania wstępnego/korekty).
- Po publikacji npm uruchom `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (lub odpowiednią wersję beta/korekty), aby zweryfikować ścieżkę instalacji opublikowanego pakietu z rejestru w świeżym prefiksie tymczasowym.
- Po publikacji wersji beta uruchom `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`, aby zweryfikować wdrożenie zainstalowanego pakietu, konfigurację Telegram oraz rzeczywiste E2E Telegram względem opublikowanego pakietu npm, używając współdzielonej puli dzierżawionych poświadczeń Telegram. W jednorazowych lokalnych uruchomieniach opiekunowie mogą pominąć zmienne Convex i przekazać bezpośrednio trzy poświadczenia środowiskowe `OPENCLAW_QA_TELEGRAM_*`.
- Aby uruchomić pełny test dymny wersji beta po publikacji z komputera opiekuna, użyj `pnpm release:beta-smoke -- --beta betaN`. Narzędzie pomocnicze uruchamia walidację aktualizacji npm i świeżego środowiska docelowego w Parallels, wywołuje `NPM Telegram Beta E2E`, odpytuje dokładny przebieg przepływu pracy, pobiera artefakt i wyświetla raport Telegram.
- Opiekunowie mogą uruchomić tę samą kontrolę po publikacji z GitHub Actions za pomocą ręcznego przepływu pracy `NPM Telegram Beta E2E`. Jest on celowo wyłącznie ręczny i nie jest uruchamiany po każdym scaleniu.
- Automatyzacja wydań dla opiekunów stosuje model przebieg wstępny, a następnie promocja:
  - Rzeczywista publikacja npm wymaga pomyślnego `preflight_run_id` npm.
  - Standardowa orkiestracja i przebieg wstępny publikacji wersji beta oraz stabilnej używają zaufanej gałęzi `main` względem dokładnego tagu docelowego. Publikacja i przebieg wstępny wersji alfa Tideclaw używają odpowiedniej gałęzi alfa.
  - Stabilne wydania npm domyślnie używają `beta`; publikacja stabilnej wersji npm może jawnie wskazać `latest` za pomocą danych wejściowych przepływu pracy.
  - Modyfikacja dist-tagów npm oparta na tokenie znajduje się w `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, ponieważ `npm dist-tag add` nadal wymaga `NPM_TOKEN`, podczas gdy repozytorium źródłowe zachowuje publikację wyłącznie przez OIDC.
  - Publiczny `macOS Release` służy wyłącznie do walidacji; gdy tag istnieje tylko na gałęzi wydania, ale przepływ pracy jest uruchamiany z `main`, ustaw `public_release_branch=release/YYYY.M.PATCH`.
  - Rzeczywista publikacja macOS wymaga pomyślnych `preflight_run_id` i `validate_run_id` macOS.
  - Rzeczywiste ścieżki publikacji promują przygotowane artefakty zamiast ponownie je kompilować.
- W przypadku stabilnych wydań korygujących, takich jak `YYYY.M.PATCH-N`, weryfikator po publikacji sprawdza również tę samą ścieżkę aktualizacji w prefiksie tymczasowym z `YYYY.M.PATCH` do `YYYY.M.PATCH-N`, aby korekty wydania nie pozostawiały po cichu starszych instalacji globalnych z bazową stabilną zawartością.
- Przebieg wstępny wydania npm kończy się niepowodzeniem w razie braku jednoznacznego potwierdzenia, chyba że archiwum tar zawiera zarówno `dist/control-ui/index.html`, jak i niepustą zawartość `dist/control-ui/assets/`, aby ponownie nie opublikować pustego panelu przeglądarkowego.
- Walidacja po publikacji sprawdza również obecność punktów wejścia opublikowanych pluginów oraz metadanych pakietu w układzie instalacji z rejestru. Wydanie bez wymaganej zawartości środowiska wykonawczego pluginów nie przechodzi weryfikatora po publikacji i nie może zostać promowane do `latest`.
- `pnpm test:install:smoke` wymusza także budżet `unpackedSize` paczki npm dla kandydującego archiwum aktualizacji, dzięki czemu instalacyjne E2E wykrywa przypadkowy wzrost rozmiaru paczki przed ścieżką publikacji wydania.
- Jeśli prace nad wydaniem obejmowały planowanie CI, manifesty czasów wykonania rozszerzeń lub macierze testów rozszerzeń, przed zatwierdzeniem ponownie wygeneruj i przejrzyj zarządzane przez planer wyniki macierzy `plugin-prerelease-extension-shard` z `.github/workflows/plugin-prerelease.yml`, aby informacje o wydaniu nie opisywały nieaktualnego układu CI.
- Gotowość stabilnego wydania macOS obejmuje również mechanizmy aktualizacji: wydanie GitHub musi ostatecznie zawierać spakowane pliki `.zip`, `.dmg` i `.dSYM.zip`; plik `appcast.xml` na `main` musi po publikacji wskazywać nowy stabilny plik zip (przepływ publikacji macOS zatwierdza go automatycznie albo otwiera PR appcastu, gdy bezpośrednie wypchnięcie jest zablokowane); spakowana aplikacja musi zachować identyfikator pakietu inny niż debugowy, niepusty adres URL kanału Sparkle oraz `CFBundleVersion` równy lub wyższy od kanonicznej minimalnej wersji kompilacji Sparkle dla tej wersji wydania.

## Środowiska testowe wydania

`Full Release Validation` umożliwia operatorom uruchomienie wszystkich testów przedwydaniowych z jednego punktu wejścia. Aby uzyskać dowód dla przypiętego commitu na szybko zmieniającej się gałęzi, użyj narzędzia pomocniczego, dzięki czemu każdy podrzędny przepływ pracy zostanie uruchomiony z gałęzi tymczasowej przypiętej do jednego zaufanego SHA przepływu pracy `main`, podczas gdy żądany commit pozostanie testowanym kandydatem:

```bash
pnpm ci:full-release --sha <full-sha>
```

Narzędzie pomocnicze pobiera bieżący `origin/main`, wypycha `release-ci/<workflow-sha>-...` wskazujący ten zaufany commit przepływu pracy, uruchamia `Full Release Validation` z gałęzi tymczasowej z `ref=<target-sha>`, ponownie wykorzystuje rygorystyczne dowody dla dokładnego celu, jeśli są dostępne, weryfikuje, czy `headSha` każdego podrzędnego przepływu pracy odpowiada przypiętemu SHA nadrzędnego przepływu pracy, a następnie usuwa gałąź tymczasową. Przekaż `-f reuse_evidence=false`, aby wymusić świeże uruchomienie, albo `--workflow-sha <trusted-main-sha>`, aby przypiąć starszy commit, który nadal jest osiągalny z bieżącego `origin/main`. Sam przepływ pracy nigdy nie zapisuje referencji repozytorium. Dzięki temu narzędzia wydania dostępne tylko na `main` pozostają dostępne bez dodawania commitów narzędziowych do kandydata i bez ryzyka przypadkowego potwierdzenia nowszego podrzędnego przebiegu z `main`.

W celu walidacji gałęzi lub tagu wydania uruchom ją z zaufanej referencji przepływu pracy `main` i przekaż gałąź albo tag wydania jako `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

Przepływ pracy rozpoznaje docelową referencję, uruchamia ręczny `CI` z `target_ref=<release-ref>`, a następnie uruchamia `OpenClaw Release Checks`. `OpenClaw Release Checks` rozdziela zadania na test dymny instalacji, międzyplatformowe kontrole wydania, pokrycie ścieżki wydania w rzeczywistym środowisku/E2E Docker po włączeniu testu długotrwałego, akceptację pakietu z kanonicznym E2E pakietu Telegram, zgodność QA Lab, rzeczywisty Matrix i rzeczywisty Telegram. Pełny przebieg obejmujący wszystkie elementy jest akceptowalny tylko wtedy, gdy podsumowanie `Full Release Validation` wskazuje powodzenie `normal_ci`, `plugin_prerelease` i `release_checks`, chyba że ukierunkowane ponowne uruchomienie celowo pominęło osobny podrzędny przepływ `Plugin Prerelease`. Samodzielnego podrzędnego przepływu `npm-telegram` używaj wyłącznie do ukierunkowanego ponownego uruchomienia dla opublikowanego pakietu z `release_package_spec` lub `npm_telegram_package_spec`. Końcowe podsumowanie weryfikatora zawiera tabele najwolniejszych zadań dla każdego podrzędnego przebiegu, dzięki czemu kierownik wydania może zobaczyć bieżącą ścieżkę krytyczną bez pobierania dzienników.

Podrzędny przepływ wydajności produktu w tej ścieżce wydania generuje wyłącznie artefakty. Nadrzędny przepływ uruchamia go z `publish_reports=false`, a walidacja zostaje odrzucona, jeśli zabezpieczenie trybu wyłącznie artefaktowego nie potwierdzi, że publikator raportów Clawgrit pozostał pominięty.

Pełną macierz etapów, dokładne nazwy zadań przepływu pracy, różnice między profilem stabilnym a pełnym, artefakty oraz parametry ukierunkowanego ponownego uruchamiania opisano w dokumencie [Pełna walidacja wydania](/pl/reference/full-release-validation).

Podrzędne przepływy pracy są uruchamiane z zaufanej referencji wykonującej `Full Release Validation`, zwykle `--ref main`, nawet gdy docelowe `ref` wskazuje starszą gałąź lub tag wydania. Każdy podrzędny przebieg musi używać dokładnego SHA nadrzędnego przepływu pracy; jeśli `main` zmieni się przed rozpoznaniem uruchomienia podrzędnego przepływu, nadrzędny przepływ kończy się niepowodzeniem w razie braku jednoznacznego potwierdzenia. Nie istnieje osobne wejście referencji przepływu pracy Full Release Validation; zaufany mechanizm wybiera się przez wskazanie referencji uruchomienia przepływu pracy. Nie używaj `--ref main -f ref=<sha>` do uzyskania dowodu dokładnego commitu na zmieniającej się gałęzi `main`; nieprzetworzone SHA commitów nie mogą być referencjami uruchomienia przepływu pracy, dlatego użyj `pnpm ci:full-release --sha <target-sha>`, aby utworzyć gałąź tymczasową na zaufanym `origin/main`, zachowując docelowy SHA jako dane wejściowe kandydata.

Użyj `release_profile`, aby wybrać zakres rzeczywistego środowiska/dostawców:

- `minimum`: najszybsza, krytyczna dla wydania ścieżka OpenAI/podstawowa w rzeczywistym środowisku i Docker
- `stable`: profil minimalny oraz stabilne pokrycie dostawców/zaplecza wymagane do zatwierdzenia wydania
- `full`: profil stabilny oraz szerokie, pomocnicze pokrycie dostawców/multimediów

Walidacja stabilna i pełna zawsze uruchamia przed promocją wyczerpujący zestaw testów rzeczywistego środowiska/E2E, ścieżki wydania Docker oraz ograniczony przegląd zachowania opublikowanych aktualizacji. Ustaw `run_release_soak=true`, aby zażądać tego samego zestawu dla wersji beta. Zestaw obejmuje cztery najnowsze stabilne pakiety, przypięte wersje bazowe `2026.4.23` i `2026.5.2` oraz starszą wersję `2026.4.15`; zduplikowane wersje bazowe są usuwane, a każda wersja bazowa trafia do osobnego zadania runnera Docker.

`OpenClaw Release Checks` używa zaufanej referencji przepływu pracy, aby jednokrotnie rozpoznać referencję docelową jako `release-package-under-test`, i ponownie wykorzystuje ten artefakt w kontrolach międzyplatformowych, akceptacji pakietu oraz kontrolach ścieżki wydania Docker podczas testu długotrwałego. Dzięki temu wszystkie środowiska używające pakietu działają na tych samych bajtach i unikają wielokrotnego kompilowania pakietu. Gdy wersja beta jest już dostępna w npm, ustaw `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`, aby kontrole wydania jednokrotnie pobrały opublikowany pakiet, wyodrębniły SHA źródła kompilacji z `dist/build-info.json` i ponownie wykorzystały ten artefakt w kontrolach międzyplatformowych, akceptacji pakietu, Dockerowej ścieżce wydania oraz ścieżkach pakietu Telegram.

Międzyplatformowy test dymny instalacji OpenAI używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy ustawiona jest zmienna repozytorium/organizacji; w przeciwnym razie używa `openai/gpt-5.6-luna`, ponieważ ta ścieżka potwierdza instalację pakietu, wdrożenie, uruchomienie Gateway i jeden rzeczywisty przebieg agenta, a nie porównuje wydajności najbardziej zaawansowanego modelu. Szersza macierz dostawców rzeczywistego środowiska pozostaje miejscem pokrycia właściwego dla poszczególnych modeli.

W zależności od etapu wydania użyj następujących wariantów:

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

Nie używaj pełnego nadrzędnego przepływu jako pierwszego ponownego uruchomienia po ukierunkowanej poprawce. Jeśli jeden obszar zawiedzie, do następnej weryfikacji użyj zakończonego niepowodzeniem podrzędnego przepływu pracy, zadania, ścieżki Docker, profilu pakietu, dostawcy modelu lub ścieżki QA. Uruchom ponownie pełny nadrzędny przepływ tylko wtedy, gdy poprawka zmieniła współdzieloną orkiestrację wydania lub zdezaktualizowała wcześniejsze dowody ze wszystkich obszarów. Końcowy weryfikator nadrzędnego przepływu ponownie sprawdza zapisane identyfikatory uruchomień podrzędnych przepływów pracy, dlatego po pomyślnym ponownym uruchomieniu podrzędnego przepływu pracy uruchom ponownie tylko zakończone niepowodzeniem zadanie nadrzędne `Verify full validation`.

`rerun_group=all` może ponownie wykorzystać wcześniejsze zakończone powodzeniem uruchomienie nadrzędnego przepływu tylko wtedy, gdy zweryfikowało dokładnie ten sam docelowy SHA, profil wydania, efektywne ustawienie testów długotrwałych i dane wejściowe walidacji. Jest to ograniczony mechanizm odzyskiwania na potrzeby ponownego uruchomienia tego samego kandydata, a nie ponowne wykorzystywanie dowodów między różnymi SHA. W przypadku zmienionego kandydata, w tym commitu zmieniającego wyłącznie dziennik zmian lub wersję, uruchom ponownie każdą bramkę pakietu, artefaktu, instalacji, Docker lub dostawcy, na którą wpływają zmienione ścieżki lub skróty artefaktów. Nowsze uruchomienia nadrzędnego przepływu dla tego samego odwołania `release/*` i tej samej grupy ponownego uruchomienia automatycznie zastępują trwające uruchomienia. Przekaż `reuse_evidence=false`, aby wymusić nowe pełne uruchomienie.

W celu ograniczonego odzyskiwania przekaż `rerun_group` do nadrzędnego przepływu. `all` jest właściwym uruchomieniem kandydata do wydania, `ci` uruchamia tylko standardowy podrzędny przepływ CI, `plugin-prerelease` uruchamia tylko podrzędny przepływ Plugin przeznaczony wyłącznie dla wydania, `release-checks` uruchamia wszystkie obszary wydania, a węższe grupy wydania to `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` i `npm-telegram`. Ukierunkowane ponowne uruchomienia `npm-telegram` wymagają `release_package_spec` lub `npm_telegram_package_spec`; uruchomienia pełne lub `all` korzystają z kanonicznego testu E2E Telegram pakietu w ramach Package Acceptance. Ukierunkowane ponowne uruchomienia między systemami operacyjnymi mogą dodać `cross_os_suite_filter=windows/packaged-upgrade` lub inny filtr systemu operacyjnego albo zestawu. Niepowodzenia kontroli wydania QA blokują standardową walidację wydania, w tym wymagane wykrywanie rozbieżności dynamicznych narzędzi OpenClaw na poziomie standardowym. Uruchomienia alfa Tideclaw mogą nadal traktować ścieżki kontroli wydania niezwiązane z bezpieczeństwem pakietu jako doradcze. Przy `release_profile=beta` zestawy z rzeczywistymi dostawcami w `Run repo/live E2E validation` są doradcze (ostrzeżenia, a nie blokady); profile stabilny i pełny nadal traktują je jako blokujące. Gdy `live_suite_filter` jawnie żąda kontrolowanej bramką ścieżki QA na żywo, takiej jak Discord, WhatsApp lub Slack, odpowiednia zmienna repozytorium `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` musi być włączona; w przeciwnym razie przechwytywanie danych wejściowych kończy się niepowodzeniem zamiast po cichu pomijać ścieżkę.

### Vitest

Obszar Vitest jest ręcznym podrzędnym przepływem pracy `CI`. Ręczne CI celowo pomija ograniczanie zakresu na podstawie zmian i wymusza standardowy graf testów dla kandydata do wydania: fragmenty Linux Node, fragmenty dołączonych Pluginów, fragmenty kontraktów Pluginów i kanałów, zgodność z Node 22, `check-*`, `check-additional-*`, testy dymne zbudowanych artefaktów, kontrole dokumentacji, Skills w Pythonie, Windows, macOS oraz internacjonalizację Control UI. Android jest uwzględniany, gdy `Full Release Validation` uruchamia ten obszar, ponieważ nadrzędny przepływ przekazuje `include_android=true`; samodzielne ręczne CI wymaga `include_android=true`, aby objąć Androida.

Używaj tego obszaru, aby odpowiedzieć na pytanie „czy drzewo źródłowe przeszło pełny standardowy zestaw testów?”. Nie jest to to samo co walidacja produktu w ścieżce wydania. Dowody, które należy zachować:

- podsumowanie `Full Release Validation` pokazujące adres URL uruchomionego przepływu `CI`
- zakończone powodzeniem uruchomienie `CI` dla dokładnego docelowego SHA
- nazwy zakończonych niepowodzeniem lub powolnych fragmentów z zadań CI podczas badania regresji
- artefakty czasów wykonania Vitest, takie jak `.artifacts/vitest-shard-timings.json`, gdy uruchomienie wymaga analizy wydajności

Uruchamiaj ręczne CI bezpośrednio tylko wtedy, gdy wydanie wymaga deterministycznego standardowego CI, ale nie obszarów Docker, QA Lab, testów na żywo, między systemami operacyjnymi ani pakietu. Użyj pierwszego polecenia dla bezpośredniego CI bez Androida. Dodaj `include_android=true`, gdy bezpośrednie CI kandydata do wydania musi obejmować Androida:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Obszar Docker znajduje się w `OpenClaw Release Checks` za pośrednictwem `openclaw-live-and-e2e-checks-reusable.yml`, wraz z przepływem pracy `install-smoke` w trybie wydania. Weryfikuje kandydata do wydania w spakowanych środowiskach Docker, a nie wyłącznie za pomocą testów na poziomie źródeł.

Zakres Docker dla wydania obejmuje:

- pełny test dymny instalacji z włączonym powolnym testem dymnym globalnej instalacji Bun
- przygotowanie lub ponowne wykorzystanie obrazu testu dymnego głównego Dockerfile według docelowego SHA, z zadaniami testów dymnych QR, root/Gateway oraz instalatora/Bun uruchamianymi jako osobne fragmenty `install-smoke`
- ścieżki E2E repozytorium
- fragmenty Docker ścieżki wydania: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, od `plugins-runtime-install-a` do `plugins-runtime-install-h` oraz `openwebui`
- zakres OpenWebUI na dedykowanym runnerze z dużą przestrzenią dyskową, gdy jest wymagany
- podzielone ścieżki instalacji i odinstalowania dołączonych Pluginów od `bundled-plugin-install-uninstall-0` do `bundled-plugin-install-uninstall-23`
- zestawy z rzeczywistymi dostawcami/E2E oraz zakres modeli na żywo w Docker, gdy kontrole wydania obejmują zestawy na żywo

Przed ponownym uruchomieniem użyj artefaktów Docker. Harmonogram ścieżki wydania przesyła `.artifacts/docker-tests/` z dziennikami ścieżek, `summary.json`, `failures.json`, czasami faz, planem harmonogramu w formacie JSON i poleceniami ponownego uruchomienia. W celu ukierunkowanego odzyskiwania użyj `docker_lanes=<lane[,lane]>` w wielokrotnego użytku przepływie pracy testów na żywo/E2E zamiast ponownie uruchamiać wszystkie fragmenty wydania. Wygenerowane polecenia ponownego uruchomienia zawierają wcześniejszy `package_artifact_run_id` i przygotowane dane wejściowe obrazu Docker, jeśli są dostępne, dzięki czemu zakończona niepowodzeniem ścieżka może ponownie wykorzystać ten sam plik tarball i obrazy GHCR.

### QA Lab

Obszar QA Lab jest również częścią `OpenClaw Release Checks`. Jest to bramka wydania dla zachowań agentowych i poziomu kanałów, oddzielna od mechaniki pakietów Vitest i Docker.

Zakres QA Lab dla wydania obejmuje:

- ścieżkę parytetu pozorowanego porównującą ścieżkę kandydata OpenAI z poziomem bazowym `anthropic/claude-opus-4-8` przy użyciu pakietu parytetu agentowego
- szybki profil QA Matrix na żywo korzystający ze środowiska `qa-live-shared`
- ścieżkę QA Telegram na żywo korzystającą z dzierżaw poświadczeń Convex CI
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` lub `pnpm qa:observability:smoke`, gdy telemetria wydania wymaga jawnego lokalnego dowodu

Używaj tego obszaru, aby odpowiedzieć na pytanie „czy wydanie zachowuje się poprawnie w scenariuszach QA i przepływach kanałów na żywo?”. Podczas zatwierdzania wydania zachowaj adresy URL artefaktów dla ścieżek parytetu, Matrix i Telegram. Pełny zakres Matrix pozostaje dostępny jako ręczne, podzielone na fragmenty uruchomienie QA Lab zamiast domyślnej ścieżki krytycznej dla wydania.

### Pakiet

Obszar pakietu jest bramką produktu możliwego do zainstalowania. Jest obsługiwany przez `Package Acceptance` i resolver `scripts/resolve-openclaw-package-candidate.mjs`. Resolver normalizuje kandydata do pliku tarball `package-under-test` używanego przez Docker E2E, weryfikuje zawartość pakietu, zapisuje wersję pakietu i SHA-256 oraz utrzymuje odwołanie uprzęży przepływu pracy oddzielnie od odwołania źródła pakietu.

Obsługiwane źródła kandydatów:

- `source=npm`: `openclaw@beta`, `openclaw@latest` lub dokładna wersja wydania OpenClaw
- `source=ref`: spakowanie zaufanej gałęzi `package_ref`, tagu lub pełnego SHA commitu przy użyciu wybranej uprzęży `workflow_ref`
- `source=url`: pobranie publicznego pliku HTTPS `.tgz` z wymaganym `package_sha256`; poświadczenia w adresie URL, niestandardowe porty HTTPS, prywatne, wewnętrzne lub specjalnego przeznaczenia nazwy hostów albo rozpoznane adresy oraz niebezpieczne przekierowania są odrzucane
- `source=trusted-url`: pobranie pliku HTTPS `.tgz` z wymaganymi `package_sha256` i `trusted_source_id` z nazwanej polityki w `.github/package-trusted-sources.json`; używaj tego dla należących do opiekunów firmowych serwerów lustrzanych lub prywatnych repozytoriów pakietów zamiast dodawać na poziomie danych wejściowych obejście sieci prywatnej do `source=url`
- `source=artifact`: ponowne użycie pliku `.tgz` przesłanego przez inne uruchomienie GitHub Actions

`OpenClaw Release Checks` uruchamia Package Acceptance z `source=artifact`, przygotowanym artefaktem pakietu wydania, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. Package Acceptance zachowuje migrację, aktualizację, aktualizację VPS zarządzanego przez użytkownika root, ponowne uruchomienie po aktualizacji ze skonfigurowanym uwierzytelnianiem, instalację Skills z aktywnego ClawHub, czyszczenie nieaktualnych zależności Pluginów, działające offline dane testowe Pluginów, aktualizację Pluginów, zabezpieczenie przed ucieczką z powiązania polecenia Pluginu oraz QA pakietu Telegram względem tego samego rozpoznanego pliku tarball. Blokujące kontrole wydania używają domyślnie najnowszego opublikowanego pakietu jako poziomu bazowego; profil beta z `run_release_soak=true`, `release_profile=stable` lub `release_profile=full` rozszerza przegląd `published-upgrade-survivor` o `last-stable-4` oraz przypięte poziomy bazowe `2026.4.23`, `2026.5.2` i `2026.4.15` ze scenariuszami `reported-issues`. Użyj Package Acceptance z `source=npm` dla już wydanego kandydata, `source=ref` dla lokalnego pliku tarball npm opartego na SHA przed publikacją, `source=trusted-url` dla należącego do opiekunów firmowego lub prywatnego serwera lustrzanego albo `source=artifact` dla przygotowanego pliku tarball przesłanego przez inne uruchomienie GitHub Actions.

Jest to natywny dla GitHub zamiennik większości zakresu pakietów i aktualizacji, który wcześniej wymagał Parallels. Kontrole wydania między systemami operacyjnymi nadal mają znaczenie dla wdrażania, instalatora i zachowań specyficznych dla platformy, ale walidacja produktu dotycząca pakietów i aktualizacji powinna preferować Package Acceptance.

Kanoniczną listą kontrolną walidacji aktualizacji i Pluginów jest [Testowanie aktualizacji i Pluginów](/pl/help/testing-updates-plugins). Użyj jej podczas wybierania, która lokalna ścieżka, ścieżka Docker, Package Acceptance lub kontrola wydania potwierdza instalację albo aktualizację Pluginu, czyszczenie przez doctor lub zmianę migracji opublikowanego pakietu. Wyczerpująca migracja aktualizacji opublikowanych pakietów z każdej stabilnej wersji `2026.4.23+` jest osobnym ręcznym przepływem pracy `Update Migration`, a nie częścią Full Release CI.

Tolerancja starszych wersji Package Acceptance jest celowo ograniczona czasowo. Pakiety do wersji `2026.4.25` włącznie mogą używać ścieżki zgodności dla braków metadanych już opublikowanych w npm: prywatnych wpisów zawartości QA brakujących w pliku tarball, braku `gateway install --wrapper`, braku plików poprawek w danych testowych git utworzonych z pliku tarball, braku utrwalonego `update.channel`, starszych lokalizacji rekordów instalacji Pluginów, braku utrwalania rekordów instalacji z marketplace oraz migracji metadanych konfiguracji podczas `plugins update`. Opublikowany pakiet `2026.4.26` może ostrzegać o lokalnych plikach znaczników metadanych kompilacji, które zostały już wydane. Późniejsze pakiety muszą spełniać współczesne kontrakty pakietów; te same braki powodują niepowodzenie walidacji wydania.

Używaj szerszych profili Package Acceptance, gdy pytanie dotyczące wydania odnosi się do rzeczywistego pakietu możliwego do zainstalowania:

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

- `smoke`: szybkie ścieżki instalacji pakietu/kanału/agenta, sieci Gateway oraz ponownego wczytania konfiguracji
- `package`: kontrakty instalacji/aktualizacji/ponownego uruchomienia/pakietów Pluginów oraz dowód instalacji Skills na żywo z ClawHub; jest to domyślna opcja kontroli wydania
- `product`: `package` oraz kanały MCP, czyszczenie cron/podagentów, wyszukiwanie w sieci OpenAI i OpenWebUI
- `full`: fragmenty ścieżki wydania Docker z OpenWebUI
- `custom`: dokładna lista `docker_lanes` do ukierunkowanych ponownych uruchomień

Aby uzyskać dowód Telegram dla kandydata pakietu, włącz `telegram_mode=mock-openai` lub `telegram_mode=live-frontier` w Package Acceptance. Przepływ pracy przekazuje rozwiązany plik tar pakietu `package-under-test` do ścieżki Telegram; samodzielny przepływ pracy Telegram nadal przyjmuje opublikowaną specyfikację npm na potrzeby kontroli po publikacji.

## Automatyzacja publikowania regularnych wydań

W przypadku publikacji wersji beta, `latest`, Pluginów, GitHub Release i publikacji na platformach
standardowym punktem wejścia wprowadzającym zmiany jest `OpenClaw Release Publish`. Comiesięczna
ścieżka rozszerzonej stabilności `.33+`, obejmująca wyłącznie npm, nie używa tego koordynatora.
Standardowy przepływ pracy koordynuje przepływy pracy zaufanych wydawców w kolejności wymaganej
przez wydanie:

1. Pobierz tag wydania i ustal SHA jego commita.
2. Sprawdź, czy tag jest osiągalny z `main` lub `release/*` (albo z gałęzi alfa Tideclaw w przypadku przedpremierowych wersji alfa).
3. Uruchom `pnpm plugins:sync:check`.
4. Wywołaj `Plugin NPM Release` z `publish_scope=all-publishable` i `ref=<release-sha>`.
5. Wywołaj `Plugin ClawHub Release` z tym samym zakresem i SHA.
6. Wywołaj `OpenClaw NPM Release` z tagiem wydania, znacznikiem dystrybucyjnym npm oraz zapisanym `preflight_run_id` po zweryfikowaniu zapisanego `full_release_validation_run_id` i dokładnej próby uruchomienia.
7. W przypadku wydań stabilnych utwórz lub zaktualizuj wydanie GitHub jako wersję roboczą, wywołaj `Windows Node Release` z jawnym `windows_node_tag` i zatwierdzonymi dla kandydata `windows_node_installer_digests`, a następnie zweryfikuj kanoniczne zasoby instalatora Windows i sum kontrolnych. Wywołaj również `Android Release`, aby zbudować podpisany plik APK dla dokładnego tagu wraz z sumą kontrolną i pochodzeniem. Przed opublikowaniem wersji roboczej zweryfikuj oba kontrakty zasobów natywnych.

Przykład publikacji wersji beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Publikacja stabilna z domyślnym znacznikiem dystrybucyjnym beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Bezpośrednie promowanie wydania stabilnego do `latest` jest jawne:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=latest
```

Przepływów pracy niższego poziomu `Plugin NPM Release` i `Plugin ClawHub Release` używaj wyłącznie do ukierunkowanych napraw lub ponownych publikacji. `OpenClaw Release Publish` odrzuca `plugin_publish_scope=selected`, gdy `publish_openclaw_npm=true`, aby pakiet podstawowy nie mógł zostać wydany bez wszystkich oficjalnych Pluginów możliwych do opublikowania, w tym `@openclaw/diffs-language-pack`. W przypadku naprawy wybranego Pluginu ustaw `publish_openclaw_npm=false` wraz z `plugin_publish_scope=selected` i `plugins=@openclaw/name` albo wywołaj bezpośrednio podrzędny przepływ pracy.

Wyjątkiem jest inicjalizacja pierwszej publikacji w ClawHub: wywołaj `Plugin ClawHub New`
z zaufanej gałęzi `main` i przekaż pełne SHA docelowego wydania przez `ref`.
Nigdy nie uruchamiaj samego przepływu inicjalizacyjnego z tagu ani gałęzi wydania:

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

Walidacja przed utworzeniem tagu wymaga `dry_run=true`, odrzuca dane wejściowe
tagu wydania i uruchomienia nadrzędnego oraz akceptuje wyłącznie dokładny cel osiągalny z `main` lub `release/*`.
Nie wczytuje danych uwierzytelniających ClawHub, nie publikuje bajtów pakietu ani nie zmienia
konfiguracji zaufanego wydawcy. Przepływ pracy nadal rozwiązuje plan rejestru na żywo,
pobiera i pakuje cel wyłącznie w zadaniu bez sekretów, materializuje
zablokowany zestaw narzędzi ClawHub oraz weryfikuje niezmienny artefakt i identyfikator slug/tożsamość
pakietu przed utworzeniem tagu wydania. Zatwierdź środowisko
`clawhub-plugin-bootstrap` dopiero po zakończeniu zadań pakowania bez sekretów;
to chronione zadanie walidacyjne nie ma danych uwierzytelniających ani poleceń wprowadzających zmiany.

Zatwierdzone uruchomienie próbne lub rzeczywista inicjalizacja po utworzeniu tagu musi zawierać dokładny
tag wydania oraz identyfikator, próbę i gałąź nadrzędnego uruchomienia `OpenClaw Release Publish`.
Przepływ nadrzędny poświadcza SHA własnego przepływu pracy oraz oddzielne, dokładne SHA zaufanej
gałęzi `main` dla `Plugin ClawHub New`; uruchomienie podrzędne i każde zatwierdzenie chronionego
środowiska muszą odpowiadać temu zatwierdzonemu SHA procesu podrzędnego. Tag wydania jest
ponownie sprawdzany przed każdą próbą publikacji i zmianą zaufanego wydawcy.

Zadanie pakowania
przesyła jeden niezmienny artefakt, którego nazwa, identyfikator/skrót artefaktu Actions,
uruchomienie/próba producenta, docelowe SHA oraz SHA-256/rozmiar pliku tar każdego pakietu są
przekazywane do zadań walidacyjnych i chronionych. Zadanie chronione pobiera wyłącznie narzędzia
z zaufanej gałęzi `main`, weryfikuje krotkę artefaktu za pośrednictwem interfejsu GitHub API, pobiera
według dokładnego identyfikatora artefaktu, ponownie oblicza skrót każdego pliku tar oraz weryfikuje lokalne ścieżki TAR i
tożsamość pakietu zgodnie z regułami kanonizacji USTAR przypiętej wersji CLI. Każdy
kandydat przechodzi następnie próbne publikowanie za pomocą przypiętej wersji CLI, które kończy się przed
wyszukiwaniem w rejestrze lub uwierzytelnianiem. Filtr wstępny zadania z danymi uwierzytelniającymi ogranicza skompresowane ClawPacki
do 120 MiB, łączną zawartość plików do 50 MiB, rozwinięte dane TAR do 64 MiB oraz
liczbę wpisów TAR do 10 000. Naprawa zaufanego wydawcy dla istniejącego pakietu pozostaje
ograniczona wyłącznie do konfiguracji, ale nadal pakuje cel i wymaga żądanego tagu
oraz dokładnej zgodności bajtów i metadanych rejestru przed zmianą konfiguracji zaufanego wydawcy.
Weryfikacja po publikacji pobiera artefakt ClawHub i wymaga zgodności SHA-256 oraz rozmiaru.
Odzyskiwanie przez ponowne uruchomienie nieudanych zadań może wykorzystać artefakt pakietu z wcześniejszej
próby wyłącznie wtedy, gdy dokładne zadanie producenta zakończyło się pomyślnie. Końcowy dowód wiąże również
zablokowaną wersję ClawHub, SHA-256 blokady oraz integralność npm. Niezgodność wymaga nowej wersji pakietu.

## Dane wejściowe przepływu pracy NPM

`OpenClaw NPM Release` przyjmuje następujące dane wejściowe kontrolowane przez operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` lub `v2026.4.2-alpha.1`; gdy `preflight_only=true`, może to być również bieżące, pełne, 40-znakowe SHA commita gałęzi przepływu pracy na potrzeby wyłącznie walidacyjnej kontroli wstępnej
- `preflight_only`: `true` wyłącznie dla walidacji/budowania/pakowania, `false` dla rzeczywistej ścieżki publikowania
- `preflight_run_id`: identyfikator istniejącego, pomyślnego uruchomienia kontroli wstępnej, wymagany na rzeczywistej ścieżce publikowania, aby przepływ pracy ponownie wykorzystał przygotowany plik tar zamiast budować go ponownie
- `full_release_validation_run_id`: identyfikator pomyślnego uruchomienia `Full Release Validation` dla tego tagu/SHA, wymagany przy rzeczywistej publikacji. Publikacje beta mogą być kontynuowane wyłącznie na podstawie kontroli wstępnej z ostrzeżeniem, ale promocja stabilna/do `latest` nadal go wymaga.
- `full_release_validation_run_attempt`: dokładna dodatnia próba uruchomienia powiązana z `full_release_validation_run_id`; wymagana zawsze, gdy podano identyfikator uruchomienia, aby ponowne uruchomienia nie mogły zmienić dowodu autoryzacji podczas publikowania.
- `release_publish_run_id`: identyfikator zatwierdzonego uruchomienia `OpenClaw Release Publish`; wymagany, gdy ten przepływ pracy jest wywoływany przez ten proces nadrzędny (wywołania rzeczywistego publikowania przez aktora-bota)
- `plugin_npm_run_id`: identyfikator pomyślnego uruchomienia `Plugin NPM Release` dla dokładnego punktu HEAD; wymagany do rzeczywistego wydania podstawowego pakietu `extended-stable`
- `npm_dist_tag`: docelowy znacznik npm dla ścieżki publikowania; przyjmuje `alpha`, `beta`, `latest` lub `extended-stable`, a domyślnie `beta`. Końcowy patch `33` i późniejsze muszą używać `extended-stable`; domyślnie `extended-stable` odrzuca wcześniejsze patche i zawsze odrzuca tagi niekońcowe.
- `bypass_extended_stable_guard`: wartość logiczna wyłącznie do testów, domyślnie `false`; z `npm_dist_tag=extended-stable` omija comiesięczne kryteria kwalifikacji do rozszerzonej stabilności, zachowując kontrole tożsamości wydania, artefaktu, zatwierdzenia i odczytu zwrotnego.

`Plugin NPM Release` przyjmuje `npm_dist_tag=default` dla dotychczasowego zachowania
wydania lub `npm_dist_tag=extended-stable` dla chronionej ścieżki comiesięcznej. Opcja
rozszerzonej stabilności wymaga `publish_scope=all-publishable`, pustego
wejścia `plugins`, końcowego patcha o numerze co najmniej `33` oraz kanonicznej
gałęzi `extended-stable/YYYY.M.33` wskazującej dokładnie swój najnowszy commit. Nigdy nie przesuwa znaczników Pluginów
`latest` ani `beta`. Nowe wersje pakietów otrzymują `extended-stable` atomowo
za pośrednictwem zaufanej publikacji OIDC (`npm publish --tag extended-stable`); ten
źródłowy przepływ pracy nie używa uwierzytelnianego tokenem polecenia `npm dist-tag add`. Ponowne próby
pomijają dokładne wersje już obecne w npm, a następnie kończą się bezpiecznie błędem, jeśli pełny
odczyt zwrotny nie potwierdzi, że wszystkie dokładne pakiety i znacznik `extended-stable` osiągnęły zgodność.

`OpenClaw Release Publish` przyjmuje następujące dane wejściowe kontrolowane przez operatora:

- `tag`: wymagany tag wydania; musi już istnieć
- `preflight_run_id`: identyfikator pomyślnego uruchomienia kontroli wstępnej `OpenClaw NPM Release`; wymagany, gdy `publish_openclaw_npm=true` lub `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id`: identyfikator pomyślnego uruchomienia `Full Release Validation`; wymagany, gdy `publish_openclaw_npm=true` lub `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt`: dokładna dodatnia próba powiązana z `full_release_validation_run_id`; wymagana zawsze, gdy podano identyfikator uruchomienia
- `windows_node_tag`: dokładny tag wydania `openclaw/openclaw-windows-node`, który nie jest wersją przedpremierową; wymagany do publikacji stabilnego wydania OpenClaw
- `windows_node_installer_digests`: zatwierdzona dla kandydata zwarta mapa JSON bieżących nazw instalatorów Windows do ich przypiętych skrótów `sha256:`; wymagana do publikacji stabilnego wydania OpenClaw
- `npm_telegram_run_id`: opcjonalny identyfikator pomyślnego uruchomienia `NPM Telegram Beta E2E`, który ma zostać uwzględniony w końcowym dowodzie wydania
- `npm_dist_tag`: docelowy znacznik npm dla pakietu OpenClaw, jeden z `alpha`, `beta` lub `latest`
- `plugin_publish_scope`: domyślnie `all-publishable`; używaj `selected` wyłącznie do ukierunkowanych napraw dotyczących tylko Pluginów z `publish_openclaw_npm=false`
- `plugins`: rozdzielone przecinkami nazwy pakietów `@openclaw/*`, gdy `plugin_publish_scope=selected`
- `publish_openclaw_npm`: domyślnie `true`; ustaw `false` wyłącznie podczas używania przepływu pracy jako koordynatora napraw dotyczących tylko Pluginów
- `release_profile`: profil zakresu wydania używany w podsumowaniach dowodów wydania; domyślnie `from-validation`, co powoduje odczyt z manifestu walidacji, lub można go zastąpić wartością `beta`, `stable` albo `full`
- `wait_for_clawhub`: domyślnie `false`, aby dostępność npm nie była blokowana przez proces pomocniczy ClawHub; ustaw `true` wyłącznie wtedy, gdy zakończenie przepływu pracy musi obejmować zakończenie ClawHub

`OpenClaw Release Checks` przyjmuje następujące dane wejściowe kontrolowane przez operatora:

- `ref`: gałąź, tag lub pełne SHA commita do zweryfikowania. Kontrole używające sekretów wymagają, aby rozwiązany commit był osiągalny z gałęzi OpenClaw lub tagu wydania.
- `run_release_soak`: włącza wyczerpujące testy długotrwałe na żywo/E2E, ścieżki wydania Docker oraz odporności aktualizacji ze wszystkich wcześniejszych wersji dla kontroli wydania beta. Jest wymuszane przez `release_profile=stable` i `release_profile=full`.

Zasady:

- Zwykłe wersje finalne i poprawkowe z numerem poprawki poniżej `33` mogą być publikowane w kanale `beta` lub `latest`. Wersje finalne z numerem poprawki `33` lub wyższym muszą być publikowane w kanale `extended-stable`, a wersje z sufiksem poprawkowym na tej granicy są odrzucane.
- Tagi wersji wstępnych beta mogą być publikowane wyłącznie w kanale `beta`; tagi wersji wstępnych alfa mogą być publikowane wyłącznie w kanale `alpha`
- W przypadku `OpenClaw NPM Release` podanie pełnego SHA commitu jest dozwolone tylko wtedy, gdy `preflight_only=true`
- `OpenClaw Release Checks` i `Full Release Validation` zawsze służą wyłącznie do walidacji
- Właściwa ścieżka publikacji musi używać tego samego `npm_dist_tag`, którego użyto podczas kontroli wstępnej; przepływ pracy weryfikuje te metadane przed kontynuowaniem publikacji

## Zwykła sekwencja stabilnego wydania beta/latest

Ta starsza sekwencja dotyczy zwykłego, zautomatyzowanego wydania, które obejmuje również pluginy, GitHub Release, Windows i prace związane z innymi platformami. Nie jest to comiesięczna ścieżka rozszerzonego wsparcia stabilnego `.33+`, przeznaczona wyłącznie dla npm i opisana na początku tej strony.

Podczas przygotowywania zwykłego, zautomatyzowanego wydania stabilnego:

1. Uruchom `OpenClaw NPM Release` z ustawieniem `preflight_only=true`. Zanim tag zostanie utworzony, do próbnego uruchomienia przepływu kontroli wstępnej, służącego wyłącznie do walidacji, możesz użyć bieżącego pełnego SHA commitu gałęzi przepływu pracy.
2. Wybierz `npm_dist_tag=beta` dla standardowego przepływu rozpoczynającego od wersji beta albo `latest` tylko wtedy, gdy celowo chcesz opublikować wersję stabilną bezpośrednio.
3. Uruchom `Full Release Validation` dla gałęzi wydania, tagu wydania lub pełnego SHA commitu, gdy chcesz uzyskać w jednym ręcznym przepływie pracy standardowe CI oraz testy rzeczywistej pamięci podręcznej promptów, Docker, QA Lab, Matrix i Telegram. Jeśli celowo potrzebujesz tylko deterministycznego, standardowego grafu testów, uruchom zamiast tego ręczny przepływ pracy `CI` dla odwołania wydania.
4. Wybierz dokładny tag wydania bez oznaczenia wersji wstępnej `openclaw/openclaw-windows-node`, którego podpisane instalatory x64 i ARM64 mają zostać wydane. Zapisz go jako `windows_node_tag`, a mapę zweryfikowanych skrótów tych instalatorów jako `windows_node_installer_digests`. Narzędzie pomocnicze wersji kandydującej zapisuje obie wartości i uwzględnia je w wygenerowanym poleceniu publikacji.
5. Zapisz wartości zakończonych powodzeniem uruchomień: `preflight_run_id`, `full_release_validation_run_id` oraz dokładną wartość `full_release_validation_run_attempt`.
6. Uruchom `OpenClaw Release Publish` z zaufanej gałęzi `main`, używając tego samego `tag`, tego samego `npm_dist_tag`, wybranego `windows_node_tag`, zapisanej wartości `windows_node_installer_digests` oraz zapisanych wartości `preflight_run_id`, `full_release_validation_run_id` i `full_release_validation_run_attempt`. Proces publikuje wydzielone pluginy w npm i ClawHub przed promowaniem pakietu npm OpenClaw.
7. Jeśli wydanie trafiło do kanału `beta`, użyj przepływu pracy `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, aby promować tę wersję stabilną z kanału `beta` do `latest`.
8. Jeśli wydanie zostało celowo opublikowane bezpośrednio w kanale `latest`, a kanał `beta` ma natychmiast wskazywać tę samą stabilną kompilację, użyj tego samego przepływu pracy wydania, aby skierować oba tagi dystrybucyjne na wersję stabilną, albo pozwól, aby później zrobiła to jego zaplanowana synchronizacja samonaprawcza.

Modyfikowanie tagów dystrybucyjnych odbywa się w repozytorium rejestru wydań, ponieważ nadal wymaga ono `NPM_TOKEN`, podczas gdy repozytorium źródłowe używa do publikacji wyłącznie OIDC. Dzięki temu zarówno ścieżka publikacji bezpośredniej, jak i ścieżka promocji rozpoczynająca od wersji beta pozostają udokumentowane i widoczne dla operatorów.

Jeśli opiekun musi awaryjnie użyć lokalnego uwierzytelniania npm, wszystkie polecenia interfejsu CLI 1Password (`op`) należy uruchamiać wyłącznie w dedykowanej sesji tmux. Nie wywołuj `op` bezpośrednio z głównej powłoki agenta; umieszczenie go w sesji tmux zapewnia widoczność monitów, alertów i obsługi haseł jednorazowych oraz zapobiega powtarzającym się alertom hosta.

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

Opiekunowie korzystają z prywatnej dokumentacji wydań w pliku [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md), który zawiera właściwą procedurę wykonawczą.

## Powiązane

- [Kanały wydań](/pl/install/development-channels)
