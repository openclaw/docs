---
read_when:
    - تريد تحديث نسخة مصدرية بأمان
    - تحتاج إلى فهم السلوك المختصر لـ `--update`
summary: مرجع CLI لـ `openclaw update` (تحديث المصدر بشكل آمن نسبيًا + إعادة تشغيل Gateway تلقائيًا)
title: التحديث
x-i18n:
    generated_at: "2026-04-26T11:26:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: e86e7f8ffbf3f4ccd0787ba06aead35cb96e8db98c5d32c99b18ef9fda62efd6
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

حدّث OpenClaw بأمان وبدّل بين قنوات stable/beta/dev.

إذا قمت بالتثبيت عبر **npm/pnpm/bun** (تثبيت عام، من دون بيانات تعريف git)،
فتتم التحديثات عبر مسار مدير الحزم في [التحديث](/ar/install/updating).

## الاستخدام

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## الخيارات

- `--no-restart`: تخطَّ إعادة تشغيل خدمة Gateway بعد تحديث ناجح. وتتحقق تحديثات مدير الحزم التي تعيد تشغيل Gateway من أن الخدمة المعاد تشغيلها تُبلغ عن الإصدار المحدّث المتوقع قبل أن ينجح الأمر.
- `--channel <stable|beta|dev>`: تعيين قناة التحديث (git + npm؛ وتُحفَظ في الإعدادات).
- `--tag <dist-tag|version|spec>`: تجاوز هدف الحزمة لهذا التحديث فقط. وبالنسبة إلى تثبيتات الحزم، يُربط `main` إلى `github:openclaw/openclaw#main`.
- `--dry-run`: معاينة إجراءات التحديث المخطط لها (القناة/الوسم/الهدف/تدفّق إعادة التشغيل) من دون كتابة الإعدادات أو التثبيت أو مزامنة Plugins أو إعادة التشغيل.
- `--json`: طباعة JSON قابل للقراءة آليًا من نوع `UpdateRunResult`، بما في
  ذلك `postUpdate.plugins.integrityDrifts` عند اكتشاف انحراف سلامة في
  مكوّنات npm الإضافية أثناء مزامنة Plugins بعد التحديث.
- `--timeout <seconds>`: مهلة لكل خطوة (الافتراضي 1800 ثانية).
- `--yes`: تخطّي مطالبات التأكيد (مثل تأكيد الرجوع إلى إصدار أقدم)

ملاحظة: تتطلب عمليات الرجوع إلى إصدار أقدم تأكيدًا لأن الإصدارات الأقدم قد تكسر الإعدادات.

## `update status`

اعرض قناة التحديث النشطة + وسم/فرع/SHA الخاص بـ git (لنسخ المصدر)، بالإضافة إلى توفر التحديثات.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

الخيارات:

- `--json`: طباعة JSON للحالة قابل للقراءة آليًا.
- `--timeout <seconds>`: مهلة للفحوصات (الافتراضي 3 ثوانٍ).

## `update wizard`

تدفّق تفاعلي لاختيار قناة تحديث وتأكيد ما إذا كنت تريد إعادة تشغيل Gateway
بعد التحديث (الافتراضي هو إعادة التشغيل). وإذا اخترت `dev` من دون نسخة git،
فسيعرض إنشاء واحدة.

الخيارات:

- `--timeout <seconds>`: مهلة لكل خطوة تحديث (الافتراضي `1800`)

## ما الذي يفعله

عندما تبدّل القنوات صراحةً (`--channel ...`)، يحافظ OpenClaw أيضًا على
اتساق طريقة التثبيت:

- `dev` → يضمن وجود نسخة git (الافتراضي: `~/openclaw`، ويمكن التجاوز عبر `OPENCLAW_GIT_DIR`)،
  ويحدّثها، ويثبّت CLI العام من تلك النسخة.
- `stable` → يثبّت من npm باستخدام `latest`.
- `beta` → يفضّل dist-tag في npm وهو `beta`، لكنه يرجع إلى `latest` عندما تكون beta
  مفقودة أو أقدم من إصدار stable الحالي.

يعيد المحدّث التلقائي لنواة Gateway (عند تمكينه عبر الإعدادات) استخدام مسار التحديث نفسه هذا.

بالنسبة إلى تثبيتات مدير الحزم، يحل `openclaw update` إصدار الحزمة الهدف
قبل استدعاء مدير الحزم. وحتى عندما يطابق الإصدار المثبّت بالفعل الإصدار الهدف،
يحدّث الأمر تثبيت الحزمة العامة، ثم يشغّل مزامنة Plugins، وتحديث الإكمالات، وأعمال إعادة التشغيل. وهذا يبقي
المكوّنات الجانبية المعبأة وسجلات Plugins المملوكة للقنوات متسقة مع إصدار
OpenClaw المثبّت.

## تدفّق نسخة git

القنوات:

- `stable`: يفحص أحدث وسم غير beta، ثم build + doctor.
- `beta`: يفضّل أحدث وسم `-beta`، لكنه يرجع إلى أحدث وسم stable
  عندما تكون beta مفقودة أو أقدم.
- `dev`: يفحص `main`، ثم يجلب + يعيد الأساس.

على مستوى عالٍ:

1. يتطلب شجرة عمل نظيفة (من دون تغييرات غير ملتزم بها).
2. يبدّل إلى القناة المحددة (وسم أو فرع).
3. يجلب من upstream (لـ dev فقط).
4. dev فقط: فحص تمهيدي لـ lint + TypeScript build في شجرة عمل مؤقتة؛ وإذا فشل الطرف الأحدث، يعود حتى 10 التزامات للعثور على أحدث build نظيف.
5. يعيد الأساس على الالتزام المحدد (لـ dev فقط).
6. يثبّت التبعيات باستخدام مدير حزم المستودع. وبالنسبة إلى نسخ pnpm، يقوم المحدّث بتهيئة `pnpm` عند الطلب (عبر `corepack` أولًا، ثم احتياطيًا عبر `npm install pnpm@10` مؤقتًا) بدلًا من تشغيل `npm run build` داخل مساحة عمل pnpm.
7. يشغّل build + build لـ Control UI.
8. يشغّل `openclaw doctor` كفحص "تحديث آمن" نهائي.
9. يزامن Plugins مع القناة النشطة (يستخدم dev Plugins المضمّنة؛ بينما تستخدم stable/beta npm) ويحدّث Plugins المثبتة عبر npm.

إذا حُلّ تحديث Plugin مثبتة عبر npm ومثبّتة بإصدار محدد إلى مكوّن تختلف
سلامته عن سجل التثبيت المخزّن، فإن `openclaw update` يوقف تحديث مكوّن تلك Plugin
بدلًا من تثبيته. أعد تثبيت Plugin أو حدّثها صراحةً فقط بعد التحقق من أنك تثق بالمكوّن الجديد.

تؤدي إخفاقات مزامنة Plugins بعد التحديث إلى فشل نتيجة التحديث وإيقاف أعمال
إعادة التشغيل اللاحقة. أصلح خطأ تثبيت/تحديث Plugin، ثم أعد تشغيل
`openclaw update`.

إذا استمرت تهيئة pnpm في الفشل، يتوقف المحدّث الآن مبكرًا مع خطأ خاص بمدير الحزم بدلًا من محاولة `npm run build` داخل النسخة.

## الاختصار `--update`

يعيد `openclaw --update` الكتابة إلى `openclaw update` (وهو مفيد للأصداف وسكربتات التشغيل).

## ذو صلة

- `openclaw doctor` (يعرض تشغيل التحديث أولًا على نسخ git)
- [قنوات التطوير](/ar/install/development-channels)
- [التحديث](/ar/install/updating)
- [مرجع CLI](/ar/cli)
