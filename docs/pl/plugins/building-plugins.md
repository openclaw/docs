---
read_when:
    - Chcesz utworzyć nowy Plugin OpenClaw
    - Potrzebujesz przewodnika szybkiego startu do tworzenia Plugin
    - Dodajesz nowy kanał, dostawcę, narzędzie lub inną funkcjonalność do OpenClaw
sidebarTitle: Getting Started
summary: Utwórz swój pierwszy Plugin dla OpenClaw w kilka minut
title: Tworzenie Pluginów
x-i18n:
    generated_at: "2026-05-04T02:25:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e6c55c551629da54b3f150ce6299694186fe4434cfd7978a2d43d175d33a5d9
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
mowę, transkrypcję w czasie rzeczywistym, głos w czasie rzeczywistym, rozumienie
mediów, generowanie obrazów, generowanie wideo, pobieranie z sieci, wyszukiwanie
w sieci, narzędzia agenta albo dowolną ich kombinację.

Nie musisz dodawać swojego Plugin do repozytorium OpenClaw. Opublikuj go w
[ClawHub](/pl/tools/clawhub), a użytkownicy zainstalują go poleceniem
`openclaw plugins install clawhub:<package-name>`. Same specyfikacje pakietów
nadal instalują z npm podczas przejścia uruchomieniowego.

## Wymagania wstępne

- Node >= 22 i menedżer pakietów (npm lub pnpm)
- Znajomość TypeScript (ESM)
- Dla Plugin w repozytorium: sklonowane repozytorium i wykonane `pnpm install`. Tworzenie
  Plugin z katalogu roboczego źródeł obsługuje wyłącznie pnpm, ponieważ OpenClaw ładuje dołączone
  Plugin z pakietów workspace `extensions/*`.

## Jaki rodzaj Plugin?

<CardGroup cols={3}>
  <Card title="Plugin kanału" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Połącz OpenClaw z platformą komunikacyjną (Discord, IRC itd.)
  </Card>
  <Card title="Plugin dostawcy" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Dodaj dostawcę modeli (LLM, proxy albo własny punkt końcowy)
  </Card>
  <Card title="Plugin narzędzia / haka" icon="wrench" href="/pl/plugins/hooks">
    Zarejestruj narzędzia agenta, haki zdarzeń albo usługi — kontynuuj poniżej
  </Card>
</CardGroup>

Dla Plugin kanału, którego instalacja nie jest gwarantowana podczas wdrażania/konfiguracji,
użyj `createOptionalChannelSetupSurface(...)` z
`openclaw/plugin-sdk/channel-setup`. Tworzy on parę adaptera konfiguracji i kreatora,
która informuje o wymaganiu instalacji i bezpiecznie odmawia rzeczywistych zapisów konfiguracji,
dopóki Plugin nie zostanie zainstalowany.

## Szybki start: Plugin narzędzia

Ten przewodnik tworzy minimalny Plugin, który rejestruje narzędzie agenta. Plugin
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

    Każdy Plugin potrzebuje manifestu, nawet bez konfiguracji. Narzędzia rejestrowane w czasie działania
    muszą być wymienione w `contracts.tools`, aby OpenClaw mógł wykryć właścicielski
    Plugin bez ładowania środowiska wykonawczego każdego Plugin. Plugin powinny też celowo deklarować
    `activation.onStartup`. Ten przykład ustawia tę wartość na `true`. Zobacz
    [Manifest](/pl/plugins/manifest), aby poznać pełny schemat. Kanoniczne fragmenty publikacji ClawHub
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

    `definePluginEntry` służy do Plugin niebędących kanałami. Dla kanałów użyj
    `defineChannelPluginEntry` — zobacz [Plugin kanałów](/pl/plugins/sdk-channel-plugins).
    Pełne opcje punktu wejścia opisuje [Punkty wejścia](/pl/plugins/sdk-entrypoints).

  </Step>

  <Step title="Przetestuj i opublikuj">

    **Zewnętrzne Plugin:** zweryfikuj i opublikuj przez ClawHub, a następnie zainstaluj:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Same specyfikacje pakietów, takie jak `@myorg/openclaw-my-plugin`, instalują z npm podczas
    przejścia uruchomieniowego. Użyj `clawhub:`, gdy chcesz rozwiązywania przez ClawHub.

    **Plugin w repozytorium:** umieść je w drzewie workspace dołączonych Plugin — zostaną wykryte automatycznie.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Możliwości Plugin

Pojedynczy Plugin może zarejestrować dowolną liczbę możliwości przez obiekt `api`:

| Możliwość              | Metoda rejestracji                              | Szczegółowy przewodnik                                                        |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Wnioskowanie tekstowe (LLM) | `api.registerProvider(...)`                      | [Plugin dostawców](/pl/plugins/sdk-provider-plugins)                               |
| Backend wnioskowania CLI | `api.registerCliBackend(...)`                    | [Backendy CLI](/pl/gateway/cli-backends)                                           |
| Kanał / komunikacja    | `api.registerChannel(...)`                       | [Plugin kanałów](/pl/plugins/sdk-channel-plugins)                                  |
| Mowa (TTS/STT)         | `api.registerSpeechProvider(...)`                | [Plugin dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transkrypcja w czasie rzeczywistym | `api.registerRealtimeTranscriptionProvider(...)` | [Plugin dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Głos w czasie rzeczywistym | `api.registerRealtimeVoiceProvider(...)`         | [Plugin dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Rozumienie mediów      | `api.registerMediaUnderstandingProvider(...)`    | [Plugin dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie obrazów    | `api.registerImageGenerationProvider(...)`       | [Plugin dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie muzyki     | `api.registerMusicGenerationProvider(...)`       | [Plugin dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie wideo      | `api.registerVideoGenerationProvider(...)`       | [Plugin dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pobieranie z sieci     | `api.registerWebFetchProvider(...)`              | [Plugin dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Wyszukiwanie w sieci   | `api.registerWebSearchProvider(...)`             | [Plugin dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware wyników narzędzi | `api.registerAgentToolResultMiddleware(...)`     | [Przegląd SDK](/pl/plugins/sdk-overview#registration-api)                          |
| Narzędzia agenta       | `api.registerTool(...)`                          | Poniżej                                                                         |
| Niestandardowe polecenia | `api.registerCommand(...)`                       | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                      |
| Haki Plugin            | `api.on(...)`                                    | [Haki Plugin](/pl/plugins/hooks)                                                   |
| Wewnętrzne haki zdarzeń | `api.registerHook(...)`                          | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                      |
| Trasy HTTP             | `api.registerHttpRoute(...)`                     | [Elementy wewnętrzne](/pl/plugins/architecture-internals#gateway-http-routes)      |
| Podpolecenia CLI       | `api.registerCli(...)`                           | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                      |

Pełne API rejestracji opisuje [Przegląd SDK](/pl/plugins/sdk-overview#registration-api).

Dołączone Plugin mogą używać `api.registerAgentToolResultMiddleware(...)`, gdy
potrzebują asynchronicznego przepisywania wyników narzędzi, zanim model zobaczy dane wyjściowe. Zadeklaruj
docelowe środowiska wykonawcze w `contracts.agentToolResultMiddleware`, na przykład
`["pi", "codex"]`. To zaufany interfejs dołączonych Plugin; zewnętrzne
Plugin powinny preferować zwykłe haki Plugin OpenClaw, chyba że OpenClaw rozwinie
jawną politykę zaufania dla tej możliwości.

Jeśli twój Plugin rejestruje niestandardowe metody RPC Gateway, trzymaj je pod
prefiksem specyficznym dla Plugin. Główne przestrzenie nazw administracyjnych (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze rozwiązują się do
`operator.admin`, nawet jeśli Plugin poprosi o węższy zakres.

Semantyka zabezpieczeń haków do zapamiętania:

- `before_tool_call`: `{ block: true }` jest końcowe i zatrzymuje procedury obsługi o niższym priorytecie.
- `before_tool_call`: `{ block: false }` jest traktowane jako brak decyzji.
- `before_tool_call`: `{ requireApproval: true }` wstrzymuje wykonanie agenta i prosi użytkownika o zatwierdzenie przez nakładkę zatwierdzeń wykonywania, przyciski Telegram, interakcje Discord albo polecenie `/approve` w dowolnym kanale.
- `before_install`: `{ block: true }` jest końcowe i zatrzymuje procedury obsługi o niższym priorytecie.
- `before_install`: `{ block: false }` jest traktowane jako brak decyzji.
- `message_sending`: `{ cancel: true }` jest końcowe i zatrzymuje procedury obsługi o niższym priorytecie.
- `message_sending`: `{ cancel: false }` jest traktowane jako brak decyzji.
- `message_received`: preferuj typowane pole `threadId`, gdy potrzebujesz routingu przychodzącego wątku/tematu. Zachowaj `metadata` na dodatki specyficzne dla kanału.
- `message_sending`: preferuj typowane pola routingu `replyToId` / `threadId` zamiast kluczy metadanych specyficznych dla kanału.

Polecenie `/approve` obsługuje zarówno zatwierdzenia wykonywania, jak i Plugin, z ograniczonym fallbackiem: gdy identyfikator zatwierdzenia wykonywania nie zostanie znaleziony, OpenClaw ponawia próbę z tym samym identyfikatorem przez zatwierdzenia Plugin. Przekazywanie zatwierdzeń Plugin można skonfigurować niezależnie przez `approvals.plugin` w konfiguracji.

Jeśli niestandardowa obsługa zatwierdzeń musi wykryć ten sam przypadek ograniczonego fallbacku,
preferuj `isApprovalNotFoundError` z `openclaw/plugin-sdk/error-runtime`
zamiast ręcznego dopasowywania ciągów wygaśnięcia zatwierdzenia.

Zobacz [Haki Plugin](/pl/plugins/hooks), aby poznać przykłady i dokumentację haków.

## Rejestrowanie narzędzi agenta

Narzędzia to typowane funkcje, które LLM może wywołać. Mogą być wymagane (zawsze
dostępne) albo opcjonalne (włączane przez użytkownika):

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

Każde narzędzie zarejestrowane przez `api.registerTool(...)` musi być też zadeklarowane w
manifeście Plugin:

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
Ustaw `toolMetadata.<tool>.optional: true` dla narzędzi zarejestrowanych przez
`api.registerTool(..., { optional: true })`, aby OpenClaw mógł uniknąć ładowania
runtime’u tego pluginu, dopóki narzędzie nie zostanie jawnie dodane do listy dozwolonych.

Użytkownicy włączają narzędzia opcjonalne w konfiguracji:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Nazwy narzędzi nie mogą kolidować z narzędziami rdzenia (konflikty są pomijane)
- Narzędzia z nieprawidłowymi obiektami rejestracji, w tym z brakującym `parameters`, są pomijane i zgłaszane w diagnostyce pluginu zamiast przerywać uruchomienia agentów
- Użyj `optional: true` dla narzędzi z efektami ubocznymi lub dodatkowymi wymaganiami dotyczącymi binariów
- Użytkownicy mogą włączyć wszystkie narzędzia z pluginu, dodając identyfikator pluginu do `tools.allow`

## Rejestrowanie poleceń CLI

Pluginy mogą dodawać główne grupy poleceń `openclaw` za pomocą `api.registerCli`. Podaj
`descriptors` dla każdego głównego katalogu poleceń najwyższego poziomu, aby OpenClaw mógł wyświetlać i trasować
polecenie bez zachłannego ładowania runtime’u każdego pluginu.

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

Po instalacji zweryfikuj rejestrację runtime’u i wykonaj polecenie:

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

W swoim pluginie używaj lokalnych plików barrel (`api.ts`, `runtime-api.ts`) dla
importów wewnętrznych — nigdy nie importuj własnego pluginu przez jego ścieżkę SDK.

W przypadku pluginów dostawców trzymaj pomocniki specyficzne dla dostawcy w tych
barrelach głównego katalogu pakietu, chyba że granica jest naprawdę generyczna. Obecne dołączone przykłady:

- Anthropic: wrappery strumienia Claude oraz pomocniki `service_tier` / beta
- OpenAI: buildery dostawców, pomocniki modeli domyślnych, dostawcy czasu rzeczywistego
- OpenRouter: builder dostawcy oraz pomocniki onboardingu/konfiguracji

Jeśli pomocnik jest użyteczny tylko w jednym dołączonym pakiecie dostawcy, trzymaj go na tej
granicy głównego katalogu pakietu zamiast promować go do `openclaw/plugin-sdk/*`.

Niektóre wygenerowane pomocnicze granice `openclaw/plugin-sdk/<bundled-id>` nadal istnieją na potrzeby
utrzymania dołączonych pluginów, gdy mają śledzone użycie właściciela. Traktuj je jako
zarezerwowane powierzchnie, a nie jako domyślny wzorzec dla nowych pluginów zewnętrznych.

## Lista kontrolna przed zgłoszeniem

<Check>**package.json** ma poprawne metadane `openclaw`</Check>
<Check>Manifest **openclaw.plugin.json** jest obecny i prawidłowy</Check>
<Check>Punkt wejścia używa `defineChannelPluginEntry` lub `definePluginEntry`</Check>
<Check>Wszystkie importy używają skoncentrowanych ścieżek `plugin-sdk/<subpath>`</Check>
<Check>Importy wewnętrzne używają modułów lokalnych, a nie samoimportów SDK</Check>
<Check>Testy przechodzą (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` przechodzi (pluginy w repozytorium)</Check>

## Testowanie wersji beta

1. Obserwuj tagi wydań GitHub w [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) i subskrybuj przez `Watch` > `Releases`. Tagi beta wyglądają jak `v2026.3.N-beta.1`. Możesz też włączyć powiadomienia dla oficjalnego konta OpenClaw na X [@openclaw](https://x.com/openclaw), aby otrzymywać ogłoszenia o wydaniach.
2. Przetestuj swój plugin względem taga beta, gdy tylko się pojawi. Okno przed wersją stabilną zwykle trwa tylko kilka godzin.
3. Po testach napisz w wątku swojego pluginu na kanale Discord `plugin-forum` albo `all good`, albo co się zepsuło. Jeśli nie masz jeszcze wątku, utwórz go.
4. Jeśli coś się zepsuje, otwórz lub zaktualizuj zgłoszenie zatytułowane `Beta blocker: <plugin-name> - <summary>` i zastosuj etykietę `beta-blocker`. Umieść link do zgłoszenia w swoim wątku.
5. Otwórz PR do `main` zatytułowany `fix(<plugin-id>): beta blocker - <summary>` i połącz zgłoszenie zarówno w PR, jak i w swoim wątku Discord. Współautorzy nie mogą etykietować PR-ów, więc tytuł jest sygnałem po stronie PR dla maintainerów i automatyzacji. Blokery z PR są scalane; blokery bez PR mogą mimo to trafić do wydania. Maintainerzy obserwują te wątki podczas testów beta.
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
  <Card title="Pomocniki runtime’u" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, wyszukiwanie, podagent przez api.runtime
  </Card>
  <Card title="Testowanie" icon="test-tubes" href="/pl/plugins/sdk-testing">
    Narzędzia i wzorce testowe
  </Card>
  <Card title="Manifest pluginu" icon="file-json" href="/pl/plugins/manifest">
    Pełna referencja schematu manifestu
  </Card>
</CardGroup>

## Powiązane

- [Architektura pluginów](/pl/plugins/architecture) — dogłębny opis architektury wewnętrznej
- [Przegląd SDK](/pl/plugins/sdk-overview) — referencja SDK pluginów
- [Manifest](/pl/plugins/manifest) — format manifestu pluginu
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — tworzenie pluginów kanałów
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) — tworzenie pluginów dostawców
