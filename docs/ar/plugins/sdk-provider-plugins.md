---
read_when:
    - أنت تبني Plugin جديدًا لمزوّد نماذج
    - تريد إضافة وكيل متوافق مع OpenAI أو LLM مخصص إلى OpenClaw
    - عليك فهم مصادقة المزوّدين، والكتالوجات، وخطافات وقت التشغيل
sidebarTitle: Provider plugins
summary: دليل خطوة بخطوة لبناء Plugin لموفّر نماذج لـ OpenClaw
title: بناء Plugins المزوّدين
x-i18n:
    generated_at: "2026-05-10T19:54:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1992653c8c6b079bbb6ea2b4f4b02dbd6a5a8aef286172af8048a7d9a98a8a4
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

يرشدك هذا الدليل خلال بناء Plugin مزوّد يضيف مزوّد نماذج
(LLM) إلى OpenClaw. بحلول النهاية، سيكون لديك مزوّد مع كتالوج نماذج،
ومصادقة بمفتاح API، وحل ديناميكي للنماذج.

<Info>
  إذا لم تكن قد أنشأت أي Plugin لـ OpenClaw من قبل، فاقرأ
  [بدء الاستخدام](/ar/plugins/building-plugins) أولًا لمعرفة بنية الحزمة
  الأساسية وإعداد البيان.
</Info>

<Tip>
  تضيف Plugins المزوّدين نماذج إلى حلقة الاستدلال العادية في OpenClaw. إذا كان النموذج
  يجب أن يعمل عبر عفريت وكيل أصلي يملك الخيوط، أو Compaction، أو أحداث الأدوات،
  فاقرن المزوّد مع [عدة وكيل](/ar/plugins/sdk-agent-harness)
  بدلًا من وضع تفاصيل بروتوكول العفريت في القلب.
</Tip>

## شرح تفصيلي

<Steps>
  <Step title="Package and manifest">
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

    يعلن البيان عن `providerAuthEnvVars` حتى يتمكن OpenClaw من اكتشاف
    بيانات الاعتماد من دون تحميل وقت تشغيل Plugin الخاص بك. أضف `providerAuthAliases`
    عندما يجب أن يعيد متغير مزوّد استخدام مصادقة معرّف مزوّد آخر. `modelSupport`
    اختياري، ويتيح لـ OpenClaw تحميل Plugin المزوّد تلقائيًا من معرّفات
    النماذج المختصرة مثل `acme-large` قبل وجود خطافات وقت التشغيل. إذا نشرت
    المزوّد على ClawHub، فستكون حقول `openclaw.compat` و`openclaw.build`
    هذه مطلوبة في `package.json`.

  </Step>

  <Step title="Register the provider">
    يحتاج مزوّد نصوص بسيط إلى `id`، و`label`، و`auth`، و`catalog`.
    `catalog` هو خطاف وقت التشغيل/الإعداد الذي يملكه المزوّد؛ يمكنه استدعاء
    واجهات API مباشرة للبائع وإرجاع إدخالات `models.providers`.

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

    `registerModelCatalogProvider` هو سطح كتالوج مستوى التحكم الأحدث
    لواجهة مستخدم القوائم/المساعدة/الاختيار. استخدمه لصفوف النصوص، وتوليد الصور،
    وتوليد الفيديو، وتوليد الموسيقى. أبقِ استدعاءات نقاط نهاية البائع
    وربط الاستجابات داخل Plugin؛ يملك OpenClaw شكل الصف المشترك، وتسميات
    المصدر، وعرض المساعدة.

    هذا مزوّد عامل. يمكن للمستخدمين الآن تشغيل
    `openclaw onboard --acme-ai-api-key <key>` واختيار
    `acme-ai/acme-large` كنموذج لهم.

    إذا كان المزوّد upstream يستخدم رموز تحكم مختلفة عن OpenClaw، فأضف
    تحويل نص صغيرًا ثنائي الاتجاه بدلًا من استبدال مسار البث:

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
    النقل. يعيد `output` كتابة دلتا نص المساعد والنص النهائي قبل أن
    يحلل OpenClaw علامات التحكم الخاصة به أو تسليم القناة.

    بالنسبة إلى المزوّدين المضمّنين الذين يسجلون مزوّد نص واحدًا فقط مع مصادقة
    بمفتاح API إضافة إلى وقت تشغيل واحد مدعوم بكتالوج، فضّل مساعد
    `defineSingleProviderPluginEntry(...)` الأضيق نطاقًا:

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

    `buildProvider` هو مسار الكتالوج المباشر المستخدم عندما يستطيع OpenClaw
    حل مصادقة مزوّد حقيقية. يمكنه تنفيذ اكتشاف خاص بالمزوّد. استخدم
    `buildStaticProvider` فقط للصفوف غير المتصلة الآمنة للعرض قبل تهيئة
    المصادقة؛ يجب ألا يتطلب بيانات اعتماد أو يجري طلبات شبكة.
    ينفّذ عرض `models list --all` في OpenClaw حاليًا الكتالوجات الثابتة
    فقط لـ Plugins المزوّدين المضمّنين، مع إعداد فارغ، وبيئة فارغة، ومن دون
    مسارات وكيل/مساحة عمل.

    إذا كان تدفق المصادقة لديك يحتاج أيضًا إلى تعديل `models.providers.*`،
    والبدائل، والنموذج الافتراضي للوكيل أثناء الإعداد، فاستخدم مساعدات الإعداد
    المسبق من `openclaw/plugin-sdk/provider-onboard`. أضيق المساعدات نطاقًا هي
    `createDefaultModelPresetAppliers(...)`،
    و`createDefaultModelsPresetAppliers(...)`، و
    `createModelCatalogPresetAppliers(...)`.

    عندما تدعم نقطة النهاية الأصلية لمزوّد كتل استخدام مبثوثة عبر نقل
    `openai-completions` العادي، فضّل مساعدات الكتالوج المشتركة في
    `openclaw/plugin-sdk/provider-catalog-shared` بدلًا من ترميز فحوصات
    معرّفات المزوّدين بشكل ثابت. تكتشف `supportsNativeStreamingUsageCompat(...)`
    و`applyProviderNativeStreamingUsageCompat(...)` الدعم من خريطة قدرات
    نقطة النهاية، لذلك تظل نقاط النهاية الأصلية بأسلوب Moonshot/DashScope
    مشتركة حتى عندما يستخدم Plugin معرّف مزوّد مخصصًا.

  </Step>

  <Step title="Add dynamic model resolution">
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

    إذا كان الحل يتطلب استدعاء شبكة، فاستخدم `prepareDynamicModel` للتهيئة
    غير المتزامنة - يعمل `resolveDynamicModel` مرة أخرى بعد اكتمالها.

  </Step>

  <Step title="Add runtime hooks (as needed)">
    يحتاج معظم المزوّدين فقط إلى `catalog` + `resolveDynamicModel`. أضف
    الخطافات تدريجيًا حسب ما يتطلبه مزوّدك.

    تغطي بُناة المساعدات المشتركة الآن أكثر عائلات إعادة التشغيل/توافق الأدوات
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

    عائلات إعادة التشغيل المتاحة اليوم:

    | العائلة | ما الذي توصله | أمثلة مضمنة |
    | --- | --- | --- |
    | `openai-compatible` | سياسة إعادة تشغيل مشتركة بأسلوب OpenAI للنواقل المتوافقة مع OpenAI، بما في ذلك تنظيف معرّفات استدعاءات الأدوات، وإصلاحات ترتيب المساعد أولاً، والتحقق العام من أدوار Gemini حيث يحتاج النقل إلى ذلك | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | سياسة إعادة تشغيل مدركة لـ Claude تُختار بواسطة `modelId`، بحيث لا تحصل نواقل رسائل Anthropic إلا على تنظيف كتل التفكير الخاصة بـ Claude عندما يكون النموذج المحسوم معرّف Claude فعلاً | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | سياسة إعادة تشغيل Gemini الأصلية، بالإضافة إلى تنظيف إعادة تشغيل التمهيد ووضع إخراج التفكير الموسوم | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | تنظيف توقيع التفكير في Gemini لنماذج Gemini العاملة عبر نواقل وكيل متوافقة مع OpenAI؛ لا يفعّل تحقق إعادة التشغيل الأصلي لـ Gemini أو إعادة كتابة التمهيد | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | سياسة هجينة لموفري الخدمة الذين يمزجون أسطح نماذج رسائل Anthropic والنماذج المتوافقة مع OpenAI في Plugin واحد؛ يظل إسقاط كتل التفكير الاختياري الخاص بـ Claude محصوراً في جانب Anthropic | `minimax` |

    عائلات التدفق المتاحة اليوم:

    | العائلة | ما الذي توصله | أمثلة مضمنة |
    | --- | --- | --- |
    | `google-thinking` | تطبيع حمولة تفكير Gemini على مسار التدفق المشترك | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | غلاف استدلال Kilo على مسار تدفق الوكيل المشترك، مع تخطي `kilo/auto` ومعرّفات استدلال الوكيل غير المدعومة للتفكير المحقون | `kilocode` |
    | `moonshot-thinking` | ربط حمولة التفكير الأصلي الثنائية في Moonshot من الإعداد + مستوى `/think` | `moonshot` |
    | `minimax-fast-mode` | إعادة كتابة نموذج الوضع السريع في MiniMax على مسار التدفق المشترك | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | أغلفة Responses الأصلية المشتركة لـ OpenAI/Codex: ترويسات الإسناد، و`/fast`/`serviceTier`، وإسهاب النص، وبحث الويب الأصلي في Codex، وتشكيل حمولة توافق الاستدلال، وإدارة سياق Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | غلاف استدلال OpenRouter لمسارات الوكيل، مع معالجة مركزية لتخطي النموذج غير المدعوم/`auto` | `openrouter` |
    | `tool-stream-default-on` | غلاف `tool_stream` المفعّل افتراضياً لموفري الخدمة مثل Z.AI الذين يريدون تدفق الأدوات ما لم يُعطّل صراحةً | `zai` |

    <Accordion title="SDK seams powering the family builders">
      يتكون كل منشئ عائلة من مساعدين عامين أدنى مستوى مُصدّرين من الحزمة نفسها، ويمكنك استخدامها عندما يحتاج موفر الخدمة إلى الخروج عن النمط الشائع:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily` و`buildProviderReplayFamilyHooks(...)` ومنشئو إعادة التشغيل الخام (`buildOpenAICompatibleReplayPolicy` و`buildAnthropicReplayPolicyForModel` و`buildGoogleGeminiReplayPolicy` و`buildHybridAnthropicOrOpenAIReplayPolicy`). يصدّر أيضاً مساعدي إعادة تشغيل Gemini (`sanitizeGoogleGeminiReplayHistory` و`resolveTaggedReasoningOutputMode`) ومساعدي نقطة النهاية/النموذج (`resolveProviderEndpoint` و`normalizeProviderId` و`normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily` و`buildProviderStreamFamilyHooks(...)` و`composeProviderStreamWrappers(...)`، بالإضافة إلى أغلفة OpenAI/Codex المشتركة (`createOpenAIAttributionHeadersWrapper` و`createOpenAIFastModeWrapper` و`createOpenAIServiceTierWrapper` و`createOpenAIResponsesContextManagementWrapper` و`createCodexNativeWebSearchWrapper`)، وغلاف DeepSeek V4 المتوافق مع OpenAI (`createDeepSeekV4OpenAICompatibleThinkingWrapper`)، وتنظيف الملء المسبق لتفكير Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`)، وأغلفة الوكيل/موفر الخدمة المشتركة (`createOpenRouterWrapper` و`createToolStreamWrapper` و`createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily` و`buildProviderToolCompatFamilyHooks("gemini")` ومساعدو مخططات Gemini الأساسيون (`normalizeGeminiToolSchemas` و`inspectGeminiToolSchemas`).

      تبقى بعض مساعدات التدفق محلية لدى موفر الخدمة عمداً. تحتفظ `@openclaw/anthropic-provider` بكل من `wrapAnthropicProviderStream` و`resolveAnthropicBetas` و`resolveAnthropicFastMode` و`resolveAnthropicServiceTier` ومنشئي أغلفة Anthropic الأدنى مستوى في seam العامة الخاصة بها `api.ts` / `contract-api.ts` لأنها ترمز معالجة Claude OAuth beta وبوابة `context1m`. وبالمثل، يحتفظ Plugin xAI بتشكيل Responses الأصلي الخاص بـ xAI في `wrapStreamFn` الخاص به (الأسماء المستعارة لـ `/fast`، و`tool_stream` الافتراضي، وتنظيف الأدوات الصارمة غير المدعومة، وإزالة حمولة الاستدلال الخاصة بـ xAI).

      يدعم نمط جذر الحزمة نفسه أيضاً `@openclaw/openai-provider` (منشئي موفر الخدمة، ومساعدي النموذج الافتراضي، ومنشئي موفر الخدمة الفوري) و`@openclaw/openrouter-provider` (منشئ موفر الخدمة بالإضافة إلى مساعدي الإعداد/التهيئة).
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        لموفري الخدمة الذين يحتاجون إلى تبادل رمز قبل كل استدعاء استدلال:

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
        لموفري الخدمة الذين يحتاجون إلى ترويسات طلب مخصصة أو تعديلات على المتن:

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
        لموفري الخدمة الذين يحتاجون إلى ترويسات أو بيانات وصفية أصلية للطلب/الجلسة على
        نواقل HTTP أو WebSocket العامة:

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
        لموفري الخدمة الذين يعرضون بيانات الاستخدام/الفوترة:

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
      يستدعي OpenClaw الخطاطيف بهذا الترتيب. يستخدم معظم موفري الخدمة 2-3 فقط:
      حقول موفر الخدمة الخاصة بالتوافق فقط، التي لم يعد OpenClaw يستدعيها، مثل
      `ProviderPlugin.capabilities` و`suppressBuiltInModel`، غير مدرجة
      هنا.

      | # | الخطاف | متى تستخدمه |
      | --- | --- | --- |
      | 1 | `catalog` | كتالوج النماذج أو افتراضيات عنوان URL الأساسي |
      | 2 | `applyConfigDefaults` | الافتراضات العامة المملوكة لموفر الخدمة أثناء تجسيد الإعداد |
      | 3 | `normalizeModelId` | تنظيف الأسماء المستعارة القديمة/المعاينة لمعرّف النموذج قبل البحث |
      | 4 | `normalizeTransport` | تنظيف `api` / `baseUrl` لعائلة موفر الخدمة قبل تجميع النموذج العام |
      | 5 | `normalizeConfig` | تطبيع إعداد `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | إعادة كتابة توافق استخدام التدفق الأصلي لموفري الإعدادات |
      | 7 | `resolveConfigApiKey` | حل المصادقة بعلامة البيئة المملوك لموفر الخدمة |
      | 8 | `resolveSyntheticAuth` | مصادقة تركيبية محلية/مستضافة ذاتياً أو مدعومة بالإعداد |
      | 9 | `shouldDeferSyntheticProfileAuth` | تخفيض العناصر النائبة للملف الشخصي التركيبي المخزن خلف مصادقة البيئة/الإعداد |
      | 10 | `resolveDynamicModel` | قبول معرّفات نماذج المنبع العشوائية |
      | 11 | `prepareDynamicModel` | جلب بيانات وصفية غير متزامن قبل الحل |
      | 12 | `normalizeResolvedModel` | إعادة كتابة النقل قبل المشغّل |
      | 13 | `contributeResolvedModelCompat` | أعلام التوافق لنماذج المورّد خلف نقل متوافق آخر |
      | 14 | `normalizeToolSchemas` | تنظيف مخطط الأدوات المملوك لموفر الخدمة قبل التسجيل |
      | 15 | `inspectToolSchemas` | تشخيصات مخطط الأدوات المملوكة لموفر الخدمة |
      | 16 | `resolveReasoningOutputMode` | عقد إخراج الاستدلال الموسوم مقابل الأصلي |
      | 17 | `prepareExtraParams` | معاملات الطلب الافتراضية |
      | 18 | `createStreamFn` | نقل StreamFn مخصص بالكامل |
      | 19 | `wrapStreamFn` | أغلفة ترويسات/متن مخصصة على مسار التدفق العادي |
      | 20 | `resolveTransportTurnState` | ترويسات/بيانات وصفية أصلية لكل دور |
      | 21 | `resolveWebSocketSessionPolicy` | ترويسات/فترة تهدئة جلسة WS أصلية |
      | 22 | `formatApiKey` | شكل رمز تشغيل مخصص |
      | 23 | `refreshOAuth` | تحديث OAuth مخصص |
      | 24 | `buildAuthDoctorHint` | إرشادات إصلاح المصادقة |
      | 25 | `matchesContextOverflowError` | اكتشاف تجاوز السعة المملوك لموفر الخدمة |
      | 26 | `classifyFailoverReason` | تصنيف حد المعدل/الحمل الزائد المملوك لموفر الخدمة |
      | 27 | `isCacheTtlEligible` | بوابة TTL لذاكرة التخزين المؤقت للموجه |
      | 28 | `buildMissingAuthMessage` | تلميح مخصص للمصادقة المفقودة |
      | 29 | `augmentModelCatalog` | صفوف توافق أمامية تركيبية |
      | 30 | `resolveThinkingProfile` | مجموعة خيارات `/think` الخاصة بالنموذج |
      | 31 | `isBinaryThinking` | توافق تشغيل/إيقاف التفكير الثنائي |
      | 32 | `supportsXHighThinking` | توافق دعم استدلال `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | توافق سياسة `/think` الافتراضية |
      | 34 | `isModernModelRef` | مطابقة نموذج مباشرة/دخانية |
      | 35 | `prepareRuntimeAuth` | تبادل الرمز قبل الاستدلال |
      | 36 | `resolveUsageAuth` | تحليل بيانات اعتماد الاستخدام المخصصة |
      | 37 | `fetchUsageSnapshot` | نقطة نهاية استخدام مخصصة |
      | 38 | `createEmbeddingProvider` | محول تضمين مملوك لموفر الخدمة للذاكرة/البحث |
      | 39 | `buildReplayPolicy` | سياسة مخصصة لإعادة تشغيل/Compaction النص |
      | 40 | `sanitizeReplayHistory` | إعادة كتابة إعادة التشغيل الخاصة بموفر الخدمة بعد التنظيف العام |
      | 41 | `validateReplayTurns` | تحقق صارم من أدوار إعادة التشغيل قبل المشغّل المضمن |
      | 42 | `onModelSelected` | استدعاء لاحق للاختيار (مثل القياسات عن بُعد) |

      ملاحظات الرجوع الاحتياطي في وقت التشغيل:

      - يتحقق `normalizeConfig` من موفر الخدمة المطابق أولاً، ثم من إضافات موفري الخدمة الأخرى القادرة على الخطافات إلى أن يغير أحدها الإعداد فعلياً. إذا لم يُعد أي خطاف موفر خدمة كتابة إدخال إعداد مدعوم لعائلة Google، فسيظل مطبّع إعدادات Google المضمن مطبقاً.
      - يستخدم `resolveConfigApiKey` خطاف موفر الخدمة عندما يكون مكشوفاً. كما يحتوي مسار `amazon-bedrock` المضمن على حال مدمج لعلامات بيئة AWS هنا، رغم أن مصادقة تشغيل Bedrock نفسها لا تزال تستخدم السلسلة الافتراضية لـ AWS SDK.
      - يتيح `resolveSystemPromptContribution` لموفر الخدمة حقن إرشادات موجه نظام مدركة لذاكرة التخزين المؤقت لعائلة نموذج. فضّله على `before_prompt_build` عندما يخص السلوك عائلة موفر/نموذج واحدة وينبغي أن يحافظ على تقسيم ذاكرة التخزين المؤقت المستقر/الديناميكي.

      للاطلاع على أوصاف مفصلة وأمثلة من الواقع، راجع [العناصر الداخلية: خطاطيف تشغيل موفر الخدمة](/ar/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Add extra capabilities (optional)">
    ### الخطوة 5: أضف قدرات إضافية

    يمكن لـ Plugin مزود تسجيل الكلام، والنسخ الفوري، والصوت الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب،
    والبحث في الويب إلى جانب استدلال النص. يصنّف OpenClaw ذلك باعتباره
    Plugin ذا **قدرات هجينة** - وهو النمط الموصى به لـ Plugins الشركات
    (Plugin واحد لكل مورّد). راجع
    [داخليًا: ملكية القدرات](/ar/plugins/architecture#capability-ownership-model).

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

        استخدم `assertOkOrThrowProviderError(...)` لإخفاقات HTTP الخاصة بالمزود كي
        تشارك Plugins قراءات جسم الخطأ المحدودة، وتحليل أخطاء JSON، ولاحقات
        معرّف الطلب.
      </Tab>
      <Tab title="Realtime transcription">
        فضّل `createRealtimeTranscriptionWebSocketSession(...)` - يتولى المساعد المشترك
        التقاط الوكيل، وتراجع إعادة الاتصال، وتفريغ الإغلاق، ومصافحات الجاهزية،
        ووضع الصوت في الطابور، وتشخيصات أحداث الإغلاق. لا يحتاج Plugin الخاص بك
        إلا إلى ربط أحداث المصدر العلوي.

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

        يجب على مزودي STT الدُفعيين الذين يرسلون صوتًا متعدد الأجزاء عبر POST استخدام
        `buildAudioTranscriptionFormData(...)` من
        `openclaw/plugin-sdk/provider-http`. يطبّع المساعد أسماء ملفات الرفع،
        بما في ذلك ملفات AAC المرفوعة التي تحتاج إلى اسم ملف بنمط M4A من أجل
        واجهات API النسخ المتوافقة.
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

        أعلن `capabilities` كي يتمكن `talk.catalog` من عرض الأوضاع الصالحة،
        ووسائل النقل، وتنسيقات الصوت، ورايات الميزات لعملاء Talk في المتصفح
        والعملاء الأصليين. نفّذ `handleBargeIn` عندما تستطيع وسيلة النقل اكتشاف
        أن إنسانًا يقاطع تشغيل المساعد وأن المزود يدعم اقتطاع استجابة الصوت النشطة
        أو مسحها.
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
        تستخدم قدرات الفيديو شكلاً **مدركًا للوضع**: `generate`،
        و`imageToVideo`، و`videoToVideo`. لا تكفي الحقول التجميعية المسطحة مثل
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` للإعلان
        بوضوح عن دعم وضع التحويل أو الأوضاع المعطّلة. يتبع توليد الموسيقى النمط
        نفسه مع كتل `generate` / `edit` الصريحة.

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

تنشر Plugins المزود بالطريقة نفسها مثل أي Plugin كود خارجي آخر:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

لا تستخدم الاسم المستعار القديم المخصص لنشر Skills فقط هنا؛ يجب أن تستخدم حزم Plugin
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

يتحكم `catalog.order` في وقت دمج الكتالوج الخاص بك بالنسبة إلى
المزودين المضمّنين:

| الترتيب | متى | حالة الاستخدام |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | المرور الأول | مزودو مفاتيح API البسيطة |
| `profile` | بعد simple | مزودون مشروطون بملفات تعريف المصادقة |
| `paired`  | بعد profile | تركيب عدة إدخالات مرتبطة |
| `late`    | المرور الأخير | تجاوز المزودين الحاليين (يفوز عند التصادم) |

## الخطوات التالية

- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) - إذا كان Plugin الخاص بك يوفّر قناة أيضًا
- [وقت تشغيل SDK](/ar/plugins/sdk-runtime) - مساعدات `api.runtime` ‏(TTS، البحث، الوكيل الفرعي)
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) - مرجع استيراد المسارات الفرعية الكامل
- [داخليات Plugin](/ar/plugins/architecture-internals#provider-runtime-hooks) - تفاصيل الخطافات وأمثلة مضمّنة

## ذات صلة

- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء Plugins](/ar/plugins/building-plugins)
- [بناء Plugins القنوات](/ar/plugins/sdk-channel-plugins)
