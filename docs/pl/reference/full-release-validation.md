---
read_when:
    - Uruchamianie lub ponowne uruchamianie pełnej walidacji wydania
    - Porównanie stabilnego i pełnego profilu walidacji wydania
    - Debugowanie niepowodzeń etapu walidacji wydania
summary: Etapy pełnej walidacji wydania, podrzędne przepływy pracy, profile wydania, uchwyty ponownego uruchamiania i dowody
title: Pełna walidacja wydania
x-i18n:
    generated_at: "2026-05-01T10:02:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcbfafd744437c160c09a9c508a639781549193669b300e5249023f9f5dd4afe
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` jest nadrzędnym procesem wydania. Jest to pojedynczy ręczny
punkt wejścia dla potwierdzenia przedwydaniowego, ale większość pracy odbywa się w przepływach potomnych, aby
nieudaną maszynę można było uruchomić ponownie bez restartowania całego wydania.

Uruchom go z zaufanego odwołania przepływu pracy, zwykle `main`, i przekaż gałąź wydania,
tag lub pełny SHA commita jako `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Przepływy potomne używają zaufanego odwołania przepływu pracy dla uprzęży oraz wejściowego
`ref` dla testowanego kandydata. Dzięki temu nowa logika walidacji pozostaje dostępna
podczas walidowania starszej gałęzi wydania lub tagu.

## Etapy najwyższego poziomu

| Etap                  | Szczegóły                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rozwiązywanie celu    | **Zadanie:** `Resolve target ref`<br />**Przepływ potomny:** brak<br />**Potwierdza:** rozwiązuje gałąź wydania, tag lub pełny SHA commita i zapisuje wybrane dane wejściowe.<br />**Ponowne uruchomienie:** uruchom ponownie proces nadrzędny, jeśli to się nie powiedzie.                                                                                                                            |
| Vitest i zwykłe CI    | **Zadanie:** `Run normal full CI`<br />**Przepływ potomny:** `CI`<br />**Potwierdza:** ręczny pełny graf CI względem docelowego ref, w tym ścieżki Linux Node, shardy wbudowanych Plugin, kontrakty kanałów, zgodność z Node 22, `check`, `check-additional`, smoke test kompilacji, kontrole dokumentacji, Python skills, Windows, macOS, i18n Control UI oraz Android przez proces nadrzędny.<br />**Ponowne uruchomienie:** `rerun_group=ci`. |
| Przedwydanie Plugin   | **Zadanie:** `Run plugin prerelease validation`<br />**Przepływ potomny:** `Plugin Prerelease`<br />**Potwierdza:** kontrole statyczne Plugin tylko dla wydania, agentowe pokrycie Plugin, pełne shardy partii rozszerzeń oraz ścieżki Docker przedwydania Plugin.<br />**Ponowne uruchomienie:** `rerun_group=plugin-prerelease`.                                                                  |
| Kontrole wydania      | **Zadanie:** `Run release/live/Docker/QA validation`<br />**Przepływ potomny:** `OpenClaw Release Checks`<br />**Potwierdza:** smoke test instalacji, kontrole pakietów między systemami, zestawy live/E2E, fragmenty ścieżki wydania Docker, Package Acceptance, parytet QA Lab, live Matrix oraz live Telegram.<br />**Ponowne uruchomienie:** `rerun_group=release-checks` lub węższy uchwyt release-checks. |
| Telegram po publikacji | **Zadanie:** `Run post-publish Telegram E2E`<br />**Przepływ potomny:** `NPM Telegram Beta E2E`<br />**Potwierdza:** opcjonalne potwierdzenie Telegram dla opublikowanego pakietu, gdy ustawiono `npm_telegram_package_spec`.<br />**Ponowne uruchomienie:** `rerun_group=npm-telegram`.                                                                                                            |
| Weryfikator nadrzędny | **Zadanie:** `Verify full validation`<br />**Przepływ potomny:** brak<br />**Potwierdza:** ponownie sprawdza zapisane wyniki przebiegów potomnych i dołącza tabele najwolniejszych zadań z przepływów potomnych.<br />**Ponowne uruchomienie:** uruchom ponownie tylko to zadanie po doprowadzeniu nieudanego przepływu potomnego do stanu zielonego.                                                    |

Dla `ref=main` i `rerun_group=all` nowszy proces nadrzędny zastępuje starszy.
Gdy rodzic zostanie anulowany, jego monitor anuluje każdy przepływ potomny, który już
uruchomił. Przebiegi walidacji gałęzi wydania i tagów domyślnie nie anulują się wzajemnie.

## Etapy kontroli wydania

`OpenClaw Release Checks` to największy przepływ potomny. Raz rozwiązuje cel
i przygotowuje współdzielony artefakt `release-package-under-test`, gdy potrzebują go etapy
związane z pakietem lub Dockerem.

| Etap                 | Szczegóły                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cel wydania          | **Zadanie:** `Resolve target ref`<br />**Przepływ bazowy:** brak<br />**Testuje:** wybrany ref, opcjonalny oczekiwany SHA, profil, grupę ponownego uruchomienia oraz ukierunkowany filtr zestawu live.<br />**Ponowne uruchomienie:** `rerun_group=release-checks`.                                                                                                                                       |
| Artefakt pakietu     | **Zadanie:** `Prepare release package artifact`<br />**Przepływ bazowy:** brak<br />**Testuje:** pakuje lub rozwiązuje jeden kandydacki tarball i przesyła `release-package-under-test` dla dalszych kontroli związanych z pakietem.<br />**Ponowne uruchomienie:** dotknięta grupa pakietu, cross-OS lub live/E2E.                                                                                     |
| Smoke test instalacji | **Zadanie:** `Run install smoke`<br />**Przepływ bazowy:** `Install Smoke`<br />**Testuje:** pełną ścieżkę instalacji z ponownym użyciem obrazu smoke z głównego Dockerfile, instalację pakietu QR, smoke testy głównego i gateway Docker, testy Docker instalatora, smoke test globalnej instalacji Bun z dostawcą obrazu oraz szybkie Docker E2E wbudowanych Plugin.<br />**Ponowne uruchomienie:** `rerun_group=install-smoke`. |
| Cross-OS             | **Zadanie:** `cross_os_release_checks`<br />**Przepływ bazowy:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Testuje:** ścieżki świeżej instalacji i aktualizacji na Linux, Windows i macOS dla wybranego dostawcy i trybu, używając kandydackiego tarballa oraz pakietu bazowego.<br />**Ponowne uruchomienie:** `rerun_group=cross-os`.                                                        |
| Repozytorium i live E2E | **Zadanie:** `Run repo/live E2E validation`<br />**Przepływ bazowy:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testuje:** repozytoryjne E2E, cache live, streaming websocket OpenAI, natywnego dostawcę live i shardy Plugin oraz uprzęże live model/backend/gateway oparte na Dockerze wybrane przez `release_profile`.<br />**Ponowne uruchomienie:** `rerun_group=live-e2e`, opcjonalnie z `live_suite_filter`. |
| Ścieżka wydania Docker | **Zadanie:** `Run Docker release-path validation`<br />**Przepływ bazowy:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Testuje:** fragmenty Docker ścieżki wydania względem współdzielonego artefaktu pakietu.<br />**Ponowne uruchomienie:** `rerun_group=live-e2e`.                                                                                                                               |
| Package Acceptance   | **Zadanie:** `Run package acceptance`<br />**Przepływ bazowy:** `Package Acceptance`<br />**Testuje:** natywną dla artefaktu zgodność zależności wbudowanych kanałów, offline'owe fixture'y pakietów Plugin oraz akceptację pakietu Telegram mock-OpenAI względem tego samego tarballa.<br />**Ponowne uruchomienie:** `rerun_group=package`.                                                             |
| Parytet QA           | **Zadanie:** `Run QA Lab parity lane` i `Run QA Lab parity report`<br />**Przepływ bazowy:** bezpośrednie zadania<br />**Testuje:** agentowe pakiety parytetu kandydata i baseline, a następnie raport parytetu.<br />**Ponowne uruchomienie:** `rerun_group=qa-parity` lub `rerun_group=qa`.                                                                                                          |
| Live Matrix QA       | **Zadanie:** `Run QA Lab live Matrix lane`<br />**Przepływ bazowy:** bezpośrednie zadanie<br />**Testuje:** szybki profil live Matrix QA w środowisku `qa-live-shared`.<br />**Ponowne uruchomienie:** `rerun_group=qa-live` lub `rerun_group=qa`.                                                                                                                                                     |
| Live Telegram QA     | **Zadanie:** `Run QA Lab live Telegram lane`<br />**Przepływ bazowy:** bezpośrednie zadanie<br />**Testuje:** live Telegram QA z dzierżawami poświadczeń Convex CI.<br />**Ponowne uruchomienie:** `rerun_group=qa-live` lub `rerun_group=qa`.                                                                                                                                                          |
| Weryfikator wydania  | **Zadanie:** `Verify release checks`<br />**Przepływ bazowy:** brak<br />**Testuje:** wymagane zadania kontroli wydania dla wybranej grupy ponownego uruchomienia.<br />**Ponowne uruchomienie:** uruchom ponownie po przejściu ukierunkowanych zadań potomnych.                                                                                                                                       |

## Fragmenty ścieżki wydania Docker

Etap ścieżki wydania Docker uruchamia te fragmenty, gdy `live_suite_filter` jest
pusty:

| Fragment                                                                                    | Pokrycie                                                                 |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `core`                                                                                      | Główne ścieżki smoke wydania Docker.                                     |
| `package-update-openai`                                                                     | Instalacja pakietu OpenAI i zachowanie aktualizacji.                     |
| `package-update-anthropic`                                                                  | Instalacja pakietu Anthropic i zachowanie aktualizacji.                  |
| `package-update-core`                                                                       | Neutralny względem dostawcy pakiet i zachowanie aktualizacji.            |
| `plugins-runtime-plugins`                                                                   | Ścieżki środowiska uruchomieniowego Plugin, które ćwiczą zachowanie Plugin. |
| `plugins-runtime-services`                                                                  | Ścieżki środowiska uruchomieniowego Plugin oparte na usługach; obejmuje OpenWebUI, gdy jest wymagane. |
| `plugins-runtime-install-a` przez `plugins-runtime-install-h`                               | Partie instalacji/środowiska uruchomieniowego Plugin podzielone dla równoległej walidacji wydania. |
| `bundled-channels-core`                                                                     | Zachowanie Docker wbudowanego kanału.                                    |
| `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` | Zachowanie aktualizacji wbudowanego kanału.                              |
| `bundled-channels-contracts`                                                                | Kontrole kontraktów wbudowanego kanału w ścieżce wydania Docker.         |

Użyj ukierunkowanego `docker_lanes=<lane[,lane]>` w wielokrotnego użytku przepływie pracy live/E2E, gdy nie powiodła się tylko jedna ścieżka Docker. Artefakty wydania zawierają polecenia ponownego uruchomienia dla poszczególnych ścieżek z wejściami ponownego użycia artefaktu pakietu i obrazu, gdy są dostępne.

## Profile wydania

`release_profile` kontroluje tylko zakres live/dostawcy w ramach kontroli wydania. Nie usuwa normalnego pełnego CI, Plugin Prerelease, testu instalacji, akceptacji pakietu, QA Lab ani fragmentów ścieżki wydania Docker.

| Profil    | Zamierzone użycie                  | Uwzględniony zakres live/dostawcy                                                                                                                                                  |
| --------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Najszybszy krytyczny test wydania. | Ścieżka live OpenAI/core, modele live Docker dla OpenAI, natywny rdzeń Gateway, natywny profil Gateway OpenAI, natywny plugin OpenAI oraz Gateway live Docker OpenAI.               |
| `stable`  | Domyślny profil zatwierdzania wydania. | `minimum` plus Anthropic, Google, MiniMax, backend, natywna uprząż testów live, backend CLI live Docker, powiązanie ACP Docker, uprząż Codex Docker oraz fragment testu OpenCode Go. |
| `full`    | Szeroki przegląd doradczy.         | `stable` plus dostawcy doradczy, fragmenty live pluginów oraz fragmenty live multimediów.                                                                                           |

## Dodatki tylko dla full

Te zestawy są pomijane przez `stable` i uwzględniane przez `full`:

| Obszar                           | Zakres tylko dla full                                                          |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Modele live Docker               | OpenCode Go, OpenRouter, xAI, Z.ai oraz Fireworks.                              |
| Gateway live Docker              | Fragment doradczy dla DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI oraz Z.ai. |
| Natywne profile dostawców Gateway | Fireworks, DeepSeek, pełne fragmenty modeli OpenCode Go, OpenRouter, xAI oraz Z.ai. |
| Natywne fragmenty live pluginów  | Pluginy A-K, L-N, O-Z inne, Moonshot oraz xAI.                                  |
| Natywne fragmenty live multimediów | Audio, muzyka Google, muzyka MiniMax oraz grupy wideo A-D.                      |

`stable` obejmuje `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
zamiast tego używa szerszych fragmentów modeli OpenCode Go.

## Ukierunkowane ponowne uruchomienia

Użyj `rerun_group`, aby uniknąć powtarzania niepowiązanych środowisk wydania:

| Identyfikator      | Zakres                                            |
| ------------------ | ------------------------------------------------- |
| `all`              | Wszystkie etapy Full Release Validation.          |
| `ci`               | Tylko podrzędny ręczny pełny CI.                  |
| `plugin-prerelease` | Tylko podrzędny Plugin Prerelease.               |
| `release-checks`   | Wszystkie etapy OpenClaw Release Checks.          |
| `install-smoke`    | Install Smoke przez kontrole wydania.             |
| `cross-os`         | Kontrole wydania Cross-OS.                        |
| `live-e2e`         | Repo/live E2E i walidacja ścieżki wydania Docker. |
| `package`          | Package Acceptance.                               |
| `qa`               | Parytet QA plus ścieżki live QA.                  |
| `qa-parity`        | Tylko ścieżki parytetu QA i raport.               |
| `qa-live`          | Tylko Matrix live QA i Telegram.                  |
| `npm-telegram`     | Tylko opcjonalne E2E Telegram po publikacji.      |

Użyj `live_suite_filter` z `rerun_group=live-e2e`, gdy nie powiódł się jeden zestaw live. Prawidłowe identyfikatory filtrów są zdefiniowane w wielokrotnego użytku przepływie pracy live/E2E, w tym `docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` oraz
`live-codex-harness-docker`.

## Dowody do zachowania

Zachowaj podsumowanie `Full Release Validation` jako indeks na poziomie wydania. Zawiera linki do identyfikatorów podrzędnych uruchomień i obejmuje tabele najwolniejszych zadań. W przypadku awarii najpierw sprawdź podrzędny przepływ pracy, a następnie ponownie uruchom najmniejszy pasujący identyfikator powyżej.

Przydatne artefakty:

- `release-package-under-test` z `OpenClaw Release Checks`
- Artefakty ścieżki wydania Docker w `.artifacts/docker-tests/`
- `package-under-test` z Package Acceptance oraz artefakty akceptacji Docker
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
