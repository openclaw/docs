---
read_when:
    - إعداد Matrix في OpenClaw
    - تكوين E2EE والتحقق في Matrix
summary: حالة دعم Matrix وإعداده وأمثلة التهيئة
title: مصفوفة
x-i18n:
    generated_at: "2026-05-11T20:21:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0187f7ffa068e5db07e39581f718e3e9aab23f778fffc5cca14e43664a6ee10a
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

يسجّل `plugins install` الـ Plugin ويفعّله، لذلك لا يلزم تنفيذ خطوة `openclaw plugins enable matrix` منفصلة. مع ذلك، لا يفعل الـ Plugin شيئًا حتى تهيئ القناة أدناه. راجع [Plugins](/ar/tools/plugin) لمعرفة سلوك Plugin العام وقواعد التثبيت.

## الإعداد

1. أنشئ حساب Matrix على homeserver الخاص بك.
2. هيّئ `channels.matrix` باستخدام إما `homeserver` + `accessToken`، أو `homeserver` + `userId` + `password`.
3. أعد تشغيل Gateway.
4. ابدأ رسالة مباشرة مع البوت، أو ادعه إلى غرفة (راجع [الانضمام التلقائي](#auto-join) - الدعوات الجديدة لا تصل إلا عندما يسمح بها `autoJoin`).

### الإعداد التفاعلي

```bash
openclaw channels add
openclaw configure --section channels
```

يسأل المعالج عن: عنوان URL للـ homeserver، وطريقة المصادقة (رمز وصول أو كلمة مرور)، ومعرّف المستخدم (لمصادقة كلمة المرور فقط)، واسم جهاز اختياري، وما إذا كان يجب تفعيل E2EE، وما إذا كان يجب تهيئة وصول الغرف والانضمام التلقائي.

إذا كانت متغيرات البيئة المطابقة `MATRIX_*` موجودة بالفعل ولا يملك الحساب المحدد مصادقة محفوظة، يعرض المعالج اختصارًا لمتغير البيئة. لحل أسماء الغرف قبل حفظ قائمة سماح، شغّل `openclaw channels resolve --channel matrix "Project Room"`. عند تفعيل E2EE، يكتب المعالج الإعدادات ويشغّل عملية التمهيد نفسها مثل [`openclaw matrix encryption setup`](#encryption-and-verification).

### الحد الأدنى من الإعدادات

بناءً على الرمز:

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

بناءً على كلمة المرور (يُخزَّن الرمز مؤقتًا بعد أول تسجيل دخول):

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

القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`. مع القيمة الافتراضية، لن يظهر البوت في الغرف الجديدة أو الرسائل المباشرة من الدعوات الجديدة حتى تنضم يدويًا.

لا يستطيع OpenClaw معرفة ما إذا كانت الغرفة المدعو إليها رسالة مباشرة أم مجموعة وقت الدعوة، لذلك تمر كل الدعوات - بما في ذلك الدعوات ذات نمط الرسائل المباشرة - عبر `autoJoin` أولاً. لا تنطبق `dm.policy` إلا لاحقًا، بعد أن ينضم البوت وتُصنَّف الغرفة.

<Warning>
اضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` لتقييد الدعوات التي يقبلها البوت، أو `autoJoin: "always"` لقبول كل دعوة.

يقبل `autoJoinAllowlist` الأهداف المستقرة فقط: `!roomId:server` أو `#alias:server` أو `*`. تُرفض أسماء الغرف العادية؛ وتُحل إدخالات الأسماء المستعارة مقابل homeserver، وليس مقابل الحالة التي تدّعيها الغرفة المدعو إليها.
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

- الرسائل المباشرة (`dm.allowFrom`، `groupAllowFrom`، `groups.<room>.users`): استخدم `@user:server`. تُتجاهل أسماء العرض افتراضيًا لأنها قابلة للتغيير؛ اضبط `dangerouslyAllowNameMatching: true` فقط عندما تحتاج صراحةً إلى التوافق مع إدخالات أسماء العرض.
- مفاتيح قائمة سماح الغرف (`groups`، و`rooms` القديمة): استخدم `!room:server` أو `#alias:server`. تُتجاهل أسماء الغرف العادية افتراضيًا؛ اضبط `dangerouslyAllowNameMatching: true` فقط عندما تحتاج صراحةً إلى التوافق مع البحث عن اسم غرفة منضم إليها.
- قوائم سماح الدعوات (`autoJoinAllowlist`): استخدم `!room:server` أو `#alias:server` أو `*`. تُرفض أسماء الغرف العادية.

### تطبيع معرّف الحساب

يحوّل المعالج الاسم الودي إلى معرّف حساب مطبّع. على سبيل المثال، يصبح `Ops Bot` هو `ops-bot`. تُهرَّب علامات الترقيم في أسماء متغيرات البيئة ذات النطاق حتى لا يتصادم حسابان: `-` → `_X2D_`، لذلك يُربط `ops-prod` بـ `MATRIX_OPS_X2D_PROD_*`.

### بيانات الاعتماد المخزنة مؤقتًا

يخزّن Matrix بيانات الاعتماد المؤقتة ضمن `~/.openclaw/credentials/matrix/`:

- الحساب الافتراضي: `credentials.json`
- الحسابات المسماة: `credentials-<account>.json`

عندما تكون بيانات الاعتماد المخزنة مؤقتًا موجودة هناك، يعامل OpenClaw Matrix على أنه مهيأ حتى لو لم يكن رمز الوصول في ملف الإعدادات - ويشمل ذلك الإعداد، و`openclaw doctor`، وفحوصات حالة القناة.

### متغيرات البيئة

تُستخدم عندما لا يكون مفتاح الإعداد المكافئ مضبوطًا. يستخدم الحساب الافتراضي أسماء بلا بادئة؛ وتستخدم الحسابات المسماة معرّف الحساب مُدرجًا قبل اللاحقة.

| الحساب الافتراضي       | الحساب المسمى (`<ID>` هو معرّف الحساب المطبّع) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

للحساب `ops`، تصبح الأسماء `MATRIX_OPS_HOMESERVER` و`MATRIX_OPS_ACCESS_TOKEN` وهكذا. تقرأ تدفقات CLI الواعية بالاسترداد (`verify backup restore`، و`verify device`، و`verify bootstrap`) متغيرات بيئة مفتاح الاسترداد عندما تمرر المفتاح عبر `--recovery-key-stdin`.

لا يمكن ضبط `MATRIX_HOMESERVER` من ملف `.env` في مساحة العمل؛ راجع [ملفات `.env` لمساحة العمل](/ar/gateway/security).

## مثال على الإعدادات

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

بث ردود Matrix اختياري التفعيل. يتحكم `streaming` في كيفية تسليم OpenClaw لرد المساعد قيد التنفيذ؛ ويتحكم `blockStreaming` فيما إذا كان كل مقطع مكتمل سيُحفظ كرسالة Matrix مستقلة.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

للاحتفاظ بمعاينات الإجابة المباشرة مع إخفاء أسطر الأدوات/التقدم المؤقتة، استخدم صيغة الكائن:

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
| `"off"` (افتراضي) | ينتظر الرد الكامل، ثم يرسله مرة واحدة. `true` ↔ `"partial"`، و`false` ↔ `"off"`.                                                                                        |
| `"partial"`       | يحرر رسالة نصية عادية واحدة في مكانها أثناء كتابة النموذج للمقطع الحالي. قد ترسل عملاء Matrix الافتراضية إشعارًا عند أول معاينة، لا عند التحرير النهائي.              |
| `"quiet"`         | مثل `"partial"` لكن الرسالة إشعار غير منبّه. لا يتلقى المستلمون إشعارًا إلا عندما تطابق قاعدة دفع لكل مستخدم التحرير النهائي (انظر أدناه). |

`blockStreaming` مستقل عن `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (افتراضي)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | مسودة مباشرة للمقطع الحالي، مع إبقاء المقاطع المكتملة كرسائل | مسودة مباشرة للمقطع الحالي، تُنجز في مكانها |
| `"off"`                 | رسالة Matrix منبّهة واحدة لكل مقطع منتهٍ                     | رسالة Matrix منبّهة واحدة للرد الكامل      |

ملاحظات:

- إذا تجاوزت معاينة حد حجم الحدث الواحد في Matrix، يوقف OpenClaw بث المعاينة ويرجع إلى التسليم النهائي فقط.
- تُرسل ردود الوسائط دائمًا المرفقات بالطريقة العادية. إذا لم يعد من الممكن إعادة استخدام معاينة قديمة بأمان، يحجبها OpenClaw قبل إرسال رد الوسائط النهائي.
- تُفعّل تحديثات معاينة تقدم الأدوات افتراضيًا عندما يكون بث معاينات Matrix نشطًا. اضبط `streaming.preview.toolProgress: false` للإبقاء على تحريرات المعاينة لنص الإجابة مع ترك تقدم الأدوات على مسار التسليم العادي.
- تكلف تحريرات المعاينة استدعاءات إضافية لـ API الخاص بـ Matrix. اترك `streaming: "off"` إذا كنت تريد ملف تعريف حدود معدل أكثر تحفظًا.

## بيانات الموافقة الوصفية

مطالبات الموافقة الأصلية في Matrix هي أحداث `m.room.message` عادية تحتوي على محتوى حدث مخصص خاص بـ OpenClaw ضمن `com.openclaw.approval`. يسمح Matrix بمفاتيح محتوى أحداث مخصصة، لذلك تستمر العملاء الافتراضية في عرض متن النص بينما يستطيع العملاء الواعية بـ OpenClaw قراءة معرّف الموافقة المنظم، والنوع، والحالة، والقرارات المتاحة، وتفاصيل التنفيذ/Plugin.

عندما تكون مطالبة الموافقة طويلة جدًا لحدث Matrix واحد، يقسّم OpenClaw النص المرئي إلى أجزاء ويرفق `com.openclaw.approval` بالجزء الأول فقط. تُربط تفاعلات قرارات السماح/الرفض بذلك الحدث الأول، لذلك تحتفظ المطالبات الطويلة بهدف الموافقة نفسه مثل مطالبات الحدث الواحد.

### قواعد الدفع ذاتية الاستضافة للمعاينات النهائية الهادئة

لا يرسل `streaming: "quiet"` إشعارًا إلى المستلمين إلا بعد إنجاز مقطع أو دور - يجب أن تطابق قاعدة دفع لكل مستخدم علامة المعاينة النهائية. راجع [قواعد دفع Matrix للمعاينات الهادئة](/ar/channels/matrix-push-rules) للوصفة الكاملة (رمز المستلم، وفحص pusher، وتثبيت القاعدة، وملاحظات لكل homeserver).

## غرف البوت إلى البوت

افتراضيًا، تُتجاهل رسائل Matrix الواردة من حسابات Matrix أخرى مهيأة في OpenClaw.

استخدم `allowBots` عندما تريد عن قصد حركة Matrix بين الوكلاء:

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

- يقبل `allowBots: true` الرسائل من حسابات بوت Matrix المهيأة الأخرى في الغرف والرسائل المباشرة المسموح بها.
- يقبل `allowBots: "mentions"` تلك الرسائل فقط عندما تذكر هذا البوت بوضوح في الغرف. تظل الرسائل المباشرة مسموحة.
- يتجاوز `groups.<room>.allowBots` إعداد مستوى الحساب لغرفة واحدة.
- يظل OpenClaw يتجاهل الرسائل من معرّف مستخدم Matrix نفسه لتجنب حلقات الرد على الذات.
- لا يكشف Matrix عن علامة بوت أصلية هنا؛ يعامل OpenClaw "المكتوب بواسطة بوت" على أنه "مرسل بواسطة حساب Matrix آخر مهيأ على OpenClaw gateway هذا".

استخدم قوائم سماح صارمة للغرف ومتطلبات الذكر عند تفعيل حركة البوت إلى البوت في الغرف المشتركة.

## التشفير والتحقق

في الغرف المشفرة (E2EE)، تستخدم أحداث الصور الصادرة `thumbnail_file` حتى تُشفَّر معاينات الصور مع المرفق الكامل. لا تزال الغرف غير المشفرة تستخدم `thumbnail_url` العادي. لا يلزم أي إعداد - يكتشف الـ plugin حالة E2EE تلقائيا.

تقبل جميع أوامر `openclaw matrix` الخيار `--verbose` (تشخيصات كاملة)، و`--json` (مخرجات قابلة للقراءة آليا)، و`--account <id>` (إعدادات الحسابات المتعددة). تكون المخرجات موجزة افتراضيا مع تسجيل SDK داخلي هادئ. تعرض الأمثلة أدناه الصيغة القياسية؛ أضف العلامات حسب الحاجة.

### تمكين التشفير

```bash
openclaw matrix encryption setup
```

يمهّد التخزين السري والتوقيع المتبادل، وينشئ نسخة احتياطية لمفاتيح الغرف إذا لزم الأمر، ثم يطبع الحالة والخطوات التالية. علامات مفيدة:

- `--recovery-key <key>` طبّق مفتاح استرداد قبل التمهيد (فضّل صيغة stdin الموثقة أدناه)
- `--force-reset-cross-signing` تجاهل هوية التوقيع المتبادل الحالية وأنشئ هوية جديدة (استخدمه عمدا فقط)

لحساب جديد، فعّل E2EE وقت الإنشاء:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` هو اسم مستعار لـ `--enable-e2ee`.

المكافئ في الإعداد اليدوي:

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
- `Signed by owner`: موقّع بمفتاح توقيعك الذاتي (للتشخيص فقط)

تصبح `Verified by owner` هي `yes` فقط عندما تكون `Cross-signing verified` هي `yes`. الثقة المحلية أو توقيع المالك وحده لا يكفيان.

يعيد `--allow-degraded-local-state` تشخيصات بأفضل جهد دون تجهيز حساب Matrix أولا؛ وهو مفيد للفحوصات غير المتصلة أو المكوّنة جزئيا.

### تحقق من هذا الجهاز باستخدام مفتاح استرداد

مفتاح الاسترداد حساس - مرّره عبر stdin بدلا من تمريره في سطر الأوامر. اضبط `MATRIX_RECOVERY_KEY` (أو `MATRIX_<ID>_RECOVERY_KEY` لحساب مسمى):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

يعرض الأمر ثلاث حالات:

- `Recovery key accepted`: قبل Matrix المفتاح للتخزين السري أو لثقة الجهاز.
- `Backup usable`: يمكن تحميل نسخة مفاتيح الغرف الاحتياطية باستخدام مواد الاسترداد الموثوقة.
- `Device verified by owner`: يملك هذا الجهاز ثقة كاملة بهوية التوقيع المتبادل في Matrix.

ينتهي بحالة غير صفرية عندما تكون ثقة الهوية الكاملة غير مكتملة، حتى إذا فتح مفتاح الاسترداد مواد النسخ الاحتياطي. في هذه الحالة، أكمل التحقق الذاتي من عميل Matrix آخر:

```bash
openclaw matrix verify self
```

ينتظر `verify self` حتى تصبح `Cross-signing verified: yes` قبل أن ينتهي بنجاح. استخدم `--timeout-ms <ms>` لضبط مدة الانتظار.

صيغة المفتاح الحرفية `openclaw matrix verify device "<recovery-key>"` مقبولة أيضا، لكن المفتاح سينتهي به المطاف في سجل shell لديك.

### تمهيد التوقيع المتبادل أو إصلاحه

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` هو أمر الإصلاح والإعداد للحسابات المشفرة. بالترتيب، يقوم بما يلي:

- يمهّد التخزين السري، مع إعادة استخدام مفتاح استرداد موجود عندما يكون ذلك ممكنا
- يمهّد التوقيع المتبادل ويرفع المفاتيح العامة المفقودة
- يعلّم الجهاز الحالي ويوقّعه بالتوقيع المتبادل
- ينشئ نسخة احتياطية لمفاتيح الغرف على الخادم إذا لم تكن موجودة بالفعل

إذا كان خادم homeserver يتطلب UIA لرفع مفاتيح التوقيع المتبادل، يحاول OpenClaw أولا بلا مصادقة، ثم `m.login.dummy`، ثم `m.login.password` (يتطلب `channels.matrix.password`).

علامات مفيدة:

- `--recovery-key-stdin` (اقرنه مع `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) أو `--recovery-key <key>`
- `--force-reset-cross-signing` لتجاهل هوية التوقيع المتبادل الحالية (عن قصد فقط)

### نسخة مفاتيح الغرف الاحتياطية

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

يعرض `backup status` ما إذا كانت توجد نسخة احتياطية على الخادم وما إذا كان هذا الجهاز يستطيع فك تشفيرها. يستورد `backup restore` مفاتيح الغرف المنسوخة احتياطيا إلى مخزن التشفير المحلي؛ إذا كان مفتاح الاسترداد موجودا بالفعل على القرص يمكنك حذف `--recovery-key-stdin`.

لاستبدال نسخة احتياطية معطلة بخط أساس جديد (مع قبول فقدان السجل القديم غير القابل للاسترداد؛ ويمكنه أيضا إعادة إنشاء التخزين السري إذا كان سر النسخة الاحتياطية الحالية غير قابل للتحميل):

```bash
openclaw matrix verify backup reset --yes
```

أضف `--rotate-recovery-key` فقط عندما تريد عمدا أن يتوقف مفتاح الاسترداد السابق عن فتح خط أساس النسخة الاحتياطية الجديد.

### سرد عمليات التحقق وطلبها والاستجابة لها

```bash
openclaw matrix verify list
```

يسرد طلبات التحقق المعلقة للحساب المحدد.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

يرسل طلب تحقق من حساب OpenClaw هذا. يطلب `--own-user` التحقق الذاتي (تقبل المطالبة في عميل Matrix آخر للمستخدم نفسه)؛ تستهدف `--user-id`/`--device-id`/`--room-id` شخصا آخر. لا يمكن دمج `--own-user` مع علامات الاستهداف الأخرى.

للتعامل مع دورة الحياة بمستوى أدنى - عادة أثناء متابعة الطلبات الواردة من عميل آخر - تعمل هذه الأوامر على طلب محدد `<id>` (يطبع بواسطة `verify list` و`verify request`):

| الأمر                                      | الغرض                                                               |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | قبول طلب وارد                                                       |
| `openclaw matrix verify start <id>`        | بدء تدفق SAS                                                        |
| `openclaw matrix verify sas <id>`          | طباعة رموز SAS التعبيرية أو الأعداد العشرية                         |
| `openclaw matrix verify confirm-sas <id>`  | تأكيد أن SAS يطابق ما يعرضه العميل الآخر                            |
| `openclaw matrix verify mismatch-sas <id>` | رفض SAS عندما لا تتطابق الرموز التعبيرية أو الأعداد العشرية          |
| `openclaw matrix verify cancel <id>`       | الإلغاء؛ يأخذ اختياريا `--reason <text>` و`--code <matrix-code>`    |

تقبل `accept` و`start` و`sas` و`confirm-sas` و`mismatch-sas` و`cancel` جميعها `--user-id` و`--room-id` كتلميحات متابعة DM عندما يكون التحقق مرتبطا بغرفة رسالة مباشرة محددة.

### ملاحظات الحسابات المتعددة

من دون `--account <id>`، تستخدم أوامر Matrix CLI الحساب الافتراضي الضمني. إذا كان لديك عدة حسابات مسماة ولم تضبط `channels.matrix.defaultAccount`، فسترفض التخمين وستطلب منك الاختيار. عندما تكون E2EE معطلة أو غير متاحة لحساب مسمى، تشير الأخطاء إلى مفتاح إعداد ذلك الحساب، مثلا `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    مع `encryption: true`، تكون القيمة الافتراضية لـ `startupVerification` هي `"if-unverified"`. عند بدء التشغيل، يطلب الجهاز غير المتحقق منه تحققا ذاتيا في عميل Matrix آخر، مع تخطي التكرارات وتطبيق فترة تهدئة (24 ساعة افتراضيا). اضبط ذلك باستخدام `startupVerificationCooldownHours` أو عطّله باستخدام `startupVerification: "off"`.

    يشغّل بدء التشغيل أيضا تمريرة تمهيد تشفير محافظة تعيد استخدام التخزين السري الحالي وهوية التوقيع المتبادل. إذا كانت حالة التمهيد معطلة، يحاول OpenClaw إجراء إصلاح محروس حتى من دون `channels.matrix.password`؛ وإذا كان خادم homeserver يتطلب UIA بكلمة مرور، يسجل بدء التشغيل تحذيرا ويبقى غير فادح. يتم الحفاظ على الأجهزة الموقعة من المالك بالفعل.

    راجع [ترحيل Matrix](/ar/channels/matrix-migration) للاطلاع على تدفق الترقية الكامل.

  </Accordion>

  <Accordion title="Verification notices">
    ينشر Matrix إشعارات دورة حياة التحقق داخل غرفة تحقق DM الصارمة كرسائل `m.notice`: الطلب، الجاهزية (مع إرشاد "التحقق بالرموز التعبيرية")، البدء/الإكمال، وتفاصيل SAS (الرموز التعبيرية/الأعداد العشرية) عند توفرها.

    يتم تتبع الطلبات الواردة من عميل Matrix آخر وقبولها تلقائيا. بالنسبة إلى التحقق الذاتي، يبدأ OpenClaw تدفق SAS تلقائيا ويؤكد جانبه بمجرد توفر التحقق بالرموز التعبيرية - لا تزال بحاجة إلى المقارنة وتأكيد "إنهما متطابقان" في عميل Matrix لديك.

    لا تتم إعادة توجيه إشعارات نظام التحقق إلى مسار محادثة الوكيل.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    إذا قال `verify status` إن الجهاز الحالي لم يعد مدرجا على خادم homeserver، فأنشئ جهاز OpenClaw Matrix جديدا. لتسجيل الدخول بكلمة مرور:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    لمصادقة الرمز، أنشئ رمز وصول جديدا في عميل Matrix أو واجهة الإدارة، ثم حدّث OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    استبدل `assistant` بمعرّف الحساب من الأمر الفاشل، أو احذف `--account` للحساب الافتراضي.

  </Accordion>

  <Accordion title="Device hygiene">
    يمكن أن تتراكم الأجهزة القديمة التي يديرها OpenClaw. اسردها ونظفها:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    يستخدم Matrix E2EE مسار تشفير Rust الرسمي في `matrix-js-sdk` مع `fake-indexeddb` كطبقة توافق IndexedDB. تستمر حالة التشفير في `crypto-idb-snapshot.json` (أذونات ملفات مقيدة).

    توجد حالة وقت التشغيل المشفرة تحت `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` وتشمل مخزن المزامنة، ومخزن التشفير، ومفتاح الاسترداد، ولقطة IDB، وارتباطات السلاسل، وحالة تحقق بدء التشغيل. عندما يتغير الرمز وتبقى هوية الحساب كما هي، يعيد OpenClaw استخدام أفضل جذر موجود بحيث تبقى الحالة السابقة مرئية.

  </Accordion>
</AccordionGroup>

## إدارة الملف الشخصي

حدّث الملف الشخصي الذاتي في Matrix للحساب المحدد:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

يمكنك تمرير الخيارين معا في استدعاء واحد. يقبل Matrix عناوين URL للصور الرمزية بصيغة `mxc://` مباشرة؛ وعندما تمرر `http://` أو `https://`، يرفع OpenClaw الملف أولا ويخزن عنوان URL بصيغة `mxc://` الذي تم حله في `channels.matrix.avatarUrl` (أو التجاوز الخاص بكل حساب).

## السلاسل

يدعم Matrix سلاسل Matrix الأصلية لكل من الردود التلقائية وإرسال أدوات الرسائل. يتحكم مفتاحان مستقلان في السلوك:

### توجيه الجلسة (`sessionScope`)

يقرر `dm.sessionScope` كيفية ربط غرف Matrix DM بجلسات OpenClaw:

- `"per-user"` (افتراضي): تشترك جميع غرف DM مع النظير الموجّه نفسه في جلسة واحدة.
- `"per-room"`: تحصل كل غرفة Matrix DM على مفتاح جلسة خاص بها، حتى عندما يكون النظير هو نفسه.

تنتصر ارتباطات المحادثة الصريحة دائما على `sessionScope`، لذلك تحتفظ الغرف والسلاسل المرتبطة بجلسة الهدف المختارة لها.

### تسلسل الردود (`threadReplies`)

يقرر `threadReplies` أين ينشر الروبوت رده:

- `"off"`: تكون الردود على المستوى الأعلى. تبقى الرسائل الواردة داخل السلاسل على جلسة الأصل.
- `"inbound"`: يرد داخل سلسلة فقط عندما تكون الرسالة الواردة موجودة بالفعل في تلك السلسلة.
- `"always"`: يرد داخل سلسلة متجذرة في الرسالة التي شغلت الرد؛ ويتم توجيه تلك المحادثة عبر جلسة مطابقة محددة النطاق بالسلسلة من أول تشغيل فصاعدا.

يتجاوز `dm.threadReplies` هذا لرسائل DM فقط - على سبيل المثال، لإبقاء سلاسل الغرف معزولة مع إبقاء رسائل DM مسطحة.

### وراثة السلاسل وأوامر slash

- تتضمن الرسائل الواردة ذات السلاسل رسالة جذر السلسلة كسياق إضافي للوكيل.
- ترث الإرسالات عبر أداة الرسائل تلقائيًا سلسلة Matrix الحالية عند استهداف الغرفة نفسها (أو هدف مستخدم الرسالة المباشرة نفسه)، ما لم يتم توفير `threadId` صريح.
- لا يبدأ إعادة استخدام هدف مستخدم الرسالة المباشرة إلا عندما تثبت بيانات الجلسة الوصفية الحالية وجود النظير نفسه في الرسالة المباشرة على حساب Matrix نفسه؛ وإلا يعود OpenClaw إلى التوجيه العادي ضمن نطاق المستخدم.
- تعمل `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` و`/acp spawn` المرتبطة بسلسلة كلها في غرف Matrix والرسائل المباشرة.
- تنشئ `/focus` على المستوى الأعلى سلسلة Matrix جديدة وتربطها بالجلسة المستهدفة عندما يكون `threadBindings.spawnSessions` مفعّلًا.
- يؤدي تشغيل `/focus` أو `/acp spawn --thread here` داخل سلسلة Matrix موجودة إلى ربط تلك السلسلة في مكانها.

عندما يكتشف OpenClaw تعارض غرفة رسالة مباشرة في Matrix مع غرفة رسالة مباشرة أخرى على الجلسة المشتركة نفسها، ينشر `m.notice` لمرة واحدة في تلك الغرفة يشير إلى مخرج `/focus` ويقترح تغيير `dm.sessionScope`. لا يظهر الإشعار إلا عندما تكون روابط السلاسل مفعّلة.

## روابط محادثات ACP

يمكن تحويل غرف Matrix والرسائل المباشرة وسلاسل Matrix الموجودة إلى مساحات عمل ACP دائمة من دون تغيير سطح الدردشة.

تدفق سريع للمشغّل:

- شغّل `/acp spawn codex --bind here` داخل رسالة Matrix المباشرة أو الغرفة أو السلسلة الموجودة التي تريد الاستمرار في استخدامها.
- في رسالة Matrix مباشرة أو غرفة على المستوى الأعلى، يبقى سطح الدردشة هو الرسالة المباشرة/الغرفة الحالية، وتُوجَّه الرسائل المستقبلية إلى جلسة ACP التي تم إنشاؤها.
- داخل سلسلة Matrix موجودة، يربط `--bind here` تلك السلسلة الحالية في مكانها.
- تعيد `/new` و`/reset` ضبط جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الرابط.

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

تكون عمليات إنشاء الجلسات المرتبطة بسلاسل Matrix مفعّلة افتراضيًا:

- اضبط `threadBindings.spawnSessions: false` لمنع `/focus` على المستوى الأعلى و`/acp spawn --thread auto|here` من إنشاء سلاسل Matrix أو ربطها.
- اضبط `threadBindings.defaultSpawnContext: "isolated"` عندما لا ينبغي لعمليات إنشاء سلاسل الوكلاء الفرعيين الأصلية أن تفرّع نص الجلسة الأصلية.

## التفاعلات

يدعم Matrix التفاعلات الصادرة، وإشعارات التفاعلات الواردة، وتفاعلات الإقرار.

تتحكم `channels.matrix.actions.reactions` في أدوات التفاعلات الصادرة:

- يضيف `react` تفاعلًا إلى حدث Matrix.
- يسرد `reactions` ملخص التفاعلات الحالي لحدث Matrix.
- يزيل `emoji=""` تفاعلات البوت نفسه على ذلك الحدث.
- يزيل `remove: true` تفاعل الرمز التعبيري المحدد فقط من البوت.

**ترتيب الحل** (تفوز أول قيمة معرّفة):

| الإعداد                 | الترتيب                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | لكل حساب → القناة → `messages.ackReaction` → احتياطي رمز تعبيري لهوية الوكيل   |
| `ackReactionScope`      | لكل حساب → القناة → `messages.ackReactionScope` → الافتراضي `"group-mentions"` |
| `reactionNotifications` | لكل حساب → القناة → الافتراضي `"own"`                                          |

توجّه `reactionNotifications: "own"` أحداث `m.reaction` المضافة عندما تستهدف رسائل Matrix التي أنشأها البوت؛ وتعطّل `"off"` أحداث نظام التفاعلات. لا تُنشأ أحداث نظامية من عمليات إزالة التفاعلات لأن Matrix يعرضها كتنقيحات، لا كعمليات إزالة `m.reaction` مستقلة.

## سياق السجل

- يتحكم `channels.matrix.historyLimit` في عدد رسائل الغرفة الحديثة التي تُضمَّن كـ`InboundHistory` عندما تؤدي رسالة غرفة Matrix إلى تشغيل الوكيل. يعود إلى `messages.groupChat.historyLimit`؛ وإذا لم يُضبط كلاهما، يكون الافتراضي الفعّال `0`. اضبطه على `0` للتعطيل.
- سجل غرف Matrix خاص بالغرفة فقط. تستمر الرسائل المباشرة في استخدام سجل الجلسة العادي.
- سجل غرف Matrix قيد الانتظار فقط: يخزّن OpenClaw رسائل الغرفة التي لم تؤدِ إلى رد بعد، ثم يأخذ لقطة لتلك النافذة عند وصول إشارة ذكر أو مشغّل آخر.
- لا تُضمَّن رسالة التشغيل الحالية في `InboundHistory`؛ بل تبقى في متن الوارد الرئيسي لتلك الدورة.
- تعيد محاولات حدث Matrix نفسه استخدام لقطة السجل الأصلية بدل الانزلاق إلى رسائل غرفة أحدث.

## رؤية السياق

يدعم Matrix عنصر التحكم المشترك `contextVisibility` لسياق الغرفة التكميلي مثل نص الرد الذي تم جلبه، وجذور السلاسل، والسجل قيد الانتظار.

- `contextVisibility: "all"` هو الافتراضي. يُحتفظ بالسياق التكميلي كما تم استلامه.
- يرشّح `contextVisibility: "allowlist"` السياق التكميلي إلى المرسلين المسموح لهم عبر فحوصات قائمة السماح النشطة للغرفة/المستخدم.
- يتصرف `contextVisibility: "allowlist_quote"` مثل `allowlist`، لكنه لا يزال يحتفظ برد مقتبس صريح واحد.

يؤثر هذا الإعداد في رؤية السياق التكميلي، لا في ما إذا كان يمكن للرسالة الواردة نفسها تشغيل رد.
ما زال تفويض التشغيل يأتي من `groupPolicy` و`groups` و`groupAllowFrom` وإعدادات سياسة الرسائل المباشرة.

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

راجع [المجموعات](/ar/channels/groups) للاطلاع على سلوك بوابة الذكر وقائمة السماح.

مثال اقتران للرسائل المباشرة في Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

إذا واصل مستخدم Matrix غير المعتمد مراسلتك قبل الاعتماد، يعيد OpenClaw استخدام رمز الاقتران المعلّق نفسه وقد يرسل رد تذكير بعد فترة تهدئة قصيرة بدل إصدار رمز جديد.

راجع [الاقتران](/ar/channels/pairing) للاطلاع على تدفق اقتران الرسائل المباشرة المشترك وتخطيط التخزين.

## إصلاح الغرف المباشرة

إذا خرجت حالة الرسائل المباشرة عن المزامنة، يمكن أن ينتهي OpenClaw بتعيينات `m.direct` قديمة تشير إلى غرف فردية قديمة بدل الرسالة المباشرة النشطة. افحص التعيين الحالي لنظير:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

أصلحه:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

يقبل كلا الأمرين `--account <id>` لإعدادات الحسابات المتعددة. تدفق الإصلاح:

- يفضّل رسالة مباشرة صارمة 1:1 معيّنة مسبقًا في `m.direct`
- يعود إلى أي رسالة مباشرة صارمة 1:1 منضمة حاليًا مع ذلك المستخدم
- ينشئ غرفة مباشرة جديدة ويعيد كتابة `m.direct` إذا لم توجد رسالة مباشرة سليمة

لا يحذف الغرف القديمة تلقائيًا. يختار الرسالة المباشرة السليمة ويحدّث التعيين بحيث تستهدف إرسالات Matrix المستقبلية وإشعارات التحقق وتدفقات الرسائل المباشرة الأخرى الغرفة الصحيحة.

## موافقات التنفيذ

يمكن أن يعمل Matrix كعميل موافقة أصلي. اضبطه ضمن `channels.matrix.execApprovals` (أو `channels.matrix.accounts.<account>.execApprovals` لتجاوز لكل حساب):

- `enabled`: يسلّم الموافقات عبر مطالبات Matrix الأصلية. عندما لا يكون مضبوطًا أو يكون `"auto"`، يفعّل Matrix نفسه تلقائيًا بمجرد إمكانية حلّ معتمد واحد على الأقل. اضبطه على `false` للتعطيل الصريح.
- `approvers`: معرّفات مستخدمي Matrix (`@owner:example.org`) المسموح لهم بالموافقة على طلبات التنفيذ. اختياري - يعود إلى `channels.matrix.dm.allowFrom`.
- `target`: المكان الذي تذهب إليه المطالبات. يرسل `"dm"` (الافتراضي) إلى رسائل المعتمدين المباشرة؛ ويرسل `"channel"` إلى غرفة Matrix أو الرسالة المباشرة الأصلية؛ ويرسل `"both"` إلى كليهما.
- `agentFilter` / `sessionFilter`: قوائم سماح اختيارية للوكلاء/الجلسات التي تؤدي إلى تسليم Matrix.

يختلف التفويض قليلًا بين أنواع الموافقات:

- تستخدم **موافقات التنفيذ** `execApprovals.approvers`، مع الرجوع إلى `dm.allowFrom`.
- تفوّض **موافقات Plugin** عبر `dm.allowFrom` فقط.

يشترك كلا النوعين في اختصارات تفاعلات Matrix وتحديثات الرسائل. يرى المعتمدون اختصارات التفاعل على رسالة الموافقة الأساسية:

- `✅` السماح مرة واحدة
- `❌` الرفض
- `♾️` السماح دائمًا (عندما تسمح سياسة التنفيذ الفعّالة بذلك)

أوامر الشرطة المائلة الاحتياطية: `/approve <id> allow-once` و`/approve <id> allow-always` و`/approve <id> deny`.

يمكن للمعتمدين الذين تم حلّهم فقط الموافقة أو الرفض. يتضمن تسليم القناة لموافقات التنفيذ نص الأمر - لا تفعّل `channel` أو `both` إلا في الغرف الموثوقة.

ذات صلة: [موافقات التنفيذ](/ar/tools/exec-approvals).

## أوامر الشرطة المائلة

تعمل أوامر الشرطة المائلة (`/new` و`/reset` و`/model` و`/focus` و`/unfocus` و`/agents` و`/session` و`/acp` و`/approve` وغيرها) مباشرة في الرسائل المباشرة. في الغرف، يتعرف OpenClaw أيضًا على الأوامر المسبوقة بذكر Matrix الخاص بالبوت نفسه، لذلك يؤدي `@bot:server /new` إلى تشغيل مسار الأمر من دون تعبير منتظم مخصص للذكر. يبقي هذا البوت مستجيبًا لمنشورات الغرف بأسلوب `@mention /command` التي يصدرها Element والعملاء المشابهون عندما يستخدم مستخدم الإكمال بعلامة التبويب للبوت قبل كتابة الأمر.

ما زالت قواعد التفويض تنطبق: يجب أن يستوفي مرسلو الأوامر سياسات قائمة السماح/المالك نفسها للرسائل المباشرة أو الغرف كما في الرسائل العادية.

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

- تعمل قيم `channels.matrix` على المستوى الأعلى كإعدادات افتراضية للحسابات المسماة ما لم يتجاوزها حساب.
- احصر إدخال غرفة موروثًا في حساب محدد باستخدام `groups.<room>.account`. الإدخالات من دون `account` تكون مشتركة عبر الحسابات؛ وما زال `account: "default"` يعمل عندما يكون الحساب الافتراضي مضبوطًا على المستوى الأعلى.

**اختيار الحساب الافتراضي:**

- اضبط `defaultAccount` لاختيار الحساب المسمى الذي تفضّله عمليات التوجيه والتحقق وأوامر CLI الضمنية.
- إذا كانت لديك حسابات متعددة وكان أحدها مسمى حرفيًا `default`، يستخدمه OpenClaw ضمنيًا حتى عندما لا يكون `defaultAccount` مضبوطًا.
- إذا كانت لديك حسابات مسماة متعددة ولم يتم اختيار حساب افتراضي، ترفض أوامر CLI التخمين - اضبط `defaultAccount` أو مرّر `--account <id>`.
- لا تُعامل كتلة `channels.matrix.*` على المستوى الأعلى كحساب `default` الضمني إلا عندما تكون مصادقتها كاملة (`homeserver` + `accessToken`، أو `homeserver` + `userId` + `password`). تبقى الحسابات المسماة قابلة للاكتشاف من `homeserver` + `userId` بمجرد أن تغطي بيانات الاعتماد المخزنة مؤقتًا المصادقة.

**الترقية:**

- عندما يرقّي OpenClaw إعداد حساب واحد إلى حسابات متعددة أثناء الإصلاح أو الإعداد، فإنه يحافظ على الحساب المسمى الموجود إذا كان موجودًا أو كان `defaultAccount` يشير بالفعل إلى أحدها. تنتقل مفاتيح مصادقة/تهيئة Matrix فقط إلى الحساب المرقّى؛ وتبقى مفاتيح سياسة التسليم المشتركة على المستوى الأعلى.

راجع [مرجع الإعدادات](/ar/gateway/config-channels#multi-account-all-channels) للاطلاع على نمط الحسابات المتعددة المشترك.

## خوادم المنازل الخاصة/الشبكة المحلية

بشكل افتراضي، يحظر OpenClaw خوادم منازل Matrix الخاصة/الداخلية للحماية من SSRF ما لم تختر
ذلك صراحة لكل حساب.

إذا كان خادم منزلك يعمل على localhost أو عنوان IP في شبكة محلية/Tailscale أو اسم مضيف داخلي، ففعّل
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

يسمح هذا الاشتراك الصريح بالأهداف الخاصة/الداخلية الموثوقة فقط. تظل خوادم homeserver العامة غير المشفرة مثل
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

يمكن للحسابات المسماة تجاوز الإعداد الافتراضي ذي المستوى الأعلى باستخدام `channels.matrix.accounts.<id>.proxy`.
يستخدم OpenClaw إعداد الوكيل نفسه لحركة Matrix وقت التشغيل وفحوصات حالة الحساب.

## حلّ الهدف

يقبل Matrix صيغ الأهداف هذه في أي موضع يطلب فيه OpenClaw هدف غرفة أو مستخدم:

- المستخدمون: `@user:server`، أو `user:@user:server`، أو `matrix:user:@user:server`
- الغرف: `!room:server`، أو `room:!room:server`، أو `matrix:room:!room:server`
- الأسماء المستعارة: `#alias:server`، أو `channel:#alias:server`، أو `matrix:channel:#alias:server`

معرّفات غرف Matrix حساسة لحالة الأحرف. استخدم حالة الأحرف الدقيقة لمعرّف الغرفة من Matrix
عند تكوين أهداف التسليم الصريحة أو مهام cron أو الربط أو قوائم السماح.
يحافظ OpenClaw على مفاتيح الجلسات الداخلية بصيغة معيارية للتخزين، لذا فإن تلك المفاتيح ذات الأحرف الصغيرة
ليست مصدرًا موثوقًا لمعرّفات تسليم Matrix.

يستخدم البحث المباشر في الدليل حساب Matrix المسجل دخوله:

- تستعلم عمليات البحث عن المستخدمين دليل مستخدمي Matrix على ذلك homeserver.
- تقبل عمليات البحث عن الغرف معرّفات الغرف الصريحة والأسماء المستعارة مباشرة. البحث باسم الغرفة المنضم إليها يبذل أفضل جهد وينطبق فقط على قوائم سماح الغرف وقت التشغيل عند ضبط `dangerouslyAllowNameMatching: true`.
- إذا تعذر حلّ اسم غرفة إلى معرّف أو اسم مستعار، فسيتم تجاهله أثناء حلّ قائمة السماح وقت التشغيل.

## مرجع التكوين

تقبل حقول المستخدمين من نمط قائمة السماح (`groupAllowFrom`، `dm.allowFrom`، `groups.<room>.users`) معرّفات مستخدمي Matrix الكاملة (الأكثر أمانًا). يتم تجاهل إدخالات المستخدمين غير المعرّفة افتراضيًا. إذا ضبطت `dangerouslyAllowNameMatching: true`، فسيتم حلّ مطابقات أسماء العرض الدقيقة في دليل Matrix عند بدء التشغيل وكلما تغيرت قائمة السماح أثناء تشغيل المراقب؛ ويتم تجاهل الإدخالات التي لا يمكن حلّها وقت التشغيل.

ينبغي أن تكون مفاتيح قائمة سماح الغرف (`groups`، و`rooms` القديمة) معرّفات غرف أو أسماء مستعارة. يتم تجاهل مفاتيح أسماء الغرف العادية افتراضيًا؛ ويعيد `dangerouslyAllowNameMatching: true` تمكين البحث بأفضل جهد في أسماء الغرف المنضم إليها.

### الحساب والاتصال

- `enabled`: تمكين القناة أو تعطيلها.
- `name`: تسمية عرض اختيارية للحساب.
- `defaultAccount`: معرّف الحساب المفضل عند تكوين عدة حسابات Matrix.
- `accounts`: تجاوزات مسماة لكل حساب. تُورث قيم `channels.matrix` ذات المستوى الأعلى كإعدادات افتراضية.
- `homeserver`: عنوان URL لخادم homeserver، مثل `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: السماح لهذا الحساب بالاتصال بـ `localhost` أو عناوين IP للشبكة المحلية/Tailscale أو أسماء المضيفين الداخلية.
- `proxy`: عنوان URL اختياري لوكيل HTTP(S) لحركة Matrix. يدعم التجاوز لكل حساب.
- `userId`: معرّف مستخدم Matrix الكامل (`@bot:example.org`).
- `accessToken`: رمز الوصول للمصادقة المستندة إلى الرمز. قيم النص الصريح وSecretRef مدعومة عبر مزودي env/file/exec ([إدارة الأسرار](/ar/gateway/secrets)).
- `password`: كلمة المرور لتسجيل الدخول المستند إلى كلمة المرور. قيم النص الصريح وSecretRef مدعومة.
- `deviceId`: معرّف جهاز Matrix صريح.
- `deviceName`: اسم عرض الجهاز المستخدم وقت تسجيل الدخول بكلمة المرور.
- `avatarUrl`: عنوان URL للصورة الرمزية الذاتية المخزنة لمزامنة الملف الشخصي وتحديثات `profile set`.
- `initialSyncLimit`: الحد الأقصى لعدد الأحداث المجلبة أثناء مزامنة بدء التشغيل.

### التشفير

- `encryption`: تمكين E2EE. الافتراضي: `false`.
- `startupVerification`: `"if-unverified"` (الافتراضي عند تشغيل E2EE) أو `"off"`. يطلب التحقق الذاتي تلقائيًا عند بدء التشغيل عندما يكون هذا الجهاز غير موثق.
- `startupVerificationCooldownHours`: فترة التهدئة قبل طلب بدء التشغيل التلقائي التالي. الافتراضي: `24`.

### الوصول والسياسة

- `groupPolicy`: `"open"`، أو `"allowlist"`، أو `"disabled"`. الافتراضي: `"allowlist"`.
- `groupAllowFrom`: قائمة سماح لمعرّفات المستخدمين لحركة الغرف.
- `dm.enabled`: عند `false`، تجاهل كل الرسائل المباشرة. الافتراضي: `true`.
- `dm.policy`: `"pairing"` (الافتراضي)، أو `"allowlist"`، أو `"open"`، أو `"disabled"`. تنطبق بعد انضمام البوت وتصنيف الغرفة كرسالة مباشرة؛ ولا تؤثر في معالجة الدعوات.
- `dm.allowFrom`: قائمة سماح لمعرّفات المستخدمين لحركة الرسائل المباشرة.
- `dm.sessionScope`: `"per-user"` (الافتراضي) أو `"per-room"`.
- `dm.threadReplies`: تجاوز خاص بالرسائل المباشرة لترابط الردود (`"off"`، `"inbound"`، `"always"`).
- `allowBots`: قبول الرسائل من حسابات بوت Matrix الأخرى المكوّنة (`true` أو `"mentions"`).
- `allowlistOnly`: عند `true`، يفرض تحويل كل سياسات الرسائل المباشرة النشطة (باستثناء `"disabled"`) وسياسات المجموعات `"open"` إلى `"allowlist"`. لا يغيّر سياسات `"disabled"`.
- `dangerouslyAllowNameMatching`: عند `true`، يسمح بالبحث في دليل أسماء العرض في Matrix لإدخالات قائمة سماح المستخدمين، وبالبحث في أسماء الغرف المنضم إليها لمفاتيح قائمة سماح الغرف. فضّل معرّفات `@user:server` الكاملة ومعرّفات الغرف أو الأسماء المستعارة.
- `autoJoin`: `"always"`، أو `"allowlist"`، أو `"off"`. الافتراضي: `"off"`. ينطبق على كل دعوة Matrix، بما في ذلك الدعوات بنمط الرسائل المباشرة.
- `autoJoinAllowlist`: الغرف/الأسماء المستعارة المسموح بها عندما يكون `autoJoin` هو `"allowlist"`. يتم حلّ إدخالات الأسماء المستعارة مقابل homeserver، وليس مقابل الحالة التي تدعيها الغرفة الداعية.
- `contextVisibility`: رؤية السياق الإضافي (`"all"` افتراضيًا، `"allowlist"`، `"allowlist_quote"`).

### سلوك الرد

- `replyToMode`: `"off"`، أو `"first"`، أو `"all"`، أو `"batched"`.
- `threadReplies`: `"off"`، أو `"inbound"`، أو `"always"`.
- `threadBindings`: تجاوزات لكل قناة لتوجيه الجلسات المرتبطة بالترابط ودورة حياتها.
- `streaming`: `"off"` (الافتراضي)، أو `"partial"`، أو `"quiet"`، أو صيغة كائن `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`، و`false` ↔ `"off"`.
- `blockStreaming`: عند `true`، تُحفظ كتل المساعد المكتملة كرسائل تقدم منفصلة.
- `markdown`: تكوين اختياري لتصيير Markdown للنص الصادر.
- `responsePrefix`: سلسلة اختيارية تُضاف في بداية الردود الصادرة.
- `textChunkLimit`: حجم المقطع الصادر بالأحرف عند `chunkMode: "length"`. الافتراضي: `4000`.
- `chunkMode`: `"length"` (الافتراضي، يقسم حسب عدد الأحرف) أو `"newline"` (يقسم عند حدود الأسطر).
- `historyLimit`: عدد رسائل الغرفة الحديثة المضمنة كـ `InboundHistory` عندما تشغّل رسالة غرفة الوكيل. يعود إلى `messages.groupChat.historyLimit`؛ الافتراضي الفعّال `0` (معطّل).
- `mediaMaxMb`: حد حجم الوسائط بالميغابايت للإرسال الصادر والمعالجة الواردة.

### إعدادات التفاعل

- `ackReaction`: تجاوز تفاعل الإقرار لهذه القناة/الحساب.
- `ackReactionScope`: تجاوز النطاق (`"group-mentions"` افتراضيًا، `"group-all"`، `"direct"`، `"all"`، `"none"`، `"off"`).
- `reactionNotifications`: وضع إشعارات التفاعل الواردة (`"own"` افتراضيًا، `"off"`).

### الأدوات والتجاوزات لكل غرفة

- `actions`: تقييد الأدوات لكل إجراء (`messages`، `reactions`، `pins`، `profile`، `memberInfo`، `channelInfo`، `verification`).
- `groups`: خريطة سياسة لكل غرفة. تستخدم هوية الجلسة معرّف الغرفة الثابت بعد الحل. (`rooms` اسم مستعار قديم.)
  - `groups.<room>.account`: تقييد إدخال غرفة موروث واحد بحساب محدد.
  - `groups.<room>.allowBots`: تجاوز لكل غرفة لإعداد مستوى القناة (`true` أو `"mentions"`).
  - `groups.<room>.users`: قائمة سماح للمرسلين لكل غرفة.
  - `groups.<room>.tools`: تجاوزات سماح/منع الأدوات لكل غرفة.
  - `groups.<room>.autoReply`: تجاوز بوابة الإشارات لكل غرفة. `true` يعطّل متطلبات الإشارة لتلك الغرفة؛ و`false` يفرضها مجددًا.
  - `groups.<room>.skills`: مرشح Skills لكل غرفة.
  - `groups.<room>.systemPrompt`: مقتطف موجّه النظام لكل غرفة.

### إعدادات موافقة exec

- `execApprovals.enabled`: تسليم موافقات exec عبر مطالبات Matrix الأصلية.
- `execApprovals.approvers`: معرّفات مستخدمي Matrix المسموح لهم بالموافقة. يعود إلى `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (الافتراضي)، أو `"channel"`، أو `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: قوائم سماح اختيارية للوكيل/الجلسة للتسليم.

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) - كل القنوات المدعومة
- [الاقتران](/ar/channels/pairing) - مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) - سلوك دردشة المجموعات وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) - توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) - نموذج الوصول والتحصين
