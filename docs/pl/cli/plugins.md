---
read_when:
    - Chcesz zainstalować Pluginy Gateway lub zgodne pakiety albo nimi zarządzać
    - Chcesz debugować błędy ładowania Plugin
sidebarTitle: Plugins
summary: Dokumentacja referencyjna CLI dla `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Pluginy
x-i18n:
    generated_at: "2026-05-06T09:06:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: e584092c6cdaf87681aef2ed106c299e3bab0552305b669c66b05deb61bf25ce
    source_path: cli/plugins.md
    workflow: 16
---

Zarządzaj pluginami Gateway, pakietami hooków i zgodnymi pakietami zbiorczymi.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/pl/tools/plugin">
    Przewodnik dla użytkowników końcowych dotyczący instalowania, włączania i rozwiązywania problemów z pluginami.
  </Card>
  <Card title="Manage plugins" href="/pl/plugins/manage-plugins">
    Szybkie przykłady instalowania, wyświetlania listy, aktualizowania, odinstalowywania i publikowania.
  </Card>
  <Card title="Plugin bundles" href="/pl/plugins/bundles">
    Model zgodności pakietów zbiorczych.
  </Card>
  <Card title="Plugin manifest" href="/pl/plugins/manifest">
    Pola manifestu i schemat konfiguracji.
  </Card>
  <Card title="Security" href="/pl/gateway/security">
    Utwardzanie zabezpieczeń instalacji pluginów.
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
do stderr i pozostawia dane wyjściowe JSON możliwe do parsowania. Zobacz [Debugowanie](/pl/help/debugging#plugin-lifecycle-trace).

<Note>
Dołączone pluginy są dostarczane z OpenClaw. Niektóre są włączone domyślnie (na przykład dołączeni dostawcy modeli, dołączeni dostawcy mowy i dołączony plugin przeglądarki); inne wymagają `plugins enable`.

Natywne pluginy OpenClaw muszą zawierać `openclaw.plugin.json` z wbudowanym schematem JSON (`configSchema`, nawet jeśli jest pusty). Zgodne pakiety zbiorcze używają zamiast tego własnych manifestów pakietów zbiorczych.

`plugins list` pokazuje `Format: openclaw` lub `Format: bundle`. Szczegółowe dane wyjściowe list/info pokazują także podtyp pakietu zbiorczego (`codex`, `claude` lub `cursor`) oraz wykryte możliwości pakietu zbiorczego.
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
Nagie nazwy pakietów są domyślnie instalowane z npm podczas przejścia startowego. Użyj `clawhub:<package>` dla ClawHub. Traktuj instalacje pluginów jak uruchamianie kodu. Preferuj przypięte wersje.
</Warning>

`plugins search` odpytuje ClawHub o możliwe do zainstalowania pakiety pluginów i wypisuje
nazwy pakietów gotowe do instalacji. Wyszukuje pakiety code-plugin i bundle-plugin,
a nie Skills. Użyj `openclaw skills search` dla Skills z ClawHub.

<Note>
ClawHub to podstawowa powierzchnia dystrybucji i odkrywania większości pluginów. Npm
pozostaje obsługiwaną ścieżką awaryjną i bezpośredniej instalacji. Należące do OpenClaw
pakiety pluginów `@openclaw/*` są ponownie publikowane w npm; aktualną listę
znajdziesz na [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) albo w
[inwentarzu pluginów](/pl/plugins/plugin-inventory). Stabilne instalacje używają `latest`.
Instalacje i aktualizacje z kanału beta preferują npm `beta` dist-tag, gdy taki tag
jest dostępny, a następnie wracają do `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    Jeśli sekcja `plugins` jest oparta na jednoplikowym `$include`, `plugins install/update/enable/disable/uninstall` zapisują zmiany do tego dołączonego pliku i pozostawiają `openclaw.json` bez zmian. Dołączenia główne, tablice dołączeń i dołączenia z sąsiednimi nadpisaniami kończą się zamknięciem zamiast spłaszczania. Zobacz [Dołączenia konfiguracji](/pl/gateway/configuration), aby poznać obsługiwane kształty.

    Jeśli konfiguracja jest nieprawidłowa podczas instalacji, `plugins install` zwykle kończy się zamknięciem i informuje, aby najpierw uruchomić `openclaw doctor --fix`. Podczas uruchamiania Gateway i przeładowania na gorąco nieprawidłowa konfiguracja pluginów kończy się zamknięciem jak każda inna nieprawidłowa konfiguracja; `openclaw doctor --fix` może poddać kwarantannie nieprawidłowy wpis pluginu. Jedynym udokumentowanym wyjątkiem w czasie instalacji jest wąska ścieżka odzyskiwania dołączonego pluginu dla pluginów, które jawnie wybiorą `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` ponownie używa istniejącego celu instalacji i nadpisuje już zainstalowany plugin lub pakiet hooków w miejscu. Użyj go, gdy celowo ponownie instalujesz ten sam identyfikator z nowej ścieżki lokalnej, archiwum, pakietu ClawHub lub artefaktu npm. Do rutynowych uaktualnień już śledzonego pluginu npm preferuj `openclaw plugins update <id-or-npm-spec>`.

    Jeśli uruchomisz `plugins install` dla identyfikatora pluginu, który jest już zainstalowany, OpenClaw zatrzyma się i wskaże `plugins update <id-or-npm-spec>` dla zwykłego uaktualnienia albo `plugins install <package> --force`, gdy naprawdę chcesz nadpisać bieżącą instalację z innego źródła.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` dotyczy tylko instalacji npm. Nie jest obsługiwane z instalacjami `git:`; użyj jawnego odwołania git, takiego jak `git:github.com/acme/plugin@v1.2.3`, gdy chcesz przypięte źródło. Nie jest obsługiwane z `--marketplace`, ponieważ instalacje z marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` to opcja awaryjna dla fałszywych alarmów we wbudowanym skanerze niebezpiecznego kodu. Pozwala kontynuować instalację nawet wtedy, gdy wbudowany skaner zgłasza wyniki `critical`, ale **nie** omija blokad polityki hooka pluginu `before_install` i **nie** omija niepowodzeń skanowania.

    Ta flaga CLI dotyczy przepływów instalacji/aktualizacji pluginów. Instalacje zależności Skills obsługiwane przez Gateway używają odpowiadającego nadpisania żądania `dangerouslyForceUnsafeInstall`, natomiast `openclaw skills install` pozostaje oddzielnym przepływem pobierania/instalowania Skills z ClawHub.

    Jeśli plugin opublikowany przez Ciebie w ClawHub jest blokowany przez skan rejestru, użyj kroków dla wydawcy w [ClawHub](/pl/tools/clawhub).

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` jest także powierzchnią instalacji dla pakietów hooków, które udostępniają `openclaw.hooks` w `package.json`. Użyj `openclaw hooks` do filtrowanej widoczności hooków i włączania poszczególnych hooków, a nie do instalacji pakietów.

    Specyfikacje npm są **tylko rejestrowe** (nazwa pakietu + opcjonalna **dokładna wersja** albo **dist-tag**). Specyfikacje Git/URL/plik i zakresy semver są odrzucane. Instalacje zależności działają lokalnie w projekcie z `--ignore-scripts` dla bezpieczeństwa, nawet jeśli Twoja powłoka ma globalne ustawienia instalacji npm.

    Użyj `npm:<package>`, gdy chcesz jawnie wymusić rozwiązywanie npm. Nagie specyfikacje pakietów także instalują bezpośrednio z npm podczas przejścia startowego.

    Nagie specyfikacje i `@latest` pozostają na stabilnej ścieżce. Oznaczone datą wersje korygujące OpenClaw, takie jak `2026.5.3-1`, są stabilnymi wydaniami dla tego sprawdzenia. Jeśli npm rozwiąże którąkolwiek z nich do wydania wstępnego, OpenClaw zatrzyma się i poprosi o jawne wyrażenie zgody za pomocą tagu wydania wstępnego, takiego jak `@beta`/`@rc`, albo dokładnej wersji wstępnej, takiej jak `@1.2.3-beta.4`.

    Jeśli naga specyfikacja instalacji pasuje do oficjalnego identyfikatora pluginu (na przykład `diffs`), OpenClaw instaluje bezpośrednio wpis katalogu. Aby zainstalować pakiet npm o tej samej nazwie, użyj jawnej specyfikacji z zakresem (na przykład `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Użyj `git:<repo>`, aby instalować bezpośrednio z repozytorium git. Obsługiwane formy obejmują `git:github.com/owner/repo`, `git:owner/repo`, pełne adresy klonowania `https://`, `ssh://`, `git://`, `file://` oraz `git@host:owner/repo.git`. Dodaj `@<ref>` albo `#<ref>`, aby przed instalacją wybrać gałąź, tag lub commit.

    Instalacje Git klonują do katalogu tymczasowego, wybierają żądane odwołanie, gdy jest obecne, a następnie używają zwykłego instalatora katalogu pluginów. Oznacza to, że walidacja manifestu, skanowanie niebezpiecznego kodu, praca instalacyjna menedżera pakietów i rekordy instalacji zachowują się jak instalacje npm. Zarejestrowane instalacje Git zawierają źródłowy URL/odwołanie oraz rozwiązany commit, aby `openclaw plugins update` mógł później ponownie rozwiązać źródło.

    Po instalacji z git użyj `openclaw plugins inspect <id> --runtime --json`, aby zweryfikować rejestracje uruchomieniowe, takie jak metody Gateway i polecenia CLI. Jeśli plugin zarejestrował główny punkt CLI za pomocą `api.registerCli`, wykonaj to polecenie bezpośrednio przez główny CLI OpenClaw, na przykład `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Obsługiwane archiwa: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archiwa natywnych pluginów OpenClaw muszą zawierać prawidłowy `openclaw.plugin.json` w wyodrębnionym katalogu głównym pluginu; archiwa zawierające tylko `package.json` są odrzucane, zanim OpenClaw zapisze rekordy instalacji.

    Użyj `npm-pack:<path.tgz>`, gdy plik jest tarballem npm-pack i chcesz
    przetestować tę samą zarządzaną ścieżkę instalacji w katalogu głównym npm, której używają instalacje z rejestru,
    w tym weryfikację `package-lock.json`, skanowanie wyniesionych zależności i
    rekordy instalacji npm. Zwykłe ścieżki archiwów nadal instalują jako archiwa lokalne
    pod katalogiem głównym rozszerzeń pluginów.

    Obsługiwane są także instalacje z Claude marketplace.

  </Accordion>
</AccordionGroup>

Instalacje ClawHub używają jawnego lokatora `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Nagie specyfikacje pluginów bezpieczne dla npm instalują z npm domyślnie podczas przejścia startowego:

```bash
openclaw plugins install openclaw-codex-app-server
```

Użyj `npm:`, aby jawnie wybrać rozwiązywanie wyłącznie przez npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw sprawdza deklarowaną zgodność API pluginu / minimalną zgodność Gateway przed instalacją. Gdy wybrana wersja ClawHub publikuje artefakt ClawPack, OpenClaw pobiera wersjonowany `.tgz` npm-pack, weryfikuje nagłówek skrótu ClawHub i skrót artefaktu, a następnie instaluje go przez zwykłą ścieżkę archiwum. Starsze wersje ClawHub bez metadanych ClawPack nadal instalują przez starszą ścieżkę weryfikacji archiwum pakietu. Zarejestrowane instalacje zachowują metadane źródła ClawHub, rodzaj artefaktu, integralność npm, shasum npm, nazwę tarballa i fakty dotyczące skrótu ClawPack na potrzeby późniejszych aktualizacji.
Niewersjonowane instalacje ClawHub zachowują niewersjonowaną zarejestrowaną specyfikację, aby `openclaw plugins update` mógł śledzić nowsze wydania ClawHub; jawne selektory wersji lub tagów, takie jak `clawhub:pkg@1.2.3` i `clawhub:pkg@beta`, pozostają przypięte do tego selektora.

#### Skrót marketplace

Użyj skrótu `plugin@marketplace`, gdy nazwa marketplace istnieje w lokalnej pamięci podręcznej rejestru Claude pod adresem `~/.claude/plugins/known_marketplaces.json`:

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
    W przypadku zdalnych marketplace ładowanych z GitHub lub git wpisy pluginów muszą pozostać wewnątrz sklonowanego repozytorium marketplace. OpenClaw akceptuje względne źródła ścieżek z tego repozytorium i odrzuca HTTP(S), ścieżki bezwzględne, git, GitHub oraz inne niebędące ścieżkami źródła pluginów ze zdalnych manifestów.
  </Tab>
</Tabs>

Dla lokalnych ścieżek i archiwów OpenClaw wykrywa automatycznie:

- natywne pluginy OpenClaw (`openclaw.plugin.json`)
- pakiety zgodne z Codex (`.codex-plugin/plugin.json`)
- pakiety zgodne z Claude (`.claude-plugin/plugin.json` albo domyślny układ komponentów Claude)
- pakiety zgodne z Cursor (`.cursor-plugin/plugin.json`)

<Note>
Zgodne pakiety instalują się w normalnym katalogu głównym pluginów i uczestniczą w tym samym przepływie wyświetlania informacji, włączania i wyłączania. Obecnie obsługiwane są Skills pakietów, umiejętności poleceń Claude, domyślne wartości Claude `settings.json`, domyślne wartości Claude `.lsp.json` / zadeklarowane w manifeście `lspServers`, umiejętności poleceń Cursor oraz zgodne katalogi hooków Codex; inne wykryte możliwości pakietów są pokazywane w diagnostyce/informacjach, ale nie są jeszcze podłączone do wykonywania w środowisku uruchomieniowym.
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
`plugins list` najpierw odczytuje utrwalony lokalny rejestr pluginów, z awaryjną wersją wyprowadzoną wyłącznie z manifestów, gdy rejestr nie istnieje lub jest nieprawidłowy. Jest to przydatne do sprawdzania, czy plugin jest zainstalowany, włączony i widoczny dla planowania zimnego startu, ale nie jest to sonda aktywnego środowiska uruchomieniowego już działającego procesu Gateway. Po zmianie kodu pluginu, włączenia, zasad hooków lub `plugins.load.paths` uruchom ponownie Gateway obsługujący kanał, zanim zaczniesz oczekiwać, że nowy kod `register(api)` lub hooki zostaną uruchomione. W przypadku wdrożeń zdalnych/kontenerowych sprawdź, czy restartujesz rzeczywisty proces podrzędny `openclaw gateway run`, a nie tylko proces opakowujący.

`plugins list --json` zawiera `dependencyStatus` każdego pluginu z `package.json`
`dependencies` i `optionalDependencies`. OpenClaw sprawdza, czy te nazwy pakietów
są obecne na normalnej ścieżce wyszukiwania Node `node_modules` pluginu; nie
importuje kodu środowiska uruchomieniowego pluginu, nie uruchamia menedżera
pakietów ani nie naprawia brakujących zależności.
</Note>

`plugins search` to zdalne wyszukiwanie w katalogu ClawHub. Nie sprawdza lokalnego
stanu, nie modyfikuje konfiguracji, nie instaluje pakietów ani nie ładuje kodu
środowiska uruchomieniowego pluginu. Wyniki wyszukiwania zawierają nazwę pakietu
ClawHub, rodzinę, kanał, wersję, podsumowanie oraz wskazówkę instalacji, taką jak
`openclaw plugins install clawhub:<package>`.

Podczas pracy nad wbudowanym pluginem wewnątrz spakowanego obrazu Docker zamontuj
katalog źródłowy pluginu przez bind mount na pasującej spakowanej ścieżce źródłowej,
takiej jak `/app/extensions/synology-chat`. OpenClaw wykryje tę zamontowaną
nakładkę źródłową przed `/app/dist/extensions/synology-chat`; zwykły skopiowany
katalog źródłowy pozostanie nieaktywny, więc normalne spakowane instalacje nadal
używają skompilowanego dist.

Do debugowania hooków środowiska uruchomieniowego:

- `openclaw plugins inspect <id> --runtime --json` pokazuje zarejestrowane hooki i diagnostykę z przebiegu inspekcji z załadowanym modułem. Inspekcja środowiska uruchomieniowego nigdy nie instaluje zależności; użyj `openclaw doctor --fix`, aby wyczyścić starszy stan zależności lub odzyskać brakujące pluginy możliwe do pobrania, do których odwołuje się konfiguracja.
- `openclaw gateway status --deep --require-rpc` potwierdza osiągalny Gateway, wskazówki dotyczące usługi/procesu, ścieżkę konfiguracji i kondycję RPC.
- Niewbudowane hooki konwersacji (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) wymagają `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Użyj `--link`, aby uniknąć kopiowania lokalnego katalogu (dodaje do `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` nie jest obsługiwane z `--link`, ponieważ instalacje linkowane ponownie używają ścieżki źródłowej zamiast kopiować na zarządzany cel instalacji.

Użyj `--pin` przy instalacjach npm, aby zapisać rozwiązaną dokładną specyfikację (`name@version`) w zarządzanym indeksie pluginów, zachowując domyślne zachowanie bez przypięcia.
</Note>

### Indeks pluginów

Metadane instalacji pluginów to stan zarządzany maszynowo, a nie konfiguracja użytkownika. Instalacje i aktualizacje zapisują je do `plugins/installs.json` w aktywnym katalogu stanu OpenClaw. Jego mapa najwyższego poziomu `installRecords` jest trwałym źródłem metadanych instalacji, w tym rekordów uszkodzonych lub brakujących manifestów pluginów. Tablica `plugins` to wyprowadzona z manifestów pamięć podręczna zimnego rejestru. Plik zawiera ostrzeżenie, aby go nie edytować, i jest używany przez `openclaw plugins update`, odinstalowanie, diagnostykę oraz zimny rejestr pluginów.

Gdy OpenClaw zobaczy dostarczone starsze rekordy `plugins.installs` w konfiguracji, przenosi je do indeksu pluginów i usuwa klucz konfiguracji; jeśli którykolwiek zapis się nie powiedzie, rekordy konfiguracji są zachowywane, aby metadane instalacji nie zostały utracone.

### Odinstalowanie

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` usuwa rekordy pluginu z `plugins.entries`, utrwalonego indeksu pluginów, wpisów listy dozwolonych/zabronionych pluginów oraz linkowanych wpisów `plugins.load.paths`, gdy ma to zastosowanie. O ile nie ustawiono `--keep-files`, odinstalowanie usuwa także śledzony zarządzany katalog instalacji, gdy znajduje się on w katalogu głównym rozszerzeń pluginów OpenClaw. W przypadku pluginów aktywnej pamięci slot pamięci resetuje się do `memory-core`.

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

Aktualizacje dotyczą śledzonych instalacji pluginów w zarządzanym indeksie pluginów oraz śledzonych instalacji pakietów hooków w `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Rozwiązywanie identyfikatora pluginu względem specyfikacji npm">
    Gdy przekazujesz identyfikator pluginu, OpenClaw ponownie używa zapisanej specyfikacji instalacji dla tego pluginu. Oznacza to, że wcześniej zapisane dist-tagi, takie jak `@beta`, oraz dokładne przypięte wersje nadal będą używane przy późniejszych uruchomieniach `update <id>`.

    W przypadku instalacji npm możesz także przekazać jawną specyfikację pakietu npm z dist-tagiem lub dokładną wersją. OpenClaw rozwiązuje tę nazwę pakietu z powrotem do śledzonego rekordu pluginu, aktualizuje ten zainstalowany plugin i zapisuje nową specyfikację npm dla przyszłych aktualizacji opartych na identyfikatorze.

    Przekazanie nazwy pakietu npm bez wersji ani tagu także rozwiązuje się z powrotem do śledzonego rekordu pluginu. Użyj tego, gdy plugin był przypięty do dokładnej wersji i chcesz przenieść go z powrotem na domyślną linię wydania rejestru.

  </Accordion>
  <Accordion title="Aktualizacje kanału beta">
    `openclaw plugins update` ponownie używa śledzonej specyfikacji pluginu, chyba że przekażesz nową specyfikację. `openclaw update` dodatkowo zna aktywny kanał aktualizacji OpenClaw: na kanale beta rekordy pluginów npm z domyślnej linii i ClawHub najpierw próbują `@beta`, a potem wracają do zapisanej domyślnej/najnowszej specyfikacji, jeśli nie istnieje wydanie beta pluginu. Dokładne wersje i jawne tagi pozostają przypięte do tego selektora.

  </Accordion>
  <Accordion title="Kontrole wersji i dryf integralności">
    Przed aktualizacją npm na żywo OpenClaw sprawdza zainstalowaną wersję pakietu względem metadanych rejestru npm. Jeśli zainstalowana wersja i zapisana tożsamość artefaktu już pasują do rozwiązanego celu, aktualizacja jest pomijana bez pobierania, ponownej instalacji ani przepisywania `openclaw.json`.

    Gdy istnieje zapisany hash integralności, a hash pobranego artefaktu się zmienia, OpenClaw traktuje to jako dryf artefaktu npm. Interaktywne polecenie `openclaw plugins update` wypisuje oczekiwany i rzeczywisty hash oraz prosi o potwierdzenie przed kontynuacją. Nieinteraktywne pomocniki aktualizacji kończą się bezpieczną porażką, chyba że wywołujący dostarczy jawną politykę kontynuacji.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install przy aktualizacji">
    `--dangerously-force-unsafe-install` jest także dostępne w `plugins update` jako awaryjne obejście fałszywych alarmów wbudowanego skanowania niebezpiecznego kodu podczas aktualizacji pluginów. Nadal nie omija blokad polityki `before_install` pluginu ani blokowania po niepowodzeniu skanowania i dotyczy wyłącznie aktualizacji pluginów, a nie aktualizacji pakietów hooków.
  </Accordion>
</AccordionGroup>

### Inspekcja

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspekcja pokazuje tożsamość, stan ładowania, źródło, możliwości manifestu, flagi polityki, diagnostykę, metadane instalacji, możliwości pakietu oraz wszelkie wykryte wsparcie serwera MCP lub LSP bez domyślnego importowania środowiska uruchomieniowego pluginu. Dodaj `--runtime`, aby załadować moduł pluginu i dołączyć zarejestrowane hooki, narzędzia, polecenia, usługi, metody Gateway i trasy HTTP. Inspekcja środowiska uruchomieniowego zgłasza brakujące zależności pluginu bezpośrednio; instalacje i naprawy pozostają w `openclaw plugins install`, `openclaw plugins update` i `openclaw doctor --fix`.

Polecenia CLI należące do pluginu są instalowane jako główne grupy poleceń `openclaw`. Gdy `inspect --runtime` pokaże polecenie pod `cliCommands`, uruchom je jako `openclaw <command> ...`; na przykład plugin rejestrujący `demo-git` można zweryfikować za pomocą `openclaw demo-git ping`.

Każdy plugin jest klasyfikowany według tego, co faktycznie rejestruje w środowisku uruchomieniowym:

- **plain-capability** — jeden typ możliwości (np. plugin tylko dostawcy)
- **hybrid-capability** — wiele typów możliwości (np. tekst + mowa + obrazy)
- **hook-only** — tylko hooki, bez możliwości ani powierzchni
- **non-capability** — narzędzia/polecenia/usługi, ale bez możliwości

Zobacz [Kształty pluginów](/pl/plugins/architecture#plugin-shapes), aby dowiedzieć się więcej o modelu możliwości.

<Note>
Flaga `--json` wypisuje raport czytelny maszynowo, odpowiedni do skryptowania i audytu. `inspect --all` renderuje tabelę dla całego zestawu z kolumnami kształtu, rodzajów możliwości, powiadomień o zgodności, możliwości pakietu i podsumowania hooków. `info` jest aliasem `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` zgłasza błędy ładowania pluginów, diagnostykę manifestu/wykrywania oraz powiadomienia o zgodności. Gdy wszystko jest czyste, wypisuje `No plugin issues detected.`

Jeśli skonfigurowany plugin jest obecny na dysku, ale zablokowany przez kontrole bezpieczeństwa ścieżki loadera, walidacja konfiguracji zachowuje wpis pluginu i zgłasza go jako `present but blocked`. Napraw poprzedzającą diagnostykę zablokowanego pluginu, taką jak własność ścieżki lub uprawnienia do zapisu dla wszystkich, zamiast usuwać konfigurację `plugins.entries.<id>` albo `plugins.allow`.

W przypadku awarii kształtu modułu, takich jak brakujące eksporty `register`/`activate`, uruchom ponownie z `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, aby dołączyć zwarte podsumowanie kształtu eksportów w wyjściu diagnostycznym.

### Rejestr

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Lokalny rejestr pluginów to utrwalony model zimnego odczytu OpenClaw dla tożsamości zainstalowanych pluginów, ich włączenia, metadanych źródła i własności wkładu. Normalne uruchamianie, wyszukiwanie właściciela dostawcy, klasyfikacja konfiguracji kanałów i inwentarz pluginów mogą go odczytywać bez importowania modułów wykonawczych pluginów.

Użyj `plugins registry`, aby sprawdzić, czy utrwalony rejestr jest obecny, aktualny lub przestarzały. Użyj `--refresh`, aby odbudować go z utrwalonego indeksu pluginów, polityki konfiguracji oraz metadanych manifestu/pakietu. To ścieżka naprawy, a nie ścieżka aktywacji w czasie wykonywania.

`openclaw doctor --fix` naprawia także dryf zarządzanego npm sąsiadujący z rejestrem: jeśli osierocony lub odzyskany pakiet `@openclaw/*` pod zarządzanym głównym katalogiem npm pluginów przesłania wbudowany plugin, doctor usuwa ten przestarzały pakiet i odbudowuje rejestr, aby uruchamianie walidowało się względem wbudowanego manifestu.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` to przestarzały awaryjny przełącznik zgodności na wypadek błędów odczytu rejestru. Preferuj `plugins registry --refresh` lub `openclaw doctor --fix`; awaryjne użycie zmiennej środowiskowej służy tylko do odzyskiwania uruchamiania w sytuacji krytycznej podczas wdrażania migracji.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Lista Marketplace akceptuje lokalną ścieżkę marketplace, ścieżkę `marketplace.json`, skrót GitHub w formie `owner/repo`, URL repozytorium GitHub albo URL git. `--json` wypisuje rozwiązaną etykietę źródła oraz sparsowany manifest marketplace i wpisy pluginów.

## Powiązane

- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Dokumentacja CLI](/pl/cli)
- [Pluginy społeczności](/pl/plugins/community)
