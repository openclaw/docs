---
read_when:
    - Chcesz zainstalować lub zarządzać wtyczkami Gateway albo zgodnymi pakietami
    - Chcesz debugować błędy ładowania wtyczek
summary: Dokumentacja CLI dla `openclaw plugins` (lista, instalacja, marketplace, odinstalowanie, włączanie/wyłączanie, doctor)
title: plugins
x-i18n:
    generated_at: "2026-04-05T13:49:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c35ccf68cd7be1af5fee175bd1ce7de88b81c625a05a23887e5780e790df925
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Zarządzaj wtyczkami/rozszerzeniami Gateway, pakietami hooków i zgodnymi pakietami.

Powiązane:

- System wtyczek: [Plugins](/tools/plugin)
- Zgodność pakietów: [Plugin bundles](/plugins/bundles)
- Manifest wtyczki + schemat: [Plugin manifest](/plugins/manifest)
- Utwardzanie zabezpieczeń: [Security](/gateway/security)

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
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Pakietowe wtyczki są dostarczane z OpenClaw. Niektóre są domyślnie włączone (na przykład
pakietowi dostawcy modeli, pakietowi dostawcy mowy i pakietowa wtyczka
przeglądarki); inne wymagają `plugins enable`.

Natywne wtyczki OpenClaw muszą zawierać `openclaw.plugin.json` z osadzonym
schematem JSON (`configSchema`, nawet jeśli jest pusty). Zgodne pakiety używają
zamiast tego własnych manifestów pakietów.

`plugins list` pokazuje `Format: openclaw` lub `Format: bundle`. Szczegółowe dane z `list/info`
pokazują także podtyp pakietu (`codex`, `claude` lub `cursor`) oraz wykryte
możliwości pakietu.

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

Najpierw sprawdzane są zwykłe nazwy pakietów w ClawHub, a potem w npm. Uwaga dotycząca bezpieczeństwa:
traktuj instalacje wtyczek jak uruchamianie kodu. Preferuj przypięte wersje.

Jeśli config jest nieprawidłowy, `plugins install` zwykle kończy się trybem fail-closed i informuje, aby
najpierw uruchomić `openclaw doctor --fix`. Jedynym udokumentowanym wyjątkiem jest wąska
ścieżka odzyskiwania dla pakietowych wtyczek, dla wtyczek, które jawnie włączają
`openclaw.install.allowInvalidConfigRecovery`.

`--force` ponownie używa istniejącego celu instalacji i nadpisuje już zainstalowaną
wtyczkę lub pakiet hooków na miejscu. Użyj tego, gdy celowo reinstalujesz
ten sam identyfikator z nowej ścieżki lokalnej, archiwum, pakietu ClawHub lub artefaktu npm.

`--pin` dotyczy tylko instalacji npm. Nie jest obsługiwane z `--marketplace`,
ponieważ instalacje z marketplace zapisują metadane źródła marketplace zamiast
specyfikacji npm.

`--dangerously-force-unsafe-install` to opcja awaryjna do przypadków fałszywie dodatnich
wbudowanego skanera niebezpiecznego kodu. Pozwala kontynuować instalację nawet wtedy,
gdy wbudowany skaner zgłasza ustalenia `critical`, ale **nie**
omija blokad zasad hooka `before_install` wtyczki i **nie** omija błędów skanowania.

Ta flaga CLI dotyczy przepływów instalacji/aktualizacji wtyczek. Instalacje zależności
Skills wykonywane przez Gateway używają odpowiadającego nadpisania żądania
`dangerouslyForceUnsafeInstall`, podczas gdy `openclaw skills install` pozostaje
oddzielnym przepływem pobierania/instalacji Skills z ClawHub.

`plugins install` jest także powierzchnią instalacji dla pakietów hooków, które udostępniają
`openclaw.hooks` w `package.json`. Używaj `openclaw hooks` do filtrowanej widoczności hooków
i włączania poszczególnych hooków, a nie do instalacji pakietów.

Specyfikacje npm są **tylko rejestrowe** (nazwa pakietu + opcjonalna **dokładna wersja** lub
**dist-tag**). Specyfikacje git/URL/file oraz zakresy semver są odrzucane. Instalacje
zależności są uruchamiane z `--ignore-scripts` dla bezpieczeństwa.

Zwykłe specyfikacje i `@latest` pozostają na ścieżce stabilnej. Jeśli npm rozwiąże
którąkolwiek z nich do wersji przedpremierowej, OpenClaw zatrzyma się i poprosi o jawną zgodę
z użyciem tagu przedpremierowego, takiego jak `@beta`/`@rc`, lub dokładnej wersji
przedpremierowej, takiej jak `@1.2.3-beta.4`.

Jeśli zwykła specyfikacja instalacji pasuje do identyfikatora pakietowej wtyczki (na przykład `diffs`), OpenClaw
instaluje pakietową wtyczkę bezpośrednio. Aby zainstalować pakiet npm o tej samej
nazwie, użyj jawnej specyfikacji ze scopem (na przykład `@scope/diffs`).

Obsługiwane archiwa: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Obsługiwane są również instalacje z marketplace Claude.

Instalacje ClawHub używają jawnego lokalizatora `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw preferuje teraz także ClawHub dla zwykłych specyfikacji wtyczek bezpiecznych dla npm. Przechodzi
do npm tylko wtedy, gdy ClawHub nie ma danego pakietu lub wersji:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw pobiera archiwum pakietu z ClawHub, sprawdza deklarowaną
API wtyczki / minimalną zgodność z Gateway, a następnie instaluje je standardową
ścieżką archiwum. Zarejestrowane instalacje zachowują metadane źródła ClawHub do późniejszych
aktualizacji.

Używaj skrótu `plugin@marketplace`, gdy nazwa marketplace istnieje w lokalnej pamięci podręcznej
rejestru Claude w `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Użyj `--marketplace`, jeśli chcesz jawnie przekazać źródło marketplace:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Źródłami marketplace mogą być:

- nazwa znanego marketplace Claude z `~/.claude/plugins/known_marketplaces.json`
- lokalny katalog główny marketplace lub ścieżka `marketplace.json`
- skrót repozytorium GitHub, taki jak `owner/repo`
- URL repozytorium GitHub, taki jak `https://github.com/owner/repo`
- URL git

W przypadku zdalnych marketplace wczytywanych z GitHub lub git, wpisy wtyczek muszą pozostać
wewnątrz sklonowanego repozytorium marketplace. OpenClaw akceptuje źródła ścieżek względnych z
tego repozytorium i odrzuca źródła wtyczek HTTP(S), ścieżki bezwzględne, git, GitHub i inne
źródła inne niż ścieżki z manifestów zdalnych.

Dla lokalnych ścieżek i archiwów OpenClaw automatycznie wykrywa:

- natywne wtyczki OpenClaw (`openclaw.plugin.json`)
- pakiety zgodne z Codex (`.codex-plugin/plugin.json`)
- pakiety zgodne z Claude (`.claude-plugin/plugin.json` lub domyślny układ
  komponentów Claude)
- pakiety zgodne z Cursor (`.cursor-plugin/plugin.json`)

Zgodne pakiety instalują się do standardowego katalogu głównego rozszerzeń i uczestniczą
w tym samym przepływie list/info/enable/disable. Obecnie obsługiwane są pakietowe Skills, Claude
command-skills, domyślne ustawienia Claude `settings.json`, domyślne ustawienia Claude `.lsp.json` /
`lspServers` zadeklarowane w manifeście, command-skills Cursor oraz zgodne
katalogi hooków Codex; inne wykryte możliwości pakietów są pokazywane w diagnostyce/info, ale
nie są jeszcze podłączone do wykonywania w środowisku uruchomieniowym.

### Lista

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Użyj `--enabled`, aby wyświetlić tylko wczytane wtyczki. Użyj `--verbose`, aby przełączyć się z
widoku tabeli na szczegółowe wiersze dla każdej wtyczki z metadanymi
źródła/pochodzenia/wersji/aktywacji. Użyj `--json` dla czytelnego maszynowo wykazu oraz
diagnostyki rejestru.

Użyj `--link`, aby uniknąć kopiowania lokalnego katalogu (dodaje do `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` nie jest obsługiwane z `--link`, ponieważ instalacje linkowane ponownie używają
ścieżki źródłowej zamiast kopiować do zarządzanego celu instalacji.

Użyj `--pin` przy instalacjach npm, aby zapisać rozwiązaną dokładną specyfikację (`name@version`) w
`plugins.installs`, zachowując przy tym domyślne nieprzypięte zachowanie.

### Odinstalowanie

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` usuwa rekordy wtyczek z `plugins.entries`, `plugins.installs`,
listy dozwolonych wtyczek i powiązanych wpisów `plugins.load.paths` dla linków, gdy ma to zastosowanie.
Dla aktywnych wtyczek pamięci slot pamięci jest resetowany do `memory-core`.

Domyślnie odinstalowanie usuwa także katalog instalacji wtyczki z aktywnego
katalogu głównego wtyczek state-dir. Użyj
`--keep-files`, aby zachować pliki na dysku.

`--keep-config` jest obsługiwane jako przestarzały alias dla `--keep-files`.

### Aktualizacja

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Aktualizacje dotyczą śledzonych instalacji w `plugins.installs` oraz śledzonych instalacji
pakietów hooków w `hooks.internal.installs`.

Gdy przekażesz identyfikator wtyczki, OpenClaw ponownie używa zapisanej specyfikacji instalacji dla tej
wtyczki. Oznacza to, że wcześniej zapisane dist-tagi, takie jak `@beta`, oraz dokładne przypięte
wersje będą nadal używane przy późniejszych uruchomieniach `update <id>`.

W przypadku instalacji npm możesz również przekazać jawną specyfikację pakietu npm z dist-tagiem
lub dokładną wersją. OpenClaw mapuje tę nazwę pakietu z powrotem do śledzonego rekordu wtyczki,
aktualizuje zainstalowaną wtyczkę i zapisuje nową specyfikację npm do przyszłych
aktualizacji opartych na identyfikatorze.

Gdy istnieje zapisany hash integralności i hash pobranego artefaktu się zmienia,
OpenClaw wyświetla ostrzeżenie i prosi o potwierdzenie przed kontynuacją. Użyj
globalnego `--yes`, aby pominąć monity w uruchomieniach CI/nieinteraktywnych.

`--dangerously-force-unsafe-install` jest również dostępne w `plugins update` jako
awaryjne nadpisanie dla fałszywie dodatnich wyników wbudowanego skanowania niebezpiecznego kodu podczas
aktualizacji wtyczek. Nadal nie omija blokad zasad `before_install` wtyczki
ani blokowania błędów skanowania i dotyczy wyłącznie aktualizacji wtyczek, a nie aktualizacji
pakietów hooków.

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Głęboka introspekcja pojedynczej wtyczki. Pokazuje tożsamość, stan wczytania, źródło,
zarejestrowane możliwości, hooki, narzędzia, polecenia, usługi, metody gateway,
trasy HTTP, flagi zasad, diagnostykę, metadane instalacji, możliwości pakietu
oraz wszelkie wykryte wsparcie serwerów MCP lub LSP.

Każda wtyczka jest klasyfikowana według tego, co faktycznie rejestruje w środowisku uruchomieniowym:

- **plain-capability** — jeden typ możliwości (np. wtyczka tylko dostawcy)
- **hybrid-capability** — wiele typów możliwości (np. tekst + mowa + obrazy)
- **hook-only** — tylko hooki, bez możliwości ani powierzchni
- **non-capability** — narzędzia/polecenia/usługi, ale bez możliwości

Zobacz [Plugin shapes](/plugins/architecture#plugin-shapes), aby dowiedzieć się więcej o modelu możliwości.

Flaga `--json` zwraca czytelny maszynowo raport odpowiedni do skryptów i
audytu.

`inspect --all` renderuje tabelę dla całej floty z kolumnami kształtu, rodzajów możliwości,
uwag o zgodności, możliwości pakietów i podsumowania hooków.

`info` jest aliasem dla `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` zgłasza błędy ładowania wtyczek, diagnostykę manifestu/wykrywania oraz
uwagi o zgodności. Gdy wszystko jest poprawne, wyświetla `No plugin issues
detected.`

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Polecenie list marketplace akceptuje lokalną ścieżkę marketplace, ścieżkę `marketplace.json`,
skrót GitHub, taki jak `owner/repo`, URL repozytorium GitHub lub URL git. `--json`
drukuje rozwiązaną etykietę źródła oraz sparsowany manifest marketplace i
wpisy wtyczek.
