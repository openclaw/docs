---
read_when:
    - Chcesz zainstalować Pluginy Gateway lub zgodne pakiety albo nimi zarządzać
    - Chcesz debugować błędy ładowania Plugin
sidebarTitle: Plugins
summary: Dokumentacja referencyjna CLI dla `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Pluginy
x-i18n:
    generated_at: "2026-05-03T21:28:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: d854d052b0a012a86f9c775775676a9a8fe8ae86b2c38a18118f1abf0732174c
    source_path: cli/plugins.md
    workflow: 16
---

Zarządzaj Pluginami Gateway, pakietami hooków i kompatybilnymi pakietami.

<CardGroup cols={2}>
  <Card title="System Plugin" href="/pl/tools/plugin">
    Przewodnik użytkownika końcowego dotyczący instalowania, włączania i rozwiązywania problemów z pluginami.
  </Card>
  <Card title="Zarządzanie pluginami" href="/pl/plugins/manage-plugins">
    Szybkie przykłady instalowania, wyświetlania listy, aktualizowania, odinstalowywania i publikowania.
  </Card>
  <Card title="Pakiety pluginów" href="/pl/plugins/bundles">
    Model kompatybilności pakietów.
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

Aby zbadać powolną instalację, inspekcję, odinstalowanie lub odświeżenie rejestru, uruchom polecenie z `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Ślad zapisuje czasy faz do stderr i pozostawia wyjście JSON możliwe do sparsowania. Zobacz [Debugowanie](/pl/help/debugging#plugin-lifecycle-trace).

<Note>
Dołączone pluginy są dostarczane z OpenClaw. Niektóre są domyślnie włączone (na przykład dołączeni dostawcy modeli, dołączeni dostawcy mowy i dołączony plugin przeglądarki); inne wymagają `plugins enable`.

Natywne pluginy OpenClaw muszą dostarczać `openclaw.plugin.json` z wbudowanym JSON Schema (`configSchema`, nawet jeśli jest pusty). Kompatybilne pakiety używają zamiast tego własnych manifestów pakietów.

`plugins list` pokazuje `Format: openclaw` albo `Format: bundle`. Szczegółowe wyjście listy/informacji pokazuje także podtyp pakietu (`codex`, `claude` albo `cursor`) oraz wykryte możliwości pakietu.
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
Gołe nazwy pakietów są domyślnie instalowane z npm podczas przełączenia startowego. Użyj `clawhub:<package>` dla ClawHub. Traktuj instalacje pluginów jak uruchamianie kodu. Preferuj przypięte wersje.
</Warning>

`plugins search` odpytuje ClawHub o możliwe do zainstalowania pakiety pluginów i wypisuje nazwy pakietów gotowe do instalacji. Wyszukuje pakiety code-plugin i bundle-plugin, a nie Skills. Użyj `openclaw skills search` dla ClawHub Skills.

<Note>
ClawHub jest główną powierzchnią dystrybucji i odkrywania dla większości pluginów. Npm pozostaje obsługiwaną ścieżką awaryjną i bezpośredniej instalacji. Pakiety pluginów `@openclaw/*` należące do OpenClaw są ponownie publikowane w npm; zobacz aktualną listę na [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) albo [inwentarz pluginów](/pl/plugins/plugin-inventory). Stabilne instalacje używają `latest`. Instalacje i aktualizacje z kanału beta preferują npm `beta` dist-tag, gdy ten tag jest dostępny, a następnie wracają do `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Dołączenia konfiguracji i naprawa nieprawidłowej konfiguracji">
    Jeśli twoja sekcja `plugins` jest oparta na jednoplikowym `$include`, `plugins install/update/enable/disable/uninstall` zapisują zmiany do tego dołączonego pliku i pozostawiają `openclaw.json` bez zmian. Dołączenia katalogu głównego, tablice dołączeń i dołączenia z sąsiednimi nadpisaniami kończą się bezpiecznym błędem zamiast spłaszczania. Zobacz [Dołączenia konfiguracji](/pl/gateway/configuration), aby poznać obsługiwane kształty.

    Jeśli konfiguracja jest nieprawidłowa podczas instalacji, `plugins install` zwykle kończy się bezpiecznym błędem i każe najpierw uruchomić `openclaw doctor --fix`. Podczas startu Gateway i przeładowania na gorąco nieprawidłowa konfiguracja pluginu kończy się bezpiecznym błędem jak każda inna nieprawidłowa konfiguracja; `openclaw doctor --fix` może poddać nieprawidłowy wpis pluginu kwarantannie. Jedynym udokumentowanym wyjątkiem w czasie instalacji jest wąska ścieżka odzyskiwania dla dołączonych pluginów, które jawnie włączają `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force i reinstalacja a aktualizacja">
    `--force` ponownie używa istniejącego celu instalacji i nadpisuje już zainstalowany plugin lub pakiet hooków w miejscu. Użyj tego, gdy celowo reinstalujesz ten sam identyfikator z nowej ścieżki lokalnej, archiwum, pakietu ClawHub albo artefaktu npm. Do rutynowych aktualizacji już śledzonego pluginu npm preferuj `openclaw plugins update <id-or-npm-spec>`.

    Jeśli uruchomisz `plugins install` dla identyfikatora pluginu, który jest już zainstalowany, OpenClaw zatrzyma się i wskaże `plugins update <id-or-npm-spec>` dla normalnej aktualizacji albo `plugins install <package> --force`, gdy rzeczywiście chcesz nadpisać bieżącą instalację z innego źródła.

  </Accordion>
  <Accordion title="Zakres --pin">
    `--pin` dotyczy tylko instalacji npm. Nie jest obsługiwane z instalacjami `git:`; użyj jawnego ref git, takiego jak `git:github.com/acme/plugin@v1.2.3`, gdy chcesz przypięte źródło. Nie jest obsługiwane z `--marketplace`, ponieważ instalacje z marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` to opcja awaryjna dla fałszywych alarmów we wbudowanym skanerze niebezpiecznego kodu. Pozwala kontynuować instalację nawet wtedy, gdy wbudowany skaner zgłasza ustalenia `critical`, ale **nie** omija blokad zasad hooka `before_install` pluginu i **nie** omija niepowodzeń skanowania.

    Ta flaga CLI dotyczy przepływów instalacji/aktualizacji pluginów. Instalacje zależności Skills obsługiwane przez Gateway używają odpowiadającego nadpisania żądania `dangerouslyForceUnsafeInstall`, podczas gdy `openclaw skills install` pozostaje osobnym przepływem pobierania/instalacji ClawHub Skills.

    Jeśli plugin opublikowany przez ciebie w ClawHub jest blokowany przez skan rejestru, użyj kroków dla wydawcy w [ClawHub](/pl/tools/clawhub).

  </Accordion>
  <Accordion title="Pakiety hooków i specyfikacje npm">
    `plugins install` jest także powierzchnią instalacji dla pakietów hooków, które ujawniają `openclaw.hooks` w `package.json`. Użyj `openclaw hooks` do filtrowanej widoczności hooków i włączania poszczególnych hooków, a nie do instalacji pakietów.

    Specyfikacje npm są **tylko rejestrowe** (nazwa pakietu + opcjonalnie **dokładna wersja** albo **dist-tag**). Specyfikacje Git/URL/plikowe oraz zakresy semver są odrzucane. Instalacje zależności są uruchamiane lokalnie dla projektu z `--ignore-scripts` dla bezpieczeństwa, nawet gdy twoja powłoka ma globalne ustawienia instalacji npm.

    Użyj `npm:<package>`, gdy chcesz jawnie wymusić rozwiązywanie npm. Gołe specyfikacje pakietów także instalują bezpośrednio z npm podczas przełączenia startowego.

    Gołe specyfikacje i `@latest` pozostają na stabilnej ścieżce. Jeśli npm rozwiąże którykolwiek z nich do wersji prerelease, OpenClaw zatrzyma się i poprosi o jawne przystąpienie za pomocą tagu prerelease, takiego jak `@beta`/`@rc`, albo dokładnej wersji prerelease, takiej jak `@1.2.3-beta.4`.

    Jeśli goła specyfikacja instalacji pasuje do oficjalnego identyfikatora pluginu (na przykład `diffs`), OpenClaw instaluje wpis katalogu bezpośrednio. Aby zainstalować pakiet npm o tej samej nazwie, użyj jawnej specyfikacji z zakresem (na przykład `@scope/diffs`).

  </Accordion>
  <Accordion title="Repozytoria Git">
    Użyj `git:<repo>`, aby zainstalować bezpośrednio z repozytorium git. Obsługiwane formy obejmują `git:github.com/owner/repo`, `git:owner/repo`, pełne adresy URL klonowania `https://`, `ssh://`, `git://`, `file://` oraz `git@host:owner/repo.git`. Dodaj `@<ref>` albo `#<ref>`, aby przed instalacją pobrać gałąź, tag albo commit.

    Instalacje Git klonują do katalogu tymczasowego, pobierają żądany ref, gdy jest obecny, a następnie używają normalnego instalatora katalogu pluginu. Oznacza to, że walidacja manifestu, skanowanie niebezpiecznego kodu, praca instalacyjna menedżera pakietów i rekordy instalacji zachowują się jak instalacje npm. Zarejestrowane instalacje git obejmują źródłowy URL/ref oraz rozwiązany commit, aby `openclaw plugins update` mógł później ponownie rozwiązać źródło.

    Po instalacji z git użyj `openclaw plugins inspect <id> --runtime --json`, aby zweryfikować rejestracje runtime, takie jak metody gateway i polecenia CLI. Jeśli plugin zarejestrował korzeń CLI za pomocą `api.registerCli`, wykonaj to polecenie bezpośrednio przez główne CLI OpenClaw, na przykład `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archiwa">
    Obsługiwane archiwa: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archiwa natywnych pluginów OpenClaw muszą zawierać prawidłowy `openclaw.plugin.json` w wyodrębnionym katalogu głównym pluginu; archiwa zawierające tylko `package.json` są odrzucane, zanim OpenClaw zapisze rekordy instalacji.

    Instalacje z marketplace Claude są także obsługiwane.

  </Accordion>
</AccordionGroup>

Instalacje ClawHub używają jawnego lokalizatora `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Gołe, bezpieczne dla npm specyfikacje pluginów są domyślnie instalowane z npm podczas przełączenia startowego:

```bash
openclaw plugins install openclaw-codex-app-server
```

Użyj `npm:`, aby jawnie wymusić rozwiązywanie tylko przez npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw sprawdza deklarowaną kompatybilność API pluginu / minimalnego Gateway przed instalacją. Gdy wybrana wersja ClawHub publikuje artefakt ClawPack, OpenClaw pobiera wersjonowany npm-pack `.tgz`, weryfikuje nagłówek skrótu ClawHub i skrót artefaktu, a następnie instaluje go przez normalną ścieżkę archiwum. Starsze wersje ClawHub bez metadanych ClawPack nadal instalują się przez starszą ścieżkę weryfikacji archiwum pakietu. Zarejestrowane instalacje zachowują metadane źródła ClawHub, rodzaj artefaktu, integralność npm, npm shasum, nazwę tarballa i fakty skrótu ClawPack do późniejszych aktualizacji.
Niewersjonowane instalacje ClawHub zachowują niewersjonowaną zarejestrowaną specyfikację, aby `openclaw plugins update` mogło śledzić nowsze wydania ClawHub; jawne selektory wersji lub tagu, takie jak `clawhub:pkg@1.2.3` i `clawhub:pkg@beta`, pozostają przypięte do tego selektora.

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
    W przypadku zdalnych marketplace wczytywanych z GitHub lub git wpisy pluginów muszą pozostać wewnątrz sklonowanego repozytorium marketplace. OpenClaw akceptuje źródła ze ścieżkami względnymi z tego repozytorium i odrzuca źródła pluginów typu HTTP(S), ścieżka bezwzględna, git, GitHub oraz inne źródła niebędące ścieżkami ze zdalnych manifestów.
  </Tab>
</Tabs>

W przypadku lokalnych ścieżek i archiwów OpenClaw wykrywa automatycznie:

- natywne pluginy OpenClaw (`openclaw.plugin.json`)
- pakiety zgodne z Codex (`.codex-plugin/plugin.json`)
- pakiety zgodne z Claude (`.claude-plugin/plugin.json` lub domyślny układ komponentów Claude)
- pakiety zgodne z Cursor (`.cursor-plugin/plugin.json`)

<Note>
Zgodne pakiety instalują się w normalnym katalogu głównym pluginów i uczestniczą w tym samym przepływie list/info/enable/disable. Obecnie obsługiwane są Skills pakietów, Skills poleceń Claude, domyślne wartości `settings.json` Claude, domyślne wartości `.lsp.json` Claude / zadeklarowane w manifeście domyślne wartości `lspServers`, Skills poleceń Cursor oraz zgodne katalogi hooków Codex; inne wykryte możliwości pakietów są pokazywane w diagnostyce/informacjach, ale nie są jeszcze podłączone do wykonywania w czasie działania.
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
  Przełącz z widoku tabeli na osobne wiersze szczegółów dla każdego pluginu z metadanymi źródła/pochodzenia/wersji/aktywacji.
</ParamField>
<ParamField path="--json" type="boolean">
  Czytelny maszynowo spis wraz z diagnostyką rejestru i stanem instalacji zależności pakietu.
</ParamField>

<Note>
`plugins list` najpierw odczytuje utrwalony lokalny rejestr pluginów, z awaryjnym wariantem wyprowadzonym wyłącznie z manifestów, gdy rejestru brakuje lub jest nieprawidłowy. Jest przydatne do sprawdzania, czy plugin jest zainstalowany, włączony i widoczny dla planowania zimnego startu, ale nie jest sondą runtime już działającego procesu Gateway. Po zmianie kodu pluginu, włączenia, zasad hooków lub `plugins.load.paths` zrestartuj Gateway obsługujący kanał, zanim oczekujesz uruchomienia nowego kodu `register(api)` lub hooków. W przypadku wdrożeń zdalnych/kontenerowych upewnij się, że restartujesz rzeczywisty proces potomny `openclaw gateway run`, a nie tylko proces opakowujący.

`plugins list --json` zawiera `dependencyStatus` każdego pluginu z `package.json`
`dependencies` i `optionalDependencies`. OpenClaw sprawdza, czy te nazwy pakietów
są obecne w normalnej ścieżce wyszukiwania Node `node_modules` pluginu; nie
importuje kodu runtime pluginu, nie uruchamia menedżera pakietów ani nie naprawia
brakujących zależności.
</Note>

`plugins search` to zdalne wyszukiwanie w katalogu ClawHub. Nie sprawdza stanu
lokalnego, nie modyfikuje konfiguracji, nie instaluje pakietów ani nie wczytuje
kodu runtime pluginu. Wyniki wyszukiwania obejmują nazwę pakietu ClawHub,
rodzinę, kanał, wersję, podsumowanie oraz wskazówkę instalacji, taką jak
`openclaw plugins install clawhub:<package>`.

W przypadku pracy nad wbudowanym pluginem wewnątrz spakowanego obrazu Docker zamontuj przez bind mount katalog źródłowy pluginu na odpowiadającej mu spakowanej ścieżce źródłowej, takiej jak
`/app/extensions/synology-chat`. OpenClaw wykryje tę zamontowaną nakładkę źródeł
przed `/app/dist/extensions/synology-chat`; zwykły skopiowany katalog źródłowy
pozostaje bezczynny, więc normalne spakowane instalacje nadal używają skompilowanego dist.

Do debugowania hooków runtime:

- `openclaw plugins inspect <id> --runtime --json` pokazuje zarejestrowane hooki i diagnostykę z przebiegu inspekcji z wczytaniem modułu. Inspekcja runtime nigdy nie instaluje zależności; użyj `openclaw doctor --fix`, aby wyczyścić starszy stan zależności lub zainstalować brakujące skonfigurowane pluginy możliwe do pobrania.
- `openclaw gateway status --deep --require-rpc` potwierdza osiągalny Gateway, wskazówki usługi/procesu, ścieżkę konfiguracji i kondycję RPC.
- Niewbudowane hooki konwersacyjne (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) wymagają `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Użyj `--link`, aby uniknąć kopiowania lokalnego katalogu (dodaje do `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` nie jest obsługiwane z `--link`, ponieważ instalacje linkowane ponownie używają ścieżki źródłowej zamiast kopiować na zarządzany cel instalacji.

Użyj `--pin` przy instalacjach npm, aby zapisać rozwiązaną dokładną specyfikację (`name@version`) w zarządzanym indeksie pluginów, zachowując domyślne zachowanie bez przypięcia.
</Note>

### Indeks pluginów

Metadane instalacji pluginów są stanem zarządzanym maszynowo, a nie konfiguracją użytkownika. Instalacje i aktualizacje zapisują je do `plugins/installs.json` w aktywnym katalogu stanu OpenClaw. Jego mapa najwyższego poziomu `installRecords` jest trwałym źródłem metadanych instalacji, w tym rekordów uszkodzonych lub brakujących manifestów pluginów. Tablica `plugins` to wyprowadzona z manifestów pamięć podręczna zimnego rejestru. Plik zawiera ostrzeżenie, aby go nie edytować, i jest używany przez `openclaw plugins update`, odinstalowanie, diagnostykę oraz zimny rejestr pluginów.

Gdy OpenClaw zobaczy w konfiguracji dostarczone starsze rekordy `plugins.installs`, przenosi je do indeksu pluginów i usuwa klucz konfiguracji; jeśli którykolwiek zapis się nie powiedzie, rekordy konfiguracji są zachowywane, aby metadane instalacji nie zostały utracone.

### Odinstalowanie

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` usuwa rekordy pluginów z `plugins.entries`, utrwalonego indeksu pluginów, wpisów listy zezwalania/odmowy pluginów oraz linkowanych wpisów `plugins.load.paths`, gdy ma to zastosowanie. O ile nie ustawiono `--keep-files`, odinstalowanie usuwa też śledzony zarządzany katalog instalacji, gdy znajduje się on wewnątrz katalogu głównego rozszerzeń pluginów OpenClaw. W przypadku pluginów Active Memory slot pamięci resetuje się do `memory-core`.

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
    Gdy podasz identyfikator pluginu, OpenClaw ponownie użyje zapisanej specyfikacji instalacji dla tego pluginu. Oznacza to, że wcześniej zapisane tagi dystrybucji, takie jak `@beta`, oraz dokładnie przypięte wersje będą nadal używane przy późniejszych uruchomieniach `update <id>`.

    W przypadku instalacji npm możesz też podać jawną specyfikację pakietu npm z tagiem dystrybucji lub dokładną wersją. OpenClaw rozwiązuje tę nazwę pakietu z powrotem do śledzonego rekordu pluginu, aktualizuje ten zainstalowany plugin i zapisuje nową specyfikację npm na potrzeby przyszłych aktualizacji opartych na identyfikatorze.

    Podanie nazwy pakietu npm bez wersji lub tagu również rozwiązuje ją z powrotem do śledzonego rekordu pluginu. Użyj tego, gdy plugin był przypięty do dokładnej wersji i chcesz przenieść go z powrotem na domyślną linię wydań rejestru.

  </Accordion>
  <Accordion title="Aktualizacje kanału beta">
    `openclaw plugins update` ponownie używa śledzonej specyfikacji pluginu, chyba że podasz nową specyfikację. `openclaw update` dodatkowo zna aktywny kanał aktualizacji OpenClaw: na kanale beta rekordy pluginów npm i ClawHub z domyślnej linii najpierw próbują `@beta`, a potem wracają do zapisanej domyślnej/najnowszej specyfikacji, jeśli nie istnieje wydanie beta pluginu. Dokładne wersje i jawne tagi pozostają przypięte do tego selektora.

  </Accordion>
  <Accordion title="Kontrole wersji i dryf integralności">
    Przed aktualizacją npm na żywo OpenClaw sprawdza zainstalowaną wersję pakietu względem metadanych rejestru npm. Jeśli zainstalowana wersja i zapisana tożsamość artefaktu już odpowiadają rozwiązanemu celowi, aktualizacja jest pomijana bez pobierania, ponownej instalacji ani przepisywania `openclaw.json`.

    Gdy istnieje zapisany skrót integralności, a skrót pobranego artefaktu się zmieni, OpenClaw traktuje to jako dryf artefaktu npm. Interaktywne polecenie `openclaw plugins update` wypisuje oczekiwane i rzeczywiste skróty oraz prosi o potwierdzenie przed kontynuacją. Nieinteraktywne pomocniki aktualizacji kończą się bezpiecznym błędem, chyba że wywołujący poda jawną politykę kontynuacji.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install przy aktualizacji">
    `--dangerously-force-unsafe-install` jest również dostępne w `plugins update` jako awaryjne obejście fałszywych alarmów wbudowanego skanowania niebezpiecznego kodu podczas aktualizacji pluginów. Nadal nie omija blokad zasad `before_install` pluginu ani blokowania po niepowodzeniu skanowania, a dotyczy tylko aktualizacji pluginów, nie aktualizacji pakietów hooków.
  </Accordion>
</AccordionGroup>

### Inspekcja

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspekcja domyślnie pokazuje tożsamość, stan wczytania, źródło, możliwości manifestu, flagi zasad, diagnostykę, metadane instalacji, możliwości pakietu oraz każdą wykrytą obsługę serwera MCP lub LSP bez importowania kodu runtime pluginu. Dodaj `--runtime`, aby wczytać moduł pluginu i uwzględnić zarejestrowane hooki, narzędzia, polecenia, usługi, metody Gateway oraz trasy HTTP. Inspekcja runtime zgłasza brakujące zależności pluginów bezpośrednio; instalacje i naprawy pozostają w `openclaw plugins install`, `openclaw plugins update` i `openclaw doctor --fix`.

Polecenia CLI należące do pluginów są instalowane jako główne grupy poleceń `openclaw`. Gdy `inspect --runtime` pokaże polecenie w `cliCommands`, uruchom je jako `openclaw <command> ...`; na przykład plugin rejestrujący `demo-git` można zweryfikować poleceniem `openclaw demo-git ping`.

Każdy plugin jest klasyfikowany według tego, co faktycznie rejestruje w runtime:

- **plain-capability** — jeden typ możliwości (np. plugin wyłącznie dostawcy)
- **hybrid-capability** — wiele typów możliwości (np. tekst + mowa + obrazy)
- **hook-only** — tylko hooki, bez możliwości ani powierzchni
- **non-capability** — narzędzia/polecenia/usługi, ale bez możliwości

Zobacz [kształty pluginów](/pl/plugins/architecture#plugin-shapes), aby dowiedzieć się więcej o modelu możliwości.

<Note>
Flaga `--json` wypisuje czytelny maszynowo raport odpowiedni do skryptów i audytu. `inspect --all` renderuje tabelę dla całej floty z kolumnami kształtu, rodzajów możliwości, powiadomień o zgodności, możliwości pakietów i podsumowania hooków. `info` jest aliasem `inspect`.
</Note>

### Diagnostyka

```bash
openclaw plugins doctor
```

`doctor` zgłasza błędy wczytywania pluginów, diagnostykę manifestów/wykrywania i powiadomienia o zgodności. Gdy wszystko jest czyste, wypisuje `No plugin issues detected.`

Jeśli skonfigurowany plugin jest obecny na dysku, ale blokowany przez kontrole bezpieczeństwa ścieżek loadera, walidacja konfiguracji zachowuje wpis pluginu i zgłasza go jako `present but blocked`. Napraw wcześniejszą diagnostykę zablokowanego pluginu, taką jak własność ścieżki lub uprawnienia zapisu dla wszystkich, zamiast usuwać konfigurację `plugins.entries.<id>` lub `plugins.allow`.

W przypadku niepowodzeń kształtu modułu, takich jak brakujące eksporty `register`/`activate`, uruchom ponownie z `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, aby dołączyć zwięzłe podsumowanie kształtu eksportów w wyniku diagnostycznym.

### Rejestr

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Lokalny rejestr pluginów to utrwalony zimny model odczytu OpenClaw dla tożsamości zainstalowanych pluginów, włączenia, metadanych źródła i własności wkładu. Normalne uruchamianie, wyszukiwanie właściciela dostawcy, klasyfikacja konfiguracji kanału i spis pluginów mogą go odczytywać bez importowania modułów runtime pluginów.

Użyj `plugins registry`, aby sprawdzić, czy utrwalony rejestr jest obecny, aktualny czy nieaktualny. Użyj `--refresh`, aby odbudować go na podstawie utrwalonego indeksu Plugin, zasad konfiguracji oraz metadanych manifestu/pakietu. To ścieżka naprawy, a nie ścieżka aktywacji w czasie wykonywania.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` to przestarzały awaryjny przełącznik zgodności na wypadek błędów odczytu rejestru. Preferuj `plugins registry --refresh` lub `openclaw doctor --fix`; awaryjne użycie zmiennej środowiskowej służy wyłącznie do odzyskiwania uruchamiania w sytuacjach awaryjnych podczas wdrażania migracji.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Lista Marketplace akceptuje lokalną ścieżkę marketplace, ścieżkę `marketplace.json`, skrót GitHub taki jak `owner/repo`, adres URL repozytorium GitHub albo adres URL git. `--json` wypisuje rozpoznaną etykietę źródła oraz sparsowany manifest marketplace i wpisy Plugin.

## Powiązane

- [Tworzenie Plugin](/pl/plugins/building-plugins)
- [Dokumentacja CLI](/pl/cli)
- [Społecznościowe Plugin](/pl/plugins/community)
