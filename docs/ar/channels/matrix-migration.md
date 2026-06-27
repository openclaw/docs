---
read_when:
    - ترقية تثبيت Matrix قائم
    - ترحيل سجل Matrix المشفّر وحالة الجهاز
summary: كيف يقوم OpenClaw بترقية Plugin Matrix السابق في مكانه، بما في ذلك حدود استرداد الحالة المشفّرة وخطوات الاسترداد اليدوي.
title: ترحيل Matrix
x-i18n:
    generated_at: "2026-06-27T17:11:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 796d27aa3f08388b78e005d5e93ee4a04bc9ae9bb1f214b83c3ba19165042755
    source_path: channels/matrix-migration.md
    workflow: 16
---

رقّ من Plugin `matrix` العام السابق إلى التنفيذ الحالي.

بالنسبة إلى معظم المستخدمين، تتم الترقية في مكانها:

- يبقى Plugin باسم `@openclaw/matrix`
- تبقى القناة `matrix`
- يبقى إعدادك ضمن `channels.matrix`
- تبقى بيانات الاعتماد المخزنة مؤقتًا ضمن `~/.openclaw/credentials/matrix/`
- تبقى حالة وقت التشغيل ضمن `~/.openclaw/matrix/`

لا تحتاج إلى إعادة تسمية مفاتيح الإعداد أو إعادة تثبيت Plugin باسم جديد.
لم تعد حزمة `openclaw` الجذرية تضمّن شيفرة وقت تشغيل Matrix أو اعتماديات Matrix SDK. إذا أظهر `openclaw channels status` أن Matrix مهيأ ولكن Plugin مفقود بعد تحديث، فشغّل `openclaw doctor --fix` أو `openclaw plugins install @openclaw/matrix`؛ ولا تثبّت حزم Matrix SDK داخل حزمة OpenClaw الجذرية.

## ما الذي تنفذه الهجرة تلقائيًا

عند بدء Gateway، وعند تشغيل [`openclaw doctor --fix`](/ar/gateway/doctor)، يحاول OpenClaw إصلاح حالة Matrix القديمة تلقائيًا.
قبل أن تعدّل أي خطوة هجرة Matrix قابلة للتنفيذ الحالة على القرص، ينشئ OpenClaw لقطة استرداد مركزة أو يعيد استخدامها.

عند استخدام `openclaw update`، يعتمد المشغّل الدقيق على طريقة تثبيت OpenClaw:

- تثبيتات المصدر تشغّل `openclaw doctor --fix` أثناء مسار التحديث، ثم تعيد تشغيل Gateway افتراضيًا
- تثبيتات مدير الحزم تحدّث الحزمة، وتشغّل تمريرة doctor غير تفاعلية، ثم تعتمد على إعادة تشغيل Gateway الافتراضية حتى يتمكن بدء التشغيل من إكمال هجرة Matrix
- إذا استخدمت `openclaw update --no-restart`، فستؤجل هجرة Matrix المدعومة ببدء التشغيل حتى تشغّل لاحقًا `openclaw doctor --fix` وتعيد تشغيل Gateway

تشمل الهجرة التلقائية:

- إنشاء لقطة ما قبل الهجرة أو إعادة استخدامها ضمن `~/Backups/openclaw-migrations/`
- إعادة استخدام بيانات اعتماد Matrix المخزنة مؤقتًا
- الإبقاء على اختيار الحساب نفسه وإعداد `channels.matrix`
- نقل أقدم مخزن مزامنة Matrix مسطح إلى الموقع الحالي المحدد بنطاق الحساب
- نقل أقدم مخزن تشفير Matrix مسطح إلى الموقع الحالي المحدد بنطاق الحساب عندما يمكن حل الحساب الهدف بأمان
- استخراج مفتاح فك تشفير نسخة احتياطية لمفاتيح غرف Matrix محفوظ سابقًا من مخزن تشفير rust القديم، عندما يكون ذلك المفتاح موجودًا محليًا
- إعادة استخدام جذر تخزين تجزئة الرمز الأكثر اكتمالًا للحساب وخادم المنزل والمستخدم نفسه في Matrix عندما يتغير رمز الوصول لاحقًا
- فحص جذور تخزين تجزئة الرمز الشقيقة بحثًا عن بيانات تعريف استعادة حالة مشفرة معلقة عندما يتغير رمز وصول Matrix لكن تبقى هوية الحساب/الجهاز كما هي
- استعادة مفاتيح الغرف المنسوخة احتياطيًا إلى مخزن التشفير الجديد عند بدء Matrix التالي

تفاصيل اللقطة:

- يكتب OpenClaw ملف علامة في `~/.openclaw/matrix/migration-snapshot.json` بعد لقطة ناجحة حتى تتمكن تمريرات بدء التشغيل والإصلاح اللاحقة من إعادة استخدام الأرشيف نفسه.
- تنسخ لقطات هجرة Matrix التلقائية هذه الإعداد + الحالة فقط (`includeWorkspace: false`).
- إذا كانت لدى Matrix حالة هجرة تحذيرية فقط، مثلًا لأن `userId` أو `accessToken` ما زال مفقودًا، فلن ينشئ OpenClaw اللقطة بعد، لأنه لا يوجد تعديل Matrix قابل للتنفيذ.
- إذا فشلت خطوة اللقطة، يتخطى OpenClaw هجرة Matrix لذلك التشغيل بدلًا من تعديل الحالة من دون نقطة استرداد.

حول ترقيات الحسابات المتعددة:

- جاء أقدم مخزن Matrix مسطح (`~/.openclaw/matrix/bot-storage.json` و`~/.openclaw/matrix/crypto/`) من تخطيط مخزن واحد، لذلك لا يستطيع OpenClaw ترحيله إلا إلى هدف حساب Matrix واحد محلول
- تُكتشف مخازن Matrix القديمة المحددة بنطاق الحساب سابقًا وتُحضّر لكل حساب Matrix مهيأ

## ما الذي لا تستطيع الهجرة تنفيذه تلقائيًا

لم يكن Plugin Matrix العام السابق ينشئ نسخًا احتياطية لمفاتيح غرف Matrix تلقائيًا. كان يحتفظ بحالة التشفير المحلية ويطلب التحقق من الجهاز، لكنه لم يكن يضمن نسخ مفاتيح غرفك احتياطيًا إلى خادم المنزل.

يعني ذلك أن بعض التثبيتات المشفرة لا يمكن ترحيلها إلا جزئيًا.

لا يستطيع OpenClaw الاسترداد تلقائيًا:

- مفاتيح الغرف المحلية فقط التي لم تُنسخ احتياطيًا قط
- الحالة المشفرة عندما يتعذر حل حساب Matrix الهدف بعد لأن `homeserver` أو `userId` أو `accessToken` ما زالت غير متاحة
- الهجرة التلقائية لمخزن Matrix مسطح مشترك واحد عندما تكون حسابات Matrix متعددة مهيأة لكن `channels.matrix.defaultAccount` غير معيّن
- تثبيتات مسار Plugin المخصصة المثبتة على مسار مستودع بدلًا من حزمة Matrix القياسية
- مفتاح استرداد مفقود عندما كان المخزن القديم يحتوي على مفاتيح منسوخة احتياطيًا لكنه لم يحتفظ بمفتاح فك التشفير محليًا

نطاق التحذير الحالي:

- تظهر تثبيتات مسار Plugin المخصص لـ Matrix في كل من بدء Gateway و`openclaw doctor`

إذا كان تثبيتك القديم يحتوي على سجل مشفر محلي فقط لم يُنسخ احتياطيًا قط، فقد تبقى بعض الرسائل المشفرة الأقدم غير قابلة للقراءة بعد الترقية.

## مسار الترقية الموصى به

1. حدّث OpenClaw وPlugin Matrix كالمعتاد.
   فضّل `openclaw update` العادي من دون `--no-restart` حتى يتمكن بدء التشغيل من إكمال هجرة Matrix فورًا.
2. شغّل:

   ```bash
   openclaw doctor --fix
   ```

   إذا كان لدى Matrix عمل هجرة قابل للتنفيذ، فسيمتلك doctor لقطة ما قبل الهجرة أو يعيد استخدامها أولًا ويطبع مسار الأرشيف.

3. ابدأ Gateway أو أعد تشغيله.
4. تحقق من حالة التحقق والنسخ الاحتياطي الحالية:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. ضع مفتاح الاسترداد لحساب Matrix الذي تصلحه في متغير بيئة خاص بالحساب. بالنسبة إلى حساب افتراضي واحد، `MATRIX_RECOVERY_KEY` مناسب. للحسابات المتعددة، استخدم متغيرًا واحدًا لكل حساب، مثل `MATRIX_RECOVERY_KEY_ASSISTANT`، وأضف `--account assistant` إلى الأمر.

6. إذا أخبرك OpenClaw بأن مفتاح استرداد مطلوب، فشغّل الأمر للحساب المطابق:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. إذا كان هذا الجهاز لا يزال غير متحقق منه، فشغّل الأمر للحساب المطابق:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   إذا قُبل مفتاح الاسترداد وكان النسخ الاحتياطي قابلًا للاستخدام، لكن `Cross-signing verified`
   لا يزال `no`، فأكمل التحقق الذاتي من عميل Matrix آخر:

   ```bash
   openclaw matrix verify self
   ```

   اقبل الطلب في عميل Matrix آخر، وقارن الرموز التعبيرية أو الكسور العشرية،
   واكتب `yes` فقط عندما تتطابق. يخرج الأمر بنجاح فقط
   بعد أن تصبح `Cross-signing verified` هي `yes`.

8. إذا كنت تتخلى عمدًا عن السجل القديم غير القابل للاسترداد وتريد خط أساس نسخ احتياطي جديدًا للرسائل المستقبلية، فشغّل:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. إذا لم توجد نسخة احتياطية لمفاتيح من جانب الخادم بعد، فأنشئ واحدة للاستردادات المستقبلية:

   ```bash
   openclaw matrix verify bootstrap
   ```

## كيف تعمل الهجرة المشفرة

الهجرة المشفرة عملية من مرحلتين:

1. ينشئ بدء التشغيل أو `openclaw doctor --fix` لقطة ما قبل الهجرة أو يعيد استخدامها إذا كانت الهجرة المشفرة قابلة للتنفيذ.
2. يفحص بدء التشغيل أو `openclaw doctor --fix` مخزن تشفير Matrix القديم عبر تثبيت Plugin Matrix النشط.
3. إذا عُثر على مفتاح فك تشفير النسخة الاحتياطية، يكتبه OpenClaw في مسار مفتاح الاسترداد الجديد ويعلّم استعادة مفاتيح الغرف على أنها معلقة.
4. عند بدء Matrix التالي، يستعيد OpenClaw مفاتيح الغرف المنسوخة احتياطيًا إلى مخزن التشفير الجديد تلقائيًا.

إذا أبلغ المخزن القديم عن مفاتيح غرف لم تُنسخ احتياطيًا قط، يحذّر OpenClaw بدلًا من الادعاء بأن الاسترداد نجح.

## الرسائل الشائعة ومعانيها

### رسائل الترقية والاكتشاف

`Matrix plugin upgraded in place.`

- المعنى: اكتُشفت حالة Matrix القديمة على القرص ورُحّلت إلى التخطيط الحالي.
- ما يجب فعله: لا شيء إلا إذا كان الناتج نفسه يتضمن تحذيرات أيضًا.

`Matrix migration snapshot created before applying Matrix upgrades.`

- المعنى: أنشأ OpenClaw أرشيف استرداد قبل تعديل حالة Matrix.
- ما يجب فعله: احتفظ بمسار الأرشيف المطبوع حتى تؤكد نجاح الهجرة.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- المعنى: وجد OpenClaw علامة لقطة هجرة Matrix موجودة وأعاد استخدام ذلك الأرشيف بدلًا من إنشاء نسخة احتياطية مكررة.
- ما يجب فعله: احتفظ بمسار الأرشيف المطبوع حتى تؤكد نجاح الهجرة.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- المعنى: توجد حالة Matrix قديمة، لكن OpenClaw لا يستطيع ربطها بحساب Matrix حالي لأن Matrix غير مهيأ.
- ما يجب فعله: هيّئ `channels.matrix`، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل Gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- المعنى: وجد OpenClaw حالة قديمة، لكنه لا يزال عاجزًا عن تحديد جذر الحساب/الجهاز الحالي بدقة.
- ما يجب فعله: ابدأ Gateway مرة واحدة مع تسجيل دخول Matrix عامل، أو أعد تشغيل `openclaw doctor --fix` بعد وجود بيانات الاعتماد المخزنة مؤقتًا.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- المعنى: وجد OpenClaw مخزن Matrix مسطحًا مشتركًا واحدًا، لكنه يرفض تخمين أي حساب Matrix مسمى يجب أن يستلمه.
- ما يجب فعله: عيّن `channels.matrix.defaultAccount` إلى الحساب المقصود، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل Gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- المعنى: الموقع الجديد المحدد بنطاق الحساب يحتوي مسبقًا على مخزن مزامنة أو تشفير، لذلك لم يكتب OpenClaw فوقه تلقائيًا.
- ما يجب فعله: تحقق من أن الحساب الحالي هو الصحيح قبل إزالة الهدف المتعارض أو نقله يدويًا.

`Failed migrating Matrix legacy sync store (...)` أو `Failed migrating Matrix legacy crypto store (...)`

- المعنى: حاول OpenClaw نقل حالة Matrix القديمة لكن عملية نظام الملفات فشلت.
- ما يجب فعله: افحص أذونات نظام الملفات وحالة القرص، ثم أعد تشغيل `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- المعنى: وجد OpenClaw مخزن Matrix مشفرًا قديمًا، لكن لا يوجد إعداد Matrix حالي لإلحاقه به.
- ما يجب فعله: هيّئ `channels.matrix`، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل Gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- المعنى: المخزن المشفر موجود، لكن OpenClaw لا يستطيع أن يقرر بأمان أي حساب/جهاز حالي ينتمي إليه.
- ما يجب فعله: ابدأ Gateway مرة واحدة مع تسجيل دخول Matrix عامل، أو أعد تشغيل `openclaw doctor --fix` بعد توفر بيانات الاعتماد المخزنة مؤقتًا.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- المعنى: وجد OpenClaw مخزن تشفير قديمًا مسطحًا مشتركًا واحدًا، لكنه يرفض تخمين أي حساب Matrix مسمى يجب أن يستلمه.
- ما يجب فعله: عيّن `channels.matrix.defaultAccount` إلى الحساب المقصود، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل Gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- المعنى: اكتشف OpenClaw حالة Matrix قديمة، لكن الهجرة لا تزال محظورة بسبب بيانات هوية أو اعتماد مفقودة.
- ما يجب فعله: أكمل تسجيل دخول Matrix أو إعداد التهيئة، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل Gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- المعنى: عثر OpenClaw على حالة Matrix مشفرة قديمة، لكنه لم يتمكن من تحميل نقطة دخول المساعد من Matrix Plugin التي تفحص ذلك المخزن عادة.
- ما يجب فعله: أعد تثبيت Matrix Plugin أو أصلحها (`openclaw plugins install @openclaw/matrix`، أو `openclaw plugins install ./path/to/local/matrix-plugin` عند استخدام نسخة repo checkout)، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل Gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- المعنى: عثر OpenClaw على مسار ملف مساعد يخرج من جذر Plugin أو يفشل في فحوص حدود Plugin، لذلك رفض استيراده.
- ما يجب فعله: أعد تثبيت Matrix Plugin من مسار موثوق، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل Gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- المعنى: رفض OpenClaw تعديل حالة Matrix لأنه لم يتمكن من إنشاء لقطة الاسترداد أولا.
- ما يجب فعله: عالج خطأ النسخ الاحتياطي، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل Gateway.

`Failed migrating legacy Matrix client storage: ...`

- المعنى: عثر مسار الرجوع في عميل Matrix على تخزين مسطح قديم، لكن النقل فشل. يوقف OpenClaw الآن مسار الرجوع هذا بدلا من البدء بصمت بمخزن جديد.
- ما يجب فعله: افحص أذونات نظام الملفات أو التعارضات، وأبق الحالة القديمة سليمة، ثم أعد المحاولة بعد إصلاح الخطأ.

`Matrix is installed from a custom path: ...`

- المعنى: تم تثبيت Matrix على مسار محدد، لذلك لا تستبدله تحديثات الخط الرئيسي تلقائيا بحزمة Matrix القياسية في repo.
- ما يجب فعله: أعد التثبيت باستخدام `openclaw plugins install @openclaw/matrix` عندما تريد الرجوع إلى Matrix Plugin الافتراضية.

### رسائل استرداد الحالة المشفرة

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- المعنى: تمت استعادة مفاتيح الغرف المنسوخة احتياطيا بنجاح إلى مخزن التشفير الجديد.
- ما يجب فعله: لا شيء عادة.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- المعنى: كانت بعض مفاتيح الغرف القديمة موجودة فقط في المخزن المحلي القديم ولم يتم رفعها قط إلى نسخة Matrix الاحتياطية.
- ما يجب فعله: توقع أن يظل بعض السجل القديم المشفر غير متاح ما لم تتمكن من استرداد تلك المفاتيح يدويا من عميل آخر موثق.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- المعنى: النسخة الاحتياطية موجودة، لكن OpenClaw لم يتمكن من استرداد مفتاح الاسترداد تلقائيا.
- ما يجب فعله: شغل `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- المعنى: عثر OpenClaw على المخزن المشفر القديم، لكنه لم يتمكن من فحصه بأمان كاف لإعداد الاسترداد.
- ما يجب فعله: أعد تشغيل `openclaw doctor --fix`. إذا تكرر ذلك، فأبق دليل الحالة القديم سليما واسترد باستخدام عميل Matrix موثق آخر مع `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- المعنى: اكتشف OpenClaw تعارضا في مفتاح النسخ الاحتياطي ورفض استبدال ملف recovery-key الحالي تلقائيا.
- ما يجب فعله: تحقق من مفتاح الاسترداد الصحيح قبل إعادة محاولة أي أمر استعادة.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- المعنى: هذا هو الحد الصارم لتنسيق التخزين القديم.
- ما يجب فعله: يمكن مع ذلك استعادة المفاتيح المنسوخة احتياطيا، لكن قد يظل السجل المشفر المحلي فقط غير متاح.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- المعنى: حاولت Plugin الجديدة الاستعادة، لكن Matrix أعاد خطأ.
- ما يجب فعله: شغل `openclaw matrix verify backup status`، ثم أعد المحاولة باستخدام `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` إذا لزم الأمر.

### رسائل الاسترداد اليدوي

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- المعنى: يعرف OpenClaw أنه يفترض أن لديك مفتاح نسخة احتياطية، لكنه ليس نشطا على هذا الجهاز.
- ما يجب فعله: شغل `openclaw matrix verify backup restore`، أو اضبط `MATRIX_RECOVERY_KEY` وشغل `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` إذا لزم الأمر.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- المعنى: لا يملك هذا الجهاز حاليا مفتاح الاسترداد مخزنا.
- ما يجب فعله: اضبط `MATRIX_RECOVERY_KEY`، وشغل `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`، ثم استعد النسخة الاحتياطية.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- المعنى: المفتاح المخزن لا يطابق نسخة Matrix الاحتياطية النشطة.
- ما يجب فعله: اضبط `MATRIX_RECOVERY_KEY` على المفتاح الصحيح وشغل `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

إذا قبلت فقدان السجل المشفر القديم غير القابل للاسترداد، فيمكنك بدلا من ذلك إعادة ضبط
خط الأساس الحالي للنسخ الاحتياطي باستخدام `openclaw matrix verify backup reset --yes`. عندما يكون
سر النسخ الاحتياطي المخزن معطوبا، فقد تعيد عملية الضبط هذه أيضا إنشاء التخزين السري حتى يتمكن
مفتاح النسخ الاحتياطي الجديد من التحميل بشكل صحيح بعد إعادة التشغيل.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- المعنى: النسخة الاحتياطية موجودة، لكن هذا الجهاز لا يثق بعد بسلسلة التوقيع المتبادل بالقوة الكافية.
- ما يجب فعله: اضبط `MATRIX_RECOVERY_KEY` وشغل `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Matrix recovery key is required`

- المعنى: حاولت تنفيذ خطوة استرداد دون تقديم مفتاح استرداد عندما كان مطلوبا.
- ما يجب فعله: أعد تشغيل الأمر مع `--recovery-key-stdin`، مثلا `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- المعنى: تعذر تحليل المفتاح المقدم أو لم يطابق التنسيق المتوقع.
- ما يجب فعله: أعد المحاولة باستخدام مفتاح الاسترداد الدقيق من عميل Matrix لديك أو من ملف recovery-key.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- المعنى: تمكن OpenClaw من تطبيق مفتاح الاسترداد، لكن Matrix لم
  ينشئ بعد ثقة هوية التوقيع المتبادل الكاملة لهذا الجهاز. تحقق من
  خرج الأمر بحثا عن `Recovery key accepted` و`Backup usable`
  و`Cross-signing verified` و`Device verified by owner`.
- ما يجب فعله: شغل `openclaw matrix verify self`، واقبل الطلب في عميل
  Matrix آخر، وقارن SAS، واكتب `yes` فقط عندما يتطابق. ينتظر
  الأمر ثقة هوية Matrix الكاملة قبل الإبلاغ عن النجاح. استخدم
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  فقط عندما تريد عمدا استبدال هوية التوقيع المتبادل الحالية.

`Matrix key backup is not active on this device after loading from secret storage.`

- المعنى: لم ينتج التخزين السري جلسة نسخ احتياطي نشطة على هذا الجهاز.
- ما يجب فعله: تحقق من الجهاز أولا، ثم أعد الفحص باستخدام `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- المعنى: لا يمكن لهذا الجهاز الاستعادة من التخزين السري حتى يكتمل التحقق من الجهاز.
- ما يجب فعله: شغل `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` أولا.

### رسائل تثبيت Plugin مخصصة

`Matrix is installed from a custom path that no longer exists: ...`

- المعنى: يشير سجل تثبيت Plugin لديك إلى مسار محلي لم يعد موجودا.
- ما يجب فعله: أعد التثبيت باستخدام `openclaw plugins install @openclaw/matrix`، أو إذا كنت تعمل من نسخة repo checkout، فاستخدم `openclaw plugins install ./path/to/local/matrix-plugin`.

## إذا لم يعد السجل المشفر بعد

شغل هذه الفحوص بالترتيب:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

إذا تمت استعادة النسخة الاحتياطية بنجاح لكن لا يزال السجل مفقودا في بعض الغرف القديمة، فمن المرجح أن تلك المفاتيح المفقودة لم تكن منسوخة احتياطيا بواسطة Plugin السابقة.

## إذا أردت البدء من جديد للرسائل المستقبلية

إذا قبلت فقدان السجل المشفر القديم غير القابل للاسترداد وتريد فقط خط أساس نظيفا للنسخ الاحتياطي من الآن فصاعدا، فشغل هذه الأوامر بالترتيب:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

إذا ظل الجهاز غير موثق بعد ذلك، فأكمل التحقق من عميل Matrix لديك بمقارنة رموز SAS التعبيرية أو الرموز العشرية وتأكيد تطابقها.

## ذات صلة

- [Matrix](/ar/channels/matrix): إعداد القناة وتكوينها.
- [قواعد الدفع في Matrix](/ar/channels/matrix-push-rules): توجيه الإشعارات.
- [Doctor](/ar/gateway/doctor): فحص السلامة ومشغل الترحيل التلقائي.
- [دليل الترحيل](/ar/install/migrating): جميع مسارات الترحيل (نقل الأجهزة، الاستيراد عبر الأنظمة).
- [Plugins](/ar/tools/plugin): تثبيت Plugin وتسجيلها.
