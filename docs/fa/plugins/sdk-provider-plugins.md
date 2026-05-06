---
read_when:
    - شما در حال ساخت یک Plugin جدید برای ارائه‌دهنده مدل هستید
    - می‌خواهید یک پروکسی سازگار با OpenAI یا مدل زبانی بزرگ سفارشی به OpenClaw اضافه کنید
    - باید احراز هویت ارائه‌دهنده، کاتالوگ‌ها و هوک‌های زمان اجرا را درک کنید
sidebarTitle: Provider plugins
summary: راهنمای گام‌به‌گام ساخت Plugin ارائه‌دهندهٔ مدل برای OpenClaw
title: ساخت Pluginهای ارائه‌دهنده
x-i18n:
    generated_at: "2026-05-06T09:34:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f62f4b4df055412288b9d56f0344c76b9adfc3a04f3916eba37c04d22a3d808
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

این راهنما مراحل ساخت یک Plugin ارائه‌دهنده را توضیح می‌دهد که یک ارائه‌دهنده مدل
(LLM) را به OpenClaw اضافه می‌کند. در پایان، ارائه‌دهنده‌ای با کاتالوگ مدل،
احراز هویت با کلید API، و حل پویای مدل خواهید داشت.

<Info>
  اگر پیش از این هیچ Plugin برای OpenClaw نساخته‌اید، ابتدا
  [شروع به کار](/fa/plugins/building-plugins) را برای ساختار پایه بسته
  و تنظیم مانیفست بخوانید.
</Info>

<Tip>
  Pluginهای ارائه‌دهنده مدل‌ها را به حلقه استنتاج عادی OpenClaw اضافه می‌کنند. اگر مدل
  باید از طریق یک daemon عامل بومی اجرا شود که مالک threadها، compaction، یا رویدادهای ابزار است،
  به‌جای قرار دادن جزئیات پروتکل daemon در هسته، ارائه‌دهنده را با یک [مهار عامل](/fa/plugins/sdk-agent-harness)
  همراه کنید.
</Tip>

## راهنما

<Steps>
  <Step title="Package and manifest">
    ### مرحله ۱: بسته و مانیفست

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
    credentials را بدون بارگذاری runtime Plugin شما تشخیص دهد. زمانی `providerAuthAliases`
    را اضافه کنید که یک گونه ارائه‌دهنده باید احراز هویت شناسه ارائه‌دهنده دیگری را دوباره استفاده کند. `modelSupport`
    اختیاری است و به OpenClaw اجازه می‌دهد پیش از وجود hookهای runtime، Plugin ارائه‌دهنده شما را از شناسه‌های
    کوتاه مدل مانند `acme-large` به‌طور خودکار بارگذاری کند. اگر ارائه‌دهنده را
    در ClawHub منتشر می‌کنید، آن فیلدهای `openclaw.compat` و `openclaw.build`
    در `package.json` لازم هستند.

  </Step>

  <Step title="Register the provider">
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

    این یک ارائه‌دهنده کارآمد است. کاربران اکنون می‌توانند
    `openclaw onboard --acme-ai-api-key <key>` را اجرا کنند و
    `acme-ai/acme-large` را به‌عنوان مدل خود انتخاب کنند.

    اگر ارائه‌دهنده upstream از control tokenهایی متفاوت با OpenClaw استفاده می‌کند، به‌جای
    جایگزین کردن مسیر stream، یک تبدیل متن دوسویه کوچک اضافه کنید:

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
    `output` پیش از آنکه OpenClaw markerهای کنترلی خودش یا تحویل channel را parse کند،
    deltaهای متنی assistant و متن نهایی را بازنویسی می‌کند.

    برای ارائه‌دهندگان bundled که فقط یک ارائه‌دهنده متن را با احراز هویت کلید API
    به‌همراه یک runtime پشتوانه‌دار با کاتالوگ واحد ثبت می‌کنند، helper محدودتر
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

    `buildProvider` مسیر کاتالوگ live است که وقتی OpenClaw می‌تواند احراز هویت واقعی
    ارائه‌دهنده را resolve کند، استفاده می‌شود. ممکن است discovery ویژه ارائه‌دهنده انجام دهد. از
    `buildStaticProvider` فقط برای ردیف‌های offline استفاده کنید که نمایش آن‌ها پیش از پیکربندی auth
    امن است؛ نباید به credentials نیاز داشته باشد یا درخواست شبکه انجام دهد.
    نمایش `models list --all` در OpenClaw در حال حاضر کاتالوگ‌های static را
    فقط برای Pluginهای ارائه‌دهنده bundled، با config خالی، env خالی، و بدون
    مسیرهای agent/workspace اجرا می‌کند.

    اگر جریان auth شما همچنین نیاز دارد `models.providers.*`، aliasها، و
    مدل پیش‌فرض agent را هنگام onboarding patch کند، از helperهای preset از
    `openclaw/plugin-sdk/provider-onboard` استفاده کنید. محدودترین helperها
    `createDefaultModelPresetAppliers(...)`،
    `createDefaultModelsPresetAppliers(...)`، و
    `createModelCatalogPresetAppliers(...)` هستند.

    وقتی endpoint بومی یک ارائه‌دهنده روی transport عادی
    `openai-completions` از بلوک‌های usage به‌صورت streamed پشتیبانی می‌کند، به‌جای hardcode کردن
    بررسی‌های provider-id، helperهای کاتالوگ مشترک در
    `openclaw/plugin-sdk/provider-catalog-shared` را ترجیح دهید.
    `supportsNativeStreamingUsageCompat(...)` و
    `applyProviderNativeStreamingUsageCompat(...)` پشتیبانی را از
    نقشه capability endpoint تشخیص می‌دهند، بنابراین endpointهای بومی به سبک Moonshot/DashScope همچنان
    opt in می‌شوند، حتی وقتی یک Plugin از provider id سفارشی استفاده می‌کند.

  </Step>

  <Step title="Add dynamic model resolution">
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

    اگر resolve کردن به فراخوانی شبکه نیاز دارد، از `prepareDynamicModel` برای warm-up async
    استفاده کنید - `resolveDynamicModel` پس از تکمیل آن دوباره اجرا می‌شود.

  </Step>

  <Step title="Add runtime hooks (as needed)">
    بیشتر ارائه‌دهندگان فقط به `catalog` + `resolveDynamicModel` نیاز دارند. Hookها را
    به‌تدریج و مطابق نیاز ارائه‌دهنده خود اضافه کنید.

    helper builderهای مشترک اکنون رایج‌ترین خانواده‌های replay/tool-compat را پوشش می‌دهند،
    بنابراین Pluginها معمولا نیازی ندارند هر hook را یکی‌یکی دستی wire کنند:

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

    | خانواده | آنچه wire می‌کند | نمونه‌های bundled |
    | --- | --- | --- |
    | `openai-compatible` | سیاست replay مشترک به سبک OpenAI برای transportهای سازگار با OpenAI، شامل پاک‌سازی tool-call-id، اصلاح ترتیب assistant-first، و اعتبارسنجی عمومی نوبت Gemini در جایی که transport به آن نیاز دارد | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | سیاست replay آگاه از Claude که با `modelId` انتخاب می‌شود، بنابراین transportهای پیام Anthropic فقط وقتی مدل resolve شده واقعا شناسه Claude است، cleanup مخصوص thinking-block مربوط به Claude را دریافت می‌کنند | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | سیاست replay بومی Gemini به‌همراه پاک‌سازی bootstrap replay و حالت خروجی reasoning برچسب‌خورده | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | پاک‌سازی thought-signature مربوط به Gemini برای مدل‌های Gemini که از طریق transportهای proxy سازگار با OpenAI اجرا می‌شوند؛ اعتبارسنجی replay بومی Gemini یا بازنویسی‌های bootstrap را فعال نمی‌کند | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | سیاست hybrid برای ارائه‌دهندگانی که سطوح مدل Anthropic-message و سازگار با OpenAI را در یک Plugin ترکیب می‌کنند؛ حذف اختیاری thinking-block فقط برای Claude محدود به سمت Anthropic می‌ماند | `minimax` |

    خانواده‌های stream موجود امروز:

    | خانواده | آنچه متصل می‌کند | نمونه‌های همراه |
    | --- | --- | --- |
    | `google-thinking` | نرمال‌سازی payload تفکر Gemini در مسیر stream مشترک | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | wrapper استدلال Kilo در مسیر stream پروکسی مشترک، همراه با رد شدن `kilo/auto` و شناسه‌های استدلال پروکسی پشتیبانی‌نشده از تفکر تزریق‌شده | `kilocode` |
    | `moonshot-thinking` | نگاشت payload باینری تفکر بومی Moonshot از پیکربندی + سطح `/think` | `moonshot` |
    | `minimax-fast-mode` | بازنویسی مدل حالت سریع MiniMax در مسیر stream مشترک | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | wrapperهای مشترک Responses بومی OpenAI/Codex: headerهای انتساب، `/fast`/`serviceTier`، پرجزئیاتی متن، جست‌وجوی وب بومی Codex، شکل‌دهی payload سازگار با استدلال، و مدیریت context در Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | wrapper استدلال OpenRouter برای مسیرهای پروکسی، با رد شدن مدل‌های پشتیبانی‌نشده/`auto` که به‌صورت مرکزی مدیریت می‌شود | `openrouter` |
    | `tool-stream-default-on` | wrapper پیش‌فرض‌روشن `tool_stream` برای ارائه‌دهندگانی مانند Z.AI که stream ابزار را می‌خواهند مگر اینکه صراحتا غیرفعال شود | `zai` |

    <Accordion title="درزهای SDK که سازنده‌های خانواده را تغذیه می‌کنند">
      هر سازنده خانواده از helperهای عمومی سطح پایین‌تر که از همان package صادر می‌شوند ساخته شده است؛ وقتی یک ارائه‌دهنده نیاز دارد از الگوی رایج خارج شود، می‌توانید از آن‌ها استفاده کنید:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`، `buildProviderReplayFamilyHooks(...)`، و سازنده‌های خام replay (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). همچنین helperهای replay برای Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) و helperهای endpoint/model (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`) را صادر می‌کند.
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`، `buildProviderStreamFamilyHooks(...)`، `composeProviderStreamWrappers(...)`، به‌علاوه wrapperهای مشترک OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`)، wrapper سازگار با OpenAI برای DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`)، پاک‌سازی prefill تفکر Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`)، و wrapperهای مشترک پروکسی/ارائه‌دهنده (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`، `buildProviderToolCompatFamilyHooks("gemini")`، helperهای زیربنایی schema برای Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`)، و helperهای سازگاری xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Plugin همراه xAI از `normalizeResolvedModel` + `contributeResolvedModelCompat` همراه با این‌ها استفاده می‌کند تا قوانین xAI در مالکیت ارائه‌دهنده بمانند.

      برخی helperهای stream عمدا در خود ارائه‌دهنده محلی می‌مانند. `@openclaw/anthropic-provider`، `wrapAnthropicProviderStream`، `resolveAnthropicBetas`، `resolveAnthropicFastMode`، `resolveAnthropicServiceTier`، و سازنده‌های wrapper سطح پایین‌تر Anthropic را در درز عمومی `api.ts` / `contract-api.ts` خودش نگه می‌دارد، چون handling بتای Claude OAuth و gating مربوط به `context1m` را کدگذاری می‌کنند. Plugin xAI نیز به‌طور مشابه شکل‌دهی Responses بومی xAI را در `wrapStreamFn` خودش نگه می‌دارد (aliasهای `/fast`، `tool_stream` پیش‌فرض، پاک‌سازی strict-tool پشتیبانی‌نشده، حذف payload استدلال مخصوص xAI).

      همین الگوی package-root همچنین پشتوانه `@openclaw/openai-provider` (سازنده‌های ارائه‌دهنده، helperهای مدل پیش‌فرض، سازنده‌های ارائه‌دهنده realtime) و `@openclaw/openrouter-provider` (سازنده ارائه‌دهنده به‌علاوه helperهای onboarding/پیکربندی) است.
    </Accordion>

    <Tabs>
      <Tab title="تبادل token">
        برای ارائه‌دهندگانی که پیش از هر فراخوانی inference به تبادل token نیاز دارند:

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
      <Tab title="headerهای سفارشی">
        برای ارائه‌دهندگانی که به headerهای درخواست سفارشی یا تغییرات body نیاز دارند:

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
        برای ارائه‌دهندگانی که روی transportهای عمومی HTTP یا WebSocket به headerهای درخواست/جلسه یا metadata بومی نیاز دارند:

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
      <Tab title="مصرف و صورت‌حساب">
        برای ارائه‌دهندگانی که داده‌های مصرف/صورت‌حساب را در معرض دسترس قرار می‌دهند:

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
      OpenClaw hookها را به این ترتیب فراخوانی می‌کند. بیشتر ارائه‌دهندگان فقط از ۲ تا ۳ مورد استفاده می‌کنند:
      فیلدهای ارائه‌دهنده که فقط برای سازگاری هستند و OpenClaw دیگر آن‌ها را فراخوانی نمی‌کند، مانند
      `ProviderPlugin.capabilities` و `suppressBuiltInModel`، اینجا فهرست نشده‌اند.

      | # | Hook | زمان استفاده |
      | --- | --- | --- |
      | 1 | `catalog` | catalog مدل یا پیش‌فرض‌های URL پایه |
      | 2 | `applyConfigDefaults` | پیش‌فرض‌های سراسری تحت مالکیت ارائه‌دهنده هنگام materialization پیکربندی |
      | 3 | `normalizeModelId` | پاک‌سازی alias شناسه مدل legacy/preview پیش از lookup |
      | 4 | `normalizeTransport` | پاک‌سازی `api` / `baseUrl` خانواده ارائه‌دهنده پیش از assembly عمومی مدل |
      | 5 | `normalizeConfig` | نرمال‌سازی پیکربندی `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | بازنویسی‌های سازگاری مصرف stream بومی برای ارائه‌دهندگان پیکربندی |
      | 7 | `resolveConfigApiKey` | resolution احراز هویت env-marker تحت مالکیت ارائه‌دهنده |
      | 8 | `resolveSyntheticAuth` | احراز هویت synthetic محلی/خودمیزبان یا مبتنی بر پیکربندی |
      | 9 | `shouldDeferSyntheticProfileAuth` | پایین‌تر بردن placeholderهای پروفایل ذخیره‌شده synthetic پشت احراز هویت env/config |
      | 10 | `resolveDynamicModel` | پذیرش شناسه‌های دلخواه مدل upstream |
      | 11 | `prepareDynamicModel` | دریافت async metadata پیش از resolution |
      | 12 | `normalizeResolvedModel` | بازنویسی‌های transport پیش از runner |
      | 13 | `contributeResolvedModelCompat` | flagهای سازگاری برای مدل‌های vendor پشت یک transport سازگار دیگر |
      | 14 | `normalizeToolSchemas` | پاک‌سازی tool-schema تحت مالکیت ارائه‌دهنده پیش از registration |
      | 15 | `inspectToolSchemas` | diagnosticهای tool-schema تحت مالکیت ارائه‌دهنده |
      | 16 | `resolveReasoningOutputMode` | قرارداد خروجی استدلال tagged در برابر بومی |
      | 17 | `prepareExtraParams` | پارامترهای پیش‌فرض درخواست |
      | 18 | `createStreamFn` | transport کاملا سفارشی StreamFn |
      | 19 | `wrapStreamFn` | wrapperهای header/body سفارشی در مسیر stream عادی |
      | 20 | `resolveTransportTurnState` | headerها/metadata بومی برای هر turn |
      | 21 | `resolveWebSocketSessionPolicy` | headerهای جلسه WS/دوره cool-down |
      | 22 | `formatApiKey` | شکل token runtime سفارشی |
      | 23 | `refreshOAuth` | refresh سفارشی OAuth |
      | 24 | `buildAuthDoctorHint` | راهنمایی repair احراز هویت |
      | 25 | `matchesContextOverflowError` | تشخیص overflow تحت مالکیت ارائه‌دهنده |
      | 26 | `classifyFailoverReason` | طبقه‌بندی rate-limit/overload تحت مالکیت ارائه‌دهنده |
      | 27 | `isCacheTtlEligible` | gating مربوط به TTL cache prompt |
      | 28 | `buildMissingAuthMessage` | hint سفارشی برای احراز هویت missing |
      | 29 | `augmentModelCatalog` | ردیف‌های synthetic برای forward-compat |
      | 30 | `resolveThinkingProfile` | مجموعه گزینه‌های `/think` مخصوص مدل |
      | 31 | `isBinaryThinking` | سازگاری روشن/خاموش تفکر باینری |
      | 32 | `supportsXHighThinking` | سازگاری پشتیبانی استدلال `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | سازگاری policy پیش‌فرض `/think` |
      | 34 | `isModernModelRef` | تطبیق مدل live/smoke |
      | 35 | `prepareRuntimeAuth` | تبادل token پیش از inference |
      | 36 | `resolveUsageAuth` | parsing سفارشی credential مصرف |
      | 37 | `fetchUsageSnapshot` | endpoint سفارشی مصرف |
      | 38 | `createEmbeddingProvider` | adapter embedding تحت مالکیت ارائه‌دهنده برای memory/search |
      | 39 | `buildReplayPolicy` | policy سفارشی replay/Compaction برای transcript |
      | 40 | `sanitizeReplayHistory` | بازنویسی‌های replay مخصوص ارائه‌دهنده پس از پاک‌سازی عمومی |
      | 41 | `validateReplayTurns` | validation سخت‌گیرانه replay-turn پیش از runner embedded |
      | 42 | `onModelSelected` | callback پس از انتخاب (مثلا telemetry) |

      نکته‌های fallback زمان اجرا:

      - `normalizeConfig` ابتدا ارائه‌دهنده matched را بررسی می‌کند، سپس سایر Pluginهای ارائه‌دهنده دارای hook را تا وقتی که یکی واقعا پیکربندی را تغییر دهد. اگر هیچ hook ارائه‌دهنده‌ای یک entry پیکربندی پشتیبانی‌شده از خانواده Google را بازنویسی نکند، normalizer پیکربندی Google همراه همچنان اعمال می‌شود.
      - `resolveConfigApiKey` وقتی hook ارائه‌دهنده در معرض دسترس باشد از آن استفاده می‌کند. مسیر همراه `amazon-bedrock` نیز اینجا یک resolver داخلی env-marker برای AWS دارد، هرچند خود احراز هویت runtime برای Bedrock همچنان از زنجیره پیش‌فرض AWS SDK استفاده می‌کند.
      - `resolveSystemPromptContribution` به یک ارائه‌دهنده اجازه می‌دهد راهنمایی system-prompt آگاه از cache را برای یک خانواده مدل تزریق کند. وقتی رفتار به یک خانواده ارائه‌دهنده/مدل تعلق دارد و باید جداسازی cache پایدار/پویا را حفظ کند، آن را به `before_prompt_build` ترجیح دهید.

      برای توضیح‌های دقیق و نمونه‌های واقعی، [Internals: Provider Runtime Hooks](/fa/plugins/architecture-internals#provider-runtime-hooks) را ببینید.
    </Accordion>

  </Step>

  <Step title="افزودن قابلیت‌های اضافه (اختیاری)">
    ### مرحله ۵: افزودن قابلیت‌های اضافه

    یک Plugin ارائه‌دهنده می‌تواند گفتار، رونویسی realtime، صدای realtime، درک رسانه، تولید تصویر، تولید ویدئو، fetch وب،
    و جست‌وجوی وب را در کنار inference متنی ثبت کند. OpenClaw این را به‌عنوان یک Plugin با
    **قابلیت hybrid** طبقه‌بندی می‌کند - الگوی پیشنهادی برای Pluginهای شرکتی
    (یک Plugin برای هر vendor). ببینید
    [Internals: Capability Ownership](/fa/plugins/architecture#capability-ownership-model).

    هر capability را داخل `register(api)` در کنار فراخوانی موجود
    `api.registerProvider(...)` خود ثبت کنید. فقط tabهایی را که نیاز دارید انتخاب کنید:

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

        برای خطاهای HTTP فراهم‌کننده از `assertOkOrThrowProviderError(...)` استفاده کنید تا
        Pluginها خواندن محدودشده‌ی بدنه‌ی خطا، تحلیل خطای JSON، و
        پسوندهای شناسه‌ی درخواست مشترک داشته باشند.
      </Tab>
      <Tab title="رونویسی بلادرنگ">
        `createRealtimeTranscriptionWebSocketSession(...)` را ترجیح دهید - تابع کمکی
        مشترک ضبط پروکسی، وقفه‌گذاری افزایشی اتصال مجدد، تخلیه هنگام بستن، دست‌دهی‌های آمادگی،
        صف‌بندی صدا، و عیب‌یابی رویداد بستن را مدیریت می‌کند. Plugin شما
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

        فراهم‌کننده‌های STT دسته‌ای که صدای چندبخشی را POST می‌کنند باید از
        `buildAudioTranscriptionFormData(...)` از
        `openclaw/plugin-sdk/provider-http` استفاده کنند. این تابع کمکی نام فایل‌های
        بارگذاری را عادی‌سازی می‌کند، از جمله بارگذاری‌های AAC که برای
        APIهای سازگار رونویسی به نام فایلی با سبک M4A نیاز دارند.
      </Tab>
      <Tab title="صدای بلادرنگ">
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

        `capabilities` را اعلام کنید تا `talk.catalog` بتواند حالت‌های معتبر،
        روش‌های انتقال، قالب‌های صوتی، و پرچم‌های ویژگی را برای کلاینت‌های مرورگر و بومی Talk
        آشکار کند. وقتی یک روش انتقال می‌تواند تشخیص دهد که یک انسان
        پخش دستیار را قطع می‌کند و فراهم‌کننده از کوتاه‌کردن یا پاک‌کردن
        پاسخ صوتی فعال پشتیبانی می‌کند، `handleBargeIn` را پیاده‌سازی کنید.
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
      <Tab title="تولید تصویر و ویدئو">
        قابلیت‌های ویدئو از ساختاری **آگاه از حالت** استفاده می‌کنند: `generate`،
        `imageToVideo`، و `videoToVideo`. فیلدهای تجمیعی تخت مانند
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` برای
        اعلام دقیق پشتیبانی از حالت تبدیل یا حالت‌های غیرفعال کافی نیستند.
        تولید موسیقی نیز با بلوک‌های صریح `generate` /
        `edit` از همین الگو پیروی می‌کند.

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
      <Tab title="واکشی وب و جست‌وجو">
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

  <Step title="آزمون">
    ### گام 6: آزمون

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

Pluginهای فراهم‌کننده به همان روش هر Plugin کد خارجی دیگری منتشر می‌شوند:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

اینجا از نام مستعار انتشار قدیمیِ فقط مخصوص Skill استفاده نکنید؛ بسته‌های Plugin باید از
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

`catalog.order` کنترل می‌کند کاتالوگ شما نسبت به فراهم‌کننده‌های داخلی چه زمانی ادغام شود:

| ترتیب     | زمان          | مورد استفاده                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | گذر نخست    | فراهم‌کننده‌های ساده‌ی مبتنی بر کلید API                         |
| `profile` | پس از simple  | فراهم‌کننده‌هایی که با پروفایل‌های احراز هویت محدود می‌شوند                |
| `paired`  | پس از profile | ساخت چند ورودی مرتبط             |
| `late`    | گذر آخر     | بازنویسی فراهم‌کننده‌های موجود (هنگام برخورد غالب است) |

## گام‌های بعدی

- [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) - اگر Plugin شما یک کانال هم ارائه می‌دهد
- [زمان اجرای SDK](/fa/plugins/sdk-runtime) - تابع‌های کمکی `api.runtime` (TTS، جست‌وجو، زیرعامل)
- [نمای کلی SDK](/fa/plugins/sdk-overview) - مرجع کامل واردسازی زیرمسیر
- [جزئیات داخلی Plugin](/fa/plugins/architecture-internals#provider-runtime-hooks) - جزئیات قلاب‌ها و نمونه‌های همراه

## مرتبط

- [راه‌اندازی Plugin SDK](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [ساخت Pluginهای کانال](/fa/plugins/sdk-channel-plugins)
