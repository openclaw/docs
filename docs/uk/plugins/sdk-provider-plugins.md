---
read_when:
    - Ви створюєте новий Plugin постачальника моделей
    - Ви хочете додати до OpenClaw проксі, сумісний з OpenAI, або власну LLM
    - Потрібно розуміти автентифікацію провайдерів, каталоги та хуки середовища виконання
sidebarTitle: Provider plugins
summary: Покроковий посібник зі створення Plugin постачальника моделей для OpenClaw
title: Створення плагінів провайдерів
x-i18n:
    generated_at: "2026-05-06T01:53:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: d56e29767710ee2e027830787aa5671a31cb161c027284561fe25e1c07c34ae9
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Цей посібник демонструє створення provider Plugin, який додає model provider
(LLM) до OpenClaw. Наприкінці ви матимете provider з каталогом моделей,
автентифікацією за API-ключем і динамічним визначенням моделей.

<Info>
  Якщо ви раніше не створювали жодного OpenClaw Plugin, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins), щоб ознайомитися з базовою
  структурою пакета й налаштуванням маніфесту.
</Info>

<Tip>
  Provider Plugins додають моделі до звичайного циклу inference в OpenClaw. Якщо модель
  має запускатися через нативний агентський daemon, який володіє потоками, Compaction або подіями
  інструментів, поєднайте provider з [агентською обгорткою](/uk/plugins/sdk-agent-harness)
  замість того, щоб додавати деталі daemon protocol у core.
</Tip>

## Покроковий огляд

<Steps>
  <Step title="Пакет і маніфест">
    ### Крок 1: Пакет і маніфест

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
      "providerAuthEnvVars": {
        "acme-ai": ["ACME_AI_API_KEY"]
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

    Маніфест оголошує `providerAuthEnvVars`, щоб OpenClaw міг виявляти
    облікові дані без завантаження runtime вашого Plugin. Додайте `providerAuthAliases`,
    коли варіант provider має повторно використовувати auth іншого provider id. `modelSupport`
    є необов’язковим і дає OpenClaw змогу автоматично завантажувати ваш provider Plugin зі скорочених
    model ids, як-от `acme-large`, ще до появи runtime hooks. Якщо ви публікуєте
    provider у ClawHub, поля `openclaw.compat` і `openclaw.build`
    є обов’язковими в `package.json`.

  </Step>

  <Step title="Зареєструйте provider">
    Мінімальному provider потрібні `id`, `label`, `auth` і `catalog`:

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
      },
    });
    ```

    Це робочий provider. Тепер користувачі можуть виконати
    `openclaw onboard --acme-ai-api-key <key>` і вибрати
    `acme-ai/acme-large` як свою модель.

    Якщо upstream provider використовує інші control tokens, ніж OpenClaw, додайте
    невелике двонапрямне перетворення тексту замість заміни stream path:

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

    `input` переписує фінальний системний prompt і текстовий вміст повідомлення перед
    transport. `output` переписує текстові deltas асистента й фінальний текст перед тим,
    як OpenClaw розбере власні control markers або channel delivery.

    Для bundled providers, які реєструють лише один text provider з API-key
    auth і єдиним runtime на базі catalog, надавайте перевагу вужчому
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

    `buildProvider` — це шлях live catalog, який використовується, коли OpenClaw може визначити справжній
    provider auth. Він може виконувати provider-specific discovery. Використовуйте
    `buildStaticProvider` лише для offline rows, які безпечно показувати до налаштування auth;
    він не повинен вимагати облікових даних або виконувати мережеві запити.
    Відображення OpenClaw `models list --all` наразі виконує static catalogs
    лише для bundled provider Plugins, з порожньою config, порожнім env і без
    шляхів agent/workspace.

    Якщо ваш auth flow також має змінювати `models.providers.*`, aliases і
    agent default model під час onboarding, використовуйте preset helpers з
    `openclaw/plugin-sdk/provider-onboard`. Найвужчі helpers:
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли нативний endpoint provider підтримує streamed usage blocks у
    звичайному transport `openai-completions`, надавайте перевагу спільним catalog helpers у
    `openclaw/plugin-sdk/provider-catalog-shared` замість hardcoding
    provider-id checks. `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку з
    endpoint capability map, тому нативні endpoint-и в стилі Moonshot/DashScope все ще
    вмикаються, навіть коли Plugin використовує власний provider id.

  </Step>

  <Step title="Додайте динамічне визначення моделей">
    Якщо ваш provider приймає довільні model IDs (як proxy або router),
    додайте `resolveDynamicModel`:

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

    Якщо визначення потребує мережевого виклику, використовуйте `prepareDynamicModel` для async
    warm-up — `resolveDynamicModel` запускається знову після його завершення.

  </Step>

  <Step title="Додайте runtime hooks (за потреби)">
    Більшості providers потрібні лише `catalog` + `resolveDynamicModel`. Додавайте hooks
    поступово, коли вони потрібні вашому provider.

    Спільні helper builders тепер охоплюють найпоширеніші родини replay/tool-compat,
    тому Plugins зазвичай не потрібно вручну під’єднувати кожен hook окремо:

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

    Доступні сьогодні replay families:

    | Родина | Що під’єднує | Bundled приклади |
    | --- | --- | --- |
    | `openai-compatible` | Спільна replay policy у стилі OpenAI для OpenAI-compatible transports, включно із sanitation tool-call-id, виправленнями assistant-first ordering і generic Gemini-turn validation там, де це потрібно transport | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Claude-aware replay policy, вибрана за `modelId`, тож Anthropic-message transports отримують Claude-specific thinking-block cleanup лише тоді, коли визначена модель справді має Claude id | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Нативна Gemini replay policy плюс bootstrap replay sanitation і tagged reasoning-output mode | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Gemini thought-signature sanitation для моделей Gemini, що працюють через OpenAI-compatible proxy transports; не вмикає native Gemini replay validation або bootstrap rewrites | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Hybrid policy для providers, які поєднують Anthropic-message і OpenAI-compatible model surfaces в одному Plugin; optional Claude-only thinking-block dropping залишається обмеженим Anthropic side | `minimax` |

    Доступні родини потоків сьогодні:

    | Родина | Що під’єднує | Вбудовані приклади |
    | --- | --- | --- |
    | `google-thinking` | Нормалізація thinking-пayload Gemini на спільному шляху потоку | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Обгортка reasoning Kilo на спільному шляху proxy-потоку, із пропуском впровадженого thinking для `kilo/auto` і непідтримуваних ідентифікаторів proxy reasoning | `kilocode` |
    | `moonshot-thinking` | Зіставлення payload нативного бінарного thinking Moonshot із config + рівня `/think` | `moonshot` |
    | `minimax-fast-mode` | Переписування моделі fast-mode MiniMax на спільному шляху потоку | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Спільні обгортки нативних OpenAI/Codex Responses: заголовки attribution, `/fast`/`serviceTier`, докладність тексту, нативний вебпошук Codex, формування payload для reasoning-compat і керування контекстом Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Обгортка reasoning OpenRouter для proxy-маршрутів із централізованою обробкою пропусків для непідтримуваних моделей/`auto` | `openrouter` |
    | `tool-stream-default-on` | Увімкнена за замовчуванням обгортка `tool_stream` для провайдерів на кшталт Z.AI, яким потрібен tool streaming, якщо його явно не вимкнено | `zai` |

    <Accordion title="SDK seams powering the family builders">
      Кожен builder родини складається з нижчерівневих публічних helpers, експортованих із того самого пакета, до яких можна звернутися, коли провайдеру потрібно відхилитися від спільного шаблону:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` і сирі replay builders (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Також експортує replay helpers Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) і helpers endpoint/model (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, а також спільні обгортки OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), OpenAI-сумісна обгортка DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), очищення thinking prefill Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`) і спільні обгортки proxy/provider (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, базові helpers схеми Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) і helpers сумісності xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Вбудований Plugin xAI використовує `normalizeResolvedModel` + `contributeResolvedModelCompat` із ними, щоб правила xAI лишалися у власності провайдера.

      Деякі helpers потоків навмисно залишаються локальними для провайдера. `@openclaw/anthropic-provider` зберігає `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і нижчерівневі builders обгорток Anthropic у власному публічному шві `api.ts` / `contract-api.ts`, бо вони кодують обробку Claude OAuth beta та gating `context1m`. Plugin xAI так само зберігає формування нативних xAI Responses у власному `wrapStreamFn` (псевдоніми `/fast`, стандартний `tool_stream`, очищення непідтримуваних strict-tool, видалення reasoning-payload, специфічне для xAI).

      Той самий шаблон кореня пакета також підтримує `@openclaw/openai-provider` (builders провайдера, helpers моделей за замовчуванням, builders realtime provider) і `@openclaw/openrouter-provider` (builder провайдера плюс helpers onboarding/config).
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        Для провайдерів, яким потрібен обмін токена перед кожним inference-викликом:

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
        Для провайдерів, яким потрібні власні заголовки запиту або модифікації тіла:

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
        Для провайдерів, яким потрібні нативні заголовки request/session або metadata на
        загальних HTTP- чи WebSocket-транспортах:

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
      <Tab title="Usage and billing">
        Для провайдерів, які надають дані usage/billing:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```
      </Tab>
    </Tabs>

    <Accordion title="All available provider hooks">
      OpenClaw викликає hooks у цьому порядку. Більшість провайдерів використовують лише 2-3:
      поля провайдера лише для сумісності, які OpenClaw більше не викликає, як-от
      `ProviderPlugin.capabilities` і `suppressBuiltInModel`, тут не наведені.

      | # | Hook | Коли використовувати |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей або стандартні base URL |
      | 2 | `applyConfigDefaults` | Глобальні defaults, якими володіє провайдер, під час матеріалізації config |
      | 3 | `normalizeModelId` | Очищення застарілих/preview псевдонімів model-id перед lookup |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` родини провайдера перед збиранням загальної моделі |
      | 5 | `normalizeConfig` | Нормалізація config `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Переписування compat для native streaming-usage для config providers |
      | 7 | `resolveConfigApiKey` | Розв’язання auth env-marker, яким володіє провайдер |
      | 8 | `resolveSyntheticAuth` | Локальний/self-hosted або config-backed synthetic auth |
      | 9 | `shouldDeferSyntheticProfileAuth` | Опускання synthetic stored-profile placeholders за env/config auth |
      | 10 | `resolveDynamicModel` | Прийняття довільних upstream model IDs |
      | 11 | `prepareDynamicModel` | Асинхронне отримання metadata перед розв’язанням |
      | 12 | `normalizeResolvedModel` | Переписування транспорту перед runner |
      | 13 | `contributeResolvedModelCompat` | Compat flags для vendor models за іншим compatible transport |
      | 14 | `normalizeToolSchemas` | Очищення tool-schema, яким володіє провайдер, перед реєстрацією |
      | 15 | `inspectToolSchemas` | Діагностика tool-schema, якою володіє провайдер |
      | 16 | `resolveReasoningOutputMode` | Контракт tagged vs native reasoning-output |
      | 17 | `prepareExtraParams` | Стандартні параметри запиту |
      | 18 | `createStreamFn` | Повністю власний транспорт StreamFn |
      | 19 | `wrapStreamFn` | Власні обгортки заголовків/тіла на звичайному шляху потоку |
      | 20 | `resolveTransportTurnState` | Нативні per-turn headers/metadata |
      | 21 | `resolveWebSocketSessionPolicy` | Нативні WS session headers/cool-down |
      | 22 | `formatApiKey` | Власна форма runtime token |
      | 23 | `refreshOAuth` | Власне оновлення OAuth |
      | 24 | `buildAuthDoctorHint` | Підказка для виправлення auth |
      | 25 | `matchesContextOverflowError` | Виявлення overflow, яким володіє провайдер |
      | 26 | `classifyFailoverReason` | Класифікація rate-limit/overload, якою володіє провайдер |
      | 27 | `isCacheTtlEligible` | Gating TTL prompt cache |
      | 28 | `buildMissingAuthMessage` | Власна підказка missing-auth |
      | 29 | `augmentModelCatalog` | Synthetic forward-compat rows |
      | 30 | `resolveThinkingProfile` | Набір опцій `/think`, специфічний для моделі |
      | 31 | `isBinaryThinking` | Сумісність binary thinking on/off |
      | 32 | `supportsXHighThinking` | Сумісність підтримки reasoning `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Сумісність стандартної політики `/think` |
      | 34 | `isModernModelRef` | Зіставлення live/smoke model |
      | 35 | `prepareRuntimeAuth` | Обмін токена перед inference |
      | 36 | `resolveUsageAuth` | Власний parsing usage credentials |
      | 37 | `fetchUsageSnapshot` | Власний usage endpoint |
      | 38 | `createEmbeddingProvider` | Адаптер embedding, яким володіє провайдер, для memory/search |
      | 39 | `buildReplayPolicy` | Власна політика transcript replay/compaction |
      | 40 | `sanitizeReplayHistory` | Специфічні для провайдера replay rewrites після generic cleanup |
      | 41 | `validateReplayTurns` | Строга валідація replay-turn перед embedded runner |
      | 42 | `onModelSelected` | Callback після вибору (наприклад, telemetry) |

      Нотатки щодо runtime fallback:

      - `normalizeConfig` спершу перевіряє matched provider, потім інші hook-capable provider plugins, доки один фактично не змінить config. Якщо жоден provider hook не переписує підтримуваний config entry родини Google, усе одно застосовується вбудований normalizer config Google.
      - `resolveConfigApiKey` використовує provider hook, коли його надано. Вбудований шлях `amazon-bedrock` також має тут вбудований AWS env-marker resolver, хоча сам runtime auth Bedrock досі використовує default chain AWS SDK.
      - `resolveSystemPromptContribution` дає провайдеру змогу впровадити cache-aware guidance для system-prompt для родини моделей. Надавайте йому перевагу над `before_prompt_build`, коли поведінка належить одній родині provider/model і має зберігати стабільний/dynamic cache split.

      Докладні описи й реальні приклади див. у [Внутрішнє: Provider Runtime Hooks](/uk/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Add extra capabilities (optional)">
    ### Крок 5: Додайте додаткові можливості

    Provider Plugin може реєструвати speech, realtime transcription, realtime
    voice, media understanding, image generation, video generation, web fetch
    і web search поряд із text inference. OpenClaw класифікує це як
    **hybrid-capability** Plugin — рекомендований шаблон для company plugins
    (один Plugin на vendor). Див.
    [Внутрішнє: Capability Ownership](/uk/plugins/architecture#capability-ownership-model).

    Зареєструйте кожну можливість усередині `register(api)` поряд із вашим наявним
    викликом `api.registerProvider(...)`. Виберіть лише потрібні tabs:

    <Tabs>
      <Tab title="Мовлення (TTS)">
        ```typescript
        import {
          assertOkOrThrowProviderError,
          postJsonRequest,
        } from "openclaw/plugin-sdk/provider-http";

        api.registerSpeechProvider({
          id: "acme-ai",
          label: "Acme Speech",
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

        Використовуйте `assertOkOrThrowProviderError(...)` для HTTP-збоїв провайдера, щоб
        plugins спільно використовували обмежене читання тіла помилки, розбір помилок JSON і
        суфікси request-id.
      </Tab>
      <Tab title="Транскрипція в реальному часі">
        Надавайте перевагу `createRealtimeTranscriptionWebSocketSession(...)` — спільний
        помічник обробляє захоплення proxy, backoff повторного підключення, скидання під час закриття, ready
        handshakes, постановку аудіо в чергу та діагностику подій закриття. Ваш plugin
        лише зіставляє upstream-події.

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

        Пакетні STT-провайдери, які надсилають multipart-аудіо через POST, мають використовувати
        `buildAudioTranscriptionFormData(...)` з
        `openclaw/plugin-sdk/provider-http`. Помічник нормалізує імена файлів завантаження,
        зокрема AAC-завантаження, яким потрібне ім’я файлу у стилі M4A для
        сумісних API транскрипції.
      </Tab>
      <Tab title="Голос у реальному часі">
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

        Оголосіть `capabilities`, щоб `talk.catalog` міг показувати дійсні режими,
        транспорти, аудіоформати та прапорці функцій для браузерних і нативних Talk
        клієнтів. Реалізуйте `handleBargeIn`, коли транспорт може виявити, що
        людина перериває відтворення асистента, а провайдер підтримує
        обрізання або очищення активної аудіовідповіді.
      </Tab>
      <Tab title="Розуміння медіа">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Генерація зображень і відео">
        Можливості відео використовують форму, **залежну від режиму**: `generate`,
        `imageToVideo` і `videoToVideo`. Плоских агрегованих полів на кшталт
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` недостатньо,
        щоб коректно оголосити підтримку режиму трансформації або вимкнені режими.
        Генерація музики дотримується того самого шаблону з явними блоками `generate` /
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
      <Tab title="Веботримання та пошук">
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

  <Step title="Тест">
    ### Крок 6: Тест

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

## Публікація в ClawHub

Plugins провайдерів публікуються так само, як і будь-який інший зовнішній code plugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Не використовуйте тут застарілий псевдонім публікації лише для skill; пакети plugin мають використовувати
`clawhub package publish`.

## Структура файлів

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with provider auth metadata
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## Довідник порядку каталогу

`catalog.order` керує тим, коли ваш каталог об’єднується відносно вбудованих
провайдерів:

| Порядок   | Коли           | Сценарій використання                            |
| --------- | -------------- | ----------------------------------------------- |
| `simple`  | Перший прохід  | Звичайні провайдери API-ключів                  |
| `profile` | Після simple   | Провайдери, обмежені auth profiles              |
| `paired`  | Після profile  | Синтез кількох пов’язаних записів               |
| `late`    | Останній прохід | Перевизначення наявних провайдерів (перемагає в разі колізії) |

## Наступні кроки

- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — якщо ваш plugin також надає канал
- [SDK Runtime](/uk/plugins/sdk-runtime) — помічники `api.runtime` (TTS, пошук, subagent)
- [SDK Overview](/uk/plugins/sdk-overview) — повний довідник імпортів subpath
- [Plugin Internals](/uk/plugins/architecture-internals#provider-runtime-hooks) — деталі hooks і вбудовані приклади

## Пов’язане

- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення plugins](/uk/plugins/building-plugins)
- [Створення channel plugins](/uk/plugins/sdk-channel-plugins)
