---
read_when:
    - Musisz wiedzieć, z której podścieżki SDK importować
    - Potrzebujesz dokumentacji referencyjnej wszystkich metod rejestracji w OpenClawPluginApi
    - Wyszukujesz konkretny eksport SDK
sidebarTitle: Plugin SDK overview
summary: Mapa importów, dokumentacja referencyjna API rejestracji i architektura SDK
title: Omówienie SDK Plugin
x-i18n:
    generated_at: "2026-05-02T09:59:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: be5fa531e603fb6d87f84e3193ebd61be1431b57b8f284871ae15f34ca93fc69
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK Plugin to typowany kontrakt między pluginami a rdzeniem. Ta strona jest
odniesieniem dla **tego, co importować** i **tego, co można zarejestrować**.

<Note>
  Ta strona jest przeznaczona dla autorów pluginów używających `openclaw/plugin-sdk/*` wewnątrz
  OpenClaw. W przypadku zewnętrznych aplikacji, skryptów, pulpitów, zadań CI i rozszerzeń IDE,
  które chcą uruchamiać agentów przez Gateway, użyj zamiast tego
  [OpenClaw App SDK](/pl/concepts/openclaw-sdk) oraz pakietu `@openclaw/sdk`.
</Note>

<Tip>
Szukasz raczej przewodnika praktycznego? Zacznij od [Tworzenie pluginów](/pl/plugins/building-plugins), użyj [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) dla pluginów kanałów, [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) dla pluginów dostawców oraz [Hooki pluginów](/pl/plugins/hooks) dla pluginów hooków narzędzi lub cyklu życia.
</Tip>

## Konwencja importu

Zawsze importuj z konkretnej podścieżki:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Każda podścieżka jest małym, samodzielnym modułem. Dzięki temu uruchamianie jest szybkie i
zapobiega problemom z zależnościami cyklicznymi. W przypadku pomocników wejścia/budowania specyficznych dla kanału
preferuj `openclaw/plugin-sdk/channel-core`; pozostaw `openclaw/plugin-sdk/core` dla
szerszej powierzchni zbiorczej i współdzielonych pomocników, takich jak
`buildChannelConfigSchema`.

W przypadku konfiguracji kanału opublikuj należący do kanału JSON Schema przez
`openclaw.plugin.json#channelConfigs`. Podścieżka `plugin-sdk/channel-config-schema`
jest przeznaczona dla współdzielonych prymitywów schematów i generycznego buildera. Dołączone
pluginy OpenClaw używają `plugin-sdk/bundled-channel-config-schema` dla zachowanych
schematów dołączonych kanałów. Przestarzałe eksporty zgodności pozostają w
`plugin-sdk/channel-config-schema-legacy`; żadna podścieżka dołączonych schematów nie jest
wzorem dla nowych pluginów.

<Warning>
  Nie importuj wygodnych punktów integracji oznaczonych nazwami dostawców lub kanałów (na przykład
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Dołączone pluginy komponują generyczne podścieżki SDK wewnątrz własnych barrelów `api.ts` /
  `runtime-api.ts`; konsumenci rdzenia powinni używać tych lokalnych barrelów pluginu
  albo dodać wąski generyczny kontrakt SDK, gdy potrzeba jest rzeczywiście
  międzykanałowa.

Niewielki zestaw pomocniczych punktów integracji dołączonych pluginów nadal pojawia się w wygenerowanej mapie eksportów,
gdy mają śledzone użycie właściciela. Istnieją wyłącznie na potrzeby utrzymania dołączonych pluginów
i nie są zalecanymi ścieżkami importu dla nowych pluginów firm trzecich.

`openclaw/plugin-sdk/discord` i `openclaw/plugin-sdk/telegram-account` są
również zachowane jako przestarzałe fasady zgodności dla śledzonego użycia właściciela. Nie
kopiuj tych ścieżek importu do nowych pluginów; używaj zamiast tego wstrzykiwanych pomocników runtime i
generycznych podścieżek SDK kanałów.
</Warning>

## Odniesienie podścieżek

SDK Plugin jest udostępniany jako zestaw wąskich podścieżek pogrupowanych według obszaru (wejście pluginu,
kanał, dostawca, uwierzytelnianie, runtime, capability, pamięć i zarezerwowane
pomocniki dołączonych pluginów). Pełny katalog — pogrupowany i podlinkowany — znajdziesz w
[Podścieżki SDK Plugin](/pl/plugins/sdk-subpaths).

Wygenerowana lista ponad 200 podścieżek znajduje się w `scripts/lib/plugin-sdk-entrypoints.json`.

## API rejestracji

Callback `register(api)` otrzymuje obiekt `OpenClawPluginApi` z tymi
metodami:

### Rejestracja capability

| Metoda                                           | Co rejestruje                         |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Wnioskowanie tekstowe (LLM)           |
| `api.registerAgentHarness(...)`                  | Eksperymentalny niskopoziomowy executor agenta |
| `api.registerCliBackend(...)`                    | Lokalny backend wnioskowania CLI      |
| `api.registerChannel(...)`                       | Kanał wiadomości                      |
| `api.registerSpeechProvider(...)`                | Synteza tekst-na-mowę / STT           |
| `api.registerRealtimeTranscriptionProvider(...)` | Strumieniowa transkrypcja w czasie rzeczywistym |
| `api.registerRealtimeVoiceProvider(...)`         | Dwukierunkowe sesje głosowe w czasie rzeczywistym |
| `api.registerMediaUnderstandingProvider(...)`    | Analiza obrazów/audio/wideo           |
| `api.registerImageGenerationProvider(...)`       | Generowanie obrazów                   |
| `api.registerMusicGenerationProvider(...)`       | Generowanie muzyki                    |
| `api.registerVideoGenerationProvider(...)`       | Generowanie wideo                     |
| `api.registerWebFetchProvider(...)`              | Dostawca pobierania / zeskrobywania stron WWW |
| `api.registerWebSearchProvider(...)`             | Wyszukiwanie w sieci                  |

### Narzędzia i polecenia

| Metoda                          | Co rejestruje                                |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Narzędzie agenta (wymagane lub `{ optional: true }`) |
| `api.registerCommand(def)`      | Niestandardowe polecenie (omija LLM)         |

Polecenia pluginu mogą ustawiać `agentPromptGuidance`, gdy agent potrzebuje krótkiej,
należącej do polecenia wskazówki routingu. Niech ten tekst dotyczy samego polecenia; nie dodawaj
polityki specyficznej dla dostawcy lub pluginu do builderów promptów rdzenia.

### Infrastruktura

| Metoda                                         | Co rejestruje                         |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook zdarzenia                        |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway                 |
| `api.registerGatewayMethod(name, handler)`     | Metoda RPC Gateway                    |
| `api.registerGatewayDiscoveryService(service)` | Reklamujący się lokalny serwis wykrywania Gateway |
| `api.registerCli(registrar, opts?)`            | Podpolecenie CLI                      |
| `api.registerService(service)`                 | Usługa w tle                          |
| `api.registerInteractiveHandler(registration)` | Handler interaktywny                  |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware runtime wyników narzędzi   |
| `api.registerMemoryPromptSupplement(builder)`  | Addytywna sekcja promptu sąsiadująca z pamięcią |
| `api.registerMemoryCorpusSupplement(adapter)`  | Addytywny korpus wyszukiwania/odczytu pamięci |

### Hooki hosta dla pluginów przepływu pracy

Hooki hosta to punkty integracji SDK dla pluginów, które muszą uczestniczyć w cyklu życia hosta,
a nie tylko dodawać dostawcę, kanał lub narzędzie. Są to kontrakty
generyczne; może ich używać Plan Mode, ale mogą też przepływy zatwierdzania,
bramki polityk obszaru roboczego, monitory w tle, kreatory konfiguracji i towarzyszące
pluginy UI.

| Metoda                                                                   | Kontrakt, który posiada                                                                                                           |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Należący do pluginu, zgodny z JSON stan sesji projektowany przez sesje Gateway                                                    |
| `api.enqueueNextTurnInjection(...)`                                      | Trwały, dokładnie jednokrotny kontekst wstrzykiwany do następnej tury agenta dla jednej sesji                                     |
| `api.registerTrustedToolPolicy(...)`                                     | Dołączona/zaufana polityka narzędzi przedpluginowa, która może blokować lub przepisywać parametry narzędzia                       |
| `api.registerToolMetadata(...)`                                          | Metadane wyświetlania katalogu narzędzi bez zmiany implementacji narzędzia                                                        |
| `api.registerCommand(...)`                                               | Zakresowe polecenia pluginu; wyniki poleceń mogą ustawiać `continueAgent: true`; natywne polecenia Discord obsługują `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Deskryptory wkładu Control UI dla powierzchni sesji, narzędzia, uruchomienia lub ustawień                                        |
| `api.registerRuntimeLifecycle(...)`                                      | Callbacki czyszczenia należących do pluginu zasobów runtime na ścieżkach reset/delete/reload                                      |
| `api.registerAgentEventSubscription(...)`                                | Oczyszczone subskrypcje zdarzeń dla stanu przepływu pracy i monitorów                                                             |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Stan roboczy pluginu na uruchomienie, czyszczony przy terminalnym cyklu życia uruchomienia                                        |
| `api.registerSessionSchedulerJob(...)`                                   | Należące do pluginu rekordy zadań harmonogramu sesji z deterministycznym czyszczeniem                                             |

Kontrakty celowo rozdzielają uprawnienia:

- Zewnętrzne pluginy mogą posiadać rozszerzenia sesji, deskryptory UI, polecenia, metadane narzędzi,
  wstrzyknięcia następnej tury i zwykłe hooki.
- Zaufane polityki narzędzi działają przed zwykłymi hookami `before_tool_call` i są
  tylko dla dołączonych pluginów, ponieważ uczestniczą w polityce bezpieczeństwa hosta.
- Zarezerwowana własność poleceń jest tylko dla dołączonych pluginów. Zewnętrzne pluginy powinny używać
  własnych nazw poleceń lub aliasów.
- `allowPromptInjection=false` wyłącza hooki modyfikujące prompt, w tym
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  pola promptu ze starszego `before_agent_start` oraz
  `enqueueNextTurnInjection`.

Przykłady konsumentów innych niż Plan:

| Archetyp pluginu             | Używane hooki                                                                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Przepływ zatwierdzania       | Rozszerzenie sesji, kontynuacja polecenia, wstrzyknięcie następnej tury, deskryptor UI                                                 |
| Bramka polityki budżetu/obszaru roboczego | Zaufana polityka narzędzi, metadane narzędzi, projekcja sesji                                                            |
| Monitor cyklu życia w tle    | Czyszczenie cyklu życia runtime, subskrypcja zdarzeń agenta, własność/czyszczenie harmonogramu sesji, wkład promptu Heartbeat, deskryptor UI |
| Kreator konfiguracji lub onboardingu | Rozszerzenie sesji, zakresowe polecenia, deskryptor Control UI                                                                 |

<Note>
  Zarezerwowane administracyjne przestrzenie nazw rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) zawsze pozostają `operator.admin`, nawet jeśli plugin spróbuje przypisać
  węższy zakres metody Gateway. Preferuj prefiksy specyficzne dla pluginu dla
  metod należących do pluginu.
</Note>

<Accordion title="Kiedy używać middleware wyników narzędzi">
  Dołączone pluginy mogą używać `api.registerAgentToolResultMiddleware(...)`, gdy
  muszą przepisać wynik narzędzia po wykonaniu, a przed tym, jak runtime
  przekaże ten wynik z powrotem do modelu. To zaufany, neutralny względem runtime
  punkt integracji dla asynchronicznych reduktorów wyjścia, takich jak tokenjuice.

Dołączone pluginy muszą deklarować `contracts.agentToolResultMiddleware` dla każdego
docelowego runtime, na przykład `["pi", "codex"]`. Zewnętrzne pluginy
nie mogą rejestrować tego middleware; zachowaj zwykłe hooki pluginów OpenClaw dla pracy,
która nie wymaga taktowania wyniku narzędzia przed modelem. Stara ścieżka rejestracji fabryki
osadzonego rozszerzenia tylko dla Pi została usunięta.
</Accordion>

### Rejestracja wykrywania Gateway

`api.registerGatewayDiscoveryService(...)` pozwala Pluginowi ogłaszać aktywny
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
uwierzytelniania. Wykrywanie jest podpowiedzią routingu; zaufanie nadal należy do
uwierzytelniania Gateway i przypinania TLS.

### Metadane rejestracji CLI

`api.registerCli(registrar, opts?)` przyjmuje dwa rodzaje metadanych najwyższego poziomu:

- `commands`: jawne korzenie poleceń należące do rejestratora
- `descriptors`: deskryptory poleceń z czasu parsowania używane do głównej pomocy CLI,
  routingu i leniwej rejestracji CLI Plugina

Jeśli chcesz, aby polecenie Plugina pozostało ładowane leniwie w normalnej ścieżce głównego CLI,
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

Używaj samego `commands` tylko wtedy, gdy nie potrzebujesz leniwej rejestracji głównego CLI.
Ta gorliwa ścieżka zgodności pozostaje obsługiwana, ale nie instaluje
zastępczych wpisów opartych na deskryptorach do leniwego ładowania w czasie parsowania.

### Rejestracja backendu CLI

`api.registerCliBackend(...)` pozwala Pluginowi posiadać domyślną konfigurację lokalnego
backendu AI CLI, takiego jak `codex-cli`.

- `id` backendu staje się prefiksem dostawcy w odwołaniach do modeli, takich jak `codex-cli/gpt-5`.
- `config` backendu używa tego samego kształtu co `agents.defaults.cliBackends.<id>`.
- Konfiguracja użytkownika nadal wygrywa. OpenClaw scala `agents.defaults.cliBackends.<id>` nad
  domyślną konfiguracją Plugina przed uruchomieniem CLI.
- Użyj `normalizeConfig`, gdy backend wymaga przepisania zgodności po scaleniu
  (na przykład normalizacji starych kształtów flag).

### Wyłączne sloty

| Metoda                                     | Co rejestruje                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Silnik kontekstu (jeden aktywny naraz). Callback `assemble()` otrzymuje `availableTools` i `citationsMode`, aby silnik mógł dostosować dodatki do promptu. |
| `api.registerMemoryCapability(capability)` | Ujednolicona funkcja pamięci                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Konstruktor sekcji promptu pamięci                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver planu opróżniania pamięci                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | Adapter środowiska wykonawczego pamięci                                                                                                                                    |

### Adaptery osadzania pamięci

| Metoda                                         | Co rejestruje                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter osadzania pamięci dla aktywnego Plugina |

- `registerMemoryCapability` jest preferowanym wyłącznym API Plugina pamięci.
- `registerMemoryCapability` może także udostępniać `publicArtifacts.listArtifacts(...)`,
  aby Pluginy towarzyszące mogły używać wyeksportowanych artefaktów pamięci przez
  `openclaw/plugin-sdk/memory-host-core` zamiast sięgać do prywatnego układu konkretnego
  Plugina pamięci.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` i
  `registerMemoryRuntime` to zgodne ze starszymi wersjami wyłączne API Plugina pamięci.
- `MemoryFlushPlan.model` może przypiąć turę opróżniania do dokładnego odwołania
  `provider/model`, takiego jak `ollama/qwen3:8b`, bez dziedziczenia aktywnego łańcucha
  awaryjnego.
- `registerMemoryEmbeddingProvider` pozwala aktywnemu Pluginowi pamięci zarejestrować jeden
  lub więcej identyfikatorów adapterów osadzania (na przykład `openai`, `gemini` albo niestandardowy
  identyfikator zdefiniowany przez Plugin).
- Konfiguracja użytkownika, taka jak `agents.defaults.memorySearch.provider` i
  `agents.defaults.memorySearch.fallback`, jest rozwiązywana względem tych zarejestrowanych
  identyfikatorów adapterów.

### Zdarzenia i cykl życia

| Metoda                                       | Co robi                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Typowany hook cyklu życia          |
| `api.onConversationBindingResolved(handler)` | Callback powiązania konwersacji |

Zobacz [hooki Plugina](/pl/plugins/hooks), aby poznać przykłady, typowe nazwy hooków i semantykę strażników.

### Semantyka decyzji hooków

- `before_tool_call`: zwrócenie `{ block: true }` jest terminalne. Gdy dowolny handler je ustawi, handlery o niższym priorytecie są pomijane.
- `before_tool_call`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `before_install`: zwrócenie `{ block: true }` jest terminalne. Gdy dowolny handler je ustawi, handlery o niższym priorytecie są pomijane.
- `before_install`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `reply_dispatch`: zwrócenie `{ handled: true, ... }` jest terminalne. Gdy dowolny handler przejmie wysyłkę, handlery o niższym priorytecie i domyślna ścieżka wysyłki modelu są pomijane.
- `message_sending`: zwrócenie `{ cancel: true }` jest terminalne. Gdy dowolny handler je ustawi, handlery o niższym priorytecie są pomijane.
- `message_sending`: zwrócenie `{ cancel: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `cancel`), a nie jako nadpisanie.
- `message_received`: użyj typowanego pola `threadId`, gdy potrzebujesz routingu przychodzącego wątku/tematu. Zachowaj `metadata` dla dodatków specyficznych dla kanału.
- `message_sending`: używaj typowanych pól routingu `replyToId` / `threadId` przed przejściem awaryjnym do specyficznych dla kanału `metadata`.
- `gateway_start`: używaj `ctx.config`, `ctx.workspaceDir` i `ctx.getCron?.()` dla stanu uruchamiania należącego do Gateway zamiast polegać na wewnętrznych hookach `gateway:startup`.
- `cron_changed`: obserwuj zmiany cyklu życia Cron należącego do gateway. Używaj `event.job?.state?.nextRunAtMs` i `ctx.getCron?.()` podczas synchronizowania zewnętrznych harmonogramów wybudzania oraz zachowaj OpenClaw jako źródło prawdy dla sprawdzania terminów i wykonywania.

### Pola obiektu API

| Pole                    | Typ                      | Opis                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identyfikator Plugina                                                                                   |
| `api.name`               | `string`                  | Nazwa wyświetlana                                                                                |
| `api.version`            | `string?`                 | Wersja Plugina (opcjonalnie)                                                                   |
| `api.description`        | `string?`                 | Opis Plugina (opcjonalnie)                                                               |
| `api.source`             | `string`                  | Ścieżka źródłowa Plugina                                                                          |
| `api.rootDir`            | `string?`                 | Katalog główny Plugina (opcjonalnie)                                                            |
| `api.config`             | `OpenClawConfig`          | Bieżąca migawka konfiguracji (aktywna migawka środowiska wykonawczego w pamięci, gdy jest dostępna)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfiguracja specyficzna dla Plugina z `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Pomocniki środowiska wykonawczego](/pl/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger o określonym zakresie (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Bieżący tryb ładowania; `"setup-runtime"` to lekkie okno uruchamiania/konfiguracji przed pełnym punktem wejścia |
| `api.resolvePath(input)` | `(string) => string`      | Rozwiązuje ścieżkę względem katalogu głównego Plugina                                                        |

## Konwencja modułów wewnętrznych

W swoim Pluginie używaj lokalnych plików barrel dla importów wewnętrznych:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Nigdy nie importuj własnego Plugina przez `openclaw/plugin-sdk/<your-plugin>`
  z kodu produkcyjnego. Kieruj importy wewnętrzne przez `./api.ts` lub
  `./runtime-api.ts`. Ścieżka SDK jest wyłącznie kontraktem zewnętrznym.
</Warning>

Publiczne powierzchnie dołączonego Plugina ładowane przez fasadę (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` i podobne publiczne pliki wejściowe) preferują
aktywną migawkę konfiguracji środowiska wykonawczego, gdy OpenClaw już działa. Jeśli migawka środowiska wykonawczego
jeszcze nie istnieje, przechodzą awaryjnie do rozwiązanych plików konfiguracji na dysku.
Spakowane fasady dołączonego Plugina powinny być ładowane przez loadery fasad Pluginów
OpenClaw; bezpośrednie importy z `dist/extensions/...` omijają manifest
i kontrole sidecara środowiska wykonawczego, których spakowane instalacje używają dla kodu należącego do Plugina.

Pluginy dostawców mogą udostępniać wąski lokalny barrel kontraktu Plugina, gdy
pomocnik jest celowo specyficzny dla dostawcy i nie pasuje jeszcze do ogólnej podścieżki SDK.
Dołączone przykłady:

- **Anthropic**: publiczny seam `api.ts` / `contract-api.ts` dla pomocników strumienia Claude
  beta-header i `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` eksportuje konstruktory dostawcy,
  pomocniki domyślnego modelu i konstruktory dostawcy realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` eksportuje konstruktor dostawcy
  oraz pomocniki onboardingu/konfiguracji.

<Warning>
  Kod produkcyjny rozszerzenia powinien także unikać importów `openclaw/plugin-sdk/<other-plugin>`.
  Jeśli pomocnik jest naprawdę współdzielony, przenieś go do neutralnej podścieżki SDK,
  takiej jak `openclaw/plugin-sdk/speech`, `.../provider-model-shared` lub innej
  powierzchni zorientowanej na funkcję, zamiast sprzęgać dwa Pluginy ze sobą.
</Warning>

## Powiązane

<CardGroup cols={2}>
  <Card title="Punkty wejścia" icon="door-open" href="/pl/plugins/sdk-entrypoints">
    Opcje `definePluginEntry` i `defineChannelPluginEntry`.
  </Card>
  <Card title="Pomocnicze funkcje środowiska uruchomieniowego" icon="gears" href="/pl/plugins/sdk-runtime">
    Pełna dokumentacja przestrzeni nazw `api.runtime`.
  </Card>
  <Card title="Konfiguracja i ustawienia" icon="sliders" href="/pl/plugins/sdk-setup">
    Pakietowanie, manifesty i schematy konfiguracji.
  </Card>
  <Card title="Testowanie" icon="vial" href="/pl/plugins/sdk-testing">
    Narzędzia testowe i reguły lintowania.
  </Card>
  <Card title="Migracja SDK" icon="arrows-turn-right" href="/pl/plugins/sdk-migration">
    Migracja z przestarzałych powierzchni.
  </Card>
  <Card title="Elementy wewnętrzne Plugin" icon="diagram-project" href="/pl/plugins/architecture">
    Szczegółowa architektura i model możliwości.
  </Card>
</CardGroup>
