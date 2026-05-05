---
read_when:
    - Zmiana zachowania aktualizacji OpenClaw, diagnostyki, akceptacji pakietu lub instalacji Plugin
    - Przygotowywanie lub zatwierdzanie kandydata do wydania
    - Debugowanie regresji aktualizacji pakietu, czyszczenia zależności pluginu lub instalacji pluginu
sidebarTitle: Update and plugin tests
summary: Jak OpenClaw weryfikuje ścieżki aktualizacji, migracje pakietów oraz zachowanie instalacji i aktualizacji Pluginów
title: 'Testowanie: aktualizacje i pluginy'
x-i18n:
    generated_at: "2026-05-05T01:47:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: e83a847c76f424199b5fccbd9a2b30d0bf01e4f466c4f9822bf7693d1c2ad286
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

To jest dedykowana lista kontrolna do walidacji aktualizacji i pluginów. Cel jest prosty: udowodnić, że instalowalny pakiet potrafi zaktualizować rzeczywisty stan użytkownika, naprawić nieaktualny stan starszych wersji przez `doctor`, a także nadal instalować, ładować, aktualizować i odinstalowywać pluginy z obsługiwanych źródeł.

Szerszą mapę runnera testów znajdziesz w [Testowanie](/pl/help/testing). Klucze dostawców live i pakiety dotykające sieci opisuje [Testowanie live](/pl/help/testing-live).

## Co chronimy

Testy aktualizacji i pluginów chronią te kontrakty:

- Tarball pakietu jest kompletny, ma prawidłowy `dist/postinstall-inventory.json` i nie zależy od nierozpakowanych plików repozytorium.
- Użytkownik może przejść ze starszego opublikowanego pakietu do pakietu kandydującego bez utraty konfiguracji, agentów, sesji, obszarów roboczych, list dozwolonych pluginów ani konfiguracji kanałów.
- `openclaw doctor --fix --non-interactive` odpowiada za ścieżki czyszczenia i naprawy starszych wersji. Start nie powinien dostawać ukrytych migracji zgodności dla nieaktualnego stanu pluginów.
- Instalacje pluginów działają z katalogów lokalnych, repozytoriów git, pakietów npm oraz ścieżki rejestru ClawHub.
- Zależności npm pluginów są instalowane w zarządzanym katalogu głównym npm, skanowane przed zaufaniem i usuwane przez npm podczas odinstalowywania, aby wyniesione zależności nie zostawały.
- Aktualizacja pluginu jest stabilna, gdy nic się nie zmieniło: rekordy instalacji, rozwiązane źródło, układ zainstalowanych zależności i stan włączenia pozostają nienaruszone.

## Lokalne potwierdzenie podczas developmentu

Zacznij wąsko:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Przy zmianach instalacji pluginów, odinstalowywania, zależności lub inwentarza pakietu uruchom też ukierunkowane testy obejmujące edytowaną granicę:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Zanim jakakolwiek ścieżka Docker pakietu użyje tarballa, potwierdź artefakt pakietu:

```bash
pnpm release:check
```

`release:check` uruchamia kontrole dryfu konfiguracji/dokumentacji/API, zapisuje inwentarz dystrybucji pakietu, uruchamia `npm pack --dry-run`, odrzuca zabronione spakowane pliki, instaluje tarball w tymczasowym prefiksie, uruchamia postinstall i wykonuje smoke testy punktów wejścia dołączonych kanałów.

## Ścieżki Docker

Ścieżki Docker są potwierdzeniem na poziomie produktu. Instalują albo aktualizują rzeczywisty pakiet w kontenerach Linux i sprawdzają zachowanie przez polecenia CLI, start Gateway, sondy HTTP, status RPC oraz stan systemu plików.

Używaj ukierunkowanych ścieżek podczas iteracji:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Ważne ścieżki:

- `test:docker:plugins` waliduje smoke test instalacji pluginu, instalacje z folderów lokalnych, pomijanie aktualizacji folderów lokalnych, foldery lokalne z wcześniej zainstalowanymi zależnościami, instalacje pakietów `file:`, instalacje z git z wykonaniem CLI, aktualizacje ruchomych referencji git, instalacje z rejestru npm z wyniesionymi zależnościami przechodnimi, brak zmian przy aktualizacji npm, instalacje z lokalnej fikstury ClawHub i brak zmian przy aktualizacji, zachowanie aktualizacji marketplace oraz włączanie/inspekcję pakietu Claude. Ustaw `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, aby blok ClawHub pozostał hermetyczny/offline.
- `test:docker:plugin-lifecycle-matrix` instaluje pakiet kandydujący w pustym kontenerze, przeprowadza plugin npm przez instalację, inspekcję, wyłączenie, włączenie, jawny upgrade, jawny downgrade i odinstalowanie po usunięciu kodu pluginu. Loguje metryki RSS i CPU dla każdej fazy.
- `test:docker:plugin-update` waliduje, że niezmieniony zainstalowany plugin nie instaluje się ponownie ani nie traci metadanych instalacji podczas `openclaw plugins update`.
- `test:docker:upgrade-survivor` instaluje tarball kandydata na zabrudzonej fiksturze starego użytkownika, uruchamia aktualizację pakietu oraz nieinteraktywny doctor, potem startuje Gateway loopback i sprawdza zachowanie stanu.
- `test:docker:published-upgrade-survivor` najpierw instaluje opublikowaną bazę, konfiguruje ją przez wypieczoną receptę `openclaw config set`, aktualizuje ją do tarballa kandydata, uruchamia doctor, sprawdza czyszczenie starszych wersji, startuje Gateway i sondy `/healthz`, `/readyz` oraz status RPC.
- `test:docker:update-migration` to ścieżka opublikowanej aktualizacji mocno skoncentrowana na czyszczeniu. Startuje ze skonfigurowanego stanu użytkownika w stylu Discord/Telegram, uruchamia bazowy doctor, aby skonfigurowane zależności pluginów miały szansę się zmaterializować, zasiewa pozostałości starszych zależności pluginów dla skonfigurowanego spakowanego pluginu, aktualizuje do tarballa kandydata i wymaga, aby doctor po aktualizacji usunął starsze katalogi główne zależności.

Przydatne warianty published-upgrade survivor:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Dostępne scenariusze to `base`, `feishu-channel`, `bootstrap-persona`, `plugin-deps-cleanup`, `configured-plugin-installs`, `stale-source-plugin-shadow`, `tilde-log-path` i `versioned-runtime-deps`. W przebiegach zbiorczych `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` rozwija się do wszystkich scenariuszy ukształtowanych jak zgłoszone problemy, w tym migracji instalacji skonfigurowanych pluginów.

Pełna migracja aktualizacji jest celowo oddzielona od Full Release CI. Użyj ręcznego workflow `Update Migration`, gdy pytanie wydaniowe brzmi „czy każde opublikowane stabilne wydanie od 2026.4.23 wzwyż może zaktualizować się do tego kandydata i wyczyścić pozostałości zależności pluginów?”:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Akceptacja pakietu

Akceptacja pakietu to natywna dla GitHub bramka pakietu. Rozwiązuje jeden pakiet kandydujący do tarballa `package-under-test`, zapisuje wersję i SHA-256, a następnie uruchamia wielokrotnego użytku ścieżki Docker E2E wobec dokładnie tego tarballa. Ref uprzęży workflow jest oddzielony od refa źródła pakietu, więc bieżąca logika testów może walidować starsze zaufane wydania.

Źródła kandydata:

- `source=npm`: waliduj `openclaw@beta`, `openclaw@latest` albo dokładną opublikowaną wersję.
- `source=ref`: spakuj zaufaną gałąź, tag albo commit z wybraną bieżącą uprzężą.
- `source=url`: waliduj tarball HTTPS z wymaganym `package_sha256`.
- `source=artifact`: użyj ponownie tarballa przesłanego przez inny przebieg Actions.

Full Release Validation domyślnie używa `source=artifact`, zbudowanego z rozwiązanego SHA wydania. Dla potwierdzenia po publikacji przekaż `package_acceptance_package_spec=openclaw@YYYY.M.D`, aby ta sama macierz upgrade celowała zamiast tego w wysłany pakiet npm.

Kontrole wydania wywołują Akceptację pakietu z zestawem pakiet/aktualizacja/plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Przekazują też:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

To utrzymuje migrację pakietu, przełączanie kanału aktualizacji, czyszczenie nieaktualnych zależności pluginów, pokrycie pluginów offline, zachowanie aktualizacji pluginów i QA pakietu Telegram na tym samym rozwiązanym artefakcie.

`all-since-2026.4.23` to próbka upgrade Full Release CI: każde stabilne wydanie opublikowane w npm od `2026.4.23` do `latest`. Dla wyczerpującego pokrycia migracji opublikowanych aktualizacji użyj `all-since-2026.4.23` w oddzielnym workflow Update Migration zamiast Full Release CI. `release-history` pozostaje dostępne do ręcznego szerszego próbkowania, gdy chcesz też starszy punkt odniesienia sprzed tej daty.

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

Użyj `suite_profile=product`, gdy pytanie wydaniowe obejmuje kanały MCP, czyszczenie cron/subagentów, wyszukiwanie web OpenAI albo OpenWebUI. Używaj `suite_profile=full` tylko wtedy, gdy potrzebujesz pełnego pokrycia ścieżki wydaniowej Docker.

## Domyślne wydanie

Dla kandydatów do wydania domyślny stos potwierdzeń to:

1. `pnpm check:changed` i `pnpm test:changed` dla regresji na poziomie źródeł.
2. `pnpm release:check` dla integralności artefaktu pakietu.
3. Profil `package` Akceptacji pakietu albo niestandardowe ścieżki pakietu kontroli wydania dla kontraktów instalacji/aktualizacji/pluginów.
4. Międzysystemowe kontrole wydania dla zachowania instalatora, onboardingu i platformy specyficznego dla OS.
5. Pakiety live tylko wtedy, gdy zmieniona powierzchnia dotyka zachowania dostawcy albo usługi hostowanej.

Na maszynach maintainerów szerokie bramki i produktowe potwierdzenia Docker/pakietu powinny działać w Testbox, chyba że jawnie wykonywane jest lokalne potwierdzenie.

## Zgodność ze starszymi wersjami

Łagodność zgodności jest wąska i ograniczona czasowo:

- Pakiety do `2026.4.25` włącznie, w tym `2026.4.25-beta.*`, mogą tolerować już wysłane luki metadanych pakietu w Akceptacji pakietu.
- Opublikowany pakiet `2026.4.26` może ostrzegać o plikach znaczników metadanych lokalnego buildu, które zostały już wysłane.
- Późniejsze pakiety muszą spełniać współczesne kontrakty. Te same luki kończą się niepowodzeniem zamiast ostrzeżenia albo pominięcia.

Nie dodawaj nowych migracji startowych dla tych starych kształtów. Dodaj albo rozszerz naprawę doctor, a następnie potwierdź ją przez `upgrade-survivor` albo `published-upgrade-survivor`.

## Dodawanie pokrycia

Gdy zmieniasz zachowanie aktualizacji albo pluginów, dodaj pokrycie na najniższej warstwie, która może zawieść z właściwego powodu:

- Czysta logika ścieżek albo metadanych: test jednostkowy obok źródła.
- Inwentarz pakietu albo zachowanie spakowanych plików: test `package-dist-inventory` albo checker tarballa.
- Zachowanie instalacji/aktualizacji CLI: asercja albo fikstura ścieżki Docker.
- Zachowanie migracji opublikowanego wydania: scenariusz `published-upgrade-survivor`.
- Zachowanie źródła rejestru/pakietu: fikstura `test:docker:plugins` albo serwer fikstury ClawHub.
- Zachowanie układu albo czyszczenia zależności: asercja zarówno wykonania runtime, jak i granicy systemu plików. Zależności npm mogą być wynoszone pod zarządzany katalog główny npm, więc testy powinny dowodzić, że katalog główny jest skanowany/czyszczony, zamiast zakładać lokalne dla pakietu drzewo `node_modules`.

Nowe fikstury Docker domyślnie utrzymuj hermetyczne. Używaj lokalnych rejestrów fikstur i fałszywych pakietów, chyba że celem testu jest zachowanie rejestru live.

## Triage awarii

Zacznij od tożsamości artefaktu:

- Podsumowanie `resolve_package` Akceptacji pakietu: źródło, wersja, SHA-256 i nazwa artefaktu.
- Artefakty Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logi ścieżek i polecenia ponownego uruchomienia.
- Podsumowanie upgrade survivor: `.artifacts/upgrade-survivor/summary.json`, w tym wersja bazowa, wersja kandydata, scenariusz, czasy faz i kroki recepty.

Preferuj ponowne uruchomienie dokładnie tej ścieżki, która zawiodła, z tym samym artefaktem pakietu, zamiast ponownie uruchamiać cały parasol wydania.
