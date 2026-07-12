---
read_when:
    - Uruchamianie lub ponowne uruchamianie pełnej walidacji wydania
    - Porównanie profili walidacji wersji stabilnej i pełnej wersji wydania
    - Debugowanie niepowodzeń etapów walidacji wydania
summary: Etapy pełnej walidacji wydania, podrzędne przepływy pracy, profile wydania, identyfikatory ponownego uruchomienia i materiały dowodowe
title: Pełna walidacja wydania
x-i18n:
    generated_at: "2026-07-12T15:33:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c152128a27b173f131bcf2754c7f06d7bf3e9f7d2d1d0f745ab999f53c78c9
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` to nadrzędny proces wydania: pojedynczy ręczny punkt wejścia
do weryfikacji przed wydaniem. Większość zadań jest wykonywana w podrzędnych przepływach pracy, dzięki czemu
zadanie zakończone niepowodzeniem można uruchomić ponownie bez ponownego rozpoczynania całego wydania.

Uruchom go z zaufanego odwołania przepływu pracy, zwykle `main`, i przekaż gałąź wydania,
tag lub pełny SHA commita jako `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

`provider` akceptuje również `anthropic` lub `minimax` na potrzeby wdrażania w różnych systemach operacyjnych oraz
pełnego przebiegu agenta. Zadania podrzędne wielokrotnego użytku ustalają środowisko wywoływanego przepływu pracy
na podstawie `job.workflow_repository` i `job.workflow_sha`, natomiast parametr wejściowy `ref`
wybiera testowanego kandydata. Dzięki temu bieżąca zaufana logika walidacji
pozostaje dostępna podczas walidowania starszej gałęzi lub starszego tagu wydania.

Każdy uruchomiony proces podrzędny musi zgłosić ten sam SHA przepływu pracy co nadrzędne
uruchomienie `Full Release Validation`. Jeśli `main` zmieni się między uruchomieniem procesu nadrzędnego
a procesów podrzędnych, proces nadrzędny zakończy się bezpiecznym niepowodzeniem, nawet jeśli sam proces podrzędny się powiedzie. Aby
uzyskać niezmienny dowód dla dokładnego commita, użyj
`pnpm ci:full-release --sha <target-sha>`. Narzędzie pomocnicze tworzy tymczasowe
odwołanie `release-ci/*` przypięte do bieżącego zaufanego `origin/main`, przekazuje docelowy
SHA wyłącznie jako `ref` kandydata, ponownie wykorzystuje ścisłe dowody dla dokładnego celu, gdy
są dostępne, i usuwa odwołanie po walidacji. Przekaż
`-f reuse_evidence=false`, aby wymusić nowe uruchomienie, lub
`--workflow-sha <trusted-main-sha>`, aby wybrać starszy commit przepływu pracy, który nadal
jest osiągalny z bieżącego `origin/main`. Sam przepływ pracy nigdy nie tworzy ani nie aktualizuje
odwołań repozytorium.

`release_profile=stable` i `release_profile=full` zawsze uruchamiają wyczerpujący
długotrwały test środowiska rzeczywistego/Dockera. Przekaż `run_release_soak=true`, aby uwzględnić te same ścieżki długotrwałych testów
w profilu `beta`. Publikacja stabilna odrzuca manifest walidacji
bez tego długotrwałego testu oraz blokujących dowodów wydajności produktu.

Package Acceptance zwykle buduje archiwum tar kandydata z rozpoznanego
`ref`, w tym dla uruchomień z pełnym SHA wywołanych za pomocą `pnpm ci:full-release`. Po
opublikowaniu wersji beta przekaż `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`, aby ponownie wykorzystać
wydany pakiet npm w kontrolach wydania, Package Acceptance, testach międzyplatformowych,
ścieżce wydania Dockera i testach pakietu Telegram. Używaj `package_acceptance_package_spec`
tylko wtedy, gdy Package Acceptance ma celowo zweryfikować inny pakiet.
Ścieżka testów rzeczywistych pakietu Pluginu Codex działa według tego samego stanu: opublikowane
wartości `release_package_spec` wyznaczają `codex_plugin_spec=npm:@openclaw/codex@<version>`;
uruchomienia SHA/artefaktów pakują `extensions/codex` z wybranego odwołania, a operatorzy
mogą ustawić `codex_plugin_spec` bezpośrednio dla źródeł Pluginu
`npm:`, `npm-pack:` lub `git:`. Ścieżka udziela jawnej zgody na instalację CLI Codex wymaganej przez
ten Plugin, a następnie wykonuje kontrolę wstępną CLI Codex i przebiegi agenta OpenAI w tej samej sesji.

## Etapy najwyższego poziomu

Dla `rerun_group=all` najpierw wykonywane jest zadanie `Check for reusable validation evidence`:
wyszukuje ono najnowszą wcześniejszą zakończoną powodzeniem pełną walidację dla dokładnie tego samego
docelowego SHA, profilu wydania, efektywnego ustawienia długotrwałego testu i parametrów wejściowych walidacji.
Gdy taki dowód istnieje, każda ścieżka jest pomijana, a nadrzędny weryfikator
ponownie sprawdza niezmienny artefakt nadrzędny, uruchomienia podrzędne i dzienniki wywołań. Jest to
wyłącznie mechanizm odzyskiwania po ponownym uruchomieniu tego samego kandydata; nie zezwala na ponowne użycie między różnymi SHA. W przypadku
zmienionego kandydata uruchom ponownie każdą kontrolę pakietu, artefaktu, instalacji, Dockera lub dostawcy,
na którą wpływa ta zmiana. Przekaż `reuse_evidence=false`, aby wymusić nową pełną
walidację. Ponowne użycie dowodów działa tylko z `main` lub kanonicznego, przypiętego do SHA
odwołania `release-ci/*`, którego commit przepływu pracy pozostaje w zaufanej linii `main`;
inne odwołania przepływu pracy uruchamiają wybrane ścieżki od nowa.

Również dla `rerun_group=all` zadanie `Verify Docker runtime image assets` buduje
cel Dockera `runtime-assets` z
`OPENCLAW_EXTENSIONS=diagnostics-otel,codex`. Działa ono równolegle z
innymi etapami i jest egzekwowane przez nadrzędny weryfikator; ścieżki nie czekają już na
jego zakończenie przed uruchomieniem. Węższa wartość `rerun_group` pomija tę kontrolę wstępną.

| Etap                    | Szczegóły                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rozpoznawanie celu      | **Zadanie:** `Resolve target ref`<br />**Podrzędny przepływ pracy:** brak<br />**Weryfikuje:** rozpoznaje gałąź wydania, tag lub pełny SHA commita i zapisuje wybrane parametry wejściowe.<br />**Ponowne uruchomienie:** jeśli to zadanie się nie powiedzie, uruchom ponownie proces nadrzędny.                                                                                                                                                                                                                                                                                                            |
| Kontrola wstępna zasobów Dockera | **Zadanie:** `Verify Docker runtime image assets`<br />**Podrzędny przepływ pracy:** brak<br />**Weryfikuje:** cel kompilacji Dockera `runtime-assets` nadal kończy się powodzeniem przed uruchomieniem pozostałych etapów. Działa tylko dla `rerun_group=all`.<br />**Ponowne uruchomienie:** uruchom ponownie proces nadrzędny z `rerun_group=all`.                                                                                                                                                                                                                                         |
| Vitest i standardowe CI | **Zadanie:** `Run normal full CI`<br />**Podrzędny przepływ pracy:** `CI`<br />**Weryfikuje:** ręczny pełny graf CI dla docelowego odwołania, obejmujący ścieżki Linux Node, fragmenty dołączonych Pluginów, fragmenty kontraktów Pluginów i kanałów, zgodność z Node 22, `check-*`, `check-additional-*`, testy dymne zbudowanych artefaktów, kontrole dokumentacji, Skills Pythona, Windows, macOS, internacjonalizację Control UI oraz Android za pośrednictwem procesu nadrzędnego.<br />**Ponowne uruchomienie:** `rerun_group=ci`.                                                                                          |
| Walidacja Pluginów przed wydaniem | **Zadanie:** `Run plugin prerelease validation`<br />**Podrzędny przepływ pracy:** `Plugin Prerelease`<br />**Weryfikuje:** statyczne kontrole Pluginów wykonywane tylko przed wydaniem, pokrycie Pluginów przez agentów, pełne fragmenty wsadowe Pluginów, ścieżki Dockera przed wydaniem Pluginów oraz nieblokujący artefakt `plugin-inspector-advisory` do selekcji problemów ze zgodnością.<br />**Ponowne uruchomienie:** `rerun_group=plugin-prerelease`.                                                                                                                                                          |
| Kontrole wydania        | **Zadanie:** `Run release/live/Docker/QA validation`<br />**Podrzędny przepływ pracy:** `OpenClaw Release Checks`<br />**Weryfikuje:** test dymny instalacji, międzyplatformowe kontrole pakietu, Package Acceptance, zgodność z QA Lab, testy rzeczywiste Matrix i testy rzeczywiste Telegram. Profile stabilny i pełny uruchamiają również wyczerpujące zestawy testów rzeczywistych/E2E oraz fragmenty ścieżki wydania Dockera; wersja beta może je włączyć za pomocą `run_release_soak=true`.<br />**Ponowne uruchomienie:** `rerun_group=release-checks` lub węższy uchwyt kontroli wydania.                                                                |
| Pakiet Telegram         | **Zadanie:** `Run package Telegram E2E`<br />**Podrzędny przepływ pracy:** `NPM Telegram Beta E2E`<br />**Weryfikuje:** ukierunkowany test E2E opublikowanego pakietu Telegram, gdy ustawiono `release_package_spec` lub `npm_telegram_package_spec`. Pełna walidacja kandydata używa zamiast tego kanonicznego testu E2E Telegram w Package Acceptance.<br />**Ponowne uruchomienie:** `rerun_group=npm-telegram` z `release_package_spec` lub `npm_telegram_package_spec`.                                                                                                              |
| Wydajność produktu      | **Zadanie:** `Run product performance evidence`<br />**Podrzędny przepływ pracy:** `OpenClaw Performance`<br />**Weryfikuje:** uruchomienie wydajności dla profilu wydania (`profile=release`, `repeat=3`, `fail_on_regression=true`, `publish_reports=false`) względem docelowego SHA. Dane wyjściowe Kova pozostają w artefaktach przepływu pracy, a proces podrzędny musi wykazać, że zadanie publikowania raportu zostało pominięte. Wymagane (blokujące) tylko dla `rerun_group=all` lub `rerun_group=performance`; niewymagane dla węższych grup ponownych uruchomień.<br />**Ponowne uruchomienie:** `rerun_group=performance`. |
| Nadrzędny weryfikator   | **Zadanie:** `Verify full validation`<br />**Podrzędny przepływ pracy:** brak<br />**Weryfikuje:** ponownie sprawdza zapisane wyniki uruchomień podrzędnych i dołącza tabele najwolniejszych zadań z podrzędnych przepływów pracy.<br />**Ponowne uruchomienie:** po pomyślnym ponownym uruchomieniu nieudanego procesu podrzędnego uruchom ponownie tylko to zadanie.                                                                                                                                                                                                                                                                 |

Proces nadrzędny zawsze uruchamia testy wydajności produktu w trybie wyłącznie artefaktowym.
`OpenClaw Performance` zezwala na publikację raportu tylko dla zaplanowanych uruchomień lub
ręcznego wywołania, które jawnie ustawia `publish_reports=true`. Kontrola trybu wyłącznie artefaktowego
musi zakończyć się powodzeniem, potwierdzając, że zadanie publikujące pozostało pominięte.
Nowe i ponownie użyte dowody zapisują
`controls.performanceReportPublication=artifact-only`; weryfikator i selektor ponownego użycia
odrzucają dowody bez pasującego, znormalizowanego potwierdzenia z podrzędnego procesu wydajnościowego.

Weryfikator przesyła kanoniczny manifest jako
`full-release-validation-<run-id>-<run-attempt>`. Narzędzia obsługi dowodów weryfikują
identyfikator artefaktu, skrót, uruchomienie producenta i próbę przed pobraniem tego dokładnego
identyfikatora artefaktu. Nakładają limit na pobierany plik ZIP, weryfikują jego bajty względem skrótu REST
`sha256:` i strumieniowo odczytują jedyny dozwolony wpis manifestu o ograniczonym rozmiarze bez
rozpakowywania archiwum. Alias o stabilnej nazwie pozostaje tymczasowo dla starszych
konsumentów publikacji. Weryfikator zawsze preferuje artefakt z nazwą uwzględniającą próbę;
przejściowo akceptuje stabilną nazwę tylko dla producenta manifestu v2 z pierwszej próby.
Odrzuca tę starszą nazwę dla późniejszych prób i manifestu v3.

Dla `ref=main` z `rerun_group=all`, dla odwołań `release/*`
oraz odwołań alfa Tideclaw nowsze uruchomienie procesu nadrzędnego zastępuje starsze o tym samym
odwołaniu i tej samej grupie ponownego uruchomienia. Gdy proces nadrzędny zostaje anulowany, jego monitor anuluje każdy podrzędny
przepływ pracy, który został już uruchomiony. Uruchomienia walidacji tagów i przypiętych SHA nie
anulują się wzajemnie.

## Etapy kontroli wydania

`OpenClaw Release Checks` jest największym podrzędnym przepływem pracy. Jednorazowo rozpoznaje cel
i przygotowuje współdzielony artefakt `release-package-under-test`, gdy wymagają go etapy
związane z pakietem lub Dockerem.

| Etap                     | Szczegóły                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cel wydania              | **Zadanie:** `Resolve target ref`<br />**Bazowy przepływ pracy:** brak<br />**Testy:** wybrana referencja, opcjonalny oczekiwany SHA, profil, grupa ponownego uruchomienia i filtr ukierunkowanego zestawu testów na żywo.<br />**Ponowne uruchomienie:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                                                          |
| Artefakt pakietu         | **Zadanie:** `Prepare release package artifact`<br />**Bazowy przepływ pracy:** brak<br />**Testy:** pakuje lub wskazuje jeden kandydujący plik tarball i przesyła `release-package-under-test` na potrzeby dalszych kontroli dotyczących pakietu.<br />**Ponowne uruchomienie:** odpowiednia grupa pakietu, testów międzyplatformowych albo testów na żywo/E2E.                                                                                                                                                                                                                                 |
| Test dymny instalacji    | **Zadanie:** `Run install smoke`<br />**Bazowy przepływ pracy:** `Install Smoke`<br />**Testy:** pełna ścieżka instalacji z ponownym użyciem obrazu testów dymnych z głównego pliku Dockerfile, instalacja pakietu QR, testy dymne głównego obrazu Dockera i obrazu Gateway, testy instalatora w Dockerze oraz test dymny dostawcy obrazów po globalnej instalacji za pomocą Bun.<br />**Ponowne uruchomienie:** `rerun_group=install-smoke`.                                                                                                                                                |
| Testy międzyplatformowe  | **Zadanie:** `cross_os_release_checks`<br />**Bazowy przepływ pracy:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testy:** ścieżki świeżej instalacji i aktualizacji w systemach Linux, Windows i macOS dla wybranego dostawcy i trybu, korzystające z kandydującego pliku tarball oraz pakietu bazowego.<br />**Ponowne uruchomienie:** `rerun_group=cross-os`.                                                                                                                                                                                                                       |
| E2E repozytorium i na żywo | **Zadanie:** `Run repo/live E2E validation`<br />**Bazowy przepływ pracy:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testy:** E2E repozytorium, pamięć podręczna testów na żywo, strumieniowanie WebSocket OpenAI, natywne fragmenty testów dostawców i Pluginów na żywo oraz oparte na Dockerze środowiska testowe modelu, zaplecza i Gateway na żywo, wybrane przez `release_profile`.<br />**Uruchomienia:** `run_release_soak=true`, `release_profile=full` lub ukierunkowane `rerun_group=live-e2e`.<br />**Ponowne uruchomienie:** `rerun_group=live-e2e`, opcjonalnie z `live_suite_filter`. |
| Ścieżka wydania w Dockerze | **Zadanie:** `Run Docker release-path validation`<br />**Bazowy przepływ pracy:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testy:** fragmenty dockerowej ścieżki wydania wykonywane względem współdzielonego artefaktu pakietu.<br />**Uruchomienia:** `run_release_soak=true`, `release_profile=full` lub ukierunkowane `rerun_group=live-e2e`.<br />**Ponowne uruchomienie:** `rerun_group=live-e2e`.                                                                                                                                                                                           |
| Akceptacja pakietu       | **Zadanie:** `Run package acceptance`<br />**Bazowy przepływ pracy:** `Package Acceptance`<br />**Testy:** działające offline dane testowe pakietów Pluginów, aktualizacja Pluginu, kanoniczny test E2E pakietu Telegram z makietą OpenAI oraz kontrole przetrwania opublikowanej aktualizacji względem tego samego pliku tarball. Blokujące kontrole wydania używają domyślnie najnowszej opublikowanej wersji bazowej; testy długotrwałe (`run_release_soak=true`) rozszerzają zakres o ostatnie 4 stabilne wydania npm i 3 przypięte wersje historyczne (`2026.4.23`, `2026.5.2`, `2026.4.15`), wykonywane na danych testowych aktualizacji odtwarzających zgłoszone problemy.<br />**Ponowne uruchomienie:** `rerun_group=package`. |
| Karta dojrzałości        | **Zadanie:** `Render maturity scorecard release docs`<br />**Bazowy przepływ pracy:** `maturity-scorecard.yml`<br />**Testy:** generuje dokumentację informacyjnej karty dojrzałości względem docelowej referencji. Uruchamiane tylko po przekazaniu `run_maturity_scorecard=true`.<br />**Ponowne uruchomienie:** `rerun_group=qa` z `run_maturity_scorecard=true`.                                                                                                                                                                                                                              |
| Zgodność QA              | **Zadanie:** `Run QA Lab parity lane` i `Run QA Lab parity report`<br />**Bazowy przepływ pracy:** zadania bezpośrednie<br />**Testy:** agentowe zestawy zgodności kandydata i wersji bazowej, a następnie raport zgodności.<br />**Ponowne uruchomienie:** `rerun_group=qa-parity` lub `rerun_group=qa`.                                                                                                                                                                                                                                                                                      |
| Zgodność środowisk uruchomieniowych QA | **Zadanie:** `Run QA Lab runtime parity lane`<br />**Bazowy przepływ pracy:** zadanie bezpośrednie<br />**Testy:** agentowa ścieżka zgodności pary środowisk uruchomieniowych `openclaw`/`codex` (`pnpm openclaw qa suite --runtime-pair openclaw,codex`), obejmująca poziom standardowy oraz, przy `run_release_soak=true`, poziom testów długotrwałych. Informacyjnie: pojedyncze niepowodzenia nie blokują weryfikatora kontroli wydania.<br />**Ponowne uruchomienie:** `rerun_group=qa-parity` lub `rerun_group=qa`.                                                                 |
| Pokrycie narzędzi środowisk uruchomieniowych QA | **Zadanie:** `Enforce QA Lab runtime tool coverage`<br />**Bazowy przepływ pracy:** zadanie bezpośrednie<br />**Testy:** dynamiczne rozbieżności narzędzi między `openclaw` i `codex` na standardowym poziomie zgodności środowisk uruchomieniowych (`pnpm openclaw qa coverage --tools`), z użyciem danych wyjściowych ze ścieżki zgodności środowisk uruchomieniowych QA. Blokujące: tego zadania nie można zastąpić wynikiem informacyjnym.<br />**Ponowne uruchomienie:** `rerun_group=qa-parity` lub `rerun_group=qa`.                                                             |
| Testy QA Matrix na żywo  | **Zadanie:** `Run QA Lab live Matrix lane`<br />**Bazowy przepływ pracy:** zadanie bezpośrednie<br />**Testy:** szybki profil testów QA Matrix na żywo w środowisku `qa-live-shared`.<br />**Ponowne uruchomienie:** `rerun_group=qa-live` lub `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                            |
| Testy QA Telegram na żywo | **Zadanie:** `Run QA Lab live Telegram lane`<br />**Bazowy przepływ pracy:** zadanie bezpośrednie<br />**Testy:** testy QA Telegram na żywo z dzierżawami poświadczeń Convex CI.<br />**Ponowne uruchomienie:** `rerun_group=qa-live` lub `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                              |
| Weryfikator wydania      | **Zadanie:** `Verify release checks`<br />**Bazowy przepływ pracy:** brak<br />**Testy:** wymagane zadania kontroli wydania dla wybranej grupy ponownego uruchomienia.<br />**Ponowne uruchomienie:** uruchom ponownie po pomyślnym zakończeniu ukierunkowanych zadań podrzędnych.                                                                                                                                                                                                                                                                                                        |

## Fragmenty dockerowej ścieżki wydania

Etap dockerowej ścieżki wydania uruchamia następujące fragmenty, gdy
`live_suite_filter` jest pusty:

| Fragment                                                        | Zakres                                                                                                                                    |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Podstawowe ścieżki testów dymnych dockerowej ścieżki wydania.                                                                             |
| `package-update-openai`                                         | Instalacja i aktualizacja pakietu OpenAI, instalacja Codex na żądanie, interakcje Pluginu Codex na żywo oraz wywołania narzędzi Chat Completions. |
| `package-update-anthropic`                                      | Instalacja i aktualizacja pakietu Anthropic.                                                                                              |
| `package-update-core`                                           | Niezależna od dostawcy obsługa pakietu i aktualizacji.                                                                                    |
| `plugins-runtime-plugins`                                       | Ścieżki środowiska uruchomieniowego Pluginów sprawdzające ich działanie.                                                                  |
| `plugins-runtime-services`                                      | Ścieżki środowiska uruchomieniowego Pluginów korzystające z usług i testów na żywo.                                                       |
| `plugins-runtime-install-a` do `plugins-runtime-install-h`      | Partie instalacji i uruchamiania Pluginów podzielone na potrzeby równoległej walidacji wydania.                                           |
| `openwebui`                                                     | Test dymny zgodności z OpenWebUI izolowany na dedykowanym środowisku wykonawczym z dużym dyskiem, gdy jest wymagany.                       |

Gdy nie powiedzie się tylko jedna ścieżka Dockera, użyj ukierunkowanego
`docker_lanes=<lane[,lane]>` w przepływie pracy wielokrotnego użytku dla testów
na żywo/E2E. Artefakty wydania zawierają polecenia ponownego uruchomienia dla
poszczególnych ścieżek wraz z parametrami ponownego użycia artefaktu pakietu
i obrazu, jeśli są dostępne.

## Profile wydania

`release_profile` steruje głównie zakresem testów live/dostawców w ramach kontroli wydania.
Nie usuwa standardowego pełnego CI, wersji przedpremierowej Pluginu, testu dymnego
instalacji, akceptacji pakietu ani QA Lab. Profile stabilny i pełny zawsze uruchamiają
wyczerpujące testy E2E repozytorium/live oraz długotrwałe testy ścieżki wydania w Dockerze.
Profil beta może je włączyć za pomocą `run_release_soak=true`. Akceptacja pakietu zapewnia
kanoniczny test E2E Telegramu dla pakietu w przypadku każdego pełnego kandydata, dlatego
nadrzędny przepływ nie powiela tego pollera live.

| Profil   | Przeznaczenie                              | Uwzględniony zakres testów live/dostawców                                                                                                                                                                         |
| -------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | Najszybszy test dymny krytyczny dla wydania. | Ścieżka live OpenAI/rdzenia, modele live w Dockerze dla OpenAI, natywny rdzeń Gateway, natywny profil Gateway OpenAI, natywny Plugin OpenAI oraz Gateway OpenAI live w Dockerze.                                  |
| `stable` | Domyślny profil zatwierdzania wydania.     | `beta` oraz test dymny Anthropic, Google, MiniMax, backend, natywny zestaw testów live, backend CLI live w Dockerze, powiązanie ACP w Dockerze, zestaw testów Codex w Dockerze, ogłaszanie podagentów w Dockerze oraz fragment testu dymnego OpenCode Go. |
| `full`   | Szeroki przebieg doradczy.                 | `stable` oraz dostawcy doradczy, fragmenty testów live Pluginów i fragmenty testów multimediów live.                                                                                                               |

## Dodatki tylko dla profilu pełnego

Poniższe zestawy są pomijane przez `stable` i uwzględniane przez `full`:

| Obszar                           | Zakres tylko dla profilu pełnego                                                                                           |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Modele live w Dockerze           | OpenCode Go, OpenRouter, xAI, Z.ai i Fireworks.                                                                            |
| Gateway live w Dockerze          | Dostawcy doradczy podzieleni na fragmenty DeepSeek/Fireworks, OpenCode Go/OpenRouter oraz xAI/Z.ai.                        |
| Natywne profile dostawców Gateway | Pełne fragmenty Anthropic Opus i Sonnet/Haiku, Fireworks, DeepSeek, pełne fragmenty modeli OpenCode Go, OpenRouter, xAI i Z.ai. |
| Natywne fragmenty live Pluginów  | Pluginy A-K, L-N, pozostałe O-Z, Moonshot i xAI.                                                                           |
| Natywne fragmenty multimediów live | Dźwięk, muzyka Google, muzyka MiniMax oraz grupy wideo A-D.                                                               |

`stable` obejmuje `native-live-src-gateway-profiles-anthropic-smoke` oraz
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` używa zamiast nich
szerszych fragmentów modeli Anthropic i OpenCode Go. Ukierunkowane ponowne uruchomienia
mogą nadal używać zbiorczych uchwytów
`native-live-src-gateway-profiles-anthropic` lub
`native-live-src-gateway-profiles-opencode-go`.

## Ukierunkowane ponowne uruchomienia

Użyj `rerun_group`, aby uniknąć powtarzania niepowiązanych środowisk wydania:

| Uchwyt              | Zakres                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| `all`               | Wszystkie etapy pełnej walidacji wydania.                                                              |
| `ci`                | Tylko podrzędny przepływ ręcznego pełnego CI.                                                          |
| `plugin-prerelease` | Tylko podrzędny przepływ wersji przedpremierowej Pluginu.                                              |
| `release-checks`    | Wszystkie etapy kontroli wydania OpenClaw.                                                             |
| `install-smoke`     | Od testu dymnego instalacji po kontrole wydania.                                                       |
| `cross-os`          | Kontrole wydania na różnych systemach operacyjnych.                                                    |
| `live-e2e`          | Walidacja E2E repozytorium/live i ścieżki wydania w Dockerze.                                          |
| `package`           | Akceptacja pakietu.                                                                                    |
| `qa`                | Zgodność QA oraz ścieżki QA live.                                                                      |
| `qa-parity`         | Tylko ścieżki zgodności QA i raport.                                                                   |
| `qa-live`           | Matrix/Telegram QA live oraz warunkowe ścieżki Discord, WhatsApp i Slack, gdy są włączone.             |
| `npm-telegram`      | Test E2E Telegramu opublikowanego pakietu; wymaga `release_package_spec` lub `npm_telegram_package_spec`. |
| `performance`       | Tylko dane potwierdzające wydajność produktu.                                                          |

Gdy nie powiedzie się jeden zestaw live, użyj `live_suite_filter` z
`rerun_group=live-e2e`. Prawidłowe identyfikatory filtrów są zdefiniowane w przepływie
wielokrotnego użytku live/E2E i obejmują
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` oraz
`live-codex-harness-docker`.

Uchwyt `live-gateway-advisory-docker` jest zbiorczym uchwytem ponownego uruchomienia
dla trzech fragmentów dostawców, dlatego nadal rozdziela się na wszystkie doradcze
zadania Gateway w Dockerze.

Gdy nie powiedzie się jedna ścieżka obejmująca wiele systemów operacyjnych, użyj
`cross_os_suite_filter` z `rerun_group=cross-os`. Filtr przyjmuje identyfikator systemu
operacyjnego, identyfikator zestawu lub parę system/zestaw, na przykład
`windows/packaged-upgrade`, `windows` albo `packaged-fresh`. Podsumowania dla wielu
systemów operacyjnych obejmują czasy poszczególnych faz ścieżek aktualizacji pakietowej,
a długotrwałe polecenia wypisują wiersze Heartbeat, dzięki czemu zawieszoną aktualizację
można zauważyć przed przekroczeniem limitu czasu zadania.

Niepowodzenia kontroli wydania QA blokują standardową walidację wydania. Kontrola
pokrycia narzędzi środowiska uruchomieniowego QA (dynamiczne rozbieżności narzędzi między
`openclaw` a `codex` na poziomie standardowym) również blokuje weryfikator kontroli
wydania, mimo że bazowa ścieżka zgodności środowiska uruchomieniowego QA ma charakter
doradczy. Uruchomienia alfa Tideclaw mogą nadal traktować ścieżki kontroli wydania
niezwiązane z bezpieczeństwem pakietu jako doradcze. Przy `release_profile=beta` zestawy
dostawców live w ramach `Run repo/live E2E validation` mają charakter doradczy:
wdrożenia modeli innych firm zmieniają się niezależnie od wydania, dlatego profil beta
przedstawia ich niepowodzenia jako ostrzeżenia, podczas gdy profile stabilny i pełny
nadal traktują je jako blokujące. Gdy `live_suite_filter` jawnie żąda warunkowej ścieżki
QA live, takiej jak Discord, WhatsApp lub Slack, odpowiednia zmienna repozytorium
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` musi być włączona; w przeciwnym razie
przechwytywanie danych wejściowych kończy się niepowodzeniem zamiast po cichu pomijać
ścieżkę. Uruchom ponownie `rerun_group=qa`, `qa-parity` lub `qa-live`, gdy potrzebujesz
aktualnych danych potwierdzających QA.

## Dane, które należy zachować

Zachowaj podsumowanie `Full Release Validation` jako indeks na poziomie wydania. Zawiera
ono odnośniki do identyfikatorów przebiegów podrzędnych oraz tabele najwolniejszych zadań.
W przypadku niepowodzeń najpierw sprawdź przepływ podrzędny, a następnie ponownie uruchom
najmniejszy pasujący uchwyt wymieniony powyżej.

Przydatne artefakty:

- `release-package-under-test` z `OpenClaw Release Checks`
- artefakty ścieżki wydania w Dockerze w `.artifacts/docker-tests/`
- artefakty `package-under-test` z akceptacji pakietu oraz artefakty akceptacji w Dockerze
- artefakty kontroli wydania na różnych systemach operacyjnych dla każdego systemu i zestawu
- artefakty zgodności QA, zgodności środowiska uruchomieniowego, Matrix i Telegramu

## Pliki przepływów pracy

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/install-smoke-reusable.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
- `.github/workflows/openclaw-performance.yml`
- `.github/workflows/npm-telegram-beta-e2e.yml`
