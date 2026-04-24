---
read_when:
    - Chcesz utworzyć nowy Plugin OpenClaw
    - Potrzebujesz szybkiego startu do tworzenia Pluginów
    - Dodajesz nowy kanał, provider, narzędzie lub inną możliwość do OpenClaw
sidebarTitle: Getting Started
summary: Utwórz swój pierwszy Plugin OpenClaw w kilka minut
title: Building plugins
x-i18n:
    generated_at: "2026-04-24T09:22:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: c14f4c4dc3ae853e385f6beeb9529ea9e360f3d9c5b99dc717cf0851ed02cbc8
    source_path: plugins/building-plugins.md
    workflow: 15
---

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, providery modeli,
mowę, transkrypcję realtime, głos realtime, rozumienie mediów, generowanie
obrazów, generowanie wideo, web fetch, web search, narzędzia agenta albo
dowolną ich kombinację.

Nie musisz dodawać swojego Pluginu do repozytorium OpenClaw. Opublikuj go w
[ClawHub](/pl/tools/clawhub) albo npm, a użytkownicy zainstalują go przez
`openclaw plugins install <package-name>`. OpenClaw najpierw próbuje ClawHub, a
następnie automatycznie wraca do npm.

## Wymagania wstępne

- Node >= 22 i menedżer pakietów (npm lub pnpm)
- Znajomość TypeScript (ESM)
- Dla Pluginów w repo: sklonowane repozytorium i wykonane `pnpm install`

## Jaki rodzaj Pluginu?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Połącz OpenClaw z platformą komunikacyjną (Discord, IRC itd.)
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Dodaj providera modelu (LLM, proxy albo niestandardowy endpoint)
  </Card>
  <Card title="Tool / hook plugin" icon="wrench">
    Zarejestruj narzędzia agenta, hooki zdarzeń albo usługi — kontynuuj poniżej
  </Card>
</CardGroup>

Dla Pluginu kanału, który nie ma gwarancji, że będzie zainstalowany podczas onboardingu/konfiguracji,
użyj `createOptionalChannelSetupSurface(...)` z
`openclaw/plugin-sdk/channel-setup`. Tworzy on adapter konfiguracji + parę kreatora,
która ogłasza wymaganie instalacji i działa w trybie fail-closed przy rzeczywistych zapisach konfiguracji,
dopóki Plugin nie zostanie zainstalowany.

## Szybki start: Plugin narzędzia

Ten przewodnik tworzy minimalny Plugin, który rejestruje narzędzie agenta. Pluginy kanałów
i providerów mają dedykowane przewodniki podlinkowane powyżej.

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
      "description": "Dodaje niestandardowe narzędzie do OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Każdy Plugin potrzebuje manifestu, nawet jeśli nie ma konfiguracji. Zobacz
    [Manifest](/pl/plugins/manifest), aby poznać pełny schemat. Kanoniczne snippety
    publikacji ClawHub znajdują się w `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Write the entry point">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Dodaje niestandardowe narzędzie do OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Zrób coś",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` jest przeznaczone dla Pluginów innych niż kanały. Dla kanałów użyj
    `defineChannelPluginEntry` — zobacz [Channel Plugins](/pl/plugins/sdk-channel-plugins).
    Pełne opcje entry point znajdziesz w [Entry Points](/pl/plugins/sdk-entrypoints).

  </Step>

  <Step title="Test and publish">

    **Pluginy zewnętrzne:** zwaliduj i opublikuj przez ClawHub, a następnie zainstaluj:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw sprawdza też ClawHub przed npm dla zwykłych specyfikacji pakietów, takich jak
    `@myorg/openclaw-my-plugin`.

    **Pluginy w repo:** umieść je pod drzewem obszaru roboczego dołączonych Pluginów — są wykrywane automatycznie.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Możliwości Pluginu

Jeden Plugin może zarejestrować dowolną liczbę możliwości przez obiekt `api`:

| Możliwość             | Metoda rejestracji                              | Szczegółowy przewodnik                                                           |
| --------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| Wnioskowanie tekstowe (LLM) | `api.registerProvider(...)`               | [Provider Plugins](/pl/plugins/sdk-provider-plugins)                                |
| Backend wnioskowania CLI  | `api.registerCliBackend(...)`                | [CLI Backends](/pl/gateway/cli-backends)                                            |
| Kanał / wiadomości       | `api.registerChannel(...)`                    | [Channel Plugins](/pl/plugins/sdk-channel-plugins)                                  |
| Mowa (TTS/STT)           | `api.registerSpeechProvider(...)`             | [Provider Plugins](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Transkrypcja realtime    | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Głos realtime            | `api.registerRealtimeVoiceProvider(...)`      | [Provider Plugins](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Rozumienie mediów        | `api.registerMediaUnderstandingProvider(...)` | [Provider Plugins](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Generowanie obrazów      | `api.registerImageGenerationProvider(...)`    | [Provider Plugins](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Generowanie muzyki       | `api.registerMusicGenerationProvider(...)`    | [Provider Plugins](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Generowanie wideo        | `api.registerVideoGenerationProvider(...)`    | [Provider Plugins](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Web fetch                | `api.registerWebFetchProvider(...)`           | [Provider Plugins](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Web search               | `api.registerWebSearchProvider(...)`          | [Provider Plugins](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)  |
| Osadzone rozszerzenie Pi | `api.registerEmbeddedExtensionFactory(...)`   | [SDK Overview](/pl/plugins/sdk-overview#registration-api)                           |
| Narzędzia agenta         | `api.registerTool(...)`                       | Poniżej                                                                          |
| Polecenia niestandardowe | `api.registerCommand(...)`                    | [Entry Points](/pl/plugins/sdk-entrypoints)                                         |
| Hooki zdarzeń            | `api.registerHook(...)`                       | [Entry Points](/pl/plugins/sdk-entrypoints)                                         |
| Trasy HTTP               | `api.registerHttpRoute(...)`                  | [Internals](/pl/plugins/architecture-internals#gateway-http-routes)                 |
| Podpolecenia CLI         | `api.registerCli(...)`                        | [Entry Points](/pl/plugins/sdk-entrypoints)                                         |

Pełne API rejestracji znajdziesz w [SDK Overview](/pl/plugins/sdk-overview#registration-api).

Używaj `api.registerEmbeddedExtensionFactory(...)`, gdy Plugin potrzebuje
haków osadzonego runnera natywnych dla Pi, takich jak asynchroniczne przepisywanie `tool_result`
przed wyemitowaniem końcowej wiadomości wyniku narzędzia. Preferuj zwykłe hooki Plugin OpenClaw, gdy
praca nie wymaga synchronizacji rozszerzenia Pi.

Jeśli Twój Plugin rejestruje niestandardowe metody Gateway RPC, trzymaj je pod
prefiksem specyficznym dla Pluginu. Główne przestrzenie nazw administracyjnych (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają zastrzeżone i zawsze rozwiązują się do
`operator.admin`, nawet jeśli Plugin żąda węższego zakresu.

Semantyka strażników hooków, o której warto pamiętać:

- `before_tool_call`: `{ block: true }` jest rozstrzygające i zatrzymuje handlery o niższym priorytecie.
- `before_tool_call`: `{ block: false }` jest traktowane jako brak decyzji.
- `before_tool_call`: `{ requireApproval: true }` wstrzymuje wykonanie agenta i prosi użytkownika o zatwierdzenie przez nakładkę zatwierdzeń exec, przyciski Telegram, interakcje Discord albo polecenie `/approve` w dowolnym kanale.
- `before_install`: `{ block: true }` jest rozstrzygające i zatrzymuje handlery o niższym priorytecie.
- `before_install`: `{ block: false }` jest traktowane jako brak decyzji.
- `message_sending`: `{ cancel: true }` jest rozstrzygające i zatrzymuje handlery o niższym priorytecie.
- `message_sending`: `{ cancel: false }` jest traktowane jako brak decyzji.
- `message_received`: preferuj typizowane pole `threadId`, gdy potrzebujesz routingu przychodzącego wątku/tematu. Zachowaj `metadata` dla dodatków specyficznych dla kanału.
- `message_sending`: preferuj typizowane pola routingu `replyToId` / `threadId` zamiast kluczy metadanych specyficznych dla kanału.

Polecenie `/approve` obsługuje zarówno zatwierdzenia exec, jak i Plugin z ograniczonym fallback: gdy nie zostanie znaleziony identyfikator zatwierdzenia exec, OpenClaw ponawia próbę z tym samym identyfikatorem przez zatwierdzenia Plugin. Przekazywanie zatwierdzeń Plugin można konfigurować niezależnie przez `approvals.plugin` w konfiguracji.

Jeśli niestandardowa logika zatwierdzeń musi wykryć ten sam ograniczony przypadek fallback,
preferuj `isApprovalNotFoundError` z `openclaw/plugin-sdk/error-runtime`
zamiast ręcznie dopasowywać ciągi wygaśnięcia zatwierdzenia.

Szczegóły znajdziesz w [SDK Overview hook decision semantics](/pl/plugins/sdk-overview#hook-decision-semantics).

## Rejestrowanie narzędzi agenta

Narzędzia to typizowane funkcje, które LLM może wywoływać. Mogą być wymagane (zawsze
dostępne) albo opcjonalne (opt-in użytkownika):

```typescript
register(api) {
  // Wymagane narzędzie — zawsze dostępne
  api.registerTool({
    name: "my_tool",
    description: "Zrób coś",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Opcjonalne narzędzie — użytkownik musi dodać je do listy dozwolonych
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Uruchom workflow",
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
- Używaj `optional: true` dla narzędzi z efektami ubocznymi albo dodatkowymi wymaganiami binarnymi
- Użytkownicy mogą włączyć wszystkie narzędzia z Pluginu, dodając identyfikator Pluginu do `tools.allow`

## Konwencje importu

Zawsze importuj z ukierunkowanych ścieżek `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Źle: monolityczny root (przestarzałe, zostanie usunięte)
import { ... } from "openclaw/plugin-sdk";
```

Pełną dokumentację podścieżek znajdziesz w [SDK Overview](/pl/plugins/sdk-overview).

Wewnątrz Pluginu używaj lokalnych plików barrel (`api.ts`, `runtime-api.ts`) dla
wewnętrznych importów — nigdy nie importuj własnego Pluginu przez jego ścieżkę SDK.

W przypadku Pluginów providerów trzymaj pomocniki specyficzne dla providera w tych
barrelach katalogu głównego pakietu, chyba że warstwa jest rzeczywiście generyczna. Obecne dołączone przykłady:

- Anthropic: wrappery strumieni Claude oraz pomocniki `service_tier` / beta
- OpenAI: buildery providerów, pomocniki modeli domyślnych, providery realtime
- OpenRouter: builder providera oraz pomocniki onboardingu/konfiguracji

Jeśli pomocnik jest użyteczny tylko wewnątrz jednego dołączonego pakietu providera, trzymaj go na
tej warstwie katalogu głównego pakietu zamiast promować go do `openclaw/plugin-sdk/*`.

Niektóre wygenerowane warstwy pomocnicze `openclaw/plugin-sdk/<bundled-id>` nadal istnieją dla
utrzymania dołączonych Pluginów i zgodności, na przykład
`plugin-sdk/feishu-setup` albo `plugin-sdk/zalo-setup`. Traktuj je jako zastrzeżone
powierzchnie, a nie domyślny wzorzec dla nowych Pluginów zewnętrznych.

## Lista kontrolna przed zgłoszeniem

<Check>**package.json** ma poprawne metadane `openclaw`</Check>
<Check>Manifest **openclaw.plugin.json** jest obecny i prawidłowy</Check>
<Check>Entry point używa `defineChannelPluginEntry` albo `definePluginEntry`</Check>
<Check>Wszystkie importy używają ukierunkowanych ścieżek `plugin-sdk/<subpath>`</Check>
<Check>Importy wewnętrzne używają lokalnych modułów, a nie samoimportów SDK</Check>
<Check>Testy przechodzą (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` przechodzi (Pluginy w repo)</Check>

## Testowanie wydań beta

1. Obserwuj tagi wydań GitHub na [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) i zasubskrybuj je przez `Watch` > `Releases`. Tagi beta wyglądają jak `v2026.3.N-beta.1`. Możesz też włączyć powiadomienia dla oficjalnego konta OpenClaw na X [@openclaw](https://x.com/openclaw) w sprawie ogłoszeń wydań.
2. Przetestuj swój Plugin względem tagu beta, gdy tylko się pojawi. Okno przed stable zwykle trwa tylko kilka godzin.
3. Po testach napisz w wątku swojego Pluginu na kanale Discord `plugin-forum`, czy jest `all good`, czy co się zepsuło. Jeśli nie masz jeszcze wątku, utwórz go.
4. Jeśli coś się zepsuje, otwórz albo zaktualizuj issue zatytułowane `Beta blocker: <plugin-name> - <summary>` i dodaj etykietę `beta-blocker`. Umieść link do issue w swoim wątku.
5. Otwórz PR do `main` zatytułowany `fix(<plugin-id>): beta blocker - <summary>` i podlinkuj issue zarówno w PR, jak i w swoim wątku na Discord. Współtwórcy nie mogą dodawać etykiet do PR, więc tytuł jest sygnałem po stronie PR dla maintainerów i automatyzacji. Blokery z PR są mergowane; blokery bez PR mogą i tak trafić do wydania. Maintainerzy obserwują te wątki podczas testów beta.
6. Cisza oznacza zielone. Jeśli przegapisz okno, Twoja poprawka prawdopodobnie trafi do następnego cyklu.

## Następne kroki

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Zbuduj Plugin kanału wiadomości
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Zbuduj Plugin providera modelu
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/pl/plugins/sdk-overview">
    Mapa importów i dokumentacja API rejestracji
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, wyszukiwanie, subagent przez api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/pl/plugins/sdk-testing">
    Narzędzia i wzorce testowe
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/pl/plugins/manifest">
    Pełna dokumentacja schematu manifestu
  </Card>
</CardGroup>

## Powiązane

- [Plugin Architecture](/pl/plugins/architecture) — szczegółowe omówienie architektury wewnętrznej
- [SDK Overview](/pl/plugins/sdk-overview) — dokumentacja Plugin SDK
- [Manifest](/pl/plugins/manifest) — format manifestu Pluginu
- [Channel Plugins](/pl/plugins/sdk-channel-plugins) — tworzenie Pluginów kanałów
- [Provider Plugins](/pl/plugins/sdk-provider-plugins) — tworzenie Pluginów providerów
