---
read_when:
    - Chcesz utworzyć nowy Plugin OpenClaw
    - Potrzebujesz szybkiego startu do tworzenia Pluginów
    - Dodajesz nowy kanał, dostawcę, narzędzie lub inną funkcję do OpenClaw
sidebarTitle: Getting Started
summary: Utwórz swój pierwszy Plugin OpenClaw w kilka minut
title: Tworzenie Pluginów
x-i18n:
    generated_at: "2026-05-02T09:56:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf85c1c1c1f6ae6752f7fb8d842a420bffac6ebaf4d64803fb8bb8ab9f6f83c
    source_path: plugins/building-plugins.md
    workflow: 16
---

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
mowę, transkrypcję w czasie rzeczywistym, głos w czasie rzeczywistym, rozumienie
mediów, generowanie obrazów, generowanie wideo, pobieranie z sieci, wyszukiwanie
w sieci, narzędzia agentów albo dowolne połączenie tych funkcji.

Nie musisz dodawać swojego pluginu do repozytorium OpenClaw. Opublikuj go w
[ClawHub](/pl/tools/clawhub), a użytkownicy zainstalują go poleceniem
`openclaw plugins install <package-name>`. OpenClaw najpierw próbuje użyć ClawHub,
a dla pakietów, które nadal korzystają z dystrybucji przez npm, automatycznie
wraca do npm.

## Wymagania wstępne

- Node >= 22 i menedżer pakietów (npm lub pnpm)
- Znajomość TypeScript (ESM)
- Dla pluginów w repozytorium: sklonowane repozytorium i wykonane `pnpm install`. Programowanie pluginów z checkoutu źródłowego działa tylko z pnpm, ponieważ OpenClaw ładuje dołączone pluginy z pakietów workspace `extensions/*`.

## Jaki typ pluginu?

<CardGroup cols={3}>
  <Card title="Plugin kanału" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Połącz OpenClaw z platformą wiadomości (Discord, IRC itd.)
  </Card>
  <Card title="Plugin dostawcy" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Dodaj dostawcę modeli (LLM, proxy lub własny endpoint)
  </Card>
  <Card title="Plugin narzędzia / hooka" icon="wrench" href="/pl/plugins/hooks">
    Zarejestruj narzędzia agenta, hooki zdarzeń lub usługi — kontynuuj poniżej
  </Card>
</CardGroup>

Dla pluginu kanału, który nie musi być zainstalowany podczas onboardingu/konfiguracji,
użyj `createOptionalChannelSetupSurface(...)` z
`openclaw/plugin-sdk/channel-setup`. Tworzy on parę adaptera konfiguracji i kreatora,
która informuje o wymaganiu instalacji i bezpiecznie odmawia rzeczywistych zapisów
konfiguracji, dopóki plugin nie zostanie zainstalowany.

## Szybki start: plugin narzędzia

Ten przewodnik tworzy minimalny plugin, który rejestruje narzędzie agenta. Pluginy
kanałów i dostawców mają osobne przewodniki podlinkowane powyżej.

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

    Każdy plugin potrzebuje manifestu, nawet bez konfiguracji. Narzędzia
    rejestrowane w czasie działania muszą być wymienione w `contracts.tools`, aby
    OpenClaw mógł odkryć plugin właścicielski bez ładowania runtime'u każdego
    pluginu. Pluginy powinny też świadomie deklarować `activation.onStartup`. Ten
    przykład ustawia je na `true`. Pełny schemat znajdziesz w
    [Manifeście](/pl/plugins/manifest). Kanoniczne fragmenty publikowania w ClawHub
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

    `definePluginEntry` jest przeznaczone dla pluginów innych niż kanały. Dla kanałów
    użyj `defineChannelPluginEntry` — zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins).
    Pełne opcje punktu wejścia znajdziesz w [Punktach wejścia](/pl/plugins/sdk-entrypoints).

  </Step>

  <Step title="Przetestuj i opublikuj">

    **Pluginy zewnętrzne:** zweryfikuj i opublikuj w ClawHub, a następnie zainstaluj:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw sprawdza też ClawHub przed npm dla prostych specyfikacji pakietów,
    takich jak `@myorg/openclaw-my-plugin`; npm pozostaje fallbackiem dla pakietów,
    które nie zostały jeszcze przeniesione do ClawHub.

    **Pluginy w repozytorium:** umieść je w drzewie workspace dołączonych pluginów — zostaną odkryte automatycznie.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Możliwości pluginów

Pojedynczy plugin może zarejestrować dowolną liczbę możliwości przez obiekt `api`:

| Możliwość              | Metoda rejestracji                              | Szczegółowy przewodnik                                                        |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inferencja tekstu (LLM) | `api.registerProvider(...)`                      | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins)                             |
| Backend inferencji CLI  | `api.registerCliBackend(...)`                    | [Backendy CLI](/pl/gateway/cli-backends)                                          |
| Kanał / wiadomości      | `api.registerChannel(...)`                       | [Pluginy kanałów](/pl/plugins/sdk-channel-plugins)                                |
| Mowa (TTS/STT)          | `api.registerSpeechProvider(...)`                | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transkrypcja w czasie rzeczywistym | `api.registerRealtimeTranscriptionProvider(...)` | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Głos w czasie rzeczywistym | `api.registerRealtimeVoiceProvider(...)`         | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Rozumienie mediów       | `api.registerMediaUnderstandingProvider(...)`    | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie obrazów     | `api.registerImageGenerationProvider(...)`       | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie muzyki      | `api.registerMusicGenerationProvider(...)`       | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie wideo       | `api.registerVideoGenerationProvider(...)`       | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pobieranie z sieci      | `api.registerWebFetchProvider(...)`              | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Wyszukiwanie w sieci    | `api.registerWebSearchProvider(...)`             | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware wyników narzędzi | `api.registerAgentToolResultMiddleware(...)`     | [Omówienie SDK](/pl/plugins/sdk-overview#registration-api)                        |
| Narzędzia agenta        | `api.registerTool(...)`                          | Poniżej                                                                         |
| Polecenia niestandardowe | `api.registerCommand(...)`                       | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                      |
| Hooki pluginów          | `api.on(...)`                                    | [Hooki pluginów](/pl/plugins/hooks)                                                |
| Wewnętrzne hooki zdarzeń | `api.registerHook(...)`                          | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                      |
| Trasy HTTP              | `api.registerHttpRoute(...)`                     | [Elementy wewnętrzne](/pl/plugins/architecture-internals#gateway-http-routes)      |
| Podpolecenia CLI        | `api.registerCli(...)`                           | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                      |

Pełne API rejestracji znajdziesz w [Omówieniu SDK](/pl/plugins/sdk-overview#registration-api).

Dołączone pluginy mogą używać `api.registerAgentToolResultMiddleware(...)`, gdy
potrzebują asynchronicznego przepisywania wyników narzędzi, zanim model zobaczy
dane wyjściowe. Zadeklaruj docelowe runtime'y w
`contracts.agentToolResultMiddleware`, na przykład `["pi", "codex"]`. To zaufany
szew dla dołączonych pluginów; pluginy zewnętrzne powinny preferować zwykłe hooki
pluginów OpenClaw, chyba że OpenClaw wprowadzi jawną politykę zaufania dla tej
możliwości.

Jeśli twój plugin rejestruje niestandardowe metody RPC Gateway, trzymaj je pod
prefiksem specyficznym dla pluginu. Przestrzenie nazw administracyjnych rdzenia
(`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane
i zawsze rozwiązują się do `operator.admin`, nawet jeśli plugin prosi o węższy
zakres.

Semantyka ochrony hooków, o której warto pamiętać:

- `before_tool_call`: `{ block: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `before_tool_call`: `{ block: false }` jest traktowane jako brak decyzji.
- `before_tool_call`: `{ requireApproval: true }` wstrzymuje wykonanie agenta i prosi użytkownika o zatwierdzenie przez nakładkę zatwierdzeń exec, przyciski Telegram, interakcje Discord albo polecenie `/approve` na dowolnym kanale.
- `before_install`: `{ block: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `before_install`: `{ block: false }` jest traktowane jako brak decyzji.
- `message_sending`: `{ cancel: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `message_sending`: `{ cancel: false }` jest traktowane jako brak decyzji.
- `message_received`: preferuj typowane pole `threadId`, gdy potrzebujesz routingu przychodzącego wątku/tematu. Zachowaj `metadata` dla dodatków specyficznych dla kanału.
- `message_sending`: preferuj typowane pola routingu `replyToId` / `threadId` zamiast kluczy metadanych specyficznych dla kanału.

Polecenie `/approve` obsługuje zatwierdzenia exec i pluginów z ograniczonym
fallbackiem: gdy identyfikator zatwierdzenia exec nie zostanie znaleziony,
OpenClaw ponawia próbę z tym samym identyfikatorem przez zatwierdzenia pluginów.
Przekazywanie zatwierdzeń pluginów można skonfigurować niezależnie przez
`approvals.plugin` w konfiguracji.

Jeśli niestandardowa obsługa zatwierdzeń musi wykryć ten sam przypadek
ograniczonego fallbacku, preferuj `isApprovalNotFoundError` z
`openclaw/plugin-sdk/error-runtime` zamiast ręcznego dopasowywania tekstów o
wygaśnięciu zatwierdzenia.

Przykłady i referencję hooków znajdziesz w [Hookach pluginów](/pl/plugins/hooks).

## Rejestrowanie narzędzi agenta

Narzędzia to typowane funkcje, które LLM może wywoływać. Mogą być wymagane
(zawsze dostępne) albo opcjonalne (włączane przez użytkownika):

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

Każde narzędzie zarejestrowane przez `api.registerTool(...)` musi być także
zadeklarowane w manifeście pluginu:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

Użytkownicy włączają narzędzia opcjonalne w konfiguracji:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Nazwy narzędzi nie mogą kolidować z narzędziami rdzenia (konflikty są pomijane)
- Narzędzia z nieprawidłowo sformatowanymi obiektami rejestracji, w tym bez `parameters`, są pomijane i zgłaszane w diagnostyce pluginu zamiast przerywać uruchomienia agentów
- Użyj `optional: true` dla narzędzi ze skutkami ubocznymi lub dodatkowymi wymaganiami dotyczącymi plików binarnych
- Użytkownicy mogą włączyć wszystkie narzędzia z pluginu, dodając identyfikator pluginu do `tools.allow`

## Rejestrowanie poleceń CLI

Pluginy mogą dodawać główne grupy poleceń `openclaw` za pomocą `api.registerCli`. Podaj
`descriptors` dla każdego głównego korzenia polecenia najwyższego poziomu, aby OpenClaw mógł wyświetlać i kierować
polecenie bez gorliwego ładowania każdego środowiska uruchomieniowego pluginu.

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

Po instalacji zweryfikuj rejestrację środowiska uruchomieniowego i wykonaj polecenie:

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

Pełną referencję podścieżek znajdziesz w [Przeglądzie SDK](/pl/plugins/sdk-overview).

W swoim pluginie używaj lokalnych plików zbiorczych (`api.ts`, `runtime-api.ts`) do
importów wewnętrznych — nigdy nie importuj własnego pluginu przez jego ścieżkę SDK.

W przypadku pluginów dostawców trzymaj pomocniki specyficzne dla dostawcy w tych
plikach zbiorczych z korzenia pakietu, chyba że granica jest naprawdę ogólna. Obecne przykłady wbudowane:

- Anthropic: opakowania strumieni Claude oraz pomocniki `service_tier` / beta
- OpenAI: konstruktory dostawców, pomocniki modeli domyślnych, dostawcy czasu rzeczywistego
- OpenRouter: konstruktor dostawcy oraz pomocniki wdrażania/konfiguracji

Jeśli pomocnik jest użyteczny tylko w jednym wbudowanym pakiecie dostawcy, zachowaj go na tej
granicy z korzenia pakietu zamiast promować go do `openclaw/plugin-sdk/*`.

Niektóre wygenerowane pomocnicze granice `openclaw/plugin-sdk/<bundled-id>` nadal istnieją na potrzeby
utrzymania wbudowanych pluginów, gdy mają śledzone użycie właściciela. Traktuj je jako
powierzchnie zarezerwowane, a nie jako domyślny wzorzec dla nowych pluginów zewnętrznych.

## Lista kontrolna przed wysłaniem

<Check>**package.json** ma poprawne metadane `openclaw`</Check>
<Check>Manifest **openclaw.plugin.json** jest obecny i prawidłowy</Check>
<Check>Punkt wejścia używa `defineChannelPluginEntry` lub `definePluginEntry`</Check>
<Check>Wszystkie importy używają skoncentrowanych ścieżek `plugin-sdk/<subpath>`</Check>
<Check>Importy wewnętrzne używają lokalnych modułów, a nie samoimportów SDK</Check>
<Check>Testy przechodzą (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` przechodzi (pluginy w repozytorium)</Check>

## Testowanie wydania beta

1. Obserwuj tagi wydań GitHub w [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) i subskrybuj przez `Watch` > `Releases`. Tagi beta wyglądają jak `v2026.3.N-beta.1`. Możesz też włączyć powiadomienia dla oficjalnego konta OpenClaw na X [@openclaw](https://x.com/openclaw), aby otrzymywać ogłoszenia o wydaniach.
2. Przetestuj swój plugin względem taga beta, gdy tylko się pojawi. Okno przed wydaniem stabilnym zwykle trwa tylko kilka godzin.
3. Po testowaniu opublikuj w wątku swojego pluginu na kanale Discord `plugin-forum` komunikat `all good` albo informację o tym, co się zepsuło. Jeśli nie masz jeszcze wątku, utwórz go.
4. Jeśli coś się zepsuje, otwórz lub zaktualizuj zgłoszenie zatytułowane `Beta blocker: <plugin-name> - <summary>` i zastosuj etykietę `beta-blocker`. Umieść link do zgłoszenia w swoim wątku.
5. Otwórz PR do `main` zatytułowany `fix(<plugin-id>): beta blocker - <summary>` i połącz zgłoszenie zarówno w PR, jak i w swoim wątku Discord. Kontrybutorzy nie mogą etykietować PR-ów, więc tytuł jest sygnałem po stronie PR dla maintainerów i automatyzacji. Blokery z PR zostaną scalone; blokery bez PR mogą mimo to trafić do wydania. Maintainerzy obserwują te wątki podczas testowania beta.
6. Cisza oznacza zielone światło. Jeśli przegapisz okno, Twoja poprawka prawdopodobnie trafi do następnego cyklu.

## Następne kroki

<CardGroup cols={2}>
  <Card title="Pluginy kanałów" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Zbuduj plugin kanału wiadomości
  </Card>
  <Card title="Pluginy dostawców" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Zbuduj plugin dostawcy modelu
  </Card>
  <Card title="Przegląd SDK" icon="book-open" href="/pl/plugins/sdk-overview">
    Mapa importów i referencja API rejestracji
  </Card>
  <Card title="Pomocniki środowiska uruchomieniowego" icon="settings" href="/pl/plugins/sdk-runtime">
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
