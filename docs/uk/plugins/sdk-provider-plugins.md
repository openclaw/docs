---
read_when:
    - Ви створюєте новий плагін постачальника моделей
    - Ви хочете додати до OpenClaw OpenAI-сумісний проксі або власну LLM
    - Вам потрібно зрозуміти автентифікацію постачальника, каталоги та runtime-хуки
sidebarTitle: Provider Plugins
summary: Покроковий посібник зі створення плагіна постачальника моделей для OpenClaw
title: Створення плагінів постачальників
x-i18n:
    generated_at: "2026-04-21T05:21:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac15d705e805dfb74a2a13538bcddf9a2fc78a4529657f2e1c1aab676cb3984d
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Створення плагінів постачальників

Цей посібник допоможе вам створити плагін постачальника, який додає постачальника
моделей (LLM) до OpenClaw. Наприкінці у вас буде постачальник із каталогом моделей,
автентифікацією через API-ключ і динамічним визначенням моделей.

<Info>
  Якщо ви раніше не створювали жодного плагіна OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins), щоб ознайомитися з базовою
  структурою пакета та налаштуванням маніфесту.
</Info>

<Tip>
  Плагіни постачальників додають моделі до стандартного циклу інференсу OpenClaw. Якщо модель
  має працювати через нативний агентний демон, який керує потоками, Compaction або подіями
  інструментів, поєднайте постачальника з [agent harness](/uk/plugins/sdk-agent-harness),
  замість того щоб виносити деталі протоколу демона в core.
</Tip>

## Покрокова інструкція

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
    облікові дані без завантаження runtime вашого плагіна. Додайте `providerAuthAliases`,
    коли варіант постачальника має повторно використовувати автентифікацію іншого id постачальника. `modelSupport`
    необов’язковий і дозволяє OpenClaw автоматично завантажувати ваш плагін постачальника зі скорочених
    id моделей, таких як `acme-large`, ще до появи runtime-хуків. Якщо ви публікуєте
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

    Якщо постачальник вище за течією використовує інші керівні токени, ніж OpenClaw, додайте
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

    `input` переписує фінальний системний промпт і текстовий вміст повідомлення перед
    передаванням. `output` переписує текстові дельти асистента та фінальний текст до того, як
    OpenClaw розбере власні керівні маркери або виконає доставку через канал.

    Для вбудованих постачальників, які реєструють лише одного текстового постачальника з
    автентифікацією через API-ключ плюс один runtime на основі каталогу, краще використовувати вужчий
    хелпер `defineSingleProviderPluginEntry(...)`:

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

    Якщо ваш потік автентифікації також має оновлювати `models.providers.*`, aliases і
    модель агента за замовчуванням під час onboarding, використовуйте preset-хелпери з
    `openclaw/plugin-sdk/provider-onboard`. Найвужчі хелпери —
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли нативна кінцева точка постачальника підтримує блоки використання в потоці на
    звичайному транспорті `openai-completions`, віддавайте перевагу спільним хелперам каталогу з
    `openclaw/plugin-sdk/provider-catalog-shared` замість жорсткого кодування перевірок id постачальника.
    `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку за мапою можливостей кінцевої точки, тож нативні
    кінцеві точки в стилі Moonshot/DashScope також можуть підключатися, навіть якщо плагін використовує власний id постачальника.

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
    прогріву — після його завершення `resolveDynamicModel` запускається знову.

  </Step>

  <Step title="Додайте runtime-хуки (за потреби)">
    Більшості постачальників достатньо лише `catalog` + `resolveDynamicModel`. Додавайте хуки
    поступово, коли це буде потрібно вашому постачальнику.

    Спільні builder-хелпери тепер охоплюють найпоширеніші сімейства replay/tool-compat,
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

    Доступні на сьогодні сімейства replay:

    | Сімейство | Що воно підключає |
    | --- | --- |
    | `openai-compatible` | Спільна політика replay у стилі OpenAI для OpenAI-сумісних транспортів, включно з очищенням tool-call-id, виправленням порядку assistant-first і загальною валідацією Gemini-turn там, де це потрібно транспорту |
    | `anthropic-by-model` | Політика replay з урахуванням Claude, яка вибирається за `modelId`, тож транспорти Anthropic-message отримують Claude-специфічне очищення thinking-block лише тоді, коли визначена модель справді має id Claude |
    | `google-gemini` | Нативна політика replay для Gemini плюс очищення bootstrap replay і режим tagged reasoning-output |
    | `passthrough-gemini` | Очищення thought-signature для моделей Gemini, що працюють через OpenAI-сумісні проксі-транспорти; не вмикає нативну валідацію replay Gemini або bootstrap-перезаписи |
    | `hybrid-anthropic-openai` | Гібридна політика для постачальників, які поєднують поверхні моделей Anthropic-message і OpenAI-compatible в одному плагіні; необов’язкове відкидання thinking-block лише для Claude залишається обмеженим стороною Anthropic |

    Реальні вбудовані приклади:

    - `google` і `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` і `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` і `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` і `zai`: `openai-compatible`

    Доступні на сьогодні сімейства потоків:

    | Сімейство | Що воно підключає |
    | --- | --- |
    | `google-thinking` | Нормалізація payload thinking Gemini на спільному шляху потоку |
    | `kilocode-thinking` | Обгортка reasoning Kilo на спільному шляху потоку проксі, де `kilo/auto` і непідтримувані id reasoning проксі пропускають ін’єкцію thinking |
    | `moonshot-thinking` | Відображення payload native-thinking Moonshot у двійковому форматі з config + рівня `/think` |
    | `minimax-fast-mode` | Перезапис моделі fast-mode MiniMax на спільному шляху потоку |
    | `openai-responses-defaults` | Спільні нативні обгортки OpenAI/Codex Responses: заголовки attribution, `/fast`/`serviceTier`, деталізація тексту, нативний вебпошук Codex, формування payload для сумісності reasoning і керування контекстом Responses |
    | `openrouter-thinking` | Обгортка reasoning OpenRouter для маршрутів проксі, з централізованою обробкою пропусків для непідтримуваних моделей/`auto` |
    | `tool-stream-default-on` | Обгортка `tool_stream`, увімкнена за замовчуванням, для постачальників на кшталт Z.AI, які хочуть потокову передачу інструментів, якщо її не вимкнено явно |

    Реальні вбудовані приклади:

    - `google` і `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` і `minimax-portal`: `minimax-fast-mode`
    - `openai` і `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` також експортує enum сімейств
    replay, а також спільні хелпери, з яких ці сімейства побудовані. Поширені публічні
    експорти включають:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - спільні builder-хелпери replay, такі як `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` і
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - хелпери replay Gemini, такі як `sanitizeGoogleGeminiReplayHistory(...)`
      і `resolveTaggedReasoningOutputMode()`
    - хелпери для кінцевих точок/моделей, такі як `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` і
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` надає і builder сімейств, і
    публічні хелпери-обгортки, які ці сімейства повторно використовують. Поширені публічні експорти
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
    - спільні обгортки проксі/постачальників, такі як `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` і `createMinimaxFastModeWrapper(...)`

    Деякі хелпери потоків навмисно залишаються локальними для постачальника. Поточний вбудований
    приклад: `@openclaw/anthropic-provider` експортує
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і
    низькорівневі builder-обгортки Anthropic зі свого публічного шва `api.ts` /
    `contract-api.ts`. Ці хелпери залишаються специфічними для Anthropic, тому
    що вони також кодують обробку бета-версій Claude OAuth і gating `context1m`.

    Інші вбудовані постачальники також зберігають специфічні для транспорту обгортки локально, коли
    таку поведінку неможливо чисто поділити між сімействами. Поточний приклад: вбудований
    плагін xAI зберігає нативне формування Responses xAI у власному
    `wrapStreamFn`, включно з перезаписами псевдонімів `/fast`, `tool_stream`
    за замовчуванням, очищенням непідтримуваних strict-tool і видаленням
    payload reasoning, специфічного для xAI.

    `openclaw/plugin-sdk/provider-tools` наразі надає одне спільне
    сімейство схем інструментів плюс спільні хелпери схем/сумісності:

    - `ProviderToolCompatFamily` документує поточний спільний перелік сімейств.
    - `buildProviderToolCompatFamilyHooks("gemini")` підключає
      очищення схеми Gemini + діагностику для постачальників, яким потрібні безпечні для Gemini схеми інструментів.
    - `normalizeGeminiToolSchemas(...)` і `inspectGeminiToolSchemas(...)`
      — це базові публічні хелпери схем Gemini.
    - `resolveXaiModelCompatPatch()` повертає вбудований патч сумісності xAI:
      `toolSchemaProfile: "xai"`, непідтримувані ключові слова схем, нативну
      підтримку `web_search` і декодування HTML-сутностей у аргументах виклику інструментів.
    - `applyXaiModelCompat(model)` застосовує той самий патч сумісності xAI до
      визначеної моделі, перш ніж вона потрапить до runner.

    Реальний вбудований приклад: плагін xAI використовує `normalizeResolvedModel` плюс
    `contributeResolvedModelCompat`, щоб ці метадані сумісності залишалися у володінні
    постачальника, а не були жорстко закодовані в core.

    Той самий шаблон package-root також лежить в основі інших вбудованих постачальників:

    - `@openclaw/openai-provider`: `api.ts` експортує builder-и постачальників,
      хелпери моделей за замовчуванням і builder-и realtime-постачальників
    - `@openclaw/openrouter-provider`: `api.ts` експортує builder
      постачальника, а також хелпери onboarding/config

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
        Для постачальників, яким потрібні нативні заголовки або метадані запиту/сесії на
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
      OpenClaw викликає хуки в такому порядку. Більшість постачальників використовують лише 2-3:

      | # | Hook | Коли використовувати |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей або значення `baseUrl` за замовчуванням |
      | 2 | `applyConfigDefaults` | Глобальні значення за замовчуванням, що належать постачальнику, під час materialization config |
      | 3 | `normalizeModelId` | Очищення псевдонімів legacy/preview model-id перед пошуком |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` сімейства постачальника перед загальним збиранням моделі |
      | 5 | `normalizeConfig` | Нормалізація config `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Перезаписи сумісності native streaming-usage для постачальників config |
      | 7 | `resolveConfigApiKey` | Визначення автентифікації env-marker, що належить постачальнику |
      | 8 | `resolveSyntheticAuth` | Синтетична автентифікація для локальних/self-hosted або config-backed випадків |
      | 9 | `shouldDeferSyntheticProfileAuth` | Опускати синтетичні placeholder-и збережених профілів нижче за env/config auth |
      | 10 | `resolveDynamicModel` | Приймати довільні id моделей upstream |
      | 11 | `prepareDynamicModel` | Асинхронне отримання метаданих перед визначенням |
      | 12 | `normalizeResolvedModel` | Перезаписи транспорту перед runner |

    Примітки щодо runtime fallback:

    - `normalizeConfig` спочатку перевіряє відповідний постачальник, а потім інші
      плагіни постачальників із підтримкою хуків, доки один із них справді не змінить config.
      Якщо жоден хук постачальника не переписує підтримуваний запис config сімейства Google,
      усе одно застосовується вбудований нормалізатор config Google.
    - `resolveConfigApiKey` використовує хук постачальника, якщо він доступний. Вбудований
      шлях `amazon-bedrock` також має тут вбудований resolver AWS env-marker,
      хоча сама runtime-автентифікація Bedrock і далі використовує стандартний
      ланцюжок AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Прапори сумісності для моделей постачальників за іншим сумісним транспортом |
      | 14 | `capabilities` | Legacy-мішок статичних можливостей; лише для сумісності |
      | 15 | `normalizeToolSchemas` | Очищення схеми інструментів, що належить постачальнику, перед реєстрацією |
      | 16 | `inspectToolSchemas` | Діагностика схеми інструментів, що належить постачальнику |
      | 17 | `resolveReasoningOutputMode` | Контракт виходу reasoning: tagged чи native |
      | 18 | `prepareExtraParams` | Параметри запиту за замовчуванням |
      | 19 | `createStreamFn` | Повністю власний транспорт StreamFn |
      | 20 | `wrapStreamFn` | Власні обгортки заголовків/тіла на стандартному шляху потоку |
      | 21 | `resolveTransportTurnState` | Нативні заголовки/метадані для кожного ходу |
      | 22 | `resolveWebSocketSessionPolicy` | Нативні заголовки сесії WS / час охолодження |
      | 23 | `formatApiKey` | Власна форма runtime-токена |
      | 24 | `refreshOAuth` | Власне оновлення OAuth |
      | 25 | `buildAuthDoctorHint` | Підказка для відновлення автентифікації |
      | 26 | `matchesContextOverflowError` | Визначення переповнення, що належить постачальнику |
      | 27 | `classifyFailoverReason` | Класифікація rate-limit/overload, що належить постачальнику |
      | 28 | `isCacheTtlEligible` | Керування TTL кешу промптів |
      | 29 | `buildMissingAuthMessage` | Власна підказка про відсутню автентифікацію |
      | 30 | `suppressBuiltInModel` | Приховати застарілі рядки upstream |
      | 31 | `augmentModelCatalog` | Синтетичні рядки для forward-compat |
      | 32 | `isBinaryThinking` | Увімкнення/вимкнення двійкового thinking |
      | 33 | `supportsXHighThinking` | Підтримка reasoning `xhigh` |
      | 34 | `supportsAdaptiveThinking` | Підтримка adaptive thinking |
      | 35 | `resolveDefaultThinkingLevel` | Політика `/think` за замовчуванням |
      | 36 | `isModernModelRef` | Відповідність моделей для live/smoke |
      | 37 | `prepareRuntimeAuth` | Обмін токенами перед інференсом |
      | 38 | `resolveUsageAuth` | Власний розбір облікових даних використання |
      | 39 | `fetchUsageSnapshot` | Власна кінцева точка використання |
      | 40 | `createEmbeddingProvider` | Адаптер embedding, що належить постачальнику, для пам’яті/пошуку |
      | 41 | `buildReplayPolicy` | Власна політика replay/Compaction транскрипту |
      | 42 | `sanitizeReplayHistory` | Специфічні для постачальника перезаписи replay після загального очищення |
      | 43 | `validateReplayTurns` | Сувора валідація ходів replay перед вбудованим runner |
      | 44 | `onModelSelected` | Зворотний виклик після вибору моделі (наприклад, телеметрія) |

      Примітка щодо налаштування промптів:

      - `resolveSystemPromptContribution` дозволяє постачальнику інжектувати
        cache-aware інструкції для системного промпту для сімейства моделей. Віддавайте перевагу йому замість
        `before_prompt_build`, коли поведінка належить одному сімейству постачальника/моделі
        і має зберігати стабільний/динамічний поділ кешу.

      Докладні описи та приклади з реального світу див. у
      [Внутрішні компоненти: runtime-хуки постачальника](/uk/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Додайте додаткові можливості (необов’язково)">
    <a id="step-5-add-extra-capabilities"></a>
    Плагін постачальника може реєструвати мовлення, транскрипцію в реальному часі, голос у реальному
    часі, розуміння медіа, генерацію зображень, генерацію відео, web fetch
    і web search поряд із текстовим інференсом:

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
        hint: "Отримуйте сторінки через бекенд рендерингу Acme.",
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

    OpenClaw класифікує це як плагін **hybrid-capability**. Це
    рекомендований шаблон для корпоративних плагінів (один плагін на одного постачальника). Див.
    [Внутрішні компоненти: володіння можливостями](/uk/plugins/architecture#capability-ownership-model).

    Для генерації відео віддавайте перевагу показаній вище структурі можливостей з урахуванням режимів:
    `generate`, `imageToVideo` і `videoToVideo`. Плоскі агреговані поля, такі
    як `maxInputImages`, `maxInputVideos` і `maxDurationSeconds`, не
    достатні, щоб чисто оголосити підтримку режимів перетворення або вимкнених режимів.

    Постачальники генерації музики мають дотримуватися того самого шаблону:
    `generate` для генерації лише за промптом і `edit` для генерації
    на основі референсного зображення. Плоскі агреговані поля, такі як `maxInputImages`,
    `supportsLyrics` і `supportsFormat`, не достатні, щоб оголосити
    підтримку редагування; очікуваний контракт — це явні блоки `generate` / `edit`.

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

Плагіни постачальників публікуються так само, як і будь-які інші зовнішні кодові плагіни:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Не використовуйте тут застарілий псевдонім публікації лише для Skills; пакети плагінів мають використовувати
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

## Довідник щодо порядку каталогу

`catalog.order` визначає, коли ваш каталог зливається відносно вбудованих
постачальників:

| Порядок     | Коли          | Випадок використання                          |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Перший прохід    | Звичайні постачальники з API-ключем                         |
| `profile` | Після simple  | Постачальники, обмежені профілями автентифікації                |
| `paired`  | Після profile | Синтез кількох пов’язаних записів             |
| `late`    | Останній прохід     | Перевизначення наявних постачальників (перемагає при конфлікті) |

## Наступні кроки

- [Плагіни каналів](/uk/plugins/sdk-channel-plugins) — якщо ваш плагін також надає канал
- [SDK Runtime](/uk/plugins/sdk-runtime) — хелпери `api.runtime` (TTS, пошук, subagent)
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник з імпортів subpath
- [Внутрішні компоненти плагінів](/uk/plugins/architecture#provider-runtime-hooks) — деталі хуків і вбудовані приклади
