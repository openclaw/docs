---
read_when:
    - Ви створюєте новий Plugin постачальника моделей
    - Ви хочете додати до OpenClaw OpenAI-сумісний проксі або власну LLM
    - Потрібно розуміти автентифікацію провайдерів, каталоги та хуки часу виконання
sidebarTitle: Provider plugins
summary: Покроковий посібник зі створення Plugin постачальника моделей для OpenClaw
title: Створення Plugin постачальників
x-i18n:
    generated_at: "2026-04-29T04:06:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1404594fe1d1e11a612f903512c1002c8f3a804dee53d4204457b534eae93381
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Цей посібник проводить через створення provider plugin, який додає постачальника моделей
(LLM) до OpenClaw. Наприкінці ви матимете постачальника з каталогом моделей,
автентифікацією за API-ключем і динамічним розпізнаванням моделей.

<Info>
  Якщо ви ще не створювали жодного OpenClaw plugin, спершу прочитайте
  [Початок роботи](/uk/plugins/building-plugins), щоб ознайомитися з базовою
  структурою пакета та налаштуванням manifest.
</Info>

<Tip>
  Provider plugins додають моделі до звичайного циклу inference OpenClaw. Якщо модель
  має працювати через нативний демон агента, який володіє потоками, compaction або подіями
  інструментів, поєднайте provider з [agent harness](/uk/plugins/sdk-agent-harness)
  замість того, щоб розміщувати деталі протоколу демона в core.
</Tip>

## Покроковий посібник

<Steps>
  <Step title="Пакет і manifest">
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

    Manifest оголошує `providerAuthEnvVars`, щоб OpenClaw міг виявляти
    облікові дані без завантаження runtime вашого plugin. Додайте `providerAuthAliases`,
    коли варіант provider має повторно використовувати auth іншого id provider. `modelSupport`
    є необов’язковим і дає OpenClaw змогу автоматично завантажувати ваш provider plugin зі скорочених
    id моделей на кшталт `acme-large` до появи runtime hooks. Якщо ви публікуєте
    provider на ClawHub, ці поля `openclaw.compat` і `openclaw.build`
    є обов’язковими в `package.json`.

  </Step>

  <Step title="Зареєструйте provider">
    Мінімальний provider потребує `id`, `label`, `auth` і `catalog`:

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

    Якщо upstream provider використовує інші керівні токени, ніж OpenClaw, додайте
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

    `input` переписує остаточний системний prompt і текстовий вміст повідомлення перед
    transport. `output` переписує текстові deltas асистента та фінальний текст перед тим,
    як OpenClaw розбирає власні керівні маркери або доставку в channel.

    Для bundled providers, які реєструють лише один text provider з API-key
    auth плюс один catalog-backed runtime, надавайте перевагу вужчому
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

    `buildProvider` — це live catalog path, який використовується, коли OpenClaw може розпізнати справжню
    auth provider. Він може виконувати специфічне для provider виявлення. Використовуйте
    `buildStaticProvider` лише для offline rows, які безпечно показувати до налаштування auth;
    він не повинен вимагати облікових даних або виконувати мережеві запити.
    Відображення `models list --all` в OpenClaw наразі виконує static catalogs
    лише для bundled provider plugins, з порожньою config, порожнім env і без
    шляхів agent/workspace.

    Якщо ваш auth flow також має змінювати `models.providers.*`, aliases і
    типову модель агента під час onboarding, використовуйте preset helpers з
    `openclaw/plugin-sdk/provider-onboard`. Найвужчі helpers:
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли нативний endpoint provider підтримує streamed usage blocks на
    звичайному transport `openai-completions`, надавайте перевагу спільним catalog helpers у
    `openclaw/plugin-sdk/provider-catalog-shared` замість жорстко закодованих
    перевірок provider-id. `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку з
    endpoint capability map, тому нативні endpoints у стилі Moonshot/DashScope все ще
    opt in, навіть коли plugin використовує власний id provider.

  </Step>

  <Step title="Додайте динамічне розпізнавання моделей">
    Якщо ваш provider приймає довільні model IDs (наприклад, proxy або router),
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

    Якщо розпізнавання потребує мережевого виклику, використовуйте `prepareDynamicModel` для async
    warm-up — `resolveDynamicModel` виконується знову після його завершення.

  </Step>

  <Step title="Додайте runtime hooks (за потреби)">
    Більшості providers потрібні лише `catalog` + `resolveDynamicModel`. Додавайте hooks
    поступово, коли вони потрібні вашому provider.

    Спільні helper builders тепер покривають найпоширеніші сімейства replay/tool-compat,
    тому plugins зазвичай не потрібно вручну з’єднувати кожен hook окремо:

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

    Доступні replay families наразі:

    | Сімейство | Що воно під’єднує | Bundled приклади |
    | --- | --- | --- |
    | `openai-compatible` | Спільна replay policy у стилі OpenAI для OpenAI-compatible transports, включно з санітизацією tool-call-id, виправленнями assistant-first ordering і загальною Gemini-turn validation там, де transport цього потребує | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Claude-aware replay policy, вибрана за `modelId`, тож Anthropic-message transports отримують специфічне для Claude очищення thinking-block лише тоді, коли розпізнана модель насправді має Claude id | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Нативна Gemini replay policy плюс bootstrap replay sanitation і tagged reasoning-output mode | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Gemini thought-signature sanitation для моделей Gemini, що працюють через OpenAI-compatible proxy transports; не вмикає нативну Gemini replay validation або bootstrap rewrites | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Гібридна policy для providers, які змішують Anthropic-message і OpenAI-compatible model surfaces в одному plugin; необов’язкове Claude-only dropping thinking-block залишається scoped до сторони Anthropic | `minimax` |

    Доступні stream families наразі:

    | Сімейство | Що підключає | Вбудовані приклади |
    | --- | --- | --- |
    | `google-thinking` | Нормалізація корисного навантаження мислення Gemini на спільному шляху потоку | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Обгортка міркування Kilo на спільному шляху потоку проксі, з пропуском вставленого мислення для `kilo/auto` і непідтримуваних ID міркування проксі | `kilocode` |
    | `moonshot-thinking` | Зіставлення корисного навантаження бінарного нативного мислення Moonshot із конфігурації + рівня `/think` | `moonshot` |
    | `minimax-fast-mode` | Перезапис моделі швидкого режиму MiniMax на спільному шляху потоку | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Спільні нативні обгортки OpenAI/Codex Responses: заголовки атрибуції, `/fast`/`serviceTier`, докладність тексту, нативний вебпошук Codex, формування корисного навантаження сумісності міркувань і керування контекстом Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Обгортка міркування OpenRouter для маршрутів проксі, із централізованою обробкою пропусків для непідтримуваних моделей/`auto` | `openrouter` |
    | `tool-stream-default-on` | Увімкнена за замовчуванням обгортка `tool_stream` для провайдерів на кшталт Z.AI, яким потрібне потокове передавання інструментів, якщо його явно не вимкнено | `zai` |

    <Accordion title="Точки інтеграції SDK, що забезпечують побудовники сімейств">
      Кожен побудовник сімейства складається з нижчорівневих публічних допоміжних функцій, експортованих із того самого пакета; до них можна звернутися, коли провайдеру потрібно відхилитися від спільного шаблону:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` і базові побудовники відтворення (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Також експортує допоміжні функції відтворення Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) і допоміжні функції кінцевих точок/моделей (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, а також спільні обгортки OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), сумісна з OpenAI обгортка DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), очищення передзаповнення мислення Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`) і спільні обгортки проксі/провайдера (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, базові допоміжні функції схем Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) і допоміжні функції сумісності xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Вбудований Plugin xAI використовує `normalizeResolvedModel` + `contributeResolvedModelCompat` разом із ними, щоб правила xAI залишалися у власності провайдера.

      Деякі допоміжні функції потоків навмисно залишаються локальними для провайдера. `@openclaw/anthropic-provider` тримає `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і нижчорівневі побудовники обгорток Anthropic у власній публічній точці інтеграції `api.ts` / `contract-api.ts`, бо вони кодують обробку бета Claude OAuth і керування доступом `context1m`. Plugin xAI так само тримає нативне формування Responses xAI у власному `wrapStreamFn` (псевдоніми `/fast`, стандартний `tool_stream`, очищення непідтримуваних суворих інструментів, специфічне для xAI видалення корисного навантаження міркувань).

      Той самий шаблон кореня пакета також лежить в основі `@openclaw/openai-provider` (побудовники провайдера, допоміжні функції моделей за замовчуванням, побудовники провайдера реального часу) і `@openclaw/openrouter-provider` (побудовник провайдера плюс допоміжні функції початкового налаштування/конфігурації).
    </Accordion>

    <Tabs>
      <Tab title="Обмін токена">
        Для провайдерів, яким потрібен обмін токена перед кожним викликом інференсу:

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
        Для провайдерів, яким потрібні користувацькі заголовки запиту або модифікації тіла:

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
        Для провайдерів, яким потрібні нативні заголовки запиту/сесії або метадані на
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
      OpenClaw викликає хуки в такому порядку. Більшість провайдерів використовують лише 2-3:
      Поля провайдера лише для сумісності, які OpenClaw більше не викликає, як-от
      `ProviderPlugin.capabilities` і `suppressBuiltInModel`, тут не перелічено.

      | # | Хук | Коли використовувати |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей або стандартні значення базового URL |
      | 2 | `applyConfigDefaults` | Глобальні стандартні значення, що належать провайдеру, під час матеріалізації конфігурації |
      | 3 | `normalizeModelId` | Очищення застарілих/попередніх псевдонімів ID моделі перед пошуком |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` сімейства провайдера перед загальним складанням моделі |
      | 5 | `normalizeConfig` | Нормалізація конфігурації `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Перезаписи сумісності нативного обліку використання в потоковому режимі для конфігураційних провайдерів |
      | 7 | `resolveConfigApiKey` | Розв'язання автентифікації через env-маркер, що належить провайдеру |
      | 8 | `resolveSyntheticAuth` | Локальна/самостійно розміщена або підтримана конфігурацією синтетична автентифікація |
      | 9 | `shouldDeferSyntheticProfileAuth` | Пониження пріоритету синтетичних заповнювачів збереженого профілю відносно env/config auth |
      | 10 | `resolveDynamicModel` | Приймати довільні ID моделей від вихідного провайдера |
      | 11 | `prepareDynamicModel` | Асинхронне отримання метаданих перед розв'язанням |
      | 12 | `normalizeResolvedModel` | Перезаписи транспорту перед виконавцем |
      | 13 | `contributeResolvedModelCompat` | Прапорці сумісності для моделей вендора за іншим сумісним транспортом |
      | 14 | `normalizeToolSchemas` | Очищення схем інструментів, що належить провайдеру, перед реєстрацією |
      | 15 | `inspectToolSchemas` | Діагностика схем інструментів, що належить провайдеру |
      | 16 | `resolveReasoningOutputMode` | Контракт тегованого й нативного виводу міркувань |
      | 17 | `prepareExtraParams` | Параметри запиту за замовчуванням |
      | 18 | `createStreamFn` | Повністю користувацький транспорт StreamFn |
      | 19 | `wrapStreamFn` | Користувацькі обгортки заголовків/тіла на звичайному шляху потоку |
      | 20 | `resolveTransportTurnState` | Нативні заголовки/метадані для кожного ходу |
      | 21 | `resolveWebSocketSessionPolicy` | Нативні заголовки сесії WS / період охолодження |
      | 22 | `formatApiKey` | Користувацька форма токена під час виконання |
      | 23 | `refreshOAuth` | Користувацьке оновлення OAuth |
      | 24 | `buildAuthDoctorHint` | Поради з виправлення автентифікації |
      | 25 | `matchesContextOverflowError` | Виявлення переповнення, що належить провайдеру |
      | 26 | `classifyFailoverReason` | Класифікація обмеження частоти/перевантаження, що належить провайдеру |
      | 27 | `isCacheTtlEligible` | Обмеження TTL кешу підказок |
      | 28 | `buildMissingAuthMessage` | Користувацька підказка про відсутню автентифікацію |
      | 29 | `augmentModelCatalog` | Синтетичні рядки прямої сумісності |
      | 30 | `resolveThinkingProfile` | Набір опцій `/think`, специфічний для моделі |
      | 31 | `isBinaryThinking` | Сумісність увімкнення/вимкнення бінарного мислення |
      | 32 | `supportsXHighThinking` | Сумісність підтримки міркування `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Сумісність політики `/think` за замовчуванням |
      | 34 | `isModernModelRef` | Зіставлення моделей для живих/димових перевірок |
      | 35 | `prepareRuntimeAuth` | Обмін токена перед інференсом |
      | 36 | `resolveUsageAuth` | Користувацький розбір облікових даних використання |
      | 37 | `fetchUsageSnapshot` | Користувацька кінцева точка використання |
      | 38 | `createEmbeddingProvider` | Адаптер векторних представлень для пам'яті/пошуку, що належить провайдеру |
      | 39 | `buildReplayPolicy` | Користувацька політика відтворення/Compaction транскрипта |
      | 40 | `sanitizeReplayHistory` | Специфічні для провайдера перезаписи відтворення після загального очищення |
      | 41 | `validateReplayTurns` | Сувора валідація ходів відтворення перед вбудованим виконавцем |
      | 42 | `onModelSelected` | Зворотний виклик після вибору (наприклад, телеметрія) |

      Примітки щодо резервної поведінки під час виконання:

      - `normalizeConfig` спершу перевіряє відповідного провайдера, а потім інші Plugin провайдерів із підтримкою хуків, доки один із них фактично не змінить конфігурацію. Якщо жоден хук провайдера не переписує підтримуваний запис конфігурації сімейства Google, усе одно застосовується вбудований нормалізатор конфігурації Google.
      - `resolveConfigApiKey` використовує хук провайдера, коли його надано. Вбудований шлях `amazon-bedrock` також має тут вбудований розв'язувач env-маркерів AWS, хоча сама автентифікація Bedrock під час виконання все ще використовує стандартний ланцюжок AWS SDK.
      - `resolveSystemPromptContribution` дає провайдеру змогу додавати рекомендації для системної підказки з урахуванням кешу для сімейства моделей. Надавайте йому перевагу над `before_prompt_build`, коли поведінка належить одному провайдеру/сімейству моделей і має зберігати стабільний/динамічний поділ кешу.

      Докладні описи й реальні приклади див. у [Внутрішня архітектура: хуки провайдера під час виконання](/uk/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Додайте додаткові можливості (необов'язково)">
    Plugin провайдера може реєструвати мовлення, транскрипцію в реальному часі, голос у реальному часі, розуміння медіа, генерацію зображень, генерацію відео, отримання вебданих
    і вебпошук разом із текстовим інференсом. OpenClaw класифікує це як
    Plugin **гібридних можливостей** — рекомендований шаблон для Plugin компаній
    (один Plugin на вендора). Див.
    [Внутрішня архітектура: володіння можливостями](/uk/plugins/architecture#capability-ownership-model).

    Реєструйте кожну можливість усередині `register(api)` поруч із наявним
    викликом `api.registerProvider(...)`. Вибирайте лише потрібні вкладки:

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
        plugins спільно використовували обмежене читання тіла помилки, парсинг JSON-помилок і
        суфікси request-id.
      </Tab>
      <Tab title="Транскрипція в реальному часі">
        Надавайте перевагу `createRealtimeTranscriptionWebSocketSession(...)` — спільний
        helper обробляє захоплення proxy, затримку повторного підключення, скидання під час закриття, готові
        handshakes, постановку audio в чергу та діагностику close-event. Ваш plugin
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

        Batch-провайдери STT, які POST-ять multipart audio, мають використовувати
        `buildAudioTranscriptionFormData(...)` з
        `openclaw/plugin-sdk/provider-http`. Цей helper нормалізує імена файлів для завантаження,
        зокрема AAC-завантаження, яким потрібна назва файлу у стилі M4A для
        сумісних API транскрипції.
      </Tab>
      <Tab title="Голос у реальному часі">
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
        Можливості відео використовують форму з урахуванням **режиму**: `generate`,
        `imageToVideo` і `videoToVideo`. Плоских агрегованих полів на кшталт
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` недостатньо,
        щоб явно оголосити підтримку режиму transform або вимкнені режими.
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
      <Tab title="Веб-отримання та пошук">
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

Provider plugins публікуються так само, як і будь-який інший зовнішній code plugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Не використовуйте тут застарілий alias публікації лише для skill; пакети plugin мають використовувати
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

| Порядок   | Коли            | Сценарій використання                           |
| --------- | --------------- | ----------------------------------------------- |
| `simple`  | Перший прохід   | Звичайні провайдери API-key                     |
| `profile` | Після simple    | Провайдери, обмежені auth profiles              |
| `paired`  | Після profile   | Синтез кількох пов’язаних записів               |
| `late`    | Останній прохід | Перевизначення наявних провайдерів (перемагає при колізії) |

## Наступні кроки

- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — якщо ваш plugin також надає канал
- [SDK Runtime](/uk/plugins/sdk-runtime) — helper-и `api.runtime` (TTS, search, subagent)
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпорту subpath
- [Внутрішня архітектура Plugin](/uk/plugins/architecture-internals#provider-runtime-hooks) — деталі hook і bundled приклади

## Пов’язане

- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення plugins](/uk/plugins/building-plugins)
- [Створення channel plugins](/uk/plugins/sdk-channel-plugins)
