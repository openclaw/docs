---
read_when:
    - Uruchamianie lub ponowne uruchamianie pełnej walidacji wydania
    - Porównywanie profili stabilnej i pełnej walidacji wydania
    - Debugowanie niepowodzeń etapów walidacji wydania
summary: Etapy pełnej walidacji wydania, podrzędne przepływy pracy, profile wydań, identyfikatory ponownego uruchomienia i dowody
title: Pełna walidacja wydania
x-i18n:
    generated_at: "2026-05-02T20:57:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ce1e5a72227ca202335fe68b537491a0b68a0bb2af431aa56c41cf20989e88c
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` to parasol wydania. Jest to pojedynczy ręczny
punkt wejścia do potwierdzenia przed wydaniem, ale większość pracy odbywa się w podrzędnych workflow, dzięki czemu
nieudane środowisko można uruchomić ponownie bez restartowania całego wydania.

Uruchom go z zaufanego odwołania workflow, zwykle `main`, i przekaż gałąź wydania,
tag albo pełny SHA commita jako `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Podrzędne workflow używają zaufanego odwołania workflow dla harnessu oraz wejściowego
`ref` dla testowanego kandydata. Dzięki temu nowa logika walidacji pozostaje dostępna
podczas walidowania starszej gałęzi wydania lub tagu.

Akceptacja pakietu zwykle buduje archiwum tar kandydata z rozwiązanego
`ref`, w tym uruchomienia z pełnym SHA wywołane przez `pnpm ci:full-release`. Po
publikacji przekaż `package_acceptance_package_spec=openclaw@YYYY.M.D` (albo
`openclaw@beta`/`openclaw@latest`), aby zamiast tego uruchomić tę samą macierz pakietu/aktualizacji względem
opublikowanego pakietu npm.

## Etapy najwyższego poziomu

| Etap                 | Szczegóły                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rozwiązanie celu     | **Zadanie:** `Resolve target ref`<br />**Podrzędne workflow:** brak<br />**Potwierdza:** rozwiązuje gałąź wydania, tag albo pełny SHA commita i zapisuje wybrane wejścia.<br />**Ponowne uruchomienie:** uruchom ponownie parasol, jeśli ten etap się nie powiedzie.                                                                                                                           |
| Vitest i normalne CI | **Zadanie:** `Run normal full CI`<br />**Podrzędne workflow:** `CI`<br />**Potwierdza:** ręczny pełny graf CI względem docelowego `ref`, w tym ścieżki Linux Node, shardy dołączonych Plugin, kontrakty kanałów, zgodność z Node 22, `check`, `check-additional`, smoke test kompilacji, kontrole docs, Python skills, Windows, macOS, i18n Control UI oraz Android przez parasol.<br />**Ponowne uruchomienie:** `rerun_group=ci`. |
| Przedwydanie Plugin  | **Zadanie:** `Run plugin prerelease validation`<br />**Podrzędne workflow:** `Plugin Prerelease`<br />**Potwierdza:** statyczne kontrole Plugin tylko dla wydania, pokrycie agentowe Plugin, pełne shardy wsadowe extension oraz dockerowe ścieżki przedwydaniowe Plugin.<br />**Ponowne uruchomienie:** `rerun_group=plugin-prerelease`.                                                          |
| Kontrole wydania     | **Zadanie:** `Run release/live/Docker/QA validation`<br />**Podrzędne workflow:** `OpenClaw Release Checks`<br />**Potwierdza:** install smoke, kontrole pakietów między systemami operacyjnymi, zestawy live/E2E, części ścieżki wydania Docker, Akceptację pakietu, parytet QA Lab, live Matrix oraz live Telegram.<br />**Ponowne uruchomienie:** `rerun_group=release-checks` albo węższy uchwyt release-checks. |
| Pakiet Telegram      | **Zadanie:** `Run package Telegram E2E`<br />**Podrzędne workflow:** `NPM Telegram Beta E2E`<br />**Potwierdza:** oparte na artefaktach potwierdzenie pakietu Telegram dla `rerun_group=all` z `release_profile=full`, albo potwierdzenie Telegram dla opublikowanego pakietu, gdy ustawiono `npm_telegram_package_spec`.<br />**Ponowne uruchomienie:** `rerun_group=npm-telegram` z `npm_telegram_package_spec`. |
| Weryfikator parasola | **Zadanie:** `Verify full validation`<br />**Podrzędne workflow:** brak<br />**Potwierdza:** ponownie sprawdza zapisane konkluzje podrzędnych uruchomień i dopisuje tabele najwolniejszych zadań z podrzędnych workflow.<br />**Ponowne uruchomienie:** uruchom ponownie tylko to zadanie po ponownym uruchomieniu nieudanego zadania podrzędnego do stanu zielonego.                          |

Dla `ref=main` i `rerun_group=all` nowszy parasol zastępuje starszy.
Gdy rodzic zostaje anulowany, jego monitor anuluje każde podrzędne workflow, które już
wywołał. Uruchomienia walidacji gałęzi wydania i tagów domyślnie nie
anulują się wzajemnie.

## Etapy kontroli wydania

`OpenClaw Release Checks` to największe podrzędne workflow. Rozwiązuje cel
jeden raz i przygotowuje współdzielony artefakt `release-package-under-test`, gdy etapy
związane z pakietami lub Docker go potrzebują.

| Etap                   | Szczegóły                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cel wydania            | **Zadanie:** `Resolve target ref`<br />**Workflow wspierające:** brak<br />**Testy:** wybrane `ref`, opcjonalny oczekiwany SHA, profil, grupa ponownego uruchomienia oraz ukierunkowany filtr zestawu live.<br />**Ponowne uruchomienie:** `rerun_group=release-checks`.                                                                                                                       |
| Artefakt pakietu       | **Zadanie:** `Prepare release package artifact`<br />**Workflow wspierające:** brak<br />**Testy:** pakuje albo rozwiązuje jedno archiwum tar kandydata i przesyła `release-package-under-test` dla dalszych kontroli związanych z pakietami.<br />**Ponowne uruchomienie:** dotknięta grupa pakietu, cross-OS albo live/E2E.                                                                   |
| Install smoke          | **Zadanie:** `Run install smoke`<br />**Workflow wspierające:** `Install Smoke`<br />**Testy:** pełna ścieżka instalacji z ponownym użyciem obrazu smoke głównego Dockerfile, instalacja pakietu QR, smoke testy root i Gateway Docker, testy Docker instalatora, smoke globalnej instalacji Bun z image-provider oraz szybkie E2E instalacji/deinstalacji dołączonych Plugin.<br />**Ponowne uruchomienie:** `rerun_group=install-smoke`. |
| Cross-OS               | **Zadanie:** `cross_os_release_checks`<br />**Workflow wspierające:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testy:** ścieżki świeżej instalacji i aktualizacji na Linux, Windows oraz macOS dla wybranego dostawcy i trybu, z użyciem archiwum tar kandydata oraz pakietu bazowego.<br />**Ponowne uruchomienie:** `rerun_group=cross-os`.                                      |
| Repozytorium i live E2E | **Zadanie:** `Run repo/live E2E validation`<br />**Workflow wspierające:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testy:** E2E repozytorium, cache live, streaming websocket OpenAI, natywne shardy dostawcy live i Plugin oraz harnessy live model/backend/Gateway oparte na Docker, wybrane przez `release_profile`.<br />**Ponowne uruchomienie:** `rerun_group=live-e2e`, opcjonalnie z `live_suite_filter`. |
| Ścieżka wydania Docker | **Zadanie:** `Run Docker release-path validation`<br />**Workflow wspierające:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testy:** części Docker ścieżki wydania względem współdzielonego artefaktu pakietu.<br />**Ponowne uruchomienie:** `rerun_group=live-e2e`.                                                                                                                        |
| Akceptacja pakietu     | **Zadanie:** `Run package acceptance`<br />**Workflow wspierające:** `Package Acceptance`<br />**Testy:** offline fixture'y pakietów Plugin, aktualizacja Plugin, akceptacja pakietu Telegram z mock-OpenAI oraz kontrole przetrwania opublikowanej aktualizacji z każdego stabilnego wydania npm od `2026.4.23` włącznie względem tego samego archiwum tar.<br />**Ponowne uruchomienie:** `rerun_group=package`. |
| Parytet QA             | **Zadanie:** `Run QA Lab parity lane` i `Run QA Lab parity report`<br />**Workflow wspierające:** zadania bezpośrednie<br />**Testy:** agentowe pakiety parytetu kandydata i baseline, a następnie raport parytetu.<br />**Ponowne uruchomienie:** `rerun_group=qa-parity` albo `rerun_group=qa`.                                                                                                  |
| Live Matrix QA         | **Zadanie:** `Run QA Lab live Matrix lane`<br />**Workflow wspierające:** zadanie bezpośrednie<br />**Testy:** szybki profil QA live Matrix w środowisku `qa-live-shared`.<br />**Ponowne uruchomienie:** `rerun_group=qa-live` albo `rerun_group=qa`.                                                                                                                                             |
| Live Telegram QA       | **Zadanie:** `Run QA Lab live Telegram lane`<br />**Workflow wspierające:** zadanie bezpośrednie<br />**Testy:** live Telegram QA z dzierżawami poświadczeń Convex CI.<br />**Ponowne uruchomienie:** `rerun_group=qa-live` albo `rerun_group=qa`.                                                                                                                                                  |
| Weryfikator wydania    | **Zadanie:** `Verify release checks`<br />**Workflow wspierające:** brak<br />**Testy:** wymagane zadania release-check dla wybranej grupy ponownego uruchomienia.<br />**Ponowne uruchomienie:** uruchom ponownie po przejściu ukierunkowanych zadań podrzędnych.                                                                                                                               |

## Części ścieżki wydania Docker

Etap ścieżki wydania Docker uruchamia te części, gdy `live_suite_filter` jest
puste:

| Część                                                           | Pokrycie                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Ścieżki smoke głównej ścieżki wydania Docker.                           |
| `package-update-openai`                                         | Zachowanie instalacji i aktualizacji pakietu OpenAI.                    |
| `package-update-anthropic`                                      | Zachowanie instalacji i aktualizacji pakietu Anthropic.                 |
| `package-update-core`                                           | Zachowanie pakietu i aktualizacji neutralne względem dostawcy.          |
| `plugins-runtime-plugins`                                       | Ścieżki runtime Plugin, które wykonują zachowanie Plugin.               |
| `plugins-runtime-services`                                      | Ścieżki runtime Plugin oparte na usługach; obejmuje OpenWebUI, gdy zażądano. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Partie instalacji/runtime Plugin podzielone dla równoległej walidacji wydania. |

Użyj ukierunkowanego `docker_lanes=<lane[,lane]>` w wielokrotnego użytku workflow live/E2E, gdy
nie powiodła się tylko jedna ścieżka Docker. Artefakty wydania zawierają polecenia ponownego uruchomienia
dla każdej ścieżki z artefaktem pakietu i wejściami ponownego użycia obrazu, gdy są dostępne.

## Profile wydania

`release_profile` steruje głównie zakresem live/provider wewnątrz kontroli wydania.
Nie usuwa zwykłego pełnego CI, Plugin Prerelease, dymnego testu instalacji, akceptacji pakietu, QA Lab ani fragmentów ścieżki wydania Docker. `full` powoduje też, że uruchomienie nadrzędne wykonuje pakietowe E2E Telegram względem artefaktu pakietu wydania, gdy `rerun_group=all`, więc pełny kandydat przed publikacją nie pomija po cichu tej ścieżki pakietowej Telegram.

| Profil    | Zamierzone użycie                         | Uwzględnione pokrycie live/provider                                                                                                                                              |
| --------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Najszybszy dymny test krytyczny wydania.  | Ścieżka live OpenAI/core, modele live Docker dla OpenAI, natywny rdzeń gateway, natywny profil gateway OpenAI, natywny Plugin OpenAI oraz gateway live Docker OpenAI.            |
| `stable`  | Domyślny profil zatwierdzania wydania.    | `minimum` plus Anthropic, Google, MiniMax, backend, natywny harness testów live, backend CLI live Docker, powiązanie Docker ACP, harness Docker Codex oraz shard dymny OpenCode Go. |
| `full`    | Szeroki przegląd doradczy.                | `stable` plus dostawcy doradczy, shardy live Plugin oraz shardy live mediów.                                                                                                      |

## Dodatki tylko w trybie full

Te zestawy są pomijane przez `stable` i uwzględniane przez `full`:

| Obszar                           | Pokrycie tylko w trybie full                                                   |
| -------------------------------- | ----------------------------------------------------------------------------- |
| Modele live Docker               | OpenCode Go, OpenRouter, xAI, Z.ai i Fireworks.                               |
| Gateway live Docker              | Shard doradczy dla DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI i Z.ai.  |
| Natywne profile dostawców gateway | Fireworks, DeepSeek, pełne shardy modeli OpenCode Go, OpenRouter, xAI i Z.ai. |
| Natywne shardy live Plugin       | Plugins A-K, L-N, O-Z other, Moonshot i xAI.                                  |
| Natywne shardy live mediów       | Audio, muzyka Google, muzyka MiniMax oraz grupy wideo A-D.                    |

`stable` obejmuje `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
używa zamiast tego szerszych shardów modeli OpenCode Go.

## Ukierunkowane ponowne uruchomienia

Użyj `rerun_group`, aby uniknąć powtarzania niepowiązanych pól wydania:

| Uchwyt              | Zakres                                                                 |
| ------------------- | ---------------------------------------------------------------------- |
| `all`               | Wszystkie etapy pełnej walidacji wydania.                              |
| `ci`                | Tylko podrzędny ręczny pełny CI.                                        |
| `plugin-prerelease` | Tylko podrzędny Plugin Prerelease.                                      |
| `release-checks`    | Wszystkie etapy kontroli wydania OpenClaw.                             |
| `install-smoke`     | Dymny test instalacji przez kontrole wydania.                          |
| `cross-os`          | Kontrole wydania między systemami operacyjnymi.                        |
| `live-e2e`          | Walidacja repo/live E2E i ścieżki wydania Docker.                      |
| `package`           | Akceptacja pakietu.                                                     |
| `qa`                | Parytet QA plus ścieżki live QA.                                        |
| `qa-parity`         | Tylko ścieżki parytetu QA i raport.                                    |
| `qa-live`           | Tylko macierz live QA i Telegram.                                      |
| `npm-telegram`      | E2E Telegram opublikowanego pakietu; wymaga `npm_telegram_package_spec`. |

Użyj `live_suite_filter` z `rerun_group=live-e2e`, gdy jeden zestaw live się nie powiódł.
Prawidłowe identyfikatory filtrów są zdefiniowane w wielorazowym workflow live/E2E, w tym
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` i
`live-codex-harness-docker`.

## Dowody do zachowania

Zachowaj podsumowanie `Full Release Validation` jako indeks na poziomie wydania. Łączy ono
identyfikatory uruchomień podrzędnych i zawiera tabele najwolniejszych zadań. W przypadku niepowodzeń najpierw sprawdź podrzędny
workflow, a potem ponownie uruchom najmniejszy pasujący uchwyt powyżej.

Przydatne artefakty:

- `release-package-under-test` z `OpenClaw Release Checks`
- Artefakty ścieżki wydania Docker w `.artifacts/docker-tests/`
- Artefakty `package-under-test` z akceptacji pakietu oraz artefakty akceptacji Docker
- Artefakty kontroli wydania między systemami operacyjnymi dla każdego systemu operacyjnego i zestawu
- Artefakty parytetu QA, Matrix i Telegram

## Pliki workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
