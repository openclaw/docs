---
doc-schema-version: 1
read_when:
    - Chcesz przeglądać, instalować, włączać lub wyłączać pluginy w interfejsie Control UI
    - Potrzebujesz krótkich przykładów wyświetlania listy pluginów, instalowania, aktualizowania, sprawdzania lub odinstalowywania
    - Chcesz wybrać źródło instalacji pluginu
    - Potrzebujesz odpowiedniej dokumentacji dotyczącej publikowania pakietów pluginów
sidebarTitle: Manage plugins
summary: Zarządzaj pluginami OpenClaw z poziomu interfejsu Control UI lub CLI
title: Zarządzanie pluginami
x-i18n:
    generated_at: "2026-07-16T18:44:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2e22483a7bfb6da4f1eafef036ebc1e2151a725e21565e0634c615ff2f168c1d
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Interfejs Control UI obsługuje typowy proces wyszukiwania, instalowania, włączania
i wyłączania. CLI zapewnia dodatkowo aktualizowanie, odinstalowywanie, konfigurację
zaawansowaną oraz jawne sterowanie źródłem instalacji. Pełny opis poleceń, flag,
reguł wyboru źródła i przypadków brzegowych zawiera [`openclaw plugins`](/pl/cli/plugins).

Typowy proces w CLI: znaleźć pakiet, zainstalować go z ClawHub, npm, git lub
ścieżki lokalnej, zaczekać na automatyczne ponowne uruchomienie zarządzanego
Gateway (albo uruchomić go ponownie ręcznie), a następnie zweryfikować rejestracje
środowiska wykonawczego pluginu.

## Korzystanie z Control UI

Otwórz **Plugins** w Control UI lub użyj `/settings/plugins` względem
skonfigurowanej ścieżki bazowej Control UI. Na przykład ścieżka bazowa
`/openclaw` używa `/openclaw/settings/plugins`. Strona zawiera dwie karty:

- **Zainstalowane** wyświetla pełny lokalny spis pogrupowany według kategorii (kanały,
  dostawcy modeli, pamięć, narzędzia). Każdy wiersz otwiera widok szczegółów; jego
  menu dodatkowych opcji (`…`) umożliwia włączenie lub wyłączenie
  pluginu, a w przypadku pluginów zainstalowanych zewnętrznie oferuje opcję
  **Usuń**. Karta zawiera również skonfigurowane
  [serwery MCP](/pl/cli/mcp), z tymi samymi dostępnymi z menu operacjami włączania,
  wyłączania i usuwania, które edytują `mcp.servers` w konfiguracji Gateway.
- **Odkrywanie** to sklep: wyróżnione pluginy dołączone do OpenClaw, oficjalne
  pluginy zewnętrzne oraz wyselekcjonowany katalog konektorów. Karty konektorów
  dodają hostowany serwer MCP jednym kliknięciem (GitHub, Notion, Linear, Sentry,
  Home Assistant) albo otwierają wstępnie wypełnione wyszukiwanie w ClawHub.
  Wpisywanie w polu wyszukiwania wysyła zapytania bezpośrednio do
  [ClawHub](https://clawhub.ai/plugins) i dodaje sekcję **Z ClawHub** z liczbą
  pobrań oraz odznakami weryfikacji źródła.

Dołączone pluginy nie wymagają instalowania pakietu. Ich działaniem w menu jest
**Włącz** lub **Wyłącz**. Na przykład Workboard jest dołączony do OpenClaw
i domyślnie wyłączony, dlatego należy wybrać **Włącz**, aby go uruchomić.
Pluginów dołączonych nie można usuwać, a jedynie wyłączać.

Dostęp do katalogu i wyszukiwania wymaga `operator.read`. Instalowanie,
włączanie, wyłączanie, usuwanie i zmiany serwerów MCP wymagają
`operator.admin`. Instalację z ClawHub wykonuje Gateway, zachowując kontrole
zasad zaufania, integralności i instalowania pluginów. Włączenie zainstalowanego
pluginu przez administratora również rejestruje to jawne zaufanie przez dodanie
wybranego pluginu do istniejącej restrykcyjnej listy `plugins.allow`. Jawny
wpis `plugins.deny` pozostaje nadrzędny i należy go usunąć przed włączeniem
pluginu.

Zainstalowanie lub usunięcie kodu pluginu wymaga ponownego uruchomienia Gateway.
Zmiany stanu włączenia można zastosować bez ponownego uruchomienia, jeśli
zainstalowany plugin i bieżące środowisko wykonawcze Gateway to obsługują;
w przeciwnym razie interfejs informuje o konieczności ponownego uruchomienia.
Konektory MCP korzystające z OAuth nadal wymagają jednorazowego
`openclaw mcp login <name>` w CLI po ich dodaniu.

Control UI nie instaluje z dowolnych źródeł npm, git ani ścieżek lokalnych,
nie aktualizuje pluginów ani nie udostępnia rozbudowanej konfiguracji pluginów.
Do tych operacji służą opisane poniżej procesy CLI.

## Wyświetlanie i wyszukiwanie pluginów

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

`--json` dla skryptów:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` to kontrola spisu w stanie zimnym: pokazuje, co OpenClaw
może wykryć na podstawie konfiguracji, manifestów i utrwalonego rejestru
pluginów. Nie dowodzi, że już uruchomiony Gateway zaimportował środowisko
wykonawcze pluginu. Dane wyjściowe JSON zawierają diagnostykę rejestru oraz
`dependencyStatus` każdego pluginu (czy zadeklarowane
`dependencies`/`optionalDependencies` można odnaleźć na dysku).

`plugins search` wysyła zapytanie do ClawHub o możliwe do zainstalowania
pakiety pluginów i wyświetla wskazówkę instalacji (`openclaw plugins install clawhub:<package>`) przy
każdym wyniku.

## Włączanie i wyłączanie pluginów

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

Przełącza wpis konfiguracji pluginu bez modyfikowania zainstalowanych plików.
Niektóre dołączone pluginy (dołączeni dostawcy modeli/mowy oraz dołączony plugin
przeglądarki) są domyślnie włączone; inne wymagają `enable` po
instalacji.

## Instalowanie pluginów

```bash
# Wyszukaj pakiety pluginów w ClawHub.
openclaw plugins search "calendar"

# Zainstaluj z ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Zainstaluj z npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Zainstaluj z lokalnego artefaktu npm-pack.
openclaw plugins install npm-pack:<path.tgz>

# Zainstaluj z git lub lokalnej kopii roboczej używanej do programowania.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Specyfikacje pakietów bez prefiksu są instalowane z npm podczas przejścia
uruchomieniowego, chyba że nazwa odpowiada identyfikatorowi dołączonego lub
oficjalnego pluginu — wtedy OpenClaw używa zamiast tego kopii lokalnej/oficjalnej.
Aby deterministycznie wybrać źródło, należy użyć `clawhub:`,
`npm:`, `git:` lub `npm-pack:`. Pakiety z
dołączonego i oficjalnego katalogu OpenClaw są uznawane za zaufane na równi
z pakietami ClawHub. Nowe, dowolne źródła npm, git, lokalne ścieżki/archiwa,
`npm-pack:` lub źródła marketplace wymagają `--force`
w instalacjach nieinteraktywnych po sprawdzeniu źródła i uznaniu go za zaufane.

`--force` potwierdza źródło inne niż ClawHub bez wyświetlania monitu
i w razie potrzeby zastępuje istniejący cel instalacji. Do rutynowych aktualizacji
śledzonej instalacji npm, ClawHub lub hook-pack należy zamiast tego użyć
`openclaw plugins update`. W przypadku `--link` opcja
`--force` jedynie potwierdza źródło; powiązany katalog nie jest
kopiowany ani zastępowany.

## Ponowne uruchamianie i sprawdzanie

Uruchomiony zarządzany Gateway z włączonym przeładowywaniem konfiguracji
automatycznie uruchamia się ponownie po zainstalowaniu, zaktualizowaniu lub
odinstalowaniu kodu pluginu. Jeśli Gateway nie jest zarządzany lub przeładowywanie
jest wyłączone, przed sprawdzeniem aktywnych powierzchni środowiska wykonawczego
należy uruchomić go ponownie ręcznie:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` ładuje moduł pluginu i dowodzi, że zarejestrował on
powierzchnie środowiska wykonawczego (narzędzia, hooki, usługi, metody Gateway,
trasy HTTP, polecenia CLI należące do pluginu). Zwykłe `inspect`
i `list` wykonują jedynie kontrole manifestu, konfiguracji i rejestru
w stanie zimnym.

## Aktualizowanie pluginów

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Przekazanie identyfikatora pluginu powoduje ponowne użycie jego śledzonej
specyfikacji instalacji: zapisane znaczniki dist-tag (`@beta`) oraz
dokładnie przypięte wersje są zachowywane podczas kolejnych uruchomień
`update <plugin-id>`.

`openclaw plugins update --all` to ścieżka zbiorczej konserwacji. Nadal respektuje zwykłe
śledzone specyfikacje instalacji, ale rekordy zaufanych oficjalnych pluginów
OpenClaw są synchronizowane z bieżącym celem oficjalnego katalogu, zamiast
pozostawać przypięte do nieaktualnego, dokładnie określonego oficjalnego pakietu;
gdy `update.channel` ma wartość `beta`, synchronizacja preferuje
linię wydań beta. Aby zachować dokładną lub oznaczoną specyfikację oficjalną bez
zmian, należy użyć ukierunkowanego `update <plugin-id>`.

W przypadku instalacji npm należy przekazać jawną specyfikację pakietu, aby
zmienić śledzony rekord:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Drugie polecenie przenosi plugin z powrotem do domyślnej linii wydań rejestru,
jeśli wcześniej był przypięty do dokładnej wersji lub znacznika.

Dokładne reguły mechanizmu awaryjnego i przypinania zawiera
[`openclaw plugins`](/pl/cli/plugins#update).

## Odinstalowywanie pluginów

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

Odinstalowanie usuwa wpis konfiguracji pluginu, utrwalony rekord indeksu
pluginów, wpisy list zezwalających/odmawiających oraz powiązane wpisy
`plugins.load.paths`, jeśli mają zastosowanie. Zarządzany katalog instalacyjny
jest usuwany, chyba że zostanie przekazane `--keep-files`. Uruchomiony
zarządzany Gateway automatycznie uruchamia się ponownie, gdy odinstalowanie
zmienia źródło pluginu.

W trybie Nix (`OPENCLAW_NIX_MODE=1`) instalowanie, aktualizowanie,
odinstalowywanie, włączanie i wyłączanie pluginów jest wyłączone; tymi ustawieniami
należy zarządzać w źródle Nix danej instalacji.

## Wybieranie źródła

| Źródło      | Kiedy używać                                                                 | Przykład                                                       |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Potrzebne jest natywne dla OpenClaw wyszukiwanie, podsumowania skanowania, wersje i wskazówki | `openclaw plugins install clawhub:<package>`                   |
| git         | Potrzebna jest gałąź, znacznik lub commit z repozytorium                     | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| ścieżka lokalna | Plugin jest tworzony lub testowany na tym samym komputerze              | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Instalowany jest plugin marketplace zgodny z Claude                         | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm pack    | Lokalny artefakt pakietu jest weryfikowany za pomocą semantyki instalacji npm | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | Pakiety JavaScript są już publikowane lub wymagane są znaczniki dist-tag npm/rejestr prywatny | `openclaw plugins install npm:@acme/openclaw-plugin`           |

Zarządzane instalacje ze ścieżek lokalnych muszą wskazywać katalogi pluginów
lub archiwa. Samodzielne pliki pluginów należy umieszczać w
`plugins.load.paths`, zamiast instalować je za pomocą `plugins install`.

## Publikowanie pluginów

ClawHub jest główną publiczną powierzchnią wyszukiwania pluginów OpenClaw.
Należy publikować w nim, jeśli użytkownicy mają znajdować metadane pluginu,
historię wersji, wyniki skanowania rejestru oraz wskazówki instalacji przed
zainstalowaniem.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Natywne pluginy npm przed publikacją muszą zawierać manifest pluginu
(`openclaw.plugin.json`) oraz metadane `package.json`:

```json package.json
{
  "name": "@acme/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

```bash
npm publish --access public
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Pełny opis umowy publikowania znajduje się na poniższych stronach; ta strona
nie powinna służyć jako dokumentacja referencyjna publikowania:

- [Publikowanie w ClawHub](/pl/clawhub/publishing) wyjaśnia właścicieli, zakresy,
  wydania, przegląd, walidację pakietów i przenoszenie pakietów.
- [Tworzenie pluginów](/pl/plugins/building-plugins) przedstawia pełną
  strukturę pakietu pluginu (w tym `openclaw.plugin.json`) oraz proces
  pierwszej publikacji.
- [Manifest pluginu](/pl/plugins/manifest) definiuje pola natywnego manifestu
  pluginu.

Jeśli ten sam pakiet jest dostępny zarówno w ClawHub, jak i npm, należy użyć
jawnego prefiksu `clawhub:` lub `npm:`, aby wymusić jedno
źródło.

## Powiązane

- [Pluginy](/pl/tools/plugin) — instalowanie, konfigurowanie, ponowne uruchamianie i rozwiązywanie problemów
- [`openclaw plugins`](/pl/cli/plugins) — pełna dokumentacja CLI
- [Pluginy społeczności](/pl/plugins/community) — publiczne wyszukiwanie i publikowanie w ClawHub
- [ClawHub](/pl/clawhub/cli) — operacje CLI rejestru
- [Tworzenie pluginów](/pl/plugins/building-plugins) — tworzenie pakietu pluginu
- [Manifest pluginu](/pl/plugins/manifest) — manifest i metadane pakietu
