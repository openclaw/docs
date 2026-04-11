---
read_when:
    - أنت تنشئ plugin جديدة لموفر نماذج
    - أنت تريد إضافة وكيل متوافق مع OpenAI أو LLM مخصص إلى OpenClaw
    - أنت بحاجة إلى فهم مصادقة الموفر وكتالوجات النماذج وخطافات وقت التشغيل
sidebarTitle: Provider Plugins
summary: دليل خطوة بخطوة لإنشاء plugin لموفر نماذج لـ OpenClaw
title: إنشاء Provider Plugins
x-i18n:
    generated_at: "2026-04-11T02:47:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06d7c5da6556dc3d9673a31142ff65eb67ddc97fc0c1a6f4826a2c7693ecd5e3
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# إنشاء Provider Plugins

يأخذك هذا الدليل خطوة بخطوة عبر إنشاء plugin لموفر نماذج تضيف موفر نماذج
(LLM) إلى OpenClaw. وبنهاية الدليل سيكون لديك موفر يحتوي على كتالوج نماذج،
ومصادقة بمفتاح API، وتحليل ديناميكي للنماذج.

<Info>
  إذا لم تكن قد أنشأت أي plugin لـ OpenClaw من قبل، فاقرأ
  [البدء](/ar/plugins/building-plugins) أولًا للتعرّف على البنية الأساسية
  للحزمة وإعداد manifest.
</Info>

<Tip>
  تضيف Provider Plugins نماذج إلى حلقة الاستدلال العادية في OpenClaw. إذا كان
  يجب تشغيل النموذج عبر daemon وكيل أصلي يملك سلاسل الرسائل أو الضغط أو أحداث
  الأدوات، فأقرن الموفر مع [agent harness](/ar/plugins/sdk-agent-harness) بدلًا
  من وضع تفاصيل بروتوكول daemon داخل core.
</Tip>

## الشرح خطوة بخطوة

<Steps>
  <a id="step-1-package-and-manifest"></a>
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
      "description": "موفر نماذج Acme AI",
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

    يصرّح manifest بالحقل `providerAuthEnvVars` حتى يتمكن OpenClaw من اكتشاف
    بيانات الاعتماد من دون تحميل وقت تشغيل plugin الخاصة بك. أضف
    `providerAuthAliases` عندما ينبغي لمتغير من الموفر أن يعيد استخدام مصادقة
    معرّف موفر آخر. الحقل `modelSupport` اختياري، ويتيح لـ OpenClaw تحميل
    provider plugin الخاصة بك تلقائيًا من معرّفات نماذج مختصرة مثل `acme-large`
    قبل وجود خطافات وقت التشغيل. إذا نشرت الموفر على ClawHub، فإن حقول
    `openclaw.compat` و`openclaw.build` هذه مطلوبة في `package.json`.

  </Step>

  <Step title="تسجيل الموفر">
    يحتاج الموفر الأدنى إلى `id` و`label` و`auth` و`catalog`:

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

    هذا موفر يعمل بالفعل. يمكن للمستخدمين الآن تنفيذ
    `openclaw onboard --acme-ai-api-key <key>` واختيار
    `acme-ai/acme-large` كنموذج لهم.

    إذا كان الموفر المصدر يستخدم رموز تحكم تختلف عن OpenClaw، فأضف
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

    يعيد `input` كتابة مطالبة النظام النهائية ومحتوى الرسالة النصية قبل
    النقل. ويعيد `output` كتابة دلتا نص المساعد والنص النهائي قبل أن يحلل
    OpenClaw علامات التحكم الخاصة به أو قبل التسليم عبر القنوات.

    بالنسبة إلى الموفرين المضمّنين الذين يسجلون موفرًا نصيًا واحدًا فقط مع
    مصادقة بمفتاح API بالإضافة إلى وقت تشغيل واحد مدعوم بكتالوج، ففضّل
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
        },
      },
    });
    ```

    إذا كان تدفق المصادقة لديك يحتاج أيضًا إلى تصحيح
    `models.providers.*` والأسماء المستعارة والنموذج الافتراضي للوكيل أثناء
    onboard، فاستخدم مساعدات preset الجاهزة من
    `openclaw/plugin-sdk/provider-onboard`. أضيق هذه المساعدات هي
    `createDefaultModelPresetAppliers(...)`،
    و`createDefaultModelsPresetAppliers(...)`، و
    `createModelCatalogPresetAppliers(...)`.

    عندما تدعم نقطة النهاية الأصلية للموفر كتل الاستخدام المتدفقة على نقل
    `openai-completions` العادي، ففضّل مساعدات الكتالوج المشتركة في
    `openclaw/plugin-sdk/provider-catalog-shared` بدلًا من كتابة عمليات تحقق
    خاصة بمعرّف الموفر. يقوم
    `supportsNativeStreamingUsageCompat(...)` و
    `applyProviderNativeStreamingUsageCompat(...)` باكتشاف الدعم من خريطة
    إمكانات نقطة النهاية، بحيث تتمكن نقاط النهاية الأصلية على نمط
    Moonshot/DashScope من الاشتراك حتى عندما تستخدم plugin معرّف موفر مخصصًا.

  </Step>

  <Step title="إضافة تحليل ديناميكي للنماذج">
    إذا كان موفرك يقبل معرّفات نماذج عشوائية (مثل proxy أو router)،
    فأضف `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id وlabel وauth وcatalog من الأعلى

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

    إذا كان التحليل يتطلب استدعاءً شبكيًا، فاستخدم `prepareDynamicModel`
    للإحماء غير المتزامن — ويتم تشغيل `resolveDynamicModel` مرة أخرى بعد
    اكتماله.

  </Step>

  <Step title="إضافة خطافات وقت التشغيل (عند الحاجة)">
    تحتاج معظم الموفرات فقط إلى `catalog` و`resolveDynamicModel`. أضف
    الخطافات تدريجيًا بحسب ما يتطلبه موفرك.

    تغطي أدوات البناء المساعدة المشتركة الآن أكثر عائلات إعادة التشغيل/
    توافق الأدوات شيوعًا، لذلك لا تحتاج plugins عادةً إلى توصيل كل خطاف
    يدويًا واحدًا تلو الآخر:

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

    | العائلة | ما الذي تقوم بتوصيله |
    | --- | --- |
    | `openai-compatible` | سياسة إعادة تشغيل مشتركة بنمط OpenAI لوسائط النقل المتوافقة مع OpenAI، بما في ذلك تنظيف `tool-call-id`، وإصلاحات ترتيب المساعد أولًا، والتحقق العام من أدوار Gemini حيث يحتاجه النقل |
    | `anthropic-by-model` | سياسة إعادة تشغيل مدركة لـ Claude تُختار بواسطة `modelId`، بحيث لا تحصل وسائط نقل رسائل Anthropic على تنظيف كتل الاستدلال الخاصة بـ Claude إلا عندما يكون النموذج المحلل فعليًا معرّف Claude |
    | `google-gemini` | سياسة إعادة تشغيل Gemini الأصلية بالإضافة إلى تنظيف إعادة تشغيل bootstrap ووضع مخرجات الاستدلال الموسومة |
    | `passthrough-gemini` | تنظيف thought-signature لنماذج Gemini التي تعمل عبر وسائط نقل proxy متوافقة مع OpenAI؛ ولا يفعّل التحقق الأصلي من إعادة تشغيل Gemini أو إعادة كتابة bootstrap |
    | `hybrid-anthropic-openai` | سياسة هجينة للموفرين الذين يخلطون بين أسطح نماذج رسائل Anthropic والأسطح المتوافقة مع OpenAI داخل plugin واحدة؛ ويظل إسقاط كتل الاستدلال الاختياري الخاصة بـ Claude محصورًا بجانب Anthropic |

    أمثلة مضمّنة فعلية:

    - `google` و`google-gemini-cli`: ‏`google-gemini`
    - `openrouter` و`kilocode` و`opencode` و`opencode-go`: ‏`passthrough-gemini`
    - `amazon-bedrock` و`anthropic-vertex`: ‏`anthropic-by-model`
    - `minimax`: ‏`hybrid-anthropic-openai`
    - `moonshot` و`ollama` و`xai` و`zai`: ‏`openai-compatible`

    عائلات البث المتاحة حاليًا:

    | العائلة | ما الذي تقوم بتوصيله |
    | --- | --- |
    | `google-thinking` | تطبيع حمولة الاستدلال في Gemini على مسار البث المشترك |
    | `kilocode-thinking` | غلاف استدلال Kilo على مسار بث proxy المشترك، مع تخطي `kilo/auto` ومعرّفات استدلال proxy غير المدعومة لحقن الاستدلال |
    | `moonshot-thinking` | تعيين حمولة الاستدلال الأصلية الثنائية في Moonshot انطلاقًا من الإعدادات ومستوى `/think` |
    | `minimax-fast-mode` | إعادة كتابة نموذج MiniMax في الوضع السريع على مسار البث المشترك |
    | `openai-responses-defaults` | أغلفة OpenAI/Codex Responses الأصلية المشتركة: رؤوس الإسناد، و`/fast`/`serviceTier`، ودرجة إسهاب النص، والبحث الأصلي على الويب في Codex، وتشكيل حمولة توافق الاستدلال، وإدارة السياق في Responses |
    | `openrouter-thinking` | غلاف استدلال OpenRouter لمسارات proxy، مع التعامل مركزيًا مع تخطي النماذج غير المدعومة/`auto` |
    | `tool-stream-default-on` | غلاف `tool_stream` مفعّل افتراضيًا لموفرين مثل Z.AI الذين يريدون بث الأدوات ما لم يتم تعطيله صراحةً |

    أمثلة مضمّنة فعلية:

    - `google` و`google-gemini-cli`: ‏`google-thinking`
    - `kilocode`: ‏`kilocode-thinking`
    - `moonshot`: ‏`moonshot-thinking`
    - `minimax` و`minimax-portal`: ‏`minimax-fast-mode`
    - `openai` و`openai-codex`: ‏`openai-responses-defaults`
    - `openrouter`: ‏`openrouter-thinking`
    - `zai`: ‏`tool-stream-default-on`

    يصدّر `openclaw/plugin-sdk/provider-model-shared` أيضًا تعداد
    عائلات إعادة التشغيل بالإضافة إلى المساعدات المشتركة التي تُبنى منها هذه
    العائلات. وتشمل التصديرات العامة الشائعة:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - أدوات بناء إعادة التشغيل المشتركة مثل `buildOpenAICompatibleReplayPolicy(...)`،
      و`buildAnthropicReplayPolicyForModel(...)`،
      و`buildGoogleGeminiReplayPolicy(...)`، و
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - مساعدات إعادة تشغيل Gemini مثل `sanitizeGoogleGeminiReplayHistory(...)`
      و`resolveTaggedReasoningOutputMode()`
    - مساعدات نقطة النهاية/النموذج مثل `resolveProviderEndpoint(...)`،
      و`normalizeProviderId(...)`، و`normalizeGooglePreviewModelId(...)`، و
      `normalizeNativeXaiModelId(...)`

    يوفّر `openclaw/plugin-sdk/provider-stream` أداة بناء العائلة
    العامة ومساعدات الأغلفة العامة التي تعيد هذه العائلات استخدامها. وتشمل
    التصديرات العامة الشائعة:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - أغلفة OpenAI/Codex المشتركة مثل
      `createOpenAIAttributionHeadersWrapper(...)`،
      و`createOpenAIFastModeWrapper(...)`،
      و`createOpenAIServiceTierWrapper(...)`،
      و`createOpenAIResponsesContextManagementWrapper(...)`، و
      `createCodexNativeWebSearchWrapper(...)`
    - أغلفة proxy/الموفر المشتركة مثل `createOpenRouterWrapper(...)`،
      و`createToolStreamWrapper(...)`، و`createMinimaxFastModeWrapper(...)`

    تظل بعض مساعدات البث محلية على مستوى الموفر عن قصد. المثال المضمّن
    الحالي: يصدّر `@openclaw/anthropic-provider`
    الدوال `wrapAnthropicProviderStream` و`resolveAnthropicBetas`،
    و`resolveAnthropicFastMode`، و`resolveAnthropicServiceTier`،
    وأدوات بناء أغلفة Anthropic منخفضة المستوى من نقطة الفصل العامة `api.ts` /
    `contract-api.ts`. وتبقى هذه المساعدات خاصة بـ Anthropic لأنها
    ترمّز أيضًا معالجة Claude OAuth beta وبوابات `context1m`.

    تحتفظ موفرات مضمّنة أخرى أيضًا بأغلفة خاصة بالنقل محليًا عندما لا يكون
    السلوك قابلاً للمشاركة بشكل نظيف بين العائلات. المثال الحالي: تحتفظ
    plugin ‏xAI المضمّنة بتشكيل xAI Responses الأصلية داخل
    `wrapStreamFn` الخاصة بها، بما في ذلك إعادة كتابة الأسماء المستعارة لـ `/fast`،
    و`tool_stream` الافتراضي، وتنظيف الأدوات الصارمة غير المدعومة، وإزالة
    حمولة الاستدلال الخاصة بـ xAI.

    يوفّر `openclaw/plugin-sdk/provider-tools` حاليًا عائلة مشتركة
    واحدة لمخططات الأدوات، إلى جانب مساعدات المخطط/التوافق المشتركة:

    - توثّق `ProviderToolCompatFamily` جرد العائلات المشتركة المتاح اليوم.
    - تقوم `buildProviderToolCompatFamilyHooks("gemini")` بتوصيل
      تنظيف مخطط Gemini والتشخيصات للموفرين الذين يحتاجون إلى مخططات أدوات
      آمنة لـ Gemini.
    - تمثل `normalizeGeminiToolSchemas(...)` و`inspectGeminiToolSchemas(...)`
      مساعدات مخطط Gemini العامة الأساسية.
    - تعيد `resolveXaiModelCompatPatch()` تصحيح التوافق المضمّن لـ xAI:
      `toolSchemaProfile: "xai"`، والكلمات المفتاحية غير المدعومة في
      المخطط، ودعم `web_search` الأصلي، وفك ترميز وسائط استدعاء الأدوات من
      HTML entity.
    - تطبق `applyXaiModelCompat(model)` تصحيح توافق xAI نفسه على
      نموذج محلول قبل أن يصل إلى المنفّذ.

    مثال مضمّن فعلي: تستخدم plugin ‏xAI كلًا من `normalizeResolvedModel` و
    `contributeResolvedModelCompat` للحفاظ على امتلاك الموفر لبيانات
    التوافق الوصفية هذه بدلًا من ترميز قواعد xAI داخل core.

    ويدعم نمط جذر الحزمة نفسه أيضًا موفرات مضمّنة أخرى:

    - `@openclaw/openai-provider`: يصدّر `api.ts` أدوات بناء الموفر،
      ومساعدات النموذج الافتراضي، وأدوات بناء موفرات realtime
    - `@openclaw/openrouter-provider`: يصدّر `api.ts` أداة بناء الموفر
      بالإضافة إلى مساعدات onboarding/الإعدادات

    <Tabs>
      <Tab title="تبادل الرموز">
        بالنسبة إلى الموفرين الذين يحتاجون إلى تبادل رمز قبل كل استدعاء استدلال:

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
        بالنسبة إلى الموفرين الذين يحتاجون إلى رؤوس طلبات مخصصة أو تعديلات على جسم الطلب:

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
        بالنسبة إلى الموفرين الذين يحتاجون إلى رؤوس أو بيانات وصفية أصلية للطلب/الجلسة
        على وسائل نقل HTTP أو WebSocket العامة:

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
        بالنسبة إلى الموفرين الذين يوفّرون بيانات الاستخدام/الفوترة:

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

    <Accordion title="جميع خطافات الموفر المتاحة">
      يستدعي OpenClaw الخطافات بهذا الترتيب. معظم الموفرين يستخدمون 2-3 فقط:

      | # | الخطاف | متى يُستخدم |
      | --- | --- | --- |
      | 1 | `catalog` | كتالوج النماذج أو القيم الافتراضية لـ base URL |
      | 2 | `applyConfigDefaults` | القيم الافتراضية العامة المملوكة للموفر أثناء materialization للإعدادات |
      | 3 | `normalizeModelId` | تنظيف الأسماء المستعارة القديمة/التجريبية لمعرّف النموذج قبل البحث |
      | 4 | `normalizeTransport` | تنظيف `api` / `baseUrl` لعائلة الموفر قبل تجميع النموذج العام |
      | 5 | `normalizeConfig` | تطبيع إعدادات `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | إعادة كتابة توافق الاستخدام الأصلي المتدفق لموفري الإعدادات |
      | 7 | `resolveConfigApiKey` | تحليل مصادقة env-marker المملوك للموفر |
      | 8 | `resolveSyntheticAuth` | مصادقة اصطناعية محلية/مستضافة ذاتيًا أو معتمدة على الإعدادات |
      | 9 | `shouldDeferSyntheticProfileAuth` | خفض أولوية العناصر النائبة الاصطناعية المخزنة للملف الشخصي خلف مصادقة env/config |
      | 10 | `resolveDynamicModel` | قبول معرّفات نماذج عشوائية من المصدر |
      | 11 | `prepareDynamicModel` | جلب بيانات وصفية غير متزامن قبل التحليل |
      | 12 | `normalizeResolvedModel` | إعادة كتابة النقل قبل المنفّذ |

    ملاحظات حول الرجوع الاحتياطي في وقت التشغيل:

    - يتحقق `normalizeConfig` من الموفر المطابق أولًا، ثم من provider plugins
      الأخرى القادرة على الخطافات إلى أن تغيّر إحداها الإعدادات فعلًا.
      وإذا لم تعِد أي خطافات موفر كتابة إدخال إعدادات مدعومًا من عائلة Google،
      فسيستمر تطبيق مطبّع إعدادات Google المضمّن.
    - تستخدم `resolveConfigApiKey` خطاف الموفر عندما يكون مكشوفًا. كما أن
      المسار المضمّن `amazon-bedrock` يملك هنا أيضًا محلل AWS env-marker
      مضمّنًا، رغم أن مصادقة وقت تشغيل Bedrock نفسها ما تزال تستخدم
      سلسلة AWS SDK الافتراضية.
      | 13 | `contributeResolvedModelCompat` | أعلام التوافق لنماذج المورّد خلف نقل متوافق آخر |
      | 14 | `capabilities` | حقيبة إمكانات ثابتة قديمة؛ للتوافق فقط |
      | 15 | `normalizeToolSchemas` | تنظيف مخطط الأدوات المملوك للموفر قبل التسجيل |
      | 16 | `inspectToolSchemas` | تشخيصات مخطط الأدوات المملوكة للموفر |
      | 17 | `resolveReasoningOutputMode` | عقد مخرجات الاستدلال الموسوم مقابل الأصلي |
      | 18 | `prepareExtraParams` | معاملات الطلب الافتراضية |
      | 19 | `createStreamFn` | نقل StreamFn مخصص بالكامل |
      | 20 | `wrapStreamFn` | أغلفة رؤوس/جسم مخصصة على مسار البث العادي |
      | 21 | `resolveTransportTurnState` | رؤوس/بيانات وصفية أصلية لكل دورة |
      | 22 | `resolveWebSocketSessionPolicy` | رؤوس جلسات WS الأصلية/فترة التهدئة |
      | 23 | `formatApiKey` | شكل رمز وقت تشغيل مخصص |
      | 24 | `refreshOAuth` | تحديث OAuth مخصص |
      | 25 | `buildAuthDoctorHint` | إرشادات إصلاح المصادقة |
      | 26 | `matchesContextOverflowError` | كشف تجاوز السعة السياقية المملوك للموفر |
      | 27 | `classifyFailoverReason` | تصنيف مملوك للموفر لحدّ المعدل/الحمل الزائد |
      | 28 | `isCacheTtlEligible` | بوابة TTL لذاكرة prompt المؤقتة |
      | 29 | `buildMissingAuthMessage` | تلميح مخصص لغياب المصادقة |
      | 30 | `suppressBuiltInModel` | إخفاء الصفوف المصدرية القديمة |
      | 31 | `augmentModelCatalog` | صفوف اصطناعية للتوافق المستقبلي |
      | 32 | `isBinaryThinking` | تشغيل/إيقاف الاستدلال الثنائي |
      | 33 | `supportsXHighThinking` | دعم الاستدلال `xhigh` |
      | 34 | `resolveDefaultThinkingLevel` | سياسة `/think` الافتراضية |
      | 35 | `isModernModelRef` | مطابقة النماذج المباشرة/اختبارات smoke |
      | 36 | `prepareRuntimeAuth` | تبادل الرمز قبل الاستدلال |
      | 37 | `resolveUsageAuth` | تحليل بيانات اعتماد الاستخدام المخصص |
      | 38 | `fetchUsageSnapshot` | نقطة نهاية استخدام مخصصة |
      | 39 | `createEmbeddingProvider` | مُكيّف embeddings مملوك للموفر للذاكرة/البحث |
      | 40 | `buildReplayPolicy` | سياسة مخصصة لإعادة تشغيل/ضغط السجل النصي |
      | 41 | `sanitizeReplayHistory` | إعادة كتابة مملوكة للموفر لسجل إعادة التشغيل بعد التنظيف العام |
      | 42 | `validateReplayTurns` | تحقق صارم من أدوار إعادة التشغيل قبل المنفّذ المضمّن |
      | 43 | `onModelSelected` | استدعاء بعد الاختيار (مثلًا telemetry) |

      ملاحظة حول ضبط prompt:

      - تسمح `resolveSystemPromptContribution` للموفر بحقن إرشادات
        مطالبة نظام مدركة لذاكرة التخزين المؤقت لعائلة نماذج. فضّلها على
        `before_prompt_build` عندما يكون السلوك تابعًا لعائلة موفر/نموذج واحدة
        ويجب أن يحافظ على التقسيم المستقر/الديناميكي لذاكرة التخزين المؤقت.

      للاطلاع على أوصاف مفصلة وأمثلة من العالم الحقيقي، راجع
      [الداخليات: خطافات وقت تشغيل الموفر](/ar/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="إضافة إمكانات إضافية (اختياري)">
    <a id="step-5-add-extra-capabilities"></a>
    يمكن لـ provider plugin تسجيل موفر للكلام، والنسخ الفوري، والصوت الفوري،
    وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب،
    والبحث على الويب إلى جانب الاستدلال النصي:

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

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

      api.registerRealtimeTranscriptionProvider({
        id: "acme-ai",
        label: "Acme Realtime Transcription",
        isConfigured: () => true,
        createSession: (req) => ({
          connect: async () => {},
          sendAudio: () => {},
          close: () => {},
          isConnected: () => true,
        }),
      });

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

      api.registerMediaUnderstandingProvider({
        id: "acme-ai",
        capabilities: ["image", "audio"],
        describeImage: async (req) => ({ text: "A photo of..." }),
        transcribeAudio: async (req) => ({ text: "Transcript..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Acme Images",
        generate: async (req) => ({ /* image result */ }),
      });

      api.registerVideoGenerationProvider({
        id: "acme-ai",
        label: "Acme Video",
        capabilities: {
          generate: {
            maxVideos: 1,
            maxDurationSeconds: 10,
            supportsResolution: true,
          },
          imageToVideo: {
            enabled: true,
            maxVideos: 1,
            maxInputImages: 1,
            maxDurationSeconds: 5,
          },
          videoToVideo: {
            enabled: false,
          },
        },
        generateVideo: async (req) => ({ videos: [] }),
      });

      api.registerWebFetchProvider({
        id: "acme-ai-fetch",
        label: "Acme Fetch",
        hint: "اجلب الصفحات عبر خلفية العرض في Acme.",
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
    }
    ```

    يصنّف OpenClaw هذا على أنه plugin ذات **إمكانات هجينة**. وهذا هو
    النمط الموصى به لـ plugins الخاصة بالشركات (plugin واحدة لكل مورّد). راجع
    [الداخليات: ملكية الإمكانات](/ar/plugins/architecture#capability-ownership-model).

    بالنسبة إلى توليد الفيديو، فضّل بنية الإمكانات المدركة للأوضاع كما هو موضح أعلاه:
    `generate` و`imageToVideo` و`videoToVideo`. إن الحقول
    التجميعية المسطحة مثل `maxInputImages` و`maxInputVideos` و`maxDurationSeconds`
    لا تكفي للإعلان بوضوح عن دعم أوضاع التحويل أو الأوضاع المعطّلة.

    ينبغي لموفري توليد الموسيقى اتباع النمط نفسه:
    `generate` للتوليد المعتمد على المطالبة فقط و`edit` للتوليد
    المعتمد على الصور المرجعية. إن الحقول التجميعية المسطحة مثل `maxInputImages`،
    و`supportsLyrics`، و`supportsFormat` لا تكفي للإعلان عن دعم
    التعديل؛ إذ إن كتل `generate` / `edit` الصريحة هي العقد المتوقع.

  </Step>

  <Step title="الاختبار">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // صدّر كائن إعدادات الموفر من index.ts أو من ملف مخصص
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("يحلل النماذج الديناميكية", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("يعيد الكتالوج عند توفر المفتاح", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("يعيد كتالوجًا null عند عدم وجود مفتاح", async () => {
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

يتم نشر Provider Plugins بالطريقة نفسها مثل أي plugin خارجية أخرى للشفرة:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

لا تستخدم هنا الاسم المستعار القديم للنشر الخاص بالمهارات فقط؛ ينبغي أن تستخدم
حزم plugins الأمر `clawhub package publish`.

## بنية الملفات

```
<bundled-plugin-root>/acme-ai/
├── package.json              # بيانات openclaw.providers الوصفية
├── openclaw.plugin.json      # Manifest يتضمن بيانات مصادقة الموفر الوصفية
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # الاختبارات
    └── usage.ts              # نقطة نهاية الاستخدام (اختياري)
```

## مرجع ترتيب الكتالوج

يتحكم `catalog.order` في وقت دمج كتالوجك مقارنةً بالموفرين
المضمّنين:

| الترتيب     | متى            | حالة الاستخدام                                  |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | المرور الأول   | الموفّرون العاديون المعتمدون على مفتاح API      |
| `profile` | بعد simple    | الموفّرون المقيّدون بملفات تعريف المصادقة        |
| `paired`  | بعد profile   | توليف عدة إدخالات مترابطة                       |
| `late`    | المرور الأخير  | تجاوز الموفّرين الحاليين (يفوز عند التعارض)      |

## الخطوات التالية

- [Channel Plugins](/ar/plugins/sdk-channel-plugins) — إذا كانت plugin الخاصة بك توفّر قناة أيضًا
- [SDK Runtime](/ar/plugins/sdk-runtime) — مساعدات `api.runtime` ‏(TTS، والبحث، والوكيل الفرعي)
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — المرجع الكامل للاستيراد عبر المسارات الفرعية
- [داخليات Plugin](/ar/plugins/architecture#provider-runtime-hooks) — تفاصيل الخطافات والأمثلة المضمّنة
