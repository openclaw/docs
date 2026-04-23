---
read_when:
    - Ви створюєте новий Plugin постачальника моделей
    - Ви хочете додати до OpenClaw OpenAI-сумісний проксі або власну LLM
    - Вам потрібно зрозуміти автентифікацію постачальника, каталоги та runtime-хуки
sidebarTitle: Provider Plugins
summary: Покроковий посібник зі створення Plugin постачальника моделей для OpenClaw
title: Створення Plugin постачальників моделей
x-i18n:
    generated_at: "2026-04-23T02:58:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: b46f72d7f636caf4b072ce84db2af5b6e6f4c8d4b75f6ea102c948c3865353c7
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Створення Plugin постачальників моделей

Цей посібник покроково пояснює створення Plugin постачальника, який додає постачальника моделей
(LLM) до OpenClaw. Наприкінці у вас буде постачальник із каталогом моделей,
автентифікацією через API-ключ і динамічним визначенням моделей.

<Info>
  Якщо ви раніше не створювали жодного Plugin для OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins) про базову структуру пакета
  та налаштування маніфесту.
</Info>

<Tip>
  Plugin постачальників додають моделі до стандартного циклу інференсу OpenClaw. Якщо модель
  має працювати через нативний агент-демон, який керує потоками, Compaction або подіями
  інструментів, поєднайте постачальника з [agent harness](/uk/plugins/sdk-agent-harness),
  а не виносьте деталі протоколу демона в core.
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
    облікові дані без завантаження runtime вашого Plugin. Додавайте `providerAuthAliases`,
    коли варіант постачальника має повторно використовувати автентифікацію іншого ідентифікатора постачальника. `modelSupport`
    є необов’язковим і дозволяє OpenClaw автоматично завантажувати ваш Plugin постачальника зі скорочених
    ідентифікаторів моделей, як-от `acme-large`, ще до появи runtime-хуків. Якщо ви публікуєте
    постачальника в ClawHub, поля `openclaw.compat` і `openclaw.build`
    є обов’язковими в `package.json`.

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

    Якщо апстрім-постачальник використовує інші керівні токени, ніж OpenClaw, додайте
    невелике двонапрямне текстове перетворення замість заміни шляху стримінгу:

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
    передаванням. `output` переписує текстові дельти відповіді асистента та фінальний текст до того,
    як OpenClaw розбере власні керівні маркери або доставку через канал.

    Для вбудованих постачальників, які реєструють лише одного текстового постачальника з автентифікацією
    через API-ключ і одним runtime на основі каталогу, надавайте перевагу вужчому
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

    `buildProvider` — це шлях живого каталогу, який використовується, коли OpenClaw може визначити реальну
    автентифікацію постачальника. Він може виконувати специфічне для постачальника виявлення.
    Використовуйте `buildStaticProvider` лише для офлайнових рядків, які безпечно показувати до налаштування
    автентифікації; він не повинен вимагати облікові дані або виконувати мережеві запити.
    Відображення `models list --all` в OpenClaw наразі виконує статичні каталоги
    лише для вбудованих Plugin постачальників, із порожньою конфігурацією, порожнім env та без
    шляхів агента/робочого простору.

    Якщо вашому процесу автентифікації також потрібно змінювати `models.providers.*`, псевдоніми
    та модель агента за замовчуванням під час onboard, використовуйте допоміжні пресети з
    `openclaw/plugin-sdk/provider-onboard`. Найвужчі допоміжні методи:
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли нативна кінцева точка постачальника підтримує потокові блоки використання в
    звичайному транспорті `openai-completions`, надавайте перевагу спільним допоміжним методам каталогу з
    `openclaw/plugin-sdk/provider-catalog-shared` замість жорсткого кодування перевірок ідентифікатора постачальника.
    `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку за картою можливостей кінцевої точки,
    тож нативні кінцеві точки в стилі Moonshot/DashScope також можуть підключатися, навіть якщо Plugin
    використовує власний ідентифікатор постачальника.

  </Step>

  <Step title="Додайте динамічне визначення моделі">
    Якщо ваш постачальник приймає довільні ідентифікатори моделей (наприклад, проксі або маршрутизатор),
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
    Більшості постачальників потрібні лише `catalog` + `resolveDynamicModel`. Додавайте хуки
    поступово, у міру того як вони потрібні вашому постачальнику.

    Спільні конструктори допоміжних методів тепер покривають найпоширеніші сімейства replay/tool-compat,
    тому Plugin зазвичай не потрібно вручну підключати кожен хук окремо:

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

    | Сімейство | Що воно підключає |
    | --- | --- |
    | `openai-compatible` | Спільна політика replay у стилі OpenAI для OpenAI-сумісних транспортів, включно з санітизацією ідентифікаторів викликів інструментів, виправленням порядку assistant-first і загальною валідацією Gemini-turn там, де це потрібно транспорту |
    | `anthropic-by-model` | Claude-орієнтована політика replay, що вибирається за `modelId`, тож транспорти повідомлень Anthropic отримують специфічне очищення thinking-block Claude лише тоді, коли визначена модель справді є ідентифікатором Claude |
    | `google-gemini` | Нативна політика replay Gemini плюс санітизація bootstrap replay і режим тегованого виводу reasoning |
    | `passthrough-gemini` | Санітизація thought-signature Gemini для моделей Gemini, що працюють через OpenAI-сумісні проксі-транспорти; не вмикає нативну валідацію replay Gemini або переписування bootstrap |
    | `hybrid-anthropic-openai` | Гібридна політика для постачальників, які поєднують поверхні моделей Anthropic-message та OpenAI-compatible в одному Plugin; необов’язкове відкидання thinking-block лише для Claude залишається обмеженим стороною Anthropic |

    Реальні приклади з вбудованих Plugin:

    - `google` і `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` і `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` і `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` і `zai`: `openai-compatible`

    Доступні на сьогодні сімейства stream:

    | Сімейство | Що воно підключає |
    | --- | --- |
    | `google-thinking` | Нормалізація thinking payload Gemini на спільному шляху stream |
    | `kilocode-thinking` | Обгортка reasoning Kilo на спільному шляху proxy stream, де `kilo/auto` та непідтримувані ідентифікатори reasoning proxy пропускають ін’єкцію thinking |
    | `moonshot-thinking` | Відображення двійкового payload native-thinking Moonshot із config + рівня `/think` |
    | `minimax-fast-mode` | Переписування моделі fast-mode MiniMax на спільному шляху stream |
    | `openai-responses-defaults` | Спільні нативні обгортки OpenAI/Codex Responses: заголовки attribution, `/fast`/`serviceTier`, деталізація text, нативний вебпошук Codex, формування payload для reasoning-compat і керування контекстом Responses |
    | `openrouter-thinking` | Обгортка reasoning OpenRouter для маршрутів proxy з централізованою обробкою пропусків для непідтримуваних моделей/`auto` |
    | `tool-stream-default-on` | Обгортка `tool_stream`, увімкнена за замовчуванням, для постачальників на кшталт Z.AI, яким потрібен stream інструментів, якщо його явно не вимкнено |

    Реальні приклади з вбудованих Plugin:

    - `google` і `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` і `minimax-portal`: `minimax-fast-mode`
    - `openai` і `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` також експортує enum
    сімейств replay, а також спільні допоміжні методи, з яких ці сімейства побудовані. До поширених публічних
    експортів належать:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - спільні конструктори replay, як-от `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` і
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - допоміжні методи replay Gemini, як-от `sanitizeGoogleGeminiReplayHistory(...)`
      і `resolveTaggedReasoningOutputMode()`
    - допоміжні методи endpoint/model, як-от `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` і
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` надає як конструктор сімейств, так і
    публічні допоміжні методи обгорток, які ці сімейства повторно використовують. До поширених публічних експортів
    належать:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - спільні обгортки OpenAI/Codex, як-от
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` і
      `createCodexNativeWebSearchWrapper(...)`
    - спільні обгортки proxy/provider, як-от `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` і `createMinimaxFastModeWrapper(...)`

    Деякі допоміжні методи stream навмисно залишаються локальними для постачальника. Поточний вбудований
    приклад: `@openclaw/anthropic-provider` експортує
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і
    низькорівневі конструктори обгорток Anthropic через свій публічний seam `api.ts` /
    `contract-api.ts`. Ці допоміжні методи залишаються специфічними для Anthropic, оскільки
    вони також кодують обробку Claude OAuth beta і gating `context1m`.

    Інші вбудовані постачальники також тримають локальними обгортки, специфічні для транспорту, коли
    поведінку неможливо чисто поділити між сімействами. Поточний приклад: вбудований Plugin xAI
    зберігає нативне формування xAI Responses у власному
    `wrapStreamFn`, включно з переписуванням псевдонімів `/fast`, типовим `tool_stream`,
    очищенням непідтримуваних strict-tool і
    видаленням payload reasoning, специфічного для xAI.

    `openclaw/plugin-sdk/provider-tools` наразі надає одне спільне
    сімейство схеми інструментів плюс спільні допоміжні методи schema/compat:

    - `ProviderToolCompatFamily` документує поточний перелік спільних сімейств.
    - `buildProviderToolCompatFamilyHooks("gemini")` підключає очищення схеми Gemini
      + діагностику для постачальників, яким потрібні безпечні для Gemini схеми інструментів.
    - `normalizeGeminiToolSchemas(...)` і `inspectGeminiToolSchemas(...)`
      — це базові публічні допоміжні методи схем Gemini.
    - `resolveXaiModelCompatPatch()` повертає вбудований compat patch xAI:
      `toolSchemaProfile: "xai"`, непідтримувані ключові слова схеми, нативна
      підтримка `web_search` і декодування аргументів виклику інструментів із HTML-entity.
    - `applyXaiModelCompat(model)` застосовує той самий compat patch xAI до
      визначеної моделі до того, як вона потрапить до runner.

    Реальний приклад із вбудованих Plugin: Plugin xAI використовує `normalizeResolvedModel` плюс
    `contributeResolvedModelCompat`, щоб ці метадані compat належали
    постачальнику, а не були жорстко закодовані в core.

    Той самий шаблон package-root також лежить в основі інших вбудованих постачальників:

    - `@openclaw/openai-provider`: `api.ts` експортує конструктори постачальників,
      допоміжні методи моделі за замовчуванням і конструктори realtime постачальників
    - `@openclaw/openrouter-provider`: `api.ts` експортує конструктор постачальника
      плюс допоміжні методи onboard/config

    <Tabs>
      <Tab title="Обмін токенів">
        Для постачальників, яким потрібен обмін токенів перед кожним викликом інференсу:

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
        Для постачальників, яким потрібні власні заголовки запитів або зміни тіла запиту:

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
        Для постачальників, яким потрібні нативні заголовки запиту/сесії або метадані на
        узагальнених транспортних рівнях HTTP або WebSocket:

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
      OpenClaw викликає хуки в такому порядку. Більшості постачальників потрібні лише 2–3:

      | # | Хук | Коли використовувати |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей або значення `baseUrl` за замовчуванням |
      | 2 | `applyConfigDefaults` | Глобальні значення за замовчуванням, що належать постачальнику, під час матеріалізації config |
      | 3 | `normalizeModelId` | Очищення псевдонімів `model-id` для legacy/preview перед пошуком |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` для сімейства постачальника перед загальним збиранням моделі |
      | 5 | `normalizeConfig` | Нормалізація config `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Переписування native streaming-usage compat для постачальників config |
      | 7 | `resolveConfigApiKey` | Визначення автентифікації через env-marker, що належить постачальнику |
      | 8 | `resolveSyntheticAuth` | Синтетична автентифікація для local/self-hosted або на основі config |
      | 9 | `shouldDeferSyntheticProfileAuth` | Опускає синтетичні заповнювачі збереженого профілю нижче за автентифікацію env/config |
      | 10 | `resolveDynamicModel` | Приймати довільні ідентифікатори апстрім-моделей |
      | 11 | `prepareDynamicModel` | Асинхронне отримання метаданих перед визначенням |
      | 12 | `normalizeResolvedModel` | Переписування транспорту перед runner |

    Нотатки щодо runtime fallback:

    - `normalizeConfig` спочатку перевіряє відповідний постачальник, а потім інші
      Plugin постачальників, що підтримують хуки, доки один із них справді не змінить config.
      Якщо жоден хук постачальника не перепише підтримуваний запис config сімейства Google,
      усе одно буде застосовано вбудований нормалізатор config Google.
    - `resolveConfigApiKey` використовує хук постачальника, якщо він доступний. Вбудований
      шлях `amazon-bedrock` також має вбудований resolver AWS env-marker саме тут,
      хоча автентифікація runtime Bedrock і далі використовує стандартний
      ланцюжок AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Прапорці compat для моделей вендора за іншим сумісним транспортом |
      | 14 | `capabilities` | Статичний набір можливостей для legacy; лише сумісність |
      | 15 | `normalizeToolSchemas` | Очищення схеми інструментів, що належить постачальнику, перед реєстрацією |
      | 16 | `inspectToolSchemas` | Діагностика схеми інструментів, що належить постачальнику |
      | 17 | `resolveReasoningOutputMode` | Контракт тегованого чи нативного виводу reasoning |
      | 18 | `prepareExtraParams` | Параметри запиту за замовчуванням |
      | 19 | `createStreamFn` | Повністю власний транспорт StreamFn |
      | 20 | `wrapStreamFn` | Власні обгортки заголовків/тіла на звичайному шляху stream |
      | 21 | `resolveTransportTurnState` | Нативні заголовки/метадані для кожного turn |
      | 22 | `resolveWebSocketSessionPolicy` | Нативні заголовки сесії WS / cool-down |
      | 23 | `formatApiKey` | Власна форма токена runtime |
      | 24 | `refreshOAuth` | Власне оновлення OAuth |
      | 25 | `buildAuthDoctorHint` | Підказка для відновлення автентифікації |
      | 26 | `matchesContextOverflowError` | Виявлення переповнення контексту, що належить постачальнику |
      | 27 | `classifyFailoverReason` | Класифікація rate-limit/overload, що належить постачальнику |
      | 28 | `isCacheTtlEligible` | Керування TTL кешу промптів |
      | 29 | `buildMissingAuthMessage` | Власна підказка про відсутню автентифікацію |
      | 30 | `suppressBuiltInModel` | Приховати застарілі апстрім-рядки |
      | 31 | `augmentModelCatalog` | Синтетичні рядки для прямої сумісності вперед |
      | 32 | `resolveThinkingProfile` | Набір опцій `/think`, специфічний для моделі |
      | 33 | `isBinaryThinking` | Сумісність із двійковим вмиканням/вимиканням thinking |
      | 34 | `supportsXHighThinking` | Сумісність із підтримкою reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Сумісність із політикою `/think` за замовчуванням |
      | 36 | `isModernModelRef` | Відповідність live/smoke моделей |
      | 37 | `prepareRuntimeAuth` | Обмін токенів перед інференсом |
      | 38 | `resolveUsageAuth` | Власний розбір облікових даних використання |
      | 39 | `fetchUsageSnapshot` | Власна кінцева точка використання |
      | 40 | `createEmbeddingProvider` | Адаптер embedding, що належить постачальнику, для пам’яті/пошуку |
      | 41 | `buildReplayPolicy` | Власна політика replay/Compaction транскрипту |
      | 42 | `sanitizeReplayHistory` | Переписування replay, специфічне для постачальника, після загального очищення |
      | 43 | `validateReplayTurns` | Сувора валідація turn replay перед вбудованим runner |
      | 44 | `onModelSelected` | Callback після вибору моделі (наприклад, телеметрія) |

      Примітка щодо налаштування промптів:

      - `resolveSystemPromptContribution` дозволяє постачальнику додавати до
        системного промпту підказки для сімейства моделей з урахуванням кешу. Надавайте йому перевагу над
        `before_prompt_build`, коли поведінка належить одному сімейству постачальника/моделі
        і має зберігати стабільний/динамічний поділ кешу.

      Докладні описи та реальні приклади див. у
      [Internals: Provider Runtime Hooks](/uk/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Додайте додаткові можливості (необов’язково)">
    <a id="step-5-add-extra-capabilities"></a>
    Plugin постачальника може реєструвати speech, транскрипцію в realtime, голос у realtime,
    розуміння медіа, генерацію зображень, генерацію відео, web fetch
    і web search разом із текстовим інференсом:

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
    }
    ```

    OpenClaw класифікує це як plugin **hybrid-capability**. Це
    рекомендований шаблон для корпоративних Plugin (один Plugin на вендора). Див.
    [Internals: Capability Ownership](/uk/plugins/architecture#capability-ownership-model).

    Для генерації відео надавайте перевагу наведеній вище структурі можливостей із урахуванням режиму:
    `generate`, `imageToVideo` і `videoToVideo`. Плоскі агреговані поля, як-от
    `maxInputImages`, `maxInputVideos` і `maxDurationSeconds`,
    недостатні, щоб коректно оголосити підтримку режимів перетворення або вимкнених режимів.

    Постачальники генерації музики мають дотримуватися того самого шаблону:
    `generate` для генерації лише за промптом і `edit` для генерації
    на основі еталонного зображення. Плоскі агреговані поля, як-от `maxInputImages`,
    `supportsLyrics` і `supportsFormat`, недостатні для оголошення підтримки редагування;
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

Plugin постачальників публікуються так само, як і будь-який інший зовнішній code Plugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Не використовуйте тут застарілий псевдонім публікації лише для Skills; пакети Plugin мають використовувати
`clawhub package publish`.

## Структура файлів

```
<bundled-plugin-root>/acme-ai/
├── package.json              # Метадані openclaw.providers
├── openclaw.plugin.json      # Маніфест із метаданими автентифікації постачальника
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Тести
    └── usage.ts              # Кінцева точка використання (необов’язково)
```

## Довідка щодо порядку каталогу

`catalog.order` визначає, коли ваш каталог об’єднується відносно вбудованих
постачальників:

| Порядок | Коли | Випадок використання |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Перший прохід    | Прості постачальники з API-ключем                         |
| `profile` | Після simple  | Постачальники, прив’язані до профілів автентифікації                |
| `paired`  | Після profile | Синтез кількох пов’язаних записів             |
| `late`    | Останній прохід     | Перевизначення наявних постачальників (перемагає при конфлікті) |

## Наступні кроки

- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — якщо ваш Plugin також надає канал
- [SDK Runtime](/uk/plugins/sdk-runtime) — допоміжні методи `api.runtime` (TTS, search, subagent)
- [SDK Overview](/uk/plugins/sdk-overview) — повний довідник щодо імпортів subpath
- [Plugin Internals](/uk/plugins/architecture#provider-runtime-hooks) — подробиці про хуки та приклади з вбудованих Plugin
