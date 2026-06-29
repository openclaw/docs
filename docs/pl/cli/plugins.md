---
read_when:
    - Chcesz zainstalować Pluginy Gateway lub zgodne pakiety albo nimi zarządzać
    - Chcesz utworzyć szkielet lub zweryfikować prosty Plugin narzędziowy
    - Chcesz debugować błędy ładowania Plugin
sidebarTitle: Plugins
summary: Dokumentacja referencyjna CLI dla `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Pluginy
x-i18n:
    generated_at: "2026-06-28T22:33:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 528a7ead224eab330bc0a83314d205a68c7f814ad336441aee7b19170c105e43
    source_path: cli/plugins.md
    workflow: 16
---

Zarządzaj Plugin Gateway, pakietami hooków i zgodnymi pakietami.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/pl/tools/plugin">
    Przewodnik dla użytkownika końcowego dotyczący instalowania, włączania i rozwiązywania problemów z pluginami.
  </Card>
  <Card title="Manage plugins" href="/pl/plugins/manage-plugins">
    Szybkie przykłady instalowania, wyświetlania listy, aktualizowania, odinstalowywania i publikowania.
  </Card>
  <Card title="Plugin bundles" href="/pl/plugins/bundles">
    Model zgodności pakietów.
  </Card>
  <Card title="Plugin manifest" href="/pl/plugins/manifest">
    Pola manifestu i schemat konfiguracji.
  </Card>
  <Card title="Security" href="/pl/gateway/security">
    Wzmacnianie zabezpieczeń instalacji pluginów.
  </Card>
</CardGroup>

## Polecenia

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile clawhub-public --json
openclaw plugins marketplace refresh --feed-url https://clawhub.ai/v1/feeds/plugins --expected-sha256 <sha256>
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

Aby zbadać powolną instalację, inspekcję, odinstalowanie lub odświeżanie rejestru, uruchom
polecenie z `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Ślad zapisuje czasy faz
do stderr i zachowuje możliwość parsowania wyjścia JSON. Zobacz [Debugowanie](/pl/help/debugging#plugin-lifecycle-trace).

<Note>
W trybie Nix (`OPENCLAW_NIX_MODE=1`) mutatory cyklu życia pluginów są wyłączone. Dla tej instalacji użyj źródła Nix zamiast `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` lub `plugins disable`; dla nix-openclaw użyj zorientowanego na agenta [Szybkiego startu](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Pluginy dołączone są dostarczane z OpenClaw. Niektóre są domyślnie włączone (na przykład dołączone dostawcy modeli, dołączeni dostawcy mowy i dołączony plugin przeglądarki); inne wymagają `plugins enable`.

Natywne pluginy OpenClaw muszą dostarczać `openclaw.plugin.json` z wbudowanym JSON Schema (`configSchema`, nawet jeśli jest pusty). Zgodne pakiety używają zamiast tego własnych manifestów pakietów.

`plugins list` pokazuje `Format: openclaw` lub `Format: bundle`. Szczegółowe wyjście listy/informacji pokazuje także podtyp pakietu (`codex`, `claude` lub `cursor`) oraz wykryte możliwości pakietu.
</Note>

### Autor

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` domyślnie tworzy minimalny plugin narzędzia w TypeScript. Pierwszy
argument to id pluginu; przekaż `--name`, aby ustawić nazwę wyświetlaną. OpenClaw używa
id jako domyślnego katalogu wyjściowego i nazwy pakietu. Szkielety narzędzi używają
`defineToolPlugin`.
`plugins build` importuje zbudowany punkt wejścia, odczytuje jego statyczne metadane narzędzia, zapisuje
`openclaw.plugin.json` i utrzymuje `package.json` `openclaw.extensions` w zgodności.
`plugins validate` sprawdza, czy wygenerowany manifest, metadane pakietu i
bieżący eksport punktu wejścia nadal są zgodne. Zobacz [Pluginy narzędzi](/pl/plugins/tool-plugins), aby poznać
pełny proces tworzenia narzędzi.

Szkielet zapisuje źródła TypeScript, ale generuje metadane z zbudowanego
punktu wejścia `./dist/index.js`, więc przepływ działa także z opublikowanym CLI. Użyj
`--entry <path>`, gdy punkt wejścia nie jest domyślnym punktem wejścia pakietu. Użyj
`plugins build --check` w CI, aby zakończyć niepowodzeniem, gdy wygenerowane metadane są nieaktualne, bez
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

Szkielety dostawców tworzą generyczny plugin dostawcy tekstu/modelu z zgodną z OpenAI
obsługą kluczy API, wbudowanym skryptem `npm run validate` dla `clawhub package
validate`, metadanymi pakietu ClawHub oraz ręcznie uruchamianym przepływem GitHub
do przyszłego zaufanego publikowania przez GitHub Actions OIDC. Szkielety dostawców nie
generują Skills i nie używają `openclaw plugins build` ani
`openclaw plugins validate`; te polecenia są przeznaczone dla ścieżki wygenerowanych metadanych
szkieletu narzędzia.

Przed publikacją zastąp zastępczy bazowy URL API, katalog modeli, trasę dokumentacji,
tekst poświadczeń i treść README rzeczywistymi szczegółami dostawcy. Użyj
wygenerowanego README do pierwszej publikacji w ClawHub i konfiguracji zaufanego wydawcy.

### Instalacja

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # source auto-detection
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Opiekunowie testujący instalacje wykonywane podczas konfiguracji mogą nadpisać automatyczne źródła instalacji pluginów
za pomocą chronionych zmiennych środowiskowych. Zobacz
[Nadpisania instalacji pluginów](/pl/plugins/install-overrides).

<Warning>
Gołe nazwy pakietów są domyślnie instalowane z npm podczas przełączenia startowego, chyba że odpowiadają oficjalnemu id pluginu. Surowe specyfikacje pakietów `@openclaw/*`, które odpowiadają dołączonym pluginom, używają dołączonej kopii dostarczonej z bieżącą kompilacją OpenClaw. Użyj `npm:<package>`, gdy celowo chcesz zamiast tego użyć zewnętrznego pakietu npm. Użyj `clawhub:<package>` dla ClawHub. Traktuj instalowanie pluginów jak uruchamianie kodu. Preferuj przypięte wersje.
</Warning>

`plugins search` odpytuje ClawHub o możliwe do zainstalowania pakiety pluginów i wypisuje
gotowe do instalacji nazwy pakietów. Wyszukuje pakiety code-plugin i bundle-plugin,
a nie Skills. Użyj `openclaw skills search` dla Skills z ClawHub.

<Note>
ClawHub jest podstawową powierzchnią dystrybucji i odkrywania dla większości pluginów. Npm
pozostaje obsługiwaną ścieżką awaryjną i bezpośredniej instalacji. Należące do OpenClaw
pakiety pluginów `@openclaw/*` są ponownie publikowane w npm; zobacz bieżącą listę
na [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) lub w
[inwentarzu pluginów](/pl/plugins/plugin-inventory). Stabilne instalacje używają `latest`.
Instalacje i aktualizacje z kanału beta preferują dist-tag npm `beta`, gdy ten tag
jest dostępny, a następnie wracają do `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    Jeśli sekcja `plugins` jest wspierana przez jednoplikowe `$include`, `plugins install/update/enable/disable/uninstall` zapisuje do tego dołączonego pliku i pozostawia `openclaw.json` bez zmian. Dołączenia główne, tablice dołączeń i dołączenia z sąsiednimi nadpisaniami kończą się zamknięciem z błędem zamiast spłaszczania. Zobacz [Dołączenia konfiguracji](/pl/gateway/configuration), aby poznać obsługiwane kształty.

    Jeśli konfiguracja jest nieprawidłowa podczas instalacji, `plugins install` zwykle kończy się zamknięciem z błędem i informuje, aby najpierw uruchomić `openclaw doctor --fix`. Podczas uruchamiania Gateway i gorącego przeładowania nieprawidłowa konfiguracja pluginu kończy się zamknięciem z błędem tak jak każda inna nieprawidłowa konfiguracja; `openclaw doctor --fix` może poddać kwarantannie nieprawidłowy wpis pluginu. Jedynym udokumentowanym wyjątkiem w czasie instalacji jest wąska ścieżka odzyskiwania dołączonego pluginu dla pluginów, które jawnie wybierają `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` ponownie używa istniejącego celu instalacji i nadpisuje już zainstalowany plugin lub pakiet hooków w miejscu. Użyj tego, gdy celowo ponownie instalujesz ten sam id z nowej ścieżki lokalnej, archiwum, pakietu ClawHub lub artefaktu npm. Do rutynowych aktualizacji już śledzonego pluginu npm preferuj `openclaw plugins update <id-or-npm-spec>`.

    Jeśli uruchomisz `plugins install` dla id pluginu, który jest już zainstalowany, OpenClaw zatrzyma się i wskaże `plugins update <id-or-npm-spec>` dla zwykłej aktualizacji albo `plugins install <package> --force`, gdy naprawdę chcesz nadpisać bieżącą instalację z innego źródła.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` dotyczy tylko instalacji npm. Nie jest obsługiwane z instalacjami `git:`; użyj jawnego odwołania git, takiego jak `git:github.com/acme/plugin@v1.2.3`, gdy chcesz przypięte źródło. Nie jest obsługiwane z `--marketplace`, ponieważ instalacje z marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` jest przestarzałe i teraz nie wykonuje żadnej operacji. OpenClaw nie uruchamia już wbudowanego blokowania niebezpiecznego kodu w czasie instalacji dla instalacji pluginów.

    Użyj współdzielonej, należącej do operatora powierzchni `security.installPolicy`, gdy wymagana jest specyficzna dla hosta polityka instalacji. Hooki pluginu `before_install` są hookami cyklu życia środowiska uruchomieniowego pluginu i nie są podstawową granicą polityki dla instalacji CLI.

    Jeśli plugin opublikowany przez Ciebie w ClawHub jest ukryty lub zablokowany przez skan rejestru, użyj kroków wydawcy w [Publikowanie w ClawHub](/pl/clawhub/publishing). `--dangerously-force-unsafe-install` nie prosi ClawHub o ponowne przeskanowanie pluginu ani o upublicznienie zablokowanego wydania.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Społecznościowe instalacje ClawHub sprawdzają rekord zaufania wybranego wydania przed pobraniem pakietu. Jeśli ClawHub wyłączy pobieranie dla wydania, zgłosi złośliwe wyniki skanowania albo umieści wydanie w blokującym stanie moderacji, takim jak kwarantanna, OpenClaw odrzuci wydanie. W przypadku nieblokujących ryzykownych statusów skanowania, ryzykownych stanów moderacji lub powodów rejestru OpenClaw pokazuje szczegóły zaufania i prosi o potwierdzenie przed kontynuowaniem.

    Użyj `--acknowledge-clawhub-risk` tylko po przejrzeniu ostrzeżenia ClawHub i podjęciu decyzji o kontynuowaniu bez interaktywnego monitu. Oczekujące lub nieaktualne czyste rekordy zaufania ostrzegają, ale nie wymagają potwierdzenia. Oficjalne pakiety ClawHub i dołączone źródła pluginów OpenClaw pomijają ten monit zaufania wydania.

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` jest także powierzchnią instalacji dla pakietów hooków, które udostępniają `openclaw.hooks` w `package.json`. Użyj `openclaw hooks` do filtrowanej widoczności hooków i włączania poszczególnych hooków, a nie do instalacji pakietów.

    Specyfikacje Npm są **wyłącznie rejestrowe** (nazwa pakietu + opcjonalna **dokładna wersja** lub **dist-tag**). Specyfikacje Git/URL/file oraz zakresy semver są odrzucane. Instalacje zależności działają w jednym zarządzanym projekcie npm na plugin z `--ignore-scripts` dla bezpieczeństwa, nawet gdy Twoja powłoka ma globalne ustawienia instalacji npm. Zarządzane projekty npm pluginów dziedziczą pakietowe `overrides` npm OpenClaw, więc piny bezpieczeństwa hosta obejmują też wyniesione zależności pluginów.

    Użyj `npm:<package>`, gdy chcesz jawnie wskazać rozwiązywanie przez npm. Gołe specyfikacje pakietów także instalują bezpośrednio z npm podczas przejścia startowego, chyba że pasują do oficjalnego identyfikatora pluginu.

    Surowe specyfikacje pakietów `@openclaw/*`, które pasują do dołączonych pluginów, są rozwiązywane do kopii dołączonej i należącej do obrazu przed awaryjnym przejściem do npm. Na przykład `openclaw plugins install @openclaw/discord@2026.5.20 --pin` używa dołączonego pluginu Discord z bieżącej kompilacji OpenClaw zamiast tworzyć zarządzane nadpisanie npm. Aby wymusić zewnętrzny pakiet npm, użyj `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Gołe specyfikacje i `@latest` pozostają na stabilnej ścieżce. Wersje poprawek OpenClaw oznaczone datą, takie jak `2026.5.3-1`, są stabilnymi wydaniami dla tego sprawdzenia. Jeśli npm rozwiąże którąkolwiek z nich do wersji przedwydaniowej, OpenClaw zatrzyma się i poprosi o jawne wyrażenie zgody przy użyciu tagu przedwydaniowego, takiego jak `@beta`/`@rc`, albo dokładnej wersji przedwydaniowej, takiej jak `@1.2.3-beta.4`.

    W przypadku instalacji npm bez dokładnej wersji (`npm:<package>` lub `npm:<package>@latest`) OpenClaw sprawdza rozwiązaną metadane pakietu przed instalacją. Jeśli najnowszy stabilny pakiet wymaga nowszego API pluginów OpenClaw albo minimalnej wersji hosta, OpenClaw sprawdza starsze stabilne wersje i instaluje zamiast tego najnowsze zgodne wydanie. Dokładne wersje i jawne dist-tagi, takie jak `@beta`, pozostają rygorystyczne: jeśli wybrany pakiet jest niezgodny, polecenie kończy się niepowodzeniem i prosi o uaktualnienie OpenClaw albo wybranie zgodnej wersji.

    Jeśli goła specyfikacja instalacji pasuje do oficjalnego identyfikatora pluginu (na przykład `diffs`), OpenClaw instaluje bezpośrednio wpis katalogu. Aby zainstalować pakiet npm o tej samej nazwie, użyj jawnej specyfikacji z zakresem (na przykład `@scope/diffs`).

  </Accordion>
  <Accordion title="Repozytoria Git">
    Użyj `git:<repo>`, aby instalować bezpośrednio z repozytorium git. Obsługiwane formy obejmują `git:github.com/owner/repo`, `git:owner/repo`, pełne adresy klonowania `https://`, `ssh://`, `git://`, `file://` oraz `git@host:owner/repo.git`. Dodaj `@<ref>` lub `#<ref>`, aby przed instalacją przełączyć się na gałąź, tag albo commit.

    Instalacje Git klonują do katalogu tymczasowego, przełączają się na żądaną referencję, jeśli jest podana, a następnie używają zwykłego instalatora katalogu pluginu. Oznacza to, że walidacja manifestu, polityka instalacji operatora, praca instalacyjna menedżera pakietów i rekordy instalacji zachowują się tak jak przy instalacjach npm. Zarejestrowane instalacje git zawierają źródłowy URL/ref oraz rozwiązywany commit, aby `openclaw plugins update` mogło później ponownie rozwiązać źródło.

    Po instalacji z git użyj `openclaw plugins inspect <id> --runtime --json`, aby zweryfikować rejestracje runtime, takie jak metody Gateway i polecenia CLI. Jeśli plugin zarejestrował korzeń CLI za pomocą `api.registerCli`, wykonaj to polecenie bezpośrednio przez główny CLI OpenClaw, na przykład `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archiwa">
    Obsługiwane archiwa: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Natywne archiwa pluginów OpenClaw muszą zawierać poprawny `openclaw.plugin.json` w wyodrębnionym katalogu głównym pluginu; archiwa zawierające tylko `package.json` są odrzucane, zanim OpenClaw zapisze rekordy instalacji.

    Użyj `npm-pack:<path.tgz>`, gdy plik jest archiwum tarball npm-pack i chcesz
    przetestować tę samą ścieżkę zarządzanego projektu npm na plugin, której używają
    instalacje z rejestru, w tym weryfikację `package-lock.json`, skanowanie wyniesionych
    zależności i rekordy instalacji npm. Zwykłe ścieżki archiwów nadal instalują się jako lokalne
    archiwa pod katalogiem głównym rozszerzeń pluginów.

    Obsługiwane są także instalacje z marketplace Claude.

  </Accordion>
</AccordionGroup>

Instalacje ClawHub używają jawnego lokatora `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Gołe specyfikacje pluginów bezpieczne dla npm domyślnie instalują z npm podczas przejścia startowego, chyba że pasują do oficjalnego identyfikatora pluginu:

```bash
openclaw plugins install openclaw-codex-app-server
```

Użyj `npm:`, aby jawnie wskazać rozwiązywanie tylko przez npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw sprawdza deklarowaną zgodność API pluginu / minimalną zgodność Gateway przed instalacją. Gdy wybrana wersja ClawHub publikuje artefakt ClawPack, OpenClaw pobiera wersjonowany npm-pack `.tgz`, weryfikuje nagłówek skrótu ClawHub i skrót artefaktu, a następnie instaluje go przez zwykłą ścieżkę archiwum. Starsze wersje ClawHub bez metadanych ClawPack nadal instalują się przez starszą ścieżkę weryfikacji archiwum pakietu. Zarejestrowane instalacje przechowują metadane źródła ClawHub, rodzaj artefaktu, integralność npm, shasum npm, nazwę tarballa i fakty skrótu ClawPack na potrzeby późniejszych aktualizacji.
Niewersjonowane instalacje ClawHub zachowują niewersjonowaną zarejestrowaną specyfikację, aby `openclaw plugins update` mogło śledzić nowsze wydania ClawHub; jawne selektory wersji lub tagów, takie jak `clawhub:pkg@1.2.3` i `clawhub:pkg@beta`, pozostają przypięte do tego selektora.

#### Skrót marketplace

Użyj skrótu `plugin@marketplace`, gdy nazwa marketplace istnieje w lokalnej pamięci podręcznej rejestru Claude pod `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Użyj `--marketplace`, gdy chcesz jawnie przekazać źródło marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Źródła marketplace">
    - znana nazwa marketplace Claude z `~/.claude/plugins/known_marketplaces.json`
    - lokalny katalog główny marketplace albo ścieżka `marketplace.json`
    - skrót repozytorium GitHub, taki jak `owner/repo`
    - URL repozytorium GitHub, taki jak `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Reguły zdalnego marketplace">
    W przypadku zdalnych marketplace ładowanych z GitHub albo git wpisy pluginów muszą pozostać wewnątrz sklonowanego repozytorium marketplace. OpenClaw akceptuje względne źródła ścieżek z tego repozytorium i odrzuca HTTP(S), ścieżki bezwzględne, git, GitHub oraz inne nieścieżkowe źródła pluginów ze zdalnych manifestów.
  </Tab>
</Tabs>

Dla lokalnych ścieżek i archiwów OpenClaw wykrywa automatycznie:

- natywne pluginy OpenClaw (`openclaw.plugin.json`)
- pakiety zgodne z Codex (`.codex-plugin/plugin.json`)
- pakiety zgodne z Claude (`.claude-plugin/plugin.json` albo domyślny układ komponentów Claude)
- pakiety zgodne z Cursor (`.cursor-plugin/plugin.json`)

Zarządzane instalacje lokalne muszą być katalogami pluginów albo archiwami. Samodzielne pliki pluginów `.js`,
`.mjs`, `.cjs` i `.ts` nie są kopiowane do zarządzanego katalogu głównego pluginów
przez `plugins install`; zamiast tego wymień je jawnie w `plugins.load.paths`.

<Note>
Zgodne pakiety instalują się w zwykłym katalogu głównym pluginów i uczestniczą w tym samym przepływie list/info/enable/disable. Obecnie obsługiwane są Skills pakietu, command-skills Claude, domyślne wartości `settings.json` Claude, domyślne wartości `.lsp.json` Claude / zadeklarowane w manifeście `lspServers`, command-skills Cursor oraz zgodne katalogi hooków Codex; inne wykryte możliwości pakietu są pokazywane w diagnostyce/info, ale nie są jeszcze podłączone do wykonywania runtime.
</Note>

### Lista

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  Pokaż tylko włączone pluginy.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Przełącz z widoku tabeli na wiersze szczegółów dla każdego pluginu z metadanymi źródła/pochodzenia/wersji/aktywacji.
</ParamField>
<ParamField path="--json" type="boolean">
  Inwentarz czytelny maszynowo oraz diagnostyka rejestru i stan instalacji zależności pakietów.
</ParamField>

<Note>
`plugins list` najpierw odczytuje utrwalony lokalny rejestr pluginów, z awaryjnym wariantem pochodzącym wyłącznie z manifestów, gdy rejestru brakuje albo jest nieprawidłowy. Jest to przydatne do sprawdzenia, czy plugin jest zainstalowany, włączony i widoczny dla planowania zimnego startu, ale nie jest to sonda runtime działającego już procesu Gateway. Po zmianie kodu pluginu, włączenia, polityki hooków albo `plugins.load.paths` zrestartuj Gateway obsługujący kanał, zanim będziesz oczekiwać uruchomienia nowego kodu `register(api)` albo hooków. W przypadku wdrożeń zdalnych/kontenerowych upewnij się, że restartujesz właściwy proces potomny `openclaw gateway run`, a nie tylko proces opakowujący.

`plugins list --json` zawiera `dependencyStatus` każdego pluginu z `package.json`
`dependencies` i `optionalDependencies`. OpenClaw sprawdza, czy te nazwy pakietów
są obecne wzdłuż zwykłej ścieżki wyszukiwania `node_modules` Node dla pluginu; nie
importuje kodu runtime pluginu, nie uruchamia menedżera pakietów ani nie naprawia brakujących
zależności.
</Note>

Jeśli log startowy pokazuje `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
uruchom `openclaw plugins list --enabled --verbose` albo
`openclaw plugins inspect <id>` z wymienionym identyfikatorem pluginu, aby potwierdzić
identyfikatory pluginów i skopiować zaufane identyfikatory do `plugins.allow` w `openclaw.json`. Gdy
ostrzeżenie może wymienić każdy wykryty plugin, wypisuje gotowy do wklejenia
fragment `plugins.allow`, który już zawiera te identyfikatory. Jeśli plugin ładuje się
bez pochodzenia z instalacji/ścieżki ładowania, sprawdź ten identyfikator pluginu, a następnie albo przypnij
zaufany identyfikator w `plugins.allow`, albo zainstaluj plugin ponownie z zaufanego źródła,
aby OpenClaw zapisał pochodzenie instalacji.

`plugins search` to zdalne wyszukiwanie katalogu ClawHub. Nie sprawdza lokalnego
stanu, nie modyfikuje konfiguracji, nie instaluje pakietów ani nie ładuje kodu runtime pluginu. Wyniki
wyszukiwania zawierają nazwę pakietu ClawHub, rodzinę, kanał, wersję, podsumowanie oraz
wskazówkę instalacji, taką jak `openclaw plugins install clawhub:<package>`.

Podczas pracy nad dołączonym pluginem wewnątrz spakowanego obrazu Docker zamontuj bindem katalog
źródłowy pluginu na pasującą spakowaną ścieżkę źródłową, taką jak
`/app/extensions/synology-chat`. OpenClaw wykryje tę zamontowaną nakładkę źródeł
przed `/app/dist/extensions/synology-chat`; zwykły skopiowany katalog źródłowy
pozostaje nieaktywny, więc normalne spakowane instalacje nadal używają skompilowanego dist.

Do debugowania hooków runtime:

- `openclaw plugins inspect <id> --runtime --json` pokazuje zarejestrowane hooki i diagnostykę z przebiegu inspekcji z załadowaniem modułu. Inspekcja runtime nigdy nie instaluje zależności; użyj `openclaw doctor --fix`, aby wyczyścić starszy stan zależności albo odzyskać brakujące pobieralne pluginy, do których odwołuje się konfiguracja.
- `openclaw gateway status --deep --require-rpc` potwierdza osiągalny URL/profil Gateway, wskazówki usługi/procesu, ścieżkę konfiguracji i kondycję RPC.
- Niedowiązane hooki konwersacji (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) wymagają `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Użyj `--link`, aby uniknąć kopiowania lokalnego katalogu pluginu (dodaje do `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

Samodzielne pliki pluginów muszą być wymienione w `plugins.load.paths`, a nie
instalowane przez `plugins install` ani umieszczane bezpośrednio w `~/.openclaw/extensions`
lub `<workspace>/.openclaw/extensions`. Te automatycznie wykrywane katalogi główne ładują katalogi
pakietów albo pakietów pluginów, natomiast pliki skryptów najwyższego poziomu są traktowane jako lokalne
pomocnicze pliki i pomijane.

<Note>
Pluginy pochodzące z obszaru roboczego, wykryte z głównego katalogu rozszerzeń obszaru roboczego, nie są
importowane ani wykonywane, dopóki nie zostaną jawnie włączone. W lokalnym środowisku deweloperskim
uruchom `openclaw plugins enable <plugin-id>` albo ustaw
`plugins.entries.<plugin-id>.enabled: true`; jeśli konfiguracja używa
`plugins.allow`, uwzględnij tam również ten sam identyfikator pluginu. Ta reguła fail-closed
obowiązuje także wtedy, gdy konfiguracja kanału jawnie wskazuje plugin pochodzący z obszaru roboczego do
ładowania wyłącznie na potrzeby konfiguracji, więc lokalny kod konfiguracji pluginu kanału nie zostanie uruchomiony, dopóki ten
plugin obszaru roboczego pozostaje wyłączony lub wykluczony z listy dozwolonych. Instalacje linkowane
i jawne wpisy `plugins.load.paths` stosują normalne zasady dla swojego
rozwiązanego pochodzenia pluginu. Zobacz
[Konfigurowanie polityki pluginów](/pl/tools/plugin#configure-plugin-policy)
i [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#plugins).

`--force` nie jest obsługiwane z `--link`, ponieważ instalacje linkowane ponownie używają ścieżki źródłowej zamiast kopiować ją do zarządzanego celu instalacji.

Użyj `--pin` przy instalacjach npm, aby zapisać rozwiązaną dokładną specyfikację (`name@version`) w zarządzanym indeksie pluginów, pozostawiając domyślne zachowanie bez przypięcia.
</Note>

### Indeks pluginów

Metadane instalacji pluginów są stanem zarządzanym maszynowo, a nie konfiguracją użytkownika. Instalacje i aktualizacje zapisują je we współdzielonej bazie stanu SQLite w aktywnym katalogu stanu OpenClaw. Wiersz `installed_plugin_index` przechowuje trwałe metadane `installRecords`, w tym rekordy uszkodzonych lub brakujących manifestów pluginów, oraz zimną pamięć podręczną rejestru wyprowadzoną z manifestu, używaną przez `openclaw plugins update`, odinstalowanie, diagnostykę i zimny rejestr pluginów.

Gdy OpenClaw widzi w konfiguracji dostarczone starsze rekordy `plugins.installs`, odczyty wykonywane w runtime traktują je jako dane zgodności bez przepisywania `openclaw.json`. Jawne zapisy pluginów i `openclaw doctor --fix` przenoszą te rekordy do indeksu pluginów i usuwają klucz konfiguracji, gdy zapisy konfiguracji są dozwolone; jeśli którykolwiek zapis się nie powiedzie, rekordy konfiguracji zostają zachowane, aby metadane instalacji nie zostały utracone.

### Odinstalowanie

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` usuwa rekordy pluginów z `plugins.entries`, utrwalonego indeksu pluginów, wpisów list dozwolonych/zabronionych pluginów oraz linkowanych wpisów `plugins.load.paths`, gdy ma to zastosowanie. O ile nie ustawiono `--keep-files`, odinstalowanie usuwa także śledzony zarządzany katalog instalacji, gdy znajduje się on w głównym katalogu rozszerzeń pluginów OpenClaw. W przypadku pluginów Active Memory slot pamięci resetuje się do `memory-core`.

<Note>
`--keep-config` jest obsługiwane jako przestarzały alias `--keep-files`.
</Note>

### Aktualizacja

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
  <Accordion title="Resolving plugin id vs npm spec">
    Gdy przekazujesz identyfikator pluginu, OpenClaw ponownie używa zapisanej specyfikacji instalacji dla tego pluginu. Oznacza to, że wcześniej zapisane dist-tagi, takie jak `@beta`, oraz dokładne przypięte wersje będą nadal używane przy późniejszych uruchomieniach `update <id>`.

    Podczas `update <id> --dry-run` dokładnie przypięte instalacje npm pozostają przypięte. Jeśli OpenClaw może również rozwiązać domyślną linię rejestru pakietu i ta domyślna linia jest nowsza niż zainstalowana przypięta wersja, przebieg próbny zgłasza przypięcie i wypisuje jawne polecenie aktualizacji pakietu `@latest`, aby przejść na domyślną linię rejestru.

    Ta reguła aktualizacji celowanej różni się od zbiorczej ścieżki konserwacyjnej `openclaw plugins update --all`. Aktualizacje zbiorcze nadal respektują zwykłe śledzone specyfikacje instalacji, ale zaufane oficjalne rekordy pluginów OpenClaw mogą synchronizować się z bieżącym celem oficjalnego katalogu zamiast pozostawać na nieaktualnym dokładnym oficjalnym pakiecie. Użyj celowanego `update <id>`, gdy celowo chcesz pozostawić dokładną lub otagowaną oficjalną specyfikację bez zmian.

    W przypadku instalacji npm możesz także przekazać jawną specyfikację pakietu npm z dist-tagiem lub dokładną wersją. OpenClaw rozwiązuje tę nazwę pakietu z powrotem do śledzonego rekordu pluginu, aktualizuje ten zainstalowany plugin i zapisuje nową specyfikację npm dla przyszłych aktualizacji opartych na identyfikatorze.

    Przekazanie nazwy pakietu npm bez wersji lub tagu również rozwiązuje się z powrotem do śledzonego rekordu pluginu. Użyj tego, gdy plugin został przypięty do dokładnej wersji i chcesz przenieść go z powrotem na domyślną linię wydań rejestru.

  </Accordion>
  <Accordion title="Beta channel updates">
    Celowane `openclaw plugins update <id-or-npm-spec>` ponownie używa śledzonej specyfikacji pluginu, chyba że przekażesz nową specyfikację. Zbiorcze `openclaw plugins update --all` używa skonfigurowanego `update.channel`, gdy synchronizuje zaufane oficjalne rekordy pluginów z celem oficjalnego katalogu, dzięki czemu instalacje z kanału beta mogą pozostać na linii wydań beta zamiast zostać po cichu znormalizowane do stable/latest.

    `openclaw update` zna także aktywny kanał aktualizacji OpenClaw: na kanale beta rekordy pluginów npm z domyślnej linii oraz ClawHub najpierw próbują `@beta`. Wracają do zapisanej specyfikacji default/latest, jeśli wydanie beta pluginu nie istnieje; pluginy npm wracają także wtedy, gdy pakiet beta istnieje, ale nie przechodzi walidacji instalacji. Ten fallback jest zgłaszany jako ostrzeżenie i nie powoduje niepowodzenia aktualizacji core. Dokładne wersje i jawne tagi pozostają przypięte do tego selektora dla aktualizacji celowanych.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Przed aktualizacją npm na żywo OpenClaw sprawdza zainstalowaną wersję pakietu względem metadanych rejestru npm. Jeśli zainstalowana wersja i zapisana tożsamość artefaktu już odpowiadają rozwiązanemu celowi, aktualizacja jest pomijana bez pobierania, ponownej instalacji ani przepisywania `openclaw.json`.

    Gdy istnieje zapisany skrót integralności, a skrót pobranego artefaktu się zmienia, OpenClaw traktuje to jako dryf artefaktu npm. Interaktywne polecenie `openclaw plugins update` wypisuje oczekiwany i rzeczywisty skrót oraz prosi o potwierdzenie przed kontynuacją. Nieinteraktywne pomocniki aktualizacji stosują fail-closed, chyba że wywołujący poda jawną politykę kontynuacji.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` jest również akceptowane w `plugins update` dla zgodności, ale jest przestarzałe i nie zmienia już zachowania aktualizacji pluginów. Operator `security.installPolicy` nadal może blokować aktualizacje; hooki pluginów `before_install` mają zastosowanie tylko w procesach, w których hooki pluginów są załadowane.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk on update">
    Aktualizacje pluginów społecznościowych opartych na ClawHub wykonują tę samą kontrolę zaufania dokładnego wydania co instalacje przed pobraniem pakietu zastępczego. Użyj `--acknowledge-clawhub-risk` dla sprawdzonej automatyzacji, która powinna kontynuować, gdy wybrane wydanie ClawHub ma ryzykowne ostrzeżenie dotyczące zaufania. Oficjalne pakiety ClawHub i dołączone źródła pluginów OpenClaw omijają ten monit zaufania wydania.
  </Accordion>
</AccordionGroup>

### Inspekcja

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspekcja pokazuje tożsamość, status ładowania, źródło, możliwości manifestu, flagi polityki, diagnostykę, metadane instalacji, możliwości pakietu oraz wszelkie wykryte wsparcie serwerów MCP lub LSP bez domyślnego importowania runtime pluginu. Wyjście JSON obejmuje kontrakty manifestu pluginu, takie jak `contracts.agentToolResultMiddleware` i `contracts.trustedToolPolicies`, aby operatorzy mogli audytować deklaracje zaufanej powierzchni przed włączeniem lub ponownym uruchomieniem pluginu. Dodaj `--runtime`, aby załadować moduł pluginu i uwzględnić zarejestrowane hooki, narzędzia, polecenia, usługi, metody Gateway oraz trasy HTTP. Inspekcja runtime zgłasza brakujące zależności pluginu bezpośrednio; instalacje i naprawy pozostają w `openclaw plugins install`, `openclaw plugins update` i `openclaw doctor --fix`.

Polecenia CLI należące do pluginów są zwykle instalowane jako główne grupy poleceń `openclaw`, ale pluginy mogą także rejestrować polecenia zagnieżdżone pod nadrzędnym poleceniem core, takim jak `openclaw nodes`. Gdy `inspect --runtime` pokaże polecenie pod `cliCommands`, uruchom je pod wymienioną ścieżką; na przykład plugin rejestrujący `demo-git` można zweryfikować za pomocą `openclaw demo-git ping`.

Każdy plugin jest klasyfikowany według tego, co faktycznie rejestruje w runtime:

- **plain-capability** — jeden typ możliwości (np. plugin wyłącznie dostawcy)
- **hybrid-capability** — wiele typów możliwości (np. tekst + mowa + obrazy)
- **hook-only** — tylko hooki, bez możliwości ani powierzchni
- **non-capability** — narzędzia/polecenia/usługi, ale bez możliwości

Zobacz [Kształty pluginów](/pl/plugins/architecture#plugin-shapes), aby dowiedzieć się więcej o modelu możliwości.

<Note>
Flaga `--json` wypisuje raport czytelny maszynowo, odpowiedni do skryptów i audytu. `inspect --all` renderuje tabelę całej floty z kolumnami kształtu, rodzajów możliwości, powiadomień o zgodności, możliwości pakietu i podsumowania hooków. `info` jest aliasem dla `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` zgłasza błędy ładowania pluginów, diagnostykę manifestu/odkrywania, powiadomienia o zgodności oraz przestarzałe odwołania w konfiguracji pluginów, takie jak brakujące sloty pluginów. Gdy drzewo instalacji i konfiguracja pluginów są czyste, wypisuje `No plugin issues detected.` Jeśli przestarzała konfiguracja pozostaje, ale drzewo instalacji jest poza tym zdrowe, podsumowanie informuje o tym zamiast sugerować pełne zdrowie pluginów.

Jeśli skonfigurowany plugin jest obecny na dysku, ale blokowany przez kontrole bezpieczeństwa ścieżki loadera, walidacja konfiguracji zachowuje wpis pluginu i zgłasza go jako `present but blocked`. Napraw poprzedzającą diagnostykę zablokowanego pluginu, taką jak własność ścieżki lub uprawnienia zapisu dla wszystkich, zamiast usuwać konfigurację `plugins.entries.<id>` albo `plugins.allow`.

W przypadku błędów kształtu modułu, takich jak brak eksportów `register`/`activate`, uruchom ponownie z `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, aby uwzględnić zwięzłe podsumowanie kształtu eksportów w wyjściu diagnostycznym.

### Rejestr

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Lokalny rejestr pluginów to utrwalony zimny model odczytu OpenClaw dla tożsamości zainstalowanych pluginów, ich włączenia, metadanych źródła i własności kontrybucji. Zwykłe uruchamianie, wyszukiwanie właściciela dostawcy, klasyfikacja konfiguracji kanału i inwentarz pluginów mogą go odczytywać bez importowania modułów runtime pluginów.

Użyj `plugins registry`, aby sprawdzić, czy utrwalony rejestr jest obecny, aktualny lub przestarzały. Użyj `--refresh`, aby przebudować go z utrwalonego indeksu pluginów, polityki konfiguracji oraz metadanych manifestu/pakietu. To jest ścieżka naprawy, a nie ścieżka aktywacji runtime.

`openclaw doctor --fix` naprawia także powiązany z rejestrem dryf zarządzanego npm: jeśli osierocony lub odzyskany pakiet `@openclaw/*` w zarządzanym projekcie npm pluginu albo starszy płaski zarządzany katalog główny npm przysłania dołączony plugin, doctor usuwa ten przestarzały pakiet i przebudowuje rejestr, aby uruchamianie walidowało względem dołączonego manifestu. Doctor ponownie linkuje także pakiet hosta `openclaw` do zarządzanych pluginów npm, które deklarują `peerDependencies.openclaw`, dzięki czemu lokalne dla pakietu importy runtime, takie jak `openclaw/plugin-sdk/*`, rozwiązują się po aktualizacjach lub naprawach npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` to przestarzały awaryjny przełącznik zgodności dla błędów odczytu rejestru. Preferuj `plugins registry --refresh` albo `openclaw doctor --fix`; fallback env służy wyłącznie do awaryjnego odzyskania uruchamiania podczas wdrażania migracji.
</Warning>

### Marketplace

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

`plugins marketplace entries` wyświetla wpisy ze skonfigurowanego kanału marketplace OpenClaw. Domyślnie próbuje użyć hostowanego kanału i wraca do najnowszej zaakceptowanej migawki albo danych dołączonych do pakietu. Użyj `--feed-profile <name>`, aby odczytać konkretny skonfigurowany profil, `--feed-url <url>`, aby odczytać jawny URL hostowanego kanału, oraz `--offline`, aby odczytać najnowszą zaakceptowaną migawkę bez pobierania kanału.

`plugins marketplace refresh` odświeża skonfigurowaną migawkę hostowanego kanału i zgłasza, czy OpenClaw zaakceptował dane hostowane, hostowaną migawkę, czy dane awaryjne dołączone do pakietu. Użyj `--expected-sha256`, gdy wywołujący potrzebuje, aby polecenie zakończyło się niepowodzeniem, chyba że świeży hostowany ładunek będzie zgodny z przypiętą sumą kontrolną.

Marketplace `list` akceptuje lokalną ścieżkę marketplace, ścieżkę `marketplace.json`, skrót GitHub w rodzaju `owner/repo`, URL repozytorium GitHub albo URL git. `--json` wypisuje rozpoznaną etykietę źródła oraz przeanalizowany manifest marketplace i wpisy Pluginów.

Odświeżanie marketplace wczytuje hostowany kanał marketplace OpenClaw i zapisuje
zweryfikowaną odpowiedź jako lokalną migawkę hostowanego kanału. Bez opcji używa
skonfigurowanego domyślnego profilu kanału. Użyj `--feed-profile <name>`, aby odświeżyć
konkretny skonfigurowany profil, `--feed-url <url>`, aby odświeżyć jawny URL hostowanego
kanału, `--expected-sha256 <sha256>`, aby wymagać zgodnej sumy kontrolnej ładunku
(`sha256:<hex>` albo sam 64-znakowy skrót szesnastkowy), oraz `--json` dla
wyniku czytelnego maszynowo. Jawne URL-e hostowanych kanałów nie mogą zawierać
danych uwierzytelniających, ciągów zapytania ani fragmentów. Odświeżenia bez przypięcia mogą zgłosić
wynik hostowanej migawki albo dołączonego fallbacku bez niepowodzenia polecenia. Odświeżenia
z przypięciem kończą się niepowodzeniem, chyba że zaakceptują świeży hostowany ładunek, a udane hostowane
odświeżenia kończą się niepowodzeniem, jeśli OpenClaw nie może zapisać zweryfikowanej migawki.

## Powiązane

- [Tworzenie Pluginów](/pl/plugins/building-plugins)
- [Dokumentacja CLI](/pl/cli)
- [ClawHub](/pl/clawhub)
