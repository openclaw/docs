---
read_when:
    - Chcesz instalować pluginy Gateway lub zgodne pakiety albo nimi zarządzać
    - Chcesz debugować błędy ładowania pluginów
sidebarTitle: Plugins
summary: Dokumentacja referencyjna CLI dla `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, deps, doctor)
title: Pluginy
x-i18n:
    generated_at: "2026-05-01T09:57:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc4b2b753b541dd143e9c2f7e8a2153711a18e15773c65f91756d2729ca3d6fb
    source_path: cli/plugins.md
    workflow: 16
---

Zarządzaj Pluginami Gateway, pakietami hooków i zgodnymi pakietami.

<CardGroup cols={2}>
  <Card title="System Pluginów" href="/pl/tools/plugin">
    Przewodnik dla użytkowników końcowych dotyczący instalowania, włączania i rozwiązywania problemów z Pluginami.
  </Card>
  <Card title="Pakiety Pluginów" href="/pl/plugins/bundles">
    Model zgodności pakietów.
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
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
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
Dołączone Pluginy są dostarczane z OpenClaw. Niektóre są domyślnie włączone (na przykład dołączeni dostawcy modeli, dołączeni dostawcy mowy oraz dołączony Plugin przeglądarki); inne wymagają `plugins enable`.

Natywne Pluginy OpenClaw muszą dostarczać `openclaw.plugin.json` z wbudowanym schematem JSON Schema (`configSchema`, nawet jeśli jest pusty). Zgodne pakiety używają zamiast tego własnych manifestów pakietów.

`plugins list` pokazuje `Format: openclaw` albo `Format: bundle`. Szczegółowe wyjście list/info pokazuje także podtyp pakietu (`codex`, `claude` albo `cursor`) oraz wykryte możliwości pakietu.
</Note>

### Instalacja

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Same nazwy pakietów są sprawdzane najpierw w ClawHub, a potem w npm. Traktuj instalacje Pluginów jak uruchamianie kodu. Preferuj przypięte wersje.
</Warning>

<Note>
ClawHub jest główną powierzchnią dystrybucji i odkrywania dla większości Pluginów. Npm
pozostaje obsługiwaną ścieżką awaryjną i bezpośredniej instalacji. Podczas migracji do
ClawHub OpenClaw nadal dostarcza niektóre pakiety Pluginów należące do OpenClaw `@openclaw/*`
w npm; te wersje pakietów mogą pozostawać w tyle za dołączonym źródłem między cyklami wydań
Pluginów. Jeśli npm zgłasza pakiet Pluginu należący do OpenClaw jako przestarzały, ta
opublikowana wersja jest starym zewnętrznym artefaktem; użyj Pluginu dołączonego do
aktualnego OpenClaw albo lokalnego checkoutu, dopóki nie zostanie opublikowany nowszy pakiet npm.
</Note>

<AccordionGroup>
  <Accordion title="Dołączenia konfiguracji i odzyskiwanie po nieprawidłowej konfiguracji">
    Jeśli sekcja `plugins` jest oparta na jednoplikowym `$include`, `plugins install/update/enable/disable/uninstall` zapisują do tego dołączonego pliku i pozostawiają `openclaw.json` bez zmian. Dołączenia główne, tablice dołączeń i dołączenia z sąsiednimi nadpisaniami kończą się bezpiecznym niepowodzeniem zamiast spłaszczania. Obsługiwane kształty opisuje [Dołączanie konfiguracji](/pl/gateway/configuration).

    Jeśli konfiguracja jest nieprawidłowa podczas instalacji, `plugins install` zwykle kończy się bezpiecznym niepowodzeniem i informuje, aby najpierw uruchomić `openclaw doctor --fix`. Podczas uruchamiania Gateway nieprawidłowa konfiguracja jednego Pluginu jest izolowana do tego Pluginu, dzięki czemu inne kanały i Pluginy mogą nadal działać; `openclaw doctor --fix` może poddać nieprawidłowy wpis Pluginu kwarantannie. Jedynym udokumentowanym wyjątkiem w czasie instalacji jest wąska ścieżka odzyskiwania dołączonych Pluginów dla Pluginów, które jawnie włączają `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force oraz ponowna instalacja kontra aktualizacja">
    `--force` ponownie używa istniejącego celu instalacji i nadpisuje już zainstalowany Plugin albo pakiet hooków w miejscu. Używaj tej opcji, gdy celowo ponownie instalujesz ten sam identyfikator z nowej ścieżki lokalnej, archiwum, pakietu ClawHub albo artefaktu npm. Do rutynowych aktualizacji już śledzonego Pluginu npm preferuj `openclaw plugins update <id-or-npm-spec>`.

    Jeśli uruchomisz `plugins install` dla identyfikatora Pluginu, który jest już zainstalowany, OpenClaw zatrzyma się i wskaże `plugins update <id-or-npm-spec>` dla zwykłej aktualizacji albo `plugins install <package> --force`, gdy rzeczywiście chcesz nadpisać bieżącą instalację z innego źródła.

  </Accordion>
  <Accordion title="Zakres --pin">
    `--pin` dotyczy tylko instalacji npm. Nie jest obsługiwane z `--marketplace`, ponieważ instalacje z marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` to opcja awaryjna dla fałszywych alarmów we wbudowanym skanerze niebezpiecznego kodu. Pozwala kontynuować instalację nawet wtedy, gdy wbudowany skaner zgłasza ustalenia `critical`, ale **nie** omija blokad polityki hooka Pluginu `before_install` i **nie** omija niepowodzeń skanowania.

    Ta flaga CLI dotyczy przepływów instalacji/aktualizacji Pluginów. Instalacje zależności Skills obsługiwane przez Gateway używają odpowiadającego nadpisania żądania `dangerouslyForceUnsafeInstall`, natomiast `openclaw skills install` pozostaje osobnym przepływem pobierania/instalacji Skills z ClawHub.

    Jeśli Plugin opublikowany przez Ciebie w ClawHub jest blokowany przez skan rejestru, użyj kroków dla wydawcy w [ClawHub](/pl/tools/clawhub).

  </Accordion>
  <Accordion title="Pakiety hooków i specyfikacje npm">
    `plugins install` jest także powierzchnią instalacji dla pakietów hooków, które udostępniają `openclaw.hooks` w `package.json`. Używaj `openclaw hooks` do filtrowanej widoczności hooków i włączania poszczególnych hooków, nie do instalacji pakietów.

    Specyfikacje npm są **wyłącznie rejestrowe** (nazwa pakietu + opcjonalna **dokładna wersja** albo **dist-tag**). Specyfikacje Git/URL/file i zakresy semver są odrzucane. Instalacje zależności działają lokalnie w projekcie z `--ignore-scripts` ze względów bezpieczeństwa, nawet jeśli Twoja powłoka ma globalne ustawienia instalacji npm.

    Użyj `npm:<package>`, gdy chcesz pominąć wyszukiwanie w ClawHub i zainstalować bezpośrednio z npm. Same specyfikacje pakietów nadal preferują ClawHub i wracają do npm tylko wtedy, gdy ClawHub nie ma danego pakietu albo wersji.

    Same specyfikacje i `@latest` pozostają na stabilnej ścieżce. Jeśli npm rozwiąże którąkolwiek z nich do wersji przedpremierowej, OpenClaw zatrzyma się i poprosi o jawne wyrażenie zgody za pomocą tagu przedpremierowego, takiego jak `@beta`/`@rc`, albo dokładnej wersji przedpremierowej, takiej jak `@1.2.3-beta.4`.

    Jeśli sama specyfikacja instalacji pasuje do identyfikatora dołączonego Pluginu (na przykład `diffs`), OpenClaw zainstaluje bezpośrednio dołączony Plugin. Aby zainstalować pakiet npm o tej samej nazwie, użyj jawnej specyfikacji z zakresem (na przykład `@scope/diffs`).

  </Accordion>
  <Accordion title="Archiwa">
    Obsługiwane archiwa: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archiwa natywnych Pluginów OpenClaw muszą zawierać prawidłowy `openclaw.plugin.json` w wyodrębnionym katalogu głównym Pluginu; archiwa, które zawierają tylko `package.json`, są odrzucane, zanim OpenClaw zapisze rekordy instalacji.

    Obsługiwane są także instalacje z marketplace Claude.

  </Accordion>
</AccordionGroup>

Instalacje ClawHub używają jawnego lokalizatora `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw preferuje teraz także ClawHub dla samych, bezpiecznych dla npm specyfikacji Pluginów. Wraca do npm tylko wtedy, gdy ClawHub nie ma danego pakietu albo wersji:

```bash
openclaw plugins install openclaw-codex-app-server
```

Użyj `npm:`, aby wymusić rozwiązywanie wyłącznie przez npm, na przykład gdy ClawHub jest nieosiągalny albo wiesz, że pakiet istnieje tylko w npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw pobiera archiwum pakietu z ClawHub, sprawdza deklarowane API Pluginu / minimalną zgodność z Gateway, a następnie instaluje je zwykłą ścieżką archiwum. Zarejestrowane instalacje zachowują metadane źródła ClawHub na potrzeby późniejszych aktualizacji.
Instalacje ClawHub bez wersji zachowują zarejestrowaną specyfikację bez wersji, aby `openclaw plugins update` mógł śledzić nowsze wydania ClawHub; jawne selektory wersji lub tagów, takie jak `clawhub:pkg@1.2.3` i `clawhub:pkg@beta`, pozostają przypięte do tego selektora.

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
  <Tab title="Źródła marketplace">
    - nazwa znanego marketplace Claude z `~/.claude/plugins/known_marketplaces.json`
    - lokalny katalog główny marketplace albo ścieżka `marketplace.json`
    - skrót repozytorium GitHub, taki jak `owner/repo`
    - URL repozytorium GitHub, taki jak `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Reguły zdalnego marketplace">
    W przypadku zdalnych marketplace ładowanych z GitHub lub git wpisy Pluginów muszą pozostawać wewnątrz sklonowanego repozytorium marketplace. OpenClaw akceptuje źródła ze ścieżkami względnymi z tego repozytorium i odrzuca HTTP(S), ścieżki bezwzględne, git, GitHub oraz inne źródła Pluginów niebędące ścieżkami ze zdalnych manifestów.
  </Tab>
</Tabs>

Dla ścieżek lokalnych i archiwów OpenClaw automatycznie wykrywa:

- natywne Pluginy OpenClaw (`openclaw.plugin.json`)
- pakiety zgodne z Codex (`.codex-plugin/plugin.json`)
- pakiety zgodne z Claude (`.claude-plugin/plugin.json` albo domyślny układ komponentów Claude)
- pakiety zgodne z Cursor (`.cursor-plugin/plugin.json`)

<Note>
Zgodne pakiety instalują się w zwykłym katalogu głównym Pluginów i uczestniczą w tym samym przepływie list/info/enable/disable. Obecnie obsługiwane są Skills pakietów, command-skills Claude, domyślne ustawienia Claude `settings.json`, domyślne ustawienia Claude `.lsp.json` / deklarowane w manifeście `lspServers`, command-skills Cursor oraz zgodne katalogi hooków Codex; inne wykryte możliwości pakietów są pokazywane w diagnostyce/info, ale nie są jeszcze podłączone do wykonywania w runtime.
</Note>

### Lista

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Pokaż tylko włączone Pluginy.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Przełącz z widoku tabeli na szczegółowe wiersze dla każdego Pluginu z metadanymi source/origin/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Inwentarz czytelny maszynowo oraz diagnostyka rejestru.
</ParamField>

<Note>
`plugins list` najpierw odczytuje utrwalony lokalny rejestr Plugin, z rezerwowym wariantem wyprowadzanym tylko z manifestu, gdy rejestru brakuje lub jest nieprawidłowy. Przydaje się do sprawdzania, czy Plugin jest zainstalowany, włączony i widoczny dla planowania zimnego startu, ale nie jest aktywną sondą środowiska uruchomieniowego już działającego procesu Gateway. Po zmianie kodu Plugin, włączenia, zasad hooków lub `plugins.load.paths` uruchom ponownie Gateway obsługujący kanał, zanim oczekujesz uruchomienia nowego kodu `register(api)` lub hooków. W przypadku wdrożeń zdalnych/kontenerowych sprawdź, czy uruchamiasz ponownie właściwy proces potomny `openclaw gateway run`, a nie tylko proces opakowujący.
</Note>

Podczas pracy nad dołączonym Plugin wewnątrz spakowanego obrazu Docker podmontuj katalog
źródłowy Plugin na odpowiadającą mu spakowaną ścieżkę źródłową, na przykład
`/app/extensions/synology-chat`. OpenClaw wykryje tę podmontowaną nakładkę źródłową
przed `/app/dist/extensions/synology-chat`; zwykły skopiowany katalog źródłowy
pozostaje nieaktywny, więc standardowe spakowane instalacje nadal używają skompilowanego dist.

Do debugowania hooków środowiska uruchomieniowego:

- `openclaw plugins inspect <id> --runtime --json` pokazuje zarejestrowane hooki i diagnostykę z przebiegu inspekcji z załadowanym modułem. Inspekcja środowiska uruchomieniowego nigdy nie pobiera brakujących dołączonych zależności środowiska uruchomieniowego; użyj `openclaw plugins deps --repair`, gdy potrzebna jest naprawa.
- `openclaw gateway status --deep --require-rpc` potwierdza osiągalny Gateway, wskazówki dotyczące usługi/procesu, ścieżkę konfiguracji i kondycję RPC.
- Niedostarczane w zestawie hooki konwersacji (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) wymagają `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Użyj `--link`, aby uniknąć kopiowania lokalnego katalogu (dodaje do `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` nie jest obsługiwane z `--link`, ponieważ instalacje linkowane ponownie używają ścieżki źródłowej zamiast kopiować na zarządzany cel instalacji.

Użyj `--pin` przy instalacjach npm, aby zapisać rozwiązaną dokładną specyfikację (`name@version`) w zarządzanym indeksie Plugin, zachowując domyślne zachowanie bez przypięcia.
</Note>

### Indeks Plugin

Metadane instalacji Plugin są stanem zarządzanym maszynowo, a nie konfiguracją użytkownika. Instalacje i aktualizacje zapisują je do `plugins/installs.json` w aktywnym katalogu stanu OpenClaw. Jego najwyższego poziomu mapa `installRecords` jest trwałym źródłem metadanych instalacji, w tym rekordów dla uszkodzonych lub brakujących manifestów Plugin. Tablica `plugins` jest wyprowadzoną z manifestów pamięcią podręczną zimnego rejestru. Plik zawiera ostrzeżenie, aby go nie edytować, i jest używany przez `openclaw plugins update`, odinstalowywanie, diagnostykę oraz zimny rejestr Plugin.

Gdy OpenClaw zobaczy dostarczone starsze rekordy `plugins.installs` w konfiguracji, przenosi je do indeksu Plugin i usuwa klucz konfiguracji; jeśli którykolwiek zapis się nie powiedzie, rekordy konfiguracji zostają zachowane, aby metadane instalacji nie zostały utracone.

### Zależności środowiska uruchomieniowego

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` sprawdza etap spakowanych zależności środowiska uruchomieniowego dla należących do OpenClaw dołączonych Plugin wybranych przez konfigurację Plugin, włączone/skonfigurowane kanały, skonfigurowanych dostawców modeli lub domyślne wartości dołączonych manifestów. Nie jest to ścieżka instalacji/aktualizacji dla zewnętrznych Plugin npm ani ClawHub.

Użyj `--repair`, gdy spakowana instalacja zgłasza brakujące dołączone zależności środowiska uruchomieniowego podczas startu Gateway lub `plugins doctor`. Naprawa instaluje tylko brakujące zależności włączonych dołączonych Plugin z wyłączonymi skryptami cyklu życia. Użyj `--prune`, aby usunąć nieaktualne, nieznane zewnętrzne katalogi główne zależności środowiska uruchomieniowego pozostawione przez starsze układy pakietów.

Pełny plan, etapowanie i cykl życia naprawy opisuje [Rozwiązywanie zależności Plugin](/pl/plugins/dependency-resolution).

### Odinstalowanie

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` usuwa rekordy Plugin z `plugins.entries`, utrwalonego indeksu Plugin, wpisów listy dozwolonych/zablokowanych Plugin oraz linkowanych wpisów `plugins.load.paths`, gdy ma to zastosowanie. O ile nie ustawiono `--keep-files`, odinstalowanie usuwa także śledzony zarządzany katalog instalacji, gdy znajduje się on w katalogu głównym rozszerzeń Plugin OpenClaw. W przypadku Plugin aktywnej pamięci slot pamięci resetuje się do `memory-core`.

<Note>
`--keep-config` jest obsługiwane jako przestarzały alias dla `--keep-files`.
</Note>

### Aktualizacja

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Aktualizacje dotyczą śledzonych instalacji Plugin w zarządzanym indeksie Plugin oraz śledzonych instalacji pakietów hooków w `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Rozwiązywanie identyfikatora Plugin względem specyfikacji npm">
    Gdy podasz identyfikator Plugin, OpenClaw ponownie użyje zapisanej specyfikacji instalacji dla tego Plugin. Oznacza to, że wcześniej zapisane tagi dist, takie jak `@beta`, oraz dokładnie przypięte wersje będą nadal używane przy późniejszych uruchomieniach `update <id>`.

    W przypadku instalacji npm możesz także podać jawną specyfikację pakietu npm z tagiem dist lub dokładną wersją. OpenClaw rozwiązuje tę nazwę pakietu z powrotem do śledzonego rekordu Plugin, aktualizuje ten zainstalowany Plugin i zapisuje nową specyfikację npm dla przyszłych aktualizacji opartych na identyfikatorze.

    Podanie nazwy pakietu npm bez wersji lub tagu także rozwiązuje się z powrotem do śledzonego rekordu Plugin. Użyj tego, gdy Plugin był przypięty do dokładnej wersji i chcesz przenieść go z powrotem na domyślną linię wydań rejestru.

  </Accordion>
  <Accordion title="Kontrole wersji i dryf integralności">
    Przed aktywną aktualizacją npm OpenClaw sprawdza zainstalowaną wersję pakietu względem metadanych rejestru npm. Jeśli zainstalowana wersja i zapisana tożsamość artefaktu już odpowiadają rozwiązanemu celowi, aktualizacja jest pomijana bez pobierania, ponownej instalacji ani przepisywania `openclaw.json`.

    Gdy istnieje zapisany hash integralności, a hash pobranego artefaktu się zmieni, OpenClaw traktuje to jako dryf artefaktu npm. Interaktywne polecenie `openclaw plugins update` wypisuje oczekiwane i rzeczywiste hashe oraz prosi o potwierdzenie przed kontynuacją. Nieinteraktywne pomocniki aktualizacji kończą się odmową, chyba że wywołujący dostarczy jawną politykę kontynuacji.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install przy aktualizacji">
    `--dangerously-force-unsafe-install` jest także dostępne w `plugins update` jako awaryjne obejście dla fałszywych alarmów wbudowanego skanowania niebezpiecznego kodu podczas aktualizacji Plugin. Nadal nie omija blokad polityki `before_install` Plugin ani blokowania po niepowodzeniu skanowania i dotyczy tylko aktualizacji Plugin, nie aktualizacji pakietów hooków.
  </Accordion>
</AccordionGroup>

### Inspekcja

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspekcja pokazuje tożsamość, stan ładowania, źródło, możliwości manifestu, flagi polityk, diagnostykę, metadane instalacji, możliwości pakietu oraz wykrytą obsługę serwerów MCP lub LSP bez domyślnego importowania środowiska uruchomieniowego Plugin. Dodaj `--runtime`, aby załadować moduł Plugin i uwzględnić zarejestrowane hooki, narzędzia, polecenia, usługi, metody Gateway oraz trasy HTTP. Inspekcja środowiska uruchomieniowego kończy się niepowodzeniem ze wskazówką naprawy, gdy brakuje dołączonych zależności środowiska uruchomieniowego; użyj `openclaw plugins deps --repair`, aby jawnie je naprawić.

Każdy Plugin jest klasyfikowany według tego, co faktycznie rejestruje w środowisku uruchomieniowym:

- **plain-capability** — jeden typ możliwości (np. Plugin tylko dla dostawcy)
- **hybrid-capability** — wiele typów możliwości (np. tekst + mowa + obrazy)
- **hook-only** — tylko hooki, bez możliwości ani powierzchni
- **non-capability** — narzędzia/polecenia/usługi, ale bez możliwości

Więcej informacji o modelu możliwości zawiera [Kształty Plugin](/pl/plugins/architecture#plugin-shapes).

<Note>
Flaga `--json` wypisuje raport czytelny maszynowo, odpowiedni do skryptów i audytu. `inspect --all` renderuje tabelę dla całej floty z kolumnami kształtu, rodzajów możliwości, powiadomień o zgodności, możliwości pakietu i podsumowania hooków. `info` jest aliasem dla `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` zgłasza błędy ładowania Plugin, diagnostykę manifestu/wykrywania oraz powiadomienia o zgodności. Gdy wszystko jest poprawne, wypisuje `No plugin issues detected.`

W przypadku awarii kształtu modułu, takich jak brak eksportów `register`/`activate`, uruchom ponownie z `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, aby uwzględnić zwarte podsumowanie kształtu eksportów w wyjściu diagnostycznym.

### Rejestr

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Lokalny rejestr Plugin to utrwalony zimny model odczytu OpenClaw dla tożsamości zainstalowanych Plugin, włączenia, metadanych źródła i własności wkładów. Standardowy start, wyszukiwanie właściciela dostawcy, klasyfikacja konfiguracji kanału i inwentarz Plugin mogą go odczytywać bez importowania modułów środowiska uruchomieniowego Plugin.

Użyj `plugins registry`, aby sprawdzić, czy utrwalony rejestr jest obecny, aktualny lub nieaktualny. Użyj `--refresh`, aby odbudować go z utrwalonego indeksu Plugin, polityki konfiguracji i metadanych manifestu/pakietu. To ścieżka naprawy, a nie ścieżka aktywacji środowiska uruchomieniowego.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` to przestarzały awaryjny przełącznik zgodności dla błędów odczytu rejestru. Preferuj `plugins registry --refresh` lub `openclaw doctor --fix`; rezerwowe zachowanie env służy tylko do awaryjnego odzyskania startu podczas wdrażania migracji.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Lista Marketplace przyjmuje lokalną ścieżkę marketplace, ścieżkę `marketplace.json`, skrót GitHub taki jak `owner/repo`, URL repo GitHub albo URL git. `--json` wypisuje rozwiązaną etykietę źródła oraz sparsowany manifest marketplace i wpisy Plugin.

## Powiązane

- [Budowanie Plugin](/pl/plugins/building-plugins)
- [Dokumentacja CLI](/pl/cli)
- [Społecznościowe Plugin](/pl/plugins/community)
