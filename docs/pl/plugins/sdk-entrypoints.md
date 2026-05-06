---
read_when:
    - Potrzebujesz dokładnej sygnatury typu definePluginEntry lub defineChannelPluginEntry
    - Chcesz zrozumieć tryb rejestracji (full vs setup vs metadane CLI)
    - Wyszukujesz opcje punktu wejścia
sidebarTitle: Entry Points
summary: Dokumentacja referencyjna dla definePluginEntry, defineChannelPluginEntry i defineSetupPluginEntry
title: Punkty wejścia Plugin
x-i18n:
    generated_at: "2026-05-06T09:24:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 296fded1572c4f95cc6c2eb8a7069a310ec05cce673003f81e86a916708cc85c
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Każdy plugin eksportuje domyślny obiekt wejściowy. SDK udostępnia trzy pomocniki do
ich tworzenia.

W przypadku zainstalowanych pluginów `package.json` powinien kierować ładowanie
runtime na zbudowany JavaScript, gdy jest dostępny:

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
w workspace i checkoutach git. `runtimeExtensions` i `runtimeSetupEntry` są preferowane,
gdy OpenClaw ładuje zainstalowany pakiet, i pozwalają pakietom npm uniknąć
kompilacji TypeScript w runtime. Jawne wpisy runtime są wymagane: `runtimeSetupEntry`
wymaga `setupEntry`, a brak artefaktów `runtimeExtensions` lub `runtimeSetupEntry`
powoduje niepowodzenie instalacji/wykrywania zamiast cichego powrotu do źródeł. Jeśli
zainstalowany pakiet deklaruje tylko wpis źródłowy TypeScript, OpenClaw użyje
pasującego zbudowanego odpowiednika `dist/*.js`, gdy taki istnieje, a następnie wróci
do źródła TypeScript.

Wszystkie ścieżki wpisów muszą pozostać wewnątrz katalogu pakietu pluginu. Wpisy runtime
i wywnioskowane zbudowane odpowiedniki JavaScript nie sprawiają, że wychodząca poza katalog
ścieżka źródłowa `extensions` lub `setupEntry` staje się prawidłowa.

<Tip>
  **Szukasz przewodnika krok po kroku?** Zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins)
  lub [Pluginy dostawców](/pl/plugins/sdk-provider-plugins), aby uzyskać szczegółowe instrukcje.
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Dla pluginów dostawców, pluginów narzędzi, pluginów hooków i wszystkiego, co **nie jest**
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

| Pole           | Typ                                                              | Wymagane | Domyślnie            |
| -------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`           | `string`                                                         | Tak      | -                   |
| `name`         | `string`                                                         | Tak      | -                   |
| `description`  | `string`                                                         | Tak      | -                   |
| `kind`         | `string`                                                         | Nie      | -                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nie      | Schemat pustego obiektu |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Tak      | -                   |

- `id` musi odpowiadać manifestowi `openclaw.plugin.json`.
- `kind` służy do slotów wyłącznych: `"memory"` lub `"context-engine"`.
- `configSchema` może być funkcją do leniwej ewaluacji.
- OpenClaw rozwiązuje i memoizuje ten schemat przy pierwszym dostępie, więc kosztowne
  konstruktory schematów uruchamiają się tylko raz.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Opakowuje `definePluginEntry` okablowaniem specyficznym dla kanału. Automatycznie wywołuje
`api.registerChannel({ plugin })`, udostępnia opcjonalny seam metadanych CLI pomocy głównej
i bramkuje `registerFull` według trybu rejestracji.

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

| Pole                  | Typ                                                              | Wymagane | Domyślnie            |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | Tak      | -                   |
| `name`                | `string`                                                         | Tak      | -                   |
| `description`         | `string`                                                         | Tak      | -                   |
| `plugin`              | `ChannelPlugin`                                                  | Tak      | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nie      | Schemat pustego obiektu |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Nie      | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Nie      | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Nie      | -                   |

- `setRuntime` jest wywoływane podczas rejestracji, aby można było przechować referencję runtime
  (zwykle przez `createPluginRuntimeStore`). Jest pomijane podczas przechwytywania metadanych CLI.
- `registerCliMetadata` działa podczas `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` oraz
  `api.registrationMode === "full"`.
  Używaj go jako kanonicznego miejsca dla należących do kanału deskryptorów CLI, aby pomoc główna
  pozostawała nieaktywująca, snapshoty wykrywania obejmowały statyczne metadane poleceń, a
  normalna rejestracja poleceń CLI pozostała zgodna z pełnymi ładowaniami pluginów.
- Rejestracja wykrywania jest nieaktywująca, ale nie wolna od importów. OpenClaw może
  ewaluować zaufany wpis pluginu i moduł pluginu kanału, aby zbudować
  snapshot, więc utrzymuj importy najwyższego poziomu bez efektów ubocznych i umieszczaj gniazda,
  klientów, workery oraz usługi za ścieżkami tylko dla `"full"`.
- `registerFull` działa tylko wtedy, gdy `api.registrationMode === "full"`. Jest pomijane
  podczas ładowania tylko konfiguracji.
- Podobnie jak `definePluginEntry`, `configSchema` może być leniwą fabryką, a OpenClaw
  memoizuje rozwiązany schemat przy pierwszym dostępie.
- W przypadku należących do pluginu głównych poleceń CLI preferuj `api.registerCli(..., { descriptors: [...] })`,
  gdy chcesz, aby polecenie pozostało leniwie ładowane bez znikania z
  głównego drzewa parsowania CLI. W przypadku pluginów kanałów preferuj rejestrowanie tych deskryptorów
  z `registerCliMetadata(...)` i utrzymuj `registerFull(...)` skoncentrowane na pracy tylko runtime.
- Jeśli `registerFull(...)` rejestruje również metody RPC Gateway, utrzymuj je pod
  prefiksem specyficznym dla pluginu. Zarezerwowane przestrzenie nazw administracji rdzenia (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) są zawsze wymuszane jako
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
[Konfiguracja i ustawienia](/pl/plugins/sdk-setup#setup-entry), aby dowiedzieć się, kiedy ma to znaczenie.

W praktyce łącz `defineSetupPluginEntry(...)` z wąskimi rodzinami pomocników konfiguracji:

- `openclaw/plugin-sdk/setup-runtime` dla bezpiecznych runtime pomocników konfiguracji, takich jak
  bezpieczne dla importu adaptery łatek konfiguracji, wyjście notatek wyszukiwania,
  `promptResolvedAllowFrom`, `splitSetupEntries` oraz delegowane proxy konfiguracji
- `openclaw/plugin-sdk/channel-setup` dla powierzchni konfiguracji instalacji opcjonalnej
- `openclaw/plugin-sdk/setup-tools` dla pomocników CLI/archiwum/dokumentacji konfiguracji/instalacji

Ciężkie SDK, rejestrację CLI i długotrwałe usługi runtime trzymaj w pełnym
wpisie.

Dołączone kanały workspace, które rozdzielają powierzchnie konfiguracji i runtime, mogą zamiast tego użyć
`defineBundledChannelSetupEntry(...)` z
`openclaw/plugin-sdk/channel-entry-contract`. Ten kontrakt pozwala
wpisowi konfiguracji zachować bezpieczne dla konfiguracji eksporty pluginu/sekretów, jednocześnie nadal udostępniając
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

Używaj tego dołączonego kontraktu tylko wtedy, gdy przepływy konfiguracji naprawdę potrzebują lekkiego settera runtime
przed załadowaniem pełnego wpisu kanału.

## Tryb rejestracji

`api.registrationMode` informuje plugin, w jaki sposób został załadowany:

| Tryb              | Kiedy                             | Co rejestrować                                                                                                          |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Normalny start gatewaya           | Wszystko                                                                                                                |
| `"discovery"`     | Wykrywanie możliwości tylko do odczytu | Rejestracja kanału plus statyczne deskryptory CLI; kod wpisu może się załadować, ale pomijaj gniazda, workery, klientów i usługi |
| `"setup-only"`    | Wyłączony/nieskonfigurowany kanał | Tylko rejestracja kanału                                                                                                |
| `"setup-runtime"` | Przepływ konfiguracji z dostępnym runtime | Rejestracja kanału plus tylko lekki runtime potrzebny przed załadowaniem pełnego wpisu                                  |
| `"cli-metadata"`  | Pomoc główna / przechwytywanie metadanych CLI | Tylko deskryptory CLI                                                                                                   |

`defineChannelPluginEntry` obsługuje ten podział automatycznie. Jeśli używasz
`definePluginEntry` bezpośrednio dla kanału, samodzielnie sprawdź tryb:

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
wpis pluginu i obiekt pluginu kanału, aby OpenClaw mógł zarejestrować
możliwości kanału oraz statyczne deskryptory CLI. Traktuj ewaluację modułu podczas wykrywania jako
zaufaną, ale lekką: bez klientów sieciowych, podprocesów, listenerów, połączeń z bazą danych,
workerów w tle, odczytów poświadczeń ani innych aktywnych efektów ubocznych runtime
na najwyższym poziomie.

Traktuj `"setup-runtime"` jako okno, w którym powierzchnie startowe tylko konfiguracji muszą
istnieć bez ponownego wchodzenia w pełny runtime dołączonego kanału. Dobrymi dopasowaniami są
rejestracja kanału, bezpieczne dla konfiguracji trasy HTTP, bezpieczne dla konfiguracji metody gatewaya oraz
delegowane pomocniki konfiguracji. Ciężkie usługi w tle, rejestratory CLI i
bootstrapy SDK dostawców/klientów nadal należą do `"full"`.

W przypadku rejestratorów CLI konkretnie:

- używaj `descriptors`, gdy rejestrator posiada jedno lub więcej głównych poleceń i chcesz,
  aby OpenClaw leniwie ładował rzeczywisty moduł CLI przy pierwszym wywołaniu
- upewnij się, że te deskryptory obejmują każdy rdzeń polecenia najwyższego poziomu udostępniany przez
  rejestrator
- ogranicz nazwy poleceń deskryptorów do liter, cyfr, dywizu i podkreślenia,
  zaczynając od litery lub cyfry; OpenClaw odrzuca nazwy deskryptorów spoza
  tego kształtu i usuwa terminalowe sekwencje sterujące z opisów przed
  renderowaniem pomocy
- używaj samego `commands` tylko dla ścieżek zgodności ładowanych zachłannie

## Kształty pluginów

OpenClaw klasyfikuje załadowane pluginy według sposobu ich rejestracji:

| Kształt               | Opis                                                        |
| --------------------- | ----------------------------------------------------------- |
| **plain-capability**  | Jeden typ możliwości (np. tylko dostawca)                   |
| **hybrid-capability** | Wiele typów możliwości (np. dostawca + mowa)                |
| **hook-only**         | Tylko hooki, bez możliwości                                 |
| **non-capability**    | Narzędzia/polecenia/usługi, ale bez możliwości              |

Użyj `openclaw plugins inspect <id>`, aby zobaczyć kształt pluginu.

## Powiązane

- [Omówienie SDK](/pl/plugins/sdk-overview) - API rejestracji i odniesienie do podścieżek
- [Pomocniki środowiska wykonawczego](/pl/plugins/sdk-runtime) - `api.runtime` i `createPluginRuntimeStore`
- [Konfiguracja i ustawienia](/pl/plugins/sdk-setup) - manifest, wpis konfiguracji, odroczone ładowanie
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) - budowanie obiektu `ChannelPlugin`
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) - rejestracja dostawcy i hooki
