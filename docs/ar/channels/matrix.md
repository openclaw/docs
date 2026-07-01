---
read_when:
    - إعداد Matrix في OpenClaw
    - تكوين E2EE والتحقق في Matrix
summary: حالة دعم Matrix، والإعداد، وأمثلة التهيئة
title: مصفوفة
x-i18n:
    generated_at: "2026-07-01T13:02:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2aa86a477c4f15e792ba01c45bb06f37a55fee26ee2c895bfa308ff57ef6d819
    source_path: channels/matrix.md
    workflow: 16
---

Matrix هو Plugin قناة قابل للتنزيل من أجل OpenClaw.
يستخدم `matrix-js-sdk` الرسمي ويدعم الرسائل المباشرة، والغرف، والسلاسل، والوسائط، والتفاعلات، والاستطلاعات، والموقع، وE2EE.

## التثبيت

ثبّت Matrix من ClawHub قبل تهيئة القناة:

```bash
openclaw plugins install @openclaw/matrix
```

تحاول مواصفات Plugin المجرّدة استخدام ClawHub أولًا، ثم الرجوع إلى npm. لفرض مصدر السجل، استخدم `openclaw plugins install clawhub:@openclaw/matrix` أو `openclaw plugins install npm:@openclaw/matrix`.

من نسخة محلية:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

يسجّل `plugins install` الـ Plugin ويفعّله، لذلك لا حاجة إلى خطوة منفصلة مثل `openclaw plugins enable matrix`. مع ذلك، لا يفعل الـ Plugin شيئًا حتى تهيئ القناة أدناه. راجع [Plugins](/ar/tools/plugin) لمعرفة سلوك Plugin العام وقواعد التثبيت.

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

يسألك المعالج عن: عنوان URL للخادم المنزلي، وطريقة المصادقة (رمز وصول أو كلمة مرور)، ومعرّف المستخدم (لمصادقة كلمة المرور فقط)، واسم جهاز اختياري، وما إذا كنت تريد تفعيل E2EE، وما إذا كنت تريد تهيئة وصول الغرف والانضمام التلقائي.

إذا كانت متغيرات البيئة المطابقة `MATRIX_*` موجودة بالفعل ولا يملك الحساب المحدد مصادقة محفوظة، يعرض المعالج اختصارًا عبر متغيرات البيئة. لحل أسماء الغرف قبل حفظ قائمة السماح، شغّل `openclaw channels resolve --channel matrix "Project Room"`. عند تفعيل E2EE، يكتب المعالج التهيئة ويشغّل نفس التمهيد مثل [`openclaw matrix encryption setup`](#encryption-and-verification).

### تهيئة بالحد الأدنى

قائمة على الرمز:

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

قائمة على كلمة المرور (يُخزَّن الرمز مؤقتًا بعد أول تسجيل دخول):

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

القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`. مع القيمة الافتراضية، لن يظهر البوت في الغرف الجديدة أو الرسائل المباشرة الناتجة عن دعوات جديدة حتى تنضم يدويًا.

لا يستطيع OpenClaw أن يعرف وقت الدعوة ما إذا كانت الغرفة المدعو إليها رسالة مباشرة أم مجموعة، لذلك تمر كل الدعوات - بما في ذلك دعوات نمط الرسائل المباشرة - عبر `autoJoin` أولًا. لا تنطبق `dm.policy` إلا لاحقًا، بعد أن ينضم البوت وتصنَّف الغرفة.

<Warning>
اضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` لتقييد الدعوات التي يقبلها البوت، أو `autoJoin: "always"` لقبول كل دعوة.

لا تقبل `autoJoinAllowlist` إلا الأهداف المستقرة: `!roomId:server`، أو `#alias:server`، أو `*`. تُرفض أسماء الغرف العادية؛ تُحل إدخالات الأسماء المستعارة مقابل الخادم المنزلي، وليس مقابل الحالة التي تدّعيها الغرفة المدعو إليها.
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

- الرسائل المباشرة (`dm.allowFrom`، `groupAllowFrom`، `groups.<room>.users`): استخدم `@user:server`. تُتجاهل أسماء العرض افتراضيًا لأنها قابلة للتغيير؛ اضبط `dangerouslyAllowNameMatching: true` فقط عندما تحتاج صراحة إلى التوافق مع إدخالات أسماء العرض.
- مفاتيح قائمة السماح للغرف (`groups`، و`rooms` القديمة): استخدم `!room:server` أو `#alias:server`. تُتجاهل أسماء الغرف العادية افتراضيًا؛ اضبط `dangerouslyAllowNameMatching: true` فقط عندما تحتاج صراحة إلى التوافق مع البحث عن اسم غرفة منضم إليها.
- قوائم سماح الدعوات (`autoJoinAllowlist`): استخدم `!room:server`، أو `#alias:server`، أو `*`. تُرفض أسماء الغرف العادية.

### تطبيع معرّف الحساب

يحوّل المعالج الاسم الودي إلى معرّف حساب مطبّع. على سبيل المثال، يصبح `Ops Bot` هو `ops-bot`. تُهرَّب علامات الترقيم في أسماء متغيرات البيئة المحددة النطاق حتى لا يتصادم حسابان: `-` ← `_X2D_`، لذلك يُطابق `ops-prod` النمط `MATRIX_OPS_X2D_PROD_*`.

### بيانات الاعتماد المخزنة مؤقتًا

يخزّن Matrix بيانات الاعتماد المؤقتة ضمن `~/.openclaw/credentials/matrix/`:

- الحساب الافتراضي: `credentials.json`
- الحسابات المسماة: `credentials-<account>.json`

عند وجود بيانات اعتماد مخزنة مؤقتًا هناك، يتعامل OpenClaw مع Matrix على أنه مهيأ حتى إذا لم يكن رمز الوصول موجودًا في ملف التهيئة - وهذا يغطي الإعداد، و`openclaw doctor`، وفحوصات حالة القناة.

### متغيرات البيئة

تُستخدم عندما لا يكون مفتاح التهيئة المكافئ مضبوطًا. يستخدم الحساب الافتراضي أسماء غير مسبوقة؛ وتستخدم الحسابات المسماة معرّف الحساب المُدرج قبل اللاحقة.

| الحساب الافتراضي       | الحساب المسمى (`<ID>` هو معرّف الحساب المطبّع) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

بالنسبة إلى الحساب `ops`، تصبح الأسماء `MATRIX_OPS_HOMESERVER` و`MATRIX_OPS_ACCESS_TOKEN` وهكذا. تقرأ مسارات CLI المدركة للاسترداد متغيرات بيئة مفتاح الاسترداد (`verify backup restore`، و`verify device`، و`verify bootstrap`) عندما تمرر المفتاح عبر `--recovery-key-stdin`.

لا يمكن ضبط `MATRIX_HOMESERVER` من ملف `.env` في مساحة العمل؛ راجع [ملفات `.env` لمساحة العمل](/ar/gateway/security).

## مثال تهيئة

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

بث ردود Matrix اختياري. يتحكم `streaming` في كيفية تسليم OpenClaw لرد المساعد قيد التنفيذ؛ ويتحكم `blockStreaming` فيما إذا كان كل مقطع مكتمل يُحفظ كرسالة Matrix مستقلة.

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

تقبل صيغة الكائن الكاملة `{ mode, preview, progress }`:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // pick from configured or built-in labels (false to hide)
          labels: ["Thinking", "Writing", "Searching"], // candidates for label: "auto"
          maxLines: 8, // max rolling progress lines (default: 8)
          maxLineChars: 120, // max chars per line before truncation (default: 120)
          toolProgress: true, // show tool/progress activity (default: true)
        },
      },
    },
  },
}
```

- `progress.label`: تسمية مخصصة، أو `"auto"` أو غير مضبوطة للاختيار من التسميات المهيأة أو المضمنة، أو `false` لإخفاء سطر التسمية.
- `progress.labels`: تسميات مرشحة لا تُستخدم إلا عندما تكون `label` هي `"auto"` أو غير مضبوطة. اتركها غير مضبوطة لاستخدام القيم الافتراضية المضمنة.
- `progress.maxLines`: الحد الأقصى لأسطر التقدم المتحركة المحتفظ بها في المسودة. بعد هذا الحد، تُقص الأسطر الأقدم.
- `progress.maxLineChars`: الحد الأقصى لعدد الأحرف في كل سطر تقدم مضغوط قبل القص.
- `progress.toolProgress`: عند `true` (افتراضيًا)، يظهر نشاط الأدوات/التقدم المباشر في المسودة.

| `streaming`       | السلوك                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (افتراضي) | ينتظر الرد الكامل ويرسله مرة واحدة. `true` ↔ `"partial"`، و`false` ↔ `"off"`.                                                                                        |
| `"partial"`       | يحرر رسالة نصية عادية واحدة في مكانها أثناء كتابة النموذج للمقطع الحالي. قد تنبّه عملاء Matrix القياسيون عند أول معاينة، لا عند التعديل النهائي.              |
| `"quiet"`         | مثل `"partial"` لكن الرسالة إشعار غير منبّه. لا يتلقى المستلمون إشعارًا إلا عندما تطابق قاعدة دفع لكل مستخدم التعديل النهائي (انظر أدناه). |
| `"progress"`      | يرسل أسطر تقدم مضغوطة منفردة باستخدام مسودة تقدم.                                                                                                     |

`blockStreaming` مستقل عن `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (افتراضي)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | مسودة مباشرة للمقطع الحالي، مع الاحتفاظ بالمقاطع المكتملة كرسائل | مسودة مباشرة للمقطع الحالي، وتُنهى في مكانها |
| `"off"`                 | رسالة Matrix واحدة منبّهة لكل مقطع منتهٍ                     | رسالة Matrix واحدة منبّهة للرد الكامل      |

ملاحظات:

- إذا تجاوزت المعاينة حد حجم Matrix لكل حدث، يوقف OpenClaw بث المعاينة ويرجع إلى التسليم النهائي فقط.
- تُرسل ردود الوسائط دائمًا المرفقات كالمعتاد. إذا لم يعد بالإمكان إعادة استخدام معاينة قديمة بأمان، يحجبها OpenClaw قبل إرسال رد الوسائط النهائي.
- تُفعّل تحديثات معاينة تقدم الأدوات افتراضيًا عندما يكون بث معاينة Matrix نشطًا. اضبط `streaming.preview.toolProgress: false` للاحتفاظ بتعديلات المعاينة لنص الإجابة مع ترك تقدم الأدوات على مسار التسليم العادي.
- تكلف تعديلات المعاينة استدعاءات إضافية إلى واجهة Matrix API. اترك `streaming: "off"` إذا أردت أكثر ملف تعريف محافظ لحدود المعدّل.

## الرسائل الصوتية

تُنسخ ملاحظات Matrix الصوتية الواردة قبل بوابة ذكر الغرفة. يتيح ذلك لملاحظة صوتية تقول اسم البوت أن تشغّل الوكيل في غرفة `requireMention: true`، ويمنح الوكيل النص المنسوخ بدلًا من مجرد عنصر نائب لمرفق صوتي.

يستخدم Matrix موفر الوسائط الصوتية المشترك المهيأ ضمن `tools.media.audio`، مثل OpenAI `gpt-4o-mini-transcribe`. راجع [نظرة عامة على أدوات الوسائط](/ar/tools/media-overview) لإعداد الموفر والحدود.

تفاصيل السلوك:

- تُعد أحداث `m.audio` وأحداث `m.file` ذات نوع MIME من النمط `audio/*` مؤهلة.
- في الغرف المشفّرة، يفك OpenClaw تشفير المرفق عبر مسار وسائط Matrix الحالي قبل النسخ.
- يُعلَّم النص المنسوخ على أنه منشأ آليًا وغير موثوق في موجّه الوكيل.
- يُعلَّم المرفق على أنه نُسخ بالفعل حتى لا تنسخ أدوات الوسائط اللاحقة الملاحظة الصوتية نفسها مرة أخرى.
- اضبط `tools.media.audio.enabled: false` لتعطيل نسخ الصوت عالميًا.

## بيانات الموافقة الوصفية

مطالبات الموافقة الأصلية في Matrix هي أحداث `m.room.message` عادية مع محتوى حدث مخصص خاص بـ OpenClaw تحت `com.openclaw.approval`. يسمح Matrix بمفاتيح مخصصة لمحتوى الأحداث، لذا تستمر العملاء القياسية في عرض متن النص بينما يمكن للعملاء المدركين لـ OpenClaw قراءة معرّف الموافقة المنظّم، والنوع، والحالة، والقرارات المتاحة، وتفاصيل التنفيذ/Plugin.

عندما تكون مطالبة الموافقة أطول من أن تتسع في حدث Matrix واحد، يجزّئ OpenClaw النص المرئي ويرفق `com.openclaw.approval` بالجزء الأول فقط. تُربط تفاعلات قرارات السماح/الرفض بذلك الحدث الأول، لذا تحتفظ المطالبات الطويلة بهدف الموافقة نفسه مثل المطالبات ذات الحدث الواحد.

### قواعد الدفع ذاتية الاستضافة للمعاينات النهائية الهادئة

لا يُشعر `streaming: "quiet"` المستلمين إلا مرة واحدة عند إنهاء كتلة أو دورة - يجب أن تطابق قاعدة دفع لكل مستخدم علامة المعاينة النهائية. راجع [قواعد دفع Matrix للمعاينات الهادئة](/ar/channels/matrix-push-rules) للوصفة الكاملة (رمز المستلم، فحص الدافع، تثبيت القاعدة، ملاحظات لكل خادم منزلي).

## غرف روبوت إلى روبوت

افتراضيًا، تُتجاهل رسائل Matrix من حسابات Matrix الأخرى المضبوطة لـ OpenClaw.

استخدم `allowBots` عندما تريد عمدًا حركة Matrix بين الوكلاء:

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

- يقبل `allowBots: true` الرسائل من حسابات روبوت Matrix الأخرى المضبوطة في الغرف والرسائل المباشرة المسموح بها.
- يقبل `allowBots: "mentions"` تلك الرسائل فقط عندما تذكر هذا الروبوت بوضوح في الغرف. تظل الرسائل المباشرة مسموحًا بها.
- يتجاوز `groups.<room>.allowBots` إعداد مستوى الحساب لغرفة واحدة.
- تستخدم رسائل الروبوتات المضبوطة المقبولة [حماية حلقة الروبوت](/ar/channels/bot-loop-protection) المشتركة. اضبط `channels.defaults.botLoopProtection`، ثم تجاوزه باستخدام `channels.matrix.botLoopProtection` أو `channels.matrix.groups.<room>.botLoopProtection` عندما تحتاج غرفة واحدة إلى ميزانية مختلفة.
- لا يزال OpenClaw يتجاهل الرسائل من معرّف مستخدم Matrix نفسه لتجنب حلقات الرد الذاتي.
- لا يعرّض Matrix علامة روبوت أصلية هنا؛ يتعامل OpenClaw مع "منشأ بواسطة روبوت" على أنه "مرسل بواسطة حساب Matrix آخر مضبوط على Gateway OpenClaw هذا".

استخدم قوائم سماح غرف صارمة ومتطلبات ذكر عند تمكين حركة روبوت إلى روبوت في الغرف المشتركة.

## التشفير والتحقق

في الغرف المشفّرة (E2EE)، تستخدم أحداث الصور الصادرة `thumbnail_file` بحيث تُشفّر معاينات الصور بجانب المرفق الكامل. لا تزال الغرف غير المشفّرة تستخدم `thumbnail_url` العادي. لا حاجة إلى إعداد - يكتشف Plugin حالة E2EE تلقائيًا.

تقبل كل أوامر `openclaw matrix` ‎`--verbose` (تشخيصات كاملة)، و`--json` (مخرجات قابلة للقراءة آليًا)، و`--account <id>` (إعدادات متعددة الحسابات). تكون المخرجات موجزة افتراضيًا مع تسجيل داخلي هادئ لـ SDK. تُظهر الأمثلة أدناه الصيغة القياسية؛ أضف العلامات حسب الحاجة.

### تمكين التشفير

```bash
openclaw matrix encryption setup
```

يمهّد التخزين السري والتوقيع المتبادل، وينشئ نسخة احتياطية لمفتاح الغرفة عند الحاجة، ثم يطبع الحالة والخطوات التالية. علامات مفيدة:

- `--recovery-key <key>` طبّق مفتاح استرداد قبل التمهيد (فضّل صيغة stdin الموثقة أدناه)
- `--force-reset-cross-signing` تخلّص من هوية التوقيع المتبادل الحالية وأنشئ واحدة جديدة (استخدمه عمدًا فقط)

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

يبلّغ `verify status` عن ثلاث إشارات ثقة مستقلة (يعرض `--verbose` جميعها):

- `Locally trusted`: موثوق به من هذا العميل فقط
- `Cross-signing verified`: يبلّغ SDK عن التحقق عبر التوقيع المتبادل
- `Signed by owner`: موقّع بمفتاح التوقيع الذاتي الخاص بك (تشخيصي فقط)

تصبح `Verified by owner` مساوية لـ `yes` فقط عندما تكون `Cross-signing verified` مساوية لـ `yes`. الثقة المحلية أو توقيع المالك وحده لا يكفي.

يعيد `--allow-degraded-local-state` تشخيصات بأفضل جهد من دون تحضير حساب Matrix أولًا؛ وهو مفيد للفحوصات غير المتصلة أو المضبوطة جزئيًا.

### تحقق من هذا الجهاز باستخدام مفتاح استرداد

مفتاح الاسترداد حساس - مرّره عبر stdin بدلًا من تمريره في سطر الأوامر. اضبط `MATRIX_RECOVERY_KEY` (أو `MATRIX_<ID>_RECOVERY_KEY` لحساب مسمى):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

يبلّغ الأمر عن ثلاث حالات:

- `Recovery key accepted`: قبل Matrix المفتاح للتخزين السري أو ثقة الجهاز.
- `Backup usable`: يمكن تحميل النسخة الاحتياطية لمفاتيح الغرف باستخدام مادة الاسترداد الموثوقة.
- `Device verified by owner`: يملك هذا الجهاز ثقة هوية التوقيع المتبادل الكاملة في Matrix.

يخرج برمز غير صفري عندما تكون ثقة الهوية الكاملة غير مكتملة، حتى إذا فتح مفتاح الاسترداد مادة النسخ الاحتياطي. في هذه الحالة، أنهِ التحقق الذاتي من عميل Matrix آخر:

```bash
openclaw matrix verify self
```

ينتظر `verify self` ظهور `Cross-signing verified: yes` قبل أن يخرج بنجاح. استخدم `--timeout-ms <ms>` لضبط مدة الانتظار.

تُقبل أيضًا صيغة المفتاح الحرفية `openclaw matrix verify device "<recovery-key>"`، لكن المفتاح سينتهي في سجل shell لديك.

### تمهيد التوقيع المتبادل أو إصلاحه

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` هو أمر الإصلاح والإعداد للحسابات المشفّرة. بالترتيب، هو:

- يمهّد التخزين السري، مع إعادة استخدام مفتاح استرداد موجود عندما يكون ذلك ممكنًا
- يمهّد التوقيع المتبادل ويرفع المفاتيح العامة الناقصة
- يعلّم الجهاز الحالي ويوقّعه توقيعًا متبادلًا
- ينشئ نسخة احتياطية لمفاتيح الغرف على جهة الخادم إذا لم تكن موجودة بالفعل

إذا كان الخادم المنزلي يتطلب UIA لرفع مفاتيح التوقيع المتبادل، يحاول OpenClaw أولًا بلا مصادقة، ثم `m.login.dummy`، ثم `m.login.password` (يتطلب `channels.matrix.password`).

علامات مفيدة:

- `--recovery-key-stdin` (استخدمه مع `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) أو `--recovery-key <key>`
- `--force-reset-cross-signing` للتخلص من هوية التوقيع المتبادل الحالية (عمدًا فقط؛ يتطلب تخزين مفتاح الاسترداد النشط أو توفيره باستخدام `--recovery-key-stdin`)

### النسخة الاحتياطية لمفاتيح الغرف

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

يعرض `backup status` ما إذا كانت هناك نسخة احتياطية على جهة الخادم وما إذا كان هذا الجهاز يستطيع فك تشفيرها. يستورد `backup restore` مفاتيح الغرف المنسوخة احتياطيًا إلى مخزن التشفير المحلي؛ إذا كان مفتاح الاسترداد موجودًا بالفعل على القرص، يمكنك حذف `--recovery-key-stdin`.

لاستبدال نسخة احتياطية معطلة بخط أساس جديد (يقبل فقدان السجل القديم غير القابل للاسترداد؛ ويمكنه أيضًا إعادة إنشاء التخزين السري إذا كان سر النسخة الاحتياطية الحالي غير قابل للتحميل):

```bash
openclaw matrix verify backup reset --yes
```

أضف `--rotate-recovery-key` فقط عندما تريد عمدًا أن يتوقف مفتاح الاسترداد السابق عن فتح خط أساس النسخة الاحتياطية الجديد.

### سرد عمليات التحقق وطلبها والاستجابة لها

```bash
openclaw matrix verify list
```

يسرد طلبات التحقق المعلقة للحساب المحدد.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

يرسل طلب تحقق من حساب OpenClaw هذا. يطلب `--own-user` التحقق الذاتي (تقبل المطالبة في عميل Matrix آخر للمستخدم نفسه)؛ وتستهدف `--user-id`/`--device-id`/`--room-id` شخصًا آخر. لا يمكن دمج `--own-user` مع علامات الاستهداف الأخرى.

للتعامل مع دورة الحياة على مستوى أدنى - عادةً أثناء متابعة الطلبات الواردة من عميل آخر - تعمل هذه الأوامر على طلب محدد `<id>` (يطبع بواسطة `verify list` و`verify request`):

| الأمر                                      | الغرض                                                               |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | قبول طلب وارد                                                       |
| `openclaw matrix verify start <id>`        | بدء تدفق SAS                                                        |
| `openclaw matrix verify sas <id>`          | طباعة رموز SAS التعبيرية أو الأعداد العشرية                         |
| `openclaw matrix verify confirm-sas <id>`  | تأكيد أن SAS يطابق ما يعرضه العميل الآخر                            |
| `openclaw matrix verify mismatch-sas <id>` | رفض SAS عندما لا تتطابق الرموز التعبيرية أو الأعداد العشرية          |
| `openclaw matrix verify cancel <id>`       | إلغاء؛ يأخذ اختياريًا `--reason <text>` و`--code <matrix-code>`      |

تقبل كل من `accept` و`start` و`sas` و`confirm-sas` و`mismatch-sas` و`cancel` العلامتين `--user-id` و`--room-id` كتلميحات متابعة للرسائل المباشرة عندما يكون التحقق مثبتًا بغرفة رسائل مباشرة محددة.

### ملاحظات الحسابات المتعددة

من دون `--account <id>`، تستخدم أوامر CLI الخاصة بـ Matrix الحساب الافتراضي الضمني. إذا كان لديك عدة حسابات مسماة ولم تضبط `channels.matrix.defaultAccount`، فسترفض التخمين وتطلب منك الاختيار. عندما يكون E2EE معطلًا أو غير متاح لحساب مسمى، تشير الأخطاء إلى مفتاح إعداد ذلك الحساب، مثل `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="سلوك بدء التشغيل">
    مع `encryption: true`، تكون القيمة الافتراضية لـ `startupVerification` هي `"if-unverified"`. عند بدء التشغيل، يطلب جهاز غير متحقق منه تحققًا ذاتيًا في عميل Matrix آخر، مع تخطي التكرارات وتطبيق فترة تهدئة (24 ساعة افتراضيًا). اضبط ذلك باستخدام `startupVerificationCooldownHours` أو عطّله باستخدام `startupVerification: "off"`.

    يشغّل بدء التشغيل أيضًا تمريرة تمهيد تشفير محافظة تعيد استخدام التخزين السري الحالي وهوية التوقيع المتبادل. إذا كانت حالة التمهيد معطلة، يحاول OpenClaw إصلاحًا محروسًا حتى من دون `channels.matrix.password`؛ وإذا كان الخادم المنزلي يتطلب UIA بكلمة مرور، يسجل بدء التشغيل تحذيرًا ويبقى غير قاتل. تُحافظ الأجهزة الموقّعة مسبقًا من المالك.

    راجع [ترحيل Matrix](/ar/channels/matrix-migration) لتدفق الترقية الكامل.

  </Accordion>

  <Accordion title="إشعارات التحقق">
    ينشر Matrix إشعارات دورة حياة التحقق في غرفة التحقق الصارمة للرسائل المباشرة كرسائل `m.notice`: الطلب، والجاهزية (مع إرشادات "تحقق بالرموز التعبيرية")، والبدء/الإكمال، وتفاصيل SAS (رموز تعبيرية/عشرية) عند توفرها.

    تُتتبع الطلبات الواردة من عميل Matrix آخر وتُقبل تلقائيًا. بالنسبة إلى التحقق الذاتي، يبدأ OpenClaw تدفق SAS تلقائيًا ويؤكد جانبه بمجرد توفر التحقق بالرموز التعبيرية - ما زلت بحاجة إلى المقارنة وتأكيد "إنها متطابقة" في عميل Matrix لديك.

    لا تُمرر إشعارات نظام التحقق إلى مسار دردشة الوكيل.

  </Accordion>

  <Accordion title="جهاز Matrix محذوف أو غير صالح">
    إذا قال `verify status` إن الجهاز الحالي لم يعد مدرجًا على الخادم المنزلي، فأنشئ جهاز Matrix جديدًا لـ OpenClaw. لتسجيل الدخول بكلمة مرور:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    لمصادقة الرمز، أنشئ رمز وصول جديدًا في عميل Matrix أو واجهة الإدارة، ثم حدّث OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    استبدل `assistant` بمعرّف الحساب من الأمر الفاشل، أو احذف `--account` لاستخدام الحساب الافتراضي.

  </Accordion>

  <Accordion title="Device hygiene">
    يمكن أن تتراكم الأجهزة القديمة المُدارة بواسطة OpenClaw. اعرضها ونظّفها:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    يستخدم تشفير Matrix E2EE مسار التشفير الرسمي المبني على Rust في `matrix-js-sdk` مع `fake-indexeddb` كطبقة توافق IndexedDB. تستمر حالة التشفير في `crypto-idb-snapshot.json` (بأذونات ملفات مقيّدة).

    تعيش حالة وقت التشغيل المشفّرة تحت `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` وتشمل مخزن المزامنة، ومخزن التشفير، ومفتاح الاسترداد، ولقطة IDB، وربط الخيوط، وحالة التحقق عند بدء التشغيل. عندما يتغير الرمز مع بقاء هوية الحساب كما هي، يعيد OpenClaw استخدام أفضل جذر موجود حتى تظل الحالة السابقة مرئية.

    يمكن أن يكون جذر رمز قديم واحد قائم على تجزئة الرمز مسارًا طبيعيًا لاستمرارية تدوير الرموز. إذا سجّل OpenClaw `matrix: multiple populated token-hash storage roots detected`، فافحص دليل الحساب وأرشف الجذور الشقيقة القديمة فقط بعد التأكد من أن الجذر النشط المحدد سليم. يُفضّل نقل الجذور القديمة إلى دليل `_archive/` بدلًا من حذفها فورًا.

  </Accordion>
</AccordionGroup>

## إدارة الملف الشخصي

حدّث ملف Matrix الذاتي للحساب المحدد:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

يمكنك تمرير الخيارين في استدعاء واحد. يقبل Matrix عناوين URL للصور الرمزية بصيغة `mxc://` مباشرة؛ وعند تمرير `http://` أو `https://`، يرفع OpenClaw الملف أولًا ويخزن عنوان URL المحلول بصيغة `mxc://` في `channels.matrix.avatarUrl` (أو التجاوز الخاص بكل حساب).

## الخيوط

يدعم Matrix خيوط Matrix الأصلية لكل من الردود التلقائية وإرسالات أداة الرسائل. يتحكم مقبضان مستقلان في السلوك:

### توجيه الجلسات (`sessionScope`)

يحدد `dm.sessionScope` كيفية ربط غرف رسائل Matrix المباشرة بجلسات OpenClaw:

- `"per-user"` (الافتراضي): تشترك كل غرف الرسائل المباشرة مع النظير الموجّه نفسه في جلسة واحدة.
- `"per-room"`: تحصل كل غرفة رسائل مباشرة في Matrix على مفتاح جلسة خاص بها، حتى عندما يكون النظير نفسه.

تتغلب روابط المحادثات الصريحة دائمًا على `sessionScope`، لذلك تحتفظ الغرف والخيوط المرتبطة بجلسة الهدف المختارة.

### ربط الردود بالخيوط (`threadReplies`)

يحدد `threadReplies` أين ينشر البوت رده:

- `"off"`: تكون الردود في المستوى الأعلى. تبقى الرسائل الواردة ضمن خيط على الجلسة الأصلية.
- `"inbound"`: يرد داخل خيط فقط عندما تكون الرسالة الواردة موجودة أصلًا في ذلك الخيط.
- `"always"`: يرد داخل خيط متجذر في الرسالة التي أطلقت التفاعل؛ وتُوجّه تلك المحادثة عبر جلسة مطابقة بنطاق الخيط بدءًا من أول تشغيل.

يتجاوز `dm.threadReplies` هذا لرسائل DM فقط - على سبيل المثال، إبقاء خيوط الغرف معزولة مع إبقاء رسائل DM مسطحة.

### وراثة الخيوط وأوامر الشرطة المائلة

- تتضمن الرسائل الواردة ضمن خيط رسالة جذر الخيط كسياق إضافي للوكيل.
- ترث إرسالات أداة الرسائل خيط Matrix الحالي تلقائيًا عند استهداف الغرفة نفسها (أو هدف مستخدم DM نفسه)، ما لم يتم توفير `threadId` صريح.
- لا تبدأ إعادة استخدام هدف مستخدم DM إلا عندما تثبت بيانات تعريف الجلسة الحالية النظير نفسه في DM على حساب Matrix نفسه؛ وإلا يعود OpenClaw إلى التوجيه العادي بنطاق المستخدم.
- تعمل `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` و`/acp spawn` المرتبطة بالخيوط كلها في غرف Matrix ورسائل DM.
- تنشئ `/focus` في المستوى الأعلى خيط Matrix جديدًا وتربطه بجلسة الهدف عندما يكون `threadBindings.spawnSessions` مفعّلًا.
- يؤدي تشغيل `/focus` أو `/acp spawn --thread here` داخل خيط Matrix قائم إلى ربط ذلك الخيط في مكانه.

عندما يكتشف OpenClaw أن غرفة DM في Matrix تتصادم مع غرفة DM أخرى على الجلسة المشتركة نفسها، ينشر `m.notice` لمرة واحدة في تلك الغرفة يشير إلى مخرج `/focus` ويقترح تغيير `dm.sessionScope`. لا يظهر الإشعار إلا عندما تكون روابط الخيوط مفعّلة.

## روابط محادثات ACP

يمكن تحويل غرف Matrix ورسائل DM وخيوط Matrix الحالية إلى مساحات عمل ACP دائمة من دون تغيير سطح الدردشة.

تدفق سريع للمشغّل:

- شغّل `/acp spawn codex --bind here` داخل رسالة DM أو غرفة Matrix أو الخيط الحالي الذي تريد الاستمرار في استخدامه.
- في رسالة DM أو غرفة Matrix بالمستوى الأعلى، يبقى DM/الغرفة الحالية سطح الدردشة وتُوجّه الرسائل المستقبلية إلى جلسة ACP المنشأة.
- داخل خيط Matrix قائم، يربط `--bind here` ذلك الخيط الحالي في مكانه.
- يعيد `/new` و`/reset` ضبط جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الرابط.

ملاحظات:

- لا ينشئ `--bind here` خيط Matrix فرعيًا.
- يتحكم `threadBindings.spawnSessions` في `/acp spawn --thread auto|here`، حيث يحتاج OpenClaw إلى إنشاء خيط Matrix فرعي أو ربطه.

### إعدادات ربط الخيوط

يرث Matrix الإعدادات الافتراضية العامة من `session.threadBindings`، ويدعم أيضًا تجاوزات لكل قناة:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

تكون عمليات إنشاء الجلسات المرتبطة بخيوط Matrix مفعّلة افتراضيًا:

- عيّن `threadBindings.spawnSessions: false` لمنع `/focus` في المستوى الأعلى و`/acp spawn --thread auto|here` من إنشاء أو ربط خيوط Matrix.
- عيّن `threadBindings.defaultSpawnContext: "isolated"` عندما يجب ألا تفرّع عمليات إنشاء خيوط الوكيل الفرعي الأصلية نص الجلسة الأب.

## التفاعلات

يدعم Matrix التفاعلات الصادرة، وإشعارات التفاعلات الواردة، وتفاعلات الإقرار.

تتحكم `channels.matrix.actions.reactions` في أدوات التفاعل الصادر:

- يضيف `react` تفاعلًا إلى حدث Matrix.
- يعرض `reactions` ملخص التفاعلات الحالي لحدث Matrix.
- يزيل `emoji=""` تفاعلات البوت نفسه على ذلك الحدث.
- يزيل `remove: true` تفاعل الرمز التعبيري المحدد فقط من البوت.

**ترتيب الحل** (أول قيمة معرّفة تفوز):

| الإعداد                 | الترتيب                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | لكل حساب → قناة → `messages.ackReaction` → رجوع احتياطي إلى رمز تعبيري لهوية الوكيل   |
| `ackReactionScope`      | لكل حساب → قناة → `messages.ackReactionScope` → الافتراضي `"group-mentions"` |
| `reactionNotifications` | لكل حساب → قناة → الافتراضي `"own"`                                          |

يمرر `reactionNotifications: "own"` أحداث `m.reaction` المضافة عندما تستهدف رسائل Matrix التي أنشأها البوت؛ ويعطل `"off"` أحداث نظام التفاعل. لا تُركّب عمليات إزالة التفاعلات كأحداث نظام لأن Matrix يعرضها كعمليات تنقيح، لا كعمليات إزالة مستقلة لـ `m.reaction`.

## سياق السجل

- يتحكم `channels.matrix.historyLimit` في عدد رسائل الغرفة الحديثة المضمنة كـ `InboundHistory` عندما تطلق رسالة غرفة Matrix الوكيل. يعود إلى `messages.groupChat.historyLimit`؛ وإذا لم يتم تعيين أي منهما، تكون القيمة الافتراضية الفعلية `0`. عيّن `0` للتعطيل.
- يقتصر سجل غرف Matrix على الغرفة فقط. تستمر رسائل DM في استخدام سجل الجلسات العادي.
- سجل غرف Matrix معلّق فقط: يخزن OpenClaw مؤقتًا رسائل الغرفة التي لم تطلق ردًا بعد، ثم يلتقط لقطة لتلك النافذة عند وصول إشارة ذكر أو مشغّل آخر.
- لا تُضمن رسالة التشغيل الحالية في `InboundHistory`؛ بل تبقى في متن الرسالة الواردة الرئيسي لذلك الدور.
- تعيد محاولات حدث Matrix نفسه استخدام لقطة السجل الأصلية بدلًا من الانزلاق إلى الأمام نحو رسائل غرفة أحدث.

## رؤية السياق

يدعم Matrix عنصر التحكم المشترك `contextVisibility` لسياق الغرفة التكميلي مثل نص الرد المجلب، وجذور الخيوط، والسجل المعلق.

- `contextVisibility: "all"` هو الافتراضي. يُحتفظ بالسياق التكميلي كما تم استلامه.
- يرشّح `contextVisibility: "allowlist"` السياق التكميلي إلى المرسلين المسموح لهم عبر فحوصات قائمة السماح النشطة للغرفة/المستخدم.
- يتصرف `contextVisibility: "allowlist_quote"` مثل `allowlist`، لكنه ما زال يحتفظ برد مقتبس صريح واحد.

يؤثر هذا الإعداد في رؤية السياق التكميلي، وليس في ما إذا كانت الرسالة الواردة نفسها يمكنها إطلاق رد.
لا يزال تفويض التشغيل يأتي من `groupPolicy` و`groups` و`groupAllowFrom` وإعدادات سياسة DM.

## سياسة DM والغرف

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

لإسكات رسائل DM بالكامل مع إبقاء الغرف عاملة، عيّن `dm.enabled: false`:

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

راجع [المجموعات](/ar/channels/groups) لمعرفة سلوك بوابة الذكر وقائمة السماح.

مثال اقتران لرسائل Matrix DM:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

إذا واصل مستخدم Matrix غير معتمد مراسلتك قبل الموافقة، يعيد OpenClaw استخدام رمز الاقتران المعلق نفسه وقد يرسل رد تذكير بعد فترة تهدئة قصيرة بدلًا من سك رمز جديد.

راجع [الاقتران](/ar/channels/pairing) لتدفق اقتران DM المشترك وتخطيط التخزين.

## إصلاح الغرفة المباشرة

إذا انحرفت حالة الرسائل المباشرة عن المزامنة، فقد ينتهي OpenClaw بتعيينات `m.direct` قديمة تشير إلى غرف فردية قديمة بدلًا من DM الحي. افحص التعيين الحالي لنظير:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

أصلحه:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

يقبل كلا الأمرين `--account <id>` لإعدادات الحسابات المتعددة. يتبع تدفق الإصلاح ما يلي:

- يفضّل DM صارمًا بنسبة 1:1 معيّنًا مسبقًا في `m.direct`
- يعود إلى أي DM صارم بنسبة 1:1 منضم إليه حاليًا مع ذلك المستخدم
- ينشئ غرفة مباشرة جديدة ويعيد كتابة `m.direct` إذا لم توجد DM سليمة

لا يحذف الغرف القديمة تلقائيًا. يختار DM السليم ويحدّث التعيين حتى تستهدف إرسالات Matrix المستقبلية، وإشعارات التحقق، وتدفقات الرسائل المباشرة الأخرى الغرفة الصحيحة.

## موافقات التنفيذ

يمكن لـ Matrix أن يعمل كعميل موافقات أصلي. اضبط ضمن `channels.matrix.execApprovals` (أو `channels.matrix.accounts.<account>.execApprovals` لتجاوز خاص بكل حساب):

- `enabled`: يسلّم الموافقات عبر مطالبات Matrix الأصلية. عند عدم تعيينه أو عند تعيينه إلى `"auto"`، يفعّل Matrix نفسه تلقائيًا بمجرد إمكانية حل موافق واحد على الأقل. عيّن `false` للتعطيل صراحة.
- `approvers`: معرّفات مستخدمي Matrix (`@owner:example.org`) المسموح لهم بالموافقة على طلبات التنفيذ. اختياري - يعود إلى `channels.matrix.dm.allowFrom`.
- `target`: حيث تذهب المطالبات. يرسل `"dm"` (الافتراضي) إلى رسائل DM الخاصة بالموافقين؛ ويرسل `"channel"` إلى غرفة Matrix أو DM الأصلية؛ ويرسل `"both"` إلى كليهما.
- `agentFilter` / `sessionFilter`: قوائم سماح اختيارية تحدد أي وكلاء/جلسات تطلق تسليم Matrix.

يختلف التفويض قليلًا بين أنواع الموافقات:

- تستخدم **موافقات التنفيذ** `execApprovals.approvers`، مع الرجوع إلى `dm.allowFrom`.
- تفوّض **موافقات Plugin** عبر `dm.allowFrom` فقط.

يشترك النوعان في اختصارات تفاعل Matrix وتحديثات الرسائل. يرى الموافقون اختصارات التفاعل على رسالة الموافقة الأساسية:

- `✅` السماح مرة واحدة
- `❌` الرفض
- `♾️` السماح دائمًا (عندما تسمح سياسة التنفيذ الفعلية بذلك)

أوامر slash الاحتياطية: `/approve <id> allow-once`، و`/approve <id> allow-always`، و`/approve <id> deny`.

لا يمكن الموافقة أو الرفض إلا للموافقين الذين تم حلهم. يتضمن تسليم القناة لموافقات exec نص الأمر - لا تفعّل `channel` أو `both` إلا في الغرف الموثوقة.

ذو صلة: [موافقات Exec](/ar/tools/exec-approvals).

## أوامر slash

تعمل أوامر slash (`/new`، و`/reset`، و`/model`، و`/focus`، و`/unfocus`، و`/agents`، و`/session`، و`/acp`، و`/approve`، إلخ) مباشرة في الرسائل الخاصة. في الغرف، يتعرف OpenClaw أيضًا على الأوامر التي تبدأ بإشارة Matrix الخاصة بالبوت نفسه، لذلك يؤدي `@bot:server /new` إلى تشغيل مسار الأمر من دون regex إشارة مخصصة. يحافظ هذا على استجابة البوت لمنشورات نمط الغرف `@mention /command` التي يصدرها Element والعملاء المشابهون عندما يكمل المستخدم اسم البوت باستخدام Tab قبل كتابة الأمر.

لا تزال قواعد التفويض سارية: يجب أن يستوفي مرسلو الأوامر سياسات قائمة السماح/المالك نفسها للرسائل الخاصة أو الغرف مثل الرسائل العادية.

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

- تعمل قيم `channels.matrix` ذات المستوى الأعلى كإعدادات افتراضية للحسابات المسماة ما لم يتجاوزها حساب.
- احصر إدخال غرفة موروثًا على حساب محدد باستخدام `groups.<room>.account`. تتم مشاركة الإدخالات التي لا تحتوي على `account` بين الحسابات؛ ويظل `account: "default"` يعمل عندما يكون الحساب الافتراضي مهيأ في المستوى الأعلى.

**اختيار الحساب الافتراضي:**

- عيّن `defaultAccount` لاختيار الحساب المسمى الذي تفضله التوجيهات الضمنية، والفحص، وأوامر CLI.
- إذا كانت لديك عدة حسابات وكان أحدها اسمه حرفيًا `default`، يستخدمه OpenClaw ضمنيًا حتى عندما لا يكون `defaultAccount` معينًا.
- إذا كانت لديك عدة حسابات مسماة ولم يتم تحديد حساب افتراضي، ترفض أوامر CLI التخمين - عيّن `defaultAccount` أو مرر `--account <id>`.
- لا تُعامل كتلة `channels.matrix.*` ذات المستوى الأعلى كحساب `default` الضمني إلا عندما تكون مصادقتها مكتملة (`homeserver` + `accessToken`، أو `homeserver` + `userId` + `password`). تظل الحسابات المسماة قابلة للاكتشاف من `homeserver` + `userId` بمجرد أن تغطي بيانات الاعتماد المخزنة مؤقتًا المصادقة.

**الترقية:**

- عندما يرقي OpenClaw تهيئة حساب واحد إلى حسابات متعددة أثناء الإصلاح أو الإعداد، فإنه يحافظ على الحساب المسمى الموجود إذا كان موجودًا أو كان `defaultAccount` يشير بالفعل إلى حساب. تنتقل مفاتيح مصادقة/تمهيد Matrix فقط إلى الحساب المُرقى؛ وتبقى مفاتيح سياسة التسليم المشتركة في المستوى الأعلى.

راجع [مرجع التهيئة](/ar/gateway/config-channels#multi-account-all-channels) لمعرفة النمط المشترك للحسابات المتعددة.

## خوادم homeserver الخاصة/على LAN

افتراضيًا، يحظر OpenClaw خوادم Matrix الخاصة/الداخلية للحماية من SSRF ما لم
تشترك صراحةً لكل حساب.

إذا كان homeserver لديك يعمل على localhost أو عنوان IP على LAN/Tailscale أو اسم مضيف داخلي، ففعّل
`network.dangerouslyAllowPrivateNetwork` لحساب Matrix ذلك:

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

لا يسمح هذا الاشتراك إلا بالأهداف الخاصة/الداخلية الموثوقة. تظل خوادم homeserver العامة بنص واضح مثل
`http://matrix.example.org:8008` محظورة. فضّل `https://` كلما أمكن.

## تمرير حركة مرور Matrix عبر Proxy

إذا كان نشر Matrix لديك يحتاج إلى وكيل HTTP(S) صادر صريح، فعيّن `channels.matrix.proxy`:

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
يستخدم OpenClaw إعداد الوكيل نفسه لحركة مرور Matrix وقت التشغيل وفحوصات حالة الحساب.

## حل الهدف

تقبل Matrix نماذج الأهداف هذه في أي مكان يطلب منك OpenClaw فيه هدف غرفة أو مستخدم:

- المستخدمون: `@user:server`، أو `user:@user:server`، أو `matrix:user:@user:server`
- الغرف: `!room:server`، أو `room:!room:server`، أو `matrix:room:!room:server`
- الأسماء المستعارة: `#alias:server`، أو `channel:#alias:server`، أو `matrix:channel:#alias:server`

معرفات غرف Matrix حساسة لحالة الأحرف. استخدم حالة الأحرف الدقيقة لمعرف الغرفة من Matrix
عند تهيئة أهداف التسليم الصريحة أو مهام Cron أو الارتباطات أو قوائم السماح.
يحافظ OpenClaw على مفاتيح الجلسات الداخلية بصيغة معيارية للتخزين، لذلك فإن تلك المفاتيح الصغيرة
ليست مصدرًا موثوقًا لمعرفات تسليم Matrix.

يستخدم بحث الدليل الحي حساب Matrix المسجل دخوله:

- تستعلم عمليات بحث المستخدمين عن دليل مستخدمي Matrix على ذلك homeserver.
- تقبل عمليات بحث الغرف معرفات الغرف والأسماء المستعارة الصريحة مباشرة. بحث اسم الغرفة المنضم إليها اجتهادي ولا ينطبق إلا على قوائم سماح الغرف وقت التشغيل عند تعيين `dangerouslyAllowNameMatching: true`.
- إذا تعذر حل اسم غرفة إلى معرف أو اسم مستعار، يتم تجاهله بواسطة حل قائمة السماح وقت التشغيل.

## مرجع التهيئة

تقبل حقول المستخدمين بنمط قائمة السماح (`groupAllowFrom`، و`dm.allowFrom`، و`groups.<room>.users`) معرفات مستخدمي Matrix الكاملة (الأكثر أمانًا). يتم تجاهل إدخالات المستخدمين التي ليست معرفات افتراضيًا. إذا عيّنت `dangerouslyAllowNameMatching: true`، فسيتم حل التطابقات الدقيقة لأسماء العرض في دليل Matrix عند بدء التشغيل وكلما تغيرت قائمة السماح أثناء تشغيل المراقب؛ ويتم تجاهل الإدخالات التي لا يمكن حلها وقت التشغيل.

يجب أن تكون مفاتيح قائمة سماح الغرف (`groups`، و`rooms` القديمة) معرفات غرف أو أسماء مستعارة. يتم تجاهل مفاتيح أسماء الغرف العادية افتراضيًا؛ يستعيد `dangerouslyAllowNameMatching: true` البحث الاجتهادي مقابل أسماء الغرف المنضم إليها.

### الحساب والاتصال

- `enabled`: تفعيل القناة أو تعطيلها.
- `name`: تسمية عرض اختيارية للحساب.
- `defaultAccount`: معرف الحساب المفضل عند تهيئة عدة حسابات Matrix.
- `accounts`: تجاوزات مسماة لكل حساب. تُورث قيم `channels.matrix` ذات المستوى الأعلى كإعدادات افتراضية.
- `homeserver`: عنوان URL للـ homeserver، على سبيل المثال `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: السماح لهذا الحساب بالاتصال بـ `localhost` أو عناوين IP على LAN/Tailscale أو أسماء المضيفين الداخلية.
- `proxy`: عنوان URL اختياري لوكيل HTTP(S) لحركة مرور Matrix. تجاوز لكل حساب مدعوم.
- `userId`: معرف مستخدم Matrix الكامل (`@bot:example.org`).
- `accessToken`: رمز وصول للمصادقة المعتمدة على الرموز. قيم النص العادي وSecretRef مدعومة عبر موفري env/file/exec ([إدارة الأسرار](/ar/gateway/secrets)).
- `password`: كلمة مرور لتسجيل الدخول المعتمد على كلمة المرور. قيم النص العادي وSecretRef مدعومة.
- `deviceId`: معرف جهاز Matrix صريح.
- `deviceName`: اسم عرض الجهاز المستخدم وقت تسجيل الدخول بكلمة مرور.
- `avatarUrl`: عنوان URL للصورة الرمزية الذاتية المخزنة لمزامنة الملف الشخصي وتحديثات `profile set`.
- `initialSyncLimit`: الحد الأقصى لعدد الأحداث المجلبة أثناء مزامنة بدء التشغيل.

### التشفير

- `encryption`: تفعيل E2EE. الافتراضي: `false`.
- `startupVerification`: `"if-unverified"` (الافتراضي عند تشغيل E2EE) أو `"off"`. يطلب التحقق الذاتي تلقائيًا عند بدء التشغيل عندما يكون هذا الجهاز غير موثق.
- `startupVerificationCooldownHours`: فترة التهدئة قبل طلب بدء التشغيل التلقائي التالي. الافتراضي: `24`.

### الوصول والسياسة

- `groupPolicy`: `"open"`، أو `"allowlist"`، أو `"disabled"`. الافتراضي: `"allowlist"`.
- `groupAllowFrom`: قائمة سماح بمعرفات المستخدمين لحركة مرور الغرف.
- `mentionPatterns`: أنماط regex محددة النطاق لإشارات الغرف. كائن يحتوي على `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. يتحكم فيما إذا كانت `agents.list[].groupChat.mentionPatterns` المهيأة تنطبق لكل غرفة.
- `dm.enabled`: عند `false`، تجاهل كل الرسائل الخاصة. الافتراضي: `true`.
- `dm.policy`: `"pairing"` (افتراضي)، أو `"allowlist"`، أو `"open"`، أو `"disabled"`. تنطبق بعد أن ينضم البوت ويصنف الغرفة كرسالة خاصة؛ ولا تؤثر في معالجة الدعوات.
- `dm.allowFrom`: قائمة سماح بمعرفات المستخدمين لحركة مرور الرسائل الخاصة.
- `dm.sessionScope`: `"per-user"` (افتراضي) أو `"per-room"`.
- `dm.threadReplies`: تجاوز خاص بالرسائل الخاصة لترابط الردود (`"off"`، أو `"inbound"`، أو `"always"`).
- `allowBots`: قبول الرسائل من حسابات بوت Matrix المهيأة الأخرى (`true` أو `"mentions"`).
- `allowlistOnly`: عند `true`، يفرض كل سياسات الرسائل الخاصة النشطة (باستثناء `"disabled"`) وسياسات الغرف `"open"` على `"allowlist"`. لا يغير سياسات `"disabled"`.
- `dangerouslyAllowNameMatching`: عند `true`، يسمح ببحث دليل أسماء عرض Matrix لإدخالات قائمة سماح المستخدمين وبحث أسماء الغرف المنضم إليها لمفاتيح قائمة سماح الغرف. فضّل معرفات `@user:server` الكاملة ومعرفات الغرف أو الأسماء المستعارة.
- `autoJoin`: `"always"`، أو `"allowlist"`، أو `"off"`. الافتراضي: `"off"`. ينطبق على كل دعوة Matrix، بما في ذلك الدعوات بنمط الرسائل الخاصة.
- `autoJoinAllowlist`: الغرف/الأسماء المستعارة المسموح بها عندما تكون `autoJoin` هي `"allowlist"`. يتم حل إدخالات الأسماء المستعارة مقابل homeserver، وليس مقابل الحالة التي تدعيها الغرفة المدعو إليها.
- `contextVisibility`: رؤية سياق تكميلية (`"all"` افتراضيًا، أو `"allowlist"`، أو `"allowlist_quote"`).

### سلوك الرد

- `replyToMode`: `"off"`، أو `"first"`، أو `"all"`، أو `"batched"`.
- `threadReplies`: `"off"`، أو `"inbound"`، أو `"always"`.
- `threadBindings`: تجاوزات لكل قناة لتوجيه الجلسات المرتبطة بالخيوط ودورة حياتها.
- `streaming`: `"off"` (افتراضي)، أو `"partial"`، أو `"quiet"`، أو `"progress"`، أو صيغة كائن `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `true` ↔ `"partial"`، و`false` ↔ `"off"`.
- `blockStreaming`: عند `true`، يتم الاحتفاظ بكتل المساعد المكتملة كرسائل تقدم منفصلة.
- `markdown`: تهيئة اختيارية لعرض Markdown للنص الصادر.
- `responsePrefix`: سلسلة اختيارية تُضاف قبل الردود الصادرة.
- `textChunkLimit`: حجم الجزء الصادر بالأحرف عندما يكون `chunkMode: "length"`. الافتراضي: `4000`.
- `chunkMode`: `"length"` (افتراضي، يقسم حسب عدد الأحرف) أو `"newline"` (يقسم عند حدود الأسطر).
- `historyLimit`: عدد رسائل الغرفة الحديثة المضمنة كـ `InboundHistory` عندما تؤدي رسالة غرفة إلى تشغيل الوكيل. يعود إلى `messages.groupChat.historyLimit`؛ الافتراضي الفعلي `0` (معطل).
- `mediaMaxMb`: حد حجم الوسائط بالميغابايت للإرسال الصادر والمعالجة الواردة.

### إعدادات التفاعل

- `ackReaction`: تجاوز تفاعل الإقرار لهذه القناة/الحساب.
- `ackReactionScope`: تجاوز النطاق (`"group-mentions"` افتراضيًا، و`"group-all"`، و`"direct"`، و`"all"`، و`"none"`، و`"off"`).
- `reactionNotifications`: وضع إشعارات التفاعل الواردة (`"own"` افتراضيًا، و`"off"`).

### الأدوات والتجاوزات لكل غرفة

- `actions`: تقييد الأدوات لكل إجراء (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: خريطة السياسات لكل غرفة. تستخدم هوية الجلسة معرّف الغرفة الثابت بعد الحل. (`rooms` اسم مستعار قديم.)
  - `groups.<room>.account`: تقييد إدخال غرفة موروث واحد بحساب محدد.
  - `groups.<room>.enabled`: مفتاح تبديل لكل غرفة. عند `false`، يتم تجاهل الغرفة كما لو لم تكن موجودة في الخريطة.
  - `groups.<room>.requireMention`: تجاوز لكل غرفة لمتطلب الإشارة على مستوى القناة.
  - `groups.<room>.allowBots`: تجاوز لكل غرفة لإعداد مستوى القناة (`true` أو `"mentions"`).
  - `groups.<room>.botLoopProtection`: تجاوز لكل غرفة لميزانية الحماية من حلقات التكرار بين الروبوتات.
  - `groups.<room>.users`: قائمة سماح للمرسلين لكل غرفة.
  - `groups.<room>.tools`: تجاوزات السماح/الرفض للأدوات لكل غرفة.
  - `groups.<room>.autoReply`: تجاوز تقييد الإشارات لكل غرفة. يؤدي `true` إلى تعطيل متطلبات الإشارة لتلك الغرفة؛ ويجبرها `false` على العودة للعمل.
  - `groups.<room>.skills`: مرشح Skills لكل غرفة.
  - `groups.<room>.systemPrompt`: مقتطف مطالبة النظام لكل غرفة.

### إعدادات موافقات التنفيذ

- `execApprovals.enabled`: تسليم موافقات التنفيذ عبر مطالبات أصلية في Matrix.
- `execApprovals.approvers`: معرفات مستخدمي Matrix المسموح لها بالموافقة. يعود إلى `dm.allowFrom` عند عدم التوفر.
- `execApprovals.target`: `"dm"` (الافتراضي)، أو `"channel"`، أو `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: قوائم سماح اختيارية للوكلاء/الجلسات للتسليم.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) - جميع القنوات المدعومة
- [الإقران](/ar/channels/pairing) - المصادقة عبر الرسائل المباشرة وتدفق الإقران
- [المجموعات](/ar/channels/groups) - سلوك المحادثات الجماعية وتقييد الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) - توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) - نموذج الوصول والتحصين
