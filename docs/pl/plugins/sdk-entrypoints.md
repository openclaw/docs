---
read_when:
    - Potrzebna jest dokładna sygnatura typu `defineToolPlugin`, `definePluginEntry` lub `defineChannelPluginEntry`
    - Chcesz zrozumieć tryb rejestracji (pełny, konfiguracji lub metadanych CLI)
    - Wyszukujesz opcje punktu wejścia
sidebarTitle: Entry Points
summary: Dokumentacja defineToolPlugin, definePluginEntry, defineChannelPluginEntry i defineSetupPluginEntry
title: Punkty wejścia Pluginu
x-i18n:
    generated_at: "2026-07-16T19:00:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8b2133dbe4ee650b27e110d472b38284d557f715829e3f0d73f8dc6c910c7c99
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Każdy plugin eksportuje domyślny obiekt punktu wejścia. SDK udostępnia funkcję pomocniczą dla
każdego kształtu punktu wejścia: `defineToolPlugin`, `definePluginEntry`,
`defineChannelPluginEntry`, `defineSetupPluginEntry`.

<Tip>
  **Potrzebny przewodnik?** Szczegółowe instrukcje zawierają strony [Pluginy narzędzi](/pl/plugins/tool-plugins),
  [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) oraz
  [Pluginy dostawców](/pl/plugins/sdk-provider-plugins).
</Tip>

## Punkty wejścia pakietu

Zainstalowane pluginy wskazują w polach `package.json` `openclaw` zarówno źródłowe, jak i
zbudowane punkty wejścia:

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

- `extensions` i `setupEntry` są źródłowymi punktami wejścia używanymi podczas programowania
  w obszarze roboczym i kopii roboczej git.
- `runtimeExtensions` i `runtimeSetupEntry` są preferowane w przypadku zainstalowanych
  pakietów: pozwalają pakietom npm pominąć kompilację TypeScript podczas działania.
- `runtimeExtensions`, jeśli występuje, musi odpowiadać `extensions` pod względem długości tablicy
  (punkty wejścia są parowane według pozycji). `runtimeSetupEntry` wymaga `setupEntry`.
- Jeśli zadeklarowano artefakt `runtimeExtensions`/`runtimeSetupEntry`, ale go
  brakuje, instalacja lub wykrywanie kończy się błędem pakowania; OpenClaw nie
  przechodzi po cichu na kod źródłowy. Przejście awaryjne na kod źródłowy (opisane niżej) ma zastosowanie tylko wtedy, gdy
  w ogóle nie zadeklarowano punktu wejścia środowiska uruchomieniowego.
- Jeśli zainstalowany pakiet deklaruje tylko źródłowy punkt wejścia TypeScript, OpenClaw
  szuka odpowiadającego mu zbudowanego pliku `dist/*.js` (lub `.mjs`/`.cjs`) i go używa;
  w przeciwnym razie przechodzi na kod źródłowy TypeScript.
- Wszystkie ścieżki punktów wejścia muszą pozostawać w katalogu pakietu pluginu. Punkty wejścia
  środowiska uruchomieniowego ani wywnioskowane zbudowane odpowiedniki JS nie sprawiają, że wychodząca poza katalog ścieżka źródłowa `extensions` lub
  `setupEntry` staje się prawidłowa.

## `defineToolPlugin`

**Import:** `openclaw/plugin-sdk/tool-plugin`

Dla pluginów, które jedynie dodają narzędzia agenta. Pozwala zachować niewielki rozmiar kodu źródłowego, wywnioskowuje typy konfiguracji
i parametrów narzędzi ze schematów TypeBox, opakowuje zwykłe wartości zwracane w
format wyniku narzędzia OpenClaw oraz udostępnia statyczne metadane, które
`openclaw plugins build` zapisuje w manifeście pluginu (`contracts.tools`,
`configSchema`).

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Notowania giełdowe",
  description: "Pobiera notowania giełdowe.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Klucz API." })),
  }),
  tools: (tool) => [
    tool({
      name: "quote",
      label: "Notowanie",
      description: "Pobiera notowanie.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Symbol giełdowy." }),
      }),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` jest opcjonalne; jego pominięcie powoduje użycie ścisłego schematu pustego obiektu
  (wygenerowany manifest nadal zawiera `configSchema`).
- `execute` zwraca zwykły ciąg znaków lub wartość możliwą do serializacji jako JSON; funkcja pomocnicza
  opakowuje ją jako tekstowy wynik narzędzia z `details` ustawionym na pierwotną
  (nieprzekształconą w ciąg znaków) wartość zwracaną.
- W przypadku niestandardowych wyników narzędzi `openclaw/plugin-sdk/tool-results` eksportuje
  `textResult` i `jsonResult`.
- Nazwy narzędzi są statyczne, dlatego `openclaw plugins build` wyprowadza
  `contracts.tools` z zadeklarowanych narzędzi bez ręcznego powielania nazw.
- Ładowanie w środowisku uruchomieniowym pozostaje ścisłe: zainstalowane pluginy nadal wymagają
  `openclaw.plugin.json` i `package.json` `openclaw.extensions`. OpenClaw
  nigdy nie wykonuje kodu pluginu w celu wywnioskowania brakujących danych manifestu.

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Dla pluginów dostawców, zaawansowanych pluginów narzędzi, pluginów hooków i wszystkiego, co
**nie jest** kanałem wiadomości.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "Mój plugin",
  description: "Krótkie podsumowanie",
  register(api) {
    api.registerProvider({/* ... */});
    api.registerTool({/* ... */});
  },
});
```

| Pole                      | Typ                                                              | Wymagane | Wartość domyślna     |
| ------------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                      | `string`                                                         | Tak      | -                   |
| `name`                    | `string`                                                         | Tak      | -                   |
| `description`             | `string`                                                         | Tak      | -                   |
| `kind`                    | `string` (przestarzałe, patrz niżej)                             | Nie      | -                   |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nie      | Schemat pustego obiektu |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | Nie      | -                   |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | Nie      | -                   |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | Nie      | -                   |
| `register`                | `(api: OpenClawPluginApi) => void`                               | Tak      | -                   |

- `id` musi odpowiadać manifestowi `openclaw.plugin.json`.
- Zewnętrzne katalogi sesji używają
  `openclaw/plugin-sdk/session-catalog` i
  `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })`.
  Rdzeń jest właścicielem metod Gateway `sessions.catalog.*`; dostawcy zwracają projekcje hosta,
  sesji i znormalizowanego transkryptu bez rejestrowania wywołań RPC.
- `kind` jest przestarzałe: zamiast tego należy zadeklarować wyłączny slot (`"memory"` lub
  `"context-engine"`) w polu `kind` manifestu `openclaw.plugin.json`.
  `kind` punktu wejścia środowiska uruchomieniowego pozostaje jedynie awaryjnym mechanizmem zgodności dla
  starszych pluginów.
- `configSchema` może być funkcją umożliwiającą leniwe obliczanie. OpenClaw rozwiązuje i
  zapamiętuje schemat przy pierwszym dostępie, dzięki czemu kosztowne konstruktory schematów są uruchamiane tylko
  raz.
- Deskryptor `nodeHostCommands` może definiować `isAvailable({ config, env })`.
  Zwrócenie `false` pomija to polecenie i jego funkcję w deklaracji Gateway
  bezinterfejsowego Node. OpenClaw oblicza tę wartość na podstawie lokalnej konfiguracji startowej
  Node; procedury obsługi poleceń nadal powinny sprawdzać dostępność podczas
  wywołania.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Opakowuje `definePluginEntry` w obsługę właściwą dla kanału: automatycznie
wywołuje `api.registerChannel({ plugin })`, udostępnia opcjonalny punkt integracji metadanych CLI
pomocy głównej oraz uzależnia `registerFull` od trybu rejestracji.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "Mój kanał",
  description: "Krótkie podsumowanie",
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

| Pole                  | Typ                                                              | Wymagane | Wartość domyślna     |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | Tak      | -                   |
| `name`                | `string`                                                         | Tak      | -                   |
| `description`         | `string`                                                         | Tak      | -                   |
| `plugin`              | `ChannelPlugin`                                                  | Tak      | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Nie      | Schemat pustego obiektu |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Nie      | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Nie      | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Nie      | -                   |

Wywołania zwrotne są wykonywane zależnie od trybu rejestracji (pełna tabela znajduje się w sekcji
[Tryb rejestracji](#registration-mode)):

- `setRuntime` jest wykonywane w każdym trybie z wyjątkiem `"cli-metadata"` i
  `"tool-discovery"`. W tym miejscu należy przechowywać odwołanie do środowiska uruchomieniowego, zwykle za pomocą
  `createPluginRuntimeStore`.
- `registerCliMetadata` jest wykonywane dla `"cli-metadata"`, `"discovery"` i
  `"full"`. Należy używać go jako kanonicznego miejsca dla należących do kanału deskryptorów CLI,
  aby pomoc główna nie aktywowała pluginu, migawki wykrywania zawierały statyczne
  metadane poleceń, a zwykła rejestracja CLI pozostawała zgodna z pełnym
  ładowaniem pluginu.
- `registerFull` jest wykonywane tylko dla `"full"` i `"tool-discovery"`. W przypadku
  `"tool-discovery"` jest wykonywane _zamiast_ rejestracji kanału: OpenClaw
  całkowicie pomija `registerChannel`/`setRuntime` i wywołuje wyłącznie
  `registerFull`, dlatego wszelkie operacje rejestracji dostawcy lub narzędzia wymagane przez kanał do
  samodzielnego wykrywania albo wykonywania narzędzi muszą znajdować się właśnie tam, a nie za zwykłą
  konfiguracją kanału.
- Rejestracja wykrywania nie aktywuje pluginu, ale nie odbywa się bez importowania: OpenClaw może
  obliczyć zaufany punkt wejścia pluginu i moduł pluginu kanału w celu zbudowania
  migawki. Importy najwyższego poziomu nie powinny powodować skutków ubocznych, a gniazda,
  klienty, procesy robocze i usługi należy umieszczać wyłącznie w ścieżkach `"full"`.
- Podobnie jak `definePluginEntry`, `configSchema` może być leniwą fabryką; OpenClaw
  zapamiętuje rozwiązany schemat przy pierwszym dostępie.

Rejestracja CLI:

- Należy używać `api.registerCli(..., { descriptors: [...] })` dla należących do pluginu głównych
  poleceń CLI, które mają być ładowane leniwie, ale nie mogą znikać z głównego drzewa
  analizy składniowej CLI. Nazwy deskryptorów muszą składać się z liter, cyfr, łączników i
  znaków podkreślenia oraz zaczynać się literą lub cyfrą; OpenClaw odrzuca inne
  formaty i usuwa terminalowe sekwencje sterujące z opisów przed
  wyświetleniem pomocy. Należy uwzględnić każdy główny korzeń polecenia udostępniany przez rejestrator.
  Samo `commands` pozostaje na zachłannie ładowanej ścieżce zgodności.
- Należy używać `api.registerNodeCliFeature(...)` dla poleceń funkcji sparowanego Node, aby
  trafiały pod `openclaw nodes` (odpowiednik
  `registerCli(registrar, { parentPath: ["nodes"], ... })`).
- W przypadku innych zagnieżdżonych poleceń pluginu należy dodać `parentPath` i zarejestrować polecenia
  w obiekcie `program` przekazanym do rejestratora; OpenClaw rozwiązuje go do
  polecenia nadrzędnego przed wywołaniem pluginu.
- W przypadku pluginów kanałów deskryptory CLI należy rejestrować z `registerCliMetadata`,
  a `registerFull` powinno koncentrować się na zadaniach dotyczących wyłącznie środowiska uruchomieniowego.
- Jeśli `registerFull` rejestruje również metody RPC Gateway, należy umieścić je pod
  prefiksem właściwym dla pluginu. Zastrzeżone przestrzenie nazw administracyjnych rdzenia (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) są zawsze wymuszane jako
  `operator.admin`.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Dla lekkiego pliku `setup-entry.ts`. Zwraca wyłącznie `{ plugin }`, bez
obsługi środowiska uruchomieniowego ani CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw ładuje ten wpis zamiast pełnego wpisu, gdy kanał jest wyłączony,
nieskonfigurowany lub gdy włączone jest odroczone ładowanie. Informacje o tym,
kiedy ma to znaczenie, zawiera sekcja [Konfiguracja i ustawienia](/pl/plugins/sdk-setup#setup-entry).

Połącz `defineSetupPluginEntry(...)` z wyspecjalizowanymi rodzinami pomocników konfiguracji:

| Import                              | Zastosowanie                                                                                                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime` | Bezpieczne dla środowiska wykonawczego pomocniki konfiguracji: `createSetupTranslator`, bezpieczne przy imporcie adaptery poprawek konfiguracji, dane wyjściowe uwag wyszukiwania, `promptResolvedAllowFrom`, `splitSetupEntries`, delegowane serwery proxy konfiguracji |
| `openclaw/plugin-sdk/channel-setup` | Powierzchnie konfiguracji opcjonalnej instalacji                                                                                                                                                    |
| `openclaw/plugin-sdk/setup-tools`   | Pomocniki CLI konfiguracji/instalacji, archiwum i dokumentacji                                                                                                                                       |

Ciężkie zestawy SDK, rejestrację CLI i długotrwałe usługi środowiska wykonawczego należy zachować w
pełnym wpisie.

Dołączone kanały obszaru roboczego, które rozdzielają powierzchnie konfiguracji i środowiska wykonawczego, mogą zamiast tego używać
`defineBundledChannelSetupEntry(...)` z
`openclaw/plugin-sdk/channel-entry-contract`. Pozwala to zachować we wpisie konfiguracji
bezpieczne dla konfiguracji eksporty pluginu/tajnych danych, a jednocześnie udostępnić metodę ustawiającą
środowisko wykonawcze:

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
        /* trasa bezpieczna dla konfiguracji */
      },
    });
  },
});
```

Należy używać tego tylko wtedy, gdy przepływ konfiguracji rzeczywiście wymaga lekkiej metody ustawiającej środowisko wykonawcze lub
bezpiecznej dla konfiguracji powierzchni Gateway przed załadowaniem pełnego wpisu kanału.
`registerSetupRuntime` uruchamia się tylko dla ładowań `"setup-runtime"`; należy ograniczyć go
do tras wyłącznie konfiguracyjnych lub metod, które muszą istnieć przed odroczoną
pełną aktywacją.

## Tryb rejestracji

`api.registrationMode` informuje plugin, w jaki sposób został załadowany:

| Tryb               | Kiedy                                               | Co rejestrować                                                                                                        |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | Normalne uruchomienie Gateway                             | Wszystko                                                                                                              |
| `"discovery"`      | Wykrywanie możliwości tylko do odczytu                     | Rejestracja kanału oraz statyczne deskryptory CLI; kod wpisu może zostać załadowany, ale należy pominąć gniazda, procesy robocze, klienty i usługi |
| `"tool-discovery"` | Ładowanie o ograniczonym zakresie w celu wyświetlenia lub uruchomienia narzędzi określonych pluginów | Tylko rejestracja możliwości/narzędzi; bez aktywacji kanału                                                                |
| `"setup-only"`     | Wyłączony/nieskonfigurowany kanał                      | Tylko rejestracja kanału                                                                                               |
| `"setup-runtime"`  | Przepływ konfiguracji z dostępnym środowiskiem wykonawczym                  | Rejestracja kanału oraz tylko lekkie środowisko wykonawcze potrzebne przed załadowaniem pełnego wpisu                               |
| `"cli-metadata"`   | Przechwytywanie głównej pomocy/metadanych CLI                   | Tylko deskryptory CLI                                                                                                    |

`defineChannelPluginEntry` automatycznie obsługuje ten podział. Jeśli dla kanału używane jest
bezpośrednio `definePluginEntry`, należy samodzielnie sprawdzić tryb i pamiętać, że
`"tool-discovery"` pomija rejestrację kanału:

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

  if (api.registrationMode === "tool-discovery") {
    // Rejestruj tylko powierzchnie możliwości (dostawców/narzędzia), bez kanału.
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Ciężkie rejestracje przeznaczone wyłącznie dla środowiska wykonawczego
  api.registerService(/* ... */);
}
```

Długotrwałe usługi mogą emitować niewielkie zdarzenia unieważnienia lub cyklu życia za pośrednictwem
kontekstu usługi:

```typescript
api.registerService({
  id: "index-events",
  start(ctx) {
    ctx.gatewayEvents?.emit("changed", { revision: 1 }, { scope: "operator.read" });
  },
});
```

OpenClaw dodaje do tego przestrzeń nazw jako `plugin.<plugin-id>.changed`. Nazwy zdarzeń składają się z jednego
segmentu zapisanego małymi literami, ładunki muszą być ograniczonymi danymi JSON, a zakres musi mieć wartość
`operator.read`, `operator.write` lub `operator.admin`. Emiter istnieje tylko
przez okres działania usługi i jest unieważniany po jej zatrzymaniu lub nieudanym uruchomieniu. Zamiast
pełnych rekordów należy preferować ładunki wersji lub unieważnienia, aby autoryzowani klienci ponownie odczytywali
stan kanoniczny za pośrednictwem metod Gateway pluginu o ograniczonym zakresie.

Tryb wykrywania tworzy nieaktywujący zrzut rejestru. Może on nadal
wykonywać wpis pluginu i obiekt pluginu kanału, aby OpenClaw mógł
zarejestrować możliwości kanału oraz statyczne deskryptory CLI. Ewaluację modułu
podczas wykrywania należy traktować jako zaufaną, lecz lekką: bez klientów sieciowych,
podprocesów, procesów nasłuchujących, połączeń z bazą danych, procesów roboczych działających w tle,
odczytywania poświadczeń ani innych aktywnych efektów ubocznych środowiska wykonawczego na najwyższym poziomie.

`"setup-runtime"` należy traktować jako przedział, w którym powierzchnie uruchamiania przeznaczone tylko do konfiguracji muszą
istnieć bez ponownego wchodzenia do pełnego środowiska wykonawczego dołączonego kanału. Odpowiednie zastosowania obejmują
rejestrację kanału, bezpieczne dla konfiguracji trasy HTTP, bezpieczne dla konfiguracji metody Gateway
oraz delegowane pomocniki konfiguracji. Ciężkie usługi działające w tle, rejestratory CLI oraz
inicjalizacja zestawów SDK dostawców/klientów nadal należą do `"full"`.

## Formy pluginów

OpenClaw klasyfikuje załadowane pluginy według ich zachowania podczas rejestracji:

| Forma                 | Opis                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Jeden typ możliwości (np. tylko dostawca)           |
| **hybrid-capability** | Wiele typów możliwości (np. dostawca + mowa) |
| **hook-only**         | Tylko hooki, bez możliwości                        |
| **non-capability**    | Narzędzia/polecenia/usługi, ale bez możliwości        |

Aby sprawdzić formę pluginu, należy użyć `openclaw plugins inspect <id>`.

## Powiązane materiały

- [Omówienie SDK](/pl/plugins/sdk-overview) — interfejs API rejestracji i dokumentacja ścieżek podrzędnych
- [Pomocniki środowiska wykonawczego](/pl/plugins/sdk-runtime) — `api.runtime` i `createPluginRuntimeStore`
- [Konfiguracja i ustawienia](/pl/plugins/sdk-setup) — manifest, wpis konfiguracji, odroczone ładowanie
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — tworzenie obiektu `ChannelPlugin`
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) — rejestracja dostawcy i hooki
