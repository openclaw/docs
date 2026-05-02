---
read_when:
    - تريد تحديث نسخة عمل من المصدر بأمان
    - تحتاج إلى فهم سلوك اختصار `--update`
summary: مرجع CLI لـ `openclaw update` (تحديث مصدر آمن نسبيًا + إعادة تشغيل Gateway تلقائيًا)
title: تحديث
x-i18n:
    generated_at: "2026-05-02T20:43:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35df8c6d8b1adb9597377f6e2b4844352577992c12636a88b3f3c1854dc0666b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

تحديث OpenClaw بأمان والتبديل بين قنوات stable/beta/dev.

إذا ثبّت عبر **npm/pnpm/bun** (تثبيت عام، بلا بيانات git وصفية)،
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

- `--no-restart`: تخطي إعادة تشغيل خدمة Gateway بعد نجاح التحديث. تحديثات مدير الحزم التي تعيد تشغيل Gateway تتحقق من أن الخدمة المعاد تشغيلها تبلغ عن الإصدار المحدّث المتوقع قبل نجاح الأمر.
- `--channel <stable|beta|dev>`: تعيين قناة التحديث (git + npm؛ تُحفظ في الإعدادات).
- `--tag <dist-tag|version|spec>`: تجاوز هدف الحزمة لهذا التحديث فقط. في تثبيتات الحزم، يشير `main` إلى `github:openclaw/openclaw#main`.
- `--dry-run`: معاينة إجراءات التحديث المخططة (channel/tag/target/restart flow) من دون كتابة الإعدادات أو التثبيت أو مزامنة plugins أو إعادة التشغيل.
- `--json`: طباعة JSON قابل للقراءة آليًا من نوع `UpdateRunResult`، بما في ذلك
  `postUpdate.plugins.integrityDrifts` عند اكتشاف انحراف في أثر Plugin الخاص بـ npm
  أثناء مزامنة Plugin بعد التحديث.
- `--timeout <seconds>`: مهلة لكل خطوة (الافتراضي 1800s).
- `--yes`: تخطي مطالبات التأكيد (مثل تأكيد الرجوع إلى إصدار أقدم).

<Warning>
تتطلب الرجوعات إلى إصدارات أقدم تأكيدًا لأن الإصدارات الأقدم قد تكسر الإعدادات.
</Warning>

## `update status`

يعرض قناة التحديث النشطة + وسم/فرع/SHA الخاص بـ git (لنسخ المصدر)، بالإضافة إلى توفر التحديث.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

الخيارات:

- `--json`: طباعة JSON للحالة قابل للقراءة آليًا.
- `--timeout <seconds>`: مهلة الفحوصات (الافتراضي 3s).

## `update wizard`

مسار تفاعلي لاختيار قناة تحديث وتأكيد ما إذا كان يجب إعادة تشغيل Gateway
بعد التحديث (الافتراضي هو إعادة التشغيل). إذا اخترت `dev` من دون نسخة git، فإنه
يعرض إنشاء واحدة.

الخيارات:

- `--timeout <seconds>`: مهلة كل خطوة تحديث (الافتراضي `1800`)

## ما الذي يفعله

عند تبديل القنوات صراحةً (`--channel ...`)، يحافظ OpenClaw أيضًا على
توافق طريقة التثبيت:

- `dev` → يضمن وجود نسخة git (الافتراضي: `~/openclaw`، ويمكن التجاوز باستخدام `OPENCLAW_GIT_DIR`)،
  ويحدّثها، ويثبّت CLI العام من تلك النسخة.
- `stable` → يثبّت من npm باستخدام `latest`.
- `beta` → يفضّل وسم توزيع npm ‏`beta`، لكنه يعود إلى `latest` عندما تكون beta
  مفقودة أو أقدم من الإصدار stable الحالي.

يُطلق المحدّث التلقائي لنواة Gateway (عند تفعيله عبر الإعدادات) مسار تحديث CLI
خارج معالج طلب Gateway الحي. تحديثات مدير الحزم عبر مستوى التحكم `update.run`
تفرض إعادة تشغيل تحديث غير مؤجلة ومن دون فترة تهدئة بعد تبديل الحزمة،
لأن عملية Gateway القديمة قد لا تزال تحتوي في الذاكرة على أجزاء تشير إلى
ملفات أزالتها الحزمة الجديدة.

في تثبيتات مدير الحزم، يحل `openclaw update` إصدار الحزمة الهدف
قبل استدعاء مدير الحزم. تستخدم تثبيتات npm العامة تثبيتًا مرحليًا:
يثبّت OpenClaw الحزمة الجديدة في بادئة npm مؤقتة، ويتحقق من مخزون `dist`
المعبأ هناك، ثم يبدّل شجرة الحزمة النظيفة هذه إلى البادئة العامة الحقيقية.
إذا فشل التحقق، فلن يعمل doctor بعد التحديث، ولا مزامنة Plugin، ولا
إعادة التشغيل من الشجرة المشتبه بها. وحتى عندما يطابق الإصدار المثبت
الهدف بالفعل، يحدّث الأمر تثبيت الحزمة العامة، ثم يشغل مزامنة Plugin،
وتحديث إكمال أوامر النواة، وأعمال إعادة التشغيل. يحافظ ذلك على اتساق
الملحقات الجانبية المعبأة وسجلات Plugin المملوكة للقناة مع بناء OpenClaw
المثبّت، مع ترك إعادة بناء إكمال أوامر Plugin الكاملة للتشغيلات الصريحة
لـ `openclaw completion --write-state`.

عندما تكون خدمة Gateway محلية مُدارة مثبتة وتكون إعادة التشغيل مفعلة،
توقف تحديثات مدير الحزم الخدمة العاملة قبل استبدال شجرة الحزمة،
ثم تحدّث بيانات الخدمة الوصفية من التثبيت المحدّث، وتعيد تشغيل
الخدمة، وتتحقق من أن Gateway المعاد تشغيله يبلغ عن الإصدار المتوقع. مع
`--no-restart`، يستمر استبدال الحزمة لكن الخدمة المُدارة لا تُوقف ولا
تُعاد تشغيلها، لذلك قد يستمر Gateway العامل في استخدام الكود القديم حتى
تعيد تشغيله يدويًا.

## مسار نسخة git

### اختيار القناة

- `stable`: يسحب أحدث وسم غير beta، ثم يبني ويشغل doctor.
- `beta`: يفضّل أحدث وسم `-beta`، لكنه يعود إلى أحدث وسم stable عند غياب beta أو كونها أقدم.
- `dev`: يسحب `main`، ثم يجلب ويعيد تطبيق التغييرات.

### خطوات التحديث

<Steps>
  <Step title="Verify clean worktree">
    يتطلب عدم وجود تغييرات غير ملتزم بها.
  </Step>
  <Step title="Switch channel">
    يبدّل إلى القناة المحددة (وسم أو فرع).
  </Step>
  <Step title="Fetch upstream">
    لـ Dev فقط.
  </Step>
  <Step title="Preflight build (dev only)">
    يشغّل lint وبناء TypeScript في شجرة عمل مؤقتة. إذا فشل الطرف، يرجع حتى 10 التزامات للعثور على أحدث بناء نظيف.
  </Step>
  <Step title="Rebase">
    يعيد تطبيق التغييرات فوق الالتزام المحدد (لـ dev فقط).
  </Step>
  <Step title="Install dependencies">
    يستخدم مدير حزم المستودع. في نسخ pnpm، يمهّد المحدّث `pnpm` عند الطلب (عبر `corepack` أولًا، ثم بديل مؤقت `npm install pnpm@10`) بدلًا من تشغيل `npm run build` داخل مساحة عمل pnpm.
  </Step>
  <Step title="Build Control UI">
    يبني Gateway وواجهة التحكم.
  </Step>
  <Step title="Run doctor">
    يعمل `openclaw doctor` كفحص التحديث الآمن النهائي.
  </Step>
  <Step title="Sync plugins">
    يزامن plugins مع القناة النشطة. يستخدم Dev plugins المضمنة؛ وتستخدم stable و beta ‏npm. يحدّث تثبيتات Plugin المتتبعة.
  </Step>
</Steps>

على قناة تحديث beta، تحاول تثبيتات Plugin المتتبعة من npm وClawHub التي تتبع
خط default/latest إصدار Plugin ‏`@beta` أولًا. إذا لم يكن لدى Plugin إصدار
beta، يعود OpenClaw إلى مواصفة default/latest المسجلة. لا تُعاد كتابة
الإصدارات الدقيقة والوسوم الصريحة.

<Warning>
إذا حل تحديث Plugin مثبت بدقة من npm إلى أثر تختلف سلامته عن سجل التثبيت المخزن، فإن `openclaw update` يُجهض تحديث أثر Plugin ذلك بدلًا من تثبيته. أعد تثبيت Plugin أو حدّثه صراحةً فقط بعد التحقق من أنك تثق بالأثر الجديد.
</Warning>

<Note>
تفشل إخفاقات مزامنة Plugin بعد التحديث نتيجة التحديث وتوقف أعمال متابعة إعادة التشغيل. أصلح تثبيت Plugin أو خطأ التحديث، ثم أعد تشغيل `openclaw update`.

عند بدء Gateway المحدّث، يكون تحميل Plugin للتحقق فقط: لا يشغل بدء التشغيل مديري الحزم ولا يغيّر أشجار الاعتماديات. تتجاوز عمليات إعادة التشغيل عبر مدير الحزم `update.run` التأجيل العادي في الخمول وفترة تهدئة إعادة التشغيل بعد تبديل شجرة الحزمة، بحيث لا يمكن للعملية القديمة الاستمرار في التحميل الكسول لأجزاء مُزالة.

إذا استمر فشل تمهيد pnpm، يتوقف المحدّث مبكرًا مع خطأ خاص بمدير الحزم بدلًا من محاولة `npm run build` داخل نسخة المصدر.
</Note>

## اختصار `--update`

يعيد `openclaw --update` الكتابة إلى `openclaw update` (مفيد للصدفات وسكربتات التشغيل).

## ذو صلة

- `openclaw doctor` (يعرض تشغيل التحديث أولًا في نسخ git)
- [قنوات التطوير](/ar/install/development-channels)
- [التحديث](/ar/install/updating)
- [مرجع CLI](/ar/cli)
