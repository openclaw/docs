---
read_when:
    - Ви створюєте новий Plugin постачальника моделей
    - Ви хочете додати до OpenClaw сумісний з OpenAI проксі або власну LLM
    - Вам потрібно розуміти автентифікацію провайдерів, каталоги та хуки середовища виконання
sidebarTitle: Provider plugins
summary: Покроковий посібник зі створення Plugin постачальника моделей для OpenClaw
title: Створення провайдерських Plugin
x-i18n:
    generated_at: "2026-05-01T08:05:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f9d721673bdfef0b9c1979b4b8b4c86f19d114374d6b941facb928c3574cd1b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

Цей посібник пояснює, як створити Plugin провайдера, що додає провайдера моделей
(LLM) до OpenClaw. Наприкінці ви матимете провайдера з каталогом моделей,
автентифікацією через API-ключ і динамічним визначенням моделей.

<Info>
  Якщо ви ще не створювали жодного Plugin для OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins), щоб дізнатися про базову структуру
  пакета та налаштування маніфесту.
</Info>

<Tip>
  Plugins провайдерів додають моделі до звичайного циклу інференсу OpenClaw. Якщо модель
  має запускатися через нативний демон агента, який керує потоками, compaction або подіями
  інструментів, поєднайте провайдера з [обгорткою агента](/uk/plugins/sdk-agent-harness),
  замість того щоб додавати деталі протоколу демона в core.
</Tip>

## Покроковий посібник

<Steps>
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
    облікові дані без завантаження runtime вашого Plugin. Додайте `providerAuthAliases`,
    коли варіант провайдера має повторно використовувати автентифікацію іншого id провайдера. `modelSupport`
    необов’язковий і дає OpenClaw змогу автоматично завантажувати ваш Plugin провайдера зі скорочених
    id моделей на кшталт `acme-large` до появи runtime-хуків. Якщо ви публікуєте
    провайдера в ClawHub, ці поля `openclaw.compat` і `openclaw.build`
    обов’язкові в `package.json`.

  </Step>

  <Step title="Зареєструйте провайдера">
    Мінімальному провайдеру потрібні `id`, `label`, `auth` і `catalog`:

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

    Це робочий провайдер. Тепер користувачі можуть виконати
    `openclaw onboard --acme-ai-api-key <key>` і вибрати
    `acme-ai/acme-large` як свою модель.

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
    транспортуванням. `output` переписує текстові дельти асистента та фінальний текст перед тим,
    як OpenClaw розбере власні керівні маркери або доставлення в канал.

    Для вбудованих провайдерів, які реєструють лише одного текстового провайдера з автентифікацією
    через API-ключ і єдиним runtime на основі каталогу, віддавайте перевагу вужчому
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

    `buildProvider` — це шлях live-каталогу, який використовується, коли OpenClaw може визначити справжню
    автентифікацію провайдера. Він може виконувати специфічне для провайдера виявлення. Використовуйте
    `buildStaticProvider` лише для offline-рядків, які безпечно показувати до налаштування
    автентифікації; він не має вимагати облікових даних або виконувати мережеві запити.
    Відображення OpenClaw `models list --all` наразі виконує статичні каталоги
    лише для вбудованих Plugins провайдерів, із порожньою конфігурацією, порожнім env і без
    шляхів агента/робочого простору.

    Якщо вашому потоку автентифікації також потрібно змінювати `models.providers.*`, псевдоніми та
    стандартну модель агента під час onboarding, використовуйте preset-хелпери з
    `openclaw/plugin-sdk/provider-onboard`. Найвужчі хелпери:
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли нативний endpoint провайдера підтримує потокові блоки використання на
    звичайному транспорті `openai-completions`, віддавайте перевагу спільним хелперам каталогу в
    `openclaw/plugin-sdk/provider-catalog-shared` замість жорстко закодованих
    перевірок id провайдера. `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` виявляють підтримку з
    мапи можливостей endpoint, тож нативні endpoint-и у стилі Moonshot/DashScope усе ще
    вмикаються, навіть коли Plugin використовує власний id провайдера.

  </Step>

  <Step title="Додайте динамічне визначення моделей">
    Якщо ваш провайдер приймає довільні ID моделей (як проксі або router),
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
    прогрівання — `resolveDynamicModel` запуститься знову після його завершення.

  </Step>

  <Step title="Додайте runtime-хуки (за потреби)">
    Більшості провайдерів потрібні лише `catalog` + `resolveDynamicModel`. Додавайте хуки
    поступово, коли вони потрібні вашому провайдеру.

    Спільні builders-хелпери тепер покривають найпоширеніші сімейства replay/tool-compat,
    тому Plugins зазвичай не потрібно вручну підключати кожен хук окремо:

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

    | Сімейство | Що підключає | Вбудовані приклади |
    | --- | --- | --- |
    | `openai-compatible` | Спільна політика replay у стилі OpenAI для OpenAI-сумісних транспортів, зокрема очищення tool-call-id, виправлення порядку assistant-first і загальна Gemini-turn валідація там, де вона потрібна транспорту | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Replay-політика з урахуванням Claude, вибрана за `modelId`, щоб транспорти Anthropic-повідомлень отримували специфічне для Claude очищення thinking-block лише тоді, коли визначена модель справді має id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Нативна Gemini replay-політика плюс очищення bootstrap replay і режим позначеного reasoning-output | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Очищення Gemini thought-signature для моделей Gemini, що працюють через OpenAI-сумісні проксі-транспорти; не вмикає нативну Gemini replay-валідацію або bootstrap-перезаписи | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Гібридна політика для провайдерів, які поєднують поверхні моделей Anthropic-повідомлень і OpenAI-сумісні поверхні в одному Plugin; необов’язкове видалення thinking-block лише для Claude залишається обмеженим стороною Anthropic | `minimax` |

    Доступні сьогодні stream-сімейства:

    | Сімейство | Що воно підключає | Вбудовані приклади |
    | --- | --- | --- |
    | `google-thinking` | Нормалізація payload мислення Gemini на спільному шляху потоку | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Обгортка міркувань Kilo на спільному шляху proxy-потоку, де `kilo/auto` і непідтримувані proxy-ідентифікатори міркувань пропускають інʼєктоване мислення | `kilocode` |
    | `moonshot-thinking` | Зіставлення бінарного нативного payload мислення Moonshot із конфігурації + рівня `/think` | `moonshot` |
    | `minimax-fast-mode` | Переписування моделі швидкого режиму MiniMax на спільному шляху потоку | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Спільні нативні обгортки OpenAI/Codex Responses: заголовки атрибуції, `/fast`/`serviceTier`, деталізація тексту, нативний вебпошук Codex, формування payload для сумісності з міркуваннями та керування контекстом Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Обгортка міркувань OpenRouter для proxy-маршрутів, де пропуски непідтримуваних моделей/`auto` обробляються централізовано | `openrouter` |
    | `tool-stream-default-on` | Обгортка `tool_stream`, увімкнена за замовчуванням, для провайдерів на кшталт Z.AI, яким потрібен потоковий вивід інструментів, якщо його явно не вимкнено | `zai` |

    <Accordion title="SDK-шви, що забезпечують сімейні побудовники">
      Кожен сімейний побудовник складається з нижчорівневих публічних помічників, експортованих із того самого пакета; до них можна звернутися, коли провайдеру потрібно відійти від спільного шаблону:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` і сирі побудовники відтворення (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Також експортує помічники відтворення Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) і помічники endpoint/моделі (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, а також спільні обгортки OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), OpenAI-сумісна обгортка DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), очищення thinking-prefill для Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`) і спільні proxy/провайдерські обгортки (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, базові помічники схем Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) і помічники сумісності xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Вбудований Plugin xAI використовує з ними `normalizeResolvedModel` + `contributeResolvedModelCompat`, щоб правила xAI залишалися у власності провайдера.

      Деякі stream-помічники навмисно залишаються локальними для провайдера. `@openclaw/anthropic-provider` тримає `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і нижчорівневі побудовники обгорток Anthropic у власному публічному шві `api.ts` / `contract-api.ts`, бо вони кодують обробку Claude OAuth beta та gating `context1m`. Plugin xAI так само тримає нативне формування xAI Responses у власному `wrapStreamFn` (аліаси `/fast`, типовий `tool_stream`, очищення непідтримуваних strict-tool, вилучення reasoning-payload, специфічне для xAI).

      Той самий шаблон кореня пакета також підтримує `@openclaw/openai-provider` (побудовники провайдера, помічники стандартної моделі, побудовники realtime-провайдера) і `@openclaw/openrouter-provider` (побудовник провайдера плюс помічники onboarding/config).
    </Accordion>

    <Tabs>
      <Tab title="Обмін токенів">
        Для провайдерів, яким потрібен обмін токена перед кожним викликом інференсу:

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
        Для провайдерів, яким потрібні користувацькі заголовки запиту або зміни тіла:

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
        Для провайдерів, яким потрібні нативні заголовки запиту/сесії або метадані на
        generic HTTP чи WebSocket transport:

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

    <Accordion title="Усі доступні хуки провайдерів">
      OpenClaw викликає хуки в такому порядку. Більшість провайдерів використовують лише 2-3:
      Поля провайдера лише для сумісності, які OpenClaw більше не викликає, як-от
      `ProviderPlugin.capabilities` і `suppressBuiltInModel`, тут не наведені.

      | # | Хук | Коли використовувати |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей або типові значення base URL |
      | 2 | `applyConfigDefaults` | Глобальні типові значення, що належать провайдеру, під час матеріалізації конфігурації |
      | 3 | `normalizeModelId` | Очищення legacy/preview alias ідентифікатора моделі перед lookup |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` сімейства провайдера перед generic складанням моделі |
      | 5 | `normalizeConfig` | Нормалізація конфігурації `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Нативні compat-переписування streaming-usage для конфігураційних провайдерів |
      | 7 | `resolveConfigApiKey` | Розвʼязання автентифікації env-marker, що належить провайдеру |
      | 8 | `resolveSyntheticAuth` | Локальна/self-hosted або config-backed синтетична автентифікація |
      | 9 | `shouldDeferSyntheticProfileAuth` | Пониження синтетичних stored-profile placeholders після env/config auth |
      | 10 | `resolveDynamicModel` | Приймання довільних upstream model ID |
      | 11 | `prepareDynamicModel` | Асинхронне отримання метаданих перед розвʼязанням |
      | 12 | `normalizeResolvedModel` | Переписування transport перед runner |
      | 13 | `contributeResolvedModelCompat` | Compat-прапорці для vendor models за іншим compatible transport |
      | 14 | `normalizeToolSchemas` | Очищення tool-schema, що належить провайдеру, перед реєстрацією |
      | 15 | `inspectToolSchemas` | Діагностика tool-schema, що належить провайдеру |
      | 16 | `resolveReasoningOutputMode` | Контракт tagged vs native reasoning-output |
      | 17 | `prepareExtraParams` | Типові параметри запиту |
      | 18 | `createStreamFn` | Повністю користувацький transport StreamFn |
      | 19 | `wrapStreamFn` | Користувацькі обгортки заголовків/тіла на звичайному stream path |
      | 20 | `resolveTransportTurnState` | Нативні per-turn заголовки/метадані |
      | 21 | `resolveWebSocketSessionPolicy` | Нативні заголовки WS-сесії/cool-down |
      | 22 | `formatApiKey` | Користувацька форма runtime token |
      | 23 | `refreshOAuth` | Користувацьке оновлення OAuth |
      | 24 | `buildAuthDoctorHint` | Поради з виправлення автентифікації |
      | 25 | `matchesContextOverflowError` | Виявлення overflow, що належить провайдеру |
      | 26 | `classifyFailoverReason` | Класифікація rate-limit/overload, що належить провайдеру |
      | 27 | `isCacheTtlEligible` | Gating TTL prompt cache |
      | 28 | `buildMissingAuthMessage` | Користувацька підказка про відсутню автентифікацію |
      | 29 | `augmentModelCatalog` | Синтетичні рядки forward-compat |
      | 30 | `resolveThinkingProfile` | Набір параметрів `/think`, специфічний для моделі |
      | 31 | `isBinaryThinking` | Сумісність увімкнення/вимкнення бінарного мислення |
      | 32 | `supportsXHighThinking` | Сумісність підтримки міркувань `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | Сумісність типової політики `/think` |
      | 34 | `isModernModelRef` | Зіставлення live/smoke моделей |
      | 35 | `prepareRuntimeAuth` | Обмін токена перед інференсом |
      | 36 | `resolveUsageAuth` | Користувацький parsing облікових даних використання |
      | 37 | `fetchUsageSnapshot` | Користувацький endpoint використання |
      | 38 | `createEmbeddingProvider` | Embedding adapter для памʼяті/пошуку, що належить провайдеру |
      | 39 | `buildReplayPolicy` | Користувацька політика replay/Compaction транскрипта |
      | 40 | `sanitizeReplayHistory` | Переписування replay, специфічні для провайдера, після generic cleanup |
      | 41 | `validateReplayTurns` | Сувора валідація replay-turn перед embedded runner |
      | 42 | `onModelSelected` | Callback після вибору (наприклад, telemetry) |

      Примітки щодо runtime fallback:

      - `normalizeConfig` спершу перевіряє відповідного провайдера, а потім інші provider plugins із підтримкою хуків, доки один із них справді не змінить конфігурацію. Якщо жоден provider hook не перепише підтримуваний конфігураційний запис Google-family, усе одно застосовується вбудований нормалізатор конфігурації Google.
      - `resolveConfigApiKey` використовує provider hook, коли він доступний. Вбудований шлях `amazon-bedrock` також має тут вбудований AWS env-marker resolver, хоча сама runtime auth Bedrock досі використовує стандартний ланцюжок AWS SDK.
      - `resolveSystemPromptContribution` дає змогу провайдеру інʼєктувати cache-aware guidance для system-prompt для сімейства моделей. Віддавайте йому перевагу над `before_prompt_build`, коли поведінка належить одному провайдеру/сімейству моделей і має зберігати стабільний/динамічний поділ кешу.

      Докладні описи й реальні приклади див. у [Внутрішня архітектура: хуки runtime провайдера](/uk/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Додайте додаткові можливості (необовʼязково)">
    Provider plugin може реєструвати мовлення, realtime transcription, realtime
    voice, розуміння медіа, генерацію зображень, генерацію відео, web fetch
    і web search разом із text inference. OpenClaw класифікує це як
    Plugin із **hybrid-capability** — рекомендований шаблон для plugins компаній
    (один Plugin на vendor). Див.
    [Внутрішня архітектура: власність можливостей](/uk/plugins/architecture#capability-ownership-model).

    Реєструйте кожну можливість усередині `register(api)` поруч із вашим наявним
    викликом `api.registerProvider(...)`. Виберіть лише потрібні вкладки:

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
        plugins спільно використовували обмежене читання тіла помилки, розбір JSON-помилок і
        суфікси ідентифікаторів запитів.
      </Tab>
      <Tab title="Транскрипція в реальному часі">
        Віддавайте перевагу `createRealtimeTranscriptionWebSocketSession(...)` — спільний
        помічник обробляє захоплення проксі, затримку повторного підключення, скидання під час закриття, готові
        handshakes, постановку аудіо в чергу та діагностику подій закриття. Ваш plugin
        лише зіставляє події висхідного сервісу.

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

        Пакетні STT-провайдери, які надсилають multipart-аудіо через POST, мають використовувати
        `buildAudioTranscriptionFormData(...)` з
        `openclaw/plugin-sdk/provider-http`. Помічник нормалізує імена файлів завантажень,
        зокрема AAC-завантажень, яким потрібне ім'я файлу у стилі M4A для
        сумісних API транскрипції.
      </Tab>
      <Tab title="Голос у реальному часі">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
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
      </Tab>
      <Tab title="Генерація зображень і відео">
        Можливості відео використовують форму, **обізнану про режим**: `generate`,
        `imageToVideo` і `videoToVideo`. Плоских агрегованих полів на кшталт
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` недостатньо,
        щоб чітко оголосити підтримку режиму трансформації або вимкнені режими.
        Генерація музики дотримується того самого шаблону з явними блоками `generate` /
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

Provider plugins публікуються так само, як і будь-який інший зовнішній кодовий plugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Не використовуйте тут застарілий псевдонім публікації лише для skill; пакети plugins мають використовувати
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

`catalog.order` керує тим, коли ваш каталог об'єднується відносно вбудованих
провайдерів:

| Порядок   | Коли          | Варіант використання                            |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Перший прохід | Звичайні провайдери API-ключів                  |
| `profile` | Після simple  | Провайдери, обмежені профілями автентифікації   |
| `paired`  | Після profile | Синтез кількох пов'язаних записів               |
| `late`    | Останній прохід | Перевизначення наявних провайдерів (виграє при колізії) |

## Наступні кроки

- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — якщо ваш plugin також надає канал
- [SDK Runtime](/uk/plugins/sdk-runtime) — помічники `api.runtime` (TTS, пошук, субагент)
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпорту підшляхів
- [Внутрішня архітектура Plugin](/uk/plugins/architecture-internals#provider-runtime-hooks) — деталі хуків і вбудовані приклади

## Пов'язане

- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення plugins](/uk/plugins/building-plugins)
- [Створення channel plugins](/uk/plugins/sdk-channel-plugins)
