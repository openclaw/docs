---
read_when:
    - Musisz wiedzieć, z której podścieżki SDK importować
    - Potrzebujesz dokumentacji referencyjnej wszystkich metod rejestracji w OpenClawPluginApi
    - Szukasz konkretnego eksportu SDK
sidebarTitle: Plugin SDK overview
summary: Mapa importów, dokumentacja referencyjna API rejestracji i architektura SDK
title: Przegląd Plugin SDK
x-i18n:
    generated_at: "2026-05-04T18:24:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8187e7d4cfb9d6fb19bbdebfbaea0bb4d98fa5cea4742d0f82a765ae5bc60127
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK pluginów jest typowanym kontraktem między pluginami a rdzeniem. Ta strona jest
odniesieniem dla **tego, co importować** i **tego, co można zarejestrować**.

<Note>
  Ta strona jest przeznaczona dla autorów pluginów używających `openclaw/plugin-sdk/*` wewnątrz
  OpenClaw. W przypadku zewnętrznych aplikacji, skryptów, pulpitów, zadań CI i rozszerzeń IDE,
  które chcą uruchamiać agentów przez Gateway, użyj zamiast tego
  [OpenClaw App SDK](/pl/concepts/openclaw-sdk) oraz pakietu `@openclaw/sdk`.
</Note>

<Tip>
Szukasz raczej przewodnika krok po kroku? Zacznij od [Tworzenie pluginów](/pl/plugins/building-plugins), użyj [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) dla pluginów kanałów, [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) dla pluginów dostawców oraz [Hooki pluginów](/pl/plugins/hooks) dla pluginów hooków narzędzi lub cyklu życia.
</Tip>

## Konwencja importu

Zawsze importuj z konkretnej podścieżki:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Każda podścieżka jest małym, samodzielnym modułem. Dzięki temu uruchamianie jest szybkie i
zapobiega problemom z zależnościami cyklicznymi. W przypadku pomocników wejścia/budowania
specyficznych dla kanału preferuj `openclaw/plugin-sdk/channel-core`; zachowaj
`openclaw/plugin-sdk/core` dla szerszej powierzchni zbiorczej i współdzielonych pomocników, takich jak
`buildChannelConfigSchema`.

W przypadku konfiguracji kanału opublikuj należący do kanału JSON Schema przez
`openclaw.plugin.json#channelConfigs`. Podścieżka `plugin-sdk/channel-config-schema`
służy do współdzielonych prymitywów schematów i ogólnego konstruktora. Wbudowane pluginy OpenClaw
używają `plugin-sdk/bundled-channel-config-schema` dla zachowanych schematów
wbudowanych kanałów. Przestarzałe eksporty zgodności pozostają w
`plugin-sdk/channel-config-schema-legacy`; żadna z podścieżek schematów wbudowanych nie jest
wzorcem dla nowych pluginów.

<Warning>
  Nie importuj wygodnych, brandowanych przez dostawcę lub kanał seamów (na przykład
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Wbudowane pluginy składają ogólne podścieżki SDK wewnątrz własnych beczek `api.ts` /
  `runtime-api.ts`; konsumenci rdzenia powinni używać tych lokalnych dla pluginu
  beczek albo dodać wąski ogólny kontrakt SDK, gdy potrzeba jest naprawdę
  międzykanałowa.

Mały zestaw seamów pomocniczych wbudowanych pluginów nadal pojawia się w wygenerowanej mapie eksportów,
gdy mają śledzone użycie właścicieli. Istnieją wyłącznie do utrzymania wbudowanych pluginów
i nie są zalecanymi ścieżkami importu dla nowych pluginów zewnętrznych.

`openclaw/plugin-sdk/discord` i `openclaw/plugin-sdk/telegram-account` są
również zachowane jako przestarzałe fasady zgodności dla śledzonego użycia właścicieli. Nie
kopiuj tych ścieżek importu do nowych pluginów; zamiast tego używaj wstrzykiwanych pomocników runtime
i ogólnych podścieżek SDK kanałów.
</Warning>

## Odniesienie podścieżek

SDK pluginów jest udostępniane jako zestaw wąskich podścieżek pogrupowanych według obszaru (wejście
pluginu, kanał, dostawca, uwierzytelnianie, runtime, capability, pamięć oraz zarezerwowane
pomocniki wbudowanych pluginów). Pełny katalog, pogrupowany i podlinkowany, znajdziesz w
[Podścieżki SDK pluginów](/pl/plugins/sdk-subpaths).

Wygenerowana lista ponad 200 podścieżek znajduje się w `scripts/lib/plugin-sdk-entrypoints.json`.

## API rejestracji

Callback `register(api)` otrzymuje obiekt `OpenClawPluginApi` z tymi
metodami:

### Rejestracja capability

| Metoda                                           | Co rejestruje                          |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Wnioskowanie tekstowe (LLM)            |
| `api.registerAgentHarness(...)`                  | Eksperymentalny niskopoziomowy executor agentów |
| `api.registerCliBackend(...)`                    | Lokalny backend wnioskowania CLI       |
| `api.registerChannel(...)`                       | Kanał wiadomości                       |
| `api.registerSpeechProvider(...)`                | Synteza tekst-na-mowę / STT            |
| `api.registerRealtimeTranscriptionProvider(...)` | Strumieniowa transkrypcja w czasie rzeczywistym |
| `api.registerRealtimeVoiceProvider(...)`         | Dupleksowe sesje głosowe w czasie rzeczywistym |
| `api.registerMediaUnderstandingProvider(...)`    | Analiza obrazów/audio/wideo            |
| `api.registerImageGenerationProvider(...)`       | Generowanie obrazów                    |
| `api.registerMusicGenerationProvider(...)`       | Generowanie muzyki                     |
| `api.registerVideoGenerationProvider(...)`       | Generowanie wideo                      |
| `api.registerWebFetchProvider(...)`              | Dostawca pobierania / scrape’owania WWW |
| `api.registerWebSearchProvider(...)`             | Wyszukiwanie w sieci                   |

### Narzędzia i polecenia

| Metoda                          | Co rejestruje                                  |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Narzędzie agenta (wymagane lub `{ optional: true }`) |
| `api.registerCommand(def)`      | Niestandardowe polecenie (omija LLM)           |

Polecenia pluginów mogą ustawić `agentPromptGuidance`, gdy agent potrzebuje krótkiej,
należącej do polecenia wskazówki routingu. Zachowaj ten tekst o samym poleceniu; nie dodawaj
polityki specyficznej dla dostawcy lub pluginu do konstruktorów promptów rdzenia.

### Infrastruktura

| Metoda                                         | Co rejestruje                          |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook zdarzenia                         |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway                  |
| `api.registerGatewayMethod(name, handler)`     | Metoda RPC Gateway                     |
| `api.registerGatewayDiscoveryService(service)` | Lokalny anons usługi wykrywania Gateway |
| `api.registerCli(registrar, opts?)`            | Podpolecenie CLI                       |
| `api.registerService(service)`                 | Usługa w tle                           |
| `api.registerInteractiveHandler(registration)` | Handler interaktywny                   |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware runtime dla wyników narzędzi |
| `api.registerMemoryPromptSupplement(builder)`  | Addytywna sekcja promptu sąsiadująca z pamięcią |
| `api.registerMemoryCorpusSupplement(adapter)`  | Addytywny korpus wyszukiwania/odczytu pamięci |

### Hooki hosta dla pluginów workflow

Hooki hosta są seamami SDK dla pluginów, które muszą uczestniczyć w cyklu życia hosta,
a nie tylko dodawać dostawcę, kanał lub narzędzie. Są to
ogólne kontrakty; Plan Mode może ich używać, ale mogą też workflow zatwierdzania,
bramki polityk workspace, monitory w tle, kreatory konfiguracji i towarzyszące pluginy UI.

| Metoda                                                                   | Kontrakt, który posiada                                                                                                           |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Należący do pluginu, zgodny z JSON stan sesji projektowany przez sesje Gateway                                                     |
| `api.enqueueNextTurnInjection(...)`                                      | Trwały kontekst dokładnie raz wstrzyknięty do następnej tury agenta dla jednej sesji                                               |
| `api.registerTrustedToolPolicy(...)`                                     | Polityka narzędzi pre-pluginu dla wbudowanych/zaufanych narzędzi, która może blokować lub przepisywać parametry narzędzia          |
| `api.registerToolMetadata(...)`                                          | Metadane wyświetlania katalogu narzędzi bez zmiany implementacji narzędzia                                                        |
| `api.registerCommand(...)`                                               | Zakresowane polecenia pluginów; wyniki poleceń mogą ustawiać `continueAgent: true`; natywne polecenia Discord obsługują `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Deskryptory wkładu Control UI dla powierzchni sesji, narzędzia, uruchomienia lub ustawień                                          |
| `api.registerRuntimeLifecycle(...)`                                      | Callbacki czyszczenia dla należących do pluginu zasobów runtime na ścieżkach resetowania/usuwania/ponownego ładowania              |
| `api.registerAgentEventSubscription(...)`                                | Oczyszczone subskrypcje zdarzeń dla stanu workflow i monitorów                                                                     |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Tymczasowy stan pluginu na uruchomienie, czyszczony przy terminalnym cyklu życia uruchomienia                                      |
| `api.registerSessionSchedulerJob(...)`                                   | Należące do pluginu rekordy zadań harmonogramu sesji z deterministycznym czyszczeniem                                              |

Kontrakty celowo rozdzielają uprawnienia:

- Zewnętrzne pluginy mogą posiadać rozszerzenia sesji, deskryptory UI, polecenia, metadane narzędzi, wstrzyknięcia następnej tury i zwykłe hooki.
- Zaufane polityki narzędzi działają przed zwykłymi hookami `before_tool_call` i są wyłącznie wbudowane, ponieważ uczestniczą w polityce bezpieczeństwa hosta.
- Zarezerwowane posiadanie poleceń jest wyłącznie wbudowane. Zewnętrzne pluginy powinny używać własnych nazw poleceń lub aliasów.
- `allowPromptInjection=false` wyłącza hooki modyfikujące prompt, w tym
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  pola promptu ze starszego `before_agent_start` oraz
  `enqueueNextTurnInjection`.

Przykłady konsumentów niebędących Plan:

| Archetyp pluginu             | Używane hooki                                                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Workflow zatwierdzania       | Rozszerzenie sesji, kontynuacja polecenia, wstrzyknięcie następnej tury, deskryptor UI                                             |
| Bramki polityki budżetu/workspace | Zaufana polityka narzędzi, metadane narzędzi, projekcja sesji                                                                  |
| Monitor cyklu życia w tle    | Czyszczenie cyklu życia runtime, subskrypcja zdarzeń agenta, posiadanie/czyszczenie harmonogramu sesji, wkład promptu heartbeat, deskryptor UI |
| Kreator konfiguracji lub onboardingu | Rozszerzenie sesji, zakresowane polecenia, deskryptor Control UI                                                            |

<Note>
  Zarezerwowane przestrzenie nazw administratora rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) zawsze pozostają `operator.admin`, nawet jeśli plugin próbuje przypisać
  węższy zakres metody gateway. Preferuj prefiksy specyficzne dla pluginu dla
  metod należących do pluginu.
</Note>

<Accordion title="Kiedy używać middleware wyników narzędzi">
  Wbudowane pluginy mogą używać `api.registerAgentToolResultMiddleware(...)`, gdy
  muszą przepisać wynik narzędzia po wykonaniu i zanim runtime
  poda ten wynik z powrotem do modelu. To zaufany, neutralny względem runtime
  seam dla asynchronicznych reduktorów wyjścia, takich jak tokenjuice.

Wbudowane pluginy muszą deklarować `contracts.agentToolResultMiddleware` dla każdego
docelowego runtime, na przykład `["pi", "codex"]`. Zewnętrzne pluginy
nie mogą rejestrować tego middleware; zachowaj zwykłe hooki pluginów OpenClaw dla pracy,
która nie wymaga czasowania wyniku narzędzia przed modelem. Stara, osadzona ścieżka
rejestracji fabryki rozszerzeń tylko dla Pi została usunięta.
</Accordion>

### Rejestracja wykrywania Gateway

`api.registerGatewayDiscoveryService(...)` pozwala Pluginowi ogłaszać aktywny
Gateway w lokalnym transporcie wykrywania, takim jak mDNS/Bonjour. OpenClaw wywołuje
usługę podczas uruchamiania Gateway, gdy lokalne wykrywanie jest włączone, przekazuje
bieżące porty Gateway oraz nietajne dane podpowiedzi TXT i wywołuje zwrócony
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
uwierzytelniania. Wykrywanie jest podpowiedzią routingu; uwierzytelnianie Gateway i przypinanie TLS nadal
odpowiadają za zaufanie.

### Metadane rejestracji CLI

`api.registerCli(registrar, opts?)` akceptuje dwa rodzaje metadanych najwyższego poziomu:

- `commands`: jawne korzenie poleceń należące do rejestratora
- `descriptors`: deskryptory poleceń używane w czasie parsowania na potrzeby pomocy głównego CLI,
  routingu i leniwej rejestracji CLI Pluginu

Jeśli chcesz, aby polecenie Pluginu pozostało leniwie ładowane w normalnej ścieżce głównego CLI,
podaj `descriptors`, które obejmują każdy korzeń polecenia najwyższego poziomu udostępniany przez tego
rejestratora.

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
symboli zastępczych opartych na deskryptorach do leniwego ładowania w czasie parsowania.

### Rejestracja backendu CLI

`api.registerCliBackend(...)` pozwala Pluginowi posiadać domyślną konfigurację lokalnego
backendu AI CLI, takiego jak `codex-cli`.

- Backend `id` staje się prefiksem dostawcy w referencjach modeli, takich jak `codex-cli/gpt-5`.
- Backend `config` używa tego samego kształtu co `agents.defaults.cliBackends.<id>`.
- Konfiguracja użytkownika nadal ma pierwszeństwo. OpenClaw scala `agents.defaults.cliBackends.<id>` nad
  domyślną konfiguracją Pluginu przed uruchomieniem CLI.
- Użyj `normalizeConfig`, gdy backend wymaga przepisania zgodności po scaleniu
  (na przykład normalizacji starych kształtów flag).
- Użyj `resolveExecutionArgs` do przepisywania argv w zakresie żądania, które należy do
  dialektu CLI, takiego jak mapowanie poziomów myślenia OpenClaw na natywną flagę wysiłku.

### Sloty wyłączne

| Metoda                                     | Co rejestruje                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Silnik kontekstu (jeden aktywny naraz). Callback `assemble()` otrzymuje `availableTools` i `citationsMode`, aby silnik mógł dostosować dodatki do promptu. |
| `api.registerMemoryCapability(capability)` | Ujednolicona zdolność pamięci                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Konstruktor sekcji promptu pamięci                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver planu opróżniania pamięci                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime pamięci                                                                                                                                    |

### Adaptery embeddingów pamięci

| Metoda                                         | Co rejestruje                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embeddingów pamięci dla aktywnego Pluginu |

- `registerMemoryCapability` to preferowany wyłączny interfejs API Pluginu pamięci.
- `registerMemoryCapability` może także udostępniać `publicArtifacts.listArtifacts(...)`,
  aby Pluginy towarzyszące mogły korzystać z wyeksportowanych artefaktów pamięci przez
  `openclaw/plugin-sdk/memory-host-core`, zamiast sięgać do prywatnego układu konkretnego
  Pluginu pamięci.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` i
  `registerMemoryRuntime` to wyłączne interfejsy API Pluginu pamięci zgodne ze starszymi wersjami.
- `MemoryFlushPlan.model` może przypiąć turę opróżniania do dokładnej referencji
  `provider/model`, takiej jak `ollama/qwen3:8b`, bez dziedziczenia aktywnego łańcucha
  fallback.
- `registerMemoryEmbeddingProvider` pozwala aktywnemu Pluginowi pamięci zarejestrować jeden
  lub więcej identyfikatorów adapterów embeddingów (na przykład `openai`, `gemini` albo niestandardowy
  identyfikator zdefiniowany przez Plugin).
- Konfiguracja użytkownika, taka jak `agents.defaults.memorySearch.provider` i
  `agents.defaults.memorySearch.fallback`, jest rozwiązywana względem tych zarejestrowanych
  identyfikatorów adapterów.

### Zdarzenia i cykl życia

| Metoda                                       | Co robi                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Typowany hook cyklu życia          |
| `api.onConversationBindingResolved(handler)` | Callback powiązania konwersacji |

Zobacz [hooki Pluginów](/pl/plugins/hooks), aby poznać przykłady, typowe nazwy hooków i semantykę strażników.

### Semantyka decyzji hooków

- `before_tool_call`: zwrócenie `{ block: true }` jest końcowe. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `before_tool_call`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `before_install`: zwrócenie `{ block: true }` jest końcowe. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `before_install`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `reply_dispatch`: zwrócenie `{ handled: true, ... }` jest końcowe. Gdy dowolny handler przejmie wysyłkę, handlery o niższym priorytecie i domyślna ścieżka wysyłki modelu są pomijane.
- `message_sending`: zwrócenie `{ cancel: true }` jest końcowe. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `message_sending`: zwrócenie `{ cancel: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `cancel`), a nie jako nadpisanie.
- `message_received`: użyj typowanego pola `threadId`, gdy potrzebujesz routingu przychodzącego wątku/tematu. Zachowaj `metadata` na dodatki specyficzne dla kanału.
- `message_sending`: użyj typowanych pól routingu `replyToId` / `threadId` przed przejściem do specyficznego dla kanału `metadata`.
- `gateway_start`: użyj `ctx.config`, `ctx.workspaceDir` i `ctx.getCron?.()` dla stanu uruchomieniowego należącego do Gateway, zamiast polegać na wewnętrznych hookach `gateway:startup`.
- `cron_changed`: obserwuj zmiany cyklu życia Cron należącego do Gateway. Użyj `event.job?.state?.nextRunAtMs` i `ctx.getCron?.()` podczas synchronizowania zewnętrznych harmonogramów wybudzania oraz utrzymuj OpenClaw jako źródło prawdy dla sprawdzania terminów i wykonywania.

### Pola obiektu API

| Pole                    | Typ                      | Opis                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identyfikator Pluginu                                                                                   |
| `api.name`               | `string`                  | Nazwa wyświetlana                                                                                |
| `api.version`            | `string?`                 | Wersja Pluginu (opcjonalnie)                                                                   |
| `api.description`        | `string?`                 | Opis Pluginu (opcjonalnie)                                                               |
| `api.source`             | `string`                  | Ścieżka źródłowa Pluginu                                                                          |
| `api.rootDir`            | `string?`                 | Katalog główny Pluginu (opcjonalnie)                                                            |
| `api.config`             | `OpenClawConfig`          | Bieżący zrzut konfiguracji (aktywny zrzut runtime w pamięci, gdy jest dostępny)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfiguracja specyficzna dla Pluginu z `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Helpery runtime](/pl/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger o ograniczonym zakresie (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Bieżący tryb ładowania; `"setup-runtime"` to lekkie okno uruchamiania/konfiguracji przed pełnym wejściem |
| `api.resolvePath(input)` | `(string) => string`      | Rozwiązuje ścieżkę względem katalogu głównego Pluginu                                                        |

## Konwencja modułu wewnętrznego

W swoim Pluginie używaj lokalnych plików zbiorczych do importów wewnętrznych:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Nigdy nie importuj własnego Pluginu przez `openclaw/plugin-sdk/<your-plugin>`
  z kodu produkcyjnego. Kieruj importy wewnętrzne przez `./api.ts` albo
  `./runtime-api.ts`. Ścieżka SDK jest wyłącznie kontraktem zewnętrznym.
</Warning>

Publiczne powierzchnie dołączonych Pluginów ładowane przez fasadę (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` i podobne publiczne pliki wejściowe) preferują
aktywny zrzut konfiguracji runtime, gdy OpenClaw już działa. Jeśli zrzut runtime
jeszcze nie istnieje, wracają do rozwiązanej konfiguracji z pliku na dysku.
Fasady spakowanych dołączonych Pluginów powinny być ładowane przez loadery fasad Pluginów
OpenClaw; bezpośrednie importy z `dist/extensions/...` omijają manifest
i sprawdzenia bocznego procesu runtime, których spakowane instalacje używają dla kodu należącego do Pluginu.

Pluginy dostawców mogą udostępniać wąski lokalny dla Pluginu plik zbiorczy kontraktu, gdy
helper jest celowo specyficzny dla dostawcy i nie pasuje jeszcze do ogólnej podścieżki SDK.
Dołączone przykłady:

- **Anthropic**: publiczny szew `api.ts` / `contract-api.ts` dla helperów strumieni Claude
  beta-header i `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` eksportuje konstruktory dostawcy,
  helpery modeli domyślnych i konstruktory dostawcy realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` eksportuje konstruktor dostawcy
  oraz helpery onboardingu/konfiguracji.

<Warning>
  Kod produkcyjny rozszerzenia powinien także unikać importów `openclaw/plugin-sdk/<other-plugin>`.
  Jeśli helper jest rzeczywiście współdzielony, przenieś go do neutralnej podścieżki SDK,
  takiej jak `openclaw/plugin-sdk/speech`, `.../provider-model-shared` albo innej
  powierzchni zorientowanej na zdolności, zamiast łączyć dwa Pluginy ze sobą.
</Warning>

## Powiązane

<CardGroup cols={2}>
  <Card title="Punkty wejścia" icon="door-open" href="/pl/plugins/sdk-entrypoints">
    Opcje `definePluginEntry` i `defineChannelPluginEntry`.
  </Card>
  <Card title="Pomocnicze funkcje runtime" icon="gears" href="/pl/plugins/sdk-runtime">
    Pełna dokumentacja przestrzeni nazw `api.runtime`.
  </Card>
  <Card title="Konfiguracja i ustawienia" icon="sliders" href="/pl/plugins/sdk-setup">
    Pakowanie, manifesty i schematy konfiguracji.
  </Card>
  <Card title="Testowanie" icon="vial" href="/pl/plugins/sdk-testing">
    Narzędzia testowe i reguły lintowania.
  </Card>
  <Card title="Migracja SDK" icon="arrows-turn-right" href="/pl/plugins/sdk-migration">
    Migracja z przestarzałych powierzchni.
  </Card>
  <Card title="Wewnętrzne mechanizmy Plugin" icon="diagram-project" href="/pl/plugins/architecture">
    Szczegółowa architektura i model możliwości.
  </Card>
</CardGroup>
