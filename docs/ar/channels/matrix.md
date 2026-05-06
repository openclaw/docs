---
read_when:
    - إعداد Matrix في OpenClaw
    - تكوين E2EE والتحقق في Matrix
summary: حالة دعم Matrix وإعداده وأمثلة التكوين
title: مصفوفة
x-i18n:
    generated_at: "2026-05-06T07:43:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a35192ab3b5b9214fb3eb56f1c12737aa6966a481f43297fe0da1ac4396f917
    source_path: channels/matrix.md
    workflow: 16
---

Matrix هو Plugin قناة قابل للتنزيل لـ OpenClaw.
يستخدم `matrix-js-sdk` الرسمي ويدعم الرسائل المباشرة، والغرف، والسلاسل، والوسائط، والتفاعلات، والاستطلاعات، والموقع، وE2EE.

## التثبيت

ثبّت Matrix قبل تهيئة القناة:

```bash
openclaw plugins install @openclaw/matrix
```

من نسخة محلية:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

يسجّل `plugins install` الـ Plugin ويفعّله، لذلك لا تحتاج إلى خطوة منفصلة مثل `openclaw plugins enable matrix`. لا يزال الـ Plugin لا يفعل شيئًا حتى تهيئ القناة أدناه. راجع [Plugins](/ar/tools/plugin) لمعرفة سلوك Plugins العام وقواعد التثبيت.

## الإعداد

1. أنشئ حساب Matrix على خادمك المنزلي.
2. هيّئ `channels.matrix` باستخدام `homeserver` + `accessToken`، أو `homeserver` + `userId` + `password`.
3. أعد تشغيل Gateway.
4. ابدأ رسالة مباشرة مع البوت، أو ادعه إلى غرفة (راجع [الانضمام التلقائي](#auto-join) - لا تصل الدعوات الجديدة إلا عندما يسمح بها `autoJoin`).

### الإعداد التفاعلي

```bash
openclaw channels add
openclaw configure --section channels
```

يسأل المعالج عن: عنوان URL للخادم المنزلي، وطريقة المصادقة (رمز وصول أو كلمة مرور)، ومعرّف المستخدم (مصادقة كلمة المرور فقط)، واسم جهاز اختياري، وما إذا كنت تريد تمكين E2EE، وما إذا كنت تريد تهيئة الوصول إلى الغرف والانضمام التلقائي.

إذا كانت متغيرات البيئة المطابقة `MATRIX_*` موجودة بالفعل ولم يكن للحساب المحدد مصادقة محفوظة، يعرض المعالج اختصارًا عبر متغيرات البيئة. لحل أسماء الغرف قبل حفظ قائمة سماح، شغّل `openclaw channels resolve --channel matrix "Project Room"`. عند تمكين E2EE، يكتب المعالج الإعدادات ويشغّل التهيئة نفسها مثل [`openclaw matrix encryption setup`](#encryption-and-verification).

### الحد الأدنى للإعدادات

باستخدام الرمز:

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

باستخدام كلمة المرور (يُخزّن الرمز مؤقتًا بعد أول تسجيل دخول):

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

القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`. مع القيمة الافتراضية، لن يظهر البوت في غرف جديدة أو رسائل مباشرة من دعوات جديدة حتى تنضم يدويًا.

لا يستطيع OpenClaw معرفة وقت الدعوة ما إذا كانت الغرفة المدعو إليها رسالة مباشرة أو مجموعة، لذلك تمر كل الدعوات - بما في ذلك الدعوات الشبيهة بالرسائل المباشرة - عبر `autoJoin` أولًا. لا ينطبق `dm.policy` إلا لاحقًا، بعد أن ينضم البوت ويتم تصنيف الغرفة.

<Warning>
اضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` لتقييد الدعوات التي يقبلها البوت، أو `autoJoin: "always"` لقبول كل دعوة.

لا يقبل `autoJoinAllowlist` إلا أهدافًا مستقرة: `!roomId:server`، أو `#alias:server`، أو `*`. تُرفض أسماء الغرف العادية؛ وتُحل إدخالات الأسماء المستعارة مقابل الخادم المنزلي، لا مقابل الحالة التي تدعيها الغرفة المدعو إليها.
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

من الأفضل ملء قوائم السماح للرسائل المباشرة والغرف بمعرّفات مستقرة:

- الرسائل المباشرة (`dm.allowFrom`، و`groupAllowFrom`، و`groups.<room>.users`): استخدم `@user:server`. لا تُحل أسماء العرض إلا عندما يعيد دليل الخادم المنزلي تطابقًا واحدًا بالضبط.
- الغرف (`groups`، و`autoJoinAllowlist`): استخدم `!room:server` أو `#alias:server`. تُحل الأسماء بأفضل جهد مقابل الغرف التي تم الانضمام إليها؛ وتُتجاهل الإدخالات غير المحلولة وقت التشغيل.

### تسوية معرّف الحساب

يحوّل المعالج الاسم الودّي إلى معرّف حساب مُسوّى. على سبيل المثال، يصبح `Ops Bot` هو `ops-bot`. تُهرّب علامات الترقيم في أسماء متغيرات البيئة ذات النطاق حتى لا يتصادم حسابان: `-` → `_X2D_`، لذلك يُربط `ops-prod` بـ `MATRIX_OPS_X2D_PROD_*`.

### بيانات الاعتماد المخزنة مؤقتًا

يخزّن Matrix بيانات الاعتماد المخزنة مؤقتًا تحت `~/.openclaw/credentials/matrix/`:

- الحساب الافتراضي: `credentials.json`
- الحسابات المسماة: `credentials-<account>.json`

عند وجود بيانات اعتماد مخزنة مؤقتًا هناك، يتعامل OpenClaw مع Matrix على أنه مهيأ حتى إذا لم يكن رمز الوصول موجودًا في ملف الإعدادات - وهذا يغطي الإعداد، و`openclaw doctor`، وفحوصات حالة القناة.

### متغيرات البيئة

تُستخدم عندما لا يكون مفتاح الإعدادات المكافئ مضبوطًا. يستخدم الحساب الافتراضي أسماء بلا بادئة؛ وتستخدم الحسابات المسماة معرّف الحساب المُدرج قبل اللاحقة.

| الحساب الافتراضي       | الحساب المسمى (`<ID>` هو معرّف الحساب المُسوّى) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

بالنسبة إلى الحساب `ops`، تصبح الأسماء `MATRIX_OPS_HOMESERVER`، و`MATRIX_OPS_ACCESS_TOKEN`، وهكذا. تقرأ تدفقات CLI الواعية بالاسترداد (`verify backup restore`، و`verify device`، و`verify bootstrap`) متغيرات بيئة مفتاح الاسترداد عندما تمرر المفتاح عبر `--recovery-key-stdin`.

لا يمكن ضبط `MATRIX_HOMESERVER` من ملف `.env` في مساحة العمل؛ راجع [ملفات `.env` في مساحة العمل](/ar/gateway/security).

## مثال الإعدادات

خط أساس عملي مع إقران الرسائل المباشرة، وقائمة سماح الغرف، وE2EE:

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

بث ردود Matrix اختياري. يتحكم `streaming` في طريقة تسليم OpenClaw لرد المساعد أثناء التوليد؛ ويتحكم `blockStreaming` في ما إذا كان كل مقطع مكتمل يُحفظ كرسالة Matrix مستقلة.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

للاحتفاظ بمعاينات الإجابة الحية مع إخفاء أسطر الأدوات/التقدم المؤقتة، استخدم صيغة الكائن:

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
| `"partial"`       | يحرر رسالة نصية عادية واحدة في مكانها بينما يكتب النموذج المقطع الحالي. قد ترسل عملاء Matrix الافتراضية إشعارًا عند أول معاينة، لا عند التعديل النهائي.              |
| `"quiet"`         | مثل `"partial"` لكن الرسالة إشعار غير منبّه. لا يتلقى المستلمون إشعارًا إلا عندما تطابق قاعدة دفع لكل مستخدم التعديل النهائي (انظر أدناه). |

`blockStreaming` مستقل عن `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (الافتراضي)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | مسودة حية للمقطع الحالي، مع حفظ المقاطع المكتملة كرسائل | مسودة حية للمقطع الحالي، تُثبّت في مكانها |
| `"off"`                 | رسالة Matrix منبّهة واحدة لكل مقطع مكتمل                     | رسالة Matrix منبّهة واحدة للرد الكامل      |

ملاحظات:

- إذا تجاوزت المعاينة حد حجم الحدث الواحد في Matrix، يوقف OpenClaw بث المعاينة ويتراجع إلى التسليم النهائي فقط.
- تُرسل ردود الوسائط دائمًا كمرفقات بالطريقة المعتادة. إذا تعذر إعادة استخدام معاينة قديمة بأمان، يحجبها OpenClaw قبل إرسال رد الوسائط النهائي.
- تحديثات معاينة تقدم الأدوات مفعّلة افتراضيًا عندما يكون بث معاينة Matrix نشطًا. اضبط `streaming.preview.toolProgress: false` للاحتفاظ بتعديلات المعاينة لنص الإجابة مع إبقاء تقدم الأدوات على مسار التسليم العادي.
- تكلف تعديلات المعاينة استدعاءات إضافية لواجهة Matrix API. اترك `streaming: "off"` إذا كنت تريد ملف تعريف حدود معدلات أكثر تحفظًا.

## بيانات الموافقة الوصفية

مطالبات الموافقة الأصلية في Matrix هي أحداث `m.room.message` عادية مع محتوى حدث مخصص خاص بـ OpenClaw تحت `com.openclaw.approval`. يسمح Matrix بمفاتيح محتوى أحداث مخصصة، لذلك لا يزال العملاء الافتراضيون يعرضون متن النص، بينما يمكن للعملاء الواعيون بـ OpenClaw قراءة معرّف الموافقة المنظم، والنوع، والحالة، والقرارات المتاحة، وتفاصيل التنفيذ/Plugin.

عندما تكون مطالبة الموافقة طويلة جدًا لحدث Matrix واحد، يقسم OpenClaw النص المرئي إلى أجزاء ويرفق `com.openclaw.approval` بالجزء الأول فقط. ترتبط تفاعلات قرارات السماح/الرفض بذلك الحدث الأول، لذلك تحتفظ المطالبات الطويلة بهدف الموافقة نفسه مثل مطالبات الحدث الواحد.

### قواعد الدفع ذاتية الاستضافة للمعاينات النهائية الهادئة

لا يرسل `streaming: "quiet"` إشعارًا إلى المستلمين إلا بعد تثبيت مقطع أو دورة - يجب أن تطابق قاعدة دفع لكل مستخدم علامة المعاينة النهائية. راجع [قواعد دفع Matrix للمعاينات الهادئة](/ar/channels/matrix-push-rules) للحصول على الوصفة الكاملة (رمز المستلم، وفحص الدافع، وتثبيت القاعدة، وملاحظات كل خادم منزلي).

## غرف بوت إلى بوت

افتراضيًا، تُتجاهل رسائل Matrix الواردة من حسابات Matrix أخرى مهيأة في OpenClaw.

استخدم `allowBots` عندما تريد عمدًا مرور حركة Matrix بين الوكلاء:

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

- يقبل `allowBots: true` الرسائل من حسابات بوت Matrix مهيأة أخرى في الغرف والرسائل المباشرة المسموح بها.
- يقبل `allowBots: "mentions"` تلك الرسائل فقط عندما تذكر هذا البوت بوضوح في الغرف. لا تزال الرسائل المباشرة مسموحًا بها.
- يتجاوز `groups.<room>.allowBots` الإعداد على مستوى الحساب لغرفة واحدة.
- لا يزال OpenClaw يتجاهل الرسائل من معرّف مستخدم Matrix نفسه لتجنب حلقات الرد الذاتي.
- لا يعرّض Matrix علامة بوت أصلية هنا؛ يتعامل OpenClaw مع "مؤلف من بوت" على أنه "مرسل من حساب Matrix مهيأ آخر على Gateway OpenClaw هذا".

استخدم قوائم سماح غرف صارمة ومتطلبات ذكر عند تمكين حركة بوت إلى بوت في الغرف المشتركة.

## التشفير والتحقق

في الغرف المشفرة (E2EE)، تستخدم أحداث الصور الصادرة `thumbnail_file` بحيث تُشفّر معاينات الصور مع المرفق الكامل. لا تزال الغرف غير المشفرة تستخدم `thumbnail_url` العادي. لا حاجة إلى إعدادات - يكتشف الـ Plugin حالة E2EE تلقائيًا.

تقبل كل أوامر `openclaw matrix` الخيارات `--verbose` (تشخيصات كاملة)، و`--json` (مخرجات قابلة للقراءة آليًا)، و`--account <id>` (إعدادات متعددة الحسابات). تكون المخرجات موجزة افتراضيًا مع تسجيل SDK داخلي هادئ. تعرض الأمثلة أدناه الصيغة القياسية؛ أضف الخيارات حسب الحاجة.

### تمكين التشفير

```bash
openclaw matrix encryption setup
```

يمهّد تخزين الأسرار والتوقيع المتبادل، وينشئ نسخة احتياطية لمفاتيح الغرف عند الحاجة، ثم يطبع الحالة والخطوات التالية. أعلام مفيدة:

- `--recovery-key <key>` طبّق مفتاح استرداد قبل التمهيد (فضّل صيغة stdin الموثّقة أدناه)
- `--force-reset-cross-signing` تخلّص من هوية التوقيع المتبادل الحالية وأنشئ هوية جديدة (استخدمه بقصد فقط)

بالنسبة إلى حساب جديد، فعّل E2EE وقت الإنشاء:

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
- `Cross-signing verified`: يفيد SDK بأن التحقق تم عبر التوقيع المتبادل
- `Signed by owner`: موقّع بمفتاح التوقيع الذاتي الخاص بك (تشخيصي فقط)

تصبح `Verified by owner` بقيمة `yes` فقط عندما تكون `Cross-signing verified` بقيمة `yes`. لا تكفي الثقة المحلية أو توقيع المالك وحده.

يعيد `--allow-degraded-local-state` تشخيصات بأفضل جهد دون تجهيز حساب Matrix أولاً؛ وهذا مفيد للفحوصات غير المتصلة أو المكوّنة جزئياً.

### التحقق من هذا الجهاز باستخدام مفتاح استرداد

مفتاح الاسترداد حساس - مرّره عبر stdin بدلاً من تمريره على سطر الأوامر. اضبط `MATRIX_RECOVERY_KEY` (أو `MATRIX_<ID>_RECOVERY_KEY` لحساب مسمّى):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

يعرض الأمر ثلاث حالات:

- `Recovery key accepted`: قبل Matrix المفتاح لتخزين الأسرار أو ثقة الجهاز.
- `Backup usable`: يمكن تحميل نسخة مفاتيح الغرف الاحتياطية باستخدام مادة الاسترداد الموثوقة.
- `Device verified by owner`: يملك هذا الجهاز ثقة هوية التوقيع المتبادل الكاملة في Matrix.

يخرج بقيمة غير صفرية عندما تكون ثقة الهوية الكاملة غير مكتملة، حتى إذا فتح مفتاح الاسترداد مادة النسخة الاحتياطية. في هذه الحالة، أكمل التحقق الذاتي من عميل Matrix آخر:

```bash
openclaw matrix verify self
```

ينتظر `verify self` ظهور `Cross-signing verified: yes` قبل الخروج بنجاح. استخدم `--timeout-ms <ms>` لضبط مدة الانتظار.

صيغة المفتاح الحرفية `openclaw matrix verify device "<recovery-key>"` مقبولة أيضاً، لكن المفتاح ينتهي في سجل أوامر الصدفة لديك.

### تمهيد التوقيع المتبادل أو إصلاحه

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` هو أمر الإصلاح والإعداد للحسابات المشفّرة. بالترتيب، يقوم بما يلي:

- يمهّد تخزين الأسرار، مع إعادة استخدام مفتاح استرداد موجود عندما يكون ذلك ممكناً
- يمهّد التوقيع المتبادل ويرفع المفاتيح العامة الناقصة
- يعلّم الجهاز الحالي ويوقّعه توقيعاً متبادلاً
- ينشئ نسخة احتياطية لمفاتيح الغرف على جانب الخادم إذا لم تكن موجودة بالفعل

إذا كان الخادم المنزلي يتطلب UIA لرفع مفاتيح التوقيع المتبادل، يجرّب OpenClaw عدم استخدام مصادقة أولاً، ثم `m.login.dummy`، ثم `m.login.password` (يتطلب `channels.matrix.password`).

أعلام مفيدة:

- `--recovery-key-stdin` (استخدمه مع `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) أو `--recovery-key <key>`
- `--force-reset-cross-signing` للتخلص من هوية التوقيع المتبادل الحالية (بقصد فقط)

### نسخة مفاتيح الغرف الاحتياطية

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

يعرض `backup status` ما إذا كانت توجد نسخة احتياطية على جانب الخادم وما إذا كان هذا الجهاز يستطيع فك تشفيرها. يستورد `backup restore` مفاتيح الغرف المنسوخة احتياطياً إلى مخزن التشفير المحلي؛ إذا كان مفتاح الاسترداد موجوداً بالفعل على القرص فيمكنك حذف `--recovery-key-stdin`.

لاستبدال نسخة احتياطية معطّلة بخط أساس جديد (مع قبول فقدان السجل القديم غير القابل للاسترداد؛ ويمكنه أيضاً إعادة إنشاء تخزين الأسرار إذا كان سر النسخة الاحتياطية الحالية غير قابل للتحميل):

```bash
openclaw matrix verify backup reset --yes
```

أضف `--rotate-recovery-key` فقط عندما تريد عمداً أن يتوقف مفتاح الاسترداد السابق عن فتح خط أساس النسخة الاحتياطية الجديد.

### سرد عمليات التحقق وطلبها والرد عليها

```bash
openclaw matrix verify list
```

يسرد طلبات التحقق المعلّقة للحساب المحدد.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

يرسل طلب تحقق من حساب OpenClaw هذا. يطلب `--own-user` تحققاً ذاتياً (تقبل المطالبة في عميل Matrix آخر للمستخدم نفسه)؛ وتستهدف `--user-id`/`--device-id`/`--room-id` شخصاً آخر. لا يمكن دمج `--own-user` مع أعلام الاستهداف الأخرى.

للتعامل مع دورة الحياة على مستوى أدنى - عادةً أثناء متابعة الطلبات الواردة من عميل آخر - تعمل هذه الأوامر على طلب محدد `<id>` (يطبع بواسطة `verify list` و`verify request`):

| الأمر                                      | الغرض                                                              |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | قبول طلب وارد                                                       |
| `openclaw matrix verify start <id>`        | بدء تدفق SAS                                                        |
| `openclaw matrix verify sas <id>`          | طباعة رموز SAS التعبيرية أو الأرقام العشرية                         |
| `openclaw matrix verify confirm-sas <id>`  | تأكيد أن SAS يطابق ما يعرضه العميل الآخر                            |
| `openclaw matrix verify mismatch-sas <id>` | رفض SAS عندما لا تتطابق الرموز التعبيرية أو الأرقام العشرية          |
| `openclaw matrix verify cancel <id>`       | إلغاء؛ يقبل اختيارياً `--reason <text>` و`--code <matrix-code>`      |

تقبل `accept` و`start` و`sas` و`confirm-sas` و`mismatch-sas` و`cancel` جميعاً `--user-id` و`--room-id` كتلميحات متابعة DM عندما يكون التحقق مثبتاً في غرفة رسالة مباشرة محددة.

### ملاحظات الحسابات المتعددة

من دون `--account <id>`، تستخدم أوامر Matrix في CLI الحساب الافتراضي الضمني. إذا كانت لديك حسابات مسمّاة متعددة ولم تضبط `channels.matrix.defaultAccount`، فسترفض التخمين وتطلب منك الاختيار. عندما يكون E2EE معطلاً أو غير متاح لحساب مسمّى، تشير الأخطاء إلى مفتاح إعدادات ذلك الحساب، على سبيل المثال `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="سلوك بدء التشغيل">
    مع `encryption: true`، تكون القيمة الافتراضية لـ `startupVerification` هي `"if-unverified"`. عند بدء التشغيل، يطلب الجهاز غير المتحقق منه تحققاً ذاتياً في عميل Matrix آخر، مع تخطي التكرارات وتطبيق فترة تهدئة (24 ساعة افتراضياً). اضبط ذلك باستخدام `startupVerificationCooldownHours` أو عطّله باستخدام `startupVerification: "off"`.

    يشغّل بدء التشغيل أيضاً تمريرة تمهيد تشفير محافظة تعيد استخدام تخزين الأسرار الحالي وهوية التوقيع المتبادل الحالية. إذا كانت حالة التمهيد معطّلة، يحاول OpenClaw إصلاحاً محروساً حتى من دون `channels.matrix.password`؛ وإذا كان الخادم المنزلي يتطلب كلمة مرور UIA، يسجّل بدء التشغيل تحذيراً ويبقى غير قاتل. يتم الحفاظ على الأجهزة الموقّعة مسبقاً من المالك.

    راجع [ترحيل Matrix](/ar/channels/matrix-migration) للاطلاع على تدفق الترقية الكامل.

  </Accordion>

  <Accordion title="إشعارات التحقق">
    ينشر Matrix إشعارات دورة حياة التحقق في غرفة التحقق الصارمة للرسائل المباشرة كرسائل `m.notice`: الطلب، والجاهزية (مع إرشاد "التحقق بالرموز التعبيرية")، والبدء/الإكمال، وتفاصيل SAS (الرموز التعبيرية/الأرقام العشرية) عند توفرها.

    يتم تتبع الطلبات الواردة من عميل Matrix آخر وقبولها تلقائياً. بالنسبة إلى التحقق الذاتي، يبدأ OpenClaw تدفق SAS تلقائياً ويؤكد جانبه بمجرد توفر التحقق بالرموز التعبيرية - ما زلت بحاجة إلى المقارنة وتأكيد "إنهما متطابقان" في عميل Matrix لديك.

    لا تُمرّر إشعارات نظام التحقق إلى مسار دردشة الوكيل.

  </Accordion>

  <Accordion title="جهاز Matrix محذوف أو غير صالح">
    إذا قال `verify status` إن الجهاز الحالي لم يعد مدرجاً على الخادم المنزلي، فأنشئ جهاز OpenClaw Matrix جديداً. لتسجيل الدخول بكلمة مرور:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    بالنسبة إلى مصادقة الرمز، أنشئ رمز وصول جديداً في عميل Matrix أو واجهة الإدارة لديك، ثم حدّث OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    استبدل `assistant` بمعرّف الحساب من الأمر الفاشل، أو احذف `--account` للحساب الافتراضي.

  </Accordion>

  <Accordion title="نظافة الأجهزة">
    يمكن أن تتراكم الأجهزة القديمة المُدارة بواسطة OpenClaw. اسردها ونظّفها:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="مخزن التشفير">
    يستخدم Matrix E2EE مسار تشفير Rust الرسمي في `matrix-js-sdk` مع `fake-indexeddb` كطبقة توافق IndexedDB. تستمر حالة التشفير في `crypto-idb-snapshot.json` (بأذونات ملفات مقيّدة).

    توجد حالة وقت التشغيل المشفّرة ضمن `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` وتشمل مخزن المزامنة، ومخزن التشفير، ومفتاح الاسترداد، ولقطة IDB، وروابط المحادثات، وحالة تحقق بدء التشغيل. عندما يتغير الرمز وتبقى هوية الحساب كما هي، يعيد OpenClaw استخدام أفضل جذر موجود حتى تظل الحالة السابقة مرئية.

  </Accordion>
</AccordionGroup>

## إدارة الملف الشخصي

حدّث الملف الشخصي الذاتي في Matrix للحساب المحدد:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

يمكنك تمرير كلا الخيارين في استدعاء واحد. يقبل Matrix عناوين URL للصور الرمزية بصيغة `mxc://` مباشرة؛ وعندما تمرّر `http://` أو `https://`، يرفع OpenClaw الملف أولاً ويخزّن عنوان URL المحلول بصيغة `mxc://` في `channels.matrix.avatarUrl` (أو التجاوز الخاص بكل حساب).

## المحادثات المتفرعة

يدعم Matrix محادثات Matrix المتفرعة الأصلية لكل من الردود التلقائية وإرسالات أداة الرسائل. يتحكم مفتاحان مستقلان في السلوك:

### توجيه الجلسة (`sessionScope`)

يحدد `dm.sessionScope` كيفية ربط غرف Matrix DM بجلسات OpenClaw:

- `"per-user"` (افتراضي): تشترك جميع غرف DM التي لها النظير الموجّه نفسه في جلسة واحدة.
- `"per-room"`: تحصل كل غرفة Matrix DM على مفتاح جلستها الخاص، حتى عندما يكون النظير نفسه.

تتغلب روابط المحادثة الصريحة دائماً على `sessionScope`، لذلك تحتفظ الغرف والمحادثات المتفرعة المرتبطة بجلسة الهدف المختارة.

### الردود المتفرعة (`threadReplies`)

يحدد `threadReplies` أين ينشر البوت رده:

- `"off"`: تكون الردود في المستوى الأعلى. تبقى الرسائل الواردة المتفرعة على جلسة الأصل.
- `"inbound"`: يرد داخل محادثة متفرعة فقط عندما تكون الرسالة الواردة موجودة بالفعل في تلك المحادثة المتفرعة.
- `"always"`: يرد داخل محادثة متفرعة متجذّرة في الرسالة المحفّزة؛ ويتم توجيه تلك المحادثة عبر جلسة مطابقة ذات نطاق محادثة متفرعة منذ أول محفّز فصاعداً.

يتجاوز `dm.threadReplies` هذا للرسائل المباشرة فقط - على سبيل المثال، للإبقاء على محادثات الغرف المتفرعة معزولة مع إبقاء الرسائل المباشرة مسطّحة.

### وراثة المحادثات المتفرعة وأوامر slash

- تتضمن الرسائل الواردة ذات السلاسل رسالة جذر السلسلة كسياق إضافي للوكيل.
- ترث عمليات الإرسال عبر أداة الرسائل سلسلة Matrix الحالية تلقائيًا عند استهداف الغرفة نفسها (أو هدف مستخدم الرسالة المباشرة نفسه)، ما لم يتم توفير `threadId` صريح.
- لا تعمل إعادة استخدام هدف مستخدم الرسائل المباشرة إلا عندما تثبت بيانات الجلسة الوصفية الحالية نظير الرسائل المباشرة نفسه على حساب Matrix نفسه؛ وإلا يعود OpenClaw إلى التوجيه العادي المقيّد بنطاق المستخدم.
- تعمل `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` و`/acp spawn` المرتبطة بالسلاسل كلها في غرف Matrix والرسائل المباشرة.
- تنشئ `/focus` في المستوى الأعلى سلسلة Matrix جديدة وتربطها بالجلسة الهدف عند تفعيل `threadBindings.spawnSessions`.
- يؤدي تشغيل `/focus` أو `/acp spawn --thread here` داخل سلسلة Matrix موجودة إلى ربط تلك السلسلة في مكانها.

عندما يكتشف OpenClaw أن غرفة رسالة مباشرة في Matrix تتعارض مع غرفة رسالة مباشرة أخرى على الجلسة المشتركة نفسها، ينشر `m.notice` لمرة واحدة في تلك الغرفة يشير إلى مخرج `/focus` ويقترح تغيير `dm.sessionScope`. لا يظهر الإشعار إلا عند تفعيل روابط السلاسل.

## روابط محادثات ACP

يمكن تحويل غرف Matrix والرسائل المباشرة وسلاسل Matrix الموجودة إلى مساحات عمل ACP دائمة من دون تغيير سطح الدردشة.

تدفق المشغّل السريع:

- شغّل `/acp spawn codex --bind here` داخل رسالة Matrix المباشرة أو الغرفة أو السلسلة الموجودة التي تريد متابعة استخدامها.
- في رسالة Matrix مباشرة أو غرفة من المستوى الأعلى، يبقى سطح الدردشة هو الرسالة المباشرة/الغرفة الحالية، وتُوجّه الرسائل المستقبلية إلى جلسة ACP المنشأة.
- داخل سلسلة Matrix موجودة، يربط `--bind here` تلك السلسلة الحالية في مكانها.
- يعيد `/new` و`/reset` ضبط جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الربط.

ملاحظات:

- لا ينشئ `--bind here` سلسلة Matrix فرعية.
- يتحكم `threadBindings.spawnSessions` في `/acp spawn --thread auto|here`، حيث يحتاج OpenClaw إلى إنشاء سلسلة Matrix فرعية أو ربطها.

### إعداد ربط السلاسل

يرث Matrix الإعدادات الافتراضية العامة من `session.threadBindings`، ويدعم أيضًا التجاوزات لكل قناة:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

تكون عمليات إنشاء الجلسات المرتبطة بسلاسل Matrix مفعّلة افتراضيًا:

- عيّن `threadBindings.spawnSessions: false` لمنع `/focus` في المستوى الأعلى و`/acp spawn --thread auto|here` من إنشاء/ربط سلاسل Matrix.
- عيّن `threadBindings.defaultSpawnContext: "isolated"` عندما يجب ألا تنسخ عمليات إنشاء سلاسل الوكلاء الفرعيين الأصلية نص الجلسة الأب.

## التفاعلات

يدعم Matrix التفاعلات الصادرة، وإشعارات التفاعلات الواردة، وتفاعلات الإقرار.

تخضع أدوات التفاعل الصادرة إلى `channels.matrix.actions.reactions`:

- يضيف `react` تفاعلًا إلى حدث Matrix.
- يعرض `reactions` ملخص التفاعل الحالي لحدث Matrix.
- يزيل `emoji=""` تفاعلات البوت الخاصة على ذلك الحدث.
- يزيل `remove: true` تفاعل الرموز التعبيرية المحدد فقط من البوت.

**ترتيب الحل** (تفوز أول قيمة معرّفة):

| الإعداد                  | الترتيب                                                                          |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | لكل حساب → القناة → `messages.ackReaction` → رجوع احتياطي إلى رمز تعبيري لهوية الوكيل |
| `ackReactionScope`      | لكل حساب → القناة → `messages.ackReactionScope` → الافتراضي `"group-mentions"` |
| `reactionNotifications` | لكل حساب → القناة → الافتراضي `"own"`                                           |

يمرر `reactionNotifications: "own"` أحداث `m.reaction` المضافة عندما تستهدف رسائل Matrix التي كتبها البوت؛ ويعطّل `"off"` أحداث نظام التفاعلات. لا تُنشأ أحداث نظام من عمليات إزالة التفاعل لأن Matrix يعرضها كتنقيحات، وليس كعمليات إزالة `m.reaction` مستقلة.

## سياق السجل

- يتحكم `channels.matrix.historyLimit` في عدد رسائل الغرفة الحديثة التي تُضمّن كـ `InboundHistory` عندما تشغّل رسالة غرفة Matrix الوكيل. يرجع إلى `messages.groupChat.historyLimit`؛ وإذا لم يُضبط كلاهما، تكون القيمة الافتراضية الفعلية `0`. عيّن `0` للتعطيل.
- سجل غرف Matrix خاص بالغرفة فقط. تستمر الرسائل المباشرة في استخدام سجل الجلسة العادي.
- سجل غرف Matrix معلّق فقط: يخزّن OpenClaw رسائل الغرفة التي لم تشغّل ردًا بعد، ثم يأخذ لقطة لتلك النافذة عند وصول إشارة ذكر أو مشغّل آخر.
- لا تُضمّن رسالة التشغيل الحالية في `InboundHistory`؛ بل تبقى في متن الرسالة الواردة الرئيسي لذلك الدور.
- تعيد محاولات الحدث نفسه في Matrix استخدام لقطة السجل الأصلية بدل الانزياح إلى رسائل غرفة أحدث.

## رؤية السياق

يدعم Matrix عنصر التحكم المشترك `contextVisibility` لسياق الغرفة التكميلي مثل نص الرد المجلب، وجذور السلاسل، والسجل المعلّق.

- `contextVisibility: "all"` هو الافتراضي. يُحتفظ بالسياق التكميلي كما ورد.
- `contextVisibility: "allowlist"` يرشّح السياق التكميلي إلى المرسلين المسموح لهم عبر فحوصات قائمة السماح النشطة للغرفة/المستخدم.
- يتصرف `contextVisibility: "allowlist_quote"` مثل `allowlist`، لكنه يحتفظ مع ذلك برد مقتبس صريح واحد.

يؤثر هذا الإعداد في رؤية السياق التكميلي، وليس في ما إذا كانت الرسالة الواردة نفسها يمكنها تشغيل رد.
لا يزال تفويض التشغيل يأتي من `groupPolicy` و`groups` و`groupAllowFrom` وإعدادات سياسة الرسائل المباشرة.

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

لإسكات الرسائل المباشرة تمامًا مع إبقاء الغرف عاملة، عيّن `dm.enabled: false`:

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

راجع [المجموعات](/ar/channels/groups) للتعرف على سلوك بوابة الذكر وقائمة السماح.

مثال الاقتران لرسائل Matrix المباشرة:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

إذا استمر مستخدم Matrix غير معتمد في مراسلتك قبل الموافقة، يعيد OpenClaw استخدام رمز الاقتران المعلّق نفسه وقد يرسل رد تذكير بعد فترة تهدئة قصيرة بدل إصدار رمز جديد.

راجع [الاقتران](/ar/channels/pairing) لتدفق اقتران الرسائل المباشرة المشترك وتخطيط التخزين.

## إصلاح الغرفة المباشرة

إذا خرجت حالة الرسائل المباشرة عن المزامنة، فقد ينتهي الأمر بـ OpenClaw مع خرائط `m.direct` قديمة تشير إلى غرف فردية قديمة بدل الرسالة المباشرة النشطة. افحص الخريطة الحالية لنظير:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

أصلحها:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

يقبل كلا الأمرين `--account <id>` لإعدادات الحسابات المتعددة. تدفق الإصلاح:

- يفضّل رسالة مباشرة صارمة 1:1 معيّنة مسبقًا في `m.direct`
- يرجع إلى أي رسالة مباشرة صارمة 1:1 منضم إليها حاليًا مع ذلك المستخدم
- ينشئ غرفة مباشرة جديدة ويعيد كتابة `m.direct` إذا لم توجد رسالة مباشرة سليمة

لا يحذف الغرف القديمة تلقائيًا. يختار الرسالة المباشرة السليمة ويحدّث الخريطة بحيث تستهدف عمليات إرسال Matrix المستقبلية، وإشعارات التحقق، وتدفقات الرسائل المباشرة الأخرى الغرفة الصحيحة.

## موافقات التنفيذ

يمكن أن يعمل Matrix كعميل موافقة أصلي. اضبطه ضمن `channels.matrix.execApprovals` (أو `channels.matrix.accounts.<account>.execApprovals` لتجاوز لكل حساب):

- `enabled`: يسلّم الموافقات عبر مطالبات Matrix الأصلية. عند عدم ضبطه أو ضبطه على `"auto"`، يفعّل Matrix نفسه تلقائيًا بمجرد إمكانية حلّ موافق واحد على الأقل. عيّن `false` للتعطيل صراحة.
- `approvers`: معرّفات مستخدمي Matrix (`@owner:example.org`) المسموح لهم بالموافقة على طلبات التنفيذ. اختياري - يرجع إلى `channels.matrix.dm.allowFrom`.
- `target`: أين تذهب المطالبات. يرسل `"dm"` (الافتراضي) إلى الرسائل المباشرة للموافقين؛ ويرسل `"channel"` إلى غرفة Matrix أو الرسالة المباشرة الأصلية؛ ويرسل `"both"` إلى كليهما.
- `agentFilter` / `sessionFilter`: قوائم سماح اختيارية للوكلاء/الجلسات التي تشغّل التسليم عبر Matrix.

يختلف التفويض قليلًا بين أنواع الموافقة:

- تستخدم **موافقات التنفيذ** `execApprovals.approvers`، مع الرجوع إلى `dm.allowFrom`.
- تفوّض **موافقات Plugin** عبر `dm.allowFrom` فقط.

يشترك كلا النوعين في اختصارات تفاعلات Matrix وتحديثات الرسائل. يرى الموافقون اختصارات تفاعل على رسالة الموافقة الأساسية:

- `✅` السماح مرة واحدة
- `❌` الرفض
- `♾️` السماح دائمًا (عندما تسمح سياسة التنفيذ الفعلية بذلك)

أوامر الشرطة المائلة الاحتياطية: `/approve <id> allow-once`، `/approve <id> allow-always`، `/approve <id> deny`.

لا يستطيع الموافقة أو الرفض إلا الموافقون المحلولون. يتضمن تسليم القناة لموافقات التنفيذ نص الأمر - لا تفعّل `channel` أو `both` إلا في الغرف الموثوقة.

ذو صلة: [موافقات التنفيذ](/ar/tools/exec-approvals).

## أوامر الشرطة المائلة

تعمل أوامر الشرطة المائلة (`/new` و`/reset` و`/model` و`/focus` و`/unfocus` و`/agents` و`/session` و`/acp` و`/approve` وما إلى ذلك) مباشرة في الرسائل المباشرة. في الغرف، يتعرف OpenClaw أيضًا على الأوامر المسبوقة بذكر Matrix الخاص بالبوت، لذلك يشغّل `@bot:server /new` مسار الأمر من دون تعبير منتظم مخصص للذكر. يبقي هذا البوت مستجيبًا لمنشورات `@mention /command` بأسلوب الغرف التي يصدرها Element والعملاء المشابهون عندما يكمل المستخدم اسم البوت بالضغط على المفتاح قبل كتابة الأمر.

لا تزال قواعد التفويض تنطبق: يجب أن يستوفي مرسلو الأوامر سياسات قائمة السماح/المالك نفسها للرسائل المباشرة أو الغرف كما في الرسائل العادية.

## الحسابات المتعددة

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

- تعمل قيم `channels.matrix` في المستوى الأعلى كقيم افتراضية للحسابات المسماة ما لم يتجاوزها حساب.
- احصر إدخال غرفة موروثًا في حساب محدد باستخدام `groups.<room>.account`. الإدخالات من دون `account` تكون مشتركة عبر الحسابات؛ ولا يزال `account: "default"` يعمل عندما يكون الحساب الافتراضي مضبوطًا في المستوى الأعلى.

**اختيار الحساب الافتراضي:**

- عيّن `defaultAccount` لاختيار الحساب المسمى الذي تفضله عمليات التوجيه الضمنية، والفحص، وأوامر CLI.
- إذا كانت لديك حسابات متعددة وكان أحدها اسمه حرفيًا `default`، يستخدمه OpenClaw ضمنيًا حتى عندما لا يكون `defaultAccount` مضبوطًا.
- إذا كانت لديك حسابات مسماة متعددة ولم يُحدَّد حساب افتراضي، ترفض أوامر CLI التخمين - عيّن `defaultAccount` أو مرّر `--account <id>`.
- لا يُعامل كتلة `channels.matrix.*` في المستوى الأعلى كحساب `default` ضمني إلا عندما يكتمل توثيقها (`homeserver` + `accessToken`، أو `homeserver` + `userId` + `password`). تبقى الحسابات المسماة قابلة للاكتشاف من `homeserver` + `userId` بمجرد أن تغطي بيانات الاعتماد المخزّنة مؤقتًا التوثيق.

**الترقية:**

- عندما يرقّي OpenClaw إعداد حساب واحد إلى حسابات متعددة أثناء الإصلاح أو الإعداد، فإنه يحافظ على الحساب المسمى الموجود إن وجد أو إذا كان `defaultAccount` يشير بالفعل إلى واحد. تنتقل فقط مفاتيح توثيق/تمهيد Matrix إلى الحساب المرقّى؛ وتبقى مفاتيح سياسة التسليم المشتركة في المستوى الأعلى.

راجع [مرجع الإعداد](/ar/gateway/config-channels#multi-account-all-channels) لنمط الحسابات المتعددة المشترك.

## خوادم المنازل الخاصة/الشبكات المحلية

بشكل افتراضي، يحظر OpenClaw خوادم Matrix المنزلية الخاصة/الداخلية لحماية SSRF ما لم
توافق صراحة لكل حساب.

إذا كان خادمك المنزلي يعمل على المضيف المحلي، أو عنوان IP لشبكة محلية/Tailscale، أو اسم مضيف داخلي، ففعّل
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

يسمح هذا الاشتراك الاختياري فقط بالأهداف الخاصة/الداخلية الموثوقة. تظل خوادم homeserver العامة ذات النص الصريح مثل
`http://matrix.example.org:8008` محظورة. يفضّل استخدام `https://` كلما أمكن.

## تمرير زيارات Matrix عبر وكيل

إذا كان نشر Matrix لديك يحتاج إلى وكيل HTTP(S) صريح للخروج، فاضبط `channels.matrix.proxy`:

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

يمكن للحسابات المسماة تجاوز الإعداد الافتراضي على المستوى الأعلى باستخدام `channels.matrix.accounts.<id>.proxy`.
يستخدم OpenClaw إعداد الوكيل نفسه لزيارات Matrix وقت التشغيل وفحوصات حالة الحساب.

## حل الأهداف

يقبل Matrix صيغ الأهداف هذه في أي موضع يطلب فيه OpenClaw هدف غرفة أو مستخدم:

- المستخدمون: `@user:server`، أو `user:@user:server`، أو `matrix:user:@user:server`
- الغرف: `!room:server`، أو `room:!room:server`، أو `matrix:room:!room:server`
- الأسماء المستعارة: `#alias:server`، أو `channel:#alias:server`، أو `matrix:channel:#alias:server`

معرّفات غرف Matrix حساسة لحالة الأحرف. استخدم حالة أحرف معرّف الغرفة الدقيقة من Matrix
عند تكوين أهداف التسليم الصريحة، أو مهام cron، أو الارتباطات، أو قوائم السماح.
يبقي OpenClaw مفاتيح الجلسات الداخلية بصيغة معيارية للتخزين، لذلك لا تُعد تلك المفاتيح ذات الأحرف الصغيرة
مصدرًا موثوقًا لمعرّفات تسليم Matrix.

يستخدم البحث المباشر في الدليل حساب Matrix المسجل دخوله:

- تستعلم عمليات البحث عن المستخدمين دليل مستخدمي Matrix على ذلك الخادم homeserver.
- تقبل عمليات البحث عن الغرف معرّفات الغرف والأسماء المستعارة الصريحة مباشرة، ثم تعود إلى البحث في أسماء الغرف المنضم إليها لذلك الحساب.
- البحث باسم الغرفة المنضم إليها هو جهد أفضل. إذا تعذر حل اسم غرفة إلى معرّف أو اسم مستعار، فيتم تجاهله أثناء حل قائمة السماح وقت التشغيل.

## مرجع التكوين

تقبل الحقول ذات نمط قائمة السماح (`groupAllowFrom`، و`dm.allowFrom`، و`groups.<room>.users`) معرّفات مستخدمي Matrix الكاملة (الأكثر أمانًا). يتم حل مطابقات الدليل الدقيقة عند بدء التشغيل وكلما تغيّرت قائمة السماح أثناء تشغيل المراقب؛ ويتم تجاهل الإدخالات التي لا يمكن حلها وقت التشغيل. تفضّل قوائم سماح الغرف معرّفات الغرف أو الأسماء المستعارة للسبب نفسه.

### الحساب والاتصال

- `enabled`: تفعيل القناة أو تعطيلها.
- `name`: تسمية عرض اختيارية للحساب.
- `defaultAccount`: معرّف الحساب المفضل عند تكوين عدة حسابات Matrix.
- `accounts`: تجاوزات مسماة لكل حساب. تُورّث قيم `channels.matrix` ذات المستوى الأعلى كإعدادات افتراضية.
- `homeserver`: عنوان URL لخادم homeserver، مثل `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: السماح لهذا الحساب بالاتصال بـ `localhost`، أو عناوين IP للشبكة المحلية/Tailscale، أو أسماء المضيفين الداخلية.
- `proxy`: عنوان URL اختياري لوكيل HTTP(S) لزيارات Matrix. يدعم التجاوز لكل حساب.
- `userId`: معرّف مستخدم Matrix الكامل (`@bot:example.org`).
- `accessToken`: رمز وصول للمصادقة المستندة إلى الرموز. تُدعم قيم النص الصريح وSecretRef عبر مزودي env/file/exec ([إدارة الأسرار](/ar/gateway/secrets)).
- `password`: كلمة مرور لتسجيل الدخول المستند إلى كلمة المرور. تُدعم قيم النص الصريح وSecretRef.
- `deviceId`: معرّف جهاز Matrix صريح.
- `deviceName`: اسم عرض الجهاز المستخدم عند تسجيل الدخول بكلمة المرور.
- `avatarUrl`: عنوان URL للصورة الشخصية الذاتية المخزّن لمزامنة الملف الشخصي وتحديثات `profile set`.
- `initialSyncLimit`: الحد الأقصى لعدد الأحداث التي تُجلب أثناء مزامنة بدء التشغيل.

### التشفير

- `encryption`: تفعيل E2EE. الافتراضي: `false`.
- `startupVerification`: `"if-unverified"` (الافتراضي عند تشغيل E2EE) أو `"off"`. يطلب تلقائيًا التحقق الذاتي عند بدء التشغيل عندما يكون هذا الجهاز غير موثّق.
- `startupVerificationCooldownHours`: فترة الانتظار قبل طلب بدء التشغيل التلقائي التالي. الافتراضي: `24`.

### الوصول والسياسة

- `groupPolicy`: `"open"`، أو `"allowlist"`، أو `"disabled"`. الافتراضي: `"allowlist"`.
- `groupAllowFrom`: قائمة سماح بمعرّفات المستخدمين لزيارات الغرف.
- `dm.enabled`: عند `false`، تجاهل جميع الرسائل المباشرة. الافتراضي: `true`.
- `dm.policy`: `"pairing"` (الافتراضي)، أو `"allowlist"`، أو `"open"`، أو `"disabled"`. تُطبق بعد انضمام الروبوت وتصنيف الغرفة كرسالة مباشرة؛ ولا تؤثر في التعامل مع الدعوات.
- `dm.allowFrom`: قائمة سماح بمعرّفات المستخدمين لزيارات الرسائل المباشرة.
- `dm.sessionScope`: `"per-user"` (الافتراضي) أو `"per-room"`.
- `dm.threadReplies`: تجاوز خاص بالرسائل المباشرة لتسلسل الردود (`"off"`، أو `"inbound"`، أو `"always"`).
- `allowBots`: قبول الرسائل من حسابات روبوت Matrix الأخرى المكوّنة (`true` أو `"mentions"`).
- `allowlistOnly`: عند `true`، يفرض تحويل جميع سياسات الرسائل المباشرة النشطة (باستثناء `"disabled"`) وسياسات المجموعات `"open"` إلى `"allowlist"`. لا يغيّر سياسات `"disabled"`.
- `autoJoin`: `"always"`، أو `"allowlist"`، أو `"off"`. الافتراضي: `"off"`. ينطبق على كل دعوة Matrix، بما في ذلك الدعوات بنمط الرسائل المباشرة.
- `autoJoinAllowlist`: الغرف/الأسماء المستعارة المسموح بها عندما تكون `autoJoin` هي `"allowlist"`. يتم حل إدخالات الأسماء المستعارة مقابل الخادم homeserver، وليس مقابل الحالة التي تدّعيها الغرفة المدعو إليها.
- `contextVisibility`: رؤية السياق التكميلية (الافتراضي `"all"`، أو `"allowlist"`، أو `"allowlist_quote"`).

### سلوك الرد

- `replyToMode`: `"off"`، أو `"first"`، أو `"all"`، أو `"batched"`.
- `threadReplies`: `"off"`، أو `"inbound"`، أو `"always"`.
- `threadBindings`: تجاوزات لكل قناة لتوجيه الجلسات المرتبطة بالتسلسل ودورة حياتها.
- `streaming`: `"off"` (الافتراضي)، أو `"partial"`، أو `"quiet"`، أو صيغة كائن `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`، و`false` ↔ `"off"`.
- `blockStreaming`: عند `true`، تُحفظ كتل المساعد المكتملة كرسائل تقدم منفصلة.
- `markdown`: تكوين اختياري لتصيير Markdown للنص الصادر.
- `responsePrefix`: سلسلة اختيارية تُضاف في بداية الردود الصادرة.
- `textChunkLimit`: حجم القطعة الصادرة بالأحرف عندما يكون `chunkMode: "length"`. الافتراضي: `4000`.
- `chunkMode`: `"length"` (الافتراضي، يقسّم حسب عدد الأحرف) أو `"newline"` (يقسّم عند حدود الأسطر).
- `historyLimit`: عدد رسائل الغرفة الحديثة المضمّنة كـ `InboundHistory` عندما تؤدي رسالة غرفة إلى تشغيل الوكيل. يعود إلى `messages.groupChat.historyLimit`؛ الافتراضي الفعلي `0` (معطل).
- `mediaMaxMb`: حد حجم الوسائط بالميغابايت للإرسال الصادر والمعالجة الواردة.

### إعدادات التفاعل

- `ackReaction`: تجاوز تفاعل الإقرار لهذه القناة/الحساب.
- `ackReactionScope`: تجاوز النطاق (الافتراضي `"group-mentions"`، أو `"group-all"`، أو `"direct"`، أو `"all"`، أو `"none"`، أو `"off"`).
- `reactionNotifications`: وضع إشعارات التفاعلات الواردة (الافتراضي `"own"`، أو `"off"`).

### الأدوات والتجاوزات لكل غرفة

- `actions`: ضبط بوابات الأدوات لكل إجراء (`messages`، و`reactions`، و`pins`، و`profile`، و`memberInfo`، و`channelInfo`، و`verification`).
- `groups`: خريطة سياسات لكل غرفة. تستخدم هوية الجلسة معرّف الغرفة المستقر بعد الحل. (`rooms` اسم مستعار قديم.)
  - `groups.<room>.account`: تقييد إدخال غرفة موروث واحد بحساب محدد.
  - `groups.<room>.allowBots`: تجاوز لكل غرفة لإعداد مستوى القناة (`true` أو `"mentions"`).
  - `groups.<room>.users`: قائمة سماح بالمرسلين لكل غرفة.
  - `groups.<room>.tools`: تجاوزات سماح/رفض الأدوات لكل غرفة.
  - `groups.<room>.autoReply`: تجاوز بوابة الإشارة لكل غرفة. يعطّل `true` متطلبات الإشارة لتلك الغرفة؛ ويفرضها `false` من جديد.
  - `groups.<room>.skills`: مرشح Skills لكل غرفة.
  - `groups.<room>.systemPrompt`: مقتطف مطالبة نظام لكل غرفة.

### إعدادات موافقة exec

- `execApprovals.enabled`: تسليم موافقات exec عبر مطالبات Matrix الأصلية.
- `execApprovals.approvers`: معرّفات مستخدمي Matrix المسموح لهم بالموافقة. يعود إلى `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (الافتراضي)، أو `"channel"`، أو `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: قوائم سماح اختيارية للوكلاء/الجلسات للتسليم.

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) - جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) - مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) - سلوك دردشة المجموعات وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) - توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) - نموذج الوصول والتقوية
