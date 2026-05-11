---
read_when:
    - Musisz wiedzieć, z której podścieżki SDK importować
    - Potrzebujesz dokumentacji referencyjnej wszystkich metod rejestracji w OpenClawPluginApi
    - Szukasz konkretnego eksportu SDK
sidebarTitle: Plugin SDK overview
summary: Mapa importu, dokumentacja referencyjna API rejestracji i architektura SDK
title: Omówienie Plugin SDK
x-i18n:
    generated_at: "2026-05-11T20:35:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 633fcffa4256c84c40e8c61e692521583370a368d3058b44d10922279a096b06
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK pluginów jest typowanym kontraktem między pluginami a rdzeniem. Ta strona jest
odniesieniem dla tego, **co importować** i **co można rejestrować**.

<Note>
  Ta strona jest przeznaczona dla autorów pluginów używających `openclaw/plugin-sdk/*` wewnątrz
  OpenClaw. W przypadku zewnętrznych aplikacji, skryptów, pulpitów, zadań CI i rozszerzeń IDE,
  które chcą uruchamiać agentów przez Gateway, użyj zamiast tego
  [SDK aplikacji OpenClaw](/pl/concepts/openclaw-sdk) i pakietu `@openclaw/sdk`.
</Note>

<Tip>
Szukasz raczej przewodnika krok po kroku? Zacznij od [Tworzenia pluginów](/pl/plugins/building-plugins), użyj [Pluginów kanałów](/pl/plugins/sdk-channel-plugins) dla pluginów kanałów, [Pluginów dostawców](/pl/plugins/sdk-provider-plugins) dla pluginów dostawców, [Pluginów zaplecza CLI](/pl/plugins/cli-backend-plugins) dla lokalnych zapleczy CLI AI oraz [Hooków pluginów](/pl/plugins/hooks) dla pluginów hooków narzędzi lub cyklu życia.
</Tip>

## Konwencja importu

Zawsze importuj z konkretnej podścieżki:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Każda podścieżka jest małym, samodzielnym modułem. Dzięki temu uruchamianie pozostaje szybkie i
zapobiega problemom z zależnościami cyklicznymi. W przypadku pomocników wejścia/budowania specyficznych dla kanału
preferuj `openclaw/plugin-sdk/channel-core`; zachowaj `openclaw/plugin-sdk/core` dla
szerszej powierzchni zbiorczej i współdzielonych pomocników, takich jak
`buildChannelConfigSchema`.

Dla konfiguracji kanału publikuj należący do kanału JSON Schema przez
`openclaw.plugin.json#channelConfigs`. Podścieżka `plugin-sdk/channel-config-schema`
jest przeznaczona dla współdzielonych prymitywów schematu i ogólnego konstruktora. Dołączone do OpenClaw
pluginy używają `plugin-sdk/bundled-channel-config-schema` dla zachowanych
schematów dołączonych kanałów. Przestarzałe eksporty zgodności pozostają w
`plugin-sdk/channel-config-schema-legacy`; żadna z podścieżek schematów dołączonych nie jest
wzorcem dla nowych pluginów.

<Warning>
  Nie importuj wygodnych połączeń markowanych dostawcą lub kanałem (na przykład
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Dołączone pluginy komponują ogólne podścieżki SDK wewnątrz własnych baryłek `api.ts` /
  `runtime-api.ts`; konsumenci rdzenia powinni albo używać tych lokalnych dla pluginu
  baryłek, albo dodać wąski ogólny kontrakt SDK, gdy potrzeba jest naprawdę
  międzykanałowa.

Niewielki zestaw pomocniczych połączeń dołączonych pluginów nadal pojawia się w wygenerowanej mapie eksportu,
gdy mają śledzone użycie właściciela. Istnieją wyłącznie na potrzeby utrzymania dołączonych pluginów
i nie są zalecanymi ścieżkami importu dla nowych pluginów zewnętrznych.

`openclaw/plugin-sdk/discord` i `openclaw/plugin-sdk/telegram-account` są
również zachowane jako przestarzałe fasady zgodności dla śledzonego użycia właściciela. Nie
kopiuj tych ścieżek importu do nowych pluginów; zamiast tego używaj wstrzykniętych pomocników środowiska wykonawczego i
ogólnych podścieżek SDK kanałów.
</Warning>

## Odniesienie podścieżek

SDK pluginów jest udostępniany jako zestaw wąskich podścieżek pogrupowanych według obszaru (wejście pluginu,
kanał, dostawca, uwierzytelnianie, środowisko wykonawcze, capability, pamięć oraz zarezerwowane
pomocniki dołączonych pluginów). Pełny katalog — pogrupowany i podlinkowany — zobacz w
[Podścieżki SDK pluginów](/pl/plugins/sdk-subpaths).

Inwentarz punktów wejścia kompilatora znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`; eksporty pakietu są generowane z
publicznego podzbioru po odjęciu lokalnych dla repozytorium podścieżek testowych/wewnętrznych wymienionych w
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Uruchom
`pnpm plugin-sdk:surface`, aby skontrolować liczbę publicznych eksportów. Przestarzałe publiczne
podścieżki, które są wystarczająco stare i nieużywane przez kod produkcyjny dołączonych rozszerzeń, są
śledzone w `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; szerokie
przestarzałe baryłki reeksportów są śledzone w
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
| `api.registerChannel(...)`                       | Kanał wiadomości                       |
| `api.registerSpeechProvider(...)`                | Synteza text-to-speech / STT           |
| `api.registerRealtimeTranscriptionProvider(...)` | Strumieniowa transkrypcja w czasie rzeczywistym |
| `api.registerRealtimeVoiceProvider(...)`         | Dwukierunkowe sesje głosowe w czasie rzeczywistym |
| `api.registerMediaUnderstandingProvider(...)`    | Analiza obrazów/audio/wideo            |
| `api.registerImageGenerationProvider(...)`       | Generowanie obrazów                    |
| `api.registerMusicGenerationProvider(...)`       | Generowanie muzyki                     |
| `api.registerVideoGenerationProvider(...)`       | Generowanie wideo                      |
| `api.registerWebFetchProvider(...)`              | Dostawca pobierania / scrapowania sieci |
| `api.registerWebSearchProvider(...)`             | Wyszukiwanie w sieci                   |

### Narzędzia i polecenia

| Metoda                          | Co rejestruje                                |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Narzędzie agenta (wymagane lub `{ optional: true }`) |
| `api.registerCommand(def)`      | Polecenie niestandardowe (omija LLM)         |

Polecenia pluginów mogą ustawić `agentPromptGuidance`, gdy agent potrzebuje krótkiej,
należącej do polecenia wskazówki routingu. Niech ten tekst dotyczy samego polecenia; nie dodawaj
polityki specyficznej dla dostawcy lub pluginu do konstruktorów promptów rdzenia.

### Infrastruktura

| Metoda                                         | Co rejestruje                           |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook zdarzenia                          |
| `api.registerHttpRoute(params)`                | Punkt końcowy HTTP Gateway              |
| `api.registerGatewayMethod(name, handler)`     | Metoda RPC Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | Lokalny reklamodawca wykrywania Gateway |
| `api.registerCli(registrar, opts?)`            | Podpolecenie CLI                        |
| `api.registerNodeCliFeature(registrar, opts?)` | Funkcja CLI Node pod `openclaw nodes`   |
| `api.registerService(service)`                 | Usługa w tle                            |
| `api.registerInteractiveHandler(registration)` | Interaktywny handler                    |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware wyniku narzędzia środowiska wykonawczego |
| `api.registerMemoryPromptSupplement(builder)`  | Addytywna sekcja promptu sąsiadująca z pamięcią |
| `api.registerMemoryCorpusSupplement(adapter)`  | Addytywny korpus wyszukiwania/odczytu pamięci |

### Hooki hosta dla pluginów przepływu pracy

Hooki hosta są połączeniami SDK dla pluginów, które muszą uczestniczyć w cyklu życia hosta,
a nie tylko dodawać dostawcę, kanał lub narzędzie. Są to
kontrakty ogólne; Plan Mode może ich używać, ale mogą też przepływy zatwierdzania,
bramki polityki obszaru roboczego, monitory w tle, kreatory konfiguracji i pluginy towarzyszące UI.

| Metoda                                                                               | Kontrakt, którego jest właścicielem                                                                                              |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Należący do pluginu, zgodny z JSON stan sesji projektowany przez sesje Gateway                                                     |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Trwały, dokładnie jednorazowy kontekst wstrzykiwany do następnej tury agenta dla jednej sesji                                      |
| `api.registerTrustedToolPolicy(...)`                                                 | Dołączona/zaufana polityka narzędzi przed pluginem, która może blokować lub przepisywać parametry narzędzi                         |
| `api.registerToolMetadata(...)`                                                      | Metadane wyświetlania katalogu narzędzi bez zmiany implementacji narzędzia                                                         |
| `api.registerCommand(...)`                                                           | Polecenia o określonym zakresie pluginu; wyniki poleceń mogą ustawiać `continueAgent: true`; natywne polecenia Discord obsługują `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Deskryptory wkładu UI sterowania dla powierzchni sesji, narzędzia, uruchomienia lub ustawień                                      |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Callbacki czyszczenia dla należących do pluginu zasobów środowiska wykonawczego na ścieżkach resetowania/usuwania/przeładowania    |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Oczyszczone subskrypcje zdarzeń dla stanu przepływu pracy i monitorów                                                              |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Tymczasowy stan pluginu dla pojedynczego uruchomienia, czyszczony przy terminalnym cyklu życia uruchomienia                        |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadane czyszczenia dla należących do pluginu zadań harmonogramu; nie harmonogramuje pracy ani nie tworzy rekordów zadań          |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Wyłącznie dołączane dostarczanie załączników plików pośredniczone przez hosta do aktywnej bezpośredniej trasy wychodzącej sesji    |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Wyłącznie dołączane, wspierane przez Cron zaplanowane tury sesji oraz czyszczenie oparte na tagach                                 |
| `api.session.controls.registerSessionAction(...)`                                    | Typowane akcje sesji, które klienci mogą wysyłać przez Gateway                                                                     |

Używaj pogrupowanych przestrzeni nazw dla nowego kodu pluginów:

- `api.session.state.registerSessionExtension(...)`
- `api.session.workflow.enqueueNextTurnInjection(...)`
- `api.session.workflow.registerSessionSchedulerJob(...)`
- `api.session.workflow.sendSessionAttachment(...)`
- `api.session.workflow.scheduleSessionTurn(...)`
- `api.session.workflow.unscheduleSessionTurnsByTag(...)`
- `api.session.controls.registerSessionAction(...)`
- `api.session.controls.registerControlUiDescriptor(...)`
- `api.agent.events.registerAgentEventSubscription(...)`
- `api.agent.events.emitAgentEvent(...)`
- `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`
- `api.lifecycle.registerRuntimeLifecycle(...)`

Równoważne płaskie metody pozostają dostępne jako przestarzałe aliasy zgodności
dla istniejących pluginów. Nie dodawaj nowego kodu pluginu, który wywołuje
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` ani
`api.unscheduleSessionTurnsByTag` bezpośrednio.

`scheduleSessionTurn(...)` to wygodne API o zakresie sesji nad harmonogramem Gateway
Cron. Cron odpowiada za czas wykonywania i tworzy rekord zadania w tle, gdy
turn jest uruchamiany; Plugin SDK ogranicza tylko sesję docelową, nazewnictwo
własne pluginu i czyszczenie. Użyj `api.runtime.tasks.managedFlows` wewnątrz
zaplanowanego turn, gdy sama praca wymaga trwałego, wieloetapowego stanu Task Flow.

Kontrakty celowo rozdzielają uprawnienia:

- Zewnętrzne pluginy mogą być właścicielami rozszerzeń sesji, deskryptorów UI, poleceń, metadanych narzędzi, wstrzyknięć do następnego turn i zwykłych hooków.
- Zaufane polityki narzędzi uruchamiają się przed zwykłymi hookami `before_tool_call` i są dostępne tylko dla elementów dołączonych w pakiecie, ponieważ uczestniczą w polityce bezpieczeństwa hosta.
- Zastrzeżona własność poleceń jest dostępna tylko dla elementów dołączonych w pakiecie. Zewnętrzne pluginy powinny używać własnych nazw poleceń lub aliasów.
- `allowPromptInjection=false` wyłącza hooki modyfikujące prompt, w tym
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  pola promptu ze starszego `before_agent_start` oraz
  `enqueueNextTurnInjection`.

Przykłady konsumentów innych niż Plan:

| Archetyp pluginu             | Używane hooki                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow zatwierdzania            | Rozszerzenie sesji, kontynuacja polecenia, wstrzyknięcie do następnego turn, deskryptor UI                                                            |
| Bramka polityki budżetu/obszaru roboczego | Zaufana polityka narzędzi, metadane narzędzi, projekcja sesji                                                                                 |
| Monitor cyklu życia w tle | Czyszczenie cyklu życia runtime, subskrypcja zdarzeń agenta, własność/czyszczenie harmonogramu sesji, wkład Heartbeat do promptu, deskryptor UI |
| Kreator konfiguracji lub onboardingu   | Rozszerzenie sesji, polecenia o ograniczonym zakresie, deskryptor Control UI                                                                              |

<Note>
  Zastrzeżone główne przestrzenie nazw administratora (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) zawsze pozostają `operator.admin`, nawet jeśli plugin spróbuje przypisać
  węższy zakres metody Gateway. Preferuj prefiksy specyficzne dla pluginu dla
  metod będących własnością pluginu.
</Note>

<Accordion title="Kiedy używać middleware wyników narzędzi">
  Pluginy dołączone w pakiecie mogą używać `api.registerAgentToolResultMiddleware(...)`, gdy
  muszą przepisać wynik narzędzia po wykonaniu i zanim runtime
  przekaże ten wynik z powrotem do modelu. To zaufane, neutralne względem runtime
  połączenie dla asynchronicznych reduktorów wyjścia, takich jak tokenjuice.

Pluginy dołączone w pakiecie muszą zadeklarować `contracts.agentToolResultMiddleware` dla każdego
docelowego runtime, na przykład `["pi", "codex"]`. Zewnętrzne pluginy
nie mogą rejestrować tego middleware; zachowaj zwykłe hooki pluginów OpenClaw dla pracy,
która nie wymaga czasu wykonania wyniku narzędzia przed modelem. Stara ścieżka rejestracji
wbudowanej fabryki rozszerzeń tylko dla Pi została usunięta.
</Accordion>

### Rejestracja odkrywania Gateway

`api.registerGatewayDiscoveryService(...)` pozwala pluginowi ogłaszać aktywny
Gateway w lokalnym transporcie odkrywania, takim jak mDNS/Bonjour. OpenClaw wywołuje
usługę podczas uruchamiania Gateway, gdy lokalne odkrywanie jest włączone, przekazuje
bieżące porty Gateway i niesekretne dane podpowiedzi TXT oraz wywołuje zwrócony
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

Pluginy odkrywania Gateway nie mogą traktować ogłaszanych wartości TXT jako sekretów ani
uwierzytelniania. Odkrywanie jest podpowiedzią routingu; uwierzytelnianie Gateway i przypinanie TLS nadal
odpowiadają za zaufanie.

### Metadane rejestracji CLI

`api.registerCli(registrar, opts?)` akceptuje dwa rodzaje metadanych poleceń:

- `commands`: jawne nazwy poleceń będących własnością rejestratora
- `descriptors`: deskryptory poleceń używane podczas parsowania dla pomocy CLI,
  routingu i leniwej rejestracji CLI pluginu
- `parentPath`: opcjonalna ścieżka polecenia nadrzędnego dla zagnieżdżonych grup poleceń, takich jak
  `["nodes"]`

Dla funkcji sparowanych węzłów preferuj
`api.registerNodeCliFeature(registrar, opts?)`. To mały wrapper wokół
`api.registerCli(..., { parentPath: ["nodes"] })`, który sprawia, że polecenia takie jak
`openclaw nodes canvas` są jawnymi funkcjami węzłów będącymi własnością pluginu.

Jeśli chcesz, aby polecenie pluginu pozostało leniwie ładowane w zwykłej ścieżce głównej CLI,
podaj `descriptors`, które obejmują każdy główny korzeń poleceń najwyższego poziomu udostępniany przez ten
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
symboli zastępczych opartych na deskryptorach dla leniwego ładowania podczas parsowania.

### Rejestracja backendu CLI

`api.registerCliBackend(...)` pozwala pluginowi posiadać domyślną konfigurację dla lokalnego
backendu CLI AI, takiego jak `codex-cli`.

- `id` backendu staje się prefiksem dostawcy w referencjach modeli, takich jak `codex-cli/gpt-5`.
- `config` backendu używa tego samego kształtu co `agents.defaults.cliBackends.<id>`.
- Konfiguracja użytkownika nadal wygrywa. OpenClaw scala `agents.defaults.cliBackends.<id>` nad
  domyślną konfiguracją pluginu przed uruchomieniem CLI.
- Użyj `normalizeConfig`, gdy backend wymaga przepisania zgodności po scaleniu
  (na przykład normalizacji starych kształtów flag).
- Użyj `resolveExecutionArgs` dla przepisania argv o zakresie żądania, które należy do
  dialektu CLI, takiego jak mapowanie poziomów myślenia OpenClaw na natywną flagę effort.

Pełny przewodnik tworzenia znajdziesz w
[Pluginy backendu CLI](/pl/plugins/cli-backend-plugins).

### Wyłączne sloty

| Metoda                                     | Co rejestruje                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Silnik kontekstu (jeden aktywny naraz). Callback `assemble()` otrzymuje `availableTools` i `citationsMode`, aby silnik mógł dostosować dodatki do promptu. |
| `api.registerMemoryCapability(capability)` | Ujednolicona zdolność pamięci                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Builder sekcji promptu pamięci                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver planu opróżniania pamięci                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime pamięci                                                                                                                                    |

### Adaptery embeddingów pamięci

| Metoda                                         | Co rejestruje                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embeddingów pamięci dla aktywnego pluginu |

- `registerMemoryCapability` jest preferowanym, wyłącznym API pluginu pamięci.
- `registerMemoryCapability` może także udostępniać `publicArtifacts.listArtifacts(...)`,
  aby pluginy towarzyszące mogły konsumować wyeksportowane artefakty pamięci przez
  `openclaw/plugin-sdk/memory-host-core` zamiast sięgać do prywatnego układu konkretnego
  pluginu pamięci.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` i
  `registerMemoryRuntime` to zgodne ze starszymi wersjami, wyłączne API pluginu pamięci.
- `MemoryFlushPlan.model` może przypiąć turn opróżniania do dokładnej referencji
  `provider/model`, takiej jak `ollama/qwen3:8b`, bez dziedziczenia aktywnego łańcucha
  fallback.
- `registerMemoryEmbeddingProvider` pozwala aktywnemu pluginowi pamięci zarejestrować jeden
  lub więcej identyfikatorów adapterów embeddingów (na przykład `openai`, `gemini` albo niestandardowy
  identyfikator zdefiniowany przez plugin).
- Konfiguracja użytkownika, taka jak `agents.defaults.memorySearch.provider` i
  `agents.defaults.memorySearch.fallback`, jest rozwiązywana względem tych zarejestrowanych
  identyfikatorów adapterów.

### Zdarzenia i cykl życia

| Metoda                                       | Co robi                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Typowany hook cyklu życia          |
| `api.onConversationBindingResolved(handler)` | Callback powiązania konwersacji |

Zobacz [Hooki pluginów](/pl/plugins/hooks), aby uzyskać przykłady, typowe nazwy hooków i semantykę strażników.

### Semantyka decyzji hooków

- `before_tool_call`: zwrócenie `{ block: true }` jest końcowe. Gdy dowolny handler je ustawi, handlery o niższym priorytecie są pomijane.
- `before_tool_call`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `before_install`: zwrócenie `{ block: true }` jest końcowe. Gdy dowolny handler je ustawi, handlery o niższym priorytecie są pomijane.
- `before_install`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `reply_dispatch`: zwrócenie `{ handled: true, ... }` jest końcowe. Gdy dowolny handler przejmie wysyłkę, handlery o niższym priorytecie i domyślna ścieżka wysyłki modelu są pomijane.
- `message_sending`: zwrócenie `{ cancel: true }` jest końcowe. Gdy dowolny handler je ustawi, handlery o niższym priorytecie są pomijane.
- `message_sending`: zwrócenie `{ cancel: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `cancel`), a nie jako nadpisanie.
- `message_received`: użyj typowanego pola `threadId`, gdy potrzebujesz routingu przychodzącego wątku/tematu. Zachowaj `metadata` dla dodatków specyficznych dla kanału.
- `message_sending`: użyj typowanych pól routingu `replyToId` / `threadId`, zanim przejdziesz do specyficznego dla kanału `metadata`.
- `gateway_start`: użyj `ctx.config`, `ctx.workspaceDir` i `ctx.getCron?.()` dla stanu startowego będącego własnością Gateway zamiast polegać na wewnętrznych hookach `gateway:startup`.
- `cron_changed`: obserwuj zmiany cyklu życia Cron będącego własnością Gateway. Użyj `event.job?.state?.nextRunAtMs` i `ctx.getCron?.()` podczas synchronizacji zewnętrznych harmonogramów wybudzania i utrzymuj OpenClaw jako źródło prawdy dla sprawdzania terminów oraz wykonania.

### Pola obiektu API

| Pole                     | Typ                       | Opis                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identyfikator Plugin                                                                        |
| `api.name`               | `string`                  | Nazwa wyświetlana                                                                           |
| `api.version`            | `string?`                 | Wersja Plugin (opcjonalna)                                                                  |
| `api.description`        | `string?`                 | Opis Plugin (opcjonalny)                                                                    |
| `api.source`             | `string`                  | Ścieżka źródłowa Plugin                                                                     |
| `api.rootDir`            | `string?`                 | Katalog główny Plugin (opcjonalny)                                                          |
| `api.config`             | `OpenClawConfig`          | Bieżąca migawka konfiguracji (aktywna migawka środowiska uruchomieniowego w pamięci, gdy jest dostępna) |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfiguracja specyficzna dla Plugin z `plugins.entries.<id>.config`                         |
| `api.runtime`            | `PluginRuntime`           | [Pomocniki środowiska uruchomieniowego](/pl/plugins/sdk-runtime)                               |
| `api.logger`             | `PluginLogger`            | Logger o ograniczonym zakresie (`debug`, `info`, `warn`, `error`)                           |
| `api.registrationMode`   | `PluginRegistrationMode`  | Bieżący tryb ładowania; `"setup-runtime"` to lekkie okno uruchamiania/konfiguracji przed pełnym wejściem |
| `api.resolvePath(input)` | `(string) => string`      | Rozwiązuje ścieżkę względem katalogu głównego pluginu                                       |

## Konwencja modułów wewnętrznych

W obrębie pluginu używaj lokalnych plików zbiorczych do importów wewnętrznych:

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

Publiczne powierzchnie dołączonego pluginu ładowanego przez fasadę (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` i podobne publiczne pliki wejściowe) preferują
aktywną migawkę konfiguracji środowiska uruchomieniowego, gdy OpenClaw już działa. Jeśli migawka
środowiska uruchomieniowego jeszcze nie istnieje, przechodzą awaryjnie do rozwiązanego pliku konfiguracji na dysku.
Fasady spakowanych dołączonych pluginów powinny być ładowane przez loadery fasad pluginów
OpenClaw; bezpośrednie importy z `dist/extensions/...` omijają manifest
i kontrole runtime sidecar, których instalacje pakietowe używają dla kodu należącego do pluginu.

Pluginy dostawców mogą udostępniać wąski, lokalny dla pluginu plik zbiorczy kontraktu, gdy
pomocnik jest celowo specyficzny dla dostawcy i nie należy jeszcze do generycznej podścieżki SDK.
Dołączone przykłady:

- **Anthropic**: publiczna granica `api.ts` / `contract-api.ts` dla pomocników strumienia
  nagłówka beta Claude i `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` eksportuje konstruktory dostawcy,
  pomocniki modelu domyślnego i konstruktory dostawcy czasu rzeczywistego.
- **`@openclaw/openrouter-provider`**: `api.ts` eksportuje konstruktor dostawcy
  oraz pomocniki onboardingu/konfiguracji.

<Warning>
  Kod produkcyjny rozszerzenia powinien również unikać importów `openclaw/plugin-sdk/<other-plugin>`.
  Jeśli pomocnik jest naprawdę współdzielony, przenieś go do neutralnej podścieżki SDK,
  takiej jak `openclaw/plugin-sdk/speech`, `.../provider-model-shared` lub innej
  powierzchni zorientowanej na zdolności, zamiast sprzęgać dwa pluginy ze sobą.
</Warning>

## Powiązane

<CardGroup cols={2}>
  <Card title="Punkty wejścia" icon="door-open" href="/pl/plugins/sdk-entrypoints">
    Opcje `definePluginEntry` i `defineChannelPluginEntry`.
  </Card>
  <Card title="Pomocniki środowiska uruchomieniowego" icon="gears" href="/pl/plugins/sdk-runtime">
    Pełna referencja przestrzeni nazw `api.runtime`.
  </Card>
  <Card title="Konfiguracja początkowa i konfiguracja" icon="sliders" href="/pl/plugins/sdk-setup">
    Pakowanie, manifesty i schematy konfiguracji.
  </Card>
  <Card title="Testowanie" icon="vial" href="/pl/plugins/sdk-testing">
    Narzędzia testowe i reguły lintowania.
  </Card>
  <Card title="Migracja SDK" icon="arrows-turn-right" href="/pl/plugins/sdk-migration">
    Migracja z przestarzałych powierzchni.
  </Card>
  <Card title="Wewnętrzna architektura Plugin" icon="diagram-project" href="/pl/plugins/architecture">
    Szczegółowa architektura i model zdolności.
  </Card>
</CardGroup>
