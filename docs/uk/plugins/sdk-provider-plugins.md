---
read_when:
    - Ви створюєте новий Plugin постачальника моделей
    - Ви хочете додати до OpenClaw проксі, сумісний з OpenAI, або власну LLM
    - Вам потрібно розуміти автентифікацію провайдерів, каталоги та хуки середовища виконання
sidebarTitle: Provider plugins
summary: Покроковий посібник зі створення Plugin провайдера моделей для OpenClaw
title: Створення Plugin для постачальників
x-i18n:
    generated_at: "2026-06-27T18:04:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05ac4d08eae00e7e0fcf03edea691dc9ced7309421dd19a31edf69cee1e01f0b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Цей посібник показує, як створити Plugin провайдера, що додає провайдера моделей
(LLM) до OpenClaw. Наприкінці ви матимете провайдера з каталогом моделей,
автентифікацією через API-ключ і динамічним визначенням моделей.

<Info>
  Якщо ви ще не створювали жодного Plugin OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins), щоб дізнатися базову структуру
  пакета й налаштування маніфесту.
</Info>

<Tip>
  Plugins провайдера додають моделі до звичайного циклу інференсу OpenClaw. Якщо модель
  має працювати через нативний демон агента, який керує потоками, Compaction або подіями
  інструментів, поєднайте провайдера з [обгорткою агента](/uk/plugins/sdk-agent-harness)
  замість того, щоб розміщувати деталі протоколу демона в ядрі.
</Tip>

## Покроковий огляд

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
      "setup": {
        "providers": [
          {
            "id": "acme-ai",
            "envVars": ["ACME_AI_API_KEY"]
          }
        ]
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

    Маніфест оголошує `setup.providers[].envVars`, щоб OpenClaw міг виявляти
    облікові дані без завантаження середовища виконання вашого Plugin. Додайте `providerAuthAliases`,
    коли варіант провайдера має повторно використовувати автентифікацію іншого ідентифікатора провайдера. `modelSupport`
    необов’язковий і дає OpenClaw змогу автоматично завантажувати ваш Plugin провайдера зі скорочених
    ідентифікаторів моделей на кшталт `acme-large` до появи хуків середовища виконання. Якщо ви публікуєте
    провайдера в ClawHub, ці поля `openclaw.compat` і `openclaw.build`
    обов’язкові в `package.json`.

  </Step>

  <Step title="Зареєструйте провайдера">
    Мінімальному текстовому провайдеру потрібні `id`, `label`, `auth` і `catalog`.
    `catalog` — це хук середовища виконання/конфігурації, яким володіє провайдер; він може викликати живі
    API постачальника й повертає записи `models.providers`.

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

    `registerModelCatalogProvider` — це новіша поверхня каталогу площини керування
    для списку/довідки/інтерфейсу вибору. Використовуйте її для рядків тексту, генерації зображень,
    генерації відео й генерації музики. Тримайте виклики кінцевих точок постачальника та
    зіставлення відповідей у Plugin; OpenClaw володіє спільною формою рядків, мітками
    джерел і рендерингом довідки.

    Це вже робочий провайдер. Тепер користувачі можуть виконати
    `openclaw onboard --acme-ai-api-key <key>` і вибрати
    `acme-ai/acme-large` як свою модель.

    ### Виявлення живих моделей

    Якщо ваш провайдер надає API у стилі `/models`, тримайте специфічну для провайдера
    кінцеву точку та проєкцію рядків у вашому Plugin і використовуйте
    `openclaw/plugin-sdk/provider-catalog-live-runtime` для спільного життєвого циклу
    отримання даних. Помічник дає захищені HTTP-запити, заголовки автентифікації провайдера,
    структуровані HTTP-помилки, кешування TTL і статичну резервну поведінку без
    розміщення політик провайдера в ядрі OpenClaw.

    Використовуйте `buildLiveModelProviderConfig`, коли живий API лише повідомляє, які
    статичні рядки каталогу, якими володіє провайдер, наразі доступні:

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      buildLiveModelProviderConfig,
      type LiveModelCatalogFetchGuard,
    } from "openclaw/plugin-sdk/provider-catalog-live-runtime";

    const STATIC_MODELS = [
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
    ] as const;

    async function buildAcmeLiveProvider(params: {
      apiKey: string;
      discoveryApiKey?: string;
      fetchGuard?: LiveModelCatalogFetchGuard;
    }) {
      return await buildLiveModelProviderConfig({
        providerId: "acme-ai",
        endpoint: "https://api.acme-ai.com/v1/models",
        providerConfig: {
          baseUrl: "https://api.acme-ai.com/v1",
          api: "openai-completions",
        },
        models: STATIC_MODELS,
        apiKey: params.apiKey,
        discoveryApiKey: params.discoveryApiKey,
        fetchGuard: params.fetchGuard,
        ttlMs: 60_000,
        auditContext: "acme-ai-model-discovery",
      });
    }

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          catalog: {
            order: "simple",
            run: async (ctx) => {
              const auth = ctx.resolveProviderAuth("acme-ai");
              const apiKey =
                auth.apiKey ?? ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: await buildAcmeLiveProvider({
                  apiKey,
                  discoveryApiKey: auth.discoveryApiKey,
                }),
              };
            },
          },
          staticCatalog: {
            order: "simple",
            run: async () => ({
              provider: {
                baseUrl: "https://api.acme-ai.com/v1",
                api: "openai-completions",
                models: [...STATIC_MODELS],
              },
            }),
          },
        });
      },
    });
    ```

    Використовуйте `getCachedLiveProviderModelRows`, коли API провайдера повертає багатші
    метадані, а Plugin має самостійно проєктувати рядки у визначення моделей
    OpenClaw:

    ```typescript index.ts
    import {
      getCachedLiveProviderModelRows,
      LiveModelCatalogHttpError,
    } from "openclaw/plugin-sdk/provider-catalog-live-runtime";

    async function discoverAcmeModels(apiKey: string) {
      try {
        const rows = await getCachedLiveProviderModelRows({
          providerId: "acme-ai",
          endpoint: "https://api.acme-ai.com/v1/models",
          apiKey,
          ttlMs: 60_000,
          auditContext: "acme-ai-model-discovery",
        });
        return rows
          .map((row) => projectAcmeModel(row))
          .filter((model) => model !== null);
      } catch (error) {
        if (error instanceof LiveModelCatalogHttpError) {
          return STATIC_MODELS;
        }
        throw error;
      }
    }
    ```

    `run` має залишатися захищеним автентифікацією і повертати `null`, коли немає придатних
    облікових даних. Залиште офлайн-`staticRun` або статичний резервний варіант, щоб налаштування, документація,
    тести й поверхні вибору не залежали від доступу до живої мережі. Використовуйте TTL,
    доречний для актуальності списку моделей, уникайте опитування файлової системи під час запиту
    й передавайте специфічні для провайдера `readRows` / `readModelId` лише тоді, коли
    відповідь upstream не має OpenAI-сумісної форми `{ data: [{ id, object }] }`.

    Якщо upstream-провайдер використовує інші керівні токени, ніж OpenClaw, додайте
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

    `input` переписує фінальний системний промпт і текстовий вміст повідомлення перед
    транспортуванням. `output` переписує текстові дельти асистента й фінальний текст перед тим,
    як OpenClaw розбере власні керівні маркери або доставку каналом.

    Для вбудованих провайдерів, які реєструють лише одного текстового провайдера з автентифікацією
    через API-ключ плюс одне середовище виконання на основі каталогу, віддавайте перевагу вужчому
    помічнику `defineSingleProviderPluginEntry(...)`:

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

    `buildProvider` - це шлях живого каталогу, який використовується, коли OpenClaw може визначити справжню
    автентифікацію постачальника. Він може виконувати специфічне для постачальника виявлення. Використовуйте
    `buildStaticProvider` лише для офлайн-рядків, які безпечно показувати до налаштування автентифікації;
    він не повинен вимагати облікових даних або виконувати мережеві запити.
    Відображення `models list --all` в OpenClaw наразі виконує статичні каталоги
    лише для вбудованих плагінів постачальників, із порожньою конфігурацією, порожнім env і без
    шляхів агента/робочого простору.

    Якщо ваш потік автентифікації також має виправляти `models.providers.*`, псевдоніми та
    модель агента за замовчуванням під час онбордингу, використовуйте preset-помічники з
    `openclaw/plugin-sdk/provider-onboard`. Найвужчі помічники:
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли нативний endpoint постачальника підтримує потокові блоки використання у
    звичайному транспорті `openai-completions`, віддавайте перевагу спільним помічникам каталогу в
    `openclaw/plugin-sdk/provider-catalog-shared` замість жорстко закодованих
    перевірок provider-id. `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку з
    мапи можливостей endpoint, тож нативні endpoint у стилі Moonshot/DashScope все одно
    вмикаються, навіть коли плагін використовує власний provider id.

    Наведені вище приклади живого виявлення охоплюють provider API у стилі `/models`. Тримайте
    це виявлення всередині `catalog.run`, обмеженим придатною автентифікацією, і залишайте
    `staticRun` без мережевих запитів для офлайн-генерації каталогу.

  </Step>

  <Step title="Додайте динамічне визначення моделей">
    Якщо ваш постачальник приймає довільні model ID (як проксі або router),
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

    Якщо визначення потребує мережевого виклику, використовуйте `prepareDynamicModel` для асинхронного
    прогріву - `resolveDynamicModel` запускається знову після його завершення.

  </Step>

  <Step title="Додайте runtime hooks (за потреби)">
    Більшості постачальників потрібні лише `catalog` + `resolveDynamicModel`. Додавайте hooks
    поступово, коли ваш постачальник їх потребуватиме.

    Спільні builder-помічники тепер охоплюють найпоширеніші сімейства replay/tool-compat,
    тому плагінам зазвичай не потрібно під’єднувати кожен hook вручну по одному:

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

    Доступні сьогодні replay-сімейства:

    | Сімейство | Що воно під’єднує | Вбудовані приклади |
    | --- | --- | --- |
    | `openai-compatible` | Спільна replay-політика у стилі OpenAI для OpenAI-compatible транспортів, включно з очищенням tool-call-id, виправленнями порядку assistant-first і загальною валідацією Gemini-turn там, де це потрібно транспорту | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Replay-політика з урахуванням Claude, вибрана за `modelId`, тому транспорти Anthropic-message отримують специфічне для Claude очищення thinking-block лише тоді, коли визначена модель справді має Claude id | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Нативна replay-політика Gemini плюс bootstrap-очищення replay. Спільне сімейство залишає text-output Gemini CLI на tagged reasoning; прямий постачальник `google` перевизначає `resolveReasoningOutputMode` на `native`, оскільки thinking Gemini API надходить як нативні thought parts. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Очищення thought-signature Gemini для моделей Gemini, що працюють через OpenAI-compatible проксі-транспорти; не вмикає нативну replay-валідацію Gemini або bootstrap-переписування | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Гібридна політика для постачальників, які поєднують поверхні моделей Anthropic-message та OpenAI-compatible в одному плагіні; необов’язкове видалення thinking-block лише для Claude залишається обмеженим стороною Anthropic | `minimax` |

    Доступні сьогодні stream-сімейства:

    | Сімейство | Що воно під’єднує | Вбудовані приклади |
    | --- | --- | --- |
    | `google-thinking` | Нормалізація thinking payload Gemini на спільному stream-шляху | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Обгортка reasoning Kilo на спільному proxy stream-шляху, де `kilo/auto` і непідтримувані proxy reasoning id пропускають injected thinking | `kilocode` |
    | `moonshot-thinking` | Мапінг бінарного native-thinking payload Moonshot з конфігурації + рівня `/think` | `moonshot` |
    | `minimax-fast-mode` | Переписування моделі MiniMax fast-mode на спільному stream-шляху | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Спільні нативні обгортки OpenAI/Codex Responses: attribution headers, `/fast`/`serviceTier`, text verbosity, нативний вебпошук Codex, формування reasoning-compat payload і керування контекстом Responses | `openai` |
    | `openrouter-thinking` | Обгортка reasoning OpenRouter для proxy routes, з централізованою обробкою пропусків unsupported-model/`auto` | `openrouter` |
    | `tool-stream-default-on` | Обгортка `tool_stream`, увімкнена за замовчуванням, для постачальників на кшталт Z.AI, яким потрібен tool streaming, якщо його явно не вимкнено | `zai` |

    <Accordion title="SDK-шви, що живлять family builders">
      Кожен family builder складено з низькорівневих публічних помічників, експортованих із того самого пакета; до них можна звернутися, коли постачальнику потрібно відійти від спільного шаблону:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` і сирі replay builders (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Також експортує replay-помічники Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) і помічники endpoint/model (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, а також спільні обгортки OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), OpenAI-compatible обгортка DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), очищення Anthropic Messages thinking prefill (`createAnthropicThinkingPrefillPayloadWrapper`), plain-text tool-call compat (`createPlainTextToolCallCompatWrapper`) і спільні proxy/provider обгортки (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` - легкі payload- та event-обгортки для гарячих provider paths, включно з `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` і `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` і базові помічники provider schema.

      Для постачальників сімейства Gemini тримайте режим reasoning-output узгодженим із
      транспортом. Прямі постачальники Google Gemini API мають використовувати `native`
      reasoning output, щоб OpenClaw споживав нативні thought parts без додавання
      prompt-директив `<think>` / `<final>`. Text-only бекенди в стилі Gemini CLI,
      які парсять фінальну JSON/text-відповідь, можуть зберігати спільний
      tagged-контракт `google-gemini`.

      Деякі stream-помічники навмисно залишаються локальними для постачальника. `@openclaw/anthropic-provider` тримає `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і нижчорівневі Anthropic wrapper builders у власному публічному шві `api.ts` / `contract-api.ts`, бо вони кодують обробку Claude OAuth beta та gating `context1m`. Плагін xAI аналогічно тримає нативне формування xAI Responses у власному `wrapStreamFn` (псевдоніми `/fast`, стандартний `tool_stream`, очищення unsupported strict-tool, специфічне для xAI вилучення reasoning-payload).

      Та сама package-root схема також підтримує `@openclaw/openai-provider` (provider builders, помічники default-model, realtime provider builders) і `@openclaw/openrouter-provider` (provider builder плюс onboarding/config helpers).
    </Accordion>

    <Tabs>
      <Tab title="Обмін токена">
        Для постачальників, яким потрібен обмін токена перед кожним inference-викликом:

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
        Для постачальників, яким потрібні власні заголовки запиту або модифікації тіла:

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
      <Tab title="Нативна транспортна ідентичність">
        Для постачальників, яким потрібні нативні заголовки запиту/сесії або метадані на
        generic HTTP чи WebSocket транспортах:

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

        `resolveUsageAuth` має три результати. Поверніть `{ token, accountId? }`,
        коли провайдер має облікові дані для використання/білінгу. Поверніть
        `{ handled: true }` лише тоді, коли провайдер остаточно обробив auth для
        використання, але не має придатного токена використання, і OpenClaw має
        пропустити універсальний резервний механізм API-key/OAuth. Поверніть
        `null` або `undefined`, коли провайдер не обробив запит і OpenClaw має
        продовжити з універсальним резервним механізмом.
      </Tab>
    </Tabs>

    <Accordion title="Усі доступні хуки провайдера">
      OpenClaw викликає хуки в такому порядку. Більшість провайдерів використовують лише 2-3:
      Поля провайдера лише для сумісності, які OpenClaw більше не викликає, як-от
      `ProviderPlugin.capabilities` і `suppressBuiltInModel`, тут не наведені.

      | # | Хук | Коли використовувати |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей або типові значення базового URL |
      | 2 | `applyConfigDefaults` | Глобальні типові значення, що належать провайдеру, під час матеріалізації конфігурації |
      | 3 | `normalizeModelId` | Очищення застарілих/preview псевдонімів model-id перед пошуком |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` сімейства провайдера перед універсальним складанням моделі |
      | 5 | `normalizeConfig` | Нормалізація конфігурації `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Перезаписи сумісності native streaming-usage для провайдерів конфігурації |
      | 7 | `resolveConfigApiKey` | Розв’язання auth env-маркерів, що належить провайдеру |
      | 8 | `resolveSyntheticAuth` | Локальний/self-hosted або підкріплений конфігурацією synthetic auth |
      | 9 | `shouldDeferSyntheticProfileAuth` | Зниження пріоритету synthetic placeholders збереженого профілю після env/config auth |
      | 10 | `resolveDynamicModel` | Прийняття довільних upstream ID моделей |
      | 11 | `prepareDynamicModel` | Асинхронне отримання метаданих перед розв’язанням |
      | 12 | `normalizeResolvedModel` | Перезаписи транспорту перед runner |
      | 13 | `normalizeToolSchemas` | Очищення tool-schema, що належить провайдеру, перед реєстрацією |
      | 14 | `inspectToolSchemas` | Діагностика tool-schema, що належить провайдеру |
      | 15 | `resolveReasoningOutputMode` | Контракт reasoning-output з тегами або native |
      | 16 | `prepareExtraParams` | Типові параметри запиту |
      | 17 | `createStreamFn` | Повністю кастомний транспорт StreamFn |
      | 19 | `wrapStreamFn` | Кастомні обгортки headers/body на звичайному stream-шляху |
      | 20 | `resolveTransportTurnState` | Native headers/metadata для кожного turn |
      | 21 | `resolveWebSocketSessionPolicy` | Native WS session headers/cool-down |
      | 22 | `formatApiKey` | Кастомна форма runtime token |
      | 23 | `refreshOAuth` | Кастомне оновлення OAuth |
      | 24 | `buildAuthDoctorHint` | Поради з виправлення auth |
      | 25 | `matchesContextOverflowError` | Виявлення overflow, що належить провайдеру |
      | 26 | `classifyFailoverReason` | Класифікація rate-limit/overload, що належить провайдеру |
      | 27 | `isCacheTtlEligible` | Обмеження TTL кешу prompt |
      | 28 | `buildMissingAuthMessage` | Кастомна підказка щодо відсутнього auth |
      | 29 | `augmentModelCatalog` | Synthetic forward-compat рядки |
      | 30 | `resolveThinkingProfile` | Набір опцій `/think` для конкретної моделі |
      | 31 | `isBinaryThinking` | Сумісність увімкнення/вимкнення binary thinking |
      | 32 | `supportsXHighThinking` | Сумісність підтримки reasoning `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Сумісність типової політики `/think` |
      | 34 | `isModernModelRef` | Зіставлення live/smoke моделей |
      | 35 | `prepareRuntimeAuth` | Обмін токена перед inference |
      | 36 | `resolveUsageAuth` | Кастомний розбір облікових даних використання |
      | 37 | `fetchUsageSnapshot` | Кастомний endpoint використання |
      | 38 | `createEmbeddingProvider` | Адаптер embedding, що належить провайдеру, для memory/search |
      | 39 | `buildReplayPolicy` | Кастомна політика replay/compaction транскрипту |
      | 40 | `sanitizeReplayHistory` | Перезаписи replay, специфічні для провайдера, після універсального очищення |
      | 41 | `validateReplayTurns` | Сувора валідація replay-turn перед embedded runner |
      | 42 | `onModelSelected` | Callback після вибору (наприклад, telemetry) |

      Примітки щодо runtime fallback:

      - `normalizeConfig` спочатку перевіряє зіставленого провайдера, а потім інші provider plugins із підтримкою hooks, доки один із них фактично не змінить конфігурацію. Якщо жоден хук провайдера не переписує підтримуваний запис конфігурації сімейства Google, все одно застосовується вбудований нормалізатор конфігурації Google.
      - `resolveConfigApiKey` використовує хук провайдера, коли він наданий. Amazon Bedrock тримає розв’язання AWS env-маркерів у своєму provider plugin; сам runtime auth і далі використовує стандартний ланцюжок AWS SDK, коли налаштований з `auth: "aws-sdk"`.
      - `resolveThinkingProfile(ctx)` отримує вибрані `provider`, `modelId`, необов’язкову об’єднану підказку каталогу `reasoning` і необов’язкові об’єднані факти `compat` моделі. Використовуйте `compat` лише для вибору thinking UI/profile провайдера.
      - `resolveSystemPromptContribution` дає провайдеру змогу впроваджувати cache-aware guidance для system-prompt для сімейства моделей. Надавайте йому перевагу над `before_prompt_build`, коли поведінка належить одному провайдеру/сімейству моделей і має зберігати стабільний/динамічний поділ кешу.

      Докладні описи та реальні приклади див. у [Внутрішні механізми: Provider Runtime Hooks](/uk/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Додайте додаткові можливості (необов’язково)">
    ### Крок 5: Додайте додаткові можливості

    Provider plugin може реєструвати embeddings, speech, realtime transcription,
    realtime voice, media understanding, image generation, video generation,
    web fetch і web search поряд із text inference. OpenClaw класифікує це як
    **hybrid-capability** plugin - рекомендований шаблон для plugin компаній
    (один plugin на вендора). Див.
    [Внутрішні механізми: володіння можливостями](/uk/plugins/architecture#capability-ownership-model).

    Реєструйте кожну можливість усередині `register(api)` поряд з вашим наявним
    викликом `api.registerProvider(...)`. Вибирайте лише потрібні вкладки:

    <Tabs>
      <Tab title="Speech (TTS)">
        ```typescript
        import {
          assertOkOrThrowProviderError,
          postJsonRequest,
        } from "openclaw/plugin-sdk/provider-http";

        api.registerSpeechProvider({
          id: "acme-ai",
          label: "Acme Speech",
          defaultTimeoutMs: 120_000,
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
        plugins спільно використовували обмежене читання тіла помилки, розбір JSON-помилок і
        суфікси request-id.
      </Tab>
      <Tab title="Realtime transcription">
        Надавайте перевагу `createRealtimeTranscriptionWebSocketSession(...)` - спільний
        helper обробляє proxy capture, reconnect backoff, close flushing, ready
        handshakes, audio queueing і діагностику close-event. Ваш plugin
        лише зіставляє upstream події.

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

        Batch STT провайдери, які POST multipart audio, мають використовувати
        `buildAudioTranscriptionFormData(...)` з
        `openclaw/plugin-sdk/provider-http`. Helper нормалізує імена файлів
        upload, зокрема AAC uploads, яким потрібне ім’я файлу в стилі M4A для
        сумісних transcription API.
      </Tab>
      <Tab title="Realtime voice">
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

        Оголосіть `capabilities`, щоб `talk.catalog` міг надавати дійсні режими,
        транспорти, аудіоформати та прапорці функцій браузерним і нативним клієнтам Talk.
        Реалізуйте `handleBargeIn`, коли транспорт може виявити, що людина
        перериває відтворення асистента, а провайдер підтримує обрізання або
        очищення активної аудіовідповіді.
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

        Локальні або самостійно розміщені медіапровайдери, які навмисно не
        вимагають облікових даних, можуть надавати `resolveAuth` і повертати
        `kind: "none"`. OpenClaw усе одно зберігає звичайний шлюз автентифікації
        для провайдерів, які явно не погодилися на це. Наявні провайдери можуть
        і далі читати `req.apiKey`; новим провайдерам варто надавати перевагу
        `req.auth`.

        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "local-audio",
          capabilities: ["audio"],
          resolveAuth: () => ({
            kind: "none",
            source: "local-audio plugin no-auth",
          }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Embeddings">
        ```typescript
        api.registerEmbeddingProvider({
          id: "acme-ai",
          defaultModel: "acme-embed",
          transport: "remote",
          authProviderId: "acme-ai",
          create: async ({ model }) => ({
            provider: {
              id: "acme-ai",
              model,
              dimensions: 1536,
              embed: async (input) => {
                const text = typeof input === "string" ? input : input.text;
                return fetchAcmeEmbedding(text);
              },
              embedBatch: async (inputs) =>
                Promise.all(
                  inputs.map((input) =>
                    fetchAcmeEmbedding(typeof input === "string" ? input : input.text),
                  ),
                ),
            },
          }),
        });
        ```

        Оголосіть той самий id у `contracts.embeddingProviders`. Це загальний
        контракт embeddings для багаторазового генерування векторів, зокрема
        пошуку в пам’яті. `registerMemoryEmbeddingProvider(...)` є застарілою
        сумісністю для наявних адаптерів, специфічних для пам’яті.
      </Tab>
      <Tab title="Генерування зображень і відео">
        Можливості відео використовують форму, **що враховує режим**:
        `generate`, `imageToVideo` і `videoToVideo`. Плоских агрегованих полів,
        як-от `maxInputImages` / `maxInputVideos` / `maxDurationSeconds`,
        недостатньо, щоб коректно оголосити підтримку режимів трансформації або
        вимкнені режими. Генерування музики дотримується того самого шаблону з
        явними блоками `generate` / `edit`.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* image result */ }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          defaultTimeoutMs: 600_000,
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

  <Step title="Тестування">
    ### Крок 6: Тестування

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

Не використовуйте тут застарілий псевдонім публікації лише для Skills; пакети плагінів мають використовувати
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

| Порядок   | Коли          | Сценарій використання                           |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Перший прохід | Звичайні провайдери API-ключів                  |
| `profile` | Після simple  | Провайдери, обмежені профілями автентифікації   |
| `paired`  | Після profile | Синтез кількох пов’язаних записів               |
| `late`    | Останній прохід | Перевизначення наявних провайдерів (перемагає в разі колізії) |

## Наступні кроки

- [Плагіни каналів](/uk/plugins/sdk-channel-plugins) - якщо ваш плагін також надає канал
- [SDK Runtime](/uk/plugins/sdk-runtime) - допоміжні засоби `api.runtime` (TTS, пошук, субагент)
- [Огляд SDK](/uk/plugins/sdk-overview) - повний довідник імпорту підшляхів
- [Внутрішня архітектура плагінів](/uk/plugins/architecture-internals#provider-runtime-hooks) - подробиці хуків і вбудовані приклади

## Пов’язане

- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення плагінів](/uk/plugins/building-plugins)
- [Створення плагінів каналів](/uk/plugins/sdk-channel-plugins)
