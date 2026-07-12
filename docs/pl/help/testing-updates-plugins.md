---
read_when:
    - Zmiana działania aktualizacji OpenClaw, polecenia doctor, akceptacji pakietów lub instalacji pluginów
    - Przygotowywanie lub zatwierdzanie kandydata do wydania
    - Debugowanie aktualizacji pakietów, porządkowania zależności pluginów lub regresji instalacji pluginów
sidebarTitle: Update and plugin tests
summary: Jak OpenClaw weryfikuje ścieżki aktualizacji, migracje pakietów oraz działanie instalacji i aktualizacji pluginów
title: 'Testowanie: aktualizacje i pluginy'
x-i18n:
    generated_at: "2026-07-12T15:14:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e930960b5819d2144467476cb473e62f236eca63e1d9941a6bc793b484e731c
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Lista kontrolna walidacji aktualizacji i pluginów: udowodnij, że instalowalny pakiet może
aktualizować rzeczywisty stan użytkownika, naprawiać nieaktualny stan starszego formatu za pomocą `doctor`
oraz nadal instalować, ładować, aktualizować i odinstalowywać pluginy ze wszystkich obsługiwanych źródeł.

Szerszą mapę narzędzi uruchamiających testy znajdziesz w sekcji [Testowanie](/pl/help/testing). Informacje o kluczach
aktywnych dostawców i zestawach testów korzystających z sieci znajdziesz w sekcji [Testowanie na żywo](/pl/help/testing-live).

## Co chronimy

- Archiwum tar pakietu jest kompletne, zawiera prawidłowy plik `dist/postinstall-inventory.json`
  i nie zależy od nierozpakowanych plików repozytorium.
- Użytkownik może przejść ze starszego opublikowanego pakietu do pakietu kandydującego
  bez utraty konfiguracji, agentów, sesji, obszarów roboczych, list dozwolonych pluginów ani
  konfiguracji kanałów.
- `openclaw doctor --fix --non-interactive` odpowiada za ścieżki czyszczenia i naprawy
  starszych formatów. Uruchamianie nie powinno dodawać ukrytych migracji zgodności dla
  nieaktualnego stanu pluginów.
- Instalowanie pluginów działa z katalogów lokalnych, repozytoriów git, pakietów npm oraz
  ścieżki rejestru ClawHub.
- Zależności npm pluginu są instalowane w jednym zarządzanym projekcie npm na plugin,
  skanowane przed udzieleniem zaufania i usuwane za pomocą `npm uninstall` podczas
  odinstalowywania pluginu, aby wyniesione zależności nie pozostawały w systemie.
- Aktualizacja pluginu nie wykonuje żadnych zmian, gdy nic się nie zmieniło: rekordy instalacji, rozwiązane
  źródło, układ zainstalowanych zależności i stan włączenia pozostają nienaruszone.

## Lokalna weryfikacja podczas programowania

Zacznij od wąskiego zakresu:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

W przypadku zmian dotyczących instalowania lub odinstalowywania pluginów, zależności albo ewidencji pakietu uruchom również
ukierunkowane testy obejmujące edytowany punkt styku:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Zanim jakakolwiek ścieżka Docker dla pakietów użyje archiwum tar, zweryfikuj artefakt pakietu:

```bash
pnpm release:check
```

`release:check` uruchamia kontrole rozbieżności konfiguracji, dokumentacji i API (schemat konfiguracji, poziom odniesienia
dokumentacji konfiguracji, poziom odniesienia API SDK pluginów i eksporty, wersje i ewidencję pluginów),
zapisuje ewidencję dystrybucji pakietu, uruchamia `npm pack --dry-run`, odrzuca zabronione
spakowane pliki, instaluje archiwum tar w tymczasowym prefiksie, uruchamia skrypt poinstalacyjny oraz
przeprowadza testy dymne punktów wejścia dołączonych kanałów.

## Ścieżki Docker

Ścieżki Docker stanowią weryfikację na poziomie produktu. Instalują lub aktualizują rzeczywisty
pakiet wewnątrz kontenerów Linux i sprawdzają zachowanie za pomocą poleceń CLI,
uruchamiania Gateway, sond HTTP, stanu RPC oraz stanu systemu plików.

Podczas iteracji używaj ukierunkowanych ścieżek:

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

- `test:docker:plugins` obejmuje testy dymne instalacji pluginów, instalacje z folderów lokalnych,
  pomijanie aktualizacji folderów lokalnych, foldery lokalne ze wstępnie zainstalowanymi
  zależnościami, instalacje pakietów `file:`, instalacje git z wykonywaniem CLI, aktualizacje
  ruchomych referencji git, instalacje z rejestru npm z wyniesionymi zależnościami przechodnimi,
  aktualizacje npm niewprowadzające zmian, odrzucanie nieprawidłowych metadanych pakietów npm,
  instalacje z lokalnych danych testowych ClawHub i aktualizacje niewprowadzające zmian, zachowanie
  aktualizacji marketplace oraz włączanie i inspekcję pakietu Claude. Ustaw `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, aby
  blok ClawHub pozostał hermetyczny i działał bez połączenia z siecią.
- `test:docker:plugin-lifecycle-matrix` instaluje pakiet kandydujący w pustym
  kontenerze, przeprowadza plugin npm przez instalację, inspekcję, wyłączenie, włączenie,
  jawną aktualizację, jawne obniżenie wersji oraz odinstalowanie po usunięciu kodu
  pluginu. Rejestruje metryki RSS i CPU dla każdej fazy.
- `test:docker:plugin-update` sprawdza, czy niezmieniony zainstalowany plugin
  nie jest ponownie instalowany ani nie traci metadanych instalacji podczas `openclaw plugins update`.
- `test:docker:upgrade-survivor` instaluje kandydujące archiwum tar na zmodyfikowanych
  danych testowych starego użytkownika, uruchamia aktualizację pakietu oraz nieinteraktywny tryb doctor, następnie uruchamia
  Gateway na local loopback i sprawdza zachowanie stanu.
- `test:docker:published-upgrade-survivor` najpierw instaluje opublikowaną wersję bazową,
  konfiguruje ją według wbudowanej procedury `openclaw config set`, aktualizuje do
  kandydującego archiwum tar, uruchamia doctor, sprawdza czyszczenie starszego stanu, uruchamia Gateway i
  odpytuje `/healthz`, `/readyz` oraz stan RPC.
- `test:docker:update-restart-auth` instaluje pakiet kandydujący, uruchamia
  zarządzany Gateway z uwierzytelnianiem tokenem, usuwa zmienne środowiskowe uwierzytelniania Gateway wywołującego dla
  `openclaw update --yes --json` i wymaga, aby polecenie aktualizacji kandydata
  ponownie uruchomiło Gateway przed standardowymi sondami.
- `test:docker:update-migration` to ścieżka aktualizacji opublikowanego pakietu z intensywnym czyszczeniem. Rozpoczyna
  od skonfigurowanego stanu użytkownika w stylu Discord/Telegram, uruchamia bazowy
  tryb doctor, aby skonfigurowane zależności pluginów miały szansę się zmaterializować, dodaje
  pozostałości zależności pluginów starszego formatu dla skonfigurowanego spakowanego pluginu, aktualizuje do
  kandydującego archiwum tar i wymaga, aby doctor po aktualizacji usunął stare
  katalogi główne zależności.

Przydatne warianty testu przetrwania aktualizacji z opublikowanej wersji:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Dostępne scenariusze: `base`, `acpx-openclaw-tools-bridge`, `feishu-channel`,
`bootstrap-persona`, `channel-post-core-restore`, `plugin-deps-cleanup`,
`configured-plugin-installs`, `stale-source-plugin-shadow`, `tilde-log-path`
oraz `versioned-runtime-deps`. W uruchomieniach zbiorczych `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`
(alias `far-reaching`) rozwija się do wszystkich scenariuszy, w tym migracji
instalacji skonfigurowanych pluginów.

Pełna migracja aktualizacji jest celowo oddzielona od pełnego CI wydania. Użyj
ręcznego przepływu pracy `Update Migration`, gdy pytanie dotyczące wydania brzmi: „czy każda
opublikowana wersja stabilna od 2026.4.23 może zostać zaktualizowana do tego kandydata i
usunąć pozostałości zależności pluginów?”:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Akceptacja pakietu

Akceptacja pakietu jest natywną dla GitHub bramą pakietową. Rozwiązuje jeden kandydujący
pakiet do archiwum tar `package-under-test`, rejestruje wersję oraz SHA-256, a następnie
uruchamia wielokrotnego użytku ścieżki E2E Docker względem dokładnie tego archiwum tar. Referencja środowiska
przepływu pracy jest oddzielona od referencji źródła pakietu, dzięki czemu bieżąca logika testów może weryfikować
starsze zaufane wydania.

Źródła kandydatów:

- `source=npm`: weryfikuje `openclaw@extended-stable`, `openclaw@beta`,
  `openclaw@latest` lub dokładną opublikowaną wersję.
- `source=ref`: pakuje zaufaną gałąź, tag lub commit przy użyciu wybranego bieżącego
  środowiska testowego.
- `source=url`: weryfikuje publiczne archiwum tar HTTPS z wymaganym `package_sha256`.
  Ta ścieżka odrzuca dane logowania w adresie URL, niestandardowe porty HTTPS, prywatne lub wewnętrzne
  nazwy hostów albo wyniki DNS/IP, przestrzeń adresów IP specjalnego przeznaczenia oraz niebezpieczne przekierowania.
- `source=trusted-url`: weryfikuje archiwum tar HTTPS z wymaganymi
  `package_sha256` i `trusted_source_id` względem zasad należących do opiekunów,
  zapisanych w `.github/package-trusted-sources.json`. Używaj tej opcji dla firmowych lub prywatnych
  serwerów lustrzanych zamiast osłabiania `source=url` przełącznikiem zezwalającym na zasoby prywatne
  na poziomie danych wejściowych. Uwierzytelnianie Bearer, gdy jest skonfigurowane przez zasady, używa stałego
  sekretu `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.
- `source=artifact`: ponownie używa archiwum tar przesłanego przez inne uruchomienie Actions.

Pełna walidacja wydania domyślnie używa `source=artifact`, zbudowanego na podstawie
rozwiązanego SHA wydania. Aby przeprowadzić weryfikację po publikacji, przekaż
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH`, aby ta sama macierz aktualizacji
obejmowała zamiast tego wydany pakiet npm.

Kontrole wydania wywołują Akceptację pakietu z zestawem pakietów, aktualizacji, ponownych uruchomień i pluginów:

```text
doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape
```

Gdy test stabilności wydania jest włączony (wymuszony dla `release_profile=stable` i
`full`), przekazują również:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Dzięki temu migracja pakietu, przełączanie kanału aktualizacji, tolerowanie uszkodzonego zarządzanego pluginu,
czyszczenie nieaktualnych zależności pluginów, obsługa pluginów w trybie offline, zachowanie
aktualizacji pluginów oraz kontrola jakości pakietu Telegram korzystają z tego samego rozwiązanego artefaktu bez
zmuszania domyślnej bramy pakietu wydania do przechodzenia przez wszystkie opublikowane wydania.

`last-stable-4` wskazuje cztery najnowsze stabilne wydania OpenClaw
opublikowane w npm. Akceptacja pakietu wydania przypina `2026.4.23` jako pierwszą granicę
zgodności aktualizacji pluginów, `2026.5.2` jako granicę intensywnych zmian architektury pluginów oraz
`2026.4.15` jako starszą bazową wersję aktualizacji opublikowanego pakietu z serii 2026.4.1x; mechanizm rozwiązujący
usuwa duplikaty przypiętych wersji, które znajdują się już w najnowszej czwórce. Aby uzyskać wyczerpujące pokrycie migracji
aktualizacji opublikowanych wersji, użyj `all-since-2026.4.23` w oddzielnym przepływie pracy Migracja
aktualizacji zamiast pełnego CI wydania. `release-history` pozostaje
dostępne do ręcznego, szerszego próbkowania, gdy potrzebny jest również starszy punkt odniesienia sprzed tej daty.

Gdy wybrano wiele bazowych wersji testu przetrwania aktualizacji opublikowanego pakietu, przepływ pracy Docker
wielokrotnego użytku dzieli każdą wersję bazową na osobne, ukierunkowane zadanie procesu wykonawczego. Każdy
fragment bazowy nadal uruchamia wybrany zestaw scenariuszy, ale dzienniki i artefakty pozostają
oddzielne dla każdej wersji bazowej, a czas rzeczywisty jest ograniczony przez najwolniejszy fragment zamiast jednego dużego
zadania szeregowego.

Uruchom ręcznie profil pakietu podczas weryfikowania kandydata przed wydaniem:

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

Dla opublikowanej wersji canary o rozszerzonej stabilności ustaw
`package_spec=openclaw@extended-stable`. Akceptacja pakietu rozwiązuje ten
selektor do dokładnego archiwum tar przed uruchomieniem ścieżek Docker.

Użyj `suite_profile=product`, gdy pytanie dotyczące wydania obejmuje kanały MCP,
czyszczenie Cron/podagentów, wyszukiwanie internetowe OpenAI lub OpenWebUI. Używaj `suite_profile=full`
tylko wtedy, gdy potrzebujesz pełnego pokrycia ścieżek wydania Docker.

## Domyślna walidacja wydania

W przypadku kandydatów do wydania domyślny zestaw weryfikacji obejmuje:

1. `pnpm check:changed` i `pnpm test:changed` dla regresji na poziomie źródeł.
2. `pnpm release:check` dla integralności artefaktu pakietu.
3. Profil `package` Akceptacji pakietu lub niestandardowe ścieżki pakietowe
   kontroli wydania dla kontraktów instalacji, aktualizacji, ponownego uruchamiania i pluginów.
4. Międzyplatformowe kontrole wydania dotyczące instalatora, procesu wdrażania i zachowania
   specyficznego dla platformy.
5. Zestawy testów na żywo tylko wtedy, gdy zmieniony obszar dotyczy zachowania dostawcy lub usługi
   hostowanej.

Na komputerach opiekunów szerokie bramy oraz weryfikacja produktu w Dockerze i pakietach powinny działać
w Testbox, chyba że weryfikacja jest jawnie wykonywana lokalnie.

## Zgodność ze starszymi wersjami

Tolerancja zgodności jest ograniczona i czasowa:

- Pakiety do wersji `2026.4.25` włącznie, w tym `2026.4.25-beta.*`, mogą tolerować
  już wydane braki metadanych pakietów w Akceptacji pakietu.
- Opublikowany pakiet `2026.4.26` może ostrzegać o już wydanych plikach znaczników
  metadanych kompilacji lokalnej.
- Późniejsze pakiety muszą spełniać współczesne kontrakty. Te same braki powodują błąd zamiast
  ostrzeżenia lub pominięcia.

Nie dodawaj nowych migracji uruchomieniowych dla tych starych formatów. Dodaj lub rozszerz naprawę
doctor, a następnie zweryfikuj ją za pomocą `upgrade-survivor`, `published-upgrade-survivor` albo
`update-restart-auth`, gdy polecenie aktualizacji odpowiada za ponowne uruchomienie.

## Dodawanie pokrycia testami

Podczas zmieniania zachowania aktualizacji lub pluginów dodaj pokrycie na najniższej warstwie, która
może zakończyć się niepowodzeniem z właściwego powodu:

- Czysta logika ścieżek lub metadanych: test jednostkowy obok kodu źródłowego.
- Inwentarz pakietu lub zachowanie spakowanych plików: test `package-dist-inventory` albo
  test sprawdzający archiwum tar.
- Zachowanie instalacji/aktualizacji przez CLI: asercja ścieżki Docker lub fixture.
- Zachowanie migracji opublikowanej wersji: scenariusz `published-upgrade-survivor`.
- Zachowanie ponownego uruchomienia zarządzanego przez aktualizację: `update-restart-auth`.
- Zachowanie źródła rejestru/pakietu: fixture `test:docker:plugins` lub serwer
  fixture ClawHub.
- Układ zależności lub zachowanie czyszczenia: sprawdź zarówno wykonanie w środowisku uruchomieniowym, jak i
  granicę systemu plików. Zależności npm mogą zostać wyniesione wyżej w zarządzanym
  projekcie npm pluginu, dlatego testy powinny wykazać, że ten projekt jest skanowany/czyszczony,
  zamiast zakładać, że dotyczy to wyłącznie lokalnego drzewa `node_modules` pakietu pluginu.

Nowe fixture Docker powinny być domyślnie hermetyczne. Używaj lokalnych rejestrów fixture i
fałszywych pakietów, chyba że celem testu jest zachowanie aktywnego rejestru.

## Klasyfikacja awarii

Zacznij od tożsamości artefaktu:

- Podsumowanie `resolve_package` w Package Acceptance: źródło, wersja, SHA-256 oraz
  nazwa artefaktu.
- Artefakty Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, dzienniki ścieżek oraz polecenia ponownego uruchomienia.
- Podsumowanie scenariusza przetrwania aktualizacji: `.artifacts/upgrade-survivor/summary.json`,
  obejmujące wersję bazową, wersję kandydującą, scenariusz, czasy faz oraz
  pokrycie receptur konfiguracji.

Preferuj ponowne uruchomienie dokładnie tej ścieżki, która zakończyła się niepowodzeniem, z tym samym artefaktem pakietu,
zamiast ponownie uruchamiać cały nadrzędny proces wydania.
