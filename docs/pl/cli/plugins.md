---
read_when:
    - Chcesz zainstalować pluginy Gateway lub zgodne pakiety albo nimi zarządzać
    - Chcesz debugować błędy ładowania pluginów
sidebarTitle: Plugins
summary: Dokumentacja referencyjna CLI dla `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Pluginy
x-i18n:
    generated_at: "2026-05-04T09:37:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: f561ce098181b07f25db3520b1726162863469ac05fb4a3e786915257d97c9a4
    source_path: cli/plugins.md
    workflow: 16
---

Zarządzaj Pluginami Gateway, pakietami hooków i zgodnymi pakietami zbiorczymi.

<CardGroup cols={2}>
  <Card title="System Pluginów" href="/pl/tools/plugin">
    Przewodnik dla użytkownika końcowego dotyczący instalowania, włączania i rozwiązywania problemów z Pluginami.
  </Card>
  <Card title="Zarządzanie Pluginami" href="/pl/plugins/manage-plugins">
    Szybkie przykłady instalowania, wyświetlania listy, aktualizowania, odinstalowywania i publikowania.
  </Card>
  <Card title="Pakiety zbiorcze Pluginów" href="/pl/plugins/bundles">
    Model zgodności pakietów zbiorczych.
  </Card>
  <Card title="Manifest Pluginu" href="/pl/plugins/manifest">
    Pola manifestu i schemat konfiguracji.
  </Card>
  <Card title="Bezpieczeństwo" href="/pl/gateway/security">
    Utwardzanie zabezpieczeń instalacji Pluginów.
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
Dołączone Pluginy są dostarczane z OpenClaw. Niektóre są domyślnie włączone (na przykład dołączeni dostawcy modeli, dołączeni dostawcy mowy i dołączony Plugin przeglądarki); inne wymagają `plugins enable`.

Natywne Pluginy OpenClaw muszą dostarczać `openclaw.plugin.json` z wbudowanym JSON Schema (`configSchema`, nawet jeśli jest pusty). Zgodne pakiety zbiorcze używają zamiast tego własnych manifestów pakietów zbiorczych.

`plugins list` pokazuje `Format: openclaw` albo `Format: bundle`. Szczegółowe wyjście listy/informacji pokazuje także podtyp pakietu zbiorczego (`codex`, `claude` albo `cursor`) oraz wykryte możliwości pakietu zbiorczego.
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
Same nazwy pakietów są instalowane domyślnie z npm podczas przejścia uruchomieniowego. Użyj `clawhub:<package>` dla ClawHub. Traktuj instalacje Pluginów jak uruchamianie kodu. Preferuj przypięte wersje.
</Warning>

`plugins search` wysyła zapytanie do ClawHub o instalowalne pakiety Pluginów i wypisuje
nazwy pakietów gotowe do instalacji. Przeszukuje pakiety Pluginów kodu i pakietów zbiorczych,
a nie Skills. Użyj `openclaw skills search` dla Skills ClawHub.

<Note>
ClawHub to główna powierzchnia dystrybucji i odkrywania większości Pluginów. Npm
pozostaje obsługiwanym rozwiązaniem zapasowym oraz ścieżką instalacji bezpośredniej. Należące do OpenClaw
pakiety Pluginów `@openclaw/*` są ponownie publikowane w npm; zobacz bieżącą listę
na [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) albo
[spisie Pluginów](/pl/plugins/plugin-inventory). Stabilne instalacje używają `latest`.
Instalacje i aktualizacje z kanału beta preferują tag dystrybucyjny npm `beta`, gdy ten tag
jest dostępny, a potem wracają do `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Dołączanie konfiguracji i naprawa nieprawidłowej konfiguracji">
    Jeśli Twoja sekcja `plugins` jest oparta na jednoplikowym `$include`, `plugins install/update/enable/disable/uninstall` zapisują do tego dołączonego pliku i pozostawiają `openclaw.json` bez zmian. Dołączenia główne, tablice dołączeń i dołączenia z sąsiednimi nadpisaniami kończą się zamknięciem zamiast spłaszczania. Zobacz [Dołączanie konfiguracji](/pl/gateway/configuration), aby poznać obsługiwane kształty.

    Jeśli konfiguracja jest nieprawidłowa podczas instalacji, `plugins install` zwykle kończy się zamknięciem i informuje, aby najpierw uruchomić `openclaw doctor --fix`. Podczas uruchamiania Gateway i gorącego przeładowania nieprawidłowa konfiguracja Pluginów kończy się zamknięciem tak jak każda inna nieprawidłowa konfiguracja; `openclaw doctor --fix` może poddać kwarantannie nieprawidłowy wpis Pluginu. Jedynym udokumentowanym wyjątkiem w czasie instalacji jest wąska ścieżka odzyskiwania dołączonego Pluginu dla Pluginów, które jawnie wybierają `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force oraz ponowna instalacja kontra aktualizacja">
    `--force` ponownie używa istniejącego celu instalacji i nadpisuje już zainstalowany Plugin lub pakiet hooków w miejscu. Użyj tego, gdy celowo ponownie instalujesz ten sam identyfikator z nowej ścieżki lokalnej, archiwum, pakietu ClawHub lub artefaktu npm. Do rutynowych aktualizacji już śledzonego Pluginu npm preferuj `openclaw plugins update <id-or-npm-spec>`.

    Jeśli uruchomisz `plugins install` dla identyfikatora Pluginu, który jest już zainstalowany, OpenClaw zatrzyma się i wskaże `plugins update <id-or-npm-spec>` dla zwykłej aktualizacji albo `plugins install <package> --force`, gdy naprawdę chcesz nadpisać bieżącą instalację z innego źródła.

  </Accordion>
  <Accordion title="Zakres --pin">
    `--pin` dotyczy tylko instalacji npm. Nie jest obsługiwane z instalacjami `git:`; użyj jawnego refa git, takiego jak `git:github.com/acme/plugin@v1.2.3`, gdy chcesz przypięte źródło. Nie jest obsługiwane z `--marketplace`, ponieważ instalacje z marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` to opcja awaryjna dla fałszywych alarmów we wbudowanym skanerze niebezpiecznego kodu. Pozwala kontynuować instalację nawet wtedy, gdy wbudowany skaner zgłasza ustalenia `critical`, ale **nie** omija blokad zasad hooka `before_install` Pluginu i **nie** omija niepowodzeń skanowania.

    Ta flaga CLI dotyczy przepływów instalacji/aktualizacji Pluginów. Instalacje zależności Skills wspierane przez Gateway używają odpowiadającego nadpisania żądania `dangerouslyForceUnsafeInstall`, natomiast `openclaw skills install` pozostaje osobnym przepływem pobierania/instalacji Skills z ClawHub.

    Jeśli Plugin opublikowany przez Ciebie w ClawHub jest blokowany przez skan rejestru, użyj kroków dla wydawcy w [ClawHub](/pl/tools/clawhub).

  </Accordion>
  <Accordion title="Pakiety hooków i specyfikacje npm">
    `plugins install` jest także powierzchnią instalacji dla pakietów hooków, które udostępniają `openclaw.hooks` w `package.json`. Użyj `openclaw hooks` do filtrowanej widoczności hooków i włączania poszczególnych hooków, a nie do instalacji pakietów.

    Specyfikacje npm są **tylko rejestrowe** (nazwa pakietu + opcjonalna **dokładna wersja** albo **tag dystrybucyjny**). Specyfikacje Git/URL/plikowe i zakresy semver są odrzucane. Instalacje zależności są uruchamiane lokalnie dla projektu z `--ignore-scripts` ze względów bezpieczeństwa, nawet gdy Twoja powłoka ma globalne ustawienia instalacji npm.

    Użyj `npm:<package>`, gdy chcesz jawnie wskazać rozwiązywanie npm. Same specyfikacje pakietów także instalują bezpośrednio z npm podczas przejścia uruchomieniowego.

    Same specyfikacje i `@latest` pozostają na ścieżce stabilnej. Oznaczone datą wersje korekcyjne OpenClaw, takie jak `2026.5.3-1`, są stabilnymi wydaniami dla tego sprawdzenia. Jeśli npm rozwiąże którąkolwiek z nich do wersji przedpremierowej, OpenClaw zatrzyma się i poprosi o jawne wyrażenie zgody przy użyciu tagu przedpremierowego, takiego jak `@beta`/`@rc`, albo dokładnej wersji przedpremierowej, takiej jak `@1.2.3-beta.4`.

    Jeśli sama specyfikacja instalacji pasuje do oficjalnego identyfikatora Pluginu (na przykład `diffs`), OpenClaw instaluje bezpośrednio wpis katalogu. Aby zainstalować pakiet npm o tej samej nazwie, użyj jawnej specyfikacji z zakresem (na przykład `@scope/diffs`).

  </Accordion>
  <Accordion title="Repozytoria Git">
    Użyj `git:<repo>`, aby zainstalować bezpośrednio z repozytorium git. Obsługiwane formy obejmują `git:github.com/owner/repo`, `git:owner/repo`, pełne adresy URL klonowania `https://`, `ssh://`, `git://`, `file://` i `git@host:owner/repo.git`. Dodaj `@<ref>` albo `#<ref>`, aby przed instalacją wyewidencjonować gałąź, tag albo commit.

    Instalacje git klonują do katalogu tymczasowego, wyewidencjonowują żądany ref, gdy jest obecny, a następnie używają normalnego instalatora katalogu Pluginu. To oznacza, że walidacja manifestu, skanowanie niebezpiecznego kodu, prace instalacyjne menedżera pakietów i rekordy instalacji zachowują się jak instalacje npm. Zarejestrowane instalacje git obejmują źródłowy URL/ref oraz rozwiązany commit, aby `openclaw plugins update` mógł później ponownie rozwiązać źródło.

    Po instalacji z git użyj `openclaw plugins inspect <id> --runtime --json`, aby zweryfikować rejestracje runtime, takie jak metody Gateway i polecenia CLI. Jeśli Plugin zarejestrował korzeń CLI za pomocą `api.registerCli`, wykonaj to polecenie bezpośrednio przez główny CLI OpenClaw, na przykład `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archiwa">
    Obsługiwane archiwa: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archiwa natywnych Pluginów OpenClaw muszą zawierać prawidłowy `openclaw.plugin.json` w wyodrębnionym katalogu głównym Pluginu; archiwa zawierające tylko `package.json` są odrzucane, zanim OpenClaw zapisze rekordy instalacji.

    Instalacje z marketplace Claude także są obsługiwane.

  </Accordion>
</AccordionGroup>

Instalacje ClawHub używają jawnego lokatora `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Same specyfikacje Pluginów bezpieczne dla npm są domyślnie instalowane z npm podczas przejścia uruchomieniowego:

```bash
openclaw plugins install openclaw-codex-app-server
```

Użyj `npm:`, aby jawnie wskazać rozwiązywanie tylko przez npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw sprawdza deklarowaną zgodność API Pluginu / minimalną zgodność Gateway przed instalacją. Gdy wybrana wersja ClawHub publikuje artefakt ClawPack, OpenClaw pobiera wersjonowany `.tgz` npm-pack, weryfikuje nagłówek skrótu ClawHub i skrót artefaktu, a następnie instaluje go przez normalną ścieżkę archiwum. Starsze wersje ClawHub bez metadanych ClawPack nadal instalują się przez starszą ścieżkę weryfikacji archiwum pakietu. Zarejestrowane instalacje zachowują swoje metadane źródła ClawHub, rodzaj artefaktu, integralność npm, shasum npm, nazwę tarballa i fakty dotyczące skrótu ClawPack na potrzeby późniejszych aktualizacji.
Niewersjonowane instalacje ClawHub zachowują niewersjonowaną zarejestrowaną specyfikację, aby `openclaw plugins update` mógł podążać za nowszymi wydaniami ClawHub; jawne selektory wersji lub tagów, takie jak `clawhub:pkg@1.2.3` i `clawhub:pkg@beta`, pozostają przypięte do tego selektora.

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
    - nazwa znanego marketplace Claude z `~/.claude/plugins/known_marketplaces.json`
    - lokalny katalog główny marketplace albo ścieżka `marketplace.json`
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
- pakiety zgodne z Claude (`.claude-plugin/plugin.json` albo domyślny układ komponentów Claude)
- pakiety zgodne z Cursor (`.cursor-plugin/plugin.json`)

<Note>
Zgodne pakiety instalują się w normalnym katalogu głównym pluginów i uczestniczą w tym samym przepływie list/info/enable/disable. Obecnie obsługiwane są Skills pakietów, command-skills Claude, domyślne ustawienia Claude `settings.json`, domyślne ustawienia Claude `.lsp.json` / zadeklarowane w manifeście `lspServers`, command-skills Cursor oraz zgodne katalogi hooków Codex; inne wykryte możliwości pakietów są pokazywane w diagnostyce/informacjach, ale nie są jeszcze podłączone do wykonywania w środowisku uruchomieniowym.
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
`plugins list` najpierw odczytuje utrwalony lokalny rejestr pluginów, z awaryjnym wariantem pochodzącym wyłącznie z manifestu, gdy rejestru brakuje albo jest nieprawidłowy. Przydaje się to do sprawdzania, czy plugin jest zainstalowany, włączony i widoczny dla planowania zimnego uruchomienia, ale nie jest to live sonda środowiska uruchomieniowego już działającego procesu Gateway. Po zmianie kodu pluginu, stanu włączenia, zasad hooków albo `plugins.load.paths` zrestartuj Gateway obsługujący kanał, zanim zaczniesz oczekiwać uruchomienia nowego kodu `register(api)` lub hooków. W przypadku wdrożeń zdalnych/kontenerowych upewnij się, że restartujesz rzeczywisty proces potomny `openclaw gateway run`, a nie tylko proces opakowujący.

`plugins list --json` zawiera `dependencyStatus` każdego pluginu z `package.json`
`dependencies` i `optionalDependencies`. OpenClaw sprawdza, czy te nazwy pakietów
są obecne wzdłuż normalnej ścieżki wyszukiwania Node `node_modules` dla pluginu; nie
importuje kodu środowiska uruchomieniowego pluginu, nie uruchamia menedżera pakietów ani nie naprawia brakujących
zależności.
</Note>

`plugins search` to zdalne wyszukiwanie katalogu ClawHub. Nie sprawdza stanu
lokalnego, nie modyfikuje konfiguracji, nie instaluje pakietów ani nie ładuje kodu środowiska uruchomieniowego pluginu. Wyniki wyszukiwania obejmują nazwę pakietu ClawHub, rodzinę, kanał, wersję, podsumowanie oraz
wskazówkę instalacji, taką jak `openclaw plugins install clawhub:<package>`.

Przy pracy nad dołączonym pluginem wewnątrz spakowanego obrazu Docker zamontuj przez bind-mount katalog
źródłowy pluginu nad odpowiadającą mu spakowaną ścieżką źródłową, taką jak
`/app/extensions/synology-chat`. OpenClaw wykryje tę zamontowaną nakładkę źródłową
przed `/app/dist/extensions/synology-chat`; zwykły skopiowany katalog źródłowy
pozostanie nieaktywny, więc normalne spakowane instalacje nadal będą używać skompilowanego dist.

Do debugowania hooków środowiska uruchomieniowego:

- `openclaw plugins inspect <id> --runtime --json` pokazuje zarejestrowane hooki i diagnostykę z przebiegu inspekcji z załadowanym modułem. Inspekcja środowiska uruchomieniowego nigdy nie instaluje zależności; użyj `openclaw doctor --fix`, aby wyczyścić starszy stan zależności albo zainstalować brakujące skonfigurowane pluginy do pobrania.
- `openclaw gateway status --deep --require-rpc` potwierdza osiągalny Gateway, wskazówki dotyczące usługi/procesu, ścieżkę konfiguracji i kondycję RPC.
- Niedołączone hooki konwersacji (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) wymagają `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Użyj `--link`, aby uniknąć kopiowania lokalnego katalogu (dodaje do `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` nie jest obsługiwane z `--link`, ponieważ instalacje linkowane ponownie używają ścieżki źródłowej zamiast kopiować na zarządzany cel instalacji.

Użyj `--pin` przy instalacjach npm, aby zapisać rozwiązaną dokładną specyfikację (`name@version`) w zarządzanym indeksie pluginów, zachowując domyślne zachowanie bez przypięcia.
</Note>

### Indeks pluginów

Metadane instalacji pluginów to stan zarządzany maszynowo, a nie konfiguracja użytkownika. Instalacje i aktualizacje zapisują je do `plugins/installs.json` w aktywnym katalogu stanu OpenClaw. Jego najwyższego poziomu mapa `installRecords` jest trwałym źródłem metadanych instalacji, w tym rekordów dla uszkodzonych lub brakujących manifestów pluginów. Tablica `plugins` to pochodząca z manifestu pamięć podręczna zimnego rejestru. Plik zawiera ostrzeżenie, aby go nie edytować, i jest używany przez `openclaw plugins update`, odinstalowywanie, diagnostykę i zimny rejestr pluginów.

Gdy OpenClaw widzi dostarczone starsze rekordy `plugins.installs` w konfiguracji, przenosi je do indeksu pluginów i usuwa klucz konfiguracji; jeśli którykolwiek zapis się nie powiedzie, rekordy konfiguracji zostają zachowane, aby metadane instalacji nie zostały utracone.

### Odinstalowanie

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` usuwa rekordy pluginów z `plugins.entries`, utrwalonego indeksu pluginów, wpisów list dozwolonych/zabronionych pluginów oraz linkowanych wpisów `plugins.load.paths`, gdy ma to zastosowanie. O ile nie ustawiono `--keep-files`, odinstalowanie usuwa też śledzony zarządzany katalog instalacji, gdy znajduje się on w katalogu głównym rozszerzeń pluginów OpenClaw. W przypadku pluginów Active Memory slot pamięci resetuje się do `memory-core`.

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

Aktualizacje dotyczą śledzonych instalacji pluginów w zarządzanym indeksie pluginów oraz śledzonych instalacji hook-pack w `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Rozwiązywanie identyfikatora pluginu względem specyfikacji npm">
    Gdy podajesz identyfikator pluginu, OpenClaw ponownie używa zapisanej specyfikacji instalacji dla tego pluginu. Oznacza to, że wcześniej przechowywane dist-tags, takie jak `@beta`, oraz dokładnie przypięte wersje nadal będą używane przy późniejszych uruchomieniach `update <id>`.

    W przypadku instalacji npm możesz też podać jawną specyfikację pakietu npm z dist-tag albo dokładną wersją. OpenClaw rozwiązuje tę nazwę pakietu z powrotem do śledzonego rekordu pluginu, aktualizuje ten zainstalowany plugin i zapisuje nową specyfikację npm dla przyszłych aktualizacji opartych na identyfikatorze.

    Podanie nazwy pakietu npm bez wersji lub tagu również rozwiązuje ją z powrotem do śledzonego rekordu pluginu. Użyj tego, gdy plugin był przypięty do dokładnej wersji i chcesz przenieść go z powrotem na domyślną linię wydań rejestru.

  </Accordion>
  <Accordion title="Aktualizacje kanału beta">
    `openclaw plugins update` ponownie używa śledzonej specyfikacji pluginu, chyba że podasz nową specyfikację. `openclaw update` dodatkowo zna aktywny kanał aktualizacji OpenClaw: na kanale beta rekordy pluginów npm i ClawHub z domyślnej linii najpierw próbują `@beta`, a potem wracają do zapisanej domyślnej/najnowszej specyfikacji, jeśli nie istnieje wydanie beta pluginu. Dokładne wersje i jawne tagi pozostają przypięte do tego selektora.

  </Accordion>
  <Accordion title="Kontrole wersji i dryf integralności">
    Przed live aktualizacją npm OpenClaw sprawdza wersję zainstalowanego pakietu względem metadanych rejestru npm. Jeśli zainstalowana wersja i zapisana tożsamość artefaktu już pasują do rozwiązanego celu, aktualizacja jest pomijana bez pobierania, ponownej instalacji ani przepisywania `openclaw.json`.

    Gdy istnieje zapisany hash integralności i hash pobranego artefaktu się zmienia, OpenClaw traktuje to jako dryf artefaktu npm. Interaktywne polecenie `openclaw plugins update` wypisuje oczekiwany i rzeczywisty hash oraz prosi o potwierdzenie przed kontynuowaniem. Nieinteraktywne helpery aktualizacji kończą się bezpieczną porażką, chyba że wywołujący dostarczy jawną politykę kontynuacji.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install przy aktualizacji">
    `--dangerously-force-unsafe-install` jest też dostępne w `plugins update` jako awaryjne obejście fałszywych alarmów wbudowanego skanowania niebezpiecznego kodu podczas aktualizacji pluginów. Nadal nie omija blokad polityki pluginu `before_install` ani blokowania po nieudanym skanowaniu i dotyczy tylko aktualizacji pluginów, nie aktualizacji hook-pack.
  </Accordion>
</AccordionGroup>

### Inspekcja

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspekcja pokazuje tożsamość, status ładowania, źródło, możliwości manifestu, flagi polityki, diagnostykę, metadane instalacji, możliwości pakietu oraz wykrytą obsługę serwerów MCP lub LSP, domyślnie bez importowania środowiska uruchomieniowego pluginu. Dodaj `--runtime`, aby załadować moduł pluginu i uwzględnić zarejestrowane hooki, narzędzia, polecenia, usługi, metody Gateway i trasy HTTP. Inspekcja środowiska uruchomieniowego zgłasza brakujące zależności pluginu bezpośrednio; instalacje i naprawy pozostają w `openclaw plugins install`, `openclaw plugins update` i `openclaw doctor --fix`.

Polecenia CLI należące do pluginu są instalowane jako główne grupy poleceń `openclaw`. Gdy `inspect --runtime` pokazuje polecenie pod `cliCommands`, uruchom je jako `openclaw <command> ...`; na przykład plugin, który rejestruje `demo-git`, można zweryfikować za pomocą `openclaw demo-git ping`.

Każdy plugin jest klasyfikowany według tego, co faktycznie rejestruje w środowisku uruchomieniowym:

- **plain-capability** — jeden typ możliwości (np. plugin tylko dla dostawcy)
- **hybrid-capability** — wiele typów możliwości (np. tekst + mowa + obrazy)
- **hook-only** — tylko hooki, bez możliwości ani powierzchni
- **non-capability** — narzędzia/polecenia/usługi, ale bez możliwości

Zobacz [Kształty pluginów](/pl/plugins/architecture#plugin-shapes), aby dowiedzieć się więcej o modelu możliwości.

<Note>
Flaga `--json` zwraca raport czytelny maszynowo, odpowiedni do skryptowania i audytu. `inspect --all` renderuje tabelę dla całej floty z kolumnami kształtu, rodzajów możliwości, powiadomień o zgodności, możliwości pakietów i podsumowania hooków. `info` jest aliasem dla `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` zgłasza błędy ładowania pluginów, diagnostykę manifestu/wykrywania i powiadomienia o zgodności. Gdy wszystko jest czyste, wypisuje `No plugin issues detected.`

Jeśli skonfigurowany plugin jest obecny na dysku, ale zablokowany przez kontrole bezpieczeństwa ścieżek loadera, walidacja konfiguracji zachowuje wpis pluginu i zgłasza go jako `present but blocked`. Napraw poprzedzającą diagnostykę zablokowanego pluginu, taką jak własność ścieżki albo uprawnienia do zapisu dla wszystkich, zamiast usuwać konfigurację `plugins.entries.<id>` albo `plugins.allow`.

W przypadku niepowodzeń kształtu modułu, takich jak brak eksportów `register`/`activate`, uruchom ponownie z `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, aby dołączyć kompaktowe podsumowanie kształtu eksportów w wyjściu diagnostycznym.

### Rejestr

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Lokalny rejestr pluginów to utrwalony zimny model odczytu OpenClaw dla tożsamości zainstalowanych pluginów, stanu włączenia, metadanych źródła i własności wkładów. Normalne uruchamianie, wyszukiwanie właściciela dostawcy, klasyfikacja konfiguracji kanału i inwentarz pluginów mogą go odczytywać bez importowania modułów środowiska uruchomieniowego pluginów.

Użyj `plugins registry`, aby sprawdzić, czy utrwalony rejestr istnieje, jest aktualny czy przestarzały. Użyj `--refresh`, aby odbudować go na podstawie utrwalonego indeksu pluginów, zasad konfiguracji oraz metadanych manifestu/pakietu. Jest to ścieżka naprawy, a nie ścieżka aktywacji w czasie działania.

`openclaw doctor --fix` naprawia również sąsiadujące z rejestrem rozbieżności zarządzanego npm: jeśli osierocony lub odzyskany pakiet `@openclaw/*` w zarządzanym katalogu głównym npm pluginów przesłania wbudowany plugin, doctor usuwa ten nieaktualny pakiet i odbudowuje rejestr, aby uruchamianie weryfikowało się względem wbudowanego manifestu.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` to przestarzały awaryjny przełącznik zgodności na wypadek błędów odczytu rejestru. Preferuj `plugins registry --refresh` albo `openclaw doctor --fix`; awaryjne rozwiązanie przez zmienną środowiskową służy wyłącznie do awaryjnego odzyskania uruchamiania podczas wdrażania migracji.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Lista Marketplace przyjmuje lokalną ścieżkę marketplace, ścieżkę `marketplace.json`, skrót GitHub w formie `owner/repo`, URL repozytorium GitHub albo URL git. `--json` wypisuje etykietę rozpoznanego źródła oraz sparsowany manifest marketplace i wpisy pluginów.

## Powiązane

- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Dokumentacja CLI](/pl/cli)
- [Pluginy społeczności](/pl/plugins/community)
