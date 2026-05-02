---
read_when:
    - Chcesz zainstalować pluginy Gateway lub zgodne pakiety
    - Chcesz debugować błędy ładowania Plugin
sidebarTitle: Plugins
summary: Dokumentacja CLI dla `openclaw plugins` (lista, instalacja, marketplace, odinstalowywanie, włączanie/wyłączanie, diagnostyka)
title: Pluginy
x-i18n:
    generated_at: "2026-05-02T22:17:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b077ab0739e2453ccba434aa3b02b1d441bab792b7b131216221a8048d551cd
    source_path: cli/plugins.md
    workflow: 16
---

Zarządzaj Plugin, pakietami hooków i zgodnymi pakietami.

<CardGroup cols={2}>
  <Card title="System Plugin" href="/pl/tools/plugin">
    Przewodnik dla użytkownika końcowego po instalowaniu, włączaniu i rozwiązywaniu problemów z pluginami.
  </Card>
  <Card title="Zarządzanie pluginami" href="/pl/plugins/manage-plugins">
    Szybkie przykłady instalowania, wyświetlania, aktualizowania, odinstalowywania i publikowania.
  </Card>
  <Card title="Pakiety Plugin" href="/pl/plugins/bundles">
    Model zgodności pakietów.
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

Aby zbadać powolne instalowanie, inspekcję, odinstalowywanie lub odświeżanie rejestru, uruchom polecenie z `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Ślad zapisuje czasy faz do stderr i zachowuje możliwość parsowania wyjścia JSON. Zobacz [Debugowanie](/pl/help/debugging#plugin-lifecycle-trace).

<Note>
Wbudowane pluginy są dostarczane z OpenClaw. Niektóre są domyślnie włączone (na przykład wbudowani dostawcy modeli, wbudowani dostawcy mowy i wbudowany plugin przeglądarki); inne wymagają `plugins enable`.

Natywne pluginy OpenClaw muszą dostarczać `openclaw.plugin.json` z wbudowanym JSON Schema (`configSchema`, nawet jeśli jest pusty). Zgodne pakiety używają zamiast tego własnych manifestów pakietów.

`plugins list` pokazuje `Format: openclaw` albo `Format: bundle`. Szczegółowe wyjście list/info pokazuje także podtyp pakietu (`codex`, `claude` albo `cursor`) oraz wykryte możliwości pakietu.
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
Same nazwy pakietów są podczas przejścia uruchomieniowego instalowane domyślnie z npm. Użyj `clawhub:<package>` dla ClawHub. Traktuj instalacje pluginów jak uruchamianie kodu. Preferuj przypięte wersje.
</Warning>

`plugins search` wysyła zapytanie do ClawHub o możliwe do zainstalowania pakiety pluginów i wypisuje nazwy pakietów gotowe do instalacji. Przeszukuje pakiety code-plugin i bundle-plugin, nie Skills. Użyj `openclaw skills search` dla Skills z ClawHub.

<Note>
ClawHub jest główną powierzchnią dystrybucji i odkrywania większości pluginów. Npm pozostaje obsługiwanym mechanizmem awaryjnym i ścieżką bezpośredniej instalacji. Pakiety pluginów `@openclaw/*` należące do OpenClaw są ponownie publikowane w npm; zobacz aktualną listę na [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) albo w [inwentarzu pluginów](/pl/plugins/plugin-inventory). Stabilne instalacje używają `latest`. Instalacje i aktualizacje z kanału beta preferują npm `beta` dist-tag, gdy ten tag jest dostępny, a następnie wracają do `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Dołączanie konfiguracji i odzyskiwanie nieprawidłowej konfiguracji">
    Jeśli twoja sekcja `plugins` jest obsługiwana przez jednoplikowe `$include`, `plugins install/update/enable/disable/uninstall` zapisują do tego dołączonego pliku i pozostawiają `openclaw.json` bez zmian. Dołączenia główne, tablice dołączeń i dołączenia z sąsiednimi nadpisaniami kończą się bezpiecznym niepowodzeniem zamiast spłaszczenia. Zobacz [dołączanie konfiguracji](/pl/gateway/configuration), aby poznać obsługiwane kształty.

    Jeśli konfiguracja jest nieprawidłowa podczas instalacji, `plugins install` zwykle kończy się bezpiecznym niepowodzeniem i informuje, aby najpierw uruchomić `openclaw doctor --fix`. Podczas uruchamiania Gateway nieprawidłowa konfiguracja jednego pluginu jest izolowana do tego pluginu, aby inne kanały i pluginy mogły dalej działać; `openclaw doctor --fix` może poddać kwarantannie nieprawidłowy wpis pluginu. Jedynym udokumentowanym wyjątkiem w czasie instalacji jest wąska ścieżka odzyskiwania wbudowanych pluginów dla pluginów, które jawnie wybierają `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force i ponowna instalacja kontra aktualizacja">
    `--force` ponownie używa istniejącego celu instalacji i nadpisuje już zainstalowany plugin lub pakiet hooków w miejscu. Użyj tej opcji, gdy celowo ponownie instalujesz ten sam identyfikator z nowej ścieżki lokalnej, archiwum, pakietu ClawHub albo artefaktu npm. W przypadku rutynowych uaktualnień już śledzonego pluginu npm preferuj `openclaw plugins update <id-or-npm-spec>`.

    Jeśli uruchomisz `plugins install` dla identyfikatora pluginu, który jest już zainstalowany, OpenClaw zatrzyma się i wskaże `plugins update <id-or-npm-spec>` dla zwykłego uaktualnienia albo `plugins install <package> --force`, gdy rzeczywiście chcesz nadpisać bieżącą instalację z innego źródła.

  </Accordion>
  <Accordion title="Zakres --pin">
    `--pin` dotyczy tylko instalacji npm. Nie jest obsługiwane z instalacjami `git:`; użyj jawnego odwołania git, takiego jak `git:github.com/acme/plugin@v1.2.3`, gdy chcesz przypiąć źródło. Nie jest obsługiwane z `--marketplace`, ponieważ instalacje z marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` to opcja awaryjna na fałszywe alarmy we wbudowanym skanerze niebezpiecznego kodu. Pozwala kontynuować instalację nawet wtedy, gdy wbudowany skaner zgłasza ustalenia `critical`, ale **nie** omija blokad polityki hooka `before_install` pluginu i **nie** omija niepowodzeń skanowania.

    Ta flaga CLI dotyczy przepływów instalacji/aktualizacji pluginów. Instalacje zależności Skills obsługiwane przez Gateway używają odpowiadającego nadpisania żądania `dangerouslyForceUnsafeInstall`, natomiast `openclaw skills install` pozostaje oddzielnym przepływem pobierania/instalowania Skills z ClawHub.

    Jeśli plugin opublikowany przez ciebie w ClawHub jest blokowany przez skan rejestru, użyj kroków dla wydawcy w [ClawHub](/pl/tools/clawhub).

  </Accordion>
  <Accordion title="Pakiety hooków i specyfikacje npm">
    `plugins install` jest także powierzchnią instalacji pakietów hooków, które udostępniają `openclaw.hooks` w `package.json`. Użyj `openclaw hooks` do filtrowanej widoczności hooków i włączania poszczególnych hooków, nie do instalacji pakietów.

    Specyfikacje npm są **wyłącznie rejestrowe** (nazwa pakietu + opcjonalna **dokładna wersja** albo **dist-tag**). Specyfikacje Git/URL/file i zakresy semver są odrzucane. Instalacje zależności działają lokalnie dla projektu z `--ignore-scripts` ze względów bezpieczeństwa, nawet gdy twoja powłoka ma globalne ustawienia instalacji npm.

    Użyj `npm:<package>`, gdy chcesz jawnie wskazać rozwiązywanie przez npm. Same specyfikacje pakietów także instalują bezpośrednio z npm podczas przejścia uruchomieniowego.

    Same specyfikacje i `@latest` pozostają na stabilnej ścieżce. Jeśli npm rozwiąże którykolwiek z nich do wersji prerelease, OpenClaw zatrzyma się i poprosi o jawne wyrażenie zgody przez tag prerelease, taki jak `@beta`/`@rc`, albo dokładną wersję prerelease, taką jak `@1.2.3-beta.4`.

    Jeśli sama specyfikacja instalacji pasuje do oficjalnego identyfikatora pluginu (na przykład `diffs`), OpenClaw instaluje bezpośrednio wpis z katalogu. Aby zainstalować pakiet npm o tej samej nazwie, użyj jawnej specyfikacji z zakresem (na przykład `@scope/diffs`).

  </Accordion>
  <Accordion title="Repozytoria Git">
    Użyj `git:<repo>`, aby instalować bezpośrednio z repozytorium git. Obsługiwane formy obejmują `git:github.com/owner/repo`, `git:owner/repo`, pełne adresy URL klonowania `https://`, `ssh://`, `git://`, `file://` i `git@host:owner/repo.git`. Dodaj `@<ref>` albo `#<ref>`, aby przed instalacją pobrać branch, tag albo commit.

    Instalacje Git klonują do katalogu tymczasowego, pobierają żądane odwołanie, jeśli występuje, a następnie używają zwykłego instalatora katalogu pluginu. Oznacza to, że walidacja manifestu, skanowanie niebezpiecznego kodu, praca instalacyjna menedżera pakietów i rekordy instalacji działają tak jak instalacje npm. Zapisane instalacje git zawierają źródłowy URL/ref oraz rozwiązany commit, aby `openclaw plugins update` mogło później ponownie rozwiązać źródło.

    Po instalacji z git użyj `openclaw plugins inspect <id> --runtime --json`, aby zweryfikować rejestracje runtime, takie jak metody gateway i polecenia CLI. Jeśli plugin zarejestrował katalog główny CLI za pomocą `api.registerCli`, wykonaj to polecenie bezpośrednio przez główny CLI OpenClaw, na przykład `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archiwa">
    Obsługiwane archiwa: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archiwa natywnych pluginów OpenClaw muszą zawierać prawidłowy `openclaw.plugin.json` w wypakowanym katalogu głównym pluginu; archiwa zawierające wyłącznie `package.json` są odrzucane, zanim OpenClaw zapisze rekordy instalacji.

    Instalacje z marketplace Claude także są obsługiwane.

  </Accordion>
</AccordionGroup>

Instalacje ClawHub używają jawnego lokalizatora `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Same, bezpieczne dla npm specyfikacje pluginów instalują domyślnie z npm podczas przejścia uruchomieniowego:

```bash
openclaw plugins install openclaw-codex-app-server
```

Użyj `npm:`, aby jawnie wskazać rozwiązywanie wyłącznie przez npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw sprawdza deklarowaną zgodność API pluginu / minimalną zgodność gateway przed instalacją. Gdy wybrana wersja ClawHub publikuje artefakt ClawPack, OpenClaw pobiera wersjonowany npm-pack `.tgz`, weryfikuje nagłówek skrótu ClawHub oraz skrót artefaktu, a następnie instaluje go przez zwykłą ścieżkę archiwum. Starsze wersje ClawHub bez metadanych ClawPack nadal instalują się przez starszą ścieżkę weryfikacji archiwum pakietu. Zapisane instalacje zachowują swoje metadane źródła ClawHub, rodzaj artefaktu, integralność npm, shasum npm, nazwę tarballa i fakty skrótu ClawPack na potrzeby późniejszych aktualizacji.
Niewersjonowane instalacje ClawHub zachowują niewersjonowaną zapisaną specyfikację, aby `openclaw plugins update` mogło podążać za nowszymi wydaniami ClawHub; jawne selektory wersji lub tagów, takie jak `clawhub:pkg@1.2.3` i `clawhub:pkg@beta`, pozostają przypięte do tego selektora.

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
  <Tab title="Źródła marketplace'u">
    - nazwa znanego marketplace'u Claude z `~/.claude/plugins/known_marketplaces.json`
    - lokalny katalog główny marketplace'u albo ścieżka `marketplace.json`
    - skrót repozytorium GitHub, taki jak `owner/repo`
    - URL repozytorium GitHub, taki jak `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Reguły zdalnego marketplace'u">
    W przypadku zdalnych marketplace'ów ładowanych z GitHub lub git wpisy pluginów muszą pozostać wewnątrz sklonowanego repozytorium marketplace'u. OpenClaw akceptuje źródła ze ścieżkami względnymi z tego repozytorium i odrzuca HTTP(S), ścieżki bezwzględne, git, GitHub oraz inne nieścieżkowe źródła pluginów ze zdalnych manifestów.
  </Tab>
</Tabs>

W przypadku ścieżek lokalnych i archiwów OpenClaw automatycznie wykrywa:

- natywne pluginy OpenClaw (`openclaw.plugin.json`)
- pakiety zgodne z Codex (`.codex-plugin/plugin.json`)
- pakiety zgodne z Claude (`.claude-plugin/plugin.json` albo domyślny układ komponentów Claude)
- pakiety zgodne z Cursor (`.cursor-plugin/plugin.json`)

<Note>
Zgodne pakiety instalują się w normalnym katalogu głównym pluginów i uczestniczą w tym samym przepływie list/info/enable/disable. Obecnie obsługiwane są: Skills pakietu, Skills poleceń Claude, domyślne wartości Claude `settings.json`, domyślne wartości Claude `.lsp.json` / zadeklarowanych w manifeście `lspServers`, Skills poleceń Cursor oraz zgodne katalogi haków Codex; inne wykryte możliwości pakietu są pokazywane w diagnostyce/info, ale nie są jeszcze podłączone do wykonywania w czasie działania.
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
  Inwentarz czytelny maszynowo oraz diagnostyka rejestru i stan instalacji zależności pakietu.
</ParamField>

<Note>
`plugins list` najpierw odczytuje utrwalony lokalny rejestr pluginów, z awaryjnym wariantem wyprowadzanym wyłącznie z manifestu, gdy rejestru brakuje lub jest nieprawidłowy. Przydaje się do sprawdzania, czy plugin jest zainstalowany, włączony i widoczny dla planowania zimnego uruchomienia, ale nie jest sondą czasu działania dla już działającego procesu Gateway. Po zmianie kodu pluginu, stanu włączenia, polityki haków albo `plugins.load.paths` zrestartuj Gateway obsługujący kanał, zanim będziesz oczekiwać uruchomienia nowego kodu `register(api)` lub haków. W przypadku wdrożeń zdalnych/kontenerowych sprawdź, czy restartujesz rzeczywisty proces podrzędny `openclaw gateway run`, a nie tylko proces opakowujący.

`plugins list --json` obejmuje `dependencyStatus` każdego pluginu z `package.json`
`dependencies` i `optionalDependencies`. OpenClaw sprawdza, czy te nazwy pakietów
są obecne wzdłuż normalnej ścieżki wyszukiwania Node `node_modules` pluginu; nie
importuje kodu czasu działania pluginu, nie uruchamia menedżera pakietów ani nie
naprawia brakujących zależności.
</Note>

`plugins search` to zdalne wyszukiwanie katalogu ClawHub. Nie sprawdza lokalnego
stanu, nie modyfikuje konfiguracji, nie instaluje pakietów ani nie ładuje kodu
czasu działania pluginu. Wyniki wyszukiwania zawierają nazwę pakietu ClawHub,
rodzinę, kanał, wersję, podsumowanie oraz wskazówkę instalacji, taką jak
`openclaw plugins install clawhub:<package>`.

Do pracy z dołączonym pluginem wewnątrz spakowanego obrazu Docker zamontuj przez bind katalog źródłowy pluginu
na odpowiadającej mu spakowanej ścieżce źródłowej, takiej jak
`/app/extensions/synology-chat`. OpenClaw wykryje tę zamontowaną nakładkę źródeł
przed `/app/dist/extensions/synology-chat`; zwykły skopiowany katalog źródłowy
pozostaje nieaktywny, więc normalne spakowane instalacje nadal używają skompilowanego dist.

Do debugowania haków czasu działania:

- `openclaw plugins inspect <id> --runtime --json` pokazuje zarejestrowane haki i diagnostykę z przebiegu inspekcji z załadowanym modułem. Inspekcja czasu działania nigdy nie instaluje zależności; użyj `openclaw doctor --fix`, aby wyczyścić starszy stan zależności albo zainstalować brakujące skonfigurowane pluginy do pobrania.
- `openclaw gateway status --deep --require-rpc` potwierdza osiągalny Gateway, wskazówki usługi/procesu, ścieżkę konfiguracji i kondycję RPC.
- Niedostarczane w pakiecie haki konwersacji (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) wymagają `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Użyj `--link`, aby uniknąć kopiowania lokalnego katalogu (dodaje do `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` nie jest obsługiwane z `--link`, ponieważ instalacje linkowane ponownie używają ścieżki źródłowej zamiast kopiować nad zarządzany cel instalacji.

Użyj `--pin` przy instalacjach npm, aby zapisać rozwiązaną dokładną specyfikację (`name@version`) w zarządzanym indeksie pluginów, zachowując domyślne zachowanie bez przypięcia.
</Note>

### Indeks pluginów

Metadane instalacji pluginów są stanem zarządzanym maszynowo, a nie konfiguracją użytkownika. Instalacje i aktualizacje zapisują je do `plugins/installs.json` w aktywnym katalogu stanu OpenClaw. Jego mapa najwyższego poziomu `installRecords` jest trwałym źródłem metadanych instalacji, w tym rekordów dla uszkodzonych lub brakujących manifestów pluginów. Tablica `plugins` jest pamięcią podręczną zimnego rejestru wyprowadzoną z manifestów. Plik zawiera ostrzeżenie, aby go nie edytować, i jest używany przez `openclaw plugins update`, odinstalowanie, diagnostykę oraz zimny rejestr pluginów.

Gdy OpenClaw zobaczy dostarczone starsze rekordy `plugins.installs` w konfiguracji, przenosi je do indeksu pluginów i usuwa klucz konfiguracji; jeśli którykolwiek zapis się nie powiedzie, rekordy konfiguracji zostają zachowane, aby metadane instalacji nie zostały utracone.

### Odinstalowanie

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` usuwa rekordy pluginu z `plugins.entries`, utrwalonego indeksu pluginów, wpisów listy zezwoleń/odmów pluginu oraz linkowanych wpisów `plugins.load.paths`, gdy ma to zastosowanie. O ile `--keep-files` nie jest ustawione, odinstalowanie usuwa też śledzony zarządzany katalog instalacji, gdy znajduje się on wewnątrz katalogu głównego rozszerzeń pluginów OpenClaw. W przypadku pluginów aktywnej pamięci slot pamięci resetuje się do `memory-core`.

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

Aktualizacje mają zastosowanie do śledzonych instalacji pluginów w zarządzanym indeksie pluginów oraz śledzonych instalacji pakietów haków w `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Rozwiązywanie identyfikatora pluginu względem specyfikacji npm">
    Gdy podasz identyfikator pluginu, OpenClaw ponownie używa zapisanej specyfikacji instalacji dla tego pluginu. Oznacza to, że wcześniej zapisane znaczniki dystrybucji, takie jak `@beta`, oraz dokładne przypięte wersje nadal będą używane przy późniejszych uruchomieniach `update <id>`.

    W przypadku instalacji npm możesz też podać jawną specyfikację pakietu npm ze znacznikiem dystrybucji albo dokładną wersją. OpenClaw rozwiązuje tę nazwę pakietu z powrotem do śledzonego rekordu pluginu, aktualizuje ten zainstalowany plugin i zapisuje nową specyfikację npm dla przyszłych aktualizacji opartych na identyfikatorze.

    Podanie nazwy pakietu npm bez wersji ani znacznika również rozwiązuje ją z powrotem do śledzonego rekordu pluginu. Użyj tego, gdy plugin był przypięty do dokładnej wersji i chcesz przenieść go z powrotem na domyślną linię wydań rejestru.

  </Accordion>
  <Accordion title="Aktualizacje kanału beta">
    `openclaw plugins update` ponownie używa śledzonej specyfikacji pluginu, chyba że podasz nową specyfikację. `openclaw update` dodatkowo zna aktywny kanał aktualizacji OpenClaw: na kanale beta rekordy pluginów npm i ClawHub z domyślnej linii próbują najpierw `@beta`, a potem wracają do zapisanej specyfikacji default/latest, jeśli wydanie beta pluginu nie istnieje. Dokładne wersje i jawne znaczniki pozostają przypięte do tego selektora.

  </Accordion>
  <Accordion title="Kontrole wersji i dryf integralności">
    Przed aktualizacją npm na żywo OpenClaw sprawdza zainstalowaną wersję pakietu względem metadanych rejestru npm. Jeśli zainstalowana wersja i zapisana tożsamość artefaktu już odpowiadają rozwiązanemu celowi, aktualizacja jest pomijana bez pobierania, ponownej instalacji ani przepisywania `openclaw.json`.

    Gdy istnieje zapisany skrót integralności, a skrót pobranego artefaktu się zmieni, OpenClaw traktuje to jako dryf artefaktu npm. Interaktywne polecenie `openclaw plugins update` wypisuje oczekiwany i rzeczywisty skrót oraz prosi o potwierdzenie przed kontynuowaniem. Nieinteraktywne pomocniki aktualizacji domyślnie kończą się niepowodzeniem w sposób zamknięty, chyba że wywołujący poda jawną politykę kontynuacji.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install przy aktualizacji">
    `--dangerously-force-unsafe-install` jest też dostępne w `plugins update` jako awaryjne obejście dla fałszywych trafień wbudowanego skanowania niebezpiecznego kodu podczas aktualizacji pluginów. Nadal nie omija blokad polityki `before_install` pluginu ani blokowania po niepowodzeniu skanowania i ma zastosowanie tylko do aktualizacji pluginów, nie do aktualizacji pakietów haków.
  </Accordion>
</AccordionGroup>

### Inspekcja

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspekcja pokazuje tożsamość, stan ładowania, źródło, możliwości manifestu, flagi polityki, diagnostykę, metadane instalacji, możliwości pakietu oraz każde wykryte wsparcie serwera MCP lub LSP bez domyślnego importowania czasu działania pluginu. Dodaj `--runtime`, aby załadować moduł pluginu i uwzględnić zarejestrowane haki, narzędzia, polecenia, usługi, metody Gateway oraz trasy HTTP. Inspekcja czasu działania zgłasza brakujące zależności pluginu bezpośrednio; instalacje i naprawy pozostają w `openclaw plugins install`, `openclaw plugins update` oraz `openclaw doctor --fix`.

Polecenia CLI należące do pluginu są instalowane jako główne grupy poleceń `openclaw`. Po tym, jak `inspect --runtime` pokaże polecenie pod `cliCommands`, uruchom je jako `openclaw <command> ...`; na przykład plugin rejestrujący `demo-git` można zweryfikować za pomocą `openclaw demo-git ping`.

Każdy plugin jest klasyfikowany według tego, co faktycznie rejestruje w czasie działania:

- **plain-capability** — jeden typ możliwości (np. plugin tylko dostawcy)
- **hybrid-capability** — wiele typów możliwości (np. tekst + mowa + obrazy)
- **hook-only** — tylko haki, bez możliwości ani powierzchni
- **non-capability** — narzędzia/polecenia/usługi, ale bez możliwości

Zobacz [kształty pluginów](/pl/plugins/architecture#plugin-shapes), aby dowiedzieć się więcej o modelu możliwości.

<Note>
Flaga `--json` wypisuje raport czytelny maszynowo, odpowiedni do skryptowania i audytowania. `inspect --all` renderuje tabelę dla całej floty z kolumnami kształtu, rodzajów możliwości, powiadomień o zgodności, możliwości pakietu i podsumowania haków. `info` jest aliasem dla `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` zgłasza błędy ładowania pluginów, diagnostykę manifestów/wykrywania oraz powiadomienia o zgodności. Gdy wszystko jest czyste, wypisuje `No plugin issues detected.`

W przypadku niepowodzeń kształtu modułu, takich jak brakujące eksporty `register`/`activate`, uruchom ponownie z `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, aby uwzględnić zwarte podsumowanie kształtu eksportów w wyniku diagnostycznym.

### Rejestr

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Lokalny rejestr pluginów to utrwalony zimny model odczytu OpenClaw dla tożsamości zainstalowanych pluginów, stanu włączenia, metadanych źródła i własności wkładów. Normalne uruchamianie, wyszukiwanie właściciela dostawcy, klasyfikacja konfiguracji kanału i inwentarz pluginów mogą go odczytywać bez importowania modułów czasu działania pluginów.

Użyj `plugins registry`, aby sprawdzić, czy utrwalony rejestr jest obecny, aktualny lub nieaktualny. Użyj `--refresh`, aby odbudować go z utrwalonego indeksu pluginów, polityki konfiguracji oraz metadanych manifestu/pakietu. To ścieżka naprawy, a nie ścieżka aktywacji czasu działania.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` to przestarzały awaryjny przełącznik zgodności dla błędów odczytu rejestru. Preferuj `plugins registry --refresh` albo `openclaw doctor --fix`; awaryjna opcja przez zmienną środowiskową służy tylko do odzyskiwania uruchamiania w sytuacjach awaryjnych podczas wdrażania migracji.
</Warning>

### Rynek

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Lista rynku akceptuje lokalną ścieżkę rynku, ścieżkę `marketplace.json`, skrót GitHub w rodzaju `owner/repo`, adres URL repozytorium GitHub albo adres URL git. `--json` wypisuje rozwiązaną etykietę źródła oraz przeanalizowany manifest rynku i wpisy Plugin.

## Powiązane

- [Tworzenie Plugin](/pl/plugins/building-plugins)
- [Dokumentacja CLI](/pl/cli)
- [Społecznościowe Plugin](/pl/plugins/community)
