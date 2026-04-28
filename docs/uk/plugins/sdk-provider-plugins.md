---
read_when:
    - Ви створюєте новий plugin постачальника моделей
    - Ви хочете додати сумісний з OpenAI проксі або власну LLM до OpenClaw
    - Вам потрібно зрозуміти автентифікацію постачальника, каталоги та runtime-хуки
sidebarTitle: Provider plugins
summary: Покроковий посібник зі створення plugin постачальника моделей для OpenClaw
title: Створення plugin постачальників моделей
x-i18n:
    generated_at: "2026-04-28T01:41:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f28bc56347cca1259959444e086a3c6ea1b9f00e3a7d68332add962dfcac2d3
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Цей посібник пояснює, як створити plugin постачальника, який додає постачальника моделей
(LLM) до OpenClaw. Наприкінці у вас буде постачальник із каталогом моделей,
автентифікацією через API-ключ і динамічним визначенням моделей.

<Info>
  Якщо ви раніше не створювали жодного plugin для OpenClaw, спершу прочитайте
  [Початок роботи](/uk/plugins/building-plugins) щодо базової структури
  пакета та налаштування маніфесту.
</Info>

<Tip>
  Plugins постачальників додають моделі до звичайного циклу інференсу OpenClaw. Якщо модель
  має працювати через нативний демон агента, який керує потоками, Compaction або подіями
  інструментів, поєднайте постачальника з [agent harness](/uk/plugins/sdk-agent-harness),
  а не виносьте деталі протоколу демона в core.
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
    облікові дані без завантаження runtime вашого plugin. Додайте `providerAuthAliases`,
    коли варіант постачальника має повторно використовувати автентифікацію іншого id постачальника. `modelSupport`
    є необов’язковим і дозволяє OpenClaw автоматично завантажувати ваш plugin постачальника зі скорочених
    id моделей, таких як `acme-large`, ще до появи runtime-хуків. Якщо ви публікуєте
    постачальника в ClawHub, ці поля `openclaw.compat` і `openclaw.build`
    обов’язкові в `package.json`.

  </Step>

  <Step title="Зареєструйте постачальника">
    Мінімальному постачальнику потрібні `id`, `label`, `auth` і `catalog`:

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description": "Acme AI model provider",
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

    Це вже робочий постачальник. Тепер користувачі можуть
    `openclaw onboard --acme-ai-api-key <key>` і вибирати
    `acme-ai/acme-large` як свою модель.

    Якщо постачальник вище за потоком використовує інші керівні токени, ніж OpenClaw, додайте
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

    `input` переписує фінальний системний prompt і вміст текстових повідомлень перед
    передаванням. `output` переписує текстові дельти асистента та фінальний текст до того, як
    OpenClaw розбере власні керівні маркери або доставку через канал.

    Для вбудованих постачальників, які реєструють лише одного текстового постачальника з автентифікацією
    через API-ключ плюс один runtime на основі каталогу, віддавайте перевагу
    вужчому хелперу `defineSingleProviderPluginEntry(...)`:

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
    автентифікацію постачальника. Він може виконувати специфічне для постачальника виявлення. Використовуйте
    `buildStaticProvider` лише для офлайн-рядків, які безпечно показувати до налаштування автентифікації;
    він не повинен вимагати облікових даних або виконувати мережеві запити.
    Поточне відображення `models list --all` в OpenClaw виконує статичні каталоги
    лише для вбудованих plugin постачальників, з порожньою конфігурацією, порожнім env і без
    шляхів агента/робочого простору.

    Якщо вашому потоку автентифікації також потрібно змінювати `models.providers.*`, аліаси
    та модель агента за замовчуванням під час онбордингу, використовуйте preset-хелпери з
    `openclaw/plugin-sdk/provider-onboard`. Найвужчі хелпери —
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли нативна кінцева точка постачальника підтримує потокові блоки використання на
    звичайному транспорті `openai-completions`, віддавайте перевагу спільним хелперам каталогу з
    `openclaw/plugin-sdk/provider-catalog-shared`, а не жорстко прописуйте перевірки provider-id.
    `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку з мапи можливостей
    кінцевої точки, тому нативні кінцеві точки у стилі Moonshot/DashScope усе одно вмикаються,
    навіть коли plugin використовує власний provider id.

  </Step>

  <Step title="Додайте динамічне визначення моделі">
    Якщо ваш постачальник приймає довільні id моделей (наприклад, проксі або роутер),
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
    прогріву — після його завершення `resolveDynamicModel` запуститься знову.

  </Step>

  <Step title="Додайте runtime-хуки (за потреби)">
    Більшості постачальників потрібні лише `catalog` + `resolveDynamicModel`. Додавайте хуки
    поступово, залежно від потреб вашого постачальника.

    Спільні builder-хелпери тепер покривають найпоширеніші сімейства replay/tool-compat,
    тож plugins зазвичай не потрібно вручну під’єднувати кожен хук окремо:

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

    Доступні на сьогодні сімейства replay:

    | Сімейство | Що воно підключає | Вбудовані приклади |
    | --- | --- | --- |
    | `openai-compatible` | Спільна політика replay у стилі OpenAI для транспортів, сумісних з OpenAI, включно з очищенням tool-call-id, виправленнями порядку assistant-first і загальною валідацією Gemini-turn там, де це потрібно транспорту | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Політика replay з урахуванням Claude, яка вибирається за `modelId`, тож транспорти повідомлень Anthropic отримують специфічне очищення thinking-block для Claude лише тоді, коли визначена модель справді є id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Нативна політика replay для Gemini плюс початкове очищення replay і режим тегованого reasoning-output | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Очищення thought-signature Gemini для моделей Gemini, що працюють через проксі-транспорти, сумісні з OpenAI; не вмикає нативну валідацію replay Gemini або початкові переписування | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Гібридна політика для постачальників, які змішують поверхні моделей Anthropic-message і OpenAI-compatible в одному plugin; необов’язкове відкидання thinking-block лише для Claude залишається обмеженим стороною Anthropic | `minimax` |

    Доступні на сьогодні сімейства потоків:

    | Сімейство | Що воно підключає | Вбудовані приклади |
    | --- | --- | --- |
    | `google-thinking` | Нормалізація payload thinking Gemini на спільному шляху потоку | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Обгортка reasoning Kilo на спільному шляху потоку проксі, де `kilo/auto` та непідтримувані id reasoning проксі пропускають ін’єкцію thinking | `kilocode` |
    | `moonshot-thinking` | Відображення бінарного payload native-thinking Moonshot з конфігурації + рівня `/think` | `moonshot` |
    | `minimax-fast-mode` | Переписування моделі MiniMax fast-mode на спільному шляху потоку | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Спільні нативні обгортки OpenAI/Codex Responses: заголовки атрибуції, `/fast`/`serviceTier`, детальність тексту, нативний вебпошук Codex, формування payload для сумісності reasoning і керування контекстом Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Обгортка reasoning OpenRouter для маршрутів проксі, з централізованою обробкою пропусків для непідтримуваних моделей/`auto` | `openrouter` |
    | `tool-stream-default-on` | Увімкнена за замовчуванням обгортка `tool_stream` для постачальників на кшталт Z.AI, яким потрібен потік інструментів, якщо його явно не вимкнено | `zai` |

    <Accordion title="SDK seams, що забезпечують роботу builder-ів сімейств">
      Кожен builder сімейства складається з публічних низькорівневих хелперів, експортованих із того самого пакета, до яких можна звернутися, коли постачальнику потрібно вийти за межі типового шаблону:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` і сирі builder-и replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Також експортує хелпери replay для Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) і хелпери для endpoint/моделей (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, а також спільні обгортки OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), сумісна з OpenAI обгортка thinking для DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), очищення prefill payload thinking для Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`) і спільні обгортки проксі/постачальників (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, базові хелпери схем Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) і хелпери сумісності xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Вбудований plugin xAI використовує `normalizeResolvedModel` + `contributeResolvedModelCompat` разом із ними, щоб правила xAI залишалися у володінні постачальника.

      Деякі хелпери потоків навмисно залишаються локальними для постачальника. `@openclaw/anthropic-provider` зберігає `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і низькорівневі builder-и обгорток Anthropic у власному публічному seam `api.ts` / `contract-api.ts`, оскільки вони кодують обробку Claude OAuth beta і gating `context1m`. Plugin xAI аналогічно зберігає формування нативних xAI Responses у власному `wrapStreamFn` (аліаси `/fast`, `tool_stream` за замовчуванням, очищення unsupported strict-tool, видалення payload reasoning, специфічного для xAI).

      Той самий шаблон на рівні кореня пакета також лежить в основі `@openclaw/openai-provider` (builder-и постачальника, хелпери моделей за замовчуванням, builder-и realtime provider) і `@openclaw/openrouter-provider` (builder постачальника плюс хелпери онбордингу/конфігурації).
    </Accordion>

    <Tabs>
      <Tab title="Обмін токенами">
        Для постачальників, яким потрібен обмін токенами перед кожним викликом інференсу:

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
        Для постачальників, яким потрібні користувацькі заголовки запиту або зміни тіла запиту:

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
        Для постачальників, яким потрібні нативні заголовки запиту/сеансу або метадані на
        узагальнених HTTP- або WebSocket-транспортних рівнях:

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

    <Accordion title="Усі доступні хуки постачальника">
      OpenClaw викликає хуки в такому порядку. Більшість постачальників використовують лише 2–3:

      | # | Хук | Коли використовувати |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей або значення `baseUrl` за замовчуванням |
      | 2 | `applyConfigDefaults` | Глобальні значення за замовчуванням, що належать постачальнику, під час матеріалізації конфігурації |
      | 3 | `normalizeModelId` | Очищення застарілих/preview аліасів model-id перед пошуком |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` для сімейства постачальників перед збиранням узагальненої моделі |
      | 5 | `normalizeConfig` | Нормалізація конфігурації `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Переписування для сумісності native streaming-usage для конфігурованих постачальників |
      | 7 | `resolveConfigApiKey` | Визначення автентифікації з env-marker, що належить постачальнику |
      | 8 | `resolveSyntheticAuth` | Синтетична автентифікація для local/self-hosted або на основі конфігурації |
      | 9 | `shouldDeferSyntheticProfileAuth` | Занижувати пріоритет синтетичних placeholder-ів збереженого профілю порівняно з env/config auth |
      | 10 | `resolveDynamicModel` | Приймати довільні id моделей з upstream |
      | 11 | `prepareDynamicModel` | Асинхронне отримання метаданих перед визначенням |
      | 12 | `normalizeResolvedModel` | Переписування транспорту перед runner |
      | 13 | `contributeResolvedModelCompat` | Прапорці сумісності для моделей постачальника за іншим сумісним транспортом |
      | 14 | `capabilities` | Застарілий статичний набір можливостей; лише для сумісності |
      | 15 | `normalizeToolSchemas` | Очищення схем інструментів, що належить постачальнику, перед реєстрацією |
      | 16 | `inspectToolSchemas` | Діагностика схем інструментів, що належить постачальнику |
      | 17 | `resolveReasoningOutputMode` | Контракт тегованого чи нативного reasoning-output |
      | 18 | `prepareExtraParams` | Параметри запиту за замовчуванням |
      | 19 | `createStreamFn` | Повністю користувацький транспорт `StreamFn` |
      | 20 | `wrapStreamFn` | Користувацькі обгортки заголовків/тіла на звичайному шляху потоку |
      | 21 | `resolveTransportTurnState` | Нативні заголовки/метадані для кожного turn |
      | 22 | `resolveWebSocketSessionPolicy` | Нативні заголовки сеансу WS / час cool-down |
      | 23 | `formatApiKey` | Користувацька форма runtime-токена |
      | 24 | `refreshOAuth` | Користувацьке оновлення OAuth |
      | 25 | `buildAuthDoctorHint` | Підказка щодо виправлення автентифікації |
      | 26 | `matchesContextOverflowError` | Визначення переповнення контексту, що належить постачальнику |
      | 27 | `classifyFailoverReason` | Класифікація rate-limit/overload, що належить постачальнику |
      | 28 | `isCacheTtlEligible` | Gating TTL кешу prompt |
      | 29 | `buildMissingAuthMessage` | Користувацька підказка про відсутню автентифікацію |
      | 30 | `suppressBuiltInModel` | Застаріло. Runtime-хук більше не викликається; використовуйте `modelCatalog.suppressions` у маніфесті |
      | 31 | `augmentModelCatalog` | Синтетичні рядки forward-compat |
      | 32 | `resolveThinkingProfile` | Набір параметрів `/think` для конкретної моделі |
      | 33 | `isBinaryThinking` | Сумісність бінарного увімкнення/вимкнення thinking |
      | 34 | `supportsXHighThinking` | Сумісність підтримки reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Сумісність політики `/think` за замовчуванням |
      | 36 | `isModernModelRef` | Відповідність моделі для live/smoke |
      | 37 | `prepareRuntimeAuth` | Обмін токенами перед інференсом |
      | 38 | `resolveUsageAuth` | Користувацький розбір облікових даних використання |
      | 39 | `fetchUsageSnapshot` | Користувацька кінцева точка використання |
      | 40 | `createEmbeddingProvider` | Адаптер embedding, що належить постачальнику, для пам’яті/пошуку |
      | 41 | `buildReplayPolicy` | Користувацька політика replay/Compaction транскрипту |
      | 42 | `sanitizeReplayHistory` | Переписування replay, специфічні для постачальника, після узагальненого очищення |
      | 43 | `validateReplayTurns` | Сувора валідація turn replay перед вбудованим runner |
      | 44 | `onModelSelected` | Колбек після вибору моделі (наприклад, телеметрія) |

      Примітки щодо runtime fallback:

      - `normalizeConfig` спочатку перевіряє відповідного постачальника, а потім інші plugin постачальників із підтримкою хуків, доки один із них справді не змінить конфігурацію. Якщо жоден хук постачальника не переписує підтримуваний запис конфігурації сімейства Google, усе ще застосовується вбудований нормалізатор конфігурації Google.
      - `resolveConfigApiKey` використовує хук постачальника, якщо він наданий. Вбудований шлях `amazon-bedrock` також має тут вбудований resolver AWS env-marker, хоча сама runtime-автентифікація Bedrock, як і раніше, використовує стандартний ланцюжок AWS SDK.
      - `resolveSystemPromptContribution` дозволяє постачальнику інжектувати cache-aware інструкції системного prompt для сімейства моделей. Віддавайте йому перевагу над `before_prompt_build`, коли поведінка належить одному сімейству постачальника/моделей і має зберігати стабільний/динамічний поділ кешу.

      Докладні описи та приклади з реального світу дивіться в [Внутрішні механізми: Runtime-хуки постачальників](/uk/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Додайте додаткові можливості (необов’язково)">
    Plugin постачальника може реєструвати розпізнавання мовлення, транскрипцію realtime, realtime
    голос, розуміння медіа, генерацію зображень, генерацію відео, web fetch
    і web search поряд із текстовим інференсом. OpenClaw класифікує це як
    plugin **hybrid-capability** — рекомендований шаблон для корпоративних plugins
    (один plugin на постачальника). Див.
    [Внутрішні механізми: Володіння можливостями](/uk/plugins/architecture#capability-ownership-model).

    Зареєструйте кожну можливість у `register(api)` поруч із вашим наявним
    викликом `api.registerProvider(...)`. Виберіть лише ті вкладки, які вам потрібні:

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

        Використовуйте `assertOkOrThrowProviderError(...)` для HTTP-збоїв постачальника, щоб
        plugins спільно використовували обмежене читання тіла помилки, розбір помилок JSON і
        суфікси request-id.
      </Tab>
      <Tab title="Транскрипція realtime">
        Віддавайте перевагу `createRealtimeTranscriptionWebSocketSession(...)` — спільний
        хелпер обробляє перехоплення проксі, backoff для повторного підключення, flush під час закриття, handshake готовності,
        постановку аудіо в чергу та діагностику подій закриття. Ваш plugin
        лише відображає події upstream.

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

        Постачальники пакетного STT, які надсилають multipart-аудіо через POST, повинні використовувати
        `buildAudioTranscriptionFormData(...)` з
        `openclaw/plugin-sdk/provider-http`. Хелпер нормалізує
        імена файлів для завантаження, зокрема завантаження AAC, яким потрібне ім’я файлу у стилі M4A для
        сумісних API транскрипції.
      </Tab>
      <Tab title="Голос realtime">
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
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` недостатньо,
        щоб коректно оголосити підтримку режиму трансформації або чисто вимкнені режими.
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
      <Tab title="Web fetch і search">
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

Plugins постачальників публікуються так само, як і будь-який інший зовнішній code plugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Не використовуйте тут застарілий alias публікації лише для Skills; пакети plugin слід публікувати через
`clawhub package publish`.

## Структура файлів

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadata openclaw.providers
├── openclaw.plugin.json      # Маніфест із metadata автентифікації постачальника
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Тести
    └── usage.ts              # Кінцева точка використання (необов’язково)
```

## Довідник порядку каталогу

`catalog.order` керує тим, коли ваш каталог зливається відносно вбудованих
постачальників:

| Порядок     | Коли          | Випадок використання                         |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Перший прохід    | Звичайні постачальники з API-ключем                         |
| `profile` | Після simple  | Постачальники, обмежені профілями автентифікації                |
| `paired`  | Після profile | Синтез кількох пов’язаних записів             |
| `late`    | Останній прохід     | Перевизначення наявних постачальників (перемагає при колізії) |

## Наступні кроки

- [Plugins каналів](/uk/plugins/sdk-channel-plugins) — якщо ваш plugin також надає канал
- [SDK Runtime](/uk/plugins/sdk-runtime) — хелпери `api.runtime` (TTS, search, subagent)
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпорту підшляхів
- [Внутрішні механізми plugin](/uk/plugins/architecture-internals#provider-runtime-hooks) — подробиці про хуки та вбудовані приклади

## Пов’язане

- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення plugins](/uk/plugins/building-plugins)
- [Створення plugin каналів](/uk/plugins/sdk-channel-plugins)
