---
read_when:
    - Ви створюєте новий plugin постачальника моделей
    - Ви хочете додати до OpenClaw OpenAI-сумісний проксі або власну LLM
    - Вам потрібно зрозуміти автентифікацію постачальника, каталоги та хуки середовища виконання
sidebarTitle: Provider Plugins
summary: Покроковий посібник зі створення plugin постачальника моделей для OpenClaw
title: Створення plugin постачальників моделей
x-i18n:
    generated_at: "2026-04-22T03:53:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99376d2abfc968429ed19f03451beb0f3597d57c703f2ce60c6c51220656e850
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Створення plugin постачальників моделей

Цей посібник пояснює, як створити plugin постачальника, який додає постачальника
моделей (LLM) до OpenClaw. Наприкінці у вас буде постачальник із каталогом
моделей, автентифікацією через API key і динамічним визначенням моделей.

<Info>
  Якщо ви ще не створювали жодного plugin для OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins) про базову структуру пакета
  та налаштування маніфесту.
</Info>

<Tip>
  Plugins постачальників додають моделі до стандартного циклу інференсу OpenClaw. Якщо модель
  має працювати через власний native daemon агента, який керує потоками,
  Compaction або подіями інструментів, поєднайте постачальника з [agent harness](/uk/plugins/sdk-agent-harness),
  замість того щоб виносити деталі протоколу daemon у core.
</Tip>

## Покроковий розбір

<Steps>
  <a id="step-1-package-and-manifest"></a>
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
    якщо варіант постачальника має повторно використовувати auth іншого id постачальника. `modelSupport`
    є необов’язковим і дає змогу OpenClaw автоматично завантажувати ваш plugin постачальника зі скорочених
    id моделей, таких як `acme-large`, ще до появи runtime hooks. Якщо ви публікуєте
    постачальника в ClawHub, поля `openclaw.compat` і `openclaw.build`
    у `package.json` є обов’язковими.

  </Step>

  <Step title="Зареєструйте постачальника">
    Мінімальному постачальнику потрібні `id`, `label`, `auth` і `catalog`:

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

    Це вже робочий постачальник. Тепер користувачі можуть виконати
    `openclaw onboard --acme-ai-api-key <key>` і вибрати
    `acme-ai/acme-large` як свою модель.

    Якщо upstream-постачальник використовує інші control tokens, ніж OpenClaw, додайте
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

    `input` переписує фінальний системний prompt і текстовий вміст повідомлень перед
    передаванням. `output` переписує текстові deltas асистента й фінальний текст до того,
    як OpenClaw розбере власні control markers або доставку каналу.

    Для вбудованих постачальників, які лише реєструють одного текстового постачальника з auth через API key
    плюс один runtime на основі каталогу, краще використовувати вужчий
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

    `buildProvider` — це шлях живого каталогу, який використовується, коли OpenClaw може визначити реальний
    auth постачальника. Він може виконувати специфічне для постачальника виявлення. Використовуйте
    `buildStaticProvider` лише для офлайн-рядків, які безпечно показувати до налаштування auth;
    він не повинен вимагати облікових даних або виконувати мережеві запити.
    Відображення `models list --all` в OpenClaw наразі виконує статичні каталоги
    лише для вбудованих plugins постачальників, із порожньою конфігурацією, порожнім env і без
    шляхів agent/workspace.

    Якщо вашому auth-процесу також потрібно патчити `models.providers.*`, aliases і
    модель постачальника за замовчуванням для агента під час onboarding, використовуйте preset helpers з
    `openclaw/plugin-sdk/provider-onboard`. Найвужчі helper-и:
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли native endpoint постачальника підтримує streamed usage blocks на звичайному
    транспорті `openai-completions`, краще використовувати спільні helper-и каталогу з
    `openclaw/plugin-sdk/provider-catalog-shared`, а не жорстко прописувати перевірки provider-id. Функції
    `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку за мапою можливостей endpoint, тож native endpoints у стилі Moonshot/DashScope усе одно вмикаються, навіть якщо plugin використовує власний provider id.

  </Step>

  <Step title="Додайте динамічне визначення моделей">
    Якщо ваш постачальник приймає довільні id моделей (наприклад, proxy або router),
    додайте `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog з прикладу вище

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
    прогріву — після його завершення `resolveDynamicModel` виконується знову.

  </Step>

  <Step title="Додайте runtime hooks (за потреби)">
    Більшості постачальників потрібні лише `catalog` + `resolveDynamicModel`. Додавайте hooks
    поступово, у міру потреб вашого постачальника.

    Спільні helper builders тепер охоплюють найпоширеніші сімейства replay/tool-compat,
    тож plugin-ам зазвичай не потрібно вручну під’єднувати кожен hook окремо:

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

    | Сімейство | Що воно під’єднує |
    | --- | --- |
    | `openai-compatible` | Спільну політику replay у стилі OpenAI для OpenAI-сумісних транспортів, включно з очищенням `tool-call-id`, виправленням порядку assistant-first і загальною валідацією Gemini-turn там, де це потрібно транспорту |
    | `anthropic-by-model` | Політику replay з урахуванням Claude, що вибирається за `modelId`, щоб транспорти Anthropic-message отримували очищення thinking-block, специфічне для Claude, лише коли визначена модель справді є id Claude |
    | `google-gemini` | Native політику replay для Gemini плюс очищення bootstrap replay і режим tagged reasoning-output |
    | `passthrough-gemini` | Очищення thought-signature Gemini для моделей Gemini, що працюють через OpenAI-сумісні proxy-транспорти; не вмикає native валідацію replay Gemini або переписування bootstrap |
    | `hybrid-anthropic-openai` | Гібридну політику для постачальників, які поєднують поверхні моделей Anthropic-message та OpenAI-compatible в одному plugin; необов’язкове відкидання thinking-block лише для Claude залишається обмеженим стороною Anthropic |

    Реальні приклади вбудованих рішень:

    - `google` і `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` і `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` і `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` і `zai`: `openai-compatible`

    Доступні сьогодні сімейства потоків:

    | Сімейство | Що воно під’єднує |
    | --- | --- |
    | `google-thinking` | Нормалізацію thinking payload Gemini на спільному шляху потоку |
    | `kilocode-thinking` | Обгортку Kilo reasoning на спільному шляху proxy-потоку, де `kilo/auto` і непідтримувані proxy reasoning id пропускають ін’єктований thinking |
    | `moonshot-thinking` | Мапінг binary native-thinking payload Moonshot із config + рівня `/think` |
    | `minimax-fast-mode` | Переписування моделі MiniMax fast-mode на спільному шляху потоку |
    | `openai-responses-defaults` | Спільні native обгортки OpenAI/Codex Responses: заголовки attribution, `/fast`/`serviceTier`, текстова verbosity, native Codex web search, формування payload для reasoning-compat і керування контекстом Responses |
    | `openrouter-thinking` | Обгортку reasoning OpenRouter для proxy-маршрутів, із централізованою обробкою пропусків для unsupported-model/`auto` |
    | `tool-stream-default-on` | Обгортку `tool_stream`, увімкнену за замовчуванням, для постачальників на кшталт Z.AI, які хочуть потокову передачу інструментів, якщо її явно не вимкнено |

    Реальні приклади вбудованих рішень:

    - `google` і `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` і `minimax-portal`: `minimax-fast-mode`
    - `openai` і `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` також експортує enum
    сімейств replay, а також спільні helper-и, з яких ці сімейства побудовані. До поширених публічних
    експортів належать:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - спільні builders replay, такі як `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` і
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - helper-и replay для Gemini, такі як `sanitizeGoogleGeminiReplayHistory(...)`
      і `resolveTaggedReasoningOutputMode()`
    - helper-и endpoint/model, такі як `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` і
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` надає як builder сімейств,
    так і публічні helper-и-обгортки, які ці сімейства повторно використовують. До поширених публічних експортів
    належать:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - спільні обгортки OpenAI/Codex, такі як
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` і
      `createCodexNativeWebSearchWrapper(...)`
    - спільні обгортки proxy/provider, такі як `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` і `createMinimaxFastModeWrapper(...)`

    Деякі stream helper-и навмисно залишаються локальними для постачальника. Поточний вбудований
    приклад: `@openclaw/anthropic-provider` експортує
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і
    низькорівневі builders обгорток Anthropic зі свого публічного seam
    `api.ts` / `contract-api.ts`. Ці helper-и залишаються специфічними для Anthropic, оскільки
    вони також кодують обробку beta для Claude OAuth і gating `context1m`.

    Інші вбудовані постачальники також тримають transport-специфічні обгортки локально, коли
    поведінку не можна чисто розділити між сімействами. Поточний приклад: вбудований plugin xAI
    зберігає native формування xAI Responses у власному
    `wrapStreamFn`, включно з переписуванням alias `/fast`, `tool_stream` за замовчуванням,
    очищенням непідтримуваних strict-tool і видаленням payload reasoning, специфічного для xAI.

    `openclaw/plugin-sdk/provider-tools` наразі надає одне спільне
    сімейство tool-schema плюс спільні helper-и schema/compat:

    - `ProviderToolCompatFamily` документує спільний інвентар сімейств на сьогодні.
    - `buildProviderToolCompatFamilyHooks("gemini")` під’єднує очищення Gemini schema
      + діагностику для постачальників, яким потрібні безпечні для Gemini tool schemas.
    - `normalizeGeminiToolSchemas(...)` і `inspectGeminiToolSchemas(...)`
      — це базові публічні helper-и schema для Gemini.
    - `resolveXaiModelCompatPatch()` повертає вбудований compat patch xAI:
      `toolSchemaProfile: "xai"`, непідтримувані ключові слова schema, native підтримку
      `web_search` і декодування аргументів виклику інструментів із HTML-entity.
    - `applyXaiModelCompat(model)` застосовує той самий compat patch xAI до
      визначеної моделі до того, як вона потрапить до runner.

    Реальний вбудований приклад: plugin xAI використовує `normalizeResolvedModel` плюс
    `contributeResolvedModelCompat`, щоб ці метадані compat залишалися власністю
    постачальника, а не жорстко прописували правила xAI в core.

    Той самий шаблон package-root також лежить в основі інших вбудованих постачальників:

    - `@openclaw/openai-provider`: `api.ts` експортує builders постачальника,
      helper-и моделей за замовчуванням і builders realtime-постачальника
    - `@openclaw/openrouter-provider`: `api.ts` експортує builder постачальника
      плюс helper-и onboarding/config

    <Tabs>
      <Tab title="Обмін токенами">
        Для постачальників, яким потрібен обмін токенами перед кожним викликом inference:

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
      <Tab title="Ідентичність native transport">
        Для постачальників, яким потрібні native заголовки запиту/сесії або метадані в
        generic HTTP або WebSocket transport:

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

    <Accordion title="Усі доступні hooks постачальника">
      OpenClaw викликає hooks у такому порядку. Більшість постачальників використовують лише 2–3:

      | # | Hook | Коли використовувати |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей або значення `baseUrl` за замовчуванням |
      | 2 | `applyConfigDefaults` | Глобальні значення за замовчуванням, що належать постачальнику, під час materialization config |
      | 3 | `normalizeModelId` | Очищення alias застарілих/preview model-id перед пошуком |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` сімейства постачальника перед generic збиранням моделі |
      | 5 | `normalizeConfig` | Нормалізація config `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Переписування native streaming-usage compat для постачальників config |
      | 7 | `resolveConfigApiKey` | Визначення auth маркера env, що належить постачальнику |
      | 8 | `resolveSyntheticAuth` | Синтетичний auth для local/self-hosted або на основі config |
      | 9 | `shouldDeferSyntheticProfileAuth` | Опускання синтетичних placeholder-ів збереженого профілю нижче auth env/config |
      | 10 | `resolveDynamicModel` | Прийом довільних upstream id моделей |
      | 11 | `prepareDynamicModel` | Асинхронне отримання метаданих перед визначенням |
      | 12 | `normalizeResolvedModel` | Переписування transport перед runner |
  
    Нотатки щодо runtime fallback:

    - `normalizeConfig` спочатку перевіряє відповідного постачальника, потім інші
      plugins постачальників із підтримкою hook, доки один із них справді не змінить config.
      Якщо жоден provider hook не перепише підтримуваний запис config сімейства Google,
      усе одно застосовується вбудований нормалізатор Google config.
    - `resolveConfigApiKey` використовує provider hook, якщо він наданий. Вбудований
      шлях `amazon-bedrock` також має вбудований resolver маркера AWS env на цьому етапі,
      хоча runtime auth Bedrock усе ще використовує стандартний
      ланцюжок AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Прапори compat для моделей вендора за іншим сумісним transport |
      | 14 | `capabilities` | Застарілий статичний набір можливостей; лише для сумісності |
      | 15 | `normalizeToolSchemas` | Очищення tool-schema, що належить постачальнику, перед реєстрацією |
      | 16 | `inspectToolSchemas` | Діагностика tool-schema, що належить постачальнику |
      | 17 | `resolveReasoningOutputMode` | Контракт tagged vs native reasoning-output |
      | 18 | `prepareExtraParams` | Параметри запиту за замовчуванням |
      | 19 | `createStreamFn` | Повністю користувацький transport `StreamFn` |
      | 20 | `wrapStreamFn` | Користувацькі обгортки заголовків/тіла на звичайному шляху потоку |
      | 21 | `resolveTransportTurnState` | Native заголовки/метадані для кожного turn |
      | 22 | `resolveWebSocketSessionPolicy` | Native заголовки сесії WS / cool-down |
      | 23 | `formatApiKey` | Користувацька форма runtime token |
      | 24 | `refreshOAuth` | Користувацьке оновлення OAuth |
      | 25 | `buildAuthDoctorHint` | Поради з відновлення auth |
      | 26 | `matchesContextOverflowError` | Визначення overflow, що належить постачальнику |
      | 27 | `classifyFailoverReason` | Класифікація rate-limit/overload, що належить постачальнику |
      | 28 | `isCacheTtlEligible` | Gating TTL кешу prompt |
      | 29 | `buildMissingAuthMessage` | Користувацька підказка про відсутній auth |
      | 30 | `suppressBuiltInModel` | Приховування застарілих upstream-рядків |
      | 31 | `augmentModelCatalog` | Синтетичні рядки forward-compat |
      | 32 | `resolveThinkingProfile` | Набір опцій `/think`, специфічний для моделі |
      | 33 | `isBinaryThinking` | Сумісність binary thinking увімкнено/вимкнено |
      | 34 | `supportsXHighThinking` | Сумісність підтримки reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Сумісність політики `/think` за замовчуванням |
      | 36 | `isModernModelRef` | Відповідність live/smoke моделі |
      | 37 | `prepareRuntimeAuth` | Обмін токенами перед inference |
      | 38 | `resolveUsageAuth` | Користувацький розбір облікових даних usage |
      | 39 | `fetchUsageSnapshot` | Користувацький endpoint usage |
      | 40 | `createEmbeddingProvider` | Адаптер embedding, що належить постачальнику, для пам’яті/пошуку |
      | 41 | `buildReplayPolicy` | Користувацька політика replay/Compaction транскрипту |
      | 42 | `sanitizeReplayHistory` | Переписування replay, специфічні для постачальника, після загального очищення |
      | 43 | `validateReplayTurns` | Сувора валідація turn replay перед вбудованим runner |
      | 44 | `onModelSelected` | Callback після вибору моделі (наприклад, telemetry) |

      Примітка щодо налаштування prompt:

      - `resolveSystemPromptContribution` дає постачальнику змогу ін’єктувати
        cache-aware настанови для системного prompt для сімейства моделей. Віддавайте йому перевагу над
        `before_prompt_build`, коли поведінка належить одному сімейству постачальника/моделі
        і має зберігати стабільний/динамічний поділ кешу.

      Докладні описи та приклади з реального світу дивіться в
      [Інтернали: Runtime hooks постачальника](/uk/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Додайте додаткові можливості (необов’язково)">
    <a id="step-5-add-extra-capabilities"></a>
    Plugin постачальника може реєструвати мовлення, транскрипцію в реальному часі, голос у реальному
    часі, розуміння медіа, генерацію зображень, генерацію відео, web fetch
    і web search поряд із текстовим inference:

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

      api.registerSpeechProvider({
        id: "acme-ai",
        label: "Acme Speech",
        isConfigured: ({ config }) => Boolean(config.messages?.tts),
        synthesize: async (req) => ({
          audioBuffer: Buffer.from(/* PCM data */),
          outputFormat: "mp3",
          fileExtension: ".mp3",
          voiceCompatible: false,
        }),
      });

      api.registerRealtimeTranscriptionProvider({
        id: "acme-ai",
        label: "Acme Realtime Transcription",
        isConfigured: () => true,
        createSession: (req) => ({
          connect: async () => {},
          sendAudio: () => {},
          close: () => {},
          isConnected: () => true,
        }),
      });

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

      api.registerMediaUnderstandingProvider({
        id: "acme-ai",
        capabilities: ["image", "audio"],
        describeImage: async (req) => ({ text: "A photo of..." }),
        transcribeAudio: async (req) => ({ text: "Transcript..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Acme Images",
        generate: async (req) => ({ /* image result */ }),
      });

      api.registerVideoGenerationProvider({
        id: "acme-ai",
        label: "Acme Video",
        capabilities: {
          generate: {
            maxVideos: 1,
            maxDurationSeconds: 10,
            supportsResolution: true,
          },
          imageToVideo: {
            enabled: true,
            maxVideos: 1,
            maxInputImages: 1,
            maxDurationSeconds: 5,
          },
          videoToVideo: {
            enabled: false,
          },
        },
        generateVideo: async (req) => ({ videos: [] }),
      });

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
    }
    ```

    OpenClaw класифікує це як plugin **hybrid-capability**. Це
    рекомендований шаблон для корпоративних plugins (один plugin на вендора). Див.
    [Інтернали: Володіння можливостями](/uk/plugins/architecture#capability-ownership-model).

    Для генерації відео віддавайте перевагу показаній вище формі можливостей із урахуванням режимів:
    `generate`, `imageToVideo` і `videoToVideo`. Плоских агрегованих полів на кшталт
    `maxInputImages`, `maxInputVideos` і `maxDurationSeconds`
    недостатньо, щоб чисто оголосити підтримку режимів трансформації або вимкнених режимів.

    Постачальники генерації музики мають дотримуватися того самого шаблону:
    `generate` для генерації лише за prompt і `edit` для генерації
    на основі reference-image. Плоских агрегованих полів на кшталт `maxInputImages`,
    `supportsLyrics` і `supportsFormat` недостатньо, щоб оголосити підтримку `edit`;
    очікуваним контрактом є явні блоки `generate` / `edit`.

  </Step>

  <Step title="Тестування">
    <a id="step-6-test"></a>
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

Plugins постачальників публікуються так само, як і будь-який інший зовнішній кодовий plugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Не використовуйте тут застарілий alias публікації лише для Skills; пакети plugin-ів мають використовувати
`clawhub package publish`.

## Структура файлів

```
<bundled-plugin-root>/acme-ai/
├── package.json              # Метадані openclaw.providers
├── openclaw.plugin.json      # Маніфест із метаданими auth постачальника
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Тести
    └── usage.ts              # Endpoint usage (необов’язково)
```

## Довідник порядку каталогу

`catalog.order` керує тим, коли ваш каталог зливається відносно вбудованих
постачальників:

| Порядок | Коли | Випадок використання |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Перший прохід    | Прості постачальники з API key                         |
| `profile` | Після simple  | Постачальники, обмежені профілями auth                |
| `paired`  | Після profile | Синтез кількох пов’язаних записів             |
| `late`    | Останній прохід     | Перевизначення наявних постачальників (перемагає при колізії) |

## Наступні кроки

- [Plugins каналів](/uk/plugins/sdk-channel-plugins) — якщо ваш plugin також надає канал
- [SDK Runtime](/uk/plugins/sdk-runtime) — helper-и `api.runtime` (TTS, search, subagent)
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів subpath
- [Інтернали plugin-ів](/uk/plugins/architecture#provider-runtime-hooks) — деталі hooks і приклади вбудованих рішень
