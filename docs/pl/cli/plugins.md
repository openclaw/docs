---
read_when:
    - Chcesz zainstalować lub zarządzać pluginami Gateway albo zgodnymi pakietami
    - Chcesz utworzyć szkielet prostego pluginu narzędziowego lub zweryfikować taki plugin
    - Chcesz debugować błędy ładowania pluginów
sidebarTitle: Plugins
summary: Dokumentacja CLI dla `openclaw plugins` (inicjalizacja, kompilowanie, walidacja, wyświetlanie listy, instalowanie, marketplace, odinstalowywanie, włączanie/wyłączanie, diagnostyka)
title: Pluginy
x-i18n:
    generated_at: "2026-07-12T15:00:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 729e74103a302936dc45da3be31306803b16e9dae182e78b3742783b892a9027
    source_path: cli/plugins.md
    workflow: 16
---

Zarządzaj wtyczkami Gateway, pakietami hooków i zgodnymi pakietami zbiorczymi.

<CardGroup cols={2}>
  <Card title="System Plugin" href="/pl/tools/plugin">
    Przewodnik użytkownika dotyczący instalowania, włączania i rozwiązywania problemów z wtyczkami.
  </Card>
  <Card title="Zarządzanie wtyczkami" href="/pl/plugins/manage-plugins">
    Krótkie przykłady instalowania, wyświetlania listy, aktualizowania, odinstalowywania i publikowania.
  </Card>
  <Card title="Pakiety zbiorcze wtyczek" href="/pl/plugins/bundles">
    Model zgodności pakietów zbiorczych.
  </Card>
  <Card title="Manifest Plugin" href="/pl/plugins/manifest">
    Pola manifestu i schemat konfiguracji.
  </Card>
  <Card title="Bezpieczeństwo" href="/pl/gateway/security">
    Wzmacnianie zabezpieczeń instalacji wtyczek.
  </Card>
</CardGroup>

## Polecenia

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # alias for inspect
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

Podczas diagnozowania powolnego instalowania, sprawdzania, odinstalowywania lub odświeżania rejestru uruchom polecenie z `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Ślad zapisuje czasy trwania faz do stderr i zachowuje możliwość analizowania danych wyjściowych JSON. Zobacz [Debugowanie](/pl/help/debugging#plugin-lifecycle-trace).

<Note>
W trybie Nix (`OPENCLAW_NIX_MODE=1`) plik `openclaw.json` jest niezmienny. Polecenia `install`, `update`, `uninstall`, `enable` i `disable` odmawiają działania. Zamiast tego zmodyfikuj źródło Nix tej instalacji (`programs.openclaw.config` lub `instances.<name>.config` w przypadku nix-openclaw), a następnie przebuduj konfigurację. Zobacz [Szybki start](https://github.com/openclaw/nix-openclaw#quick-start) przeznaczony przede wszystkim dla agentów.
</Note>

<Note>
Wbudowane wtyczki są dostarczane z OpenClaw. Niektóre są domyślnie włączone (na przykład wbudowani dostawcy modeli, wbudowani dostawcy mowy i wbudowana wtyczka przeglądarki); inne wymagają użycia `plugins enable`.

Natywne wtyczki OpenClaw dostarczają plik `openclaw.plugin.json` z osadzonym schematem JSON (`configSchema`, nawet jeśli jest pusty). Zgodne pakiety zbiorcze używają natomiast własnych manifestów.

Polecenie `plugins list` wyświetla `Format: openclaw` lub `Format: bundle`. Szczegółowe dane wyjściowe listy i informacji zawierają również podtyp pakietu (`codex`, `claude` lub `cursor`) oraz wykryte możliwości pakietu.
</Note>

## Tworzenie

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

Polecenie `plugins init` domyślnie tworzy minimalną wtyczkę narzędziową w TypeScript. Pierwszym argumentem jest identyfikator wtyczki; `--name` ustawia nazwę wyświetlaną. OpenClaw używa identyfikatora do określenia domyślnego katalogu wyjściowego i nazwy pakietu. Szkielety narzędziowe używają `defineToolPlugin` i generują w pliku `package.json` skrypty `plugin:build` oraz `plugin:validate`, które najpierw wykonują kompilację, a następnie wywołują `openclaw plugins build`/`validate`.

Polecenie `plugins build` importuje skompilowany punkt wejścia, odczytuje jego statyczne metadane narzędzia, zapisuje plik `openclaw.plugin.json` i utrzymuje zgodność pola `openclaw.extensions` w pliku `package.json`. Polecenie `plugins validate` sprawdza, czy wygenerowany manifest, metadane pakietu i aktualny eksport punktu wejścia nadal są ze sobą zgodne. Pełny proces tworzenia opisano w sekcji [Wtyczki narzędziowe](/pl/plugins/tool-plugins).

Szkielet zapisuje kod źródłowy TypeScript, ale generuje metadane na podstawie skompilowanego punktu wejścia `./dist/index.js`, dzięki czemu ten proces działa również z opublikowanym CLI. Użyj `--entry <path>`, jeśli punkt wejścia nie jest domyślnym punktem wejścia pakietu. W CI użyj `plugins build --check`, aby zgłosić błąd, gdy wygenerowane metadane są nieaktualne, bez ponownego zapisywania plików.

### Szkielet dostawcy

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Szkielety dostawców tworzą ogólną wtyczkę dostawcy modeli zgodną z OpenAI, wraz z obsługą uwierzytelniania kluczem API, skryptem `npm run validate` uruchamiającym `clawhub package validate`, metadanymi pakietu ClawHub oraz ręcznie uruchamianym przepływem pracy GitHub Actions do przyszłego zaufanego publikowania przy użyciu GitHub OIDC. Szkielety dostawców nie generują Skills i nie używają `openclaw plugins build`/`validate`; te polecenia są przeznaczone dla ścieżki generowanych metadanych szkieletu narzędziowego.

Przed opublikowaniem zastąp zastępczy bazowy adres URL interfejsu API, katalog modeli, trasę dokumentacji, tekst dotyczący danych uwierzytelniających oraz treść README rzeczywistymi informacjami o dostawcy. Użyj wygenerowanego README przy pierwszym publikowaniu w ClawHub i konfigurowaniu zaufanego wydawcy.

## Instalowanie

```bash
openclaw plugins search "calendar"                      # search ClawHub plugins
openclaw plugins install <package>                       # source auto-detection
openclaw plugins install clawhub:<package>                # ClawHub only
openclaw plugins install npm:<package>                    # npm only
openclaw plugins install npm-pack:<path.tgz>               # local npm-pack tarball
openclaw plugins install git:github.com/<owner>/<repo>     # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # local path or archive
openclaw plugins install -l <path>                         # link instead of copy
openclaw plugins install <plugin>@<marketplace>             # marketplace shorthand
openclaw plugins install <plugin> --marketplace <name>      # marketplace (explicit)
openclaw plugins install <package> --force                  # overwrite existing install
openclaw plugins install <package> --pin                    # pin resolved npm version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

Opiekunowie testujący instalacje podczas konfiguracji mogą zastąpić automatyczne źródła instalacji wtyczek za pomocą chronionych zmiennych środowiskowych. Zobacz [Nadpisywanie źródeł instalacji wtyczek](/pl/plugins/install-overrides).

<Warning>
Podczas przejścia wdrożeniowego same nazwy pakietów są domyślnie instalowane z npm, chyba że odpowiadają identyfikatorowi wbudowanej lub oficjalnej wtyczki — w takim przypadku OpenClaw używa lokalnej lub oficjalnej kopii zamiast odwoływać się do rejestru npm. Użyj `npm:<package>`, jeśli świadomie chcesz zainstalować zewnętrzny pakiet npm. W przypadku ClawHub użyj `clawhub:<package>`. Traktuj instalowanie wtyczek jak uruchamianie kodu; preferuj przypięte wersje.
</Warning>

Polecenie `plugins search` przeszukuje ClawHub pod kątem możliwych do zainstalowania pakietów `code-plugin` i `bundle-plugin` (nie Skills; do ich wyszukiwania użyj `openclaw skills search`). Domyślna wartość `--limit` wynosi 20, a maksymalna 100. Polecenie wyłącznie odczytuje zdalny katalog: nie sprawdza lokalnego stanu, nie modyfikuje konfiguracji, nie instaluje pakietów ani nie ładuje środowiska uruchomieniowego wtyczek. Wyniki obejmują nazwę pakietu ClawHub, rodzinę, kanał, wersję, podsumowanie oraz podpowiedź instalacji, taką jak `openclaw plugins install clawhub:<package>`.

<Note>
ClawHub jest podstawowym miejscem dystrybucji i odkrywania większości wtyczek. Npm pozostaje obsługiwaną ścieżką zapasową i metodą instalacji bezpośredniej. Pakiety wtyczek `@openclaw/*` należące do OpenClaw są ponownie publikowane w npm; aktualną listę można znaleźć na stronie [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) lub w [wykazie wtyczek](/pl/plugins/plugin-inventory). Stabilne instalacje używają `latest`. Instalacje i aktualizacje z kanału beta preferują znacznik dystrybucji npm `beta`, jeśli jest dostępny, a w przeciwnym razie używają `latest`. W kanale rozszerzonej stabilności oficjalne wtyczki npm z domyślnym, nieokreślonym lub wskazującym `latest` zamiarem są rozwiązywane do dokładnej wersji zainstalowanego rdzenia. Dokładnie przypięte wersje i jawne znaczniki inne niż `latest`, pakiety innych firm oraz źródła inne niż npm nie są przepisywane.
</Note>

<AccordionGroup>
  <Accordion title="Dołączanie konfiguracji i naprawa nieprawidłowej konfiguracji">
    Jeśli sekcja `plugins` korzysta z pojedynczego pliku `$include`, polecenia `plugins install/update/enable/disable/uninstall` zapisują zmiany w tym dołączonym pliku i pozostawiają plik `openclaw.json` bez zmian. Dołączenia na poziomie głównym, tablice dołączeń oraz dołączenia z równorzędnymi nadpisaniami kończą działanie w sposób bezpieczny zamiast spłaszczać konfigurację. Obsługiwane postacie opisano w sekcji [Dołączanie konfiguracji](/pl/gateway/configuration).

    Jeśli podczas instalowania konfiguracja jest nieprawidłowa, polecenie `plugins install` zwykle kończy działanie w sposób bezpieczny i informuje, że najpierw należy uruchomić `openclaw doctor --fix`. Podczas uruchamiania Gateway i przeładowywania na gorąco nieprawidłowa konfiguracja wtyczki kończy działanie w sposób bezpieczny, tak jak każda inna nieprawidłowa konfiguracja; `openclaw doctor --fix` może poddać nieprawidłowy wpis wtyczki kwarantannie. Jedynym udokumentowanym wyjątkiem podczas instalowania jest wąska ścieżka odzyskiwania wbudowanych wtyczek, które jawnie korzystają z `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force oraz ponowna instalacja a aktualizacja">
    Opcja `--force` ponownie wykorzystuje istniejące miejsce docelowe instalacji i zastępuje już zainstalowaną wtyczkę lub pakiet hooków w tym samym miejscu. Użyj jej, gdy celowo ponownie instalujesz ten sam identyfikator z nowej ścieżki lokalnej, archiwum, pakietu ClawHub lub artefaktu npm. Do rutynowych aktualizacji już śledzonej wtyczki npm preferuj `openclaw plugins update <id-or-npm-spec>`.

    Jeśli uruchomisz `plugins install` dla identyfikatora wtyczki, która jest już zainstalowana, OpenClaw zatrzyma działanie i wskaże `plugins update <id-or-npm-spec>` w przypadku zwykłej aktualizacji albo `plugins install <package> --force`, jeśli rzeczywiście chcesz zastąpić bieżącą instalację pochodzącą z innego źródła. Opcja `--force` nie jest obsługiwana razem z `--link`.

  </Accordion>
  <Accordion title="Zakres --pin">
    Opcja `--pin` ma zastosowanie wyłącznie do instalacji npm i zapisuje dokładnie rozwiązaną wartość `<name>@<version>`. Nie jest obsługiwana z instalacjami `git:` — zamiast tego przypnij odwołanie w specyfikacji, np. `git:github.com/acme/plugin@v1.2.3` — ani z `--marketplace`, ponieważ instalacje z marketplace zapisują metadane źródła marketplace zamiast specyfikacji npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    Opcja `--dangerously-force-unsafe-install` jest przestarzała i obecnie niczego nie robi. OpenClaw nie stosuje już wbudowanego blokowania niebezpiecznego kodu podczas instalowania wtyczek.

    Gdy wymagana jest polityka instalacji specyficzna dla hosta, użyj zarządzanej przez operatora powierzchni `security.installPolicy`. Hooki `before_install` wtyczki są hookami cyklu życia środowiska uruchomieniowego wtyczki, a nie podstawową granicą polityki instalacji wykonywanych przez CLI.

    Jeśli wtyczka opublikowana przez Ciebie w ClawHub została ukryta lub zablokowana przez skanowanie rejestru, wykonaj kroki dla wydawcy opisane w sekcji [Publikowanie w ClawHub](/pl/clawhub/publishing). Opcja `--dangerously-force-unsafe-install` nie nakazuje ClawHub ponownego przeskanowania wtyczki ani publicznego udostępnienia zablokowanego wydania.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Instalacje społecznościowych pakietów z ClawHub sprawdzają rejestr zaufania wybranego wydania przed jego pobraniem. Jeśli ClawHub wyłączy pobieranie tego wydania, zgłosi wykrycie złośliwego kodu podczas skanowania albo umieści wydanie w blokującym stanie moderacji (kwarantanna lub wycofanie), OpenClaw bezwarunkowo odmówi instalacji niezależnie od tej flagi. W przypadku ryzykownych, ale nieblokujących stanów skanowania lub moderacji OpenClaw wyświetla szczegóły dotyczące zaufania i prosi o potwierdzenie przed kontynuowaniem.

    Używaj `--acknowledge-clawhub-risk` wyłącznie po zapoznaniu się z ostrzeżeniem ClawHub i podjęciu decyzji o kontynuowaniu bez interaktywnego monitu. Oczekujące lub nieaktualne wyniki skanowania, które nie potwierdzają jeszcze bezpieczeństwa, powodują wyświetlenie ostrzeżenia, ale nie wymagają potwierdzenia. Oficjalne pakiety ClawHub i źródła wbudowanych wtyczek OpenClaw całkowicie pomijają tę kontrolę zaufania do wydania.

  </Accordion>
  <Accordion title="Pakiety hooków i specyfikacje npm">
    Polecenie `plugins install` służy również do instalowania pakietów hooków, które udostępniają `openclaw.hooks` w pliku `package.json`. Użyj `openclaw hooks`, aby filtrować widoczność hooków i włączać poszczególne hooki, a nie do instalowania pakietów.

    Specyfikacje npm są **ograniczone wyłącznie do rejestru** (nazwa pakietu oraz opcjonalnie **dokładna wersja** lub **dist-tag**). Specyfikacje Git/URL/plik oraz zakresy semver są odrzucane. Ze względów bezpieczeństwa instalacje zależności są wykonywane z opcją `--ignore-scripts` w jednym zarządzanym projekcie npm na każdy Plugin, nawet jeśli powłoka ma globalne ustawienia instalacji npm. Zarządzane projekty npm Pluginów dziedziczą ustawienia npm `overrides` na poziomie pakietu OpenClaw, dzięki czemu wymuszone przez hosta wersje zabezpieczeń dotyczą również wyniesionych zależności Pluginów.

    Użyj `npm:<package>`, aby jawnie wskazać rozwiązywanie przez npm. Podczas przejścia na nowy mechanizm uruchamiania specyfikacje samych pakietów są również instalowane bezpośrednio z npm, chyba że odpowiadają identyfikatorowi oficjalnego Pluginu.

    Surowe specyfikacje `@openclaw/*`, które odpowiadają dołączonym Pluginom, są rozwiązywane do dołączonej kopii należącej do obrazu przed użyciem npm jako rozwiązania zapasowego. Na przykład polecenie `openclaw plugins install @openclaw/discord@2026.5.20 --pin` używa dołączonego Pluginu Discord z bieżącej kompilacji OpenClaw zamiast tworzyć zarządzane nadpisanie npm. Aby wymusić użycie zewnętrznego pakietu npm, użyj `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Specyfikacje bez prefiksu i `@latest` pozostają w kanale stabilnym. Wersje poprawek OpenClaw oznaczone datą, takie jak `2026.5.3-1`, są na potrzeby tego sprawdzenia uznawane za stabilne. Jeśli npm rozwiąże którąkolwiek z tych form do wersji przedpremierowej, OpenClaw zatrzyma działanie i poprosi o jawne wyrażenie zgody za pomocą przedpremierowego znacznika (`@beta`/`@rc`) lub dokładnej wersji przedpremierowej (`@1.2.3-beta.4`).

    W przypadku instalacji npm bez dokładnej wersji (`npm:<package>` lub `npm:<package>@latest`) OpenClaw przed instalacją sprawdza metadane rozwiązanego pakietu. Jeśli najnowszy stabilny pakiet wymaga nowszego interfejsu API Pluginów OpenClaw lub nowszej minimalnej wersji hosta, OpenClaw sprawdza starsze stabilne wersje i instaluje najnowsze zgodne wydanie. Dokładne wersje i jawne znaczniki dist-tag pozostają rygorystyczne: niezgodny wybór kończy się błędem i prośbą o uaktualnienie OpenClaw lub wybranie zgodnej wersji.

    Jeśli specyfikacja instalacji bez prefiksu odpowiada identyfikatorowi oficjalnego Pluginu (na przykład `diffs`), OpenClaw instaluje bezpośrednio wpis z katalogu. Aby zainstalować pakiet npm o tej samej nazwie, użyj jawnej specyfikacji z zakresem (na przykład `@scope/diffs`).

  </Accordion>
  <Accordion title="Repozytoria Git">
    Użyj `git:<repo>`, aby zainstalować bezpośrednio z repozytorium Git. Obsługiwane formy: `git:github.com/owner/repo`, `git:owner/repo`, pełne adresy `https://`, `ssh://`, `git://`, `file://` oraz adresy klonowania `git@host:owner/repo.git`. Dodaj `@<ref>` lub `#<ref>`, aby przed instalacją przełączyć się na gałąź, znacznik lub zatwierdzenie.

    Instalacje Git klonują repozytorium do katalogu tymczasowego, przełączają się na żądane odwołanie, jeśli je podano, a następnie używają standardowego instalatora katalogów Pluginów. Dzięki temu walidacja manifestu, zasady instalacji operatora, instalowanie przez menedżera pakietów i rekordy instalacji działają tak samo jak przy instalacjach npm. Zarejestrowane instalacje Git zawierają adres URL/odwołanie źródła oraz rozwiązane zatwierdzenie, dzięki czemu `openclaw plugins update` może później ponownie rozwiązać źródło.

    Po instalacji z Git użyj `openclaw plugins inspect <id> --runtime --json`, aby zweryfikować rejestracje środowiska wykonawczego, takie jak metody Gateway i polecenia CLI. Jeśli Plugin zarejestrował główne polecenie CLI za pomocą `api.registerCli`, uruchom je bezpośrednio przez główne CLI OpenClaw, na przykład `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archiwa">
    Obsługiwane archiwa: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Natywne archiwa Pluginów OpenClaw muszą zawierać prawidłowy plik `openclaw.plugin.json` w katalogu głównym wyodrębnionego Pluginu; archiwa zawierające wyłącznie `package.json` są odrzucane, zanim OpenClaw zapisze rekordy instalacji.

    Użyj `npm-pack:<path.tgz>`, gdy plik jest archiwum tar utworzonym przez npm-pack i chcesz
    użyć tej samej ścieżki zarządzanego projektu npm dla każdego Pluginu, której używają instalacje z rejestru,
    w tym weryfikacji `package-lock.json`, skanowania wyniesionych zależności
    oraz rekordów instalacji npm. Zwykłe ścieżki archiwów nadal są instalowane jako lokalne
    archiwa w głównym katalogu rozszerzeń Pluginów.

    Obsługiwane są również instalacje z marketplace Claude.

  </Accordion>
</AccordionGroup>

Instalacje ClawHub używają jawnego lokalizatora `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Podczas przejścia na nowy mechanizm uruchamiania bezpieczne dla npm specyfikacje Pluginów bez prefiksu są domyślnie instalowane z npm, chyba że odpowiadają identyfikatorowi oficjalnego Pluginu:

```bash
openclaw plugins install openclaw-codex-app-server
```

Użyj `npm:`, aby jawnie ograniczyć rozwiązywanie wyłącznie do npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

Przed instalacją OpenClaw sprawdza deklarowaną zgodność interfejsu API Pluginu i minimalnej wersji Gateway. Gdy wybrana wersja ClawHub publikuje artefakt ClawPack, OpenClaw pobiera wersjonowane archiwum `.tgz` typu npm-pack, weryfikuje nagłówek skrótu ClawHub i skrót artefaktu, a następnie instaluje je standardową ścieżką archiwów. Starsze wersje ClawHub bez metadanych ClawPack nadal są instalowane za pomocą starszej ścieżki weryfikacji archiwum pakietu. Zarejestrowane instalacje zachowują metadane źródła ClawHub, rodzaj artefaktu, integralność npm, sumę kontrolną npm, nazwę archiwum tar oraz dane skrótu ClawPack na potrzeby późniejszych aktualizacji.
Instalacje ClawHub bez wersji zachowują niewersjonowaną zarejestrowaną specyfikację, dzięki czemu `openclaw plugins update` może śledzić nowsze wydania ClawHub; jawne selektory wersji lub znaczników, takie jak `clawhub:pkg@1.2.3` i `clawhub:pkg@beta`, pozostają przypięte do danego selektora.

### Skrócona składnia marketplace

Użyj skróconej składni `plugin@marketplace`, gdy nazwa marketplace istnieje w lokalnej pamięci podręcznej rejestru Claude w `~/.claude/plugins/known_marketplaces.json`:

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
    W przypadku zdalnych marketplace wczytywanych z GitHub lub Git wpisy Pluginów muszą pozostawać wewnątrz sklonowanego repozytorium marketplace. OpenClaw akceptuje źródła będące ścieżkami względnymi z tego repozytorium i odrzuca znajdujące się w zdalnych manifestach źródła Pluginów typu HTTP(S), ścieżki bezwzględne, Git, GitHub oraz inne źródła niebędące ścieżkami.
  </Tab>
</Tabs>

W przypadku lokalnych ścieżek i archiwów OpenClaw automatycznie wykrywa:

- natywne Pluginy OpenClaw (`openclaw.plugin.json`)
- pakiety zgodne z Codex (`.codex-plugin/plugin.json`)
- pakiety zgodne z Claude (`.claude-plugin/plugin.json` lub domyślny układ komponentów Claude, gdy ten plik manifestu nie istnieje)
- pakiety zgodne z Cursor (`.cursor-plugin/plugin.json`)

Zarządzane instalacje lokalne muszą być katalogami lub archiwami Pluginów. Samodzielne pliki Pluginów `.js`,
`.mjs`, `.cjs` i `.ts` nie są kopiowane do głównego katalogu zarządzanych Pluginów
przez `plugins install` ani wczytywane po umieszczeniu ich bezpośrednio w
`~/.openclaw/extensions` lub `<workspace>/.openclaw/extensions`; te automatycznie
wykrywane katalogi główne wczytują katalogi pakietów lub pakietów zbiorczych Pluginów i pomijają
pliki skryptów najwyższego poziomu jako lokalne pliki pomocnicze. Zamiast tego jawnie wymień samodzielne pliki w
`plugins.load.paths`.

<Note>
Zgodne pakiety są instalowane w standardowym katalogu głównym Pluginów i uczestniczą w tym samym procesie wyświetlania listy, informacji, włączania i wyłączania. Obecnie obsługiwane są Skills z pakietów, Skills poleceń Claude, wartości domyślne Claude z `settings.json`, wartości domyślne Claude z `.lsp.json` / zadeklarowane w manifeście `lspServers`, Skills poleceń Cursor oraz zgodne katalogi hooków Codex; inne wykryte możliwości pakietów są widoczne w diagnostyce/informacjach, ale nie są jeszcze podłączone do wykonywania w środowisku uruchomieniowym.
</Note>

Użyj `-l`/`--link`, aby wskazać lokalny katalog Pluginu bez jego kopiowania (zostanie
dodany do `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

Opcja `--link` nie jest obsługiwana razem z `--force` (połączone Pluginy wskazują bezpośrednio
na ścieżkę źródłową, więc nie ma czego nadpisywać w miejscu), `--marketplace` ani
instalacjami `git:` i wymaga istniejącej ścieżki lokalnej.

<Note>
Pluginy pochodzące z obszaru roboczego i wykryte w jego głównym katalogu rozszerzeń nie są
importowane ani wykonywane, dopóki nie zostaną jawnie włączone. Na potrzeby lokalnego programowania
uruchom `openclaw plugins enable <plugin-id>` lub ustaw
`plugins.entries.<plugin-id>.enabled: true`; jeśli konfiguracja używa
`plugins.allow`, umieść tam również ten sam identyfikator Pluginu. Ta reguła bezpiecznej odmowy
obowiązuje także wtedy, gdy konfiguracja kanału jawnie wskazuje Plugin pochodzący z obszaru roboczego do
wczytania wyłącznie na potrzeby konfiguracji, dlatego lokalny kod konfiguracji Pluginu kanału nie zostanie uruchomiony, dopóki
ten Plugin obszaru roboczego pozostaje wyłączony lub wykluczony z listy dozwolonych. Instalacje połączone
i jawne wpisy `plugins.load.paths` podlegają standardowym zasadom dotyczącym
rozwiązanego pochodzenia Pluginu. Zobacz
[Konfigurowanie zasad Pluginów](/pl/tools/plugin#configure-plugin-policy)
oraz [Dokumentację konfiguracji](/pl/gateway/configuration-reference#plugins).

Użyj `--pin` podczas instalacji npm, aby zapisać rozwiązaną dokładną specyfikację (`name@version`) w indeksie zarządzanych Pluginów, zachowując domyślne zachowanie bez przypinania.
</Note>

## Lista

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Pokaż tylko włączone Pluginy.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Przełącz z widoku tabeli na osobne wiersze szczegółów każdego Pluginu z metadanymi formatu/źródła/pochodzenia/wersji/aktywacji.
</ParamField>
<ParamField path="--json" type="boolean">
  Spis w formacie do odczytu maszynowego wraz z diagnostyką rejestru i stanem instalacji zależności pakietów.
</ParamField>

<Note>
`plugins list` najpierw odczytuje utrwalony lokalny rejestr Pluginów, a gdy rejestr nie istnieje lub jest nieprawidłowy, korzysta z wyprowadzonego rozwiązania zapasowego opartego wyłącznie na manifestach. Polecenie jest przydatne do sprawdzania, czy Plugin jest zainstalowany, włączony i widoczny dla planowania zimnego uruchomienia, ale nie stanowi aktywnego sondowania środowiska uruchomieniowego już działającego procesu Gateway. Po zmianie kodu Pluginu, stanu włączenia, zasad hooków lub `plugins.load.paths` uruchom ponownie Gateway obsługujący kanał, zanim zaczniesz oczekiwać wykonania nowego kodu `register(api)` lub hooków. W przypadku wdrożeń zdalnych lub kontenerowych sprawdź, czy uruchamiasz ponownie właściwy proces potomny `openclaw gateway run`, a nie tylko proces opakowujący.

`plugins list --json` zawiera `dependencyStatus` każdego Pluginu na podstawie pól
`dependencies` i `optionalDependencies` pliku `package.json`. OpenClaw sprawdza, czy nazwy tych
pakietów są obecne w standardowej ścieżce wyszukiwania `node_modules` środowiska Node danego Pluginu; nie
importuje kodu środowiska uruchomieniowego Pluginu, nie uruchamia menedżera pakietów ani nie naprawia
brakujących zależności.
</Note>

Jeśli podczas uruchamiania pojawi się komunikat `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
uruchom `openclaw plugins list --enabled --verbose` lub
`openclaw plugins inspect <id>` z identyfikatorem Pluginu z listy, aby potwierdzić identyfikatory
Pluginów i skopiować zaufane identyfikatory do `plugins.allow` w `openclaw.json`. Gdy
ostrzeżenie może wymienić wszystkie wykryte Pluginy, wyświetla gotowy do wklejenia
fragment `plugins.allow`, który już zawiera te identyfikatory. Jeśli Plugin zostanie wczytany
bez informacji o pochodzeniu z instalacji lub ścieżki wczytywania, sprawdź ten identyfikator Pluginu, a następnie
przypnij zaufany identyfikator w `plugins.allow` albo ponownie zainstaluj Plugin z zaufanego źródła,
aby OpenClaw zarejestrował pochodzenie instalacji.

Podczas pracy nad dołączonym Pluginem wewnątrz spakowanego obrazu Docker zamontuj przez bind katalog
źródłowy Pluginu w odpowiadającej mu spakowanej ścieżce źródłowej, na przykład
`/app/extensions/synology-chat`. OpenClaw wykrywa tę zamontowaną nakładkę źródłową
przed `/app/dist/extensions/synology-chat`; zwykły skopiowany katalog źródłowy
pozostaje nieaktywny, dzięki czemu standardowe instalacje pakietowe nadal używają skompilowanego katalogu dist.

Do debugowania hooków środowiska uruchomieniowego:

- `openclaw plugins inspect <id> --runtime --json` pokazuje zarejestrowane hooki i diagnostykę z przebiegu inspekcji z załadowanym modułem. Inspekcja środowiska uruchomieniowego nigdy nie instaluje zależności; użyj `openclaw doctor --fix`, aby wyczyścić stan starszych zależności lub odzyskać brakujące, możliwe do pobrania pluginy, do których odwołuje się konfiguracja.
- `openclaw gateway status --deep --require-rpc` potwierdza osiągalny adres URL/profil Gateway, wskazówki dotyczące usługi/procesu, ścieżkę konfiguracji i stan RPC.
- Niewbudowane hooki konwersacji (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) wymagają ustawienia `plugins.entries.<id>.hooks.allowConversationAccess=true`.

### Indeks pluginów

Metadane instalacji pluginów są stanem zarządzanym maszynowo, a nie konfiguracją użytkownika. Instalacje i aktualizacje zapisują je we współdzielonej bazie stanu SQLite w aktywnym katalogu stanu OpenClaw. Wiersz `installed_plugin_index` przechowuje trwałe metadane `installRecords`, w tym rekordy uszkodzonych lub brakujących manifestów pluginów, a także wyprowadzoną z manifestów pamięć podręczną zimnego rejestru używaną przez `openclaw plugins update`, dezinstalację, diagnostykę i zimny rejestr pluginów.

Gdy OpenClaw wykryje w konfiguracji dostarczone starsze rekordy `plugins.installs`, środowisko uruchomieniowe odczytuje je jako dane zgodności bez przepisywania pliku `openclaw.json`. Jawne operacje zapisu pluginów oraz `openclaw doctor --fix` przenoszą te rekordy do indeksu pluginów i usuwają klucz konfiguracji, gdy zapis konfiguracji jest dozwolony; jeśli którykolwiek zapis się nie powiedzie, rekordy konfiguracji są zachowywane, aby metadane instalacji nie zostały utracone.

## Dezinstalacja

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` usuwa rekordy pluginu z `plugins.entries`, utrwalonego indeksu pluginów, wpisów na listach dozwolonych/zabronionych pluginów oraz powiązanych wpisów `plugins.load.paths`, jeśli ma to zastosowanie. Jeśli nie ustawiono `--keep-files`, dezinstalacja usuwa również śledzony katalog zarządzanej instalacji, ale tylko wtedy, gdy znajduje się on w katalogu głównym rozszerzeń pluginów OpenClaw. Jeśli plugin jest obecnie właścicielem miejsca `memory` lub `contextEngine`, miejsce to zostaje przywrócone do wartości domyślnej (`memory-core` dla pamięci, `legacy` dla silnika kontekstu).

`uninstall` wyświetla podgląd elementów, które zostaną usunięte, a następnie przed wprowadzeniem zmian wyświetla monit `Odinstalować plugin "<id>"?`. Przekaż `--force`, aby pominąć monit o potwierdzenie (przydatne w skryptach i uruchomieniach nieinteraktywnych); bez tej flagi dezinstalacja wymaga interaktywnego terminala TTY. `--dry-run` wyświetla ten sam podgląd i kończy działanie bez wyświetlania monitu ani wprowadzania zmian.

<Note>
`--keep-config` jest obsługiwane jako przestarzały alias flagi `--keep-files`.
</Note>

## Aktualizacja

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Aktualizacje dotyczą śledzonych instalacji pluginów w zarządzanym indeksie pluginów oraz śledzonych instalacji pakietów hooków w `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Rozstrzyganie identyfikatora pluginu i specyfikacji npm">
    Gdy przekazujesz identyfikator pluginu, OpenClaw ponownie wykorzystuje zapisaną specyfikację instalacji tego pluginu. Oznacza to, że zapisane wcześniej tagi dystrybucyjne, takie jak `@beta`, oraz dokładnie przypięte wersje są nadal używane podczas kolejnych uruchomień `update <id>`.

    Podczas `update <id> --dry-run` dokładnie przypięte instalacje npm pozostają przypięte. Jeśli OpenClaw może również ustalić domyślną linię wydań pakietu w rejestrze, a jest ona nowsza niż zainstalowana przypięta wersja, przebieg próbny zgłasza przypięcie i wyświetla jawne polecenie aktualizacji pakietu do `@latest`, pozwalające przejść na domyślną linię wydań rejestru.

    Ta reguła aktualizacji konkretnego pluginu różni się od zbiorczej ścieżki konserwacji `openclaw plugins update --all`. Aktualizacje zbiorcze nadal respektują zwykłe śledzone specyfikacje instalacji, ale rekordy zaufanych oficjalnych pluginów OpenClaw mogą zostać zsynchronizowane z bieżącą wersją docelową oficjalnego katalogu zamiast pozostawać przy nieaktualnym, dokładnie wskazanym oficjalnym pakiecie. Użyj ukierunkowanego polecenia `update <id>`, jeśli celowo chcesz pozostawić dokładną lub oznaczoną tagiem oficjalną specyfikację bez zmian.

    W przypadku instalacji npm możesz również przekazać jawną specyfikację pakietu npm z tagiem dystrybucyjnym lub dokładną wersją. OpenClaw mapuje nazwę tego pakietu z powrotem na śledzony rekord pluginu, aktualizuje zainstalowany plugin i zapisuje nową specyfikację npm na potrzeby przyszłych aktualizacji opartych na identyfikatorze.

    Przekazanie nazwy pakietu npm bez wersji lub tagu również powoduje jej zmapowanie na śledzony rekord pluginu. Użyj tego, gdy plugin był przypięty do dokładnej wersji i chcesz przenieść go z powrotem na domyślną linię wydań rejestru.

  </Accordion>
  <Accordion title="Aktualizacje kanału beta">
    Ukierunkowane polecenie `openclaw plugins update <id-or-npm-spec>` ponownie wykorzystuje śledzoną specyfikację pluginu, chyba że przekażesz nową. Zbiorcze polecenie `openclaw plugins update --all` używa skonfigurowanego `update.channel`, gdy synchronizuje rekordy zaufanych oficjalnych pluginów z wersją docelową oficjalnego katalogu, dzięki czemu instalacje z kanału beta mogą pozostać na linii wydań beta zamiast być niejawnie normalizowane do wersji stabilnej/najnowszej.

    `openclaw update` zna również aktywny kanał aktualizacji OpenClaw: na kanale beta rekordy pluginów npm i ClawHub z domyślnej linii najpierw próbują użyć `@beta`. Jeśli wydanie beta pluginu nie istnieje, wracają do zapisanej specyfikacji domyślnej/najnowszej; pluginy npm korzystają również z tego mechanizmu, gdy pakiet beta istnieje, ale nie przechodzi walidacji instalacji. Taki powrót jest zgłaszany jako ostrzeżenie i nie powoduje niepowodzenia aktualizacji rdzenia. Dokładne wersje i jawne tagi pozostają przypięte do danego selektora podczas aktualizacji ukierunkowanych.

  </Accordion>
  <Accordion title="Kontrole wersji i rozbieżność integralności">
    Przed właściwą aktualizacją npm OpenClaw sprawdza wersję zainstalowanego pakietu względem metadanych rejestru npm. Jeśli zainstalowana wersja i zapisana tożsamość artefaktu są już zgodne z ustaloną wersją docelową, aktualizacja jest pomijana bez pobierania, ponownej instalacji ani przepisywania pliku `openclaw.json`.

    Gdy istnieje zapisany skrót integralności, a skrót pobranego artefaktu uległ zmianie, OpenClaw traktuje to jako rozbieżność artefaktu npm. Interaktywne polecenie `openclaw plugins update` wyświetla oczekiwany i rzeczywisty skrót oraz prosi o potwierdzenie przed kontynuowaniem. Nieinteraktywne mechanizmy pomocnicze aktualizacji bezpiecznie przerywają działanie, chyba że wywołujący dostarczy jawną zasadę kontynuacji.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install podczas aktualizacji">
    `--dangerously-force-unsafe-install` jest również akceptowane przez `plugins update` ze względu na zgodność, ale jest przestarzałe i nie zmienia już zachowania aktualizacji pluginów. Ustawienie operatora `security.installPolicy` nadal może blokować aktualizacje; hooki pluginu `before_install` mają zastosowanie tylko w procesach, w których załadowano hooki pluginów.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk podczas aktualizacji">
    Aktualizacje pluginów społecznościowych opartych na ClawHub przed pobraniem pakietu zastępczego przeprowadzają tę samą kontrolę zaufania dla konkretnego wydania co instalacje. Użyj `--acknowledge-clawhub-risk` w sprawdzonej automatyzacji, która powinna kontynuować, gdy wybrane wydanie ClawHub ma ostrzeżenie o ryzyku dotyczącym zaufania. Oficjalne pakiety ClawHub i wbudowane źródła pluginów OpenClaw pomijają ten monit dotyczący zaufania do wydania.
  </Accordion>
</AccordionGroup>

## Inspekcja

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

Inspekcja pokazuje tożsamość, stan ładowania, źródło, możliwości manifestu, flagi zasad, diagnostykę, metadane instalacji, możliwości pakietu oraz wszelką wykrytą obsługę serwerów MCP lub LSP, domyślnie bez importowania środowiska uruchomieniowego pluginu. Dane wyjściowe JSON obejmują kontrakty manifestu pluginu, takie jak `contracts.agentToolResultMiddleware` i `contracts.trustedToolPolicies`, dzięki czemu operatorzy mogą kontrolować deklaracje zaufanych powierzchni przed włączeniem lub ponownym uruchomieniem pluginu. Dodaj `--runtime`, aby załadować moduł pluginu i uwzględnić zarejestrowane hooki, narzędzia, polecenia, usługi, metody Gateway i trasy HTTP. Inspekcja środowiska uruchomieniowego bezpośrednio zgłasza brakujące zależności pluginu; instalacje i naprawy pozostają w gestii `openclaw plugins install`, `openclaw plugins update` oraz `openclaw doctor --fix`.

Polecenia CLI należące do pluginów są zwykle instalowane jako główne grupy poleceń `openclaw`, ale pluginy mogą również rejestrować zagnieżdżone polecenia pod nadrzędnym poleceniem rdzenia, takim jak `openclaw nodes`. Gdy `inspect --runtime` pokaże polecenie w `cliCommands`, uruchom je pod wskazaną ścieżką; na przykład plugin rejestrujący `demo-git` można zweryfikować za pomocą `openclaw demo-git ping`.

Każdy plugin jest klasyfikowany według tego, co faktycznie rejestruje w czasie działania:

| Kształt              | Znaczenie                                                                       |
| -------------------- | ------------------------------------------------------------------------------- |
| `plain-capability`   | dokładnie jeden typ możliwości (np. plugin wyłącznie dostawcy)                  |
| `hybrid-capability`  | więcej niż jeden typ możliwości (np. tekst + mowa + obrazy)                     |
| `hook-only`          | tylko hooki, bez możliwości, narzędzi, poleceń, usług ani tras                   |
| `non-capability`     | narzędzia/polecenia/usługi, ale bez możliwości                                  |

Więcej informacji o modelu możliwości zawiera sekcja [Kształty pluginów](/pl/plugins/architecture#plugin-shapes).

<Note>
Flaga `--json` generuje raport w formacie przeznaczonym do odczytu maszynowego, odpowiedni do skryptów i audytów. `inspect --all` wyświetla tabelę całej floty z kolumnami kształtu, rodzajów możliwości, uwag dotyczących zgodności, możliwości pakietu i podsumowania hooków. `info` jest aliasem polecenia `inspect`.
</Note>

## Diagnostyka

```bash
openclaw plugins doctor
```

`doctor` zgłasza błędy ładowania pluginów, diagnostykę manifestów/wykrywania, uwagi dotyczące zgodności oraz nieaktualne odwołania konfiguracji pluginów, takie jak brakujące miejsca pluginów. Gdy drzewo instalacji i konfiguracja pluginów nie zawierają problemów, wyświetla `Nie wykryto problemów z pluginami.` Jeśli pozostaje nieaktualna konfiguracja, ale drzewo instalacji jest poza tym prawidłowe, podsumowanie wskazuje ten stan zamiast sugerować pełną prawidłowość pluginów.

Jeśli skonfigurowany plugin znajduje się na dysku, ale jest blokowany przez mechanizmy kontroli bezpieczeństwa ścieżek modułu ładującego, walidacja konfiguracji zachowuje wpis pluginu i zgłasza go jako `obecny, ale zablokowany`. Zamiast usuwać konfigurację `plugins.entries.<id>` lub `plugins.allow`, napraw poprzedzającą diagnostykę zablokowanego pluginu, na przykład własność ścieżki albo uprawnienia do zapisu dla wszystkich użytkowników.

W przypadku błędów kształtu modułu, takich jak brak eksportów `register`/`activate`, uruchom ponownie z ustawieniem `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, aby dane diagnostyczne zawierały zwięzłe podsumowanie kształtu eksportów.

## Rejestr

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Lokalny rejestr pluginów jest utrwalonym w OpenClaw zimnym modelem odczytu tożsamości zainstalowanych pluginów, ich włączenia, metadanych źródła oraz własności wkładu. Zwykłe uruchamianie, wyszukiwanie właściciela dostawcy, klasyfikacja konfiguracji kanału oraz inwentaryzacja pluginów mogą go odczytywać bez importowania modułów środowiska uruchomieniowego pluginów.

Użyj `plugins registry`, aby sprawdzić, czy utrwalony rejestr istnieje, jest aktualny lub nieaktualny. Użyj `--refresh`, aby odbudować go na podstawie utrwalonego indeksu pluginów, zasad konfiguracji oraz metadanych manifestów/pakietów. Jest to ścieżka naprawy, a nie ścieżka aktywacji środowiska uruchomieniowego.

`openclaw doctor --fix` naprawia również powiązaną z rejestrem rozbieżność w zarządzanych pakietach npm: jeśli osierocony lub odzyskany pakiet `@openclaw/*` w zarządzanym projekcie npm pluginu albo w starszym płaskim katalogu głównym zarządzanego npm przesłania wbudowany plugin, narzędzie doctor usuwa ten nieaktualny pakiet i odbudowuje rejestr, aby podczas uruchamiania walidować względem wbudowanego manifestu. Doctor ponownie wiąże również pakiet hosta `openclaw` z zarządzanymi pluginami npm deklarującymi `peerDependencies.openclaw`, dzięki czemu lokalne dla pakietu importy środowiska uruchomieniowego, takie jak `openclaw/plugin-sdk/*`, są rozwiązywane po aktualizacjach lub naprawach npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` to przestarzały awaryjny przełącznik zgodności na wypadek błędów odczytu rejestru. Preferuj `plugins registry --refresh` lub `openclaw doctor --fix`; mechanizm zastępczy oparty na zmiennej środowiskowej służy wyłącznie do awaryjnego odzyskiwania podczas uruchamiania w trakcie wdrażania migracji.
</Warning>

## Rynek pluginów

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

Polecenie `plugins marketplace entries` wyświetla wpisy ze skonfigurowanego kanału marketplace OpenClaw. Domyślnie próbuje użyć hostowanego kanału, a w razie niepowodzenia korzysta z najnowszej zaakceptowanej migawki lub wbudowanych danych. Użyj `--feed-profile <name>`, aby odczytać określony skonfigurowany profil, `--feed-url <url>`, aby odczytać jawnie wskazany adres URL hostowanego kanału, oraz `--offline`, aby odczytać najnowszą zaakceptowaną migawkę bez pobierania kanału.

Polecenie `plugins marketplace refresh` odświeża skonfigurowaną migawkę hostowanego kanału i informuje, czy OpenClaw zaakceptował hostowane dane, hostowaną migawkę czy wbudowane dane zapasowe. Użyj `--expected-sha256`, gdy wywołujący wymaga, aby polecenie zakończyło się niepowodzeniem, jeśli nowy hostowany ładunek nie jest zgodny z przypiętą sumą kontrolną.

Polecenie `list` marketplace przyjmuje lokalną ścieżkę marketplace, ścieżkę do pliku `marketplace.json`, skróconą nazwę GitHub, taką jak `owner/repo`, adres URL repozytorium GitHub lub adres URL git. Opcja `--json` wyświetla etykietę rozpoznanego źródła wraz z przeanalizowanym manifestem marketplace i wpisami pluginów.

Odświeżanie marketplace wczytuje hostowany kanał marketplace OpenClaw i zapisuje
zweryfikowaną odpowiedź jako lokalną migawkę hostowanego kanału. Bez opcji używa
skonfigurowanego domyślnego profilu kanału. Użyj `--feed-profile <name>`, aby odświeżyć
określony skonfigurowany profil, `--feed-url <url>`, aby odświeżyć jawnie wskazany adres URL
hostowanego kanału, `--expected-sha256 <sha256>`, aby wymagać zgodnej sumy kontrolnej ładunku
(`sha256:<hex>` lub niepoprzedzony prefiksem 64-znakowy skrót szesnastkowy), oraz `--json`, aby uzyskać
dane wyjściowe przeznaczone do przetwarzania maszynowego. Jawnie wskazane adresy URL hostowanego kanału nie mogą zawierać
danych uwierzytelniających, ciągów zapytania ani fragmentów. Odświeżenia bez przypiętej sumy mogą zgłosić
wynik oparty na hostowanej migawce lub wbudowanych danych zapasowych bez powodowania niepowodzenia polecenia. Przypięte
odświeżenia kończą się niepowodzeniem, jeśli nie zaakceptują nowego hostowanego ładunku, a pomyślne hostowane
odświeżenia kończą się niepowodzeniem, jeśli OpenClaw nie może zapisać zweryfikowanej migawki.

## Powiązane

- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Dokumentacja CLI](/pl/cli)
- [ClawHub](/clawhub)
