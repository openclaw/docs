---
read_when:
    - Chcesz utworzyć nowy Plugin dla OpenClaw
    - Potrzebujesz krótkiego przewodnika po tworzeniu Pluginów
    - Dodajesz nowy kanał, dostawcę, narzędzie lub inną funkcję do OpenClaw
sidebarTitle: Getting Started
summary: Utwórz swój pierwszy Plugin OpenClaw w kilka minut
title: Tworzenie pluginów
x-i18n:
    generated_at: "2026-04-30T10:05:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321f8870d0ce3be8dece21b07815eda6859dcb00941d9181d913b95f3d74d230
    source_path: plugins/building-plugins.md
    workflow: 16
---

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
mowę, transkrypcję w czasie rzeczywistym, głos w czasie rzeczywistym, rozumienie
multimediów, generowanie obrazów, generowanie wideo, pobieranie z sieci, wyszukiwanie w sieci, narzędzia agentów lub dowolną
kombinację.

Nie musisz dodawać swojego pluginu do repozytorium OpenClaw. Opublikuj go w
[ClawHub](/pl/tools/clawhub), a użytkownicy zainstalują go za pomocą
`openclaw plugins install <package-name>`. OpenClaw najpierw próbuje użyć ClawHub, a
następnie automatycznie przechodzi awaryjnie do npm dla pakietów, które nadal korzystają z dystrybucji przez npm.

## Wymagania wstępne

- Node >= 22 i menedżer pakietów (npm lub pnpm)
- Znajomość TypeScript (ESM)
- Dla pluginów w repozytorium: sklonowane repozytorium i wykonane `pnpm install`

## Jaki rodzaj pluginu?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Połącz OpenClaw z platformą komunikacyjną (Discord, IRC itd.)
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Dodaj dostawcę modelu (LLM, proxy lub własny punkt końcowy)
  </Card>
  <Card title="Tool / hook plugin" icon="wrench" href="/pl/plugins/hooks">
    Zarejestruj narzędzia agentów, hooki zdarzeń lub usługi — kontynuuj poniżej
  </Card>
</CardGroup>

Dla pluginu kanału, który nie ma gwarancji instalacji podczas uruchamiania onboardingu/konfiguracji,
użyj `createOptionalChannelSetupSurface(...)` z
`openclaw/plugin-sdk/channel-setup`. Tworzy on parę adapter konfiguracji + kreator,
która informuje o wymaganiu instalacji i odmawia rzeczywistych zapisów konfiguracji,
dopóki plugin nie zostanie zainstalowany.

## Szybki start: plugin narzędzia

Ten przewodnik tworzy minimalny plugin, który rejestruje narzędzie agenta. Pluginy kanałów
i dostawców mają dedykowane przewodniki podlinkowane powyżej.

<Steps>
  <Step title="Create the package and manifest">
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

    Każdy plugin wymaga manifestu, nawet bez konfiguracji, i każdy plugin powinien
    celowo deklarować `activation.onStartup`. Narzędzia rejestrowane w runtime wymagają
    importu przy starcie, więc ten przykład ustawia tę wartość na `true`. Zobacz
    [Manifest](/pl/plugins/manifest), aby poznać pełny schemat. Kanoniczne fragmenty publikacji w ClawHub
    znajdują się w `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Write the entry point">

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

    `definePluginEntry` służy do pluginów niebędących kanałami. Dla kanałów użyj
    `defineChannelPluginEntry` — zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins).
    Pełne opcje punktu wejścia znajdziesz w [Punkty wejścia](/pl/plugins/sdk-entrypoints).

  </Step>

  <Step title="Test and publish">

    **Pluginy zewnętrzne:** zweryfikuj i opublikuj za pomocą ClawHub, a następnie zainstaluj:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw sprawdza także ClawHub przed npm dla prostych specyfikacji pakietów, takich jak
    `@myorg/openclaw-my-plugin`; npm pozostaje mechanizmem awaryjnym dla pakietów, które
    nie zostały jeszcze przeniesione do ClawHub.

    **Pluginy w repozytorium:** umieść je w drzewie obszaru roboczego dołączonych pluginów — zostaną automatycznie wykryte.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Możliwości pluginów

Pojedynczy plugin może zarejestrować dowolną liczbę możliwości za pomocą obiektu `api`:

| Możliwość             | Metoda rejestracji                              | Szczegółowy przewodnik                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Wnioskowanie tekstowe (LLM)   | `api.registerProvider(...)`                      | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins)                               |
| Backend wnioskowania CLI  | `api.registerCliBackend(...)`                    | [Backendy CLI](/pl/gateway/cli-backends)                                           |
| Kanał / komunikacja    | `api.registerChannel(...)`                       | [Pluginy kanałów](/pl/plugins/sdk-channel-plugins)                                 |
| Mowa (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transkrypcja w czasie rzeczywistym | `api.registerRealtimeTranscriptionProvider(...)` | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Głos w czasie rzeczywistym         | `api.registerRealtimeVoiceProvider(...)`         | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Rozumienie multimediów    | `api.registerMediaUnderstandingProvider(...)`    | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie obrazów       | `api.registerImageGenerationProvider(...)`       | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie muzyki       | `api.registerMusicGenerationProvider(...)`       | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie wideo       | `api.registerVideoGenerationProvider(...)`       | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pobieranie z sieci              | `api.registerWebFetchProvider(...)`              | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Wyszukiwanie w sieci             | `api.registerWebSearchProvider(...)`             | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware wyników narzędzi | `api.registerAgentToolResultMiddleware(...)`     | [Przegląd SDK](/pl/plugins/sdk-overview#registration-api)                          |
| Narzędzia agentów            | `api.registerTool(...)`                          | Poniżej                                                                           |
| Polecenia niestandardowe        | `api.registerCommand(...)`                       | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                        |
| Hooki pluginów           | `api.on(...)`                                    | [Hooki pluginów](/pl/plugins/hooks)                                                  |
| Wewnętrzne hooki zdarzeń   | `api.registerHook(...)`                          | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                        |
| Trasy HTTP            | `api.registerHttpRoute(...)`                     | [Elementy wewnętrzne](/pl/plugins/architecture-internals#gateway-http-routes)                |
| Podpolecenia CLI        | `api.registerCli(...)`                           | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                        |

Pełne API rejestracji znajdziesz w [Przegląd SDK](/pl/plugins/sdk-overview#registration-api).

Dołączone pluginy mogą używać `api.registerAgentToolResultMiddleware(...)`, gdy
potrzebują asynchronicznego przepisywania wyników narzędzi, zanim model zobaczy wyjście. Zadeklaruj
docelowe runtime'y w `contracts.agentToolResultMiddleware`, na przykład
`["pi", "codex"]`. To zaufany styk dołączonych pluginów; zewnętrzne
pluginy powinny preferować zwykłe hooki pluginów OpenClaw, chyba że OpenClaw doda
jawną politykę zaufania dla tej możliwości.

Jeśli Twój plugin rejestruje niestandardowe metody RPC Gateway, trzymaj je pod
prefiksem specyficznym dla pluginu. Przestrzenie nazw administracji rdzenia (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze rozwiązują się do
`operator.admin`, nawet jeśli plugin prosi o węższy zakres.

Semantyka strażników hooków, o której warto pamiętać:

- `before_tool_call`: `{ block: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `before_tool_call`: `{ block: false }` jest traktowane jako brak decyzji.
- `before_tool_call`: `{ requireApproval: true }` wstrzymuje wykonanie agenta i prosi użytkownika o zatwierdzenie przez nakładkę zatwierdzeń wykonania, przyciski Telegram, interakcje Discord lub polecenie `/approve` w dowolnym kanale.
- `before_install`: `{ block: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `before_install`: `{ block: false }` jest traktowane jako brak decyzji.
- `message_sending`: `{ cancel: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `message_sending`: `{ cancel: false }` jest traktowane jako brak decyzji.
- `message_received`: preferuj typowane pole `threadId`, gdy potrzebujesz trasowania przychodzącego wątku/tematu. Zachowaj `metadata` na dodatki specyficzne dla kanału.
- `message_sending`: preferuj typowane pola trasowania `replyToId` / `threadId` zamiast kluczy metadanych specyficznych dla kanału.

Polecenie `/approve` obsługuje zarówno zatwierdzenia wykonania, jak i pluginów, z ograniczonym mechanizmem awaryjnym: gdy identyfikator zatwierdzenia wykonania nie zostanie znaleziony, OpenClaw ponawia próbę z tym samym identyfikatorem przez zatwierdzenia pluginów. Przekazywanie zatwierdzeń pluginów można konfigurować niezależnie za pomocą `approvals.plugin` w konfiguracji.

Jeśli niestandardowa obsługa zatwierdzeń musi wykryć ten sam przypadek ograniczonego mechanizmu awaryjnego,
preferuj `isApprovalNotFoundError` z `openclaw/plugin-sdk/error-runtime`
zamiast ręcznego dopasowywania ciągów wygaśnięcia zatwierdzenia.

Przykłady i dokumentację hooków znajdziesz w [Hooki pluginów](/pl/plugins/hooks).

## Rejestrowanie narzędzi agentów

Narzędzia to typowane funkcje, które LLM może wywoływać. Mogą być wymagane (zawsze
dostępne) lub opcjonalne (użytkownik włącza je samodzielnie):

```typescript
register(api) {
  // Required tool — always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — user must add to allowlist
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

- Nazwy narzędzi nie mogą kolidować z narzędziami rdzenia (konflikty są pomijane)
- Narzędzia z nieprawidłowo sformułowanymi obiektami rejestracji, w tym bez `parameters`, są pomijane i zgłaszane w diagnostyce pluginu zamiast przerywać uruchomienia agenta
- Użyj `optional: true` dla narzędzi ze skutkami ubocznymi lub dodatkowymi wymaganiami binarnymi
- Użytkownicy mogą włączyć wszystkie narzędzia z pluginu, dodając identyfikator pluginu do `tools.allow`

## Konwencje importowania

Zawsze importuj ze skoncentrowanych ścieżek `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Pełną referencję podścieżek znajdziesz w [Przeglądzie SDK](/pl/plugins/sdk-overview).

W swoim pluginie używaj lokalnych plików zbiorczych (`api.ts`, `runtime-api.ts`) do
importów wewnętrznych — nigdy nie importuj własnego pluginu przez jego ścieżkę SDK.

W przypadku pluginów dostawców przechowuj pomocnicze funkcje specyficzne dla dostawcy w tych plikach zbiorczych
w katalogu głównym pakietu, chyba że punkt integracji jest naprawdę ogólny. Obecne dołączone przykłady:

- Anthropic: wrappery strumienia Claude oraz funkcje pomocnicze `service_tier` / beta
- OpenAI: konstruktory dostawcy, funkcje pomocnicze modeli domyślnych, dostawcy realtime
- OpenRouter: konstruktor dostawcy oraz funkcje pomocnicze onboardingu/konfiguracji

Jeśli funkcja pomocnicza jest przydatna tylko w jednym dołączonym pakiecie dostawcy, pozostaw ją na tym
punkcie integracji w katalogu głównym pakietu zamiast promować ją do `openclaw/plugin-sdk/*`.

Niektóre wygenerowane pomocnicze punkty integracji `openclaw/plugin-sdk/<bundled-id>` nadal istnieją na potrzeby
utrzymania dołączonych pluginów, gdy mają śledzone użycie przez właściciela. Traktuj je jako
powierzchnie zarezerwowane, a nie jako domyślny wzorzec dla nowych pluginów zewnętrznych.

## Lista kontrolna przed zgłoszeniem

<Check>**package.json** ma poprawne metadane `openclaw`</Check>
<Check>Manifest **openclaw.plugin.json** jest obecny i prawidłowy</Check>
<Check>Punkt wejścia używa `defineChannelPluginEntry` albo `definePluginEntry`</Check>
<Check>Wszystkie importy używają zawężonych ścieżek `plugin-sdk/<subpath>`</Check>
<Check>Importy wewnętrzne używają lokalnych modułów, a nie samoimportów SDK</Check>
<Check>Testy przechodzą (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` przechodzi (pluginy w repozytorium)</Check>

## Testowanie wydania beta

1. Obserwuj tagi wydań GitHub w [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) i subskrybuj przez `Watch` > `Releases`. Tagi beta wyglądają jak `v2026.3.N-beta.1`. Możesz też włączyć powiadomienia dla oficjalnego konta OpenClaw na X [@openclaw](https://x.com/openclaw), aby otrzymywać ogłoszenia o wydaniach.
2. Przetestuj swój plugin z tagiem beta, gdy tylko się pojawi. Okno przed wydaniem stabilnym zwykle trwa tylko kilka godzin.
3. Po testach napisz w wątku swojego pluginu na kanale Discord `plugin-forum`: `all good` albo opisz, co się zepsuło. Jeśli nie masz jeszcze wątku, utwórz go.
4. Jeśli coś się zepsuje, otwórz albo zaktualizuj zgłoszenie zatytułowane `Beta blocker: <plugin-name> - <summary>` i dodaj etykietę `beta-blocker`. Umieść link do zgłoszenia w swoim wątku.
5. Otwórz PR do `main` zatytułowany `fix(<plugin-id>): beta blocker - <summary>` i połącz zgłoszenie zarówno w PR, jak i w swoim wątku Discord. Kontrybutorzy nie mogą nadawać etykiet PR-om, więc tytuł jest sygnałem po stronie PR dla maintainerów i automatyzacji. Blokery z PR zostają scalone; blokery bez PR mogą mimo to trafić do wydania. Maintainerzy obserwują te wątki podczas testów beta.
6. Cisza oznacza zielone światło. Jeśli przegapisz okno, Twoja poprawka prawdopodobnie trafi do następnego cyklu.

## Następne kroki

<CardGroup cols={2}>
  <Card title="Pluginy kanałów" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Zbuduj plugin kanału wiadomości
  </Card>
  <Card title="Pluginy dostawców" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Zbuduj plugin dostawcy modeli
  </Card>
  <Card title="Przegląd SDK" icon="book-open" href="/pl/plugins/sdk-overview">
    Mapa importów i referencja API rejestracji
  </Card>
  <Card title="Pomocnicy runtime" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, wyszukiwanie, subagent przez api.runtime
  </Card>
  <Card title="Testowanie" icon="test-tubes" href="/pl/plugins/sdk-testing">
    Narzędzia i wzorce testowe
  </Card>
  <Card title="Manifest pluginu" icon="file-json" href="/pl/plugins/manifest">
    Pełna referencja schematu manifestu
  </Card>
</CardGroup>

## Powiązane

- [Architektura pluginów](/pl/plugins/architecture) — szczegółowe omówienie architektury wewnętrznej
- [Przegląd SDK](/pl/plugins/sdk-overview) — referencja SDK pluginów
- [Manifest](/pl/plugins/manifest) — format manifestu pluginu
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — budowanie pluginów kanałów
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) — budowanie pluginów dostawców
