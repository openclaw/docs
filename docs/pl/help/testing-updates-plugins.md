---
read_when:
    - Zmiana zachowania aktualizacji OpenClaw, doctor, akceptacji pakietu lub instalacji Plugin
    - Przygotowywanie lub zatwierdzanie kandydata do wydania
    - Debugowanie aktualizacji pakietu, porządkowania zależności Plugin lub regresji instalacji Plugin
sidebarTitle: Update and plugin tests
summary: Jak OpenClaw weryfikuje ścieżki aktualizacji, migracje pakietów i zachowanie instalacji/aktualizacji Plugin
title: 'Testowanie: aktualizacje i Pluginy'
x-i18n:
    generated_at: "2026-05-05T06:18:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19ae526d3daa8a1b67cb2f74225138b3e1fa192c9f956c9dd6d0e407581b9ed9
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

To jest dedykowana lista kontrolna do walidacji aktualizacji i Plugin. Cel jest
prosty: udowodnić, że instalowalny pakiet może aktualizować rzeczywisty stan użytkownika, naprawiać przestarzały
stan legacy przez `doctor`, a także nadal instalować, ładować, aktualizować i odinstalowywać
Plugin z obsługiwanych źródeł.

Szerszą mapę runnera testów znajdziesz w [Testowanie](/pl/help/testing). Klucze dostawców live
i zestawy testów dotykające sieci opisuje [Testowanie live](/pl/help/testing-live).

## Co chronimy

Testy aktualizacji i Plugin chronią te kontrakty:

- Tarball pakietu jest kompletny, ma prawidłowy `dist/postinstall-inventory.json`
  i nie zależy od rozpakowanych plików repozytorium.
- Użytkownik może przejść ze starszego opublikowanego pakietu na pakiet kandydujący
  bez utraty konfiguracji, agentów, sesji, obszarów roboczych, list dozwolonych Plugin ani
  konfiguracji kanałów.
- `openclaw doctor --fix --non-interactive` odpowiada za ścieżki porządkowania i naprawy
  stanu legacy. Start nie powinien rozrastać się o ukryte migracje zgodności dla przestarzałego
  stanu Plugin.
- Instalacje Plugin działają z katalogów lokalnych, repozytoriów git, pakietów npm i ścieżki
  rejestru ClawHub.
- Zależności npm Plugin są instalowane w zarządzanym katalogu głównym npm, skanowane przed
  zaufaniem i usuwane przez npm podczas odinstalowania, aby wyniesione zależności nie
  pozostawały.
- Aktualizacja Plugin jest stabilna, gdy nic się nie zmieniło: rekordy instalacji, rozstrzygnięte
  źródło, układ zainstalowanych zależności i stan włączenia pozostają nienaruszone.

## Lokalny dowód podczas rozwoju

Zacznij wąsko:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Przy zmianach instalacji, odinstalowania, zależności lub inwentarza pakietu Plugin uruchom także
skupione testy pokrywające edytowany styk:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Zanim jakakolwiek linia Docker pakietu użyje tarballa, udowodnij artefakt pakietu:

```bash
pnpm release:check
```

`release:check` uruchamia kontrole dryfu konfiguracji/dokumentacji/API, zapisuje inwentarz dystrybucji
pakietu, uruchamia `npm pack --dry-run`, odrzuca zabronione spakowane pliki, instaluje
tarball w tymczasowym prefiksie, uruchamia postinstall i wykonuje test dymny punktów wejścia
dołączonych kanałów.

## Linie Docker

Linie Docker są dowodem na poziomie produktu. Instalują lub aktualizują rzeczywisty
pakiet w kontenerach Linux i sprawdzają zachowanie przez polecenia CLI,
start Gateway, sondy HTTP, status RPC i stan systemu plików.

Podczas iteracji używaj skupionych linii:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Ważne linie:

- `test:docker:plugins` waliduje test dymny instalacji Plugin, instalacje z folderów lokalnych,
  zachowanie pomijania aktualizacji folderu lokalnego, foldery lokalne z preinstalowanymi
  zależnościami, instalacje pakietów `file:`, instalacje git z wykonaniem CLI, aktualizacje
  ruchomej referencji git, instalacje z rejestru npm z wyniesionymi zależnościami
  przechodnimi, operacje no-op aktualizacji npm, instalacje z lokalnej fixtury ClawHub i operacje no-op
  aktualizacji, zachowanie aktualizacji marketplace oraz włączenie/inspekcję pakietu Claude. Ustaw
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, aby blok ClawHub był hermetyczny/offline.
- `test:docker:plugin-lifecycle-matrix` instaluje pakiet kandydujący w pustym
  kontenerze, przeprowadza Plugin npm przez instalację, inspekcję, wyłączenie, włączenie,
  jawne uaktualnienie, jawne obniżenie wersji i odinstalowanie po usunięciu kodu Plugin.
  Zapisuje metryki RSS i CPU dla każdej fazy.
- `test:docker:plugin-update` waliduje, że niezmieniony zainstalowany Plugin
  nie jest reinstalowany ani nie traci metadanych instalacji podczas `openclaw plugins update`.
- `test:docker:upgrade-survivor` instaluje tarball kandydujący na brudnej
  fixturze starego użytkownika, uruchamia aktualizację pakietu oraz nieinteraktywny doctor, potem uruchamia
  Gateway local loopback i sprawdza zachowanie stanu.
- `test:docker:published-upgrade-survivor` najpierw instaluje opublikowany baseline,
  konfiguruje go przez wbudowaną receptę `openclaw config set`, aktualizuje do
  tarballa kandydującego, uruchamia doctor, sprawdza porządkowanie legacy, uruchamia Gateway i
  sonduje `/healthz`, `/readyz` oraz status RPC.
- `test:docker:update-restart-auth` instaluje pakiet kandydujący, uruchamia
  zarządzany Gateway z uwierzytelnianiem tokenem, usuwa z env wywołującego uwierzytelnianie gateway dla
  `openclaw update --yes --json` i wymaga, aby polecenie aktualizacji kandydata
  zrestartowało Gateway przed standardowymi sondami.
- `test:docker:update-migration` to linia opublikowanej aktualizacji intensywnie porządkująca. Zaczyna
  od skonfigurowanego stanu użytkownika w stylu Discord/Telegram, uruchamia baseline
  doctor, aby skonfigurowane zależności Plugin miały szansę się zmaterializować, zasiewa
  legacy pozostałości zależności Plugin dla skonfigurowanego spakowanego Plugin, aktualizuje do
  tarballa kandydującego i wymaga, aby doctor po aktualizacji usunął legacy
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
`plugin-deps-cleanup`, `configured-plugin-installs`,
`stale-source-plugin-shadow`, `tilde-log-path` i `versioned-runtime-deps`. W przebiegach zagregowanych
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` rozwija się do wszystkich scenariuszy
w kształcie zgłoszonych problemów, w tym migracji instalacji skonfigurowanego Plugin.

Pełna migracja aktualizacji jest celowo oddzielona od Full Release CI. Użyj
ręcznego workflow `Update Migration`, gdy pytanie wydania brzmi: „czy każde
opublikowane wydanie stabilne od 2026.4.23 wzwyż może zaktualizować się do tego kandydata i
posprzątać pozostałości zależności Plugin?”:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance to natywna dla GitHub bramka pakietu. Rozwiązuje jeden pakiet kandydujący
do tarballa `package-under-test`, zapisuje wersję i SHA-256, a następnie
uruchamia wielokrotnego użytku linie Docker E2E wobec dokładnie tego tarballa. Ref harnessa workflow
jest oddzielny od refa źródła pakietu, więc bieżąca logika testów może walidować
starsze zaufane wydania.

Źródła kandydata:

- `source=npm`: waliduje `openclaw@beta`, `openclaw@latest` lub dokładną
  opublikowaną wersję.
- `source=ref`: pakuje zaufaną gałąź, tag lub commit z wybranym bieżącym
  harnessem.
- `source=url`: waliduje tarball HTTPS z wymaganym `package_sha256`.
- `source=artifact`: używa ponownie tarballa przesłanego przez inny przebieg Actions.

Full Release Validation domyślnie używa `source=artifact`, zbudowanego z
rozwiązanego SHA wydania. Dla dowodu po publikacji przekaż
`package_acceptance_package_spec=openclaw@YYYY.M.D`, aby ta sama macierz aktualizacji
celowała zamiast tego w wysłany pakiet npm.

Kontrole wydania wywołują Package Acceptance z zestawem package/update/restart/plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Gdy włączony jest soak wydania, przekazują też:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

To utrzymuje migrację pakietu, przełączanie kanału aktualizacji, porządkowanie przestarzałych zależności Plugin,
pokrycie Plugin offline, zachowanie aktualizacji Plugin i QA pakietu Telegram
na tym samym rozwiązanym artefakcie, bez zmuszania domyślnej bramki pakietu wydania
do przechodzenia przez każde opublikowane wydanie.

`last-stable-4` rozwiązuje się do czterech najnowszych stabilnych wydań OpenClaw
opublikowanych w npm. Release package acceptance przypina `2026.4.23` jako pierwszą granicę zgodności
aktualizacji Plugin, `2026.5.2` jako granicę zmian architektury Plugin i
`2026.4.15` jako starszy baseline opublikowanej aktualizacji z serii 2026.4.1x; resolver
deduplikuje piny, które są już w najnowszej czwórce. Dla wyczerpującego pokrycia migracji
opublikowanych aktualizacji użyj `all-since-2026.4.23` w oddzielnym workflow Update
Migration zamiast Full Release CI. `release-history` pozostaje
dostępne do ręcznego szerszego próbkowania, gdy chcesz także mieć legacy kotwicę sprzed tej daty.

Gdy wybrano wiele baseline’ów published-upgrade survivor, wielokrotnego użytku
workflow Docker sharduje każdy baseline do osobnego ukierunkowanego zadania runnera. Każdy
shard baseline nadal uruchamia wybrany zestaw scenariuszy, ale logi i artefakty pozostają
per baseline, a czas zegarowy jest ograniczony przez najwolniejszy shard zamiast jednego dużego
zadania szeregowego.

Uruchom profil pakietu ręcznie podczas walidowania kandydata przed wydaniem:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines="last-stable-4 2026.4.23 2026.5.2 2026.4.15" \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Użyj `suite_profile=product`, gdy pytanie wydania obejmuje kanały MCP,
porządkowanie cron/subagent, wyszukiwanie webowe OpenAI lub OpenWebUI. Używaj `suite_profile=full`
tylko wtedy, gdy potrzebujesz pełnego pokrycia ścieżki wydania Docker.

## Domyślne ustawienie wydania

Dla kandydatów do wydania domyślny stos dowodów to:

1. `pnpm check:changed` i `pnpm test:changed` dla regresji na poziomie źródeł.
2. `pnpm release:check` dla integralności artefaktu pakietu.
3. Profil Package Acceptance `package` albo niestandardowe linie pakietu
   release-check dla kontraktów install/update/restart/plugin.
4. Kontrole wydania Cross-OS dla zachowań instalatora, onboardingu i platformy
   specyficznych dla systemu operacyjnego.
5. Zestawy live tylko wtedy, gdy zmieniona powierzchnia dotyka zachowania dostawcy lub usługi hostowanej.

Na maszynach maintainerów szerokie bramki i dowód produktu Docker/pakiet powinny działać
w Testbox, chyba że jawnie wykonywany jest dowód lokalny.

## Zgodność legacy

Pobłażliwość zgodności jest wąska i ograniczona czasowo:

- Pakiety do `2026.4.25`, w tym `2026.4.25-beta.*`, mogą tolerować
  już wysłane luki w metadanych pakietu w Package Acceptance.
- Opublikowany pakiet `2026.4.26` może ostrzegać o już wysłanych lokalnych plikach znaczników
  metadanych kompilacji.
- Późniejsze pakiety muszą spełniać współczesne kontrakty. Te same luki powodują błąd zamiast
  ostrzeżenia lub pominięcia.

Nie dodawaj nowych migracji startowych dla tych starych kształtów. Dodaj lub rozszerz naprawę
doctor, a następnie udowodnij ją przez `upgrade-survivor`, `published-upgrade-survivor` lub
`update-restart-auth`, gdy polecenie aktualizacji odpowiada za restart.

## Dodawanie pokrycia

Gdy zmieniasz zachowanie aktualizacji lub Plugin, dodaj pokrycie na najniższej warstwie, która
może zawieść z właściwego powodu:

- Czysta logika ścieżek lub metadanych: test jednostkowy obok źródła.
- Zachowanie inwentarza pakietu lub spakowanych plików: `package-dist-inventory` albo test
  sprawdzacza tarballa.
- Zachowanie instalacji/aktualizacji CLI: asercja albo fixtura linii Docker.
- Zachowanie migracji opublikowanego wydania: scenariusz `published-upgrade-survivor`.
- Zachowanie restartu należącego do aktualizacji: `update-restart-auth`.
- Zachowanie źródła rejestru/pakietu: fixtura `test:docker:plugins` albo serwer fixtury ClawHub.
- Zachowanie układu zależności lub porządkowania: asercja zarówno wykonania runtime, jak i
  granicy systemu plików. Zależności npm mogą być wyniesione pod zarządzany katalog główny npm,
  więc testy powinny udowadniać, że katalog główny jest skanowany/czyszczony, zamiast zakładać
  lokalne dla pakietu drzewo `node_modules`.

Domyślnie utrzymuj nowe fixtury Docker jako hermetyczne. Używaj lokalnych rejestrów fixtur i
fałszywych pakietów, chyba że celem testu jest zachowanie rejestru live.

## Triage awarii

Zacznij od tożsamości artefaktu:

- Podsumowanie Package Acceptance `resolve_package`: źródło, wersja, SHA-256 oraz
  nazwa artefaktu.
- Artefakty Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, logi ścieżek oraz polecenia ponownego uruchomienia.
- Podsumowanie przetrwania aktualizacji: `.artifacts/upgrade-survivor/summary.json`,
  w tym wersja bazowa, wersja kandydująca, scenariusz, czasy faz oraz
  kroki receptury.

Preferuj ponowne uruchomienie dokładnie tej ścieżki, która się nie powiodła, z tym samym artefaktem pakietu, zamiast
ponownego uruchamiania całej nadrzędnej procedury wydania.
