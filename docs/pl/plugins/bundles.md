---
read_when:
    - Chcesz zainstalować pakiet zgodny z Codex, Claude lub Cursor
    - Musisz zrozumieć, jak OpenClaw mapuje zawartość pakietu na funkcje natywne
    - Rozwiązujesz problemy z wykrywaniem pakietu lub brakującymi możliwościami
summary: Instalowanie i używanie pakietów Codex, Claude i Cursor jako pluginów OpenClaw
title: Pakiety Plugin
x-i18n:
    generated_at: "2026-05-02T09:56:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b949ad70881714a30ab136261441687b439e39b516638ffa052efeab6b75bd4
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw może instalować Pluginy z trzech zewnętrznych ekosystemów: **Codex**, **Claude**
i **Cursor**. Nazywa się je **pakietami** — zestawami treści i metadanych, które
OpenClaw mapuje na natywne funkcje, takie jak Skills, hooki i narzędzia MCP.

<Info>
  Pakiety **nie** są tym samym co natywne Pluginy OpenClaw. Natywne Pluginy działają
  w procesie i mogą rejestrować dowolną funkcję. Pakiety to zestawy treści z
  selektywnym mapowaniem funkcji i węższą granicą zaufania.
</Info>

## Dlaczego istnieją pakiety

Wiele przydatnych Pluginów jest publikowanych w formacie Codex, Claude lub Cursor.
Zamiast wymagać od autorów przepisywania ich jako natywnych Pluginów OpenClaw,
OpenClaw wykrywa te formaty i mapuje ich obsługiwaną treść na natywny zestaw
funkcji. Oznacza to, że możesz zainstalować pakiet poleceń Claude lub pakiet Skills
Codex i używać go od razu.

## Instalowanie pakietu

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

  <Step title="Zweryfikuj wykrycie">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Pakiety są wyświetlane jako `Format: bundle` z podtypem `codex`, `claude` lub `cursor`.

  </Step>

  <Step title="Uruchom ponownie i używaj">
    ```bash
    openclaw gateway restart
    ```

    Zmapowane funkcje (Skills, hooki, narzędzia MCP, domyślne ustawienia LSP) są dostępne w następnej sesji.

  </Step>
</Steps>

## Co OpenClaw mapuje z pakietów

Nie każda funkcja pakietu działa dziś w OpenClaw. Oto co działa oraz co
jest wykrywane, ale nie jest jeszcze podłączone.

### Obsługiwane obecnie

| Funkcja       | Jak jest mapowana                                                                           | Dotyczy        |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Treść Skills  | Korzenie Skills z pakietu są ładowane jak zwykłe Skills OpenClaw                            | Wszystkie formaty |
| Polecenia     | `commands/` i `.cursor/commands/` są traktowane jako korzenie Skills                        | Claude, Cursor |
| Pakiety hooków | Układy w stylu OpenClaw z `HOOK.md` + `handler.ts`                                         | Codex          |
| Narzędzia MCP | Konfiguracja MCP pakietu scalana z osadzonymi ustawieniami Pi; ładowane są obsługiwane serwery stdio i HTTP | Wszystkie formaty |
| Serwery LSP   | Claude `.lsp.json` i zadeklarowane w manifeście `lspServers` scalane z domyślnymi ustawieniami LSP osadzonego Pi | Claude         |
| Ustawienia    | Claude `settings.json` importowane jako domyślne ustawienia osadzonego Pi                  | Claude         |

#### Treść Skills

- korzenie Skills pakietu są ładowane jako zwykłe korzenie Skills OpenClaw
- korzenie `commands` Claude są traktowane jako dodatkowe korzenie Skills
- korzenie `.cursor/commands` Cursor są traktowane jako dodatkowe korzenie Skills

Oznacza to, że pliki poleceń Markdown Claude działają przez zwykły loader Skills
OpenClaw. Markdown poleceń Cursor działa tą samą ścieżką.

#### Pakiety hooków

- korzenie hooków pakietu działają **tylko** wtedy, gdy używają zwykłego układu
  pakietu hooków OpenClaw. Obecnie jest to głównie przypadek zgodny z Codex:
  - `HOOK.md`
  - `handler.ts` lub `handler.js`

#### MCP dla Pi

- włączone pakiety mogą dodawać konfigurację serwera MCP
- OpenClaw scala konfigurację MCP pakietu z efektywnymi ustawieniami osadzonego Pi jako
  `mcpServers`
- OpenClaw udostępnia obsługiwane narzędzia MCP pakietu podczas tur agenta osadzonego Pi,
  uruchamiając serwery stdio lub łącząc się z serwerami HTTP
- profile narzędzi `coding` i `messaging` domyślnie obejmują narzędzia MCP pakietów;
  użyj `tools.deny: ["bundle-mcp"]`, aby wyłączyć je dla agenta lub gateway
- lokalne ustawienia projektu Pi nadal obowiązują po domyślnych ustawieniach pakietu, więc ustawienia
  workspace mogą w razie potrzeby nadpisać wpisy MCP pakietu
- katalogi narzędzi MCP pakietów są sortowane deterministycznie przed rejestracją, więc
  zmiany kolejności upstream `listTools()` nie powodują ciągłych zmian bloków narzędzi cache promptów

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

**HTTP** domyślnie łączy się z działającym serwerem MCP przez `sse` albo przez `streamable-http`, gdy tego zażądano:

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

- `transport` można ustawić na `"streamable-http"` lub `"sse"`; gdy zostanie pominięte, OpenClaw używa `sse`
- `type: "http"` to natywny kształt downstream CLI; w konfiguracji OpenClaw użyj `transport: "streamable-http"`. `openclaw mcp set` i `openclaw doctor --fix` normalizują typowy alias.
- dozwolone są tylko schematy URL `http:` i `https:`
- wartości `headers` obsługują interpolację `${ENV_VAR}`
- wpis serwera zawierający jednocześnie `command` i `url` jest odrzucany
- dane uwierzytelniające URL (userinfo i parametry zapytania) są redagowane z opisów
  narzędzi i logów
- `connectionTimeoutMs` zastępuje domyślny 30-sekundowy limit czasu połączenia dla
  transportów stdio i HTTP

##### Nazewnictwo narzędzi

OpenClaw rejestruje narzędzia MCP pakietów z nazwami bezpiecznymi dla providerów w formie
`serverName__toolName`. Na przykład serwer o kluczu `"vigil-harbor"` udostępniający narzędzie
`memory_search` rejestruje się jako `vigil-harbor__memory_search`.

- znaki spoza `A-Za-z0-9_-` są zastępowane przez `-`
- prefiksy serwerów są ograniczone do 30 znaków
- pełne nazwy narzędzi są ograniczone do 64 znaków
- puste nazwy serwerów używają zastępczo `mcp`
- kolidujące zsanityzowane nazwy są rozróżniane sufiksami liczbowymi
- końcowa eksponowana kolejność narzędzi jest deterministyczna według bezpiecznej nazwy, aby powtarzane tury Pi
  pozostały stabilne dla cache
- filtrowanie profilu traktuje wszystkie narzędzia z jednego serwera MCP pakietu jako należące do Pluginu
  `bundle-mcp`, więc listy dozwolonych i zabronionych profilu mogą obejmować zarówno
  pojedyncze eksponowane nazwy narzędzi, jak i klucz Pluginu `bundle-mcp`

#### Ustawienia osadzonego Pi

- Claude `settings.json` jest importowany jako domyślne ustawienia osadzonego Pi, gdy
  pakiet jest włączony
- OpenClaw sanityzuje klucze nadpisywania powłoki przed ich zastosowaniem

Zsanityzowane klucze:

- `shellPath`
- `shellCommandPrefix`

#### LSP osadzonego Pi

- włączone pakiety Claude mogą dodawać konfigurację serwera LSP
- OpenClaw ładuje `.lsp.json` oraz wszelkie ścieżki `lspServers` zadeklarowane w manifeście
- konfiguracja LSP pakietu jest scalana z efektywnymi domyślnymi ustawieniami LSP osadzonego Pi
- obecnie uruchamialne są tylko obsługiwane serwery LSP oparte na stdio; nieobsługiwane
  transporty nadal pojawiają się w `openclaw plugins inspect <id>`

### Wykrywane, ale niewykonywane

Te elementy są rozpoznawane i pokazywane w diagnostyce, ale OpenClaw ich nie uruchamia:

- Claude `agents`, automatyzacja `hooks.json`, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- metadane inline/aplikacji Codex poza raportowaniem funkcji

## Formaty pakietów

<AccordionGroup>
  <Accordion title="Pakiety Codex">
    Znaczniki: `.codex-plugin/plugin.json`

    Opcjonalna treść: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Pakiety Codex najlepiej pasują do OpenClaw, gdy używają korzeni Skills i katalogów
    pakietów hooków w stylu OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Pakiety Claude">
    Dwa tryby wykrywania:

    - **Oparte na manifeście:** `.claude-plugin/plugin.json`
    - **Bez manifestu:** domyślny układ Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Zachowanie specyficzne dla Claude:

    - `commands/` jest traktowane jako treść Skills
    - `settings.json` jest importowany do ustawień osadzonego Pi (klucze nadpisywania powłoki są sanityzowane)
    - `.mcp.json` udostępnia obsługiwane narzędzia stdio osadzonemu Pi
    - `.lsp.json` oraz ścieżki `lspServers` zadeklarowane w manifeście ładują się do domyślnych ustawień LSP osadzonego Pi
    - `hooks/hooks.json` jest wykrywany, ale niewykonywany
    - niestandardowe ścieżki komponentów w manifeście są addytywne (rozszerzają wartości domyślne, nie zastępują ich)

  </Accordion>

  <Accordion title="Pakiety Cursor">
    Znaczniki: `.cursor-plugin/plugin.json`

    Opcjonalna treść: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` jest traktowane jako treść Skills
    - `.cursor/rules/`, `.cursor/agents/` i `.cursor/hooks.json` są tylko wykrywane

  </Accordion>
</AccordionGroup>

## Kolejność wykrywania

OpenClaw najpierw sprawdza natywny format Pluginu:

1. `openclaw.plugin.json` lub prawidłowy `package.json` z `openclaw.extensions` — traktowane jako **natywny Plugin**
2. Znaczniki pakietów (`.codex-plugin/`, `.claude-plugin/` lub domyślny układ Claude/Cursor) — traktowane jako **pakiet**

Jeśli katalog zawiera oba, OpenClaw używa ścieżki natywnej. Zapobiega to
częściowej instalacji pakietów w dwóch formatach jako pakietów.

## Zależności runtime i czyszczenie

- Zgodne pakiety firm trzecich nie otrzymują naprawy `npm install` przy starcie. Powinny
  być instalowane przez `openclaw plugins install` i zawierać wszystko,
  czego potrzebują, w zainstalowanym katalogu Pluginu.
- Pakietowane Pluginy należące do OpenClaw są albo dostarczane jako lekkie w core, albo
  dostępne do pobrania przez instalator Pluginów. Uruchomienie Gateway nigdy nie uruchamia dla nich
  managera pakietów.
- `openclaw doctor --fix` usuwa starsze katalogi zależności staged i może
  instalować skonfigurowane Pluginy do pobrania, których brakuje w lokalnym
  indeksie Pluginów.

## Bezpieczeństwo

Pakiety mają węższą granicę zaufania niż natywne Pluginy:

- OpenClaw **nie** ładuje dowolnych modułów runtime pakietu w procesie
- ścieżki Skills i pakietów hooków muszą pozostawać w katalogu głównym Pluginu (z kontrolą granic)
- pliki ustawień są odczytywane z takimi samymi kontrolami granic
- obsługiwane serwery MCP stdio mogą być uruchamiane jako podprocesy

Dzięki temu pakiety są domyślnie bezpieczniejsze, ale nadal należy traktować pakiety
firm trzecich jako zaufaną treść dla funkcji, które udostępniają.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Pakiet jest wykrywany, ale funkcje się nie uruchamiają">
    Uruchom `openclaw plugins inspect <id>`. Jeśli funkcja jest wymieniona, ale oznaczona jako
    niepodłączona, jest to ograniczenie produktu — nie uszkodzona instalacja.
  </Accordion>

  <Accordion title="Pliki poleceń Claude się nie pojawiają">
    Upewnij się, że pakiet jest włączony, a pliki Markdown znajdują się w wykrytym
    korzeniu `commands/` lub `skills/`.
  </Accordion>

  <Accordion title="Ustawienia Claude nie są stosowane">
    Obsługiwane są tylko ustawienia osadzonego Pi z `settings.json`. OpenClaw
    nie traktuje ustawień pakietu jako surowych poprawek konfiguracji.
  </Accordion>

  <Accordion title="Hooki Claude się nie wykonują">
    `hooks/hooks.json` jest tylko wykrywany. Jeśli potrzebujesz uruchamialnych hooków, użyj
    układu pakietu hooków OpenClaw albo dostarcz natywny Plugin.
  </Accordion>
</AccordionGroup>

## Powiązane

- [Instalowanie i konfigurowanie Pluginów](/pl/tools/plugin)
- [Budowanie Pluginów](/pl/plugins/building-plugins) — utwórz natywny Plugin
- [Manifest Pluginu](/pl/plugins/manifest) — natywny schemat manifestu
