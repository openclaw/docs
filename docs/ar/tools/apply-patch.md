---
read_when:
    - أنت تحتاج إلى تعديلات منظَّمة على الملفات عبر عدة ملفات
    - أنت تريد توثيق التعديلات المعتمدة على الترقيعات أو تصحيح أخطائها
summary: طبّق ترقيعات متعددة الملفات باستخدام أداة `apply_patch`
title: أداة `apply_patch`
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T08:06:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ed6d8282166de3cacf5be7f253498a230bceb2ad6c82a08846aed5bc613da53
    source_path: tools/apply-patch.md
    workflow: 15
---

طبّق تغييرات الملفات باستخدام تنسيق ترقية منظّم. وهذا مثالي للتعديلات متعددة الملفات
أو متعددة المقاطع حيث يكون استدعاء `edit` واحد هشًا.

تقبل الأداة سلسلة `input` واحدة تلتف حول عملية واحدة أو أكثر على الملفات:

```text
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## المعاملات

- `input` (مطلوب): محتوى الترقية الكامل بما في ذلك `*** Begin Patch` و`*** End Patch`.

## ملاحظات

- تدعم مسارات الترقية المسارات النسبية (انطلاقًا من دليل مساحة العمل) والمسارات المطلقة.
- تكون القيمة الافتراضية لـ `tools.exec.applyPatch.workspaceOnly` هي `true` (ضمن مساحة العمل فقط). اضبطها على `false` فقط إذا كنت تقصد عمدًا أن تكتب `apply_patch` أو تحذف خارج دليل مساحة العمل.
- استخدم `*** Move to:` داخل مقطع `*** Update File:` لإعادة تسمية الملفات.
- تشير `*** End of File` إلى إدراج عند نهاية الملف فقط عند الحاجة.
- تكون متاحة افتراضيًا لنماذج OpenAI وOpenAI Codex. اضبط
  `tools.exec.applyPatch.enabled: false` لتعطيلها.
- ويمكنك اختياريًا تقييدها حسب النموذج عبر
  `tools.exec.applyPatch.allowModels`.
- يوجد الإعداد فقط تحت `tools.exec`.

## مثال

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## ذو صلة

- [Diffs](/ar/tools/diffs)
- [أداة Exec](/ar/tools/exec)
- [تنفيذ الشيفرة](/ar/tools/code-execution)
