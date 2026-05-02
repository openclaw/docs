---
read_when:
    - ترقية تثبيت Matrix قائم
    - ترحيل سجل Matrix المشفّر وحالة الجهاز
summary: كيف يُجري OpenClaw ترقية موضعية لـ Plugin Matrix السابق، بما في ذلك حدود استرداد الحالة المشفرة وخطوات الاسترداد اليدوي.
title: ترحيل Matrix
x-i18n:
    generated_at: "2026-05-02T22:16:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8bc9b875fef0ae08978061a9fc7cbb076617009d79487ca8329e03076103b32c
    source_path: channels/matrix-migration.md
    workflow: 16
---

قم بالترقية من Plugin `matrix` العام السابق إلى التنفيذ الحالي.

بالنسبة إلى معظم المستخدمين، تتم الترقية في المكان نفسه:

- يبقى Plugin باسم `@openclaw/matrix`
- تبقى القناة `matrix`
- يبقى التكوين لديك ضمن `channels.matrix`
- تبقى بيانات الاعتماد المخزنة مؤقتا ضمن `~/.openclaw/credentials/matrix/`
- تبقى حالة وقت التشغيل ضمن `~/.openclaw/matrix/`

لا تحتاج إلى إعادة تسمية مفاتيح التكوين أو إعادة تثبيت Plugin باسم جديد.

## ما الذي تنفذه الهجرة تلقائيا

عند بدء Gateway، وعند تشغيل [`openclaw doctor --fix`](/ar/gateway/doctor)، يحاول OpenClaw إصلاح حالة Matrix القديمة تلقائيا.
قبل أن تعدل أي خطوة هجرة Matrix قابلة للتنفيذ الحالة على القرص، ينشئ OpenClaw لقطة استرداد مركزة أو يعيد استخدامها.

عند استخدام `openclaw update`، يعتمد المشغل الدقيق على طريقة تثبيت OpenClaw:

- تشغل تثبيتات المصدر `openclaw doctor --fix` أثناء مسار التحديث، ثم تعيد تشغيل Gateway افتراضيا
- تحدّث تثبيتات مدير الحزم الحزمة، وتشغل تمريرة doctor غير تفاعلية، ثم تعتمد على إعادة تشغيل Gateway الافتراضية حتى يتمكن بدء التشغيل من إكمال هجرة Matrix
- إذا كنت تستخدم `openclaw update --no-restart`، فستؤجل هجرة Matrix المدعومة ببدء التشغيل إلى أن تشغل لاحقا `openclaw doctor --fix` وتعيد تشغيل Gateway

تشمل الهجرة التلقائية ما يلي:

- إنشاء لقطة ما قبل الهجرة ضمن `~/Backups/openclaw-migrations/` أو إعادة استخدامها
- إعادة استخدام بيانات اعتماد Matrix المخزنة مؤقتا لديك
- الحفاظ على اختيار الحساب نفسه وتكوين `channels.matrix`
- نقل أقدم مخزن مزامنة Matrix مسطح إلى الموقع الحالي المقيّد بالحساب
- نقل أقدم مخزن تشفير Matrix مسطح إلى الموقع الحالي المقيّد بالحساب عندما يمكن حل الحساب الهدف بأمان
- استخراج مفتاح فك تشفير نسخة احتياطية لمفاتيح غرف Matrix محفوظة سابقا من مخزن تشفير rust القديم، عندما يكون ذلك المفتاح موجودا محليا
- إعادة استخدام جذر تخزين تجزئة الرمز الأكثر اكتمالا لحساب Matrix نفسه، وخادم homeserver، والمستخدم عندما يتغير رمز الوصول لاحقا
- فحص جذور تخزين تجزئة الرمز الشقيقة بحثا عن بيانات تعريف استعادة الحالة المشفرة المعلقة عندما يتغير رمز وصول Matrix لكن تبقى هوية الحساب/الجهاز كما هي
- استعادة مفاتيح الغرف المنسوخة احتياطيا إلى مخزن التشفير الجديد عند بدء تشغيل Matrix التالي

تفاصيل اللقطة:

- يكتب OpenClaw ملف علامة في `~/.openclaw/matrix/migration-snapshot.json` بعد لقطة ناجحة حتى تتمكن تمريرات بدء التشغيل والإصلاح اللاحقة من إعادة استخدام الأرشيف نفسه.
- تنسخ لقطات هجرة Matrix التلقائية هذه التكوين + الحالة فقط (`includeWorkspace: false`).
- إذا كانت لدى Matrix حالة هجرة تحذيرية فقط، مثلا لأن `userId` أو `accessToken` ما زال مفقودا، فلا ينشئ OpenClaw اللقطة بعد لأنه لا يوجد أي تعديل Matrix قابل للتنفيذ.
- إذا فشلت خطوة اللقطة، يتخطى OpenClaw هجرة Matrix في ذلك التشغيل بدلا من تعديل الحالة دون نقطة استرداد.

حول ترقيات الحسابات المتعددة:

- جاء أقدم مخزن Matrix مسطح (`~/.openclaw/matrix/bot-storage.json` و`~/.openclaw/matrix/crypto/`) من تخطيط مخزن واحد، لذلك لا يستطيع OpenClaw ترحيله إلا إلى هدف حساب Matrix محلول واحد
- يتم اكتشاف مخازن Matrix القديمة المقيّدة بالحساب مسبقا وتحضيرها لكل حساب Matrix مكوّن

## ما الذي لا تستطيع الهجرة تنفيذه تلقائيا

لم يكن Plugin Matrix العام السابق ينشئ نسخا احتياطية لمفاتيح غرف Matrix تلقائيا. كان يحفظ حالة التشفير المحلية ويطلب التحقق من الجهاز، لكنه لم يضمن نسخ مفاتيح غرفك احتياطيا إلى homeserver.

وهذا يعني أنه لا يمكن ترحيل بعض التثبيتات المشفرة إلا جزئيا.

لا يستطيع OpenClaw استرداد ما يلي تلقائيا:

- مفاتيح الغرف المحلية فقط التي لم تُنسخ احتياطيا مطلقا
- الحالة المشفرة عندما لا يمكن حل حساب Matrix الهدف بعد لأن `homeserver` أو `userId` أو `accessToken` ما زالت غير متاحة
- الهجرة التلقائية لمخزن Matrix مسطح مشترك واحد عندما تكون عدة حسابات Matrix مكوّنة لكن `channels.matrix.defaultAccount` غير معيّن
- تثبيتات مسار Plugin مخصصة مثبتة على مسار مستودع بدلا من حزمة Matrix القياسية
- مفتاح استرداد مفقود عندما كان المخزن القديم يحتوي على مفاتيح منسوخة احتياطيا لكنه لم يحتفظ بمفتاح فك التشفير محليا

نطاق التحذير الحالي:

- تظهر تثبيتات مسار Plugin Matrix المخصصة عبر بدء تشغيل Gateway و`openclaw doctor` معا

إذا كان تثبيتك القديم يحتوي على سجل مشفر محلي فقط لم يُنسخ احتياطيا مطلقا، فقد تبقى بعض الرسائل المشفرة الأقدم غير قابلة للقراءة بعد الترقية.

## مسار الترقية الموصى به

1. حدّث OpenClaw وPlugin Matrix بالطريقة المعتادة.
   يفضل استخدام `openclaw update` العادي دون `--no-restart` حتى يتمكن بدء التشغيل من إكمال هجرة Matrix فورا.
2. شغّل:

   ```bash
   openclaw doctor --fix
   ```

   إذا كانت لدى Matrix أعمال هجرة قابلة للتنفيذ، فسينشئ doctor لقطة ما قبل الهجرة أو يعيد استخدامها أولا ويطبع مسار الأرشيف.

3. ابدأ Gateway أو أعد تشغيله.
4. تحقق من حالة التحقق والنسخ الاحتياطي الحالية:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. ضع مفتاح الاسترداد لحساب Matrix الذي تصلحه في متغير بيئة خاص بالحساب. بالنسبة إلى حساب افتراضي واحد، يكفي `MATRIX_RECOVERY_KEY`. بالنسبة إلى حسابات متعددة، استخدم متغيرا واحدا لكل حساب، مثل `MATRIX_RECOVERY_KEY_ASSISTANT`، وأضف `--account assistant` إلى الأمر.

6. إذا أخبرك OpenClaw بأن مفتاح استرداد مطلوب، فشغّل الأمر للحساب المطابق:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. إذا كان هذا الجهاز لا يزال غير موثق، فشغّل الأمر للحساب المطابق:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   إذا تم قبول مفتاح الاسترداد وكان النسخ الاحتياطي قابلا للاستخدام، لكن `Cross-signing verified`
   ما زال `no`، فأكمل التحقق الذاتي من عميل Matrix آخر:

   ```bash
   openclaw matrix verify self
   ```

   اقبل الطلب في عميل Matrix آخر، وقارن الرموز التعبيرية أو الأرقام العشرية،
   واكتب `yes` فقط عندما تتطابق. يخرج الأمر بنجاح فقط
   بعد أن تصبح `Cross-signing verified` بالقيمة `yes`.

8. إذا كنت تتخلى عمدا عن السجل القديم غير القابل للاسترداد وتريد خط أساس نسخ احتياطي جديدا للرسائل المستقبلية، فشغّل:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. إذا لم تكن هناك نسخة احتياطية لمفاتيح من جانب الخادم بعد، فأنشئ واحدة لعمليات الاسترداد المستقبلية:

   ```bash
   openclaw matrix verify bootstrap
   ```

## كيف تعمل الهجرة المشفرة

الهجرة المشفرة عملية من مرحلتين:

1. ينشئ بدء التشغيل أو `openclaw doctor --fix` لقطة ما قبل الهجرة أو يعيد استخدامها إذا كانت الهجرة المشفرة قابلة للتنفيذ.
2. يفحص بدء التشغيل أو `openclaw doctor --fix` مخزن تشفير Matrix القديم عبر تثبيت Plugin Matrix النشط.
3. إذا عُثر على مفتاح فك تشفير نسخة احتياطية، يكتبه OpenClaw في مسار مفتاح الاسترداد الجديد ويضع علامة على استعادة مفاتيح الغرف على أنها معلقة.
4. عند بدء تشغيل Matrix التالي، يستعيد OpenClaw مفاتيح الغرف المنسوخة احتياطيا إلى مخزن التشفير الجديد تلقائيا.

إذا أبلغ المخزن القديم عن مفاتيح غرف لم تُنسخ احتياطيا مطلقا، يحذّر OpenClaw بدلا من التظاهر بأن الاسترداد نجح.

## الرسائل الشائعة ومعانيها

### رسائل الترقية والاكتشاف

`Matrix plugin upgraded in place.`

- المعنى: تم اكتشاف حالة Matrix القديمة على القرص وترحيلها إلى التخطيط الحالي.
- ما يجب فعله: لا شيء، إلا إذا كان الناتج نفسه يتضمن تحذيرات أيضا.

`Matrix migration snapshot created before applying Matrix upgrades.`

- المعنى: أنشأ OpenClaw أرشيف استرداد قبل تعديل حالة Matrix.
- ما يجب فعله: احتفظ بمسار الأرشيف المطبوع إلى أن تؤكد نجاح الهجرة.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- المعنى: وجد OpenClaw علامة لقطة هجرة Matrix موجودة وأعاد استخدام ذلك الأرشيف بدلا من إنشاء نسخة احتياطية مكررة.
- ما يجب فعله: احتفظ بمسار الأرشيف المطبوع إلى أن تؤكد نجاح الهجرة.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- المعنى: توجد حالة Matrix قديمة، لكن OpenClaw لا يستطيع ربطها بحساب Matrix حالي لأن Matrix غير مكوّن.
- ما يجب فعله: كوّن `channels.matrix`، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل Gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- المعنى: وجد OpenClaw حالة قديمة، لكنه ما زال لا يستطيع تحديد جذر الحساب/الجهاز الحالي الدقيق.
- ما يجب فعله: ابدأ Gateway مرة واحدة بتسجيل دخول Matrix يعمل، أو أعد تشغيل `openclaw doctor --fix` بعد وجود بيانات الاعتماد المخزنة مؤقتا.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- المعنى: وجد OpenClaw مخزن Matrix مسطحا مشتركا واحدا، لكنه يرفض تخمين أي حساب Matrix مسمى يجب أن يستقبله.
- ما يجب فعله: عيّن `channels.matrix.defaultAccount` إلى الحساب المقصود، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل Gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- المعنى: يحتوي الموقع الجديد المقيّد بالحساب مسبقا على مخزن مزامنة أو تشفير، لذلك لم يستبدله OpenClaw تلقائيا.
- ما يجب فعله: تحقق من أن الحساب الحالي هو الصحيح قبل إزالة الهدف المتعارض أو نقله يدويا.

`Failed migrating Matrix legacy sync store (...)` أو `Failed migrating Matrix legacy crypto store (...)`

- المعنى: حاول OpenClaw نقل حالة Matrix القديمة لكن عملية نظام الملفات فشلت.
- ما يجب فعله: افحص أذونات نظام الملفات وحالة القرص، ثم أعد تشغيل `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- المعنى: وجد OpenClaw مخزن Matrix مشفرا قديما، لكن لا يوجد تكوين Matrix حالي لإرفاقه به.
- ما يجب فعله: كوّن `channels.matrix`، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل Gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- المعنى: يوجد المخزن المشفر، لكن OpenClaw لا يستطيع أن يقرر بأمان أي حساب/جهاز حالي ينتمي إليه.
- ما يجب فعله: ابدأ Gateway مرة واحدة بتسجيل دخول Matrix يعمل، أو أعد تشغيل `openclaw doctor --fix` بعد توفر بيانات الاعتماد المخزنة مؤقتا.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- المعنى: وجد OpenClaw مخزن تشفير قديما مسطحا مشتركا واحدا، لكنه يرفض تخمين أي حساب Matrix مسمى يجب أن يستقبله.
- ما يجب فعله: عيّن `channels.matrix.defaultAccount` إلى الحساب المقصود، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل Gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- المعنى: اكتشف OpenClaw حالة Matrix قديمة، لكن الهجرة ما زالت محجوبة بسبب بيانات هوية أو اعتماد مفقودة.
- ما يجب فعله: أكمل تسجيل دخول Matrix أو إعداد التكوين، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل Gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- المعنى: وجد OpenClaw حالة Matrix مشفرة قديمة، لكنه لم يتمكن من تحميل نقطة دخول المساعد من Plugin Matrix الذي يفحص ذلك المخزن عادة.
- ما يجب فعله: أعد تثبيت Plugin Matrix أو أصلحه (`openclaw plugins install @openclaw/matrix`، أو `openclaw plugins install ./path/to/local/matrix-plugin` لنسخة مستودع)، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل Gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- المعنى: عثر OpenClaw على مسار ملف مساعد يخرج من جذر Plugin أو يفشل في فحوصات حدود Plugin، لذلك رفض استيراده.
- ما يجب فعله: أعد تثبيت Matrix Plugin من مسار موثوق، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل Gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- المعنى: رفض OpenClaw تعديل حالة Matrix لأنه لم يتمكن أولاً من إنشاء لقطة الاسترداد.
- ما يجب فعله: عالج خطأ النسخ الاحتياطي، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل Gateway.

`Failed migrating legacy Matrix client storage: ...`

- المعنى: وجد مسار الرجوع من جهة عميل Matrix تخزيناً مسطحاً قديماً، لكن النقل فشل. يوقف OpenClaw الآن مسار الرجوع هذا بدلاً من البدء بصمت بمخزن جديد.
- ما يجب فعله: افحص أذونات نظام الملفات أو التعارضات، وأبقِ الحالة القديمة سليمة، ثم أعد المحاولة بعد إصلاح الخطأ.

`Matrix is installed from a custom path: ...`

- المعنى: Matrix مثبت على مسار محدد، لذلك لا تستبدله تحديثات المسار الرئيسي تلقائياً بحزمة Matrix القياسية في المستودع.
- ما يجب فعله: أعد التثبيت باستخدام `openclaw plugins install @openclaw/matrix` عندما تريد العودة إلى Matrix Plugin الافتراضي.

### رسائل استرداد الحالة المشفرة

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- المعنى: تمت استعادة مفاتيح الغرف المنسوخة احتياطياً بنجاح إلى مخزن التشفير الجديد.
- ما يجب فعله: لا شيء عادةً.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- المعنى: كانت بعض مفاتيح الغرف القديمة موجودة فقط في المخزن المحلي القديم ولم تُرفع قط إلى نسخة Matrix الاحتياطية.
- ما يجب فعله: توقّع أن يبقى بعض السجل المشفر القديم غير متاح إلا إذا استطعت استرداد تلك المفاتيح يدوياً من عميل آخر موثّق.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- المعنى: توجد نسخة احتياطية، لكن OpenClaw لم يتمكن من استرداد مفتاح الاسترداد تلقائياً.
- ما يجب فعله: شغّل `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- المعنى: وجد OpenClaw المخزن المشفر القديم، لكنه لم يتمكن من فحصه بأمان كافٍ لتحضير الاسترداد.
- ما يجب فعله: أعد تشغيل `openclaw doctor --fix`. إذا تكرر ذلك، فأبقِ دليل الحالة القديم سليماً واسترد باستخدام عميل Matrix موثّق آخر مع `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- المعنى: اكتشف OpenClaw تعارضاً في مفتاح النسخ الاحتياطي ورفض استبدال ملف مفتاح الاسترداد الحالي تلقائياً.
- ما يجب فعله: تحقق من مفتاح الاسترداد الصحيح قبل إعادة محاولة أي أمر استعادة.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- المعنى: هذا هو الحد الصارم لتنسيق التخزين القديم.
- ما يجب فعله: لا تزال المفاتيح المنسوخة احتياطياً قابلة للاستعادة، لكن قد يبقى السجل المشفر المحلي فقط غير متاح.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- المعنى: حاول Plugin الجديد الاستعادة، لكن Matrix أرجع خطأ.
- ما يجب فعله: شغّل `openclaw matrix verify backup status`، ثم أعد المحاولة باستخدام `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` إذا لزم الأمر.

### رسائل الاسترداد اليدوي

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- المعنى: يعرف OpenClaw أنه ينبغي أن يكون لديك مفتاح نسخة احتياطية، لكنه غير نشط على هذا الجهاز.
- ما يجب فعله: شغّل `openclaw matrix verify backup restore`، أو عيّن `MATRIX_RECOVERY_KEY` وشغّل `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` إذا لزم الأمر.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- المعنى: لا يحتوي هذا الجهاز حالياً على مفتاح الاسترداد مخزناً.
- ما يجب فعله: عيّن `MATRIX_RECOVERY_KEY`، وشغّل `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`، ثم استعد النسخة الاحتياطية.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- المعنى: لا يطابق المفتاح المخزن نسخة Matrix الاحتياطية النشطة.
- ما يجب فعله: عيّن `MATRIX_RECOVERY_KEY` إلى المفتاح الصحيح وشغّل `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

إذا قبلت فقدان السجل المشفر القديم غير القابل للاسترداد، يمكنك بدلاً من ذلك إعادة ضبط
خط أساس النسخة الاحتياطية الحالية باستخدام `openclaw matrix verify backup reset --yes`. عندما يكون
سر النسخة الاحتياطية المخزن معطلاً، قد تعيد عملية الضبط هذه أيضاً إنشاء تخزين الأسرار بحيث يمكن
تحميل مفتاح النسخة الاحتياطية الجديد بشكل صحيح بعد إعادة التشغيل.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- المعنى: توجد النسخة الاحتياطية، لكن هذا الجهاز لا يثق بعد بسلسلة التوقيع المتبادل بدرجة كافية.
- ما يجب فعله: عيّن `MATRIX_RECOVERY_KEY` وشغّل `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Matrix recovery key is required`

- المعنى: حاولت تنفيذ خطوة استرداد من دون تقديم مفتاح استرداد عندما كان مطلوباً.
- ما يجب فعله: أعد تشغيل الأمر مع `--recovery-key-stdin`، على سبيل المثال `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- المعنى: تعذر تحليل المفتاح المقدم أو لم يطابق التنسيق المتوقع.
- ما يجب فعله: أعد المحاولة باستخدام مفتاح الاسترداد الدقيق من عميل Matrix لديك أو من ملف مفتاح الاسترداد.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- المعنى: تمكن OpenClaw من تطبيق مفتاح الاسترداد، لكن Matrix لا يزال لم
  ينشئ ثقة كاملة بهوية التوقيع المتبادل لهذا الجهاز. تحقق من
  خرج الأمر بحثاً عن `Recovery key accepted` و`Backup usable` و
  `Cross-signing verified` و`Device verified by owner`.
- ما يجب فعله: شغّل `openclaw matrix verify self`، واقبل الطلب في عميل
  Matrix آخر، وقارن SAS، واكتب `yes` فقط عندما يتطابق. ينتظر
  الأمر اكتمال ثقة هوية Matrix قبل الإبلاغ عن النجاح. استخدم
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  فقط عندما تريد عمداً استبدال هوية التوقيع المتبادل الحالية.

`Matrix key backup is not active on this device after loading from secret storage.`

- المعنى: لم ينتج تخزين الأسرار جلسة نسخة احتياطية نشطة على هذا الجهاز.
- ما يجب فعله: وثّق الجهاز أولاً، ثم أعد الفحص باستخدام `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- المعنى: لا يستطيع هذا الجهاز الاستعادة من تخزين الأسرار حتى يكتمل توثيق الجهاز.
- ما يجب فعله: شغّل أولاً `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

### رسائل تثبيت Plugin مخصص

`Matrix is installed from a custom path that no longer exists: ...`

- المعنى: يشير سجل تثبيت Plugin لديك إلى مسار محلي لم يعد موجوداً.
- ما يجب فعله: أعد التثبيت باستخدام `openclaw plugins install @openclaw/matrix`، أو إذا كنت تعمل من نسخة مستودع، فاستخدم `openclaw plugins install ./path/to/local/matrix-plugin`.

## إذا لم يعد السجل المشفر بعد

شغّل هذه الفحوصات بالترتيب:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

إذا تمت استعادة النسخة الاحتياطية بنجاح لكن بعض الغرف القديمة لا تزال تفتقد السجل، فغالباً لم ينسخ Plugin السابق تلك المفاتيح احتياطياً قط.

## إذا أردت البدء من جديد للرسائل المستقبلية

إذا قبلت فقدان السجل المشفر القديم غير القابل للاسترداد وتريد فقط خط أساس نظيفاً للنسخ الاحتياطي من الآن فصاعداً، فشغّل هذه الأوامر بالترتيب:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

إذا بقي الجهاز غير موثّق بعد ذلك، فأكمل التوثيق من عميل Matrix لديك بمقارنة رموز SAS التعبيرية أو الرموز العشرية والتأكيد على أنها متطابقة.

## ذو صلة

- [Matrix](/ar/channels/matrix): إعداد القناة والتكوين.
- [قواعد دفع Matrix](/ar/channels/matrix-push-rules): توجيه الإشعارات.
- [Doctor](/ar/gateway/doctor): فحص السلامة ومشغّل الترحيل التلقائي.
- [دليل الترحيل](/ar/install/migrating): جميع مسارات الترحيل (نقل الأجهزة، الاستيراد بين الأنظمة).
- [Plugins](/ar/tools/plugin): تثبيت Plugin وتسجيله.
