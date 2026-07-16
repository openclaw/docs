---
read_when:
    - Chcesz zainstalować lub zarządzać pluginami Gateway albo zgodnymi pakietami
    - Chcesz utworzyć szkielet prostego pluginu narzędziowego lub go zweryfikować
    - Chcesz debugować błędy ładowania pluginów
sidebarTitle: Plugins
summary: Dokumentacja CLI dla `openclaw plugins` (inicjalizacja, kompilowanie, walidacja, wyświetlanie listy, instalowanie, marketplace, odinstalowywanie, włączanie/wyłączanie, diagnostyka)
title: Pluginy
x-i18n:
    generated_at: "2026-07-16T18:14:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dadc182cd931672d98c3d1c6ddc1f1defdf0384b25feff7bd4b5324a7fc2e26c
    source_path: cli/plugins.md
    workflow: 16
---

Zarządzanie pluginami Gateway, pakietami hooków i zgodnymi pakietami zbiorczymi.

<CardGroup cols={2}>
  <Card title="System pluginów" href="/pl/tools/plugin">
    Przewodnik dla użytkowników końcowych dotyczący instalowania, włączania i rozwiązywania problemów z pluginami.
  </Card>
  <Card title="Zarządzanie pluginami" href="/pl/plugins/manage-plugins">
    Krótkie przykłady instalowania, wyświetlania listy, aktualizowania, odinstalowywania i publikowania.
  </Card>
  <Card title="Pakiety zbiorcze pluginów" href="/pl/plugins/bundles">
    Model zgodności pakietów zbiorczych.
  </Card>
  <Card title="Manifest pluginu" href="/pl/plugins/manifest">
    Pola manifestu i schemat konfiguracji.
  </Card>
  <Card title="Bezpieczeństwo" href="/pl/gateway/security">
    Wzmocnienie zabezpieczeń instalacji pluginów.
  </Card>
</CardGroup>

## Polecenia

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # alias polecenia inspect
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id> [--dry-run] [--keep-files] [--force]
openclaw plugins update <id-or-npm-spec> | --all [--dry-run]
openclaw plugins registry [--refresh] [--json]
openclaw plugins doctor
openclaw plugins init <id> [--name <name>] [--type tool|provider] [--directory <path>]
openclaw plugins build [--entry <path>] [--check]
openclaw plugins validate [--entry <path>]
openclaw plugins marketplace entries [--offline] [--feed-profile <name>] [--json]
openclaw plugins marketplace list <source> [--json]
openclaw plugins marketplace refresh [--feed-profile <name>] [--expected-sha256 <sha256>] [--json]
```

Aby zbadać powolne instalowanie, sprawdzanie, odinstalowywanie lub odświeżanie rejestru, należy uruchomić
polecenie z `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Ślad zapisuje czasy poszczególnych faz
do stderr i zachowuje możliwość analizowania danych wyjściowych JSON. Zobacz [Debugowanie](/pl/help/debugging#plugin-lifecycle-trace).

<Note>
W trybie Nix (`OPENCLAW_NIX_MODE=1`) element `openclaw.json` jest niezmienny. Polecenia `install`, `update`, `uninstall`, `enable` i `disable` odmawiają uruchomienia. Zamiast tego należy zmodyfikować źródło Nix tej instalacji (`programs.openclaw.config` lub `instances.<name>.config` w przypadku nix-openclaw), a następnie ponownie ją zbudować. Zobacz ukierunkowany na agenta [Szybki start](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Pluginy dołączone są dostarczane z OpenClaw. Niektóre są domyślnie włączone (na przykład dołączeni dostawcy modeli, dołączeni dostawcy obsługi mowy i dołączony plugin przeglądarki); inne wymagają `plugins enable`.

Natywne pluginy OpenClaw dostarczają `openclaw.plugin.json` z osadzonym schematem JSON (`configSchema`, nawet jeśli jest pusty). Zgodne pakiety zbiorcze używają zamiast tego własnych manifestów pakietów.

`plugins list` pokazuje `Format: openclaw` lub `Format: bundle`. Szczegółowe dane wyjściowe listy/informacji pokazują również podtyp pakietu (`codex`, `claude` lub `cursor`) oraz wykryte możliwości pakietu.
</Note>

## Tworzenie

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` domyślnie tworzy minimalny plugin narzędziowy TypeScript. Pierwszy
argument to identyfikator pluginu; `--name` ustawia nazwę wyświetlaną. OpenClaw używa
identyfikatora jako domyślnego katalogu wyjściowego i do nazewnictwa pakietu. Szkielety narzędzi używają
`defineToolPlugin` i generują skrypty `package.json`: `plugin:build` oraz
`plugin:validate`, które najpierw budują, a następnie wywołują `openclaw plugins build`/`validate`.

`plugins build` importuje zbudowany punkt wejścia, odczytuje jego statyczne metadane narzędzia, zapisuje
`openclaw.plugin.json` i utrzymuje zgodność pola `openclaw.extensions` w `package.json`.
`plugins validate` sprawdza, czy wygenerowany manifest, metadane pakietu i
bieżący eksport punktu wejścia nadal są zgodne. Pełny proces tworzenia opisano w sekcji
[Pluginy narzędziowe](/pl/plugins/tool-plugins).

Szkielet zapisuje kod źródłowy TypeScript, ale generuje metadane na podstawie zbudowanego
punktu wejścia `./dist/index.js`, dlatego ten proces działa również z opublikowanym CLI. Należy użyć
`--entry <path>`, gdy punkt wejścia nie jest domyślnym punktem wejścia pakietu. W CI należy użyć
`plugins build --check`, aby zgłosić błąd, gdy wygenerowane metadane są nieaktualne, bez
ponownego zapisywania plików.

### Szkielet dostawcy

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Szkielety dostawców tworzą ogólny plugin dostawcy modeli zgodnego z OpenAI,
z obsługą uwierzytelniania kluczem API, skryptem `npm run validate`, który uruchamia
`clawhub package validate`, metadanymi pakietu ClawHub oraz ręcznie
uruchamianym przepływem pracy GitHub Actions przeznaczonym do przyszłego zaufanego publikowania przez GitHub
OIDC. Szkielety dostawców nie generują Skills i nie używają
`openclaw plugins build`/`validate`; te polecenia są przeznaczone dla ścieżki
wygenerowanych metadanych szkieletu narzędzia.

Przed opublikowaniem należy zastąpić zastępczy bazowy adres URL API, katalog modeli, trasę
dokumentacji, tekst dotyczący poświadczeń i treść README rzeczywistymi danymi dostawcy. Wygenerowanego
README należy użyć do pierwszego publikowania w ClawHub i konfiguracji zaufanego wydawcy.

## Instalowanie

```bash
openclaw plugins search "calendar"                      # wyszukiwanie pluginów ClawHub
openclaw plugins install @openclaw/<package>            # zaufany oficjalny katalog
openclaw plugins install <package>                       # dowolny pakiet npm
openclaw plugins install clawhub:<package>                # tylko ClawHub
openclaw plugins install npm:<package>                    # tylko npm
openclaw plugins install npm-pack:<path.tgz>               # lokalne archiwum tarball npm-pack
openclaw plugins install git:github.com/<owner>/<repo>     # repozytorium git
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # lokalna ścieżka lub archiwum
openclaw plugins install -l <path>                         # dowiązanie zamiast kopiowania
openclaw plugins install <plugin>@<marketplace>             # skrócona składnia marketplace
openclaw plugins install <plugin> --marketplace <name>      # marketplace (jawnie)
openclaw plugins install <package> --force                  # potwierdzenie źródła / nadpisanie istniejącej instalacji
openclaw plugins install <package> --pin                    # przypięcie rozpoznanej wersji npm
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

Opiekunowie testujący instalacje wykonywane podczas konfiguracji mogą zastąpić automatyczne źródła
instalacji pluginów za pomocą chronionych zmiennych środowiskowych. Zobacz
[Zastępowanie źródeł instalacji pluginów](/pl/plugins/install-overrides).

<Warning>
Podczas przejściowego etapu uruchamiania niekwalifikowane nazwy pakietów są domyślnie instalowane z npm, chyba że odpowiadają identyfikatorowi dołączonego lub oficjalnego pluginu — wtedy OpenClaw używa tej lokalnej/oficjalnej kopii zamiast uzyskiwać dostęp do rejestru npm. Jeśli celowo ma zostać użyty zewnętrzny pakiet npm, należy użyć `npm:<package>`. W przypadku ClawHub należy użyć `clawhub:<package>`. Instalowanie pluginów należy traktować jak uruchamianie kodu; preferowane są przypięte wersje.
</Warning>

<Warning>
Pakiety ClawHub oraz dołączony/oficjalny katalog OpenClaw są zaufanymi źródłami
instalacji. Nowy dowolny pakiet npm, `npm-pack:`, repozytorium git, lokalna ścieżka/archiwum lub
źródło marketplace powoduje wyświetlenie ostrzeżenia i prośby o potwierdzenie przed kontynuowaniem. Nieinteraktywne instalacje
z dowolnych źródeł muszą przekazywać `--force` po sprawdzeniu źródła i uznaniu go za zaufane. Ta sama
flaga w razie potrzeby nadpisuje istniejący cel instalacji. Zwykłe aktualizacje
już śledzonej instalacji jej nie wymagają. To potwierdzenie jest niezależne od
`--acknowledge-clawhub-risk`, które ma zastosowanie wyłącznie do ostrzeżeń o ryzykownym poziomie zaufania
wydań ClawHub. `--force` nie omija `security.installPolicy` ani pozostałych
kontroli bezpieczeństwa instalacji.
</Warning>

`plugins search` wysyła zapytanie do ClawHub o możliwe do zainstalowania pakiety `code-plugin` i
`bundle-plugin` (nie Skills; dla nich należy użyć `openclaw skills search`).
Domyślna wartość `--limit` wynosi 20, a maksymalna 100. Polecenie tylko odczytuje zdalny katalog: nie
sprawdza stanu lokalnego, nie modyfikuje konfiguracji, nie instaluje pakietów ani nie
ładuje środowiska uruchomieniowego pluginów. Wyniki obejmują nazwę pakietu ClawHub, rodzinę, kanał, wersję,
podsumowanie oraz wskazówkę instalacyjną, taką jak `openclaw plugins install clawhub:<package>`.

<Note>
ClawHub jest główną platformą dystrybucji i odkrywania większości pluginów. Npm
pozostaje obsługiwaną opcją awaryjną i ścieżką bezpośredniej instalacji. Należące do OpenClaw
pakiety pluginów `@openclaw/*` są ponownie publikowane w npm; bieżącą listę można znaleźć
na stronie [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) lub w
[wykazie pluginów](/pl/plugins/plugin-inventory). Stabilne instalacje używają `latest`.
Instalacje i aktualizacje kanału beta preferują znacznik dist-tag npm `beta`, gdy jest dostępny,
a w przeciwnym razie używają `latest`. Na kanale rozszerzonej stabilności oficjalne pluginy npm
z zamiarem niekwalifikowanym/domyślnym lub `latest` są rozpoznawane jako dokładnie zainstalowana wersja
rdzenia. Dokładne przypięcia i jawne znaczniki inne niż `latest`, pakiety innych firm oraz
źródła inne niż npm nie są przepisywane.
</Note>

<AccordionGroup>
  <Accordion title="Dołączanie konfiguracji i naprawa nieprawidłowej konfiguracji">
    Jeśli sekcja `plugins` korzysta z pojedynczego pliku `$include`, polecenia `plugins install/update/enable/disable/uninstall` zapisują zmiany w tym dołączonym pliku i pozostawiają `openclaw.json` bez zmian. Dołączenia na poziomie głównym, tablice dołączeń oraz dołączenia z równorzędnymi nadpisaniami kończą działanie w trybie bezpiecznym zamiast spłaszczać strukturę. Obsługiwane struktury opisano w sekcji [Dołączanie konfiguracji](/pl/gateway/configuration).

    Jeśli podczas instalowania konfiguracja jest nieprawidłowa, `plugins install` zwykle kończy działanie w trybie bezpiecznym i informuje, że najpierw należy uruchomić `openclaw doctor --fix`. Podczas uruchamiania Gateway i przeładowywania na gorąco nieprawidłowa konfiguracja pluginu kończy działanie w trybie bezpiecznym tak samo jak każda inna nieprawidłowa konfiguracja; `openclaw doctor --fix` może poddać kwarantannie nieprawidłowy wpis pluginu. Jedynym udokumentowanym wyjątkiem podczas instalowania jest wąska ścieżka odzyskiwania dołączonych pluginów, które jawnie wybierają `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="Potwierdzenie --force oraz ponowna instalacja a aktualizacja">
    `--force` potwierdza źródło inne niż ClawHub bez wyświetlania monitu. Nie omija `security.installPolicy` ani pozostałych kontroli bezpieczeństwa instalacji. Jeśli plugin lub pakiet hooków jest już zainstalowany, używa również ponownie istniejącego celu i nadpisuje go w miejscu. Należy go używać po sprawdzeniu dowolnego źródła npm, lokalnego, archiwum, git lub marketplace albo podczas celowej ponownej instalacji tego samego identyfikatora. Do rutynowych aktualizacji już śledzonego pluginu npm preferowane jest `openclaw plugins update <id-or-npm-spec>`.

    Jeśli polecenie `plugins install` zostanie uruchomione dla identyfikatora już zainstalowanego pluginu, OpenClaw zatrzyma działanie i wskaże `plugins update <id-or-npm-spec>` w przypadku zwykłej aktualizacji albo `plugins install <package> --force`, gdy rzeczywiście ma zostać nadpisana bieżąca instalacja z innego źródła. Dowolne źródła nadal powodują wyświetlenie interaktywnego ostrzeżenia o pochodzeniu; instalacje nieinteraktywne muszą przekazywać `--force` po sprawdzeniu źródła. Zaufane źródła ClawHub i katalogu OpenClaw tego nie wymagają. W przypadku `--link` opcja `--force` potwierdza źródło, ale nie zmienia trybu instalacji z dowiązanej ścieżki.

  </Accordion>
  <Accordion title="Zakres --pin">
    `--pin` ma zastosowanie wyłącznie do instalacji npm i zapisuje dokładnie rozpoznaną wartość `<name>@<version>`. Nie jest obsługiwane z instalacjami `git:` (zamiast tego należy przypiąć odwołanie w specyfikacji, np. `git:github.com/acme/plugin@v1.2.3`) ani z `--marketplace` (instalacje marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` jest przestarzałe i obecnie nie wykonuje żadnej operacji. OpenClaw nie uruchamia już wbudowanego blokowania niebezpiecznego kodu podczas instalowania pluginów.

    Użyj zarządzanej przez operatora powierzchni `security.installPolicy`, gdy wymagane są zasady instalacji specyficzne dla hosta. Hooki `before_install` Pluginu są hookami cyklu życia środowiska uruchomieniowego pluginu, a nie główną granicą zasad instalacji przez CLI.

    Jeśli plugin opublikowany w ClawHub jest ukryty lub zablokowany przez skan rejestru, wykonaj kroki dla wydawcy opisane w sekcji [Publikowanie w ClawHub](/pl/clawhub/publishing). `--dangerously-force-unsafe-install` nie żąda od ClawHub ponownego przeskanowania pluginu ani publicznego udostępnienia zablokowanego wydania.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Instalacje społecznościowe z ClawHub sprawdzają przed pobraniem rekord zaufania wybranego wydania. Jeśli ClawHub wyłączy pobieranie wydania, zgłosi złośliwe wyniki skanowania lub umieści wydanie w blokującym stanie moderacji (kwarantanna, unieważnienie), OpenClaw bezwarunkowo je odrzuci niezależnie od tej flagi. W przypadku nieblokujących, ryzykownych stanów skanowania lub moderacji OpenClaw wyświetla szczegóły zaufania i przed kontynuowaniem prosi o potwierdzenie.

    Użyj `--acknowledge-clawhub-risk` dopiero po zapoznaniu się z ostrzeżeniem ClawHub i podjęciu decyzji o kontynuowaniu bez interaktywnego monitu. Oczekujące lub nieaktualne (jeszcze nieczyste) wyniki skanowania powodują ostrzeżenie, ale nie wymagają potwierdzenia. Oficjalne pakiety ClawHub i dołączone źródła pluginów OpenClaw całkowicie pomijają tę kontrolę zaufania do wydania.

  </Accordion>
  <Accordion title="Pakiety hooków i specyfikacje npm">
    `plugins install` jest również powierzchnią instalacji pakietów hooków udostępniających `openclaw.hooks` w `package.json`. Użyj `openclaw hooks` do filtrowania widoczności hooków i włączania poszczególnych hooków, a nie do instalacji pakietów.

    Specyfikacje npm obsługują **wyłącznie rejestr** (nazwa pakietu oraz opcjonalna **dokładna wersja** lub **dist-tag**). Specyfikacje Git/URL/plików oraz zakresy semver są odrzucane. Dla bezpieczeństwa instalacje zależności są uruchamiane z `--ignore-scripts` w jednym zarządzanym projekcie npm na plugin, nawet jeśli powłoka ma globalne ustawienia instalacji npm. Zarządzane projekty npm pluginów dziedziczą ustawienie npm `overrides` na poziomie pakietu OpenClaw, dzięki czemu zabezpieczenia hosta dotyczą również wyniesionych zależności pluginów.

    Użyj `npm:<package>`, aby jawnie wskazać rozwiązywanie przez npm. Podczas przejścia przy uruchomieniu podstawowe specyfikacje pakietów również instalują bezpośrednio z npm, chyba że odpowiadają identyfikatorowi oficjalnego pluginu.

    Nieprzetworzone specyfikacje `@openclaw/*`, które odpowiadają dołączonym pluginom, są najpierw rozwiązywane do dołączonej kopii należącej do obrazu, zanim nastąpi próba użycia npm. Na przykład `openclaw plugins install @openclaw/discord@2026.5.20 --pin` używa dołączonego pluginu Discord z bieżącej kompilacji OpenClaw, zamiast tworzyć zarządzane zastąpienie npm. Aby wymusić użycie zewnętrznego pakietu npm, użyj `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Podstawowe specyfikacje i `@latest` pozostają w kanale stabilnym. Wersje poprawek OpenClaw oznaczone datą, takie jak `2026.5.3-1`, są w tej kontroli uznawane za stabilne. Jeśli npm rozwiąże którąkolwiek formę do wersji przedpremierowej, OpenClaw zatrzyma się i poprosi o jawne wyrażenie zgody za pomocą tagu wersji przedpremierowej (`@beta`/`@rc`) lub dokładnej wersji przedpremierowej (`@1.2.3-beta.4`).

    W przypadku instalacji npm bez dokładnej wersji (`npm:<package>` lub `npm:<package>@latest`) OpenClaw przed instalacją sprawdza metadane rozwiązanego pakietu. Jeśli najnowszy stabilny pakiet wymaga nowszego API pluginów OpenClaw lub wyższej minimalnej wersji hosta, OpenClaw sprawdza starsze stabilne wersje i instaluje najnowsze zgodne wydanie. Dokładne wersje i jawne tagi dist-tag pozostają rygorystyczne: niezgodny wybór kończy się niepowodzeniem i monitem o uaktualnienie OpenClaw lub wybranie zgodnej wersji.

    Jeśli podstawowa specyfikacja instalacji odpowiada identyfikatorowi oficjalnego pluginu (na przykład `diffs`), OpenClaw instaluje bezpośrednio pozycję katalogu. Aby zainstalować pakiet npm o tej samej nazwie, użyj jawnej specyfikacji z zakresem (na przykład `@scope/diffs`).

  </Accordion>
  <Accordion title="Repozytoria Git">
    Użyj `git:<repo>`, aby zainstalować bezpośrednio z repozytorium Git. Obsługiwane formy: `git:github.com/owner/repo`, `git:owner/repo`, pełne adresy `https://`, `ssh://`, `git://`, `file://` oraz adresy URL klonowania `git@host:owner/repo.git`. Dodaj `@<ref>` lub `#<ref>`, aby przed instalacją pobrać gałąź, tag lub commit.

    Instalacje Git klonują repozytorium do katalogu tymczasowego, pobierają żądane odwołanie, jeśli je podano, a następnie używają standardowego instalatora katalogów pluginów. Dzięki temu walidacja manifestu, zasady instalacji operatora, operacje instalacyjne menedżera pakietów oraz rekordy instalacji działają tak samo jak w przypadku instalacji npm. Zarejestrowane instalacje Git obejmują adres URL i odwołanie źródła oraz rozwiązany commit, dzięki czemu `openclaw plugins update` może później ponownie rozwiązać źródło.

    Po instalacji z Git użyj `openclaw plugins inspect <id> --runtime --json`, aby zweryfikować rejestracje środowiska uruchomieniowego, takie jak metody Gateway i polecenia CLI. Jeśli plugin zarejestrował główną komendę CLI za pomocą `api.registerCli`, uruchom ją bezpośrednio przez główne CLI OpenClaw, na przykład `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archiwa">
    Obsługiwane archiwa: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Natywne archiwa pluginów OpenClaw muszą zawierać prawidłowy plik `openclaw.plugin.json` w głównym katalogu wyodrębnionego pluginu; archiwa zawierające wyłącznie `package.json` są odrzucane, zanim OpenClaw zapisze rekordy instalacji.

    Użyj `npm-pack:<path.tgz>`, gdy plik jest archiwum tar utworzonym przez npm pack i ma zostać użyta
    ta sama ścieżka zarządzanego projektu npm dla każdego pluginu co przy instalacjach z rejestru,
    w tym weryfikacja `package-lock.json`, skanowanie wyniesionych zależności
    oraz rekordy instalacji npm. Zwykłe ścieżki archiwów nadal instalują się jako lokalne
    archiwa w głównym katalogu rozszerzeń pluginów.

    Obsługiwane są również instalacje z marketplace Claude.

  </Accordion>
</AccordionGroup>

Instalacje ClawHub używają jawnego lokalizatora `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Podczas przejścia przy uruchomieniu podstawowe specyfikacje pluginów bezpieczne dla npm instalują się domyślnie z npm, chyba że odpowiadają identyfikatorowi oficjalnego pluginu:

```bash
openclaw plugins install openclaw-codex-app-server
```

Użyj `npm:`, aby jawnie wymusić rozwiązywanie wyłącznie przez npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw przed instalacją sprawdza deklarowaną zgodność API pluginu i minimalnej wersji Gateway. Gdy wybrana wersja ClawHub publikuje artefakt ClawPack, OpenClaw pobiera wersjonowany pakiet npm `.tgz`, weryfikuje nagłówek skrótu ClawHub i skrót artefaktu, a następnie instaluje go standardową ścieżką archiwum. Starsze wersje ClawHub bez metadanych ClawPack nadal instalują się przez starszą ścieżkę weryfikacji archiwum pakietu. Zarejestrowane instalacje zachowują metadane źródła ClawHub, rodzaj artefaktu, integralność npm, sumę kontrolną npm, nazwę archiwum tar oraz informacje o skrócie ClawPack na potrzeby późniejszych aktualizacji.
Instalacje ClawHub bez podanej wersji zachowują niewersjonowaną zarejestrowaną specyfikację, dzięki czemu `openclaw plugins update` może śledzić nowsze wydania ClawHub; jawne selektory wersji lub tagów, takie jak `clawhub:pkg@1.2.3` i `clawhub:pkg@beta`, pozostają przypięte do danego selektora.

### Skrócona składnia marketplace

Użyj skróconej składni `plugin@marketplace`, gdy nazwa marketplace istnieje w lokalnej pamięci podręcznej rejestru Claude pod adresem `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Użyj `--marketplace`, aby jawnie przekazać źródło marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Źródła marketplace">
    - nazwa znanego marketplace Claude z `~/.claude/plugins/known_marketplaces.json`
    - lokalny katalog główny marketplace lub ścieżka `marketplace.json`
    - skrócona nazwa repozytorium GitHub, taka jak `owner/repo`
    - adres URL repozytorium GitHub, taki jak `https://github.com/owner/repo`
    - adres URL Git

  </Tab>
  <Tab title="Reguły zdalnego marketplace">
    W przypadku zdalnych marketplace ładowanych z GitHub lub Git wpisy pluginów muszą pozostawać w sklonowanym repozytorium marketplace. OpenClaw akceptuje względne źródła ścieżkowe z tego repozytorium i odrzuca źródła pluginów HTTP(S), ze ścieżkami bezwzględnymi, Git, GitHub oraz inne źródła niebędące ścieżkami ze zdalnych manifestów.
  </Tab>
</Tabs>

W przypadku lokalnych ścieżek i archiwów OpenClaw automatycznie wykrywa:

- natywne pluginy OpenClaw (`openclaw.plugin.json`)
- pakiety zgodne z Codex (`.codex-plugin/plugin.json`)
- pakiety zgodne z Claude (`.claude-plugin/plugin.json` lub domyślny układ komponentów Claude, gdy ten plik manifestu nie istnieje)
- pakiety zgodne z Cursor (`.cursor-plugin/plugin.json`)

Zarządzane instalacje lokalne muszą być katalogami lub archiwami pluginów. Samodzielne pliki pluginów `.js`,
`.mjs`, `.cjs` i `.ts` nie są kopiowane do zarządzanego katalogu głównego
pluginów przez `plugins install` ani ładowane po umieszczeniu ich bezpośrednio w
`~/.openclaw/extensions` lub `<workspace>/.openclaw/extensions`; te
automatycznie wykrywane katalogi główne ładują katalogi pakietów lub zestawów pluginów i pomijają
pliki skryptów najwyższego poziomu, traktując je jako lokalne pliki pomocnicze. Zamiast tego jawnie wymień samodzielne pliki w
`plugins.load.paths`.

<Note>
Zgodne zestawy instalują się w standardowym katalogu głównym pluginów i uczestniczą w tym samym procesie wyświetlania listy, informacji, włączania i wyłączania. Obecnie obsługiwane są Skills zestawów, umiejętności poleceń Claude, wartości domyślne Claude `settings.json`, wartości domyślne Claude `.lsp.json` / deklarowane w manifeście `lspServers`, umiejętności poleceń Cursor oraz zgodne katalogi hooków Codex; inne wykryte możliwości zestawów są wyświetlane w diagnostyce i informacjach, ale nie są jeszcze podłączone do wykonywania w środowisku uruchomieniowym.
</Note>

Użyj `-l`/`--link`, aby wskazać lokalny katalog pluginu bez jego kopiowania (dodaje
do `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--link` nie jest obsługiwane w przypadku instalacji `--marketplace` ani `git:` i
wymaga istniejącej ścieżki lokalnej. W przypadku nieinteraktywnego lokalnego dowiązania
przekaż `--force` po sprawdzeniu źródła; potwierdza to pochodzenie, ale nie
kopiuje ani nie nadpisuje dowiązanego katalogu.

<Note>
Pluginy pochodzące z obszaru roboczego, wykryte w głównym katalogu rozszerzeń obszaru roboczego, nie są
importowane ani wykonywane, dopóki nie zostaną jawnie włączone. W przypadku programowania lokalnego
uruchom `openclaw plugins enable <plugin-id>` lub ustaw
`plugins.entries.<plugin-id>.enabled: true`; jeśli konfiguracja używa
`plugins.allow`, uwzględnij tam również ten sam identyfikator pluginu. Ta reguła bezpiecznej odmowy
obowiązuje również wtedy, gdy konfiguracja kanału jawnie wskazuje plugin pochodzący z obszaru roboczego do
ładowania wyłącznie na potrzeby konfiguracji, dlatego lokalny kod konfiguracji pluginu kanału nie zostanie uruchomiony, dopóki ten
plugin obszaru roboczego pozostaje wyłączony lub wykluczony z listy dozwolonych. Instalacje przez dowiązanie
i jawne wpisy `plugins.load.paths` podlegają standardowym zasadom dotyczącym ich
rozwiązanego pochodzenia pluginu. Zobacz
[Konfigurowanie zasad pluginów](/pl/tools/plugin#configure-plugin-policy)
oraz [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#plugins).

Użyj `--pin` podczas instalacji npm, aby zapisać rozwiązaną dokładną specyfikację (`name@version`) w zarządzanym indeksie pluginów, zachowując domyślne zachowanie bez przypięcia.
</Note>

## Lista

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Wyświetl tylko włączone pluginy.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Przełącz z widoku tabeli na wiersze szczegółów poszczególnych pluginów z metadanymi formatu, źródła, pochodzenia, wersji i aktywacji.
</ParamField>
<ParamField path="--json" type="boolean">
  Spis w formacie do odczytu maszynowego wraz z diagnostyką rejestru i stanem instalacji zależności pakietów.
</ParamField>

<Note>
`plugins list` najpierw odczytuje utrwalony lokalny rejestr pluginów, a gdy rejestr jest niedostępny lub nieprawidłowy, korzysta z rejestru pochodnego opartego wyłącznie na manifeście. Jest to przydatne do sprawdzania, czy plugin jest zainstalowany, włączony i widoczny podczas planowania zimnego startu, ale nie stanowi sondy działającego środowiska uruchomieniowego dla już uruchomionego procesu Gateway. Po zmianie kodu pluginu, stanu włączenia, zasad hooków lub `plugins.load.paths` należy ponownie uruchomić Gateway obsługujący kanał, zanim będzie można oczekiwać uruchomienia nowego kodu lub hooków `register(api)`. W przypadku wdrożeń zdalnych lub kontenerowych należy upewnić się, że ponownie uruchamiany jest właściwy proces potomny `openclaw gateway run`, a nie tylko proces opakowujący.

`plugins list --json` uwzględnia wartość `dependencyStatus` każdego pluginu z `package.json`
`dependencies` i `optionalDependencies`. OpenClaw sprawdza, czy nazwy tych pakietów
są obecne w standardowej ścieżce wyszukiwania Node `node_modules` pluginu; nie
importuje kodu środowiska uruchomieniowego pluginu, nie uruchamia menedżera pakietów ani nie naprawia brakujących
zależności.
</Note>

Jeśli podczas uruchamiania w dziennikach pojawi się `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
należy uruchomić `openclaw plugins list --enabled --verbose` lub
`openclaw plugins inspect <id>` z identyfikatorem pluginu z listy, aby potwierdzić identyfikatory
pluginów, a następnie skopiować zaufane identyfikatory do `plugins.allow` w `openclaw.json`. Gdy
ostrzeżenie może wyświetlić wszystkie wykryte pluginy, podaje gotowy do wklejenia
fragment `plugins.allow`, który już zawiera te identyfikatory. Jeśli plugin zostanie załadowany
bez informacji o pochodzeniu instalacji lub ścieżki ładowania, należy sprawdzić ten identyfikator pluginu, a następnie przypiąć
zaufany identyfikator w `plugins.allow` albo ponownie zainstalować plugin z zaufanego źródła,
aby OpenClaw zarejestrował pochodzenie instalacji.

Podczas pracy nad dołączonym pluginem wewnątrz spakowanego obrazu Docker należy zamontować
katalog źródłowy pluginu za pomocą bind mount w odpowiadającej mu spakowanej ścieżce źródłowej, na przykład
`/app/extensions/synology-chat`. OpenClaw wykrywa tę zamontowaną nakładkę źródłową
przed `/app/dist/extensions/synology-chat`; zwykły skopiowany katalog źródłowy
pozostaje nieaktywny, dzięki czemu standardowe instalacje pakietowe nadal korzystają ze skompilowanego katalogu dist.

Debugowanie hooków środowiska uruchomieniowego:

- `openclaw plugins inspect <id> --runtime --json` wyświetla zarejestrowane hooki i diagnostykę z przebiegu inspekcji z załadowanym modułem. Inspekcja środowiska uruchomieniowego nigdy nie instaluje zależności; należy użyć `openclaw doctor --fix`, aby wyczyścić starszy stan zależności lub odzyskać brakujące pluginy możliwe do pobrania, do których odwołuje się konfiguracja.
- `openclaw gateway status --deep --require-rpc` potwierdza osiągalny adres URL lub profil Gateway, wskazówki dotyczące usługi lub procesu, ścieżkę konfiguracji oraz stan RPC.
- Niedołączone hooki konwersacji (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) wymagają `plugins.entries.<id>.hooks.allowConversationAccess=true`.

### Indeks pluginów

Metadane instalacji pluginów są stanem zarządzanym przez system, a nie konfiguracją użytkownika. Instalacje i aktualizacje zapisują je we współdzielonej bazie danych stanu SQLite w aktywnym katalogu stanu OpenClaw. Wiersz `installed_plugin_index` przechowuje trwałe metadane `installRecords`, w tym rekordy uszkodzonych lub brakujących manifestów pluginów, a także pochodną manifestu pamięć podręczną rejestru zimnego startu używaną przez `openclaw plugins update`, odinstalowywanie, diagnostykę i rejestr pluginów zimnego startu.

Gdy OpenClaw wykryje w konfiguracji dostarczone starsze rekordy `plugins.installs`, odczyty środowiska uruchomieniowego traktują je jako dane wejściowe zgodności bez ponownego zapisywania `openclaw.json`. Jawne operacje zapisu pluginów oraz `openclaw doctor --fix` przenoszą te rekordy do indeksu pluginów i usuwają klucz konfiguracji, jeśli zapis konfiguracji jest dozwolony; jeśli którykolwiek z zapisów zakończy się niepowodzeniem, rekordy konfiguracji zostają zachowane, aby metadane instalacji nie zostały utracone.

## Odinstalowywanie

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` usuwa rekordy pluginu z `plugins.entries`, utrwalonego indeksu pluginów, wpisów list dozwolonych i zabronionych pluginów oraz powiązanych wpisów `plugins.load.paths`, gdy ma to zastosowanie. Jeśli nie ustawiono `--keep-files`, odinstalowywanie usuwa również śledzony katalog zarządzanej instalacji, ale tylko wtedy, gdy jego rozwiązana ścieżka znajduje się w katalogu głównym rozszerzeń pluginów OpenClaw. Jeśli plugin zajmuje obecnie miejsce `memory` lub `contextEngine`, to miejsce zostaje przywrócone do wartości domyślnej (`memory-core` dla pamięci, `legacy` dla silnika kontekstu).

`uninstall` wyświetla podgląd elementów do usunięcia, a następnie przed wprowadzeniem zmian wyświetla monit `Uninstall plugin "<id>"?`. Należy przekazać `--force`, aby pominąć monit o potwierdzenie (przydatne w skryptach i przebiegach nieinteraktywnych); bez tej opcji odinstalowywanie wymaga interaktywnego terminala TTY. `--dry-run` wyświetla ten sam podgląd i kończy działanie bez wyświetlania monitu ani wprowadzania zmian.

<Note>
`--keep-config` jest obsługiwany jako przestarzały alias dla `--keep-files`.
</Note>

## Aktualizacja

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update @acme/demo
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Aktualizacje dotyczą śledzonych instalacji pluginów w zarządzanym indeksie pluginów oraz śledzonych instalacji pakietów hooków w `hooks.internal.installs`. Ponownie wykorzystują źródło wybrane wcześniej przez użytkownika podczas instalowania pluginu, dlatego nie wymagają ponownego potwierdzenia źródła.

<AccordionGroup>
  <Accordion title="Rozróżnianie identyfikatora pluginu i specyfikacji npm">
    Po przekazaniu identyfikatora pluginu OpenClaw ponownie wykorzystuje zarejestrowaną specyfikację instalacji tego pluginu. Oznacza to, że zapisane wcześniej znaczniki dystrybucyjne, takie jak `@beta`, oraz dokładnie przypięte wersje są nadal używane w kolejnych przebiegach `update <id>`.

    Podczas `update <id> --dry-run` dokładnie przypięte instalacje npm pozostają przypięte. Jeśli OpenClaw może również ustalić domyślną linię wydania pakietu w rejestrze i jest ona nowsza niż zainstalowana przypięta wersja, próbny przebieg zgłasza przypięcie i wyświetla jawną komendę aktualizacji pakietu `@latest`, która umożliwia przejście na domyślną linię wydania rejestru.

    Ta reguła aktualizacji docelowej różni się od zbiorczej ścieżki konserwacji `openclaw plugins update --all`. Aktualizacje zbiorcze nadal respektują standardowe śledzone specyfikacje instalacji, ale rekordy zaufanych oficjalnych pluginów OpenClaw mogą zostać zsynchronizowane z bieżącym celem oficjalnego katalogu zamiast pozostawać przy nieaktualnym, dokładnie określonym pakiecie oficjalnym. Należy użyć docelowego `update <id>`, jeśli dokładna lub oznaczona specyfikacja oficjalna ma celowo pozostać bez zmian.

    W przypadku instalacji npm można również przekazać jawną specyfikację pakietu npm ze znacznikiem dystrybucyjnym lub dokładną wersją. OpenClaw dopasowuje nazwę tego pakietu do śledzonego rekordu pluginu, aktualizuje zainstalowany plugin i zapisuje nową specyfikację npm na potrzeby przyszłych aktualizacji opartych na identyfikatorze.

    Przekazanie nazwy pakietu npm bez wersji lub znacznika również powoduje dopasowanie do śledzonego rekordu pluginu. Należy użyć tej opcji, gdy plugin był przypięty do dokładnej wersji i ma zostać przeniesiony z powrotem na domyślną linię wydania rejestru.

  </Accordion>
  <Accordion title="Aktualizacje kanału beta">
    Docelowy `openclaw plugins update <id-or-npm-spec>` ponownie wykorzystuje śledzoną specyfikację pluginu, chyba że zostanie przekazana nowa specyfikacja. Zbiorczy `openclaw plugins update --all` używa skonfigurowanego `update.channel` podczas synchronizowania rekordów zaufanych oficjalnych pluginów z celem oficjalnego katalogu, dzięki czemu instalacje z kanału beta mogą pozostać na linii wydań beta zamiast być po cichu normalizowane do wersji stabilnej lub najnowszej.

    `openclaw update` rozpoznaje również aktywny kanał aktualizacji OpenClaw: na kanale beta rekordy pluginów npm i ClawHub z domyślnej linii najpierw próbują użyć `@beta`. Jeśli wydanie beta pluginu nie istnieje, wracają do zarejestrowanej specyfikacji domyślnej lub najnowszej; pluginy npm wracają do niej również wtedy, gdy pakiet beta istnieje, ale nie przechodzi walidacji instalacji. To przejście awaryjne jest zgłaszane jako ostrzeżenie i nie powoduje niepowodzenia aktualizacji rdzenia. Dokładne wersje i jawne znaczniki pozostają przypięte do danego selektora podczas aktualizacji docelowych.

  </Accordion>
  <Accordion title="Kontrole wersji i rozbieżność integralności">
    Przed właściwą aktualizacją npm OpenClaw porównuje wersję zainstalowanego pakietu z metadanymi rejestru npm. Jeśli zainstalowana wersja i zarejestrowana tożsamość artefaktu już odpowiadają ustalonemu celowi, aktualizacja zostaje pominięta bez pobierania, ponownej instalacji ani ponownego zapisywania `openclaw.json`.

    Jeśli istnieje zapisany skrót integralności, a skrót pobranego artefaktu uległ zmianie, OpenClaw traktuje to jako rozbieżność artefaktu npm. Interaktywna komenda `openclaw plugins update` wyświetla oczekiwany i rzeczywisty skrót oraz przed kontynuowaniem prosi o potwierdzenie. Nieinteraktywne narzędzia pomocnicze aktualizacji domyślnie przerywają działanie, chyba że wywołujący przekaże jawną zasadę kontynuacji.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install podczas aktualizacji">
    `--dangerously-force-unsafe-install` jest również akceptowany przez `plugins update` ze względów zgodności, ale jest przestarzały i nie zmienia już zachowania aktualizacji pluginów. Operator `security.installPolicy` nadal może blokować aktualizacje; hooki pluginu `before_install` mają zastosowanie tylko w procesach, w których hooki pluginów są załadowane.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk podczas aktualizacji">
    Aktualizacje pluginów społecznościowych opartych na ClawHub przeprowadzają przed pobraniem pakietu zastępczego taką samą kontrolę zaufania dokładnego wydania jak instalacje. Należy użyć `--acknowledge-clawhub-risk` w przypadku zweryfikowanej automatyzacji, która ma być kontynuowana, gdy wybrane wydanie ClawHub zawiera ostrzeżenie o ryzyku związanym z zaufaniem. Oficjalne pakiety ClawHub i dołączone źródła pluginów OpenClaw pomijają ten monit dotyczący zaufania do wydania.
  </Accordion>
</AccordionGroup>

## Inspekcja

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

Inspekcja wyświetla tożsamość, stan ładowania, źródło, możliwości manifestu, flagi zasad, diagnostykę, metadane instalacji, możliwości pakietu oraz wszelką wykrytą obsługę serwerów MCP lub LSP, domyślnie bez importowania środowiska uruchomieniowego pluginu. Dane wyjściowe JSON zawierają kontrakty manifestu pluginu, takie jak `contracts.agentToolResultMiddleware` i `contracts.trustedToolPolicies`, dzięki czemu operatorzy mogą skontrolować deklaracje zaufanych powierzchni przed włączeniem lub ponownym uruchomieniem pluginu. Należy dodać `--runtime`, aby załadować moduł pluginu i uwzględnić zarejestrowane hooki, narzędzia, komendy, usługi, metody Gateway i trasy HTTP. Inspekcja środowiska uruchomieniowego zgłasza bezpośrednio brakujące zależności pluginu; instalacje i naprawy pozostają w `openclaw plugins install`, `openclaw plugins update` i `openclaw doctor --fix`.

Komendy CLI należące do pluginów są zwykle instalowane jako główne grupy komend `openclaw`, ale pluginy mogą również rejestrować zagnieżdżone komendy pod nadrzędną komendą rdzenia, taką jak `openclaw nodes`. Gdy `inspect --runtime` wyświetli komendę pod `cliCommands`, należy uruchomić ją pod wskazaną ścieżką; na przykład plugin rejestrujący `demo-git` można zweryfikować za pomocą `openclaw demo-git ping`.

Każdy plugin jest klasyfikowany według tego, co faktycznie rejestruje w środowisku uruchomieniowym:

| Forma               | Znaczenie                                                           |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | dokładnie jeden typ możliwości (np. plugin wyłącznie dostawcy)         |
| `hybrid-capability` | więcej niż jeden typ możliwości (np. tekst + mowa + obrazy)       |
| `hook-only`         | tylko hooki, bez możliwości, narzędzi, komend, usług ani tras |
| `non-capability`    | narzędzia/komendy/usługi, ale bez możliwości                       |

Więcej informacji o modelu możliwości zawiera sekcja [Formy pluginów](/pl/plugins/architecture#plugin-shapes).

<Note>
Flaga `--json` generuje raport do odczytu maszynowego, odpowiedni do użycia w skryptach i audytach. `inspect --all` renderuje tabelę obejmującą całą flotę z kolumnami formy, rodzajów możliwości, powiadomień o zgodności, możliwości pakietu i podsumowania hooków. `info` jest aliasem dla `inspect`.
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` zgłasza błędy ładowania pluginów, diagnostykę manifestu/wykrywania, powiadomienia o zgodności oraz odwołania do nieaktualnej konfiguracji pluginów, takie jak brakujące miejsca na pluginy. Gdy drzewo instalacji i konfiguracja pluginów są prawidłowe, wyświetla `No plugin issues detected.` Jeśli nieaktualna konfiguracja nadal występuje, ale drzewo instalacji jest poza tym prawidłowe, podsumowanie informuje o tym zamiast sugerować pełną sprawność pluginów.

Jeśli skonfigurowany plugin znajduje się na dysku, ale jest blokowany przez mechanizmy kontroli bezpieczeństwa ścieżek modułu ładującego, walidacja konfiguracji zachowuje wpis pluginu i zgłasza go jako `present but blocked`. Należy naprawić poprzedzającą diagnostykę zablokowanego pluginu, na przykład dotyczącą własności ścieżki lub uprawnień do zapisu dla wszystkich, zamiast usuwać konfigurację `plugins.entries.<id>` lub `plugins.allow`.

W przypadku błędów struktury modułu, takich jak brak eksportów `register`/`activate`, należy uruchomić ponownie z opcją `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, aby uwzględnić zwięzłe podsumowanie struktury eksportów w danych wyjściowych diagnostyki.

## Rejestr

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Lokalny rejestr pluginów jest utrwalonym przez OpenClaw modelem odczytu „na zimno”, obejmującym tożsamość zainstalowanych pluginów, stan ich włączenia, metadane źródła oraz własność rozszerzeń. Standardowe uruchamianie, wyszukiwanie właściciela dostawcy, klasyfikacja konfiguracji kanałów oraz inwentaryzacja pluginów mogą go odczytywać bez importowania modułów środowiska uruchomieniowego pluginów.

Opcja `plugins registry` pozwala sprawdzić, czy utrwalony rejestr istnieje oraz czy jest aktualny lub nieaktualny. Opcja `--refresh` pozwala odbudować go na podstawie utrwalonego indeksu pluginów, zasad konfiguracji oraz metadanych manifestu/pakietu. Jest to ścieżka naprawy, a nie ścieżka aktywacji środowiska uruchomieniowego.

`openclaw doctor --fix` naprawia również rozbieżności w zarządzanych pakietach npm powiązanych z rejestrem: jeśli osierocony lub odzyskany pakiet `@openclaw/*` w zarządzanym projekcie npm pluginu albo w starszym płaskim katalogu głównym zarządzanych pakietów npm przesłania plugin dołączony do dystrybucji, narzędzie doctor usuwa ten nieaktualny pakiet i odbudowuje rejestr, aby podczas uruchamiania walidacja odbywała się względem manifestu dołączonego pluginu. Narzędzie doctor ponownie dowiązuje również pakiet hosta `openclaw` do zarządzanych pluginów npm, które deklarują `peerDependencies.openclaw`, dzięki czemu lokalne dla pakietu importy środowiska uruchomieniowego, takie jak `openclaw/plugin-sdk/*`, są rozpoznawane po aktualizacjach lub naprawach npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` jest przestarzałym awaryjnym przełącznikiem zgodności na wypadek błędów odczytu rejestru. Zaleca się użycie `plugins registry --refresh` lub `openclaw doctor --fix`; mechanizm rezerwowy zmiennej środowiskowej służy wyłącznie do awaryjnego przywracania uruchamiania podczas wdrażania migracji.
</Warning>

## Marketplace

```bash
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace entries --feed-profile <name>
openclaw plugins marketplace entries --feed-url <url>
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

`plugins marketplace entries` wyświetla wpisy ze skonfigurowanego kanału Marketplace OpenClaw. Domyślnie próbuje użyć hostowanego kanału, a w razie niepowodzenia korzysta z najnowszej zaakceptowanej migawki lub danych dołączonych do dystrybucji. Opcja `--feed-profile <name>` umożliwia odczyt określonego skonfigurowanego profilu, `--feed-url <url>` — odczyt jawnego adresu URL hostowanego kanału, a `--offline` — odczyt najnowszej zaakceptowanej migawki bez pobierania kanału.

`plugins marketplace refresh` odświeża skonfigurowaną migawkę hostowanego kanału i informuje, czy OpenClaw zaakceptował dane hostowane, hostowaną migawkę czy dane rezerwowe dołączone do dystrybucji. Opcji `--expected-sha256` należy użyć, gdy wywołujący wymaga, aby polecenie zakończyło się niepowodzeniem, jeśli świeżo pobrana hostowana zawartość nie odpowiada przypiętej sumie kontrolnej.

Polecenie `list` Marketplace akceptuje lokalną ścieżkę Marketplace, ścieżkę `marketplace.json`, skrócony zapis GitHub, taki jak `owner/repo`, adres URL repozytorium GitHub lub adres URL git. `--json` wyświetla rozpoznaną etykietę źródła oraz przeanalizowany manifest Marketplace i wpisy pluginów.

Odświeżanie Marketplace ładuje hostowany kanał Marketplace OpenClaw i utrwala
zweryfikowaną odpowiedź jako lokalną migawkę hostowanego kanału. Bez opcji używa
skonfigurowanego domyślnego profilu kanału. Opcja `--feed-profile <name>` odświeża
określony skonfigurowany profil, `--feed-url <url>` odświeża jawny adres URL
hostowanego kanału, `--expected-sha256 <sha256>` wymaga zgodnej sumy kontrolnej zawartości
(`sha256:<hex>` lub niepoprzedzonego prefiksem 64-znakowego skrótu szesnastkowego), a `--json` włącza
dane wyjściowe przeznaczone do przetwarzania maszynowego. Jawne adresy URL hostowanych kanałów nie mogą zawierać
danych uwierzytelniających, ciągów zapytania ani fragmentów. Odświeżenia bez przypiętej sumy kontrolnej mogą zgłosić
wynik w postaci hostowanej migawki lub danych rezerwowych dołączonych do dystrybucji bez niepowodzenia polecenia. Odświeżenia
z przypiętą sumą kontrolną kończą się niepowodzeniem, jeśli nie zaakceptują świeżo pobranej hostowanej zawartości, a pomyślne hostowane
odświeżenia kończą się niepowodzeniem, jeśli OpenClaw nie może utrwalić zweryfikowanej migawki.

## Powiązane

- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Dokumentacja CLI](/pl/cli)
- [ClawHub](/clawhub)
