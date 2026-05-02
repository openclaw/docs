---
read_when:
    - Zmiana zachowania aktualizacji OpenClaw, doctor, akceptacji pakietu lub instalacji Plugin
    - Przygotowywanie lub zatwierdzanie kandydata do wydania
    - Debugowanie aktualizacji pakietu, czyszczenia zależności Plugin lub regresji instalacji Plugin
sidebarTitle: Update and plugin tests
summary: Jak OpenClaw weryfikuje ścieżki aktualizacji, migracje pakietów oraz zachowanie instalacji/aktualizacji Pluginów
title: 'Testowanie: aktualizacje i Pluginy'
x-i18n:
    generated_at: "2026-05-02T20:46:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a56e249f565cc23a439142b3332c0a57fd4afe9021b79f644d353946d6d2ffc
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

To jest dedykowana lista kontrolna do walidacji aktualizacji i pluginów. Cel jest
prosty: udowodnić, że instalowalny pakiet potrafi zaktualizować rzeczywisty stan użytkownika, naprawić przestarzały
stan legacy przez `doctor`, a także nadal instalować, ładować, aktualizować i odinstalowywać
pluginy ze wspieranych źródeł.

Szerszą mapę runnera testów znajdziesz w [Testowanie](/pl/help/testing). Informacje o kluczach live providerów
i zestawach dotykających sieci znajdziesz w [Testowanie live](/pl/help/testing-live).

## Co chronimy

Testy aktualizacji i pluginów chronią te kontrakty:

- Tarball pakietu jest kompletny, ma prawidłowy plik `dist/postinstall-inventory.json`
  i nie zależy od nierozpakowanych plików repozytorium.
- Użytkownik może przejść ze starszego opublikowanego pakietu na pakiet kandydujący
  bez utraty konfiguracji, agentów, sesji, workspace'ów, allowlist pluginów ani
  konfiguracji kanałów.
- `openclaw doctor --fix --non-interactive` odpowiada za ścieżki porządkowania i naprawy
  legacy. Uruchamianie nie powinno rozrastać się o ukryte migracje zgodności dla przestarzałego
  stanu pluginów.
- Instalacje pluginów działają z katalogów lokalnych, repozytoriów git, pakietów npm i
  ścieżki rejestru ClawHub.
- Zależności npm pluginów są instalowane w zarządzanym katalogu głównym npm, skanowane przed
  zaufaniem i usuwane przez npm podczas odinstalowywania, aby wyniesione zależności nie
  pozostawały.
- Aktualizacja pluginu jest stabilna, gdy nic się nie zmieniło: rekordy instalacji, rozwiązane
  źródło, układ zainstalowanych zależności i stan włączenia pozostają nienaruszone.

## Lokalny dowód podczas developmentu

Zacznij wąsko:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

W przypadku zmian dotyczących instalacji, odinstalowywania, zależności lub inwentarza pakietu
pluginów uruchom też ukierunkowane testy obejmujące edytowany seam:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Zanim jakakolwiek linia Docker pakietu zużyje tarball, udowodnij artefakt pakietu:

```bash
pnpm release:check
```

`release:check` uruchamia kontrole driftu konfiguracji/dokumentacji/API, zapisuje inwentarz dist
pakietu, uruchamia `npm pack --dry-run`, odrzuca zabronione spakowane pliki, instaluje
tarball w tymczasowym prefixie, uruchamia postinstall i wykonuje smoke testy entrypointów
dołączonych kanałów.

## Linie Docker

Linie Docker są dowodem na poziomie produktu. Instalują lub aktualizują rzeczywisty
pakiet w kontenerach Linux i asercjami sprawdzają zachowanie przez polecenia CLI,
uruchomienie Gateway, próby HTTP, status RPC i stan systemu plików.

Podczas iteracji używaj ukierunkowanych linii:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Ważne linie:

- `test:docker:plugins` waliduje smoke test instalacji pluginu, instalacje z folderów lokalnych,
  pomijanie aktualizacji folderu lokalnego, foldery lokalne z preinstalowanymi
  zależnościami, instalacje pakietów `file:`, instalacje git z wykonaniem CLI, aktualizacje
  ruchomych referencji git, instalacje z rejestru npm z wyniesionymi zależnościami
  przechodnimi, no-op aktualizacji npm, instalacje z lokalnego fixture ClawHub i no-op
  aktualizacji, zachowanie aktualizacji marketplace oraz włączanie/inspekcję pakietu Claude.
  Ustaw `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, aby blok ClawHub pozostał hermetyczny/offline.
- `test:docker:plugin-update` waliduje, że niezmieniony zainstalowany plugin nie
  reinstaluje się ani nie traci metadanych instalacji podczas `openclaw plugins update`.
- `test:docker:upgrade-survivor` instaluje kandydujący tarball nad brudnym fixture
  starego użytkownika, uruchamia aktualizację pakietu oraz nieinteraktywny doctor, a następnie uruchamia
  Gateway local loopback i sprawdza zachowanie stanu.
- `test:docker:published-upgrade-survivor` najpierw instaluje opublikowaną bazę,
  konfiguruje ją przez wypieczony przepis `openclaw config set`, aktualizuje ją do
  kandydującego tarballa, uruchamia doctor, sprawdza porządkowanie legacy, uruchamia Gateway i
  odpytuje `/healthz`, `/readyz` oraz status RPC.
- `test:docker:update-migration` to intensywna pod względem porządkowania linia aktualizacji opublikowanej.
  Startuje od skonfigurowanego stanu użytkownika w stylu Discord/Telegram, uruchamia bazowy
  doctor, aby skonfigurowane zależności pluginów miały szansę się zmaterializować, zasiewa
  legacy pozostałości zależności pluginu dla skonfigurowanego spakowanego pluginu, aktualizuje do
  kandydującego tarballa i wymaga, aby doctor po aktualizacji usunął legacy
  katalogi główne zależności.

Przydatne warianty published-upgrade survivor:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Dostępne scenariusze to `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `configured-plugin-installs`, `tilde-log-path` i
`versioned-runtime-deps`. W uruchomieniach zbiorczych
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` rozwija się do wszystkich scenariuszy
odzwierciedlających zgłoszone problemy, w tym migracji instalacji skonfigurowanych pluginów.

Pełna migracja aktualizacji jest celowo oddzielona od Full Release CI. Użyj
ręcznego workflow `Update Migration`, gdy pytanie wydania brzmi: „czy każda
opublikowana stabilna wersja od 2026.4.23 wzwyż może zaktualizować się do tego kandydata i
usunąć pozostałości zależności pluginów?”:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance to natywna dla GitHuba bramka pakietu. Rozwiązuje jeden pakiet kandydujący
do tarballa `package-under-test`, zapisuje wersję i SHA-256, a następnie
uruchamia wielokrotnego użytku linie Docker E2E względem dokładnie tego tarballa. Harness workflow
ma referencję oddzielną od referencji źródła pakietu, więc obecna logika testowa może walidować
starsze zaufane wydania.

Źródła kandydatów:

- `source=npm`: waliduj `openclaw@beta`, `openclaw@latest` albo dokładną
  opublikowaną wersję.
- `source=ref`: spakuj zaufaną gałąź, tag lub commit z wybranym obecnym
  harnessem.
- `source=url`: waliduj tarball HTTPS z wymaganym `package_sha256`.
- `source=artifact`: użyj ponownie tarballa przesłanego przez inny run Actions.

Full Release Validation domyślnie używa `source=artifact`, zbudowanego z
rozwiązanego SHA wydania. Dla dowodu po publikacji przekaż
`package_acceptance_package_spec=openclaw@YYYY.M.D`, aby ta sama macierz aktualizacji
celowała zamiast tego w wysłany pakiet npm.

Kontrole wydania wywołują Package Acceptance z zestawem package/update/plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Przekazują też:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Dzięki temu migracja pakietu, przełączanie kanału aktualizacji, porządkowanie przestarzałych zależności
pluginów, pokrycie pluginów offline, zachowanie aktualizacji pluginów i QA pakietu Telegram
działają na tym samym rozwiązanym artefakcie.

`all-since-2026.4.23` to próbka aktualizacji Full Release CI: każde stabilne wydanie opublikowane w npm od `2026.4.23` do `latest`. Dla wyczerpującego pokrycia migracji
aktualizacji opublikowanych wersji użyj `all-since-2026.4.23` w oddzielnym workflow Update
Migration zamiast Full Release CI. `release-history` pozostaje
dostępne do ręcznego szerszego próbkowania, gdy chcesz też uwzględnić starszy kotwiczny punkt
sprzed tej daty.

Uruchom profil pakietu ręcznie podczas walidacji kandydata przed wydaniem:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=all-since-2026.4.23 \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Użyj `suite_profile=product`, gdy pytanie wydania obejmuje kanały MCP,
porządkowanie cron/subagent, wyszukiwanie web OpenAI lub OpenWebUI. Używaj `suite_profile=full`
tylko wtedy, gdy potrzebujesz pełnego pokrycia ścieżki wydania Docker.

## Domyślne wydania

Dla kandydatów do wydania domyślny stos dowodowy to:

1. `pnpm check:changed` i `pnpm test:changed` dla regresji na poziomie źródeł.
2. `pnpm release:check` dla integralności artefaktu pakietu.
3. Profil Package Acceptance `package` albo niestandardowe linie pakietowe
   release-check dla kontraktów instalacji/aktualizacji/pluginów.
4. Kontrole wydania Cross-OS dla instalatora, onboardingu i zachowania platformy
   specyficznych dla systemu operacyjnego.
5. Zestawy live tylko wtedy, gdy zmieniana powierzchnia dotyka zachowania providera lub usługi hostowanej.

Na maszynach maintainerów szerokie bramki i dowód produktowy Docker/pakietu powinny działać
w Testbox, chyba że jawnie wykonywany jest dowód lokalny.

## Zgodność legacy

Pobłażliwość zgodności jest wąska i ograniczona czasowo:

- Pakiety do `2026.4.25` włącznie, w tym `2026.4.25-beta.*`, mogą tolerować
  już wysłane luki metadanych pakietu w Package Acceptance.
- Opublikowany pakiet `2026.4.26` może ostrzegać o plikach stempli metadanych lokalnego buildu
  już wysłanych.
- Późniejsze pakiety muszą spełniać nowoczesne kontrakty. Te same luki kończą się błędem zamiast
  ostrzeżeniem lub pominięciem.

Nie dodawaj nowych migracji startowych dla tych starych kształtów. Dodaj lub rozszerz naprawę
doctor, a potem udowodnij ją przez `upgrade-survivor` lub `published-upgrade-survivor`.

## Dodawanie pokrycia

Zmieniając zachowanie aktualizacji lub pluginów, dodaj pokrycie na najniższej warstwie, która
może zawieść z właściwego powodu:

- Czysta logika ścieżek lub metadanych: test jednostkowy obok źródła.
- Zachowanie inwentarza pakietu lub spakowanych plików: `package-dist-inventory` albo test
  checkera tarballa.
- Zachowanie instalacji/aktualizacji CLI: asercja lub fixture linii Docker.
- Zachowanie migracji opublikowanego wydania: scenariusz `published-upgrade-survivor`.
- Zachowanie źródła rejestru/pakietu: fixture `test:docker:plugins` albo serwer fixture
  ClawHub.
- Zachowanie układu lub porządkowania zależności: sprawdź zarówno wykonanie runtime, jak i
  granicę systemu plików. Zależności npm mogą być wyniesione pod zarządzany katalog główny npm,
  więc testy powinny udowadniać, że katalog główny jest skanowany/czyszczony, zamiast zakładać
  lokalne dla pakietu drzewo `node_modules`.

Nowe fixture Docker domyślnie utrzymuj jako hermetyczne. Używaj lokalnych rejestrów fixture i
fałszywych pakietów, chyba że celem testu jest zachowanie live rejestru.

## Triage awarii

Zacznij od tożsamości artefaktu:

- Podsumowanie Package Acceptance `resolve_package`: źródło, wersja, SHA-256 i
  nazwa artefaktu.
- Artefakty Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, logi linii i polecenia ponownego uruchomienia.
- Podsumowanie upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  w tym wersja bazowa, wersja kandydująca, scenariusz, czasy faz i
  kroki przepisu.

Preferuj ponowne uruchomienie dokładnej linii, która zawiodła, z tym samym artefaktem pakietu zamiast
ponownego uruchamiania całego parasola wydania.
