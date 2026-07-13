---
read_when:
    - Вы создаёте новый плагин поставщика моделей
    - Вы хотите добавить в OpenClaw прокси-сервер, совместимый с OpenAI, или пользовательскую LLM
    - Вам необходимо понимать аутентификацию провайдеров, каталоги и хуки среды выполнения
sidebarTitle: Provider plugins
summary: Пошаговое руководство по созданию плагина поставщика моделей для OpenClaw
title: Создание плагинов провайдеров
x-i18n:
    generated_at: "2026-07-13T18:26:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: ebbe59b4487a93c6fec3624251eff7394197e249bb8fc7899f1fc88162510d1c
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Создайте плагин провайдера, чтобы добавить провайдера моделей (LLM) в OpenClaw: каталог
моделей, аутентификацию по API-ключу и динамическое разрешение моделей.

<Info>
  Впервые работаете с плагинами OpenClaw? Сначала прочитайте [Начало работы](/ru/plugins/building-plugins),
  чтобы узнать о структуре пакета и настройке манифеста.
</Info>

<Tip>
  Плагины провайдеров добавляют модели в стандартный цикл инференса OpenClaw. Если
  модель должна запускаться через нативный демон агента, который управляет потоками, Compaction
  или событиями инструментов, объедините провайдер с [обвязкой
  агента](/ru/plugins/sdk-agent-harness), а не помещайте детали протокола демона
  в ядро.
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

    `setup.providers[].envVars` позволяет OpenClaw обнаруживать учетные данные без
    загрузки среды выполнения вашего плагина. Добавьте `providerAuthAliases`, когда вариант
    провайдера должен повторно использовать аутентификацию идентификатора другого провайдера. `modelSupport`
    необязателен и позволяет OpenClaw автоматически загружать ваш плагин провайдера по сокращенным
    идентификаторам моделей, таким как `acme-large`, до появления обработчиков среды выполнения. `openclaw.compat`
    и `openclaw.build` в `package.json` обязательны для публикации в ClawHub
    (`openclaw.compat.pluginApi` и `openclaw.build.openclawVersion` —
    два обязательных поля; при отсутствии `minGatewayVersion` используется
    `openclaw.install.minHostVersion`).

  </Step>

  <Step title="Регистрация провайдера">
    Минимальному текстовому провайдеру требуются `id`, `label`, `auth` и `catalog`.
    `catalog` — принадлежащий провайдеру обработчик среды выполнения и конфигурации; он может вызывать действующие
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

    `registerModelCatalogProvider` — новый интерфейс каталога плоскости управления
    для пользовательского интерфейса списков, справки и выбора, охватывающий строки `text`, `voice`, `image_generation`,
    `video_generation` и `music_generation`. Оставляйте вызовы конечных точек
    поставщика и преобразование ответов в плагине; OpenClaw отвечает за общую форму
    строк, метки источников и отображение справки.

    Теперь провайдер готов к работе. Пользователи могут выполнить
    `openclaw onboard --acme-ai-api-key <key>` и выбрать
    `acme-ai/acme-large` в качестве модели.

    ### Динамическое обнаружение моделей

    Если ваш провайдер предоставляет API в стиле `/models`, оставьте специфичные для провайдера
    конечную точку и преобразование строк в своем плагине и используйте
    `openclaw/plugin-sdk/provider-catalog-live-runtime` для общего жизненного
    цикла получения данных. Вспомогательная функция предоставляет защищенные HTTP-запросы, заголовки аутентификации провайдера,
    структурированные HTTP-ошибки, кэширование с TTL и статическое резервное поведение,
    не помещая политику провайдера в ядро OpenClaw.

    Используйте `buildLiveModelProviderConfig`, когда динамический API сообщает только о том,
    какие принадлежащие провайдеру строки статического каталога доступны в данный момент:

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

    Используйте `getCachedLiveProviderModelRows`, когда API провайдера возвращает более подробные
    метаданные и плагину необходимо самостоятельно преобразовывать строки в определения
    моделей OpenClaw:

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

    `run` должен оставаться защищенным аутентификацией и возвращать `null`, если
    подходящие учетные данные недоступны. Предоставьте автономный `staticRun` или статический резервный вариант, чтобы настройка, документация,
    тесты и интерфейсы выбора не зависели от доступа к сети. Используйте TTL,
    соответствующий требованиям к актуальности списка моделей, избегайте опроса файловой системы во время обработки запросов
    и передавайте специфичные для провайдера `readRows` / `readModelId` только тогда, когда
    ответ вышестоящего сервиса не соответствует совместимой с OpenAI структуре `{ data: [{ id, object }] }`.

    Если вышестоящий провайдер использует управляющие токены, отличные от OpenClaw, добавьте
    небольшое двунаправленное преобразование текста вместо замены потокового пути:

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

    `input` преобразует итоговую системную инструкцию и текстовое содержимое сообщений перед
    передачей. `output` преобразует фрагменты текста ассистента и итоговый текст до того, как
    OpenClaw обработает собственные управляющие маркеры или доставку в канал.

    Для встроенных провайдеров, которые регистрируют только один текстовый провайдер с аутентификацией
    по API-ключу и единственной средой выполнения на основе каталога, предпочтительнее использовать более узкую
    вспомогательную функцию `defineSingleProviderPluginEntry(...)`:

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

    `buildProvider` — это путь к актуальному каталогу, используемый, когда OpenClaw может определить реальные
    данные аутентификации провайдера. Он может выполнять обнаружение с учётом особенностей провайдера. Используйте
    `buildStaticProvider` только для офлайн-записей, которые можно безопасно показывать до настройки
    аутентификации; он не должен требовать учётных данных или выполнять сетевые запросы.
    В настоящее время представление `models list --all` в OpenClaw обрабатывает статические каталоги
    только для встроенных плагинов провайдеров, с пустой конфигурацией, пустым окружением и без
    путей агента или рабочего пространства.

    Если вашему процессу аутентификации также требуется изменять `models.providers.*`, псевдонимы и
    модель агента по умолчанию во время первоначальной настройки, используйте вспомогательные функции предустановок из
    `openclaw/plugin-sdk/provider-onboard`. Наиболее узкие вспомогательные функции:
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` и
    `createModelCatalogPresetAppliers(...)`.

    Если нативная конечная точка провайдера поддерживает потоковые блоки использования при
    обычном транспорте `openai-completions`, предпочитайте общие вспомогательные функции каталога из
    `openclaw/plugin-sdk/provider-catalog-shared` вместо жёстко заданных
    проверок идентификатора провайдера. `supportsNativeStreamingUsageCompat(...)` и
    `applyProviderNativeStreamingUsageCompat(...)` определяют поддержку по
    карте возможностей конечной точки, поэтому нативные конечные точки в стиле Moonshot/DashScope по-прежнему
    могут включить эту возможность, даже если плагин использует пользовательский идентификатор провайдера.

    Приведённые выше примеры динамического обнаружения охватывают API провайдеров в стиле `/models`. Выполняйте
    такое обнаружение внутри `catalog.run` только при наличии пригодных данных аутентификации, а
    `staticRun` оставляйте без сетевых операций для автономного формирования каталога.

  </Step>

  <Step title="Добавьте динамическое разрешение моделей">
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

    Если для разрешения требуется сетевой вызов, используйте `prepareDynamicModel` для асинхронного
    предварительного прогрева — `resolveDynamicModel` будет запущена снова после его завершения.

  </Step>

  <Step title="Добавьте хуки среды выполнения (при необходимости)">
    Большинству провайдеров требуются только `catalog` и `resolveDynamicModel`. Добавляйте хуки
    постепенно, по мере возникновения требований у вашего провайдера.

    Общие конструкторы вспомогательных функций теперь охватывают самые распространённые семейства
    совместимости воспроизведения и инструментов, поэтому плагинам обычно не требуется вручную подключать каждый хук по отдельности:

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

    Доступные на сегодняшний день семейства воспроизведения:

    | Семейство | Что оно подключает | Встроенные примеры |
    | --- | --- | --- |
    | `openai-compatible` | Общая политика воспроизведения в стиле OpenAI для транспортов, совместимых с OpenAI, включая очистку идентификаторов вызовов инструментов, исправление порядка с первым сообщением ассистента и общую проверку реплик Gemini там, где она необходима транспорту | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Политика воспроизведения с учётом Claude, выбираемая через `modelId`, благодаря чему транспорты сообщений Anthropic получают очистку блоков рассуждения, специфичную для Claude, только когда разрешённая модель действительно имеет идентификатор Claude | `amazon-bedrock` |
    | `native-anthropic-by-model` | Та же политика Claude по модели, что и `anthropic-by-model`, а также очистка идентификаторов вызовов инструментов и сохранение нативных идентификаторов использования инструментов Anthropic для транспортов, которым необходимо сохранять нативные идентификаторы поставщика | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | Политика нативного воспроизведения Gemini вместе с очисткой начального воспроизведения. Общее семейство сохраняет для Gemini CLI с текстовым выводом рассуждения с тегами; прямой провайдер `google` переопределяет `resolveReasoningOutputMode` на `native`, поскольку рассуждения Gemini API поступают как нативные части мыслей. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Очистка сигнатур мыслей Gemini для моделей Gemini, работающих через прокси-транспорты, совместимые с OpenAI; не включает нативную проверку воспроизведения Gemini или перезапись начальной загрузки | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Гибридная политика для провайдеров, которые объединяют поверхности моделей сообщений Anthropic и OpenAI-совместимых моделей в одном плагине; необязательное удаление блоков рассуждения только для Claude остаётся ограничено стороной Anthropic | `minimax` |

    Доступные на сегодняшний день семейства потоковой передачи:

    | Семейство | Что оно подключает | Встроенные примеры |
    | --- | --- | --- |
    | `google-thinking` | Нормализация полезной нагрузки рассуждений Gemini в общем потоковом пути | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Обёртка рассуждений Kilo в общем потоковом пути прокси, при этом `kilo/auto` и неподдерживаемые прокси-идентификаторы рассуждений пропускают внедрение рассуждений | `kilocode` |
    | `moonshot-thinking` | Сопоставление бинарной нативной полезной нагрузки рассуждений Moonshot из конфигурации и уровня `/think` | `moonshot` |
    | `minimax-fast-mode` | Перезапись модели быстрого режима MiniMax в общем потоковом пути | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Общие нативные обёртки OpenAI/Codex Responses: заголовки атрибуции, `/fast`/`serviceTier`, детализация текста, нативный веб-поиск Codex, формирование полезной нагрузки для совместимости рассуждений и управление контекстом Responses | `openai` |
    | `openrouter-thinking` | Обёртка рассуждений OpenRouter для прокси-маршрутов с централизованной обработкой пропусков для неподдерживаемых моделей/`auto` | `openrouter` |
    | `tool-stream-default-on` | Включённая по умолчанию обёртка `tool_stream` для таких провайдеров, как Z.AI, которым нужна потоковая передача инструментов, если она явно не отключена | `zai` |

    <Accordion title="Точки расширения SDK, обеспечивающие работу конструкторов семейств">
      Каждый конструктор семейства состоит из общедоступных низкоуровневых вспомогательных функций, экспортируемых из того же пакета; их можно использовать, когда провайдеру требуется отклониться от общего шаблона:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` и низкоуровневые конструкторы воспроизведения (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Также экспортирует вспомогательные функции воспроизведения Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) и вспомогательные функции конечных точек и моделей (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, а также общие обёртки OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), OpenAI-совместимая обёртка DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), очистка предварительного заполнения рассуждений Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`), совместимость вызовов инструментов в виде обычного текста (`createPlainTextToolCallCompatWrapper`) и общие обёртки прокси и провайдеров (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` — лёгкие обёртки полезной нагрузки и событий для интенсивно используемых путей провайдеров, включая `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` и `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` и базовые вспомогательные функции схем провайдеров.

      Для провайдеров семейства Gemini согласуйте режим вывода рассуждений с
      транспортом. Провайдеры прямого Google Gemini API должны использовать вывод рассуждений
      `native`, чтобы OpenClaw обрабатывал нативные части мыслей без добавления
      директив запросов `<think>` / `<final>`. Текстовые серверные части в стиле Gemini CLI,
      которые анализируют итоговый ответ в формате JSON или текста, могут сохранять общий
      контракт с тегами `google-gemini`.

      Некоторые потоковые вспомогательные функции намеренно остаются локальными для провайдера. `@openclaw/anthropic-provider` сохраняет `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` и низкоуровневые конструкторы обёрток Anthropic в собственной общедоступной точке расширения `api.ts` / `contract-api.ts`, поскольку они кодируют обработку бета-версии OAuth Claude и ограничение `context1m`. Плагин xAI аналогичным образом сохраняет формирование нативных Responses xAI в собственном `wrapStreamFn` (псевдонимы `/fast`, значение `tool_stream` по умолчанию, очистка неподдерживаемых строгих инструментов, специфичное для xAI удаление полезной нагрузки рассуждений).

      Тот же шаблон корня пакета также лежит в основе `@openclaw/openai-provider` (конструкторы провайдеров, вспомогательные функции модели по умолчанию, конструкторы провайдеров реального времени) и `@openclaw/openrouter-provider` (конструктор провайдера вместе со вспомогательными функциями первоначальной настройки и конфигурации).
    </Accordion>

    <Tabs>
      <Tab title="Обмен токенами">
        Для провайдеров, которым требуется обмен токенами перед каждым вызовом логического вывода:

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
      <Tab title="Пользовательские заголовки">
        Для провайдеров, которым требуются пользовательские заголовки запроса или изменения тела:

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
      <Tab title="Идентификация нативного транспорта">
        Для провайдеров, которым требуются нативные заголовки запроса или сеанса либо метаданные в
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
      <Tab title="Использование и тарификация">
        Для провайдеров, предоставляющих данные об использовании и тарификации:

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
        провайдера есть учётные данные для использования или выставления счетов (необязательные поля передают
        несекретные метаданные плана из разрешённого профиля в
        `fetchUsageSnapshot`). Возвращайте
        `{ handled: true }` только тогда, когда провайдер окончательно обработал аутентификацию
        для получения данных об использовании, но не имеет пригодного токена использования, и OpenClaw должен пропустить типовой
        резервный механизм с API-ключом/OAuth. Верните `null` или `undefined`, когда провайдер
        не обработал запрос и OpenClaw должен продолжить использовать типовой резервный механизм.

        Объявите идентификатор провайдера в `contracts.usageProviders`. Когда этот контракт манифеста
        и **оба** хука присутствуют, OpenClaw автоматически включает
        провайдера в сбор данных об использовании, не загружая несвязанные плагины
        провайдеров. Обновлять список разрешённых провайдеров в ядре не требуется.
        `fetchUsageSnapshot` возвращает общую нейтральную к провайдеру структуру:

        - `plan`: указанная провайдером подписка или метка ключа
        - `windows`: окна квот со сбросом в виде процентов использования
        - `billing`: типизированные записи `balance`, `spend` или `budget`; `unit` может быть
          кодом валюты ISO или единицей провайдера, например `credits`
        - `summary`: компактный контекст конкретного провайдера, который не помещается в эти
          структурированные поля

        Точно сохраняйте семантику валюты. Кредит провайдера не является суммой в USD, если
        это явно не определено вышестоящим контрактом. Плагин, реализующий только
        `fetchUsageSnapshot`, остаётся доступным для явных или синтетических вызывающих компонентов, но
        не обнаруживается автоматически, поскольку OpenClaw не может разрешить его учётные данные для получения данных об использовании.
      </Tab>
    </Tabs>

    <Accordion title="Распространённые хуки провайдеров">
      OpenClaw вызывает хуки плагинов моделей и провайдеров примерно в следующем порядке.
      Большинство провайдеров используют только 2–3 из них. Это не полный контракт `ProviderPlugin` —
      полный актуальный список хуков и примечания о резервных механизмах см. в разделе [Внутреннее устройство: хуки среды выполнения
      провайдера](/ru/plugins/architecture-internals#provider-runtime-hooks).
      Поля провайдера, предназначенные только для совместимости и больше не вызываемые OpenClaw, например
      `ProviderPlugin.capabilities` и `suppressBuiltInModel`, здесь
      не перечислены.

      | Хук | Когда использовать |
      | --- | --- |
      | `catalog` | Каталог моделей или значения базового URL по умолчанию |
      | `applyConfigDefaults` | Глобальные значения по умолчанию, принадлежащие провайдеру, при материализации конфигурации |
      | `normalizeModelId` | Очистка устаревших или предварительных псевдонимов идентификаторов моделей перед поиском |
      | `normalizeTransport` | Очистка `api` / `baseUrl` семейства провайдеров перед типовой сборкой модели |
      | `normalizeConfig` | Нормализация конфигурации `models.providers.<id>` |
      | `applyNativeStreamingUsageCompat` | Преобразования совместимости для нативных данных об использовании при потоковой передаче у провайдеров конфигурации |
      | `resolveConfigApiKey` | Разрешение аутентификации по маркерам переменных окружения, принадлежащее провайдеру |
      | `resolveSyntheticAuth` | Синтетическая аутентификация для локального или самостоятельно размещённого провайдера либо на основе конфигурации |
      | `resolveExternalAuthProfiles` | Наложение внешних профилей аутентификации, принадлежащих провайдеру, для учётных данных, управляемых CLI или приложением |
      | `shouldDeferSyntheticProfileAuth` | Понижение приоритета синтетических заполнителей сохранённых профилей относительно аутентификации через окружение или конфигурацию |
      | `resolveDynamicModel` | Приём произвольных идентификаторов моделей вышестоящего сервиса |
      | `prepareDynamicModel` | Асинхронное получение метаданных перед разрешением |
      | `normalizeResolvedModel` | Преобразования транспорта перед средой выполнения |
      | `normalizeToolSchemas` | Очистка схемы инструментов, принадлежащая провайдеру, перед регистрацией |
      | `inspectToolSchemas` | Диагностика схемы инструментов, принадлежащая провайдеру |
      | `resolveReasoningOutputMode` | Контракт вывода рассуждений с тегами или в нативном формате |
      | `prepareExtraParams` | Параметры запроса по умолчанию |
      | `createStreamFn` | Полностью пользовательский транспорт StreamFn |
      | `wrapStreamFn` | Пользовательские обёртки заголовков или тела на обычном потоковом пути |
      | `resolveTransportTurnState` | Нативные заголовки или метаданные для каждого хода |
      | `resolveWebSocketSessionPolicy` | Заголовки или период ожидания нативного сеанса WS |
      | `formatApiKey` | Пользовательская структура токена среды выполнения |
      | `refreshOAuth` | Пользовательское обновление OAuth |
      | `buildAuthDoctorHint` | Рекомендации по исправлению аутентификации |
      | `matchesContextOverflowError` | Обнаружение переполнения, принадлежащее провайдеру |
      | `classifyFailoverReason` | Классификация ограничения частоты или перегрузки, принадлежащая провайдеру |
      | `isCacheTtlEligible` | Ограничение по TTL кэша промпта |
      | `buildMissingAuthMessage` | Пользовательская подсказка об отсутствии аутентификации |
      | `augmentModelCatalog` | Синтетические строки прямой совместимости (устарело — предпочтительно `registerModelCatalogProvider`) |
      | `resolveThinkingProfile` | Набор параметров `/think` для конкретной модели |
      | `isBinaryThinking` | Совместимость с двоичным включением или отключением режима размышления (устарело — предпочтительно `resolveThinkingProfile`) |
      | `supportsXHighThinking` | Совместимость с поддержкой рассуждений `xhigh` (устарело — предпочтительно `resolveThinkingProfile`) |
      | `resolveDefaultThinkingLevel` | Совместимость с политикой `/think` по умолчанию (устарело — предпочтительно `resolveThinkingProfile`) |
      | `isModernModelRef` | Сопоставление моделей для реальных или дымовых проверок |
      | `prepareRuntimeAuth` | Обмен токена перед выполнением логического вывода |
      | `resolveUsageAuth` | Пользовательский разбор учётных данных для получения данных об использовании |
      | `fetchUsageSnapshot` | Пользовательская конечная точка данных об использовании |
      | `createEmbeddingProvider` | Адаптер векторных представлений для памяти или поиска, принадлежащий провайдеру |
      | `buildReplayPolicy` | Пользовательская политика повторного воспроизведения или Compaction транскрипта |
      | `sanitizeReplayHistory` | Преобразования повторного воспроизведения для конкретного провайдера после типовой очистки |
      | `validateReplayTurns` | Строгая проверка ходов повторного воспроизведения перед встроенной средой выполнения |
      | `onModelSelected` | Обратный вызов после выбора (например, для телеметрии) |

      Примечания о резервных механизмах среды выполнения:

      - `normalizeConfig` разрешает один владеющий плагин для каждого идентификатора провайдера (сначала встроенные провайдеры, затем соответствующий плагин среды выполнения) и вызывает только этот хук — сканирование других провайдеров не выполняется. Собственный хук Google `normalizeConfig` нормализует записи конфигурации `google` / `google-vertex` / `google-antigravity`; это не отдельный резервный механизм ядра.
      - `resolveConfigApiKey` использует хук провайдера, если тот предоставлен. Amazon Bedrock сохраняет разрешение маркеров переменных окружения AWS в своём плагине провайдера; сама аутентификация среды выполнения по-прежнему использует стандартную цепочку AWS SDK при настройке с `auth: "aws-sdk"`.
      - `resolveThinkingProfile(ctx)` получает выбранные `provider`, `modelId`, необязательную объединённую подсказку каталога `reasoning` и необязательные объединённые сведения о модели `compat`. Используйте `compat` только для выбора пользовательского интерфейса или профиля размышления провайдера.
      - `resolveSystemPromptContribution` позволяет провайдеру внедрять учитывающие кэш рекомендации для системного промпта семейства моделей. Предпочитайте его устаревшему общему для всего плагина хуку `before_prompt_build`, когда поведение относится к одному провайдеру или семейству моделей и должно сохранять разделение кэша на стабильную и динамическую части.

    </Accordion>

  </Step>

  <Step title="Добавьте дополнительные возможности (необязательно)">
    ### Шаг 5. Добавьте дополнительные возможности

    Плагин провайдера может регистрировать векторные представления, синтез речи, транскрибирование в реальном времени,
    голосовую связь в реальном времени, анализ мультимедиа, генерацию изображений, генерацию видео,
    получение веб-страниц и веб-поиск наряду с текстовым логическим выводом. OpenClaw классифицирует его как
    плагин с **гибридными возможностями** — это рекомендуемый шаблон для плагинов компаний
    (один плагин на поставщика). См.
    [Внутреннее устройство: владение возможностями](/ru/plugins/architecture#capability-ownership-model).

    Зарегистрируйте каждую возможность внутри `register(api)` рядом с существующим
    вызовом `api.registerProvider(...)`. Выберите только нужные вкладки:

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

        Используйте `assertOkOrThrowProviderError(...)` для сбоев HTTP-запросов провайдера, чтобы
        плагины совместно использовали чтение тела ошибки с ограничением размера, разбор ошибок JSON и
        суффиксы идентификаторов запросов.
      </Tab>
      <Tab title="Транскрибирование в реальном времени">
        Предпочитайте `createRealtimeTranscriptionWebSocketSession(...)` — общий
        вспомогательный компонент обрабатывает перехват прокси, задержку повторного подключения, сброс при закрытии, начальные
        подтверждения готовности, постановку аудио в очередь и диагностику событий закрытия. Ваш плагин
        только сопоставляет события вышестоящего сервиса.

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
        `openclaw/plugin-sdk/provider-http`. Вспомогательная функция нормализует имена
        загружаемых файлов, включая загрузки AAC, которым для совместимых API
        транскрибирования требуется имя файла в стиле M4A.
      </Tab>
      <Tab title="Голос в реальном времени">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Голос Acme в реальном времени",
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
            // Указывайте это только в том случае, если провайдер принимает несколько ответов инструмента
            // для одного вызова, например немедленный ответ "выполняется", за которым следует
            // окончательный результат.
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
        Talk. Реализуйте `handleBargeIn`, если транспорт может определить, что
        пользователь прерывает воспроизведение ответа ассистента, а провайдер поддерживает
        сокращение или очистку активного аудиоответа.
        `submitToolResult` может возвращать `void` для синхронной отправки или
        `Promise<void>` для асинхронной границы завершения, которую может предоставить
        мост провайдера. Сеансы ретрансляции Gateway ожидают выполнения этого промиса, прежде чем
        подтвердить окончательный результат или очистить связанный запуск; отклоняйте его при
        сбое отправки.
        Установите `supportsToolResultSuppression: false`, если провайдер не может
        соблюдать `options.suppressResponse`. Тогда OpenClaw не применяет подавление к
        внутренним результатам принудительного обращения и отмены, а также отклоняет прямые
        запросы подавленных результатов вместо неявного запуска ответа.
        Потребители `createRealtimeVoiceBridgeSession` также могут возвращать
        промис из `onToolCall`; синхронные исключения и отклонения направляются
        в обратный вызов сеанса `onError`.
        Устанавливайте `handlesInputAudioBargeIn` только тогда, когда VAD провайдера подтверждает
        прерывание вызовом `onClearAudio("barge-in")`. Для провайдеров, которые не указывают
        этот флаг, OpenClaw использует локальное резервное обнаружение по входному аудио.
      </Tab>
      <Tab title="Анализ медиаданных">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "Фотография..." }),
          transcribeAudio: async (req) => ({ text: "Транскрипция..." }),
        });
        ```

        Локальные или самостоятельно размещённые медиапровайдеры, которым намеренно не требуются
        учётные данные, могут предоставлять `resolveAuth` и возвращать `kind: "none"`.
        OpenClaw по-прежнему сохраняет обычную проверку аутентификации для провайдеров, которые
        явно не включили эту возможность. Существующие провайдеры могут продолжать читать `req.apiKey`;
        новым провайдерам следует предпочитать `req.auth`.

        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "local-audio",
          capabilities: ["audio"],
          resolveAuth: () => ({
            kind: "none",
            source: "плагин local-audio без аутентификации",
          }),
          transcribeAudio: async (req) => ({ text: "Транскрипция..." }),
        });
        ```
      </Tab>
      <Tab title="Эмбеддинги">
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

        Объявите тот же идентификатор в `contracts.embeddingProviders`. Это
        общий контракт эмбеддингов для многократно используемой генерации векторов, включая
        поиск по памяти. `registerMemoryEmbeddingProvider(...)` — устаревший
        механизм совместимости для существующих адаптеров, предназначенных для памяти.
      </Tab>
      <Tab title="Генерация изображений и видео">
        Возможности работы с изображениями и видео используют структуру **с учётом режима**. Провайдеры
        изображений объявляют обязательные блоки возможностей `generate` и `edit`;
        провайдеры видео объявляют `generate`, `imageToVideo` и
        `videoToVideo`. Плоских агрегированных полей, таких как `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds`, недостаточно для корректного объявления
        поддержки режима преобразования или отключённых режимов. Генерация музыки
        следует той же схеме `generate` / `edit`.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Изображения Acme",
          capabilities: {
            generate: { maxCount: 4, supportsSize: true },
            edit: { enabled: false },
          },
          generateImage: async (req) => ({ images: [] }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Видео Acme",
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

        `capabilities` обязателен для обоих типов провайдеров; `edit` и
        блоки преобразования видео (`imageToVideo`, `videoToVideo`) всегда требуют
        явного флага `enabled`.

        Используйте `catalogByModel`, когда статические режимы или возможности указанной модели
        отличаются от значений провайдера по умолчанию. Эти метаданные обеспечивают точность
        `video_generate action=list` и каталогов моделей без
        вызова кода провайдера. Поиск и проверка возможностей во время запроса
        по-прежнему относятся к `resolveModelCapabilities` и `generateVideo`; по возможности
        используйте одну и ту же константу возможностей для обоих путей.
      </Tab>
      <Tab title="Получение данных и поиск в интернете">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Получение данных Acme",
          hint: "Получайте страницы через серверную часть рендеринга Acme.",
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
            description: "Получить страницу через Acme Fetch.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });

        api.registerWebSearchProvider({
          id: "acme-ai-search",
          label: "Поиск Acme",
          hint: "Выполняйте поиск в интернете через серверную часть поиска Acme.",
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
            description: "Выполнить поиск в интернете через Acme Search.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });
        ```

        Оба типа провайдеров используют одну и ту же структуру подключения учётных данных:
        `hint`, `envVars`, `placeholder`, `signupUrl`, `credentialPath`,
        `getCredentialValue`, `setCredentialValue` и `createTool` —
        обязательны.
      </Tab>
    </Tabs>

  </Step>

  <Step title="Тестирование">
    ### Шаг 6: Тестирование

    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Экспортируйте объект конфигурации провайдера из index.ts или отдельного файла
    import { acmeProvider } from "./provider.js";

    describe("провайдер acme-ai", () => {
      it("разрешает динамические модели", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("возвращает каталог при наличии ключа", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("возвращает пустой каталог при отсутствии ключа", async () => {
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

`clawhub skill publish <path>` — это другая команда для публикации папки навыка,
а не пакета плагина — не используйте её здесь.

## Структура файлов

```
<bundled-plugin-root>/acme-ai/
├── package.json              # метаданные openclaw.providers
├── openclaw.plugin.json      # Манифест с метаданными аутентификации провайдера
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Тесты
    └── usage.ts              # Конечная точка использования (необязательно)
```

## Справочник по порядку каталогов

`catalog.order` определяет, когда ваш каталог объединяется относительно встроенных
провайдеров:

| Порядок     | Когда          | Вариант использования                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Первый проход    | Провайдеры только с API-ключом                         |
| `profile` | После простых  | Провайдеры, требующие профилей аутентификации                |
| `paired`  | После профиля | Формирование нескольких связанных записей             |
| `late`    | Последний проход     | Переопределение существующих провайдеров (при конфликте имеет приоритет) |

## Дальнейшие действия

- [Плагины каналов](/ru/plugins/sdk-channel-plugins) — если ваш плагин также предоставляет канал
- [Среда выполнения SDK](/ru/plugins/sdk-runtime) — вспомогательные функции `api.runtime` (TTS, поиск, субагент)
- [Обзор SDK](/ru/plugins/sdk-overview) — полный справочник по импорту подпутей
- [Внутреннее устройство плагинов](/ru/plugins/architecture-internals#provider-runtime-hooks) — сведения о хуках и встроенные примеры

## Связанные материалы

- [Настройка Plugin SDK](/ru/plugins/sdk-setup)
- [Создание плагинов](/ru/plugins/building-plugins)
- [Создание плагинов каналов](/ru/plugins/sdk-channel-plugins)
