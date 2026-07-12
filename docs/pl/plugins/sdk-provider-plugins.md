---
read_when:
    - Tworzysz nowy plugin dostawcy modelu
    - Chcesz dodać do OpenClaw proxy zgodne z OpenAI lub niestandardowy model LLM
    - Musisz rozumieć uwierzytelnianie dostawców, katalogi i punkty zaczepienia środowiska wykonawczego
sidebarTitle: Provider plugins
summary: Przewodnik krok po kroku dotyczący tworzenia Pluginu dostawcy modeli dla OpenClaw
title: Tworzenie Pluginów dostawców
x-i18n:
    generated_at: "2026-07-12T15:29:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ebbe59b4487a93c6fec3624251eff7394197e249bb8fc7899f1fc88162510d1c
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Zbuduj Plugin dostawcy, aby dodać dostawcę modeli (LLM) do OpenClaw: katalog
modeli, uwierzytelnianie kluczem API i dynamiczne rozpoznawanie modeli.

<Info>
  Nie znasz jeszcze pluginów OpenClaw? Najpierw przeczytaj [Pierwsze kroki](/pl/plugins/building-plugins),
  aby poznać strukturę pakietu i konfigurację manifestu.
</Info>

<Tip>
  Pluginy dostawców dodają modele do standardowej pętli wnioskowania OpenClaw. Jeśli
  model musi działać za pośrednictwem natywnego demona agenta, który zarządza wątkami, Compaction
  lub zdarzeniami narzędzi, połącz dostawcę z [uprzężą
  agenta](/pl/plugins/sdk-agent-harness), zamiast umieszczać szczegóły protokołu demona
  w rdzeniu.
</Tip>

## Instrukcja

<Steps>
  <Step title="Pakiet i manifest">
    ### Krok 1: Pakiet i manifest

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-ai",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "providers": ["acme-ai"],
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
      "id": "acme-ai",
      "name": "Acme AI",
      "description": "Dostawca modeli Acme AI",
      "providers": ["acme-ai"],
      "modelSupport": {
        "modelPrefixes": ["acme-"]
      },
      "setup": {
        "providers": [
          {
            "id": "acme-ai",
            "envVars": ["ACME_AI_API_KEY"]
          }
        ]
      },
      "providerAuthAliases": {
        "acme-ai-coding": "acme-ai"
      },
      "providerAuthChoices": [
        {
          "provider": "acme-ai",
          "method": "api-key",
          "choiceId": "acme-ai-api-key",
          "choiceLabel": "Klucz API Acme AI",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Klucz API Acme AI"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    `setup.providers[].envVars` umożliwia OpenClaw wykrywanie danych uwierzytelniających bez
    ładowania środowiska uruchomieniowego pluginu. Dodaj `providerAuthAliases`, gdy wariant dostawcy
    powinien ponownie używać uwierzytelniania identyfikatora innego dostawcy. `modelSupport` jest
    opcjonalne i umożliwia OpenClaw automatyczne ładowanie pluginu dostawcy na podstawie skróconych
    identyfikatorów modeli, takich jak `acme-large`, zanim będą dostępne haki środowiska uruchomieniowego. Pola `openclaw.compat`
    i `openclaw.build` w pliku `package.json` są wymagane do publikowania w ClawHub
    (`openclaw.compat.pluginApi` i `openclaw.build.openclawVersion`
    to dwa wymagane pola; w przypadku pominięcia `minGatewayVersion` używana jest wartość
    `openclaw.install.minHostVersion`).

  </Step>

  <Step title="Zarejestruj dostawcę">
    Minimalny dostawca tekstowy wymaga pól `id`, `label`, `auth` i `catalog`.
    `catalog` jest należącym do dostawcy hakiem środowiska uruchomieniowego/konfiguracji; może wywoływać działające
    interfejsy API dostawcy i zwraca wpisy `models.providers`.

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          docsPath: "/providers/acme-ai",
          envVars: ["ACME_AI_API_KEY"],

          auth: [
            createProviderApiKeyAuthMethod({
              providerId: "acme-ai",
              methodId: "api-key",
              label: "Acme AI API key",
              hint: "API key from your Acme AI dashboard",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Enter your Acme AI API key",
              defaultModel: "acme-ai/acme-large",
            }),
          ],

          catalog: {
            order: "simple",
            run: async (ctx) => {
              const apiKey =
                ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: {
                  baseUrl: "https://api.acme-ai.com/v1",
                  apiKey,
                  api: "openai-completions",
                  models: [
                    {
                      id: "acme-large",
                      name: "Acme Large",
                      reasoning: true,
                      input: ["text", "image"],
                      cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
                      contextWindow: 200000,
                      maxTokens: 32768,
                    },
                    {
                      id: "acme-small",
                      name: "Acme Small",
                      reasoning: false,
                      input: ["text"],
                      cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
                      contextWindow: 128000,
                      maxTokens: 8192,
                    },
                  ],
                },
              };
            },
          },
        });

        api.registerModelCatalogProvider({
          provider: "acme-ai",
          kinds: ["text"],
          liveCatalog: async (ctx) => {
            const apiKey = ctx.resolveProviderApiKey("acme-ai").apiKey;
            if (!apiKey) return null;
            return [
              {
                kind: "text",
                provider: "acme-ai",
                model: "acme-large",
                label: "Acme Large",
                source: "live",
              },
            ];
          },
        });
      },
    });
    ```

    `registerModelCatalogProvider` to nowszy interfejs katalogu płaszczyzny sterowania
    dla list, pomocy i interfejsu wyboru, obejmujący wiersze `text`, `voice`, `image_generation`,
    `video_generation` i `music_generation`. Wywołania punktów końcowych dostawcy
    i mapowanie odpowiedzi pozostaw w pluginie; OpenClaw odpowiada za wspólny kształt wierszy,
    etykiety źródeł i renderowanie pomocy.

    To jest działający dostawca. Użytkownicy mogą teraz uruchomić
    `openclaw onboard --acme-ai-api-key <key>` i wybrać
    `acme-ai/acme-large` jako swój model.

    ### Wykrywanie modeli na żywo

    Jeśli dostawca udostępnia interfejs API w stylu `/models`, zachowaj specyficzny dla dostawcy
    punkt końcowy i projekcję wierszy w pluginie, a do wspólnego cyklu pobierania
    użyj `openclaw/plugin-sdk/provider-catalog-live-runtime`. Ten pomocnik zapewnia chronione
    żądania HTTP, nagłówki uwierzytelniania dostawcy, ustrukturyzowane błędy HTTP,
    buforowanie TTL i statyczne zachowanie awaryjne bez
    umieszczania polityki dostawcy w rdzeniu OpenClaw.

    Użyj `buildLiveModelProviderConfig`, gdy aktywny interfejs API informuje tylko, które
    należące do dostawcy wiersze katalogu statycznego są obecnie dostępne:

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      buildLiveModelProviderConfig,
      type LiveModelCatalogFetchGuard,
    } from "openclaw/plugin-sdk/provider-catalog-live-runtime";

    const STATIC_MODELS = [
      {
        id: "acme-large",
        name: "Acme Large",
        reasoning: true,
        input: ["text", "image"],
        cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
        contextWindow: 200000,
        maxTokens: 32768,
      },
      {
        id: "acme-small",
        name: "Acme Small",
        reasoning: false,
        input: ["text"],
        cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
        contextWindow: 128000,
        maxTokens: 8192,
      },
    ] as const;

    async function buildAcmeLiveProvider(params: {
      apiKey: string;
      discoveryApiKey?: string;
      fetchGuard?: LiveModelCatalogFetchGuard;
    }) {
      return await buildLiveModelProviderConfig({
        providerId: "acme-ai",
        endpoint: "https://api.acme-ai.com/v1/models",
        providerConfig: {
          baseUrl: "https://api.acme-ai.com/v1",
          api: "openai-completions",
        },
        models: STATIC_MODELS,
        apiKey: params.apiKey,
        discoveryApiKey: params.discoveryApiKey,
        fetchGuard: params.fetchGuard,
        ttlMs: 60_000,
        auditContext: "acme-ai-model-discovery",
      });
    }

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          catalog: {
            order: "simple",
            run: async (ctx) => {
              const auth = ctx.resolveProviderAuth("acme-ai");
              const apiKey =
                auth.apiKey ?? ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: await buildAcmeLiveProvider({
                  apiKey,
                  discoveryApiKey: auth.discoveryApiKey,
                }),
              };
            },
          },
          staticCatalog: {
            order: "simple",
            run: async () => ({
              provider: {
                baseUrl: "https://api.acme-ai.com/v1",
                api: "openai-completions",
                models: [...STATIC_MODELS],
              },
            }),
          },
        });
      },
    });
    ```

    Użyj `getCachedLiveProviderModelRows`, gdy interfejs API dostawcy zwraca bogatsze
    metadane, a plugin musi samodzielnie przekształcać wiersze w definicje modeli
    OpenClaw:

    ```typescript index.ts
    import {
      getCachedLiveProviderModelRows,
      LiveModelCatalogHttpError,
    } from "openclaw/plugin-sdk/provider-catalog-live-runtime";

    async function discoverAcmeModels(apiKey: string) {
      try {
        const rows = await getCachedLiveProviderModelRows({
          providerId: "acme-ai",
          endpoint: "https://api.acme-ai.com/v1/models",
          apiKey,
          ttlMs: 60_000,
          auditContext: "acme-ai-model-discovery",
        });
        return rows
          .map((row) => projectAcmeModel(row))
          .filter((model) => model !== null);
      } catch (error) {
        if (error instanceof LiveModelCatalogHttpError) {
          return STATIC_MODELS;
        }
        throw error;
      }
    }
    ```

    `run` powinien pozostać chroniony uwierzytelnianiem i zwracać `null`, gdy żadne użyteczne dane uwierzytelniające
    nie są dostępne. Zachowaj działający offline `staticRun` lub statyczny mechanizm awaryjny, aby konfiguracja, dokumentacja,
    testy i interfejsy wyboru nie zależały od dostępu do sieci na żywo. Użyj TTL
    odpowiedniego dla aktualności listy modeli, unikaj odpytywania systemu plików podczas obsługi żądań
    i przekazuj specyficzne dla dostawcy `readRows` / `readModelId` tylko wtedy, gdy
    odpowiedź systemu nadrzędnego nie ma zgodnego z OpenAI kształtu `{ data: [{ id, object }] }`.

    Jeśli dostawca nadrzędny używa innych tokenów sterujących niż OpenClaw, dodaj
    niewielką dwukierunkową transformację tekstu, zamiast zastępować ścieżkę strumienia:

    ```typescript
    api.registerTextTransforms({
      input: [
        { from: /red basket/g, to: "blue basket" },
        { from: /paper ticket/g, to: "digital ticket" },
        { from: /left shelf/g, to: "right shelf" },
      ],
      output: [
        { from: /blue basket/g, to: "red basket" },
        { from: /digital ticket/g, to: "paper ticket" },
        { from: /right shelf/g, to: "left shelf" },
      ],
    });
    ```

    `input` przekształca końcową treść monitu systemowego i wiadomości tekstowych przed
    transportem. `output` przekształca fragmenty tekstu asystenta i tekst końcowy, zanim
    OpenClaw przeanalizuje własne znaczniki sterujące lub przekaże treść do kanału.

    W przypadku dostawców dołączonych do pakietu, którzy rejestrują tylko jednego dostawcę tekstowego z uwierzytelnianiem
    kluczem API oraz pojedynczym środowiskiem uruchomieniowym opartym na katalogu, preferuj węższy
    pomocnik `defineSingleProviderPluginEntry(...)`:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Acme AI API key",
            hint: "API key from your Acme AI dashboard",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Enter your Acme AI API key",
            defaultModel: "acme-ai/acme-large",
          },
        ],
        catalog: {
          buildProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
          buildStaticProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    `buildProvider` to ścieżka katalogu działająca na żywo, używana, gdy OpenClaw może ustalić rzeczywiste
    dane uwierzytelniające dostawcy. Może wykonywać wykrywanie specyficzne dla dostawcy. Używaj
    `buildStaticProvider` wyłącznie dla pozycji offline, które można bezpiecznie wyświetlić przed
    skonfigurowaniem uwierzytelniania; nie może wymagać danych uwierzytelniających ani wykonywać żądań sieciowych.
    Wyświetlanie przez `models list --all` w OpenClaw wykonuje obecnie katalogi statyczne
    tylko dla dołączonych pluginów dostawców, z pustą konfiguracją, pustymi zmiennymi środowiskowymi i bez
    ścieżek agenta ani obszaru roboczego.

    Jeśli przepływ uwierzytelniania musi również modyfikować `models.providers.*`, aliasy i
    domyślny model agenta podczas wdrażania, użyj pomocników ustawień wstępnych z
    `openclaw/plugin-sdk/provider-onboard`. Najbardziej wyspecjalizowane pomocniki to
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` oraz
    `createModelCatalogPresetAppliers(...)`.

    Gdy natywny punkt końcowy dostawcy obsługuje strumieniowe bloki użycia w
    standardowym transporcie `openai-completions`, preferuj współdzielone pomocniki katalogu z
    `openclaw/plugin-sdk/provider-catalog-shared` zamiast kodowania na stałe
    kontroli identyfikatora dostawcy. `supportsNativeStreamingUsageCompat(...)` oraz
    `applyProviderNativeStreamingUsageCompat(...)` wykrywają obsługę na podstawie
    mapy możliwości punktu końcowego, dzięki czemu natywne punkty końcowe w stylu Moonshot/DashScope nadal
    mogą włączyć tę funkcję, nawet gdy plugin używa niestandardowego identyfikatora dostawcy.

    Powyższe przykłady wykrywania na żywo obejmują interfejsy API dostawców w stylu `/models`. Zachowaj
    to wykrywanie wewnątrz `catalog.run`, uzależniając je od dostępnego uwierzytelniania, a
    `staticRun` pozostaw bez dostępu do sieci na potrzeby generowania katalogu offline.

  </Step>

  <Step title="Add dynamic model resolution">
    Jeśli dostawca akceptuje dowolne identyfikatory modeli (jak serwer proxy lub router),
    dodaj `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog from above

      resolveDynamicModel: (ctx) => ({
        id: ctx.modelId,
        name: ctx.modelId,
        provider: "acme-ai",
        api: "openai-completions",
        baseUrl: "https://api.acme-ai.com/v1",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 8192,
      }),
    });
    ```

    Jeśli ustalenie modelu wymaga wywołania sieciowego, użyj `prepareDynamicModel` do asynchronicznego
    przygotowania — po jego zakończeniu `resolveDynamicModel` zostanie uruchomione ponownie.

  </Step>

  <Step title="Add runtime hooks (as needed)">
    Większość dostawców potrzebuje tylko `catalog` i `resolveDynamicModel`. Dodawaj hooki
    stopniowo, zgodnie z wymaganiami dostawcy.

    Współdzielone konstruktory pomocnicze obsługują teraz najczęstsze rodziny
    zgodności odtwarzania i narzędzi, dlatego pluginy zwykle nie muszą ręcznie podłączać każdego hooka osobno:

    ```typescript
    import { buildProviderReplayFamilyHooks } from "openclaw/plugin-sdk/provider-model-shared";
    import { buildProviderStreamFamilyHooks } from "openclaw/plugin-sdk/provider-stream";
    import { buildProviderToolCompatFamilyHooks } from "openclaw/plugin-sdk/provider-tools";

    const GOOGLE_FAMILY_HOOKS = {
      ...buildProviderReplayFamilyHooks({ family: "google-gemini" }),
      ...buildProviderStreamFamilyHooks("google-thinking"),
      ...buildProviderToolCompatFamilyHooks("gemini"),
    };

    api.registerProvider({
      id: "acme-gemini-compatible",
      // ...
      ...GOOGLE_FAMILY_HOOKS,
    });
    ```

    Obecnie dostępne rodziny odtwarzania:

    | Rodzina | Co podłącza | Dołączone przykłady |
    | --- | --- | --- |
    | `openai-compatible` | Współdzielone zasady odtwarzania w stylu OpenAI dla transportów zgodnych z OpenAI, w tym oczyszczanie identyfikatorów wywołań narzędzi, poprawki kolejności rozpoczynającej się od asystenta oraz ogólna walidacja tur Gemini tam, gdzie wymaga jej transport | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Zasady odtwarzania uwzględniające Claude, wybierane według `modelId`, dzięki czemu transporty wiadomości Anthropic otrzymują czyszczenie bloków rozumowania specyficzne dla Claude tylko wtedy, gdy ustalony model rzeczywiście ma identyfikator Claude | `amazon-bedrock` |
    | `native-anthropic-by-model` | Te same zasady Claude według modelu co `anthropic-by-model`, a dodatkowo oczyszczanie identyfikatorów wywołań narzędzi i zachowanie natywnych identyfikatorów użycia narzędzi Anthropic w transportach, które muszą zachować natywne identyfikatory dostawcy | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | Natywne zasady odtwarzania Gemini wraz z oczyszczaniem odtwarzania początkowego. Współdzielona rodzina zachowuje tekstowy interfejs Gemini CLI w trybie oznaczonego rozumowania; bezpośredni dostawca `google` nadpisuje `resolveReasoningOutputMode` wartością `native`, ponieważ rozumowanie Gemini API dociera jako natywne części myśli. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Oczyszczanie sygnatur myśli Gemini dla modeli Gemini działających przez transporty proxy zgodne z OpenAI; nie włącza natywnej walidacji odtwarzania Gemini ani przepisywania początkowego | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Hybrydowe zasady dla dostawców łączących powierzchnie modeli wiadomości Anthropic i zgodnych z OpenAI w jednym pluginie; opcjonalne pomijanie bloków rozumowania wyłącznie dla Claude pozostaje ograniczone do strony Anthropic | `minimax` |

    Obecnie dostępne rodziny strumieni:

    | Rodzina | Co podłącza | Dołączone przykłady |
    | --- | --- | --- |
    | `google-thinking` | Normalizacja ładunku rozumowania Gemini we współdzielonej ścieżce strumienia | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Opakowanie rozumowania Kilo we współdzielonej ścieżce strumienia proxy, przy czym `kilo/auto` i nieobsługiwane identyfikatory rozumowania proxy pomijają wstrzykiwane rozumowanie | `kilocode` |
    | `moonshot-thinking` | Mapowanie binarnego ładunku natywnego rozumowania Moonshot na podstawie konfiguracji i poziomu `/think` | `moonshot` |
    | `minimax-fast-mode` | Przepisanie modelu w trybie szybkim MiniMax we współdzielonej ścieżce strumienia | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Współdzielone natywne opakowania OpenAI/Codex Responses: nagłówki atrybucji, `/fast`/`serviceTier`, szczegółowość tekstu, natywne wyszukiwanie internetowe Codex, kształtowanie ładunku zgodności rozumowania oraz zarządzanie kontekstem Responses | `openai` |
    | `openrouter-thinking` | Opakowanie rozumowania OpenRouter dla tras proxy, z centralną obsługą pomijania nieobsługiwanych modeli i wartości `auto` | `openrouter` |
    | `tool-stream-default-on` | Domyślnie włączone opakowanie `tool_stream` dla dostawców takich jak Z.AI, którzy chcą strumieniowania narzędzi, o ile nie zostanie ono jawnie wyłączone | `zai` |

    <Accordion title="SDK seams powering the family builders">
      Każdy konstruktor rodziny składa się z publicznych pomocników niższego poziomu eksportowanych z tego samego pakietu, których można użyć, gdy dostawca musi wyjść poza typowy schemat:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` oraz podstawowe konstruktory odtwarzania (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Eksportuje również pomocniki odtwarzania Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) oraz pomocniki punktów końcowych i modeli (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, a także współdzielone opakowania OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), opakowanie DeepSeek V4 zgodne z OpenAI (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), czyszczenie wstępnie wypełnionego rozumowania Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), zgodność wywołań narzędzi w postaci zwykłego tekstu (`createPlainTextToolCallCompatWrapper`) oraz współdzielone opakowania proxy i dostawców (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` — lekkie opakowania ładunków i zdarzeń dla intensywnie używanych ścieżek dostawców, w tym `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` oraz `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` oraz bazowe pomocniki schematów dostawców.

      W przypadku dostawców z rodziny Gemini zachowaj zgodność trybu wyjścia rozumowania
      z transportem. Bezpośredni dostawcy Google Gemini API powinni używać wyjścia rozumowania
      `native`, aby OpenClaw przetwarzał natywne części myśli bez dodawania
      dyrektyw promptu `<think>` / `<final>`. Backendy tekstowe w stylu Gemini CLI,
      które analizują końcową odpowiedź JSON lub tekstową, mogą zachować współdzielony
      oznaczony kontrakt `google-gemini`.

      Niektóre pomocniki strumieni celowo pozostają lokalne dla dostawcy. `@openclaw/anthropic-provider` przechowuje `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` oraz konstruktory opakowań Anthropic niższego poziomu we własnym publicznym interfejsie `api.ts` / `contract-api.ts`, ponieważ kodują obsługę funkcji beta OAuth Claude i ograniczenie `context1m`. Plugin xAI podobnie zachowuje natywne kształtowanie Responses xAI we własnym `wrapStreamFn` (aliasy `/fast`, domyślne `tool_stream`, czyszczenie nieobsługiwanych ścisłych narzędzi oraz usuwanie ładunku rozumowania specyficzne dla xAI).

      Ten sam wzorzec katalogu głównego pakietu obsługuje również `@openclaw/openai-provider` (konstruktory dostawców, pomocniki modeli domyślnych i konstruktory dostawców czasu rzeczywistego) oraz `@openclaw/openrouter-provider` (konstruktor dostawcy wraz z pomocnikami wdrażania i konfiguracji).
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        Dla dostawców wymagających wymiany tokenu przed każdym wywołaniem inferencji:

        ```typescript
        prepareRuntimeAuth: async (ctx) => {
          const exchanged = await exchangeToken(ctx.apiKey);
          return {
            apiKey: exchanged.token,
            baseUrl: exchanged.baseUrl,
            expiresAt: exchanged.expiresAt,
          };
        },
        ```
      </Tab>
      <Tab title="Custom headers">
        Dla dostawców wymagających niestandardowych nagłówków żądania lub modyfikacji treści:

        ```typescript
        // wrapStreamFn returns a StreamFn derived from ctx.streamFn
        wrapStreamFn: (ctx) => {
          if (!ctx.streamFn) return undefined;
          const inner = ctx.streamFn;
          return async (params) => {
            params.headers = {
              ...params.headers,
              "X-Acme-Version": "2",
            };
            return inner(params);
          };
        },
        ```
      </Tab>
      <Tab title="Native transport identity">
        Dla dostawców wymagających natywnych nagłówków żądania lub sesji albo metadanych w
        ogólnych transportach HTTP lub WebSocket:

        ```typescript
        resolveTransportTurnState: (ctx) => ({
          headers: {
            "x-request-id": ctx.turnId,
          },
          metadata: {
            session_id: ctx.sessionId ?? "",
            turn_id: ctx.turnId,
          },
        }),
        resolveWebSocketSessionPolicy: (ctx) => ({
          headers: {
            "x-session-id": ctx.sessionId ?? "",
          },
          degradeCooldownMs: 60_000,
        }),
        ```
      </Tab>
      <Tab title="Użycie i rozliczenia">
        Dla dostawców udostępniających dane o użyciu i rozliczeniach:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` ma trzy możliwe wyniki. Zwróć
        `{ token, accountId?, subscriptionType?, rateLimitTier? }`, gdy
        dostawca ma dane uwierzytelniające do użycia lub rozliczeń (opcjonalne pola
        przekazują niepoufne metadane planu z rozpoznanego profilu do
        `fetchUsageSnapshot`). Zwróć
        `{ handled: true }` tylko wtedy, gdy dostawca definitywnie obsłużył
        uwierzytelnianie użycia, ale nie ma użytecznego tokenu użycia, a OpenClaw
        musi pominąć ogólny mechanizm rezerwowy klucza API/OAuth. Zwróć `null` lub
        `undefined`, gdy dostawca nie obsłużył żądania, a OpenClaw powinien
        kontynuować z ogólnym mechanizmem rezerwowym.

        Zadeklaruj identyfikator dostawcy w `contracts.usageProviders`. Gdy ten
        kontrakt manifestu oraz **oba** hooki są obecne, OpenClaw automatycznie
        uwzględnia dostawcę podczas zbierania danych o użyciu bez wczytywania
        niepowiązanych pluginów dostawców. Aktualizacja listy dozwolonych w rdzeniu
        nie jest wymagana.
        `fetchUsageSnapshot` zwraca współdzieloną, niezależną od dostawcy strukturę:

        - `plan`: zgłoszona przez dostawcę subskrypcja lub etykieta klucza
        - `windows`: odnawialne okna limitów jako wartości procentowe wykorzystania
        - `billing`: typowane wpisy `balance`, `spend` lub `budget`; `unit` może być
          walutą ISO albo jednostką dostawcy, taką jak `credits`
        - `summary`: zwięzły kontekst specyficzny dla dostawcy, który nie mieści się
          w tych ustrukturyzowanych polach

        Zachowaj dokładną semantykę waluty. Kredyt dostawcy nie jest kwotą w USD,
        chyba że stanowi tak kontrakt nadrzędnego interfejsu. Plugin implementujący
        wyłącznie `fetchUsageSnapshot` pozostaje dostępny dla jawnych lub
        syntetycznych wywołujących, ale nie jest automatycznie wykrywany, ponieważ
        OpenClaw nie może rozpoznać jego danych uwierzytelniających do użycia.
      </Tab>
    </Tabs>

    <Accordion title="Typowe hooki dostawcy">
      OpenClaw wywołuje hooki pluginów modeli i dostawców mniej więcej w tej
      kolejności. Większość dostawców używa tylko 2–3 z nich. Nie jest to pełny
      kontrakt `ProviderPlugin` — pełną, aktualną listę hooków i uwagi dotyczące
      mechanizmów rezerwowych zawiera sekcja [Szczegóły wewnętrzne: hooki środowiska
      wykonawczego dostawcy](/pl/plugins/architecture-internals#provider-runtime-hooks).
      Pola dostawcy służące wyłącznie do zgodności, których OpenClaw już nie
      wywołuje, takie jak `ProviderPlugin.capabilities` i `suppressBuiltInModel`,
      nie są tutaj wymienione.

      | Hook | Kiedy używać |
      | --- | --- |
      | `catalog` | Katalog modeli lub domyślne bazowe adresy URL |
      | `applyConfigDefaults` | Globalne wartości domyślne należące do dostawcy podczas materializacji konfiguracji |
      | `normalizeModelId` | Porządkowanie aliasów starszych lub eksperymentalnych identyfikatorów modeli przed wyszukaniem |
      | `normalizeTransport` | Porządkowanie `api` / `baseUrl` rodziny dostawcy przed ogólnym składaniem modelu |
      | `normalizeConfig` | Normalizacja konfiguracji `models.providers.<id>` |
      | `applyNativeStreamingUsageCompat` | Natywne przekształcenia zgodności strumieniowego raportowania użycia dla dostawców konfiguracyjnych |
      | `resolveConfigApiKey` | Rozpoznawanie uwierzytelniania znacznikiem środowiskowym należące do dostawcy |
      | `resolveSyntheticAuth` | Syntetyczne uwierzytelnianie lokalne, samodzielnie hostowane lub oparte na konfiguracji |
      | `resolveExternalAuthProfiles` | Nakładanie zewnętrznych profili uwierzytelniania należących do dostawcy dla danych uwierzytelniających zarządzanych przez CLI lub aplikację |
      | `shouldDeferSyntheticProfileAuth` | Obniżenie priorytetu syntetycznych symboli zastępczych przechowywanych profili względem uwierzytelniania środowiskowego lub konfiguracyjnego |
      | `resolveDynamicModel` | Akceptowanie dowolnych nadrzędnych identyfikatorów modeli |
      | `prepareDynamicModel` | Asynchroniczne pobieranie metadanych przed rozpoznaniem |
      | `normalizeResolvedModel` | Przekształcenia transportu przed modułem uruchamiającym |
      | `normalizeToolSchemas` | Porządkowanie schematów narzędzi należące do dostawcy przed rejestracją |
      | `inspectToolSchemas` | Diagnostyka schematów narzędzi należąca do dostawcy |
      | `resolveReasoningOutputMode` | Kontrakt oznakowanego lub natywnego wyniku rozumowania |
      | `prepareExtraParams` | Domyślne parametry żądania |
      | `createStreamFn` | Całkowicie niestandardowy transport StreamFn |
      | `wrapStreamFn` | Niestandardowe opakowania nagłówków lub treści na standardowej ścieżce strumieniowania |
      | `resolveTransportTurnState` | Natywne nagłówki i metadane dla każdej tury |
      | `resolveWebSocketSessionPolicy` | Natywne nagłówki sesji WS i okres karencji |
      | `formatApiKey` | Niestandardowy format tokenu środowiska wykonawczego |
      | `refreshOAuth` | Niestandardowe odświeżanie OAuth |
      | `buildAuthDoctorHint` | Wskazówki dotyczące naprawy uwierzytelniania |
      | `matchesContextOverflowError` | Wykrywanie przepełnienia należące do dostawcy |
      | `classifyFailoverReason` | Klasyfikacja limitów szybkości lub przeciążenia należąca do dostawcy |
      | `isCacheTtlEligible` | Warunkowanie czasu TTL pamięci podręcznej promptów |
      | `buildMissingAuthMessage` | Niestandardowa wskazówka o braku uwierzytelniania |
      | `augmentModelCatalog` | Syntetyczne wiersze zgodności z przyszłymi wersjami (przestarzałe — preferuj `registerModelCatalogProvider`) |
      | `resolveThinkingProfile` | Zestaw opcji `/think` właściwy dla modelu |
      | `isBinaryThinking` | Zgodność binarnego włączania i wyłączania myślenia (przestarzałe — preferuj `resolveThinkingProfile`) |
      | `supportsXHighThinking` | Zgodność obsługi rozumowania `xhigh` (przestarzałe — preferuj `resolveThinkingProfile`) |
      | `resolveDefaultThinkingLevel` | Zgodność domyślnej polityki `/think` (przestarzałe — preferuj `resolveThinkingProfile`) |
      | `isModernModelRef` | Dopasowywanie modeli w testach rzeczywistych i dymnych |
      | `prepareRuntimeAuth` | Wymiana tokenu przed wnioskowaniem |
      | `resolveUsageAuth` | Niestandardowe analizowanie danych uwierzytelniających do użycia |
      | `fetchUsageSnapshot` | Niestandardowy punkt końcowy użycia |
      | `createEmbeddingProvider` | Adapter osadzania należący do dostawcy dla pamięci i wyszukiwania |
      | `buildReplayPolicy` | Niestandardowa polityka odtwarzania transkrypcji i Compaction |
      | `sanitizeReplayHistory` | Przekształcenia odtwarzania specyficzne dla dostawcy po ogólnym porządkowaniu |
      | `validateReplayTurns` | Ścisła walidacja tur odtwarzania przed osadzonym modułem uruchamiającym |
      | `onModelSelected` | Wywołanie zwrotne po wyborze (np. telemetria) |

      Uwagi dotyczące mechanizmów rezerwowych środowiska wykonawczego:

      - `normalizeConfig` rozpoznaje jeden plugin będący właścicielem danego identyfikatora dostawcy (najpierw dostawcy wbudowani, następnie dopasowany plugin środowiska wykonawczego) i wywołuje wyłącznie ten hook — nie skanuje innych dostawców. Własny hook `normalizeConfig` firmy Google normalizuje wpisy konfiguracji `google` / `google-vertex` / `google-antigravity`; nie jest to osobny mechanizm rezerwowy rdzenia.
      - `resolveConfigApiKey` używa hooka dostawcy, gdy jest on udostępniony. Amazon Bedrock zachowuje rozpoznawanie znaczników środowiskowych AWS w swoim pluginie dostawcy; samo uwierzytelnianie środowiska wykonawczego nadal używa domyślnego łańcucha AWS SDK, gdy skonfigurowano `auth: "aws-sdk"`.
      - `resolveThinkingProfile(ctx)` otrzymuje wybranego dostawcę `provider`, identyfikator `modelId`, opcjonalną scaloną wskazówkę katalogu `reasoning` oraz opcjonalne scalone informacje `compat` modelu. Używaj `compat` wyłącznie do wyboru interfejsu lub profilu myślenia dostawcy.
      - `resolveSystemPromptContribution` umożliwia dostawcy wstrzyknięcie wskazówek promptu systemowego uwzględniających pamięć podręczną dla rodziny modeli. Preferuj go zamiast starszego hooka `before_prompt_build` obejmującego cały plugin, gdy zachowanie należy do jednej rodziny dostawcy lub modeli i powinno zachować stabilny oraz dynamiczny podział pamięci podręcznej.

    </Accordion>

  </Step>

  <Step title="Dodaj dodatkowe możliwości (opcjonalnie)">
    ### Krok 5: Dodaj dodatkowe możliwości

    Plugin dostawcy może rejestrować osadzanie, syntezę mowy, transkrypcję w czasie
    rzeczywistym, głos w czasie rzeczywistym, rozumienie multimediów, generowanie
    obrazów, generowanie filmów, pobieranie z sieci i wyszukiwanie w sieci obok
    wnioskowania tekstowego. OpenClaw klasyfikuje go jako plugin
    **możliwości hybrydowych** — jest to zalecany wzorzec dla pluginów firmowych
    (jeden plugin na dostawcę). Zobacz
    [Szczegóły wewnętrzne: własność możliwości](/pl/plugins/architecture#capability-ownership-model).

    Zarejestruj każdą możliwość wewnątrz `register(api)` obok istniejącego
    wywołania `api.registerProvider(...)`. Wybierz tylko potrzebne karty:

    <Tabs>
      <Tab title="Mowa (TTS)">
        ```typescript
        import {
          assertOkOrThrowProviderError,
          postJsonRequest,
        } from "openclaw/plugin-sdk/provider-http";

        api.registerSpeechProvider({
          id: "acme-ai",
          label: "Acme Speech",
          defaultTimeoutMs: 120_000,
          isConfigured: ({ config }) => Boolean(config.messages?.tts),
          synthesize: async (req) => {
            const { response, release } = await postJsonRequest({
              url: "https://api.example.com/v1/speech",
              headers: new Headers({ "Content-Type": "application/json" }),
              body: { text: req.text },
              timeoutMs: req.timeoutMs,
              fetchFn: fetch,
              auditContext: "acme speech",
            });
            try {
              await assertOkOrThrowProviderError(response, "Acme Speech API error");
              return {
                audioBuffer: Buffer.from(await response.arrayBuffer()),
                outputFormat: "mp3",
                fileExtension: ".mp3",
                voiceCompatible: false,
              };
            } finally {
              await release();
            }
          },
        });
        ```

        W przypadku błędów HTTP dostawcy używaj
        `assertOkOrThrowProviderError(...)`, aby pluginy współdzieliły odczyty
        treści błędów z ograniczeniem rozmiaru, analizowanie błędów JSON oraz
        sufiksy identyfikatorów żądań.
      </Tab>
      <Tab title="Transkrypcja w czasie rzeczywistym">
        Preferuj `createRealtimeTranscriptionWebSocketSession(...)` — współdzielony
        helper obsługuje przechwytywanie serwera proxy, wykładnicze opóźnienie
        ponownego łączenia, opróżnianie przy zamykaniu, uzgadnianie gotowości,
        kolejkowanie dźwięku oraz diagnostykę zdarzeń zamknięcia. Twój plugin
        jedynie mapuje zdarzenia nadrzędnego interfejsu.

        ```typescript
        api.registerRealtimeTranscriptionProvider({
          id: "acme-ai",
          label: "Acme Realtime Transcription",
          isConfigured: () => true,
          createSession: (req) => {
            const apiKey = String(req.providerConfig.apiKey ?? "");
            return createRealtimeTranscriptionWebSocketSession({
              providerId: "acme-ai",
              callbacks: req,
              url: "wss://api.example.com/v1/realtime-transcription",
              headers: { Authorization: `Bearer ${apiKey}` },
              onMessage: (event, transport) => {
                if (event.type === "session.created") {
                  transport.sendJson({ type: "session.update" });
                  transport.markReady();
                  return;
                }
                if (event.type === "transcript.final") {
                  req.onTranscript?.(event.text);
                }
              },
              sendAudio: (audio, transport) => {
                transport.sendJson({
                  type: "audio.append",
                  audio: audio.toString("base64"),
                });
              },
              onClose: (transport) => {
                transport.sendJson({ type: "audio.end" });
              },
            });
          },
        });
        ```

        Dostawcy wsadowego STT, którzy wysyłają dźwięk metodą POST jako dane multipart, powinni używać
        `buildAudioTranscriptionFormData(...)` z
        `openclaw/plugin-sdk/provider-http`. Funkcja pomocnicza normalizuje nazwy
        przesyłanych plików, w tym plików AAC, które dla zgodnych interfejsów API
        transkrypcji wymagają nazwy pliku w stylu M4A.
      </Tab>
      <Tab title="Głos w czasie rzeczywistym">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          capabilities: {
            transports: ["gateway-relay"],
            inputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            outputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            supportsBargeIn: true,
            handlesInputAudioBargeIn: true,
            supportsToolCalls: true,
          },
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            // Ustaw tę opcję tylko wtedy, gdy dostawca akceptuje wiele odpowiedzi narzędzia dla
            // jednego wywołania, na przykład natychmiastową odpowiedź „w toku”, po której następuje
            // wynik końcowy.
            supportsToolResultContinuation: false,
            connect: async () => {},
            sendAudio: () => {},
            setMediaTimestamp: () => {},
            handleBargeIn: () => {},
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```

        Zadeklaruj `capabilities`, aby `talk.catalog` mógł udostępniać prawidłowe
        tryby, transporty, formaty dźwięku i flagi funkcji przeglądarkowym oraz
        natywnym klientom Talk. Zaimplementuj `handleBargeIn`, gdy transport może
        wykryć, że człowiek przerywa odtwarzanie odpowiedzi asystenta, a dostawca
        obsługuje skracanie lub czyszczenie aktywnej odpowiedzi dźwiękowej.
        `submitToolResult` może zwracać `void` w przypadku synchronicznego
        przesyłania albo `Promise<void>` jako granicę asynchronicznego zakończenia,
        którą może udostępniać most dostawcy. Sesje przekazywane przez Gateway
        czekają na tę obietnicę przed potwierdzeniem wyniku końcowego lub
        wyczyszczeniem powiązanego uruchomienia; odrzuć ją, gdy przesyłanie się
        nie powiedzie.
        Ustaw `supportsToolResultSuppression: false`, gdy dostawca nie może
        respektować `options.suppressResponse`. OpenClaw nie stosuje wtedy
        pomijania odpowiedzi dla wewnętrznych wyników wymuszonej konsultacji
        i anulowania oraz odrzuca bezpośrednie żądania pominięcia wyniku zamiast
        niejawnie rozpoczynać odpowiedź.
        Konsumenci `createRealtimeVoiceBridgeSession` mogą również zwracać
        obietnicę z `onToolCall`; synchroniczne wyjątki i odrzucenia są
        przekazywane do wywołania zwrotnego `onError` sesji.
        Ustaw `handlesInputAudioBargeIn` tylko wtedy, gdy VAD dostawcy potwierdza
        przerwanie przez wywołanie `onClearAudio("barge-in")`. Dostawcy, którzy
        pomijają tę flagę, korzystają z lokalnego mechanizmu OpenClaw do
        awaryjnego wykrywania przerwania na podstawie dźwięku wejściowego.
      </Tab>
      <Tab title="Rozumienie multimediów">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```

        Lokalni lub samodzielnie hostowani dostawcy multimediów, którzy celowo
        nie wymagają danych uwierzytelniających, mogą udostępniać `resolveAuth`
        i zwracać `kind: "none"`.
        OpenClaw nadal zachowuje standardową bramę uwierzytelniania dla
        dostawców, którzy nie włączą tej możliwości jawnie. Istniejący dostawcy
        mogą nadal odczytywać `req.apiKey`; nowi dostawcy powinni preferować
        `req.auth`.

        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "local-audio",
          capabilities: ["audio"],
          resolveAuth: () => ({
            kind: "none",
            source: "local-audio plugin no-auth",
          }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Osadzenia">
        ```typescript
        api.registerEmbeddingProvider({
          id: "acme-ai",
          defaultModel: "acme-embed",
          transport: "remote",
          authProviderId: "acme-ai",
          create: async ({ model }) => ({
            provider: {
              id: "acme-ai",
              model,
              dimensions: 1536,
              embed: async (input) => {
                const text = typeof input === "string" ? input : input.text;
                return fetchAcmeEmbedding(text);
              },
              embedBatch: async (inputs) =>
                Promise.all(
                  inputs.map((input) =>
                    fetchAcmeEmbedding(typeof input === "string" ? input : input.text),
                  ),
                ),
            },
          }),
        });
        ```

        Zadeklaruj ten sam identyfikator w `contracts.embeddingProviders`. Jest
        to ogólny kontrakt osadzeń służący do wielokrotnego generowania wektorów,
        w tym do przeszukiwania pamięci. `registerMemoryEmbeddingProvider(...)`
        jest przestarzałą warstwą zgodności dla istniejących adapterów
        przeznaczonych dla pamięci.
      </Tab>
      <Tab title="Generowanie obrazów i filmów">
        Możliwości dotyczące obrazów i filmów używają struktury **uwzględniającej tryb**.
        Dostawcy obrazów deklarują wymagane bloki możliwości `generate` i `edit`;
        dostawcy filmów deklarują `generate`, `imageToVideo` oraz
        `videoToVideo`. Płaskie pola zbiorcze, takie jak `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds`, nie wystarczają do jednoznacznego
        deklarowania obsługi trybów przekształcania ani wyłączonych trybów.
        Generowanie muzyki korzysta z tego samego wzorca `generate` / `edit`.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          capabilities: {
            generate: { maxCount: 4, supportsSize: true },
            edit: { enabled: false },
          },
          generateImage: async (req) => ({ images: [] }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          defaultTimeoutMs: 600_000,
          models: ["acme-video", "acme-image-video"],
          capabilities: {
            generate: { maxVideos: 1, maxDurationSeconds: 10, supportsResolution: true },
            imageToVideo: {
              enabled: true,
              maxVideos: 1,
              maxInputImages: 1,
              maxInputImagesByModel: { "acme/reference-to-video": 9 },
              maxDurationSeconds: 5,
            },
            videoToVideo: { enabled: false },
          },
          catalogByModel: {
            "acme-image-video": {
              modes: ["imageToVideo"],
              capabilities: {
                imageToVideo: {
                  enabled: true,
                  maxVideos: 1,
                  maxInputImages: 1,
                  resolutions: ["480P", "720P", "1080P"],
                  supportsResolution: true,
                },
                videoToVideo: { enabled: false },
              },
            },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```

        `capabilities` jest wymagane dla obu typów dostawców; `edit` oraz bloki
        przekształcania filmów (`imageToVideo`, `videoToVideo`) zawsze wymagają
        jawnej flagi `enabled`.

        Użyj `catalogByModel`, gdy statyczne tryby lub możliwości wymienionego
        modelu różnią się od ustawień domyślnych dostawcy. Te metadane utrzymują
        poprawność `video_generate action=list` i katalogów modeli bez
        wywoływania kodu dostawcy. Wyszukiwanie i egzekwowanie możliwości podczas
        obsługi żądania nadal należą do `resolveModelCapabilities` i
        `generateVideo`; w miarę możliwości używaj tej samej stałej możliwości
        w obu ścieżkach.
      </Tab>
      <Tab title="Pobieranie i wyszukiwanie w sieci">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "Fetch pages through Acme's rendering backend.",
          envVars: ["ACME_FETCH_API_KEY"],
          placeholder: "acme-...",
          signupUrl: "https://acme.example.com/fetch",
          credentialPath: "plugins.entries.acme.config.webFetch.apiKey",
          getCredentialValue: (fetchConfig) => fetchConfig?.acme?.apiKey,
          setCredentialValue: (fetchConfigTarget, value) => {
            const acme = (fetchConfigTarget.acme ??= {});
            acme.apiKey = value;
          },
          createTool: () => ({
            description: "Fetch a page through Acme Fetch.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });

        api.registerWebSearchProvider({
          id: "acme-ai-search",
          label: "Acme Search",
          hint: "Search the web through Acme's search backend.",
          envVars: ["ACME_SEARCH_API_KEY"],
          placeholder: "acme-...",
          signupUrl: "https://acme.example.com/search",
          credentialPath: "plugins.entries.acme.config.webSearch.apiKey",
          getCredentialValue: (searchConfig) => searchConfig?.acme?.apiKey,
          setCredentialValue: (searchConfigTarget, value) => {
            const acme = (searchConfigTarget.acme ??= {});
            acme.apiKey = value;
          },
          createTool: () => ({
            description: "Search the web through Acme Search.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });
        ```

        Oba typy dostawców korzystają z tej samej struktury podłączania danych
        uwierzytelniających: `hint`, `envVars`, `placeholder`, `signupUrl`,
        `credentialPath`, `getCredentialValue`, `setCredentialValue` i
        `createTool` są wymagane.
      </Tab>
    </Tabs>

  </Step>

  <Step title="Testowanie">
    ### Krok 6: Testowanie

    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Wyeksportuj obiekt konfiguracji dostawcy z pliku index.ts lub osobnego pliku
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("resolves dynamic models", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("returns catalog when key is available", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("returns null catalog when no key", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## Publikowanie w ClawHub

Pluginy dostawców publikuje się tak samo jak każdy inny zewnętrzny Plugin kodu:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

`clawhub skill publish <path>` to inne polecenie, przeznaczone do publikowania
folderu skill, a nie pakietu Pluginu — nie używaj go tutaj.

## Struktura plików

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadane openclaw.providers
├── openclaw.plugin.json      # Manifest z metadanymi uwierzytelniania dostawcy
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Testy
    └── usage.ts              # Punkt końcowy użycia (opcjonalny)
```

## Informacje o kolejności katalogu

`catalog.order` określa, kiedy katalog zostanie scalony względem wbudowanych
dostawców:

| Kolejność | Kiedy            | Zastosowanie                                              |
| --------- | ---------------- | --------------------------------------------------------- |
| `simple`  | Pierwszy przebieg | Zwykli dostawcy używający klucza API                     |
| `profile` | Po `simple`      | Dostawcy wymagający profili uwierzytelniania               |
| `paired`  | Po `profile`     | Synteza wielu powiązanych wpisów                           |
| `late`    | Ostatni przebieg | Zastępowanie istniejących dostawców (wygrywa przy kolizji) |

## Następne kroki

- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — jeśli Twój plugin udostępnia również kanał
- [Środowisko uruchomieniowe SDK](/pl/plugins/sdk-runtime) — funkcje pomocnicze `api.runtime` (TTS, wyszukiwanie, podagent)
- [Omówienie SDK](/pl/plugins/sdk-overview) — pełna dokumentacja importów ze ścieżek podrzędnych
- [Mechanizmy wewnętrzne pluginów](/pl/plugins/architecture-internals#provider-runtime-hooks) — szczegóły punktów zaczepienia i dołączone przykłady

## Powiązane

- [Konfiguracja Plugin SDK](/pl/plugins/sdk-setup)
- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Tworzenie pluginów kanałów](/pl/plugins/sdk-channel-plugins)
