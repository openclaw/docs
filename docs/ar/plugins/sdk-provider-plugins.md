---
read_when:
    - أنت تبني Plugin جديدًا لمزوّد نماذج
    - تريد إضافة وكيل متوافق مع OpenAI أو نموذج لغوي كبير مخصص إلى OpenClaw
    - تحتاج إلى فهم مصادقة المزوّدين والكتالوجات وخطافات وقت التشغيل
sidebarTitle: Provider plugins
summary: دليل خطوة بخطوة لإنشاء Plugin لمزوّد نماذج لـ OpenClaw
title: بناء Plugins المزوّدين
x-i18n:
    generated_at: "2026-05-06T08:08:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f62f4b4df055412288b9d56f0344c76b9adfc3a04f3916eba37c04d22a3d808
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

يرشدك هذا الدليل خلال بناء Plugin موفّر يضيف موفّر نماذج
(LLM) إلى OpenClaw. في النهاية سيكون لديك موفّر يتضمن كتالوج نماذج،
ومصادقة بمفتاح API، وحلًا ديناميكيًا للنماذج.

<Info>
  إذا لم تكن قد بنيت أي Plugin لـ OpenClaw من قبل، فاقرأ
  [البدء](/ar/plugins/building-plugins) أولًا للاطلاع على بنية الحزمة الأساسية
  وإعداد البيان.
</Info>

<Tip>
  تضيف Plugins الموفّرين نماذج إلى حلقة الاستدلال العادية في OpenClaw. إذا كان النموذج
  يجب أن يعمل عبر عفريت وكيل أصلي يملك الخيوط أو Compaction أو أحداث الأدوات،
  فاقرن الموفّر بـ [حاضنة وكيل](/ar/plugins/sdk-agent-harness)
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
    عندما يجب أن يعيد متغير موفّر استخدام مصادقة معرّف موفّر آخر. `modelSupport`
    اختياري، ويتيح لـ OpenClaw تحميل Plugin الموفّر تلقائيًا من معرّفات
    النماذج المختصرة مثل `acme-large` قبل وجود خطاطيف وقت التشغيل. إذا نشرت
    الموفّر على ClawHub، فستكون حقول `openclaw.compat` و`openclaw.build`
    هذه مطلوبة في `package.json`.

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

    هذا موفّر عامل. يمكن للمستخدمين الآن تشغيل
    `openclaw onboard --acme-ai-api-key <key>` واختيار
    `acme-ai/acme-large` كنموذج لهم.

    إذا كان الموفّر upstream يستخدم رموز تحكم مختلفة عن OpenClaw، فأضف
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

    يعيد `input` كتابة موجه النظام النهائي ومحتوى الرسائل النصية قبل
    النقل. ويعيد `output` كتابة دلتا نص المساعد والنص النهائي قبل أن
    يحلل OpenClaw علامات التحكم الخاصة به أو تسليم القناة.

    بالنسبة إلى الموفّرين المضمّنين الذين يسجلون موفّر نص واحدًا فقط مع مصادقة
    مفتاح API إضافة إلى وقت تشغيل واحد مدعوم بكتالوج، فضّل المساعد الأضيق
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

    `buildProvider` هو مسار الكتالوج الحي المستخدم عندما يستطيع OpenClaw حل
    مصادقة الموفّر الحقيقية. قد ينفّذ اكتشافًا خاصًا بالموفّر. استخدم
    `buildStaticProvider` فقط للصفوف غير المتصلة التي يمكن عرضها بأمان قبل
    إعداد المصادقة؛ يجب ألا تتطلب بيانات اعتماد أو تجري طلبات شبكة.
    ينفّذ عرض `models list --all` في OpenClaw حاليًا الكتالوجات الثابتة
    فقط لـ Plugins الموفّرين المضمّنة، مع إعداد فارغ، وبيئة فارغة، ودون
    مسارات وكيل/مساحة عمل.

    إذا كان تدفق المصادقة لديك يحتاج أيضًا إلى ترقيع `models.providers.*` والأسماء
    المستعارة ونموذج الوكيل الافتراضي أثناء التهيئة، فاستخدم مساعدات الإعداد المسبق من
    `openclaw/plugin-sdk/provider-onboard`. أضيق المساعدات هي
    `createDefaultModelPresetAppliers(...)`،
    و`createDefaultModelsPresetAppliers(...)`، و
    `createModelCatalogPresetAppliers(...)`.

    عندما تدعم نقطة النهاية الأصلية للموفّر كتل الاستخدام المتدفقة على
    نقل `openai-completions` العادي، فضّل مساعدات الكتالوج المشتركة في
    `openclaw/plugin-sdk/provider-catalog-shared` بدلًا من ترميز
    فحوصات معرّف الموفّر مباشرة. يكتشف `supportsNativeStreamingUsageCompat(...)` و
    `applyProviderNativeStreamingUsageCompat(...)` الدعم من خريطة قدرات
    نقطة النهاية، لذلك لا تزال نقاط نهاية Moonshot/DashScope الأصلية
    تشترك حتى عندما يستخدم Plugin معرّف موفّر مخصصًا.

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

    إذا كان الحل يتطلب استدعاء شبكة، فاستخدم `prepareDynamicModel` للإحماء
    غير المتزامن - يعمل `resolveDynamicModel` مرة أخرى بعد اكتماله.

  </Step>

  <Step title="إضافة خطاطيف وقت التشغيل (حسب الحاجة)">
    يحتاج معظم الموفّرين فقط إلى `catalog` + `resolveDynamicModel`. أضف الخطاطيف
    تدريجيًا بحسب ما يتطلبه موفّرك.

    تغطي بُناة المساعدات المشتركة الآن أكثر عائلات التوافق مع الإعادة/الأدوات
    شيوعًا، لذلك لا تحتاج Plugins عادةً إلى توصيل كل خطاف يدويًا واحدًا تلو الآخر:

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

    عائلات الإعادة المتاحة اليوم:

    | العائلة | ما توصله | أمثلة مضمّنة |
    | --- | --- | --- |
    | `openai-compatible` | سياسة إعادة مشتركة بأسلوب OpenAI للنقل المتوافق مع OpenAI، بما في ذلك تنظيف معرّفات استدعاء الأدوات، وإصلاحات ترتيب المساعد أولًا، والتحقق العام من أدوار Gemini عندما يحتاج النقل إلى ذلك | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | سياسة إعادة واعية بـ Claude تُختار بواسطة `modelId`، بحيث تحصل عمليات نقل رسائل Anthropic فقط على تنظيف كتل التفكير الخاص بـ Claude عندما يكون النموذج المحلول معرّف Claude فعليًا | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | سياسة إعادة Gemini الأصلية إضافة إلى تنظيف إعادة bootstrap ووضع مخرجات التفكير الموسومة | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | تنظيف توقيع التفكير في Gemini لنماذج Gemini التي تعمل عبر عمليات نقل وكيل متوافقة مع OpenAI؛ لا يفعّل التحقق من إعادة Gemini الأصلية أو إعادات كتابة bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | سياسة هجينة للموفّرين الذين يمزجون أسطح نماذج رسائل Anthropic والمتوافقة مع OpenAI في Plugin واحد؛ يبقى إسقاط كتل التفكير الاختياري الخاص بـ Claude محصورًا في جانب Anthropic | `minimax` |

    عائلات التدفق المتاحة اليوم:

    | العائلة | ما الذي توصله | أمثلة مضمّنة |
    | --- | --- | --- |
    | `google-thinking` | تطبيع حمولة التفكير في Gemini على مسار التدفق المشترك | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | مغلّف استدلال Kilo على مسار تدفق الوكيل المشترك، مع تخطي `kilo/auto` ومعرّفات استدلال الوكيل غير المدعومة للتفكير المُحقن | `kilocode` |
    | `moonshot-thinking` | تعيين حمولة التفكير الأصلي الثنائي في Moonshot من الإعداد + مستوى `/think` | `moonshot` |
    | `minimax-fast-mode` | إعادة كتابة نموذج الوضع السريع في MiniMax على مسار التدفق المشترك | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | مغلّفات OpenAI/Codex Responses الأصلية المشتركة: ترويسات الإسناد، و`/fast`/`serviceTier`، وإسهاب النص، وبحث الويب الأصلي في Codex، وتشكيل حمولة توافق الاستدلال، وإدارة سياق Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | مغلّف استدلال OpenRouter لمسارات الوكيل، مع التعامل مركزيًا مع تخطيات النماذج غير المدعومة/`auto` | `openrouter` |
    | `tool-stream-default-on` | مغلّف `tool_stream` المفعّل افتراضيًا لمزوّدين مثل Z.AI الذين يريدون تدفق الأدوات ما لم يُعطّل صراحة | `zai` |

    <Accordion title="واجهات SDK التي تشغّل بُناة العائلات">
      يتكون كل باني عائلة من مساعدين عامين منخفضي المستوى مُصدّرين من الحزمة نفسها، ويمكنك استخدامهم عندما يحتاج المزوّد إلى الخروج عن النمط الشائع:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`، و`buildProviderReplayFamilyHooks(...)`، وبُناة إعادة التشغيل الخام (`buildOpenAICompatibleReplayPolicy`، و`buildAnthropicReplayPolicyForModel`، و`buildGoogleGeminiReplayPolicy`، و`buildHybridAnthropicOrOpenAIReplayPolicy`). يصدّر أيضًا مساعدي إعادة تشغيل Gemini (`sanitizeGoogleGeminiReplayHistory`، و`resolveTaggedReasoningOutputMode`) ومساعدي نقطة النهاية/النموذج (`resolveProviderEndpoint`، و`normalizeProviderId`، و`normalizeGooglePreviewModelId`، و`normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`، و`buildProviderStreamFamilyHooks(...)`، و`composeProviderStreamWrappers(...)`، إضافة إلى مغلّفات OpenAI/Codex المشتركة (`createOpenAIAttributionHeadersWrapper`، و`createOpenAIFastModeWrapper`، و`createOpenAIServiceTierWrapper`، و`createOpenAIResponsesContextManagementWrapper`، و`createCodexNativeWebSearchWrapper`)، ومغلّف DeepSeek V4 المتوافق مع OpenAI (`createDeepSeekV4OpenAICompatibleThinkingWrapper`)، وتنظيف التمهيد المسبق للتفكير في Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`)، ومغلّفات الوكيل/المزوّد المشتركة (`createOpenRouterWrapper`، و`createToolStreamWrapper`، و`createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`، و`buildProviderToolCompatFamilyHooks("gemini")`، ومساعدو مخططات Gemini الأساسية (`normalizeGeminiToolSchemas`، و`inspectGeminiToolSchemas`)، ومساعدو توافق xAI (`resolveXaiModelCompatPatch()`، و`applyXaiModelCompat(model)`). يستخدم Plugin xAI المضمّن `normalizeResolvedModel` + `contributeResolvedModelCompat` مع هذه العناصر لإبقاء قواعد xAI مملوكة للمزوّد.

      يبقى بعض مساعدي التدفق محليًا لدى المزوّد عمدًا. يحتفظ `@openclaw/anthropic-provider` بكل من `wrapAnthropicProviderStream`، و`resolveAnthropicBetas`، و`resolveAnthropicFastMode`، و`resolveAnthropicServiceTier`، وبُناة مغلّفات Anthropic منخفضة المستوى في واجهته العامة `api.ts` / `contract-api.ts` لأنها ترمّز التعامل مع إصدارات Claude OAuth التجريبية وحظر `context1m`. وبالمثل، يحتفظ Plugin xAI بتشكيل xAI Responses الأصلي في `wrapStreamFn` الخاص به (أسماء `/fast` البديلة، و`tool_stream` الافتراضي، وتنظيف الأدوات الصارمة غير المدعومة، وإزالة حمولة الاستدلال الخاصة بـ xAI).

      يدعم نمط جذر الحزمة نفسه أيضًا `@openclaw/openai-provider` (بُناة المزوّد، ومساعدو النموذج الافتراضي، وبُناة مزوّد الوقت الحقيقي) و`@openclaw/openrouter-provider` (باني المزوّد إضافة إلى مساعدي التهيئة/الإعداد).
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
        للمزوّدين الذين يحتاجون إلى ترويسات طلب مخصصة أو تعديلات على المتن:

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

    <Accordion title="كل خطاطيف المزوّد المتاحة">
      يستدعي OpenClaw الخطاطيف بهذا الترتيب. يستخدم معظم المزوّدين 2-3 فقط:
      حقول المزوّد الخاصة بالتوافق فقط التي لم يعد OpenClaw يستدعيها، مثل
      `ProviderPlugin.capabilities` و`suppressBuiltInModel`، غير مدرجة
      هنا.

      | # | الخطاف | متى يُستخدم |
      | --- | --- | --- |
      | 1 | `catalog` | كتالوج النماذج أو إعدادات URL الأساسي الافتراضية |
      | 2 | `applyConfigDefaults` | الإعدادات الافتراضية العامة المملوكة للمزوّد أثناء تجسيد الإعداد |
      | 3 | `normalizeModelId` | تنظيف الأسماء البديلة لمعرّفات نماذج قديمة/معاينة قبل البحث |
      | 4 | `normalizeTransport` | تنظيف `api` / `baseUrl` لعائلة المزوّد قبل تجميع النموذج العام |
      | 5 | `normalizeConfig` | تطبيع إعداد `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | إعادة كتابة توافق استخدام التدفق الأصلي لمزوّدي الإعداد |
      | 7 | `resolveConfigApiKey` | حل المصادقة بعلامات البيئة المملوك للمزوّد |
      | 8 | `resolveSyntheticAuth` | مصادقة اصطناعية محلية/مستضافة ذاتيًا أو مدعومة بالإعداد |
      | 9 | `shouldDeferSyntheticProfileAuth` | خفض مواضع حفظ ملفات التعريف الاصطناعية المخزّنة خلف مصادقة البيئة/الإعداد |
      | 10 | `resolveDynamicModel` | قبول معرّفات نماذج علوية عشوائية |
      | 11 | `prepareDynamicModel` | جلب غير متزامن للبيانات الوصفية قبل الحل |
      | 12 | `normalizeResolvedModel` | إعادة كتابة النقل قبل المشغّل |
      | 13 | `contributeResolvedModelCompat` | علامات توافق لنماذج مورّد خلف نقل آخر متوافق |
      | 14 | `normalizeToolSchemas` | تنظيف مخطط الأدوات المملوك للمزوّد قبل التسجيل |
      | 15 | `inspectToolSchemas` | تشخيصات مخطط الأدوات المملوكة للمزوّد |
      | 16 | `resolveReasoningOutputMode` | عقد مخرجات الاستدلال الموسومة مقابل الأصلية |
      | 17 | `prepareExtraParams` | معاملات الطلب الافتراضية |
      | 18 | `createStreamFn` | نقل StreamFn مخصص بالكامل |
      | 19 | `wrapStreamFn` | مغلّفات ترويسات/متن مخصصة على مسار التدفق العادي |
      | 20 | `resolveTransportTurnState` | ترويسات/بيانات وصفية أصلية لكل دورة |
      | 21 | `resolveWebSocketSessionPolicy` | ترويسات/فترة تهدئة جلسة WS الأصلية |
      | 22 | `formatApiKey` | شكل رمز وقت تشغيل مخصص |
      | 23 | `refreshOAuth` | تحديث OAuth مخصص |
      | 24 | `buildAuthDoctorHint` | إرشادات إصلاح المصادقة |
      | 25 | `matchesContextOverflowError` | اكتشاف الفيض المملوك للمزوّد |
      | 26 | `classifyFailoverReason` | تصنيف حدود المعدل/الحمل الزائد المملوك للمزوّد |
      | 27 | `isCacheTtlEligible` | حظر TTL لذاكرة التخزين المؤقت للمطالبات |
      | 28 | `buildMissingAuthMessage` | تلميح مخصص للمصادقة المفقودة |
      | 29 | `augmentModelCatalog` | صفوف توافق أمامي اصطناعية |
      | 30 | `resolveThinkingProfile` | مجموعة خيارات `/think` الخاصة بالنموذج |
      | 31 | `isBinaryThinking` | توافق تشغيل/إيقاف التفكير الثنائي |
      | 32 | `supportsXHighThinking` | توافق دعم استدلال `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | توافق سياسة `/think` الافتراضية |
      | 34 | `isModernModelRef` | مطابقة نماذج مباشرة/دخانية |
      | 35 | `prepareRuntimeAuth` | تبادل الرمز المميز قبل الاستدلال |
      | 36 | `resolveUsageAuth` | تحليل بيانات اعتماد الاستخدام المخصصة |
      | 37 | `fetchUsageSnapshot` | نقطة نهاية استخدام مخصصة |
      | 38 | `createEmbeddingProvider` | محوّل تضمين مملوك للمزوّد للذاكرة/البحث |
      | 39 | `buildReplayPolicy` | سياسة مخصصة لإعادة تشغيل/Compaction النص |
      | 40 | `sanitizeReplayHistory` | إعادة كتابة إعادة التشغيل الخاصة بالمزوّد بعد التنظيف العام |
      | 41 | `validateReplayTurns` | تحقق صارم من دورات إعادة التشغيل قبل المشغّل المضمّن |
      | 42 | `onModelSelected` | رد نداء بعد الاختيار (مثلًا القياسات) |

      ملاحظات الرجوع الاحتياطي في وقت التشغيل:

      - يتحقق `normalizeConfig` من المزوّد المطابق أولًا، ثم من Plugins المزوّدين الآخرين القادرين على الخطاطيف حتى يغيّر أحدهم الإعداد فعليًا. إذا لم يُعد أي خطاف مزوّد كتابة إدخال إعداد مدعوم من عائلة Google، فسيظل مطبّع إعداد Google المضمّن مُطبقًا.
      - يستخدم `resolveConfigApiKey` خطاف المزوّد عند كشفه. يحتوي مسار `amazon-bedrock` المضمّن أيضًا على محلّل مدمج لعلامات بيئة AWS هنا، مع أن مصادقة وقت تشغيل Bedrock نفسها ما زالت تستخدم سلسلة AWS SDK الافتراضية.
      - يتيح `resolveSystemPromptContribution` للمزوّد حقن إرشادات مطالبة نظام مدركة لذاكرة التخزين المؤقت لعائلة نماذج. فضّله على `before_prompt_build` عندما يكون السلوك تابعًا لعائلة مزوّد/نموذج واحدة ويجب أن يحافظ على تقسيم التخزين المؤقت المستقر/الديناميكي.

      للحصول على أوصاف تفصيلية وأمثلة واقعية، راجع [الداخليات: خطاطيف وقت تشغيل المزوّد](/ar/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="إضافة قدرات إضافية (اختياري)">
    ### الخطوة 5: إضافة قدرات إضافية

    يمكن لـ Plugin مزوّد تسجيل الكلام، والنسخ في الوقت الحقيقي، والصوت في الوقت الحقيقي،
    وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب،
    وبحث الويب إلى جانب استدلال النص. يصنّف OpenClaw هذا على أنه
    Plugin **هجين القدرات** - وهو النمط الموصى به لـ Plugins الشركات
    (Plugin واحد لكل مورّد). راجع
    [الداخليات: ملكية القدرات](/ar/plugins/architecture#capability-ownership-model).

    سجّل كل قدرة داخل `register(api)` إلى جانب استدعاء
    `api.registerProvider(...)` الموجود لديك. اختر علامات التبويب التي تحتاجها فقط:

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

        استخدم `assertOkOrThrowProviderError(...)` لإخفاقات HTTP الخاصة بالمزوّدات حتى
        تشترك Plugins في قراءات جسم الخطأ المحدودة، وتحليل أخطاء JSON، ولواحق
        معرفات الطلبات.
      </Tab>
      <Tab title="Realtime transcription">
        فضّل `createRealtimeTranscriptionWebSocketSession(...)` - يتولى المساعد المشترك
        التقاط الوكيل، والتراجع عند إعادة الاتصال، وتفريغ الإغلاق، ومصافحات الجاهزية،
        ووضع الصوت في قائمة انتظار، وتشخيصات حدث الإغلاق. لا يتولى Plugin الخاص بك
        إلا مطابقة أحداث المنبع.

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

        ينبغي لمزوّدي STT بالدُفعات الذين يرسلون صوتًا متعدد الأجزاء عبر POST استخدام
        `buildAudioTranscriptionFormData(...)` من
        `openclaw/plugin-sdk/provider-http`. يطبّع المساعد أسماء ملفات الرفع،
        بما في ذلك عمليات رفع AAC التي تحتاج إلى اسم ملف بنمط M4A للتوافق مع
        APIs النسخ.
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

        صرّح عن `capabilities` حتى يتمكن `talk.catalog` من عرض الأوضاع الصالحة،
        ووسائل النقل، وتنسيقات الصوت، وأعلام الميزات لعملاء Talk في المتصفح والعملاء الأصليين.
        نفّذ `handleBargeIn` عندما يمكن لوسيلة نقل اكتشاف أن إنسانًا يقاطع تشغيل
        المساعد وأن المزوّد يدعم اقتطاع استجابة الصوت النشطة أو مسحها.
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
        تستخدم قدرات الفيديو بنية **واعية بالوضع**: `generate`،
        و`imageToVideo`، و`videoToVideo`. لا تكفي الحقول التجميعية المسطحة مثل
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds`
        للإعلان عن دعم وضع التحويل أو الأوضاع المعطلة بشكل واضح.
        يتبع توليد الموسيقى النمط نفسه مع كتل `generate` /
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
    ### الخطوة 6: الاختبار

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

تنشر Plugins المزوّدات بالطريقة نفسها مثل أي Plugin كود خارجي آخر:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

لا تستخدم هنا الاسم المستعار القديم للنشر الخاص بالمهارات فقط؛ ينبغي لحزم Plugin استخدام
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

## مرجع ترتيب الكتالوج

يتحكم `catalog.order` في وقت دمج الكتالوج الخاص بك نسبةً إلى المزوّدين المضمّنين:

| الترتيب     | متى          | حالة الاستخدام                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | التمريرة الأولى    | مزوّدو مفاتيح API العاديون                         |
| `profile` | بعد simple  | المزوّدون المقيدون بملفات تعريف المصادقة                |
| `paired`  | بعد profile | تركيب عدة إدخالات مترابطة             |
| `late`    | التمريرة الأخيرة     | تجاوز المزوّدين الحاليين (يفوز عند التصادم) |

## الخطوات التالية

- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) - إذا كان Plugin الخاص بك يوفّر قناة أيضًا
- [SDK وقت التشغيل](/ar/plugins/sdk-runtime) - مساعدات `api.runtime` (TTS، البحث، العامل الفرعي)
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) - مرجع كامل لاستيراد المسارات الفرعية
- [تفاصيل Plugin الداخلية](/ar/plugins/architecture-internals#provider-runtime-hooks) - تفاصيل الخطافات والأمثلة المضمّنة

## ذات صلة

- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء Plugins](/ar/plugins/building-plugins)
- [بناء Plugins القنوات](/ar/plugins/sdk-channel-plugins)
