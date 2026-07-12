---
doc-schema-version: 1
read_when:
    - Chcesz przeglądać, instalować, włączać lub wyłączać pluginy w interfejsie sterowania
    - Potrzebujesz krótkich przykładów wyświetlania listy pluginów, instalowania, aktualizowania, sprawdzania lub odinstalowywania
    - Chcesz wybrać źródło instalacji pluginu
    - Potrzebujesz odpowiedniej dokumentacji dotyczącej publikowania pakietów Pluginów
sidebarTitle: Manage plugins
summary: Zarządzaj pluginami OpenClaw za pomocą interfejsu Control UI lub CLI
title: Zarządzanie pluginami
x-i18n:
    generated_at: "2026-07-12T15:20:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b235dfca7ef815cc8b0f82db6a9ba8cb344b00612ffd77ca67c8bbd379bdf2a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Interfejs Control UI obsługuje typowy proces wyszukiwania, instalowania, włączania i wyłączania
pluginów. CLI udostępnia dodatkowo aktualizowanie, odinstalowywanie, konfigurację
zaawansowaną oraz jawne sterowanie źródłem instalacji. Pełny opis poleceń, flag,
reguł wyboru źródła i przypadków brzegowych zawiera dokumentacja
[`openclaw plugins`](/pl/cli/plugins).

Typowy proces w CLI: znajdź pakiet, zainstaluj go z ClawHub, npm, repozytorium git lub
ścieżki lokalnej, pozwól zarządzanemu Gateway na automatyczne ponowne uruchomienie
(albo uruchom go ponownie ręcznie), a następnie zweryfikuj rejestracje pluginu
w środowisku wykonawczym.

## Korzystanie z Control UI

Otwórz **Pluginy** w Control UI albo przejdź do `/settings/plugins` względem
skonfigurowanej ścieżki bazowej Control UI. Na przykład dla ścieżki bazowej
`/openclaw` używany jest adres `/openclaw/settings/plugins`. Strona ma dwie karty:

- **Zainstalowane** przedstawia pełny lokalny wykaz pogrupowany według kategorii
  (kanały, dostawcy modeli, pamięć, narzędzia). Każdy wiersz otwiera widok szczegółów;
  jego menu dodatkowych opcji (`…`) umożliwia włączenie lub wyłączenie pluginu,
  a w przypadku pluginów zainstalowanych zewnętrznie udostępnia opcję **Usuń**.
  Karta zawiera także listę skonfigurowanych [serwerów MCP](/pl/cli/mcp) z tymi samymi
  dostępnymi w menu operacjami włączania, wyłączania i usuwania, które modyfikują
  `mcp.servers` w konfiguracji Gateway.
- **Odkrywaj** to sklep: wyróżnione pluginy dołączone do OpenClaw, oficjalne
  pluginy zewnętrzne oraz wyselekcjonowana kolekcja konektorów. Karty konektorów
  dodają hostowany serwer MCP jednym kliknięciem (GitHub, Notion, Linear, Sentry,
  Home Assistant) albo otwierają wstępnie wypełnione wyszukiwanie w ClawHub.
  Wpisanie tekstu w polu wyszukiwania powoduje bezpośrednie wysłanie zapytania do
  [ClawHub](https://clawhub.ai/plugins) i dodanie sekcji **Z ClawHub** z liczbą
  pobrań oraz oznaczeniami weryfikacji źródła.

Dołączone pluginy nie wymagają instalowania pakietu. Ich akcja w menu to **Włącz**
lub **Wyłącz**. Na przykład Workboard jest dołączony do OpenClaw i domyślnie
wyłączony, dlatego wybierz **Włącz**, aby go aktywować. Dołączonych pluginów nie
można usuwać — można je tylko wyłączać.

Dostęp do katalogu i wyszukiwania wymaga uprawnienia `operator.read`. Instalowanie,
włączanie, wyłączanie i usuwanie oraz zmiany serwerów MCP wymagają uprawnienia
`operator.admin`. Instalację z ClawHub wykonuje Gateway, zachowując mechanizmy
sprawdzania zaufania, integralności i zasad instalowania pluginów.

Zainstalowanie lub usunięcie kodu pluginu wymaga ponownego uruchomienia Gateway.
Zmiany stanu włączenia można zastosować bez ponownego uruchamiania, jeśli obsługują
to zainstalowany plugin i bieżące środowisko wykonawcze Gateway; w przeciwnym razie
interfejs informuje o konieczności ponownego uruchomienia. Konektory MCP korzystające
z OAuth nadal wymagają jednorazowego wykonania `openclaw mcp login <name>` w CLI
po ich dodaniu.

Control UI nie instaluje pluginów z dowolnych źródeł npm, git ani ścieżek lokalnych,
nie aktualizuje pluginów i nie udostępnia rozbudowanej konfiguracji pluginów.
Do wykonywania tych operacji użyj opisanych poniżej procesów CLI.

## Wyświetlanie i wyszukiwanie pluginów

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

Opcja `--json` dla skryptów:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` wykonuje kontrolę wykazu bez uruchamiania środowiska: pokazuje,
co OpenClaw może wykryć na podstawie konfiguracji, manifestów i trwałego rejestru
pluginów. Nie dowodzi, że już działający Gateway zaimportował środowisko wykonawcze
pluginu. Dane wyjściowe JSON zawierają diagnostykę rejestru oraz właściwość
`dependencyStatus` każdego pluginu, która określa, czy zadeklarowane zależności
`dependencies`/`optionalDependencies` można odnaleźć na dysku.

`plugins search` wysyła zapytanie do ClawHub dotyczące dostępnych do zainstalowania
pakietów pluginów i dla każdego wyniku wyświetla podpowiedź instalacji
(`openclaw plugins install clawhub:<package>`).

## Włączanie i wyłączanie pluginów

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

Zmienia stan wpisu pluginu w konfiguracji bez modyfikowania zainstalowanych plików.
Niektóre dołączone pluginy (dołączeni dostawcy modeli i syntezy mowy oraz dołączony
plugin przeglądarki) są domyślnie włączone; inne po instalacji wymagają wykonania
polecenia `enable`.

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

# Zainstaluj z repozytorium git lub lokalnej kopii deweloperskiej.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Podczas przejścia na nowy mechanizm uruchamiania specyfikacje pakietów bez prefiksu
są instalowane z npm, chyba że nazwa odpowiada identyfikatorowi dołączonego lub
oficjalnego pluginu — w takim przypadku OpenClaw używa odpowiednio kopii lokalnej
lub oficjalnej. Aby wybór źródła był deterministyczny, używaj prefiksu `clawhub:`,
`npm:`, `git:` lub `npm-pack:`.

Opcji `--force` używaj wyłącznie do nadpisania istniejącego miejsca docelowego
instalacji pochodzącej z innego źródła. Do zwykłego uaktualniania śledzonej instalacji
npm, ClawHub lub pakietu hooków używaj zamiast tego `openclaw plugins update`;
opcja `--force` nie jest obsługiwana razem z `--link`.

## Ponowne uruchamianie i inspekcja

Działający zarządzany Gateway z włączonym przeładowywaniem konfiguracji uruchamia się
automatycznie ponownie po zainstalowaniu, zaktualizowaniu lub odinstalowaniu kodu
pluginu. Jeśli Gateway nie jest zarządzany albo przeładowywanie jest wyłączone,
uruchom go ponownie samodzielnie przed sprawdzeniem aktywnych elementów środowiska
wykonawczego:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` ładuje moduł pluginu i potwierdza, że zarejestrował on elementy
środowiska wykonawczego (narzędzia, hooki, usługi, metody Gateway, trasy HTTP,
polecenia CLI należące do pluginu). Zwykłe polecenia `inspect` i `list` sprawdzają
wyłącznie manifest, konfigurację i rejestr bez uruchamiania środowiska.

## Aktualizowanie pluginów

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Podanie identyfikatora pluginu powoduje ponowne użycie jego śledzonej specyfikacji
instalacji: zapisane znaczniki dystrybucji (`@beta`) i dokładnie przypięte wersje
są zachowywane przy kolejnych wykonaniach `update <plugin-id>`.

`openclaw plugins update --all` służy do zbiorczego utrzymania pluginów. Nadal
respektuje zwykłe śledzone specyfikacje instalacji, ale rekordy zaufanych oficjalnych
pluginów OpenClaw są synchronizowane z bieżącym celem w oficjalnym katalogu, zamiast
pozostawać przypięte do nieaktualnego, dokładnie określonego oficjalnego pakietu;
gdy `update.channel` ma wartość `beta`, synchronizacja preferuje linię wydań beta.
Użyj ukierunkowanego polecenia `update <plugin-id>`, aby nie zmieniać dokładnej lub
oznaczonej tagiem specyfikacji oficjalnego pluginu.

W przypadku instalacji npm podaj jawną specyfikację pakietu, aby zmienić śledzony
rekord:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Drugie polecenie przenosi plugin z powrotem do domyślnej linii wydań rejestru,
jeśli wcześniej był przypięty do dokładnej wersji lub tagu.

Dokładne reguły mechanizmów zastępczych i przypinania opisano w dokumentacji
[`openclaw plugins`](/pl/cli/plugins#update).

## Odinstalowywanie pluginów

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

Odinstalowanie usuwa wpis pluginu z konfiguracji, trwały rekord indeksu pluginów,
wpisy na listach dozwolonych i zabronionych oraz, w stosownych przypadkach,
powiązane wpisy `plugins.load.paths`. Zarządzany katalog instalacyjny zostaje
usunięty, chyba że podasz opcję `--keep-files`. Działający zarządzany Gateway
uruchamia się automatycznie ponownie, gdy odinstalowanie zmieni źródło pluginu.

W trybie Nix (`OPENCLAW_NIX_MODE=1`) instalowanie, aktualizowanie, odinstalowywanie,
włączanie i wyłączanie pluginów jest całkowicie wyłączone; tymi ustawieniami należy
zarządzać w źródle Nix używanym do instalacji.

## Wybór źródła

| Źródło       | Kiedy używać                                                                 | Przykład                                                       |
| ------------ | ---------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub      | Gdy potrzebujesz natywnego dla OpenClaw wyszukiwania, podsumowań skanowania, wersji i podpowiedzi | `openclaw plugins install clawhub:<package>`                   |
| git          | Gdy potrzebujesz gałęzi, tagu lub commitu z repozytorium                      | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| ścieżka lokalna | Gdy tworzysz lub testujesz plugin na tym samym komputerze                  | `openclaw plugins install --link ./my-plugin`                  |
| marketplace  | Gdy instalujesz plugin platformy marketplace zgodny z Claude                 | `openclaw plugins install <plugin> --marketplace <source>`     |
| pakiet npm   | Gdy weryfikujesz lokalny artefakt pakietu przy użyciu semantyki instalacji npm | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com    | Gdy już publikujesz pakiety JavaScript lub potrzebujesz tagów dystrybucji npm albo prywatnego rejestru | `openclaw plugins install npm:@acme/openclaw-plugin`           |

Zarządzane instalacje ze ścieżki lokalnej muszą wskazywać katalogi lub archiwa
pluginów. Samodzielne pliki pluginów umieszczaj w `plugins.load.paths`, zamiast
instalować je za pomocą `plugins install`.

## Publikowanie pluginów

ClawHub jest podstawowym publicznym miejscem wyszukiwania pluginów OpenClaw.
Publikuj je tam, jeśli chcesz, aby użytkownicy przed instalacją mogli znaleźć
metadane pluginu, historię wersji, wyniki skanowania rejestru i podpowiedzi
dotyczące instalacji.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Natywne pluginy npm przed opublikowaniem muszą zawierać manifest pluginu
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

Pełny opis zasad publikowania znajduje się na poniższych stronach; nie traktuj
tej strony jako dokumentacji referencyjnej publikowania:

- [Publikowanie w ClawHub](/pl/clawhub/publishing) objaśnia właścicieli, zakresy,
  wydania, przegląd, weryfikację pakietów i przenoszenie pakietów.
- [Tworzenie pluginów](/pl/plugins/building-plugins) przedstawia pełną strukturę
  pakietu pluginu (w tym `openclaw.plugin.json`) oraz proces pierwszej publikacji.
- [Manifest pluginu](/pl/plugins/manifest) definiuje pola natywnego manifestu pluginu.

Jeśli ten sam pakiet jest dostępny zarówno w ClawHub, jak i npm, użyj jawnego
prefiksu `clawhub:` lub `npm:`, aby wymusić określone źródło.

## Powiązane materiały

- [Pluginy](/pl/tools/plugin) — instalowanie, konfigurowanie, ponowne uruchamianie i rozwiązywanie problemów
- [`openclaw plugins`](/pl/cli/plugins) — pełna dokumentacja referencyjna CLI
- [Pluginy społeczności](/pl/plugins/community) — publiczne wyszukiwanie i publikowanie w ClawHub
- [ClawHub](/pl/clawhub/cli) — operacje CLI rejestru
- [Tworzenie pluginów](/pl/plugins/building-plugins) — tworzenie pakietu pluginu
- [Manifest pluginu](/pl/plugins/manifest) — manifest i metadane pakietu
