---
read_when:
    - إعداد Matrix في OpenClaw
    - تكوين Matrix E2EE والتحقق
summary: حالة دعم Matrix وإعداده وأمثلة تكوينه
title: Matrix
x-i18n:
    generated_at: "2026-05-02T07:18:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: f280df31cd26182b50613198642285ede1953b546c1593c0723c523ec96635a1
    source_path: channels/matrix.md
    workflow: 16
---

Matrix هو Plugin قناة قابل للتنزيل لـ OpenClaw.
يستخدم `matrix-js-sdk` الرسمي ويدعم الرسائل المباشرة، والغرف، والسلاسل، والوسائط، والتفاعلات، والاستطلاعات، والموقع، وE2EE.

## التثبيت

ثبّت Matrix قبل إعداد القناة:

```bash
openclaw plugins install @openclaw/matrix
```

من نسخة محلية:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

يسجّل `plugins install` الـ Plugin ويفعّله، لذلك لا تحتاج إلى خطوة منفصلة مثل `openclaw plugins enable matrix`. ومع ذلك لا يفعل الـ Plugin أي شيء حتى تضبط القناة أدناه. راجع [Plugins](/ar/tools/plugin) للتعرّف على سلوك الـ Plugin العام وقواعد التثبيت.

## الإعداد

1. أنشئ حساب Matrix على خادمك المنزلي.
2. اضبط `channels.matrix` باستخدام `homeserver` + `accessToken`، أو `homeserver` + `userId` + `password`.
3. أعد تشغيل Gateway.
4. ابدأ رسالة مباشرة مع البوت، أو ادعه إلى غرفة (راجع [الانضمام التلقائي](#auto-join) — الدعوات الجديدة لا تصل إلا عندما يسمح بها `autoJoin`).

### الإعداد التفاعلي

```bash
openclaw channels add
openclaw configure --section channels
```

يسألك المعالج عن: عنوان URL للخادم المنزلي، وطريقة المصادقة (رمز وصول أو كلمة مرور)، ومعرّف المستخدم (لمصادقة كلمة المرور فقط)، واسم جهاز اختياري، وما إذا كنت تريد تفعيل E2EE، وما إذا كنت تريد ضبط وصول الغرف والانضمام التلقائي.

إذا كانت متغيرات البيئة المطابقة `MATRIX_*` موجودة بالفعل ولم يكن للحساب المحدد مصادقة محفوظة، يعرض المعالج اختصارًا عبر متغيرات البيئة. لحل أسماء الغرف قبل حفظ قائمة سماح، شغّل `openclaw channels resolve --channel matrix "Project Room"`. عند تفعيل E2EE، يكتب المعالج الإعدادات ويشغّل عملية التمهيد نفسها مثل [`openclaw matrix encryption setup`](#encryption-and-verification).

### الحد الأدنى من الإعدادات

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

القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`. مع الإعداد الافتراضي، لن يظهر البوت في غرف أو رسائل مباشرة جديدة من دعوات حديثة حتى تنضم يدويًا.

لا يستطيع OpenClaw معرفة ما إذا كانت الغرفة المدعو إليها رسالة مباشرة أم مجموعة وقت الدعوة، لذلك تمر كل الدعوات — بما في ذلك الدعوات التي تشبه الرسائل المباشرة — عبر `autoJoin` أولًا. لا ينطبق `dm.policy` إلا لاحقًا، بعد انضمام البوت وتصنيف الغرفة.

<Warning>
اضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` لتقييد الدعوات التي يقبلها البوت، أو `autoJoin: "always"` لقبول كل دعوة.

لا يقبل `autoJoinAllowlist` إلا أهدافًا مستقرة: `!roomId:server`، أو `#alias:server`، أو `*`. تُرفض أسماء الغرف العادية؛ تُحل إدخالات الأسماء المستعارة مقابل الخادم المنزلي، وليس مقابل الحالة التي تدّعيها الغرفة المدعو إليها.
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

### صيغ أهداف قائمة السماح

من الأفضل ملء قوائم السماح للرسائل المباشرة والغرف بمعرّفات مستقرة:

- الرسائل المباشرة (`dm.allowFrom`، و`groupAllowFrom`، و`groups.<room>.users`): استخدم `@user:server`. لا تُحل أسماء العرض إلا عندما يعيد دليل الخادم المنزلي تطابقًا واحدًا بالضبط.
- الغرف (`groups`، و`autoJoinAllowlist`): استخدم `!room:server` أو `#alias:server`. تُحل الأسماء بأفضل جهد ممكن مقابل الغرف المنضم إليها؛ تُتجاهل الإدخالات غير المحلولة وقت التشغيل.

### تطبيع معرّف الحساب

يحوّل المعالج الاسم الودي إلى معرّف حساب مطبّع. على سبيل المثال، يصبح `Ops Bot` هو `ops-bot`. تُهرّب علامات الترقيم في أسماء متغيرات البيئة ذات النطاق بحيث لا يمكن أن يتصادم حسابان: `-` → `_X2D_`، لذلك يطابق `ops-prod` النمط `MATRIX_OPS_X2D_PROD_*`.

### بيانات الاعتماد المخزنة مؤقتًا

يخزن Matrix بيانات الاعتماد المخزنة مؤقتًا ضمن `~/.openclaw/credentials/matrix/`:

- الحساب الافتراضي: `credentials.json`
- الحسابات المسماة: `credentials-<account>.json`

عند وجود بيانات اعتماد مخزنة مؤقتًا هناك، يتعامل OpenClaw مع Matrix على أنه مضبوط حتى إذا لم يكن رمز الوصول في ملف الإعدادات — وهذا يغطي الإعداد، و`openclaw doctor`، وفحوصات حالة القناة.

### متغيرات البيئة

تُستخدم عندما لا يكون مفتاح الإعداد المكافئ مضبوطًا. يستخدم الحساب الافتراضي أسماء بلا بادئة؛ وتستخدم الحسابات المسماة معرّف الحساب مدرجًا قبل اللاحقة.

| الحساب الافتراضي       | الحساب المسمى (`<ID>` هو معرّف الحساب المطبّع) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

بالنسبة إلى الحساب `ops`، تصبح الأسماء `MATRIX_OPS_HOMESERVER`، و`MATRIX_OPS_ACCESS_TOKEN`، وهكذا. تقرأ تدفقات CLI المدركة للاسترداد (`verify backup restore`، و`verify device`، و`verify bootstrap`) متغيرات بيئة مفتاح الاسترداد عندما تمرر المفتاح عبر `--recovery-key-stdin`.

لا يمكن ضبط `MATRIX_HOMESERVER` من ملف `.env` في مساحة العمل؛ راجع [ملفات `.env` في مساحة العمل](/ar/gateway/security).

## مثال إعداد

خط أساس عملي مع إقران الرسائل المباشرة، وقائمة سماح للغرف، وE2EE:

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

بث ردود Matrix اختياري. يتحكم `streaming` في كيفية تسليم OpenClaw لرد المساعد أثناء التوليد؛ ويتحكم `blockStreaming` فيما إذا كان كل مقطع مكتمل يُحفظ كرسالة Matrix مستقلة.

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
| `"off"` (الافتراضي) | ينتظر الرد الكامل ويرسله مرة واحدة. `true` ↔ `"partial"`، و`false` ↔ `"off"`.                                                                                        |
| `"partial"`       | يعدّل رسالة نصية عادية واحدة في مكانها بينما يكتب النموذج المقطع الحالي. قد ترسل عملاء Matrix القياسية إشعارًا عند أول معاينة، لا عند التعديل النهائي.              |
| `"quiet"`         | مثل `"partial"` لكن الرسالة إشعار لا يرسل تنبيهًا. لا يحصل المستلمون على إشعار إلا عندما تطابق قاعدة دفع لكل مستخدم التعديل النهائي (راجع أدناه). |

`blockStreaming` مستقل عن `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (الافتراضي)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | مسودة حية للمقطع الحالي، مع الاحتفاظ بالمقاطع المكتملة كرسائل | مسودة حية للمقطع الحالي، تُنهى في مكانها |
| `"off"`                 | رسالة Matrix واحدة مُشعِرة لكل مقطع منتهٍ                     | رسالة Matrix واحدة مُشعِرة للرد الكامل      |

ملاحظات:

- إذا تجاوزت المعاينة حد حجم الحدث في Matrix، يوقف OpenClaw بث المعاينة ويعود إلى التسليم النهائي فقط.
- تُرسل ردود الوسائط دائمًا كمرفقات بالطريقة العادية. إذا لم يعد بالإمكان إعادة استخدام معاينة قديمة بأمان، ينقّحها OpenClaw قبل إرسال رد الوسائط النهائي.
- تكون تحديثات معاينة تقدم الأدوات مفعلة افتراضيًا عندما يكون بث معاينة Matrix نشطًا. اضبط `streaming.preview.toolProgress: false` للاحتفاظ بتعديلات المعاينة لنص الإجابة، مع ترك تقدم الأدوات على مسار التسليم العادي.
- تكلف تعديلات المعاينة استدعاءات إضافية لـ Matrix API. اترك `streaming: "off"` إذا أردت أكثر ملف حدود معدلات تحفظًا.

## بيانات تعريف الموافقة

مطالبات الموافقة الأصلية في Matrix هي أحداث `m.room.message` عادية تحتوي على محتوى حدث مخصص خاص بـ OpenClaw ضمن `com.openclaw.approval`. يسمح Matrix بمفاتيح محتوى أحداث مخصصة، لذلك يستمر العملاء القياسيون في عرض متن النص، بينما يمكن للعملاء المدركون لـ OpenClaw قراءة معرّف الموافقة المنظم، والنوع، والحالة، والقرارات المتاحة، وتفاصيل التنفيذ/Plugin.

عندما تكون مطالبة الموافقة طويلة جدًا لحدث Matrix واحد، يجزّئ OpenClaw النص المرئي ويرفق `com.openclaw.approval` بالمقطع الأول فقط. ترتبط تفاعلات قرارات السماح/الرفض بذلك الحدث الأول، لذلك تحتفظ المطالبات الطويلة بهدف الموافقة نفسه مثل المطالبات ذات الحدث الواحد.

### قواعد الدفع ذاتية الاستضافة للمعاينات النهائية الهادئة

لا يرسل `streaming: "quiet"` إشعارًا إلى المستلمين إلا بعد إنهاء مقطع أو دورة — يجب أن تطابق قاعدة دفع لكل مستخدم علامة المعاينة النهائية. راجع [قواعد دفع Matrix للمعاينات الهادئة](/ar/channels/matrix-push-rules) للوصفة الكاملة (رمز المستلم، وفحص الدافع، وتثبيت القاعدة، وملاحظات لكل خادم منزلي).

## غرف بوت إلى بوت

افتراضيًا، تُتجاهل رسائل Matrix من حسابات Matrix أخرى مضبوطة في OpenClaw.

استخدم `allowBots` عندما تريد عن قصد حركة مرور Matrix بين الوكلاء:

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

- يقبل `allowBots: true` الرسائل من حسابات بوت Matrix أخرى مضبوطة في الغرف والرسائل المباشرة المسموح بها.
- يقبل `allowBots: "mentions"` هذه الرسائل فقط عندما تذكر هذا البوت بوضوح في الغرف. تظل الرسائل المباشرة مسموحة.
- يتجاوز `groups.<room>.allowBots` الإعداد على مستوى الحساب لغرفة واحدة.
- لا يزال OpenClaw يتجاهل الرسائل من معرّف مستخدم Matrix نفسه لتجنب حلقات الرد الذاتي.
- لا يوفر Matrix علم بوت أصليًا هنا؛ يتعامل OpenClaw مع "مكتوب بواسطة بوت" على أنه "مرسل من حساب Matrix مضبوط آخر على OpenClaw Gateway هذا".

استخدم قوائم سماح صارمة للغرف ومتطلبات الذكر عند تفعيل حركة مرور بوت إلى بوت في غرف مشتركة.

## التشفير والتحقق

في غرف E2EE المشفرة، تستخدم أحداث الصور الصادرة `thumbnail_file` بحيث تُشفّر معاينات الصور إلى جانب المرفق الكامل. لا تزال الغرف غير المشفرة تستخدم `thumbnail_url` العادي. لا حاجة إلى إعداد — يكتشف الـ Plugin حالة E2EE تلقائيًا.

تقبل كل أوامر `openclaw matrix` الخيارات `--verbose` (تشخيصات كاملة)، و`--json` (مخرجات قابلة للقراءة آليًا)، و`--account <id>` (إعدادات متعددة الحسابات). تكون المخرجات موجزة افتراضيًا مع تسجيل SDK داخلي هادئ. تعرض الأمثلة أدناه الصيغة القياسية؛ أضف الخيارات حسب الحاجة.

### تفعيل التشفير

```bash
openclaw matrix encryption setup
```

يُهيّئ تخزين الأسرار والتوقيع المتبادل، وينشئ نسخة احتياطية لمفاتيح الغرف عند الحاجة، ثم يطبع الحالة والخطوات التالية. أعلام مفيدة:

- `--recovery-key <key>` طبّق مفتاح استرداد قبل التهيئة التمهيدية (يُفضّل نموذج stdin الموثّق أدناه)
- `--force-reset-cross-signing` تخلّص من هوية التوقيع المتبادل الحالية وأنشئ هوية جديدة (استخدمه عن قصد فقط)

لحساب جديد، فعّل E2EE وقت الإنشاء:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` اسم مستعار لـ `--enable-e2ee`.

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

### إشارات الحالة والثقة

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

يعرض `verify status` ثلاث إشارات ثقة مستقلة (`--verbose` يعرضها كلها):

- `Locally trusted`: موثوق به من هذا العميل فقط
- `Cross-signing verified`: يبلّغ SDK عن التحقق عبر التوقيع المتبادل
- `Signed by owner`: موقّع بمفتاح التوقيع الذاتي الخاص بك (للتشخيص فقط)

تصبح `Verified by owner` بالقيمة `yes` فقط عندما تكون `Cross-signing verified` بالقيمة `yes`. الثقة المحلية أو توقيع المالك وحده لا يكفي.

يعيد `--allow-degraded-local-state` تشخيصات بأفضل جهد دون إعداد حساب Matrix أولاً؛ وهو مفيد للفحوصات غير المتصلة أو المكوّنة جزئياً.

### التحقق من هذا الجهاز باستخدام مفتاح استرداد

مفتاح الاسترداد حساس — مرّره عبر stdin بدلاً من تمريره في سطر الأوامر. عيّن `MATRIX_RECOVERY_KEY` (أو `MATRIX_<ID>_RECOVERY_KEY` لحساب مسمّى):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

يعرض الأمر ثلاث حالات:

- `Recovery key accepted`: قبل Matrix المفتاح لتخزين الأسرار أو ثقة الجهاز.
- `Backup usable`: يمكن تحميل النسخة الاحتياطية لمفاتيح الغرف باستخدام مادة الاسترداد الموثوقة.
- `Device verified by owner`: لدى هذا الجهاز ثقة كاملة في هوية التوقيع المتبادل لدى Matrix.

ينهي الأمر بقيمة غير صفرية عندما تكون ثقة الهوية الكاملة غير مكتملة، حتى إذا فتح مفتاح الاسترداد مواد النسخة الاحتياطية. في هذه الحالة، أكمل التحقق الذاتي من عميل Matrix آخر:

```bash
openclaw matrix verify self
```

ينتظر `verify self` حتى تكون `Cross-signing verified: yes` قبل أن ينتهي بنجاح. استخدم `--timeout-ms <ms>` لضبط مدة الانتظار.

صيغة المفتاح الحرفي `openclaw matrix verify device "<recovery-key>"` مقبولة أيضاً، لكن المفتاح سينتهي به المطاف في سجل الصدفة لديك.

### التهيئة التمهيدية أو إصلاح التوقيع المتبادل

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` هو أمر الإصلاح والإعداد للحسابات المشفرة. بالترتيب، يقوم بما يلي:

- يهيّئ تخزين الأسرار، مع إعادة استخدام مفتاح استرداد موجود عند الإمكان
- يهيّئ التوقيع المتبادل ويرفع المفاتيح العامة المفقودة
- يعلّم الجهاز الحالي ويوقّعه توقيعاً متبادلاً
- ينشئ نسخة احتياطية لمفاتيح الغرف من جهة الخادم إذا لم تكن موجودة بالفعل

إذا تطلّب الخادم المنزلي UIA لرفع مفاتيح التوقيع المتبادل، يحاول OpenClaw أولاً دون مصادقة، ثم `m.login.dummy`، ثم `m.login.password` (يتطلب `channels.matrix.password`).

أعلام مفيدة:

- `--recovery-key-stdin` (استخدمه مع `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) أو `--recovery-key <key>`
- `--force-reset-cross-signing` للتخلص من هوية التوقيع المتبادل الحالية (عن قصد فقط)

### النسخ الاحتياطي لمفاتيح الغرف

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

يعرض `backup status` ما إذا كانت هناك نسخة احتياطية من جهة الخادم وما إذا كان هذا الجهاز يستطيع فك تشفيرها. يستورد `backup restore` مفاتيح الغرف المنسوخة احتياطياً إلى مخزن التشفير المحلي؛ إذا كان مفتاح الاسترداد موجوداً بالفعل على القرص، يمكنك حذف `--recovery-key-stdin`.

لاستبدال نسخة احتياطية معطوبة بخط أساس جديد (مع قبول فقدان السجل القديم غير القابل للاسترداد؛ ويمكنه أيضاً إعادة إنشاء تخزين الأسرار إذا كان سر النسخة الاحتياطية الحالية غير قابل للتحميل):

```bash
openclaw matrix verify backup reset --yes
```

أضف `--rotate-recovery-key` فقط عندما تريد عن قصد أن يتوقف مفتاح الاسترداد السابق عن فتح خط أساس النسخة الاحتياطية الجديد.

### سرد التحققات وطلبها والرد عليها

```bash
openclaw matrix verify list
```

يسرد طلبات التحقق المعلقة للحساب المحدد.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

يرسل طلب تحقق من حساب OpenClaw هذا. يطلب `--own-user` تحققاً ذاتياً (تقبل المطالبة في عميل Matrix آخر للمستخدم نفسه)؛ وتستهدف `--user-id`/`--device-id`/`--room-id` شخصاً آخر. لا يمكن دمج `--own-user` مع أعلام الاستهداف الأخرى.

لمعالجة دورة الحياة ذات المستوى الأدنى — عادةً أثناء متابعة الطلبات الواردة من عميل آخر — تعمل هذه الأوامر على طلب محدد `<id>` (يطبعها `verify list` و`verify request`):

| الأمر                                      | الغرض                                                              |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | قبول طلب وارد                                                       |
| `openclaw matrix verify start <id>`        | بدء تدفق SAS                                                        |
| `openclaw matrix verify sas <id>`          | طباعة رموز SAS التعبيرية أو الأرقام العشرية                         |
| `openclaw matrix verify confirm-sas <id>`  | تأكيد أن SAS يطابق ما يعرضه العميل الآخر                            |
| `openclaw matrix verify mismatch-sas <id>` | رفض SAS عندما لا تتطابق الرموز التعبيرية أو الأرقام العشرية          |
| `openclaw matrix verify cancel <id>`       | إلغاء؛ يأخذ اختيارياً `--reason <text>` و`--code <matrix-code>`      |

تقبل كل من `accept` و`start` و`sas` و`confirm-sas` و`mismatch-sas` و`cancel` الخيارين `--user-id` و`--room-id` كتلميحات متابعة للرسائل المباشرة عندما يكون التحقق مرتبطاً بغرفة رسائل مباشرة محددة.

### ملاحظات الحسابات المتعددة

بدون `--account <id>`، تستخدم أوامر Matrix CLI الحساب الافتراضي الضمني. إذا كانت لديك عدة حسابات مسماة ولم تضبط `channels.matrix.defaultAccount`، فسترْفض التخمين وتطلب منك الاختيار. عندما تكون E2EE معطلة أو غير متاحة لحساب مسمى، تشير الأخطاء إلى مفتاح إعداد ذلك الحساب، على سبيل المثال `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    مع `encryption: true`، تكون القيمة الافتراضية لـ `startupVerification` هي `"if-unverified"`. عند بدء التشغيل، يطلب الجهاز غير المتحقق منه تحققاً ذاتياً في عميل Matrix آخر، مع تخطي التكرارات وتطبيق فترة تهدئة (24 ساعة افتراضياً). اضبط ذلك باستخدام `startupVerificationCooldownHours` أو عطّله باستخدام `startupVerification: "off"`.

    يشغّل بدء التشغيل أيضاً تمريرة تهيئة تشفير محافظة تعيد استخدام تخزين الأسرار وهوية التوقيع المتبادل الحاليين. إذا كانت حالة التهيئة التمهيدية معطوبة، يحاول OpenClaw إجراء إصلاح محمي حتى بدون `channels.matrix.password`؛ وإذا كان الخادم المنزلي يتطلب كلمة مرور UIA، يسجّل بدء التشغيل تحذيراً ويبقى غير قاتل. يتم الحفاظ على الأجهزة الموقعة مسبقاً من المالك.

    راجع [ترحيل Matrix](/ar/channels/matrix-migration) للاطلاع على تدفق الترقية الكامل.

  </Accordion>

  <Accordion title="Verification notices">
    ينشر Matrix إشعارات دورة حياة التحقق في غرفة التحقق الصارمة للرسائل المباشرة كرسائل `m.notice`: الطلب، الجاهزية (مع إرشادات "التحقق بالرموز التعبيرية")، البدء/الإكمال، وتفاصيل SAS (الرموز التعبيرية/العشرية) عند توفرها.

    تُتتبّع الطلبات الواردة من عميل Matrix آخر وتُقبل تلقائياً. للتحقق الذاتي، يبدأ OpenClaw تدفق SAS تلقائياً ويؤكد جانبه بمجرد توفر التحقق بالرموز التعبيرية — لا تزال بحاجة إلى المقارنة وتأكيد "إنهما متطابقان" في عميل Matrix لديك.

    لا تُمرّر إشعارات نظام التحقق إلى مسار دردشة الوكيل.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    إذا قال `verify status` إن الجهاز الحالي لم يعد مدرجاً على الخادم المنزلي، فأنشئ جهاز OpenClaw Matrix جديداً. لتسجيل الدخول بكلمة مرور:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    لمصادقة الرمز، أنشئ رمز وصول جديداً في عميل Matrix أو واجهة الإدارة لديك، ثم حدّث OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    استبدل `assistant` بمعرّف الحساب من الأمر الفاشل، أو احذف `--account` للحساب الافتراضي.

  </Accordion>

  <Accordion title="Device hygiene">
    يمكن أن تتراكم الأجهزة القديمة المُدارة بواسطة OpenClaw. اسردها وقلّمها:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    يستخدم Matrix E2EE مسار تشفير Rust الرسمي في `matrix-js-sdk` مع `fake-indexeddb` كطبقة توافق IndexedDB. تستمر حالة التشفير في `crypto-idb-snapshot.json` (أذونات ملفات مقيّدة).

    تعيش حالة وقت التشغيل المشفرة تحت `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` وتشمل مخزن المزامنة، ومخزن التشفير، ومفتاح الاسترداد، ولقطة IDB، وربط السلاسل، وحالة التحقق عند بدء التشغيل. عندما يتغير الرمز بينما تبقى هوية الحساب نفسها، يعيد OpenClaw استخدام أفضل جذر موجود بحيث تظل الحالة السابقة مرئية.

  </Accordion>
</AccordionGroup>

## إدارة الملف الشخصي

حدّث الملف الشخصي الذاتي في Matrix للحساب المحدد:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

يمكنك تمرير الخيارين معاً في استدعاء واحد. يقبل Matrix عناوين URL للصور الرمزية بصيغة `mxc://` مباشرة؛ وعندما تمرر `http://` أو `https://`، يرفع OpenClaw الملف أولاً ويخزّن عنوان URL المحلول بصيغة `mxc://` في `channels.matrix.avatarUrl` (أو التجاوز الخاص بكل حساب).

## السلاسل

يدعم Matrix سلاسل Matrix الأصلية لكل من الردود التلقائية وعمليات الإرسال عبر أداة الرسائل. يتحكم خياران مستقلان في السلوك:

### توجيه الجلسة (`sessionScope`)

يحدد `dm.sessionScope` كيفية ربط غرف الرسائل المباشرة في Matrix بجلسات OpenClaw:

- `"per-user"` (افتراضياً): تشترك كل غرف الرسائل المباشرة مع النظير الموجّه نفسه في جلسة واحدة.
- `"per-room"`: تحصل كل غرفة رسائل مباشرة في Matrix على مفتاح جلستها الخاص، حتى عندما يكون النظير هو نفسه.

تتغلب ربطات المحادثة الصريحة دائماً على `sessionScope`، لذلك تحتفظ الغرف والسلاسل المربوطة بجلسة الهدف التي اختارتها.

### تسلسل الردود (`threadReplies`)

يحدد `threadReplies` أين ينشر البوت رده:

- `"off"`: تكون الردود على المستوى الأعلى. تبقى الرسائل الواردة المتسلسلة على الجلسة الأصلية.
- `"inbound"`: الرد داخل سلسلة فقط عندما تكون الرسالة الواردة موجودة بالفعل في تلك السلسلة.
- `"always"`: الرد داخل سلسلة متجذرة في الرسالة التي تسببت في التشغيل؛ وتُوجّه تلك المحادثة عبر جلسة مطابقة محددة النطاق للسلسلة من أول تشغيل فصاعداً.

يتجاوز `dm.threadReplies` هذا للرسائل المباشرة فقط — على سبيل المثال، إبقاء سلاسل الغرف معزولة مع إبقاء الرسائل المباشرة مسطحة.

### وراثة السلاسل وأوامر الشرطة المائلة

- تتضمن الرسائل المترابطة الواردة رسالة جذر السلسلة كسياق إضافي للوكيل.
- عمليات الإرسال عبر أداة الرسائل ترث تلقائيًا سلسلة Matrix الحالية عند استهداف الغرفة نفسها (أو هدف مستخدم الرسائل المباشرة نفسه)، ما لم يُوفَّر `threadId` صريح.
- لا تبدأ إعادة استخدام هدف مستخدم الرسائل المباشرة إلا عندما تثبت بيانات تعريف الجلسة الحالية نظير الرسائل المباشرة نفسه على حساب Matrix نفسه؛ وإلا يعود OpenClaw إلى التوجيه العادي ضمن نطاق المستخدم.
- تعمل `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` و`/acp spawn` المرتبطة بسلسلة كلها في غرف Matrix والرسائل المباشرة.
- ينشئ `/focus` على المستوى الأعلى سلسلة Matrix جديدة ويربطها بالجلسة الهدف عندما يكون `threadBindings.spawnSessions` ممكّنًا.
- يؤدي تشغيل `/focus` أو `/acp spawn --thread here` داخل سلسلة Matrix موجودة إلى ربط تلك السلسلة في موضعها.

عندما يكتشف OpenClaw غرفة رسائل مباشرة في Matrix تتعارض مع غرفة رسائل مباشرة أخرى على الجلسة المشتركة نفسها، ينشر `m.notice` لمرة واحدة في تلك الغرفة يشير إلى مخرج `/focus` ويقترح تغيير `dm.sessionScope`. لا يظهر الإشعار إلا عندما تكون روابط السلاسل ممكّنة.

## روابط محادثات ACP

يمكن تحويل غرف Matrix والرسائل المباشرة وسلاسل Matrix الموجودة إلى مساحات عمل ACP دائمة من دون تغيير سطح الدردشة.

تدفق المشغل السريع:

- شغّل `/acp spawn codex --bind here` داخل رسالة Matrix المباشرة أو الغرفة أو السلسلة الموجودة التي تريد الاستمرار في استخدامها.
- في رسالة Matrix مباشرة أو غرفة على المستوى الأعلى، يبقى سطح الدردشة هو الرسالة المباشرة/الغرفة الحالية وتُوجَّه الرسائل المستقبلية إلى جلسة ACP التي أُنشئت.
- داخل سلسلة Matrix موجودة، يربط `--bind here` تلك السلسلة الحالية في موضعها.
- يعيد `/new` و`/reset` تعيين جلسة ACP المرتبطة نفسها في موضعها.
- يغلق `/acp close` جلسة ACP ويزيل الربط.

ملاحظات:

- لا ينشئ `--bind here` سلسلة Matrix فرعية.
- يتحكم `threadBindings.spawnSessions` في `/acp spawn --thread auto|here`، حيث يحتاج OpenClaw إلى إنشاء سلسلة Matrix فرعية أو ربطها.

### إعداد ربط السلاسل

يرث Matrix الإعدادات الافتراضية العامة من `session.threadBindings`، ويدعم أيضًا تجاوزات لكل قناة:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

تكون عمليات إنشاء الجلسات المرتبطة بسلاسل Matrix ممكّنة افتراضيًا:

- اضبط `threadBindings.spawnSessions: false` لمنع `/focus` على المستوى الأعلى و`/acp spawn --thread auto|here` من إنشاء/ربط سلاسل Matrix.
- اضبط `threadBindings.defaultSpawnContext: "isolated"` عندما لا ينبغي لعمليات إنشاء سلاسل الوكلاء الفرعيين الأصلية أن تفرّع سجل المحادثة الأب.

## التفاعلات

يدعم Matrix التفاعلات الصادرة، وإشعارات التفاعلات الواردة، وتفاعلات الإقرار.

تخضع أدوات التفاعل الصادر لـ `channels.matrix.actions.reactions`:

- يضيف `react` تفاعلًا إلى حدث Matrix.
- يعرض `reactions` ملخص التفاعلات الحالي لحدث Matrix.
- يزيل `emoji=""` تفاعلات الروبوت نفسه على ذلك الحدث.
- يزيل `remove: true` تفاعل الرمز التعبيري المحدد فقط من الروبوت.

**ترتيب الحل** (تفوز أول قيمة معرّفة):

| الإعداد                 | الترتيب                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | لكل حساب → القناة → `messages.ackReaction` → الرمز التعبيري الاحتياطي لهوية الوكيل   |
| `ackReactionScope`      | لكل حساب → القناة → `messages.ackReactionScope` → القيمة الافتراضية `"group-mentions"` |
| `reactionNotifications` | لكل حساب → القناة → القيمة الافتراضية `"own"`                                          |

يمرر `reactionNotifications: "own"` أحداث `m.reaction` المضافة عندما تستهدف رسائل Matrix التي كتبها الروبوت؛ ويعطل `"off"` أحداث نظام التفاعل. لا تُحوَّل عمليات إزالة التفاعل إلى أحداث نظامية لأن Matrix يعرضها كعمليات تنقيح، لا كعمليات إزالة `m.reaction` مستقلة.

## سياق السجل

- يتحكم `channels.matrix.historyLimit` في عدد رسائل الغرفة الحديثة التي تُضمّن كـ `InboundHistory` عندما تؤدي رسالة غرفة Matrix إلى تشغيل الوكيل. يعود إلى `messages.groupChat.historyLimit`؛ وإذا لم يُضبط كلاهما، تكون القيمة الافتراضية الفعلية `0`. اضبط `0` للتعطيل.
- سجل غرفة Matrix خاص بالغرفة فقط. تستمر الرسائل المباشرة في استخدام سجل الجلسة العادي.
- سجل غرفة Matrix للمعلّق فقط: يخزن OpenClaw مؤقتًا رسائل الغرفة التي لم تؤدِّ إلى رد بعد، ثم يلتقط لقطة من تلك النافذة عندما يصل ذكر أو مشغّل آخر.
- لا تُضمَّن رسالة التشغيل الحالية في `InboundHistory`؛ بل تبقى في متن الوارد الرئيسي لتلك الجولة.
- تعيد محاولات حدث Matrix نفسه استخدام لقطة السجل الأصلية بدلًا من الانزياح إلى رسائل غرفة أحدث.

## ظهور السياق

يدعم Matrix عنصر التحكم المشترك `contextVisibility` لسياق الغرفة التكميلي مثل نص الرد المجلب، وجذور السلاسل، والسجل المعلّق.

- `contextVisibility: "all"` هو الإعداد الافتراضي. يُحافَظ على السياق التكميلي كما استُلم.
- يرشح `contextVisibility: "allowlist"` السياق التكميلي ليقتصر على المرسلين المسموح بهم في فحوصات قائمة السماح النشطة للغرفة/المستخدم.
- يتصرف `contextVisibility: "allowlist_quote"` مثل `allowlist`، لكنه يبقي مع ذلك ردًا مقتبسًا صريحًا واحدًا.

يؤثر هذا الإعداد في ظهور السياق التكميلي، لا في ما إذا كان يمكن للرسالة الواردة نفسها أن تؤدي إلى رد.
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

لكتم الرسائل المباشرة بالكامل مع إبقاء الغرف عاملة، اضبط `dm.enabled: false`:

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

راجع [المجموعات](/ar/channels/groups) لمعرفة سلوك بوابة الذكر وقوائم السماح.

مثال اقتران لرسائل Matrix المباشرة:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

إذا استمر مستخدم Matrix غير معتمد في مراسلتك قبل الاعتماد، يعيد OpenClaw استخدام رمز الاقتران المعلّق نفسه وقد يرسل رد تذكير بعد مهلة قصيرة بدلًا من إصدار رمز جديد.

راجع [الاقتران](/ar/channels/pairing) لمعرفة تدفق اقتران الرسائل المباشرة المشترك وتخطيط التخزين.

## إصلاح الغرفة المباشرة

إذا انحرفت حالة الرسائل المباشرة عن التزامن، قد ينتهي الأمر بـ OpenClaw مع تعيينات `m.direct` قديمة تشير إلى غرف فردية قديمة بدلًا من الرسالة المباشرة النشطة. افحص التعيين الحالي لنظير:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

أصلحه:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

يقبل كلا الأمرين `--account <id>` لإعدادات الحسابات المتعددة. تدفق الإصلاح:

- يفضّل رسالة مباشرة صارمة 1:1 معيّنة بالفعل في `m.direct`
- يعود إلى أي رسالة مباشرة صارمة 1:1 منضم إليها حاليًا مع ذلك المستخدم
- ينشئ غرفة مباشرة جديدة ويعيد كتابة `m.direct` إذا لم توجد رسالة مباشرة سليمة

لا يحذف الغرف القديمة تلقائيًا. يختار الرسالة المباشرة السليمة ويحدّث التعيين بحيث تستهدف عمليات إرسال Matrix المستقبلية، وإشعارات التحقق، وتدفقات الرسائل المباشرة الأخرى الغرفة الصحيحة.

## موافقات التنفيذ

يمكن أن يعمل Matrix كعميل موافقة أصلي. اضبطه تحت `channels.matrix.execApprovals` (أو `channels.matrix.accounts.<account>.execApprovals` لتجاوز لكل حساب):

- `enabled`: تسليم الموافقات عبر مطالبات Matrix الأصلية. عند عدم الضبط أو عند `"auto"`، يمكّن Matrix نفسه تلقائيًا عندما يمكن حل معتمد واحد على الأقل. اضبط `false` للتعطيل صراحة.
- `approvers`: معرّفات مستخدمي Matrix (`@owner:example.org`) المسموح لهم بالموافقة على طلبات التنفيذ. اختياري — يعود إلى `channels.matrix.dm.allowFrom`.
- `target`: مكان إرسال المطالبات. ترسل `"dm"` (الافتراضية) إلى رسائل المعتمدين المباشرة؛ وترسل `"channel"` إلى غرفة Matrix أو الرسالة المباشرة المنشئة؛ وترسل `"both"` إلى كليهما.
- `agentFilter` / `sessionFilter`: قوائم سماح اختيارية للوكلاء/الجلسات التي تشغّل تسليم Matrix.

يختلف التفويض قليلًا بين أنواع الموافقة:

- تستخدم **موافقات التنفيذ** `execApprovals.approvers`، مع الرجوع إلى `dm.allowFrom`.
- تفوّض **موافقات Plugin** عبر `dm.allowFrom` فقط.

يشترك النوعان في اختصارات تفاعلات Matrix وتحديثات الرسائل. يرى المعتمدون اختصارات التفاعل على رسالة الموافقة الأساسية:

- `✅` السماح مرة واحدة
- `❌` الرفض
- `♾️` السماح دائمًا (عندما تسمح سياسة التنفيذ الفعلية بذلك)

أوامر الشرطة المائلة الاحتياطية: `/approve <id> allow-once` و`/approve <id> allow-always` و`/approve <id> deny`.

لا يمكن إلا للمعتمدين الذين تم حلهم الموافقة أو الرفض. يتضمن التسليم إلى القناة لموافقات التنفيذ نص الأمر — لا تمكّن `channel` أو `both` إلا في الغرف الموثوقة.

ذو صلة: [موافقات التنفيذ](/ar/tools/exec-approvals).

## أوامر الشرطة المائلة

تعمل أوامر الشرطة المائلة (`/new` و`/reset` و`/model` و`/focus` و`/unfocus` و`/agents` و`/session` و`/acp` و`/approve` وغيرها) مباشرة في الرسائل المباشرة. في الغرف، يتعرف OpenClaw أيضًا على الأوامر المسبوقة بذكر Matrix الخاص بالروبوت، لذلك يؤدي `@bot:server /new` إلى تشغيل مسار الأمر من دون تعبير نمطي مخصص للذكر. يحافظ هذا على استجابة الروبوت لمنشورات نمط الغرفة `@mention /command` التي يصدرها Element والعملاء المشابهون عندما يستخدم المستخدم الإكمال بالتاب للروبوت قبل كتابة الأمر.

لا تزال قواعد التفويض سارية: يجب أن يستوفي مرسلو الأوامر سياسات قوائم السماح/المالك نفسها للرسائل المباشرة أو الغرف مثل الرسائل العادية.

## حسابات متعددة

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

- تعمل قيم `channels.matrix` على المستوى الأعلى كقيم افتراضية للحسابات المسماة ما لم يتجاوزها حساب.
- اجعل إدخال غرفة موروثًا مخصصًا لحساب معين باستخدام `groups.<room>.account`. الإدخالات بلا `account` مشتركة بين الحسابات؛ ولا يزال `account: "default"` يعمل عندما يكون الحساب الافتراضي مضبوطًا على المستوى الأعلى.

**اختيار الحساب الافتراضي:**

- اضبط `defaultAccount` لاختيار الحساب المسمى الذي تفضله عمليات التوجيه الضمنية والفحص وأوامر CLI.
- إذا كانت لديك حسابات متعددة وكان أحدها اسمه حرفيًا `default`، يستخدمه OpenClaw ضمنيًا حتى عندما لا يكون `defaultAccount` مضبوطًا.
- إذا كانت لديك حسابات مسماة متعددة ولم يُحدد حساب افتراضي، ترفض أوامر CLI التخمين — اضبط `defaultAccount` أو مرر `--account <id>`.
- لا تُعامل كتلة `channels.matrix.*` على المستوى الأعلى كحساب `default` ضمني إلا عندما يكون توثيقها مكتملًا (`homeserver` + `accessToken`، أو `homeserver` + `userId` + `password`). تبقى الحسابات المسماة قابلة للاكتشاف من `homeserver` + `userId` بمجرد أن تغطي بيانات الاعتماد المخزنة مؤقتًا التوثيق.

**الترقية:**

- عندما يرقّي OpenClaw إعداد حساب واحد إلى حسابات متعددة أثناء الإصلاح أو الإعداد، فإنه يحافظ على الحساب المسمى الموجود إذا كان موجودًا أو إذا كان `defaultAccount` يشير بالفعل إلى واحد. لا تنتقل إلا مفاتيح توثيق/تمهيد Matrix إلى الحساب المرَقّى؛ وتبقى مفاتيح سياسة التسليم المشتركة على المستوى الأعلى.

راجع [مرجع الإعدادات](/ar/gateway/config-channels#multi-account-all-channels) للنمط المشترك للحسابات المتعددة.

## خوادم المنازل الخاصة/الشبكة المحلية

افتراضيًا، يحظر OpenClaw خوادم Matrix المنزلية الخاصة/الداخلية للحماية من SSRF ما لم تختر
ذلك صراحة لكل حساب.

إذا كان خادمك المنزلي يعمل على localhost، أو عنوان IP على شبكة محلية/Tailscale، أو اسم مضيف داخلي، فمكّن
`network.dangerouslyAllowPrivateNetwork` لذلك حساب Matrix:

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

يسمح هذا الاشتراك الاختياري فقط بالأهداف الخاصة/الداخلية الموثوقة. تظل خوادم Matrix غير المشفرة العامة مثل
`http://matrix.example.org:8008` محظورة. فضّل `https://` كلما أمكن.

## تمرير حركة مرور Matrix عبر وكيل

إذا كان نشر Matrix لديك يحتاج إلى وكيل HTTP(S) صريح للصادر، فاضبط `channels.matrix.proxy`:

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

يمكن للحسابات المسماة تجاوز الإعداد الافتراضي ذي المستوى الأعلى باستخدام `channels.matrix.accounts.<id>.proxy`.
يستخدم OpenClaw إعداد الوكيل نفسه لحركة مرور Matrix أثناء التشغيل وفحوصات حالة الحساب.

## حل الأهداف

يقبل Matrix صيغ الأهداف هذه في أي مكان يطلب فيه OpenClaw هدف غرفة أو مستخدم:

- المستخدمون: `@user:server`، أو `user:@user:server`، أو `matrix:user:@user:server`
- الغرف: `!room:server`، أو `room:!room:server`، أو `matrix:room:!room:server`
- الأسماء المستعارة: `#alias:server`، أو `channel:#alias:server`، أو `matrix:channel:#alias:server`

تراعي معرّفات غرف Matrix حالة الأحرف. استخدم حالة الأحرف الدقيقة لمعرّف الغرفة من Matrix
عند تكوين أهداف التسليم الصريحة، أو مهام cron، أو الارتباطات، أو قوائم السماح.
يبقي OpenClaw مفاتيح الجلسات الداخلية بصيغة معيارية للتخزين، لذلك لا تُعد تلك المفاتيح ذات الأحرف الصغيرة
مصدرًا موثوقًا لمعرّفات تسليم Matrix.

يستخدم البحث المباشر في الدليل حساب Matrix المسجّل الدخول:

- تستعلم عمليات البحث عن المستخدمين من دليل مستخدمي Matrix على ذلك الخادم.
- تقبل عمليات البحث عن الغرف معرّفات الغرف والأسماء المستعارة الصريحة مباشرة، ثم تعود إلى البحث في أسماء الغرف المنضم إليها لذلك الحساب.
- البحث باسم غرفة منضم إليها هو أفضل جهد ممكن. إذا تعذر حل اسم غرفة إلى معرّف أو اسم مستعار، فيتم تجاهله عند حل قائمة السماح أثناء التشغيل.

## مرجع التكوين

تقبل الحقول بأسلوب قائمة السماح (`groupAllowFrom`، و`dm.allowFrom`، و`groups.<room>.users`) معرّفات مستخدمي Matrix كاملة (الأكثر أمانًا). تُحل التطابقات الدقيقة من الدليل عند بدء التشغيل وكلما تغيّرت قائمة السماح أثناء تشغيل المراقب؛ ويتم تجاهل الإدخالات التي لا يمكن حلها أثناء التشغيل. تفضّل قوائم سماح الغرف معرّفات الغرف أو الأسماء المستعارة للسبب نفسه.

### الحساب والاتصال

- `enabled`: تفعيل القناة أو تعطيلها.
- `name`: تسمية عرض اختيارية للحساب.
- `defaultAccount`: معرّف الحساب المفضل عند تكوين عدة حسابات Matrix.
- `accounts`: تجاوزات مسماة لكل حساب. تُورث قيم `channels.matrix` ذات المستوى الأعلى كإعدادات افتراضية.
- `homeserver`: عنوان URL لخادم Matrix، مثل `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: السماح لهذا الحساب بالاتصال بـ `localhost`، أو عناوين IP على LAN/Tailscale، أو أسماء المضيفين الداخلية.
- `proxy`: عنوان URL اختياري لوكيل HTTP(S) لحركة مرور Matrix. يدعم التجاوز لكل حساب.
- `userId`: معرّف مستخدم Matrix الكامل (`@bot:example.org`).
- `accessToken`: رمز وصول للمصادقة القائمة على الرمز. تُدعم قيم النص الصريح وSecretRef عبر موفري env/file/exec ([إدارة الأسرار](/ar/gateway/secrets)).
- `password`: كلمة المرور لتسجيل الدخول القائم على كلمة المرور. تُدعم قيم النص الصريح وSecretRef.
- `deviceId`: معرّف جهاز Matrix صريح.
- `deviceName`: اسم عرض الجهاز المستخدم عند تسجيل الدخول بكلمة المرور.
- `avatarUrl`: عنوان URL للصورة الذاتية المخزنة لمزامنة الملف الشخصي وتحديثات `profile set`.
- `initialSyncLimit`: الحد الأقصى لعدد الأحداث التي تُجلب أثناء مزامنة بدء التشغيل.

### التشفير

- `encryption`: تفعيل E2EE. الافتراضي: `false`.
- `startupVerification`: `"if-unverified"` (الافتراضي عند تشغيل E2EE) أو `"off"`. يطلب التحقق الذاتي تلقائيًا عند بدء التشغيل عندما يكون هذا الجهاز غير موثّق.
- `startupVerificationCooldownHours`: فترة التهدئة قبل طلب بدء التشغيل التلقائي التالي. الافتراضي: `24`.

### الوصول والسياسة

- `groupPolicy`: `"open"`، أو `"allowlist"`، أو `"disabled"`. الافتراضي: `"allowlist"`.
- `groupAllowFrom`: قائمة سماح بمعرّفات المستخدمين لحركة مرور الغرف.
- `dm.enabled`: عند `false`، تجاهل جميع الرسائل المباشرة. الافتراضي: `true`.
- `dm.policy`: `"pairing"` (الافتراضي)، أو `"allowlist"`، أو `"open"`، أو `"disabled"`. يُطبّق بعد انضمام البوت وتصنيف الغرفة كرسالة مباشرة؛ ولا يؤثر في معالجة الدعوات.
- `dm.allowFrom`: قائمة سماح بمعرّفات المستخدمين لحركة مرور الرسائل المباشرة.
- `dm.sessionScope`: `"per-user"` (الافتراضي) أو `"per-room"`.
- `dm.threadReplies`: تجاوز خاص بالرسائل المباشرة لترابط الردود (`"off"`، أو `"inbound"`، أو `"always"`).
- `allowBots`: قبول الرسائل من حسابات بوت Matrix الأخرى المكوّنة (`true` أو `"mentions"`).
- `allowlistOnly`: عند `true`، يفرض تحويل جميع سياسات الرسائل المباشرة النشطة (باستثناء `"disabled"`) وسياسات المجموعات `"open"` إلى `"allowlist"`. لا يغيّر سياسات `"disabled"`.
- `autoJoin`: `"always"`، أو `"allowlist"`، أو `"off"`. الافتراضي: `"off"`. ينطبق على كل دعوة Matrix، بما في ذلك الدعوات بأسلوب الرسائل المباشرة.
- `autoJoinAllowlist`: الغرف/الأسماء المستعارة المسموح بها عندما يكون `autoJoin` هو `"allowlist"`. تُحل إدخالات الأسماء المستعارة مقابل خادم Matrix، وليس مقابل الحالة التي تدّعيها الغرفة الداعية.
- `contextVisibility`: رؤية سياق تكميلية (الافتراضي `"all"`، أو `"allowlist"`، أو `"allowlist_quote"`).

### سلوك الرد

- `replyToMode`: `"off"`، أو `"first"`، أو `"all"`، أو `"batched"`.
- `threadReplies`: `"off"`، أو `"inbound"`، أو `"always"`.
- `threadBindings`: تجاوزات لكل قناة لتوجيه الجلسات المرتبطة بسلاسل المحادثات ودورة حياتها.
- `streaming`: `"off"` (الافتراضي)، أو `"partial"`، أو `"quiet"`، أو صيغة كائن `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`، `false` ↔ `"off"`.
- `blockStreaming`: عند `true`، تُحفظ كتل المساعد المكتملة كرسائل تقدم منفصلة.
- `markdown`: تكوين اختياري لتصيير Markdown للنص الصادر.
- `responsePrefix`: سلسلة اختيارية تُضاف قبل الردود الصادرة.
- `textChunkLimit`: حجم المقطع الصادر بالأحرف عندما يكون `chunkMode: "length"`. الافتراضي: `4000`.
- `chunkMode`: `"length"` (الافتراضي، يقسم حسب عدد الأحرف) أو `"newline"` (يقسم عند حدود الأسطر).
- `historyLimit`: عدد رسائل الغرفة الحديثة المضمنة كـ `InboundHistory` عندما تؤدي رسالة غرفة إلى تشغيل الوكيل. يعود إلى `messages.groupChat.historyLimit`؛ الافتراضي الفعلي `0` (معطل).
- `mediaMaxMb`: حد حجم الوسائط بالميغابايت للإرسال الصادر والمعالجة الواردة.

### إعدادات التفاعل

- `ackReaction`: تجاوز تفاعل الإقرار لهذه القناة/الحساب.
- `ackReactionScope`: تجاوز النطاق (الافتراضي `"group-mentions"`، أو `"group-all"`، أو `"direct"`، أو `"all"`، أو `"none"`، أو `"off"`).
- `reactionNotifications`: وضع إشعارات التفاعلات الواردة (الافتراضي `"own"`، أو `"off"`).

### الأدوات والتجاوزات لكل غرفة

- `actions`: تقييد الأدوات لكل إجراء (`messages`، و`reactions`، و`pins`، و`profile`، و`memberInfo`، و`channelInfo`، و`verification`).
- `groups`: خريطة سياسات لكل غرفة. تستخدم هوية الجلسة معرّف الغرفة المستقر بعد الحل. (`rooms` اسم مستعار قديم.)
  - `groups.<room>.account`: تقييد إدخال غرفة موروث واحد بحساب محدد.
  - `groups.<room>.allowBots`: تجاوز لكل غرفة لإعداد مستوى القناة (`true` أو `"mentions"`).
  - `groups.<room>.users`: قائمة سماح لمرسلي الغرفة.
  - `groups.<room>.tools`: تجاوزات سماح/منع للأدوات لكل غرفة.
  - `groups.<room>.autoReply`: تجاوز لكل غرفة لتقييد الردود بالإشارات. `true` يعطل متطلبات الإشارة لتلك الغرفة؛ و`false` يفرضها مرة أخرى.
  - `groups.<room>.skills`: مرشح Skills لكل غرفة.
  - `groups.<room>.systemPrompt`: مقتطف مطالبة نظام لكل غرفة.

### إعدادات موافقة exec

- `execApprovals.enabled`: تسليم موافقات exec عبر مطالبات Matrix الأصلية.
- `execApprovals.approvers`: معرّفات مستخدمي Matrix المسموح لهم بالموافقة. يعود إلى `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (الافتراضي)، أو `"channel"`، أو `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: قوائم سماح اختيارية للوكيل/الجلسة للتسليم.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات وتقييد الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
