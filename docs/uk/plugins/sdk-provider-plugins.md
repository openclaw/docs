---
read_when:
    - Ви створюєте новий плагін провайдера моделей
    - Ви хочете додати до OpenClaw OpenAI-сумісний проксі або власну LLM
    - Вам потрібно зрозуміти автентифікацію провайдерів, каталоги та runtime-хуки
sidebarTitle: Provider plugins
summary: Покроковий посібник зі створення плагіна провайдера моделей для OpenClaw
title: Створення плагінів провайдерів
x-i18n:
    generated_at: "2026-04-25T18:14:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: c31f73619aa8fecf1b409bbd079683fae9ba996dd6ce22bd894b47cc76d5e856
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Цей посібник проводить вас через створення плагіна провайдера, який додає до OpenClaw провайдера моделей (LLM). Наприкінці у вас буде провайдер із каталогом моделей, автентифікацією через API-ключ і динамічним визначенням моделей.

<Info>
  Якщо ви ще не створювали жодного плагіна OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins) про базову структуру пакета
  та налаштування маніфесту.
</Info>

<Tip>
  Плагіни провайдерів додають моделі до стандартного циклу інференсу OpenClaw. Якщо модель
  має працювати через нативний демон агента, який керує потоками, Compaction або подіями
  інструментів, поєднайте провайдера з [agent harness](/uk/plugins/sdk-agent-harness),
  замість того щоб виносити деталі протоколу демона в core.
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
    облікові дані без завантаження runtime вашого плагіна. Додавайте `providerAuthAliases`,
    коли варіант провайдера має повторно використовувати автентифікацію іншого id провайдера. `modelSupport`
    необов’язковий і дає OpenClaw змогу автоматично завантажувати ваш плагін провайдера зі скорочених
    id моделей, таких як `acme-large`, ще до появи runtime-хуків. Якщо ви публікуєте
    провайдера в ClawHub, поля `openclaw.compat` і `openclaw.build`
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

    Це вже робочий провайдер. Тепер користувачі можуть виконати
    `openclaw onboard --acme-ai-api-key <key>` і вибрати
    `acme-ai/acme-large` як свою модель.

    Якщо апстрим-провайдер використовує інші керувальні токени, ніж OpenClaw, додайте
    невелике двонапрямлене текстове перетворення замість заміни шляху потоку:

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

    `input` переписує фінальний системний промпт і вміст текстових повідомлень перед
    передаванням. `output` переписує текстові дельти асистента і фінальний текст до того, як
    OpenClaw розбере власні керувальні маркери або виконає доставлення в канал.

    Для вбудованих провайдерів, які реєструють лише одного текстового провайдера з автентифікацією
    через API-ключ і одним runtime на основі каталогу, віддавайте перевагу вужчому
    хелперу `defineSingleProviderPluginEntry(...)`:

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
    `buildStaticProvider` лише для офлайн-рядків, які безпечно показувати до налаштування автентифікації;
    він не повинен вимагати облікових даних або виконувати мережеві запити.
    У поточному відображенні OpenClaw `models list --all` статичні каталоги
    виконуються лише для вбудованих плагінів провайдерів із порожньою конфігурацією, порожнім env і без
    шляхів агента/робочого простору.

    Якщо ваш потік автентифікації також має виправляти `models.providers.*`, псевдоніми та
    модель агента за замовчуванням під час онбордингу, використовуйте preset-хелпери з
    `openclaw/plugin-sdk/provider-onboard`. Найвужчі хелпери:
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли нативний endpoint провайдера підтримує потокові блоки використання на
    звичайному транспорті `openai-completions`, віддавайте перевагу спільним хелперам каталогу з
    `openclaw/plugin-sdk/provider-catalog-shared`, а не жорсткому кодуванню перевірок id провайдера.
    `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку за мапою можливостей endpoint, тому
    нативні endpoint-и у стилі Moonshot/DashScope також підключаються, навіть якщо плагін використовує
    власний id провайдера.

  </Step>

  <Step title="Додайте динамічне визначення моделей">
    Якщо ваш провайдер приймає довільні id моделей (наприклад, проксі або маршрутизатор),
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

  <Step title="Додайте runtime-хуки (за потреби)">
    Більшості провайдерів потрібні лише `catalog` + `resolveDynamicModel`. Додавайте хуки
    поступово, відповідно до потреб вашого провайдера.

    Спільні хелпери-конструктори тепер охоплюють найпоширеніші
    сімейства replay/tool-compat, тому плагінам зазвичай не потрібно вручну підключати кожен хук окремо:

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

    | Family | Що воно підключає | Вбудовані приклади |
    | --- | --- | --- |
    | `openai-compatible` | Спільна політика replay у стилі OpenAI для OpenAI-сумісних транспортів, включно з очищенням tool-call-id, виправленням порядку assistant-first і загальною валідацією Gemini-turn там, де це потрібно транспорту | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Claude-орієнтована політика replay, що вибирається за `modelId`, тож транспорти Anthropic-message отримують очищення thinking-block, специфічне для Claude, лише коли визначена модель справді є id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Нативна політика replay Gemini плюс очищення bootstrap replay і режим tagged reasoning-output | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Очищення thought-signature Gemini для моделей Gemini, що працюють через OpenAI-сумісні проксі-транспорти; не вмикає нативну валідацію replay Gemini чи переписування bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Гібридна політика для провайдерів, які поєднують поверхні моделей Anthropic-message і OpenAI-compatible в одному плагіні; необов’язкове відкидання thinking-block лише для Claude залишається обмеженим стороною Anthropic | `minimax` |

    Доступні сьогодні сімейства потоків:

    | Family | Що воно підключає | Вбудовані приклади |
    | --- | --- | --- |
    | `google-thinking` | Нормалізація thinking payload Gemini на спільному шляху потоку | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Обгортка reasoning Kilo на спільному шляху проксі-потоку, де `kilo/auto` і непідтримувані id reasoning проксі пропускають ін’єктований thinking | `kilocode` |
    | `moonshot-thinking` | Відображення binary native-thinking payload Moonshot з конфігурації + рівня `/think` | `moonshot` |
    | `minimax-fast-mode` | Переписування моделі MiniMax fast-mode на спільному шляху потоку | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Спільні нативні обгортки OpenAI/Codex Responses: заголовки attribution, `/fast`/`serviceTier`, текстова verbosity, нативний вебпошук Codex, формування payload для reasoning-compat і керування контекстом Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Обгортка reasoning OpenRouter для маршрутів проксі, з централізованою обробкою пропусків unsupported-model/`auto` | `openrouter` |
    | `tool-stream-default-on` | Обгортка `tool_stream`, увімкнена за замовчуванням, для провайдерів на кшталт Z.AI, які хочуть потокову передачу інструментів, якщо її не вимкнено явно | `zai` |

    <Accordion title="SDK seams, що забезпечують роботу конструкторів сімейств">
      Кожен конструктор сімейства складається з публічних низькорівневих хелперів, експортованих із того самого пакета, до яких можна звертатися, коли провайдеру потрібно вийти за межі типового шаблону:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` і сирі конструктори replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Також експортує хелпери replay для Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) і хелпери endpoint/model (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, а також спільні обгортки OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), OpenAI-compatible-обгортка DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`) і спільні обгортки проксі/провайдера (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, базові хелпери схем Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) і хелпери compat для xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Вбудований плагін xAI використовує `normalizeResolvedModel` + `contributeResolvedModelCompat` разом із ними, щоб правила xAI залишалися у власності провайдера.

      Деякі хелпери потоку навмисно залишаються локальними для провайдера. `@openclaw/anthropic-provider` зберігає `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і нижчорівневі конструктори обгорток Anthropic у власному публічному seam `api.ts` / `contract-api.ts`, оскільки вони кодують обробку бета-версій Claude OAuth і gating `context1m`. Аналогічно плагін xAI зберігає нативне формування xAI Responses у власному `wrapStreamFn` (псевдоніми `/fast`, `tool_stream` за замовчуванням, очищення unsupported strict-tool, видалення reasoning-payload, специфічного для xAI).

      Такий самий шаблон package-root також лежить в основі `@openclaw/openai-provider` (конструктори провайдера, хелпери моделі за замовчуванням, конструктори realtime-провайдера) і `@openclaw/openrouter-provider` (конструктор провайдера плюс хелпери онбордингу/конфігурації).
    </Accordion>

    <Tabs>
      <Tab title="Обмін токенами">
        Для провайдерів, яким потрібен обмін токенами перед кожним викликом інференсу:

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
        Для провайдерів, яким потрібні нативні заголовки запиту/сеансу або метадані в
        узагальнених HTTP- чи WebSocket-транспортах:

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
      <Tab title="Використання і білінг">
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
      OpenClaw викликає хуки в такому порядку. Більшість провайдерів використовують лише 2–3:

      | # | Hook | Коли використовувати |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей або значення `baseUrl` за замовчуванням |
      | 2 | `applyConfigDefaults` | Глобальні значення за замовчуванням, що належать провайдеру, під час матеріалізації конфігурації |
      | 3 | `normalizeModelId` | Очищення застарілих/preview-псевдонімів `model-id` перед пошуком |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` сімейства провайдера перед загальним складанням моделі |
      | 5 | `normalizeConfig` | Нормалізація конфігурації `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Переписування native streaming-usage compat для конфігурованих провайдерів |
      | 7 | `resolveConfigApiKey` | Визначення автентифікації env-marker, що належить провайдеру |
      | 8 | `resolveSyntheticAuth` | Синтетична автентифікація для локального/self-hosted або конфігураційного сценарію |
      | 9 | `shouldDeferSyntheticProfileAuth` | Опускати синтетичні заповнювачі stored-profile нижче за env/config auth |
      | 10 | `resolveDynamicModel` | Приймати довільні id апстрим-моделей |
      | 11 | `prepareDynamicModel` | Асинхронне отримання метаданих перед визначенням |
      | 12 | `normalizeResolvedModel` | Переписування транспорту перед runner |
      | 13 | `contributeResolvedModelCompat` | Прапорці compat для моделей вендора за іншим сумісним транспортом |
      | 14 | `capabilities` | Застарілий статичний набір можливостей; лише для сумісності |
      | 15 | `normalizeToolSchemas` | Очищення схем інструментів, що належать провайдеру, перед реєстрацією |
      | 16 | `inspectToolSchemas` | Діагностика схем інструментів, що належать провайдеру |
      | 17 | `resolveReasoningOutputMode` | Контракт tagged vs native reasoning-output |
      | 18 | `prepareExtraParams` | Параметри запиту за замовчуванням |
      | 19 | `createStreamFn` | Повністю користувацький транспорт StreamFn |
      | 20 | `wrapStreamFn` | Користувацькі обгортки заголовків/тіла на звичайному шляху потоку |
      | 21 | `resolveTransportTurnState` | Нативні заголовки/метадані для кожного turn |
      | 22 | `resolveWebSocketSessionPolicy` | Нативні заголовки сесії WS / cool-down |
      | 23 | `formatApiKey` | Користувацька форма runtime-токена |
      | 24 | `refreshOAuth` | Користувацьке оновлення OAuth |
      | 25 | `buildAuthDoctorHint` | Підказка для виправлення автентифікації |
      | 26 | `matchesContextOverflowError` | Виявлення переповнення, що належить провайдеру |
      | 27 | `classifyFailoverReason` | Класифікація rate-limit/overload, що належить провайдеру |
      | 28 | `isCacheTtlEligible` | Гейтинг TTL кешу промптів |
      | 29 | `buildMissingAuthMessage` | Користувацька підказка про відсутню автентифікацію |
      | 30 | `suppressBuiltInModel` | Приховати застарілі апстрим-рядки |
      | 31 | `augmentModelCatalog` | Синтетичні рядки для forward-compat |
      | 32 | `resolveThinkingProfile` | Набір опцій `/think`, специфічний для моделі |
      | 33 | `isBinaryThinking` | Сумісність binary thinking on/off |
      | 34 | `supportsXHighThinking` | Сумісність підтримки reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Сумісність політики `/think` за замовчуванням |
      | 36 | `isModernModelRef` | Відповідність live/smoke моделей |
      | 37 | `prepareRuntimeAuth` | Обмін токенами перед інференсом |
      | 38 | `resolveUsageAuth` | Користувацький розбір облікових даних usage |
      | 39 | `fetchUsageSnapshot` | Користувацький endpoint usage |
      | 40 | `createEmbeddingProvider` | Адаптер embedding, що належить провайдеру, для пам’яті/пошуку |
      | 41 | `buildReplayPolicy` | Користувацька політика replay/Compaction транскрипту |
      | 42 | `sanitizeReplayHistory` | Специфічні для провайдера переписування replay після загального очищення |
      | 43 | `validateReplayTurns` | Сувора валідація replay-turn перед вбудованим runner |
      | 44 | `onModelSelected` | Зворотний виклик після вибору моделі (наприклад, телеметрія) |

      Примітки щодо runtime fallback:

      - `normalizeConfig` спочатку перевіряє відповідний провайдер, а потім інші плагіни провайдерів, що підтримують хуки, доки один із них справді не змінить конфігурацію. Якщо жоден хук провайдера не перепише підтримуваний запис конфігурації сімейства Google, усе одно буде застосовано вбудований нормалізатор конфігурації Google.
      - `resolveConfigApiKey` використовує хук провайдера, якщо він доступний. Вбудований шлях `amazon-bedrock` також має тут вбудований resolver AWS env-marker, хоча сама runtime-автентифікація Bedrock, як і раніше, використовує стандартний ланцюжок AWS SDK.
      - `resolveSystemPromptContribution` дає змогу провайдеру ін’єктувати cache-aware настанови системного промпту для сімейства моделей. Віддавайте йому перевагу над `before_prompt_build`, коли поведінка належить одному провайдеру/сімейству моделей і має зберігати стабільний/динамічний поділ кешу.

      Детальні описи та приклади з реального світу дивіться в [Внутрішня архітектура: runtime-хуки провайдера](/uk/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Додайте додаткові можливості (необов’язково)">
    Плагін провайдера може реєструвати мовлення, транскрипцію в realtime, realtime-голос,
    розуміння медіа, генерацію зображень, генерацію відео, веботримання,
    і вебпошук поряд із текстовим інференсом. OpenClaw класифікує це як
    плагін **hybrid-capability** — рекомендований шаблон для корпоративних плагінів
    (один плагін на вендора). Див.
    [Внутрішня архітектура: володіння можливостями](/uk/plugins/architecture#capability-ownership-model).

    Реєструйте кожну можливість у `register(api)` поруч із наявним
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
      <Tab title="Realtime-транскрипція">
        Віддавайте перевагу `createRealtimeTranscriptionWebSocketSession(...)` — спільний
        хелпер обробляє захоплення проксі, backoff повторного підключення, flush під час закриття, готові
        handshake, постановку аудіо в чергу та діагностику подій закриття. Ваш плагін
        лише відображає події апстриму.

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

        Провайдери пакетного STT, які надсилають multipart-аудіо через POST, повинні використовувати
        `buildAudioTranscriptionFormData(...)` з
        `openclaw/plugin-sdk/provider-http`. Хелпер нормалізує
        імена файлів завантаження, зокрема AAC-завантаження, яким потрібне ім’я файлу у стилі M4A для
        сумісних API транскрипції.
      </Tab>
      <Tab title="Realtime-голос">
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
        Можливості відео використовують форму, що **враховує режим**: `generate`,
        `imageToVideo` і `videoToVideo`. Плоских агрегованих полів на кшталт
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` недостатньо,
        щоб коректно оголосити підтримку режиму трансформації або чисто вимкнені режими.
        Генерація музики наслідує той самий шаблон із явними блоками `generate` /
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
            imageToVideo: { enabled: true, maxVideos: 1, maxInputImages: 1, maxDurationSeconds: 5 },
            videoToVideo: { enabled: false },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```
      </Tab>
      <Tab title="Веботримання і пошук">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "Отримуйте сторінки через backend рендерингу Acme.",
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
            description: "Отримати сторінку через Acme Fetch.",
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

Плагіни провайдерів публікуються так само, як і будь-які інші зовнішні плагіни коду:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Не використовуйте тут застарілий псевдонім публікації лише для Skills; пакети плагінів повинні використовувати
`clawhub package publish`.

## Структура файлів

```
<bundled-plugin-root>/acme-ai/
├── package.json              # метадані openclaw.providers
├── openclaw.plugin.json      # Маніфест із метаданими автентифікації провайдера
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Тести
    └── usage.ts              # Endpoint usage (необов’язково)
```

## Довідка щодо порядку каталогу

`catalog.order` керує тим, коли ваш каталог зливається відносно вбудованих
провайдерів:

| Order     | Коли          | Випадок використання                           |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | Перший прохід | Прості провайдери з API-ключем                 |
| `profile` | Після simple  | Провайдери, що залежать від профілів автентифікації |
| `paired`  | Після profile | Синтез кількох пов’язаних записів              |
| `late`    | Останній прохід | Перевизначення наявних провайдерів (перемагає при колізії) |

## Наступні кроки

- [Плагіни каналів](/uk/plugins/sdk-channel-plugins) — якщо ваш плагін також надає канал
- [SDK Runtime](/uk/plugins/sdk-runtime) — хелпери `api.runtime` (TTS, пошук, subagent)
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів subpath
- [Внутрішня архітектура плагінів](/uk/plugins/architecture-internals#provider-runtime-hooks) — деталі хуків і вбудовані приклади

## Пов’язане

- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення плагінів](/uk/plugins/building-plugins)
- [Створення плагінів каналів](/uk/plugins/sdk-channel-plugins)
