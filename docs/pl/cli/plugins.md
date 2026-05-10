---
read_when:
    - Chcesz instalować Pluginy Gateway lub zgodne pakiety albo nimi zarządzać
    - Chcesz debugować błędy ładowania pluginów
sidebarTitle: Plugins
summary: Dokumentacja referencyjna CLI dla `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Pluginy
x-i18n:
    generated_at: "2026-05-10T19:29:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6afa3ff12b3672d321d16c831672340ccde70b153671f2c328f578b5c66348b
    source_path: cli/plugins.md
    workflow: 16
---

Zarządzaj pluginami Gateway, pakietami hooków i zgodnymi pakietami.

<CardGroup cols={2}>
  <Card title="System Plugin" href="/pl/tools/plugin">
    Przewodnik dla użytkowników końcowych dotyczący instalowania, włączania i rozwiązywania problemów z pluginami.
  </Card>
  <Card title="Zarządzanie pluginami" href="/pl/plugins/manage-plugins">
    Szybkie przykłady instalacji, listowania, aktualizacji, odinstalowania i publikowania.
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

W przypadku badania wolnej instalacji, inspekcji, odinstalowania lub odświeżania rejestru uruchom
polecenie z `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Ślad zapisuje czasy faz
do stderr i zachowuje możliwość parsowania wyjścia JSON. Zobacz [Debugowanie](/pl/help/debugging#plugin-lifecycle-trace).

<Note>
W trybie Nix (`OPENCLAW_NIX_MODE=1`) mutatory cyklu życia pluginów są wyłączone. Użyj źródła Nix dla tej instalacji zamiast `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` lub `plugins disable`; dla nix-openclaw użyj agent-first [Szybkiego startu](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Dołączone pluginy są dostarczane z OpenClaw. Niektóre są domyślnie włączone (na przykład dołączeni dostawcy modeli, dołączeni dostawcy mowy i dołączony plugin przeglądarki); inne wymagają `plugins enable`.

Natywne pluginy OpenClaw muszą dostarczać `openclaw.plugin.json` z wbudowanym schematem JSON (`configSchema`, nawet jeśli jest pusty). Zgodne pakiety używają zamiast tego własnych manifestów pakietów.

`plugins list` pokazuje `Format: openclaw` lub `Format: bundle`. Szczegółowe wyjście list/info pokazuje także podtyp pakietu (`codex`, `claude` lub `cursor`) oraz wykryte możliwości pakietu.
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

Opiekunowie testujący instalacje w czasie konfiguracji mogą nadpisać automatyczne źródła instalacji pluginów
za pomocą chronionych zmiennych środowiskowych. Zobacz
[Nadpisania instalacji Plugin](/pl/plugins/install-overrides).

<Warning>
Same nazwy pakietów są domyślnie instalowane z npm podczas przełączenia startowego. Użyj `clawhub:<package>` dla ClawHub. Traktuj instalacje pluginów jak uruchamianie kodu. Preferuj przypięte wersje.
</Warning>

`plugins search` odpytuje ClawHub o instalowalne pakiety pluginów i wypisuje
nazwy pakietów gotowe do instalacji. Wyszukuje pakiety code-plugin i bundle-plugin,
a nie Skills. Użyj `openclaw skills search` dla Skills z ClawHub.

<Note>
ClawHub jest główną powierzchnią dystrybucji i odkrywania dla większości pluginów. Npm
pozostaje obsługiwaną ścieżką awaryjną i ścieżką bezpośredniej instalacji. Należące do OpenClaw
pakiety pluginów `@openclaw/*` są ponownie publikowane w npm; zobacz aktualną listę
na [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) albo
[inwentarz pluginów](/pl/plugins/plugin-inventory). Stabilne instalacje używają `latest`.
Instalacje i aktualizacje z kanału beta preferują npm `beta` dist-tag, gdy ten tag
jest dostępny, a następnie wracają do `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Dołączenia konfiguracji i naprawa nieprawidłowej konfiguracji">
    Jeśli Twoja sekcja `plugins` jest obsługiwana przez jednoplikowe `$include`, `plugins install/update/enable/disable/uninstall` zapisują do tego dołączonego pliku i pozostawiają `openclaw.json` bez zmian. Dołączenia główne, tablice dołączeń i dołączenia z nadpisaniami równorzędnymi kończą się bezpiecznym niepowodzeniem zamiast spłaszczenia. Zobacz [dołączenia konfiguracji](/pl/gateway/configuration), aby poznać obsługiwane kształty.

    Jeśli konfiguracja jest nieprawidłowa podczas instalacji, `plugins install` zwykle kończy się bezpiecznym niepowodzeniem i informuje, aby najpierw uruchomić `openclaw doctor --fix`. Podczas uruchamiania Gateway i gorącego przeładowania nieprawidłowa konfiguracja pluginów kończy się bezpiecznym niepowodzeniem jak każda inna nieprawidłowa konfiguracja; `openclaw doctor --fix` może poddać nieprawidłowy wpis pluginu kwarantannie. Jedynym udokumentowanym wyjątkiem w czasie instalacji jest wąska ścieżka odzyskiwania dołączonego pluginu dla pluginów, które jawnie wybierają `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force i ponowna instalacja kontra aktualizacja">
    `--force` używa ponownie istniejącego celu instalacji i nadpisuje już zainstalowany plugin lub pakiet hooków w miejscu. Użyj go, gdy celowo ponownie instalujesz ten sam id z nowej ścieżki lokalnej, archiwum, pakietu ClawHub lub artefaktu npm. Do rutynowych uaktualnień już śledzonego pluginu npm preferuj `openclaw plugins update <id-or-npm-spec>`.

    Jeśli uruchomisz `plugins install` dla id pluginu, który jest już zainstalowany, OpenClaw zatrzyma się i wskaże `plugins update <id-or-npm-spec>` dla normalnego uaktualnienia albo `plugins install <package> --force`, gdy rzeczywiście chcesz nadpisać bieżącą instalację z innego źródła.

  </Accordion>
  <Accordion title="Zakres --pin">
    `--pin` dotyczy tylko instalacji npm. Nie jest obsługiwane z instalacjami `git:`; użyj jawnego ref git, takiego jak `git:github.com/acme/plugin@v1.2.3`, gdy chcesz przypięte źródło. Nie jest obsługiwane z `--marketplace`, ponieważ instalacje marketplace utrwalają metadane źródła marketplace zamiast specyfikacji npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` to opcja awaryjna na wypadek fałszywych alarmów we wbudowanym skanerze niebezpiecznego kodu. Pozwala kontynuować instalację nawet wtedy, gdy wbudowany skaner zgłasza wyniki `critical`, ale **nie** omija blokad zasad hooka `before_install` pluginu i **nie** omija niepowodzeń skanowania.

    Ta flaga CLI dotyczy przepływów instalacji/aktualizacji pluginów. Instalacje zależności Skills obsługiwane przez Gateway używają odpowiadającego nadpisania żądania `dangerouslyForceUnsafeInstall`, natomiast `openclaw skills install` pozostaje osobnym przepływem pobierania/instalacji Skills z ClawHub.

    Jeśli plugin opublikowany przez Ciebie w ClawHub jest blokowany przez skan rejestru, użyj kroków wydawcy w [ClawHub](/pl/clawhub/security).

  </Accordion>
  <Accordion title="Pakiety hooków i specyfikacje npm">
    `plugins install` jest także powierzchnią instalacji dla pakietów hooków, które eksponują `openclaw.hooks` w `package.json`. Użyj `openclaw hooks` do filtrowanej widoczności hooków i włączania poszczególnych hooków, a nie do instalacji pakietów.

    Specyfikacje npm są **tylko rejestrowe** (nazwa pakietu + opcjonalna **dokładna wersja** lub **dist-tag**). Specyfikacje git/URL/plikowe oraz zakresy semver są odrzucane. Instalacje zależności uruchamiają się lokalnie dla projektu z `--ignore-scripts` ze względów bezpieczeństwa, nawet gdy Twoja powłoka ma globalne ustawienia instalacji npm. Zarządzane katalogi główne npm pluginów dziedziczą pakietowe npm `overrides` OpenClaw, więc przypięcia bezpieczeństwa hosta dotyczą także wyniesionych zależności pluginów.

    Użyj `npm:<package>`, gdy chcesz jawnie wskazać rozwiązywanie npm. Same specyfikacje pakietów również instalują bezpośrednio z npm podczas przełączenia startowego.

    Same specyfikacje i `@latest` pozostają na ścieżce stabilnej. Wersje poprawek OpenClaw oznaczone datą, takie jak `2026.5.3-1`, są stabilnymi wydaniami dla tego sprawdzenia. Jeśli npm rozwiąże którąkolwiek z nich do prerelease, OpenClaw zatrzyma się i poprosi o jawne przystąpienie za pomocą tagu prerelease, takiego jak `@beta`/`@rc`, albo dokładnej wersji prerelease, takiej jak `@1.2.3-beta.4`.

    Jeśli sama specyfikacja instalacji pasuje do oficjalnego id pluginu (na przykład `diffs`), OpenClaw instaluje bezpośrednio wpis katalogu. Aby zainstalować pakiet npm o tej samej nazwie, użyj jawnej specyfikacji z zakresem (na przykład `@scope/diffs`).

  </Accordion>
  <Accordion title="Repozytoria Git">
    Użyj `git:<repo>`, aby zainstalować bezpośrednio z repozytorium git. Obsługiwane formy obejmują `git:github.com/owner/repo`, `git:owner/repo`, pełne adresy klonowania `https://`, `ssh://`, `git://`, `file://` oraz `git@host:owner/repo.git`. Dodaj `@<ref>` lub `#<ref>`, aby przed instalacją pobrać branch, tag lub commit.

    Instalacje Git klonują do katalogu tymczasowego, przełączają na żądany ref, gdy jest obecny, a następnie używają normalnego instalatora katalogu pluginu. Oznacza to, że walidacja manifestu, skanowanie niebezpiecznego kodu, praca instalacyjna menedżera pakietów i rekordy instalacji zachowują się jak instalacje npm. Zarejestrowane instalacje git zawierają źródłowy URL/ref oraz rozwiązany commit, aby `openclaw plugins update` mogło później ponownie rozwiązać źródło.

    Po instalacji z git użyj `openclaw plugins inspect <id> --runtime --json`, aby zweryfikować rejestracje runtime, takie jak metody gateway i polecenia CLI. Jeśli plugin zarejestrował główny CLI przez `api.registerCli`, wykonaj to polecenie bezpośrednio przez główny CLI OpenClaw, na przykład `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archiwa">
    Obsługiwane archiwa: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Archiwa natywnych pluginów OpenClaw muszą zawierać prawidłowy `openclaw.plugin.json` w wyodrębnionym katalogu głównym pluginu; archiwa, które zawierają tylko `package.json`, są odrzucane, zanim OpenClaw zapisze rekordy instalacji.

    Użyj `npm-pack:<path.tgz>`, gdy plik jest tarballem npm-pack i chcesz
    przetestować tę samą ścieżkę instalacji zarządzanego katalogu głównego npm, której używają instalacje z rejestru,
    w tym weryfikację `package-lock.json`, skanowanie wyniesionych zależności i
    rekordy instalacji npm. Zwykłe ścieżki archiwów nadal instalują jako archiwa lokalne
    pod katalogiem głównym rozszerzeń pluginów.

    Instalacje marketplace Claude również są obsługiwane.

  </Accordion>
</AccordionGroup>

Instalacje ClawHub używają jawnego lokalizatora `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Same bezpieczne dla npm specyfikacje pluginów domyślnie instalują z npm podczas przełączenia startowego:

```bash
openclaw plugins install openclaw-codex-app-server
```

Użyj `npm:`, aby jawnie wskazać rozwiązywanie tylko przez npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw sprawdza deklarowane API pluginu / minimalną zgodność z Gateway przed instalacją. Gdy wybrana wersja ClawHub publikuje artefakt ClawPack, OpenClaw pobiera wersjonowany npm-pack `.tgz`, weryfikuje nagłówek skrótu ClawHub i skrót artefaktu, a następnie instaluje go przez zwykłą ścieżkę archiwum. Starsze wersje ClawHub bez metadanych ClawPack nadal instalują się przez starszą ścieżkę weryfikacji archiwum pakietu. Zarejestrowane instalacje zachowują metadane źródła ClawHub, rodzaj artefaktu, integralność npm, npm shasum, nazwę archiwum tarball oraz fakty skrótu ClawPack do późniejszych aktualizacji.
Niewersjonowane instalacje ClawHub zachowują niewersjonowaną zarejestrowaną specyfikację, dzięki czemu `openclaw plugins update` może śledzić nowsze wydania ClawHub; jawne selektory wersji lub tagów, takie jak `clawhub:pkg@1.2.3` i `clawhub:pkg@beta`, pozostają przypięte do tego selektora.

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

W przypadku ścieżek lokalnych i archiwów OpenClaw automatycznie wykrywa:

- natywne pluginy OpenClaw (`openclaw.plugin.json`)
- pakiety zgodne z Codex (`.codex-plugin/plugin.json`)
- pakiety zgodne z Claude (`.claude-plugin/plugin.json` lub domyślny układ komponentów Claude)
- pakiety zgodne z Cursor (`.cursor-plugin/plugin.json`)

<Note>
Zgodne pakiety instalują się w zwykłym katalogu głównym pluginów i uczestniczą w tym samym przepływie list/info/enable/disable. Obecnie obsługiwane są Skills pakietu, Claude command-skills, domyślne wartości Claude `settings.json`, domyślne wartości Claude `.lsp.json` / deklarowane w manifeście `lspServers`, Cursor command-skills oraz zgodne katalogi hooków Codex; inne wykryte możliwości pakietu są pokazywane w diagnostyce/info, ale nie są jeszcze podłączone do wykonywania w runtime.
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
`plugins list` najpierw odczytuje utrwalony lokalny rejestr pluginów, z awaryjną alternatywą wyprowadzoną wyłącznie z manifestu, gdy rejestru brakuje lub jest nieprawidłowy. Jest to przydatne do sprawdzania, czy plugin jest zainstalowany, włączony i widoczny dla planowania zimnego startu, ale nie jest to aktywna sonda runtime już działającego procesu Gateway. Po zmianie kodu pluginu, włączenia, zasad hooków lub `plugins.load.paths` zrestartuj Gateway obsługujący kanał, zanim będziesz oczekiwać uruchomienia nowego kodu `register(api)` lub hooków. W przypadku wdrożeń zdalnych/kontenerowych zweryfikuj, że restartujesz właściwy proces potomny `openclaw gateway run`, a nie tylko proces opakowujący.

`plugins list --json` zawiera `dependencyStatus` każdego pluginu z `package.json`
`dependencies` i `optionalDependencies`. OpenClaw sprawdza, czy te nazwy pakietów
są obecne wzdłuż zwykłej ścieżki wyszukiwania Node `node_modules` pluginu; nie
importuje kodu runtime pluginu, nie uruchamia menedżera pakietów ani nie naprawia
brakujących zależności.
</Note>

`plugins search` to zdalne wyszukiwanie w katalogu ClawHub. Nie sprawdza lokalnego
stanu, nie modyfikuje konfiguracji, nie instaluje pakietów ani nie ładuje kodu
runtime pluginu. Wyniki wyszukiwania obejmują nazwę pakietu ClawHub, rodzinę,
kanał, wersję, podsumowanie oraz podpowiedź instalacji, taką jak `openclaw plugins install clawhub:<package>`.

W przypadku pracy nad dołączonym pluginem wewnątrz spakowanego obrazu Docker podmontuj katalog
źródłowy pluginu na odpowiadającą mu spakowaną ścieżkę źródłową, taką jak
`/app/extensions/synology-chat`. OpenClaw wykryje tę podmontowaną nakładkę źródeł
przed `/app/dist/extensions/synology-chat`; zwykły skopiowany katalog źródłowy
pozostaje nieaktywny, więc standardowe spakowane instalacje nadal używają skompilowanego dist.

Do debugowania hooków runtime:

- `openclaw plugins inspect <id> --runtime --json` pokazuje zarejestrowane hooki i diagnostykę z przebiegu inspekcji z załadowanym modułem. Inspekcja runtime nigdy nie instaluje zależności; użyj `openclaw doctor --fix`, aby wyczyścić starszy stan zależności lub odzyskać brakujące pluginy do pobrania, do których odwołuje się konfiguracja.
- `openclaw gateway status --deep --require-rpc` potwierdza osiągalny Gateway, wskazówki usługi/procesu, ścieżkę konfiguracji i kondycję RPC.
- Niepakietowe hooki konwersacji (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) wymagają `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Użyj `--link`, aby uniknąć kopiowania lokalnego katalogu (dodaje do `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` nie jest obsługiwane z `--link`, ponieważ instalacje połączone używają ponownie ścieżki źródłowej zamiast kopiować do zarządzanego celu instalacji.

Użyj `--pin` przy instalacjach npm, aby zapisać rozwiązaną dokładną specyfikację (`name@version`) w zarządzanym indeksie pluginów, zachowując domyślne zachowanie bez przypięcia.
</Note>

### Indeks pluginów

Metadane instalacji pluginów to stan zarządzany maszynowo, a nie konfiguracja użytkownika. Instalacje i aktualizacje zapisują je do `plugins/installs.json` w aktywnym katalogu stanu OpenClaw. Jego mapa najwyższego poziomu `installRecords` jest trwałym źródłem metadanych instalacji, w tym rekordów dla uszkodzonych lub brakujących manifestów pluginów. Tablica `plugins` to wyprowadzona z manifestów pamięć podręczna rejestru zimnego startu. Plik zawiera ostrzeżenie, aby go nie edytować, i jest używany przez `openclaw plugins update`, odinstalowanie, diagnostykę oraz zimny rejestr pluginów.

Gdy OpenClaw widzi dostarczone starsze rekordy `plugins.installs` w konfiguracji, odczyty runtime traktują je jako dane wejściowe zgodności bez przepisywania `openclaw.json`. Jawne zapisy pluginów i `openclaw doctor --fix` przenoszą te rekordy do indeksu pluginów i usuwają klucz konfiguracji, gdy zapisy konfiguracji są dozwolone; jeśli którykolwiek zapis się nie powiedzie, rekordy konfiguracji zostają zachowane, aby metadane instalacji nie zostały utracone.

### Odinstalowanie

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` usuwa rekordy pluginów z `plugins.entries`, utrwalonego indeksu pluginów, wpisów listy zezwoleń/odmów pluginów oraz połączonych wpisów `plugins.load.paths`, gdy ma to zastosowanie. O ile `--keep-files` nie jest ustawione, odinstalowanie usuwa również śledzony zarządzany katalog instalacji, gdy znajduje się on w katalogu głównym rozszerzeń pluginów OpenClaw. W przypadku pluginów Active Memory slot pamięci resetuje się do `memory-core`.

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

Aktualizacje dotyczą śledzonych instalacji pluginów w zarządzanym indeksie pluginów oraz śledzonych instalacji hook-packów w `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Rozwiązywanie id pluginu względem specyfikacji npm">
    Gdy podajesz id pluginu, OpenClaw ponownie używa zarejestrowanej specyfikacji instalacji dla tego pluginu. Oznacza to, że wcześniej zapisane dist-tags, takie jak `@beta`, oraz dokładnie przypięte wersje nadal będą używane przy późniejszych uruchomieniach `update <id>`.

    W przypadku instalacji npm możesz też podać jawną specyfikację pakietu npm z dist-tag lub dokładną wersją. OpenClaw rozwiązuje tę nazwę pakietu z powrotem do śledzonego rekordu pluginu, aktualizuje ten zainstalowany plugin i zapisuje nową specyfikację npm do przyszłych aktualizacji opartych na id.

    Podanie nazwy pakietu npm bez wersji lub tagu również rozwiązuje ją z powrotem do śledzonego rekordu pluginu. Użyj tego, gdy plugin był przypięty do dokładnej wersji i chcesz przenieść go z powrotem na domyślną linię wydań rejestru.

  </Accordion>
  <Accordion title="Aktualizacje kanału beta">
    `openclaw plugins update` ponownie używa śledzonej specyfikacji pluginu, chyba że podasz nową specyfikację. `openclaw update` dodatkowo zna aktywny kanał aktualizacji OpenClaw: na kanale beta rekordy pluginów npm i ClawHub z domyślnej linii najpierw próbują `@beta`, a następnie wracają do zarejestrowanej specyfikacji domyślnej/latest, jeśli nie istnieje wydanie beta pluginu. Dokładne wersje i jawne tagi pozostają przypięte do tego selektora.

  </Accordion>
  <Accordion title="Sprawdzanie wersji i dryf integralności">
    Przed aktualizacją npm na żywo OpenClaw sprawdza zainstalowaną wersję pakietu względem metadanych rejestru npm. Jeśli zainstalowana wersja i zarejestrowana tożsamość artefaktu już odpowiadają rozwiązanemu celowi, aktualizacja jest pomijana bez pobierania, ponownej instalacji ani przepisywania `openclaw.json`.

    Gdy istnieje zapisany skrót integralności, a skrót pobranego artefaktu się zmienia, OpenClaw traktuje to jako dryf artefaktu npm. Interaktywne polecenie `openclaw plugins update` wypisuje oczekiwane i rzeczywiste skróty oraz prosi o potwierdzenie przed kontynuowaniem. Nieinteraktywne helpery aktualizacji domyślnie kończą się błędem, chyba że wywołujący dostarczy jawną politykę kontynuacji.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install przy aktualizacji">
    `--dangerously-force-unsafe-install` jest również dostępne w `plugins update` jako awaryjne obejście dla fałszywych trafień wbudowanego skanowania niebezpiecznego kodu podczas aktualizacji pluginów. Nadal nie omija blokad polityki `before_install` pluginu ani blokowania po niepowodzeniu skanowania i dotyczy tylko aktualizacji pluginów, a nie aktualizacji hook-packów.
  </Accordion>
</AccordionGroup>

### Inspekcja

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspekcja pokazuje tożsamość, stan ładowania, źródło, możliwości manifestu, flagi polityki, diagnostykę, metadane instalacji, możliwości pakietu oraz wykrytą obsługę serwerów MCP lub LSP bez domyślnego importowania runtime pluginu. Dodaj `--runtime`, aby załadować moduł pluginu i uwzględnić zarejestrowane hooki, narzędzia, polecenia, usługi, metody Gateway i trasy HTTP. Inspekcja runtime zgłasza brakujące zależności pluginu bezpośrednio; instalacje i naprawy pozostają w `openclaw plugins install`, `openclaw plugins update` i `openclaw doctor --fix`.

Polecenia CLI należące do pluginów są zwykle instalowane jako główne grupy poleceń `openclaw`, ale pluginy mogą też rejestrować zagnieżdżone polecenia pod nadrzędnym elementem core, takim jak `openclaw nodes`. Gdy `inspect --runtime` pokaże polecenie pod `cliCommands`, uruchom je pod wymienioną ścieżką; na przykład plugin rejestrujący `demo-git` można zweryfikować za pomocą `openclaw demo-git ping`.

Każdy plugin jest klasyfikowany według tego, co faktycznie rejestruje w runtime:

- **plain-capability** — jeden typ funkcjonalności (np. plugin tylko z providerem)
- **hybrid-capability** — wiele typów funkcjonalności (np. tekst + mowa + obrazy)
- **hook-only** — tylko hooki, bez funkcjonalności ani powierzchni
- **non-capability** — narzędzia/polecenia/usługi, ale bez funkcjonalności

Więcej o modelu funkcjonalności znajdziesz w [Kształtach Plugin](/pl/plugins/architecture#plugin-shapes).

<Note>
Flaga `--json` wypisuje raport czytelny maszynowo, odpowiedni do skryptowania i audytu. `inspect --all` renderuje tabelę dla całej floty z kolumnami kształtu, rodzajów funkcjonalności, powiadomień o zgodności, funkcjonalności pakietu oraz podsumowania hooków. `info` jest aliasem dla `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` zgłasza błędy ładowania pluginów, diagnostykę manifestu/wykrywania oraz powiadomienia o zgodności. Gdy wszystko jest w porządku, wypisuje `No plugin issues detected.`

Jeśli skonfigurowany plugin jest obecny na dysku, ale zablokowany przez kontrole bezpieczeństwa ścieżek loadera, walidacja konfiguracji zachowuje wpis pluginu i zgłasza go jako `present but blocked`. Napraw poprzedzającą diagnostykę zablokowanego pluginu, taką jak własność ścieżki lub uprawnienia do zapisu dla wszystkich, zamiast usuwać konfigurację `plugins.entries.<id>` albo `plugins.allow`.

W przypadku błędów kształtu modułu, takich jak brak eksportów `register`/`activate`, uruchom ponownie z `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, aby dołączyć zwięzłe podsumowanie kształtu eksportów do wyjścia diagnostycznego.

### Rejestr

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Lokalny rejestr pluginów to utrwalony model zimnego odczytu OpenClaw dla tożsamości zainstalowanych pluginów, ich włączenia, metadanych źródła i własności wkładów. Zwykłe uruchamianie, wyszukiwanie właściciela providera, klasyfikacja konfiguracji kanału i inwentarz pluginów mogą go odczytywać bez importowania modułów runtime pluginów.

Użyj `plugins registry`, aby sprawdzić, czy utrwalony rejestr jest obecny, aktualny lub nieaktualny. Użyj `--refresh`, aby odbudować go z utrwalonego indeksu pluginów, polityki konfiguracji i metadanych manifestu/pakietu. To ścieżka naprawy, a nie ścieżka aktywacji runtime.

`openclaw doctor --fix` naprawia też dryf zarządzanych pakietów npm sąsiadujący z rejestrem: jeśli osierocony lub odzyskany pakiet `@openclaw/*` pod zarządzanym korzeniem npm pluginów przesłania dołączony plugin, doctor usuwa ten nieaktualny pakiet i odbudowuje rejestr, aby start walidował względem dołączonego manifestu.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` to przestarzały, awaryjny przełącznik zgodności na wypadek błędów odczytu rejestru. Preferuj `plugins registry --refresh` albo `openclaw doctor --fix`; awaryjne użycie env służy tylko do odzyskiwania startu w sytuacji krytycznej podczas wdrażania migracji.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Lista Marketplace akceptuje lokalną ścieżkę marketplace, ścieżkę `marketplace.json`, skrót GitHub w rodzaju `owner/repo`, URL repozytorium GitHub albo URL git. `--json` wypisuje rozwiązaną etykietę źródła oraz sparsowany manifest marketplace i wpisy pluginów.

## Powiązane

- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Dokumentacja CLI](/pl/cli)
- [ClawHub](/pl/clawhub)
