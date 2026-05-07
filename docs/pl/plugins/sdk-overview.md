---
read_when:
    - Musisz wiedzieć, z której podścieżki SDK importować
    - Potrzebujesz dokumentacji referencyjnej wszystkich metod rejestracji w OpenClawPluginApi
    - Wyszukujesz konkretny eksport SDK
sidebarTitle: Plugin SDK overview
summary: Mapa importów, dokumentacja referencyjna API rejestracji i architektura SDK
title: Przegląd Plugin SDK
x-i18n:
    generated_at: "2026-05-07T13:23:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce2d4480368a11f559da7c5116d51c0cd603dd38985ca744723ecdf134fa21f3
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK pluginów jest typowanym kontraktem między pluginami a rdzeniem. Ta strona jest
dokumentacją referencyjną dotyczącą **tego, co importować** i **tego, co można rejestrować**.

<Note>
  Ta strona jest przeznaczona dla autorów pluginów używających `openclaw/plugin-sdk/*` wewnątrz
  OpenClaw. W przypadku zewnętrznych aplikacji, skryptów, pulpitów, zadań CI i rozszerzeń IDE,
  które chcą uruchamiać agentów przez Gateway, użyj zamiast tego
  [OpenClaw App SDK](/pl/concepts/openclaw-sdk) oraz pakietu `@openclaw/sdk`.
</Note>

<Tip>
Szukasz raczej przewodnika krok po kroku? Zacznij od [Tworzenia pluginów](/pl/plugins/building-plugins), użyj [Pluginów kanałów](/pl/plugins/sdk-channel-plugins) dla pluginów kanałów, [Pluginów providerów](/pl/plugins/sdk-provider-plugins) dla pluginów providerów, [Pluginów backendu CLI](/pl/plugins/cli-backend-plugins) dla lokalnych backendów AI CLI oraz [Hooków pluginów](/pl/plugins/hooks) dla pluginów hooków narzędzi lub cyklu życia.
</Tip>

## Konwencja importu

Zawsze importuj z konkretnej podścieżki:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Każda podścieżka jest małym, samodzielnym modułem. Dzięki temu start jest szybki i
unika się problemów z zależnościami cyklicznymi. Dla helperów wejścia/budowania specyficznych dla kanału
preferuj `openclaw/plugin-sdk/channel-core`; zachowaj `openclaw/plugin-sdk/core` dla
szerszej powierzchni parasolowej i współdzielonych helperów, takich jak
`buildChannelConfigSchema`.

W przypadku konfiguracji kanału opublikuj JSON Schema należący do kanału przez
`openclaw.plugin.json#channelConfigs`. Podścieżka `plugin-sdk/channel-config-schema`
jest przeznaczona dla współdzielonych prymitywów schematów i generycznego buildera. Bundlowane
pluginy OpenClaw używają `plugin-sdk/bundled-channel-config-schema` dla zachowanych
schematów bundlowanych kanałów. Przestarzałe eksporty zgodności pozostają w
`plugin-sdk/channel-config-schema-legacy`; żadna z podścieżek schematów bundlowanych nie jest
wzorem dla nowych pluginów.

<Warning>
  Nie importuj wygodnych seamów brandowanych providerem lub kanałem (na przykład
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Bundlowane pluginy komponują generyczne podścieżki SDK wewnątrz własnych barrelów `api.ts` /
  `runtime-api.ts`; konsumenci rdzenia powinni albo używać tych lokalnych dla pluginu
  barrelów, albo dodać wąski generyczny kontrakt SDK, gdy potrzeba jest naprawdę
  międzykanałowa.

Mały zestaw seamów helperów bundlowanych pluginów nadal pojawia się w wygenerowanej mapie eksportów,
gdy mają śledzone użycie właściciela. Istnieją wyłącznie do utrzymania bundlowanych pluginów
i nie są zalecanymi ścieżkami importu dla nowych pluginów zewnętrznych.

`openclaw/plugin-sdk/discord` i `openclaw/plugin-sdk/telegram-account` są
również utrzymywane jako przestarzałe fasady zgodności dla śledzonego użycia właściciela. Nie
kopiuj tych ścieżek importu do nowych pluginów; zamiast tego używaj wstrzykiwanych helperów runtime i
generycznych podścieżek SDK kanałów.
</Warning>

## Dokumentacja podścieżek

SDK pluginów jest udostępniany jako zestaw wąskich podścieżek pogrupowanych według obszaru (wejście
pluginu, kanał, provider, uwierzytelnianie, runtime, capability, pamięć oraz zarezerwowane
helpery bundlowanych pluginów). Pełny katalog, pogrupowany i podlinkowany, znajdziesz w
[Podścieżkach SDK pluginów](/pl/plugins/sdk-subpaths).

Wygenerowana lista ponad 200 podścieżek znajduje się w `scripts/lib/plugin-sdk-entrypoints.json`.

## API rejestracji

Callback `register(api)` otrzymuje obiekt `OpenClawPluginApi` z tymi
metodami:

### Rejestracja capability

| Metoda                                           | Co rejestruje                          |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Inferencja tekstowa (LLM)              |
| `api.registerAgentHarness(...)`                  | Eksperymentalny niskopoziomowy executor agenta |
| `api.registerCliBackend(...)`                    | Lokalny backend inferencji CLI         |
| `api.registerChannel(...)`                       | Kanał wiadomości                       |
| `api.registerSpeechProvider(...)`                | Synteza text-to-speech / STT           |
| `api.registerRealtimeTranscriptionProvider(...)` | Strumieniowa transkrypcja w czasie rzeczywistym |
| `api.registerRealtimeVoiceProvider(...)`         | Dupleksowe sesje głosowe w czasie rzeczywistym |
| `api.registerMediaUnderstandingProvider(...)`    | Analiza obrazów/dźwięku/wideo          |
| `api.registerImageGenerationProvider(...)`       | Generowanie obrazów                    |
| `api.registerMusicGenerationProvider(...)`       | Generowanie muzyki                     |
| `api.registerVideoGenerationProvider(...)`       | Generowanie wideo                      |
| `api.registerWebFetchProvider(...)`              | Provider pobierania / scrapowania WWW  |
| `api.registerWebSearchProvider(...)`             | Wyszukiwanie w sieci                   |

### Narzędzia i polecenia

| Metoda                         | Co rejestruje                                |
| ------------------------------ | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Narzędzie agenta (wymagane albo `{ optional: true }`) |
| `api.registerCommand(def)`      | Niestandardowe polecenie (omija LLM)         |

Polecenia pluginów mogą ustawić `agentPromptGuidance`, gdy agent potrzebuje krótkiej,
należącej do polecenia wskazówki routingu. Zachowaj ten tekst na temat samego polecenia; nie dodawaj
polityki specyficznej dla providera lub pluginu do builderów promptów rdzenia.

### Infrastruktura

| Metoda                                         | Co rejestruje                          |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook zdarzenia                         |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway                  |
| `api.registerGatewayMethod(name, handler)`     | Metoda RPC Gateway                     |
| `api.registerGatewayDiscoveryService(service)` | Lokalny advertiser wykrywania Gateway  |
| `api.registerCli(registrar, opts?)`            | Podpolecenie CLI                       |
| `api.registerNodeCliFeature(registrar, opts?)` | Funkcja CLI Node pod `openclaw nodes`   |
| `api.registerService(service)`                 | Usługa w tle                           |
| `api.registerInteractiveHandler(registration)` | Handler interaktywny                   |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware runtime dla wyników narzędzi |
| `api.registerMemoryPromptSupplement(builder)`  | Addytywna sekcja promptu sąsiadująca z pamięcią |
| `api.registerMemoryCorpusSupplement(adapter)`  | Addytywny korpus wyszukiwania/odczytu pamięci |

### Hooki hosta dla pluginów workflow

Hooki hosta to seamy SDK dla pluginów, które muszą uczestniczyć w cyklu życia hosta,
a nie tylko dodawać providera, kanał lub narzędzie. Są to kontrakty
generyczne; Plan Mode może ich używać, ale tak samo workflow zatwierdzania,
bramki polityki workspace, monitory w tle, kreatory konfiguracji i towarzyszące pluginy UI.

| Metoda                                                                   | Kontrakt, który posiada                                                                                                             |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Należący do pluginu, zgodny z JSON stan sesji projektowany przez sesje Gateway                                                       |
| `api.enqueueNextTurnInjection(...)`                                      | Trwały kontekst dokładnie raz wstrzykiwany do następnej tury agenta dla jednej sesji                                                 |
| `api.registerTrustedToolPolicy(...)`                                     | Bundlowana/zaufana polityka narzędzi przed pluginem, która może blokować lub przepisywać parametry narzędzia                        |
| `api.registerToolMetadata(...)`                                          | Metadane wyświetlania katalogu narzędzi bez zmiany implementacji narzędzia                                                          |
| `api.registerCommand(...)`                                               | Zakresowe polecenia pluginów; wyniki poleceń mogą ustawiać `continueAgent: true`; natywne polecenia Discord obsługują `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Deskryptory wkładu Control UI dla powierzchni sesji, narzędzia, uruchomienia lub ustawień                                           |
| `api.registerRuntimeLifecycle(...)`                                      | Callbacki czyszczenia należących do pluginu zasobów runtime na ścieżkach reset/delete/reload                                        |
| `api.registerAgentEventSubscription(...)`                                | Oczyszczone subskrypcje zdarzeń dla stanu workflow i monitorów                                                                      |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Tymczasowy stan pluginu per uruchomienie, czyszczony przy terminalnym cyklu życia uruchomienia                                      |
| `api.registerSessionSchedulerJob(...)`                                   | Należące do pluginu rekordy zadań harmonogramu sesji z deterministycznym czyszczeniem                                               |

Kontrakty celowo rozdzielają uprawnienia:

- Zewnętrzne pluginy mogą posiadać rozszerzenia sesji, deskryptory UI, polecenia, metadane
  narzędzi, wstrzyknięcia następnej tury i zwykłe hooki.
- Zaufane polityki narzędzi działają przed zwykłymi hookami `before_tool_call` i są
  wyłącznie bundlowane, ponieważ uczestniczą w polityce bezpieczeństwa hosta.
- Zarezerwowana własność poleceń jest wyłącznie bundlowana. Zewnętrzne pluginy powinny używać
  własnych nazw poleceń lub aliasów.
- `allowPromptInjection=false` wyłącza hooki mutujące prompt, w tym
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  pola promptów ze starszego `before_agent_start` oraz
  `enqueueNextTurnInjection`.

Przykłady konsumentów spoza Plan:

| Archetyp pluginu              | Używane hooki                                                                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Workflow zatwierdzania        | Rozszerzenie sesji, kontynuacja polecenia, wstrzyknięcie następnej tury, deskryptor UI                                              |
| Bramka polityki budżetu/workspace | Zaufana polityka narzędzi, metadane narzędzi, projekcja sesji                                                                    |
| Monitor cyklu życia w tle     | Czyszczenie cyklu życia runtime, subskrypcja zdarzeń agenta, własność/czyszczenie harmonogramu sesji, wkład promptu Heartbeat, deskryptor UI |
| Kreator konfiguracji lub onboardingu | Rozszerzenie sesji, zakresowe polecenia, deskryptor Control UI                                                                 |

<Note>
  Zarezerwowane przestrzenie nazw administracji rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) zawsze pozostają `operator.admin`, nawet jeśli plugin próbuje przypisać
  węższy zakres metody gateway. Preferuj prefiksy specyficzne dla pluginu dla
  metod należących do pluginu.
</Note>

<Accordion title="When to use tool-result middleware">
  Bundlowane pluginy mogą używać `api.registerAgentToolResultMiddleware(...)`, gdy
  muszą przepisać wynik narzędzia po wykonaniu i zanim runtime
  przekaże ten wynik z powrotem do modelu. To zaufany, neutralny wobec runtime
  seam dla asynchronicznych reduktorów wyjścia, takich jak tokenjuice.

Dołączone pluginy muszą deklarować `contracts.agentToolResultMiddleware` dla każdego
docelowego środowiska uruchomieniowego, na przykład `["pi", "codex"]`. Zewnętrzne pluginy
nie mogą rejestrować tego middleware; zachowaj zwykłe hooki pluginów OpenClaw dla pracy,
która nie wymaga synchronizacji wyników narzędzi przed modelem. Stara ścieżka rejestracji
fabryki osadzonego rozszerzenia tylko dla Pi została usunięta.
</Accordion>

### Rejestracja wykrywania Gateway

`api.registerGatewayDiscoveryService(...)` pozwala pluginowi ogłaszać aktywny
Gateway w lokalnym transporcie wykrywania, takim jak mDNS/Bonjour. OpenClaw wywołuje
usługę podczas uruchamiania Gateway, gdy lokalne wykrywanie jest włączone, przekazuje
bieżące porty Gateway i nietajne dane podpowiedzi TXT oraz wywołuje zwrócony
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

Pluginy wykrywania Gateway nie mogą traktować ogłaszanych wartości TXT jako sekretów ani
uwierzytelniania. Wykrywanie jest podpowiedzią routingu; uwierzytelnianie Gateway i przypinanie TLS
nadal odpowiadają za zaufanie.

### Metadane rejestracji CLI

`api.registerCli(registrar, opts?)` akceptuje dwa rodzaje metadanych poleceń:

- `commands`: jawne nazwy poleceń należące do rejestratora
- `descriptors`: deskryptory poleceń z czasu parsowania używane przez pomoc CLI,
  routing i leniwą rejestrację CLI pluginu
- `parentPath`: opcjonalna ścieżka polecenia nadrzędnego dla zagnieżdżonych grup poleceń, taka jak
  `["nodes"]`

Dla funkcji sparowanych węzłów preferuj
`api.registerNodeCliFeature(registrar, opts?)`. To mały wrapper wokół
`api.registerCli(..., { parentPath: ["nodes"] })`, który sprawia, że polecenia takie jak
`openclaw nodes canvas` są jawnymi funkcjami węzłów należącymi do pluginu.

Jeśli chcesz, aby polecenie pluginu pozostało ładowane leniwie w normalnej głównej ścieżce CLI,
podaj `descriptors`, które obejmują każdy główny korzeń polecenia najwyższego poziomu udostępniany przez ten
rejestrator.

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
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Zagnieżdżone polecenia otrzymują rozwiązane polecenie nadrzędne jako `program`:

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerNodesCanvasCommands } = await import("./src/cli.js");
    registerNodesCanvasCommands(program);
  },
  {
    parentPath: ["nodes"],
    descriptors: [
      {
        name: "canvas",
        description: "Capture or render canvas content from a paired node",
        hasSubcommands: true,
      },
    ],
  },
);
```

Używaj samego `commands` tylko wtedy, gdy nie potrzebujesz leniwej rejestracji głównego CLI.
Ta gorliwa ścieżka zgodności pozostaje obsługiwana, ale nie instaluje
symboli zastępczych opartych na deskryptorach do leniwego ładowania w czasie parsowania.

### Rejestracja backendu CLI

`api.registerCliBackend(...)` pozwala pluginowi posiadać domyślną konfigurację dla lokalnego
backendu AI CLI, takiego jak `codex-cli`.

- `id` backendu staje się prefiksem dostawcy w referencjach modeli, takich jak `codex-cli/gpt-5`.
- `config` backendu używa tego samego kształtu co `agents.defaults.cliBackends.<id>`.
- Konfiguracja użytkownika nadal wygrywa. OpenClaw scala `agents.defaults.cliBackends.<id>` nad
  domyślną konfiguracją pluginu przed uruchomieniem CLI.
- Użyj `normalizeConfig`, gdy backend potrzebuje przepisań zgodności po scaleniu
  (na przykład normalizacji starych kształtów flag).
- Użyj `resolveExecutionArgs` do przepisań argv w zakresie żądania, które należą do
  dialektu CLI, takich jak mapowanie poziomów myślenia OpenClaw na natywną flagę wysiłku.

Przewodnik tworzenia od początku do końca znajdziesz w
[Pluginy backendu CLI](/pl/plugins/cli-backend-plugins).

### Sloty wyłączne

| Metoda                                     | Co rejestruje                                                                                                                                                     |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Silnik kontekstu (jeden aktywny naraz). Callback `assemble()` otrzymuje `availableTools` i `citationsMode`, aby silnik mógł dostosować dodatki do promptu. |
| `api.registerMemoryCapability(capability)` | Ujednolicona funkcja pamięci                                                                                                                                      |
| `api.registerMemoryPromptSection(builder)` | Konstruktor sekcji promptu pamięci                                                                                                                                |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver planu opróżniania pamięci                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | Adapter środowiska uruchomieniowego pamięci                                                                                                                       |

### Adaptery osadzania pamięci

| Metoda                                         | Co rejestruje                              |
| ---------------------------------------------- | ------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter osadzania pamięci dla aktywnego pluginu |

- `registerMemoryCapability` to preferowane wyłączne API pluginu pamięci.
- `registerMemoryCapability` może także udostępniać `publicArtifacts.listArtifacts(...)`,
  aby pluginy towarzyszące mogły używać wyeksportowanych artefaktów pamięci przez
  `openclaw/plugin-sdk/memory-host-core`, zamiast sięgać do prywatnego układu konkretnego
  pluginu pamięci.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` i
  `registerMemoryRuntime` to zgodne ze starszymi wersjami wyłączne API pluginu pamięci.
- `MemoryFlushPlan.model` może przypiąć turę opróżniania do dokładnej referencji
  `provider/model`, takiej jak `ollama/qwen3:8b`, bez dziedziczenia aktywnego łańcucha
  fallbacku.
- `registerMemoryEmbeddingProvider` pozwala aktywnemu pluginowi pamięci zarejestrować jeden
  lub więcej identyfikatorów adapterów osadzania (na przykład `openai`, `gemini` albo niestandardowy
  identyfikator zdefiniowany przez plugin).
- Konfiguracja użytkownika, taka jak `agents.defaults.memorySearch.provider` i
  `agents.defaults.memorySearch.fallback`, jest rozwiązywana względem tych zarejestrowanych
  identyfikatorów adapterów.

### Zdarzenia i cykl życia

| Metoda                                       | Co robi                       |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Typowany hook cyklu życia     |
| `api.onConversationBindingResolved(handler)` | Callback powiązania rozmowy   |

Zobacz [Hooki Plugin](/pl/plugins/hooks), aby znaleźć przykłady, typowe nazwy hooków i
semantykę strażników.

### Semantyka decyzji hooków

- `before_tool_call`: zwrócenie `{ block: true }` jest terminalne. Gdy dowolny handler je ustawi, handlery o niższym priorytecie są pomijane.
- `before_tool_call`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `before_install`: zwrócenie `{ block: true }` jest terminalne. Gdy dowolny handler je ustawi, handlery o niższym priorytecie są pomijane.
- `before_install`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `reply_dispatch`: zwrócenie `{ handled: true, ... }` jest terminalne. Gdy dowolny handler przejmie wysyłkę, handlery o niższym priorytecie i domyślna ścieżka wysyłki modelu są pomijane.
- `message_sending`: zwrócenie `{ cancel: true }` jest terminalne. Gdy dowolny handler je ustawi, handlery o niższym priorytecie są pomijane.
- `message_sending`: zwrócenie `{ cancel: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `cancel`), a nie jako nadpisanie.
- `message_received`: użyj typowanego pola `threadId`, gdy potrzebujesz routingu przychodzącego wątku/tematu. Zachowaj `metadata` dla dodatków specyficznych dla kanału.
- `message_sending`: użyj typowanych pól routingu `replyToId` / `threadId`, zanim przejdziesz do specyficznych dla kanału `metadata`.
- `gateway_start`: użyj `ctx.config`, `ctx.workspaceDir` i `ctx.getCron?.()` dla stanu uruchomieniowego należącego do gateway, zamiast polegać na wewnętrznych hookach `gateway:startup`.
- `cron_changed`: obserwuj zmiany cyklu życia cron należące do gateway. Użyj `event.job?.state?.nextRunAtMs` i `ctx.getCron?.()` podczas synchronizowania zewnętrznych harmonogramów wybudzania oraz zachowaj OpenClaw jako źródło prawdy dla kontroli terminów i wykonywania.

### Pola obiektu API

| Pole                     | Typ                       | Opis                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identyfikator pluginu                                                                       |
| `api.name`               | `string`                  | Nazwa wyświetlana                                                                           |
| `api.version`            | `string?`                 | Wersja pluginu (opcjonalnie)                                                                |
| `api.description`        | `string?`                 | Opis pluginu (opcjonalnie)                                                                  |
| `api.source`             | `string`                  | Ścieżka źródłowa pluginu                                                                    |
| `api.rootDir`            | `string?`                 | Katalog główny pluginu (opcjonalnie)                                                        |
| `api.config`             | `OpenClawConfig`          | Bieżący snapshot konfiguracji (aktywny snapshot środowiska uruchomieniowego w pamięci, gdy jest dostępny) |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfiguracja specyficzna dla pluginu z `plugins.entries.<id>.config`                        |
| `api.runtime`            | `PluginRuntime`           | [Pomocniki środowiska uruchomieniowego](/pl/plugins/sdk-runtime)                               |
| `api.logger`             | `PluginLogger`            | Logger o ograniczonym zakresie (`debug`, `info`, `warn`, `error`)                           |
| `api.registrationMode`   | `PluginRegistrationMode`  | Bieżący tryb ładowania; `"setup-runtime"` to lekki okres uruchamiania/konfiguracji przed pełnym wejściem |
| `api.resolvePath(input)` | `(string) => string`      | Rozwiązuje ścieżkę względem katalogu głównego pluginu                                       |

## Konwencja modułów wewnętrznych

W swoim pluginie używaj lokalnych plików zbiorczych do importów wewnętrznych:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Nigdy nie importuj własnego pluginu przez `openclaw/plugin-sdk/<your-plugin>`
  z kodu produkcyjnego. Kieruj importy wewnętrzne przez `./api.ts` albo
  `./runtime-api.ts`. Ścieżka SDK jest wyłącznie kontraktem zewnętrznym.
</Warning>

Powierzchnie publiczne dołączonych pluginów ładowane przez fasadę (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` i podobne publiczne pliki wejściowe) preferują
aktywny snapshot konfiguracji środowiska uruchomieniowego, gdy OpenClaw już działa. Jeśli snapshot środowiska uruchomieniowego
jeszcze nie istnieje, wracają do rozwiązanej konfiguracji z pliku na dysku.
Spakowane fasady dołączonych pluginów powinny być ładowane przez loadery fasad pluginów
OpenClaw; bezpośrednie importy z `dist/extensions/...` omijają manifest
i kontrole sidecara środowiska uruchomieniowego, których spakowane instalacje używają dla kodu należącego do pluginu.

Pluginy dostawców mogą udostępniać wąski, lokalny dla pluginu barrel kontraktu, gdy
helper jest celowo specyficzny dla dostawcy i nie należy jeszcze do generycznej
podścieżki SDK. Dołączone przykłady:

- **Anthropic**: publiczny seam `api.ts` / `contract-api.ts` dla helperów strumieni Claude
  beta-header i `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` eksportuje buildery dostawcy,
  helpery modeli domyślnych i buildery dostawcy realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` eksportuje builder dostawcy
  oraz helpery onboardingu/konfiguracji.

<Warning>
  Kod produkcyjny rozszerzenia powinien też unikać importów `openclaw/plugin-sdk/<other-plugin>`.
  Jeśli helper jest rzeczywiście współdzielony, przenieś go do neutralnej podścieżki SDK,
  takiej jak `openclaw/plugin-sdk/speech`, `.../provider-model-shared` lub innej
  powierzchni zorientowanej na możliwości, zamiast sprzęgać ze sobą dwa pluginy.
</Warning>

## Powiązane

<CardGroup cols={2}>
  <Card title="Punkty wejścia" icon="door-open" href="/pl/plugins/sdk-entrypoints">
    Opcje `definePluginEntry` i `defineChannelPluginEntry`.
  </Card>
  <Card title="Helpery runtime" icon="gears" href="/pl/plugins/sdk-runtime">
    Pełne odniesienie do przestrzeni nazw `api.runtime`.
  </Card>
  <Card title="Konfiguracja i ustawienia" icon="sliders" href="/pl/plugins/sdk-setup">
    Pakowanie, manifesty i schematy konfiguracji.
  </Card>
  <Card title="Testowanie" icon="vial" href="/pl/plugins/sdk-testing">
    Narzędzia testowe i reguły lint.
  </Card>
  <Card title="Migracja SDK" icon="arrows-turn-right" href="/pl/plugins/sdk-migration">
    Migracja z przestarzałych powierzchni.
  </Card>
  <Card title="Wewnętrzne mechanizmy pluginów" icon="diagram-project" href="/pl/plugins/architecture">
    Głęboka architektura i model możliwości.
  </Card>
</CardGroup>
