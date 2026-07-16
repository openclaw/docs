---
read_when:
    - ترقية تثبيت Matrix موجود بالفعل
    - ترحيل سجل Matrix المشفّر وحالة الجهاز
summary: كيفية ترقية OpenClaw لإضافة Matrix السابقة في موضعها، بما في ذلك حدود استعادة الحالة المشفّرة وخطوات الاستعادة اليدوية.
title: ترحيل Matrix
x-i18n:
    generated_at: "2026-07-16T13:33:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 33d5ac134338c8032ca1507ceee6eade2d37b3c86f0045fb883304ad208cd5e5
    source_path: channels/matrix-migration.md
    workflow: 16
---

الترقية من Plugin العام السابق `matrix` إلى التنفيذ الحالي.

بالنسبة إلى معظم المستخدمين، تتم الترقية في موضعها:

- يبقى Plugin هو `@openclaw/matrix`
- تبقى القناة هي `matrix`
- يبقى إعدادك ضمن `channels.matrix`
- تبقى بيانات الاعتماد المخزنة مؤقتًا ضمن `~/.openclaw/credentials/matrix/`
- تبقى حالة وقت التشغيل ضمن `~/.openclaw/matrix/`

لا تحتاج إلى إعادة تسمية مفاتيح الإعداد أو إعادة تثبيت Plugin باسم جديد.
لم تعد حزمة `openclaw` الجذرية تتضمن شيفرة وقت تشغيل Matrix أو تبعيات
Matrix SDK. إذا أظهر `openclaw channels status` أن Matrix مُعدّ، لكن
Plugin غير مثبت، فشغّل `openclaw doctor --fix` أو
`openclaw plugins install @openclaw/matrix`؛ ولا تثبّت حزم Matrix SDK
داخل حزمة OpenClaw الجذرية.

## ما الذي تنفذه عملية الترحيل تلقائيًا

يعمل ترحيل Matrix عند تشغيل [`openclaw doctor --fix`](/ar/gateway/doctor)، وكخيار احتياطي عند بدء عميل Matrix مع استمرار عثوره على حالة جانبية مستندة إلى الملفات بجوار مخزن SQLite الخاص به.

يشمل الترحيل التلقائي ما يلي:

- إعادة استخدام بيانات اعتماد Matrix المخزنة مؤقتًا
- الإبقاء على اختيار الحساب نفسه وإعداد `channels.matrix`
- استيراد الحالة الجانبية المستندة إلى الملفات (ذاكرة مزامنة `bot-storage.json` المؤقتة، و`recovery-key.json`، و`legacy-crypto-migration.json`، ولقطات IndexedDB) إلى حالة Matrix في SQLite؛ وتُؤرشف الملفات المُرحّلة باللاحقة `.migrated`
- إعادة استخدام جذر تخزين تجزئات الرموز الأكثر اكتمالًا للحساب وخادم المنازل والمستخدم والجهاز نفسه في Matrix عند تغيير رمز الوصول لاحقًا

## الترقية من إصدارات OpenClaw الأقدم من 2026.4

كانت الإصدارات حتى سلسلة 2026.6 ترحّل أيضًا تخطيط Matrix الأصلي المسطح ذي المخزن الواحد
(`~/.openclaw/matrix/bot-storage.json` بالإضافة إلى
`~/.openclaw/matrix/crypto/`)، وتُعِدّ استعادة الحالة المشفرة من
مخزن التشفير القديم المكتوب بلغة Rust. لم تعد الإصدارات الحالية تتضمن هذا الترحيل.

إذا كنت ترقي تثبيتًا لا يزال يستخدم التخطيط المسطح، فقم أولًا
بالترقية إلى إصدار من سلسلة 2026.6، وشغّل `openclaw doctor --fix`، ثم ابدأ Gateway
مرة واحدة كي يُرحَّل المخزن المسطح وأي مفاتيح غرف قابلة للاستعادة. بعد ذلك حدّث
إلى أحدث إصدار.

لم يكن Plugin العام السابق لـ Matrix ينشئ نسخًا احتياطية لمفاتيح غرف Matrix **تلقائيًا**. إذا كان تثبيتك القديم يحتوي على سجل مشفر محلي فقط لم يُنسخ احتياطيًا قط، فقد تظل بعض الرسائل المشفرة القديمة غير قابلة للقراءة بعد الترقية، بصرف النظر عن مسار الترحيل.

## مسار الترقية الموصى به

1. حدّث OpenClaw وPlugin Matrix بالطريقة المعتادة.
2. شغّل:

   ```bash
   openclaw doctor --fix
   ```

3. ابدأ Gateway أو أعد تشغيله.
4. تحقق من حالة التحقق والنسخ الاحتياطي الحالية:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. ضع مفتاح الاسترداد لحساب Matrix الذي تصلحه في متغير بيئة خاص بالحساب. بالنسبة إلى حساب افتراضي واحد، يكفي `MATRIX_RECOVERY_KEY`. وبالنسبة إلى حسابات متعددة، استخدم متغيرًا واحدًا لكل حساب، مثل `MATRIX_RECOVERY_KEY_ASSISTANT`، وأضف `--account assistant` إلى الأمر.

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

   إذا قُبل مفتاح الاسترداد وكانت النسخة الاحتياطية قابلة للاستخدام، لكن `Cross-signing verified`
   لا يزال `no`، فأكمل التحقق الذاتي من عميل Matrix آخر:

   ```bash
   openclaw matrix verify self
   ```

   اقبل الطلب في عميل Matrix آخر، وقارن الرموز التعبيرية أو الأرقام العشرية،
   واكتب `yes` فقط عند تطابقها. ينتظر الأمر اكتمال الثقة بهوية Matrix
   قبل الإبلاغ عن النجاح.

8. إذا كنت تتخلى عمدًا عن السجل القديم غير القابل للاستعادة وتريد خط أساس جديدًا للنسخ الاحتياطي للرسائل المستقبلية، فشغّل:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

   أضف `--rotate-recovery-key` فقط عندما ينبغي ألا يعود مفتاح الاسترداد القديم قادرًا على فتح النسخة الاحتياطية الجديدة.

9. إذا لم توجد نسخة احتياطية لمفاتيح الغرف على الخادم بعد، فأنشئ واحدة لعمليات الاسترداد المستقبلية:

   ```bash
   openclaw matrix verify bootstrap
   ```

## الرسائل الشائعة ومعانيها

`Failed migrating legacy Matrix client storage: ...`

- المعنى: عثر الخيار الاحتياطي من جهة عميل Matrix على حالة جانبية مستندة إلى الملفات، لكن استيرادها إلى SQLite فشل. يتراجع OpenClaw عن عمليات النقل المكتملة ويلغي هذا الخيار الاحتياطي بدلًا من البدء بصمت بمخزن جديد.
- ما يجب فعله: افحص أذونات نظام الملفات أو التعارضات، وأبقِ الحالة القديمة سليمة، ثم أعد المحاولة بعد إصلاح الخطأ.

`Matrix is installed from a custom path: ...`

- المعنى: ثُبّت Matrix على تثبيت قائم على مسار، ولذلك لا تستبدله تحديثات المسار الرئيسي تلقائيًا بحزمة Matrix الافتراضية.
- ما يجب فعله: أعد التثبيت باستخدام `openclaw plugins install @openclaw/matrix` عندما تريد العودة إلى Plugin Matrix الافتراضي.

`Matrix is installed from a custom path that no longer exists: ...`

- المعنى: يشير سجل تثبيت Plugin لديك إلى مسار محلي لم يعد موجودًا.
- ما يجب فعله: أعد التثبيت باستخدام `openclaw plugins install @openclaw/matrix`، أو باستخدام `openclaw plugins install ./path/to/local/matrix-plugin` إذا كنت تعمل من نسخة مستودع. ويمكن لـ `openclaw doctor --fix` أيضًا إزالة مراجع Plugin Matrix القديمة نيابةً عنك.

### رسائل الاسترداد اليدوي

يطبع `openclaw matrix verify status` و`openclaw matrix verify backup status` سطر `Backup issue:` بالإضافة إلى إرشادات `Next steps:` عندما لا تكون النسخة الاحتياطية لمفاتيح الغرف سليمة على هذا الجهاز:

| مشكلة النسخة الاحتياطية                                               | المعنى                                             | الإصلاح                                                                                                                                   |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `no room-key backup exists on the homeserver`                         | لا يوجد شيء يمكن الاستعادة منه                    | `openclaw matrix verify bootstrap` لإنشاء نسخة احتياطية لمفاتيح الغرف                                                                    |
| `backup decryption key is not loaded on this device`                  | المفتاح موجود لكنه غير نشط هنا                    | `openclaw matrix verify backup restore`؛ وإذا استمر تعذر تحميل المفتاح، فمرّر مفتاح الاسترداد عبر `--recovery-key-stdin`                |
| `backup decryption key could not be loaded from secret storage (...)` | فشل تحميل التخزين السري أو أنه غير مدعوم          | مرّر مفتاح الاسترداد: `printf '%s\n' "$MATRIX_RECOVERY_KEY" \| openclaw matrix verify backup restore --recovery-key-stdin`               |
| `backup key mismatch (...)`                                           | المفتاح المخزن لا يطابق نسخة الخادم النشطة        | أعد تشغيل `verify backup restore --recovery-key-stdin` باستخدام مفتاح نسخة الخادم النشطة، أو استخدم `verify backup reset --yes` لخط أساس جديد |
| `backup signature chain is not trusted by this device`                | لا يثق الجهاز بعد بسلسلة التوقيع المتقاطع         | `verify device --recovery-key-stdin`، ثم `verify self` من عميل آخر متحقق منه إذا ظلت الثقة غير مكتملة                        |
| `backup exists but is not active on this device`                      | نسخة الخادم موجودة والجلسة المحلية غير نشطة       | تحقق من الجهاز أولًا، ثم أعد الفحص باستخدام `openclaw matrix verify backup status`                                                         |
| `backup trust state could not be fully determined`                    | لم تكن نتائج التشخيص حاسمة                         | `openclaw matrix verify status --verbose`                                                                                                 |

أخطاء استرداد أخرى:

`Matrix recovery key is required`

- المعنى: حاولت تنفيذ خطوة استرداد من دون توفير مفتاح استرداد عندما كان مطلوبًا.
- ما يجب فعله: أعد تشغيل الأمر باستخدام `--recovery-key-stdin`، مثل `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- المعنى: تعذر تحليل المفتاح المقدَّم أو أنه لم يطابق التنسيق المتوقع.
- ما يجب فعله: أعد المحاولة باستخدام مفتاح الاسترداد الدقيق من عميل Matrix أو من تصدير مفتاح الاسترداد.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- المعنى: فتح مفتاح الاسترداد مواد نسخة احتياطية قابلة للاستخدام، لكن Matrix لم يُنشئ ثقة كاملة بهوية التوقيع المتقاطع لهذا الجهاز. افحص مخرجات الأمر بحثًا عن `Recovery key accepted`، و`Backup usable`، و`Cross-signing verified`، و`Device verified by owner`.
- ما يجب فعله: شغّل `openclaw matrix verify self`، واقبل الطلب في عميل Matrix آخر، وقارن SAS، واكتب `yes` فقط عند تطابقه. استخدم `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing` فقط عندما تريد عمدًا استبدال هوية التوقيع المتقاطع الحالية.

إذا قبلت فقدان السجل المشفر القديم غير القابل للاستعادة، فيمكنك بدلًا من ذلك إعادة تعيين
خط أساس النسخة الاحتياطية الحالية باستخدام `openclaw matrix verify backup reset --yes`. وعندما
يكون سر النسخة الاحتياطية المخزن تالفًا، تُصلح إعادة التعيين هذه أيضًا التخزين السري كي
يمكن تحميل مفتاح النسخة الاحتياطية الجديد بصورة صحيحة بعد إعادة التشغيل.

## إذا ظل السجل المشفر غير مستعاد

شغّل عمليات التحقق التالية بالترتيب:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

إذا استُعيدت النسخة الاحتياطية بنجاح، لكن سجل بعض الغرف القديمة لا يزال مفقودًا، فمن المحتمل أن Plugin السابق لم ينسخ تلك المفاتيح احتياطيًا قط.

## إذا أردت البدء من جديد للرسائل المستقبلية

إذا قبلت فقدان السجل المشفر القديم غير القابل للاستعادة، ولم تكن تريد سوى خط أساس نظيف للنسخ الاحتياطي من الآن فصاعدًا، فشغّل هذه الأوامر بالترتيب:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

إذا ظل الجهاز غير متحقق منه بعد ذلك، فأكمل التحقق من عميل Matrix بمقارنة رموز SAS التعبيرية أو الرموز العشرية وتأكيد تطابقها.

## ذو صلة

- [Matrix](/ar/channels/matrix): إعداد القناة وضبطها.
- [قواعد دفع Matrix](/ar/channels/matrix-push-rules): توجيه الإشعارات.
- [Doctor](/ar/gateway/doctor): فحص السلامة ومشغّل الترحيل التلقائي.
- [دليل الترحيل](/ar/install/migrating): جميع مسارات الترحيل (نقل الأجهزة وعمليات الاستيراد عبر الأنظمة).
- [Plugins](/ar/tools/plugin): تثبيت Plugin وتسجيله.
