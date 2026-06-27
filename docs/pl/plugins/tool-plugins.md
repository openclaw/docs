---
read_when:
    - Chcesz zbudować prosty Plugin OpenClaw, który dodaje tylko narzędzia agenta
    - Chcesz użyć defineToolPlugin zamiast ręcznie pisać metadane manifestu Plugin
    - Musisz utworzyć szkielet, wygenerować, zweryfikować, przetestować lub opublikować Plugin zawierający wyłącznie narzędzia
sidebarTitle: Tool Plugins
summary: Twórz proste typowane narzędzia agenta za pomocą defineToolPlugin oraz openclaw plugins init/build/validate
title: Pluginy narzędziowe
x-i18n:
    generated_at: "2026-06-27T18:09:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e0ead3e9162b0e9e930a7a69dcd4a72a78063dae09a173efb70d0db32f73c9a
    source_path: plugins/tool-plugins.md
    workflow: 16
---

Pluginy narzędzi dodają do OpenClaw narzędzia wywoływalne przez agenta bez dodawania kanału,
dostawcy modeli, hooka, usługi ani backendu konfiguracji. Użyj `defineToolPlugin`, gdy
plugin posiada stałą listę narzędzi i chcesz, aby OpenClaw wygenerował metadane manifestu,
dzięki którym te narzędzia pozostają wykrywalne bez ładowania kodu uruchomieniowego.

Zalecany przepływ wygląda tak:

1. Utwórz szkielet pakietu za pomocą `openclaw plugins init`.
2. Napisz narzędzia z `defineToolPlugin`.
3. Zbuduj JavaScript.
4. Wygeneruj metadane `openclaw.plugin.json` i `package.json` za pomocą
   `openclaw plugins build`.
5. Zweryfikuj wygenerowane metadane przed publikacją lub instalacją.

Dla pluginów dostawców, kanałów, hooków, usług albo pluginów o mieszanych możliwościach zacznij
zamiast tego od [Tworzenie pluginów](/pl/plugins/building-plugins), [Pluginy kanałów](/pl/plugins/sdk-channel-plugins)
albo [Pluginy dostawców](/pl/plugins/sdk-provider-plugins).

## Wymagania

- Node >= 22.
- Wyjście pakietu TypeScript ESM.
- `typebox` dla schematów konfiguracji i parametrów narzędzi.
- `openclaw >=2026.5.17`, pierwsza wersja OpenClaw eksportująca
  `openclaw/plugin-sdk/tool-plugin`.
- Katalog główny pakietu, który może dostarczać `dist/`, `openclaw.plugin.json` i
  `package.json`.

Wygenerowany plugin importuje `typebox` w czasie uruchomienia, więc trzymaj `typebox` w
`dependencies`, nie tylko w `devDependencies`.

## Szybki start

Utwórz nowy pakiet pluginu:

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

Szkielet tworzy:

- `src/index.ts`: punkt wejścia `defineToolPlugin` z narzędziem `echo`.
- `src/index.test.ts`: mały test metadanych.
- `tsconfig.json`: wyjście TypeScript NodeNext do `dist/`.
- `package.json`: skrypty, zależności uruchomieniowe i
  `openclaw.extensions: ["./dist/index.js"]`.
- `openclaw.plugin.json`: wygenerowane metadane manifestu dla początkowego narzędzia.

Oczekiwane wyjście walidacji:

```text
Plugin stock-quotes is valid.
```

## Napisz narzędzie

`defineToolPlugin` przyjmuje tożsamość pluginu, opcjonalny schemat konfiguracji i
statyczną listę narzędzi. Typy parametrów i konfiguracji są wnioskowane ze schematów
TypeBox.

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

Nazwy narzędzi są stabilnym API. Wybieraj nazwy unikalne, pisane małymi literami i
wystarczająco konkretne, aby uniknąć kolizji z narzędziami rdzenia lub innymi pluginami.

## Narzędzia opcjonalne i fabryczne

Ustaw `optional: true`, gdy użytkownicy powinni jawnie dodać narzędzie do listy dozwolonych,
zanim zostanie wysłane do modelu:

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

`openclaw plugins build` zapisuje odpowiadający wpis manifestu `toolMetadata.<tool>.optional`,
dzięki czemu OpenClaw może wykryć narzędzie bez ładowania kodu uruchomieniowego
pluginu.

Użyj `factory`, gdy narzędzie potrzebuje kontekstu narzędzia uruchomieniowego, zanim może
zostać utworzone. Fabryka utrzymuje statyczne metadane, jednocześnie pozwalając narzędziu wyłączyć się dla
konkretnego uruchomienia, sprawdzić stan piaskownicy albo powiązać pomocniki uruchomieniowe.

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

Fabryki nadal są przeznaczone dla stałych nazw narzędzi. Użyj bezpośrednio `definePluginEntry`, gdy
plugin oblicza nazwy narzędzi dynamicznie albo łączy narzędzia z hookami,
usługami, dostawcami, poleceniami lub innymi powierzchniami uruchomieniowymi.

## Wartości zwracane

`defineToolPlugin` opakowuje zwykłe wartości zwracane w format wyniku narzędzia
OpenClaw:

- Zwróć ciąg znaków, gdy model powinien zobaczyć dokładnie ten tekst.
- Zwróć wartość zgodną z JSON, gdy chcesz, aby model zobaczył sformatowany JSON,
  a OpenClaw zachował oryginalną wartość w `details`.

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

Użyj narzędzia fabrycznego, gdy musisz zwrócić niestandardowy `AgentToolResult` albo ponownie użyć
istniejącej implementacji `api.registerTool`. Użyj `definePluginEntry` zamiast
`defineToolPlugin`, gdy potrzebujesz w pełni dynamicznych narzędzi albo mieszanych
możliwości pluginu.

## Konfiguracja

`configSchema` jest opcjonalny. Jeśli go pominiesz, OpenClaw użyje ścisłego schematu
pustego obiektu, a wygenerowany manifest nadal będzie zawierać `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

Gdy dołączysz `configSchema`, drugi argument `execute` jest typowany na podstawie
schematu:

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

OpenClaw odczytuje konfigurację pluginu z wpisu pluginu w konfiguracji Gateway. Nie
wpisuj sekretów na stałe w kodzie źródłowym ani w przykładach dokumentacji. Używaj konfiguracji, zmiennych
środowiskowych albo SecretRefs zgodnie z modelem bezpieczeństwa pluginu.

## Wygenerowane metadane

OpenClaw wykrywa zainstalowane pluginy z zimnych metadanych. Musi być w stanie odczytać
manifest pluginu przed zaimportowaniem kodu uruchomieniowego pluginu. Dlatego `defineToolPlugin`
udostępnia statyczne metadane, a `openclaw plugins build` zapisuje te
metadane w pakiecie.

Uruchom generator po zmianie identyfikatora pluginu, nazwy, opisu, schematu konfiguracji,
aktywacji lub nazw narzędzi:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Dla pluginu z jednym narzędziem wygenerowany manifest wygląda tak:

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

`contracts.tools` jest ważnym kontraktem wykrywania. Informuje OpenClaw, który
plugin posiada każde narzędzie, bez ładowania każdego zainstalowanego środowiska uruchomieniowego pluginu. Jeśli
manifest jest nieaktualny, narzędzia może brakować w wykrywaniu albo za błąd
rejestracji może zostać obwiniony niewłaściwy plugin.

## Metadane pakietu

Dla prostego przepływu pluginu narzędziowego `openclaw plugins build` uzgadnia
`package.json` z wybranym pojedynczym punktem wejścia uruchomieniowego:

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

Dla zainstalowanych pakietów używaj zbudowanego JavaScriptu, takiego jak `./dist/index.js`. Wpisy
źródłowe są przydatne podczas programowania w workspace, ale opublikowane pakiety nie powinny
zależeć od ładowania TypeScriptu w czasie uruchomienia.

## Walidacja w CI

Użyj `plugins build --check`, aby CI zakończyło się błędem, gdy wygenerowane metadane są nieaktualne, bez
przepisywania plików:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` sprawdza, że:

- `openclaw.plugin.json` istnieje i przechodzi przez standardowy loader manifestu.
- Bieżący punkt wejścia eksportuje metadane `defineToolPlugin`.
- Wygenerowane pola manifestu pasują do metadanych punktu wejścia.
- `contracts.tools` pasuje do zadeklarowanych nazw narzędzi.
- `package.json` wskazuje `openclaw.extensions` na wybrany punkt wejścia uruchomieniowego.

## Instalacja i lokalna inspekcja

Z oddzielnego checkoutu OpenClaw albo zainstalowanego CLI zainstaluj ścieżkę pakietu:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Dla pakietowego smoke testu najpierw spakuj, a potem zainstaluj archiwum tarball:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Po instalacji uruchom lub zrestartuj Gateway i poproś agenta o użycie
narzędzia. Jeśli debugujesz widoczność narzędzia, sprawdź środowisko uruchomieniowe pluginu i
efektywny katalog narzędzi przed zmianą kodu.

## Publikacja

Publikuj przez ClawHub, gdy pakiet jest gotowy:

```bash
clawhub package publish your-org/stock-quotes --dry-run
clawhub package publish your-org/stock-quotes
```

Zainstaluj z jawnym lokatorem ClawHub:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Same specyfikacje pakietów npm pozostają obsługiwane podczas przejścia startowego, ale ClawHub
jest preferowaną powierzchnią wykrywania i dystrybucji dla pluginów OpenClaw.

## Rozwiązywanie problemów

### `plugin entry not found: ./dist/index.js`

Wybrany plik punktu wejścia nie istnieje. Uruchom `npm run build`, a następnie ponownie uruchom
`openclaw plugins build --entry ./dist/index.js` albo
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

Punkt wejścia nie wyeksportował wartości utworzonej przez `defineToolPlugin`. Sprawdź, czy
domyślny eksport modułu jest wynikiem `defineToolPlugin(...)`, albo przekaż poprawny
punkt wejścia przez `--entry`.

### `openclaw.plugin.json generated metadata is stale`

Manifest nie pasuje już do metadanych punktu wejścia. Uruchom:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Zacommituj zmiany w `openclaw.plugin.json` i `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

Metadane pakietu wskazują inny punkt wejścia uruchomieniowego. Uruchom
`openclaw plugins build --entry ./dist/index.js`, aby generator uzgodnił
metadane pakietu z punktem wejścia, który zamierzasz dostarczyć.

### `Cannot find package 'typebox'`

Zbudowany plugin importuje `typebox` w czasie uruchomienia. Trzymaj `typebox` w
`dependencies`, zainstaluj ponownie zależności pakietu, zbuduj ponownie i ponownie uruchom walidację.

### Narzędzie nie pojawia się po instalacji

Sprawdź te elementy w kolejności:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` ma `contracts.tools` z oczekiwanymi nazwami narzędzi.
4. `package.json` ma `openclaw.extensions: ["./dist/index.js"]`.
5. Gateway został zrestartowany lub przeładowany po zainstalowaniu pluginu.

## Zobacz też

- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Punkty wejścia pluginów](/pl/plugins/sdk-entrypoints)
- [Podścieżki SDK pluginów](/pl/plugins/sdk-subpaths)
- [Manifest pluginu](/pl/plugins/manifest)
- [CLI pluginów](/pl/cli/plugins)
- [Publikowanie w ClawHub](/pl/clawhub/publishing)
