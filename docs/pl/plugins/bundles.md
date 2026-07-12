---
read_when:
    - Chcesz zainstalować pakiet zgodny z Codex, Claude lub Cursor
    - Musisz zrozumieć, jak OpenClaw mapuje zawartość pakietu na funkcje natywne
    - Debugujesz wykrywanie pakietu lub brakujące możliwości
summary: Instalowanie i używanie pakietów Codex, Claude i Cursor jako pluginów OpenClaw
title: Pakiety Pluginów
x-i18n:
    generated_at: "2026-07-12T15:22:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d44006866238f53ee2e3e8126cc4f7ed6f7413534257775f7904c9b877778c59
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw może instalować pluginy z trzech zewnętrznych ekosystemów: **Codex**, **Claude**
i **Cursor**. Są one nazywane **pakietami** — zestawami treści i metadanych, które
OpenClaw odwzorowuje na natywne funkcje, takie jak Skills, hooki i narzędzia MCP.

<Info>
  Pakiety **nie** są tym samym co natywne pluginy OpenClaw. Natywne pluginy działają
  wewnątrz procesu i mogą rejestrować dowolne możliwości. Pakiety są zestawami treści
  z selektywnym odwzorowaniem funkcji i węższą granicą zaufania.
</Info>

## Dlaczego istnieją pakiety

Wiele przydatnych pluginów jest publikowanych w formacie Codex, Claude lub Cursor. Zamiast
wymagać od autorów przepisywania ich jako natywnych pluginów OpenClaw, OpenClaw
wykrywa te formaty i odwzorowuje obsługiwaną przez nie zawartość na natywny zestaw
funkcji. Możesz zainstalować pakiet poleceń Claude lub pakiet Skills Codex i od razu
zacząć z niego korzystać.

## Instalowanie pakietu

<Steps>
  <Step title="Zainstaluj z katalogu, archiwum lub marketplace">
    ```bash
    # Katalog lokalny
    openclaw plugins install ./my-bundle

    # Archiwum
    openclaw plugins install ./my-bundle.tgz

    # Marketplace Claude
    openclaw plugins marketplace list <source>
    openclaw plugins install <plugin> --marketplace <source>
    ```

    `<source>` to lokalna ścieżka do marketplace/repozytorium albo źródło git/GitHub.

  </Step>

  <Step title="Zweryfikuj wykrycie">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Pakiety wyświetlają `Format: bundle` oraz wartość `Bundle format:` równą `codex`,
    `claude` lub `cursor`.

  </Step>

  <Step title="Uruchom ponownie i używaj">
    ```bash
    openclaw gateway restart
    ```

    Odwzorowane funkcje (Skills, hooki, narzędzia MCP, wartości domyślne LSP) są dostępne w następnej sesji.

  </Step>
</Steps>

## Co OpenClaw odwzorowuje z pakietów

Obecnie nie każda funkcja pakietu działa w OpenClaw. Poniżej przedstawiono funkcje,
które działają, oraz te, które są wykrywane, ale nie zostały jeszcze podłączone.

### Obecnie obsługiwane

| Funkcja        | Sposób odwzorowania                                                                               | Dotyczy        |
| -------------- | ------------------------------------------------------------------------------------------------- | -------------- |
| Zawartość Skills | Katalogi główne Skills pakietu są ładowane jako zwykłe Skills OpenClaw                          | Wszystkie formaty |
| Polecenia      | `commands/` i `.cursor/commands/` są traktowane jako katalogi główne Skills                        | Claude, Cursor |
| Pakiety hooków | Układy w stylu OpenClaw: `HOOK.md` + `handler.ts`                                                  | Codex          |
| Narzędzia MCP  | Konfiguracja MCP pakietu jest scalana z osadzonymi ustawieniami OpenClaw; ładowane są obsługiwane serwery stdio i HTTP | Wszystkie formaty |
| Serwery LSP    | Plik `.lsp.json` Claude i zadeklarowane w manifeście `lspServers` są scalane z osadzonymi wartościami domyślnymi LSP OpenClaw | Claude         |
| Ustawienia     | Plik `settings.json` Claude jest importowany jako osadzone wartości domyślne OpenClaw              | Claude         |

#### Zawartość Skills

- Katalogi główne Skills pakietu są ładowane jako zwykłe katalogi główne Skills OpenClaw.
- Katalogi główne `commands/` Claude są traktowane jako dodatkowe katalogi główne Skills.
- Katalogi główne `.cursor/commands/` Cursor są traktowane jako dodatkowe katalogi główne Skills.

Pliki poleceń Markdown Claude i pliki poleceń Markdown Cursor działają za pośrednictwem
zwykłego modułu ładującego Skills OpenClaw.

#### Pakiety hooków

Katalogi główne hooków pakietu działają **tylko** wtedy, gdy używają zwykłego układu
pakietu hooków OpenClaw: `HOOK.md` oraz `handler.ts` lub `handler.js`. Obecnie dotyczy
to przede wszystkim przypadku zgodnego z Codex.

#### MCP dla osadzonego OpenClaw

- Włączone pakiety mogą dostarczać konfigurację serwerów MCP.
- OpenClaw scala konfigurację MCP pakietu z obowiązującymi ustawieniami osadzonego
  OpenClaw jako `mcpServers`.
- OpenClaw udostępnia obsługiwane narzędzia MCP pakietu podczas tur agenta
  osadzonego OpenClaw, uruchamiając serwery stdio lub łącząc się z serwerami HTTP.
- Profile narzędzi `coding` i `messaging` domyślnie obejmują narzędzia MCP pakietów;
  użyj `tools.deny: ["bundle-mcp"]`, aby wyłączyć je dla agenta lub Gateway.
- Lokalne ustawienia osadzonego agenta dla projektu nadal są stosowane po wartościach
  domyślnych pakietu, dzięki czemu ustawienia przestrzeni roboczej mogą w razie potrzeby
  nadpisywać wpisy MCP pakietu.
- Katalogi narzędzi MCP pakietów są sortowane deterministycznie przed rejestracją,
  dlatego zmiany kolejności zwracanej przez nadrzędne `listTools()` nie powodują
  ciągłych zmian bloków narzędzi w pamięci podręcznej promptów.

##### Transporty

Serwery MCP mogą używać transportu stdio lub HTTP.

Transport **stdio** uruchamia proces potomny:

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

Transport **HTTP** łączy się z działającym serwerem MCP, domyślnie używając `sse`,
chyba że zażądano `streamable-http`:

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

- `transport` przyjmuje `"streamable-http"` lub `"sse"`; w razie pominięcia domyślnie używane jest `sse`.
- `type: "http"` jest natywną dla CLI postacią używaną przez systemy niższego poziomu; w konfiguracji OpenClaw użyj `transport: "streamable-http"`. Polecenia `openclaw mcp set` i `openclaw doctor --fix` normalizują ten popularny alias.
- Dozwolone są tylko schematy URL `http:` i `https:`.
- Wartości `headers` obsługują interpolację `${ENV_VAR}`.
- Wpis serwera zawierający jednocześnie `command` i `url` jest odrzucany.
- Dane uwierzytelniające w adresach URL (informacje o użytkowniku i parametry zapytania)
  są redagowane w opisach narzędzi i dziennikach.
- `connectionTimeoutMs` zastępuje domyślny 30-sekundowy limit czasu połączenia zarówno
  dla transportu stdio, jak i HTTP. Domyślny limit czasu żądania wynosi 60 sekund
  i można go zastąpić za pomocą `requestTimeoutMs`.

##### Nazewnictwo narzędzi

OpenClaw rejestruje narzędzia MCP pakietów pod nazwami bezpiecznymi dla dostawców,
w postaci `serverName__toolName`. Na przykład serwer o kluczu `"vigil-harbor"`,
który udostępnia narzędzie `memory_search`, jest rejestrowany jako
`vigil-harbor__memory_search`.

- Znaki spoza zakresu `A-Za-z0-9_-` są zastępowane znakiem `-`.
- Fragmenty, które zaczynałyby się od znaku niebędącego literą, otrzymują prefiks
  będący literą, dlatego numeryczne klucze serwerów, takie jak `12306`, stają się
  bezpiecznymi dla dostawców prefiksami narzędzi.
- Prefiksy serwerów są ograniczone do 30 znaków.
- Pełne nazwy narzędzi są ograniczone do 64 znaków.
- W przypadku pustych nazw serwerów używana jest nazwa zastępcza `mcp`.
- Kolizje oczyszczonych nazw są rozróżniane za pomocą sufiksów liczbowych.
- Ostateczna kolejność udostępnionych narzędzi jest deterministyczna według bezpiecznej
  nazwy, co utrzymuje stabilność pamięci podręcznej podczas kolejnych tur osadzonego agenta.
- Filtrowanie profili traktuje każde narzędzie z jednego serwera MCP pakietu jako
  należące do pluginu `bundle-mcp`, dzięki czemu listy dozwolonych i zabronionych
  elementów profilu mogą odwoływać się do poszczególnych udostępnionych nazw narzędzi
  albo do klucza pluginu `bundle-mcp`.

#### Ustawienia osadzonego OpenClaw

Plik `settings.json` Claude jest importowany jako domyślne ustawienia osadzonego
OpenClaw, gdy pakiet jest włączony. Przed ich zastosowaniem OpenClaw oczyszcza klucze
nadpisujące powłokę:

- `shellPath`
- `shellCommandPrefix`

#### LSP osadzonego OpenClaw

- Włączone pakiety Claude mogą dostarczać konfigurację serwerów LSP.
- OpenClaw ładuje `.lsp.json` oraz wszystkie ścieżki `lspServers` zadeklarowane w manifeście.
- Konfiguracja LSP pakietu jest scalana z obowiązującymi wartościami domyślnymi LSP
  osadzonego OpenClaw.
- Obecnie można uruchamiać tylko obsługiwane serwery LSP wykorzystujące stdio;
  nieobsługiwane transporty nadal są widoczne w `openclaw plugins inspect <id>`.

### Wykrywane, ale niewykonywane

Poniższe elementy są rozpoznawane i wyświetlane w diagnostyce, ale OpenClaw ich nie uruchamia:

- `agents`, automatyzacja `hooks/hooks.json` i `outputStyles` Claude
- `.cursor/agents`, `.cursor/hooks.json` i `.cursor/rules` Cursor
- Metadane `.app.json` Codex wykraczające poza raportowanie możliwości

## Formaty pakietów

<AccordionGroup>
  <Accordion title="Pakiety Codex">
    Znaczniki: `.codex-plugin/plugin.json`

    Opcjonalna zawartość: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Pakiety Codex najlepiej współpracują z OpenClaw, gdy używają katalogów głównych
    Skills oraz katalogów pakietów hooków w stylu OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Pakiety Claude">
    Dwa tryby wykrywania:

    - **Na podstawie manifestu:** `.claude-plugin/plugin.json`
    - **Bez manifestu:** domyślny układ Claude (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Zachowanie specyficzne dla Claude:

    - `commands/` jest traktowany jako zawartość Skills
    - `settings.json` jest importowany do ustawień osadzonego OpenClaw (klucze nadpisujące powłokę są oczyszczane)
    - `.mcp.json` udostępnia obsługiwane narzędzia stdio osadzonemu OpenClaw
    - `.lsp.json` oraz ścieżki `lspServers` zadeklarowane w manifeście są ładowane do wartości domyślnych LSP osadzonego OpenClaw
    - `hooks/hooks.json` jest wykrywany, ale nie jest wykonywany
    - Niestandardowe ścieżki komponentów w manifeście są addytywne; rozszerzają wartości domyślne, zamiast je zastępować

  </Accordion>

  <Accordion title="Pakiety Cursor">
    Znaczniki: `.cursor-plugin/plugin.json`

    Opcjonalna zawartość: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` jest traktowany jako zawartość Skills
    - `.cursor/rules/`, `.cursor/agents/` i `.cursor/hooks.json` są tylko wykrywane

  </Accordion>
</AccordionGroup>

## Kolejność wykrywania

OpenClaw najpierw sprawdza format natywnego pluginu:

1. `openclaw.plugin.json` lub prawidłowy `package.json` z `openclaw.extensions` — traktowany jako **natywny plugin**
2. Znaczniki pakietu (`.codex-plugin/`, `.claude-plugin/` lub domyślny układ Claude/Cursor) — traktowane jako **pakiet**

Jeśli katalog zawiera oba formaty, OpenClaw używa ścieżki natywnej. Zapobiega to
częściowej instalacji pakietów obsługujących dwa formaty jako pakietów.

## Zależności środowiska uruchomieniowego i czyszczenie

- Zgodne pakiety innych firm nie otrzymują podczas uruchamiania naprawy za pomocą
  `npm install`. Należy je instalować przez `openclaw plugins install`; powinny
  zawierać wszystko, czego potrzebują, w katalogu zainstalowanego pluginu.
- Dołączone pluginy należące do OpenClaw są dostarczane w lekkiej postaci w rdzeniu
  albo można je pobrać za pomocą instalatora pluginów. Podczas uruchamiania Gateway
  nigdy nie uruchamia dla nich menedżera pakietów.
- `openclaw doctor --fix` usuwa nieaktualne rekordy instalacji lokalnych dołączonych
  pluginów i może odzyskać pluginy dostępne do pobrania, których brakuje w lokalnym
  indeksie pluginów, jeśli konfiguracja nadal się do nich odwołuje.

## Bezpieczeństwo

Pakiety mają węższą granicę zaufania niż natywne pluginy:

- OpenClaw **nie** ładuje dowolnych modułów środowiska uruchomieniowego pakietu wewnątrz procesu.
- Ścieżki Skills i pakietów hooków muszą pozostawać wewnątrz katalogu głównego pluginu
  (są sprawdzane pod kątem granic).
- Pliki ustawień są odczytywane z zastosowaniem tych samych kontroli granic.
- Obsługiwane serwery MCP stdio mogą być uruchamiane jako podprocesy.

Dzięki temu pakiety są domyślnie bezpieczniejsze, ale nadal należy traktować pakiety
innych firm jako zaufaną zawartość w zakresie funkcji, które udostępniają.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Pakiet jest wykrywany, ale jego możliwości nie działają">
    Uruchom `openclaw plugins inspect <id>`. Jeśli możliwość znajduje się na liście,
    ale jest oznaczona jako niepodłączona, jest to ograniczenie produktu, a nie
    uszkodzona instalacja.
  </Accordion>

  <Accordion title="Pliki poleceń Claude nie są widoczne">
    Upewnij się, że pakiet jest włączony, a pliki Markdown znajdują się w wykrytym
    katalogu głównym `commands/` lub `skills/`.
  </Accordion>

  <Accordion title="Ustawienia Claude nie są stosowane">
    Obsługiwane są tylko ustawienia osadzonego OpenClaw z pliku `settings.json`. OpenClaw
    nie traktuje ustawień pakietu jako surowych poprawek konfiguracji.
  </Accordion>

  <Accordion title="Hooki Claude nie są wykonywane">
    `hooks/hooks.json` jest tylko wykrywany. Jeśli potrzebujesz wykonywalnych hooków,
    użyj układu pakietu hooków OpenClaw albo dostarcz natywny plugin.
  </Accordion>
</AccordionGroup>

## Powiązane

- [Instalowanie i konfigurowanie pluginów](/pl/tools/plugin)
- [Tworzenie pluginów](/pl/plugins/building-plugins) — tworzenie natywnego pluginu
- [Manifest pluginu](/pl/plugins/manifest) — schemat natywnego manifestu
