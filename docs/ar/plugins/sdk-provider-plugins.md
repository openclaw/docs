---
read_when:
    - أنت تبني Plugin جديدًا لمزوّد نماذج
    - تريد إضافة وكيل متوافق مع OpenAI أو نموذج لغوي كبير مخصص إلى OpenClaw
    - تحتاج إلى فهم مصادقة المزوّد، والكتالوجات، وخطافات وقت التشغيل
sidebarTitle: Provider plugins
summary: دليل تفصيلي خطوة بخطوة لإنشاء Plugin لمزوّد نماذج في OpenClaw
title: بناء Plugins لموفّري الخدمات
x-i18n:
    generated_at: "2026-07-12T06:17:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ebbe59b4487a93c6fec3624251eff7394197e249bb8fc7899f1fc88162510d1c
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

أنشئ Plugin لمزوّد لإضافة مزوّد نماذج (LLM) إلى OpenClaw: كتالوج نماذج، ومصادقة بمفتاح API، وحلّ ديناميكي للنماذج.

<Info>
  هل أنت جديد على Plugins في OpenClaw؟ اقرأ [دليل البدء](/ar/plugins/building-plugins)
  أولًا للتعرّف على بنية الحزمة وإعداد البيان.
</Info>

<Tip>
  تضيف Plugins المزوّدين نماذج إلى حلقة الاستدلال المعتادة في OpenClaw. إذا كان
  يجب تشغيل النموذج عبر برنامج خفي أصلي للوكيل يمتلك سلاسل المحادثات أو Compaction
  أو أحداث الأدوات، فاقرن المزوّد بـ[حاضنة
  وكيل](/ar/plugins/sdk-agent-harness) بدلًا من وضع تفاصيل بروتوكول البرنامج الخفي
  في النواة.
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

    يتيح `setup.providers[].envVars` لـOpenClaw اكتشاف بيانات الاعتماد دون
    تحميل وقت تشغيل الـPlugin. أضف `providerAuthAliases` عندما ينبغي لمتغير
    من المزوّد إعادة استخدام مصادقة معرّف مزوّد آخر. الحقل `modelSupport`
    اختياري ويتيح لـOpenClaw التحميل التلقائي لـPlugin المزوّد من معرّفات
    النماذج المختصرة مثل `acme-large` قبل توفّر خطافات وقت التشغيل. يلزم وجود
    `openclaw.compat` و`openclaw.build` في `package.json` للنشر على ClawHub
    (الحقلان المطلوبان هما `openclaw.compat.pluginApi` و`openclaw.build.openclawVersion`؛
    ويعود `minGatewayVersion` إلى `openclaw.install.minHostVersion` عند حذفه).

  </Step>

  <Step title="تسجيل المزوّد">
    يحتاج مزوّد النصوص الأدنى إلى `id` و`label` و`auth` و`catalog`.
    يمثّل `catalog` خطاف وقت التشغيل/الإعدادات الذي يملكه المزوّد؛ ويمكنه استدعاء
    واجهات API الحية للمورّد ويعيد إدخالات `models.providers`.

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

    يمثّل `registerModelCatalogProvider` سطح كتالوج مستوى التحكّم الأحدث
    لواجهات مستخدم القوائم/المساعدة/الاختيار، ويغطي صفوف `text` و`voice`
    و`image_generation` و`video_generation` و`music_generation`. احتفظ باستدعاءات
    نقاط نهاية المورّد وتحويل الاستجابة داخل الـPlugin؛ إذ يمتلك OpenClaw
    شكل الصف المشترك وتسميات المصادر وعرض المساعدة.

    هذا مزوّد عامل. يمكن للمستخدمين الآن تشغيل
    `openclaw onboard --acme-ai-api-key <key>` واختيار
    `acme-ai/acme-large` كنموذج لهم.

    ### الاكتشاف الحي للنماذج

    إذا كان مزوّدك يوفّر واجهة API على نمط `/models`، فاحتفظ بنقطة النهاية الخاصة
    بالمزوّد وإسقاط الصفوف داخل الـPlugin، واستخدم
    `openclaw/plugin-sdk/provider-catalog-live-runtime` لدورة الجلب المشتركة.
    يوفّر لك المساعد عمليات جلب HTTP محمية، وترويسات مصادقة المزوّد،
    وأخطاء HTTP منظّمة، وتخزينًا مؤقتًا بمدة صلاحية، وسلوك رجوع ثابتًا دون
    وضع سياسة المزوّد في نواة OpenClaw.

    استخدم `buildLiveModelProviderConfig` عندما تخبرك واجهة API الحية فقط
    بصفوف الكتالوج الثابتة المملوكة للمزوّد والمتاحة حاليًا:

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

    استخدم `getCachedLiveProviderModelRows` عندما تعيد واجهة API الخاصة بالمزوّد
    بيانات وصفية أكثر ثراءً ويحتاج الـPlugin إلى إسقاط الصفوف بنفسه إلى تعريفات
    نماذج OpenClaw:

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

    ينبغي أن يبقى `run` مشروطًا بالمصادقة وأن يعيد `null` عند عدم توفّر بيانات
    اعتماد قابلة للاستخدام. احتفظ بـ`staticRun` غير متصل أو برجوع ثابت حتى لا
    يعتمد الإعداد والتوثيق والاختبارات وواجهات الاختيار على الوصول الحي إلى
    الشبكة. استخدم مدة صلاحية مناسبة لحداثة قائمة النماذج، وتجنّب استطلاع نظام
    الملفات وقت الطلب، ولا تمرّر `readRows` / `readModelId` خاصين بالمزوّد إلا
    عندما لا تكون استجابة المصدر بالشكل المتوافق مع OpenAI
    ‏`{ data: [{ id, object }] }`.

    إذا كان المزوّد المصدر يستخدم رموز تحكّم مختلفة عن OpenClaw، فأضف تحويلًا
    نصيًا صغيرًا ثنائي الاتجاه بدلًا من استبدال مسار التدفق:

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

    يعيد `input` كتابة موجّه النظام النهائي ومحتوى الرسائل النصية قبل النقل.
    ويعيد `output` كتابة أجزاء نص المساعد والنص النهائي قبل أن يحلّل OpenClaw
    علامات التحكّم الخاصة به أو يسلّم المحتوى إلى القناة.

    بالنسبة إلى المزوّدين المضمّنين الذين يسجّلون مزوّد نصوص واحدًا فقط مع
    مصادقة بمفتاح API ووقت تشغيل واحد مدعوم بالكتالوج، يُفضّل استخدام المساعد
    الأضيق `defineSingleProviderPluginEntry(...)`:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "موفّر نماذج Acme AI",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "مفتاح API لـ Acme AI",
            hint: "مفتاح API من لوحة معلومات Acme AI",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "أدخل مفتاح API لـ Acme AI",
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

    يمثّل `buildProvider` مسار الكتالوج المباشر المستخدم عندما يستطيع OpenClaw تحديد
    مصادقة فعلية للموفّر. ويمكنه إجراء اكتشاف خاص بالموفّر. استخدم
    `buildStaticProvider` فقط للصفوف غير المتصلة الآمن عرضها قبل تهيئة
    المصادقة؛ ويجب ألا يتطلب بيانات اعتماد أو يجري طلبات شبكة.
    يشغّل عرض `models list --all` في OpenClaw حاليًا الكتالوجات الثابتة
    لملحقات الموفّرين المضمّنة فقط، مع إعداد فارغ وبيئة فارغة ومن دون
    مسارات للوكيل أو مساحة العمل.

    إذا كان تدفق المصادقة لديك يحتاج أيضًا إلى تعديل `models.providers.*` والأسماء البديلة
    والنموذج الافتراضي للوكيل أثناء الإعداد الأولي، فاستخدم مساعدات الإعداد المسبق من
    `openclaw/plugin-sdk/provider-onboard`. أضيق المساعدات نطاقًا هي
    `createDefaultModelPresetAppliers(...)`،
    و`createDefaultModelsPresetAppliers(...)`،
    و`createModelCatalogPresetAppliers(...)`.

    عندما تدعم نقطة النهاية الأصلية للموفّر كتل الاستخدام المتدفقة عبر
    نقل `openai-completions` المعتاد، فضّل مساعدات الكتالوج المشتركة في
    `openclaw/plugin-sdk/provider-catalog-shared` بدلًا من الترميز الثابت
    لعمليات التحقق من معرّف الموفّر. تكتشف `supportsNativeStreamingUsageCompat(...)`
    و`applyProviderNativeStreamingUsageCompat(...)` الدعم من
    خريطة إمكانات نقطة النهاية، بحيث تظل نقاط النهاية الأصلية المشابهة لـ Moonshot/DashScope
    قادرة على الاشتراك حتى عندما يستخدم Plugin معرّف موفّر مخصصًا.

    تغطي أمثلة الاكتشاف المباشر أعلاه واجهات API للموفّرين المشابهة لـ `/models`. أبقِ
    هذا الاكتشاف داخل `catalog.run`، مع اشتراط وجود مصادقة صالحة للاستخدام، وأبقِ
    `staticRun` خاليًا من استخدام الشبكة لإنشاء الكتالوج دون اتصال.

  </Step>

  <Step title="إضافة تحديد ديناميكي للنموذج">
    إذا كان موفّرك يقبل معرّفات نماذج عشوائية (مثل وكيل أو موجّه)،
    فأضف `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... المعرّف والتسمية والمصادقة والكتالوج من أعلاه

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

    إذا كان التحديد يتطلب استدعاءً عبر الشبكة، فاستخدم `prepareDynamicModel` للتهيئة
    المسبقة غير المتزامنة؛ إذ يُشغّل `resolveDynamicModel` مرة أخرى بعد اكتمالها.

  </Step>

  <Step title="إضافة خطافات وقت التشغيل (حسب الحاجة)">
    لا يحتاج معظم الموفّرين إلا إلى `catalog` و`resolveDynamicModel`. أضف الخطافات
    تدريجيًا وفقًا لاحتياجات موفّرك.

    تغطي أدوات بناء المساعدات المشتركة الآن عائلات توافق إعادة التشغيل/الأدوات الأكثر
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

    عائلات إعادة التشغيل المتاحة حاليًا:

    | العائلة | ما توصّله | أمثلة مضمّنة |
    | --- | --- | --- |
    | `openai-compatible` | سياسة إعادة تشغيل مشتركة بأسلوب OpenAI لوسائل النقل المتوافقة مع OpenAI، بما في ذلك تنقية معرّفات استدعاءات الأدوات، وإصلاحات ترتيب المساعد أولًا، والتحقق العام من أدوار Gemini عندما يحتاج النقل إلى ذلك | `moonshot`، `ollama`، `xai`، `zai` |
    | `anthropic-by-model` | سياسة إعادة تشغيل مدركة لـ Claude تُختار حسب `modelId`، بحيث لا تحصل وسائل نقل رسائل Anthropic على التنظيف الخاص بكتل التفكير في Claude إلا عندما يكون النموذج المحدد معرّف Claude فعليًا | `amazon-bedrock` |
    | `native-anthropic-by-model` | سياسة Claude نفسها حسب النموذج الموجودة في `anthropic-by-model`، بالإضافة إلى تنقية معرّفات استدعاءات الأدوات والحفاظ على معرّفات استخدام الأدوات الأصلية في Anthropic لوسائل النقل التي يجب أن تحتفظ بمعرّفات المورّد الأصلية | `anthropic-vertex`، `clawrouter` |
    | `google-gemini` | سياسة إعادة التشغيل الأصلية لـ Gemini بالإضافة إلى تنقية إعادة تشغيل التمهيد. تُبقي العائلة المشتركة Gemini CLI ذي الخرج النصي على الاستدلال الموسوم؛ بينما يتجاوز موفّر `google` المباشر `resolveReasoningOutputMode` إلى `native` لأن تفكير Gemini API يصل في صورة أجزاء أفكار أصلية. | `google`، `google-gemini-cli` |
    | `passthrough-gemini` | تنقية توقيع أفكار Gemini لنماذج Gemini التي تعمل عبر وسائل نقل وكيلة متوافقة مع OpenAI؛ ولا تفعّل التحقق الأصلي من إعادة تشغيل Gemini أو إعادة كتابة التمهيد | `openrouter`، `kilocode`، `opencode`، `opencode-go` |
    | `hybrid-anthropic-openai` | سياسة هجينة للموفّرين الذين يمزجون أسطح نماذج رسائل Anthropic والأسطح المتوافقة مع OpenAI في Plugin واحد؛ ويظل إسقاط كتل التفكير الاختياري الخاص بـ Claude محصورًا في جانب Anthropic | `minimax` |

    عائلات التدفق المتاحة حاليًا:

    | العائلة | ما توصّله | أمثلة مضمّنة |
    | --- | --- | --- |
    | `google-thinking` | تسوية حمولة تفكير Gemini في مسار التدفق المشترك | `google`، `google-gemini-cli` |
    | `kilocode-thinking` | غلاف استدلال Kilo في مسار تدفق الوكيل المشترك، مع تخطّي معرّفات الاستدلال الوكيل `kilo/auto` وغير المدعومة للتفكير المُحقن | `kilocode` |
    | `moonshot-thinking` | ربط حمولة التفكير الأصلي الثنائية في Moonshot من الإعداد ومستوى `/think` | `moonshot` |
    | `minimax-fast-mode` | إعادة كتابة نموذج الوضع السريع في MiniMax ضمن مسار التدفق المشترك | `minimax`، `minimax-portal` |
    | `openai-responses-defaults` | أغلفة Responses الأصلية المشتركة لـ OpenAI/Codex: ترويسات النسبة، و`/fast`/`serviceTier`، وإطناب النص، وبحث الويب الأصلي في Codex، وتشكيل حمولة توافق الاستدلال، وإدارة سياق Responses | `openai` |
    | `openrouter-thinking` | غلاف استدلال OpenRouter لمسارات الوكيل، مع معالجة تخطّي النماذج غير المدعومة و`auto` مركزيًا | `openrouter` |
    | `tool-stream-default-on` | غلاف `tool_stream` مفعّل افتراضيًا لموفّرين مثل Z.AI الذين يريدون تدفق الأدوات ما لم يُعطّل صراحةً | `zai` |

    <Accordion title="واجهات SDK التي تشغّل أدوات بناء العائلات">
      تتكون أداة بناء كل عائلة من مساعدات عامة منخفضة المستوى مُصدّرة من الحزمة نفسها، ويمكنك استخدامها عندما يحتاج الموفّر إلى الخروج عن النمط الشائع:

      - `openclaw/plugin-sdk/provider-model-shared` - ‏`ProviderReplayFamily` و`buildProviderReplayFamilyHooks(...)` وأدوات بناء إعادة التشغيل الأولية (`buildOpenAICompatibleReplayPolicy`، و`buildAnthropicReplayPolicyForModel`، و`buildGoogleGeminiReplayPolicy`، و`buildHybridAnthropicOrOpenAIReplayPolicy`). وتُصدّر أيضًا مساعدات إعادة تشغيل Gemini ‏(`sanitizeGoogleGeminiReplayHistory`، و`resolveTaggedReasoningOutputMode`) ومساعدات نقطة النهاية/النموذج (`resolveProviderEndpoint`، و`normalizeProviderId`، و`normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` - ‏`ProviderStreamFamily`، و`buildProviderStreamFamilyHooks(...)`، و`composeProviderStreamWrappers(...)`، بالإضافة إلى أغلفة OpenAI/Codex المشتركة (`createOpenAIAttributionHeadersWrapper`، و`createOpenAIFastModeWrapper`، و`createOpenAIServiceTierWrapper`، و`createOpenAIResponsesContextManagementWrapper`، و`createCodexNativeWebSearchWrapper`)، وغلاف DeepSeek V4 المتوافق مع OpenAI ‏(`createDeepSeekV4OpenAICompatibleThinkingWrapper`)، وتنظيف الملء المسبق للتفكير في رسائل Anthropic ‏(`createAnthropicThinkingPrefillPayloadWrapper`)، وتوافق استدعاء الأدوات بالنص العادي (`createPlainTextToolCallCompatWrapper`)، وأغلفة الوكيل/الموفّر المشتركة (`createOpenRouterWrapper`، و`createToolStreamWrapper`، و`createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` - أغلفة خفيفة للحمولات والأحداث لمسارات الموفّرين الساخنة، بما في ذلك `createOpenAICompatibleCompletionsThinkingOffWrapper`، و`createPayloadPatchStreamWrapper`، و`createPlainTextToolCallCompatWrapper`، و`normalizeOpenAICompatibleReasoningPayload(...)`، و`setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` - ‏`ProviderToolCompatFamily`، و`buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")`، ومساعدات مخطط الموفّر الأساسية.

      بالنسبة إلى موفّري عائلة Gemini، حافظ على توافق وضع خرج الاستدلال مع
      وسيلة النقل. يجب أن يستخدم موفّرو Google Gemini API المباشرون خرج استدلال
      `native` حتى يستهلك OpenClaw أجزاء الأفكار الأصلية دون إضافة
      توجيهات المطالبة `<think>` / `<final>`. ويمكن للواجهات الخلفية النصية فقط
      المشابهة لـ Gemini CLI، التي تحلّل استجابة JSON/نص نهائية، الاحتفاظ بعقد
      `google-gemini` الموسوم المشترك.

      تظل بعض مساعدات التدفق محلية لدى الموفّر عن قصد. يحتفظ `@openclaw/anthropic-provider` بـ `wrapAnthropicProviderStream`، و`resolveAnthropicBetas`، و`resolveAnthropicFastMode`، و`resolveAnthropicServiceTier`، وأدوات بناء أغلفة Anthropic منخفضة المستوى ضمن واجهة `api.ts` / `contract-api.ts` العامة الخاصة به، لأنها ترمّز معالجة إصدار OAuth التجريبي لـ Claude وتقييد `context1m`. وبالمثل، يحتفظ Plugin ‏xAI بتشكيل Responses الأصلي الخاص بـ xAI داخل `wrapStreamFn` الخاص به (الأسماء البديلة لـ `/fast`، و`tool_stream` الافتراضي، وتنظيف الأدوات الصارمة غير المدعومة، وإزالة حمولة الاستدلال الخاصة بـ xAI).

      يدعم نمط جذر الحزمة نفسه أيضًا `@openclaw/openai-provider` (أدوات بناء الموفّر، ومساعدات النموذج الافتراضي، وأدوات بناء موفّر الوقت الفعلي) و`@openclaw/openrouter-provider` (أداة بناء الموفّر بالإضافة إلى مساعدات الإعداد الأولي/الإعداد).
    </Accordion>

    <Tabs>
      <Tab title="تبادل الرمز المميز">
        للموفّرين الذين يحتاجون إلى تبادل رمز مميز قبل كل استدعاء استدلال:

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
        للموفّرين الذين يحتاجون إلى ترويسات طلب مخصصة أو تعديلات على المتن:

        ```typescript
        // تُرجع wrapStreamFn دالة StreamFn مشتقة من ctx.streamFn
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
        للموفّرين الذين يحتاجون إلى ترويسات أو بيانات وصفية أصلية للطلب/الجلسة على
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
        بالنسبة إلى المزوّدين الذين يعرضون بيانات الاستخدام/الفوترة:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        لدى `resolveUsageAuth` ثلاث نتائج. أعد
        `{ token, accountId?, subscriptionType?, rateLimitTier? }` عندما يمتلك
        المزوّد بيانات اعتماد للاستخدام/الفوترة (تنقل الحقول الاختيارية بيانات
        تعريفية غير سرية عن الخطة من ملف التعريف الذي جرى حله إلى
        `fetchUsageSnapshot`). أعد
        `{ handled: true }` فقط عندما يكون المزوّد قد عالج مصادقة الاستخدام
        بشكل قاطع، لكنه لا يمتلك رمز استخدام صالحًا، ويجب على OpenClaw تخطي
        الرجوع العام إلى مفتاح API/OAuth. أعد `null` أو `undefined` عندما لا
        يعالج المزوّد الطلب ويجب على OpenClaw متابعة الرجوع العام.

        صرّح بمعرّف المزوّد في `contracts.usageProviders`. عند وجود عقد البيان
        هذا و**كلا** الخطافين، يضمّن OpenClaw المزوّد تلقائيًا في جمع بيانات
        الاستخدام دون تحميل Plugins مزوّدين غير مرتبطة. لا يلزم تحديث قائمة
        السماح في النواة.
        تُرجع `fetchUsageSnapshot` البنية المشتركة المحايدة تجاه المزوّد:

        - `plan`: الاشتراك أو تسمية المفتاح كما أبلغ عنها المزوّد
        - `windows`: نوافذ الحصة القابلة لإعادة الضبط كنسب مئوية مستخدمة
        - `billing`: إدخالات ذات أنواع محددة من `balance` أو `spend` أو `budget`؛ يمكن أن تكون `unit`
          عملة وفق معيار ISO أو وحدة خاصة بالمزوّد مثل `credits`
        - `summary`: سياق موجز خاص بالمزوّد لا يتناسب مع تلك
          الحقول المنظمة

        حافظ على دلالات العملة بدقة. رصيد المزوّد ليس بالدولار الأمريكي ما لم
        ينص عقد المصدر على ذلك. يظل Plugin الذي ينفّذ
        `fetchUsageSnapshot` فقط متاحًا للمستدعين الصريحين/الاصطناعيين، لكن
        لا يُكتشف تلقائيًا، لأن OpenClaw لا يستطيع حل بيانات اعتماد الاستخدام الخاصة به.
      </Tab>
    </Tabs>

    <Accordion title="خطافات المزوّد الشائعة">
      يستدعي OpenClaw الخطافات بهذا الترتيب تقريبًا في Plugins النماذج/المزوّدين.
      يستخدم معظم المزوّدين خطافين أو ثلاثة فقط. هذه ليست واجهة `ProviderPlugin`
      الكاملة - راجع [التفاصيل الداخلية: خطافات وقت تشغيل
      المزوّد](/ar/plugins/architecture-internals#provider-runtime-hooks) للاطلاع على
      القائمة الكاملة والدقيقة حاليًا للخطافات وملاحظات الرجوع.
      لا تُدرج هنا حقول المزوّد المخصصة للتوافق فقط التي لم يعد OpenClaw يستدعيها، مثل
      `ProviderPlugin.capabilities` و`suppressBuiltInModel`.

      | الخطاف | متى يُستخدم |
      | --- | --- |
      | `catalog` | كتالوج النماذج أو القيم الافتراضية لعنوان URL الأساسي |
      | `applyConfigDefaults` | القيم الافتراضية العامة المملوكة للمزوّد أثناء تجسيد الإعداد |
      | `normalizeModelId` | تنظيف الأسماء البديلة لمعرّف النموذج القديم/التجريبي قبل البحث |
      | `normalizeTransport` | تنظيف `api` / `baseUrl` لعائلة المزوّد قبل تجميع النموذج العام |
      | `normalizeConfig` | تسوية إعداد `models.providers.<id>` |
      | `applyNativeStreamingUsageCompat` | عمليات إعادة كتابة توافق الاستخدام المتدفق الأصلي لمزوّدي الإعداد |
      | `resolveConfigApiKey` | حل المصادقة بعلامة متغير البيئة المملوكة للمزوّد |
      | `resolveSyntheticAuth` | مصادقة اصطناعية محلية/ذاتية الاستضافة أو مدعومة بالإعداد |
      | `resolveExternalAuthProfiles` | تراكب ملفات تعريف المصادقة الخارجية المملوكة للمزوّد لبيانات الاعتماد المُدارة بواسطة CLI/التطبيق |
      | `shouldDeferSyntheticProfileAuth` | خفض أولوية العناصر النائبة الاصطناعية لملفات التعريف المخزنة خلف مصادقة البيئة/الإعداد |
      | `resolveDynamicModel` | قبول معرّفات نماذج عشوائية من المصدر |
      | `prepareDynamicModel` | جلب البيانات التعريفية غير المتزامن قبل الحل |
      | `normalizeResolvedModel` | عمليات إعادة كتابة النقل قبل المُشغّل |
      | `normalizeToolSchemas` | تنظيف مخطط الأدوات المملوك للمزوّد قبل التسجيل |
      | `inspectToolSchemas` | تشخيصات مخطط الأدوات المملوكة للمزوّد |
      | `resolveReasoningOutputMode` | عقد مخرجات الاستدلال الموسومة مقابل الأصلية |
      | `prepareExtraParams` | معاملات الطلب الافتراضية |
      | `createStreamFn` | نقل `StreamFn` مخصص بالكامل |
      | `wrapStreamFn` | أغلفة مخصصة للترويسات/النص على مسار التدفق العادي |
      | `resolveTransportTurnState` | الترويسات/البيانات التعريفية الأصلية لكل دور |
      | `resolveWebSocketSessionPolicy` | ترويسات جلسة WS الأصلية/فترة التهدئة |
      | `formatApiKey` | بنية رمز وقت التشغيل المخصصة |
      | `refreshOAuth` | تحديث OAuth مخصص |
      | `buildAuthDoctorHint` | إرشادات إصلاح المصادقة |
      | `matchesContextOverflowError` | اكتشاف تجاوز السعة المملوك للمزوّد |
      | `classifyFailoverReason` | تصنيف تحديد المعدل/الحمل الزائد المملوك للمزوّد |
      | `isCacheTtlEligible` | بوابة مدة البقاء لذاكرة التخزين المؤقت للموجّه |
      | `buildMissingAuthMessage` | تلميح مخصص للمصادقة المفقودة |
      | `augmentModelCatalog` | صفوف اصطناعية للتوافق المستقبلي (مهمل - يُفضّل `registerModelCatalogProvider`) |
      | `resolveThinkingProfile` | مجموعة خيارات `/think` الخاصة بالنموذج |
      | `isBinaryThinking` | توافق تشغيل/إيقاف التفكير الثنائي (مهمل - يُفضّل `resolveThinkingProfile`) |
      | `supportsXHighThinking` | توافق دعم الاستدلال `xhigh` (مهمل - يُفضّل `resolveThinkingProfile`) |
      | `resolveDefaultThinkingLevel` | توافق سياسة `/think` الافتراضية (مهمل - يُفضّل `resolveThinkingProfile`) |
      | `isModernModelRef` | مطابقة النموذج المباشر/الاختباري |
      | `prepareRuntimeAuth` | تبادل الرمز قبل الاستدلال |
      | `resolveUsageAuth` | تحليل مخصص لبيانات اعتماد الاستخدام |
      | `fetchUsageSnapshot` | نقطة نهاية مخصصة للاستخدام |
      | `createEmbeddingProvider` | محوّل التضمين المملوك للمزوّد للذاكرة/البحث |
      | `buildReplayPolicy` | سياسة مخصصة لإعادة تشغيل النص/Compaction |
      | `sanitizeReplayHistory` | عمليات إعادة كتابة لإعادة التشغيل خاصة بالمزوّد بعد التنظيف العام |
      | `validateReplayTurns` | تحقق صارم من أدوار إعادة التشغيل قبل المُشغّل المضمّن |
      | `onModelSelected` | رد نداء بعد التحديد (مثل القياس عن بُعد) |

      ملاحظات الرجوع في وقت التشغيل:

      - يحل `normalizeConfig` Plugin مالكًا واحدًا لكل معرّف مزوّد (المزوّدون المضمّنون أولًا، ثم Plugin وقت التشغيل المطابق) ويستدعي ذلك الخطاف فقط - لا يوجد مسح عبر المزوّدين الآخرين. خطاف `normalizeConfig` الخاص بـ Google هو الذي يسوّي إدخالات إعداد `google` / `google-vertex` / `google-antigravity`؛ وليس رجوعًا منفصلًا في النواة.
      - يستخدم `resolveConfigApiKey` خطاف المزوّد عند عرضه. يحتفظ Amazon Bedrock بحل علامات متغيرات بيئة AWS في Plugin المزوّد الخاص به؛ بينما تظل مصادقة وقت التشغيل نفسها تستخدم سلسلة AWS SDK الافتراضية عند إعدادها باستخدام `auth: "aws-sdk"`.
      - يتلقى `resolveThinkingProfile(ctx)` قيم `provider` و`modelId` المحددتين، وتلميح كتالوج `reasoning` المدمج الاختياري، وحقائق `compat` الاختيارية المدمجة للنموذج. استخدم `compat` فقط لتحديد واجهة/ملف تعريف التفكير الخاص بالمزوّد.
      - يتيح `resolveSystemPromptContribution` للمزوّد إدخال إرشادات لموجّه النظام تراعي ذاكرة التخزين المؤقت لعائلة نماذج. فضّله على خطاف `before_prompt_build` القديم على مستوى Plugin بالكامل عندما يخص السلوك مزوّدًا/عائلة نماذج واحدة، ويجب أن يحافظ على الفصل المستقر/الديناميكي لذاكرة التخزين المؤقت.

    </Accordion>

  </Step>

  <Step title="إضافة إمكانات إضافية (اختياري)">
    ### الخطوة 5: إضافة إمكانات إضافية

    يمكن لـ Plugin المزوّد تسجيل التضمينات، والكلام، والنسخ في الوقت الفعلي،
    والصوت في الوقت الفعلي، وفهم الوسائط، وتوليد الصور، وتوليد الفيديو،
    وجلب الويب، والبحث في الويب إلى جانب استدلال النص. يصنّف OpenClaw هذا على أنه
    Plugin ذا **إمكانات هجينة** - وهو النمط الموصى به لـ Plugins الشركات
    (Plugin واحد لكل مورّد). راجع
    [التفاصيل الداخلية: ملكية الإمكانات](/ar/plugins/architecture#capability-ownership-model).

    سجّل كل إمكانية داخل `register(api)` إلى جانب استدعاء
    `api.registerProvider(...)` الموجود لديك. اختر علامات التبويب التي تحتاج إليها فقط:

    <Tabs>
      <Tab title="الكلام (تحويل النص إلى كلام)">
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

        استخدم `assertOkOrThrowProviderError(...)` لإخفاقات HTTP الخاصة بالمزوّد كي
        تشترك Plugins في قراءات نص الخطأ المحدودة، وتحليل أخطاء JSON، ولواحق
        معرّف الطلب.
      </Tab>
      <Tab title="النسخ في الوقت الفعلي">
        فضّل `createRealtimeTranscriptionWebSocketSession(...)` - إذ يتولى
        المساعد المشترك التقاط الوكيل، والتراجع عند إعادة الاتصال، وتفريغ البيانات عند الإغلاق، ومصافحات
        الجاهزية، ووضع الصوت في قائمة الانتظار، وتشخيصات أحداث الإغلاق. لا يفعل Plugin الخاص بك
        سوى ربط أحداث المصدر.

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

        يجب على موفّري تحويل الكلام إلى نص بالدُفعات الذين يرسلون الصوت متعدد الأجزاء عبر POST استخدام
        `buildAudioTranscriptionFormData(...)` من
        `openclaw/plugin-sdk/provider-http`. تعمل الدالة المساعدة على توحيد
        أسماء ملفات الرفع، بما في ذلك ملفات AAC التي تحتاج إلى اسم ملف بنمط M4A
        لتتوافق مع واجهات API الخاصة بتحويل الكلام إلى نص.
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
            handlesInputAudioBargeIn: true,
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

        صرّح عن `capabilities` كي يتمكن `talk.catalog` من عرض الأوضاع
        ووسائل النقل وتنسيقات الصوت وعلامات الميزات الصالحة لعملاء Talk
        في المتصفح والعملاء الأصليين. نفّذ `handleBargeIn` عندما تتمكن وسيلة
        النقل من اكتشاف أن شخصًا يقاطع تشغيل رد المساعد، ويكون الموفّر قادرًا
        على اقتطاع الاستجابة الصوتية النشطة أو مسحها.
        قد تعيد `submitToolResult` القيمة `void` للإرسال المتزامن، أو
        `Promise<void>` لحدّ إكمال غير متزامن يمكن لجسر الموفّر
        عرضه. تنتظر جلسات ترحيل Gateway ذلك الوعد قبل
        تأكيد النتيجة النهائية أو مسح التشغيل المرتبط؛ ارفضه عند
        فشل الإرسال.
        اضبط `supportsToolResultSuppression: false` عندما يتعذر على الموفّر
        الالتزام بالخيار `options.suppressResponse`. عندها يتجنب OpenClaw الكبت
        لنتائج الاستشارة الداخلية القسرية والإلغاء، ويرفض طلبات
        النتائج المكبوتة المباشرة بدلًا من بدء استجابة ضمنيًا.
        وبالمثل، يمكن لمستخدمي `createRealtimeVoiceBridgeSession` إعادة
        وعد من `onToolCall`؛ وتُوجَّه الاستثناءات المتزامنة وحالات الرفض
        إلى رد النداء `onError` الخاص بالجلسة.
        لا تضبط `handlesInputAudioBargeIn` إلا عندما يؤكد VAD الخاص بالموفّر
        حدوث مقاطعة عبر استدعاء `onClearAudio("barge-in")`. يستخدم الموفّرون
        الذين لا يحددون هذه العلامة آلية الكشف الاحتياطية المحلية في OpenClaw
        لمقاطعة صوت الإدخال.
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

        يمكن لموفّري الوسائط المحليين أو المستضافين ذاتيًا الذين لا يتطلبون
        بيانات اعتماد عمدًا عرض `resolveAuth` وإعادة `kind: "none"`.
        يواصل OpenClaw تطبيق بوابة المصادقة المعتادة على الموفّرين الذين لا
        يختارون ذلك صراحةً. يمكن للموفّرين الحاليين مواصلة قراءة `req.apiKey`؛
        وينبغي للموفّرين الجدد تفضيل `req.auth`.

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

        صرّح عن المعرّف نفسه في `contracts.embeddingProviders`. هذا هو
        العقد العام للتضمين من أجل إنشاء متجهات قابلة لإعادة الاستخدام، بما في ذلك
        البحث في الذاكرة. يُعد `registerMemoryEmbeddingProvider(...)` توافقًا
        مهمَلًا للمحوّلات الحالية الخاصة بالذاكرة.
      </Tab>
      <Tab title="Image and video generation">
        تستخدم إمكانات الصور والفيديو بنية **مراعية للوضع**. يصرّح موفّرو
        الصور عن كتلتي الإمكانات الإلزاميتين `generate` و`edit`؛
        ويصرّح موفّرو الفيديو عن `generate` و`imageToVideo` و
        `videoToVideo`. لا تكفي الحقول التجميعية المسطحة مثل `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` للإعلان بوضوح عن
        دعم أوضاع التحويل أو الأوضاع المعطّلة. يتبع توليد الموسيقى
        النمط نفسه `generate` / `edit`.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          capabilities: {
            generate: { maxCount: 4, supportsSize: true },
            edit: { enabled: false },
          },
          generateImage: async (req) => ({ images: [] }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          defaultTimeoutMs: 600_000,
          models: ["acme-video", "acme-image-video"],
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
          catalogByModel: {
            "acme-image-video": {
              modes: ["imageToVideo"],
              capabilities: {
                imageToVideo: {
                  enabled: true,
                  maxVideos: 1,
                  maxInputImages: 1,
                  resolutions: ["480P", "720P", "1080P"],
                  supportsResolution: true,
                },
                videoToVideo: { enabled: false },
              },
            },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```

        يلزم تحديد `capabilities` في كلا نوعي الموفّرين؛ ويجب دائمًا
        أن تتضمن `edit` وكتلتا تحويل الفيديو (`imageToVideo` و`videoToVideo`)
        علامة `enabled` صريحة.

        استخدم `catalogByModel` عندما تختلف الأوضاع أو الإمكانات الثابتة
        لنموذج مُدرج عن الإعدادات الافتراضية للموفّر. تحافظ هذه البيانات الوصفية على
        دقة `video_generate action=list` وكتالوجات النماذج من دون
        استدعاء شيفرة الموفّر. يظل البحث عن الإمكانات وفرضها وقت الطلب
        من مسؤولية `resolveModelCapabilities` و`generateVideo`؛ وأعد استخدام
        ثابت الإمكانات نفسه في كلا المسارين متى أمكن.
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
          hint: "Search the web through Acme's search backend.",
          envVars: ["ACME_SEARCH_API_KEY"],
          placeholder: "acme-...",
          signupUrl: "https://acme.example.com/search",
          credentialPath: "plugins.entries.acme.config.webSearch.apiKey",
          getCredentialValue: (searchConfig) => searchConfig?.acme?.apiKey,
          setCredentialValue: (searchConfigTarget, value) => {
            const acme = (searchConfigTarget.acme ??= {});
            acme.apiKey = value;
          },
          createTool: () => ({
            description: "Search the web through Acme Search.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });
        ```

        يشترك كلا نوعي الموفّرين في البنية نفسها لربط بيانات الاعتماد:
        `hint` و`envVars` و`placeholder` و`signupUrl` و`credentialPath`
        و`getCredentialValue` و`setCredentialValue` و`createTool`
        جميعها مطلوبة.
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

تُنشر Plugins الخاصة بالموفّرين بالطريقة نفسها المتبعة لنشر أي Plugin شيفرة خارجي آخر:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

يُعد `clawhub skill publish <path>` أمرًا مختلفًا لنشر مجلد skill،
وليس حزمة Plugin؛ فلا تستخدمه هنا.

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

يتحكم `catalog.order` في توقيت دمج كتالوجك مقارنةً بالموفّرين
المدمجين:

| الترتيب  | التوقيت              | حالة الاستخدام                                      |
| --------- | -------------------- | --------------------------------------------------- |
| `simple`  | المرور الأول         | موفّرو مفاتيح API البسيطون                          |
| `profile` | بعد `simple`         | الموفّرون المقيّدون بملفات تعريف المصادقة           |
| `paired`  | بعد `profile`        | إنشاء عدة إدخالات مترابطة                           |
| `late`    | المرور الأخير        | تجاوز الموفّرين الحاليين (يفوز عند حدوث تعارض)      |

## الخطوات التالية

- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) - إذا كان Plugin الخاص بك يوفّر قناة أيضًا
- [وقت تشغيل SDK](/ar/plugins/sdk-runtime) - أدوات `api.runtime` المساعدة (تحويل النص إلى كلام، والبحث، والوكيل الفرعي)
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) - مرجع كامل للاستيراد من المسارات الفرعية
- [التفاصيل الداخلية للـ Plugin](/ar/plugins/architecture-internals#provider-runtime-hooks) - تفاصيل الخطافات والأمثلة المضمّنة

## ذو صلة

- [إعداد SDK الخاص بالـ Plugin](/ar/plugins/sdk-setup)
- [إنشاء Plugins](/ar/plugins/building-plugins)
- [إنشاء Plugins القنوات](/ar/plugins/sdk-channel-plugins)
