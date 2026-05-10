---
read_when:
    - إعداد Matrix في OpenClaw
    - تكوين Matrix E2EE والتحقق
summary: حالة دعم Matrix، وإعداده، وأمثلة التكوين
title: المصفوفة
x-i18n:
    generated_at: "2026-05-10T19:23:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 111f7d4ce9b1c2ead6a69b5ba2e704cc273e759001f19555f61716f07210d8b2
    source_path: channels/matrix.md
    workflow: 16
---

Matrix هو Plugin قناة قابل للتنزيل لـ OpenClaw.
يستخدم `matrix-js-sdk` الرسمي ويدعم الرسائل المباشرة، والغرف، والسلاسل، والوسائط، والتفاعلات، والاستطلاعات، والموقع، وE2EE.

## التثبيت

ثبّت Matrix من ClawHub قبل تهيئة القناة:

```bash
openclaw plugins install @openclaw/matrix
```

تحاول مواصفات Plugin المجردة استخدام ClawHub أولاً، ثم الرجوع إلى npm. لفرض مصدر السجل، استخدم `openclaw plugins install clawhub:@openclaw/matrix` أو `openclaw plugins install npm:@openclaw/matrix`.

من نسخة محلية:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

يسجّل `plugins install` الـ Plugin ويفعّله، لذلك لا حاجة إلى خطوة منفصلة مثل `openclaw plugins enable matrix`. لا يزال الـ Plugin لا يفعل شيئاً حتى تهيئ القناة أدناه. راجع [Plugin](/ar/tools/plugin) لمعرفة السلوك العام للـ Plugin وقواعد التثبيت.

## الإعداد

1. أنشئ حساب Matrix على homeserver الخاص بك.
2. هيّئ `channels.matrix` باستخدام إما `homeserver` + `accessToken`، أو `homeserver` + `userId` + `password`.
3. أعد تشغيل Gateway.
4. ابدأ رسالة مباشرة مع البوت، أو ادعه إلى غرفة (راجع [الانضمام التلقائي](#auto-join) - لا تصل الدعوات الجديدة إلا عندما يسمح بها `autoJoin`).

### الإعداد التفاعلي

```bash
openclaw channels add
openclaw configure --section channels
```

يسألك المعالج عن: عنوان URL للـ homeserver، وطريقة المصادقة (رمز وصول أو كلمة مرور)، ومعرّف المستخدم (لمصادقة كلمة المرور فقط)، واسم جهاز اختياري، وما إذا كنت تريد تفعيل E2EE، وما إذا كنت تريد تهيئة الوصول إلى الغرف والانضمام التلقائي.

إذا كانت متغيرات البيئة المطابقة `MATRIX_*` موجودة بالفعل ولا يملك الحساب المحدد مصادقة محفوظة، يعرض المعالج اختصاراً عبر متغيرات البيئة. لحل أسماء الغرف قبل حفظ قائمة سماح، شغّل `openclaw channels resolve --channel matrix "Project Room"`. عند تفعيل E2EE، يكتب المعالج التهيئة ويشغّل نفس التمهيد الذي يشغّله [`openclaw matrix encryption setup`](#encryption-and-verification).

### تهيئة دنيا

بالاعتماد على الرمز:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

بالاعتماد على كلمة المرور (يُخزّن الرمز مؤقتاً بعد أول تسجيل دخول):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

### الانضمام التلقائي

القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`. مع القيمة الافتراضية، لن يظهر البوت في الغرف الجديدة أو الرسائل المباشرة من الدعوات الجديدة حتى تنضم يدوياً.

لا يستطيع OpenClaw معرفة وقت الدعوة ما إذا كانت الغرفة المدعو إليها رسالة مباشرة أم مجموعة، لذلك تمر كل الدعوات - بما في ذلك الدعوات بأسلوب الرسائل المباشرة - عبر `autoJoin` أولاً. لا تنطبق `dm.policy` إلا لاحقاً، بعد أن ينضم البوت وتُصنّف الغرفة.

<Warning>
اضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` لتقييد الدعوات التي يقبلها البوت، أو `autoJoin: "always"` لقبول كل دعوة.

لا تقبل `autoJoinAllowlist` إلا الأهداف المستقرة: `!roomId:server` أو `#alias:server` أو `*`. تُرفض أسماء الغرف الصريحة؛ وتُحلّ إدخالات الأسماء المستعارة مقابل homeserver، لا مقابل الحالة التي تدّعيها الغرفة المدعو إليها.
</Warning>

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": { requireMention: true },
      },
    },
  },
}
```

لقبول كل دعوة، استخدم `autoJoin: "always"`.

### تنسيقات أهداف قائمة السماح

من الأفضل ملء قوائم سماح الرسائل المباشرة والغرف بمعرّفات مستقرة:

- الرسائل المباشرة (`dm.allowFrom`، `groupAllowFrom`، `groups.<room>.users`): استخدم `@user:server`. لا تُحلّ أسماء العرض إلا عندما يعيد دليل homeserver تطابقاً واحداً بالضبط.
- الغرف (`groups`، `autoJoinAllowlist`): استخدم `!room:server` أو `#alias:server`. تُحلّ الأسماء بأفضل جهد مقابل الغرف المنضم إليها؛ وتُتجاهل الإدخالات غير المحلولة أثناء التشغيل.

### تطبيع معرّف الحساب

يحوّل المعالج الاسم الودي إلى معرّف حساب مطبّع. على سبيل المثال، يصبح `Ops Bot` هو `ops-bot`. تُهرّب علامات الترقيم في أسماء متغيرات البيئة ذات النطاق بحيث لا يمكن لحسابين أن يتصادما: `-` → `_X2D_`، لذلك يُعيّن `ops-prod` إلى `MATRIX_OPS_X2D_PROD_*`.

### بيانات الاعتماد المخزنة مؤقتاً

يخزّن Matrix بيانات الاعتماد المخزنة مؤقتاً ضمن `~/.openclaw/credentials/matrix/`:

- الحساب الافتراضي: `credentials.json`
- الحسابات المسمّاة: `credentials-<account>.json`

عند وجود بيانات اعتماد مخزنة مؤقتا هناك، يعامل OpenClaw Matrix على أنه مكوّن حتى إذا لم يكن رمز الوصول موجودا في ملف الإعدادات - ويغطي ذلك الإعداد، و`openclaw doctor`، وفحوصات حالة القناة.

### متغيرات البيئة

تُستخدم عندما لا يكون مفتاح الإعدادات المكافئ مضبوطا. يستخدم الحساب الافتراضي أسماء بلا بادئة؛ وتستخدم الحسابات المسمّاة معرّف الحساب مدرجا قبل اللاحقة.

| الحساب الافتراضي       | الحساب المسمّى (`<ID>` هو معرّف الحساب المطبع) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

بالنسبة إلى الحساب `ops`، تصبح الأسماء `MATRIX_OPS_HOMESERVER`، و`MATRIX_OPS_ACCESS_TOKEN`، وهكذا. تُقرأ متغيرات البيئة الخاصة بمفتاح الاسترداد بواسطة تدفقات CLI المدركة للاسترداد (`verify backup restore`، و`verify device`، و`verify bootstrap`) عندما تمرر المفتاح عبر `--recovery-key-stdin`.

لا يمكن ضبط `MATRIX_HOMESERVER` من ملف `.env` في مساحة العمل؛ راجع [ملفات `.env` في مساحة العمل](/ar/gateway/security).

## مثال على الإعدادات

خط أساس عملي مع اقتران الرسائل المباشرة، وقائمة السماح للغرف، وE2EE:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": { requireMention: true },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

## معاينات البث

بث ردود Matrix اختياري. يتحكم `streaming` في كيفية تسليم OpenClaw لرد المساعد الجاري؛ ويتحكم `blockStreaming` فيما إذا كان كل مقطع مكتمل يُحفظ كرسالة Matrix مستقلة.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

للاحتفاظ بمعاينات الإجابة المباشرة مع إخفاء أسطر الأداة/التقدم المؤقتة، استخدم صيغة الكائن:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "partial",
        preview: {
          toolProgress: false,
        },
      },
    },
  },
}
```

| `streaming`       | السلوك                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (الافتراضي) | ينتظر الرد الكامل، ثم يرسله مرة واحدة. `true` ↔ `"partial"`، و`false` ↔ `"off"`.                                                                                        |
| `"partial"`       | يحرر رسالة نصية عادية واحدة في مكانها بينما يكتب النموذج المقطع الحالي. قد ترسل عملاء Matrix القياسيون إشعارا عند المعاينة الأولى، وليس عند التعديل النهائي.              |
| `"quiet"`         | مثل `"partial"` لكن الرسالة إشعار غير منبه. لا يحصل المستلمون على إشعار إلا عندما تطابق قاعدة دفع لكل مستخدم التعديل النهائي (انظر أدناه). |

`blockStreaming` مستقل عن `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (الافتراضي)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | مسودة مباشرة للمقطع الحالي، مع الاحتفاظ بالمقاطع المكتملة كرسائل | مسودة مباشرة للمقطع الحالي، تُنهى في مكانها |
| `"off"`                 | رسالة Matrix منبهة واحدة لكل مقطع منته                     | رسالة Matrix منبهة واحدة للرد الكامل      |

ملاحظات:

- إذا تجاوزت معاينة حد حجم الحدث في Matrix، يوقف OpenClaw بث المعاينة ويتراجع إلى التسليم النهائي فقط.
- ترسل ردود الوسائط المرفقات بشكل طبيعي دائما. إذا تعذر إعادة استخدام معاينة قديمة بأمان، يحذفها OpenClaw قبل إرسال رد الوسائط النهائي.
- تكون تحديثات معاينة تقدم الأدوات مفعلة افتراضيا عندما يكون بث معاينة Matrix نشطا. اضبط `streaming.preview.toolProgress: false` للاحتفاظ بتعديلات المعاينة لنص الإجابة مع ترك تقدم الأدوات على مسار التسليم العادي.
- تكلف تعديلات المعاينة استدعاءات إضافية لواجهة Matrix API. اترك `streaming: "off"` إذا كنت تريد ملف حدود معدل الاستخدام الأكثر تحفظا.

## بيانات الموافقة الوصفية

مطالبات الموافقة الأصلية في Matrix هي أحداث `m.room.message` عادية مع محتوى حدث مخصص خاص بـ OpenClaw ضمن `com.openclaw.approval`. تسمح Matrix بمفاتيح محتوى أحداث مخصصة، لذلك لا يزال العملاء القياسيون يعرضون متن النص بينما يمكن للعملاء المدركين لـ OpenClaw قراءة معرّف الموافقة المنظم، ونوعها، وحالتها، والقرارات المتاحة، وتفاصيل التنفيذ/Plugin.

عندما تكون مطالبة الموافقة أطول من أن تتسع في حدث Matrix واحد، يقسم OpenClaw النص المرئي إلى أجزاء ويرفق `com.openclaw.approval` بالجزء الأول فقط. ترتبط التفاعلات لقرارات السماح/الرفض بذلك الحدث الأول، لذلك تحتفظ المطالبات الطويلة بهدف الموافقة نفسه مثل مطالبات الحدث الواحد.

### قواعد الدفع ذاتية الاستضافة للمعاينات النهائية الهادئة

لا يرسل `streaming: "quiet"` إشعارا إلى المستلمين إلا بعد إنهاء مقطع أو دورة - يجب أن تطابق قاعدة دفع لكل مستخدم علامة المعاينة النهائية. راجع [قواعد دفع Matrix للمعاينات الهادئة](/ar/channels/matrix-push-rules) للوصفة الكاملة (رمز المستلم، وفحص الدافع، وتثبيت القاعدة، وملاحظات كل خادم منزلي).

## غرف البوتات المتبادلة

افتراضيا، تُتجاهل رسائل Matrix الواردة من حسابات Matrix أخرى مكوّنة في OpenClaw.

استخدم `allowBots` عندما تريد عمدا حركة Matrix بين الوكلاء:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- يقبل `allowBots: true` الرسائل من حسابات بوت Matrix الأخرى المكوّنة في الغرف المسموح بها والرسائل المباشرة.
- يقبل `allowBots: "mentions"` تلك الرسائل فقط عندما تذكر هذا البوت بوضوح في الغرف. تظل الرسائل المباشرة مسموحة.
- يتجاوز `groups.<room>.allowBots` إعداد مستوى الحساب لغرفة واحدة.
- لا يزال OpenClaw يتجاهل الرسائل من معرّف مستخدم Matrix نفسه لتجنب حلقات الرد الذاتي.
- لا تكشف Matrix عن علامة بوت أصلية هنا؛ يعامل OpenClaw "مؤلفا بواسطة بوت" على أنه "مرسل من حساب Matrix مكوّن آخر على Gateway OpenClaw هذا".

استخدم قوائم سماح صارمة للغرف ومتطلبات الذكر عند تمكين حركة البوتات المتبادلة في الغرف المشتركة.

## التشفير والتحقق

في غرف (E2EE) المشفرة، تستخدم أحداث الصور الصادرة `thumbnail_file` بحيث تكون معاينات الصور مشفرة إلى جانب المرفق الكامل. لا تزال الغرف غير المشفرة تستخدم `thumbnail_url` العادي. لا حاجة إلى أي إعداد - يكتشف الـ Plugin حالة E2EE تلقائيا.

تقبل جميع أوامر `openclaw matrix` الخيارات `--verbose` (تشخيصات كاملة)، و`--json` (إخراج قابل للقراءة آليًا)، و`--account <id>` (إعدادات متعددة الحسابات). يكون الإخراج موجزًا افتراضيًا مع تسجيل SDK داخلي هادئ. تعرض الأمثلة أدناه الصيغة القياسية؛ أضف الرايات حسب الحاجة.

### تفعيل التشفير

```bash
openclaw matrix encryption setup
```

يمهّد تخزين الأسرار والتوقيع المتبادل، وينشئ نسخة احتياطية لمفتاح الغرفة إذا لزم الأمر، ثم يطبع الحالة والخطوات التالية. رايات مفيدة:

- `--recovery-key <key>` طبّق مفتاح استرداد قبل التمهيد (يفضّل استخدام صيغة stdin الموثقة أدناه)
- `--force-reset-cross-signing` تجاهل هوية التوقيع المتبادل الحالية وأنشئ هوية جديدة (استخدمه عمدًا فقط)

لحساب جديد، فعّل E2EE عند الإنشاء:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` هو اسم بديل لـ `--enable-e2ee`.

مكافئ الإعداد اليدوي:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

### الحالة وإشارات الثقة

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

يعرض `verify status` ثلاث إشارات ثقة مستقلة (يعرض `--verbose` جميعها):

- `Locally trusted`: موثوق به من هذا العميل فقط
- `Cross-signing verified`: يبلّغ SDK عن التحقق عبر التوقيع المتبادل
- `Signed by owner`: موقّع بمفتاح التوقيع الذاتي الخاص بك (للتشخيص فقط)

تصبح `Verified by owner` بقيمة `yes` فقط عندما تكون `Cross-signing verified` بقيمة `yes`. لا تكفي الثقة المحلية أو توقيع المالك وحده.

يعيد `--allow-degraded-local-state` تشخيصات بأفضل جهد دون تحضير حساب Matrix أولًا؛ مفيد للفحوصات غير المتصلة أو المهيأة جزئيًا.

### التحقق من هذا الجهاز باستخدام مفتاح استرداد

مفتاح الاسترداد حساس - مرّره عبر stdin بدلًا من تمريره في سطر الأوامر. اضبط `MATRIX_RECOVERY_KEY` (أو `MATRIX_<ID>_RECOVERY_KEY` لحساب مسمى):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

يعرض الأمر ثلاث حالات:

- `Recovery key accepted`: قبل Matrix المفتاح لتخزين الأسرار أو ثقة الجهاز.
- `Backup usable`: يمكن تحميل النسخة الاحتياطية لمفاتيح الغرف باستخدام مادة الاسترداد الموثوقة.
- `Device verified by owner`: يملك هذا الجهاز ثقة كاملة في هوية التوقيع المتبادل في Matrix.

ينتهي برمز غير صفري عندما تكون ثقة الهوية الكاملة غير مكتملة، حتى إذا فتح مفتاح الاسترداد مادة النسخ الاحتياطي. في هذه الحالة، أكمل التحقق الذاتي من عميل Matrix آخر:

```bash
openclaw matrix verify self
```

ينتظر `verify self` ظهور `Cross-signing verified: yes` قبل أن ينتهي بنجاح. استخدم `--timeout-ms <ms>` لضبط الانتظار.

تُقبل أيضًا صيغة المفتاح الحرفية `openclaw matrix verify device "<recovery-key>"`، لكن المفتاح سينتهي به المطاف في سجل الصدفة لديك.

### تمهيد التوقيع المتبادل أو إصلاحه

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` هو أمر الإصلاح والإعداد للحسابات المشفرة. بالترتيب، يقوم بما يلي:

- يمهّد تخزين الأسرار، مع إعادة استخدام مفتاح استرداد موجود عندما يكون ذلك ممكنًا
- يمهّد التوقيع المتبادل ويرفع المفاتيح العامة المفقودة
- يعلّم الجهاز الحالي ويوقّعه توقيعًا متبادلًا
- ينشئ نسخة احتياطية لمفاتيح الغرف على الخادم إذا لم تكن موجودة بالفعل

إذا كان homeserver يتطلب UIA لرفع مفاتيح التوقيع المتبادل، يحاول OpenClaw أولًا دون مصادقة، ثم `m.login.dummy`، ثم `m.login.password` (يتطلب `channels.matrix.password`).

رايات مفيدة:

- `--recovery-key-stdin` (استخدمه مع `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) أو `--recovery-key <key>`
- `--force-reset-cross-signing` لتجاهل هوية التوقيع المتبادل الحالية (عمدًا فقط)

### النسخة الاحتياطية لمفاتيح الغرف

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

يعرض `backup status` ما إذا كانت توجد نسخة احتياطية على الخادم وما إذا كان هذا الجهاز يستطيع فك تشفيرها. يستورد `backup restore` مفاتيح الغرف المنسوخة احتياطيًا إلى مخزن التشفير المحلي؛ إذا كان مفتاح الاسترداد موجودًا بالفعل على القرص يمكنك حذف `--recovery-key-stdin`.

لاستبدال نسخة احتياطية معطلة بخط أساس جديد (يقبل فقدان السجل القديم غير القابل للاسترداد؛ ويمكنه أيضًا إعادة إنشاء تخزين الأسرار إذا كان سر النسخة الاحتياطية الحالي غير قابل للتحميل):

```bash
openclaw matrix verify backup reset --yes
```

أضف `--rotate-recovery-key` فقط عندما تريد عمدًا أن يتوقف مفتاح الاسترداد السابق عن فتح خط أساس النسخة الاحتياطية الجديد.

### سرد عمليات التحقق وطلبها والرد عليها

```bash
openclaw matrix verify list
```

يسرد طلبات التحقق المعلقة للحساب المحدد.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

يرسل طلب تحقق من حساب OpenClaw هذا. يطلب `--own-user` التحقق الذاتي (تقبل المطالبة في عميل Matrix آخر للمستخدم نفسه)؛ تستهدف `--user-id`/`--device-id`/`--room-id` شخصًا آخر. لا يمكن جمع `--own-user` مع رايات الاستهداف الأخرى.

للتعامل الأدنى مستوى مع دورة الحياة - عادةً أثناء متابعة الطلبات الواردة من عميل آخر - تعمل هذه الأوامر على طلب محدد `<id>` (يطبع بواسطة `verify list` و`verify request`):

| الأمر                                      | الغرض                                                               |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | قبول طلب وارد                                                       |
| `openclaw matrix verify start <id>`        | بدء تدفق SAS                                                        |
| `openclaw matrix verify sas <id>`          | طباعة رموز SAS التعبيرية أو الأرقام العشرية                         |
| `openclaw matrix verify confirm-sas <id>`  | تأكيد أن SAS يطابق ما يعرضه العميل الآخر                            |
| `openclaw matrix verify mismatch-sas <id>` | رفض SAS عندما لا تتطابق الرموز التعبيرية أو الأرقام العشرية         |
| `openclaw matrix verify cancel <id>`       | الإلغاء؛ يأخذ اختياريًا `--reason <text>` و`--code <matrix-code>` |

تقبل `accept` و`start` و`sas` و`confirm-sas` و`mismatch-sas` و`cancel` جميعها `--user-id` و`--room-id` كتلميحات متابعة للرسائل المباشرة عندما يكون التحقق مثبتًا في غرفة رسائل مباشرة محددة.

### ملاحظات تعدد الحسابات

دون `--account <id>`، تستخدم أوامر Matrix CLI الحساب الافتراضي الضمني. إذا كانت لديك عدة حسابات مسماة ولم تضبط `channels.matrix.defaultAccount`، فسترفض التخمين وتطلب منك الاختيار. عندما يكون E2EE معطلًا أو غير متاح لحساب مسمى، تشير الأخطاء إلى مفتاح إعداد ذلك الحساب، مثلًا `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    مع `encryption: true`، تكون القيمة الافتراضية لـ `startupVerification` هي `"if-unverified"`. عند بدء التشغيل، يطلب جهاز غير متحقق منه التحقق الذاتي في عميل Matrix آخر، مع تخطي التكرارات وتطبيق فترة تهدئة (24 ساعة افتراضيًا). اضبط ذلك باستخدام `startupVerificationCooldownHours` أو عطّله باستخدام `startupVerification: "off"`.

    يشغّل بدء التشغيل أيضًا تمريرة تمهيد تشفير محافظة تعيد استخدام تخزين الأسرار وهوية التوقيع المتبادل الحالية. إذا كانت حالة التمهيد معطلة، يحاول OpenClaw إصلاحًا محروسًا حتى دون `channels.matrix.password`؛ إذا كان homeserver يتطلب UIA بكلمة مرور، يسجل بدء التشغيل تحذيرًا ويبقى غير قاتل. تُحفظ الأجهزة الموقعة بالفعل من المالك.

    راجع [ترحيل Matrix](/ar/channels/matrix-migration) للاطلاع على مسار الترقية الكامل.

  </Accordion>

  <Accordion title="Verification notices">
    ينشر Matrix إشعارات دورة حياة التحقق في غرفة التحقق الصارمة للرسائل المباشرة كرسائل `m.notice`: الطلب، والجاهزية (مع إرشاد "التحقق بالرموز التعبيرية")، والبدء/الإكمال، وتفاصيل SAS (الرموز التعبيرية/الأرقام العشرية) عند توفرها.

    تُتتبع الطلبات الواردة من عميل Matrix آخر وتُقبل تلقائيًا. للتحقق الذاتي، يبدأ OpenClaw تدفق SAS تلقائيًا ويؤكد جانبه بمجرد أن يتوفر التحقق بالرموز التعبيرية - ما زلت بحاجة إلى المقارنة وتأكيد "إنهما متطابقان" في عميل Matrix لديك.

    لا تُمرر إشعارات نظام التحقق إلى مسار دردشة الوكيل.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    إذا قال `verify status` إن الجهاز الحالي لم يعد مدرجًا على homeserver، فأنشئ جهاز Matrix جديدًا لـ OpenClaw. لتسجيل الدخول بكلمة مرور:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    لمصادقة الرمز، أنشئ رمز وصول جديدًا في عميل Matrix أو واجهة الإدارة لديك، ثم حدّث OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    استبدل `assistant` بمعرّف الحساب من الأمر الفاشل، أو احذف `--account` للحساب الافتراضي.

  </Accordion>

  <Accordion title="Device hygiene">
    يمكن أن تتراكم الأجهزة القديمة المُدارة بواسطة OpenClaw. اسردها ونظّفها:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    يستخدم Matrix E2EE مسار تشفير Rust الرسمي في `matrix-js-sdk` مع `fake-indexeddb` كطبقة توافق IndexedDB. تستمر حالة التشفير في `crypto-idb-snapshot.json` (أذونات ملفات مقيّدة).

    تقع حالة وقت التشغيل المشفرة تحت `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` وتتضمن مخزن المزامنة، ومخزن التشفير، ومفتاح الاسترداد، ولقطة IDB، وربط الخيوط، وحالة تحقق بدء التشغيل. عندما يتغير الرمز لكن تبقى هوية الحساب كما هي، يعيد OpenClaw استخدام أفضل جذر موجود بحيث تظل الحالة السابقة مرئية.

  </Accordion>
</AccordionGroup>

## إدارة الملف الشخصي

حدّث الملف الشخصي الذاتي في Matrix للحساب المحدد:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

يمكنك تمرير الخيارين في استدعاء واحد. يقبل Matrix عناوين URL للصور الرمزية بصيغة `mxc://` مباشرة؛ عندما تمرر `http://` أو `https://`، يرفع OpenClaw الملف أولًا ويخزن عنوان URL المحلول بصيغة `mxc://` في `channels.matrix.avatarUrl` (أو التجاوز الخاص بكل حساب).

## الخيوط

يدعم Matrix خيوط Matrix الأصلية لكل من الردود التلقائية وإرسالات أداة الرسائل. يتحكم مفتاحان مستقلان في السلوك:

### توجيه الجلسة (`sessionScope`)

يحدد `dm.sessionScope` كيفية ربط غرف رسائل Matrix المباشرة بجلسات OpenClaw:

- `"per-user"` (افتراضي): تشترك جميع غرف الرسائل المباشرة مع النظير الموجه نفسه في جلسة واحدة.
- `"per-room"`: تحصل كل غرفة رسائل مباشرة في Matrix على مفتاح جلسة خاص بها، حتى عندما يكون النظير نفسه.

تتغلب روابط المحادثة الصريحة دائمًا على `sessionScope`، لذلك تحتفظ الغرف والخيوط المربوطة بجلسة الهدف المختارة.

### خيوط الردود (`threadReplies`)

يحدد `threadReplies` أين ينشر البوت رده:

- `"off"`: تكون الردود على المستوى الأعلى. تبقى الرسائل الواردة ضمن خيط على الجلسة الأصلية.
- `"inbound"`: الرد داخل خيط فقط عندما تكون الرسالة الواردة موجودة بالفعل في ذلك الخيط.
- `"always"`: الرد داخل خيط متجذر عند الرسالة المشغلة؛ تُوجّه تلك المحادثة عبر جلسة مطابقة ذات نطاق خيط بدءًا من أول تشغيل فصاعدًا.

يتجاوز `dm.threadReplies` هذا للرسائل المباشرة فقط - على سبيل المثال، إبقاء خيوط الغرفة معزولة مع إبقاء الرسائل المباشرة مسطحة.

### توريث الخيوط وأوامر الشرطة المائلة

- تتضمن الرسائل المترابطة الواردة رسالة جذر السلسلة كسياق إضافي للوكيل.
- عمليات الإرسال عبر أداة الرسائل ترث تلقائيا سلسلة Matrix الحالية عند استهداف الغرفة نفسها (أو هدف مستخدم الرسائل المباشرة نفسه)، ما لم يتم توفير `threadId` صريح.
- لا تبدأ إعادة استخدام هدف مستخدم الرسائل المباشرة إلا عندما تثبت بيانات الجلسة الوصفية الحالية أنه النظير نفسه في الرسائل المباشرة على حساب Matrix نفسه؛ وإلا يعود OpenClaw إلى التوجيه العادي محدود النطاق بالمستخدم.
- تعمل `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` و`/acp spawn` المرتبطة بسلسلة كلها في غرف Matrix والرسائل المباشرة.
- تنشئ `/focus` على المستوى الأعلى سلسلة Matrix جديدة وتربطها بالجلسة المستهدفة عند تفعيل `threadBindings.spawnSessions`.
- يؤدي تشغيل `/focus` أو `/acp spawn --thread here` داخل سلسلة Matrix موجودة إلى ربط تلك السلسلة في مكانها.

عندما يكتشف OpenClaw غرفة رسائل مباشرة في Matrix تتعارض مع غرفة رسائل مباشرة أخرى على الجلسة المشتركة نفسها، ينشر إشعار `m.notice` لمرة واحدة في تلك الغرفة يشير إلى مخرج `/focus` ويقترح تغيير `dm.sessionScope`. لا يظهر الإشعار إلا عند تفعيل روابط السلاسل.

## روابط محادثات ACP

يمكن تحويل غرف Matrix والرسائل المباشرة وسلاسل Matrix الموجودة إلى مساحات عمل ACP دائمة من دون تغيير سطح الدردشة.

تدفق سريع للمشغل:

- شغّل `/acp spawn codex --bind here` داخل رسالة Matrix المباشرة أو الغرفة أو السلسلة الموجودة التي تريد الاستمرار في استخدامها.
- في رسالة Matrix مباشرة أو غرفة على المستوى الأعلى، يبقى سطح الدردشة هو الرسالة المباشرة/الغرفة الحالية وتُوجّه الرسائل المستقبلية إلى جلسة ACP المنشأة.
- داخل سلسلة Matrix موجودة، يربط `--bind here` تلك السلسلة الحالية في مكانها.
- يعيد `/new` و`/reset` ضبط جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الربط.

ملاحظات:

- لا ينشئ `--bind here` سلسلة Matrix فرعية.
- يتحكم `threadBindings.spawnSessions` في `/acp spawn --thread auto|here`، حيث يحتاج OpenClaw إلى إنشاء سلسلة Matrix فرعية أو ربطها.

### إعداد ربط السلاسل

يرث Matrix الإعدادات الافتراضية العامة من `session.threadBindings`، ويدعم أيضا تجاوزات لكل قناة:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

تكون عمليات إنشاء الجلسات المرتبطة بسلاسل Matrix مفعلة افتراضيا:

- اضبط `threadBindings.spawnSessions: false` لمنع `/focus` على المستوى الأعلى و`/acp spawn --thread auto|here` من إنشاء/ربط سلاسل Matrix.
- اضبط `threadBindings.defaultSpawnContext: "isolated"` عندما لا ينبغي لعمليات إنشاء سلاسل الوكلاء الفرعيين الأصلية أن تفرّع نص الجلسة الأصلية.

## التفاعلات

يدعم Matrix التفاعلات الصادرة وإشعارات التفاعلات الواردة وتفاعلات الإقرار.

تخضع أدوات التفاعل الصادرة لـ `channels.matrix.actions.reactions`:

- يضيف `react` تفاعلا إلى حدث Matrix.
- يعرض `reactions` ملخص التفاعلات الحالي لحدث Matrix.
- يزيل `emoji=""` تفاعلات الروبوت الخاصة على ذلك الحدث.
- يزيل `remove: true` تفاعل الرموز التعبيرية المحدد فقط من الروبوت.

**ترتيب الحل** (أول قيمة معرّفة تفوز):

| الإعداد                  | الترتيب                                                                         |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | لكل حساب → القناة → `messages.ackReaction` → احتياطي رمز هوية الوكيل التعبيري   |
| `ackReactionScope`      | لكل حساب → القناة → `messages.ackReactionScope` → الافتراضي `"group-mentions"` |
| `reactionNotifications` | لكل حساب → القناة → الافتراضي `"own"`                                          |

يمرر `reactionNotifications: "own"` أحداث `m.reaction` المضافة عندما تستهدف رسائل Matrix التي كتبها الروبوت؛ ويعطل `"off"` أحداث نظام التفاعلات. لا تُنشأ أحداث نظامية مصطنعة لإزالة التفاعلات لأن Matrix يعرضها كتنقيحات، لا كعمليات إزالة مستقلة لـ `m.reaction`.

## سياق السجل

- يتحكم `channels.matrix.historyLimit` في عدد رسائل الغرفة الأخيرة التي تُضمّن كـ `InboundHistory` عندما تؤدي رسالة غرفة Matrix إلى تشغيل الوكيل. يعود إلى `messages.groupChat.historyLimit`؛ وإذا لم يُضبط كلاهما، فالافتراضي الفعلي هو `0`. اضبطه على `0` للتعطيل.
- سجل غرف Matrix خاص بالغرفة فقط. تستمر الرسائل المباشرة في استخدام سجل الجلسة العادي.
- سجل غرف Matrix معلّق فقط: يخزن OpenClaw رسائل الغرفة التي لم تؤد بعد إلى رد، ثم يلتقط لقطة من تلك النافذة عند وصول إشارة ذكر أو محفز آخر.
- لا تُضمّن رسالة المحفز الحالية في `InboundHistory`؛ بل تبقى في المتن الوارد الرئيسي لتلك الدورة.
- تعيد محاولات حدث Matrix نفسه استخدام لقطة السجل الأصلية بدلا من الانجراف إلى رسائل غرفة أحدث.

## رؤية السياق

يدعم Matrix عنصر التحكم المشترك `contextVisibility` لسياق الغرفة التكميلي مثل نص الرد الذي جُلب، وجذور السلاسل، والسجل المعلّق.

- `contextVisibility: "all"` هو الافتراضي. يُحتفظ بالسياق التكميلي كما استُلم.
- `contextVisibility: "allowlist"` يرشح السياق التكميلي إلى المرسلين المسموح لهم من خلال فحوص قائمة السماح النشطة للغرفة/المستخدم.
- يتصرف `contextVisibility: "allowlist_quote"` مثل `allowlist`، لكنه يظل يحتفظ برد مقتبس صريح واحد.

يؤثر هذا الإعداد في رؤية السياق التكميلي، لا في ما إذا كانت الرسالة الواردة نفسها يمكنها تشغيل رد.
لا يزال تفويض المحفز يأتي من `groupPolicy` و`groups` و`groupAllowFrom` وإعدادات سياسة الرسائل المباشرة.

## سياسة الرسائل المباشرة والغرف

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": { requireMention: true },
      },
    },
  },
}
```

لإسكات الرسائل المباشرة بالكامل مع إبقاء الغرف عاملة، اضبط `dm.enabled: false`:

```json5
{
  channels: {
    matrix: {
      dm: { enabled: false },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
    },
  },
}
```

راجع [المجموعات](/ar/channels/groups) لسلوك تقييد الإشارات وقائمة السماح.

مثال إقران للرسائل المباشرة في Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

إذا استمر مستخدم Matrix غير معتمد في مراسلتك قبل الموافقة، يعيد OpenClaw استخدام رمز الإقران المعلق نفسه وقد يرسل رد تذكير بعد فترة تهدئة قصيرة بدلا من إصدار رمز جديد.

راجع [الإقران](/ar/channels/pairing) لتدفق إقران الرسائل المباشرة المشترك وتخطيط التخزين.

## إصلاح الغرف المباشرة

إذا انحرفت حالة الرسائل المباشرة عن المزامنة، فقد ينتهي الأمر بـ OpenClaw مع تعيينات `m.direct` قديمة تشير إلى غرف فردية قديمة بدلا من الرسالة المباشرة النشطة. افحص التعيين الحالي لنظير:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

أصلحه:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

يقبل كلا الأمرين `--account <id>` لإعدادات متعددة الحسابات. تدفق الإصلاح:

- يفضل رسالة مباشرة صارمة 1:1 معيّنة بالفعل في `m.direct`
- يعود إلى أي رسالة مباشرة صارمة 1:1 منضمة حاليا مع ذلك المستخدم
- ينشئ غرفة مباشرة جديدة ويعيد كتابة `m.direct` إذا لم توجد رسالة مباشرة سليمة

لا يحذف الغرف القديمة تلقائيا. يختار الرسالة المباشرة السليمة ويحدّث التعيين بحيث تستهدف عمليات إرسال Matrix المستقبلية وإشعارات التحقق وتدفقات الرسائل المباشرة الأخرى الغرفة الصحيحة.

## موافقات التنفيذ

يمكن أن يعمل Matrix كعميل موافقة أصلي. اضبطه ضمن `channels.matrix.execApprovals` (أو `channels.matrix.accounts.<account>.execApprovals` لتجاوز لكل حساب):

- `enabled`: يسلّم الموافقات عبر مطالبات أصلية في Matrix. عند عدم الضبط أو عند `"auto"`، يفعّل Matrix نفسه تلقائيا بمجرد إمكانية حل موافق واحد على الأقل. اضبطه على `false` للتعطيل صراحة.
- `approvers`: معرّفات مستخدمي Matrix (`@owner:example.org`) المسموح لهم بالموافقة على طلبات التنفيذ. اختياري - يعود إلى `channels.matrix.dm.allowFrom`.
- `target`: مكان ذهاب المطالبات. يرسل `"dm"` (الافتراضي) إلى الرسائل المباشرة للموافقين؛ ويرسل `"channel"` إلى غرفة Matrix أو الرسالة المباشرة الأصلية؛ ويرسل `"both"` إلى كليهما.
- `agentFilter` / `sessionFilter`: قوائم سماح اختيارية تحدد الوكلاء/الجلسات التي تشغّل تسليم Matrix.

يختلف التفويض قليلا بين أنواع الموافقات:

- تستخدم **موافقات التنفيذ** `execApprovals.approvers`، مع الرجوع إلى `dm.allowFrom`.
- تفوض **موافقات Plugin** عبر `dm.allowFrom` فقط.

يشترك النوعان في اختصارات تفاعلات Matrix وتحديثات الرسائل. يرى الموافقون اختصارات التفاعل على رسالة الموافقة الأساسية:

- `✅` السماح مرة واحدة
- `❌` الرفض
- `♾️` السماح دائما (عندما تسمح بذلك سياسة التنفيذ الفعلية)

أوامر الشرطة المائلة الاحتياطية: `/approve <id> allow-once`، `/approve <id> allow-always`، `/approve <id> deny`.

يمكن للموافقين الذين تم حلهم فقط الموافقة أو الرفض. يتضمن تسليم القناة لموافقات التنفيذ نص الأمر - لا تفعّل `channel` أو `both` إلا في غرف موثوقة.

ذو صلة: [موافقات التنفيذ](/ar/tools/exec-approvals).

## أوامر الشرطة المائلة

تعمل أوامر الشرطة المائلة (`/new` و`/reset` و`/model` و`/focus` و`/unfocus` و`/agents` و`/session` و`/acp` و`/approve` وما إلى ذلك) مباشرة في الرسائل المباشرة. في الغرف، يتعرف OpenClaw أيضا على الأوامر المسبوقة بإشارة Matrix الخاصة بالروبوت نفسه، لذلك يؤدي `@bot:server /new` إلى تشغيل مسار الأمر من دون تعبير منتظم مخصص للإشارات. يبقي هذا الروبوت مستجيبا لمنشورات الغرف من نمط `@mention /command` التي يصدرها Element والعملاء المشابهون عندما يكمل المستخدم اسم الروبوت تلقائيا بمفتاح الجدولة قبل كتابة الأمر.

لا تزال قواعد التفويض تنطبق: يجب أن يستوفي مرسلو الأوامر سياسات قائمة السماح/المالك نفسها للرسائل المباشرة أو الغرف كما في الرسائل العادية.

## تعدد الحسابات

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

**الوراثة:**

- تعمل قيم `channels.matrix` على المستوى الأعلى كافتراضات للحسابات المسماة ما لم يتجاوزها حساب.
- حدّد نطاق إدخال غرفة موروث إلى حساب محدد باستخدام `groups.<room>.account`. الإدخالات من دون `account` مشتركة بين الحسابات؛ ولا يزال `account: "default"` يعمل عندما يكون الحساب الافتراضي مضبوطا على المستوى الأعلى.

**اختيار الحساب الافتراضي:**

- اضبط `defaultAccount` لاختيار الحساب المسمى الذي تفضله عمليات التوجيه الضمني والاستكشاف وأوامر CLI.
- إذا كانت لديك عدة حسابات وكان أحدها مسمى حرفيا `default`، يستخدمه OpenClaw ضمنيا حتى عندما لا يكون `defaultAccount` مضبوطا.
- إذا كانت لديك عدة حسابات مسماة ولم يُحدَّد حساب افتراضي، ترفض أوامر CLI التخمين - اضبط `defaultAccount` أو مرر `--account <id>`.
- لا تُعامل كتلة `channels.matrix.*` على المستوى الأعلى كحساب `default` الضمني إلا عندما تكون مصادقتها مكتملة (`homeserver` + `accessToken`، أو `homeserver` + `userId` + `password`). تظل الحسابات المسماة قابلة للاكتشاف من `homeserver` + `userId` بمجرد أن تغطي بيانات الاعتماد المخزنة مؤقتا المصادقة.

**الترقية:**

- عندما يرقّي OpenClaw إعداد حساب واحد إلى إعداد متعدد الحسابات أثناء الإصلاح أو الإعداد، فإنه يحافظ على الحساب المسمى الموجود إذا كان موجودا أو إذا كان `defaultAccount` يشير بالفعل إلى واحد. تنتقل مفاتيح مصادقة/تمهيد Matrix فقط إلى الحساب المرقّى؛ وتبقى مفاتيح سياسة التسليم المشتركة على المستوى الأعلى.

راجع [مرجع الإعدادات](/ar/gateway/config-channels#multi-account-all-channels) للنمط المشترك لتعدد الحسابات.

## خوادم المنزل الخاصة/شبكات LAN

افتراضيا، يحظر OpenClaw خوادم Matrix المنزلية الخاصة/الداخلية لحماية SSRF ما لم
توافق صراحة لكل حساب.

إذا كان خادمك المنزلي يعمل على localhost أو عنوان LAN/Tailscale IP أو اسم مضيف داخلي، ففعّل
`network.dangerouslyAllowPrivateNetwork` لذلك الحساب في Matrix:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

مثال إعداد CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

يسمح هذا التفعيل الاختياري فقط بالأهداف الخاصة/الداخلية الموثوقة. تظل خوادم homeserver العامة غير المشفرة مثل
`http://matrix.example.org:8008` محظورة. فضّل `https://` كلما أمكن.

## تمرير حركة Matrix عبر وكيل

إذا كان نشر Matrix لديك يحتاج إلى وكيل HTTP(S) صريح صادر، فاضبط `channels.matrix.proxy`:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

يمكن للحسابات المسماة تجاوز الافتراضي ذي المستوى الأعلى باستخدام `channels.matrix.accounts.<id>.proxy`.
يستخدم OpenClaw إعداد الوكيل نفسه لحركة Matrix وقت التشغيل واستعلامات حالة الحساب.

## حلّ الهدف

يقبل Matrix صيغ الأهداف هذه في أي موضع يطلب فيه OpenClaw هدف غرفة أو مستخدم:

- المستخدمون: `@user:server` أو `user:@user:server` أو `matrix:user:@user:server`
- الغرف: `!room:server` أو `room:!room:server` أو `matrix:room:!room:server`
- الأسماء المستعارة: `#alias:server` أو `channel:#alias:server` أو `matrix:channel:#alias:server`

معرّفات غرف Matrix حساسة لحالة الأحرف. استخدم حالة الأحرف الدقيقة لمعرّف الغرفة من Matrix
عند تكوين أهداف تسليم صريحة أو مهام cron أو الارتباطات أو قوائم السماح.
يبقي OpenClaw مفاتيح الجلسات الداخلية بصيغة معيارية للتخزين، لذلك لا تعد تلك المفاتيح المكتوبة بأحرف صغيرة
مصدرًا موثوقًا لمعرّفات تسليم Matrix.

يستخدم البحث المباشر في الدليل حساب Matrix المسجّل الدخول:

- تستعلم عمليات البحث عن المستخدمين دليل مستخدمي Matrix على ذلك الـ homeserver.
- تقبل عمليات البحث عن الغرف معرّفات الغرف والأسماء المستعارة الصريحة مباشرة، ثم تعود إلى البحث في أسماء الغرف المنضم إليها لذلك الحساب.
- البحث باسم الغرفة المنضم إليها يجري بأفضل جهد. إذا تعذر حل اسم غرفة إلى معرّف أو اسم مستعار، فيتم تجاهله عند حل قائمة السماح وقت التشغيل.

## مرجع التكوين

تقبل الحقول الشبيهة بقوائم السماح (`groupAllowFrom`، و`dm.allowFrom`، و`groups.<room>.users`) معرّفات مستخدمي Matrix الكاملة (الأكثر أمانًا). تُحل مطابقات الدليل الدقيقة عند بدء التشغيل وكلما تغيرت قائمة السماح أثناء تشغيل المراقب؛ وتُتجاهل الإدخالات التي لا يمكن حلها وقت التشغيل. وتفضّل قوائم السماح للغرف معرّفات الغرف أو الأسماء المستعارة للسبب نفسه.

### الحساب والاتصال

- `enabled`: تفعيل القناة أو تعطيلها.
- `name`: تسمية عرض اختيارية للحساب.
- `defaultAccount`: معرّف الحساب المفضل عند تكوين عدة حسابات Matrix.
- `accounts`: تجاوزات مسماة لكل حساب. تُورّث قيم `channels.matrix` ذات المستوى الأعلى كافتراضيات.
- `homeserver`: عنوان URL للـ homeserver، مثل `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: السماح لهذا الحساب بالاتصال بـ `localhost` أو عناوين IP على LAN/Tailscale أو أسماء المضيفين الداخلية.
- `proxy`: عنوان URL اختياري لوكيل HTTP(S) لحركة Matrix. يدعم التجاوز لكل حساب.
- `userId`: معرّف مستخدم Matrix الكامل (`@bot:example.org`).
- `accessToken`: رمز وصول للمصادقة القائمة على الرمز. تُدعم قيم النص الصريح وSecretRef عبر موفري env/file/exec ([إدارة الأسرار](/ar/gateway/secrets)).
- `password`: كلمة مرور لتسجيل الدخول القائم على كلمة المرور. تُدعم قيم النص الصريح وSecretRef.
- `deviceId`: معرّف جهاز Matrix صريح.
- `deviceName`: اسم عرض الجهاز المستخدم وقت تسجيل الدخول بكلمة المرور.
- `avatarUrl`: عنوان URL للصورة الرمزية الذاتية المخزنة لمزامنة الملف الشخصي وتحديثات `profile set`.
- `initialSyncLimit`: الحد الأقصى لعدد الأحداث المجلبة أثناء مزامنة بدء التشغيل.

### التشفير

- `encryption`: تفعيل E2EE. الافتراضي: `false`.
- `startupVerification`: `"if-unverified"` (الافتراضي عندما تكون E2EE مفعلة) أو `"off"`. يطلب التحقق الذاتي تلقائيًا عند بدء التشغيل عندما يكون هذا الجهاز غير متحقق منه.
- `startupVerificationCooldownHours`: فترة التهدئة قبل طلب بدء التشغيل التلقائي التالي. الافتراضي: `24`.

### الوصول والسياسة

- `groupPolicy`: `"open"` أو `"allowlist"` أو `"disabled"`. الافتراضي: `"allowlist"`.
- `groupAllowFrom`: قائمة سماح لمعرّفات المستخدمين لحركة الغرف.
- `dm.enabled`: عند `false`، تجاهل جميع الرسائل المباشرة. الافتراضي: `true`.
- `dm.policy`: `"pairing"` (الافتراضي)، أو `"allowlist"`، أو `"open"`، أو `"disabled"`. تُطبّق بعد انضمام الروبوت وتصنيف الغرفة كرسالة مباشرة؛ ولا تؤثر في معالجة الدعوات.
- `dm.allowFrom`: قائمة سماح لمعرّفات المستخدمين لحركة الرسائل المباشرة.
- `dm.sessionScope`: `"per-user"` (الافتراضي) أو `"per-room"`.
- `dm.threadReplies`: تجاوز مخصص للرسائل المباشرة فقط لسَلسَلة الردود (`"off"`، و`"inbound"`، و`"always"`).
- `allowBots`: قبول الرسائل من حسابات روبوت Matrix المكوّنة الأخرى (`true` أو `"mentions"`).
- `allowlistOnly`: عند `true`، يفرض جميع سياسات الرسائل المباشرة النشطة (باستثناء `"disabled"`) وسياسات المجموعات `"open"` إلى `"allowlist"`. لا يغيّر سياسات `"disabled"`.
- `autoJoin`: `"always"` أو `"allowlist"` أو `"off"`. الافتراضي: `"off"`. ينطبق على كل دعوة Matrix، بما في ذلك الدعوات بنمط الرسائل المباشرة.
- `autoJoinAllowlist`: الغرف/الأسماء المستعارة المسموح بها عندما تكون `autoJoin` هي `"allowlist"`. تُحل إدخالات الأسماء المستعارة مقابل الـ homeserver، وليس مقابل الحالة التي تدعيها الغرفة المدعو إليها.
- `contextVisibility`: رؤية سياق إضافية (الافتراضي `"all"`، أو `"allowlist"`، أو `"allowlist_quote"`).

### سلوك الرد

- `replyToMode`: `"off"` أو `"first"` أو `"all"` أو `"batched"`.
- `threadReplies`: `"off"` أو `"inbound"` أو `"always"`.
- `threadBindings`: تجاوزات لكل قناة لتوجيه الجلسات المرتبطة بالسلاسل ودورة حياتها.
- `streaming`: `"off"` (الافتراضي)، أو `"partial"`، أو `"quiet"`، أو صيغة كائن `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`، و`false` ↔ `"off"`.
- `blockStreaming`: عند `true`، تُحفظ كتل المساعد المكتملة كرسائل تقدم منفصلة.
- `markdown`: تكوين اختياري لعرض Markdown للنص الصادر.
- `responsePrefix`: سلسلة اختيارية تُسبق بها الردود الصادرة.
- `textChunkLimit`: حجم الجزء الصادر بالأحرف عندما تكون `chunkMode: "length"`. الافتراضي: `4000`.
- `chunkMode`: `"length"` (الافتراضي، يقسم حسب عدد الأحرف) أو `"newline"` (يقسم عند حدود الأسطر).
- `historyLimit`: عدد رسائل الغرفة الحديثة المضمنة كـ `InboundHistory` عندما تؤدي رسالة غرفة إلى تشغيل الوكيل. يعود إلى `messages.groupChat.historyLimit`؛ الافتراضي الفعلي `0` (معطل).
- `mediaMaxMb`: حد حجم الوسائط بالميغابايت للإرسال الصادر والمعالجة الواردة.

### إعدادات التفاعل

- `ackReaction`: تجاوز تفاعل الإقرار لهذه القناة/الحساب.
- `ackReactionScope`: تجاوز النطاق (الافتراضي `"group-mentions"`، و`"group-all"`، و`"direct"`، و`"all"`، و`"none"`، و`"off"`).
- `reactionNotifications`: وضع إشعارات التفاعلات الواردة (الافتراضي `"own"`، و`"off"`).

### الأدوات والتجاوزات لكل غرفة

- `actions`: ضبط إتاحة الأدوات لكل إجراء (`messages`، و`reactions`، و`pins`، و`profile`، و`memberInfo`، و`channelInfo`، و`verification`).
- `groups`: خريطة سياسات لكل غرفة. تستخدم هوية الجلسة معرّف الغرفة الثابت بعد الحل. (`rooms` اسم مستعار قديم.)
  - `groups.<room>.account`: تقييد إدخال غرفة موروث واحد بحساب محدد.
  - `groups.<room>.allowBots`: تجاوز لكل غرفة لإعداد مستوى القناة (`true` أو `"mentions"`).
  - `groups.<room>.users`: قائمة سماح للمرسلين لكل غرفة.
  - `groups.<room>.tools`: تجاوزات السماح/الرفض للأدوات لكل غرفة.
  - `groups.<room>.autoReply`: تجاوز بوابة الإشارات لكل غرفة. يعطل `true` متطلبات الإشارة لتلك الغرفة؛ ويعيد `false` فرضها.
  - `groups.<room>.skills`: مرشح Skills لكل غرفة.
  - `groups.<room>.systemPrompt`: مقتطف موجه النظام لكل غرفة.

### إعدادات موافقة exec

- `execApprovals.enabled`: تسليم موافقات exec عبر مطالبات Matrix الأصلية.
- `execApprovals.approvers`: معرّفات مستخدمي Matrix المسموح لهم بالموافقة. يعود إلى `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (الافتراضي)، أو `"channel"`، أو `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: قوائم سماح اختيارية للوكلاء/الجلسات للتسليم.

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) - كل القنوات المدعومة
- [الإقران](/ar/channels/pairing) - مصادقة الرسائل المباشرة وتدفق الإقران
- [المجموعات](/ar/channels/groups) - سلوك دردشة المجموعات وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) - توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) - نموذج الوصول والتقوية
