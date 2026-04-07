---
read_when:
    - Chcesz utworzyć nowy plugin OpenClaw
    - Potrzebujesz szybkiego startu do tworzenia pluginów
    - Dodajesz do OpenClaw nowy kanał, dostawcę, narzędzie lub inną funkcję
sidebarTitle: Getting Started
summary: Utwórz swój pierwszy plugin OpenClaw w kilka minut
title: Tworzenie pluginów
x-i18n:
    generated_at: "2026-04-07T09:47:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 509c1f5abe1a0a74966054ed79b71a1a7ee637a43b1214c424acfe62ddf48eef
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Tworzenie pluginów

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
mowę, transkrypcję w czasie rzeczywistym, głos w czasie rzeczywistym, rozumienie multimediów, generowanie obrazów,
generowanie wideo, pobieranie z sieci, wyszukiwanie w sieci, narzędzia agenta lub dowolną
kombinację.

Nie musisz dodawać swojego pluginu do repozytorium OpenClaw. Opublikuj go w
[ClawHub](/pl/tools/clawhub) lub npm, a użytkownicy zainstalują go przez
`openclaw plugins install <package-name>`. OpenClaw najpierw próbuje ClawHub i
automatycznie przechodzi do npm jako fallback.

## Wymagania wstępne

- Node >= 22 i menedżer pakietów (npm lub pnpm)
- Znajomość TypeScript (ESM)
- Dla pluginów w repozytorium: sklonowane repozytorium i wykonane `pnpm install`

## Jaki rodzaj pluginu?

<CardGroup cols={3}>
  <Card title="Plugin kanału" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Połącz OpenClaw z platformą komunikacyjną (Discord, IRC itp.)
  </Card>
  <Card title="Plugin dostawcy" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Dodaj dostawcę modeli (LLM, proxy lub niestandardowy endpoint)
  </Card>
  <Card title="Plugin narzędzia / hooka" icon="wrench">
    Zarejestruj narzędzia agenta, hooki zdarzeń lub usługi — przejdź dalej poniżej
  </Card>
</CardGroup>

Jeśli plugin kanału jest opcjonalny i może nie być zainstalowany, gdy działa onboarding/konfiguracja,
użyj `createOptionalChannelSetupSurface(...)` z
`openclaw/plugin-sdk/channel-setup`. Tworzy on parę adapter konfiguracji + kreator,
która informuje o wymaganiu instalacji i blokuje rzeczywiste zapisy konfiguracji,
dopóki plugin nie zostanie zainstalowany.

## Szybki start: plugin narzędzia

Ten przewodnik tworzy minimalny plugin, który rejestruje narzędzie agenta. Pluginy kanałów
i dostawców mają osobne przewodniki podlinkowane powyżej.

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
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Każdy plugin potrzebuje manifestu, nawet jeśli nie ma konfiguracji. Pełny schemat znajdziesz w
    [Manifest](/pl/plugins/manifest). Kanoniczne fragmenty publikowania do ClawHub
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

    `definePluginEntry` służy do pluginów innych niż kanały. Dla kanałów użyj
    `defineChannelPluginEntry` — zobacz [Channel Plugins](/pl/plugins/sdk-channel-plugins).
    Pełne opcje punktów wejścia znajdziesz w [Entry Points](/pl/plugins/sdk-entrypoints).

  </Step>

  <Step title="Przetestuj i opublikuj">

    **Pluginy zewnętrzne:** zweryfikuj i opublikuj w ClawHub, a następnie zainstaluj:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw sprawdza też ClawHub przed npm dla prostych specyfikacji pakietów, takich jak
    `@myorg/openclaw-my-plugin`.

    **Pluginy w repozytorium:** umieść je w drzewie workspace dołączonych pluginów — zostaną wykryte automatycznie.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Możliwości pluginów

Pojedynczy plugin może zarejestrować dowolną liczbę możliwości przez obiekt `api`:

| Możliwość             | Metoda rejestracji                              | Szczegółowy przewodnik                                                           |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Wnioskowanie tekstowe (LLM)   | `api.registerProvider(...)`                      | [Provider Plugins](/pl/plugins/sdk-provider-plugins)                               |
| Backend wnioskowania CLI  | `api.registerCliBackend(...)`                    | [CLI Backends](/pl/gateway/cli-backends)                                           |
| Kanał / komunikacja    | `api.registerChannel(...)`                       | [Channel Plugins](/pl/plugins/sdk-channel-plugins)                                 |
| Mowa (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Provider Plugins](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transkrypcja w czasie rzeczywistym | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Głos w czasie rzeczywistym         | `api.registerRealtimeVoiceProvider(...)`         | [Provider Plugins](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Rozumienie multimediów    | `api.registerMediaUnderstandingProvider(...)`    | [Provider Plugins](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie obrazów       | `api.registerImageGenerationProvider(...)`       | [Provider Plugins](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie muzyki       | `api.registerMusicGenerationProvider(...)`       | [Provider Plugins](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie wideo       | `api.registerVideoGenerationProvider(...)`       | [Provider Plugins](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pobieranie z sieci              | `api.registerWebFetchProvider(...)`              | [Provider Plugins](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Wyszukiwanie w sieci             | `api.registerWebSearchProvider(...)`             | [Provider Plugins](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Narzędzia agenta            | `api.registerTool(...)`                          | Poniżej                                                                           |
| Polecenia niestandardowe        | `api.registerCommand(...)`                       | [Entry Points](/pl/plugins/sdk-entrypoints)                                        |
| Hooki zdarzeń            | `api.registerHook(...)`                          | [Entry Points](/pl/plugins/sdk-entrypoints)                                        |
| Trasy HTTP            | `api.registerHttpRoute(...)`                     | [Internals](/pl/plugins/architecture#gateway-http-routes)                          |
| Podpolecenia CLI        | `api.registerCli(...)`                           | [Entry Points](/pl/plugins/sdk-entrypoints)                                        |

Pełne API rejestracji znajdziesz w [SDK Overview](/pl/plugins/sdk-overview#registration-api).

Jeśli twój plugin rejestruje niestandardowe metody RPC gateway, trzymaj je pod
prefiksem specyficznym dla pluginu. Podstawowe przestrzenie nazw administracyjnych (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze rozwiązują się do
`operator.admin`, nawet jeśli plugin żąda węższego zakresu.

Semantyka strażników hooków, o której warto pamiętać:

- `before_tool_call`: `{ block: true }` jest rozstrzygające i zatrzymuje handlery o niższym priorytecie.
- `before_tool_call`: `{ block: false }` jest traktowane jak brak decyzji.
- `before_tool_call`: `{ requireApproval: true }` wstrzymuje wykonanie agenta i prosi użytkownika o zatwierdzenie przez nakładkę zatwierdzania exec, przyciski Telegram, interakcje Discord lub polecenie `/approve` na dowolnym kanale.
- `before_install`: `{ block: true }` jest rozstrzygające i zatrzymuje handlery o niższym priorytecie.
- `before_install`: `{ block: false }` jest traktowane jak brak decyzji.
- `message_sending`: `{ cancel: true }` jest rozstrzygające i zatrzymuje handlery o niższym priorytecie.
- `message_sending`: `{ cancel: false }` jest traktowane jak brak decyzji.

Polecenie `/approve` obsługuje zarówno zatwierdzenia exec, jak i pluginów z ograniczonym fallbackiem: gdy identyfikator zatwierdzenia exec nie zostanie znaleziony, OpenClaw ponawia próbę z tym samym identyfikatorem w zatwierdzeniach pluginów. Przekazywanie zatwierdzeń pluginów można konfigurować niezależnie przez `approvals.plugin` w konfiguracji.

Jeśli niestandardowa logika zatwierdzania musi wykrywać ten sam przypadek ograniczonego fallbacku,
użyj `isApprovalNotFoundError` z `openclaw/plugin-sdk/error-runtime`
zamiast ręcznie dopasowywać ciągi wygaśnięcia zatwierdzenia.

Szczegóły znajdziesz w [semantyce decyzji hooków SDK Overview](/pl/plugins/sdk-overview#hook-decision-semantics).

## Rejestrowanie narzędzi agenta

Narzędzia to typowane funkcje, które LLM może wywoływać. Mogą być wymagane (zawsze
dostępne) albo opcjonalne (wymagają zgody użytkownika):

```typescript
register(api) {
  // Narzędzie wymagane — zawsze dostępne
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Narzędzie opcjonalne — użytkownik musi dodać je do listy dozwolonych
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

Użytkownicy włączają opcjonalne narzędzia w konfiguracji:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Nazwy narzędzi nie mogą kolidować z podstawowymi narzędziami (konflikty są pomijane)
- Używaj `optional: true` dla narzędzi z efektami ubocznymi lub dodatkowymi wymaganiami binarnymi
- Użytkownicy mogą włączyć wszystkie narzędzia z pluginu, dodając identyfikator pluginu do `tools.allow`

## Konwencje importu

Zawsze importuj z wyspecjalizowanych ścieżek `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Błędnie: monolityczny root (przestarzałe, zostanie usunięte)
import { ... } from "openclaw/plugin-sdk";
```

Pełne odniesienie do subpath znajdziesz w [SDK Overview](/pl/plugins/sdk-overview).

Wewnątrz swojego pluginu używaj lokalnych plików barrel (`api.ts`, `runtime-api.ts`) do
importów wewnętrznych — nigdy nie importuj własnego pluginu przez jego ścieżkę SDK.

Dla pluginów dostawców trzymaj helpery specyficzne dla dostawcy w tych barrelach
na poziomie root pakietu, chyba że dany interfejs jest naprawdę ogólny. Aktualne dołączone przykłady:

- Anthropic: wrappery strumieni Claude oraz helpery `service_tier` / beta
- OpenAI: buildery dostawców, helpery modeli domyślnych, dostawcy realtime
- OpenRouter: builder dostawcy oraz helpery onboardingu/konfiguracji

Jeśli helper jest użyteczny tylko w jednym dołączonym pakiecie dostawcy, trzymaj go w
interfejsie tego pakietu na poziomie root zamiast przenosić go do `openclaw/plugin-sdk/*`.

Niektóre generowane interfejsy helperów `openclaw/plugin-sdk/<bundled-id>` nadal istnieją dla
utrzymania i zgodności dołączonych pluginów, na przykład
`plugin-sdk/feishu-setup` lub `plugin-sdk/zalo-setup`. Traktuj je jako zarezerwowane
powierzchnie, a nie domyślny wzorzec dla nowych pluginów zewnętrznych.

## Lista kontrolna przed zgłoszeniem

<Check>**package.json** ma poprawne metadane `openclaw`</Check>
<Check>Manifest **openclaw.plugin.json** jest obecny i prawidłowy</Check>
<Check>Punkt wejścia używa `defineChannelPluginEntry` lub `definePluginEntry`</Check>
<Check>Wszystkie importy używają wyspecjalizowanych ścieżek `plugin-sdk/<subpath>`</Check>
<Check>Importy wewnętrzne używają modułów lokalnych, a nie samoodwołań SDK</Check>
<Check>Testy przechodzą (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` przechodzi (pluginy w repozytorium)</Check>

## Testowanie wydań beta

1. Obserwuj tagi wydań GitHub w [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) i zasubskrybuj przez `Watch` > `Releases`. Tagi beta wyglądają jak `v2026.3.N-beta.1`. Możesz też włączyć powiadomienia dla oficjalnego konta OpenClaw X [@openclaw](https://x.com/openclaw), aby otrzymywać ogłoszenia o wydaniach.
2. Przetestuj swój plugin z tagiem beta, gdy tylko się pojawi. Okno przed wydaniem stabilnym zwykle trwa tylko kilka godzin.
3. Po testach napisz w wątku swojego pluginu na kanale Discord `plugin-forum`, czy `all good`, czy co się zepsuło. Jeśli nie masz jeszcze wątku, utwórz go.
4. Jeśli coś się zepsuje, otwórz lub zaktualizuj issue zatytułowane `Beta blocker: <plugin-name> - <summary>` i dodaj etykietę `beta-blocker`. Umieść link do issue w swoim wątku.
5. Otwórz PR do `main` zatytułowany `fix(<plugin-id>): beta blocker - <summary>` i podlinkuj issue zarówno w PR, jak i w swoim wątku na Discordzie. Współtwórcy nie mogą etykietować PR, więc tytuł jest sygnałem po stronie PR dla maintainerów i automatyzacji. Blokery z PR są scalane; blokery bez niego mogą mimo to zostać wydane. Maintainerzy obserwują te wątki podczas testów beta.
6. Cisza oznacza zielono. Jeśli przegapisz okno, twoja poprawka prawdopodobnie trafi do następnego cyklu.

## Następne kroki

<CardGroup cols={2}>
  <Card title="Pluginy kanałów" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Zbuduj plugin kanału komunikacyjnego
  </Card>
  <Card title="Pluginy dostawców" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Zbuduj plugin dostawcy modeli
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/pl/plugins/sdk-overview">
    Referencja mapy importów i API rejestracji
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, search, subagent przez api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/pl/plugins/sdk-testing">
    Narzędzia i wzorce testowania
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/pl/plugins/manifest">
    Pełna referencja schematu manifestu
  </Card>
</CardGroup>

## Powiązane

- [Plugin Architecture](/pl/plugins/architecture) — szczegółowe omówienie architektury wewnętrznej
- [SDK Overview](/pl/plugins/sdk-overview) — referencja Plugin SDK
- [Manifest](/pl/plugins/manifest) — format manifestu pluginu
- [Channel Plugins](/pl/plugins/sdk-channel-plugins) — tworzenie pluginów kanałów
- [Provider Plugins](/pl/plugins/sdk-provider-plugins) — tworzenie pluginów dostawców
