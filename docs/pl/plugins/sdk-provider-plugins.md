---
read_when:
    - Budujesz nowy Plugin dostawcy modeli
    - Chcesz dodać do OpenClaw proxy zgodne z OpenAI lub niestandardowy LLM
    - Musisz zrozumieć uwierzytelnianie dostawców, katalogi i hooki środowiska uruchomieniowego
sidebarTitle: Provider plugins
summary: Przewodnik krok po kroku po tworzeniu pluginu dostawcy modelu dla OpenClaw
title: Tworzenie pluginów dostawców
x-i18n:
    generated_at: "2026-06-27T18:06:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05ac4d08eae00e7e0fcf03edea691dc9ced7309421dd19a31edf69cee1e01f0b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Ten przewodnik prowadzi przez budowanie providera Plugin, który dodaje dostawcę modelu
(LLM) do OpenClaw. Na końcu będziesz mieć providera z katalogiem modeli,
uwierzytelnianiem kluczem API i dynamicznym rozpoznawaniem modeli.

<Info>
  Jeśli wcześniej nie budowałeś żadnego Plugin OpenClaw, najpierw przeczytaj
  [Pierwsze kroki](/pl/plugins/building-plugins), aby poznać podstawową strukturę
  pakietu i konfigurację manifestu.
</Info>

<Tip>
  Plugin providera dodaje modele do standardowej pętli inferencji OpenClaw. Jeśli model
  musi działać przez natywnego demona agenta, który zarządza wątkami, compaction lub
  zdarzeniami narzędzi, sparuj providera z [uprzężą agenta](/pl/plugins/sdk-agent-harness)
  zamiast umieszczać szczegóły protokołu demona w rdzeniu.
</Tip>

## Przewodnik

<Steps>
  <Step title="Package and manifest">
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
      "description": "Acme AI model provider",
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
          "choiceLabel": "Acme AI API key",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI API key"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Manifest deklaruje `setup.providers[].envVars`, dzięki czemu OpenClaw może wykrywać
    poświadczenia bez ładowania runtime Twojego Plugin. Dodaj `providerAuthAliases`,
    gdy wariant providera powinien ponownie używać uwierzytelniania identyfikatora innego providera. `modelSupport`
    jest opcjonalne i pozwala OpenClaw automatycznie wczytać Plugin providera ze skróconych
    identyfikatorów modeli, takich jak `acme-large`, zanim będą istnieć haki runtime. Jeśli publikujesz
    providera w ClawHub, te pola `openclaw.compat` i `openclaw.build`
    są wymagane w `package.json`.

  </Step>

  <Step title="Register the provider">
    Minimalny provider tekstowy wymaga `id`, `label`, `auth` i `catalog`.
    `catalog` jest należącym do providera hakiem runtime/konfiguracji; może wywoływać live
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

    `registerModelCatalogProvider` to nowsza powierzchnia katalogu płaszczyzny sterowania
    dla interfejsu list/pomocy/selektora. Używaj jej dla wierszy tekstu,
    generowania obrazów, generowania wideo i generowania muzyki. Zachowaj wywołania punktów końcowych dostawcy i
    mapowanie odpowiedzi w Plugin; OpenClaw odpowiada za wspólny kształt wiersza, etykiety
    źródła i renderowanie pomocy.

    To działający provider. Użytkownicy mogą teraz uruchomić
    `openclaw onboard --acme-ai-api-key <key>` i wybrać
    `acme-ai/acme-large` jako swój model.

    ### Wykrywanie modeli live

    Jeśli Twój provider udostępnia interfejs API w stylu `/models`, zachowaj specyficzny dla providera
    punkt końcowy i projekcję wierszy w Plugin oraz użyj
    `openclaw/plugin-sdk/provider-catalog-live-runtime` dla wspólnego cyklu życia pobierania.
    Helper zapewnia chronione pobieranie HTTP, nagłówki uwierzytelniania providera,
    ustrukturyzowane błędy HTTP, buforowanie TTL i statyczne zachowanie fallback bez
    umieszczania polityki providera w rdzeniu OpenClaw.

    Użyj `buildLiveModelProviderConfig`, gdy live API informuje tylko, które
    należące do providera statyczne wiersze katalogu są obecnie dostępne:

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

    Użyj `getCachedLiveProviderModelRows`, gdy API providera zwraca bogatsze
    metadane, a Plugin musi samodzielnie projektować wiersze do definicji modeli
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

    `run` powinno pozostać bramkowane uwierzytelnianiem i zwracać `null`, gdy nie ma dostępnych
    użytecznych poświadczeń. Zachowaj offline `staticRun` lub statyczny fallback, aby konfiguracja, dokumentacja,
    testy i powierzchnie selektora nie zależały od dostępu do sieci live. Użyj TTL
    odpowiedniego do świeżości listy modeli, unikaj odpytywania systemu plików w czasie żądania
    i przekaż specyficzne dla providera `readRows` / `readModelId` tylko wtedy, gdy
    odpowiedź upstream nie ma zgodnego z OpenAI kształtu `{ data: [{ id, object }] }`.

    Jeśli upstream provider używa innych tokenów kontrolnych niż OpenClaw, dodaj
    małą dwukierunkową transformację tekstu zamiast zastępować ścieżkę strumienia:

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

    `input` przepisuje końcowy prompt systemowy i treść wiadomości tekstowej przed
    transportem. `output` przepisuje delty tekstu asystenta i końcowy tekst, zanim
    OpenClaw sparsuje własne znaczniki kontrolne lub dostarczenie kanałem.

    W przypadku bundled providerów, które rejestrują tylko jednego providera tekstowego z uwierzytelnianiem
    kluczem API oraz pojedynczym runtime opartym na katalogu, preferuj węższy
    helper `defineSingleProviderPluginEntry(...)`:

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

    `buildProvider` to ścieżka katalogu na żywo używana, gdy OpenClaw może rozpoznać rzeczywiste
    uwierzytelnianie dostawcy. Może wykonywać wykrywanie specyficzne dla dostawcy. Używaj
    `buildStaticProvider` tylko dla wierszy offline, które można bezpiecznie pokazać przed
    skonfigurowaniem uwierzytelniania; nie może wymagać poświadczeń ani wykonywać żądań sieciowych.
    Widok `models list --all` w OpenClaw obecnie wykonuje katalogi statyczne
    tylko dla wbudowanych pluginów dostawców, z pustą konfiguracją, pustym środowiskiem i bez
    ścieżek agenta/przestrzeni roboczej.

    Jeśli Twój przepływ uwierzytelniania musi także poprawiać `models.providers.*`, aliasy oraz
    domyślny model agenta podczas wdrażania, użyj pomocników presetów z
    `openclaw/plugin-sdk/provider-onboard`. Najwęższe pomocniki to
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` oraz
    `createModelCatalogPresetAppliers(...)`.

    Gdy natywny endpoint dostawcy obsługuje przesyłane strumieniowo bloki użycia na
    standardowym transporcie `openai-completions`, preferuj współdzielone pomocniki katalogu w
    `openclaw/plugin-sdk/provider-catalog-shared` zamiast wpisywać na stałe
    sprawdzenia identyfikatorów dostawcy. `supportsNativeStreamingUsageCompat(...)` i
    `applyProviderNativeStreamingUsageCompat(...)` wykrywają obsługę na podstawie
    mapy możliwości endpointu, więc natywne endpointy w stylu Moonshot/DashScope nadal
    zgłaszają obsługę, nawet gdy plugin używa niestandardowego identyfikatora dostawcy.

    Powyższe przykłady wykrywania na żywo obejmują API dostawców w stylu `/models`. Zachowaj
    to wykrywanie wewnątrz `catalog.run`, bramkowane użytecznym uwierzytelnianiem, i pozostaw
    `staticRun` bez sieci na potrzeby generowania katalogu offline.

  </Step>

  <Step title="Add dynamic model resolution">
    Jeśli Twój dostawca akceptuje dowolne identyfikatory modeli (jak proxy lub router),
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

    Jeśli rozpoznanie wymaga wywołania sieciowego, użyj `prepareDynamicModel` do asynchronicznego
    rozgrzania - `resolveDynamicModel` uruchomi się ponownie po jego zakończeniu.

  </Step>

  <Step title="Add runtime hooks (as needed)">
    Większość dostawców potrzebuje tylko `catalog` + `resolveDynamicModel`. Dodawaj hooki
    stopniowo, gdy dostawca ich wymaga.

    Współdzielone konstruktory pomocników obejmują teraz najczęstsze rodziny zgodności
    replay/narzędzi, więc pluginy zwykle nie muszą ręcznie podłączać każdego hooka osobno:

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

    Obecnie dostępne rodziny replay:

    | Rodzina | Co podłącza | Wbudowane przykłady |
    | --- | --- | --- |
    | `openai-compatible` | Współdzielona polityka replay w stylu OpenAI dla transportów zgodnych z OpenAI, w tym oczyszczanie identyfikatorów wywołań narzędzi, poprawki kolejności zaczynającej od asystenta oraz ogólna walidacja tur Gemini tam, gdzie wymaga tego transport | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Polityka replay świadoma Claude wybierana według `modelId`, dzięki czemu transporty wiadomości Anthropic otrzymują oczyszczanie bloków myślenia specyficzne dla Claude tylko wtedy, gdy rozpoznany model faktycznie jest identyfikatorem Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Natywna polityka replay Gemini oraz oczyszczanie replay podczas bootstrapu. Współdzielona rodzina utrzymuje tekstowe wyjście Gemini CLI przy tagowanym rozumowaniu; bezpośredni dostawca `google` nadpisuje `resolveReasoningOutputMode` na `native`, ponieważ myślenie Gemini API przychodzi jako natywne części myśli. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Oczyszczanie sygnatur myśli Gemini dla modeli Gemini uruchamianych przez transporty proxy zgodne z OpenAI; nie włącza natywnej walidacji replay Gemini ani przepisywania bootstrapu | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Polityka hybrydowa dla dostawców, którzy mieszają powierzchnie modeli wiadomości Anthropic i zgodne z OpenAI w jednym pluginie; opcjonalne usuwanie bloków myślenia tylko dla Claude pozostaje ograniczone do strony Anthropic | `minimax` |

    Obecnie dostępne rodziny strumieni:

    | Rodzina | Co podłącza | Wbudowane przykłady |
    | --- | --- | --- |
    | `google-thinking` | Normalizacja ładunku myślenia Gemini na współdzielonej ścieżce strumienia | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Wrapper rozumowania Kilo na współdzielonej ścieżce strumienia proxy, z `kilo/auto` i nieobsługiwanymi identyfikatorami rozumowania proxy pomijającymi wstrzyknięte myślenie | `kilocode` |
    | `moonshot-thinking` | Mapowanie binarnego natywnego ładunku myślenia Moonshot z konfiguracji + poziomu `/think` | `moonshot` |
    | `minimax-fast-mode` | Przepisanie modelu trybu szybkiego MiniMax na współdzielonej ścieżce strumienia | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Współdzielone natywne wrappery OpenAI/Codex Responses: nagłówki atrybucji, `/fast`/`serviceTier`, szczegółowość tekstu, natywne wyszukiwanie internetowe Codex, kształtowanie ładunku zgodności rozumowania oraz zarządzanie kontekstem Responses | `openai` |
    | `openrouter-thinking` | Wrapper rozumowania OpenRouter dla tras proxy, z pominięciami nieobsługiwanych modeli/`auto` obsługiwanymi centralnie | `openrouter` |
    | `tool-stream-default-on` | Domyślnie włączony wrapper `tool_stream` dla dostawców takich jak Z.AI, którzy chcą strumieniowania narzędzi, chyba że zostanie jawnie wyłączone | `zai` |

    <Accordion title="SDK seams powering the family builders">
      Każdy konstruktor rodziny składa się z publicznych pomocników niższego poziomu eksportowanych z tego samego pakietu, po które możesz sięgnąć, gdy dostawca musi odejść od wspólnego wzorca:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` oraz surowe konstruktory replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Eksportuje także pomocniki replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) oraz pomocniki endpointów/modeli (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, a także współdzielone wrappery OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), wrapper zgodny z OpenAI dla DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), czyszczenie prefill myślenia Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), zgodność wywołań narzędzi w zwykłym tekście (`createPlainTextToolCallCompatWrapper`) oraz współdzielone wrappery proxy/dostawców (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` - lekkie wrappery ładunku i zdarzeń dla gorących ścieżek dostawców, w tym `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` oraz `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` oraz bazowe pomocniki schematów dostawców.

      W przypadku dostawców z rodziny Gemini utrzymuj tryb wyjścia rozumowania zgodny z
      transportem. Bezpośredni dostawcy Google Gemini API powinni używać wyjścia rozumowania
      `native`, aby OpenClaw zużywał natywne części myśli bez dodawania
      dyrektyw promptu `<think>` / `<final>`. Tekstowe backendy w stylu Gemini CLI,
      które parsują końcową odpowiedź JSON/tekst, mogą zachować współdzielony
      tagowany kontrakt `google-gemini`.

      Niektóre pomocniki strumienia celowo pozostają lokalne dla dostawcy. `@openclaw/anthropic-provider` utrzymuje `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` oraz niższego poziomu konstruktory wrapperów Anthropic we własnym publicznym szwie `api.ts` / `contract-api.ts`, ponieważ kodują obsługę beta Claude OAuth oraz bramkowanie `context1m`. Plugin xAI podobnie utrzymuje natywne kształtowanie xAI Responses we własnym `wrapStreamFn` (aliasy `/fast`, domyślne `tool_stream`, czyszczenie nieobsługiwanych narzędzi ścisłych, usuwanie ładunku rozumowania specyficzne dla xAI).

      Ten sam wzorzec korzenia pakietu obsługuje także `@openclaw/openai-provider` (konstruktory dostawców, pomocniki modeli domyślnych, konstruktory dostawcy realtime) oraz `@openclaw/openrouter-provider` (konstruktor dostawcy oraz pomocniki onboardingu/konfiguracji).
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        Dla dostawców, którzy potrzebują wymiany tokenu przed każdym wywołaniem inferencji:

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
        Dla dostawców, którzy potrzebują niestandardowych nagłówków żądania lub modyfikacji treści:

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
        Dla dostawców, którzy potrzebują natywnych nagłówków żądania/sesji lub metadanych w
        ogólnych transportach HTTP albo WebSocket:

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
        Dla dostawców, którzy udostępniają dane użycia/rozliczeń:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` ma trzy wyniki. Zwróć `{ token, accountId? }`,
        gdy dostawca ma poświadczenie użycia/rozliczeń. Zwróć
        `{ handled: true }` tylko wtedy, gdy dostawca definitywnie obsłużył
        uwierzytelnianie użycia, ale nie ma używalnego tokenu użycia, a OpenClaw
        musi pominąć ogólny mechanizm awaryjny klucza API/OAuth. Zwróć `null` albo
        `undefined`, gdy dostawca nie obsłużył żądania, a OpenClaw powinien
        kontynuować z ogólnym mechanizmem awaryjnym.
      </Tab>
    </Tabs>

    <Accordion title="Wszystkie dostępne hooki dostawcy">
      OpenClaw wywołuje hooki w tej kolejności. Większość dostawców używa tylko 2-3:
      Pola dostawcy przeznaczone wyłącznie do zgodności, których OpenClaw już nie
      wywołuje, takie jak `ProviderPlugin.capabilities` i `suppressBuiltInModel`,
      nie są tutaj wymienione.

      | # | Hook | Kiedy używać |
      | --- | --- | --- |
      | 1 | `catalog` | Katalog modeli lub domyślne wartości bazowego URL |
      | 2 | `applyConfigDefaults` | Globalne wartości domyślne należące do dostawcy podczas materializacji konfiguracji |
      | 3 | `normalizeModelId` | Czyszczenie aliasów identyfikatorów modeli legacy/podglądowych przed wyszukiwaniem |
      | 4 | `normalizeTransport` | Czyszczenie `api` / `baseUrl` rodziny dostawcy przed ogólnym składaniem modelu |
      | 5 | `normalizeConfig` | Normalizacja konfiguracji `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Przepisywanie zgodności natywnego użycia strumieniowania dla dostawców konfiguracji |
      | 7 | `resolveConfigApiKey` | Rozwiązywanie uwierzytelniania markerów env należące do dostawcy |
      | 8 | `resolveSyntheticAuth` | Syntetyczne uwierzytelnianie lokalne/self-hosted lub oparte na konfiguracji |
      | 9 | `shouldDeferSyntheticProfileAuth` | Obniżenie syntetycznych symboli zastępczych zapisanych profili za uwierzytelnianie env/config |
      | 10 | `resolveDynamicModel` | Akceptowanie dowolnych identyfikatorów modeli upstream |
      | 11 | `prepareDynamicModel` | Asynchroniczne pobranie metadanych przed rozwiązaniem |
      | 12 | `normalizeResolvedModel` | Przepisywanie transportu przed runnerem |
      | 13 | `normalizeToolSchemas` | Czyszczenie schematów narzędzi należące do dostawcy przed rejestracją |
      | 14 | `inspectToolSchemas` | Diagnostyka schematów narzędzi należąca do dostawcy |
      | 15 | `resolveReasoningOutputMode` | Kontrakt wyniku rozumowania tagowanego kontra natywnego |
      | 16 | `prepareExtraParams` | Domyślne parametry żądania |
      | 17 | `createStreamFn` | W pełni niestandardowy transport StreamFn |
      | 19 | `wrapStreamFn` | Niestandardowe opakowania nagłówków/treści na normalnej ścieżce strumienia |
      | 20 | `resolveTransportTurnState` | Natywne nagłówki/metadane dla każdej tury |
      | 21 | `resolveWebSocketSessionPolicy` | Natywne nagłówki sesji WS/okres wyciszenia |
      | 22 | `formatApiKey` | Niestandardowy kształt tokenu runtime |
      | 23 | `refreshOAuth` | Niestandardowe odświeżanie OAuth |
      | 24 | `buildAuthDoctorHint` | Wskazówki naprawy uwierzytelniania |
      | 25 | `matchesContextOverflowError` | Wykrywanie przepełnienia należące do dostawcy |
      | 26 | `classifyFailoverReason` | Klasyfikacja limitu szybkości/przeciążenia należąca do dostawcy |
      | 27 | `isCacheTtlEligible` | Bramkowanie TTL pamięci podręcznej promptów |
      | 28 | `buildMissingAuthMessage` | Niestandardowa wskazówka brakującego uwierzytelniania |
      | 29 | `augmentModelCatalog` | Syntetyczne wiersze zgodności w przód |
      | 30 | `resolveThinkingProfile` | Zestaw opcji `/think` specyficzny dla modelu |
      | 31 | `isBinaryThinking` | Zgodność włączania/wyłączania binarnego myślenia |
      | 32 | `supportsXHighThinking` | Zgodność obsługi rozumowania `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Zgodność domyślnej polityki `/think` |
      | 34 | `isModernModelRef` | Dopasowywanie modelu live/smoke |
      | 35 | `prepareRuntimeAuth` | Wymiana tokenu przed inferencją |
      | 36 | `resolveUsageAuth` | Niestandardowe parsowanie poświadczeń użycia |
      | 37 | `fetchUsageSnapshot` | Niestandardowy endpoint użycia |
      | 38 | `createEmbeddingProvider` | Adapter embeddingów należący do dostawcy dla pamięci/wyszukiwania |
      | 39 | `buildReplayPolicy` | Niestandardowa polityka odtwarzania/Compaction transkryptu |
      | 40 | `sanitizeReplayHistory` | Przepisywanie odtwarzania specyficzne dla dostawcy po ogólnym czyszczeniu |
      | 41 | `validateReplayTurns` | Ścisła walidacja tur odtwarzania przed osadzonym runnerem |
      | 42 | `onModelSelected` | Callback po wyborze (np. telemetria) |

      Uwagi dotyczące mechanizmu awaryjnego runtime:

      - `normalizeConfig` najpierw sprawdza dopasowanego dostawcę, a następnie inne pluginy dostawców obsługujące hooki, aż któryś faktycznie zmieni konfigurację. Jeśli żaden hook dostawcy nie przepisze obsługiwanego wpisu konfiguracji z rodziny Google, wbudowany normalizator konfiguracji Google nadal zostanie zastosowany.
      - `resolveConfigApiKey` używa hooka dostawcy, gdy jest udostępniony. Amazon Bedrock utrzymuje rozwiązywanie markerów env AWS w swoim pluginie dostawcy; samo uwierzytelnianie runtime nadal używa domyślnego łańcucha AWS SDK, gdy jest skonfigurowane z `auth: "aws-sdk"`.
      - `resolveThinkingProfile(ctx)` otrzymuje wybranego `provider`, `modelId`, opcjonalną scaloną wskazówkę katalogu `reasoning` i opcjonalne scalone fakty `compat` modelu. Używaj `compat` tylko do wyboru UI/profilu myślenia dostawcy.
      - `resolveSystemPromptContribution` pozwala dostawcy wstrzyknąć wskazówki promptu systemowego świadome pamięci podręcznej dla rodziny modeli. Preferuj go zamiast `before_prompt_build`, gdy zachowanie należy do jednej rodziny dostawcy/modeli i powinno zachować stabilny/dynamiczny podział pamięci podręcznej.

      Szczegółowe opisy i przykłady z praktyki znajdziesz w [Internals: Provider Runtime Hooks](/pl/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Dodaj dodatkowe możliwości (opcjonalnie)">
    ### Krok 5: Dodaj dodatkowe możliwości

    Plugin dostawcy może rejestrować embeddingi, mowę, transkrypcję w czasie
    rzeczywistym, głos w czasie rzeczywistym, rozumienie mediów, generowanie obrazów,
    generowanie wideo, pobieranie z sieci i wyszukiwanie w sieci obok inferencji
    tekstu. OpenClaw klasyfikuje to jako plugin
    **hybrid-capability** - zalecany wzorzec dla pluginów firmowych
    (jeden plugin na dostawcę). Zobacz
    [Internals: Capability Ownership](/pl/plugins/architecture#capability-ownership-model).

    Zarejestruj każdą możliwość w `register(api)` obok istniejącego wywołania
    `api.registerProvider(...)`. Wybierz tylko potrzebne karty:

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

        Użyj `assertOkOrThrowProviderError(...)` dla błędów HTTP dostawcy, aby
        pluginy współdzieliły limitowane odczyty treści błędów, parsowanie błędów
        JSON i sufiksy identyfikatorów żądań.
      </Tab>
      <Tab title="Transkrypcja w czasie rzeczywistym">
        Preferuj `createRealtimeTranscriptionWebSocketSession(...)` - wspólny
        helper obsługuje przechwytywanie proxy, backoff ponownego łączenia,
        opróżnianie przy zamknięciu, handshaki gotowości, kolejkowanie audio i
        diagnostykę zdarzeń zamknięcia. Twój plugin tylko mapuje zdarzenia upstream.

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

        Dostawcy wsadowego STT, którzy wysyłają audio multipart metodą POST, powinni
        używać `buildAudioTranscriptionFormData(...)` z
        `openclaw/plugin-sdk/provider-http`. Helper normalizuje nazwy plików
        przesyłania, w tym przesyłania AAC, które potrzebują nazwy pliku w stylu M4A
        dla zgodnych API transkrypcji.
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
            supportsToolCalls: true,
          },
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            // Set this only if the provider accepts multiple tool responses for
            // one call, for example an immediate "working" response followed by
            // the final result.
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

        Zadeklaruj `capabilities`, aby `talk.catalog` mógł udostępniać prawidłowe tryby,
        transporty, formaty audio i flagi funkcji przeglądarkowym oraz natywnym klientom Talk.
        Zaimplementuj `handleBargeIn`, gdy transport potrafi wykryć, że
        człowiek przerywa odtwarzanie asystenta, a dostawca obsługuje
        skracanie lub czyszczenie aktywnej odpowiedzi audio.
      </Tab>
      <Tab title="Media understanding">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```

        Lokalni lub samodzielnie hostowani dostawcy mediów, którzy celowo nie wymagają
        poświadczeń, mogą udostępnić `resolveAuth` i zwrócić `kind: "none"`.
        OpenClaw nadal utrzymuje normalną bramkę uwierzytelniania dla dostawców, którzy nie
        włączają się jawnie. Istniejący dostawcy mogą nadal odczytywać `req.apiKey`;
        nowi dostawcy powinni preferować `req.auth`.

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
      <Tab title="Embeddings">
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

        Zadeklaruj ten sam identyfikator w `contracts.embeddingProviders`. To jest
        ogólny kontrakt osadzeń do wielokrotnego generowania wektorów, w tym
        wyszukiwania w pamięci. `registerMemoryEmbeddingProvider(...)` jest przestarzałą
        zgodnością dla istniejących adapterów specyficznych dla pamięci.
      </Tab>
      <Tab title="Image and video generation">
        Możliwości wideo używają kształtu **świadomego trybu**: `generate`,
        `imageToVideo` i `videoToVideo`. Płaskie pola zbiorcze, takie jak
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds`, nie wystarczają
        do przejrzystego ogłaszania obsługi trybu transformacji ani wyłączonych trybów.
        Generowanie muzyki stosuje ten sam wzorzec z jawnymi blokami `generate` /
        `edit`.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* image result */ }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          defaultTimeoutMs: 600_000,
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
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```
      </Tab>
      <Tab title="Web fetch and search">
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
          search: async (req) => ({ content: [] }),
        });
        ```
      </Tab>
    </Tabs>

  </Step>

  <Step title="Test">
    ### Krok 6: Test

    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Export your provider config object from index.ts or a dedicated file
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

Nie używaj tutaj starszego aliasu publikowania przeznaczonego tylko dla Skills; pakiety Plugin powinny używać
`clawhub package publish`.

## Struktura plików

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with provider auth metadata
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## Odniesienie do kolejności katalogu

`catalog.order` kontroluje, kiedy katalog jest scalany względem wbudowanych
dostawców:

| Kolejność | Kiedy         | Przypadek użycia                               |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | Pierwsze przejście | Zwykli dostawcy z kluczem API              |
| `profile` | Po simple     | Dostawcy zależni od profili uwierzytelniania   |
| `paired`  | Po profile    | Syntezowanie wielu powiązanych wpisów          |
| `late`    | Ostatnie przejście | Nadpisanie istniejących dostawców (wygrywa przy kolizji) |

## Następne kroki

- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) - jeśli Twój Plugin zapewnia także kanał
- [Środowisko uruchomieniowe SDK](/pl/plugins/sdk-runtime) - pomocniki `api.runtime` (TTS, wyszukiwanie, podagent)
- [Omówienie SDK](/pl/plugins/sdk-overview) - pełna referencja importów podścieżek
- [Wewnętrzna architektura Plugin](/pl/plugins/architecture-internals#provider-runtime-hooks) - szczegóły hooków i przykłady wbudowane

## Powiązane

- [Konfiguracja Plugin SDK](/pl/plugins/sdk-setup)
- [Tworzenie Plugin](/pl/plugins/building-plugins)
- [Tworzenie Plugin kanałów](/pl/plugins/sdk-channel-plugins)
