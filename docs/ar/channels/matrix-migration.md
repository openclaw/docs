---
read_when:
    - ترقية تثبيت Matrix قائم
    - ترحيل سجل Matrix المشفّر وحالة الجهاز
summary: كيف يرقّي OpenClaw Plugin Matrix السابق في موضعه، بما في ذلك حدود استرداد الحالة المشفّرة وخطوات الاسترداد اليدوي.
title: ترحيل Matrix
x-i18n:
    generated_at: "2026-04-30T07:41:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: fff409eef1b7da7be4b63d8459a62b8365a04adf989f271a2f2c4aef46e90716
    source_path: channels/matrix-migration.md
    workflow: 16
---

قم بالترقية من Plugin `matrix` العامة السابقة إلى التنفيذ الحالي.

بالنسبة إلى معظم المستخدمين، تتم الترقية في مكانها:

- يبقى Plugin باسم `@openclaw/matrix`
- تبقى القناة `matrix`
- يبقى إعدادك ضمن `channels.matrix`
- تبقى بيانات الاعتماد المخزنة مؤقتًا ضمن `~/.openclaw/credentials/matrix/`
- تبقى حالة وقت التشغيل ضمن `~/.openclaw/matrix/`

لا تحتاج إلى إعادة تسمية مفاتيح الإعداد أو إعادة تثبيت Plugin باسم جديد.

## ما الذي تنفذه الهجرة تلقائيًا

عند بدء Gateway، وعند تشغيل [`openclaw doctor --fix`](/ar/gateway/doctor)، يحاول OpenClaw إصلاح حالة Matrix القديمة تلقائيًا.
قبل أن تؤدي أي خطوة هجرة Matrix قابلة للتنفيذ إلى تعديل الحالة على القرص، ينشئ OpenClaw لقطة استرداد مركزة أو يعيد استخدامها.

عند استخدام `openclaw update`، يعتمد المشغّل الدقيق على طريقة تثبيت OpenClaw:

- تثبيتات المصدر تشغّل `openclaw doctor --fix` أثناء تدفق التحديث، ثم تعيد تشغيل Gateway افتراضيًا
- تثبيتات مدير الحزم تحدّث الحزمة، وتشغّل تمريرة doctor غير تفاعلية، ثم تعتمد على إعادة تشغيل Gateway الافتراضية حتى يتمكن بدء التشغيل من إنهاء هجرة Matrix
- إذا استخدمت `openclaw update --no-restart`، فسيتم تأجيل هجرة Matrix المدعومة ببدء التشغيل إلى أن تشغّل لاحقًا `openclaw doctor --fix` وتعيد تشغيل Gateway

تشمل الهجرة التلقائية:

- إنشاء لقطة ما قبل الهجرة أو إعادة استخدامها ضمن `~/Backups/openclaw-migrations/`
- إعادة استخدام بيانات اعتماد Matrix المخزنة مؤقتًا لديك
- الاحتفاظ باختيار الحساب نفسه وإعداد `channels.matrix`
- نقل أقدم مخزن مزامنة Matrix مسطح إلى الموقع الحالي المحدد بنطاق الحساب
- نقل أقدم مخزن تشفير Matrix مسطح إلى الموقع الحالي المحدد بنطاق الحساب عندما يمكن حل الحساب الهدف بأمان
- استخراج مفتاح فك تشفير نسخة احتياطية لمفاتيح غرف Matrix محفوظ سابقًا من مخزن تشفير rust القديم، عندما يكون ذلك المفتاح موجودًا محليًا
- إعادة استخدام جذر تخزين تجزئة الرمز الأكثر اكتمالًا للحساب نفسه في Matrix وخادم homeserver والمستخدم نفسه عند تغيير رمز الوصول لاحقًا
- فحص جذور تخزين تجزئة الرمز الشقيقة بحثًا عن بيانات وصفية معلّقة لاستعادة الحالة المشفرة عندما يتغير رمز وصول Matrix لكن تبقى هوية الحساب/الجهاز كما هي
- استعادة مفاتيح الغرف المنسوخة احتياطيًا إلى مخزن التشفير الجديد عند بدء تشغيل Matrix التالي

تفاصيل اللقطة:

- يكتب OpenClaw ملف علامة في `~/.openclaw/matrix/migration-snapshot.json` بعد نجاح اللقطة حتى تتمكن تمريرات بدء التشغيل والإصلاح اللاحقة من إعادة استخدام الأرشيف نفسه.
- تنسخ لقطات هجرة Matrix التلقائية هذه الإعداد + الحالة فقط (`includeWorkspace: false`).
- إذا كانت لدى Matrix حالة هجرة تحذيرية فقط، مثلًا لأن `userId` أو `accessToken` لا يزال مفقودًا، لا ينشئ OpenClaw اللقطة بعد لأنه لا يوجد تعديل Matrix قابل للتنفيذ.
- إذا فشلت خطوة اللقطة، يتجاوز OpenClaw هجرة Matrix لذلك التشغيل بدلًا من تعديل الحالة دون نقطة استرداد.

حول ترقيات الحسابات المتعددة:

- أقدم مخزن Matrix مسطح (`~/.openclaw/matrix/bot-storage.json` و`~/.openclaw/matrix/crypto/`) جاء من تخطيط مخزن واحد، لذلك لا يستطيع OpenClaw هجرته إلا إلى هدف حساب Matrix واحد محلول
- يتم اكتشاف مخازن Matrix القديمة المحددة بنطاق الحساب مسبقًا وتجهيزها لكل حساب Matrix مضبوط

## ما الذي لا يمكن للهجرة تنفيذه تلقائيًا

لم تكن Plugin Matrix العامة السابقة تنشئ تلقائيًا نسخًا احتياطية لمفاتيح غرف Matrix. كانت تحفظ حالة التشفير المحلية وتطلب التحقق من الجهاز، لكنها لم تضمن نسخ مفاتيح غرفك احتياطيًا إلى homeserver.

يعني ذلك أن بعض التثبيتات المشفرة لا يمكن هجرتها إلا جزئيًا.

لا يستطيع OpenClaw استرداد ما يلي تلقائيًا:

- مفاتيح الغرف المحلية فقط التي لم يتم نسخها احتياطيًا مطلقًا
- الحالة المشفرة عندما لا يمكن حل حساب Matrix الهدف بعد لأن `homeserver` أو `userId` أو `accessToken` لا تزال غير متاحة
- الهجرة التلقائية لمخزن Matrix مسطح مشترك واحد عندما تكون عدة حسابات Matrix مضبوطة لكن `channels.matrix.defaultAccount` غير معيّن
- تثبيتات مسار Plugin المخصصة المثبتة على مسار مستودع بدلًا من حزمة Matrix القياسية
- مفتاح استرداد مفقود عندما كان المخزن القديم يحتوي على مفاتيح منسوخة احتياطيًا لكنه لم يحتفظ بمفتاح فك التشفير محليًا

نطاق التحذير الحالي:

- يتم إظهار تثبيتات مسار Plugin Matrix المخصصة بواسطة بدء تشغيل Gateway و`openclaw doctor`

إذا كانت تثبيتك القديم يحتوي على سجل مشفر محلي فقط لم يتم نسخه احتياطيًا مطلقًا، فقد تبقى بعض الرسائل المشفرة الأقدم غير قابلة للقراءة بعد الترقية.

## تدفق الترقية الموصى به

1. حدّث OpenClaw وPlugin Matrix بشكل عادي.
   فضّل استخدام `openclaw update` العادي دون `--no-restart` حتى يتمكن بدء التشغيل من إنهاء هجرة Matrix فورًا.
2. شغّل:

   ```bash
   openclaw doctor --fix
   ```

   إذا كانت لدى Matrix أعمال هجرة قابلة للتنفيذ، سينشئ doctor لقطة ما قبل الهجرة أو يعيد استخدامها أولًا ويطبع مسار الأرشيف.

3. ابدأ Gateway أو أعد تشغيله.
4. تحقق من حالة التحقق والنسخ الاحتياطي الحالية:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. ضع مفتاح الاسترداد لحساب Matrix الذي تصلحه في متغير بيئة خاص بالحساب. لحساب افتراضي واحد، يكون `MATRIX_RECOVERY_KEY` مناسبًا. للحسابات المتعددة، استخدم متغيرًا واحدًا لكل حساب، مثل `MATRIX_RECOVERY_KEY_ASSISTANT`، وأضف `--account assistant` إلى الأمر.

6. إذا أخبرك OpenClaw بأن مفتاح استرداد مطلوب، فشغّل الأمر للحساب المطابق:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. إذا كان هذا الجهاز لا يزال غير موثّق، فشغّل الأمر للحساب المطابق:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   إذا تم قبول مفتاح الاسترداد وكانت النسخة الاحتياطية قابلة للاستخدام، لكن `Cross-signing verified`
   لا يزال `no`، فأكمل التحقق الذاتي من عميل Matrix آخر:

   ```bash
   openclaw matrix verify self
   ```

   اقبل الطلب في عميل Matrix آخر، وقارن الرموز التعبيرية أو الكسور العشرية،
   واكتب `yes` فقط عندما تتطابق. يخرج الأمر بنجاح فقط
   بعد أن تصبح قيمة `Cross-signing verified` هي `yes`.

8. إذا كنت تتخلى عمدًا عن السجل القديم غير القابل للاسترداد وتريد أساسًا جديدًا للنسخ الاحتياطي للرسائل المستقبلية، فشغّل:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. إذا لم تكن هناك نسخة احتياطية للمفاتيح على جانب الخادم بعد، فأنشئ واحدة للاستردادات المستقبلية:

   ```bash
   openclaw matrix verify bootstrap
   ```

## كيف تعمل هجرة التشفير

هجرة التشفير عملية من مرحلتين:

1. ينشئ بدء التشغيل أو `openclaw doctor --fix` لقطة ما قبل الهجرة أو يعيد استخدامها إذا كانت هجرة التشفير قابلة للتنفيذ.
2. يفحص بدء التشغيل أو `openclaw doctor --fix` مخزن تشفير Matrix القديم عبر تثبيت Plugin Matrix النشط.
3. إذا تم العثور على مفتاح فك تشفير نسخة احتياطية، يكتبه OpenClaw في تدفق مفتاح الاسترداد الجديد ويعلّم استعادة مفاتيح الغرف بأنها معلّقة.
4. عند بدء تشغيل Matrix التالي، يستعيد OpenClaw مفاتيح الغرف المنسوخة احتياطيًا إلى مخزن التشفير الجديد تلقائيًا.

إذا أبلغ المخزن القديم عن مفاتيح غرف لم يتم نسخها احتياطيًا مطلقًا، يحذّر OpenClaw بدلًا من الادعاء بأن الاسترداد نجح.

## الرسائل الشائعة وما تعنيه

### رسائل الترقية والاكتشاف

`Matrix plugin upgraded in place.`

- المعنى: تم اكتشاف حالة Matrix القديمة على القرص وهجرتها إلى التخطيط الحالي.
- ما يجب فعله: لا شيء ما لم يتضمن الخرج نفسه تحذيرات أيضًا.

`Matrix migration snapshot created before applying Matrix upgrades.`

- المعنى: أنشأ OpenClaw أرشيف استرداد قبل تعديل حالة Matrix.
- ما يجب فعله: احتفظ بمسار الأرشيف المطبوع إلى أن تؤكد نجاح الهجرة.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- المعنى: وجد OpenClaw علامة لقطة هجرة Matrix موجودة وأعاد استخدام ذلك الأرشيف بدلًا من إنشاء نسخة احتياطية مكررة.
- ما يجب فعله: احتفظ بمسار الأرشيف المطبوع إلى أن تؤكد نجاح الهجرة.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- المعنى: توجد حالة Matrix قديمة، لكن OpenClaw لا يستطيع ربطها بحساب Matrix حالي لأن Matrix غير مضبوطة.
- ما يجب فعله: اضبط `channels.matrix`، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل Gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- المعنى: وجد OpenClaw حالة قديمة، لكنه لا يزال لا يستطيع تحديد جذر الحساب/الجهاز الحالي الدقيق.
- ما يجب فعله: ابدأ Gateway مرة واحدة بتسجيل دخول Matrix عامل، أو أعد تشغيل `openclaw doctor --fix` بعد وجود بيانات الاعتماد المخزنة مؤقتًا.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- المعنى: وجد OpenClaw مخزن Matrix مسطحًا مشتركًا واحدًا، لكنه يرفض تخمين أي حساب Matrix مسمى يجب أن يستلمه.
- ما يجب فعله: عيّن `channels.matrix.defaultAccount` إلى الحساب المقصود، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل Gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- المعنى: الموقع الجديد المحدد بنطاق الحساب يحتوي بالفعل على مخزن مزامنة أو تشفير، لذلك لم يستبدله OpenClaw تلقائيًا.
- ما يجب فعله: تحقق من أن الحساب الحالي هو الصحيح قبل إزالة الهدف المتعارض أو نقله يدويًا.

`Failed migrating Matrix legacy sync store (...)` أو `Failed migrating Matrix legacy crypto store (...)`

- المعنى: حاول OpenClaw نقل حالة Matrix القديمة لكن عملية نظام الملفات فشلت.
- ما يجب فعله: افحص أذونات نظام الملفات وحالة القرص، ثم أعد تشغيل `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- المعنى: وجد OpenClaw مخزن Matrix مشفرًا قديمًا، لكن لا يوجد إعداد Matrix حالي لإرفاقه به.
- ما يجب فعله: اضبط `channels.matrix`، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل Gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- المعنى: يوجد المخزن المشفر، لكن OpenClaw لا يستطيع بأمان تحديد أي حساب/جهاز حالي ينتمي إليه.
- ما يجب فعله: ابدأ Gateway مرة واحدة بتسجيل دخول Matrix عامل، أو أعد تشغيل `openclaw doctor --fix` بعد توفر بيانات الاعتماد المخزنة مؤقتًا.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- المعنى: وجد OpenClaw مخزن تشفير قديمًا مسطحًا مشتركًا واحدًا، لكنه يرفض تخمين أي حساب Matrix مسمى يجب أن يستلمه.
- ما يجب فعله: عيّن `channels.matrix.defaultAccount` إلى الحساب المقصود، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل Gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- المعنى: اكتشف OpenClaw حالة Matrix قديمة، لكن الهجرة لا تزال محظورة بسبب بيانات هوية أو بيانات اعتماد مفقودة.
- ما يجب فعله: أكمل تسجيل الدخول إلى Matrix أو إعداد الضبط، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل Gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- المعنى: عثر OpenClaw على حالة Matrix مشفرة قديمة، لكنه لم يتمكن من تحميل نقطة دخول المساعد من Matrix Plugin التي تفحص ذلك المخزن عادة.
- ما العمل: أعد تثبيت Matrix Plugin أو أصلحه (`openclaw plugins install @openclaw/matrix`، أو `openclaw plugins install ./path/to/local/matrix-plugin` عند استخدام نسخة repo checkout)، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل Gateway.
- إذا أبلغ npm أن حزمة Matrix المملوكة لـ OpenClaw مهملة، فاستخدم Plugin المضمن
  من بناء OpenClaw حالي محزم أو مسار checkout المحلي إلى أن
  تُنشر حزمة npm أحدث.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- المعنى: عثر OpenClaw على مسار ملف مساعد يخرج من جذر Plugin أو يفشل في فحوصات حدود Plugin، لذلك رفض استيراده.
- ما العمل: أعد تثبيت Matrix Plugin من مسار موثوق، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل Gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- المعنى: رفض OpenClaw تعديل حالة Matrix لأنه لم يتمكن من إنشاء لقطة الاسترداد أولا.
- ما العمل: عالج خطأ النسخ الاحتياطي، ثم أعد تشغيل `openclaw doctor --fix` أو أعد تشغيل Gateway.

`Failed migrating legacy Matrix client storage: ...`

- المعنى: عثر احتياط عميل Matrix الجانبي على تخزين مسطح قديم، لكن النقل فشل. يوقف OpenClaw الآن هذا الاحتياط بدلا من البدء صامتا بمخزن جديد.
- ما العمل: افحص أذونات نظام الملفات أو التعارضات، وأبق الحالة القديمة سليمة، ثم أعد المحاولة بعد إصلاح الخطأ.

`Matrix is installed from a custom path: ...`

- المعنى: Matrix مثبت على مسار محدد، لذلك لا تستبدله تحديثات الخط الرئيسي تلقائيا بحزمة Matrix القياسية في repo.
- ما العمل: أعد التثبيت باستخدام `openclaw plugins install @openclaw/matrix` عندما تريد الرجوع إلى Matrix Plugin الافتراضي.
- إذا أبلغ npm أن حزمة Matrix المملوكة لـ OpenClaw مهملة، فاستخدم Plugin المضمن
  من بناء OpenClaw حالي محزم إلى أن تُنشر حزمة npm أحدث.

### رسائل استرداد الحالة المشفرة

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- المعنى: تمت استعادة مفاتيح الغرف المنسوخة احتياطيا بنجاح إلى مخزن التشفير الجديد.
- ما العمل: لا شيء عادة.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- المعنى: كانت بعض مفاتيح الغرف القديمة موجودة فقط في المخزن المحلي القديم ولم تكن قد رُفعت قط إلى نسخ Matrix الاحتياطي.
- ما العمل: توقع أن يبقى بعض السجل المشفر القديم غير متاح إلا إذا تمكنت من استرداد تلك المفاتيح يدويا من عميل آخر موثوق.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- المعنى: النسخ الاحتياطي موجود، لكن OpenClaw لم يتمكن من استرداد مفتاح الاسترداد تلقائيا.
- ما العمل: شغّل `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- المعنى: عثر OpenClaw على المخزن المشفر القديم، لكنه لم يتمكن من فحصه بأمان كاف لتحضير الاسترداد.
- ما العمل: أعد تشغيل `openclaw doctor --fix`. إذا تكرر ذلك، فأبق دليل الحالة القديم سليما واسترده باستخدام عميل Matrix آخر موثوق مع `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- المعنى: اكتشف OpenClaw تعارضا في مفتاح النسخ الاحتياطي ورفض الكتابة فوق ملف مفتاح الاسترداد الحالي تلقائيا.
- ما العمل: تحقق من مفتاح الاسترداد الصحيح قبل إعادة محاولة أي أمر استعادة.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- المعنى: هذا هو الحد الصعب لتنسيق التخزين القديم.
- ما العمل: لا يزال من الممكن استرداد المفاتيح المنسوخة احتياطيا، لكن السجل المشفر المحلي فقط قد يبقى غير متاح.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- المعنى: حاول Plugin الجديد الاستعادة لكن Matrix أعاد خطأ.
- ما العمل: شغّل `openclaw matrix verify backup status`، ثم أعد المحاولة باستخدام `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` إذا لزم الأمر.

### رسائل الاسترداد اليدوي

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- المعنى: يعرف OpenClaw أنه ينبغي أن يكون لديك مفتاح نسخ احتياطي، لكنه غير نشط على هذا الجهاز.
- ما العمل: شغّل `openclaw matrix verify backup restore`، أو اضبط `MATRIX_RECOVERY_KEY` وشغّل `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` إذا لزم الأمر.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- المعنى: لا يحتوي هذا الجهاز حاليا على مفتاح الاسترداد مخزنا.
- ما العمل: اضبط `MATRIX_RECOVERY_KEY`، وشغّل `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`، ثم استعد النسخ الاحتياطي.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- المعنى: المفتاح المخزن لا يطابق نسخ Matrix الاحتياطي النشط.
- ما العمل: اضبط `MATRIX_RECOVERY_KEY` على المفتاح الصحيح وشغّل `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

إذا قبلت فقدان السجل المشفر القديم غير القابل للاسترداد، يمكنك بدلا من ذلك إعادة ضبط
خط أساس النسخ الاحتياطي الحالي باستخدام `openclaw matrix verify backup reset --yes`. عندما يكون
سر النسخ الاحتياطي المخزن معطوبا، قد تعيد عملية الضبط هذه أيضا إنشاء تخزين الأسرار حتى يتمكن
مفتاح النسخ الاحتياطي الجديد من التحميل بشكل صحيح بعد إعادة التشغيل.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- المعنى: النسخ الاحتياطي موجود، لكن هذا الجهاز لا يثق بسلسلة التوقيع المتقاطع بما يكفي بعد.
- ما العمل: اضبط `MATRIX_RECOVERY_KEY` وشغّل `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Matrix recovery key is required`

- المعنى: حاولت تنفيذ خطوة استرداد دون توفير مفتاح استرداد عندما كان مطلوبا.
- ما العمل: أعد تشغيل الأمر مع `--recovery-key-stdin`، مثلا `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- المعنى: تعذر تحليل المفتاح المقدم أو لم يطابق التنسيق المتوقع.
- ما العمل: أعد المحاولة باستخدام مفتاح الاسترداد الدقيق من عميل Matrix أو ملف مفتاح الاسترداد.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- المعنى: تمكن OpenClaw من تطبيق مفتاح الاسترداد، لكن Matrix لم
  ينشئ بعد ثقة هوية التوقيع المتقاطع الكاملة لهذا الجهاز. تحقق من
  مخرجات الأمر بحثا عن `Recovery key accepted` و`Backup usable`،
  و`Cross-signing verified`، و`Device verified by owner`.
- ما العمل: شغّل `openclaw matrix verify self`، واقبل الطلب في عميل
  Matrix آخر، وقارن SAS، واكتب `yes` فقط عندما يتطابق. ينتظر
  الأمر ثقة هوية Matrix الكاملة قبل الإبلاغ عن النجاح. استخدم
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  فقط عندما تريد عمدا استبدال هوية التوقيع المتقاطع الحالية.

`Matrix key backup is not active on this device after loading from secret storage.`

- المعنى: لم ينتج تخزين الأسرار جلسة نسخ احتياطي نشطة على هذا الجهاز.
- ما العمل: تحقق من الجهاز أولا، ثم أعد الفحص باستخدام `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- المعنى: لا يستطيع هذا الجهاز الاستعادة من تخزين الأسرار حتى يكتمل التحقق من الجهاز.
- ما العمل: شغّل `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` أولا.

### رسائل تثبيت Plugin مخصص

`Matrix is installed from a custom path that no longer exists: ...`

- المعنى: يشير سجل تثبيت Plugin لديك إلى مسار محلي لم يعد موجودا.
- ما العمل: أعد التثبيت باستخدام `openclaw plugins install @openclaw/matrix`، أو إذا كنت تعمل من نسخة repo checkout، فاستخدم `openclaw plugins install ./path/to/local/matrix-plugin`.
- إذا أبلغ npm أن حزمة Matrix المملوكة لـ OpenClaw مهملة، فاستخدم Plugin المضمن
  من بناء OpenClaw حالي محزم أو مسار checkout المحلي إلى أن
  تُنشر حزمة npm أحدث.

## إذا لم يعد السجل المشفر بعد

شغّل هذه الفحوصات بالترتيب:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

إذا تمت استعادة النسخ الاحتياطي بنجاح لكن بعض الغرف القديمة لا يزال سجلها مفقودا، فمن المحتمل أن تلك المفاتيح المفقودة لم ينسخها Plugin السابق احتياطيا قط.

## إذا كنت تريد البدء من جديد للرسائل المستقبلية

إذا قبلت فقدان السجل المشفر القديم غير القابل للاسترداد وتريد فقط خط أساس نسخ احتياطي نظيفا من الآن فصاعدا، فشغّل هذه الأوامر بالترتيب:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

إذا بقي الجهاز غير موثق بعد ذلك، فأكمل التحقق من عميل Matrix لديك بمقارنة رموز SAS التعبيرية أو الرموز العشرية والتأكيد على تطابقها.

## ذات صلة

- [Matrix](/ar/channels/matrix): إعداد القناة والتكوين.
- [قواعد دفع Matrix](/ar/channels/matrix-push-rules): توجيه الإشعارات.
- [Doctor](/ar/gateway/doctor): فحص الصحة ومشغل الترحيل التلقائي.
- [دليل الترحيل](/ar/install/migrating): جميع مسارات الترحيل (نقل الأجهزة، والاستيرادات عبر الأنظمة).
- [Plugins](/ar/tools/plugin): تثبيت Plugin وتسجيله.
