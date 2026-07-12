---
read_when:
    - إضافة قائمة تحقق إلى BOOT.md
summary: قالب مساحة العمل لملف BOOT.md
title: قالب BOOT.md
x-i18n:
    generated_at: "2026-07-12T06:33:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1adfb4d71f1f03716a1ddc4774a4cb6ead4b8be65bd9bb34066a9e1929a36b21
    source_path: reference/templates/BOOT.md
    workflow: 16
---

# BOOT.md

أضف هنا تعليمات بدء تشغيل قصيرة وصريحة. يشغّل خطاف `boot-md` المضمّن هذا الملف مرة واحدة لكل مساحة عمل للوكيل في كل مرة يبدأ فيها Gateway، إذا كان الملف موجودًا ويحتوي على محتوى غير مكوّن من مسافات بيضاء فقط. لا تؤدي مشاركة عدة وكلاء لمساحة عمل واحدة إلا إلى تشغيل واحد.

يأتي الخطاف معطّلًا. فعّله أولًا:

```bash
openclaw hooks enable boot-md
```

إذا كان أحد عناصر قائمة التحقق يرسل رسالة، فاستخدم أداة الرسائل، ثم أجب برمز الصمت نفسه تمامًا `NO_REPLY` (من دون حساسية لحالة الأحرف).

## ذو صلة

- [مساحة عمل الوكيل](/ar/concepts/agent-workspace)
- [الخطافات](/ar/automation/hooks#boot-md)
