---
read_when:
    - Potrzebujesz dokładnej sygnatury typu `definePluginEntry` lub `defineChannelPluginEntry`
    - Chcesz zrozumieć tryb rejestracji (pełny vs konfiguracja vs metadane CLI)
    - Szukasz opcji punktu wejścia
sidebarTitle: Entry Points
summary: Dokumentacja `definePluginEntry`, `defineChannelPluginEntry` i `defineSetupPluginEntry`
title: Punkty wejścia Pluginów
x-i18n:
    generated_at: "2026-04-22T04:25:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: b794e1a880e4a32318236fab515f5fd395a0c8c2d1a0e6a4ea388eef447975a7
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# Punkty wejścia Pluginów

Każdy plugin eksportuje domyślny obiekt punktu wejścia. SDK udostępnia trzy helpery do
ich tworzenia.

Dla zainstalowanych pluginów `package.json` powinien kierować ładowanie runtime do zbudowanego
JavaScript, gdy jest dostępny:

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

`extensions` i `setupEntry` pozostają prawidłowymi źródłowymi punktami wejścia dla rozwoju w workspace i z checkoutem
git. `runtimeExtensions` i `runtimeSetupEntry` są preferowane,
gdy OpenClaw ładuje zainstalowany pakiet, i pozwalają pakietom npm uniknąć kompilacji
TypeScript w runtime. Jeśli zainstalowany pakiet deklaruje tylko źródłowy punkt wejścia
TypeScript, OpenClaw użyje odpowiadającego zbudowanego odpowiednika `dist/*.js`, jeśli taki
istnieje, a następnie wróci do źródła TypeScript.

Wszystkie ścieżki punktów wejścia muszą pozostać wewnątrz katalogu pakietu pluginu. Punkty wejścia
runtime i wywnioskowane zbudowane odpowiedniki JavaScript nie sprawiają, że wychodząca poza pakiet ścieżka źródłowa `extensions` lub
`setupEntry` staje się prawidłowa.

<Tip>
  **Szukasz omówienia krok po kroku?** Zobacz [Channel Plugins](/pl/plugins/sdk-channel-plugins)
  lub [Provider Plugins](/pl/plugins/sdk-provider-plugins), aby przejść przez przewodniki krok po kroku.
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Dla pluginów providerów, pluginów narzędzi, pluginów hooków i wszystkiego, co **nie** jest
kanałem wiadomości.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| Pole           | Typ                                                              | Wymagane | Domyślnie           |
| -------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`           | `string`                                                         | Tak      | —                   |
| `name`         | `string`                                                         | Tak      | —                   |
| `description`  | `string`                                                         | Tak      | —                   |
| `kind`         | `string`                                                         | Nie      | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nie      | Pusty schemat obiektu |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Tak      | —                   |

- `id` musi odpowiadać twojemu manifestowi `openclaw.plugin.json`.
- `kind` służy do wyłącznych slotów: `"memory"` lub `"context-engine"`.
- `configSchema` może być funkcją do leniwej ewaluacji.
- OpenClaw rozwiązuje i memoizuje ten schemat przy pierwszym dostępie, więc kosztowne konstruktory schematów
  uruchamiają się tylko raz.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Opakowuje `definePluginEntry` w połączenia specyficzne dla kanału. Automatycznie wywołuje
`api.registerChannel({ plugin })`, udostępnia opcjonalny seam metadanych CLI dla root-help i
ogranicza `registerFull` zgodnie z trybem rejestracji.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| Pole                  | Typ                                                              | Wymagane | Domyślnie           |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | Tak      | —                   |
| `name`                | `string`                                                         | Tak      | —                   |
| `description`         | `string`                                                         | Tak      | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Tak      | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nie      | Pusty schemat obiektu |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Nie      | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Nie      | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Nie      | —                   |

- `setRuntime` jest wywoływane podczas rejestracji, dzięki czemu możesz zapisać referencję runtime
  (zwykle przez `createPluginRuntimeStore`). Jest pomijane podczas przechwytywania metadanych CLI.
- `registerCliMetadata` uruchamia się zarówno przy `api.registrationMode === "cli-metadata"`,
  jak i `api.registrationMode === "full"`.
  Używaj go jako kanonicznego miejsca dla deskryptorów CLI należących do kanału, aby root help
  pozostawał nieaktywujący, a jednocześnie zwykła rejestracja poleceń CLI pozostała zgodna
  z pełnym ładowaniem pluginów.
- `registerFull` uruchamia się tylko wtedy, gdy `api.registrationMode === "full"`. Jest pomijane
  podczas ładowania tylko do konfiguracji.
- Podobnie jak w `definePluginEntry`, `configSchema` może być leniwą fabryką, a OpenClaw
  memoizuje rozwiązany schemat przy pierwszym dostępie.
- Dla należących do pluginu głównych poleceń CLI preferuj `api.registerCli(..., { descriptors: [...] })`,
  gdy chcesz, aby polecenie pozostało leniwie ładowane bez znikania z
  drzewa parsowania głównego CLI. Dla pluginów kanałów preferuj rejestrowanie tych deskryptorów
  z `registerCliMetadata(...)`, a `registerFull(...)` pozostaw skupione na pracy tylko dla runtime.
- Jeśli `registerFull(...)` rejestruje także metody Gateway RPC, utrzymuj je pod
  prefiksem specyficznym dla pluginu. Zarezerwowane przestrzenie nazw administracyjnych rdzenia (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) są zawsze wymuszane do
  `operator.admin`.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Dla lekkiego pliku `setup-entry.ts`. Zwraca tylko `{ plugin }` bez
połączeń runtime ani CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw ładuje to zamiast pełnego punktu wejścia, gdy kanał jest wyłączony,
nieskonfigurowany lub gdy włączone jest ładowanie odroczone. Zobacz
[Setup and Config](/pl/plugins/sdk-setup#setup-entry), aby dowiedzieć się, kiedy ma to znaczenie.

W praktyce łącz `defineSetupPluginEntry(...)` z wąskimi rodzinami helperów do konfiguracji:

- `openclaw/plugin-sdk/setup-runtime` dla helperów konfiguracji bezpiecznych dla runtime, takich jak
  bezpieczne przy imporcie adaptery patchy konfiguracji, wyjście lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` i delegowane proxy konfiguracji
- `openclaw/plugin-sdk/channel-setup` dla powierzchni konfiguracji opcjonalnej instalacji
- `openclaw/plugin-sdk/setup-tools` dla helperów CLI/archiwum/dokumentacji do konfiguracji/instalacji

Ciężkie SDK, rejestrację CLI i długowieczne usługi runtime trzymaj w pełnym
punkcie wejścia.

Dołączone kanały workspace, które rozdzielają powierzchnie konfiguracji i runtime, mogą zamiast tego używać
`defineBundledChannelSetupEntry(...)` z
`openclaw/plugin-sdk/channel-entry-contract`. Ten kontrakt pozwala
punktowi wejścia konfiguracji zachować bezpieczne dla konfiguracji eksporty pluginów/sekretów, a jednocześnie nadal udostępniać
setter runtime:

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
});
```

Używaj tego dołączonego kontraktu tylko wtedy, gdy przepływy konfiguracji rzeczywiście potrzebują lekkiego settera runtime
zanim załaduje się pełny punkt wejścia kanału.

## Tryb rejestracji

`api.registrationMode` informuje plugin, jak został załadowany:

| Tryb              | Kiedy                               | Co rejestrować                                                                           |
| ----------------- | ----------------------------------- | ---------------------------------------------------------------------------------------- |
| `"full"`          | Zwykły start Gateway                | Wszystko                                                                                 |
| `"setup-only"`    | Kanał wyłączony/nieskonfigurowany   | Tylko rejestrację kanału                                                                 |
| `"setup-runtime"` | Przepływ konfiguracji z dostępnym runtime | Rejestrację kanału plus tylko lekki runtime potrzebny przed załadowaniem pełnego punktu wejścia |
| `"cli-metadata"`  | Root help / przechwytywanie metadanych CLI | Tylko deskryptory CLI                                                              |

`defineChannelPluginEntry` obsługuje ten podział automatycznie. Jeśli używasz
`definePluginEntry` bezpośrednio dla kanału, sam sprawdź tryb:

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Ciężkie rejestracje tylko dla runtime
  api.registerService(/* ... */);
}
```

Traktuj `"setup-runtime"` jako okno, w którym powierzchnie startowe tylko do konfiguracji muszą
istnieć bez ponownego wejścia w pełny runtime dołączonego kanału. Dobrze pasują tu
rejestracja kanału, bezpieczne dla konfiguracji trasy HTTP, bezpieczne dla konfiguracji metody Gateway i
delegowane helpery konfiguracji. Ciężkie usługi w tle, rejestratory CLI i bootstrapy SDK providerów/klientów
nadal należą do `"full"`.

W szczególności dla rejestratorów CLI:

- używaj `descriptors`, gdy rejestrator posiada jedno lub więcej głównych poleceń i
  chcesz, aby OpenClaw leniwie ładował rzeczywisty moduł CLI przy pierwszym wywołaniu
- upewnij się, że te deskryptory obejmują każdy główny korzeń poleceń udostępniany przez
  rejestrator
- używaj samego `commands` tylko dla ścieżek zgodności eager

## Kształty pluginów

OpenClaw klasyfikuje załadowane pluginy według ich zachowania rejestracyjnego:

| Kształt              | Opis                                               |
| -------------------- | -------------------------------------------------- |
| **plain-capability**  | Jeden typ capability (np. tylko provider)         |
| **hybrid-capability** | Wiele typów capability (np. provider + speech)    |
| **hook-only**         | Tylko hooki, bez capability                        |
| **non-capability**    | Narzędzia/polecenia/usługi, ale bez capability     |

Użyj `openclaw plugins inspect <id>`, aby zobaczyć kształt pluginu.

## Powiązane

- [SDK Overview](/pl/plugins/sdk-overview) — API rejestracji i dokumentacja subpath
- [Runtime Helpers](/pl/plugins/sdk-runtime) — `api.runtime` i `createPluginRuntimeStore`
- [Setup and Config](/pl/plugins/sdk-setup) — manifest, punkt wejścia konfiguracji, ładowanie odroczone
- [Channel Plugins](/pl/plugins/sdk-channel-plugins) — budowanie obiektu `ChannelPlugin`
- [Provider Plugins](/pl/plugins/sdk-provider-plugins) — rejestracja providera i hooki
