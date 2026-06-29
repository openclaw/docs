---
read_when:
    - Вы создаете новый Plugin поставщика моделей
    - Вы хотите добавить в OpenClaw OpenAI-совместимый прокси или собственную LLM
    - Вам нужно понимать аутентификацию провайдеров, каталоги и runtime hooks
sidebarTitle: Provider plugins
summary: Пошаговое руководство по созданию Plugin поставщика моделей для OpenClaw
title: Создание Plugin для провайдеров
x-i18n:
    generated_at: "2026-06-28T23:31:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05ac4d08eae00e7e0fcf03edea691dc9ced7309421dd19a31edf69cee1e01f0b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Это руководство пошагово показывает, как создать Plugin провайдера, который добавляет провайдера моделей
(LLM) в OpenClaw. К концу у вас будет провайдер с каталогом моделей,
аутентификацией по ключу API и динамическим разрешением моделей.

<Info>
  Если вы раньше не создавали Plugin для OpenClaw, сначала прочитайте
  [Начало работы](/ru/plugins/building-plugins), чтобы разобраться с базовой
  структурой пакета и настройкой манифеста.
</Info>

<Tip>
  Plugins провайдеров добавляют модели в обычный цикл вывода OpenClaw. Если модель
  должна запускаться через собственный демон агента, который управляет потоками, compaction или событиями
  инструментов, используйте провайдера вместе с [агентным harness](/ru/plugins/sdk-agent-harness),
  вместо того чтобы помещать детали протокола демона в ядро.
</Tip>

## Пошаговое руководство

<Steps>
  <Step title="Пакет и манифест">
    ### Шаг 1: Пакет и манифест

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

    Манифест объявляет `setup.providers[].envVars`, чтобы OpenClaw мог обнаруживать
    учетные данные без загрузки runtime вашего Plugin. Добавьте `providerAuthAliases`,
    когда вариант провайдера должен повторно использовать аутентификацию id другого провайдера. `modelSupport`
    необязателен и позволяет OpenClaw автоматически загрузить Plugin вашего провайдера по сокращенным
    id моделей, таким как `acme-large`, еще до появления runtime-хуков. Если вы публикуете
    провайдера в ClawHub, эти поля `openclaw.compat` и `openclaw.build`
    обязательны в `package.json`.

  </Step>

  <Step title="Зарегистрируйте провайдера">
    Минимальному текстовому провайдеру нужны `id`, `label`, `auth` и `catalog`.
    `catalog` — это runtime/config-хук, принадлежащий провайдеру; он может вызывать живые
    API поставщика и возвращает записи `models.providers`.

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

    `registerModelCatalogProvider` — это более новая поверхность каталога control-plane
    для UI списков, справки и выбора. Используйте ее для строк text, image-generation,
    video-generation и music-generation. Оставляйте вызовы endpoint поставщика и
    сопоставление ответов в Plugin; OpenClaw владеет общей формой строк, метками
    источников и отрисовкой справки.

    Это рабочий провайдер. Теперь пользователи могут выполнить
    `openclaw onboard --acme-ai-api-key <key>` и выбрать
    `acme-ai/acme-large` в качестве модели.

    ### Живое обнаружение моделей

    Если ваш провайдер предоставляет API в стиле `/models`, оставьте специфичный для провайдера
    endpoint и проекцию строк в вашем Plugin и используйте
    `openclaw/plugin-sdk/provider-catalog-live-runtime` для общего lifecycle выборки.
    Этот helper дает защищенные HTTP-запросы, заголовки аутентификации провайдера,
    структурированные HTTP-ошибки, TTL-кэширование и поведение статического fallback без
    помещения политики провайдера в ядро OpenClaw.

    Используйте `buildLiveModelProviderConfig`, когда live API сообщает только, какие
    принадлежащие провайдеру строки статического каталога сейчас доступны:

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

    Используйте `getCachedLiveProviderModelRows`, когда API провайдера возвращает более богатые
    метаданные, а Plugin должен сам проецировать строки в определения моделей OpenClaw:

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

    `run` должен оставаться закрытым аутентификацией и возвращать `null`, когда нет пригодных
    учетных данных. Сохраняйте offline `staticRun` или статический fallback, чтобы setup, docs,
    tests и поверхности выбора не зависели от живого доступа к сети. Используйте TTL,
    подходящий для свежести списка моделей, избегайте опроса файловой системы во время запроса
    и передавайте специфичные для провайдера `readRows` / `readModelId` только тогда, когда
    ответ upstream не имеет OpenAI-совместимую форму `{ data: [{ id, object }] }`.

    Если upstream-провайдер использует управляющие токены, отличные от OpenClaw, добавьте
    небольшое двунаправленное текстовое преобразование вместо замены пути потока:

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

    `input` переписывает финальный системный prompt и содержимое текстовых сообщений перед
    transport. `output` переписывает текстовые дельты assistant и финальный текст до того, как
    OpenClaw разбирает собственные управляющие маркеры или доставку в канал.

    Для встроенных провайдеров, которые регистрируют только одного текстового провайдера с
    аутентификацией по ключу API и единственным runtime на основе каталога, предпочитайте более узкий
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

    `buildProvider` — это путь живого каталога, используемый, когда OpenClaw может разрешить реальную
    аутентификацию поставщика. Он может выполнять обнаружение, специфичное для поставщика. Используйте
    `buildStaticProvider` только для офлайн-строк, которые безопасно показывать до настройки
    аутентификации; он не должен требовать учетных данных или выполнять сетевые запросы.
    Отображение `models list --all` в OpenClaw сейчас выполняет статические каталоги
    только для встроенных Plugin поставщиков, с пустой конфигурацией, пустым окружением и без
    путей агента/рабочей области.

    Если вашему потоку аутентификации также нужно изменять `models.providers.*`, псевдонимы и
    модель агента по умолчанию во время onboarding, используйте готовые вспомогательные функции из
    `openclaw/plugin-sdk/provider-onboard`. Самые узкие вспомогательные функции:
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` и
    `createModelCatalogPresetAppliers(...)`.

    Когда нативная конечная точка поставщика поддерживает потоковые блоки usage поверх
    обычного транспорта `openai-completions`, предпочитайте общие вспомогательные функции каталога в
    `openclaw/plugin-sdk/provider-catalog-shared` вместо жестко заданных
    проверок id поставщика. `supportsNativeStreamingUsageCompat(...)` и
    `applyProviderNativeStreamingUsageCompat(...)` определяют поддержку по карте
    возможностей конечной точки, поэтому нативные конечные точки в стиле Moonshot/DashScope все равно
    включаются, даже если Plugin использует пользовательский id поставщика.

    Примеры живого обнаружения выше покрывают API поставщиков в стиле `/models`. Держите
    это обнаружение внутри `catalog.run`, с ограничением по пригодной аутентификации, и держите
    `staticRun` без сетевых запросов для генерации офлайн-каталога.

  </Step>

  <Step title="Add dynamic model resolution">
    Если ваш поставщик принимает произвольные ID моделей (например, прокси или маршрутизатор),
    добавьте `resolveDynamicModel`:

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

    Если разрешение требует сетевого вызова, используйте `prepareDynamicModel` для асинхронного
    прогрева - `resolveDynamicModel` запустится снова после его завершения.

  </Step>

  <Step title="Add runtime hooks (as needed)">
    Большинству поставщиков нужны только `catalog` + `resolveDynamicModel`. Добавляйте hooks
    постепенно, по мере необходимости для вашего поставщика.

    Общие сборщики вспомогательных функций теперь покрывают самые распространенные семейства replay/tool-compat,
    поэтому Plugin обычно не нужно вручную подключать каждый hook по одному:

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

    Доступные сегодня семейства replay:

    | Семейство | Что подключается | Встроенные примеры |
    | --- | --- | --- |
    | `openai-compatible` | Общая политика replay в стиле OpenAI для OpenAI-совместимых транспортов, включая очистку tool-call-id, исправления порядка с первым сообщением assistant и общую валидацию ходов Gemini там, где это нужно транспорту | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Политика replay с учетом Claude, выбираемая по `modelId`, чтобы транспорты Anthropic-message получали очистку thinking-block, специфичную для Claude, только когда разрешенная модель действительно имеет id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Нативная политика replay Gemini плюс очистка bootstrap replay. Общее семейство сохраняет текстовый вывод Gemini CLI на tagged reasoning; прямой поставщик `google` переопределяет `resolveReasoningOutputMode` на `native`, потому что thinking в Gemini API приходит как нативные thought parts. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Очистка thought-signature Gemini для моделей Gemini, работающих через OpenAI-совместимые прокси-транспорты; не включает нативную валидацию replay Gemini или bootstrap-перезаписи | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Гибридная политика для поставщиков, которые смешивают поверхности моделей Anthropic-message и OpenAI-совместимые поверхности моделей в одном Plugin; опциональное удаление thinking-block только для Claude остается ограниченным стороной Anthropic | `minimax` |

    Доступные сегодня семейства stream:

    | Семейство | Что подключается | Встроенные примеры |
    | --- | --- | --- |
    | `google-thinking` | Нормализация thinking payload Gemini на общем stream-пути | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Обертка Kilo reasoning на общем stream-пути прокси, при этом `kilo/auto` и неподдерживаемые id reasoning прокси пропускают внедренный thinking | `kilocode` |
    | `moonshot-thinking` | Маппинг бинарного payload нативного thinking Moonshot из конфигурации + уровня `/think` | `moonshot` |
    | `minimax-fast-mode` | Перезапись модели MiniMax fast-mode на общем stream-пути | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Общие обертки нативных OpenAI/Codex Responses: заголовки атрибуции, `/fast`/`serviceTier`, подробность текста, нативный веб-поиск Codex, формирование reasoning-compat payload и управление контекстом Responses | `openai` |
    | `openrouter-thinking` | Обертка reasoning OpenRouter для прокси-маршрутов, с централизованной обработкой пропусков unsupported-model/`auto` | `openrouter` |
    | `tool-stream-default-on` | Включенная по умолчанию обертка `tool_stream` для поставщиков вроде Z.AI, которым нужен tool streaming, если он явно не отключен | `zai` |

    <Accordion title="SDK seams powering the family builders">
      Каждый сборщик семейства составлен из низкоуровневых публичных вспомогательных функций, экспортируемых из того же пакета, к которым можно обратиться, когда поставщику нужно отойти от общего шаблона:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` и необработанные сборщики replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Также экспортирует вспомогательные функции replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) и вспомогательные функции конечных точек/моделей (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, а также общие обертки OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), OpenAI-совместимая обертка DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), очистка thinking prefill для Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), совместимость plain-text tool-call (`createPlainTextToolCallCompatWrapper`) и общие обертки прокси/поставщиков (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` - легковесные обертки payload и событий для горячих путей поставщиков, включая `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` и `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` и базовые вспомогательные функции схем поставщиков.

      Для поставщиков семейства Gemini держите режим reasoning-output согласованным с
      транспортом. Прямые поставщики Google Gemini API должны использовать `native`
      reasoning output, чтобы OpenClaw потреблял нативные thought parts без добавления
      prompt-директив `<think>` / `<final>`. Текстовые backends в стиле Gemini CLI,
      которые разбирают финальный JSON/текстовый ответ, могут сохранять общий
      tagged-контракт `google-gemini`.

      Некоторые stream-вспомогательные функции намеренно остаются локальными для поставщика. `@openclaw/anthropic-provider` держит `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` и низкоуровневые сборщики оберток Anthropic в собственном публичном шве `api.ts` / `contract-api.ts`, потому что они кодируют обработку Claude OAuth beta и gating `context1m`. Plugin xAI аналогично держит формирование нативных xAI Responses в собственном `wrapStreamFn` (псевдонимы `/fast`, `tool_stream` по умолчанию, очистка неподдерживаемого strict-tool, удаление reasoning-payload, специфичное для xAI).

      Тот же шаблон package-root также поддерживает `@openclaw/openai-provider` (сборщики поставщика, вспомогательные функции модели по умолчанию, сборщики realtime-поставщика) и `@openclaw/openrouter-provider` (сборщик поставщика плюс вспомогательные функции onboarding/config).
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        Для поставщиков, которым нужен обмен токена перед каждым вызовом inference:

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
      <Tab title="Custom headers">
        Для поставщиков, которым нужны пользовательские заголовки запросов или изменения тела:

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
      <Tab title="Native transport identity">
        Для поставщиков, которым нужны нативные заголовки запросов/сессий или метаданные на
        универсальных HTTP- или WebSocket-транспортах:

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
      <Tab title="Usage and billing">
        Для провайдеров, которые предоставляют данные об использовании/оплате:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` имеет три исхода. Возвращайте `{ token, accountId? }`,
        когда у провайдера есть учетные данные для использования/оплаты. Возвращайте
        `{ handled: true }` только когда провайдер окончательно обработал авторизацию
        использования, но у него нет пригодного токена использования, и OpenClaw должен
        пропустить общий резервный путь API-ключа/OAuth. Возвращайте `null` или
        `undefined`, когда провайдер не обработал запрос и OpenClaw должен продолжить
        общий резервный путь.
      </Tab>
    </Tabs>

    <Accordion title="All available provider hooks">
      OpenClaw вызывает хуки в таком порядке. Большинство провайдеров используют только 2-3:
      Поля провайдера только для совместимости, которые OpenClaw больше не вызывает, например
      `ProviderPlugin.capabilities` и `suppressBuiltInModel`, здесь не перечислены.

      | # | Хук | Когда использовать |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей или значения по умолчанию для базового URL |
      | 2 | `applyConfigDefaults` | Глобальные значения по умолчанию, принадлежащие провайдеру, при материализации конфигурации |
      | 3 | `normalizeModelId` | Очистка устаревших/предварительных псевдонимов ID модели перед поиском |
      | 4 | `normalizeTransport` | Очистка `api` / `baseUrl` для семейства провайдера перед общей сборкой модели |
      | 5 | `normalizeConfig` | Нормализация конфигурации `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Перезаписи совместимости нативного потокового учета использования для конфигурационных провайдеров |
      | 7 | `resolveConfigApiKey` | Разрешение авторизации по env-маркерам, принадлежащее провайдеру |
      | 8 | `resolveSyntheticAuth` | Локальная/самостоятельно размещенная или основанная на конфигурации синтетическая авторизация |
      | 9 | `shouldDeferSyntheticProfileAuth` | Понижение приоритета синтетических заполнителей сохраненного профиля за env/config-авторизацией |
      | 10 | `resolveDynamicModel` | Прием произвольных ID моделей upstream |
      | 11 | `prepareDynamicModel` | Асинхронная загрузка метаданных перед разрешением |
      | 12 | `normalizeResolvedModel` | Перезаписи транспорта перед runner |
      | 13 | `normalizeToolSchemas` | Очистка схем инструментов, принадлежащая провайдеру, перед регистрацией |
      | 14 | `inspectToolSchemas` | Диагностика схем инструментов, принадлежащая провайдеру |
      | 15 | `resolveReasoningOutputMode` | Контракт tagged vs native reasoning-output |
      | 16 | `prepareExtraParams` | Параметры запроса по умолчанию |
      | 17 | `createStreamFn` | Полностью пользовательский транспорт StreamFn |
      | 19 | `wrapStreamFn` | Пользовательские обертки headers/body на обычном пути потока |
      | 20 | `resolveTransportTurnState` | Нативные headers/metadata для каждого turn |
      | 21 | `resolveWebSocketSessionPolicy` | Нативные headers/cool-down для WS-сеанса |
      | 22 | `formatApiKey` | Пользовательская форма runtime-токена |
      | 23 | `refreshOAuth` | Пользовательское обновление OAuth |
      | 24 | `buildAuthDoctorHint` | Подсказка по исправлению авторизации |
      | 25 | `matchesContextOverflowError` | Обнаружение переполнения, принадлежащее провайдеру |
      | 26 | `classifyFailoverReason` | Классификация rate-limit/overload, принадлежащая провайдеру |
      | 27 | `isCacheTtlEligible` | Ограничение TTL кеша промптов |
      | 28 | `buildMissingAuthMessage` | Пользовательская подсказка об отсутствующей авторизации |
      | 29 | `augmentModelCatalog` | Синтетические строки forward-compat |
      | 30 | `resolveThinkingProfile` | Набор параметров `/think`, специфичный для модели |
      | 31 | `isBinaryThinking` | Совместимость бинарного включения/выключения thinking |
      | 32 | `supportsXHighThinking` | Совместимость поддержки reasoning `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Совместимость политики `/think` по умолчанию |
      | 34 | `isModernModelRef` | Сопоставление моделей live/smoke |
      | 35 | `prepareRuntimeAuth` | Обмен токена перед inference |
      | 36 | `resolveUsageAuth` | Пользовательский разбор учетных данных использования |
      | 37 | `fetchUsageSnapshot` | Пользовательский endpoint использования |
      | 38 | `createEmbeddingProvider` | Адаптер embedding, принадлежащий провайдеру, для memory/search |
      | 39 | `buildReplayPolicy` | Пользовательская политика replay/compaction транскрипта |
      | 40 | `sanitizeReplayHistory` | Специфичные для провайдера перезаписи replay после общей очистки |
      | 41 | `validateReplayTurns` | Строгая валидация replay-turn перед встроенным runner |
      | 42 | `onModelSelected` | Callback после выбора (например, telemetry) |

      Примечания о резервном поведении runtime:

      - `normalizeConfig` сначала проверяет совпавшего провайдера, затем другие provider plugins с поддержкой хуков, пока один из них действительно не изменит конфигурацию. Если ни один хук провайдера не переписывает поддерживаемую запись конфигурации семейства Google, встроенный нормализатор конфигурации Google все равно применяется.
      - `resolveConfigApiKey` использует хук провайдера, когда он предоставлен. Amazon Bedrock держит разрешение AWS env-маркеров в своем provider plugin; сама runtime-авторизация все равно использует цепочку AWS SDK по умолчанию, когда настроена с `auth: "aws-sdk"`.
      - `resolveThinkingProfile(ctx)` получает выбранные `provider`, `modelId`, необязательную объединенную подсказку каталога `reasoning` и необязательные объединенные факты `compat` модели. Используйте `compat` только для выбора thinking UI/profile провайдера.
      - `resolveSystemPromptContribution` позволяет провайдеру внедрять cache-aware guidance для system-prompt для семейства моделей. Предпочитайте его вместо `before_prompt_build`, когда поведение принадлежит одному провайдеру/семейству моделей и должно сохранять разделение stable/dynamic cache.

      Подробные описания и реальные примеры см. в [Внутреннее устройство: хуки runtime провайдера](/ru/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Add extra capabilities (optional)">
    ### Шаг 5: Добавьте дополнительные возможности

    Provider plugin может регистрировать embeddings, speech, realtime transcription,
    realtime voice, media understanding, image generation, video generation,
    web fetch и web search вместе с text inference. OpenClaw классифицирует это как
    плагин с **гибридными возможностями** - рекомендуемый шаблон для плагинов компаний
    (один плагин на поставщика). См.
    [Внутреннее устройство: владение возможностями](/ru/plugins/architecture#capability-ownership-model).

    Регистрируйте каждую возможность внутри `register(api)` рядом с существующим
    вызовом `api.registerProvider(...)`. Выберите только нужные вкладки:

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

        Используйте `assertOkOrThrowProviderError(...)` для HTTP-сбоев провайдера, чтобы
        плагины совместно использовали ограниченное чтение тела ошибки, разбор JSON-ошибок и
        suffixes request-id.
      </Tab>
      <Tab title="Realtime transcription">
        Предпочитайте `createRealtimeTranscriptionWebSocketSession(...)` - общий
        helper обрабатывает proxy capture, reconnect backoff, close flushing, ready
        handshakes, audio queueing и диагностику close-event. Ваш плагин
        только сопоставляет upstream-события.

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

        Batch STT-провайдеры, которые отправляют multipart-аудио через POST, должны использовать
        `buildAudioTranscriptionFormData(...)` из
        `openclaw/plugin-sdk/provider-http`. Helper нормализует имена файлов для загрузки,
        включая AAC-загрузки, которым нужно имя файла в стиле M4A для
        совместимых API транскрипции.
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

        Объявите `capabilities`, чтобы `talk.catalog` мог предоставлять допустимые режимы,
        транспорты, аудиоформаты и флаги функций браузерным и нативным клиентам
        Talk. Реализуйте `handleBargeIn`, когда транспорт может определить, что
        человек прерывает воспроизведение ассистента, а провайдер поддерживает
        усечение или очистку активного аудиоответа.
      </Tab>
      <Tab title="Понимание медиа">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```

        Локальные или самостоятельно размещенные медиапровайдеры, которым намеренно
        не требуются учетные данные, могут предоставлять `resolveAuth` и возвращать
        `kind: "none"`. OpenClaw по-прежнему сохраняет обычную проверку
        аутентификации для провайдеров, которые явно не включили этот режим.
        Существующие провайдеры могут продолжать читать `req.apiKey`; новым
        провайдерам следует предпочитать `req.auth`.

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

        Объявите тот же id в `contracts.embeddingProviders`. Это общий контракт
        embeddings для повторно используемой генерации векторов, включая поиск по
        памяти. `registerMemoryEmbeddingProvider(...)` устарел и оставлен как
        совместимость для существующих адаптеров, специфичных для памяти.
      </Tab>
      <Tab title="Генерация изображений и видео">
        Возможности видео используют форму, **учитывающую режим**: `generate`,
        `imageToVideo` и `videoToVideo`. Плоских агрегированных полей вроде
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` недостаточно,
        чтобы корректно объявлять поддержку режимов преобразования или отключенные
        режимы. Генерация музыки следует тому же шаблону с явными блоками
        `generate` / `edit`.

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
      <Tab title="Веб-загрузка и поиск">
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

  <Step title="Тестирование">
    ### Шаг 6: Тестирование

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

## Публикация в ClawHub

Plugin провайдеров публикуются так же, как и любой другой внешний кодовый Plugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Не используйте здесь устаревший псевдоним публикации только для Skills; пакеты
Plugin должны использовать `clawhub package publish`.

## Структура файлов

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with provider auth metadata
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## Справочник порядка каталога

`catalog.order` управляет тем, когда ваш каталог объединяется относительно
встроенных провайдеров:

| Порядок   | Когда                  | Сценарий использования                          |
| --------- | ---------------------- | ----------------------------------------------- |
| `simple`  | Первый проход          | Обычные провайдеры с API-ключом                 |
| `profile` | После simple           | Провайдеры, зависящие от профилей аутентификации |
| `paired`  | После profile          | Синтез нескольких связанных записей             |
| `late`    | Последний проход       | Переопределение существующих провайдеров (побеждает при конфликте) |

## Следующие шаги

- [Plugin каналов](/ru/plugins/sdk-channel-plugins) - если ваш Plugin также предоставляет канал
- [Среда выполнения SDK](/ru/plugins/sdk-runtime) - вспомогательные средства `api.runtime` (TTS, поиск, subagent)
- [Обзор SDK](/ru/plugins/sdk-overview) - полный справочник импортов по подпутям
- [Внутреннее устройство Plugin](/ru/plugins/architecture-internals#provider-runtime-hooks) - подробности хуков и встроенные примеры

## Связанные материалы

- [Настройка Plugin SDK](/ru/plugins/sdk-setup)
- [Создание Plugin](/ru/plugins/building-plugins)
- [Создание Plugin каналов](/ru/plugins/sdk-channel-plugins)
