---
read_when:
    - أنت تريد نماذج GLM في OpenClaw
    - أنت تحتاج إلى اصطلاح تسمية النموذج وطريقة الإعداد
summary: نظرة عامة على عائلة نماذج GLM + كيفية استخدامها في OpenClaw
title: GLM (Zhipu)
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T07:58:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0272f0621559c0aba2c939dc52771ac2c94a20f9f7201c1f71d80a9c2197c7e7
    source_path: providers/glm.md
    workflow: 15
---

# نماذج GLM

GLM هي **عائلة نماذج** (وليست شركة) متاحة عبر منصة Z.AI. في OpenClaw، يتم الوصول إلى
نماذج GLM عبر المزوّد `zai` ومعرّفات نماذج مثل `zai/glm-5`.

## البدء

<Steps>
  <Step title="اختر مسار مصادقة وشغّل onboarding">
    اختر خيار onboarding الذي يطابق خطة Z.AI والمنطقة لديك:

    | خيار المصادقة | الأنسب لـ |
    | ----------- | -------- |
    | `zai-api-key` | إعداد عام بمفتاح API مع اكتشاف تلقائي لنقطة النهاية |
    | `zai-coding-global` | مستخدمي Coding Plan (العالمي) |
    | `zai-coding-cn` | مستخدمي Coding Plan (منطقة الصين) |
    | `zai-global` | واجهة API العامة (العالمي) |
    | `zai-cn` | واجهة API العامة (منطقة الصين) |

    ```bash
    # مثال: اكتشاف تلقائي عام
    openclaw onboard --auth-choice zai-api-key

    # مثال: Coding Plan العالمي
    openclaw onboard --auth-choice zai-coding-global
    ```

  </Step>
  <Step title="اضبط GLM كنموذج افتراضي">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="تحقق من توفر النماذج">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## مثال إعداد

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
يتيح `zai-api-key` لـ OpenClaw اكتشاف نقطة نهاية Z.AI المطابقة من المفتاح
وتطبيق عنوان URL الأساسي الصحيح تلقائيًا. استخدم الخيارات الإقليمية الصريحة عندما
تريد فرض سطح Coding Plan أو واجهة API العامة لمنطقة محددة.
</Tip>

## الكتالوج المضمّن

يقوم OpenClaw حاليًا بتهيئة المزوّد `zai` المضمّن بمراجع GLM التالية:

| النموذج         | النموذج         |
| --------------- | --------------- |
| `glm-5.1`       | `glm-4.7`       |
| `glm-5`         | `glm-4.7-flash` |
| `glm-5-turbo`   | `glm-4.7-flashx` |
| `glm-5v-turbo`  | `glm-4.6`       |
| `glm-4.5`       | `glm-4.6v`      |
| `glm-4.5-air`   |                 |
| `glm-4.5-flash` |                 |
| `glm-4.5v`      |                 |

<Note>
مرجع النموذج المضمّن الافتراضي هو `zai/glm-5.1`. يمكن أن تتغير إصدارات GLM وتوفرها؛ راجع
وثائق Z.AI للاطلاع على الأحدث.
</Note>

## إعداد متقدم

<AccordionGroup>
  <Accordion title="الاكتشاف التلقائي لنقطة النهاية">
    عندما تستخدم خيار المصادقة `zai-api-key`، يفحص OpenClaw تنسيق المفتاح
    لتحديد عنوان Z.AI الأساسي الصحيح. أما الخيارات الإقليمية الصريحة
    (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) فتتجاوز
    الاكتشاف التلقائي وتثبت نقطة النهاية مباشرة.
  </Accordion>

  <Accordion title="تفاصيل المزوّد">
    يتم تقديم نماذج GLM بواسطة مزوّد وقت التشغيل `zai`. وللحصول على إعداد
    المزوّد الكامل، ونقاط النهاية الإقليمية، والإمكانات الإضافية، راجع
    [وثائق مزوّد Z.AI](/ar/providers/zai).
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="مزوّد Z.AI" href="/ar/providers/zai" icon="server">
    إعداد مزوّد Z.AI الكامل ونقاط النهاية الإقليمية.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك failover.
  </Card>
</CardGroup>
