---
read_when:
    - Chcesz zainstalować Pluginy Gateway lub zgodne pakiety albo nimi zarządzać
    - Chcesz debugować błędy ładowania Pluginów
sidebarTitle: Plugins
summary: Dokumentacja referencyjna CLI dla `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Pluginy
x-i18n:
    generated_at: "2026-05-11T20:27:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ad7d6341d6c2325bfef966b00ca1956f8b337fd0ffe40dba3384ed7eefd1285
    source_path: cli/plugins.md
    workflow: 16
---

Zarządzaj pluginami Gateway, pakietami hooków i zgodnymi pakietami.

<CardGroup cols={2}>
  <Card title="System Plugin" href="/pl/tools/plugin">
    Przewodnik użytkownika dotyczący instalowania, włączania i rozwiązywania problemów z pluginami.
  </Card>
  <Card title="Zarządzanie pluginami" href="/pl/plugins/manage-plugins">
    Szybkie przykłady instalowania, wyświetlania listy, aktualizowania, odinstalowywania i publikowania.
  </Card>
  <Card title="Pakiety Plugin" href="/pl/plugins/bundles">
    Model zgodności pakietów.
  </Card>
  <Card title="Manifest Plugin" href="/pl/plugins/manifest">
    Pola manifestu i schemat konfiguracji.
  </Card>
  <Card title="Bezpieczeństwo" href="/pl/gateway/security">
    Wzmocnienie bezpieczeństwa instalacji pluginów.
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

Aby zbadać powolną instalację, inspekcję, odinstalowanie lub odświeżanie rejestru, uruchom
polecenie z `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Ślad zapisuje czasy faz
do stderr i zachowuje możliwość parsowania wyjścia JSON. Zobacz [Debugowanie](/pl/help/debugging#plugin-lifecycle-trace).

<Note>
W trybie Nix (`OPENCLAW_NIX_MODE=1`) mutatory cyklu życia pluginów są wyłączone. Zamiast `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` lub `plugins disable` użyj źródła Nix dla tej instalacji; w przypadku nix-openclaw użyj [Szybkiego startu](https://github.com/openclaw/nix-openclaw#quick-start) z podejściem agent-first.
</Note>

<Note>
Pluginy w pakiecie są dostarczane z OpenClaw. Niektóre są domyślnie włączone (na przykład dostawcy modeli w pakiecie, dostawcy mowy w pakiecie i plugin przeglądarki w pakiecie); inne wymagają `plugins enable`.

Natywne pluginy OpenClaw muszą dostarczać `openclaw.plugin.json` z wbudowanym JSON Schema (`configSchema`, nawet jeśli pustym). Zgodne pakiety używają zamiast tego własnych manifestów pakietów.

`plugins list` pokazuje `Format: openclaw` lub `Format: bundle`. Szczegółowe wyjście listy/informacji pokazuje też podtyp pakietu (`codex`, `claude` lub `cursor`) oraz wykryte możliwości pakietu.
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

Opiekunowie testujący instalacje wykonywane podczas konfiguracji mogą nadpisywać automatyczne źródła instalacji pluginów
za pomocą chronionych zmiennych środowiskowych. Zobacz
[Nadpisania instalacji Plugin](/pl/plugins/install-overrides).

<Warning>
Same nazwy pakietów podczas przejścia uruchomieniowego domyślnie instalują z npm. Dla ClawHub użyj `clawhub:<package>`. Traktuj instalacje pluginów jak uruchamianie kodu. Preferuj przypięte wersje.
</Warning>

`plugins search` odpytuje ClawHub o możliwe do zainstalowania pakiety pluginów i wypisuje
nazwy pakietów gotowe do instalacji. Wyszukuje pakiety code-plugin i bundle-plugin,
a nie Skills. Dla Skills z ClawHub użyj `openclaw skills search`.

<Note>
ClawHub jest główną powierzchnią dystrybucji i odkrywania większości pluginów. Npm
pozostaje obsługiwaną ścieżką awaryjną i ścieżką instalacji bezpośredniej. Pakiety pluginów
`@openclaw/*` należące do OpenClaw są ponownie publikowane w npm; zobacz bieżącą listę
na [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) lub
[inwentarz pluginów](/pl/plugins/plugin-inventory). Stabilne instalacje używają `latest`.
Instalacje i aktualizacje z kanału beta preferują npm `beta` dist-tag, gdy ten tag
jest dostępny, a następnie wracają do `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Dołączanie konfiguracji i naprawa nieprawidłowej konfiguracji">
    Jeśli Twoja sekcja `plugins` jest obsługiwana przez jednoplikowe `$include`, `plugins install/update/enable/disable/uninstall` zapisują zmiany w tym dołączonym pliku i pozostawiają `openclaw.json` bez zmian. Dołączenia główne, tablice dołączeń i dołączenia z równorzędnymi nadpisaniami zamykają się bezpiecznie zamiast spłaszczać. Zobacz [Dołączenia konfiguracji](/pl/gateway/configuration), aby poznać obsługiwane kształty.

    Jeśli konfiguracja jest nieprawidłowa podczas instalacji, `plugins install` zwykle zamyka się bezpiecznie i informuje, aby najpierw uruchomić `openclaw doctor --fix`. Podczas uruchamiania Gateway i przeładowania na gorąco nieprawidłowa konfiguracja pluginów zamyka się bezpiecznie jak każda inna nieprawidłowa konfiguracja; `openclaw doctor --fix` może odizolować nieprawidłowy wpis pluginu. Jedynym udokumentowanym wyjątkiem podczas instalacji jest wąska ścieżka odzyskiwania pluginu w pakiecie dla pluginów, które jawnie włączają `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force i ponowna instalacja a aktualizacja">
    `--force` ponownie używa istniejącego celu instalacji i nadpisuje już zainstalowany plugin lub pakiet hooków na miejscu. Używaj tego, gdy celowo ponownie instalujesz ten sam identyfikator z nowej ścieżki lokalnej, archiwum, pakietu ClawHub lub artefaktu npm. Do rutynowych aktualizacji już śledzonego pluginu npm preferuj `openclaw plugins update <id-or-npm-spec>`.

    Jeśli uruchomisz `plugins install` dla identyfikatora pluginu, który jest już zainstalowany, OpenClaw zatrzyma się i wskaże `plugins update <id-or-npm-spec>` dla normalnej aktualizacji albo `plugins install <package> --force`, gdy rzeczywiście chcesz nadpisać bieżącą instalację z innego źródła.

  </Accordion>
  <Accordion title="Zakres --pin">
    `--pin` dotyczy tylko instalacji npm. Nie jest obsługiwane z instalacjami `git:`; użyj jawnego ref git, takiego jak `git:github.com/acme/plugin@v1.2.3`, gdy chcesz przypiąć źródło. Nie jest obsługiwane z `--marketplace`, ponieważ instalacje z marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` to opcja awaryjna dla fałszywych alarmów we wbudowanym skanerze niebezpiecznego kodu. Pozwala kontynuować instalację nawet wtedy, gdy wbudowany skaner zgłasza wyniki `critical`, ale **nie** omija blokad polityki hooka pluginu `before_install` i **nie** omija niepowodzeń skanowania.

    Ta flaga CLI dotyczy przepływów instalacji/aktualizacji pluginów. Instalacje zależności Skills obsługiwane przez Gateway używają odpowiadającego nadpisania żądania `dangerouslyForceUnsafeInstall`, natomiast `openclaw skills install` pozostaje osobnym przepływem pobierania/instalacji Skills z ClawHub.

    Jeśli plugin opublikowany przez Ciebie w ClawHub jest blokowany przez skan rejestru, użyj kroków dla wydawcy w [ClawHub](/pl/clawhub/security).

  </Accordion>
  <Accordion title="Pakiety hooków i specyfikacje npm">
    `plugins install` jest też powierzchnią instalacji dla pakietów hooków, które udostępniają `openclaw.hooks` w `package.json`. Używaj `openclaw hooks` do filtrowanej widoczności hooków i włączania poszczególnych hooków, nie do instalacji pakietów.

    Specyfikacje npm są **tylko rejestrowe** (nazwa pakietu + opcjonalna **dokładna wersja** lub **dist-tag**). Specyfikacje Git/URL/file oraz zakresy semver są odrzucane. Instalacje zależności działają lokalnie dla projektu z `--ignore-scripts` ze względów bezpieczeństwa, nawet gdy Twoja powłoka ma globalne ustawienia instalacji npm. Zarządzane katalogi główne npm pluginów dziedziczą pakietowe `overrides` npm OpenClaw, więc piny bezpieczeństwa hosta dotyczą również wyniesionych zależności pluginów.

    Użyj `npm:<package>`, gdy chcesz jawnie wymusić rozwiązywanie przez npm. Same specyfikacje pakietów również instalują bezpośrednio z npm podczas przejścia uruchomieniowego.

    Same specyfikacje i `@latest` pozostają na stabilnej ścieżce. Wersje poprawek OpenClaw z datą, takie jak `2026.5.3-1`, są dla tego sprawdzenia stabilnymi wydaniami. Jeśli npm rozwiąże którąkolwiek z nich do wersji przedpremierowej, OpenClaw zatrzyma się i poprosi o jawne włączenie przez tag przedpremierowy, taki jak `@beta`/`@rc`, albo dokładną wersję przedpremierową, taką jak `@1.2.3-beta.4`.

    Jeśli sama specyfikacja instalacji pasuje do oficjalnego identyfikatora pluginu (na przykład `diffs`), OpenClaw zainstaluje wpis katalogu bezpośrednio. Aby zainstalować pakiet npm o tej samej nazwie, użyj jawnej specyfikacji z zakresem (na przykład `@scope/diffs`).

  </Accordion>
  <Accordion title="Repozytoria Git">
    Użyj `git:<repo>`, aby instalować bezpośrednio z repozytorium git. Obsługiwane formy obejmują `git:github.com/owner/repo`, `git:owner/repo`, pełne adresy klonowania `https://`, `ssh://`, `git://`, `file://` oraz `git@host:owner/repo.git`. Dodaj `@<ref>` lub `#<ref>`, aby przed instalacją pobrać gałąź, tag lub commit.

    Instalacje Git klonują do katalogu tymczasowego, pobierają żądany ref, gdy jest obecny, a następnie używają normalnego instalatora katalogu pluginu. Oznacza to, że walidacja manifestu, skanowanie niebezpiecznego kodu, praca instalacyjna menedżera pakietów i rekordy instalacji zachowują się jak instalacje npm. Zarejestrowane instalacje Git obejmują źródłowy URL/ref oraz rozwiązany commit, aby `openclaw plugins update` mógł później ponownie rozwiązać źródło.

    Po instalacji z git użyj `openclaw plugins inspect <id> --runtime --json`, aby zweryfikować rejestracje runtime, takie jak metody Gateway i polecenia CLI. Jeśli plugin zarejestrował korzeń CLI za pomocą `api.registerCli`, wykonaj to polecenie bezpośrednio przez główny CLI OpenClaw, na przykład `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archiwa">
    Obsługiwane archiwa: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archiwa natywnych pluginów OpenClaw muszą zawierać prawidłowy `openclaw.plugin.json` w wypakowanym katalogu głównym pluginu; archiwa zawierające tylko `package.json` są odrzucane, zanim OpenClaw zapisze rekordy instalacji.

    Użyj `npm-pack:<path.tgz>`, gdy plik jest archiwum tarball npm-pack i chcesz
    przetestować tę samą zarządzaną ścieżkę instalacji katalogu głównego npm, której używają instalacje z rejestru,
    w tym weryfikację `package-lock.json`, skanowanie wyniesionych zależności i
    rekordy instalacji npm. Zwykłe ścieżki archiwów nadal instalują się jako archiwa lokalne
    pod katalogiem głównym rozszerzeń pluginów.

    Obsługiwane są również instalacje z marketplace Claude.

  </Accordion>
</AccordionGroup>

Instalacje ClawHub używają jawnego lokalizatora `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Same specyfikacje pluginów bezpieczne dla npm podczas przejścia uruchomieniowego domyślnie instalują z npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Użyj `npm:`, aby jawnie wymusić rozwiązywanie tylko przez npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw sprawdza reklamowaną zgodność API Plugin / minimalną zgodność Gateway przed instalacją. Gdy wybrana wersja ClawHub publikuje artefakt ClawPack, OpenClaw pobiera wersjonowany pakiet npm `.tgz`, weryfikuje nagłówek skrótu ClawHub oraz skrót artefaktu, a następnie instaluje go przez standardową ścieżkę archiwum. Starsze wersje ClawHub bez metadanych ClawPack nadal instalują się przez starszą ścieżkę weryfikacji archiwum pakietu. Zarejestrowane instalacje zachowują swoje metadane źródła ClawHub, rodzaj artefaktu, integralność npm, sumę shasum npm, nazwę archiwum tarball oraz fakty skrótu ClawPack na potrzeby późniejszych aktualizacji.
Niewersjonowane instalacje ClawHub zachowują niewersjonowaną zarejestrowaną specyfikację, aby `openclaw plugins update` mógł śledzić nowsze wydania ClawHub; jawne selektory wersji lub tagu, takie jak `clawhub:pkg@1.2.3` i `clawhub:pkg@beta`, pozostają przypięte do tego selektora.

#### Skrót Marketplace

Użyj skrótu `plugin@marketplace`, gdy nazwa Marketplace istnieje w lokalnej pamięci podręcznej rejestru Claude w `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Użyj `--marketplace`, gdy chcesz jawnie przekazać źródło Marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Źródła Marketplace">
    - znana Claude nazwa Marketplace z `~/.claude/plugins/known_marketplaces.json`
    - lokalny katalog główny Marketplace lub ścieżka `marketplace.json`
    - skrót repozytorium GitHub, taki jak `owner/repo`
    - URL repozytorium GitHub, taki jak `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Reguły zdalnego Marketplace">
    W przypadku zdalnych Marketplace wczytanych z GitHub lub git wpisy Plugin muszą pozostać wewnątrz sklonowanego repozytorium Marketplace. OpenClaw akceptuje źródła ze ścieżkami względnymi z tego repozytorium i odrzuca źródła Plugin HTTP(S), ścieżki bezwzględne, git, GitHub oraz inne źródła Plugin niebędące ścieżkami ze zdalnych manifestów.
  </Tab>
</Tabs>

Dla lokalnych ścieżek i archiwów OpenClaw automatycznie wykrywa:

- natywne Plugin OpenClaw (`openclaw.plugin.json`)
- pakiety zgodne z Codex (`.codex-plugin/plugin.json`)
- pakiety zgodne z Claude (`.claude-plugin/plugin.json` lub domyślny układ komponentów Claude)
- pakiety zgodne z Cursor (`.cursor-plugin/plugin.json`)

<Note>
Zgodne pakiety instalują się w normalnym katalogu głównym Plugin i uczestniczą w tym samym przepływie list/info/enable/disable. Obecnie obsługiwane są Skills pakietów, command-skills Claude, domyślne wartości Claude `settings.json`, domyślne wartości Claude `.lsp.json` / deklarowane w manifeście `lspServers`, command-skills Cursor oraz zgodne katalogi haków Codex; inne wykryte możliwości pakietów są pokazywane w diagnostyce/info, ale nie są jeszcze podłączone do wykonywania w czasie działania.
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
`plugins list` najpierw odczytuje utrwalony lokalny rejestr Plugin, z awaryjnym wariantem wyprowadzanym wyłącznie z manifestów, gdy rejestru brakuje lub jest nieprawidłowy. Jest to przydatne do sprawdzenia, czy Plugin jest zainstalowany, włączony i widoczny dla planowania zimnego startu, ale nie jest sondą czasu działania już uruchomionego procesu Gateway. Po zmianie kodu Plugin, stanu włączenia, polityki haków lub `plugins.load.paths` uruchom ponownie Gateway obsługujący kanał, zanim będziesz oczekiwać, że nowy kod `register(api)` lub haki zaczną działać. W przypadku wdrożeń zdalnych/kontenerowych sprawdź, czy restartujesz rzeczywisty proces podrzędny `openclaw gateway run`, a nie tylko proces opakowujący.

`plugins list --json` zawiera `dependencyStatus` każdego Plugin z `package.json`
`dependencies` i `optionalDependencies`. OpenClaw sprawdza, czy te nazwy pakietów
są obecne na normalnej ścieżce wyszukiwania Node `node_modules` Plugin; nie
importuje kodu czasu działania Plugin, nie uruchamia menedżera pakietów ani nie
naprawia brakujących zależności.
</Note>

`plugins search` to zdalne wyszukiwanie w katalogu ClawHub. Nie sprawdza lokalnego
stanu, nie modyfikuje konfiguracji, nie instaluje pakietów ani nie ładuje kodu
czasu działania Plugin. Wyniki wyszukiwania zawierają nazwę pakietu ClawHub,
rodzinę, kanał, wersję, podsumowanie oraz wskazówkę instalacji, taką jak
`openclaw plugins install clawhub:<package>`.

Do pracy nad dołączonym Plugin wewnątrz spakowanego obrazu Docker zamontuj przez bind katalog źródłowy Plugin
nad pasującą spakowaną ścieżką źródłową, taką jak
`/app/extensions/synology-chat`. OpenClaw wykryje tę zamontowaną nakładkę źródłową
przed `/app/dist/extensions/synology-chat`; zwykły skopiowany katalog źródłowy
pozostaje nieaktywny, więc normalne spakowane instalacje nadal używają skompilowanego dist.

Do debugowania haków czasu działania:

- `openclaw plugins inspect <id> --runtime --json` pokazuje zarejestrowane haki i diagnostykę z przebiegu inspekcji z załadowanym modułem. Inspekcja czasu działania nigdy nie instaluje zależności; użyj `openclaw doctor --fix`, aby wyczyścić starszy stan zależności lub odzyskać brakujące pobieralne Plugin, do których odwołuje się konfiguracja.
- `openclaw gateway status --deep --require-rpc` potwierdza osiągalny Gateway, wskazówki usługi/procesu, ścieżkę konfiguracji i kondycję RPC.
- Niedostarczane w pakiecie haki konwersacji (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) wymagają `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Użyj `--link`, aby uniknąć kopiowania lokalnego katalogu (dodaje do `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` nie jest obsługiwane z `--link`, ponieważ instalacje linkowane ponownie używają ścieżki źródłowej zamiast kopiować do zarządzanego celu instalacji.

Użyj `--pin` przy instalacjach npm, aby zapisać rozwiązaną dokładną specyfikację (`name@version`) w zarządzanym indeksie Plugin, zachowując domyślne zachowanie bez przypięcia.
</Note>

### Indeks Plugin

Metadane instalacji Plugin są stanem zarządzanym maszynowo, a nie konfiguracją użytkownika. Instalacje i aktualizacje zapisują je do `plugins/installs.json` w aktywnym katalogu stanu OpenClaw. Jego mapa najwyższego poziomu `installRecords` jest trwałym źródłem metadanych instalacji, w tym rekordów uszkodzonych lub brakujących manifestów Plugin. Tablica `plugins` jest wyprowadzoną z manifestów pamięcią podręczną zimnego rejestru. Plik zawiera ostrzeżenie, aby go nie edytować, i jest używany przez `openclaw plugins update`, odinstalowanie, diagnostykę oraz zimny rejestr Plugin.

Gdy OpenClaw widzi dostarczone starsze rekordy `plugins.installs` w konfiguracji, odczyty czasu działania traktują je jako dane wejściowe zgodności bez przepisywania `openclaw.json`. Jawne zapisy Plugin i `openclaw doctor --fix` przenoszą te rekordy do indeksu Plugin i usuwają klucz konfiguracji, gdy zapisy konfiguracji są dozwolone; jeśli którykolwiek zapis się nie powiedzie, rekordy konfiguracji są zachowywane, aby metadane instalacji nie zostały utracone.

### Odinstalowanie

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` usuwa rekordy Plugin z `plugins.entries`, utrwalonego indeksu Plugin, wpisów listy zezwalania/odmawiania Plugin oraz powiązanych wpisów `plugins.load.paths`, gdy ma to zastosowanie. Jeśli `--keep-files` nie jest ustawione, odinstalowanie usuwa również śledzony zarządzany katalog instalacji, gdy znajduje się on w katalogu głównym rozszerzeń Plugin OpenClaw. W przypadku Plugin aktywnej pamięci slot pamięci resetuje się do `memory-core`.

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

Aktualizacje dotyczą śledzonych instalacji Plugin w zarządzanym indeksie Plugin oraz śledzonych instalacji pakietów haków w `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Rozwiązywanie identyfikatora Plugin względem specyfikacji npm">
    Gdy przekazujesz identyfikator Plugin, OpenClaw ponownie używa zarejestrowanej specyfikacji instalacji dla tego Plugin. Oznacza to, że wcześniej zapisane dist-tags, takie jak `@beta`, oraz dokładnie przypięte wersje nadal są używane przy późniejszych uruchomieniach `update <id>`.

    W przypadku instalacji npm możesz też przekazać jawną specyfikację pakietu npm z dist-tag lub dokładną wersją. OpenClaw rozwiązuje tę nazwę pakietu z powrotem do śledzonego rekordu Plugin, aktualizuje ten zainstalowany Plugin i zapisuje nową specyfikację npm do przyszłych aktualizacji opartych na identyfikatorze.

    Przekazanie nazwy pakietu npm bez wersji lub tagu także rozwiązuje się z powrotem do śledzonego rekordu Plugin. Użyj tego, gdy Plugin był przypięty do dokładnej wersji i chcesz przenieść go z powrotem na domyślną linię wydań rejestru.

  </Accordion>
  <Accordion title="Aktualizacje kanału beta">
    `openclaw plugins update` ponownie używa śledzonej specyfikacji Plugin, chyba że przekażesz nową specyfikację. `openclaw update` dodatkowo zna aktywny kanał aktualizacji OpenClaw: na kanale beta rekordy Plugin npm i ClawHub z domyślnej linii najpierw próbują `@beta`, a następnie wracają do zarejestrowanej domyślnej/najnowszej specyfikacji, jeśli nie istnieje wydanie beta Plugin. Ten wariant awaryjny jest zgłaszany jako ostrzeżenie i nie powoduje niepowodzenia aktualizacji rdzenia. Dokładne wersje i jawne tagi pozostają przypięte do tego selektora.

  </Accordion>
  <Accordion title="Kontrole wersji i dryf integralności">
    Przed aktualizacją npm na żywo OpenClaw sprawdza zainstalowaną wersję pakietu względem metadanych rejestru npm. Jeśli zainstalowana wersja i zarejestrowana tożsamość artefaktu już pasują do rozwiązanego celu, aktualizacja jest pomijana bez pobierania, ponownej instalacji lub przepisywania `openclaw.json`.

    Gdy istnieje zapisany skrót integralności, a skrót pobranego artefaktu się zmienia, OpenClaw traktuje to jako dryf artefaktu npm. Interaktywne polecenie `openclaw plugins update` wypisuje oczekiwane i rzeczywiste skróty oraz prosi o potwierdzenie przed kontynuacją. Nieinteraktywne pomocniki aktualizacji kończą się niepowodzeniem w trybie zamkniętym, chyba że wywołujący dostarczy jawną politykę kontynuacji.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install przy aktualizacji">
    `--dangerously-force-unsafe-install` jest także dostępne w `plugins update` jako awaryjne obejście fałszywych alarmów wbudowanego skanowania niebezpiecznego kodu podczas aktualizacji Plugin. Nadal nie omija blokad polityki `before_install` Plugin ani blokowania po niepowodzeniu skanowania i dotyczy tylko aktualizacji Plugin, a nie aktualizacji pakietów haków.
  </Accordion>
</AccordionGroup>

### Inspekcja

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspekcja pokazuje tożsamość, stan ładowania, źródło, możliwości manifestu, flagi polityki, diagnostykę, metadane instalacji, możliwości pakietu oraz wykrytą obsługę serwerów MCP lub LSP bez domyślnego importowania kodu czasu działania Plugin. Dodaj `--runtime`, aby załadować moduł Plugin i uwzględnić zarejestrowane haki, narzędzia, polecenia, usługi, metody Gateway oraz trasy HTTP. Inspekcja czasu działania zgłasza brakujące zależności Plugin bezpośrednio; instalacje i naprawy pozostają w `openclaw plugins install`, `openclaw plugins update` i `openclaw doctor --fix`.

Polecenia CLI należące do Plugin są zwykle instalowane jako główne grupy poleceń `openclaw`, ale Plugin mogą też rejestrować zagnieżdżone polecenia pod nadrzędnym elementem rdzenia, takim jak `openclaw nodes`. Gdy `inspect --runtime` pokaże polecenie w `cliCommands`, uruchom je pod wymienioną ścieżką; na przykład Plugin, który rejestruje `demo-git`, można zweryfikować za pomocą `openclaw demo-git ping`.

Każdy Plugin jest klasyfikowany według tego, co faktycznie rejestruje w czasie działania:

- **plain-capability** — jeden typ capability (np. plugin tylko dostawcy)
- **hybrid-capability** — wiele typów capability (np. tekst + mowa + obrazy)
- **hook-only** — tylko hooki, bez capabilities ani powierzchni
- **non-capability** — narzędzia/polecenia/usługi, ale bez capabilities

Więcej informacji o modelu capability znajdziesz w [kształtach Plugin](/pl/plugins/architecture#plugin-shapes).

<Note>
Flaga `--json` wypisuje raport czytelny maszynowo, odpowiedni do skryptów i audytów. `inspect --all` renderuje tabelę obejmującą całą flotę, z kolumnami kształtu, rodzajów capability, powiadomień o zgodności, capabilities pakietu oraz podsumowania hooków. `info` jest aliasem `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` zgłasza błędy ładowania pluginów, diagnostykę manifestu/wykrywania oraz powiadomienia o zgodności. Gdy wszystko jest czyste, wypisuje `No plugin issues detected.`

Jeśli skonfigurowany plugin jest obecny na dysku, ale blokują go kontrole bezpieczeństwa ścieżek w loaderze, walidacja konfiguracji zachowuje wpis pluginu i zgłasza go jako `present but blocked`. Napraw poprzedzającą diagnostykę zablokowanego pluginu, taką jak własność ścieżki lub uprawnienia zapisu dla wszystkich, zamiast usuwać konfigurację `plugins.entries.<id>` albo `plugins.allow`.

W przypadku błędów kształtu modułu, takich jak brakujące eksporty `register`/`activate`, uruchom ponownie z `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, aby dołączyć zwarte podsumowanie kształtu eksportów w danych diagnostycznych.

### Rejestr

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Lokalny rejestr pluginów to utrwalony model zimnego odczytu OpenClaw dla tożsamości zainstalowanych pluginów, ich włączenia, metadanych źródła i własności wkładów. Normalne uruchamianie, wyszukiwanie właściciela dostawcy, klasyfikacja konfiguracji kanału oraz inwentarz pluginów mogą go odczytywać bez importowania modułów runtime pluginów.

Użyj `plugins registry`, aby sprawdzić, czy utrwalony rejestr istnieje, jest aktualny lub przestarzały. Użyj `--refresh`, aby odbudować go z utrwalonego indeksu pluginów, polityki konfiguracji oraz metadanych manifestu/pakietu. To ścieżka naprawy, a nie ścieżka aktywacji runtime.

`openclaw doctor --fix` naprawia także dryf zarządzanego npm sąsiadujący z rejestrem: jeśli osierocony lub odzyskany pakiet `@openclaw/*` w zarządzanym katalogu głównym npm pluginów przesłania plugin w pakiecie, doctor usuwa ten przestarzały pakiet i odbudowuje rejestr, aby uruchamianie walidowało względem manifestu z pakietu.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` to przestarzały awaryjny przełącznik zgodności na wypadek błędów odczytu rejestru. Preferuj `plugins registry --refresh` albo `openclaw doctor --fix`; zastępczy env jest przeznaczony tylko do awaryjnego odzyskiwania uruchomienia w czasie wdrażania migracji.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Lista Marketplace akceptuje lokalną ścieżkę marketplace, ścieżkę `marketplace.json`, skrót GitHub w rodzaju `owner/repo`, URL repozytorium GitHub albo URL git. `--json` wypisuje rozpoznaną etykietę źródła oraz sparsowany manifest marketplace i wpisy pluginów.

## Powiązane

- [Budowanie pluginów](/pl/plugins/building-plugins)
- [Dokumentacja CLI](/pl/cli)
- [ClawHub](/pl/clawhub)
