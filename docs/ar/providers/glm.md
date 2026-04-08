---
read_when:
    - أنت تريد نماذج GLM في OpenClaw
    - أنت بحاجة إلى اصطلاح تسمية النماذج والإعداد
summary: نظرة عامة على عائلة نماذج GLM + كيفية استخدامها في OpenClaw
title: نماذج GLM
x-i18n:
    generated_at: "2026-04-08T06:01:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 79a55acfa139847b4b85dbc09f1068cbd2febb1e49f984a23ea9e3b43bc910eb
    source_path: providers/glm.md
    workflow: 15
---

# نماذج GLM

GLM هي **عائلة نماذج** (وليست شركة) ومتاحة عبر منصة Z.AI. في OpenClaw، يتم
الوصول إلى نماذج GLM عبر موفر `zai` ومعرّفات نماذج مثل `zai/glm-5`.

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
تريد فرض سطح Coding Plan أو General API محدد.

## نماذج GLM المجمّعة الحالية

يقوم OpenClaw حاليًا بتهيئة موفر `zai` المجمّع بمراجع GLM التالية:

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

- قد تتغير إصدارات GLM ومدى توفرها؛ راجع وثائق Z.AI للحصول على الأحدث.
- مرجع النموذج المجمّع الافتراضي هو `zai/glm-5.1`.
- للحصول على تفاصيل الموفر، راجع [/providers/zai](/ar/providers/zai).
