---
read_when:
    - أنت تبني Plugin جديدًا لمزوّد نماذج
    - تريد إضافة وكيل OpenAI-compatible أو LLM مخصص إلى OpenClaw
    - تحتاج إلى فهم مصادقة المزوّد، والفهارس، وخطافات Runtime
sidebarTitle: Provider plugins
summary: دليل خطوة بخطوة لبناء Plugin لمزوّد نماذج لـ OpenClaw
title: بناء Plugins لمزوّدات النماذج
x-i18n:
    generated_at: "2026-04-24T07:55:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: bef17d1e9944f041c29a578ceab20835d82c8e846a401048676211237fdbc499
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

يرشدك هذا الدليل خلال بناء Plugin مزوّد يضيف مزوّد نماذج
(LLM) إلى OpenClaw. وبنهاية الدليل ستكون قد أنشأت مزودًا يحتوي على فهرس نماذج،
ومصادقة بمفتاح API، وتحليلًا ديناميكيًا للنماذج.

<Info>
  إذا لم تكن قد أنشأت أي Plugin لـ OpenClaw من قبل، فاقرأ أولًا
  [البدء](/ar/plugins/building-plugins) لفهم بنية الحزمة الأساسية
  وإعداد البيان.
</Info>

<Tip>
  تضيف Plugins المزوّدين نماذج إلى حلقة الاستدلال العادية في OpenClaw. وإذا كان ينبغي أن يعمل النموذج
  عبر daemon وكيل أصلي يمتلك الخيوط أو Compaction أو أحداث
  الأدوات، فاربط المزوّد مع [agent harness](/ar/plugins/sdk-agent-harness)
  بدلًا من وضع تفاصيل بروتوكول daemon في core.
</Tip>

## الشرح العملي

<Steps>
  <Step title="الحزمة والبيان">
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

    يعلن البيان `providerAuthEnvVars` حتى يتمكن OpenClaw من اكتشاف
    بيانات الاعتماد من دون تحميل Runtime الخاص بالـ Plugin. وأضف `providerAuthAliases`
    عندما ينبغي أن يعيد متغير مزوّد ما استخدام مصادقة معرّف مزوّد آخر. كما أن `modelSupport`
    اختياري ويتيح لـ OpenClaw تحميل Plugin المزوّد تلقائيًا من
    معرّفات نماذج مختصرة مثل `acme-large` قبل وجود خطافات Runtime. وإذا نشرت
    المزوّد على ClawHub، فإن حقول `openclaw.compat` و`openclaw.build`
    تكون مطلوبة في `package.json`.

  </Step>

  <Step title="سجّل المزوّد">
    يحتاج الحد الأدنى من المزوّد إلى `id` و`label` و`auth` و`catalog`:

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

    هذا مزوّد يعمل فعلًا. ويمكن للمستخدمين الآن تشغيل
    `openclaw onboard --acme-ai-api-key <key>` ثم اختيار
    `acme-ai/acme-large` كنموذج لهم.

    إذا كان المزوّد الأصلي upstream يستخدم رموز تحكم مختلفة عن OpenClaw، فأضف
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

    يعيد `input` كتابة مطالبة النظام النهائية ومحتوى الرسائل النصية قبل
    النقل. ويعيد `output` كتابة دلتا نص المساعد والنص النهائي قبل
    أن يحلل OpenClaw علامات التحكم الخاصة به أو التسليم عبر القنوات.

    بالنسبة إلى المزوّدين المضمّنين الذين يسجلون مزودًا نصيًا واحدًا فقط مع مصادقة
    مفتاح API بالإضافة إلى Runtime واحد مدعوم بالفهرس، ففضّل المساعد الأضيق
    `defineSingleProviderPluginEntry(...)`:

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

    يمثل `buildProvider` مسار الفهرس الحي المستخدم عندما يكون OpenClaw قادرًا على تحليل
    مصادقة المزوّد الحقيقية. ويمكنه تنفيذ اكتشاف خاص بالمزوّد. واستخدم
    `buildStaticProvider` فقط للصفوف غير المتصلة الآمنة للعرض قبل تكوين المصادقة؛
    ويجب ألا يتطلب بيانات اعتماد أو يُجري طلبات شبكة.
    يعرض `models list --all` في OpenClaw الفهارس الثابتة حاليًا
    فقط بالنسبة إلى Plugins المزوّدين المضمّنة، وذلك مع تكوين فارغ، وenv فارغة، ومن دون
    مسارات وكيل/مساحة عمل.

    إذا كان تدفق المصادقة لديك يحتاج أيضًا إلى ترقيع `models.providers.*`،
    والأسماء المستعارة، والنموذج الافتراضي للوكيل أثناء الإعداد الأولي، فاستخدم المساعدات الجاهزة من
    `openclaw/plugin-sdk/provider-onboard`. وأضيق المساعدات هي
    `createDefaultModelPresetAppliers(...)`،
    و`createDefaultModelsPresetAppliers(...)`، و
    `createModelCatalogPresetAppliers(...)`.

    عندما تدعم نقطة النهاية الأصلية للمزوّد كتل الاستخدام المتدفقة على
    نقل `openai-completions` العادي، ففضّل المساعدات المشتركة للفهرس في
    `openclaw/plugin-sdk/provider-catalog-shared` بدلًا من ترميز فحوصات معرّف
    المزوّد بشكل صريح. تقوم `supportsNativeStreamingUsageCompat(...)` و
    `applyProviderNativeStreamingUsageCompat(...)` باكتشاف الدعم من خريطة
    إمكانات نقطة النهاية، بحيث تختار نقاط النهاية الأصلية بأسلوب Moonshot/DashScope
    الاشتراك حتى عندما يستخدم Plugin معرّف مزوّد مخصصًا.

  </Step>

  <Step title="أضف التحليل الديناميكي للنموذج">
    إذا كان مزوّدك يقبل معرّفات نماذج عشوائية (مثل وكيل أو موجه)،
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

    إذا كان التحليل يتطلب طلب شبكة، فاستخدم `prepareDynamicModel` للإحماء
    غير المتزامن — حيث يتم تشغيل `resolveDynamicModel` مرة أخرى بعد اكتماله.

  </Step>

  <Step title="أضف خطافات Runtime (عند الحاجة)">
    تحتاج معظم المزوّدات فقط إلى `catalog` + `resolveDynamicModel`. أضف الخطافات
    تدريجيًا بحسب احتياجات مزوّدك.

    تغطي بانيات المساعدة المشتركة الآن عائلات replay/tool-compat الأكثر شيوعًا،
    لذا لا تحتاج Plugins عادةً إلى توصيل كل خطاف يدويًا واحدًا تلو الآخر:

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

    عائلات replay المتاحة اليوم:

    | العائلة | ما الذي توصله | أمثلة مضمّنة |
    | --- | --- | --- |
    | `openai-compatible` | سياسة replay مشتركة بأسلوب OpenAI لعمليات النقل المتوافقة مع OpenAI، بما في ذلك تنقية tool-call-id، وإصلاح ترتيب المساعد أولًا، والتحقق العام من أدوار Gemini عندما يحتاج النقل إليه | `moonshot`، `ollama`، `xai`، `zai` |
    | `anthropic-by-model` | سياسة replay مدركة لـ Claude تُختار حسب `modelId`، بحيث لا تحصل عمليات النقل الخاصة برسائل Anthropic على تنظيف كتل التفكير الخاصة بـ Claude إلا عندما يكون النموذج المحلَّل فعلًا معرّف Claude | `amazon-bedrock`، `anthropic-vertex` |
    | `google-gemini` | سياسة replay أصلية لـ Gemini بالإضافة إلى تنقية replay في bootstrap ووضع خرج reasoning الموسوم | `google`، `google-gemini-cli` |
    | `passthrough-gemini` | تنقية تواقيع أفكار Gemini للنماذج العاملة عبر عمليات نقل وكيل متوافقة مع OpenAI؛ ولا يفعّل تحقق replay الأصلي لـ Gemini أو إعادة كتابة bootstrap الأصلية | `openrouter`، `kilocode`، `opencode`، `opencode-go` |
    | `hybrid-anthropic-openai` | سياسة هجينة للمزوّدين الذين يخلطون بين أسطح نماذج رسائل Anthropic والأسطح المتوافقة مع OpenAI في Plugin واحد؛ ويظل حذف كتل التفكير الخاص بـ Claude اختيارياً ومحسورًا في جانب Anthropic | `minimax` |

    عائلات البث المتاحة اليوم:

    | العائلة | ما الذي توصله | أمثلة مضمّنة |
  | --- | --- | --- |
  | `google-thinking` | تطبيع حمولة thinking الخاصة بـ Gemini على مسار البث المشترك | `google`، `google-gemini-cli` |
  | `kilocode-thinking` | مغلف reasoning الخاص بـ Kilo على مسار بث الوكيل المشترك، مع تخطي `kilo/auto` ومعرّفات reasoning غير المدعومة لحقن thinking | `kilocode` |
  | `moonshot-thinking` | ربط حمولة native-thinking الثنائية الخاصة بـ Moonshot انطلاقًا من التكوين + مستوى `/think` | `moonshot` |
  | `minimax-fast-mode` | إعادة كتابة نموذج MiniMax fast-mode على مسار البث المشترك | `minimax`، `minimax-portal` |
  | `openai-responses-defaults` | مغلفات OpenAI/Codex Responses الأصلية المشتركة: ترويسات الإسناد، و`/fast`/`serviceTier`، وإسهاب النص، والبحث الأصلي على الويب في Codex، وتشكيل حمولة reasoning-compat، وإدارة سياق Responses | `openai`، `openai-codex` |
  | `openrouter-thinking` | مغلف reasoning الخاص بـ OpenRouter لمسارات الوكيل، مع التعامل مركزيًا مع تخطي النماذج غير المدعومة/`auto` | `openrouter` |
  | `tool-stream-default-on` | مغلف `tool_stream` مفعل افتراضيًا لمزوّدين مثل Z.AI يريدون بث الأدوات ما لم يتم تعطيله صراحةً | `zai` |

    <Accordion title="سطوح SDK التي تدعم بانيات العائلات">
      تتكوّن كل عائلة من البانيات من مساعدين عامين منخفضي المستوى مُصدّرين من الحزمة نفسها، ويمكنك اللجوء إليهم عندما يحتاج مزوّد ما إلى الخروج عن النمط الشائع:

      - `openclaw/plugin-sdk/provider-model-shared` — ‏`ProviderReplayFamily`، و`buildProviderReplayFamilyHooks(...)`، وبانيات replay الخام (`buildOpenAICompatibleReplayPolicy`، و`buildAnthropicReplayPolicyForModel`، و`buildGoogleGeminiReplayPolicy`، و`buildHybridAnthropicOrOpenAIReplayPolicy`). كما يصدّر مساعدين لـ replay في Gemini (`sanitizeGoogleGeminiReplayHistory`، و`resolveTaggedReasoningOutputMode`) ومساعدي نقاط النهاية/النماذج (`resolveProviderEndpoint`، و`normalizeProviderId`، و`normalizeGooglePreviewModelId`، و`normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — ‏`ProviderStreamFamily`، و`buildProviderStreamFamilyHooks(...)`، و`composeProviderStreamWrappers(...)`، بالإضافة إلى مغلفات OpenAI/Codex المشتركة (`createOpenAIAttributionHeadersWrapper`، و`createOpenAIFastModeWrapper`، و`createOpenAIServiceTierWrapper`، و`createOpenAIResponsesContextManagementWrapper`، و`createCodexNativeWebSearchWrapper`) ومغلفات الوكيل/المزوّد المشتركة (`createOpenRouterWrapper`، و`createToolStreamWrapper`، و`createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — ‏`ProviderToolCompatFamily`، و`buildProviderToolCompatFamilyHooks("gemini")`، والمساعدات الأساسية لمخطط Gemini (`normalizeGeminiToolSchemas`، و`inspectGeminiToolSchemas`)، ومساعدات التوافق مع xAI ‏(`resolveXaiModelCompatPatch()`، و`applyXaiModelCompat(model)`). يستخدم Plugin ‏xAI المضمّن `normalizeResolvedModel` + `contributeResolvedModelCompat` مع هذه المساعدات لإبقاء قواعد xAI مملوكة للمزوّد.

      تبقى بعض مساعدات البث محلية للمزوّد عمدًا. يحتفظ `@openclaw/anthropic-provider` بـ `wrapAnthropicProviderStream`، و`resolveAnthropicBetas`، و`resolveAnthropicFastMode`، و`resolveAnthropicServiceTier`، وبانيات المغلفات منخفضة المستوى الخاصة بـ Anthropic داخل السطح العام `api.ts` / `contract-api.ts` الخاص به لأنها ترمز إلى معالجة Claude OAuth beta وبوابات `context1m`. وبالمثل يحتفظ Plugin ‏xAI بتشكيل Responses الأصلية الخاصة بـ xAI داخل `wrapStreamFn` الخاص به (`/fast` aliases، و`tool_stream` الافتراضي، وتنظيف strict-tool غير المدعوم، وإزالة حمولة reasoning الخاصة بـ xAI).

      كما يدعم النمط نفسه على مستوى جذر الحزمة كلًّا من `@openclaw/openai-provider` (بانيات المزوّد، ومساعدات النموذج الافتراضي، وبانيات مزوّدات الوقت الحقيقي) و`@openclaw/openrouter-provider` (باني المزوّد بالإضافة إلى مساعدات الإعداد الأولي/التكوين).
    </Accordion>

    <Tabs>
      <Tab title="تبادل الرموز المميزة">
        بالنسبة إلى المزوّدين الذين يحتاجون إلى تبادل رمز مميز قبل كل استدعاء استدلال:

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
      <Tab title="ترويسات مخصصة">
        بالنسبة إلى المزوّدين الذين يحتاجون إلى ترويسات طلب مخصصة أو تعديلات على جسم الطلب:

        ```typescript
        // تُعيد wrapStreamFn قيمة StreamFn مشتقة من ctx.streamFn
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
        بالنسبة إلى المزوّدين الذين يحتاجون إلى ترويسات أو بيانات وصفية أصلية
        للطلب/الجلسة على عمليات نقل HTTP أو WebSocket العامة:

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
        بالنسبة إلى المزوّدين الذين يكشفون بيانات الاستخدام/الفوترة:

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

    <Accordion title="جميع خطافات المزوّد المتاحة">
      يستدعي OpenClaw الخطافات بهذا الترتيب. وتستخدم معظم المزوّدات 2-3 فقط:

      | # | الخطاف | متى تستخدمه |
      | --- | --- | --- |
      | 1 | `catalog` | فهرس النماذج أو القيم الافتراضية لـ base URL |
      | 2 | `applyConfigDefaults` | القيم الافتراضية العامة المملوكة للمزوّد أثناء materialization الخاص بالتكوين |
      | 3 | `normalizeModelId` | تنظيف الأسماء المستعارة القديمة/الاستعراضية لـ model-id قبل lookup |
      | 4 | `normalizeTransport` | تنظيف `api` / `baseUrl` لعائلة المزوّد قبل تجميع النموذج العام |
      | 5 | `normalizeConfig` | تطبيع تكوين `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | إعادة كتابة توافق الاستخدام المتدفق الأصلي لمزوّدي التكوين |
      | 7 | `resolveConfigApiKey` | تحليل مصادقة env-marker المملوك للمزوّد |
      | 8 | `resolveSyntheticAuth` | مصادقة اصطناعية محلية/مستضافة ذاتيًا أو مدعومة بالتكوين |
      | 9 | `shouldDeferSyntheticProfileAuth` | تأخير العناصر النائبة الاصطناعية لملفات التعريف المخزنة خلف مصادقة env/config |
      | 10 | `resolveDynamicModel` | قبول معرّفات النماذج العشوائية من upstream |
      | 11 | `prepareDynamicModel` | جلب بيانات وصفية غير متزامن قبل التحليل |
      | 12 | `normalizeResolvedModel` | إعادة كتابة النقل قبل المنفّذ |
      | 13 | `contributeResolvedModelCompat` | أعلام توافق لنماذج المورّد خلف نقل متوافق آخر |
      | 14 | `capabilities` | حقيبة إمكانات ثابتة قديمة؛ للتوافق فقط |
      | 15 | `normalizeToolSchemas` | تنظيف مخطط الأدوات المملوك للمزوّد قبل التسجيل |
      | 16 | `inspectToolSchemas` | تشخيصات مخطط الأدوات المملوكة للمزوّد |
      | 17 | `resolveReasoningOutputMode` | عقد reasoning-output الموسوم مقابل الأصلي |
      | 18 | `prepareExtraParams` | معلمات الطلب الافتراضية |
      | 19 | `createStreamFn` | نقل StreamFn مخصص بالكامل |
      | 20 | `wrapStreamFn` | مغلفات ترويسات/جسم مخصصة على مسار البث العادي |
      | 21 | `resolveTransportTurnState` | ترويسات/بيانات وصفية أصلية لكل دور |
      | 22 | `resolveWebSocketSessionPolicy` | ترويسات جلسة WS الأصلية/فترة التهدئة |
      | 23 | `formatApiKey` | شكل الرمز المميز المخصص في Runtime |
      | 24 | `refreshOAuth` | تحديث OAuth مخصص |
      | 25 | `buildAuthDoctorHint` | إرشادات إصلاح المصادقة |
      | 26 | `matchesContextOverflowError` | اكتشاف تجاوز السياق المملوك للمزوّد |
      | 27 | `classifyFailoverReason` | تصنيف حدود المعدل/التحميل الزائد المملوك للمزوّد |
      | 28 | `isCacheTtlEligible` | بوابة TTL الخاصة بذاكرة التخزين المؤقت للمطالبة |
      | 29 | `buildMissingAuthMessage` | تلميح مخصص عند غياب المصادقة |
      | 30 | `suppressBuiltInModel` | إخفاء صفوف upstream القديمة |
      | 31 | `augmentModelCatalog` | صفوف اصطناعية للتوافق المستقبلي |
      | 32 | `resolveThinkingProfile` | مجموعة خيارات `/think` الخاصة بالنموذج |
      | 33 | `isBinaryThinking` | توافق thinking الثنائي تشغيل/إيقاف |
      | 34 | `supportsXHighThinking` | توافق دعم reasoning عند `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | توافق سياسة `/think` الافتراضية |
      | 36 | `isModernModelRef` | مطابقة النماذج الحية/اختبارات smoke |
      | 37 | `prepareRuntimeAuth` | تبادل الرمز المميز قبل الاستدلال |
      | 38 | `resolveUsageAuth` | تحليل بيانات اعتماد الاستخدام المخصص |
      | 39 | `fetchUsageSnapshot` | نقطة نهاية استخدام مخصصة |
      | 40 | `createEmbeddingProvider` | مهايئ تضمين مملوك للمزوّد من أجل الذاكرة/البحث |
      | 41 | `buildReplayPolicy` | سياسة replay/Compaction مخصصة للنصوص |
      | 42 | `sanitizeReplayHistory` | إعادة كتابة replay خاصة بالمزوّد بعد التنظيف العام |
      | 43 | `validateReplayTurns` | تحقق صارم من أدوار replay قبل المنفّذ المضمّن |
      | 44 | `onModelSelected` | استدعاء لاحق للاختيار (مثل telemetry) |

      ملاحظات احتياط Runtime:

      - يفحص `normalizeConfig` أولًا المزوّد المطابق، ثم Plugins المزوّدين الأخرى القادرة على استخدام الخطافات إلى أن يغيّر أحدها التكوين فعليًا. وإذا لم يُعد أي خطاف مزوّد كتابة إدخال تكوين مدعوم من عائلة Google، فلا يزال مطبّع تكوين Google المضمّن يُطبَّق.
      - يستخدم `resolveConfigApiKey` خطاف المزوّد عند كشفه. كما أن المسار المضمّن `amazon-bedrock` يحتوي هنا أيضًا على محلل env-marker مدمج خاص بـ AWS، رغم أن مصادقة Bedrock نفسها في Runtime لا تزال تستخدم سلسلة AWS SDK الافتراضية.
      - يتيح `resolveSystemPromptContribution` للمزوّد حقن إرشادات مطالبة نظام تراعي الذاكرة المؤقتة لعائلة نموذج. ويفضَّل استخدامه على `before_prompt_build` عندما يكون السلوك تابعًا لمزوّد/عائلة نموذج واحدة ويجب أن يحافظ على الفصل بين الأجزاء الثابتة/الديناميكية للذاكرة المؤقتة.

      للحصول على أوصاف مفصلة وأمثلة واقعية، راجع [Internals: خطافات Runtime الخاصة بالمزوّد](/ar/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="أضف إمكانات إضافية (اختياري)">
    يمكن لـ Plugin المزوّد تسجيل إمكانات الكلام، ونسخ الوقت الحقيقي، و
    الصوت في الوقت الحقيقي، وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، و
    جلب الويب، والبحث على الويب إلى جانب الاستدلال النصي. ويصنّف OpenClaw هذا على أنه
    Plugin **hybrid-capability** — وهو النمط الموصى به لـ Plugins الشركات
    (Plugin واحدة لكل مورّد). راجع
    [Internals: ملكية الإمكانات](/ar/plugins/architecture#capability-ownership-model).

    سجّل كل إمكانية داخل `register(api)` إلى جانب الاستدعاء الموجود
    `api.registerProvider(...)`. اختر فقط الألسنة التي تحتاجها:

    <Tabs>
      <Tab title="الكلام (TTS)">
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
      <Tab title="النسخ في الوقت الحقيقي">
        فضّل `createRealtimeTranscriptionWebSocketSession(...)` — إذ يتولى
        المساعد المشترك التعامل مع التقاط الوكيل، وتراجع إعادة الاتصال، وتفريغ الإغلاق، وHandshake الجاهز، وإدراج الصوت في الطابور، وتشخيصات أحداث الإغلاق. لا يقوم Plugin الخاص بك
        إلا بربط أحداث upstream.

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

        ينبغي لمزوّدي STT الدُفعيين الذين يرسلون ملفات صوتية متعددة الأجزاء عبر POST استخدام
        `buildAudioTranscriptionFormData(...)` من
        `openclaw/plugin-sdk/provider-http`. حيث يقوم المساعد بتطبيع
        أسماء ملفات الرفع، بما في ذلك رفع AAC الذي يحتاج إلى اسم ملف بأسلوب M4A لواجهات نسخ متوافقة.
      </Tab>
      <Tab title="الصوت في الوقت الحقيقي">
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
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="توليد الصور والفيديو">
        تستخدم إمكانات الفيديو بنية **مدركة للوضع**: ‏`generate`،
        و`imageToVideo`، و`videoToVideo`. ولا تكفي الحقول المجمعة المسطحة مثل
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` للإعلان
        عن دعم أوضاع التحويل أو الأوضاع المعطلة بشكل نظيف.
        ويتبع توليد الموسيقى النمط نفسه مع كتل `generate` /
        `edit` الصريحة.

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
      <Tab title="جلب الويب والبحث">
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

  <Step title="اختبر">
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // صدّر كائن تكوين المزوّد من index.ts أو من ملف مخصص
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

## انشر على ClawHub

تُنشر Plugins المزوّدين بالطريقة نفسها التي تُنشر بها أي Plugin شيفرة خارجية أخرى:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

لا تستخدم الاسم المستعار القديم الخاص بنشر Skill فقط هنا؛ يجب أن تستخدم
حزم Plugins الأمر `clawhub package publish`.

## بنية الملفات

```
<bundled-plugin-root>/acme-ai/
├── package.json              # بيانات openclaw.providers الوصفية
├── openclaw.plugin.json      # البيان مع بيانات مصادقة المزوّد الوصفية
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # الاختبارات
    └── usage.ts              # نقطة نهاية الاستخدام (اختياري)
```

## مرجع ترتيب الفهرس

يتحكم `catalog.order` في توقيت دمج فهرسك مقارنةً بالمزوّدين
المدمجين:

| الترتيب   | التوقيت       | حالة الاستخدام                                   |
| --------- | ------------- | ------------------------------------------------ |
| `simple`  | التمريرة الأولى | مزوّدو مفاتيح API البسيطون                    |
| `profile` | بعد simple    | المزوّدون المقيّدون بملفات تعريف المصادقة        |
| `paired`  | بعد profile   | توليد عدة إدخالات مترابطة                        |
| `late`    | التمريرة الأخيرة | تجاوز المزوّدين الموجودين (يفوز عند التعارض) |

## الخطوات التالية

- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — إذا كان Plugin الخاص بك يوفّر قناة أيضًا
- [SDK Runtime](/ar/plugins/sdk-runtime) — مساعدات `api.runtime` ‏(TTS، والبحث، والوكيل الفرعي)
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — المرجع الكامل للاستيراد من المسارات الفرعية
- [الداخليات الخاصة بالـ Plugin](/ar/plugins/architecture-internals#provider-runtime-hooks) — تفاصيل الخطافات والأمثلة المضمّنة

## ذو صلة

- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء Plugins](/ar/plugins/building-plugins)
- [بناء Plugins القنوات](/ar/plugins/sdk-channel-plugins)
