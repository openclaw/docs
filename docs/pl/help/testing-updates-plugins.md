---
read_when:
    - Zmiana zachowania aktualizacji OpenClaw, doctor, akceptacji pakietu lub instalacji Plugin
    - Przygotowywanie lub zatwierdzanie kandydata do wydania
    - Debugowanie aktualizacji pakietu, czyszczenia zależności Plugin lub regresji instalacji Plugin
sidebarTitle: Update and plugin tests
summary: Jak OpenClaw weryfikuje ścieżki aktualizacji, migracje pakietów oraz zachowanie instalacji/aktualizacji Plugin
title: 'Testowanie: aktualizacje i pluginy'
x-i18n:
    generated_at: "2026-05-03T09:47:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 309ac7785a8d49db241989d28580887d3f6739982108af7148b624082c5f23dd
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

To jest dedykowana lista kontrolna dla walidacji aktualizacji i Plugin. Cel jest prosty: udowodnić, że pakiet instalowalny może zaktualizować rzeczywisty stan użytkownika, naprawić przestarzały stan legacy przez `doctor`, a nadal instalować, ładować, aktualizować i odinstalowywać Pluginy z obsługiwanych źródeł.

Szerszą mapę runnera testów znajdziesz w [Testowanie](/pl/help/testing). Klucze providerów live i zestawy dotykające sieci opisuje [Testowanie live](/pl/help/testing-live).

## Co chronimy

Testy aktualizacji i Plugin chronią te kontrakty:

- Tarball pakietu jest kompletny, ma prawidłowy `dist/postinstall-inventory.json` i nie zależy od rozpakowanych plików repozytorium.
- Użytkownik może przejść ze starszego opublikowanego pakietu do pakietu kandydującego bez utraty konfiguracji, agentów, sesji, obszarów roboczych, list dozwolonych Pluginów ani konfiguracji kanałów.
- `openclaw doctor --fix --non-interactive` jest właścicielem ścieżek porządkowania i naprawy legacy. Uruchamianie nie powinno rozrastać się o ukryte migracje kompatybilności dla przestarzałego stanu Pluginów.
- Instalacje Pluginów działają z katalogów lokalnych, repozytoriów git, pakietów npm i ścieżki rejestru ClawHub.
- Zależności npm Pluginów są instalowane w zarządzanym katalogu głównym npm, skanowane przed zaufaniem i usuwane przez npm podczas odinstalowywania, aby wyniesione zależności nie pozostawały.
- Aktualizacja Pluginu jest stabilna, gdy nic się nie zmieniło: rekordy instalacji, rozpoznane źródło, układ zainstalowanych zależności i stan włączenia pozostają nienaruszone.

## Lokalny dowód podczas developmentu

Zacznij wąsko:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Dla zmian w instalacji, odinstalowywaniu, zależnościach lub inwentarzu pakietu Pluginów uruchom też skupione testy obejmujące edytowany styk:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Zanim jakakolwiek ścieżka Docker pakietu użyje tarballa, udowodnij artefakt pakietu:

```bash
pnpm release:check
```

`release:check` uruchamia kontrole dryfu konfiguracji, dokumentacji i API, zapisuje inwentarz dystrybucji pakietu, uruchamia `npm pack --dry-run`, odrzuca zabronione spakowane pliki, instaluje tarball do tymczasowego prefiksu, uruchamia postinstall i wykonuje smoke testy punktów wejścia dołączonych kanałów.

## Ścieżki Docker

Ścieżki Docker są dowodem na poziomie produktu. Instalują albo aktualizują rzeczywisty pakiet w kontenerach Linux i asercjami sprawdzają zachowanie przez polecenia CLI, uruchomienie Gateway, sondy HTTP, status RPC i stan systemu plików.

Używaj skupionych ścieżek podczas iteracji:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Ważne ścieżki:

- `test:docker:plugins` waliduje smoke instalacji Pluginów, instalacje z folderów lokalnych, zachowanie pomijania aktualizacji folderu lokalnego, foldery lokalne z preinstalowanymi zależnościami, instalacje pakietów `file:`, instalacje git z wykonaniem CLI, aktualizacje ruchomej referencji git, instalacje z rejestru npm z wyniesionymi zależnościami przechodnimi, no-op aktualizacji npm, instalacje z lokalnej fixtury ClawHub i no-op aktualizacji, zachowanie aktualizacji marketplace oraz włączenie/inspekcję pakietu Claude. Ustaw `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, aby blok ClawHub pozostał hermetyczny/offline.
- `test:docker:plugin-lifecycle-matrix` instaluje pakiet kandydujący w pustym kontenerze, przeprowadza Plugin npm przez instalację, inspekcję, wyłączenie, włączenie, jawne uaktualnienie, jawny downgrade i odinstalowanie po usunięciu kodu Pluginu. Loguje metryki RSS i CPU dla każdej fazy.
- `test:docker:plugin-update` waliduje, że niezmieniony zainstalowany Plugin nie jest reinstalowany ani nie traci metadanych instalacji podczas `openclaw plugins update`.
- `test:docker:upgrade-survivor` instaluje tarball kandydata na zabrudzonej fixturze starego użytkownika, uruchamia aktualizację pakietu oraz nieinteraktywny doctor, a następnie uruchamia Gateway na loopbacku i sprawdza zachowanie stanu.
- `test:docker:published-upgrade-survivor` najpierw instaluje opublikowaną bazę, konfiguruje ją przez wbudowaną receptę `openclaw config set`, aktualizuje ją do tarballa kandydata, uruchamia doctor, sprawdza porządkowanie legacy, uruchamia Gateway i sonduje `/healthz`, `/readyz` oraz status RPC.
- `test:docker:update-migration` to ścieżka opublikowanej aktualizacji z naciskiem na porządkowanie. Zaczyna od skonfigurowanego stanu użytkownika w stylu Discord/Telegram, uruchamia bazowy doctor, aby skonfigurowane zależności Pluginów miały szansę się zmaterializować, zasiewa legacy pozostałości zależności Pluginu dla skonfigurowanego spakowanego Pluginu, aktualizuje do tarballa kandydata i wymaga, aby doctor po aktualizacji usunął legacy katalogi główne zależności.

Przydatne warianty published-upgrade survivor:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Dostępne scenariusze to `base`, `feishu-channel`, `bootstrap-persona`, `plugin-deps-cleanup`, `configured-plugin-installs`, `tilde-log-path` i `versioned-runtime-deps`. W uruchomieniach zbiorczych `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` rozwija się do wszystkich scenariuszy ukształtowanych przez zgłoszone problemy, w tym migracji instalacji skonfigurowanych Pluginów.

Pełna migracja aktualizacji jest celowo oddzielona od Full Release CI. Użyj ręcznego workflow `Update Migration`, gdy pytanie release brzmi: „czy każda opublikowana stabilna wersja od 2026.4.23 wzwyż może zaktualizować się do tego kandydata i posprzątać pozostałości zależności Pluginów?”:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance to natywna dla GitHub bramka pakietu. Rozpoznaje jeden pakiet kandydujący do tarballa `package-under-test`, zapisuje wersję i SHA-256, a następnie uruchamia wielokrotnego użytku ścieżki Docker E2E względem dokładnie tego tarballa. Referencja harnessu workflow jest oddzielona od referencji źródła pakietu, więc bieżąca logika testów może walidować starsze zaufane wydania.

Źródła kandydatów:

- `source=npm`: waliduje `openclaw@beta`, `openclaw@latest` albo dokładną opublikowaną wersję.
- `source=ref`: pakuje zaufaną gałąź, tag albo commit z wybranym bieżącym harnessem.
- `source=url`: waliduje tarball HTTPS z wymaganym `package_sha256`.
- `source=artifact`: ponownie używa tarballa przesłanego przez inne uruchomienie Actions.

Full Release Validation domyślnie używa `source=artifact`, zbudowanego z rozpoznanego SHA wydania. Dla dowodu po publikacji przekaż `package_acceptance_package_spec=openclaw@YYYY.M.D`, aby ta sama macierz aktualizacji celowała zamiast tego w wysłany pakiet npm.

Kontrole wydania wywołują Package Acceptance z zestawem pakiet/aktualizacja/Plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Przekazują też:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Dzięki temu migracja pakietu, przełączanie kanału aktualizacji, porządkowanie przestarzałych zależności Pluginów, offline’owe pokrycie Pluginów, zachowanie aktualizacji Pluginów i QA pakietu Telegram pozostają na tym samym rozpoznanym artefakcie.

`all-since-2026.4.23` to próbka aktualizacji Full Release CI: każde stabilne wydanie opublikowane w npm od `2026.4.23` do `latest`. Dla wyczerpującego pokrycia migracji opublikowanych aktualizacji użyj `all-since-2026.4.23` w osobnym workflow Update Migration zamiast Full Release CI. `release-history` pozostaje dostępne do ręcznego szerszego próbkowania, gdy chcesz też kotwicę legacy sprzed tej daty.

Uruchom profil pakietu ręcznie podczas walidowania kandydata przed wydaniem:

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

Użyj `suite_profile=product`, gdy pytanie release obejmuje kanały MCP, porządkowanie cron/subagent, wyszukiwanie webowe OpenAI albo OpenWebUI. Używaj `suite_profile=full` tylko wtedy, gdy potrzebujesz pełnego pokrycia ścieżki wydania Docker.

## Domyślnie dla wydania

Dla kandydatów do wydania domyślny stos dowodowy to:

1. `pnpm check:changed` i `pnpm test:changed` dla regresji na poziomie źródeł.
2. `pnpm release:check` dla integralności artefaktu pakietu.
3. Profil Package Acceptance `package` albo niestandardowe ścieżki pakietowe release-check dla kontraktów instalacji/aktualizacji/Pluginów.
4. Kontrole wydań cross-OS dla instalatora specyficznego dla systemu operacyjnego, onboardingu i zachowania platformy.
5. Zestawy live tylko wtedy, gdy zmieniana powierzchnia dotyka zachowania providera albo usługi hostowanej.

Na maszynach maintainerów szerokie bramki i dowody produktu Docker/pakiet powinny działać w Testbox, chyba że jawnie wykonujesz lokalny dowód.

## Kompatybilność legacy

Łagodność kompatybilności jest wąska i ograniczona czasowo:

- Pakiety do `2026.4.25`, w tym `2026.4.25-beta.*`, mogą tolerować już wysłane luki w metadanych pakietu w Package Acceptance.
- Opublikowany pakiet `2026.4.26` może ostrzegać o plikach znaczników metadanych lokalnego buildu, które już zostały wysłane.
- Późniejsze pakiety muszą spełniać współczesne kontrakty. Te same luki powodują błąd zamiast ostrzeżenia lub pominięcia.

Nie dodawaj nowych migracji startowych dla tych starych kształtów. Dodaj albo rozszerz naprawę doctor, a następnie udowodnij ją przez `upgrade-survivor` albo `published-upgrade-survivor`.

## Dodawanie pokrycia

Gdy zmieniasz zachowanie aktualizacji albo Pluginów, dodaj pokrycie na najniższej warstwie, która może zawieść z właściwego powodu:

- Czysta logika ścieżek albo metadanych: test jednostkowy obok źródła.
- Zachowanie inwentarza pakietu albo spakowanych plików: test `package-dist-inventory` albo sprawdzający tarball.
- Zachowanie instalacji/aktualizacji CLI: asercja albo fixture ścieżki Docker.
- Zachowanie migracji opublikowanego wydania: scenariusz `published-upgrade-survivor`.
- Zachowanie źródła rejestru/pakietu: fixture `test:docker:plugins` albo serwer fixtury ClawHub.
- Zachowanie układu zależności albo porządkowania: asercjami sprawdź zarówno wykonanie runtime, jak i granicę systemu plików. Zależności npm mogą być wyniesione pod zarządzany katalog główny npm, więc testy powinny udowodnić, że katalog główny jest skanowany/czyszczony, zamiast zakładać lokalne dla pakietu drzewo `node_modules`.

Nowe fixtury Docker domyślnie utrzymuj hermetyczne. Używaj lokalnych rejestrów fixtur i fałszywych pakietów, chyba że celem testu jest zachowanie rejestru live.

## Triage awarii

Zacznij od tożsamości artefaktu:

- Podsumowanie Package Acceptance `resolve_package`: źródło, wersja, SHA-256 i nazwa artefaktu.
- Artefakty Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logi ścieżek i polecenia ponownego uruchomienia.
- Podsumowanie upgrade survivor: `.artifacts/upgrade-survivor/summary.json`, w tym wersja bazowa, wersja kandydata, scenariusz, czasy faz i kroki recepty.

Preferuj ponowne uruchomienie dokładnie tej ścieżki, która zawiodła, z tym samym artefaktem pakietu, zamiast ponownego uruchamiania całego parasola wydania.
