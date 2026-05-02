---
read_when:
    - شما در حال ساخت یک Plugin ارائه‌دهندهٔ مدل جدید هستید
    - می‌خواهید یک پروکسی سازگار با OpenAI یا مدل زبانی بزرگ سفارشی به OpenClaw اضافه کنید
    - باید احراز هویت ارائه‌دهنده، کاتالوگ‌ها و هوک‌های زمان اجرا را درک کنید
sidebarTitle: Provider plugins
summary: راهنمای گام‌به‌گام برای ساخت Plugin ارائه‌دهندهٔ مدل برای OpenClaw
title: ساخت Plugin‌های ارائه‌دهنده
x-i18n:
    generated_at: "2026-05-02T22:23:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7cca1dcf2f0a34fd05c696149fef42ff8fecf1ca1fe0ccc63ba96212a9889fe
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

این راهنما روند ساخت یک Plugin ارائه‌دهنده را توضیح می‌دهد که یک ارائه‌دهنده مدل
(LLM) را به OpenClaw اضافه می‌کند. در پایان، یک ارائه‌دهنده با کاتالوگ مدل،
احراز هویت با کلید API، و تفکیک پویای مدل خواهید داشت.

<Info>
  اگر پیش از این هیچ Plugin برای OpenClaw نساخته‌اید، ابتدا
  [شروع کار](/fa/plugins/building-plugins) را برای ساختار پایه بسته
  و تنظیم manifest بخوانید.
</Info>

<Tip>
  Pluginهای ارائه‌دهنده، مدل‌ها را به حلقه عادی استنتاج OpenClaw اضافه می‌کنند. اگر مدل
  باید از طریق یک daemon عامل بومی اجرا شود که مالک رشته‌ها، Compaction، یا رویدادهای ابزار
  است، ارائه‌دهنده را با یک [مهار عامل](/fa/plugins/sdk-agent-harness)
  جفت کنید، به‌جای اینکه جزئیات پروتکل daemon را در هسته قرار دهید.
</Tip>

## راهنمای گام‌به‌گام

<Steps>
  <Step title="بسته و manifest">
    ### گام ۱: بسته و manifest

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

    manifest، `providerAuthEnvVars` را اعلام می‌کند تا OpenClaw بتواند
    اعتبارنامه‌ها را بدون بارگذاری runtime Plugin شما تشخیص دهد. زمانی `providerAuthAliases`
    را اضافه کنید که یک گونه ارائه‌دهنده باید از احراز هویت شناسه ارائه‌دهنده دیگری دوباره استفاده کند. `modelSupport`
    اختیاری است و به OpenClaw اجازه می‌دهد Plugin ارائه‌دهنده شما را از روی شناسه‌های کوتاه‌شده
    مدل مانند `acme-large` پیش از وجود hookهای runtime به‌صورت خودکار بارگذاری کند. اگر
    ارائه‌دهنده را روی ClawHub منتشر می‌کنید، فیلدهای `openclaw.compat` و `openclaw.build`
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

    این یک ارائه‌دهنده عملیاتی است. کاربران اکنون می‌توانند
    `openclaw onboard --acme-ai-api-key <key>` را اجرا کنند و
    `acme-ai/acme-large` را به‌عنوان مدل خود انتخاب کنند.

    اگر ارائه‌دهنده بالادستی از توکن‌های کنترلی متفاوتی نسبت به OpenClaw استفاده می‌کند، به‌جای
    جایگزین کردن مسیر stream، یک تبدیل متن کوچک دوسویه اضافه کنید:

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

    `input`، پرامپت سیستمی نهایی و محتوای پیام متنی را پیش از
    انتقال بازنویسی می‌کند. `output`، دلتاهای متن دستیار و متن نهایی را پیش از اینکه
    OpenClaw نشانگرهای کنترلی خودش یا تحویل کانال را parse کند بازنویسی می‌کند.

    برای ارائه‌دهنده‌های bundled که فقط یک ارائه‌دهنده متن با احراز هویت کلید API
    به‌همراه یک runtime پشتیبانی‌شده با کاتالوگ واحد ثبت می‌کنند، از helper محدودتر
    `defineSingleProviderPluginEntry(...)` استفاده کنید:

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

    `buildProvider` مسیر کاتالوگ زنده‌ای است که وقتی OpenClaw بتواند احراز هویت واقعی
    ارائه‌دهنده را تفکیک کند استفاده می‌شود. این مسیر می‌تواند کشف ویژه ارائه‌دهنده انجام دهد. از
    `buildStaticProvider` فقط برای ردیف‌های آفلاینی استفاده کنید که نمایش آن‌ها پیش از پیکربندی احراز هویت
    امن است؛ نباید به اعتبارنامه نیاز داشته باشد یا درخواست شبکه انجام دهد.
    نمایش `models list --all` در OpenClaw در حال حاضر کاتالوگ‌های static را
    فقط برای Pluginهای ارائه‌دهنده bundled اجرا می‌کند، با config خالی، env خالی، و بدون
    مسیرهای عامل/workspace.

    اگر جریان احراز هویت شما همچنین باید `models.providers.*`، aliasها، و
    مدل پیش‌فرض عامل را هنگام onboarding وصله کند، از helperهای preset در
    `openclaw/plugin-sdk/provider-onboard` استفاده کنید. محدودترین helperها عبارت‌اند از
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)`, و
    `createModelCatalogPresetAppliers(...)`.

    وقتی endpoint بومی یک ارائه‌دهنده از بلوک‌های usage در حالت streamed روی
    انتقال عادی `openai-completions` پشتیبانی می‌کند، به‌جای hardcode کردن
    بررسی‌های شناسه ارائه‌دهنده، helperهای کاتالوگ مشترک در
    `openclaw/plugin-sdk/provider-catalog-shared` را ترجیح دهید. `supportsNativeStreamingUsageCompat(...)` و
    `applyProviderNativeStreamingUsageCompat(...)` پشتیبانی را از
    نگاشت قابلیت endpoint تشخیص می‌دهند، بنابراین endpointهای بومی سبک Moonshot/DashScope همچنان
    opt in می‌کنند، حتی وقتی یک Plugin از شناسه ارائه‌دهنده سفارشی استفاده می‌کند.

  </Step>

  <Step title="افزودن تفکیک پویای مدل">
    اگر ارائه‌دهنده شما شناسه‌های مدل دلخواه را می‌پذیرد (مانند proxy یا router)،
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

    اگر تفکیک به یک فراخوانی شبکه نیاز دارد، از `prepareDynamicModel` برای warm-up
    غیرهمزمان استفاده کنید — `resolveDynamicModel` پس از کامل شدن آن دوباره اجرا می‌شود.

  </Step>

  <Step title="افزودن hookهای runtime (در صورت نیاز)">
    بیشتر ارائه‌دهنده‌ها فقط به `catalog` + `resolveDynamicModel` نیاز دارند. hookها را
    به‌تدریج و طبق نیاز ارائه‌دهنده خود اضافه کنید.

    builderهای helper مشترک اکنون رایج‌ترین خانواده‌های replay/سازگاری ابزار را پوشش می‌دهند،
    بنابراین Pluginها معمولاً نیازی ندارند هر hook را یکی‌یکی دستی سیم‌کشی کنند:

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

    خانواده‌های replay موجود امروز:

    | خانواده | آنچه متصل می‌کند | نمونه‌های bundled |
    | --- | --- | --- |
    | `openai-compatible` | سیاست replay مشترک سبک OpenAI برای انتقال‌های سازگار با OpenAI، شامل پاک‌سازی شناسه tool-call، اصلاح ترتیب assistant-first، و اعتبارسنجی عمومی نوبت Gemini در جایی که انتقال به آن نیاز دارد | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | سیاست replay آگاه از Claude که با `modelId` انتخاب می‌شود، تا انتقال‌های پیام Anthropic فقط زمانی پاک‌سازی thinking-block ویژه Claude را دریافت کنند که مدل تفکیک‌شده واقعاً یک شناسه Claude باشد | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | سیاست replay بومی Gemini به‌همراه پاک‌سازی bootstrap replay و حالت خروجی reasoning برچسب‌گذاری‌شده | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | پاک‌سازی thought-signature برای مدل‌های Gemini که از طریق انتقال‌های proxy سازگار با OpenAI اجرا می‌شوند؛ اعتبارسنجی replay بومی Gemini یا بازنویسی‌های bootstrap را فعال نمی‌کند | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | سیاست hybrid برای ارائه‌دهنده‌هایی که سطوح مدل پیام Anthropic و سازگار با OpenAI را در یک Plugin ترکیب می‌کنند؛ حذف اختیاری thinking-block فقط Claude محدود به سمت Anthropic باقی می‌ماند | `minimax` |

    خانواده‌های stream موجود امروز:

    | خانواده | چه چیزی را متصل می‌کند | نمونه‌های بسته‌شده |
    | --- | --- | --- |
    | `google-thinking` | عادی‌سازی payload تفکر Gemini در مسیر stream مشترک | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | پوشش‌دهنده استدلال Kilo در مسیر stream پراکسی مشترک، همراه با رد کردن تزریق تفکر برای `kilo/auto` و شناسه‌های استدلال پراکسی پشتیبانی‌نشده | `kilocode` |
    | `moonshot-thinking` | نگاشت payload تفکر بومی دودویی Moonshot از پیکربندی + سطح `/think` | `moonshot` |
    | `minimax-fast-mode` | بازنویسی مدل حالت سریع MiniMax در مسیر stream مشترک | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | پوشش‌دهنده‌های مشترک Responses بومی OpenAI/Codex: سرآیندهای انتساب، `/fast`/`serviceTier`، پُرگویی متن، جست‌وجوی وب بومی Codex، شکل‌دهی payload سازگار با استدلال، و مدیریت زمینه Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | پوشش‌دهنده استدلال OpenRouter برای مسیرهای پراکسی، با مدیریت مرکزی رد کردن مدل‌های پشتیبانی‌نشده/`auto` | `openrouter` |
    | `tool-stream-default-on` | پوشش‌دهنده `tool_stream` پیش‌فرض‌روشن برای ارائه‌دهندگانی مانند Z.AI که می‌خواهند streaming ابزار فعال باشد مگر اینکه صراحتا غیرفعال شود | `zai` |

    <Accordion title="درزهای SDK که سازنده‌های خانواده را نیرو می‌دهند">
      هر سازنده خانواده از کمک‌کننده‌های عمومی سطح پایین‌تر تشکیل شده که از همان بسته export می‌شوند و وقتی یک ارائه‌دهنده باید از الگوی رایج خارج شود می‌توانید سراغشان بروید:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)`، و سازنده‌های replay خام (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). همچنین کمک‌کننده‌های replay مربوط به Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) و کمک‌کننده‌های endpoint/model (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`) را export می‌کند.
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`، به‌علاوه پوشش‌دهنده‌های مشترک OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`)، پوشش‌دهنده سازگار با OpenAI برای DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`)، پاک‌سازی prefill تفکر Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`)، و پوشش‌دهنده‌های مشترک پراکسی/ارائه‌دهنده (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`، کمک‌کننده‌های زیربنایی schema برای Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`)، و کمک‌کننده‌های سازگاری xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Plugin بسته‌شده xAI از `normalizeResolvedModel` + `contributeResolvedModelCompat` همراه با این‌ها استفاده می‌کند تا قوانین xAI در مالکیت ارائه‌دهنده بمانند.

      بعضی کمک‌کننده‌های stream عمدا محلیِ ارائه‌دهنده می‌مانند. `@openclaw/anthropic-provider`، `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` و سازنده‌های پوشش‌دهنده Anthropic در سطح پایین‌تر را در درز عمومی `api.ts` / `contract-api.ts` خودش نگه می‌دارد، چون مدیریت Claude OAuth beta و gating مربوط به `context1m` را کدگذاری می‌کنند. Plugin مربوط به xAI نیز به شکل مشابه شکل‌دهی Responses بومی xAI را در `wrapStreamFn` خودش نگه می‌دارد (نام‌های مستعار `/fast`، `tool_stream` پیش‌فرض، پاک‌سازی strict-tool پشتیبانی‌نشده، حذف payload استدلال ویژه xAI).

      همین الگوی ریشه بسته همچنین پشتوانه `@openclaw/openai-provider` (سازنده‌های ارائه‌دهنده، کمک‌کننده‌های مدل پیش‌فرض، سازنده‌های ارائه‌دهنده realtime) و `@openclaw/openrouter-provider` (سازنده ارائه‌دهنده به‌علاوه کمک‌کننده‌های onboarding/config) است.
    </Accordion>

    <Tabs>
      <Tab title="تبادل توکن">
        برای ارائه‌دهندگانی که پیش از هر فراخوانی inference به تبادل توکن نیاز دارند:

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
        برای ارائه‌دهندگانی که به سرآیندهای درخواست سفارشی یا تغییرات body نیاز دارند:

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
        برای ارائه‌دهندگانی که به سرآیندهای درخواست/نشست یا metadata بومی روی
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
      <Tab title="مصرف و صورتحساب">
        برای ارائه‌دهندگانی که داده‌های مصرف/صورتحساب را آشکار می‌کنند:

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

    <Accordion title="همه hookهای ارائه‌دهنده موجود">
      OpenClaw هوک‌ها را به این ترتیب فراخوانی می‌کند. بیشتر ارائه‌دهنده‌ها فقط از ۲-۳ مورد استفاده می‌کنند:
      فیلدهای ارائه‌دهنده صرفا سازگاری که OpenClaw دیگر فراخوانی نمی‌کند، مانند
      `ProviderPlugin.capabilities` و `suppressBuiltInModel`، اینجا فهرست نشده‌اند.

      | # | هوک | زمان استفاده |
      | --- | --- | --- |
      | 1 | `catalog` | کاتالوگ مدل یا پیش‌فرض‌های URL پایه |
      | 2 | `applyConfigDefaults` | پیش‌فرض‌های سراسری متعلق به ارائه‌دهنده هنگام materialization پیکربندی |
      | 3 | `normalizeModelId` | پاک‌سازی نام مستعار model-id قدیمی/preview پیش از lookup |
      | 4 | `normalizeTransport` | پاک‌سازی `api` / `baseUrl` خانواده ارائه‌دهنده پیش از assembly عمومی مدل |
      | 5 | `normalizeConfig` | عادی‌سازی پیکربندی `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | بازنویسی‌های سازگاری streaming-usage بومی برای ارائه‌دهنده‌های پیکربندی |
      | 7 | `resolveConfigApiKey` | حل احراز هویت env-marker متعلق به ارائه‌دهنده |
      | 8 | `resolveSyntheticAuth` | احراز هویت مصنوعی محلی/self-hosted یا مبتنی بر پیکربندی |
      | 9 | `shouldDeferSyntheticProfileAuth` | پایین آوردن placeholderهای synthetic stored-profile پشت احراز هویت env/config |
      | 10 | `resolveDynamicModel` | پذیرش شناسه‌های دلخواه مدل upstream |
      | 11 | `prepareDynamicModel` | واکشی async metadata پیش از resolving |
      | 12 | `normalizeResolvedModel` | بازنویسی‌های transport پیش از runner |
      | 13 | `contributeResolvedModelCompat` | پرچم‌های سازگاری برای مدل‌های vendor پشت یک transport سازگار دیگر |
      | 14 | `normalizeToolSchemas` | پاک‌سازی tool-schema متعلق به ارائه‌دهنده پیش از registration |
      | 15 | `inspectToolSchemas` | diagnostics مربوط به tool-schema متعلق به ارائه‌دهنده |
      | 16 | `resolveReasoningOutputMode` | قرارداد خروجی استدلال tagged در برابر native |
      | 17 | `prepareExtraParams` | پارامترهای پیش‌فرض درخواست |
      | 18 | `createStreamFn` | transport کاملا سفارشی StreamFn |
      | 19 | `wrapStreamFn` | پوشش‌دهنده‌های سرآیند/body سفارشی روی مسیر stream عادی |
      | 20 | `resolveTransportTurnState` | سرآیندها/metadata بومی per-turn |
      | 21 | `resolveWebSocketSessionPolicy` | سرآیندهای نشست WS بومی/cool-down |
      | 22 | `formatApiKey` | شکل توکن runtime سفارشی |
      | 23 | `refreshOAuth` | refresh سفارشی OAuth |
      | 24 | `buildAuthDoctorHint` | راهنمایی تعمیر احراز هویت |
      | 25 | `matchesContextOverflowError` | تشخیص overflow متعلق به ارائه‌دهنده |
      | 26 | `classifyFailoverReason` | طبقه‌بندی rate-limit/overload متعلق به ارائه‌دهنده |
      | 27 | `isCacheTtlEligible` | gating مربوط به TTL کش prompt |
      | 28 | `buildMissingAuthMessage` | راهنمای سفارشی احراز هویتِ موجود نیست |
      | 29 | `augmentModelCatalog` | ردیف‌های forward-compat مصنوعی |
      | 30 | `resolveThinkingProfile` | مجموعه گزینه `/think` ویژه مدل |
      | 31 | `isBinaryThinking` | سازگاری روشن/خاموش تفکر دودویی |
      | 32 | `supportsXHighThinking` | سازگاری پشتیبانی از استدلال `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | سازگاری policy پیش‌فرض `/think` |
      | 34 | `isModernModelRef` | تطبیق مدل live/smoke |
      | 35 | `prepareRuntimeAuth` | تبادل توکن پیش از inference |
      | 36 | `resolveUsageAuth` | parsing اعتبارنامه مصرف سفارشی |
      | 37 | `fetchUsageSnapshot` | endpoint مصرف سفارشی |
      | 38 | `createEmbeddingProvider` | adapter embedding متعلق به ارائه‌دهنده برای memory/search |
      | 39 | `buildReplayPolicy` | policy سفارشی replay/Compaction رونوشت |
      | 40 | `sanitizeReplayHistory` | بازنویسی‌های replay ویژه ارائه‌دهنده پس از پاک‌سازی عمومی |
      | 41 | `validateReplayTurns` | اعتبارسنجی سخت‌گیرانه replay-turn پیش از runner تعبیه‌شده |
      | 42 | `onModelSelected` | callback پس از انتخاب (مثلا telemetry) |

      یادداشت‌های fallback در runtime:

      - `normalizeConfig` ابتدا ارائه‌دهنده منطبق را بررسی می‌کند، سپس سایر Pluginهای ارائه‌دهنده دارای hook را تا زمانی که یکی واقعا پیکربندی را تغییر دهد. اگر هیچ hook ارائه‌دهنده‌ای یک ورودی پیکربندی پشتیبانی‌شده از خانواده Google را بازنویسی نکند، عادی‌ساز پیکربندی Google بسته‌شده همچنان اعمال می‌شود.
      - `resolveConfigApiKey` وقتی hook ارائه‌دهنده آشکار شده باشد از آن استفاده می‌کند. مسیر بسته‌شده `amazon-bedrock` نیز اینجا یک resolver داخلی env-marker برای AWS دارد، هرچند خود احراز هویت runtime مربوط به Bedrock همچنان از زنجیره پیش‌فرض AWS SDK استفاده می‌کند.
      - `resolveSystemPromptContribution` به ارائه‌دهنده اجازه می‌دهد راهنمایی system-prompt آگاه از کش را برای یک خانواده مدل inject کند. وقتی رفتار به یک خانواده ارائه‌دهنده/مدل تعلق دارد و باید جداسازی پایدار/پویا در کش را حفظ کند، آن را به `before_prompt_build` ترجیح دهید.

      برای توضیحات مفصل و نمونه‌های واقعی، [داخلی‌ها: Hookهای Runtime ارائه‌دهنده](/fa/plugins/architecture-internals#provider-runtime-hooks) را ببینید.
    </Accordion>

  </Step>

  <Step title="افزودن قابلیت‌های اضافی (اختیاری)">
    ### گام ۵: افزودن قابلیت‌های اضافی

    یک Plugin ارائه‌دهنده می‌تواند گفتار، رونویسی realtime، صدای realtime، درک رسانه، تولید تصویر، تولید ویدیو، واکشی وب،
    و جست‌وجوی وب را در کنار inference متنی ثبت کند. OpenClaw این را به‌عنوان یک
    Plugin با **hybrid-capability** طبقه‌بندی می‌کند — الگوی توصیه‌شده برای Pluginهای شرکتی
    (یک Plugin برای هر vendor). ببینید
    [داخلی‌ها: مالکیت قابلیت](/fa/plugins/architecture#capability-ownership-model).

    هر قابلیت را داخل `register(api)` در کنار فراخوانی موجود
    `api.registerProvider(...)` خود ثبت کنید. فقط tabهایی را انتخاب کنید که نیاز دارید:

    <Tabs>
      <Tab title="گفتار (TTS)">
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
        Pluginها خواندن محدودشدهٔ بدنهٔ خطا، تجزیهٔ خطای JSON و
        پسوندهای شناسهٔ درخواست را به‌صورت مشترک به‌کار ببرند.
      </Tab>
      <Tab title="رونویسی بلادرنگ">
        `createRealtimeTranscriptionWebSocketSession(...)` را ترجیح دهید؛ راهکار کمکی مشترک
        ثبت پروکسی، عقب‌نشینی اتصال مجدد، تخلیه هنگام بستن، دست‌دهی‌های آماده‌بودن،
        صف‌بندی صدا و عیب‌یابی رویداد بستن را مدیریت می‌کند. Plugin شما
        فقط رویدادهای بالادست را نگاشت می‌کند.

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

        ارائه‌دهنده‌های دسته‌ای STT که صدای چندبخشی را POST می‌کنند باید از
        `buildAudioTranscriptionFormData(...)` از
        `openclaw/plugin-sdk/provider-http` استفاده کنند. این راهکار کمکی نام فایل‌های آپلود را
        نرمال‌سازی می‌کند، از جمله آپلودهای AAC که برای APIهای رونویسی سازگار
        به نام فایل سبک M4A نیاز دارند.
      </Tab>
      <Tab title="صدای بلادرنگ">
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

        وقتی یک انتقال می‌تواند تشخیص دهد که انسان در حال قطع پخش دستیار است
        و ارائه‌دهنده از کوتاه‌کردن یا پاک‌کردن پاسخ صوتی فعال پشتیبانی می‌کند،
        `handleBargeIn` را پیاده‌سازی کنید.
      </Tab>
      <Tab title="درک رسانه">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="تولید تصویر و ویدیو">
        قابلیت‌های ویدیو از شکلی **آگاه به حالت** استفاده می‌کنند: `generate`،
        `imageToVideo` و `videoToVideo`. فیلدهای تجمیعی تخت مانند
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` برای
        اعلام پشتیبانی از حالت تبدیل یا حالت‌های غیرفعال‌شده به‌صورت تمیز کافی نیستند.
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
      <Tab title="واکشی و جست‌وجوی وب">
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

  <Step title="آزمایش">
    ### گام ۶: آزمایش

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

Pluginهای ارائه‌دهنده مانند هر Plugin کد خارجی دیگری منتشر می‌شوند:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

اینجا از نام مستعار انتشار قدیمیِ فقط مخصوص Skills استفاده نکنید؛ بسته‌های Plugin باید از
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

`catalog.order` کنترل می‌کند کاتالوگ شما نسبت به ارائه‌دهنده‌های داخلی
چه زمانی ادغام شود:

| ترتیب     | زمان          | مورد استفاده                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | گذر نخست    | ارائه‌دهنده‌های سادهٔ کلید API                         |
| `profile` | پس از simple  | ارائه‌دهنده‌های وابسته به پروفایل‌های احراز هویت                |
| `paired`  | پس از profile | ساخت چند ورودی مرتبط             |
| `late`    | گذر آخر     | بازنویسی ارائه‌دهنده‌های موجود (در برخورد برنده می‌شود) |

## گام‌های بعدی

- [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) — اگر Plugin شما یک کانال نیز ارائه می‌کند
- [زمان اجرای SDK](/fa/plugins/sdk-runtime) — راهکارهای کمکی `api.runtime` (TTS، جست‌وجو، زیرعامل)
- [نمای کلی SDK](/fa/plugins/sdk-overview) — مرجع کامل import زیرمسیرها
- [جزئیات داخلی Plugin](/fa/plugins/architecture-internals#provider-runtime-hooks) — جزئیات hook و نمونه‌های همراه

## مرتبط

- [راه‌اندازی Plugin SDK](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [ساخت Pluginهای کانال](/fa/plugins/sdk-channel-plugins)
