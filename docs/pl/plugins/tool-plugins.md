---
read_when:
    - Chcesz utworzyć prosty plugin OpenClaw, który dodaje tylko narzędzia agenta
    - Zamiast ręcznie pisać metadane manifestu pluginu, należy użyć defineToolPlugin
    - Trzeba utworzyć szkielet, wygenerować, zweryfikować, przetestować lub opublikować plugin udostępniający wyłącznie narzędzia
sidebarTitle: Tool Plugins
summary: Twórz proste typowane narzędzia agenta za pomocą defineToolPlugin oraz openclaw plugins init/build/validate
title: Pluginy narzędziowe
x-i18n:
    generated_at: "2026-07-16T19:02:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb9187e1d8aed88eee5c99dcdce89f70cd0d4f930b97aaac2ff868037d63adc1
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` tworzy plugin, który dodaje wyłącznie narzędzia wywoływane przez agenta: bez
kanału, dostawcy modeli, haka, usługi ani zaplecza konfiguracji. Generuje
metadane manifestu potrzebne OpenClaw do wykrywania narzędzi bez ładowania
kodu środowiska uruchomieniowego pluginu.

W przypadku pluginów dostawców, kanałów, haków, usług lub pluginów o mieszanych możliwościach należy zamiast tego zacząć od
[Tworzenie pluginów](/pl/plugins/building-plugins), [Pluginy kanałów](/pl/plugins/sdk-channel-plugins)
lub [Pluginy dostawców](/pl/plugins/sdk-provider-plugins).

## Wymagania

- Node 22.22.3+, Node 24.15+ lub Node 25.9+.
- Pakiet wynikowy TypeScript ESM.
- `typebox` w `dependencies` (nie tylko `devDependencies` — wygenerowany
  plugin importuje go w czasie działania).
- `openclaw >=2026.5.17`, pierwsza wersja eksportująca
  `openclaw/plugin-sdk/tool-plugin`.
- Katalog główny pakietu zawierający `dist/`, `openclaw.plugin.json` oraz
  `package.json`.

## Szybki start

```bash
openclaw plugins init stock-quotes --name "Notowania giełdowe"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

`plugins init` tworzy szkielet:

| Plik                   | Przeznaczenie                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`         | Punkt wejścia `defineToolPlugin` z jednym narzędziem `echo`                     |
| `src/index.test.ts`    | Test metadanych sprawdzający listę narzędzi                             |
| `tsconfig.json`        | Wynik kompilacji TypeScript NodeNext w `dist/`                             |
| `vitest.config.ts`     | Konfiguracja Vitest dla `src/**/*.test.ts`                              |
| `package.json`         | Skrypty, zależności środowiska uruchomieniowego, `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | Wygenerowane metadane manifestu początkowego narzędzia                  |

`npm run plugin:build` uruchamia `npm run build` (tsc), a następnie
`openclaw plugins build --entry ./dist/index.js`. `npm run plugin:validate`
ponownie wykonuje kompilację i uruchamia `openclaw plugins validate --entry ./dist/index.js`.
Pomyślna walidacja wyświetla:

```text
Plugin stock-quotes jest prawidłowy.
```

Opcje `openclaw plugins init <id>`:

| Flaga                 | Wartość domyślna            | Działanie                                 |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | Katalog wynikowy                       |
| `--name <name>`      | `<id>` zapisany jak tytuł | Nazwa wyświetlana                           |
| `--type <type>`      | `tool`             | Typ szkieletu: `tool` lub `provider`    |
| `--force`            | wyłączona                | Zastąpienie istniejącego katalogu wynikowego |

## Tworzenie narzędzia

`defineToolPlugin` przyjmuje tożsamość pluginu, opcjonalny schemat konfiguracji oraz
statyczną listę narzędzi. Typy parametrów i konfiguracji są wywnioskowywane ze
schematów TypeBox.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Notowania giełdowe",
  description: "Pobiera migawki notowań giełdowych.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Klucz API notowań." })),
    baseUrl: Type.Optional(Type.String({ description: "Bazowy adres URL API notowań." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Notowanie giełdowe",
      description: "Pobiera migawkę notowania giełdowego.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Symbol giełdowy, na przykład OPEN." }),
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

Nazwy narzędzi stanowią stabilne API. Należy wybierać nazwy unikatowe, zapisane małymi literami i
na tyle szczegółowe, aby uniknąć kolizji z narzędziami podstawowymi lub innymi pluginami.

## Narzędzia opcjonalne i fabryczne

Ustaw `optional: true`, gdy użytkownicy powinni jawnie dodać narzędzie do listy dozwolonych, zanim
zostanie ono wysłane do modelu. `openclaw plugins build` zapisuje odpowiedni
wpis manifestu `toolMetadata.<tool>.optional`, dzięki czemu OpenClaw może rozpoznać, że
narzędzie jest opcjonalne, bez ładowania kodu środowiska uruchomieniowego pluginu.

```typescript
tool({
  name: "workflow_run",
  description: "Uruchamia zewnętrzny przepływ pracy.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

Użyj `factory`, gdy narzędzie wymaga kontekstu narzędzia środowiska uruchomieniowego, zanim będzie mogło zostać
utworzone — aby zrezygnować z niego dla konkretnego uruchomienia, sprawdzić stan piaskownicy lub powiązać
funkcje pomocnicze środowiska uruchomieniowego. Metadane pozostają statyczne, mimo że konkretne narzędzie jest tworzone
w czasie działania.

```typescript
tool({
  name: "local_workflow",
  description: "Uruchamia lokalny przepływ pracy poza sesjami w piaskownicy.",
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

Fabryki nadal deklarują z góry stałą nazwę narzędzia. Użyj bezpośrednio `definePluginEntry`,
gdy plugin dynamicznie oblicza nazwy narzędzi lub łączy narzędzia
z hakami, usługami, dostawcami albo poleceniami.

## Wartości zwracane

`defineToolPlugin` opakowuje zwykłe wartości zwracane w format wyniku narzędzia
OpenClaw:

- Zwróć ciąg znaków, gdy model powinien zobaczyć dokładnie ten tekst.
- Zwróć wartość zgodną z JSON, gdy model powinien zobaczyć sformatowany JSON,
  a OpenClaw ma zachować oryginalną wartość w `details`.

```typescript
tool({
  name: "echo_text",
  description: "Powtarza tekst wejściowy.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Powtarza dane wejściowe jako ustrukturyzowany JSON.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

Użyj narzędzia fabrycznego, gdy potrzebny jest niestandardowy `AgentToolResult` lub gdy ma zostać ponownie użyta
istniejąca implementacja `api.registerTool`.

## Konfiguracja

`configSchema` jest opcjonalny. Jeśli zostanie pominięty, OpenClaw zastosuje ścisły schemat pustego obiektu;
wygenerowany manifest nadal będzie zawierał `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "Narzędzia bez konfiguracji",
  description: "Dodaje narzędzia, które nie wymagają konfiguracji.",
  tools: () => [],
});
```

W przypadku `configSchema` typ drugiego argumentu `execute` jest z niego wywnioskowywany:

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Skonfigurowane narzędzia",
  description: "Dodaje skonfigurowane narzędzia.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Sprawdza, czy konfiguracja jest dostępna.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw odczytuje konfigurację pluginu z jego wpisu w konfiguracji Gateway. Nie należy
wpisywać na stałe sekretów w kodzie źródłowym ani przykładach dokumentacji; należy używać konfiguracji, zmiennych
środowiskowych lub SecretRefs zgodnie z modelem zabezpieczeń pluginu.

## Wygenerowane metadane

OpenClaw musi odczytać manifest pluginu przed zaimportowaniem kodu jego środowiska uruchomieniowego.
`defineToolPlugin` udostępnia w tym celu statyczne metadane, a
`openclaw plugins build` zapisuje je w pakiecie. Generator należy uruchomić ponownie po
zmianie identyfikatora, nazwy, opisu, schematu konfiguracji, aktywacji lub nazw
narzędzi pluginu:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Wygenerowany manifest pluginu z jednym narzędziem:

```json
{
  "id": "stock-quotes",
  "name": "Notowania giełdowe",
  "description": "Pobiera migawki notowań giełdowych.",
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

`contracts.tools` jest istotnym kontraktem wykrywania: informuje OpenClaw, który
plugin jest właścicielem każdego narzędzia, bez ładowania środowiska uruchomieniowego wszystkich zainstalowanych pluginów. Nieaktualny
manifest może spowodować brak narzędzia w wynikach wykrywania lub przypisanie błędu
rejestracji niewłaściwemu pluginowi.

## Metadane pakietu

`openclaw plugins build` dostosowuje również `package.json` do wybranego punktu wejścia
środowiska uruchomieniowego:

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

Należy dostarczać skompilowany JavaScript (`./dist/index.js`), a nie punkt wejścia kodu źródłowego TypeScript.
Punkty wejścia kodu źródłowego działają tylko podczas programowania lokalnie w obszarze roboczym.

## Walidacja w CI

`plugins build --check` kończy się niepowodzeniem bez przepisywania plików, gdy wygenerowane metadane
są nieaktualne:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` sprawdza, czy:

- `openclaw.plugin.json` istnieje i przechodzi standardowe ładowanie manifestu.
- Bieżący punkt wejścia eksportuje metadane `defineToolPlugin`.
- Pola wygenerowanego manifestu odpowiadają metadanym punktu wejścia.
- `contracts.tools` odpowiada zadeklarowanym nazwom narzędzi.
- `package.json` wskazuje za pomocą `openclaw.extensions` wybrany punkt wejścia środowiska uruchomieniowego.

## Instalacja i lokalna inspekcja

W osobnym repozytorium roboczym OpenClaw lub za pomocą zainstalowanego CLI zainstaluj pakiet ze ścieżki:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Aby wykonać test dymny pakietu, najpierw utwórz pakiet i zainstaluj archiwum tar:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Po instalacji uruchom ponownie lub przeładuj Gateway i poproś agenta o użycie
narzędzia. Jeśli narzędzie nie jest widoczne, przed zmianą kodu sprawdź środowisko uruchomieniowe pluginu oraz efektywny
katalog narzędzi (zobacz [Rozwiązywanie problemów](#troubleshooting)).

## Publikowanie

Gdy pakiet będzie gotowy, opublikuj go za pośrednictwem ClawHub. `clawhub package publish`
przyjmuje źródło: folder lokalny, repozytorium GitHub (`owner/repo[@ref]`) lub
adres URL archiwum tar.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

Zainstaluj przy użyciu jawnego lokalizatora ClawHub:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Podczas przejściowego okresu wdrożenia proste specyfikacje pakietów npm nadal są instalowane z npm, ale
ClawHub jest preferowanym miejscem wykrywania i dystrybucji pluginów
OpenClaw. Informacje o zakresie właściciela i przeglądzie wydania zawiera [Publikowanie w ClawHub](/pl/clawhub/publishing).

## Rozwiązywanie problemów

### `plugin entry not found: ./dist/index.js`

Wybrany plik punktu wejścia nie istnieje. Uruchom `npm run build`, a następnie ponownie
`openclaw plugins build --entry ./dist/index.js` lub
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

Punkt wejścia nie wyeksportował wartości utworzonej przez `defineToolPlugin`. Upewnij się, że
domyślnym eksportem modułu jest wynik `defineToolPlugin(...)`, lub przekaż
właściwy punkt wejścia za pomocą `--entry`.

### `openclaw.plugin.json generated metadata is stale`

Manifest nie odpowiada już metadanym punktu wejścia. Uruchom:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Zatwierdź zmiany zarówno w `openclaw.plugin.json`, jak i `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

Metadane pakietu wskazują inny punkt wejścia środowiska uruchomieniowego. Uruchom
`openclaw plugins build --entry ./dist/index.js`, aby generator dostosował
metadane pakietu do punktu wejścia, który ma zostać dostarczony.

### `Cannot find package 'typebox'`

Skompilowany plugin importuje `typebox` w czasie działania. Pozostaw go w `dependencies`,
zainstaluj ponownie, ponownie skompiluj i uruchom walidację.

### Narzędzie nie pojawia się po instalacji

Sprawdź kolejno:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` ma `contracts.tools` z oczekiwanymi nazwami narzędzi.
4. `package.json` ma `openclaw.extensions: ["./dist/index.js"]`.
5. Gateway został ponownie uruchomiony lub przeładowany po zainstalowaniu pluginu.

## Zobacz także

- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Punkty wejścia pluginu](/pl/plugins/sdk-entrypoints)
- [Ścieżki podrzędne SDK pluginu](/pl/plugins/sdk-subpaths)
- [Manifest pluginu](/pl/plugins/manifest)
- [CLI pluginów](/pl/cli/plugins)
- [Publikowanie w ClawHub](/pl/clawhub/publishing)
