---
read_when:
    - التحقيق في تعطل مُحمِّل tsx/esbuild يشير إلى مساعد __name مفقود
summary: انهيار Node + tsx التاريخي «__name is not a function» وسببه
title: تعطّل Node + tsx
x-i18n:
    generated_at: "2026-07-12T05:53:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97d2f62d24860cee65753027ba84c14c8d4ffb910ee17bb0032cf0409c427589
    source_path: debug/node-issue.md
    workflow: 16
---

# تعطل Node + tsx بسبب الخطأ "\_\_name is not a function"

## الحالة

تم الحل. لا يمكن إعادة إنتاج هذا التعطل باستخدام إصدار `tsx` الحالي المثبّت في
`package.json` (`4.22.3`) أو إصدارات Node الحالية. أُبقيت هذه الصفحة هنا تحسبًا
لإعادة ظهور المشكلة نتيجة ترقية مستقبلية لـ `tsx`/esbuild.

## العَرَض الأصلي

فشل تشغيل نصوص تطوير OpenClaw البرمجية عبر `tsx` عند بدء التشغيل مع ظهور:

```text
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (src/logging/subsystem.ts)
    at <caller> (src/agents/auth-profiles/constants.ts)
```

حُذفت أرقام الأسطر؛ فقد تغيّر كلا الملفين منذ حدوث التعطل الأصلي،
ولم تعد الأسطر المحددة متطابقة.

ظهر هذا بعد انتقال نصوص التطوير البرمجية من Bun إلى `tsx` (`2871657e`،
2026-01-06) لجعل Bun اختياريًا. ولم يتعطل المسار المكافئ المعتمد على Bun.
رُصدت المشكلة في الأصل على Node v25.3.0 في macOS؛ وكان من المرجح أيضًا تأثر
المنصات الأخرى التي تشغّل Node 25.

## السبب

يحوّل `tsx` شيفرة TS/ESM عبر esbuild مع تثبيت `keepNames: true` صراحةً ضمن
خيارات التحويل. يجعل هذا الإعداد esbuild يغلّف تعريفات الدوال/الفئات المسماة
باستدعاء مساعد `__name`، لكي تبقى `fn.name` محفوظة بعد التصغير
والحزم. يعني التعطل أن المساعد كان مفقودًا أو محجوبًا عند موضع الاستدعاء
لهذه الوحدة ضمن توليفة `tsx`/Node المتأثرة، ولذلك طرح `__name(...)`
خطأً بدلًا من إعادة القيمة المغلّفة.

## فحص إعادة الإنتاج الحالي

```bash
node --version
pnpm install
node --import tsx src/entry.ts status
```

إعادة إنتاج معزولة بالحد الأدنى (تحمّل فقط الوحدة الواردة في تتبع المكدس الأصلي):

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

ينتهي كلا الأمرين حاليًا دون أخطاء. إذا طرح أي منهما الخطأ `__name is not a
function` مرة أخرى، فالتقط إصدار Node الدقيق وإصدار `tsx`
(`node_modules/tsx/package.json`) وتتبع المكدس الكامل قبل رفع المشكلة إلى
المشروع الأصلي.

## الحلول البديلة (إذا عاد التعطل)

- شغّل نصوص التطوير البرمجية باستخدام Bun بدلًا من `node --import tsx`.
- شغّل `pnpm tsgo` للتحقق من الأنواع، ثم شغّل المخرجات المبنية بدلًا من تشغيل
  المصدر عبر `tsx`:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- جرّب إصدارًا مختلفًا من `tsx` (يُعد `pnpm add -D tsx@<version>` تغييرًا
  في التبعيات ويتطلب موافقة وفقًا لسياسة المستودع) لتحديد ما إذا كان إصدار
  esbuild المضمّن فيه قد أعاد إدخال الخلل.
- اختبر باستخدام إصدار رئيسي/فرعي مختلف من Node لمعرفة ما إذا كان الفشل
  خاصًا بإصدار معين.

## المراجع

- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## ذو صلة

- [تثبيت Node.js](/ar/install/node)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
