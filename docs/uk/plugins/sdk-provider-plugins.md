---
read_when:
    - Ви створюєте новий plugin провайдера models
    - Ви хочете додати до OpenClaw сумісний з OpenAI proxy або користувацьку LLM
    - Вам потрібно зрозуміти auth провайдера, catalogs і hooks runtime
sidebarTitle: Provider plugins
summary: Покроковий посібник зі створення plugin провайдера моделі для OpenClaw
title: Створення plugin провайдерів models
x-i18n:
    generated_at: "2026-04-23T21:03:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 00e5d092a55469f0a29c8414fd4dcd49f2f1955c4d8734d6cf7967813ba7cde1
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Цей посібник проводить через створення plugin провайдера, який додає провайдера моделей
(LLM) до OpenClaw. Наприкінці у вас буде провайдер із каталогом моделей,
auth через API-ключ і динамічним розв’язанням моделей.

<Info>
  Якщо ви раніше не створювали жодного plugin OpenClaw, спочатку прочитайте
  [Початок роботи](/uk/plugins/building-plugins) для базової структури пакета
  та налаштування manifest.
</Info>

<Tip>
  Plugins провайдерів додають моделі до звичайного inference loop OpenClaw. Якщо модель
  має працювати через нативний daemon агента, який володіє threads, Compaction або tool
  events, поєднайте провайдера з [agent harness](/uk/plugins/sdk-agent-harness),
  а не виносьте деталі протоколу daemon у core.
</Tip>

## Покроковий розбір

<Steps>
  <Step title="Пакет і manifest">
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

    Manifest оголошує `providerAuthEnvVars`, щоб OpenClaw міг виявляти
    credentials без завантаження runtime вашого plugin. Додавайте `providerAuthAliases`,
    коли варіант провайдера має повторно використовувати auth іншого id провайдера. `modelSupport`
    необов’язковий і дає OpenClaw змогу автоматично завантажувати ваш plugin провайдера зі скорочених
    id моделей, таких як `acme-large`, ще до появи hooks runtime. Якщо ви публікуєте
    провайдера на ClawHub, поля `openclaw.compat` і `openclaw.build`
    у `package.json` є обов’язковими.

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

    Це вже працездатний провайдер. Користувачі тепер можуть виконати
    `openclaw onboard --acme-ai-api-key <key>` і вибрати
    `acme-ai/acme-large` як свою модель.

    Якщо upstream-провайдер використовує інші керувальні токени, ніж OpenClaw, додайте
    невелике двоспрямоване текстове перетворення замість заміни шляху потоку:

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

    `input` переписує фінальний системний prompt і текстовий вміст повідомлень перед
    transport. `output` переписує текстові delta assistant і фінальний текст до того, як
    OpenClaw розбере власні керувальні маркери або доставку каналу.

    Для вбудованих провайдерів, які реєструють лише одного текстового провайдера з
    auth через API-ключ плюс один runtime на основі каталогу, надавайте перевагу вужчому
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

    `buildProvider` — це шлях живого каталогу, який використовується, коли OpenClaw може розв’язати реальний
    auth провайдера. Він може виконувати виявлення, специфічне для провайдера. Використовуйте
    `buildStaticProvider` лише для офлайнових записів, які безпечно показувати до налаштування auth;
    він не повинен вимагати credentials або виконувати мережеві запити.
    Відображення `models list --all` в OpenClaw наразі виконує статичні каталоги
    лише для вбудованих plugins провайдерів, з порожнім config, порожнім env і без
    шляхів agent/workspace.

    Якщо вашому потоку auth також потрібно оновлювати `models.providers.*`, aliases і
    типову модель агента під час onboarding, використовуйте preset helpers з
    `openclaw/plugin-sdk/provider-onboard`. Найвужчі helpers —
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` і
    `createModelCatalogPresetAppliers(...)`.

    Коли нативний ендпоінт провайдера підтримує streamed usage blocks на
    звичайному transport `openai-completions`, надавайте перевагу спільним catalog helpers з
    `openclaw/plugin-sdk/provider-catalog-shared` замість жорсткого кодування перевірок provider-id. `supportsNativeStreamingUsageCompat(...)` і
    `applyProviderNativeStreamingUsageCompat(...)` визначають підтримку з мапи можливостей ендпоінта,
    тож нативні ендпоінти на кшталт Moonshot/DashScope усе одно вмикаються, навіть коли plugin використовує власний provider id.

  </Step>

  <Step title="Додайте динамічне розв’язання моделі">
    Якщо ваш провайдер приймає довільні id моделей (як proxy або router),
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

    Якщо для розв’язання потрібен мережевий виклик, використовуйте `prepareDynamicModel` для асинхронного
    прогріву — після його завершення `resolveDynamicModel` запускається знову.

  </Step>

  <Step title="Додайте hooks runtime (за потреби)">
    Більшості провайдерів достатньо `catalog` + `resolveDynamicModel`. Додавайте hooks
    поступово, залежно від потреб вашого провайдера.

    Спільні helper builders тепер покривають найпоширеніші сімейства replay/tool-compat,
    тому plugins зазвичай не потрібно підключати кожен hook вручну окремо:

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

    Доступні сімейства replay на сьогодні:

    | Сімейство | Що воно підключає | Вбудовані приклади |
    | --- | --- | --- |
    | `openai-compatible` | Спільна політика replay у стилі OpenAI для OpenAI-compatible transport, включно з очищенням tool-call-id, виправленням порядку assistant-first і загальною перевіркою Gemini-turn там, де це потрібно transport | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Політика replay з урахуванням Claude, вибрана за `modelId`, тож transport Anthropic-message отримують очищення thinking-block, специфічне для Claude, лише коли розв’язана модель справді є id Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Нативна політика replay Gemini плюс bootstrap-очищення replay і tagged reasoning-output mode | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Очищення Gemini thought-signature для моделей Gemini, що працюють через OpenAI-compatible proxy transport; не вмикає нативну перевірку replay Gemini або bootstrap-перезапис | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Гібридна політика для провайдерів, які поєднують поверхні моделей Anthropic-message і OpenAI-compatible в одному plugin; необов’язкове відкидання thinking-block лише для Claude лишається обмеженим стороною Anthropic | `minimax` |

    Доступні сімейства потоків на сьогодні:

    | Сімейство | Що воно підключає | Вбудовані приклади |
    | --- | --- | --- |
    | `google-thinking` | Нормалізація payload Gemini thinking на спільному шляху потоку | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Обгортка Kilo reasoning на спільному шляху proxy stream, при цьому `kilo/auto` і непідтримувані proxy reasoning id пропускають ін’єктований thinking | `kilocode` |
    | `moonshot-thinking` | Відображення бінарного payload native-thinking Moonshot з config + рівня `/think` | `moonshot` |
    | `minimax-fast-mode` | Перезапис моделі MiniMax fast-mode на спільному шляху потоку | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Спільні нативні обгортки OpenAI/Codex Responses: attribution headers, `/fast`/`serviceTier`, text verbosity, нативний web search Codex, формування payload reasoning-compat і керування контекстом Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | Обгортка reasoning OpenRouter для proxy-маршрутів, із централізованою обробкою пропусків unsupported-model/`auto` | `openrouter` |
    | `tool-stream-default-on` | Типово ввімкнена обгортка `tool_stream` для провайдерів на кшталт Z.AI, які хочуть потокову передачу інструментів, якщо її явно не вимкнено | `zai` |

    <Accordion title="SDK seams, що забезпечують family builders">
      Кожен family builder складається з нижчорівневих публічних helpers, експортованих із того самого пакета, до яких можна звертатися, коли провайдеру потрібно вийти за межі типового шаблону:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` і сирі builders replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Також експортує helpers replay Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) і helpers ендпоінтів/моделей (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, а також спільні обгортки OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`) і спільні обгортки proxy/provider (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, базові helpers схем Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) і helpers сумісності xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Вбудований plugin xAI використовує `normalizeResolvedModel` + `contributeResolvedModelCompat` разом із ними, щоб правила xAI лишалися у власності провайдера.

      Деякі helpers потоків навмисно залишаються локальними для конкретного провайдера. `@openclaw/anthropic-provider` зберігає `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` і нижчорівневі builders обгорток Anthropic у власному публічному seam `api.ts` / `contract-api.ts`, оскільки вони кодують обробку Claude OAuth beta і gating `context1m`. Аналогічно, plugin xAI зберігає формування native xAI Responses у власному `wrapStreamFn` (`/fast` aliases, типовий `tool_stream`, очищення unsupported strict-tool, видалення payload reasoning, специфічного для xAI).

      Такий самий шаблон package-root також лежить в основі `@openclaw/openai-provider` (builders провайдера, helpers типової моделі, builders realtime provider) і `@openclaw/openrouter-provider` (builder провайдера плюс helpers onboarding/config).
    </Accordion>

    <Tabs>
      <Tab title="Обмін токенів">
        Для провайдерів, яким потрібен обмін токенів перед кожним викликом inference:

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
      <Tab title="Користувацькі headers">
        Для провайдерів, яким потрібні користувацькі headers запиту або зміни body:

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
      <Tab title="Нативна transport identity">
        Для провайдерів, яким потрібні нативні headers/метадані запиту або сесії на
        узагальнених HTTP або WebSocket transport:

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
      <Tab title="Usage і billing">
        Для провайдерів, які надають дані usage/billing:

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

      | # | Hook | Коли використовувати |
      | --- | --- | --- |
      | 1 | `catalog` | Каталог моделей або типові значення base URL |
      | 2 | `applyConfigDefaults` | Глобальні типові значення, якими володіє провайдер, під час materialization config |
      | 3 | `normalizeModelId` | Очищення legacy/preview aliases model-id до lookup |
      | 4 | `normalizeTransport` | Очищення `api` / `baseUrl` для family провайдера до узагальненого складання моделі |
      | 5 | `normalizeConfig` | Нормалізувати config `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | Перезаписи native streaming-usage compat для config providers |
      | 7 | `resolveConfigApiKey` | Розв’язання auth через env-marker, яким володіє провайдер |
      | 8 | `resolveSyntheticAuth` | Синтетичний auth для локального/self-hosted або config-backed режиму |
      | 9 | `shouldDeferSyntheticProfileAuth` | Опускати synthetic stored-profile placeholders нижче env/config auth |
      | 10 | `resolveDynamicModel` | Приймати довільні upstream model IDs |
      | 11 | `prepareDynamicModel` | Асинхронне отримання metadata до розв’язання |
      | 12 | `normalizeResolvedModel` | Перезаписи transport до runner |
      | 13 | `contributeResolvedModelCompat` | Прапорці compat для vendor-моделей за іншим compatible transport |
      | 14 | `capabilities` | Legacy static capability bag; лише для сумісності |
      | 15 | `normalizeToolSchemas` | Очищення схем інструментів, яким володіє провайдер, до реєстрації |
      | 16 | `inspectToolSchemas` | Діагностика схем інструментів, якою володіє провайдер |
      | 17 | `resolveReasoningOutputMode` | Контракт tagged vs native reasoning-output |
      | 18 | `prepareExtraParams` | Типові параметри запиту |
      | 19 | `createStreamFn` | Повністю користувацький transport StreamFn |
      | 20 | `wrapStreamFn` | Користувацькі обгортки headers/body на звичайному шляху потоку |
      | 21 | `resolveTransportTurnState` | Нативні headers/metadata для кожного turn |
      | 22 | `resolveWebSocketSessionPolicy` | Нативні headers сесії WS/cool-down |
      | 23 | `formatApiKey` | Користувацька форма runtime-токена |
      | 24 | `refreshOAuth` | Користувацьке оновлення OAuth |
      | 25 | `buildAuthDoctorHint` | Підказки для відновлення auth |
      | 26 | `matchesContextOverflowError` | Виявлення overflow, яким володіє провайдер |
      | 27 | `classifyFailoverReason` | Класифікація rate-limit/overload, якою володіє провайдер |
      | 28 | `isCacheTtlEligible` | Gating TTL для кешу prompt |
      | 29 | `buildMissingAuthMessage` | Користувацька підказка про відсутній auth |
      | 30 | `suppressBuiltInModel` | Приховати застарілі upstream-рядки |
      | 31 | `augmentModelCatalog` | Синтетичні рядки для forward-compat |
      | 32 | `resolveThinkingProfile` | Набір опцій `/think`, специфічний для моделі |
      | 33 | `isBinaryThinking` | Сумісність binary thinking on/off |
      | 34 | `supportsXHighThinking` | Сумісність підтримки reasoning `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | Сумісність типової політики `/think` |
      | 36 | `isModernModelRef` | Зіставлення live/smoke моделей |
      | 37 | `prepareRuntimeAuth` | Обмін токенів до inference |
      | 38 | `resolveUsageAuth` | Користувацький розбір credentials usage |
      | 39 | `fetchUsageSnapshot` | Користувацький ендпоінт usage |
      | 40 | `createEmbeddingProvider` | Адаптер embeddings, яким володіє провайдер, для memory/search |
      | 41 | `buildReplayPolicy` | Користувацька політика replay/Compaction транскриптів |
      | 42 | `sanitizeReplayHistory` | Перезаписи replay, специфічні для провайдера, після узагальненого очищення |
      | 43 | `validateReplayTurns` | Сувора перевірка replay-turn до embedded runner |
      | 44 | `onModelSelected` | Зворотний виклик після вибору (наприклад, telemetry) |

      Примітки щодо runtime fallback:

      - `normalizeConfig` спочатку перевіряє зіставлений провайдер, а потім інші plugins провайдерів із hook-capability, доки хтось справді не змінить config. Якщо жоден hook провайдера не переписує підтримуваний запис config сімейства Google, усе одно застосовується вбудований нормалізатор config Google.
      - `resolveConfigApiKey` використовує hook провайдера, коли він доступний. Вбудований шлях `amazon-bedrock` також має тут вбудований resolver AWS env-marker, навіть попри те, що runtime auth Bedrock і надалі використовує default chain AWS SDK.
      - `resolveSystemPromptContribution` дає провайдеру змогу ін’єктувати підказки системного prompt, чутливі до кешу, для сімейства моделей. Надавайте йому перевагу над `before_prompt_build`, коли поведінка належить одному family провайдера/моделі й має зберігати стабільний/динамічний поділ кешу.

      Докладні описи та реальні приклади див. у [Internals: Provider Runtime Hooks](/uk/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Додайте додаткові можливості (необов’язково)">
    Plugin провайдера може реєструвати speech, realtime transcription, realtime
    voice, media understanding, image generation, video generation, web fetch
    і web search поряд із текстовим inference. OpenClaw класифікує це як
    plugin **hybrid-capability** — рекомендований шаблон для корпоративних plugins
    (один plugin на vendor). Див.
    [Internals: Capability Ownership](/uk/plugins/architecture#capability-ownership-model).

    Реєструйте кожну можливість усередині `register(api)` поруч із наявним
    викликом `api.registerProvider(...)`. Обирайте лише ті вкладки, які вам потрібні:

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
      <Tab title="Realtime transcription">
        Надавайте перевагу `createRealtimeTranscriptionWebSocketSession(...)` — спільний
        helper обробляє захоплення proxy, backoff при повторному підключенні, flush під час закриття, ready-handshake, черги аудіо та діагностику подій закриття. Ваш plugin
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

        Пакетні STT-провайдери, які надсилають multipart-аудіо через POST, мають використовувати
        `buildAudioTranscriptionFormData(...)` з
        `openclaw/plugin-sdk/provider-http`. Helper нормалізує
        імена файлів для завантаження, включно з AAC-завантаженнями, яким потрібне ім’я файла у стилі M4A для
        сумісних API транскрипції.
      </Tab>
      <Tab title="Realtime voice">
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
        Можливості відео використовують **форму, чутливу до режиму**: `generate`,
        `imageToVideo` і `videoToVideo`. Плоских агрегованих полів на кшталт
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` недостатньо, щоб
        чисто оголосити підтримку режимів перетворення або вимкнені режими.
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

Plugins провайдерів публікуються так само, як і будь-який інший зовнішній code plugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Не використовуйте тут застарілий псевдонім публікації лише для Skills; пакети plugin слід публікувати через
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

## Довідник щодо порядку catalog

`catalog.order` керує тим, коли ваш catalog зливається відносно вбудованих
провайдерів:

| Порядок   | Коли          | Випадок використання                           |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | Перший прохід | Звичайні провайдери з API-ключем               |
| `profile` | Після simple  | Провайдери, обмежені auth profiles             |
| `paired`  | Після profile | Синтез кількох пов’язаних записів              |
| `late`    | Останній прохід | Перевизначення наявних провайдерів (перемагає при колізії) |

## Наступні кроки

- [Plugins каналів](/uk/plugins/sdk-channel-plugins) — якщо ваш plugin також надає канал
- [SDK Runtime](/uk/plugins/sdk-runtime) — helpers `api.runtime` (TTS, search, subagent)
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник підшляхів імпорту
- [Внутрішня архітектура plugin](/uk/plugins/architecture#provider-runtime-hooks) — деталі hooks і вбудовані приклади
