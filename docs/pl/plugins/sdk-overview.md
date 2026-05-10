---
read_when:
    - Musisz wiedzieć, z której podścieżki SDK importować
    - Potrzebujesz opisu referencyjnego wszystkich metod rejestracji w OpenClawPluginApi
    - Szukasz konkretnego eksportu SDK
sidebarTitle: Plugin SDK overview
summary: Mapa importów, dokumentacja referencyjna API rejestracji i architektura SDK
title: Omówienie Plugin SDK
x-i18n:
    generated_at: "2026-05-10T19:49:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ca09b142accc03d8ae897c5da62eab6c25793354e0175742ce1a63d700e64dd
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK pluginów to typowany kontrakt między pluginami a rdzeniem. Ta strona jest
referencją dla **tego, co importować** i **tego, co można rejestrować**.

<Note>
  Ta strona jest przeznaczona dla autorów pluginów używających `openclaw/plugin-sdk/*` wewnątrz
  OpenClaw. W przypadku zewnętrznych aplikacji, skryptów, pulpitów, zadań CI i rozszerzeń IDE,
  które chcą uruchamiać agentów przez Gateway, zamiast tego użyj
  [OpenClaw App SDK](/pl/concepts/openclaw-sdk) oraz pakietu `@openclaw/sdk`.
</Note>

<Tip>
Szukasz raczej przewodnika krok po kroku? Zacznij od [Tworzenia pluginów](/pl/plugins/building-plugins), użyj [Pluginów kanałów](/pl/plugins/sdk-channel-plugins) dla pluginów kanałów, [Pluginów dostawców](/pl/plugins/sdk-provider-plugins) dla pluginów dostawców, [Pluginów zaplecza CLI](/pl/plugins/cli-backend-plugins) dla lokalnych zapleczy CLI AI oraz [Hooków pluginów](/pl/plugins/hooks) dla pluginów hooków narzędzi lub cyklu życia.
</Tip>

## Konwencja importu

Zawsze importuj z określonej podścieżki:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Każda podścieżka jest małym, samodzielnym modułem. Dzięki temu uruchamianie pozostaje szybkie i
zapobiega problemom z zależnościami cyklicznymi. W przypadku pomocników wejścia/budowania specyficznych dla kanałów
preferuj `openclaw/plugin-sdk/channel-core`; zachowaj `openclaw/plugin-sdk/core` dla
szerszej powierzchni parasolowej i współdzielonych pomocników, takich jak
`buildChannelConfigSchema`.

W przypadku konfiguracji kanału opublikuj należący do kanału JSON Schema przez
`openclaw.plugin.json#channelConfigs`. Podścieżka `plugin-sdk/channel-config-schema`
służy do współdzielonych prymitywów schematów i generycznego buildera. Dołączone do OpenClaw
pluginy używają `plugin-sdk/bundled-channel-config-schema` dla zachowanych
schematów dołączonych kanałów. Przestarzałe eksporty zgodności pozostają w
`plugin-sdk/channel-config-schema-legacy`; żadna podścieżka dołączonego schematu nie jest
wzorcem dla nowych pluginów.

<Warning>
  Nie importuj wygodnych połączeń sygnowanych dostawcą lub kanałem (na przykład
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Dołączone pluginy składają generyczne podścieżki SDK wewnątrz własnych beczek
  `api.ts` / `runtime-api.ts`; konsumenci rdzenia powinni używać tych lokalnych dla pluginu
  beczek albo dodać wąski generyczny kontrakt SDK, gdy potrzeba jest naprawdę
  wielokanałowa.

Niewielki zestaw połączeń pomocniczych dołączonych pluginów nadal pojawia się w wygenerowanej mapie eksportów,
gdy mają śledzone użycie właściciela. Istnieją wyłącznie do utrzymania dołączonych pluginów
i nie są zalecanymi ścieżkami importu dla nowych pluginów zewnętrznych.

`openclaw/plugin-sdk/discord` i `openclaw/plugin-sdk/telegram-account` są
również zachowane jako przestarzałe fasady zgodności dla śledzonego użycia właściciela. Nie
kopiuj tych ścieżek importu do nowych pluginów; zamiast tego używaj wstrzykniętych pomocników runtime i
generycznych podścieżek SDK kanałów.
</Warning>

## Referencja podścieżek

SDK pluginów jest udostępniany jako zestaw wąskich podścieżek pogrupowanych według obszaru (wejście
pluginu, kanał, dostawca, auth, runtime, capability, pamięć oraz zarezerwowane
pomocniki dołączonych pluginów). Pełny katalog, pogrupowany i podlinkowany, znajduje się w
[Podścieżkach SDK pluginów](/pl/plugins/sdk-subpaths).

Inwentarz punktów wejścia kompilatora znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`; eksporty pakietu są generowane z
publicznego podzbioru po odjęciu lokalnych dla repo podścieżek testowych/wewnętrznych wymienionych w
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Uruchom
`pnpm plugin-sdk:surface`, aby skontrolować liczbę publicznych eksportów. Przestarzałe publiczne
podścieżki, które są wystarczająco stare i nieużywane przez kod produkcyjny dołączonych rozszerzeń, są
śledzone w `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; szerokie
przestarzałe beczki reeksportu są śledzone w
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API rejestracji

Callback `register(api)` otrzymuje obiekt `OpenClawPluginApi` z tymi
metodami:

### Rejestracja capability

| Metoda                                           | Co rejestruje                          |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Wnioskowanie tekstowe (LLM)            |
| `api.registerAgentHarness(...)`                  | Eksperymentalny niskopoziomowy wykonawca agenta |
| `api.registerCliBackend(...)`                    | Lokalne zaplecze wnioskowania CLI      |
| `api.registerChannel(...)`                       | Kanał komunikacyjny                    |
| `api.registerSpeechProvider(...)`                | Synteza text-to-speech / STT           |
| `api.registerRealtimeTranscriptionProvider(...)` | Strumieniowa transkrypcja w czasie rzeczywistym |
| `api.registerRealtimeVoiceProvider(...)`         | Dwukierunkowe sesje głosowe w czasie rzeczywistym |
| `api.registerMediaUnderstandingProvider(...)`    | Analiza obrazu/audio/wideo             |
| `api.registerImageGenerationProvider(...)`       | Generowanie obrazów                    |
| `api.registerMusicGenerationProvider(...)`       | Generowanie muzyki                     |
| `api.registerVideoGenerationProvider(...)`       | Generowanie wideo                      |
| `api.registerWebFetchProvider(...)`              | Dostawca pobierania z sieci / scrape   |
| `api.registerWebSearchProvider(...)`             | Wyszukiwanie w sieci                   |

### Narzędzia i polecenia

| Metoda                          | Co rejestruje                                  |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Narzędzie agenta (wymagane lub `{ optional: true }`) |
| `api.registerCommand(def)`      | Niestandardowe polecenie (omija LLM)           |

Polecenia pluginów mogą ustawiać `agentPromptGuidance`, gdy agent potrzebuje krótkiej,
należącej do polecenia wskazówki routingu. Zachowaj ten tekst o samym poleceniu; nie dodawaj
polityki specyficznej dla dostawcy lub pluginu do builderów promptów rdzenia.

### Infrastruktura

| Metoda                                         | Co rejestruje                              |
| ---------------------------------------------- | ------------------------------------------ |
| `api.registerHook(events, handler, opts?)`     | Hook zdarzenia                             |
| `api.registerHttpRoute(params)`                | Punkt końcowy HTTP Gateway                 |
| `api.registerGatewayMethod(name, handler)`     | Metoda RPC Gateway                         |
| `api.registerGatewayDiscoveryService(service)` | Lokalny anonsujący usługę odkrywania Gateway |
| `api.registerCli(registrar, opts?)`            | Podpolecenie CLI                           |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI funkcji Node pod `openclaw nodes`      |
| `api.registerService(service)`                 | Usługa w tle                               |
| `api.registerInteractiveHandler(registration)` | Handler interaktywny                       |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware runtime wyników narzędzi        |
| `api.registerMemoryPromptSupplement(builder)`  | Addytywna sekcja promptu sąsiadująca z pamięcią |
| `api.registerMemoryCorpusSupplement(adapter)`  | Addytywny korpus wyszukiwania/odczytu pamięci |

### Hooki hosta dla pluginów przepływu pracy

Hooki hosta to połączenia SDK dla pluginów, które muszą uczestniczyć w cyklu życia hosta,
a nie tylko dodawać dostawcę, kanał lub narzędzie. Są to
generyczne kontrakty; Plan Mode może ich używać, ale mogą też przepływy zatwierdzania,
bramki polityki workspace, monitory w tle, kreatory konfiguracji i towarzyszące
pluginy UI.

| Metoda                                                                   | Kontrakt, za który odpowiada                                                                                                      |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Należący do pluginu, zgodny z JSON stan sesji rzutowany przez sesje Gateway                                                       |
| `api.enqueueNextTurnInjection(...)`                                      | Trwały, dokładnie jednokrotny kontekst wstrzykiwany do następnej tury agenta dla jednej sesji                                     |
| `api.registerTrustedToolPolicy(...)`                                     | Dołączona/zaufana polityka narzędzi przedpluginowa, która może blokować lub przepisywać parametry narzędzi                        |
| `api.registerToolMetadata(...)`                                          | Metadane wyświetlania katalogu narzędzi bez zmiany implementacji narzędzia                                                        |
| `api.registerCommand(...)`                                               | Zakresowe polecenia pluginów; wyniki poleceń mogą ustawiać `continueAgent: true`; natywne polecenia Discord obsługują `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Deskryptory wkładów Control UI dla powierzchni sesji, narzędzia, przebiegu lub ustawień                                           |
| `api.registerRuntimeLifecycle(...)`                                      | Callbacki sprzątania dla należących do pluginu zasobów runtime na ścieżkach reset/delete/reload                                   |
| `api.registerAgentEventSubscription(...)`                                | Oczyszczone subskrypcje zdarzeń dla stanu przepływu pracy i monitorów                                                             |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Tymczasowy stan pluginu na przebieg, czyszczony przy terminalnym cyklu życia przebiegu                                            |
| `api.registerSessionSchedulerJob(...)`                                   | Należące do pluginu rekordy zadań harmonogramu sesji z deterministycznym czyszczeniem                                             |

Kontrakty celowo rozdzielają uprawnienia:

- Zewnętrzne pluginy mogą posiadać rozszerzenia sesji, deskryptory UI, polecenia, metadane narzędzi, wstrzyknięcia następnej tury i zwykłe hooki.
- Zaufane polityki narzędzi działają przed zwykłymi hookami `before_tool_call` i są
  tylko dla dołączonych pluginów, ponieważ uczestniczą w polityce bezpieczeństwa hosta.
- Zarezerwowana własność poleceń jest tylko dla dołączonych pluginów. Zewnętrzne pluginy powinny używać
  własnych nazw poleceń lub aliasów.
- `allowPromptInjection=false` wyłącza hooki modyfikujące prompt, w tym
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  pola promptu ze starszego `before_agent_start` oraz
  `enqueueNextTurnInjection`.

Przykłady konsumentów innych niż Plan:

| Archetyp pluginu             | Używane hooki                                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Przepływ zatwierdzania       | Rozszerzenie sesji, kontynuacja polecenia, wstrzyknięcie następnej tury, deskryptor UI                                               |
| Bramka polityki budżetu/workspace | Zaufana polityka narzędzi, metadane narzędzi, projekcja sesji                                                                    |
| Monitor cyklu życia w tle    | Sprzątanie cyklu życia runtime, subskrypcja zdarzeń agenta, własność/czyszczenie harmonogramu sesji, wkład promptu Heartbeat, deskryptor UI |
| Kreator konfiguracji lub onboardingu | Rozszerzenie sesji, zakresowe polecenia, deskryptor Control UI                                                                 |

<Note>
  Zarezerwowane przestrzenie nazw administratora rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) zawsze pozostają `operator.admin`, nawet jeśli plugin próbuje przypisać
  węższy zakres metody Gateway. Preferuj prefiksy specyficzne dla pluginu dla
  metod należących do pluginu.
</Note>

<Accordion title="Kiedy używać middleware wyników narzędzi">
  Dołączone pluginy mogą używać `api.registerAgentToolResultMiddleware(...)`, gdy
  muszą przepisać wynik narzędzia po wykonaniu i zanim środowisko uruchomieniowe
  przekaże ten wynik z powrotem do modelu. Jest to zaufany, neutralny względem środowiska
  uruchomieniowego punkt integracji dla asynchronicznych reduktorów wyjścia, takich jak tokenjuice.

Dołączone pluginy muszą deklarować `contracts.agentToolResultMiddleware` dla każdego
docelowego środowiska uruchomieniowego, na przykład `["pi", "codex"]`. Zewnętrzne pluginy
nie mogą rejestrować tego middleware; używaj zwykłych hooków pluginów OpenClaw do pracy,
która nie wymaga synchronizacji wyniku narzędzia przed modelem. Stara ścieżka rejestracji
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
- `descriptors`: deskryptory poleceń używane podczas parsowania na potrzeby pomocy CLI,
  routingu i leniwej rejestracji CLI pluginu
- `parentPath`: opcjonalna ścieżka polecenia nadrzędnego dla zagnieżdżonych grup poleceń, takich jak
  `["nodes"]`

Dla funkcji sparowanych węzłów preferuj
`api.registerNodeCliFeature(registrar, opts?)`. Jest to mały wrapper wokół
`api.registerCli(..., { parentPath: ["nodes"] })` i sprawia, że polecenia takie jak
`openclaw nodes canvas` są jawnymi funkcjami węzłów należącymi do pluginu.

Jeśli chcesz, aby polecenie pluginu pozostało leniwie ładowane w zwykłej ścieżce głównej CLI,
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

Zagnieżdżone polecenia otrzymują rozstrzygnięte polecenie nadrzędne jako `program`:

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
placeholderów opartych na deskryptorach do leniwego ładowania podczas parsowania.

### Rejestracja backendu CLI

`api.registerCliBackend(...)` pozwala pluginowi posiadać domyślną konfigurację dla lokalnego
backendu AI CLI, takiego jak `codex-cli`.

- `id` backendu staje się prefiksem providera w referencjach modeli, takich jak `codex-cli/gpt-5`.
- `config` backendu używa tego samego kształtu co `agents.defaults.cliBackends.<id>`.
- Konfiguracja użytkownika nadal ma pierwszeństwo. OpenClaw scala `agents.defaults.cliBackends.<id>` z
  domyślną konfiguracją pluginu przed uruchomieniem CLI.
- Użyj `normalizeConfig`, gdy backend wymaga przepisów zgodności po scaleniu
  (na przykład normalizacji starych kształtów flag).
- Użyj `resolveExecutionArgs` do przepisów argv w zakresie żądania, które należą do
  dialektu CLI, takich jak mapowanie poziomów myślenia OpenClaw na natywną flagę effort.

Pełny przewodnik autorski znajdziesz w
[pluginach backendu CLI](/pl/plugins/cli-backend-plugins).

### Sloty wyłączne

| Metoda                                     | Co rejestruje                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Silnik kontekstu (jeden aktywny naraz). Callback `assemble()` otrzymuje `availableTools` i `citationsMode`, aby silnik mógł dostosować dodatki do promptu. |
| `api.registerMemoryCapability(capability)` | Ujednolicona capability pamięci                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Builder sekcji promptu pamięci                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver planu opróżniania pamięci                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | Adapter środowiska uruchomieniowego pamięci                                                                                                                                    |

### Adaptery osadzania pamięci

| Metoda                                         | Co rejestruje                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter osadzania pamięci dla aktywnego pluginu |

- `registerMemoryCapability` jest preferowanym API wyłącznego pluginu pamięci.
- `registerMemoryCapability` może także udostępniać `publicArtifacts.listArtifacts(...)`,
  aby pluginy towarzyszące mogły używać wyeksportowanych artefaktów pamięci przez
  `openclaw/plugin-sdk/memory-host-core` zamiast sięgać do prywatnego układu konkretnego
  pluginu pamięci.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` i
  `registerMemoryRuntime` to zgodne ze starszymi wersjami API wyłącznego pluginu pamięci.
- `MemoryFlushPlan.model` może przypiąć turę opróżniania do dokładnej referencji
  `provider/model`, takiej jak `ollama/qwen3:8b`, bez dziedziczenia aktywnego łańcucha
  fallback.
- `registerMemoryEmbeddingProvider` pozwala aktywnemu pluginowi pamięci zarejestrować jeden
  lub więcej identyfikatorów adapterów osadzania (na przykład `openai`, `gemini` albo niestandardowy
  identyfikator zdefiniowany przez plugin).
- Konfiguracja użytkownika, taka jak `agents.defaults.memorySearch.provider` i
  `agents.defaults.memorySearch.fallback`, jest rozstrzygana względem tych zarejestrowanych
  identyfikatorów adapterów.

### Zdarzenia i cykl życia

| Metoda                                       | Co robi                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Typowany hook cyklu życia          |
| `api.onConversationBindingResolved(handler)` | Callback powiązania konwersacji |

Zobacz [hooki Plugin](/pl/plugins/hooks), aby znaleźć przykłady, typowe nazwy hooków i semantykę guardów.

### Semantyka decyzji hooków

- `before_tool_call`: zwrócenie `{ block: true }` jest końcowe. Gdy dowolny handler je ustawi, handlery o niższym priorytecie są pomijane.
- `before_tool_call`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `before_install`: zwrócenie `{ block: true }` jest końcowe. Gdy dowolny handler je ustawi, handlery o niższym priorytecie są pomijane.
- `before_install`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `reply_dispatch`: zwrócenie `{ handled: true, ... }` jest końcowe. Gdy dowolny handler przejmie dispatch, handlery o niższym priorytecie i domyślna ścieżka dispatchu modelu są pomijane.
- `message_sending`: zwrócenie `{ cancel: true }` jest końcowe. Gdy dowolny handler je ustawi, handlery o niższym priorytecie są pomijane.
- `message_sending`: zwrócenie `{ cancel: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `cancel`), a nie jako nadpisanie.
- `message_received`: użyj typowanego pola `threadId`, gdy potrzebujesz routingu przychodzących wątków/tematów. Zachowaj `metadata` dla dodatków specyficznych dla kanału.
- `message_sending`: użyj typowanych pól routingu `replyToId` / `threadId`, zanim wrócisz do specyficznego dla kanału `metadata`.
- `gateway_start`: użyj `ctx.config`, `ctx.workspaceDir` i `ctx.getCron?.()` dla stanu uruchomieniowego należącego do gatewaya zamiast polegać na wewnętrznych hookach `gateway:startup`.
- `cron_changed`: obserwuj zmiany cyklu życia crona należące do gatewaya. Używaj `event.job?.state?.nextRunAtMs` i `ctx.getCron?.()` podczas synchronizacji zewnętrznych harmonogramów wybudzania oraz zachowaj OpenClaw jako źródło prawdy dla sprawdzania terminów i wykonywania.

### Pola obiektu API

| Pole                    | Typ                      | Opis                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identyfikator pluginu                                                                                   |
| `api.name`               | `string`                  | Nazwa wyświetlana                                                                                |
| `api.version`            | `string?`                 | Wersja pluginu (opcjonalnie)                                                                   |
| `api.description`        | `string?`                 | Opis pluginu (opcjonalnie)                                                               |
| `api.source`             | `string`                  | Ścieżka źródłowa pluginu                                                                          |
| `api.rootDir`            | `string?`                 | Katalog główny pluginu (opcjonalnie)                                                            |
| `api.config`             | `OpenClawConfig`          | Bieżąca migawka konfiguracji (aktywna migawka środowiska uruchomieniowego w pamięci, gdy jest dostępna)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfiguracja specyficzna dla pluginu z `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Helpery środowiska uruchomieniowego](/pl/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger o określonym zakresie (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Bieżący tryb ładowania; `"setup-runtime"` to lekki przedział uruchomienia/konfiguracji przed pełnym wpisem |
| `api.resolvePath(input)` | `(string) => string`      | Rozwiązuje ścieżkę względem katalogu głównego pluginu                                                        |

## Konwencja modułów wewnętrznych

W obrębie pluginu używaj lokalnych plików barrel do importów wewnętrznych:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Nigdy nie importuj własnego pluginu przez `openclaw/plugin-sdk/<your-plugin>`
  z kodu produkcyjnego. Kieruj importy wewnętrzne przez `./api.ts` lub
  `./runtime-api.ts`. Ścieżka SDK jest wyłącznie kontraktem zewnętrznym.
</Warning>

Fasadowo ładowane publiczne powierzchnie dołączonego Plugin (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` i podobne publiczne pliki wejściowe) preferują
aktywną migawkę konfiguracji runtime, gdy OpenClaw już działa. Jeśli migawka runtime
jeszcze nie istnieje, wracają do rozstrzygniętego pliku konfiguracji na dysku.
Spakowane fasady dołączonych Plugin powinny być ładowane przez loadery fasad
Plugin OpenClaw; bezpośrednie importy z `dist/extensions/...` omijają manifest
i kontrole sidecar runtime, których spakowane instalacje używają dla kodu należącego do Plugin.

Pluginy dostawców mogą udostępniać wąski, lokalny dla Plugin barrel kontraktu, gdy
pomocnik jest celowo specyficzny dla dostawcy i nie należy jeszcze do ogólnej
podścieżki SDK. Dołączone przykłady:

- **Anthropic**: publiczna granica `api.ts` / `contract-api.ts` dla Claude
  beta-header i pomocników strumienia `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` eksportuje buildery dostawcy,
  pomocniki modeli domyślnych i buildery dostawcy realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` eksportuje builder dostawcy
  oraz pomocniki onboardingu/konfiguracji.

<Warning>
  Kod produkcyjny rozszerzenia powinien również unikać importów
  `openclaw/plugin-sdk/<other-plugin>`. Jeśli pomocnik jest naprawdę współdzielony,
  przenieś go do neutralnej podścieżki SDK, takiej jak
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, albo innej
  powierzchni zorientowanej na możliwości, zamiast sprzęgać ze sobą dwa pluginy.
</Warning>

## Powiązane

<CardGroup cols={2}>
  <Card title="Punkty wejścia" icon="door-open" href="/pl/plugins/sdk-entrypoints">
    Opcje `definePluginEntry` i `defineChannelPluginEntry`.
  </Card>
  <Card title="Pomocniki runtime" icon="gears" href="/pl/plugins/sdk-runtime">
    Pełna referencja przestrzeni nazw `api.runtime`.
  </Card>
  <Card title="Konfiguracja początkowa i konfiguracja" icon="sliders" href="/pl/plugins/sdk-setup">
    Pakowanie, manifesty i schematy konfiguracji.
  </Card>
  <Card title="Testowanie" icon="vial" href="/pl/plugins/sdk-testing">
    Narzędzia testowe i reguły lint.
  </Card>
  <Card title="Migracja SDK" icon="arrows-turn-right" href="/pl/plugins/sdk-migration">
    Migracja z przestarzałych powierzchni.
  </Card>
  <Card title="Wewnętrzne mechanizmy Plugin" icon="diagram-project" href="/pl/plugins/architecture">
    Głęboka architektura i model możliwości.
  </Card>
</CardGroup>
