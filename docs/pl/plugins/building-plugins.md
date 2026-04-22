---
read_when:
    - Chcesz utworzyć nowy Plugin OpenClaw
    - Potrzebujesz przewodnika szybkiego startu do tworzenia Pluginów
    - Dodajesz nowy kanał, dostawcę, narzędzie lub inną funkcję do OpenClaw
sidebarTitle: Getting Started
summary: Stwórz swój pierwszy Plugin OpenClaw w kilka minut
title: Tworzenie Pluginów
x-i18n:
    generated_at: "2026-04-22T09:51:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 67368be311537f984f14bea9239b88c3eccf72a76c9dd1347bb041e02697ae24
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Tworzenie Pluginów

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, dostawców modeli,
mowę, transkrypcję w czasie rzeczywistym, głos w czasie rzeczywistym, rozumienie mediów, generowanie obrazów, generowanie wideo, pobieranie treści z sieci, wyszukiwanie w sieci, narzędzia agentów lub dowolną
kombinację tych funkcji.

Nie musisz dodawać swojego Pluginu do repozytorium OpenClaw. Opublikuj go w
[ClawHub](/pl/tools/clawhub) lub w npm, a użytkownicy zainstalują go za pomocą
`openclaw plugins install <package-name>`. OpenClaw najpierw próbuje użyć ClawHub,
a następnie automatycznie przechodzi do npm.

## Wymagania wstępne

- Node >= 22 i menedżer pakietów (npm lub pnpm)
- Znajomość TypeScript (ESM)
- Dla Pluginów w repozytorium: sklonowane repozytorium i wykonane `pnpm install`

## Jaki rodzaj Pluginu?

<CardGroup cols={3}>
  <Card title="Plugin kanału" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Połącz OpenClaw z platformą komunikacyjną (Discord, IRC itp.)
  </Card>
  <Card title="Plugin dostawcy" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Dodaj dostawcę modeli (LLM, proxy lub własny endpoint)
  </Card>
  <Card title="Plugin narzędzia / hooka" icon="wrench">
    Zarejestruj narzędzia agentów, hooki zdarzeń lub usługi — przejdź dalej poniżej
  </Card>
</CardGroup>

Jeśli Plugin kanału jest opcjonalny i może nie być zainstalowany, gdy działa
wdrażanie/konfiguracja, użyj `createOptionalChannelSetupSurface(...)` z
`openclaw/plugin-sdk/channel-setup`. Tworzy on parę adaptera konfiguracji i kreatora,
która informuje o wymaganiu instalacji i bezpiecznie blokuje rzeczywiste zapisy konfiguracji,
dopóki Plugin nie zostanie zainstalowany.

## Szybki start: Plugin narzędzia

Ten przewodnik tworzy minimalny Plugin, który rejestruje narzędzie agenta. Pluginy kanałów
i dostawców mają osobne przewodniki, do których prowadzą linki powyżej.

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
      "description": "Dodaje własne narzędzie do OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Każdy Plugin potrzebuje manifestu, nawet bez konfiguracji. Zobacz
    [Manifest](/pl/plugins/manifest), aby poznać pełny schemat. Kanoniczne fragmenty publikacji w ClawHub
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

    `definePluginEntry` służy do Pluginów niebędących kanałami. Dla kanałów użyj
    `defineChannelPluginEntry` — zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins).
    Aby poznać pełne opcje punktu wejścia, zobacz [Punkty wejścia](/pl/plugins/sdk-entrypoints).

  </Step>

  <Step title="Przetestuj i opublikuj">

    **Zewnętrzne Pluginy:** zweryfikuj i opublikuj w ClawHub, a następnie zainstaluj:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw sprawdza też ClawHub przed npm dla prostych specyfikacji pakietów, takich jak
    `@myorg/openclaw-my-plugin`.

    **Pluginy w repozytorium:** umieść je w drzewie workspace z dołączonymi Pluginami — zostaną wykryte automatycznie.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Możliwości Pluginu

Jeden Plugin może zarejestrować dowolną liczbę możliwości za pośrednictwem obiektu `api`:

| Możliwość             | Metoda rejestracji                              | Szczegółowy przewodnik                                                         |
| --------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| Wnioskowanie tekstowe (LLM) | `api.registerProvider(...)`                | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins)                             |
| Backend wnioskowania CLI    | `api.registerCliBackend(...)`              | [Backendy CLI](/pl/gateway/cli-backends)                                          |
| Kanał / komunikacja         | `api.registerChannel(...)`                 | [Pluginy kanałów](/pl/plugins/sdk-channel-plugins)                                |
| Mowa (TTS/STT)              | `api.registerSpeechProvider(...)`          | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transkrypcja w czasie rzeczywistym | `api.registerRealtimeTranscriptionProvider(...)` | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Głos w czasie rzeczywistym  | `api.registerRealtimeVoiceProvider(...)`   | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Rozumienie mediów           | `api.registerMediaUnderstandingProvider(...)` | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie obrazów         | `api.registerImageGenerationProvider(...)` | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie muzyki          | `api.registerMusicGenerationProvider(...)` | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie wideo           | `api.registerVideoGenerationProvider(...)` | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pobieranie treści z sieci   | `api.registerWebFetchProvider(...)`        | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Wyszukiwanie w sieci        | `api.registerWebSearchProvider(...)`       | [Pluginy dostawców](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Osadzane rozszerzenie Pi    | `api.registerEmbeddedExtensionFactory(...)`| [Omówienie SDK](/pl/plugins/sdk-overview#registration-api)                        |
| Narzędzia agentów           | `api.registerTool(...)`                    | Poniżej                                                                        |
| Własne polecenia            | `api.registerCommand(...)`                 | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                     |
| Hooki zdarzeń               | `api.registerHook(...)`                    | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                     |
| Trasy HTTP                  | `api.registerHttpRoute(...)`               | [Wewnętrzne elementy](/pl/plugins/architecture#gateway-http-routes)               |
| Podpolecenia CLI            | `api.registerCli(...)`                     | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                     |

Pełny interfejs API rejestracji znajdziesz w [Omówieniu SDK](/pl/plugins/sdk-overview#registration-api).

Użyj `api.registerEmbeddedExtensionFactory(...)`, gdy Plugin potrzebuje natywnych dla Pi
hooków osadzonego runnera, takich jak asynchroniczne przepisywanie `tool_result`
przed wysłaniem końcowej wiadomości z wynikiem narzędzia. Preferuj zwykłe hooki Pluginów OpenClaw,
gdy dana praca nie wymaga momentu wykonania rozszerzenia Pi.

Jeśli Twój Plugin rejestruje własne metody Gateway RPC, trzymaj je pod prefiksem
specyficznym dla Pluginu. Przestrzenie nazw administracyjnych rdzenia (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze są rozwiązywane do
`operator.admin`, nawet jeśli Plugin prosi o węższy zakres.

Semantyka strażników hooków, o której warto pamiętać:

- `before_tool_call`: `{ block: true }` jest końcowe i zatrzymuje handlery o niższym priorytecie.
- `before_tool_call`: `{ block: false }` jest traktowane jako brak decyzji.
- `before_tool_call`: `{ requireApproval: true }` wstrzymuje wykonanie agenta i prosi użytkownika o zatwierdzenie przez nakładkę zatwierdzania wykonania, przyciski Telegram, interakcje Discord lub polecenie `/approve` na dowolnym kanale.
- `before_install`: `{ block: true }` jest końcowe i zatrzymuje handlery o niższym priorytecie.
- `before_install`: `{ block: false }` jest traktowane jako brak decyzji.
- `message_sending`: `{ cancel: true }` jest końcowe i zatrzymuje handlery o niższym priorytecie.
- `message_sending`: `{ cancel: false }` jest traktowane jako brak decyzji.

Polecenie `/approve` obsługuje zarówno zatwierdzenia wykonania, jak i Pluginów, z ograniczonym mechanizmem awaryjnym: gdy nie można znaleźć identyfikatora zatwierdzenia wykonania, OpenClaw ponawia próbę z tym samym identyfikatorem przez zatwierdzenia Pluginów. Przekazywanie zatwierdzeń Pluginów można konfigurować niezależnie przez `approvals.plugin` w konfiguracji.

Jeśli własna logika zatwierdzania musi wykrywać ten sam ograniczony przypadek awaryjny,
użyj `isApprovalNotFoundError` z `openclaw/plugin-sdk/error-runtime`
zamiast ręcznie dopasowywać ciągi wygaśnięcia zatwierdzeń.

Szczegóły znajdziesz w sekcji [Semantyka decyzji hooków w omówieniu SDK](/pl/plugins/sdk-overview#hook-decision-semantics).

## Rejestrowanie narzędzi agentów

Narzędzia to typowane funkcje, które LLM może wywoływać. Mogą być wymagane (zawsze
dostępne) lub opcjonalne (wymagają zgody użytkownika):

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
- Użyj `optional: true` dla narzędzi z efektami ubocznymi lub dodatkowymi wymaganiami binarnymi
- Użytkownicy mogą włączyć wszystkie narzędzia z Pluginu, dodając identyfikator Pluginu do `tools.allow`

## Konwencje importu

Zawsze importuj z ukierunkowanych ścieżek `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Pełne odniesienie do podścieżek znajdziesz w [Omówieniu SDK](/pl/plugins/sdk-overview).

W obrębie swojego Pluginu używaj lokalnych plików barrel (`api.ts`, `runtime-api.ts`) do
importów wewnętrznych — nigdy nie importuj własnego Pluginu przez jego ścieżkę SDK.

W przypadku Pluginów dostawców trzymaj pomocnicze elementy specyficzne dla dostawcy w tych
barrelach katalogu głównego pakietu, chyba że dany interfejs jest rzeczywiście ogólny. Obecne przykłady dołączone:

- Anthropic: wrappery strumieni Claude oraz helpery `service_tier` / beta
- OpenAI: konstruktory dostawców, helpery domyślnych modeli, dostawcy czasu rzeczywistego
- OpenRouter: konstruktor dostawcy oraz helpery wdrażania/konfiguracji

Jeśli helper jest przydatny tylko wewnątrz jednego pakietu dołączonego dostawcy, pozostaw go na tym
interfejsie katalogu głównego pakietu zamiast promować go do `openclaw/plugin-sdk/*`.

Niektóre wygenerowane interfejsy pomocnicze `openclaw/plugin-sdk/<bundled-id>` nadal istnieją
na potrzeby utrzymania zgodności i obsługi dołączonych Pluginów, na przykład
`plugin-sdk/feishu-setup` lub `plugin-sdk/zalo-setup`. Traktuj je jako zarezerwowane
powierzchnie, a nie jako domyślny wzorzec dla nowych zewnętrznych Pluginów.

## Lista kontrolna przed wysłaniem

<Check>**package.json** ma poprawne metadane `openclaw`</Check>
<Check>Manifest **openclaw.plugin.json** jest obecny i prawidłowy</Check>
<Check>Punkt wejścia używa `defineChannelPluginEntry` lub `definePluginEntry`</Check>
<Check>Wszystkie importy używają ukierunkowanych ścieżek `plugin-sdk/<subpath>`</Check>
<Check>Importy wewnętrzne używają lokalnych modułów, a nie samoimportów przez SDK</Check>
<Check>Testy przechodzą (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` przechodzi (Pluginy w repozytorium)</Check>

## Testowanie wydań beta

1. Obserwuj tagi wydań GitHub w [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) i zasubskrybuj je przez `Watch` > `Releases`. Tagi beta wyglądają jak `v2026.3.N-beta.1`. Możesz też włączyć powiadomienia dla oficjalnego konta OpenClaw na X [@openclaw](https://x.com/openclaw), aby otrzymywać ogłoszenia o wydaniach.
2. Przetestuj swój Plugin z tagiem beta, gdy tylko się pojawi. Okno przed wydaniem stabilnym zwykle trwa tylko kilka godzin.
3. Po testach opublikuj w wątku swojego Pluginu na kanale Discord `plugin-forum` informację `all good` albo opisz, co się zepsuło. Jeśli nie masz jeszcze wątku, utwórz go.
4. Jeśli coś się zepsuje, otwórz lub zaktualizuj zgłoszenie zatytułowane `Beta blocker: <plugin-name> - <summary>` i dodaj etykietę `beta-blocker`. Umieść link do zgłoszenia w swoim wątku.
5. Otwórz PR do `main` zatytułowany `fix(<plugin-id>): beta blocker - <summary>` i dodaj link do zgłoszenia zarówno w PR, jak i w swoim wątku na Discordzie. Współtwórcy nie mogą nadawać etykiet PR-om, więc tytuł jest sygnałem po stronie PR dla maintainerów i automatyzacji. Blokery z PR są scalane; blokery bez PR mogą mimo to zostać wydane. Maintainerzy obserwują te wątki podczas testów beta.
6. Brak wiadomości oznacza zielone światło. Jeśli przegapisz okno, Twoja poprawka prawdopodobnie trafi do następnego cyklu.

## Następne kroki

<CardGroup cols={2}>
  <Card title="Pluginy kanałów" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Zbuduj Plugin kanału komunikacyjnego
  </Card>
  <Card title="Pluginy dostawców" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Zbuduj Plugin dostawcy modeli
  </Card>
  <Card title="Omówienie SDK" icon="book-open" href="/pl/plugins/sdk-overview">
    Mapa importów i dokumentacja interfejsu API rejestracji
  </Card>
  <Card title="Pomocniki środowiska uruchomieniowego" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, wyszukiwanie, subagent przez api.runtime
  </Card>
  <Card title="Testowanie" icon="test-tubes" href="/pl/plugins/sdk-testing">
    Narzędzia i wzorce testowe
  </Card>
  <Card title="Manifest Pluginu" icon="file-json" href="/pl/plugins/manifest">
    Pełna dokumentacja schematu manifestu
  </Card>
</CardGroup>

## Powiązane

- [Architektura Pluginów](/pl/plugins/architecture) — szczegółowe omówienie architektury wewnętrznej
- [Omówienie SDK](/pl/plugins/sdk-overview) — dokumentacja SDK Pluginów
- [Manifest](/pl/plugins/manifest) — format manifestu Pluginu
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — tworzenie Pluginów kanałów
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) — tworzenie Pluginów dostawców
