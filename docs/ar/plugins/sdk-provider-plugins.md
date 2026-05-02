---
read_when:
    - أنت تنشئ Plugin جديدًا لمزوّد النماذج
    - تريد إضافة وكيل متوافق مع OpenAI أو LLM مخصص إلى OpenClaw
    - تحتاج إلى فهم مصادقة المزوّد والكتالوجات وخطافات وقت التشغيل
sidebarTitle: Provider plugins
summary: دليل خطوة بخطوة لبناء Plugin لموفّر نماذج لـ OpenClaw
title: بناء Plugins المزوّدين
x-i18n:
    generated_at: "2026-05-02T07:39:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f9d721673bdfef0b9c1979b4b8b4c86f19d114374d6b941facb928c3574cd1b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

يرشدك هذا الدليل خلال بناء provider Plugin يضيف موفر نماذج
(LLM) إلى OpenClaw. في النهاية سيكون لديك موفر يحتوي على فهرس نماذج،
ومصادقة بمفتاح API، وحل ديناميكي للنماذج.

<Info>
  إذا لم تكن قد بنيت أي OpenClaw Plugin من قبل، فاقرأ
  [البدء](/ar/plugins/building-plugins) أولاً لمعرفة بنية الحزمة الأساسية
  وإعداد البيان.
</Info>

<Tip>
  تضيف provider plugins نماذج إلى حلقة الاستدلال العادية في OpenClaw. إذا كان النموذج
  يجب أن يعمل عبر native agent daemon يملك السلاسل، أو compaction، أو أحداث الأدوات،
  فاقرن الموفر مع [agent harness](/ar/plugins/sdk-agent-harness)
  بدلاً من وضع تفاصيل بروتوكول daemon في core.
</Tip>

## شرح تفصيلي

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
    بيانات الاعتماد من دون تحميل وقت تشغيل Plugin لديك. أضف `providerAuthAliases`
    عندما ينبغي لمتغير موفر أن يعيد استخدام مصادقة معرّف موفر آخر. `modelSupport`
    اختياري، ويمكّن OpenClaw من تحميل provider Plugin تلقائياً من معرّفات
    نماذج مختصرة مثل `acme-large` قبل وجود خطافات وقت التشغيل. إذا نشرت
    الموفر على ClawHub، فحقلا `openclaw.compat` و`openclaw.build`
    مطلوبان في `package.json`.

  </Step>

  <Step title="تسجيل الموفر">
    يحتاج الموفر الأدنى إلى `id`، و`label`، و`auth`، و`catalog`:

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

    هذا موفر عامل. يمكن للمستخدمين الآن تشغيل
    `openclaw onboard --acme-ai-api-key <key>` واختيار
    `acme-ai/acme-large` كنموذج لهم.

    إذا كان الموفر upstream يستخدم رموز تحكم مختلفة عن OpenClaw، فأضف
    تحويلاً نصياً صغيراً ثنائي الاتجاه بدلاً من استبدال مسار البث:

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
    يفسر OpenClaw علامات التحكم الخاصة به أو تسليم القناة.

    بالنسبة إلى الموفرين المضمّنين الذين لا يسجلون إلا موفر نص واحداً بمصادقة
    مفتاح API مع وقت تشغيل واحد مدعوم بفهرس، فضّل المساعد الأضيق
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

    `buildProvider` هو مسار الفهرس الحي المستخدم عندما يستطيع OpenClaw حل
    مصادقة الموفر الحقيقية. قد ينفذ اكتشافاً خاصاً بالموفر. استخدم
    `buildStaticProvider` فقط للصفوف غير المتصلة الآمنة للعرض قبل ضبط المصادقة؛
    ويجب ألا يتطلب بيانات اعتماد أو يجري طلبات شبكة.
    يعرض `models list --all` في OpenClaw حالياً الفهارس الثابتة
    لموفري Plugin المضمّنين فقط، مع إعداد فارغ وبيئة فارغة ومن دون
    مسارات agent/workspace.

    إذا كان تدفق المصادقة لديك يحتاج أيضاً إلى تصحيح `models.providers.*`، والأسماء المستعارة،
    والنموذج الافتراضي للوكيل أثناء onboarding، فاستخدم مساعدات الإعداد المسبق من
    `openclaw/plugin-sdk/provider-onboard`. أضيق المساعدات هي
    `createDefaultModelPresetAppliers(...)`،
    و`createDefaultModelsPresetAppliers(...)`، و
    `createModelCatalogPresetAppliers(...)`.

    عندما تدعم نقطة النهاية الأصلية للموفر كتل استخدام مبثوثة على
    نقل `openai-completions` العادي، فضّل مساعدات الفهرس المشتركة في
    `openclaw/plugin-sdk/provider-catalog-shared` بدلاً من ترميز
    فحوصات معرّف الموفر مباشرة. يكتشف `supportsNativeStreamingUsageCompat(...)` و
    `applyProviderNativeStreamingUsageCompat(...)` الدعم من
    خريطة إمكانات نقطة النهاية، لذلك تظل نقاط النهاية الأصلية على نمط Moonshot/DashScope
    مشتركة حتى عندما يستخدم Plugin معرّف موفر مخصصاً.

  </Step>

  <Step title="إضافة حل ديناميكي للنماذج">
    إذا كان موفرك يقبل معرّفات نماذج عشوائية (مثل proxy أو router)،
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

    إذا كان الحل يتطلب طلب شبكة، فاستخدم `prepareDynamicModel` للتهيئة
    غير المتزامنة — سيعمل `resolveDynamicModel` مرة أخرى بعد اكتمالها.

  </Step>

  <Step title="إضافة خطافات وقت التشغيل (حسب الحاجة)">
    يحتاج معظم الموفرين إلى `catalog` + `resolveDynamicModel` فقط. أضف الخطافات
    تدريجياً بحسب ما يتطلبه موفرك.

    تغطي بناة المساعدات المشتركة الآن أكثر عائلات replay/tool-compat شيوعاً،
    لذلك لا تحتاج Plugins عادةً إلى توصيل كل خطاف يدوياً واحداً تلو الآخر:

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

    | العائلة | ما يتم توصيله | أمثلة مضمّنة |
    | --- | --- | --- |
    | `openai-compatible` | سياسة إعادة مشتركة بأسلوب OpenAI للنقل المتوافق مع OpenAI، بما في ذلك تنظيف tool-call-id، وإصلاحات ترتيب assistant-first، والتحقق العام من دورات Gemini حيث يحتاج النقل إلى ذلك | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | سياسة إعادة مدركة لـ Claude تُختار بواسطة `modelId`، حتى لا تحصل عمليات نقل رسائل Anthropic إلا على تنظيف كتل التفكير الخاصة بـ Claude عندما يكون النموذج المحلول فعلاً معرّف Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | سياسة إعادة Gemini الأصلية مع تنظيف إعادة bootstrap ووضع reasoning-output المعلّم | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | تنظيف thought-signature في Gemini لنماذج Gemini التي تعمل عبر عمليات نقل proxy متوافقة مع OpenAI؛ لا يفعّل التحقق الأصلي من إعادة Gemini أو إعادة كتابة bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | سياسة هجينة للموفرين الذين يمزجون أسطح نماذج رسائل Anthropic والمتوافقة مع OpenAI في Plugin واحد؛ يبقى إسقاط كتل التفكير الاختياري الخاص بـ Claude محصوراً في جانب Anthropic | `minimax` |

    عائلات البث المتاحة اليوم:

    | العائلة | ما الذي تربطه | أمثلة مضمنة |
    | --- | --- | --- |
    | `google-thinking` | تطبيع حمولة تفكير Gemini على مسار التدفق المشترك | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | غلاف استدلال Kilo على مسار تدفق الوكيل المشترك، مع تخطي `kilo/auto` ومعرّفات استدلال الوكيل غير المدعومة للتفكير المحقون | `kilocode` |
    | `moonshot-thinking` | ربط حمولة التفكير الأصلي الثنائي في Moonshot من التكوين + مستوى `/think` | `moonshot` |
    | `minimax-fast-mode` | إعادة كتابة نموذج الوضع السريع في MiniMax على مسار التدفق المشترك | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | أغلفة Responses الأصلية المشتركة من OpenAI/Codex: ترويسات الإسناد، و`/fast`/`serviceTier`، وإسهاب النص، وبحث الويب الأصلي في Codex، وتشكيل حمولة توافق الاستدلال، وإدارة سياق Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | غلاف استدلال OpenRouter لمسارات الوكيل، مع معالجة مركزية لتخطي النماذج غير المدعومة/`auto` | `openrouter` |
    | `tool-stream-default-on` | غلاف `tool_stream` مفعّل افتراضيا لمزوّدين مثل Z.AI الذين يريدون تدفق الأدوات ما لم يُعطّل صراحة | `zai` |

    <Accordion title="منافذ SDK التي تشغّل بناة العائلات">
      يتكون كل باني عائلة من مساعدين عامين أدنى مستوى مصدّرين من الحزمة نفسها، ويمكنك استخدامهم عندما يحتاج مزوّد إلى الخروج عن النمط الشائع:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`، و`buildProviderReplayFamilyHooks(...)`، وبناة إعادة التشغيل الخام (`buildOpenAICompatibleReplayPolicy`، و`buildAnthropicReplayPolicyForModel`، و`buildGoogleGeminiReplayPolicy`، و`buildHybridAnthropicOrOpenAIReplayPolicy`). يصدّر أيضا مساعدين لإعادة تشغيل Gemini (`sanitizeGoogleGeminiReplayHistory`، و`resolveTaggedReasoningOutputMode`) ومساعدي نقطة النهاية/النموذج (`resolveProviderEndpoint`، و`normalizeProviderId`، و`normalizeGooglePreviewModelId`، و`normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`، و`buildProviderStreamFamilyHooks(...)`، و`composeProviderStreamWrappers(...)`، بالإضافة إلى أغلفة OpenAI/Codex المشتركة (`createOpenAIAttributionHeadersWrapper`، و`createOpenAIFastModeWrapper`، و`createOpenAIServiceTierWrapper`، و`createOpenAIResponsesContextManagementWrapper`، و`createCodexNativeWebSearchWrapper`)، وغلاف DeepSeek V4 المتوافق مع OpenAI (`createDeepSeekV4OpenAICompatibleThinkingWrapper`)، وتنظيف تعبئة التفكير المسبقة في Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`)، وأغلفة الوكيل/المزوّد المشتركة (`createOpenRouterWrapper`، و`createToolStreamWrapper`، و`createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`، و`buildProviderToolCompatFamilyHooks("gemini")`، ومساعدو مخططات Gemini الأساسيون (`normalizeGeminiToolSchemas`، و`inspectGeminiToolSchemas`)، ومساعدو توافق xAI (`resolveXaiModelCompatPatch()`، و`applyXaiModelCompat(model)`). يستخدم Plugin xAI المضمّن `normalizeResolvedModel` + `contributeResolvedModelCompat` مع هذه العناصر لإبقاء قواعد xAI مملوكة للمزوّد.

      يبقى بعض مساعدي التدفق محليا لدى المزوّد عمدا. يحتفظ `@openclaw/anthropic-provider` بكل من `wrapAnthropicProviderStream`، و`resolveAnthropicBetas`، و`resolveAnthropicFastMode`، و`resolveAnthropicServiceTier`، وبناة أغلفة Anthropic الأدنى مستوى في منفذ `api.ts` / `contract-api.ts` العام الخاص به لأنها ترمّز معالجة إصدار Claude OAuth التجريبي وحراسة `context1m`. وبالمثل، يحتفظ Plugin xAI بتشكيل xAI Responses الأصلي في `wrapStreamFn` الخاص به (أسماء `/fast` البديلة، و`tool_stream` الافتراضي، وتنظيف الأدوات الصارمة غير المدعومة، وإزالة حمولة الاستدلال الخاصة بـ xAI).

      يدعم نمط جذر الحزمة نفسه أيضا `@openclaw/openai-provider` (بناة المزوّد، ومساعدو النموذج الافتراضي، وبناة مزوّد الوقت الفعلي) و`@openclaw/openrouter-provider` (باني المزوّد بالإضافة إلى مساعدي الإعداد/التكوين).
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
      يستدعي OpenClaw الخطافات بهذا الترتيب. يستخدم معظم المزوّدين 2-3 فقط:
      حقول المزوّد الخاصة بالتوافق فقط التي لم يعد OpenClaw يستدعيها، مثل
      `ProviderPlugin.capabilities` و`suppressBuiltInModel`، غير مدرجة
      هنا.

      | # | الخطاف | متى يُستخدم |
      | --- | --- | --- |
      | 1 | `catalog` | كتالوج النماذج أو افتراضيات عنوان URL الأساسي |
      | 2 | `applyConfigDefaults` | الافتراضيات العامة المملوكة للمزوّد أثناء تجسيد التكوين |
      | 3 | `normalizeModelId` | تنظيف الأسماء البديلة لمعرّفات النماذج القديمة/المعاينة قبل البحث |
      | 4 | `normalizeTransport` | تنظيف `api` / `baseUrl` لعائلة المزوّد قبل تجميع النموذج العام |
      | 5 | `normalizeConfig` | تطبيع تكوين `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | إعادة كتابة توافق استخدام التدفق الأصلي لمزوّدي التكوين |
      | 7 | `resolveConfigApiKey` | حل المصادقة بعلامة البيئة المملوك للمزوّد |
      | 8 | `resolveSyntheticAuth` | مصادقة اصطناعية محلية/مستضافة ذاتيا أو مدعومة بالتكوين |
      | 9 | `shouldDeferSyntheticProfileAuth` | خفض عناصر نائبة للملفات الشخصية الاصطناعية المخزّنة خلف مصادقة البيئة/التكوين |
      | 10 | `resolveDynamicModel` | قبول معرّفات نماذج من المنبع عشوائية |
      | 11 | `prepareDynamicModel` | جلب بيانات وصفية غير متزامن قبل الحل |
      | 12 | `normalizeResolvedModel` | إعادة كتابة النقل قبل المشغّل |
      | 13 | `contributeResolvedModelCompat` | علامات توافق لنماذج المورّد خلف نقل متوافق آخر |
      | 14 | `normalizeToolSchemas` | تنظيف مخططات الأدوات المملوك للمزوّد قبل التسجيل |
      | 15 | `inspectToolSchemas` | تشخيصات مخططات الأدوات المملوكة للمزوّد |
      | 16 | `resolveReasoningOutputMode` | عقد مخرجات الاستدلال الموسومة مقابل الأصلية |
      | 17 | `prepareExtraParams` | معلمات الطلب الافتراضية |
      | 18 | `createStreamFn` | نقل StreamFn مخصص بالكامل |
      | 19 | `wrapStreamFn` | أغلفة ترويسات/جسم مخصصة على مسار التدفق العادي |
      | 20 | `resolveTransportTurnState` | ترويسات/بيانات وصفية أصلية لكل دور |
      | 21 | `resolveWebSocketSessionPolicy` | ترويسات جلسة WS أصلية/فترة تهدئة |
      | 22 | `formatApiKey` | شكل رمز تشغيل مخصص |
      | 23 | `refreshOAuth` | تحديث OAuth مخصص |
      | 24 | `buildAuthDoctorHint` | إرشادات إصلاح المصادقة |
      | 25 | `matchesContextOverflowError` | كشف الفيض المملوك للمزوّد |
      | 26 | `classifyFailoverReason` | تصنيف حدود المعدل/الحمل الزائد المملوك للمزوّد |
      | 27 | `isCacheTtlEligible` | حراسة TTL لذاكرة التخزين المؤقت للموجهات |
      | 28 | `buildMissingAuthMessage` | تلميح مصادقة مفقودة مخصص |
      | 29 | `augmentModelCatalog` | صفوف توافق مستقبلي اصطناعية |
      | 30 | `resolveThinkingProfile` | مجموعة خيارات `/think` الخاصة بالنموذج |
      | 31 | `isBinaryThinking` | توافق تشغيل/إيقاف التفكير الثنائي |
      | 32 | `supportsXHighThinking` | توافق دعم استدلال `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | توافق سياسة `/think` الافتراضية |
      | 34 | `isModernModelRef` | مطابقة نموذج مباشر/دخاني |
      | 35 | `prepareRuntimeAuth` | تبادل الرمز المميز قبل الاستدلال |
      | 36 | `resolveUsageAuth` | تحليل اعتماد استخدام مخصص |
      | 37 | `fetchUsageSnapshot` | نقطة نهاية استخدام مخصصة |
      | 38 | `createEmbeddingProvider` | محوّل تضمين مملوك للمزوّد للذاكرة/البحث |
      | 39 | `buildReplayPolicy` | سياسة إعادة تشغيل/Compaction مخصصة للنص |
      | 40 | `sanitizeReplayHistory` | إعادة كتابة إعادة التشغيل الخاصة بالمزوّد بعد التنظيف العام |
      | 41 | `validateReplayTurns` | تحقق صارم من أدوار إعادة التشغيل قبل المشغّل المضمّن |
      | 42 | `onModelSelected` | رد نداء بعد الاختيار (مثل القياسات) |

      ملاحظات الرجوع في وقت التشغيل:

      - يتحقق `normalizeConfig` من المزوّد المطابق أولا، ثم من Plugins المزوّدين الأخرى القادرة على الخطافات إلى أن يغيّر أحدها التكوين فعلا. إذا لم يعدّل أي خطاف مزوّد إدخال تكوين مدعوما من عائلة Google، يظل مطبّع تكوين Google المضمّن مطبقا.
      - يستخدم `resolveConfigApiKey` خطاف المزوّد عند كشفه. يتضمن مسار `amazon-bedrock` المضمّن أيضا محلّل علامات بيئة AWS مدمجا هنا، مع أن مصادقة تشغيل Bedrock نفسها لا تزال تستخدم سلسلة AWS SDK الافتراضية.
      - يتيح `resolveSystemPromptContribution` للمزوّد حقن إرشادات موجه نظام واعية بالتخزين المؤقت لعائلة نموذج. فضّله على `before_prompt_build` عندما يكون السلوك خاصا بعائلة مزوّد/نموذج واحدة وينبغي أن يحافظ على فصل التخزين المؤقت المستقر/الديناميكي.

      للاطلاع على أوصاف مفصلة وأمثلة من الواقع، راجع [البنية الداخلية: خطافات تشغيل المزوّد](/ar/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="أضف قدرات إضافية (اختياري)">
    يستطيع Plugin مزوّد تسجيل الكلام، والنسخ الفوري، والصوت الفوري، وفهم
    الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب،
    وبحث الويب إلى جانب استدلال النص. يصنّف OpenClaw هذا على أنه
    Plugin **قدرة هجينة**، وهو النمط الموصى به Plugins الشركات
    (Plugin واحد لكل مورّد). راجع
    [البنية الداخلية: ملكية القدرات](/ar/plugins/architecture#capability-ownership-model).

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

        استخدم `assertOkOrThrowProviderError(...)` لإخفاقات HTTP لدى المزوّد حتى
        تشترك الإضافات في قراءات محدودة لجسم الخطأ، وتحليل أخطاء JSON، و
        لواحق معرّفات الطلبات.
      </Tab>
      <Tab title="النسخ الفوري">
        فضّل `createRealtimeTranscriptionWebSocketSession(...)` — يتعامل المساعد
        المشترك مع التقاط الوكيل، والتراجع التدريجي لإعادة الاتصال، وتفريغ الإغلاق، ومصافحات
        الجاهزية، ووضع الصوت في قائمة الانتظار، وتشخيصات أحداث الإغلاق. لا يحتاج Plugin الخاص بك
        إلا إلى ربط الأحداث القادمة من المنبع.

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

        ينبغي لمزوّدي STT الدفعيين الذين يرسلون صوتًا متعدد الأجزاء عبر POST استخدام
        `buildAudioTranscriptionFormData(...)` من
        `openclaw/plugin-sdk/provider-http`. يطبّع المساعد أسماء ملفات الرفع،
        بما في ذلك رفع ملفات AAC التي تحتاج إلى اسم ملف بنمط M4A من أجل
        واجهات API نسخ متوافقة.
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
        تشغيل المساعد، ويدعم المزوّد اقتطاع استجابة الصوت النشطة أو
        مسحها.
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
        تستخدم قدرات الفيديو بنية **مراعية للوضع**: `generate`،
        و`imageToVideo`، و`videoToVideo`. لا تكفي الحقول التجميعية المسطحة مثل
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds`
        للإعلان بوضوح عن دعم وضع التحويل أو الأوضاع المعطّلة.
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

  <Step title="الاختبار">
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

تُنشر إضافات المزوّدين بالطريقة نفسها التي تُنشر بها أي إضافة شيفرة خارجية أخرى:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

لا تستخدم هنا الاسم البديل القديم للنشر الخاص بالمهارات فقط؛ ينبغي لحزم الإضافات استخدام
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

يتحكم `catalog.order` في توقيت دمج كتالوجك بالنسبة إلى المزوّدين المدمجين:

| الترتيب   | متى          | حالة الاستخدام                                  |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | المرور الأول | مزوّدو مفاتيح API العاديون                     |
| `profile` | بعد simple   | مزوّدون مشروطون بملفات تعريف المصادقة          |
| `paired`  | بعد profile  | إنشاء إدخالات متعددة مترابطة                   |
| `late`    | المرور الأخير | تجاوز المزوّدين الحاليين (يفوز عند التعارض)    |

## الخطوات التالية

- [إضافات القنوات](/ar/plugins/sdk-channel-plugins) — إذا كان Plugin الخاص بك يوفّر قناة أيضًا
- [وقت تشغيل SDK](/ar/plugins/sdk-runtime) — مساعدات `api.runtime` (TTS، البحث، الوكيل الفرعي)
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع كامل لاستيراد المسارات الفرعية
- [داخليات Plugin](/ar/plugins/architecture-internals#provider-runtime-hooks) — تفاصيل الخطافات وأمثلة مدمجة

## ذو صلة

- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء الإضافات](/ar/plugins/building-plugins)
- [بناء إضافات القنوات](/ar/plugins/sdk-channel-plugins)
