---
read_when:
    - تريد استخدام نماذج Z.AI / GLM في OpenClaw
    - تحتاج إلى إعداد بسيط لـ ZAI_API_KEY
summary: استخدام Z.AI (نماذج GLM) مع OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-07-16T14:45:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f7adf0e2f436f9081891013c0092ce4717bf302b2a4a2e997d9561d7d40211a
    source_path: providers/zai.md
    workflow: 16
---

Z.AI هي منصة API لنماذج **GLM**. توفّر واجهات REST API لـ GLM
وتستخدم مفاتيح API للمصادقة. أنشئ مفتاح API الخاص بك في وحدة تحكم Z.AI.
يستخدم OpenClaw الموفّر `zai` مع مفتاح API من Z.AI.

| الخاصية | القيمة                                        |
| -------- | -------------------------------------------- |
| الموفّر | `zai`                                        |
| الحزمة  | `@openclaw/zai-provider`                     |
| المصادقة     | `ZAI_API_KEY` (الاسم البديل القديم: `Z_AI_API_KEY`) |
| API      | إكمالات الدردشة من Z.AI (مصادقة Bearer)          |

## نماذج GLM

GLM هي عائلة نماذج وليست موفّرًا منفصلًا. في OpenClaw، تستخدم نماذج GLM
مراجع مثل `zai/glm-5.2`: الموفّر `zai`، ومعرّف النموذج `glm-5.2`.

## بدء الاستخدام

ثبّت Plugin الموفّر أولًا:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="الاكتشاف التلقائي لنقطة النهاية">
    **الأنسب لـ:** معظم المستخدمين. يفحص OpenClaw نقاط نهاية Z.AI المدعومة باستخدام مفتاح API الخاص بك ويطبّق عنوان URL الأساسي الصحيح تلقائيًا.

    <Steps>
      <Step title="تشغيل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="التحقق من إدراج النموذج">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="نقطة نهاية إقليمية صريحة">
    **الأنسب لـ:** المستخدمين الذين يريدون فرض سطح Coding Plan أو API عام محدد.

    <Steps>
      <Step title="اختيار خيار الإعداد الأولي الصحيح">
        ```bash
        # Coding Plan العالمي (موصى به لمستخدمي Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (منطقة الصين)
        openclaw onboard --auth-choice zai-coding-cn

        # API العام
        openclaw onboard --auth-choice zai-global

        # API العام CN (منطقة الصين)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="التحقق من إدراج النموذج">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

### نقاط النهاية

| خيار الإعداد الأولي   | عنوان URL الأساسي                                      | النموذج الافتراضي |
| ------------------- | --------------------------------------------- | ------------- |
| `zai-global`        | `https://api.z.ai/api/paas/v4`                | `glm-5.1`     |
| `zai-cn`            | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`     |
| `zai-coding-global` | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`     |
| `zai-coding-cn`     | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`     |

يكتشف `zai-api-key` تلقائيًا واحدة من هذه النقاط الأربع عبر اختبار مفتاحك مع
API إكمالات الدردشة لكل نقطة نهاية، وفحص نقاط النهاية العامة (`zai-global`،
ثم `zai-cn`) قبل نقاط نهاية Coding Plan (`zai-coding-global`، ثم
`zai-coding-cn`) والتوقف عند أول نقطة نهاية تقبل الطلب.
استخدم `--auth-choice` صريحًا لفرض نقطة نهاية Coding Plan إذا كان مفتاحك
يعمل على كليهما.

## حدود المعدّل وحالات الحمل الزائد

تصف Z.AI أدوات الوكيل الخاصة بـ Coding Plan والأغراض العامة بأنها خدمات
تُدار وفق السعة. وفقًا لوثائق Z.AI نفسها:

- [أدوات الوكيل العامة](https://docs.z.ai/devpack/tool/others)،
  بما فيها OpenClaw، تُقدَّم وفق مبدأ بذل أفضل جهد. أثناء ارتفاع حمل الاستدلال،
  عادةً في الفترة من 2 إلى 6 مساءً بتوقيت سنغافورة، قد تواجه بعض الطلبات حدودًا
  مؤقتة للمعدّل.
- [حدود المعدّل والتزامن في Coding Plan](https://docs.z.ai/devpack/usage-policy)
  مرتبطة بفئة الخطة ويمكن تعديلها ديناميكيًا استنادًا إلى توافر الموارد.
  قد يكون التزامن أعلى خارج ساعات الذروة.
- [رمز خطأ API ‏`1302`](https://docs.z.ai/api-reference/api-code) يعني «تم بلوغ
  حد معدّل الطلبات». ويعني رمز خطأ API ‏`1305` «قد تكون الخدمة
  محمّلة فوق طاقتها مؤقتًا، يُرجى المحاولة مرة أخرى لاحقًا».

إذا رأيت استجابة مؤقتة من نوع `429` أو `1305` خلال فترة ازدحام، فانتظر
وأعِد محاولة الطلب. إذا تكررت حالات الفشل خارج فترات الذروة، أو حدثت فقط
لنقطة نهاية أو نموذج أو شكل طلب واحد، فتحقق أولًا من نقطة النهاية
والنموذج المضبوطين:

```bash
openclaw models list --all --provider zai
openclaw config get models.providers.zai.baseUrl
```

يجب أن تستخدم مفاتيح Coding Plan نقطة نهاية خاصة بـ Coding Plan مثل
`https://api.z.ai/api/coding/paas/v4`؛ ويجب أن تستخدم مفاتيح API العامة نقطة نهاية API
عامة مثل `https://api.z.ai/api/paas/v4`. قد تشير حالات الفشل المستمرة باستخدام
المفتاح ونقطة النهاية نفسيهما إلى رفض من جانب الموفّر أو قيد في الخطة،
وليس إلى تقييد اعتيادي بسبب حمل الذروة.

## مثال على الضبط

<Tip>
يتيح `zai-api-key` لـ OpenClaw اكتشاف نقطة نهاية Z.AI المطابقة من المفتاح
وتطبيق عنوان URL الأساسي الصحيح تلقائيًا. استخدم الخيارات الإقليمية الصريحة عندما
تريد فرض سطح Coding Plan أو API عام محدد.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // يستخدم GLM-5.2 نقطة نهاية Coding Plan.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## الكتالوج المضمّن

يشحن Plugin الموفّر `zai` كتالوجه في بيان Plugin، ولذلك يمكن
للعرض للقراءة فقط إظهار صفوف GLM المعروفة من دون تحميل وقت تشغيل الموفّر:

```bash
openclaw models list --all --provider zai
```

يتضمن الكتالوج المدعوم بالبيان حاليًا:

| مرجع النموذج            | الملاحظات                           |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | افتراضي Coding Plan؛ سياق 1M |
| `zai/glm-5.1`        | الافتراضي لـ API العام             |
| `zai/glm-5`          |                                 |
| `zai/glm-5-turbo`    |                                 |
| `zai/glm-5v-turbo`   |                                 |
| `zai/glm-4.7`        |                                 |
| `zai/glm-4.7-flash`  |                                 |
| `zai/glm-4.7-flashx` |                                 |
| `zai/glm-4.6`        |                                 |
| `zai/glm-4.6v`       |                                 |
| `zai/glm-4.5`        |                                 |
| `zai/glm-4.5-air`    |                                 |
| `zai/glm-4.5-flash`  |                                 |
| `zai/glm-4.5v`       |                                 |

<Tip>
تتوفر نماذج GLM بصيغة `zai/<model>` (مثال: `zai/glm-5`).
</Tip>

<Note>
يستخدم إعداد Coding Plan القيمة `zai/glm-5.2` افتراضيًا؛ بينما يحتفظ إعداد API العام
بالقيمة `zai/glm-5.1`. في نقاط نهاية Coding Plan، يعود الاكتشاف التلقائي احتياطيًا إلى
`glm-5.1` ثم `glm-4.7` عندما لا يتيح المفتاح أو الخطة GLM-5.2. قد تتغير إصدارات GLM
ومدى توافرها؛ شغّل `openclaw models list --all --provider zai`
لرؤية الكتالوج المعروف لإصدارك المثبّت.
</Note>

## مستويات التفكير

<Tabs>
  <Tab title="GLM-5.2">
    النطاق الكامل: `off`، و`low`، و`high`، و`max` (الافتراضي `off`). يعيّن OpenClaw
    القيمتين `low` و`high` إلى جهد الاستدلال `high` في Z.AI، والقيمة `max` إلى جهد
    `max` في Z.AI، عبر `reasoning_effort` في حمولة الطلب.
  </Tab>
  <Tab title="نماذج GLM الأخرى">
    تبديل ثنائي فقط: `off` و`low` (تظهر بصيغة `on` في أدوات الاختيار)، والافتراضي
    `off`. يؤدي ضبط التفكير على `off` إلى إرسال `thinking: { type: "disabled" }`؛
    ويترك أي مستوى آخر حمولة الطلب من دون تغيير (يُطبَّق سلوك
    الاستدلال الافتراضي الخاص بـ Z.AI).
  </Tab>
</Tabs>

يؤدي ضبط التفكير على `off` إلى تجنب الاستجابات التي تستهلك ميزانية المخرجات على
`reasoning_content` قبل النص المرئي.

## الضبط المتقدم

<AccordionGroup>
  <Accordion title="الحلّ التقدمي لنماذج GLM-5 غير المعروفة">
    تظل معرّفات `glm-5*` غير المعروفة قابلة للحلّ التقدمي عبر مسار الموفّر من خلال
    إنشاء بيانات وصفية مملوكة للموفّر من قالب `glm-4.7` عندما يتطابق المعرّف
    مع الشكل الحالي لعائلة GLM-5.
  </Accordion>

  <Accordion title="بث استدعاءات الأدوات">
    يكون `tool_stream` مفعّلًا افتراضيًا لبث استدعاءات أدوات Z.AI. لتعطيله:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="التفكير المحفوظ">
    التفكير المحفوظ اختياري لأن Z.AI تتطلب إعادة تشغيل
    `reasoning_content` التاريخي الكامل، ما يزيد رموز المطالبة. فعّله
    لكل نموذج على حدة:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.2": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    عند تفعيله وتشغيل التفكير، يرسل OpenClaw
    `thinking: { type: "enabled", clear_thinking: false }` ويعيد تشغيل
    `reasoning_content` السابقة للنص المنسوخ نفسه المتوافق مع OpenAI. يعمل مفتاح المعلمة بصيغة snake_case
    ‏`preserve_thinking` كاسم بديل.

    لا يزال بإمكان المستخدمين المتقدمين تجاوز حمولة الموفّر الدقيقة باستخدام
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="فهم الصور">
    يسجّل Plugin الخاص بـ Z.AI إمكانية فهم الصور.

    | الخاصية      | القيمة       |
    | ------------- | ----------- |
    | النموذج         | `glm-4.6v`  |

    يُحلّ فهم الصور تلقائيًا من مصادقة Z.AI المضبوطة، ولا يلزم
    أي ضبط إضافي.

  </Accordion>

  <Accordion title="تفاصيل المصادقة">
    - تستخدم Z.AI مصادقة Bearer مع مفتاح API الخاص بك.
    - يكتشف خيار الإعداد الأولي `zai-api-key` نقطة نهاية Z.AI المطابقة تلقائيًا عبر اختبار نقاط النهاية المدعومة باستخدام مفتاحك.
    - استخدم الخيارات الإقليمية الصريحة (`zai-coding-global`، و`zai-coding-cn`، و`zai-global`، و`zai-cn`) عندما تريد فرض سطح API محدد.
    - لا يزال متغير البيئة القديم `Z_AI_API_KEY` مقبولًا؛ ينسخه OpenClaw إلى `ZAI_API_KEY` عند بدء التشغيل إذا لم تكن `ZAI_API_KEY` مضبوطة.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع الضبط" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط ضبط OpenClaw الكامل، بما في ذلك إعدادات الموفّر والنموذج.
  </Card>
</CardGroup>
