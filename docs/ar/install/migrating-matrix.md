---
read_when:
    - ترقية تثبيت Matrix موجود بالفعل
    - ترحيل سجل Matrix المشفر وحالة الجهاز
summary: كيف يقوم OpenClaw بترقية Plugin السابق الخاص بـ Matrix في مكانه، بما في ذلك حدود استعادة الحالة المشفرة وخطوات الاستعادة اليدوية.
title: ترحيل Matrix
x-i18n:
    generated_at: "2026-04-24T07:49:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: e8210f5fbe476148736417eec29dfb5e27c132c6a0bb80753ce254129c14da4f
    source_path: install/migrating-matrix.md
    workflow: 15
---

تغطي هذه الصفحة الترقيات من Plugin العام السابق `matrix` إلى التنفيذ الحالي.

بالنسبة إلى معظم المستخدمين، تتم الترقية في مكانها:

- يبقى الـ Plugin باسم `@openclaw/matrix`
- تبقى القناة باسم `matrix`
- يبقى الإعداد تحت `channels.matrix`
- تبقى بيانات الاعتماد المخزنة مؤقتًا تحت `~/.openclaw/credentials/matrix/`
- تبقى حالة وقت التشغيل تحت `~/.openclaw/matrix/`

لا تحتاج إلى إعادة تسمية مفاتيح الإعداد أو إعادة تثبيت Plugin تحت اسم جديد.

## ما الذي يفعله الترحيل تلقائيًا

عندما تبدأ gateway، وعندما تشغّل [`openclaw doctor --fix`](/ar/gateway/doctor)، يحاول OpenClaw إصلاح حالة Matrix القديمة تلقائيًا.
وقبل أن تُجري أي خطوة ترحيل Matrix قابلة للتنفيذ تعديلًا على الحالة المخزنة على القرص، ينشئ OpenClaw لقطة استعادة مركزة أو يعيد استخدامها.

عندما تستخدم `openclaw update`، يعتمد المشغّل الدقيق على كيفية تثبيت OpenClaw:

- تثبيتات المصدر تشغّل `openclaw doctor --fix` أثناء تدفق التحديث، ثم تعيد تشغيل gateway افتراضيًا
- تثبيتات مديري الحزم تحدّث الحزمة، وتشغّل تمريرة doctor غير تفاعلية، ثم تعتمد على إعادة تشغيل gateway الافتراضية حتى يتمكن بدء التشغيل من إنهاء ترحيل Matrix
- إذا استخدمت `openclaw update --no-restart`، فسيُؤجَّل ترحيل Matrix المعتمد على بدء التشغيل إلى أن تشغّل لاحقًا `openclaw doctor --fix` وتعيد تشغيل gateway

يغطي الترحيل التلقائي ما يلي:

- إنشاء أو إعادة استخدام لقطة ما قبل الترحيل تحت `~/Backups/openclaw-migrations/`
- إعادة استخدام بيانات اعتماد Matrix المخزنة مؤقتًا
- الإبقاء على اختيار الحساب نفسه وإعداد `channels.matrix`
- نقل أقدم مخزن مزامنة Matrix المسطح إلى الموقع الحالي المحدد بالنطاق لكل حساب
- نقل أقدم مخزن تشفير Matrix المسطح إلى الموقع الحالي المحدد بالنطاق لكل حساب عندما يمكن تحليل الحساب الهدف بأمان
- استخراج مفتاح فك تشفير النسخة الاحتياطية لمفاتيح غرف Matrix المحفوظ سابقًا من مخزن rust crypto القديم، عندما يكون هذا المفتاح موجودًا محليًا
- إعادة استخدام جذر تخزين تجزئة token الأكثر اكتمالًا الموجود لنفس حساب Matrix والخادم المنزلي والمستخدم عندما يتغير access token لاحقًا
- فحص جذور تخزين تجزئة token الشقيقة بحثًا عن بيانات وصفية معلقة لاستعادة الحالة المشفرة عندما يتغير access token الخاص بـ Matrix لكن تبقى هوية الحساب/الجهاز نفسها
- استعادة مفاتيح الغرف الاحتياطية إلى مخزن التشفير الجديد عند بدء تشغيل Matrix التالي

تفاصيل اللقطة:

- يكتب OpenClaw ملف واسم في `~/.openclaw/matrix/migration-snapshot.json` بعد إنشاء لقطة ناجحة حتى تتمكن تمريرات بدء التشغيل والإصلاح اللاحقة من إعادة استخدام الأرشيف نفسه.
- تقوم لقطات ترحيل Matrix التلقائية هذه بعمل نسخة احتياطية من الإعداد + الحالة فقط (`includeWorkspace: false`).
- إذا كانت Matrix تحتوي فقط على حالة ترحيل على مستوى التحذير، مثل غياب `userId` أو `accessToken`، فلن ينشئ OpenClaw اللقطة بعد لأن أي تعديل على Matrix غير قابل للتنفيذ بعد.
- إذا فشلت خطوة اللقطة، فسيتخطى OpenClaw ترحيل Matrix في تلك الجولة بدلًا من تعديل الحالة من دون نقطة استعادة.

حول الترقيات متعددة الحسابات:

- جاء مخزن Matrix المسطح الأقدم (`~/.openclaw/matrix/bot-storage.json` و`~/.openclaw/matrix/crypto/`) من تخطيط مخزن واحد، لذلك لا يستطيع OpenClaw ترحيله إلا إلى هدف حساب Matrix محلول واحد
- يتم اكتشاف مخازن Matrix القديمة المحددة بالنطاق للحسابات بالفعل وتجهيزها لكل حساب Matrix مُعدّ

## ما الذي لا يستطيع الترحيل فعله تلقائيًا

لم يكن Plugin العام السابق لـ Matrix **ينشئ تلقائيًا** نسخًا احتياطية من مفاتيح غرف Matrix. فقد كان يحفظ حالة التشفير المحلية ويطلب التحقق من الجهاز، لكنه لم يضمن أن مفاتيح غرفك كانت مدعومة احتياطيًا على الخادم المنزلي.

وهذا يعني أن بعض التثبيتات المشفرة لا يمكن ترحيلها إلا جزئيًا.

لا يستطيع OpenClaw استعادة ما يلي تلقائيًا:

- مفاتيح الغرف المحلية فقط التي لم تُدعَم احتياطيًا مطلقًا
- الحالة المشفرة عندما لا يمكن تحليل حساب Matrix الهدف بعد بسبب عدم توفر `homeserver` أو `userId` أو `accessToken`
- الترحيل التلقائي لمخزن Matrix مسطح مشترك واحد عندما تكون عدة حسابات Matrix مُعدّة لكن `channels.matrix.defaultAccount` غير مضبوط
- تثبيتات مسارات Plugin المخصصة المثبّتة على مسار مستودع بدل حزمة Matrix القياسية
- مفتاح استعادة مفقود عندما كان المخزن القديم يحتوي على مفاتيح مدعومة احتياطيًا لكنه لم يحتفظ بمفتاح فك التشفير محليًا

نطاق التحذير الحالي:

- تظهر تثبيتات مسار Plugin Matrix المخصصة في كل من بدء تشغيل gateway و`openclaw doctor`

إذا كان تثبيتك القديم يحتوي على سجل مشفر محلي فقط ولم يُدعَم احتياطيًا مطلقًا، فقد تظل بعض الرسائل المشفرة الأقدم غير قابلة للقراءة بعد الترقية.

## تدفق الترقية الموصى به

1. حدّث OpenClaw وPlugin Matrix بشكل عادي.
   فضّل استخدام `openclaw update` العادي من دون `--no-restart` حتى يتمكن بدء التشغيل من إنهاء ترحيل Matrix فورًا.
2. شغّل:

   ```bash
   openclaw doctor --fix
   ```

   إذا كان لدى Matrix عمل ترحيل قابل للتنفيذ، فسيقوم doctor أولًا بإنشاء لقطة ما قبل الترحيل أو إعادة استخدامها ثم يطبع مسار الأرشيف.

3. ابدأ أو أعد تشغيل gateway.
4. تحقق من حالة التحقق والنسخ الاحتياطي الحالية:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. إذا أخبرك OpenClaw بأن مفتاح استعادة مطلوب، فشغّل:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. إذا كان هذا الجهاز ما يزال غير موثّق، فشغّل:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

7. إذا كنت تتخلى عمدًا عن السجل القديم غير القابل للاستعادة وتريد خط أساس جديدًا للنسخ الاحتياطي للرسائل المستقبلية، فشغّل:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. إذا لم توجد بعد نسخة احتياطية لمفاتيح الخادم، فأنشئ واحدة من أجل عمليات الاستعادة المستقبلية:

   ```bash
   openclaw matrix verify bootstrap
   ```

## كيف يعمل ترحيل التشفير

ترحيل التشفير هو عملية من مرحلتين:

1. يقوم بدء التشغيل أو `openclaw doctor --fix` بإنشاء لقطة ما قبل الترحيل أو إعادة استخدامها إذا كان ترحيل التشفير قابلًا للتنفيذ.
2. يقوم بدء التشغيل أو `openclaw doctor --fix` بفحص مخزن تشفير Matrix القديم من خلال تثبيت Plugin Matrix النشط.
3. إذا وُجد مفتاح فك تشفير النسخة الاحتياطية، يكتب OpenClaw هذا المفتاح في تدفق مفتاح الاستعادة الجديد ويضع علامة على أن استعادة مفاتيح الغرف معلقة.
4. عند بدء تشغيل Matrix التالي، يستعيد OpenClaw مفاتيح الغرف الاحتياطية إلى مخزن التشفير الجديد تلقائيًا.

إذا أبلغ المخزن القديم عن مفاتيح غرف لم تُدعَم احتياطيًا مطلقًا، فسيحذر OpenClaw بدلًا من الادعاء بأن الاستعادة نجحت.

## الرسائل الشائعة وما الذي تعنيه

### رسائل الترقية والاكتشاف

`Matrix plugin upgraded in place.`

- المعنى: تم اكتشاف حالة Matrix القديمة على القرص وترحيلها إلى التخطيط الحالي.
- ما الذي يجب فعله: لا شيء إلا إذا كانت المخرجات نفسها تتضمن أيضًا تحذيرات.

`Matrix migration snapshot created before applying Matrix upgrades.`

- المعنى: أنشأ OpenClaw أرشيف استعادة قبل تعديل حالة Matrix.
- ما الذي يجب فعله: احتفظ بمسار الأرشيف المطبوع حتى تتأكد من نجاح الترحيل.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- المعنى: وجد OpenClaw واسم لقطة ترحيل Matrix موجودًا بالفعل وأعاد استخدام ذلك الأرشيف بدلًا من إنشاء نسخة احتياطية مكررة.
- ما الذي يجب فعله: احتفظ بمسار الأرشيف المطبوع حتى تتأكد من نجاح الترحيل.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- المعنى: توجد حالة Matrix قديمة، لكن OpenClaw لا يستطيع ربطها بحساب Matrix حالي لأن Matrix غير مُعدّة.
- ما الذي يجب فعله: اضبط `channels.matrix`، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- المعنى: وجد OpenClaw حالة قديمة، لكنه لا يزال غير قادر على تحديد جذر الحساب/الجهاز الحالي الدقيق.
- ما الذي يجب فعله: ابدأ gateway مرة واحدة باستخدام تسجيل دخول Matrix عامل، أو أعد تشغيل `openclaw doctor --fix` بعد وجود بيانات الاعتماد المخزنة مؤقتًا.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- المعنى: وجد OpenClaw مخزن Matrix مسطحًا مشتركًا واحدًا، لكنه يرفض التخمين أي حساب Matrix مسمى يجب أن يستلمه.
- ما الذي يجب فعله: اضبط `channels.matrix.defaultAccount` على الحساب المقصود، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- المعنى: يحتوي الموقع الجديد المحدد بالنطاق للحساب بالفعل على مخزن مزامنة أو تشفير، لذلك لم يقم OpenClaw بالكتابة فوقه تلقائيًا.
- ما الذي يجب فعله: تحقق من أن الحساب الحالي هو الحساب الصحيح قبل إزالة أو نقل الهدف المتعارض يدويًا.

`Failed migrating Matrix legacy sync store (...)` أو `Failed migrating Matrix legacy crypto store (...)`

- المعنى: حاول OpenClaw نقل حالة Matrix القديمة لكن عملية نظام الملفات فشلت.
- ما الذي يجب فعله: افحص أذونات نظام الملفات وحالة القرص، ثم أعد تشغيل `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- المعنى: وجد OpenClaw مخزن Matrix مشفرًا قديمًا، لكن لا يوجد إعداد Matrix حالي لإرفاقه به.
- ما الذي يجب فعله: اضبط `channels.matrix`، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- المعنى: يوجد المخزن المشفر، لكن OpenClaw لا يستطيع أن يقرر بأمان إلى أي حساب/جهاز حالي ينتمي.
- ما الذي يجب فعله: ابدأ gateway مرة واحدة باستخدام تسجيل دخول Matrix عامل، أو أعد تشغيل `openclaw doctor --fix` بعد توفر بيانات الاعتماد المخزنة مؤقتًا.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- المعنى: وجد OpenClaw مخزن تشفير قديمًا مسطحًا مشتركًا واحدًا، لكنه يرفض التخمين أي حساب Matrix مسمى يجب أن يستلمه.
- ما الذي يجب فعله: اضبط `channels.matrix.defaultAccount` على الحساب المقصود، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- المعنى: اكتشف OpenClaw حالة Matrix قديمة، لكن الترحيل ما يزال محجوبًا بسبب غياب بيانات الهوية أو بيانات الاعتماد.
- ما الذي يجب فعله: أكمل تسجيل دخول Matrix أو إعدادها، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- المعنى: وجد OpenClaw حالة Matrix مشفرة قديمة، لكنه لم يتمكن من تحميل نقطة دخول المساعد من Plugin Matrix التي تفحص هذا المخزن عادةً.
- ما الذي يجب فعله: أعد تثبيت أو إصلاح Plugin Matrix (`openclaw plugins install @openclaw/matrix`، أو `openclaw plugins install ./path/to/local/matrix-plugin` لنسخة مستودع)، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- المعنى: وجد OpenClaw مسار ملف مساعد يهرب من جذر Plugin أو يفشل في فحوص حدود Plugin، لذلك رفض استيراده.
- ما الذي يجب فعله: أعد تثبيت Plugin Matrix من مسار موثوق، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- المعنى: رفض OpenClaw تعديل حالة Matrix لأنه لم يتمكن أولًا من إنشاء لقطة الاستعادة.
- ما الذي يجب فعله: أصلح خطأ النسخ الاحتياطي، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل gateway.

`Failed migrating legacy Matrix client storage: ...`

- المعنى: وجد المسار الاحتياطي على جانب عميل Matrix تخزينًا مسطحًا قديمًا، لكن النقل فشل. ويقوم OpenClaw الآن بإيقاف هذا المسار الاحتياطي بدلًا من البدء بصمت باستخدام مخزن جديد.
- ما الذي يجب فعله: افحص أذونات نظام الملفات أو التعارضات، واحتفظ بالحالة القديمة سليمة، ثم أعد المحاولة بعد إصلاح الخطأ.

`Matrix is installed from a custom path: ...`

- المعنى: تم تثبيت Matrix من مسار مخصص، لذا لا تستبدلها التحديثات الرئيسية تلقائيًا بحزمة Matrix القياسية الخاصة بالمستودع.
- ما الذي يجب فعله: أعد التثبيت باستخدام `openclaw plugins install @openclaw/matrix` عندما تريد العودة إلى Plugin Matrix الافتراضية.

### رسائل استعادة الحالة المشفرة

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- المعنى: تمت استعادة مفاتيح الغرف المدعومة احتياطيًا بنجاح إلى مخزن التشفير الجديد.
- ما الذي يجب فعله: عادةً لا شيء.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- المعنى: كانت بعض مفاتيح الغرف القديمة موجودة فقط في المخزن المحلي القديم ولم تُرفع أبدًا إلى النسخ الاحتياطي الخاصة بـ Matrix.
- ما الذي يجب فعله: توقّع أن يبقى بعض السجل المشفر القديم غير متاح ما لم تتمكن من استعادة تلك المفاتيح يدويًا من عميل Matrix آخر موثَّق.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- المعنى: توجد نسخة احتياطية، لكن OpenClaw لم يتمكن من استعادة مفتاح الاستعادة تلقائيًا.
- ما الذي يجب فعله: شغّل `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- المعنى: وجد OpenClaw المخزن المشفر القديم، لكنه لم يتمكن من فحصه بأمان كافٍ لتجهيز الاستعادة.
- ما الذي يجب فعله: أعد تشغيل `openclaw doctor --fix`. وإذا تكرر الأمر، فأبقِ دليل الحالة القديم سليمًا واستعد باستخدام عميل Matrix آخر موثَّق بالإضافة إلى `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- المعنى: اكتشف OpenClaw تعارضًا في مفتاح النسخ الاحتياطي ورفض الكتابة فوق ملف recovery-key الحالي تلقائيًا.
- ما الذي يجب فعله: تحقق من أي مفتاح استعادة هو الصحيح قبل إعادة محاولة أي أمر استعادة.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- المعنى: هذا هو الحد الصلب لتنسيق التخزين القديم.
- ما الذي يجب فعله: لا يزال بالإمكان استعادة المفاتيح المدعومة احتياطيًا، لكن السجل المشفر المحلي فقط قد يظل غير متاح.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- المعنى: حاول الـ Plugin الجديد الاستعادة لكن Matrix أعادت خطأ.
- ما الذي يجب فعله: شغّل `openclaw matrix verify backup status`، ثم أعد المحاولة باستخدام `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` إذا لزم الأمر.

### رسائل الاستعادة اليدوية

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- المعنى: يعرف OpenClaw أنه يجب أن يكون لديك مفتاح نسخ احتياطي، لكنه غير نشط على هذا الجهاز.
- ما الذي يجب فعله: شغّل `openclaw matrix verify backup restore`، أو مرّر `--recovery-key` إذا لزم الأمر.

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- المعنى: لا يحتوي هذا الجهاز حاليًا على مفتاح الاستعادة مخزنًا.
- ما الذي يجب فعله: تحقّق من الجهاز باستخدام مفتاح الاستعادة أولًا، ثم استعد النسخة الاحتياطية.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- المعنى: المفتاح المخزن لا يطابق النسخة الاحتياطية النشطة في Matrix.
- ما الذي يجب فعله: أعد تشغيل `openclaw matrix verify device "<your-recovery-key>"` باستخدام المفتاح الصحيح.

إذا كنت تقبل فقدان السجل المشفر القديم غير القابل للاستعادة، فيمكنك بدلًا من ذلك إعادة ضبط
خط أساس النسخ الاحتياطي الحالي باستخدام `openclaw matrix verify backup reset --yes`. وعندما يكون
سر النسخ الاحتياطي المخزن معطّلًا، فقد تؤدي إعادة الضبط هذه أيضًا إلى إعادة إنشاء التخزين السري حتى
يتمكن مفتاح النسخ الاحتياطي الجديد من التحميل بشكل صحيح بعد إعادة التشغيل.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- المعنى: النسخة الاحتياطية موجودة، لكن هذا الجهاز لا يثق بعد بسلسلة cross-signing بدرجة كافية.
- ما الذي يجب فعله: أعد تشغيل `openclaw matrix verify device "<your-recovery-key>"`.

`Matrix recovery key is required`

- المعنى: حاولت تنفيذ خطوة استعادة من دون تقديم مفتاح استعادة رغم أنه مطلوب.
- ما الذي يجب فعله: أعد تشغيل الأمر مع مفتاح الاستعادة الخاص بك.

`Invalid Matrix recovery key: ...`

- المعنى: تعذر تحليل المفتاح المقدم أو لم يطابق التنسيق المتوقع.
- ما الذي يجب فعله: أعد المحاولة باستخدام مفتاح الاستعادة الدقيق من عميل Matrix أو من ملف recovery-key.

`Matrix device is still unverified after applying recovery key. Verify your recovery key and ensure cross-signing is available.`

- المعنى: تم تطبيق المفتاح، لكن الجهاز لم يتمكن بعد من إكمال التحقق.
- ما الذي يجب فعله: تأكد من أنك استخدمت المفتاح الصحيح وأن cross-signing متاحة على الحساب، ثم أعد المحاولة.

`Matrix key backup is not active on this device after loading from secret storage.`

- المعنى: لم ينتج التخزين السري جلسة نسخ احتياطي نشطة على هذا الجهاز.
- ما الذي يجب فعله: تحقّق من الجهاز أولًا، ثم أعد الفحص باستخدام `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- المعنى: لا يستطيع هذا الجهاز الاستعادة من التخزين السري حتى يكتمل التحقق من الجهاز.
- ما الذي يجب فعله: شغّل `openclaw matrix verify device "<your-recovery-key>"` أولًا.

### رسائل تثبيت Plugin المخصص

`Matrix is installed from a custom path that no longer exists: ...`

- المعنى: يشير سجل تثبيت Plugin لديك إلى مسار محلي لم يعد موجودًا.
- ما الذي يجب فعله: أعد التثبيت باستخدام `openclaw plugins install @openclaw/matrix`، أو إذا كنت تعمل من نسخة مستودع، فاستخدم `openclaw plugins install ./path/to/local/matrix-plugin`.

## إذا لم يعد السجل المشفر بعد

شغّل هذه الفحوصات بالترتيب:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

إذا تمت استعادة النسخة الاحتياطية بنجاح ولكن بعض الغرف القديمة ما تزال تفتقد إلى السجل، فمن المحتمل أن تلك المفاتيح المفقودة لم تُدعَم احتياطيًا أبدًا بواسطة Plugin السابقة.

## إذا كنت تريد البدء من جديد للرسائل المستقبلية

إذا كنت تقبل فقدان السجل المشفر القديم غير القابل للاستعادة وتريد فقط خط أساس نظيفًا للنسخ الاحتياطي في المستقبل، فشغّل هذه الأوامر بالترتيب:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

إذا ظل الجهاز غير موثّق بعد ذلك، فأكمل التحقق من عميل Matrix الخاص بك عبر مقارنة SAS emoji أو الرموز العشرية والتأكد من تطابقها.

## صفحات ذات صلة

- [Matrix](/ar/channels/matrix)
- [Doctor](/ar/gateway/doctor)
- [الترحيل](/ar/install/migrating)
- [Plugins](/ar/tools/plugin)
