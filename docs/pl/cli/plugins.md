---
read_when:
    - Chcesz instalować lub zarządzać Pluginami Gateway albo zgodnymi pakietami
    - Chcesz utworzyć szkielet lub zweryfikować prosty Plugin narzędziowy
    - Chcesz debugować błędy ładowania Plugin
sidebarTitle: Plugins
summary: Dokumentacja referencyjna CLI dla `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Pluginy
x-i18n:
    generated_at: "2026-06-28T20:43:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a703adb93af2490282f73b25cbbd95c7bc1d54c9c9c656fdb9b75465683f4ec8
    source_path: cli/plugins.md
    workflow: 16
---

Zarządzaj Pluginami Gateway, pakietami hooków i zgodnymi pakietami.

<CardGroup cols={2}>
  <Card title="System Pluginów" href="/pl/tools/plugin">
    Przewodnik użytkownika końcowego dotyczący instalowania, włączania i rozwiązywania problemów z Pluginami.
  </Card>
  <Card title="Zarządzanie Pluginami" href="/pl/plugins/manage-plugins">
    Krótkie przykłady instalowania, wyświetlania listy, aktualizowania, odinstalowywania i publikowania.
  </Card>
  <Card title="Pakiety Pluginów" href="/pl/plugins/bundles">
    Model zgodności pakietów.
  </Card>
  <Card title="Manifest Pluginu" href="/pl/plugins/manifest">
    Pola manifestu i schemat konfiguracji.
  </Card>
  <Card title="Bezpieczeństwo" href="/pl/gateway/security">
    Wzmacnianie zabezpieczeń instalacji Pluginów.
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

W przypadku badania powolnej instalacji, inspekcji, odinstalowania lub odświeżania rejestru uruchom
polecenie z `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Ślad zapisuje czasy faz
do stderr i pozostawia dane wyjściowe JSON możliwe do parsowania. Zobacz [Debugowanie](/pl/help/debugging#plugin-lifecycle-trace).

<Note>
W trybie Nix (`OPENCLAW_NIX_MODE=1`) mutatory cyklu życia Pluginów są wyłączone. Użyj źródła Nix dla tej instalacji zamiast `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` lub `plugins disable`; dla nix-openclaw użyj ukierunkowanego na agenta [Szybkiego startu](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Dołączone Pluginy są dostarczane z OpenClaw. Niektóre są domyślnie włączone (na przykład dołączeni dostawcy modeli, dołączeni dostawcy mowy i dołączony Plugin przeglądarki); inne wymagają `plugins enable`.

Natywne Pluginy OpenClaw muszą dostarczać `openclaw.plugin.json` z wbudowanym schematem JSON Schema (`configSchema`, nawet jeśli pustym). Zgodne pakiety używają zamiast tego własnych manifestów pakietów.

`plugins list` pokazuje `Format: openclaw` lub `Format: bundle`. Szczegółowe dane wyjściowe list/info pokazują także podtyp pakietu (`codex`, `claude` lub `cursor`) oraz wykryte możliwości pakietu.
</Note>

### Autor

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` domyślnie tworzy minimalny Plugin narzędziowy TypeScript. Pierwszy
argument to identyfikator Pluginu; przekaż `--name`, aby ustawić nazwę wyświetlaną. OpenClaw używa
identyfikatora jako domyślnego katalogu wyjściowego i do nazewnictwa pakietu. Szkielety narzędzi używają
`defineToolPlugin`.
`plugins build` importuje zbudowany punkt wejścia, odczytuje jego statyczne metadane narzędzi, zapisuje
`openclaw.plugin.json` i utrzymuje `package.json` `openclaw.extensions` w zgodności.
`plugins validate` sprawdza, czy wygenerowany manifest, metadane pakietu i
bieżący eksport punktu wejścia nadal są zgodne. Zobacz [Pluginy narzędziowe](/pl/plugins/tool-plugins), aby poznać
pełny przepływ tworzenia narzędzi.

Szkielet zapisuje kod źródłowy TypeScript, ale generuje metadane ze zbudowanego
punktu wejścia `./dist/index.js`, więc przepływ działa także z opublikowanym CLI. Użyj
`--entry <path>`, gdy punkt wejścia nie jest domyślnym punktem wejścia pakietu. Użyj
`plugins build --check` w CI, aby zakończyć się niepowodzeniem, gdy wygenerowane metadane są nieaktualne, bez
przepisywania plików.

### Szkielet dostawcy

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Szkielety dostawców tworzą ogólny Plugin dostawcy tekstu/modeli z kompatybilną z OpenAI
obsługą kluczy API, wbudowanym skryptem `npm run validate` dla `clawhub package
validate`, metadanymi pakietu ClawHub oraz ręcznie uruchamianym przepływem pracy GitHub
do przyszłego zaufanego publikowania przez GitHub Actions OIDC. Szkielety dostawców nie
generują Skills i nie używają `openclaw plugins build` ani
`openclaw plugins validate`; te polecenia są przeznaczone dla ścieżki wygenerowanych metadanych
szkieletu narzędziowego.

Przed publikacją zastąp zastępczy bazowy adres URL API, katalog modeli, trasę
dokumentacji, tekst poświadczeń i treść README prawdziwymi szczegółami dostawcy. Użyj
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

Opiekunowie testujący instalacje w czasie konfiguracji mogą nadpisać automatyczne
źródła instalacji Pluginów za pomocą chronionych zmiennych środowiskowych. Zobacz
[Nadpisania instalacji Pluginów](/pl/plugins/install-overrides).

<Warning>
Gołe nazwy pakietów instalują domyślnie z npm podczas przejścia startowego, chyba że pasują do oficjalnego identyfikatora Pluginu. Surowe specyfikacje pakietów `@openclaw/*`, które pasują do dołączonych Pluginów, używają dołączonej kopii dostarczonej z bieżącą kompilacją OpenClaw. Użyj `npm:<package>`, gdy celowo chcesz użyć zewnętrznego pakietu npm. Użyj `clawhub:<package>` dla ClawHub. Traktuj instalacje Pluginów jak uruchamianie kodu. Preferuj przypięte wersje.
</Warning>

`plugins search` odpytuje ClawHub o możliwe do zainstalowania pakiety Pluginów i wypisuje
nazwy pakietów gotowe do instalacji. Wyszukuje pakiety code-plugin i bundle-plugin,
nie Skills. Użyj `openclaw skills search` dla Skills w ClawHub.

<Note>
ClawHub jest podstawową powierzchnią dystrybucji i odkrywania większości Pluginów. Npm
pozostaje obsługiwaną ścieżką awaryjną i ścieżką instalacji bezpośredniej. Należące do OpenClaw
pakiety Pluginów `@openclaw/*` są ponownie publikowane w npm; zobacz bieżącą listę
na [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) lub w
[inwentarzu Pluginów](/pl/plugins/plugin-inventory). Stabilne instalacje używają `latest`.
Instalacje i aktualizacje z kanału beta preferują npm `beta` dist-tag, gdy ten tag
jest dostępny, a następnie wracają do `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Dołączanie konfiguracji i naprawa nieprawidłowej konfiguracji">
    Jeśli sekcja `plugins` jest oparta na jednoplikowym `$include`, `plugins install/update/enable/disable/uninstall` zapisuje do tego dołączonego pliku i pozostawia `openclaw.json` bez zmian. Dołączenia główne, tablice dołączeń i dołączenia z sąsiednimi nadpisaniami kończą się odmową zamiast spłaszczania. Zobacz [Dołączanie konfiguracji](/pl/gateway/configuration), aby poznać obsługiwane kształty.

    Jeśli konfiguracja jest nieprawidłowa podczas instalacji, `plugins install` zwykle odmawia działania i informuje, aby najpierw uruchomić `openclaw doctor --fix`. Podczas uruchamiania Gateway i przeładowania na gorąco nieprawidłowa konfiguracja Pluginu odmawia działania tak jak każda inna nieprawidłowa konfiguracja; `openclaw doctor --fix` może poddać nieprawidłowy wpis Pluginu kwarantannie. Jedynym udokumentowanym wyjątkiem w czasie instalacji jest wąska ścieżka odzyskiwania dołączonego Pluginu dla Pluginów, które jawnie wybierają `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force i ponowna instalacja kontra aktualizacja">
    `--force` ponownie używa istniejącego celu instalacji i nadpisuje już zainstalowany Plugin lub pakiet hooków w miejscu. Użyj tego, gdy celowo ponownie instalujesz ten sam identyfikator z nowej ścieżki lokalnej, archiwum, pakietu ClawHub lub artefaktu npm. Do rutynowych aktualizacji już śledzonego Pluginu npm preferuj `openclaw plugins update <id-or-npm-spec>`.

    Jeśli uruchomisz `plugins install` dla identyfikatora Pluginu, który jest już zainstalowany, OpenClaw zatrzyma się i wskaże `plugins update <id-or-npm-spec>` dla zwykłej aktualizacji albo `plugins install <package> --force`, gdy naprawdę chcesz nadpisać bieżącą instalację z innego źródła.

  </Accordion>
  <Accordion title="Zakres --pin">
    `--pin` dotyczy tylko instalacji npm. Nie jest obsługiwane z instalacjami `git:`; użyj jawnego ref git, takiego jak `git:github.com/acme/plugin@v1.2.3`, gdy chcesz przypięte źródło. Nie jest obsługiwane z `--marketplace`, ponieważ instalacje z marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` jest przestarzałe i obecnie nic nie robi. OpenClaw nie uruchamia już wbudowanego blokowania niebezpiecznego kodu w czasie instalacji dla instalacji Pluginów.

    Użyj współdzielonej, należącej do operatora powierzchni `security.installPolicy`, gdy wymagana jest specyficzna dla hosta polityka instalacji. Hooki Pluginu `before_install` są hookami cyklu życia runtime Pluginu i nie są podstawową granicą polityki dla instalacji CLI.

    Jeśli Plugin opublikowany przez Ciebie w ClawHub jest ukryty lub zablokowany przez skan rejestru, użyj kroków wydawcy w [Publikowaniu w ClawHub](/pl/clawhub/publishing). `--dangerously-force-unsafe-install` nie prosi ClawHub o ponowne przeskanowanie Pluginu ani o upublicznienie zablokowanego wydania.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Społecznościowe instalacje ClawHub sprawdzają rekord zaufania wybranego wydania przed pobraniem pakietu. Jeśli ClawHub wyłącza pobieranie dla wydania, zgłasza złośliwe wyniki skanowania albo umieszcza wydanie w blokującym stanie moderacji, takim jak kwarantanna, OpenClaw odmawia użycia wydania. W przypadku nieblokujących ryzykownych statusów skanowania, ryzykownych stanów moderacji lub powodów rejestru OpenClaw pokazuje szczegóły zaufania i prosi o potwierdzenie przed kontynuacją.

    Używaj `--acknowledge-clawhub-risk` tylko po przejrzeniu ostrzeżenia ClawHub i podjęciu decyzji o kontynuacji bez interaktywnego monitu. Oczekujące lub nieaktualne czyste rekordy zaufania ostrzegają, ale nie wymagają potwierdzenia. Oficjalne pakiety ClawHub i dołączone źródła Pluginów OpenClaw pomijają ten monit zaufania wydania.

  </Accordion>
  <Accordion title="Pakiety hooków i specyfikacje npm">
    `plugins install` jest także powierzchnią instalacji dla pakietów hooków, które udostępniają `openclaw.hooks` w `package.json`. Użyj `openclaw hooks` do filtrowanej widoczności hooków i włączania poszczególnych hooków, a nie do instalacji pakietów.

    Specyfikacje npm są **wyłącznie rejestrowe** (nazwa pakietu + opcjonalnie **dokładna wersja** lub **dist-tag**). Specyfikacje Git/URL/plik oraz zakresy semver są odrzucane. Instalacje zależności działają w jednym zarządzanym projekcie npm na Plugin z `--ignore-scripts` dla bezpieczeństwa, nawet gdy powłoka ma globalne ustawienia instalacji npm. Zarządzane projekty npm Plugin dziedziczą `overrides` npm na poziomie pakietu OpenClaw, więc przypięcia bezpieczeństwa hosta obejmują także wyniesione zależności Plugin.

    Użyj `npm:<package>`, gdy chcesz jawnie wymusić rozwiązywanie przez npm. Proste specyfikacje pakietów również instalują bezpośrednio z npm podczas przejścia startowego, chyba że pasują do oficjalnego identyfikatora Plugin.

    Surowe specyfikacje pakietów `@openclaw/*`, które pasują do dołączonych Plugin, są rozwiązywane do dołączonej kopii należącej do obrazu przed awaryjnym użyciem npm. Na przykład `openclaw plugins install @openclaw/discord@2026.5.20 --pin` używa dołączonego Plugin Discord z bieżącej kompilacji OpenClaw zamiast tworzyć zarządzane nadpisanie npm. Aby wymusić zewnętrzny pakiet npm, użyj `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Proste specyfikacje i `@latest` pozostają na ścieżce stabilnej. Wersje korekcyjne OpenClaw z datą, takie jak `2026.5.3-1`, są w tym sprawdzeniu wydaniami stabilnymi. Jeśli npm rozwiąże którąkolwiek z nich do wersji przedpremierowej, OpenClaw zatrzyma się i poprosi o jawne wyrażenie zgody za pomocą tagu przedpremierowego, takiego jak `@beta`/`@rc`, albo dokładnej wersji przedpremierowej, takiej jak `@1.2.3-beta.4`.

    W przypadku instalacji npm bez dokładnej wersji (`npm:<package>` lub `npm:<package>@latest`) OpenClaw sprawdza rozwiązane metadane pakietu przed instalacją. Jeśli najnowszy stabilny pakiet wymaga nowszego API Plugin OpenClaw lub nowszej minimalnej wersji hosta, OpenClaw sprawdza starsze stabilne wersje i zamiast tego instaluje najnowsze kompatybilne wydanie. Dokładne wersje i jawne dist-tag, takie jak `@beta`, pozostają ścisłe: jeśli wybrany pakiet jest niekompatybilny, polecenie kończy się niepowodzeniem i prosi o uaktualnienie OpenClaw albo wybranie kompatybilnej wersji.

    Jeśli prosta specyfikacja instalacji pasuje do oficjalnego identyfikatora Plugin (na przykład `diffs`), OpenClaw instaluje bezpośrednio wpis katalogu. Aby zainstalować pakiet npm o tej samej nazwie, użyj jawnej specyfikacji z zakresem (na przykład `@scope/diffs`).

  </Accordion>
  <Accordion title="Repozytoria Git">
    Użyj `git:<repo>`, aby instalować bezpośrednio z repozytorium git. Obsługiwane formy obejmują `git:github.com/owner/repo`, `git:owner/repo`, pełne adresy klonowania `https://`, `ssh://`, `git://`, `file://` oraz `git@host:owner/repo.git`. Dodaj `@<ref>` lub `#<ref>`, aby przed instalacją przełączyć się na gałąź, tag albo commit.

    Instalacje Git klonują do katalogu tymczasowego, przełączają się na żądany ref, jeśli go podano, a następnie używają normalnego instalatora katalogu Plugin. Oznacza to, że walidacja manifestu, polityka instalacji operatora, praca instalacyjna menedżera pakietów i rekordy instalacji zachowują się tak jak przy instalacjach npm. Zarejestrowane instalacje Git obejmują źródłowy URL/ref oraz rozwiązany commit, aby `openclaw plugins update` mógł później ponownie rozwiązać źródło.

    Po instalacji z git użyj `openclaw plugins inspect <id> --runtime --json`, aby zweryfikować rejestracje runtime, takie jak metody Gateway i polecenia CLI. Jeśli Plugin zarejestrował katalog główny CLI za pomocą `api.registerCli`, wykonaj to polecenie bezpośrednio przez główne CLI OpenClaw, na przykład `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archiwa">
    Obsługiwane archiwa: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Natywne archiwa Plugin OpenClaw muszą zawierać prawidłowy `openclaw.plugin.json` w wyodrębnionym katalogu głównym Plugin; archiwa zawierające wyłącznie `package.json` są odrzucane, zanim OpenClaw zapisze rekordy instalacji.

    Użyj `npm-pack:<path.tgz>`, gdy plik jest archiwum tarball npm-pack i chcesz
    przetestować tę samą ścieżkę zarządzanego projektu npm na Plugin, której używają
    instalacje z rejestru, w tym weryfikację `package-lock.json`, skanowanie wyniesionych
    zależności oraz rekordy instalacji npm. Zwykłe ścieżki archiwów nadal instalują jako lokalne
    archiwa w katalogu głównym rozszerzeń Plugin.

    Obsługiwane są również instalacje z marketplace Claude.

  </Accordion>
</AccordionGroup>

Instalacje ClawHub używają jawnego lokalizatora `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Proste, bezpieczne dla npm specyfikacje Plugin instalują domyślnie z npm podczas przejścia startowego, chyba że pasują do oficjalnego identyfikatora Plugin:

```bash
openclaw plugins install openclaw-codex-app-server
```

Użyj `npm:`, aby jawnie wymusić rozwiązywanie tylko przez npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw sprawdza deklarowaną kompatybilność API Plugin / minimalną kompatybilność Gateway przed instalacją. Gdy wybrana wersja ClawHub publikuje artefakt ClawPack, OpenClaw pobiera wersjonowane `.tgz` npm-pack, weryfikuje nagłówek digest ClawHub oraz digest artefaktu, a następnie instaluje go przez normalną ścieżkę archiwum. Starsze wersje ClawHub bez metadanych ClawPack nadal instalują przez starszą ścieżkę weryfikacji archiwum pakietu. Zarejestrowane instalacje zachowują metadane źródłowe ClawHub, rodzaj artefaktu, integralność npm, shasum npm, nazwę tarball oraz fakty digest ClawPack do późniejszych aktualizacji.
Niewersjonowane instalacje ClawHub zachowują niewersjonowaną zarejestrowaną specyfikację, aby `openclaw plugins update` mógł śledzić nowsze wydania ClawHub; jawne selektory wersji lub tagów, takie jak `clawhub:pkg@1.2.3` i `clawhub:pkg@beta`, pozostają przypięte do tego selektora.

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
    - nazwa znanego marketplace Claude z `~/.claude/plugins/known_marketplaces.json`
    - lokalny katalog główny marketplace lub ścieżka `marketplace.json`
    - skrót repozytorium GitHub, taki jak `owner/repo`
    - URL repozytorium GitHub, taki jak `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Reguły zdalnego marketplace">
    W przypadku zdalnych marketplace ładowanych z GitHub lub git wpisy Plugin muszą pozostać wewnątrz sklonowanego repozytorium marketplace. OpenClaw akceptuje względne źródła ścieżek z tego repozytorium i odrzuca źródła Plugin HTTP(S), ścieżki bezwzględne, git, GitHub oraz inne źródła niebędące ścieżkami ze zdalnych manifestów.
  </Tab>
</Tabs>

W przypadku lokalnych ścieżek i archiwów OpenClaw wykrywa automatycznie:

- natywne Plugin OpenClaw (`openclaw.plugin.json`)
- pakiety kompatybilne z Codex (`.codex-plugin/plugin.json`)
- pakiety kompatybilne z Claude (`.claude-plugin/plugin.json` lub domyślny układ komponentów Claude)
- pakiety kompatybilne z Cursor (`.cursor-plugin/plugin.json`)

Zarządzane instalacje lokalne muszą być katalogami lub archiwami Plugin. Samodzielne pliki Plugin `.js`,
`.mjs`, `.cjs` i `.ts` nie są kopiowane do zarządzanego katalogu głównego Plugin
przez `plugins install`; zamiast tego wymień je jawnie w `plugins.load.paths`.

<Note>
Kompatybilne pakiety instalują się w normalnym katalogu głównym Plugin i uczestniczą w tym samym przepływie list/info/enable/disable. Obecnie obsługiwane są Skills pakietów, command-skills Claude, domyślne wartości Claude `settings.json`, domyślne wartości Claude `.lsp.json` / zadeklarowane w manifeście `lspServers`, command-skills Cursor oraz kompatybilne katalogi hook Codex; inne wykryte możliwości pakietów są pokazywane w diagnostyce/info, ale nie są jeszcze podłączone do wykonywania runtime.
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
  Pokaż tylko włączone Plugin.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Przełącz z widoku tabeli na szczegółowe wiersze dla każdego Plugin z metadanymi źródła/pochodzenia/wersji/aktywacji.
</ParamField>
<ParamField path="--json" type="boolean">
  Inwentarz czytelny maszynowo oraz diagnostyka rejestru i stan instalacji zależności pakietu.
</ParamField>

<Note>
`plugins list` najpierw odczytuje utrwalony lokalny rejestr Plugin, z awaryjną wartością pochodną wyłącznie z manifestu, gdy rejestru brakuje albo jest nieprawidłowy. Jest to przydatne do sprawdzenia, czy Plugin jest zainstalowany, włączony i widoczny dla planowania zimnego startu, ale nie jest sondą live runtime już działającego procesu Gateway. Po zmianie kodu Plugin, włączenia, polityki hook lub `plugins.load.paths` uruchom ponownie Gateway obsługujący kanał, zanim zaczniesz oczekiwać uruchomienia nowego kodu `register(api)` lub hook. W przypadku wdrożeń zdalnych/kontenerowych sprawdź, czy uruchamiasz ponownie rzeczywisty proces potomny `openclaw gateway run`, a nie tylko proces opakowujący.

`plugins list --json` zawiera `dependencyStatus` każdego Plugin z `package.json`
`dependencies` i `optionalDependencies`. OpenClaw sprawdza, czy te nazwy pakietów
są obecne wzdłuż normalnej ścieżki wyszukiwania Node `node_modules` danego Plugin;
nie importuje kodu runtime Plugin, nie uruchamia menedżera pakietów ani nie naprawia brakujących
zależności.
</Note>

Jeśli logi startowe pokazują `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
uruchom `openclaw plugins list --enabled --verbose` lub
`openclaw plugins inspect <id>` z wymienionym identyfikatorem Plugin, aby potwierdzić identyfikatory Plugin
i skopiować zaufane identyfikatory do `plugins.allow` w `openclaw.json`. Gdy
ostrzeżenie może wymienić każdy wykryty Plugin, wypisuje gotowy do wklejenia
fragment `plugins.allow`, który już zawiera te identyfikatory. Jeśli Plugin ładuje się
bez pochodzenia instalacji/ścieżki ładowania, sprawdź ten identyfikator Plugin, a następnie przypnij
zaufany identyfikator w `plugins.allow` albo ponownie zainstaluj Plugin z zaufanego źródła,
aby OpenClaw zarejestrował pochodzenie instalacji.

`plugins search` to zdalne wyszukiwanie w katalogu ClawHub. Nie sprawdza lokalnego
stanu, nie mutuje konfiguracji, nie instaluje pakietów ani nie ładuje kodu runtime Plugin. Wyniki wyszukiwania
zawierają nazwę pakietu ClawHub, rodzinę, kanał, wersję, podsumowanie oraz
podpowiedź instalacji, taką jak `openclaw plugins install clawhub:<package>`.

Podczas pracy nad dołączonym Plugin wewnątrz spakowanego obrazu Docker zamontuj katalog
źródłowy Plugin przez bind mount na pasującej spakowanej ścieżce źródłowej, takiej jak
`/app/extensions/synology-chat`. OpenClaw wykryje tę zamontowaną nakładkę źródłową
przed `/app/dist/extensions/synology-chat`; zwykły skopiowany katalog źródłowy
pozostaje bezczynny, więc normalne spakowane instalacje nadal używają skompilowanego dist.

Do debugowania hook runtime:

- `openclaw plugins inspect <id> --runtime --json` pokazuje zarejestrowane hook i diagnostykę z przebiegu inspekcji z załadowanym modułem. Inspekcja runtime nigdy nie instaluje zależności; użyj `openclaw doctor --fix`, aby wyczyścić starszy stan zależności lub odzyskać brakujące, możliwe do pobrania Plugin, do których odwołuje się konfiguracja.
- `openclaw gateway status --deep --require-rpc` potwierdza osiągalny URL/profil Gateway, wskazówki usługi/procesu, ścieżkę konfiguracji i kondycję RPC.
- Niedostarczane w pakiecie hook konwersacji (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) wymagają `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Użyj `--link`, aby uniknąć kopiowania lokalnego katalogu Plugin (dodaje do `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

Samodzielne pliki Plugin muszą być wymienione w `plugins.load.paths`, a nie
instalowane za pomocą `plugins install` ani umieszczane bezpośrednio w `~/.openclaw/extensions`
lub `<workspace>/.openclaw/extensions`. Te automatycznie wykrywane katalogi główne ładują katalogi
pakietów lub pakietów zgodności Plugin, natomiast skrypty najwyższego poziomu są traktowane jako lokalne
pomocniki i pomijane.

<Note>
Pluginy pochodzące z obszaru roboczego, wykryte z katalogu głównego rozszerzeń obszaru roboczego, nie są
importowane ani wykonywane, dopóki nie zostaną jawnie włączone. Do lokalnego rozwoju
uruchom `openclaw plugins enable <plugin-id>` albo ustaw
`plugins.entries.<plugin-id>.enabled: true`; jeśli konfiguracja używa
`plugins.allow`, dodaj tam również ten sam identyfikator pluginu. Ta reguła fail-closed
ma zastosowanie także wtedy, gdy konfiguracja kanału jawnie wskazuje plugin pochodzący z obszaru roboczego do
ładowania wyłącznie na potrzeby konfiguracji, więc lokalny kod konfiguracji pluginu kanału nie uruchomi się, dopóki ten
plugin obszaru roboczego pozostaje wyłączony albo wykluczony z listy dozwolonych. Instalacje połączone
i jawne wpisy `plugins.load.paths` stosują normalne zasady dla swojego
rozwiązanego pochodzenia pluginu. Zobacz
[Konfigurowanie zasad Plugin](/pl/tools/plugin#configure-plugin-policy)
oraz [Referencja konfiguracji](/pl/gateway/configuration-reference#plugins).

`--force` nie jest obsługiwane z `--link`, ponieważ instalacje połączone ponownie używają ścieżki źródłowej zamiast kopiować pliki do zarządzanego celu instalacji.

Użyj `--pin` przy instalacjach npm, aby zapisać rozwiązaną dokładną specyfikację (`name@version`) w zarządzanym indeksie pluginów, zachowując domyślne zachowanie bez przypięcia.
</Note>

### Indeks Plugin

Metadane instalacji pluginów są stanem zarządzanym maszynowo, a nie konfiguracją użytkownika. Instalacje i aktualizacje zapisują je we współdzielonej bazie stanu SQLite w aktywnym katalogu stanu OpenClaw. Wiersz `installed_plugin_index` przechowuje trwałe metadane `installRecords`, w tym rekordy uszkodzonych lub brakujących manifestów pluginów, oraz pochodzącą z manifestu zimną pamięć podręczną rejestru używaną przez `openclaw plugins update`, odinstalowanie, diagnostykę i zimny rejestr pluginów.

Gdy OpenClaw widzi w konfiguracji dostarczone starsze rekordy `plugins.installs`, odczyty runtime traktują je jako wejście kompatybilności bez przepisywania `openclaw.json`. Jawne zapisy pluginów i `openclaw doctor --fix` przenoszą te rekordy do indeksu pluginów i usuwają klucz konfiguracji, gdy zapisy konfiguracji są dozwolone; jeśli którykolwiek zapis się nie powiedzie, rekordy konfiguracji zostają zachowane, aby metadane instalacji nie zostały utracone.

### Odinstalowanie

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` usuwa rekordy pluginów z `plugins.entries`, utrwalonego indeksu pluginów, wpisów listy dozwolonych/zabronionych pluginów oraz połączonych wpisów `plugins.load.paths`, gdy ma to zastosowanie. O ile nie ustawiono `--keep-files`, odinstalowanie usuwa także śledzony zarządzany katalog instalacji, gdy znajduje się on w katalogu głównym rozszerzeń pluginów OpenClaw. W przypadku pluginów Active Memory slot pamięci resetuje się do `memory-core`.

<Note>
`--keep-config` jest obsługiwane jako przestarzały alias dla `--keep-files`.
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
  <Accordion title="Rozwiązywanie identyfikatora pluginu względem specyfikacji npm">
    Gdy przekazujesz identyfikator pluginu, OpenClaw ponownie używa zapisanej specyfikacji instalacji dla tego pluginu. Oznacza to, że wcześniej zapisane znaczniki dystrybucji, takie jak `@beta`, oraz dokładne przypięte wersje nadal będą używane przy późniejszych uruchomieniach `update <id>`.

    Podczas `update <id> --dry-run` dokładnie przypięte instalacje npm pozostają przypięte. Jeśli OpenClaw może także rozwiązać domyślną linię pakietu w rejestrze, a ta domyślna linia jest nowsza niż zainstalowana przypięta wersja, przebieg próbny zgłasza przypięcie i wypisuje jawne polecenie aktualizacji pakietu z `@latest`, aby przejść na domyślną linię rejestru.

    Ta reguła aktualizacji celowanej różni się od zbiorczej ścieżki utrzymaniowej `openclaw plugins update --all`. Aktualizacje zbiorcze nadal respektują zwykłe śledzone specyfikacje instalacji, ale zaufane oficjalne rekordy pluginów OpenClaw mogą synchronizować się z bieżącym celem oficjalnego katalogu zamiast pozostawać na nieaktualnym dokładnym oficjalnym pakiecie. Użyj celowanego `update <id>`, gdy celowo chcesz pozostawić dokładną lub oznaczoną oficjalną specyfikację bez zmian.

    W przypadku instalacji npm możesz także przekazać jawną specyfikację pakietu npm ze znacznikiem dystrybucji lub dokładną wersją. OpenClaw rozwiązuje tę nazwę pakietu z powrotem do śledzonego rekordu pluginu, aktualizuje ten zainstalowany plugin i zapisuje nową specyfikację npm na potrzeby przyszłych aktualizacji opartych na identyfikatorze.

    Przekazanie nazwy pakietu npm bez wersji lub znacznika również rozwiązuje się z powrotem do śledzonego rekordu pluginu. Użyj tego, gdy plugin był przypięty do dokładnej wersji i chcesz przenieść go z powrotem na domyślną linię wydań rejestru.

  </Accordion>
  <Accordion title="Aktualizacje kanału beta">
    Celowane `openclaw plugins update <id-or-npm-spec>` ponownie używa śledzonej specyfikacji pluginu, chyba że przekażesz nową specyfikację. Zbiorcze `openclaw plugins update --all` używa skonfigurowanego `update.channel`, gdy synchronizuje zaufane oficjalne rekordy pluginów z celem oficjalnego katalogu, więc instalacje z kanału beta mogą pozostać na linii wydań beta zamiast być po cichu normalizowane do stable/latest.

    `openclaw update` zna także aktywny kanał aktualizacji OpenClaw: na kanale beta rekordy pluginów npm z domyślnej linii oraz ClawHub najpierw próbują `@beta`. Wycofują się do zapisanej specyfikacji default/latest, jeśli nie istnieje wydanie beta pluginu; pluginy npm wycofują się także wtedy, gdy pakiet beta istnieje, ale nie przechodzi walidacji instalacji. To wycofanie jest zgłaszane jako ostrzeżenie i nie powoduje niepowodzenia aktualizacji core. Dokładne wersje i jawne znaczniki pozostają przypięte do tego selektora dla aktualizacji celowanych.

  </Accordion>
  <Accordion title="Kontrole wersji i dryf integralności">
    Przed aktualizacją npm na żywo OpenClaw sprawdza zainstalowaną wersję pakietu względem metadanych rejestru npm. Jeśli zainstalowana wersja i zapisana tożsamość artefaktu już pasują do rozwiązanego celu, aktualizacja jest pomijana bez pobierania, ponownej instalacji ani przepisywania `openclaw.json`.

    Gdy istnieje zapisany hash integralności, a hash pobranego artefaktu się zmienia, OpenClaw traktuje to jako dryf artefaktu npm. Interaktywne polecenie `openclaw plugins update` wypisuje oczekiwany i rzeczywisty hash oraz prosi o potwierdzenie przed kontynuowaniem. Nieinteraktywne pomocniki aktualizacji działają fail-closed, chyba że wywołujący dostarczy jawną zasadę kontynuacji.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install przy aktualizacji">
    `--dangerously-force-unsafe-install` jest także akceptowane przez `plugins update` ze względu na kompatybilność, ale jest przestarzałe i nie zmienia już zachowania aktualizacji pluginów. Operatorskie `security.installPolicy` nadal może blokować aktualizacje; hooki pluginów `before_install` mają zastosowanie tylko w procesach, w których hooki pluginów są załadowane.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk przy aktualizacji">
    Aktualizacje społecznościowych pluginów wspieranych przez ClawHub wykonują tę samą kontrolę zaufania dokładnego wydania co instalacje przed pobraniem pakietu zastępczego. Użyj `--acknowledge-clawhub-risk` dla sprawdzonej automatyzacji, która powinna kontynuować, gdy wybrane wydanie ClawHub ma ryzykowne ostrzeżenie zaufania. Oficjalne pakiety ClawHub i dołączone źródła pluginów OpenClaw pomijają ten monit zaufania wydania.
  </Accordion>
</AccordionGroup>

### Inspekcja

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspekcja pokazuje tożsamość, status ładowania, źródło, możliwości manifestu, flagi zasad, diagnostykę, metadane instalacji, możliwości pakietu oraz wykryte wsparcie serwera MCP lub LSP bez domyślnego importowania runtime pluginu. Wyjście JSON obejmuje kontrakty manifestu pluginu, takie jak `contracts.agentToolResultMiddleware` i `contracts.trustedToolPolicies`, aby operatorzy mogli audytować deklaracje zaufanej powierzchni przed włączeniem lub ponownym uruchomieniem pluginu. Dodaj `--runtime`, aby załadować moduł pluginu i dołączyć zarejestrowane hooki, narzędzia, polecenia, usługi, metody Gateway oraz trasy HTTP. Inspekcja runtime zgłasza brakujące zależności pluginu bezpośrednio; instalacje i naprawy pozostają w `openclaw plugins install`, `openclaw plugins update` oraz `openclaw doctor --fix`.

Polecenia CLI należące do pluginów są zwykle instalowane jako główne grupy poleceń `openclaw`, ale pluginy mogą też rejestrować zagnieżdżone polecenia pod rodzicem core, takim jak `openclaw nodes`. Gdy `inspect --runtime` pokaże polecenie pod `cliCommands`, uruchom je pod podaną ścieżką; na przykład plugin rejestrujący `demo-git` można zweryfikować za pomocą `openclaw demo-git ping`.

Każdy plugin jest klasyfikowany według tego, co faktycznie rejestruje w runtime:

- **plain-capability** — jeden typ możliwości (np. plugin wyłącznie providera)
- **hybrid-capability** — wiele typów możliwości (np. tekst + mowa + obrazy)
- **hook-only** — tylko hooki, bez możliwości lub powierzchni
- **non-capability** — narzędzia/polecenia/usługi, ale bez możliwości

Zobacz [Kształty Plugin](/pl/plugins/architecture#plugin-shapes), aby dowiedzieć się więcej o modelu możliwości.

<Note>
Flaga `--json` wypisuje raport czytelny maszynowo, odpowiedni do skryptów i audytu. `inspect --all` renderuje tabelę dla całej floty z kolumnami kształtu, rodzajów możliwości, powiadomień o kompatybilności, możliwości pakietu i podsumowania hooków. `info` jest aliasem dla `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` zgłasza błędy ładowania pluginów, diagnostykę manifestu/wykrywania, powiadomienia o kompatybilności oraz nieaktualne odwołania konfiguracji pluginów, takie jak brakujące sloty pluginów. Gdy drzewo instalacji i konfiguracja pluginów są czyste, wypisuje `No plugin issues detected.` Jeśli pozostaje nieaktualna konfiguracja, ale drzewo instalacji poza tym jest zdrowe, podsumowanie mówi o tym zamiast sugerować pełne zdrowie pluginów.

Jeśli skonfigurowany plugin jest obecny na dysku, ale zablokowany przez kontrole bezpieczeństwa ścieżek loadera, walidacja konfiguracji zachowuje wpis pluginu i zgłasza go jako `present but blocked`. Napraw poprzedzającą diagnostykę zablokowanego pluginu, taką jak własność ścieżki lub uprawnienia zapisu dla wszystkich, zamiast usuwać konfigurację `plugins.entries.<id>` albo `plugins.allow`.

W przypadku błędów kształtu modułu, takich jak brakujące eksporty `register`/`activate`, uruchom ponownie z `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, aby dołączyć zwarte podsumowanie kształtu eksportów w wyjściu diagnostycznym.

### Rejestr

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Lokalny rejestr pluginów to utrwalony zimny model odczytu OpenClaw dla tożsamości zainstalowanych pluginów, włączenia, metadanych źródła i własności wkładów. Normalny start, wyszukiwanie właściciela providera, klasyfikacja konfiguracji kanału i inwentarz pluginów mogą go odczytywać bez importowania modułów runtime pluginów.

Użyj `plugins registry`, aby sprawdzić, czy utrwalony rejestr jest obecny, aktualny lub nieaktualny. Użyj `--refresh`, aby odbudować go z utrwalonego indeksu pluginów, zasad konfiguracji oraz metadanych manifestu/pakietu. To jest ścieżka naprawy, a nie ścieżka aktywacji runtime.

`openclaw doctor --fix` naprawia także przylegający do rejestru dryf zarządzanego npm: jeśli osierocony lub odzyskany pakiet `@openclaw/*` pod zarządzanym projektem npm pluginu albo starszym płaskim zarządzanym katalogiem głównym npm przesłania dołączony plugin, doctor usuwa ten nieaktualny pakiet i odbudowuje rejestr, aby start walidował względem dołączonego manifestu. Doctor ponownie łączy także pakiet hosta `openclaw` z zarządzanymi pluginami npm deklarującymi `peerDependencies.openclaw`, dzięki czemu lokalne dla pakietu importy runtime, takie jak `openclaw/plugin-sdk/*`, rozwiązują się po aktualizacjach lub naprawach npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` to przestarzały awaryjny przełącznik kompatybilności dla awarii odczytu rejestru. Preferuj `plugins registry --refresh` albo `openclaw doctor --fix`; fallback env służy tylko do awaryjnego odzyskiwania startu podczas wdrażania migracji.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

Lista marketplace akceptuje lokalną ścieżkę marketplace, ścieżkę `marketplace.json`, skrót GitHub w rodzaju `owner/repo`, URL repozytorium GitHub albo URL git. `--json` wypisuje etykietę rozpoznanego źródła oraz sparsowany manifest marketplace i wpisy Plugin.

Odświeżanie marketplace wczytuje hostowany kanał marketplace OpenClaw i zapisuje
zweryfikowaną odpowiedź jako lokalną migawkę hostowanego kanału. Bez opcji używa
skonfigurowanego domyślnego profilu kanału. Użyj `--feed-profile <name>`, aby odświeżyć
konkretny skonfigurowany profil, `--feed-url <url>`, aby odświeżyć jawny URL
hostowanego kanału, `--expected-sha256 <sha256>`, aby wymagać zgodnej sumy kontrolnej
ładunku (`sha256:<hex>` albo surowy 64-znakowy skrót szesnastkowy), oraz `--json` dla
wyniku czytelnego maszynowo. Jawne URL-e hostowanych kanałów nie mogą zawierać
poświadczeń, ciągów zapytania ani fragmentów. Odświeżenia bez przypięcia mogą zgłosić
hostowaną migawkę albo wynik rezerwowy z pakietu bez niepowodzenia polecenia. Odświeżenia
z przypięciem kończą się niepowodzeniem, chyba że zaakceptują świeży hostowany ładunek,
a udane hostowane odświeżenia kończą się niepowodzeniem, jeśli OpenClaw nie może zapisać
zweryfikowanej migawki.

## Powiązane

- [Tworzenie Plugin](/pl/plugins/building-plugins)
- [Dokumentacja CLI](/pl/cli)
- [ClawHub](/pl/clawhub)
