---
read_when:
    - Chcesz zainstalować lub zarządzać Plugin Gateway albo zgodnymi pakietami
    - Chcesz debugować błędy ładowania Pluginów
sidebarTitle: Plugins
summary: Dokumentacja CLI dla `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Pluginy
x-i18n:
    generated_at: "2026-04-26T11:26:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52b02c96859e1da1d7028bce375045ef9472d1f2e01086f1318e4f38e8d5bb7d
    source_path: cli/plugins.md
    workflow: 15
---

Zarządzaj Pluginami Gateway, pakietami hooków i zgodnymi pakietami.

<CardGroup cols={2}>
  <Card title="System Pluginów" href="/pl/tools/plugin">
    Przewodnik dla użytkownika końcowego dotyczący instalowania, włączania i rozwiązywania problemów z Pluginami.
  </Card>
  <Card title="Pakiety Pluginów" href="/pl/plugins/bundles">
    Model zgodności pakietów.
  </Card>
  <Card title="Manifest Plugin" href="/pl/plugins/manifest">
    Pola manifestu i schemat konfiguracji.
  </Card>
  <Card title="Bezpieczeństwo" href="/pl/gateway/security">
    Utwardzanie bezpieczeństwa dla instalacji Pluginów.
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

<Note>
Dołączone Pluginy są dostarczane razem z OpenClaw. Niektóre są domyślnie włączone (na przykład dołączeni providerzy modeli, dołączeni providerzy mowy i dołączony Plugin przeglądarki); inne wymagają `plugins enable`.

Natywne Pluginy OpenClaw muszą dostarczać `openclaw.plugin.json` z wbudowanym schematem JSON (`configSchema`, nawet jeśli pustym). Zgodne pakiety używają zamiast tego własnych manifestów pakietów.

`plugins list` pokazuje `Format: openclaw` lub `Format: bundle`. Szczegółowe dane wyjściowe list/info pokazują także podtyp pakietu (`codex`, `claude` lub `cursor`) oraz wykryte możliwości pakietu.
</Note>

### Instalacja

```bash
openclaw plugins install <package>                      # najpierw ClawHub, potem npm
openclaw plugins install clawhub:<package>              # tylko ClawHub
openclaw plugins install <package> --force              # nadpisz istniejącą instalację
openclaw plugins install <package> --pin                # przypnij wersję
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # ścieżka lokalna
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (jawnie)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Surowe nazwy pakietów są najpierw sprawdzane względem ClawHub, a potem npm. Traktuj instalacje Pluginów jak uruchamianie kodu. Preferuj przypięte wersje.
</Warning>

<AccordionGroup>
  <Accordion title="Include konfiguracji i odzyskiwanie po nieprawidłowej konfiguracji">
    Jeśli sekcja `plugins` jest oparta na jednopl ikowym `$include`, `plugins install/update/enable/disable/uninstall` zapisują do tego dołączonego pliku i pozostawiają `openclaw.json` bez zmian. Include na poziomie głównym, tablice include oraz include z sąsiednimi nadpisaniami kończą działanie w trybie fail-closed zamiast spłaszczać konfigurację. Zobacz [Include konfiguracji](/pl/gateway/configuration), aby poznać obsługiwane kształty.

    Jeśli konfiguracja jest nieprawidłowa, `plugins install` zwykle kończy działanie w trybie fail-closed i informuje, aby najpierw uruchomić `openclaw doctor --fix`. Jedynym udokumentowanym wyjątkiem jest wąska ścieżka odzyskiwania dla dołączonych Pluginów, dla Pluginów, które jawnie włączają `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force oraz reinstalacja vs update">
    `--force` ponownie używa istniejącego celu instalacji i nadpisuje już zainstalowany Plugin lub pakiet hooków na miejscu. Użyj go, gdy celowo reinstalujesz ten sam identyfikator z nowej lokalnej ścieżki, archiwum, pakietu ClawHub lub artefaktu npm. W przypadku rutynowych aktualizacji już śledzonego Plugin npm preferuj `openclaw plugins update <id-or-npm-spec>`.

    Jeśli uruchomisz `plugins install` dla identyfikatora Plugin, który jest już zainstalowany, OpenClaw zatrzyma się i wskaże `plugins update <id-or-npm-spec>` dla zwykłej aktualizacji albo `plugins install <package> --force`, gdy naprawdę chcesz nadpisać bieżącą instalację z innego źródła.

  </Accordion>
  <Accordion title="Zakres --pin">
    `--pin` dotyczy tylko instalacji npm. Nie jest obsługiwane z `--marketplace`, ponieważ instalacje z marketplace zapisują metadane źródła marketplace zamiast specyfikacji npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` to opcja awaryjna dla fałszywych alarmów w wbudowanym skanerze niebezpiecznego kodu. Umożliwia kontynuowanie instalacji nawet wtedy, gdy wbudowany skaner zgłasza ustalenia `critical`, ale **nie** omija blokad zasad hooków Plugin `before_install` i **nie** omija niepowodzeń skanowania.

    Ta flaga CLI dotyczy przepływów instalacji/aktualizacji Pluginów. Instalacje zależności Skills wspierane przez Gateway używają odpowiadającego nadpisania żądania `dangerouslyForceUnsafeInstall`, podczas gdy `openclaw skills install` pozostaje osobnym przepływem pobierania/instalacji Skills z ClawHub.

  </Accordion>
  <Accordion title="Pakiety hooków i specyfikacje npm">
    `plugins install` jest także powierzchnią instalacji dla pakietów hooków, które udostępniają `openclaw.hooks` w `package.json`. Użyj `openclaw hooks` do filtrowanego widoku hooków i włączania poszczególnych hooków, a nie do instalacji pakietu.

    Specyfikacje npm są **tylko rejestrowe** (nazwa pakietu + opcjonalnie **dokładna wersja** lub **dist-tag**). Specyfikacje git/URL/file i zakresy semver są odrzucane. Instalacje zależności są dla bezpieczeństwa uruchamiane lokalnie dla projektu z `--ignore-scripts`, nawet gdy Twoja powłoka ma globalne ustawienia instalacji npm.

    Surowe specyfikacje i `@latest` pozostają na stabilnym torze. Jeśli npm rozwiąże którykolwiek z nich do wersji prerelease, OpenClaw zatrzyma się i poprosi o jawne opt-in z użyciem tagu prerelease, takiego jak `@beta`/`@rc`, albo dokładnej wersji prerelease, takiej jak `@1.2.3-beta.4`.

    Jeśli surowa specyfikacja instalacji pasuje do identyfikatora dołączonego Plugin (na przykład `diffs`), OpenClaw instaluje bezpośrednio dołączony Plugin. Aby zainstalować pakiet npm o tej samej nazwie, użyj jawnej specyfikacji ze scopem (na przykład `@scope/diffs`).

  </Accordion>
  <Accordion title="Archiwa">
    Obsługiwane archiwa: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archiwa natywnych Pluginów OpenClaw muszą zawierać prawidłowy `openclaw.plugin.json` w wyodrębnionym katalogu głównym Plugin; archiwa, które zawierają tylko `package.json`, są odrzucane, zanim OpenClaw zapisze rekordy instalacji.

    Obsługiwane są również instalacje z marketplace Claude.

  </Accordion>
</AccordionGroup>

Instalacje ClawHub używają jawnego lokalizatora `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw preferuje teraz także ClawHub dla surowych specyfikacji Plugin bezpiecznych dla npm. Przełącza się na npm tylko wtedy, gdy ClawHub nie ma danego pakietu lub wersji:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw pobiera archiwum pakietu z ClawHub, sprawdza deklarowaną zgodność z API Plugin / minimalną zgodność z Gateway, a następnie instaluje je zwykłą ścieżką archiwum. Zarejestrowane instalacje zachowują metadane źródła ClawHub na potrzeby późniejszych aktualizacji.

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
    - skrócona nazwa repozytorium GitHub, taka jak `owner/repo`
    - URL repozytorium GitHub, taki jak `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Reguły zdalnego marketplace">
    W przypadku zdalnych marketplace ładowanych z GitHub lub git wpisy Plugin muszą pozostawać wewnątrz sklonowanego repozytorium marketplace. OpenClaw akceptuje źródła ścieżek względnych z tego repozytorium i odrzuca HTTP(S), ścieżki bezwzględne, git, GitHub i inne źródła Plugin niebędące ścieżkami ze zdalnych manifestów.
  </Tab>
</Tabs>

Dla lokalnych ścieżek i archiwów OpenClaw automatycznie wykrywa:

- natywne Pluginy OpenClaw (`openclaw.plugin.json`)
- pakiety zgodne z Codex (`.codex-plugin/plugin.json`)
- pakiety zgodne z Claude (`.claude-plugin/plugin.json` lub domyślny układ komponentów Claude)
- pakiety zgodne z Cursor (`.cursor-plugin/plugin.json`)

<Note>
Zgodne pakiety są instalowane do zwykłego katalogu głównego Plugin i uczestniczą w tym samym przepływie list/info/enable/disable. Obecnie obsługiwane są Skills pakietów, command-skills Claude, domyślne ustawienia Claude `settings.json`, domyślne wartości Claude `.lsp.json` / deklarowane w manifeście `lspServers`, command-skills Cursor oraz zgodne katalogi hooków Codex; inne wykryte możliwości pakietów są pokazywane w diagnostyce/info, ale nie są jeszcze podłączone do wykonania w czasie działania.
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
  Przełącz z widoku tabeli na szczegółowe wiersze dla każdego Plugin z metadanymi źródła/pochodzenia/wersji/aktywacji.
</ParamField>
<ParamField path="--json" type="boolean">
  Inwentarz w formacie czytelnym maszynowo oraz diagnostyka rejestru.
</ParamField>

<Note>
`plugins list` najpierw odczytuje utrwalony lokalny rejestr Pluginów, z zapasowym pochodnym trybem tylko-manifestowym, gdy rejestr jest nieobecny lub nieprawidłowy. Jest to przydatne do sprawdzenia, czy Plugin jest zainstalowany, włączony i widoczny dla planowania zimnego startu, ale nie jest to aktywny test środowiska uruchomieniowego dla już działającego procesu Gateway. Po zmianie kodu Plugin, stanu włączenia, zasad hooków lub `plugins.load.paths`, uruchom ponownie Gateway obsługujący dany kanał, zanim zaczniesz oczekiwać działania nowego kodu `register(api)` lub hooków. W przypadku wdrożeń zdalnych/kontenerowych upewnij się, że restartujesz rzeczywisty proces potomny `openclaw gateway run`, a nie tylko proces opakowujący.
</Note>

W przypadku pracy nad dołączonym Plugin wewnątrz spakowanego obrazu Docker zamontuj
katalog źródłowy Plugin jako bind-mount na odpowiadającej spakowanej ścieżce źródłowej,
takiej jak `/app/extensions/synology-chat`. OpenClaw wykryje to zamontowane
nakładkowe źródło przed `/app/dist/extensions/synology-chat`; zwykły skopiowany
katalog źródłowy pozostaje nieaktywny, więc zwykłe spakowane instalacje nadal używają skompilowanego dist.

Do debugowania hooków środowiska uruchomieniowego:

- `openclaw plugins inspect <id> --json` pokazuje zarejestrowane hooki i diagnostykę z przebiegu inspekcji z załadowanym modułem.
- `openclaw gateway status --deep --require-rpc` potwierdza osiągalny Gateway, wskazówki dotyczące usługi/procesu, ścieżkę konfiguracji i stan RPC.
- Niedołączone hooki rozmowy (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) wymagają `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Użyj `--link`, aby uniknąć kopiowania lokalnego katalogu (dodaje do `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` nie jest obsługiwane z `--link`, ponieważ instalacje linkowane ponownie używają ścieżki źródłowej zamiast kopiować do zarządzanego celu instalacji.

Użyj `--pin` w instalacjach npm, aby zapisać rozwiązaną dokładną specyfikację (`name@version`) w zarządzanym indeksie Pluginów, zachowując domyślne nieprzypięte zachowanie.
</Note>

### Indeks Pluginów

Metadane instalacji Pluginów to stan zarządzany maszynowo, a nie konfiguracja użytkownika. Instalacje i aktualizacje zapisują je do `plugins/installs.json` w aktywnym katalogu stanu OpenClaw. Mapa najwyższego poziomu `installRecords` jest trwałym źródłem metadanych instalacji, w tym rekordów dla uszkodzonych lub brakujących manifestów Pluginów. Tablica `plugins` to pochodna od manifestu pamięć podręczna zimnego rejestru. Plik zawiera ostrzeżenie, aby go nie edytować, i jest używany przez `openclaw plugins update`, uninstall, diagnostykę oraz zimny rejestr Pluginów.

Gdy OpenClaw wykryje dostarczone starsze rekordy `plugins.installs` w konfiguracji, przenosi je do indeksu Pluginów i usuwa klucz konfiguracji; jeśli którykolwiek zapis się nie powiedzie, rekordy konfiguracji są zachowywane, aby nie utracić metadanych instalacji.

### Odinstalowanie

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` usuwa rekordy Pluginów z `plugins.entries`, utrwalonego indeksu Pluginów, wpisy list dozwolonych/zabronionych Pluginów oraz, gdy ma to zastosowanie, linkowane wpisy `plugins.load.paths`. O ile nie ustawiono `--keep-files`, uninstall usuwa także śledzony zarządzany katalog instalacji, gdy znajduje się on wewnątrz katalogu głównego rozszerzeń Pluginów OpenClaw. Dla Pluginów Active Memory slot pamięci resetuje się do `memory-core`.

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

Aktualizacje dotyczą śledzonych instalacji Pluginów w zarządzanym indeksie Pluginów oraz śledzonych instalacji pakietów hooków w `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Rozwiązywanie identyfikatora Plugin vs specyfikacji npm">
    Gdy przekazujesz identyfikator Plugin, OpenClaw ponownie używa zapisanej specyfikacji instalacji dla tego Plugin. Oznacza to, że wcześniej zapisane dist-tagi, takie jak `@beta`, oraz dokładnie przypięte wersje są nadal używane w późniejszych uruchomieniach `update <id>`.

    W przypadku instalacji npm możesz także przekazać jawną specyfikację pakietu npm z dist-tagiem lub dokładną wersją. OpenClaw rozwiązuje tę nazwę pakietu z powrotem do śledzonego rekordu Plugin, aktualizuje ten zainstalowany Plugin i zapisuje nową specyfikację npm do wykorzystania przy przyszłych aktualizacjach opartych na identyfikatorze.

    Przekazanie nazwy pakietu npm bez wersji ani tagu także rozwiązuje się z powrotem do śledzonego rekordu Plugin. Użyj tego, gdy Plugin był przypięty do dokładnej wersji i chcesz przywrócić go do domyślnej linii wydań rejestru.

  </Accordion>
  <Accordion title="Kontrole wersji i dryf integralności">
    Przed aktywną aktualizacją npm OpenClaw sprawdza zainstalowaną wersję pakietu względem metadanych rejestru npm. Jeśli zainstalowana wersja i zapisana tożsamość artefaktu już odpowiadają rozwiązanemu celowi, aktualizacja jest pomijana bez pobierania, reinstalacji ani przepisywania `openclaw.json`.

    Gdy istnieje zapisany hash integralności, a hash pobranego artefaktu się zmienia, OpenClaw traktuje to jako dryf artefaktu npm. Interaktywne polecenie `openclaw plugins update` wypisuje oczekiwane i rzeczywiste hashe i prosi o potwierdzenie przed kontynuacją. Nieinteraktywne pomocniki aktualizacji kończą działanie w trybie fail-closed, chyba że wywołujący dostarczy jawną politykę kontynuacji.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install przy update">
    `--dangerously-force-unsafe-install` jest dostępne również w `plugins update` jako awaryjne nadpisanie dla fałszywych alarmów wbudowanego skanowania niebezpiecznego kodu podczas aktualizacji Pluginów. Nadal nie omija blokad zasad `before_install` Plugin ani blokowania przy niepowodzeniu skanowania i dotyczy tylko aktualizacji Pluginów, a nie aktualizacji pakietów hooków.
  </Accordion>
</AccordionGroup>

### Inspekcja

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Dogłębna introspekcja pojedynczego Plugin. Pokazuje tożsamość, status ładowania, źródło, zarejestrowane możliwości, hooki, narzędzia, polecenia, usługi, metody Gateway, trasy HTTP, flagi zasad, diagnostykę, metadane instalacji, możliwości pakietów oraz wszelką wykrytą obsługę serwerów MCP lub LSP.

Każdy Plugin jest klasyfikowany według tego, co faktycznie rejestruje w czasie działania:

- **plain-capability** — jeden typ możliwości (np. Plugin tylko-provider)
- **hybrid-capability** — wiele typów możliwości (np. tekst + mowa + obrazy)
- **hook-only** — tylko hooki, bez możliwości ani powierzchni
- **non-capability** — narzędzia/polecenia/usługi, ale bez możliwości

Zobacz [Kształty Pluginów](/pl/plugins/architecture#plugin-shapes), aby dowiedzieć się więcej o modelu możliwości.

<Note>
Flaga `--json` zwraca raport czytelny maszynowo, odpowiedni do skryptów i audytu. `inspect --all` renderuje tabelę dla całej floty z kolumnami kształtu, rodzajów możliwości, uwag o zgodności, możliwości pakietów i podsumowania hooków. `info` jest aliasem dla `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` raportuje błędy ładowania Pluginów, diagnostykę manifestu/wykrywania i uwagi o zgodności. Gdy wszystko jest poprawne, wypisuje `No plugin issues detected.`

W przypadku błędów kształtu modułu, takich jak brak eksportów `register`/`activate`, uruchom ponownie z `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, aby uwzględnić zwarte podsumowanie kształtu eksportów w danych diagnostycznych.

### Rejestr

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Lokalny rejestr Pluginów to utrwalony zimny model odczytu OpenClaw dla tożsamości zainstalowanych Pluginów, stanu włączenia, metadanych źródła i własności wkładów. Zwykły start, wyszukiwanie właściciela providera, klasyfikacja konfiguracji kanałów i inwentarz Pluginów mogą go odczytywać bez importowania modułów środowiska uruchomieniowego Pluginów.

Użyj `plugins registry`, aby sprawdzić, czy utrwalony rejestr jest obecny, aktualny czy nieaktualny. Użyj `--refresh`, aby odbudować go z utrwalonego indeksu Pluginów, zasad konfiguracji i metadanych manifestu/pakietu. To ścieżka naprawcza, a nie ścieżka aktywacji środowiska uruchomieniowego.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` to przestarzały awaryjny przełącznik zgodności dla błędów odczytu rejestru. Preferuj `plugins registry --refresh` lub `openclaw doctor --fix`; zapasowa ścieżka env jest przeznaczona tylko do awaryjnego odzyskiwania uruchamiania podczas wdrażania migracji.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Lista marketplace akceptuje lokalną ścieżkę marketplace, ścieżkę `marketplace.json`, skrót GitHub taki jak `owner/repo`, URL repozytorium GitHub lub URL git. `--json` wypisuje rozwiązaną etykietę źródła oraz sparsowany manifest marketplace i wpisy Pluginów.

## Powiązane

- [Tworzenie Pluginów](/pl/plugins/building-plugins)
- [Dokumentacja CLI](/pl/cli)
- [Pluginy społeczności](/pl/plugins/community)
