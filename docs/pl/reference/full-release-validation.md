---
read_when:
    - Uruchamianie lub ponowne uruchamianie pełnej walidacji wydania
    - 'Porównywanie profili walidacji wydania: stabilnego i pełnego'
    - Debugowanie niepowodzeń etapów walidacji wydania
summary: Etapy pełnej walidacji wydania, podrzędne przepływy pracy, profile wydania, uchwyty ponownego uruchomienia i dowody
title: Pełna walidacja wydania
x-i18n:
    generated_at: "2026-05-05T01:49:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cf696761f516fc7f8e9606a2a06fab61a644731330eb484a388f276767a9e0d
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` to nadrzędna walidacja wydania. Jest pojedynczym ręcznym
punktem wejścia dla potwierdzenia przedwydaniowego, ale większość pracy odbywa się w przepływach podrzędnych, dzięki czemu
nieudaną maszynę można uruchomić ponownie bez restartowania całego wydania.

Uruchom ją z zaufanego refa workflow, zwykle `main`, i przekaż gałąź wydania,
tag albo pełny SHA commita jako `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Przepływy podrzędne używają zaufanego refa workflow dla harnessu oraz wejściowego
`ref` dla testowanego kandydata. Dzięki temu nowa logika walidacji jest dostępna
podczas walidowania starszej gałęzi wydania albo tagu.

Domyślnie `release_profile=stable` uruchamia ścieżki blokujące wydanie i pomija
wyczerpujący live/Docker soak. Przekaż `run_release_soak=true`, aby uwzględnić
ścieżki soak w stabilnym uruchomieniu. `release_profile=full` zawsze włącza ścieżki soak, więc
szeroki profil doradczy nigdy po cichu nie traci pokrycia.

Akceptacja pakietu zwykle buduje tarball kandydata z rozwiązanego
`ref`, w tym uruchomienia dla pełnego SHA wywołane przez `pnpm ci:full-release`. Po
opublikowaniu przekaż `package_acceptance_package_spec=openclaw@YYYY.M.D` (albo
`openclaw@beta`/`openclaw@latest`), aby zamiast tego uruchomić tę samą macierz pakietu/aktualizacji względem
wysłanego pakietu npm.

## Etapy najwyższego poziomu

| Etap                 | Szczegóły                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rozwiązywanie celu   | **Zadanie:** `Resolve target ref`<br />**Przepływ podrzędny:** brak<br />**Potwierdza:** rozwiązuje gałąź wydania, tag albo pełny SHA commita i zapisuje wybrane dane wejściowe.<br />**Ponowne uruchomienie:** uruchom ponownie przepływ nadrzędny, jeśli to się nie powiedzie.                                                                                                                                                              |
| Vitest i normalne CI | **Zadanie:** `Run normal full CI`<br />**Przepływ podrzędny:** `CI`<br />**Potwierdza:** ręczny pełny graf CI względem refa docelowego, w tym ścieżki Linux Node, shardy dołączonych Pluginów, kontrakty kanałów, zgodność z Node 22, `check`, `check-additional`, smoke test kompilacji, kontrole dokumentacji, Python skills, Windows, macOS, i18n Control UI oraz Android przez przepływ nadrzędny.<br />**Ponowne uruchomienie:** `rerun_group=ci`. |
| Przedwydanie Pluginu | **Zadanie:** `Run plugin prerelease validation`<br />**Przepływ podrzędny:** `Plugin Prerelease`<br />**Potwierdza:** statyczne kontrole Pluginu tylko dla wydania, agentowe pokrycie Pluginu, pełne shardy partii rozszerzeń oraz przedwydaniowe ścieżki Docker dla Pluginu.<br />**Ponowne uruchomienie:** `rerun_group=plugin-prerelease`.                                                                                              |
| Kontrole wydania     | **Zadanie:** `Run release/live/Docker/QA validation`<br />**Przepływ podrzędny:** `OpenClaw Release Checks`<br />**Potwierdza:** smoke test instalacji, międzyplatformowe kontrole pakietów, Akceptację pakietu, parytet QA Lab, live Matrix oraz live Telegram. Z `run_release_soak=true` albo `release_profile=full` uruchamia także wyczerpujące zestawy live/E2E oraz fragmenty ścieżki wydania Docker.<br />**Ponowne uruchomienie:** `rerun_group=release-checks` albo węższy uchwyt release-checks. |
| Artefakt pakietu     | **Zadanie:** `Prepare release package artifact`<br />**Przepływ podrzędny:** brak<br />**Potwierdza:** tworzy nadrzędny tarball `release-package-under-test` wystarczająco wcześnie dla kontroli ukierunkowanych na pakiet, które nie muszą czekać na `OpenClaw Release Checks`.<br />**Ponowne uruchomienie:** uruchom ponownie przepływ nadrzędny albo podaj `npm_telegram_package_spec` dla `rerun_group=npm-telegram`.                    |
| Pakiet Telegram      | **Zadanie:** `Run package Telegram E2E`<br />**Przepływ podrzędny:** `NPM Telegram Beta E2E`<br />**Potwierdza:** oparte na artefakcie nadrzędnym potwierdzenie pakietu Telegram dla `rerun_group=all` z `release_profile=full` albo potwierdzenie Telegram dla opublikowanego pakietu, gdy ustawiono `npm_telegram_package_spec`.<br />**Ponowne uruchomienie:** `rerun_group=npm-telegram` z `npm_telegram_package_spec`.                    |
| Weryfikator nadrzędny | **Zadanie:** `Verify full validation`<br />**Przepływ podrzędny:** brak<br />**Potwierdza:** ponownie sprawdza zapisane wyniki uruchomień podrzędnych i dopisuje tabele najwolniejszych zadań z przepływów podrzędnych.<br />**Ponowne uruchomienie:** uruchom ponownie tylko to zadanie po ponownym uruchomieniu nieudanego przepływu podrzędnego do zielonego stanu.                                                                        |

Dla `ref=main` i `rerun_group=all` nowszy przepływ nadrzędny zastępuje starszy.
Gdy rodzic zostanie anulowany, jego monitor anuluje każdy przepływ podrzędny, który już
uruchomił. Uruchomienia walidacji gałęzi wydania i tagów domyślnie nie anulują się nawzajem.

## Etapy kontroli wydania

`OpenClaw Release Checks` to największy przepływ podrzędny. Rozwiązuje cel
raz i przygotowuje współdzielony artefakt `release-package-under-test`, gdy potrzebują go etapy
ukierunkowane na pakiet albo Docker.

| Etap                | Szczegóły                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cel wydania         | **Zadanie:** `Resolve target ref`<br />**Bazowy workflow:** brak<br />**Testy:** wybrany ref, opcjonalny oczekiwany SHA, profil, grupa ponownego uruchomienia i filtr skupionego zestawu live.<br />**Ponowne uruchomienie:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                |
| Artefakt pakietu    | **Zadanie:** `Prepare release package artifact`<br />**Bazowy workflow:** brak<br />**Testy:** pakuje albo rozwiązuje jeden kandydujący tarball i przesyła `release-package-under-test` dla dalszych kontroli dotyczących pakietu.<br />**Ponowne uruchomienie:** objęta problemem grupa pakietu, cross-OS albo live/E2E.                                                                                                                                                                                 |
| Instalacyjny smoke  | **Zadanie:** `Run install smoke`<br />**Bazowy workflow:** `Install Smoke`<br />**Testy:** pełna ścieżka instalacji z ponownym użyciem obrazu smoke z głównego Dockerfile, instalacja pakietu QR, testy smoke Docker dla root i gateway, testy Docker instalatora, smoke dostawcy obrazów przy globalnej instalacji Bun oraz szybkie E2E instalacji/odinstalowania dołączonego Plugin.<br />**Ponowne uruchomienie:** `rerun_group=install-smoke`.                                                       |
| Cross-OS            | **Zadanie:** `cross_os_release_checks`<br />**Bazowy workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testy:** ścieżki świeżej instalacji i aktualizacji na Linuxie, Windowsie i macOS dla wybranego dostawcy oraz trybu, z użyciem kandydującego tarballa i pakietu bazowego.<br />**Ponowne uruchomienie:** `rerun_group=cross-os`.                                                                                                                                                     |
| E2E repo i live     | **Zadanie:** `Run repo/live E2E validation`<br />**Bazowy workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testy:** E2E repozytorium, cache live, strumieniowanie websocket OpenAI, natywne shardy live dostawcy i Plugin oraz oparte na Dockerze harnessy live modelu/backendu/Gateway wybrane przez `release_profile`.<br />**Uruchomienia:** `run_release_soak=true`, `release_profile=full` albo skupione `rerun_group=live-e2e`.<br />**Ponowne uruchomienie:** `rerun_group=live-e2e`, opcjonalnie z `live_suite_filter`. |
| Ścieżka wydania Docker | **Zadanie:** `Run Docker release-path validation`<br />**Bazowy workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testy:** fragmenty Docker ścieżki wydania względem współdzielonego artefaktu pakietu.<br />**Uruchomienia:** `run_release_soak=true`, `release_profile=full` albo skupione `rerun_group=live-e2e`.<br />**Ponowne uruchomienie:** `rerun_group=live-e2e`.                                                                                                                  |
| Akceptacja pakietu  | **Zadanie:** `Run package acceptance`<br />**Bazowy workflow:** `Package Acceptance`<br />**Testy:** offline fixtures pakietu Plugin, aktualizacja Plugin, akceptacja pakietu mock-OpenAI Telegram oraz kontrole przetrwania opublikowanej aktualizacji względem tego samego tarballa. Blokujące kontrole wydania używają domyślnej najnowszej opublikowanej bazy; kontrole soak rozszerzają zakres na każde stabilne wydanie npm od `2026.4.23` włącznie oraz fixtures zgłoszonych problemów.<br />**Ponowne uruchomienie:** `rerun_group=package`. |
| Parytet QA          | **Zadanie:** `Run QA Lab parity lane` i `Run QA Lab parity report`<br />**Bazowy workflow:** bezpośrednie zadania<br />**Testy:** kandydat i bazowe pakiety parytetu agentowego, a następnie raport parytetu.<br />**Ponowne uruchomienie:** `rerun_group=qa-parity` albo `rerun_group=qa`.                                                                                                                                                                                                                |
| QA live Matrix      | **Zadanie:** `Run QA Lab live Matrix lane`<br />**Bazowy workflow:** bezpośrednie zadanie<br />**Testy:** szybki profil QA live Matrix w środowisku `qa-live-shared`.<br />**Ponowne uruchomienie:** `rerun_group=qa-live` albo `rerun_group=qa`.                                                                                                                                                                                                                                                            |
| QA live Telegram    | **Zadanie:** `Run QA Lab live Telegram lane`<br />**Bazowy workflow:** bezpośrednie zadanie<br />**Testy:** QA live Telegram z dzierżawami poświadczeń Convex CI.<br />**Ponowne uruchomienie:** `rerun_group=qa-live` albo `rerun_group=qa`.                                                                                                                                                                                                                                                               |
| Weryfikator wydania | **Zadanie:** `Verify release checks`<br />**Bazowy workflow:** brak<br />**Testy:** wymagane zadania kontroli wydania dla wybranej grupy ponownego uruchomienia.<br />**Ponowne uruchomienie:** uruchom ponownie po przejściu skupionych zadań podrzędnych.                                                                                                                                                                                                                                              |

## Fragmenty ścieżki wydania Docker

Etap ścieżki wydania Docker uruchamia te fragmenty, gdy `live_suite_filter` jest
pusty:

| Fragment                                                        | Zakres                                                                  |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Podstawowe ścieżki smoke ścieżki wydania Docker.                        |
| `package-update-openai`                                         | Zachowanie instalacji i aktualizacji pakietu OpenAI.                    |
| `package-update-anthropic`                                      | Zachowanie instalacji i aktualizacji pakietu Anthropic.                 |
| `package-update-core`                                           | Zachowanie pakietu i aktualizacji niezależne od dostawcy.               |
| `plugins-runtime-plugins`                                       | Ścieżki runtime Plugin, które wykonują zachowanie Plugin.               |
| `plugins-runtime-services`                                      | Ścieżki runtime Plugin oparte na usługach; obejmują OpenWebUI na żądanie. |
| `plugins-runtime-install-a` do `plugins-runtime-install-h`      | Partie instalacji/runtime Plugin podzielone na równoległą walidację wydania. |

Użyj ukierunkowanego `docker_lanes=<lane[,lane]>` w wielorazowym workflow live/E2E, gdy
nie powiodła się tylko jedna ścieżka Docker. Artefakty wydania zawierają polecenia
ponownego uruchomienia dla poszczególnych ścieżek z artefaktem pakietu i wejściami
ponownego użycia obrazu, gdy są dostępne.

## Profile wydania

`release_profile` głównie kontroluje zakres live/dostawców w kontrolach wydania.
Nie usuwa normalnego pełnego CI, Plugin Prerelease, instalacyjnego smoke, akceptacji
pakietu ani QA Lab. Dla `stable` wyczerpujące E2E repo/live i fragmenty ścieżki
wydania Docker są zakresem soak i uruchamiają się, gdy `run_release_soak=true`.
`full` wymusza zakres soak, a także sprawia, że uruchomienie parasolowe wykonuje
pakietowe E2E Telegram względem nadrzędnego artefaktu pakietu wydania, gdy
`rerun_group=all`, więc pełny kandydat przed publikacją nie pomija po cichu tej
ścieżki pakietu Telegram.

| Profil    | Zamierzone użycie                | Dołączony zakres live/dostawców                                                                                                                                                    |
| --------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Najszybszy smoke krytyczny dla wydania. | Ścieżka live OpenAI/core, modele Docker live dla OpenAI, natywny rdzeń Gateway, natywny profil Gateway OpenAI, natywny Plugin OpenAI oraz Docker live Gateway OpenAI.              |
| `stable`  | Domyślny profil zatwierdzenia wydania. | `minimum` plus smoke Anthropic, Google, MiniMax, backend, natywny harness testów live, backend Docker live CLI, powiązanie Docker ACP, harness Docker Codex oraz shard smoke OpenCode Go. |
| `full`    | Szeroki przegląd doradczy.       | `stable` plus dostawcy doradczy, shardy live Plugin i shardy live mediów.                                                                                                          |

## Dodatki tylko dla full

Te zestawy są pomijane przez `stable` i dołączane przez `full`:

| Obszar                           | Zakres tylko dla full                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Modele Docker live               | OpenCode Go, OpenRouter, xAI, Z.ai i Fireworks.                                                                            |
| Docker live Gateway              | Dostawcy doradczy podzieleni na shardy DeepSeek/Fireworks, OpenCode Go/OpenRouter oraz xAI/Z.ai.                          |
| Natywne profile dostawców Gateway | Pełne shardy Anthropic Opus i Sonnet/Haiku, Fireworks, DeepSeek, pełne shardy modeli OpenCode Go, OpenRouter, xAI i Z.ai. |
| Natywne shardy live Plugin       | Plugins A-K, L-N, O-Z other, Moonshot i xAI.                                                                               |
| Natywne shardy live mediów       | Audio, muzyka Google, muzyka MiniMax i grupy wideo A-D.                                                                    |

`stable` obejmuje `native-live-src-gateway-profiles-anthropic-smoke` i
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` używa zamiast tego
szerszych shardów modeli Anthropic i OpenCode Go. Skupione ponowne uruchomienia
nadal mogą używać zagregowanych uchwytów
`native-live-src-gateway-profiles-anthropic` albo
`native-live-src-gateway-profiles-opencode-go`.

## Skupione ponowne uruchomienia

Użyj `rerun_group`, aby uniknąć powtarzania niepowiązanych pól wydania:

| Handle              | Zakres                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Wszystkie etapy pełnej walidacji wydania.                             |
| `ci`                | Tylko podrzędny ręczny pełny CI.                                      |
| `plugin-prerelease` | Tylko podrzędny Plugin Prerelease.                                    |
| `release-checks`    | Wszystkie etapy kontroli wydania OpenClaw.                            |
| `install-smoke`     | Install Smoke przez kontrole wydania.                                 |
| `cross-os`          | Kontrole wydania między systemami operacyjnymi.                       |
| `live-e2e`          | Walidacja repo/live E2E i ścieżki wydania Docker.                     |
| `package`           | Package Acceptance.                                                   |
| `qa`                | Parzystość QA oraz aktywne ścieżki QA.                                |
| `qa-parity`         | Tylko ścieżki parzystości QA i raport.                                |
| `qa-live`           | Tylko aktywne Matrix i Telegram QA.                                   |
| `npm-telegram`      | E2E Telegram dla opublikowanego pakietu; wymaga `npm_telegram_package_spec`. |

Użyj `live_suite_filter` z `rerun_group=live-e2e`, gdy jeden aktywny zestaw testów zakończył się niepowodzeniem.
Prawidłowe identyfikatory filtrów są zdefiniowane w wielokrotnie używanym przepływie pracy live/E2E, w tym
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` oraz
`live-codex-harness-docker`.

Uchwyt `live-gateway-advisory-docker` jest zagregowanym uchwytem ponownego uruchomienia dla swoich
trzech fragmentów dostawców, więc nadal rozchodzi się na wszystkie zadania Gateway Docker advisory.

Użyj `cross_os_suite_filter` z `rerun_group=cross-os`, gdy jedna ścieżka między systemami operacyjnymi
zakończyła się niepowodzeniem. Filtr akceptuje identyfikator systemu operacyjnego, identyfikator zestawu testów lub parę system/zestaw,
na przykład `windows/packaged-upgrade`, `windows` albo `packaged-fresh`. Podsumowania między systemami operacyjnymi
obejmują czasy poszczególnych faz dla ścieżek aktualizacji pakietowej, a długotrwałe
polecenia wypisują linie Heartbeat, aby zawieszona aktualizacja Windows była widoczna przed
limitem czasu zadania.

Ścieżki kontroli wydania QA mają charakter doradczy. Niepowodzenie dotyczące tylko QA jest zgłaszane jako ostrzeżenie
i nie blokuje weryfikatora kontroli wydania; uruchom ponownie `rerun_group=qa`,
`qa-parity` albo `qa-live`, gdy potrzebujesz świeżych dowodów QA.

## Dowody do zachowania

Zachowaj podsumowanie `Full Release Validation` jako indeks na poziomie wydania. Zawiera ono linki
do identyfikatorów uruchomień podrzędnych i obejmuje tabele najwolniejszych zadań. W przypadku niepowodzeń najpierw sprawdź podrzędny
przepływ pracy, a następnie uruchom ponownie najmniejszy pasujący uchwyt powyżej.

Przydatne artefakty:

- `release-package-under-test` z nadrzędnego Full Release Validation oraz `OpenClaw Release Checks`
- Artefakty ścieżki wydania Docker w `.artifacts/docker-tests/`
- Package Acceptance `package-under-test` oraz artefakty akceptacji Docker
- Artefakty kontroli wydania między systemami operacyjnymi dla każdego systemu operacyjnego i zestawu testów
- Artefakty parzystości QA, Matrix i Telegram

## Pliki przepływu pracy

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
