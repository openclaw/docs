---
read_when:
    - Ви створюєте новий плагін постачальника моделі
    - Ви хочете додати до OpenClaw проксі, сумісний з OpenAI, або власну LLM
    - Вам потрібно розуміти автентифікацію провайдерів, каталоги та хуки середовища виконання
sidebarTitle: Provider plugins
summary: Покроковий посібник зі створення плагіна постачальника моделей для OpenClaw
title: Створення плагінів постачальників
x-i18n:
    generated_at: "2026-07-12T13:33:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ebbe59b4487a93c6fec3624251eff7394197e249bb8fc7899f1fc88162510d1c
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Створіть Plugin провайдера, щоб додати провайдера моделей (LLM) до OpenClaw: каталог моделей, автентифікацію за ключем API та динамічне визначення моделей.

<Info>
  Уперше працюєте з плагінами OpenClaw? Спочатку прочитайте [Початок роботи](/uk/plugins/building-plugins),
  щоб дізнатися про структуру пакета та налаштування маніфесту.
</Info>

<Tip>
  Плагіни провайдерів додають моделі до звичайного циклу інференсу OpenClaw. Якщо
  модель має працювати через нативний демон агента, який керує потоками, Compaction
  або подіями інструментів, поєднайте провайдер із [каркасом
  агента](/uk/plugins/sdk-agent-harness), замість того щоб додавати подробиці протоколу
  демона до ядра.
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

    `setup.providers[].envVars` дає змогу OpenClaw виявляти облікові дані без
    завантаження середовища виконання вашого Plugin. Додайте `providerAuthAliases`, коли варіант
    провайдера має повторно використовувати автентифікацію іншого ідентифікатора провайдера. `modelSupport`
    є необов'язковим і дає змогу OpenClaw автоматично завантажувати Plugin вашого провайдера за скороченими
    ідентифікаторами моделей, як-от `acme-large`, до появи обробників середовища виконання. `openclaw.compat`
    і `openclaw.build` у `package.json` обов'язкові для публікації в ClawHub
    (`openclaw.compat.pluginApi` і `openclaw.build.openclawVersion` —
    два обов'язкові поля; якщо `minGatewayVersion` не вказано, використовується
    `openclaw.install.minHostVersion`).

  </Step>

  <Step title="Зареєструйте провайдера">
    Мінімальному текстовому провайдеру потрібні `id`, `label`, `auth` і `catalog`.
    `catalog` — це обробник середовища виконання та конфігурації, яким володіє провайдер; він може викликати активні
    API постачальника та повертає записи `models.providers`.

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
    для інтерфейсів списку, довідки та вибору, яка охоплює рядки `text`, `voice`, `image_generation`,
    `video_generation` і `music_generation`. Зберігайте виклики кінцевих точок
    постачальника та перетворення відповідей у Plugin; OpenClaw керує спільною формою
    рядків, позначками джерел і відображенням довідки.

    Це вже робочий провайдер. Тепер користувачі можуть виконати
    `openclaw onboard --acme-ai-api-key <key>` і вибрати
    `acme-ai/acme-large` як свою модель.

    ### Динамічне виявлення моделей

    Якщо ваш провайдер надає API на кшталт `/models`, зберігайте специфічну для провайдера
    кінцеву точку та перетворення рядків у своєму Plugin і використовуйте
    `openclaw/plugin-sdk/provider-catalog-live-runtime` для спільного життєвого циклу
    отримання даних. Допоміжний засіб надає захищені HTTP-запити, заголовки автентифікації провайдера,
    структуровані помилки HTTP, кешування за TTL і статичну резервну поведінку без
    перенесення політики провайдера до ядра OpenClaw.

    Використовуйте `buildLiveModelProviderConfig`, коли активний API повідомляє лише про те, які
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
    метадані й Plugin має самостійно перетворювати рядки на визначення моделей
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

    `run` має залишатися захищеним автентифікацією та повертати `null`, коли немає придатних облікових даних.
    Зберігайте автономний `staticRun` або статичний резервний варіант, щоб налаштування, документація,
    тести та інтерфейси вибору не залежали від доступу до мережі. Використовуйте TTL,
    що відповідає вимогам до актуальності списку моделей, уникайте опитування файлової системи під час запиту
    та передавайте специфічні для провайдера `readRows` / `readModelId`, лише коли
    відповідь зовнішнього сервісу не має сумісної з OpenAI форми `{ data: [{ id, object }] }`.

    Якщо зовнішній провайдер використовує інші керівні токени, ніж OpenClaw, додайте невелике
    двонапрямне перетворення тексту замість заміни шляху потокового передавання:

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

    `input` перезаписує остаточний системний запит і текстовий вміст повідомлення перед
    передаванням. `output` перезаписує текстові дельти асистента та остаточний текст до того, як
    OpenClaw розбере власні керівні маркери або передасть дані каналу.

    Для вбудованих провайдерів, які реєструють лише одного текстового провайдера з автентифікацією
    за ключем API та єдиним середовищем виконання на основі каталогу, віддавайте перевагу вужчому
    допоміжному засобу `defineSingleProviderPluginEntry(...)`:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Постачальник моделей Acme AI",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Ключ API Acme AI",
            hint: "Ключ API з вашої панелі керування Acme AI",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Введіть свій ключ API Acme AI",
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

    `buildProvider` — це шлях динамічного каталогу, який використовується, коли OpenClaw може визначити справжні
    дані автентифікації постачальника. Він може виконувати виявлення, специфічне для постачальника. Використовуйте
    `buildStaticProvider` лише для офлайн-рядків, які можна безпечно показувати до налаштування
    автентифікації; він не повинен вимагати облікових даних або виконувати мережеві запити.
    Наразі відображення `models list --all` в OpenClaw виконує статичні каталоги
    лише для вбудованих плагінів постачальників із порожньою конфігурацією, порожнім середовищем і без
    шляхів агента чи робочого простору.

    Якщо ваш процес автентифікації також має змінювати `models.providers.*`, псевдоніми та
    стандартну модель агента під час початкового налаштування, використовуйте допоміжні функції попередніх налаштувань із
    `openclaw/plugin-sdk/provider-onboard`. Найвужчими допоміжними функціями є
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли власна кінцева точка постачальника підтримує потокові блоки використання у
    звичайному транспорті `openai-completions`, віддавайте перевагу спільним допоміжним функціям каталогу з
    `openclaw/plugin-sdk/provider-catalog-shared`, а не жорстко закодованим
    перевіркам ідентифікатора постачальника. `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку за
    картою можливостей кінцевої точки, тому власні кінцеві точки в стилі Moonshot/DashScope однаково
    вмикають цю можливість, навіть коли плагін використовує власний ідентифікатор постачальника.

    Наведені вище приклади динамічного виявлення охоплюють API постачальників у стилі `/models`. Зберігайте
    це виявлення всередині `catalog.run`, виконуючи його лише за наявності придатних даних автентифікації, а
    `staticRun` залишайте без мережевих запитів для офлайн-генерування каталогу.

  </Step>

  <Step title="Додайте динамічне визначення моделі">
    Якщо ваш постачальник приймає довільні ідентифікатори моделей (як проксі-сервер або маршрутизатор),
    додайте `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... ідентифікатор, мітка, автентифікація та каталог, наведені вище

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
    попереднього прогрівання — `resolveDynamicModel` запускається знову після його завершення.

  </Step>

  <Step title="Додайте обробники середовища виконання (за потреби)">
    Більшості постачальників потрібні лише `catalog` + `resolveDynamicModel`. Додавайте обробники
    поступово, коли вони стають потрібними вашому постачальнику.

    Спільні конструктори допоміжних функцій тепер охоплюють найпоширеніші сімейства
    сумісності повторного відтворення та інструментів, тому плагінам зазвичай не потрібно вручну підключати кожен обробник окремо:

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

    Доступні сьогодні сімейства повторного відтворення:

    | Сімейство | Що воно підключає | Вбудовані приклади |
    | --- | --- | --- |
    | `openai-compatible` | Спільна політика повторного відтворення в стилі OpenAI для сумісних з OpenAI транспортів, включно з очищенням ідентифікаторів викликів інструментів, виправленнями порядку, за якого асистент має бути першим, і загальною перевіркою ходів Gemini там, де цього потребує транспорт | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Політика повторного відтворення з урахуванням Claude, вибрана за `modelId`, завдяки чому транспорти повідомлень Anthropic отримують специфічне для Claude очищення блоків міркування лише тоді, коли визначена модель справді має ідентифікатор Claude | `amazon-bedrock` |
    | `native-anthropic-by-model` | Та сама політика Claude за моделлю, що й `anthropic-by-model`, а також очищення ідентифікаторів викликів інструментів і збереження власних ідентифікаторів використання інструментів Anthropic для транспортів, які мають зберігати власні ідентифікатори постачальника | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | Власна політика повторного відтворення Gemini та початкове очищення повторного відтворення. Спільне сімейство залишає текстовий вивід Gemini CLI у форматі міркувань із тегами; безпосередній постачальник `google` перевизначає `resolveReasoningOutputMode` на `native`, оскільки міркування Gemini API надходять як власні частини думок. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Очищення підписів думок Gemini для моделей Gemini, що працюють через сумісні з OpenAI проксі-транспорти; не вмикає власну перевірку повторного відтворення Gemini або початкове переписування | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Гібридна політика для постачальників, які поєднують поверхні моделей повідомлень Anthropic і сумісних з OpenAI моделей в одному плагіні; необов'язкове відкидання блоків міркування лише для Claude залишається обмеженим стороною Anthropic | `minimax` |

    Доступні сьогодні сімейства потоків:

    | Сімейство | Що воно підключає | Вбудовані приклади |
    | --- | --- | --- |
    | `google-thinking` | Нормалізація корисного навантаження міркувань Gemini у спільному потоковому шляху | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Обгортка міркувань Kilo у спільному потоковому шляху проксі-сервера, де `kilo/auto` і непідтримувані проксі-ідентифікатори міркувань пропускають додане міркування | `kilocode` |
    | `moonshot-thinking` | Відображення двійкового корисного навантаження власних міркувань Moonshot із конфігурації та рівня `/think` | `moonshot` |
    | `minimax-fast-mode` | Переписування моделі швидкого режиму MiniMax у спільному потоковому шляху | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Спільні власні обгортки OpenAI/Codex Responses: заголовки атрибуції, `/fast`/`serviceTier`, докладність тексту, власний вебпошук Codex, формування корисного навантаження для сумісності міркувань і керування контекстом Responses | `openai` |
    | `openrouter-thinking` | Обгортка міркувань OpenRouter для проксі-маршрутів із централізованою обробкою пропусків для непідтримуваних моделей/`auto` | `openrouter` |
    | `tool-stream-default-on` | Типово ввімкнена обгортка `tool_stream` для таких постачальників, як Z.AI, які хочуть потокове передавання інструментів, якщо його явно не вимкнено | `zai` |

    <Accordion title="Точки інтеграції SDK, на яких працюють конструктори сімейств">
      Кожен конструктор сімейства складається з відкритих допоміжних функцій нижчого рівня, експортованих із того самого пакета, які можна використати, коли постачальнику потрібно відхилитися від загального шаблону:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` і базові конструктори повторного відтворення (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Також експортує допоміжні функції повторного відтворення Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) і допоміжні функції кінцевих точок/моделей (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, а також спільні обгортки OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), сумісна з OpenAI обгортка DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), очищення попереднього заповнення міркувань Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), сумісність викликів інструментів у вигляді звичайного тексту (`createPlainTextToolCallCompatWrapper`) і спільні обгортки проксі-серверів/постачальників (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` — легкі обгортки корисного навантаження та подій для гарячих шляхів постачальників, включно з `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` і `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` і базові допоміжні функції схем постачальників.

      Для постачальників сімейства Gemini узгоджуйте режим виведення міркувань із
      транспортом. Постачальники безпосереднього Google Gemini API мають використовувати `native`
      виведення міркувань, щоб OpenClaw обробляв власні частини думок без додавання
      директив запиту `<think>` / `<final>`. Текстові серверні частини в стилі Gemini CLI,
      які аналізують остаточну відповідь JSON/текст, можуть зберігати спільний
      контракт `google-gemini` із тегами.

      Деякі потокові допоміжні функції навмисно залишаються локальними для постачальника. `@openclaw/anthropic-provider` зберігає `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і конструктори обгорток Anthropic нижчого рівня у власній відкритій точці інтеграції `api.ts` / `contract-api.ts`, оскільки вони кодують обробку бета-версій OAuth Claude та обмеження `context1m`. Плагін xAI так само зберігає формування власних Responses xAI у своєму `wrapStreamFn` (псевдоніми `/fast`, типовий `tool_stream`, очищення непідтримуваного суворого режиму інструментів, специфічне для xAI видалення корисного навантаження міркувань).

      Той самий шаблон кореня пакета також підтримує `@openclaw/openai-provider` (конструктори постачальників, допоміжні функції стандартних моделей, конструктори постачальників реального часу) і `@openclaw/openrouter-provider` (конструктор постачальника та допоміжні функції початкового налаштування/конфігурації).
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
      <Tab title="Власні заголовки">
        Для постачальників, яким потрібні власні заголовки запитів або зміни тіла:

        ```typescript
        // wrapStreamFn повертає StreamFn, похідну від ctx.streamFn
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
      <Tab title="Власна ідентичність транспорту">
        Для постачальників, яким потрібні власні заголовки запитів/сеансів або метадані у
        загальних транспортах HTTP чи WebSocket:

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
      <Tab title="Використання та оплата">
        Для провайдерів, які надають дані про використання й оплату:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` має три можливі результати. Поверніть
        `{ token, accountId?, subscriptionType?, rateLimitTier? }`, коли
        провайдер має облікові дані для доступу до інформації про використання й
        оплату (необов’язкові поля передають несекретні метадані тарифного плану
        з визначеного профілю до `fetchUsageSnapshot`). Повертайте
        `{ handled: true }` лише тоді, коли провайдер однозначно обробив
        автентифікацію для отримання даних про використання, але не має придатного
        токена використання, і OpenClaw має пропустити типовий резервний механізм
        API-ключа/OAuth. Повертайте `null` або `undefined`, коли провайдер не
        обробив запит і OpenClaw має продовжити з типовим резервним механізмом.

        Оголосіть ідентифікатор провайдера в `contracts.usageProviders`. Якщо
        наявні цей контракт маніфесту та **обидва** обробники, OpenClaw
        автоматично включає провайдера до збору даних про використання без
        завантаження непов’язаних плагінів провайдерів. Оновлювати основний список
        дозволених провайдерів не потрібно.
        `fetchUsageSnapshot` повертає спільну нейтральну до провайдера структуру:

        - `plan`: повідомлена провайдером назва підписки або ключа
        - `windows`: вікна квот зі скиданням у вигляді відсотків використання
        - `billing`: типізовані записи `balance`, `spend` або `budget`; `unit` може
          бути валютою ISO або одиницею провайдера, як-от `credits`
        - `summary`: стислий контекст, специфічний для провайдера, який не
          вміщується в ці структуровані поля

        Точно зберігайте семантику валют. Кредит провайдера не є доларом США,
        якщо це прямо не визначено контрактом вищого рівня. Плагін, який реалізує
        лише `fetchUsageSnapshot`, залишається доступним для явних або синтетичних
        викликів, але не виявляється автоматично, оскільки OpenClaw не може
        визначити його облікові дані для отримання інформації про використання.
      </Tab>
    </Tabs>

    <Accordion title="Поширені обробники провайдерів">
      Для плагінів моделей і провайдерів OpenClaw викликає обробники приблизно
      в такому порядку. Більшість провайдерів використовує лише 2–3. Це не повний
      контракт `ProviderPlugin` — повний актуальний перелік обробників і примітки
      щодо резервних механізмів див. у розділі [Внутрішня архітектура: обробники
      середовища виконання провайдера](/uk/plugins/architecture-internals#provider-runtime-hooks).
      Поля провайдерів лише для сумісності, які OpenClaw більше не викликає,
      зокрема `ProviderPlugin.capabilities` і `suppressBuiltInModel`, тут не
      наведено.

      | Обробник | Коли використовувати |
      | --- | --- |
      | `catalog` | Каталог моделей або типові базові URL-адреси |
      | `applyConfigDefaults` | Належні провайдеру глобальні типові значення під час матеріалізації конфігурації |
      | `normalizeModelId` | Очищення застарілих або попередніх псевдонімів ідентифікаторів моделей перед пошуком |
      | `normalizeTransport` | Очищення `api` / `baseUrl` сімейства провайдерів перед типовим формуванням моделі |
      | `normalizeConfig` | Нормалізація конфігурації `models.providers.<id>` |
      | `applyNativeStreamingUsageCompat` | Перетворення для сумісності з нативними потоковими даними про використання для провайдерів конфігурації |
      | `resolveConfigApiKey` | Належне провайдеру визначення автентифікації через маркери змінних середовища |
      | `resolveSyntheticAuth` | Синтетична автентифікація для локальних, самостійно розгорнутих або заснованих на конфігурації середовищ |
      | `resolveExternalAuthProfiles` | Накладання належних провайдеру зовнішніх профілів автентифікації для облікових даних, керованих CLI або застосунком |
      | `shouldDeferSyntheticProfileAuth` | Зниження пріоритету синтетичних заповнювачів збережених профілів порівняно з автентифікацією через середовище або конфігурацію |
      | `resolveDynamicModel` | Приймання довільних ідентифікаторів моделей вищого рівня |
      | `prepareDynamicModel` | Асинхронне отримання метаданих перед визначенням |
      | `normalizeResolvedModel` | Перетворення транспорту перед засобом запуску |
      | `normalizeToolSchemas` | Належне провайдеру очищення схем інструментів перед реєстрацією |
      | `inspectToolSchemas` | Належна провайдеру діагностика схем інструментів |
      | `resolveReasoningOutputMode` | Контракт виведення міркувань із тегами або в нативному форматі |
      | `prepareExtraParams` | Типові параметри запиту |
      | `createStreamFn` | Повністю власний транспорт StreamFn |
      | `wrapStreamFn` | Власні обгортки заголовків або тіла у звичайному потоковому шляху |
      | `resolveTransportTurnState` | Нативні заголовки або метадані для кожного ходу |
      | `resolveWebSocketSessionPolicy` | Нативні заголовки сеансу WS або період відновлення |
      | `formatApiKey` | Власна структура токена середовища виконання |
      | `refreshOAuth` | Власне оновлення OAuth |
      | `buildAuthDoctorHint` | Настанови щодо виправлення автентифікації |
      | `matchesContextOverflowError` | Належне провайдеру виявлення переповнення |
      | `classifyFailoverReason` | Належна провайдеру класифікація обмеження частоти або перевантаження |
      | `isCacheTtlEligible` | Умовний допуск TTL кешу промптів |
      | `buildMissingAuthMessage` | Власна підказка про відсутність автентифікації |
      | `augmentModelCatalog` | Синтетичні рядки для прямої сумісності (застаріло — віддавайте перевагу `registerModelCatalogProvider`) |
      | `resolveThinkingProfile` | Набір параметрів `/think`, специфічний для моделі |
      | `isBinaryThinking` | Сумісність із двійковим увімкненням або вимкненням міркувань (застаріло — віддавайте перевагу `resolveThinkingProfile`) |
      | `supportsXHighThinking` | Сумісність із підтримкою міркувань `xhigh` (застаріло — віддавайте перевагу `resolveThinkingProfile`) |
      | `resolveDefaultThinkingLevel` | Сумісність із типовою політикою `/think` (застаріло — віддавайте перевагу `resolveThinkingProfile`) |
      | `isModernModelRef` | Зіставлення моделей для робочих або димових перевірок |
      | `prepareRuntimeAuth` | Обмін токена перед логічним висновуванням |
      | `resolveUsageAuth` | Власний розбір облікових даних для отримання інформації про використання |
      | `fetchUsageSnapshot` | Власна кінцева точка інформації про використання |
      | `createEmbeddingProvider` | Належний провайдеру адаптер вбудовувань для пам’яті або пошуку |
      | `buildReplayPolicy` | Власна політика повторного відтворення або Compaction стенограми |
      | `sanitizeReplayHistory` | Специфічні для провайдера перетворення повторного відтворення після типового очищення |
      | `validateReplayTurns` | Сувора перевірка ходів повторного відтворення перед вбудованим засобом запуску |
      | `onModelSelected` | Зворотний виклик після вибору, наприклад для телеметрії |

      Примітки щодо резервних механізмів середовища виконання:

      - `normalizeConfig` визначає один плагін-власник для кожного ідентифікатора провайдера (спочатку вбудовані провайдери, потім відповідний плагін середовища виконання) і викликає лише цей обробник — інші провайдери не скануються. Власний обробник Google `normalizeConfig` нормалізує записи конфігурації `google` / `google-vertex` / `google-antigravity`; це не окремий основний резервний механізм.
      - `resolveConfigApiKey` використовує обробник провайдера, якщо його надано. Amazon Bedrock зберігає визначення маркерів змінних середовища AWS у своєму плагіні провайдера; сама автентифікація середовища виконання й надалі використовує типовий ланцюжок AWS SDK, якщо налаштовано `auth: "aws-sdk"`.
      - `resolveThinkingProfile(ctx)` отримує вибрані `provider`, `modelId`, необов’язкову об’єднану підказку каталогу `reasoning` і необов’язкові об’єднані факти сумісності моделі `compat`. Використовуйте `compat` лише для вибору інтерфейсу або профілю міркувань провайдера.
      - `resolveSystemPromptContribution` дає провайдеру змогу додавати до системного промпту вказівки для сімейства моделей з урахуванням кешу. Віддавайте йому перевагу над застарілим загальноплагінним обробником `before_prompt_build`, коли поведінка належить одному провайдеру або сімейству моделей і має зберігати поділ кешу на стабільну та динамічну частини.

    </Accordion>

  </Step>

  <Step title="Додайте додаткові можливості (необов’язково)">
    ### Крок 5: Додайте додаткові можливості

    Плагін провайдера може реєструвати вбудовування, мовлення, транскрибування
    в реальному часі, голосовий зв’язок у реальному часі, розуміння медіа,
    генерування зображень, генерування відео, отримання вебресурсів і вебпошук
    поряд із текстовим логічним висновуванням. OpenClaw класифікує його як плагін
    із **гібридними можливостями** — рекомендований шаблон для плагінів компаній
    (один плагін на постачальника). Див.
    [Внутрішня архітектура: володіння можливостями](/uk/plugins/architecture#capability-ownership-model).

    Зареєструйте кожну можливість у `register(api)` поруч із наявним викликом
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

        Використовуйте `assertOkOrThrowProviderError(...)` для помилок HTTP
        провайдера, щоб плагіни спільно використовували обмежене читання тіла
        помилки, розбір помилок JSON і суфікси ідентифікаторів запитів.
      </Tab>
      <Tab title="Транскрибування в реальному часі">
        Віддавайте перевагу `createRealtimeTranscriptionWebSocketSession(...)` —
        спільний допоміжний засіб обробляє перехоплення проксі, затримку між
        повторними підключеннями, скидання даних під час закриття, узгодження
        готовності, постановку аудіо в чергу та діагностику подій закриття. Ваш
        плагін лише зіставляє події вищого рівня.

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

        Провайдери пакетного STT, які надсилають multipart-аудіо через POST, мають використовувати
        `buildAudioTranscriptionFormData(...)` з
        `openclaw/plugin-sdk/provider-http`. Ця допоміжна функція нормалізує назви
        завантажуваних файлів, зокрема для завантажень AAC, яким потрібна назва файлу
        у стилі M4A для сумісних API транскрибування.
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
            handlesInputAudioBargeIn: true,
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

        Оголосіть `capabilities`, щоб `talk.catalog` міг надавати допустимі режими,
        транспорти, аудіоформати та прапорці функцій браузерним і нативним клієнтам
        Talk. Реалізуйте `handleBargeIn`, якщо транспорт може визначати, що
        людина перериває відтворення відповіді асистента, а провайдер підтримує
        скорочення або очищення активної аудіовідповіді.
        `submitToolResult` може повертати `void` для синхронного надсилання або
        `Promise<void>` як межу асинхронного завершення, яку може надавати міст
        провайдера. Сеанси ретрансляції Gateway очікують на цю обіцянку, перш ніж
        підтвердити остаточний результат або очистити пов’язаний запуск; відхиляйте
        її, якщо надсилання завершується помилкою.
        Установіть `supportsToolResultSuppression: false`, якщо провайдер не може
        виконати `options.suppressResponse`. Тоді OpenClaw не застосовує придушення
        для внутрішніх результатів примусової консультації та скасування й відхиляє
        прямі запити на придушені результати замість непомітного запуску відповіді.
        Споживачі `createRealtimeVoiceBridgeSession` також можуть повертати обіцянку
        з `onToolCall`; синхронні винятки та відхилення спрямовуються до зворотного
        виклику `onError` сеансу.
        Установлюйте `handlesInputAudioBargeIn` лише тоді, коли VAD провайдера
        підтверджує переривання викликом `onClearAudio("barge-in")`. Провайдери,
        які не вказують цей прапорець, використовують локальне резервне виявлення
        OpenClaw для вхідного аудіо.
      </Tab>
      <Tab title="Розуміння медіаданих">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```

        Локальні або самостійно розміщені медіапровайдери, яким навмисно не потрібні
        облікові дані, можуть надавати `resolveAuth` і повертати `kind: "none"`.
        OpenClaw усе одно зберігає звичайну перевірку автентифікації для провайдерів,
        які явно не погодилися на таку поведінку. Наявні провайдери можуть і далі
        читати `req.apiKey`; новим провайдерам варто надавати перевагу `req.auth`.

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
      <Tab title="Вбудовування">
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

        Оголосіть такий самий ідентифікатор у `contracts.embeddingProviders`. Це
        загальний контракт вбудовування для багаторазового створення векторів,
        зокрема для пошуку в пам’яті. `registerMemoryEmbeddingProvider(...)` —
        застарілий засіб сумісності для наявних адаптерів, специфічних для пам’яті.
      </Tab>
      <Tab title="Генерування зображень і відео">
        Можливості зображень і відео використовують структуру, **залежну від режиму**.
        Провайдери зображень оголошують обов’язкові блоки можливостей `generate` та
        `edit`; провайдери відео оголошують `generate`, `imageToVideo` та
        `videoToVideo`. Плоских агрегованих полів на кшталт `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` недостатньо, щоб належним чином
        оголосити підтримку режимів перетворення або вимкнені режими. Генерування
        музики використовує такий самий шаблон `generate` / `edit`.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          capabilities: {
            generate: { maxCount: 4, supportsSize: true },
            edit: { enabled: false },
          },
          generateImage: async (req) => ({ images: [] }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          defaultTimeoutMs: 600_000,
          models: ["acme-video", "acme-image-video"],
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
          catalogByModel: {
            "acme-image-video": {
              modes: ["imageToVideo"],
              capabilities: {
                imageToVideo: {
                  enabled: true,
                  maxVideos: 1,
                  maxInputImages: 1,
                  resolutions: ["480P", "720P", "1080P"],
                  supportsResolution: true,
                },
                videoToVideo: { enabled: false },
              },
            },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```

        `capabilities` є обов’язковим для обох типів провайдерів; `edit` і блоки
        перетворення відео (`imageToVideo`, `videoToVideo`) завжди потребують
        явного прапорця `enabled`.

        Використовуйте `catalogByModel`, коли статичні режими або можливості
        зазначеної моделі відрізняються від стандартних значень провайдера. Ці
        метадані забезпечують точність `video_generate action=list` і каталогів
        моделей без виклику коду провайдера. Пошук і перевірка можливостей під час
        запиту й надалі належать `resolveModelCapabilities` і `generateVideo`;
        за можливості повторно використовуйте ту саму константу можливостей для
        обох шляхів.
      </Tab>
      <Tab title="Отримання даних і пошук у вебі">
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
          hint: "Search the web through Acme's search backend.",
          envVars: ["ACME_SEARCH_API_KEY"],
          placeholder: "acme-...",
          signupUrl: "https://acme.example.com/search",
          credentialPath: "plugins.entries.acme.config.webSearch.apiKey",
          getCredentialValue: (searchConfig) => searchConfig?.acme?.apiKey,
          setCredentialValue: (searchConfigTarget, value) => {
            const acme = (searchConfigTarget.acme ??= {});
            acme.apiKey = value;
          },
          createTool: () => ({
            description: "Search the web through Acme Search.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });
        ```

        Обидва типи провайдерів використовують однакову структуру підключення
        облікових даних: `hint`, `envVars`, `placeholder`, `signupUrl`,
        `credentialPath`, `getCredentialValue`, `setCredentialValue` і
        `createTool` є обов’язковими.
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

Плагіни провайдерів публікуються так само, як і будь-який інший зовнішній плагін коду:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

`clawhub skill publish <path>` — це інша команда для публікації папки Skills,
а не пакета плагіна — не використовуйте її тут.

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

## Довідка щодо порядку каталогу

`catalog.order` визначає, коли ваш каталог об’єднується відносно вбудованих
провайдерів:

| Порядок   | Коли          | Варіант використання                                         |
| --------- | ------------- | ------------------------------------------------------------ |
| `simple`  | Перший прохід | Прості провайдери з API-ключами                              |
| `profile` | Після simple  | Провайдери, доступ до яких обмежено профілями автентифікації |
| `paired`  | Після profile | Синтез кількох пов’язаних записів                            |
| `late`    | Останній прохід | Перевизначення наявних провайдерів (має пріоритет у разі конфлікту) |

## Наступні кроки

- [Plugin каналів](/uk/plugins/sdk-channel-plugins) — якщо ваш Plugin також надає канал
- [Середовище виконання SDK](/uk/plugins/sdk-runtime) — допоміжні функції `api.runtime` (TTS, пошук, субагент)
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпорту з підшляхів
- [Внутрішня архітектура Plugin](/uk/plugins/architecture-internals#provider-runtime-hooks) — подробиці хуків і вбудовані приклади

## Пов’язані матеріали

- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення плагінів](/uk/plugins/building-plugins)
- [Створення плагінів каналів](/uk/plugins/sdk-channel-plugins)
