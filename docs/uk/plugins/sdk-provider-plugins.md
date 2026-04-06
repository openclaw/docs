---
read_when:
    - Ви створюєте новий плагін постачальника моделей
    - Ви хочете додати до OpenClaw OpenAI-сумісний проксі або власну LLM
    - Вам потрібно зрозуміти автентифікацію постачальників, каталоги та runtime hooks
sidebarTitle: Provider Plugins
summary: Покроковий посібник зі створення плагіна постачальника моделей для OpenClaw
title: Створення плагінів постачальників
x-i18n:
    generated_at: "2026-04-06T15:31:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4da82a353e1bf4fe6dc09e14b8614133ac96565679627de51415926014bd3990
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Створення плагінів постачальників

У цьому посібнику покроково розглядається створення плагіна постачальника, який додає до OpenClaw постачальника моделей
(LLM). Наприкінці ви матимете постачальника з каталогом моделей,
автентифікацією через API-ключ і динамічним визначенням моделей.

<Info>
  Якщо ви раніше не створювали жодного плагіна OpenClaw, спочатку прочитайте
  [Getting Started](/uk/plugins/building-plugins) про базову структуру
  пакета й налаштування маніфесту.
</Info>

## Покрокове проходження

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
    облікові дані без завантаження runtime вашого плагіна. `modelSupport` є необов'язковим
    і дає змогу OpenClaw автоматично завантажувати ваш плагін постачальника за скороченими id моделей
    на кшталт `acme-large` ще до появи runtime hooks. Якщо ви публікуєте
    постачальника в ClawHub, поля `openclaw.compat` і `openclaw.build`
    обов'язкові в `package.json`.

  </Step>

  <Step title="Зареєструйте постачальника">
    Мінімальний постачальник потребує `id`, `label`, `auth` і `catalog`:

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

    Для вбудованих постачальників, які реєструють лише одного текстового постачальника з
    автентифікацією через API-ключ і одним runtime на основі каталогу, віддавайте перевагу вужчому
    допоміжному засобу `defineSingleProviderPluginEntry(...)`:

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
        },
      },
    });
    ```

    Якщо вашому потоку автентифікації також потрібно змінювати `models.providers.*`, псевдоніми й
    типову модель агента під час онбордингу, використовуйте готові допоміжні засоби з
    `openclaw/plugin-sdk/provider-onboard`. Найвужчі допоміжні засоби —
    це `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли нативний endpoint постачальника підтримує блоки streamed usage на
    звичайному transport `openai-completions`, віддавайте перевагу спільним допоміжним засобам каталогу з
    `openclaw/plugin-sdk/provider-catalog-shared`, а не жорстко закодованим перевіркам
    id постачальника. `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку з мапи можливостей endpoint, тому нативні endpoint у стилі Moonshot/DashScope
    також підключаються, навіть коли плагін використовує власний id постачальника.

  </Step>

  <Step title="Додайте динамічне визначення моделей">
    Якщо ваш постачальник приймає довільні id моделей (як проксі або маршрутизатор),
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
    прогрівання — `resolveDynamicModel` буде запущено знову після його завершення.

  </Step>

  <Step title="Додайте runtime hooks (за потреби)">
    Більшості постачальників достатньо `catalog` + `resolveDynamicModel`. Додавайте hooks
    поступово, у міру того як цього потребуватиме ваш постачальник.

    Спільні збирачі допоміжних засобів тепер покривають найпоширеніші сімейства replay/tool-compat,
    тому плагінам зазвичай не потрібно вручну підключати кожен hook по одному:

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

    | Family | Що воно підключає |
    | --- | --- |
    | `openai-compatible` | Спільна політика replay у стилі OpenAI для сумісних з OpenAI transport, включно з очищенням id викликів інструментів, виправленнями порядку assistant-first і загальною перевіркою ходів Gemini там, де це потрібно transport |
    | `anthropic-by-model` | Політика replay з урахуванням Claude, вибрана за `modelId`, тому transport Anthropic-message отримують очищення thinking-блоків, специфічне для Claude, лише коли визначена модель справді має id Claude |
    | `google-gemini` | Нативна політика replay Gemini плюс очищення bootstrap replay і режим виводу reasoning з тегами |
    | `passthrough-gemini` | Очищення thought-signature Gemini для моделей Gemini, що працюють через OpenAI-сумісні проксі transport; не вмикає нативну перевірку replay Gemini або переписування bootstrap |
    | `hybrid-anthropic-openai` | Гібридна політика для постачальників, які поєднують поверхні моделей Anthropic-message і OpenAI-compatible в одному плагіні; необов'язкове відкидання thinking-блоків лише для Claude залишається обмеженим стороною Anthropic |

    Реальні вбудовані приклади:

    - `google` і `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` і `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` і `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` і `zai`: `openai-compatible`

    Доступні сьогодні сімейства stream:

    | Family | Що воно підключає |
    | --- | --- |
    | `google-thinking` | Нормалізація payload thinking Gemini на спільному шляху stream |
    | `kilocode-thinking` | Обгортка reasoning Kilo на спільному шляху proxy stream, де для `kilo/auto` і id proxy reasoning, що не підтримуються, ін'єкція thinking пропускається |
    | `moonshot-thinking` | Відображення payload нативного двійкового thinking Moonshot з конфігурації + рівня `/think` |
    | `minimax-fast-mode` | Переписування моделі MiniMax fast-mode на спільному шляху stream |
    | `openai-responses-defaults` | Спільні нативні обгортки OpenAI/Codex Responses: заголовки атрибуції, `/fast`/`serviceTier`, verbosity тексту, нативний вебпошук Codex, формування payload сумісності reasoning і керування контекстом Responses |
    | `openrouter-thinking` | Обгортка reasoning OpenRouter для proxy-маршрутів, де пропуски для моделей, що не підтримуються, і `auto` централізовано обробляються |
    | `tool-stream-default-on` | Обгортка `tool_stream`, увімкнена типово, для постачальників на кшталт Z.AI, які хочуть потокову передачу інструментів, якщо її не вимкнули явно |

    Реальні вбудовані приклади:

    - `google` і `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` і `minimax-portal`: `minimax-fast-mode`
    - `openai` і `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` також експортує enum сімейств replay
    разом зі спільними допоміжними засобами, з яких ці сімейства побудовані. Типові публічні експорти
    включають:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - спільні збирачі replay, такі як `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` і
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - допоміжні засоби replay Gemini, такі як `sanitizeGoogleGeminiReplayHistory(...)`
      і `resolveTaggedReasoningOutputMode()`
    - допоміжні засоби для endpoint/моделей, такі як `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` і
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` надає і збирач сімейств, і
    публічні допоміжні засоби обгорток, які ці сімейства повторно використовують. Типові публічні експорти
    включають:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - спільні обгортки OpenAI/Codex, такі як
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` і
      `createCodexNativeWebSearchWrapper(...)`
    - спільні proxy/provider-обгортки, такі як `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` і `createMinimaxFastModeWrapper(...)`

    Деякі stream-допоміжні засоби навмисно залишаються локальними для постачальника. Поточний вбудований
    приклад: `@openclaw/anthropic-provider` експортує
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і
    низькорівневі збирачі обгорток Anthropic зі свого публічного шва `api.ts` /
    `contract-api.ts`. Ці допоміжні засоби залишаються специфічними для Anthropic, оскільки
    вони також кодують обробку бета-можливостей Claude OAuth і gating `context1m`.

    Інші вбудовані постачальники також зберігають transport-специфічні обгортки локальними, коли
    цю поведінку не вдається чисто розділити між сімействами. Поточний приклад: вбудований
    плагін xAI зберігає нативне формування xAI Responses у власному
    `wrapStreamFn`, включно з переписуванням псевдонімів `/fast`, типовим `tool_stream`,
    очищенням strict-tool, що не підтримується, і видаленням
    payload reasoning, специфічного для xAI.

    `openclaw/plugin-sdk/provider-tools` наразі надає одне спільне
    сімейство схем інструментів разом зі спільними допоміжними засобами схем/сумісності:

    - `ProviderToolCompatFamily` документує поточний перелік спільних сімейств.
    - `buildProviderToolCompatFamilyHooks("gemini")` підключає очищення схем Gemini
      + діагностику для постачальників, яким потрібні безпечні для Gemini схеми інструментів.
    - `normalizeGeminiToolSchemas(...)` і `inspectGeminiToolSchemas(...)`
      — це базові публічні допоміжні засоби для схем Gemini.
    - `resolveXaiModelCompatPatch()` повертає вбудований патч сумісності xAI:
      `toolSchemaProfile: "xai"`, ключові слова схем, що не підтримуються, нативну
      підтримку `web_search` і декодування аргументів викликів інструментів з HTML-сутностей.
    - `applyXaiModelCompat(model)` застосовує той самий патч сумісності xAI до
      визначеної моделі перед тим, як вона потрапить до раннера.

    Реальний вбудований приклад: плагін xAI використовує `normalizeResolvedModel` плюс
    `contributeResolvedModelCompat`, щоб ці метадані сумісності залишалися у володінні
    постачальника, а не жорстко кодувалися в core як правила xAI.

    Той самий шаблон на рівні кореня пакета також лежить в основі інших вбудованих постачальників:

    - `@openclaw/openai-provider`: `api.ts` експортує збирачі постачальника,
      допоміжні засоби типових моделей і збирачі постачальника realtime
    - `@openclaw/openrouter-provider`: `api.ts` експортує збирач постачальника
      плюс допоміжні засоби для онбордингу/конфігурації

    <Tabs>
      <Tab title="Обмін токенів">
        Для постачальників, яким потрібен обмін токенів перед кожним викликом inference:

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
      <Tab title="Ідентичність нативного transport">
        Для постачальників, яким потрібні нативні заголовки або метадані
        запиту/сеансу в загальних transport HTTP або WebSocket:

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
      <Tab title="Usage і білінг">
        Для постачальників, які надають дані usage/білінгу:

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
      OpenClaw викликає hooks у такому порядку. Більшість постачальників використовують лише 2-3:

      | # | Hook | Коли використовувати |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей або типові значення base URL |
      | 2 | `applyConfigDefaults` | Глобальні типові значення, якими володіє постачальник, під час materialization конфігурації |
      | 3 | `normalizeModelId` | Очищення застарілих/preview псевдонімів model-id перед пошуком |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` сімейства постачальника перед загальним складанням моделі |
      | 5 | `normalizeConfig` | Нормалізація конфігурації `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Переписування compat нативного streaming-usage для конфігурованих постачальників |
      | 7 | `resolveConfigApiKey` | Визначення автентифікації через env-marker, яким володіє постачальник |
      | 8 | `resolveSyntheticAuth` | Synthetic auth для local/self-hosted або на основі конфігурації |
      | 9 | `shouldDeferSyntheticProfileAuth` | Знижує пріоритет synthetic placeholder збереженого профілю порівняно з env/config auth |
      | 10 | `resolveDynamicModel` | Приймати довільні id моделей вище за потоком |
      | 11 | `prepareDynamicModel` | Асинхронне отримання метаданих перед визначенням |
      | 12 | `normalizeResolvedModel` | Переписування transport перед раннером |

    Примітки щодо runtime fallback:

    - `normalizeConfig` спочатку перевіряє відповідного постачальника, а потім інші
      плагіни постачальників із підтримкою hook, доки один із них справді не змінить конфігурацію.
      Якщо жоден hook постачальника не перепише підтримуваний запис конфігурації сімейства Google,
      вбудований нормалізатор конфігурації Google усе одно застосовується.
    - `resolveConfigApiKey` використовує hook постачальника, якщо той наданий. Вбудований
      шлях `amazon-bedrock` також має тут вбудований AWS env-marker resolver,
      хоча сама runtime-автентифікація Bedrock і далі використовує стандартний
      ланцюжок AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Прапорці compat для моделей постачальника за іншим сумісним transport |
      | 14 | `capabilities` | Застарілий статичний набір можливостей; лише для сумісності |
      | 15 | `normalizeToolSchemas` | Очищення схем інструментів, яким володіє постачальник, перед реєстрацією |
      | 16 | `inspectToolSchemas` | Діагностика схем інструментів, якою володіє постачальник |
      | 17 | `resolveReasoningOutputMode` | Контракт виводу reasoning з тегами чи нативний |
      | 18 | `prepareExtraParams` | Типові параметри запиту |
      | 19 | `createStreamFn` | Повністю власний transport StreamFn |
      | 20 | `wrapStreamFn` | Власні обгортки заголовків/тіла на звичайному шляху stream |
      | 21 | `resolveTransportTurnState` | Нативні заголовки/метадані для кожного ходу |
      | 22 | `resolveWebSocketSessionPolicy` | Нативні заголовки сеансу WS/cool-down |
      | 23 | `formatApiKey` | Власна форма runtime-токена |
      | 24 | `refreshOAuth` | Власне оновлення OAuth |
      | 25 | `buildAuthDoctorHint` | Підказка щодо відновлення автентифікації |
      | 26 | `matchesContextOverflowError` | Виявлення переповнення, яким володіє постачальник |
      | 27 | `classifyFailoverReason` | Класифікація rate-limit/overload, якою володіє постачальник |
      | 28 | `isCacheTtlEligible` | Керування TTL кешу prompt |
      | 29 | `buildMissingAuthMessage` | Власна підказка про відсутню автентифікацію |
      | 30 | `suppressBuiltInModel` | Приховати застарілі рядки вище за потоком |
      | 31 | `augmentModelCatalog` | Synthetic рядки сумісності вперед у каталозі |
      | 32 | `isBinaryThinking` | Двійкове thinking увімк./вимк. |
      | 33 | `supportsXHighThinking` | Підтримка reasoning `xhigh` |
      | 34 | `resolveDefaultThinkingLevel` | Типова політика `/think` |
      | 35 | `isModernModelRef` | Зіставлення live/smoke моделей |
      | 36 | `prepareRuntimeAuth` | Обмін токенів перед inference |
      | 37 | `resolveUsageAuth` | Власний парсинг облікових даних usage |
      | 38 | `fetchUsageSnapshot` | Власний endpoint usage |
      | 39 | `createEmbeddingProvider` | Адаптер embedding для memory/search, яким володіє постачальник |
      | 40 | `buildReplayPolicy` | Власна політика replay/compaction transcript |
      | 41 | `sanitizeReplayHistory` | Специфічні для постачальника переписування replay після загального очищення |
      | 42 | `validateReplayTurns` | Сувора перевірка ходів replay перед вбудованим раннером |
      | 43 | `onModelSelected` | Зворотний виклик після вибору (наприклад, телеметрія) |

      Примітка щодо налаштування prompt:

      - `resolveSystemPromptContribution` дає постачальнику змогу додавати
        системні підказки з урахуванням кешу для сімейства моделей. Віддавайте цьому перевагу замість
        `before_prompt_build`, коли поведінка належить одному сімейству постачальника/моделей
        і має зберігати стабільний/динамічний поділ кешу.

      Детальні описи й приклади з реального світу дивіться в
      [Internals: Provider Runtime Hooks](/uk/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Додайте додаткові можливості (необов'язково)">
    <a id="step-5-add-extra-capabilities"></a>
    Плагін постачальника може реєструвати speech, realtime transcription, realtime
    voice, media understanding, image generation, video generation, web fetch
    і web search разом із текстовим inference:

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

    OpenClaw класифікує це як плагін **hybrid-capability**. Це
    рекомендований шаблон для корпоративних плагінів (один плагін на постачальника). Дивіться
    [Internals: Capability Ownership](/uk/plugins/architecture#capability-ownership-model).

    Для генерації відео віддавайте перевагу показаній вище структурі можливостей із урахуванням режимів:
    `generate`, `imageToVideo` і `videoToVideo`. Плоскі агреговані поля на
    кшталт `maxInputImages`, `maxInputVideos` і `maxDurationSeconds`
    недостатні, щоб чисто оголошувати підтримку режимів перетворення або вимкнених режимів.

    Постачальники генерації музики мають дотримуватися того самого шаблону:
    `generate` для генерації лише за prompt і `edit` для генерації
    на основі еталонного зображення. Плоскі агреговані поля на кшталт `maxInputImages`,
    `supportsLyrics` і `supportsFormat` недостатні для оголошення підтримки редагування;
    очікуваним контрактом є явні блоки `generate` / `edit`.

  </Step>

  <Step title="Протестуйте">
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

## Опублікуйте в ClawHub

Плагіни постачальників публікуються так само, як і будь-який інший зовнішній кодовий плагін:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Не використовуйте тут застарілий псевдонім публікації лише для Skills; пакети плагінів мають використовувати
`clawhub package publish`.

## Структура файлів

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadata openclaw.providers
├── openclaw.plugin.json      # Маніфест із providerAuthEnvVars
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Тести
    └── usage.ts              # Endpoint usage (необов'язково)
```

## Довідник щодо порядку каталогів

`catalog.order` визначає, коли ваш каталог зливається відносно вбудованих
постачальників:

| Порядок | Коли | Випадок використання |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Перший прохід    | Звичайні постачальники з API-ключем                         |
| `profile` | Після simple  | Постачальники, обмежені профілями автентифікації                |
| `paired`  | Після profile | Синтезувати кілька пов'язаних записів             |
| `late`    | Останній прохід     | Перевизначити наявних постачальників (виграє при колізії) |

## Наступні кроки

- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — якщо ваш плагін також надає канал
- [SDK Runtime](/uk/plugins/sdk-runtime) — допоміжні засоби `api.runtime` (TTS, пошук, subagent)
- [SDK Overview](/uk/plugins/sdk-overview) — повний довідник імпортів subpath
- [Plugin Internals](/uk/plugins/architecture#provider-runtime-hooks) — подробиці про hooks і вбудовані приклади
