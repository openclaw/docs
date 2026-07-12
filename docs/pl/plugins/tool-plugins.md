---
read_when:
    - Chcesz utworzyć prosty plugin OpenClaw, który dodaje tylko narzędzia agenta
    - Chcesz użyć `defineToolPlugin` zamiast ręcznie pisać metadane manifestu Pluginu
    - Musisz utworzyć szkielet, wygenerować, zweryfikować, przetestować lub opublikować plugin zawierający wyłącznie narzędzia
sidebarTitle: Tool Plugins
summary: Twórz proste, typowane narzędzia agenta za pomocą defineToolPlugin oraz openclaw plugins init/build/validate
title: Pluginy narzędziowe
x-i18n:
    generated_at: "2026-07-12T15:32:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 231eba96d4927b7411cb17d79b96e6df09ed111fc8a54eac0ca7717e58803d26
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` tworzy Plugin, który dodaje wyłącznie narzędzia wywoływane przez agenta: bez
kanału, dostawcy modeli, haka, usługi ani zaplecza konfiguracji. Generuje
metadane manifestu potrzebne OpenClaw do wykrywania narzędzi bez ładowania
kodu środowiska uruchomieniowego Pluginu.

W przypadku Pluginów dostawców, kanałów, haków, usług lub Pluginów o mieszanych
możliwościach zacznij zamiast tego od [Tworzenie Pluginów](/pl/plugins/building-plugins),
[Pluginy kanałów](/pl/plugins/sdk-channel-plugins) albo
[Pluginy dostawców](/pl/plugins/sdk-provider-plugins).

## Wymagania

- Node 22.19+, Node 23.11+ lub Node 24+.
- Pakiet TypeScript ESM generujący dane wyjściowe.
- `typebox` w `dependencies` (nie tylko w `devDependencies` — wygenerowany
  Plugin importuje go w czasie działania).
- `openclaw >=2026.5.17`, czyli pierwsza wersja eksportująca
  `openclaw/plugin-sdk/tool-plugin`.
- Katalog główny pakietu zawierający `dist/`, `openclaw.plugin.json` oraz
  `package.json`.

## Szybki start

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

`plugins init` tworzy szkielet:

| Plik                   | Przeznaczenie                                                     |
| ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`         | Punkt wejścia `defineToolPlugin` z jednym narzędziem `echo`       |
| `src/index.test.ts`    | Test metadanych sprawdzający listę narzędzi                       |
| `tsconfig.json`        | Dane wyjściowe TypeScript NodeNext w `dist/`                      |
| `vitest.config.ts`     | Konfiguracja Vitest dla `src/**/*.test.ts`                        |
| `package.json`         | Skrypty, zależności środowiska uruchomieniowego, `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | Wygenerowane metadane manifestu dla początkowego narzędzia        |

`npm run plugin:build` uruchamia `npm run build` (tsc), a następnie
`openclaw plugins build --entry ./dist/index.js`. `npm run plugin:validate`
ponownie buduje projekt i uruchamia `openclaw plugins validate --entry ./dist/index.js`.
Pomyślna walidacja wyświetla:

```text
Plugin stock-quotes is valid.
```

Opcje `openclaw plugins init <id>`:

| Flaga                | Wartość domyślna         | Działanie                                      |
| -------------------- | ------------------------ | ---------------------------------------------- |
| `--directory <path>` | `<id>`                   | Katalog wyjściowy                              |
| `--name <name>`      | `<id>` w formacie tytułu | Nazwa wyświetlana                              |
| `--type <type>`      | `tool`                   | Typ szkieletu: `tool` lub `provider`           |
| `--force`            | wyłączona                | Zastępuje istniejący katalog wyjściowy         |

## Pisanie narzędzia

`defineToolPlugin` przyjmuje tożsamość Pluginu, opcjonalny schemat konfiguracji
oraz statyczną listę narzędzi. Typy parametrów i konfiguracji są wywnioskowane
ze schematów TypeBox.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quote snapshots.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Quote API key." })),
    baseUrl: Type.Optional(Type.String({ description: "Quote API base URL." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Stock Quote",
      description: "Fetch a stock quote snapshot.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol, for example OPEN." }),
      }),
      async execute({ symbol }, config, context) {
        context.signal?.throwIfAborted();
        return {
          symbol: symbol.toUpperCase(),
          configured: Boolean(config.apiKey),
          baseUrl: config.baseUrl ?? "https://api.example.com",
        };
      },
    }),
  ],
});
```

Nazwy narzędzi stanowią stabilny interfejs API. Wybieraj nazwy unikatowe,
pisane małymi literami i wystarczająco szczegółowe, aby uniknąć kolizji
z narzędziami rdzenia lub innych Pluginów.

## Narzędzia opcjonalne i fabryczne

Ustaw `optional: true`, gdy użytkownicy powinni jawnie dodać narzędzie do listy
dozwolonych, zanim zostanie ono wysłane do modelu. `openclaw plugins build`
zapisuje odpowiadający wpis manifestu `toolMetadata.<tool>.optional`, dzięki
czemu OpenClaw może rozpoznać narzędzie jako opcjonalne bez ładowania kodu
środowiska uruchomieniowego Pluginu.

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

Użyj `factory`, gdy narzędzie przed utworzeniem potrzebuje kontekstu narzędzia
środowiska uruchomieniowego — aby wyłączyć je dla konkretnego uruchomienia,
sprawdzić stan piaskownicy lub powiązać pomocnicze elementy środowiska
uruchomieniowego. Metadane pozostają statyczne, mimo że konkretne narzędzie
jest tworzone w czasie działania.

```typescript
tool({
  name: "local_workflow",
  description: "Run a local workflow outside sandboxed sessions.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  factory({ api, toolContext }) {
    if (toolContext.sandboxed) {
      return null;
    }
    return createLocalWorkflowTool(api);
  },
});
```

Fabryki nadal deklarują z góry stałą nazwę narzędzia. Użyj bezpośrednio
`definePluginEntry`, gdy Plugin dynamicznie oblicza nazwy narzędzi lub łączy
narzędzia z hakami, usługami, dostawcami albo poleceniami.

## Wartości zwracane

`defineToolPlugin` opakowuje zwykłe wartości zwracane w format wyniku narzędzia
OpenClaw:

- Zwróć ciąg znaków, gdy model powinien zobaczyć dokładnie ten tekst.
- Zwróć wartość zgodną z JSON, gdy model powinien zobaczyć sformatowany JSON,
  a OpenClaw ma zachować oryginalną wartość w `details`.

```typescript
tool({
  name: "echo_text",
  description: "Echo input text.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Echo input as structured JSON.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

Użyj narzędzia fabrycznego, gdy potrzebujesz niestandardowego
`AgentToolResult` lub chcesz ponownie wykorzystać istniejącą implementację
`api.registerTool`.

## Konfiguracja

`configSchema` jest opcjonalny. Jeśli go pominiesz, OpenClaw zastosuje ścisły
schemat pustego obiektu; wygenerowany manifest nadal będzie zawierał
`configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

W przypadku użycia `configSchema` typ drugiego argumentu `execute` jest z niego
wywnioskowany:

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Configured Tools",
  description: "Adds configured tools.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Check whether configuration is available.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw odczytuje konfigurację Pluginu z jego wpisu w konfiguracji Gateway.
Nie zapisuj na stałe sekretów w kodzie źródłowym ani przykładach dokumentacji;
zgodnie z modelem bezpieczeństwa Pluginu używaj konfiguracji, zmiennych
środowiskowych lub SecretRefs.

## Wygenerowane metadane

OpenClaw musi odczytać manifest Pluginu przed zaimportowaniem kodu jego
środowiska uruchomieniowego. `defineToolPlugin` udostępnia w tym celu statyczne
metadane, a `openclaw plugins build` zapisuje je w pakiecie. Uruchom generator
ponownie po zmianie identyfikatora, nazwy, opisu, schematu konfiguracji,
aktywacji lub nazw narzędzi Pluginu:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Wygenerowany manifest Pluginu z jednym narzędziem:

```json
{
  "id": "stock-quotes",
  "name": "Stock Quotes",
  "description": "Fetch stock quote snapshots.",
  "version": "0.1.0",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  },
  "activation": {
    "onStartup": true
  },
  "contracts": {
    "tools": ["stock_quote"]
  }
}
```

`contracts.tools` jest istotnym kontraktem wykrywania: informuje OpenClaw,
który Plugin jest właścicielem każdego narzędzia, bez ładowania środowiska
uruchomieniowego wszystkich zainstalowanych Pluginów. Nieaktualny manifest
może spowodować, że narzędzie nie zostanie wykryte albo błąd rejestracji
zostanie przypisany niewłaściwemu Pluginowi.

## Metadane pakietu

`openclaw plugins build` dostosowuje również `package.json` do wybranego punktu
wejścia środowiska uruchomieniowego:

```json
{
  "type": "module",
  "files": ["dist", "openclaw.plugin.json", "README.md"],
  "dependencies": {
    "typebox": "^1.1.38"
  },
  "peerDependencies": {
    "openclaw": ">=2026.5.17"
  },
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

Publikuj zbudowany JavaScript (`./dist/index.js`), a nie punkt wejścia w kodzie
źródłowym TypeScript. Punkty wejścia w kodzie źródłowym działają wyłącznie
podczas programowania lokalnie w obszarze roboczym.

## Walidacja w CI

`plugins build --check` kończy się niepowodzeniem bez nadpisywania plików,
gdy wygenerowane metadane są nieaktualne:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` sprawdza, czy:

- `openclaw.plugin.json` istnieje i przechodzi standardowe wczytywanie manifestu.
- Bieżący punkt wejścia eksportuje metadane `defineToolPlugin`.
- Wygenerowane pola manifestu odpowiadają metadanym punktu wejścia.
- `contracts.tools` odpowiada zadeklarowanym nazwom narzędzi.
- `package.json` wskazuje w `openclaw.extensions` wybrany punkt wejścia
  środowiska uruchomieniowego.

## Lokalna instalacja i inspekcja

W osobnym katalogu roboczym OpenClaw lub przy użyciu zainstalowanego CLI
zainstaluj pakiet ze ścieżki:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Aby przeprowadzić test dymny spakowanego pakietu, najpierw go spakuj,
a następnie zainstaluj archiwum tar:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Po instalacji uruchom ponownie lub przeładuj Gateway i poproś agenta o użycie
narzędzia. Jeśli narzędzie nie jest widoczne, przed zmianą kodu sprawdź
środowisko uruchomieniowe Pluginu i efektywny katalog narzędzi (zobacz
[Rozwiązywanie problemów](#troubleshooting)).

## Publikowanie

Gdy pakiet będzie gotowy, opublikuj go za pośrednictwem ClawHub.
`clawhub package publish` przyjmuje źródło: lokalny folder, repozytorium GitHub
(`owner/repo[@ref]`) lub adres URL archiwum tar.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

Zainstaluj przy użyciu jawnego lokalizatora ClawHub:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Same specyfikatory pakietów npm nadal instalują pakiety z npm w okresie
przejściowym wdrożenia, ale ClawHub jest preferowaną platformą wykrywania
i dystrybucji Pluginów OpenClaw. Informacje o zakresie właściciela i przeglądzie
wydania znajdziesz w sekcji [Publikowanie w ClawHub](/pl/clawhub/publishing).

## Rozwiązywanie problemów

### `plugin entry not found: ./dist/index.js`

Wybrany plik punktu wejścia nie istnieje. Uruchom `npm run build`, a następnie
ponownie uruchom `openclaw plugins build --entry ./dist/index.js` albo
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

Punkt wejścia nie wyeksportował wartości utworzonej przez `defineToolPlugin`.
Upewnij się, że domyślnym eksportem modułu jest wynik `defineToolPlugin(...)`,
albo przekaż właściwy punkt wejścia za pomocą `--entry`.

### `openclaw.plugin.json generated metadata is stale`

Manifest nie odpowiada już metadanym punktu wejścia. Uruchom:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Zatwierdź zmiany zarówno w `openclaw.plugin.json`, jak i `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

Metadane pakietu wskazują inny punkt wejścia środowiska uruchomieniowego.
Uruchom `openclaw plugins build --entry ./dist/index.js`, aby generator
dostosował metadane pakietu do punktu wejścia, który zamierzasz opublikować.

### `Cannot find package 'typebox'`

Zbudowany Plugin importuje `typebox` w czasie działania. Pozostaw go
w `dependencies`, ponownie zainstaluj zależności, przebuduj projekt i ponownie
uruchom walidację.

### Narzędzie nie pojawia się po instalacji

Sprawdź kolejno następujące elementy:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. Plik `openclaw.plugin.json` zawiera `contracts.tools` z oczekiwanymi nazwami narzędzi.
4. Plik `package.json` zawiera `openclaw.extensions: ["./dist/index.js"]`.
5. Po zainstalowaniu pluginu Gateway został uruchomiony ponownie lub przeładowany.

## Zobacz także

- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Punkty wejścia pluginów](/pl/plugins/sdk-entrypoints)
- [Ścieżki podrzędne SDK pluginów](/pl/plugins/sdk-subpaths)
- [Manifest pluginu](/pl/plugins/manifest)
- [CLI pluginów](/pl/cli/plugins)
- [Publikowanie w ClawHub](/pl/clawhub/publishing)
