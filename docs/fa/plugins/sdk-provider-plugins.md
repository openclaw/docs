---
read_when:
    - شما در حال ساخت یک Plugin جدید برای ارائه‌دهندهٔ مدل هستید
    - می‌خواهید یک پروکسی سازگار با OpenAI یا یک LLM سفارشی به OpenClaw اضافه کنید
    - باید احراز هویت ارائه‌دهنده، کاتالوگ‌ها و هوک‌های زمان اجرا را درک کنید
sidebarTitle: Provider plugins
summary: راهنمای گام‌به‌گام ساخت Plugin ارائه‌دهندهٔ مدل برای OpenClaw
title: ساخت Pluginهای ارائه‌دهنده
x-i18n:
    generated_at: "2026-07-12T10:33:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ebbe59b4487a93c6fec3624251eff7394197e249bb8fc7899f1fc88162510d1c
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

یک Plugin ارائه‌دهنده بسازید تا یک ارائه‌دهنده مدل (LLM) به OpenClaw اضافه شود: کاتالوگ مدل، احراز هویت با کلید API و تفکیک پویای مدل.

<Info>
  اگر با Pluginهای OpenClaw تازه آشنا شده‌اید، ابتدا برای ساختار بسته و تنظیم مانیفست، [شروع کار](/fa/plugins/building-plugins) را بخوانید.
</Info>

<Tip>
  Pluginهای ارائه‌دهنده، مدل‌ها را به حلقه استنتاج عادی OpenClaw اضافه می‌کنند. اگر مدل باید از طریق یک دیمن عامل بومی اجرا شود که مالک رشته‌ها، Compaction یا رویدادهای ابزار است، به‌جای قراردادن جزئیات پروتکل دیمن در هسته، ارائه‌دهنده را با یک [مهار عامل](/fa/plugins/sdk-agent-harness) همراه کنید.
</Tip>

## راهنمای گام‌به‌گام

<Steps>
  <Step title="بسته و مانیفست">
    ### گام ۱: بسته و مانیفست

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
      "setup": {
        "providers": [
          {
            "id": "acme-ai",
            "envVars": ["ACME_AI_API_KEY"]
          }
        ]
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

    `setup.providers[].envVars` به OpenClaw اجازه می‌دهد بدون بارگذاری زمان‌اجرای Plugin شما، اعتبارنامه‌ها را تشخیص دهد. وقتی یک گونه ارائه‌دهنده باید از احراز هویت شناسه ارائه‌دهنده دیگری استفاده کند، `providerAuthAliases` را اضافه کنید. `modelSupport` اختیاری است و به OpenClaw اجازه می‌دهد پیش از وجود قلاب‌های زمان اجرا، Plugin ارائه‌دهنده شما را به‌طور خودکار از روی شناسه‌های کوتاه مدل مانند `acme-large` بارگذاری کند. `openclaw.compat` و `openclaw.build` در `package.json` برای انتشار در ClawHub الزامی هستند (`openclaw.compat.pluginApi` و `openclaw.build.openclawVersion` دو فیلد الزامی‌اند؛ اگر `minGatewayVersion` حذف شود، از `openclaw.install.minHostVersion` استفاده می‌شود).

  </Step>

  <Step title="ثبت ارائه‌دهنده">
    یک ارائه‌دهنده متنی حداقلی به `id`، `label`، `auth` و `catalog` نیاز دارد. `catalog` قلاب زمان اجرا/پیکربندی متعلق به ارائه‌دهنده است؛ می‌تواند APIهای زنده فروشنده را فراخوانی کند و ورودی‌های `models.providers` را برمی‌گرداند.

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

    `registerModelCatalogProvider` سطح جدیدتر کاتالوگ صفحه کنترل برای رابط کاربری فهرست، راهنما و انتخاب‌گر است و ردیف‌های `text`، `voice`، `image_generation`، `video_generation` و `music_generation` را پوشش می‌دهد. فراخوانی‌های نقطه پایانی فروشنده و نگاشت پاسخ را در Plugin نگه دارید؛ OpenClaw مالک ساختار مشترک ردیف، برچسب‌های منبع و رندر راهنما است.

    این یک ارائه‌دهنده عملیاتی است. کاربران اکنون می‌توانند `openclaw onboard --acme-ai-api-key <key>` را اجرا کنند و `acme-ai/acme-large` را به‌عنوان مدل خود برگزینند.

    ### کشف زنده مدل

    اگر ارائه‌دهنده شما APIای شبیه `/models` ارائه می‌کند، نقطه پایانی مختص ارائه‌دهنده و نگاشت ردیف را در Plugin خود نگه دارید و برای چرخه عمر واکشی مشترک از `openclaw/plugin-sdk/provider-catalog-live-runtime` استفاده کنید. این ابزار کمکی، واکشی‌های HTTP محافظت‌شده، سرآیندهای احراز هویت ارائه‌دهنده، خطاهای ساخت‌یافته HTTP، حافظه نهان TTL و رفتار بازگشت به حالت ایستا را بدون قراردادن سیاست ارائه‌دهنده در هسته OpenClaw فراهم می‌کند.

    هنگامی از `buildLiveModelProviderConfig` استفاده کنید که API زنده فقط مشخص می‌کند کدام ردیف‌های کاتالوگ ایستای متعلق به ارائه‌دهنده در حال حاضر در دسترس هستند:

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      buildLiveModelProviderConfig,
      type LiveModelCatalogFetchGuard,
    } from "openclaw/plugin-sdk/provider-catalog-live-runtime";

    const STATIC_MODELS = [
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
    ] as const;

    async function buildAcmeLiveProvider(params: {
      apiKey: string;
      discoveryApiKey?: string;
      fetchGuard?: LiveModelCatalogFetchGuard;
    }) {
      return await buildLiveModelProviderConfig({
        providerId: "acme-ai",
        endpoint: "https://api.acme-ai.com/v1/models",
        providerConfig: {
          baseUrl: "https://api.acme-ai.com/v1",
          api: "openai-completions",
        },
        models: STATIC_MODELS,
        apiKey: params.apiKey,
        discoveryApiKey: params.discoveryApiKey,
        fetchGuard: params.fetchGuard,
        ttlMs: 60_000,
        auditContext: "acme-ai-model-discovery",
      });
    }

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          catalog: {
            order: "simple",
            run: async (ctx) => {
              const auth = ctx.resolveProviderAuth("acme-ai");
              const apiKey =
                auth.apiKey ?? ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: await buildAcmeLiveProvider({
                  apiKey,
                  discoveryApiKey: auth.discoveryApiKey,
                }),
              };
            },
          },
          staticCatalog: {
            order: "simple",
            run: async () => ({
              provider: {
                baseUrl: "https://api.acme-ai.com/v1",
                api: "openai-completions",
                models: [...STATIC_MODELS],
              },
            }),
          },
        });
      },
    });
    ```

    هنگامی از `getCachedLiveProviderModelRows` استفاده کنید که API ارائه‌دهنده فراداده غنی‌تری برمی‌گرداند و Plugin باید خودش ردیف‌ها را به تعاریف مدل OpenClaw نگاشت کند:

    ```typescript index.ts
    import {
      getCachedLiveProviderModelRows,
      LiveModelCatalogHttpError,
    } from "openclaw/plugin-sdk/provider-catalog-live-runtime";

    async function discoverAcmeModels(apiKey: string) {
      try {
        const rows = await getCachedLiveProviderModelRows({
          providerId: "acme-ai",
          endpoint: "https://api.acme-ai.com/v1/models",
          apiKey,
          ttlMs: 60_000,
          auditContext: "acme-ai-model-discovery",
        });
        return rows
          .map((row) => projectAcmeModel(row))
          .filter((model) => model !== null);
      } catch (error) {
        if (error instanceof LiveModelCatalogHttpError) {
          return STATIC_MODELS;
        }
        throw error;
      }
    }
    ```

    `run` باید همچنان به احراز هویت وابسته باشد و هنگامی که اعتبارنامه قابل‌استفاده‌ای موجود نیست، `null` برگرداند. یک `staticRun` آفلاین یا بازگشت ایستا نگه دارید تا راه‌اندازی، مستندات، آزمون‌ها و سطوح انتخاب‌گر به دسترسی زنده شبکه وابسته نباشند. از TTL متناسب با تازگی فهرست مدل استفاده کنید، از پایش سامانه فایل هنگام درخواست بپرهیزید و فقط زمانی `readRows` / `readModelId` مختص ارائه‌دهنده را ارسال کنید که پاسخ بالادستی قالب سازگار با OpenAI یعنی `{ data: [{ id, object }] }` را نداشته باشد.

    اگر ارائه‌دهنده بالادستی از توکن‌های کنترلی متفاوتی نسبت به OpenClaw استفاده می‌کند، به‌جای جایگزین‌کردن مسیر جریان، یک تبدیل متنی دوسویه کوچک اضافه کنید:

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

    `input` پیش از انتقال، اعلان نهایی سیستم و محتوای پیام متنی را بازنویسی می‌کند. `output` پیش از آنکه OpenClaw نشانگرهای کنترلی خودش را تجزیه کند یا تحویل به کانال انجام شود، دلتاهای متنی دستیار و متن نهایی را بازنویسی می‌کند.

    برای ارائه‌دهندگان همراهی که فقط یک ارائه‌دهنده متنی با احراز هویت کلید API و یک زمان‌اجرای مبتنی بر کاتالوگ ثبت می‌کنند، ابزار کمکی محدودتر `defineSingleProviderPluginEntry(...)` را ترجیح دهید:

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

    `buildProvider` مسیر کاتالوگ زنده‌ای است که وقتی OpenClaw بتواند اطلاعات احراز هویت واقعی
    ارائه‌دهنده را برطرف کند، استفاده می‌شود. این مسیر می‌تواند کشف مختص ارائه‌دهنده را انجام دهد. از
    `buildStaticProvider` فقط برای ردیف‌های آفلاینی استفاده کنید که نمایش آن‌ها پیش از پیکربندی احراز هویت
    ایمن است؛ این مسیر نباید به اطلاعات اعتبارسنجی نیاز داشته باشد یا درخواست شبکه ارسال کند.
    نمایش `models list --all` در OpenClaw در حال حاضر کاتالوگ‌های ایستا را
    فقط برای Pluginهای ارائه‌دهنده همراه، با پیکربندی خالی، محیط خالی و بدون
    مسیرهای عامل/فضای کاری اجرا می‌کند.

    اگر جریان احراز هویت شما باید هنگام راه‌اندازی اولیه، `models.providers.*`، نام‌های مستعار و
    مدل پیش‌فرض عامل را نیز اصلاح کند، از کمک‌سازهای پیش‌تنظیم موجود در
    `openclaw/plugin-sdk/provider-onboard` استفاده کنید. محدودترین کمک‌سازها عبارت‌اند از
    `createDefaultModelPresetAppliers(...)`،
    `createDefaultModelsPresetAppliers(...)` و
    `createModelCatalogPresetAppliers(...)`.

    وقتی نقطه پایانی بومی یک ارائه‌دهنده از بلوک‌های مصرف جریانی روی
    انتقال عادی `openai-completions` پشتیبانی می‌کند، به‌جای کدنویسی مستقیم
    بررسی شناسه ارائه‌دهنده، کمک‌سازهای مشترک کاتالوگ در
    `openclaw/plugin-sdk/provider-catalog-shared` را ترجیح دهید.
    `supportsNativeStreamingUsageCompat(...)` و
    `applyProviderNativeStreamingUsageCompat(...)` پشتیبانی را از نگاشت قابلیت‌های
    نقطه پایانی تشخیص می‌دهند؛ بنابراین نقاط پایانی بومی به سبک Moonshot/DashScope، حتی
    زمانی که یک Plugin از شناسه ارائه‌دهنده سفارشی استفاده می‌کند، همچنان می‌توانند آن را فعال کنند.

    نمونه‌های کشف زنده بالا APIهای ارائه‌دهنده به سبک `/models` را پوشش می‌دهند. این
    کشف را درون `catalog.run` و مشروط به وجود احراز هویت قابل‌استفاده نگه دارید و
    `staticRun` را برای تولید کاتالوگ آفلاین بدون دسترسی شبکه حفظ کنید.

  </Step>

  <Step title="Add dynamic model resolution">
    اگر ارائه‌دهنده شما شناسه‌های مدل دلخواه را می‌پذیرد (مانند یک پراکسی یا مسیریاب)،
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

    اگر برطرف‌سازی به فراخوانی شبکه نیاز دارد، برای آماده‌سازی اولیه ناهمگام از
    `prepareDynamicModel` استفاده کنید؛ پس از تکمیل آن، `resolveDynamicModel` دوباره اجرا می‌شود.

  </Step>

  <Step title="Add runtime hooks (as needed)">
    بیشتر ارائه‌دهندگان فقط به `catalog` و `resolveDynamicModel` نیاز دارند. هوک‌ها را
    به‌تدریج و متناسب با نیازهای ارائه‌دهنده خود اضافه کنید.

    سازنده‌های کمکی مشترک اکنون رایج‌ترین خانواده‌های بازپخش/سازگاری ابزار را
    پوشش می‌دهند؛ بنابراین Pluginها معمولاً نیازی ندارند هر هوک را جداگانه به‌صورت دستی متصل کنند:

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

    خانواده‌های بازپخش موجود در حال حاضر:

    | خانواده | مواردی که متصل می‌کند | نمونه‌های همراه |
    | --- | --- | --- |
    | `openai-compatible` | سیاست بازپخش مشترک به سبک OpenAI برای انتقال‌های سازگار با OpenAI، شامل پاک‌سازی شناسه فراخوانی ابزار، اصلاح ترتیب دستیار-ابتدا و اعتبارسنجی عمومی نوبت Gemini در جاهایی که انتقال به آن نیاز دارد | `moonshot`، `ollama`، `xai`، `zai` |
    | `anthropic-by-model` | سیاست بازپخش آگاه از Claude که بر اساس `modelId` انتخاب می‌شود؛ بنابراین انتقال‌های پیام Anthropic فقط زمانی پاک‌سازی بلوک تفکر مختص Claude را دریافت می‌کنند که مدل برطرف‌شده واقعاً یک شناسه Claude باشد | `amazon-bedrock` |
    | `native-anthropic-by-model` | همان سیاست Claude بر اساس مدل در `anthropic-by-model`، به‌علاوه پاک‌سازی شناسه فراخوانی ابزار و حفظ شناسه بومی استفاده از ابزار Anthropic برای انتقال‌هایی که باید شناسه‌های بومی فروشنده را نگه دارند | `anthropic-vertex`، `clawrouter` |
    | `google-gemini` | سیاست بازپخش بومی Gemini به‌همراه پاک‌سازی بازپخش راه‌اندازی اولیه. خانواده مشترک، Gemini CLI با خروجی متنی را روی استدلال برچسب‌گذاری‌شده نگه می‌دارد؛ ارائه‌دهنده مستقیم `google`، مقدار `resolveReasoningOutputMode` را با `native` بازنویسی می‌کند، زیرا تفکر Gemini API به‌شکل بخش‌های بومی اندیشه دریافت می‌شود. | `google`، `google-gemini-cli` |
    | `passthrough-gemini` | پاک‌سازی امضای اندیشه Gemini برای مدل‌های Gemini که از طریق انتقال‌های پراکسی سازگار با OpenAI اجرا می‌شوند؛ اعتبارسنجی بازپخش بومی Gemini یا بازنویسی‌های راه‌اندازی اولیه را فعال نمی‌کند | `openrouter`، `kilocode`، `opencode`، `opencode-go` |
    | `hybrid-anthropic-openai` | سیاست ترکیبی برای ارائه‌دهندگانی که سطوح مدل پیام Anthropic و سازگار با OpenAI را در یک Plugin ترکیب می‌کنند؛ حذف اختیاری بلوک تفکر مختص Claude فقط به بخش Anthropic محدود می‌ماند | `minimax` |

    خانواده‌های جریان موجود در حال حاضر:

    | خانواده | مواردی که متصل می‌کند | نمونه‌های همراه |
    | --- | --- | --- |
    | `google-thinking` | عادی‌سازی محموله تفکر Gemini در مسیر جریان مشترک | `google`، `google-gemini-cli` |
    | `kilocode-thinking` | پوشش‌دهنده استدلال Kilo در مسیر جریان پراکسی مشترک؛ `kilo/auto` و شناسه‌های استدلال پشتیبانی‌نشده پراکسی، تفکر تزریق‌شده را نادیده می‌گیرند | `kilocode` |
    | `moonshot-thinking` | نگاشت محموله دودویی تفکر بومی Moonshot از پیکربندی و سطح `/think` | `moonshot` |
    | `minimax-fast-mode` | بازنویسی مدل حالت سریع MiniMax در مسیر جریان مشترک | `minimax`، `minimax-portal` |
    | `openai-responses-defaults` | پوشش‌دهنده‌های مشترک بومی OpenAI/Codex Responses: سرآیندهای انتساب، `/fast`/`serviceTier`، میزان تفصیل متن، جست‌وجوی وب بومی Codex، شکل‌دهی محموله سازگاری استدلال و مدیریت زمینه Responses | `openai` |
    | `openrouter-thinking` | پوشش‌دهنده استدلال OpenRouter برای مسیرهای پراکسی، با مدیریت متمرکز نادیده‌گرفتن مدل پشتیبانی‌نشده/`auto` | `openrouter` |
    | `tool-stream-default-on` | پوشش‌دهنده `tool_stream` با فعال‌بودن پیش‌فرض برای ارائه‌دهندگانی مانند Z.AI که جریان ابزار را می‌خواهند، مگر اینکه صراحتاً غیرفعال شده باشد | `zai` |

    <Accordion title="SDK seams powering the family builders">
      هر سازنده خانواده از کمک‌سازهای عمومی سطح پایین‌تری تشکیل شده است که از همان بسته صادر می‌شوند و وقتی یک ارائه‌دهنده باید از الگوی رایج خارج شود، می‌توانید از آن‌ها استفاده کنید:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`، `buildProviderReplayFamilyHooks(...)` و سازنده‌های خام بازپخش (`buildOpenAICompatibleReplayPolicy`، `buildAnthropicReplayPolicyForModel`، `buildGoogleGeminiReplayPolicy`، `buildHybridAnthropicOrOpenAIReplayPolicy`). همچنین کمک‌سازهای بازپخش Gemini (`sanitizeGoogleGeminiReplayHistory`، `resolveTaggedReasoningOutputMode`) و کمک‌سازهای نقطه پایانی/مدل (`resolveProviderEndpoint`، `normalizeProviderId`، `normalizeGooglePreviewModelId`) را صادر می‌کند.
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`، `buildProviderStreamFamilyHooks(...)`، `composeProviderStreamWrappers(...)`، به‌همراه پوشش‌دهنده‌های مشترک OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`، `createOpenAIFastModeWrapper`، `createOpenAIServiceTierWrapper`، `createOpenAIResponsesContextManagementWrapper`، `createCodexNativeWebSearchWrapper`)، پوشش‌دهنده سازگار با OpenAI برای DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`)، پاک‌سازی پیش‌پرکردن تفکر در پیام‌های Anthropic (`createAnthropicThinkingPrefillPayloadWrapper`)، سازگاری فراخوانی ابزار با متن ساده (`createPlainTextToolCallCompatWrapper`) و پوشش‌دهنده‌های مشترک پراکسی/ارائه‌دهنده (`createOpenRouterWrapper`، `createToolStreamWrapper`، `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` - پوشش‌دهنده‌های سبک محموله و رویداد برای مسیرهای داغ ارائه‌دهنده، شامل `createOpenAICompatibleCompletionsThinkingOffWrapper`، `createPayloadPatchStreamWrapper`، `createPlainTextToolCallCompatWrapper`، `normalizeOpenAICompatibleReasoningPayload(...)` و `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`، `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` و کمک‌سازهای زیربنایی شِمای ارائه‌دهنده.

      برای ارائه‌دهندگان خانواده Gemini، حالت خروجی استدلال را با
      انتقال هماهنگ نگه دارید. ارائه‌دهندگان مستقیم Google Gemini API باید از خروجی استدلال
      `native` استفاده کنند تا OpenClaw بخش‌های بومی اندیشه را بدون افزودن
      دستورهای اعلان `<think>` / `<final>` مصرف کند. پشتیبان‌های فقط‌متنی به سبک
      Gemini CLI که پاسخ نهایی JSON/متنی را تجزیه می‌کنند، می‌توانند قرارداد
      برچسب‌گذاری‌شده مشترک `google-gemini` را حفظ کنند.

      برخی کمک‌سازهای جریان عمداً در سطح ارائه‌دهنده محلی باقی می‌مانند. `@openclaw/anthropic-provider`، موارد `wrapAnthropicProviderStream`، `resolveAnthropicBetas`، `resolveAnthropicFastMode`، `resolveAnthropicServiceTier` و سازنده‌های سطح پایین‌تر پوشش‌دهنده Anthropic را در مرز عمومی `api.ts` / `contract-api.ts` خود نگه می‌دارد، زیرا آن‌ها مدیریت بتای OAuth مربوط به Claude و محدودسازی `context1m` را کدگذاری می‌کنند. Plugin مربوط به xAI نیز به‌طور مشابه شکل‌دهی بومی xAI Responses را در `wrapStreamFn` خود نگه می‌دارد (نام‌های مستعار `/fast`، مقدار پیش‌فرض `tool_stream`، پاک‌سازی ابزار سخت‌گیرانه پشتیبانی‌نشده و حذف محموله استدلال مختص xAI).

      همین الگوی ریشه بسته، زیربنای `@openclaw/openai-provider` (سازنده‌های ارائه‌دهنده، کمک‌سازهای مدل پیش‌فرض و سازنده‌های ارائه‌دهنده بلادرنگ) و `@openclaw/openrouter-provider` (سازنده ارائه‌دهنده به‌همراه کمک‌سازهای راه‌اندازی اولیه/پیکربندی) نیز هست.
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
        برای ارائه‌دهندگانی که به سرآیندهای سفارشی درخواست یا تغییرات بدنه نیاز دارند:

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
        برای ارائه‌دهندگانی که به سرآیندها یا فراداده بومی درخواست/نشست در
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

        `resolveUsageAuth` سه نتیجه دارد. هنگامی که ارائه‌دهنده دارای اعتبارنامهٔ
        مصرف/صورت‌حساب است، مقدار
        `{ token, accountId?, subscriptionType?, rateLimitTier? }` را برگردانید
        (فیلدهای اختیاری، فراداده‌های غیرمحرمانهٔ طرح را از پروفایل حل‌شده به
        `fetchUsageSnapshot` منتقل می‌کنند). تنها زمانی
        `{ handled: true }` را برگردانید که ارائه‌دهنده احراز هویت مصرف را
        قطعاً مدیریت کرده، اما هیچ توکن مصرف قابل‌استفاده‌ای ندارد و OpenClaw
        باید بازگشت عمومی به کلید API/OAuth را نادیده بگیرد. هنگامی که
        ارائه‌دهنده درخواست را مدیریت نکرده و OpenClaw باید بازگشت عمومی را
        ادامه دهد، `null` یا `undefined` را برگردانید.

        شناسهٔ ارائه‌دهنده را در `contracts.usageProviders` اعلام کنید. هنگامی
        که آن قرارداد مانیفست و **هر دو** هوک وجود داشته باشند، OpenClaw بدون
        بارگذاری Pluginهای نامرتبط ارائه‌دهنده، آن ارائه‌دهنده را به‌طور خودکار
        در گردآوری مصرف می‌گنجاند. نیازی به به‌روزرسانی فهرست مجاز هسته نیست.
        `fetchUsageSnapshot` ساختار مشترک و مستقل از ارائه‌دهندهٔ زیر را برمی‌گرداند:

        - `plan`: اشتراک یا برچسب کلید گزارش‌شده توسط ارائه‌دهنده
        - `windows`: بازه‌های سهمیهٔ قابل‌بازنشانی به‌صورت درصد مصرف‌شده
        - `billing`: ورودی‌های نوع‌دار `balance`، `spend` یا `budget`؛ `unit`
          می‌تواند یک ارز ISO یا واحد ارائه‌دهنده‌ای مانند `credits` باشد
        - `summary`: زمینهٔ فشرده و مختص ارائه‌دهنده که در آن فیلدهای ساختاریافته
          نمی‌گنجد

        معنای ارز را دقیق حفظ کنید. اعتبار یک ارائه‌دهنده دلار آمریکا نیست،
        مگر اینکه قرارداد بالادستی چنین بگوید. Pluginی که تنها
        `fetchUsageSnapshot` را پیاده‌سازی می‌کند، برای فراخواننده‌های
        صریح/مصنوعی در دسترس می‌ماند، اما به‌طور خودکار کشف نمی‌شود؛ زیرا
        OpenClaw نمی‌تواند اعتبارنامهٔ مصرف آن را حل کند.
      </Tab>
    </Tabs>

    <Accordion title="هوک‌های رایج ارائه‌دهنده">
      OpenClaw برای Pluginهای مدل/ارائه‌دهنده، هوک‌ها را تقریباً با این ترتیب
      فراخوانی می‌کند. بیشتر ارائه‌دهندگان تنها از ۲ تا ۳ مورد استفاده می‌کنند.
      این قرارداد کامل `ProviderPlugin` نیست؛ برای فهرست کامل و دقیق فعلی هوک‌ها
      و نکات بازگشت، به [جزئیات داخلی: هوک‌های زمان اجرای
      ارائه‌دهنده](/fa/plugins/architecture-internals#provider-runtime-hooks)
      مراجعه کنید. فیلدهای ارائه‌دهنده که فقط برای سازگاری هستند و OpenClaw دیگر
      آن‌ها را فراخوانی نمی‌کند، مانند `ProviderPlugin.capabilities` و
      `suppressBuiltInModel`، در اینجا فهرست نشده‌اند.

      | هوک | زمان استفاده |
      | --- | --- |
      | `catalog` | کاتالوگ مدل یا پیش‌فرض‌های URL پایه |
      | `applyConfigDefaults` | پیش‌فرض‌های سراسری متعلق به ارائه‌دهنده هنگام مادی‌سازی پیکربندی |
      | `normalizeModelId` | پاک‌سازی نام مستعار شناسهٔ مدل قدیمی/پیش‌نمایش پیش از جست‌وجو |
      | `normalizeTransport` | پاک‌سازی `api` / `baseUrl` خانوادهٔ ارائه‌دهنده پیش از سرهم‌بندی عمومی مدل |
      | `normalizeConfig` | عادی‌سازی پیکربندی `models.providers.<id>` |
      | `applyNativeStreamingUsageCompat` | بازنویسی‌های سازگاری بومی مصرف جریانی برای ارائه‌دهندگان پیکربندی |
      | `resolveConfigApiKey` | حل احراز هویت نشانگر محیطی متعلق به ارائه‌دهنده |
      | `resolveSyntheticAuth` | احراز هویت مصنوعی محلی/خودمیزبان یا مبتنی بر پیکربندی |
      | `resolveExternalAuthProfiles` | هم‌پوشانی پروفایل‌های احراز هویت خارجی متعلق به ارائه‌دهنده برای اعتبارنامه‌های مدیریت‌شده توسط CLI/برنامه |
      | `shouldDeferSyntheticProfileAuth` | قرار دادن جای‌گیرهای مصنوعی پروفایل ذخیره‌شده در اولویت پایین‌تر از احراز هویت محیطی/پیکربندی |
      | `resolveDynamicModel` | پذیرش شناسه‌های دلخواه مدل بالادستی |
      | `prepareDynamicModel` | واکشی ناهمگام فراداده پیش از حل |
      | `normalizeResolvedModel` | بازنویسی‌های انتقال پیش از اجراکننده |
      | `normalizeToolSchemas` | پاک‌سازی شِمای ابزار متعلق به ارائه‌دهنده پیش از ثبت |
      | `inspectToolSchemas` | عیب‌یابی شِمای ابزار متعلق به ارائه‌دهنده |
      | `resolveReasoningOutputMode` | قرارداد خروجی استدلال برچسب‌دار در برابر بومی |
      | `prepareExtraParams` | پارامترهای پیش‌فرض درخواست |
      | `createStreamFn` | انتقال کاملاً سفارشی StreamFn |
      | `wrapStreamFn` | پوشش‌های سفارشی سرآیند/بدنه در مسیر عادی جریان |
      | `resolveTransportTurnState` | سرآیندها/فرادادهٔ بومی هر نوبت |
      | `resolveWebSocketSessionPolicy` | سرآیندها/دورهٔ انتظار نشست بومی WS |
      | `formatApiKey` | ساختار سفارشی توکن زمان اجرا |
      | `refreshOAuth` | تازه‌سازی سفارشی OAuth |
      | `buildAuthDoctorHint` | راهنمایی ترمیم احراز هویت |
      | `matchesContextOverflowError` | تشخیص سرریز متعلق به ارائه‌دهنده |
      | `classifyFailoverReason` | دسته‌بندی محدودیت نرخ/بار بیش‌ازحد متعلق به ارائه‌دهنده |
      | `isCacheTtlEligible` | کنترل TTL حافظهٔ نهان پرامپت |
      | `buildMissingAuthMessage` | راهنمای سفارشی احراز هویت مفقود |
      | `augmentModelCatalog` | ردیف‌های مصنوعی سازگاری آینده‌نگر (منسوخ؛ `registerModelCatalogProvider` را ترجیح دهید) |
      | `resolveThinkingProfile` | مجموعه گزینه‌های `/think` مختص مدل |
      | `isBinaryThinking` | سازگاری روشن/خاموش تفکر دودویی (منسوخ؛ `resolveThinkingProfile` را ترجیح دهید) |
      | `supportsXHighThinking` | سازگاری پشتیبانی از استدلال `xhigh` (منسوخ؛ `resolveThinkingProfile` را ترجیح دهید) |
      | `resolveDefaultThinkingLevel` | سازگاری سیاست پیش‌فرض `/think` (منسوخ؛ `resolveThinkingProfile` را ترجیح دهید) |
      | `isModernModelRef` | تطبیق مدل زنده/آزمایش دود |
      | `prepareRuntimeAuth` | تبادل توکن پیش از استنتاج |
      | `resolveUsageAuth` | تجزیهٔ سفارشی اعتبارنامهٔ مصرف |
      | `fetchUsageSnapshot` | نقطهٔ پایانی سفارشی مصرف |
      | `createEmbeddingProvider` | سازگارکنندهٔ تعبیه متعلق به ارائه‌دهنده برای حافظه/جست‌وجو |
      | `buildReplayPolicy` | سیاست سفارشی بازپخش رونوشت/Compaction |
      | `sanitizeReplayHistory` | بازنویسی‌های بازپخش مختص ارائه‌دهنده پس از پاک‌سازی عمومی |
      | `validateReplayTurns` | اعتبارسنجی سخت‌گیرانهٔ نوبت‌های بازپخش پیش از اجراکنندهٔ توکار |
      | `onModelSelected` | فراخوانی پس از انتخاب (برای مثال، دورسنجی) |

      نکات بازگشت زمان اجرا:

      - `normalizeConfig` برای هر شناسهٔ ارائه‌دهنده یک Plugin مالک را حل می‌کند
        (ابتدا ارائه‌دهندگان همراه، سپس Plugin زمان اجرای منطبق) و تنها همان هوک
        را فراخوانی می‌کند؛ هیچ پیمایشی در سایر ارائه‌دهندگان انجام نمی‌شود. هوک
        `normalizeConfig` خود Google همان چیزی است که ورودی‌های پیکربندی
        `google` / `google-vertex` / `google-antigravity` را عادی‌سازی می‌کند؛
        این یک بازگشت جداگانهٔ هسته نیست.
      - `resolveConfigApiKey` در صورت ارائه‌شدن، از هوک ارائه‌دهنده استفاده
        می‌کند. Amazon Bedrock حل نشانگر محیطی AWS را در Plugin ارائه‌دهندهٔ خود
        نگه می‌دارد؛ خود احراز هویت زمان اجرا، هنگامی که با
        `auth: "aws-sdk"` پیکربندی شده باشد، همچنان از زنجیرهٔ پیش‌فرض AWS SDK
        استفاده می‌کند.
      - `resolveThinkingProfile(ctx)`، `provider` و `modelId` انتخاب‌شده،
        راهنمای اختیاری و ادغام‌شدهٔ کاتالوگ `reasoning` و واقعیت‌های اختیاری
        و ادغام‌شدهٔ `compat` مدل را دریافت می‌کند. از `compat` فقط برای انتخاب
        رابط کاربری/پروفایل تفکر ارائه‌دهنده استفاده کنید.
      - `resolveSystemPromptContribution` به ارائه‌دهنده اجازه می‌دهد راهنمایی
        پرامپت سیستمی آگاه از حافظهٔ نهان را برای یک خانوادهٔ مدل تزریق کند.
        هنگامی که رفتار به یک خانوادهٔ ارائه‌دهنده/مدل تعلق دارد و باید جداسازی
        پایدار/پویای حافظهٔ نهان را حفظ کند، آن را به هوک قدیمی و سراسری Plugin
        یعنی `before_prompt_build` ترجیح دهید.

    </Accordion>

  </Step>

  <Step title="افزودن قابلیت‌های بیشتر (اختیاری)">
    ### گام ۵: افزودن قابلیت‌های بیشتر

    یک Plugin ارائه‌دهنده می‌تواند در کنار استنتاج متنی، تعبیه‌ها، گفتار،
    رونویسی بلادرنگ، صدای بلادرنگ، درک رسانه، تولید تصویر، تولید ویدئو،
    واکشی وب و جست‌وجوی وب را ثبت کند. OpenClaw این را به‌عنوان یک Plugin
    **قابلیت ترکیبی** دسته‌بندی می‌کند؛ الگوی پیشنهادی برای Pluginهای شرکتی
    (یک Plugin برای هر فروشنده). به
    [جزئیات داخلی: مالکیت قابلیت](/fa/plugins/architecture#capability-ownership-model)
    مراجعه کنید.

    هر قابلیت را داخل `register(api)` و در کنار فراخوانی موجود
    `api.registerProvider(...)` ثبت کنید. فقط زبانه‌های موردنیاز خود را انتخاب
    کنید:

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
          defaultTimeoutMs: 120_000,
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

        برای خطاهای HTTP ارائه‌دهنده از `assertOkOrThrowProviderError(...)`
        استفاده کنید تا Pluginها خواندن محدودشدهٔ بدنهٔ خطا، تجزیهٔ خطای JSON
        و پسوندهای شناسهٔ درخواست را به‌اشتراک بگذارند.
      </Tab>
      <Tab title="رونویسی بلادرنگ">
        `createRealtimeTranscriptionWebSocketSession(...)` را ترجیح دهید؛ این
        کمک‌کنندهٔ مشترک، ثبت پراکسی، تأخیر تصاعدی اتصال مجدد، تخلیه هنگام بستن،
        دست‌دهی‌های آمادگی، صف‌بندی صوت و عیب‌یابی رویداد بستن را مدیریت می‌کند.
        Plugin شما فقط رویدادهای بالادستی را نگاشت می‌کند.

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

        ارائه‌دهندگان دسته‌ای STT که صدای چندبخشی را با POST ارسال می‌کنند، باید از
        `buildAudioTranscriptionFormData(...)` در
        `openclaw/plugin-sdk/provider-http` استفاده کنند. این تابع کمکی نام
        فایل‌های بارگذاری را یکدست می‌کند، از جمله بارگذاری‌های AAC که برای
        سازگاری با APIهای رونویسی به نام فایلی به سبک M4A نیاز دارند.
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
            handlesInputAudioBargeIn: true,
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

        `capabilities` را اعلام کنید تا `talk.catalog` بتواند حالت‌ها،
        انتقال‌ها، قالب‌های صوتی و پرچم‌های قابلیت معتبر را در اختیار
        کلاینت‌های مرورگری و بومی Talk قرار دهد. وقتی یک انتقال می‌تواند تشخیص
        دهد که انسان در حال قطع پخش دستیار است و ارائه‌دهنده از کوتاه‌کردن یا
        پاک‌کردن پاسخ صوتی فعال پشتیبانی می‌کند، `handleBargeIn` را پیاده‌سازی
        کنید.
        `submitToolResult` می‌تواند برای ارسال همگام `void` یا برای مرز تکمیل
        ناهمگامی که پل ارائه‌دهنده می‌تواند ارائه کند `Promise<void>` برگرداند.
        نشست‌های رله Gateway پیش از تأیید نتیجه نهایی یا پاک‌کردن اجرای پیوندخورده،
        منتظر آن promise می‌مانند؛ اگر ارسال ناموفق بود، آن را رد کنید.
        وقتی ارائه‌دهنده نمی‌تواند `options.suppressResponse` را رعایت کند،
        `supportsToolResultSuppression: false` را تنظیم کنید. در این صورت
        OpenClaw برای نتایج داخلی مشورت اجباری و لغو از سرکوب استفاده نمی‌کند و
        درخواست‌های مستقیم نتیجه سرکوب‌شده را به‌جای آغاز بی‌سروصدای یک پاسخ رد
        می‌کند.
        مصرف‌کنندگان `createRealtimeVoiceBridgeSession` نیز می‌توانند از
        `onToolCall` یک promise برگردانند؛ پرتاب‌های همگام و ردشدن‌ها به
        فراخوان بازگشتی `onError` نشست هدایت می‌شوند.
        `handlesInputAudioBargeIn` را فقط زمانی تنظیم کنید که VAD ارائه‌دهنده
        با فراخوانی `onClearAudio("barge-in")` وقوع وقفه را تأیید کند.
        ارائه‌دهندگانی که این پرچم را حذف می‌کنند، از تشخیص جایگزین محلی
        ورودی صوتی OpenClaw استفاده می‌کنند.
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

        ارائه‌دهندگان رسانه محلی یا خودمیزبان که عمداً به اعتبارنامه نیاز
        ندارند، می‌توانند `resolveAuth` را ارائه دهند و `kind: "none"` را
        برگردانند. OpenClaw همچنان دروازه عادی احراز هویت را برای
        ارائه‌دهندگانی که صریحاً شرکت نمی‌کنند، حفظ می‌کند. ارائه‌دهندگان
        موجود می‌توانند به خواندن `req.apiKey` ادامه دهند؛ ارائه‌دهندگان جدید
        باید `req.auth` را ترجیح دهند.

        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "local-audio",
          capabilities: ["audio"],
          resolveAuth: () => ({
            kind: "none",
            source: "local-audio plugin no-auth",
          }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="جاسازی‌ها">
        ```typescript
        api.registerEmbeddingProvider({
          id: "acme-ai",
          defaultModel: "acme-embed",
          transport: "remote",
          authProviderId: "acme-ai",
          create: async ({ model }) => ({
            provider: {
              id: "acme-ai",
              model,
              dimensions: 1536,
              embed: async (input) => {
                const text = typeof input === "string" ? input : input.text;
                return fetchAcmeEmbedding(text);
              },
              embedBatch: async (inputs) =>
                Promise.all(
                  inputs.map((input) =>
                    fetchAcmeEmbedding(typeof input === "string" ? input : input.text),
                  ),
                ),
            },
          }),
        });
        ```

        همان شناسه را در `contracts.embeddingProviders` اعلام کنید. این
        قرارداد عمومی جاسازی برای تولید بردار قابل استفاده مجدد، از جمله جست‌وجوی
        حافظه است. `registerMemoryEmbeddingProvider(...)` سازگاری منسوخ‌شده‌ای
        برای آداپتورهای موجود مختص حافظه است.
      </Tab>
      <Tab title="تولید تصویر و ویدئو">
        قابلیت‌های تصویر و ویدئو از ساختاری **آگاه از حالت** استفاده می‌کنند.
        ارائه‌دهندگان تصویر بلوک‌های قابلیت الزامی `generate` و `edit` را اعلام
        می‌کنند؛ ارائه‌دهندگان ویدئو `generate`، `imageToVideo` و
        `videoToVideo` را اعلام می‌کنند. فیلدهای تجمیعی تخت مانند
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` برای اعلام
        پشتیبانی از حالت تبدیل یا حالت‌های غیرفعال به‌شکلی روشن کافی نیستند.
        تولید موسیقی نیز از همان الگوی `generate` / `edit` پیروی می‌کند.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          capabilities: {
            generate: { maxCount: 4, supportsSize: true },
            edit: { enabled: false },
          },
          generateImage: async (req) => ({ images: [] }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          defaultTimeoutMs: 600_000,
          models: ["acme-video", "acme-image-video"],
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
          catalogByModel: {
            "acme-image-video": {
              modes: ["imageToVideo"],
              capabilities: {
                imageToVideo: {
                  enabled: true,
                  maxVideos: 1,
                  maxInputImages: 1,
                  resolutions: ["480P", "720P", "1080P"],
                  supportsResolution: true,
                },
                videoToVideo: { enabled: false },
              },
            },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```

        `capabilities` برای هر دو نوع ارائه‌دهنده الزامی است؛ `edit` و
        بلوک‌های تبدیل ویدئو (`imageToVideo`، `videoToVideo`) همیشه به پرچم
        صریح `enabled` نیاز دارند.

        وقتی حالت‌های ایستا یا قابلیت‌های یک مدل فهرست‌شده با پیش‌فرض‌های
        ارائه‌دهنده متفاوت است، از `catalogByModel` استفاده کنید. این فراداده
        دقت `video_generate action=list` و کاتالوگ‌های مدل را بدون فراخوانی کد
        ارائه‌دهنده حفظ می‌کند. جست‌وجو و اعمال قابلیت در زمان درخواست همچنان
        بر عهده `resolveModelCapabilities` و `generateVideo` است؛ در صورت امکان
        برای هر دو مسیر از ثابت قابلیت یکسان استفاده کنید.
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
          hint: "Search the web through Acme's search backend.",
          envVars: ["ACME_SEARCH_API_KEY"],
          placeholder: "acme-...",
          signupUrl: "https://acme.example.com/search",
          credentialPath: "plugins.entries.acme.config.webSearch.apiKey",
          getCredentialValue: (searchConfig) => searchConfig?.acme?.apiKey,
          setCredentialValue: (searchConfigTarget, value) => {
            const acme = (searchConfigTarget.acme ??= {});
            acme.apiKey = value;
          },
          createTool: () => ({
            description: "Search the web through Acme Search.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });
        ```

        هر دو نوع ارائه‌دهنده ساختار اتصال اعتبارنامه یکسانی دارند:
        `hint`، `envVars`، `placeholder`، `signupUrl`، `credentialPath`،
        `getCredentialValue`، `setCredentialValue` و `createTool` همگی الزامی
        هستند.
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

`clawhub skill publish <path>` فرمان متفاوتی برای انتشار پوشه یک skill است،
نه بسته Plugin؛ در اینجا از آن استفاده نکنید.

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

`catalog.order` زمان ادغام کاتالوگ شما نسبت به ارائه‌دهندگان داخلی را کنترل
می‌کند:

| ترتیب    | زمان اجرا       | مورد استفاده                                             |
| --------- | -------------- | -------------------------------------------------------- |
| `simple`  | گذر نخست       | ارائه‌دهندگان ساده مبتنی بر کلید API                     |
| `profile` | پس از simple   | ارائه‌دهندگانی که به پروفایل‌های احراز هویت وابسته‌اند   |
| `paired`  | پس از profile  | ترکیب چند ورودی مرتبط                                    |
| `late`    | گذر پایانی     | بازنویسی ارائه‌دهندگان موجود (در تداخل اولویت دارد)       |

## گام‌های بعدی

- [Plugin‌های کانال](/fa/plugins/sdk-channel-plugins) - اگر Plugin شما یک کانال نیز ارائه می‌دهد
- [زمان‌اجرای SDK](/fa/plugins/sdk-runtime) - ابزارهای کمکی `api.runtime` ‏(TTS، جست‌وجو، زیرعامل)
- [نمای کلی SDK](/fa/plugins/sdk-overview) - مرجع کامل واردسازی زیرمسیرها
- [جزئیات داخلی Plugin](/fa/plugins/architecture-internals#provider-runtime-hooks) - جزئیات هوک‌ها و نمونه‌های همراه

## مرتبط

- [راه‌اندازی SDK مربوط به Plugin](/fa/plugins/sdk-setup)
- [ساخت Plugin‌ها](/fa/plugins/building-plugins)
- [ساخت Plugin‌های کانال](/fa/plugins/sdk-channel-plugins)
