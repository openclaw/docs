---
read_when:
    - Chcesz zainstalować pakiet zgodny z Codex, Claude lub Cursor
    - Musisz zrozumieć, jak OpenClaw mapuje zawartość pakietu na funkcje natywne
    - Diagnozujesz wykrywanie pakietu lub brakujące możliwości
summary: Zainstaluj pakiety Codex, Claude i Cursor oraz używaj ich jako wtyczek OpenClaw
title: Pakiety Plugin
x-i18n:
    generated_at: "2026-05-05T01:48:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bc06300e765e2faaf51800462003e242d29d4102ac9feaa47f86d4ad35bf157
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw może instalować pluginy z trzech zewnętrznych ekosystemów: **Codex**, **Claude**
i **Cursor**. Są one nazywane **pakietami** — pakietami treści i metadanych, które
OpenClaw mapuje na natywne funkcje, takie jak Skills, hooki i narzędzia MCP.

<Info>
  Pakiety **nie** są tym samym co natywne pluginy OpenClaw. Natywne pluginy działają
  w procesie i mogą rejestrować dowolną funkcję. Pakiety to pakiety treści z
  selektywnym mapowaniem funkcji i węższą granicą zaufania.
</Info>

## Dlaczego istnieją pakiety

Wiele przydatnych pluginów jest publikowanych w formacie Codex, Claude lub Cursor. Zamiast
wymagać od autorów przepisywania ich jako natywnych pluginów OpenClaw, OpenClaw
wykrywa te formaty i mapuje ich obsługiwaną treść na natywny zestaw funkcji.
Oznacza to, że możesz zainstalować pakiet poleceń Claude lub pakiet Skills Codex
i od razu go używać.

## Zainstaluj pakiet

<Steps>
  <Step title="Zainstaluj z katalogu, archiwum lub marketplace">
    ```bash
    # Local directory
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Zweryfikuj wykrywanie">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Pakiety są wyświetlane jako `Format: bundle` z podtypem `codex`, `claude` lub `cursor`.

  </Step>

  <Step title="Uruchom ponownie i użyj">
    ```bash
    openclaw gateway restart
    ```

    Zmapowane funkcje (Skills, hooki, narzędzia MCP, domyślne ustawienia LSP) są dostępne w następnej sesji.

  </Step>
</Steps>

## Co OpenClaw mapuje z pakietów

Nie każda funkcja pakietu działa dziś w OpenClaw. Oto, co działa i co jest
wykrywane, ale nie jest jeszcze podłączone.

### Obsługiwane obecnie

| Funkcja       | Jak jest mapowana                                                                                 | Dotyczy     |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Treść Skills | Katalogi główne Skills pakietu są ładowane jak zwykłe Skills OpenClaw                                           | Wszystkie formaty    |
| Polecenia      | `commands/` i `.cursor/commands/` są traktowane jako katalogi główne Skills                                  | Claude, Cursor |
| Pakiety hooków    | Układy w stylu OpenClaw: `HOOK.md` + `handler.ts`                                             | Codex          |
| Narzędzia MCP     | Konfiguracja MCP pakietu scalona z osadzonymi ustawieniami Pi; obsługiwane serwery stdio i HTTP są ładowane | Wszystkie formaty    |
| Serwery LSP   | Claude `.lsp.json` i zadeklarowane w manifeście `lspServers` scalone z domyślnymi ustawieniami LSP osadzonego Pi  | Claude         |
| Ustawienia      | Claude `settings.json` zaimportowane jako domyślne ustawienia osadzonego Pi                                     | Claude         |

#### Treść Skills

- katalogi główne Skills pakietu są ładowane jak zwykłe katalogi główne Skills OpenClaw
- katalogi główne Claude `commands` są traktowane jako dodatkowe katalogi główne Skills
- katalogi główne Cursor `.cursor/commands` są traktowane jako dodatkowe katalogi główne Skills

Oznacza to, że pliki poleceń markdown Claude działają przez standardowy loader Skills
OpenClaw. Markdown poleceń Cursor działa tą samą ścieżką.

#### Pakiety hooków

- katalogi główne hooków pakietu działają **tylko** wtedy, gdy używają standardowego układu
  pakietu hooków OpenClaw. Dziś jest to przede wszystkim przypadek zgodny z Codex:
  - `HOOK.md`
  - `handler.ts` lub `handler.js`

#### MCP dla Pi

- włączone pakiety mogą dostarczać konfigurację serwera MCP
- OpenClaw scala konfigurację MCP pakietu z efektywnymi ustawieniami osadzonego Pi jako
  `mcpServers`
- OpenClaw udostępnia obsługiwane narzędzia MCP pakietu podczas tur agenta osadzonego Pi przez
  uruchamianie serwerów stdio lub łączenie się z serwerami HTTP
- profile narzędzi `coding` i `messaging` domyślnie zawierają narzędzia MCP pakietów;
  użyj `tools.deny: ["bundle-mcp"]`, aby zrezygnować z nich dla agenta lub gateway
- lokalne ustawienia projektu Pi nadal mają zastosowanie po domyślnych ustawieniach pakietu, więc ustawienia
  obszaru roboczego mogą w razie potrzeby nadpisywać wpisy MCP pakietu
- katalogi narzędzi MCP pakietów są sortowane deterministycznie przed rejestracją, więc
  zmiany kolejności upstream `listTools()` nie destabilizują bloków narzędzi prompt-cache

##### Transporty

Serwery MCP mogą używać transportu stdio lub HTTP:

**Stdio** uruchamia proces potomny:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** łączy się z działającym serwerem MCP przez `sse` domyślnie albo `streamable-http`, gdy zostanie to zażądane:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport` może być ustawiony na `"streamable-http"` lub `"sse"`; gdy zostanie pominięty, OpenClaw używa `sse`
- `type: "http"` to natywny dla CLI kształt downstream; w konfiguracji OpenClaw użyj `transport: "streamable-http"`. `openclaw mcp set` i `openclaw doctor --fix` normalizują typowy alias.
- dozwolone są tylko schematy URL `http:` i `https:`
- wartości `headers` obsługują interpolację `${ENV_VAR}`
- wpis serwera zawierający jednocześnie `command` i `url` jest odrzucany
- dane uwierzytelniające URL (userinfo i parametry zapytania) są redagowane z opisów
  narzędzi i logów
- `connectionTimeoutMs` nadpisuje domyślny 30-sekundowy limit czasu połączenia dla
  transportów stdio i HTTP

##### Nazewnictwo narzędzi

OpenClaw rejestruje narzędzia MCP pakietu z nazwami bezpiecznymi dla dostawców w formie
`serverName__toolName`. Na przykład serwer o kluczu `"vigil-harbor"` udostępniający
narzędzie `memory_search` jest rejestrowany jako `vigil-harbor__memory_search`.

- znaki spoza `A-Za-z0-9_-` są zastępowane przez `-`
- prefiksy serwerów są ograniczone do 30 znaków
- pełne nazwy narzędzi są ograniczone do 64 znaków
- puste nazwy serwerów używają wartości zapasowej `mcp`
- kolidujące oczyszczone nazwy są rozróżniane za pomocą sufiksów numerycznych
- końcowa kolejność udostępnianych narzędzi jest deterministyczna według bezpiecznej nazwy, aby powtarzane tury Pi
  pozostawały stabilne dla cache
- filtrowanie profili traktuje wszystkie narzędzia z jednego serwera MCP pakietu jako należące do pluginu
  `bundle-mcp`, więc listy dozwolone i listy blokowane profilu mogą zawierać albo
  pojedyncze udostępnione nazwy narzędzi, albo klucz pluginu `bundle-mcp`

#### Ustawienia osadzonego Pi

- Claude `settings.json` jest importowany jako domyślne ustawienia osadzonego Pi, gdy
  pakiet jest włączony
- OpenClaw oczyszcza klucze nadpisywania powłoki przed ich zastosowaniem

Oczyszczone klucze:

- `shellPath`
- `shellCommandPrefix`

#### LSP osadzonego Pi

- włączone pakiety Claude mogą dostarczać konfigurację serwera LSP
- OpenClaw ładuje `.lsp.json` oraz wszelkie ścieżki `lspServers` zadeklarowane w manifeście
- konfiguracja LSP pakietu jest scalana z efektywnymi domyślnymi ustawieniami LSP osadzonego Pi
- dziś uruchamialne są tylko obsługiwane serwery LSP oparte na stdio; nieobsługiwane
  transporty nadal pojawiają się w `openclaw plugins inspect <id>`

### Wykrywane, ale niewykonywane

Te elementy są rozpoznawane i pokazywane w diagnostyce, ale OpenClaw ich nie uruchamia:

- Claude `agents`, automatyzacja `hooks.json`, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Metadane inline/aplikacji Codex poza raportowaniem możliwości

## Formaty pakietów

<AccordionGroup>
  <Accordion title="Pakiety Codex">
    Markery: `.codex-plugin/plugin.json`

    Opcjonalna treść: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Pakiety Codex najlepiej pasują do OpenClaw, gdy używają katalogów głównych Skills oraz katalogów
    pakietów hooków w stylu OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Pakiety Claude">
    Dwa tryby wykrywania:

    - **Oparte na manifeście:** `.claude-plugin/plugin.json`
    - **Bez manifestu:** domyślny układ Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Zachowanie specyficzne dla Claude:

    - `commands/` jest traktowany jako treść Skills
    - `settings.json` jest importowany do ustawień osadzonego Pi (klucze nadpisywania powłoki są oczyszczane)
    - `.mcp.json` udostępnia obsługiwane narzędzia stdio osadzonemu Pi
    - `.lsp.json` oraz ścieżki `lspServers` zadeklarowane w manifeście są ładowane do domyślnych ustawień LSP osadzonego Pi
    - `hooks/hooks.json` jest wykrywany, ale niewykonywany
    - Niestandardowe ścieżki komponentów w manifeście są addytywne (rozszerzają domyślne, nie zastępują ich)

  </Accordion>

  <Accordion title="Pakiety Cursor">
    Markery: `.cursor-plugin/plugin.json`

    Opcjonalna treść: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` jest traktowany jako treść Skills
    - `.cursor/rules/`, `.cursor/agents/` i `.cursor/hooks.json` są tylko wykrywane

  </Accordion>
</AccordionGroup>

## Pierwszeństwo wykrywania

OpenClaw najpierw sprawdza natywny format pluginu:

1. `openclaw.plugin.json` lub prawidłowy `package.json` z `openclaw.extensions` — traktowane jako **natywny plugin**
2. Markery pakietów (`.codex-plugin/`, `.claude-plugin/` lub domyślny układ Claude/Cursor) — traktowane jako **pakiet**

Jeśli katalog zawiera oba, OpenClaw używa ścieżki natywnej. Zapobiega to
częściowej instalacji pakietów w dwóch formatach jako pakietów.

## Zależności środowiska uruchomieniowego i czyszczenie

- Zgodne pakiety firm trzecich nie otrzymują naprawy startowej `npm install`. Powinny
  być instalowane przez `openclaw plugins install` i dostarczać wszystko,
  czego potrzebują, w zainstalowanym katalogu pluginu.
- Pluginy pakietowe należące do OpenClaw są albo dostarczane w lekkiej postaci w core, albo
  pobierane przez instalator pluginów. Uruchomienie Gateway nigdy nie uruchamia dla nich
  menedżera pakietów.
- `openclaw doctor --fix` usuwa starsze katalogi etapowanych zależności i może
  odzyskać pobieralne pluginy, których brakuje w lokalnym indeksie pluginów, gdy
  konfiguracja się do nich odwołuje.

## Bezpieczeństwo

Pakiety mają węższą granicę zaufania niż natywne pluginy:

- OpenClaw **nie** ładuje dowolnych modułów uruchomieniowych pakietu w procesie
- Ścieżki Skills i pakietów hooków muszą pozostać wewnątrz katalogu głównego pluginu (sprawdzane względem granic)
- Pliki ustawień są odczytywane z tymi samymi kontrolami granic
- Obsługiwane serwery MCP stdio mogą być uruchamiane jako podprocesy

Dzięki temu pakiety są domyślnie bezpieczniejsze, ale nadal należy traktować pakiety
firm trzecich jako zaufaną treść dla funkcji, które faktycznie udostępniają.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Pakiet jest wykrywany, ale możliwości nie działają">
    Uruchom `openclaw plugins inspect <id>`. Jeśli możliwość jest wymieniona, ale oznaczona jako
    niepodłączona, jest to ograniczenie produktu — nie uszkodzona instalacja.
  </Accordion>

  <Accordion title="Pliki poleceń Claude się nie pojawiają">
    Upewnij się, że pakiet jest włączony, a pliki markdown znajdują się w wykrytym
    katalogu głównym `commands/` lub `skills/`.
  </Accordion>

  <Accordion title="Ustawienia Claude nie są stosowane">
    Obsługiwane są tylko ustawienia osadzonego Pi z `settings.json`. OpenClaw nie
    traktuje ustawień pakietu jako surowych łatek konfiguracji.
  </Accordion>

  <Accordion title="Hooki Claude się nie wykonują">
    `hooks/hooks.json` jest tylko wykrywany. Jeśli potrzebujesz uruchamialnych hooków, użyj
    układu pakietu hooków OpenClaw albo dostarcz natywny plugin.
  </Accordion>
</AccordionGroup>

## Powiązane

- [Instalowanie i konfigurowanie pluginów](/pl/tools/plugin)
- [Tworzenie pluginów](/pl/plugins/building-plugins) — utwórz natywny plugin
- [Manifest pluginu](/pl/plugins/manifest) — natywny schemat manifestu
