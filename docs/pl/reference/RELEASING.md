---
read_when:
    - Wyszukiwanie definicji publicznych kanałów wydań
    - Uruchamianie walidacji wydania lub akceptacji pakietu
    - Informacje o nazewnictwie wersji i cyklu wydawniczym
summary: Ścieżki wydań, lista kontrolna operatora, środowiska walidacyjne, nazewnictwo wersji i harmonogram publikacji
title: Zasady wydawania wersji
x-i18n:
    generated_at: "2026-07-16T19:05:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c88c7c61be963ed832b1716e811e09d5f270cb296bb08625e6fd53d5359e45b8
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw udostępnia obecnie trzy kanały aktualizacji przeznaczone dla użytkowników:

- stable: dotychczasowy promowany kanał wydań, który nadal jest rozwiązywany za pośrednictwem npm `latest`, dopóki nie zostanie osiągnięty osobny kamień milowy CLI/kanału
- beta: tagi wersji przedpremierowych publikowane w npm `beta`
- dev: ruchoma najnowsza wersja `main`

Niezależnie od tego operatorzy wydań mogą publikować pakiet rdzenia za ostatni
zakończony miesiąc w npm `extended-stable`, począwszy od poprawki `33`. Regularna
końcowa linia z bieżącego miesiąca pozostaje w npm `latest`; ten podział publikacji
po stronie operatora sam w sobie nie zmienia rozwiązywania kanałów aktualizacji CLI.

Kompilacje alfa Tideclaw stanowią osobną wewnętrzną ścieżkę wersji przedpremierowych (dist-tag npm `alpha`), opisaną w sekcjach [Dane wejściowe przepływu pracy npm](#npm-workflow-inputs) i [Środowiska testowe wydań](#release-test-boxes).

## Nazewnictwo wersji

- Wersja miesięcznego rozszerzonego stabilnego wydania npm: `YYYY.M.PATCH`, z `PATCH >= 33`, tag git `vYYYY.M.PATCH`
- Wersja dziennego/regularnego wydania końcowego: `YYYY.M.PATCH`, z `PATCH < 33`, tag git `vYYYY.M.PATCH`
- Wersja regularnego wydania poprawkowego na wypadek awarii: `YYYY.M.PATCH-N`, tag git `vYYYY.M.PATCH-N`
- Wersja przedpremierowa beta: `YYYY.M.PATCH-beta.N`, tag git `vYYYY.M.PATCH-beta.N`
- Wersja przedpremierowa alfa: `YYYY.M.PATCH-alpha.N`, tag git `vYYYY.M.PATCH-alpha.N`
- Nigdy nie należy uzupełniać miesiąca ani poprawki zerami wiodącymi
- `PATCH` jest kolejnym numerem miesięcznego cyklu wydań, a nie dniem kalendarzowym. Regularne wydania końcowe i beta przesuwają bieżący cykl; tagi wyłącznie alfa nigdy nie zużywają ani nie zwiększają numeru poprawki beta/regularnej, dlatego przy wybieraniu cyklu beta lub regularnego należy ignorować starsze tagi wyłącznie alfa z wyższymi numerami poprawek.
- Kompilacje alfa/nocne używają następnego niewydanego cyklu poprawki i przy kolejnych kompilacjach zwiększają tylko `alpha.N`. Gdy dana poprawka otrzyma wersję beta, nowe kompilacje alfa przechodzą do kolejnej poprawki.
- Wersje npm są niezmienne: nigdy nie należy usuwać, ponownie publikować ani ponownie wykorzystywać opublikowanego tagu. Zamiast tego należy utworzyć kolejny numer wersji przedpremierowej lub kolejną miesięczną poprawkę.
- `latest` nadal odpowiada bieżącej regularnej/dziennej linii npm; `beta` jest bieżącym celem instalacji wersji beta
- `extended-stable` oznacza obsługiwany pakiet npm za poprzedni miesiąc, począwszy od poprawki `33`; poprawka `34` i kolejne są wydaniami konserwacyjnymi tej miesięcznej linii
- Regularne wydania końcowe i regularne wydania poprawkowe są domyślnie publikowane w npm `beta`; operatorzy wydań mogą jawnie wybrać `latest` albo później promować zweryfikowaną kompilację beta
- Dedykowana miesięczna ścieżka rozszerzonej stabilności publikuje pakiet rdzenia npm oraz każdy oficjalny plugin możliwy do opublikowania w npm w dokładnie tej samej wersji. Nie publikuje pluginów w ClawHub ani artefaktów macOS lub Windows, wydania GitHub, tagów dist-tag prywatnych repozytoriów, obrazów Docker, artefaktów mobilnych ani plików do pobrania ze strony internetowej.
- Każde regularne wydanie końcowe dostarcza razem pakiet npm, aplikację macOS, podpisany samodzielny pakiet APK dla Androida oraz podpisane instalatory Windows Hub. Wydania beta zwykle najpierw weryfikują i publikują ścieżkę npm/pakietu, a kompilowanie, podpisywanie, notaryzacja i promowanie aplikacji natywnych są zarezerwowane dla regularnego wydania końcowego, chyba że wyraźnie zażądano inaczej.

## Harmonogram wydań

- Wydania najpierw przechodzą przez wersję beta; wersja stabilna pojawia się dopiero po zweryfikowaniu najnowszej wersji beta
- Opiekunowie zwykle przygotowują wydania z gałęzi `release/YYYY.M.PATCH` utworzonej z bieżącej `main`, aby weryfikacja i poprawki wydania nie blokowały nowych prac programistycznych w `main`
- Jeśli tag beta został wypchnięty lub opublikowany i wymaga poprawki, opiekunowie tworzą następny tag `-beta.N`, zamiast usuwać lub odtwarzać poprzedni
- Szczegółowa procedura wydania, zatwierdzenia, dane uwierzytelniające i uwagi dotyczące odzyskiwania są dostępne wyłącznie dla opiekunów

## Miesięczna publikacja rozszerzonej wersji stabilnej wyłącznie w npm

Jest to dedykowany wyjątek od opisanej poniżej regularnej procedury wydania. Dla
zakończonego miesiąca `YYYY.M` należy utworzyć `extended-stable/YYYY.M.33`; publikować
`vYYYY.M.33` i późniejsze poprawki konserwacyjne z tej samej gałęzi. Tag
wydania, końcówka gałęzi, checkout, wersja pakietu, kontrola wstępna npm i przebieg
pełnej weryfikacji wydania muszą wskazywać ten sam commit. Chroniona `main` musi
już zawierać wersję końcową ze ściśle późniejszego miesiąca kalendarzowego poniżej poprawki
`33`; poprawki konserwacyjne pozostają dopuszczalne po przesunięciu `main` o więcej niż jeden
miesiąc.

Na właściwej gałęzi rozszerzonej stabilności należy podnieść wersję pakietu głównego do `YYYY.M.P`, uruchomić
`pnpm release:prep` i sprawdzić, czy każdy możliwy do opublikowania pakiet rozszerzenia ma
tę samą wersję. Należy zatwierdzić i wypchnąć wszystkie wygenerowane zmiany, utworzyć i wypchnąć
niezmienny tag `vYYYY.M.P` w tym commicie oraz zapisać wynikowy pełny SHA.
Przepływy pracy korzystają z tego przygotowanego drzewa; nie podnoszą ani nie synchronizują
wersji automatycznie.

Należy uruchomić kontrolę wstępną npm oraz pełną weryfikację wydania z dokładnie tej przygotowanej
końcówki gałęzi, a następnie zapisać oba identyfikatory przebiegów i numer udanej próby przebiegu
pełnej weryfikacji wydania:

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

`release_profile=stable` jest istniejącym profilem głębokości weryfikacji;
jest niezależny od dist-tag npm `extended-stable` i celowo
pozostaje bez zmian.

Po pomyślnym zakończeniu obu przebiegów należy opublikować każdy oficjalny plugin możliwy do opublikowania w npm z
dokładnie tej samej końcówki gałęzi. Poprawka `P` musi mieć wartość `33` lub większą. Należy przekazać pełny SHA wydania
jako `ref`, poczekać na ukończenie całej macierzy i odczytu zwrotnego z rejestru, a następnie zapisać
identyfikator udanego przebiegu wydania pluginów w npm:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

Przepływ pracy korzysta ze standardowego przygotowanego spisu pakietów `all-publishable`,
w tym z pakietów, których źródło się nie zmieniło. Przed pomyślnym zakończeniem sprawdza każdy dokładny pakiet
oraz każdy tag pluginu `extended-stable`. Jeśli częściowy przebieg
zakończy się niepowodzeniem, należy ponownie uruchomić to samo polecenie: już opublikowane pakiety zostaną ponownie wykorzystane, brakujące
lub nieaktualne tagi pluginów zostaną uzgodnione w środowisku wydania npm, a
końcowy odczyt zwrotny nadal obejmie kompletny zestaw pakietów.

Po pomyślnym zakończeniu przepływu pracy pluginów i przygotowaniu środowiska wydania npm
należy opublikować dokładny tarball rdzenia z kontroli wstępnej. Publikacja rdzenia sprawdza, czy
wskazany przebieg pluginów ma wartość `completed/success` na tej samej kanonicznej gałęzi i
dokładnie tym samym źródłowym SHA:

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
miesięcznej zasady `.33` lub zasady miesiąca chronionej `main`, należy dodać
`-f bypass_extended_stable_guard=true` zarówno do wywołania kontroli wstępnej npm, jak i
publikacji. Wartość domyślna to `false`. Obejście jest akceptowane wyłącznie z
`npm_dist_tag=extended-stable` i zostaje zapisane w podsumowaniu przepływu pracy. Nie
omija ono kanonicznego odwołania przepływu pracy `extended-stable/YYYY.M.33`,
zgodności końcówki gałęzi/tagu/checkoutu, składni tagu końcowego, zgodności wersji
pakietu/tagu, tożsamości wskazanego przebiegu i manifestu, pochodzenia tarballa,
zatwierdzenia środowiska, odczytu zwrotnego z rejestru ani dowodu naprawy selektora.

Przepływ pracy publikacji sprawdza tożsamości wskazanych przebiegów kontroli wstępnej, weryfikacji i pluginów,
skrót przygotowanego tarballa oraz selektory rejestru rdzenia.
Po pomyślnym zakończeniu przepływu pracy należy niezależnie potwierdzić wynik:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Oba polecenia muszą zwrócić `YYYY.M.P`. Jeśli publikacja powiedzie się, ale odczyt zwrotny
selektora nie powiedzie się, nie należy ponownie publikować niezmiennej wersji pakietu. Należy użyć
pojedynczego polecenia naprawy `npm dist-tag add openclaw@YYYY.M.P extended-stable`
wyświetlonego w zawsze wykonywanym podsumowaniu nieudanego przepływu pracy, a następnie powtórzyć oba
niezależne odczyty zwrotne. Wycofanie do poprzedniego selektora jest osobną decyzją
operatora, a nie ścieżką naprawy odczytu zwrotnego.

Publiczna dokumentacja pomocy początkowo wskazuje Slack, Discord i Codex jako
objęte obsługą powierzchnie pluginów rozszerzonej wersji stabilnej. Ta lista jest deklaracją obsługi, a nie
listą dozwolonych elementów w kodzie wydania: każdy oficjalny plugin możliwy do opublikowania w npm korzysta z
tej samej ścieżki publikacji dokładnej wersji.

Poniższa regularna lista kontrolna nadal obejmuje wersję beta, `latest`, wydanie GitHub,
pluginy, macOS, Windows i publikację na innych platformach. Nie należy wykonywać tych
kroków dla tej ścieżki rozszerzonej stabilności przeznaczonej wyłącznie dla npm.

## Lista kontrolna operatora regularnego wydania

Ta lista kontrolna przedstawia publiczny kształt procesu wydania. Prywatne dane uwierzytelniające, podpisywanie, notaryzacja, odzyskiwanie dist-tag oraz szczegóły awaryjnego wycofywania pozostają w podręczniku wydań dostępnym wyłącznie dla opiekunów.

1. Należy rozpocząć od bieżącej `main`: pobrać najnowsze zmiany, potwierdzić wypchnięcie docelowego commitu oraz potwierdzić, że CI `main` jest wystarczająco zielone, aby utworzyć z niego gałąź.
2. Należy utworzyć `release/YYYY.M.PATCH` z tego commitu. Backporty są opcjonalne; należy zastosować wyłącznie zestaw wybrany przez operatora. Należy podnieść wersje we wszystkich wymaganych miejscach, uruchomić `pnpm release:prep`, dokończyć poprawki wydania i wymagane przeniesienia zmian do nowszych gałęzi oraz przejrzeć `src/plugins/compat/registry.ts` i `src/commands/doctor/shared/deprecation-compat.ts`.
3. Należy zamrozić kompletny produktowo commit sprzed aktualizacji dziennika zmian jako **SHA kodu**. Następnie należy uruchomić deterministyczną kontrolę wstępną źródła i użyć `node scripts/full-release-validation-at-sha.mjs --sha <code-sha> --target-ref release/YYYY.M.PATCH`. Przypina to zaufane narzędzia przepływu pracy, podczas gdy pełna macierz Vitest, Docker, QA, pakietów i wydajności obejmuje dokładny SHA kodu.
4. Przed edycją należy sklasyfikować niepowodzenia. Niepowodzenie produktu/kodu tworzy nowy SHA kodu i wymaga pomyślnej pełnej weryfikacji dla tego SHA. Niepowodzenie przepływu pracy, zestawu testowego, danych uwierzytelniających, zatwierdzenia lub infrastruktury należy naprawić w powierzchni, która jest jego właścicielem, i uruchomić ponownie względem tego samego SHA kodu.
5. Dopiero gdy SHA kodu będzie zielony, należy wygenerować początkową sekcję `CHANGELOG.md` na podstawie scalonych PR-ów i bezpośrednich commitów od ostatniego osiągalnego wydanego tagu. Wpisy powinny być skierowane do użytkowników i pozbawione duplikatów. Gdy rozbieżny wydany tag lub późniejsze przeniesienie zmian do nowszej gałęzi ponownie powiąże już wydane PR-y, należy przekazać go jawnie jako `--shipped-ref`.
6. Należy zatwierdzić wyłącznie `CHANGELOG.md`. Ten commit jest **SHA wydania**. Pełna różnica między SHA kodu a SHA wydania musi obejmować dokładnie `CHANGELOG.md`; każda inna zmieniona ścieżka cofa proces wydania do kroku 2.
7. Należy uruchomić pełną weryfikację wydania przypiętą do SHA dla SHA wydania, z włączonym ponownym użyciem dowodów. Lekki przebieg nadrzędny musi zapisać `changelog-only-release-v1`, wskazywać zielony SHA kodu i nie uruchamiać żadnych podrzędnych ścieżek produktu. Powoduje to ponowne użycie dowodów dotyczących produktu, ale nie bajtów pakietu.
8. Należy uruchomić `OpenClaw NPM Release` z `preflight_only=true` względem SHA/tagu wydania. Należy zapisać udany `preflight_run_id`. Spowoduje to zbudowanie i sprawdzenie dokładnych bajtów pakietu zawierających końcowy dziennik zmian.
9. Należy oznaczyć SHA wydania tagiem, a następnie uruchomić narzędzie pomocnicze kandydata z udanym nadrzędnym przebiegiem weryfikacji SHA wydania i kontrolą wstępną npm, zamiast ponownie uruchamiać którekolwiek z nich:

   ```bash
   pnpm release:candidate -- \
     --tag vYYYY.M.PATCH-beta.N \
     --full-release-run <release-sha-validation-run-id> \
     --npm-preflight-run <preflight-run-id> \
     --skip-dispatch
   ```

   W przypadku wydania stabilnego przekaż także `--windows-node-tag vX.Y.Z`. Narzędzie pomocnicze weryfikuje pochodzenie informacji o wydaniu, bajty kontroli wstępnej npm, dowód instalacji/aktualizacji w Parallels, dowód pakietu Telegram oraz plany publikacji pluginów, a następnie wyświetla polecenie publikacji.

   `OpenClaw Release Publish` równolegle wysyła wybrane lub wszystkie możliwe do opublikowania pakiety pluginów do npm i ten sam zestaw do ClawHub, a następnie, po pomyślnym opublikowaniu pluginów w npm, promuje przygotowany artefakt kontroli wstępnej npm OpenClaw z pasującym znacznikiem dist-tag. Katalog roboczy wydania pozostaje głównym katalogiem produktu i danych, natomiast planowanie oraz końcowa weryfikacja są wykonywane z dokładnego, zaufanego katalogu roboczego źródła workflow, dzięki czemu starszy commit wydania nie może niepostrzeżenie użyć przestarzałych narzędzi wydawniczych. Przed uruchomieniem jakiegokolwiek procesu podrzędnego publikacji generowana i buforowana jest dokładna treść wydania GitHub. Gdy kompletna, pasująca sekcja `CHANGELOG.md` mieści się w limicie GitHub wynoszącym 125,000 znaków i odpowiadającym mu bezpiecznym limicie mechanizmu renderującego wynoszącym 125,000 bajtów, strona zawiera dokładnie tę sekcję `## YYYY.M.PATCH` wraz z jej nagłówkiem. Gdy sekcja źródłowa się nie mieści, strona zachowuje dokładne, pogrupowane noty redakcyjne i zastępuje zbyt obszerny rejestr wkładów stabilnym odnośnikiem do pełnego rejestru w pliku `CHANGELOG.md` przypiętym do tagu; częściowe rejestry i ucięte punkty listy nigdy nie są publikowane. Workflow wybiera pełną lub skróconą treść przed dodaniem `### Release verification`; jeśli końcowa część dowodowa przekroczyłaby limit, zachowuje kanoniczną treść i zamiast tego polega na niezmiennym załączonym dowodzie. Wydania stabilne opublikowane w npm `latest` stają się najnowszym wydaniem GitHub, natomiast stabilne wydania konserwacyjne pozostawione w npm `beta` są tworzone z ustawieniem GitHub `latest=false`. Workflow przesyła również do wydania GitHub dowody zależności z kontroli wstępnej, manifest pełnej walidacji oraz dowody weryfikacji rejestru po publikacji na potrzeby reagowania na incydenty po wydaniu. Natychmiast wyświetla identyfikatory uruchomień podrzędnych, automatycznie zatwierdza bramki środowiska wydawniczego, które token workflow może zatwierdzić, podsumowuje nieudane zadania podrzędne wraz z końcówkami logów, z góry tworzy wersję roboczą strony wydania GitHub i równolegle z publikacją OpenClaw w npm promuje zasoby Windows i Android, finalizuje stronę wydania oraz dowody zależności po pomyślnym ukończeniu tych etapów, oczekuje na ClawHub zawsze, gdy OpenClaw jest publikowany w npm, a następnie uruchamia weryfikator beta z zaufanej gałęzi głównej i przesyła dowody po publikacji dotyczące wydania GitHub, pakietu npm, wybranych pakietów pluginów npm, wybranych pakietów ClawHub, identyfikatorów uruchomień podrzędnych oraz opcjonalnego identyfikatora uruchomienia NPM Telegram. Weryfikator inicjalizacji ClawHub wymaga dokładnej ścieżki i SHA workflow z zaufanej gałęzi głównej, prób uruchomienia producenta i końcowego, SHA wydania, żądanego zestawu pakietów, niezmiennej krotki artefaktu pakietu oraz artefaktu końcowego odczytu zwrotnego z rejestru; pomyślne starsze uruchomienie z odwołania wydania nie jest akceptowane.

   Następnie uruchom test akceptacyjny pakietu po publikacji dla opublikowanego pakietu `openclaw@YYYY.M.PATCH-beta.N` lub `openclaw@beta`. Jeśli wypchnięte lub opublikowane wydanie wstępne wymaga poprawki, utwórz następny pasujący numer wydania wstępnego; nigdy nie usuwaj ani nie nadpisuj poprzedniego.

10. Po nieudanej próbie publikacji nie zmieniaj SHA wydania, chyba że błąd dowodzi usterki produktu lub dziennika zmian. Wznów pomyślnie ukończone, niezmienne procesy podrzędne i artefakty; nigdy nie przebudowuj ani nie publikuj ponownie wersji pakietu, której publikacja już się powiodła.
11. W przypadku wydania stabilnego kontynuuj dopiero wtedy, gdy sprawdzona wersja beta lub kandydat do wydania ma wymagane dowody walidacji. Publikacja stabilnego wydania w npm również odbywa się przez `OpenClaw Release Publish`, ponownie wykorzystując pomyślnie utworzony artefakt kontroli wstępnej za pośrednictwem `preflight_run_id`. Gotowość stabilnego wydania macOS wymaga również spakowanych plików `.zip`, `.dmg`, `.dSYM.zip` oraz zaktualizowanego `appcast.xml` w `main`; workflow publikacji macOS automatycznie publikuje podpisany kanał appcast w publicznym `main` po zweryfikowaniu zasobów wydania albo otwiera lub aktualizuje PR dotyczący appcast, jeśli ochrona gałęzi blokuje bezpośrednie wypchnięcie. Gotowość stabilnego wydania Windows Hub wymaga podpisanych zasobów `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` oraz `OpenClawCompanion-SHA256SUMS.txt` w wydaniu OpenClaw na GitHub. Przekaż dokładny, podpisany tag wydania `openclaw/openclaw-windows-node` jako `windows_node_tag` oraz zatwierdzoną dla kandydata mapę skrótów instalatorów jako `windows_node_installer_digests`; `OpenClaw Release Publish` zachowuje wersję roboczą wydania, uruchamia `Windows Node Release` i weryfikuje wszystkie trzy zasoby przed publikacją.
12. Po publikacji uruchom weryfikator npm po publikacji, opcjonalny samodzielny test Telegram E2E opublikowanego pakietu npm, gdy potrzebny jest dowód kanału po publikacji, promocję znacznika dist-tag, jeśli jest potrzebna, zweryfikuj wygenerowaną stronę wydania GitHub, wykonaj kroki ogłoszenia wydania, a następnie ukończ [finalizację stabilnego wydania na gałęzi głównej](#stable-main-closeout), zanim uznasz stabilne wydanie za ukończone.

## Finalizacja stabilnego wydania na gałęzi głównej

Publikacja stabilnego wydania nie jest ukończona, dopóki `main` nie zawiera faktycznie opublikowanego stanu wydania.

1. Rozpocznij od świeżej, najnowszej wersji `main`. Porównaj z nią `release/YYYY.M.PATCH` i przenieś rzeczywiste poprawki, których brakuje w `main`. Nie scalaj bezkrytycznie adapterów zgodności, testów ani walidacji przeznaczonych wyłącznie dla wydania z nowszym `main`.
2. W standardowym przebiegu ustaw `main` na opublikowaną wersję stabilną. Opóźniona finalizacja może użyć `main`, gdy osiągnęła już późniejszą stabilną wersję OpenClaw CalVer; nie obniżaj wersji już rozpoczętego cyklu wydawniczego wyłącznie w celu zamknięcia poprzedniego wydania. Walidator nadal wymaga dokładnej sekcji dziennika zmian opublikowanego wydania oraz wpisu appcast i zapisuje faktyczną wersję oraz SHA `main`. Uruchom `pnpm release:prep` po każdej zmianie wersji głównej, a następnie `pnpm deps:shrinkwrap:generate`.
3. Doprowadź sekcję `## YYYY.M.PATCH` pliku `CHANGELOG.md` w `main` do dokładnej zgodności z otagowaną gałęzią wydania. Uwzględnij aktualizację stabilnego `appcast.xml`, jeśli została opublikowana przez wydanie macOS.
4. Nie dodawaj `YYYY.M.PATCH+1`, wersji beta ani pustej sekcji przyszłego dziennika zmian do `main`, dopóki operator wyraźnie nie rozpocznie tego cyklu wydawniczego.
5. Uruchom `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` oraz `OPENCLAW_TESTBOX=1 pnpm check:changed`. Wypchnij zmiany, a następnie sprawdź, czy `origin/main` zawiera opublikowaną wersję i dziennik zmian, zanim uznasz stabilne wydanie za ukończone.
6. Po każdej prywatnej próbie wycofania utrzymuj aktualne zmienne repozytorium `RELEASE_ROLLBACK_DRILL_ID` oraz `RELEASE_ROLLBACK_DRILL_DATE`.

`OpenClaw Stable Main Closeout` rozpoczyna się od wypchnięcia `main`, które po publikacji stabilnego wydania zawiera opublikowaną wersję, dziennik zmian oraz appcast. Odczytuje niezmienne dowody po publikacji, aby powiązać opublikowany tag z jego uruchomieniami pełnej walidacji wydania i publikacji, a następnie weryfikuje stan stabilnej gałęzi głównej, wydanie, obowiązkowy okres obserwacji wydania stabilnego oraz blokujące dowody wydajności. Dołącza do wydania GitHub niezmienny manifest finalizacji oraz sumę kontrolną. Automatyczny wyzwalacz wypchnięcia pomija starsze wydania sprzed wprowadzenia niezmiennych dowodów po publikacji i nigdy nie uznaje takiego pominięcia za ukończoną finalizację.

Pełna finalizacja wymaga obu zasobów i pasującej sumy kontrolnej. Częściowy manifest ponownie odtwarza zapisane SHA `main` i próbę wycofania, aby wygenerować identyczne bajty, a następnie dołącza brakującą sumę kontrolną; nieprawidłowa para lub suma kontrolna bez manifestu nadal blokuje proces. Uruchomienie wyzwolone wypchnięciem bez zmiennych repozytorium próby wycofania zostaje pominięte bez ukończenia finalizacji; brakujący lub starszy niż 90 dni zapis próby nadal blokuje ręczną finalizację opartą na dowodach. Prywatne polecenia odzyskiwania pozostają w podręczniku dostępnym wyłącznie dla opiekunów. Ręczne uruchomienie służy wyłącznie do naprawy lub ponownego odtworzenia opartej na dowodach finalizacji wydania stabilnego.

Jeśli nadrzędny proces publikacji wydania zakończył się niepowodzeniem dopiero po dołączeniu niezmiennych dowodów npm/pluginów, najpierw napraw i opublikuj wszystkie zasoby stabilnego wydania dla poszczególnych platform. Następnie opiekun może ręcznie uruchomić finalizację z `allow_failed_publish_recovery=true`; ten tryb akceptuje wyłącznie ukończony, nieudany proces nadrzędny i dodatkowo wymaga dokładnych kontraktów zasobów Android i Windows, skrótów SHA-256 GitHub, weryfikacji sum kontrolnych, pochodzenia Android oraz pomyślnej promocji Windows uruchomionej przez proces nadrzędny, której kontrole Authenticode i zatwierdzone dla kandydata skróty odpowiadają opublikowanym instalatorom, wraz ze standardowymi kontrolami macOS/appcast. Automatyczna finalizacja po wypchnięciu nigdy nie włącza tego trybu odzyskiwania.

Starszy tag korekty awaryjnej może ponownie wykorzystać dowody pakietu bazowego tylko wtedy, gdy tag korekty wskazuje ten sam commit źródłowy co bazowy tag stabilny. Jego wydanie Android ponownie wykorzystuje zweryfikowany plik APK bazowego tagu i dodaje pochodzenie dla tagu korekty. Korekta z innym źródłem musi opublikować i zweryfikować własne dowody pakietu oraz użyć wyższego `versionCode` Android.

## Kontrola wstępna wydania

- Uruchom `pnpm check:test-types` przed kontrolą wstępną wydania, aby testowy kod TypeScript pozostawał objęty kontrolą poza szybszą lokalną bramką `pnpm check`.
- Uruchom `pnpm check:architecture` przed kontrolą wstępną wydania, aby szersze kontrole cykli importów i granic architektury zakończyły się pomyślnie poza szybszą lokalną bramką.
- Uruchom `pnpm build && pnpm ui:build` przed `pnpm release:check`, aby oczekiwane artefakty wydania `dist/*` i pakiet Control UI istniały na potrzeby etapu walidacji pakietu.
- Uruchom `pnpm release:prep` po zmianie wersji głównej i przed utworzeniem tagu. Polecenie uruchamia każdy deterministyczny generator wydania, którego wynik często ulega rozbieżności po zmianie wersji, konfiguracji lub API: wersje pluginów, pliki shrinkwrap npm, inwentarz pluginów, podstawowy schemat konfiguracji, metadane konfiguracji dołączonych kanałów, bazową wersję dokumentacji konfiguracji, eksporty SDK pluginów oraz bazową wersję API SDK pluginów. `pnpm release:check` ponownie uruchamia te zabezpieczenia w trybie kontroli (wraz z kontrolą budżetu powierzchni SDK pluginów) i w jednym przebiegu zgłasza wszystkie rozbieżności wygenerowanych plików przed uruchomieniem kontroli wydania pakietów.
- Synchronizacja wersji pluginów domyślnie aktualizuje możliwy do opublikowania pakiet środowiska wykonawczego `@openclaw/ai`, wersje oficjalnych pakietów pluginów oraz istniejące dolne granice `openclaw.compat.pluginApi` do wersji wydania OpenClaw. Traktuj to pole jako minimalną wersję API SDK/środowiska wykonawczego pluginów, a nie wyłącznie kopię wersji pakietu: w przypadku wydań dotyczących wyłącznie pluginów, które celowo zachowują zgodność ze starszymi hostami OpenClaw, pozostaw tę granicę na poziomie najstarszego obsługiwanego API hosta i udokumentuj ten wybór w dowodach wydania pluginu.
- Przed zatwierdzeniem wydania ręcznie uruchom workflow `Full Release Validation`, aby z jednego punktu wejścia uruchomić wszystkie środowiska testowe wydania wstępnego. Przyjmuje gałąź, tag lub pełne SHA commitu, uruchamia ręczne `CI` oraz uruchamia `OpenClaw Release Checks` na potrzeby testu podstawowego instalacji, akceptacji pakietu, międzyplatformowych kontroli pakietów, zgodności QA Lab, Matrix i ścieżek Telegram. Uruchomienia stabilne i pełne zawsze obejmują wyczerpujące testy live/E2E oraz długotrwałe testy ścieżki wydawniczej Docker; `run_release_soak=true` zachowano na potrzeby jawnie wybranego długotrwałego testu wersji beta. Akceptacja pakietu zapewnia kanoniczny test Telegram E2E pakietu podczas walidacji kandydata, co pozwala uniknąć drugiego równoległego mechanizmu odpytywania na żywo.

  Po opublikowaniu wersji beta podaj `release_package_spec`, aby ponownie wykorzystać opublikowany pakiet npm w kontrolach wydania, akceptacji pakietu oraz teście Telegram E2E pakietu bez ponownego budowania archiwum tar wydania. Podaj `npm_telegram_package_spec` tylko wtedy, gdy Telegram ma używać innego opublikowanego pakietu niż pozostała część walidacji wydania. Podaj `package_acceptance_package_spec`, gdy akceptacja pakietu ma używać innego opublikowanego pakietu niż specyfikacja pakietu wydania. Podaj `evidence_package_spec`, gdy raport dowodów wydania ma potwierdzać zgodność walidacji z opublikowanym pakietem npm bez wymuszania testu Telegram E2E.

  ```bash
  node scripts/full-release-validation-at-sha.mjs \
    --sha <code-sha> \
    --target-ref release/YYYY.M.PATCH
  ```

- Uruchom ręcznie przepływ pracy `Package Acceptance`, gdy potrzebne jest niezależne potwierdzenie kandydata pakietu podczas trwania prac nad wydaniem. Użyj `source=npm` dla `openclaw@beta`, `openclaw@latest` lub dokładnej wersji wydania; `source=ref`, aby spakować zaufaną gałąź/znacznik/SHA `package_ref` przy użyciu bieżącego środowiska testowego `workflow_ref`; `source=url` dla publicznego archiwum tar dostępnego przez HTTPS, z wymaganym SHA-256 i rygorystycznymi zasadami dotyczącymi publicznych adresów URL; `source=trusted-url` dla nazwanych zasad zaufanego źródła z wymaganymi `trusted_source_id` i SHA-256; albo `source=artifact` dla archiwum tar przesłanego przez inne uruchomienie GitHub Actions.

  Przepływ pracy rozpoznaje kandydata jako `package-under-test`, ponownie wykorzystuje harmonogram wydań Docker E2E dla tego archiwum tar i może uruchomić kontrolę jakości Telegram dla tego samego archiwum tar przy użyciu `telegram_mode=mock-openai` lub `telegram_mode=live-frontier`. Gdy wybrane ścieżki Docker obejmują `published-upgrade-survivor`, artefakt pakietu jest kandydatem, a `published_upgrade_survivor_baseline` wybiera opublikowaną wersję bazową. `update-restart-auth` używa pakietu kandydata zarówno jako zainstalowanego CLI, jak i pakietu poddawanego testom, dzięki czemu sprawdza ścieżkę zarządzanego ponownego uruchomienia polecenia aktualizacji kandydata.

  Przykład:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Typowe profile:
  - `smoke`: ścieżki instalacji/kanału/agenta, sieci Gateway i ponownego wczytywania konfiguracji
  - `package`: natywne dla artefaktu ścieżki pakietu/aktualizacji/ponownego uruchomienia/pluginów bez OpenWebUI ani aktywnego ClawHub
  - `product`: profil pakietu oraz kanały MCP, czyszczenie zadań Cron/podagentów, wyszukiwanie internetowe OpenAI i OpenWebUI
  - `full`: fragmenty ścieżki wydania Docker z OpenWebUI
  - `custom`: dokładny wybór `docker_lanes` na potrzeby ukierunkowanego ponownego uruchomienia

- Uruchom bezpośrednio ręczny przepływ pracy `CI`, gdy potrzebne jest tylko deterministyczne pokrycie standardowego CI dla kandydata do wydania. Ręczne uruchomienia CI pomijają ograniczanie zakresu na podstawie zmian i wymuszają fragmenty Linux Node, fragmenty dołączonych pluginów, fragmenty kontraktów pluginów i kanałów, zgodność z Node 22, `check-*`, `check-additional-*`, testy dymne zbudowanych artefaktów, kontrole dokumentacji, Python Skills, Windows, macOS oraz ścieżki internacjonalizacji Control UI. Samodzielne ręczne uruchomienia CI obejmują Android tylko po uruchomieniu z `include_android=true`; `Full Release Validation` przekazuje ten parametr do podrzędnego procesu CI.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Uruchom `pnpm qa:otel:smoke` podczas walidacji telemetrii wydania. Sprawdza ono laboratorium kontroli jakości za pośrednictwem lokalnego odbiornika OTLP/HTTP oraz weryfikuje eksport śladów, metryk i dzienników, a także ograniczone atrybuty śladów i redagowanie treści/identyfikatorów bez konieczności użycia Opik, Langfuse ani innego zewnętrznego kolektora.
- Uruchom `pnpm qa:otel:collector-smoke` podczas walidacji zgodności kolektora. Kieruje ono ten sam eksport OTLP z laboratorium kontroli jakości przez rzeczywisty kontener Docker OpenTelemetry Collector przed wykonaniem asercji lokalnego odbiornika.
- Uruchom `pnpm qa:prometheus:smoke` podczas walidacji chronionego pobierania danych Prometheus. Sprawdza ono laboratorium kontroli jakości, odrzuca nieuwierzytelnione pobieranie danych i weryfikuje, że rodziny metryk krytyczne dla wydania nie zawierają treści monitów, nieprzetworzonych identyfikatorów, tokenów uwierzytelniających ani lokalnych ścieżek.
- Uruchom `pnpm qa:observability:smoke`, aby kolejno wykonać ścieżki testów dymnych OpenTelemetry i Prometheus z kodu źródłowego.
- Uruchom `pnpm release:check` przed każdym oznaczonym wydaniem.
- Kontrola wstępna `OpenClaw NPM Release` generuje dowody dotyczące zależności wydania przed spakowaniem archiwum tar npm. Bramka podatności z komunikatów bezpieczeństwa npm blokuje wydanie. Raporty dotyczące ryzyka manifestu zależności przechodnich, własności zależności/powierzchni instalacji oraz zmian zależności stanowią wyłącznie dowody wydania. Raport zmian zależności porównuje kandydata do wydania z poprzednim osiągalnym znacznikiem wydania. Kontrola wstępna przesyła dowody dotyczące zależności jako `openclaw-release-dependency-evidence-<tag>`, a także osadza je w `dependency-evidence/` wewnątrz przygotowanego artefaktu kontroli wstępnej npm. Właściwa ścieżka publikacji ponownie wykorzystuje ten artefakt kontroli wstępnej, a następnie dołącza te same dowody do wydania GitHub jako `openclaw-<version>-dependency-evidence.zip`.
- Uruchom `OpenClaw Release Publish` dla sekwencji publikacji wprowadzającej zmiany po utworzeniu znacznika. Standardowe publikacje beta i stabilne uruchamiaj z zaufanego `main`; znacznik wydania nadal wybiera dokładny docelowy commit i może wskazywać na `release/YYYY.M.PATCH`. Publikacje alfa Tideclaw pozostają na odpowiadającej im gałęzi alfa. Przekaż pomyślne `preflight_run_id` npm OpenClaw, pomyślne `full_release_validation_run_id` oraz dokładne `full_release_validation_run_attempt`, a domyślny zakres publikacji pluginów `all-publishable` pozostaw bez zmian, chyba że celowo wykonywana jest ukierunkowana naprawa. Przepływ pracy wykonuje kolejno publikację pluginów npm, publikację pluginów w ClawHub oraz publikację OpenClaw w npm, aby pakiet podstawowy nie został opublikowany przed jego wyodrębnionymi pluginami; promocja Windows i Android przebiega równolegle z publikacją pakietu podstawowego w npm względem wersji roboczej strony wydania. Ponowne uruchomienia publikacji można wznawiać: już opublikowana podstawowa wersja npm pomija uruchomienie publikacji pakietu podstawowego po wykazaniu przez przepływ pracy, że archiwum tar w rejestrze jest zgodne z artefaktem kontroli wstępnej znacznika, a promocja Windows/Android jest pomijana, gdy wydanie zawiera już zweryfikowany kontrakt artefaktów, dzięki czemu ponowna próba wykonuje tylko etapy zakończone niepowodzeniem. Ukierunkowane naprawy dotyczące wyłącznie pluginów wymagają `plugin_publish_scope=selected` oraz niepustej listy pluginów. Uruchomienia `all-publishable` dotyczące wyłącznie pluginów wymagają kompletnych, niezmiennych dowodów kontroli wstępnej i pełnej walidacji wydania; częściowe dowody są odrzucane.
- Stabilne `OpenClaw Release Publish` wymaga dokładnego `windows_node_tag` po utworzeniu odpowiadającego wydania `openclaw/openclaw-windows-node`, które nie jest wersją wstępną, oraz zatwierdzonej dla kandydata mapy `windows_node_installer_digests`. Przed uruchomieniem jakiegokolwiek podrzędnego procesu publikacji sprawdza, czy wydanie źródłowe jest opublikowane, nie jest wersją wstępną, zawiera wymagane instalatory x64/ARM64 i nadal jest zgodne z zatwierdzoną mapą. Następnie uruchamia `Windows Node Release`, gdy wydanie OpenClaw jest nadal wersją roboczą, przekazując bez zmian przypiętą mapę skrótów instalatorów. Podrzędny przepływ pracy pobiera podpisane instalatory Windows Hub z dokładnie tego znacznika, porównuje je z przypiętymi skrótami, weryfikuje na maszynie wykonawczej Windows, że ich podpisy Authenticode używają oczekiwanego podpisującego OpenClaw Foundation, zapisuje manifest SHA-256 i przesyła instalatory wraz z manifestem do kanonicznego wydania OpenClaw w GitHub, po czym ponownie pobiera promowane artefakty oraz weryfikuje ich obecność w manifeście i skróty. Przed publikacją nadrzędny przepływ pracy weryfikuje bieżący kontrakt artefaktów x64, ARM64 i sum kontrolnych. Bezpośrednie odzyskiwanie odrzuca nieoczekiwane nazwy artefaktów `OpenClawCompanion-*` przed zastąpieniem oczekiwanych artefaktów kontraktu przypiętymi bajtami źródłowymi.

  Ręcznie uruchamiaj `Windows Node Release` wyłącznie w celu odzyskiwania i zawsze przekazuj dokładny znacznik, nigdy `latest`, wraz z jawną mapą JSON `expected_installer_digests` z zatwierdzonego wydania źródłowego. Łącza pobierania w witrynie powinny wskazywać dokładne adresy URL artefaktów bieżącego stabilnego wydania OpenClaw albo `releases/latest/download/...` dopiero po zweryfikowaniu, że przekierowanie GitHub do najnowszego wydania wskazuje to samo wydanie; nie należy podawać wyłącznie łącza do strony wydania w repozytorium towarzyszącym.

- Kontrole wydania są teraz uruchamiane w osobnym ręcznym przepływie pracy: `OpenClaw Release Checks`. Uruchamia on również ścieżkę zgodności makiet QA Lab oraz profil wydania Matrix i ścieżkę QA Telegram przed zatwierdzeniem wydania. Ścieżki na żywo używają środowiska `qa-live-shared`; Telegram używa również dzierżaw poświadczeń CI Convex. Uruchom ręczny przepływ pracy `QA-Lab - All Lanes` z `matrix_profile=all`, aby wykonać wszystkie utrzymywane scenariusze Matrix; przepływ pracy rozdziela ten wybór między profile transportu, multimediów i E2EE, aby pełny zestaw dowodów mieścił się w limitach czasu poszczególnych zadań.
- Walidacja środowiska uruchomieniowego instalacji i aktualizacji między systemami operacyjnymi jest częścią publicznych `OpenClaw Release Checks` i `Full Release Validation`, które bezpośrednio wywołują przepływ pracy wielokrotnego użytku `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`. Ten podział jest celowy: rzeczywista ścieżka wydania npm pozostaje krótka, deterministyczna i skoncentrowana na artefaktach, natomiast wolniejsze kontrole na żywo pozostają we własnej ścieżce, dzięki czemu nie wstrzymują ani nie blokują publikacji.
- Kontrole wydania korzystające z sekretów należy uruchamiać przez `Full Release Validation` lub z referencji przepływu pracy `main`/release, aby logika przepływu pracy i sekrety pozostawały pod kontrolą.
- `OpenClaw Release Checks` przyjmuje gałąź, tag lub pełny SHA commitu, o ile rozpoznany commit jest osiągalny z gałęzi OpenClaw lub tagu wydania.
- Wstępna kontrola `OpenClaw NPM Release` służąca wyłącznie do walidacji przyjmuje również bieżący pełny, 40-znakowy SHA commitu gałęzi przepływu pracy bez wymagania wypchniętego tagu. Ta ścieżka SHA służy wyłącznie do walidacji i nie może zostać przekształcona w rzeczywistą publikację. W trybie SHA przepływ pracy syntetyzuje `v<package.json version>` wyłącznie na potrzeby kontroli metadanych pakietu; rzeczywista publikacja nadal wymaga rzeczywistego tagu wydania.
- Oba przepływy pracy zachowują rzeczywistą ścieżkę publikacji i promocji na runnerach hostowanych przez GitHub, natomiast niemodyfikująca ścieżka walidacji może korzystać z większych runnerów Blacksmith Linux.
- Ten przepływ pracy uruchamia `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`, używając obu sekretów przepływu pracy: `OPENAI_API_KEY` i `ANTHROPIC_API_KEY`.
- Wstępna kontrola wydania npm nie czeka już na osobną ścieżkę kontroli wydania.
- Przed lokalnym oznaczeniem kandydata do wydania tagiem uruchom `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. Narzędzie pomocnicze uruchamia szybkie zabezpieczenia wydania, kontrole wydania pluginów npm/ClawHub, kompilację, kompilację interfejsu użytkownika oraz `release:openclaw:npm:check` w kolejności pozwalającej wykryć typowe błędy blokujące zatwierdzenie przed uruchomieniem przepływu publikacji GitHub.
- Przed zatwierdzeniem uruchom `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (lub odpowiadający mu tag wersji przedpremierowej/korygującej).
- Po publikacji npm uruchom `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (lub odpowiadającą mu wersję beta/korygującą), aby zweryfikować ścieżkę instalacji z opublikowanego rejestru w nowym prefiksie tymczasowym.
- Po publikacji wersji beta uruchom `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`, aby zweryfikować wdrażanie z zainstalowanego pakietu, konfigurację Telegram oraz rzeczywiste E2E Telegram względem opublikowanego pakietu npm przy użyciu współdzielonej puli dzierżawionych poświadczeń Telegram. Jednorazowe lokalne uruchomienia przez opiekunów mogą pominąć zmienne Convex i przekazać bezpośrednio trzy poświadczenia środowiskowe `OPENCLAW_QA_TELEGRAM_*`.
- Aby uruchomić pełny test dymny wersji beta po publikacji z komputera opiekuna, użyj `pnpm release:beta-smoke -- --beta betaN`. Narzędzie pomocnicze uruchamia walidację aktualizacji npm i nowego celu w Parallels, wywołuje `NPM Telegram Beta E2E`, odpytuje dokładnie ten przebieg przepływu pracy, pobiera artefakt i wyświetla raport Telegram.
- Opiekunowie mogą uruchomić tę samą kontrolę po publikacji z GitHub Actions za pomocą ręcznego przepływu pracy `NPM Telegram Beta E2E`. Celowo jest on wyłącznie ręczny i nie jest uruchamiany przy każdym scaleniu.
- Automatyzacja wydania dla opiekunów korzysta ze schematu „wstępna kontrola, następnie promocja”:
  - Rzeczywista publikacja npm musi przejść pomyślną wstępną kontrolę npm `preflight_run_id`.
  - Standardowa orkiestracja i wstępna kontrola publikacji wersji beta i stabilnej używa zaufanego `main` względem dokładnego tagu docelowego. Publikacja i wstępna kontrola wersji alfa Tideclaw używa odpowiadającej jej gałęzi alfa.
  - Stabilne wydania npm domyślnie używają `beta`; publikacja stabilnego wydania npm może jawnie wskazać `latest` za pomocą danych wejściowych przepływu pracy.
  - Modyfikacja dist-tag npm oparta na tokenie znajduje się w `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, ponieważ `npm dist-tag add` nadal wymaga `NPM_TOKEN`, podczas gdy repozytorium źródłowe zachowuje publikację wyłącznie przez OIDC.
  - Publiczny `macOS Release` służy wyłącznie do walidacji; jeśli tag istnieje tylko na gałęzi wydania, ale przepływ pracy jest wywoływany z `main`, ustaw `public_release_branch=release/YYYY.M.PATCH`.
  - Rzeczywista publikacja macOS musi przejść pomyślnie kontrole macOS `preflight_run_id` i `validate_run_id`.
  - Rzeczywiste ścieżki publikacji promują przygotowane artefakty zamiast ponownie je kompilować.
- W przypadku stabilnych wydań korygujących, takich jak `YYYY.M.PATCH-N`, weryfikator po publikacji sprawdza również tę samą ścieżkę aktualizacji z prefiksem tymczasowym z `YYYY.M.PATCH` do `YYYY.M.PATCH-N`, aby poprawki wydania nie mogły niezauważenie pozostawić starszych instalacji globalnych z podstawowym stabilnym ładunkiem.
- Wstępna kontrola wydania npm kończy się niepowodzeniem, jeśli tarball nie zawiera zarówno `dist/control-ui/index.html`, jak i niepustego ładunku `dist/control-ui/assets/`, aby nie opublikować ponownie pustego panelu przeglądarkowego.
- Weryfikacja po publikacji sprawdza również, czy opublikowane punkty wejścia pluginów i metadane pakietów są obecne w układzie zainstalowanego rejestru. Wydanie bez wymaganych ładunków środowiska uruchomieniowego pluginów nie przechodzi weryfikatora po publikacji i nie może zostać promowane do `latest`.
- `pnpm test:install:smoke` egzekwuje również budżet `unpackedSize` dla npm pack względem tarballa aktualizacji kandydata, dzięki czemu instalacyjne e2e wykrywa przypadkowe zwiększenie rozmiaru paczki przed ścieżką publikacji wydania.
- Jeśli prace nad wydaniem obejmowały planowanie CI, manifesty czasów rozszerzeń lub macierze testów rozszerzeń, przed zatwierdzeniem ponownie wygeneruj i przejrzyj wyniki macierzy `plugin-prerelease-extension-shard` należące do planera z `.github/workflows/plugin-prerelease.yml`, aby informacje o wydaniu nie opisywały nieaktualnego układu CI.
- Gotowość stabilnego wydania macOS obejmuje również powierzchnie aktualizatora: wydanie GitHub musi ostatecznie zawierać spakowane `.zip`, `.dmg` i `.dSYM.zip`; `appcast.xml` w `main` musi po publikacji wskazywać nowy stabilny plik zip (przepływ publikacji macOS zatwierdza go automatycznie lub otwiera PR appcast, gdy bezpośrednie wypchnięcie jest zablokowane); spakowana aplikacja musi zachować identyfikator pakietu inny niż debugowy, niepusty adres URL kanału Sparkle oraz `CFBundleVersion` na poziomie co najmniej kanonicznego minimum kompilacji Sparkle dla tej wersji wydania.

## Środowiska testowe wydania

`Full Release Validation` umożliwia operatorom uruchomienie pełnej macierzy produktu z jednego punktu wejścia. Użyj narzędzia pomocniczego, aby każdy podrzędny przepływ pracy działał z tymczasowej gałęzi przypiętej do jednego zaufanego SHA przepływu pracy `main`, podczas gdy żądany commit pozostaje testowanym kandydatem:

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

Narzędzie pomocnicze pobiera bieżący `origin/main`, wypycha `release-ci/<workflow-sha>-...` z tym zaufanym commitem przepływu pracy, wyprowadza `beta` z wersji pakietów alfa/beta, a w pozostałych przypadkach `stable`, wywołuje `Full Release Validation` z tymczasowej gałęzi z `ref=<target-sha>`, sprawdza, czy każdy podrzędny przepływ pracy `headSha` odpowiada przypiętemu SHA nadrzędnego przepływu pracy, a następnie usuwa tymczasową gałąź. Przekaż `-f reuse_evidence=false`, aby wymusić nowy przebieg, `-f release_profile=full` dla szerokiego opcjonalnego przeglądu lub `--workflow-sha <trusted-main-sha>`, aby przypiąć starszy commit, który nadal jest osiągalny z bieżącego `origin/main`. Sam przepływ pracy nigdy nie zapisuje referencji repozytorium. Dzięki temu narzędzia wydania dostępne wyłącznie na gałęzi main pozostają dostępne bez dodawania commitów narzędziowych do kandydata i można uniknąć przypadkowego potwierdzenia nowszego podrzędnego przebiegu `main`.

Gdy Code SHA ma stan zielony, zatwierdź wyłącznie `CHANGELOG.md` i uruchom to samo narzędzie pomocnicze z Release SHA:

```bash
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH
```

Drugi przebieg nadrzędny ponownie wykorzystuje dowody produktu tylko wtedy, gdy GitHub potwierdzi, że Release SHA pochodzi od Code SHA, a pełny zestaw zmienionych ścieżek to dokładnie `CHANGELOG.md`. Rejestruje `changelog-only-release-v1` i nie wywołuje żadnych procesów podrzędnych produktu. Wstępna kontrola npm oraz akceptacja pakietu/instalacji nadal działają na Release SHA, ponieważ zmieniły się bajty jego tarballa.

Dla nowego Code SHA przepływ pracy rozpoznaje cel, wywołuje ręczny `CI`, a następnie `OpenClaw Release Checks`. `OpenClaw Release Checks` rozdziela test dymny instalacji, kontrole wydania między systemami operacyjnymi, pokrycie ścieżki wydania Docker na żywo/E2E, gdy włączony jest test długotrwały, akceptację pakietu z kanonicznym E2E pakietu Telegram, zgodność QA Lab, Matrix na żywo i Telegram na żywo. Pełny przebieg typu all jest akceptowalny tylko wtedy, gdy podsumowanie `Full Release Validation` wskazuje `normal_ci`, `plugin_prerelease` i `release_checks` jako zakończone powodzeniem, chyba że ukierunkowane ponowne uruchomienie celowo pominęło osobny proces podrzędny `Plugin Prerelease`. Używaj samodzielnego procesu podrzędnego `npm-telegram` tylko do ukierunkowanego ponownego uruchomienia opublikowanego pakietu z `release_package_spec` lub `npm_telegram_package_spec`. Końcowe podsumowanie weryfikatora zawiera tabele najwolniejszych zadań dla każdego przebiegu podrzędnego, dzięki czemu menedżer wydania może zobaczyć bieżącą ścieżkę krytyczną bez pobierania dzienników.

Proces podrzędny wydajności produktu w tej ścieżce wydania działa wyłącznie na artefaktach. Nadrzędny
przepływ wywołuje go z `publish_reports=false`, a walidacja zostaje odrzucona,
jeśli jego zabezpieczenie trybu wyłącznie artefaktowego nie potwierdzi, że publikator raportu Clawgrit pozostał
pominięty.

Pełną macierz etapów, dokładne nazwy zadań przepływu pracy, różnice między profilem stabilnym a pełnym, artefakty oraz uchwyty ukierunkowanych ponownych uruchomień opisano w sekcji [Pełna walidacja wydania](/pl/reference/full-release-validation).

Podrzędne przepływy pracy są wywoływane z zaufanej referencji przypiętej do SHA, która uruchamia `Full Release Validation`. Każdy przebieg podrzędny musi używać dokładnego SHA nadrzędnego przepływu pracy. Nie używaj bezpośrednich wywołań `--ref main -f ref=<sha>` jako dowodu wydania; użyj `pnpm ci:full-release --sha <target-sha> --target-ref release/YYYY.M.PATCH`.

Użyj `release_profile`, aby wybrać zakres działania na żywo/dostawców:

- `beta`: najszybsza, krytyczna dla wydania ścieżka OpenAI/core na żywo i Docker
- `stable`: wersja beta oraz pokrycie stabilnych dostawców/backendów do zatwierdzenia wydania
- `full`: profil stabilny oraz szerokie opcjonalne pokrycie dostawców/multimediów

Walidacja stabilna i pełna zawsze uruchamiają przed promocją wyczerpujące testy na żywo/E2E, ścieżkę wydania Docker oraz ograniczony przegląd zachowania aktualizacji opublikowanych pakietów. Użyj `run_release_soak=true`, aby zażądać tego samego przeglądu dla wersji beta. Przegląd obejmuje cztery najnowsze stabilne pakiety oraz przypięte poziomy bazowe `2026.4.23` i `2026.5.2`, a także pokrycie starszych `2026.4.15`; zduplikowane poziomy bazowe są usuwane, a każdy poziom bazowy jest dzielony na osobne zadanie runnera Docker.

`OpenClaw Release Checks` używa zaufanej referencji przepływu pracy, aby jednokrotnie rozpoznać referencję docelową jako `release-package-under-test`, i ponownie wykorzystuje ten artefakt w kontrolach między systemami operacyjnymi, akceptacji pakietu oraz kontrolach ścieżki wydania Docker podczas testu długotrwałego. Dzięki temu wszystkie środowiska dotyczące pakietu używają tych samych bajtów i unikają wielokrotnych kompilacji pakietu. Gdy wersja beta jest już dostępna w npm, ustaw `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`, aby kontrole wydania jednokrotnie pobrały opublikowany pakiet, wyodrębniły SHA źródła kompilacji z `dist/build-info.json` i ponownie wykorzystały ten artefakt w kontrolach między systemami operacyjnymi, akceptacji pakietu, ścieżce wydania Docker oraz ścieżkach pakietu Telegram.

Międzysystemowy test dymny instalacji OpenAI używa `OPENCLAW_CROSS_OS_OPENAI_MODEL`, gdy ustawiono zmienną repozytorium/organizacji, a w przeciwnym razie `openai/gpt-5.6-luna`, ponieważ ta ścieżka potwierdza instalację pakietu, wdrażanie, uruchomienie Gateway oraz pojedynczy przebieg agenta na żywo, a nie porównuje możliwości najbardziej zaawansowanego modelu. Szersza macierz dostawców na żywo pozostaje miejscem pokrycia specyficznego dla modeli.

Użyj tych wariantów zależnie od etapu wydania:

```bash
# Zweryfikuj SHA kodu kompletnego produktu.
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH

# Zweryfikuj SHA wydania obejmującego tylko dziennik zmian, ponownie wykorzystując dowody produktu dla SHA kodu.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH

# Po opublikowaniu wersji beta dodaj test E2E Telegram dla opublikowanego pakietu.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Nie używaj pełnego procesu nadrzędnego jako pierwszego ponownego uruchomienia po ukierunkowanej poprawce. Jeśli jedno środowisko zakończy się niepowodzeniem, jako kolejnego dowodu użyj zakończonego niepowodzeniem podrzędnego przepływu pracy, zadania, ścieżki Docker, profilu pakietu, dostawcy modelu lub ścieżki QA. Ponownie uruchom pełny proces nadrzędny tylko wtedy, gdy poprawka zmieniła współdzieloną orkiestrację wydania lub zdezaktualizowała wcześniejsze dowody ze wszystkich środowisk. Końcowy weryfikator procesu nadrzędnego ponownie sprawdza zapisane identyfikatory uruchomień podrzędnych przepływów pracy, dlatego po pomyślnym ponownym uruchomieniu podrzędnego przepływu pracy uruchom ponownie tylko zakończone niepowodzeniem zadanie nadrzędne `Verify full validation`.

`rerun_group=all` może ponownie wykorzystać wcześniejsze pomyślne uruchomienie procesu nadrzędnego, gdy profil wydania,
obowiązujące ustawienie testu długotrwałego i dane wejściowe walidacji są zgodne, a docelowy SHA
jest identyczny albo nowy cel jest potomkiem, którego pełny zestaw zmienionych ścieżek
to dokładnie `CHANGELOG.md`. Ponowne wykorzystanie dokładnego celu zapisuje
`exact-target-full-validation-v1`; SHA wydania po walidacji zapisuje
`changelog-only-release-v1`. Ten drugi wariant ponownie wykorzystuje wyłącznie walidację produktu. Wstępna
kontrola npm, bajty pakietu, pochodzenie informacji o wydaniu oraz akceptacja instalacji/aktualizacji
muszą nadal zostać przeprowadzone względem SHA wydania. Każda zmiana wersji, źródła, wygenerowanych
elementów, zależności, pakietu lub celu należącego do przepływu pracy wymaga nowego SHA kodu
i nowej pełnej walidacji. Nowsze uruchomienia procesu nadrzędnego dla tego samego odwołania `release/*` i
grupy ponownych uruchomień automatycznie zastępują trwające uruchomienia. Przekaż
`reuse_evidence=false`, aby wymusić nowe pełne uruchomienie.

W celu ograniczonego odzyskiwania przekaż `rerun_group` do procesu nadrzędnego. `all` jest właściwym uruchomieniem kandydata do wydania, `ci` uruchamia wyłącznie standardowy podrzędny proces CI, `plugin-prerelease` uruchamia wyłącznie podrzędny proces Plugin przeznaczony tylko dla wydania, `release-checks` uruchamia wszystkie środowiska wydania, a węższe grupy wydania to `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` i `npm-telegram`. Ukierunkowane ponowne uruchomienia `npm-telegram` wymagają `release_package_spec` lub `npm_telegram_package_spec`; pełne/wszystkie uruchomienia korzystają z kanonicznego testu E2E Telegram pakietu w ramach akceptacji pakietu. Ukierunkowane ponowne uruchomienia między systemami operacyjnymi mogą dodać `cross_os_suite_filter=windows/packaged-upgrade` lub inny filtr systemu operacyjnego/zestawu. Niepowodzenia kontroli wydania QA blokują standardową walidację wydania, w tym wymagane wykrywanie rozbieżności dynamicznych narzędzi OpenClaw w standardowym poziomie. Uruchomienia alfa Tideclaw mogą nadal traktować ścieżki kontroli wydania niezwiązane z bezpieczeństwem pakietu jako informacyjne. Przy `release_profile=beta` zestawy dostawców działających na żywo `Run repo/live E2E validation` są informacyjne (ostrzeżenia, nie blokady); profile stabilne i pełne nadal traktują je jako blokujące. Gdy `live_suite_filter` jawnie żąda kontrolowanej ścieżki QA działającej na żywo, takiej jak Discord, WhatsApp lub Slack, odpowiednia zmienna repozytorium `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` musi być włączona; w przeciwnym razie przechwytywanie danych wejściowych kończy się niepowodzeniem zamiast po cichu pomijać ścieżkę.

### Vitest

Środowisko Vitest jest ręcznym podrzędnym przepływem pracy `CI`. Ręczny proces CI celowo pomija ograniczanie zakresu według zmian i wymusza standardowy graf testów dla kandydata do wydania: fragmenty Linux Node, fragmenty dołączonych Pluginów, fragmenty kontraktów Pluginów i kanałów, zgodność z Node 22, `check-*`, `check-additional-*`, testy dymne zbudowanych artefaktów, kontrole dokumentacji, Skills Python, Windows, macOS oraz internacjonalizację interfejsu Control UI. Android jest uwzględniany, gdy `Full Release Validation` uruchamia środowisko, ponieważ proces nadrzędny przekazuje `include_android=true`; samodzielny ręczny proces CI wymaga `include_android=true`, aby objąć Androida.

Użyj tego środowiska, aby odpowiedzieć na pytanie „czy drzewo źródłowe przeszło pełny standardowy zestaw testów?”. Nie jest to to samo co walidacja produktu na ścieżce wydania. Dowody, które należy zachować:

- podsumowanie `Full Release Validation` zawierające adres URL uruchomionego procesu `CI`
- pomyślne uruchomienie `CI` dla dokładnego docelowego SHA
- nazwy zakończonych niepowodzeniem lub powolnych fragmentów z zadań CI podczas badania regresji
- artefakty pomiarów czasu Vitest, takie jak `.artifacts/vitest-shard-timings.json`, gdy uruchomienie wymaga analizy wydajności

Uruchom ręczny proces CI bezpośrednio tylko wtedy, gdy wydanie wymaga deterministycznego standardowego procesu CI, ale nie środowisk Docker, QA Lab, działających na żywo, między systemami operacyjnymi ani pakietowych. Użyj pierwszego polecenia dla bezpośredniego procesu CI bez Androida. Dodaj `include_android=true`, gdy bezpośredni proces CI kandydata do wydania musi obejmować Androida:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Środowisko Docker znajduje się w `OpenClaw Release Checks` poprzez `openclaw-live-and-e2e-checks-reusable.yml`, wraz z przepływem pracy `install-smoke` w trybie wydania. Weryfikuje ono kandydata do wydania za pomocą spakowanych środowisk Docker, a nie wyłącznie testów na poziomie źródeł.

Zakres Docker dla wydania obejmuje:

- pełny test dymny instalacji z włączonym powolnym testem dymnym globalnej instalacji Bun
- przygotowanie/ponowne wykorzystanie obrazu testu dymnego głównego pliku Dockerfile według docelowego SHA, z zadaniami testów dymnych QR, root/Gateway oraz instalatora/Bun działającymi jako osobne fragmenty testów dymnych instalacji
- ścieżki E2E repozytorium
- fragmenty Docker ścieżki wydania: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, od `plugins-runtime-install-a` do `plugins-runtime-install-h` oraz `openwebui`
- zakres OpenWebUI na dedykowanym środowisku wykonawczym z dużym dyskiem, gdy jest wymagany
- rozdzielone ścieżki instalacji/dezinstalacji dołączonych Pluginów od `bundled-plugin-install-uninstall-0` do `bundled-plugin-install-uninstall-23`
- zestawy dostawców działających na żywo/E2E oraz zakres modeli działających na żywo w Dockerze, gdy kontrole wydania obejmują zestawy działające na żywo

Przed ponownym uruchomieniem użyj artefaktów Docker. Harmonogram ścieżki wydania przesyła `.artifacts/docker-tests/` z dziennikami ścieżek, `summary.json`, `failures.json`, czasami faz, planem harmonogramu w formacie JSON i poleceniami ponownego uruchomienia. W celu ukierunkowanego odzyskiwania użyj `docker_lanes=<lane[,lane]>` w wielokrotnego użytku przepływie pracy działającym na żywo/E2E zamiast ponownie uruchamiać wszystkie fragmenty wydania. Wygenerowane polecenia ponownego uruchomienia zawierają wcześniejsze `package_artifact_run_id` i przygotowane dane wejściowe obrazu Docker, jeśli są dostępne, dzięki czemu zakończona niepowodzeniem ścieżka może ponownie użyć tego samego archiwum tar i obrazów GHCR.

### QA Lab

Środowisko QA Lab jest również częścią `OpenClaw Release Checks`. Jest to bramka wydania dotycząca zachowania agentowego i poziomu kanału, oddzielna od mechaniki pakietów Vitest i Docker.

Zakres QA Lab dla wydania obejmuje:

- ścieżkę zgodności z atrapami, porównującą ścieżkę kandydata OpenAI z punktem odniesienia `anthropic/claude-opus-4-8` przy użyciu pakietu zgodności agentowej
- profil wydania adaptera Matrix działającego na żywo przy użyciu środowiska `qa-live-shared`
- ścieżkę QA Telegram działającą na żywo przy użyciu dzierżaw poświadczeń Convex CI
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` lub `pnpm qa:observability:smoke`, gdy telemetria wydania wymaga jawnego dowodu lokalnego

Użyj tego środowiska, aby odpowiedzieć na pytanie „czy wydanie zachowuje się poprawnie w scenariuszach QA i przepływach kanałów działających na żywo?”. Podczas zatwierdzania wydania zachowaj adresy URL artefaktów dla ścieżek zgodności, Matrix i Telegram. Pełny zakres Matrix pozostaje dostępny jako ręczne, podzielone na fragmenty uruchomienie QA Lab, a nie jako domyślna ścieżka krytyczna dla wydania.

### Pakiet

Środowisko pakietu jest bramką instalowalnego produktu. Jest obsługiwane przez `Package Acceptance` i mechanizm rozpoznawania `scripts/resolve-openclaw-package-candidate.mjs`. Mechanizm rozpoznawania normalizuje kandydata do archiwum `package-under-test` używanego przez Docker E2E, weryfikuje zawartość pakietu, zapisuje wersję pakietu i SHA-256 oraz utrzymuje odwołanie środowiska przepływu pracy oddzielnie od odwołania źródła pakietu.

Obsługiwane źródła kandydatów:

- `source=npm`: `openclaw@beta`, `openclaw@latest` lub dokładna wersja wydania OpenClaw
- `source=ref`: spakuj zaufaną gałąź `package_ref`, tag lub pełny SHA commitu przy użyciu wybranego środowiska `workflow_ref`
- `source=url`: pobierz publiczny zasób HTTPS `.tgz` z wymaganym `package_sha256`; poświadczenia w adresie URL, niestandardowe porty HTTPS, prywatne/wewnętrzne/specjalnego przeznaczenia nazwy hostów lub rozpoznane adresy oraz niebezpieczne przekierowania są odrzucane
- `source=trusted-url`: pobierz zasób HTTPS `.tgz` z wymaganymi `package_sha256` i `trusted_source_id` z nazwanej polityki w `.github/package-trusted-sources.json`; używaj tego dla należących do opiekunów firmowych serwerów lustrzanych lub prywatnych repozytoriów pakietów zamiast dodawania do `source=url` obejścia sieci prywatnej na poziomie danych wejściowych
- `source=artifact`: ponownie użyj `.tgz` przesłanego przez inne uruchomienie GitHub Actions

`OpenClaw Release Checks` uruchamia akceptację pakietu z `source=artifact`, przygotowanym artefaktem pakietu wydania, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. Akceptacja pakietu zachowuje migrację, aktualizację, aktualizację VPS zarządzanego przez użytkownika root, ponowne uruchomienie po aktualizacji ze skonfigurowanym uwierzytelnianiem, instalację Skills z ClawHub działającego na żywo, usuwanie nieaktualnych zależności Pluginów, działające offline dane testowe Pluginów, aktualizację Pluginów, zabezpieczenie przed ucieczką z powiązań poleceń Pluginów oraz QA pakietu Telegram względem tego samego rozpoznanego archiwum tar. Blokujące kontrole wydania używają domyślnego punktu odniesienia najnowszego opublikowanego pakietu; profil beta z `run_release_soak=true`, `release_profile=stable` lub `release_profile=full` rozszerza test zachowania zgodności po aktualizacji opublikowanych pakietów do `last-stable-4` oraz przypiętych punktów odniesienia `2026.4.23`, `2026.5.2` i `2026.4.15` ze scenariuszami `reported-issues`. Użyj akceptacji pakietu z `source=npm` dla już wydanego kandydata, `source=ref` dla lokalnego archiwum tar npm opartego na SHA przed publikacją, `source=trusted-url` dla należącego do opiekunów firmowego/prywatnego serwera lustrzanego lub `source=artifact` dla przygotowanego archiwum tar przesłanego przez inne uruchomienie GitHub Actions.

Jest to natywny dla GitHub zamiennik większości zakresu pakietów/aktualizacji, który wcześniej wymagał Parallels. Kontrole wydania między systemami operacyjnymi nadal mają znaczenie dla wdrażania, instalatora i zachowania specyficznego dla systemu operacyjnego, ale walidacja produktu dotycząca pakietów/aktualizacji powinna preferować akceptację pakietu.

Kanoniczną listą kontrolną walidacji aktualizacji i Pluginów jest [Testowanie aktualizacji i Pluginów](/pl/help/testing-updates-plugins). Użyj jej podczas ustalania, która lokalna ścieżka, ścieżka Docker, akceptacji pakietu lub kontroli wydania stanowi dowód zmiany instalacji/aktualizacji Pluginu, czyszczenia przez doctor lub migracji opublikowanego pakietu. Wyczerpująca migracja aktualizacji ze wszystkich stabilnych pakietów `2026.4.23+` jest oddzielnym ręcznym przepływem pracy `Update Migration`, a nie częścią pełnego procesu CI wydania.

Ułatwienia starszego mechanizmu akceptacji pakietów są celowo ograniczone czasowo. Pakiety do `2026.4.25` włącznie mogą korzystać ze ścieżki zgodności dla braków metadanych już opublikowanych w npm: prywatnych wpisów spisu QA brakujących w archiwum tar, brakującego `gateway install --wrapper`, brakujących plików poprawek w danych testowych git utworzonych z archiwum tar, brakującego utrwalonego `update.channel`, starszych lokalizacji rekordów instalacji Pluginów, brakującego utrwalania rekordów instalacji z platformy marketplace oraz migracji metadanych konfiguracji podczas `plugins update`. Opublikowany pakiet `2026.4.26` może ostrzegać o lokalnych plikach znaczników metadanych kompilacji, które zostały już wydane. Późniejsze pakiety muszą spełniać nowoczesne kontrakty pakietów; te same braki powodują niepowodzenie walidacji wydania.

Użyj szerszych profili akceptacji pakietu, gdy pytanie dotyczące wydania odnosi się do rzeczywistego instalowalnego pakietu:

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

- `smoke`: szybka instalacja pakietu/kanału/agenta, sieć Gateway oraz ścieżki przeładowania konfiguracji
- `package`: kontrakty instalacji/aktualizacji/ponownego uruchomienia/pakietów pluginów oraz dowód instalacji na żywo umiejętności ClawHub; jest to domyślna kontrola wydania
- `product`: `package` oraz kanały MCP, czyszczenie zadań cron/subagentów, wyszukiwanie internetowe OpenAI i OpenWebUI
- `full`: fragmenty ścieżki wydania Docker z OpenWebUI
- `custom`: dokładna lista `docker_lanes` do ukierunkowanych ponownych uruchomień

Aby zweryfikować Telegram dla kandydata pakietu, należy włączyć `telegram_mode=mock-openai` lub `telegram_mode=live-frontier` w Package Acceptance. Przepływ pracy przekazuje rozwiązany plik tarball `package-under-test` do ścieżki Telegram; samodzielny przepływ pracy Telegram nadal przyjmuje opublikowaną specyfikację npm na potrzeby kontroli po publikacji.

## Automatyzacja publikacji regularnego wydania

W przypadku wersji beta, `latest`, pluginu, GitHub Release i publikacji na platformach
`OpenClaw Release Publish` jest standardowym punktem wejścia wprowadzającym zmiany. Comiesięczna
ścieżka extended-stable `.33+` obejmująca wyłącznie npm nie używa tego koordynatora. Ten
regularny przepływ pracy koordynuje przepływy pracy zaufanego wydawcy w kolejności wymaganej
przez wydanie:

1. Pobierz tag wydania i rozwiąż SHA jego commitu.
2. Sprawdź, czy tag jest osiągalny z `main` lub `release/*` (albo z gałęzi alfa Tideclaw w przypadku wydań wstępnych alfa).
3. Uruchom `pnpm plugins:sync:check`.
4. Wywołaj `Plugin NPM Release` z `publish_scope=all-publishable` i `ref=<release-sha>`.
5. Wywołaj `Plugin ClawHub Release` z tym samym zakresem i SHA.
6. Wywołaj `OpenClaw NPM Release` z tagiem wydania, tagiem dystrybucyjnym npm i zapisanym `preflight_run_id` po zweryfikowaniu zapisanego `full_release_validation_run_id` oraz dokładnej próby uruchomienia.
7. W przypadku wydań stabilnych utwórz lub zaktualizuj wydanie GitHub jako wersję roboczą, wywołaj `Windows Node Release` z jawnym `windows_node_tag` i zatwierdzonym dla kandydata `windows_node_installer_digests`, a następnie zweryfikuj kanoniczne zasoby instalatora Windows i sum kontrolnych. Wywołaj również `Android Release`, aby zbudować podpisany plik APK dokładnie dla danego tagu wraz z sumą kontrolną i pochodzeniem. Przed opublikowaniem wersji roboczej zweryfikuj oba kontrakty zasobów natywnych.

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

Publikacja wersji stabilnej do domyślnego tagu dystrybucyjnego beta:

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

Bezpośrednia promocja wersji stabilnej do `latest` jest jawna:

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

Przepływów pracy niższego poziomu `Plugin NPM Release` i `Plugin ClawHub Release` należy używać wyłącznie do ukierunkowanych napraw lub ponownej publikacji. `OpenClaw Release Publish` odrzuca `plugin_publish_scope=selected`, gdy `publish_openclaw_npm=true`, aby pakiet podstawowy nie mógł zostać wydany bez wszystkich możliwych do opublikowania oficjalnych pluginów, w tym `@openclaw/diffs-language-pack`. W przypadku naprawy wybranego pluginu należy ustawić `publish_openclaw_npm=false` wraz z `plugin_publish_scope=selected` i `plugins=@openclaw/name` albo wywołać bezpośrednio podrzędny przepływ pracy.

Wyjątkiem jest początkowe uruchomienie pierwszej publikacji ClawHub: należy wywołać `Plugin ClawHub New`
z zaufanego `main` i przekazać pełny SHA docelowego wydania przez `ref`.
Nigdy nie należy uruchamiać samego przepływu początkowego z tagu ani gałęzi wydania:

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

Walidacja przed utworzeniem tagu wymaga `dry_run=true`, odrzuca dane wejściowe
tagu wydania i uruchomienia nadrzędnego oraz przyjmuje wyłącznie dokładny cel osiągalny z `main` lub `release/*`.
Nie ładuje danych uwierzytelniających ClawHub, nie publikuje bajtów pakietu ani nie zmienia konfiguracji
zaufanego wydawcy. Przepływ pracy nadal rozwiązuje plan rejestru na żywo,
pobiera i pakuje cel wyłącznie w zadaniu bez sekretów, materializuje
zablokowany zestaw narzędzi ClawHub oraz weryfikuje niezmienny artefakt i slug/tożsamość
pakietu przed powstaniem tagu wydania. Środowisko
`clawhub-plugin-bootstrap` należy zatwierdzić dopiero po zakończeniu zadań pakowania bez sekretów;
to chronione zadanie walidacyjne nie ma danych uwierzytelniających ani poleceń wprowadzających zmiany.

Zatwierdzone uruchomienie próbne lub rzeczywiste uruchomienie początkowe po utworzeniu tagu musi zawierać dokładny
tag wydania oraz identyfikator uruchomienia nadrzędnego `OpenClaw Release Publish`, próbę i
gałąź. Element nadrzędny poświadcza SHA własnego przepływu pracy oraz oddzielny, dokładny, zaufany
SHA `main` dla `Plugin ClawHub New`; uruchomienie podrzędne i każde zatwierdzenie chronionego
środowiska muszą odpowiadać temu zatwierdzonemu podrzędnemu SHA. Tag wydania jest
ponownie sprawdzany przed każdą próbą publikacji i zmianą zaufanego wydawcy.

Zadanie pakowania
przesyła jeden niezmienny artefakt, którego nazwa, identyfikator/suma skrótu artefaktu Actions,
uruchomienie/próba producenta, docelowy SHA oraz SHA-256/rozmiar pliku tarball każdego pakietu są
przenoszone do zadań walidacyjnych i chronionych. Chronione zadanie pobiera wyłącznie zaufane narzędzia `main`,
weryfikuje krotkę artefaktu za pośrednictwem interfejsu API GitHub, pobiera
według dokładnego identyfikatora artefaktu, ponownie oblicza skrót każdego pliku tarball oraz weryfikuje lokalne ścieżki TAR i
tożsamość pakietu zgodnie z regułami kanonizacji USTAR przypiętego CLI. Każdy
kandydat następnie przechodzi próbne uruchomienie publikacji przypiętego CLI, które kończy się przed
wyszukiwaniem w rejestrze lub uwierzytelnianiem. Filtr wstępny zadania z danymi uwierzytelniającymi ogranicza skompresowane ClawPacks
do 120 MiB, łączną zawartość plików do 50 MiB, rozwinięte dane TAR do 64 MiB, a
liczbę wpisów TAR do 10,000. Naprawa zaufanego wydawcy istniejącego pakietu nadal
ogranicza się do konfiguracji, ale wciąż pakuje cel i wymaga zgodności żądanego tagu
oraz dokładnych bajtów i metadanych rejestru przed zmianą konfiguracji zaufanego wydawcy.
Weryfikacja po publikacji pobiera artefakt ClawHub i
wymaga identycznego SHA-256 i rozmiaru. Odzyskiwanie za pomocą ponownego uruchomienia nieudanych zadań może ponownie wykorzystać artefakt pakietu z wcześniejszej
próby wyłącznie wtedy, gdy dokładne zadanie producenta zakończyło się
pomyślnie. Końcowy materiał dowodowy wiąże również zablokowaną wersję ClawHub, SHA-256
pliku blokady oraz integralność npm. Niezgodność wymaga nowej wersji pakietu.

## Dane wejściowe przepływu pracy NPM

`OpenClaw NPM Release` przyjmuje następujące dane wejściowe kontrolowane przez operatora:

- `tag`: wymagany tag wydania, taki jak `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` lub `v2026.4.2-alpha.1`; gdy `preflight_only=true`, może to być również bieżący pełny, 40-znakowy SHA commitu gałęzi przepływu pracy na potrzeby wstępnej walidacji
- `preflight_only`: `true` wyłącznie do walidacji/budowania/pakowania, `false` dla rzeczywistej ścieżki publikacji
- `preflight_run_id`: identyfikator istniejącego pomyślnego uruchomienia wstępnego, wymagany na rzeczywistej ścieżce publikacji, aby przepływ pracy ponownie wykorzystał przygotowany plik tarball zamiast go przebudowywać
- `full_release_validation_run_id`: identyfikator pomyślnego uruchomienia `Full Release Validation` dla tego tagu/SHA, wymagany do rzeczywistej publikacji. Publikacje beta mogą być kontynuowane wyłącznie na podstawie kontroli wstępnej z ostrzeżeniem, ale promocja wersji stabilnej/`latest` nadal go wymaga.
- `full_release_validation_run_attempt`: dokładna dodatnia próba uruchomienia powiązana z `full_release_validation_run_id`; wymagana zawsze, gdy podano identyfikator uruchomienia, aby ponowne uruchomienia nie mogły zmienić materiału autoryzacyjnego podczas publikacji.
- `release_publish_run_id`: identyfikator zatwierdzonego uruchomienia `OpenClaw Release Publish`; wymagany, gdy ten przepływ pracy jest wywoływany przez ten element nadrzędny (wywołania rzeczywistej publikacji przez aktora-bota)
- `plugin_npm_run_id`: identyfikator pomyślnego uruchomienia `Plugin NPM Release` dokładnie dla bieżącego punktu HEAD; wymagany do rzeczywistej publikacji podstawowego pakietu `extended-stable`
- `npm_dist_tag`: docelowy tag npm dla ścieżki publikacji; przyjmuje `alpha`, `beta`, `latest` lub `extended-stable`, a wartością domyślną jest `beta`. Końcowy patch `33` i późniejsze muszą używać `extended-stable`; domyślnie `extended-stable` odrzuca wcześniejsze patche i zawsze odrzuca tagi niekońcowe.
- `bypass_extended_stable_guard`: wartość logiczna wyłącznie do testów, domyślnie `false`; w połączeniu z `npm_dist_tag=extended-stable` omija comiesięczne kryteria kwalifikacji extended-stable, zachowując kontrole tożsamości wydania, artefaktu, zatwierdzenia i odczytu zwrotnego.

`Plugin NPM Release` przyjmuje `npm_dist_tag=default` dla istniejącego zachowania
wydania lub `npm_dist_tag=extended-stable` dla chronionej ścieżki comiesięcznej. Opcja
extended-stable wymaga `publish_scope=all-publishable`, pustej wartości wejściowej
`plugins`, końcowego patcha na poziomie `33` lub wyższym oraz kanonicznej
gałęzi `extended-stable/YYYY.M.33` dokładnie na jej końcu. Nigdy nie przenosi pluginów
`latest` ani `beta`. Nowe wersje pakietów otrzymują `extended-stable` atomowo
za pośrednictwem zaufanej publikacji OIDC (`npm publish --tag extended-stable`); ten
źródłowy przepływ pracy nie używa uwierzytelnianego tokenem `npm dist-tag add`. Ponowne próby
pomijają dokładne wersje już obecne w npm, a następnie kończą się błędem w trybie zamkniętym, chyba że pełny
odczyt zwrotny potwierdzi zbieżność każdego dokładnego pakietu i tagu `extended-stable`.

`OpenClaw Release Publish` przyjmuje następujące dane wejściowe kontrolowane przez operatora:

- `tag`: wymagany tag wydania; musi już istnieć
- `preflight_run_id`: identyfikator pomyślnego uruchomienia wstępnego `OpenClaw NPM Release`; wymagany, gdy `publish_openclaw_npm=true` lub `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id`: identyfikator pomyślnego uruchomienia `Full Release Validation`; wymagany, gdy `publish_openclaw_npm=true` lub `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt`: dokładna dodatnia próba powiązana z `full_release_validation_run_id`; wymagana zawsze, gdy podano identyfikator uruchomienia
- `windows_node_tag`: dokładny tag wydania `openclaw/openclaw-windows-node`, który nie jest tagiem wydania wstępnego; wymagany do publikacji stabilnej wersji OpenClaw
- `windows_node_installer_digests`: zatwierdzona dla kandydata kompaktowa mapa JSON bieżących nazw instalatorów Windows na ich przypięte sumy skrótu `sha256:`; wymagana do publikacji stabilnej wersji OpenClaw
- `npm_telegram_run_id`: opcjonalny identyfikator pomyślnego uruchomienia `NPM Telegram Beta E2E`, który ma zostać uwzględniony w końcowym materiale dowodowym wydania
- `npm_dist_tag`: docelowy tag npm dla pakietu OpenClaw, jeden z `alpha`, `beta` lub `latest`
- `plugin_publish_scope`: domyślnie `all-publishable`; wartości `selected` należy używać wyłącznie do ukierunkowanych napraw dotyczących tylko pluginów wraz z `publish_openclaw_npm=false`
- `plugins`: rozdzielone przecinkami nazwy pakietów `@openclaw/*`, gdy `plugin_publish_scope=selected`
- `publish_openclaw_npm`: domyślnie `true`; wartość `false` należy ustawiać wyłącznie podczas używania przepływu pracy jako koordynatora napraw dotyczących tylko pluginów
- `release_profile`: profil pokrycia wydania używany w podsumowaniach materiału dowodowego wydania; domyślnie `from-validation`, co powoduje odczyt z manifestu walidacji, albo można go zastąpić wartością `beta`, `stable` lub `full`
- `wait_for_clawhub`: domyślnie `false`, aby dostępność npm nie była blokowana przez proces pomocniczy ClawHub; wartość `true` należy ustawić wyłącznie wtedy, gdy ukończenie przepływu pracy musi obejmować ukończenie ClawHub

`OpenClaw Release Checks` przyjmuje następujące dane wejściowe kontrolowane przez operatora:

- `ref`: gałąź, tag lub pełny SHA commitu do zweryfikowania. Kontrole wykorzystujące sekrety wymagają, aby wskazany commit był osiągalny z gałęzi OpenClaw lub tagu wydania.
- `run_release_soak`: włącza wyczerpujące testy live/E2E, ścieżkę wydania Docker oraz długotrwałe testy przetrwania aktualizacji ze wszystkich wcześniejszych wersji na potrzeby kontroli wydania beta. Jest wymuszane przez `release_profile=stable` i `release_profile=full`.

Reguły:

- Zwykłe wersje finalne i korygujące poniżej poprawki `33` mogą być publikowane do `beta` lub `latest`. Wersje finalne z poprawką `33` lub wyższą muszą być publikowane do `extended-stable`, a wersje z sufiksem korygującym na tej granicy są odrzucane.
- Tagi wersji przedpremierowych beta mogą być publikowane wyłącznie do `beta`; tagi wersji przedpremierowych alpha mogą być publikowane wyłącznie do `alpha`
- W przypadku `OpenClaw NPM Release` podanie pełnego SHA commitu jest dozwolone wyłącznie wtedy, gdy `preflight_only=true`
- `OpenClaw Release Checks` i `Full Release Validation` zawsze służą wyłącznie do walidacji
- Rzeczywista ścieżka publikacji musi używać tego samego `npm_dist_tag`, którego użyto podczas kontroli wstępnej; przepływ pracy weryfikuje te metadane przed kontynuowaniem publikacji

## Standardowa sekwencja wydania beta/najnowszego stabilnego

Ta starsza sekwencja dotyczy standardowego, koordynowanego wydania, które obejmuje również pluginy, wydanie GitHub, system Windows i prace na innych platformach. Nie jest to udokumentowana na początku tej strony comiesięczna ścieżka rozszerzonego wydania stabilnego `.33+` przeznaczona wyłącznie dla npm.

Podczas przygotowywania standardowego, koordynowanego wydania stabilnego:

1. Uruchom `OpenClaw NPM Release` z `preflight_only=true`. Zanim powstanie tag, można użyć bieżącego pełnego SHA commitu gałęzi przepływu pracy do próbnego uruchomienia przepływu kontroli wstępnej, służącego wyłącznie do walidacji.
2. Wybierz `npm_dist_tag=beta` dla normalnego przepływu rozpoczynającego się od wersji beta albo `latest` tylko wtedy, gdy celowo wymagane jest bezpośrednie opublikowanie wersji stabilnej.
3. Uruchom `Full Release Validation` na gałęzi wydania, tagu wydania lub pełnym SHA commitu, aby jeden ręczny przepływ pracy wykonał standardowe CI oraz objął pamięć podręczną promptów live, Docker, QA Lab, Matrix i Telegram. Jeśli celowo potrzebny jest wyłącznie deterministyczny, standardowy graf testów, uruchom zamiast tego ręczny przepływ pracy `CI` dla odwołania wydania.
4. Wybierz dokładny, nieprzedpremierowy tag wydania `openclaw/openclaw-windows-node`, którego podpisane instalatory x64 i ARM64 mają zostać wydane. Zapisz go jako `windows_node_tag`, a mapę zweryfikowanych skrótów instalatorów jako `windows_node_installer_digests`. Narzędzie pomocnicze kandydata do wydania zapisuje obie wartości i uwzględnia je w wygenerowanym poleceniu publikacji.
5. Zapisz wartości z pomyślnie zakończonych `preflight_run_id`, `full_release_validation_run_id` oraz dokładną wartość `full_release_validation_run_attempt`.
6. Uruchom `OpenClaw Release Publish` z zaufanego `main`, używając tego samego `tag`, tego samego `npm_dist_tag`, wybranego `windows_node_tag`, jego zapisanej wartości `windows_node_installer_digests`, zapisanej wartości `preflight_run_id`, `full_release_validation_run_id` oraz `full_release_validation_run_attempt`. Publikuje to wydzielone pluginy w npm i ClawHub przed promowaniem pakietu OpenClaw w npm.
7. Jeśli wydanie trafiło do `beta`, użyj przepływu pracy `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, aby wypromować tę wersję stabilną z `beta` do `latest`.
8. Jeśli wydanie celowo opublikowano bezpośrednio do `latest`, a `beta` ma natychmiast wskazywać tę samą stabilną kompilację, użyj tego samego przepływu wydania, aby skierować oba tagi dystrybucyjne na wersję stabilną, albo pozwól zaplanowanej synchronizacji samonaprawczej przenieść `beta` później.

Modyfikacja tagów dystrybucyjnych znajduje się w repozytorium rejestru wydań, ponieważ nadal wymaga `NPM_TOKEN`, natomiast repozytorium źródłowe zachowuje publikowanie wyłącznie przez OIDC. Dzięki temu zarówno ścieżka bezpośredniej publikacji, jak i ścieżka promocji rozpoczynająca się od wersji beta pozostają udokumentowane i widoczne dla operatora.

Jeśli opiekun musi awaryjnie skorzystać z lokalnego uwierzytelniania npm, wszystkie polecenia CLI 1Password (`op`) należy uruchamiać wyłącznie w dedykowanej sesji tmux. Nie należy wywoływać `op` bezpośrednio z głównej powłoki agenta; uruchamianie go wewnątrz tmux zapewnia widoczność monitów, alertów i obsługi OTP oraz zapobiega powtarzającym się alertom hosta.

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

Opiekunowie korzystają z prywatnej dokumentacji wydań w [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md), zawierającej właściwą instrukcję wykonania.

## Powiązane

- [Kanały wydań](/pl/install/development-channels)
