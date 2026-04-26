---
read_when:
    - ترقية تثبيت Matrix موجود بالفعل
    - ترحيل سجل Matrix المشفّر وحالة الجهاز
summary: كيف يرقّي OpenClaw Plugin Matrix السابقة في مكانها، بما في ذلك حدود استعادة الحالة المشفرة وخطوات الاستعادة اليدوية.
title: ترحيل Matrix
x-i18n:
    generated_at: "2026-04-26T11:33:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd046436126e6b76b398fb3798b068547ff80769bc9e0e8486908ba22b5f11
    source_path: install/migrating-matrix.md
    workflow: 15
---

تغطي هذه الصفحة الترقيات من Plugin `matrix` العامة السابقة إلى التنفيذ الحالي.

بالنسبة إلى معظم المستخدمين، تتم الترقية في مكانها:

- تبقى Plugin باسم `@openclaw/matrix`
- تبقى القناة باسم `matrix`
- تبقى إعداداتك تحت `channels.matrix`
- تبقى بيانات الاعتماد المخزنة مؤقتًا تحت `~/.openclaw/credentials/matrix/`
- تبقى حالة runtime تحت `~/.openclaw/matrix/`

لا تحتاج إلى إعادة تسمية مفاتيح الإعدادات أو إعادة تثبيت Plugin باسم جديد.

## ما الذي يفعله الترحيل تلقائيًا

عندما يبدأ Gateway، وعندما تشغّل [`openclaw doctor --fix`](/ar/gateway/doctor)، يحاول OpenClaw إصلاح حالة Matrix القديمة تلقائيًا.
وقبل أن تغيّر أي خطوة ترحيل Matrix قابلة للتنفيذ حالةً على القرص، ينشئ OpenClaw أو يعيد استخدام لقطة استعادة مركزة.

عند استخدام `openclaw update`، يعتمد المُشغِّل الدقيق على طريقة تثبيت OpenClaw:

- تقوم تثبيتات المصدر بتشغيل `openclaw doctor --fix` أثناء تدفق التحديث، ثم تعيد تشغيل gateway افتراضيًا
- تقوم تثبيتات package manager بتحديث الحزمة، وتشغيل مرور doctor غير تفاعلي، ثم تعتمد على إعادة تشغيل gateway الافتراضية حتى يتمكن بدء التشغيل من إكمال ترحيل Matrix
- إذا استخدمت `openclaw update --no-restart`، فسيتم تأجيل ترحيل Matrix المعتمد على بدء التشغيل حتى تشغّل لاحقًا `openclaw doctor --fix` وتعيد تشغيل gateway

يغطي الترحيل التلقائي ما يلي:

- إنشاء أو إعادة استخدام لقطة ما قبل الترحيل تحت `~/Backups/openclaw-migrations/`
- إعادة استخدام بيانات اعتماد Matrix المخزنة مؤقتًا
- الإبقاء على اختيار الحساب نفسه وإعدادات `channels.matrix`
- نقل أقدم مخزن مزامنة Matrix المسطح إلى الموقع الحالي المحدد حسب الحساب
- نقل أقدم مخزن تشفير Matrix المسطح إلى الموقع الحالي المحدد حسب الحساب عندما يمكن حل الحساب الهدف بأمان
- استخراج مفتاح فك تشفير النسخ الاحتياطي لمفاتيح غرف Matrix المحفوظ سابقًا من مخزن rust crypto القديم، عندما يكون هذا المفتاح موجودًا محليًا
- إعادة استخدام جذر تخزين hash الخاص بالـ token الأكثر اكتمالًا الموجود للحساب نفسه في Matrix والخادم المنزلي والمستخدم نفسه عندما يتغير access token لاحقًا
- فحص جذور تخزين hash الخاصة بالـ token المجاورة بحثًا عن بيانات وصفية معلقة لاستعادة الحالة المشفرة عندما يتغير access token في Matrix لكن تبقى هوية الحساب/الجهاز كما هي
- استعادة مفاتيح الغرف المنسوخة احتياطيًا إلى مخزن التشفير الجديد عند بدء تشغيل Matrix التالي

تفاصيل اللقطة:

- يكتب OpenClaw ملف علامة عند `~/.openclaw/matrix/migration-snapshot.json` بعد نجاح اللقطة حتى تتمكن تمريرات بدء التشغيل والإصلاح اللاحقة من إعادة استخدام الأرشيف نفسه.
- تقوم لقطات ترحيل Matrix التلقائية هذه بنسخ الإعدادات + الحالة فقط (`includeWorkspace: false`).
- إذا كانت لدى Matrix حالة ترحيل تحذيرية فقط، على سبيل المثال لأن `userId` أو `accessToken` لا يزال مفقودًا، فلن ينشئ OpenClaw اللقطة بعد لأن أي تعديل على Matrix ليس قابلاً للتنفيذ بعد.
- إذا فشلت خطوة اللقطة، فسيتجاوز OpenClaw ترحيل Matrix في تلك التشغيلات بدلًا من تعديل الحالة دون نقطة استعادة.

حول ترقيات الحسابات المتعددة:

- جاء أقدم مخزن Matrix مسطح (`~/.openclaw/matrix/bot-storage.json` و`~/.openclaw/matrix/crypto/`) من تخطيط ذي مخزن واحد، لذلك لا يستطيع OpenClaw ترحيله إلا إلى هدف حساب Matrix واحد تم حله
- يتم اكتشاف مخازن Matrix القديمة المحددة بالفعل حسب الحساب وتجهيزها لكل حساب Matrix مهيأ

## ما الذي لا يستطيع الترحيل فعله تلقائيًا

لم تُنشئ Plugin Matrix العامة السابقة **النسخ الاحتياطية لمفاتيح غرف Matrix تلقائيًا**. فقد حفظت حالة التشفير المحلية وطلبت التحقق من الجهاز، لكنها لم تضمن نسخ مفاتيح غرفك احتياطيًا إلى homeserver.

وهذا يعني أن بعض التثبيتات المشفرة لا يمكن ترحيلها إلا جزئيًا.

لا يستطيع OpenClaw استعادة ما يلي تلقائيًا:

- مفاتيح الغرف المحلية فقط التي لم يُنشأ لها نسخ احتياطي مطلقًا
- الحالة المشفرة عندما لا يمكن بعد حل حساب Matrix الهدف لأن `homeserver` أو `userId` أو `accessToken` لا تزال غير متاحة
- الترحيل التلقائي لمخزن Matrix مسطح مشترك واحد عندما تكون حسابات Matrix متعددة مهيأة لكن `channels.matrix.defaultAccount` غير مضبوط
- تثبيتات مسارات Plugin المخصصة المثبتة على مسار repo بدلًا من حزمة Matrix القياسية
- مفتاح استعادة مفقود عندما كان للمخزن القديم مفاتيح منسوخة احتياطيًا لكنه لم يحتفظ بمفتاح فك التشفير محليًا

نطاق التحذير الحالي:

- يتم إظهار تثبيتات مسار Plugin Matrix المخصصة بواسطة كل من بدء تشغيل gateway و`openclaw doctor`

إذا كان تثبيتك القديم يحتوي على سجل مشفر قديم محلي فقط ولم يُنسخ احتياطيًا مطلقًا، فقد تظل بعض الرسائل المشفرة الأقدم غير قابلة للقراءة بعد الترقية.

## تدفق الترقية الموصى به

1. حدّث OpenClaw وPlugin Matrix بالطريقة العادية.
   ويفضّل استخدام `openclaw update` العادي من دون `--no-restart` حتى يتمكن بدء التشغيل من إنهاء ترحيل Matrix فورًا.
2. شغّل:

   ```bash
   openclaw doctor --fix
   ```

   إذا كانت لدى Matrix أعمال ترحيل قابلة للتنفيذ، فسيقوم doctor بإنشاء أو إعادة استخدام لقطة ما قبل الترحيل أولًا ثم يطبع مسار الأرشيف.

3. ابدأ أو أعد تشغيل gateway.
4. تحقق من حالة التحقق والنسخ الاحتياطي الحالية:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. ضع recovery key لحساب Matrix الذي تقوم بإصلاحه في متغير بيئة خاص بالحساب. بالنسبة إلى حساب افتراضي منفرد، يكفي `MATRIX_RECOVERY_KEY`. وبالنسبة إلى حسابات متعددة، استخدم متغيرًا واحدًا لكل حساب، مثل `MATRIX_RECOVERY_KEY_ASSISTANT`، وأضف `--account assistant` إلى الأمر.

6. إذا أخبرك OpenClaw أن recovery key مطلوبة، فشغّل الأمر للحساب المطابق:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. إذا كان هذا الجهاز لا يزال غير متحقق منه، فشغّل الأمر للحساب المطابق:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   إذا قُبل recovery key وأصبح النسخ الاحتياطي قابلاً للاستخدام، لكن `Cross-signing verified`
   لا تزال `no`، فأكمل التحقق الذاتي من عميل Matrix آخر:

   ```bash
   openclaw matrix verify self
   ```

   اقبل الطلب في عميل Matrix آخر، وقارن emoji أو الأرقام العشرية،
   واكتب `yes` فقط عندما تتطابق. ولن يخرج الأمر بنجاح إلا
   بعد أن تصبح `Cross-signing verified` مساوية لـ `yes`.

8. إذا كنت تتخلى عمدًا عن سجل قديم غير قابل للاستعادة وتريد خط أساس جديدًا للنسخ الاحتياطي للرسائل المستقبلية، فشغّل:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. إذا لم يوجد بعد نسخ احتياطي للمفاتيح على جانب الخادم، فأنشئ واحدًا لعمليات الاستعادة المستقبلية:

   ```bash
   openclaw matrix verify bootstrap
   ```

## كيف يعمل الترحيل المشفر

الترحيل المشفر عملية ذات مرحلتين:

1. يقوم بدء التشغيل أو `openclaw doctor --fix` بإنشاء أو إعادة استخدام لقطة ما قبل الترحيل إذا كان الترحيل المشفر قابلاً للتنفيذ.
2. يفحص بدء التشغيل أو `openclaw doctor --fix` مخزن تشفير Matrix القديم عبر تثبيت Plugin Matrix النشط.
3. إذا تم العثور على backup decryption key، يكتب OpenClaw هذا المفتاح في تدفق recovery key الجديد ويضع علامة على أن استعادة مفاتيح الغرف معلقة.
4. عند بدء تشغيل Matrix التالي، يعيد OpenClaw مفاتيح الغرف المنسوخة احتياطيًا إلى مخزن التشفير الجديد تلقائيًا.

إذا أبلغ المخزن القديم عن مفاتيح غرف لم يُنشأ لها نسخ احتياطي مطلقًا، فسيحذّر OpenClaw بدلًا من الادعاء بنجاح الاستعادة.

## الرسائل الشائعة وما الذي تعنيه

### رسائل الترقية والاكتشاف

`Matrix plugin upgraded in place.`

- المعنى: تم اكتشاف حالة Matrix القديمة على القرص وترحيلها إلى التخطيط الحالي.
- ما الذي يجب فعله: لا شيء ما لم تتضمن المخرجات نفسها أيضًا تحذيرات.

`Matrix migration snapshot created before applying Matrix upgrades.`

- المعنى: أنشأ OpenClaw أرشيف استعادة قبل تعديل حالة Matrix.
- ما الذي يجب فعله: احتفظ بمسار الأرشيف المطبوع حتى تؤكد نجاح الترحيل.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- المعنى: وجد OpenClaw علامة لقطة ترحيل Matrix موجودة وأعاد استخدام ذلك الأرشيف بدلًا من إنشاء نسخة احتياطية مكررة.
- ما الذي يجب فعله: احتفظ بمسار الأرشيف المطبوع حتى تؤكد نجاح الترحيل.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- المعنى: توجد حالة Matrix قديمة، لكن OpenClaw لا يستطيع ربطها بحساب Matrix حالي لأن Matrix غير مهيأة.
- ما الذي يجب فعله: هيّئ `channels.matrix`، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- المعنى: عثر OpenClaw على حالة قديمة، لكنه لا يزال غير قادر على تحديد الجذر الحالي الدقيق للحساب/الجهاز.
- ما الذي يجب فعله: ابدأ gateway مرة واحدة باستخدام تسجيل دخول Matrix صالح، أو أعد تشغيل `openclaw doctor --fix` بعد توفر بيانات الاعتماد المخزنة مؤقتًا.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- المعنى: وجد OpenClaw مخزن Matrix مشتركًا مسطحًا واحدًا، لكنه يرفض التخمين أي حساب Matrix مسمى يجب أن يستقبله.
- ما الذي يجب فعله: اضبط `channels.matrix.defaultAccount` على الحساب المقصود، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- المعنى: يحتوي الموقع الجديد المحدد حسب الحساب بالفعل على مخزن مزامنة أو تشفير، لذلك لم يقم OpenClaw بالكتابة فوقه تلقائيًا.
- ما الذي يجب فعله: تحقق من أن الحساب الحالي هو الحساب الصحيح قبل إزالة الهدف المتعارض أو نقله يدويًا.

`Failed migrating Matrix legacy sync store (...)` أو `Failed migrating Matrix legacy crypto store (...)`

- المعنى: حاول OpenClaw نقل حالة Matrix القديمة لكن عملية نظام الملفات فشلت.
- ما الذي يجب فعله: افحص أذونات نظام الملفات وحالة القرص، ثم أعد تشغيل `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- المعنى: عثر OpenClaw على مخزن Matrix مشفر قديم، لكن لا توجد إعدادات Matrix حالية لربطه بها.
- ما الذي يجب فعله: هيّئ `channels.matrix`، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- المعنى: يوجد المخزن المشفر، لكن OpenClaw لا يستطيع أن يقرر بأمان إلى أي حساب/جهاز حالي ينتمي.
- ما الذي يجب فعله: ابدأ gateway مرة واحدة باستخدام تسجيل دخول Matrix صالح، أو أعد تشغيل `openclaw doctor --fix` بعد توفر بيانات الاعتماد المخزنة مؤقتًا.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- المعنى: وجد OpenClaw مخزن تشفير قديمًا مشتركًا مسطحًا واحدًا، لكنه يرفض التخمين أي حساب Matrix مسمى يجب أن يستقبله.
- ما الذي يجب فعله: اضبط `channels.matrix.defaultAccount` على الحساب المقصود، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- المعنى: اكتشف OpenClaw حالة Matrix قديمة، لكن الترحيل لا يزال محجوبًا بسبب نقص بيانات الهوية أو بيانات الاعتماد.
- ما الذي يجب فعله: أكمل تسجيل دخول Matrix أو إعداد config، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- المعنى: عثر OpenClaw على حالة Matrix مشفرة قديمة، لكنه لم يتمكن من تحميل helper entrypoint من Plugin Matrix التي تفحص ذلك المخزن عادةً.
- ما الذي يجب فعله: أعد تثبيت Plugin Matrix أو أصلحها (`openclaw plugins install @openclaw/matrix`، أو `openclaw plugins install ./path/to/local/matrix-plugin` لنسخة repo checkout)، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- المعنى: عثر OpenClaw على مسار ملف helper يخرج خارج جذر Plugin أو يفشل في فحوصات حدود Plugin، لذلك رفض استيراده.
- ما الذي يجب فعله: أعد تثبيت Plugin Matrix من مسار موثوق، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- المعنى: رفض OpenClaw تعديل حالة Matrix لأنه لم يتمكن من إنشاء لقطة الاستعادة أولًا.
- ما الذي يجب فعله: عالج خطأ النسخ الاحتياطي، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل gateway.

`Failed migrating legacy Matrix client storage: ...`

- المعنى: عثر مسار fallback الخاص بالعميل في Matrix على تخزين مسطح قديم، لكن النقل فشل. ويقوم OpenClaw الآن بإيقاف هذا fallback بدلًا من البدء بصمت باستخدام مخزن جديد.
- ما الذي يجب فعله: افحص أذونات نظام الملفات أو التعارضات، وأبقِ الحالة القديمة سليمة، ثم أعد المحاولة بعد إصلاح الخطأ.

`Matrix is installed from a custom path: ...`

- المعنى: Matrix مثبتة من مسار مخصص، لذلك لا تستبدلها التحديثات الرئيسية تلقائيًا بحزمة Matrix القياسية الخاصة بالمستودع.
- ما الذي يجب فعله: أعد التثبيت باستخدام `openclaw plugins install @openclaw/matrix` عندما تريد العودة إلى Plugin Matrix الافتراضية.

### رسائل استعادة الحالة المشفرة

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- المعنى: تمت استعادة مفاتيح الغرف المنسوخة احتياطيًا بنجاح إلى مخزن التشفير الجديد.
- ما الذي يجب فعله: لا شيء في العادة.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- المعنى: كانت بعض مفاتيح الغرف القديمة موجودة فقط في المخزن المحلي القديم ولم تُرفع قط إلى النسخ الاحتياطي في Matrix.
- ما الذي يجب فعله: توقّع أن يظل بعض السجل المشفّر القديم غير متاح ما لم تتمكن من استعادة تلك المفاتيح يدويًا من عميل آخر متحقق منه.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- المعنى: النسخ الاحتياطي موجود، لكن OpenClaw لم يتمكن من استعادة recovery key تلقائيًا.
- ما الذي يجب فعله: شغّل `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- المعنى: عثر OpenClaw على المخزن المشفر القديم، لكنه لم يتمكن من فحصه بأمان كافٍ لتحضير الاستعادة.
- ما الذي يجب فعله: أعد تشغيل `openclaw doctor --fix`. وإذا تكرر ذلك، فأبقِ دليل الحالة القديم سليمًا واستعِد باستخدام عميل Matrix آخر متحقق منه بالإضافة إلى `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- المعنى: اكتشف OpenClaw تعارضًا في backup key ورفض الكتابة فوق ملف recovery-key الحالي تلقائيًا.
- ما الذي يجب فعله: تحقق من recovery key الصحيحة قبل إعادة محاولة أي أمر استعادة.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- المعنى: هذا هو الحد الصلب لصيغة التخزين القديمة.
- ما الذي يجب فعله: لا يزال من الممكن استعادة المفاتيح المنسوخة احتياطيًا، لكن السجل المشفر المحلي فقط قد يبقى غير متاح.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- المعنى: حاولت Plugin الجديدة الاستعادة لكن Matrix أعادت خطأ.
- ما الذي يجب فعله: شغّل `openclaw matrix verify backup status`، ثم أعد المحاولة باستخدام `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` إذا لزم الأمر.

### رسائل الاستعادة اليدوية

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- المعنى: يعرف OpenClaw أنه يجب أن يكون لديك backup key، لكنها ليست نشطة على هذا الجهاز.
- ما الذي يجب فعله: شغّل `openclaw matrix verify backup restore`، أو اضبط `MATRIX_RECOVERY_KEY` وشغّل `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` إذا لزم الأمر.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- المعنى: لا يملك هذا الجهاز حاليًا recovery key مخزنة.
- ما الذي يجب فعله: اضبط `MATRIX_RECOVERY_KEY`، ثم شغّل `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`، ثم استعد النسخ الاحتياطي.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- المعنى: لا يتطابق المفتاح المخزن مع النسخ الاحتياطي النشط في Matrix.
- ما الذي يجب فعله: اضبط `MATRIX_RECOVERY_KEY` على المفتاح الصحيح وشغّل `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

إذا كنت تقبل فقدان السجل المشفر القديم غير القابل للاستعادة، فيمكنك بدلًا من ذلك إعادة تعيين
خط الأساس الحالي للنسخ الاحتياطي باستخدام `openclaw matrix verify backup reset --yes`. وعندما
يكون secret الاحتياطي المخزن معطّلًا، فقد تعيد عملية إعادة التعيين تلك أيضًا إنشاء secret storage بحيث يمكن تحميل
backup key الجديدة بشكل صحيح بعد إعادة التشغيل.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- المعنى: النسخ الاحتياطي موجود، لكن هذا الجهاز لا يثق بعد بشكل كافٍ في سلسلة cross-signing.
- ما الذي يجب فعله: اضبط `MATRIX_RECOVERY_KEY` وشغّل `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Matrix recovery key is required`

- المعنى: حاولت تنفيذ خطوة استعادة من دون توفير recovery key حين كانت مطلوبة.
- ما الذي يجب فعله: أعد تشغيل الأمر باستخدام `--recovery-key-stdin`، مثل `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- المعنى: تعذر تحليل المفتاح المقدم أو لم يطابق التنسيق المتوقع.
- ما الذي يجب فعله: أعد المحاولة باستخدام recovery key الدقيقة من عميل Matrix أو من ملف recovery-key.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- المعنى: تمكّن OpenClaw من تطبيق recovery key، لكن Matrix لم
  يؤسس بعد ثقة كاملة في هوية هذا الجهاز عبر cross-signing. تحقّق من
  مخرجات الأمر بحثًا عن `Recovery key accepted` و`Backup usable` و
  `Cross-signing verified` و`Device verified by owner`.
- ما الذي يجب فعله: شغّل `openclaw matrix verify self`، واقبل الطلب في عميل
  Matrix آخر، وقارن SAS، واكتب `yes` فقط عندما تتطابق. وينتظر
  الأمر تحقق الثقة الكاملة في هوية Matrix قبل الإبلاغ عن النجاح. استخدم
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  فقط عندما تريد عمدًا استبدال هوية cross-signing الحالية.

`Matrix key backup is not active on this device after loading from secret storage.`

- المعنى: لم تُنتج secret storage جلسة نسخ احتياطي نشطة على هذا الجهاز.
- ما الذي يجب فعله: تحقّق من الجهاز أولًا، ثم أعد الفحص باستخدام `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- المعنى: لا يستطيع هذا الجهاز الاستعادة من secret storage حتى يكتمل التحقق من الجهاز.
- ما الذي يجب فعله: شغّل أولًا `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

### رسائل تثبيت Plugin المخصصة

`Matrix is installed from a custom path that no longer exists: ...`

- المعنى: يشير سجل تثبيت Plugin لديك إلى مسار محلي لم يعد موجودًا.
- ما الذي يجب فعله: أعد التثبيت باستخدام `openclaw plugins install @openclaw/matrix`، أو إذا كنت تشغّل من repo checkout فاستخدم `openclaw plugins install ./path/to/local/matrix-plugin`.

## إذا لم يعد السجل المشفر بعد

شغّل هذه الفحوصات بالترتيب:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

إذا تمت استعادة النسخ الاحتياطي بنجاح لكن بعض الغرف القديمة لا تزال تفتقد السجل، فمن المرجح أن تلك المفاتيح المفقودة لم تُنسخ احتياطيًا مطلقًا بواسطة Plugin السابقة.

## إذا كنت تريد البدء من جديد للرسائل المستقبلية

إذا كنت تقبل فقدان السجل المشفر القديم غير القابل للاستعادة وتريد فقط خط أساس نظيفًا للنسخ الاحتياطي من الآن فصاعدًا، فشغّل هذه الأوامر بالترتيب:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

إذا كان الجهاز لا يزال غير متحقق منه بعد ذلك، فأكمل التحقق من عميل Matrix لديك بمقارنة SAS emoji أو الرموز العشرية وتأكيد تطابقها.

## صفحات ذات صلة

- [Matrix](/ar/channels/matrix)
- [Doctor](/ar/gateway/doctor)
- [الترحيل](/ar/install/migrating)
- [Plugins](/ar/tools/plugin)
