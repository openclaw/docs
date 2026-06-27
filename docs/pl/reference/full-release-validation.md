---
read_when:
    - Uruchamianie lub ponowne uruchamianie pełnej walidacji wydania
    - Porównywanie stabilnych i pełnych profili walidacji wydań
    - Debugowanie błędów na etapie walidacji wydania
summary: Etapy pełnej walidacji wydania, podrzędne przepływy pracy, profile wydań, uchwyty ponownych uruchomień i dowody
title: Pełna walidacja wydania
x-i18n:
    generated_at: "2026-06-27T18:17:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 791930254e3cac7da101d809cfc9b56773225159574d3727189f67cf85bd3fce
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` to nadrzędna walidacja wydania. Jest pojedynczym ręcznym
punktem wejścia dla dowodów przedwydaniowych, ale większość pracy odbywa się w podrzędnych workflow, aby
nieudane środowisko można było uruchomić ponownie bez restartowania całego wydania.

Uruchom ją z zaufanej referencji workflow, zwykle `main`, i przekaż gałąź wydania,
tag albo pełny SHA commita jako `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Podrzędne workflow używają zaufanej referencji workflow dla harnessa oraz wejściowego
`ref` dla kandydata objętego testami. Dzięki temu nowa logika walidacji jest dostępna
podczas walidowania starszej gałęzi wydania albo tagu.

`release_profile=stable` i `release_profile=full` zawsze uruchamiają wyczerpujący
soak live/Docker. Przekaż `run_release_soak=true`, aby włączyć te same ścieżki soak
z profilem beta. Publikacja stable odrzuca manifest walidacji bez tych
dowodów soak i blokujących dowodów wydajności produktu.

Akceptacja pakietu zwykle buduje tarball kandydata z rozwiązanej
referencji `ref`, w tym uruchomienia z pełnym SHA wywołane przez `pnpm ci:full-release`. Po
publikacji beta przekaż `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`, aby ponownie użyć
opublikowanego pakietu npm w kontrolach wydania, akceptacji pakietu, testach cross-OS,
Docker dla ścieżki wydania oraz pakietowym Telegram. Używaj `package_acceptance_package_spec`
tylko wtedy, gdy akceptacja pakietu ma celowo udowodnić inny pakiet.
Ścieżka pakietu live Pluginu Codex zachowuje ten sam stan: opublikowane
wartości `release_package_spec` wyprowadzają `codex_plugin_spec=npm:@openclaw/codex@<version>`;
uruchomienia SHA/artefaktów pakują `extensions/codex` z wybranej referencji; a operatorzy
mogą ustawić `codex_plugin_spec` bezpośrednio dla źródeł Pluginu `npm:`, `npm-pack:` lub `git:`.
Ta ścieżka przyznaje jawne zatwierdzenie instalacji Codex CLI wymagane przez
ten Plugin, a następnie uruchamia preflight Codex CLI i tury agenta OpenAI w tej samej sesji.

## Etapy najwyższego poziomu

| Etap                 | Szczegóły                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rozwiązanie celu     | **Zadanie:** `Resolve target ref`<br />**Podrzędne workflow:** brak<br />**Udowadnia:** rozwiązuje gałąź wydania, tag albo pełny SHA commita i zapisuje wybrane dane wejściowe.<br />**Ponowne uruchomienie:** uruchom ponownie nadrzędną walidację, jeśli to się nie powiedzie.                                                                                                                                                                             |
| Vitest i zwykłe CI   | **Zadanie:** `Run normal full CI`<br />**Podrzędne workflow:** `CI`<br />**Udowadnia:** ręczny pełny graf CI względem docelowej referencji, w tym ścieżki Linux Node, shardy dołączonych Pluginów, shardy kontraktów Pluginów i kanałów, zgodność z Node 22, `check-*`, `check-additional-*`, kontrole smoke zbudowanych artefaktów, kontrole dokumentacji, Skills Python, Windows, macOS, i18n Control UI oraz Android przez nadrzędną walidację.<br />**Ponowne uruchomienie:** `rerun_group=ci`. |
| Przedwydaniowa walidacja Pluginów | **Zadanie:** `Run plugin prerelease validation`<br />**Podrzędne workflow:** `Plugin Prerelease`<br />**Udowadnia:** statyczne kontrole Pluginów tylko dla wydania, agentową pokrywalność Pluginów, pełne shardy partii rozszerzeń, przedwydaniowe ścieżki Docker dla Pluginów oraz nieblokujący artefakt `plugin-inspector-advisory` do triage zgodności.<br />**Ponowne uruchomienie:** `rerun_group=plugin-prerelease`. |
| Kontrole wydania     | **Zadanie:** `Run release/live/Docker/QA validation`<br />**Podrzędne workflow:** `OpenClaw Release Checks`<br />**Udowadnia:** smoke instalacji, kontrole pakietu cross-OS, akceptację pakietu, parytet QA Lab, Matrix live oraz Telegram live. Profile stable i full uruchamiają też wyczerpujące pakiety live/E2E oraz fragmenty Docker dla ścieżki wydania; beta może je włączyć przez `run_release_soak=true`.<br />**Ponowne uruchomienie:** `rerun_group=release-checks` albo węższy uchwyt release-checks. |
| Pakietowy Telegram   | **Zadanie:** `Run package Telegram E2E`<br />**Podrzędne workflow:** `NPM Telegram Beta E2E`<br />**Udowadnia:** ukierunkowane E2E Telegram dla opublikowanego pakietu, gdy ustawiono `release_package_spec` albo `npm_telegram_package_spec`. Pełna walidacja kandydata używa zamiast tego kanonicznego E2E Telegram z akceptacji pakietu.<br />**Ponowne uruchomienie:** `rerun_group=npm-telegram` z `release_package_spec` albo `npm_telegram_package_spec`. |
| Weryfikator nadrzędny | **Zadanie:** `Verify full validation`<br />**Podrzędne workflow:** brak<br />**Udowadnia:** ponownie sprawdza zapisane konkluzje uruchomień podrzędnych i dołącza tabele najwolniejszych zadań z podrzędnych workflow.<br />**Ponowne uruchomienie:** uruchom ponownie tylko to zadanie po ponownym uruchomieniu nieudanego procesu podrzędnego do stanu zielonego.                                                                                                                              |

Dla `ref=main` i `rerun_group=all` nowsza nadrzędna walidacja zastępuje starszą.
Gdy rodzic zostaje anulowany, jego monitor anuluje każde podrzędne workflow, które już
uruchomił. Uruchomienia walidacji gałęzi wydania i tagów domyślnie nie anulują się
wzajemnie.

## Etapy kontroli wydania

`OpenClaw Release Checks` to największe podrzędne workflow. Rozwiązuje cel
raz i przygotowuje współdzielony artefakt `release-package-under-test`, gdy potrzebują go etapy
dotyczące pakietu albo Docker.

| Etap                | Szczegóły                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cel wydania         | **Zadanie:** `Resolve target ref`<br />**Workflow bazowy:** brak<br />**Testy:** wybrany ref, opcjonalny oczekiwany SHA, profil, grupa ponownego uruchomienia i zawężony filtr zestawu live.<br />**Ponowne uruchomienie:** `rerun_group=release-checks`.                                                                                                                                                                                                                                             |
| Artefakt pakietu    | **Zadanie:** `Prepare release package artifact`<br />**Workflow bazowy:** brak<br />**Testy:** pakuje albo wybiera jeden kandydacki tarball i przesyła `release-package-under-test` dla dalszych kontroli dotyczących pakietu.<br />**Ponowne uruchomienie:** odpowiedni pakiet, grupa cross-OS albo live/E2E.                                                                                                                                                                                          |
| Smoke instalacji    | **Zadanie:** `Run install smoke`<br />**Workflow bazowy:** `Install Smoke`<br />**Testy:** pełna ścieżka instalacji z ponownym użyciem obrazu smoke z głównego Dockerfile, instalacja pakietu QR, smoke Dockera dla roota i Gateway, testy Dockera instalatora, smoke globalnej instalacji Bun dla image-provider oraz szybkie E2E instalacji/deinstalacji wbudowanego Plugin.<br />**Ponowne uruchomienie:** `rerun_group=install-smoke`.                                                              |
| Cross-OS            | **Zadanie:** `cross_os_release_checks`<br />**Workflow bazowy:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testy:** ścieżki świeżej instalacji i aktualizacji na Linuxie, Windowsie i macOS dla wybranego dostawcy i trybu, z użyciem kandydackiego tarballa oraz pakietu bazowego.<br />**Ponowne uruchomienie:** `rerun_group=cross-os`.                                                                                                                                                  |
| Repo i live E2E     | **Zadanie:** `Run repo/live E2E validation`<br />**Workflow bazowy:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testy:** E2E repozytorium, cache live, streaming WebSocket OpenAI, natywne shardy live dostawców i Plugin oraz harnessy live modelu/backendu/Gateway oparte na Dockerze, wybierane przez `release_profile`.<br />**Uruchomienia:** `run_release_soak=true`, `release_profile=full` albo zawężone `rerun_group=live-e2e`.<br />**Ponowne uruchomienie:** `rerun_group=live-e2e`, opcjonalnie z `live_suite_filter`. |
| Ścieżka wydania Docker | **Zadanie:** `Run Docker release-path validation`<br />**Workflow bazowy:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testy:** fragmenty ścieżki wydania Docker względem współdzielonego artefaktu pakietu.<br />**Uruchomienia:** `run_release_soak=true`, `release_profile=full` albo zawężone `rerun_group=live-e2e`.<br />**Ponowne uruchomienie:** `rerun_group=live-e2e`.                                                                                                                  |
| Akceptacja pakietu  | **Zadanie:** `Run package acceptance`<br />**Workflow bazowy:** `Package Acceptance`<br />**Testy:** offline’owe fixture’y pakietów Plugin, aktualizacja Plugin, kanoniczne E2E pakietu mock-OpenAI Telegram oraz kontrole przetrwania aktualizacji z opublikowanej wersji względem tego samego tarballa. Blokujące kontrole wydania używają domyślnej najnowszej opublikowanej bazy; kontrole soak rozszerzają zakres na każde stabilne wydanie npm od `2026.4.23` włącznie oraz fixture’y zgłoszonych problemów.<br />**Ponowne uruchomienie:** `rerun_group=package`. |
| Parzystość QA       | **Zadanie:** `Run QA Lab parity lane` i `Run QA Lab parity report`<br />**Workflow bazowy:** zadania bezpośrednie<br />**Testy:** pakiety parzystości agentowej kandydata i bazy, a następnie raport parzystości.<br />**Ponowne uruchomienie:** `rerun_group=qa-parity` albo `rerun_group=qa`.                                                                                                                                                                                                       |
| Macierz QA live     | **Zadanie:** `Run QA Lab live Matrix lane`<br />**Workflow bazowy:** zadanie bezpośrednie<br />**Testy:** szybki profil QA live Matrix w środowisku `qa-live-shared`.<br />**Ponowne uruchomienie:** `rerun_group=qa-live` albo `rerun_group=qa`.                                                                                                                                                                                                                                                       |
| Telegram QA live    | **Zadanie:** `Run QA Lab live Telegram lane`<br />**Workflow bazowy:** zadanie bezpośrednie<br />**Testy:** QA live Telegram z dzierżawami poświadczeń Convex CI.<br />**Ponowne uruchomienie:** `rerun_group=qa-live` albo `rerun_group=qa`.                                                                                                                                                                                                                                                          |
| Weryfikator wydania | **Zadanie:** `Verify release checks`<br />**Workflow bazowy:** brak<br />**Testy:** wymagane zadania kontroli wydania dla wybranej grupy ponownego uruchomienia.<br />**Ponowne uruchomienie:** uruchom ponownie po przejściu zawężonych zadań podrzędnych.                                                                                                                                                                                                                                           |

## Fragmenty ścieżki wydania Docker

Etap ścieżki wydania Docker uruchamia te fragmenty, gdy `live_suite_filter` jest
pusty:

| Fragment                                                        | Zakres                                                                                                                     |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Ścieżki smoke głównej ścieżki wydania Docker.                                                                              |
| `package-update-openai`                                         | Zachowanie instalacji/aktualizacji pakietu OpenAI, instalacja Codex na żądanie, tury live Plugin Codex i wywołania narzędzi Chat Completions. |
| `package-update-anthropic`                                      | Zachowanie instalacji i aktualizacji pakietu Anthropic.                                                                    |
| `package-update-core`                                           | Zachowanie pakietu i aktualizacji neutralne względem dostawcy.                                                             |
| `plugins-runtime-plugins`                                       | Ścieżki środowiska uruchomieniowego Plugin, które sprawdzają zachowanie Plugin.                                            |
| `plugins-runtime-services`                                      | Ścieżki środowiska uruchomieniowego Plugin oparte na usługach i live; obejmuje OpenWebUI, gdy jest wymagane.              |
| `plugins-runtime-install-a` do `plugins-runtime-install-h`       | Partie instalacji/środowiska uruchomieniowego Plugin podzielone na potrzeby równoległej walidacji wydania.                |

Użyj ukierunkowanego `docker_lanes=<lane[,lane]>` w wielokrotnego użytku workflow live/E2E, gdy
nie powiodła się tylko jedna ścieżka Docker. Artefakty wydania zawierają polecenia ponownego uruchomienia
dla poszczególnych ścieżek z artefaktem pakietu i wejściami ponownego użycia obrazu, gdy są dostępne.

## Profile wydania

`release_profile` kontroluje głównie szerokość live/dostawców w kontrolach wydania.
Nie usuwa normalnego pełnego CI, Plugin Prerelease, smoke instalacji, akceptacji pakietu
ani QA Lab. Profile stabilny i pełny zawsze uruchamiają wyczerpujące E2E repo/live
oraz pokrycie soak ścieżki wydania Docker. Profil beta może włączyć je przez
`run_release_soak=true`. Package Acceptance dostarcza kanoniczne E2E pakietu
Telegram dla każdego pełnego kandydata, więc workflow zbiorczy nie duplikuje tego
pollera live.

| Profil    | Zamierzone użycie                 | Uwzględnione pokrycie live/dostawców                                                                                                                                                 |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Najszybszy smoke krytyczny dla wydania. | Ścieżka live OpenAI/core, modele Docker live dla OpenAI, natywny rdzeń Gateway, natywny profil Gateway OpenAI, natywny Plugin OpenAI i Docker live Gateway OpenAI.                 |
| `stable`  | Domyślny profil zatwierdzania wydania. | `minimum` plus smoke Anthropic, Google, MiniMax, backend, natywny harness testów live, backend CLI Docker live, bind Docker ACP, harness Docker Codex i shard smoke OpenCode Go. |
| `full`    | Szeroki przegląd doradczy.        | `stable` plus dostawcy doradczy, shardy live Plugin i shardy live mediów.                                                                                                           |

## Dodatki tylko w pełnym profilu

Te zestawy są pomijane przez `stable` i uwzględniane przez `full`:

| Obszar                           | Pokrycie tylko w pełnym profilu                                                                                             |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Modele Docker live               | OpenCode Go, OpenRouter, xAI, Z.ai i Fireworks.                                                                             |
| Gateway Docker live              | Dostawcy doradczy podzieleni na shardy DeepSeek/Fireworks, OpenCode Go/OpenRouter oraz xAI/Z.ai.                           |
| Natywne profile dostawców Gateway | Pełne shardy Anthropic Opus i Sonnet/Haiku, Fireworks, DeepSeek, pełne shardy modeli OpenCode Go, OpenRouter, xAI i Z.ai. |
| Natywne shardy live Plugin       | Plugins A-K, L-N, O-Z other, Moonshot i xAI.                                                                                |
| Natywne shardy live mediów       | Audio, muzyka Google, muzyka MiniMax i grupy wideo A-D.                                                                     |

`stable` obejmuje `native-live-src-gateway-profiles-anthropic-smoke` i
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` używa zamiast tego szerszych
shardów modeli Anthropic i OpenCode Go. Zawężone ponowne uruchomienia nadal mogą używać
zbiorczych uchwytów `native-live-src-gateway-profiles-anthropic` albo
`native-live-src-gateway-profiles-opencode-go`.

## Zawężone ponowne uruchomienia

Użyj `rerun_group`, aby uniknąć powtarzania niezwiązanych pól wydania:

| Uchwyt              | Zakres                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | Wszystkie etapy pełnej walidacji wydania.                                                       |
| `ci`                | Tylko podrzędny ręczny pełny CI.                                                                |
| `plugin-prerelease` | Tylko podrzędny etap przedpremierowy Plugin.                                                    |
| `release-checks`    | Wszystkie etapy kontroli wydania OpenClaw.                                                      |
| `install-smoke`     | Install Smoke przez kontrole wydania.                                                           |
| `cross-os`          | Kontrole wydania dla wielu systemów operacyjnych.                                               |
| `live-e2e`          | Walidacja E2E repo/live i ścieżki wydania Docker.                                               |
| `package`           | Akceptacja pakietu.                                                                             |
| `qa`                | Parzystość QA oraz ścieżki QA live.                                                             |
| `qa-parity`         | Tylko ścieżki parzystości QA i raport.                                                          |
| `qa-live`           | Matrix/Telegram QA live oraz bramkowane ścieżki Discord, WhatsApp i Slack, gdy są włączone.     |
| `npm-telegram`      | Telegram E2E opublikowanego pakietu; wymaga `release_package_spec` lub `npm_telegram_package_spec`. |

Użyj `live_suite_filter` z `rerun_group=live-e2e`, gdy jeden pakiet live zakończył się niepowodzeniem.
Prawidłowe identyfikatory filtrów są zdefiniowane w wielokrotnego użytku workflow live/E2E, w tym
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` oraz
`live-codex-harness-docker`.

Uchwyt `live-gateway-advisory-docker` jest zbiorczym uchwytem ponownego uruchomienia dla jego
trzech shardów dostawców, więc nadal rozgałęzia się na wszystkie zadania advisory Docker gateway.

Użyj `cross_os_suite_filter` z `rerun_group=cross-os`, gdy jedna ścieżka dla wielu systemów operacyjnych
zakończyła się niepowodzeniem. Filtr akceptuje identyfikator systemu operacyjnego, identyfikator pakietu albo parę system/pakiet, na
przykład `windows/packaged-upgrade`, `windows` lub `packaged-fresh`. Podsumowania dla wielu systemów operacyjnych
zawierają czasy poszczególnych faz dla ścieżek aktualizacji pakietowej, a długotrwałe
polecenia wypisują linie heartbeat, dzięki czemu zablokowana aktualizacja Windows jest widoczna przed
limitem czasu zadania.

Niepowodzenia kontroli wydania QA blokują normalną walidację wydania. Wymagany dryf dynamicznych narzędzi OpenClaw
w standardowej warstwie również blokuje weryfikator kontroli wydania.
Uruchomienia Tideclaw alpha mogą nadal traktować ścieżki kontroli wydania niezwiązane z bezpieczeństwem pakietu jako
doradcze. Gdy `live_suite_filter` jawnie żąda bramkowanej ścieżki QA live, takiej
jak Discord, WhatsApp lub Slack, odpowiadająca zmienna repozytorium
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` musi być włączona; w przeciwnym razie
przechwytywanie wejścia kończy się niepowodzeniem zamiast po cichu pominąć ścieżkę. Uruchom ponownie `rerun_group=qa`,
`qa-parity` lub `qa-live`, gdy potrzebujesz świeżych dowodów QA.

## Dowody do zachowania

Zachowaj podsumowanie `Full Release Validation` jako indeks na poziomie wydania. Łączy ono
identyfikatory uruchomień podrzędnych i zawiera tabele najwolniejszych zadań. W przypadku niepowodzeń najpierw sprawdź podrzędny
workflow, a następnie uruchom ponownie najmniejszy pasujący uchwyt powyżej.

Przydatne artefakty:

- `release-package-under-test` z `OpenClaw Release Checks`
- Artefakty ścieżki wydania Docker w `.artifacts/docker-tests/`
- `package-under-test` z akceptacji pakietu oraz artefakty akceptacji Docker
- Artefakty kontroli wydania dla wielu systemów operacyjnych dla każdego systemu operacyjnego i pakietu
- Artefakty parzystości QA, Matrix i Telegram

## Pliki workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
