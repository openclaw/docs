---
read_when:
    - Potrzebujesz dokładnej sygnatury typu `definePluginEntry` lub `defineChannelPluginEntry`
    - Chcesz zrozumieć tryb rejestracji (pełny vs setup vs metadane CLI)
    - Szukasz opcji punktu wejścia Plugin
sidebarTitle: Entry Points
summary: Dokumentacja `definePluginEntry`, `defineChannelPluginEntry` i `defineSetupPluginEntry`
title: Punkty wejścia Plugin
x-i18n:
    generated_at: "2026-04-24T09:23:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 517559e16416cbf9d152a0ca2e09f57de92ff65277fec768cbaf38d9de62e051
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

Każdy Plugin eksportuje domyślny obiekt entry. SDK udostępnia trzy helpery do
ich tworzenia.

Dla zainstalowanych Plugin `package.json` powinien kierować ładowanie runtime do
zbudowanego JavaScript, gdy jest dostępny:

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

`extensions` i `setupEntry` pozostają prawidłowymi wpisami źródłowymi dla developmentu w obszarze roboczym i checkoutach git.
`runtimeExtensions` i `runtimeSetupEntry` są preferowane, gdy
OpenClaw ładuje zainstalowany pakiet, i pozwalają pakietom npm uniknąć kompilacji
TypeScript w runtime. Jeśli zainstalowany pakiet deklaruje tylko źródłowy wpis
TypeScript, OpenClaw użyje pasującego zbudowanego odpowiednika `dist/*.js`, gdy istnieje,
a dopiero potem wróci do źródła TypeScript.

Wszystkie ścieżki entry muszą pozostawać wewnątrz katalogu pakietu Plugin. Wpisy runtime
i wywnioskowane zbudowane odpowiedniki JavaScript nie sprawiają, że uciekająca ścieżka źródłowa
`extensions` lub `setupEntry` staje się prawidłowa.

<Tip>
  **Szukasz przewodnika krok po kroku?** Zobacz [Plugins kanałów](/pl/plugins/sdk-channel-plugins)
  lub [Plugins providerów](/pl/plugins/sdk-provider-plugins).
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Dla Plugin providerów, Plugin narzędzi, Plugin hooków i wszystkiego, co **nie jest**
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

| Pole           | Typ                                                              | Wymagane | Domyślnie          |
| -------------- | ---------------------------------------------------------------- | -------- | ------------------ |
| `id`           | `string`                                                         | Tak      | —                  |
| `name`         | `string`                                                         | Tak      | —                  |
| `description`  | `string`                                                         | Tak      | —                  |
| `kind`         | `string`                                                         | Nie      | —                  |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nie      | Schemat pustego obiektu |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Tak      | —                  |

- `id` musi odpowiadać manifestowi `openclaw.plugin.json`.
- `kind` jest przeznaczone dla wyłącznych slotów: `"memory"` lub `"context-engine"`.
- `configSchema` może być funkcją do leniwej ewaluacji.
- OpenClaw rozwiązuje i memoizuje ten schemat przy pierwszym dostępie, więc kosztowne
  konstruktory schematów uruchamiają się tylko raz.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Opakowuje `definePluginEntry` okablowaniem specyficznym dla kanału. Automatycznie wywołuje
`api.registerChannel({ plugin })`, ujawnia opcjonalny seam metadanych CLI root-help i
ogranicza `registerFull` przez tryb rejestracji.

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

| Pole                  | Typ                                                              | Wymagane | Domyślnie          |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------ |
| `id`                  | `string`                                                         | Tak      | —                  |
| `name`                | `string`                                                         | Tak      | —                  |
| `description`         | `string`                                                         | Tak      | —                  |
| `plugin`              | `ChannelPlugin`                                                  | Tak      | —                  |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nie      | Schemat pustego obiektu |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Nie      | —                  |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Nie      | —                  |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Nie      | —                  |

- `setRuntime` jest wywoływane podczas rejestracji, dzięki czemu możesz zapisać referencję runtime
  (zwykle przez `createPluginRuntimeStore`). Jest pomijane podczas
  przechwytywania metadanych CLI.
- `registerCliMetadata` uruchamia się zarówno przy `api.registrationMode === "cli-metadata"`,
  jak i `api.registrationMode === "full"`.
  Używaj tego jako kanonicznego miejsca dla deskryptorów CLI należących do kanału, aby root help
  pozostawał nieaktywujący, a zwykła rejestracja poleceń CLI zachowała zgodność
  z pełnym ładowaniem Plugin.
- `registerFull` uruchamia się tylko wtedy, gdy `api.registrationMode === "full"`. Jest pomijane
  podczas ładowania tylko do setupu.
- Podobnie jak w `definePluginEntry`, `configSchema` może być leniwą fabryką, a OpenClaw
  memoizuje rozwiązany schemat przy pierwszym dostępie.
- Dla poleceń root CLI należących do Plugin preferuj `api.registerCli(..., { descriptors: [...] })`,
  gdy chcesz, aby polecenie pozostało ładowane leniwie, ale nie znikało z
  drzewa parsowania root CLI. Dla Plugin kanałów preferuj rejestrowanie tych deskryptorów
  z `registerCliMetadata(...)`, a `registerFull(...)` zachowaj dla pracy tylko runtime.
- Jeśli `registerFull(...)` rejestruje też metody Gateway RPC, utrzymuj je pod
  prefiksem specyficznym dla Plugin. Zastrzeżone przestrzenie nazw administracyjnych core (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) są zawsze wymuszane do
  `operator.admin`.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Dla lekkiego pliku `setup-entry.ts`. Zwraca tylko `{ plugin }`, bez
okablowania runtime ani CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw ładuje to zamiast pełnego entry, gdy kanał jest wyłączony,
nieskonfigurowany albo gdy włączone jest ładowanie odroczone. Zobacz
[Setup i konfiguracja](/pl/plugins/sdk-setup#setup-entry), aby dowiedzieć się, kiedy ma to znaczenie.

W praktyce łącz `defineSetupPluginEntry(...)` z wąskimi rodzinami helperów setup:

- `openclaw/plugin-sdk/setup-runtime` dla helperów setup bezpiecznych dla runtime, takich jak
  import-safe adaptery patch setupu, dane wyjściowe lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` i delegowane proxy setupu
- `openclaw/plugin-sdk/channel-setup` dla powierzchni setup opcjonalnej instalacji
- `openclaw/plugin-sdk/setup-tools` dla helperów CLI/archive/docs setup/install

Ciężkie SDK, rejestrację CLI i długowieczne usługi runtime trzymaj w pełnym
entry.

Dołączone kanały obszaru roboczego, które rozdzielają powierzchnie setup i runtime, mogą zamiast tego używać
`defineBundledChannelSetupEntry(...)` z
`openclaw/plugin-sdk/channel-entry-contract`. Ten kontrakt pozwala
setup entry zachować eksporty plugin/secrets bezpieczne dla setup, a jednocześnie nadal udostępniać
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

Używaj tego dołączonego kontraktu tylko wtedy, gdy przepływy setup naprawdę potrzebują lekkiego settera runtime
przed załadowaniem pełnego entry kanału.

## Tryb rejestracji

`api.registrationMode` mówi Twojemu Plugin, w jaki sposób został załadowany:

| Tryb              | Kiedy                              | Co rejestrować                                                                           |
| ----------------- | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `"full"`          | Zwykły start Gateway               | Wszystko                                                                                 |
| `"setup-only"`    | Wyłączony/nieskonfigurowany kanał  | Tylko rejestrację kanału                                                                 |
| `"setup-runtime"` | Przepływ setup z dostępnym runtime | Rejestrację kanału plus tylko lekki runtime potrzebny przed załadowaniem pełnego entry |
| `"cli-metadata"`  | Root help / przechwytywanie metadanych CLI | Tylko deskryptory CLI                                                             |

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

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

Traktuj `"setup-runtime"` jako okno, w którym powierzchnie startowe tylko do setupu muszą
istnieć bez ponownego wchodzenia w pełny runtime dołączonego kanału. Dobrze pasują tu
rejestracja kanału, bezpieczne dla setup trasy HTTP, bezpieczne dla setup metody Gateway oraz
delegowane helpery setupu. Ciężkie usługi w tle, rejestratory CLI i bootstrapy SDK providerów/klientów nadal należą do `"full"`.

Konkretnie dla rejestratorów CLI:

- używaj `descriptors`, gdy rejestrator jest właścicielem jednego lub więcej poleceń root i
  chcesz, aby OpenClaw leniwie ładował rzeczywisty moduł CLI przy pierwszym wywołaniu
- upewnij się, że te deskryptory obejmują każdy główny korzeń poleceń ujawniany przez
  rejestrator
- używaj samego `commands` tylko dla ścieżek zgodności eager

## Kształty Plugin

OpenClaw klasyfikuje załadowane Plugins według ich zachowania rejestracyjnego:

| Kształt                | Opis                                              |
| ---------------------- | ------------------------------------------------- |
| **plain-capability**   | Jeden typ możliwości (np. tylko provider)         |
| **hybrid-capability**  | Wiele typów możliwości (np. provider + speech)    |
| **hook-only**          | Tylko hooki, bez możliwości                       |
| **non-capability**     | Narzędzia/polecenia/usługi, ale bez możliwości    |

Użyj `openclaw plugins inspect <id>`, aby zobaczyć kształt Plugin.

## Powiązane

- [Przegląd SDK](/pl/plugins/sdk-overview) — dokumentacja API rejestracji i podścieżek
- [Runtime Helpers](/pl/plugins/sdk-runtime) — `api.runtime` i `createPluginRuntimeStore`
- [Setup i konfiguracja](/pl/plugins/sdk-setup) — manifest, setup entry, ładowanie odroczone
- [Plugins kanałów](/pl/plugins/sdk-channel-plugins) — budowanie obiektu `ChannelPlugin`
- [Plugins providerów](/pl/plugins/sdk-provider-plugins) — rejestracja providerów i hooki
