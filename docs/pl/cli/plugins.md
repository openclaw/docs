---
read_when:
    - Chcesz instalować pluginy Gateway lub zgodne pakiety albo nimi zarządzać
    - Chcesz debugować niepowodzenia ładowania Plugin
sidebarTitle: Plugins
summary: Dokumentacja referencyjna CLI dla `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Pluginy
x-i18n:
    generated_at: "2026-05-12T08:45:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b51646a103e9e020f6e53cd08aa25e7291fb629741fd41bdab520d80b7416ff
    source_path: cli/plugins.md
    workflow: 16
---

Zarządzaj pluginami Gateway, pakietami hooków i zgodnymi pakietami zbiorczymi.

<CardGroup cols={2}>
  <Card title="System Plugin" href="/pl/tools/plugin">
    Przewodnik dla użytkowników końcowych dotyczący instalowania, włączania i rozwiązywania problemów z pluginami.
  </Card>
  <Card title="Zarządzanie pluginami" href="/pl/plugins/manage-plugins">
    Szybkie przykłady instalowania, wyświetlania listy, aktualizowania, odinstalowywania i publikowania.
  </Card>
  <Card title="Pakiety zbiorcze pluginów" href="/pl/plugins/bundles">
    Model zgodności pakietów zbiorczych.
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

Aby zbadać powolną instalację, inspekcję, odinstalowanie lub odświeżenie rejestru, uruchom
polecenie z `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Ślad zapisuje czasy faz
do stderr i zachowuje możliwość parsowania wyjścia JSON. Zobacz [Debugowanie](/pl/help/debugging#plugin-lifecycle-trace).

<Note>
W trybie Nix (`OPENCLAW_NIX_MODE=1`) modyfikatory cyklu życia pluginów są wyłączone. Użyj źródła Nix dla tej instalacji zamiast `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` lub `plugins disable`; w przypadku nix-openclaw użyj podejścia agent-first z [Szybkiego startu](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Dołączone pluginy są dostarczane z OpenClaw. Niektóre są domyślnie włączone (na przykład dołączeni dostawcy modeli, dołączeni dostawcy mowy i dołączony plugin przeglądarki); inne wymagają `plugins enable`.

Natywne pluginy OpenClaw muszą dostarczać `openclaw.plugin.json` z wbudowanym schematem JSON (`configSchema`, nawet jeśli jest pusty). Zgodne pakiety zbiorcze używają zamiast tego własnych manifestów pakietów zbiorczych.

`plugins list` pokazuje `Format: openclaw` lub `Format: bundle`. Szczegółowe wyjście list/info pokazuje też podtyp pakietu zbiorczego (`codex`, `claude` lub `cursor`) oraz wykryte możliwości pakietu zbiorczego.
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

Opiekunowie testujący instalacje wykonywane podczas konfiguracji mogą zastąpić automatyczne źródła instalacji pluginów
za pomocą chronionych zmiennych środowiskowych. Zobacz
[Zastąpienia instalacji pluginów](/pl/plugins/install-overrides).

<Warning>
Same nazwy pakietów instalują z npm domyślnie podczas przejścia startowego. Użyj `clawhub:<package>` dla ClawHub. Traktuj instalacje pluginów jak uruchamianie kodu. Preferuj przypięte wersje.
</Warning>

`plugins search` odpytuje ClawHub o możliwe do zainstalowania pakiety pluginów i wypisuje
nazwy pakietów gotowe do instalacji. Przeszukuje pakiety code-plugin i bundle-plugin,
a nie Skills. Użyj `openclaw skills search` dla Skills z ClawHub.

<Note>
ClawHub jest główną powierzchnią dystrybucji i odkrywania większości pluginów. Npm
pozostaje obsługiwaną ścieżką zapasową i ścieżką instalacji bezpośredniej. Należące do OpenClaw
pakiety pluginów `@openclaw/*` są ponownie publikowane w npm; zobacz aktualną listę
na [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) lub w
[inwentarzu pluginów](/pl/plugins/plugin-inventory). Stabilne instalacje używają `latest`.
Instalacje i aktualizacje z kanału beta preferują npm `beta` dist-tag, gdy taki tag
jest dostępny, a następnie wracają do `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Dołączanie konfiguracji i naprawa nieprawidłowej konfiguracji">
    Jeśli sekcja `plugins` jest wspierana przez jednoplikowe `$include`, `plugins install/update/enable/disable/uninstall` zapisuje zmiany do tego dołączonego pliku i pozostawia `openclaw.json` bez zmian. Dołączenia główne, tablice dołączeń i dołączenia z równoległymi nadpisaniami kończą się bez zmian zamiast spłaszczać konfigurację. Zobacz [Dołączanie konfiguracji](/pl/gateway/configuration), aby poznać obsługiwane kształty.

    Jeśli konfiguracja jest nieprawidłowa podczas instalacji, `plugins install` zwykle kończy się bez zmian i informuje, aby najpierw uruchomić `openclaw doctor --fix`. Podczas uruchamiania Gateway i przeładowania na gorąco nieprawidłowa konfiguracja pluginów kończy się bez zmian jak każda inna nieprawidłowa konfiguracja; `openclaw doctor --fix` może poddać kwarantannie nieprawidłowy wpis pluginu. Jedynym udokumentowanym wyjątkiem podczas instalacji jest wąska ścieżka odzyskiwania dołączonego pluginu dla pluginów, które jawnie wybierają `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force oraz ponowna instalacja a aktualizacja">
    `--force` ponownie używa istniejącego celu instalacji i nadpisuje już zainstalowany plugin lub pakiet hooków w miejscu. Użyj tego, gdy celowo ponownie instalujesz ten sam identyfikator z nowej ścieżki lokalnej, archiwum, pakietu ClawHub lub artefaktu npm. Do rutynowych aktualizacji już śledzonego pluginu npm preferuj `openclaw plugins update <id-or-npm-spec>`.

    Jeśli uruchomisz `plugins install` dla identyfikatora pluginu, który jest już zainstalowany, OpenClaw zatrzyma się i wskaże `plugins update <id-or-npm-spec>` dla zwykłej aktualizacji albo `plugins install <package> --force`, gdy rzeczywiście chcesz nadpisać bieżącą instalację z innego źródła.

  </Accordion>
  <Accordion title="Zakres --pin">
    `--pin` dotyczy tylko instalacji npm. Nie jest obsługiwane z instalacjami `git:`; użyj jawnego odwołania git, takiego jak `git:github.com/acme/plugin@v1.2.3`, gdy chcesz przypięte źródło. Nie jest obsługiwane z `--marketplace`, ponieważ instalacje z marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` to opcja awaryjna dla fałszywych alarmów w wbudowanym skanerze niebezpiecznego kodu. Pozwala kontynuować instalację nawet wtedy, gdy wbudowany skaner zgłasza ustalenia `critical`, ale **nie** omija blokad zasad hooka pluginu `before_install` i **nie** omija niepowodzeń skanowania.

    Ta flaga CLI dotyczy przepływów instalacji/aktualizacji pluginów. Instalacje zależności Skills obsługiwane przez Gateway używają odpowiadającego jej nadpisania żądania `dangerouslyForceUnsafeInstall`, natomiast `openclaw skills install` pozostaje osobnym przepływem pobierania/instalacji Skills z ClawHub.

    Jeśli plugin opublikowany przez Ciebie w ClawHub jest blokowany przez skan rejestru, użyj kroków dla wydawcy w [ClawHub](/pl/clawhub/security).

  </Accordion>
  <Accordion title="Pakiety hooków i specyfikacje npm">
    `plugins install` jest także powierzchnią instalacji dla pakietów hooków, które udostępniają `openclaw.hooks` w `package.json`. Użyj `openclaw hooks` do filtrowanej widoczności hooków i włączania poszczególnych hooków, a nie do instalacji pakietów.

    Specyfikacje npm są **tylko rejestrowe** (nazwa pakietu + opcjonalna **dokładna wersja** lub **dist-tag**). Specyfikacje Git/URL/file i zakresy semver są odrzucane. Instalacje zależności działają lokalnie dla projektu z `--ignore-scripts` ze względów bezpieczeństwa, nawet gdy powłoka ma globalne ustawienia instalacji npm. Zarządzane korzenie npm pluginów dziedziczą `overrides` npm na poziomie pakietu OpenClaw, więc piny bezpieczeństwa hosta dotyczą także wyniesionych zależności pluginów.

    Użyj `npm:<package>`, gdy chcesz jawnie wskazać rozwiązywanie przez npm. Same specyfikacje pakietów również instalują bezpośrednio z npm podczas przejścia startowego.

    Same specyfikacje i `@latest` pozostają na ścieżce stabilnej. Oznaczone datą wersje korekcyjne OpenClaw, takie jak `2026.5.3-1`, są stabilnymi wydaniami dla tego sprawdzenia. Jeśli npm rozwiąże którąkolwiek z nich do wydania wstępnego, OpenClaw zatrzyma się i poprosi o jawne wyrażenie zgody za pomocą tagu wydania wstępnego, takiego jak `@beta`/`@rc`, lub dokładnej wersji wydania wstępnego, takiej jak `@1.2.3-beta.4`.

    Jeśli sama specyfikacja instalacji pasuje do oficjalnego identyfikatora pluginu (na przykład `diffs`), OpenClaw instaluje bezpośrednio wpis katalogu. Aby zainstalować pakiet npm o tej samej nazwie, użyj jawnej specyfikacji z zakresem (na przykład `@scope/diffs`).

  </Accordion>
  <Accordion title="Repozytoria Git">
    Użyj `git:<repo>`, aby instalować bezpośrednio z repozytorium git. Obsługiwane formy obejmują `git:github.com/owner/repo`, `git:owner/repo`, pełne adresy URL klonowania `https://`, `ssh://`, `git://`, `file://` oraz `git@host:owner/repo.git`. Dodaj `@<ref>` lub `#<ref>`, aby przed instalacją przełączyć się na gałąź, tag lub commit.

    Instalacje Git klonują do katalogu tymczasowego, przełączają się na żądane odwołanie, gdy jest obecne, a następnie używają zwykłego instalatora katalogu pluginu. Oznacza to, że walidacja manifestu, skanowanie niebezpiecznego kodu, prace instalacyjne menedżera pakietów i rekordy instalacji zachowują się jak instalacje npm. Zarejestrowane instalacje Git obejmują źródłowy URL/ref oraz rozwiązany commit, aby `openclaw plugins update` mógł później ponownie rozwiązać źródło.

    Po instalacji z git użyj `openclaw plugins inspect <id> --runtime --json`, aby zweryfikować rejestracje środowiska uruchomieniowego, takie jak metody gateway i polecenia CLI. Jeśli plugin zarejestrował korzeń CLI za pomocą `api.registerCli`, wykonaj to polecenie bezpośrednio przez główny CLI OpenClaw, na przykład `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archiwa">
    Obsługiwane archiwa: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archiwa natywnych pluginów OpenClaw muszą zawierać prawidłowy `openclaw.plugin.json` w wyodrębnionym katalogu głównym pluginu; archiwa zawierające tylko `package.json` są odrzucane, zanim OpenClaw zapisze rekordy instalacji.

    Użyj `npm-pack:<path.tgz>`, gdy plik jest tarballem npm-pack i chcesz
    przetestować tę samą zarządzaną ścieżkę instalacji korzenia npm, która jest używana przez instalacje z rejestru,
    w tym weryfikację `package-lock.json`, skanowanie wyniesionych zależności i
    rekordy instalacji npm. Zwykłe ścieżki archiwów nadal instalują się jako lokalne archiwa
    pod głównym katalogiem rozszerzeń pluginów.

    Instalacje z marketplace Claude są również obsługiwane.

  </Accordion>
</AccordionGroup>

Instalacje ClawHub używają jawnego lokatora `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Same specyfikacje pluginów bezpieczne dla npm instalują z npm domyślnie podczas przejścia startowego:

```bash
openclaw plugins install openclaw-codex-app-server
```

Użyj `npm:`, aby jawnie wskazać rozwiązywanie tylko przez npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw sprawdza deklarowaną zgodność API pluginu / minimalną zgodność z Gateway przed instalacją. Gdy wybrana wersja ClawHub publikuje artefakt ClawPack, OpenClaw pobiera wersjonowany pakiet npm `.tgz`, weryfikuje nagłówek skrótu ClawHub oraz skrót artefaktu, a następnie instaluje go przez standardową ścieżkę archiwum. Starsze wersje ClawHub bez metadanych ClawPack nadal instalują się przez starszą ścieżkę weryfikacji archiwum pakietu. Zarejestrowane instalacje zachowują metadane źródła ClawHub, rodzaj artefaktu, integralność npm, sumę shasum npm, nazwę tarballa oraz fakty skrótu ClawPack na potrzeby późniejszych aktualizacji.
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
    - lokalny katalog główny marketplace lub ścieżka `marketplace.json`
    - skrót repozytorium GitHub, taki jak `owner/repo`
    - URL repozytorium GitHub, taki jak `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Reguły zdalnego marketplace">
    W przypadku zdalnych marketplace ładowanych z GitHub lub git wpisy pluginów muszą pozostać wewnątrz sklonowanego repozytorium marketplace. OpenClaw akceptuje względne źródła ścieżek z tego repozytorium i odrzuca źródła pluginów HTTP(S), ścieżki bezwzględne, git, GitHub oraz inne źródła niebędące ścieżkami ze zdalnych manifestów.
  </Tab>
</Tabs>

Dla lokalnych ścieżek i archiwów OpenClaw automatycznie wykrywa:

- natywne pluginy OpenClaw (`openclaw.plugin.json`)
- pakiety zgodne z Codex (`.codex-plugin/plugin.json`)
- pakiety zgodne z Claude (`.claude-plugin/plugin.json` lub domyślny układ komponentów Claude)
- pakiety zgodne z Cursor (`.cursor-plugin/plugin.json`)

<Note>
Zgodne pakiety instalują się w standardowym katalogu głównym pluginów i uczestniczą w tym samym przepływie list/info/enable/disable. Obecnie obsługiwane są umiejętności pakietów, command-skills Claude, domyślne ustawienia Claude `settings.json`, domyślne ustawienia Claude `.lsp.json` / deklarowane w manifeście `lspServers`, command-skills Cursor oraz zgodne katalogi hooków Codex; inne wykryte możliwości pakietów są pokazywane w diagnostyce/informacjach, ale nie są jeszcze podłączone do wykonywania w runtime.
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
`plugins list` najpierw odczytuje utrwalony lokalny rejestr pluginów, z awaryjną wartością pochodzącą wyłącznie z manifestu, gdy rejestru brakuje lub jest nieprawidłowy. Jest to przydatne do sprawdzania, czy plugin jest zainstalowany, włączony i widoczny dla planowania zimnego startu, ale nie jest to sonda runtime na żywo dla już działającego procesu Gateway. Po zmianie kodu pluginu, włączenia, zasad hooków lub `plugins.load.paths` zrestartuj Gateway obsługujący kanał, zanim zaczniesz oczekiwać, że nowy kod `register(api)` lub hooki będą działać. W przypadku wdrożeń zdalnych/kontenerowych upewnij się, że restartujesz rzeczywisty proces potomny `openclaw gateway run`, a nie tylko proces opakowujący.

`plugins list --json` zawiera `dependencyStatus` każdego pluginu z `package.json`
`dependencies` i `optionalDependencies`. OpenClaw sprawdza, czy te nazwy pakietów
są obecne na standardowej ścieżce wyszukiwania Node `node_modules` pluginu; nie
importuje kodu runtime pluginu, nie uruchamia menedżera pakietów ani nie naprawia
brakujących zależności.
</Note>

`plugins search` to zdalne wyszukiwanie w katalogu ClawHub. Nie sprawdza lokalnego
stanu, nie modyfikuje konfiguracji, nie instaluje pakietów ani nie ładuje kodu
runtime pluginu. Wyniki wyszukiwania zawierają nazwę pakietu ClawHub, rodzinę,
kanał, wersję, podsumowanie oraz wskazówkę instalacji, taką jak `openclaw plugins install clawhub:<package>`.

W przypadku pracy nad dołączonym pluginem wewnątrz spakowanego obrazu Docker zamontuj
katalog źródłowy pluginu przez bind mount na odpowiadającą mu spakowaną ścieżkę źródłową, taką jak
`/app/extensions/synology-chat`. OpenClaw odkryje tę zamontowaną nakładkę źródłową
przed `/app/dist/extensions/synology-chat`; zwykły skopiowany katalog źródłowy
pozostaje nieaktywny, więc standardowe instalacje pakietowe nadal używają skompilowanego dist.

Do debugowania hooków runtime:

- `openclaw plugins inspect <id> --runtime --json` pokazuje zarejestrowane hooki i diagnostykę z przebiegu inspekcji po załadowaniu modułu. Inspekcja runtime nigdy nie instaluje zależności; użyj `openclaw doctor --fix`, aby wyczyścić starszy stan zależności lub odzyskać brakujące pluginy możliwe do pobrania, do których odwołuje się konfiguracja.
- `openclaw gateway status --deep --require-rpc` potwierdza osiągalny Gateway, wskazówki dotyczące usługi/procesu, ścieżkę konfiguracji i stan RPC.
- Niedołączone hooki konwersacji (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) wymagają `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Użyj `--link`, aby uniknąć kopiowania lokalnego katalogu (dodaje do `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` nie jest obsługiwane z `--link`, ponieważ instalacje linkowane ponownie używają ścieżki źródłowej zamiast kopiować na zarządzany cel instalacji.

Użyj `--pin` przy instalacjach npm, aby zapisać rozwiązaną dokładną specyfikację (`name@version`) w zarządzanym indeksie pluginów, zachowując domyślne zachowanie bez przypięcia.
</Note>

### Indeks pluginów

Metadane instalacji pluginu są stanem zarządzanym maszynowo, a nie konfiguracją użytkownika. Instalacje i aktualizacje zapisują je do `plugins/installs.json` w aktywnym katalogu stanu OpenClaw. Jego mapa najwyższego poziomu `installRecords` jest trwałym źródłem metadanych instalacji, w tym rekordów dla uszkodzonych lub brakujących manifestów pluginów. Tablica `plugins` jest pochodzącą z manifestów pamięcią podręczną zimnego rejestru. Plik zawiera ostrzeżenie, aby go nie edytować, i jest używany przez `openclaw plugins update`, odinstalowywanie, diagnostykę oraz zimny rejestr pluginów.

Gdy OpenClaw widzi dostarczone starsze rekordy `plugins.installs` w konfiguracji, odczyty runtime traktują je jako dane wejściowe zgodności bez przepisywania `openclaw.json`. Jawne zapisy pluginów i `openclaw doctor --fix` przenoszą te rekordy do indeksu pluginów i usuwają klucz konfiguracji, gdy zapisy konfiguracji są dozwolone; jeśli którykolwiek zapis się nie powiedzie, rekordy konfiguracji zostają zachowane, aby metadane instalacji nie zostały utracone.

### Odinstalowanie

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` usuwa rekordy pluginu z `plugins.entries`, utrwalonego indeksu pluginów, wpisów list allow/deny pluginów oraz linkowanych wpisów `plugins.load.paths`, gdy ma to zastosowanie. O ile nie ustawiono `--keep-files`, odinstalowanie usuwa również śledzony zarządzany katalog instalacji, gdy znajduje się on wewnątrz katalogu głównego rozszerzeń pluginów OpenClaw. W przypadku pluginów Active Memory slot pamięci resetuje się do `memory-core`.

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

Aktualizacje dotyczą śledzonych instalacji pluginów w zarządzanym indeksie pluginów oraz śledzonych instalacji pakietów hooków w `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Rozwiązywanie id pluginu kontra specyfikacja npm">
    Gdy przekazujesz id pluginu, OpenClaw ponownie używa zarejestrowanej specyfikacji instalacji dla tego pluginu. Oznacza to, że wcześniej zapisane dist-tags, takie jak `@beta`, oraz dokładnie przypięte wersje nadal są używane przy późniejszych uruchomieniach `update <id>`.

    W przypadku instalacji npm możesz również przekazać jawną specyfikację pakietu npm z dist-tag lub dokładną wersją. OpenClaw rozwiązuje tę nazwę pakietu z powrotem do śledzonego rekordu pluginu, aktualizuje ten zainstalowany plugin i zapisuje nową specyfikację npm na potrzeby przyszłych aktualizacji opartych na id.

    Przekazanie nazwy pakietu npm bez wersji lub tagu również rozwiązuje się z powrotem do śledzonego rekordu pluginu. Użyj tego, gdy plugin został przypięty do dokładnej wersji i chcesz przenieść go z powrotem na domyślną linię wydań rejestru.

  </Accordion>
  <Accordion title="Aktualizacje kanału beta">
    `openclaw plugins update` ponownie używa śledzonej specyfikacji pluginu, chyba że przekażesz nową specyfikację. `openclaw update` dodatkowo zna aktywny kanał aktualizacji OpenClaw: na kanale beta rekordy pluginów npm i ClawHub z domyślnej linii najpierw próbują `@beta`, a następnie wracają do zarejestrowanej specyfikacji default/latest, jeśli nie istnieje wydanie beta pluginu. Ten fallback jest raportowany jako ostrzeżenie i nie powoduje niepowodzenia aktualizacji core. Dokładne wersje i jawne tagi pozostają przypięte do tego selektora.

  </Accordion>
  <Accordion title="Sprawdzanie wersji i dryf integralności">
    Przed aktualizacją npm na żywo OpenClaw sprawdza zainstalowaną wersję pakietu względem metadanych rejestru npm. Jeśli zainstalowana wersja i zarejestrowana tożsamość artefaktu już pasują do rozwiązanego celu, aktualizacja jest pomijana bez pobierania, ponownej instalacji ani przepisywania `openclaw.json`.

    Gdy istnieje zapisany skrót integralności, a skrót pobranego artefaktu się zmienia, OpenClaw traktuje to jako dryf artefaktu npm. Interaktywne polecenie `openclaw plugins update` wypisuje oczekiwane i rzeczywiste skróty oraz prosi o potwierdzenie przed kontynuowaniem. Nieinteraktywne helpery aktualizacji kończą się bezpiecznym niepowodzeniem, chyba że wywołujący dostarczy jawną zasadę kontynuacji.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install przy aktualizacji">
    `--dangerously-force-unsafe-install` jest również dostępne w `plugins update` jako awaryjne obejście dla fałszywych alarmów wbudowanego skanowania niebezpiecznego kodu podczas aktualizacji pluginów. Nadal nie omija blokad zasad pluginu `before_install` ani blokowania po niepowodzeniu skanowania i dotyczy tylko aktualizacji pluginów, a nie aktualizacji pakietów hooków.
  </Accordion>
</AccordionGroup>

### Inspekcja

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspekcja pokazuje tożsamość, stan ładowania, źródło, możliwości manifestu, flagi zasad, diagnostykę, metadane instalacji, możliwości pakietu oraz wszelkie wykryte wsparcie serwerów MCP lub LSP bez domyślnego importowania runtime pluginu. Dodaj `--runtime`, aby załadować moduł pluginu i uwzględnić zarejestrowane hooki, narzędzia, polecenia, usługi, metody Gateway oraz trasy HTTP. Inspekcja runtime raportuje brakujące zależności pluginu bezpośrednio; instalacje i naprawy pozostają w `openclaw plugins install`, `openclaw plugins update` i `openclaw doctor --fix`.

Polecenia CLI należące do pluginu są zwykle instalowane jako główne grupy poleceń `openclaw`, ale pluginy mogą też rejestrować zagnieżdżone polecenia pod nadrzędnym elementem core, takim jak `openclaw nodes`. Gdy `inspect --runtime` pokaże polecenie pod `cliCommands`, uruchom je pod wymienioną ścieżką; na przykład plugin rejestrujący `demo-git` można zweryfikować poleceniem `openclaw demo-git ping`.

Każdy plugin jest klasyfikowany według tego, co faktycznie rejestruje w runtime:

- **plain-capability** — jeden typ capability (np. plugin tylko dla dostawcy)
- **hybrid-capability** — wiele typów capability (np. tekst + mowa + obrazy)
- **hook-only** — tylko hooki, bez capabilities ani powierzchni
- **non-capability** — narzędzia/polecenia/usługi, ale bez capabilities

Więcej informacji o modelu capability znajdziesz w [kształtach Plugin](/pl/plugins/architecture#plugin-shapes).

<Note>
Flaga `--json` generuje raport czytelny maszynowo, odpowiedni do skryptów i audytu. `inspect --all` renderuje tabelę dla całej floty z kolumnami kształtu, rodzajów capability, powiadomień o zgodności, capability pakietu oraz podsumowania hooków. `info` jest aliasem dla `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` raportuje błędy ładowania pluginów, diagnostykę manifestu/wykrywania oraz powiadomienia o zgodności. Gdy wszystko jest poprawne, wypisuje `No plugin issues detected.`

Jeśli skonfigurowany plugin jest obecny na dysku, ale zablokowany przez kontrole bezpieczeństwa ścieżek loadera, walidacja konfiguracji zachowuje wpis pluginu i zgłasza go jako `present but blocked`. Napraw poprzedzającą diagnostykę zablokowanego pluginu, taką jak własność ścieżki lub uprawnienia do zapisu dla wszystkich, zamiast usuwać konfigurację `plugins.entries.<id>` lub `plugins.allow`.

W przypadku błędów kształtu modułu, takich jak brakujące eksporty `register`/`activate`, uruchom ponownie z `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, aby dołączyć zwięzłe podsumowanie kształtu eksportów w danych wyjściowych diagnostyki.

### Rejestr

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Lokalny rejestr pluginów to utrwalony model zimnego odczytu OpenClaw dla tożsamości zainstalowanych pluginów, ich włączenia, metadanych źródła i własności wkładów. Zwykłe uruchamianie, wyszukiwanie właściciela dostawcy, klasyfikacja konfiguracji kanału i inwentarz pluginów mogą go odczytywać bez importowania modułów runtime pluginów.

Użyj `plugins registry`, aby sprawdzić, czy utrwalony rejestr jest obecny, aktualny lub nieaktualny. Użyj `--refresh`, aby odbudować go z utrwalonego indeksu pluginów, zasad konfiguracji oraz metadanych manifestu/pakietu. To ścieżka naprawy, a nie ścieżka aktywacji runtime.

`openclaw doctor --fix` naprawia także zarządzane rozbieżności npm sąsiadujące z rejestrem: jeśli osierocony lub odzyskany pakiet `@openclaw/*` pod zarządzanym katalogiem głównym npm pluginów przesłania plugin dołączony do pakietu, doctor usuwa ten nieaktualny pakiet i odbudowuje rejestr, aby uruchamianie walidowało się względem dołączonego manifestu. Doctor ponownie łączy także pakiet hosta `openclaw` z zarządzanymi pluginami npm, które deklarują `peerDependencies.openclaw`, dzięki czemu lokalne importy runtime pakietu, takie jak `openclaw/plugin-sdk/*`, rozwiązują się po aktualizacjach lub naprawach npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` to przestarzały awaryjny przełącznik zgodności na wypadek błędów odczytu rejestru. Preferuj `plugins registry --refresh` lub `openclaw doctor --fix`; fallback przez zmienną środowiskową służy tylko do awaryjnego przywracania uruchamiania w czasie wdrażania migracji.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Lista Marketplace przyjmuje lokalną ścieżkę marketplace, ścieżkę `marketplace.json`, skrót GitHub w rodzaju `owner/repo`, URL repozytorium GitHub lub URL git. `--json` wypisuje rozpoznaną etykietę źródła oraz sparsowany manifest marketplace i wpisy pluginów.

## Powiązane

- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Dokumentacja CLI](/pl/cli)
- [ClawHub](/pl/clawhub)
