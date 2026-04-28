---
read_when:
    - Musisz wiedzieć, z której podścieżki SDK importować.
    - Potrzebujesz odniesienia do wszystkich metod rejestracji w `OpenClawPluginApi`
    - Szukasz konkretnego eksportu SDK
sidebarTitle: SDK overview
summary: Mapa importów, dokumentacja API rejestracji i architektura SDK
title: Przegląd Plugin SDK
x-i18n:
    generated_at: "2026-04-25T13:54:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 825efe8d9b2283734730348f9803e40cabaaa6399993648f4bb5822b20e588ee
    source_path: plugins/sdk-overview.md
    workflow: 15
---

SDK Plugin to typowany kontrakt między pluginami a rdzeniem. Ta strona to
materiał referencyjny dotyczący **tego, co importować** i **co można rejestrować**.

<Tip>
  Szukasz zamiast tego przewodnika krok po kroku?

- Pierwszy plugin? Zacznij od [Building plugins](/pl/plugins/building-plugins).
- Plugin kanału? Zobacz [Channel plugins](/pl/plugins/sdk-channel-plugins).
- Plugin dostawcy? Zobacz [Provider plugins](/pl/plugins/sdk-provider-plugins).
- Plugin narzędzia lub hooka cyklu życia? Zobacz [Plugin hooks](/pl/plugins/hooks).

</Tip>

## Konwencja importu

Zawsze importuj z określonej podścieżki:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Każda podścieżka jest małym, samodzielnym modułem. Dzięki temu uruchamianie jest szybkie
i zapobiega to problemom z zależnościami cyklicznymi. W przypadku pomocników wpisu/budowania specyficznych dla kanału
preferuj `openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core` zachowaj dla
szerszej powierzchni zbiorczej i współdzielonych pomocników, takich jak
`buildChannelConfigSchema`.

W przypadku konfiguracji kanału publikuj należący do kanału schemat JSON Schema przez
`openclaw.plugin.json#channelConfigs`. Podścieżka `plugin-sdk/channel-config-schema`
jest przeznaczona dla współdzielonych prymitywów schematu i ogólnego buildera. Wszelkie
eksporty schematów nazwane od wbudowanych kanałów na tej podścieżce to eksporty
zgodnościowe starszego typu, a nie wzorzec dla nowych pluginów.

<Warning>
  Nie importuj seams wygodowych oznaczonych marką dostawcy lub kanału (na przykład
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Wbudowane pluginy składają ogólne podścieżki SDK we własnych barrelach `api.ts` /
  `runtime-api.ts`; konsumenci rdzenia powinni albo używać tych lokalnych dla pluginu
  barreli, albo dodać wąski ogólny kontrakt SDK, gdy potrzeba jest rzeczywiście
  międzykanałowa.

Niewielki zestaw helper seams dla wbudowanych pluginów (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` i podobne) nadal pojawia się w
wygenerowanej mapie eksportów. Istnieją one wyłącznie na potrzeby utrzymania wbudowanych pluginów i
nie są zalecanymi ścieżkami importu dla nowych pluginów zewnętrznych.
</Warning>

## Dokumentacja podścieżek

SDK Plugin jest udostępniane jako zestaw wąskich podścieżek pogrupowanych według obszaru (wpis
pluginu, kanał, dostawca, auth, runtime, capability, pamięć i zastrzeżone
helpery dla wbudowanych pluginów). Pełny katalog — pogrupowany i podlinkowany — znajdziesz w
[Plugin SDK subpaths](/pl/plugins/sdk-subpaths).

Wygenerowana lista ponad 200 podścieżek znajduje się w `scripts/lib/plugin-sdk-entrypoints.json`.

## API rejestracji

Callback `register(api)` otrzymuje obiekt `OpenClawPluginApi` z następującymi
metodami:

### Rejestracja capability

| Metoda                                           | Co rejestruje                         |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferencję tekstu (LLM)               |
| `api.registerAgentHarness(...)`                  | Eksperymentalny niskopoziomowy wykonawca agenta |
| `api.registerCliBackend(...)`                    | Lokalny backend inferencji CLI        |
| `api.registerChannel(...)`                       | Kanał komunikacyjny                   |
| `api.registerSpeechProvider(...)`                | Syntezę text-to-speech / STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Strumieniową transkrypcję realtime    |
| `api.registerRealtimeVoiceProvider(...)`         | Dwukierunkowe sesje głosowe realtime  |
| `api.registerMediaUnderstandingProvider(...)`    | Analizę obrazu/audio/wideo            |
| `api.registerImageGenerationProvider(...)`       | Generowanie obrazów                   |
| `api.registerMusicGenerationProvider(...)`       | Generowanie muzyki                    |
| `api.registerVideoGenerationProvider(...)`       | Generowanie wideo                     |
| `api.registerWebFetchProvider(...)`              | Dostawcę pobierania / scrapingu WWW   |
| `api.registerWebSearchProvider(...)`             | Wyszukiwanie w sieci                  |

### Narzędzia i polecenia

| Metoda                          | Co rejestruje                                 |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Narzędzie agenta (wymagane lub `{ optional: true }`) |
| `api.registerCommand(def)`      | Polecenie niestandardowe (omija LLM)          |

### Infrastruktura

| Metoda                                         | Co rejestruje                           |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook zdarzeń                            |
| `api.registerHttpRoute(params)`                | Punkt końcowy HTTP Gateway              |
| `api.registerGatewayMethod(name, handler)`     | Metodę RPC Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | Reklamowanie lokalnego wykrywania Gateway |
| `api.registerCli(registrar, opts?)`            | Podpolecenie CLI                        |
| `api.registerService(service)`                 | Usługę działającą w tle                 |
| `api.registerInteractiveHandler(registration)` | Handler interaktywny                    |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware wyniku narzędzia runtime     |
| `api.registerMemoryPromptSupplement(builder)`  | Dodatkową sekcję promptu powiązaną z pamięcią |
| `api.registerMemoryCorpusSupplement(adapter)`  | Dodatkowy korpus wyszukiwania/odczytu pamięci |

<Note>
  Zastrzeżone przestrzenie nazw administracyjnych rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) zawsze pozostają `operator.admin`, nawet jeśli plugin próbuje przypisać
  węższy zakres metody Gateway. Preferuj prefiksy specyficzne dla pluginu dla
  metod należących do pluginu.
</Note>

<Accordion title="Kiedy używać middleware wyniku narzędzia">
  Wbudowane pluginy mogą używać `api.registerAgentToolResultMiddleware(...)`, gdy
  muszą przepisać wynik narzędzia po wykonaniu i zanim runtime
  przekaże ten wynik z powrotem do modelu. To zaufany, neutralny względem runtime
  seam dla asynchronicznych reduktorów wyjścia, takich jak tokenjuice.

Wbudowane pluginy muszą deklarować `contracts.agentToolResultMiddleware` dla każdego
docelowego runtime, na przykład `["pi", "codex"]`. Zewnętrzne pluginy
nie mogą rejestrować tego middleware; w przypadku prac,
które nie wymagają synchronizacji wyniku narzędzia przed modelem, pozostań przy zwykłych hookach pluginów OpenClaw. Stara ścieżka rejestracji
osadzonej fabryki rozszerzeń tylko dla Pi została usunięta.
</Accordion>

### Rejestracja wykrywania Gateway

`api.registerGatewayDiscoveryService(...)` pozwala pluginowi reklamować aktywny
Gateway w lokalnym mechanizmie wykrywania, takim jak mDNS/Bonjour. OpenClaw wywołuje tę
usługę podczas uruchamiania Gateway, gdy lokalne wykrywanie jest włączone, przekazuje
bieżące porty Gateway i niejawne dane wskazówek TXT oraz wywołuje zwrócony
handler `stop` podczas zamykania Gateway.

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Pluginy wykrywania Gateway nie mogą traktować reklamowanych wartości TXT jako sekretów ani
uwierzytelniania. Wykrywanie jest wskazówką routingu; zaufaniem nadal zarządzają auth Gateway i pinning TLS.

### Metadane rejestracji CLI

`api.registerCli(registrar, opts?)` akceptuje dwa rodzaje metadanych najwyższego poziomu:

- `commands`: jawne korzenie poleceń należące do registrar
- `descriptors`: deskryptory poleceń używane podczas parsowania dla pomocy głównego CLI,
  routingu i leniwej rejestracji CLI pluginu

Jeśli chcesz, aby polecenie pluginu pozostało ładowane leniwie w normalnej ścieżce głównego CLI,
podaj `descriptors`, które obejmują każdy korzeń polecenia najwyższego poziomu udostępniany przez ten
registrar.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Zarządzaj kontami Matrix, weryfikacją, urządzeniami i stanem profilu",
        hasSubcommands: true,
      },
    ],
  },
);
```

Używaj samego `commands` tylko wtedy, gdy nie potrzebujesz leniwej rejestracji głównego CLI.
Ta ścieżka zgodności eager nadal jest obsługiwana, ale nie instaluje
placeholderów opartych na deskryptorach dla leniwego ładowania podczas parsowania.

### Rejestracja backendu CLI

`api.registerCliBackend(...)` pozwala pluginowi zarządzać domyślną konfiguracją lokalnego
backendu CLI AI, takiego jak `codex-cli`.

- `id` backendu staje się prefiksem dostawcy w odwołaniach do modeli, takich jak `codex-cli/gpt-5`.
- `config` backendu używa tego samego kształtu co `agents.defaults.cliBackends.<id>`.
- Konfiguracja użytkownika nadal ma pierwszeństwo. OpenClaw scala `agents.defaults.cliBackends.<id>` z domyślną konfiguracją
  pluginu przed uruchomieniem CLI.
- Używaj `normalizeConfig`, gdy backend wymaga przepisania zgodności po scaleniu
  (na przykład normalizacji starych formatów flag).

### Sloty wyłączne

| Metoda                                     | Co rejestruje                                                                                                                                         |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Silnik kontekstu (aktywny może być tylko jeden naraz). Callback `assemble()` otrzymuje `availableTools` i `citationsMode`, aby silnik mógł dostosować dodatki do promptu. |
| `api.registerMemoryCapability(capability)` | Ujednoliconą capability pamięci                                                                                                                       |
| `api.registerMemoryPromptSection(builder)` | Builder sekcji promptu pamięci                                                                                                                        |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver planu opróżniania pamięci                                                                                                                    |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime pamięci                                                                                                                               |

### Adaptery osadzania pamięci

| Metoda                                         | Co rejestruje                               |
| ---------------------------------------------- | ------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter osadzania pamięci dla aktywnego pluginu |

- `registerMemoryCapability` to preferowane wyłączne API pluginu pamięci.
- `registerMemoryCapability` może także udostępniać `publicArtifacts.listArtifacts(...)`,
  aby pluginy towarzyszące mogły używać eksportowanych artefaktów pamięci przez
  `openclaw/plugin-sdk/memory-host-core` zamiast sięgać do prywatnego układu
  konkretnego pluginu pamięci.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` i
  `registerMemoryRuntime` to zgodnościowe starszego typu wyłączne API pluginu pamięci.
- `registerMemoryEmbeddingProvider` pozwala aktywnemu pluginowi pamięci rejestrować jeden
  lub więcej identyfikatorów adapterów osadzania (na przykład `openai`, `gemini` lub niestandardowy
  identyfikator zdefiniowany przez plugin).
- Konfiguracja użytkownika, taka jak `agents.defaults.memorySearch.provider` i
  `agents.defaults.memorySearch.fallback`, jest rozwiązywana względem tych zarejestrowanych
  identyfikatorów adapterów.

### Zdarzenia i cykl życia

| Metoda                                       | Co robi                     |
| -------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`           | Typowany hook cyklu życia   |
| `api.onConversationBindingResolved(handler)` | Callback powiązania konwersacji |

Przykłady, typowe nazwy hooków i semantykę guard znajdziesz w [Plugin hooks](/pl/plugins/hooks).

### Semantyka decyzji hooka

- `before_tool_call`: zwrócenie `{ block: true }` jest rozstrzygające. Gdy dowolny handler je ustawi, handlery o niższym priorytecie są pomijane.
- `before_tool_call`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `before_install`: zwrócenie `{ block: true }` jest rozstrzygające. Gdy dowolny handler je ustawi, handlery o niższym priorytecie są pomijane.
- `before_install`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `reply_dispatch`: zwrócenie `{ handled: true, ... }` jest rozstrzygające. Gdy dowolny handler przejmie wysyłkę, handlery o niższym priorytecie oraz domyślna ścieżka wysyłki modelu są pomijane.
- `message_sending`: zwrócenie `{ cancel: true }` jest rozstrzygające. Gdy dowolny handler je ustawi, handlery o niższym priorytecie są pomijane.
- `message_sending`: zwrócenie `{ cancel: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `cancel`), a nie jako nadpisanie.
- `message_received`: używaj typowanego pola `threadId`, gdy potrzebujesz routingu przychodzącego wątku/tematu. `metadata` zachowaj dla dodatków specyficznych dla kanału.
- `message_sending`: używaj typowanych pól routingu `replyToId` / `threadId`, zanim sięgniesz po specyficzne dla kanału `metadata`.
- `gateway_start`: używaj `ctx.config`, `ctx.workspaceDir` i `ctx.getCron?.()` dla stanu uruchamiania należącego do Gateway zamiast polegać na wewnętrznych hookach `gateway:startup`.

### Pola obiektu API

| Pole                     | Typ                       | Opis                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identyfikator pluginu                                                                       |
| `api.name`               | `string`                  | Nazwa wyświetlana                                                                           |
| `api.version`            | `string?`                 | Wersja pluginu (opcjonalnie)                                                                |
| `api.description`        | `string?`                 | Opis pluginu (opcjonalnie)                                                                  |
| `api.source`             | `string`                  | Ścieżka źródłowa pluginu                                                                    |
| `api.rootDir`            | `string?`                 | Katalog główny pluginu (opcjonalnie)                                                        |
| `api.config`             | `OpenClawConfig`          | Bieżąca migawka konfiguracji (aktywna migawka runtime w pamięci, gdy jest dostępna)        |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfiguracja specyficzna dla pluginu z `plugins.entries.<id>.config`                        |
| `api.runtime`            | `PluginRuntime`           | [Helpery runtime](/pl/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger o zawężonym zakresie (`debug`, `info`, `warn`, `error`)                             |
| `api.registrationMode`   | `PluginRegistrationMode`  | Bieżący tryb ładowania; `"setup-runtime"` to lekkie okno uruchamiania/konfiguracji przed pełnym wpisem |
| `api.resolvePath(input)` | `(string) => string`      | Rozwiązuje ścieżkę względem katalogu głównego pluginu                                       |

## Konwencja modułów wewnętrznych

W obrębie swojego pluginu używaj lokalnych plików barrel do importów wewnętrznych:

```
my-plugin/
  api.ts            # Publiczne eksporty dla zewnętrznych konsumentów
  runtime-api.ts    # Eksporty runtime tylko do użytku wewnętrznego
  index.ts          # Punkt wejścia pluginu
  setup-entry.ts    # Lekki wpis tylko do konfiguracji/uruchamiania (opcjonalnie)
```

<Warning>
  Nigdy nie importuj własnego pluginu przez `openclaw/plugin-sdk/<your-plugin>`
  z kodu produkcyjnego. Kieruj importy wewnętrzne przez `./api.ts` lub
  `./runtime-api.ts`. Ścieżka SDK jest wyłącznie kontraktem zewnętrznym.
</Warning>

Publiczne powierzchnie wbudowanych pluginów ładowane przez fasadę (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` i podobne publiczne pliki wejściowe) preferują
aktywną migawkę konfiguracji runtime, gdy OpenClaw jest już uruchomiony. Jeśli nie istnieje jeszcze
migawka runtime, wracają do konfiguracji rozwiązanej z pliku na dysku.

Pluginy dostawców mogą udostępniać wąski, lokalny dla pluginu barrel kontraktu, gdy
helper jest celowo specyficzny dla dostawcy i nie należy jeszcze do ogólnej podścieżki SDK.
Wbudowane przykłady:

- **Anthropic**: publiczny seam `api.ts` / `contract-api.ts` dla helperów strumieniowania
  nagłówka beta Claude i `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` eksportuje buildery dostawcy,
  helpery modeli domyślnych oraz buildery dostawców realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` eksportuje builder dostawcy
  oraz helpery onboardingu/konfiguracji.

<Warning>
  Kod produkcyjny rozszerzeń powinien również unikać importów `openclaw/plugin-sdk/<other-plugin>`.
  Jeśli helper jest rzeczywiście współdzielony, przenieś go do neutralnej podścieżki SDK,
  takiej jak `openclaw/plugin-sdk/speech`, `.../provider-model-shared` lub innej
  powierzchni zorientowanej na capability, zamiast łączyć ze sobą dwa pluginy.
</Warning>

## Powiązane

<CardGroup cols={2}>
  <Card title="Punkty wejścia" icon="door-open" href="/pl/plugins/sdk-entrypoints">
    Opcje `definePluginEntry` i `defineChannelPluginEntry`.
  </Card>
  <Card title="Helpery runtime" icon="gears" href="/pl/plugins/sdk-runtime">
    Pełna dokumentacja przestrzeni nazw `api.runtime`.
  </Card>
  <Card title="Konfiguracja i setup" icon="sliders" href="/pl/plugins/sdk-setup">
    Pakowanie, manifesty i schematy konfiguracji.
  </Card>
  <Card title="Testowanie" icon="vial" href="/pl/plugins/sdk-testing">
    Narzędzia testowe i reguły lint.
  </Card>
  <Card title="Migracja SDK" icon="arrows-turn-right" href="/pl/plugins/sdk-migration">
    Migracja z przestarzałych powierzchni.
  </Card>
  <Card title="Wnętrze pluginów" icon="diagram-project" href="/pl/plugins/architecture">
    Szczegółowa architektura i model capability.
  </Card>
</CardGroup>
