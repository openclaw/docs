---
read_when:
    - Ви створюєте новий Plugin постачальника моделей
    - Ви хочете додати OpenAI-сумісний проксі або власну LLM до OpenClaw
    - Вам потрібно зрозуміти автентифікацію постачальника, каталоги та runtime-хуки
sidebarTitle: Provider plugins
summary: Покроковий посібник зі створення Plugin постачальника моделей для OpenClaw
title: Створення Plugin постачальників моделей
x-i18n:
    generated_at: "2026-04-27T20:43:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a4f0d0bed655ccda7ce2731270999d46d83f29b89d5e8ba80832992161eb993
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Цей посібник описує створення Plugin постачальника, який додає постачальника
моделей (LLM) до OpenClaw. Наприкінці ви матимете постачальника з каталогом моделей,
автентифікацією через API-ключ і динамічним визначенням моделей.

<Info>
  Якщо ви раніше не створювали жодного Plugin для OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins), щоб ознайомитися з базовою
  структурою пакета та налаштуванням маніфесту.
</Info>

<Tip>
  Plugin постачальників додають моделі до стандартного циклу інференсу OpenClaw. Якщо модель
  має працювати через нативний демон агента, який керує потоками, Compaction або
  подіями інструментів, поєднайте постачальника з [обв’язкою агента](/uk/plugins/sdk-agent-harness),
  а не виносьте деталі протоколу демона в core.
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
    облікові дані без завантаження runtime вашого Plugin. Додавайте `providerAuthAliases`,
    коли варіант постачальника має повторно використовувати автентифікацію іншого id постачальника. `modelSupport`
    є необов’язковим і дає OpenClaw змогу автоматично завантажити ваш Plugin постачальника зі скорочених
    id моделей, таких як `acme-large`, ще до появи runtime-хуків. Якщо ви публікуєте
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

    Якщо постачальник upstream використовує інші керувальні токени, ніж OpenClaw, додайте
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
    передаванням. `output` переписує текстові дельти асистента та фінальний текст перед тим, як
    OpenClaw розбере власні керувальні маркери або доставку каналу.

    Для вбудованих постачальників, які реєструють лише одного текстового постачальника з
    автентифікацією через API-ключ і одним runtime на основі каталогу, надавайте перевагу
    вужчому helper `defineSingleProviderPluginEntry(...)`:

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

    `buildProvider` — це шлях живого каталогу, який використовується, коли OpenClaw може визначити реальну
    автентифікацію постачальника. Він може виконувати специфічне для постачальника виявлення.
    Використовуйте `buildStaticProvider` лише для офлайн-рядків, які безпечно показувати до налаштування
    автентифікації; він не повинен вимагати облікових даних або виконувати мережеві запити.
    Поточне відображення OpenClaw `models list --all` виконує статичні каталоги
    лише для вбудованих Plugin постачальників, з порожньою конфігурацією, порожнім env і без
    шляхів агента/робочого простору.

    Якщо вашому процесу автентифікації також потрібно оновлювати `models.providers.*`,
    псевдоніми та модель агента за замовчуванням під час onboarding, використовуйте готові helper-и з
    `openclaw/plugin-sdk/provider-onboard`. Найвужчі helper-и:
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли нативний endpoint постачальника підтримує потокові блоки використання в
    звичайному транспорті `openai-completions`, надавайте перевагу спільним helper-ам каталогу з
    `openclaw/plugin-sdk/provider-catalog-shared`, а не жорстко прописуйте перевірки provider-id.
    `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку за мапою можливостей endpoint,
    тож нативні endpoint-и на кшталт Moonshot/DashScope усе одно можуть бути ввімкнені, навіть коли Plugin використовує
    власний id постачальника.

  </Step>

  <Step title="Додайте динамічне визначення моделей">
    Якщо ваш постачальник приймає довільні id моделей (наприклад, проксі або маршрутизатор),
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
    прогріву — після його завершення `resolveDynamicModel` буде виконано знову.

  </Step>

  <Step title="Додайте runtime-хуки (за потреби)">
    Більшості постачальників потрібні лише `catalog` + `resolveDynamicModel`. Додавайте хуки
    поступово, у міру того як цього вимагатиме ваш постачальник.

    Спільні builder-helper-и тепер охоплюють найпоширеніші сімейства replay/tool-compat,
    тому Plugin зазвичай не потрібно вручну підключати кожен хук окремо:

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

    | Сімейство | Що воно підключає | Вбудовані приклади |
    | --- | --- | --- |
    | `openai-compatible` | Спільна політика replay у стилі OpenAI для OpenAI-сумісних транспортів, включно з очищенням tool-call-id, виправленням порядку assistant-first і загальною валідацією Gemini-turn там, де це потрібно транспорту | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Політика replay з урахуванням Claude, що вибирається за `modelId`, тож транспорти повідомлень Anthropic отримують очищення thinking-block, специфічне для Claude, лише коли визначена модель справді є id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Нативна політика replay Gemini плюс початкове очищення replay і режим тегованого reasoning-output | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Очищення thought-signature Gemini для моделей Gemini, що працюють через OpenAI-сумісні проксі-транспорти; не вмикає нативну валідацію replay Gemini або початкові переписування | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Гібридна політика для постачальників, які поєднують поверхні моделей Anthropic-message і OpenAI-compatible в одному Plugin; необов’язкове відкидання thinking-block лише для Claude залишається обмеженим стороною Anthropic | `minimax` |

    Наразі доступні такі сімейства потоків:

    | Сімейство | Що воно підключає | Вбудовані приклади |
    | --- | --- | --- |
    | `google-thinking` | Нормалізація payload thinking Gemini у спільному шляху потоку | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Обгортка reasoning Kilo у спільному шляху проксі-потоку, де `kilo/auto` і непідтримувані proxy reasoning id пропускають ін’єкцію thinking | `kilocode` |
    | `moonshot-thinking` | Мапінг бінарного payload native-thinking Moonshot із config + рівня `/think` | `moonshot` |
    | `minimax-fast-mode` | Переписування моделі MiniMax fast-mode у спільному шляху потоку | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Спільні нативні обгортки OpenAI/Codex Responses: заголовки атрибуції, `/fast`/`serviceTier`, текстова verbosity, нативний вебпошук Codex, формування payload reasoning-compat і керування контекстом Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Обгортка reasoning OpenRouter для proxy-маршрутів, із централізованою обробкою пропусків unsupported-model/`auto` | `openrouter` |
    | `tool-stream-default-on` | Обгортка `tool_stream`, увімкнена за замовчуванням, для постачальників на кшталт Z.AI, які хочуть потокову передачу інструментів, якщо її явно не вимкнено | `zai` |

    <Accordion title="SDK-шви, що забезпечують роботу builder-ів сімейств">
      Кожен builder сімейства складається з публічних helper-ів нижчого рівня, експортованих із того самого пакета, до яких можна звернутися, коли постачальнику потрібно вийти за межі типового шаблону:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` і необроблені builder-и replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Також експортує helper-и replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) і helper-и endpoint/моделей (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, а також спільні обгортки OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), OpenAI-compatible-обгортка DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), очищення prefill payload thinking для Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`) і спільні обгортки proxy/постачальників (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, базові helper-и схем Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) і helper-и сумісності xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Вбудований Plugin xAI використовує `normalizeResolvedModel` + `contributeResolvedModelCompat` разом із ними, щоб правила xAI залишалися у власності постачальника.

      Деякі helper-и потоку навмисно залишаються локальними для постачальника. `@openclaw/anthropic-provider` тримає `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і builder-и обгорток Anthropic нижчого рівня у власному публічному шві `api.ts` / `contract-api.ts`, оскільки вони кодують обробку Claude OAuth beta і gating `context1m`. Plugin xAI так само зберігає нативне формування xAI Responses у власному `wrapStreamFn` (псевдоніми `/fast`, `tool_stream` за замовчуванням, очищення unsupported strict-tool, видалення payload reasoning, специфічне для xAI).

      Такий самий шаблон на рівні кореня пакета також лежить в основі `@openclaw/openai-provider` (builder-и постачальників, helper-и моделей за замовчуванням, builder-и realtime-постачальників) і `@openclaw/openrouter-provider` (builder постачальника плюс helper-и onboarding/config).
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
        Для постачальників, яким потрібні власні заголовки запиту або зміни тіла:

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
        узагальнених транспортних механізмах HTTP або WebSocket:

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
      OpenClaw викликає хуки в такому порядку. Більшість постачальників використовують лише 2–3:

      | # | Хук | Коли використовувати |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей або значення `baseUrl` за замовчуванням |
      | 2 | `applyConfigDefaults` | Глобальні значення за замовчуванням, що належать постачальнику, під час materialization конфігурації |
      | 3 | `normalizeModelId` | Очищення застарілих/preview псевдонімів model-id перед пошуком |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` для сімейства постачальника перед загальним збиранням моделі |
      | 5 | `normalizeConfig` | Нормалізація config `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Переписування сумісності native streaming-usage для config-постачальників |
      | 7 | `resolveConfigApiKey` | Визначення автентифікації env-marker, що належить постачальнику |
      | 8 | `resolveSyntheticAuth` | Синтетична автентифікація для локального/self-hosted або config-backed сценарію |
      | 9 | `shouldDeferSyntheticProfileAuth` | Пониження пріоритету synthetic placeholder-ів збереженого профілю нижче за автентифікацію env/config |
      | 10 | `resolveDynamicModel` | Прийом довільних upstream model id |
      | 11 | `prepareDynamicModel` | Асинхронне отримання метаданих перед визначенням |
      | 12 | `normalizeResolvedModel` | Переписування транспорту перед runner |
      | 13 | `contributeResolvedModelCompat` | Прапорці сумісності для моделей постачальника, що працюють через інший сумісний транспорт |
      | 14 | `capabilities` | Застарілий статичний набір можливостей; лише для сумісності |
      | 15 | `normalizeToolSchemas` | Очищення схем інструментів, що належить постачальнику, перед реєстрацією |
      | 16 | `inspectToolSchemas` | Діагностика схем інструментів, що належить постачальнику |
      | 17 | `resolveReasoningOutputMode` | Контракт tagged vs native reasoning-output |
      | 18 | `prepareExtraParams` | Параметри запиту за замовчуванням |
      | 19 | `createStreamFn` | Повністю власний транспорт StreamFn |
      | 20 | `wrapStreamFn` | Обгортки власних заголовків/тіла у звичайному шляху потоку |
      | 21 | `resolveTransportTurnState` | Нативні заголовки/метадані для кожного turn |
      | 22 | `resolveWebSocketSessionPolicy` | Нативні заголовки сесії WS / cooldown |
      | 23 | `formatApiKey` | Власна форма runtime-токена |
      | 24 | `refreshOAuth` | Власне оновлення OAuth |
      | 25 | `buildAuthDoctorHint` | Підказка для виправлення автентифікації |
      | 26 | `matchesContextOverflowError` | Визначення переповнення, що належить постачальнику |
      | 27 | `classifyFailoverReason` | Класифікація rate-limit/overload, що належить постачальнику |
      | 28 | `isCacheTtlEligible` | Гейтинг TTL кешу prompt-ів |
      | 29 | `buildMissingAuthMessage` | Власна підказка про відсутню автентифікацію |
      | 30 | `suppressBuiltInModel` | Приховування застарілих upstream-рядків |
      | 31 | `augmentModelCatalog` | Синтетичні рядки прямої сумісності з майбутніми версіями |
      | 32 | `resolveThinkingProfile` | Набір опцій `/think`, специфічний для моделі |
      | 33 | `isBinaryThinking` | Сумісність із двійковим thinking увімк./вимк. |
      | 34 | `supportsXHighThinking` | Сумісність із reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Сумісність із політикою `/think` за замовчуванням |
      | 36 | `isModernModelRef` | Відповідність моделі для live/smoke |
      | 37 | `prepareRuntimeAuth` | Обмін токенами перед інференсом |
      | 38 | `resolveUsageAuth` | Власний розбір облікових даних використання |
      | 39 | `fetchUsageSnapshot` | Власний endpoint використання |
      | 40 | `createEmbeddingProvider` | Адаптер embedding, що належить постачальнику, для пам’яті/пошуку |
      | 41 | `buildReplayPolicy` | Власна політика replay/Compaction транскрипту |
      | 42 | `sanitizeReplayHistory` | Специфічні для постачальника переписування replay після загального очищення |
      | 43 | `validateReplayTurns` | Сувора валідація turn-ів replay перед вбудованим runner |
      | 44 | `onModelSelected` | Зворотний виклик після вибору моделі (наприклад, телеметрія) |

      Примітки щодо runtime fallback:

      - `normalizeConfig` спочатку перевіряє відповідний постачальник, потім інші Plugin постачальників із підтримкою хуків, доки якийсь із них справді не змінить config. Якщо жоден хук постачальника не перепише підтримуваний запис config сімейства Google, усе ще застосовується вбудований normalizer config Google.
      - `resolveConfigApiKey` використовує хук постачальника, якщо він доступний. Вбудований шлях `amazon-bedrock` також має тут вбудований resolver AWS env-marker, хоча runtime-автентифікація Bedrock досі використовує стандартний ланцюжок AWS SDK.
      - `resolveSystemPromptContribution` дозволяє постачальнику ін’єктувати підказки системного prompt, чутливі до кешу, для сімейства моделей. Надавайте йому перевагу над `before_prompt_build`, коли поведінка належить одному постачальнику/сімейству моделей і має зберігати стабільний/динамічний поділ кешу.

      Докладні описи та приклади з реального світу дивіться в [Внутрішня архітектура: runtime-хуки постачальників](/uk/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Додайте додаткові можливості (необов’язково)">
    Plugin постачальника може реєструвати мовлення, realtime-транскрипцію, realtime-голос,
    розуміння медіа, генерацію зображень, генерацію відео, web fetch
    і web search поряд із текстовим інференсом. OpenClaw класифікує це як
    Plugin **hybrid-capability** — рекомендований шаблон для корпоративних Plugin
    (один Plugin на постачальника). Див.
    [Внутрішня архітектура: володіння можливостями](/uk/plugins/architecture#capability-ownership-model).

    Реєструйте кожну можливість усередині `register(api)` поруч із вашим наявним
    викликом `api.registerProvider(...)`. Обирайте лише ті вкладки, які вам потрібні:

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

        Використовуйте `assertOkOrThrowProviderError(...)` для HTTP-збоїв постачальника, щоб
        Plugin спільно використовували обмежене читання тіла помилки, розбір JSON-помилок і
        суфікси request-id.
      </Tab>
      <Tab title="Realtime-транскрипція">
        Надавайте перевагу `createRealtimeTranscriptionWebSocketSession(...)` — цей спільний
        helper обробляє захоплення проксі, backoff повторного підключення, flush під час закриття, ready-handshake, постановку аудіо в чергу та діагностику подій закриття. Ваш Plugin
        лише зіставляє upstream-події.

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

        Пакетні STT-постачальники, які надсилають multipart-аудіо через POST, мають використовувати
        `buildAudioTranscriptionFormData(...)` з
        `openclaw/plugin-sdk/provider-http`. Цей helper нормалізує
        імена файлів для завантаження, зокрема AAC-завантаження, яким потрібне ім’я файлу у стилі M4A для
        сумісних API транскрипції.
      </Tab>
      <Tab title="Realtime-голос">
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
        Можливості відео використовують форму з **урахуванням режиму**: `generate`,
        `imageToVideo` і `videoToVideo`. Плоских агрегованих полів на кшталт
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` недостатньо,
        щоб коректно оголошувати підтримку режиму transform або чисто вимикати режими.
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
      <Tab title="Web fetch і search">
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

Plugin постачальників публікуються так само, як і будь-який інший зовнішній Plugin коду:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Не використовуйте тут застарілий псевдонім публікації лише для Skills; пакети Plugin повинні використовувати
`clawhub package publish`.

## Структура файлів

```
<bundled-plugin-root>/acme-ai/
├── package.json              # metadata openclaw.providers
├── openclaw.plugin.json      # Маніфест із metadata автентифікації постачальника
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Тести
    └── usage.ts              # Endpoint використання (необов’язково)
```

## Довідник порядку каталогів

`catalog.order` визначає, коли ваш каталог буде об’єднано відносно вбудованих
постачальників:

| Порядок   | Коли          | Випадок використання                            |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Перший прохід | Звичайні постачальники з API-ключем             |
| `profile` | Після simple  | Постачальники, обмежені профілями автентифікації |
| `paired`  | Після profile | Синтез кількох пов’язаних записів               |
| `late`    | Останній прохід | Перевизначення наявних постачальників (перемагає при конфлікті) |

## Наступні кроки

- [Plugin каналів](/uk/plugins/sdk-channel-plugins) — якщо ваш Plugin також надає канал
- [SDK Runtime](/uk/plugins/sdk-runtime) — helper-и `api.runtime` (TTS, search, subagent)
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпорту subpath
- [Внутрішня архітектура Plugin](/uk/plugins/architecture-internals#provider-runtime-hooks) — подробиці про хуки та вбудовані приклади

## Пов’язане

- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugin](/uk/plugins/building-plugins)
- [Створення Plugin каналів](/uk/plugins/sdk-channel-plugins)
