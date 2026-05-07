---
read_when:
    - Chcesz utworzyć nowy Plugin OpenClaw
    - Potrzebujesz szybkiego wprowadzenia do tworzenia Pluginów
    - Dodajesz nowy kanał, dostawcę, narzędzie lub inną funkcję do OpenClaw
sidebarTitle: Getting Started
summary: Utwórz swój pierwszy Plugin OpenClaw w kilka minut
title: Tworzenie Pluginów
x-i18n:
    generated_at: "2026-05-07T13:22:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b8eb1d4c36828c8e7031f3780f6a795ead2a1e723dd385a54626112163d592d
    source_path: plugins/building-plugins.md
    workflow: 16
---

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
mowę, transkrypcję w czasie rzeczywistym, głos w czasie rzeczywistym, rozumienie
mediów, generowanie obrazów, generowanie wideo, pobieranie z sieci, wyszukiwanie
w sieci, narzędzia agentów albo dowolną kombinację.

Nie musisz dodawać swojego pluginu do repozytorium OpenClaw. Opublikuj go w
[ClawHub](/pl/tools/clawhub), a użytkownicy zainstalują go poleceniem
`openclaw plugins install clawhub:<package-name>`. Same specyfikacje pakietów nadal
instalują z npm podczas przejścia uruchomieniowego.

## Wymagania wstępne

- Node >= 22 i menedżer pakietów (npm lub pnpm)
- Znajomość TypeScript (ESM)
- W przypadku pluginów w repozytorium: sklonowane repozytorium i wykonane `pnpm install`. Tworzenie pluginów w checkoutcie źródeł jest obsługiwane tylko przez pnpm, ponieważ OpenClaw ładuje dołączone pluginy z pakietów workspace `extensions/*`.

## Jaki rodzaj pluginu?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Połącz OpenClaw z platformą komunikacyjną (Discord, IRC itd.)
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Dodaj dostawcę modelu (LLM, proxy lub niestandardowy endpoint)
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/pl/plugins/cli-backend-plugins">
    Zamapuj lokalne AI CLI na tekstowy fallback runner OpenClaw
  </Card>
  <Card title="Tool / hook plugin" icon="wrench" href="/pl/plugins/hooks">
    Zarejestruj narzędzia agentów, hooki zdarzeń lub usługi - kontynuuj poniżej
  </Card>
</CardGroup>

W przypadku pluginu kanału, który nie ma gwarancji, że będzie zainstalowany podczas
onboardingu/konfiguracji, użyj `createOptionalChannelSetupSurface(...)` z
`openclaw/plugin-sdk/channel-setup`. Tworzy on parę adaptera konfiguracji i kreatora,
która informuje o wymaganiu instalacji i bezpiecznie odmawia rzeczywistych zapisów konfiguracji,
dopóki plugin nie zostanie zainstalowany.

## Szybki start: plugin narzędzia

Ten przewodnik tworzy minimalny plugin, który rejestruje narzędzie agenta. Pluginy kanałów
i dostawców mają dedykowane przewodniki podlinkowane powyżej.

<Steps>
  <Step title="Utwórz pakiet i manifest">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "Adds a custom tool to OpenClaw",
      "contracts": {
        "tools": ["my_tool"]
      },
      "activation": {
        "onStartup": true
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Każdy plugin potrzebuje manifestu, nawet bez konfiguracji. Narzędzia rejestrowane w runtime
    muszą być wymienione w `contracts.tools`, aby OpenClaw mógł wykryć plugin będący właścicielem
    bez ładowania runtime każdego pluginu. Pluginy powinny też celowo deklarować
    `activation.onStartup`. Ten przykład ustawia ją na `true`. Pełny schemat znajduje się w
    [Manifeście](/pl/plugins/manifest). Kanoniczne fragmenty publikacji w ClawHub
    znajdują się w `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Napisz punkt wejścia">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` jest przeznaczone dla pluginów innych niż kanałowe. W przypadku kanałów użyj
    `defineChannelPluginEntry` - zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins).
    Pełne opcje punktu wejścia opisano w [Punktach wejścia](/pl/plugins/sdk-entrypoints).

  </Step>

  <Step title="Przetestuj i opublikuj">

    **Pluginy zewnętrzne:** zweryfikuj i opublikuj za pomocą ClawHub, a następnie zainstaluj:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Same specyfikacje pakietów, takie jak `@myorg/openclaw-my-plugin`, instalują z npm podczas
    przejścia uruchomieniowego. Użyj `clawhub:`, gdy chcesz rozwiązywania przez ClawHub.

    **Pluginy w repozytorium:** umieść je w drzewie workspace dołączonych pluginów - zostaną wykryte automatycznie.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Możliwości pluginów

Jeden plugin może zarejestrować dowolną liczbę możliwości przez obiekt `api`:

| Możliwość             | Metoda rejestracji                              | Szczegółowy przewodnik                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inferencja tekstu (LLM)   | `api.registerProvider(...)`                      | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins)                               |
| Backend inferencji CLI  | `api.registerCliBackend(...)`                    | [Pluginy backendu CLI](/pl/plugins/cli-backend-plugins)                             |
| Kanał / komunikacja    | `api.registerChannel(...)`                       | [Pluginy kanałów](/pl/plugins/sdk-channel-plugins)                                 |
| Mowa (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transkrypcja w czasie rzeczywistym | `api.registerRealtimeTranscriptionProvider(...)` | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Głos w czasie rzeczywistym         | `api.registerRealtimeVoiceProvider(...)`         | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Rozumienie mediów    | `api.registerMediaUnderstandingProvider(...)`    | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie obrazów       | `api.registerImageGenerationProvider(...)`       | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie muzyki       | `api.registerMusicGenerationProvider(...)`       | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie wideo       | `api.registerVideoGenerationProvider(...)`       | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pobieranie z sieci              | `api.registerWebFetchProvider(...)`              | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Wyszukiwanie w sieci             | `api.registerWebSearchProvider(...)`             | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware wyników narzędzi | `api.registerAgentToolResultMiddleware(...)`     | [Omówienie SDK](/pl/plugins/sdk-overview#registration-api)                          |
| Narzędzia agentów            | `api.registerTool(...)`                          | Poniżej                                                                           |
| Niestandardowe polecenia        | `api.registerCommand(...)`                       | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                        |
| Hooki pluginów           | `api.on(...)`                                    | [Hooki pluginów](/pl/plugins/hooks)                                                  |
| Wewnętrzne hooki zdarzeń   | `api.registerHook(...)`                          | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                        |
| Trasy HTTP            | `api.registerHttpRoute(...)`                     | [Mechanizmy wewnętrzne](/pl/plugins/architecture-internals#gateway-http-routes)                |
| Podpolecenia CLI        | `api.registerCli(...)`                           | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                        |

Pełne API rejestracji opisano w [Omówieniu SDK](/pl/plugins/sdk-overview#registration-api).

Dołączone pluginy mogą używać `api.registerAgentToolResultMiddleware(...)`, gdy
potrzebują asynchronicznego przepisywania wyników narzędzi, zanim model zobaczy dane wyjściowe. Zadeklaruj
docelowe runtime’y w `contracts.agentToolResultMiddleware`, na przykład
`["pi", "codex"]`. To zaufany punkt integracji dołączonych pluginów; pluginy zewnętrzne
powinny preferować zwykłe hooki pluginów OpenClaw, dopóki OpenClaw nie rozwinie
jawnej polityki zaufania dla tej możliwości.

Jeśli Twój plugin rejestruje niestandardowe metody RPC Gateway, trzymaj je pod
prefiksem właściwym dla pluginu. Główne administracyjne przestrzenie nazw (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze rozwiązują się do
`operator.admin`, nawet jeśli plugin poprosi o węższy zakres.

Semantyka strażników hooków, o której warto pamiętać:

- `before_tool_call`: `{ block: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `before_tool_call`: `{ block: false }` jest traktowane jak brak decyzji.
- `before_tool_call`: `{ requireApproval: true }` wstrzymuje wykonanie agenta i prosi użytkownika o zatwierdzenie przez nakładkę zatwierdzeń exec, przyciski Telegram, interakcje Discord albo polecenie `/approve` w dowolnym kanale.
- `before_install`: `{ block: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `before_install`: `{ block: false }` jest traktowane jak brak decyzji.
- `message_sending`: `{ cancel: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `message_sending`: `{ cancel: false }` jest traktowane jak brak decyzji.
- `message_received`: preferuj typowane pole `threadId`, gdy potrzebujesz routingu przychodzącego wątku/tematu. Zachowaj `metadata` na dodatki specyficzne dla kanału.
- `message_sending`: preferuj typowane pola routingu `replyToId` / `threadId` zamiast kluczy metadanych specyficznych dla kanału.

Polecenie `/approve` obsługuje zarówno zatwierdzenia exec, jak i pluginów z ograniczonym fallbackiem: gdy identyfikator zatwierdzenia exec nie zostanie znaleziony, OpenClaw ponawia próbę użycia tego samego identyfikatora w zatwierdzeniach pluginów. Przekazywanie zatwierdzeń pluginów można skonfigurować niezależnie przez `approvals.plugin` w konfiguracji.

Jeśli niestandardowa obsługa zatwierdzeń musi wykryć ten sam przypadek ograniczonego fallbacku,
preferuj `isApprovalNotFoundError` z `openclaw/plugin-sdk/error-runtime`
zamiast ręcznie dopasowywać ciągi wygasania zatwierdzeń.

Przykłady i referencję hooków znajdziesz w [Hookach pluginów](/pl/plugins/hooks).

## Rejestrowanie narzędzi agentów

Narzędzia to typowane funkcje, które LLM może wywoływać. Mogą być wymagane (zawsze
dostępne) albo opcjonalne (użytkownik musi je włączyć):

```typescript
register(api) {
  // Required tool - always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool - user must add to allowlist
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Każde narzędzie zarejestrowane przez `api.registerTool(...)` musi być również zadeklarowane w
manifeście pluginu:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

OpenClaw przechwytuje i buforuje zweryfikowany deskryptor z zarejestrowanego narzędzia,
więc pluginy nie duplikują danych `description` ani schematu w manifeście. Kontrakt
manifestu deklaruje tylko własność i wykrywanie; wykonanie nadal wywołuje
aktywną implementację zarejestrowanego narzędzia.
Ustaw `toolMetadata.<tool>.optional: true` dla narzędzi zarejestrowanych za pomocą
`api.registerTool(..., { optional: true })`, aby OpenClaw mógł uniknąć ładowania
runtime tego pluginu, dopóki narzędzie nie zostanie jawnie dodane do listy dozwolonych.

Użytkownicy włączają opcjonalne narzędzia w konfiguracji:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Nazwy narzędzi nie mogą kolidować z narzędziami rdzenia (konflikty są pomijane)
- Narzędzia z nieprawidłowo sformułowanymi obiektami rejestracji, w tym z brakującym `parameters`, są pomijane i zgłaszane w diagnostyce pluginu zamiast przerywać uruchomienia agenta
- Użyj `optional: true` dla narzędzi ze skutkami ubocznymi lub dodatkowymi wymaganiami binarnymi
- Użytkownicy mogą włączyć wszystkie narzędzia z pluginu, dodając identyfikator pluginu do `tools.allow`

## Rejestrowanie poleceń CLI

Pluginy mogą dodawać główne grupy poleceń `openclaw` za pomocą `api.registerCli`. Podaj
`descriptors` dla każdego najwyższego poziomu głównego polecenia, aby OpenClaw mógł wyświetlać i kierować
polecenie bez gorliwego ładowania runtime każdego pluginu.

```typescript
register(api) {
  api.registerCli(
    ({ program }) => {
      const demo = program
        .command("demo-plugin")
        .description("Run demo plugin commands");

      demo
        .command("ping")
        .description("Check that the plugin CLI is executable")
        .action(() => {
          console.log("demo-plugin:pong");
        });
    },
    {
      descriptors: [
        {
          name: "demo-plugin",
          description: "Run demo plugin commands",
          hasSubcommands: true,
        },
      ],
    },
  );
}
```

Po instalacji zweryfikuj rejestrację runtime i wykonaj polecenie:

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## Konwencje importu

Zawsze importuj ze skoncentrowanych ścieżek `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Pełne odniesienie do podścieżek znajdziesz w [Przeglądzie SDK](/pl/plugins/sdk-overview).

W swoim pluginie używaj lokalnych plików zbiorczych (`api.ts`, `runtime-api.ts`) dla
importów wewnętrznych - nigdy nie importuj własnego pluginu przez jego ścieżkę SDK.

W przypadku pluginów dostawców trzymaj pomocniki specyficzne dla dostawcy w tych
plikach zbiorczych katalogu głównego pakietu, chyba że seam jest naprawdę ogólny. Obecne dołączone przykłady:

- Anthropic: wrappery strumienia Claude oraz pomocniki `service_tier` / beta
- OpenAI: konstruktory dostawców, pomocniki modeli domyślnych, dostawcy realtime
- OpenRouter: konstruktor dostawcy oraz pomocniki onboardingu/konfiguracji

Jeśli pomocnik jest przydatny tylko w jednym dołączonym pakiecie dostawcy, trzymaj go na tym
seam katalogu głównego pakietu zamiast promować go do `openclaw/plugin-sdk/*`.

Niektóre wygenerowane pomocnicze seam `openclaw/plugin-sdk/<bundled-id>` nadal istnieją na potrzeby
utrzymania dołączonych pluginów, gdy mają śledzone użycie właściciela. Traktuj je jako
powierzchnie zarezerwowane, a nie jako domyślny wzorzec dla nowych pluginów innych firm.

## Lista kontrolna przed przesłaniem

<Check>**package.json** ma poprawne metadane `openclaw`</Check>
<Check>Manifest **openclaw.plugin.json** jest obecny i prawidłowy</Check>
<Check>Punkt wejścia używa `defineChannelPluginEntry` albo `definePluginEntry`</Check>
<Check>Wszystkie importy używają skoncentrowanych ścieżek `plugin-sdk/<subpath>`</Check>
<Check>Importy wewnętrzne używają lokalnych modułów, a nie autoimportów SDK</Check>
<Check>Testy przechodzą (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` przechodzi (pluginy w repozytorium)</Check>

## Testowanie wydania beta

1. Obserwuj tagi wydań GitHub w [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) i zasubskrybuj przez `Watch` > `Releases`. Tagi beta wyglądają jak `v2026.3.N-beta.1`. Możesz też włączyć powiadomienia dla oficjalnego konta OpenClaw w X [@openclaw](https://x.com/openclaw), aby otrzymywać ogłoszenia o wydaniach.
2. Przetestuj swój plugin względem tagu beta, gdy tylko się pojawi. Okno przed wydaniem stabilnym zwykle trwa tylko kilka godzin.
3. Po testach opublikuj w wątku swojego pluginu na kanale Discord `plugin-forum` informację `all good` albo opis tego, co się zepsuło. Jeśli nie masz jeszcze wątku, utwórz go.
4. Jeśli coś się zepsuje, otwórz lub zaktualizuj issue o tytule `Beta blocker: <plugin-name> - <summary>` i zastosuj etykietę `beta-blocker`. Umieść link do issue w swoim wątku.
5. Otwórz PR do `main` o tytule `fix(<plugin-id>): beta blocker - <summary>` i podlinkuj issue zarówno w PR, jak i w swoim wątku Discord. Kontrybutorzy nie mogą etykietować PR-ów, więc tytuł jest sygnałem po stronie PR dla maintainerów i automatyzacji. Blokery z PR zostaną scalone; blokery bez PR mogą mimo to zostać wydane. Maintainerzy obserwują te wątki podczas testów beta.
6. Cisza oznacza zielone światło. Jeśli przegapisz okno, Twoja poprawka prawdopodobnie trafi do następnego cyklu.

## Następne kroki

<CardGroup cols={2}>
  <Card title="Pluginy kanałów" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Zbuduj plugin kanału wiadomości
  </Card>
  <Card title="Pluginy dostawców" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Zbuduj plugin dostawcy modelu
  </Card>
  <Card title="Pluginy backendu CLI" icon="terminal" href="/pl/plugins/cli-backend-plugins">
    Zarejestruj lokalny backend CLI AI
  </Card>
  <Card title="Przegląd SDK" icon="book-open" href="/pl/plugins/sdk-overview">
    Mapa importów i odniesienie do API rejestracji
  </Card>
  <Card title="Pomocniki runtime" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, wyszukiwanie, subagent przez api.runtime
  </Card>
  <Card title="Testowanie" icon="test-tubes" href="/pl/plugins/sdk-testing">
    Narzędzia i wzorce testowe
  </Card>
  <Card title="Manifest pluginu" icon="file-json" href="/pl/plugins/manifest">
    Pełne odniesienie do schematu manifestu
  </Card>
</CardGroup>

## Powiązane

- [Architektura pluginów](/pl/plugins/architecture) - szczegółowe omówienie architektury wewnętrznej
- [Przegląd SDK](/pl/plugins/sdk-overview) - odniesienie do SDK pluginów
- [Manifest](/pl/plugins/manifest) - format manifestu pluginu
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) - tworzenie pluginów kanałów
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) - tworzenie pluginów dostawców
