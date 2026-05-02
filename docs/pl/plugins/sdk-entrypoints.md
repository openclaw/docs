---
read_when:
    - Potrzebujesz dokładnej sygnatury typu definePluginEntry lub defineChannelPluginEntry
    - Chcesz zrozumieć tryb rejestracji (pełny vs konfiguracja vs metadane CLI)
    - Sprawdzasz opcje punktu wejścia
sidebarTitle: Entry Points
summary: Dokumentacja referencyjna dla definePluginEntry, defineChannelPluginEntry i defineSetupPluginEntry
title: Punkty wejścia Plugin
x-i18n:
    generated_at: "2026-05-02T09:59:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: a29e7e12c38fb579bb78a0e1e753edafc43298c2795504969c3477c849a5d74d
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Każdy Plugin eksportuje domyślny obiekt wejściowy. SDK udostępnia trzy pomocniki do
ich tworzenia.

W przypadku zainstalowanych pluginów `package.json` powinien kierować ładowanie środowiska uruchomieniowego na zbudowany
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

`extensions` i `setupEntry` pozostają prawidłowymi wpisami źródłowymi dla pracy w obszarze roboczym i
rozwoju z użyciem pobranego repozytorium git. `runtimeExtensions` i `runtimeSetupEntry` są preferowane,
gdy OpenClaw ładuje zainstalowany pakiet, i pozwalają pakietom npm uniknąć kompilacji
TypeScript w czasie działania. Jawne wpisy środowiska uruchomieniowego są wymagane: `runtimeSetupEntry`
wymaga `setupEntry`, a brakujące artefakty `runtimeExtensions` lub `runtimeSetupEntry`
powodują niepowodzenie instalacji/wykrywania zamiast cichego powrotu do źródeł. Jeśli
zainstalowany pakiet deklaruje tylko wpis źródłowy TypeScript, OpenClaw użyje
pasującego zbudowanego odpowiednika `dist/*.js`, jeśli istnieje, a następnie wróci do źródła
TypeScript.

Wszystkie ścieżki wpisów muszą pozostawać wewnątrz katalogu pakietu pluginu. Wpisy środowiska uruchomieniowego
i wywnioskowane zbudowane odpowiedniki JavaScript nie sprawiają, że wychodząca poza katalog ścieżka źródłowa `extensions` lub
`setupEntry` staje się prawidłowa.

<Tip>
  **Szukasz przewodnika krok po kroku?** Zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins)
  lub [Pluginy dostawców](/pl/plugins/sdk-provider-plugins), aby uzyskać instrukcje krok po kroku.
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Dla pluginów dostawców, pluginów narzędzi, pluginów hooków i wszystkiego, co **nie jest**
kanałem komunikacyjnym.

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

| Pole           | Typ                                                              | Wymagane | Domyślnie             |
| -------------- | ---------------------------------------------------------------- | -------- | --------------------- |
| `id`           | `string`                                                         | Tak      | —                     |
| `name`         | `string`                                                         | Tak      | —                     |
| `description`  | `string`                                                         | Tak      | —                     |
| `kind`         | `string`                                                         | Nie      | —                     |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nie      | Schemat pustego obiektu |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Tak      | —                     |

- `id` musi pasować do manifestu `openclaw.plugin.json`.
- `kind` służy do wyłącznych slotów: `"memory"` lub `"context-engine"`.
- `configSchema` może być funkcją do leniwej ewaluacji.
- OpenClaw rozwiązuje i zapamiętuje ten schemat przy pierwszym dostępie, więc kosztowne konstruktory schematów
  uruchamiają się tylko raz.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Opakowuje `definePluginEntry` okablowaniem specyficznym dla kanału. Automatycznie wywołuje
`api.registerChannel({ plugin })`, udostępnia opcjonalny punkt rozszerzenia metadanych CLI pomocy głównej
i bramkuje `registerFull` na podstawie trybu rejestracji.

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

| Pole                  | Typ                                                              | Wymagane | Domyślnie             |
| --------------------- | ---------------------------------------------------------------- | -------- | --------------------- |
| `id`                  | `string`                                                         | Tak      | —                     |
| `name`                | `string`                                                         | Tak      | —                     |
| `description`         | `string`                                                         | Tak      | —                     |
| `plugin`              | `ChannelPlugin`                                                  | Tak      | —                     |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nie      | Schemat pustego obiektu |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Nie      | —                     |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Nie      | —                     |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Nie      | —                     |

- `setRuntime` jest wywoływane podczas rejestracji, aby można było zapisać referencję środowiska uruchomieniowego
  (zwykle przez `createPluginRuntimeStore`). Jest pomijane podczas przechwytywania metadanych CLI.
- `registerCliMetadata` działa podczas `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` oraz
  `api.registrationMode === "full"`.
  Używaj go jako kanonicznego miejsca dla deskryptorów CLI należących do kanału, aby pomoc główna
  pozostawała nieaktywująca, migawki wykrywania obejmowały statyczne metadane poleceń, a
  zwykła rejestracja poleceń CLI pozostawała zgodna z pełnymi ładowaniami pluginu.
- Rejestracja wykrywania jest nieaktywująca, a nie wolna od importów. OpenClaw może
  ewaluować zaufany wpis pluginu i moduł pluginu kanału, aby zbudować
  migawkę, więc utrzymuj importy najwyższego poziomu bez efektów ubocznych i umieszczaj gniazda,
  klientów, workery i usługi za ścieżkami tylko dla `"full"`.
- `registerFull` działa tylko wtedy, gdy `api.registrationMode === "full"`. Jest pomijane
  podczas ładowania tylko konfiguracji.
- Podobnie jak `definePluginEntry`, `configSchema` może być leniwą fabryką, a OpenClaw
  zapamiętuje rozwiązany schemat przy pierwszym dostępie.
- Dla należących do pluginu głównych poleceń CLI preferuj `api.registerCli(..., { descriptors: [...] })`,
  gdy chcesz, aby polecenie pozostało ładowane leniwie bez znikania z
  głównego drzewa parsowania CLI. W przypadku pluginów kanałów preferuj rejestrowanie tych deskryptorów
  z `registerCliMetadata(...)` i utrzymuj `registerFull(...)` skupione na pracy wyłącznie w czasie działania.
- Jeśli `registerFull(...)` rejestruje także metody RPC Gateway, utrzymuj je pod
  prefiksem specyficznym dla pluginu. Zarezerwowane przestrzenie nazw administracji rdzenia (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) są zawsze wymuszane na
  `operator.admin`.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Dla lekkiego pliku `setup-entry.ts`. Zwraca tylko `{ plugin }` bez
okablowania środowiska uruchomieniowego ani CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw ładuje to zamiast pełnego wpisu, gdy kanał jest wyłączony,
nieskonfigurowany albo gdy włączone jest odroczone ładowanie. Zobacz
[Konfiguracja i ustawienia](/pl/plugins/sdk-setup#setup-entry), aby dowiedzieć się, kiedy ma to znaczenie.

W praktyce łącz `defineSetupPluginEntry(...)` z wąskimi rodzinami pomocników konfiguracji:

- `openclaw/plugin-sdk/setup-runtime` dla bezpiecznych w czasie działania pomocników konfiguracji, takich jak
  bezpieczne dla importu adaptery łatek konfiguracji, wyjście notatki wyszukiwania,
  `promptResolvedAllowFrom`, `splitSetupEntries` i delegowane proxy konfiguracji
- `openclaw/plugin-sdk/channel-setup` dla powierzchni konfiguracji opcjonalnej instalacji
- `openclaw/plugin-sdk/setup-tools` dla pomocników CLI/archiwum/dokumentacji konfiguracji/instalacji

Ciężkie SDK, rejestrację CLI i długotrwałe usługi środowiska uruchomieniowego trzymaj w pełnym
wpisie.

Dołączone kanały obszaru roboczego, które rozdzielają powierzchnie konfiguracji i środowiska uruchomieniowego, mogą zamiast tego użyć
`defineBundledChannelSetupEntry(...)` z
`openclaw/plugin-sdk/channel-entry-contract`. Ten kontrakt pozwala
wpisowi konfiguracji zachować bezpieczne dla konfiguracji eksporty pluginu/sekretów, jednocześnie nadal udostępniając
setter środowiska uruchomieniowego:

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

Używaj tego dołączonego kontraktu tylko wtedy, gdy przepływy konfiguracji naprawdę potrzebują lekkiego settera środowiska uruchomieniowego
przed załadowaniem pełnego wpisu kanału.

## Tryb rejestracji

`api.registrationMode` informuje plugin, jak został załadowany:

| Tryb              | Kiedy                             | Co rejestrować                                                                                                         |
| ----------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Normalny start Gateway            | Wszystko                                                                                                               |
| `"discovery"`     | Wykrywanie możliwości tylko do odczytu | Rejestrację kanału plus statyczne deskryptory CLI; kod wpisu może się załadować, ale pomiń gniazda, workery, klientów i usługi |
| `"setup-only"`    | Wyłączony/nieskonfigurowany kanał | Tylko rejestrację kanału                                                                                               |
| `"setup-runtime"` | Przepływ konfiguracji z dostępnym środowiskiem uruchomieniowym | Rejestrację kanału plus tylko lekkie środowisko uruchomieniowe potrzebne przed załadowaniem pełnego wpisu |
| `"cli-metadata"`  | Pomoc główna / przechwytywanie metadanych CLI | Tylko deskryptory CLI                                                                                                  |

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

Tryb wykrywania buduje nieaktywującą migawkę rejestru. Może nadal ewaluować
wpis pluginu i obiekt pluginu kanału, aby OpenClaw mógł rejestrować możliwości kanału
i statyczne deskryptory CLI. Traktuj ewaluację modułu podczas wykrywania jako
zaufaną, ale lekką: bez klientów sieciowych, podprocesów, listenerów, połączeń z bazą danych,
workerów w tle, odczytów poświadczeń ani innych efektów ubocznych działającego środowiska uruchomieniowego
na najwyższym poziomie.

Traktuj `"setup-runtime"` jako okno, w którym powierzchnie startowe tylko dla konfiguracji muszą
istnieć bez ponownego wchodzenia w pełne środowisko uruchomieniowe dołączonego kanału. Dobrym dopasowaniem są
rejestracja kanału, bezpieczne dla konfiguracji trasy HTTP, bezpieczne dla konfiguracji metody Gateway i
delegowane pomocniki konfiguracji. Ciężkie usługi w tle, rejestratory CLI i
inicjalizacje SDK dostawców/klientów nadal należą do `"full"`.

W szczególności w przypadku rejestratorów CLI:

- używaj `descriptors`, gdy rejestrator jest właścicielem jednego lub większej liczby głównych poleceń i chcesz,
  aby OpenClaw leniwie ładował rzeczywisty moduł CLI przy pierwszym wywołaniu
- upewnij się, że te deskryptory obejmują każdy korzeń polecenia najwyższego poziomu udostępniany przez
  rejestrator
- ogranicz nazwy poleceń deskryptorów do liter, cyfr, łącznika i podkreślenia,
  zaczynając od litery lub cyfry; OpenClaw odrzuca nazwy deskryptorów spoza
  tego kształtu i usuwa sekwencje sterujące terminala z opisów przed
  renderowaniem pomocy
- używaj samego `commands` tylko dla gorliwych ścieżek zgodności

## Kształty pluginów

OpenClaw klasyfikuje załadowane pluginy według ich zachowania podczas rejestracji:

| Kształt               | Opis                                               |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Jeden typ capability (np. tylko provider)          |
| **hybrid-capability** | Wiele typów capability (np. provider + speech)     |
| **hook-only**         | Tylko hooki, bez capabilities                      |
| **non-capability**    | Narzędzia/polecenia/usługi, ale bez capabilities   |

Użyj `openclaw plugins inspect <id>`, aby zobaczyć kształt pluginu.

## Powiązane

- [Omówienie SDK](/pl/plugins/sdk-overview) — API rejestracji i odniesienie do subpath
- [Pomocniki runtime](/pl/plugins/sdk-runtime) — `api.runtime` i `createPluginRuntimeStore`
- [Konfiguracja i ustawienia](/pl/plugins/sdk-setup) — manifest, punkt wejścia konfiguracji, odroczone ładowanie
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — tworzenie obiektu `ChannelPlugin`
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) — rejestracja providerów i hooki
