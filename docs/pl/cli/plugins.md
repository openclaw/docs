---
read_when:
    - Chcesz zainstalować pluginy Gateway lub zgodne pakiety
    - Chcesz debugować niepowodzenia ładowania Plugin
sidebarTitle: Plugins
summary: Dokumentacja referencyjna CLI dla `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Pluginy
x-i18n:
    generated_at: "2026-05-04T07:02:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36ae7edb12986ead7e126f25e0761bf312b2644b35017181b674082105886776
    source_path: cli/plugins.md
    workflow: 16
---

Zarządzaj Pluginami Gateway, pakietami hooków i zgodnymi pakietami.

<CardGroup cols={2}>
  <Card title="System Pluginów" href="/pl/tools/plugin">
    Przewodnik dla użytkowników końcowych po instalowaniu, włączaniu i rozwiązywaniu problemów z Pluginami.
  </Card>
  <Card title="Zarządzanie Pluginami" href="/pl/plugins/manage-plugins">
    Szybkie przykłady instalowania, wyświetlania listy, aktualizowania, odinstalowywania i publikowania.
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
```

Aby zbadać powolną instalację, inspekcję, odinstalowanie lub odświeżenie rejestru, uruchom
polecenie z `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Ślad zapisuje czasy faz
do stderr i pozostawia dane wyjściowe JSON możliwe do sparsowania. Zobacz [Debugowanie](/pl/help/debugging#plugin-lifecycle-trace).

<Note>
Wbudowane Pluginy są dostarczane z OpenClaw. Niektóre są domyślnie włączone (na przykład wbudowani dostawcy modeli, wbudowani dostawcy mowy i wbudowany Plugin przeglądarki); inne wymagają `plugins enable`.

Natywne Pluginy OpenClaw muszą dostarczać `openclaw.plugin.json` z wbudowanym schematem JSON Schema (`configSchema`, nawet jeśli jest pusty). Zgodne pakiety używają zamiast tego własnych manifestów pakietów.

`plugins list` pokazuje `Format: openclaw` albo `Format: bundle`. Szczegółowe dane wyjściowe list/info pokazują również podtyp pakietu (`codex`, `claude` albo `cursor`) oraz wykryte możliwości pakietu.
</Note>

### Instalacja

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
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
Gołe nazwy pakietów instalują z npm domyślnie podczas przejścia startowego. Użyj `clawhub:<package>` dla ClawHub. Traktuj instalacje Pluginów jak uruchamianie kodu. Preferuj przypięte wersje.
</Warning>

`plugins search` odpytuje ClawHub o możliwe do zainstalowania pakiety Pluginów i wypisuje
nazwy pakietów gotowe do instalacji. Wyszukuje pakiety code-plugin i bundle-plugin,
a nie Skills. Użyj `openclaw skills search` dla Skills z ClawHub.

<Note>
ClawHub jest główną powierzchnią dystrybucji i odkrywania większości Pluginów. Npm
pozostaje obsługiwaną ścieżką awaryjną i ścieżką bezpośredniej instalacji. Należące do OpenClaw
pakiety Pluginów `@openclaw/*` są ponownie publikowane w npm; bieżącą listę znajdziesz
na [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) albo w
[inwentarzu Pluginów](/pl/plugins/plugin-inventory). Stabilne instalacje używają `latest`.
Instalacje i aktualizacje w kanale beta preferują npm `beta` dist-tag, gdy ten tag
jest dostępny, a następnie wracają do `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Dołączanie konfiguracji i naprawa nieprawidłowej konfiguracji">
    Jeśli sekcja `plugins` jest oparta na jednoplikowym `$include`, `plugins install/update/enable/disable/uninstall` zapisują do tego dołączonego pliku i pozostawiają `openclaw.json` bez zmian. Dołączenia główne, tablice dołączeń i dołączenia z równoległymi nadpisaniami kończą się zamknięciem zamiast spłaszczania. Zobacz [Dołączanie konfiguracji](/pl/gateway/configuration), aby poznać obsługiwane kształty.

    Jeśli konfiguracja jest nieprawidłowa podczas instalacji, `plugins install` zwykle kończy się zamknięciem i informuje, aby najpierw uruchomić `openclaw doctor --fix`. Podczas uruchamiania Gateway i gorącego przeładowania nieprawidłowa konfiguracja Pluginów kończy się zamknięciem jak każda inna nieprawidłowa konfiguracja; `openclaw doctor --fix` może poddać kwarantannie nieprawidłowy wpis Pluginu. Jedynym udokumentowanym wyjątkiem w czasie instalacji jest wąska ścieżka odzyskiwania wbudowanego Pluginu dla Pluginów, które jawnie włączają `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force i ponowna instalacja a aktualizacja">
    `--force` ponownie używa istniejącego miejsca docelowego instalacji i nadpisuje już zainstalowany Plugin albo pakiet hooków w miejscu. Używaj go, gdy celowo ponownie instalujesz ten sam id z nowej ścieżki lokalnej, archiwum, pakietu ClawHub albo artefaktu npm. Do rutynowych aktualizacji już śledzonego Pluginu npm preferuj `openclaw plugins update <id-or-npm-spec>`.

    Jeśli uruchomisz `plugins install` dla id Pluginu, który jest już zainstalowany, OpenClaw zatrzyma się i wskaże `plugins update <id-or-npm-spec>` dla normalnej aktualizacji albo `plugins install <package> --force`, gdy naprawdę chcesz nadpisać bieżącą instalację z innego źródła.

  </Accordion>
  <Accordion title="Zakres --pin">
    `--pin` dotyczy tylko instalacji npm. Nie jest obsługiwane z instalacjami `git:`; użyj jawnego odwołania git, takiego jak `git:github.com/acme/plugin@v1.2.3`, gdy chcesz przypiąć źródło. Nie jest obsługiwane z `--marketplace`, ponieważ instalacje z marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` to awaryjna opcja dla wyników fałszywie dodatnich we wbudowanym skanerze niebezpiecznego kodu. Pozwala kontynuować instalację nawet wtedy, gdy wbudowany skaner zgłasza ustalenia `critical`, ale **nie** omija blokad zasad hooka Pluginu `before_install` i **nie** omija niepowodzeń skanowania.

    Ta flaga CLI dotyczy przepływów instalacji/aktualizacji Pluginów. Instalacje zależności Skills wspierane przez Gateway używają pasującego nadpisania żądania `dangerouslyForceUnsafeInstall`, natomiast `openclaw skills install` pozostaje osobnym przepływem pobierania/instalacji Skills z ClawHub.

    Jeśli Plugin opublikowany przez Ciebie w ClawHub jest blokowany przez skan rejestru, użyj kroków dla wydawców w [ClawHub](/pl/tools/clawhub).

  </Accordion>
  <Accordion title="Pakiety hooków i specyfikacje npm">
    `plugins install` jest także powierzchnią instalacji pakietów hooków, które udostępniają `openclaw.hooks` w `package.json`. Użyj `openclaw hooks` do filtrowanej widoczności hooków i włączania poszczególnych hooków, a nie do instalacji pakietów.

    Specyfikacje npm są **tylko rejestrowe** (nazwa pakietu + opcjonalna **dokładna wersja** albo **dist-tag**). Specyfikacje Git/URL/file i zakresy semver są odrzucane. Instalacje zależności działają lokalnie dla projektu z `--ignore-scripts` dla bezpieczeństwa, nawet jeśli powłoka ma globalne ustawienia instalacji npm.

    Użyj `npm:<package>`, gdy chcesz jawnie wskazać rozwiązywanie npm. Gołe specyfikacje pakietów również instalują bezpośrednio z npm podczas przejścia startowego.

    Gołe specyfikacje i `@latest` pozostają na stabilnej ścieżce. Opatrzone datą wersje korekcyjne OpenClaw, takie jak `2026.5.3-1`, są dla tego sprawdzenia stabilnymi wydaniami. Jeśli npm rozwiąże którąkolwiek z nich do wersji przedpremierowej, OpenClaw zatrzyma się i poprosi o jawne włączenie za pomocą tagu przedpremierowego, takiego jak `@beta`/`@rc`, albo dokładnej wersji przedpremierowej, takiej jak `@1.2.3-beta.4`.

    Jeśli goła specyfikacja instalacji pasuje do oficjalnego id Pluginu (na przykład `diffs`), OpenClaw zainstaluje wpis katalogu bezpośrednio. Aby zainstalować pakiet npm o tej samej nazwie, użyj jawnej specyfikacji z zakresem (na przykład `@scope/diffs`).

  </Accordion>
  <Accordion title="Repozytoria Git">
    Użyj `git:<repo>`, aby instalować bezpośrednio z repozytorium git. Obsługiwane formy obejmują `git:github.com/owner/repo`, `git:owner/repo`, pełne adresy URL klonowania `https://`, `ssh://`, `git://`, `file://` oraz `git@host:owner/repo.git`. Dodaj `@<ref>` albo `#<ref>`, aby przed instalacją przełączyć się na gałąź, tag albo commit.

    Instalacje Git klonują do katalogu tymczasowego, przełączają się na żądane odwołanie, jeśli jest obecne, a następnie używają normalnego instalatora katalogu Pluginu. Oznacza to, że walidacja manifestu, skanowanie niebezpiecznego kodu, praca instalacji menedżera pakietów i rekordy instalacji zachowują się jak w instalacjach npm. Zarejestrowane instalacje Git obejmują źródłowy URL/ref oraz rozwiązany commit, aby `openclaw plugins update` mógł później ponownie rozwiązać źródło.

    Po instalacji z Git użyj `openclaw plugins inspect <id> --runtime --json`, aby zweryfikować rejestracje środowiska uruchomieniowego, takie jak metody gateway i polecenia CLI. Jeśli Plugin zarejestrował główny CLI za pomocą `api.registerCli`, wykonaj to polecenie bezpośrednio przez główny CLI OpenClaw, na przykład `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archiwa">
    Obsługiwane archiwa: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archiwa natywnych Pluginów OpenClaw muszą zawierać prawidłowy `openclaw.plugin.json` w wyodrębnionym katalogu głównym Pluginu; archiwa zawierające tylko `package.json` są odrzucane, zanim OpenClaw zapisze rekordy instalacji.

    Instalacje z marketplace Claude są również obsługiwane.

  </Accordion>
</AccordionGroup>

Instalacje ClawHub używają jawnego lokalizatora `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Gołe, bezpieczne dla npm specyfikacje Pluginów instalują domyślnie z npm podczas przejścia startowego:

```bash
openclaw plugins install openclaw-codex-app-server
```

Użyj `npm:`, aby jawnie wskazać rozwiązywanie tylko przez npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw sprawdza reklamowaną zgodność API Pluginu / minimalną zgodność Gateway przed instalacją. Gdy wybrana wersja ClawHub publikuje artefakt ClawPack, OpenClaw pobiera wersjonowany npm-pack `.tgz`, weryfikuje nagłówek skrótu ClawHub i skrót artefaktu, a następnie instaluje go przez normalną ścieżkę archiwum. Starsze wersje ClawHub bez metadanych ClawPack nadal instalują się przez starszą ścieżkę weryfikacji archiwum pakietu. Zarejestrowane instalacje zachowują metadane źródła ClawHub, rodzaj artefaktu, integralność npm, shasum npm, nazwę tarballa oraz fakty dotyczące skrótu ClawPack na potrzeby późniejszych aktualizacji.
Niewersjonowane instalacje ClawHub zachowują niewersjonowaną zarejestrowaną specyfikację, aby `openclaw plugins update` mógł śledzić nowsze wydania ClawHub; jawne selektory wersji albo tagów, takie jak `clawhub:pkg@1.2.3` i `clawhub:pkg@beta`, pozostają przypięte do tego selektora.

#### Skrót marketplace

Użyj skrótu `plugin@marketplace`, gdy nazwa marketplace istnieje w lokalnej pamięci podręcznej rejestru Claude w `~/.claude/plugins/known_marketplaces.json`:

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
    - adres URL repozytorium GitHub, taki jak `https://github.com/owner/repo`
    - adres URL git

  </Tab>
  <Tab title="Remote marketplace rules">
    W przypadku zdalnych marketplace ładowanych z GitHub lub git wpisy pluginów muszą pozostawać wewnątrz sklonowanego repozytorium marketplace. OpenClaw akceptuje źródła ze ścieżkami względnymi z tego repozytorium i odrzuca źródła pluginów HTTP(S), ze ścieżkami bezwzględnymi, git, GitHub oraz inne źródła niebędące ścieżkami ze zdalnych manifestów.
  </Tab>
</Tabs>

W przypadku ścieżek lokalnych i archiwów OpenClaw automatycznie wykrywa:

- natywne pluginy OpenClaw (`openclaw.plugin.json`)
- pakiety zgodne z Codex (`.codex-plugin/plugin.json`)
- pakiety zgodne z Claude (`.claude-plugin/plugin.json` lub domyślny układ komponentów Claude)
- pakiety zgodne z Cursor (`.cursor-plugin/plugin.json`)

<Note>
Zgodne pakiety instalują się w standardowym katalogu głównym pluginów i uczestniczą w tym samym przepływie list/info/enable/disable. Obecnie obsługiwane są Skills pakietów, command-skills Claude, domyślne ustawienia Claude `settings.json`, domyślne ustawienia Claude `.lsp.json` / zadeklarowane w manifeście `lspServers`, command-skills Cursor oraz zgodne katalogi hooków Codex; inne wykryte możliwości pakietów są pokazywane w diagnostyce/informacjach, ale nie są jeszcze podłączone do wykonywania w runtime.
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
  Przełącz z widoku tabeli na szczegółowe wiersze dla każdego pluginu z metadanymi źródła/pochodzenia/wersji/aktywacji.
</ParamField>
<ParamField path="--json" type="boolean">
  Inwentarz czytelny maszynowo oraz diagnostyka rejestru i stan instalacji zależności pakietów.
</ParamField>

<Note>
`plugins list` najpierw odczytuje utrwalony lokalny rejestr pluginów, z zapasowym wariantem wyprowadzanym tylko z manifestów, gdy rejestru brakuje lub jest nieprawidłowy. Jest to przydatne do sprawdzenia, czy plugin jest zainstalowany, włączony i widoczny dla planowania zimnego startu, ale nie jest to sondowanie na żywo runtime już działającego procesu Gateway. Po zmianie kodu pluginu, jego włączenia, polityki hooków lub `plugins.load.paths` zrestartuj Gateway obsługujący kanał, zanim oczekujesz uruchomienia nowego kodu `register(api)` lub hooków. W przypadku wdrożeń zdalnych/kontenerowych sprawdź, czy restartujesz rzeczywisty proces potomny `openclaw gateway run`, a nie tylko proces opakowujący.

`plugins list --json` zawiera `dependencyStatus` każdego pluginu z `package.json`
`dependencies` i `optionalDependencies`. OpenClaw sprawdza, czy te nazwy pakietów
są obecne wzdłuż standardowej ścieżki wyszukiwania Node `node_modules` pluginu; nie
importuje kodu runtime pluginu, nie uruchamia menedżera pakietów ani nie naprawia
brakujących zależności.
</Note>

`plugins search` to zdalne wyszukiwanie w katalogu ClawHub. Nie sprawdza stanu
lokalnego, nie modyfikuje konfiguracji, nie instaluje pakietów ani nie ładuje kodu
runtime pluginu. Wyniki wyszukiwania obejmują nazwę pakietu ClawHub, rodzinę, kanał,
wersję, podsumowanie oraz podpowiedź instalacji, taką jak `openclaw plugins install clawhub:<package>`.

Podczas pracy nad dołączonym pluginem wewnątrz spakowanego obrazu Docker zamontuj przez bind-mount katalog
źródłowy pluginu na odpowiadającej mu spakowanej ścieżce źródłowej, takiej jak
`/app/extensions/synology-chat`. OpenClaw wykryje tę zamontowaną nakładkę źródłową
przed `/app/dist/extensions/synology-chat`; zwykły skopiowany katalog źródłowy
pozostaje nieaktywny, więc normalne instalacje pakietowe nadal używają skompilowanego dist.

Do debugowania hooków runtime:

- `openclaw plugins inspect <id> --runtime --json` pokazuje zarejestrowane hooki i diagnostykę z przebiegu inspekcji z załadowanym modułem. Inspekcja runtime nigdy nie instaluje zależności; użyj `openclaw doctor --fix`, aby wyczyścić starszy stan zależności lub zainstalować brakujące skonfigurowane pluginy do pobrania.
- `openclaw gateway status --deep --require-rpc` potwierdza osiągalny Gateway, podpowiedzi dotyczące usługi/procesu, ścieżkę konfiguracji oraz kondycję RPC.
- Niedołączone hooki konwersacji (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) wymagają `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Użyj `--link`, aby uniknąć kopiowania lokalnego katalogu (dodaje do `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` nie jest obsługiwane z `--link`, ponieważ instalacje linkowane ponownie używają ścieżki źródłowej zamiast kopiować do zarządzanego celu instalacji.

Użyj `--pin` przy instalacjach npm, aby zapisać rozwiązaną dokładną specyfikację (`name@version`) w zarządzanym indeksie pluginów, zachowując domyślne zachowanie bez przypięcia.
</Note>

### Indeks pluginów

Metadane instalacji pluginów to stan zarządzany maszynowo, a nie konfiguracja użytkownika. Instalacje i aktualizacje zapisują je do `plugins/installs.json` w aktywnym katalogu stanu OpenClaw. Mapa najwyższego poziomu `installRecords` jest trwałym źródłem metadanych instalacji, w tym rekordów uszkodzonych lub brakujących manifestów pluginów. Tablica `plugins` jest pamięcią podręczną zimnego rejestru wyprowadzoną z manifestów. Plik zawiera ostrzeżenie, aby go nie edytować, i jest używany przez `openclaw plugins update`, odinstalowanie, diagnostykę oraz zimny rejestr pluginów.

Gdy OpenClaw widzi dostarczone starsze rekordy `plugins.installs` w konfiguracji, przenosi je do indeksu pluginów i usuwa klucz konfiguracji; jeśli którykolwiek zapis się nie powiedzie, rekordy konfiguracji są zachowywane, aby metadane instalacji nie zostały utracone.

### Odinstalowanie

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` usuwa rekordy pluginów z `plugins.entries`, utrwalonego indeksu pluginów, wpisów listy dozwolonych/odrzuconych pluginów oraz linkowanych wpisów `plugins.load.paths`, gdy ma to zastosowanie. O ile nie ustawiono `--keep-files`, odinstalowanie usuwa też śledzony zarządzany katalog instalacji, gdy znajduje się on wewnątrz katalogu głównego rozszerzeń pluginów OpenClaw. W przypadku pluginów Active Memory slot pamięci resetuje się do `memory-core`.

<Note>
`--keep-config` jest obsługiwane jako przestarzały alias `--keep-files`.
</Note>

### Aktualizacja

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Aktualizacje dotyczą śledzonych instalacji pluginów w zarządzanym indeksie pluginów oraz śledzonych instalacji hook-packów w `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Gdy podasz id pluginu, OpenClaw ponownie użyje zapisanej specyfikacji instalacji tego pluginu. Oznacza to, że wcześniej zapisane dist-tags, takie jak `@beta`, oraz dokładnie przypięte wersje będą nadal używane przy późniejszych uruchomieniach `update <id>`.

    W przypadku instalacji npm możesz także podać jawną specyfikację pakietu npm z dist-tag lub dokładną wersją. OpenClaw rozwiązuje tę nazwę pakietu z powrotem do śledzonego rekordu pluginu, aktualizuje ten zainstalowany plugin i zapisuje nową specyfikację npm dla przyszłych aktualizacji opartych na id.

    Podanie nazwy pakietu npm bez wersji lub tagu również rozwiązuje się z powrotem do śledzonego rekordu pluginu. Użyj tego, gdy plugin był przypięty do dokładnej wersji i chcesz przenieść go z powrotem na domyślną linię wydań rejestru.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` ponownie używa śledzonej specyfikacji pluginu, chyba że podasz nową specyfikację. `openclaw update` dodatkowo zna aktywny kanał aktualizacji OpenClaw: na kanale beta rekordy pluginów npm i ClawHub z domyślnej linii próbują najpierw `@beta`, a następnie wracają do zapisanej specyfikacji default/latest, jeśli nie istnieje beta wydanie pluginu. Dokładne wersje i jawne tagi pozostają przypięte do tego selektora.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Przed aktualizacją npm na żywo OpenClaw sprawdza zainstalowaną wersję pakietu względem metadanych rejestru npm. Jeśli zainstalowana wersja i zapisana tożsamość artefaktu już pasują do rozwiązanego celu, aktualizacja jest pomijana bez pobierania, ponownej instalacji ani przepisywania `openclaw.json`.

    Gdy istnieje zapisany hash integralności, a hash pobranego artefaktu się zmieni, OpenClaw traktuje to jako dryf artefaktu npm. Interaktywne polecenie `openclaw plugins update` wypisuje oczekiwane i rzeczywiste hashe oraz prosi o potwierdzenie przed kontynuacją. Nieinteraktywne pomocniki aktualizacji kończą się zamknięciem, chyba że wywołujący dostarczy jawną politykę kontynuacji.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` jest także dostępne w `plugins update` jako awaryjne obejście fałszywych alarmów wbudowanego skanowania dangerous-code podczas aktualizacji pluginów. Nadal nie omija blokad polityki `before_install` pluginu ani blokowania po niepowodzeniu skanowania i dotyczy tylko aktualizacji pluginów, a nie aktualizacji hook-packów.
  </Accordion>
</AccordionGroup>

### Inspekcja

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspekcja pokazuje tożsamość, stan ładowania, źródło, możliwości manifestu, flagi polityk, diagnostykę, metadane instalacji, możliwości pakietu oraz wszelką wykrytą obsługę serwerów MCP lub LSP bez domyślnego importowania runtime pluginu. Dodaj `--runtime`, aby załadować moduł pluginu i uwzględnić zarejestrowane hooki, narzędzia, polecenia, usługi, metody Gateway oraz trasy HTTP. Inspekcja runtime zgłasza brakujące zależności pluginu bezpośrednio; instalacje i naprawy pozostają w `openclaw plugins install`, `openclaw plugins update` oraz `openclaw doctor --fix`.

Polecenia CLI należące do pluginu są instalowane jako główne grupy poleceń `openclaw`. Gdy `inspect --runtime` pokaże polecenie pod `cliCommands`, uruchom je jako `openclaw <command> ...`; na przykład plugin rejestrujący `demo-git` można zweryfikować za pomocą `openclaw demo-git ping`.

Każdy plugin jest klasyfikowany według tego, co faktycznie rejestruje w runtime:

- **plain-capability** — jeden typ możliwości (np. plugin tylko dla dostawcy)
- **hybrid-capability** — wiele typów możliwości (np. tekst + mowa + obrazy)
- **hook-only** — tylko hooki, bez możliwości ani powierzchni
- **non-capability** — narzędzia/polecenia/usługi, ale bez możliwości

Więcej informacji o modelu możliwości znajdziesz w [Kształty pluginów](/pl/plugins/architecture#plugin-shapes).

<Note>
Flaga `--json` generuje raport czytelny maszynowo, odpowiedni do skryptowania i audytu. `inspect --all` renderuje tabelę dla całej floty z kolumnami kształtu, rodzajów możliwości, uwag o zgodności, możliwości pakietów i podsumowania hooków. `info` jest aliasem `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` raportuje błędy ładowania pluginów, diagnostykę manifestów/odkrywania oraz uwagi o zgodności. Gdy wszystko jest czyste, wypisuje `No plugin issues detected.`

Jeśli skonfigurowany plugin jest obecny na dysku, ale zablokowany przez kontrole bezpieczeństwa ścieżek loadera, walidacja konfiguracji zachowuje wpis pluginu i zgłasza go jako `present but blocked`. Napraw poprzedzającą diagnostykę zablokowanego pluginu, taką jak własność ścieżki lub uprawnienia world-writable, zamiast usuwać konfigurację `plugins.entries.<id>` lub `plugins.allow`.

W przypadku awarii kształtu modułu, takich jak brak eksportów `register`/`activate`, uruchom ponownie z `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, aby uwzględnić zwięzłe podsumowanie kształtu eksportów w wyjściu diagnostycznym.

### Rejestr

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Lokalny rejestr pluginów jest utrwalonym zimnym modelem odczytu OpenClaw dla tożsamości zainstalowanych pluginów, ich włączenia, metadanych źródła oraz własności wkładów. Normalne uruchomienie, wyszukiwanie właściciela dostawcy, klasyfikacja konfiguracji kanału i inwentarz pluginów mogą go odczytać bez importowania modułów runtime pluginów.

Użyj `plugins registry`, aby sprawdzić, czy utrwalony rejestr jest obecny, aktualny czy nieaktualny. Użyj `--refresh`, aby odbudować go z utrwalonego indeksu pluginów, zasad konfiguracji oraz metadanych manifestu/pakietu. To jest ścieżka naprawy, a nie ścieżka aktywacji w czasie wykonywania.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` to przestarzały awaryjny przełącznik zgodności na wypadek błędów odczytu rejestru. Preferuj `plugins registry --refresh` albo `openclaw doctor --fix`; awaryjny mechanizm zmiennej środowiskowej służy wyłącznie do awaryjnego odzyskiwania rozruchu podczas wdrażania migracji.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Lista Marketplace akceptuje lokalną ścieżkę Marketplace, ścieżkę `marketplace.json`, skrót GitHub w formacie `owner/repo`, adres URL repozytorium GitHub albo adres URL git. `--json` wypisuje rozwiązaną etykietę źródła oraz sparsowany manifest Marketplace i wpisy pluginów.

## Powiązane

- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Dokumentacja CLI](/pl/cli)
- [Pluginy społeczności](/pl/plugins/community)
