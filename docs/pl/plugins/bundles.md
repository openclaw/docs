---
read_when:
    - Chcesz zainstalować pakiet zgodny z Codex, Claude lub Cursor
    - Musisz zrozumieć, jak OpenClaw mapuje zawartość pakietu na funkcje natywne
    - Diagnozujesz wykrywanie pakietów lub brakujące możliwości
summary: Instaluj i używaj pakietów Codex, Claude i Cursor jako pluginów OpenClaw
title: Pakiety pluginów
x-i18n:
    generated_at: "2026-04-05T14:01:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8b1eb4633bdff75425d8c2e29be352e11a4cdad7f420c0c66ae5ef07bf9bdcc
    source_path: plugins/bundles.md
    workflow: 15
---

# Pakiety pluginów

OpenClaw może instalować pluginy z trzech zewnętrznych ekosystemów: **Codex**, **Claude**
i **Cursor**. Są one nazywane **pakietami** — pakietami zawartości i metadanych, które
OpenClaw mapuje na natywne funkcje, takie jak Skills, hooki i narzędzia MCP.

<Info>
  Pakiety **nie** są tym samym co natywne pluginy OpenClaw. Natywne pluginy działają
  w procesie i mogą rejestrować dowolne możliwości. Pakiety są pakietami zawartości z
  selektywnym mapowaniem funkcji i węższą granicą zaufania.
</Info>

## Dlaczego istnieją pakiety

Wiele przydatnych pluginów jest publikowanych w formacie Codex, Claude lub Cursor. Zamiast
wymagać od autorów przepisywania ich jako natywnych pluginów OpenClaw, OpenClaw
wykrywa te formaty i mapuje ich obsługiwaną zawartość na natywny zestaw funkcji.
Oznacza to, że możesz zainstalować pakiet poleceń Claude lub pakiet Skills Codex
i używać go od razu.

## Zainstaluj pakiet

<Steps>
  <Step title="Zainstaluj z katalogu, archiwum lub marketplace">
    ```bash
    # Katalog lokalny
    openclaw plugins install ./my-bundle

    # Archiwum
    openclaw plugins install ./my-bundle.tgz

    # Marketplace Claude
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

  <Step title="Uruchom ponownie i używaj">
    ```bash
    openclaw gateway restart
    ```

    Zmapowane funkcje (Skills, hooki, narzędzia MCP, domyślne ustawienia LSP) są dostępne w następnej sesji.

  </Step>
</Steps>

## Co OpenClaw mapuje z pakietów

Nie każda funkcja pakietu działa dziś w OpenClaw. Oto co działa, a co jest
wykrywane, ale jeszcze nie zostało podłączone.

### Obecnie obsługiwane

| Funkcja       | Jak jest mapowana                                                                          | Dotyczy         |
| ------------- | ------------------------------------------------------------------------------------------ | --------------- |
| Zawartość Skills | Główówne katalogi Skills pakietu są ładowane jak zwykłe Skills OpenClaw                 | Wszystkie formaty |
| Polecenia     | `commands/` i `.cursor/commands/` są traktowane jako główne katalogi Skills                | Claude, Cursor  |
| Pakiety hooków | Układy w stylu OpenClaw `HOOK.md` + `handler.ts`                                          | Codex           |
| Narzędzia MCP | Konfiguracja MCP z pakietu jest scalana z osadzonymi ustawieniami Pi; ładowane są obsługiwane serwery stdio i HTTP | Wszystkie formaty |
| Serwery LSP   | Claude `.lsp.json` i zadeklarowane w manifeście `lspServers` są scalane z domyślnymi ustawieniami LSP osadzonego Pi | Claude          |
| Ustawienia    | Claude `settings.json` jest importowany jako domyślne ustawienia osadzonego Pi             | Claude          |

#### Zawartość Skills

- główne katalogi Skills pakietu są ładowane jak zwykłe główne katalogi Skills OpenClaw
- katalogi Claude `commands` są traktowane jako dodatkowe główne katalogi Skills
- katalogi Cursor `.cursor/commands` są traktowane jako dodatkowe główne katalogi Skills

Oznacza to, że pliki poleceń markdown Claude działają przez zwykły program
ładujący Skills OpenClaw. Polecenia markdown Cursor działają przez tę samą ścieżkę.

#### Pakiety hooków

- główne katalogi hooków pakietu działają **tylko** wtedy, gdy używają zwykłego układu pakietu hooków OpenClaw.
  Dziś dotyczy to głównie przypadku zgodnego z Codex:
  - `HOOK.md`
  - `handler.ts` lub `handler.js`

#### MCP dla Pi

- włączone pakiety mogą dostarczać konfigurację serwera MCP
- OpenClaw scala konfigurację MCP z pakietu z efektywnymi ustawieniami osadzonego Pi jako
  `mcpServers`
- OpenClaw udostępnia obsługiwane narzędzia MCP z pakietu podczas tur agenta osadzonego Pi,
  uruchamiając serwery stdio lub łącząc się z serwerami HTTP
- lokalne ustawienia Pi dla projektu nadal obowiązują po domyślnych ustawieniach pakietu, więc
  ustawienia przestrzeni roboczej mogą w razie potrzeby zastępować wpisy MCP z pakietu
- katalogi narzędzi MCP z pakietu są sortowane deterministycznie przed rejestracją, dzięki czemu
  zmiany w kolejności `listTools()` po stronie upstream nie destabilizują bloków narzędzi w pamięci podręcznej promptów

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

**HTTP** łączy się z działającym serwerem MCP przez `sse` domyślnie lub przez `streamable-http`, gdy zostanie to wskazane:

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

- `transport` może mieć wartość `"streamable-http"` lub `"sse"`; gdy jest pominięty, OpenClaw używa `sse`
- dozwolone są tylko schematy URL `http:` i `https:`
- wartości `headers` obsługują interpolację `${ENV_VAR}`
- wpis serwera zawierający jednocześnie `command` i `url` jest odrzucany
- poświadczenia URL (userinfo i parametry zapytania) są redagowane w opisach
  narzędzi i logach
- `connectionTimeoutMs` zastępuje domyślny 30-sekundowy limit czasu połączenia dla
  transportów stdio i HTTP

##### Nazewnictwo narzędzi

OpenClaw rejestruje narzędzia MCP z pakietów pod nazwami bezpiecznymi dla dostawcy w formacie
`serverName__toolName`. Na przykład serwer o kluczu `"vigil-harbor"` udostępniający
narzędzie `memory_search` zostanie zarejestrowany jako `vigil-harbor__memory_search`.

- znaki spoza `A-Za-z0-9_-` są zastępowane przez `-`
- prefiksy serwera są ograniczone do 30 znaków
- pełne nazwy narzędzi są ograniczone do 64 znaków
- puste nazwy serwerów domyślnie przyjmują `mcp`
- kolidujące oczyszczone nazwy są rozróżniane za pomocą sufiksów liczbowych
- końcowa kolejność udostępnianych narzędzi jest deterministyczna według bezpiecznej nazwy, aby kolejne tury Pi
  pozostawały stabilne względem pamięci podręcznej

#### Ustawienia osadzonego Pi

- Claude `settings.json` jest importowany jako domyślne ustawienia osadzonego Pi, gdy
  pakiet jest włączony
- OpenClaw oczyszcza klucze nadpisywania powłoki przed ich zastosowaniem

Oczyszczane klucze:

- `shellPath`
- `shellCommandPrefix`

#### Osadzony Pi LSP

- włączone pakiety Claude mogą dostarczać konfigurację serwera LSP
- OpenClaw ładuje `.lsp.json` oraz wszelkie ścieżki `lspServers` zadeklarowane w manifeście
- konfiguracja LSP z pakietu jest scalana z efektywnymi domyślnymi ustawieniami LSP osadzonego Pi
- obecnie można uruchamiać tylko obsługiwane serwery LSP działające przez stdio; nieobsługiwane
  transporty nadal są wyświetlane w `openclaw plugins inspect <id>`

### Wykrywane, ale niewykonywane

Są rozpoznawane i pokazywane w diagnostyce, ale OpenClaw ich nie uruchamia:

- Claude `agents`, automatyzacja `hooks.json`, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Wbudowane metadane Codex/app wykraczające poza raportowanie możliwości

## Formaty pakietów

<AccordionGroup>
  <Accordion title="Pakiety Codex">
    Znaczniki: `.codex-plugin/plugin.json`

    Zawartość opcjonalna: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Pakiety Codex najlepiej pasują do OpenClaw, gdy używają głównych katalogów Skills i katalogów
    pakietów hooków w stylu OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Pakiety Claude">
    Dwa tryby wykrywania:

    - **Oparte na manifeście:** `.claude-plugin/plugin.json`
    - **Bez manifestu:** domyślny układ Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Zachowanie specyficzne dla Claude:

    - `commands/` jest traktowane jako zawartość Skills
    - `settings.json` jest importowany do ustawień osadzonego Pi (klucze nadpisywania powłoki są oczyszczane)
    - `.mcp.json` udostępnia obsługiwane narzędzia stdio osadzonemu Pi
    - `.lsp.json` oraz ścieżki `lspServers` zadeklarowane w manifeście są ładowane do domyślnych ustawień LSP osadzonego Pi
    - `hooks/hooks.json` jest wykrywany, ale nie jest wykonywany
    - niestandardowe ścieżki komponentów w manifeście są addytywne (rozszerzają domyślne, a nie je zastępują)

  </Accordion>

  <Accordion title="Pakiety Cursor">
    Znaczniki: `.cursor-plugin/plugin.json`

    Zawartość opcjonalna: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` jest traktowane jako zawartość Skills
    - `.cursor/rules/`, `.cursor/agents/` oraz `.cursor/hooks.json` są tylko wykrywane

  </Accordion>
</AccordionGroup>

## Priorytet wykrywania

OpenClaw najpierw sprawdza natywny format pluginu:

1. `openclaw.plugin.json` lub prawidłowy `package.json` z `openclaw.extensions` — traktowane jako **natywny plugin**
2. znaczniki pakietu (`.codex-plugin/`, `.claude-plugin/` lub domyślny układ Claude/Cursor) — traktowane jako **pakiet**

Jeśli katalog zawiera oba formaty, OpenClaw używa ścieżki natywnej. Zapobiega to
częściowej instalacji pakietów dwufomatowych jako pakietów.

## Bezpieczeństwo

Pakiety mają węższą granicę zaufania niż natywne pluginy:

- OpenClaw **nie** ładuje w procesie dowolnych modułów uruchomieniowych pakietu
- ścieżki Skills i pakietów hooków muszą pozostawać wewnątrz katalogu głównego pluginu (sprawdzanie granic)
- pliki ustawień są odczytywane z użyciem tych samych kontroli granic
- obsługiwane serwery MCP stdio mogą być uruchamiane jako podprocesy

Dzięki temu pakiety są domyślnie bezpieczniejsze, ale nadal należy traktować pakiety
zewnętrzne jako zaufaną zawartość dla funkcji, które faktycznie udostępniają.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Pakiet jest wykrywany, ale możliwości nie działają">
    Uruchom `openclaw plugins inspect <id>`. Jeśli możliwość jest wymieniona, ale oznaczona jako
    niepodłączona, jest to ograniczenie produktu — a nie uszkodzona instalacja.
  </Accordion>

  <Accordion title="Pliki poleceń Claude się nie pojawiają">
    Upewnij się, że pakiet jest włączony, a pliki markdown znajdują się wewnątrz wykrytego
    katalogu `commands/` lub `skills/`.
  </Accordion>

  <Accordion title="Ustawienia Claude nie są stosowane">
    Obsługiwane są tylko ustawienia osadzonego Pi z `settings.json`. OpenClaw nie
    traktuje ustawień pakietu jako surowych poprawek konfiguracji.
  </Accordion>

  <Accordion title="Hooki Claude się nie wykonują">
    `hooks/hooks.json` jest tylko wykrywany. Jeśli potrzebujesz wykonywalnych hooków, użyj
    układu pakietu hooków OpenClaw albo dostarcz natywny plugin.
  </Accordion>
</AccordionGroup>

## Powiązane

- [Instalowanie i konfigurowanie pluginów](/tools/plugin)
- [Tworzenie pluginów](/plugins/building-plugins) — utwórz natywny plugin
- [Manifest pluginu](/plugins/manifest) — schemat natywnego manifestu
