---
read_when:
    - أنت تبني Plugin جديدًا لموفّر نماذج
    - تريد إضافة وكيل متوافق مع OpenAI أو LLM مخصّص إلى OpenClaw
    - تحتاج إلى فهم مصادقة الموفّر والفهارس وخطافات وقت التشغيل
sidebarTitle: Provider plugins
summary: دليل خطوة بخطوة لبناء Plugin لمزوّد نماذج لـ OpenClaw
title: بناء Plugins لمزوّدي الخدمات
x-i18n:
    generated_at: "2026-05-02T22:22:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7cca1dcf2f0a34fd05c696149fef42ff8fecf1ca1fe0ccc63ba96212a9889fe
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

يرشدك هذا الدليل خلال بناء Plugin موفّر يضيف موفّر نموذج
(LLM) إلى OpenClaw. في النهاية سيكون لديك موفّر يتضمن كتالوج نماذج،
ومصادقة بمفتاح API، وحلًّا ديناميكيًا للنماذج.

<Info>
  إذا لم تكن قد بنيت أي OpenClaw Plugin من قبل، فاقرأ
  [بدء الاستخدام](/ar/plugins/building-plugins) أولًا للتعرّف على بنية الحزمة
  الأساسية وإعداد البيان.
</Info>

<Tip>
  تضيف Plugins الموفّرين نماذج إلى حلقة الاستدلال العادية في OpenClaw. إذا كان النموذج
  يجب أن يعمل عبر عفريت وكيل أصلي يملك السلاسل أو Compaction أو أحداث الأدوات،
  فاقرن الموفّر مع [حزمة وكيل](/ar/plugins/sdk-agent-harness)
  بدلًا من وضع تفاصيل بروتوكول العفريت في النواة.
</Tip>

## شرح تفصيلي

<Steps>
  <Step title="الحزمة والبيان">
    ### الخطوة 1: الحزمة والبيان

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

    يصرّح البيان بـ `providerAuthEnvVars` حتى يتمكن OpenClaw من اكتشاف
    بيانات الاعتماد دون تحميل وقت تشغيل Plugin لديك. أضف `providerAuthAliases`
    عندما ينبغي لمتغير موفّر أن يعيد استخدام مصادقة معرّف موفّر آخر. `modelSupport`
    اختياري ويتيح لـ OpenClaw تحميل Plugin الموفّر تلقائيًا من معرّفات
    النماذج المختصرة مثل `acme-large` قبل وجود خطافات وقت التشغيل. إذا نشرت
    الموفّر على ClawHub، فحقلا `openclaw.compat` و `openclaw.build`
    مطلوبان في `package.json`.

  </Step>

  <Step title="تسجيل الموفّر">
    يحتاج الموفّر الأدنى إلى `id` و`label` و`auth` و`catalog`:

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

    هذا موفّر عامل. يمكن للمستخدمين الآن
    `openclaw onboard --acme-ai-api-key <key>` واختيار
    `acme-ai/acme-large` كنموذج لهم.

    إذا كان الموفّر الأعلى يستخدم رموز تحكم مختلفة عن OpenClaw، فأضف
    تحويلًا نصيًا ثنائي الاتجاه صغيرًا بدلًا من استبدال مسار البث:

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

    يعيد `input` كتابة موجّه النظام النهائي ومحتوى الرسائل النصية قبل
    النقل. يعيد `output` كتابة زيادات نص المساعد والنص النهائي قبل أن
    يحلل OpenClaw علامات التحكم الخاصة به أو تسليم القناة.

    بالنسبة إلى الموفّرين المضمّنين الذين يسجلون موفّر نص واحدًا فقط مع
    مصادقة بمفتاح API بالإضافة إلى وقت تشغيل واحد مدعوم بالكتالوج، فضّل مساعد
    `defineSingleProviderPluginEntry(...)` الأضيق:

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

    `buildProvider` هو مسار الكتالوج الحي المستخدم عندما يتمكن OpenClaw من حل
    مصادقة الموفّر الحقيقية. قد ينفذ اكتشافًا خاصًا بالموفّر. استخدم
    `buildStaticProvider` فقط للصفوف غير المتصلة الآمنة للعرض قبل تكوين
    المصادقة؛ يجب ألا يتطلب بيانات اعتماد أو يجري طلبات شبكة.
    ينفذ عرض `models list --all` في OpenClaw حاليًا الكتالوجات الثابتة
    فقط لـ Plugins الموفّرين المضمّنين، مع تكوين فارغ وبيئة فارغة ودون
    مسارات وكيل/مساحة عمل.

    إذا كان تدفق المصادقة لديك يحتاج أيضًا إلى تعديل `models.providers.*`، والأسماء البديلة،
    ونموذج الوكيل الافتراضي أثناء الإعداد، فاستخدم مساعدات الإعداد المسبق من
    `openclaw/plugin-sdk/provider-onboard`. أضيق المساعدات هي
    `createDefaultModelPresetAppliers(...)`،
    `createDefaultModelsPresetAppliers(...)`، و
    `createModelCatalogPresetAppliers(...)`.

    عندما تدعم نقطة النهاية الأصلية لموفّر كتل استخدام مبثوثة على
    نقل `openai-completions` العادي، فضّل مساعدات الكتالوج المشتركة في
    `openclaw/plugin-sdk/provider-catalog-shared` بدلًا من ترميز
    فحوصات معرّف الموفّر مباشرة. يكتشف `supportsNativeStreamingUsageCompat(...)` و
    `applyProviderNativeStreamingUsageCompat(...)` الدعم من
    خريطة قدرات نقطة النهاية، لذلك تظل نقاط النهاية الأصلية بأسلوب Moonshot/DashScope
    مشتركة حتى عندما يستخدم Plugin معرّف موفّر مخصصًا.

  </Step>

  <Step title="إضافة حل ديناميكي للنماذج">
    إذا كان موفّرك يقبل معرّفات نماذج عشوائية (مثل وكيل أو موجّه)،
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

    إذا كان الحل يتطلب طلب شبكة، فاستخدم `prepareDynamicModel` للإحماء
    غير المتزامن — يعمل `resolveDynamicModel` مرة أخرى بعد اكتماله.

  </Step>

  <Step title="إضافة خطافات وقت التشغيل (حسب الحاجة)">
    يحتاج معظم الموفّرين فقط إلى `catalog` + `resolveDynamicModel`. أضف الخطافات
    تدريجيًا حسب ما يتطلبه موفّرك.

    تغطي بُناة المساعدات المشتركة الآن أكثر عائلات إعادة التشغيل/توافق الأدوات
    شيوعًا، لذلك لا تحتاج Plugins عادة إلى توصيل كل خطاف يدويًا واحدًا تلو الآخر:

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

    عائلات إعادة التشغيل المتاحة اليوم:

    | العائلة | ما الذي توصله | أمثلة مضمّنة |
    | --- | --- | --- |
    | `openai-compatible` | سياسة إعادة تشغيل مشتركة بأسلوب OpenAI لعمليات النقل المتوافقة مع OpenAI، بما في ذلك تنظيف معرّفات استدعاءات الأدوات، وإصلاحات ترتيب المساعد أولًا، والتحقق العام من دورات Gemini حيثما يحتاج النقل إلى ذلك | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | سياسة إعادة تشغيل واعية بـ Claude تُختار بواسطة `modelId`، بحيث لا تحصل عمليات نقل رسائل Anthropic إلا على تنظيف كتل التفكير الخاص بـ Claude عندما يكون النموذج المحلول هو فعلًا معرّف Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | سياسة إعادة تشغيل Gemini أصلية بالإضافة إلى تنظيف إعادة تشغيل التمهيد ووضع مخرجات الاستدلال الموسومة | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | تنظيف توقيع الأفكار في Gemini لنماذج Gemini التي تعمل عبر عمليات نقل وكيل متوافقة مع OpenAI؛ لا يفعّل تحقق إعادة تشغيل Gemini الأصلي أو إعادة كتابة التمهيد | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | سياسة هجينة للموفّرين الذين يمزجون أسطح نماذج رسائل Anthropic والنماذج المتوافقة مع OpenAI في Plugin واحد؛ يظل إسقاط كتل التفكير الاختياري الخاص بـ Claude محدودًا بجانب Anthropic | `minimax` |

    عائلات التدفق المتاحة حاليًا:

    | العائلة | ما تدمجه | أمثلة مضمّنة |
    | --- | --- | --- |
    | `google-thinking` | تطبيع حمولة تفكير Gemini على مسار التدفق المشترك | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | مغلّف استدلال Kilo على مسار تدفق الوكيل المشترك، مع تجاوز حقن التفكير عند `kilo/auto` ومعرّفات استدلال الوكيل غير المدعومة | `kilocode` |
    | `moonshot-thinking` | تعيين حمولة التفكير الأصلي الثنائية من Moonshot من الإعدادات + مستوى `/think` | `moonshot` |
    | `minimax-fast-mode` | إعادة كتابة نموذج الوضع السريع في MiniMax على مسار التدفق المشترك | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | مغلّفات Responses الأصلية المشتركة لـ OpenAI/Codex: ترويسات الإسناد، و`/fast`/`serviceTier`، وإسهاب النص، وبحث الويب الأصلي في Codex، وتشكيل حمولة توافق الاستدلال، وإدارة سياق Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | مغلّف استدلال OpenRouter لمسارات الوكيل، مع التعامل مركزيًا مع تجاوزات النماذج غير المدعومة/`auto` | `openrouter` |
    | `tool-stream-default-on` | مغلّف `tool_stream` المفعّل افتراضيًا للمزوّدين مثل Z.AI الذين يريدون تدفق الأدوات ما لم يُعطّل صراحةً | `zai` |

    <Accordion title="طبقات SDK التي تشغّل منشئي العائلات">
      يتكوّن كل منشئ عائلة من مساعدين عامين منخفضي المستوى مُصدَّرين من الحزمة نفسها، ويمكنك استخدامها عندما يحتاج مزوّد إلى الخروج عن النمط الشائع:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)`، ومنشئو إعادة التشغيل الخام (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). يصدّر أيضًا مساعدين لإعادة تشغيل Gemini (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) ومساعدي نقطة النهاية/النموذج (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`، إضافةً إلى مغلّفات OpenAI/Codex المشتركة (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`)، ومغلّف DeepSeek V4 المتوافق مع OpenAI (`createDeepSeekV4OpenAICompatibleThinkingWrapper`)، وتنظيف التعبئة المسبقة للتفكير في Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`)، ومغلّفات الوكيل/المزوّد المشتركة (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`، ومساعدو مخططات Gemini الأساسية (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`)، ومساعدو توافق xAI (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). يستخدم Plugin xAI المضمّن `normalizeResolvedModel` + `contributeResolvedModelCompat` مع هذه المساعدات لإبقاء قواعد xAI مملوكة للمزوّد.

      تبقى بعض مساعدات التدفق محلية لدى المزوّد عمدًا. تحتفظ `@openclaw/anthropic-provider` بكل من `wrapAnthropicProviderStream` و`resolveAnthropicBetas` و`resolveAnthropicFastMode` و`resolveAnthropicServiceTier` ومنشئي مغلّفات Anthropic منخفضي المستوى في طبقة `api.ts` / `contract-api.ts` العامة الخاصة بها لأنها ترمّز التعامل مع إصدار Claude OAuth التجريبي وتقييد `context1m`. وبالمثل، يحتفظ Plugin xAI بتشكيل xAI Responses الأصلي في `wrapStreamFn` الخاص به (الأسماء المستعارة لـ `/fast`، و`tool_stream` الافتراضي، وتنظيف الأدوات الصارمة غير المدعومة، وإزالة حمولة الاستدلال الخاصة بـ xAI).

      يدعم نمط جذر الحزمة نفسه أيضًا `@openclaw/openai-provider` (منشئو المزوّد، ومساعدو النموذج الافتراضي، ومنشئو مزوّد الوقت الحقيقي) و`@openclaw/openrouter-provider` (منشئ المزوّد إضافةً إلى مساعدي الإعداد/التهيئة الأولية).
    </Accordion>

    <Tabs>
      <Tab title="تبادل الرمز المميز">
        للمزوّدين الذين يحتاجون إلى تبادل رمز مميز قبل كل استدعاء استدلال:

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
        للمزوّدين الذين يحتاجون إلى ترويسات طلب مخصصة أو تعديلات على الجسم:

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
      <Tab title="هوية النقل الأصلية">
        للمزوّدين الذين يحتاجون إلى ترويسات أو بيانات وصفية أصلية للطلب/الجلسة على
        عمليات نقل HTTP أو WebSocket العامة:

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
        للمزوّدين الذين يوفّرون بيانات الاستخدام/الفوترة:

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
      يستدعي OpenClaw الخطافات بهذا الترتيب. لا يستخدم معظم المزوّدين إلا 2-3:
      حقول المزوّد الخاصة بالتوافق فقط التي لم يعد OpenClaw يستدعيها، مثل
      `ProviderPlugin.capabilities` و`suppressBuiltInModel`، غير مدرجة
      هنا.

      | # | الخطاف | متى يُستخدم |
      | --- | --- | --- |
      | 1 | `catalog` | كتالوج النماذج أو افتراضات عنوان URL الأساسي |
      | 2 | `applyConfigDefaults` | الافتراضات العامة المملوكة للمزوّد أثناء تجسيد الإعدادات |
      | 3 | `normalizeModelId` | تنظيف الأسماء المستعارة القديمة/المعاينة لمعرّف النموذج قبل البحث |
      | 4 | `normalizeTransport` | تنظيف `api` / `baseUrl` لعائلة المزوّد قبل تجميع النموذج العام |
      | 5 | `normalizeConfig` | تطبيع إعدادات `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | عمليات إعادة كتابة توافق استخدام التدفق الأصلي لمزوّدي الإعدادات |
      | 7 | `resolveConfigApiKey` | حل مصادقة علامة البيئة المملوك للمزوّد |
      | 8 | `resolveSyntheticAuth` | مصادقة اصطناعية محلية/ذاتية الاستضافة أو مدعومة بالإعدادات |
      | 9 | `shouldDeferSyntheticProfileAuth` | خفض أسبقية عناصر نائبة للملفات الشخصية المخزنة الاصطناعية خلف مصادقة البيئة/الإعدادات |
      | 10 | `resolveDynamicModel` | قبول معرّفات نماذج علوية عشوائية |
      | 11 | `prepareDynamicModel` | جلب بيانات وصفية غير متزامن قبل الحل |
      | 12 | `normalizeResolvedModel` | إعادة كتابة النقل قبل المشغّل |
      | 13 | `contributeResolvedModelCompat` | أعلام التوافق لنماذج البائعين خلف نقل متوافق آخر |
      | 14 | `normalizeToolSchemas` | تنظيف مخططات الأدوات المملوك للمزوّد قبل التسجيل |
      | 15 | `inspectToolSchemas` | تشخيصات مخططات الأدوات المملوكة للمزوّد |
      | 16 | `resolveReasoningOutputMode` | عقد مخرجات الاستدلال الموسومة مقابل الأصلية |
      | 17 | `prepareExtraParams` | معاملات الطلب الافتراضية |
      | 18 | `createStreamFn` | نقل StreamFn مخصص بالكامل |
      | 19 | `wrapStreamFn` | مغلّفات ترويسات/جسم مخصصة على مسار التدفق العادي |
      | 20 | `resolveTransportTurnState` | ترويسات/بيانات وصفية أصلية لكل دورة |
      | 21 | `resolveWebSocketSessionPolicy` | ترويسات جلسة WS أصلية/فترة تهدئة |
      | 22 | `formatApiKey` | شكل رمز مميز مخصص لوقت التشغيل |
      | 23 | `refreshOAuth` | تحديث OAuth مخصص |
      | 24 | `buildAuthDoctorHint` | إرشادات إصلاح المصادقة |
      | 25 | `matchesContextOverflowError` | كشف تجاوز السعة المملوك للمزوّد |
      | 26 | `classifyFailoverReason` | تصنيف حدود المعدّل/التحميل الزائد المملوك للمزوّد |
      | 27 | `isCacheTtlEligible` | تقييد TTL لذاكرة التخزين المؤقت للمطالبة |
      | 28 | `buildMissingAuthMessage` | تلميح مخصص لنقص المصادقة |
      | 29 | `augmentModelCatalog` | صفوف اصطناعية للتوافق الأمامي |
      | 30 | `resolveThinkingProfile` | مجموعة خيارات `/think` الخاصة بالنموذج |
      | 31 | `isBinaryThinking` | توافق تشغيل/إيقاف التفكير الثنائي |
      | 32 | `supportsXHighThinking` | توافق دعم استدلال `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | توافق سياسة `/think` الافتراضية |
      | 34 | `isModernModelRef` | مطابقة نموذج مباشرة/اختبار دخاني |
      | 35 | `prepareRuntimeAuth` | تبادل الرمز المميز قبل الاستدلال |
      | 36 | `resolveUsageAuth` | تحليل بيانات اعتماد الاستخدام المخصصة |
      | 37 | `fetchUsageSnapshot` | نقطة نهاية استخدام مخصصة |
      | 38 | `createEmbeddingProvider` | محوّل تضمين مملوك للمزوّد للذاكرة/البحث |
      | 39 | `buildReplayPolicy` | سياسة مخصصة لإعادة تشغيل/Compaction النسخ النصي |
      | 40 | `sanitizeReplayHistory` | عمليات إعادة كتابة إعادة تشغيل خاصة بالمزوّد بعد التنظيف العام |
      | 41 | `validateReplayTurns` | تحقق صارم من دورات إعادة التشغيل قبل المشغّل المضمّن |
      | 42 | `onModelSelected` | رد نداء بعد الاختيار (مثل القياس عن بُعد) |

      ملاحظات الرجوع الاحتياطي في وقت التشغيل:

      - يتحقق `normalizeConfig` من المزوّد المطابق أولًا، ثم من Plugins المزوّدين الأخرى القادرة على الخطافات إلى أن يغيّر أحدها الإعدادات فعليًا. إذا لم يُعد أي خطاف مزوّد كتابة إدخال إعدادات مدعوم من عائلة Google، فسيظل مطبّع إعدادات Google المضمّن مطبقًا.
      - يستخدم `resolveConfigApiKey` خطاف المزوّد عند إتاحته. يحتوي مسار `amazon-bedrock` المضمّن أيضًا على محلّل علامات بيئة AWS مدمج هنا، رغم أن مصادقة وقت تشغيل Bedrock نفسها لا تزال تستخدم سلسلة AWS SDK الافتراضية.
      - يتيح `resolveSystemPromptContribution` للمزوّد حقن إرشادات مطالبة نظام واعية بذاكرة التخزين المؤقت لعائلة نماذج. فضّله على `before_prompt_build` عندما يكون السلوك تابعًا لعائلة مزوّد/نموذج واحدة وينبغي أن يحافظ على فصل ذاكرة التخزين المؤقت المستقرة/الديناميكية.

      للحصول على أوصاف مفصلة وأمثلة واقعية، راجع [التفاصيل الداخلية: خطافات وقت تشغيل المزوّد](/ar/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="إضافة قدرات إضافية (اختياري)">
    ### الخطوة 5: إضافة قدرات إضافية

    يمكن لـ Plugin مزوّد تسجيل الكلام، والنسخ الفوري، والصوت
    الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب،
    وبحث الويب إلى جانب استدلال النص. يصنّف OpenClaw ذلك على أنه
    Plugin **ذو قدرات هجينة** — وهو النمط الموصى به لـ Plugins الشركات
    (Plugin واحد لكل بائع). راجع
    [التفاصيل الداخلية: ملكية القدرات](/ar/plugins/architecture#capability-ownership-model).

    سجّل كل قدرة داخل `register(api)` إلى جانب استدعاء
    `api.registerProvider(...)` الحالي. اختر فقط علامات التبويب التي تحتاجها:

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

        استخدم `assertOkOrThrowProviderError(...)` لإخفاقات HTTP لدى المزوّد، بحيث
        تشارك plugins قراءات جسم الخطأ المحدودة، وتحليل أخطاء JSON، ولاحقات
        معرّف الطلب.
      </Tab>
      <Tab title="النسخ الفوري">
        فضّل `createRealtimeTranscriptionWebSocketSession(...)` — إذ يتولى المساعد المشترك
        التقاط الوكيل، وتراجع إعادة الاتصال، وتفريغ الإغلاق، ومصافحات الجاهزية،
        ووضع الصوت في قائمة الانتظار، وتشخيصات حدث الإغلاق. لا يحتاج Plugin الخاص بك
        إلا إلى ربط أحداث المنبع.

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

        يجب على مزوّدي STT بالدُفعات الذين يرسلون صوتًا متعدد الأجزاء عبر POST استخدام
        `buildAudioTranscriptionFormData(...)` من
        `openclaw/plugin-sdk/provider-http`. يطبّع المساعد أسماء ملفات الرفع،
        بما في ذلك عمليات رفع AAC التي تحتاج إلى اسم ملف بنمط M4A للتوافق مع
        واجهات API النسخ.
      </Tab>
      <Tab title="الصوت الفوري">
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

        نفّذ `handleBargeIn` عندما يستطيع النقل اكتشاف أن إنسانًا يقاطع
        تشغيل المساعد، ويدعم المزوّد اقتطاع استجابة الصوت النشطة أو مسحها.
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
        تستخدم إمكانات الفيديو بنية **واعية بالوضع**: `generate` و
        `imageToVideo` و `videoToVideo`. الحقول التجميعية المسطحة مثل
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` ليست
        كافية للإعلان عن دعم وضع التحويل أو الأوضاع المعطّلة بشكل واضح.
        يتبع توليد الموسيقى النمط نفسه مع كتل `generate` /
        `edit` صريحة.

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

  <Step title="اختبار">
    ### الخطوة 6: اختبار

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

## النشر إلى ClawHub

تُنشر plugins المزوّد بالطريقة نفسها مثل أي Plugin كود خارجي آخر:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

لا تستخدم هنا الاسم المستعار القديم للنشر الخاص بالمهارات فقط؛ إذ يجب أن تستخدم حزم Plugin
`clawhub package publish`.

## بنية الملفات

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with provider auth metadata
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## مرجع ترتيب الفهرس

يتحكم `catalog.order` في توقيت دمج فهرسك نسبةً إلى
المزوّدين المدمجين:

| الترتيب     | التوقيت          | حالة الاستخدام                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | المرور الأول    | مزوّدو مفاتيح API البسيطة                         |
| `profile` | بعد simple  | المزوّدون المشروطون بملفات تعريف المصادقة                |
| `paired`  | بعد profile | توليف عدة إدخالات مترابطة             |
| `late`    | المرور الأخير     | تجاوز المزوّدين الحاليين (يفوز عند التعارض) |

## الخطوات التالية

- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — إذا كان Plugin الخاص بك يوفّر قناة أيضًا
- [وقت تشغيل SDK](/ar/plugins/sdk-runtime) — مساعدات `api.runtime` (TTS، البحث، الوكيل الفرعي)
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع كامل لاستيراد المسارات الفرعية
- [تفاصيل Plugin الداخلية](/ar/plugins/architecture-internals#provider-runtime-hooks) — تفاصيل الخطافات وأمثلة مدمجة

## ذات صلة

- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء plugins](/ar/plugins/building-plugins)
- [بناء plugins القنوات](/ar/plugins/sdk-channel-plugins)
