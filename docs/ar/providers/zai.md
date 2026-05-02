---
read_when:
    - تريد نماذج Z.AI / GLM في OpenClaw
    - تحتاج إلى إعداد بسيط لـ ZAI_API_KEY
summary: استخدم Z.AI (نماذج GLM) مع OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-05-02T07:41:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423fc2bc27c62352d9d9acd13c70aa2bc3804112dab25aa46505e844cb166c93
    source_path: providers/zai.md
    workflow: 16
---

Z.AI هي منصة API لنماذج **GLM**. توفر REST APIs لـ GLM وتستخدم مفاتيح API
للمصادقة. أنشئ مفتاح API الخاص بك في وحدة تحكم Z.AI. يستخدم OpenClaw موفر `zai`
مع مفتاح Z.AI API.

- الموفر: `zai`
- المصادقة: `ZAI_API_KEY`
- API: إكمالات الدردشة في Z.AI (مصادقة Bearer)

## البدء

<Tabs>
  <Tab title="Auto-detect endpoint">
    **الأفضل لـ:** معظم المستخدمين. يكتشف OpenClaw نقطة نهاية Z.AI المطابقة من المفتاح ويطبق عنوان URL الأساسي الصحيح تلقائيا.

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
      <Step title="Verify the model is listed">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Explicit regional endpoint">
    **الأفضل لـ:** المستخدمين الذين يريدون فرض خطة ترميز محددة أو سطح API عام.

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
      <Step title="Verify the model is listed">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## الكتالوج المضمن

يشحن OpenClaw كتالوج موفر `zai` المضمن في بيان Plugin، لذا يمكن أن يعرض
السرد للقراءة فقط صفوف GLM المعروفة دون تحميل وقت تشغيل الموفر:

```bash
openclaw models list --all --provider zai
```

يتضمن الكتالوج المدعوم بالبيان حاليا:

| مرجع النموذج         | ملاحظات           |
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
تتوفر نماذج GLM بصيغة `zai/<model>` (مثال: `zai/glm-5`). مرجع النموذج المضمن الافتراضي هو `zai/glm-5.1`.
</Tip>

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="Forward-resolving unknown GLM-5 models">
    لا تزال معرفات `glm-5*` غير المعروفة تحل إلى الأمام على مسار الموفر المضمن عبر
    إنشاء بيانات وصفية مملوكة للموفر من قالب `glm-4.7` عندما يطابق المعرف
    شكل عائلة GLM-5 الحالي.
  </Accordion>

  <Accordion title="Tool-call streaming">
    يتم تمكين `tool_stream` افتراضيا لبث استدعاءات الأدوات في Z.AI. لتعطيله:

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
    يتبع التفكير في Z.AI عناصر تحكم `/think` في OpenClaw. عند إيقاف التفكير،
    يرسل OpenClaw القيمة `thinking: { type: "disabled" }` لتجنب الاستجابات التي
    تستهلك ميزانية الإخراج في `reasoning_content` قبل النص المرئي.

    التفكير المحفوظ اختياري لأن Z.AI يتطلب إعادة تشغيل
    `reasoning_content` التاريخي بالكامل، مما يزيد رموز المطالبة. فعله
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

    عند تمكينه وتشغيل التفكير، يرسل OpenClaw
    `thinking: { type: "enabled", clear_thinking: false }` ويعيد تشغيل
    `reasoning_content` السابق للنص الحواري نفسه المتوافق مع OpenAI.

    لا يزال بإمكان المستخدمين المتقدمين تجاوز حمولة الموفر الدقيقة باستخدام
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Image understanding">
    يسجل Plugin Z.AI المضمن فهم الصور.

    | الخاصية      | القيمة       |
    | ------------- | ----------- |
    | النموذج         | `glm-4.6v`  |

    يتم حل فهم الصور تلقائيا من مصادقة Z.AI المكونة، ولا حاجة إلى
    إعدادات إضافية.

  </Accordion>

  <Accordion title="Auth details">
    - تستخدم Z.AI مصادقة Bearer مع مفتاح API الخاص بك.
    - يكتشف اختيار الإعداد الأولي `zai-api-key` نقطة نهاية Z.AI المطابقة تلقائيا من بادئة المفتاح.
    - استخدم الاختيارات الإقليمية الصريحة (`zai-coding-global` و`zai-coding-cn` و`zai-global` و`zai-cn`) عندما تريد فرض سطح API محدد.

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="GLM model family" href="/ar/providers/glm" icon="microchip">
    نظرة عامة على عائلة نماذج GLM.
  </Card>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفرين ومراجع النماذج وسلوك الانتقال عند الفشل.
  </Card>
</CardGroup>
