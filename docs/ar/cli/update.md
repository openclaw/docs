---
read_when:
    - تريد تحديث نسخة العمل المصدرية بأمان
    - أنت تستكشف أخطاء مخرجات `openclaw update` أو خياراته وإصلاحها
    - تحتاج إلى فهم سلوك الصيغة المختصرة `--update`
summary: مرجع CLI لـ `openclaw update` (تحديث المصدر الآمن إلى حد ما + إعادة تشغيل Gateway تلقائيًا)
title: تحديث
x-i18n:
    generated_at: "2026-05-06T07:46:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92eff9aeaecd4bf4eaa98fa511a3b9ebaedaf5872ff9407398665f2a8c2ab7d9
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

حدّث OpenClaw بأمان وبدّل بين قنوات stable/beta/dev.

إذا ثبّت عبر **npm/pnpm/bun** (تثبيت عام، من دون بيانات git وصفية)،
تتم التحديثات عبر مسار مدير الحزم في [التحديث](/ar/install/updating).

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

- `--no-restart`: تخطَّ إعادة تشغيل خدمة Gateway بعد نجاح التحديث. تحديثات مدير الحزم التي تعيد تشغيل Gateway تتحقق من أن الخدمة المعاد تشغيلها تبلغ عن الإصدار المحدّث المتوقع قبل نجاح الأمر.
- `--channel <stable|beta|dev>`: اضبط قناة التحديث (git + npm؛ تُحفَظ في الإعدادات).
- `--tag <dist-tag|version|spec>`: تجاوز هدف الحزمة لهذا التحديث فقط. بالنسبة إلى تثبيتات الحزم، يُطابق `main` القيمة `github:openclaw/openclaw#main`.
- `--dry-run`: عاين إجراءات التحديث المخطط لها (مسار القناة/الوسم/الهدف/إعادة التشغيل) من دون كتابة الإعدادات أو التثبيت أو مزامنة Plugins أو إعادة التشغيل.
- `--json`: اطبع JSON `UpdateRunResult` قابلًا للقراءة آليًا، بما في ذلك
  `postUpdate.plugins.warnings` عندما تحتاج Plugins المُدارة التالفة أو غير القابلة للتحميل
  إلى إصلاح بعد نجاح تحديث النواة، و`postUpdate.plugins.integrityDrifts`
  عند اكتشاف انحراف في أثر npm Plugin أثناء مزامنة Plugins بعد التحديث.
- `--timeout <seconds>`: مهلة لكل خطوة (الافتراضي 1800 ثانية).
- `--yes`: تخطَّ مطالبات التأكيد (مثل تأكيد الرجوع إلى إصدار أقدم).

لا يملك `openclaw update` علم `--verbose`. استخدم `--dry-run` لمعاينة
إجراءات القناة/الوسم/التثبيت/إعادة التشغيل المخطط لها، و`--json` للحصول على
نتائج قابلة للقراءة آليًا، و`openclaw update status --json` عندما تحتاج فقط إلى
تفاصيل القناة والتوفر. إذا كنت تنقّح سجلات Gateway حول تحديث،
فإن إسهاب وحدة التحكم ومستوى سجل الملف منفصلان: يؤثر `--verbose` الخاص بـ Gateway
في مخرجات الطرفية/WebSocket، بينما تتطلب سجلات الملفات `logging.level: "debug"` أو
`"trace"` في الإعدادات. راجع [تسجيل Gateway](/ar/gateway/logging).

<Warning>
يتطلب الرجوع إلى إصدارات أقدم تأكيدًا لأن الإصدارات الأقدم قد تكسر الإعدادات.
</Warning>

## `update status`

اعرض قناة التحديث النشطة + وسم/فرع/SHA الخاص بـ git (لتسجيلات checkout المصدرية)، إضافة إلى توفر التحديث.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

الخيارات:

- `--json`: اطبع JSON حالة قابلًا للقراءة آليًا.
- `--timeout <seconds>`: مهلة الفحوصات (الافتراضي 3 ثوانٍ).

## `update wizard`

مسار تفاعلي لاختيار قناة تحديث وتأكيد ما إذا كنت تريد إعادة تشغيل Gateway
بعد التحديث (الافتراضي هو إعادة التشغيل). إذا اخترت `dev` من دون checkout لـ git، فإنه
يعرض إنشاء واحد.

الخيارات:

- `--timeout <seconds>`: مهلة كل خطوة تحديث (الافتراضي `1800`)

## ما الذي يفعله

عندما تبدّل القنوات صراحةً (`--channel ...`)، يحافظ OpenClaw أيضًا على توافق
طريقة التثبيت:

- `dev` → يضمن وجود checkout لـ git (الافتراضي: `~/openclaw`، ويمكن تجاوزه باستخدام `OPENCLAW_GIT_DIR`)،
  ويحدّثه، ثم يثبّت CLI العام من ذلك الـ checkout.
- `stable` → يثبّت من npm باستخدام `latest`.
- `beta` → يفضّل dist-tag في npm بقيمة `beta`، لكنه يعود إلى `latest` عندما تكون beta
  مفقودة أو أقدم من إصدار stable الحالي.

محدّث Gateway الأساسي التلقائي (عند تفعيله عبر الإعدادات) يطلق مسار تحديث CLI
خارج معالج طلب Gateway المباشر. تحديثات مدير الحزم في مستوى التحكم `update.run`
تفرض إعادة تشغيل تحديث غير مؤجلة وبلا فترة تهدئة بعد تبديل الحزمة،
لأن عملية Gateway القديمة قد تظل لديها أجزاء في الذاكرة تشير إلى
ملفات أزالتها الحزمة الجديدة.

بالنسبة إلى تثبيتات مدير الحزم، يحل `openclaw update` إصدار الحزمة الهدف
قبل استدعاء مدير الحزم. تستخدم تثبيتات npm العامة تثبيتًا مرحليًا:
يثبّت OpenClaw الحزمة الجديدة في بادئة npm مؤقتة، ويتحقق من مخزون `dist`
المعبأ هناك، ثم يبدّل شجرة الحزمة النظيفة تلك إلى البادئة العامة
الحقيقية. إذا فشل التحقق، لا تعمل doctor بعد التحديث ولا مزامنة Plugin ولا
إعادة التشغيل من الشجرة المشكوك فيها. حتى عندما يطابق الإصدار المثبّت
الهدف بالفعل، يحدّث الأمر تثبيت الحزمة العام،
ثم يشغّل مزامنة Plugin، وتحديث إكمال أوامر النواة، وأعمال إعادة التشغيل. يحافظ هذا
على توافق الملحقات الجانبية المعبأة وسجلات Plugin المملوكة للقناة مع
بنية OpenClaw المثبّتة، مع ترك إعادة بناء إكمال أوامر Plugin الكاملة
لتشغيلات `openclaw completion --write-state` الصريحة.

عندما تكون خدمة Gateway محلية مُدارة مثبّتة وتكون إعادة التشغيل مفعّلة،
توقف تحديثات مدير الحزم الخدمة العاملة قبل استبدال شجرة الحزمة،
ثم تحدّث بيانات الخدمة الوصفية من التثبيت المحدّث، وتعيد تشغيل
الخدمة، وتتحقق من أن Gateway المعاد تشغيله يبلغ عن الإصدار المتوقع قبل
الإبلاغ عن النجاح. على macOS، يتحقق فحص ما بعد التحديث أيضًا من أن LaunchAgent
محمّل/قيد التشغيل للملف الشخصي النشط وأن منفذ loopback المضبوط
سليم. إذا كان ملف plist مثبّتًا لكن launchd لا يشرف عليه، فإن OpenClaw
يعيد bootstrap لـ LaunchAgent تلقائيًا، ثم يعيد تشغيل
فحوصات الجاهزية للصحة/الإصدار/القناة. يحمّل bootstrap جديد مهمة RunAtLoad
مباشرة، لذلك لا يستدعي استرداد التحديث `kickstart -k` فورًا على Gateway
الذي بدأ للتو. إذا ظل Gateway غير سليم، يخرج الأمر
بقيمة غير صفرية ويطبع مسار سجل إعادة التشغيل إضافة إلى تعليمات صريحة لإعادة التشغيل وإعادة التثبيت
والرجوع عن الحزمة. مع `--no-restart`،
يظل استبدال الحزمة يعمل لكن الخدمة المُدارة لا تتوقف أو
تُعاد تشغيلها، لذلك قد يستمر Gateway العامل في استخدام كود قديم إلى أن تعيد تشغيله
يدويًا.

## مسار checkout لـ git

### اختيار القناة

- `stable`: اعمل checkout لأحدث وسم غير beta، ثم ابنِ وشغّل doctor.
- `beta`: فضّل أحدث وسم `-beta`، لكن عُد إلى أحدث وسم stable عندما تكون beta مفقودة أو أقدم.
- `dev`: اعمل checkout لـ `main`، ثم اجلب وأعد تطبيق rebase.

### خطوات التحديث

<Steps>
  <Step title="Verify clean worktree">
    يتطلب عدم وجود تغييرات غير ملتزم بها.
  </Step>
  <Step title="Switch channel">
    يبدّل إلى القناة المحددة (وسم أو فرع).
  </Step>
  <Step title="Fetch upstream">
    خاص بـ Dev فقط.
  </Step>
  <Step title="Preflight build (dev only)">
    يشغّل بناء TypeScript في worktree مؤقت. إذا فشلت القمة، يرجع حتى 10 commits للعثور على أحدث commit قابل للبناء. اضبط `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` لتشغيل lint أيضًا أثناء هذا الفحص المسبق؛ يعمل lint في وضع تسلسلي مقيّد لأن مضيفات تحديث المستخدمين غالبًا ما تكون أصغر من مشغّلات CI.
  </Step>
  <Step title="Rebase">
    يعيد تطبيق rebase على الـ commit المحدد (خاص بـ dev فقط).
  </Step>
  <Step title="Install dependencies">
    يستخدم مدير حزم المستودع. بالنسبة إلى checkouts الخاصة بـ pnpm، يشغّل المحدّث bootstrap لـ `pnpm` عند الطلب (عبر `corepack` أولًا، ثم بديل مؤقت `npm install pnpm@10`) بدلًا من تشغيل `npm run build` داخل مساحة عمل pnpm.
  </Step>
  <Step title="Build Control UI">
    يبني gateway وواجهة Control UI.
  </Step>
  <Step title="Run doctor">
    يعمل `openclaw doctor` كفحص التحديث الآمن النهائي.
  </Step>
  <Step title="Sync plugins">
    يزامن Plugins مع القناة النشطة. يستخدم Dev الـ Plugins المضمنة؛ وتستخدم stable وbeta npm. يحدّث تثبيتات Plugin المتعقّبة.
  </Step>
</Steps>

على قناة تحديث beta، تحاول تثبيتات npm وClawHub Plugin المتعقّبة التي تتبع
خط default/latest إصدار Plugin `@beta` أولًا. إذا لم يكن لدى Plugin
إصدار beta، يعود OpenClaw إلى مواصفة default/latest المسجلة. بالنسبة إلى npm
Plugins، يعود OpenClaw أيضًا عندما تكون حزمة beta موجودة لكنها تفشل في
تحقق التثبيت. لا تُعاد كتابة الإصدارات الدقيقة والوسوم الصريحة.

<Warning>
إذا حُلّ تحديث npm Plugin مثبت بدقة إلى أثر تختلف سلامته عن سجل التثبيت المخزن، فإن `openclaw update` يوقف تحديث أثر ذلك الـ Plugin بدلًا من تثبيته. أعد تثبيت Plugin أو حدّثه صراحةً فقط بعد التحقق من أنك تثق بالأثر الجديد.
</Warning>

<Note>
تُبلّغ إخفاقات مزامنة Plugin بعد التحديث المحصورة في Plugin مُدار كتحذيرات بعد نجاح تحديث النواة. تُبقي نتيجة JSON حالة التحديث العليا `status: "ok"` وتبلغ عن `postUpdate.plugins.status: "warning"` مع إرشادات `openclaw doctor --fix` و`openclaw plugins inspect <id> --runtime --json`. تظل استثناءات المحدّث أو المزامنة غير المتوقعة تفشل نتيجة التحديث. أصلح تثبيت Plugin أو خطأ التحديث، ثم أعد تشغيل `openclaw doctor --fix` أو `openclaw update`.

عندما يبدأ Gateway المحدّث، يكون تحميل Plugin للتحقق فقط: لا يشغّل بدء التشغيل مديري الحزم ولا يغيّر أشجار التبعيات. تتجاوز عمليات إعادة تشغيل `update.run` الخاصة بمدير الحزم التأجيل الخامل العادي وفترة تهدئة إعادة التشغيل بعد تبديل شجرة الحزمة، لذلك لا يمكن للعملية القديمة الاستمرار في التحميل الكسول لأجزاء أُزيلت.

إذا ظل bootstrap الخاص بـ pnpm يفشل، يتوقف المحدّث مبكرًا مع خطأ خاص بمدير الحزم بدلًا من محاولة `npm run build` داخل الـ checkout.
</Note>

## اختصار `--update`

يعيد `openclaw --update` الكتابة إلى `openclaw update` (مفيد للصدفات وسكربتات المشغّل).

## ذو صلة

- `openclaw doctor` (يعرض تشغيل التحديث أولًا على checkouts الخاصة بـ git)
- [قنوات التطوير](/ar/install/development-channels)
- [التحديث](/ar/install/updating)
- [مرجع CLI](/ar/cli)
