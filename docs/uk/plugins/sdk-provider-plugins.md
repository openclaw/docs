---
read_when:
    - Ви створюєте новий плагін провайдера моделі
    - Ви хочете додати до OpenClaw OpenAI-сумісний проксі або власну LLM
    - Вам потрібно зрозуміти автентифікацію провайдера, каталоги та runtime-хуки
sidebarTitle: Provider plugins
summary: Покроковий посібник зі створення плагіна провайдера моделі для OpenClaw
title: Створення плагінів провайдерів
x-i18n:
    generated_at: "2026-04-24T03:07:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: bef17d1e9944f041c29a578ceab20835d82c8e846a401048676211237fdbc499
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Цей посібник покроково пояснює, як створити плагін провайдера, що додає провайдера моделі
(LLM) до OpenClaw. Наприкінці у вас буде провайдер із каталогом моделей,
автентифікацією через API-ключ і динамічним визначенням моделей.

<Info>
  Якщо ви раніше не створювали жодного плагіна OpenClaw, спершу прочитайте
  [Getting Started](/uk/plugins/building-plugins) для базової структури пакета
  та налаштування маніфесту.
</Info>

<Tip>
  Плагіни провайдерів додають моделі до стандартного циклу інференсу OpenClaw. Якщо модель
  має працювати через нативний демон агента, який керує потоками, Compaction або
  подіями інструментів, поєднуйте провайдера з [agent harness](/uk/plugins/sdk-agent-harness),
  а не виносьте деталі протоколу демона в core.
</Tip>

## Покроковий розбір

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
      "description": "Провайдер моделей Acme AI",
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
          "choiceLabel": "API-ключ Acme AI",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "API-ключ Acme AI"
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
    облікові дані без завантаження runtime вашого плагіна. Додавайте `providerAuthAliases`,
    коли варіант провайдера має повторно використовувати auth іншого id провайдера. `modelSupport`
    необов’язковий і дозволяє OpenClaw автоматично завантажувати ваш плагін провайдера зі скорочених
    ідентифікаторів моделей, як-от `acme-large`, ще до появи runtime-хуків. Якщо ви публікуєте
    провайдера в ClawHub, поля `openclaw.compat` і `openclaw.build`
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
      description: "Провайдер моделей Acme AI",
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
              label: "API-ключ Acme AI",
              hint: "API-ключ з вашої панелі Acme AI",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Введіть свій API-ключ Acme AI",
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

    Це вже робочий провайдер. Тепер користувачі можуть виконати
    `openclaw onboard --acme-ai-api-key <key>` і вибрати
    `acme-ai/acme-large` як свою модель.

    Якщо провайдер вище за потоком використовує інші керувальні токени, ніж OpenClaw, додайте
    невелике двонапрямлене текстове перетворення замість заміни шляху потоку:

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

    `input` переписує фінальний системний промпт і вміст текстових повідомлень перед
    транспортуванням. `output` переписує текстові дельти асистента й фінальний текст до того, як
    OpenClaw розбере власні керувальні маркери або доставку каналу.

    Для вбудованих провайдерів, які реєструють лише одного текстового провайдера з автентифікацією
    через API-ключ плюс один runtime, підкріплений каталогом, надавайте перевагу вужчому
    helper `defineSingleProviderPluginEntry(...)`:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Провайдер моделей Acme AI",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "API-ключ Acme AI",
            hint: "API-ключ з вашої панелі Acme AI",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Введіть свій API-ключ Acme AI",
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

    `buildProvider` — це шлях живого каталогу, який використовується, коли OpenClaw може визначити справжній
    auth провайдера. Він може виконувати виявлення, специфічне для провайдера. Використовуйте
    `buildStaticProvider` лише для офлайн-рядків, які безпечно показувати до налаштування auth;
    він не повинен вимагати облікових даних або виконувати мережеві запити.
    Поточне відображення `models list --all` в OpenClaw виконує статичні каталоги
    лише для вбудованих плагінів провайдерів, із порожньою конфігурацією, порожнім env і без
    шляхів агента/робочого простору.

    Якщо вашому auth-потоку також потрібно змінювати `models.providers.*`, aliases і
    модель агента за замовчуванням під час onboarding, використовуйте preset-helper-и з
    `openclaw/plugin-sdk/provider-onboard`. Найвужчі helper-и —
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли нативний ендпоїнт провайдера підтримує блоки використання в потоці на
    звичайному транспорті `openai-completions`, надавайте перевагу спільним helper-ам каталогів із
    `openclaw/plugin-sdk/provider-catalog-shared` замість жорстко закодованих перевірок id провайдера.
    `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку з мапи можливостей ендпоїнта,
    тож нативні ендпоїнти у стилі Moonshot/DashScope все одно долучаються, навіть коли плагін
    використовує власний id провайдера.

  </Step>

  <Step title="Додайте динамічне визначення моделей">
    Якщо ваш провайдер приймає довільні ідентифікатори моделей (як проксі або маршрутизатор),
    додайте `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog з прикладу вище

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
    прогрівання — після його завершення `resolveDynamicModel` запускається знову.

  </Step>

  <Step title="Додайте runtime-хуки (за потреби)">
    Більшості провайдерів потрібні лише `catalog` + `resolveDynamicModel`. Додавайте хуки
    поступово, у міру потреби вашого провайдера.

    Спільні helper-builder-и тепер покривають найпоширеніші сімейства replay/tool-compat,
    тому плагінам зазвичай не потрібно вручну підключати кожен хук окремо:

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

    | Family | Що саме підключає | Вбудовані приклади |
    | --- | --- | --- |
    | `openai-compatible` | Спільну політику replay у стилі OpenAI для OpenAI-сумісних транспортів, включно з очищенням tool-call-id, виправленням порядку assistant-first і загальною валідацією Gemini-turn там, де це потрібно транспорту | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Політику replay з урахуванням Claude, яка обирається за `modelId`, тож транспорти повідомлень Anthropic отримують очищення thinking-block, специфічне для Claude, лише коли визначена модель справді є ідентифікатором Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Нативну політику replay для Gemini плюс очищення bootstrap replay і режим tagged reasoning-output | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Очищення thought-signature Gemini для моделей Gemini, що працюють через OpenAI-сумісні проксі-транспорти; не вмикає нативну валідацію replay Gemini або переписування bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Гібридну політику для провайдерів, які поєднують поверхні моделей Anthropic-message і OpenAI-compatible в одному плагіні; необов’язкове відкидання thinking-block лише для Claude лишається обмеженим стороною Anthropic | `minimax` |

    Доступні сьогодні сімейства потоків:

    | Family | Що саме підключає | Вбудовані приклади |
    | --- | --- | --- |
    | `google-thinking` | Нормалізацію thinking-payload Gemini на спільному шляху потоку | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Обгортку reasoning Kilo на спільному шляху проксі-потоку, де `kilo/auto` і непідтримувані proxy reasoning id пропускають ін’єктований thinking | `kilocode` |
    | `moonshot-thinking` | Мапінг binary native-thinking payload Moonshot з конфігурації + рівня `/think` | `moonshot` |
    | `minimax-fast-mode` | Переписування моделі MiniMax fast-mode на спільному шляху потоку | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Спільні нативні обгортки OpenAI/Codex Responses: заголовки атрибуції, `/fast`/`serviceTier`, деталізація тексту, нативний вебпошук Codex, формування reasoning-compat payload і керування контекстом Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Обгортку reasoning OpenRouter для proxy-маршрутів, де пропуски для unsupported-model/`auto` централізовано обробляються | `openrouter` |
    | `tool-stream-default-on` | Обгортку `tool_stream`, увімкнену за замовчуванням, для провайдерів на кшталт Z.AI, які хочуть потокову передачу інструментів, якщо її явно не вимкнено | `zai` |

    <Accordion title="SDK seams, які забезпечують роботу family builder-ів">
      Кожен family builder складається з низькорівневих публічних helper-ів, експортованих із того самого пакета, до яких можна звернутися, коли провайдеру потрібно вийти за межі типового шаблону:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` і сирі builder-и replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Також експортує helper-и replay для Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) і helper-и для endpoint/model (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, а також спільні обгортки OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`) і спільні обгортки proxy/provider (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, базові helper-и схем Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) і helper-и compat для xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Вбудований плагін xAI використовує `normalizeResolvedModel` + `contributeResolvedModelCompat` разом із ними, щоб правила xAI залишалися у власності провайдера.

      Деякі stream-helper-и навмисно залишаються локальними для провайдера. `@openclaw/anthropic-provider` зберігає `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і низькорівневі builder-и обгорток Anthropic у власному публічному seam `api.ts` / `contract-api.ts`, оскільки вони кодують обробку Claude OAuth beta та gating для `context1m`. Аналогічно, плагін xAI зберігає нативне формування xAI Responses у власному `wrapStreamFn` (aliases для `/fast`, типовий `tool_stream`, очищення unsupported strict-tool, видалення reasoning-payload, специфічного для xAI).

      Той самий шаблон package-root також лежить в основі `@openclaw/openai-provider` (builder-и провайдера, helper-и моделі за замовчуванням, builder-и realtime-провайдера) і `@openclaw/openrouter-provider` (builder провайдера плюс helper-и onboarding/config).
    </Accordion>

    <Tabs>
      <Tab title="Обмін токенами">
        Для провайдерів, яким потрібен обмін токенами перед кожним викликом інференсу:

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
        Для провайдерів, яким потрібні користувацькі заголовки запиту або модифікації тіла:

        ```typescript
        // wrapStreamFn повертає StreamFn, похідний від ctx.streamFn
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
        Для провайдерів, яким потрібні нативні заголовки/метадані запиту або сесії на
        узагальнених HTTP- або WebSocket-транспортах:

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
      <Tab title="Використання й білінг">
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
      </Tab>
    </Tabs>

    <Accordion title="Усі доступні хуки провайдера">
      OpenClaw викликає хуки в такому порядку. Більшість провайдерів використовують лише 2–3:

      | # | Hook | Коли використовувати |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей або значення `baseUrl` за замовчуванням |
      | 2 | `applyConfigDefaults` | Глобальні значення за замовчуванням, що належать провайдеру, під час матеріалізації конфігурації |
      | 3 | `normalizeModelId` | Очищення aliases застарілих/preview model-id перед пошуком |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` для сімейства провайдера перед загальним збиранням моделі |
      | 5 | `normalizeConfig` | Нормалізувати конфігурацію `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Переписування compat нативного streaming-usage для config-провайдерів |
      | 7 | `resolveConfigApiKey` | Визначення auth через env-marker, що належить провайдеру |
      | 8 | `resolveSyntheticAuth` | Синтетичний auth для local/self-hosted або на основі конфігурації |
      | 9 | `shouldDeferSyntheticProfileAuth` | Опустити синтетичні заповнювачі stored-profile нижче auth через env/config |
      | 10 | `resolveDynamicModel` | Приймати довільні upstream model-id |
      | 11 | `prepareDynamicModel` | Асинхронне отримання метаданих перед визначенням |
      | 12 | `normalizeResolvedModel` | Переписування транспорту перед runner |
      | 13 | `contributeResolvedModelCompat` | Прапори compat для моделей вендора за іншим сумісним транспортом |
      | 14 | `capabilities` | Застарілий статичний набір можливостей; лише для сумісності |
      | 15 | `normalizeToolSchemas` | Очищення схем інструментів, що належить провайдеру, перед реєстрацією |
      | 16 | `inspectToolSchemas` | Діагностика схем інструментів, що належить провайдеру |
      | 17 | `resolveReasoningOutputMode` | Контракт tagged vs native reasoning-output |
      | 18 | `prepareExtraParams` | Параметри запиту за замовчуванням |
      | 19 | `createStreamFn` | Повністю користувацький транспорт StreamFn |
      | 20 | `wrapStreamFn` | Користувацькі обгортки заголовків/тіла на звичайному шляху потоку |
      | 21 | `resolveTransportTurnState` | Нативні заголовки/метадані для кожного turn |
      | 22 | `resolveWebSocketSessionPolicy` | Нативні заголовки сесії WS / cool-down |
      | 23 | `formatApiKey` | Користувацька форма runtime-токена |
      | 24 | `refreshOAuth` | Користувацьке оновлення OAuth |
      | 25 | `buildAuthDoctorHint` | Порада з відновлення auth |
      | 26 | `matchesContextOverflowError` | Виявлення переповнення, що належить провайдеру |
      | 27 | `classifyFailoverReason` | Класифікація rate-limit/overload, що належить провайдеру |
      | 28 | `isCacheTtlEligible` | Gating TTL кешу промптів |
      | 29 | `buildMissingAuthMessage` | Користувацька підказка про відсутній auth |
      | 30 | `suppressBuiltInModel` | Приховати застарілі upstream-рядки |
      | 31 | `augmentModelCatalog` | Синтетичні рядки для forward-compat |
      | 32 | `resolveThinkingProfile` | Набір параметрів `/think`, специфічний для моделі |
      | 33 | `isBinaryThinking` | Сумісність binary thinking увімк./вимк. |
      | 34 | `supportsXHighThinking` | Сумісність підтримки reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Сумісність політики `/think` за замовчуванням |
      | 36 | `isModernModelRef` | Зіставлення live/smoke-моделей |
      | 37 | `prepareRuntimeAuth` | Обмін токенами перед інференсом |
      | 38 | `resolveUsageAuth` | Користувацький розбір облікових даних використання |
      | 39 | `fetchUsageSnapshot` | Користувацький ендпоїнт використання |
      | 40 | `createEmbeddingProvider` | Адаптер embedding, що належить провайдеру, для пам’яті/пошуку |
      | 41 | `buildReplayPolicy` | Користувацька політика replay/Compaction транскрипту |
      | 42 | `sanitizeReplayHistory` | Переписування replay, специфічні для провайдера, після загального очищення |
      | 43 | `validateReplayTurns` | Сувора валідація replay-turn перед вбудованим runner |
      | 44 | `onModelSelected` | Зворотний виклик після вибору моделі (наприклад, телеметрія) |

      Примітки щодо runtime fallback:

      - `normalizeConfig` спочатку перевіряє відповідний провайдер, а потім інші плагіни провайдерів із hook-можливостями, доки один із них справді не змінить конфігурацію. Якщо жоден hook провайдера не перепише підтримуваний запис конфігурації сімейства Google, усе одно застосовується вбудований нормалізатор конфігурації Google.
      - `resolveConfigApiKey` використовує hook провайдера, якщо його надано. Вбудований шлях `amazon-bedrock` також має тут вбудований resolver auth через AWS env-marker, хоча сам Bedrock runtime auth і надалі використовує стандартний ланцюжок AWS SDK.
      - `resolveSystemPromptContribution` дозволяє провайдеру ін’єктувати системні підказки для сімейства моделей з урахуванням кешу. Надавайте йому перевагу над `before_prompt_build`, коли поведінка належить одному провайдеру/сімейству моделей і має зберігати стабільний/динамічний поділ кешу.

      Докладні описи та реальні приклади див. у [Internals: Provider Runtime Hooks](/uk/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Додайте додаткові можливості (необов’язково)">
    Плагін провайдера може реєструвати синтез мовлення, транскрибування в realtime,
    голос у realtime, розуміння медіа, генерацію зображень, генерацію відео, web fetch
    і web search поряд із текстовим інференсом. OpenClaw класифікує це як
    плагін **hybrid-capability** — рекомендований шаблон для корпоративних плагінів
    (один плагін на вендора). Див.
    [Internals: Capability Ownership](/uk/plugins/architecture#capability-ownership-model).

    Реєструйте кожну можливість усередині `register(api)` поруч із наявним викликом
    `api.registerProvider(...)`. Вибирайте лише ті вкладки, які вам потрібні:

    <Tabs>
      <Tab title="Мовлення (TTS)">
        ```typescript
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
        ```
      </Tab>
      <Tab title="Транскрибування в realtime">
        Надавайте перевагу `createRealtimeTranscriptionWebSocketSession(...)` — спільний
        helper обробляє перехоплення проксі, backoff повторних підключень, flush під час закриття, ready-handshake,
        чергу аудіо та діагностику подій закриття. Ваш плагін
        лише відображає upstream-події.

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
        `openclaw/plugin-sdk/provider-http`. Цей helper нормалізує імена
        файлів для вивантаження, зокрема AAC-вивантаження, яким потрібне ім’я файлу у стилі M4A для
        сумісних API транскрибування.
      </Tab>
      <Tab title="Голос у realtime">
        ```typescript
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
        ```
      </Tab>
      <Tab title="Розуміння медіа">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "Фото..." }),
          transcribeAudio: async (req) => ({ text: "Транскрипт..." }),
        });
        ```
      </Tab>
      <Tab title="Генерація зображень і відео">
        Можливості відео використовують **форму з урахуванням режиму**: `generate`,
        `imageToVideo` і `videoToVideo`. Плоских агрегованих полів, як-от
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds`, недостатньо,
        щоб чисто оголошувати підтримку режиму трансформації або вимкнені режими.
        Генерація музики використовує той самий шаблон із явними блоками `generate` /
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
            imageToVideo: { enabled: true, maxVideos: 1, maxInputImages: 1, maxDurationSeconds: 5 },
            videoToVideo: { enabled: false },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```
      </Tab>
      <Tab title="Web fetch і пошук">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "Отримуйте сторінки через rendering-бекенд Acme.",
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
        ```
      </Tab>
    </Tabs>

  </Step>

  <Step title="Тестування">
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Експортуйте об’єкт конфігурації провайдера з index.ts або окремого файла
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("визначає динамічні моделі", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("повертає каталог, коли ключ доступний", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("повертає null для каталогу, коли ключа немає", async () => {
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

Плагіни провайдерів публікуються так само, як і будь-які інші зовнішні кодові плагіни:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Не використовуйте тут застарілий alias публікації лише для skill; пакети плагінів мають використовувати
`clawhub package publish`.

## Структура файлів

```
<bundled-plugin-root>/acme-ai/
├── package.json              # метадані openclaw.providers
├── openclaw.plugin.json      # Маніфест із метаданими auth провайдера
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Тести
    └── usage.ts              # Ендпоїнт використання (необов’язково)
```

## Довідник порядку каталогів

`catalog.order` керує тим, коли ваш каталог об’єднується відносно вбудованих
провайдерів:

| Order     | Коли          | Випадок використання                             |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Перший прохід | Звичайні провайдери з API-ключем                |
| `profile` | Після simple  | Провайдери, обмежені профілями auth             |
| `paired`  | Після profile | Синтез кількох пов’язаних записів               |
| `late`    | Останній прохід | Перевизначення наявних провайдерів (виграє при колізії) |

## Наступні кроки

- [Плагіни каналів](/uk/plugins/sdk-channel-plugins) — якщо ваш плагін також надає канал
- [SDK Runtime](/uk/plugins/sdk-runtime) — helper-и `api.runtime` (TTS, search, підагент)
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів subpath
- [Внутрішня архітектура плагінів](/uk/plugins/architecture-internals#provider-runtime-hooks) — подробиці про хуки та вбудовані приклади

## Пов’язане

- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення плагінів](/uk/plugins/building-plugins)
- [Створення плагінів каналів](/uk/plugins/sdk-channel-plugins)
