---
read_when:
    - Ви створюєте новий Plugin постачальника моделей
    - Ви хочете додати до OpenClaw OpenAI-сумісний проксі або власну LLM
    - Вам потрібно розуміти автентифікацію провайдерів, каталоги та хуки середовища виконання
sidebarTitle: Provider plugins
summary: Покроковий посібник зі створення Plugin постачальника моделей для OpenClaw
title: Створення плагінів провайдерів
x-i18n:
    generated_at: "2026-05-06T04:13:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f62f4b4df055412288b9d56f0344c76b9adfc3a04f3916eba37c04d22a3d808
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Цей посібник покроково показує, як створити provider plugin, що додає model provider
(LLM) до OpenClaw. Наприкінці у вас буде provider з каталогом моделей,
автентифікацією за API-ключем і динамічним визначенням моделей.

<Info>
  Якщо ви ще не створювали жодного OpenClaw plugin, спершу прочитайте
  [Початок роботи](/uk/plugins/building-plugins), щоб ознайомитися з базовою
  структурою пакета та налаштуванням маніфесту.
</Info>

<Tip>
  Provider plugins додають моделі до звичайного inference loop OpenClaw. Якщо модель
  має працювати через нативний agent daemon, який володіє threads, compaction або tool
  events, поєднайте provider з [agent harness](/uk/plugins/sdk-agent-harness)
  замість того, щоб розміщувати деталі daemon protocol у core.
</Tip>

## Покроковий посібник

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
    облікові дані без завантаження runtime вашого plugin. Додайте `providerAuthAliases`,
    коли варіант provider має повторно використовувати автентифікацію іншого provider id. `modelSupport`
    є необов’язковим і дає OpenClaw змогу автоматично завантажувати ваш provider plugin зі скорочених
    model ids на кшталт `acme-large` ще до появи runtime hooks. Якщо ви публікуєте
    provider у ClawHub, ці поля `openclaw.compat` і `openclaw.build`
    обов’язкові в `package.json`.

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

    Це робочий provider. Тепер користувачі можуть
    `openclaw onboard --acme-ai-api-key <key>` і вибрати
    `acme-ai/acme-large` як свою модель.

    Якщо upstream provider використовує інші контрольні токени, ніж OpenClaw, додайте
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

    `input` переписує фінальний системний промпт і текстовий вміст повідомлень перед
    transport. `output` переписує assistant text deltas і фінальний текст перед тим,
    як OpenClaw розбирає власні контрольні маркери або channel delivery.

    Для bundled providers, які реєструють лише один text provider з API-key
    auth і єдиним catalog-backed runtime, віддавайте перевагу вужчому
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

    `buildProvider` — це live catalog path, який використовується, коли OpenClaw може визначити реальну
    автентифікацію provider. Він може виконувати provider-specific discovery. Використовуйте
    `buildStaticProvider` лише для offline rows, які безпечно показувати до налаштування auth;
    він не повинен вимагати облікових даних або виконувати мережеві запити.
    Відображення `models list --all` в OpenClaw наразі виконує static catalogs
    лише для bundled provider plugins, з порожньою конфігурацією, порожнім env і без
    agent/workspace paths.

    Якщо ваш auth flow також має змінювати `models.providers.*`, aliases і
    agent default model під час onboarding, використовуйте preset helpers з
    `openclaw/plugin-sdk/provider-onboard`. Найвужчі helpers:
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли нативний endpoint provider підтримує streamed usage blocks на
    звичайному transport `openai-completions`, віддавайте перевагу shared catalog helpers у
    `openclaw/plugin-sdk/provider-catalog-shared` замість жорстко заданих
    перевірок provider-id. `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку з
    endpoint capability map, тому нативні endpoint-и у стилі Moonshot/DashScope все одно
    вмикаються, навіть коли plugin використовує кастомний provider id.

  </Step>

  <Step title="Додайте динамічне визначення моделей">
    Якщо ваш provider приймає довільні model IDs (наприклад proxy або router),
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
    warm-up - `resolveDynamicModel` запускається знову після його завершення.

  </Step>

  <Step title="Додайте runtime hooks (за потреби)">
    Більшості providers потрібні лише `catalog` + `resolveDynamicModel`. Додавайте hooks
    поступово, коли вони потрібні вашому provider.

    Shared helper builders тепер покривають найпоширеніші сімейства replay/tool-compat,
    тож plugins зазвичай не потрібно вручну під’єднувати кожен hook окремо:

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

    Доступні replay families сьогодні:

    | Family | Що під’єднується | Bundled examples |
    | --- | --- | --- |
    | `openai-compatible` | Shared OpenAI-style replay policy для OpenAI-compatible transports, зокрема tool-call-id sanitation, виправлення assistant-first ordering і generic Gemini-turn validation там, де це потрібно transport | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Claude-aware replay policy, вибрана за `modelId`, тож Anthropic-message transports отримують Claude-specific thinking-block cleanup лише тоді, коли визначена модель справді є Claude id | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Native Gemini replay policy плюс bootstrap replay sanitation і tagged reasoning-output mode | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Gemini thought-signature sanitation для Gemini models, що працюють через OpenAI-compatible proxy transports; не вмикає native Gemini replay validation або bootstrap rewrites | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Hybrid policy для providers, які змішують Anthropic-message і OpenAI-compatible model surfaces в одному plugin; необов’язкове Claude-only thinking-block dropping залишається обмеженим Anthropic side | `minimax` |

    Доступні сімейства потоків сьогодні:

    | Сімейство | Що воно підключає | Вбудовані приклади |
    | --- | --- | --- |
    | `google-thinking` | Нормалізація thinking-навантаження Gemini у спільному шляху потоку | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Обгортка reasoning Kilo у спільному шляху proxy-потоку, де `kilo/auto` і непідтримувані proxy reasoning ids пропускають інʼєктоване thinking | `kilocode` |
    | `moonshot-thinking` | Зіставлення бінарного native-thinking-навантаження Moonshot із конфігурації + рівня `/think` | `moonshot` |
    | `minimax-fast-mode` | Переписування моделі fast-mode MiniMax у спільному шляху потоку | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Спільні нативні обгортки OpenAI/Codex Responses: заголовки attribution, `/fast`/`serviceTier`, докладність тексту, нативний вебпошук Codex, формування reasoning-compat навантаження та керування контекстом Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Обгортка reasoning OpenRouter для proxy-маршрутів, із централізованою обробкою пропусків для непідтримуваних моделей/`auto` | `openrouter` |
    | `tool-stream-default-on` | Обгортка `tool_stream`, увімкнена за замовчуванням, для постачальників на кшталт Z.AI, яким потрібен streaming інструментів, якщо його явно не вимкнено | `zai` |

    <Accordion title="SDK seams, що живлять побудовники сімейств">
      Кожен побудовник сімейства складено з нижчорівневих публічних помічників, експортованих із того самого пакета; до них можна звернутися, коли постачальнику потрібно відійти від спільного шаблону:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` і сирі побудовники replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Також експортує помічники replay для Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) і помічники endpoint/model (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, а також спільні обгортки OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), OpenAI-сумісну обгортку DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), очищення thinking prefill для Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`) і спільні proxy/provider обгортки (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, базові помічники схем Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) і помічники сумісності xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Вбудований xAI Plugin використовує `normalizeResolvedModel` + `contributeResolvedModelCompat` разом із ними, щоб правила xAI залишалися у власності постачальника.

      Деякі потокові помічники навмисно залишаються локальними для постачальника. `@openclaw/anthropic-provider` тримає `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і нижчорівневі побудовники обгорток Anthropic у власному публічному seam `api.ts` / `contract-api.ts`, бо вони кодують обробку Claude OAuth beta та gating `context1m`. xAI Plugin так само тримає формування нативних xAI Responses у власному `wrapStreamFn` (псевдоніми `/fast`, типовий `tool_stream`, очищення непідтримуваних strict-tool, видалення reasoning-навантаження, специфічного для xAI).

      Той самий шаблон package-root також підтримує `@openclaw/openai-provider` (побудовники постачальника, помічники моделей за замовчуванням, побудовники realtime-постачальника) і `@openclaw/openrouter-provider` (побудовник постачальника плюс помічники onboarding/config).
    </Accordion>

    <Tabs>
      <Tab title="Обмін токена">
        Для постачальників, яким потрібен обмін токена перед кожним викликом inference:

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
      <Tab title="Користувацькі заголовки">
        Для постачальників, яким потрібні користувацькі заголовки запиту або зміни тіла:

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
      <Tab title="Нативна ідентичність транспорту">
        Для постачальників, яким потрібні нативні заголовки або метадані запиту/сеансу на
        загальних HTTP- або WebSocket-транспортах:

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
      <Tab title="Використання та білінг">
        Для постачальників, які надають дані використання/білінгу:

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

    <Accordion title="Усі доступні hooks постачальника">
      OpenClaw викликає hooks у такому порядку. Більшість постачальників використовує лише 2-3:
      Поля постачальника лише для сумісності, які OpenClaw більше не викликає, як-от
      `ProviderPlugin.capabilities` і `suppressBuiltInModel`, тут не наведені.

      | # | Hook | Коли використовувати |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей або значення base URL за замовчуванням |
      | 2 | `applyConfigDefaults` | Глобальні значення за замовчуванням, що належать постачальнику, під час матеріалізації конфігурації |
      | 3 | `normalizeModelId` | Очищення legacy/preview псевдонімів model-id перед lookup |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` сімейства постачальника перед загальним складанням моделі |
      | 5 | `normalizeConfig` | Нормалізація конфігурації `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Compat-переписування нативного streaming-usage для config-постачальників |
      | 7 | `resolveConfigApiKey` | Розвʼязання auth через env-marker, що належить постачальнику |
      | 8 | `resolveSyntheticAuth` | Локальна/самохостингова або config-backed synthetic auth |
      | 9 | `shouldDeferSyntheticProfileAuth` | Пониження synthetic stored-profile placeholders за env/config auth |
      | 10 | `resolveDynamicModel` | Прийняття довільних upstream model IDs |
      | 11 | `prepareDynamicModel` | Асинхронне отримання metadata перед розвʼязанням |
      | 12 | `normalizeResolvedModel` | Переписування транспорту перед runner |
      | 13 | `contributeResolvedModelCompat` | Compat-прапорці для моделей постачальника за іншим сумісним транспортом |
      | 14 | `normalizeToolSchemas` | Очищення tool-schema, що належить постачальнику, перед реєстрацією |
      | 15 | `inspectToolSchemas` | Діагностика tool-schema, що належить постачальнику |
      | 16 | `resolveReasoningOutputMode` | Контракт tagged vs native reasoning-output |
      | 17 | `prepareExtraParams` | Параметри запиту за замовчуванням |
      | 18 | `createStreamFn` | Повністю користувацький транспорт StreamFn |
      | 19 | `wrapStreamFn` | Користувацькі обгортки заголовків/тіла у звичайному шляху потоку |
      | 20 | `resolveTransportTurnState` | Нативні per-turn заголовки/метадані |
      | 21 | `resolveWebSocketSessionPolicy` | Нативні заголовки/cool-down WS-сеансу |
      | 22 | `formatApiKey` | Користувацька форма runtime-токена |
      | 23 | `refreshOAuth` | Користувацьке оновлення OAuth |
      | 24 | `buildAuthDoctorHint` | Настанови з відновлення auth |
      | 25 | `matchesContextOverflowError` | Виявлення overflow, що належить постачальнику |
      | 26 | `classifyFailoverReason` | Класифікація rate-limit/overload, що належить постачальнику |
      | 27 | `isCacheTtlEligible` | Gating TTL prompt cache |
      | 28 | `buildMissingAuthMessage` | Користувацька підказка про відсутню auth |
      | 29 | `augmentModelCatalog` | Synthetic forward-compat рядки |
      | 30 | `resolveThinkingProfile` | Набір опцій `/think`, специфічний для моделі |
      | 31 | `isBinaryThinking` | Сумісність binary thinking on/off |
      | 32 | `supportsXHighThinking` | Сумісність підтримки reasoning `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Сумісність політики `/think` за замовчуванням |
      | 34 | `isModernModelRef` | Зіставлення live/smoke моделей |
      | 35 | `prepareRuntimeAuth` | Обмін токена перед inference |
      | 36 | `resolveUsageAuth` | Користувацький parsing облікових даних використання |
      | 37 | `fetchUsageSnapshot` | Користувацький endpoint використання |
      | 38 | `createEmbeddingProvider` | Адаптер embedding, що належить постачальнику, для memory/search |
      | 39 | `buildReplayPolicy` | Користувацька політика replay/Compaction transcript |
      | 40 | `sanitizeReplayHistory` | Переписування replay, специфічне для постачальника, після загального очищення |
      | 41 | `validateReplayTurns` | Сувора перевірка replay-turn перед embedded runner |
      | 42 | `onModelSelected` | Callback після вибору (наприклад, telemetry) |

      Примітки щодо runtime fallback:

      - `normalizeConfig` спершу перевіряє відповідного постачальника, а потім інші hook-capable Plugins постачальників, доки один із них справді не змінить конфігурацію. Якщо жоден hook постачальника не переписує підтримуваний запис конфігурації сімейства Google, вбудований нормалізатор конфігурації Google усе одно застосовується.
      - `resolveConfigApiKey` використовує hook постачальника, коли його надано. Вбудований шлях `amazon-bedrock` також має тут вбудований AWS env-marker resolver, хоча сама runtime auth Bedrock і далі використовує типовий ланцюг AWS SDK.
      - `resolveSystemPromptContribution` дає постачальнику змогу інʼєктувати cache-aware настанови system-prompt для сімейства моделей. Надавайте йому перевагу над `before_prompt_build`, коли поведінка належить одному постачальнику/сімейству моделей і має зберігати розділення stable/dynamic cache.

      Докладні описи й реальні приклади див. у [Внутрішня архітектура: Provider Runtime Hooks](/uk/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Додайте додаткові можливості (необовʼязково)">
    ### Крок 5: Додайте додаткові можливості

    Provider Plugin може реєструвати speech, realtime transcription, realtime
    voice, media understanding, image generation, video generation, web fetch
    і web search поряд із text inference. OpenClaw класифікує це як
    **hybrid-capability** Plugin - рекомендований шаблон для Plugins компаній
    (один Plugin на постачальника). Див.
    [Внутрішня архітектура: Capability Ownership](/uk/plugins/architecture#capability-ownership-model).

    Зареєструйте кожну можливість усередині `register(api)` поряд із вашим наявним
    викликом `api.registerProvider(...)`. Виберіть лише потрібні вкладки:

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
        суфікси ідентифікаторів запитів.
      </Tab>
      <Tab title="Транскрипція в реальному часі">
        Надавайте перевагу `createRealtimeTranscriptionWebSocketSession(...)` - спільний
        допоміжний засіб обробляє захоплення проксі, відступи повторного підключення, скидання під час закриття, готові
        рукостискання, постановку аудіо в чергу та діагностику подій закриття. Ваш plugin
        лише зіставляє події upstream.

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
        `openclaw/plugin-sdk/provider-http`. Допоміжний засіб нормалізує назви файлів для завантаження,
        зокрема AAC-завантаження, яким потрібна назва файлу в стилі M4A для
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

        Оголосіть `capabilities`, щоб `talk.catalog` міг надавати допустимі режими,
        транспорти, аудіоформати та прапорці функцій браузерним і нативним клієнтам Talk.
        Реалізуйте `handleBargeIn`, коли транспорт може визначити, що
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
        Можливості відео використовують форму, **орієнтовану на режим**: `generate`,
        `imageToVideo` і `videoToVideo`. Плоских агрегованих полів на кшталт
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` недостатньо,
        щоб коректно оголошувати підтримку режимів трансформації або вимкнені режими.
        Генерація музики дотримується тієї самої схеми з явними блоками `generate` /
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

  <Step title="Тестування">
    ### Крок 6: Тестування

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

Plugins провайдерів публікуються так само, як і будь-який інший зовнішній кодовий plugin:

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

`catalog.order` керує тим, коли ваш каталог об'єднується відносно вбудованих
провайдерів:

| Порядок   | Коли          | Сценарій використання                           |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Перший прохід | Прості провайдери API-ключів                    |
| `profile` | Після simple  | Провайдери, обмежені auth profiles              |
| `paired`  | Після profile | Синтез кількох пов'язаних записів               |
| `late`    | Останній прохід | Перевизначення наявних провайдерів (перемагає при колізії) |

## Наступні кроки

- [Channel Plugins](/uk/plugins/sdk-channel-plugins) - якщо ваш plugin також надає канал
- [SDK Runtime](/uk/plugins/sdk-runtime) - допоміжні засоби `api.runtime` (TTS, пошук, субагент)
- [Огляд SDK](/uk/plugins/sdk-overview) - повний довідник імпортів підшляхів
- [Внутрішня архітектура Plugin](/uk/plugins/architecture-internals#provider-runtime-hooks) - подробиці хуків і приклади вбудованих пакетів

## Пов'язане

- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення plugins](/uk/plugins/building-plugins)
- [Створення channel plugins](/uk/plugins/sdk-channel-plugins)
