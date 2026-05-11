---
read_when:
    - Ви створюєте новий Plugin постачальника моделей
    - Ви хочете додати до OpenClaw проксі, сумісний з OpenAI, або власну LLM
    - Потрібно розуміти автентифікацію провайдерів, каталоги та хуки середовища виконання
sidebarTitle: Provider plugins
summary: Покроковий посібник зі створення Plugin постачальника моделей для OpenClaw
title: Створення Plugin постачальників
x-i18n:
    generated_at: "2026-05-11T20:51:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1992653c8c6b079bbb6ea2b4f4b02dbd6a5a8aef286172af8048a7d9a98a8a4
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Цей посібник показує, як створити Plugin провайдера, який додає провайдера моделей
(LLM) до OpenClaw. Наприкінці у вас буде провайдер із каталогом моделей,
автентифікацією через API-ключ і динамічним визначенням моделей.

<Info>
  Якщо ви ще не створювали жоден Plugin для OpenClaw, спершу прочитайте
  [Початок роботи](/uk/plugins/building-plugins), щоб ознайомитися з базовою
  структурою пакета та налаштуванням маніфесту.
</Info>

<Tip>
  Plugin-и провайдерів додають моделі до звичайного циклу інференсу OpenClaw.
  Якщо модель має запускатися через нативний демон агента, який володіє потоками,
  Compaction або подіями інструментів, поєднайте провайдера з
  [обв’язкою агента](/uk/plugins/sdk-agent-harness), а не додавайте деталі
  протоколу демона в ядро.
</Tip>

## Покроковий посібник

<Steps>
  <Step title="Пакет і маніфест">
    ### Крок 1: Пакет і маніфест

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
    облікові дані без завантаження runtime вашого Plugin. Додайте
    `providerAuthAliases`, коли варіант провайдера має повторно використовувати
    автентифікацію ідентифікатора іншого провайдера. `modelSupport`
    є необов’язковим і дає OpenClaw змогу автоматично завантажувати Plugin
    вашого провайдера за скороченими ідентифікаторами моделей на кшталт
    `acme-large` ще до появи runtime-хуків. Якщо ви публікуєте провайдера
    на ClawHub, ці поля `openclaw.compat` і `openclaw.build` є обов’язковими
    в `package.json`.

  </Step>

  <Step title="Зареєструйте провайдера">
    Мінімальному текстовому провайдеру потрібні `id`, `label`, `auth` і `catalog`.
    `catalog` — це runtime/config-хук, яким володіє провайдер; він може викликати
    live API постачальника та повертати записи `models.providers`.

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

        api.registerModelCatalogProvider({
          provider: "acme-ai",
          kinds: ["text"],
          liveCatalog: async (ctx) => {
            const apiKey = ctx.resolveProviderApiKey("acme-ai").apiKey;
            if (!apiKey) return null;
            return [
              {
                kind: "text",
                provider: "acme-ai",
                model: "acme-large",
                label: "Acme Large",
                source: "live",
              },
            ];
          },
        });
      },
    });
    ```

    `registerModelCatalogProvider` — це новіша поверхня каталогу рівня керування
    для інтерфейсу списків, довідки та вибору. Використовуйте її для рядків
    text, image-generation, video-generation і music-generation. Залишайте
    виклики endpoint постачальника та мапінг відповідей у Plugin; OpenClaw
    володіє спільною формою рядків, мітками джерел і рендерингом довідки.

    Це вже робочий провайдер. Тепер користувачі можуть виконати
    `openclaw onboard --acme-ai-api-key <key>` і вибрати
    `acme-ai/acme-large` як свою модель.

    Якщо upstream-провайдер використовує інші керівні токени, ніж OpenClaw,
    додайте невелике двонапрямне текстове перетворення замість заміни
    шляху стримінгу:

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

    `input` переписує фінальний системний prompt і вміст текстових повідомлень
    перед передаванням. `output` переписує текстові дельти асистента та фінальний
    текст до того, як OpenClaw розбере власні керівні маркери або доставку
    каналом.

    Для вбудованих провайдерів, які реєструють лише одного текстового провайдера
    з автентифікацією через API-ключ і одним runtime на базі каталогу, віддавайте
    перевагу вужчому допоміжному методу `defineSingleProviderPluginEntry(...)`:

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

    `buildProvider` — це шлях live-каталогу, який використовується, коли OpenClaw
    може визначити реальну автентифікацію провайдера. Він може виконувати
    специфічне для провайдера виявлення. Використовуйте `buildStaticProvider`
    лише для офлайн-рядків, які безпечно показувати до налаштування
    автентифікації; він не повинен вимагати облікових даних або виконувати
    мережеві запити. Відображення OpenClaw `models list --all` наразі виконує
    статичні каталоги лише для вбудованих Plugin-ів провайдерів, із порожньою
    конфігурацією, порожнім env і без шляхів агента/робочого простору.

    Якщо вашому потоку автентифікації також потрібно змінювати
    `models.providers.*`, псевдоніми та модель агента за замовчуванням під час
    onboarding, використовуйте preset-допоміжні методи з
    `openclaw/plugin-sdk/provider-onboard`. Найвужчі допоміжні методи:
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли нативний endpoint провайдера підтримує блоки використання у стримінгу
    на звичайному транспорті `openai-completions`, віддавайте перевагу спільним
    допоміжним методам каталогу в
    `openclaw/plugin-sdk/provider-catalog-shared` замість жорстко закодованих
    перевірок ідентифікатора провайдера. `supportsNativeStreamingUsageCompat(...)`
    і `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку з мапи
    можливостей endpoint, тож нативні endpoint-и у стилі Moonshot/DashScope усе
    ще вмикаються, навіть коли Plugin використовує власний ідентифікатор
    провайдера.

  </Step>

  <Step title="Додайте динамічне визначення моделей">
    Якщо ваш провайдер приймає довільні ідентифікатори моделей (як proxy або
    router), додайте `resolveDynamicModel`:

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

    Якщо для визначення потрібен мережевий виклик, використовуйте
    `prepareDynamicModel` для асинхронного прогрівання — `resolveDynamicModel`
    запускається знову після його завершення.

  </Step>

  <Step title="Додайте runtime-хуки (за потреби)">
    Більшості провайдерів потрібні лише `catalog` + `resolveDynamicModel`.
    Додавайте хуки поступово, коли вони потрібні вашому провайдеру.

    Спільні допоміжні builder-и тепер покривають найпоширеніші сімейства
    replay/tool-compat, тож Plugin-ам зазвичай не потрібно вручну під’єднувати
    кожен хук окремо:

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

    | Сімейство | Що підключає | Вбудовані приклади |
    | --- | --- | --- |
    | `openai-compatible` | Спільна політика повторного відтворення у стилі OpenAI для OpenAI-сумісних транспортів, зокрема очищення tool-call-id, виправлення порядку assistant-first і загальна валідація ходів Gemini там, де вона потрібна транспорту | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Політика повторного відтворення з урахуванням Claude, вибрана за `modelId`, щоб транспорти Anthropic-message отримували очищення блоків мислення, специфічне для Claude, лише коли розв’язана модель справді має ідентифікатор Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Нативна політика повторного відтворення Gemini, а також очищення початкового повторного відтворення і режим позначеного виводу reasoning | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Очищення thought-signature Gemini для моделей Gemini, що працюють через OpenAI-сумісні проксі-транспорти; не вмикає нативну валідацію повторного відтворення Gemini або переписування початкового завантаження | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Гібридна політика для провайдерів, які поєднують поверхні моделей Anthropic-message і OpenAI-сумісні поверхні моделей в одному plugin; необов’язкове скидання блоків мислення лише для Claude залишається обмеженим стороною Anthropic | `minimax` |

    Доступні сьогодні сімейства потоків:

    | Сімейство | Що підключає | Вбудовані приклади |
    | --- | --- | --- |
    | `google-thinking` | Нормалізація payload мислення Gemini на спільному шляху потоку | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Обгортка reasoning Kilo на спільному шляху проксі-потоку, де `kilo/auto` і непідтримувані ідентифікатори proxy reasoning пропускають ін’єктоване мислення | `kilocode` |
    | `moonshot-thinking` | Відображення бінарного нативного payload мислення Moonshot з конфігурації + рівня `/think` | `moonshot` |
    | `minimax-fast-mode` | Переписування моделі fast-mode MiniMax на спільному шляху потоку | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Спільні нативні обгортки OpenAI/Codex Responses: заголовки атрибуції, `/fast`/`serviceTier`, докладність тексту, нативний вебпошук Codex, формування payload сумісності reasoning і керування контекстом Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Обгортка reasoning OpenRouter для проксі-маршрутів, із централізованою обробкою пропусків для непідтримуваних моделей/`auto` | `openrouter` |
    | `tool-stream-default-on` | Обгортка `tool_stream`, увімкнена за замовчуванням, для провайдерів на кшталт Z.AI, які хочуть потокове передавання інструментів, якщо його явно не вимкнено | `zai` |

    <Accordion title="Шви SDK, що забезпечують роботу побудовників сімейств">
      Кожен побудовник сімейства складений із нижчорівневих публічних допоміжних функцій, експортованих із того самого пакета, до яких можна звернутися, коли провайдеру потрібно відійти від спільного шаблону:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)`, і сирі побудовники повторного відтворення (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Також експортує допоміжні функції повторного відтворення Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) і допоміжні функції endpoint/model (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, а також спільні обгортки OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), OpenAI-сумісна обгортка DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), очищення префілу мислення Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`) і спільні проксі/провайдерські обгортки (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")` і базові допоміжні функції схем Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`).

      Деякі допоміжні функції потоків навмисно залишаються локальними для провайдера. `@openclaw/anthropic-provider` тримає `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і нижчорівневі побудовники обгорток Anthropic у власному публічному шві `api.ts` / `contract-api.ts`, тому що вони кодують обробку Claude OAuth beta і gating `context1m`. Plugin xAI так само тримає нативне формування xAI Responses у власному `wrapStreamFn` (аліаси `/fast`, стандартний `tool_stream`, очищення непідтримуваного strict-tool, вилучення reasoning-payload, специфічне для xAI).

      Такий самий шаблон package-root також підтримує `@openclaw/openai-provider` (побудовники провайдера, допоміжні функції моделі за замовчуванням, побудовники realtime-провайдера) і `@openclaw/openrouter-provider` (побудовник провайдера плюс допоміжні функції onboarding/config).
    </Accordion>

    <Tabs>
      <Tab title="Обмін токенів">
        Для провайдерів, яким потрібен обмін токена перед кожним викликом inference:

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
      <Tab title="Нативна ідентичність транспорту">
        Для провайдерів, яким потрібні нативні заголовки запиту/сеансу або метадані на
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
        Для провайдерів, які надають дані використання/білінгу:

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
      OpenClaw викликає hooks у такому порядку. Більшість провайдерів використовують лише 2-3:
      Поля провайдера лише для сумісності, які OpenClaw більше не викликає, як-от
      `ProviderPlugin.capabilities` і `suppressBuiltInModel`, тут не перелічені.

      | # | Hook | Коли використовувати |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей або стандартні значення базового URL |
      | 2 | `applyConfigDefaults` | Глобальні стандартні значення, якими володіє провайдер, під час матеріалізації конфігурації |
      | 3 | `normalizeModelId` | Очищення застарілих/preview псевдонімів model-id перед пошуком |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` сімейства провайдера перед загальною збіркою моделі |
      | 5 | `normalizeConfig` | Нормалізація конфігурації `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Переписування сумісності нативного streaming-usage для конфігураційних провайдерів |
      | 7 | `resolveConfigApiKey` | Розв’язання auth env-marker, яким володіє провайдер |
      | 8 | `resolveSyntheticAuth` | Синтетичний auth для локальних/self-hosted або config-backed випадків |
      | 9 | `shouldDeferSyntheticProfileAuth` | Пониження synthetic stored-profile placeholders після env/config auth |
      | 10 | `resolveDynamicModel` | Приймати довільні ідентифікатори upstream моделей |
      | 11 | `prepareDynamicModel` | Асинхронне отримання метаданих перед розв’язанням |
      | 12 | `normalizeResolvedModel` | Переписування транспорту перед runner |
      | 13 | `contributeResolvedModelCompat` | Прапорці сумісності для vendor моделей за іншим сумісним транспортом |
      | 14 | `normalizeToolSchemas` | Очищення tool-schema, яким володіє провайдер, перед реєстрацією |
      | 15 | `inspectToolSchemas` | Діагностика tool-schema, якою володіє провайдер |
      | 16 | `resolveReasoningOutputMode` | Контракт tagged vs native reasoning-output |
      | 17 | `prepareExtraParams` | Стандартні параметри запиту |
      | 18 | `createStreamFn` | Повністю власний транспорт StreamFn |
      | 19 | `wrapStreamFn` | Власні обгортки заголовків/тіла на звичайному шляху потоку |
      | 20 | `resolveTransportTurnState` | Нативні заголовки/метадані для кожного ходу |
      | 21 | `resolveWebSocketSessionPolicy` | Нативні заголовки сеансу WS/cool-down |
      | 22 | `formatApiKey` | Власна форма runtime-токена |
      | 23 | `refreshOAuth` | Власне оновлення OAuth |
      | 24 | `buildAuthDoctorHint` | Підказки щодо відновлення auth |
      | 25 | `matchesContextOverflowError` | Виявлення overflow, яким володіє провайдер |
      | 26 | `classifyFailoverReason` | Класифікація rate-limit/overload, якою володіє провайдер |
      | 27 | `isCacheTtlEligible` | Gating TTL кешу prompt |
      | 28 | `buildMissingAuthMessage` | Власна підказка щодо відсутнього auth |
      | 29 | `augmentModelCatalog` | Синтетичні рядки forward-compat |
      | 30 | `resolveThinkingProfile` | Набір опцій `/think`, специфічний для моделі |
      | 31 | `isBinaryThinking` | Сумісність двійкового увімкнення/вимкнення мислення |
      | 32 | `supportsXHighThinking` | Сумісність підтримки reasoning `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Сумісність стандартної політики `/think` |
      | 34 | `isModernModelRef` | Зіставлення моделей live/smoke |
      | 35 | `prepareRuntimeAuth` | Обмін токена перед inference |
      | 36 | `resolveUsageAuth` | Власний розбір облікових даних usage |
      | 37 | `fetchUsageSnapshot` | Власний endpoint usage |
      | 38 | `createEmbeddingProvider` | Адаптер embeddings для memory/search, яким володіє провайдер |
      | 39 | `buildReplayPolicy` | Власна політика повторного відтворення/Compaction transcript |
      | 40 | `sanitizeReplayHistory` | Специфічні для провайдера переписування replay після загального очищення |
      | 41 | `validateReplayTurns` | Сувора валідація replay-turn перед вбудованим runner |
      | 42 | `onModelSelected` | Callback після вибору (наприклад, telemetry) |

      Примітки щодо runtime fallback:

      - `normalizeConfig` спершу перевіряє зіставленого провайдера, а потім інші provider plugins із підтримкою hooks, доки один із них справді не змінить конфігурацію. Якщо жоден hook провайдера не переписує підтримуваний запис конфігурації сімейства Google, вбудований нормалізатор конфігурації Google усе одно застосовується.
      - `resolveConfigApiKey` використовує hook провайдера, коли його надано. Вбудований шлях `amazon-bedrock` також має тут вбудований resolver AWS env-marker, хоча сам runtime auth Bedrock усе ще використовує стандартний ланцюг AWS SDK.
      - `resolveSystemPromptContribution` дає провайдеру змогу вставити cache-aware підказки system-prompt для сімейства моделей. Віддавайте йому перевагу над `before_prompt_build`, коли поведінка належить одному провайдеру/сімейству моделей і має зберегти стабільне/динамічне розділення кешу.

      Докладні описи та реальні приклади див. у [Внутрішня архітектура: Provider Runtime Hooks](/uk/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Додайте додаткові можливості (необов’язково)">
    ### Крок 5: Додайте додаткові можливості

    Плагін провайдера може реєструвати мовлення, транскрипцію в реальному часі, голос у реальному часі, розуміння медіа, генерацію зображень, генерацію відео, веботримання та вебпошук разом із текстовим інференсом. OpenClaw класифікує це як плагін із **гібридними можливостями** — рекомендований патерн для плагінів компаній (один плагін на постачальника). Див.
    [Внутрішнє: володіння можливостями](/uk/plugins/architecture#capability-ownership-model).

    Реєструйте кожну можливість у `register(api)` поруч із наявним викликом
    `api.registerProvider(...)`. Виберіть лише потрібні вкладки:

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
        плагіни спільно використовували обмежене читання тіла помилки, парсинг помилок JSON і
        суфікси ідентифікаторів запитів.
      </Tab>
      <Tab title="Транскрипція в реальному часі">
        Надавайте перевагу `createRealtimeTranscriptionWebSocketSession(...)` — спільний
        помічник обробляє захоплення проксі, затримку повторного підключення, скидання під час закриття, готові
        рукостискання, постановку аудіо в чергу та діагностику подій закриття. Ваш плагін
        лише зіставляє події вищого рівня.

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

        Пакетні STT-провайдери, які надсилають multipart-аудіо через POST, повинні використовувати
        `buildAudioTranscriptionFormData(...)` з
        `openclaw/plugin-sdk/provider-http`. Помічник нормалізує імена файлів для завантаження,
        зокрема завантаження AAC, яким потрібна назва файлу в стилі M4A для
        сумісних API транскрипції.
      </Tab>
      <Tab title="Голос у реальному часі">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          capabilities: {
            transports: ["gateway-relay"],
            inputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            outputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            supportsBargeIn: true,
            supportsToolCalls: true,
          },
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            // Set this only if the provider accepts multiple tool responses for
            // one call, for example an immediate "working" response followed by
            // the final result.
            supportsToolResultContinuation: false,
            connect: async () => {},
            sendAudio: () => {},
            setMediaTimestamp: () => {},
            handleBargeIn: () => {},
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```

        Оголошуйте `capabilities`, щоб `talk.catalog` міг надавати чинні режими,
        транспорти, аудіоформати та прапорці функцій клієнтам Talk у браузері та нативних застосунках.
        Реалізуйте `handleBargeIn`, коли транспорт може визначити, що
        людина перериває відтворення асистента, а провайдер підтримує
        обрізання або очищення активної аудіовідповіді.
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
        Можливості відео використовують форму, **залежну від режиму**: `generate`,
        `imageToVideo` і `videoToVideo`. Плоских агрегованих полів на кшталт
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` недостатньо,
        щоб коректно оголосити підтримку режиму трансформації або вимкнені режими.
        Генерація музики використовує такий самий патерн із явними блоками `generate` /
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
      <Tab title="Веботримання та пошук">
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

  <Step title="Тест">
    ### Крок 6: Тест

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

Плагіни провайдерів публікуються так само, як і будь-який інший зовнішній кодовий плагін:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Не використовуйте тут застарілий псевдонім публікації лише для skill; пакети плагінів мають використовувати
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

`catalog.order` контролює, коли ваш каталог об’єднується відносно вбудованих
провайдерів:

| Порядок   | Коли          | Випадок використання                           |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | Перший прохід | Звичайні провайдери API-ключів                 |
| `profile` | Після simple  | Провайдери, обмежені профілями автентифікації  |
| `paired`  | Після profile | Синтез кількох пов’язаних записів              |
| `late`    | Останній прохід | Перевизначення наявних провайдерів (перемагає в разі конфлікту) |

## Наступні кроки

- [Плагіни каналів](/uk/plugins/sdk-channel-plugins) — якщо ваш плагін також надає канал
- [SDK Runtime](/uk/plugins/sdk-runtime) — помічники `api.runtime` (TTS, пошук, субагент)
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпорту підшляхів
- [Внутрішнє Plugin](/uk/plugins/architecture-internals#provider-runtime-hooks) — подробиці хуків і вбудовані приклади

## Пов’язане

- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення плагінів](/uk/plugins/building-plugins)
- [Створення плагінів каналів](/uk/plugins/sdk-channel-plugins)
