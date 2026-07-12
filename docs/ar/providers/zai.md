---
read_when:
    - تريد استخدام نماذج Z.AI / GLM في OpenClaw
    - تحتاج إلى إعداد بسيط لـ ZAI_API_KEY
summary: استخدام Z.AI (نماذج GLM) مع OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-07-12T06:25:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab29149da39cbf82fe041ea5932a860c461320e14bf26f83f69060d7ae0ae00a
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
| المصادقة | `ZAI_API_KEY` (الاسم البديل القديم: `Z_AI_API_KEY`) |
| API      | إكمالات الدردشة في Z.AI (مصادقة Bearer)          |

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
      <Step title="التحقق من ظهور النموذج في القائمة">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="نقطة نهاية إقليمية محددة صراحةً">
    **الأنسب لـ:** المستخدمين الذين يريدون فرض واجهة Coding Plan أو واجهة API عامة محددة.

    <Steps>
      <Step title="اختيار خيار الإعداد الأولي المناسب">
        ```bash
        # Coding Plan العالمي (موصى به لمستخدمي Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan للصين (منطقة الصين)
        openclaw onboard --auth-choice zai-coding-cn

        # API العامة
        openclaw onboard --auth-choice zai-global

        # API العامة للصين (منطقة الصين)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="التحقق من ظهور النموذج في القائمة">
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

يكتشف `zai-api-key` تلقائيًا إحدى هذه النقاط الأربع عبر اختبار مفتاحك مقابل
API إكمالات الدردشة لكل نقطة نهاية، مع فحص نقاط النهاية العامة (`zai-global`
ثم `zai-cn`) قبل نقاط نهاية Coding Plan (`zai-coding-global` ثم
`zai-coding-cn`)، والتوقف عند أول نقطة نهاية تقبل الطلب.
استخدم خيار `--auth-choice` صريحًا لفرض نقطة نهاية Coding Plan إذا كان مفتاحك
يعمل على كليهما.

## مثال على الإعداد

<Tip>
يتيح `zai-api-key` لـ OpenClaw اكتشاف نقطة نهاية Z.AI المطابقة من المفتاح
وتطبيق عنوان URL الأساسي الصحيح تلقائيًا. استخدم الخيارات الإقليمية الصريحة عندما
تريد فرض واجهة Coding Plan أو واجهة API عامة محددة.
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

يأتي Plugin الموفّر `zai` مزودًا بكتالوجه في بيان Plugin، لذا يمكن للعرض
للقراءة فقط إظهار صفوف GLM المعروفة من دون تحميل وقت تشغيل الموفّر:

```bash
openclaw models list --all --provider zai
```

يتضمن الكتالوج المدعوم بالبيان حاليًا:

| مرجع النموذج            | ملاحظات                           |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | الافتراضي لـ Coding Plan؛ سياق بحجم مليون |
| `zai/glm-5.1`        | الافتراضي لـ API العامة             |
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
تتوفر نماذج GLM بالصيغة `zai/<model>` (مثال: `zai/glm-5`).
</Tip>

<Note>
يستخدم إعداد Coding Plan النموذج `zai/glm-5.2` افتراضيًا، بينما يحتفظ إعداد
API العامة بالنموذج `zai/glm-5.1`. على نقاط نهاية Coding Plan، يعود الاكتشاف
التلقائي إلى `glm-5.1` ثم `glm-4.7` عندما لا يتيح المفتاح أو الاشتراك GLM-5.2.
قد تتغير إصدارات GLM ومدى توفرها؛ شغّل `openclaw models list --all --provider zai`
لرؤية الكتالوج المعروف لإصدارك المثبّت.
</Note>

## مستويات التفكير

<Tabs>
  <Tab title="GLM-5.2">
    النطاق الكامل: `off` و`low` و`high` و`max` (الافتراضي `off`). يربط OpenClaw
    المستويين `low` و`high` بجهد الاستدلال `high` في Z.AI، والمستوى `max` بجهد
    `max` في Z.AI، عبر `reasoning_effort` في حمولة الطلب.
  </Tab>
  <Tab title="نماذج GLM الأخرى">
    تبديل ثنائي فقط: `off` و`low` (يظهر كـ `on` في أدوات الاختيار)، والافتراضي
    `off`. يؤدي تعيين التفكير إلى `off` إلى إرسال `thinking: { type: "disabled" }`؛
    أما أي مستوى آخر فيترك حمولة الطلب دون تعديل (ويُطبّق سلوك الاستدلال الافتراضي
    الخاص بـ Z.AI).
  </Tab>
</Tabs>

يمنع تعيين التفكير إلى `off` الاستجابات التي تستهلك ميزانية المخرجات في
`reasoning_content` قبل النص المرئي.

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="الحل الاستباقي لنماذج GLM-5 غير المعروفة">
    يستمر الحل الاستباقي لمعرّفات `glm-5*` غير المعروفة على مسار الموفّر عبر
    إنشاء بيانات وصفية مملوكة للموفّر من قالب `glm-4.7` عندما يطابق المعرّف
    بنية عائلة GLM-5 الحالية.
  </Accordion>

  <Accordion title="بث استدعاءات الأدوات">
    يكون `tool_stream` مفعّلًا افتراضيًا لبث استدعاءات الأدوات في Z.AI. لتعطيله:

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
    التفكير المحفوظ اختياري لأن Z.AI يتطلب إعادة تشغيل `reasoning_content`
    التاريخي بالكامل، ما يزيد رموز المطالبة. فعّله لكل نموذج على حدة:

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
    `reasoning_content` السابق لنص المحادثة نفسه المتوافق مع OpenAI. يعمل مفتاح
    المعلمة `preserve_thinking` المكتوب بصيغة snake_case كاسم بديل.

    لا يزال بإمكان المستخدمين المتقدمين تجاوز حمولة الموفّر المحددة باستخدام
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="فهم الصور">
    يسجّل Plugin ‏Z.AI إمكانية فهم الصور.

    | الخاصية      | القيمة       |
    | ------------- | ----------- |
    | النموذج         | `glm-4.6v`  |

    يُحل فهم الصور تلقائيًا من مصادقة Z.AI المُعدّة، ولا يلزم أي
    إعداد إضافي.

  </Accordion>

  <Accordion title="تفاصيل المصادقة">
    - تستخدم Z.AI مصادقة Bearer مع مفتاح API الخاص بك.
    - يكتشف خيار الإعداد الأولي `zai-api-key` نقطة نهاية Z.AI المطابقة تلقائيًا عبر اختبار نقاط النهاية المدعومة باستخدام مفتاحك.
    - استخدم الخيارات الإقليمية الصريحة (`zai-coding-global` و`zai-coding-cn` و`zai-global` و`zai-cn`) عندما تريد فرض واجهة API محددة.
    - لا يزال متغير البيئة القديم `Z_AI_API_KEY` مقبولًا؛ ينسخه OpenClaw إلى `ZAI_API_KEY` عند بدء التشغيل إذا لم يكن `ZAI_API_KEY` معيّنًا.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط إعداد OpenClaw الكامل، بما في ذلك إعدادات الموفّر والنموذج.
  </Card>
</CardGroup>
