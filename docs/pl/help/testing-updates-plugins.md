---
read_when:
    - Zmiana zachowania aktualizacji OpenClaw, diagnostyki, akceptacji pakietu lub instalacji pluginu
    - Przygotowywanie lub zatwierdzanie kandydata do wydania
    - Debugowanie aktualizacji pakietu, porządkowania zależności Plugin lub regresji instalacji Plugin
sidebarTitle: Update and plugin tests
summary: Jak OpenClaw weryfikuje ścieżki aktualizacji, migracje pakietów oraz zachowanie instalacji/aktualizacji Plugin
title: 'Testowanie: aktualizacje i pluginy'
x-i18n:
    generated_at: "2026-05-02T09:53:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1999106b52d2539a6ee0fd7cd88ebb3515c8726e080d4031d7bf421fb99de36
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

To jest dedykowana lista kontrolna dla walidacji aktualizacji i pluginów. Cel jest prosty: udowodnić, że instalowalny pakiet potrafi aktualizować rzeczywisty stan użytkownika, naprawiać przestarzały stan legacy przez `doctor` oraz nadal instalować, ładować, aktualizować i odinstalowywać pluginy z obsługiwanych źródeł.

Szerszą mapę runnera testów znajdziesz w [Testowanie](/pl/help/testing). Klucze providerów live i zestawy dotykające sieci opisuje [Testowanie live](/pl/help/testing-live).

## Co chronimy

Testy aktualizacji i pluginów chronią te kontrakty:

- Tarball pakietu jest kompletny, ma prawidłowy `dist/postinstall-inventory.json` i nie zależy od nierozpakowanych plików repozytorium.
- Użytkownik może przejść ze starszego opublikowanego pakietu na pakiet kandydujący bez utraty konfiguracji, agentów, sesji, przestrzeni roboczych, list dozwolonych pluginów ani konfiguracji kanałów.
- `openclaw doctor --fix --non-interactive` jest właścicielem ścieżek czyszczenia i naprawy legacy. Startup nie powinien rozrastać się o ukryte migracje zgodności dla przestarzałego stanu pluginów.
- Instalacje pluginów działają z katalogów lokalnych, repozytoriów git, pakietów npm i ścieżki rejestru ClawHub.
- Zależności npm pluginów są instalowane w zarządzanym katalogu głównym npm, skanowane przed zaufaniem i usuwane przez npm podczas odinstalowania, aby zależności wyniesione wyżej nie pozostawały.
- Aktualizacja pluginów jest stabilna, gdy nic się nie zmieniło: rekordy instalacji, rozwiązane źródło, układ zainstalowanych zależności i stan włączenia pozostają nienaruszone.

## Lokalny dowód podczas developmentu

Zacznij wąsko:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Dla zmian instalacji, odinstalowania, zależności lub inventory pakietu pluginów uruchom też skoncentrowane testy obejmujące edytowaną granicę:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Zanim jakikolwiek Docker lane pakietu zużyje tarball, udowodnij artefakt pakietu:

```bash
pnpm release:check
```

`release:check` uruchamia kontrole dryfu konfiguracji, dokumentacji i API, zapisuje inventory dystrybucji pakietu, uruchamia `npm pack --dry-run`, odrzuca zakazane spakowane pliki, instaluje tarball do tymczasowego prefiksu, uruchamia postinstall i wykonuje smoke testy entrypointów dołączonych kanałów.

## Docker lanes

Docker lanes są dowodem na poziomie produktu. Instalują lub aktualizują rzeczywisty pakiet wewnątrz kontenerów Linux i asertują zachowanie przez polecenia CLI, startup Gateway, sondy HTTP, status RPC i stan systemu plików.

Podczas iteracji używaj skoncentrowanych lanes:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Ważne lanes:

- `test:docker:plugins` waliduje smoke instalacji pluginów, instalacje z folderów lokalnych, zachowanie pomijania aktualizacji folderów lokalnych, foldery lokalne z preinstalowanymi zależnościami, instalacje pakietów `file:`, instalacje git z wykonaniem CLI, aktualizacje ruchomych refów git, instalacje z rejestru npm z wyniesionymi zależnościami przechodnimi, no-op aktualizacji npm, instalacje z lokalnego fixture ClawHub i no-op aktualizacji, zachowanie aktualizacji marketplace oraz włączanie/inspekcję pakietu Claude. Ustaw `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, aby blok ClawHub był hermetyczny/offline.
- `test:docker:plugin-update` waliduje, że niezmieniony zainstalowany plugin nie jest reinstalowany ani nie traci metadanych instalacji podczas `openclaw plugins update`.
- `test:docker:upgrade-survivor` instaluje tarball kandydujący na brudnym fixture starego użytkownika, uruchamia aktualizację pakietu oraz nieinteraktywny doctor, a następnie startuje loopback Gateway i sprawdza zachowanie stanu.
- `test:docker:published-upgrade-survivor` najpierw instaluje opublikowaną bazę, konfiguruje ją przez wbudowaną receptę `openclaw config set`, aktualizuje do tarballa kandydującego, uruchamia doctor, sprawdza czyszczenie legacy, startuje Gateway oraz sonduje `/healthz`, `/readyz` i status RPC.
- `test:docker:update-migration` to lane opublikowanej aktualizacji mocno skoncentrowany na czyszczeniu. Zaczyna od skonfigurowanego stanu użytkownika w stylu Discord/Telegram, uruchamia bazowy doctor, aby skonfigurowane zależności pluginów miały szansę się zmaterializować, seeduje legacy debris zależności pluginów dla skonfigurowanego spakowanego pluginu, aktualizuje do tarballa kandydującego i wymaga, aby post-update doctor usunął katalogi główne legacy zależności.

Przydatne warianty published-upgrade survivor:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Dostępne scenariusze to `base`, `feishu-channel`, `bootstrap-persona`, `plugin-deps-cleanup`, `tilde-log-path` i `versioned-runtime-deps`. W uruchomieniach zbiorczych `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` rozwija się do wszystkich zgłoszonych scenariuszy w kształcie issue.

Pełna migracja aktualizacji jest celowo oddzielona od Full Release CI. Użyj ręcznego workflow `Update Migration`, gdy pytanie release brzmi: „czy każda opublikowana stabilna wersja od 2026.4.23 wzwyż potrafi zaktualizować się do tego kandydata i wyczyścić debris zależności pluginów?”:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance to natywna dla GitHuba bramka pakietu. Rozwiązuje jeden pakiet kandydujący do tarballa `package-under-test`, zapisuje wersję i SHA-256, a następnie uruchamia wielokrotnego użytku Docker E2E lanes przeciwko temu dokładnemu tarballowi. Ref harnessa workflow jest oddzielony od refa źródła pakietu, więc bieżąca logika testów może walidować starsze zaufane wydania.

Źródła kandydatów:

- `source=npm`: waliduj `openclaw@beta`, `openclaw@latest` lub dokładną opublikowaną wersję.
- `source=ref`: spakuj zaufaną gałąź, tag lub commit wybranym bieżącym harnessem.
- `source=url`: waliduj tarball HTTPS z wymaganym `package_sha256`.
- `source=artifact`: użyj ponownie tarballa przesłanego przez inne uruchomienie Actions.

Kontrole release wywołują Package Acceptance z zestawem pakiet/aktualizacja/plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Przekazują też:

```text
published_upgrade_survivor_baselines=release-history
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Dzięki temu migracja pakietu, przełączanie kanału aktualizacji, czyszczenie przestarzałych zależności pluginów, pokrycie pluginów offline, zachowanie aktualizacji pluginów i QA pakietu Telegram działają na tym samym rozwiązanym artefakcie.

`release-history` to ograniczona próbka kontroli release: ostatnie sześć stabilnych wydań, `2026.4.23` i jeden starszy punkt zakotwiczenia sprzed tej daty. Dla wyczerpującego pokrycia migracji opublikowanych aktualizacji użyj `all-since-2026.4.23` w oddzielnym workflow Update Migration zamiast Full Release CI.

Uruchom profil pakietu ręcznie podczas walidacji kandydata przed releasem:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=release-history \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Użyj `suite_profile=product`, gdy pytanie release obejmuje kanały MCP, czyszczenie cron/subagent, web search OpenAI lub OpenWebUI. Użyj `suite_profile=full` tylko wtedy, gdy potrzebujesz pełnego pokrycia Docker dla ścieżki release.

## Domyślne ustawienie release

Dla kandydatów release domyślny stos dowodów to:

1. `pnpm check:changed` i `pnpm test:changed` dla regresji na poziomie źródeł.
2. `pnpm release:check` dla integralności artefaktu pakietu.
3. Profil Package Acceptance `package` lub niestandardowe lanes pakietu kontroli release dla kontraktów instalacji/aktualizacji/pluginów.
4. Kontrole release między systemami operacyjnymi dla zachowań specyficznych dla instalatora, onboardingu i platformy.
5. Zestawy live tylko wtedy, gdy zmieniana powierzchnia dotyka zachowania providera lub usługi hostowanej.

Na maszynach maintainerów szerokie bramki oraz dowód produktu Docker/pakiet powinny działać w Testbox, chyba że jawnie wykonujesz lokalny dowód.

## Zgodność legacy

Łagodność zgodności jest wąska i ograniczona czasowo:

- Pakiety do `2026.4.25` włącznie, w tym `2026.4.25-beta.*`, mogą tolerować już wysłane luki metadanych pakietu w Package Acceptance.
- Opublikowany pakiet `2026.4.26` może ostrzegać o plikach stempla metadanych lokalnego buildu, które zostały już wysłane.
- Późniejsze pakiety muszą spełniać nowoczesne kontrakty. Te same luki kończą się niepowodzeniem zamiast ostrzeżenia lub pominięcia.

Nie dodawaj nowych migracji startupu dla tych starych kształtów. Dodaj lub rozszerz naprawę doctor, a następnie udowodnij ją przez `upgrade-survivor` albo `published-upgrade-survivor`.

## Dodawanie pokrycia

Przy zmianie zachowania aktualizacji lub pluginów dodaj pokrycie na najniższej warstwie, która może zawieść z właściwego powodu:

- Czysta logika ścieżek lub metadanych: test jednostkowy obok źródła.
- Inventory pakietu lub zachowanie spakowanych plików: test `package-dist-inventory` albo checker tarballa.
- Zachowanie instalacji/aktualizacji CLI: asercja lub fixture Docker lane.
- Zachowanie migracji opublikowanego release: scenariusz `published-upgrade-survivor`.
- Zachowanie źródła rejestru/pakietu: fixture `test:docker:plugins` albo serwer fixture ClawHub.
- Zachowanie układu zależności lub czyszczenia: asertuj zarówno wykonanie runtime, jak i granicę systemu plików. Zależności npm mogą być wyniesione pod zarządzany katalog główny npm, więc testy powinny udowodnić, że katalog główny jest skanowany/czyszczony, zamiast zakładać lokalne dla pakietu drzewo `node_modules`.

Nowe fixture Docker domyślnie utrzymuj hermetyczne. Używaj lokalnych rejestrów fixture i fałszywych pakietów, chyba że celem testu jest zachowanie rejestru live.

## Triage awarii

Zacznij od tożsamości artefaktu:

- Podsumowanie Package Acceptance `resolve_package`: źródło, wersja, SHA-256 i nazwa artefaktu.
- Artefakty Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logi lane i polecenia ponownego uruchomienia.
- Podsumowanie upgrade survivor: `.artifacts/upgrade-survivor/summary.json`, w tym wersja bazowa, wersja kandydująca, scenariusz, czasy faz i kroki recepty.

Preferuj ponowne uruchomienie dokładnego lane, który zawiódł, z tym samym artefaktem pakietu zamiast ponownego uruchamiania całego parasola release.
