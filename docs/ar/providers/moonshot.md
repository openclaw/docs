---
read_when:
    - تريد إعداد Moonshot K2 (Moonshot Open Platform) مقابل Kimi Coding
    - تحتاج إلى فهم نقاط نهاية ومفاتيح ومراجع نماذج منفصلة
    - تريد تكوينًا جاهزًا للنسخ واللصق لأيٍّ من المزوّدين
summary: اضبط Moonshot K2 مقابل Kimi Coding (موفّرو خدمة ومفاتيح منفصلة)
title: Moonshot AI
x-i18n:
    generated_at: "2026-06-27T18:26:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7365d7e843275750824a937553dcf535245146fb49fe00c622bf14b71d2dd17
    source_path: providers/moonshot.md
    workflow: 16
---

توفّر Moonshot واجهة Kimi API بنقاط نهاية متوافقة مع OpenAI. اضبط
المزوّد وعيّن النموذج الافتراضي إلى `moonshot/kimi-k2.6`، أو استخدم
Kimi Coding مع `kimi/kimi-for-coding`.

<Warning>
Moonshot وKimi Coding هما **مزوّدان منفصلان**. المفاتيح غير قابلة للتبادل، ونقاط النهاية مختلفة، ومراجع النماذج مختلفة (`moonshot/...` مقابل `kimi/...`).
</Warning>

## كتالوج النماذج المضمّن

[//]: # "moonshot-kimi-k2-ids:start"

| مرجع النموذج                     | الاسم                  | الاستدلال      | الإدخال    | السياق  | أقصى مخرجات |
| --------------------------------- | ---------------------- | -------------- | ---------- | ------- | ----------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | لا             | نص، صورة   | 262,144 | 262,144     |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | مفعّل دائمًا   | نص، صورة   | 262,144 | 262,144     |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | لا             | نص، صورة   | 262,144 | 262,144     |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | نعم            | نص         | 262,144 | 262,144     |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | نعم            | نص         | 262,144 | 262,144     |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | لا             | نص         | 256,000 | 16,384      |

[//]: # "moonshot-kimi-k2-ids:end"

تستخدم تقديرات تكلفة الكتالوج لنماذج K2 الحالية المستضافة لدى Moonshot
أسعار الدفع حسب الاستخدام المنشورة من Moonshot: Kimi K2.7 Code بسعر $0.19/MTok عند إصابة ذاكرة التخزين المؤقت،
و$0.95/MTok للإدخال، و$4.00/MTok للإخراج؛ Kimi K2.6 بسعر $0.16/MTok عند إصابة ذاكرة التخزين المؤقت،
و$0.95/MTok للإدخال، و$4.00/MTok للإخراج؛ وKimi K2.5 بسعر $0.10/MTok عند إصابة ذاكرة التخزين المؤقت،
و$0.60/MTok للإدخال، و$3.00/MTok للإخراج. تحتفظ إدخالات الكتالوج القديمة الأخرى
بعناصر نائبة بتكلفة صفرية ما لم تتجاوزها في الإعدادات.

يستخدم Kimi K2.7 Code التفكير الأصلي دائمًا. يعرض OpenClaw حالة التفكير `on`
فقط لهذا النموذج، ويحذف عناصر التحكم الصادرة `thinking` و
`reasoning_effort`، كما تتطلب Moonshot. ويحذف OpenClaw أيضًا
تجاوزات أخذ العينات التي يثبّتها K2.7 على افتراضيات المزوّد. يظل Kimi K2.6 هو
افتراضي الإعداد الأولي.

## البدء

اختر مزوّدك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="Moonshot API">
    **الأفضل لـ:** نماذج Kimi K2 عبر Moonshot Open Platform.

    <Steps>
      <Step title="اختر منطقة نقطة النهاية">
        | خيار المصادقة         | نقطة النهاية                   | المنطقة       |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | دولية         |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | الصين         |
      </Step>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        أو لنقطة نهاية الصين:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="عيّن نموذجًا افتراضيًا">
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
      <Step title="تحقق من توفر النماذج">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="شغّل اختبار دخان مباشر">
        استخدم دليل حالة معزولًا عندما تريد التحقق من الوصول إلى النموذج وتتبع التكلفة
        دون لمس جلساتك العادية:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        يجب أن يبلّغ رد JSON عن `provider: "moonshot"` و
        `model: "kimi-k2.6"`. يخزّن إدخال نص المساعد استخدام الرموز الموحّد
        مع التكلفة المقدّرة ضمن `usage.cost` عندما تعيد Moonshot
        بيانات تعريف الاستخدام.
      </Step>
    </Steps>

    ### مثال إعدادات

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
    ثبّت Plugin الرسمي، ثم أعد تشغيل Gateway:

    ```bash
    openclaw plugins install @openclaw/kimi-provider
    openclaw gateway restart
    ```
    **الأفضل لـ:** المهام التي تركز على البرمجة عبر نقطة نهاية Kimi Coding.

    <Note>
    يستخدم Kimi Coding مفتاح API وبادئة مزوّد مختلفين (`kimi/...`) عن Moonshot (`moonshot/...`). مرجع نموذج API المستقر هو `kimi/kimi-for-coding`؛ وتظل المراجع القديمة `kimi/kimi-code` و`kimi/k2p5` مقبولة وتُوحّد إلى معرّف نموذج API هذا.
    </Note>

    <Steps>
      <Step title="ثبّت Plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        ```
      </Step>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="عيّن نموذجًا افتراضيًا">
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
      <Step title="تحقق من توفر النموذج">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### مثال إعدادات

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

## بحث الويب في Kimi

يسجّل Plugin الخاص بـ Moonshot أيضًا **Kimi** كمزوّد `web_search`، مدعومًا ببحث الويب من Moonshot.

<Steps>
  <Step title="شغّل إعداد بحث الويب التفاعلي">
    ```bash
    openclaw configure --section web
    ```

    اختر **Kimi** في قسم بحث الويب لتخزين
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="اضبط منطقة بحث الويب والنموذج">
    يطلب الإعداد التفاعلي ما يلي:

    | الإعداد             | الخيارات                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | منطقة API           | `https://api.moonshot.ai/v1` (دولية) أو `https://api.moonshot.cn/v1` (الصين) |
    | نموذج بحث الويب     | يساوي افتراضيًا `kimi-k2.6`                                          |

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
    حذف الحقل `thinking` لهذا النموذج، لذلك يعرض OpenClaw `on` فقط
    ويتجاهل إعدادات `off` القديمة. يثبّت K2.7 أيضًا `temperature` و`top_p` و`n`
    و`presence_penalty` و`frequency_penalty`؛ ويحذف OpenClaw التجاوزات المضبوطة
    لهذه الحقول.

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

    يربط OpenClaw مستويات `/think` وقت التشغيل لهذه النماذج:

    | مستوى `/think`       | سلوك Moonshot              |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | أي مستوى ليس off     | `thinking.type=enabled`    |

    <Warning>
    عند تفعيل تفكير Moonshot، يجب أن يكون `tool_choice` هو `auto` أو `none`. يوحّد OpenClaw القيم غير المتوافقة إلى `auto`. يشمل ذلك Kimi K2.7 Code، الذي لا يمكن تعطيل وضع التفكير فيه للحفاظ على اختيار أداة مثبّت.
    </Warning>

    يقبل Kimi K2.6 أيضًا حقل `thinking.keep` اختياريًا يتحكم في
    الاحتفاظ متعدد الأدوار بـ `reasoning_content`. اضبطه على `"all"` للاحتفاظ بسجل
    الاستدلال الكامل عبر الأدوار؛ أو احذفه (أو اتركه `null`) لاستخدام استراتيجية الخادم
    الافتراضية. يمرر OpenClaw الحقل `thinking.keep` فقط لـ
    `moonshot/kimi-k2.6` ويزيله من النماذج الأخرى. يحافظ Kimi K2.7 Code
    على سجل الاستدلال الكامل افتراضيًا بينما يحذف OpenClaw حقل
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
    يقدّم Moonshot Kimi معرّفات tool_call أصلية على شكل `functions.<name>:<index>`. بالنسبة إلى نقل إكمالات OpenAI، يحافظ OpenClaw على أول ظهور لكل معرّف Kimi أصلي ويعيد كتابة التكرارات اللاحقة إلى معرّفات `call_*` حتمية بأسلوب OpenAI. تُعاد مطابقة نتائج الأدوات بالمعرّف نفسه كي تظل إعادة التشغيل فريدة من دون إزالة أول معرّف Kimi أصلي.

    لفرض تنقية صارمة على مزود مخصص متوافق مع OpenAI، اضبط `sanitizeToolCallIds: true`:

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="توافق استخدام البث">
    تعلن نقاط نهاية Moonshot الأصلية (`https://api.moonshot.ai/v1` و
    `https://api.moonshot.cn/v1`) عن توافق استخدام البث على نقل
    `openai-completions` المشترك. يربط OpenClaw ذلك بقدرات نقطة النهاية،
    لذلك ترث معرّفات المزودين المخصصين المتوافقين التي تستهدف مضيفي
    Moonshot الأصليين أنفسهم سلوك استخدام البث نفسه.

    مع تسعير K2.6 في الفهرس، يُحوَّل الاستخدام المتدفق الذي يتضمن رموز الإدخال والإخراج
    وقراءة التخزين المؤقت أيضًا إلى تكلفة محلية تقديرية بالدولار الأمريكي من أجل
    `/status` و`/usage full` و`/usage cost` ومحاسبة الجلسات المدعومة بالنصوص.

  </Accordion>

  <Accordion title="مرجع نقطة النهاية ومرجع النموذج">
    | المزود   | بادئة مرجع النموذج | نقطة النهاية                      | متغير بيئة المصادقة        |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | نقطة نهاية Kimi Coding          | `KIMI_API_KEY`      |
    | بحث الويب | غير متاح              | مماثلة لمنطقة Moonshot API   | `KIMI_API_KEY` أو `MOONSHOT_API_KEY` |

    - يستخدم بحث الويب في Kimi `KIMI_API_KEY` أو `MOONSHOT_API_KEY`، ويفترض افتراضيًا `https://api.moonshot.ai/v1` مع النموذج `kimi-k2.6`.
    - تجاوز التسعير وبيانات سياق التعريف في `models.providers` إذا لزم الأمر.
    - إذا نشر Moonshot حدود سياق مختلفة لنموذج ما، فاضبط `contextWindow` وفقًا لذلك.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزودين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="بحث الويب" href="/ar/tools/web" icon="magnifying-glass">
    تكوين مزودي بحث الويب بما في ذلك Kimi.
  </Card>
  <Card title="مرجع التكوين" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط التكوين الكامل للمزودين والنماذج وplugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    إدارة مفتاح Moonshot API ووثائقه.
  </Card>
</CardGroup>
