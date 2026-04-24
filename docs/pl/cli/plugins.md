---
read_when:
    - Chcesz instalować lub zarządzać Pluginami Gateway albo zgodnymi pakietami
    - Chcesz debugować błędy ładowania Pluginów
summary: Dokumentacja CLI dla `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Pluginy
x-i18n:
    generated_at: "2026-04-24T09:03:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35ef8f54c64ea52d7618a0ef8b90d3d75841a27ae4cd689b4ca8e0cfdcddc408
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Zarządzaj Pluginami Gateway, pakietami hooków i zgodnymi pakietami.

Powiązane:

- System Pluginów: [Pluginy](/pl/tools/plugin)
- Zgodność pakietów: [Pakiety Pluginów](/pl/plugins/bundles)
- Manifest Pluginu + schemat: [Manifest Pluginu](/pl/plugins/manifest)
- Wzmacnianie bezpieczeństwa: [Bezpieczeństwo](/pl/gateway/security)

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
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Bundled pluginy są dostarczane z OpenClaw. Niektóre są domyślnie włączone (na przykład
bundled providery modeli, bundled providery mowy oraz bundled plugin
przeglądarki); inne wymagają `plugins enable`.

Natywne Pluginy OpenClaw muszą dostarczać `openclaw.plugin.json` z osadzonym schematem JSON
(`configSchema`, nawet jeśli jest pusty). Zgodne pakiety używają zamiast tego własnych manifestów pakietów.

`plugins list` pokazuje `Format: openclaw` albo `Format: bundle`. Szczegółowe wyjście `list/info`
pokazuje także podtyp pakietu (`codex`, `claude` lub `cursor`) oraz wykryte możliwości pakietu.

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

Nazwy pakietów bez kwalifikatora są najpierw sprawdzane w ClawHub, a potem w npm. Uwaga dotycząca bezpieczeństwa:
traktuj instalacje Pluginów jak uruchamianie kodu. Preferuj przypięte wersje.

Jeśli twoja sekcja `plugins` jest oparta na jednoplokowym `$include`, `plugins install/update/enable/disable/uninstall` zapisują bezpośrednio do tego dołączonego pliku i pozostawiają `openclaw.json` bez zmian. Główne includes, tablice include oraz includes z nadpisaniami rodzeństwa kończą się bezpieczną odmową zamiast spłaszczenia. Zobacz [Config includes](/pl/gateway/configuration), aby poznać obsługiwane kształty.

Jeśli konfiguracja jest nieprawidłowa, `plugins install` zwykle kończy się bezpieczną odmową i informuje, aby
najpierw uruchomić `openclaw doctor --fix`. Jedynym udokumentowanym wyjątkiem jest wąska
ścieżka odzyskiwania bundled Pluginu dla Pluginów, które jawnie wybierają
`openclaw.install.allowInvalidConfigRecovery`.

`--force` ponownie używa istniejącego celu instalacji i nadpisuje już zainstalowany
Plugin lub pakiet hooków na miejscu. Użyj tego, gdy celowo reinstalujesz
ten sam identyfikator z nowej ścieżki lokalnej, archiwum, pakietu ClawHub lub artefaktu npm.
Do rutynowych aktualizacji już śledzonego Pluginu npm preferuj
`openclaw plugins update <id-or-npm-spec>`.

Jeśli uruchomisz `plugins install` dla identyfikatora Pluginu, który jest już zainstalowany, OpenClaw
zatrzyma się i wskaże `plugins update <id-or-npm-spec>` dla zwykłej aktualizacji,
albo `plugins install <package> --force`, gdy rzeczywiście chcesz nadpisać
bieżącą instalację z innego źródła.

`--pin` dotyczy tylko instalacji npm. Nie jest obsługiwane z `--marketplace`,
ponieważ instalacje marketplace zapisują metadane źródła marketplace zamiast
specyfikacji npm.

`--dangerously-force-unsafe-install` to opcja awaryjna dla fałszywych alarmów
we wbudowanym skanerze niebezpiecznego kodu. Pozwala kontynuować instalację nawet
gdy wbudowany skaner zgłasza ustalenia `critical`, ale **nie**
omija blokad zasad hooka Pluginu `before_install` i **nie** omija
błędów skanowania.

Ta flaga CLI dotyczy przepływów instalacji/aktualizacji Pluginów. Instalacje zależności Skills
obsługiwane przez Gateway używają odpowiadającego nadpisania żądania
`dangerouslyForceUnsafeInstall`, podczas gdy `openclaw skills install` pozostaje osobnym przepływem
pobierania/instalacji Skills z ClawHub.

`plugins install` jest także powierzchnią instalacji dla pakietów hooków, które udostępniają
`openclaw.hooks` w `package.json`. Używaj `openclaw hooks` do filtrowanej widoczności hooków
i włączania poszczególnych hooków, a nie do instalacji pakietów.

Specyfikacje npm są **tylko rejestrowe** (nazwa pakietu + opcjonalna **dokładna wersja** albo
**dist-tag**). Specyfikacje git/URL/file i zakresy semver są odrzucane. Instalacje zależności
działają z `--ignore-scripts` dla bezpieczeństwa.

Specyfikacje bez kwalifikatora i `@latest` pozostają na stabilnej ścieżce. Jeśli npm rozwiąże
którekolwiek z nich do wersji przedpremierowej, OpenClaw zatrzyma się i poprosi o jawne wyrażenie zgody
przez tag przedpremierowy taki jak `@beta`/`@rc` albo dokładną wersję przedpremierową taką jak
`@1.2.3-beta.4`.

Jeśli specyfikacja instalacji bez kwalifikatora pasuje do identyfikatora bundled Pluginu (na przykład `diffs`), OpenClaw
instaluje bundled Plugin bezpośrednio. Aby zainstalować pakiet npm o tej samej
nazwie, użyj jawnej specyfikacji zakresowej (na przykład `@scope/diffs`).

Obsługiwane archiwa: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Obsługiwane są również instalacje z marketplace Claude.

Instalacje ClawHub używają jawnego lokalizatora `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw preferuje teraz także ClawHub dla bezpiecznych dla npm specyfikacji Pluginów bez kwalifikatora. Wraca
do npm tylko wtedy, gdy ClawHub nie ma tego pakietu lub wersji:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw pobiera archiwum pakietu z ClawHub, sprawdza reklamowaną
zgodność z API Pluginu / minimalną zgodność z Gateway, a następnie instaluje je przez zwykłą
ścieżkę archiwum. Zapisane instalacje zachowują swoje metadane źródła ClawHub na potrzeby późniejszych
aktualizacji.

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

Źródłami marketplace mogą być:

- nazwa known-marketplace Claude z `~/.claude/plugins/known_marketplaces.json`
- lokalny katalog główny marketplace lub ścieżka `marketplace.json`
- skrócona forma repozytorium GitHub, taka jak `owner/repo`
- adres URL repozytorium GitHub, taki jak `https://github.com/owner/repo`
- adres URL git

W przypadku zdalnych marketplace ładowanych z GitHub lub git wpisy Pluginów muszą pozostawać
wewnątrz sklonowanego repozytorium marketplace. OpenClaw akceptuje względne źródła ścieżek z
tego repozytorium i odrzuca HTTP(S), ścieżki bezwzględne, git, GitHub i inne źródła Pluginów niebędące ścieżkami z manifestów zdalnych.

Dla lokalnych ścieżek i archiwów OpenClaw automatycznie wykrywa:

- natywne Pluginy OpenClaw (`openclaw.plugin.json`)
- pakiety zgodne z Codex (`.codex-plugin/plugin.json`)
- pakiety zgodne z Claude (`.claude-plugin/plugin.json` lub domyślny układ komponentów Claude)
- pakiety zgodne z Cursor (`.cursor-plugin/plugin.json`)

Zgodne pakiety instalują się do zwykłego katalogu głównego Pluginów i uczestniczą w
tym samym przepływie list/info/enable/disable. Obecnie obsługiwane są bundle Skills,
Claude command-skills, domyślne ustawienia Claude `settings.json`, domyślne Claude `.lsp.json` /
`lspServers` zadeklarowane w manifeście, Cursor command-skills oraz zgodne
katalogi hooków Codex; inne wykryte możliwości pakietów są
pokazywane w diagnostyce/info, ale nie są jeszcze podłączone do wykonania w runtime.

### Lista

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Użyj `--enabled`, aby pokazać tylko załadowane Pluginy. Użyj `--verbose`, aby przełączyć się z
widoku tabeli na wiersze szczegółów dla każdego Pluginu ze źródłem/pochodzeniem/wersją/metadanymi
aktywacji. Użyj `--json` do inwentaryzacji czytelnej dla maszyn oraz
diagnostyki rejestru.

Użyj `--link`, aby uniknąć kopiowania lokalnego katalogu (dodaje do `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` nie jest obsługiwane z `--link`, ponieważ instalacje linkowane ponownie używają
ścieżki źródłowej zamiast kopiować do zarządzanego celu instalacji.

Użyj `--pin` przy instalacjach npm, aby zapisać dokładnie rozwiązaną specyfikację (`name@version`) w
`plugins.installs`, zachowując domyślne zachowanie bez przypięcia.

### Odinstalowanie

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` usuwa rekordy Pluginu z `plugins.entries`, `plugins.installs`,
allowlist Pluginów oraz linkowanych wpisów `plugins.load.paths`, gdy ma to zastosowanie.
W przypadku Pluginów Active Memory slot pamięci resetuje się do `memory-core`.

Domyślnie odinstalowanie usuwa również katalog instalacji Pluginu pod aktywnym
katalogiem głównym Pluginów state-dir. Użyj
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

Aktualizacje stosują się do śledzonych instalacji w `plugins.installs` oraz śledzonych instalacji
pakietów hooków w `hooks.internal.installs`.

Gdy przekażesz identyfikator Pluginu, OpenClaw ponownie użyje zapisanej specyfikacji instalacji dla tego
Pluginu. Oznacza to, że wcześniej zapisane dist-tagi takie jak `@beta` oraz dokładne przypięte
wersje nadal będą używane przy późniejszych uruchomieniach `update <id>`.

W przypadku instalacji npm możesz także przekazać jawną specyfikację pakietu npm z dist-tagiem
lub dokładną wersją. OpenClaw odwzorowuje tę nazwę pakietu z powrotem na śledzony rekord Pluginu,
aktualizuje ten zainstalowany Plugin i zapisuje nową specyfikację npm na potrzeby przyszłych
aktualizacji opartych na identyfikatorze.

Przekazanie nazwy pakietu npm bez wersji lub tagu również jest odwzorowywane z powrotem do
śledzonego rekordu Pluginu. Użyj tego, gdy Plugin był przypięty do dokładnej wersji i
chcesz przenieść go z powrotem na domyślną linię wydań rejestru.

Przed aktywną aktualizacją npm OpenClaw sprawdza zainstalowaną wersję pakietu względem metadanych
rejestru npm. Jeśli zainstalowana wersja i tożsamość zapisanego artefaktu
już odpowiadają rozwiązanemu celowi, aktualizacja jest pomijana bez
pobierania, ponownej instalacji ani przepisywania `openclaw.json`.

Gdy istnieje zapisany hash integralności i hash pobranego artefaktu się zmienia,
OpenClaw traktuje to jako dryf artefaktu npm. Interaktywne
polecenie `openclaw plugins update` drukuje oczekiwany i rzeczywisty hash oraz prosi
o potwierdzenie przed kontynuacją. Nieinteraktywne pomocniki aktualizacji kończą się bezpieczną odmową,
chyba że wywołujący dostarczy jawną politykę kontynuacji.

`--dangerously-force-unsafe-install` jest także dostępne przy `plugins update` jako
awaryjne nadpisanie dla fałszywych alarmów skanowania niebezpiecznego kodu podczas
aktualizacji Pluginów. Nadal nie omija blokad zasad Pluginu `before_install`
ani blokowania z powodu błędu skanowania, i dotyczy tylko aktualizacji Pluginów, a nie aktualizacji pakietów hooków.

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Głęboka introspekcja pojedynczego Pluginu. Pokazuje tożsamość, stan ładowania, źródło,
zarejestrowane możliwości, hooki, narzędzia, polecenia, usługi, metody Gateway,
trasy HTTP, flagi zasad, diagnostykę, metadane instalacji, możliwości pakietu,
oraz wszelką wykrytą obsługę serwerów MCP lub LSP.

Każdy Plugin jest klasyfikowany według tego, co faktycznie rejestruje w runtime:

- **plain-capability** — jeden typ możliwości (np. Plugin tylko z providerem)
- **hybrid-capability** — wiele typów możliwości (np. tekst + mowa + obrazy)
- **hook-only** — tylko hooki, bez możliwości ani powierzchni
- **non-capability** — narzędzia/polecenia/usługi, ale bez możliwości

Zobacz [Kształty Pluginów](/pl/plugins/architecture#plugin-shapes), aby dowiedzieć się więcej o modelu możliwości.

Flaga `--json` wypisuje raport czytelny dla maszyn, odpowiedni do skryptów i
audytów.

`inspect --all` renderuje tabelę dla całej floty z kolumnami kształtu, typów możliwości,
uwag o zgodności, możliwości pakietów i podsumowania hooków.

`info` to alias dla `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` raportuje błędy ładowania Pluginów, diagnostykę manifestu/wykrywania oraz
uwagi o zgodności. Gdy wszystko jest w porządku, wypisuje `No plugin issues
detected.`

W przypadku błędów kształtu modułu, takich jak brak eksportów `register`/`activate`, uruchom ponownie
z `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, aby uwzględnić zwięzłe podsumowanie kształtu eksportów w
wyjściu diagnostycznym.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Lista marketplace akceptuje lokalną ścieżkę marketplace, ścieżkę `marketplace.json`, skróconą formę
GitHub taką jak `owner/repo`, adres URL repozytorium GitHub albo adres URL git. `--json`
wypisuje rozwiązaną etykietę źródła oraz sparsowany manifest marketplace i
wpisy Pluginów.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Tworzenie Pluginów](/pl/plugins/building-plugins)
- [Pluginy społeczności](/pl/plugins/community)
