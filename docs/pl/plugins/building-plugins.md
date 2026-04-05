---
read_when:
    - Chcesz utworzyć nową wtyczkę OpenClaw
    - Potrzebujesz szybkiego startu do tworzenia wtyczek
    - Dodajesz nowy kanał, providera, narzędzie lub inną funkcję do OpenClaw
sidebarTitle: Getting Started
summary: Utwórz swoją pierwszą wtyczkę OpenClaw w kilka minut
title: Tworzenie wtyczek
x-i18n:
    generated_at: "2026-04-05T14:01:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26e780d3f04270b79d1d8f8076d6c3c5031915043e78fb8174be921c6bdd60c9
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Tworzenie wtyczek

Wtyczki rozszerzają OpenClaw o nowe możliwości: kanały, providerów modeli,
mowę, transkrypcję w czasie rzeczywistym, głos w czasie rzeczywistym, rozumienie mediów, generowanie obrazów,
generowanie wideo, pobieranie treści z internetu, wyszukiwanie w internecie, narzędzia agenta lub
dowolną kombinację tych elementów.

Nie musisz dodawać swojej wtyczki do repozytorium OpenClaw. Opublikuj ją w
[ClawHub](/tools/clawhub) lub npm, a użytkownicy zainstalują ją za pomocą
`openclaw plugins install <package-name>`. OpenClaw najpierw próbuje użyć ClawHub,
a następnie automatycznie przechodzi do npm.

## Wymagania wstępne

- Node >= 22 i menedżer pakietów (npm lub pnpm)
- Znajomość TypeScript (ESM)
- Dla wtyczek w repozytorium: sklonowane repozytorium i wykonane `pnpm install`

## Jaki rodzaj wtyczki?

<CardGroup cols={3}>
  <Card title="Wtyczka kanału" icon="messages-square" href="/plugins/sdk-channel-plugins">
    Połącz OpenClaw z platformą komunikacyjną (Discord, IRC itp.)
  </Card>
  <Card title="Wtyczka providera" icon="cpu" href="/plugins/sdk-provider-plugins">
    Dodaj providera modeli (LLM, proxy lub niestandardowy endpoint)
  </Card>
  <Card title="Wtyczka narzędzia / hooka" icon="wrench">
    Rejestruj narzędzia agenta, hooki zdarzeń lub usługi — czytaj dalej poniżej
  </Card>
</CardGroup>

Jeśli wtyczka kanału jest opcjonalna i może nie być zainstalowana podczas uruchamiania onboardingu/konfiguracji,
użyj `createOptionalChannelSetupSurface(...)` z
`openclaw/plugin-sdk/channel-setup`. Tworzy ona parę adaptera konfiguracji i kreatora,
która informuje o wymaganiu instalacji i bezpiecznie blokuje rzeczywiste zapisy konfiguracji,
dopóki wtyczka nie zostanie zainstalowana.

## Szybki start: wtyczka narzędzia

Ten przewodnik tworzy minimalną wtyczkę, która rejestruje narzędzie agenta. Wtyczki kanałów
i providerów mają osobne przewodniki, do których prowadzą linki powyżej.

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

    Każda wtyczka potrzebuje manifestu, nawet jeśli nie ma konfiguracji. Zobacz
    [Manifest](/plugins/manifest), aby poznać pełny schemat. Kanoniczne fragmenty publikowania do ClawHub
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

    `definePluginEntry` służy do wtyczek innych niż kanały. Dla kanałów użyj
    `defineChannelPluginEntry` — zobacz [Wtyczki kanałów](/plugins/sdk-channel-plugins).
    Pełne opcje punktów wejścia znajdziesz w [Punktach wejścia](/plugins/sdk-entrypoints).

  </Step>

  <Step title="Przetestuj i opublikuj">

    **Wtyczki zewnętrzne:** zweryfikuj i opublikuj za pomocą ClawHub, a następnie zainstaluj:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw sprawdza też ClawHub przed npm dla zwykłych specyfikacji pakietów, takich jak
    `@myorg/openclaw-my-plugin`.

    **Wtyczki w repozytorium:** umieść je w drzewie workspace wtyczek dołączonych do projektu — zostaną wykryte automatycznie.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Możliwości wtyczek

Pojedyncza wtyczka może zarejestrować dowolną liczbę możliwości za pomocą obiektu `api`:

| Możliwość             | Metoda rejestracji                              | Szczegółowy przewodnik                                                            |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inferencja tekstu (LLM)   | `api.registerProvider(...)`                      | [Wtyczki providerów](/plugins/sdk-provider-plugins)                               |
| Backend inferencji CLI  | `api.registerCliBackend(...)`                    | [Backendy CLI](/pl/gateway/cli-backends)                                           |
| Kanał / komunikacja    | `api.registerChannel(...)`                       | [Wtyczki kanałów](/plugins/sdk-channel-plugins)                                 |
| Mowa (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Wtyczki providerów](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transkrypcja w czasie rzeczywistym | `api.registerRealtimeTranscriptionProvider(...)` | [Wtyczki providerów](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Głos w czasie rzeczywistym         | `api.registerRealtimeVoiceProvider(...)`         | [Wtyczki providerów](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Rozumienie mediów    | `api.registerMediaUnderstandingProvider(...)`    | [Wtyczki providerów](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie obrazów       | `api.registerImageGenerationProvider(...)`       | [Wtyczki providerów](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie wideo       | `api.registerVideoGenerationProvider(...)`       | [Wtyczki providerów](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pobieranie treści z internetu              | `api.registerWebFetchProvider(...)`              | [Wtyczki providerów](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Wyszukiwanie w internecie             | `api.registerWebSearchProvider(...)`             | [Wtyczki providerów](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Narzędzia agenta            | `api.registerTool(...)`                          | Poniżej                                                                           |
| Polecenia niestandardowe        | `api.registerCommand(...)`                       | [Punkty wejścia](/plugins/sdk-entrypoints)                                        |
| Hooki zdarzeń            | `api.registerHook(...)`                          | [Punkty wejścia](/plugins/sdk-entrypoints)                                        |
| Trasy HTTP            | `api.registerHttpRoute(...)`                     | [Elementy wewnętrzne](/plugins/architecture#gateway-http-routes)                          |
| Podpolecenia CLI        | `api.registerCli(...)`                           | [Punkty wejścia](/plugins/sdk-entrypoints)                                        |

Pełne API rejestracji znajdziesz w [Przeglądzie SDK](/plugins/sdk-overview#registration-api).

Jeśli Twoja wtyczka rejestruje niestandardowe metody gateway RPC, zachowaj dla nich
prefiks specyficzny dla wtyczki. Podstawowe przestrzenie nazw administracyjnych (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze są rozwiązywane do
`operator.admin`, nawet jeśli wtyczka prosi o węższy zakres.

Semantyka ochrony hooków, o której warto pamiętać:

- `before_tool_call`: `{ block: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `before_tool_call`: `{ block: false }` jest traktowane jak brak decyzji.
- `before_tool_call`: `{ requireApproval: true }` wstrzymuje wykonanie agenta i prosi użytkownika o zatwierdzenie przez nakładkę zatwierdzania wykonania, przyciski Telegram, interakcje Discord lub polecenie `/approve` na dowolnym kanale.
- `before_install`: `{ block: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `before_install`: `{ block: false }` jest traktowane jak brak decyzji.
- `message_sending`: `{ cancel: true }` jest terminalne i zatrzymuje handlery o niższym priorytecie.
- `message_sending`: `{ cancel: false }` jest traktowane jak brak decyzji.

Polecenie `/approve` obsługuje zarówno zatwierdzenia wykonania, jak i zatwierdzenia wtyczek z ograniczonym fallbackiem: gdy identyfikator zatwierdzenia wykonania nie zostanie znaleziony, OpenClaw ponawia próbę z tym samym identyfikatorem w zatwierdzeniach wtyczek. Przekazywanie zatwierdzeń wtyczek można konfigurować niezależnie przez `approvals.plugin` w konfiguracji.

Jeśli niestandardowa logika zatwierdzania musi wykrywać ten sam przypadek ograniczonego fallbacku,
użyj `isApprovalNotFoundError` z `openclaw/plugin-sdk/error-runtime`
zamiast ręcznie dopasowywać ciągi dotyczące wygaśnięcia zatwierdzenia.

Szczegóły znajdziesz w sekcji [Semantyka decyzji hooków w przeglądzie SDK](/plugins/sdk-overview#hook-decision-semantics).

## Rejestrowanie narzędzi agenta

Narzędzia to typowane funkcje, które może wywołać LLM. Mogą być wymagane (zawsze
dostępne) albo opcjonalne (wymagają zgody użytkownika):

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

- Nazwy narzędzi nie mogą kolidować z podstawowymi narzędziami (konflikty są pomijane)
- Użyj `optional: true` dla narzędzi z efektami ubocznymi lub dodatkowymi wymaganiami binarnymi
- Użytkownicy mogą włączyć wszystkie narzędzia z wtyczki, dodając identyfikator wtyczki do `tools.allow`

## Konwencje importu

Zawsze importuj z ukierunkowanych ścieżek `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Pełne odniesienie do ścieżek podrzędnych znajdziesz w [Przeglądzie SDK](/plugins/sdk-overview).

W obrębie swojej wtyczki używaj lokalnych plików barrel (`api.ts`, `runtime-api.ts`) do
importów wewnętrznych — nigdy nie importuj własnej wtyczki przez jej ścieżkę SDK.

W przypadku wtyczek providerów trzymaj helpery specyficzne dla providera w tych barrelach
w katalogu głównym pakietu, chyba że dany interfejs jest naprawdę ogólny. Obecne przykłady dołączone do projektu:

- Anthropic: wrappery strumieni Claude oraz helpery `service_tier` / beta
- OpenAI: kreatory providerów, helpery modeli domyślnych, providery realtime
- OpenRouter: kreator providera oraz helpery onboardingu/konfiguracji

Jeśli helper jest przydatny tylko wewnątrz jednego dołączonego pakietu providera, pozostaw go na tym
interfejsie w katalogu głównym pakietu zamiast przenosić go do `openclaw/plugin-sdk/*`.

Niektóre generowane interfejsy helperów `openclaw/plugin-sdk/<bundled-id>` nadal istnieją do
utrzymania dołączonych wtyczek i zgodności, na przykład
`plugin-sdk/feishu-setup` lub `plugin-sdk/zalo-setup`. Traktuj je jako powierzchnie
zarezerwowane, a nie jako domyślny wzorzec dla nowych wtyczek zewnętrznych.

## Lista kontrolna przed zgłoszeniem

<Check>**package.json** ma poprawne metadane `openclaw`</Check>
<Check>Manifest **openclaw.plugin.json** jest obecny i prawidłowy</Check>
<Check>Punkt wejścia używa `defineChannelPluginEntry` lub `definePluginEntry`</Check>
<Check>Wszystkie importy używają ukierunkowanych ścieżek `plugin-sdk/<subpath>`</Check>
<Check>Importy wewnętrzne używają lokalnych modułów, a nie samoodwołań przez SDK</Check>
<Check>Testy przechodzą (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` przechodzi (dla wtyczek w repozytorium)</Check>

## Testowanie wydań beta

1. Obserwuj tagi wydań GitHub w [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) i subskrybuj przez `Watch` > `Releases`. Tagi beta mają postać `v2026.3.N-beta.1`. Możesz też włączyć powiadomienia dla oficjalnego konta OpenClaw na X [@openclaw](https://x.com/openclaw), aby otrzymywać informacje o wydaniach.
2. Przetestuj swoją wtyczkę z tagiem beta, gdy tylko się pojawi. Okno przed wydaniem stabilnym zwykle trwa tylko kilka godzin.
3. Po testach napisz w wątku swojej wtyczki na kanale Discord `plugin-forum`, wpisując `all good` albo opisując, co się zepsuło. Jeśli nie masz jeszcze wątku, utwórz go.
4. Jeśli coś się zepsuje, otwórz lub zaktualizuj issue o tytule `Beta blocker: <plugin-name> - <summary>` i nadaj mu etykietę `beta-blocker`. Umieść link do issue w swoim wątku.
5. Otwórz PR do `main` o tytule `fix(<plugin-id>): beta blocker - <summary>` i dodaj link do issue zarówno w PR, jak i w swoim wątku na Discordzie. Współtwórcy nie mogą nadawać etykiet PR-om, więc tytuł jest sygnałem po stronie PR dla maintainerów i automatyzacji. Blokery z PR są scalane; blokery bez PR mogą mimo to zostać wydane. Maintainerzy obserwują te wątki podczas testów beta.
6. Cisza oznacza zielone światło. Jeśli przegapisz okno, poprawka najpewniej trafi do następnego cyklu.

## Następne kroki

<CardGroup cols={2}>
  <Card title="Wtyczki kanałów" icon="messages-square" href="/plugins/sdk-channel-plugins">
    Zbuduj wtyczkę kanału komunikacyjnego
  </Card>
  <Card title="Wtyczki providerów" icon="cpu" href="/plugins/sdk-provider-plugins">
    Zbuduj wtyczkę providera modeli
  </Card>
  <Card title="Przegląd SDK" icon="book-open" href="/plugins/sdk-overview">
    Mapa importów i dokumentacja API rejestracji
  </Card>
  <Card title="Helpery runtime" icon="settings" href="/plugins/sdk-runtime">
    TTS, wyszukiwanie, subagent przez api.runtime
  </Card>
  <Card title="Testowanie" icon="test-tubes" href="/plugins/sdk-testing">
    Narzędzia i wzorce testowe
  </Card>
  <Card title="Manifest wtyczki" icon="file-json" href="/plugins/manifest">
    Pełna dokumentacja schematu manifestu
  </Card>
</CardGroup>

## Powiązane

- [Architektura wtyczek](/plugins/architecture) — szczegółowe omówienie architektury wewnętrznej
- [Przegląd SDK](/plugins/sdk-overview) — dokumentacja Plugin SDK
- [Manifest](/plugins/manifest) — format manifestu wtyczki
- [Wtyczki kanałów](/plugins/sdk-channel-plugins) — tworzenie wtyczek kanałów
- [Wtyczki providerów](/plugins/sdk-provider-plugins) — tworzenie wtyczek providerów
