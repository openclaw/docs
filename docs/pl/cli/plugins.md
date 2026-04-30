---
read_when:
    - Chcesz zainstalować pluginy Gateway lub zgodne pakiety albo nimi zarządzać
    - Chcesz debugować błędy ładowania Plugin
sidebarTitle: Plugins
summary: Dokumentacja CLI dla `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, deps, doctor)
title: Pluginy
x-i18n:
    generated_at: "2026-04-30T09:45:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 381e3243eaefb5b5e31db8fd2ba459773649a6ef427080a12018ea92b25f707c
    source_path: cli/plugins.md
    workflow: 16
---

Zarządzaj Pluginami Gateway, pakietami hooków i zgodnymi pakietami.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/pl/tools/plugin">
    Przewodnik dla użytkownika końcowego dotyczący instalowania, włączania i rozwiązywania problemów z Pluginami.
  </Card>
  <Card title="Plugin bundles" href="/pl/plugins/bundles">
    Model zgodności pakietów.
  </Card>
  <Card title="Plugin manifest" href="/pl/plugins/manifest">
    Pola manifestu i schemat konfiguracji.
  </Card>
  <Card title="Security" href="/pl/gateway/security">
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

Aby zbadać powolne instalowanie, sprawdzanie, odinstalowywanie lub odświeżanie rejestru, uruchom polecenie z `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Ślad zapisuje czasy faz do stderr i zachowuje możliwość parsowania wyjścia JSON. Zobacz [Debugowanie](/pl/help/debugging#plugin-lifecycle-trace).

<Note>
Dołączone Pluginy są dostarczane z OpenClaw. Niektóre są domyślnie włączone (na przykład dołączeni dostawcy modeli, dołączeni dostawcy mowy i dołączony Plugin przeglądarki); inne wymagają `plugins enable`.

Natywne Pluginy OpenClaw muszą dostarczać `openclaw.plugin.json` z wbudowanym JSON Schema (`configSchema`, nawet jeśli jest pusty). Zgodne pakiety używają zamiast tego własnych manifestów pakietów.

`plugins list` pokazuje `Format: openclaw` lub `Format: bundle`. Szczegółowe wyjście list/info pokazuje też podtyp pakietu (`codex`, `claude` lub `cursor`) oraz wykryte możliwości pakietu.
</Note>

### Instalacja

```bash
openclaw plugins install <package>                      # Najpierw ClawHub, potem npm
openclaw plugins install clawhub:<package>              # Tylko ClawHub
openclaw plugins install npm:<package>                  # Tylko npm
openclaw plugins install <package> --force              # nadpisz istniejącą instalację
openclaw plugins install <package> --pin                # przypnij wersję
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # ścieżka lokalna
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (jawnie)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Same nazwy pakietów są najpierw sprawdzane w ClawHub, a potem w npm. Traktuj instalacje Pluginów jak uruchamianie kodu. Preferuj przypięte wersje.
</Warning>

<Note>
ClawHub jest główną powierzchnią dystrybucji i odkrywania większości Pluginów. Npm pozostaje obsługiwaną ścieżką awaryjną i ścieżką instalacji bezpośredniej. Podczas migracji do ClawHub OpenClaw nadal dostarcza niektóre należące do OpenClaw pakiety Pluginów `@openclaw/*` w npm; wersje tych pakietów mogą pozostawać w tyle za dołączonym źródłem między pociągami wydań Pluginów. Jeśli npm zgłasza należący do OpenClaw pakiet Pluginu jako przestarzały, ta opublikowana wersja jest starym zewnętrznym artefaktem; użyj Pluginu dołączonego do bieżącego OpenClaw albo lokalnego checkoutu, dopóki nie zostanie opublikowany nowszy pakiet npm.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config recovery">
    Jeśli sekcja `plugins` jest wspierana przez jednoplikowe `$include`, `plugins install/update/enable/disable/uninstall` zapisują zmiany do tego dołączonego pliku i pozostawiają `openclaw.json` bez zmian. Dołączenia główne, tablice dołączeń i dołączenia z sąsiednimi nadpisaniami kończą się bezpiecznie niepowodzeniem zamiast spłaszczania. Zobacz [dołączenia konfiguracji](/pl/gateway/configuration), aby poznać obsługiwane kształty.

    Jeśli konfiguracja jest nieprawidłowa podczas instalacji, `plugins install` zwykle kończy się bezpiecznie niepowodzeniem i informuje, aby najpierw uruchomić `openclaw doctor --fix`. Podczas uruchamiania Gateway nieprawidłowa konfiguracja jednego Pluginu jest izolowana do tego Pluginu, aby inne kanały i Pluginy mogły nadal działać; `openclaw doctor --fix` może poddać kwarantannie nieprawidłowy wpis Pluginu. Jedynym udokumentowanym wyjątkiem w czasie instalacji jest wąska ścieżka odzyskiwania dla dołączonych Pluginów, które jawnie wybierają `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` ponownie używa istniejącego celu instalacji i nadpisuje już zainstalowany Plugin lub pakiet hooków w miejscu. Używaj go, gdy celowo instalujesz ponownie ten sam identyfikator z nowej ścieżki lokalnej, archiwum, pakietu ClawHub lub artefaktu npm. Do rutynowych aktualizacji już śledzonego Pluginu npm preferuj `openclaw plugins update <id-or-npm-spec>`.

    Jeśli uruchomisz `plugins install` dla identyfikatora Pluginu, który jest już zainstalowany, OpenClaw zatrzyma się i wskaże `plugins update <id-or-npm-spec>` dla normalnej aktualizacji albo `plugins install <package> --force`, gdy naprawdę chcesz nadpisać bieżącą instalację z innego źródła.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` dotyczy tylko instalacji npm. Nie jest obsługiwane z `--marketplace`, ponieważ instalacje marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` to opcja awaryjna dla fałszywych alarmów w wbudowanym skanerze niebezpiecznego kodu. Pozwala kontynuować instalację nawet wtedy, gdy wbudowany skaner zgłasza wyniki `critical`, ale **nie** omija blokad polityki hooka Pluginu `before_install` i **nie** omija niepowodzeń skanowania.

    Ta flaga CLI dotyczy przepływów instalacji/aktualizacji Pluginów. Instalacje zależności Skills obsługiwane przez Gateway używają odpowiadającego nadpisania żądania `dangerouslyForceUnsafeInstall`, podczas gdy `openclaw skills install` pozostaje osobnym przepływem pobierania/instalacji Skills z ClawHub.

    Jeśli Plugin opublikowany przez Ciebie w ClawHub jest blokowany przez skan rejestru, użyj kroków dla wydawcy w [ClawHub](/pl/tools/clawhub).

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` jest także powierzchnią instalacji dla pakietów hooków, które udostępniają `openclaw.hooks` w `package.json`. Użyj `openclaw hooks` do filtrowanej widoczności hooków i włączania poszczególnych hooków, a nie do instalacji pakietów.

    Specyfikacje npm są **wyłącznie rejestrowe** (nazwa pakietu + opcjonalna **dokładna wersja** lub **dist-tag**). Specyfikacje Git/URL/file oraz zakresy semver są odrzucane. Instalacje zależności działają lokalnie w projekcie z `--ignore-scripts` dla bezpieczeństwa, nawet gdy Twoja powłoka ma globalne ustawienia instalacji npm.

    Użyj `npm:<package>`, gdy chcesz pominąć wyszukiwanie w ClawHub i zainstalować bezpośrednio z npm. Same specyfikacje pakietów nadal preferują ClawHub i wracają do npm tylko wtedy, gdy ClawHub nie ma tego pakietu lub wersji.

    Same specyfikacje i `@latest` pozostają na stabilnej ścieżce. Jeśli npm rozwiąże którąkolwiek z nich do wersji przedwydaniowej, OpenClaw zatrzyma się i poprosi o jawne wyrażenie zgody za pomocą tagu przedwydaniowego, takiego jak `@beta`/`@rc`, albo dokładnej wersji przedwydaniowej, takiej jak `@1.2.3-beta.4`.

    Jeśli sama specyfikacja instalacji pasuje do identyfikatora dołączonego Pluginu (na przykład `diffs`), OpenClaw instaluje dołączony Plugin bezpośrednio. Aby zainstalować pakiet npm o tej samej nazwie, użyj jawnej specyfikacji z zakresem (na przykład `@scope/diffs`).

  </Accordion>
  <Accordion title="Archives">
    Obsługiwane archiwa: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archiwa natywnych Pluginów OpenClaw muszą zawierać prawidłowy `openclaw.plugin.json` w wyodrębnionym katalogu głównym Pluginu; archiwa zawierające tylko `package.json` są odrzucane, zanim OpenClaw zapisze rekordy instalacji.

    Obsługiwane są także instalacje z marketplace Claude.

  </Accordion>
</AccordionGroup>

Instalacje ClawHub używają jawnego lokalizatora `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw preferuje teraz także ClawHub dla samych, bezpiecznych dla npm specyfikacji Pluginów. Wraca do npm tylko wtedy, gdy ClawHub nie ma tego pakietu lub wersji:

```bash
openclaw plugins install openclaw-codex-app-server
```

Użyj `npm:`, aby wymusić rozwiązywanie wyłącznie przez npm, na przykład gdy ClawHub jest niedostępny albo wiesz, że pakiet istnieje tylko w npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw pobiera archiwum pakietu z ClawHub, sprawdza deklarowaną zgodność API Pluginu / minimalną zgodność Gateway, a następnie instaluje je przez normalną ścieżkę archiwum. Zarejestrowane instalacje zachowują metadane źródła ClawHub na potrzeby późniejszych aktualizacji.
Instalacje ClawHub bez wersji zachowują zarejestrowaną specyfikację bez wersji, aby `openclaw plugins update` mogło śledzić nowsze wydania ClawHub; jawne selektory wersji lub tagów, takie jak `clawhub:pkg@1.2.3` i `clawhub:pkg@beta`, pozostają przypięte do tego selektora.

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
    W przypadku zdalnych marketplace ładowanych z GitHub lub git wpisy Pluginów muszą pozostawać wewnątrz sklonowanego repozytorium marketplace. OpenClaw akceptuje względne źródła ścieżek z tego repozytorium i odrzuca HTTP(S), ścieżki bezwzględne, git, GitHub oraz inne nieścieżkowe źródła Pluginów ze zdalnych manifestów.
  </Tab>
</Tabs>

Dla ścieżek lokalnych i archiwów OpenClaw automatycznie wykrywa:

- natywne Pluginy OpenClaw (`openclaw.plugin.json`)
- pakiety zgodne z Codex (`.codex-plugin/plugin.json`)
- pakiety zgodne z Claude (`.claude-plugin/plugin.json` lub domyślny układ komponentów Claude)
- pakiety zgodne z Cursor (`.cursor-plugin/plugin.json`)

<Note>
Zgodne pakiety instalują się w normalnym katalogu głównym Pluginów i uczestniczą w tym samym przepływie list/info/enable/disable. Obecnie obsługiwane są Skills pakietów, command-skills Claude, domyślne wartości Claude `settings.json`, domyślne wartości Claude `.lsp.json` / zadeklarowanych w manifeście `lspServers`, command-skills Cursor oraz zgodne katalogi hooków Codex; inne wykryte możliwości pakietów są pokazywane w diagnostyce/info, ale nie są jeszcze podłączone do wykonywania w czasie działania.
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
  Przełącz z widoku tabeli na szczegółowe wiersze dla każdego Pluginu z metadanymi źródła/pochodzenia/wersji/aktywacji.
</ParamField>
<ParamField path="--json" type="boolean">
  Czytelny maszynowo inwentarz oraz diagnostyka rejestru.
</ParamField>

<Note>
`plugins list` najpierw odczytuje utrwalony lokalny rejestr pluginów, z awaryjnym wariantem pochodnym wyłącznie z manifestu, gdy rejestru brakuje albo jest nieprawidłowy. Przydaje się do sprawdzania, czy plugin jest zainstalowany, włączony i widoczny dla planowania zimnego startu, ale nie jest aktywną sondą środowiska uruchomieniowego już działającego procesu Gateway. Po zmianie kodu pluginu, włączenia, polityki haków albo `plugins.load.paths` uruchom ponownie Gateway obsługujący kanał, zanim będziesz oczekiwać uruchomienia nowego kodu `register(api)` albo haków. W przypadku wdrożeń zdalnych/kontenerowych sprawdź, czy restartujesz faktyczny proces potomny `openclaw gateway run`, a nie tylko proces opakowujący.
</Note>

W przypadku pracy nad dołączonym pluginem wewnątrz spakowanego obrazu Docker podmontuj katalog źródłowy pluginu
na odpowiadającą mu spakowaną ścieżkę źródłową, na przykład
`/app/extensions/synology-chat`. OpenClaw wykryje tę podmontowaną nakładkę źródeł
przed `/app/dist/extensions/synology-chat`; zwykły skopiowany katalog źródłowy
pozostaje nieaktywny, więc normalne instalacje pakietowe nadal używają skompilowanego dist.

Do debugowania haków środowiska uruchomieniowego:

- `openclaw plugins inspect <id> --json` pokazuje zarejestrowane haki i diagnostykę z przebiegu inspekcji po załadowaniu modułu.
- `openclaw gateway status --deep --require-rpc` potwierdza osiągalny Gateway, wskazówki dotyczące usługi/procesu, ścieżkę konfiguracji i kondycję RPC.
- Niedołączone haki konwersacji (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) wymagają `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Użyj `--link`, aby uniknąć kopiowania katalogu lokalnego (dodaje do `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` nie jest obsługiwane z `--link`, ponieważ instalacje linkowane ponownie używają ścieżki źródłowej zamiast kopiować pliki na zarządzany cel instalacji.

Użyj `--pin` przy instalacjach npm, aby zapisać rozwiązaną dokładną specyfikację (`name@version`) w zarządzanym indeksie pluginów, zachowując domyślne zachowanie bez przypięcia.
</Note>

### Indeks pluginów

Metadane instalacji pluginów są stanem zarządzanym przez maszynę, a nie konfiguracją użytkownika. Instalacje i aktualizacje zapisują je do `plugins/installs.json` w aktywnym katalogu stanu OpenClaw. Jego mapa najwyższego poziomu `installRecords` jest trwałym źródłem metadanych instalacji, w tym rekordów dla uszkodzonych lub brakujących manifestów pluginów. Tablica `plugins` jest pamięcią podręczną zimnego rejestru pochodną z manifestów. Plik zawiera ostrzeżenie, aby go nie edytować, i jest używany przez `openclaw plugins update`, odinstalowywanie, diagnostykę oraz zimny rejestr pluginów.

Gdy OpenClaw wykryje dostarczone starsze rekordy `plugins.installs` w konfiguracji, przenosi je do indeksu pluginów i usuwa klucz konfiguracji; jeśli którykolwiek zapis się nie powiedzie, rekordy konfiguracji są zachowywane, aby metadane instalacji nie zostały utracone.

### Zależności środowiska uruchomieniowego

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` sprawdza spakowany etap zależności środowiska uruchomieniowego dla należących do OpenClaw dołączonych pluginów wybranych przez konfigurację pluginów, włączone/skonfigurowane kanały, skonfigurowanych dostawców modeli albo domyślne ustawienia dołączonych manifestów. Nie jest to ścieżka instalacji/aktualizacji dla zewnętrznych pluginów npm ani ClawHub.

Użyj `--repair`, gdy instalacja pakietowa zgłasza brakujące dołączone zależności środowiska uruchomieniowego podczas startu Gateway albo `plugins doctor`. Naprawa instaluje tylko brakujące zależności włączonych dołączonych pluginów, z wyłączonymi skryptami cyklu życia. Użyj `--prune`, aby usunąć przestarzałe, nieznane zewnętrzne korzenie zależności środowiska uruchomieniowego pozostawione przez starsze układy pakietów.

### Odinstalowanie

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` usuwa rekordy pluginów z `plugins.entries`, utrwalonego indeksu pluginów, wpisów listy zezwoleń/odmów dla pluginów oraz połączonych wpisów `plugins.load.paths`, gdy ma to zastosowanie. O ile nie ustawiono `--keep-files`, odinstalowanie usuwa też śledzony zarządzany katalog instalacji, gdy znajduje się on w głównym katalogu rozszerzeń pluginów OpenClaw. W przypadku pluginów Active Memory slot pamięci jest resetowany do `memory-core`.

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

Aktualizacje dotyczą śledzonych instalacji pluginów w zarządzanym indeksie pluginów oraz śledzonych instalacji pakietów haków w `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Rozwiązywanie id pluginu kontra specyfikacja npm">
    Gdy przekazujesz id pluginu, OpenClaw ponownie używa zapisanej specyfikacji instalacji dla tego pluginu. Oznacza to, że wcześniej zapisane tagi dystrybucyjne, takie jak `@beta`, i dokładne przypięte wersje będą nadal używane podczas późniejszych uruchomień `update <id>`.

    W przypadku instalacji npm możesz też przekazać jawną specyfikację pakietu npm z tagiem dystrybucyjnym albo dokładną wersją. OpenClaw rozwiązuje tę nazwę pakietu z powrotem do śledzonego rekordu pluginu, aktualizuje ten zainstalowany plugin i zapisuje nową specyfikację npm do przyszłych aktualizacji opartych na id.

    Przekazanie nazwy pakietu npm bez wersji lub tagu także rozwiązuje ją z powrotem do śledzonego rekordu pluginu. Użyj tego, gdy plugin był przypięty do dokładnej wersji i chcesz przenieść go z powrotem na domyślną linię wydań rejestru.

  </Accordion>
  <Accordion title="Kontrole wersji i dryf integralności">
    Przed aktywną aktualizacją npm OpenClaw sprawdza zainstalowaną wersję pakietu względem metadanych rejestru npm. Jeśli zainstalowana wersja i zapisana tożsamość artefaktu już pasują do rozwiązanego celu, aktualizacja jest pomijana bez pobierania, ponownej instalacji ani przepisywania `openclaw.json`.

    Gdy istnieje zapisany hash integralności, a hash pobranego artefaktu się zmienia, OpenClaw traktuje to jako dryf artefaktu npm. Interaktywne polecenie `openclaw plugins update` wypisuje oczekiwane i faktyczne hashe oraz prosi o potwierdzenie przed kontynuowaniem. Nieinteraktywne pomocniki aktualizacji kończą się zamknięciem z błędem, chyba że wywołujący dostarczy jawną politykę kontynuacji.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install przy aktualizacji">
    `--dangerously-force-unsafe-install` jest też dostępne w `plugins update` jako awaryjne obejście fałszywych alarmów wbudowanego skanowania niebezpiecznego kodu podczas aktualizacji pluginów. Nadal nie omija blokad polityki `before_install` pluginu ani blokowania po niepowodzeniu skanowania i dotyczy tylko aktualizacji pluginów, a nie aktualizacji pakietów haków.
  </Accordion>
</AccordionGroup>

### Inspekcja

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Głęboka introspekcja pojedynczego pluginu. Pokazuje tożsamość, stan ładowania, źródło, zarejestrowane możliwości, haki, narzędzia, polecenia, usługi, metody Gateway, trasy HTTP, flagi polityki, diagnostykę, metadane instalacji, możliwości pakietu oraz wszelką wykrytą obsługę serwera MCP lub LSP.

Każdy plugin jest klasyfikowany według tego, co faktycznie rejestruje w środowisku uruchomieniowym:

- **plain-capability** — jeden typ możliwości (np. plugin tylko dostawcy)
- **hybrid-capability** — wiele typów możliwości (np. tekst + mowa + obrazy)
- **hook-only** — tylko haki, bez możliwości ani powierzchni
- **non-capability** — narzędzia/polecenia/usługi, ale bez możliwości

Zobacz [Kształty pluginów](/pl/plugins/architecture#plugin-shapes), aby dowiedzieć się więcej o modelu możliwości.

<Note>
Flaga `--json` wypisuje raport czytelny maszynowo, odpowiedni do skryptowania i audytu. `inspect --all` renderuje tabelę dla całej floty z kolumnami kształtu, rodzajów możliwości, powiadomień o zgodności, możliwości pakietu i podsumowania haków. `info` jest aliasem dla `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` zgłasza błędy ładowania pluginów, diagnostykę manifestu/wykrywania oraz powiadomienia o zgodności. Gdy wszystko jest czyste, wypisuje `No plugin issues detected.`

W przypadku niepowodzeń kształtu modułu, takich jak brakujące eksporty `register`/`activate`, uruchom ponownie z `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, aby dołączyć zwarte podsumowanie kształtu eksportów w wyjściu diagnostycznym.

### Rejestr

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Lokalny rejestr pluginów jest utrwalonym modelem zimnego odczytu OpenClaw dla tożsamości zainstalowanych pluginów, włączenia, metadanych źródła i własności wkładów. Normalny start, wyszukiwanie właściciela dostawcy, klasyfikacja konfiguracji kanałów i inwentarz pluginów mogą go odczytywać bez importowania modułów środowiska uruchomieniowego pluginów.

Użyj `plugins registry`, aby sprawdzić, czy utrwalony rejestr jest obecny, aktualny albo przestarzały. Użyj `--refresh`, aby odbudować go z utrwalonego indeksu pluginów, polityki konfiguracji oraz metadanych manifestu/pakietu. To jest ścieżka naprawy, a nie ścieżka aktywacji środowiska uruchomieniowego.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` to przestarzały awaryjny przełącznik zgodności na wypadek błędów odczytu rejestru. Preferuj `plugins registry --refresh` albo `openclaw doctor --fix`; awaryjny wariant env służy tylko do odzyskiwania startu w nagłych sytuacjach, gdy migracja jest wdrażana.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Lista Marketplace akceptuje lokalną ścieżkę Marketplace, ścieżkę `marketplace.json`, skrót GitHub taki jak `owner/repo`, URL repozytorium GitHub albo URL git. `--json` wypisuje rozwiązaną etykietę źródła oraz sparsowany manifest Marketplace i wpisy pluginów.

## Powiązane

- [Budowanie pluginów](/pl/plugins/building-plugins)
- [Dokumentacja CLI](/pl/cli)
- [Pluginy społecznościowe](/pl/plugins/community)
