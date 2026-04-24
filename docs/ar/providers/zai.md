---
read_when:
    - تريد نماذج Z.AI / GLM في OpenClaw
    - تحتاج إلى إعداد بسيط لـ `ZAI_API_KEY`
summary: استخدم Z.AI ‏(نماذج GLM) مع OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-24T08:02:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2095be914fa9861c8aad2cb1e2ebe78f6e29183bf041a191205626820d3b71df
    source_path: providers/zai.md
    workflow: 15
---

Z.AI هي منصة API الخاصة بنماذج **GLM**. وهي توفر REST APIs لـ GLM وتستخدم مفاتيح API
للمصادقة. أنشئ مفتاح API الخاص بك في لوحة Z.AI. ويستخدم OpenClaw المزوّد `zai`
مع مفتاح Z.AI API.

- المزوّد: `zai`
- المصادقة: `ZAI_API_KEY`
- API: ‏Z.AI Chat Completions ‏(مصادقة Bearer)

## البدء

<Tabs>
  <Tab title="اكتشاف نقطة النهاية تلقائيًا">
    **الأفضل لـ:** معظم المستخدمين. يكتشف OpenClaw نقطة نهاية Z.AI المطابقة من المفتاح ويطبّق عنوان URL الأساسي الصحيح تلقائيًا.

    <Steps>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="اضبط نموذجًا افتراضيًا">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="تحقق من أن النموذج متاح">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="نقطة نهاية إقليمية صريحة">
    **الأفضل لـ:** المستخدمين الذين يريدون فرض سطح Coding Plan محدد أو سطح API عام.

    <Steps>
      <Step title="اختر خيار الإعداد الأولي الصحيح">
        ```bash
        # Coding Plan Global (موصى به لمستخدمي Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (منطقة الصين)
        openclaw onboard --auth-choice zai-coding-cn

        # API عام
        openclaw onboard --auth-choice zai-global

        # General API CN (منطقة الصين)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="اضبط نموذجًا افتراضيًا">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="تحقق من أن النموذج متاح">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## الكتالوج المضمن

يقوم OpenClaw حاليًا بزرع المزوّد المضمن `zai` بما يلي:

| مرجع النموذج        | ملاحظات          |
| ------------------- | ---------------- |
| `zai/glm-5.1`       | النموذج الافتراضي |
| `zai/glm-5`         |                  |
| `zai/glm-5-turbo`   |                  |
| `zai/glm-5v-turbo`  |                  |
| `zai/glm-4.7`       |                  |
| `zai/glm-4.7-flash` |                  |
| `zai/glm-4.7-flashx` |                 |
| `zai/glm-4.6`       |                  |
| `zai/glm-4.6v`      |                  |
| `zai/glm-4.5`       |                  |
| `zai/glm-4.5-air`   |                  |
| `zai/glm-4.5-flash` |                  |
| `zai/glm-4.5v`      |                  |

<Tip>
تتوفر نماذج GLM بالشكل `zai/<model>` ‏(مثال: `zai/glm-5`). ومرجع النموذج المضمن الافتراضي هو `zai/glm-5.1`.
</Tip>

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="التحليل المستقبلي لنماذج GLM-5 غير المعروفة">
    ما تزال معرّفات `glm-5*` غير المعروفة تُحلَّل مستقبلًا على مسار المزوّد المضمن عبر
    توليد بيانات وصفية مملوكة للمزوّد من قالب `glm-4.7` عندما يطابق المعرّف
    شكل عائلة GLM-5 الحالية.
  </Accordion>

  <Accordion title="بث استدعاءات الأدوات">
    يكون `tool_stream` مفعّلًا افتراضيًا لبث استدعاءات الأدوات في Z.AI. ولتعطيله:

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

  <Accordion title="فهم الصور">
    يسجل Plugin ‏Z.AI المضمن فهم الصور.

    | الخاصية      | القيمة      |
    | ------------- | ----------- |
    | النموذج       | `glm-4.6v`  |

    يتم تحليل فهم الصور تلقائيًا من مصادقة Z.AI المضبوطة — ولا
    حاجة إلى إعدادات إضافية.

  </Accordion>

  <Accordion title="تفاصيل المصادقة">
    - يستخدم Z.AI مصادقة Bearer مع مفتاح API الخاص بك.
    - يقوم خيار الإعداد الأولي `zai-api-key` باكتشاف نقطة نهاية Z.AI المطابقة تلقائيًا من بادئة المفتاح.
    - استخدم الخيارات الإقليمية الصريحة (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) عندما تريد فرض سطح API محدد.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="عائلة نماذج GLM" href="/ar/providers/glm" icon="microchip">
    نظرة عامة على عائلة نماذج GLM.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك الرجوع عند الفشل.
  </Card>
</CardGroup>
