---
read_when:
    - تريد تحديث نسخة مصدر checkout بأمان
    - تحتاج إلى فهم السلوك المختصر لـ `--update`
summary: مرجع CLI لـ `openclaw update` (تحديث المصدر بشكل آمن نسبيًا + إعادة التشغيل التلقائي لـ Gateway)
title: التحديث
x-i18n:
    generated_at: "2026-04-24T07:36:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7ab28ae6fe91c094826ccbd9fa11c5d7c41849cc95d570a634a0721b82f0e3a
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

حدّث OpenClaw بأمان وبدّل بين قنوات stable/beta/dev.

إذا قمت بالتثبيت عبر **npm/pnpm/bun** ‏(تثبيت عام، من دون بيانات git)،
فتتم التحديثات عبر تدفق مدير الحزم في [التحديث](/ar/install/updating).

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

- `--no-restart`: تخطي إعادة تشغيل خدمة Gateway بعد تحديث ناجح.
- `--channel <stable|beta|dev>`: تعيين قناة التحديث (git + npm؛ يتم حفظها في الإعدادات).
- `--tag <dist-tag|version|spec>`: تجاوز هدف الحزمة لهذا التحديث فقط. بالنسبة إلى عمليات التثبيت عبر الحزم، يتم تعيين `main` إلى `github:openclaw/openclaw#main`.
- `--dry-run`: معاينة إجراءات التحديث المخططة (القناة/الوسم/الهدف/تدفق إعادة التشغيل) من دون كتابة الإعدادات أو التثبيت أو مزامنة Plugins أو إعادة التشغيل.
- `--json`: طباعة JSON قابل للقراءة آليًا من نوع `UpdateRunResult`، بما في ذلك
  `postUpdate.plugins.integrityDrifts` عند اكتشاف انحراف في سلامة
  مكونات npm الإضافية أثناء مزامنة Plugins بعد التحديث.
- `--timeout <seconds>`: مهلة لكل خطوة (الافتراضي 1200 ثانية).
- `--yes`: تخطي مطالبات التأكيد (مثل تأكيد الرجوع إلى إصدار أقدم)

ملاحظة: تتطلب عمليات الرجوع إلى إصدار أقدم تأكيدًا لأن الإصدارات الأقدم قد تكسر الإعدادات.

## `update status`

اعرض قناة التحديث النشطة + git tag/branch/SHA ‏(لنسخ المصدر checkout)، بالإضافة إلى توفر التحديث.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

الخيارات:

- `--json`: طباعة JSON لحالة قابلة للقراءة آليًا.
- `--timeout <seconds>`: مهلة للفحوصات (الافتراضي 3 ثوانٍ).

## `update wizard`

تدفق تفاعلي لاختيار قناة تحديث وتأكيد ما إذا كنت تريد إعادة تشغيل Gateway
بعد التحديث (الافتراضي هو إعادة التشغيل). إذا اخترت `dev` من دون نسخة git checkout،
فسيعرض إنشاء واحدة.

الخيارات:

- `--timeout <seconds>`: مهلة لكل خطوة تحديث (الافتراضي `1200`)

## ما الذي يفعله

عندما تبدّل القنوات صراحةً (`--channel ...`)، يحتفظ OpenClaw أيضًا
بتوافق طريقة التثبيت:

- `dev` → يضمن وجود git checkout ‏(الافتراضي: `~/openclaw`، ويمكن التجاوز عبر `OPENCLAW_GIT_DIR`)،
  ويحدّثها، ويثبت CLI العام من تلك النسخة.
- `stable` → يثبت من npm باستخدام `latest`.
- `beta` → يفضل npm dist-tag ‏`beta`، لكنه يرجع إلى `latest` عندما تكون beta
  مفقودة أو أقدم من إصدار stable الحالي.

يعيد المحدّث التلقائي لنواة Gateway ‏(عند تمكينه عبر الإعدادات) استخدام مسار التحديث نفسه.

بالنسبة إلى عمليات التثبيت عبر مدير الحزم، يحل `openclaw update` إصدار
الحزمة المستهدفة قبل استدعاء مدير الحزم. وإذا كانت النسخة المثبتة تطابق
الهدف تمامًا ولم يكن من الضروري حفظ تغيير في قناة التحديث، فإن
الأمر ينتهي بوصفه متخطًى قبل تثبيت الحزمة، أو مزامنة Plugins، أو تحديث الإكمال،
أو إعادة تشغيل gateway.

## تدفق git checkout

القنوات:

- `stable`: يبدّل إلى أحدث وسم non-beta، ثم يبني + يشغّل doctor.
- `beta`: يفضل أحدث وسم `-beta`، لكنه يرجع إلى أحدث وسم stable
  عندما تكون beta مفقودة أو أقدم.
- `dev`: يبدّل إلى `main`، ثم يجلب + يعيد الأساس.

على مستوى عالٍ:

1. يتطلب worktree نظيفة (من دون تغييرات غير ملتزم بها).
2. يبدّل إلى القناة المحددة (وسم أو فرع).
3. يجلب من upstream ‏(لـ dev فقط).
4. dev فقط: lint قبلية + build لـ TypeScript في worktree مؤقتة؛ وإذا فشل الطرف الأحدث، فإنه يتراجع حتى 10 التزامات للعثور على أحدث build نظيفة.
5. يعيد الأساس على الالتزام المحدد (لـ dev فقط).
6. يثبت التبعيات باستخدام مدير الحزم الخاص بالمستودع. وبالنسبة إلى نسخ pnpm checkout، يقوم المحدّث بتهيئة `pnpm` عند الطلب (عبر `corepack` أولًا، ثم الرجوع إلى `npm install pnpm@10` مؤقتًا) بدلًا من تشغيل `npm run build` داخل مساحة عمل pnpm.
7. يبني + يبني واجهة Control UI.
8. يشغّل `openclaw doctor` بوصفه الفحص النهائي لـ "التحديث الآمن".
9. يزامن Plugins مع القناة النشطة (يستخدم dev Plugins المضمّنة؛ بينما يستخدم stable/beta npm) ويحدّث Plugins المثبتة عبر npm.

إذا حُلّ تحديث npm Plugin مثبتة بإصدار محدد إلى مكوّن تختلف سلامته
عن سجل التثبيت المخزن، فإن `openclaw update` يوقف تحديث مكوّن Plugin
بدلًا من تثبيته. أعد تثبيت Plugin أو حدّثها صراحةً فقط بعد التحقق من أنك تثق في المكوّن الجديد.

إذا استمر فشل تهيئة pnpm، فإن المحدّث يتوقف الآن مبكرًا مع خطأ خاص بمدير الحزم بدلًا من محاولة `npm run build` داخل نسخة checkout.

## اختصار `--update`

يعيد `openclaw --update` الكتابة إلى `openclaw update` ‏(وهو مفيد للأغلفة النصية وسكربتات التشغيل).

## ذو صلة

- `openclaw doctor` ‏(يعرض تشغيل التحديث أولًا على نسخ git checkout)
- [قنوات التطوير](/ar/install/development-channels)
- [التحديث](/ar/install/updating)
- [مرجع CLI](/ar/cli)
