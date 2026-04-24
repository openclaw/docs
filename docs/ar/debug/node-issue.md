---
read_when:
    - تصحيح أعطال سكربتات التطوير أو وضع المراقبة الخاصة بـ Node فقط
    - التحقيق في أعطال محمّل tsx/esbuild في OpenClaw
summary: ملاحظات وحلول بديلة لتعطل Node + `tsx` من نوع `"__name is not a function"`
title: تعطل Node + `tsx`
x-i18n:
    generated_at: "2026-04-24T07:39:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d043466f71eae223fa568a3db82e424580ce3269ca11d0e84368beefc25bd25
    source_path: debug/node-issue.md
    workflow: 15
---

# تعطل Node + `tsx` من نوع `\_\_name is not a function`

## الملخص

يفشل تشغيل OpenClaw عبر Node مع `tsx` عند بدء التشغيل مع:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

بدأ هذا بعد تبديل سكربتات التطوير من Bun إلى `tsx` (الالتزام `2871657e`، بتاريخ 2026-01-06). وكان مسار وقت التشغيل نفسه يعمل مع Bun.

## البيئة

- Node: ‏v25.x (تمت ملاحظته على v25.3.0)
- tsx: ‏4.21.0
- نظام التشغيل: macOS (ومن المرجح أن يظهر أيضًا على منصات أخرى تشغّل Node 25)

## إعادة الإنتاج (Node فقط)

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## إعادة إنتاج مصغرة داخل المستودع

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## التحقق من إصدار Node

- Node 25.3.0: يفشل
- Node 22.22.0 (Homebrew `node@22`): يفشل
- Node 24: غير مثبت هنا بعد؛ يحتاج إلى تحقق

## ملاحظات / فرضية

- يستخدم `tsx` الأداة esbuild لتحويل TS/ESM. ويؤدي `keepNames` في esbuild إلى توليد مساعد `__name` ويلف تعريفات الدوال بـ `__name(...)`.
- يشير التعطل إلى أن `__name` موجود لكنه ليس دالة وقت التشغيل، ما يعني أن المساعد مفقود أو تم استبداله لهذا module في مسار محمّل Node 25.
- تم الإبلاغ عن مشكلات مشابهة تتعلق بالمساعد `__name` لدى مستهلكين آخرين لـ esbuild عندما يكون المساعد مفقودًا أو يُعاد كتابته.

## سجل الانحدار

- `2871657e` ‏(2026-01-06): تم تغيير السكربتات من Bun إلى tsx لجعل Bun اختياريًا.
- قبل ذلك (مسار Bun)، كان `openclaw status` و`gateway:watch` يعملان.

## الحلول البديلة

- استخدم Bun لسكربتات التطوير (التراجع المؤقت الحالي).
- استخدم `tsgo` لفحص الأنواع في المستودع، ثم شغّل المخرجات المبنية:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- ملاحظة تاريخية: تم استخدام `tsc` هنا أثناء تصحيح مشكلة Node/tsx هذه، لكن مسارات فحص الأنواع في المستودع تستخدم الآن `tsgo`.
- عطّل `keepNames` الخاص بـ esbuild في محمّل TS إن أمكن (فهذا يمنع إدراج المساعد `__name`)؛ لكن `tsx` لا يكشف هذا حاليًا.
- اختبر Node LTS ‏(22/24) مع `tsx` لمعرفة ما إذا كانت المشكلة خاصة بـ Node 25.

## المراجع

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## الخطوات التالية

- أعد الإنتاج على Node 22/24 لتأكيد ما إذا كان هناك انحدار في Node 25.
- اختبر `tsx` الليلي أو ثبّت إصدارًا أقدم إذا وُجد انحدار معروف.
- إذا أمكن إعادة الإنتاج على Node LTS، فأنشئ إعادة إنتاج مصغرة لدى المصدر مع تتبع المكدس `__name`.

## ذو صلة

- [تثبيت Node.js](/ar/install/node)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
