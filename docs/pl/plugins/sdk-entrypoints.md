---
read_when:
    - Potrzebujesz dokładnej sygnatury typu dla definePluginEntry lub defineChannelPluginEntry
    - Chcesz zrozumieć tryb rejestracji (pełny vs setup vs metadane CLI)
    - Szukasz opcji punktu wejścia
sidebarTitle: Entry Points
summary: Dokumentacja referencyjna dla definePluginEntry, defineChannelPluginEntry i defineSetupPluginEntry
title: Punkty wejścia pluginów
x-i18n:
    generated_at: "2026-04-05T14:01:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 799dbfe71e681dd8ba929a7a631dfe745c3c5c69530126fea2f9c137b120f51f
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# Punkty wejścia pluginów

Każdy plugin eksportuje domyślny obiekt entry. SDK udostępnia trzy pomocnicze funkcje do ich tworzenia.

<Tip>
  **Szukasz przewodnika krok po kroku?** Zobacz [Pluginy kanałów](/plugins/sdk-channel-plugins)
  lub [Pluginy providerów](/plugins/sdk-provider-plugins), aby zapoznać się z instrukcjami krok po kroku.
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Dla pluginów providerów, pluginów narzędzi, pluginów hooków i wszystkiego, co **nie jest**
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
- `kind` służy do wyłącznych slotów: `"memory"` lub `"context-engine"`.
- `configSchema` może być funkcją do leniwej ewaluacji.
- OpenClaw rozwiązuje i zapamiętuje ten schemat przy pierwszym dostępie, więc kosztowne
  konstruktory schematów uruchamiają się tylko raz.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Opakowuje `definePluginEntry` logiką specyficzną dla kanałów. Automatycznie wywołuje
`api.registerChannel({ plugin })`, udostępnia opcjonalny seam metadanych CLI dla
głównej pomocy i warunkuje `registerFull` trybem rejestracji.

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

- `setRuntime` jest wywoływane podczas rejestracji, aby można było zapisać referencję runtime
  (zwykle przez `createPluginRuntimeStore`). Jest pomijane podczas przechwytywania
  metadanych CLI.
- `registerCliMetadata` działa zarówno przy `api.registrationMode === "cli-metadata"`,
  jak i `api.registrationMode === "full"`.
  Używaj go jako kanonicznego miejsca dla deskryptorów CLI należących do kanału, aby
  główna pomoc pozostawała nieaktywująca, a jednocześnie normalna rejestracja poleceń CLI
  była zgodna z pełnym ładowaniem pluginów.
- `registerFull` działa tylko wtedy, gdy `api.registrationMode === "full"`. Jest pomijane
  podczas ładowania tylko do setupu.
- Podobnie jak `definePluginEntry`, `configSchema` może być leniwą fabryką, a OpenClaw
  zapamiętuje rozwiązany schemat przy pierwszym dostępie.
- Dla należących do pluginu głównych poleceń CLI preferuj `api.registerCli(..., { descriptors: [...] })`,
  gdy chcesz, aby polecenie pozostało ładowane leniwie, ale nie znikało z
  głównego drzewa parsowania CLI. W przypadku pluginów kanałów preferuj rejestrowanie tych
  deskryptorów z poziomu `registerCliMetadata(...)`, a `registerFull(...)` pozostaw
  do pracy wyłącznie runtime.
- Jeśli `registerFull(...)` rejestruje również metody Gateway RPC, trzymaj je pod
  prefiksem specyficznym dla pluginu. Zarezerwowane główne przestrzenie nazw administratora (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) są zawsze wymuszane do
  `operator.admin`.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Dla lekkiego pliku `setup-entry.ts`. Zwraca tylko `{ plugin }` bez
logiki runtime ani CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw ładuje to zamiast pełnego entry, gdy kanał jest wyłączony,
nieskonfigurowany albo gdy włączone jest odroczone ładowanie. Zobacz
[Setup i konfiguracja](/plugins/sdk-setup#setup-entry), aby dowiedzieć się, kiedy ma to znaczenie.

W praktyce łącz `defineSetupPluginEntry(...)` z wąskimi rodzinami helperów setupu:

- `openclaw/plugin-sdk/setup-runtime` dla bezpiecznych dla runtime helperów setupu, takich jak
  bezpieczne importowo adaptery poprawek setupu, wyjście `lookup-note`,
  `promptResolvedAllowFrom`, `splitSetupEntries` i delegowane proxy setupu
- `openclaw/plugin-sdk/channel-setup` dla opcjonalnych powierzchni setupu instalacji
- `openclaw/plugin-sdk/setup-tools` dla helperów CLI/archiwów/dokumentacji setupu i instalacji

Ciężkie SDK, rejestrację CLI i długowieczne usługi runtime trzymaj w pełnym
entry.

## Tryb rejestracji

`api.registrationMode` informuje plugin, jak został załadowany:

| Tryb              | Kiedy                             | Co rejestrować                                                                            |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------- |
| `"full"`          | Normalny start Gateway            | Wszystko                                                                                  |
| `"setup-only"`    | Wyłączony/nieskonfigurowany kanał | Tylko rejestrację kanału                                                                  |
| `"setup-runtime"` | Przepływ setupu z dostępnym runtime | Rejestrację kanału oraz tylko lekki runtime potrzebny przed załadowaniem pełnego entry |
| `"cli-metadata"`  | Główna pomoc / przechwytywanie metadanych CLI | Tylko deskryptory CLI                                                         |

`defineChannelPluginEntry` obsługuje ten podział automatycznie. Jeśli używasz
`definePluginEntry` bezpośrednio dla kanału, sprawdź tryb samodzielnie:

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Ciężkie rejestracje wyłącznie runtime
  api.registerService(/* ... */);
}
```

Traktuj `"setup-runtime"` jako okno, w którym powierzchnie startowe tylko do setupu muszą
istnieć bez ponownego wchodzenia do pełnego środowiska runtime zbundlowanego kanału. Dobrze pasują tu
rejestracja kanału, bezpieczne dla setupu trasy HTTP, bezpieczne dla setupu metody Gateway oraz
delegowane helpery setupu. Ciężkie usługi działające w tle, rejestratory CLI oraz
bootstrapy SDK providerów/klientów nadal należą do `"full"`.

W szczególności dla rejestratorów CLI:

- używaj `descriptors`, gdy rejestrator posiada jedno lub więcej głównych poleceń i
  chcesz, aby OpenClaw ładował właściwy moduł CLI leniwie przy pierwszym wywołaniu
- upewnij się, że te deskryptory obejmują każdy główny korzeń polecenia udostępniany przez
  rejestrator
- używaj samego `commands` tylko dla ścieżek zgodności eager

## Kształty pluginów

OpenClaw klasyfikuje załadowane pluginy według ich zachowania rejestracyjnego:

| Kształt              | Opis                                               |
| -------------------- | -------------------------------------------------- |
| **plain-capability**  | Jeden typ możliwości (np. tylko provider)         |
| **hybrid-capability** | Wiele typów możliwości (np. provider + speech)    |
| **hook-only**         | Tylko hooki, bez możliwości                       |
| **non-capability**    | Narzędzia/polecenia/usługi, ale bez możliwości    |

Użyj `openclaw plugins inspect <id>`, aby zobaczyć kształt pluginu.

## Powiązane

- [Przegląd SDK](/plugins/sdk-overview) — API rejestracji i dokumentacja subpath
- [Helpery runtime](/plugins/sdk-runtime) — `api.runtime` i `createPluginRuntimeStore`
- [Setup i konfiguracja](/plugins/sdk-setup) — manifest, setup entry, odroczone ładowanie
- [Pluginy kanałów](/plugins/sdk-channel-plugins) — budowanie obiektu `ChannelPlugin`
- [Pluginy providerów](/plugins/sdk-provider-plugins) — rejestracja providerów i hooki
