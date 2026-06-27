---
read_when:
    - شما در حال ساخت یک Plugin ارائه‌دهندهٔ مدل جدید هستید
    - می‌خواهید یک پروکسی سازگار با OpenAI یا یک LLM سفارشی به OpenClaw اضافه کنید
    - باید احراز هویت ارائه‌دهنده، کاتالوگ‌ها و هوک‌های زمان اجرا را بفهمید
sidebarTitle: Provider plugins
summary: راهنمای گام‌به‌گام ساخت Plugin ارائه‌دهندهٔ مدل برای OpenClaw
title: ساخت Pluginهای ارائه‌دهنده
x-i18n:
    generated_at: "2026-06-27T18:31:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05ac4d08eae00e7e0fcf03edea691dc9ced7309421dd19a31edf69cee1e01f0b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

این راهنما مراحل ساخت یک Plugin ارائه‌دهنده را توضیح می‌دهد که یک ارائه‌دهنده مدل
(LLM) را به OpenClaw اضافه می‌کند. در پایان، ارائه‌دهنده‌ای با کاتالوگ مدل،
احراز هویت با کلید API، و تفکیک پویای مدل خواهید داشت.

<Info>
  اگر پیش‌تر هیچ Pluginای برای OpenClaw نساخته‌اید، ابتدا
  [شروع به کار](/fa/plugins/building-plugins) را برای ساختار پایه بسته
  و تنظیم manifest بخوانید.
</Info>

<Tip>
  Pluginهای ارائه‌دهنده مدل‌ها را به حلقه استنتاج عادی OpenClaw اضافه می‌کنند. اگر مدل
  باید از طریق یک daemon عامل بومی اجرا شود که مالک threadها، Compaction، یا رویدادهای ابزار
  است، ارائه‌دهنده را به‌جای قرار دادن جزئیات پروتکل daemon در core، با یک [agent harness](/fa/plugins/sdk-agent-harness)
  همراه کنید.
</Tip>

## مرور گام‌به‌گام

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

    manifest مقدار `setup.providers[].envVars` را اعلام می‌کند تا OpenClaw بتواند
    credentials را بدون بارگذاری runtime Plugin شما تشخیص دهد. زمانی `providerAuthAliases`
    را اضافه کنید که یک گونه ارائه‌دهنده باید از احراز هویت id ارائه‌دهنده دیگری دوباره استفاده کند. `modelSupport`
    اختیاری است و به OpenClaw امکان می‌دهد Plugin ارائه‌دهنده شما را از شناسه‌های کوتاه‌شده
    مدل مانند `acme-large` پیش از وجود hookهای runtime به‌صورت خودکار بارگذاری کند. اگر
    ارائه‌دهنده را در ClawHub منتشر می‌کنید، آن فیلدهای `openclaw.compat` و `openclaw.build`
    در `package.json` الزامی هستند.

  </Step>

  <Step title="ثبت ارائه‌دهنده">
    یک ارائه‌دهنده متن حداقلی به `id`، `label`، `auth`، و `catalog` نیاز دارد.
    `catalog` hook متعلق به ارائه‌دهنده برای runtime/config است؛ می‌تواند APIهای زنده
    فروشنده را فراخوانی کند و ورودی‌های `models.providers` را برگرداند.

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

    `registerModelCatalogProvider` سطح کاتالوگ control-plane جدیدتر
    برای رابط کاربری list/help/picker است. از آن برای ردیف‌های متن، تولید تصویر،
    تولید ویدئو، و تولید موسیقی استفاده کنید. فراخوانی‌های endpoint فروشنده و
    نگاشت پاسخ را در Plugin نگه دارید؛ OpenClaw مالک شکل مشترک ردیف، برچسب‌های
    source، و رندر help است.

    این یک ارائه‌دهنده کارآمد است. کاربران اکنون می‌توانند
    `openclaw onboard --acme-ai-api-key <key>` را اجرا کنند و
    `acme-ai/acme-large` را به‌عنوان مدل خود انتخاب کنند.

    ### کشف زنده مدل

    اگر ارائه‌دهنده شما یک API به سبک `/models` ارائه می‌کند، endpoint مخصوص ارائه‌دهنده
    و projection ردیف را در Plugin خود نگه دارید و از
    `openclaw/plugin-sdk/provider-catalog-live-runtime` برای چرخه عمر fetch مشترک
    استفاده کنید. این helper به شما fetchهای HTTP محافظت‌شده، headerهای provider-auth،
    خطاهای HTTP ساختاریافته، caching با TTL، و رفتار fallback ایستا می‌دهد، بدون آنکه
    policy ارائه‌دهنده را در core OpenClaw قرار دهد.

    زمانی از `buildLiveModelProviderConfig` استفاده کنید که API زنده فقط به شما می‌گوید کدام
    ردیف‌های کاتالوگ ایستای متعلق به ارائه‌دهنده در حال حاضر در دسترس هستند:

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

    زمانی از `getCachedLiveProviderModelRows` استفاده کنید که API ارائه‌دهنده metadata
    غنی‌تری برمی‌گرداند و Plugin باید خودش ردیف‌ها را به تعریف‌های مدل OpenClaw
    project کند:

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

    `run` باید auth-gated بماند و وقتی credential قابل استفاده‌ای
    در دسترس نیست `null` برگرداند. یک `staticRun` آفلاین یا fallback ایستا نگه دارید تا سطوح setup، docs،
    tests، و picker به دسترسی شبکه زنده وابسته نباشند. از TTL
    مناسب برای تازگی فهرست مدل استفاده کنید، از polling فایل‌سیستم در زمان درخواست پرهیز کنید،
    و فقط زمانی `readRows` / `readModelId` مخصوص ارائه‌دهنده را پاس دهید که
    پاسخ upstream شکل سازگار با OpenAI یعنی `{ data: [{ id, object }] }`
    نداشته باشد.

    اگر ارائه‌دهنده upstream از tokenهای کنترلی متفاوتی نسبت به OpenClaw استفاده می‌کند، به‌جای
    جایگزین کردن مسیر stream، یک transform کوچک دوطرفه متن اضافه کنید:

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
    `output` پیش از آنکه OpenClaw markerهای کنترلی خودش را parse کند یا تحویل channel را انجام دهد،
    deltaهای متن assistant و متن نهایی را بازنویسی می‌کند.

    برای ارائه‌دهندگان bundled که فقط یک ارائه‌دهنده متن با احراز هویت API-key
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
    ارائه‌دهنده را resolve کند استفاده می‌شود. ممکن است discovery اختصاصی ارائه‌دهنده را انجام دهد. از
    `buildStaticProvider` فقط برای ردیف‌های آفلاینی استفاده کنید که نمایش آن‌ها پیش از پیکربندی احراز هویت
    امن است؛ این مسیر نباید به credentials نیاز داشته باشد یا درخواست شبکه‌ای انجام دهد.
    نمایش فعلی `models list --all` در OpenClaw کاتالوگ‌های static را
    فقط برای provider plugins همراه‌شده، با config خالی، env خالی، و بدون
    مسیرهای agent/workspace اجرا می‌کند.

    اگر جریان احراز هویت شما همچنین لازم دارد `models.providers.*`، aliasها، و
    مدل پیش‌فرض agent را هنگام onboarding وصله کند، از preset helperهای
    `openclaw/plugin-sdk/provider-onboard` استفاده کنید. محدودترین helperها عبارت‌اند از
    `createDefaultModelPresetAppliers(...)`،
    `createDefaultModelsPresetAppliers(...)`، و
    `createModelCatalogPresetAppliers(...)`.

    وقتی endpoint بومی یک ارائه‌دهنده از usage blockهای streamed روی
    انتقال عادی `openai-completions` پشتیبانی می‌کند، به‌جای hardcode کردن
    بررسی‌های provider-id، helperهای کاتالوگ مشترک در
    `openclaw/plugin-sdk/provider-catalog-shared` را ترجیح دهید. `supportsNativeStreamingUsageCompat(...)` و
    `applyProviderNativeStreamingUsageCompat(...)` پشتیبانی را از
    capability map مربوط به endpoint تشخیص می‌دهند، بنابراین endpointهای بومی به سبک Moonshot/DashScope همچنان
    opt in می‌شوند حتی وقتی یک Plugin از provider id سفارشی استفاده می‌کند.

    مثال‌های discovery زنده در بالا APIهای ارائه‌دهنده به سبک `/models` را پوشش می‌دهند. این
    discovery را داخل `catalog.run` نگه دارید، آن را به احراز هویت قابل‌استفاده محدود کنید، و
    `staticRun` را برای تولید کاتالوگ آفلاین بدون شبکه نگه دارید.

  </Step>

  <Step title="افزودن resolve پویای مدل">
    اگر ارائه‌دهنده شما IDهای دلخواه مدل را می‌پذیرد (مانند proxy یا router)،
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

    اگر resolve کردن به فراخوانی شبکه‌ای نیاز دارد، از `prepareDynamicModel` برای warm-up ناهمگام
    استفاده کنید - `resolveDynamicModel` پس از کامل شدن آن دوباره اجرا می‌شود.

  </Step>

  <Step title="افزودن hookهای runtime (در صورت نیاز)">
    بیشتر ارائه‌دهنده‌ها فقط به `catalog` + `resolveDynamicModel` نیاز دارند. hookها را
    به‌تدریج و بر اساس نیاز ارائه‌دهنده خود اضافه کنید.

    helper builderهای مشترک اکنون رایج‌ترین خانواده‌های replay/tool-compat را پوشش می‌دهند،
    بنابراین Pluginها معمولا نیازی ندارند هر hook را یکی‌یکی دستی سیم‌کشی کنند:

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

    | خانواده | آنچه سیم‌کشی می‌کند | مثال‌های همراه‌شده |
    | --- | --- | --- |
    | `openai-compatible` | سیاست replay مشترک به سبک OpenAI برای انتقال‌های سازگار با OpenAI، شامل پاک‌سازی tool-call-id، اصلاح ترتیب assistant-first، و اعتبارسنجی generic Gemini-turn در جایی که انتقال به آن نیاز دارد | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | سیاست replay آگاه از Claude که با `modelId` انتخاب می‌شود، تا انتقال‌های Anthropic-message فقط زمانی cleanup اختصاصی thinking-block مربوط به Claude را دریافت کنند که مدل resolve‌شده واقعا یک Claude id باشد | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | سیاست replay بومی Gemini به‌همراه پاک‌سازی bootstrap replay. خانواده مشترک، خروجی متنی Gemini CLI را روی reasoning برچسب‌خورده نگه می‌دارد؛ ارائه‌دهنده مستقیم `google` مقدار `resolveReasoningOutputMode` را به `native` override می‌کند، چون thinking در Gemini API به‌صورت thought partهای بومی می‌آید. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | پاک‌سازی thought-signature مربوط به Gemini برای مدل‌های Gemini که از طریق انتقال‌های proxy سازگار با OpenAI اجرا می‌شوند؛ اعتبارسنجی replay بومی Gemini یا بازنویسی‌های bootstrap را فعال نمی‌کند | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | سیاست ترکیبی برای ارائه‌دهنده‌هایی که سطوح مدل Anthropic-message و سازگار با OpenAI را در یک Plugin ترکیب می‌کنند؛ حذف اختیاری thinking-block فقط برای Claude محدود به سمت Anthropic می‌ماند | `minimax` |

    خانواده‌های stream موجود امروز:

    | خانواده | آنچه سیم‌کشی می‌کند | مثال‌های همراه‌شده |
    | --- | --- | --- |
    | `google-thinking` | نرمال‌سازی payload مربوط به thinking در Gemini روی مسیر stream مشترک | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | wrapper reasoning مربوط به Kilo روی مسیر stream proxy مشترک، با `kilo/auto` و idهای reasoning پشتیبانی‌نشده proxy که از thinking تزریق‌شده عبور می‌کنند | `kilocode` |
    | `moonshot-thinking` | نگاشت payload باینری native-thinking در Moonshot از config + سطح `/think` | `moonshot` |
    | `minimax-fast-mode` | بازنویسی مدل fast-mode در MiniMax روی مسیر stream مشترک | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | wrapperهای مشترک Responses بومی OpenAI/Codex: headerهای attribution، `/fast`/`serviceTier`، verbosity متن، جست‌وجوی وب بومی Codex، شکل‌دهی payload سازگار با reasoning، و مدیریت context در Responses | `openai` |
    | `openrouter-thinking` | wrapper reasoning مربوط به OpenRouter برای routeهای proxy، با عبور از unsupported-model/`auto` به‌صورت متمرکز | `openrouter` |
    | `tool-stream-default-on` | wrapper پیش‌فرض‌روشن `tool_stream` برای ارائه‌دهنده‌هایی مانند Z.AI که tool streaming را مگر در صورت غیرفعال‌سازی صریح می‌خواهند | `zai` |

    <Accordion title="درزهای SDK که family builderها را پشتیبانی می‌کنند">
      هر family builder از helperهای عمومی سطح پایین‌تر تشکیل شده که از همان package صادر می‌شوند، و وقتی یک ارائه‌دهنده لازم دارد از الگوی رایج خارج شود می‌توانید از آن‌ها استفاده کنید:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)`، و replay builderهای خام (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). همچنین helperهای replay مربوط به Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) و helperهای endpoint/model (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`) را صادر می‌کند.
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`، به‌علاوه wrapperهای مشترک OpenAI/Codex (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`)، wrapper سازگار با OpenAI مربوط به DeepSeek V4 (`createDeepSeekV4OpenAICompatibleThinkingWrapper`)، cleanup پیش‌پرکردن thinking در Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`)، سازگاری tool-call متن ساده (`createPlainTextToolCallCompatWrapper`)، و wrapperهای مشترک proxy/provider (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` - wrapperهای سبک payload و event برای مسیرهای داغ ارائه‌دهنده، شامل `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)`، و `setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")`، و helperهای زیرین schema ارائه‌دهنده.

      برای ارائه‌دهنده‌های خانواده Gemini، حالت خروجی reasoning را با
      transport هم‌راستا نگه دارید. ارائه‌دهنده‌های مستقیم Google Gemini API باید از خروجی reasoning
      `native` استفاده کنند تا OpenClaw بدون افزودن directiveهای prompt
      `<think>` / `<final>`، thought partهای بومی را مصرف کند. backendهای به سبک Gemini CLI فقط‌متنی
      که پاسخ نهایی JSON/text را parse می‌کنند، می‌توانند قرارداد برچسب‌خورده مشترک
      `google-gemini` را نگه دارند.

      برخی helperهای stream عمدا provider-local می‌مانند. `@openclaw/anthropic-provider`، `wrapAnthropicProviderStream`، `resolveAnthropicBetas`، `resolveAnthropicFastMode`، `resolveAnthropicServiceTier`، و builderهای wrapper سطح پایین‌تر Anthropic را در درز عمومی `api.ts` / `contract-api.ts` خودش نگه می‌دارد، چون handling بتای OAuth مربوط به Claude و gating مربوط به `context1m` را کدگذاری می‌کنند. Plugin مربوط به xAI نیز به‌طور مشابه شکل‌دهی Responses بومی xAI را در `wrapStreamFn` خودش نگه می‌دارد (aliasهای `/fast`، مقدار پیش‌فرض `tool_stream`، cleanup مربوط به strict-tool پشتیبانی‌نشده، حذف payload reasoning اختصاصی xAI).

      همین الگوی package-root همچنین پشتوانه `@openclaw/openai-provider` (builderهای provider، helperهای default-model، builderهای realtime provider) و `@openclaw/openrouter-provider` (builder ارائه‌دهنده به‌علاوه helperهای onboarding/config) است.
    </Accordion>

    <Tabs>
      <Tab title="تبادل token">
        برای ارائه‌دهنده‌هایی که پیش از هر فراخوانی inference به token exchange نیاز دارند:

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
        برای ارائه‌دهنده‌هایی که به headerهای سفارشی request یا تغییرات body نیاز دارند:

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
        برای ارائه‌دهنده‌هایی که روی transportهای generic HTTP یا WebSocket به headerهای request/session یا metadata بومی نیاز دارند:

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

        `resolveUsageAuth` سه نتیجه دارد. وقتی ارائه‌دهنده اعتبارنامه مصرف/صورت‌حساب دارد،
        `{ token, accountId? }` را برگردانید. فقط زمانی
        `{ handled: true }` را برگردانید که ارائه‌دهنده احراز هویت مصرف را به‌طور قطعی
        مدیریت کرده اما توکن مصرف قابل استفاده ندارد، و OpenClaw باید fallback عمومی
        کلید API/OAuth را رد کند. وقتی ارائه‌دهنده درخواست را مدیریت نکرده
        و OpenClaw باید با fallback عمومی ادامه دهد، `null` یا `undefined` را برگردانید.
      </Tab>
    </Tabs>

    <Accordion title="All available provider hooks">
      OpenClaw hookها را به این ترتیب فراخوانی می‌کند. بیشتر ارائه‌دهندگان فقط از ۲ تا ۳ مورد استفاده می‌کنند:
      فیلدهای ارائه‌دهنده که فقط برای سازگاری هستند و OpenClaw دیگر آن‌ها را فراخوانی نمی‌کند، مانند
      `ProviderPlugin.capabilities` و `suppressBuiltInModel`، اینجا فهرست نشده‌اند.

      | # | Hook | زمان استفاده |
      | --- | --- | --- |
      | 1 | `catalog` | کاتالوگ مدل یا پیش‌فرض‌های URL پایه |
      | 2 | `applyConfigDefaults` | پیش‌فرض‌های سراسری متعلق به ارائه‌دهنده هنگام مادی‌سازی پیکربندی |
      | 3 | `normalizeModelId` | پاک‌سازی نام مستعار شناسه مدل legacy/preview پیش از lookup |
      | 4 | `normalizeTransport` | پاک‌سازی `api` / `baseUrl` خانواده ارائه‌دهنده پیش از مونتاژ عمومی مدل |
      | 5 | `normalizeConfig` | نرمال‌سازی پیکربندی `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | بازنویسی‌های سازگاری مصرف streaming بومی برای ارائه‌دهندگان پیکربندی |
      | 7 | `resolveConfigApiKey` | حل احراز هویت نشانگر env متعلق به ارائه‌دهنده |
      | 8 | `resolveSyntheticAuth` | احراز هویت synthetic محلی/خودمیزبان یا متکی به پیکربندی |
      | 9 | `shouldDeferSyntheticProfileAuth` | پایین آوردن جای‌نگهدارهای پروفایل ذخیره‌شده synthetic پشت احراز هویت env/config |
      | 10 | `resolveDynamicModel` | پذیرش شناسه‌های دلخواه مدل upstream |
      | 11 | `prepareDynamicModel` | دریافت ناهمگام metadata پیش از حل |
      | 12 | `normalizeResolvedModel` | بازنویسی‌های transport پیش از runner |
      | 13 | `normalizeToolSchemas` | پاک‌سازی schema ابزار متعلق به ارائه‌دهنده پیش از ثبت |
      | 14 | `inspectToolSchemas` | عیب‌یابی schema ابزار متعلق به ارائه‌دهنده |
      | 15 | `resolveReasoningOutputMode` | قرارداد خروجی reasoning برچسب‌دار در برابر بومی |
      | 16 | `prepareExtraParams` | پارامترهای پیش‌فرض درخواست |
      | 17 | `createStreamFn` | transport کاملاً سفارشی StreamFn |
      | 19 | `wrapStreamFn` | پوشش‌های سفارشی header/body روی مسیر معمول stream |
      | 20 | `resolveTransportTurnState` | headerها/metadata بومی برای هر turn |
      | 21 | `resolveWebSocketSessionPolicy` | headerهای نشست WS بومی/دوره آرام‌سازی |
      | 22 | `formatApiKey` | شکل توکن runtime سفارشی |
      | 23 | `refreshOAuth` | refresh سفارشی OAuth |
      | 24 | `buildAuthDoctorHint` | راهنمای ترمیم احراز هویت |
      | 25 | `matchesContextOverflowError` | تشخیص overflow متعلق به ارائه‌دهنده |
      | 26 | `classifyFailoverReason` | طبقه‌بندی rate-limit/overload متعلق به ارائه‌دهنده |
      | 27 | `isCacheTtlEligible` | دروازه‌گذاری TTL کش prompt |
      | 28 | `buildMissingAuthMessage` | راهنمای سفارشی نبود احراز هویت |
      | 29 | `augmentModelCatalog` | ردیف‌های synthetic برای سازگاری رو به جلو |
      | 30 | `resolveThinkingProfile` | مجموعه گزینه `/think` ویژه مدل |
      | 31 | `isBinaryThinking` | سازگاری روشن/خاموش thinking دودویی |
      | 32 | `supportsXHighThinking` | سازگاری پشتیبانی reasoning با `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | سازگاری سیاست پیش‌فرض `/think` |
      | 34 | `isModernModelRef` | تطبیق مدل live/smoke |
      | 35 | `prepareRuntimeAuth` | تبادل توکن پیش از inference |
      | 36 | `resolveUsageAuth` | parsing سفارشی اعتبارنامه مصرف |
      | 37 | `fetchUsageSnapshot` | endpoint سفارشی مصرف |
      | 38 | `createEmbeddingProvider` | adapter embedding متعلق به ارائه‌دهنده برای حافظه/جست‌وجو |
      | 39 | `buildReplayPolicy` | سیاست سفارشی replay/compaction رونوشت |
      | 40 | `sanitizeReplayHistory` | بازنویسی‌های replay ویژه ارائه‌دهنده پس از پاک‌سازی عمومی |
      | 41 | `validateReplayTurns` | اعتبارسنجی سخت‌گیرانه turnهای replay پیش از runner تعبیه‌شده |
      | 42 | `onModelSelected` | callback پس از انتخاب (مثلاً telemetry) |

      نکات fallback runtime:

      - `normalizeConfig` ابتدا ارائه‌دهنده منطبق را بررسی می‌کند، سپس سایر Pluginهای ارائه‌دهنده دارای hook را تا زمانی که یکی واقعاً پیکربندی را تغییر دهد. اگر هیچ hook ارائه‌دهنده‌ای یک ورودی پیکربندی پشتیبانی‌شده خانواده Google را بازنویسی نکند، نرمال‌ساز پیکربندی Google که همراه بسته است همچنان اعمال می‌شود.
      - `resolveConfigApiKey` وقتی hook ارائه‌دهنده ارائه شده باشد از آن استفاده می‌کند. Amazon Bedrock حل نشانگر env مربوط به AWS را در Plugin ارائه‌دهنده خودش نگه می‌دارد؛ خود احراز هویت runtime همچنان وقتی با `auth: "aws-sdk"` پیکربندی شده باشد از زنجیره پیش‌فرض AWS SDK استفاده می‌کند.
      - `resolveThinkingProfile(ctx)`، `provider` انتخاب‌شده، `modelId`، راهنمای کاتالوگ `reasoning` ادغام‌شده اختیاری، و facts ادغام‌شده اختیاری `compat` مدل را دریافت می‌کند. فقط برای انتخاب UI/profile thinking ارائه‌دهنده از `compat` استفاده کنید.
      - `resolveSystemPromptContribution` به ارائه‌دهنده اجازه می‌دهد راهنمای system-prompt آگاه از کش را برای یک خانواده مدل تزریق کند. وقتی رفتار به یک ارائه‌دهنده/خانواده مدل تعلق دارد و باید جداسازی کش پایدار/پویا را حفظ کند، آن را به `before_prompt_build` ترجیح دهید.

      برای توضیحات دقیق و مثال‌های دنیای واقعی، [Internals: Provider Runtime Hooks](/fa/plugins/architecture-internals#provider-runtime-hooks) را ببینید.
    </Accordion>

  </Step>

  <Step title="Add extra capabilities (optional)">
    ### گام ۵: افزودن قابلیت‌های بیشتر

    یک Plugin ارائه‌دهنده می‌تواند embeddingها، گفتار، رونویسی بلادرنگ،
    صدای بلادرنگ، درک رسانه، تولید تصویر، تولید ویدئو،
    واکشی وب و جست‌وجوی وب را در کنار inference متنی ثبت کند. OpenClaw این را به‌عنوان
    Plugin با **hybrid-capability** طبقه‌بندی می‌کند؛ الگوی پیشنهادی برای Pluginهای شرکتی
    (یک Plugin برای هر فروشنده). ببینید:
    [Internals: Capability Ownership](/fa/plugins/architecture#capability-ownership-model).

    هر قابلیت را داخل `register(api)` در کنار فراخوانی موجود
    `api.registerProvider(...)` ثبت کنید. فقط tabهایی را انتخاب کنید که نیاز دارید:

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

        برای شکست‌های HTTP ارائه‌دهنده از `assertOkOrThrowProviderError(...)` استفاده کنید تا
        Pluginها خواندن محدودشده بدنه خطا، parsing خطای JSON، و
        پسوندهای request-id مشترک داشته باشند.
      </Tab>
      <Tab title="Realtime transcription">
        `createRealtimeTranscriptionWebSocketSession(...)` را ترجیح دهید؛ helper مشترک
        capture پروکسی، backoff اتصال مجدد، flushing هنگام close، handshakeهای ready،
        صف‌گذاری صوت، و عیب‌یابی رخداد close را مدیریت می‌کند. Plugin شما
        فقط رخدادهای upstream را map می‌کند.

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

        ارائه‌دهندگان STT دسته‌ای که صوت multipart را POST می‌کنند باید از
        `buildAudioTranscriptionFormData(...)` از
        `openclaw/plugin-sdk/provider-http` استفاده کنند. این helper نام فایل‌های upload را
        نرمال می‌کند، از جمله uploadهای AAC که برای APIهای رونویسی سازگار
        به نام فایل به سبک M4A نیاز دارند.
      </Tab>
      <Tab title="Realtime voice">
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

        Declare `capabilities` تا `talk.catalog` بتواند حالت‌های معتبر،
        ترابری‌ها، قالب‌های صوتی، و پرچم‌های ویژگی را برای کلاینت‌های Talk
        مرورگر و بومی ارائه کند. وقتی یک ترابری می‌تواند تشخیص دهد که یک
        انسان در حال قطع کردن پخش دستیار است و ارائه‌دهنده از کوتاه‌کردن یا
        پاک‌کردن پاسخ صوتی فعال پشتیبانی می‌کند، `handleBargeIn` را پیاده‌سازی کنید.
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

        ارائه‌دهندگان رسانه محلی یا خودمیزبان که عمداً به اعتبارنامه نیاز
        ندارند، می‌توانند `resolveAuth` را ارائه کنند و `kind: "none"` برگردانند.
        OpenClaw همچنان دروازه احراز هویت معمول را برای ارائه‌دهندگانی که
        صراحتاً اعلام آمادگی نمی‌کنند حفظ می‌کند. ارائه‌دهندگان موجود می‌توانند
        همچنان `req.apiKey` را بخوانند؛ ارائه‌دهندگان جدید بهتر است از `req.auth`
        استفاده کنند.

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
      <Tab title="Embeddings">
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

        همان شناسه را در `contracts.embeddingProviders` اعلام کنید. این قرارداد
        عمومی embedding برای تولید بردار قابل استفاده مجدد، از جمله جست‌وجوی
        حافظه است. `registerMemoryEmbeddingProvider(...)` سازگاری منسوخ‌شده
        برای آداپتورهای موجودِ ویژه حافظه است.
      </Tab>
      <Tab title="Image and video generation">
        قابلیت‌های ویدئو از شکلی **آگاه به حالت** استفاده می‌کنند: `generate`،
        `imageToVideo`، و `videoToVideo`. فیلدهای تجمیعی تخت مانند
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` برای اعلام
        پشتیبانی از حالت تبدیل یا حالت‌های غیرفعال به‌صورت تمیز کافی نیستند.
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
          defaultTimeoutMs: 600_000,
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
    ### مرحله ۶: آزمایش

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

Pluginهای ارائه‌دهنده به همان روش هر Plugin کد خارجی دیگری منتشر می‌شوند:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

اینجا از نام مستعار انتشار قدیمیِ فقط مخصوص skill استفاده نکنید؛ بسته‌های Plugin باید از
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

`catalog.order` کنترل می‌کند کاتالوگ شما چه زمانی نسبت به ارائه‌دهندگان داخلی
ادغام شود:

| ترتیب     | زمان          | مورد استفاده                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | گذر نخست    | ارائه‌دهندگان ساده مبتنی بر کلید API                         |
| `profile` | پس از simple  | ارائه‌دهندگانی که به پروفایل‌های احراز هویت وابسته‌اند                |
| `paired`  | پس از profile | ساخت چند ورودی مرتبط             |
| `late`    | آخرین گذر     | بازنویسی ارائه‌دهندگان موجود (در برخوردها برنده می‌شود) |

## گام‌های بعدی

- [Pluginهای کانال](/fa/plugins/sdk-channel-plugins) - اگر Plugin شما یک کانال هم ارائه می‌کند
- [زمان اجرای SDK](/fa/plugins/sdk-runtime) - کمک‌کننده‌های `api.runtime` (TTS، جست‌وجو، زیرعامل)
- [نمای کلی SDK](/fa/plugins/sdk-overview) - مرجع کامل import زیربخش‌ها
- [جزئیات داخلی Plugin](/fa/plugins/architecture-internals#provider-runtime-hooks) - جزئیات hook و نمونه‌های همراه

## مرتبط

- [راه‌اندازی Plugin SDK](/fa/plugins/sdk-setup)
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [ساخت Pluginهای کانال](/fa/plugins/sdk-channel-plugins)
