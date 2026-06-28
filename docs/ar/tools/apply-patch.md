---
read_when:
    - تحتاج إلى إجراء تعديلات منظَّمة على ملفات متعددة
    - تريد توثيق التعديلات القائمة على التصحيحات أو استكشاف أخطائها وإصلاحها
summary: طبّق تصحيحات متعددة الملفات باستخدام أداة apply_patch
title: أداة apply_patch
x-i18n:
    generated_at: "2026-05-06T08:15:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ff2f8e6ecd55ff1bdc553619ab3d590d0967efe7a9a90a31946ad15fd89a1dc
    source_path: tools/apply-patch.md
    workflow: 16
    postprocess_version: locale-links-v1
---

طبّق تغييرات الملفات باستخدام صيغة تصحيح منظّمة. يُعدّ هذا مثاليًا للتعديلات متعددة الملفات
أو متعددة المقاطع حيث يكون استدعاء `edit` واحد هشًا.

تقبل الأداة سلسلة `input` واحدة تغلّف عملية ملف واحدة أو أكثر:

```
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

- `input` (مطلوب): محتويات التصحيح كاملة بما في ذلك `*** Begin Patch` و `*** End Patch`.

## ملاحظات

- تدعم مسارات التصحيح المسارات النسبية (من دليل مساحة العمل) والمسارات المطلقة.
- القيمة الافتراضية لـ `tools.exec.applyPatch.workspaceOnly` هي `true` (محصورة ضمن مساحة العمل). عيّنها إلى `false` فقط إذا كنت تريد عمدًا أن يكتب `apply_patch` أو يحذف خارج دليل مساحة العمل.
- استخدم `*** Move to:` ضمن مقطع `*** Update File:` لإعادة تسمية الملفات.
- يضع `*** End of File` علامة على إدراج خاص بنهاية الملف فقط عند الحاجة.
- متاحة افتراضيًا لنماذج OpenAI و OpenAI Codex. عيّن
  `tools.exec.applyPatch.enabled: false` لتعطيلها.
- يمكن اختياريًا تقييدها حسب النموذج عبر
  `tools.exec.applyPatch.allowModels`.
- الإعدادات موجودة فقط ضمن `tools.exec`.

## مثال

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## ذات صلة

<CardGroup cols={2}>
  <Card title="Diffs" href="/ar/tools/diffs" icon="code-compare">
    عارض فروق للقراءة فقط لعرض التغييرات.
  </Card>
  <Card title="Exec tool" href="/ar/tools/exec" icon="terminal">
    تنفيذ أوامر Shell من الوكيل.
  </Card>
  <Card title="Code execution" href="/ar/tools/code-execution" icon="square-code">
    تحليل Python بعيد ضمن صندوق عزل باستخدام xAI.
  </Card>
</CardGroup>
