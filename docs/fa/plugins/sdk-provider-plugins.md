---
read_when:
    - شما در حال ساخت یک Plugin جدید ارائه‌دهندهٔ مدل هستید
    - می‌خواهید یک پروکسی سازگار با OpenAI یا LLM سفارشی به OpenClaw اضافه کنید
    - باید احراز هویت ارائه‌دهنده، کاتالوگ‌ها و هوک‌های زمان اجرا را درک کنید
sidebarTitle: Provider plugins
summary: راهنمای گام‌به‌گام برای ساخت یک Plugin ارائه‌دهندهٔ مدل برای OpenClaw
title: ساخت Pluginهای ارائه‌دهنده
x-i18n:
    generated_at: "2026-04-29T23:19:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1404594fe1d1e11a612f903512c1002c8f3a804dee53d4204457b534eae93381
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

این راهنما روند ساخت یک Plugin ارائه‌دهنده را توضیح می‌دهد که یک ارائه‌دهنده مدل
(LLM) را به OpenClaw اضافه می‌کند. در پایان، یک ارائه‌دهنده با کاتالوگ مدل،
احراز هویت کلید API، و تفکیک پویای مدل خواهید داشت.

<Info>
  اگر پیش‌تر هیچ Pluginای برای OpenClaw نساخته‌اید، ابتدا
  [شروع کار](/fa/plugins/building-plugins) را برای ساختار پایه بسته
  و راه‌اندازی مانیفست بخوانید.
</Info>

<Tip>
  Pluginهای ارائه‌دهنده مدل‌ها را به حلقه استنتاج عادی OpenClaw اضافه می‌کنند. اگر مدل
  باید از طریق یک daemon عامل بومی اجرا شود که مالک نخ‌ها، Compaction، یا رویدادهای ابزار
  است، ارائه‌دهنده را به‌جای قرار دادن جزئیات پروتکل daemon در هسته، با یک [مهار عامل](/fa/plugins/sdk-agent-harness)
  همراه کنید.
</Tip>

## راهنما

<Steps>
  <Step title="بسته و مانیفست">
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

    مانیفست `providerAuthEnvVars` را اعلام می‌کند تا OpenClaw بتواند
    اعتبارنامه‌ها را بدون بارگذاری runtime مربوط به Plugin شما تشخیص دهد. وقتی یک گونه ارائه‌دهنده باید از احراز هویت شناسه ارائه‌دهنده‌ای دیگر دوباره استفاده کند، `providerAuthAliases`
    را اضافه کنید. `modelSupport`
    اختیاری است و به OpenClaw اجازه می‌دهد Plugin ارائه‌دهنده شما را از شناسه‌های کوتاه مدل
    مانند `acme-large` پیش از وجود hookهای runtime به‌صورت خودکار بارگذاری کند. اگر ارائه‌دهنده را
    در ClawHub منتشر می‌کنید، فیلدهای `openclaw.compat` و `openclaw.build`
    در `package.json` الزامی هستند.

  </Step>

  <Step title="ثبت ارائه‌دهنده">
    یک ارائه‌دهنده حداقلی به `id`، `label`، `auth`، و `catalog` نیاز دارد:

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

    این یک ارائه‌دهنده قابل استفاده است. کاربران اکنون می‌توانند
    `openclaw onboard --acme-ai-api-key <key>` را اجرا کنند و
    `acme-ai/acme-large` را به‌عنوان مدل خود انتخاب کنند.

    اگر ارائه‌دهنده بالادستی از توکن‌های کنترلی متفاوتی نسبت به OpenClaw استفاده می‌کند، به‌جای جایگزین کردن مسیر stream،
    یک تبدیل متنی دوطرفه کوچک اضافه کنید:

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

    `input` پیش از انتقال، prompt نهایی سیستم و محتوای پیام متنی را بازنویسی می‌کند.
    `output` دلتاهای متن دستیار و متن نهایی را پیش از اینکه
    OpenClaw نشانگرهای کنترلی خودش یا تحویل کانال را تحلیل کند، بازنویسی می‌کند.

    برای ارائه‌دهنده‌های همراه که فقط یک ارائه‌دهنده متن را با احراز هویت کلید API
    به‌علاوه یک runtime تکی مبتنی بر کاتالوگ ثبت می‌کنند، helper محدودتر
    `defineSingleProviderPluginEntry(...)` را ترجیح دهید:

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

    `buildProvider` مسیر کاتالوگ زنده‌ای است که وقتی OpenClaw می‌تواند احراز هویت واقعی
    ارائه‌دهنده را تفکیک کند استفاده می‌شود. ممکن است کشف اختصاصی ارائه‌دهنده را انجام دهد. از
    `buildStaticProvider` فقط برای ردیف‌های آفلاینی استفاده کنید که پیش از پیکربندی احراز هویت
    نمایش آن‌ها امن است؛ این مسیر نباید به اعتبارنامه نیاز داشته باشد یا درخواست شبکه ایجاد کند.
    نمایش فعلی `models list --all` در OpenClaw کاتالوگ‌های static را
    فقط برای Pluginهای ارائه‌دهنده همراه، با config خالی، env خالی، و بدون
    مسیرهای agent/workspace اجرا می‌کند.

    اگر جریان احراز هویت شما همچنین باید `models.providers.*`، aliasها، و
    مدل پیش‌فرض عامل را هنگام onboarding وصله کند، از helperهای preset موجود در
    `openclaw/plugin-sdk/provider-onboard` استفاده کنید. محدودترین helperها
    `createDefaultModelPresetAppliers(...)`،
    `createDefaultModelsPresetAppliers(...)`، و
    `createModelCatalogPresetAppliers(...)` هستند.

    وقتی endpoint بومی یک ارائه‌دهنده از بلوک‌های usage استریم‌شده روی
    transport عادی `openai-completions` پشتیبانی می‌کند، به‌جای hardcode کردن
    بررسی‌های provider-id، helperهای کاتالوگ مشترک در
    `openclaw/plugin-sdk/provider-catalog-shared` را ترجیح دهید. `supportsNativeStreamingUsageCompat(...)` و
    `applyProviderNativeStreamingUsageCompat(...)` پشتیبانی را از
    نگاشت قابلیت endpoint تشخیص می‌دهند، بنابراین endpointهای بومی سبک Moonshot/DashScope همچنان
    حتی وقتی یک Plugin از شناسه ارائه‌دهنده سفارشی استفاده می‌کند، opt in می‌شوند.

  </Step>

  <Step title="افزودن تفکیک پویای مدل">
    اگر ارائه‌دهنده شما شناسه‌های دلخواه مدل را می‌پذیرد (مانند proxy یا router)،
    `resolveDynamicModel` را اضافه کنید:

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

    اگر تفکیک به تماس شبکه نیاز دارد، برای warm-up غیرهمزمان از `prepareDynamicModel`
    استفاده کنید — `resolveDynamicModel` پس از تکمیل آن دوباره اجرا می‌شود.

  </Step>

  <Step title="افزودن hookهای runtime (در صورت نیاز)">
    بیشتر ارائه‌دهنده‌ها فقط به `catalog` + `resolveDynamicModel` نیاز دارند. hookها را
    به‌تدریج و متناسب با نیاز ارائه‌دهنده خود اضافه کنید.

    helper builderهای مشترک اکنون رایج‌ترین خانواده‌های سازگاری replay/tool را پوشش می‌دهند،
    بنابراین Pluginها معمولاً نیازی ندارند هر hook را یکی‌یکی به‌صورت دستی سیم‌کشی کنند:

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

    خانواده‌های replay موجود در حال حاضر:

    | خانواده | آنچه سیم‌کشی می‌کند | نمونه‌های همراه |
    | --- | --- | --- |
    | `openai-compatible` | سیاست replay مشترک سبک OpenAI برای transportهای سازگار با OpenAI، شامل پاک‌سازی tool-call-id، اصلاح‌های ترتیب assistant-first، و اعتبارسنجی عمومی نوبت Gemini در جایی که transport به آن نیاز دارد | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | سیاست replay آگاه از Claude که بر اساس `modelId` انتخاب می‌شود، بنابراین transportهای پیام Anthropic فقط وقتی مدل تفکیک‌شده واقعاً یک شناسه Claude است، پاک‌سازی thinking-block اختصاصی Claude را دریافت می‌کنند | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | سیاست replay بومی Gemini به‌علاوه پاک‌سازی bootstrap replay و حالت reasoning-output برچسب‌گذاری‌شده | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | پاک‌سازی thought-signature مربوط به Gemini برای مدل‌های Gemini که از طریق transportهای proxy سازگار با OpenAI اجرا می‌شوند؛ اعتبارسنجی replay بومی Gemini یا بازنویسی‌های bootstrap را فعال نمی‌کند | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | سیاست ترکیبی برای ارائه‌دهنده‌هایی که سطح‌های مدل پیام Anthropic و سازگار با OpenAI را در یک Plugin ترکیب می‌کنند؛ حذف اختیاری thinking-block فقط برای Claude محدود به سمت Anthropic باقی می‌ماند | `minimax` |

    خانواده‌های stream موجود در حال حاضر:

    | خانواده | چه چیزی را متصل می‌کند | نمونه‌های همراه |
    | --- | --- | --- |
    | `google-thinking` | نرمال‌سازی payload تفکر Gemini در مسیر stream مشترک | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | wrapper استدلال Kilo در مسیر stream پروکسی مشترک، با رد کردن تفکر تزریق‌شده برای `kilo/auto` و شناسه‌های استدلال پروکسی پشتیبانی‌نشده | `kilocode` |
    | `moonshot-thinking` | نگاشت payload تفکر بومی دودویی Moonshot از config + سطح `/think` | `moonshot` |
    | `minimax-fast-mode` | بازنویسی مدل حالت سریع MiniMax در مسیر stream مشترک | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | wrapperهای مشترک Responses بومی OpenAI/Codex: سرآیندهای attribution، `/fast`/`serviceTier`، تفصیل متن، جست‌وجوی وب بومی Codex، شکل‌دهی payload سازگار با استدلال، و مدیریت context در Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | wrapper استدلال OpenRouter برای مسیرهای پروکسی، با رد کردن مدل‌های پشتیبانی‌نشده/`auto` به‌صورت متمرکز | `openrouter` |
    | `tool-stream-default-on` | wrapper پیش‌فرض روشن `tool_stream` برای ارائه‌دهنده‌هایی مانند Z.AI که stream ابزار را می‌خواهند مگر اینکه صریحا غیرفعال شده باشد | `zai` |

    <Accordion title="نقاط اتصال SDK که سازنده‌های خانواده را پشتیبانی می‌کنند">
      هر سازنده خانواده از helperهای عمومی سطح پایین‌تر که از همان package صادر می‌شوند ساخته شده است، و وقتی یک ارائه‌دهنده باید از الگوی مشترک فاصله بگیرد می‌توانید از آن‌ها استفاده کنید:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`، `buildProviderReplayFamilyHooks(...)`، و سازنده‌های خام replay (`buildOpenAICompatibleReplayPolicy`، `buildAnthropicReplayPolicyForModel`، `buildGoogleGeminiReplayPolicy`، `buildHybridAnthropicOrOpenAIReplayPolicy`). همچنین helperهای replay برای Gemini (`sanitizeGoogleGeminiReplayHistory`، `resolveTaggedReasoningOutputMode`) و helperهای endpoint/model (`resolveProviderEndpoint`، `normalizeProviderId`، `normalizeGooglePreviewModelId`، `normalizeNativeXaiModelId`) را صادر می‌کند.
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`، `buildProviderStreamFamilyHooks(...)`، `composeProviderStreamWrappers(...)`، به‌علاوه wrapperهای مشترک OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`، `createOpenAIFastModeWrapper`، `createOpenAIServiceTierWrapper`، `createOpenAIResponsesContextManagementWrapper`، `createCodexNativeWebSearchWrapper`)، wrapper سازگار با OpenAI برای DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`)، پاک‌سازی پیش‌پرکردن تفکر Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`)، و wrapperهای مشترک پروکسی/ارائه‌دهنده (`createOpenRouterWrapper`، `createToolStreamWrapper`، `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`، `buildProviderToolCompatFamilyHooks("gemini")`، helperهای زیربنایی schema برای Gemini (`normalizeGeminiToolSchemas`، `inspectGeminiToolSchemas`)، و helperهای سازگاری xAI (`resolveXaiModelCompatPatch()`، `applyXaiModelCompat(model)`). Plugin همراه xAI از `normalizeResolvedModel` + `contributeResolvedModelCompat` با این‌ها استفاده می‌کند تا قوانین xAI در مالکیت ارائه‌دهنده باقی بمانند.

      بعضی helperهای stream عمدا محلیِ ارائه‌دهنده باقی می‌مانند. `@openclaw/anthropic-provider`، `wrapAnthropicProviderStream`، `resolveAnthropicBetas`، `resolveAnthropicFastMode`، `resolveAnthropicServiceTier`، و سازنده‌های wrapper سطح پایین‌تر Anthropic را در نقطه اتصال عمومی `api.ts` / `contract-api.ts` خودش نگه می‌دارد، چون آن‌ها مدیریت Claude OAuth beta و gating مربوط به `context1m` را کدگذاری می‌کنند. Plugin xAI نیز به همین شکل، شکل‌دهی Responses بومی xAI را در `wrapStreamFn` خودش نگه می‌دارد (aliasهای `/fast`، پیش‌فرض `tool_stream`، پاک‌سازی ابزار سخت‌گیرانه پشتیبانی‌نشده، حذف payload استدلال ویژه xAI).

      همین الگوی ریشه package برای `@openclaw/openai-provider` (سازنده‌های ارائه‌دهنده، helperهای مدل پیش‌فرض، سازنده‌های ارائه‌دهنده realtime) و `@openclaw/openrouter-provider` (سازنده ارائه‌دهنده به‌علاوه helperهای onboarding/config) نیز پشتیبان است.
    </Accordion>

    <Tabs>
      <Tab title="تبادل توکن">
        برای ارائه‌دهنده‌هایی که پیش از هر فراخوانی inference به تبادل توکن نیاز دارند:

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
      <Tab title="سرآیندهای سفارشی">
        برای ارائه‌دهنده‌هایی که به سرآیندهای درخواست سفارشی یا تغییرات body نیاز دارند:

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
      <Tab title="هویت transport بومی">
        برای ارائه‌دهنده‌هایی که به سرآیندهای درخواست/نشست یا metadata بومی روی
        transportهای عمومی HTTP یا WebSocket نیاز دارند:

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
      <Tab title="استفاده و billing">
        برای ارائه‌دهنده‌هایی که داده‌های استفاده/billing را در معرض می‌گذارند:

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

    <Accordion title="همه hookهای موجود ارائه‌دهنده">
      OpenClaw hookها را به این ترتیب فراخوانی می‌کند. بیشتر ارائه‌دهنده‌ها فقط از ۲ تا ۳ مورد استفاده می‌کنند:
      فیلدهای ارائه‌دهنده صرفا سازگاری که OpenClaw دیگر فراخوانی نمی‌کند، مانند
      `ProviderPlugin.capabilities` و `suppressBuiltInModel`، اینجا فهرست نشده‌اند.

      | # | Hook | زمان استفاده |
      | --- | --- | --- |
      | 1 | `catalog` | catalog مدل یا پیش‌فرض‌های URL پایه |
      | 2 | `applyConfigDefaults` | پیش‌فرض‌های سراسری در مالکیت ارائه‌دهنده هنگام materialization پیکربندی |
      | 3 | `normalizeModelId` | پاک‌سازی alias شناسه مدل legacy/preview پیش از lookup |
      | 4 | `normalizeTransport` | پاک‌سازی `api` / `baseUrl` خانواده ارائه‌دهنده پیش از assembly عمومی مدل |
      | 5 | `normalizeConfig` | نرمال‌سازی config مربوط به `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | بازنویسی‌های سازگاری استفاده از stream بومی برای ارائه‌دهنده‌های config |
      | 7 | `resolveConfigApiKey` | حل auth نشانگر env در مالکیت ارائه‌دهنده |
      | 8 | `resolveSyntheticAuth` | auth مصنوعی محلی/self-hosted یا مبتنی بر config |
      | 9 | `shouldDeferSyntheticProfileAuth` | پایین‌تر بردن placeholderهای پروفایل ذخیره‌شده مصنوعی پشت auth env/config |
      | 10 | `resolveDynamicModel` | پذیرش شناسه‌های دلخواه مدل upstream |
      | 11 | `prepareDynamicModel` | دریافت async metadata پیش از resolve |
      | 12 | `normalizeResolvedModel` | بازنویسی‌های transport پیش از runner |
      | 13 | `contributeResolvedModelCompat` | flagهای سازگاری برای مدل‌های vendor پشت یک transport سازگار دیگر |
      | 14 | `normalizeToolSchemas` | پاک‌سازی schema ابزار در مالکیت ارائه‌دهنده پیش از registration |
      | 15 | `inspectToolSchemas` | diagnostics مربوط به schema ابزار در مالکیت ارائه‌دهنده |
      | 16 | `resolveReasoningOutputMode` | قرارداد خروجی استدلال tagged در برابر بومی |
      | 17 | `prepareExtraParams` | پارامترهای پیش‌فرض درخواست |
      | 18 | `createStreamFn` | transport کاملا سفارشی StreamFn |
      | 19 | `wrapStreamFn` | wrapperهای سرآیند/body سفارشی در مسیر stream معمولی |
      | 20 | `resolveTransportTurnState` | سرآیندها/metadata بومی برای هر turn |
      | 21 | `resolveWebSocketSessionPolicy` | سرآیندهای نشست WS/دوره cooldown |
      | 22 | `formatApiKey` | شکل توکن runtime سفارشی |
      | 23 | `refreshOAuth` | تازه‌سازی OAuth سفارشی |
      | 24 | `buildAuthDoctorHint` | راهنمایی تعمیر auth |
      | 25 | `matchesContextOverflowError` | تشخیص overflow در مالکیت ارائه‌دهنده |
      | 26 | `classifyFailoverReason` | طبقه‌بندی rate-limit/overload در مالکیت ارائه‌دهنده |
      | 27 | `isCacheTtlEligible` | gating مربوط به TTL cache prompt |
      | 28 | `buildMissingAuthMessage` | hint سفارشی برای auth مفقود |
      | 29 | `augmentModelCatalog` | ردیف‌های مصنوعی سازگار با آینده |
      | 30 | `resolveThinkingProfile` | مجموعه گزینه‌های `/think` ویژه مدل |
      | 31 | `isBinaryThinking` | سازگاری روشن/خاموش تفکر دودویی |
      | 32 | `supportsXHighThinking` | سازگاری پشتیبانی استدلال `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | سازگاری policy پیش‌فرض `/think` |
      | 34 | `isModernModelRef` | تطبیق مدل live/smoke |
      | 35 | `prepareRuntimeAuth` | تبادل توکن پیش از inference |
      | 36 | `resolveUsageAuth` | parsing credential سفارشی استفاده |
      | 37 | `fetchUsageSnapshot` | endpoint سفارشی استفاده |
      | 38 | `createEmbeddingProvider` | adapter embedding در مالکیت ارائه‌دهنده برای memory/search |
      | 39 | `buildReplayPolicy` | policy سفارشی replay/Compaction transcript |
      | 40 | `sanitizeReplayHistory` | بازنویسی‌های replay ویژه ارائه‌دهنده پس از پاک‌سازی عمومی |
      | 41 | `validateReplayTurns` | اعتبارسنجی سخت‌گیرانه replay-turn پیش از runner تعبیه‌شده |
      | 42 | `onModelSelected` | callback پس از انتخاب (برای مثال telemetry) |

      یادداشت‌های fallback در runtime:

      - `normalizeConfig` ابتدا ارائه‌دهنده منطبق را بررسی می‌کند، سپس سایر Pluginهای ارائه‌دهنده دارای hook را تا زمانی که یکی واقعا config را تغییر دهد. اگر هیچ hook ارائه‌دهنده‌ای یک ورودی config پشتیبانی‌شده خانواده Google را بازنویسی نکند، نرمال‌ساز config همراه Google همچنان اعمال می‌شود.
      - `resolveConfigApiKey` وقتی در معرض باشد از hook ارائه‌دهنده استفاده می‌کند. مسیر همراه `amazon-bedrock` نیز اینجا یک resolver داخلی نشانگر env برای AWS دارد، هرچند auth runtime خود Bedrock همچنان از زنجیره پیش‌فرض AWS SDK استفاده می‌کند.
      - `resolveSystemPromptContribution` به ارائه‌دهنده اجازه می‌دهد راهنمایی system-prompt آگاه از cache را برای یک خانواده مدل تزریق کند. وقتی رفتار متعلق به یک خانواده ارائه‌دهنده/مدل است و باید split پایدار/پویا cache را حفظ کند، آن را بر `before_prompt_build` ترجیح دهید.

      برای توضیحات دقیق و نمونه‌های واقعی، [جزئیات داخلی: Hookهای runtime ارائه‌دهنده](/fa/plugins/architecture-internals#provider-runtime-hooks) را ببینید.
    </Accordion>

  </Step>

  <Step title="افزودن قابلیت‌های اضافه (اختیاری)">
    یک Plugin ارائه‌دهنده می‌تواند گفتار، رونویسی realtime، صدای realtime، درک media، تولید تصویر، تولید ویدئو، fetch وب،
    و جست‌وجوی وب را در کنار inference متنی ثبت کند. OpenClaw این را یک
    Plugin با **قابلیت hybrid** طبقه‌بندی می‌کند — الگوی پیشنهادی برای Pluginهای شرکتی
    (یک Plugin برای هر vendor). ببینید:
    [جزئیات داخلی: مالکیت Capability](/fa/plugins/architecture#capability-ownership-model).

    هر capability را داخل `register(api)` در کنار فراخوانی موجود
    `api.registerProvider(...)` خود ثبت کنید. فقط tabهایی را انتخاب کنید که نیاز دارید:

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

        برای خطاهای HTTP ارائه‌دهنده از `assertOkOrThrowProviderError(...)` استفاده کنید تا
        Pluginها خواندن محدودشده بدنه خطا، تجزیه خطای JSON و
        پسوندهای شناسه درخواست را به‌صورت مشترک به‌کار ببرند.
      </Tab>
      <Tab title="Realtime transcription">
        `createRealtimeTranscriptionWebSocketSession(...)` را ترجیح دهید — کمک‌کننده مشترک
        ثبت پراکسی، عقب‌نشینی اتصال مجدد، تخلیه هنگام بستن، دست‌دهی آماده‌بودن،
        صف‌بندی صدا و عیب‌یابی رویداد بستن را مدیریت می‌کند. Plugin شما
        فقط رویدادهای بالادستی را نگاشت می‌کند.

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

        ارائه‌دهنده‌های STT دسته‌ای که صدای چندبخشی را POST می‌کنند باید از
        `buildAudioTranscriptionFormData(...)` از
        `openclaw/plugin-sdk/provider-http` استفاده کنند. این کمک‌کننده نام فایل‌های بارگذاری را
        عادی‌سازی می‌کند، از جمله بارگذاری‌های AAC که برای APIهای رونویسی سازگار
        به نام فایلی به سبک M4A نیاز دارند.
      </Tab>
      <Tab title="Realtime voice">
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
      <Tab title="Media understanding">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Image and video generation">
        قابلیت‌های ویدئو از شکلی **آگاه از حالت** استفاده می‌کنند: `generate`،
        `imageToVideo` و `videoToVideo`. فیلدهای تجمیعی تخت مانند
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` برای اعلام پشتیبانی از
        حالت تبدیل یا حالت‌های غیرفعال‌شده به‌صورت روشن کافی نیستند.
        تولید موسیقی نیز همین الگو را با بلوک‌های صریح `generate` /
        `edit` دنبال می‌کند.

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
          search: async (req) => ({ content: [] }),
        });
        ```
      </Tab>
    </Tabs>

  </Step>

  <Step title="Test">
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

## انتشار در ClawHub

Pluginهای ارائه‌دهنده همانند هر Plugin کد خارجی دیگری منتشر می‌شوند:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

اینجا از نام مستعار قدیمی مخصوص انتشار مهارت استفاده نکنید؛ بسته‌های Plugin باید از
`clawhub package publish` استفاده کنند.

## ساختار فایل

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with provider auth metadata
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## مرجع ترتیب کاتالوگ

`catalog.order` کنترل می‌کند کاتالوگ شما چه زمانی نسبت به ارائه‌دهنده‌های
داخلی ادغام شود:

| ترتیب     | زمان          | مورد استفاده                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | گذر نخست    | ارائه‌دهنده‌های ساده مبتنی بر کلید API                         |
| `profile` | پس از simple  | ارائه‌دهنده‌های وابسته به پروفایل‌های احراز هویت                |
| `paired`  | پس از profile | ساخت چند ورودی مرتبط             |
| `late`    | گذر آخر     | بازنویسی ارائه‌دهنده‌های موجود (در برخوردها برنده می‌شود) |

## مراحل بعدی

- [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) — اگر Plugin شما یک کانال هم ارائه می‌کند
- [زمان اجرای SDK](/fa/plugins/sdk-runtime) — کمک‌کننده‌های `api.runtime` (TTS، جستجو، زیرعامل)
- [نمای کلی SDK](/fa/plugins/sdk-overview) — مرجع کامل import زیرمسیرها
- [درون‌سازوکارهای Plugin](/fa/plugins/architecture-internals#provider-runtime-hooks) — جزئیات hookها و نمونه‌های همراه

## مرتبط

- [راه‌اندازی Plugin SDK](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [ساخت Pluginهای کانال](/fa/plugins/sdk-channel-plugins)
