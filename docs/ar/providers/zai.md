---
read_when:
    - تريد استخدام نماذج Z.AI / GLM في OpenClaw
    - تحتاج إلى إعداد بسيط لـ ZAI_API_KEY
summary: استخدم Z.AI (نماذج GLM) مع OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-06-27T18:29:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a40675d3db518c090828bcc46c3bca348d1bed1027ba6b80228aa27773efd10f
    source_path: providers/zai.md
    workflow: 16
---

Z.AI هي منصة API لنماذج **GLM**. وهي توفر REST APIs لـ GLM وتستخدم مفاتيح API للمصادقة. أنشئ مفتاح API الخاص بك في وحدة تحكم Z.AI. يستخدم OpenClaw المزوّد `zai` مع مفتاح Z.AI API.

| الخاصية | القيمة                                        |
| -------- | -------------------------------------------- |
| المزوّد | `zai`                                        |
| الحزمة  | `@openclaw/zai-provider`                     |
| المصادقة     | `ZAI_API_KEY` (الاسم البديل القديم: `Z_AI_API_KEY`) |
| API      | إكمالات دردشة Z.AI (مصادقة Bearer)          |

## نماذج GLM

GLM هي عائلة نماذج، وليست مزوّدًا منفصلًا. في OpenClaw، تستخدم نماذج GLM مراجع مثل `zai/glm-5.2`: المزوّد `zai`، ومعرّف النموذج `glm-5.2`.

## بدء الاستخدام

ثبّت Plugin المزوّد أولًا:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="اكتشاف نقطة النهاية تلقائيًا">
    **الأفضل لـ:** معظم المستخدمين. يفحص OpenClaw نقاط نهاية Z.AI المدعومة باستخدام مفتاح API الخاص بك، ويطبّق عنوان URL الأساسي الصحيح تلقائيًا.

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
    **الأفضل لـ:** المستخدمين الذين يريدون فرض Coding Plan محددة أو سطح API عام.

    <Steps>
      <Step title="اختر خيار الإعداد الأولي المناسب">
        ```bash
        # Coding Plan Global (recommended for Coding Plan users)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (China region)
        openclaw onboard --auth-choice zai-coding-cn

        # General API
        openclaw onboard --auth-choice zai-global

        # General API CN (China region)
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

## مثال التكوين

<Tip>
يتيح `zai-api-key` لـ OpenClaw اكتشاف نقطة نهاية Z.AI المطابقة من المفتاح وتطبيق عنوان URL الأساسي الصحيح تلقائيًا. استخدم الخيارات الإقليمية الصريحة عندما تريد فرض Coding Plan محددة أو سطح API عام.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 uses the Coding Plan endpoint.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## الفهرس المضمّن

يشحن Plugin المزوّد `zai` فهرسه في بيان Plugin، لذلك يمكن للعرض للقراءة فقط أن يعرض صفوف GLM المعروفة من دون تحميل وقت تشغيل المزوّد:

```bash
openclaw models list --all --provider zai
```

يتضمن الفهرس المدعوم بالبيان حاليًا:

| مرجع النموذج            | ملاحظات                           |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | الافتراضي لـ Coding Plan؛ سياق 1M |
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

<Tip>
يدعم GLM-5.2 مستويات التفكير `off` و`low` و`high` و`max`. يعيّن OpenClaw المستويين `low` و`high` إلى جهد الاستدلال العالي في Z.AI، ويعيّن `max` إلى الجهد الأقصى.
</Tip>

<Note>
تستخدم إعدادات Coding Plan القيمة الافتراضية `zai/glm-5.2`؛ بينما تبقي إعدادات API العام على `zai/glm-5.1`. يعود اكتشاف نقطة النهاية تلقائيًا إلى `glm-5.1` أو `glm-4.7` عندما لا تعرض الخطة المحددة GLM-5.2. قد تتغير إصدارات GLM وتوفرها؛ شغّل `openclaw models list --all --provider zai` لرؤية الفهرس المعروف لإصدارك المثبّت.
</Note>

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="الحلّ المستقبلي لنماذج GLM-5 غير المعروفة">
    لا تزال معرّفات `glm-5*` غير المعروفة تُحلّ مستقبلًا على مسار المزوّد عبر توليد بيانات وصفية مملوكة للمزوّد من قالب `glm-4.7` عندما يطابق المعرّف الشكل الحالي لعائلة GLM-5.
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

  <Accordion title="التفكير والتفكير المحفوظ">
    يتبع تفكير Z.AI عناصر تحكم `/think` في OpenClaw. عند إيقاف التفكير، يرسل OpenClaw `thinking: { type: "disabled" }` لتجنب الردود التي تستهلك ميزانية الإخراج في `reasoning_content` قبل النص المرئي.

    التفكير المحفوظ اختياري لأن Z.AI يتطلب إعادة تشغيل `reasoning_content` التاريخي الكامل، مما يزيد رموز الموجّه. فعّله لكل نموذج:

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

    عند تفعيله وتشغيل التفكير، يرسل OpenClaw `thinking: { type: "enabled", clear_thinking: false }` ويعيد تشغيل `reasoning_content` السابق لنفس النص النصي المتوافق مع OpenAI.

    لا يزال بإمكان المستخدمين المتقدمين تجاوز حمولة المزوّد الدقيقة باستخدام `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="فهم الصور">
    يسجّل Plugin ‏Z.AI فهم الصور.

    | الخاصية      | القيمة       |
    | ------------- | ----------- |
    | النموذج         | `glm-4.6v`  |

    يتم حلّ فهم الصور تلقائيًا من مصادقة Z.AI المكوّنة، ولا يلزم تكوين إضافي.

  </Accordion>

  <Accordion title="تفاصيل المصادقة">
    - تستخدم Z.AI مصادقة Bearer مع مفتاح API الخاص بك.
    - يكتشف خيار الإعداد الأولي `zai-api-key` نقطة نهاية Z.AI المطابقة تلقائيًا عبر فحص نقاط النهاية المدعومة باستخدام مفتاحك.
    - استخدم الخيارات الإقليمية الصريحة (`zai-coding-global`، `zai-coding-cn`، `zai-global`، `zai-cn`) عندما تريد فرض سطح API محدد.
    - لا يزال متغير البيئة القديم `Z_AI_API_KEY` مقبولًا؛ ينسخه OpenClaw إلى `ZAI_API_KEY` عند بدء التشغيل إذا لم يكن `ZAI_API_KEY` معيّنًا.

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع التكوين" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط تكوين OpenClaw الكامل، بما في ذلك إعدادات المزوّد والنموذج.
  </Card>
</CardGroup>
