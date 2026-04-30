---
read_when:
    - Musisz wiedzieć, z której podścieżki SDK importować
    - Potrzebujesz dokumentacji referencyjnej dla wszystkich metod rejestracji w OpenClawPluginApi
    - Szukasz konkretnego eksportu SDK
sidebarTitle: Plugin SDK overview
summary: Mapa importów, dokumentacja referencyjna API rejestracji i architektura SDK
title: Omówienie Plugin SDK
x-i18n:
    generated_at: "2026-04-30T10:09:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1749ad99c55ffd14624b817aba963bd93ebe7976937138693177523bbe3aa88c
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK pluginów to typowany kontrakt między pluginami a rdzeniem. Ta strona jest
dokumentacją tego, **co importować** i **co można rejestrować**.

<Note>
  Ta strona jest przeznaczona dla autorów pluginów używających `openclaw/plugin-sdk/*` wewnątrz
  OpenClaw. W przypadku zewnętrznych aplikacji, skryptów, dashboardów, zadań CI i rozszerzeń IDE,
  które chcą uruchamiać agentów przez Gateway, użyj zamiast tego
  [SDK aplikacji OpenClaw](/pl/concepts/openclaw-sdk) oraz pakietu `@openclaw/sdk`.
</Note>

<Tip>
Szukasz raczej przewodnika krok po kroku? Zacznij od [Budowania pluginów](/pl/plugins/building-plugins), użyj [Pluginów kanałowych](/pl/plugins/sdk-channel-plugins) dla pluginów kanałów, [Pluginów dostawców](/pl/plugins/sdk-provider-plugins) dla pluginów dostawców oraz [Hooków Plugin](/pl/plugins/hooks) dla pluginów narzędzi lub hooków cyklu życia.
</Tip>

## Konwencja importu

Zawsze importuj z konkretnej podścieżki:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Każda podścieżka jest małym, samowystarczalnym modułem. Dzięki temu uruchamianie pozostaje szybkie i
unika problemów z zależnościami cyklicznymi. Dla pomocników wejścia/budowania specyficznych dla kanału
preferuj `openclaw/plugin-sdk/channel-core`; zachowaj `openclaw/plugin-sdk/core` dla
szerszej powierzchni parasolowej i współdzielonych pomocników, takich jak
`buildChannelConfigSchema`.

W przypadku konfiguracji kanału opublikuj należący do kanału JSON Schema przez
`openclaw.plugin.json#channelConfigs`. Podścieżka `plugin-sdk/channel-config-schema`
służy do współdzielonych prymitywów schematu i ogólnego buildera. Dołączone pluginy OpenClaw
używają `plugin-sdk/bundled-channel-config-schema` dla zachowanych schematów
dołączonych kanałów. Przestarzałe eksporty zgodności pozostają w
`plugin-sdk/channel-config-schema-legacy`; żadna z podścieżek schematów dołączonych nie jest
wzorcem dla nowych pluginów.

<Warning>
  Nie importuj wygodnych punktów integracji brandowanych dostawcą lub kanałem (na przykład
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Dołączone pluginy komponują ogólne podścieżki SDK we własnych modułach zbiorczych `api.ts` /
  `runtime-api.ts`; konsumenci rdzenia powinni używać tych lokalnych modułów zbiorczych pluginu
  albo dodać wąski, ogólny kontrakt SDK, gdy potrzeba jest naprawdę
  wielokanałowa.

Niewielki zestaw pomocniczych punktów integracji dołączonych pluginów nadal pojawia się w wygenerowanej mapie eksportów,
gdy mają śledzone użycie właściciela. Istnieją wyłącznie do utrzymania dołączonych pluginów
i nie są zalecanymi ścieżkami importu dla nowych pluginów zewnętrznych.

`openclaw/plugin-sdk/discord` i `openclaw/plugin-sdk/telegram-account` są
również zachowane jako przestarzałe fasady zgodności dla śledzonego użycia właściciela. Nie
kopiuj tych ścieżek importu do nowych pluginów; używaj zamiast tego wstrzykiwanych pomocników środowiska uruchomieniowego i
ogólnych podścieżek SDK kanałów.
</Warning>

## Dokumentacja podścieżek

SDK pluginów jest udostępniane jako zestaw wąskich podścieżek pogrupowanych według obszaru (wejście pluginu,
kanał, dostawca, uwierzytelnianie, środowisko uruchomieniowe, możliwość, pamięć oraz zarezerwowane
pomocniki dołączonych pluginów). Pełny katalog — pogrupowany i podlinkowany — znajdziesz w
[Podścieżkach SDK Plugin](/pl/plugins/sdk-subpaths).

Wygenerowana lista ponad 200 podścieżek znajduje się w `scripts/lib/plugin-sdk-entrypoints.json`.

## API rejestracji

Wywołanie zwrotne `register(api)` otrzymuje obiekt `OpenClawPluginApi` z tymi
metodami:

### Rejestracja możliwości

| Method                                           | Co rejestruje                         |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Wnioskowanie tekstowe (LLM)           |
| `api.registerAgentHarness(...)`                  | Eksperymentalny niskopoziomowy wykonawca agenta |
| `api.registerCliBackend(...)`                    | Lokalny backend wnioskowania CLI      |
| `api.registerChannel(...)`                       | Kanał wiadomości                      |
| `api.registerSpeechProvider(...)`                | Synteza tekstu na mowę / STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Strumieniowa transkrypcja w czasie rzeczywistym |
| `api.registerRealtimeVoiceProvider(...)`         | Dwukierunkowe sesje głosowe w czasie rzeczywistym |
| `api.registerMediaUnderstandingProvider(...)`    | Analiza obrazu/audio/wideo            |
| `api.registerImageGenerationProvider(...)`       | Generowanie obrazów                   |
| `api.registerMusicGenerationProvider(...)`       | Generowanie muzyki                    |
| `api.registerVideoGenerationProvider(...)`       | Generowanie wideo                     |
| `api.registerWebFetchProvider(...)`              | Dostawca pobierania / scrapingu z sieci |
| `api.registerWebSearchProvider(...)`             | Wyszukiwanie w sieci                  |

### Narzędzia i polecenia

| Method                          | Co rejestruje                                  |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Narzędzie agenta (wymagane albo `{ optional: true }`) |
| `api.registerCommand(def)`      | Niestandardowe polecenie (omija LLM)           |

Polecenia pluginów mogą ustawić `agentPromptGuidance`, gdy agent potrzebuje krótkiej,
należącej do polecenia wskazówki routingu. Niech ten tekst dotyczy samego polecenia; nie dodawaj
polityki specyficznej dla dostawcy lub pluginu do builderów promptów rdzenia.

### Infrastruktura

| Method                                         | Co rejestruje                          |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook zdarzenia                         |
| `api.registerHttpRoute(params)`                | Punkt końcowy HTTP Gateway             |
| `api.registerGatewayMethod(name, handler)`     | Metoda RPC Gateway                     |
| `api.registerGatewayDiscoveryService(service)` | Lokalny reklamodawca wykrywania Gateway |
| `api.registerCli(registrar, opts?)`            | Podpolecenie CLI                       |
| `api.registerService(service)`                 | Usługa w tle                           |
| `api.registerInteractiveHandler(registration)` | Interaktywny handler                   |
| `api.registerAgentToolResultMiddleware(...)`   | Warstwa pośrednia wyników narzędzi środowiska uruchomieniowego |
| `api.registerMemoryPromptSupplement(builder)`  | Addytywna sekcja promptu przylegająca do pamięci |
| `api.registerMemoryCorpusSupplement(adapter)`  | Addytywny korpus wyszukiwania/odczytu pamięci |

### Hooki hosta dla pluginów przepływu pracy

Hooki hosta to punkty integracji SDK dla pluginów, które muszą uczestniczyć w cyklu życia hosta
zamiast tylko dodawać dostawcę, kanał lub narzędzie. Są to
ogólne kontrakty; tryb planowania może ich używać, ale tak samo mogą z nich korzystać przepływy zatwierdzania,
bramy polityk przestrzeni roboczej, monitory w tle, kreatory konfiguracji i pluginy towarzyszące UI.

| Method                                                                   | Kontrakt, który posiada                                                            |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Stan sesji należący do pluginu, zgodny z JSON, rzutowany przez sesje Gateway      |
| `api.enqueueNextTurnInjection(...)`                                      | Trwały kontekst wstrzykiwany dokładnie raz do następnej tury agenta dla jednej sesji |
| `api.registerTrustedToolPolicy(...)`                                     | Dołączona/zaufana polityka narzędzi przed pluginem, która może blokować lub przepisywać parametry narzędzia |
| `api.registerToolMetadata(...)`                                          | Metadane wyświetlania katalogu narzędzi bez zmiany implementacji narzędzia        |
| `api.registerCommand(...)`                                               | Polecenia pluginu o ograniczonym zakresie; wyniki poleceń mogą ustawić `continueAgent: true` |
| `api.registerControlUiDescriptor(...)`                                   | Deskryptory wkładu interfejsu sterowania dla powierzchni sesji, narzędzia, przebiegu lub ustawień |
| `api.registerRuntimeLifecycle(...)`                                      | Wywołania zwrotne sprzątania zasobów środowiska uruchomieniowego należących do pluginu na ścieżkach resetowania/usuwania/przeładowania |
| `api.registerAgentEventSubscription(...)`                                | Oczyszczone subskrypcje zdarzeń dla stanu przepływu pracy i monitorów             |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Tymczasowy stan pluginu dla pojedynczego przebiegu, czyszczony przy końcowym cyklu życia przebiegu |
| `api.registerSessionSchedulerJob(...)`                                   | Rekordy zadań harmonogramu sesji należące do pluginu z deterministycznym sprzątaniem |

Kontrakty celowo rozdzielają uprawnienia:

- Zewnętrzne pluginy mogą posiadać rozszerzenia sesji, deskryptory UI, polecenia, metadane narzędzi,
  wstrzyknięcia następnej tury i zwykłe hooki.
- Zaufane polityki narzędzi uruchamiają się przed zwykłymi hookami `before_tool_call` i są
  tylko dla dołączonych pluginów, ponieważ uczestniczą w polityce bezpieczeństwa hosta.
- Zarezerwowana własność poleceń jest tylko dla dołączonych pluginów. Zewnętrzne pluginy powinny używać
  własnych nazw poleceń lub aliasów.
- `allowPromptInjection=false` wyłącza hooki modyfikujące prompt, w tym
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  pola promptu ze starszego `before_agent_start` oraz
  `enqueueNextTurnInjection`.

Przykłady konsumentów innych niż tryb planowania:

| Archetyp Plugin              | Używane hooki                                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Przepływ zatwierdzania       | Rozszerzenie sesji, kontynuacja polecenia, wstrzyknięcie następnej tury, deskryptor UI                                                |
| Brama polityki budżetu/przestrzeni roboczej | Zaufana polityka narzędzi, metadane narzędzi, projekcja sesji                                                                       |
| Monitor cyklu życia w tle    | Sprzątanie cyklu życia środowiska uruchomieniowego, subskrypcja zdarzeń agenta, własność/sprzątanie harmonogramu sesji, wkład promptu Heartbeat, deskryptor UI |
| Kreator konfiguracji lub wdrażania | Rozszerzenie sesji, polecenia o ograniczonym zakresie, deskryptor interfejsu sterowania                                               |

<Note>
  Zarezerwowane przestrzenie nazw administratora rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) zawsze pozostają `operator.admin`, nawet jeśli plugin próbuje przypisać
  węższy zakres metody Gateway. Preferuj prefiksy specyficzne dla pluginu dla
  metod należących do pluginu.
</Note>

<Accordion title="Kiedy używać warstwy pośredniej wyników narzędzi">
  Dołączone pluginy mogą używać `api.registerAgentToolResultMiddleware(...)`, gdy
  muszą przepisać wynik narzędzia po wykonaniu i zanim środowisko uruchomieniowe
  przekaże ten wynik z powrotem do modelu. To zaufany, neutralny względem środowiska uruchomieniowego
  punkt integracji dla asynchronicznych reduktorów wyjścia, takich jak tokenjuice.

Dołączone pluginy muszą deklarować `contracts.agentToolResultMiddleware` dla każdego
docelowego środowiska uruchomieniowego, na przykład `["pi", "codex"]`. Zewnętrzne pluginy
nie mogą rejestrować tej warstwy pośredniej; zachowaj zwykłe hooki pluginów OpenClaw dla pracy,
która nie potrzebuje taktowania wyniku narzędzia przed modelem. Stara, osadzona ścieżka
rejestracji fabryki rozszerzeń tylko dla Pi została usunięta.
</Accordion>

### Rejestracja wykrywania Gateway

`api.registerGatewayDiscoveryService(...)` pozwala pluginowi reklamować aktywny
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

Pluginy odkrywania Gateway nie mogą traktować ogłaszanych wartości TXT jako sekretów ani
uwierzytelniania. Odkrywanie jest wskazówką routingu; uwierzytelnianie Gateway i przypinanie TLS nadal
odpowiadają za zaufanie.

### Metadane rejestracji CLI

`api.registerCli(registrar, opts?)` akceptuje dwa rodzaje metadanych najwyższego poziomu:

- `commands`: jawne korzenie poleceń należące do rejestratora
- `descriptors`: deskryptory poleceń z czasu parsowania używane do pomocy głównego CLI,
  routingu i leniwej rejestracji CLI pluginu

Jeśli chcesz, aby polecenie pluginu pozostało ładowane leniwie w normalnej ścieżce głównego CLI,
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
placeholderów opartych na deskryptorach do leniwego ładowania w czasie parsowania.

### Rejestracja backendu CLI

`api.registerCliBackend(...)` pozwala pluginowi posiadać domyślną konfigurację lokalnego
backendu AI CLI, takiego jak `codex-cli`.

- Backend `id` staje się prefiksem dostawcy w referencjach modelu, takich jak `codex-cli/gpt-5`.
- Backend `config` używa tego samego kształtu co `agents.defaults.cliBackends.<id>`.
- Konfiguracja użytkownika nadal wygrywa. OpenClaw scala `agents.defaults.cliBackends.<id>` nad
  domyślną konfiguracją pluginu przed uruchomieniem CLI.
- Użyj `normalizeConfig`, gdy backend potrzebuje przepisań zgodności po scaleniu
  (na przykład normalizacji starych kształtów flag).

### Sloty wyłączne

| Metoda                                     | Co rejestruje                                                                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Silnik kontekstu (jeden aktywny naraz). Wywołanie zwrotne `assemble()` otrzymuje `availableTools` i `citationsMode`, aby silnik mógł dostosować dodatki do promptu. |
| `api.registerMemoryCapability(capability)` | Ujednolicona funkcja pamięci                                                                                                                            |
| `api.registerMemoryPromptSection(builder)` | Konstruktor sekcji promptu pamięci                                                                                                                      |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver planu opróżniania pamięci                                                                                                                      |
| `api.registerMemoryRuntime(runtime)`       | Adapter środowiska uruchomieniowego pamięci                                                                                                             |

### Adaptery osadzania pamięci

| Metoda                                         | Co rejestruje                                  |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter osadzania pamięci dla aktywnego pluginu |

- `registerMemoryCapability` jest preferowanym wyłącznym API pluginu pamięci.
- `registerMemoryCapability` może także udostępniać `publicArtifacts.listArtifacts(...)`,
  aby pluginy towarzyszące mogły używać wyeksportowanych artefaktów pamięci przez
  `openclaw/plugin-sdk/memory-host-core` zamiast sięgać do prywatnego układu konkretnego
  pluginu pamięci.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` i
  `registerMemoryRuntime` to zgodne wstecznie wyłączne API pluginu pamięci.
- `MemoryFlushPlan.model` może przypiąć turę opróżniania do dokładnej referencji
  `provider/model`, takiej jak `ollama/qwen3:8b`, bez dziedziczenia aktywnego łańcucha
  fallback.
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
| `api.onConversationBindingResolved(handler)` | Wywołanie zwrotne wiązania konwersacji |

Zobacz [Hooki Plugin](/pl/plugins/hooks), aby poznać przykłady, popularne nazwy hooków i
semantykę zabezpieczeń.

### Semantyka decyzji hooków

- `before_tool_call`: zwrócenie `{ block: true }` jest terminalne. Gdy dowolny handler je ustawi, handlery o niższym priorytecie są pomijane.
- `before_tool_call`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `before_install`: zwrócenie `{ block: true }` jest terminalne. Gdy dowolny handler je ustawi, handlery o niższym priorytecie są pomijane.
- `before_install`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `reply_dispatch`: zwrócenie `{ handled: true, ... }` jest terminalne. Gdy dowolny handler przejmie wysyłkę, handlery o niższym priorytecie i domyślna ścieżka wysyłki modelu są pomijane.
- `message_sending`: zwrócenie `{ cancel: true }` jest terminalne. Gdy dowolny handler je ustawi, handlery o niższym priorytecie są pomijane.
- `message_sending`: zwrócenie `{ cancel: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `cancel`), a nie jako nadpisanie.
- `message_received`: użyj typowanego pola `threadId`, gdy potrzebujesz routingu przychodzącego wątku/tematu. Zachowaj `metadata` na dodatki specyficzne dla kanału.
- `message_sending`: użyj typowanych pól routingu `replyToId` / `threadId`, zanim użyjesz specyficznego dla kanału `metadata`.
- `gateway_start`: użyj `ctx.config`, `ctx.workspaceDir` i `ctx.getCron?.()` dla stanu startowego należącego do Gateway zamiast polegać na wewnętrznych hookach `gateway:startup`.
- `cron_changed`: obserwuj zmiany cyklu życia Cron należącego do Gateway. Użyj `event.job?.state?.nextRunAtMs` i `ctx.getCron?.()` podczas synchronizowania zewnętrznych harmonogramów wybudzania, i zachowaj OpenClaw jako źródło prawdy dla kontroli terminów i wykonywania.

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
| `api.runtime`            | `PluginRuntime`           | [Helpery środowiska uruchomieniowego](/pl/plugins/sdk-runtime)                                 |
| `api.logger`             | `PluginLogger`            | Logger o określonym zakresie (`debug`, `info`, `warn`, `error`)                             |
| `api.registrationMode`   | `PluginRegistrationMode`  | Bieżący tryb ładowania; `"setup-runtime"` to lekki przedział startu/konfiguracji przed pełnym wpisem |
| `api.resolvePath(input)` | `(string) => string`      | Rozwiąż ścieżkę względem katalogu głównego pluginu                                          |

## Konwencja modułów wewnętrznych

Wewnątrz pluginu używaj lokalnych plików barrel dla importów wewnętrznych:

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

Publiczne powierzchnie dołączonych pluginów ładowane przez fasadę (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` i podobne publiczne pliki wejściowe) preferują
aktywny snapshot konfiguracji środowiska uruchomieniowego, gdy OpenClaw już działa. Jeśli snapshot środowiska uruchomieniowego
jeszcze nie istnieje, wracają do rozwiązanej konfiguracji z pliku na dysku.
Spakowane fasady dołączonych pluginów powinny być ładowane przez loadery fasad pluginów
OpenClaw; bezpośrednie importy z `dist/extensions/...` omijają etapowe mirrory zależności
środowiska uruchomieniowego, których spakowane instalacje używają dla zależności należących do pluginu.

Pluginy dostawców mogą udostępniać wąski lokalny dla pluginu barrel kontraktu, gdy
helper jest celowo specyficzny dla dostawcy i nie należy jeszcze do ogólnej
podścieżki SDK. Dołączone przykłady:

- **Anthropic**: publiczny seam `api.ts` / `contract-api.ts` dla helperów strumienia Claude
  beta-header i `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` eksportuje konstruktory dostawcy,
  helpery modeli domyślnych i konstruktory dostawcy czasu rzeczywistego.
- **`@openclaw/openrouter-provider`**: `api.ts` eksportuje konstruktor dostawcy
  oraz helpery onboardingu/konfiguracji.

<Warning>
  Kod produkcyjny rozszerzeń powinien także unikać importów `openclaw/plugin-sdk/<other-plugin>`.
  Jeśli helper jest naprawdę współdzielony, przenieś go do neutralnej podścieżki SDK,
  takiej jak `openclaw/plugin-sdk/speech`, `.../provider-model-shared` albo innej
  powierzchni zorientowanej na funkcję, zamiast łączyć dwa pluginy ze sobą.
</Warning>

## Powiązane

<CardGroup cols={2}>
  <Card title="Punkty wejścia" icon="door-open" href="/pl/plugins/sdk-entrypoints">
    Opcje `definePluginEntry` i `defineChannelPluginEntry`.
  </Card>
  <Card title="Helpery środowiska uruchomieniowego" icon="gears" href="/pl/plugins/sdk-runtime">
    Pełna dokumentacja referencyjna przestrzeni nazw `api.runtime`.
  </Card>
  <Card title="Konfiguracja i ustawienia" icon="sliders" href="/pl/plugins/sdk-setup">
    Pakowanie, manifesty i schematy konfiguracji.
  </Card>
  <Card title="Testowanie" icon="vial" href="/pl/plugins/sdk-testing">
    Narzędzia testowe i reguły lintowania.
  </Card>
  <Card title="Migracja SDK" icon="arrows-turn-right" href="/pl/plugins/sdk-migration">
    Migracja z wycofanych powierzchni.
  </Card>
  <Card title="Wewnętrzna architektura pluginów" icon="diagram-project" href="/pl/plugins/architecture">
    Głęboka architektura i model funkcji.
  </Card>
</CardGroup>
