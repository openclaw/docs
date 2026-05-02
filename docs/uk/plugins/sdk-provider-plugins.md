---
read_when:
    - Ви створюєте новий Plugin постачальника моделей
    - Ви хочете додати до OpenClaw проксі, сумісний з OpenAI, або власну велику мовну модель
    - Потрібно розуміти автентифікацію провайдера, каталоги та хуки часу виконання
sidebarTitle: Provider plugins
summary: Покроковий посібник зі створення Plugin постачальника моделей для OpenClaw
title: Створення Plugin-провайдерів
x-i18n:
    generated_at: "2026-05-02T20:50:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7cca1dcf2f0a34fd05c696149fef42ff8fecf1ca1fe0ccc63ba96212a9889fe
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Цей посібник показує, як створити Plugin провайдера, що додає провайдера моделей
(LLM) до OpenClaw. Наприкінці ви матимете провайдера з каталогом моделей,
автентифікацією за API-ключем і динамічним визначенням моделей.

<Info>
  Якщо ви ще не створювали жодного Plugin для OpenClaw, спершу прочитайте
  [Початок роботи](/uk/plugins/building-plugins), щоб дізнатися про базову
  структуру пакета й налаштування маніфесту.
</Info>

<Tip>
  Plugin-и провайдерів додають моделі до звичайного циклу інференсу OpenClaw. Якщо модель
  має працювати через нативний демон агента, який володіє потоками, compaction або подіями
  інструментів, поєднайте провайдера з [обв’язкою агента](/uk/plugins/sdk-agent-harness)
  замість того, щоб додавати деталі протоколу демона в ядро.
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
    облікові дані без завантаження runtime вашого Plugin. Додайте `providerAuthAliases`,
    коли варіант провайдера має повторно використовувати автентифікацію іншого id провайдера. `modelSupport`
    є необов’язковим і дає OpenClaw змогу автоматично завантажувати Plugin вашого провайдера зі скорочених
    id моделей на кшталт `acme-large` до появи runtime-хуків. Якщо ви публікуєте
    провайдера на ClawHub, ці поля `openclaw.compat` і `openclaw.build`
    обов’язкові в `package.json`.

  </Step>

  <Step title="Зареєструйте провайдера">
    Мінімальному провайдеру потрібні `id`, `label`, `auth` і `catalog`:

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

    Це робочий провайдер. Тепер користувачі можуть виконати
    `openclaw onboard --acme-ai-api-key <key>` і вибрати
    `acme-ai/acme-large` як свою модель.

    Якщо upstream-провайдер використовує інші керівні токени, ніж OpenClaw, додайте
    невелике двонапрямне текстове перетворення замість заміни шляху потоку:

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

    `input` переписує фінальний системний промпт і текстовий вміст повідомлення перед
    передаванням. `output` переписує текстові дельти асистента й фінальний текст перед тим,
    як OpenClaw розбиратиме власні керівні маркери або доставку каналу.

    Для вбудованих провайдерів, які реєструють лише одного текстового провайдера з автентифікацією
    за API-ключем і одним runtime на основі каталогу, віддавайте перевагу вужчому
    допоміжному методу `defineSingleProviderPluginEntry(...)`:

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

    `buildProvider` — це шлях live-каталогу, який використовується, коли OpenClaw може визначити реальні
    дані автентифікації провайдера. Він може виконувати виявлення, специфічне для провайдера. Використовуйте
    `buildStaticProvider` лише для офлайн-рядків, які безпечно показувати до налаштування автентифікації;
    він не повинен вимагати облікових даних або виконувати мережеві запити.
    Відображення OpenClaw `models list --all` наразі виконує статичні каталоги
    лише для вбудованих Plugin-ів провайдерів, з порожньою конфігурацією, порожнім env і без
    шляхів агента/робочого простору.

    Якщо ваш потік автентифікації також має змінювати `models.providers.*`, псевдоніми та
    стандартну модель агента під час onboarding, використовуйте preset-допоміжні методи з
    `openclaw/plugin-sdk/provider-onboard`. Найвужчі допоміжні методи:
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли нативний endpoint провайдера підтримує потокові блоки використання на
    звичайному транспорті `openai-completions`, віддавайте перевагу спільним допоміжним методам каталогу в
    `openclaw/plugin-sdk/provider-catalog-shared` замість жорстко закодованих
    перевірок id провайдера. `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку з
    мапи можливостей endpoint, тож нативні endpoint-и в стилі Moonshot/DashScope усе одно
    явно вмикаються, навіть коли Plugin використовує власний id провайдера.

  </Step>

  <Step title="Додайте динамічне визначення моделей">
    Якщо ваш провайдер приймає довільні ID моделей (як проксі або router),
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

    Якщо визначення потребує мережевого виклику, використовуйте `prepareDynamicModel` для асинхронного
    прогрівання — `resolveDynamicModel` виконується знову після його завершення.

  </Step>

  <Step title="Додайте runtime-хуки (за потреби)">
    Більшості провайдерів потрібні лише `catalog` + `resolveDynamicModel`. Додавайте хуки
    поступово, коли вони потрібні вашому провайдеру.

    Спільні допоміжні конструктори тепер покривають найпоширеніші сімейства replay/tool-compat,
    тож Plugin-и зазвичай не мають вручну під’єднувати кожен хук окремо:

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

    Доступні сімейства replay на сьогодні:

    | Сімейство | Що воно під’єднує | Вбудовані приклади |
    | --- | --- | --- |
    | `openai-compatible` | Спільна політика replay у стилі OpenAI для OpenAI-сумісних транспортів, зокрема очищення tool-call-id, виправлення порядку assistant-first і загальна валідація Gemini-turn там, де це потрібно транспорту | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Політика replay з урахуванням Claude, вибрана за `modelId`, щоб транспорти Anthropic-message отримували специфічне для Claude очищення thinking-block лише тоді, коли визначена модель справді має id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Нативна політика replay Gemini плюс очищення bootstrap replay і режим tagged reasoning-output | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Очищення thought-signature Gemini для моделей Gemini, що працюють через OpenAI-сумісні проксі-транспорти; не вмикає нативну валідацію replay Gemini або bootstrap-перезаписи | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Гібридна політика для провайдерів, які поєднують поверхні моделей Anthropic-message і OpenAI-compatible в одному Plugin; необов’язкове відкидання Claude-only thinking-block залишається обмеженим стороною Anthropic | `minimax` |

    Доступні родини потоків сьогодні:

    | Родина | Що вона підключає | Вбудовані приклади |
    | --- | --- | --- |
    | `google-thinking` | Нормалізація payload мислення Gemini у спільному шляху потоку | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Обгортка міркування Kilo у спільному проксі-шляху потоку, з пропуском інжектованого мислення для `kilo/auto` і непідтримуваних ідентифікаторів проксі-міркування | `kilocode` |
    | `moonshot-thinking` | Зіставлення нативного binary thinking payload Moonshot із конфігурації + рівня `/think` | `moonshot` |
    | `minimax-fast-mode` | Переписування моделі fast-mode MiniMax у спільному шляху потоку | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Спільні нативні обгортки OpenAI/Codex Responses: заголовки атрибуції, `/fast`/`serviceTier`, деталізація тексту, нативний вебпошук Codex, формування reasoning-compat payload і керування контекстом Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Обгортка міркування OpenRouter для проксі-маршрутів, із централізованою обробкою пропусків для непідтримуваних моделей/`auto` | `openrouter` |
    | `tool-stream-default-on` | Типово ввімкнена обгортка `tool_stream` для постачальників на кшталт Z.AI, яким потрібен потоковий режим інструментів, якщо його явно не вимкнено | `zai` |

    <Accordion title="SDK seams powering the family builders">
      Кожен конструктор родини складено з нижчорівневих публічних помічників, експортованих із того самого пакета; до них можна звернутися, коли постачальнику потрібно відхилитися від спільного шаблону:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` і сирі конструктори replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Також експортує помічники Gemini replay (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) і помічники endpoint/моделі (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, а також спільні обгортки OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), OpenAI-сумісна обгортка DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), очищення префілу мислення Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`) і спільні обгортки проксі/постачальника (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, базові помічники схем Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) і помічники сумісності xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Вбудований xAI Plugin використовує з ними `normalizeResolvedModel` + `contributeResolvedModelCompat`, щоб правила xAI залишалися у власності постачальника.

      Деякі помічники потоків навмисно залишаються локальними для постачальника. `@openclaw/anthropic-provider` тримає `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і нижчорівневі конструктори обгорток Anthropic у власному публічному шві `api.ts` / `contract-api.ts`, бо вони кодують обробку Claude OAuth beta і gating `context1m`. xAI Plugin так само тримає формування нативних xAI Responses у власному `wrapStreamFn` (аліаси `/fast`, типовий `tool_stream`, очищення непідтримуваних strict-tool, вилучення reasoning-payload, специфічне для xAI).

      Такий самий шаблон package-root також лежить в основі `@openclaw/openai-provider` (конструктори постачальника, помічники типової моделі, конструктори realtime-постачальника) і `@openclaw/openrouter-provider` (конструктор постачальника плюс помічники onboarding/конфігурації).
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
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
      <Tab title="Custom headers">
        Для постачальників, яким потрібні власні заголовки запиту або модифікації тіла:

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
        Для постачальників, яким потрібні нативні заголовки запиту/сеансу або метадані на
        загальних транспортах HTTP чи WebSocket:

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
        Для постачальників, які надають дані про використання/білінг:

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
      OpenClaw викликає hooks у такому порядку. Більшість постачальників використовує лише 2-3:
      Поля постачальника лише для сумісності, які OpenClaw більше не викликає, як-от
      `ProviderPlugin.capabilities` і `suppressBuiltInModel`, тут не наведено.

      | # | Hook | Коли використовувати |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей або типові значення базового URL |
      | 2 | `applyConfigDefaults` | Глобальні типові значення, що належать постачальнику, під час матеріалізації конфігурації |
      | 3 | `normalizeModelId` | Очищення legacy/preview псевдонімів model-id перед пошуком |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` родини постачальника перед складанням загальної моделі |
      | 5 | `normalizeConfig` | Нормалізація конфігурації `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Переписування сумісності нативного streaming-usage для конфігураційних постачальників |
      | 7 | `resolveConfigApiKey` | Розв’язання auth через env-marker, що належить постачальнику |
      | 8 | `resolveSyntheticAuth` | Синтетичний auth для локальних/self-hosted або config-backed сценаріїв |
      | 9 | `shouldDeferSyntheticProfileAuth` | Опускання синтетичних placeholder збереженого профілю після env/config auth |
      | 10 | `resolveDynamicModel` | Прийняття довільних upstream model IDs |
      | 11 | `prepareDynamicModel` | Асинхронне отримання метаданих перед розв’язанням |
      | 12 | `normalizeResolvedModel` | Переписування транспорту перед runner |
      | 13 | `contributeResolvedModelCompat` | Прапори сумісності для vendor-моделей за іншим сумісним транспортом |
      | 14 | `normalizeToolSchemas` | Очищення tool-schema, що належить постачальнику, перед реєстрацією |
      | 15 | `inspectToolSchemas` | Діагностика tool-schema, що належить постачальнику |
      | 16 | `resolveReasoningOutputMode` | Контракт tagged vs native reasoning-output |
      | 17 | `prepareExtraParams` | Типові параметри запиту |
      | 18 | `createStreamFn` | Повністю власний транспорт StreamFn |
      | 19 | `wrapStreamFn` | Власні обгортки заголовків/тіла у звичайному шляху потоку |
      | 20 | `resolveTransportTurnState` | Нативні заголовки/метадані для кожного turn |
      | 21 | `resolveWebSocketSessionPolicy` | Нативні заголовки/період охолодження сеансу WS |
      | 22 | `formatApiKey` | Власна форма runtime-токена |
      | 23 | `refreshOAuth` | Власне оновлення OAuth |
      | 24 | `buildAuthDoctorHint` | Поради з виправлення auth |
      | 25 | `matchesContextOverflowError` | Виявлення overflow, що належить постачальнику |
      | 26 | `classifyFailoverReason` | Класифікація rate-limit/overload, що належить постачальнику |
      | 27 | `isCacheTtlEligible` | Gating TTL prompt cache |
      | 28 | `buildMissingAuthMessage` | Власна підказка про відсутній auth |
      | 29 | `augmentModelCatalog` | Синтетичні рядки forward-compat |
      | 30 | `resolveThinkingProfile` | Набір опцій `/think`, специфічний для моделі |
      | 31 | `isBinaryThinking` | Сумісність увімк./вимк. binary thinking |
      | 32 | `supportsXHighThinking` | Сумісність підтримки міркування `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Сумісність типової політики `/think` |
      | 34 | `isModernModelRef` | Зіставлення live/smoke моделей |
      | 35 | `prepareRuntimeAuth` | Обмін токена перед inference |
      | 36 | `resolveUsageAuth` | Власний розбір облікових даних використання |
      | 37 | `fetchUsageSnapshot` | Власний endpoint використання |
      | 38 | `createEmbeddingProvider` | Адаптер embedding для memory/search, що належить постачальнику |
      | 39 | `buildReplayPolicy` | Власна політика replay/compaction transcript |
      | 40 | `sanitizeReplayHistory` | Переписування replay, специфічні для постачальника, після загального очищення |
      | 41 | `validateReplayTurns` | Сувора валідація replay-turn перед embedded runner |
      | 42 | `onModelSelected` | Callback після вибору (наприклад, telemetry) |

      Примітки щодо runtime fallback:

      - `normalizeConfig` спочатку перевіряє зіставленого постачальника, потім інші hook-capable Plugins постачальників, доки один із них справді не змінить конфігурацію. Якщо жоден hook постачальника не переписує підтримуваний запис конфігурації родини Google, усе одно застосовується вбудований нормалізатор конфігурації Google.
      - `resolveConfigApiKey` використовує hook постачальника, коли його надано. Вбудований шлях `amazon-bedrock` також має тут вбудований AWS env-marker resolver, хоча сам Bedrock runtime auth усе ще використовує типовий ланцюжок AWS SDK.
      - `resolveSystemPromptContribution` дає змогу постачальнику інжектувати cache-aware вказівки system-prompt для родини моделей. Надавайте йому перевагу над `before_prompt_build`, коли поведінка належить одній родині постачальника/моделі й має зберігати стабільний/динамічний поділ cache.

      Докладні описи й реальні приклади див. у [Внутрішня архітектура: Provider Runtime Hooks](/uk/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Add extra capabilities (optional)">
    ### Крок 5: Додайте додаткові можливості

    Provider Plugin може реєструвати мовлення, realtime-транскрипцію, realtime
    voice, розуміння медіа, генерацію зображень, генерацію відео, web fetch
    і вебпошук поряд із текстовим inference. OpenClaw класифікує це як
    **hybrid-capability** Plugin — рекомендований шаблон для Plugins компаній
    (один Plugin на постачальника). Див.
    [Внутрішня архітектура: Володіння можливостями](/uk/plugins/architecture#capability-ownership-model).

    Реєструйте кожну можливість усередині `register(api)` поряд із наявним
    викликом `api.registerProvider(...)`. Виберіть лише потрібні вкладки:

    <Tabs>
      <Tab title="Speech (TTS)">
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
      <Tab title="Realtime transcription">
        Надавайте перевагу `createRealtimeTranscriptionWebSocketSession(...)` — спільний
        помічник обробляє захоплення проксі, затримку повторного підключення, скидання під час закриття, ready
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

        Batch STT-провайдери, які надсилають multipart-аудіо через POST, мають використовувати
        `buildAudioTranscriptionFormData(...)` з
        `openclaw/plugin-sdk/provider-http`. Помічник нормалізує імена файлів завантаження,
        включно з AAC-завантаженнями, яким потрібне ім’я файлу в стилі M4A для
        сумісних API транскрипції.
      </Tab>
      <Tab title="Realtime voice">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
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

        Реалізуйте `handleBargeIn`, коли транспорт може визначити, що людина
        перериває відтворення помічника, а провайдер підтримує обрізання або
        очищення активної аудіовідповіді.
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
      </Tab>
      <Tab title="Image and video generation">
        Можливості відео використовують форму з урахуванням **режиму**: `generate`,
        `imageToVideo` і `videoToVideo`. Плоских агрегованих полів на кшталт
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` недостатньо,
        щоб чітко оголосити підтримку режиму перетворення або вимкнені режими.
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

Provider plugins публікуються так само, як і будь-який інший зовнішній code plugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Не використовуйте тут застарілий псевдонім публікації лише для skill; пакети plugins мають використовувати
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

| Порядок   | Коли           | Варіант використання                            |
| --------- | -------------- | ----------------------------------------------- |
| `simple`  | Перший прохід  | Звичайні провайдери з API-ключем                |
| `profile` | Після simple   | Провайдери, обмежені auth profiles              |
| `paired`  | Після profile  | Синтез кількох пов’язаних записів               |
| `late`    | Останній прохід | Перевизначення наявних провайдерів (перемагає при конфлікті) |

## Наступні кроки

- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — якщо ваш plugin також надає канал
- [SDK Runtime](/uk/plugins/sdk-runtime) — помічники `api.runtime` (TTS, пошук, subagent)
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпорту subpath
- [Внутрішня архітектура plugins](/uk/plugins/architecture-internals#provider-runtime-hooks) — подробиці hooks і вбудовані приклади

## Пов’язане

- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення plugins](/uk/plugins/building-plugins)
- [Створення channel plugins](/uk/plugins/sdk-channel-plugins)
