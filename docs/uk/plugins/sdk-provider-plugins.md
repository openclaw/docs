---
read_when:
    - Ви створюєте новий plugin постачальника моделей
    - Ви хочете додати до OpenClaw сумісний з OpenAI проксі або користувацьку LLM
    - Вам потрібно зрозуміти автентифікацію постачальника, каталоги та рантайм-хуки
sidebarTitle: Provider Plugins
summary: Покроковий посібник зі створення plugin постачальника моделей для OpenClaw
title: Створення plugin постачальників моделей
x-i18n:
    generated_at: "2026-04-23T03:31:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba14ad9c9ac35c6209b6533e50ab3a6da0ef0de2ea6a6a4e7bf69bc65d39c484
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Створення plugin постачальників моделей

Цей посібник пояснює, як створити plugin постачальника, який додає постачальника моделей
(LLM) до OpenClaw. Наприкінці у вас буде постачальник із каталогом моделей,
автентифікацією через API-ключ і динамічним визначенням моделей.

<Info>
  Якщо ви раніше не створювали plugin для OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins) для ознайомлення з базовою
  структурою пакета та налаштуванням маніфесту.
</Info>

<Tip>
  Plugin постачальників додають моделі до стандартного циклу інференсу OpenClaw. Якщо модель
  має працювати через нативний демон агента, який керує потоками, Compaction або подіями
  інструментів, поєднайте постачальника з [agent harness](/uk/plugins/sdk-agent-harness),
  а не виносьте деталі протоколу демона в ядро.
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
    облікові дані без завантаження рантайму вашого plugin. Додавайте `providerAuthAliases`,
    коли варіант постачальника має повторно використовувати auth іншого id постачальника. `modelSupport`
    є необов’язковим і дозволяє OpenClaw автоматично завантажувати ваш plugin постачальника за скороченими
    id моделей, як-от `acme-large`, ще до появи рантайм-хуків. Якщо ви публікуєте
    постачальника в ClawHub, поля `openclaw.compat` і `openclaw.build`
    у `package.json` є обов’язковими.

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

    Якщо постачальник вище за потоком використовує інші керівні токени, ніж OpenClaw, додайте
    невелике двоспрямоване текстове перетворення замість заміни шляху потокової передачі:

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
    передаванням. `output` переписує текстові дельти асистента й фінальний текст до того, як
    OpenClaw розбере власні керівні маркери або доставку каналом.

    Для вбудованих постачальників, які реєструють лише одного текстового постачальника з auth через API-ключ
    плюс один рантайм, що підтримується каталогом, віддавайте перевагу вужчому
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

    `buildProvider` — це шлях живого каталогу, який використовується, коли OpenClaw може визначити реальний
    auth постачальника. Він може виконувати специфічне для постачальника виявлення. Використовуйте
    `buildStaticProvider` лише для офлайн-рядків, які безпечно показувати до налаштування auth;
    він не повинен вимагати облікових даних або виконувати мережеві запити.
    Показ `models list --all` в OpenClaw наразі виконує статичні каталоги
    лише для вбудованих plugin постачальників, із порожньою конфігурацією, порожнім env і без
    шляхів agent/workspace.

    Якщо ваш потік auth також має оновлювати `models.providers.*`, аліаси та
    модель агента за замовчуванням під час onboarding, використовуйте preset-хелпери з
    `openclaw/plugin-sdk/provider-onboard`. Найвужчі хелпери:
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли нативна кінцева точка постачальника підтримує блоки використання в потоці на
    звичайному транспорті `openai-completions`, віддавайте перевагу спільним хелперам каталогу з
    `openclaw/plugin-sdk/provider-catalog-shared` замість жорсткого кодування перевірок provider-id. 
    `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку за картою можливостей кінцевої точки, 
    тож нативні кінцеві точки в стилі Moonshot/DashScope також підключаються, навіть коли plugin використовує
    користувацький provider id.

  </Step>

  <Step title="Додайте динамічне визначення моделей">
    Якщо ваш постачальник приймає довільні id моделей, (наприклад, проксі або маршрутизатор),
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

  <Step title="Додайте рантайм-хуки (за потреби)">
    Більшості постачальників потрібні лише `catalog` + `resolveDynamicModel`. Додавайте хуки
    поступово, у міру потреб вашого постачальника.

    Спільні builder-хелпери тепер покривають найпоширеніші сімейства replay/tool-compat,
    тому plugin зазвичай не потрібно вручну підключати кожен хук окремо:

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
    | `openai-compatible` | Спільна політика replay у стилі OpenAI для транспортів, сумісних з OpenAI, включно з санітарною обробкою tool-call-id, виправленням порядку assistant-first і загальною валідацією Gemini-turn там, де це потрібно транспорту |
    | `anthropic-by-model` | Політика replay з урахуванням Claude, що вибирається за `modelId`, тож транспорти Anthropic-message отримують очищення thinking-block, специфічне для Claude, лише коли визначена модель справді має id Claude |
    | `google-gemini` | Нативна політика replay для Gemini плюс санітарна обробка bootstrap replay і режим тегованого reasoning-output |
    | `passthrough-gemini` | Санітарна обробка Gemini thought-signature для моделей Gemini, що працюють через проксі-транспорти, сумісні з OpenAI; не вмикає нативну валідацію replay Gemini або переписування bootstrap |
    | `hybrid-anthropic-openai` | Гібридна політика для постачальників, які поєднують поверхні моделей Anthropic-message і OpenAI-compatible в одному plugin; необов’язкове відкидання thinking-block лише для Claude залишається обмеженим стороною Anthropic |

    Реальні приклади вбудованих постачальників:

    - `google` і `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` і `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` і `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` і `zai`: `openai-compatible`

    Доступні на сьогодні сімейства stream:

    | Сімейство | Що воно підключає |
    | --- | --- |
    | `google-thinking` | Нормалізація payload thinking Gemini на спільному шляху stream |
    | `kilocode-thinking` | Обгортка reasoning Kilo на спільному шляху proxy stream, де `kilo/auto` і непідтримувані proxy reasoning id пропускають ін’єктований thinking |
    | `moonshot-thinking` | Відображення payload native-thinking Moonshot у двійковому форматі з config + рівня `/think` |
    | `minimax-fast-mode` | Переписування моделі MiniMax fast-mode на спільному шляху stream |
    | `openai-responses-defaults` | Спільні нативні обгортки OpenAI/Codex Responses: attribution headers, `/fast`/`serviceTier`, text verbosity, нативний web search Codex, формування payload reasoning-compat і керування контекстом Responses |
    | `openrouter-thinking` | Обгортка reasoning OpenRouter для proxy-маршрутів, із централізованою обробкою пропусків unsupported-model/`auto` |
    | `tool-stream-default-on` | Обгортка `tool_stream`, увімкнена за замовчуванням, для постачальників на кшталт Z.AI, які хочуть потокову передачу інструментів, якщо її не вимкнено явно |

    Реальні приклади вбудованих постачальників:

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
    - спільні builder-и replay, такі як `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` і
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - хелпери replay для Gemini, такі як `sanitizeGoogleGeminiReplayHistory(...)`
      і `resolveTaggedReasoningOutputMode()`
    - хелпери endpoint/model, такі як `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` і
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` надає як builder сімейств,
    так і публічні хелпери-обгортки, які ці сімейства використовують повторно. Поширені публічні експорти
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
    - спільні обгортки proxy/provider, такі як `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` і `createMinimaxFastModeWrapper(...)`

    Деякі stream-хелпери навмисно залишаються локальними для постачальника. Поточний вбудований
    приклад: `@openclaw/anthropic-provider` експортує
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і
    builder-и нижчого рівня для обгорток Anthropic зі свого публічного шва `api.ts` /
    `contract-api.ts`. Ці хелпери залишаються специфічними для Anthropic, оскільки
    вони також кодують обробку Claude OAuth beta і gating `context1m`.

    Інші вбудовані постачальники також тримають локальними обгортки, специфічні для транспорту, коли
    цю поведінку не можна чисто поділити між сімействами. Поточний приклад: вбудований plugin xAI
    зберігає нативне формування xAI Responses у власному
    `wrapStreamFn`, включно з переписуванням аліасів `/fast`, `tool_stream` за замовчуванням,
    очищенням unsupported strict-tool і видаленням payload reasoning, специфічним для xAI.

    `openclaw/plugin-sdk/provider-tools` наразі надає одне спільне сімейство
    схем інструментів плюс спільні хелпери schema/compat:

    - `ProviderToolCompatFamily` документує поточний спільний інвентар сімейств.
    - `buildProviderToolCompatFamilyHooks("gemini")` підключає очищення схем Gemini
      + діагностику для постачальників, яким потрібні безпечні для Gemini схеми інструментів.
    - `normalizeGeminiToolSchemas(...)` і `inspectGeminiToolSchemas(...)`
      — це базові публічні хелпери схем Gemini.
    - `resolveXaiModelCompatPatch()` повертає вбудований compat-патч xAI:
      `toolSchemaProfile: "xai"`, непідтримувані ключові слова схем, нативну
      підтримку `web_search` і декодування аргументів виклику інструментів з HTML-сутностей.
    - `applyXaiModelCompat(model)` застосовує той самий compat-патч xAI до
      визначеної моделі до того, як вона дійде до runner.

    Реальний вбудований приклад: plugin xAI використовує `normalizeResolvedModel` плюс
    `contributeResolvedModelCompat`, щоб зберігати ці compat-метадані у власності
    постачальника, а не жорстко кодувати правила xAI в ядрі.

    Той самий шаблон кореня пакета також лежить в основі інших вбудованих постачальників:

    - `@openclaw/openai-provider`: `api.ts` експортує builder-и постачальників,
      хелпери моделей за замовчуванням і builder-и realtime-постачальників
    - `@openclaw/openrouter-provider`: `api.ts` експортує builder постачальника
      плюс хелпери onboarding/config

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
      <Tab title="Користувацькі заголовки">
        Для постачальників, яким потрібні користувацькі заголовки запитів або модифікації тіла:

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
      | 1 | `catalog` | Каталог моделей або значення `base URL` за замовчуванням |
      | 2 | `applyConfigDefaults` | Глобальні значення за замовчуванням, якими володіє постачальник, під час materialization конфігурації |
      | 3 | `normalizeModelId` | Очищення застарілих/preview аліасів model-id перед пошуком |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` для сімейства постачальника перед збиранням узагальненої моделі |
      | 5 | `normalizeConfig` | Нормалізація config `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Переписування compat для нативного streaming-usage для config-постачальників |
      | 7 | `resolveConfigApiKey` | Визначення auth за env-marker, яким володіє постачальник |
      | 8 | `resolveSyntheticAuth` | Синтетичний auth для local/self-hosted або на основі config |
      | 9 | `shouldDeferSyntheticProfileAuth` | Опускання синтетичних заповнювачів stored-profile нижче auth env/config |
      | 10 | `resolveDynamicModel` | Приймати довільні upstream model id |
      | 11 | `prepareDynamicModel` | Асинхронне отримання метаданих перед визначенням |
      | 12 | `normalizeResolvedModel` | Переписування транспорту перед runner |

    Нотатки щодо рантайм-fallback:

    - `normalizeConfig` спочатку перевіряє зіставленого постачальника, а потім інші
      plugin постачальників, що підтримують хуки, доки один із них справді не змінить config.
      Якщо жоден хук постачальника не перепише підтримуваний запис config сімейства Google,
      усе одно застосовується вбудований нормалізатор config Google.
    - `resolveConfigApiKey` використовує хук постачальника, якщо його надано. Вбудований
      шлях `amazon-bedrock` також має тут вбудований resolver AWS env-marker,
      хоча сам рантайм-auth Bedrock все ще використовує стандартний
      ланцюжок AWS SDK.
      | 13 | `contributeResolvedModelCompat` | Прапорці compat для моделей вендора за іншим сумісним транспортом |
      | 14 | `capabilities` | Застарілий статичний набір можливостей; лише для сумісності |
      | 15 | `normalizeToolSchemas` | Очищення схем інструментів, яким володіє постачальник, перед реєстрацією |
      | 16 | `inspectToolSchemas` | Діагностика схем інструментів, якою володіє постачальник |
      | 17 | `resolveReasoningOutputMode` | Контракт reasoning-output: tagged чи native |
      | 18 | `prepareExtraParams` | Параметри запиту за замовчуванням |
      | 19 | `createStreamFn` | Повністю користувацький транспорт `StreamFn` |
      | 20 | `wrapStreamFn` | Користувацькі обгортки headers/body на звичайному шляху stream |
      | 21 | `resolveTransportTurnState` | Нативні headers/metadata для кожного turn |
      | 22 | `resolveWebSocketSessionPolicy` | Нативні заголовки сесії WS / cooldown |
      | 23 | `formatApiKey` | Користувацька форма рантайм-токена |
      | 24 | `refreshOAuth` | Користувацьке оновлення OAuth |
      | 25 | `buildAuthDoctorHint` | Підказка щодо виправлення auth |
      | 26 | `matchesContextOverflowError` | Визначення переповнення, яким володіє постачальник |
      | 27 | `classifyFailoverReason` | Класифікація rate-limit/overload, якою володіє постачальник |
      | 28 | `isCacheTtlEligible` | Gating TTL для кешу prompt |
      | 29 | `buildMissingAuthMessage` | Користувацька підказка про відсутній auth |
      | 30 | `suppressBuiltInModel` | Приховати застарілі upstream-рядки |
      | 31 | `augmentModelCatalog` | Синтетичні рядки для forward-compat |
      | 32 | `resolveThinkingProfile` | Набір опцій `/think`, специфічний для моделі |
      | 33 | `isBinaryThinking` | Сумісність двійкового thinking увімк./вимк. |
      | 34 | `supportsXHighThinking` | Сумісність підтримки reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Сумісність політики `/think` за замовчуванням |
      | 36 | `isModernModelRef` | Зіставлення live/smoke моделей |
      | 37 | `prepareRuntimeAuth` | Обмін токенів перед інференсом |
      | 38 | `resolveUsageAuth` | Користувацький розбір облікових даних використання |
      | 39 | `fetchUsageSnapshot` | Користувацька кінцева точка використання |
      | 40 | `createEmbeddingProvider` | Адаптер embedding, яким володіє постачальник, для пам’яті/пошуку |
      | 41 | `buildReplayPolicy` | Користувацька політика replay/Compaction транскрипту |
      | 42 | `sanitizeReplayHistory` | Переписування replay, специфічні для постачальника, після загального очищення |
      | 43 | `validateReplayTurns` | Сувора валідація replay-turn перед вбудованим runner |
      | 44 | `onModelSelected` | Зворотний виклик після вибору моделі (наприклад, телеметрія) |

      Примітка щодо налаштування prompt:

      - `resolveSystemPromptContribution` дозволяє постачальнику ін’єктувати cache-aware
        вказівки для system prompt для сімейства моделей. Віддавайте йому перевагу над
        `before_prompt_build`, коли поведінка належить одному сімейству постачальника/моделей
        і має зберігати стабільний/динамічний поділ кешу.

      Докладні описи та реальні приклади див. у
      [Внутрішня архітектура: рантайм-хуки постачальника](/uk/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Додайте додаткові можливості (необов’язково)">
    <a id="step-5-add-extra-capabilities"></a>
    Plugin постачальника може реєструвати синтез мовлення, транскрибування в реальному часі, голос у реальному
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

    OpenClaw класифікує це як plugin **гібридних можливостей**. Це
    рекомендований шаблон для корпоративних plugin (один plugin на вендора). Див.
    [Внутрішня архітектура: володіння можливостями](/uk/plugins/architecture#capability-ownership-model).

    Для генерації відео віддавайте перевагу показаній вище структурі можливостей, що враховує режим:
    `generate`, `imageToVideo` і `videoToVideo`. Плоскі агреговані поля на кшталт
    `maxInputImages`, `maxInputVideos` і `maxDurationSeconds` недостатні,
    щоб коректно оголошувати підтримку режимів трансформації або вимкнених режимів.

    Для потокових STT-постачальників віддавайте перевагу спільному хелперу WebSocket. Він забезпечує
    узгодженість proxy capture, backoff при повторному підключенні, flush під час закриття, ready-handshake,
    постановки аудіо в чергу та діагностики подій закриття між постачальниками, водночас
    залишаючи коду постачальника відповідальність лише за відображення upstream-подій.

    Пакетні STT-постачальники, які надсилають multipart audio через POST, повинні використовувати
    `buildAudioTranscriptionFormData(...)` з
    `openclaw/plugin-sdk/provider-http` разом із хелперами HTTP-запитів постачальника.
    Хелпер форми нормалізує імена файлів завантаження, включно з AAC-завантаженнями,
    яким потрібне ім’я файлу у стилі M4A для сумісних API транскрибування.

    Постачальники генерації музики повинні дотримуватися того самого шаблону:
    `generate` для генерації лише за prompt і `edit` для генерації
    на основі референсного зображення. Плоскі агреговані поля на кшталт `maxInputImages`,
    `supportsLyrics` і `supportsFormat` недостатні, щоб оголошувати підтримку
    редагування; очікуваним контрактом є явні блоки `generate` / `edit`.

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

Plugin постачальників публікуються так само, як і будь-який інший зовнішній code plugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Не використовуйте тут застарілий аліас публікації лише для Skills; пакети plugin слід публікувати через
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

`catalog.order` керує тим, коли ваш каталог зливається відносно вбудованих
постачальників:

| Порядок   | Коли          | Варіант використання                           |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | Перший прохід | Прості постачальники з API-ключем              |
| `profile` | Після simple  | Постачальники, обмежені auth-профілями         |
| `paired`  | Після profile | Синтез кількох пов’язаних записів              |
| `late`    | Останній прохід | Перевизначити наявних постачальників (перемагає при колізії) |

## Наступні кроки

- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — якщо ваш plugin також надає канал
- [SDK Runtime](/uk/plugins/sdk-runtime) — хелпери `api.runtime` (TTS, search, subagent)
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів subpath
- [Внутрішня архітектура plugin](/uk/plugins/architecture#provider-runtime-hooks) — деталі хуків і приклади вбудованих постачальників
