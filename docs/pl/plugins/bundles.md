---
read_when:
    - Chcesz zainstalować pakiet zgodny z Codex, Claude lub Cursor
    - Musisz zrozumieć, jak OpenClaw mapuje zawartość pakietu na funkcje natywne
    - Debugujesz wykrywanie pakietu lub brakujące możliwości
summary: Instalowanie i używanie pakietów Codex, Claude i Cursor jako pluginów OpenClaw
title: Pakiety Plugin
x-i18n:
    generated_at: "2026-04-30T10:05:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6d03643c3029f5c6c81fab3aa1c00accba94da64a834e381b29db8f405d6bdee
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw może instalować pluginy z trzech zewnętrznych ekosystemów: **Codex**, **Claude**
i **Cursor**. Są one nazywane **pakietami** — paczkami treści i metadanych, które
OpenClaw mapuje na natywne funkcje, takie jak Skills, hooki i narzędzia MCP.

<Info>
  Pakiety **nie** są tym samym co natywne pluginy OpenClaw. Natywne pluginy działają
  w procesie i mogą rejestrować dowolne możliwości. Pakiety to paczki treści z
  selektywnym mapowaniem funkcji i węższą granicą zaufania.
</Info>

## Dlaczego istnieją pakiety

Wiele użytecznych pluginów jest publikowanych w formacie Codex, Claude lub Cursor. Zamiast
wymagać od autorów przepisywania ich jako natywnych pluginów OpenClaw, OpenClaw
wykrywa te formaty i mapuje obsługiwaną treść na natywny zestaw funkcji. Oznacza
to, że możesz zainstalować pakiet poleceń Claude lub pakiet Skills Codex
i od razu z niego korzystać.

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

Nie każda funkcja pakietu działa dziś w OpenClaw. Oto, co działa i co
jest wykrywane, ale nie jest jeszcze podłączone.

### Obecnie obsługiwane

| Funkcja       | Jak jest mapowana                                                                                 | Dotyczy        |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Treść Skills | Korzenie Skills z pakietu ładują się jak zwykłe Skills OpenClaw                                           | Wszystkie formaty    |
| Polecenia      | `commands/` i `.cursor/commands/` traktowane są jako korzenie Skills                                  | Claude, Cursor |
| Pakiety hooków    | Układy w stylu OpenClaw: `HOOK.md` + `handler.ts`                                             | Codex          |
| Narzędzia MCP     | Konfiguracja MCP pakietu scalana z ustawieniami osadzonego Pi; obsługiwane serwery stdio i HTTP są ładowane | Wszystkie formaty    |
| Serwery LSP   | Claude `.lsp.json` i zadeklarowane w manifeście `lspServers` scalane z domyślnymi ustawieniami LSP osadzonego Pi  | Claude         |
| Ustawienia      | Claude `settings.json` importowany jako domyślne ustawienia osadzonego Pi                                     | Claude         |

#### Treść Skills

- korzenie Skills z pakietu ładują się jak zwykłe korzenie Skills OpenClaw
- korzenie Claude `commands` są traktowane jako dodatkowe korzenie Skills
- korzenie Cursor `.cursor/commands` są traktowane jako dodatkowe korzenie Skills

Oznacza to, że markdownowe pliki poleceń Claude działają przez zwykły loader Skills
OpenClaw. Markdownowe polecenia Cursor działają tą samą ścieżką.

#### Pakiety hooków

- korzenie hooków pakietu działają **tylko** wtedy, gdy używają zwykłego układu
  pakietu hooków OpenClaw. Dziś dotyczy to głównie przypadku zgodnego z Codex:
  - `HOOK.md`
  - `handler.ts` lub `handler.js`

#### MCP dla Pi

- włączone pakiety mogą dostarczać konfigurację serwera MCP
- OpenClaw scala konfigurację MCP pakietu z efektywnymi ustawieniami osadzonego Pi jako
  `mcpServers`
- OpenClaw udostępnia obsługiwane narzędzia MCP pakietu podczas tur osadzonego agenta Pi,
  uruchamiając serwery stdio lub łącząc się z serwerami HTTP
- profile narzędzi `coding` i `messaging` domyślnie obejmują narzędzia MCP pakietów;
  użyj `tools.deny: ["bundle-mcp"]`, aby wyłączyć je dla agenta lub Gateway
- lokalne ustawienia Pi projektu nadal obowiązują po domyślnych ustawieniach pakietu, więc
  ustawienia obszaru roboczego mogą w razie potrzeby zastępować wpisy MCP pakietu
- katalogi narzędzi MCP pakietów są sortowane deterministycznie przed rejestracją, więc
  zmiany kolejności upstream `listTools()` nie powodują ciągłych zmian bloków narzędzi prompt-cache

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

**HTTP** domyślnie łączy się z działającym serwerem MCP przez `sse`, albo przez `streamable-http`, gdy zostanie zażądane:

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

- `transport` można ustawić na `"streamable-http"` lub `"sse"`; gdy jest pominięte, OpenClaw używa `sse`
- `type: "http"` to natywny dla CLI kształt downstream; w konfiguracji OpenClaw użyj `transport: "streamable-http"`. `openclaw mcp set` i `openclaw doctor --fix` normalizują popularny alias.
- dozwolone są tylko schematy URL `http:` i `https:`
- wartości `headers` obsługują interpolację `${ENV_VAR}`
- wpis serwera zawierający jednocześnie `command` i `url` jest odrzucany
- poświadczenia URL (userinfo i parametry zapytania) są redagowane z opisów
  narzędzi i logów
- `connectionTimeoutMs` zastępuje domyślny 30-sekundowy limit czasu połączenia dla
  transportów stdio i HTTP

##### Nazewnictwo narzędzi

OpenClaw rejestruje narzędzia MCP pakietu z nazwami bezpiecznymi dla providerów w postaci
`serverName__toolName`. Na przykład serwer o kluczu `"vigil-harbor"` udostępniający
narzędzie `memory_search` jest rejestrowany jako `vigil-harbor__memory_search`.

- znaki spoza `A-Za-z0-9_-` są zastępowane znakiem `-`
- prefiksy serwerów są ograniczone do 30 znaków
- pełne nazwy narzędzi są ograniczone do 64 znaków
- puste nazwy serwerów wracają do `mcp`
- kolidujące oczyszczone nazwy są rozróżniane sufiksami liczbowymi
- końcowa ujawniona kolejność narzędzi jest deterministyczna według bezpiecznej nazwy, aby utrzymać powtarzane tury Pi
  stabilne dla cache
- filtrowanie profili traktuje wszystkie narzędzia z jednego serwera MCP pakietu jako należące do pluginu
  `bundle-mcp`, więc listy dozwolonych i listy odmów profilu mogą obejmować zarówno
  pojedyncze ujawnione nazwy narzędzi, jak i klucz pluginu `bundle-mcp`

#### Ustawienia osadzonego Pi

- Claude `settings.json` jest importowany jako domyślne ustawienia osadzonego Pi, gdy
  pakiet jest włączony
- OpenClaw oczyszcza klucze nadpisania powłoki przed ich zastosowaniem

Oczyszczane klucze:

- `shellPath`
- `shellCommandPrefix`

#### LSP osadzonego Pi

- włączone pakiety Claude mogą dostarczać konfigurację serwera LSP
- OpenClaw ładuje `.lsp.json` oraz wszelkie ścieżki `lspServers` zadeklarowane w manifeście
- konfiguracja LSP pakietu jest scalana z efektywnymi domyślnymi ustawieniami LSP osadzonego Pi
- dziś uruchamialne są tylko obsługiwane serwery LSP oparte na stdio; nieobsługiwane
  transporty nadal pojawiają się w `openclaw plugins inspect <id>`

### Wykrywane, ale niewykonywane

Są rozpoznawane i pokazywane w diagnostyce, ale OpenClaw ich nie uruchamia:

- Claude `agents`, automatyzacja `hooks.json`, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- metadane inline/aplikacji Codex poza raportowaniem możliwości

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

    - **Oparty na manifeście:** `.claude-plugin/plugin.json`
    - **Bez manifestu:** domyślny układ Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Zachowanie specyficzne dla Claude:

    - `commands/` jest traktowane jako treść Skills
    - `settings.json` jest importowany do ustawień osadzonego Pi (klucze nadpisania powłoki są oczyszczane)
    - `.mcp.json` udostępnia obsługiwane narzędzia stdio osadzonemu Pi
    - `.lsp.json` oraz ścieżki `lspServers` zadeklarowane w manifeście ładują się do domyślnych ustawień LSP osadzonego Pi
    - `hooks/hooks.json` jest wykrywany, ale niewykonywany
    - Niestandardowe ścieżki komponentów w manifeście są addytywne (rozszerzają ustawienia domyślne, a nie je zastępują)

  </Accordion>

  <Accordion title="Pakiety Cursor">
    Znaczniki: `.cursor-plugin/plugin.json`

    Opcjonalna treść: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` jest traktowane jako treść Skills
    - `.cursor/rules/`, `.cursor/agents/` i `.cursor/hooks.json` są tylko wykrywane

  </Accordion>
</AccordionGroup>

## Pierwszeństwo wykrywania

OpenClaw najpierw sprawdza natywny format pluginu:

1. `openclaw.plugin.json` lub prawidłowy `package.json` z `openclaw.extensions` — traktowane jako **natywny plugin**
2. Znaczniki pakietu (`.codex-plugin/`, `.claude-plugin/` lub domyślny układ Claude/Cursor) — traktowane jako **pakiet**

Jeśli katalog zawiera oba, OpenClaw używa ścieżki natywnej. Zapobiega to
częściowej instalacji pakietów dwufomatowych jako pakietów.

## Zależności runtime i czyszczenie

- Kompatybilne pakiety innych firm nie otrzymują naprawy `npm install` przy starcie. Powinny
  być instalowane przez `openclaw plugins install` i dostarczać wszystko, czego
  potrzebują, w zainstalowanym katalogu pluginu.
- Spakowane pluginy pakietowe należące do OpenClaw mają wąski wyjątek: gdy jeden z nich jest
  włączony, start Gateway może naprawić brakujące zadeklarowane zależności runtime
  przed importem. Operatorzy mogą sprawdzić lub naprawić ten etap za pomocą
  `openclaw plugins deps`.
- Pipeline wydawniczy nadal odpowiada za dostarczanie kompletnego ładunku zależności
  pakietu, gdy to możliwe (zobacz regułę weryfikacji postpublish w
  [Wydawaniu](/pl/reference/RELEASING)).

## Bezpieczeństwo

Pakiety mają węższą granicę zaufania niż natywne pluginy:

- OpenClaw **nie** ładuje dowolnych modułów runtime pakietu w procesie
- Ścieżki Skills i pakietów hooków muszą pozostawać wewnątrz katalogu głównego pluginu (sprawdzane względem granicy)
- Pliki ustawień są odczytywane z tymi samymi kontrolami granic
- Obsługiwane serwery MCP stdio mogą być uruchamiane jako podprocesy

Dzięki temu pakiety są domyślnie bezpieczniejsze, ale nadal należy traktować pakiety
innych firm jako zaufaną treść dla funkcji, które udostępniają.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Pakiet jest wykrywany, ale możliwości nie działają">
    Uruchom `openclaw plugins inspect <id>`. Jeśli możliwość jest wymieniona, ale oznaczona jako
    niepodłączona, jest to ograniczenie produktu — nie uszkodzona instalacja.
  </Accordion>

  <Accordion title="Pliki poleceń Claude się nie pojawiają">
    Upewnij się, że pakiet jest włączony, a pliki markdown znajdują się w wykrytym
    korzeniu `commands/` lub `skills/`.
  </Accordion>

  <Accordion title="Ustawienia Claude nie są stosowane">
    Obsługiwane są tylko ustawienia osadzonego Pi z `settings.json`. OpenClaw nie
    traktuje ustawień pakietu jako surowych łatek konfiguracji.
  </Accordion>

  <Accordion title="Hooki Claude nie wykonują się">
    `hooks/hooks.json` jest tylko wykrywany. Jeśli potrzebujesz uruchamialnych hooków, użyj
    układu pakietu hooków OpenClaw albo dostarcz natywny plugin.
  </Accordion>
</AccordionGroup>

## Powiązane

- [Instalowanie i konfigurowanie pluginów](/pl/tools/plugin)
- [Tworzenie pluginów](/pl/plugins/building-plugins) — utwórz natywny plugin
- [Manifest pluginu](/pl/plugins/manifest) — schemat natywnego manifestu
