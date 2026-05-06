---
read_when:
    - Zmiana zachowania aktualizacji OpenClaw, doctor, akceptacji pakietów lub instalacji Plugin
    - Przygotowywanie lub zatwierdzanie kandydata do wydania
    - Debugowanie aktualizacji pakietu, czyszczenia zależności Plugin lub regresji instalacji Plugin
sidebarTitle: Update and plugin tests
summary: Jak OpenClaw waliduje ścieżki aktualizacji, migracje pakietów oraz zachowanie podczas instalacji i aktualizacji Plugin
title: 'Testowanie: aktualizacje i Pluginy'
x-i18n:
    generated_at: "2026-05-06T09:16:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: db3790bb8c6b952458342727f3e326f9610b4d8155889dfdadb143e3ef07aa46
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

To jest dedykowana lista kontrolna do walidacji aktualizacji i Plugin. Cel jest
prosty: udowodnić, że instalowalny pakiet może aktualizować rzeczywisty stan
użytkownika, naprawiać przestarzały stan legacy przez `doctor` i nadal instalować,
ładować, aktualizować oraz odinstalowywać Plugin z obsługiwanych źródeł.

Szerszą mapę uruchamiania testów znajdziesz w [Testowanie](/pl/help/testing). Klucze
providerów live i zestawy dotykające sieci opisuje [Testowanie live](/pl/help/testing-live).

## Co chronimy

Testy aktualizacji i Plugin chronią te kontrakty:

- Tarball pakietu jest kompletny, ma poprawny `dist/postinstall-inventory.json`
  i nie zależy od nierozpakowanych plików repozytorium.
- Użytkownik może przejść ze starszego opublikowanego pakietu na pakiet kandydujący
  bez utraty konfiguracji, agentów, sesji, przestrzeni roboczych, list dozwolonych
  Plugin ani konfiguracji kanałów.
- `openclaw doctor --fix --non-interactive` odpowiada za ścieżki czyszczenia i
  naprawy legacy. Start nie powinien rozrastać ukrytych migracji zgodności dla
  przestarzałego stanu Plugin.
- Instalacje Plugin działają z katalogów lokalnych, repozytoriów git, pakietów npm
  i ścieżki rejestru ClawHub.
- Zależności npm Plugin są instalowane w zarządzanym katalogu głównym npm,
  skanowane przed zaufaniem i usuwane przez npm podczas odinstalowania, żeby
  wyniesione zależności nie pozostawały.
- Aktualizacja Plugin jest stabilna, gdy nic się nie zmieniło: rekordy instalacji,
  rozwiązane źródło, układ zainstalowanych zależności i stan włączenia pozostają
  nienaruszone.

## Lokalne potwierdzenie podczas developmentu

Zacznij wąsko:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

W przypadku zmian w instalacji, odinstalowaniu, zależnościach lub inwentarzu
pakietu Plugin uruchom także ukierunkowane testy pokrywające edytowany punkt styku:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Zanim jakikolwiek tor Docker dla pakietu użyje tarballa, potwierdź artefakt pakietu:

```bash
pnpm release:check
```

`release:check` uruchamia kontrole dryfu konfiguracji/dokumentacji/API, zapisuje
inwentarz dystrybucji pakietu, uruchamia `npm pack --dry-run`, odrzuca zakazane
spakowane pliki, instaluje tarball do tymczasowego prefiksu, uruchamia postinstall
i wykonuje smoke testy entrypointów dołączonych kanałów.

## Tory Docker

Tory Docker są potwierdzeniem na poziomie produktu. Instalują albo aktualizują
rzeczywisty pakiet w kontenerach Linux i asercjami sprawdzają zachowanie przez
polecenia CLI, start Gateway, sondy HTTP, status RPC i stan systemu plików.

Podczas iteracji używaj ukierunkowanych torów:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Ważne tory:

- `test:docker:plugins` waliduje smoke test instalacji Plugin, instalacje z
  lokalnych folderów, pomijanie aktualizacji lokalnego folderu, lokalne foldery z
  preinstalowanymi zależnościami, instalacje pakietów `file:`, instalacje git z
  wykonaniem CLI, aktualizacje ruchomych referencji git, instalacje z rejestru npm
  z wyniesionymi zależnościami przechodnimi, no-opy aktualizacji npm, instalacje
  lokalnego fixture ClawHub i no-opy aktualizacji, zachowanie aktualizacji
  marketplace oraz włączenie/inspekcję pakietu Claude. Ustaw
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, aby blok ClawHub pozostał hermetyczny/offline.
- `test:docker:plugin-lifecycle-matrix` instaluje pakiet kandydujący w pustym
  kontenerze, przeprowadza Plugin npm przez instalację, inspekcję, wyłączenie,
  włączenie, jawny upgrade, jawny downgrade i odinstalowanie po usunięciu kodu
  Plugin. Dla każdej fazy zapisuje metryki RSS i CPU.
- `test:docker:plugin-update` waliduje, że niezmieniony zainstalowany Plugin nie
  jest reinstalowany i nie traci metadanych instalacji podczas
  `openclaw plugins update`.
- `test:docker:upgrade-survivor` instaluje tarball kandydata nad brudnym fixture
  starego użytkownika, uruchamia aktualizację pakietu oraz nieinteraktywny doctor,
  następnie startuje Gateway na local loopback i sprawdza zachowanie stanu.
- `test:docker:published-upgrade-survivor` najpierw instaluje opublikowaną bazę,
  konfiguruje ją przez wbudowaną receptę `openclaw config set`, aktualizuje do
  tarballa kandydata, uruchamia doctor, sprawdza czyszczenie legacy, startuje
  Gateway i odpytuje `/healthz`, `/readyz` oraz status RPC.
- `test:docker:update-restart-auth` instaluje pakiet kandydujący, startuje
  zarządzany Gateway z autoryzacją tokenem, usuwa z env wywołującego autoryzację
  Gateway dla `openclaw update --yes --json` i wymaga, aby polecenie aktualizacji
  kandydata zrestartowało Gateway przed standardowymi sondami.
- `test:docker:update-migration` to obciążony czyszczeniem tor aktualizacji
  opublikowanego pakietu. Zaczyna od skonfigurowanego stanu użytkownika w stylu
  Discord/Telegram, uruchamia bazowy doctor, żeby skonfigurowane zależności Plugin
  miały szansę się zmaterializować, zasiewa legacy pozostałości zależności Plugin
  dla skonfigurowanego pakietowanego Plugin, aktualizuje do tarballa kandydata i
  wymaga, aby doctor po aktualizacji usunął katalogi główne legacy zależności.

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
`stale-source-plugin-shadow`, `tilde-log-path` i `versioned-runtime-deps`. W uruchomieniach zbiorczych
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` rozwija się do wszystkich
scenariuszy ukształtowanych przez zgłoszone problemy, w tym migracji instalacji
skonfigurowanego Plugin.

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
kandydujący do tarballa `package-under-test`, zapisuje wersję i SHA-256, a potem
uruchamia wielokrotnego użytku tory Docker E2E przeciwko dokładnie temu
tarballowi. Referencja harnessu workflow jest oddzielna od referencji źródła
pakietu, więc bieżąca logika testowa może walidować starsze zaufane wydania.

Źródła kandydata:

- `source=npm`: waliduj `openclaw@beta`, `openclaw@latest` albo dokładną
  opublikowaną wersję.
- `source=ref`: spakuj zaufaną gałąź, tag albo commit z wybranym bieżącym
  harnessem.
- `source=url`: waliduj tarball HTTPS z wymaganym `package_sha256`.
- `source=artifact`: użyj ponownie tarballa przesłanego przez inne uruchomienie Actions.

Full Release Validation domyślnie używa `source=artifact`, zbudowanego z
rozwiązanego SHA wydania. Dla potwierdzenia po publikacji przekaż
`package_acceptance_package_spec=openclaw@YYYY.M.D`, aby ta sama macierz upgrade
celowała zamiast tego w wysłany pakiet npm.

Kontrole release wywołują Package Acceptance z zestawem package/update/restart/plugin:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Gdy release soak jest włączony, przekazują także:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Dzięki temu migracja pakietu, przełączanie kanału aktualizacji, tolerancja
uszkodzonego zarządzanego Plugin, czyszczenie przestarzałych zależności Plugin,
pokrycie offline Plugin, zachowanie aktualizacji Plugin i QA pakietu Telegram
działają na tym samym rozwiązanym artefakcie bez zmuszania domyślnej bramki
pakietu release do przechodzenia przez każde opublikowane wydanie.

`last-stable-4` rozwiązuje się do czterech najnowszych stabilnych wydań OpenClaw
opublikowanych w npm. Akceptacja pakietu release przypina `2026.4.23` jako
pierwszą granicę zgodności aktualizacji Plugin, `2026.5.2` jako granicę zmian
architektury Plugin i `2026.4.15` jako starszą bazę aktualizacji opublikowanego
pakietu z serii 2026.4.1x; resolver deduplikuje przypięcia, które już są w
najnowszej czwórce. Aby uzyskać wyczerpujące pokrycie migracji aktualizacji
opublikowanych pakietów, użyj `all-since-2026.4.23` w oddzielnym workflow Update
Migration zamiast Full Release CI. `release-history` pozostaje dostępne do
ręcznego szerszego próbkowania, gdy potrzebujesz też starszego punktu odniesienia
sprzed daty.

Gdy wybrano wiele baz published-upgrade survivor, workflow Docker wielokrotnego
użytku dzieli każdą bazę na osobne ukierunkowane zadanie runnera. Każdy shard
bazy nadal uruchamia wybrany zestaw scenariuszy, ale logi i artefakty pozostają
per baza, a czas ścienny jest ograniczony przez najwolniejszy shard zamiast przez
jedno duże zadanie szeregowe.

Uruchom profil pakietu ręcznie podczas walidacji kandydata przed release:

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

Użyj `suite_profile=product`, gdy pytanie release obejmuje kanały MCP, czyszczenie
cron/subagent, wyszukiwanie web OpenAI albo OpenWebUI. Używaj
`suite_profile=full` tylko wtedy, gdy potrzebujesz pełnego pokrycia Docker ścieżki
release.

## Domyślne ustawienie release

Dla kandydatów release domyślny stos potwierdzeń to:

1. `pnpm check:changed` i `pnpm test:changed` dla regresji na poziomie źródeł.
2. `pnpm release:check` dla integralności artefaktu pakietu.
3. Profil `package` Package Acceptance albo niestandardowe tory pakietu release-check
   dla kontraktów install/update/restart/plugin.
4. Cross-OS release checks dla specyficznych dla OS zachowań instalatora,
   onboardingu i platformy.
5. Zestawy live tylko wtedy, gdy zmieniana powierzchnia dotyka zachowania
   providera albo usługi hostowanej.

Na maszynach maintainerów szerokie bramki i produktowe potwierdzenia Docker/pakiet
powinny działać w Testbox, chyba że jawnie wykonywane jest lokalne potwierdzenie.

## Zgodność legacy

Łagodność zgodności jest wąska i ograniczona czasowo:

- Pakiety do `2026.4.25` włącznie, w tym `2026.4.25-beta.*`, mogą tolerować
  już wysłane luki metadanych pakietu w Package Acceptance.
- Opublikowany pakiet `2026.4.26` może ostrzegać dla plików stempli metadanych
  lokalnego builda, które już zostały wysłane.
- Późniejsze pakiety muszą spełniać nowoczesne kontrakty. Te same luki kończą się
  błędem zamiast ostrzeżenia albo pominięcia.

Nie dodawaj nowych migracji startowych dla tych starych kształtów. Dodaj albo
rozszerz naprawę doctor, a potem potwierdź ją przez `upgrade-survivor`,
`published-upgrade-survivor` albo `update-restart-auth`, gdy polecenie aktualizacji
odpowiada za restart.

## Dodawanie pokrycia

Podczas zmiany zachowania aktualizacji albo Plugin dodaj pokrycie na najniższej
warstwie, która może zawieść z właściwego powodu:

- Czysta logika ścieżek albo metadanych: test jednostkowy obok źródła.
- Zachowanie inwentarza pakietu albo spakowanych plików: test
  `package-dist-inventory` albo checker tarballa.
- Zachowanie instalacji/aktualizacji CLI: asercja albo fixture toru Docker.
- Zachowanie migracji opublikowanego wydania: scenariusz `published-upgrade-survivor`.
- Zachowanie restartu należącego do aktualizacji: `update-restart-auth`.
- Zachowanie źródła rejestru/pakietu: fixture `test:docker:plugins` albo serwer
  fixture ClawHub.
- Zachowanie układu albo czyszczenia zależności: asercjami sprawdź zarówno
  wykonanie runtime, jak i granicę systemu plików. Zależności npm mogą być
  wyniesione pod zarządzany katalog główny npm, więc testy powinny udowadniać,
  że katalog główny jest skanowany/czyszczony, zamiast zakładać lokalne dla
  pakietu drzewo `node_modules`.

Nowe fixture Docker domyślnie utrzymuj hermetyczne. Używaj lokalnych rejestrów
fixture i fałszywych pakietów, chyba że celem testu jest zachowanie rejestru live.

## Triage awarii

Zacznij od tożsamości artefaktu:

- Podsumowanie `resolve_package` akceptacji pakietu: źródło, wersja, SHA-256 i
  nazwa artefaktu.
- Artefakty Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, logi ścieżek i polecenia ponownego uruchomienia.
- Podsumowanie przetrwania uaktualnienia: `.artifacts/upgrade-survivor/summary.json`,
  z uwzględnieniem wersji bazowej, wersji kandydującej, scenariusza, czasów faz i
  kroków receptury.

Preferuj ponowne uruchomienie dokładnie tej ścieżki, która zakończyła się niepowodzeniem, z tym samym artefaktem pakietu, zamiast
ponownie uruchamiać cały parasol wydania.
