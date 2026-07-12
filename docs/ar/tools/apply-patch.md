---
read_when:
    - تحتاج إلى تعديلات منظَّمة على ملفات متعددة
    - تريد توثيق عمليات التحرير القائمة على الرقع أو تصحيح أخطائها
summary: طبّق تصحيحات على ملفات متعددة باستخدام أداة apply_patch
title: أداة apply_patch
x-i18n:
    generated_at: "2026-07-12T06:31:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c0422550ea8d9b0cb6b0ea22d7dcaecc462426f9600003f70c177746f30a3d9
    source_path: tools/apply-patch.md
    workflow: 16
---

طبّق تغييرات الملفات باستخدام تنسيق تصحيح منظّم. يُعد هذا مثاليًا للتعديلات التي تشمل عدة ملفات
أو عدة مقاطع، حيث قد يكون استدعاء `edit` واحد هشًا.

تقبل الأداة سلسلة `input` واحدة تغلّف عملية واحدة أو أكثر من عمليات الملفات:

```text
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@ optional change context
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## المعلمات

- `input` (مطلوب): محتويات التصحيح كاملة، بما في ذلك `*** Begin Patch` و`*** End Patch`.

## ملاحظات

- تدعم مسارات التصحيح المسارات النسبية (بدءًا من دليل مساحة العمل) والمسارات المطلقة.
- القيمة الافتراضية لـ `tools.exec.applyPatch.workspaceOnly` هي `true` (محصور داخل مساحة العمل). اضبطها على `false` فقط إذا كنت تريد عمدًا أن يكتب `apply_patch` أو يحذف خارج دليل مساحة العمل.
- استخدم `*** Move to:` داخل مقطع `*** Update File:` لإعادة تسمية الملفات.
- تشير `*** End of File` إلى إدراج عند نهاية الملف فقط عند الحاجة.
- تكون مفعّلة افتراضيًا لكل نموذج. اضبط `tools.exec.applyPatch.enabled: false`
  لتعطيلها، أو احصرها في نماذج محددة باستخدام
  `tools.exec.applyPatch.allowModels` (تقبل معرّفات أولية مثل `gpt-5.4` أو معرّفات
  كاملة مثل `openai/gpt-5.4`).
- يوجد الإعداد ضمن `tools.exec.applyPatch.*`.

## مثال

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

## ذو صلة

<CardGroup cols={2}>
  <Card title="الفروقات" href="/ar/tools/diffs" icon="code-compare">
    عارض فروقات للقراءة فقط لعرض التغييرات.
  </Card>
  <Card title="أداة التنفيذ" href="/ar/tools/exec" icon="terminal">
    تنفيذ أوامر الصدفة من الوكيل.
  </Card>
  <Card title="تنفيذ الشيفرة" href="/ar/tools/code-execution" icon="square-code">
    تحليل Python بعيد ضمن بيئة معزولة باستخدام xAI.
  </Card>
</CardGroup>
