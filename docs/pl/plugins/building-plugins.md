---
read_when:
    - Chcesz utworzyć nowy Plugin OpenClaw
    - Potrzebujesz szybkiego wprowadzenia do tworzenia Plugin
    - Dodajesz nowy kanał, dostawcę, narzędzie lub inną funkcję do OpenClaw
sidebarTitle: Getting Started
summary: Utwórz swój pierwszy Plugin OpenClaw w kilka minut
title: Tworzenie Pluginów
x-i18n:
    generated_at: "2026-05-02T20:46:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: b42170b40094f89a63b1497c08ec31e397931dd536bd6faeeb8bc3c123ae45d1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
mowę, transkrypcję w czasie rzeczywistym, głos w czasie rzeczywistym,
rozumienie multimediów, generowanie obrazów, generowanie wideo, pobieranie z
sieci, wyszukiwanie w sieci, narzędzia agentów albo dowolną ich kombinację.

Nie musisz dodawać swojego Plugin do repozytorium OpenClaw. Opublikuj go w
[ClawHub](/pl/tools/clawhub), a użytkownicy zainstalują go poleceniem
`openclaw plugins install clawhub:<package-name>`. Surowe specyfikacje pakietów
nadal instalują z npm podczas przejścia przy uruchomieniu.

## Wymagania wstępne

- Node >= 22 oraz menedżer pakietów (npm albo pnpm)
- Znajomość TypeScript (ESM)
- Dla Plugin w repozytorium: sklonowane repozytorium i wykonane `pnpm install`. Programowanie Plugin w checkoucie źródeł wymaga wyłącznie pnpm, ponieważ OpenClaw ładuje wbudowane Plugin z pakietów workspace `extensions/*`.

## Jaki rodzaj Plugin?

<CardGroup cols={3}>
  <Card title="Plugin kanału" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Połącz OpenClaw z platformą komunikacyjną (Discord, IRC itd.)
  </Card>
  <Card title="Plugin dostawcy" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Dodaj dostawcę modeli (LLM, proxy albo niestandardowy endpoint)
  </Card>
  <Card title="Plugin narzędzia / hooka" icon="wrench" href="/pl/plugins/hooks">
    Zarejestruj narzędzia agentów, hooki zdarzeń albo usługi — kontynuuj poniżej
  </Card>
</CardGroup>

Dla Plugin kanału, którego instalacja nie jest gwarantowana podczas działania
onboardingu/konfiguracji, użyj `createOptionalChannelSetupSurface(...)` z
`openclaw/plugin-sdk/channel-setup`. Tworzy on parę adaptera konfiguracji i
kreatora, która komunikuje wymaganie instalacji i bezpiecznie odmawia
rzeczywistych zapisów konfiguracji, dopóki Plugin nie zostanie zainstalowany.

## Szybki start: Plugin narzędzia

Ten przewodnik tworzy minimalny Plugin, który rejestruje narzędzie agenta. Dla
Plugin kanałów i dostawców dostępne są osobne przewodniki podlinkowane powyżej.

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

    Każdy Plugin wymaga manifestu, nawet bez konfiguracji. Narzędzia
    rejestrowane w runtime muszą być wymienione w `contracts.tools`, aby
    OpenClaw mógł wykryć właścicielski Plugin bez ładowania runtime każdego
    Plugin. Pluginy powinny też świadomie deklarować `activation.onStartup`.
    Ten przykład ustawia ją na `true`. Zobacz [Manifest](/pl/plugins/manifest), aby
    poznać pełny schemat. Kanoniczne fragmenty publikacji w ClawHub znajdują się
    w `docs/snippets/plugin-publish/`.

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

    `definePluginEntry` jest przeznaczone dla Plugin innych niż kanały. Dla
    kanałów użyj `defineChannelPluginEntry` — zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins).
    Pełne opcje punktu wejścia opisuje sekcja [Punkty wejścia](/pl/plugins/sdk-entrypoints).

  </Step>

  <Step title="Przetestuj i opublikuj">

    **Zewnętrzne Plugin:** zweryfikuj i opublikuj w ClawHub, a następnie zainstaluj:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Surowe specyfikacje pakietów, takie jak `@myorg/openclaw-my-plugin`,
    instalują z npm podczas przejścia przy uruchomieniu. Użyj `clawhub:`, gdy
    chcesz rozwiązywania przez ClawHub.

    **Plugin w repozytorium:** umieść pod drzewem workspace wbudowanych Plugin — zostanie wykryty automatycznie.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Możliwości Plugin

Pojedynczy Plugin może zarejestrować dowolną liczbę możliwości przez obiekt `api`:

| Możliwość              | Metoda rejestracji                              | Szczegółowy przewodnik                                                       |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inferencja tekstu (LLM) | `api.registerProvider(...)`                      | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins)                               |
| Backend inferencji CLI  | `api.registerCliBackend(...)`                    | [Backendy CLI](/pl/gateway/cli-backends)                                           |
| Kanał / komunikacja     | `api.registerChannel(...)`                       | [Pluginy kanałów](/pl/plugins/sdk-channel-plugins)                                 |
| Mowa (TTS/STT)          | `api.registerSpeechProvider(...)`                | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transkrypcja w czasie rzeczywistym | `api.registerRealtimeTranscriptionProvider(...)` | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Głos w czasie rzeczywistym | `api.registerRealtimeVoiceProvider(...)`         | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Rozumienie multimediów  | `api.registerMediaUnderstandingProvider(...)`    | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie obrazów     | `api.registerImageGenerationProvider(...)`       | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie muzyki      | `api.registerMusicGenerationProvider(...)`       | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie wideo       | `api.registerVideoGenerationProvider(...)`       | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pobieranie z sieci      | `api.registerWebFetchProvider(...)`              | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Wyszukiwanie w sieci    | `api.registerWebSearchProvider(...)`             | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware wyników narzędzi | `api.registerAgentToolResultMiddleware(...)`     | [Przegląd SDK](/pl/plugins/sdk-overview#registration-api)                          |
| Narzędzia agentów       | `api.registerTool(...)`                          | Poniżej                                                                           |
| Polecenia niestandardowe | `api.registerCommand(...)`                       | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                        |
| Hooki Plugin            | `api.on(...)`                                    | [Hooki Plugin](/pl/plugins/hooks)                                                  |
| Wewnętrzne hooki zdarzeń | `api.registerHook(...)`                          | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                        |
| Trasy HTTP              | `api.registerHttpRoute(...)`                     | [Elementy wewnętrzne](/pl/plugins/architecture-internals#gateway-http-routes)                |
| Podpolecenia CLI        | `api.registerCli(...)`                           | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                        |

Pełne API rejestracji opisuje [Przegląd SDK](/pl/plugins/sdk-overview#registration-api).

Wbudowane Plugin mogą używać `api.registerAgentToolResultMiddleware(...)`, gdy
potrzebują asynchronicznego przepisywania wyników narzędzi, zanim model zobaczy
dane wyjściowe. Zadeklaruj docelowe runtime w `contracts.agentToolResultMiddleware`,
na przykład `["pi", "codex"]`. To zaufany punkt rozszerzeń wbudowanych Plugin;
zewnętrzne Plugin powinny preferować zwykłe hooki Plugin OpenClaw, chyba że
OpenClaw doda jawną politykę zaufania dla tej możliwości.

Jeśli Twój Plugin rejestruje niestandardowe metody RPC Gateway, trzymaj je pod
prefiksem specyficznym dla Plugin. Główne przestrzenie nazw administracyjnych
(`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane
i zawsze rozwiązywane do `operator.admin`, nawet jeśli Plugin prosi o węższy
zakres.

Semantyka ochrony hooków, o której warto pamiętać:

- `before_tool_call`: `{ block: true }` jest końcowe i zatrzymuje handlery o niższym priorytecie.
- `before_tool_call`: `{ block: false }` jest traktowane jako brak decyzji.
- `before_tool_call`: `{ requireApproval: true }` wstrzymuje wykonanie agenta i prosi użytkownika o zatwierdzenie przez nakładkę zatwierdzeń exec, przyciski Telegram, interakcje Discord albo polecenie `/approve` w dowolnym kanale.
- `before_install`: `{ block: true }` jest końcowe i zatrzymuje handlery o niższym priorytecie.
- `before_install`: `{ block: false }` jest traktowane jako brak decyzji.
- `message_sending`: `{ cancel: true }` jest końcowe i zatrzymuje handlery o niższym priorytecie.
- `message_sending`: `{ cancel: false }` jest traktowane jako brak decyzji.
- `message_received`: preferuj typowane pole `threadId`, gdy potrzebujesz routingu przychodzących wątków/tematów. Zachowaj `metadata` dla dodatków specyficznych dla kanału.
- `message_sending`: preferuj typowane pola routingu `replyToId` / `threadId` zamiast kluczy metadanych specyficznych dla kanału.

Polecenie `/approve` obsługuje zarówno zatwierdzenia exec, jak i Plugin z
ograniczonym fallbackiem: gdy identyfikator zatwierdzenia exec nie zostanie
znaleziony, OpenClaw ponawia ten sam identyfikator w zatwierdzeniach Plugin.
Przekazywanie zatwierdzeń Plugin można skonfigurować niezależnie przez
`approvals.plugin` w konfiguracji.

Jeśli niestandardowa obsługa zatwierdzeń musi wykryć ten sam przypadek
ograniczonego fallbacku, preferuj `isApprovalNotFoundError` z
`openclaw/plugin-sdk/error-runtime` zamiast ręcznego dopasowywania tekstów
wygaśnięcia zatwierdzenia.

Przykłady i referencję hooków znajdziesz w [Hooki Plugin](/pl/plugins/hooks).

## Rejestrowanie narzędzi agentów

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

Każde narzędzie zarejestrowane przez `api.registerTool(...)` musi też być
zadeklarowane w manifeście Plugin:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

OpenClaw przechwytuje i buforuje zweryfikowany deskryptor z zarejestrowanego
narzędzia, więc Plugin nie duplikują `description` ani danych schematu w
manifeście. Kontrakt manifestu deklaruje tylko własność i wykrywanie; wykonanie
nadal wywołuje aktywną zarejestrowaną implementację narzędzia.

Użytkownicy włączają narzędzia opcjonalne w konfiguracji:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Nazwy narzędzi nie mogą kolidować z narzędziami podstawowymi (konflikty są pomijane)
- Narzędzia z nieprawidłowo sformatowanymi obiektami rejestracji, w tym bez `parameters`, są pomijane i raportowane w diagnostyce pluginu zamiast przerywać uruchomienia agenta
- Użyj `optional: true` dla narzędzi ze skutkami ubocznymi lub dodatkowymi wymaganiami dotyczącymi plików binarnych
- Użytkownicy mogą włączyć wszystkie narzędzia z pluginu, dodając identyfikator pluginu do `tools.allow`

## Rejestrowanie poleceń CLI

Plugins mogą dodawać główne grupy poleceń `openclaw` za pomocą `api.registerCli`. Podaj
`descriptors` dla każdego katalogu głównego polecenia najwyższego poziomu, aby OpenClaw mógł wyświetlać i kierować
polecenie bez gorliwego ładowania każdego środowiska wykonawczego pluginu.

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

Po instalacji zweryfikuj rejestrację środowiska wykonawczego i wykonaj polecenie:

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

Pełne odniesienie do ścieżek podrzędnych znajdziesz w [Omówieniu SDK](/pl/plugins/sdk-overview).

W swoim pluginie używaj lokalnych plików zbiorczych (`api.ts`, `runtime-api.ts`) dla
importów wewnętrznych — nigdy nie importuj własnego pluginu przez jego ścieżkę SDK.

W przypadku pluginów dostawców trzymaj pomocniki specyficzne dla dostawcy w tych plikach zbiorczych
w katalogu głównym pakietu, chyba że punkt styku jest naprawdę ogólny. Obecne dołączone przykłady:

- Anthropic: opakowania strumieni Claude oraz pomocniki `service_tier` / beta
- OpenAI: konstruktory dostawców, pomocniki modeli domyślnych, dostawcy czasu rzeczywistego
- OpenRouter: konstruktor dostawcy oraz pomocniki onboardingu/konfiguracji

Jeśli pomocnik jest przydatny tylko wewnątrz jednego dołączonego pakietu dostawcy, trzymaj go na tym
punkcie styku w katalogu głównym pakietu zamiast promować go do `openclaw/plugin-sdk/*`.

Niektóre wygenerowane punkty styku pomocników `openclaw/plugin-sdk/<bundled-id>` nadal istnieją do
utrzymania dołączonych pluginów, gdy mają śledzone użycie przez właściciela. Traktuj je jako
powierzchnie zarezerwowane, a nie jako domyślny wzorzec dla nowych pluginów zewnętrznych.

## Lista kontrolna przed przesłaniem

<Check>**package.json** ma poprawne metadane `openclaw`</Check>
<Check>Manifest **openclaw.plugin.json** istnieje i jest poprawny</Check>
<Check>Punkt wejścia używa `defineChannelPluginEntry` lub `definePluginEntry`</Check>
<Check>Wszystkie importy używają skoncentrowanych ścieżek `plugin-sdk/<subpath>`</Check>
<Check>Importy wewnętrzne używają modułów lokalnych, a nie samoimportów SDK</Check>
<Check>Testy przechodzą (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` przechodzi (pluginy w repozytorium)</Check>

## Testowanie wersji beta

1. Obserwuj tagi wydań GitHub w [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) i subskrybuj przez `Watch` > `Releases`. Tagi beta wyglądają jak `v2026.3.N-beta.1`. Możesz też włączyć powiadomienia dla oficjalnego konta OpenClaw na X [@openclaw](https://x.com/openclaw), aby otrzymywać ogłoszenia o wydaniach.
2. Przetestuj swój plugin względem tagu beta od razu, gdy się pojawi. Okno przed wersją stabilną zwykle trwa tylko kilka godzin.
3. Po testach napisz w wątku swojego pluginu na kanale Discord `plugin-forum`, używając `all good` albo opisując, co się zepsuło. Jeśli nie masz jeszcze wątku, utwórz go.
4. Jeśli coś się zepsuje, otwórz lub zaktualizuj issue o tytule `Beta blocker: <plugin-name> - <summary>` i zastosuj etykietę `beta-blocker`. Umieść link do issue w swoim wątku.
5. Otwórz PR do `main` o tytule `fix(<plugin-id>): beta blocker - <summary>` i połącz issue zarówno w PR, jak i w swoim wątku Discord. Kontrybutorzy nie mogą etykietować PR-ów, więc tytuł jest sygnałem po stronie PR dla maintainerów i automatyzacji. Blokery z PR-em zostaną scalone; blokery bez PR-a mogą mimo to trafić do wydania. Maintainerzy obserwują te wątki podczas testów beta.
6. Cisza oznacza zielone światło. Jeśli przegapisz okno, Twoja poprawka prawdopodobnie trafi do następnego cyklu.

## Następne kroki

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Zbuduj plugin kanału wiadomości
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Zbuduj plugin dostawcy modeli
  </Card>
  <Card title="Omówienie SDK" icon="book-open" href="/pl/plugins/sdk-overview">
    Mapa importów i dokumentacja API rejestracji
  </Card>
  <Card title="Pomocniki środowiska wykonawczego" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, wyszukiwanie, subagent przez api.runtime
  </Card>
  <Card title="Testowanie" icon="test-tubes" href="/pl/plugins/sdk-testing">
    Narzędzia testowe i wzorce
  </Card>
  <Card title="Manifest pluginu" icon="file-json" href="/pl/plugins/manifest">
    Pełna dokumentacja schematu manifestu
  </Card>
</CardGroup>

## Powiązane

- [Architektura Plugin](/pl/plugins/architecture) — szczegółowy opis architektury wewnętrznej
- [Omówienie SDK](/pl/plugins/sdk-overview) — dokumentacja Plugin SDK
- [Manifest](/pl/plugins/manifest) — format manifestu pluginu
- [Channel Plugins](/pl/plugins/sdk-channel-plugins) — tworzenie pluginów kanałów
- [Provider Plugins](/pl/plugins/sdk-provider-plugins) — tworzenie pluginów dostawców
