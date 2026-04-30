---
read_when:
    - تريد استخدام نماذج Z.AI / GLM في OpenClaw
    - تحتاج إلى إعداد بسيط لـ ZAI_API_KEY
summary: استخدام Z.AI (نماذج GLM) مع OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-30T08:23:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0192797b9e023065a384b0428830e73877a5088d2c40c2190d5322273294607d
    source_path: providers/zai.md
    workflow: 16
---

Z.AI هي منصة API لنماذج **GLM**. توفر واجهات REST API لـ GLM وتستخدم مفاتيح API
للمصادقة. أنشئ مفتاح API الخاص بك في لوحة تحكم Z.AI. يستخدم OpenClaw مزوّد `zai`
مع مفتاح API من Z.AI.

- المزوّد: `zai`
- المصادقة: `ZAI_API_KEY`
- API: إكمالات دردشة Z.AI (مصادقة Bearer)

## بدء الاستخدام

<Tabs>
  <Tab title="Auto-detect endpoint">
    **الأفضل لـ:** معظم المستخدمين. يكتشف OpenClaw نقطة نهاية Z.AI المطابقة من المفتاح ويطبّق عنوان URL الأساسي الصحيح تلقائيًا.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Explicit regional endpoint">
    **الأفضل لـ:** المستخدمين الذين يريدون فرض Coding Plan محددة أو سطح API عام.

    <Steps>
      <Step title="Pick the right onboarding choice">
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
      <Step title="Set a default model">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## الفهرس المضمّن

يزرع OpenClaw حاليًا مزوّد `zai` المضمّن باستخدام:

| مرجع النموذج          | ملاحظات            |
| -------------------- | ------------- |
| `zai/glm-5.1`        | النموذج الافتراضي |
| `zai/glm-5`          |               |
| `zai/glm-5-turbo`    |               |
| `zai/glm-5v-turbo`   |               |
| `zai/glm-4.7`        |               |
| `zai/glm-4.7-flash`  |               |
| `zai/glm-4.7-flashx` |               |
| `zai/glm-4.6`        |               |
| `zai/glm-4.6v`       |               |
| `zai/glm-4.5`        |               |
| `zai/glm-4.5-air`    |               |
| `zai/glm-4.5-flash`  |               |
| `zai/glm-4.5v`       |               |

<Tip>
تتوفر نماذج GLM بصيغة `zai/<model>` (مثال: `zai/glm-5`). مرجع النموذج المضمّن الافتراضي هو `zai/glm-5.1`.
</Tip>

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="Forward-resolving unknown GLM-5 models">
    ما تزال معرّفات `glm-5*` غير المعروفة تُحلّ مسبقًا على مسار المزوّد المضمّن عبر
    إنشاء بيانات وصفية مملوكة للمزوّد من قالب `glm-4.7` عندما يطابق المعرّف
    شكل عائلة GLM-5 الحالي.
  </Accordion>

  <Accordion title="Tool-call streaming">
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

  <Accordion title="Thinking and preserved thinking">
    يتبع تفكير Z.AI عناصر تحكم `/think` في OpenClaw. عند إيقاف التفكير،
    يرسل OpenClaw ‏`thinking: { type: "disabled" }` لتجنب الاستجابات التي
    تنفق ميزانية الإخراج على `reasoning_content` قبل النص المرئي.

    التفكير المحفوظ اختياري لأن Z.AI يتطلب إعادة تشغيل كامل
    `reasoning_content` التاريخي، ما يزيد رموز المطالبة. فعّله
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

    عند تفعيله وتشغيل التفكير، يرسل OpenClaw
    `thinking: { type: "enabled", clear_thinking: false }` ويعيد تشغيل
    `reasoning_content` السابق لنفس النص المتسلسل المتوافق مع OpenAI.

    لا يزال بإمكان المستخدمين المتقدمين تجاوز حمولة المزوّد الدقيقة باستخدام
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Image understanding">
    يسجّل Plugin ‏Z.AI المضمّن فهم الصور.

    | الخاصية      | القيمة       |
    | ------------- | ----------- |
    | النموذج       | `glm-4.6v`  |

    يُحلّ فهم الصور تلقائيًا من مصادقة Z.AI المكوّنة، ولا حاجة إلى
    تكوين إضافي.

  </Accordion>

  <Accordion title="Auth details">
    - يستخدم Z.AI مصادقة Bearer مع مفتاح API الخاص بك.
    - يكتشف اختيار الإعداد الأولي `zai-api-key` نقطة نهاية Z.AI المطابقة تلقائيًا من بادئة المفتاح.
    - استخدم الخيارات الإقليمية الصريحة (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) عندما تريد فرض سطح API محدد.

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="GLM model family" href="/ar/providers/glm" icon="microchip">
    نظرة عامة على عائلة نماذج GLM.
  </Card>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
</CardGroup>
