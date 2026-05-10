---
read_when:
    - Uruchamianie lub ponowne uruchamianie pełnej walidacji wydania
    - Porównanie stabilnego i pełnego profilu walidacji wydania
    - Diagnozowanie niepowodzeń etapu walidacji wydania
summary: Etapy pełnej walidacji wydania, podrzędne przepływy pracy, profile wydania, identyfikatory ponownego uruchomienia i dowody
title: Pełna walidacja wydania
x-i18n:
    generated_at: "2026-05-10T19:53:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a479b2d79ae2710c501d583ad14f913a32382bba8dfd7ec9d25124357743e20
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` to parasol wydania. Jest to pojedynczy ręczny
punkt wejścia dla dowodu przedwydaniowego, ale większość pracy odbywa się w
przepływach podrzędnych, aby nieudaną maszynę można było uruchomić ponownie bez
restartowania całego wydania.

Uruchom go z zaufanej referencji workflow, zwykle `main`, i przekaż gałąź
wydania, tag albo pełny SHA commita jako `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Przepływy podrzędne używają zaufanej referencji workflow dla harnessa oraz
wejściowego `ref` dla testowanego kandydata. Dzięki temu nowa logika walidacji
jest dostępna podczas walidowania starszej gałęzi lub tagu wydania.

Domyślnie `release_profile=stable` uruchamia ścieżki blokujące wydanie i pomija
wyczerpujący live/Docker soak. Przekaż `run_release_soak=true`, aby uwzględnić
ścieżki soak w stabilnym uruchomieniu. `release_profile=full` zawsze włącza
ścieżki soak, więc szeroki profil doradczy nigdy po cichu nie traci pokrycia.

Package Acceptance zwykle buduje tarball kandydata z rozwiązanej wartości
`ref`, w tym uruchomienia z pełnym SHA wywołane przez `pnpm ci:full-release`. Po
publikacji przekaż `package_acceptance_package_spec=openclaw@YYYY.M.D` (albo
`openclaw@beta`/`openclaw@latest`), aby uruchomić tę samą macierz pakietu i
aktualizacji wobec wysłanego pakietu npm.

## Etapy najwyższego poziomu

| Etap                 | Szczegóły                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rozwiązanie celu     | **Zadanie:** `Resolve target ref`<br />**Przepływ podrzędny:** brak<br />**Dowodzi:** rozwiązuje gałąź wydania, tag albo pełny SHA commita i zapisuje wybrane dane wejściowe.<br />**Ponowne uruchomienie:** uruchom parasol ponownie, jeśli to się nie powiedzie.                                                                                                                                                                             |
| Vitest i zwykłe CI   | **Zadanie:** `Run normal full CI`<br />**Przepływ podrzędny:** `CI`<br />**Dowodzi:** ręczny pełny graf CI wobec docelowej referencji, w tym ścieżki Linux Node, fragmenty bundled Plugin, kontrakty kanałów, zgodność z Node 22, `check`, `check-additional`, smoke build, kontrole dokumentacji, Python skills, Windows, macOS, i18n Control UI oraz Android przez parasol.<br />**Ponowne uruchomienie:** `rerun_group=ci`.                |
| Przedwydanie Plugin  | **Zadanie:** `Run plugin prerelease validation`<br />**Przepływ podrzędny:** `Plugin Prerelease`<br />**Dowodzi:** statyczne kontrole Plugin tylko dla wydania, pokrycie agentic Plugin, pełne fragmenty wsadowe rozszerzeń oraz przedwydaniowe ścieżki Docker dla Plugin.<br />**Ponowne uruchomienie:** `rerun_group=plugin-prerelease`.                                                                                                    |
| Kontrole wydania     | **Zadanie:** `Run release/live/Docker/QA validation`<br />**Przepływ podrzędny:** `OpenClaw Release Checks`<br />**Dowodzi:** smoke install, kontrole pakietu między systemami operacyjnymi, Package Acceptance, parytet QA Lab, live Matrix i live Telegram. Z `run_release_soak=true` albo `release_profile=full` uruchamia też wyczerpujące zestawy live/E2E i fragmenty ścieżki wydania Docker.<br />**Ponowne uruchomienie:** `rerun_group=release-checks` albo węższy uchwyt release-checks. |
| Artefakt pakietu     | **Zadanie:** `Prepare release package artifact`<br />**Przepływ podrzędny:** brak<br />**Dowodzi:** tworzy nadrzędny tarball `release-package-under-test` wystarczająco wcześnie dla kontroli skierowanych na pakiet, które nie muszą czekać na `OpenClaw Release Checks`.<br />**Ponowne uruchomienie:** uruchom parasol ponownie albo podaj `npm_telegram_package_spec` dla `rerun_group=npm-telegram`.                                      |
| Pakiet Telegram      | **Zadanie:** `Run package Telegram E2E`<br />**Przepływ podrzędny:** `NPM Telegram Beta E2E`<br />**Dowodzi:** dowód pakietu Telegram oparty na artefakcie nadrzędnym dla `rerun_group=all` z `release_profile=full` albo dowód Telegram dla opublikowanego pakietu, gdy ustawiono `npm_telegram_package_spec`.<br />**Ponowne uruchomienie:** `rerun_group=npm-telegram` z `npm_telegram_package_spec`.                                      |
| Weryfikator parasola | **Zadanie:** `Verify full validation`<br />**Przepływ podrzędny:** brak<br />**Dowodzi:** ponownie sprawdza zapisane wyniki uruchomień podrzędnych i dołącza tabele najwolniejszych zadań z przepływów podrzędnych.<br />**Ponowne uruchomienie:** uruchom ponownie tylko to zadanie po doprowadzeniu nieudanego przepływu podrzędnego do stanu zielonego.                                                                                      |

Dla `ref=main` i `rerun_group=all` nowszy parasol zastępuje starszy. Gdy rodzic
zostanie anulowany, jego monitor anuluje każdy przepływ podrzędny, który już
uruchomił. Uruchomienia walidacji gałęzi i tagów wydania domyślnie nie anulują
się wzajemnie.

## Etapy kontroli wydania

`OpenClaw Release Checks` to największy przepływ podrzędny. Rozwiązuje cel tylko
raz i przygotowuje współdzielony artefakt `release-package-under-test`, gdy
potrzebują go etapy skierowane na pakiet albo Docker.

| Etap                | Szczegóły                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cel wydania         | **Zadanie:** `Resolve target ref`<br />**Powiązany workflow:** brak<br />**Testy:** wybrany ref, opcjonalny oczekiwany SHA, profil, grupa ponownego uruchomienia i ukierunkowany filtr zestawu testów live.<br />**Ponowne uruchomienie:** `rerun_group=release-checks`.                                                                                                                                                                                                                         |
| Artefakt pakietu    | **Zadanie:** `Prepare release package artifact`<br />**Powiązany workflow:** brak<br />**Testy:** pakuje albo rozwiązuje jeden kandydujący tarball i przesyła `release-package-under-test` na potrzeby dalszych kontroli dotyczących pakietów.<br />**Ponowne uruchomienie:** grupa dotycząca pakietu, wielu systemów operacyjnych albo live/E2E, której dotyczy problem.                                                                                                                          |
| Smoke instalacji    | **Zadanie:** `Run install smoke`<br />**Powiązany workflow:** `Install Smoke`<br />**Testy:** pełna ścieżka instalacji z ponownym użyciem obrazu smoke z głównego Dockerfile, instalacja pakietu QR, smoke głównego obrazu i Gateway w Dockerze, testy instalatora w Dockerze, smoke globalnej instalacji Bun dla dostawcy obrazów oraz szybki E2E instalacji/deinstalacji dołączonego Pluginu.<br />**Ponowne uruchomienie:** `rerun_group=install-smoke`.                                      |
| Wiele systemów OS   | **Zadanie:** `cross_os_release_checks`<br />**Powiązany workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testy:** ścieżki świeżej instalacji i aktualizacji w systemach Linux, Windows oraz macOS dla wybranego dostawcy i trybu, z użyciem kandydującego tarballa oraz pakietu bazowego.<br />**Ponowne uruchomienie:** `rerun_group=cross-os`.                                                                                                                                    |
| Repo i live E2E     | **Zadanie:** `Run repo/live E2E validation`<br />**Powiązany workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testy:** E2E repozytorium, pamięć podręczna live, strumieniowanie websocket OpenAI, natywny dostawca live i fragmenty Pluginów oraz wspierane Dockerem harnessy live modelu/backendu/Gateway wybrane przez `release_profile`.<br />**Uruchomienia:** `run_release_soak=true`, `release_profile=full` albo ukierunkowane `rerun_group=live-e2e`.<br />**Ponowne uruchomienie:** `rerun_group=live-e2e`, opcjonalnie z `live_suite_filter`. |
| Ścieżka wydania Docker | **Zadanie:** `Run Docker release-path validation`<br />**Powiązany workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testy:** fragmenty ścieżki wydania Docker względem współdzielonego artefaktu pakietu.<br />**Uruchomienia:** `run_release_soak=true`, `release_profile=full` albo ukierunkowane `rerun_group=live-e2e`.<br />**Ponowne uruchomienie:** `rerun_group=live-e2e`.                                                                                                      |
| Akceptacja pakietu  | **Zadanie:** `Run package acceptance`<br />**Powiązany workflow:** `Package Acceptance`<br />**Testy:** offline fixture’y pakietów Pluginów, aktualizacja Pluginu, akceptacja pakietu Telegram z mockiem OpenAI oraz kontrole przetrwania po aktualizacji z opublikowanej wersji względem tego samego tarballa. Blokujące kontrole wydania używają domyślnej najnowszej opublikowanej wersji bazowej; kontrole soak rozszerzają zakres na każde stabilne wydanie npm od `2026.4.23` włącznie oraz fixture’y zgłoszonych problemów.<br />**Ponowne uruchomienie:** `rerun_group=package`. |
| Parzystość QA       | **Zadanie:** `Run QA Lab parity lane` i `Run QA Lab parity report`<br />**Powiązany workflow:** zadania bezpośrednie<br />**Testy:** pakiety parzystości agentowej kandydata i wersji bazowej, a następnie raport parzystości.<br />**Ponowne uruchomienie:** `rerun_group=qa-parity` albo `rerun_group=qa`.                                                                                                                                                                                           |
| Matrix live QA      | **Zadanie:** `Run QA Lab live Matrix lane`<br />**Powiązany workflow:** zadanie bezpośrednie<br />**Testy:** szybki profil QA Matrix live w środowisku `qa-live-shared`.<br />**Ponowne uruchomienie:** `rerun_group=qa-live` albo `rerun_group=qa`.                                                                                                                                                                                                                                               |
| Telegram live QA    | **Zadanie:** `Run QA Lab live Telegram lane`<br />**Powiązany workflow:** zadanie bezpośrednie<br />**Testy:** QA Telegram live z dzierżawami poświadczeń Convex CI.<br />**Ponowne uruchomienie:** `rerun_group=qa-live` albo `rerun_group=qa`.                                                                                                                                                                                                                                                   |
| Weryfikator wydania | **Zadanie:** `Verify release checks`<br />**Powiązany workflow:** brak<br />**Testy:** wymagane zadania kontroli wydania dla wybranej grupy ponownego uruchomienia.<br />**Ponowne uruchomienie:** uruchom ponownie po przejściu ukierunkowanych zadań podrzędnych.                                                                                                                                                                                                                                 |

## Fragmenty ścieżki wydania Docker

Etap ścieżki wydania Docker uruchamia te fragmenty, gdy `live_suite_filter` jest
pusty:

| Fragment                                                        | Zakres                                                                           |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `core`                                                          | Główne ścieżki smoke ścieżki wydania Docker.                                     |
| `package-update-openai`                                         | Zachowanie instalacji/aktualizacji pakietu OpenAI, w tym instalacja Codex na żądanie. |
| `package-update-anthropic`                                      | Zachowanie instalacji i aktualizacji pakietu Anthropic.                          |
| `package-update-core`                                           | Neutralne względem dostawcy zachowanie pakietu i aktualizacji.                   |
| `plugins-runtime-plugins`                                       | Ścieżki środowiska uruchomieniowego Pluginów, które sprawdzają zachowanie Pluginów. |
| `plugins-runtime-services`                                      | Wspierane usługami i live ścieżki środowiska uruchomieniowego Pluginów; obejmuje OpenWebUI, gdy jest wymagane. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Partie instalacji/środowiska uruchomieniowego Pluginów podzielone na potrzeby równoległej walidacji wydania. |

Użyj ukierunkowanego `docker_lanes=<lane[,lane]>` w wielorazowym workflow live/E2E, gdy
nie powiodła się tylko jedna ścieżka Docker. Artefakty wydania zawierają polecenia
ponownego uruchomienia dla poszczególnych ścieżek z wejściami artefaktu pakietu
i ponownego użycia obrazu, gdy są dostępne.

## Profile wydania

`release_profile` kontroluje głównie szerokość live/dostawców w kontrolach wydania.
Nie usuwa normalnego pełnego CI, Plugin Prerelease, smoke instalacji, akceptacji
pakietu ani QA Lab. Dla `stable` wyczerpujące repo/live E2E i fragmenty
ścieżki wydania Docker są zakresem soak i uruchamiają się, gdy `run_release_soak=true`.
`full` wymusza włączenie zakresu soak, a także sprawia, że zbiorcze uruchomienie
wykonuje E2E pakietu Telegram względem nadrzędnego artefaktu pakietu wydania, gdy `rerun_group=all`, aby pełny
kandydat przed publikacją nie pominął po cichu tej ścieżki pakietu Telegram.

| Profil    | Zamierzone użycie                  | Uwzględniony zakres live/dostawców                                                                                                                                                  |
| --------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Najszybszy smoke krytyczny dla wydania. | Ścieżka live OpenAI/core, modele live Docker dla OpenAI, natywny rdzeń Gateway, natywny profil Gateway OpenAI, natywny Plugin OpenAI oraz Gateway live Docker OpenAI.              |
| `stable`  | Domyślny profil zatwierdzania wydania. | `minimum` plus smoke Anthropic, Google, MiniMax, backend, natywny harness testów live, backend CLI live Docker, powiązanie ACP Docker, harness Codex Docker oraz fragment smoke OpenCode Go. |
| `full`    | Szeroki przegląd doradczy.         | `stable` plus dostawcy doradczy, fragmenty live Pluginów i fragmenty live mediów.                                                                                                  |

## Dodatki tylko dla pełnego profilu

Te zestawy są pomijane przez `stable` i uwzględniane przez `full`:

| Obszar                           | Zakres tylko w pełnym profilu                                                                                              |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Modele live Docker               | OpenCode Go, OpenRouter, xAI, Z.ai i Fireworks.                                                                             |
| Gateway live Docker              | Dostawcy doradczy podzieleni na fragmenty DeepSeek/Fireworks, OpenCode Go/OpenRouter oraz xAI/Z.ai.                         |
| Natywne profile dostawców Gateway | Pełne fragmenty Anthropic Opus i Sonnet/Haiku, Fireworks, DeepSeek, pełne fragmenty modeli OpenCode Go, OpenRouter, xAI i Z.ai. |
| Natywne fragmenty live Pluginów  | Pluginy A-K, L-N, O-Z inne, Moonshot i xAI.                                                                                 |
| Natywne fragmenty live mediów    | Audio, muzyka Google, muzyka MiniMax oraz grupy wideo A-D.                                                                  |

`stable` obejmuje `native-live-src-gateway-profiles-anthropic-smoke` i
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` zamiast tego używa szerszych
fragmentów modeli Anthropic i OpenCode Go. Ukierunkowane ponowne uruchomienia nadal mogą używać
zagregowanych uchwytów `native-live-src-gateway-profiles-anthropic` lub
`native-live-src-gateway-profiles-opencode-go`.

## Ukierunkowane ponowne uruchomienia

Użyj `rerun_group`, aby uniknąć powtarzania niepowiązanych pól wydania:

| Uchwyt              | Zakres                                                                |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Wszystkie etapy pełnej walidacji wydania.                             |
| `ci`                | Tylko ręczny podrzędny proces pełnego CI.                              |
| `plugin-prerelease` | Tylko podrzędny proces przedpremierowy Plugin.                         |
| `release-checks`    | Wszystkie etapy kontroli wydania OpenClaw.                             |
| `install-smoke`     | Test instalacji Smoke przez kontrole wydania.                          |
| `cross-os`          | Kontrole wydania między systemami operacyjnymi.                        |
| `live-e2e`          | Walidacja ścieżki wydania repo/live E2E i Docker.                      |
| `package`           | Akceptacja pakietu.                                                    |
| `qa`                | Parytet QA oraz live lane QA.                                          |
| `qa-parity`         | Tylko lane parytetu QA i raport.                                       |
| `qa-live`           | Tylko live Matrix i Telegram dla QA.                                   |
| `npm-telegram`      | E2E Telegram dla opublikowanego pakietu; wymaga `npm_telegram_package_spec`. |

Użyj `live_suite_filter` z `rerun_group=live-e2e`, gdy jeden live suite zakończył się niepowodzeniem.
Prawidłowe identyfikatory filtrów są zdefiniowane w wielokrotnego użytku workflow live/E2E, w tym
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` oraz
`live-codex-harness-docker`.

Uchwyt `live-gateway-advisory-docker` jest zbiorczym uchwytem ponownego uruchomienia dla trzech
shardów providerów, więc nadal rozwija się do wszystkich zadań Gateway Docker typu advisory.

Użyj `cross_os_suite_filter` z `rerun_group=cross-os`, gdy jedna lane cross-OS
zakończyła się niepowodzeniem. Filtr akceptuje identyfikator OS, identyfikator suite albo parę OS/suite, na
przykład `windows/packaged-upgrade`, `windows` lub `packaged-fresh`. Podsumowania cross-OS
zawierają czasy poszczególnych faz dla lane aktualizacji pakietowej, a długo działające
polecenia wypisują wiersze Heartbeat, aby zablokowana aktualizacja Windows była widoczna przed
limitem czasu zadania.

Lane kontroli wydania QA mają charakter doradczy. Niepowodzenie dotyczące wyłącznie QA jest zgłaszane jako ostrzeżenie
i nie blokuje weryfikatora kontroli wydania; uruchom ponownie `rerun_group=qa`,
`qa-parity` lub `qa-live`, gdy potrzebujesz świeżych dowodów QA.

## Dowody do zachowania

Zachowaj podsumowanie `Full Release Validation` jako indeks na poziomie wydania. Zawiera linki do
identyfikatorów uruchomień podrzędnych i tabele najwolniejszych zadań. W przypadku niepowodzeń najpierw sprawdź podrzędny
workflow, a następnie uruchom ponownie najmniejszy pasujący uchwyt powyżej.

Przydatne artefakty:

- `release-package-under-test` z nadrzędnego procesu Full Release Validation oraz `OpenClaw Release Checks`
- Artefakty ścieżki wydania Docker pod `.artifacts/docker-tests/`
- `package-under-test` akceptacji pakietu i artefakty akceptacji Docker
- Artefakty kontroli wydania cross-OS dla każdego OS i suite
- Artefakty parytetu QA, Matrix i Telegram

## Pliki workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
