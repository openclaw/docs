---
read_when:
    - Chcesz zainstalować pakiet zgodny z Codex, Claude lub Cursor
    - Musisz zrozumieć, jak OpenClaw mapuje zawartość pakietu na funkcje natywne
    - Debugujesz wykrywanie pakietu lub brakujące możliwości
summary: Instalowanie i używanie pakietów Codex, Claude i Cursor jako pluginów OpenClaw
title: Pakiety Pluginów
x-i18n:
    generated_at: "2026-06-27T17:50:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b26915603db9d4d4422f4d1542f033be02eb83c5ffefcf93cac7968f624f4969
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw może instalować pluginy z trzech zewnętrznych ekosystemów: **Codex**, **Claude**
i **Cursor**. Nazywa się je **pakietami** — pakietami zawartości i metadanych, które
OpenClaw mapuje na natywne funkcje, takie jak Skills, hooki i narzędzia MCP.

<Info>
  Pakiety **nie** są tym samym co natywne pluginy OpenClaw. Natywne pluginy działają
  w procesie i mogą rejestrować dowolną funkcję. Pakiety są pakietami zawartości z
  selektywnym mapowaniem funkcji i węższą granicą zaufania.
</Info>

## Dlaczego istnieją pakiety

Wiele użytecznych pluginów jest publikowanych w formacie Codex, Claude lub Cursor. Zamiast
wymagać od autorów przepisywania ich jako natywnych pluginów OpenClaw, OpenClaw
wykrywa te formaty i mapuje ich obsługiwaną zawartość na natywny zestaw funkcji.
Oznacza to, że możesz zainstalować pakiet poleceń Claude lub pakiet Skills Codex
i od razu z niego korzystać.

## Instalowanie pakietu

<Steps>
  <Step title="Install from a directory, archive, or marketplace">
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

  <Step title="Verify detection">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Pakiety są wyświetlane jako `Format: bundle` z podtypem `codex`, `claude` lub `cursor`.

  </Step>

  <Step title="Restart and use">
    ```bash
    openclaw gateway restart
    ```

    Zmapowane funkcje (Skills, hooki, narzędzia MCP, domyślne ustawienia LSP) są dostępne w następnej sesji.

  </Step>
</Steps>

## Co OpenClaw mapuje z pakietów

Nie każda funkcja pakietu działa dziś w OpenClaw. Oto, co działa oraz co
jest wykrywane, ale nie jest jeszcze podłączone.

### Obecnie obsługiwane

| Funkcja       | Jak jest mapowana                                                                                       | Dotyczy     |
| ------------- | ------------------------------------------------------------------------------------------------- | -------------- |
| Zawartość Skills | Korzenie Skills z pakietu są ładowane jako zwykłe Skills OpenClaw                                                 | Wszystkie formaty    |
| Polecenia      | `commands/` i `.cursor/commands/` są traktowane jako korzenie Skills                                        | Claude, Cursor |
| Pakiety hooków    | Układy w stylu OpenClaw: `HOOK.md` + `handler.ts`                                                   | Codex          |
| Narzędzia MCP     | Konfiguracja MCP pakietu scalona z osadzonymi ustawieniami OpenClaw; obsługiwane serwery stdio i HTTP są ładowane | Wszystkie formaty    |
| Serwery LSP   | Claude `.lsp.json` i zadeklarowane w manifeście `lspServers` scalone z domyślnymi ustawieniami osadzonego LSP OpenClaw  | Claude         |
| Ustawienia      | Claude `settings.json` importowany jako osadzone domyślne ustawienia OpenClaw                                     | Claude         |

#### Zawartość Skills

- korzenie Skills pakietu są ładowane jako zwykłe korzenie Skills OpenClaw
- korzenie Claude `commands` są traktowane jako dodatkowe korzenie Skills
- korzenie Cursor `.cursor/commands` są traktowane jako dodatkowe korzenie Skills

Oznacza to, że pliki poleceń markdown Claude działają przez zwykły loader Skills
OpenClaw. Markdown poleceń Cursor działa tą samą ścieżką.

#### Pakiety hooków

- korzenie hooków pakietu działają **tylko** wtedy, gdy używają zwykłego układu
  pakietu hooków OpenClaw. Dziś jest to przede wszystkim przypadek zgodny z Codex:
  - `HOOK.md`
  - `handler.ts` lub `handler.js`

#### MCP dla osadzonego OpenClaw

- włączone pakiety mogą dostarczać konfigurację serwerów MCP
- OpenClaw scala konfigurację MCP pakietu ze skutecznymi ustawieniami osadzonego OpenClaw jako
  `mcpServers`
- OpenClaw udostępnia obsługiwane narzędzia MCP pakietu podczas tur osadzonego agenta OpenClaw,
  uruchamiając serwery stdio lub łącząc się z serwerami HTTP
- profile narzędzi `coding` i `messaging` domyślnie obejmują narzędzia MCP pakietu;
  użyj `tools.deny: ["bundle-mcp"]`, aby zrezygnować dla agenta lub Gateway
- lokalne ustawienia osadzonego agenta projektu nadal obowiązują po domyślnych ustawieniach pakietu, więc ustawienia
  workspace mogą w razie potrzeby zastępować wpisy MCP pakietu
- katalogi narzędzi MCP pakietu są sortowane deterministycznie przed rejestracją, więc
  zmiany kolejności upstream `listTools()` nie powodują ciągłych zmian bloków narzędzi pamięci podręcznej promptów

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

**HTTP** łączy się z działającym serwerem MCP przez `sse` domyślnie albo przez `streamable-http`, gdy tego zażądano:

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

- `transport` może być ustawione na `"streamable-http"` lub `"sse"`; gdy zostanie pominięte, OpenClaw używa `sse`
- `type: "http"` to natywny dla CLI kształt downstream; użyj `transport: "streamable-http"` w konfiguracji OpenClaw. `openclaw mcp set` i `openclaw doctor --fix` normalizują typowy alias.
- dozwolone są tylko schematy URL `http:` i `https:`
- wartości `headers` obsługują interpolację `${ENV_VAR}`
- wpis serwera zawierający jednocześnie `command` i `url` jest odrzucany
- poświadczenia URL (userinfo i parametry zapytania) są redagowane z opisów
  narzędzi i logów
- `connectionTimeoutMs` zastępuje domyślny 30-sekundowy limit czasu połączenia dla
  transportów stdio i HTTP

##### Nazewnictwo narzędzi

OpenClaw rejestruje narzędzia MCP pakietu z nazwami bezpiecznymi dla dostawcy w postaci
`serverName__toolName`. Na przykład serwer o kluczu `"vigil-harbor"` udostępniający
narzędzie `memory_search` rejestruje się jako `vigil-harbor__memory_search`.

- znaki spoza `A-Za-z0-9_-` są zastępowane przez `-`
- fragmenty, które zaczynałyby się od znaku niebędącego literą, dostają prefiks literowy, więc numeryczne
  klucze serwerów, takie jak `12306`, stają się bezpiecznymi dla dostawcy prefiksami narzędzi
- prefiksy serwerów są ograniczone do 30 znaków
- pełne nazwy narzędzi są ograniczone do 64 znaków
- puste nazwy serwerów używają awaryjnie `mcp`
- kolidujące oczyszczone nazwy są rozróżniane sufiksami numerycznymi
- końcowa ujawniona kolejność narzędzi jest deterministyczna według bezpiecznej nazwy, aby powtarzane tury
  osadzonego agenta były stabilne dla pamięci podręcznej
- filtrowanie profili traktuje wszystkie narzędzia z jednego serwera MCP pakietu jako należące do pluginu
  `bundle-mcp`, więc listy dozwolone i listy blokowane profilu mogą zawierać albo
  pojedyncze ujawnione nazwy narzędzi, albo klucz pluginu `bundle-mcp`

#### Ustawienia osadzonego OpenClaw

- Claude `settings.json` jest importowany jako domyślne ustawienia osadzonego OpenClaw, gdy
  pakiet jest włączony
- OpenClaw oczyszcza klucze nadpisywania powłoki przed ich zastosowaniem

Oczyszczone klucze:

- `shellPath`
- `shellCommandPrefix`

#### Osadzony LSP OpenClaw

- włączone pakiety Claude mogą dostarczać konfigurację serwera LSP
- OpenClaw ładuje `.lsp.json` oraz wszystkie zadeklarowane w manifeście ścieżki `lspServers`
- konfiguracja LSP pakietu jest scalana ze skutecznymi domyślnymi ustawieniami osadzonego LSP OpenClaw
- dziś uruchamialne są tylko obsługiwane serwery LSP oparte na stdio; nieobsługiwane
  transporty nadal pojawiają się w `openclaw plugins inspect <id>`

### Wykrywane, ale niewykonywane

Są rozpoznawane i pokazywane w diagnostyce, ale OpenClaw ich nie uruchamia:

- Claude `agents`, automatyzacja `hooks.json`, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- metadane inline/aplikacji Codex poza raportowaniem funkcji

## Formaty pakietów

<AccordionGroup>
  <Accordion title="Codex bundles">
    Znaczniki: `.codex-plugin/plugin.json`

    Opcjonalna zawartość: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Pakiety Codex najlepiej pasują do OpenClaw, gdy używają korzeni Skills oraz katalogów
    pakietów hooków w stylu OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Claude bundles">
    Dwa tryby wykrywania:

    - **Oparty na manifeście:** `.claude-plugin/plugin.json`
    - **Bez manifestu:** domyślny układ Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Zachowanie specyficzne dla Claude:

    - `commands/` jest traktowane jako zawartość Skills
    - `settings.json` jest importowany do ustawień osadzonego OpenClaw (klucze nadpisywania powłoki są oczyszczane)
    - `.mcp.json` udostępnia obsługiwane narzędzia stdio osadzonemu OpenClaw
    - `.lsp.json` wraz z zadeklarowanymi w manifeście ścieżkami `lspServers` ładuje się do domyślnych ustawień osadzonego LSP OpenClaw
    - `hooks/hooks.json` jest wykrywany, ale niewykonywany
    - niestandardowe ścieżki komponentów w manifeście są addytywne (rozszerzają domyślne, a nie je zastępują)

  </Accordion>

  <Accordion title="Cursor bundles">
    Znaczniki: `.cursor-plugin/plugin.json`

    Opcjonalna zawartość: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` jest traktowane jako zawartość Skills
    - `.cursor/rules/`, `.cursor/agents/` i `.cursor/hooks.json` są tylko wykrywane

  </Accordion>
</AccordionGroup>

## Pierwszeństwo wykrywania

OpenClaw najpierw sprawdza format natywnego pluginu:

1. `openclaw.plugin.json` lub prawidłowy `package.json` z `openclaw.extensions` — traktowane jako **natywny plugin**
2. Znaczniki pakietu (`.codex-plugin/`, `.claude-plugin/` lub domyślny układ Claude/Cursor) — traktowane jako **pakiet**

Jeśli katalog zawiera oba, OpenClaw używa ścieżki natywnej. Zapobiega to
częściowemu instalowaniu pakietów dwufomatowych jako pakietów.

## Zależności runtime i czyszczenie

- Zgodne pakiety firm trzecich nie otrzymują naprawy startowej `npm install`. Powinny
  być instalowane przez `openclaw plugins install` i dostarczać wszystko,
  czego potrzebują, w katalogu zainstalowanego pluginu.
- Pluginy pakietowe należące do OpenClaw są albo dostarczane lekko w rdzeniu, albo
  możliwe do pobrania przez instalator pluginów. Start Gateway nigdy nie uruchamia dla nich
  menedżera pakietów.
- `openclaw doctor --fix` usuwa starsze katalogi przygotowanych zależności i może
  odzyskać pobieralne pluginy, których brakuje w lokalnym indeksie pluginów, gdy
  konfiguracja się do nich odwołuje.

## Bezpieczeństwo

Pakiety mają węższą granicę zaufania niż natywne pluginy:

- OpenClaw **nie** ładuje dowolnych modułów runtime pakietu w procesie
- Ścieżki Skills i pakietów hooków muszą pozostać wewnątrz korzenia pluginu (sprawdzane granicą)
- Pliki ustawień są odczytywane z tymi samymi kontrolami granic
- Obsługiwane serwery MCP stdio mogą być uruchamiane jako podprocesy

Dzięki temu pakiety są domyślnie bezpieczniejsze, ale nadal należy traktować pakiety
firm trzecich jako zaufaną zawartość dla funkcji, które udostępniają.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Bundle is detected but capabilities do not run">
    Uruchom `openclaw plugins inspect <id>`. Jeśli funkcja jest wymieniona, ale oznaczona jako
    niepodłączona, jest to ograniczenie produktu — nie uszkodzona instalacja.
  </Accordion>

  <Accordion title="Claude command files do not appear">
    Upewnij się, że pakiet jest włączony, a pliki markdown znajdują się w wykrytym
    korzeniu `commands/` lub `skills/`.
  </Accordion>

  <Accordion title="Claude settings do not apply">
    Obsługiwane są tylko ustawienia osadzonego OpenClaw z `settings.json`. OpenClaw
    nie traktuje ustawień pakietu jako surowych poprawek konfiguracji.
  </Accordion>

  <Accordion title="Claude hooks do not execute">
    `hooks/hooks.json` jest tylko wykrywany. Jeśli potrzebujesz uruchamialnych hooków, użyj
    układu pakietu hooków OpenClaw albo dostarcz natywny plugin.
  </Accordion>
</AccordionGroup>

## Powiązane

- [Instalowanie i konfigurowanie pluginów](/pl/tools/plugin)
- [Budowanie pluginów](/pl/plugins/building-plugins) — utwórz natywny plugin
- [Manifest pluginu](/pl/plugins/manifest) — natywny schemat manifestu
