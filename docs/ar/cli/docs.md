---
read_when:
    - تريد البحث في مستندات OpenClaw المباشرة من الطرفية
summary: مرجع CLI لـ `openclaw docs` (ابحث في فهرس المستندات المباشر)
title: المستندات
x-i18n:
    generated_at: "2026-04-24T07:34:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d208f5b9a3576ce0597abca600df109db054d20068359a9f2070ac30b1a8f69
    source_path: cli/docs.md
    workflow: 15
---

# `openclaw docs`

ابحث في فهرس المستندات المباشر.

الوسائط:

- `[query...]`: مصطلحات البحث التي تُرسل إلى فهرس المستندات المباشر

أمثلة:

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

ملاحظات:

- بدون استعلام، يفتح `openclaw docs` نقطة الدخول إلى البحث في المستندات المباشرة.
- يتم تمرير الاستعلامات متعددة الكلمات كطلب بحث واحد.

## ذو صلة

- [مرجع CLI](/ar/cli)
