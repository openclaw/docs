---
read_when:
    - Zmienianie zachowania aktualizacji OpenClaw, doctor, akceptacji pakietów lub instalacji pluginów
    - Przygotowywanie lub zatwierdzanie kandydata do wydania
    - Debugowanie aktualizacji pakietu, porządkowania zależności Plugin lub regresji instalacji Plugin
sidebarTitle: Update and plugin tests
summary: Jak OpenClaw waliduje ścieżki aktualizacji, migracje pakietów oraz zachowanie instalacji/aktualizacji pluginów
title: 'Testowanie: aktualizacje i pluginy'
x-i18n:
    generated_at: "2026-06-27T17:40:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be94eab4be97c53022bdac3110da74a61cfa23db989964c803497305e5415db
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

To jest dedykowana lista kontrolna do walidacji aktualizacji i Plugin. Cel jest
prosty: udowodnić, że instalowalny pakiet potrafi zaktualizować rzeczywisty stan
użytkownika, naprawić przestarzały stan legacy przez `doctor` oraz nadal
instalować, ładować, aktualizować i odinstalowywać Plugin z obsługiwanych źródeł.

Szerszą mapę runnera testów znajdziesz w [Testowanie](/pl/help/testing). Klucze
providerów live i zestawy dotykające sieci opisuje [Testowanie live](/pl/help/testing-live).

## Co chronimy

Testy aktualizacji i Plugin chronią te kontrakty:

- Tarball pakietu jest kompletny, ma poprawny `dist/postinstall-inventory.json`
  i nie zależy od nierozpakowanych plików repozytorium.
- Użytkownik może przejść ze starszego opublikowanego pakietu na pakiet
  kandydujący bez utraty konfiguracji, agentów, sesji, przestrzeni roboczych,
  list dozwolonych Plugin ani konfiguracji kanałów.
- `openclaw doctor --fix --non-interactive` odpowiada za ścieżki czyszczenia i
  naprawy legacy. Uruchamianie nie powinno rozrastać się o ukryte migracje
  zgodności dla przestarzałego stanu Plugin.
- Instalacje Plugin działają z lokalnych katalogów, repozytoriów git, pakietów
  npm oraz ścieżki rejestru ClawHub.
- Zależności npm Plugin są instalowane w jednym zarządzanym projekcie npm na
  Plugin, skanowane przed zaufaniem i usuwane przez npm podczas odinstalowania,
  aby wyniesione zależności nie pozostawały.
- Aktualizacja Plugin jest stabilna, gdy nic się nie zmieniło: rekordy
  instalacji, rozwiązane źródło, układ zainstalowanych zależności i stan
  włączenia pozostają nienaruszone.

## Lokalny dowód podczas rozwoju

Zacznij wąsko:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Dla zmian instalacji, odinstalowania, zależności lub inwentarza pakietu Plugin
uruchom także ukierunkowane testy pokrywające edytowaną granicę:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Zanim jakakolwiek ścieżka Docker pakietu użyje tarballa, udowodnij artefakt
pakietu:

```bash
pnpm release:check
```

`release:check` uruchamia kontrole dryfu konfiguracji/dokumentacji/API, zapisuje
inwentarz dystrybucji pakietu, uruchamia `npm pack --dry-run`, odrzuca zakazane
spakowane pliki, instaluje tarball w tymczasowym prefiksie, uruchamia
postinstall i wykonuje smoke testy punktów wejścia dołączonych kanałów.

## Ścieżki Docker

Ścieżki Docker są dowodem na poziomie produktu. Instalują lub aktualizują
rzeczywisty pakiet wewnątrz kontenerów Linux i sprawdzają zachowanie przez
polecenia CLI, uruchomienie Gateway, sondy HTTP, status RPC i stan systemu
plików.

Używaj ukierunkowanych ścieżek podczas iteracji:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Ważne ścieżki:

- `test:docker:plugins` waliduje smoke test instalacji Plugin, instalacje z
  lokalnego folderu, pomijanie aktualizacji lokalnego folderu, lokalne foldery z
  preinstalowanymi zależnościami, instalacje pakietów `file:`, instalacje git z
  wykonaniem CLI, aktualizacje ruchomych refów git, instalacje z rejestru npm z
  wyniesionymi zależnościami przechodnimi, aktualizacje npm bez zmian,
  odrzucanie błędnych metadanych pakietu npm, instalacje lokalnego fixture
  ClawHub i aktualizacje bez zmian, zachowanie aktualizacji marketplace oraz
  włączenie/inspekcję pakietu Claude. Ustaw `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`,
  aby blok ClawHub pozostał hermetyczny/offline.
- `test:docker:plugin-lifecycle-matrix` instaluje pakiet kandydujący w pustym
  kontenerze, przeprowadza Plugin npm przez instalację, inspekcję, wyłączenie,
  włączenie, jawny upgrade, jawny downgrade i odinstalowanie po usunięciu kodu
  Plugin. Dla każdej fazy zapisuje metryki RSS i CPU.
- `test:docker:plugin-update` waliduje, że niezmieniony zainstalowany Plugin nie
  zostaje ponownie zainstalowany ani nie traci metadanych instalacji podczas
  `openclaw plugins update`.
- `test:docker:upgrade-survivor` instaluje tarball kandydujący na zabrudzonym
  fixture starego użytkownika, uruchamia aktualizację pakietu oraz
  nieinteraktywnego doctor, a następnie startuje Gateway loopback i sprawdza
  zachowanie stanu.
- `test:docker:published-upgrade-survivor` najpierw instaluje opublikowaną bazę,
  konfiguruje ją przez wbudowaną receptę `openclaw config set`, aktualizuje do
  tarballa kandydującego, uruchamia doctor, sprawdza czyszczenie legacy, startuje
  Gateway i sonduje `/healthz`, `/readyz` oraz status RPC.
- `test:docker:update-restart-auth` instaluje pakiet kandydujący, startuje
  zarządzany Gateway z uwierzytelnianiem tokenem, usuwa zmienne środowiskowe
  uwierzytelniania Gateway wywołującego dla `openclaw update --yes --json` i
  wymaga, aby polecenie aktualizacji kandydata zrestartowało Gateway przed
  standardowymi sondami.
- `test:docker:update-migration` to obciążona czyszczeniem ścieżka aktualizacji z
  opublikowanego pakietu. Startuje ze skonfigurowanego stanu użytkownika w stylu
  Discord/Telegram, uruchamia bazowy doctor, aby skonfigurowane zależności
  Plugin miały szansę się zmaterializować, zasiewa legacy pozostałości zależności
  Plugin dla skonfigurowanego spakowanego Plugin, aktualizuje do tarballa
  kandydującego i wymaga, aby doctor po aktualizacji usunął legacy katalogi
  zależności.

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
`stale-source-plugin-shadow`, `tilde-log-path` i `versioned-runtime-deps`. W
uruchomieniach zbiorczych `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`
rozwija się do wszystkich scenariuszy w kształcie zgłoszonych issue, w tym
migracji instalacji skonfigurowanego Plugin.

Pełna migracja aktualizacji jest celowo oddzielona od Full Release CI. Użyj
ręcznego workflow `Update Migration`, gdy pytanie release brzmi: „czy każde
opublikowane stabilne wydanie od 2026.4.23 wzwyż może zaktualizować się do tego
kandydata i posprzątać pozostałości zależności Plugin?”:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance to natywna dla GitHub bramka pakietu. Rozwiązuje jeden pakiet
kandydujący do tarballa `package-under-test`, zapisuje wersję i SHA-256, a
następnie uruchamia wielokrotnego użytku ścieżki Docker E2E względem dokładnie
tego tarballa. Ref harnessa workflow jest oddzielony od refa źródła pakietu,
dzięki czemu aktualna logika testowa może walidować starsze zaufane wydania.

Źródła kandydatów:

- `source=npm`: waliduj `openclaw@beta`, `openclaw@latest` lub dokładną
  opublikowaną wersję.
- `source=ref`: spakuj zaufaną gałąź, tag lub commit przy użyciu wybranego
  bieżącego harnessa.
- `source=url`: waliduj publiczny tarball HTTPS z wymaganym `package_sha256`.
  Ta ścieżka odrzuca poświadczenia URL, niedomyślne porty HTTPS,
  prywatne/wewnętrzne nazwy hostów albo wyniki DNS/IP, przestrzeń IP specjalnego
  przeznaczenia i niebezpieczne przekierowania.
- `source=trusted-url`: waliduj tarball HTTPS z wymaganymi `package_sha256` i
  `trusted_source_id` względem polityki utrzymywanej przez maintainerów w
  `.github/package-trusted-sources.json`. Używaj tego dla
  enterprise/prywatnych mirrorów zamiast osłabiać `source=url` przełącznikiem
  allow-private na poziomie wejścia. Uwierzytelnianie bearer, gdy jest
  skonfigurowane przez politykę, używa stałego sekretu
  `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.
- `source=artifact`: użyj ponownie tarballa przesłanego przez inne uruchomienie
  Actions.

Full Release Validation domyślnie używa `source=artifact`, zbudowanego z
rozwiązanego SHA wydania. Dla dowodu po publikacji przekaż
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH`, aby ta sama macierz
upgrade celowała w wysłany pakiet npm.

Kontrole release wywołują Package Acceptance z zestawem package/update/restart/plugin:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Gdy włączony jest release soak, przekazują też:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Dzięki temu migracja pakietu, przełączanie kanału aktualizacji, tolerancja
uszkodzonego zarządzanego Plugin, czyszczenie przestarzałych zależności Plugin,
pokrycie Plugin offline, zachowanie aktualizacji Plugin i QA pakietu Telegram są
na tym samym rozwiązanym artefakcie bez zmuszania domyślnej bramki pakietu
release do przechodzenia przez każde opublikowane wydanie.

`last-stable-4` rozwiązuje się do czterech najnowszych stabilnych wydań OpenClaw
opublikowanych w npm. Release package acceptance przypina `2026.4.23` jako
pierwszą granicę zgodności aktualizacji Plugin, `2026.5.2` jako granicę zmian
architektury Plugin oraz `2026.4.15` jako starszą bazę aktualizacji z
opublikowanego wydania 2026.4.1x; resolver deduplikuje przypięcia, które już są
w najnowszej czwórce. Dla wyczerpującego pokrycia migracji aktualizacji z
opublikowanych wydań użyj `all-since-2026.4.23` w oddzielnym workflow Update
Migration zamiast Full Release CI. `release-history` pozostaje dostępne do
ręcznego szerszego próbkowania, gdy chcesz też mieć starszy punkt odniesienia
sprzed daty granicznej.

Gdy wybrano wiele baz published-upgrade survivor, wielokrotnego użytku workflow
Docker dzieli każdą bazę na własne ukierunkowane zadanie runnera. Każdy shard
bazy nadal uruchamia wybrany zestaw scenariuszy, ale logi i artefakty pozostają
osobne dla każdej bazy, a czas ścienny jest ograniczony przez najwolniejszy shard
zamiast jednego dużego zadania sekwencyjnego.

Uruchom profil pakietu ręcznie podczas walidowania kandydata przed release:

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

Użyj `suite_profile=product`, gdy pytanie release obejmuje kanały MCP,
czyszczenie cron/subagent, wyszukiwanie web OpenAI lub OpenWebUI. Używaj
`suite_profile=full` tylko wtedy, gdy potrzebujesz pełnego pokrycia ścieżki
release w Docker.

## Domyślne ustawienie release

Dla kandydatów release domyślny stos dowodowy to:

1. `pnpm check:changed` i `pnpm test:changed` dla regresji na poziomie źródeł.
2. `pnpm release:check` dla integralności artefaktu pakietu.
3. Profil Package Acceptance `package` albo niestandardowe ścieżki pakietowe
   release-check dla kontraktów instalacji/aktualizacji/restartu/Plugin.
4. Kontrole release między systemami operacyjnymi dla instalatora, onboardingu i
   zachowania platformy specyficznego dla OS.
5. Zestawy live tylko wtedy, gdy zmieniona powierzchnia dotyka zachowania
   providera lub hostowanej usługi.

Na maszynach maintainerów szerokie bramki i dowód produktu Docker/pakiet powinny
działać w Testbox, chyba że wyraźnie wykonywany jest lokalny dowód.

## Zgodność legacy

Pobłażliwość zgodności jest wąska i ograniczona w czasie:

- Pakiety do `2026.4.25`, w tym `2026.4.25-beta.*`, mogą tolerować już wysłane
  luki metadanych pakietu w Package Acceptance.
- Opublikowany pakiet `2026.4.26` może ostrzegać o lokalnych plikach znaczników
  metadanych builda już wysłanych.
- Późniejsze pakiety muszą spełniać współczesne kontrakty. Te same luki kończą
  się niepowodzeniem zamiast ostrzeżeniem lub pominięciem.

Nie dodawaj nowych migracji startowych dla tych starych kształtów. Dodaj albo
rozszerz naprawę doctor, a następnie udowodnij ją przez `upgrade-survivor`,
`published-upgrade-survivor` lub `update-restart-auth`, gdy polecenie
aktualizacji odpowiada za restart.

## Dodawanie pokrycia

Gdy zmieniasz zachowanie aktualizacji lub Plugin, dodaj pokrycie na najniższej
warstwie, która może zawieść z właściwego powodu:

- Czysta logika ścieżek lub metadanych: test jednostkowy obok źródła.
- Zachowanie inwentarza pakietu lub spakowanych plików: test `package-dist-inventory` albo
  test sprawdzający tarball.
- Zachowanie instalacji/aktualizacji CLI: asercja w ścieżce Docker albo fixture.
- Zachowanie migracji opublikowanego wydania: scenariusz `published-upgrade-survivor`.
- Zachowanie restartu należącego do aktualizacji: `update-restart-auth`.
- Zachowanie źródła rejestru/pakietu: fixture `test:docker:plugins` albo serwer
  fixture ClawHub.
- Zachowanie układu zależności lub czyszczenia: asercja zarówno dla wykonania w runtime, jak i
  granicy systemu plików. Zależności npm mogą być hoistowane wewnątrz zarządzanego
  projektu npm pluginu, więc testy powinny dowodzić, że ten projekt jest skanowany/czyszczony,
  zamiast zakładać wyłącznie drzewo `node_modules` lokalne dla pakietu pluginu.

Nowe fixture Docker domyślnie utrzymuj hermetyczne. Używaj lokalnych rejestrów fixture i
fałszywych pakietów, chyba że celem testu jest zachowanie rejestru na żywo.

## Triage awarii

Zacznij od tożsamości artefaktu:

- Podsumowanie Package Acceptance `resolve_package`: źródło, wersja, SHA-256 oraz
  nazwa artefaktu.
- Artefakty Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, logi ścieżek i polecenia ponownego uruchomienia.
- Podsumowanie upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  w tym wersja bazowa, wersja kandydująca, scenariusz, czasy faz oraz
  kroki receptury.

Preferuj ponowne uruchomienie dokładnie tej samej nieudanej ścieżki z tym samym artefaktem pakietu zamiast
ponownego uruchamiania całego parasola wydania.
