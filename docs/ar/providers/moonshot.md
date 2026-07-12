---
read_when:
    - تريد إعداد Moonshot K2 ‏(Moonshot Open Platform) مقارنةً بإعداد Kimi Coding
    - تحتاج إلى فهم نقاط النهاية والمفاتيح ومراجع النماذج المنفصلة
    - تريد إعدادات جاهزة للنسخ واللصق لأيٍّ من المزوّدين
summary: إعداد Moonshot K2 مقارنةً بـ Kimi Coding (موفّران ومفتاحان منفصلان)
title: مون شوت للذكاء الاصطناعي
x-i18n:
    generated_at: "2026-07-12T06:28:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c917a595337fc2138601245f4c7055815859dfa3b2ddf90a56c980a7a4e09744
    source_path: providers/moonshot.md
    workflow: 16
---

توفّر Moonshot واجهة Kimi API بنقاط نهاية متوافقة مع OpenAI. عيّن النموذج
الافتراضي إلى `moonshot/kimi-k2.6` لمنصة Moonshot Open Platform، أو إلى
`kimi/kimi-for-coding` لخدمة Kimi Coding.

<Warning>
Moonshot وKimi Coding **مزوّدان منفصلان**، ويُشحن كل منهما بوصفه Plugin خارجيًا منفصلًا. المفاتيح غير قابلة للتبادل، ونقاط النهاية مختلفة، ومراجع النماذج مختلفة (`moonshot/...` مقابل `kimi/...`).
</Warning>

## كتالوج النماذج المضمّن

[//]: # "moonshot-kimi-k2-ids:start"

| مرجع النموذج                     | الاسم                   | الاستدلال       | الإدخال    | السياق  | الحد الأقصى للإخراج |
| --------------------------------- | ---------------------- | --------------- | ---------- | ------- | ------------------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | لا              | نص، صورة   | 262,144 | 262,144             |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | مفعّل دائمًا    | نص، صورة   | 262,144 | 262,144             |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | لا              | نص، صورة   | 262,144 | 262,144             |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | نعم             | نص         | 262,144 | 262,144             |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | نعم             | نص         | 262,144 | 262,144             |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | لا              | نص         | 256,000 | 16,384              |

[//]: # "moonshot-kimi-k2-ids:end"

تستخدم تقديرات تكلفة الكتالوج أسعار الدفع حسب الاستخدام المنشورة من Moonshot: تبلغ تكلفة Kimi
K2.7 Code ‏$0.19/MTok عند إصابة ذاكرة التخزين المؤقت، و$0.95/MTok للإدخال، و$4.00/MTok للإخراج؛ وتبلغ تكلفة Kimi
K2.6 ‏$0.16/MTok عند إصابة ذاكرة التخزين المؤقت، و$0.95/MTok للإدخال، و$4.00/MTok للإخراج؛ وتبلغ تكلفة Kimi K2.5
‏$0.10/MTok عند إصابة ذاكرة التخزين المؤقت، و$0.60/MTok للإدخال، و$3.00/MTok للإخراج. تحتفظ إدخالات الكتالوج
الأخرى بعناصر نائبة عديمة التكلفة ما لم تتجاوزها في الإعدادات.

يستخدم Kimi K2.7 Code التفكير الأصلي دائمًا. لا يعرض OpenClaw لهذا النموذج سوى حالة التفكير `on`
ويحذف حقلي `thinking` و`reasoning_effort` الصادرين، وفقًا لمتطلبات Moonshot. كما يحذف تجاوزات
أخذ العينات (`temperature` و`top_p` و`n` و`presence_penalty`
و`frequency_penalty`) التي يثبّتها K2.7 على القيم الافتراضية للمزوّد. يظل Kimi K2.6
النموذج الافتراضي للإعداد الأولي.

## بدء الاستخدام

كل من Moonshot وKimi Coding عبارة عن Plugin خارجي، لذا ثبّت أحدهما قبل
الإعداد الأولي.

<Tabs>
  <Tab title="واجهة Moonshot API">
    **الأنسب لـ:** نماذج Kimi K2 عبر منصة Moonshot Open Platform.

    <Steps>
      <Step title="تثبيت Plugin">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="اختيار منطقة نقطة النهاية">
        | خيار المصادقة           | نقطة النهاية                    | المنطقة |
        | ----------------------- | ------------------------------- | ------- |
        | `moonshot-api-key`      | `https://api.moonshot.ai/v1`    | دولية   |
        | `moonshot-api-key-cn`   | `https://api.moonshot.cn/v1`    | الصين   |
      </Step>
      <Step title="تشغيل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        أو لنقطة النهاية الخاصة بالصين:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="تعيين نموذج افتراضي">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="التحقق من توفر النماذج">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="تشغيل اختبار تحقق مباشر">
        استخدم دليل حالة معزولًا عندما تريد التحقق من الوصول إلى النموذج وتتبع
        التكلفة من دون المساس بجلساتك المعتادة:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        ينبغي أن تعرض استجابة JSON ‏`provider: "moonshot"` و
        `model: "kimi-k2.6"`. يخزّن إدخال نص المحادثة الخاص بالمساعد
        استخدام الرموز الموحّد إلى جانب التكلفة المقدّرة ضمن `usage.cost` عندما تعيد Moonshot
        بيانات استخدام وصفية.
      </Step>
    </Steps>

    ### مثال على الإعدادات

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.7-code": { alias: "Kimi K2.7 Code" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.7-code",
                name: "Kimi K2.7 Code",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **الأنسب لـ:** المهام التي تركز على الشيفرة عبر نقطة نهاية Kimi Coding.

    <Note>
    تستخدم Kimi Coding مفتاح API وبادئة مزوّد (`kimi/...`) مختلفين عن Moonshot (`moonshot/...`). مرجع النموذج المستقر هو `kimi/kimi-for-coding`؛ وتظل المراجع القديمة `kimi/kimi-code` و`kimi/k2p5` مقبولة، ويجري توحيدها إلى معرّف النموذج هذا.
    </Note>

    <Steps>
      <Step title="تثبيت Plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="تشغيل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="تعيين نموذج افتراضي">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-for-coding" },
            },
          },
        }
        ```
      </Step>
      <Step title="التحقق من توفر النموذج">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### مثال على الإعدادات

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: {
            "kimi/kimi-for-coding": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## بحث Kimi على الويب

يسجّل Plugin الخاص بـMoonshot أيضًا **Kimi** بوصفه مزوّدًا لـ`web_search`، مدعومًا ببحث Moonshot على الويب.

<Steps>
  <Step title="تشغيل الإعداد التفاعلي لبحث الويب">
    ```bash
    openclaw configure --section web
    ```

    اختر **Kimi** في قسم بحث الويب لتخزين
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="إعداد منطقة بحث الويب ونموذجه">
    يطلب الإعداد التفاعلي ما يلي:

    | الإعداد            | الخيارات                                                                       |
    | ------------------ | ------------------------------------------------------------------------------ |
    | منطقة API          | `https://api.moonshot.ai/v1` (دولية) أو `https://api.moonshot.cn/v1` (الصين) |
    | نموذج بحث الويب    | القيمة الافتراضية هي `kimi-k2.6`                                              |

  </Step>
</Steps>

توجد الإعدادات ضمن `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // or use KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="وضع التفكير الأصلي">
    يستخدم Kimi K2.7 Code التفكير الأصلي دائمًا. تتطلب Moonshot من العملاء
    حذف الحقل `thinking` لهذا النموذج، لذا لا يعرض OpenClaw سوى `on`
    ويتجاهل إعدادات `off` القديمة. كما يثبّت K2.7 القيم `temperature` و`top_p` و`n`
    و`presence_penalty` و`frequency_penalty`؛ ويحذف OpenClaw التجاوزات
    المعدّة لهذه الحقول.

    تدعم نماذج Moonshot Kimi الأخرى التفكير الأصلي الثنائي:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    اضبطه لكل نموذج عبر `agents.defaults.models.<provider/model>.params`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    يربط OpenClaw مستويات `/think` في وقت التشغيل لهذه النماذج كما يلي:

    | مستوى `/think`      | سلوك Moonshot              |
    | ------------------- | -------------------------- |
    | `/think off`        | `thinking.type=disabled`   |
    | أي مستوى غير متوقف | `thinking.type=enabled`    |

    <Warning>
    عند تفعيل التفكير في Moonshot، يجب أن تكون قيمة `tool_choice` هي `auto` أو `none`. يؤدي تثبيت اختيار أداة (`type: "tool"` أو `type: "function"`) إلى إعادة التفكير إلى `disabled` بدلًا من ذلك، بحيث تظل الأداة المطلوبة قيد التشغيل؛ بينما يجري توحيد `tool_choice: "required"` إلى `auto` بدلًا من ذلك. ينطبق هذا على كل نموذج من Moonshot باستثناء Kimi K2.7 Code، إذ لا يمكن تعطيل وضع التفكير فيه، وتُوحّد قيمة `tool_choice` الخاصة به إلى `auto` عندما تكون غير متوافقة.
    </Warning>

    يقبل Kimi K2.6 أيضًا الحقل الاختياري `thinking.keep` الذي يتحكم في
    الاحتفاظ بـ `reasoning_content` عبر جولات متعددة. اضبطه على `"all"` للاحتفاظ
    بالاستدلال الكامل عبر الجولات؛ أو احذفه (أو اتركه بقيمة `null`) لاستخدام
    الاستراتيجية الافتراضية للخادم. لا يمرر OpenClaw الحقل `thinking.keep` إلا إلى
    `moonshot/kimi-k2.6`، ويزيله من النماذج الأخرى. يحتفظ Kimi K2.7 Code
    بسجل الاستدلال الكامل افتراضيًا، بينما يحذف OpenClaw حقل
    `thinking` بالكامل.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="تنقية معرّف استدعاء الأداة">
    يقدّم Moonshot Kimi معرّفات tool_call أصلية بالصيغة `functions.<name>:<index>`. يحتفظ OpenClaw بأول ظهور لكل معرّف Kimi أصلي، ويعيد كتابة التكرارات اللاحقة إلى معرّفات `call_*` حتمية على نمط OpenAI. ويُعاد تعيين نتائج الأدوات المطابقة باستخدام المعرّف نفسه، بحيث تظل إعادة التشغيل فريدة من دون إزالة أول معرّف أصلي لـ Kimi. هذا السلوك مدمج في موفّر Moonshot المرفق، وليس إعدادًا يمكن للمستخدم تهيئته.
  </Accordion>

  <Accordion title="توافق استخدام البث">
    تعلن نقاط نهاية Moonshot الأصلية (`https://api.moonshot.ai/v1` و
    `https://api.moonshot.cn/v1`) توافقها مع استخدام البث.
    يحدد OpenClaw ذلك استنادًا إلى مضيف نقطة النهاية، لا إلى معرّف الموفّر، لذلك يرث معرّف
    موفّر مخصص يشير إلى مضيف Moonshot الأصلي نفسه سلوك
    استخدام البث ذاته.

    مع تسعير K2.6 في الدليل، يُحوّل أيضًا استخدام البث الذي يتضمن رموز الإدخال والإخراج
    والرموز المقروءة من ذاكرة التخزين المؤقت إلى تكلفة محلية تقديرية بالدولار الأمريكي في
    `/status` و`/usage full` و`/usage cost` ومحاسبة الجلسات
    المستندة إلى النصوص المنسوخة.

  </Accordion>

  <Accordion title="مرجع نقاط النهاية ومراجع النماذج">
    | الموفّر   | بادئة مرجع النموذج | نقطة النهاية                      | متغير بيئة المصادقة        |
    | ---------- | ---------------- | ------------------------------ | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | نقطة نهاية Kimi Coding           | `KIMI_API_KEY`      |
    | البحث على الويب | غير منطبق              | نفس منطقة Moonshot API    | `KIMI_API_KEY` أو `MOONSHOT_API_KEY` |

    - يستخدم بحث Kimi على الويب `KIMI_API_KEY` أو `MOONSHOT_API_KEY`، ويستخدم افتراضيًا `https://api.moonshot.ai/v1` مع النموذج `kimi-k2.6`.
    - تجاوز بيانات التسعير وبيانات سياق التعريف في `models.providers` عند الحاجة.
    - إذا نشر Moonshot حدود سياق مختلفة لنموذج، فعدّل `contextWindow` وفقًا لذلك.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين ومراجع النماذج وسلوك تجاوز الأعطال.
  </Card>
  <Card title="البحث على الويب" href="/ar/tools/web" icon="magnifying-glass">
    تهيئة موفّري البحث على الويب، بما في ذلك Kimi.
  </Card>
  <Card title="مرجع التهيئة" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط التهيئة الكامل للموفّرين والنماذج وPlugin.
  </Card>
  <Card title="منصة Moonshot المفتوحة" href="https://platform.moonshot.ai" icon="globe">
    إدارة مفاتيح Moonshot API ووثائقها.
  </Card>
</CardGroup>
