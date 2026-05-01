---
read_when:
    - شما در حال ساخت یک Plugin ارائه‌دهندهٔ مدل جدید هستید
    - می‌خواهید یک پراکسی سازگار با OpenAI یا LLM سفارشی به OpenClaw اضافه کنید
    - باید احراز هویت ارائه‌دهنده، کاتالوگ‌ها و هوک‌های زمان اجرا را درک کنید
sidebarTitle: Provider plugins
summary: راهنمای گام‌به‌گام برای ساخت یک Plugin ارائه‌دهندهٔ مدل برای OpenClaw
title: ساخت Plugin‌های ارائه‌دهنده
x-i18n:
    generated_at: "2026-05-01T11:51:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f9d721673bdfef0b9c1979b4b8b4c86f19d114374d6b941facb928c3574cd1b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

این راهنما ساخت یک Plugin ارائه‌دهنده را توضیح می‌دهد که یک ارائه‌دهنده مدل
(LLM) را به OpenClaw اضافه می‌کند. در پایان، یک ارائه‌دهنده با کاتالوگ مدل،
احراز هویت با کلید API و تفکیک پویای مدل خواهید داشت.

<Info>
  اگر پیش‌تر هیچ Pluginای برای OpenClaw نساخته‌اید، ابتدا
  [شروع به کار](/fa/plugins/building-plugins) را برای ساختار پایه بسته
  و تنظیم manifest بخوانید.
</Info>

<Tip>
  Pluginهای ارائه‌دهنده، مدل‌ها را به حلقه استنتاج عادی OpenClaw اضافه می‌کنند. اگر مدل
  باید از طریق یک daemon عامل بومی اجرا شود که مالک threadها، compaction یا رویدادهای ابزار است،
  ارائه‌دهنده را به‌جای قرار دادن جزئیات پروتکل daemon در هسته، با یک
  [مهار عامل](/fa/plugins/sdk-agent-harness) همراه کنید.
</Tip>

## راهنمای گام‌به‌گام

<Steps>
  <Step title="بسته و manifest">
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
    اعتبارنامه‌ها را بدون بارگذاری runtime Plugin شما تشخیص دهد. وقتی یک گونه از ارائه‌دهنده باید از احراز هویت شناسه ارائه‌دهنده دیگری استفاده کند،
    `providerAuthAliases` را اضافه کنید. `modelSupport`
    اختیاری است و به OpenClaw اجازه می‌دهد Plugin ارائه‌دهنده شما را از شناسه‌های کوتاه مدل
    مثل `acme-large` پیش از وجود hookهای runtime به‌طور خودکار بارگذاری کند. اگر
    ارائه‌دهنده را در ClawHub منتشر می‌کنید، فیلدهای `openclaw.compat` و `openclaw.build`
    در `package.json` الزامی هستند.

  </Step>

  <Step title="ثبت ارائه‌دهنده">
    یک ارائه‌دهنده حداقلی به `id`، `label`، `auth` و `catalog` نیاز دارد:

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

    اگر ارائه‌دهنده upstream از tokenهای کنترلی متفاوتی نسبت به OpenClaw استفاده می‌کند،
    به‌جای جایگزین کردن مسیر stream، یک تبدیل متنی دوطرفه کوچک اضافه کنید:

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
    `output` پیش از آنکه OpenClaw نشانگرهای کنترلی خودش یا تحویل کانال را parse کند،
    deltaهای متنی دستیار و متن نهایی را بازنویسی می‌کند.

    برای ارائه‌دهندگان bundled که فقط یک ارائه‌دهنده متن با احراز هویت کلید API
    به‌همراه یک runtime پشتیبانی‌شده با کاتالوگ ثبت می‌کنند، helper محدودتر
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

    `buildProvider` مسیر کاتالوگ زنده‌ای است که وقتی OpenClaw بتواند احراز هویت واقعی
    ارائه‌دهنده را resolve کند استفاده می‌شود. این مسیر می‌تواند discovery اختصاصی ارائه‌دهنده انجام دهد. از
    `buildStaticProvider` فقط برای ردیف‌های آفلاینی استفاده کنید که نمایش آن‌ها پیش از پیکربندی احراز هویت
    امن است؛ این مسیر نباید به اعتبارنامه نیاز داشته باشد یا درخواست شبکه انجام دهد.
    نمایش `models list --all` در OpenClaw در حال حاضر کاتالوگ‌های static را
    فقط برای Pluginهای ارائه‌دهنده bundled، با config خالی، env خالی و بدون
    مسیرهای agent/workspace اجرا می‌کند.

    اگر جریان احراز هویت شما همچنین باید `models.providers.*`، aliasها و
    مدل پیش‌فرض عامل را هنگام onboarding patch کند، از helperهای preset موجود در
    `openclaw/plugin-sdk/provider-onboard` استفاده کنید. محدودترین helperها عبارت‌اند از
    `createDefaultModelPresetAppliers(...)`،
    `createDefaultModelsPresetAppliers(...)` و
    `createModelCatalogPresetAppliers(...)`.

    وقتی endpoint بومی یک ارائه‌دهنده از بلوک‌های usage استریم‌شده روی transport عادی
    `openai-completions` پشتیبانی می‌کند، helperهای کاتالوگ مشترک در
    `openclaw/plugin-sdk/provider-catalog-shared` را به hardcode کردن
    بررسی‌های provider-id ترجیح دهید. `supportsNativeStreamingUsageCompat(...)` و
    `applyProviderNativeStreamingUsageCompat(...)` پشتیبانی را از
    نگاشت قابلیت endpoint تشخیص می‌دهند، بنابراین endpointهای بومی به سبک Moonshot/DashScope همچنان
    حتی وقتی یک Plugin از شناسه ارائه‌دهنده سفارشی استفاده می‌کند، opt in می‌شوند.

  </Step>

  <Step title="افزودن تفکیک پویای مدل">
    اگر ارائه‌دهنده شما شناسه‌های دلخواه مدل را می‌پذیرد (مثل یک proxy یا router)،
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

    اگر resolve کردن به یک فراخوانی شبکه نیاز دارد، از `prepareDynamicModel` برای warm-up
    async استفاده کنید — `resolveDynamicModel` پس از تکمیل آن دوباره اجرا می‌شود.

  </Step>

  <Step title="افزودن hookهای runtime (در صورت نیاز)">
    بیشتر ارائه‌دهندگان فقط به `catalog` + `resolveDynamicModel` نیاز دارند. hookها را
    به‌تدریج و مطابق نیاز ارائه‌دهنده خود اضافه کنید.

    سازنده‌های helper مشترک اکنون رایج‌ترین خانواده‌های replay/tool-compat را پوشش می‌دهند،
    بنابراین Pluginها معمولا نیازی ندارند هر hook را جداگانه به‌صورت دستی سیم‌کشی کنند:

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

    خانواده‌های replay در دسترس امروز:

    | خانواده | آنچه سیم‌کشی می‌کند | نمونه‌های bundled |
    | --- | --- | --- |
    | `openai-compatible` | سیاست replay مشترک به سبک OpenAI برای transportهای سازگار با OpenAI، شامل پاک‌سازی tool-call-id، اصلاح ترتیب assistant-first و اعتبارسنجی عمومی turnهای Gemini در جایی که transport به آن نیاز دارد | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | سیاست replay آگاه از Claude که با `modelId` انتخاب می‌شود، بنابراین transportهای پیام Anthropic فقط وقتی مدل resolveشده واقعا یک شناسه Claude است، پاک‌سازی thinking-block اختصاصی Claude را دریافت می‌کنند | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | سیاست replay بومی Gemini به‌همراه پاک‌سازی bootstrap replay و حالت خروجی reasoning برچسب‌گذاری‌شده | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | پاک‌سازی thought-signatureهای Gemini برای مدل‌های Gemini که از طریق transportهای proxy سازگار با OpenAI اجرا می‌شوند؛ اعتبارسنجی replay بومی Gemini یا بازنویسی‌های bootstrap را فعال نمی‌کند | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | سیاست ترکیبی برای ارائه‌دهندگانی که سطح‌های مدل پیام Anthropic و سازگار با OpenAI را در یک Plugin ترکیب می‌کنند؛ حذف اختیاری thinking-block فقط برای Claude به سمت Anthropic محدود می‌ماند | `minimax` |

    خانواده‌های stream در دسترس امروز:

    | خانواده | چه چیزی را متصل می‌کند | نمونه‌های همراه |
    | --- | --- | --- |
    | `google-thinking` | عادی‌سازی محتوای تفکر Gemini در مسیر جریان مشترک | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | پوشش استدلال Kilo در مسیر جریان پراکسی مشترک، با عبور دادن `kilo/auto` و شناسه‌های استدلال پراکسی پشتیبانی‌نشده از تفکر تزریق‌شده | `kilocode` |
    | `moonshot-thinking` | نگاشت تفکر بومی دودویی Moonshot از پیکربندی + سطح `/think` | `moonshot` |
    | `minimax-fast-mode` | بازنویسی مدل حالت سریع MiniMax در مسیر جریان مشترک | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | پوشش‌های مشترک Responses بومی OpenAI/Codex: سرآیندهای انتساب، `/fast`/`serviceTier`، پرگویی متن، جست‌وجوی وب بومی Codex، شکل‌دهی محتوای سازگار با استدلال، و مدیریت زمینه Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | پوشش استدلال OpenRouter برای مسیرهای پراکسی، با مدیریت مرکزی عبور مدل‌های پشتیبانی‌نشده/`auto` | `openrouter` |
    | `tool-stream-default-on` | پوشش پیش‌فرض روشن `tool_stream` برای ارائه‌دهندگانی مثل Z.AI که جریان ابزار را می‌خواهند مگر اینکه صریحاً غیرفعال شود | `zai` |

    <Accordion title="SDK seams powering the family builders">
      هر سازنده خانواده از کمک‌سازهای عمومی سطح پایین‌تر که از همان بسته صادر می‌شوند تشکیل شده است؛ وقتی یک ارائه‌دهنده باید از الگوی رایج خارج شود، می‌توانید از آن‌ها استفاده کنید:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`، `buildProviderReplayFamilyHooks(...)`، و سازنده‌های خام بازپخش (`buildOpenAICompatibleReplayPolicy`، `buildAnthropicReplayPolicyForModel`، `buildGoogleGeminiReplayPolicy`، `buildHybridAnthropicOrOpenAIReplayPolicy`). همچنین کمک‌سازهای بازپخش Gemini (`sanitizeGoogleGeminiReplayHistory`، `resolveTaggedReasoningOutputMode`) و کمک‌سازهای نقطه پایانی/مدل (`resolveProviderEndpoint`، `normalizeProviderId`، `normalizeGooglePreviewModelId`، `normalizeNativeXaiModelId`) را صادر می‌کند.
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`، `buildProviderStreamFamilyHooks(...)`، `composeProviderStreamWrappers(...)`، به‌علاوه پوشش‌های مشترک OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`، `createOpenAIFastModeWrapper`، `createOpenAIServiceTierWrapper`، `createOpenAIResponsesContextManagementWrapper`، `createCodexNativeWebSearchWrapper`)، پوشش سازگار با OpenAI برای DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`)، پاک‌سازی پیش‌پرکردن تفکر در Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`)، و پوشش‌های مشترک پراکسی/ارائه‌دهنده (`createOpenRouterWrapper`، `createToolStreamWrapper`، `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`، `buildProviderToolCompatFamilyHooks("gemini")`، کمک‌سازهای زیربنایی طرح‌واره Gemini (`normalizeGeminiToolSchemas`، `inspectGeminiToolSchemas`)، و کمک‌سازهای سازگاری xAI (`resolveXaiModelCompatPatch()`، `applyXaiModelCompat(model)`). Plugin همراه xAI از `normalizeResolvedModel` + `contributeResolvedModelCompat` همراه با این‌ها استفاده می‌کند تا قوانین xAI در مالکیت خود ارائه‌دهنده بمانند.

      برخی کمک‌سازهای جریان عمداً محلیِ ارائه‌دهنده باقی می‌مانند. `@openclaw/anthropic-provider`، `wrapAnthropicProviderStream`، `resolveAnthropicBetas`، `resolveAnthropicFastMode`، `resolveAnthropicServiceTier` و سازنده‌های پوشش Anthropic در سطح پایین‌تر را در seam عمومی خودش یعنی `api.ts` / `contract-api.ts` نگه می‌دارد، چون مدیریت بتای Claude OAuth و دروازه‌گذاری `context1m` را کدگذاری می‌کنند. Plugin xAI نیز به‌طور مشابه شکل‌دهی Responses بومی xAI را در `wrapStreamFn` خودش نگه می‌دارد (نام‌های مستعار `/fast`، `tool_stream` پیش‌فرض، پاک‌سازی ابزار سخت‌گیرانه پشتیبانی‌نشده، حذف محتوای استدلال ویژه xAI).

      همین الگوی ریشه بسته همچنین پشتوانه `@openclaw/openai-provider` (سازنده‌های ارائه‌دهنده، کمک‌سازهای مدل پیش‌فرض، سازنده‌های ارائه‌دهنده realtime) و `@openclaw/openrouter-provider` (سازنده ارائه‌دهنده به‌همراه کمک‌سازهای راه‌اندازی/پیکربندی) است.
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        برای ارائه‌دهندگانی که پیش از هر فراخوانی استنتاج به تبادل توکن نیاز دارند:

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
        برای ارائه‌دهندگانی که به سرآیندهای درخواست سفارشی یا تغییرات بدنه نیاز دارند:

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
        برای ارائه‌دهندگانی که به سرآیندهای بومی درخواست/نشست یا فراداده روی
        انتقال‌های عمومی HTTP یا WebSocket نیاز دارند:

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
      <Tab title="Usage and billing">
        برای ارائه‌دهندگانی که داده‌های مصرف/صورت‌حساب را ارائه می‌کنند:

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

    <Accordion title="All available provider hooks">
      OpenClaw هوک‌ها را به این ترتیب فراخوانی می‌کند. بیشتر ارائه‌دهندگان فقط از ۲ تا ۳ مورد استفاده می‌کنند:
      فیلدهای فقط-سازگاریِ ارائه‌دهنده که OpenClaw دیگر فراخوانی نمی‌کند، مانند
      `ProviderPlugin.capabilities` و `suppressBuiltInModel`، اینجا فهرست نشده‌اند.

      | # | هوک | زمان استفاده |
      | --- | --- | --- |
      | 1 | `catalog` | کاتالوگ مدل یا پیش‌فرض‌های URL پایه |
      | 2 | `applyConfigDefaults` | پیش‌فرض‌های سراسری تحت مالکیت ارائه‌دهنده هنگام مادی‌سازی پیکربندی |
      | 3 | `normalizeModelId` | پاک‌سازی نام مستعار شناسه مدل قدیمی/پیش‌نمایش قبل از جست‌وجو |
      | 4 | `normalizeTransport` | پاک‌سازی `api` / `baseUrl` خانواده ارائه‌دهنده قبل از مونتاژ مدل عمومی |
      | 5 | `normalizeConfig` | عادی‌سازی پیکربندی `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | بازنویسی‌های سازگاری مصرف جریان بومی برای ارائه‌دهندگان پیکربندی |
      | 7 | `resolveConfigApiKey` | حل احراز هویت نشانگر env تحت مالکیت ارائه‌دهنده |
      | 8 | `resolveSyntheticAuth` | احراز هویت مصنوعی محلی/خودمیزبان یا مبتنی بر پیکربندی |
      | 9 | `shouldDeferSyntheticProfileAuth` | پایین‌تر بردن جای‌نگهدارهای پروفایل ذخیره‌شده مصنوعی پشت احراز هویت env/پیکربندی |
      | 10 | `resolveDynamicModel` | پذیرش شناسه‌های مدل بالادستی دلخواه |
      | 11 | `prepareDynamicModel` | واکشی ناهمگام فراداده قبل از حل |
      | 12 | `normalizeResolvedModel` | بازنویسی‌های انتقال قبل از رانر |
      | 13 | `contributeResolvedModelCompat` | پرچم‌های سازگاری برای مدل‌های فروشنده پشت انتقال سازگار دیگر |
      | 14 | `normalizeToolSchemas` | پاک‌سازی طرح‌واره ابزار تحت مالکیت ارائه‌دهنده قبل از ثبت |
      | 15 | `inspectToolSchemas` | عیب‌یابی طرح‌واره ابزار تحت مالکیت ارائه‌دهنده |
      | 16 | `resolveReasoningOutputMode` | قرارداد خروجی استدلال برچسب‌دار در برابر بومی |
      | 17 | `prepareExtraParams` | پارامترهای درخواست پیش‌فرض |
      | 18 | `createStreamFn` | انتقال StreamFn کاملاً سفارشی |
      | 19 | `wrapStreamFn` | پوشش‌های سرآیند/بدنه سفارشی روی مسیر جریان عادی |
      | 20 | `resolveTransportTurnState` | سرآیندها/فراداده بومی برای هر نوبت |
      | 21 | `resolveWebSocketSessionPolicy` | سرآیندهای نشست WS بومی/دوره سردشدن |
      | 22 | `formatApiKey` | شکل توکن زمان اجرا سفارشی |
      | 23 | `refreshOAuth` | نوسازی OAuth سفارشی |
      | 24 | `buildAuthDoctorHint` | راهنمایی تعمیر احراز هویت |
      | 25 | `matchesContextOverflowError` | تشخیص سرریز تحت مالکیت ارائه‌دهنده |
      | 26 | `classifyFailoverReason` | طبقه‌بندی محدودیت نرخ/بار بیش از حد تحت مالکیت ارائه‌دهنده |
      | 27 | `isCacheTtlEligible` | دروازه‌گذاری TTL حافظه نهان پرامپت |
      | 28 | `buildMissingAuthMessage` | راهنمای نبود احراز هویت سفارشی |
      | 29 | `augmentModelCatalog` | ردیف‌های مصنوعی سازگاری روبه‌جلو |
      | 30 | `resolveThinkingProfile` | مجموعه گزینه‌های `/think` ویژه مدل |
      | 31 | `isBinaryThinking` | سازگاری روشن/خاموش تفکر دودویی |
      | 32 | `supportsXHighThinking` | سازگاری پشتیبانی استدلال `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | سازگاری سیاست پیش‌فرض `/think` |
      | 34 | `isModernModelRef` | تطبیق مدل live/smoke |
      | 35 | `prepareRuntimeAuth` | تبادل توکن پیش از استنتاج |
      | 36 | `resolveUsageAuth` | تجزیه اعتبارنامه مصرف سفارشی |
      | 37 | `fetchUsageSnapshot` | نقطه پایانی مصرف سفارشی |
      | 38 | `createEmbeddingProvider` | آداپتور embedding تحت مالکیت ارائه‌دهنده برای حافظه/جست‌وجو |
      | 39 | `buildReplayPolicy` | سیاست سفارشی بازپخش/Compaction رونوشت |
      | 40 | `sanitizeReplayHistory` | بازنویسی‌های بازپخش ویژه ارائه‌دهنده پس از پاک‌سازی عمومی |
      | 41 | `validateReplayTurns` | اعتبارسنجی سخت‌گیرانه نوبت بازپخش قبل از رانر تعبیه‌شده |
      | 42 | `onModelSelected` | callback پس از انتخاب (مثلاً telemetry) |

      نکته‌های fallback زمان اجرا:

      - `normalizeConfig` ابتدا ارائه‌دهنده تطبیق‌یافته را بررسی می‌کند، سپس Pluginهای ارائه‌دهنده دارای هوک دیگر را تا زمانی که یکی واقعاً پیکربندی را تغییر دهد. اگر هیچ هوک ارائه‌دهنده‌ای یک ورودی پیکربندی پشتیبانی‌شده خانواده Google را بازنویسی نکند، عادی‌ساز پیکربندی Google همراه همچنان اعمال می‌شود.
      - `resolveConfigApiKey` وقتی در دسترس باشد از هوک ارائه‌دهنده استفاده می‌کند. مسیر همراه `amazon-bedrock` نیز اینجا یک حل‌کننده داخلی نشانگر env AWS دارد، هرچند خود احراز هویت زمان اجرای Bedrock همچنان از زنجیره پیش‌فرض AWS SDK استفاده می‌کند.
      - `resolveSystemPromptContribution` به ارائه‌دهنده اجازه می‌دهد راهنمای system-prompt آگاه از حافظه نهان را برای یک خانواده مدل تزریق کند. وقتی رفتار به یک خانواده ارائه‌دهنده/مدل تعلق دارد و باید جداسازی حافظه نهان پایدار/پویا را حفظ کند، آن را به `before_prompt_build` ترجیح دهید.

      برای توضیحات تفصیلی و نمونه‌های واقعی، [Internals: Provider Runtime Hooks](/fa/plugins/architecture-internals#provider-runtime-hooks) را ببینید.
    </Accordion>

  </Step>

  <Step title="Add extra capabilities (optional)">
    یک Plugin ارائه‌دهنده می‌تواند گفتار، رونویسی realtime، صدای realtime، درک رسانه، تولید تصویر، تولید ویدیو، واکشی وب،
    و جست‌وجوی وب را در کنار استنتاج متن ثبت کند. OpenClaw این را به‌عنوان یک
    Plugin با **قابلیت ترکیبی** طبقه‌بندی می‌کند؛ الگوی پیشنهادی برای Pluginهای شرکتی
    (یک Plugin برای هر فروشنده). ببینید:
    [Internals: Capability Ownership](/fa/plugins/architecture#capability-ownership-model).

    هر قابلیت را داخل `register(api)` و در کنار فراخوانی موجود
    `api.registerProvider(...)` خود ثبت کنید. فقط تب‌هایی را انتخاب کنید که نیاز دارید:

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
        plugins خواندن محدود بدنهٔ خطا، تجزیهٔ خطای JSON، و
        پسوندهای شناسهٔ درخواست را مشترک داشته باشند.
      </Tab>
      <Tab title="رونویسی بلادرنگ">
        `createRealtimeTranscriptionWebSocketSession(...)` را ترجیح دهید — helper مشترک
        ثبت proxy، backoff اتصال مجدد، تخلیه هنگام بسته‌شدن، دست‌دهی‌های آماده،
        صف‌گذاری صوت، و عیب‌یابی رویدادهای بسته‌شدن را مدیریت می‌کند. Plugin شما
        فقط رویدادهای upstream را نگاشت می‌کند.

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

        ارائه‌دهنده‌های STT دسته‌ای که صوت multipart را POST می‌کنند باید از
        `buildAudioTranscriptionFormData(...)` از
        `openclaw/plugin-sdk/provider-http` استفاده کنند. این helper نام فایل‌های upload را
        نرمال‌سازی می‌کند، از جمله uploadهای AAC که برای APIهای رونویسی سازگار
        به نام فایلی به سبک M4A نیاز دارند.
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

        وقتی یک transport می‌تواند تشخیص دهد که انسان در حال قطع پخش دستیار است
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
        قابلیت‌های ویدیو از شکلی **آگاه از mode** استفاده می‌کنند: `generate`،
        `imageToVideo`، و `videoToVideo`. فیلدهای تجمیعی تخت مانند
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` برای
        اعلام پشتیبانی از modeهای تبدیل یا modeهای غیرفعال به‌صورت تمیز
        کافی نیستند. تولید موسیقی نیز همین الگو را با بلوک‌های صریح `generate` /
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

Provider plugins همانند هر Plugin کد خارجی دیگری منتشر می‌شوند:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

اینجا از نام مستعار قدیمی انتشار فقط برای skill استفاده نکنید؛ بسته‌های Plugin باید از
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

## مرجع ترتیب catalog

`catalog.order` کنترل می‌کند که catalog شما نسبت به ارائه‌دهنده‌های داخلی
چه زمانی ادغام شود:

| ترتیب     | زمان          | مورد استفاده                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | گذر نخست    | ارائه‌دهنده‌های ساده با کلید API                         |
| `profile` | پس از simple  | ارائه‌دهنده‌هایی که به auth profile وابسته‌اند                |
| `paired`  | پس از profile | تولید چند ورودی مرتبط             |
| `late`    | آخرین گذر     | بازنویسی ارائه‌دهنده‌های موجود (در برخورد برنده می‌شود) |

## گام‌های بعدی

- [Channel Plugins](/fa/plugins/sdk-channel-plugins) — اگر Plugin شما یک channel نیز ارائه می‌کند
- [SDK Runtime](/fa/plugins/sdk-runtime) — helperهای `api.runtime` (TTS، جست‌وجو، subagent)
- [SDK Overview](/fa/plugins/sdk-overview) — مرجع کامل import زیرمسیر
- [Plugin Internals](/fa/plugins/architecture-internals#provider-runtime-hooks) — جزئیات hook و نمونه‌های bundled

## مرتبط

- [راه‌اندازی Plugin SDK](/fa/plugins/sdk-setup)
- [ساخت plugins](/fa/plugins/building-plugins)
- [ساخت channel plugins](/fa/plugins/sdk-channel-plugins)
