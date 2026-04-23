---
read_when:
    - Ви створюєте новий plugin постачальника моделей
    - Ви хочете додати OpenAI-сумісний проксі або власну LLM до OpenClaw
    - Вам потрібно зрозуміти автентифікацію постачальника, каталоги та runtime-хуки
sidebarTitle: Provider plugins
summary: Покроковий посібник зі створення plugin постачальника моделей для OpenClaw
title: Створення plugin постачальників моделей
x-i18n:
    generated_at: "2026-04-23T16:48:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0863288e4f75163ed57bd1ec73e8e611ad842adf975de6169d5522a280ae3ed
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Створення plugin постачальників

Цей посібник покроково пояснює, як створити plugin постачальника, який додає постачальника моделей
(LLM) до OpenClaw. Наприкінці ви матимете постачальника з каталогом моделей,
автентифікацією за API-ключем і динамічним визначенням моделей.

<Info>
  Якщо ви раніше не створювали жодного plugin для OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins) про базову структуру
  пакета та налаштування маніфесту.
</Info>

<Tip>
  Plugin постачальників додають моделі до стандартного циклу інференсу OpenClaw. Якщо модель
  має працювати через нативний агент-демон, який керує потоками, compaction або подіями
  інструментів, поєднайте постачальника з [agent harness](/uk/plugins/sdk-agent-harness),
  а не виносьте деталі протоколу демона в core.
</Tip>

## Покроковий приклад

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
    облікові дані без завантаження runtime вашого plugin. Додайте `providerAuthAliases`,
    якщо варіант постачальника має повторно використовувати auth іншого id постачальника. `modelSupport`
    є необов’язковим і дає OpenClaw змогу автоматично завантажувати plugin вашого постачальника зі скорочених
    ідентифікаторів моделей, таких як `acme-large`, ще до появи runtime-хуків. Якщо ви публікуєте
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

    Якщо в апстрім-постачальника інші керівні токени, ніж в OpenClaw, додайте
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

    `input` переписує фінальний системний prompt і вміст текстових повідомлень перед
    транспортуванням. `output` переписує текстові дельти асистента й фінальний текст до того,
    як OpenClaw розбере власні керівні маркери або доставку каналом.

    Для вбудованих постачальників, які лише реєструють одного текстового постачальника з автентифікацією
    за API-ключем плюс один runtime на основі каталогу, віддавайте перевагу вужчому
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

    `buildProvider` — це шлях живого каталогу, який використовується, коли OpenClaw може визначити реальний
    auth постачальника. Він може виконувати специфічне для постачальника виявлення. Використовуйте
    `buildStaticProvider` лише для офлайнових рядків, які безпечно показувати до налаштування auth;
    він не повинен вимагати облікові дані або виконувати мережеві запити.
    Поточне відображення `models list --all` в OpenClaw виконує статичні каталоги
    лише для вбудованих plugin постачальників, із порожньою конфігурацією, порожнім env і без
    шляхів агента/робочого простору.

    Якщо вашому потоку auth також потрібно змінювати `models.providers.*`, псевдоніми та
    модель агента за замовчуванням під час онбордингу, використовуйте preset-helper’и з
    `openclaw/plugin-sdk/provider-onboard`. Найвужчі helper’и:
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли нативний endpoint постачальника підтримує потокові блоки використання на
    звичайному транспорті `openai-completions`, віддавайте перевагу спільним helper’ам каталогів із
    `openclaw/plugin-sdk/provider-catalog-shared`, а не жорстко закодованим перевіркам id постачальника.
    `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку з карти можливостей endpoint,
    тому нативні endpoint’и в стилі Moonshot/DashScope також можуть увімкнутися, навіть якщо plugin
    використовує власний id постачальника.

  </Step>

  <Step title="Додайте динамічне визначення моделі">
    Якщо ваш постачальник приймає довільні ідентифікатори моделей (як-от проксі або роутер),
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
    попереднього прогріву — після його завершення `resolveDynamicModel` запускається знову.

  </Step>

  <Step title="Додайте runtime-хуки (за потреби)">
    Більшості постачальників потрібні лише `catalog` + `resolveDynamicModel`. Додавайте хуки
    поступово, коли це знадобиться вашому постачальнику.

    Спільні helper-білдери тепер покривають найпоширеніші сімейства replay/tool-compat,
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

    Наразі доступні такі сімейства replay:

    | Family | Що воно підключає | Приклади вбудованих |
    | --- | --- | --- |
    | `openai-compatible` | Спільна політика replay у стилі OpenAI для OpenAI-сумісних транспортів, зокрема санітизація tool-call-id, виправлення порядку assistant-first і загальна валідація Gemini-turn там, де це потрібно транспорту | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Політика replay з урахуванням Claude, що вибирається за `modelId`, тому транспорти Anthropic-message отримують очищення thinking-block, специфічне для Claude, лише коли визначена модель справді є ідентифікатором Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Нативна політика replay Gemini плюс санітизація bootstrap replay і режим tagged reasoning-output | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Санітизація Gemini thought-signature для моделей Gemini, що працюють через OpenAI-сумісні проксі-транспорти; не вмикає нативну валідацію replay Gemini або bootstrap-перезаписи | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Гібридна політика для постачальників, які поєднують поверхні моделей Anthropic-message та OpenAI-compatible в одному plugin; необов’язкове відкидання thinking-block лише для Claude залишається обмеженим стороною Anthropic | `minimax` |

    Наразі доступні такі сімейства stream:

    | Family | Що воно підключає | Приклади вбудованих |
    | --- | --- | --- |
    | `google-thinking` | Нормалізація payload thinking Gemini у спільному шляху stream | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Обгортка Kilo reasoning у спільному шляху proxy stream, де `kilo/auto` та непідтримувані proxy reasoning id пропускають ін’єкцію thinking | `kilocode` |
    | `moonshot-thinking` | Відображення бінарного payload native-thinking Moonshot з config + рівня `/think` | `moonshot` |
    | `minimax-fast-mode` | Перезапис моделі MiniMax fast-mode у спільному шляху stream | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Спільні нативні обгортки OpenAI/Codex Responses: заголовки attribution, `/fast`/`serviceTier`, текстова verbosity, нативний вебпошук Codex, формування payload reasoning-compat і керування контекстом Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Обгортка OpenRouter reasoning для маршрутів proxy, де пропуски unsupported-model/`auto` централізовано обробляються | `openrouter` |
    | `tool-stream-default-on` | Обгортка `tool_stream`, увімкнена за замовчуванням, для постачальників на кшталт Z.AI, які хочуть потокову передачу інструментів, якщо її явно не вимкнено | `zai` |

    <Accordion title="SDK seams, що забезпечують білдери family">
      Кожен білдер family складається з нижчорівневих публічних helper’ів, експортованих із того самого пакета, до яких можна звернутися, коли постачальнику потрібно відійти від загального шаблону:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` і сирі білдери replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Також експортує helper’и replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) і helper’и endpoint/model (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, а також спільні обгортки OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`) і спільні обгортки proxy/provider (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, базові helper’и схем Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) і helper’и compat для xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Вбудований plugin xAI використовує `normalizeResolvedModel` + `contributeResolvedModelCompat` разом із ними, щоб правила xAI залишалися у власності постачальника.

      Деякі stream-helper’и навмисно залишаються локальними для постачальника. `@openclaw/anthropic-provider` зберігає `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і нижчорівневі білдери обгорток Anthropic у власному публічному seam `api.ts` / `contract-api.ts`, оскільки вони кодують обробку Claude OAuth beta і gating `context1m`. Аналогічно plugin xAI зберігає нативне формування xAI Responses у власному `wrapStreamFn` (псевдоніми `/fast`, `tool_stream` за замовчуванням, очищення unsupported strict-tool, видалення payload reasoning, специфічного для xAI).

      Такий самий шаблон кореня пакета також підтримує `@openclaw/openai-provider` (білдери provider, helper’и моделі за замовчуванням, білдери realtime provider) і `@openclaw/openrouter-provider` (білдер provider плюс helper’и onboarding/config).
    </Accordion>

    <Tabs>
      <Tab title="Обмін токенами">
        Для постачальників, яким перед кожним викликом інференсу потрібен обмін токенами:

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
        Для постачальників, яким потрібні користувацькі заголовки запиту або модифікації тіла:

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
        Для постачальників, яким потрібні нативні заголовки або метадані запиту/сесії в
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

      | # | Hook | Коли використовувати |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей або значення `baseUrl` за замовчуванням |
      | 2 | `applyConfigDefaults` | Глобальні значення за замовчуванням, якими володіє постачальник, під час матеріалізації config |
      | 3 | `normalizeModelId` | Очищення псевдонімів legacy/preview model-id перед пошуком |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` сімейства постачальника перед збиранням узагальненої моделі |
      | 5 | `normalizeConfig` | Нормалізація config `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Перезаписи compat native streaming-usage для config-постачальників |
      | 7 | `resolveConfigApiKey` | Визначення auth маркерів env, яким володіє постачальник |
      | 8 | `resolveSyntheticAuth` | Синтетичний auth для local/self-hosted або на основі config |
      | 9 | `shouldDeferSyntheticProfileAuth` | Опускання синтетичних placeholder’ів збереженого профілю нижче auth env/config |
      | 10 | `resolveDynamicModel` | Прийняття довільних upstream model id |
      | 11 | `prepareDynamicModel` | Асинхронне отримання метаданих перед визначенням |
      | 12 | `normalizeResolvedModel` | Перезаписи транспорту перед runner |
      | 13 | `contributeResolvedModelCompat` | Прапорці compat для моделей постачальника за іншим сумісним транспортом |
      | 14 | `capabilities` | Legacy-мішок статичних можливостей; лише для сумісності |
      | 15 | `normalizeToolSchemas` | Очищення tool-schema, яким володіє постачальник, перед реєстрацією |
      | 16 | `inspectToolSchemas` | Діагностика tool-schema, якою володіє постачальник |
      | 17 | `resolveReasoningOutputMode` | Контракт tagged vs native reasoning-output |
      | 18 | `prepareExtraParams` | Параметри запиту за замовчуванням |
      | 19 | `createStreamFn` | Повністю користувацький транспорт `StreamFn` |
      | 20 | `wrapStreamFn` | Обгортки користувацьких заголовків/тіла у звичайному шляху stream |
      | 21 | `resolveTransportTurnState` | Нативні заголовки/метадані для кожного turn |
      | 22 | `resolveWebSocketSessionPolicy` | Нативні заголовки сесії WS / cool-down |
      | 23 | `formatApiKey` | Користувацька форма runtime-токена |
      | 24 | `refreshOAuth` | Користувацьке оновлення OAuth |
      | 25 | `buildAuthDoctorHint` | Підказка для відновлення auth |
      | 26 | `matchesContextOverflowError` | Виявлення переповнення, яким володіє постачальник |
      | 27 | `classifyFailoverReason` | Класифікація rate-limit/overload, якою володіє постачальник |
      | 28 | `isCacheTtlEligible` | Gating TTL кешу prompt |
      | 29 | `buildMissingAuthMessage` | Користувацька підказка про відсутній auth |
      | 30 | `suppressBuiltInModel` | Приховування застарілих upstream-рядків |
      | 31 | `augmentModelCatalog` | Синтетичні рядки для прямої сумісності вперед |
      | 32 | `resolveThinkingProfile` | Набір опцій `/think`, специфічний для моделі |
      | 33 | `isBinaryThinking` | Сумісність бінарного ввімкнення/вимкнення thinking |
      | 34 | `supportsXHighThinking` | Сумісність підтримки reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Сумісність політики `/think` за замовчуванням |
      | 36 | `isModernModelRef` | Відповідність live/smoke моделей |
      | 37 | `prepareRuntimeAuth` | Обмін токенами перед інференсом |
      | 38 | `resolveUsageAuth` | Користувацький розбір облікових даних використання |
      | 39 | `fetchUsageSnapshot` | Користувацький endpoint використання |
      | 40 | `createEmbeddingProvider` | Адаптер embedding, яким володіє постачальник, для memory/search |
      | 41 | `buildReplayPolicy` | Користувацька політика replay/compaction транскрипту |
      | 42 | `sanitizeReplayHistory` | Перезаписи replay, специфічні для постачальника, після узагальненого очищення |
      | 43 | `validateReplayTurns` | Сувора валідація replay-turn перед вбудованим runner |
      | 44 | `onModelSelected` | Зворотний виклик після вибору моделі (наприклад, telemetry) |

      Примітки щодо runtime fallback:

      - `normalizeConfig` спочатку перевіряє знайденого постачальника, а потім інші plugin постачальників із підтримкою hook, доки один із них справді не змінить config. Якщо жоден hook постачальника не перепише підтримуваний запис config сімейства Google, усе одно застосовується вбудований нормалізатор config Google.
      - `resolveConfigApiKey` використовує hook постачальника, якщо той надано. Вбудований шлях `amazon-bedrock` також має тут вбудований resolver auth маркерів AWS env, хоча сам runtime auth Bedrock досі використовує ланцюжок AWS SDK за замовчуванням.
      - `resolveSystemPromptContribution` дозволяє постачальнику інжектувати підказки system prompt з урахуванням кешу для сімейства моделей. Віддавайте йому перевагу над `before_prompt_build`, коли поведінка належить одному сімейству постачальника/моделі й має зберігати стабільний/динамічний поділ кешу.

      Докладні описи та реальні приклади дивіться в [Внутрішні механізми: Provider Runtime Hooks](/uk/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Додайте додаткові можливості (необов’язково)">
    Plugin постачальника може реєструвати speech, realtime transcription, realtime
    voice, розуміння медіа, генерацію зображень, генерацію відео, web fetch
    і web search поряд із текстовим інференсом. OpenClaw класифікує це як
    plugin **hybrid-capability** — рекомендований шаблон для корпоративних plugin
    (один plugin на постачальника). Див.
    [Внутрішні механізми: Власність можливостей](/uk/plugins/architecture#capability-ownership-model).

    Зареєструйте кожну можливість усередині `register(api)` поруч із наявним
    викликом `api.registerProvider(...)`. Вибирайте лише ті вкладки, які вам потрібні:

    <Tabs>
      <Tab title="Speech (TTS)">
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
      <Tab title="Транскрипція в реальному часі">
        Віддавайте перевагу `createRealtimeTranscriptionWebSocketSession(...)` — спільний
        helper обробляє захоплення proxy, backoff повторного підключення, flush під час закриття, ready-handshake, постановку аудіо в чергу та діагностику подій закриття. Ваш plugin
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

        Постачальники batch STT, які надсилають multipart-аудіо через POST, мають використовувати
        `buildAudioTranscriptionFormData(...)` з
        `openclaw/plugin-sdk/provider-http`. Цей helper нормалізує
        імена файлів завантаження, зокрема AAC-завантаження, яким для
        сумісних API транскрипції потрібне ім’я файлу у стилі M4A.
      </Tab>
      <Tab title="Голос у реальному часі">
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
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Генерація зображень і відео">
        Можливості відео використовують форму з урахуванням **mode**: `generate`,
        `imageToVideo` і `videoToVideo`. Плоских агрегованих полів на кшталт
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` недостатньо,
        щоб коректно рекламувати підтримку режимів трансформації або вимкнені режими.
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
            imageToVideo: { enabled: true, maxVideos: 1, maxInputImages: 1, maxDurationSeconds: 5 },
            videoToVideo: { enabled: false },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```
      </Tab>
      <Tab title="Web fetch і search">
        ```typescript
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
        ```
      </Tab>
    </Tabs>

  </Step>

  <Step title="Тестування">
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

Не використовуйте тут застарілий псевдонім публікації лише для Skills; пакети plugin слід публікувати через
`clawhub package publish`.

## Структура файлів

```
<bundled-plugin-root>/acme-ai/
├── package.json              # Метадані openclaw.providers
├── openclaw.plugin.json      # Маніфест із метаданими auth постачальника
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Тести
    └── usage.ts              # Endpoint використання (необов’язково)
```

## Довідка щодо порядку каталогу

`catalog.order` керує тим, коли ваш каталог зливається відносно вбудованих
постачальників:

| Order     | Коли          | Випадок використання                           |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | Перший прохід | Звичайні постачальники з API-ключем            |
| `profile` | Після simple  | Постачальники, обмежені профілями auth         |
| `paired`  | Після profile | Синтез кількох пов’язаних записів              |
| `late`    | Останній прохід | Перевизначення наявних постачальників (виграє при конфлікті) |

## Наступні кроки

- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — якщо ваш plugin також надає канал
- [SDK Runtime](/uk/plugins/sdk-runtime) — helper’и `api.runtime` (TTS, search, subagent)
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів subpath
- [Внутрішні механізми plugin](/uk/plugins/architecture#provider-runtime-hooks) — деталі hook і приклади вбудованих
