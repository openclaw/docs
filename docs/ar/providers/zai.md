---
read_when:
    - تريد استخدام Z.AI / نماذج GLM في OpenClaw
    - تحتاج إلى إعداد بسيط لـ ZAI_API_KEY
summary: استخدم Z.AI (نماذج GLM) مع OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-08T06:01:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66cbd9813ee28d202dcae34debab1b0cf9927793acb00743c1c62b48d9e381f9
    source_path: providers/zai.md
    workflow: 15
---

# Z.AI

Z.AI هي منصة API لنماذج **GLM**. وهي توفّر واجهات REST API لـ GLM وتستخدم مفاتيح API
للمصادقة. أنشئ مفتاح API الخاص بك في وحدة تحكم Z.AI. يستخدم OpenClaw موفّر `zai`
مع مفتاح API من Z.AI.

## إعداد CLI

```bash
# Generic API-key setup with endpoint auto-detection
openclaw onboard --auth-choice zai-api-key

# Coding Plan Global, recommended for Coding Plan users
openclaw onboard --auth-choice zai-coding-global

# Coding Plan CN (China region), recommended for Coding Plan users
openclaw onboard --auth-choice zai-coding-cn

# General API
openclaw onboard --auth-choice zai-global

# General API CN (China region)
openclaw onboard --auth-choice zai-cn
```

## مقتطف الإعدادات

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

يتيح `zai-api-key` لـ OpenClaw اكتشاف نقطة نهاية Z.AI المطابقة من المفتاح
وتطبيق عنوان URL الأساسي الصحيح تلقائيًا. استخدم الخيارات الإقليمية الصريحة عندما
تريد فرض سطح API عام أو Coding Plan محدد.

## كتالوج GLM المضمّن

يقوم OpenClaw حاليًا بتهيئة موفّر `zai` المضمّن بما يلي:

- `glm-5.1`
- `glm-5`
- `glm-5-turbo`
- `glm-5v-turbo`
- `glm-4.7`
- `glm-4.7-flash`
- `glm-4.7-flashx`
- `glm-4.6`
- `glm-4.6v`
- `glm-4.5`
- `glm-4.5-air`
- `glm-4.5-flash`
- `glm-4.5v`

## ملاحظات

- تتوفر نماذج GLM بصيغة `zai/<model>` (مثال: `zai/glm-5`).
- مرجع النموذج المضمّن الافتراضي: `zai/glm-5.1`
- لا تزال معرّفات `glm-5*` غير المعروفة تُحلّ توجيهيًا على مسار الموفّر المضمّن عبر
  توليف بيانات وصفية يملكها الموفّر من قالب `glm-4.7` عندما يطابق المعرّف
  شكل عائلة GLM-5 الحالية.
- يكون `tool_stream` مفعّلًا افتراضيًا لبث استدعاءات الأدوات في Z.AI. اضبط
  `agents.defaults.models["zai/<model>"].params.tool_stream` على `false` لتعطيله.
- راجع [/providers/glm](/ar/providers/glm) للحصول على نظرة عامة على عائلة النماذج.
- تستخدم Z.AI مصادقة Bearer باستخدام مفتاح API الخاص بك.
