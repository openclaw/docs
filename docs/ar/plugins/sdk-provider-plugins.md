---
read_when:
    - أنت تنشئ Plugin جديدًا لمزوّد نماذج
    - تريد إضافة وكيل متوافق مع OpenAI أو LLM مخصص إلى OpenClaw
    - تحتاج إلى فهم مصادقة المزوّد، والكتالوجات، وخطافات وقت التشغيل
sidebarTitle: Provider plugins
summary: دليل خطوة بخطوة لبناء Plugin لمزوّد نموذج في OpenClaw
title: بناء Plugins للمزوّدات
x-i18n:
    generated_at: "2026-04-25T18:21:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: c31f73619aa8fecf1b409bbd079683fae9ba996dd6ce22bd894b47cc76d5e856
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

يرشدك هذا الدليل خلال بناء Plugin لمزوّد يضيف مزوّد نموذج
(LLM) إلى OpenClaw. وبحلول النهاية سيكون لديك مزوّد مع كتالوج نماذج،
ومصادقة بمفتاح API، وحل ديناميكي للنماذج.

<Info>
  إذا لم تكن قد أنشأت أي Plugin لـ OpenClaw من قبل، فاقرأ
  [البدء](/ar/plugins/building-plugins) أولًا للتعرّف إلى بنية
  الحزمة الأساسية وإعداد manifest.
</Info>

<Tip>
  تضيف Plugins الخاصة بالمزوّدات نماذج إلى حلقة الاستدلال العادية في OpenClaw. إذا كان النموذج
  يجب أن يعمل عبر daemon وكيل أصلي يملك السلاسل، وCompaction، أو أحداث
  الأدوات، فاقرن المزوّد مع [agent harness](/ar/plugins/sdk-agent-harness)
  بدلًا من وضع تفاصيل بروتوكول daemon في النواة.
</Tip>

## الشرح التفصيلي

<Steps>
  <Step title="الحزمة وmanifest">
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
      "description": "مزود نماذج Acme AI",
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
          "choiceLabel": "مفتاح API لـ Acme AI",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "مفتاح API لـ Acme AI"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    يعلن manifest عن `providerAuthEnvVars` حتى يتمكن OpenClaw من اكتشاف
    بيانات الاعتماد من دون تحميل وقت تشغيل Plugin لديك. أضف `providerAuthAliases`
    عندما يجب أن يعيد أحد متغيرات المزوّد استخدام مصادقة معرّف مزوّد آخر. ويُعد `modelSupport`
    اختياريًا ويسمح لـ OpenClaw بتحميل Plugin المزوّد تلقائيًا من
    معرّفات نماذج مختصرة مثل `acme-large` قبل وجود خطافات وقت التشغيل. وإذا نشرت
    المزوّد على ClawHub، فإن حقول `openclaw.compat` و`openclaw.build`
    هذه تكون مطلوبة في `package.json`.

  </Step>

  <Step title="سجّل المزوّد">
    يحتاج المزوّد الأدنى إلى `id` و`label` و`auth` و`catalog`:

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

    هذا مزوّد يعمل بالفعل. يمكن للمستخدمين الآن تنفيذ
    `openclaw onboard --acme-ai-api-key <key>` واختيار
    `acme-ai/acme-large` كنموذج لهم.

    إذا كان المزوّد upstream يستخدم رموز تحكم مختلفة عن OpenClaw، فأضف
    تحويلًا نصيًا صغيرًا ثنائي الاتجاه بدلًا من استبدال مسار البث:

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

    تعيد `input` كتابة مطالبة النظام النهائية ومحتوى الرسالة النصية قبل
    النقل. وتعيد `output` كتابة دلتا نص المساعد والنص النهائي قبل أن
    يحلل OpenClaw علامات التحكم الخاصة به أو قبل تسليم القناة.

    بالنسبة إلى المزوّدات المضمنة التي لا تسجّل إلا مزوّد نص واحدًا مع
    مصادقة بمفتاح API بالإضافة إلى وقت تشغيل واحد مدعوم بكتالوج، فافضّل
    المساعد الأضيق `defineSingleProviderPluginEntry(...)`:

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

    يُعد `buildProvider` مسار الكتالوج الحي المستخدم عندما يتمكن OpenClaw من حل
    مصادقة مزوّد حقيقية. وقد ينفذ اكتشافًا خاصًا بالمزوّد. واستخدم
    `buildStaticProvider` فقط للصفوف غير المتصلة بالشبكة التي يمكن عرضها بأمان قبل إعداد
    المصادقة؛ ويجب ألا يتطلب بيانات اعتماد أو ينفذ طلبات شبكة.
    ينفذ عرض `models list --all` في OpenClaw حاليًا الكتالوجات الثابتة
    لمكونات المزوّد المضمنة فقط، مع إعداد فارغ، وبيئة فارغة، ومن دون
    مسارات وكيل/مساحة عمل.

    إذا كان تدفق المصادقة لديك يحتاج أيضًا إلى تصحيح `models.providers.*`،
    والأسماء المستعارة، والنموذج الافتراضي للوكيل أثناء الإعداد الأولي، فاستخدم
    المساعدات الجاهزة من
    `openclaw/plugin-sdk/provider-onboard`. وأضيق المساعدات هي
    `createDefaultModelPresetAppliers(...)`،
    و`createDefaultModelsPresetAppliers(...)`، و
    `createModelCatalogPresetAppliers(...)`.

    عندما تدعم نقطة النهاية الأصلية لمزوّد ما كتل استخدام متدفقة على
    نقل `openai-completions` العادي، فافضّل المساعدات المشتركة للكتالوج في
    `openclaw/plugin-sdk/provider-catalog-shared` بدلًا من تضمين فحوصات معرّف
    المزوّد مباشرة. يكتشف
    `supportsNativeStreamingUsageCompat(...)` و
    `applyProviderNativeStreamingUsageCompat(...)` الدعم من خريطة إمكانات نقطة النهاية،
    بحيث تبقى نقاط النهاية الأصلية بنمط Moonshot/DashScope مشتركة
    حتى عندما يستخدم Plugin معرّف مزوّد مخصصًا.

  </Step>

  <Step title="أضف حلًا ديناميكيًا للنموذج">
    إذا كان مزوّدك يقبل معرّفات نماذج عشوائية (مثل وكيل أو موجّه)،
    فأضف `resolveDynamicModel`:

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

    إذا كان الحل يتطلب استدعاء شبكة، فاستخدم `prepareDynamicModel` للإحماء
    غير المتزامن — إذ يُشغَّل `resolveDynamicModel` مرة أخرى بعد اكتماله.

  </Step>

  <Step title="أضف خطافات وقت التشغيل (عند الحاجة)">
    لا تحتاج معظم المزوّدات إلا إلى `catalog` + `resolveDynamicModel`. أضف
    الخطافات تدريجيًا حسب متطلبات مزوّدك.

    تغطي بانيات المساعدات المشتركة الآن أكثر عائلات إعادة التشغيل/توافق الأدوات
    شيوعًا، لذلك لا تحتاج Plugins عادةً إلى توصيل كل خطاف يدويًا واحدًا واحدًا:

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

    عائلات إعادة التشغيل المتاحة حاليًا:

    | العائلة | ما الذي توصله | أمثلة مضمنة |
    | --- | --- | --- |
    | `openai-compatible` | سياسة إعادة تشغيل مشتركة بنمط OpenAI لعمليات النقل المتوافقة مع OpenAI، بما في ذلك تنقية معرّف استدعاء الأداة، وإصلاحات ترتيب المساعد أولًا، والتحقق العام من دور Gemini عندما يحتاج النقل إلى ذلك | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | سياسة إعادة تشغيل واعية بـ Claude تُختار حسب `modelId`، بحيث تحصل عمليات نقل رسائل Anthropic فقط على تنظيف كتل التفكير الخاصة بـ Claude عندما يكون النموذج المحلول بالفعل معرّف Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | سياسة إعادة تشغيل Gemini الأصلية بالإضافة إلى تنقية إعادة تشغيل bootstrap ووضع مخرجات الاستدلال الموسوم | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | تنقية توقيع التفكير Gemini للنماذج التي تعمل عبر عمليات نقل وكيل متوافقة مع OpenAI؛ ولا يفعّل التحقق الأصلي من إعادة تشغيل Gemini أو إعادة كتابة bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | سياسة هجينة للمزوّدات التي تخلط بين أسطح نماذج رسائل Anthropic والأسطح المتوافقة مع OpenAI داخل Plugin واحد؛ ويظل إسقاط كتل التفكير الاختيارية الخاصة بـ Claude محصورًا ضمن جانب Anthropic | `minimax` |

    عائلات البث المتاحة حاليًا:

    | العائلة | ما الذي توصله | أمثلة مضمنة |
    | --- | --- | --- |
    | `google-thinking` | تطبيع حمولات التفكير الخاصة بـ Gemini على مسار البث المشترك | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | مغلّف الاستدلال الخاص بـ Kilo على مسار بث الوكيل المشترك، مع تجاوز `kilo/auto` ومعرّفات استدلال الوكيل غير المدعومة لحقن التفكير | `kilocode` |
    | `moonshot-thinking` | ربط حمولات التفكير الأصلية الثنائية الخاصة بـ Moonshot انطلاقًا من الإعدادات ومستوى `/think` | `moonshot` |
    | `minimax-fast-mode` | إعادة كتابة نموذج الوضع السريع الخاص بـ MiniMax على مسار البث المشترك | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | مغلفات Responses الأصلية المشتركة الخاصة بـ OpenAI/Codex: رؤوس الإسناد، و`/fast`/`serviceTier`، ودرجة إسهاب النص، وبحث الويب الأصلي لـ Codex، وتشكيل حمولة توافق الاستدلال، وإدارة سياق Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | مغلّف الاستدلال الخاص بـ OpenRouter لمسارات الوكيل، مع التعامل مركزيًا مع تجاوز النماذج غير المدعومة/`auto` | `openrouter` |
    | `tool-stream-default-on` | مغلّف `tool_stream` مفعّل افتراضيًا للمزوّدات مثل Z.AI التي تريد بث الأدوات ما لم يتم تعطيله صراحةً | `zai` |

    <Accordion title="واجهات SDK التي تشغّل بانيات العائلات">
      يتكوّن كل بانٍ للعائلات من مساعدات عامة منخفضة المستوى مُصدَّرة من الحزمة نفسها، ويمكنك اللجوء إليها عندما يحتاج المزوّد إلى الخروج عن النمط الشائع:

      - `openclaw/plugin-sdk/provider-model-shared` — ‏`ProviderReplayFamily` و`buildProviderReplayFamilyHooks(...)` وبانيات إعادة التشغيل الخام (`buildOpenAICompatibleReplayPolicy` و`buildAnthropicReplayPolicyForModel` و`buildGoogleGeminiReplayPolicy` و`buildHybridAnthropicOrOpenAIReplayPolicy`). كما يصدّر مساعدات إعادة تشغيل Gemini ‏(`sanitizeGoogleGeminiReplayHistory` و`resolveTaggedReasoningOutputMode`) ومساعدات نقطة النهاية/النموذج (`resolveProviderEndpoint` و`normalizeProviderId` و`normalizeGooglePreviewModelId` و`normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — ‏`ProviderStreamFamily` و`buildProviderStreamFamilyHooks(...)` و`composeProviderStreamWrappers(...)`، بالإضافة إلى مغلفات OpenAI/Codex المشتركة (`createOpenAIAttributionHeadersWrapper` و`createOpenAIFastModeWrapper` و`createOpenAIServiceTierWrapper` و`createOpenAIResponsesContextManagementWrapper` و`createCodexNativeWebSearchWrapper`) ومغلف DeepSeek V4 المتوافق مع OpenAI (`createDeepSeekV4OpenAICompatibleThinkingWrapper`) ومغلفات الوكيل/المزوّد المشتركة (`createOpenRouterWrapper` و`createToolStreamWrapper` و`createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — ‏`ProviderToolCompatFamily` و`buildProviderToolCompatFamilyHooks("gemini")`، والمساعدات الأساسية لمخططات Gemini (`normalizeGeminiToolSchemas` و`inspectGeminiToolSchemas`)، ومساعدات التوافق الخاصة بـ xAI ‏(`resolveXaiModelCompatPatch()` و`applyXaiModelCompat(model)`). يستخدم Plugin xAI المضمن `normalizeResolvedModel` + `contributeResolvedModelCompat` مع هذه المساعدات للحفاظ على قواعد xAI مملوكة للمزوّد.

      تبقى بعض مساعدات البث محلية للمزوّد عن قصد. يحتفظ `@openclaw/anthropic-provider` بالدوال `wrapAnthropicProviderStream` و`resolveAnthropicBetas` و`resolveAnthropicFastMode` و`resolveAnthropicServiceTier` وبانيات مغلفات Anthropic منخفضة المستوى ضمن واجهة `api.ts` / `contract-api.ts` العامة الخاصة به لأنها ترمز إلى معالجة Claude OAuth beta والتحكم في `context1m`. وبالمثل يحتفظ Plugin ‏xAI بتشكيل Responses الأصلية الخاصة بـ xAI داخل `wrapStreamFn` الخاص به (الأسماء المستعارة لـ `/fast`، والقيمة الافتراضية `tool_stream`، وتنظيف الأدوات الصارمة غير المدعومة، وإزالة حمولات الاستدلال الخاصة بـ xAI).

      كما يدعم نمط جذر الحزمة نفسه كلًا من `@openclaw/openai-provider` (بانيات المزوّد، ومساعدات النموذج الافتراضي، وبانيات المزوّدات الفورية) و`@openclaw/openrouter-provider` (بانٍ للمزوّد بالإضافة إلى مساعدات الإعداد الأولي/الإعدادات).
    </Accordion>

    <Tabs>
      <Tab title="تبادل الرموز">
        بالنسبة إلى المزوّدات التي تحتاج إلى تبادل رمز قبل كل استدعاء استدلال:

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
      <Tab title="رؤوس مخصصة">
        بالنسبة إلى المزوّدات التي تحتاج إلى رؤوس طلبات مخصصة أو تعديلات على الجسم:

        ```typescript
        // تعيد wrapStreamFn قيمة StreamFn مشتقة من ctx.streamFn
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
      <Tab title="هوية النقل الأصلية">
        بالنسبة إلى المزوّدات التي تحتاج إلى رؤوس/بيانات تعريف أصلية للطلبات أو الجلسات على
        وسائل نقل HTTP أو WebSocket العامة:

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
      <Tab title="الاستخدام والفوترة">
        بالنسبة إلى المزوّدات التي تكشف بيانات الاستخدام/الفوترة:

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

    <Accordion title="كل خطافات المزوّد المتاحة">
      يستدعي OpenClaw الخطافات بهذا الترتيب. لا تستخدم معظم المزوّدات سوى 2-3 منها:

      | # | الخطاف | متى تستخدمه |
      | --- | --- | --- |
      | 1 | `catalog` | كتالوج النماذج أو القيم الافتراضية لـ base URL |
      | 2 | `applyConfigDefaults` | القيم الافتراضية العامة التي يملكها المزوّد أثناء تشكيل الإعدادات |
      | 3 | `normalizeModelId` | تنظيف الأسماء المستعارة القديمة/التجريبية لمعرّفات النماذج قبل البحث |
      | 4 | `normalizeTransport` | تنظيف `api` / `baseUrl` لعائلة المزوّد قبل التجميع العام للنموذج |
      | 5 | `normalizeConfig` | تطبيع إعداد `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | إعادة كتابة توافق الاستخدام في البث الأصلي لمزوّدات الإعداد |
      | 7 | `resolveConfigApiKey` | حلّ المصادقة بعلامات البيئة التي يملكها المزوّد |
      | 8 | `resolveSyntheticAuth` | مصادقة اصطناعية محلية/مستضافة ذاتيًا أو مدعومة بالإعدادات |
      | 9 | `shouldDeferSyntheticProfileAuth` | تأخير العناصر النائبة الاصطناعية لملفات التعريف المخزنة بعد مصادقة البيئة/الإعدادات |
      | 10 | `resolveDynamicModel` | قبول معرّفات نماذج upstream عشوائية |
      | 11 | `prepareDynamicModel` | جلب البيانات الوصفية غير المتزامن قبل الحل |
      | 12 | `normalizeResolvedModel` | إعادة كتابة النقل قبل المشغّل |
      | 13 | `contributeResolvedModelCompat` | أعلام توافق لنماذج المورّد خلف نقل متوافق آخر |
      | 14 | `capabilities` | حزمة إمكانات ثابتة قديمة؛ للتوافق فقط |
      | 15 | `normalizeToolSchemas` | تنظيف مخططات الأدوات التي يملكها المزوّد قبل التسجيل |
      | 16 | `inspectToolSchemas` | تشخيصات مخططات الأدوات التي يملكها المزوّد |
      | 17 | `resolveReasoningOutputMode` | عقد مخرجات الاستدلال الموسوم مقابل الأصلي |
      | 18 | `prepareExtraParams` | معاملات الطلب الافتراضية |
      | 19 | `createStreamFn` | نقل StreamFn مخصص بالكامل |
      | 20 | `wrapStreamFn` | مغلفات رؤوس/أجسام مخصصة على مسار البث العادي |
      | 21 | `resolveTransportTurnState` | رؤوس/بيانات تعريف أصلية لكل دورة |
      | 22 | `resolveWebSocketSessionPolicy` | رؤوس الجلسات الأصلية في WS / فترة التهدئة |
      | 23 | `formatApiKey` | صيغة رمز وقت تشغيل مخصصة |
      | 24 | `refreshOAuth` | تحديث OAuth مخصص |
      | 25 | `buildAuthDoctorHint` | إرشادات إصلاح المصادقة |
      | 26 | `matchesContextOverflowError` | اكتشاف تجاوز السعة الذي يملكه المزوّد |
      | 27 | `classifyFailoverReason` | تصنيف معدّل الحد/التحميل الزائد الذي يملكه المزوّد |
      | 28 | `isCacheTtlEligible` | تقييد TTL لذاكرة التخزين المؤقت للمطالبة |
      | 29 | `buildMissingAuthMessage` | تلميح مخصص لحالة غياب المصادقة |
      | 30 | `suppressBuiltInModel` | إخفاء الصفوف القديمة من upstream |
      | 31 | `augmentModelCatalog` | صفوف اصطناعية للتوافق الأمامي |
      | 32 | `resolveThinkingProfile` | مجموعة خيارات `/think` الخاصة بالنموذج |
      | 33 | `isBinaryThinking` | توافق تشغيل/إيقاف التفكير الثنائي |
      | 34 | `supportsXHighThinking` | توافق دعم الاستدلال `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | توافق سياسة `/think` الافتراضية |
      | 36 | `isModernModelRef` | مطابقة النماذج الحية/الاختبارية |
      | 37 | `prepareRuntimeAuth` | تبادل الرموز قبل الاستدلال |
      | 38 | `resolveUsageAuth` | تحليل بيانات اعتماد الاستخدام المخصص |
      | 39 | `fetchUsageSnapshot` | نقطة نهاية استخدام مخصصة |
      | 40 | `createEmbeddingProvider` | محول embedding يملكه المزوّد للذاكرة/البحث |
      | 41 | `buildReplayPolicy` | سياسة مخصصة لإعادة تشغيل السجل/Compaction |
      | 42 | `sanitizeReplayHistory` | إعادة كتابة خاصة بالمزوّد لسجل إعادة التشغيل بعد التنظيف العام |
      | 43 | `validateReplayTurns` | تحقق صارم من دورات إعادة التشغيل قبل المشغّل المضمن |
      | 44 | `onModelSelected` | رد نداء بعد الاختيار (مثل القياسات) |

      ملاحظات الرجوع في وقت التشغيل:

      - يفحص `normalizeConfig` المزوّد المطابق أولًا، ثم Plugins المزوّدات الأخرى القادرة على استخدام الخطافات حتى يغيّر أحدها الإعداد فعلًا. وإذا لم تعِد أي خطافات مزوّد كتابة إدخال إعداد مدعوم لعائلة Google، فسيظل مطبّع إعدادات Google المضمن مطبقًا.
      - يستخدم `resolveConfigApiKey` خطاف المزوّد عندما يكون مكشوفًا. كما يحتوي المسار المضمن `amazon-bedrock` هنا على محلّل مدمج لعلامات بيئة AWS، رغم أن مصادقة وقت تشغيل Bedrock نفسها ما تزال تستخدم سلسلة AWS SDK الافتراضية.
      - يسمح `resolveSystemPromptContribution` لمزوّد بحقن إرشادات لمطالبة النظام تراعي الذاكرة المؤقتة لعائلة نموذجية. افضله على `before_prompt_build` عندما يكون السلوك تابعًا لعائلة مزوّد/نموذج واحدة ويجب أن يحافظ على فصل مستقر/ديناميكي للذاكرة المؤقتة.

      للحصول على أوصاف مفصلة وأمثلة من الواقع، راجع [الداخليات: خطافات وقت تشغيل المزوّد](/ar/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="أضف إمكانات إضافية (اختياري)">
    يمكن لـ Plugin المزوّد تسجيل إمكانات الكلام، والنسخ الفوري، والصوت الفوري،
    وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب،
    والبحث في الويب إلى جانب الاستدلال النصي. يصنّف OpenClaw هذا على أنه Plugin
    **hybrid-capability** — وهو النمط الموصى به لـ Plugins الشركات
    (Plugin واحد لكل مورّد). راجع
    [الداخليات: ملكية الإمكانات](/ar/plugins/architecture#capability-ownership-model).

    سجّل كل قدرة داخل `register(api)` إلى جانب استدعاء
    `api.registerProvider(...)` الحالي. اختر فقط علامات التبويب التي تحتاج إليها:

    <Tabs>
      <Tab title="الكلام (TTS)">
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
              await assertOkOrThrowProviderError(response, "خطأ في API الخاص بـ Acme Speech");
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

        استخدم `assertOkOrThrowProviderError(...)` لحالات فشل HTTP الخاصة بالمزوّد حتى
        تشترك Plugins في قراءات أجسام الأخطاء المحدودة، وتحليل أخطاء JSON،
        ولواحق معرّفات الطلب.
      </Tab>
      <Tab title="النسخ الفوري">
        افضّل `createRealtimeTranscriptionWebSocketSession(...)` — فالمساعد المشترك
        يتعامل مع التقاط الوكيل، وتراجع إعادة الاتصال، وتفريغ الإغلاق، ومصافحات الجاهزية،
        ووضع الصوت في الطابور، وتشخيصات أحداث الإغلاق. وكل ما على Plugin لديك
        هو ربط أحداث upstream.

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

        يجب على مزوّدات STT الدفعية التي ترسل صوت multipart عبر POST استخدام
        `buildAudioTranscriptionFormData(...)` من
        `openclaw/plugin-sdk/provider-http`. فهذا المساعد يطبّع أسماء ملفات
        الرفع، بما في ذلك عمليات رفع AAC التي تحتاج إلى اسم ملف بنمط M4A
        لواجهات نسخ متوافقة.
      </Tab>
      <Tab title="الصوت الفوري">
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
      <Tab title="فهم الوسائط">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "صورة لـ..." }),
          transcribeAudio: async (req) => ({ text: "النص المفرّغ..." }),
        });
        ```
      </Tab>
      <Tab title="توليد الصور والفيديو">
        تستخدم إمكانات الفيديو بنية **واعية بالوضع**: ‏`generate`،
        و`imageToVideo`، و`videoToVideo`. ولا تكفي الحقول المجمّعة المسطحة مثل
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds`
        للإعلان بوضوح عن دعم أوضاع التحويل أو الأوضاع المعطلة.
        ويتبع توليد الموسيقى النمط نفسه مع كتل `generate` /
        `edit` صريحة.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* نتيجة صورة */ }),
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
      <Tab title="جلب الويب والبحث">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "اجلب الصفحات عبر الواجهة الخلفية الخاصة بالتصيير في Acme.",
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
            description: "اجلب صفحة عبر Acme Fetch.",
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

  <Step title="الاختبار">
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // صدّر كائن إعداد المزوّد من index.ts أو من ملف مخصص
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

## النشر إلى ClawHub

تُنشر Plugins الخاصة بالمزوّدات بالطريقة نفسها مثل أي Plugin خارجي آخر للكود:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

لا تستخدم الاسم المستعار القديم الخاص بنشر Skills فقط هنا؛ يجب على حزم Plugin استخدام
`clawhub package publish`.

## بنية الملفات

```
<bundled-plugin-root>/acme-ai/
├── package.json              # بيانات openclaw.providers الوصفية
├── openclaw.plugin.json      # Manifest مع بيانات تعريف مصادقة المزوّد
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # الاختبارات
    └── usage.ts              # نقطة نهاية الاستخدام (اختياري)
```

## مرجع ترتيب الكتالوج

يتحكم `catalog.order` في وقت دمج الكتالوج الخاص بك مقارنةً
بالمزوّدات المضمنة:

| الترتيب     | متى          | حالة الاستخدام                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | التمرير الأول    | مزوّدات بسيطة بمفتاح API                         |
| `profile` | بعد simple  | مزوّدات مقيّدة بملفات تعريف المصادقة                |
| `paired`  | بعد profile | إنشاء عدة إدخالات مرتبطة                           |
| `late`    | التمرير الأخير     | تجاوز المزوّدات الموجودة (يفوز عند التصادم) |

## الخطوات التالية

- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — إذا كان Plugin لديك يوفّر قناة أيضًا
- [وقت تشغيل SDK](/ar/plugins/sdk-runtime) — مساعدات `api.runtime` ‏(TTS، والبحث، والوكيل الفرعي)
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع كامل للاستيراد من المسارات الفرعية
- [الداخليات الخاصة بـ Plugin](/ar/plugins/architecture-internals#provider-runtime-hooks) — تفاصيل الخطافات والأمثلة المضمنة

## ذو صلة

- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء Plugins](/ar/plugins/building-plugins)
- [بناء Plugins القنوات](/ar/plugins/sdk-channel-plugins)
