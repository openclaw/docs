---
read_when:
    - Chcesz zainstalować Pluginy Gateway lub zgodne pakiety
    - Chcesz utworzyć szkielet lub zweryfikować prosty Plugin narzędziowy
    - Chcesz debugować błędy ładowania Plugin
sidebarTitle: Plugins
summary: Dokumentacja referencyjna CLI dla `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Pluginy
x-i18n:
    generated_at: "2026-06-27T17:22:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4366a862f6a8996b38b624760eef407969f35a7451e3b2a1d5e82746d73b678
    source_path: cli/plugins.md
    workflow: 16
---

Zarządzaj Pluginami Gateway, pakietami hooków i zgodnymi pakietami.

<CardGroup cols={2}>
  <Card title="System Pluginów" href="/pl/tools/plugin">
    Przewodnik dla użytkowników końcowych po instalowaniu, włączaniu i rozwiązywaniu problemów z Pluginami.
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
    Wzmacnianie bezpieczeństwa instalacji Pluginów.
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
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

Aby zbadać powolną instalację, inspekcję, odinstalowanie lub odświeżenie rejestru, uruchom
polecenie z `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Ślad zapisuje czasy faz
do stderr i pozostawia wyjście JSON możliwe do parsowania. Zobacz [Debugowanie](/pl/help/debugging#plugin-lifecycle-trace).

<Note>
W trybie Nix (`OPENCLAW_NIX_MODE=1`) mutatory cyklu życia Pluginów są wyłączone. Użyj źródła Nix dla tej instalacji zamiast `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` lub `plugins disable`; w przypadku nix-openclaw użyj ścieżki [Szybki start](https://github.com/openclaw/nix-openclaw#quick-start) z agentem na pierwszym miejscu.
</Note>

<Note>
Dołączone Pluginy są dostarczane z OpenClaw. Niektóre są domyślnie włączone (na przykład dołączeni dostawcy modeli, dołączeni dostawcy mowy i dołączony Plugin przeglądarki); inne wymagają `plugins enable`.

Natywne Pluginy OpenClaw muszą dostarczać `openclaw.plugin.json` z wbudowanym schematem JSON (`configSchema`, nawet jeśli jest pusty). Zgodne pakiety używają zamiast tego własnych manifestów pakietów.

`plugins list` pokazuje `Format: openclaw` lub `Format: bundle`. Szczegółowe wyjście list/info pokazuje także podtyp pakietu (`codex`, `claude` lub `cursor`) oraz wykryte możliwości pakietu.
</Note>

### Autor

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` domyślnie tworzy minimalny Plugin narzędziowy TypeScript. Pierwszy
argument to identyfikator Pluginu; przekaż `--name` jako nazwę wyświetlaną. OpenClaw używa
identyfikatora dla domyślnego katalogu wyjściowego i nazewnictwa pakietu. Szkielety narzędzi używają
`defineToolPlugin`.
`plugins build` importuje zbudowany punkt wejścia, odczytuje jego statyczne metadane narzędzia, zapisuje
`openclaw.plugin.json` i utrzymuje `package.json` `openclaw.extensions` w zgodności.
`plugins validate` sprawdza, czy wygenerowany manifest, metadane pakietu i
bieżący eksport punktu wejścia nadal są zgodne. Zobacz [Pluginy narzędziowe](/pl/plugins/tool-plugins), aby poznać
pełny przepływ tworzenia narzędzi.

Szkielet zapisuje źródło TypeScript, ale generuje metadane ze zbudowanego
punktu wejścia `./dist/index.js`, więc przepływ działa także z opublikowanym CLI. Użyj
`--entry <path>`, gdy punkt wejścia nie jest domyślnym punktem wejścia pakietu. Użyj
`plugins build --check` w CI, aby zakończyć niepowodzeniem, gdy wygenerowane metadane są nieaktualne, bez
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

Szkielety dostawców tworzą ogólny Plugin dostawcy tekstu/modeli z obsługą
kluczy API zgodną z OpenAI, wbudowanym skryptem `npm run validate` dla `clawhub package
validate`, metadanymi pakietu ClawHub oraz ręcznie uruchamianym przepływem GitHub
do przyszłego zaufanego publikowania przez GitHub Actions OIDC. Szkielety dostawców
nie generują Skills i nie używają `openclaw plugins build` ani
`openclaw plugins validate`; te polecenia są przeznaczone dla ścieżki
wygenerowanych metadanych szkieletu narzędziowego.

Przed publikacją zastąp zastępczy bazowy adres URL API, katalog modeli, trasę
dokumentacji, tekst poświadczeń i treść README rzeczywistymi szczegółami dostawcy. Użyj
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

Opiekunowie testujący instalacje w czasie konfiguracji mogą nadpisać automatyczne źródła
instalacji Pluginów za pomocą chronionych zmiennych środowiskowych. Zobacz
[Nadpisania instalacji Pluginów](/pl/plugins/install-overrides).

<Warning>
Same nazwy pakietów instalują się domyślnie z npm podczas przejścia startowego, chyba że pasują do oficjalnego identyfikatora Pluginu. Surowe specyfikacje pakietów `@openclaw/*`, które pasują do dołączonych Pluginów, używają dołączonej kopii dostarczonej z bieżącą kompilacją OpenClaw. Użyj `npm:<package>`, gdy celowo chcesz zamiast tego zewnętrzny pakiet npm. Użyj `clawhub:<package>` dla ClawHub. Traktuj instalacje Pluginów jak uruchamianie kodu. Preferuj przypięte wersje.
</Warning>

`plugins search` odpytuje ClawHub o możliwe do zainstalowania pakiety Pluginów i wypisuje
nazwy pakietów gotowe do instalacji. Przeszukuje pakiety Pluginów kodu i pakiety Pluginów pakietowych,
nie Skills. Użyj `openclaw skills search` dla Skills ClawHub.

<Note>
ClawHub jest główną powierzchnią dystrybucji i odkrywania dla większości Pluginów. Npm
pozostaje obsługiwaną ścieżką awaryjną i bezpośredniej instalacji. Pakiety Pluginów
`@openclaw/*` należące do OpenClaw są ponownie publikowane w npm; zobacz bieżącą listę
na [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) albo
[inwentarz Pluginów](/pl/plugins/plugin-inventory). Stabilne instalacje używają `latest`.
Instalacje i aktualizacje kanału beta preferują dist-tag npm `beta`, gdy ten tag
jest dostępny, a następnie wracają do `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Dołączenia konfiguracji i naprawa nieprawidłowej konfiguracji">
    Jeśli Twoja sekcja `plugins` jest oparta na jednoplikowym `$include`, `plugins install/update/enable/disable/uninstall` zapisuje do tego dołączonego pliku i pozostawia `openclaw.json` bez zmian. Dołączenia główne, tablice dołączeń i dołączenia z nadpisaniami rodzeństwa kończą się zamknięciem zamiast spłaszczania. Zobacz [Dołączenia konfiguracji](/pl/gateway/configuration), aby poznać obsługiwane kształty.

    Jeśli konfiguracja jest nieprawidłowa podczas instalacji, `plugins install` zwykle kończy się zamknięciem i informuje, aby najpierw uruchomić `openclaw doctor --fix`. Podczas uruchamiania Gateway i przeładowania na gorąco nieprawidłowa konfiguracja Pluginów kończy się zamknięciem tak jak każda inna nieprawidłowa konfiguracja; `openclaw doctor --fix` może poddać kwarantannie nieprawidłowy wpis Pluginu. Jedynym udokumentowanym wyjątkiem w czasie instalacji jest wąska ścieżka odzyskiwania dołączonych Pluginów dla Pluginów, które jawnie zgadzają się na `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force i ponowna instalacja kontra aktualizacja">
    `--force` ponownie używa istniejącego celu instalacji i nadpisuje już zainstalowany Plugin lub pakiet hooków w miejscu. Użyj go, gdy celowo ponownie instalujesz ten sam identyfikator z nowej ścieżki lokalnej, archiwum, pakietu ClawHub lub artefaktu npm. Do rutynowych uaktualnień już śledzonego Pluginu npm preferuj `openclaw plugins update <id-or-npm-spec>`.

    Jeśli uruchomisz `plugins install` dla identyfikatora Pluginu, który jest już zainstalowany, OpenClaw zatrzyma się i wskaże `plugins update <id-or-npm-spec>` dla normalnego uaktualnienia albo `plugins install <package> --force`, gdy naprawdę chcesz nadpisać bieżącą instalację z innego źródła.

  </Accordion>
  <Accordion title="Zakres --pin">
    `--pin` dotyczy tylko instalacji npm. Nie jest obsługiwane z instalacjami `git:`; użyj jawnego odwołania git, takiego jak `git:github.com/acme/plugin@v1.2.3`, gdy chcesz przypięte źródło. Nie jest obsługiwane z `--marketplace`, ponieważ instalacje z marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` jest przestarzałe i obecnie nic nie robi. OpenClaw nie uruchamia już wbudowanego blokowania niebezpiecznego kodu w czasie instalacji dla instalacji Pluginów.

    Użyj współdzielonej powierzchni `security.installPolicy` należącej do operatora, gdy wymagana jest polityka instalacji specyficzna dla hosta. Hooki Pluginu `before_install` są hookami cyklu życia środowiska uruchomieniowego Pluginu i nie są główną granicą polityki dla instalacji CLI.

    Jeśli Plugin opublikowany przez Ciebie w ClawHub jest ukryty lub zablokowany przez skan rejestru, użyj kroków wydawcy w [publikowaniu ClawHub](/pl/clawhub/publishing). `--dangerously-force-unsafe-install` nie prosi ClawHub o ponowne przeskanowanie Pluginu ani o upublicznienie zablokowanego wydania.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Społecznościowe instalacje ClawHub sprawdzają rekord zaufania wybranego wydania przed pobraniem pakietu. Jeśli ClawHub wyłącza pobieranie dla wydania, zgłasza złośliwe wyniki skanowania albo umieszcza wydanie w blokującym stanie moderacji, takim jak kwarantanna, OpenClaw odrzuca wydanie. W przypadku nieblokujących ryzykownych statusów skanowania, ryzykownych stanów moderacji lub powodów rejestru OpenClaw pokazuje szczegóły zaufania i prosi o potwierdzenie przed kontynuowaniem.

    Użyj `--acknowledge-clawhub-risk` tylko po przejrzeniu ostrzeżenia ClawHub i podjęciu decyzji o kontynuacji bez interaktywnego monitu. Oczekujące lub nieaktualne czyste rekordy zaufania ostrzegają, ale nie wymagają potwierdzenia. Oficjalne pakiety ClawHub i dołączone źródła Pluginów OpenClaw pomijają ten monit zaufania wydania.

  </Accordion>
  <Accordion title="Pakiety hooków i specyfikacje npm">
    `plugins install` jest także powierzchnią instalacji dla pakietów hooków, które ujawniają `openclaw.hooks` w `package.json`. Użyj `openclaw hooks` dla filtrowanej widoczności hooków i włączania poszczególnych hooków, nie do instalowania pakietów.

    Specyfikacje npm są **wyłącznie rejestrowe** (nazwa pakietu + opcjonalna **dokładna wersja** lub **dist-tag**). Specyfikacje Git/URL/file i zakresy semver są odrzucane. Instalacje zależności uruchamiają się w jednym zarządzanym projekcie npm na Plugin z `--ignore-scripts` dla bezpieczeństwa, nawet gdy Twoja powłoka ma globalne ustawienia instalacji npm. Zarządzane projekty npm Pluginów dziedziczą poziom pakietu npm `overrides` OpenClaw, więc przypięcia bezpieczeństwa hosta dotyczą także wyniesionych zależności Pluginów.

    Użyj `npm:<package>`, gdy chcesz uczynić rozwiązywanie npm jawnym. Same specyfikacje pakietów także instalują bezpośrednio z npm podczas przejścia startowego, chyba że pasują do oficjalnego identyfikatora Pluginu.

    Surowe specyfikacje pakietów `@openclaw/*`, które pasują do bundled plugins, są rozwiązywane do należącej do obrazu kopii bundled przed awaryjnym użyciem npm. Na przykład `openclaw plugins install @openclaw/discord@2026.5.20 --pin` używa bundled Plugin Discord z bieżącej kompilacji OpenClaw zamiast tworzyć zarządzane nadpisanie npm. Aby wymusić zewnętrzny pakiet npm, użyj `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Gołe specyfikacje i `@latest` pozostają na ścieżce stabilnej. Opatrzone datą wersje poprawek OpenClaw, takie jak `2026.5.3-1`, są dla tego sprawdzenia wydaniami stabilnymi. Jeśli npm rozwiąże którąkolwiek z nich do wersji wstępnej, OpenClaw zatrzyma się i poprosi o jawne wyrażenie zgody za pomocą tagu wersji wstępnej, takiego jak `@beta`/`@rc`, albo dokładnej wersji wstępnej, takiej jak `@1.2.3-beta.4`.

    Dla instalacji npm bez dokładnej wersji (`npm:<package>` lub `npm:<package>@latest`) OpenClaw przed instalacją sprawdza rozwiązane metadane pakietu. Jeśli najnowszy stabilny pakiet wymaga nowszego API Plugin OpenClaw albo minimalnej wersji hosta, OpenClaw sprawdza starsze stabilne wersje i instaluje najnowsze zgodne wydanie. Dokładne wersje i jawne dist-tagi, takie jak `@beta`, pozostają ścisłe: jeśli wybrany pakiet jest niezgodny, polecenie kończy się niepowodzeniem i prosi o uaktualnienie OpenClaw albo wybranie zgodnej wersji.

    Jeśli goła specyfikacja instalacji pasuje do oficjalnego identyfikatora Plugin (na przykład `diffs`), OpenClaw instaluje bezpośrednio wpis z katalogu. Aby zainstalować pakiet npm o tej samej nazwie, użyj jawnej specyfikacji z zakresem (na przykład `@scope/diffs`).

  </Accordion>
  <Accordion title="Repozytoria Git">
    Użyj `git:<repo>`, aby instalować bezpośrednio z repozytorium git. Obsługiwane formy obejmują `git:github.com/owner/repo`, `git:owner/repo`, pełne adresy URL klonowania `https://`, `ssh://`, `git://`, `file://` oraz `git@host:owner/repo.git`. Dodaj `@<ref>` lub `#<ref>`, aby przed instalacją przełączyć się na gałąź, tag albo commit.

    Instalacje Git klonują do katalogu tymczasowego, przełączają się na żądaną referencję, jeśli jest podana, a następnie używają zwykłego instalatora katalogu Plugin. Oznacza to, że walidacja manifestu, polityka instalacji operatora, instalacja przez menedżer pakietów i rekordy instalacji zachowują się tak jak przy instalacjach npm. Zarejestrowane instalacje git zawierają źródłowy URL/ref oraz rozwiązany commit, dzięki czemu `openclaw plugins update` może później ponownie rozwiązać źródło.

    Po instalacji z git użyj `openclaw plugins inspect <id> --runtime --json`, aby zweryfikować rejestracje runtime, takie jak metody Gateway i polecenia CLI. Jeśli Plugin zarejestrował korzeń CLI za pomocą `api.registerCli`, wykonaj to polecenie bezpośrednio przez główne CLI OpenClaw, na przykład `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archiwa">
    Obsługiwane archiwa: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Natywne archiwa Plugin OpenClaw muszą zawierać prawidłowy `openclaw.plugin.json` w wyodrębnionym katalogu głównym Plugin; archiwa zawierające tylko `package.json` są odrzucane, zanim OpenClaw zapisze rekordy instalacji.

    Użyj `npm-pack:<path.tgz>`, gdy plik jest archiwum tarball npm-pack i chcesz
    przetestować tę samą ścieżkę zarządzanego projektu npm dla poszczególnych Plugin,
    która jest używana przez instalacje z rejestru, w tym weryfikację `package-lock.json`,
    skanowanie wyniesionych zależności oraz rekordy instalacji npm. Zwykłe ścieżki
    archiwów nadal instalują się jako lokalne archiwa pod katalogiem głównym rozszerzeń Plugin.

    Obsługiwane są także instalacje z marketplace Claude.

  </Accordion>
</AccordionGroup>

Instalacje ClawHub używają jawnego lokalizatora `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Gołe, bezpieczne dla npm specyfikacje Plugin domyślnie instalują się z npm podczas przełączenia startowego, chyba że pasują do oficjalnego identyfikatora Plugin:

```bash
openclaw plugins install openclaw-codex-app-server
```

Użyj `npm:`, aby jawnie wymusić rozwiązywanie wyłącznie przez npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw przed instalacją sprawdza deklarowaną zgodność API Plugin / minimalną zgodność Gateway. Gdy wybrana wersja ClawHub publikuje artefakt ClawPack, OpenClaw pobiera wersjonowany `.tgz` npm-pack, weryfikuje nagłówek digest ClawHub oraz digest artefaktu, a następnie instaluje go przez zwykłą ścieżkę archiwum. Starsze wersje ClawHub bez metadanych ClawPack nadal instalują się przez starszą ścieżkę weryfikacji archiwum pakietu. Zarejestrowane instalacje zachowują metadane źródła ClawHub, rodzaj artefaktu, integralność npm, shasum npm, nazwę tarballa oraz fakty digest ClawPack do późniejszych aktualizacji.
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
    - nazwa znanego marketplace Claude z `~/.claude/plugins/known_marketplaces.json`
    - lokalny katalog główny marketplace albo ścieżka `marketplace.json`
    - skrót repozytorium GitHub, taki jak `owner/repo`
    - URL repozytorium GitHub, taki jak `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Reguły zdalnych marketplace">
    W przypadku zdalnych marketplace ładowanych z GitHub lub git wpisy Plugin muszą pozostać wewnątrz sklonowanego repozytorium marketplace. OpenClaw akceptuje źródła ze ścieżkami względnymi z tego repozytorium i odrzuca HTTP(S), ścieżki bezwzględne, git, GitHub oraz inne nieścieżkowe źródła Plugin ze zdalnych manifestów.
  </Tab>
</Tabs>

Dla lokalnych ścieżek i archiwów OpenClaw wykrywa automatycznie:

- natywne Plugin OpenClaw (`openclaw.plugin.json`)
- pakiety zgodne z Codex (`.codex-plugin/plugin.json`)
- pakiety zgodne z Claude (`.claude-plugin/plugin.json` albo domyślny układ komponentów Claude)
- pakiety zgodne z Cursor (`.cursor-plugin/plugin.json`)

Zarządzane instalacje lokalne muszą być katalogami albo archiwami Plugin. Samodzielne pliki Plugin `.js`,
`.mjs`, `.cjs` i `.ts` nie są kopiowane do zarządzanego katalogu głównego Plugin
przez `plugins install`; zamiast tego wymień je jawnie w `plugins.load.paths`.

<Note>
Zgodne pakiety instalują się w zwykłym katalogu głównym Plugin i uczestniczą w tym samym przepływie list/info/enable/disable. Obecnie obsługiwane są Skills pakietów, command-skills Claude, domyślne wartości Claude `settings.json`, domyślne wartości Claude `.lsp.json` / deklarowane w manifeście `lspServers`, command-skills Cursor oraz zgodne katalogi hook Codex; inne wykryte możliwości pakietów są pokazywane w diagnostyce/informacjach, ale nie są jeszcze podłączone do wykonywania runtime.
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
  Przełącz z widoku tabeli na szczegółowe wiersze dla poszczególnych Plugin z metadanymi źródła/pochodzenia/wersji/aktywacji.
</ParamField>
<ParamField path="--json" type="boolean">
  Inwentarz czytelny maszynowo oraz diagnostyka rejestru i stan instalacji zależności pakietów.
</ParamField>

<Note>
`plugins list` najpierw odczytuje utrwalony lokalny rejestr Plugin, z awaryjnym wariantem wyprowadzonym wyłącznie z manifestu, gdy rejestru brakuje albo jest nieprawidłowy. Przydaje się do sprawdzania, czy Plugin jest zainstalowany, włączony i widoczny dla planowania zimnego startu, ale nie jest sondą runtime na żywo już uruchomionego procesu Gateway. Po zmianie kodu Plugin, stanu włączenia, polityki hook albo `plugins.load.paths` uruchom ponownie Gateway obsługujący kanał, zanim zaczniesz oczekiwać uruchomienia nowego kodu `register(api)` lub hook. W przypadku wdrożeń zdalnych/kontenerowych upewnij się, że ponownie uruchamiasz rzeczywisty proces potomny `openclaw gateway run`, a nie tylko proces opakowujący.

`plugins list --json` zawiera `dependencyStatus` każdego Plugin z `dependencies`
i `optionalDependencies` w `package.json`. OpenClaw sprawdza, czy te nazwy pakietów
są obecne w normalnej ścieżce wyszukiwania Node `node_modules` dla Plugin; nie
importuje kodu runtime Plugin, nie uruchamia menedżera pakietów ani nie naprawia
brakujących zależności.
</Note>

Jeśli logi startowe pokazują `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
uruchom `openclaw plugins list --enabled --verbose` albo
`openclaw plugins inspect <id>` z podanym identyfikatorem Plugin, aby potwierdzić
identyfikatory Plugin i skopiować zaufane identyfikatory do `plugins.allow` w `openclaw.json`. Gdy
ostrzeżenie może wymienić każdy wykryty Plugin, wypisuje gotowy do wklejenia
fragment `plugins.allow`, który już zawiera te identyfikatory. Jeśli Plugin ładuje się
bez pochodzenia instalacji/ścieżki ładowania, sprawdź ten identyfikator Plugin, a następnie albo przypnij
zaufany identyfikator w `plugins.allow`, albo zainstaluj Plugin ponownie z zaufanego źródła,
aby OpenClaw zapisał pochodzenie instalacji.

`plugins search` to zdalne wyszukiwanie katalogu ClawHub. Nie sprawdza lokalnego
stanu, nie mutuje konfiguracji, nie instaluje pakietów ani nie ładuje kodu runtime Plugin. Wyniki
wyszukiwania obejmują nazwę pakietu ClawHub, rodzinę, kanał, wersję, podsumowanie oraz
wskazówkę instalacji, taką jak `openclaw plugins install clawhub:<package>`.

Do pracy nad bundled Plugin wewnątrz spakowanego obrazu Docker podmontuj katalog
źródłowy Plugin nad odpowiadającą mu spakowaną ścieżką źródłową, taką jak
`/app/extensions/synology-chat`. OpenClaw wykryje tę podmontowaną nakładkę źródłową
przed `/app/dist/extensions/synology-chat`; zwykły skopiowany katalog źródłowy
pozostaje nieaktywny, więc normalne spakowane instalacje nadal używają skompilowanego dist.

Do debugowania hook runtime:

- `openclaw plugins inspect <id> --runtime --json` pokazuje zarejestrowane hook i diagnostykę z przebiegu inspekcji z załadowanym modułem. Inspekcja runtime nigdy nie instaluje zależności; użyj `openclaw doctor --fix`, aby wyczyścić starszy stan zależności albo odzyskać brakujące, możliwe do pobrania Plugin, do których odwołuje się konfiguracja.
- `openclaw gateway status --deep --require-rpc` potwierdza osiągalny URL/profil Gateway, wskazówki usługi/procesu, ścieżkę konfiguracji i kondycję RPC.
- Niebundled hook konwersacji (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) wymagają `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Użyj `--link`, aby uniknąć kopiowania lokalnego katalogu Plugin (dodaje go do `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

Samodzielne pliki Plugin muszą być wymienione w `plugins.load.paths`, a nie
instalowane przez `plugins install` ani umieszczane bezpośrednio w `~/.openclaw/extensions`
lub `<workspace>/.openclaw/extensions`. Te automatycznie wykrywane katalogi główne ładują katalogi
pakietów albo pakietów zgodności Plugin, natomiast pliki skryptów najwyższego poziomu są traktowane jako lokalne
pomocniki i pomijane.

<Note>
Pluginy pochodzące z obszaru roboczego, wykryte w katalogu głównym rozszerzeń obszaru roboczego, nie są
importowane ani wykonywane, dopóki nie zostaną jawnie włączone. W przypadku rozwoju lokalnego
uruchom `openclaw plugins enable <plugin-id>` albo ustaw
`plugins.entries.<plugin-id>.enabled: true`; jeśli konfiguracja używa
`plugins.allow`, dodaj tam również ten sam identyfikator pluginu. Ta reguła fail-closed
obowiązuje także wtedy, gdy konfiguracja kanału jawnie wskazuje plugin pochodzący z obszaru roboczego do
ładowania wyłącznie na potrzeby konfiguracji, więc lokalny kod konfiguracji pluginu kanału nie zostanie uruchomiony, gdy ten
plugin obszaru roboczego pozostaje wyłączony albo wykluczony z listy dozwolonych. Instalacje połączone
i jawne wpisy `plugins.load.paths` podlegają normalnej polityce dla ich
rozstrzygniętego pochodzenia pluginu. Zobacz
[Konfigurowanie polityki pluginów](/pl/tools/plugin#configure-plugin-policy)
oraz [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#plugins).

`--force` nie jest obsługiwane z `--link`, ponieważ instalacje połączone ponownie używają ścieżki źródłowej zamiast kopiować pliki do zarządzanego celu instalacji.

Użyj `--pin` przy instalacjach npm, aby zapisać rozstrzygniętą dokładną specyfikację (`name@version`) w zarządzanym indeksie pluginów, zachowując domyślne zachowanie bez przypinania.
</Note>

### Indeks pluginów

Metadane instalacji pluginów to stan zarządzany maszynowo, a nie konfiguracja użytkownika. Instalacje i aktualizacje zapisują je we współdzielonej bazie danych stanu SQLite w aktywnym katalogu stanu OpenClaw. Wiersz `installed_plugin_index` przechowuje trwałe metadane `installRecords`, w tym rekordy uszkodzonych lub brakujących manifestów pluginów, oraz pochodzącą z manifestu zimną pamięć podręczną rejestru używaną przez `openclaw plugins update`, odinstalowywanie, diagnostykę i zimny rejestr pluginów.

Gdy OpenClaw wykryje dostarczone starsze rekordy `plugins.installs` w konfiguracji, odczyty środowiska wykonawczego traktują je jako dane wejściowe zgodności bez przepisywania `openclaw.json`. Jawne zapisy pluginów i `openclaw doctor --fix` przenoszą te rekordy do indeksu pluginów i usuwają klucz konfiguracji, gdy zapisy konfiguracji są dozwolone; jeśli którykolwiek zapis się nie powiedzie, rekordy konfiguracji są zachowywane, aby metadane instalacji nie zostały utracone.

### Odinstalowanie

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` usuwa rekordy pluginów z `plugins.entries`, utrwalonego indeksu pluginów, wpisów listy dozwolonych/zakazanych pluginów oraz połączonych wpisów `plugins.load.paths`, gdy ma to zastosowanie. O ile nie ustawiono `--keep-files`, odinstalowanie usuwa także śledzony zarządzany katalog instalacji, gdy znajduje się on w katalogu głównym rozszerzeń pluginów OpenClaw. W przypadku pluginów Active Memory slot pamięci resetuje się do `memory-core`.

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

Aktualizacje mają zastosowanie do śledzonych instalacji pluginów w zarządzanym indeksie pluginów oraz śledzonych instalacji pakietów hooków w `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Rozstrzyganie identyfikatora pluginu względem specyfikacji npm">
    Gdy podasz identyfikator pluginu, OpenClaw ponownie używa zapisanej specyfikacji instalacji dla tego pluginu. Oznacza to, że wcześniej zapisane dist-tagi, takie jak `@beta`, oraz dokładne przypięte wersje nadal będą używane przy późniejszych uruchomieniach `update <id>`.

    Ta reguła ukierunkowanej aktualizacji różni się od ścieżki konserwacyjnej zbiorczego `openclaw plugins update --all`. Aktualizacje zbiorcze nadal respektują zwykłe śledzone specyfikacje instalacji, ale zaufane oficjalne rekordy pluginów OpenClaw mogą synchronizować się z bieżącym celem oficjalnego katalogu zamiast pozostawać przy nieaktualnym dokładnym oficjalnym pakiecie. Użyj ukierunkowanego `update <id>`, gdy celowo chcesz pozostawić dokładną lub otagowaną oficjalną specyfikację bez zmian.

    W przypadku instalacji npm możesz także podać jawną specyfikację pakietu npm z dist-tagiem albo dokładną wersją. OpenClaw rozstrzyga tę nazwę pakietu z powrotem do śledzonego rekordu pluginu, aktualizuje ten zainstalowany plugin i zapisuje nową specyfikację npm na potrzeby przyszłych aktualizacji opartych na identyfikatorze.

    Podanie nazwy pakietu npm bez wersji lub tagu również rozstrzyga się z powrotem do śledzonego rekordu pluginu. Użyj tego, gdy plugin był przypięty do dokładnej wersji i chcesz przenieść go z powrotem na domyślną linię wydań rejestru.

  </Accordion>
  <Accordion title="Aktualizacje kanału beta">
    Ukierunkowane `openclaw plugins update <id-or-npm-spec>` ponownie używa śledzonej specyfikacji pluginu, chyba że podasz nową specyfikację. Zbiorcze `openclaw plugins update --all` używa skonfigurowanego `update.channel`, gdy synchronizuje zaufane oficjalne rekordy pluginów z celem oficjalnego katalogu, więc instalacje z kanału beta mogą pozostać na linii wydań beta zamiast być po cichu normalizowane do stable/latest.

    `openclaw update` zna także aktywny kanał aktualizacji OpenClaw: na kanale beta rekordy pluginów npm i ClawHub z domyślnej linii najpierw próbują `@beta`. Wracają do zapisanej specyfikacji default/latest, jeśli nie istnieje wydanie beta pluginu; pluginy npm wracają także wtedy, gdy pakiet beta istnieje, ale nie przechodzi walidacji instalacji. Ten powrót jest zgłaszany jako ostrzeżenie i nie powoduje niepowodzenia aktualizacji rdzenia. Dokładne wersje i jawne tagi pozostają przypięte do tego selektora dla aktualizacji ukierunkowanych.

  </Accordion>
  <Accordion title="Kontrole wersji i dryf integralności">
    Przed aktualizacją npm na żywo OpenClaw sprawdza wersję zainstalowanego pakietu względem metadanych rejestru npm. Jeśli zainstalowana wersja i zapisana tożsamość artefaktu już odpowiadają rozstrzygniętemu celowi, aktualizacja jest pomijana bez pobierania, ponownej instalacji ani przepisywania `openclaw.json`.

    Gdy istnieje zapisany hash integralności, a hash pobranego artefaktu się zmienia, OpenClaw traktuje to jako dryf artefaktu npm. Interaktywne polecenie `openclaw plugins update` wypisuje oczekiwane i rzeczywiste hashe oraz prosi o potwierdzenie przed kontynuacją. Nieinteraktywne pomocniki aktualizacji stosują fail-closed, chyba że wywołujący dostarczy jawną politykę kontynuacji.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install przy aktualizacji">
    `--dangerously-force-unsafe-install` jest również akceptowane w `plugins update` ze względu na zgodność, ale jest przestarzałe i nie zmienia już zachowania aktualizacji pluginów. Operatorskie `security.installPolicy` nadal może blokować aktualizacje; hooki pluginów `before_install` mają zastosowanie tylko w procesach, w których hooki pluginów są załadowane.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk przy aktualizacji">
    Aktualizacje pluginów społecznościowych opartych na ClawHub uruchamiają tę samą kontrolę zaufania dokładnego wydania co instalacje przed pobraniem pakietu zastępczego. Użyj `--acknowledge-clawhub-risk` dla zweryfikowanej automatyzacji, która powinna kontynuować, gdy wybrane wydanie ClawHub ma ryzykowne ostrzeżenie zaufania. Oficjalne pakiety ClawHub i dołączone źródła pluginów OpenClaw omijają ten monit zaufania do wydania.
  </Accordion>
</AccordionGroup>

### Inspekcja

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspekcja pokazuje tożsamość, status ładowania, źródło, możliwości manifestu, flagi polityki, diagnostykę, metadane instalacji, możliwości pakietu oraz wykrytą obsługę serwera MCP lub LSP bez domyślnego importowania środowiska wykonawczego pluginu. Dane wyjściowe JSON obejmują kontrakty manifestu pluginu, takie jak `contracts.agentToolResultMiddleware` i `contracts.trustedToolPolicies`, aby operatorzy mogli audytować deklaracje zaufanych powierzchni przed włączeniem lub ponownym uruchomieniem pluginu. Dodaj `--runtime`, aby załadować moduł pluginu i uwzględnić zarejestrowane hooki, narzędzia, polecenia, usługi, metody Gateway oraz trasy HTTP. Inspekcja środowiska wykonawczego zgłasza bezpośrednio brakujące zależności pluginów; instalacje i naprawy pozostają w `openclaw plugins install`, `openclaw plugins update` i `openclaw doctor --fix`.

Polecenia CLI należące do pluginów są zwykle instalowane jako główne grupy poleceń `openclaw`, ale pluginy mogą także rejestrować zagnieżdżone polecenia pod nadrzędnym poleceniem rdzenia, takim jak `openclaw nodes`. Gdy `inspect --runtime` pokaże polecenie w `cliCommands`, uruchom je pod podaną ścieżką; na przykład plugin rejestrujący `demo-git` można zweryfikować za pomocą `openclaw demo-git ping`.

Każdy plugin jest klasyfikowany według tego, co faktycznie rejestruje w środowisku wykonawczym:

- **plain-capability** — jeden typ możliwości (np. plugin tylko dostawcy)
- **hybrid-capability** — wiele typów możliwości (np. tekst + mowa + obrazy)
- **hook-only** — tylko hooki, bez możliwości lub powierzchni
- **non-capability** — narzędzia/polecenia/usługi, ale bez możliwości

Więcej informacji o modelu możliwości znajdziesz w [Kształty pluginów](/pl/plugins/architecture#plugin-shapes).

<Note>
Flaga `--json` wypisuje raport czytelny maszynowo, odpowiedni do skryptów i audytu. `inspect --all` renderuje tabelę dla całej floty z kolumnami kształtu, rodzajów możliwości, powiadomień o zgodności, możliwości pakietu i podsumowania hooków. `info` jest aliasem dla `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` zgłasza błędy ładowania pluginów, diagnostykę manifestu/wykrywania, powiadomienia o zgodności oraz nieaktualne odwołania konfiguracji pluginów, takie jak brakujące sloty pluginów. Gdy drzewo instalacji i konfiguracja pluginów są czyste, wypisuje `No plugin issues detected.` Jeśli pozostaje nieaktualna konfiguracja, ale drzewo instalacji jest poza tym zdrowe, podsumowanie informuje o tym zamiast sugerować pełne zdrowie pluginów.

Jeśli skonfigurowany plugin jest obecny na dysku, ale blokowany przez kontrole bezpieczeństwa ścieżek loadera, walidacja konfiguracji zachowuje wpis pluginu i zgłasza go jako `present but blocked`. Napraw poprzedzającą diagnostykę zablokowanego pluginu, taką jak własność ścieżki lub uprawnienia do zapisu dla wszystkich, zamiast usuwać konfigurację `plugins.entries.<id>` lub `plugins.allow`.

W przypadku awarii kształtu modułu, takich jak brak eksportów `register`/`activate`, uruchom ponownie z `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, aby uwzględnić zwięzłe podsumowanie kształtu eksportów w danych diagnostycznych.

### Rejestr

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Lokalny rejestr pluginów to utrwalony zimny model odczytu OpenClaw dla tożsamości zainstalowanych pluginów, włączenia, metadanych źródła i własności wkładów. Zwykłe uruchamianie, wyszukiwanie właściciela dostawcy, klasyfikacja konfiguracji kanału i inwentaryzacja pluginów mogą go odczytywać bez importowania modułów środowiska wykonawczego pluginów.

Użyj `plugins registry`, aby sprawdzić, czy utrwalony rejestr jest obecny, bieżący lub nieaktualny. Użyj `--refresh`, aby przebudować go z utrwalonego indeksu pluginów, polityki konfiguracji i metadanych manifestu/pakietu. To ścieżka naprawy, a nie ścieżka aktywacji środowiska wykonawczego.

`openclaw doctor --fix` naprawia także dryf zarządzanego npm sąsiadujący z rejestrem: jeśli osierocony lub odzyskany pakiet `@openclaw/*` w zarządzanym projekcie npm pluginów albo starszy płaski zarządzany katalog główny npm przesłania dołączony plugin, doctor usuwa ten nieaktualny pakiet i przebudowuje rejestr, aby uruchamianie walidowało względem dołączonego manifestu. Doctor ponownie łączy także pakiet hosta `openclaw` z zarządzanymi pluginami npm, które deklarują `peerDependencies.openclaw`, aby lokalne dla pakietu importy środowiska wykonawczego, takie jak `openclaw/plugin-sdk/*`, rozstrzygały się po aktualizacjach lub naprawach npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` to przestarzały awaryjny przełącznik zgodności na wypadek błędów odczytu rejestru. Preferuj `plugins registry --refresh` albo `openclaw doctor --fix`; awaryjny fallback przez zmienną środowiskową służy tylko do odzyskiwania uruchamiania w nagłych przypadkach podczas wdrażania migracji.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Lista Marketplace akceptuje lokalną ścieżkę marketplace, ścieżkę `marketplace.json`, skrót GitHub w rodzaju `owner/repo`, URL repozytorium GitHub albo URL git. `--json` wypisuje rozstrzygniętą etykietę źródła oraz sparsowany manifest marketplace i wpisy pluginów.

## Powiązane

- [Budowanie pluginów](/pl/plugins/building-plugins)
- [Dokumentacja CLI](/pl/cli)
- [ClawHub](/pl/clawhub)
