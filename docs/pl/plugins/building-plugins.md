---
read_when:
    - Chcesz utworzyć nowy Plugin OpenClaw
    - Potrzebujesz szybkiego startu do tworzenia Pluginów
    - Dodajesz do OpenClaw nowy kanał, dostawcę, narzędzie lub inną możliwość
sidebarTitle: Getting Started
summary: Stwórz swój pierwszy Plugin OpenClaw w kilka minut
title: Tworzenie pluginów
x-i18n:
    generated_at: "2026-05-06T09:22:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9718f8226a3586db06eae6715502edbd7a286f448e24cbef0a08f19a921c3a
    source_path: plugins/building-plugins.md
    workflow: 16
---

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
mowę, transkrypcję w czasie rzeczywistym, głos w czasie rzeczywistym, rozumienie multimediów, generowanie obrazów,
generowanie wideo, pobieranie z sieci, wyszukiwanie w sieci, narzędzia agenta lub dowolną
kombinację.

Nie musisz dodawać swojego pluginu do repozytorium OpenClaw. Opublikuj go w
[ClawHub](/pl/tools/clawhub), a użytkownicy zainstalują go poleceniem
`openclaw plugins install clawhub:<package-name>`. Same specyfikacje pakietów nadal
instalują z npm w czasie przejścia uruchomieniowego.

## Wymagania wstępne

- Node >= 22 i menedżer pakietów (npm lub pnpm)
- Znajomość TypeScript (ESM)
- Dla pluginów w repozytorium: sklonowane repozytorium i wykonane `pnpm install`. Rozwijanie pluginów
  z checkoutu źródeł działa tylko z pnpm, ponieważ OpenClaw ładuje dołączone
  pluginy z pakietów workspace `extensions/*`.

## Jaki rodzaj pluginu?

<CardGroup cols={3}>
  <Card title="Plugin kanału" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Połącz OpenClaw z platformą komunikacyjną (Discord, IRC itd.)
  </Card>
  <Card title="Plugin dostawcy" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Dodaj dostawcę modelu (LLM, proxy lub niestandardowy endpoint)
  </Card>
  <Card title="Plugin narzędzia / haka" icon="wrench" href="/pl/plugins/hooks">
    Zarejestruj narzędzia agenta, haki zdarzeń lub usługi - kontynuuj poniżej
  </Card>
</CardGroup>

W przypadku pluginu kanału, który nie ma gwarancji, że będzie zainstalowany podczas działania onboardingu/konfiguracji,
użyj `createOptionalChannelSetupSurface(...)` z
`openclaw/plugin-sdk/channel-setup`. Tworzy on parę adaptera konfiguracji i kreatora,
która informuje o wymaganiu instalacji i blokuje rzeczywiste zapisy konfiguracji
do czasu zainstalowania pluginu.

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

    Każdy plugin potrzebuje manifestu, nawet bez konfiguracji. Narzędzia rejestrowane w czasie działania
    muszą być wymienione w `contracts.tools`, aby OpenClaw mógł odkryć plugin właściciela
    bez ładowania każdego środowiska uruchomieniowego pluginu. Pluginy powinny też świadomie deklarować
    `activation.onStartup`. Ten przykład ustawia tę wartość na `true`. Pełny schemat znajdziesz w
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

    `definePluginEntry` służy do pluginów niebędących kanałami. Dla kanałów użyj
    `defineChannelPluginEntry` - zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins).
    Pełne opcje punktu wejścia znajdziesz w [Punktach wejścia](/pl/plugins/sdk-entrypoints).

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

    **Pluginy w repozytorium:** umieść je pod drzewem workspace dołączonych pluginów - zostaną automatycznie wykryte.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Możliwości pluginu

Jeden plugin może zarejestrować dowolną liczbę możliwości przez obiekt `api`:

| Możliwość              | Metoda rejestracji                              | Szczegółowy przewodnik                                                        |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Wnioskowanie tekstowe (LLM) | `api.registerProvider(...)`                      | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins)                               |
| Backend wnioskowania CLI | `api.registerCliBackend(...)`                    | [Backendy CLI](/pl/gateway/cli-backends)                                           |
| Kanał / komunikacja    | `api.registerChannel(...)`                       | [Pluginy kanałów](/pl/plugins/sdk-channel-plugins)                                 |
| Mowa (TTS/STT)         | `api.registerSpeechProvider(...)`                | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transkrypcja w czasie rzeczywistym | `api.registerRealtimeTranscriptionProvider(...)` | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Głos w czasie rzeczywistym | `api.registerRealtimeVoiceProvider(...)`         | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Rozumienie multimediów | `api.registerMediaUnderstandingProvider(...)`    | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie obrazów    | `api.registerImageGenerationProvider(...)`       | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie muzyki     | `api.registerMusicGenerationProvider(...)`       | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie wideo      | `api.registerVideoGenerationProvider(...)`       | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pobieranie z sieci     | `api.registerWebFetchProvider(...)`              | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Wyszukiwanie w sieci   | `api.registerWebSearchProvider(...)`             | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware wyników narzędzi | `api.registerAgentToolResultMiddleware(...)`     | [Omówienie SDK](/pl/plugins/sdk-overview#registration-api)                          |
| Narzędzia agenta       | `api.registerTool(...)`                          | Poniżej                                                                         |
| Polecenia niestandardowe | `api.registerCommand(...)`                       | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                      |
| Haki pluginu           | `api.on(...)`                                    | [Haki pluginu](/pl/plugins/hooks)                                                  |
| Wewnętrzne haki zdarzeń | `api.registerHook(...)`                          | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                      |
| Trasy HTTP             | `api.registerHttpRoute(...)`                     | [Mechanizmy wewnętrzne](/pl/plugins/architecture-internals#gateway-http-routes)    |
| Podpolecenia CLI       | `api.registerCli(...)`                           | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                      |

Pełne API rejestracji znajdziesz w [Omówieniu SDK](/pl/plugins/sdk-overview#registration-api).

Dołączone pluginy mogą używać `api.registerAgentToolResultMiddleware(...)`, gdy
potrzebują asynchronicznego przepisywania wyników narzędzi, zanim model zobaczy dane wyjściowe. Zadeklaruj
docelowe środowiska uruchomieniowe w `contracts.agentToolResultMiddleware`, na przykład
`["pi", "codex"]`. To zaufana granica dla dołączonych pluginów; pluginy zewnętrzne
powinny preferować zwykłe haki pluginów OpenClaw, chyba że OpenClaw rozwinie
jawną politykę zaufania dla tej możliwości.

Jeśli Twój plugin rejestruje niestandardowe metody RPC Gateway, trzymaj je pod
prefiksem specyficznym dla pluginu. Przestrzenie nazw administracji rdzenia (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze są rozwiązywane do
`operator.admin`, nawet jeśli plugin poprosi o węższy zakres.

Semantyka strażników haków, o której warto pamiętać:

- `before_tool_call`: `{ block: true }` jest końcowe i zatrzymuje procedury obsługi o niższym priorytecie.
- `before_tool_call`: `{ block: false }` jest traktowane jako brak decyzji.
- `before_tool_call`: `{ requireApproval: true }` wstrzymuje wykonywanie agenta i prosi użytkownika o zatwierdzenie przez nakładkę zatwierdzeń exec, przyciski Telegram, interakcje Discord lub polecenie `/approve` na dowolnym kanale.
- `before_install`: `{ block: true }` jest końcowe i zatrzymuje procedury obsługi o niższym priorytecie.
- `before_install`: `{ block: false }` jest traktowane jako brak decyzji.
- `message_sending`: `{ cancel: true }` jest końcowe i zatrzymuje procedury obsługi o niższym priorytecie.
- `message_sending`: `{ cancel: false }` jest traktowane jako brak decyzji.
- `message_received`: preferuj typowane pole `threadId`, gdy potrzebujesz routingu przychodzącego wątku/tematu. Zachowaj `metadata` dla dodatków specyficznych dla kanału.
- `message_sending`: preferuj typowane pola routingu `replyToId` / `threadId` zamiast kluczy metadanych specyficznych dla kanału.

Polecenie `/approve` obsługuje zarówno zatwierdzenia exec, jak i pluginów z ograniczonym fallbackiem: gdy identyfikator zatwierdzenia exec nie zostanie znaleziony, OpenClaw ponawia próbę tego samego identyfikatora przez zatwierdzenia pluginów. Przekazywanie zatwierdzeń pluginów można skonfigurować niezależnie przez `approvals.plugin` w konfiguracji.

Jeśli niestandardowa instalacja zatwierdzeń musi wykryć ten sam ograniczony przypadek fallbacku,
preferuj `isApprovalNotFoundError` z `openclaw/plugin-sdk/error-runtime`
zamiast ręcznego dopasowywania ciągów wygaśnięcia zatwierdzeń.

Przykłady i referencję haków znajdziesz w [Hakach pluginu](/pl/plugins/hooks).

## Rejestrowanie narzędzi agenta

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

Każde narzędzie zarejestrowane przez `api.registerTool(...)` musi też być zadeklarowane w
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
więc pluginy nie duplikują `description` ani danych schematu w manifeście. Kontrakt
manifestu deklaruje tylko własność i wykrywanie; wykonanie nadal wywołuje
aktywną implementację zarejestrowanego narzędzia.
Ustaw `toolMetadata.<tool>.optional: true` dla narzędzi zarejestrowanych za pomocą
`api.registerTool(..., { optional: true })`, aby OpenClaw mógł uniknąć ładowania
środowiska uruchomieniowego tego pluginu, dopóki narzędzie nie zostanie jawnie dodane do listy dozwolonych.

Użytkownicy włączają opcjonalne narzędzia w konfiguracji:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Nazwy narzędzi nie mogą kolidować z narzędziami core (konflikty są pomijane)
- Narzędzia z niepoprawnie sformowanymi obiektami rejestracji, w tym bez `parameters`, są pomijane i zgłaszane w diagnostyce pluginu zamiast przerywać uruchomienia agentów
- Użyj `optional: true` dla narzędzi z efektami ubocznymi lub dodatkowymi wymaganiami binarnymi
- Użytkownicy mogą włączyć wszystkie narzędzia z pluginu, dodając identyfikator pluginu do `tools.allow`

## Rejestrowanie poleceń CLI

Pluginy mogą dodawać główne grupy poleceń `openclaw` za pomocą `api.registerCli`. Podaj
`descriptors` dla każdego katalogu głównego polecenia najwyższego poziomu, aby OpenClaw mógł wyświetlać i kierować
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

Pełną dokumentację podścieżek znajdziesz w [Przeglądzie SDK](/pl/plugins/sdk-overview).

W obrębie pluginu używaj lokalnych plików zbiorczych (`api.ts`, `runtime-api.ts`) do
importów wewnętrznych - nigdy nie importuj własnego pluginu przez jego ścieżkę SDK.

W przypadku pluginów dostawców trzymaj pomocniki specyficzne dla dostawcy w tych plikach zbiorczych
katalogu głównego pakietu, chyba że granica jest naprawdę ogólna. Obecne dołączone przykłady:

- Anthropic: opakowania strumienia Claude i pomocniki `service_tier` / beta
- OpenAI: konstruktory dostawców, pomocniki domyślnych modeli, dostawcy realtime
- OpenRouter: konstruktor dostawcy oraz pomocniki onboardingu/konfiguracji

Jeśli pomocnik jest użyteczny tylko wewnątrz jednego dołączonego pakietu dostawcy, trzymaj go na tej
granicy katalogu głównego pakietu zamiast promować go do `openclaw/plugin-sdk/*`.

Niektóre wygenerowane granice pomocnicze `openclaw/plugin-sdk/<bundled-id>` nadal istnieją na potrzeby
utrzymania dołączonych pluginów, gdy mają śledzone użycie właściciela. Traktuj je jako
powierzchnie zastrzeżone, a nie jako domyślny wzorzec dla nowych pluginów zewnętrznych.

## Lista kontrolna przed wysłaniem

<Check>**package.json** ma poprawne metadane `openclaw`</Check>
<Check>Manifest **openclaw.plugin.json** jest obecny i poprawny</Check>
<Check>Punkt wejścia używa `defineChannelPluginEntry` albo `definePluginEntry`</Check>
<Check>Wszystkie importy używają skoncentrowanych ścieżek `plugin-sdk/<subpath>`</Check>
<Check>Importy wewnętrzne używają modułów lokalnych, a nie samoimportów SDK</Check>
<Check>Testy przechodzą (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` przechodzi (pluginy w repozytorium)</Check>

## Testowanie wersji beta

1. Obserwuj tagi wydań GitHub w [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) i subskrybuj przez `Watch` > `Releases`. Tagi beta wyglądają jak `v2026.3.N-beta.1`. Możesz też włączyć powiadomienia dla oficjalnego konta OpenClaw na X [@openclaw](https://x.com/openclaw), aby otrzymywać ogłoszenia o wydaniach.
2. Przetestuj swój plugin względem tagu beta, gdy tylko się pojawi. Okno przed wersją stabilną trwa zwykle tylko kilka godzin.
3. Po testach opublikuj w wątku swojego pluginu na kanale Discord `plugin-forum` komunikat `all good` albo informację, co się zepsuło. Jeśli nie masz jeszcze wątku, utwórz go.
4. Jeśli coś się zepsuje, otwórz lub zaktualizuj issue o tytule `Beta blocker: <plugin-name> - <summary>` i zastosuj etykietę `beta-blocker`. Umieść link do issue w swoim wątku.
5. Otwórz PR do `main` o tytule `fix(<plugin-id>): beta blocker - <summary>` i połącz issue zarówno w PR, jak i w swoim wątku Discord. Współtwórcy nie mogą etykietować PR-ów, więc tytuł jest sygnałem po stronie PR dla opiekunów i automatyzacji. Blokery z PR zostają scalone; blokery bez PR mogą mimo to zostać wydane. Opiekunowie obserwują te wątki podczas testowania wersji beta.
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
    Mapa importów i dokumentacja API rejestracji
  </Card>
  <Card title="Pomocniki środowiska uruchomieniowego" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, wyszukiwanie, subagent przez api.runtime
  </Card>
  <Card title="Testowanie" icon="test-tubes" href="/pl/plugins/sdk-testing">
    Narzędzia i wzorce testowe
  </Card>
  <Card title="Manifest Plugin" icon="file-json" href="/pl/plugins/manifest">
    Pełna dokumentacja schematu manifestu
  </Card>
</CardGroup>

## Powiązane

- [Architektura pluginów](/pl/plugins/architecture) - dogłębny opis architektury wewnętrznej
- [Przegląd SDK](/pl/plugins/sdk-overview) - dokumentacja Plugin SDK
- [Manifest](/pl/plugins/manifest) - format manifestu pluginu
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) - tworzenie pluginów kanałów
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) - tworzenie pluginów dostawców
