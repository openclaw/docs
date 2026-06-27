---
read_when:
    - Musisz wiedzieć, z której podścieżki SDK importować
    - Chcesz uzyskać odniesienie do wszystkich metod rejestracji w OpenClawPluginApi
    - Wyszukujesz konkretny eksport SDK
sidebarTitle: Plugin SDK overview
summary: Mapa importów, dokumentacja API rejestracji i architektura SDK
title: Omówienie Plugin SDK
x-i18n:
    generated_at: "2026-06-27T18:05:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69321b569f7609c6ee9312f0234ce94f274bf03822df61988f34e1effb55339e
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK Pluginów jest typowanym kontraktem między Pluginami a rdzeniem. Ta strona jest
odniesieniem dla **tego, co importować** i **tego, co można rejestrować**.

<Note>
  Ta strona jest przeznaczona dla autorów Pluginów używających `openclaw/plugin-sdk/*` wewnątrz
  OpenClaw. W przypadku aplikacji zewnętrznych, skryptów, pulpitów, zadań CI i rozszerzeń IDE,
  które chcą uruchamiać agentów przez Gateway, użyj zamiast tego
  [Integracji Gateway dla aplikacji zewnętrznych](/pl/gateway/external-apps).
</Note>

<Tip>
Szukasz raczej przewodnika krok po kroku? Zacznij od [Tworzenia Pluginów](/pl/plugins/building-plugins), użyj [Pluginów kanałów](/pl/plugins/sdk-channel-plugins) dla Pluginów kanałów, [Pluginów dostawców](/pl/plugins/sdk-provider-plugins) dla Pluginów dostawców, [Pluginów backendu CLI](/pl/plugins/cli-backend-plugins) dla lokalnych backendów CLI AI oraz [Hooków Pluginów](/pl/plugins/hooks) dla Pluginów narzędzi lub hooków cyklu życia.
</Tip>

## Konwencja importu

Zawsze importuj z konkretnej ścieżki podrzędnej:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Każda ścieżka podrzędna jest małym, samowystarczalnym modułem. Dzięki temu uruchamianie pozostaje szybkie i
unika się problemów z zależnościami cyklicznymi. Dla pomocników wejścia/budowania specyficznych dla kanałów
preferuj `openclaw/plugin-sdk/channel-core`; zachowaj `openclaw/plugin-sdk/core` dla
szerszej powierzchni parasolowej i współdzielonych pomocników, takich jak
`buildChannelConfigSchema`.

W przypadku konfiguracji kanału opublikuj należący do kanału JSON Schema przez
`openclaw.plugin.json#channelConfigs`. Ścieżka podrzędna `plugin-sdk/channel-config-schema`
służy do współdzielonych prymitywów schematów i generycznego buildera. Wbudowane Pluginy OpenClaw
używają `plugin-sdk/bundled-channel-config-schema` dla zachowanych schematów
kanałów wbudowanych. Przestarzałe eksporty zgodności pozostają w
`plugin-sdk/channel-config-schema-legacy`; żadna ze ścieżek podrzędnych schematów wbudowanych nie jest
wzorcem dla nowych Pluginów.

<Warning>
  Nie importuj oznaczonych marką dostawcy lub kanału wygodnych punktów styku (na przykład
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Wbudowane Pluginy komponują generyczne ścieżki podrzędne SDK wewnątrz własnych beczek `api.ts` /
  `runtime-api.ts`; konsumenci rdzenia powinni albo używać tych lokalnych dla Pluginu
  beczek, albo dodać wąski generyczny kontrakt SDK, gdy potrzeba jest naprawdę
  międzykanałowa.

Niewielki zestaw pomocniczych punktów styku wbudowanych Pluginów nadal pojawia się w wygenerowanej mapie eksportów,
gdy mają śledzone użycie przez właścicieli. Istnieją wyłącznie na potrzeby utrzymania wbudowanych Pluginów
i nie są zalecanymi ścieżkami importu dla nowych Pluginów firm trzecich.

`openclaw/plugin-sdk/discord` i `openclaw/plugin-sdk/telegram-account` są
również zachowane jako przestarzałe fasady zgodności dla śledzonego użycia przez właścicieli. Nie
kopiuj tych ścieżek importu do nowych Pluginów; używaj zamiast tego wstrzykniętych pomocników runtime i
generycznych ścieżek podrzędnych SDK kanałów.
</Warning>

## Odniesienie ścieżek podrzędnych

SDK Pluginów jest udostępniany jako zestaw wąskich ścieżek podrzędnych pogrupowanych według obszaru (wejście
Pluginu, kanał, dostawca, uwierzytelnianie, runtime, capability, pamięć oraz zarezerwowane
pomocniki wbudowanych Pluginów). Pełny katalog, pogrupowany i z linkami, znajdziesz w
[Ścieżkach podrzędnych SDK Pluginów](/pl/plugins/sdk-subpaths).

Inwentarz punktów wejścia kompilatora znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`; eksporty pakietu są generowane z
publicznego podzbioru po odjęciu lokalnych dla repozytorium testowych/wewnętrznych ścieżek podrzędnych wymienionych w
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Uruchom
`pnpm plugin-sdk:surface`, aby skontrolować liczbę publicznych eksportów. Przestarzałe publiczne
ścieżki podrzędne, które są wystarczająco stare i nieużywane przez kod produkcyjny wbudowanych rozszerzeń, są
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
| `api.registerAgentHarness(...)`                  | Eksperymentalny niskopoziomowy executor agenta |
| `api.registerCliBackend(...)`                    | Lokalny backend wnioskowania CLI       |
| `api.registerChannel(...)`                       | Kanał wiadomości                       |
| `api.registerEmbeddingProvider(...)`             | Wielokrotnego użytku dostawca embeddingów wektorowych |
| `api.registerSpeechProvider(...)`                | Synteza text-to-speech / STT           |
| `api.registerRealtimeTranscriptionProvider(...)` | Strumieniowa transkrypcja w czasie rzeczywistym |
| `api.registerRealtimeVoiceProvider(...)`         | Dupleksowe sesje głosowe w czasie rzeczywistym |
| `api.registerMediaUnderstandingProvider(...)`    | Analiza obrazów/audio/wideo            |
| `api.registerImageGenerationProvider(...)`       | Generowanie obrazów                    |
| `api.registerMusicGenerationProvider(...)`       | Generowanie muzyki                     |
| `api.registerVideoGenerationProvider(...)`       | Generowanie wideo                      |
| `api.registerWebFetchProvider(...)`              | Dostawca pobierania / scrapowania z sieci |
| `api.registerWebSearchProvider(...)`             | Wyszukiwanie w sieci                   |

Dostawcy embeddingów zarejestrowani za pomocą `api.registerEmbeddingProvider(...)` muszą
również być wymienieni w `contracts.embeddingProviders` w manifeście Pluginu. Jest to
generyczna powierzchnia embeddingów do wielokrotnego generowania wektorów. Wyszukiwanie w pamięci
może korzystać z tej generycznej powierzchni dostawcy. Starszy punkt styku
`api.registerMemoryEmbeddingProvider(...)` oraz
`contracts.memoryEmbeddingProviders` jest przestarzałą zgodnością na czas migracji
istniejących dostawców specyficznych dla pamięci.

Dostawcy specyficzni dla pamięci, którzy nadal udostępniają runtime `batchEmbed(...)`, pozostają przy
istniejącym kontrakcie wsadowania per plik, chyba że ich runtime jawnie ustawia
`sourceWideBatchEmbed: true`. Ta opcja pozwala hostowi pamięci przekazywać fragmenty z
wielu zmienionych plików pamięci i włączonych źródeł w jednym wywołaniu `batchEmbed(...)` aż
do limitów wsadu hosta. Adaptery wsadowe, które przesyłają pliki żądań JSONL, muszą
dzielić zadania dostawcy przed osiągnięciem zarówno limitu rozmiaru przesyłania, jak i limitu liczby żądań.
Dostawca musi zwrócić jeden embedding na każdy fragment wejściowy w tej samej kolejności co
`batch.chunks`; pomiń flagę, gdy dostawca oczekuje wsadów lokalnych dla pliku lub
nie może zachować kolejności wejścia w większym zadaniu obejmującym całe źródło.

### Narzędzia i polecenia

Użyj [`defineToolPlugin`](/pl/plugins/tool-plugins) dla prostych Pluginów zawierających tylko narzędzia
ze stałymi nazwami narzędzi. Użyj `api.registerTool(...)` bezpośrednio dla mieszanych Pluginów
lub w pełni dynamicznej rejestracji narzędzi.

| Metoda                         | Co rejestruje                              |
| ------------------------------ | ------------------------------------------ |
| `api.registerTool(tool, opts?)` | Narzędzie agenta (wymagane lub `{ optional: true }`) |
| `api.registerCommand(def)`      | Niestandardowe polecenie (omija LLM)       |

Polecenia Pluginu mogą ustawić `agentPromptGuidance`, gdy agent potrzebuje krótkiej,
należącej do polecenia wskazówki routingu. Utrzymuj ten tekst wokół samego polecenia; nie dodawaj
polityki specyficznej dla dostawcy lub Pluginu do builderów promptów rdzenia.

Wpisy wskazówek mogą być starszymi ciągami znaków, które stosują się do każdej powierzchni promptu, albo
wpisami strukturalnymi:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

Strukturalne `surfaces` mogą obejmować `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` lub `subagent`. `pi_main` pozostaje przestarzałym aliasem
dla `openclaw_main`. Pomiń `surfaces` dla celowo ogólnopowierzchniowych wskazówek. Nie
przekazuj pustej tablicy `surfaces`; jest odrzucana, aby przypadkowa utrata zakresu nie
stała się globalnym tekstem promptu.

Natywne instrukcje deweloperskie serwera aplikacji Codex są bardziej rygorystyczne niż inne powierzchnie
promptów: tylko wskazówki jawnie ograniczone do `codex_app_server` są promowane do
tej ścieżki o wyższym priorytecie. Starsze wskazówki w postaci ciągów znaków i nieskopowane wskazówki
strukturalne pozostają dostępne dla powierzchni promptów innych niż Codex dla zgodności.

### Infrastruktura

| Metoda                                         | Co rejestruje                          |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook zdarzeń                           |
| `api.registerHttpRoute(params)`                | Punkt końcowy HTTP Gateway             |
| `api.registerGatewayMethod(name, handler)`     | Metoda RPC Gateway                     |
| `api.registerGatewayDiscoveryService(service)` | Reklamodawca lokalnego wykrywania Gateway |
| `api.registerCli(registrar, opts?)`            | Podpolecenie CLI                       |
| `api.registerNodeCliFeature(registrar, opts?)` | Funkcja CLI Node pod `openclaw nodes`  |
| `api.registerService(service)`                 | Usługa w tle                           |
| `api.registerInteractiveHandler(registration)` | Handler interaktywny                   |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware runtime dla wyników narzędzi |
| `api.registerMemoryPromptSupplement(builder)`  | Addytywna sekcja promptu sąsiadująca z pamięcią |
| `api.registerMemoryCorpusSupplement(adapter)`  | Addytywny korpus wyszukiwania/odczytu pamięci |

### Hooki hosta dla Pluginów workflow

Hooki hosta są punktami styku SDK dla Pluginów, które muszą uczestniczyć w cyklu życia
hosta, a nie tylko dodawać dostawcę, kanał lub narzędzie. Są to
generyczne kontrakty; tryb planu może z nich korzystać, ale tak samo mogą workflow zatwierdzania,
bramki polityk przestrzeni roboczej, monitory w tle, kreatory konfiguracji oraz towarzyszące
Pluginy UI.

| Metoda                                                                               | Kontrakt, który posiada                                                                                                                  |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Stan sesji należący do Plugin, zgodny z JSON, rzutowany przez sesje Gateway                                                    |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Trwały, dokładnie jednokrotny kontekst wstrzykiwany do następnej tury agenta dla jednej sesji                                                    |
| `api.registerTrustedToolPolicy(...)`                                                 | Zaufana polityka narzędzi przed pluginem, ograniczona manifestem, która może blokować lub przepisywać parametry narzędzia                                               |
| `api.registerToolMetadata(...)`                                                      | Metadane wyświetlania katalogu narzędzi bez zmiany implementacji narzędzia                                                            |
| `api.registerCommand(...)`                                                           | Polecenia Plugin o ograniczonym zakresie; wyniki poleceń mogą ustawiać `continueAgent: true`; natywne polecenia Discord obsługują `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Deskryptory wkładów Control UI dla powierzchni sesji, narzędzi, uruchomień lub ustawień                                                  |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Wywołania zwrotne czyszczenia zasobów runtime należących do Plugin na ścieżkach resetowania/usuwania/przeładowania                                                 |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Oczyszczone subskrypcje zdarzeń dla stanu workflow i monitorów                                                                     |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Tymczasowy stan Plugin dla pojedynczego uruchomienia, czyszczony w terminalnym cyklu życia uruchomienia                                                                    |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Metadane czyszczenia dla zadań harmonogramu należących do Plugin; nie planuje pracy ani nie tworzy rekordów zadań                                   |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Dostarczanie załączników plików tylko dla wbudowanych pluginów, pośredniczone przez hosta, do aktywnej bezpośredniej trasy wychodzącej sesji                                   |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Zaplanowane tury sesji oparte na Cron, tylko dla wbudowanych pluginów, oraz czyszczenie oparte na tagach                                                           |
| `api.session.controls.registerSessionAction(...)`                                    | Typowane akcje sesji, które klienci mogą wysyłać przez Gateway                                                                    |

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

Równoważne płaskie metody pozostają dostępne jako przestarzałe aliasy
zgodności dla istniejących pluginów. Nie dodawaj nowego kodu pluginu, który
wywołuje bezpośrednio `api.registerSessionExtension`,
`api.enqueueNextTurnInjection`, `api.registerControlUiDescriptor`,
`api.registerRuntimeLifecycle`, `api.registerAgentEventSubscription`,
`api.emitAgentEvent`, `api.setRunContext`, `api.getRunContext`,
`api.clearRunContext`, `api.registerSessionSchedulerJob`,
`api.registerSessionAction`, `api.sendSessionAttachment`,
`api.scheduleSessionTurn` ani `api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` to wygodna, sesyjna nakładka na harmonogram Cron
Gateway. Cron odpowiada za czas i tworzy rekord zadania w tle, gdy tura
zostaje uruchomiona; Plugin SDK ogranicza tylko docelową sesję, nazewnictwo
należące do pluginu i czyszczenie. Używaj `api.runtime.tasks.managedFlows`
wewnątrz zaplanowanej tury, gdy sama praca wymaga trwałego, wieloetapowego
stanu Task Flow.

Kontrakty celowo rozdzielają uprawnienia:

- Zewnętrzne pluginy mogą posiadać rozszerzenia sesji, deskryptory UI,
  polecenia, metadane narzędzi, wstrzyknięcia następnej tury i zwykłe hooki.
- Zaufane polityki narzędzi działają przed zwykłymi hookami `before_tool_call`
  i są zaufane przez hosta. Wbudowane polityki działają jako pierwsze; polityki
  zainstalowanych pluginów wymagają jawnego włączenia oraz ich lokalnych id w
  `contracts.trustedToolPolicies`, a następnie działają w kolejności ładowania
  pluginów. Identyfikatory polityk są ograniczone do rejestrującego pluginu.
- Zastrzeżona własność poleceń jest dostępna tylko dla wbudowanych pluginów.
  Zewnętrzne pluginy powinny używać własnych nazw poleceń lub aliasów.
- `allowPromptInjection=false` wyłącza hooki modyfikujące prompt, w tym
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  pola promptu ze starszego `before_agent_start` oraz
  `enqueueNextTurnInjection`.

Przykłady konsumentów innych niż Plan:

| Archetyp Plugin             | Używane hooki                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow zatwierdzania            | Rozszerzenie sesji, kontynuacja polecenia, wstrzyknięcie następnej tury, deskryptor UI                                                            |
| Brama polityki budżetu/przestrzeni roboczej | Zaufana polityka narzędzi, metadane narzędzi, projekcja sesji                                                                                 |
| Monitor cyklu życia w tle | Czyszczenie cyklu życia runtime, subskrypcja zdarzeń agenta, własność/czyszczenie harmonogramu sesji, wkład promptu Heartbeat, deskryptor UI |
| Kreator konfiguracji lub onboardingu   | Rozszerzenie sesji, polecenia o ograniczonym zakresie, deskryptor Control UI                                                                              |

<Note>
  Zastrzeżone główne przestrzenie nazw administratora (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) zawsze pozostają `operator.admin`, nawet jeśli plugin próbuje przypisać
  węższy zakres metody Gateway. Preferuj prefiksy specyficzne dla pluginu dla
  metod należących do pluginu.
</Note>

<Accordion title="Kiedy używać middleware wyników narzędzi">
  Wbudowane pluginy i jawnie włączone zainstalowane pluginy z pasującymi
  kontraktami manifestu mogą używać `api.registerAgentToolResultMiddleware(...)`, gdy
  muszą przepisać wynik narzędzia po wykonaniu i zanim runtime
  przekaże ten wynik z powrotem do modelu. To zaufany, neutralny względem runtime
  punkt rozszerzeń dla asynchronicznych reduktorów wyjścia, takich jak tokenjuice.

Pluginy muszą deklarować `contracts.agentToolResultMiddleware` dla każdego docelowego
runtime, na przykład `["openclaw", "codex"]`. Zainstalowane pluginy bez tego
kontraktu lub bez jawnego włączenia nie mogą rejestrować tego middleware; zachowaj
zwykłe hooki pluginów OpenClaw dla pracy, która nie wymaga czasu wykonania wyniku
narzędzia przed modelem. Stara ścieżka rejestracji fabryki rozszerzeń
tylko dla osadzonego runnera została usunięta.
</Accordion>

### Rejestracja wykrywania Gateway

`api.registerGatewayDiscoveryService(...)` pozwala pluginowi ogłaszać aktywny
Gateway w lokalnym transporcie wykrywania, takim jak mDNS/Bonjour. OpenClaw wywołuje
usługę podczas uruchamiania Gateway, gdy lokalne wykrywanie jest włączone, przekazuje
bieżące porty Gateway i niesekretne dane wskazówek TXT oraz wywołuje zwrócony
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

Pluginy wykrywania Gateway nie mogą traktować ogłaszanych wartości TXT jako sekretów
ani uwierzytelnienia. Wykrywanie jest wskazówką routingu; uwierzytelnianie Gateway
i przypinanie TLS nadal odpowiadają za zaufanie.

### Metadane rejestracji CLI

`api.registerCli(registrar, opts?)` przyjmuje dwa rodzaje metadanych poleceń:

- `commands`: jawne nazwy poleceń należące do rejestratora
- `descriptors`: deskryptory poleceń czasu parsowania używane do pomocy CLI,
  routingu i leniwej rejestracji CLI pluginu
- `parentPath`: opcjonalna ścieżka polecenia nadrzędnego dla zagnieżdżonych grup poleceń, takich jak
  `["nodes"]`

Dla funkcji sparowanych węzłów preferuj
`api.registerNodeCliFeature(registrar, opts?)`. To mała nakładka na
`api.registerCli(..., { parentPath: ["nodes"] })`, która sprawia, że polecenia takie jak
`openclaw nodes canvas` są jawnymi funkcjami węzłów należącymi do pluginu.

Jeśli chcesz, aby polecenie pluginu pozostało leniwie ładowane w normalnej głównej ścieżce CLI,
podaj `descriptors`, które obejmują każdy korzeń polecenia najwyższego poziomu udostępniany przez ten
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
placeholderów opartych na deskryptorach dla leniwego ładowania w czasie parsowania.

### Rejestracja backendu CLI

`api.registerCliBackend(...)` pozwala pluginowi posiadać domyślną konfigurację lokalnego
backendu AI CLI, takiego jak `claude-cli` lub `my-cli`.

- Backend `id` staje się prefiksem dostawcy w referencjach modeli, takich jak `my-cli/gpt-5`.
- Backend `config` używa tego samego kształtu co `agents.defaults.cliBackends.<id>`.
- Konfiguracja użytkownika nadal wygrywa. OpenClaw scala `agents.defaults.cliBackends.<id>` nad
  domyślną konfiguracją pluginu przed uruchomieniem CLI.
- Użyj `normalizeConfig`, gdy backend wymaga przepisań zgodności po scaleniu
  (na przykład normalizacji starych kształtów flag).
- Użyj `resolveExecutionArgs` do przepisań argv ograniczonych do żądania, które należą do
  dialektu CLI, takich jak mapowanie poziomów myślenia OpenClaw na natywną flagę
  wysiłku. Hook otrzymuje `ctx.executionMode`; użyj `"side-question"`, aby dodać
  natywne dla backendu flagi izolacji dla efemerycznych wywołań `/btw`. Jeśli te flagi
  niezawodnie wyłączają natywne narzędzia dla CLI, które w przeciwnym razie są zawsze włączone, zadeklaruj
  także `sideQuestionToolMode: "disabled"`.

Pełny przewodnik tworzenia znajdziesz w
[pluginach backendu CLI](/pl/plugins/cli-backend-plugins).

### Wyłączne sloty

| Metoda                                     | Co rejestruje                                                                                                                                                                                                                      |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Silnik kontekstu (jeden aktywny naraz). Wywołania zwrotne cyklu życia otrzymują `runtimeSettings`, gdy host może dostarczyć diagnostykę modelu/dostawcy/trybu; starsze ścisłe silniki są ponawiane bez tego klucza. |
| `api.registerMemoryCapability(capability)` | Ujednolicona funkcjonalność pamięci                                                                                                                                                                                                |
| `api.registerMemoryPromptSection(builder)` | Konstruktor sekcji promptu pamięci                                                                                                                                                                                                 |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver planu opróżniania pamięci                                                                                                                                                                                                 |
| `api.registerMemoryRuntime(runtime)`       | Adapter środowiska uruchomieniowego pamięci                                                                                                                                                                                        |

### Przestarzałe adaptery osadzeń pamięci

| Metoda                                         | Co rejestruje                                |
| ---------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter osadzeń pamięci dla aktywnego pluginu |

- `registerMemoryCapability` to preferowane wyłączne API pluginu pamięci.
- `registerMemoryCapability` może także udostępniać `publicArtifacts.listArtifacts(...)`,
  aby pluginy towarzyszące mogły używać wyeksportowanych artefaktów pamięci przez
  `openclaw/plugin-sdk/memory-host-core` zamiast sięgać do prywatnego układu
  konkretnego pluginu pamięci.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` i
  `registerMemoryRuntime` to zgodne ze starszymi wersjami wyłączne API pluginu pamięci.
- `MemoryFlushPlan.model` może przypiąć turę opróżniania do dokładnego odwołania
  `provider/model`, takiego jak `ollama/qwen3:8b`, bez dziedziczenia aktywnego
  łańcucha rezerwowego.
- `registerMemoryEmbeddingProvider` jest przestarzałe. Nowi dostawcy osadzeń
  powinni używać `api.registerEmbeddingProvider(...)` oraz
  `contracts.embeddingProviders`.
- Istniejący dostawcy specyficzni dla pamięci nadal działają w okresie migracji,
  ale inspekcja pluginu zgłasza to jako dług zgodności dla pluginów
  niedostarczanych w pakiecie.

### Zdarzenia i cykl życia

| Metoda                                       | Co robi                       |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Typowany hook cyklu życia     |
| `api.onConversationBindingResolved(handler)` | Wywołanie zwrotne powiązania konwersacji |

Zobacz [Hooki pluginów](/pl/plugins/hooks), aby poznać przykłady, popularne nazwy hooków
i semantykę guardów.

### Semantyka decyzji hooków

`before_install` jest hookiem cyklu życia środowiska uruchomieniowego pluginu, a nie
powierzchnią polityki instalacji operatora. Użyj `security.installPolicy`, gdy decyzja
allow/block musi obejmować ścieżki instalacji lub aktualizacji przez CLI i Gateway.

- `before_tool_call`: zwrócenie `{ block: true }` jest terminalne. Gdy dowolny handler je ustawi, handlery o niższym priorytecie są pomijane.
- `before_tool_call`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `before_install`: zwrócenie `{ block: true }` jest terminalne. Gdy dowolny handler je ustawi, handlery o niższym priorytecie są pomijane.
- `before_install`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `reply_dispatch`: zwrócenie `{ handled: true, ... }` jest terminalne. Gdy dowolny handler przejmie wysyłkę, handlery o niższym priorytecie oraz domyślna ścieżka wysyłki modelu są pomijane.
- `message_sending`: zwrócenie `{ cancel: true }` jest terminalne. Gdy dowolny handler je ustawi, handlery o niższym priorytecie są pomijane.
- `message_sending`: zwrócenie `{ cancel: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `cancel`), a nie jako nadpisanie.
- `message_received`: używaj typowanego pola `threadId`, gdy potrzebujesz routingu wątku/tematu przychodzącego. Zachowaj `metadata` na dodatki specyficzne dla kanału.
- `message_sending`: używaj typowanych pól routingu `replyToId` / `threadId`, zanim wrócisz do specyficznego dla kanału `metadata`.
- `gateway_start`: używaj `ctx.config`, `ctx.workspaceDir` i `ctx.getCron?.()` dla stanu startowego należącego do Gateway, zamiast polegać na wewnętrznych hookach `gateway:startup`.
- `cron_changed`: obserwuj zmiany cyklu życia Cron należącego do Gateway. Używaj `event.job?.state?.nextRunAtMs` i `ctx.getCron?.()` podczas synchronizacji zewnętrznych harmonogramów wybudzania oraz zachowaj OpenClaw jako źródło prawdy dla kontroli terminów i wykonywania.

### Pola obiektu API

| Pole                     | Typ                       | Opis                                                                                                  |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identyfikator pluginu                                                                                 |
| `api.name`               | `string`                  | Nazwa wyświetlana                                                                                     |
| `api.version`            | `string?`                 | Wersja pluginu (opcjonalna)                                                                           |
| `api.description`        | `string?`                 | Opis pluginu (opcjonalny)                                                                             |
| `api.source`             | `string`                  | Ścieżka źródłowa pluginu                                                                              |
| `api.rootDir`            | `string?`                 | Katalog główny pluginu (opcjonalny)                                                                   |
| `api.config`             | `OpenClawConfig`          | Bieżący snapshot konfiguracji (aktywny snapshot środowiska uruchomieniowego w pamięci, gdy dostępny) |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfiguracja specyficzna dla pluginu z `plugins.entries.<id>.config`                                  |
| `api.runtime`            | `PluginRuntime`           | [Pomocniki środowiska uruchomieniowego](/pl/plugins/sdk-runtime)                                         |
| `api.logger`             | `PluginLogger`            | Logger o ograniczonym zakresie (`debug`, `info`, `warn`, `error`)                                     |
| `api.registrationMode`   | `PluginRegistrationMode`  | Bieżący tryb ładowania; `"setup-runtime"` to lekkie okno startowe/konfiguracyjne przed pełnym wejściem |
| `api.resolvePath(input)` | `(string) => string`      | Rozwiązuje ścieżkę względem katalogu głównego pluginu                                                 |

## Konwencja modułów wewnętrznych

W swoim pluginie używaj lokalnych plików zbiorczych do importów wewnętrznych:

```
my-plugin/
  api.ts            # Publiczne eksporty dla zewnętrznych konsumentów
  runtime-api.ts    # Eksporty środowiska uruchomieniowego tylko do użytku wewnętrznego
  index.ts          # Punkt wejścia pluginu
  setup-entry.ts    # Lekki punkt wejścia tylko do konfiguracji (opcjonalny)
```

<Warning>
  Nigdy nie importuj własnego pluginu przez `openclaw/plugin-sdk/<your-plugin>`
  z kodu produkcyjnego. Kieruj importy wewnętrzne przez `./api.ts` lub
  `./runtime-api.ts`. Ścieżka SDK jest wyłącznie kontraktem zewnętrznym.
</Warning>

Publiczne powierzchnie pluginów dostarczanych w pakiecie ładowanych przez fasadę (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` i podobne publiczne pliki wejściowe) preferują
aktywny snapshot konfiguracji środowiska uruchomieniowego, gdy OpenClaw już działa. Jeśli snapshot środowiska
uruchomieniowego jeszcze nie istnieje, wracają do rozwiązanego pliku konfiguracji na dysku.
Fasady spakowanych pluginów dostarczanych w pakiecie powinny być ładowane przez loadery fasad pluginów
OpenClaw; bezpośrednie importy z `dist/extensions/...` omijają manifest
i kontrole sidecar środowiska uruchomieniowego, których spakowane instalacje używają dla kodu należącego do pluginu.

Pluginy dostawców mogą udostępniać wąski, lokalny dla pluginu plik zbiorczy kontraktu, gdy
pomocnik jest celowo specyficzny dla dostawcy i nie należy jeszcze do ogólnej podścieżki SDK.
Przykłady dostarczane w pakiecie:

- **Anthropic**: publiczny seam `api.ts` / `contract-api.ts` dla pomocników strumienia
  nagłówka beta Claude i `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` eksportuje konstruktory dostawców,
  pomocniki modeli domyślnych oraz konstruktory dostawców czasu rzeczywistego.
- **`@openclaw/openrouter-provider`**: `api.ts` eksportuje konstruktor dostawcy
  oraz pomocniki onboardingu/konfiguracji.

<Warning>
  Kod produkcyjny rozszerzeń powinien także unikać importów `openclaw/plugin-sdk/<other-plugin>`.
  Jeśli pomocnik jest naprawdę współdzielony, przenieś go do neutralnej podścieżki SDK,
  takiej jak `openclaw/plugin-sdk/speech`, `.../provider-model-shared` lub innej
  powierzchni zorientowanej na funkcjonalność, zamiast sprzęgać ze sobą dwa pluginy.
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
    Narzędzia testowe i reguły lint.
  </Card>
  <Card title="Migracja SDK" icon="arrows-turn-right" href="/pl/plugins/sdk-migration">
    Migracja z przestarzałych powierzchni.
  </Card>
  <Card title="Wnętrze pluginów" icon="diagram-project" href="/pl/plugins/architecture">
    Szczegółowa architektura i model funkcjonalności.
  </Card>
</CardGroup>
