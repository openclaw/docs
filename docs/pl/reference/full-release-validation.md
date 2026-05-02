---
read_when:
    - Uruchamianie lub ponowne uruchamianie pełnej walidacji wydania
    - Porównanie stabilnych i pełnych profili walidacji wydania
    - Debugowanie niepowodzeń etapów walidacji wydania
summary: Etapy pełnej walidacji wydania, podrzędne przepływy pracy, profile wydania, uchwyty ponownego uruchomienia i dowody
title: Pełna walidacja wydania
x-i18n:
    generated_at: "2026-05-02T10:02:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: feb4edec850fb97405575c869547b4851bc773507321690670553e6faafc8b0b
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` to nadrzędna walidacja wydania. Jest to pojedynczy ręczny
punkt wejścia dla dowodu przedwydaniowego, ale większość pracy odbywa się w
workflow potomnych, więc nieudaną maszynę można uruchomić ponownie bez
restartowania całego wydania.

Uruchom ją z zaufanej referencji workflow, zwykle `main`, i przekaż gałąź
wydania, tag albo pełny SHA commita jako `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Workflow potomne używają zaufanej referencji workflow dla uprzęży testowej oraz
wejścia `ref` dla testowanego kandydata. Dzięki temu nowa logika walidacji jest
dostępna podczas walidowania starszej gałęzi wydania albo tagu.

## Etapy najwyższego poziomu

| Etap                 | Szczegóły                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Rozwiązanie celu     | **Zadanie:** `Resolve target ref`<br />**Workflow potomny:** brak<br />**Dowodzi:** rozwiązuje gałąź wydania, tag albo pełny SHA commita i zapisuje wybrane dane wejściowe.<br />**Ponowne uruchomienie:** uruchom ponownie nadrzędną walidację, jeśli to się nie powiedzie.                                                                                                                                       |
| Vitest i zwykłe CI   | **Zadanie:** `Run normal full CI`<br />**Workflow potomny:** `CI`<br />**Dowodzi:** ręczny pełny graf CI względem docelowej referencji, w tym ścieżki Linux Node, fragmenty dołączonych pluginów, kontrakty kanałów, zgodność z Node 22, `check`, `check-additional`, smoke test kompilacji, kontrole dokumentacji, Python skills, Windows, macOS, i18n Control UI i Android przez nadrzędny workflow.<br />**Ponowne uruchomienie:** `rerun_group=ci`. |
| Przedwydanie pluginu | **Zadanie:** `Run plugin prerelease validation`<br />**Workflow potomny:** `Plugin Prerelease`<br />**Dowodzi:** kontrole statyczne pluginów tylko dla wydania, agentowe pokrycie pluginów, pełne fragmenty wsadowe rozszerzeń oraz przedwydaniowe ścieżki Docker dla pluginów.<br />**Ponowne uruchomienie:** `rerun_group=plugin-prerelease`.                                                                       |
| Kontrole wydania     | **Zadanie:** `Run release/live/Docker/QA validation`<br />**Workflow potomny:** `OpenClaw Release Checks`<br />**Dowodzi:** smoke test instalacji, kontrole pakietów między systemami, zestawy live/E2E, fragmenty ścieżki wydania Docker, Package Acceptance, parytet QA Lab, live Matrix i live Telegram.<br />**Ponowne uruchomienie:** `rerun_group=release-checks` albo węższy uchwyt release-checks.            |
| Pakiet Telegram      | **Zadanie:** `Run package Telegram E2E`<br />**Workflow potomny:** `NPM Telegram Beta E2E`<br />**Dowodzi:** dowód pakietu Telegram oparty na artefakcie dla `rerun_group=all` z `release_profile=full`, albo dowód Telegram dla opublikowanego pakietu, gdy ustawiono `npm_telegram_package_spec`.<br />**Ponowne uruchomienie:** `rerun_group=npm-telegram` z `npm_telegram_package_spec`.                      |
| Weryfikator nadrzędny | **Zadanie:** `Verify full validation`<br />**Workflow potomny:** brak<br />**Dowodzi:** ponownie sprawdza zapisane wyniki workflow potomnych i dopisuje tabele najwolniejszych zadań z workflow potomnych.<br />**Ponowne uruchomienie:** uruchom ponownie tylko to zadanie po doprowadzeniu nieudanego workflow potomnego do stanu zielonego.                                                                      |

Dla `ref=main` i `rerun_group=all` nowsza walidacja nadrzędna zastępuje starszą.
Gdy rodzic zostanie anulowany, jego monitor anuluje każde workflow potomne, które
już uruchomił. Uruchomienia walidacji gałęzi wydania i tagów domyślnie nie
anulują się nawzajem.

## Etapy kontroli wydania

`OpenClaw Release Checks` to największe workflow potomne. Raz rozwiązuje cel i
przygotowuje współdzielony artefakt `release-package-under-test`, gdy etapy
związane z pakietem albo Docker go potrzebują.

| Etap                 | Szczegóły                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cel wydania          | **Zadanie:** `Resolve target ref`<br />**Workflow bazowy:** brak<br />**Testy:** wybrana referencja, opcjonalny oczekiwany SHA, profil, grupa ponownego uruchomienia i ukierunkowany filtr zestawu live.<br />**Ponowne uruchomienie:** `rerun_group=release-checks`.                                                                                                                                     |
| Artefakt pakietu     | **Zadanie:** `Prepare release package artifact`<br />**Workflow bazowy:** brak<br />**Testy:** pakuje albo rozwiązuje jeden kandydujący tarball i przesyła `release-package-under-test` dla dalszych kontroli związanych z pakietem.<br />**Ponowne uruchomienie:** dotknięta grupa pakietu, cross-OS albo live/E2E.                                                                                     |
| Smoke test instalacji | **Zadanie:** `Run install smoke`<br />**Workflow bazowy:** `Install Smoke`<br />**Testy:** pełna ścieżka instalacji z ponownym użyciem obrazu smoke z głównego Dockerfile, instalacja pakietu QR, smoke testy Docker dla root i Gateway, testy Docker instalatora, smoke test globalnej instalacji Bun dla dostawcy obrazów oraz szybkie E2E instalacji/odinstalowania dołączonych pluginów.<br />**Ponowne uruchomienie:** `rerun_group=install-smoke`. |
| Cross-OS             | **Zadanie:** `cross_os_release_checks`<br />**Workflow bazowy:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testy:** ścieżki świeżej instalacji i aktualizacji na Linux, Windows i macOS dla wybranego dostawcy i trybu, z użyciem kandydującego tarballa oraz pakietu bazowego.<br />**Ponowne uruchomienie:** `rerun_group=cross-os`.                                                        |
| Repozytorium i live E2E | **Zadanie:** `Run repo/live E2E validation`<br />**Workflow bazowy:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testy:** E2E repozytorium, cache live, strumieniowanie websocket OpenAI, natywne fragmenty live dostawcy i pluginów oraz harnessy live model/backend/Gateway oparte na Docker, wybrane przez `release_profile`.<br />**Ponowne uruchomienie:** `rerun_group=live-e2e`, opcjonalnie z `live_suite_filter`. |
| Ścieżka wydania Docker | **Zadanie:** `Run Docker release-path validation`<br />**Workflow bazowy:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testy:** fragmenty Docker ścieżki wydania względem współdzielonego artefaktu pakietu.<br />**Ponowne uruchomienie:** `rerun_group=live-e2e`.                                                                                                                                 |
| Package Acceptance   | **Zadanie:** `Run package acceptance`<br />**Workflow bazowy:** `Package Acceptance`<br />**Testy:** offline’owe fixture pakietów pluginów, aktualizacja pluginu oraz akceptacja pakietu Telegram z mock-OpenAI względem tego samego tarballa.<br />**Ponowne uruchomienie:** `rerun_group=package`.                                                                                                      |
| Parytet QA           | **Zadanie:** `Run QA Lab parity lane` i `Run QA Lab parity report`<br />**Workflow bazowy:** zadania bezpośrednie<br />**Testy:** agentowe pakiety parytetu kandydata i baseline’u, a następnie raport parytetu.<br />**Ponowne uruchomienie:** `rerun_group=qa-parity` albo `rerun_group=qa`.                                                                                                           |
| QA live Matrix       | **Zadanie:** `Run QA Lab live Matrix lane`<br />**Workflow bazowy:** zadanie bezpośrednie<br />**Testy:** szybki profil QA live Matrix w środowisku `qa-live-shared`.<br />**Ponowne uruchomienie:** `rerun_group=qa-live` albo `rerun_group=qa`.                                                                                                                                                         |
| QA live Telegram     | **Zadanie:** `Run QA Lab live Telegram lane`<br />**Workflow bazowy:** zadanie bezpośrednie<br />**Testy:** live Telegram QA z dzierżawami poświadczeń Convex CI.<br />**Ponowne uruchomienie:** `rerun_group=qa-live` albo `rerun_group=qa`.                                                                                                                                                              |
| Weryfikator wydania  | **Zadanie:** `Verify release checks`<br />**Workflow bazowy:** brak<br />**Testy:** wymagane zadania release-check dla wybranej grupy ponownego uruchomienia.<br />**Ponowne uruchomienie:** uruchom ponownie po przejściu ukierunkowanych zadań potomnych.                                                                                                                                               |

## Fragmenty ścieżki wydania Docker

Etap ścieżki wydania Docker uruchamia te fragmenty, gdy `live_suite_filter` jest
pusty:

| Fragment                                                        | Zakres pokrycia                                                         |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Smoke ścieżki wydania Core Docker.                                      |
| `package-update-openai`                                         | Zachowanie instalacji i aktualizacji pakietu OpenAI.                    |
| `package-update-anthropic`                                      | Zachowanie instalacji i aktualizacji pakietu Anthropic.                 |
| `package-update-core`                                           | Zachowanie pakietu i aktualizacji niezależne od dostawcy.               |
| `plugins-runtime-plugins`                                       | Ścieżki runtime pluginów ćwiczące zachowanie pluginów.                  |
| `plugins-runtime-services`                                      | Ścieżki runtime pluginów opartych na usługach; obejmuje OpenWebUI, gdy zażądano. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Partie instalacji/runtime pluginów podzielone na równoległą walidację wydania. |

Użyj ukierunkowanego `docker_lanes=<lane[,lane]>` w wielokrotnego użytku workflow
live/E2E, gdy nie powiodła się tylko jedna ścieżka Docker. Artefakty wydania
zawierają polecenia ponownego uruchomienia dla poszczególnych ścieżek, z danymi
wejściowymi artefaktu pakietu i ponownego użycia obrazu, gdy są dostępne.

## Profile wydania

`release_profile` kontroluje głównie szerokość live/dostawcy wewnątrz kontroli
wydania. Nie usuwa zwykłego pełnego CI, Plugin Prerelease, smoke testu
instalacji, package acceptance, QA Lab ani fragmentów ścieżki wydania Docker.
`full` powoduje też, że nadrzędna walidacja uruchamia package Telegram E2E
względem artefaktu pakietu wydania, gdy `rerun_group=all`, więc pełny kandydat
przed publikacją nie pomija po cichu tej ścieżki pakietu Telegram.

| Profil   | Przeznaczenie                      | Uwzględnione pokrycie live/provider                                                                                                                                               |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Najszybszy smoke test krytyczny dla wydania.   | Ścieżka live OpenAI/core, modele live Docker dla OpenAI, natywny rdzeń gateway, natywny profil Gateway OpenAI, natywny Plugin OpenAI oraz OpenAI Gateway live w Docker.               |
| `stable`  | Domyślny profil zatwierdzania wydania. | `minimum` plus Anthropic, Google, MiniMax, backend, natywny harness testów live, backend CLI live Docker, powiązanie ACP Docker, harness Codex Docker oraz shard smoke OpenCode Go. |
| `full`    | Szeroki przegląd doradczy.             | `stable` plus dostawcy doradczy, shardy live Plugin oraz shardy live mediów.                                                                                                  |

## Dodatki tylko w full

Te zestawy są pomijane przez `stable` i uwzględniane przez `full`:

| Obszar                             | Pokrycie tylko w full                                                              |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Modele live Docker               | OpenCode Go, OpenRouter, xAI, Z.ai i Fireworks.                              |
| Gateway live Docker              | Shard doradczy dla DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI i Z.ai. |
| Profile dostawców natywnego Gateway | Fireworks, DeepSeek, pełne shardy modeli OpenCode Go, OpenRouter, xAI i Z.ai.  |
| Natywne shardy live Plugin        | Pluginy A-K, L-N, O-Z inne, Moonshot i xAI.                                 |
| Natywne shardy live mediów         | Audio, muzyka Google, muzyka MiniMax oraz grupy wideo A-D.                       |

`stable` obejmuje `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
używa zamiast tego szerszych shardów modeli OpenCode Go.

## Skoncentrowione ponowne uruchomienia

Użyj `rerun_group`, aby uniknąć powtarzania niepowiązanych skrzynek wydania:

| Uchwyt              | Zakres                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Wszystkie etapy pełnej walidacji wydania.                                   |
| `ci`                | Tylko ręczny podrzędny pełny CI.                                            |
| `plugin-prerelease` | Tylko podrzędne wydanie wstępne Plugin.                                         |
| `release-checks`    | Wszystkie etapy kontroli wydania OpenClaw.                                   |
| `install-smoke`     | Smoke test instalacji przez kontrole wydania.                                 |
| `cross-os`          | Kontrole wydania między systemami operacyjnymi.                                              |
| `live-e2e`          | Walidacja E2E repo/live oraz ścieżki wydania Docker.                     |
| `package`           | Akceptacja pakietu.                                                   |
| `qa`                | Parytet QA plus pasma live QA.                                         |
| `qa-parity`         | Tylko pasma parytetu QA i raport.                                      |
| `qa-live`           | Tylko macierz live QA i Telegram.                                     |
| `npm-telegram`      | E2E Telegram opublikowanego pakietu; wymaga `npm_telegram_package_spec`. |

Użyj `live_suite_filter` z `rerun_group=live-e2e`, gdy jeden zestaw live zakończył się niepowodzeniem.
Prawidłowe identyfikatory filtrów są zdefiniowane w wielokrotnego użytku przepływie pracy live/E2E, w tym
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` i
`live-codex-harness-docker`.

## Dowody do zachowania

Zachowaj podsumowanie `Full Release Validation` jako indeks na poziomie wydania. Zawiera ono linki
do identyfikatorów uruchomień podrzędnych i obejmuje tabele najwolniejszych zadań. W przypadku niepowodzeń najpierw sprawdź podrzędny
przepływ pracy, a następnie ponownie uruchom najmniejszy pasujący uchwyt powyżej.

Przydatne artefakty:

- `release-package-under-test` z `OpenClaw Release Checks`
- Artefakty ścieżki wydania Docker w `.artifacts/docker-tests/`
- `package-under-test` z Package Acceptance oraz artefakty akceptacyjne Docker
- Artefakty kontroli wydania Cross-OS dla każdego systemu operacyjnego i zestawu
- Artefakty QA parity, Matrix i Telegram

## Pliki przepływów pracy

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
