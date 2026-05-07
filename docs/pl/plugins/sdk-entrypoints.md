---
read_when:
    - Potrzebujesz dokładnej sygnatury typu definePluginEntry lub defineChannelPluginEntry
    - Chcesz zrozumieć tryb rejestracji (full, setup i metadane CLI)
    - Sprawdzasz opcje punktu wejścia
sidebarTitle: Entry Points
summary: Dokumentacja referencyjna dla definePluginEntry, defineChannelPluginEntry i defineSetupPluginEntry
title: Punkty wejścia Plugin
x-i18n:
    generated_at: "2026-05-07T13:23:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fecc65b8f196f3b40daee2e6087759b8786b033e1cd0c3d3b5695c9f8a3f66a
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Każdy plugin eksportuje domyślny obiekt wejściowy. SDK udostępnia trzy helpery do
ich tworzenia.

W przypadku zainstalowanych pluginów `package.json` powinien kierować ładowanie
runtime do zbudowanego kodu JavaScript, gdy jest dostępny:

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

`extensions` i `setupEntry` pozostają prawidłowymi wpisami źródłowymi dla pracy
w workspace i checkoutów git. `runtimeExtensions` i `runtimeSetupEntry` są
preferowane, gdy OpenClaw ładuje zainstalowany pakiet, i pozwalają pakietom npm
unikać kompilacji TypeScript w czasie działania. Jawne wpisy runtime są wymagane:
`runtimeSetupEntry` wymaga `setupEntry`, a brakujące artefakty
`runtimeExtensions` lub `runtimeSetupEntry` powodują niepowodzenie
instalacji/wykrywania zamiast cichego powrotu do źródeł. Jeśli zainstalowany
pakiet deklaruje tylko wpis źródłowy TypeScript, OpenClaw użyje pasującego
zbudowanego odpowiednika `dist/*.js`, gdy istnieje, a następnie wróci do źródła
TypeScript.

Wszystkie ścieżki wpisów muszą pozostać wewnątrz katalogu pakietu pluginu. Wpisy
runtime i wywnioskowane zbudowane odpowiedniki JavaScript nie sprawiają, że
wychodząca poza katalog ścieżka źródłowa `extensions` lub `setupEntry` staje się
prawidłowa.

<Tip>
  **Szukasz przewodnika krok po kroku?** Zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins)
  lub [Pluginy dostawców](/pl/plugins/sdk-provider-plugins).
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Dla pluginów dostawców, pluginów narzędzi, pluginów hooków i wszystkiego, co
**nie jest** kanałem komunikacyjnym.

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

| Pole           | Typ                                                              | Wymagane | Domyślnie               |
| -------------- | ---------------------------------------------------------------- | -------- | ----------------------- |
| `id`           | `string`                                                         | Tak      | -                       |
| `name`         | `string`                                                         | Tak      | -                       |
| `description`  | `string`                                                         | Tak      | -                       |
| `kind`         | `string`                                                         | Nie      | -                       |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nie      | Schemat pustego obiektu |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Tak      | -                       |

- `id` musi odpowiadać manifestowi `openclaw.plugin.json`.
- `kind` służy do wyłącznych slotów: `"memory"` lub `"context-engine"`.
- `configSchema` może być funkcją do leniwej ewaluacji.
- OpenClaw rozwiązuje i memoizuje ten schemat przy pierwszym dostępie, więc
  kosztowne konstruktory schematów uruchamiają się tylko raz.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Opakowuje `definePluginEntry` przewodami specyficznymi dla kanału. Automatycznie
wywołuje `api.registerChannel({ plugin })`, udostępnia opcjonalny seam metadanych
CLI pomocy głównej i blokuje `registerFull` zależnie od trybu rejestracji.

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

| Pole                  | Typ                                                              | Wymagane | Domyślnie               |
| --------------------- | ---------------------------------------------------------------- | -------- | ----------------------- |
| `id`                  | `string`                                                         | Tak      | -                       |
| `name`                | `string`                                                         | Tak      | -                       |
| `description`         | `string`                                                         | Tak      | -                       |
| `plugin`              | `ChannelPlugin`                                                  | Tak      | -                       |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nie      | Schemat pustego obiektu |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Nie      | -                       |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Nie      | -                       |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Nie      | -                       |

- `setRuntime` jest wywoływane podczas rejestracji, aby można było zapisać
  referencję runtime (zwykle przez `createPluginRuntimeStore`). Jest pomijane
  podczas przechwytywania metadanych CLI.
- `registerCliMetadata` działa podczas `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` oraz
  `api.registrationMode === "full"`.
  Używaj go jako kanonicznego miejsca na należące do kanału deskryptory CLI, aby
  pomoc główna nie aktywowała pluginu, snapshoty wykrywania zawierały statyczne
  metadane poleceń, a normalna rejestracja poleceń CLI pozostawała zgodna z
  pełnymi ładowaniami pluginów.
- Rejestracja wykrywania nie aktywuje, ale nie jest wolna od importów. OpenClaw
  może ewaluować zaufany wpis pluginu i moduł pluginu kanału, aby zbudować
  snapshot, więc utrzymuj importy najwyższego poziomu bez skutków ubocznych i
  umieszczaj gniazda, klientów, workery i usługi za ścieżkami tylko dla `"full"`.
- `registerFull` działa tylko wtedy, gdy `api.registrationMode === "full"`. Jest
  pomijane podczas ładowania tylko konfiguracji.
- Podobnie jak `definePluginEntry`, `configSchema` może być leniwą fabryką, a
  OpenClaw memoizuje rozwiązany schemat przy pierwszym dostępie.
- W przypadku głównych poleceń CLI należących do pluginu preferuj
  `api.registerCli(..., { descriptors: [...] })`, gdy chcesz, aby polecenie
  pozostało ładowane leniwie bez znikania z drzewa parsowania głównego CLI. Dla
  poleceń funkcji sparowanych węzłów preferuj
  `api.registerNodeCliFeature(...)`, aby polecenie trafiło pod `openclaw nodes`.
  Dla innych zagnieżdżonych poleceń pluginu dodaj `parentPath` i rejestruj
  polecenia na obiekcie `program` przekazanym do rejestratora; OpenClaw rozwiązuje
  go do polecenia nadrzędnego przed wywołaniem pluginu. W przypadku pluginów
  kanałów preferuj rejestrowanie tych deskryptorów z `registerCliMetadata(...)` i
  utrzymuj `registerFull(...)` skoncentrowane na pracy wyłącznie runtime.
- Jeśli `registerFull(...)` rejestruje też metody RPC Gateway, trzymaj je pod
  prefiksem specyficznym dla pluginu. Zarezerwowane przestrzenie nazw administracji
  rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) są zawsze
  wymuszane do `operator.admin`.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Dla lekkiego pliku `setup-entry.ts`. Zwraca tylko `{ plugin }` bez przewodów
runtime ani CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw ładuje to zamiast pełnego wpisu, gdy kanał jest wyłączony,
nieskonfigurowany albo gdy włączone jest odroczone ładowanie. Zobacz
[Konfiguracja i config](/pl/plugins/sdk-setup#setup-entry), aby dowiedzieć się,
kiedy ma to znaczenie.

W praktyce łącz `defineSetupPluginEntry(...)` z wąskimi rodzinami helperów
konfiguracji:

- `openclaw/plugin-sdk/setup-runtime` dla helperów konfiguracji bezpiecznych dla
  runtime, takich jak bezpieczne dla importu adaptery poprawek konfiguracji,
  wynik notatek lookup, `promptResolvedAllowFrom`, `splitSetupEntries` i
  delegowane proxy konfiguracji
- `openclaw/plugin-sdk/channel-setup` dla powierzchni konfiguracji opcjonalnej
  instalacji
- `openclaw/plugin-sdk/setup-tools` dla helperów CLI/archiwum/dokumentacji
  konfiguracji/instalacji

Trzymaj ciężkie SDK, rejestrację CLI i długowieczne usługi runtime w pełnym
wpisie.

Kanały bundled workspace, które rozdzielają powierzchnie konfiguracji i runtime,
mogą zamiast tego użyć `defineBundledChannelSetupEntry(...)` z
`openclaw/plugin-sdk/channel-entry-contract`. Ten kontrakt pozwala wpisowi
konfiguracji zachować bezpieczne dla konfiguracji eksporty pluginu/secrets,
jednocześnie nadal udostępniając setter runtime:

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

Używaj tego bundled kontraktu tylko wtedy, gdy przepływy konfiguracji naprawdę
potrzebują lekkiego settera runtime przed załadowaniem pełnego wpisu kanału.

## Tryb rejestracji

`api.registrationMode` informuje plugin, jak został załadowany:

| Tryb              | Kiedy                                  | Co rejestrować                                                                                                                  |
| ----------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Normalne uruchamianie Gateway          | Wszystko                                                                                                                        |
| `"discovery"`     | Wykrywanie możliwości tylko do odczytu | Rejestracja kanału plus statyczne deskryptory CLI; kod wpisu może się załadować, ale pomiń gniazda, workery, klientów i usługi |
| `"setup-only"`    | Wyłączony/nieskonfigurowany kanał      | Tylko rejestracja kanału                                                                                                        |
| `"setup-runtime"` | Przepływ konfiguracji z dostępnym runtime | Rejestracja kanału plus tylko lekki runtime potrzebny przed załadowaniem pełnego wpisu                                        |
| `"cli-metadata"`  | Pomoc główna / przechwytywanie metadanych CLI | Tylko deskryptory CLI                                                                                                    |

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

Tryb wykrywania buduje nieaktywujący snapshot rejestru. Nadal może ewaluować
wpis pluginu i obiekt pluginu kanału, aby OpenClaw mógł zarejestrować możliwości
kanału oraz statyczne deskryptory CLI. Traktuj ewaluację modułu w wykrywaniu jako
zaufaną, ale lekką: bez klientów sieciowych, subprocessów, listenerów, połączeń
z bazą danych, workerów w tle, odczytów poświadczeń ani innych aktywnych skutków
ubocznych runtime na najwyższym poziomie.

Traktuj `"setup-runtime"` jako okno, w którym powierzchnie startowe tylko do
konfiguracji muszą istnieć bez ponownego wchodzenia w pełny runtime bundled
kanału. Dobre dopasowania to rejestracja kanału, bezpieczne dla konfiguracji
trasy HTTP, bezpieczne dla konfiguracji metody Gateway oraz delegowane helpery
konfiguracji. Ciężkie usługi w tle, rejestratory CLI i bootstrapy SDK
dostawców/klientów nadal należą do `"full"`.

W szczególności dla rejestratorów CLI:

- użyj `descriptors`, gdy rejestrator posiada co najmniej jedno główne polecenie i chcesz, aby OpenClaw leniwie ładował rzeczywisty moduł CLI przy pierwszym wywołaniu
- upewnij się, że te deskryptory obejmują każdy główny korzeń polecenia najwyższego poziomu udostępniany przez rejestrator
- ogranicz nazwy poleceń w deskryptorach do liter, cyfr, myślnika i podkreślenia, zaczynając od litery lub cyfry; OpenClaw odrzuca nazwy deskryptorów poza tym kształtem i usuwa sekwencje sterujące terminala z opisów przed renderowaniem pomocy
- używaj samego `commands` tylko dla gorliwych ścieżek zgodności

## Kształty Pluginów

OpenClaw klasyfikuje załadowane pluginy według ich zachowania podczas rejestracji:

| Kształt               | Opis                                               |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Jeden typ możliwości (np. tylko provider)          |
| **hybrid-capability** | Wiele typów możliwości (np. provider + speech)     |
| **hook-only**         | Tylko hooki, bez możliwości                        |
| **non-capability**    | Narzędzia/polecenia/usługi, ale bez możliwości     |

Użyj `openclaw plugins inspect <id>`, aby zobaczyć kształt pluginu.

## Powiązane

- [Omówienie SDK](/pl/plugins/sdk-overview) - API rejestracji i odwołania do ścieżek podrzędnych
- [Pomocniki Runtime](/pl/plugins/sdk-runtime) - `api.runtime` i `createPluginRuntimeStore`
- [Konfiguracja i ustawienia](/pl/plugins/sdk-setup) - manifest, punkt wejścia konfiguracji, odroczone ładowanie
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) - budowanie obiektu `ChannelPlugin`
- [Pluginy providerów](/pl/plugins/sdk-provider-plugins) - rejestracja providerów i hooki
