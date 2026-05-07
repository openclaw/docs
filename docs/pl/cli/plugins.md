---
read_when:
    - Chcesz zainstalować Plugin Gateway lub nim zarządzać albo zarządzać zgodnymi pakietami
    - Chcesz debugować błędy ładowania Plugin
sidebarTitle: Plugins
summary: Dokumentacja referencyjna CLI dla `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Pluginy
x-i18n:
    generated_at: "2026-05-07T01:51:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: c43d51a8ecc2d420991e7beb585cbf3046d44cd6dca755377f4c050c7a155064
    source_path: cli/plugins.md
    workflow: 16
---

Zarządzaj pluginami Gateway, pakietami hooków i zgodnymi pakietami.

<CardGroup cols={2}>
  <Card title="System pluginów" href="/pl/tools/plugin">
    Przewodnik użytkownika końcowego dotyczący instalowania, włączania i rozwiązywania problemów z pluginami.
  </Card>
  <Card title="Zarządzanie pluginami" href="/pl/plugins/manage-plugins">
    Szybkie przykłady instalowania, wyświetlania listy, aktualizowania, odinstalowywania i publikowania.
  </Card>
  <Card title="Pakiety pluginów" href="/pl/plugins/bundles">
    Model zgodności pakietów.
  </Card>
  <Card title="Manifest pluginu" href="/pl/plugins/manifest">
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

Aby zbadać powolną instalację, inspekcję, odinstalowanie lub odświeżanie rejestru, uruchom
polecenie z `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Ślad zapisuje czasy faz
do stderr i zachowuje możliwość parsowania wyjścia JSON. Zobacz [Debugowanie](/pl/help/debugging#plugin-lifecycle-trace).

<Note>
W trybie Nix (`OPENCLAW_NIX_MODE=1`) mutatory cyklu życia pluginów są wyłączone. Użyj źródła Nix dla tej instalacji zamiast `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` lub `plugins disable`; dla nix-openclaw użyj [Szybkiego startu](https://github.com/openclaw/nix-openclaw#quick-start) z podejściem agent-first.
</Note>

<Note>
Wbudowane pluginy są dostarczane z OpenClaw. Niektóre są domyślnie włączone (na przykład wbudowani dostawcy modeli, wbudowani dostawcy mowy i wbudowany plugin przeglądarki); inne wymagają `plugins enable`.

Natywne pluginy OpenClaw muszą zawierać `openclaw.plugin.json` z wbudowanym JSON Schema (`configSchema`, nawet jeśli jest pusty). Zgodne pakiety używają zamiast tego własnych manifestów pakietów.

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

<Warning>
Same nazwy pakietów są podczas przejścia uruchomieniowego domyślnie instalowane z npm. Użyj `clawhub:<package>` dla ClawHub. Traktuj instalacje pluginów jak uruchamianie kodu. Preferuj przypięte wersje.
</Warning>

`plugins search` odpytuje ClawHub o instalowalne pakiety pluginów i wypisuje
nazwy pakietów gotowe do instalacji. Wyszukuje pakiety code-plugin i bundle-plugin,
a nie Skills. Użyj `openclaw skills search` dla Skills z ClawHub.

<Note>
ClawHub jest główną powierzchnią dystrybucji i odkrywania dla większości pluginów. Npm
pozostaje obsługiwaną ścieżką awaryjną i bezpośredniej instalacji. Należące do OpenClaw
pakiety pluginów `@openclaw/*` są ponownie publikowane w npm; zobacz bieżącą listę
na [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) lub
[inwentarz pluginów](/pl/plugins/plugin-inventory). Stabilne instalacje używają `latest`.
Instalacje i aktualizacje z kanału beta preferują npm `beta` dist-tag, gdy ten tag
jest dostępny, a następnie wracają do `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Dołączenia konfiguracji i naprawa nieprawidłowej konfiguracji">
    Jeśli sekcja `plugins` jest obsługiwana przez jednoplikowe `$include`, `plugins install/update/enable/disable/uninstall` zapisuje zmiany do tego dołączonego pliku i pozostawia `openclaw.json` bez zmian. Dołączenia główne, tablice dołączeń i dołączenia z sąsiadującymi nadpisaniami kończą się zamknięciem zamiast spłaszczania. Zobacz [Dołączenia konfiguracji](/pl/gateway/configuration), aby poznać obsługiwane kształty.

    Jeśli konfiguracja jest nieprawidłowa podczas instalacji, `plugins install` zwykle kończy się zamknięciem i informuje, aby najpierw uruchomić `openclaw doctor --fix`. Podczas uruchamiania Gateway i przeładowania na gorąco nieprawidłowa konfiguracja pluginu kończy się zamknięciem jak każda inna nieprawidłowa konfiguracja; `openclaw doctor --fix` może poddać kwarantannie nieprawidłowy wpis pluginu. Jedynym udokumentowanym wyjątkiem czasu instalacji jest wąska ścieżka odzyskiwania dla wbudowanych pluginów, które jawnie zgłaszają zgodę na `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force oraz ponowna instalacja kontra aktualizacja">
    `--force` ponownie używa istniejącego celu instalacji i nadpisuje już zainstalowany plugin lub pakiet hooków w miejscu. Użyj go, gdy celowo ponownie instalujesz ten sam identyfikator z nowej ścieżki lokalnej, archiwum, pakietu ClawHub lub artefaktu npm. Do rutynowych uaktualnień już śledzonego pluginu npm preferuj `openclaw plugins update <id-or-npm-spec>`.

    Jeśli uruchomisz `plugins install` dla identyfikatora pluginu, który jest już zainstalowany, OpenClaw zatrzyma się i wskaże `plugins update <id-or-npm-spec>` dla normalnego uaktualnienia albo `plugins install <package> --force`, gdy naprawdę chcesz nadpisać bieżącą instalację z innego źródła.

  </Accordion>
  <Accordion title="Zakres --pin">
    `--pin` dotyczy tylko instalacji npm. Nie jest obsługiwane z instalacjami `git:`; użyj jawnego odwołania git, takiego jak `git:github.com/acme/plugin@v1.2.3`, gdy chcesz przypiętego źródła. Nie jest obsługiwane z `--marketplace`, ponieważ instalacje z marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` to opcja awaryjna na fałszywe alarmy we wbudowanym skanerze niebezpiecznego kodu. Pozwala kontynuować instalację nawet wtedy, gdy wbudowany skaner zgłasza ustalenia `critical`, ale **nie** omija blokad zasad hooka `before_install` pluginu i **nie** omija niepowodzeń skanowania.

    Ta flaga CLI dotyczy przepływów instalacji/aktualizacji pluginów. Instalacje zależności Skills obsługiwane przez Gateway używają odpowiadającego nadpisania żądania `dangerouslyForceUnsafeInstall`, natomiast `openclaw skills install` pozostaje osobnym przepływem pobierania/instalowania Skills z ClawHub.

    Jeśli plugin opublikowany przez Ciebie w ClawHub jest blokowany przez skan rejestru, użyj kroków dla wydawcy w [ClawHub](/pl/tools/clawhub).

  </Accordion>
  <Accordion title="Pakiety hooków i specyfikacje npm">
    `plugins install` jest też powierzchnią instalacji dla pakietów hooków, które udostępniają `openclaw.hooks` w `package.json`. Użyj `openclaw hooks` do filtrowanej widoczności hooków i włączania poszczególnych hooków, nie do instalacji pakietów.

    Specyfikacje npm są **wyłącznie rejestrowe** (nazwa pakietu + opcjonalna **dokładna wersja** lub **dist-tag**). Specyfikacje Git/URL/plikowe i zakresy semver są odrzucane. Instalacje zależności działają lokalnie dla projektu z `--ignore-scripts` dla bezpieczeństwa, nawet gdy Twoja powłoka ma globalne ustawienia instalacji npm. Zarządzane katalogi główne npm pluginów dziedziczą `overrides` npm na poziomie pakietu OpenClaw, więc przypięcia bezpieczeństwa hosta dotyczą również wyniesionych zależności pluginów.

    Użyj `npm:<package>`, gdy chcesz jawnie wskazać rozwiązywanie przez npm. Same specyfikacje pakietów również instalują bezpośrednio z npm podczas przejścia uruchomieniowego.

    Same specyfikacje i `@latest` pozostają na ścieżce stabilnej. Starsze wersje korekcyjne OpenClaw, takie jak `2026.5.3-1`, nadal są traktowane jako stabilne wydania na potrzeby tego sprawdzenia, aby starsze pakiety dalej aktualizowały się bezpiecznie. Nowe prace w miesięcznych liniach wsparcia mają używać normalnych numerów poprawek SemVer zamiast przyrostków korekcyjnych z łącznikiem. Jeśli npm rozwiąże domyślną specyfikację linii do wersji wstępnej, OpenClaw zatrzyma się i poprosi o jawną zgodę przez tag wersji wstępnej, taki jak `@beta`/`@rc`, albo dokładną wersję wstępną, taką jak `@1.2.3-beta.4`.

    Jeśli sama specyfikacja instalacji pasuje do oficjalnego identyfikatora pluginu (na przykład `diffs`), OpenClaw instaluje bezpośrednio wpis katalogu. Aby zainstalować pakiet npm o tej samej nazwie, użyj jawnej specyfikacji zakresowej (na przykład `@scope/diffs`).

  </Accordion>
  <Accordion title="Repozytoria Git">
    Użyj `git:<repo>`, aby instalować bezpośrednio z repozytorium git. Obsługiwane formy obejmują `git:github.com/owner/repo`, `git:owner/repo`, pełne adresy URL klonowania `https://`, `ssh://`, `git://`, `file://` i `git@host:owner/repo.git`. Dodaj `@<ref>` lub `#<ref>`, aby przed instalacją wybrać branch, tag lub commit.

    Instalacje Git klonują do katalogu tymczasowego, wybierają żądane odwołanie, gdy jest obecne, a następnie używają normalnego instalatora katalogu pluginu. Oznacza to, że walidacja manifestu, skanowanie niebezpiecznego kodu, praca instalacyjna menedżera pakietów i rekordy instalacji zachowują się jak instalacje npm. Zapisane instalacje git obejmują źródłowy URL/ref oraz rozwiązany commit, aby `openclaw plugins update` mógł później ponownie rozwiązać źródło.

    Po instalacji z git użyj `openclaw plugins inspect <id> --runtime --json`, aby zweryfikować rejestracje środowiska wykonawczego, takie jak metody gateway i polecenia CLI. Jeśli plugin zarejestrował katalog główny CLI za pomocą `api.registerCli`, wykonaj to polecenie bezpośrednio przez główne CLI OpenClaw, na przykład `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archiwa">
    Obsługiwane archiwa: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archiwa natywnych pluginów OpenClaw muszą zawierać prawidłowy `openclaw.plugin.json` w wyodrębnionym katalogu głównym pluginu; archiwa zawierające tylko `package.json` są odrzucane, zanim OpenClaw zapisze rekordy instalacji.

    Użyj `npm-pack:<path.tgz>`, gdy plik jest archiwum tarball npm-pack i chcesz
    przetestować tę samą zarządzaną ścieżkę instalacji katalogu głównego npm, której używają instalacje z rejestru,
    w tym weryfikację `package-lock.json`, skanowanie wyniesionych zależności i
    rekordy instalacji npm. Zwykłe ścieżki archiwów nadal instalują się jako archiwa lokalne
    pod katalogiem głównym extensions pluginów.

    Obsługiwane są również instalacje z marketplace Claude.

  </Accordion>
</AccordionGroup>

Instalacje ClawHub używają jawnego lokalizatora `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Specyfikacje pluginów bezpieczne dla npm są podczas przejścia uruchomieniowego domyślnie instalowane z npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Użyj `npm:`, aby jawnie wskazać rozwiązywanie wyłącznie przez npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw sprawdza deklarowaną zgodność API pluginu / minimalną zgodność Gateway przed instalacją. Gdy wybrana wersja ClawHub publikuje artefakt ClawPack, OpenClaw pobiera wersjonowany pakiet npm `.tgz`, weryfikuje nagłówek skrótu ClawHub oraz skrót artefaktu, a następnie instaluje go zwykłą ścieżką archiwum. Starsze wersje ClawHub bez metadanych ClawPack nadal instalują się przez starszą ścieżkę weryfikacji archiwum pakietu. Zarejestrowane instalacje zachowują metadane źródła ClawHub, rodzaj artefaktu, integralność npm, sumę shasum npm, nazwę tarballa oraz fakty dotyczące skrótu ClawPack na potrzeby późniejszych aktualizacji.
Niewersjonowane instalacje ClawHub zachowują niewersjonowaną zarejestrowaną specyfikację, aby `openclaw plugins update` mogło podążać za nowszymi wydaniami ClawHub; jawne selektory wersji lub tagów, takie jak `clawhub:pkg@1.2.3` i `clawhub:pkg@beta`, pozostają przypięte do tego selektora.

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
    - znana Claude nazwa marketplace z `~/.claude/plugins/known_marketplaces.json`
    - lokalny katalog główny marketplace lub ścieżka `marketplace.json`
    - skrót repozytorium GitHub, taki jak `owner/repo`
    - URL repozytorium GitHub, taki jak `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Reguły zdalnego marketplace">
    W przypadku zdalnych marketplace ładowanych z GitHub lub git wpisy pluginów muszą pozostać wewnątrz sklonowanego repozytorium marketplace. OpenClaw akceptuje źródła ścieżek względnych z tego repozytorium i odrzuca HTTP(S), ścieżki bezwzględne, git, GitHub oraz inne nieścieżkowe źródła pluginów ze zdalnych manifestów.
  </Tab>
</Tabs>

W przypadku lokalnych ścieżek i archiwów OpenClaw automatycznie wykrywa:

- natywne pluginy OpenClaw (`openclaw.plugin.json`)
- pakiety zgodne z Codex (`.codex-plugin/plugin.json`)
- pakiety zgodne z Claude (`.claude-plugin/plugin.json` lub domyślny układ komponentów Claude)
- pakiety zgodne z Cursor (`.cursor-plugin/plugin.json`)

<Note>
Zgodne pakiety instalują się w zwykłym katalogu głównym pluginów i uczestniczą w tym samym przepływie list/info/enable/disable. Obecnie obsługiwane są Skills pakietów, umiejętności poleceń Claude, domyślne wartości Claude `settings.json`, domyślne wartości Claude `.lsp.json` / zadeklarowane w manifeście `lspServers`, umiejętności poleceń Cursor oraz zgodne katalogi hooków Codex; inne wykryte możliwości pakietów są pokazywane w diagnostyce/informacjach, ale nie są jeszcze podłączone do wykonywania w runtime.
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
`plugins list` najpierw odczytuje utrwalony lokalny rejestr pluginów, z awaryjnym wariantem wyprowadzonym wyłącznie z manifestu, gdy rejestr jest brakujący lub nieprawidłowy. Jest to przydatne do sprawdzenia, czy plugin jest zainstalowany, włączony i widoczny dla planowania zimnego uruchomienia, ale nie jest to aktywna sonda runtime już działającego procesu Gateway. Po zmianie kodu pluginu, stanu włączenia, polityki hooków lub `plugins.load.paths` zrestartuj Gateway obsługujący kanał, zanim oczekujesz uruchomienia nowego kodu `register(api)` lub hooków. W przypadku wdrożeń zdalnych/kontenerowych sprawdź, czy restartujesz rzeczywisty proces potomny `openclaw gateway run`, a nie tylko proces opakowujący.

`plugins list --json` zawiera `dependencyStatus` każdego pluginu z `package.json`
`dependencies` i `optionalDependencies`. OpenClaw sprawdza, czy te nazwy pakietów
są obecne wzdłuż zwykłej ścieżki wyszukiwania Node `node_modules` pluginu; nie
importuje kodu runtime pluginu, nie uruchamia menedżera pakietów ani nie naprawia
brakujących zależności.
</Note>

`plugins search` to zdalne wyszukiwanie katalogu ClawHub. Nie sprawdza lokalnego
stanu, nie modyfikuje konfiguracji, nie instaluje pakietów ani nie ładuje kodu runtime pluginu. Wyniki wyszukiwania zawierają nazwę pakietu ClawHub, rodzinę, kanał, wersję, podsumowanie oraz
wskazówkę instalacji, taką jak `openclaw plugins install clawhub:<package>`.

W przypadku pracy nad dołączonym pluginem wewnątrz spakowanego obrazu Docker podmontuj katalog
źródłowy pluginu w miejsce odpowiadającej mu spakowanej ścieżki źródłowej, takiej jak
`/app/extensions/synology-chat`. OpenClaw wykryje tę podmontowaną nakładkę źródłową
przed `/app/dist/extensions/synology-chat`; zwykły skopiowany katalog źródłowy
pozostaje nieaktywny, więc normalne spakowane instalacje nadal używają skompilowanego dist.

Do debugowania hooków runtime:

- `openclaw plugins inspect <id> --runtime --json` pokazuje zarejestrowane hooki i diagnostykę z przebiegu inspekcji z załadowanym modułem. Inspekcja runtime nigdy nie instaluje zależności; użyj `openclaw doctor --fix`, aby wyczyścić starszy stan zależności lub odzyskać brakujące pobieralne pluginy, do których odwołuje się konfiguracja.
- `openclaw gateway status --deep --require-rpc` potwierdza osiągalny Gateway, wskazówki dotyczące usługi/procesu, ścieżkę konfiguracji i kondycję RPC.
- Niedostarczane w pakiecie hooki konwersacji (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) wymagają `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Użyj `--link`, aby uniknąć kopiowania lokalnego katalogu (dodaje do `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` nie jest obsługiwane z `--link`, ponieważ instalacje linkowane ponownie używają ścieżki źródłowej zamiast kopiować do zarządzanego celu instalacji.

Użyj `--pin` przy instalacjach npm, aby zapisać rozwiązaną dokładną specyfikację (`name@version`) w zarządzanym indeksie pluginów, zachowując domyślne zachowanie bez przypięcia.
</Note>

### Indeks pluginów

Metadane instalacji pluginów są stanem zarządzanym maszynowo, a nie konfiguracją użytkownika. Instalacje i aktualizacje zapisują je do `plugins/installs.json` w aktywnym katalogu stanu OpenClaw. Mapa najwyższego poziomu `installRecords` jest trwałym źródłem metadanych instalacji, w tym rekordów dla uszkodzonych lub brakujących manifestów pluginów. Tablica `plugins` jest pochodzącą z manifestu pamięcią podręczną zimnego rejestru. Plik zawiera ostrzeżenie, aby go nie edytować, i jest używany przez `openclaw plugins update`, odinstalowanie, diagnostykę oraz zimny rejestr pluginów.

Gdy OpenClaw widzi dostarczone starsze rekordy `plugins.installs` w konfiguracji, odczyty runtime traktują je jako wejście zgodności bez przepisywania `openclaw.json`. Jawne zapisy pluginów i `openclaw doctor --fix` przenoszą te rekordy do indeksu pluginów i usuwają klucz konfiguracji, gdy zapisy konfiguracji są dozwolone; jeśli którykolwiek zapis się nie powiedzie, rekordy konfiguracji zostają zachowane, aby metadane instalacji nie zostały utracone.

### Odinstalowanie

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` usuwa rekordy pluginu z `plugins.entries`, utrwalonego indeksu pluginów, wpisów listy zezwalania/odmowy pluginów oraz linkowanych wpisów `plugins.load.paths`, gdy ma to zastosowanie. O ile `--keep-files` nie jest ustawione, odinstalowanie usuwa też śledzony zarządzany katalog instalacji, gdy znajduje się on wewnątrz katalogu głównego rozszerzeń pluginów OpenClaw. W przypadku pluginów Active Memory slot pamięci resetuje się do `memory-core`.

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
  <Accordion title="Rozwiązywanie identyfikatora pluginu względem specyfikacji npm">
    Gdy przekazujesz identyfikator pluginu, OpenClaw ponownie używa zarejestrowanej specyfikacji instalacji dla tego pluginu. Oznacza to, że wcześniej zapisane dist-tagi, takie jak `@beta`, oraz dokładne przypięte wersje nadal będą używane przy późniejszych uruchomieniach `update <id>`.

    W przypadku instalacji npm możesz też przekazać jawną specyfikację pakietu npm z dist-tagiem lub dokładną wersją. OpenClaw rozwiązuje tę nazwę pakietu z powrotem do śledzonego rekordu pluginu, aktualizuje ten zainstalowany plugin i zapisuje nową specyfikację npm dla przyszłych aktualizacji na podstawie identyfikatora.

    Przekazanie nazwy pakietu npm bez wersji lub tagu również rozwiązuje się z powrotem do śledzonego rekordu pluginu. Użyj tego, gdy plugin był przypięty do dokładnej wersji i chcesz przenieść go z powrotem na domyślną linię wydań rejestru.

  </Accordion>
  <Accordion title="Aktualizacje kanału beta">
    `openclaw plugins update` ponownie używa śledzonej specyfikacji pluginu, chyba że przekażesz nową specyfikację. `openclaw update` dodatkowo zna aktywny kanał aktualizacji OpenClaw: na kanale beta rekordy pluginów npm i ClawHub z domyślnej linii najpierw próbują `@beta`, a następnie wracają do zarejestrowanej specyfikacji default/latest, jeśli nie istnieje wydanie beta pluginu. Dokładne wersje i jawne tagi pozostają przypięte do tego selektora.

    OpenClaw nie udostępnia jeszcze kanałów pluginów dla LTS ani wsparcia miesięcznego. Planowana praca nad liniami wsparcia będzie wymagać, aby tagi pakietów pluginów i ClawHub podążały za tą samą linią wsparcia co pakiet core.

  </Accordion>
  <Accordion title="Sprawdzanie wersji i dryf integralności">
    Przed aktywną aktualizacją npm OpenClaw sprawdza zainstalowaną wersję pakietu względem metadanych rejestru npm. Jeśli zainstalowana wersja i zarejestrowana tożsamość artefaktu już odpowiadają rozwiązanemu celowi, aktualizacja jest pomijana bez pobierania, ponownej instalacji ani przepisywania `openclaw.json`.

    Gdy istnieje zapisany skrót integralności, a pobrany skrót artefaktu się zmienia, OpenClaw traktuje to jako dryf artefaktu npm. Interaktywne polecenie `openclaw plugins update` wypisuje oczekiwane i rzeczywiste skróty oraz prosi o potwierdzenie przed kontynuacją. Nieinteraktywne helpery aktualizacji kończą się zamknięciem, chyba że wywołujący poda jawną politykę kontynuacji.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install przy aktualizacji">
    `--dangerously-force-unsafe-install` jest również dostępne w `plugins update` jako awaryjne obejście fałszywych alarmów wbudowanego skanowania niebezpiecznego kodu podczas aktualizacji pluginów. Nadal nie omija blokad polityki `before_install` pluginu ani blokowania po niepowodzeniu skanowania, a dotyczy tylko aktualizacji pluginów, nie aktualizacji pakietów hooków.
  </Accordion>
</AccordionGroup>

### Inspekcja

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspekcja pokazuje tożsamość, stan ładowania, źródło, możliwości manifestu, flagi polityki, diagnostykę, metadane instalacji, możliwości pakietu oraz wykrytą obsługę serwera MCP lub LSP, domyślnie bez importowania runtime pluginu. Dodaj `--runtime`, aby załadować moduł pluginu i uwzględnić zarejestrowane hooki, narzędzia, polecenia, usługi, metody Gateway oraz trasy HTTP. Inspekcja runtime zgłasza brakujące zależności pluginu bezpośrednio; instalacje i naprawy pozostają w `openclaw plugins install`, `openclaw plugins update` i `openclaw doctor --fix`.

Polecenia CLI należące do pluginu są instalowane jako główne grupy poleceń `openclaw`. Gdy `inspect --runtime` pokaże polecenie pod `cliCommands`, uruchom je jako `openclaw <command> ...`; na przykład plugin rejestrujący `demo-git` można zweryfikować za pomocą `openclaw demo-git ping`.

Każdy plugin jest klasyfikowany według tego, co faktycznie rejestruje w runtime:

- **plain-capability** — jeden typ możliwości (np. Plugin tylko z dostawcą)
- **hybrid-capability** — wiele typów możliwości (np. tekst + mowa + obrazy)
- **hook-only** — tylko hooki, bez możliwości ani powierzchni
- **non-capability** — narzędzia/polecenia/usługi, ale bez możliwości

Więcej informacji o modelu możliwości znajdziesz w sekcji [Kształty Pluginów](/pl/plugins/architecture#plugin-shapes).

<Note>
Flaga `--json` generuje raport czytelny maszynowo, odpowiedni do skryptów i audytów. `inspect --all` renderuje tabelę dla całej floty z kolumnami dotyczącymi kształtu, rodzajów możliwości, powiadomień o zgodności, możliwości pakietu oraz podsumowania hooków. `info` jest aliasem dla `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` zgłasza błędy ładowania Pluginów, diagnostykę manifestu/odnajdywania oraz powiadomienia o zgodności. Gdy wszystko jest poprawne, wypisuje `No plugin issues detected.`

Jeśli skonfigurowany Plugin jest obecny na dysku, ale zablokowany przez kontrole bezpieczeństwa ścieżek loadera, walidacja konfiguracji zachowuje wpis Pluginu i zgłasza go jako `present but blocked`. Napraw poprzedzającą diagnostykę zablokowanego Pluginu, taką jak własność ścieżki lub uprawnienia do zapisu dla wszystkich, zamiast usuwać konfigurację `plugins.entries.<id>` albo `plugins.allow`.

W przypadku błędów kształtu modułu, takich jak brakujące eksporty `register`/`activate`, uruchom ponownie z `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, aby uwzględnić w danych diagnostycznych zwięzłe podsumowanie kształtu eksportów.

### Rejestr

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Lokalny rejestr Pluginów to utrwalony model zimnego odczytu OpenClaw dla tożsamości zainstalowanych Pluginów, ich włączenia, metadanych źródła oraz własności wkładów. Normalne uruchamianie, wyszukiwanie właściciela dostawcy, klasyfikacja konfiguracji kanałów i inwentarz Pluginów mogą go odczytywać bez importowania modułów runtime Pluginów.

Użyj `plugins registry`, aby sprawdzić, czy utrwalony rejestr jest obecny, aktualny albo nieaktualny. Użyj `--refresh`, aby odbudować go z utrwalonego indeksu Pluginów, zasad konfiguracji oraz metadanych manifestu/pakietu. To ścieżka naprawcza, a nie ścieżka aktywacji runtime.

`openclaw doctor --fix` naprawia także dryf zarządzanych pakietów npm powiązany z rejestrem: jeśli osierocony lub odzyskany pakiet `@openclaw/*` w zarządzanym katalogu głównym npm Pluginów przesłania wbudowany Plugin, doctor usuwa ten nieaktualny pakiet i odbudowuje rejestr, aby uruchamianie walidowało względem wbudowanego manifestu.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` to przestarzały przełącznik awaryjnej zgodności na wypadek błędów odczytu rejestru. Preferuj `plugins registry --refresh` albo `openclaw doctor --fix`; fallback env służy wyłącznie do awaryjnego odzyskiwania uruchamiania podczas wdrażania migracji.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Lista Marketplace przyjmuje lokalną ścieżkę Marketplace, ścieżkę `marketplace.json`, skrót GitHub w rodzaju `owner/repo`, URL repozytorium GitHub albo URL git. `--json` wypisuje rozwiązaną etykietę źródła oraz sparsowany manifest Marketplace i wpisy Pluginów.

## Powiązane

- [Tworzenie Pluginów](/pl/plugins/building-plugins)
- [Dokumentacja CLI](/pl/cli)
- [Pluginy społeczności](/pl/plugins/community)
