---
read_when:
    - أنت تنشئ Plugin جديدًا لموفّر نماذج
    - تريد إضافة وكيل متوافق مع OpenAI أو نموذج لغة كبير مخصص إلى OpenClaw
    - تحتاج إلى فهم مصادقة المزوّدين والكتالوجات وخطافات وقت التشغيل
sidebarTitle: Provider plugins
summary: دليل خطوة بخطوة لبناء Plugin مزوّد نماذج لـ OpenClaw
title: بناء Plugins المزوّدين
x-i18n:
    generated_at: "2026-04-30T08:17:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1404594fe1d1e11a612f903512c1002c8f3a804dee53d4204457b534eae93381
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

يرشدك هذا الدليل خلال بناء Plugin موفّر يضيف موفّر نموذج
(LLM) إلى OpenClaw. في النهاية سيكون لديك موفّر يتضمن كتالوج نماذج،
ومصادقة بمفتاح API، وحلًا ديناميكيًا للنماذج.

<Info>
  إذا لم تكن قد بنيت أي Plugin لـ OpenClaw من قبل، فاقرأ
  [البدء](/ar/plugins/building-plugins) أولًا لفهم بنية الحزمة الأساسية
  وإعداد البيان.
</Info>

<Tip>
  تضيف Plugins الموفّرين نماذج إلى حلقة الاستدلال العادية في OpenClaw. إذا كان النموذج
  يجب أن يعمل عبر عفريت وكيل أصلي يمتلك السلاسل، أو Compaction، أو أحداث الأدوات،
  فاقرن الموفّر مع [حزام وكيل](/ar/plugins/sdk-agent-harness)
  بدلًا من وضع تفاصيل بروتوكول العفريت في النواة.
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

    يصرّح البيان بـ `providerAuthEnvVars` حتى يتمكن OpenClaw من اكتشاف
    بيانات الاعتماد دون تحميل وقت تشغيل Plugin لديك. أضف `providerAuthAliases`
    عندما يجب على متغير موفّر إعادة استخدام مصادقة معرّف موفّر آخر. `modelSupport`
    اختياري ويتيح لـ OpenClaw تحميل Plugin الموفّر تلقائيًا من معرّفات
    النماذج المختصرة مثل `acme-large` قبل وجود خطافات وقت التشغيل. إذا نشرت
    الموفّر على ClawHub، فحقلا `openclaw.compat` و`openclaw.build`
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

    هذا موفّر عامل. يمكن للمستخدمين الآن تشغيل
    `openclaw onboard --acme-ai-api-key <key>` واختيار
    `acme-ai/acme-large` كنموذج لهم.

    إذا كان الموفّر الصاعد يستخدم رموز تحكم مختلفة عن OpenClaw، فأضف
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
    النقل. يعيد `output` كتابة دلتا نص المساعد والنص النهائي قبل أن يحلل
    OpenClaw علامات التحكم الخاصة به أو تسليم القناة.

    بالنسبة إلى الموفّرين المضمّنين الذين يسجلون موفّر نص واحدًا فقط بمصادقة مفتاح API
    مع وقت تشغيل واحد مدعوم بكتالوج، فضّل المساعد الأضيق
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
    مصادقة الموفّر الحقيقية. قد ينفذ اكتشافًا خاصًا بالموفّر. استخدم
    `buildStaticProvider` فقط للصفوف غير المتصلة الآمنة للعرض قبل إعداد
    المصادقة؛ ويجب ألا يتطلب بيانات اعتماد أو يرسل طلبات شبكة.
    ينفذ عرض `models list --all` في OpenClaw حاليًا الكتالوجات الثابتة
    فقط لـ Plugins الموفّرين المضمّنة، مع إعداد فارغ وبيئة فارغة ودون
    مسارات وكيل/مساحة عمل.

    إذا كان تدفق المصادقة لديك يحتاج أيضًا إلى تصحيح `models.providers.*`، والأسماء البديلة،
    والنموذج الافتراضي للوكيل أثناء الإعداد الأولي، فاستخدم مساعدات الإعداد المسبق من
    `openclaw/plugin-sdk/provider-onboard`. أضيق المساعدات هي
    `createDefaultModelPresetAppliers(...)`،
    و`createDefaultModelsPresetAppliers(...)`، و
    `createModelCatalogPresetAppliers(...)`.

    عندما تدعم نقطة النهاية الأصلية للموفّر كتل استخدام مبثوثة على
    نقل `openai-completions` العادي، فضّل مساعدات الكتالوج المشتركة في
    `openclaw/plugin-sdk/provider-catalog-shared` بدلًا من ترميز
    فحوصات معرّف الموفّر مباشرة. يكتشف
    `supportsNativeStreamingUsageCompat(...)` و
    `applyProviderNativeStreamingUsageCompat(...)` الدعم من
    خريطة إمكانات نقطة النهاية، بحيث تظل نقاط نهاية Moonshot/DashScope الأصلية
    تختار الاشتراك حتى عندما يستخدم Plugin معرّف موفّر مخصصًا.

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

    إذا كان الحل يتطلب طلب شبكة، فاستخدم `prepareDynamicModel` للتهيئة
    غير المتزامنة — يعمل `resolveDynamicModel` مرة أخرى بعد اكتمالها.

  </Step>

  <Step title="إضافة خطافات وقت التشغيل (حسب الحاجة)">
    يحتاج معظم الموفّرين فقط إلى `catalog` + `resolveDynamicModel`. أضف الخطافات
    تدريجيًا حسب متطلبات الموفّر لديك.

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

    | العائلة | ما يتم توصيله | أمثلة مضمّنة |
    | --- | --- | --- |
    | `openai-compatible` | سياسة إعادة تشغيل مشتركة بأسلوب OpenAI للنقولات المتوافقة مع OpenAI، بما في ذلك تنظيف معرّف استدعاء الأداة، وإصلاحات ترتيب المساعد أولًا، والتحقق العام من دورات Gemini عندما يحتاج النقل إلى ذلك | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | سياسة إعادة تشغيل واعية بـ Claude يتم اختيارها بواسطة `modelId`، بحيث لا تحصل نقولات رسائل Anthropic إلا على تنظيف كتل التفكير الخاصة بـ Claude عندما يكون النموذج المحلول فعليًا معرّف Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | سياسة إعادة تشغيل Gemini الأصلية بالإضافة إلى تنظيف إعادة تشغيل التمهيد ووضع مخرجات التفكير الموسومة | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | تنظيف توقيع أفكار Gemini لنماذج Gemini العاملة عبر نقولات وكيل متوافقة مع OpenAI؛ لا يفعّل التحقق الأصلي من إعادة تشغيل Gemini أو إعادة كتابة التمهيد | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | سياسة هجينة للموفّرين الذين يمزجون أسطح نماذج رسائل Anthropic والمتوافقة مع OpenAI في Plugin واحد؛ يبقى الإسقاط الاختياري لكتل التفكير الخاصة بـ Claude فقط محصورًا في جانب Anthropic | `minimax` |

    عائلات البث المتاحة اليوم:

    | العائلة | ما تقوم بوصله | أمثلة مضمنة |
    | --- | --- | --- |
    | `google-thinking` | تطبيع حمولة تفكير Gemini على مسار التدفق المشترك | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | غلاف استدلال Kilo على مسار تدفق الوكيل المشترك، مع تخطي `kilo/auto` ومعرفات استدلال الوكيل غير المدعومة للتفكير المحقون | `kilocode` |
    | `moonshot-thinking` | تعيين حمولة التفكير الأصلي الثنائي من Moonshot من التكوين + مستوى `/think` | `moonshot` |
    | `minimax-fast-mode` | إعادة كتابة نموذج الوضع السريع من MiniMax على مسار التدفق المشترك | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | أغلفة Responses الأصلية المشتركة من OpenAI/Codex: ترويسات الإسناد، `/fast`/`serviceTier`، إسهاب النص، بحث الويب الأصلي من Codex، تشكيل حمولة توافق الاستدلال، وإدارة سياق Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | غلاف استدلال OpenRouter لمسارات الوكيل، مع معالجة مركزية لتخطي النماذج غير المدعومة/`auto` | `openrouter` |
    | `tool-stream-default-on` | غلاف `tool_stream` مفعل افتراضيا لموفري الخدمات مثل Z.AI الذين يريدون تدفق الأدوات ما لم يتم تعطيله صراحة | `zai` |

    <Accordion title="SDK seams powering the family builders">
      يتكون كل منشئ عائلة من مساعدين عامين أدنى مستوى يتم تصديرهم من الحزمة نفسها، ويمكنك استخدامها عندما يحتاج موفر إلى الخروج عن النمط الشائع:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily` و`buildProviderReplayFamilyHooks(...)` ومنشئو إعادة التشغيل الخام (`buildOpenAICompatibleReplayPolicy` و`buildAnthropicReplayPolicyForModel` و`buildGoogleGeminiReplayPolicy` و`buildHybridAnthropicOrOpenAIReplayPolicy`). يصدّر أيضا مساعدي إعادة تشغيل Gemini (`sanitizeGoogleGeminiReplayHistory` و`resolveTaggedReasoningOutputMode`) ومساعدي نقطة النهاية/النموذج (`resolveProviderEndpoint` و`normalizeProviderId` و`normalizeGooglePreviewModelId` و`normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily` و`buildProviderStreamFamilyHooks(...)` و`composeProviderStreamWrappers(...)`، إضافة إلى أغلفة OpenAI/Codex المشتركة (`createOpenAIAttributionHeadersWrapper` و`createOpenAIFastModeWrapper` و`createOpenAIServiceTierWrapper` و`createOpenAIResponsesContextManagementWrapper` و`createCodexNativeWebSearchWrapper`)، وغلاف DeepSeek V4 المتوافق مع OpenAI (`createDeepSeekV4OpenAICompatibleThinkingWrapper`)، وتنظيف تمهيد التفكير في Anthropic Messages (`createAnthropicThinkingPrefillPayloadWrapper`)، وأغلفة الوكيل/الموفر المشتركة (`createOpenRouterWrapper` و`createToolStreamWrapper` و`createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily` و`buildProviderToolCompatFamilyHooks("gemini")` ومساعدو مخططات Gemini الأساسية (`normalizeGeminiToolSchemas` و`inspectGeminiToolSchemas`) ومساعدو توافق xAI (`resolveXaiModelCompatPatch()` و`applyXaiModelCompat(model)`). يستخدم Plugin xAI المضمن `normalizeResolvedModel` + `contributeResolvedModelCompat` معها لإبقاء قواعد xAI مملوكة للموفر.

      تبقى بعض مساعدات التدفق محلية للموفر عمدا. يحتفظ `@openclaw/anthropic-provider` بكل من `wrapAnthropicProviderStream` و`resolveAnthropicBetas` و`resolveAnthropicFastMode` و`resolveAnthropicServiceTier` ومنشئي أغلفة Anthropic الأدنى مستوى في واجهة `api.ts` / `contract-api.ts` العامة الخاصة به لأنها ترمز إلى معالجة Claude OAuth beta وبوابة `context1m`. وبالمثل، يحتفظ Plugin xAI بتشكيل xAI Responses الأصلي في `wrapStreamFn` الخاص به (أسماء `/fast` البديلة، `tool_stream` الافتراضي، تنظيف الأدوات الصارمة غير المدعومة، إزالة حمولة الاستدلال الخاصة بـ xAI).

      يدعم نمط جذر الحزمة نفسه أيضا `@openclaw/openai-provider` (منشئو الموفر، ومساعدو النموذج الافتراضي، ومنشئو موفر الوقت الفعلي) و`@openclaw/openrouter-provider` (منشئ الموفر إضافة إلى مساعدي الإعداد/التكوين).
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        للموفرين الذين يحتاجون إلى تبادل رمز قبل كل استدعاء استدلال:

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
        للموفرين الذين يحتاجون إلى ترويسات طلب مخصصة أو تعديلات على الجسم:

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
        للموفرين الذين يحتاجون إلى ترويسات أو بيانات وصفية أصلية للطلب/الجلسة على
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
      <Tab title="Usage and billing">
        للموفرين الذين يعرضون بيانات الاستخدام/الفوترة:

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
      يستدعي OpenClaw الخطافات بهذا الترتيب. يستخدم معظم الموفرين 2-3 فقط:
      حقول الموفر الخاصة بالتوافق فقط، التي لم يعد OpenClaw يستدعيها، مثل
      `ProviderPlugin.capabilities` و`suppressBuiltInModel`، غير مدرجة
      هنا.

      | # | الخطاف | متى تستخدمه |
      | --- | --- | --- |
      | 1 | `catalog` | كتالوج النماذج أو افتراضيات عنوان URL الأساسي |
      | 2 | `applyConfigDefaults` | الافتراضيات العامة المملوكة للموفر أثناء تجسيد التكوين |
      | 3 | `normalizeModelId` | تنظيف أسماء معرفات النماذج القديمة/المعاينة قبل البحث |
      | 4 | `normalizeTransport` | تنظيف `api` / `baseUrl` لعائلة الموفر قبل تجميع النموذج العام |
      | 5 | `normalizeConfig` | تطبيع تكوين `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | إعادة كتابة توافق استخدام التدفق الأصلي لموفري التكوين |
      | 7 | `resolveConfigApiKey` | حل مصادقة علامة البيئة المملوك للموفر |
      | 8 | `resolveSyntheticAuth` | مصادقة اصطناعية محلية/ذاتية الاستضافة أو مدعومة بالتكوين |
      | 9 | `shouldDeferSyntheticProfileAuth` | خفض مواضع حفظ الملفات الشخصية الاصطناعية المخزنة خلف مصادقة البيئة/التكوين |
      | 10 | `resolveDynamicModel` | قبول معرفات نماذج upstream عشوائية |
      | 11 | `prepareDynamicModel` | جلب بيانات وصفية غير متزامن قبل الحل |
      | 12 | `normalizeResolvedModel` | إعادة كتابة النقل قبل المشغل |
      | 13 | `contributeResolvedModelCompat` | أعلام التوافق لنماذج البائع خلف نقل متوافق آخر |
      | 14 | `normalizeToolSchemas` | تنظيف مخطط الأدوات المملوك للموفر قبل التسجيل |
      | 15 | `inspectToolSchemas` | تشخيصات مخطط الأدوات المملوكة للموفر |
      | 16 | `resolveReasoningOutputMode` | عقد مخرجات الاستدلال الموسوم مقابل الأصلي |
      | 17 | `prepareExtraParams` | معلمات الطلب الافتراضية |
      | 18 | `createStreamFn` | نقل StreamFn مخصص بالكامل |
      | 19 | `wrapStreamFn` | أغلفة ترويسات/جسم مخصصة على مسار التدفق العادي |
      | 20 | `resolveTransportTurnState` | ترويسات/بيانات وصفية أصلية لكل دور |
      | 21 | `resolveWebSocketSessionPolicy` | ترويسات جلسة WS أصلية/فترة تهدئة |
      | 22 | `formatApiKey` | شكل رمز تشغيل مخصص |
      | 23 | `refreshOAuth` | تحديث OAuth مخصص |
      | 24 | `buildAuthDoctorHint` | إرشادات إصلاح المصادقة |
      | 25 | `matchesContextOverflowError` | اكتشاف تجاوز السعة المملوك للموفر |
      | 26 | `classifyFailoverReason` | تصنيف حد المعدل/فرط الحمل المملوك للموفر |
      | 27 | `isCacheTtlEligible` | بوابة TTL لذاكرة التخزين المؤقت للموجه |
      | 28 | `buildMissingAuthMessage` | تلميح مخصص للمصادقة المفقودة |
      | 29 | `augmentModelCatalog` | صفوف توافق أمامي اصطناعية |
      | 30 | `resolveThinkingProfile` | مجموعة خيارات `/think` الخاصة بالنموذج |
      | 31 | `isBinaryThinking` | توافق تشغيل/إيقاف التفكير الثنائي |
      | 32 | `supportsXHighThinking` | توافق دعم استدلال `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | توافق سياسة `/think` الافتراضية |
      | 34 | `isModernModelRef` | مطابقة نماذج live/smoke |
      | 35 | `prepareRuntimeAuth` | تبادل الرمز قبل الاستدلال |
      | 36 | `resolveUsageAuth` | تحليل بيانات اعتماد استخدام مخصص |
      | 37 | `fetchUsageSnapshot` | نقطة نهاية استخدام مخصصة |
      | 38 | `createEmbeddingProvider` | محول تضمين مملوك للموفر للذاكرة/البحث |
      | 39 | `buildReplayPolicy` | سياسة مخصصة لإعادة تشغيل/Compaction النص الحواري |
      | 40 | `sanitizeReplayHistory` | إعادة كتابة إعادة التشغيل الخاصة بالموفر بعد التنظيف العام |
      | 41 | `validateReplayTurns` | تحقق صارم من أدوار إعادة التشغيل قبل المشغل المضمن |
      | 42 | `onModelSelected` | استدعاء لاحق للاختيار (مثل القياسات عن بعد) |

      ملاحظات الرجوع في وقت التشغيل:

      - يتحقق `normalizeConfig` من الموفر المطابق أولا، ثم Plugins موفرين آخرين قادرين على الخطافات حتى يغير أحدها التكوين فعليا. إذا لم يعد أي خطاف موفر كتابة إدخال تكوين مدعوم من عائلة Google، فسيظل مطبع تكوين Google المضمن مطبقا.
      - يستخدم `resolveConfigApiKey` خطاف الموفر عند عرضه. يحتوي مسار `amazon-bedrock` المضمن أيضا على محلل علامة بيئة AWS مدمج هنا، رغم أن مصادقة تشغيل Bedrock نفسها لا تزال تستخدم سلسلة AWS SDK الافتراضية.
      - يتيح `resolveSystemPromptContribution` للموفر حقن إرشادات موجه النظام الواعية بذاكرة التخزين المؤقت لعائلة نماذج. فضله على `before_prompt_build` عندما يكون السلوك تابعا لعائلة موفر/نموذج واحدة ويجب أن يحافظ على فصل ذاكرة التخزين المؤقت المستقرة/الديناميكية.

      للحصول على أوصاف مفصلة وأمثلة من الواقع، راجع [الداخليات: خطافات تشغيل الموفر](/ar/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Add extra capabilities (optional)">
    يمكن لـ Plugin موفر تسجيل الكلام، والنسخ في الوقت الفعلي، والصوت في الوقت الفعلي، وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب،
    وبحث الويب إلى جانب استدلال النص. يصنف OpenClaw هذا على أنه
    Plugin **hybrid-capability** — وهو النمط الموصى به لـ Plugins الشركات
    (Plugin واحد لكل بائع). راجع
    [الداخليات: ملكية القدرات](/ar/plugins/architecture#capability-ownership-model).

    سجل كل قدرة داخل `register(api)` إلى جانب استدعاء
    `api.registerProvider(...)` الموجود لديك. اختر التبويبات التي تحتاجها فقط:

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

        استخدم `assertOkOrThrowProviderError(...)` لإخفاقات HTTP الخاصة بالمزوّد حتى
        تشترك plugins في قراءات متن الخطأ المحدودة، وتحليل أخطاء JSON، ولواحق
        معرّف الطلب.
      </Tab>
      <Tab title="Realtime transcription">
        فضّل `createRealtimeTranscriptionWebSocketSession(...)` — يتولى المساعد
        المشترك التقاط الوكيل، والتراجع عند إعادة الاتصال، وتفريغ الإغلاق، ومصافحات
        الجاهزية، ووضع الصوت في الطابور، وتشخيصات حدث الإغلاق. يقتصر دور Plugin
        الخاص بك على ربط أحداث المصدر الأعلى.

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

        يجب على مزوّدي STT الدفعيين الذين يرسلون الصوت متعدد الأجزاء عبر POST استخدام
        `buildAudioTranscriptionFormData(...)` من
        `openclaw/plugin-sdk/provider-http`. يطبّع المساعد أسماء ملفات الرفع،
        بما في ذلك رفوعات AAC التي تحتاج إلى اسم ملف بنمط M4A لواجهات API
        المتوافقة الخاصة بالنسخ.
      </Tab>
      <Tab title="Realtime voice">
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
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```
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
        تستخدم إمكانات الفيديو شكلاً **مدركاً للوضع**: `generate` و
        `imageToVideo` و`videoToVideo`. لا تكفي الحقول التجميعية المسطحة مثل
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds`
        للإعلان عن دعم وضع التحويل أو الأوضاع المعطّلة بوضوح.
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

تنشر plugins المزوّد بالطريقة نفسها مثل أي Plugin خارجي آخر للكود:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

لا تستخدم الاسم المستعار القديم المخصص للنشر الخاص بـ skill فقط هنا؛ يجب أن تستخدم حزم Plugin
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

يتحكم `catalog.order` في توقيت دمج كتالوجك مقارنة بالمزوّدين
المدمجين:

| الترتيب     | التوقيت          | حالة الاستخدام                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | التمريرة الأولى    | مزوّدو مفتاح API المباشرون                         |
| `profile` | بعد simple  | مزوّدون مقيّدون بملفات تعريف المصادقة                |
| `paired`  | بعد profile | تركيب عدة إدخالات مرتبطة             |
| `late`    | التمريرة الأخيرة     | تجاوز المزوّدين الحاليين (يفوز عند التصادم) |

## الخطوات التالية

- [Channel Plugins](/ar/plugins/sdk-channel-plugins) — إذا كان Plugin الخاص بك يوفّر قناة أيضاً
- [SDK Runtime](/ar/plugins/sdk-runtime) — مساعدات `api.runtime` ‏(TTS، والبحث، والوكيل الفرعي)
- [SDK Overview](/ar/plugins/sdk-overview) — مرجع كامل لاستيراد المسارات الفرعية
- [Plugin Internals](/ar/plugins/architecture-internals#provider-runtime-hooks) — تفاصيل الخطافات والأمثلة المدمجة

## ذو صلة

- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء plugins](/ar/plugins/building-plugins)
- [بناء channel plugins](/ar/plugins/sdk-channel-plugins)
