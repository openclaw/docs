---
read_when:
    - Ви створюєте новий плагін провайдера моделей
    - Ви хочете додати сумісний з OpenAI проксі або власну LLM до OpenClaw
    - Вам потрібно зрозуміти автентифікацію провайдера, каталоги та хуки середовища виконання
sidebarTitle: Provider plugins
summary: Покроковий посібник зі створення плагіна провайдера моделей для OpenClaw
title: Створення плагінів провайдерів
x-i18n:
    generated_at: "2026-04-27T11:02:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cd037c179a28ede6da91976cc886d062265e6223081da8bd19641fc20ccfedb
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Цей посібник покроково показує, як створити плагін провайдера, який додає до OpenClaw провайдера моделей
(LLM). У результаті ви отримаєте провайдера з каталогом моделей,
автентифікацією через API-ключ і динамічним визначенням моделей.

<Info>
  Якщо ви ще не створювали жодного плагіна OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins) для базової структури
  пакета та налаштування маніфесту.
</Info>

<Tip>
  Плагіни провайдерів додають моделі до звичайного циклу inference в OpenClaw. Якщо модель
  має працювати через нативний демон агента, який володіє гілками, Compaction або подіями
  інструментів, поєднайте провайдера з [agent harness](/uk/plugins/sdk-agent-harness),
  а не виносьте деталі протоколу демона в ядро.
</Tip>

## Покроковий приклад

<Steps>
  <Step title="Пакет і маніфест">
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
    облікові дані без завантаження середовища виконання вашого плагіна. Додавайте `providerAuthAliases`,
    коли варіант провайдера має повторно використовувати auth іншого ID провайдера. `modelSupport`
    необов’язковий і дає OpenClaw змогу автоматично завантажувати ваш плагін провайдера зі скорочених
    ID моделей, як-от `acme-large`, ще до появи хуків середовища виконання. Якщо ви публікуєте
    провайдера в ClawHub, поля `openclaw.compat` і `openclaw.build`
    у `package.json` є обов’язковими.

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

    Це вже робочий провайдер. Тепер користувачі можуть виконати
    `openclaw onboard --acme-ai-api-key <key>` і вибрати
    `acme-ai/acme-large` як свою модель.

    Якщо вищерозташований провайдер використовує інші керівні токени, ніж OpenClaw, додайте
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

    `input` переписує фінальний системний промпт і текстовий вміст повідомлень перед
    передаванням. `output` переписує текстові дельти асистента та фінальний текст до того,
    як OpenClaw розбере власні керівні маркери або доставку каналом.

    Для вбудованих провайдерів, які реєструють лише одного текстового провайдера з
    автентифікацією через API-ключ і одним середовищем виконання на основі каталогу, краще
    використовувати вужчий хелпер `defineSingleProviderPluginEntry(...)`:

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

    `buildProvider` — це шлях живого каталогу, який використовується, коли OpenClaw може визначити реальну
    автентифікацію провайдера. Він може виконувати специфічне для провайдера виявлення. Використовуйте
    `buildStaticProvider` лише для офлайнових рядків, які безпечно показувати до налаштування auth;
    він не повинен вимагати облікових даних або робити мережеві запити.
    Поточне відображення `models list --all` в OpenClaw виконує статичні каталоги
    лише для вбудованих плагінів провайдерів, з порожньою конфігурацією, порожнім env і без
    шляхів агента/робочого простору.

    Якщо ваш потік auth також має змінювати `models.providers.*`, псевдоніми та
    типову модель агента під час онбордингу, використовуйте готові хелпери з
    `openclaw/plugin-sdk/provider-onboard`. Найвужчі хелпери:
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли нативна кінцева точка провайдера підтримує потокові блоки usage на
    звичайному транспорті `openai-completions`, віддавайте перевагу спільним хелперам каталогу з
    `openclaw/plugin-sdk/provider-catalog-shared`, а не жорстко кодуйте перевірки ID
    провайдера. `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку з мапи можливостей кінцевої точки,
    тож нативні кінцеві точки у стилі Moonshot/DashScope теж підключаються, навіть якщо плагін використовує власний ID провайдера.

  </Step>

  <Step title="Додайте динамічне визначення моделі">
    Якщо ваш провайдер приймає довільні ID моделей (наприклад, проксі або маршрутизатор),
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

    Якщо для визначення потрібен мережевий виклик, використовуйте `prepareDynamicModel` для асинхронного
    прогріву — після його завершення `resolveDynamicModel` запускається знову.

  </Step>

  <Step title="Додайте хуки середовища виконання (за потреби)">
    Більшості провайдерів потрібні лише `catalog` + `resolveDynamicModel`. Додавайте хуки
    поступово, у міру того як цього потребуватиме ваш провайдер.

    Спільні конструктори хелперів тепер покривають найпоширеніші сімейства сумісності replay/tool,
    тож плагінам зазвичай не потрібно вручну підключати кожен хук окремо:

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

    Доступні сьогодні сімейства replay:

    | Family | Що саме він підключає | Приклади у вбудованих |
    | --- | --- | --- |
    | `openai-compatible` | Спільна політика replay у стилі OpenAI для OpenAI-сумісних транспортів, зокрема санітизація tool-call-id, виправлення порядку assistant-first і загальна перевірка Gemini-turn там, де це потрібно транспорту | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Політика replay з урахуванням Claude, яка вибирається за `modelId`, тому транспорти повідомлень Anthropic отримують очищення thinking-блоків, специфічне для Claude, лише коли визначена модель справді є Claude ID | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Нативна політика replay Gemini плюс санітизація bootstrap replay і режим tagged reasoning-output | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Санітизація thought-signature Gemini для моделей Gemini, що працюють через OpenAI-сумісні проксі-транспорти; не вмикає нативну перевірку replay Gemini або переписування bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Гібридна політика для провайдерів, які поєднують поверхні моделей Anthropic-message та OpenAI-compatible в одному плагіні; необов’язкове відкидання thinking-блоків лише для Claude лишається обмеженим стороною Anthropic | `minimax` |

    Доступні сьогодні сімейства потоків:

    | Family | Що саме він підключає | Приклади у вбудованих |
    | --- | --- | --- |
    | `google-thinking` | Нормалізація payload thinking Gemini на спільному шляху потоку | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Обгортка reasoning Kilo на спільному шляху проксі-потоку, де `kilo/auto` і непідтримувані proxy reasoning ID пропускають впроваджений thinking | `kilocode` |
    | `moonshot-thinking` | Мапінг payload нативного binary thinking Moonshot із конфігурації та рівня `/think` | `moonshot` |
    | `minimax-fast-mode` | Переписування моделі MiniMax fast-mode на спільному шляху потоку | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Спільні нативні обгортки OpenAI/Codex Responses: attribution headers, `/fast`/`serviceTier`, деталізація тексту, нативний вебпошук Codex, формування payload для сумісності reasoning та керування контекстом Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Обгортка reasoning OpenRouter для proxy-маршрутів із централізованою обробкою пропусків unsupported-model/`auto` | `openrouter` |
    | `tool-stream-default-on` | Обгортка `tool_stream`, увімкнена за замовчуванням, для провайдерів на кшталт Z.AI, які хочуть потокове передавання інструментів, якщо його явно не вимкнено | `zai` |

    <Accordion title="SDK seams, що забезпечують роботу конструкторів сімейств">
      Кожен конструктор сімейства складається з нижчорівневих публічних хелперів, експортованих із того самого пакета; їх можна використовувати, коли провайдеру потрібно вийти за межі типового шаблону:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` і сирі конструктори replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Також експортує хелпери replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) і хелпери endpoint/model (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, а також спільні обгортки OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), OpenAI-compatible обгортка DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`) і спільні proxy/provider обгортки (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, базові хелпери схем Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) і хелпери сумісності xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Вбудований плагін xAI використовує `normalizeResolvedModel` + `contributeResolvedModelCompat` разом із ними, щоб правила xAI залишалися у власності провайдера.

      Деякі потокові хелпери навмисно залишаються локальними для провайдера. `@openclaw/anthropic-provider` зберігає `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і нижчорівневі конструктори обгорток Anthropic у власному публічному seam `api.ts` / `contract-api.ts`, тому що вони кодують обробку бета-версій Claude OAuth і gating `context1m`. Плагін xAI так само зберігає формування нативних xAI Responses у власному `wrapStreamFn` (псевдоніми `/fast`, типовий `tool_stream`, очищення unsupported strict-tool, видалення payload reasoning, специфічне для xAI).

      Той самий шаблон кореня пакета також лежить в основі `@openclaw/openai-provider` (конструктори провайдера, хелпери типової моделі, конструктори realtime-провайдера) і `@openclaw/openrouter-provider` (конструктор провайдера плюс хелпери onboarding/config).
    </Accordion>

    <Tabs>
      <Tab title="Обмін токенами">
        Для провайдерів, яким потрібен обмін токенами перед кожним викликом inference:

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
      <Tab title="Власні заголовки">
        Для провайдерів, яким потрібні власні заголовки запитів або модифікації тіла:

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
      <Tab title="Ідентичність нативного транспорту">
        Для провайдерів, яким потрібні нативні заголовки запиту/сесії або метадані на
        універсальних HTTP- або WebSocket-транспортах:

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
        Для провайдерів, які надають дані про використання/білінг:

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

    <Accordion title="Усі доступні хуки провайдера">
      OpenClaw викликає хуки в такому порядку. Більшості провайдерів потрібні лише 2–3:

      | # | Hook | Коли використовувати |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей або типові значення base URL |
      | 2 | `applyConfigDefaults` | Глобальні типові значення, якими володіє провайдер, під час матеріалізації конфігурації |
      | 3 | `normalizeModelId` | Очищення застарілих/preview-псевдонімів model-id перед пошуком |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` сімейства провайдера перед складанням загальної моделі |
      | 5 | `normalizeConfig` | Нормалізація конфігурації `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Переписування сумісності нативного потокового usage для конфігурованих провайдерів |
      | 7 | `resolveConfigApiKey` | Визначення auth за env-marker, яким володіє провайдер |
      | 8 | `resolveSyntheticAuth` | Синтетична auth для локальних/self-hosted або конфігураційних випадків |
      | 9 | `shouldDeferSyntheticProfileAuth` | Опускати синтетичні placeholder-и збережених профілів нижче auth з env/config |
      | 10 | `resolveDynamicModel` | Приймати довільні ID моделей від вищого рівня |
      | 11 | `prepareDynamicModel` | Асинхронне отримання метаданих перед визначенням |
      | 12 | `normalizeResolvedModel` | Переписування транспорту перед раннером |
      | 13 | `contributeResolvedModelCompat` | Прапорці сумісності для моделей постачальника за іншим сумісним транспортом |
      | 14 | `capabilities` | Застарілий статичний набір можливостей; лише для сумісності |
      | 15 | `normalizeToolSchemas` | Очищення схем інструментів, яким володіє провайдер, перед реєстрацією |
      | 16 | `inspectToolSchemas` | Діагностика схем інструментів, якою володіє провайдер |
      | 17 | `resolveReasoningOutputMode` | Контракт tagged vs native reasoning-output |
      | 18 | `prepareExtraParams` | Типові параметри запиту |
      | 19 | `createStreamFn` | Повністю власний транспорт StreamFn |
      | 20 | `wrapStreamFn` | Обгортки власних заголовків/тіла на звичайному шляху потоку |
      | 21 | `resolveTransportTurnState` | Нативні заголовки/метадані для кожного ходу |
      | 22 | `resolveWebSocketSessionPolicy` | Нативні заголовки сесії WS/cool-down |
      | 23 | `formatApiKey` | Власна форма токена середовища виконання |
      | 24 | `refreshOAuth` | Власне оновлення OAuth |
      | 25 | `buildAuthDoctorHint` | Поради щодо відновлення auth |
      | 26 | `matchesContextOverflowError` | Визначення переповнення, яким володіє провайдер |
      | 27 | `classifyFailoverReason` | Класифікація rate-limit/перевантаження, якою володіє провайдер |
      | 28 | `isCacheTtlEligible` | Gating TTL кешу промптів |
      | 29 | `buildMissingAuthMessage` | Власна підказка про відсутню auth |
      | 30 | `suppressBuiltInModel` | Приховати застарілі рядки від вищого рівня |
      | 31 | `augmentModelCatalog` | Синтетичні рядки прямої сумісності з майбутніми версіями |
      | 32 | `resolveThinkingProfile` | Набір параметрів `/think`, специфічний для моделі |
      | 33 | `isBinaryThinking` | Сумісність binary thinking увімк./вимк. |
      | 34 | `supportsXHighThinking` | Сумісність підтримки reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Сумісність типової політики `/think` |
      | 36 | `isModernModelRef` | Відповідність live/smoke-моделей |
      | 37 | `prepareRuntimeAuth` | Обмін токенами перед inference |
      | 38 | `resolveUsageAuth` | Власний розбір облікових даних usage |
      | 39 | `fetchUsageSnapshot` | Власна кінцева точка usage |
      | 40 | `createEmbeddingProvider` | Адаптер вбудовувань для пам’яті/пошуку, яким володіє провайдер |
      | 41 | `buildReplayPolicy` | Власна політика replay/Compaction транскриптів |
      | 42 | `sanitizeReplayHistory` | Переписування replay, специфічне для провайдера, після загального очищення |
      | 43 | `validateReplayTurns` | Сувора перевірка ходів replay перед вбудованим раннером |
      | 44 | `onModelSelected` | Зворотний виклик після вибору (наприклад, телеметрія) |

      Примітки щодо резервного переходу під час виконання:

      - `normalizeConfig` спочатку перевіряє відповідний провайдер, а потім інші плагіни провайдерів із підтримкою хуків, доки хтось справді не змінить конфігурацію. Якщо жоден хук провайдера не переписує підтримуваний запис конфігурації сімейства Google, усе одно застосовується вбудований нормалізатор конфігурації Google.
      - `resolveConfigApiKey` використовує хук провайдера, коли він доступний. Вбудований шлях `amazon-bedrock` також має вбудований AWS env-marker resolver саме тут, хоча автентифікація середовища виконання Bedrock, як і раніше, використовує типовий ланцюжок AWS SDK.
      - `resolveSystemPromptContribution` дозволяє провайдеру впроваджувати cache-aware вказівки для системного промпту сімейства моделей. Віддавайте йому перевагу над `before_prompt_build`, коли поведінка належить одному провайдеру/сімейству моделей і має зберігати стабільний/динамічний поділ кешу.

      Докладні описи й реальні приклади дивіться в [Внутрішні механізми: хуки середовища виконання провайдера](/uk/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Додайте додаткові можливості (необов’язково)">
    Плагін провайдера може реєструвати синтез мовлення, транскрипцію в реальному часі, realtime
    voice, розуміння медіа, генерацію зображень, генерацію відео, web fetch
    і web search поряд зі звичайним текстовим inference. OpenClaw класифікує це як
    плагін **hybrid-capability** — рекомендований шаблон для корпоративних плагінів
    (один плагін на постачальника). Див.
    [Внутрішні механізми: володіння можливостями](/uk/plugins/architecture#capability-ownership-model).

    Реєструйте кожну можливість усередині `register(api)` поряд із наявним
    викликом `api.registerProvider(...)`. Вибирайте лише ті вкладки, які вам потрібні:

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
        плагіни спільно використовували обмежене читання тіла помилки, розбір JSON-помилок і
        суфікси request-id.
      </Tab>
      <Tab title="Транскрипція в реальному часі">
        Віддавайте перевагу `createRealtimeTranscriptionWebSocketSession(...)` — спільний
        хелпер обробляє захоплення проксі, backoff повторних підключень, flush під час закриття, ready-handshake,
        постановку аудіо в чергу та діагностику подій закриття. Ваш плагін лише відображає події вищого рівня.

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

        Провайдери пакетної STT, які надсилають multipart-аудіо через POST, мають використовувати
        `buildAudioTranscriptionFormData(...)` з
        `openclaw/plugin-sdk/provider-http`. Хелпер нормалізує
        імена файлів завантаження, зокрема AAC-завантаження, яким для
        сумісних API транскрипції потрібне ім’я файла у стилі M4A.
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
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```
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
        Можливості відео використовують **mode-aware** форму: `generate`,
        `imageToVideo` і `videoToVideo`. Плоских агрегованих полів на кшталт
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` недостатньо, щоб чисто оголосити
        підтримку режимів перетворення або вимкнені режими.
        Генерація музики використовує той самий шаблон із явними блоками `generate` /
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
      <Tab title="Web fetch і search">
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

Плагіни провайдерів публікуються так само, як і будь-які інші зовнішні кодові плагіни:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Не використовуйте тут застарілий псевдонім публікації лише для skill; пакети плагінів повинні використовувати
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

`catalog.order` визначає, коли ваш каталог об’єднується відносно вбудованих
провайдерів:

| Order     | Коли          | Випадок використання                           |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | Перший прохід | Звичайні провайдери з API-ключем               |
| `profile` | Після simple  | Провайдери, обмежені профілями auth            |
| `paired`  | Після profile | Синтез кількох пов’язаних записів              |
| `late`    | Останній прохід | Перевизначення наявних провайдерів (перемагає при конфлікті) |

## Наступні кроки

- [Плагіни каналів](/uk/plugins/sdk-channel-plugins) — якщо ваш плагін також надає канал
- [Середовище виконання SDK](/uk/plugins/sdk-runtime) — хелпери `api.runtime` (TTS, пошук, субагент)
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпорту підшляхів
- [Внутрішні механізми плагінів](/uk/plugins/architecture-internals#provider-runtime-hooks) — деталі хуків і приклади вбудованих плагінів

## Пов’язане

- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення плагінів](/uk/plugins/building-plugins)
- [Створення плагінів каналів](/uk/plugins/sdk-channel-plugins)
