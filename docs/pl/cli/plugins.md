---
read_when:
    - Chcesz instalować pluginy Gateway lub zgodne pakiety albo nimi zarządzać
    - Chcesz debugować błędy ładowania pluginów
sidebarTitle: Plugins
summary: Dokumentacja referencyjna CLI dla `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Pluginy
x-i18n:
    generated_at: "2026-05-06T10:05:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: c888d3fc8de0e25edc1c38f679d522a4e75cb09d986702451e29418d70a939f2
    source_path: cli/plugins.md
    workflow: 16
---

Zarządzaj Plugin Gateway, pakietami hooków i zgodnymi bundlami.

<CardGroup cols={2}>
  <Card title="System Plugin" href="/pl/tools/plugin">
    Przewodnik dla użytkownika końcowego dotyczący instalowania, włączania i rozwiązywania problemów z pluginami.
  </Card>
  <Card title="Zarządzaj pluginami" href="/pl/plugins/manage-plugins">
    Szybkie przykłady instalowania, wyświetlania listy, aktualizowania, odinstalowywania i publikowania.
  </Card>
  <Card title="Bundle Plugin" href="/pl/plugins/bundles">
    Model zgodności bundli.
  </Card>
  <Card title="Manifest Plugin" href="/pl/plugins/manifest">
    Pola manifestu i schemat konfiguracji.
  </Card>
  <Card title="Bezpieczeństwo" href="/pl/gateway/security">
    Wzmacnianie bezpieczeństwa instalacji pluginów.
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
```

Aby zbadać powolne instalowanie, inspekcję, odinstalowywanie lub odświeżanie rejestru, uruchom
polecenie z `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Ślad zapisuje czasy faz
do stderr i zachowuje możliwość parsowania wyjścia JSON. Zobacz [Debugowanie](/pl/help/debugging#plugin-lifecycle-trace).

<Note>
Dołączone pluginy są dostarczane z OpenClaw. Niektóre są domyślnie włączone (na przykład dołączeni dostawcy modeli, dołączeni dostawcy mowy i dołączony Plugin przeglądarki); inne wymagają `plugins enable`.

Natywne pluginy OpenClaw muszą dostarczać `openclaw.plugin.json` z wbudowanym JSON Schema (`configSchema`, nawet jeśli pustym). Zgodne bundle używają zamiast tego własnych manifestów bundli.

`plugins list` pokazuje `Format: openclaw` lub `Format: bundle`. Szczegółowe wyjście listy/informacji pokazuje też podtyp bundla (`codex`, `claude` lub `cursor`) oraz wykryte możliwości bundla.
</Note>

### Instalacja

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Same nazwy pakietów podczas przejścia po uruchomieniu są domyślnie instalowane z npm. Użyj `clawhub:<package>` dla ClawHub. Traktuj instalacje pluginów jak uruchamianie kodu. Preferuj przypięte wersje.
</Warning>

`plugins search` odpytuje ClawHub o możliwe do zainstalowania pakiety pluginów i wypisuje
nazwy pakietów gotowe do instalacji. Przeszukuje pakiety code-plugin i bundle-plugin,
a nie Skills. Użyj `openclaw skills search` dla Skills z ClawHub.

<Note>
ClawHub jest główną powierzchnią dystrybucji i odkrywania dla większości pluginów. Npm
pozostaje obsługiwaną ścieżką awaryjną i bezpośredniej instalacji. Należące do OpenClaw
pakiety pluginów `@openclaw/*` są ponownie publikowane w npm; zobacz bieżącą listę
na [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) lub
[inwentarz pluginów](/pl/plugins/plugin-inventory). Stabilne instalacje używają `latest`.
Instalacje i aktualizacje kanału beta preferują npm dist-tag `beta`, gdy ten tag
jest dostępny, a następnie wracają do `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Dołączenia konfiguracji i naprawa nieprawidłowej konfiguracji">
    Jeśli Twoja sekcja `plugins` jest oparta na jednoplikowym `$include`, `plugins install/update/enable/disable/uninstall` zapisują do tego dołączonego pliku i pozostawiają `openclaw.json` bez zmian. Dołączenia główne, tablice dołączeń i dołączenia z sąsiednimi nadpisaniami kończą się bezpiecznym niepowodzeniem zamiast spłaszczania. Zobacz [Dołączenia konfiguracji](/pl/gateway/configuration), aby poznać obsługiwane kształty.

    Jeśli konfiguracja jest nieprawidłowa podczas instalacji, `plugins install` zwykle kończy się bezpiecznym niepowodzeniem i informuje, aby najpierw uruchomić `openclaw doctor --fix`. Podczas uruchamiania Gateway i przeładowania na gorąco nieprawidłowa konfiguracja pluginów kończy się bezpiecznym niepowodzeniem jak każda inna nieprawidłowa konfiguracja; `openclaw doctor --fix` może poddać kwarantannie nieprawidłowy wpis pluginu. Jedynym udokumentowanym wyjątkiem w czasie instalacji jest wąska ścieżka odzyskiwania dołączonych pluginów dla pluginów, które jawnie zgadzają się na `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force i ponowna instalacja a aktualizacja">
    `--force` ponownie używa istniejącego celu instalacji i nadpisuje już zainstalowany Plugin lub pakiet hooków w miejscu. Użyj tego, gdy celowo ponownie instalujesz ten sam identyfikator z nowej ścieżki lokalnej, archiwum, pakietu ClawHub lub artefaktu npm. W przypadku rutynowych aktualizacji już śledzonego pluginu npm preferuj `openclaw plugins update <id-or-npm-spec>`.

    Jeśli uruchomisz `plugins install` dla identyfikatora pluginu, który jest już zainstalowany, OpenClaw zatrzyma się i wskaże `plugins update <id-or-npm-spec>` dla zwykłej aktualizacji albo `plugins install <package> --force`, gdy naprawdę chcesz nadpisać bieżącą instalację z innego źródła.

  </Accordion>
  <Accordion title="Zakres --pin">
    `--pin` dotyczy tylko instalacji npm. Nie jest obsługiwane z instalacjami `git:`; użyj jawnego refa git, takiego jak `git:github.com/acme/plugin@v1.2.3`, gdy chcesz przypięte źródło. Nie jest obsługiwane z `--marketplace`, ponieważ instalacje marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` to opcja awaryjna dla fałszywych alarmów we wbudowanym skanerze niebezpiecznego kodu. Pozwala kontynuować instalację nawet wtedy, gdy wbudowany skaner zgłasza znaleziska `critical`, ale **nie** omija blokad zasad hooka pluginu `before_install` i **nie** omija niepowodzeń skanowania.

    Ta flaga CLI dotyczy przepływów instalacji/aktualizacji pluginów. Instalacje zależności Skills obsługiwane przez Gateway używają odpowiadającego jej nadpisania żądania `dangerouslyForceUnsafeInstall`, podczas gdy `openclaw skills install` pozostaje osobnym przepływem pobierania/instalacji Skills z ClawHub.

    Jeśli Plugin opublikowany przez Ciebie w ClawHub jest blokowany przez skan rejestru, użyj kroków dla wydawcy w [ClawHub](/pl/tools/clawhub).

  </Accordion>
  <Accordion title="Pakiety hooków i specyfikacje npm">
    `plugins install` jest też powierzchnią instalacji dla pakietów hooków, które udostępniają `openclaw.hooks` w `package.json`. Używaj `openclaw hooks` do filtrowanej widoczności hooków i włączania poszczególnych hooków, a nie do instalacji pakietów.

    Specyfikacje npm są **tylko rejestrowe** (nazwa pakietu + opcjonalna **dokładna wersja** lub **dist-tag**). Specyfikacje Git/URL/plik oraz zakresy semver są odrzucane. Instalacje zależności działają lokalnie w projekcie z `--ignore-scripts` dla bezpieczeństwa, nawet gdy Twoja powłoka ma globalne ustawienia instalacji npm. Zarządzane korzenie npm pluginów dziedziczą pakietowe `overrides` npm OpenClaw, więc piny bezpieczeństwa hosta dotyczą też wyniesionych zależności pluginów.

    Użyj `npm:<package>`, gdy chcesz jawnie wskazać rozwiązywanie przez npm. Same specyfikacje pakietów podczas przejścia po uruchomieniu również instalują bezpośrednio z npm.

    Same specyfikacje i `@latest` pozostają na stabilnej ścieżce. Wersje poprawek OpenClaw ze stemplem daty, takie jak `2026.5.3-1`, są stabilnymi wydaniami dla tego sprawdzenia. Jeśli npm rozwiąże którąkolwiek z nich do wersji przedpremierowej, OpenClaw zatrzyma się i poprosi o jawne wyrażenie zgody za pomocą tagu przedpremierowego, takiego jak `@beta`/`@rc`, albo dokładnej wersji przedpremierowej, takiej jak `@1.2.3-beta.4`.

    Jeśli sama specyfikacja instalacji pasuje do oficjalnego identyfikatora pluginu (na przykład `diffs`), OpenClaw instaluje wpis katalogu bezpośrednio. Aby zainstalować pakiet npm o tej samej nazwie, użyj jawnej specyfikacji ze scope (na przykład `@scope/diffs`).

  </Accordion>
  <Accordion title="Repozytoria Git">
    Użyj `git:<repo>`, aby instalować bezpośrednio z repozytorium git. Obsługiwane formy obejmują `git:github.com/owner/repo`, `git:owner/repo`, pełne adresy klonowania `https://`, `ssh://`, `git://`, `file://` oraz `git@host:owner/repo.git`. Dodaj `@<ref>` lub `#<ref>`, aby przed instalacją wybrać branch, tag lub commit.

    Instalacje Git klonują do katalogu tymczasowego, wybierają żądany ref, gdy jest obecny, a następnie używają normalnego instalatora katalogu pluginu. Oznacza to, że walidacja manifestu, skanowanie niebezpiecznego kodu, prace instalacyjne menedżera pakietów i rekordy instalacji zachowują się jak instalacje npm. Zarejestrowane instalacje git zawierają źródłowy URL/ref oraz rozwiązany commit, aby `openclaw plugins update` mógł później ponownie rozwiązać źródło.

    Po instalacji z git użyj `openclaw plugins inspect <id> --runtime --json`, aby zweryfikować rejestracje runtime, takie jak metody Gateway i polecenia CLI. Jeśli Plugin zarejestrował korzeń CLI za pomocą `api.registerCli`, wykonaj to polecenie bezpośrednio przez główne CLI OpenClaw, na przykład `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archiwa">
    Obsługiwane archiwa: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archiwa natywnych pluginów OpenClaw muszą zawierać prawidłowy `openclaw.plugin.json` w wyodrębnionym katalogu głównym pluginu; archiwa zawierające tylko `package.json` są odrzucane, zanim OpenClaw zapisze rekordy instalacji.

    Użyj `npm-pack:<path.tgz>`, gdy plik jest tarballem npm-pack i chcesz
    przetestować tę samą zarządzaną ścieżkę instalacji korzenia npm, której używają instalacje rejestrowe,
    w tym weryfikację `package-lock.json`, skanowanie wyniesionych zależności i
    rekordy instalacji npm. Zwykłe ścieżki archiwów nadal instalują się jako archiwa lokalne
    pod katalogiem głównym rozszerzeń pluginów.

    Instalacje Claude marketplace są również obsługiwane.

  </Accordion>
</AccordionGroup>

Instalacje ClawHub używają jawnego lokatora `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Same specyfikacje pluginów bezpieczne dla npm podczas przejścia po uruchomieniu instalują domyślnie z npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Użyj `npm:`, aby jawnie wskazać rozwiązywanie tylko przez npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw sprawdza reklamowaną zgodność API pluginu / minimalną zgodność Gateway przed instalacją. Gdy wybrana wersja ClawHub publikuje artefakt ClawPack, OpenClaw pobiera wersjonowany `.tgz` npm-pack, weryfikuje nagłówek digest ClawHub i digest artefaktu, a następnie instaluje go przez normalną ścieżkę archiwum. Starsze wersje ClawHub bez metadanych ClawPack nadal instalują się przez starszą ścieżkę weryfikacji archiwum pakietu. Zarejestrowane instalacje zachowują metadane źródła ClawHub, rodzaj artefaktu, integralność npm, shasum npm, nazwę tarballa i fakty digest ClawPack do późniejszych aktualizacji.
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
  <Tab title="Marketplace sources">
    - nazwa znanego marketplace Claude z `~/.claude/plugins/known_marketplaces.json`
    - lokalny katalog główny marketplace lub ścieżka `marketplace.json`
    - skrót repozytorium GitHub, taki jak `owner/repo`
    - URL repozytorium GitHub, taki jak `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Remote marketplace rules">
    W przypadku zdalnych marketplace ładowanych z GitHub lub git wpisy Plugin muszą pozostawać wewnątrz sklonowanego repozytorium marketplace. OpenClaw akceptuje źródła ze ścieżką względną z tego repozytorium i odrzuca HTTP(S), ścieżki bezwzględne, git, GitHub oraz inne niebędące ścieżkami źródła Plugin ze zdalnych manifestów.
  </Tab>
</Tabs>

W przypadku ścieżek lokalnych i archiwów OpenClaw automatycznie wykrywa:

- natywne Plugin OpenClaw (`openclaw.plugin.json`)
- pakiety zgodne z Codex (`.codex-plugin/plugin.json`)
- pakiety zgodne z Claude (`.claude-plugin/plugin.json` lub domyślny układ komponentów Claude)
- pakiety zgodne z Cursor (`.cursor-plugin/plugin.json`)

<Note>
Zgodne pakiety instalują się w normalnym katalogu głównym Plugin i uczestniczą w tym samym przepływie wyświetlania informacji, włączania i wyłączania. Obecnie obsługiwane są Skills pakietów, command-skills Claude, wartości domyślne `settings.json` Claude, wartości domyślne `.lsp.json` Claude / zadeklarowane w manifeście `lspServers`, command-skills Cursor oraz zgodne katalogi hooków Codex; inne wykryte możliwości pakietów są pokazywane w diagnostyce/informacjach, ale nie są jeszcze podłączone do wykonywania w czasie działania.
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
  Przełącz z widoku tabeli na wiersze szczegółów dla każdego Plugin, z metadanymi źródła/pochodzenia/wersji/aktywacji.
</ParamField>
<ParamField path="--json" type="boolean">
  Inwentarz czytelny maszynowo oraz diagnostyka rejestru i stan instalacji zależności pakietów.
</ParamField>

<Note>
`plugins list` najpierw odczytuje utrwalony lokalny rejestr Plugin, z awaryjnym wariantem wyprowadzanym wyłącznie z manifestów, gdy rejestr jest brakujący lub nieprawidłowy. Przydaje się do sprawdzenia, czy Plugin jest zainstalowany, włączony i widoczny dla planowania zimnego startu, ale nie jest sondą czasu działania działającego już procesu Gateway. Po zmianie kodu Plugin, stanu włączenia, zasad hooków lub `plugins.load.paths` uruchom ponownie Gateway obsługujący kanał, zanim będziesz oczekiwać uruchomienia nowego kodu `register(api)` lub hooków. W przypadku wdrożeń zdalnych/kontenerowych sprawdź, czy restartujesz rzeczywisty proces potomny `openclaw gateway run`, a nie tylko proces opakowujący.

`plugins list --json` obejmuje `dependencyStatus` każdego Plugin z `package.json`
`dependencies` i `optionalDependencies`. OpenClaw sprawdza, czy te nazwy pakietów
są obecne w normalnej ścieżce wyszukiwania `node_modules` danego Plugin w Node; nie
importuje kodu czasu działania Plugin, nie uruchamia menedżera pakietów ani nie naprawia
brakujących zależności.
</Note>

`plugins search` to zdalne wyszukiwanie w katalogu ClawHub. Nie sprawdza stanu
lokalnego, nie modyfikuje konfiguracji, nie instaluje pakietów ani nie ładuje kodu
czasu działania Plugin. Wyniki wyszukiwania obejmują nazwę pakietu ClawHub, rodzinę,
kanał, wersję, podsumowanie oraz wskazówkę instalacji, taką jak `openclaw plugins install clawhub:<package>`.

W przypadku pracy nad dołączonym Plugin wewnątrz spakowanego obrazu Docker zamontuj przez bind katalog
źródłowy Plugin na odpowiadającej mu spakowanej ścieżce źródłowej, takiej jak
`/app/extensions/synology-chat`. OpenClaw wykryje tę zamontowaną nakładkę źródłową
przed `/app/dist/extensions/synology-chat`; zwykły skopiowany katalog źródłowy
pozostaje bezczynny, dzięki czemu normalne instalacje pakietowe nadal używają skompilowanego dist.

Do debugowania hooków czasu działania:

- `openclaw plugins inspect <id> --runtime --json` pokazuje zarejestrowane hooki i diagnostykę z przebiegu inspekcji z załadowanym modułem. Inspekcja czasu działania nigdy nie instaluje zależności; użyj `openclaw doctor --fix`, aby wyczyścić starszy stan zależności lub odzyskać brakujące pobieralne Plugin, do których odwołuje się konfiguracja.
- `openclaw gateway status --deep --require-rpc` potwierdza osiągalny Gateway, wskazówki dotyczące usługi/procesu, ścieżkę konfiguracji i kondycję RPC.
- Niedostarczane w pakiecie hooki konwersacji (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) wymagają `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Użyj `--link`, aby uniknąć kopiowania lokalnego katalogu (dodaje do `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` nie jest obsługiwane z `--link`, ponieważ instalacje linkowane ponownie używają ścieżki źródłowej zamiast kopiować nad zarządzanym celem instalacji.

Użyj `--pin` przy instalacjach npm, aby zapisać rozwiązaną dokładną specyfikację (`name@version`) w zarządzanym indeksie Plugin, zachowując domyślne zachowanie bez przypinania.
</Note>

### Indeks Plugin

Metadane instalacji Plugin są stanem zarządzanym maszynowo, a nie konfiguracją użytkownika. Instalacje i aktualizacje zapisują je do `plugins/installs.json` w aktywnym katalogu stanu OpenClaw. Jego mapa najwyższego poziomu `installRecords` jest trwałym źródłem metadanych instalacji, w tym rekordów dla uszkodzonych lub brakujących manifestów Plugin. Tablica `plugins` jest pochodzącą z manifestów pamięcią podręczną rejestru zimnego startu. Plik zawiera ostrzeżenie, aby go nie edytować, i jest używany przez `openclaw plugins update`, odinstalowanie, diagnostykę oraz zimny rejestr Plugin.

Gdy OpenClaw znajdzie dostarczone starsze rekordy `plugins.installs` w konfiguracji, przenosi je do indeksu Plugin i usuwa klucz konfiguracji; jeśli którykolwiek zapis się nie powiedzie, rekordy konfiguracji zostają zachowane, aby metadane instalacji nie zostały utracone.

### Odinstalowanie

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` usuwa rekordy Plugin z `plugins.entries`, utrwalonego indeksu Plugin, wpisów list zezwalania/odmawiania Plugin oraz linkowanych wpisów `plugins.load.paths`, gdy ma to zastosowanie. O ile nie ustawiono `--keep-files`, odinstalowanie usuwa również śledzony zarządzany katalog instalacji, gdy znajduje się on w głównym katalogu rozszerzeń Plugin OpenClaw. W przypadku Plugin aktywnej pamięci slot pamięci resetuje się do `memory-core`.

<Note>
`--keep-config` jest obsługiwane jako przestarzały alias dla `--keep-files`.
</Note>

### Aktualizacja

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Aktualizacje dotyczą śledzonych instalacji Plugin w zarządzanym indeksie Plugin oraz śledzonych instalacji hook-pack w `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Gdy przekażesz identyfikator Plugin, OpenClaw ponownie użyje zapisanej specyfikacji instalacji dla tego Plugin. Oznacza to, że wcześniej zapisane dist-tags, takie jak `@beta`, oraz dokładnie przypięte wersje nadal będą używane przy późniejszych uruchomieniach `update <id>`.

    W przypadku instalacji npm możesz także przekazać jawną specyfikację pakietu npm z dist-tag lub dokładną wersją. OpenClaw rozwiązuje tę nazwę pakietu z powrotem do śledzonego rekordu Plugin, aktualizuje ten zainstalowany Plugin i zapisuje nową specyfikację npm na potrzeby przyszłych aktualizacji opartych na identyfikatorze.

    Przekazanie nazwy pakietu npm bez wersji lub tagu także rozwiązuje się z powrotem do śledzonego rekordu Plugin. Użyj tego, gdy Plugin został przypięty do dokładnej wersji i chcesz przenieść go z powrotem na domyślną linię wydań rejestru.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` ponownie używa śledzonej specyfikacji Plugin, chyba że przekażesz nową specyfikację. `openclaw update` dodatkowo zna aktywny kanał aktualizacji OpenClaw: na kanale beta domyślne rekordy npm i Plugin ClawHub najpierw próbują `@beta`, a następnie wracają do zapisanej domyślnej/najnowszej specyfikacji, jeśli nie istnieje wydanie beta Plugin. Dokładne wersje i jawne tagi pozostają przypięte do tego selektora.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Przed aktualizacją npm na żywo OpenClaw sprawdza wersję zainstalowanego pakietu względem metadanych rejestru npm. Jeśli zainstalowana wersja i zapisana tożsamość artefaktu już pasują do rozwiązanego celu, aktualizacja jest pomijana bez pobierania, ponownej instalacji ani przepisywania `openclaw.json`.

    Gdy istnieje zapisany hash integralności, a hash pobranego artefaktu się zmienia, OpenClaw traktuje to jako dryf artefaktu npm. Interaktywne polecenie `openclaw plugins update` wypisuje oczekiwane i rzeczywiste hashe oraz prosi o potwierdzenie przed kontynuacją. Nieinteraktywne pomocniki aktualizacji kończą się w trybie fail-closed, chyba że wywołujący poda jawną politykę kontynuacji.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` jest również dostępne w `plugins update` jako awaryjne obejście fałszywych alarmów wbudowanego skanowania niebezpiecznego kodu podczas aktualizacji Plugin. Nadal nie omija blokad polityki `before_install` Plugin ani blokowania po niepowodzeniu skanowania i ma zastosowanie tylko do aktualizacji Plugin, a nie aktualizacji hook-pack.
  </Accordion>
</AccordionGroup>

### Inspekcja

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspekcja pokazuje tożsamość, stan ładowania, źródło, możliwości manifestu, flagi polityk, diagnostykę, metadane instalacji, możliwości pakietu oraz wykryte wsparcie serwerów MCP lub LSP bez domyślnego importowania kodu czasu działania Plugin. Dodaj `--runtime`, aby załadować moduł Plugin i uwzględnić zarejestrowane hooki, narzędzia, polecenia, usługi, metody Gateway i trasy HTTP. Inspekcja czasu działania raportuje brakujące zależności Plugin bezpośrednio; instalacje i naprawy pozostają w `openclaw plugins install`, `openclaw plugins update` oraz `openclaw doctor --fix`.

Polecenia CLI należące do Plugin są instalowane jako główne grupy poleceń `openclaw`. Po tym, jak `inspect --runtime` pokaże polecenie pod `cliCommands`, uruchom je jako `openclaw <command> ...`; na przykład Plugin rejestrujący `demo-git` można zweryfikować za pomocą `openclaw demo-git ping`.

Każdy Plugin jest klasyfikowany według tego, co faktycznie rejestruje w czasie działania:

- **plain-capability** — jeden typ możliwości (np. Plugin tylko dla dostawcy)
- **hybrid-capability** — wiele typów możliwości (np. tekst + mowa + obrazy)
- **hook-only** — tylko hooki, bez możliwości ani powierzchni
- **non-capability** — narzędzia/polecenia/usługi, ale bez możliwości

Zobacz [kształty Plugin](/pl/plugins/architecture#plugin-shapes), aby dowiedzieć się więcej o modelu możliwości.

<Note>
Flaga `--json` generuje raport czytelny maszynowo, odpowiedni do skryptów i audytów. `inspect --all` renderuje tabelę dla całej floty z kolumnami kształtu, rodzajów możliwości, powiadomień o zgodności, możliwości pakietu i podsumowania hooków. `info` jest aliasem dla `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` raportuje błędy ładowania Plugin, diagnostykę manifestu/wykrywania oraz powiadomienia o zgodności. Gdy wszystko jest w porządku, wypisuje `No plugin issues detected.`

Jeśli skonfigurowany Plugin jest obecny na dysku, ale zablokowany przez kontrole bezpieczeństwa ścieżek w loaderze, walidacja konfiguracji zachowuje wpis Plugin i raportuje go jako `present but blocked`. Napraw poprzedzającą diagnostykę zablokowanego Plugin, taką jak własność ścieżki lub uprawnienia do zapisu dla wszystkich, zamiast usuwać konfigurację `plugins.entries.<id>` lub `plugins.allow`.

W przypadku awarii kształtu modułu, takich jak brakujące eksporty `register`/`activate`, uruchom ponownie z `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, aby uwzględnić zwięzłe podsumowanie kształtu eksportów w wyjściu diagnostycznym.

### Rejestr

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Lokalny rejestr Plugin to utrwalony model zimnego odczytu OpenClaw dla tożsamości zainstalowanych Plugin, ich włączenia, metadanych źródła i własności wkładów. Normalne uruchamianie, wyszukiwanie właściciela dostawcy, klasyfikacja konfiguracji kanałów i inwentarz Plugin mogą go odczytywać bez importowania modułów środowiska uruchomieniowego Plugin.

Użyj `plugins registry`, aby sprawdzić, czy utrwalony rejestr jest obecny, aktualny lub nieaktualny. Użyj `--refresh`, aby odbudować go z utrwalonego indeksu Plugin, zasad konfiguracji oraz metadanych manifestu/pakietu. To ścieżka naprawy, a nie ścieżka aktywacji w czasie działania.

`openclaw doctor --fix` naprawia również dryf zarządzanych npm przyległy do rejestru: jeśli osierocony lub odzyskany pakiet `@openclaw/*` w zarządzanym katalogu głównym npm Plugin przesłania wbudowany Plugin, doctor usuwa ten nieaktualny pakiet i odbudowuje rejestr, aby uruchamianie walidowało względem wbudowanego manifestu.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` to przestarzały awaryjny przełącznik zgodności na wypadek błędów odczytu rejestru. Preferuj `plugins registry --refresh` lub `openclaw doctor --fix`; awaryjna opcja env służy wyłącznie do odzyskiwania uruchamiania w sytuacjach nagłych podczas wdrażania migracji.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

`marketplace list` przyjmuje ścieżkę do lokalnego marketplace, ścieżkę do `marketplace.json`, skrót GitHub w rodzaju `owner/repo`, adres URL repozytorium GitHub albo adres URL git. `--json` wypisuje rozpoznaną etykietę źródła oraz przeanalizowany manifest marketplace i wpisy pluginów.

## Powiązane

- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Dokumentacja CLI](/pl/cli)
- [Pluginy społeczności](/pl/plugins/community)
