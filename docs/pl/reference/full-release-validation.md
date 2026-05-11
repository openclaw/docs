---
read_when:
    - Uruchamianie lub ponowne uruchamianie pełnej walidacji wydania
    - 'Porównanie profili walidacji wydań: stabilnego i pełnego'
    - Debugowanie niepowodzeń etapu weryfikacji wydania
summary: 'Pełna walidacja wydania: etapy, podrzędne przepływy pracy, profile wydań, uchwyty ponownego uruchomienia i dowody'
title: Pełna walidacja wydania
x-i18n:
    generated_at: "2026-05-11T20:37:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3d83d15272e4f7cff82ef791c8dbeb6adc447626ada8ae221d074ee16b2cadd5
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` jest nadrzędnym parasolem wydania. To pojedynczy ręczny
punkt wejścia dla dowodu przed wydaniem, ale większość pracy odbywa się w podrzędnych przepływach pracy, aby
nieudany element można było uruchomić ponownie bez restartowania całego wydania.

Uruchom go z zaufanego odniesienia przepływu pracy, zwykle `main`, i przekaż gałąź wydania,
tag albo pełny SHA commita jako `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Podrzędne przepływy pracy używają zaufanego odniesienia przepływu pracy dla harnessu oraz wejścia
`ref` dla kandydata objętego testem. Dzięki temu nowa logika walidacji pozostaje dostępna
podczas walidowania starszej gałęzi wydania lub taga.

Domyślnie `release_profile=stable` uruchamia ścieżki blokujące wydanie i pomija
wyczerpujący live/Docker soak. Przekaż `run_release_soak=true`, aby uwzględnić
ścieżki soak w stabilnym uruchomieniu. `release_profile=full` zawsze włącza ścieżki soak, aby
szeroki profil doradczy nigdy po cichu nie tracił pokrycia.

Package Acceptance zwykle buduje tarball kandydata z rozwiązanego
`ref`, w tym uruchomienia z pełnym SHA wywołane przez `pnpm ci:full-release`. Po
opublikowaniu wersji beta przekaż `release_package_spec=openclaw@YYYY.M.D-beta.N`, aby ponownie użyć
wysłanego pakietu npm w kontrolach wydania, Package Acceptance, cross-OS,
release-path Docker i package Telegram. Używaj `package_acceptance_package_spec`
tylko wtedy, gdy Package Acceptance ma celowo udowodnić inny pakiet.

## Etapy najwyższego poziomu

| Etap                 | Szczegóły                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rozwiązanie celu     | **Zadanie:** `Resolve target ref`<br />**Podrzędny przepływ pracy:** brak<br />**Dowodzi:** rozwiązuje gałąź wydania, tag lub pełny SHA commita i zapisuje wybrane wejścia.<br />**Ponowne uruchomienie:** uruchom ponownie parasol, jeśli to się nie powiedzie.                                                                                                                                                                            |
| Vitest i normalne CI | **Zadanie:** `Run normal full CI`<br />**Podrzędny przepływ pracy:** `CI`<br />**Dowodzi:** ręczny pełny graf CI względem docelowego odniesienia, w tym ścieżki Linux Node, shardy dołączonych pluginów, kontrakty kanałów, zgodność z Node 22, `check`, `check-additional`, build smoke, kontrole dokumentacji, Skills Pythona, Windows, macOS, i18n Control UI oraz Android przez parasol.<br />**Ponowne uruchomienie:** `rerun_group=ci`. |
| Przedwydanie pluginów | **Zadanie:** `Run plugin prerelease validation`<br />**Podrzędny przepływ pracy:** `Plugin Prerelease`<br />**Dowodzi:** tylko wydaniowe statyczne kontrole pluginów, agentowe pokrycie pluginów, pełne shardy wsadowe rozszerzeń, przedwydaniowe ścieżki Docker pluginów oraz nieblokujący artefakt `plugin-inspector-advisory` do triage'u zgodności.<br />**Ponowne uruchomienie:** `rerun_group=plugin-prerelease`.             |
| Kontrole wydania     | **Zadanie:** `Run release/live/Docker/QA validation`<br />**Podrzędny przepływ pracy:** `OpenClaw Release Checks`<br />**Dowodzi:** install smoke, kontrole pakietów cross-OS, Package Acceptance, parytet QA Lab, live Matrix i live Telegram. Z `run_release_soak=true` lub `release_profile=full` uruchamia także wyczerpujące zestawy live/E2E oraz fragmenty release-path Docker.<br />**Ponowne uruchomienie:** `rerun_group=release-checks` lub węższy uchwyt release-checks. |
| Artefakt pakietu     | **Zadanie:** `Prepare release package artifact`<br />**Podrzędny przepływ pracy:** brak<br />**Dowodzi:** tworzy nadrzędny tarball `release-package-under-test` wystarczająco wcześnie dla kontroli skierowanych na pakiet, które nie muszą czekać na `OpenClaw Release Checks`.<br />**Ponowne uruchomienie:** uruchom ponownie parasol albo podaj `release_package_spec` dla ponownych uruchomień opublikowanego pakietu.     |
| Package Telegram     | **Zadanie:** `Run package Telegram E2E`<br />**Podrzędny przepływ pracy:** `NPM Telegram Beta E2E`<br />**Dowodzi:** dowód pakietu Telegram oparty na artefakcie nadrzędnym dla `rerun_group=all` z `release_profile=full` albo dowód Telegram dla opublikowanego pakietu, gdy ustawiono `release_package_spec` lub `npm_telegram_package_spec`.<br />**Ponowne uruchomienie:** `rerun_group=npm-telegram` z `release_package_spec` lub `npm_telegram_package_spec`. |
| Weryfikator parasola | **Zadanie:** `Verify full validation`<br />**Podrzędny przepływ pracy:** brak<br />**Dowodzi:** ponownie sprawdza zapisane konkluzje uruchomień podrzędnych i dołącza tabele najwolniejszych zadań z podrzędnych przepływów pracy.<br />**Ponowne uruchomienie:** uruchom ponownie tylko to zadanie po doprowadzeniu nieudanego przepływu podrzędnego do stanu zielonego.                                                                 |

Dla `ref=main` i `rerun_group=all` nowszy parasol zastępuje starszy.
Gdy element nadrzędny zostanie anulowany, jego monitor anuluje każdy podrzędny przepływ pracy, który już
wysłał. Uruchomienia walidacji gałęzi wydania i tagów domyślnie nie anulują się nawzajem.

## Etapy kontroli wydania

`OpenClaw Release Checks` to największy podrzędny przepływ pracy. Rozwiązuje cel
raz i przygotowuje współdzielony artefakt `release-package-under-test`, gdy potrzebują go etapy
skierowane na pakiet lub Docker.

| Etap                | Szczegóły                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cel wydania         | **Zadanie:** `Resolve target ref`<br />**Przepływ pracy bazowy:** brak<br />**Testy:** wybrany ref, opcjonalny oczekiwany SHA, profil, grupa ponownego uruchomienia i ukierunkowany filtr pakietu testów live.<br />**Ponowne uruchomienie:** `rerun_group=release-checks`.                                                                                                                                                                                                                   |
| Artefakt pakietu    | **Zadanie:** `Prepare release package artifact`<br />**Przepływ pracy bazowy:** brak<br />**Testy:** pakuje albo rozwiązuje jeden kandydacki tarball i przesyła `release-package-under-test` do dalszych kontroli dotyczących pakietu.<br />**Ponowne uruchomienie:** dotknięty pakiet, grupa cross-OS albo live/E2E.                                                                                                                                                                             |
| Smoke instalacji    | **Zadanie:** `Run install smoke`<br />**Przepływ pracy bazowy:** `Install Smoke`<br />**Testy:** pełna ścieżka instalacji z ponownym użyciem obrazu smoke z głównego Dockerfile, instalacja pakietu QR, smoke głównego i Gateway w Dockerze, testy instalatora w Dockerze, smoke dostawcy obrazów dla globalnej instalacji Bun oraz szybkie E2E instalacji/deinstalacji dołączonych pluginów.<br />**Ponowne uruchomienie:** `rerun_group=install-smoke`.                                      |
| Cross-OS            | **Zadanie:** `cross_os_release_checks`<br />**Przepływ pracy bazowy:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testy:** ścieżki świeżej instalacji i aktualizacji w systemach Linux, Windows i macOS dla wybranego dostawcy i trybu, z użyciem kandydackiego tarballa oraz pakietu bazowego.<br />**Ponowne uruchomienie:** `rerun_group=cross-os`.                                                                                                                                 |
| Repozytorium i live E2E | **Zadanie:** `Run repo/live E2E validation`<br />**Przepływ pracy bazowy:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testy:** E2E repozytorium, cache live, strumieniowanie OpenAI websocket, natywne shardy dostawcy live i pluginów oraz oparte na Dockerze harnessy live model/backend/gateway wybrane przez `release_profile`.<br />**Uruchomienia:** `run_release_soak=true`, `release_profile=full` albo ukierunkowane `rerun_group=live-e2e`.<br />**Ponowne uruchomienie:** `rerun_group=live-e2e`, opcjonalnie z `live_suite_filter`. |
| Ścieżka wydania Docker | **Zadanie:** `Run Docker release-path validation`<br />**Przepływ pracy bazowy:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testy:** fragmenty ścieżki wydania Docker względem współdzielonego artefaktu pakietu.<br />**Uruchomienia:** `run_release_soak=true`, `release_profile=full` albo ukierunkowane `rerun_group=live-e2e`.<br />**Ponowne uruchomienie:** `rerun_group=live-e2e`.                                                                                         |
| Akceptacja pakietu  | **Zadanie:** `Run package acceptance`<br />**Przepływ pracy bazowy:** `Package Acceptance`<br />**Testy:** offline fixture’y pakietów pluginów, aktualizacja pluginu, akceptacja pakietu Telegram z mock-OpenAI oraz kontrole przetrwania po aktualizacji z opublikowanej wersji względem tego samego tarballa. Blokujące kontrole wydania używają domyślnej najnowszej opublikowanej bazy; kontrole soak rozszerzają zakres do każdego stabilnego wydania npm od `2026.4.23` włącznie oraz fixture’ów zgłoszonych problemów.<br />**Ponowne uruchomienie:** `rerun_group=package`. |
| Parzystość QA       | **Zadanie:** `Run QA Lab parity lane` i `Run QA Lab parity report`<br />**Przepływ pracy bazowy:** zadania bezpośrednie<br />**Testy:** kandydackie i bazowe pakiety parzystości agentowej, a następnie raport parzystości.<br />**Ponowne uruchomienie:** `rerun_group=qa-parity` albo `rerun_group=qa`.                                                                                                                                                                                              |
| QA live Matrix      | **Zadanie:** `Run QA Lab live Matrix lane`<br />**Przepływ pracy bazowy:** zadanie bezpośrednie<br />**Testy:** szybki profil QA live Matrix w środowisku `qa-live-shared`.<br />**Ponowne uruchomienie:** `rerun_group=qa-live` albo `rerun_group=qa`.                                                                                                                                                                                                                                            |
| QA live Telegram    | **Zadanie:** `Run QA Lab live Telegram lane`<br />**Przepływ pracy bazowy:** zadanie bezpośrednie<br />**Testy:** QA live Telegram z dzierżawami poświadczeń Convex CI.<br />**Ponowne uruchomienie:** `rerun_group=qa-live` albo `rerun_group=qa`.                                                                                                                                                                                                                                                |
| Weryfikator wydania | **Zadanie:** `Verify release checks`<br />**Przepływ pracy bazowy:** brak<br />**Testy:** wymagane zadania kontroli wydania dla wybranej grupy ponownego uruchomienia.<br />**Ponowne uruchomienie:** uruchom ponownie po przejściu ukierunkowanych zadań podrzędnych.                                                                                                                                                                                                                            |

## Fragmenty ścieżki wydania Docker

Etap ścieżki wydania Docker uruchamia te fragmenty, gdy `live_suite_filter` jest
pusty:

| Fragment                                                        | Pokrycie                                                                                         |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `core`                                                          | Główne ścieżki smoke ścieżki wydania Docker.                                                     |
| `package-update-openai`                                         | Zachowanie instalacji/aktualizacji pakietu OpenAI, instalacja Codex na żądanie i wywołania narzędzi Chat Completions. |
| `package-update-anthropic`                                      | Zachowanie instalacji i aktualizacji pakietu Anthropic.                                          |
| `package-update-core`                                           | Neutralne względem dostawcy zachowanie pakietu i aktualizacji.                                   |
| `plugins-runtime-plugins`                                       | Ścieżki środowiska uruchomieniowego pluginów, które wykonują zachowanie pluginów.                |
| `plugins-runtime-services`                                      | Ścieżki środowiska uruchomieniowego pluginów opartych na usługach i live; obejmuje OpenWebUI, gdy jest wymagane. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Partie instalacji/środowiska uruchomieniowego pluginów podzielone na potrzeby równoległej walidacji wydania. |

Użyj ukierunkowanego `docker_lanes=<lane[,lane]>` w przepływie pracy live/E2E wielokrotnego użytku, gdy
zawiodła tylko jedna ścieżka Docker. Artefakty wydania obejmują polecenia
ponownego uruchomienia dla poszczególnych ścieżek z wejściami artefaktu pakietu
i ponownego użycia obrazu, gdy są dostępne.

## Profile wydania

`release_profile` kontroluje głównie zakres live/dostawców w kontrolach wydania.
Nie usuwa normalnego pełnego CI, Plugin Prerelease, smoke instalacji, akceptacji
pakietu ani QA Lab. Dla `stable` wyczerpujące repo/live E2E i fragmenty ścieżki
wydania Docker są pokryciem soak i uruchamiają się, gdy `run_release_soak=true`.
`full` wymusza włączenie pokrycia soak, a także sprawia, że nadrzędne uruchomienie
wykonuje E2E pakietu Telegram względem nadrzędnego artefaktu pakietu wydania,
gdy `rerun_group=all`, więc pełny kandydat przed publikacją nie pomija po cichu
tej ścieżki pakietu Telegram.

| Profil    | Zamierzone użycie                 | Uwzględnione pokrycie live/dostawców                                                                                                                                                 |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Najszybszy smoke krytyczny dla wydania. | Ścieżka live OpenAI/core, modele live Docker dla OpenAI, natywny rdzeń Gateway, natywny profil Gateway OpenAI, natywny plugin OpenAI i live Gateway OpenAI w Dockerze.             |
| `stable`  | Domyślny profil zatwierdzania wydania. | `minimum` plus smoke Anthropic, Google, MiniMax, backend, natywny harness testów live, backend CLI live w Dockerze, bind ACP w Dockerze, harness Codex w Dockerze i shard smoke OpenCode Go. |
| `full`    | Szeroki przegląd doradczy.        | `stable` plus dostawcy doradczy, shardy live pluginów i shardy live mediów.                                                                                                        |

## Dodatki tylko dla full

Te pakiety testów są pomijane przez `stable` i uwzględniane przez `full`:

| Obszar                           | Pokrycie tylko dla full                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Modele live Docker               | OpenCode Go, OpenRouter, xAI, Z.ai i Fireworks.                                                                          |
| Gateway live Docker              | Dostawcy doradczy podzieleni na shardy DeepSeek/Fireworks, OpenCode Go/OpenRouter oraz xAI/Z.ai.                        |
| Natywne profile dostawców Gateway | Pełne shardy Anthropic Opus i Sonnet/Haiku, Fireworks, DeepSeek, pełne shardy modeli OpenCode Go, OpenRouter, xAI i Z.ai. |
| Natywne shardy live pluginów     | Pluginy A-K, L-N, O-Z inne, Moonshot i xAI.                                                                              |
| Natywne shardy live mediów       | Audio, muzyka Google, muzyka MiniMax i grupy wideo A-D.                                                                  |

`stable` obejmuje `native-live-src-gateway-profiles-anthropic-smoke` i
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` używa zamiast tego
szerszych shardów modeli Anthropic i OpenCode Go. Ukierunkowane ponowne
uruchomienia nadal mogą używać zagregowanych uchwytów
`native-live-src-gateway-profiles-anthropic` albo
`native-live-src-gateway-profiles-opencode-go`.

## Ukierunkowane ponowne uruchomienia

Użyj `rerun_group`, aby uniknąć powtarzania niepowiązanych pól wydania:

| Uchwyt              | Zakres                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | Wszystkie etapy pełnej walidacji wydania.                                                       |
| `ci`                | Tylko ręczny podrzędny pełny CI.                                                                |
| `plugin-prerelease` | Tylko podrzędne wstępne wydanie Plugin.                                                         |
| `release-checks`    | Wszystkie etapy kontroli wydania OpenClaw.                                                      |
| `install-smoke`     | Smoke instalacji przez kontrole wydania.                                                        |
| `cross-os`          | Kontrole wydania między systemami operacyjnymi.                                                 |
| `live-e2e`          | Walidacja repo/live E2E i ścieżki wydania Docker.                                               |
| `package`           | Akceptacja pakietu.                                                                             |
| `qa`                | Parzystość QA oraz aktywne ścieżki QA.                                                          |
| `qa-parity`         | Tylko ścieżki parzystości QA i raport.                                                          |
| `qa-live`           | Tylko aktywne Matrix i Telegram w QA.                                                           |
| `npm-telegram`      | Telegram E2E dla opublikowanego pakietu; wymaga `release_package_spec` lub `npm_telegram_package_spec`. |

Użyj `live_suite_filter` z `rerun_group=live-e2e`, gdy nie powiedzie się jeden aktywny zestaw.
Prawidłowe identyfikatory filtrów są zdefiniowane w wielokrotnie używanym przepływie pracy live/E2E, w tym
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` oraz
`live-codex-harness-docker`.

Uchwyt `live-gateway-advisory-docker` jest zagregowanym uchwytem ponownego uruchomienia dla swoich
trzech fragmentów dostawców, więc nadal rozdziela się na wszystkie zadania doradcze Docker Gateway.

Użyj `cross_os_suite_filter` z `rerun_group=cross-os`, gdy nie powiedzie się jedna ścieżka między systemami operacyjnymi.
Filtr akceptuje identyfikator systemu operacyjnego, identyfikator zestawu albo parę system/zestaw, na
przykład `windows/packaged-upgrade`, `windows` lub `packaged-fresh`. Podsumowania między systemami operacyjnymi
zawierają czasy poszczególnych faz dla ścieżek uaktualnienia pakietowego, a długo działające
polecenia wypisują wiersze Heartbeat, aby zablokowana aktualizacja Windows była widoczna przed
limitem czasu zadania.

Ścieżki QA kontroli wydania są doradcze. Awaria dotycząca tylko QA jest zgłaszana jako ostrzeżenie
i nie blokuje weryfikatora kontroli wydania; uruchom ponownie `rerun_group=qa`,
`qa-parity` albo `qa-live`, gdy potrzebujesz świeżych dowodów QA.

## Dowody do zachowania

Zachowaj podsumowanie `Full Release Validation` jako indeks na poziomie wydania. Łączy ono
identyfikatory przebiegów podrzędnych i zawiera tabele najwolniejszych zadań. W przypadku awarii najpierw sprawdź podrzędny
przepływ pracy, a następnie uruchom ponownie najmniejszy pasujący uchwyt z powyższych.

Przydatne artefakty:

- `release-package-under-test` z nadrzędnego przepływu pełnej walidacji wydania oraz `OpenClaw Release Checks`
- Artefakty ścieżki wydania Docker w `.artifacts/docker-tests/`
- Artefakty akceptacji pakietu `package-under-test` i akceptacji Docker
- Artefakty kontroli wydania między systemami operacyjnymi dla każdego systemu operacyjnego i zestawu
- Artefakty parzystości QA, Matrix i Telegram

## Pliki przepływów pracy

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
