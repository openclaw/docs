---
read_when:
    - Chcesz zainstalować pakiet zgodny z Codex, Claude albo Cursor.
    - Musisz zrozumieć, jak OpenClaw mapuje zawartość pakietu na natywne funkcje.
    - Debugujesz wykrywanie pakietów albo brakujące możliwości.
summary: Instalowanie i używanie pakietów Codex, Claude i Cursor jako Pluginów OpenClaw
title: Pakiety Pluginów
x-i18n:
    generated_at: "2026-04-24T09:22:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: a455eaa64b227204ca4e2a6283644edb72d7a4cfad0f2fcf4439d061dcb374bc
    source_path: plugins/bundles.md
    workflow: 15
---

OpenClaw może instalować Pluginy z trzech zewnętrznych ekosystemów: **Codex**, **Claude**
i **Cursor**. Nazywamy je **pakietami** — pakietami treści i metadanych, które
OpenClaw mapuje na natywne funkcje, takie jak Skills, hooki i narzędzia MCP.

<Info>
  Pakiety **nie** są tym samym co natywne Pluginy OpenClaw. Natywne Pluginy działają
  w procesie i mogą rejestrować dowolne możliwości. Pakiety są zestawami treści z
  selektywnym mapowaniem funkcji i węższą granicą zaufania.
</Info>

## Dlaczego istnieją pakiety

Wiele przydatnych Pluginów jest publikowanych w formacie Codex, Claude albo Cursor. Zamiast
wymagać od autorów przepisywania ich jako natywnych Pluginów OpenClaw, OpenClaw
wykrywa te formaty i mapuje ich obsługiwaną zawartość do natywnego zestawu
funkcji. Oznacza to, że możesz zainstalować pakiet poleceń Claude albo pakiet Skills Codex
i używać go od razu.

## Instalowanie pakietu

<Steps>
  <Step title="Zainstaluj z katalogu, archiwum albo marketplace">
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

    Pakiety pojawiają się jako `Format: bundle` z podtypem `codex`, `claude` albo `cursor`.

  </Step>

  <Step title="Uruchom ponownie i używaj">
    ```bash
    openclaw gateway restart
    ```

    Zmapowane funkcje (Skills, hooki, narzędzia MCP, ustawienia domyślne LSP) są dostępne w następnej sesji.

  </Step>
</Steps>

## Co OpenClaw mapuje z pakietów

Nie każda funkcja pakietu działa dziś w OpenClaw. Oto co działa, a co
jest wykrywane, ale jeszcze niepodłączone.

### Obecnie obsługiwane

| Funkcja         | Jak jest mapowana                                                                          | Dotyczy         |
| --------------- | ------------------------------------------------------------------------------------------ | --------------- |
| Zawartość Skills | Korzenie Skills pakietu są ładowane jako zwykłe Skills OpenClaw                            | Wszystkie formaty |
| Polecenia       | `commands/` i `.cursor/commands/` są traktowane jako korzenie Skills                       | Claude, Cursor  |
| Pakiety hooków  | Układy w stylu OpenClaw `HOOK.md` + `handler.ts`                                           | Codex           |
| Narzędzia MCP   | Konfiguracja MCP pakietu jest scalana z osadzonymi ustawieniami Pi; ładowane są obsługiwane serwery stdio i HTTP | Wszystkie formaty |
| Serwery LSP     | Claude `.lsp.json` i zadeklarowane w manifeście `lspServers` są scalane z domyślnymi ustawieniami LSP osadzonego Pi | Claude |
| Ustawienia      | Claude `settings.json` jest importowane jako domyślne ustawienia osadzonego Pi            | Claude          |

#### Zawartość Skills

- korzenie Skills pakietu są ładowane jako zwykłe korzenie Skills OpenClaw
- korzenie Claude `commands` są traktowane jako dodatkowe korzenie Skills
- korzenie Cursor `.cursor/commands` są traktowane jako dodatkowe korzenie Skills

Oznacza to, że pliki poleceń markdown Claude działają przez normalny loader Skills OpenClaw.
Polecenia markdown Cursor działają przez tę samą ścieżkę.

#### Pakiety hooków

- korzenie hooków pakietów działają **tylko** wtedy, gdy używają normalnego układu
  pakietu hooków OpenClaw. Dziś dotyczy to głównie przypadku zgodnego z Codex:
  - `HOOK.md`
  - `handler.ts` albo `handler.js`

#### MCP dla Pi

- włączone pakiety mogą dostarczać konfigurację serwera MCP
- OpenClaw scala konfigurację MCP pakietu do efektywnych ustawień osadzonego Pi jako
  `mcpServers`
- OpenClaw udostępnia obsługiwane narzędzia MCP pakietu podczas tur agenta osadzonego Pi przez
  uruchamianie serwerów stdio albo łączenie się z serwerami HTTP
- profile narzędzi `coding` i `messaging` domyślnie zawierają narzędzia MCP pakietów; użyj `tools.deny: ["bundle-mcp"]`, aby zrezygnować dla agenta albo gateway
- lokalne ustawienia Pi dla projektu są nadal stosowane po ustawieniach domyślnych pakietu, więc
  ustawienia workspace mogą nadpisywać wpisy MCP pakietu, gdy to potrzebne
- katalogi narzędzi MCP pakietów są sortowane deterministycznie przed rejestracją, aby
  zmiany kolejności `listTools()` upstream nie powodowały thrashingu bloków narzędzi prompt-cache

##### Transporty

Serwery MCP mogą używać transportu stdio albo HTTP:

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

**HTTP** łączy się z działającym serwerem MCP przez `sse` domyślnie albo `streamable-http`, gdy o to poproszono:

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

- `transport` może mieć wartość `"streamable-http"` albo `"sse"`; gdy jest pominięty, OpenClaw używa `sse`
- dozwolone są tylko schematy URL `http:` i `https:`
- wartości `headers` obsługują interpolację `${ENV_VAR}`
- wpis serwera zawierający jednocześnie `command` i `url` jest odrzucany
- poświadczenia URL (userinfo i query params) są redagowane w opisach
  narzędzi i logach
- `connectionTimeoutMs` nadpisuje domyślny 30-sekundowy timeout połączenia dla
  transportów stdio i HTTP

##### Nazewnictwo narzędzi

OpenClaw rejestruje narzędzia MCP pakietów z bezpiecznymi dla dostawców nazwami w formacie
`serverName__toolName`. Na przykład serwer oznaczony kluczem `"vigil-harbor"` udostępniający
narzędzie `memory_search` zostanie zarejestrowany jako `vigil-harbor__memory_search`.

- znaki spoza `A-Za-z0-9_-` są zastępowane przez `-`
- prefiksy serwerów są ograniczane do 30 znaków
- pełne nazwy narzędzi są ograniczane do 64 znaków
- puste nazwy serwerów używają fallbacku `mcp`
- kolidujące oczyszczone nazwy są rozróżniane przez sufiksy numeryczne
- końcowa kolejność udostępnianych narzędzi jest deterministyczna według bezpiecznej nazwy, aby utrzymać stabilność cache przy powtarzanych turach Pi
- filtrowanie profili traktuje wszystkie narzędzia z jednego serwera MCP pakietu jako należące do Pluginu
  `bundle-mcp`, więc allowlisty i deny listy profili mogą zawierać albo
  pojedyncze nazwy udostępnianych narzędzi, albo klucz Pluginu `bundle-mcp`

#### Ustawienia osadzonego Pi

- Claude `settings.json` jest importowane jako domyślne ustawienia osadzonego Pi, gdy
  pakiet jest włączony
- OpenClaw oczyszcza klucze nadpisania powłoki przed ich zastosowaniem

Oczyszczane klucze:

- `shellPath`
- `shellCommandPrefix`

#### Osadzone Pi LSP

- włączone pakiety Claude mogą dostarczać konfigurację serwerów LSP
- OpenClaw ładuje `.lsp.json` oraz wszelkie ścieżki `lspServers` zadeklarowane w manifeście
- konfiguracja LSP pakietu jest scalana z efektywnymi ustawieniami domyślnymi LSP osadzonego Pi
- dziś można uruchamiać tylko obsługiwane serwery LSP oparte na stdio; nieobsługiwane
  transporty nadal pojawiają się w `openclaw plugins inspect <id>`

### Wykrywane, ale niewykonywane

Te elementy są rozpoznawane i pokazywane w diagnostyce, ale OpenClaw ich nie wykonuje:

- Claude `agents`, automatyzacja `hooks.json`, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Metadane inline/app Codex wykraczające poza raportowanie możliwości

## Formaty pakietów

<AccordionGroup>
  <Accordion title="Pakiety Codex">
    Markery: `.codex-plugin/plugin.json`

    Opcjonalna zawartość: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Pakiety Codex najlepiej pasują do OpenClaw, gdy używają korzeni Skills i katalogów
    pakietów hooków w stylu OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Pakiety Claude">
    Dwa tryby wykrywania:

    - **Oparte na manifeście:** `.claude-plugin/plugin.json`
    - **Bez manifestu:** domyślny układ Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Zachowanie specyficzne dla Claude:

    - `commands/` jest traktowane jako zawartość Skills
    - `settings.json` jest importowane do ustawień osadzonego Pi (klucze nadpisania powłoki są oczyszczane)
    - `.mcp.json` udostępnia obsługiwane narzędzia stdio dla osadzonego Pi
    - `.lsp.json` oraz ścieżki `lspServers` zadeklarowane w manifeście są ładowane do ustawień domyślnych LSP osadzonego Pi
    - `hooks/hooks.json` jest wykrywane, ale niewykonywane
    - Niestandardowe ścieżki komponentów w manifeście są addytywne (rozszerzają domyślne, a nie je zastępują)

  </Accordion>

  <Accordion title="Pakiety Cursor">
    Markery: `.cursor-plugin/plugin.json`

    Opcjonalna zawartość: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` jest traktowane jako zawartość Skills
    - `.cursor/rules/`, `.cursor/agents/` i `.cursor/hooks.json` są tylko wykrywane

  </Accordion>
</AccordionGroup>

## Pierwszeństwo wykrywania

OpenClaw najpierw sprawdza natywny format Pluginu:

1. `openclaw.plugin.json` albo prawidłowy `package.json` z `openclaw.extensions` — traktowane jako **natywny Plugin**
2. Markery pakietów (`.codex-plugin/`, `.claude-plugin/` albo domyślny układ Claude/Cursor) — traktowane jako **pakiet**

Jeśli katalog zawiera oba, OpenClaw używa ścieżki natywnej. Zapobiega to
częściowej instalacji pakietów dual-format jako pakietów.

## Zależności runtime i czyszczenie

- Zależności runtime dołączonych Pluginów są dostarczane wewnątrz pakietu OpenClaw pod
  `dist/*`. OpenClaw **nie** uruchamia `npm install` przy starcie dla dołączonych
  Pluginów; pipeline wydawniczy odpowiada za dostarczenie kompletnego pakietu
  zależności dołączonych (zobacz regułę weryfikacji postpublish w
  [Releasing](/pl/reference/RELEASING)).

## Bezpieczeństwo

Pakiety mają węższą granicę zaufania niż natywne Pluginy:

- OpenClaw **nie** ładuje arbitralnych modułów runtime pakietów w procesie
- Ścieżki Skills i pakietów hooków muszą pozostawać wewnątrz katalogu głównego Pluginu (sprawdzanie granic)
- Pliki ustawień są odczytywane z użyciem tych samych kontroli granic
- Obsługiwane serwery MCP stdio mogą być uruchamiane jako procesy potomne

To sprawia, że pakiety są domyślnie bezpieczniejsze, ale nadal powinieneś traktować pakiety firm trzecich jako zaufaną zawartość w zakresie funkcji, które rzeczywiście udostępniają.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Pakiet jest wykrywany, ale możliwości nie działają">
    Uruchom `openclaw plugins inspect <id>`. Jeśli możliwość jest wymieniona, ale oznaczona jako
    niepodłączona, jest to ograniczenie produktu — nie uszkodzona instalacja.
  </Accordion>

  <Accordion title="Pliki poleceń Claude nie pojawiają się">
    Upewnij się, że pakiet jest włączony i że pliki markdown znajdują się wewnątrz wykrytego
    korzenia `commands/` albo `skills/`.
  </Accordion>

  <Accordion title="Ustawienia Claude nie są stosowane">
    Obsługiwane są tylko ustawienia osadzonego Pi z `settings.json`. OpenClaw nie
    traktuje ustawień pakietów jako surowych łatek konfiguracji.
  </Accordion>

  <Accordion title="Hooki Claude nie wykonują się">
    `hooks/hooks.json` jest tylko wykrywane. Jeśli potrzebujesz wykonywalnych hooków, użyj
    układu pakietu hooków OpenClaw albo dostarcz natywny Plugin.
  </Accordion>
</AccordionGroup>

## Powiązane

- [Instalowanie i konfigurowanie Pluginów](/pl/tools/plugin)
- [Budowanie Pluginów](/pl/plugins/building-plugins) — tworzenie natywnego Pluginu
- [Manifest Pluginu](/pl/plugins/manifest) — schemat natywnego manifestu
