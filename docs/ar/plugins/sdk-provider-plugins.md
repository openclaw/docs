---
read_when:
    - أنت تبني Plugin جديدة لمزوّد نماذج
    - أنت تريد إضافة proxy متوافق مع OpenAI أو LLM مخصص إلى OpenClaw
    - أنت بحاجة إلى فهم مصادقة المزوّد، والكتالوجات، وhooks وقت التشغيل
sidebarTitle: Provider plugins
summary: دليل خطوة بخطوة لبناء Plugin لمزوّد نماذج في OpenClaw
title: بناء Plugins المزوّدين
x-i18n:
    generated_at: "2026-04-26T11:36:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 987ff69584a3e076189770c253ce48191103b5224e12216fd3d2fc03608ca240
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

يرشدك هذا الدليل خلال بناء Plugin لمزوّد تضيف مزوّد نماذج
(LLM) إلى OpenClaw. وبنهاية الدليل سيكون لديك مزوّد يحتوي على كتالوج نماذج،
ومصادقة بمفتاح API، وحل ديناميكي للنماذج.

<Info>
  إذا لم تكن قد أنشأت أي Plugin في OpenClaw من قبل، فاقرأ أولًا
  [البدء](/ar/plugins/building-plugins) للتعرّف على بنية الحزمة الأساسية
  وإعداد manifest.
</Info>

<Tip>
  تضيف Plugins المزوّدين النماذج إلى حلقة الاستدلال العادية في OpenClaw. وإذا كان النموذج
  يجب أن يعمل عبر daemon وكيل أصلي يملك الخيوط وCompaction
  أو أحداث الأدوات، فاقرن المزوّد مع [agent harness](/ar/plugins/sdk-agent-harness)
  بدلًا من وضع تفاصيل بروتوكول daemon داخل core.
</Tip>

## الشرح خطوة بخطوة

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
      "description": "مزوّد نماذج Acme AI",
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
    بيانات الاعتماد دون تحميل وقت تشغيل Plugin لديك. أضف `providerAuthAliases`
    عندما ينبغي لمتغير مزوّد أن يعيد استخدام مصادقة معرّف مزوّد آخر. ويُعد `modelSupport`
    اختياريًا ويسمح لـ OpenClaw بتحميل Plugin المزوّد تلقائيًا من
    معرّفات النماذج المختصرة مثل `acme-large` قبل وجود hooks وقت التشغيل. وإذا نشرت
    المزوّد على ClawHub، فإن حقول `openclaw.compat` و`openclaw.build`
    هذه تكون مطلوبة في `package.json`.

  </Step>

  <Step title="تسجيل المزوّد">
    يحتاج المزوّد الأدنى إلى `id`، و`label`، و`auth`، و`catalog`:

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

    هذا مزوّد عملي. يمكن للمستخدمين الآن تنفيذ
    `openclaw onboard --acme-ai-api-key <key>` ثم اختيار
    `acme-ai/acme-large` كنموذج لهم.

    إذا كان المزوّد upstream يستخدم رموز تحكم مختلفة عن OpenClaw، فأضف
    تحويلًا نصيًا صغيرًا ثنائي الاتجاه بدلًا من استبدال مسار التدفق:

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

    يقوم `input` بإعادة كتابة مطالبة النظام النهائية ومحتوى الرسائل النصي قبل
    النقل. ويقوم `output` بإعادة كتابة delta النصية الخاصة بالمساعد والنص النهائي قبل
    أن يحلل OpenClaw علامات التحكم الخاصة به أو تسليم القناة.

    بالنسبة إلى المزوّدين المضمنين الذين يسجلون مزوّدًا نصيًا واحدًا فقط بمصادقة
    مفتاح API بالإضافة إلى runtime واحدة مدعومة بكتالوج، ففضّل المساعد
    الأضيق `defineSingleProviderPluginEntry(...)`:

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

    يمثّل `buildProvider` مسار الكتالوج المباشر المستخدم عندما يتمكن OpenClaw من حل
    مصادقة المزوّد الحقيقية. وقد ينفذ اكتشافًا خاصًا بالمزوّد. واستخدم
    `buildStaticProvider` فقط للصفوف غير المتصلة التي يكون عرضها آمنًا قبل تهيئة المصادقة؛
    ويجب ألا تتطلب بيانات اعتماد أو تجري طلبات شبكة.
    ويقوم عرض `models list --all` في OpenClaw حاليًا بتنفيذ الكتالوجات الثابتة
    فقط لPlugins المزوّدين المضمنين، مع تكوين فارغ، وenv فارغة، ومن دون
    مسارات agent/workspace.

    وإذا كان تدفق المصادقة لديك يحتاج أيضًا إلى ترقيع `models.providers.*`،
    والأسماء البديلة، والنموذج الافتراضي للوكيل أثناء onboarding، فاستخدم مساعدات
    القوالب preset من `openclaw/plugin-sdk/provider-onboard`. وأضيق المساعدات هي
    `createDefaultModelPresetAppliers(...)`،
    و`createDefaultModelsPresetAppliers(...)`، و
    `createModelCatalogPresetAppliers(...)`.

    وعندما تدعم نقطة النهاية الأصلية الخاصة بالمزوّد كتل الاستخدام المبثوثة على
    النقل العادي `openai-completions`، ففضّل مساعدات الكتالوج المشتركة في
    `openclaw/plugin-sdk/provider-catalog-shared` بدلًا من ترميز فحوصات
    معرّفات المزوّد بشكل صلب. إذ يكتشف كل من `supportsNativeStreamingUsageCompat(...)` و
    `applyProviderNativeStreamingUsageCompat(...)` الدعم من خريطة قدرات نقطة النهاية،
    لذلك تستمر نقاط نهاية Moonshot/DashScope الأصلية في الاشتراك حتى
    عندما تستخدم Plugin معرّف مزوّد مخصصًا.

  </Step>

  <Step title="إضافة حل ديناميكي للنموذج">
    إذا كان مزوّدك يقبل معرّفات نماذج عشوائية (مثل proxy أو router)،
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

    وإذا كان الحل يتطلب استدعاء شبكة، فاستخدم `prepareDynamicModel` للإحماء
    غير المتزامن — إذ يجري `resolveDynamicModel` مرة أخرى بعد اكتماله.

  </Step>

  <Step title="إضافة hooks وقت التشغيل (عند الحاجة)">
    تحتاج معظم المزوّدات فقط إلى `catalog` + `resolveDynamicModel`. أضف hooks
    تدريجيًا بحسب ما يتطلبه مزوّدك.

    تغطي الآن مولدات المساعدات المشتركة أكثر عائلات replay/tool-compat شيوعًا،
    لذلك لا تحتاج Plugins عادةً إلى توصيل كل hook يدويًا واحدًا واحدًا:

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
    | `openai-compatible` | سياسة replay مشتركة بأسلوب OpenAI لوسائط النقل المتوافقة مع OpenAI، بما في ذلك تنقية معرّفات tool-call، وإصلاحات ترتيب assistant-first، والتحقق العام من أدوار Gemini عند الحاجة في النقل | `moonshot`، `ollama`، `xai`، `zai` |
    | `anthropic-by-model` | سياسة replay مدركة لـ Claude وتُختار بواسطة `modelId`، بحيث لا تحصل وسائط النقل `anthropic-messages` على تنظيف كتل التفكير الخاصة بـ Claude إلا عندما يكون النموذج المحلول فعلًا معرّف Claude | `amazon-bedrock`، `anthropic-vertex` |
    | `google-gemini` | سياسة replay أصلية لـ Gemini بالإضافة إلى تنقية replay الخاصة بالتهيئة bootstrap ووضع reasoning-output المعلّم | `google`، `google-gemini-cli` |
    | `passthrough-gemini` | تنقية thought-signature لنماذج Gemini التي تعمل عبر وسائط proxy متوافقة مع OpenAI؛ ولا تفعّل التحقق الأصلي من replay في Gemini أو إعادة كتابة bootstrap | `openrouter`، `kilocode`، `opencode`، `opencode-go` |
    | `hybrid-anthropic-openai` | سياسة هجينة للمزوّدين الذين يمزجون بين أسطح نماذج `anthropic-messages` وOpenAI-compatible في Plugin واحدة؛ ويظل إسقاط كتل التفكير الاختياري الخاص بـ Claude محصورًا في جانب Anthropic | `minimax` |

    عائلات stream المتاحة اليوم:

    | العائلة | ما الذي توصله | أمثلة مضمّنة |
    | --- | --- | --- |
    | `google-thinking` | تطبيع حمولة التفكير في Gemini على مسار التدفق المشترك | `google`، `google-gemini-cli` |
    | `kilocode-thinking` | غلاف reasoning لـ Kilo على مسار تدفق proxy المشترك، مع تخطي `kilo/auto` ومعرّفات reasoning غير المدعومة والمحقونة | `kilocode` |
    | `moonshot-thinking` | ربط حمولة native-thinking الثنائية الخاصة بـ Moonshot انطلاقًا من التكوين + مستوى `/think` | `moonshot` |
    | `minimax-fast-mode` | إعادة كتابة نموذج MiniMax fast-mode على مسار التدفق المشترك | `minimax`، `minimax-portal` |
    | `openai-responses-defaults` | أغلفة OpenAI/Codex Responses الأصلية المشتركة: ترويسات الإسناد، و`/fast`/`serviceTier`، وtext verbosity، وبحث الويب الأصلي في Codex، وتشكيل حمولة reasoning-compat، وإدارة السياق في Responses | `openai`، `openai-codex` |
    | `openrouter-thinking` | غلاف reasoning لـ OpenRouter لمسارات proxy، مع معالجة تخطي `auto`/النماذج غير المدعومة مركزيًا | `openrouter` |
    | `tool-stream-default-on` | غلاف `tool_stream` المفعّل افتراضيًا للمزوّدين مثل Z.AI الذين يريدون بث الأدوات ما لم يُعطَّل صراحةً | `zai` |

    <Accordion title="مسارات SDK التي تشغّل بانيات العائلات">
      تتكون كل بانية عائلة من مساعدات عامة منخفضة المستوى مصدّرة من الحزمة نفسها، ويمكنك استخدامها عندما يحتاج المزوّد إلى الخروج عن النمط الشائع:

      - `openclaw/plugin-sdk/provider-model-shared` — ‏`ProviderReplayFamily`، و`buildProviderReplayFamilyHooks(...)`، وبانيات replay الخام (`buildOpenAICompatibleReplayPolicy`، و`buildAnthropicReplayPolicyForModel`، و`buildGoogleGeminiReplayPolicy`، و`buildHybridAnthropicOrOpenAIReplayPolicy`). كما يصدّر أيضًا مساعدات replay الخاصة بـ Gemini ‏(`sanitizeGoogleGeminiReplayHistory`، و`resolveTaggedReasoningOutputMode`) ومساعدات endpoint/model ‏(`resolveProviderEndpoint`، و`normalizeProviderId`، و`normalizeGooglePreviewModelId`، و`normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — ‏`ProviderStreamFamily`، و`buildProviderStreamFamilyHooks(...)`، و`composeProviderStreamWrappers(...)`، بالإضافة إلى أغلفة OpenAI/Codex المشتركة (`createOpenAIAttributionHeadersWrapper`، و`createOpenAIFastModeWrapper`، و`createOpenAIServiceTierWrapper`، و`createOpenAIResponsesContextManagementWrapper`، و`createCodexNativeWebSearchWrapper`)، وغلاف DeepSeek V4 المتوافق مع OpenAI ‏(`createDeepSeekV4OpenAICompatibleThinkingWrapper`)، وأغلفة proxy/provider المشتركة (`createOpenRouterWrapper`، و`createToolStreamWrapper`، و`createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — ‏`ProviderToolCompatFamily`، و`buildProviderToolCompatFamilyHooks("gemini")`، ومساعدات schema الأساسية الخاصة بـ Gemini ‏(`normalizeGeminiToolSchemas`، و`inspectGeminiToolSchemas`)، ومساعدات التوافق الخاصة بـ xAI ‏(`resolveXaiModelCompatPatch()`، و`applyXaiModelCompat(model)`). تستخدم Plugin ‏xAI المضمنة `normalizeResolvedModel` + `contributeResolvedModelCompat` مع هذه للحفاظ على قواعد xAI مملوكة للمزوّد.

      تبقى بعض مساعدات التدفق محلية للمزوّد عمدًا. إذ تحتفظ `@openclaw/anthropic-provider` بكل من `wrapAnthropicProviderStream`، و`resolveAnthropicBetas`، و`resolveAnthropicFastMode`، و`resolveAnthropicServiceTier`، وبانيات الغلاف المنخفضة المستوى الخاصة بـ Anthropic داخل مسارها العام `api.ts` / `contract-api.ts` لأنها ترمز التعامل مع Claude OAuth beta وبوابة `context1m`. وبالمثل تحتفظ Plugin ‏xAI بتشكيل xAI Responses الأصلية ضمن `wrapStreamFn` الخاص بها (`/fast` aliases، و`tool_stream` الافتراضي، وتنظيف الأدوات الصارمة غير المدعومة، وإزالة حمولة reasoning الخاصة بـ xAI).

      كما يدعم نمط جذر الحزمة نفسه كلًا من `@openclaw/openai-provider` ‏(بانيات المزوّد، ومساعدات النموذج الافتراضي، وبانيات المزوّدات الفورية) و`@openclaw/openrouter-provider` ‏(بانية المزوّد بالإضافة إلى مساعدات onboarding/config).
    </Accordion>

    <Tabs>
      <Tab title="تبادل الرموز المميزة">
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
        للمزوّدين الذين يحتاجون إلى ترويسات طلب مخصصة أو تعديلات على body:

        ```typescript
        // يعيد wrapStreamFn قيمة StreamFn مشتقة من ctx.streamFn
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
        للمزوّدين الذين يحتاجون إلى ترويسات طلب/جلسة أصلية أو بيانات وصفية على
        وسائط النقل العامة HTTP أو WebSocket:

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
        للمزوّدين الذين يعرّضون بيانات استخدام/فوترة:

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

    <Accordion title="كل hooks المزوّد المتاحة">
      يستدعي OpenClaw hooks بهذا الترتيب. ومعظم المزوّدين يستخدمون فقط 2-3 منها:

      | # | Hook | متى تُستخدم |
      | --- | --- | --- |
      | 1 | `catalog` | كتالوج النموذج أو افتراضيات base URL |
      | 2 | `applyConfigDefaults` | افتراضيات عامة يملكها المزوّد أثناء materialization التكوين |
      | 3 | `normalizeModelId` | تنظيف أسماء مستعارة قديمة/preview لمعرّف النموذج قبل lookup |
      | 4 | `normalizeTransport` | تنظيف `api` / `baseUrl` لعائلة المزوّد قبل التجميع العام للنموذج |
      | 5 | `normalizeConfig` | تطبيع تكوين `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | إعادة كتابة توافق الاستخدام المبثوث أصليًا لمزوّدي التكوين |
      | 7 | `resolveConfigApiKey` | حل مصادقة env-marker يملكها المزوّد |
      | 8 | `resolveSyntheticAuth` | مصادقة synthetic محلية/مستضافة ذاتيًا أو مدعومة بالتكوين |
      | 9 | `shouldDeferSyntheticProfileAuth` | خفض placeholders الخاصة بالملف الشخصي المخزن لصالح مصادقة env/config |
      | 10 | `resolveDynamicModel` | قبول معرّفات نماذج upstream عشوائية |
      | 11 | `prepareDynamicModel` | جلب بيانات وصفية غير متزامن قبل الحل |
      | 12 | `normalizeResolvedModel` | إعادة كتابة النقل قبل المشغّل |
      | 13 | `contributeResolvedModelCompat` | أعلام توافق لنماذج المزوّد خلف نقل متوافق آخر |
      | 14 | `capabilities` | كيس قدرات ثابت قديم؛ للتوافق فقط |
      | 15 | `normalizeToolSchemas` | تنظيف schema الأدوات المملوكة للمزوّد قبل التسجيل |
      | 16 | `inspectToolSchemas` | تشخيصات schema الأدوات المملوكة للمزوّد |
      | 17 | `resolveReasoningOutputMode` | عقد reasoning-output بين المعلّم والأصلي |
      | 18 | `prepareExtraParams` | معلمات الطلب الافتراضية |
      | 19 | `createStreamFn` | نقل StreamFn مخصص بالكامل |
      | 20 | `wrapStreamFn` | أغلفة ترويسة/جسم مخصصة على مسار التدفق العادي |
      | 21 | `resolveTransportTurnState` | ترويسات/بيانات وصفية أصلية لكل دور |
      | 22 | `resolveWebSocketSessionPolicy` | ترويسات جلسة WS الأصلية/فترة التهدئة |
      | 23 | `formatApiKey` | شكل رمز وقت التشغيل المخصص |
      | 24 | `refreshOAuth` | تحديث OAuth مخصص |
      | 25 | `buildAuthDoctorHint` | إرشاد إصلاح المصادقة |
      | 26 | `matchesContextOverflowError` | اكتشاف تجاوز سعة السياق المملوك للمزوّد |
      | 27 | `classifyFailoverReason` | تصنيف حد المعدل/الحمل الزائد المملوك للمزوّد |
      | 28 | `isCacheTtlEligible` | التحكم في TTL لذاكرة التخزين المؤقت الخاصة بالمطالبة |
      | 29 | `buildMissingAuthMessage` | تلميح مخصص عند غياب المصادقة |
      | 30 | `suppressBuiltInModel` | إخفاء الصفوف القديمة من upstream |
      | 31 | `augmentModelCatalog` | صفوف synthetic للتوافق المستقبلي |
      | 32 | `resolveThinkingProfile` | مجموعة خيارات `/think` الخاصة بالنموذج |
      | 33 | `isBinaryThinking` | توافق التفكير الثنائي تشغيل/إيقاف |
      | 34 | `supportsXHighThinking` | توافق دعم reasoning من نوع `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | توافق سياسة `/think` الافتراضية |
      | 36 | `isModernModelRef` | مطابقة نموذج الاختبار المباشر/smoke |
      | 37 | `prepareRuntimeAuth` | تبادل رمز مميز قبل الاستدلال |
      | 38 | `resolveUsageAuth` | تحليل بيانات اعتماد الاستخدام المخصص |
      | 39 | `fetchUsageSnapshot` | نقطة نهاية استخدام مخصصة |
      | 40 | `createEmbeddingProvider` | مهايئ embedding يملكه المزوّد للذاكرة/البحث |
      | 41 | `buildReplayPolicy` | سياسة replay/Compaction مخصصة لـ transcript |
      | 42 | `sanitizeReplayHistory` | إعادة كتابة replay خاصة بالمزوّد بعد التنظيف العام |
      | 43 | `validateReplayTurns` | تحقق صارم من أدوار replay قبل المشغّل المضمن |
      | 44 | `onModelSelected` | استدعاء لاحق للاختيار (مثل telemetry) |

      ملاحظات الرجوع الاحتياطي في وقت التشغيل:

      - يفحص `normalizeConfig` المزوّد المطابق أولًا، ثم Plugins المزوّدين الأخرى القادرة على hook حتى يُجري أحدها تغييرًا فعليًا في التكوين. وإذا لم تُعد كتابة أي hook لمزوّد إدخالًا مدعومًا من عائلة Google، فإن مطبّع التكوين المضمن في Google يظل مطبقًا.
      - يستخدم `resolveConfigApiKey` hook المزوّد عند كشفها. كما يحتوي مسار `amazon-bedrock` المضمن أيضًا على محلل داخلي لـ AWS env-marker هنا، على الرغم من أن مصادقة Bedrock وقت التشغيل نفسها لا تزال تستخدم السلسلة الافتراضية لـ AWS SDK.
      - يتيح `resolveSystemPromptContribution` للمزوّد حقن إرشاد لمطالبة النظام مدرك لذاكرة التخزين المؤقت لعائلة نماذج معينة. ويفضّل استخدامه بدلًا من `before_prompt_build` عندما يكون السلوك خاصًا بعائلة مزوّد/نموذج واحدة ويجب أن يحافظ على التقسيم الثابت/الديناميكي للذاكرة المؤقتة.

      للحصول على أوصاف مفصلة وأمثلة واقعية، راجع [الجوانب الداخلية: hooks وقت تشغيل المزوّد](/ar/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="إضافة إمكانات إضافية (اختياري)">
    يمكن لـ Plugin المزوّد تسجيل الكلام، والنسخ الفوري، والصوت
    الفوري، وفهم الوسائط، وإنشاء الصور، وإنشاء الفيديو، وجلب الويب،
    وبحث الويب إلى جانب الاستدلال النصي. ويصنّف OpenClaw هذا على أنه
    Plugin **hybrid-capability** — وهو النمط الموصى به لPlugins الشركات
    (Plugin واحدة لكل مزوّد). راجع
    [الجوانب الداخلية: ملكية الإمكانات](/ar/plugins/architecture#capability-ownership-model).

    سجّل كل قدرة داخل `register(api)` إلى جانب استدعائك الحالي
    لـ `api.registerProvider(...)`. اختر فقط علامات التبويب التي تحتاجها:

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

        استخدم `assertOkOrThrowProviderError(...)` لإخفاقات HTTP الخاصة بالمزوّد حتى
        تشترك Plugins في قراءات مقيدة لجسم الخطأ، وتحليل أخطاء JSON،
        ولاحقات request-id.
      </Tab>
      <Tab title="النسخ الفوري">
        فضّل `createRealtimeTranscriptionWebSocketSession(...)` — فالمساعد المشترك
        يعالج التقاط proxy، والتراجع عند إعادة الاتصال، والتفريغ عند الإغلاق، ومصافحات الجاهزية،
        واصطفاف الصوت، وتشخيصات أحداث الإغلاق. أما Plugin لديك
        فتقوم فقط بربط أحداث upstream.

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

        يجب على مزوّدي STT الدفعي الذين يرسلون صوتًا multipart عبر POST استخدام
        `buildAudioTranscriptionFormData(...)` من
        `openclaw/plugin-sdk/provider-http`. يقوم هذا المساعد بتطبيع
        أسماء ملفات الرفع، بما في ذلك رفع AAC الذي يحتاج إلى اسم ملف بنمط M4A
        لواجهات النسخ المتوافقة.
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
          transcribeAudio: async (req) => ({ text: "النص المنسوخ..." }),
        });
        ```
      </Tab>
      <Tab title="إنشاء الصور والفيديو">
        تستخدم قدرات الفيديو شكلًا **مدركًا للوضع**: `generate`،
        و`imageToVideo`، و`videoToVideo`. ولا تكفي الحقول التجميعية المسطحة مثل
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds`
        للإعلان النظيف عن دعم أوضاع التحويل أو الأوضاع المعطلة.
        ويتبع إنشاء الموسيقى النمط نفسه مع كتل `generate` /
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
      <Tab title="جلب الويب والبحث">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "اجلب الصفحات عبر الواجهة الخلفية للرندر في Acme.",
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

## النشر إلى ClawHub

تُنشر Plugins المزوّدين بالطريقة نفسها التي تُنشر بها أي Plugin شيفرة خارجية أخرى:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

لا تستخدم الاسم البديل القديم المخصص للنشر الخاص بالـ Skills فقط هنا؛ إذ يجب أن تستخدم حزم Plugins
الأمر `clawhub package publish`.

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

يتحكم `catalog.order` في وقت دمج كتالوجك بالنسبة إلى
المزوّدين المضمنين:

| الترتيب | متى | حالة الاستخدام |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | التمريرة الأولى    | مزوّدات عادية تعتمد على مفتاح API                         |
| `profile` | بعد simple  | مزوّدات تعتمد على ملفات تعريف المصادقة                |
| `paired`  | بعد profile | توليف عدة إدخالات مرتبطة             |
| `late`    | التمريرة الأخيرة     | تجاوز المزوّدين الحاليين (ويفوز عند التصادم) |

## الخطوات التالية

- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — إذا كانت Plugin لديك توفر قناة أيضًا
- [SDK Runtime](/ar/plugins/sdk-runtime) — مساعدات `api.runtime` ‏(TTS، والبحث، وsubagent)
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع كامل لواردات المسارات الفرعية
- [الجوانب الداخلية لـ Plugin](/ar/plugins/architecture-internals#provider-runtime-hooks) — تفاصيل hooks وأمثلة المزوّدين المضمنين

## ذو صلة

- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء Plugins](/ar/plugins/building-plugins)
- [بناء Plugins القنوات](/ar/plugins/sdk-channel-plugins)
