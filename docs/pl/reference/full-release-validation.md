---
read_when:
    - Uruchamianie lub ponowne uruchamianie pełnej walidacji wydania
    - Porównanie stabilnego i pełnego profilu walidacji wydań
    - Debugowanie niepowodzeń etapów walidacji wydania
summary: Etapy pełnej walidacji wydania, podrzędne przepływy pracy, profile wydania, uchwyty ponownego uruchomienia i dowody
title: Pełna walidacja wydania
x-i18n:
    generated_at: "2026-05-03T21:36:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 038901ad751c00b35f69d7ec5caf74e577dcf2350d7658037c3ecc9ff5fab6d7
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` to parasol wydania. Jest to pojedynczy ręczny
punkt wejścia dla dowodów przedwydaniowych, ale większość pracy odbywa się w podrzędnych workflow, aby
nieudane środowisko można było uruchomić ponownie bez restartowania całego wydania.

Uruchom go z zaufanego odwołania workflow, zwykle `main`, i przekaż gałąź wydania,
tag lub pełny SHA commita jako `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Podrzędne workflow używają zaufanego odwołania workflow dla zestawu testowego oraz wejściowego
`ref` dla testowanego kandydata. Dzięki temu nowa logika walidacji pozostaje dostępna
podczas walidowania starszej gałęzi wydania lub tagu.

Akceptacja pakietu zwykle buduje tarball kandydata z rozwiązanego
`ref`, w tym uruchomienia z pełnym SHA wyzwalane przez `pnpm ci:full-release`. Po
opublikowaniu przekaż `package_acceptance_package_spec=openclaw@YYYY.M.D` (lub
`openclaw@beta`/`openclaw@latest`), aby zamiast tego uruchomić tę samą macierz pakietu/aktualizacji względem
wysłanego pakietu npm.

## Etapy najwyższego poziomu

| Etap                 | Szczegóły                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rozwiązywanie celu   | **Zadanie:** `Resolve target ref`<br />**Podrzędny workflow:** brak<br />**Dowodzi:** rozwiązuje gałąź wydania, tag lub pełny SHA commita oraz zapisuje wybrane dane wejściowe.<br />**Ponowne uruchomienie:** uruchom ponownie parasol, jeśli to się nie powiedzie.                                                                                                                        |
| Vitest i normalne CI | **Zadanie:** `Run normal full CI`<br />**Podrzędny workflow:** `CI`<br />**Dowodzi:** ręczny pełny graf CI względem docelowego ref, w tym ścieżki Linux Node, fragmenty dołączonych pluginów, kontrakty kanałów, zgodność z Node 22, `check`, `check-additional`, smoke builda, kontrole dokumentacji, Python skills, Windows, macOS, i18n Control UI oraz Android przez parasol.<br />**Ponowne uruchomienie:** `rerun_group=ci`. |
| Wstępne wydanie pluginów | **Zadanie:** `Run plugin prerelease validation`<br />**Podrzędny workflow:** `Plugin Prerelease`<br />**Dowodzi:** statyczne kontrole pluginów tylko dla wydania, pokrycie pluginów agentowych, pełne fragmenty partii rozszerzeń oraz ścieżki Docker dla wstępnego wydania pluginów.<br />**Ponowne uruchomienie:** `rerun_group=plugin-prerelease`.                                      |
| Kontrole wydania     | **Zadanie:** `Run release/live/Docker/QA validation`<br />**Podrzędny workflow:** `OpenClaw Release Checks`<br />**Dowodzi:** smoke instalacji, kontrole pakietów między systemami operacyjnymi, zestawy live/E2E, fragmenty ścieżki wydania Docker, akceptację pakietu, parytet QA Lab, live Matrix oraz live Telegram.<br />**Ponowne uruchomienie:** `rerun_group=release-checks` lub węższy uchwyt release-checks. |
| Artefakt pakietu     | **Zadanie:** `Prepare release package artifact`<br />**Podrzędny workflow:** brak<br />**Dowodzi:** tworzy nadrzędny tarball `release-package-under-test` wystarczająco wcześnie dla kontroli pakietowych, które nie muszą czekać na `OpenClaw Release Checks`.<br />**Ponowne uruchomienie:** uruchom ponownie parasol lub podaj `npm_telegram_package_spec` dla `rerun_group=npm-telegram`. |
| Pakiet Telegram      | **Zadanie:** `Run package Telegram E2E`<br />**Podrzędny workflow:** `NPM Telegram Beta E2E`<br />**Dowodzi:** dowód pakietu Telegram oparty na artefakcie nadrzędnym dla `rerun_group=all` z `release_profile=full` albo dowód Telegram opublikowanego pakietu, gdy ustawiono `npm_telegram_package_spec`.<br />**Ponowne uruchomienie:** `rerun_group=npm-telegram` z `npm_telegram_package_spec`. |
| Weryfikator parasola | **Zadanie:** `Verify full validation`<br />**Podrzędny workflow:** brak<br />**Dowodzi:** ponownie sprawdza zapisane wyniki podrzędnych uruchomień i dopisuje tabele najwolniejszych zadań z podrzędnych workflow.<br />**Ponowne uruchomienie:** po doprowadzeniu nieudanego podrzędnego workflow do zielonego stanu uruchom ponownie tylko to zadanie.                                         |

Dla `ref=main` i `rerun_group=all` nowszy parasol zastępuje starszy.
Gdy element nadrzędny zostanie anulowany, jego monitor anuluje każdy podrzędny workflow, który już
wyzwolił. Uruchomienia walidacji gałęzi wydania i tagów domyślnie nie anulują się nawzajem.

## Etapy kontroli wydania

`OpenClaw Release Checks` to największy podrzędny workflow. Rozwiązuje cel
raz i przygotowuje współdzielony artefakt `release-package-under-test`, gdy wymagają go etapy
pakietowe lub Docker.

| Etap                | Szczegóły                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cel wydania         | **Zadanie:** `Resolve target ref`<br />**Workflow wspierający:** brak<br />**Testuje:** wybrany ref, opcjonalny oczekiwany SHA, profil, grupę ponownego uruchomienia i filtr skoncentrowanego zestawu live.<br />**Ponowne uruchomienie:** `rerun_group=release-checks`.                                                                                                                        |
| Artefakt pakietu    | **Zadanie:** `Prepare release package artifact`<br />**Workflow wspierający:** brak<br />**Testuje:** pakuje lub rozwiązuje jeden tarball kandydata oraz przesyła `release-package-under-test` dla dalszych kontroli pakietowych.<br />**Ponowne uruchomienie:** dotknięta grupa pakietu, cross-OS lub live/E2E.                                                                                 |
| Smoke instalacji    | **Zadanie:** `Run install smoke`<br />**Workflow wspierający:** `Install Smoke`<br />**Testuje:** pełną ścieżkę instalacji z ponownym użyciem obrazu smoke root Dockerfile, instalację pakietu QR, smoke Docker roota i Gateway, testy Docker instalatora, smoke globalnej instalacji Bun dla dostawcy obrazu oraz szybkie E2E instalacji/odinstalowania dołączonych pluginów.<br />**Ponowne uruchomienie:** `rerun_group=install-smoke`. |
| Cross-OS            | **Zadanie:** `cross_os_release_checks`<br />**Workflow wspierający:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testuje:** świeże ścieżki i ścieżki aktualizacji w Linux, Windows i macOS dla wybranego dostawcy i trybu, używając tarballa kandydata oraz pakietu bazowego.<br />**Ponowne uruchomienie:** `rerun_group=cross-os`.                                             |
| Repozytorium i live E2E | **Zadanie:** `Run repo/live E2E validation`<br />**Workflow wspierający:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testuje:** E2E repozytorium, cache live, streaming OpenAI websocket, natywnego dostawcę live i fragmenty pluginów oraz oparte na Docker zestawy testowe live dla modelu/backendu/Gateway wybrane przez `release_profile`.<br />**Ponowne uruchomienie:** `rerun_group=live-e2e`, opcjonalnie z `live_suite_filter`. |
| Ścieżka wydania Docker | **Zadanie:** `Run Docker release-path validation`<br />**Workflow wspierający:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testuje:** fragmenty Docker ścieżki wydania względem współdzielonego artefaktu pakietu.<br />**Ponowne uruchomienie:** `rerun_group=live-e2e`.                                                                                                               |
| Akceptacja pakietu  | **Zadanie:** `Run package acceptance`<br />**Workflow wspierający:** `Package Acceptance`<br />**Testuje:** offline'owe fixture'y pakietów pluginów, aktualizację pluginów, akceptację pakietu Telegram z mock-OpenAI oraz kontrole przetrwania opublikowanych aktualizacji z każdego stabilnego wydania npm od `2026.4.23` względem tego samego tarballa.<br />**Ponowne uruchomienie:** `rerun_group=package`. |
| Parytet QA          | **Zadanie:** `Run QA Lab parity lane` i `Run QA Lab parity report`<br />**Workflow wspierający:** zadania bezpośrednie<br />**Testuje:** pakiety parytetu agentowego kandydata i bazy, a następnie raport parytetu.<br />**Ponowne uruchomienie:** `rerun_group=qa-parity` lub `rerun_group=qa`.                                                                                              |
| Live QA Matrix      | **Zadanie:** `Run QA Lab live Matrix lane`<br />**Workflow wspierający:** zadanie bezpośrednie<br />**Testuje:** szybki profil live QA Matrix w środowisku `qa-live-shared`.<br />**Ponowne uruchomienie:** `rerun_group=qa-live` lub `rerun_group=qa`.                                                                                                                                        |
| Live QA Telegram    | **Zadanie:** `Run QA Lab live Telegram lane`<br />**Workflow wspierający:** zadanie bezpośrednie<br />**Testuje:** live QA Telegram z dzierżawami poświadczeń Convex CI.<br />**Ponowne uruchomienie:** `rerun_group=qa-live` lub `rerun_group=qa`.                                                                                                                                             |
| Weryfikator wydania | **Zadanie:** `Verify release checks`<br />**Workflow wspierający:** brak<br />**Testuje:** wymagane zadania kontroli wydania dla wybranej grupy ponownego uruchomienia.<br />**Ponowne uruchomienie:** uruchom ponownie po powodzeniu skoncentrowanych zadań podrzędnych.                                                                                                                     |

## Fragmenty ścieżki wydania Docker

Etap ścieżki wydania Docker uruchamia te fragmenty, gdy `live_suite_filter` jest
pusty:

| Fragment                                                        | Pokrycie                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Ścieżki smoke Core Docker ścieżki wydania.                              |
| `package-update-openai`                                         | Zachowanie instalacji i aktualizacji pakietu OpenAI.                    |
| `package-update-anthropic`                                      | Zachowanie instalacji i aktualizacji pakietu Anthropic.                 |
| `package-update-core`                                           | Neutralne względem dostawcy zachowanie pakietu i aktualizacji.          |
| `plugins-runtime-plugins`                                       | Ścieżki runtime pluginów, które ćwiczą zachowanie pluginów.             |
| `plugins-runtime-services`                                      | Ścieżki runtime pluginów opartych na usługach; obejmuje OpenWebUI, gdy zażądano. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Partie instalacji/runtime pluginów podzielone na równoległą walidację wydania. |

Użyj ukierunkowanego `docker_lanes=<lane[,lane]>` w wielokrotnie używanym przepływie pracy live/E2E, gdy
nie powiódł się tylko jeden Docker lane. Artefakty wydania zawierają polecenia ponownego uruchomienia
dla poszczególnych lane’ów z danymi wejściowymi ponownego użycia artefaktu pakietu i obrazu, gdy są dostępne.

## Profile wydań

`release_profile` kontroluje głównie zakres live/provider w ramach kontroli wydania.
Nie usuwa normalnego pełnego CI, Plugin Prerelease, install smoke, package
acceptance, QA Lab ani fragmentów ścieżki wydania Docker. `full` sprawia także, że
uruchomienie nadrzędne wykonuje pakietowe Telegram E2E względem artefaktu pakietu wydania nadrzędnego, gdy
`rerun_group=all`, dzięki czemu pełny kandydat przed publikacją nie pomija po cichu tego
lane’u pakietowego Telegram.

| Profil    | Zamierzone użycie                     | Uwzględnione pokrycie live/provider                                                                                                                                                     |
| --------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Najszybszy smoke krytyczny dla wydania. | Ścieżka live OpenAI/core, modele live Docker dla OpenAI, natywny rdzeń gateway, natywny profil gateway OpenAI, natywny plugin OpenAI oraz Docker live gateway OpenAI.                  |
| `stable`  | Domyślny profil zatwierdzania wydania. | `minimum` plus Anthropic smoke, Google, MiniMax, backend, natywny zestaw testów live, backend Docker live CLI, powiązanie Docker ACP, zestaw Docker Codex oraz odłamek smoke OpenCode Go. |
| `full`    | Szeroki przegląd doradczy.             | `stable` plus dostawcy doradczy, odłamki live pluginów oraz odłamki live mediów.                                                                                                        |

## Dodatki tylko dla full

Te zestawy są pomijane przez `stable` i uwzględniane przez `full`:

| Obszar                           | Pokrycie tylko dla full                                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Modele live Docker               | OpenCode Go, OpenRouter, xAI, Z.ai i Fireworks.                                                                              |
| Gateway live Docker              | Dostawcy doradczy podzieleni na odłamki DeepSeek/Fireworks, OpenCode Go/OpenRouter oraz xAI/Z.ai.                            |
| Natywne profile dostawców gateway | Pełne odłamki Anthropic Opus i Sonnet/Haiku, Fireworks, DeepSeek, pełne odłamki modeli OpenCode Go, OpenRouter, xAI i Z.ai. |
| Natywne odłamki live pluginów    | Pluginy A-K, L-N, O-Z inne, Moonshot i xAI.                                                                                  |
| Natywne odłamki live mediów      | Audio, muzyka Google, muzyka MiniMax i grupy wideo A-D.                                                                      |

`stable` obejmuje `native-live-src-gateway-profiles-anthropic-smoke` i
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` używa zamiast tego szerszych
odłamków modeli Anthropic i OpenCode Go. Ukierunkowane ponowne uruchomienia nadal mogą używać
zbiorczych uchwytów `native-live-src-gateway-profiles-anthropic` lub
`native-live-src-gateway-profiles-opencode-go`.

## Ukierunkowane ponowne uruchomienia

Użyj `rerun_group`, aby uniknąć powtarzania niepowiązanych pól wydania:

| Uchwyt              | Zakres                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Wszystkie etapy pełnej walidacji wydania.                             |
| `ci`                | Tylko podrzędny ręczny pełny CI.                                       |
| `plugin-prerelease` | Tylko podrzędny Plugin Prerelease.                                     |
| `release-checks`    | Wszystkie etapy kontroli wydania OpenClaw.                            |
| `install-smoke`     | Install Smoke przez kontrole wydania.                                 |
| `cross-os`          | Kontrole wydania między systemami operacyjnymi.                       |
| `live-e2e`          | Walidacja E2E repo/live i ścieżki wydania Docker.                     |
| `package`           | Package Acceptance.                                                   |
| `qa`                | Parytet QA plus lane’y QA live.                                       |
| `qa-parity`         | Tylko lane’y parytetu QA i raport.                                    |
| `qa-live`           | Tylko Matrix QA live i Telegram.                                      |
| `npm-telegram`      | Telegram E2E opublikowanego pakietu; wymaga `npm_telegram_package_spec`. |

Użyj `live_suite_filter` z `rerun_group=live-e2e`, gdy nie powiódł się jeden zestaw live.
Prawidłowe identyfikatory filtrów są zdefiniowane w wielokrotnie używanym przepływie pracy live/E2E, w tym
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` oraz
`live-codex-harness-docker`.

Uchwyt `live-gateway-advisory-docker` jest zbiorczym uchwytem ponownego uruchomienia dla swoich
trzech odłamków dostawców, więc nadal rozgałęzia się na wszystkie zadania doradcze Docker gateway.

## Dowody do zachowania

Zachowaj podsumowanie `Full Release Validation` jako indeks na poziomie wydania. Zawiera linki
do identyfikatorów uruchomień podrzędnych i tabele najwolniejszych zadań. W przypadku niepowodzeń najpierw sprawdź podrzędny
przepływ pracy, a następnie ponownie uruchom najmniejszy pasujący uchwyt powyżej.

Przydatne artefakty:

- `release-package-under-test` z nadrzędnego Full Release Validation i `OpenClaw Release Checks`
- Artefakty ścieżki wydania Docker w `.artifacts/docker-tests/`
- `package-under-test` z Package Acceptance i artefakty akceptacji Docker
- Artefakty kontroli wydania Cross-OS dla każdego systemu operacyjnego i zestawu
- Artefakty parytetu QA, Matrix i Telegram

## Pliki przepływów pracy

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
