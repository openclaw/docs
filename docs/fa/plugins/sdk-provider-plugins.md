---
read_when:
    - شما در حال ساخت یک Plugin جدیدِ ارائه‌دهندهٔ مدل هستید
    - می‌خواهید یک پروکسی سازگار با OpenAI یا یک مدل زبانی بزرگ سفارشی به OpenClaw اضافه کنید
    - باید احراز هویت ارائه‌دهنده، کاتالوگ‌ها و هوک‌های زمان اجرا را درک کنید
sidebarTitle: Provider plugins
summary: راهنمای گام‌به‌گام برای ساخت یک Plugin ارائه‌دهندهٔ مدل برای OpenClaw
title: ساخت Plugin‌های ارائه‌دهنده
x-i18n:
    generated_at: "2026-05-10T19:59:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1992653c8c6b079bbb6ea2b4f4b02dbd6a5a8aef286172af8048a7d9a98a8a4
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

این راهنما مراحل ساخت یک Plugin ارائه‌دهنده را توضیح می‌دهد که یک ارائه‌دهندهٔ مدل
(LLM) را به OpenClaw اضافه می‌کند. در پایان، ارائه‌دهنده‌ای با کاتالوگ مدل،
احراز هویت با کلید API و تفکیک پویای مدل خواهید داشت.

<Info>
  اگر پیش از این هیچ Plugin برای OpenClaw نساخته‌اید، ابتدا
  [شروع به کار](/fa/plugins/building-plugins) را بخوانید تا با ساختار پایهٔ بسته
  و راه‌اندازی manifest آشنا شوید.
</Info>

<Tip>
  Pluginهای ارائه‌دهنده، مدل‌ها را به حلقهٔ استنتاج عادی OpenClaw اضافه می‌کنند. اگر مدل
  باید از طریق daemon عامل بومی اجرا شود که مالک threadها، Compaction یا رویدادهای ابزار
  است، به‌جای قرار دادن جزئیات پروتکل daemon در هسته، ارائه‌دهنده را با یک [agent harness](/fa/plugins/sdk-agent-harness)
  همراه کنید.
</Tip>

## راهنمای گام‌به‌گام

<Steps>
  <Step title="Package and manifest">
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

    manifest مقدار `providerAuthEnvVars` را اعلام می‌کند تا OpenClaw بتواند
    اعتبارنامه‌ها را بدون بارگذاری runtime Plugin شما تشخیص دهد. وقتی یک گونهٔ ارائه‌دهنده باید از
    احراز هویت شناسهٔ ارائه‌دهندهٔ دیگری استفاده کند، `providerAuthAliases` را اضافه کنید. `modelSupport`
    اختیاری است و به OpenClaw اجازه می‌دهد Plugin ارائه‌دهندهٔ شما را از شناسه‌های کوتاه
    مدل مانند `acme-large`، پیش از وجود hookهای runtime، به‌طور خودکار بارگذاری کند. اگر
    ارائه‌دهنده را در ClawHub منتشر می‌کنید، فیلدهای `openclaw.compat` و `openclaw.build`
    در `package.json` الزامی هستند.

  </Step>

  <Step title="Register the provider">
    یک ارائه‌دهندهٔ متنی حداقلی به `id`، `label`، `auth` و `catalog` نیاز دارد.
    `catalog`، hook مربوط به runtime/config تحت مالکیت ارائه‌دهنده است؛ می‌تواند APIهای زندهٔ
    فروشنده را فراخوانی کند و ورودی‌های `models.providers` را برمی‌گرداند.

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

    `registerModelCatalogProvider` سطح جدیدتر کاتالوگ control-plane برای UIهای
    فهرست/راهنما/انتخاب‌گر است. از آن برای ردیف‌های text، image-generation،
    video-generation و music-generation استفاده کنید. فراخوانی‌های endpoint فروشنده و
    نگاشت پاسخ را در Plugin نگه دارید؛ OpenClaw مالک شکل مشترک ردیف‌ها، برچسب‌های
    منبع و رندر راهنما است.

    این یک ارائه‌دهندهٔ کارا است. کاربران اکنون می‌توانند
    `openclaw onboard --acme-ai-api-key <key>` را اجرا کنند و
    `acme-ai/acme-large` را به‌عنوان مدل خود انتخاب کنند.

    اگر ارائه‌دهندهٔ بالادستی از tokenهای کنترلی متفاوتی نسبت به OpenClaw استفاده می‌کند، به‌جای
    جایگزین کردن مسیر stream، یک تبدیل متنی دوسویهٔ کوچک اضافه کنید:

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

    `input` پیش از transport، prompt نهایی سیستم و محتوای پیام متنی را بازنویسی می‌کند.
    `output` پیش از اینکه OpenClaw نشانگرهای کنترلی خودش را parse کند یا تحویل کانال انجام شود،
    deltaهای متنی دستیار و متن نهایی را بازنویسی می‌کند.

    برای ارائه‌دهندگان bundle‌شده‌ای که فقط یک ارائه‌دهندهٔ متنی را با احراز هویت API-key
    به‌همراه یک runtime مبتنی بر کاتالوگ واحد ثبت می‌کنند، helper محدودتر
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
    ارائه‌دهنده را تفکیک کند استفاده می‌شود. این مسیر ممکن است کشف اختصاصی ارائه‌دهنده انجام دهد. از
    `buildStaticProvider` فقط برای ردیف‌های offline استفاده کنید که نمایش آن‌ها پیش از پیکربندی auth
    امن است؛ این مسیر نباید به اعتبارنامه نیاز داشته باشد یا درخواست شبکه انجام دهد.
    نمایش `models list --all` در OpenClaw در حال حاضر کاتالوگ‌های static را
    فقط برای Pluginهای ارائه‌دهندهٔ bundle‌شده، با config خالی، env خالی و بدون
    مسیرهای agent/workspace اجرا می‌کند.

    اگر جریان auth شما همچنین باید `models.providers.*`، aliasها و
    مدل پیش‌فرض agent را هنگام onboarding وصله کند، از helperهای preset در
    `openclaw/plugin-sdk/provider-onboard` استفاده کنید. محدودترین helperها عبارت‌اند از
    `createDefaultModelPresetAppliers(...)`،
    `createDefaultModelsPresetAppliers(...)` و
    `createModelCatalogPresetAppliers(...)`.

    وقتی endpoint بومی یک ارائه‌دهنده از بلوک‌های usage به‌صورت streamed روی
    transport عادی `openai-completions` پشتیبانی می‌کند، به‌جای hardcode کردن
    بررسی‌های شناسهٔ ارائه‌دهنده، helperهای مشترک کاتالوگ در
    `openclaw/plugin-sdk/provider-catalog-shared` را ترجیح دهید. `supportsNativeStreamingUsageCompat(...)` و
    `applyProviderNativeStreamingUsageCompat(...)` پشتیبانی را از
    نقشهٔ قابلیت endpoint تشخیص می‌دهند، بنابراین endpointهای بومی به سبک Moonshot/DashScope همچنان
    opt in می‌شوند حتی وقتی یک Plugin از شناسهٔ ارائه‌دهندهٔ سفارشی استفاده می‌کند.

  </Step>

  <Step title="Add dynamic model resolution">
    اگر ارائه‌دهندهٔ شما شناسه‌های مدل دلخواه را می‌پذیرد (مانند proxy یا router)،
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

    اگر تفکیک به فراخوانی شبکه نیاز دارد، از `prepareDynamicModel` برای warm-up ناهمگام
    استفاده کنید - `resolveDynamicModel` پس از تکمیل آن دوباره اجرا می‌شود.

  </Step>

  <Step title="Add runtime hooks (as needed)">
    بیشتر ارائه‌دهندگان فقط به `catalog` + `resolveDynamicModel` نیاز دارند. hookها را
    به‌تدریج و متناسب با نیاز ارائه‌دهندهٔ خود اضافه کنید.

    builderهای helper مشترک اکنون رایج‌ترین خانواده‌های replay/tool-compat را پوشش می‌دهند،
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

    خانواده‌های replay موجود در حال حاضر:

    | خانواده | آنچه متصل می‌کند | نمونه‌های همراه |
    | --- | --- | --- |
    | `openai-compatible` | سیاست بازپخش مشترک به سبک OpenAI برای انتقال‌های سازگار با OpenAI، شامل پاک‌سازی شناسه فراخوانی ابزار، اصلاح ترتیب assistant-first، و اعتبارسنجی عمومی نوبت Gemini در جایی که انتقال به آن نیاز دارد | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | سیاست بازپخش آگاه از Claude که بر اساس `modelId` انتخاب می‌شود، تا انتقال‌های پیام Anthropic فقط زمانی پاک‌سازی اختصاصی بلوک تفکر Claude را دریافت کنند که مدل حل‌شده واقعا شناسه Claude باشد | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | سیاست بازپخش بومی Gemini به‌همراه پاک‌سازی بازپخش راه‌اندازی اولیه و حالت خروجی استدلال برچسب‌دار | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | پاک‌سازی امضای تفکر Gemini برای مدل‌های Gemini که از طریق انتقال‌های پراکسی سازگار با OpenAI اجرا می‌شوند؛ اعتبارسنجی بازپخش بومی Gemini یا بازنویسی‌های راه‌اندازی اولیه را فعال نمی‌کند | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | سیاست ترکیبی برای ارائه‌دهندگانی که سطح‌های مدل پیام Anthropic و سازگار با OpenAI را در یک Plugin ترکیب می‌کنند؛ حذف اختیاری بلوک تفکر فقط برای Claude در محدوده سمت Anthropic باقی می‌ماند | `minimax` |

    خانواده‌های جریان موجود امروز:

    | خانواده | آنچه متصل می‌کند | نمونه‌های همراه |
    | --- | --- | --- |
    | `google-thinking` | نرمال‌سازی بار Gemini thinking در مسیر جریان مشترک | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | پوشش‌دهنده استدلال Kilo در مسیر جریان پراکسی مشترک، با `kilo/auto` و شناسه‌های استدلال پراکسی پشتیبانی‌نشده که تفکر تزریق‌شده را رد می‌کنند | `kilocode` |
    | `moonshot-thinking` | نگاشت بار native-thinking دودویی Moonshot از پیکربندی + سطح `/think` | `moonshot` |
    | `minimax-fast-mode` | بازنویسی مدل حالت سریع MiniMax در مسیر جریان مشترک | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | پوشش‌دهنده‌های مشترک Responses بومی OpenAI/Codex: سرآیندهای انتساب، `/fast`/`serviceTier`، پرگویی متن، جست‌وجوی وب بومی Codex، شکل‌دهی بار سازگار با استدلال، و مدیریت زمینه Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | پوشش‌دهنده استدلال OpenRouter برای مسیرهای پراکسی، با رد کردن مدل‌های پشتیبانی‌نشده/`auto` به‌صورت متمرکز | `openrouter` |
    | `tool-stream-default-on` | پوشش‌دهنده پیش‌فرض فعال `tool_stream` برای ارائه‌دهندگانی مانند Z.AI که جریان ابزار را می‌خواهند مگر اینکه صراحتا غیرفعال شده باشد | `zai` |

    <Accordion title="درزهای SDK که سازنده‌های خانواده را نیرو می‌دهند">
      هر سازنده خانواده از کمک‌کننده‌های عمومی سطح پایین‌تر که از همان بسته صادر شده‌اند تشکیل می‌شود؛ وقتی ارائه‌دهنده‌ای باید از الگوی رایج خارج شود، می‌توانید از آن‌ها استفاده کنید:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`، `buildProviderReplayFamilyHooks(...)`، و سازنده‌های خام بازپخش (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). همچنین کمک‌کننده‌های بازپخش Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) و کمک‌کننده‌های endpoint/model (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`) را صادر می‌کند.
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`، `buildProviderStreamFamilyHooks(...)`، `composeProviderStreamWrappers(...)`، به‌همراه پوشش‌دهنده‌های مشترک OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`)، پوشش‌دهنده سازگار با OpenAI برای DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`)، پاک‌سازی پیش‌پرکردن تفکر Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`)، و پوشش‌دهنده‌های مشترک پراکسی/ارائه‌دهنده (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`، `buildProviderToolCompatFamilyHooks("gemini")`، و کمک‌کننده‌های زیربنایی طرح‌واره Gemini (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`).

      برخی کمک‌کننده‌های جریان عمدا محلیِ ارائه‌دهنده باقی می‌مانند. `@openclaw/anthropic-provider` موارد `wrapAnthropicProviderStream`، `resolveAnthropicBetas`، `resolveAnthropicFastMode`، `resolveAnthropicServiceTier`، و سازنده‌های پوشش‌دهنده سطح پایین‌تر Anthropic را در درز عمومی خودش یعنی `api.ts` / `contract-api.ts` نگه می‌دارد، چون مدیریت بتای OAuth مربوط به Claude و دروازه‌گذاری `context1m` را رمزگذاری می‌کنند. Plugin مربوط به xAI نیز به‌طور مشابه شکل‌دهی بومی Responses برای xAI را در `wrapStreamFn` خودش نگه می‌دارد (نام‌های مستعار `/fast`، `tool_stream` پیش‌فرض، پاک‌سازی strict-tool پشتیبانی‌نشده، حذف بار استدلال اختصاصی xAI).

      همین الگوی ریشه بسته پشتوانه `@openclaw/openai-provider` (سازنده‌های ارائه‌دهنده، کمک‌کننده‌های مدل پیش‌فرض، سازنده‌های ارائه‌دهنده بلادرنگ) و `@openclaw/openrouter-provider` (سازنده ارائه‌دهنده به‌همراه کمک‌کننده‌های راه‌اندازی و پیکربندی) نیز هست.
    </Accordion>

    <Tabs>
      <Tab title="تبادل توکن">
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
      <Tab title="سرآیندهای سفارشی">
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
      <Tab title="هویت انتقال بومی">
        برای ارائه‌دهندگانی که به سرآیندهای درخواست/نشست بومی یا فراداده روی
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
      <Tab title="مصرف و صورت‌حساب">
        برای ارائه‌دهندگانی که داده مصرف/صورت‌حساب را ارائه می‌کنند:

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
      OpenClaw hookها را با این ترتیب فراخوانی می‌کند. بیشتر ارائه‌دهندگان فقط از ۲ تا ۳ مورد استفاده می‌کنند:
      فیلدهای ارائه‌دهنده فقط برای سازگاری که OpenClaw دیگر آن‌ها را فراخوانی نمی‌کند، مانند
      `ProviderPlugin.capabilities` و `suppressBuiltInModel`، اینجا فهرست نشده‌اند.

      | # | Hook | زمان استفاده |
      | --- | --- | --- |
      | 1 | `catalog` | کاتالوگ مدل یا پیش‌فرض‌های URL پایه |
      | 2 | `applyConfigDefaults` | پیش‌فرض‌های سراسری تحت مالکیت ارائه‌دهنده هنگام مادی‌سازی پیکربندی |
      | 3 | `normalizeModelId` | پاک‌سازی نام مستعار شناسه مدل قدیمی/پیش‌نمایش پیش از جست‌وجو |
      | 4 | `normalizeTransport` | پاک‌سازی `api` / `baseUrl` خانواده ارائه‌دهنده پیش از مونتاژ عمومی مدل |
      | 5 | `normalizeConfig` | نرمال‌سازی پیکربندی `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | بازنویسی‌های سازگاری مصرف جریان بومی برای ارائه‌دهندگان پیکربندی |
      | 7 | `resolveConfigApiKey` | حل احراز هویت env-marker تحت مالکیت ارائه‌دهنده |
      | 8 | `resolveSyntheticAuth` | احراز هویت مصنوعی محلی/خودمیزبان یا پشتیبانی‌شده با پیکربندی |
      | 9 | `shouldDeferSyntheticProfileAuth` | پایین‌آوردن جای‌نگهدارهای پروفایل ذخیره‌شده مصنوعی پشت احراز هویت env/config |
      | 10 | `resolveDynamicModel` | پذیرش شناسه‌های دلخواه مدل بالادستی |
      | 11 | `prepareDynamicModel` | دریافت فراداده ناهمگام پیش از حل کردن |
      | 12 | `normalizeResolvedModel` | بازنویسی‌های انتقال پیش از runner |
      | 13 | `contributeResolvedModelCompat` | پرچم‌های سازگاری برای مدل‌های فروشنده پشت انتقال سازگار دیگر |
      | 14 | `normalizeToolSchemas` | پاک‌سازی طرح‌واره ابزار تحت مالکیت ارائه‌دهنده پیش از ثبت |
      | 15 | `inspectToolSchemas` | عیب‌یابی‌های طرح‌واره ابزار تحت مالکیت ارائه‌دهنده |
      | 16 | `resolveReasoningOutputMode` | قرارداد خروجی استدلال برچسب‌دار در برابر بومی |
      | 17 | `prepareExtraParams` | پارامترهای درخواست پیش‌فرض |
      | 18 | `createStreamFn` | انتقال StreamFn کاملا سفارشی |
      | 19 | `wrapStreamFn` | پوشش‌دهنده‌های سرآیند/بدنه سفارشی در مسیر جریان عادی |
      | 20 | `resolveTransportTurnState` | سرآیندها/فراداده بومی برای هر نوبت |
      | 21 | `resolveWebSocketSessionPolicy` | سرآیندهای نشست WS بومی/دوره خنک‌سازی |
      | 22 | `formatApiKey` | شکل توکن زمان اجرا سفارشی |
      | 23 | `refreshOAuth` | تازه‌سازی OAuth سفارشی |
      | 24 | `buildAuthDoctorHint` | راهنمای ترمیم احراز هویت |
      | 25 | `matchesContextOverflowError` | تشخیص سرریز تحت مالکیت ارائه‌دهنده |
      | 26 | `classifyFailoverReason` | طبقه‌بندی محدودیت نرخ/بار بیش از حد تحت مالکیت ارائه‌دهنده |
      | 27 | `isCacheTtlEligible` | دروازه‌گذاری TTL کش پرامپت |
      | 28 | `buildMissingAuthMessage` | راهنمای سفارشی احراز هویت مفقود |
      | 29 | `augmentModelCatalog` | ردیف‌های مصنوعی سازگاری روبه‌جلو |
      | 30 | `resolveThinkingProfile` | مجموعه گزینه `/think` ویژه مدل |
      | 31 | `isBinaryThinking` | سازگاری روشن/خاموش تفکر دودویی |
      | 32 | `supportsXHighThinking` | سازگاری پشتیبانی استدلال `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | سازگاری سیاست پیش‌فرض `/think` |
      | 34 | `isModernModelRef` | تطبیق مدل live/smoke |
      | 35 | `prepareRuntimeAuth` | تبادل توکن پیش از استنتاج |
      | 36 | `resolveUsageAuth` | تجزیه اعتبارنامه مصرف سفارشی |
      | 37 | `fetchUsageSnapshot` | endpoint مصرف سفارشی |
      | 38 | `createEmbeddingProvider` | آداپتور embedding تحت مالکیت ارائه‌دهنده برای حافظه/جست‌وجو |
      | 39 | `buildReplayPolicy` | سیاست بازپخش/Compaction رونوشت سفارشی |
      | 40 | `sanitizeReplayHistory` | بازنویسی‌های بازپخش ویژه ارائه‌دهنده پس از پاک‌سازی عمومی |
      | 41 | `validateReplayTurns` | اعتبارسنجی سخت‌گیرانه نوبت بازپخش پیش از runner تعبیه‌شده |
      | 42 | `onModelSelected` | callback پس از انتخاب (مثلا telemetry) |

      یادداشت‌های fallback زمان اجرا:

      - `normalizeConfig` ابتدا ارائه‌دهنده تطبیق‌یافته را بررسی می‌کند، سپس سایر Pluginهای ارائه‌دهنده دارای hook را تا زمانی که یکی واقعا پیکربندی را تغییر دهد. اگر هیچ hook ارائه‌دهنده‌ای یک ورودی پیکربندی پشتیبانی‌شده خانواده Google را بازنویسی نکند، نرمال‌ساز پیکربندی Google همراه همچنان اعمال می‌شود.
      - `resolveConfigApiKey` وقتی hook ارائه‌دهنده ارائه شده باشد از آن استفاده می‌کند. مسیر همراه `amazon-bedrock` نیز اینجا یک حل‌کننده داخلی env-marker برای AWS دارد، هرچند احراز هویت زمان اجرای Bedrock خود همچنان از زنجیره پیش‌فرض AWS SDK استفاده می‌کند.
      - `resolveSystemPromptContribution` به ارائه‌دهنده اجازه می‌دهد راهنمای system-prompt آگاه از کش را برای یک خانواده مدل تزریق کند. وقتی رفتار به یک خانواده ارائه‌دهنده/مدل تعلق دارد و باید شکاف کش پایدار/پویا را حفظ کند، آن را به `before_prompt_build` ترجیح دهید.

      برای توضیحات دقیق و نمونه‌های واقعی، [درون‌سازوکارها: Hookهای زمان اجرای ارائه‌دهنده](/fa/plugins/architecture-internals#provider-runtime-hooks) را ببینید.
    </Accordion>

  </Step>

  <Step title="افزودن قابلیت‌های اضافی (اختیاری)">
    ### گام ۵: افزودن قابلیت‌های اضافی

    یک Plugin ارائه‌دهنده می‌تواند در کنار استنتاج متن، گفتار، رونویسی بلادرنگ، صدای بلادرنگ، درک رسانه، تولید تصویر، تولید ویدئو، واکشی وب، و جست‌وجوی وب را ثبت کند. OpenClaw این را به‌عنوان یک Plugin با **قابلیت ترکیبی** طبقه‌بندی می‌کند - الگوی پیشنهادی برای Pluginهای شرکتی (یک Plugin برای هر فروشنده). ببینید
    [درونیات: مالکیت قابلیت](/fa/plugins/architecture#capability-ownership-model).

    هر قابلیت را داخل `register(api)` در کنار فراخوانی موجود
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

        برای خرابی‌های HTTP ارائه‌دهنده از `assertOkOrThrowProviderError(...)` استفاده کنید تا
        Pluginها خواندن محدودشده بدنه خطا، تجزیه خطای JSON، و
        پسوندهای شناسه درخواست را به‌صورت مشترک داشته باشند.
      </Tab>
      <Tab title="رونویسی بلادرنگ">
        `createRealtimeTranscriptionWebSocketSession(...)` را ترجیح دهید - راهنمای مشترک
        ثبت پراکسی، پس‌روی اتصال مجدد، تخلیه هنگام بستن، دست‌دهی آماده‌بودن،
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

        ارائه‌دهنده‌های STT دسته‌ای که صدای چندبخشی را POST می‌کنند باید از
        `buildAudioTranscriptionFormData(...)` از
        `openclaw/plugin-sdk/provider-http` استفاده کنند. این راهنما نام فایل‌های
        بارگذاری را نرمال می‌کند، از جمله بارگذاری‌های AAC که برای APIهای رونویسی
        سازگار به نام فایلی به سبک M4A نیاز دارند.
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
        انتقال‌ها، قالب‌های صدا، و پرچم‌های ویژگی را در اختیار کلاینت‌های Talk
        مرورگر و بومی قرار دهد. وقتی یک انتقال می‌تواند تشخیص دهد که
        انسان پخش دستیار را قطع می‌کند و ارائه‌دهنده از کوتاه‌کردن یا پاک‌کردن
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
        قابلیت‌های ویدئو از شکلی **آگاه از حالت** استفاده می‌کنند: `generate`،
        `imageToVideo`، و `videoToVideo`. فیلدهای تجمیعی تخت مانند
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` برای
        اعلام پشتیبانی از حالت تبدیل یا حالت‌های غیرفعال‌شده به‌صورت شفاف
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

Pluginهای ارائه‌دهنده همانند هر Plugin کد خارجی دیگری منتشر می‌شوند:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

در اینجا از نام مستعار انتشار قدیمی مخصوص مهارت استفاده نکنید؛ بسته‌های Plugin باید از
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

| ترتیب     | زمان          | مورد استفاده                                      |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | گذر نخست      | ارائه‌دهنده‌های ساده مبتنی بر کلید API           |
| `profile` | پس از simple  | ارائه‌دهنده‌هایی که به پروفایل‌های احراز هویت وابسته‌اند |
| `paired`  | پس از profile | ترکیب چند مدخل مرتبط                            |
| `late`    | گذر آخر       | بازنویسی ارائه‌دهنده‌های موجود (در برخورد برنده می‌شود) |

## گام‌های بعدی

- [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) - اگر Plugin شما یک کانال نیز ارائه می‌دهد
- [زمان اجرای SDK](/fa/plugins/sdk-runtime) - راهنماهای `api.runtime` (TTS، جست‌وجو، زیردستیار)
- [نمای کلی SDK](/fa/plugins/sdk-overview) - مرجع کامل import زیرمسیر
- [درونیات Plugin](/fa/plugins/architecture-internals#provider-runtime-hooks) - جزئیات hook و نمونه‌های همراه

## مرتبط

- [راه‌اندازی SDK Plugin](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [ساخت Pluginهای کانال](/fa/plugins/sdk-channel-plugins)
