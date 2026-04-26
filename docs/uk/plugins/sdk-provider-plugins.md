---
read_when:
    - Ви створюєте новий Plugin провайдера моделі
    - Ви хочете додати до OpenClaw OpenAI-сумісний проксі або власну LLM
    - Вам потрібно зрозуміти автентифікацію провайдера, каталоги та runtime hooks
sidebarTitle: Provider plugins
summary: Покроковий посібник зі створення Plugin провайдера моделі для OpenClaw
title: Створення Plugin провайдерів
x-i18n:
    generated_at: "2026-04-26T01:43:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 987ff69584a3e076189770c253ce48191103b5224e12216fd3d2fc03608ca240
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Цей посібник покроково пояснює, як створити Plugin провайдера, який додає провайдера моделі
(LLM) до OpenClaw. Наприкінці у вас буде провайдер із каталогом моделей,
автентифікацією за API-ключем і динамічним визначенням моделі.

<Info>
  Якщо ви раніше не створювали жодного Plugin для OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins), щоб ознайомитися з базовою
  структурою пакета та налаштуванням маніфесту.
</Info>

<Tip>
  Plugin провайдерів додають моделі до стандартного циклу інференсу OpenClaw. Якщо модель
  має працювати через нативний демон агента, який керує потоками, Compaction або подіями
  інструментів, поєднайте провайдера з [agent harness](/uk/plugins/sdk-agent-harness),
  а не вбудовуйте деталі протоколу демона в core.
</Tip>

## Покроковий розбір

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
    облікові дані без завантаження runtime вашого Plugin. Додавайте `providerAuthAliases`,
    коли варіант провайдера має повторно використовувати автентифікацію іншого id провайдера. `modelSupport`
    є необов’язковим і дозволяє OpenClaw автоматично завантажувати ваш Plugin провайдера зі скорочених
    id моделей, як-от `acme-large`, ще до появи runtime hooks. Якщо ви публікуєте
    провайдера в ClawHub, поля `openclaw.compat` і `openclaw.build`
    є обов’язковими в `package.json`.

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

    Якщо провайдер вище за потоком використовує інші керівні токени, ніж OpenClaw, додайте
    невелике двоспрямоване текстове перетворення замість заміни шляху потоку:

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

    `input` переписує фінальний системний prompt і текстовий вміст повідомлень перед
    передаванням. `output` переписує текстові дельти асистента і фінальний текст до того, як
    OpenClaw розбере власні керівні маркери або доставку через канал.

    Для вбудованих провайдерів, які реєструють лише один текстовий провайдер з
    автентифікацією за API-ключем плюс один runtime з підтримкою каталогу, віддавайте перевагу
    вужчому допоміжному методу `defineSingleProviderPluginEntry(...)`:

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

    `buildProvider` — це шлях живого каталогу, який використовується, коли OpenClaw може визначити справжню
    автентифікацію провайдера. Він може виконувати специфічне для провайдера виявлення. Використовуйте
    `buildStaticProvider` лише для офлайнових рядків, які безпечно показувати до налаштування
    автентифікації; він не повинен вимагати облікових даних або виконувати мережеві запити.
    Відображення `models list --all` в OpenClaw зараз виконує статичні каталоги
    лише для вбудованих Plugin провайдерів, з порожньою конфігурацією, порожнім env і без
    шляхів агента/робочого простору.

    Якщо вашому потоку автентифікації також потрібно змінювати `models.providers.*`, псевдоніми та
    модель агента за замовчуванням під час онбордингу, використовуйте готові допоміжні методи з
    `openclaw/plugin-sdk/provider-onboard`. Найвужчі допоміжні методи:
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли нативна кінцева точка провайдера підтримує потокові блоки використання в
    звичайному транспорті `openai-completions`, віддавайте перевагу спільним допоміжним методам каталогу з
    `openclaw/plugin-sdk/provider-catalog-shared`, а не жорсткому кодуванню перевірок id провайдера.
    `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку з карти можливостей кінцевої точки,
    тому нативні кінцеві точки у стилі Moonshot/DashScope також залишаються включеними, навіть коли Plugin використовує
    власний id провайдера.

  </Step>

  <Step title="Додайте динамічне визначення моделі">
    Якщо ваш провайдер приймає довільні id моделей, (як-от проксі або маршрутизатор),
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

  <Step title="Додайте runtime hooks (за потреби)">
    Більшості провайдерів достатньо `catalog` + `resolveDynamicModel`. Додавайте hooks
    поступово, залежно від потреб вашого провайдера.

    Спільні допоміжні конструктори тепер охоплюють найпоширеніші сімейства replay/tool-compat,
    тому Plugin зазвичай не потрібно вручну підключати кожен hook окремо:

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

    | Сімейство | Що воно підключає | Вбудовані приклади |
    | --- | --- | --- |
    | `openai-compatible` | Спільна політика replay у стилі OpenAI для OpenAI-сумісних транспортів, включно з санітизацією id викликів інструментів, виправленнями порядку assistant-first і загальною валідацією Gemini-turn там, де це потрібно транспорту | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Політика replay з урахуванням Claude, вибрана за `modelId`, щоб транспорти повідомлень Anthropic отримували очищення thinking-block, специфічне для Claude, лише коли визначена модель справді має id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Нативна політика replay Gemini плюс санітизація bootstrap replay і режим виводу reasoning з тегами | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Санітизація thought-signature Gemini для моделей Gemini, що працюють через OpenAI-сумісні проксі-транспорти; не вмикає нативну валідацію replay Gemini або переписування bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Гібридна політика для провайдерів, які поєднують поверхні моделей Anthropiс-message і OpenAI-compatible в одному Plugin; необов’язкове відкидання thinking-block лише для Claude лишається обмеженим стороною Anthropic | `minimax` |

    Доступні сімейства потоків на сьогодні:

    | Сімейство | Що воно підключає | Вбудовані приклади |
    | --- | --- | --- |
    | `google-thinking` | Нормалізація payload thinking Gemini на спільному шляху потоку | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Обгортка reasoning Kilo на спільному шляху проксі-потоку, де `kilo/auto` і непідтримувані id reasoning проксі пропускають ін’єкований thinking | `kilocode` |
    | `moonshot-thinking` | Відображення бінарного payload native-thinking Moonshot з конфігурації + рівня `/think` | `moonshot` |
    | `minimax-fast-mode` | Переписування моделі MiniMax fast-mode на спільному шляху потоку | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Спільні нативні обгортки OpenAI/Codex Responses: заголовки атрибуції, `/fast`/`serviceTier`, детальність тексту, нативний вебпошук Codex, формування payload для сумісності reasoning і керування контекстом Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Обгортка reasoning OpenRouter для маршрутів проксі, де пропуски для непідтримуваних моделей/`auto` обробляються централізовано | `openrouter` |
    | `tool-stream-default-on` | Обгортка `tool_stream`, увімкнена за замовчуванням, для провайдерів на кшталт Z.AI, яким потрібен потоковий режим інструментів, якщо його явно не вимкнено | `zai` |

    <Accordion title="SDK seams, які лежать в основі конструкторів сімейств">
      Кожен конструктор сімейства складається з нижчорівневих публічних допоміжних методів, експортованих із того самого пакета, до яких можна звернутися, коли провайдеру потрібно відійти від типового шаблону:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` і сирі конструктори replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Також експортує допоміжні методи replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) і допоміжні методи для endpoint/моделей (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, а також спільні обгортки OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), OpenAI-сумісна обгортка DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`) і спільні обгортки проксі/провайдера (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, базові допоміжні методи схем Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) і допоміжні методи сумісності xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Вбудований Plugin xAI використовує `normalizeResolvedModel` + `contributeResolvedModelCompat` разом із ними, щоб правила xAI залишалися у власності провайдера.

      Деякі допоміжні методи потоків навмисно залишаються локальними для провайдера. `@openclaw/anthropic-provider` тримає `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і низькорівневі конструктори обгорток Anthropic у власному публічному seam `api.ts` / `contract-api.ts`, оскільки вони кодують обробку Claude OAuth beta і gating `context1m`. Plugin xAI так само зберігає формування нативних xAI Responses у власному `wrapStreamFn` (`/fast` aliases, `tool_stream` за замовчуванням, очищення непідтримуваних strict-tool, видалення payload reasoning, специфічного для xAI).

      Той самий шаблон на рівні кореня пакета також лежить в основі `@openclaw/openai-provider` (конструктори провайдера, допоміжні методи моделі за замовчуванням, конструктори realtime-провайдера) і `@openclaw/openrouter-provider` (конструктор провайдера плюс допоміжні методи онбордингу/конфігурації).
    </Accordion>

    <Tabs>
      <Tab title="Обмін токенів">
        Для провайдерів, яким потрібен обмін токенів перед кожним викликом інференсу:

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
      <Tab title="Ідентичність нативного транспорту">
        Для провайдерів, яким потрібні нативні заголовки запиту/сеансу або метадані в
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

    <Accordion title="Усі доступні hooks провайдера">
      OpenClaw викликає hooks у такому порядку. Більшість провайдерів використовують лише 2–3:

      | # | Hook | Коли використовувати |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей або базові значення `baseUrl` |
      | 2 | `applyConfigDefaults` | Глобальні значення за замовчуванням, якими керує провайдер, під час матеріалізації конфігурації |
      | 3 | `normalizeModelId` | Очищення legacy/preview aliases id моделі перед пошуком |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` сімейства провайдера перед загальним збиранням моделі |
      | 5 | `normalizeConfig` | Нормалізація конфігурації `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Переписування сумісності native streaming-usage для конфігураційних провайдерів |
      | 7 | `resolveConfigApiKey` | Визначення автентифікації маркера env, яким керує провайдер |
      | 8 | `resolveSyntheticAuth` | Синтетична автентифікація local/self-hosted або з конфігурації |
      | 9 | `shouldDeferSyntheticProfileAuth` | Опускання синтетичних placeholder збереженого профілю нижче за автентифікацію env/config |
      | 10 | `resolveDynamicModel` | Прийом довільних id моделей вищого рівня |
      | 11 | `prepareDynamicModel` | Асинхронне отримання метаданих перед визначенням |
      | 12 | `normalizeResolvedModel` | Переписування транспорту перед runner |
      | 13 | `contributeResolvedModelCompat` | Прапорці сумісності для моделей вендора за іншим сумісним транспортом |
      | 14 | `capabilities` | Legacy статичний набір можливостей; лише для сумісності |
      | 15 | `normalizeToolSchemas` | Очищення схем інструментів, яким керує провайдер, перед реєстрацією |
      | 16 | `inspectToolSchemas` | Діагностика схем інструментів, якою керує провайдер |
      | 17 | `resolveReasoningOutputMode` | Контракт tagged vs native reasoning-output |
      | 18 | `prepareExtraParams` | Параметри запиту за замовчуванням |
      | 19 | `createStreamFn` | Повністю власний транспорт StreamFn |
      | 20 | `wrapStreamFn` | Обгортки власних заголовків/тіла на звичайному шляху потоку |
      | 21 | `resolveTransportTurnState` | Нативні заголовки/метадані для кожного turn |
      | 22 | `resolveWebSocketSessionPolicy` | Нативні заголовки сеансу WS / cool-down |
      | 23 | `formatApiKey` | Власна форма runtime-токена |
      | 24 | `refreshOAuth` | Власне оновлення OAuth |
      | 25 | `buildAuthDoctorHint` | Підказка з відновлення автентифікації |
      | 26 | `matchesContextOverflowError` | Визначення переповнення, яким керує провайдер |
      | 27 | `classifyFailoverReason` | Класифікація rate-limit/overload, якою керує провайдер |
      | 28 | `isCacheTtlEligible` | Gating TTL кешу prompt |
      | 29 | `buildMissingAuthMessage` | Власна підказка про відсутню автентифікацію |
      | 30 | `suppressBuiltInModel` | Приховування застарілих рядків вищого рівня |
      | 31 | `augmentModelCatalog` | Синтетичні рядки для forward-compat |
      | 32 | `resolveThinkingProfile` | Набір опцій `/think`, специфічний для моделі |
      | 33 | `isBinaryThinking` | Сумісність двійкового вмикання/вимикання thinking |
      | 34 | `supportsXHighThinking` | Сумісність підтримки reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Сумісність політики `/think` за замовчуванням |
      | 36 | `isModernModelRef` | Відповідність live/smoke моделей |
      | 37 | `prepareRuntimeAuth` | Обмін токенів перед інференсом |
      | 38 | `resolveUsageAuth` | Власний розбір облікових даних використання |
      | 39 | `fetchUsageSnapshot` | Власна кінцева точка використання |
      | 40 | `createEmbeddingProvider` | Адаптер embeddings, яким керує провайдер, для пам’яті/пошуку |
      | 41 | `buildReplayPolicy` | Власна політика replay/Compaction стенограми |
      | 42 | `sanitizeReplayHistory` | Переписування replay, специфічне для провайдера, після загального очищення |
      | 43 | `validateReplayTurns` | Сувора валідація turn replay перед вбудованим runner |
      | 44 | `onModelSelected` | Зворотний виклик після вибору моделі (наприклад, телеметрія) |

      Примітки щодо runtime fallback:

      - `normalizeConfig` спочатку перевіряє відповідний провайдер, а потім інші Plugin провайдерів із підтримкою hooks, доки один із них справді не змінить конфігурацію. Якщо жоден hook провайдера не перепише підтримуваний запис конфігурації сімейства Google, усе одно застосовується вбудований нормалізатор конфігурації Google.
      - `resolveConfigApiKey` використовує hook провайдера, якщо він доступний. Вбудований шлях `amazon-bedrock` також має тут вбудований resolver AWS env-marker, хоча сама runtime-автентифікація Bedrock і далі використовує стандартний ланцюжок AWS SDK.
      - `resolveSystemPromptContribution` дозволяє провайдеру впроваджувати системні вказівки prompt з урахуванням кешу для сімейства моделей. Віддавайте йому перевагу над `before_prompt_build`, коли поведінка належить одному провайдеру/сімейству моделей і має зберігати стабільний/динамічний поділ кешу.

      Детальні описи та реальні приклади дивіться в [Внутрішні механізми: runtime hooks провайдера](/uk/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Додайте додаткові можливості (необов’язково)">
    Plugin провайдера може реєструвати синтез мовлення, транскрибування в realtime,
    голос у realtime, розуміння медіа, генерацію зображень, генерацію відео, web fetch
    і вебпошук разом із текстовим інференсом. OpenClaw класифікує це як
    Plugin **hybrid-capability** — рекомендований шаблон для корпоративних Plugin
    (один Plugin на вендора). Див.
    [Внутрішні механізми: володіння можливостями](/uk/plugins/architecture#capability-ownership-model).

    Реєструйте кожну можливість усередині `register(api)` поряд із вашим наявним
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
        Plugin спільно використовували обмежене читання тіла помилки, розбір помилок JSON і
        суфікси request-id.
      </Tab>
      <Tab title="Транскрибування в realtime">
        Віддавайте перевагу `createRealtimeTranscriptionWebSocketSession(...)` — спільний
        допоміжний метод обробляє перехоплення проксі, backoff при повторному з’єднанні, flush під час закриття, готові handshake,
        чергування аудіо та діагностику подій закриття. Ваш Plugin
        лише відображає події вищого рівня.

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

        Для пакетних провайдерів STT, які надсилають multipart-аудіо через POST, слід використовувати
        `buildAudioTranscriptionFormData(...)` з
        `openclaw/plugin-sdk/provider-http`. Цей допоміжний метод нормалізує імена
        файлів для завантаження, зокрема завантаження AAC, яким потрібне ім’я файлу у стилі M4A для
        сумісних API транскрибування.
      </Tab>
      <Tab title="Голос у realtime">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
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
        Можливості відео використовують форму з урахуванням **режимів**: `generate`,
        `imageToVideo` і `videoToVideo`. Плоских агрегованих полів, таких як
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds`, недостатньо,
        щоб коректно оголошувати підтримку режимів перетворення або вимкнені режими.
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
      <Tab title="Web fetch і пошук">
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

Plugin провайдерів публікуються так само, як і будь-який інший зовнішній кодовий Plugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Не використовуйте тут застарілий псевдонім публікації лише для Skills; пакети Plugin мають використовувати
`clawhub package publish`.

## Структура файлів

```
<bundled-plugin-root>/acme-ai/
├── package.json              # метадані openclaw.providers
├── openclaw.plugin.json      # маніфест із метаданими автентифікації провайдера
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # тести
    └── usage.ts              # endpoint використання (необов’язково)
```

## Довідка щодо порядку каталогу

`catalog.order` визначає, коли ваш каталог об’єднується відносно вбудованих
провайдерів:

| Порядок   | Коли          | Випадок використання                           |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | Перший прохід | Звичайні провайдери з API-ключем               |
| `profile` | Після simple  | Провайдери, обмежені профілями автентифікації  |
| `paired`  | Після profile | Синтез кількох пов’язаних записів              |
| `late`    | Останній прохід | Перевизначення наявних провайдерів (перемагає при колізії) |

## Наступні кроки

- [Плагіни каналів](/uk/plugins/sdk-channel-plugins) — якщо ваш Plugin також надає канал
- [SDK Runtime](/uk/plugins/sdk-runtime) — допоміжні методи `api.runtime` (TTS, пошук, subagent)
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник з імпорту підшляхів
- [Внутрішні механізми Plugin](/uk/plugins/architecture-internals#provider-runtime-hooks) — подробиці про hooks і вбудовані приклади

## Пов’язане

- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugin](/uk/plugins/building-plugins)
- [Створення Plugin каналів](/uk/plugins/sdk-channel-plugins)
