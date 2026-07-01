---
read_when:
    - Musisz wiedzieć, z której podścieżki SDK importować
    - Potrzebujesz dokumentacji referencyjnej wszystkich metod rejestracji w OpenClawPluginApi
    - Sprawdzasz konkretny eksport SDK
sidebarTitle: Plugin SDK overview
summary: Mapa importów, dokumentacja API rejestracji i architektura SDK
title: Przegląd Plugin SDK
x-i18n:
    generated_at: "2026-07-01T20:38:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7df77e34db9b780ee0747a0f2178861624f528d9f7aec8592d6954a96869e96
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK Plugin jest typowanym kontraktem między Pluginami a rdzeniem. Ta strona jest
odniesieniem dla **tego, co importować** i **tego, co można rejestrować**.

<Note>
  Ta strona jest przeznaczona dla autorów Pluginów używających `openclaw/plugin-sdk/*` wewnątrz
  OpenClaw. W przypadku zewnętrznych aplikacji, skryptów, dashboardów, zadań CI i rozszerzeń IDE,
  które chcą uruchamiać agentów przez Gateway, użyj zamiast tego
  [integracji Gateway dla zewnętrznych aplikacji](/pl/gateway/external-apps).
</Note>

<Tip>
Szukasz raczej przewodnika krok po kroku? Zacznij od [Tworzenia Pluginów](/pl/plugins/building-plugins), użyj [Pluginów kanałów](/pl/plugins/sdk-channel-plugins) dla Pluginów kanałów, [Pluginów dostawców](/pl/plugins/sdk-provider-plugins) dla Pluginów dostawców, [Pluginów backendu CLI](/pl/plugins/cli-backend-plugins) dla lokalnych backendów AI CLI oraz [hooków Pluginów](/pl/plugins/hooks) dla Pluginów narzędzi lub hooków cyklu życia.
</Tip>

## Konwencja importu

Zawsze importuj z konkretnej ścieżki podrzędnej:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Każda ścieżka podrzędna jest małym, samodzielnym modułem. Dzięki temu uruchamianie pozostaje szybkie i
zapobiega problemom z zależnościami cyklicznymi. W przypadku pomocników wejścia/budowania specyficznych dla kanału
preferuj `openclaw/plugin-sdk/channel-core`; zostaw `openclaw/plugin-sdk/core` dla
szerszej powierzchni nadrzędnej i współdzielonych pomocników, takich jak
`buildChannelConfigSchema`.

Dla konfiguracji kanału publikuj należący do kanału JSON Schema przez
`openclaw.plugin.json#channelConfigs`. Ścieżka podrzędna `plugin-sdk/channel-config-schema`
jest przeznaczona dla współdzielonych prymitywów schematów i ogólnego buildera. Bundlowane
Pluginy OpenClaw używają `plugin-sdk/bundled-channel-config-schema` dla zachowanych
schematów bundlowanych kanałów. Przestarzałe eksporty zgodności pozostają w
`plugin-sdk/channel-config-schema-legacy`; żadna z bundlowanych ścieżek podrzędnych schematów nie jest
wzorem dla nowych Pluginów.

<Warning>
  Nie importuj brandowanych dla dostawców lub kanałów wygodnych seamów (na przykład
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Bundlowane Pluginy składają ogólne ścieżki podrzędne SDK wewnątrz własnych barrelów `api.ts` /
  `runtime-api.ts`; konsumenci rdzenia powinni używać tych lokalnych dla Pluginu
  barrelów albo dodać wąski ogólny kontrakt SDK, gdy potrzeba jest rzeczywiście
  międzykanałowa.

Mały zestaw seamów pomocniczych bundlowanych Pluginów nadal pojawia się w wygenerowanej mapie eksportów,
gdy mają śledzone użycie właściciela. Istnieją wyłącznie do utrzymania bundlowanych Pluginów
i nie są zalecanymi ścieżkami importu dla nowych zewnętrznych
Pluginów.

`openclaw/plugin-sdk/discord` i `openclaw/plugin-sdk/telegram-account` są
również zachowane jako przestarzałe fasady zgodności dla śledzonego użycia właściciela. Nie
kopiuj tych ścieżek importu do nowych Pluginów; zamiast tego używaj wstrzykniętych pomocników runtime i
ogólnych ścieżek podrzędnych SDK kanału.
</Warning>

## Odniesienie do ścieżek podrzędnych

SDK Plugin jest udostępniany jako zestaw wąskich ścieżek podrzędnych pogrupowanych według obszaru (wejście Pluginu,
kanał, dostawca, uwierzytelnianie, runtime, capability, memory oraz zarezerwowane
pomocniki bundlowanych Pluginów). Pełny katalog, pogrupowany i podlinkowany, znajdziesz w
[ścieżkach podrzędnych SDK Plugin](/pl/plugins/sdk-subpaths).

Inwentarz punktów wejścia kompilatora znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`; eksporty pakietu są generowane z
publicznego podzbioru po odjęciu lokalnych dla repozytorium ścieżek testowych/wewnętrznych wymienionych w
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Uruchom
`pnpm plugin-sdk:surface`, aby przeprowadzić audyt liczby publicznych eksportów. Przestarzałe publiczne
ścieżki podrzędne, które są wystarczająco stare i nieużywane przez kod produkcyjny bundlowanych rozszerzeń, są
śledzone w `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; szerokie
przestarzałe barrele reeksportów są śledzone w
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API rejestracji

Callback `register(api)` otrzymuje obiekt `OpenClawPluginApi` z tymi
metodami:

### Rejestracja capability

| Metoda                                           | Co rejestruje                            |
| ------------------------------------------------ | ---------------------------------------- |
| `api.registerProvider(...)`                      | Inferencja tekstowa (LLM)                |
| `api.registerAgentHarness(...)`                  | Eksperymentalny niskopoziomowy executor agenta |
| `api.registerCliBackend(...)`                    | Lokalny backend inferencji CLI           |
| `api.registerChannel(...)`                       | Kanał wiadomości                         |
| `api.registerEmbeddingProvider(...)`             | Dostawca embeddingów wektorowych wielokrotnego użytku |
| `api.registerSpeechProvider(...)`                | Synteza text-to-speech / STT             |
| `api.registerRealtimeTranscriptionProvider(...)` | Strumieniowa transkrypcja w czasie rzeczywistym |
| `api.registerRealtimeVoiceProvider(...)`         | Dupleksowe sesje głosowe w czasie rzeczywistym |
| `api.registerMediaUnderstandingProvider(...)`    | Analiza obrazów/audio/wideo              |
| `api.registerImageGenerationProvider(...)`       | Generowanie obrazów                      |
| `api.registerMusicGenerationProvider(...)`       | Generowanie muzyki                       |
| `api.registerVideoGenerationProvider(...)`       | Generowanie wideo                        |
| `api.registerWebFetchProvider(...)`              | Dostawca pobierania / scrapowania z sieci |
| `api.registerWebSearchProvider(...)`             | Wyszukiwanie w sieci                     |

Dostawcy embeddingów zarejestrowani za pomocą `api.registerEmbeddingProvider(...)` muszą
być także wymienieni w `contracts.embeddingProviders` w manifeście Pluginu. To
ogólna powierzchnia embeddingów do generowania wektorów wielokrotnego użytku. Wyszukiwanie pamięci
może korzystać z tej ogólnej powierzchni dostawcy. Starszy
seam `api.registerMemoryEmbeddingProvider(...)` i
`contracts.memoryEmbeddingProviders` jest przestarzałą zgodnością na czas migracji
istniejących dostawców specyficznych dla pamięci.

Dostawcy specyficzni dla pamięci, którzy nadal eksponują runtime `batchEmbed(...)`, pozostają przy
istniejącym kontrakcie batchowania per plik, chyba że ich runtime jawnie ustawia
`sourceWideBatchEmbed: true`. To włączenie pozwala hostowi pamięci przesyłać chunki z
wielu brudnych plików pamięci i włączonych źródeł w jednym wywołaniu `batchEmbed(...)` do
limitów batchy hosta. Adaptery batchy, które przesyłają pliki żądań JSONL, muszą
dzielić zadania dostawcy przed osiągnięciem limitu rozmiaru uploadu oraz limitu liczby
żądań. Dostawca musi zwrócić jeden embedding na każdy wejściowy chunk w tej samej kolejności co
`batch.chunks`; pomiń flagę, gdy dostawca oczekuje batchy lokalnych dla pliku lub
nie może zachować kolejności wejścia w większym zadaniu obejmującym całe źródło.

### Narzędzia i polecenia

Użyj [`defineToolPlugin`](/pl/plugins/tool-plugins) dla prostych Pluginów zawierających wyłącznie narzędzia
ze stałymi nazwami narzędzi. Użyj bezpośrednio `api.registerTool(...)` dla mieszanych Pluginów
lub w pełni dynamicznej rejestracji narzędzi.

| Metoda                          | Co rejestruje                                |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Narzędzie agenta (wymagane lub `{ optional: true }`) |
| `api.registerCommand(def)`      | Niestandardowe polecenie (omija LLM)         |

Polecenia Pluginu mogą ustawić `agentPromptGuidance`, gdy agent potrzebuje krótkiej,
należącej do polecenia wskazówki routingu. Zachowaj ten tekst o samym poleceniu; nie dodawaj
polityki specyficznej dla dostawcy lub Pluginu do builderów promptów rdzenia.

Wpisy wskazówek mogą być starszymi stringami, które mają zastosowanie do każdej powierzchni promptu, albo
wpisami strukturalnymi:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

Strukturalne `surfaces` mogą zawierać `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` lub `subagent`. `pi_main` pozostaje przestarzałym aliasem
dla `openclaw_main`. Pomiń `surfaces` dla celowych wskazówek obejmujących wszystkie powierzchnie. Nie
przekazuj pustej tablicy `surfaces`; jest odrzucana, aby przypadkowa utrata zakresu nie
stała się globalnym tekstem promptu.

Instrukcje deweloperskie natywnego serwera aplikacji Codex są bardziej rygorystyczne niż inne powierzchnie
promptów: tylko wskazówki jawnie ograniczone do `codex_app_server` są promowane do
tej ścieżki o wyższym priorytecie. Starsze wskazówki stringowe i nieograniczone zakresowo wskazówki strukturalne
pozostają dostępne dla powierzchni promptów innych niż Codex ze względu na zgodność.

### Infrastruktura

| Metoda                                         | Co rejestruje                           |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook zdarzenia                          |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | Metoda RPC Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | Lokalny anonsujący usługę odkrywania Gateway |
| `api.registerCli(registrar, opts?)`            | Podpolecenie CLI                        |
| `api.registerNodeCliFeature(registrar, opts?)` | Funkcja CLI Node pod `openclaw nodes`   |
| `api.registerService(service)`                 | Usługa w tle                            |
| `api.registerInteractiveHandler(registration)` | Interaktywny handler                    |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware runtime dla wyników narzędzi |
| `api.registerMemoryPromptSupplement(builder)`  | Addytywna sekcja promptu obok pamięci   |
| `api.registerMemoryCorpusSupplement(adapter)`  | Addytywny korpus wyszukiwania/odczytu pamięci |

### Hooki hosta dla Pluginów workflow

Hooki hosta są seamami SDK dla Pluginów, które muszą uczestniczyć w cyklu życia hosta
zamiast tylko dodawać dostawcę, kanał lub narzędzie. Są to
ogólne kontrakty; Plan Mode może ich używać, ale mogą też przepływy zatwierdzania,
bramki polityki workspace, monitory w tle, kreatory konfiguracji i towarzyszące
Pluginy UI.

| Metoda                                                                               | Kontrakt, za który odpowiada                                                                                                                               |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Stan sesji należący do Plugin, zgodny z JSON, rzutowany przez sesje Gateway                                                                                |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Trwały, dokładnie jednokrotny kontekst wstrzykiwany do następnej tury agenta dla jednej sesji                                                              |
| `api.registerTrustedToolPolicy(...)`                                                 | Zaufana polityka narzędzi przed Plugin, ograniczana manifestem, która może blokować lub przepisywać parametry narzędzia                                    |
| `api.registerToolMetadata(...)`                                                      | Metadane wyświetlania katalogu narzędzi bez zmiany implementacji narzędzia                                                                                 |
| `api.registerCommand(...)`                                                           | Zakresowe polecenia Plugin; wyniki poleceń mogą ustawiać `continueAgent: true` lub `suppressReply: true`; natywne polecenia Discord obsługują `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Deskryptory wkładu interfejsu sterowania dla powierzchni sesji, narzędzi, uruchomień lub ustawień                                                          |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Wywołania zwrotne czyszczenia zasobów runtime należących do Plugin na ścieżkach resetowania/usuwania/przeładowania                                        |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Oczyszczone subskrypcje zdarzeń dla stanu przepływu pracy i monitorów                                                                                      |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Tymczasowy stan roboczy Plugin na uruchomienie, czyszczony w końcowym cyklu życia uruchomienia                                                             |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadane czyszczenia zadań harmonogramu należących do Plugin; nie harmonogramuje pracy ani nie tworzy rekordów zadań                                       |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Dostarczanie załączników plikowych, tylko dla wbudowanych Plugin, pośredniczone przez host do aktywnej bezpośredniej trasy wychodzącej sesji                |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Zaplanowane tury sesji oparte na Cron, tylko dla wbudowanych Plugin, oraz czyszczenie według tagów                                                         |
| `api.session.controls.registerSessionAction(...)`                                    | Typowane akcje sesji, które klienci mogą wysyłać przez Gateway                                                                                             |

Używaj pogrupowanych przestrzeni nazw dla nowego kodu Plugin:

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

Równoważne płaskie metody pozostają dostępne jako przestarzałe aliasy
zgodności dla istniejących Plugin. Nie dodawaj nowego kodu Plugin, który
wywołuje bezpośrednio `api.registerSessionExtension`,
`api.enqueueNextTurnInjection`, `api.registerControlUiDescriptor`,
`api.registerRuntimeLifecycle`, `api.registerAgentEventSubscription`,
`api.emitAgentEvent`, `api.setRunContext`, `api.getRunContext`,
`api.clearRunContext`, `api.registerSessionSchedulerJob`,
`api.registerSessionAction`, `api.sendSessionAttachment`,
`api.scheduleSessionTurn` ani `api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` to wygodna funkcja o zakresie sesji nad
harmonogramem Cron Gateway. Cron odpowiada za czas i tworzy rekord zadania w tle,
gdy tura jest uruchamiana; Plugin SDK ogranicza tylko sesję docelową, nazewnictwo
należące do Plugin oraz czyszczenie. Użyj `api.runtime.tasks.managedFlows`
wewnątrz zaplanowanej tury, gdy sama praca wymaga trwałego, wieloetapowego stanu
Task Flow.

Kontrakty celowo rozdzielają uprawnienia:

- Zewnętrzne Plugin mogą odpowiadać za rozszerzenia sesji, deskryptory UI,
  polecenia, metadane narzędzi, wstrzyknięcia do następnej tury oraz zwykłe haki.
- Zaufane polityki narzędzi działają przed zwykłymi hakami `before_tool_call`
  i są zaufane przez hosta. Wbudowane polityki działają jako pierwsze; polityki
  zainstalowanych Plugin wymagają jawnego włączenia oraz ich lokalnych identyfikatorów
  w `contracts.trustedToolPolicies` i działają następnie w kolejności ładowania
  Plugin. Identyfikatory polityk są ograniczone do rejestrującego Plugin.
- Zarezerwowana własność poleceń jest dostępna tylko dla wbudowanych Plugin.
  Zewnętrzne Plugin powinny używać własnych nazw poleceń lub aliasów.
- `allowPromptInjection=false` wyłącza haki modyfikujące prompt, w tym
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  pola promptów ze starszego `before_agent_start` oraz
  `enqueueNextTurnInjection`.

Przykłady konsumentów spoza Plan:

| Archetyp Plugin              | Używane haki                                                                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Przepływ zatwierdzania       | Rozszerzenie sesji, kontynuacja polecenia, wstrzyknięcie do następnej tury, deskryptor UI                                             |
| Bramka polityki budżetu/przestrzeni roboczej | Zaufana polityka narzędzi, metadane narzędzi, projekcja sesji                                                           |
| Monitor cyklu życia w tle    | Czyszczenie cyklu życia runtime, subskrypcja zdarzeń agenta, własność/czyszczenie harmonogramu sesji, wkład promptu Heartbeat, deskryptor UI |
| Kreator konfiguracji lub wdrożenia | Rozszerzenie sesji, zakresowe polecenia, deskryptor interfejsu sterowania                                                        |

<Note>
  Zarezerwowane podstawowe przestrzenie nazw administracyjnych (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) zawsze pozostają `operator.admin`, nawet jeśli Plugin próbuje przypisać
  węższy zakres metody Gateway. Preferuj prefiksy specyficzne dla Plugin dla
  metod należących do Plugin.
</Note>

<Accordion title="When to use tool-result middleware">
  Wbudowane Plugin oraz jawnie włączone zainstalowane Plugin z pasującymi
  kontraktami manifestu mogą używać `api.registerAgentToolResultMiddleware(...)`,
  gdy muszą przepisać wynik narzędzia po wykonaniu i zanim runtime
  przekaże ten wynik z powrotem do modelu. To zaufany, neutralny względem runtime
  punkt rozszerzenia dla asynchronicznych reduktorów wyjścia, takich jak tokenjuice.

Plugin muszą deklarować `contracts.agentToolResultMiddleware` dla każdego docelowego
runtime, na przykład `["openclaw", "codex"]`. Zainstalowane Plugin bez tego
kontraktu albo bez jawnego włączenia nie mogą rejestrować tego middleware; zachowaj
zwykłe haki Plugin OpenClaw dla pracy, która nie wymaga taktowania wyniku
narzędzia przed modelem. Stara ścieżka rejestracji fabryki rozszerzeń tylko dla
osadzonego runnera została usunięta.
</Accordion>

### Rejestracja wykrywania Gateway

`api.registerGatewayDiscoveryService(...)` pozwala Plugin ogłaszać aktywny
Gateway w lokalnym transporcie wykrywania, takim jak mDNS/Bonjour. OpenClaw wywołuje
usługę podczas startu Gateway, gdy lokalne wykrywanie jest włączone, przekazuje
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

Plugin wykrywania Gateway nie mogą traktować ogłaszanych wartości TXT jako sekretów
ani uwierzytelniania. Wykrywanie jest wskazówką routingu; zaufanie nadal należy
do uwierzytelniania Gateway i przypinania TLS.

### Metadane rejestracji CLI

`api.registerCli(registrar, opts?)` przyjmuje dwa rodzaje metadanych poleceń:

- `commands`: jawne nazwy poleceń należące do rejestratora
- `descriptors`: deskryptory poleceń czasu parsowania używane do pomocy CLI,
  routingu i leniwej rejestracji CLI Plugin
- `parentPath`: opcjonalna ścieżka polecenia nadrzędnego dla zagnieżdżonych grup poleceń, takich jak
  `["nodes"]`

Dla funkcji sparowanych węzłów preferuj
`api.registerNodeCliFeature(registrar, opts?)`. To mały wrapper wokół
`api.registerCli(..., { parentPath: ["nodes"] })`, który czyni polecenia takie jak
`openclaw nodes canvas` jawnymi funkcjami węzłów należącymi do Plugin.

Jeśli chcesz, aby polecenie Plugin pozostało ładowane leniwie w normalnej ścieżce
głównego CLI, podaj `descriptors`, które obejmują każdy główny korzeń polecenia
najwyższego poziomu udostępniany przez ten rejestrator.

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

Używaj samego `commands` tylko wtedy, gdy nie potrzebujesz leniwej rejestracji
głównego CLI. Ta gorliwa ścieżka zgodności pozostaje obsługiwana, ale nie instaluje
symboli zastępczych opartych na deskryptorach dla leniwego ładowania podczas parsowania.

### Rejestracja backendu CLI

`api.registerCliBackend(...)` pozwala Plugin odpowiadać za domyślną konfigurację lokalnego
backendu CLI AI, takiego jak `claude-cli` lub `my-cli`.

- Backend `id` staje się prefiksem dostawcy w odwołaniach do modeli, takich jak `my-cli/gpt-5`.
- Backend `config` używa tego samego kształtu co `agents.defaults.cliBackends.<id>`.
- Konfiguracja użytkownika nadal ma pierwszeństwo. OpenClaw nakłada `agents.defaults.cliBackends.<id>` na
  domyślną konfigurację pluginu przed uruchomieniem CLI.
- Użyj `normalizeConfig`, gdy backend wymaga przepisania zgodności po scaleniu
  (na przykład normalizacji starych kształtów flag).
- Użyj `resolveExecutionArgs` do przepisywania argv w zakresie żądania, które należy do
  dialektu CLI, na przykład mapowania poziomów myślenia OpenClaw na natywną flagę
  wysiłku. Hook otrzymuje `ctx.executionMode`; użyj `"side-question"`, aby dodać
  natywne dla backendu flagi izolacji dla efemerycznych wywołań `/btw`. Jeśli te flagi
  niezawodnie wyłączają natywne narzędzia dla CLI, które poza tym są zawsze włączone, zadeklaruj
  także `sideQuestionToolMode: "disabled"`.

Pełny przewodnik tworzenia znajdziesz w
[pluginach backendów CLI](/pl/plugins/cli-backend-plugins).

### Wyłączne sloty

| Metoda                                     | Co rejestruje                                                                                                                                                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Silnik kontekstu (jeden aktywny naraz). Callbacki cyklu życia otrzymują `runtimeSettings`, gdy host może dostarczyć diagnostykę modelu/dostawcy/trybu; starsze ścisłe silniki są ponawiane bez tego klucza. |
| `api.registerMemoryCapability(capability)` | Ujednolicona funkcja pamięci                                                                                                                                                                                              |
| `api.registerMemoryPromptSection(builder)` | Konstruktor sekcji promptu pamięci                                                                                                                                                                                        |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver planu opróżniania pamięci                                                                                                                                                                                        |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime pamięci                                                                                                                                                                                                   |

### Przestarzałe adaptery osadzania pamięci

| Metoda                                         | Co rejestruje                                  |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter osadzania pamięci dla aktywnego pluginu |

- `registerMemoryCapability` jest preferowanym wyłącznym API pluginu pamięci.
- `registerMemoryCapability` może także udostępniać `publicArtifacts.listArtifacts(...)`,
  aby pluginy towarzyszące mogły korzystać z wyeksportowanych artefaktów pamięci przez
  `openclaw/plugin-sdk/memory-host-core` zamiast sięgać do prywatnego układu konkretnego
  pluginu pamięci.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` i
  `registerMemoryRuntime` to zgodne ze starszymi wersjami wyłączne API pluginu pamięci.
- `MemoryFlushPlan.model` może przypiąć turę opróżniania do dokładnego odwołania
  `provider/model`, takiego jak `ollama/qwen3:8b`, bez dziedziczenia aktywnego łańcucha
  fallback.
- `registerMemoryEmbeddingProvider` jest przestarzałe. Nowi dostawcy osadzania
  powinni używać `api.registerEmbeddingProvider(...)` i
  `contracts.embeddingProviders`.
- Istniejący dostawcy specyficzni dla pamięci nadal działają w oknie migracji,
  ale inspekcja pluginu zgłasza to jako dług zgodności dla
  pluginów niedostarczanych w pakiecie.

### Zdarzenia i cykl życia

| Metoda                                       | Co robi                         |
| -------------------------------------------- | ------------------------------- |
| `api.on(hookName, handler, opts?)`           | Typowany hook cyklu życia       |
| `api.onConversationBindingResolved(handler)` | Callback powiązania konwersacji |

Zobacz [hooki pluginów](/pl/plugins/hooks), aby poznać przykłady, typowe nazwy hooków i
semantykę zabezpieczeń.

### Semantyka decyzji hooków

`before_install` jest hookiem cyklu życia runtime pluginu, a nie powierzchnią zasad
instalacji operatora. Użyj `security.installPolicy`, gdy decyzja zezwolenia/blokady musi
obejmować ścieżki instalacji lub aktualizacji oparte na CLI i Gateway.

- `before_tool_call`: zwrócenie `{ block: true }` jest terminalne. Gdy dowolny handler je ustawi, handlery o niższym priorytecie są pomijane.
- `before_tool_call`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `before_install`: zwrócenie `{ block: true }` jest terminalne. Gdy dowolny handler je ustawi, handlery o niższym priorytecie są pomijane.
- `before_install`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `reply_dispatch`: zwrócenie `{ handled: true, ... }` jest terminalne. Gdy dowolny handler przejmie wysyłkę, handlery o niższym priorytecie oraz domyślna ścieżka wysyłki modelu są pomijane.
- `message_sending`: zwrócenie `{ cancel: true }` jest terminalne. Gdy dowolny handler je ustawi, handlery o niższym priorytecie są pomijane.
- `message_sending`: zwrócenie `{ cancel: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `cancel`), a nie jako nadpisanie.
- `message_received`: użyj typowanego pola `threadId`, gdy potrzebujesz routingu przychodzącego wątku/tematu. Zachowaj `metadata` dla dodatków specyficznych dla kanału.
- `message_sending`: użyj typowanych pól routingu `replyToId` / `threadId` przed przejściem na specyficzne dla kanału `metadata`.
- `gateway_start`: użyj `ctx.config`, `ctx.workspaceDir` i `ctx.getCron?.()` dla stanu uruchamiania należącego do Gateway zamiast polegać na wewnętrznych hookach `gateway:startup`.
- `cron_changed`: obserwuj zmiany cyklu życia cron należącego do Gateway. Użyj `event.job?.state?.nextRunAtMs` i `ctx.getCron?.()` podczas synchronizowania zewnętrznych harmonogramów wybudzeń oraz zachowaj OpenClaw jako źródło prawdy dla kontroli terminów i wykonania.

### Pola obiektu API

| Pole                     | Typ                       | Opis                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identyfikator pluginu                                                                       |
| `api.name`               | `string`                  | Nazwa wyświetlana                                                                           |
| `api.version`            | `string?`                 | Wersja pluginu (opcjonalna)                                                                 |
| `api.description`        | `string?`                 | Opis pluginu (opcjonalny)                                                                   |
| `api.source`             | `string`                  | Ścieżka źródłowa pluginu                                                                    |
| `api.rootDir`            | `string?`                 | Katalog główny pluginu (opcjonalny)                                                         |
| `api.config`             | `OpenClawConfig`          | Bieżący snapshot konfiguracji (aktywny snapshot runtime w pamięci, gdy jest dostępny)       |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfiguracja specyficzna dla pluginu z `plugins.entries.<id>.config`                        |
| `api.runtime`            | `PluginRuntime`           | [Helpery runtime](/pl/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger o określonym zakresie (`debug`, `info`, `warn`, `error`)                             |
| `api.registrationMode`   | `PluginRegistrationMode`  | Bieżący tryb ładowania; `"setup-runtime"` to lekkie okno uruchamiania/konfiguracji przed pełnym wpisem |
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
  z kodu produkcyjnego. Kieruj importy wewnętrzne przez `./api.ts` lub
  `./runtime-api.ts`. Ścieżka SDK jest wyłącznie kontraktem zewnętrznym.
</Warning>

Publiczne powierzchnie pluginów pakietowych ładowanych przez fasadę (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` oraz podobne publiczne pliki wejściowe) preferują
aktywny snapshot konfiguracji runtime, gdy OpenClaw już działa. Jeśli snapshot runtime
jeszcze nie istnieje, wracają do rozpoznanego pliku konfiguracji na dysku.
Fasady spakowanych pluginów pakietowych powinny być ładowane przez loadery fasad pluginów
OpenClaw; bezpośrednie importy z `dist/extensions/...` omijają manifest
i kontrole sidecar runtime, których spakowane instalacje używają dla kodu należącego do pluginu.

Pluginy dostawców mogą udostępniać wąski, lokalny dla pluginu plik zbiorczy kontraktu, gdy
helper jest celowo specyficzny dla dostawcy i nie należy jeszcze do ogólnej podścieżki SDK.
Przykłady pakietowe:

- **Anthropic**: publiczny szew `api.ts` / `contract-api.ts` dla helperów strumienia
  beta-header Claude i `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` eksportuje konstruktory dostawców,
  helpery modeli domyślnych i konstruktory dostawców realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` eksportuje konstruktor dostawcy
  oraz helpery onboardingu/konfiguracji.

<Warning>
  Kod produkcyjny rozszerzeń powinien także unikać importów `openclaw/plugin-sdk/<other-plugin>`.
  Jeśli helper jest naprawdę współdzielony, przenieś go do neutralnej podścieżki SDK,
  takiej jak `openclaw/plugin-sdk/speech`, `.../provider-model-shared` lub innej
  powierzchni zorientowanej na funkcję, zamiast sprzęgać dwa pluginy ze sobą.
</Warning>

## Powiązane

<CardGroup cols={2}>
  <Card title="Punkty wejścia" icon="door-open" href="/pl/plugins/sdk-entrypoints">
    Opcje `definePluginEntry` i `defineChannelPluginEntry`.
  </Card>
  <Card title="Helpery runtime" icon="gears" href="/pl/plugins/sdk-runtime">
    Pełne odniesienie do przestrzeni nazw `api.runtime`.
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
  <Card title="Wewnętrzna architektura pluginów" icon="diagram-project" href="/pl/plugins/architecture">
    Głęboka architektura i model funkcji.
  </Card>
</CardGroup>
