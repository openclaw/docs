---
read_when:
    - Musisz wiedzieć, z której subścieżki SDK importować
    - Chcesz dokumentacji wszystkich metod rejestracji w `OpenClawPluginApi`
    - Szukasz konkretnego eksportu SDK
sidebarTitle: SDK overview
summary: Mapa importów, dokumentacja rejestracji API i architektura SDK
title: Przegląd SDK Pluginów
x-i18n:
    generated_at: "2026-04-24T09:24:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f4209c245a3d3462c5d5f51ad3c6e4327240ed402fdbac3f01f8a761ba75233
    source_path: plugins/sdk-overview.md
    workflow: 15
---

SDK Pluginów to typowany kontrakt między Pluginami a rdzeniem. Ta strona jest
dokumentacją tego, **co importować** i **co można rejestrować**.

<Tip>
  Szukasz zamiast tego przewodnika krok po kroku?

- Pierwszy Plugin? Zacznij od [Budowania Pluginów](/pl/plugins/building-plugins).
- Plugin kanału? Zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins).
- Plugin providera? Zobacz [Pluginy providerów](/pl/plugins/sdk-provider-plugins).
  </Tip>

## Konwencja importów

Zawsze importuj z konkretnej subścieżki:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Każda subścieżka to mały, samowystarczalny moduł. Dzięki temu start pozostaje szybki
i unika się problemów z zależnościami cyklicznymi. Dla helperów wejścia/budowania specyficznych dla kanałów
preferuj `openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core` zachowaj dla
szerszej powierzchni ogólnej i współdzielonych helperów, takich jak
`buildChannelConfigSchema`.

<Warning>
  Nie importuj convenience seamów markowanych providerem lub kanałem (na przykład
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Dołączone Pluginy składają generyczne subścieżki SDK we własnych barrelach `api.ts` /
  `runtime-api.ts`; konsumenci rdzenia powinni albo używać tych lokalnych barrelów Pluginów,
  albo dodać wąski generyczny kontrakt SDK, gdy potrzeba naprawdę dotyczy wielu
  kanałów.

Niewielki zestaw seamów helperów dołączonych Pluginów (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` i podobne) nadal pojawia się w
wygenerowanej mapie eksportów. Istnieją wyłącznie na potrzeby utrzymania dołączonych Pluginów i
nie są zalecanymi ścieżkami importu dla nowych Pluginów zewnętrznych.
</Warning>

## Dokumentacja subścieżek

SDK Pluginów jest udostępniane jako zestaw wąskich subścieżek pogrupowanych według obszaru (wejście
Pluginu, kanał, provider, auth, runtime, capability, pamięć i zarezerwowane
helpery dołączonych Pluginów). Pełny katalog — pogrupowany i podlinkowany — znajdziesz w
[Subścieżkach SDK Pluginów](/pl/plugins/sdk-subpaths).

Wygenerowana lista ponad 200 subścieżek znajduje się w `scripts/lib/plugin-sdk-entrypoints.json`.

## API rejestracji

Callback `register(api)` otrzymuje obiekt `OpenClawPluginApi` z następującymi
metodami:

### Rejestracja możliwości

| Metoda                                           | Co rejestruje                        |
| ------------------------------------------------ | ------------------------------------ |
| `api.registerProvider(...)`                      | Inferencję tekstową (LLM)            |
| `api.registerAgentHarness(...)`                  | Eksperymentalny niskopoziomowy executor agenta |
| `api.registerCliBackend(...)`                    | Lokalny backend inferencji CLI       |
| `api.registerChannel(...)`                       | Kanał wiadomości                     |
| `api.registerSpeechProvider(...)`                | Text-to-speech / synteza STT         |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming transkrypcji realtime      |
| `api.registerRealtimeVoiceProvider(...)`         | Dupleksowe sesje głosowe realtime    |
| `api.registerMediaUnderstandingProvider(...)`    | Analizę obrazu/audio/wideo           |
| `api.registerImageGenerationProvider(...)`       | Generowanie obrazów                  |
| `api.registerMusicGenerationProvider(...)`       | Generowanie muzyki                   |
| `api.registerVideoGenerationProvider(...)`       | Generowanie wideo                    |
| `api.registerWebFetchProvider(...)`              | Provider web fetch / scrape          |
| `api.registerWebSearchProvider(...)`             | Wyszukiwanie w sieci                 |

### Narzędzia i polecenia

| Metoda                          | Co rejestruje                                 |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Narzędzie agenta (wymagane lub `{ optional: true }`) |
| `api.registerCommand(def)`      | Niestandardowe polecenie (omija LLM)          |

### Infrastruktura

| Metoda                                          | Co rejestruje                         |
| ----------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook zdarzeń                          |
| `api.registerHttpRoute(params)`                 | Punkt końcowy HTTP Gateway            |
| `api.registerGatewayMethod(name, handler)`      | Metodę RPC Gateway                    |
| `api.registerGatewayDiscoveryService(service)`  | Lokalny reklamujący usługę wykrywania Gateway |
| `api.registerCli(registrar, opts?)`             | Podpolecenie CLI                      |
| `api.registerService(service)`                  | Usługę działającą w tle               |
| `api.registerInteractiveHandler(registration)`  | Interactive handler                   |
| `api.registerEmbeddedExtensionFactory(factory)` | Fabrykę rozszerzeń Pi embedded-runner |
| `api.registerMemoryPromptSupplement(builder)`   | Addytywną sekcję promptu związaną z pamięcią |
| `api.registerMemoryCorpusSupplement(adapter)`   | Addytywne corpus search/read pamięci  |

<Note>
  Zarezerwowane administracyjne przestrzenie nazw rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) zawsze pozostają `operator.admin`, nawet jeśli Plugin próbuje przypisać
  węższy zakres metodzie gateway. Dla metod należących do Pluginu preferuj
  prefiksy specyficzne dla Pluginu.
</Note>

<Accordion title="Kiedy używać registerEmbeddedExtensionFactory">
  Użyj `api.registerEmbeddedExtensionFactory(...)`, gdy Plugin potrzebuje natywnego dla Pi
  czasu zdarzeń podczas uruchomień osadzonych OpenClaw — na przykład asynchronicznych przepisów
  `tool_result`, które muszą nastąpić przed emisją końcowej wiadomości z wynikiem narzędzia.

To jest dziś seam dołączonych Pluginów: tylko dołączone Pluginy mogą go rejestrować,
i muszą zadeklarować `contracts.embeddedExtensionFactories: ["pi"]` w
`openclaw.plugin.json`. Dla wszystkiego, co nie wymaga tego niższego seam, zachowaj zwykłe hooki Pluginów OpenClaw.
</Accordion>

### Rejestracja wykrywania Gateway

`api.registerGatewayDiscoveryService(...)` pozwala Pluginowi reklamować aktywny
Gateway w lokalnym transporcie wykrywania, takim jak mDNS/Bonjour. OpenClaw wywołuje usługę
podczas uruchamiania Gateway, gdy lokalne wykrywanie jest włączone, przekazuje
bieżące porty Gateway i niesekretne dane podpowiedzi TXT, a podczas
zamykania Gateway wywołuje zwrócony handler `stop`.

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
uwierzytelniania. Wykrywanie jest wskazówką routingu; auth Gateway i pinning TLS nadal
zarządzają zaufaniem.

### Metadane rejestracji CLI

`api.registerCli(registrar, opts?)` akceptuje dwa rodzaje metadanych najwyższego poziomu:

- `commands`: jawne korzenie poleceń należące do registrar
- `descriptors`: deskryptory poleceń na etapie parsowania używane dla pomocy głównego CLI,
  routingu i leniwej rejestracji CLI Pluginu

Jeśli chcesz, aby polecenie Pluginu pozostało leniwie ładowane w zwykłej ścieżce głównego CLI,
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
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Używaj samego `commands` tylko wtedy, gdy nie potrzebujesz leniwej rejestracji głównego CLI.
Ta ścieżka zgodności eager nadal jest obsługiwana, ale nie instaluje
placeholderów opartych na descriptor do leniwego ładowania na etapie parsowania.

### Rejestracja backendu CLI

`api.registerCliBackend(...)` pozwala Pluginowi zarządzać domyślną konfiguracją lokalnego
backendu CLI AI, takiego jak `codex-cli`.

- `id` backendu staje się prefiksem providera w odwołaniach modeli takich jak `codex-cli/gpt-5`.
- `config` backendu używa tego samego kształtu co `agents.defaults.cliBackends.<id>`.
- Konfiguracja użytkownika nadal wygrywa. OpenClaw scala `agents.defaults.cliBackends.<id>` z wartościami domyślnymi Pluginu przed uruchomieniem CLI.
- Użyj `normalizeConfig`, gdy backend potrzebuje przepisów zgodności po scaleniu
  (na przykład normalizacji starszych kształtów flag).

### Sloty wyłączne

| Metoda                                     | Co rejestruje                                                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Silnik kontekstu (aktywny może być tylko jeden). Callback `assemble()` otrzymuje `availableTools` i `citationsMode`, aby silnik mógł dostosować dodatki do promptu. |
| `api.registerMemoryCapability(capability)` | Ujednoliconą możliwość pamięci                                                                                                                         |
| `api.registerMemoryPromptSection(builder)` | Builder sekcji promptu pamięci                                                                                                                         |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver planu flush pamięci                                                                                                                           |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime pamięci                                                                                                                                |

### Adaptery embeddingów pamięci

| Metoda                                         | Co rejestruje                               |
| ---------------------------------------------- | ------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embeddingów pamięci dla aktywnego Pluginu |

- `registerMemoryCapability` to preferowane wyłączne API Pluginu pamięci.
- `registerMemoryCapability` może również udostępniać `publicArtifacts.listArtifacts(...)`,
  aby Pluginy towarzyszące mogły konsumować wyeksportowane artefakty pamięci przez
  `openclaw/plugin-sdk/memory-host-core` zamiast sięgać do prywatnego układu konkretnego
  Pluginu pamięci.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` i
  `registerMemoryRuntime` to starsze, zgodne wstecz wyłączne API Pluginu pamięci.
- `registerMemoryEmbeddingProvider` pozwala aktywnemu Pluginowi pamięci rejestrować jeden
  lub więcej identyfikatorów adapterów embeddingów (na przykład `openai`, `gemini` lub niestandardowy
  identyfikator zdefiniowany przez Plugin).
- Konfiguracja użytkownika taka jak `agents.defaults.memorySearch.provider` oraz
  `agents.defaults.memorySearch.fallback` rozstrzyga się względem tych zarejestrowanych
  identyfikatorów adapterów.

### Zdarzenia i cykl życia

| Metoda                                       | Co robi                    |
| -------------------------------------------- | -------------------------- |
| `api.on(hookName, handler, opts?)`           | Typowany hook cyklu życia  |
| `api.onConversationBindingResolved(handler)` | Callback powiązania konwersacji |

### Semantyka decyzji hooków

- `before_tool_call`: zwrócenie `{ block: true }` jest terminalne. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `before_tool_call`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `before_install`: zwrócenie `{ block: true }` jest terminalne. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `before_install`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `reply_dispatch`: zwrócenie `{ handled: true, ... }` jest terminalne. Gdy dowolny handler przejmie dispatch, handlery o niższym priorytecie oraz domyślna ścieżka dispatch modelu są pomijane.
- `message_sending`: zwrócenie `{ cancel: true }` jest terminalne. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `message_sending`: zwrócenie `{ cancel: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `cancel`), a nie jako nadpisanie.
- `message_received`: używaj typowanego pola `threadId`, gdy potrzebujesz routingu przychodzącego wątku/tematu. `metadata` zachowaj dla dodatków specyficznych dla kanału.
- `message_sending`: używaj typowanych pól routingu `replyToId` / `threadId`, zanim wrócisz do `metadata` specyficznych dla kanału.
- `gateway_start`: używaj `ctx.config`, `ctx.workspaceDir` i `ctx.getCron?.()` dla stanu startowego należącego do gateway zamiast polegać na wewnętrznych hookach `gateway:startup`.

### Pola obiektu API

| Pole                     | Typ                       | Opis                                                                                         |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | identyfikator Pluginu                                                                        |
| `api.name`               | `string`                  | nazwa wyświetlana                                                                            |
| `api.version`            | `string?`                 | wersja Pluginu (opcjonalna)                                                                  |
| `api.description`        | `string?`                 | opis Pluginu (opcjonalny)                                                                    |
| `api.source`             | `string`                  | ścieżka źródłowa Pluginu                                                                     |
| `api.rootDir`            | `string?`                 | katalog główny Pluginu (opcjonalny)                                                          |
| `api.config`             | `OpenClawConfig`          | bieżący snapshot konfiguracji (aktywny snapshot runtime w pamięci, gdy dostępny)             |
| `api.pluginConfig`       | `Record<string, unknown>` | konfiguracja specyficzna dla Pluginu z `plugins.entries.<id>.config`                         |
| `api.runtime`            | `PluginRuntime`           | [Helpery runtime](/pl/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | logger ograniczony do Pluginu (`debug`, `info`, `warn`, `error`)                             |
| `api.registrationMode`   | `PluginRegistrationMode`  | bieżący tryb ładowania; `"setup-runtime"` to lekkie okno startu/konfiguracji przed pełnym wejściem |
| `api.resolvePath(input)` | `(string) => string`      | rozstrzyga ścieżkę względem katalogu głównego Pluginu                                        |

## Konwencja modułów wewnętrznych

Wewnątrz własnego Pluginu używaj lokalnych plików barrel do importów wewnętrznych:

```
my-plugin/
  api.ts            # Publiczne eksporty dla zewnętrznych konsumentów
  runtime-api.ts    # Eksporty runtime tylko do użytku wewnętrznego
  index.ts          # Punkt wejścia Pluginu
  setup-entry.ts    # Lekki punkt wejścia tylko do konfiguracji (opcjonalnie)
```

<Warning>
  Nigdy nie importuj własnego Pluginu przez `openclaw/plugin-sdk/<your-plugin>`
  z kodu produkcyjnego. Kieruj importy wewnętrzne przez `./api.ts` lub
  `./runtime-api.ts`. Ścieżka SDK jest wyłącznie kontraktem zewnętrznym.
</Warning>

Publiczne powierzchnie dołączonych Pluginów ładowane przez fasadę (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` i podobne publiczne pliki wejściowe) preferują
aktywny snapshot konfiguracji runtime, gdy OpenClaw już działa. Jeśli żaden snapshot
runtime jeszcze nie istnieje, wracają do rozstrzygniętego pliku konfiguracji na dysku.

Pluginy providerów mogą udostępniać wąski lokalny barrel kontraktu Pluginu, gdy
helper jest celowo specyficzny dla providera i jeszcze nie należy do generycznej subścieżki SDK.
Dołączone przykłady:

- **Anthropic**: publiczny seam `api.ts` / `contract-api.ts` dla helperów
  strumieni `service_tier` i beta-header Claude.
- **`@openclaw/openai-provider`**: `api.ts` eksportuje buildery providerów,
  helpery modeli domyślnych i buildery providerów realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` eksportuje builder providera
  oraz helpery onboardingu/konfiguracji.

<Warning>
  Kod produkcyjny rozszerzeń powinien również unikać importów `openclaw/plugin-sdk/<other-plugin>`.
  Jeśli helper jest naprawdę współdzielony, przenieś go do neutralnej subścieżki SDK
  takiej jak `openclaw/plugin-sdk/speech`, `.../provider-model-shared` lub innej
  powierzchni zorientowanej na capability zamiast ściśle wiązać dwa Pluginy ze sobą.
</Warning>

## Powiązane

<CardGroup cols={2}>
  <Card title="Punkty wejścia" icon="door-open" href="/pl/plugins/sdk-entrypoints">
    Opcje `definePluginEntry` i `defineChannelPluginEntry`.
  </Card>
  <Card title="Helpery runtime" icon="gears" href="/pl/plugins/sdk-runtime">
    Pełna dokumentacja przestrzeni nazw `api.runtime`.
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
  <Card title="Wnętrze Pluginów" icon="diagram-project" href="/pl/plugins/architecture">
    Głęboka architektura i model capability.
  </Card>
</CardGroup>
