---
read_when:
    - أنت تريد Z.AI / نماذج GLM في OpenClaw
    - أنت بحاجة إلى إعداد بسيط لـ `ZAI_API_KEY`
summary: استخدم Z.AI (نماذج GLM) مع OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-26T11:39:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e2935aae04850539f46908fcbfc12111eac3ebbd963244e6347165afdd14bc5
    source_path: providers/zai.md
    workflow: 15
---

Z.AI هي منصة API لنماذج **GLM**. وهي توفّر REST APIs لـ GLM وتستخدم مفاتيح API
للمصادقة. أنشئ مفتاح API الخاص بك في وحدة تحكم Z.AI. يستخدم OpenClaw مزوّد `zai`
مع مفتاح API من Z.AI.

- المزوّد: `zai`
- المصادقة: `ZAI_API_KEY`
- API: Z.AI Chat Completions (مصادقة Bearer)

## البدء

<Tabs>
  <Tab title="اكتشاف نقطة النهاية تلقائيًا">
    **الأفضل لـ:** معظم المستخدمين. يكتشف OpenClaw نقطة نهاية Z.AI المطابقة من المفتاح ويطبّق `base URL` الصحيح تلقائيًا.

    <Steps>
      <Step title="تشغيل الإعداد الأوّلي">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="تعيين نموذج افتراضي">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="التحقق من أن النموذج متاح">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="نقطة نهاية إقليمية صريحة">
    **الأفضل لـ:** المستخدمين الذين يريدون فرض Coding Plan محددة أو سطح API عام محدد.

    <Steps>
      <Step title="اختيار خيار الإعداد الأوّلي الصحيح">
        ```bash
        # Coding Plan Global (موصى بها لمستخدمي Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (منطقة الصين)
        openclaw onboard --auth-choice zai-coding-cn

        # API العام
        openclaw onboard --auth-choice zai-global

        # API العام CN (منطقة الصين)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="تعيين نموذج افتراضي">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="التحقق من أن النموذج متاح">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## الكتالوج المضمّن

يقوم OpenClaw حاليًا بتهيئة مزوّد `zai` المضمّن بما يلي:

| مرجع النموذج         | ملاحظات          |
| -------------------- | ---------------- |
| `zai/glm-5.1`        | النموذج الافتراضي |
| `zai/glm-5`          |                  |
| `zai/glm-5-turbo`    |                  |
| `zai/glm-5v-turbo`   |                  |
| `zai/glm-4.7`        |                  |
| `zai/glm-4.7-flash`  |                  |
| `zai/glm-4.7-flashx` |                  |
| `zai/glm-4.6`        |                  |
| `zai/glm-4.6v`       |                  |
| `zai/glm-4.5`        |                  |
| `zai/glm-4.5-air`    |                  |
| `zai/glm-4.5-flash`  |                  |
| `zai/glm-4.5v`       |                  |

<Tip>
نماذج GLM متاحة بصيغة `zai/<model>` (مثال: `zai/glm-5`). مرجع النموذج المضمّن الافتراضي هو `zai/glm-5.1`.
</Tip>

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="الحلّ الأمامي لمعرّفات GLM-5 غير المعروفة">
    تظل معرّفات `glm-5*` غير المعروفة تُحلّ أماميًا على مسار المزوّد المضمّن عبر
    توليد بيانات تعريف يملكها المزوّد من قالب `glm-4.7` عندما يطابق المعرّف
    شكل عائلة GLM-5 الحالية.
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

  <Accordion title="Thinking وPreserved thinking">
    يتبع Thinking في Z.AI عناصر التحكم `/think` الخاصة بـ OpenClaw. عند إيقاف Thinking،
    يرسل OpenClaw `thinking: { type: "disabled" }` لتجنّب الردود التي
    تستهلك ميزانية المخرجات في `reasoning_content` قبل النص المرئي.

    يكون Preserved thinking اختياريًا لأنه في Z.AI يتطلب
    إعادة تشغيل `reasoning_content` التاريخي الكامل، مما يزيد من رموز المطالبة. فعّله
    لكل نموذج:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.1": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    عند تفعيله ومع تشغيل Thinking، يرسل OpenClaw
    `thinking: { type: "enabled", clear_thinking: false }` ويعيد تشغيل
    `reasoning_content` السابق لنفس النسخة النصية المتوافقة مع OpenAI.

    ما يزال بإمكان المستخدمين المتقدمين تجاوز حمولة المزوّد الدقيقة عبر
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="فهم الصور">
    يسجّل Plugin Z.AI المضمّن ميزة فهم الصور.

    | الخاصية      | القيمة      |
    | ------------ | ----------- |
    | النموذج      | `glm-4.6v`  |

    يُحل فهم الصور تلقائيًا من إعدادات مصادقة Z.AI المضبوطة — ولا
    حاجة إلى إعدادات إضافية.

  </Accordion>

  <Accordion title="تفاصيل المصادقة">
    - تستخدم Z.AI مصادقة Bearer مع مفتاح API الخاص بك.
    - يكتشف خيار الإعداد الأوّلي `zai-api-key` نقطة نهاية Z.AI المطابقة تلقائيًا من بادئة المفتاح.
    - استخدم الخيارات الإقليمية الصريحة (`zai-coding-global` و`zai-coding-cn` و`zai-global` و`zai-cn`) عندما تريد فرض سطح API محدد.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="عائلة نماذج GLM" href="/ar/providers/glm" icon="microchip">
    نظرة عامة على عائلة نماذج GLM.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك التبديل الاحتياطي.
  </Card>
</CardGroup>
