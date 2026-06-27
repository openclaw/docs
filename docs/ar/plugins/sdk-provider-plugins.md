---
read_when:
    - أنت تبني Plugin جديدًا لموفّر نماذج
    - تريد إضافة وكيل متوافق مع OpenAI أو LLM مخصص إلى OpenClaw
    - تحتاج إلى فهم مصادقة المزوّد، والكتالوجات، وخطّافات وقت التشغيل
sidebarTitle: Provider plugins
summary: دليل خطوة بخطوة لإنشاء Plugin موفّر نماذج لـ OpenClaw
title: بناء Plugins لمزوّدي الخدمة
x-i18n:
    generated_at: "2026-06-27T18:18:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05ac4d08eae00e7e0fcf03edea691dc9ced7309421dd19a31edf69cee1e01f0b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

يرشدك هذا الدليل خلال بناء Plugin موفّر يضيف موفّر نماذج
(LLM) إلى OpenClaw. في النهاية سيكون لديك موفّر يتضمن فهرس نماذج،
ومصادقة بمفتاح API، وحلًّا ديناميكيًا للنماذج.

<Info>
  إذا لم تبنِ أي OpenClaw Plugin من قبل، فاقرأ
  [بدء الاستخدام](/ar/plugins/building-plugins) أولًا لمعرفة بنية الحزمة
  الأساسية وإعداد البيان.
</Info>

<Tip>
  تضيف Plugins الموفّرات نماذج إلى حلقة الاستدلال العادية في OpenClaw. إذا كان
  النموذج يجب أن يعمل عبر عفريت وكيل أصلي يملك السلاسل، أو Compaction، أو أحداث
  الأدوات، فاقرن الموفّر مع [حزمة وكيل](/ar/plugins/sdk-agent-harness)
  بدلًا من وضع تفاصيل بروتوكول العفريت في النواة.
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

    يصرّح البيان بـ `setup.providers[].envVars` حتى يتمكن OpenClaw من اكتشاف
    بيانات الاعتماد دون تحميل وقت تشغيل Plugin. أضف `providerAuthAliases`
    عندما ينبغي لمتغير موفّر أن يعيد استخدام مصادقة معرّف موفّر آخر. `modelSupport`
    اختياري، ويتيح لـ OpenClaw تحميل Plugin الموفّر تلقائيًا من معرّفات نماذج
    مختصرة مثل `acme-large` قبل وجود خطافات وقت التشغيل. إذا نشرت الموفّر
    على ClawHub، فحقلا `openclaw.compat` و`openclaw.build` مطلوبان
    في `package.json`.

  </Step>

  <Step title="Register the provider">
    يحتاج موفّر النصوص الأدنى إلى `id` و`label` و`auth` و`catalog`.
    `catalog` هو خطاف وقت التشغيل/الإعدادات الذي يملكه الموفّر؛ ويمكنه استدعاء
    واجهات API الحية للبائع وإرجاع إدخالات `models.providers`.

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

    `registerModelCatalogProvider` هو سطح فهرس مستوى التحكم الأحدث
    لواجهة مستخدم القائمة/المساعدة/المنتقي. استخدمه لصفوف النصوص، وتوليد الصور،
    وتوليد الفيديو، وتوليد الموسيقى. أبقِ استدعاءات نقاط نهاية البائع وتخطيط
    الاستجابات داخل Plugin؛ يملك OpenClaw شكل الصف المشترك، وتسميات المصدر،
    وعرض المساعدة.

    هذا موفّر عامل. يمكن للمستخدمين الآن تشغيل
    `openclaw onboard --acme-ai-api-key <key>` واختيار
    `acme-ai/acme-large` كنموذجهم.

    ### اكتشاف النماذج الحية

    إذا كان موفّرك يعرض API بنمط `/models`، فأبقِ نقطة النهاية الخاصة بالموفّر
    وإسقاط الصفوف داخل Plugin الخاص بك، واستخدم
    `openclaw/plugin-sdk/provider-catalog-live-runtime` لدورة حياة الجلب
    المشتركة. يمنحك المساعد جلب HTTP محميًا، وترويسات مصادقة الموفّر،
    وأخطاء HTTP مهيكلة، وتخزينًا مؤقتًا بمدة TTL، وسلوك رجوع ثابتًا دون
    وضع سياسة الموفّر في نواة OpenClaw.

    استخدم `buildLiveModelProviderConfig` عندما تخبرك API الحية فقط بأي صفوف
    الفهرس الثابتة التي يملكها الموفّر والمتاحة حاليًا:

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

    استخدم `getCachedLiveProviderModelRows` عندما تعيد API الخاصة بالموفّر
    بيانات وصفية أغنى ويحتاج Plugin إلى إسقاط الصفوف إلى تعريفات نماذج
    OpenClaw بنفسه:

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

    ينبغي أن يظل `run` محكومًا بالمصادقة وأن يعيد `null` عندما لا تتوفر
    بيانات اعتماد قابلة للاستخدام. أبقِ `staticRun` غير متصل أو رجوعًا ثابتًا
    حتى لا تعتمد أسطح الإعداد، والوثائق، والاختبارات، والمنتقي على وصول حي
    إلى الشبكة. استخدم TTL مناسبة لحداثة قائمة النماذج، وتجنب استطلاع نظام
    الملفات وقت الطلب، ومرّر `readRows` / `readModelId` خاصًا بالموفّر فقط
    عندما لا تكون استجابة المصدر بشكل متوافق مع OpenAI مثل
    `{ data: [{ id, object }] }`.

    إذا كان الموفّر الأصلي يستخدم رموز تحكم مختلفة عن OpenClaw، فأضف تحويلًا
    نصيًا صغيرًا ثنائي الاتجاه بدلًا من استبدال مسار البث:

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
    النقل. يعيد `output` كتابة دلتا نص المساعد والنص النهائي قبل أن يحلل
    OpenClaw علامات التحكم الخاصة به أو تسليم القناة.

    بالنسبة إلى الموفّرين المضمّنين الذين يسجلون موفّر نصوص واحدًا فقط مع
    مصادقة مفتاح API إضافة إلى وقت تشغيل واحد مدعوم بالفهرس، فضّل المساعد
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

    `buildProvider` هو مسار الكتالوج الحي المستخدم عندما يستطيع OpenClaw حلّ
    مصادقة المزوّد الحقيقية. وقد ينفّذ اكتشافًا خاصًا بالمزوّد. استخدم
    `buildStaticProvider` فقط للصفوف غير المتصلة الآمنة للعرض قبل تهيئة المصادقة؛
    ويجب ألا يتطلب بيانات اعتماد أو يجري طلبات شبكة. عرض `models list --all`
    في OpenClaw ينفّذ حاليًا الكتالوجات الثابتة فقط من أجل Plugins المزوّدين
    المضمّنة، مع إعدادات فارغة، وبيئة فارغة، ودون مسارات وكيل/مساحة عمل.

    إذا كان تدفق المصادقة لديك يحتاج أيضًا إلى تصحيح `models.providers.*`، والأسماء
    المستعارة، والنموذج الافتراضي للوكيل أثناء الإعداد، فاستخدم مساعدات الإعداد
    المسبق من `openclaw/plugin-sdk/provider-onboard`. أضيق المساعدات نطاقًا هي
    `createDefaultModelPresetAppliers(...)`،
    و`createDefaultModelsPresetAppliers(...)`، و
    `createModelCatalogPresetAppliers(...)`.

    عندما تدعم نقطة النهاية الأصلية لمزوّد كتل استخدام متدفقة على ناقل
    `openai-completions` العادي، ففضّل مساعدات الكتالوج المشتركة في
    `openclaw/plugin-sdk/provider-catalog-shared` بدلًا من ترميز فحوصات معرّف
    المزوّد مباشرة. يكتشف `supportsNativeStreamingUsageCompat(...)` و
    `applyProviderNativeStreamingUsageCompat(...)` الدعم من خريطة قدرات نقطة
    النهاية، لذلك تظل نقاط النهاية الأصلية بأسلوب Moonshot/DashScope مشتركة حتى
    عندما يستخدم Plugin معرّف مزوّد مخصصًا.

    تغطي أمثلة الاكتشاف الحي أعلاه واجهات API للمزوّدين بأسلوب `/models`. أبقِ
    ذلك الاكتشاف داخل `catalog.run`، محكومًا بمصادقة قابلة للاستخدام، وأبقِ
    `staticRun` بلا شبكة لتوليد الكتالوج دون اتصال.

  </Step>

  <Step title="Add dynamic model resolution">
    إذا كان مزوّدك يقبل معرّفات نماذج عشوائية (مثل وكيل وسيط أو موجّه)،
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
    غير المتزامن - إذ يعمل `resolveDynamicModel` مرة أخرى بعد اكتماله.

  </Step>

  <Step title="Add runtime hooks (as needed)">
    لا يحتاج معظم المزوّدين إلا إلى `catalog` + `resolveDynamicModel`. أضف الخطافات
    تدريجيًا بحسب ما يتطلبه مزوّدك.

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

    | العائلة | ما الذي تربطه | أمثلة مضمّنة |
    | --- | --- | --- |
    | `openai-compatible` | سياسة إعادة تشغيل مشتركة بأسلوب OpenAI للنواقل المتوافقة مع OpenAI، بما في ذلك تنظيف معرّف استدعاء الأداة، وإصلاحات ترتيب المساعد أولًا، والتحقق العام من أدوار Gemini حيث يحتاج الناقل إلى ذلك | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | سياسة إعادة تشغيل واعية بـ Claude تُختار بواسطة `modelId`، بحيث لا تحصل نواقل رسائل Anthropic إلا على تنظيف كتل التفكير الخاص بـ Claude عندما يكون النموذج المحلول فعلًا معرّف Claude | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | سياسة إعادة تشغيل Gemini الأصلية إضافة إلى تنظيف إعادة تشغيل التمهيد. تُبقي العائلة المشتركة Gemini CLI ذي مخرجات النص على الاستدلال الموسوم؛ ويتجاوز مزوّد `google` المباشر `resolveReasoningOutputMode` إلى `native` لأن تفكير Gemini API يصل كأجزاء تفكير أصلية. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | تنظيف توقيع التفكير في Gemini لنماذج Gemini العاملة عبر نواقل وكيل متوافقة مع OpenAI؛ ولا يفعّل تحقق إعادة تشغيل Gemini الأصلي أو إعادة كتابة التمهيد | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | سياسة هجينة للمزوّدين الذين يمزجون أسطح نماذج رسائل Anthropic والمتوافقة مع OpenAI في Plugin واحد؛ ويظل إسقاط كتل التفكير الاختياري الخاص بـ Claude محصورًا في جانب Anthropic | `minimax` |

    عائلات البث المتاحة اليوم:

    | العائلة | ما الذي تربطه | أمثلة مضمّنة |
    | --- | --- | --- |
    | `google-thinking` | تطبيع حمولة تفكير Gemini على مسار البث المشترك | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | غلاف استدلال Kilo على مسار بث الوكيل المشترك، مع تخطي `kilo/auto` ومعرّفات استدلال الوكيل غير المدعومة للتفكير المُحقن | `kilocode` |
    | `moonshot-thinking` | ربط حمولة التفكير الأصلي الثنائية في Moonshot من الإعداد + مستوى `/think` | `moonshot` |
    | `minimax-fast-mode` | إعادة كتابة نموذج الوضع السريع في MiniMax على مسار البث المشترك | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | أغلفة Responses الأصلية المشتركة لـ OpenAI/Codex: ترويسات الإسناد، و`/fast`/`serviceTier`، وإسهاب النص، وبحث الويب الأصلي في Codex، وتشكيل حمولة توافق الاستدلال، وإدارة سياق Responses | `openai` |
    | `openrouter-thinking` | غلاف استدلال OpenRouter لمسارات الوكيل، مع معالجة تخطيات النماذج غير المدعومة/`auto` مركزيًا | `openrouter` |
    | `tool-stream-default-on` | غلاف `tool_stream` مفعّل افتراضيًا للمزوّدين مثل Z.AI الذين يريدون بث الأدوات ما لم يُعطّل صراحةً | `zai` |

    <Accordion title="SDK seams powering the family builders">
      يتكوّن كل باني عائلة من مساعدات عامة أدنى مستوى مُصدّرة من الحزمة نفسها، ويمكنك استخدامها عندما يحتاج مزوّد إلى الخروج عن النمط الشائع:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`، و`buildProviderReplayFamilyHooks(...)`، وبُناة إعادة التشغيل الخام (`buildOpenAICompatibleReplayPolicy`، و`buildAnthropicReplayPolicyForModel`، و`buildGoogleGeminiReplayPolicy`، و`buildHybridAnthropicOrOpenAIReplayPolicy`). يصدّر أيضًا مساعدات إعادة تشغيل Gemini (`sanitizeGoogleGeminiReplayHistory`، و`resolveTaggedReasoningOutputMode`) ومساعدات نقطة النهاية/النموذج (`resolveProviderEndpoint`، و`normalizeProviderId`، و`normalizeGooglePreviewModelId`).
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`، و`buildProviderStreamFamilyHooks(...)`، و`composeProviderStreamWrappers(...)`، إضافة إلى أغلفة OpenAI/Codex المشتركة (`createOpenAIAttributionHeadersWrapper`، و`createOpenAIFastModeWrapper`، و`createOpenAIServiceTierWrapper`، و`createOpenAIResponsesContextManagementWrapper`، و`createCodexNativeWebSearchWrapper`)، وغلاف DeepSeek V4 المتوافق مع OpenAI (`createDeepSeekV4OpenAICompatibleThinkingWrapper`)، وتنظيف التمهيد المسبق لتفكير رسائل Anthropic (`createAnthropicThinkingPrefillPayloadWrapper`)، وتوافق استدعاء أدوات النص العادي (`createPlainTextToolCallCompatWrapper`)، وأغلفة الوكيل/المزوّد المشتركة (`createOpenRouterWrapper`، و`createToolStreamWrapper`، و`createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` - أغلفة خفيفة للحمولة والأحداث لمسارات المزوّد الساخنة، بما في ذلك `createOpenAICompatibleCompletionsThinkingOffWrapper`، و`createPayloadPatchStreamWrapper`، و`createPlainTextToolCallCompatWrapper`، و`normalizeOpenAICompatibleReasoningPayload(...)`، و`setQwenChatTemplateThinking(...)`.
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`، و`buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")`، ومساعدات مخطط المزوّد الأساسية.

      بالنسبة إلى مزوّدي عائلة Gemini، أبقِ وضع مخرجات الاستدلال متوافقًا مع
      الناقل. ينبغي لمزوّدي Google Gemini API المباشرين استخدام مخرجات استدلال
      `native` كي يستهلك OpenClaw أجزاء التفكير الأصلية دون إضافة توجيهات مطالبة
      `<think>` / `<final>`. ويمكن للخلفيات النصية فقط بأسلوب Gemini CLI التي
      تحلل استجابة JSON/نص نهائية أن تبقي عقد `google-gemini` الموسوم المشترك.

      تبقى بعض مساعدات البث محلية للمزوّد عمدًا. يحتفظ `@openclaw/anthropic-provider` بـ `wrapAnthropicProviderStream`، و`resolveAnthropicBetas`، و`resolveAnthropicFastMode`، و`resolveAnthropicServiceTier`، وبُناة أغلفة Anthropic الأدنى مستوى في سطحه العام `api.ts` / `contract-api.ts` لأنها ترمز معالجة Claude OAuth beta وحوكمة `context1m`. وبالمثل يحتفظ Plugin xAI بتشكيل Responses الأصلي الخاص بـ xAI في `wrapStreamFn` الخاص به (أسماء `/fast` المستعارة، و`tool_stream` الافتراضي، وتنظيف الأدوات الصارمة غير المدعومة، وإزالة حمولة الاستدلال الخاصة بـ xAI).

      يدعم نمط جذر الحزمة نفسه أيضًا `@openclaw/openai-provider` (بُناة المزوّدين، ومساعدات النموذج الافتراضي، وبُناة مزوّد الوقت الحقيقي) و`@openclaw/openrouter-provider` (باني المزوّد مع مساعدات الإعداد/التهيئة).
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        للمزوّدين الذين يحتاجون إلى تبادل رمز قبل كل استدعاء استدلال:

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
        للمزوّدين الذين يحتاجون إلى ترويسات طلب مخصصة أو تعديلات في الجسم:

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
        للمزوّدين الذين يحتاجون إلى ترويسات طلب/جلسة أصلية أو بيانات وصفية على
        نواقل HTTP أو WebSocket عامة:

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
        بالنسبة إلى المزوّدين الذين يوفّرون بيانات الاستخدام/الفوترة:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        لـ `resolveUsageAuth` ثلاث نتائج. أعد `{ token, accountId? }`
        عندما يكون لدى المزوّد اعتماد استخدام/فوترة. أعد
        `{ handled: true }` فقط عندما يكون المزوّد قد عالج مصادقة الاستخدام
        بشكل حاسم، لكنه لا يملك رمز استخدام صالحًا، ويجب على OpenClaw تخطي
        الرجوع العام إلى مفتاح API/OAuth. أعد `null` أو `undefined` عندما لا يكون
        المزوّد قد عالج الطلب ويجب أن يتابع OpenClaw بالرجوع العام.
      </Tab>
    </Tabs>

    <Accordion title="كل خطافات المزوّد المتاحة">
      يستدعي OpenClaw الخطافات بهذا الترتيب. يستخدم معظم المزوّدين 2-3 فقط:
      حقول المزوّد الخاصة بالتوافق فقط التي لم يعد OpenClaw يستدعيها، مثل
      `ProviderPlugin.capabilities` و`suppressBuiltInModel`، غير مدرجة
      هنا.

      | # | الخطاف | متى يُستخدم |
      | --- | --- | --- |
      | 1 | `catalog` | كتالوج النماذج أو إعدادات URL الأساسية الافتراضية |
      | 2 | `applyConfigDefaults` | الإعدادات العامة الافتراضية المملوكة للمزوّد أثناء تجسيد الإعدادات |
      | 3 | `normalizeModelId` | تنظيف أسماء نماذج قديمة/تجريبية قبل البحث |
      | 4 | `normalizeTransport` | تنظيف `api` / `baseUrl` الخاص بعائلة المزوّد قبل تجميع النموذج العام |
      | 5 | `normalizeConfig` | تطبيع إعدادات `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | إعادة كتابة توافق الاستخدام أثناء البث الأصلي لمزوّدي الإعدادات |
      | 7 | `resolveConfigApiKey` | حل المصادقة بعلامات البيئة المملوك للمزوّد |
      | 8 | `resolveSyntheticAuth` | مصادقة اصطناعية محلية/ذاتية الاستضافة أو مدعومة بالإعدادات |
      | 9 | `shouldDeferSyntheticProfileAuth` | خفض أولوية العناصر النائبة الاصطناعية للملفات الشخصية المخزّنة خلف مصادقة البيئة/الإعدادات |
      | 10 | `resolveDynamicModel` | قبول معرّفات نماذج عشوائية من المنبع |
      | 11 | `prepareDynamicModel` | جلب بيانات وصفية غير متزامن قبل الحل |
      | 12 | `normalizeResolvedModel` | إعادة كتابة النقل قبل المشغّل |
      | 13 | `normalizeToolSchemas` | تنظيف مخططات الأدوات المملوك للمزوّد قبل التسجيل |
      | 14 | `inspectToolSchemas` | تشخيصات مخططات الأدوات المملوكة للمزوّد |
      | 15 | `resolveReasoningOutputMode` | عقد مخرجات الاستدلال الموسومة مقابل الأصلية |
      | 16 | `prepareExtraParams` | معاملات الطلب الافتراضية |
      | 17 | `createStreamFn` | نقل StreamFn مخصص بالكامل |
      | 19 | `wrapStreamFn` | أغلفة رؤوس/نص مخصصة على مسار البث العادي |
      | 20 | `resolveTransportTurnState` | رؤوس/بيانات وصفية أصلية لكل دورة |
      | 21 | `resolveWebSocketSessionPolicy` | رؤوس جلسة WS أصلية وفترة تهدئة |
      | 22 | `formatApiKey` | شكل رمز تشغيل مخصص |
      | 23 | `refreshOAuth` | تحديث OAuth مخصص |
      | 24 | `buildAuthDoctorHint` | إرشادات إصلاح المصادقة |
      | 25 | `matchesContextOverflowError` | اكتشاف تجاوز السعة المملوك للمزوّد |
      | 26 | `classifyFailoverReason` | تصنيف حدود المعدل/التحميل الزائد المملوك للمزوّد |
      | 27 | `isCacheTtlEligible` | بوابة TTL لذاكرة التخزين المؤقت للموجّه |
      | 28 | `buildMissingAuthMessage` | تلميح مخصص للمصادقة الناقصة |
      | 29 | `augmentModelCatalog` | صفوف اصطناعية للتوافق المستقبلي |
      | 30 | `resolveThinkingProfile` | مجموعة خيارات `/think` الخاصة بالنموذج |
      | 31 | `isBinaryThinking` | توافق تشغيل/إيقاف التفكير الثنائي |
      | 32 | `supportsXHighThinking` | توافق دعم الاستدلال `xhigh` |
      | 33 | `resolveDefaultThinkingLevel` | توافق سياسة `/think` الافتراضية |
      | 34 | `isModernModelRef` | مطابقة نماذج الاختبار الحي/الدخاني |
      | 35 | `prepareRuntimeAuth` | تبادل الرموز قبل الاستدلال |
      | 36 | `resolveUsageAuth` | تحليل مخصص لاعتماد الاستخدام |
      | 37 | `fetchUsageSnapshot` | نقطة نهاية استخدام مخصصة |
      | 38 | `createEmbeddingProvider` | محوّل تضمين مملوك للمزوّد للذاكرة/البحث |
      | 39 | `buildReplayPolicy` | سياسة مخصصة لإعادة تشغيل/Compaction النص |
      | 40 | `sanitizeReplayHistory` | إعادة كتابة إعادة التشغيل الخاصة بالمزوّد بعد التنظيف العام |
      | 41 | `validateReplayTurns` | تحقق صارم من دورات إعادة التشغيل قبل المشغّل المضمن |
      | 42 | `onModelSelected` | رد نداء بعد الاختيار (مثل القياسات عن بُعد) |

      ملاحظات الرجوع في وقت التشغيل:

      - يتحقق `normalizeConfig` من المزوّد المطابق أولًا، ثم من Plugins المزوّدين الآخرين القادرين على الخطافات إلى أن يغيّر أحدهم الإعدادات فعليًا. إذا لم يُعد أي خطاف مزوّد كتابة إدخال إعدادات مدعوم من عائلة Google، يظل مطبّع إعدادات Google المضمّن مطبقًا.
      - يستخدم `resolveConfigApiKey` خطاف المزوّد عند كشفه. يحتفظ Amazon Bedrock بحل علامات بيئة AWS في Plugin المزوّد الخاص به؛ أما مصادقة وقت التشغيل نفسها فتظل تستخدم سلسلة AWS SDK الافتراضية عند إعدادها باستخدام `auth: "aws-sdk"`.
      - يتلقى `resolveThinkingProfile(ctx)` قيمة `provider` المحددة، و`modelId`، وتلميح كتالوج `reasoning` المدمج الاختياري، وحقائق `compat` للنموذج المدمجة الاختيارية. استخدم `compat` فقط لاختيار واجهة/ملف التفكير الخاص بالمزوّد.
      - يسمح `resolveSystemPromptContribution` للمزوّد بحقن إرشادات موجه نظام واعية بذاكرة التخزين المؤقت لعائلة نموذج. فضّله على `before_prompt_build` عندما يكون السلوك تابعًا لمزوّد/عائلة نموذج واحد ويجب أن يحافظ على فصل ذاكرة التخزين المؤقت المستقر/الديناميكي.

      للاطلاع على أوصاف مفصلة وأمثلة من الواقع، راجع [الداخليات: خطافات وقت تشغيل المزوّد](/ar/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="إضافة قدرات إضافية (اختياري)">
    ### الخطوة 5: إضافة قدرات إضافية

    يمكن لـ Plugin مزوّد تسجيل التضمينات، والكلام، والنسخ الفوري،
    والصوت الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الفيديو،
    وجلب الويب، وبحث الويب إلى جانب استدلال النص. يصنّف OpenClaw هذا على أنه
    Plugin **hybrid-capability** - وهو النمط الموصى به لـ Plugins الشركات
    (Plugin واحد لكل بائع). راجع
    [الداخليات: ملكية القدرات](/ar/plugins/architecture#capability-ownership-model).

    سجّل كل قدرة داخل `register(api)` إلى جانب استدعاء
    `api.registerProvider(...)` الحالي. اختر علامات التبويب التي تحتاجها فقط:

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

        استخدم `assertOkOrThrowProviderError(...)` لإخفاقات HTTP الخاصة بالمزوّد حتى
        تشترك Plugins في قراءات نص الخطأ المحددة، وتحليل أخطاء JSON، ولواحق
        معرّف الطلب.
      </Tab>
      <Tab title="النسخ الفوري">
        فضّل `createRealtimeTranscriptionWebSocketSession(...)` - فالمساعد المشترك
        يعالج التقاط الوكيل، والتراجع عند إعادة الاتصال، وتفريغ الإغلاق، ومصافحات
        الجاهزية، وترتيب الصوت في الطابور، وتشخيصات أحداث الإغلاق. لا يتولى Plugin
        الخاص بك سوى ربط أحداث المنبع.

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

        يجب على مزوّدي STT الدُفعيين الذين يرسلون صوتًا متعدد الأجزاء عبر POST استخدام
        `buildAudioTranscriptionFormData(...)` من
        `openclaw/plugin-sdk/provider-http`. يطبّع المساعد أسماء ملفات الرفع،
        بما في ذلك رفعات AAC التي تحتاج إلى اسم ملف بنمط M4A من أجل واجهات API
        نسخ متوافقة.
      </Tab>
      <Tab title="الصوت الفوري">
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

        صرّح عن `capabilities` حتى يتمكّن `talk.catalog` من عرض الأوضاع الصالحة،
        ووسائل النقل، وتنسيقات الصوت، وعلامات الميزات لعملاء Talk في المتصفح
        والعملاء الأصليين. نفّذ `handleBargeIn` عندما تستطيع وسيلة نقل اكتشاف أن
        إنسانًا يقاطع تشغيل المساعد ويدعم المزوّد اقتطاع استجابة الصوت النشطة
        أو مسحها.
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

        يمكن لمزوّدي الوسائط المحليين أو المستضافين ذاتيًا، الذين لا يتطلبون
        بيانات اعتماد عمدًا، عرض `resolveAuth` وإرجاع `kind: "none"`.
        يظل OpenClaw يحافظ على بوابة المصادقة العادية للمزوّدين الذين لا
        يختارون ذلك صراحة. يمكن للمزوّدين الحاليين الاستمرار في قراءة `req.apiKey`؛
        وينبغي للمزوّدين الجدد تفضيل `req.auth`.

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
        عقد Embeddings العام لتوليد المتجهات القابلة لإعادة الاستخدام، بما في ذلك
        بحث الذاكرة. يُعد `registerMemoryEmbeddingProvider(...)` توافقًا مهملًا
        للمحوّلات الحالية المخصصة للذاكرة.
      </Tab>
      <Tab title="توليد الصور والفيديو">
        تستخدم قدرات الفيديو شكلًا **مدركًا للوضع**: `generate`،
        و`imageToVideo`، و`videoToVideo`. الحقول التجميعية المسطحة مثل
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` ليست
        كافية للإعلان بوضوح عن دعم وضع التحويل أو الأوضاع المعطلة.
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
          defaultTimeoutMs: 600_000,
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

تُنشر Plugins المزوّدين بالطريقة نفسها مثل أي Plugin كود خارجي آخر:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

لا تستخدم الاسم المستعار القديم الخاص بـ Skills فقط هنا؛ ينبغي لحزم Plugin استخدام
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

يتحكم `catalog.order` في وقت دمج الكتالوج الخاص بك نسبةً إلى
المزوّدين المضمّنين:

| الترتيب   | متى          | حالة الاستخدام                                  |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | المرور الأول | مزوّدو مفاتيح API البسيطة                       |
| `profile` | بعد simple   | مزوّدون مقيّدون بملفات تعريف المصادقة          |
| `paired`  | بعد profile  | إنشاء إدخالات متعددة مترابطة                   |
| `late`    | المرور الأخير | تجاوز المزوّدين الحاليين (يفوز عند التعارض)    |

## الخطوات التالية

- [Channel Plugins](/ar/plugins/sdk-channel-plugins) - إذا كان Plugin الخاص بك يوفّر قناة أيضًا
- [وقت تشغيل SDK](/ar/plugins/sdk-runtime) - مساعدات `api.runtime` (TTS، البحث، الوكيل الفرعي)
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) - مرجع استيراد المسارات الفرعية الكامل
- [داخليات Plugin](/ar/plugins/architecture-internals#provider-runtime-hooks) - تفاصيل الخطافات والأمثلة المضمّنة

## ذات صلة

- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء Plugins](/ar/plugins/building-plugins)
- [بناء Channel Plugins](/ar/plugins/sdk-channel-plugins)
