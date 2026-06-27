---
read_when:
    - تريد تحديث نسخة مصدرية بأمان
    - أنت تقوم بتصحيح أخطاء مخرجات `openclaw update` أو خياراته
    - تحتاج إلى فهم سلوك الاختصار `--update`
summary: مرجع CLI لـ `openclaw update` (تحديث مصدر آمن نسبيًا + إعادة تشغيل تلقائية لـ Gateway)
title: تحديث
x-i18n:
    generated_at: "2026-06-27T17:26:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3503e1cd15baa4d4f6c26734b37556831c612f1da0da5ccfe7bcde35b9be64b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

حدّث OpenClaw بأمان وبدّل بين قنوات stable/beta/dev.

إذا ثبّت عبر **npm/pnpm/bun** (تثبيت عام، بلا بيانات git وصفية)،
تتم التحديثات عبر مسار مدير الحزم في [التحديث](/ar/install/updating).

## الاستخدام

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --acknowledge-clawhub-risk
openclaw update --json
openclaw --update
```

## الخيارات

- `--no-restart`: تخطَّ إعادة تشغيل خدمة Gateway بعد نجاح التحديث. تحديثات مدير الحزم التي تعيد تشغيل Gateway تتحقق من أن الخدمة المعاد تشغيلها تُبلغ عن الإصدار المحدّث المتوقع قبل نجاح الأمر.
- `--channel <stable|beta|dev>`: اضبط قناة التحديث (git + npm؛ تُحفظ في الإعدادات).
- `--tag <dist-tag|version|spec>`: تجاوز هدف الحزمة لهذا التحديث فقط. في تثبيتات الحزم، يُطابق `main` القيمة `github:openclaw/openclaw#main`؛ وتُحزم مواصفات مصدر GitHub/git في أرشيف tar مؤقت قبل تثبيت npm العام المرحلي.
- `--dry-run`: اعرض معاينة لإجراءات التحديث المخططة (تدفق القناة/الوسم/الهدف/إعادة التشغيل) من دون كتابة الإعدادات أو التثبيت أو مزامنة plugins أو إعادة التشغيل.
- `--json`: اطبع JSON قابلًا للقراءة آليًا من نوع `UpdateRunResult`، بما في ذلك
  `postUpdate.plugins.warnings` عندما تحتاج plugins المُدارة التالفة أو غير القابلة للتحميل
  إلى إصلاح بعد نجاح تحديث النواة، وتفاصيل احتياط plugin في قناة beta
  عندما لا يملك plugin إصدار beta، و`postUpdate.plugins.integrityDrifts`
  عند اكتشاف انحراف في أثر حزمة npm الخاصة بـ plugin أثناء مزامنة plugins بعد التحديث.
- `--timeout <seconds>`: مهلة لكل خطوة (الافتراضي 1800 ثانية).
- `--yes`: تخطَّ مطالبات التأكيد (مثل تأكيد الرجوع إلى إصدار أقدم).
- `--acknowledge-clawhub-risk`: بعد مراجعة تحذيرات ثقة مجتمع ClawHub،
  اسمح لمزامنة plugins بعد التحديث بالمتابعة من دون مطالبة تفاعلية.
  من دون هذا الخيار، تُتخطى إصدارات plugins الخطرة من مجتمع ClawHub وتُترك
  من دون تغيير عندما لا يستطيع OpenClaw طلب التأكيد. حزم ClawHub الرسمية
  ومصادر OpenClaw plugin المضمنة تتجاوز مطالبة ثقة الإصدار هذه.

لا يملك `openclaw update` علامة `--verbose`. استخدم `--dry-run` لمعاينة
إجراءات القناة/الوسم/التثبيت/إعادة التشغيل المخططة، و`--json` للحصول على نتائج
قابلة للقراءة آليًا، و`openclaw update status --json` عندما تحتاج فقط إلى تفاصيل
القناة والتوفر. إذا كنت تصحح سجلات Gateway حول تحديث،
فإن إسهاب وحدة التحكم ومستوى سجل الملف منفصلان: يؤثر `--verbose` الخاص بـ Gateway
في خرج الطرفية/WebSocket، بينما تتطلب سجلات الملفات `logging.level: "debug"` أو
`"trace"` في الإعدادات. راجع [تسجيل Gateway](/ar/gateway/logging).

<Note>
في وضع Nix (`OPENCLAW_NIX_MODE=1`)، تُعطّل عمليات `openclaw update` التي تُحدث تغييرات. حدّث مصدر Nix أو مُدخل flake لهذا التثبيت بدلًا من ذلك؛ بالنسبة إلى nix-openclaw، استخدم [البدء السريع](https://github.com/openclaw/nix-openclaw#quick-start) المعتمد على الوكيل أولًا. يظل `openclaw update status` و`openclaw update --dry-run` للقراءة فقط.
</Note>

<Warning>
تتطلب العودة إلى إصدارات أقدم تأكيدًا لأن الإصدارات الأقدم قد تكسر الإعدادات.
</Warning>

## `update status`

اعرض قناة التحديث النشطة + وسم/فرع/SHA في git (لعمليات checkout من المصدر)، إضافة إلى توفر التحديث.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

الخيارات:

- `--json`: اطبع JSON حالة قابلًا للقراءة آليًا.
- `--timeout <seconds>`: مهلة الفحوصات (الافتراضي 3 ثوانٍ).

## `update repair`

أعد تشغيل إنهاء التحديث بعد أن تكون حزمة النواة قد تغيّرت بالفعل لكن أعمال
الإصلاح اللاحقة لم تكتمل بنظافة. هذا هو مسار الاسترداد المدعوم عندما
يثبّت `openclaw update` حزمة النواة الجديدة لكن مزامنة plugins بعد النواة،
أو بيانات npm plugin الوصفية المُدارة، أو تحديث السجل، أو إصلاح doctor ما زالت تحتاج إلى
الاستقرار.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

الخيارات:

- `--channel <stable|beta|dev>`: احفظ قناة التحديث قبل الإصلاح وشغّل
  تقارب plugins مقابل تلك القناة.
- `--json`: اطبع JSON إنهاء قابلًا للقراءة آليًا.
- `--timeout <seconds>`: مهلة خطوات الإصلاح (الافتراضي `1800`).
- `--yes`: تخطَّ مطالبات التأكيد.
- `--acknowledge-clawhub-risk`: بعد مراجعة تحذيرات ثقة مجتمع ClawHub،
  اسمح لتقارب plugins وقت الإصلاح بالمتابعة من دون مطالبة
  تفاعلية. حزم ClawHub الرسمية ومصادر OpenClaw plugin
  المضمنة تتجاوز مطالبة ثقة الإصدار هذه.
- `--no-restart`: مقبول للتوافق مع أمر التحديث؛ لا يعيد repair تشغيل
  Gateway مطلقًا.

يشغّل `openclaw update repair` الأمر `openclaw doctor --fix`، ويعيد تحميل
الإعدادات وسجلات التثبيت المُصلحة، ويزامن plugins المتتبعة لقناة التحديث النشطة،
ويحدّث تثبيتات npm plugin المُدارة، ويصلح حمولات plugins المُعدّة المفقودة،
ويحدّث سجل plugins، ويكتب بيانات سجل التثبيت الوصفية بعد التقارب.
لا يثبّت حزمة نواة جديدة ولا يعيد تشغيل Gateway.

## `update wizard`

تدفق تفاعلي لاختيار قناة تحديث وتأكيد ما إذا كان يجب إعادة تشغيل Gateway
بعد التحديث (الافتراضي هو إعادة التشغيل). إذا اخترت `dev` من دون checkout من git، فإنه
يعرض إنشاء واحد.

الخيارات:

- `--timeout <seconds>`: مهلة لكل خطوة تحديث (الافتراضي `1800`)

## ما الذي يفعله

عندما تبدّل القنوات صراحةً (`--channel ...`)، يحافظ OpenClaw أيضًا على
توافق طريقة التثبيت:

- `dev` → يضمن وجود checkout من git (الافتراضي: `~/openclaw`، أو `$OPENCLAW_HOME/openclaw` عندما
  يكون `OPENCLAW_HOME` مضبوطًا؛ تجاوز ذلك باستخدام `OPENCLAW_GIT_DIR`)،
  ويحدّثه، ويثبّت CLI العام من ذلك checkout.
- `stable` → يثبّت من npm باستخدام `latest`.
- `beta` → يفضّل dist-tag في npm باسم `beta`، لكنه يعود إلى `latest` عندما يكون beta
  مفقودًا أو أقدم من الإصدار المستقر الحالي.

مشغّل التحديث التلقائي لنواة Gateway (عند تفعيله عبر الإعدادات) يطلق مسار تحديث CLI
خارج معالج طلبات Gateway الحي. كما تستخدم تحديثات مدير الحزم في مستوى التحكم
`update.run` وتحديثات checkout من git الخاضعة للإشراف
تسليمًا إلى خدمة مُدارة بدلًا من استبدال شجرة الحزمة أو إعادة بناء
`dist/` داخل عملية Gateway الحية. يبدأ Gateway مساعدًا منفصلًا،
ثم يخرج، ويشغّل المساعد مسار CLI العادي `openclaw update --yes --json`
من خارج شجرة عملية Gateway. إذا لم يكن ذلك التسليم متاحًا،
يعيد `update.run` استجابة منظّمة تتضمن أمر shell الآمن لتشغيله
يدويًا.

في تثبيتات مدير الحزم، يحل `openclaw update` إصدار الحزمة الهدف
قبل استدعاء مدير الحزم. تستخدم تثبيتات npm العامة تثبيتًا مرحليًا:
يثبّت OpenClaw الحزمة الجديدة في بادئة npm مؤقتة، ويتحقق من
جرد `dist` المعبّأ هناك، ثم يبدّل شجرة الحزمة النظيفة تلك إلى
البادئة العامة الحقيقية. إذا فشل التحقق، لا تعمل doctor بعد التحديث،
ولا مزامنة plugins، ولا أعمال إعادة التشغيل من الشجرة المشكوك فيها. حتى عندما يكون الإصدار المثبّت
مطابقًا للهدف بالفعل، يحدّث الأمر تثبيت الحزمة العامة،
ثم يشغّل مزامنة plugins، وتحديث إكمال أوامر النواة، وأعمال إعادة التشغيل. يحافظ هذا
على اتساق الملحقات الجانبية المعبّأة وسجلات plugins المملوكة للقناة مع
بناء OpenClaw المثبّت، مع ترك إعادة بناء إكمال أوامر plugins الكاملة
لتشغيلات `openclaw completion --write-state` الصريحة.

عند تثبيت خدمة Gateway مُدارة محلية وتفعيل إعادة التشغيل،
توقف تحديثات مدير الحزم وcheckout من git الخدمة العاملة قبل
استبدال شجرة الحزمة أو تعديل مخرجات checkout/البناء. ثم
يحدّث المشغّل بيانات الخدمة الوصفية من التثبيت المحدّث، ويعيد تشغيل
الخدمة، ويتحقق من Gateway المعاد تشغيله قبل الإبلاغ عن
`Gateway: restarted and verified.`. تتحقق تحديثات مدير الحزم أيضًا من أن
Gateway المعاد تشغيله يبلّغ عن إصدار الحزمة المتوقع؛ وتتحقق تحديثات checkout من git
من صحة gateway وجاهزية الخدمة بعد إعادة البناء. على macOS، يتحقق
فحص ما بعد التحديث أيضًا من أن LaunchAgent محمّل/قيد التشغيل للملف الشخصي النشط
وأن منفذ الاسترجاع المحلي المضبوط سليم. إذا كان ملف plist مثبّتًا
لكن launchd لا يشرف عليه، يعيد OpenClaw تمهيد LaunchAgent
تلقائيًا، ثم يعيد تشغيل فحوصات صحة/إصدار/جاهزية القناة. يحمّل التمهيد الجديد
مهمة RunAtLoad مباشرة، لذلك لا ينفذ استرداد التحديث
`kickstart -k` فورًا على Gateway الذي أُنشئ حديثًا. إذا ظل Gateway
غير سليم، يخرج الأمر بقيمة غير صفرية ويطبع مسار سجل إعادة التشغيل
إضافة إلى تعليمات صريحة لإعادة التشغيل، وإعادة التثبيت، والتراجع عن الحزمة. إذا تعذّر تشغيل
إعادة التشغيل، يطبع الأمر `Gateway: restart skipped (...)` أو
`Gateway: restart failed: ...` مع تلميح يدوي `openclaw gateway restart`.
مع `--no-restart`، يستمر استبدال الحزمة أو إعادة بناء git لكن
الخدمة المُدارة لا تُوقف أو تُعاد تشغيلها، لذلك قد يظل Gateway العامل يستخدم
كودًا قديمًا حتى تعيد تشغيله يدويًا.

### شكل استجابة مستوى التحكم

عندما يُستدعى `update.run` عبر مستوى التحكم في Gateway على
تثبيت مدير حزم أو checkout من git خاضع للإشراف، يبلّغ المعالج عن
بدء التسليم بشكل منفصل عن تحديث CLI الذي يستمر بعد خروج
Gateway:

- تعني `ok: true`، و`result.status: "skipped"`،
  و`result.reason: "managed-service-handoff-started"`، و
  `handoff.status: "started"` أن Gateway أنشأ تسليم الخدمة المُدارة
  وجدول إعادة تشغيله الذاتي حتى يستطيع المساعد المنفصل تشغيل
  `openclaw update --yes --json` خارج عملية الخدمة الحية.
- تعني `ok: false`، و`result.reason: "managed-service-handoff-unavailable"`، و
  `handoff.status: "unavailable"` أن OpenClaw لم يتمكن من العثور على حد خدمة
  مُشرفة وهوية خدمة دائمة لتسليم آمن. على سبيل المثال،
  يتطلب تسليم systemd هوية وحدة OpenClaw
  (`OPENCLAW_SYSTEMD_UNIT`)، لا مجرد علامات عملية systemd المحيطة. تتضمن
  الاستجابة `handoff.command`، وهو أمر shell المطلوب تشغيله من خارج
  Gateway.
- تعني `ok: false`، و`result.reason: "managed-service-handoff-failed"` أن
  Gateway حاول إنشاء التسليم لكنه لم يتمكن من تشغيل المساعد المنفصل.

ما زالت حمولة `sentinel` تُكتب قبل خروج Gateway، ويحدّث تسليم CLI
نفس sentinel إعادة التشغيل بعد اكتمال فحوصات صحة إعادة تشغيل الخدمة
المُدارة. أثناء التسليم، يمكن أن يحمل sentinel
`stats.reason: "restart-health-pending"` من دون استمرار نجاح؛ يواصل
Gateway المعاد تشغيله استطلاعه ولا يطلق الاستمرار إلا بعد أن يتحقق CLI
من صحة الخدمة ويعيد كتابة sentinel بنتيجة `ok` النهائية.
يعرض `openclaw status` و`openclaw status --all` صف `Update restart`
بينما يكون ذلك sentinel معلقًا أو فاشلًا، ويحدّث `update.status`
آخر sentinel ويعيده.

## تدفق checkout من Git

### اختيار القناة

- `stable`: نفّذ checkout لأحدث وسم غير beta، ثم ابنِ وشغّل doctor.
- `beta`: فضّل أحدث وسم `-beta`، لكن عُد إلى أحدث وسم مستقر عندما يكون beta مفقودًا أو أقدم.
- `dev`: نفّذ checkout لـ `main`، ثم اجلب وأعد الأساس.

### خطوات التحديث

<Steps>
  <Step title="Verify clean worktree">
    يتطلب عدم وجود تغييرات غير ملتزم بها.
  </Step>
  <Step title="Switch channel">
    يبدّل إلى القناة المحددة (وسم أو فرع).
  </Step>
  <Step title="Fetch upstream">
    للتطوير فقط.
  </Step>
  <Step title="Preflight build (dev only)">
    يشغّل بناء TypeScript في شجرة عمل مؤقتة. إذا فشل الطرف، يتراجع حتى 10 التزامات للعثور على أحدث التزام قابل للبناء. عيّن `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` لتشغيل الفحص أيضًا أثناء هذا الفحص التمهيدي؛ يعمل الفحص في وضع تسلسلي مقيّد لأن مضيفات تحديث المستخدم غالبًا ما تكون أصغر من مشغّلات CI.
  </Step>
  <Step title="Rebase">
    يعيد التأسيس على الالتزام المحدد (للتطوير فقط).
  </Step>
  <Step title="Install dependencies">
    يستخدم مدير حزم المستودع. بالنسبة إلى عمليات سحب pnpm، يهيّئ المحدّث `pnpm` عند الطلب (عبر `corepack` أولًا، ثم رجوع مؤقت إلى `npm install pnpm@11`) بدلًا من تشغيل `npm run build` داخل مساحة عمل pnpm.
  </Step>
  <Step title="Build Control UI">
    يبني Gateway وواجهة Control UI.
  </Step>
  <Step title="Run doctor">
    يعمل `openclaw doctor` كفحص التحديث الآمن النهائي.
  </Step>
  <Step title="Sync plugins">
    يزامن Plugins إلى القناة النشطة. يستخدم التطوير Plugins المضمّنة؛ ويستخدم المستقر والبيتا npm. يحدّث تثبيتات Plugin المتتبعة.
  </Step>
</Steps>

على قناة تحديث البيتا، تحاول تثبيتات npm وClawHub Plugin المتتبعة التي تتبع
مسار الافتراضي/الأحدث إصدار Plugin `@beta` أولًا. إذا لم يكن لدى Plugin
إصدار بيتا، يعود OpenClaw إلى مواصفة الافتراضي/الأحدث المسجلة ويبلغ
عن ذلك كتحذير. بالنسبة إلى Plugins من npm، يعود OpenClaw أيضًا عندما تكون
حزمة البيتا موجودة لكنها تفشل في تحقق التثبيت. لا تجعل تحذيرات رجوع Plugin هذه
تحديث النواة يفشل. لا تُعاد كتابة الإصدارات الدقيقة والوسوم الصريحة.

<Warning>
إذا حُلّ تحديث npm Plugin مثبت بدقة إلى عنصر تختلف سلامته عن سجل التثبيت المخزن، يوقف `openclaw update` تحديث عنصر Plugin هذا بدلًا من تثبيته. أعد تثبيت Plugin أو حدّثه صراحةً فقط بعد التحقق من أنك تثق بالعنصر الجديد.
</Warning>

<Note>
تُبلّغ حالات فشل مزامنة Plugin بعد التحديث والمحصورة في Plugin مُدار، والتي يمكن لمسار المزامنة الالتفاف حولها (مثل سجل npm غير قابل للوصول لـ Plugin غير أساسي)، كتحذيرات بعد نجاح تحديث النواة. تحافظ نتيجة JSON على `status: "ok"` في التحديث على المستوى الأعلى وتبلغ عن `postUpdate.plugins.status: "warning"` مع إرشادات `openclaw update repair` و`openclaw plugins inspect <id> --runtime --json`. لا تزال استثناءات المحدّث أو المزامنة غير المتوقعة تفشل نتيجة التحديث. أصلح خطأ تثبيت Plugin أو تحديثه، ثم أعد تشغيل `openclaw update repair`.

بعد خطوة المزامنة لكل Plugin، يشغّل `openclaw update` تمريرة **تقارب ما بعد النواة** إلزامية قبل إعادة تشغيل Gateway: يصلح حمولات Plugin المهيأة المفقودة، ويتحقق من كل سجل تثبيت متتبع _نشط_ على القرص، ويتحقق ثابتًا من أن `package.json` الخاص به قابل للتحليل (وأن أي `main` معلن صراحةً موجود). تعيد حالات الفشل من هذه التمريرة — ولقطة إعداد OpenClaw غير الصالحة — `postUpdate.plugins.status: "error"` وتقلب `status` للتحديث على المستوى الأعلى إلى `"error"`، لذلك يخرج `openclaw update` بقيمة غير صفرية ولا يُعاد تشغيل Gateway مع مجموعة Plugin غير متحقق منها. يتضمن الخطأ أسطر `postUpdate.plugins.warnings[].guidance` منظمة تشير إلى `openclaw update repair` و`openclaw plugins inspect <id> --runtime --json` للمتابعة. تُتخطى هنا إدخالات Plugin المعطلة والسجلات غير المرتبطة بهدف مزامنة رسمي موثوق المصدر، بما يعكس سياسة `skipDisabledPlugins` المستخدمة بواسطة فحص الحمولة المفقودة، لذلك لا يمكن لسجل Plugin معطل قديم أن يمنع تحديثًا صالحًا بخلاف ذلك.

عندما يبدأ Gateway المحدّث، يكون تحميل Plugin للتحقق فقط: لا يشغّل بدء التشغيل
مديري الحزم ولا يغيّر أشجار الاعتماديات. تُسلّم عمليات إعادة التشغيل الخاصة بمدير الحزم `update.run`
إلى مسار الخدمة المُدارة في CLI، لذلك يحدث تبديل الحزمة
خارج عملية Gateway القديمة وتقرر فحوصات صحة الخدمة ما إذا كان
يمكن الإبلاغ عن اكتمال التحديث.

إذا ظل تمهيد pnpm يفشل، يتوقف المحدّث مبكرًا بخطأ خاص بمدير الحزم بدلًا من محاولة `npm run build` داخل عملية السحب.
</Note>

## اختصار `--update`

يعيد `openclaw --update` الكتابة إلى `openclaw update` (مفيد للأصداف وسكربتات التشغيل).

## ذات صلة

- `openclaw doctor` (يعرض تشغيل التحديث أولًا في عمليات سحب git)
- [قنوات التطوير](/ar/install/development-channels)
- [التحديث](/ar/install/updating)
- [مرجع CLI](/ar/cli)
