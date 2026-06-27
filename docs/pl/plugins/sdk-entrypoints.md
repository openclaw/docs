---
read_when:
    - Potrzebujesz dokładnej sygnatury typu defineToolPlugin, definePluginEntry lub defineChannelPluginEntry
    - Chcesz zrozumieć tryb rejestracji (pełny vs konfiguracja vs metadane CLI)
    - Sprawdzasz opcje punktu wejścia
sidebarTitle: Entry Points
summary: Dokumentacja referencyjna dla defineToolPlugin, definePluginEntry, defineChannelPluginEntry i defineSetupPluginEntry
title: Punkty wejścia Plugin
x-i18n:
    generated_at: "2026-06-27T18:05:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49c024020202b754bde9bfa3f2a880332f1a5b4b19b397e59ae83c2673871211
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Każdy plugin eksportuje domyślny obiekt wejściowy. SDK zapewnia pomocnicze funkcje do
ich tworzenia.

W przypadku zainstalowanych pluginów `package.json` powinien kierować ładowanie runtime
na zbudowany JavaScript, gdy jest dostępny:

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

`extensions` i `setupEntry` pozostają prawidłowymi wpisami źródłowymi dla pracy w workspace i checkoutach git. `runtimeExtensions` i `runtimeSetupEntry` są preferowane,
gdy OpenClaw ładuje zainstalowany pakiet, i pozwalają pakietom npm uniknąć kompilacji
TypeScriptu w runtime. Jawne wpisy runtime są wymagane: `runtimeSetupEntry`
wymaga `setupEntry`, a brakujące artefakty `runtimeExtensions` lub `runtimeSetupEntry`
powodują niepowodzenie instalacji/wykrywania zamiast cichego powrotu do źródła. Jeśli
zainstalowany pakiet deklaruje tylko wpis źródłowy TypeScript, OpenClaw użyje
odpowiedniego zbudowanego odpowiednika `dist/*.js`, gdy istnieje, a następnie wróci do źródła TypeScript.

Wszystkie ścieżki wejściowe muszą pozostawać wewnątrz katalogu pakietu pluginu. Wpisy runtime
i wywnioskowane zbudowane odpowiedniki JavaScript nie sprawiają, że wychodząca poza katalog ścieżka źródłowa `extensions` lub
`setupEntry` staje się prawidłowa.

<Tip>
  **Szukasz przewodnika krok po kroku?** Zobacz [Pluginy narzędzi](/pl/plugins/tool-plugins),
  [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) lub
  [Pluginy dostawców](/pl/plugins/sdk-provider-plugins), aby uzyskać instrukcje krok po kroku.
</Tip>

## `defineToolPlugin`

**Import:** `openclaw/plugin-sdk/tool-plugin`

Dla prostych pluginów, które dodają tylko narzędzia agentów. `defineToolPlugin` utrzymuje
małe źródło autorskie, wywnioskowuje typy konfiguracji i parametrów narzędzi ze schematów TypeBox,
opakowuje zwykłe wartości zwrotne w format wyniku narzędzia OpenClaw i
udostępnia statyczne metadane, które `openclaw plugins build` zapisuje w manifeście
pluginu.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quotes.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "API key." })),
  }),
  tools: (tool) => [
    tool({
      name: "quote",
      label: "Quote",
      description: "Fetch a quote.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol." }),
      }),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` jest opcjonalny. Po pominięciu OpenClaw używa ścisłego schematu pustego obiektu,
  a wygenerowany manifest nadal zawiera `configSchema`.
- `execute` zwraca zwykły ciąg znaków lub wartość możliwą do serializacji jako JSON. Funkcja pomocnicza opakowuje
  ją jako tekstowy wynik narzędzia z `details`.
- Nazwy narzędzi są statyczne. `openclaw plugins build` wyprowadza `contracts.tools`
  z zadeklarowanych narzędzi, więc autorzy nie duplikują nazw ręcznie.
- Ładowanie runtime pozostaje ścisłe. Zainstalowane pluginy nadal potrzebują
  `openclaw.plugin.json` i `package.json` `openclaw.extensions`; OpenClaw nie
  wykonuje kodu pluginu, aby wywnioskować brakujące dane manifestu.

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Dla pluginów dostawców, zaawansowanych pluginów narzędzi, pluginów hooków i wszystkiego, co
**nie** jest kanałem wiadomości.

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
| `id`           | `string`                                                         | Tak      | -                   |
| `name`         | `string`                                                         | Tak      | -                   |
| `description`  | `string`                                                         | Tak      | -                   |
| `kind`         | `string`                                                         | Nie      | -                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nie      | Schemat pustego obiektu |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Tak      | -                   |

- `id` musi pasować do manifestu `openclaw.plugin.json`.
- `kind` jest przeznaczone dla slotów wyłącznych: `"memory"` lub `"context-engine"`.
- `configSchema` może być funkcją do leniwej ewaluacji.
- OpenClaw rozwiązuje i memoizuje ten schemat przy pierwszym dostępie, więc kosztowne konstruktory schematów
  uruchamiają się tylko raz.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Opakowuje `definePluginEntry` z okablowaniem specyficznym dla kanału. Automatycznie wywołuje
`api.registerChannel({ plugin })`, udostępnia opcjonalną seam metadanych CLI pomocy głównej
i ogranicza `registerFull` według trybu rejestracji.

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
| `id`                  | `string`                                                         | Tak      | -                   |
| `name`                | `string`                                                         | Tak      | -                   |
| `description`         | `string`                                                         | Tak      | -                   |
| `plugin`              | `ChannelPlugin`                                                  | Tak      | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nie      | Schemat pustego obiektu |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Nie      | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Nie      | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Nie      | -                   |

- `setRuntime` jest wywoływane podczas rejestracji, aby można było zapisać referencję runtime
  (zwykle przez `createPluginRuntimeStore`). Jest pomijane podczas przechwytywania metadanych CLI.
- `registerCliMetadata` działa podczas `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` oraz
  `api.registrationMode === "full"`.
  Używaj go jako kanonicznego miejsca na deskryptory CLI należące do kanału, aby pomoc główna
  pozostawała nieaktywująca, snapshoty wykrywania zawierały statyczne metadane poleceń, a
  normalna rejestracja poleceń CLI pozostawała zgodna z pełnymi ładowaniami pluginów.
- Rejestracja wykrywania jest nieaktywująca, a nie wolna od importów. OpenClaw może
  ewaluować zaufany wpis pluginu i moduł pluginu kanału, aby zbudować
  snapshot, więc utrzymuj importy najwyższego poziomu bez efektów ubocznych i umieszczaj sockety,
  klientów, workery i usługi za ścieżkami tylko dla `"full"`.
- `registerFull` działa tylko wtedy, gdy `api.registrationMode === "full"`. Jest pomijane
  podczas ładowania tylko setup.
- Podobnie jak `definePluginEntry`, `configSchema` może być leniwą fabryką, a OpenClaw
  memoizuje rozwiązany schemat przy pierwszym dostępie.
- Dla głównych poleceń CLI należących do pluginu preferuj `api.registerCli(..., { descriptors: [...] })`,
  gdy chcesz, aby polecenie pozostało ładowane leniwie bez znikania z
  głównego drzewa parsowania CLI. Dla poleceń funkcji sparowanych węzłów preferuj
  `api.registerNodeCliFeature(...)`, aby polecenie trafiło pod `openclaw nodes`.
  Dla innych zagnieżdżonych poleceń pluginów dodaj `parentPath` i rejestruj polecenia na
  obiekcie `program` przekazanym do rejestratora; OpenClaw rozwiązuje go do
  polecenia nadrzędnego przed wywołaniem pluginu. Dla pluginów kanałów preferuj
  rejestrowanie tych deskryptorów z `registerCliMetadata(...)` i utrzymuj
  `registerFull(...)` skupione na pracy wyłącznie runtime.
- Jeśli `registerFull(...)` rejestruje także metody RPC Gateway, utrzymuj je na
  prefiksie specyficznym dla pluginu. Zarezerwowane główne przestrzenie nazw administracyjnych (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) są zawsze wymuszane na
  `operator.admin`.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Dla lekkiego pliku `setup-entry.ts`. Zwraca tylko `{ plugin }` bez
okablowania runtime ani CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw ładuje to zamiast pełnego wpisu, gdy kanał jest wyłączony,
nieskonfigurowany lub gdy włączone jest odroczone ładowanie. Zobacz
[Setup i konfiguracja](/pl/plugins/sdk-setup#setup-entry), aby dowiedzieć się, kiedy ma to znaczenie.

W praktyce łącz `defineSetupPluginEntry(...)` z wąskimi rodzinami pomocników setup:

- `openclaw/plugin-sdk/setup-runtime` dla bezpiecznych w runtime pomocników setup, takich jak
  `createSetupTranslator`, bezpieczne dla importu adaptery poprawek setup, wyjście lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` i delegowane proxy setup
- `openclaw/plugin-sdk/channel-setup` dla powierzchni setup opcjonalnej instalacji
- `openclaw/plugin-sdk/setup-tools` dla pomocników setup/instalacji CLI/archiwum/dokumentacji

Trzymaj ciężkie SDK, rejestrację CLI i długowieczne usługi runtime w pełnym
wpisie.

Bundlowane kanały workspace, które rozdzielają powierzchnie setup i runtime, mogą zamiast tego użyć
`defineBundledChannelSetupEntry(...)` z
`openclaw/plugin-sdk/channel-entry-contract`. Ten kontrakt pozwala
wpisowi setup zachować bezpieczne dla setup eksporty pluginu/secrets, jednocześnie nadal udostępniając
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
  registerSetupRuntime(api) {
    api.registerHttpRoute({
      path: "/my-channel/events",
      auth: "plugin",
      handler: async (req, res) => {
        /* setup-safe route */
      },
    });
  },
});
```

Używaj tego bundlowanego kontraktu tylko wtedy, gdy przepływy setup naprawdę potrzebują lekkiego settera runtime
lub bezpiecznej dla setup powierzchni Gateway przed załadowaniem pełnego wpisu kanału.
`registerSetupRuntime` działa tylko dla ładowań `"setup-runtime"`; ogranicz je do
tras lub metod wyłącznie konfiguracyjnych, które muszą istnieć przed odroczoną pełną aktywacją.

## Tryb rejestracji

`api.registrationMode` informuje plugin, w jaki sposób został załadowany:

| Tryb              | Kiedy                             | Co zarejestrować                                                                                                           |
| ----------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Normalne uruchomienie Gateway     | Wszystko                                                                                                                   |
| `"discovery"`     | Wykrywanie możliwości tylko do odczytu | Rejestracja kanału oraz statyczne deskryptory CLI; kod wejściowy może się załadować, ale pomija gniazda, workery, klientów i usługi |
| `"setup-only"`    | Wyłączony/nieskonfigurowany kanał | Tylko rejestracja kanału                                                                                                   |
| `"setup-runtime"` | Przepływ konfiguracji z dostępnym środowiskiem runtime | Rejestracja kanału oraz tylko lekkie środowisko runtime potrzebne przed załadowaniem pełnego wejścia                        |
| `"cli-metadata"`  | Pomoc główna / przechwytywanie metadanych CLI | Tylko deskryptory CLI                                                                                                      |

`defineChannelPluginEntry` obsługuje ten podział automatycznie. Jeśli używasz
`definePluginEntry` bezpośrednio dla kanału, sprawdź tryb samodzielnie:

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

Tryb wykrywania buduje nieaktywującą migawkę rejestru. Nadal może ocenić
wejście Plugin i obiekt Plugin kanału, aby OpenClaw mógł zarejestrować
możliwości kanału oraz statyczne deskryptory CLI. Traktuj ocenę modułu podczas
wykrywania jako zaufaną, ale lekką: bez klientów sieciowych, podprocesów,
listenerów, połączeń z bazą danych, workerów w tle, odczytów poświadczeń ani
innych aktywnych efektów ubocznych środowiska runtime na najwyższym poziomie.

Traktuj `"setup-runtime"` jako okno, w którym powierzchnie startowe tylko do
konfiguracji muszą istnieć bez ponownego wchodzenia w pełne środowisko runtime
dołączonego kanału. Dobrze pasują tu rejestracja kanału, bezpieczne dla
konfiguracji trasy HTTP, bezpieczne dla konfiguracji metody Gateway oraz
delegowane pomocniki konfiguracji. Ciężkie usługi w tle, rejestratory CLI oraz
inicjalizacje SDK dostawców/klientów nadal należą do `"full"`.

W przypadku rejestratorów CLI konkretnie:

- używaj `descriptors`, gdy rejestrator posiada jedno lub więcej poleceń
  głównych i chcesz, aby OpenClaw leniwie ładował rzeczywisty moduł CLI przy
  pierwszym wywołaniu
- upewnij się, że te deskryptory obejmują każdy główny korzeń polecenia
  udostępniany przez rejestrator
- ogranicz nazwy poleceń deskryptorów do liter, cyfr, łącznika i podkreślenia,
  zaczynając od litery lub cyfry; OpenClaw odrzuca nazwy deskryptorów spoza
  tego kształtu i usuwa sekwencje sterujące terminala z opisów przed
  renderowaniem pomocy
- używaj wyłącznie `commands` tylko dla ścieżek zgodności ładowanych od razu

## Kształty Plugin

OpenClaw klasyfikuje załadowane Pluginy według ich zachowania rejestracji:

| Kształt               | Opis                                                |
| --------------------- | --------------------------------------------------- |
| **plain-capability**  | Jeden typ możliwości (np. tylko dostawca)           |
| **hybrid-capability** | Wiele typów możliwości (np. dostawca + mowa)        |
| **hook-only**         | Tylko hooki, bez możliwości                         |
| **non-capability**    | Narzędzia/polecenia/usługi, ale bez możliwości      |

Użyj `openclaw plugins inspect <id>`, aby zobaczyć kształt Plugin.

## Powiązane

- [Omówienie SDK](/pl/plugins/sdk-overview) - API rejestracji i referencja podścieżek
- [Pomocniki runtime](/pl/plugins/sdk-runtime) - `api.runtime` i `createPluginRuntimeStore`
- [Konfiguracja i config](/pl/plugins/sdk-setup) - manifest, wejście konfiguracji, odroczone ładowanie
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) - budowanie obiektu `ChannelPlugin`
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) - rejestracja dostawcy i hooki
