---
read_when:
    - Вы создаёте новый плагин поставщика моделей
    - Вы хотите добавить в OpenClaw прокси, совместимый с OpenAI, или пользовательскую LLM
    - Необходимо понимать аутентификацию провайдеров, каталоги и хуки среды выполнения
sidebarTitle: Provider plugins
summary: Пошаговое руководство по созданию плагина поставщика моделей для OpenClaw
title: Создание плагинов провайдеров
x-i18n:
    generated_at: "2026-07-12T11:43:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ebbe59b4487a93c6fec3624251eff7394197e249bb8fc7899f1fc88162510d1c
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Создайте Plugin провайдера, чтобы добавить провайдера моделей (LLM) в OpenClaw: каталог моделей, аутентификацию по API-ключу и динамическое разрешение моделей.

<Info>
  Впервые работаете с плагинами OpenClaw? Сначала прочитайте руководство [Начало работы](/ru/plugins/building-plugins), чтобы узнать о структуре пакета и настройке манифеста.
</Info>

<Tip>
  Плагины провайдеров добавляют модели в обычный цикл инференса OpenClaw. Если модель должна запускаться через нативный демон агента, который управляет потоками, Compaction или событиями инструментов, дополните провайдер [средой выполнения агента](/ru/plugins/sdk-agent-harness), а не добавляйте сведения о протоколе демона в ядро.
</Tip>

## Пошаговое руководство

<Steps>
  <Step title="Пакет и манифест">
    ### Шаг 1. Пакет и манифест

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

    `setup.providers[].envVars` позволяет OpenClaw обнаруживать учётные данные без загрузки среды выполнения вашего плагина. Добавьте `providerAuthAliases`, если вариант провайдера должен повторно использовать аутентификацию другого идентификатора провайдера. `modelSupport` является необязательным и позволяет OpenClaw автоматически загружать Plugin вашего провайдера по сокращённым идентификаторам моделей, таким как `acme-large`, ещё до появления обработчиков среды выполнения. Поля `openclaw.compat` и `openclaw.build` в `package.json` обязательны для публикации в ClawHub (`openclaw.compat.pluginApi` и `openclaw.build.openclawVersion` — два обязательных поля; если `minGatewayVersion` не указан, используется значение `openclaw.install.minHostVersion`).

  </Step>

  <Step title="Регистрация провайдера">
    Минимальному текстовому провайдеру необходимы `id`, `label`, `auth` и `catalog`. `catalog` — принадлежащий провайдеру обработчик среды выполнения и конфигурации; он может обращаться к API поставщика в реальном времени и возвращает записи `models.providers`.

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

    `registerModelCatalogProvider` — это более новый интерфейс каталога плоскости управления для списков, справки и интерфейса выбора, охватывающий строки `text`, `voice`, `image_generation`, `video_generation` и `music_generation`. Вызовы конечных точек поставщика и преобразование ответов должны оставаться в плагине; OpenClaw отвечает за общую структуру строк, метки источников и отображение справки.

    Это уже рабочий провайдер. Теперь пользователи могут выполнить `openclaw onboard --acme-ai-api-key <key>` и выбрать `acme-ai/acme-large` в качестве модели.

    ### Обнаружение моделей в реальном времени

    Если ваш провайдер предоставляет API в стиле `/models`, оставьте специфичные для провайдера конечную точку и преобразование строк в своём плагине, а для общего жизненного цикла получения данных используйте `openclaw/plugin-sdk/provider-catalog-live-runtime`. Эта вспомогательная функция предоставляет защищённые HTTP-запросы, заголовки аутентификации провайдера, структурированные HTTP-ошибки, кэширование с TTL и статическое резервное поведение без переноса политики провайдера в ядро OpenClaw.

    Используйте `buildLiveModelProviderConfig`, когда API в реальном времени сообщает только о том, какие принадлежащие провайдеру строки статического каталога доступны в данный момент:

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

    Используйте `getCachedLiveProviderModelRows`, когда API провайдера возвращает более подробные метаданные и плагину необходимо самостоятельно преобразовать строки в определения моделей OpenClaw:

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

    `run` должен оставаться защищённым проверкой аутентификации и возвращать `null`, если доступные для использования учётные данные отсутствуют. Сохраните автономный `staticRun` или статический резервный вариант, чтобы настройка, документация, тесты и интерфейсы выбора не зависели от доступа к сети в реальном времени. Используйте TTL, подходящий для требуемой актуальности списка моделей, избегайте опроса файловой системы при обработке запросов и передавайте специфичные для провайдера `readRows` / `readModelId` только в том случае, если ответ вышестоящего сервиса не соответствует совместимой с OpenAI структуре `{ data: [{ id, object }] }`.

    Если вышестоящий провайдер использует управляющие токены, отличные от токенов OpenClaw, добавьте небольшое двунаправленное преобразование текста вместо замены пути потоковой передачи:

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

    `input` преобразует итоговую системную подсказку и текстовое содержимое сообщения перед передачей. `output` преобразует текстовые дельты ассистента и итоговый текст до того, как OpenClaw разберёт собственные управляющие маркеры или выполнит доставку в канал.

    Для встроенных провайдеров, которые регистрируют только одного текстового провайдера с аутентификацией по API-ключу и единственной средой выполнения на основе каталога, предпочтительнее использовать более узкую вспомогательную функцию `defineSingleProviderPluginEntry(...)`:

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

    `buildProvider` — это путь к актуальному каталогу, используемый, когда OpenClaw может определить действительные
    данные аутентификации провайдера. Он может выполнять обнаружение с учётом особенностей провайдера. Используйте
    `buildStaticProvider` только для автономных записей, которые можно безопасно показывать до настройки
    аутентификации; он не должен требовать учётных данных или выполнять сетевые запросы.
    Сейчас команда OpenClaw `models list --all` обрабатывает статические каталоги
    только для встроенных плагинов провайдеров, с пустой конфигурацией, пустым окружением и без
    путей агента или рабочего пространства.

    Если вашему процессу аутентификации также требуется изменять `models.providers.*`, псевдонимы и
    модель агента по умолчанию во время первоначальной настройки, используйте вспомогательные функции предустановок из
    `openclaw/plugin-sdk/provider-onboard`. Наиболее узкоспециализированные функции:
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` и
    `createModelCatalogPresetAppliers(...)`.

    Если собственная конечная точка провайдера поддерживает потоковые блоки статистики использования через
    обычный транспорт `openai-completions`, отдавайте предпочтение общим вспомогательным функциям каталога из
    `openclaw/plugin-sdk/provider-catalog-shared`, а не жёстко заданным
    проверкам идентификатора провайдера. `supportsNativeStreamingUsageCompat(...)` и
    `applyProviderNativeStreamingUsageCompat(...)` определяют поддержку по
    карте возможностей конечной точки, поэтому собственные конечные точки в стиле Moonshot/DashScope по-прежнему
    включают эту возможность, даже если плагин использует пользовательский идентификатор провайдера.

    Приведённые выше примеры оперативного обнаружения охватывают API провайдеров в стиле `/models`. Оставляйте
    такое обнаружение внутри `catalog.run`, выполняйте его только при наличии пригодных данных аутентификации, а
    `staticRun` оставляйте без сетевых запросов для автономного создания каталога.

  </Step>

  <Step title="Add dynamic model resolution">
    Если ваш провайдер принимает произвольные идентификаторы моделей (например, прокси или маршрутизатор),
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

    Если для разрешения требуется сетевой вызов, используйте `prepareDynamicModel` для асинхронной
    предварительной подготовки — после её завершения `resolveDynamicModel` выполняется снова.

  </Step>

  <Step title="Add runtime hooks (as needed)">
    Большинству провайдеров нужны только `catalog` и `resolveDynamicModel`. Добавляйте хуки
    постепенно, по мере необходимости для вашего провайдера.

    Общие конструкторы вспомогательных функций теперь охватывают наиболее распространённые семейства
    совместимости воспроизведения и инструментов, поэтому плагинам обычно не требуется подключать каждый хук вручную:

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

    Доступные сейчас семейства воспроизведения:

    | Семейство | Что подключает | Встроенные примеры |
    | --- | --- | --- |
    | `openai-compatible` | Общая политика воспроизведения в стиле OpenAI для транспортов, совместимых с OpenAI, включая очистку идентификаторов вызовов инструментов, исправление порядка с первым сообщением ассистента и общую проверку реплик Gemini там, где она требуется транспорту | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Политика воспроизведения с учётом Claude, выбираемая по `modelId`, благодаря чему транспорты сообщений Anthropic получают очистку блоков рассуждений, специфичную для Claude, только когда разрешённая модель действительно имеет идентификатор Claude | `amazon-bedrock` |
    | `native-anthropic-by-model` | Та же политика Claude по модели, что и в `anthropic-by-model`, а также очистка идентификаторов вызовов инструментов и сохранение собственных идентификаторов использования инструментов Anthropic для транспортов, которым необходимо сохранять собственные идентификаторы поставщика | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | Собственная политика воспроизведения Gemini и очистка начального воспроизведения. Общее семейство оставляет текстовый вывод Gemini CLI с размеченными рассуждениями; непосредственный провайдер `google` переопределяет `resolveReasoningOutputMode` значением `native`, поскольку рассуждения Gemini API поступают как собственные части мыслей. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Очистка сигнатур мыслей Gemini для моделей Gemini, работающих через прокси-транспорты, совместимые с OpenAI; не включает собственную проверку воспроизведения Gemini или перезапись начальных данных | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Гибридная политика для провайдеров, объединяющих поверхности моделей сообщений Anthropic и совместимых с OpenAI в одном плагине; необязательное удаление блоков рассуждений только для Claude остаётся ограниченным стороной Anthropic | `minimax` |

    Доступные сейчас семейства потоковой передачи:

    | Семейство | Что подключает | Встроенные примеры |
    | --- | --- | --- |
    | `google-thinking` | Нормализация полезной нагрузки рассуждений Gemini в общем потоковом пути | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Обёртка рассуждений Kilo в общем потоковом пути прокси; для `kilo/auto` и неподдерживаемых идентификаторов рассуждений прокси внедрение рассуждений пропускается | `kilocode` |
    | `moonshot-thinking` | Сопоставление двоичной собственной полезной нагрузки рассуждений Moonshot на основе конфигурации и уровня `/think` | `moonshot` |
    | `minimax-fast-mode` | Перезапись модели быстрого режима MiniMax в общем потоковом пути | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Общие собственные обёртки OpenAI/Codex Responses: заголовки атрибуции, `/fast`/`serviceTier`, детализация текста, собственный веб-поиск Codex, формирование полезной нагрузки для совместимости рассуждений и управление контекстом Responses | `openai` |
    | `openrouter-thinking` | Обёртка рассуждений OpenRouter для прокси-маршрутов с централизованной обработкой пропусков для неподдерживаемых моделей и `auto` | `openrouter` |
    | `tool-stream-default-on` | Обёртка `tool_stream`, включённая по умолчанию, для провайдеров вроде Z.AI, которым нужна потоковая передача инструментов, если она явно не отключена | `zai` |

    <Accordion title="SDK seams powering the family builders">
      Каждый конструктор семейства состоит из низкоуровневых публичных вспомогательных функций, экспортируемых из того же пакета; их можно использовать, когда провайдеру требуется отклониться от общего шаблона:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` и базовые конструкторы воспроизведения (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Также экспортирует вспомогательные функции воспроизведения Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) и вспомогательные функции конечных точек и моделей (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, а также общие обёртки OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), совместимая с OpenAI обёртка DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), очистка предварительного заполнения рассуждений Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), совместимость вызовов инструментов в виде обычного текста (`createPlainTextToolCallCompatWrapper`) и общие обёртки прокси и провайдеров (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` — облегчённые обёртки полезной нагрузки и событий для горячих путей провайдеров, включая `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` и `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` и базовые вспомогательные функции схем провайдеров.

      Для провайдеров семейства Gemini согласуйте режим вывода рассуждений
      с транспортом. Провайдеры, напрямую использующие Google Gemini API, должны применять режим вывода рассуждений `native`,
      чтобы OpenClaw обрабатывал собственные части мыслей без добавления
      директив `<think>` / `<final>` в подсказку. Текстовые серверные системы
      в стиле Gemini CLI, разбирающие итоговый ответ JSON или текст, могут сохранять общий
      размеченный контракт `google-gemini`.

      Некоторые потоковые вспомогательные функции намеренно остаются локальными для провайдера. `@openclaw/anthropic-provider` сохраняет `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` и низкоуровневые конструкторы обёрток Anthropic в собственном публичном интерфейсе `api.ts` / `contract-api.ts`, поскольку они реализуют обработку бета-функций OAuth Claude и ограничение `context1m`. Аналогичным образом плагин xAI сохраняет формирование собственных ответов xAI Responses в своём `wrapStreamFn` (псевдонимы `/fast`, значение `tool_stream` по умолчанию, очистка неподдерживаемых строгих инструментов, удаление полезной нагрузки рассуждений с учётом особенностей xAI).

      Тот же шаблон корневого пакета также лежит в основе `@openclaw/openai-provider` (конструкторы провайдеров, вспомогательные функции модели по умолчанию, конструкторы провайдеров реального времени) и `@openclaw/openrouter-provider` (конструктор провайдера и вспомогательные функции первоначальной настройки и конфигурации).
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        Для провайдеров, которым требуется обмен токена перед каждым вызовом логического вывода:

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
        Для провайдеров, которым требуются пользовательские заголовки запросов или изменения тела:

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
        Для провайдеров, которым требуются собственные заголовки запросов или сеансов либо метаданные в
        универсальных транспортах HTTP или WebSocket:

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
      <Tab title="Использование и оплата">
        Для провайдеров, предоставляющих данные об использовании и оплате:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` имеет три возможных результата. Верните
        `{ token, accountId?, subscriptionType?, rateLimitTier? }`, когда у
        провайдера есть учетные данные для получения сведений об использовании
        и оплате (необязательные поля передают несекретные метаданные плана из
        разрешенного профиля в `fetchUsageSnapshot`). Возвращайте
        `{ handled: true }` только тогда, когда провайдер окончательно обработал
        аутентификацию для получения данных об использовании, но не имеет
        пригодного токена, а OpenClaw должен пропустить стандартный резервный
        механизм с ключом API или OAuth. Верните `null` или `undefined`, если
        провайдер не обработал запрос и OpenClaw должен продолжить использовать
        стандартный резервный механизм.

        Объявите идентификатор провайдера в `contracts.usageProviders`. Когда
        присутствуют этот контракт манифеста и **оба** обработчика, OpenClaw
        автоматически включает провайдера в сбор данных об использовании, не
        загружая несвязанные Plugin провайдеров. Обновлять основной список
        разрешенных провайдеров не требуется.
        `fetchUsageSnapshot` возвращает общую, нейтральную к провайдеру структуру:

        - `plan`: указанная провайдером подписка или метка ключа
        - `windows`: сбрасываемые окна квот в процентах использования
        - `billing`: типизированные записи `balance`, `spend` или `budget`;
          `unit` может быть валютой ISO или единицей провайдера, например `credits`
        - `summary`: краткий контекст, специфичный для провайдера и не
          помещающийся в эти структурированные поля

        Точно сохраняйте семантику валют. Кредит провайдера не является долларом
        США, если это прямо не указано в вышестоящем контракте. Plugin,
        реализующий только `fetchUsageSnapshot`, остается доступным для явных
        или синтетических вызывающих сторон, но не обнаруживается автоматически,
        поскольку OpenClaw не может разрешить его учетные данные для получения
        сведений об использовании.
      </Tab>
    </Tabs>

    <Accordion title="Общие обработчики провайдера">
      OpenClaw вызывает обработчики Plugin моделей и провайдеров примерно в
      следующем порядке. Большинство провайдеров используют только 2–3 из них.
      Это не полный контракт `ProviderPlugin` — полный и актуальный список
      обработчиков и примечания о резервных механизмах см. в разделе
      [Внутреннее устройство: обработчики среды выполнения
      провайдера](/ru/plugins/architecture-internals#provider-runtime-hooks).
      Поля провайдера, предназначенные только для совместимости и больше не
      вызываемые OpenClaw, такие как `ProviderPlugin.capabilities` и
      `suppressBuiltInModel`, здесь не перечислены.

      | Обработчик | Когда использовать |
      | --- | --- |
      | `catalog` | Каталог моделей или значения базового URL по умолчанию |
      | `applyConfigDefaults` | Принадлежащие провайдеру глобальные значения по умолчанию при материализации конфигурации |
      | `normalizeModelId` | Очистка устаревших или предварительных псевдонимов идентификаторов моделей перед поиском |
      | `normalizeTransport` | Очистка `api` / `baseUrl` семейства провайдера перед стандартной сборкой модели |
      | `normalizeConfig` | Нормализация конфигурации `models.providers.<id>` |
      | `applyNativeStreamingUsageCompat` | Преобразования совместимости нативного потокового учета использования для провайдеров конфигурации |
      | `resolveConfigApiKey` | Разрешение аутентификации по маркеру переменной окружения, принадлежащее провайдеру |
      | `resolveSyntheticAuth` | Синтетическая аутентификация для локальных, самостоятельно размещенных или основанных на конфигурации систем |
      | `resolveExternalAuthProfiles` | Наложение принадлежащих провайдеру внешних профилей аутентификации для учетных данных, управляемых CLI или приложением |
      | `shouldDeferSyntheticProfileAuth` | Понижение приоритета синтетических заполнителей сохраненного профиля относительно аутентификации из окружения или конфигурации |
      | `resolveDynamicModel` | Прием произвольных идентификаторов моделей вышестоящего сервиса |
      | `prepareDynamicModel` | Асинхронное получение метаданных перед разрешением |
      | `normalizeResolvedModel` | Преобразования транспорта перед запуском |
      | `normalizeToolSchemas` | Очистка схем инструментов, принадлежащая провайдеру, перед регистрацией |
      | `inspectToolSchemas` | Диагностика схем инструментов, принадлежащая провайдеру |
      | `resolveReasoningOutputMode` | Контракт вывода рассуждений: с тегами или нативный |
      | `prepareExtraParams` | Параметры запроса по умолчанию |
      | `createStreamFn` | Полностью пользовательский транспорт StreamFn |
      | `wrapStreamFn` | Пользовательские обертки заголовков или тела в стандартном потоковом пути |
      | `resolveTransportTurnState` | Нативные заголовки и метаданные для каждого хода |
      | `resolveWebSocketSessionPolicy` | Нативные заголовки и период ожидания сеанса WS |
      | `formatApiKey` | Пользовательская структура токена среды выполнения |
      | `refreshOAuth` | Пользовательское обновление OAuth |
      | `buildAuthDoctorHint` | Рекомендации по исправлению аутентификации |
      | `matchesContextOverflowError` | Определение переполнения, принадлежащее провайдеру |
      | `classifyFailoverReason` | Классификация ограничения частоты или перегрузки, принадлежащая провайдеру |
      | `isCacheTtlEligible` | Условие применения TTL кэша промптов |
      | `buildMissingAuthMessage` | Пользовательская подсказка об отсутствующей аутентификации |
      | `augmentModelCatalog` | Синтетические строки для прямой совместимости (устарело — предпочитайте `registerModelCatalogProvider`) |
      | `resolveThinkingProfile` | Набор параметров `/think` для конкретной модели |
      | `isBinaryThinking` | Совместимость бинарного включения или отключения мышления (устарело — предпочитайте `resolveThinkingProfile`) |
      | `supportsXHighThinking` | Совместимость поддержки рассуждений `xhigh` (устарело — предпочитайте `resolveThinkingProfile`) |
      | `resolveDefaultThinkingLevel` | Совместимость политики `/think` по умолчанию (устарело — предпочитайте `resolveThinkingProfile`) |
      | `isModernModelRef` | Сопоставление моделей для рабочего или дымового тестирования |
      | `prepareRuntimeAuth` | Обмен токена перед логическим выводом |
      | `resolveUsageAuth` | Пользовательский разбор учетных данных для получения сведений об использовании |
      | `fetchUsageSnapshot` | Пользовательская конечная точка получения сведений об использовании |
      | `createEmbeddingProvider` | Принадлежащий провайдеру адаптер векторных представлений для памяти или поиска |
      | `buildReplayPolicy` | Пользовательская политика повторного воспроизведения или Compaction истории сообщений |
      | `sanitizeReplayHistory` | Специфичные для провайдера преобразования повторного воспроизведения после стандартной очистки |
      | `validateReplayTurns` | Строгая проверка ходов повторного воспроизведения перед встроенным средством запуска |
      | `onModelSelected` | Обратный вызов после выбора, например для телеметрии |

      Примечания о резервных механизмах среды выполнения:

      - `normalizeConfig` определяет один владеющий Plugin для каждого
        идентификатора провайдера (сначала встроенные провайдеры, затем
        соответствующий Plugin среды выполнения) и вызывает только этот
        обработчик — сканирование других провайдеров не выполняется. Собственный
        обработчик Google `normalizeConfig` нормализует записи конфигурации
        `google` / `google-vertex` / `google-antigravity`; это не отдельный
        резервный механизм ядра.
      - `resolveConfigApiKey` использует обработчик провайдера, если он
        предоставлен. Amazon Bedrock сохраняет разрешение маркеров переменных
        окружения AWS в своем Plugin провайдера; сама аутентификация среды
        выполнения по-прежнему использует стандартную цепочку AWS SDK при
        настройке `auth: "aws-sdk"`.
      - `resolveThinkingProfile(ctx)` получает выбранные `provider`, `modelId`,
        необязательную объединенную подсказку каталога `reasoning` и
        необязательные объединенные факты совместимости модели `compat`.
        Используйте `compat` только для выбора интерфейса или профиля мышления
        провайдера.
      - `resolveSystemPromptContribution` позволяет провайдеру внедрять
        учитывающие кэш рекомендации системного промпта для семейства моделей.
        Предпочитайте его устаревшему общему для всего Plugin обработчику
        `before_prompt_build`, если поведение относится к одному провайдеру или
        семейству моделей и должно сохранять разделение стабильного и
        динамического кэша.

    </Accordion>

  </Step>

  <Step title="Добавление дополнительных возможностей (необязательно)">
    ### Шаг 5. Добавление дополнительных возможностей

    Plugin провайдера может регистрировать векторные представления, синтез речи,
    транскрибирование в реальном времени, голосовую связь в реальном времени,
    распознавание мультимедиа, генерацию изображений, генерацию видео, получение
    веб-страниц и веб-поиск наряду с текстовым логическим выводом. OpenClaw
    классифицирует его как Plugin с **гибридными возможностями** — это
    рекомендуемый шаблон для Plugin компаний (один Plugin на поставщика).
    См. раздел
    [Внутреннее устройство: владение возможностями](/ru/plugins/architecture#capability-ownership-model).

    Зарегистрируйте каждую возможность внутри `register(api)` рядом с
    существующим вызовом `api.registerProvider(...)`. Выберите только нужные
    вкладки:

    <Tabs>
      <Tab title="Речь (TTS)">
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

        Используйте `assertOkOrThrowProviderError(...)` при ошибках HTTP
        провайдера, чтобы Plugin совместно применяли ограниченное чтение тела
        ошибки, разбор ошибок JSON и суффиксы идентификаторов запросов.
      </Tab>
      <Tab title="Транскрибирование в реальном времени">
        Предпочитайте `createRealtimeTranscriptionWebSocketSession(...)` —
        общий вспомогательный компонент обрабатывает перехват прокси,
        экспоненциальную задержку повторного подключения, завершение при
        закрытии, подтверждение готовности, постановку аудио в очередь и
        диагностику событий закрытия. Ваш Plugin только сопоставляет события
        вышестоящего сервиса.

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

        Пакетные провайдеры STT, отправляющие аудио через POST в формате multipart, должны использовать
        `buildAudioTranscriptionFormData(...)` из
        `openclaw/plugin-sdk/provider-http`. Эта вспомогательная функция нормализует имена
        загружаемых файлов, включая файлы AAC, которым для совместимых API
        транскрибирования требуется имя файла в стиле M4A.
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

        Объявите `capabilities`, чтобы `talk.catalog` мог предоставлять допустимые режимы,
        транспорты, аудиоформаты и флаги возможностей браузерным и нативным клиентам
        Talk. Реализуйте `handleBargeIn`, если транспорт способен определить, что
        человек прерывает воспроизведение ответа ассистента, а провайдер поддерживает
        усечение или очистку активного аудиоответа.
        `submitToolResult` может возвращать `void` при синхронной отправке или
        `Promise<void>` как границу асинхронного завершения, которую может предоставить
        мост провайдера. Сеансы ретрансляции Gateway ожидают выполнения этого промиса,
        прежде чем подтверждать окончательный результат или очищать связанный запуск;
        отклоняйте его при сбое отправки.
        Установите `supportsToolResultSuppression: false`, если провайдер не может
        учитывать `options.suppressResponse`. Тогда OpenClaw не использует подавление
        для внутренних результатов принудительной консультации и отмены, а прямые
        запросы подавленных результатов отклоняет вместо неявного запуска ответа.
        Потребители `createRealtimeVoiceBridgeSession` также могут возвращать промис
        из `onToolCall`; синхронные исключения и отклонения направляются в обратный
        вызов сеанса `onError`.
        Устанавливайте `handlesInputAudioBargeIn` только тогда, когда VAD провайдера
        подтверждает прерывание вызовом `onClearAudio("barge-in")`. Для провайдеров,
        не задающих этот флаг, OpenClaw использует локальное резервное обнаружение
        прерывания по входящему аудио.
      </Tab>
      <Tab title="Media understanding">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```

        Локальные или самостоятельно размещённые медиапровайдеры, которым намеренно
        не требуются учётные данные, могут предоставлять `resolveAuth` и возвращать
        `kind: "none"`.
        OpenClaw по-прежнему сохраняет обычную проверку аутентификации для провайдеров,
        которые явно не включили такой режим. Существующие провайдеры могут продолжать
        читать `req.apiKey`; новым провайдерам следует предпочитать `req.auth`.

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

        Объявите тот же идентификатор в `contracts.embeddingProviders`. Это общий
        контракт векторных представлений для многократно используемой генерации
        векторов, включая поиск по памяти. `registerMemoryEmbeddingProvider(...)` —
        устаревший механизм совместимости для существующих адаптеров, предназначенных
        специально для памяти.
      </Tab>
      <Tab title="Image and video generation">
        Возможности генерации изображений и видео используют структуру,
        **учитывающую режим**. Провайдеры изображений объявляют обязательные блоки
        возможностей `generate` и `edit`; провайдеры видео объявляют `generate`,
        `imageToVideo` и `videoToVideo`. Плоских агрегированных полей вроде
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` недостаточно,
        чтобы корректно заявить поддержку режимов преобразования или отключённые
        режимы. Генерация музыки следует той же схеме `generate` / `edit`.

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

        `capabilities` обязателен для обоих типов провайдеров; для `edit` и блоков
        преобразования видео (`imageToVideo`, `videoToVideo`) всегда требуется
        явный флаг `enabled`.

        Используйте `catalogByModel`, если статические режимы или возможности
        указанной модели отличаются от значений провайдера по умолчанию. Эти
        метаданные обеспечивают точность `video_generate action=list` и каталогов
        моделей без вызова кода провайдера. Получение и проверка возможностей во
        время запроса по-прежнему должны выполняться в `resolveModelCapabilities`
        и `generateVideo`; по возможности используйте одну и ту же константу
        возможностей для обоих путей.
      </Tab>
      <Tab title="Web fetch and search">
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

        Оба типа провайдеров используют одинаковую структуру подключения учётных
        данных: все поля `hint`, `envVars`, `placeholder`, `signupUrl`,
        `credentialPath`, `getCredentialValue`, `setCredentialValue` и `createTool`
        обязательны.
      </Tab>
    </Tabs>

  </Step>

  <Step title="Test">
    ### Шаг 6. Тестирование

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

Плагины провайдеров публикуются так же, как и любые другие внешние плагины с кодом:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

`clawhub skill publish <path>` — это другая команда, предназначенная для публикации
папки Skills, а не пакета плагина; не используйте её здесь.

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

## Справочник по порядку каталогов

`catalog.order` определяет, когда ваш каталог объединяется относительно встроенных
провайдеров:

| Порядок  | Когда               | Вариант использования                                      |
| -------- | ------------------- | ---------------------------------------------------------- |
| `simple` | Первый проход       | Провайдеры с обычным API-ключом                            |
| `profile` | После `simple`     | Провайдеры, доступные только с профилями аутентификации     |
| `paired` | После `profile`     | Формирование нескольких связанных записей                  |
| `late`   | Последний проход    | Переопределение существующих провайдеров (при коллизии имеет приоритет) |

## Дальнейшие шаги

- [Плагины каналов](/ru/plugins/sdk-channel-plugins) — если ваш плагин также предоставляет канал
- [Среда выполнения SDK](/ru/plugins/sdk-runtime) — вспомогательные функции `api.runtime` (TTS, поиск, субагент)
- [Обзор SDK](/ru/plugins/sdk-overview) — полный справочник по импорту подпутей
- [Внутреннее устройство плагинов](/ru/plugins/architecture-internals#provider-runtime-hooks) — сведения о хуках и встроенные примеры

## Связанные материалы

- [Настройка Plugin SDK](/ru/plugins/sdk-setup)
- [Создание плагинов](/ru/plugins/building-plugins)
- [Создание плагинов каналов](/ru/plugins/sdk-channel-plugins)
