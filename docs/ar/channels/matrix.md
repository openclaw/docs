---
read_when:
    - إعداد Matrix في OpenClaw
    - تكوين Matrix E2EE والتحقق
summary: حالة دعم المصفوفة والإعداد وأمثلة التكوين
title: المصفوفة
x-i18n:
    generated_at: "2026-06-27T17:11:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f7c666294daf6a38e4a25ee7f2ad2d0d87dcdabc13291b12e4861f89421a779
    source_path: channels/matrix.md
    workflow: 16
---

Matrix هو Plugin قناة قابل للتنزيل لـ OpenClaw.
يستخدم `matrix-js-sdk` الرسمي ويدعم الرسائل المباشرة، والغرف، والسلاسل، والوسائط، والتفاعلات، والاستطلاعات، والموقع، وE2EE.

## التثبيت

ثبّت Matrix من ClawHub قبل تكوين القناة:

```bash
openclaw plugins install @openclaw/matrix
```

تحاول مواصفات Plugin المجرّدة استخدام ClawHub أولًا، ثم ترجع إلى npm. لفرض مصدر السجل، استخدم `openclaw plugins install clawhub:@openclaw/matrix` أو `openclaw plugins install npm:@openclaw/matrix`.

من نسخة محلية:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

يسجّل `plugins install` الـ Plugin ويفعّله، لذلك لا حاجة إلى خطوة منفصلة مثل `openclaw plugins enable matrix`. لا يزال الـ Plugin لا يفعل شيئًا حتى تكوّن القناة أدناه. راجع [Plugins](/ar/tools/plugin) لسلوك Plugin العام وقواعد التثبيت.

## الإعداد

1. أنشئ حساب Matrix على خادمك المنزلي.
2. كوّن `channels.matrix` باستخدام إما `homeserver` + `accessToken`، أو `homeserver` + `userId` + `password`.
3. أعد تشغيل Gateway.
4. ابدأ رسالة مباشرة مع البوت، أو ادعه إلى غرفة (راجع [الانضمام التلقائي](#auto-join) - الدعوات الجديدة لا تُقبل إلا عندما يسمح بها `autoJoin`).

### الإعداد التفاعلي

```bash
openclaw channels add
openclaw configure --section channels
```

يسأل المعالج عن: عنوان URL للخادم المنزلي، وطريقة المصادقة (رمز وصول أو كلمة مرور)، ومعرّف المستخدم (لمصادقة كلمة المرور فقط)، واسم جهاز اختياري، وما إذا كان يجب تفعيل E2EE، وما إذا كان يجب تكوين وصول الغرفة والانضمام التلقائي.

إذا كانت متغيرات البيئة المطابقة `MATRIX_*` موجودة بالفعل ولا يحتوي الحساب المحدد على مصادقة محفوظة، يعرض المعالج اختصارًا لمتغيرات البيئة. لحل أسماء الغرف قبل حفظ قائمة سماح، شغّل `openclaw channels resolve --channel matrix "Project Room"`. عند تفعيل E2EE، يكتب المعالج التكوين ويشغّل نفس التمهيد مثل [`openclaw matrix encryption setup`](#encryption-and-verification).

### التكوين الأدنى

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

القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`. مع الإعداد الافتراضي، لن يظهر البوت في الغرف الجديدة أو الرسائل المباشرة الناتجة عن دعوات جديدة حتى تنضم يدويًا.

لا يستطيع OpenClaw عند وقت الدعوة معرفة ما إذا كانت الغرفة المدعو إليها رسالة مباشرة أم مجموعة، لذلك تمر كل الدعوات - بما في ذلك الدعوات الشبيهة بالرسائل المباشرة - عبر `autoJoin` أولًا. لا تنطبق `dm.policy` إلا لاحقًا، بعد أن ينضم البوت وتُصنّف الغرفة.

<Warning>
اضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` لتقييد الدعوات التي يقبلها البوت، أو `autoJoin: "always"` لقبول كل دعوة.

لا تقبل `autoJoinAllowlist` إلا الأهداف الثابتة: `!roomId:server` أو `#alias:server` أو `*`. تُرفض أسماء الغرف الصريحة؛ وتُحل إدخالات الأسماء المستعارة مقابل الخادم المنزلي، لا مقابل الحالة التي تدّعيها الغرفة المدعو إليها.
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

من الأفضل ملء قوائم سماح الرسائل المباشرة والغرف بمعرّفات ثابتة:

- الرسائل المباشرة (`dm.allowFrom`، `groupAllowFrom`، `groups.<room>.users`): استخدم `@user:server`. تُتجاهل أسماء العرض افتراضيًا لأنها قابلة للتغيير؛ اضبط `dangerouslyAllowNameMatching: true` فقط عندما تحتاج صراحةً إلى التوافق مع إدخالات أسماء العرض.
- مفاتيح قائمة سماح الغرف (`groups`، و`rooms` القديمة): استخدم `!room:server` أو `#alias:server`. تُتجاهل أسماء الغرف الصريحة افتراضيًا؛ اضبط `dangerouslyAllowNameMatching: true` فقط عندما تحتاج صراحةً إلى التوافق مع البحث باسم غرفة منضم إليها.
- قوائم سماح الدعوات (`autoJoinAllowlist`): استخدم `!room:server` أو `#alias:server` أو `*`. تُرفض أسماء الغرف الصريحة.

### تطبيع معرّف الحساب

يحوّل المعالج الاسم الودّي إلى معرّف حساب مطبّع. على سبيل المثال، يصبح `Ops Bot` هو `ops-bot`. تُهرّب علامات الترقيم في أسماء متغيرات البيئة محددة النطاق حتى لا يتصادم حسابان: `-` → `_X2D_`، لذلك يُطابق `ops-prod` النمط `MATRIX_OPS_X2D_PROD_*`.

### بيانات الاعتماد المخزنة مؤقتًا

يخزّن Matrix بيانات الاعتماد المؤقتة ضمن `~/.openclaw/credentials/matrix/`:

- الحساب الافتراضي: `credentials.json`
- الحسابات المسماة: `credentials-<account>.json`

عند وجود بيانات اعتماد مخزنة مؤقتًا هناك، يتعامل OpenClaw مع Matrix على أنه مكوّن حتى إذا لم يكن رمز الوصول موجودًا في ملف التكوين - وهذا يغطي الإعداد، و`openclaw doctor`، وفحوص حالة القناة.

### متغيرات البيئة

تُستخدم عندما لا يكون مفتاح التكوين المكافئ مضبوطًا. يستخدم الحساب الافتراضي أسماء غير مسبوقة؛ وتستخدم الحسابات المسماة معرّف الحساب مُدرجًا قبل اللاحقة.

| الحساب الافتراضي       | الحساب المسمى (`<ID>` هو معرّف الحساب المطبّع) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

للحساب `ops`، تصبح الأسماء `MATRIX_OPS_HOMESERVER` و`MATRIX_OPS_ACCESS_TOKEN` وهكذا. تُقرأ متغيرات بيئة مفتاح الاسترداد بواسطة تدفقات CLI الواعية بالاسترداد (`verify backup restore`، و`verify device`، و`verify bootstrap`) عندما تمرر المفتاح عبر `--recovery-key-stdin`.

لا يمكن ضبط `MATRIX_HOMESERVER` من ملف `.env` في مساحة العمل؛ راجع [ملفات `.env` في مساحة العمل](/ar/gateway/security).

## مثال على التكوين

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

بث ردود Matrix اختياري. يتحكم `streaming` في كيفية تسليم OpenClaw لرد المساعد أثناء إنشائه؛ ويتحكم `blockStreaming` فيما إذا كان كل كتلة مكتملة تُحفظ كرسالة Matrix مستقلة.

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
| `"off"` (افتراضي) | ينتظر الرد الكامل ويرسله مرة واحدة. `true` ↔ `"partial"`، و`false` ↔ `"off"`.                                                                                        |
| `"partial"`       | يحرر رسالة نصية عادية واحدة في مكانها أثناء كتابة النموذج للكتلة الحالية. قد تُرسل عملاء Matrix القياسية إشعارًا عند أول معاينة، لا عند التحرير النهائي.              |
| `"quiet"`         | مثل `"partial"` لكن الرسالة إشعار غير منبّه. لا يتلقى المستلمون إشعارًا إلا عندما تطابق قاعدة دفع لكل مستخدم التحرير النهائي (انظر أدناه). |

`blockStreaming` مستقل عن `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (افتراضي)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | مسودة حية للكتلة الحالية، وتُحفظ الكتل المكتملة كرسائل | مسودة حية للكتلة الحالية، وتُنهى في مكانها |
| `"off"`                 | رسالة Matrix منبّهة واحدة لكل كتلة مكتملة                     | رسالة Matrix منبّهة واحدة للرد الكامل      |

ملاحظات:

- إذا تجاوزت المعاينة حد حجم الحدث الواحد في Matrix، يوقف OpenClaw بث المعاينة ويرجع إلى التسليم النهائي فقط.
- تُرسل ردود الوسائط دائمًا المرفقات بالطريقة العادية. إذا تعذر إعادة استخدام معاينة قديمة بأمان، يحذفها OpenClaw قبل إرسال رد الوسائط النهائي.
- تكون تحديثات معاينة تقدم الأدوات مفعّلة افتراضيًا عندما يكون بث معاينة Matrix نشطًا. اضبط `streaming.preview.toolProgress: false` للاحتفاظ بتحريرات المعاينة لنص الإجابة مع إبقاء تقدم الأدوات على مسار التسليم العادي.
- تكلف تحريرات المعاينة استدعاءات إضافية لواجهة Matrix API. اترك `streaming: "off"` إذا أردت أكثر ملف تعريف محافظ لحدود المعدل.

## الرسائل الصوتية

تُنسخ الملاحظات الصوتية الواردة في Matrix قبل بوابة ذكر الغرفة. يتيح هذا لملاحظة صوتية تقول اسم البوت أن تشغّل الوكيل في غرفة `requireMention: true`، ويمنح الوكيل النص المنسوخ بدلًا من مجرد عنصر نائب لمرفق صوتي.

يستخدم Matrix مزود وسائط الصوت المشترك المكوّن ضمن `tools.media.audio`، مثل OpenAI `gpt-4o-mini-transcribe`. راجع [نظرة عامة على أدوات الوسائط](/ar/tools/media-overview) لإعداد المزود والحدود.

تفاصيل السلوك:

- أحداث `m.audio` وأحداث `m.file` ذات نوع MIME من النمط `audio/*` مؤهلة.
- في الغرف المشفرة، يفك OpenClaw تشفير المرفق عبر مسار وسائط Matrix الحالي قبل النسخ.
- يُوسم النص المنسوخ في مطالبة الوكيل على أنه مولّد آليًا وغير موثوق.
- يُوسم المرفق على أنه منسوخ بالفعل حتى لا تنسخ أدوات الوسائط اللاحقة نفس الملاحظة الصوتية مرة أخرى.
- اضبط `tools.media.audio.enabled: false` لتعطيل نسخ الصوت عالميًا.

## بيانات الموافقة الوصفية

مطالبات الموافقة الأصلية في Matrix هي أحداث `m.room.message` عادية مع محتوى حدث مخصص خاص بـ OpenClaw ضمن `com.openclaw.approval`. يسمح Matrix بمفاتيح محتوى أحداث مخصصة، لذلك تظل العملاء القياسية تعرض نص الجسم بينما يمكن للعملاء الواعية بـ OpenClaw قراءة معرّف الموافقة المنظم، والنوع، والحالة، والقرارات المتاحة، وتفاصيل التنفيذ/Plugin.

عندما تكون مطالبة الموافقة طويلة جدًا لحدث Matrix واحد، يقسم OpenClaw النص المرئي إلى أجزاء ويرفق `com.openclaw.approval` بالجزء الأول فقط. ترتبط تفاعلات قرارات السماح/الرفض بذلك الحدث الأول، لذلك تحتفظ المطالبات الطويلة بنفس هدف الموافقة مثل مطالبات الحدث الواحد.

### قواعد الدفع ذاتية الاستضافة للمعاينات النهائية الهادئة

لا يرسل `streaming: "quiet"` إشعارًا إلى المستلمين إلا بعد إنهاء كتلة أو دورة - يجب أن تطابق قاعدة دفع لكل مستخدم علامة المعاينة النهائية. راجع [قواعد دفع Matrix للمعاينات الهادئة](/ar/channels/matrix-push-rules) للوصفة الكاملة (رمز المستلم، وفحص الدافع، وتثبيت القاعدة، وملاحظات كل خادم منزلي).

## غرف البوتات المتبادلة

افتراضيًا، تُتجاهل رسائل Matrix الواردة من حسابات Matrix أخرى مكوّنة في OpenClaw.

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

- يقبل `allowBots: true` الرسائل من حسابات بوت Matrix الأخرى المهيأة في الغرف والرسائل المباشرة المسموح بها.
- يقبل `allowBots: "mentions"` تلك الرسائل فقط عندما تذكر هذا البوت بشكل مرئي في الغرف. تظل الرسائل المباشرة مسموحة.
- يتجاوز `groups.<room>.allowBots` إعداد مستوى الحساب لغرفة واحدة.
- تستخدم رسائل البوتات المهيأة المقبولة [حماية حلقة البوت](/ar/channels/bot-loop-protection) المشتركة. هيئ `channels.defaults.botLoopProtection`، ثم تجاوزه باستخدام `channels.matrix.botLoopProtection` أو `channels.matrix.groups.<room>.botLoopProtection` عندما تحتاج غرفة واحدة إلى ميزانية مختلفة.
- لا يزال OpenClaw يتجاهل الرسائل من معرف مستخدم Matrix نفسه لتجنب حلقات الرد على الذات.
- لا يتيح Matrix علامة بوت أصلية هنا؛ يتعامل OpenClaw مع "مؤلف بواسطة بوت" على أنه "مرسل من حساب Matrix مهيأ آخر على Gateway OpenClaw هذا".

استخدم قوائم سماح صارمة للغرف ومتطلبات ذكر عند تمكين حركة المرور بين البوتات في الغرف المشتركة.

## التشفير والتحقق

في الغرف المشفرة (E2EE)، تستخدم أحداث الصور الصادرة `thumbnail_file` بحيث تكون معاينات الصور مشفرة إلى جانب المرفق الكامل. لا تزال الغرف غير المشفرة تستخدم `thumbnail_url` العادي. لا يلزم أي تكوين - يكتشف Plugin حالة E2EE تلقائيا.

تقبل كل أوامر `openclaw matrix` الخيار `--verbose` (تشخيصات كاملة)، و`--json` (إخراج قابل للقراءة آليا)، و`--account <id>` (إعدادات متعددة الحسابات). يكون الإخراج موجزا افتراضيا مع تسجيل SDK داخلي هادئ. تعرض الأمثلة أدناه الصيغة القياسية؛ أضف العلامات حسب الحاجة.

### تمكين التشفير

```bash
openclaw matrix encryption setup
```

يمهد تخزين الأسرار والتوقيع المتبادل، وينشئ نسخة احتياطية لمفاتيح الغرف إذا لزم الأمر، ثم يطبع الحالة والخطوات التالية. علامات مفيدة:

- `--recovery-key <key>` تطبيق مفتاح استرداد قبل التمهيد (يفضل نموذج stdin الموثق أدناه)
- `--force-reset-cross-signing` تجاهل هوية التوقيع المتبادل الحالية وإنشاء هوية جديدة (استخدمه عن قصد فقط)

لحساب جديد، مكن E2EE وقت الإنشاء:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` اسم بديل لـ `--enable-e2ee`.

مكافئ التكوين اليدوي:

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

يبلغ `verify status` عن ثلاث إشارات ثقة مستقلة (يعرض `--verbose` جميعها):

- `Locally trusted`: موثوق به من هذا العميل فقط
- `Cross-signing verified`: يبلغ SDK عن التحقق عبر التوقيع المتبادل
- `Signed by owner`: موقع بمفتاح التوقيع الذاتي الخاص بك (للتشخيص فقط)

تصبح `Verified by owner` هي `yes` فقط عندما تكون `Cross-signing verified` هي `yes`. الثقة المحلية أو توقيع المالك وحده غير كافيين.

يعيد `--allow-degraded-local-state` تشخيصات بأفضل جهد دون إعداد حساب Matrix أولا؛ مفيد للفحوصات غير المتصلة أو المهيأة جزئيا.

### تحقق من هذا الجهاز باستخدام مفتاح استرداد

مفتاح الاسترداد حساس - مرره عبر stdin بدلا من تمريره في سطر الأوامر. اضبط `MATRIX_RECOVERY_KEY` (أو `MATRIX_<ID>_RECOVERY_KEY` لحساب مسمى):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

يبلغ الأمر عن ثلاث حالات:

- `Recovery key accepted`: قبل Matrix المفتاح لتخزين الأسرار أو ثقة الجهاز.
- `Backup usable`: يمكن تحميل نسخة مفاتيح الغرف الاحتياطية باستخدام مادة الاسترداد الموثوقة.
- `Device verified by owner`: يملك هذا الجهاز ثقة هوية التوقيع المتبادل الكاملة في Matrix.

ينهي بقيمة غير صفرية عندما تكون ثقة الهوية الكاملة غير مكتملة، حتى إذا فتح مفتاح الاسترداد مادة النسخ الاحتياطي. في تلك الحالة، أكمل التحقق الذاتي من عميل Matrix آخر:

```bash
openclaw matrix verify self
```

ينتظر `verify self` ظهور `Cross-signing verified: yes` قبل أن يخرج بنجاح. استخدم `--timeout-ms <ms>` لضبط الانتظار.

يقبل أيضا نموذج المفتاح الحرفي `openclaw matrix verify device "<recovery-key>"`، لكن المفتاح سينتهي في سجل الصدفة لديك.

### تمهيد التوقيع المتبادل أو إصلاحه

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` هو أمر الإصلاح والإعداد للحسابات المشفرة. بالترتيب، يقوم بما يلي:

- يمهد تخزين الأسرار، مع إعادة استخدام مفتاح استرداد موجود عندما يكون ذلك ممكنا
- يمهد التوقيع المتبادل ويرفع المفاتيح العامة المفقودة
- يضع علامة على الجهاز الحالي ويوقعه توقيعا متبادلا
- ينشئ نسخة احتياطية لمفاتيح الغرف على جانب الخادم إذا لم تكن موجودة بالفعل

إذا كان خادم المنزل يتطلب UIA لرفع مفاتيح التوقيع المتبادل، يجرب OpenClaw أولا بلا مصادقة، ثم `m.login.dummy`، ثم `m.login.password` (يتطلب `channels.matrix.password`).

علامات مفيدة:

- `--recovery-key-stdin` (اقرنه مع `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) أو `--recovery-key <key>`
- `--force-reset-cross-signing` لتجاهل هوية التوقيع المتبادل الحالية (عن قصد فقط؛ يتطلب تخزين مفتاح الاسترداد النشط أو تقديمه باستخدام `--recovery-key-stdin`)

### نسخة مفاتيح الغرف الاحتياطية

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

يعرض `backup status` ما إذا كانت نسخة احتياطية على جانب الخادم موجودة وما إذا كان هذا الجهاز يستطيع فك تشفيرها. يستورد `backup restore` مفاتيح الغرف المنسوخة احتياطيا إلى مخزن التشفير المحلي؛ إذا كان مفتاح الاسترداد موجودا بالفعل على القرص، يمكنك حذف `--recovery-key-stdin`.

لاستبدال نسخة احتياطية معطلة بخط أساس جديد (يقبل فقدان السجل القديم غير القابل للاسترداد؛ ويمكنه أيضا إعادة إنشاء تخزين الأسرار إذا كان سر النسخة الاحتياطية الحالي غير قابل للتحميل):

```bash
openclaw matrix verify backup reset --yes
```

أضف `--rotate-recovery-key` فقط عندما تريد عمدا أن يتوقف مفتاح الاسترداد السابق عن فتح خط أساس النسخة الاحتياطية الجديد.

### سرد عمليات التحقق وطلبها والرد عليها

```bash
openclaw matrix verify list
```

يسرد طلبات التحقق المعلقة للحساب المحدد.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

يرسل طلب تحقق من حساب OpenClaw هذا. يطلب `--own-user` التحقق الذاتي (تقبل المطالبة في عميل Matrix آخر للمستخدم نفسه)؛ تستهدف `--user-id`/`--device-id`/`--room-id` شخصا آخر. لا يمكن دمج `--own-user` مع علامات الاستهداف الأخرى.

للتعامل مع دورة الحياة على مستوى أدنى - عادة أثناء متابعة الطلبات الواردة من عميل آخر - تعمل هذه الأوامر على طلب محدد `<id>` (يطبع بواسطة `verify list` و`verify request`):

| الأمر                                      | الغرض                                                               |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | قبول طلب وارد                                                       |
| `openclaw matrix verify start <id>`        | بدء تدفق SAS                                                        |
| `openclaw matrix verify sas <id>`          | طباعة رموز SAS التعبيرية أو الأرقام العشرية                         |
| `openclaw matrix verify confirm-sas <id>`  | تأكيد أن SAS يطابق ما يعرضه العميل الآخر                            |
| `openclaw matrix verify mismatch-sas <id>` | رفض SAS عندما لا تتطابق الرموز التعبيرية أو الأرقام العشرية          |
| `openclaw matrix verify cancel <id>`       | إلغاء؛ يأخذ اختياريا `--reason <text>` و`--code <matrix-code>`       |

تقبل كل من `accept` و`start` و`sas` و`confirm-sas` و`mismatch-sas` و`cancel` الخيارين `--user-id` و`--room-id` كتلميحات متابعة عبر الرسائل المباشرة عندما يكون التحقق مثبتا بغرفة رسائل مباشرة محددة.

### ملاحظات تعدد الحسابات

دون `--account <id>`، تستخدم أوامر CLI الخاصة بـ Matrix الحساب الافتراضي الضمني. إذا كانت لديك عدة حسابات مسماة ولم تضبط `channels.matrix.defaultAccount`، فسترفض التخمين وتطلب منك الاختيار. عندما يكون E2EE معطلا أو غير متاح لحساب مسمى، تشير الأخطاء إلى مفتاح تكوين ذلك الحساب، على سبيل المثال `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    مع `encryption: true`، تكون القيمة الافتراضية لـ `startupVerification` هي `"if-unverified"`. عند بدء التشغيل، يطلب جهاز غير متحقق منه التحقق الذاتي في عميل Matrix آخر، مع تخطي التكرارات وتطبيق فترة تهدئة (24 ساعة افتراضيا). اضبطها باستخدام `startupVerificationCooldownHours` أو عطلها باستخدام `startupVerification: "off"`.

    يشغل بدء التشغيل أيضا تمريرة تمهيد تشفير محافظة تعيد استخدام تخزين الأسرار الحالي وهوية التوقيع المتبادل. إذا كانت حالة التمهيد معطلة، يحاول OpenClaw إصلاحا محروسا حتى بدون `channels.matrix.password`؛ إذا كان خادم المنزل يتطلب UIA بكلمة مرور، يسجل بدء التشغيل تحذيرا ويبقى غير قاتل. يتم الحفاظ على الأجهزة الموقعة بالفعل من المالك.

    راجع [ترحيل Matrix](/ar/channels/matrix-migration) لتدفق الترقية الكامل.

  </Accordion>

  <Accordion title="Verification notices">
    ينشر Matrix إشعارات دورة حياة التحقق في غرفة التحقق الصارمة عبر الرسائل المباشرة كرسائل `m.notice`: الطلب، والجاهزية (مع إرشاد "Verify by emoji")، والبدء/الإكمال، وتفاصيل SAS (رموز تعبيرية/عشرية) عند توفرها.

    يتم تتبع الطلبات الواردة من عميل Matrix آخر وقبولها تلقائيا. للتحقق الذاتي، يبدأ OpenClaw تدفق SAS تلقائيا ويؤكد جانبه بمجرد توفر التحقق بالرموز التعبيرية - لا تزال بحاجة إلى المقارنة وتأكيد "They match" في عميل Matrix لديك.

    لا يتم تمرير إشعارات نظام التحقق إلى مسار محادثة الوكيل.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    إذا قال `verify status` إن الجهاز الحالي لم يعد مدرجا على خادم المنزل، فأنشئ جهاز Matrix جديدا لـ OpenClaw. لتسجيل الدخول بكلمة مرور:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    للمصادقة بالرمز، أنشئ رمز وصول جديدا في عميل Matrix لديك أو واجهة الإدارة، ثم حدث OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    استبدل `assistant` بمعرف الحساب من الأمر الفاشل، أو احذف `--account` للحساب الافتراضي.

  </Accordion>

  <Accordion title="Device hygiene">
    قد تتراكم الأجهزة القديمة المدارة بواسطة OpenClaw. اسردها ونظفها:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    يستخدم Matrix E2EE مسار تشفير Rust الرسمي في `matrix-js-sdk` مع `fake-indexeddb` كبديل IndexedDB. تستمر حالة التشفير في `crypto-idb-snapshot.json` (أذونات ملف مقيدة).

    تعيش حالة وقت التشغيل المشفرة تحت `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` وتشمل مخزن المزامنة، ومخزن التشفير، ومفتاح الاسترداد، ولقطة IDB، وروابط الخيوط، وحالة تحقق بدء التشغيل. عندما يتغير الرمز وتبقى هوية الحساب كما هي، يعيد OpenClaw استخدام أفضل جذر موجود حتى تظل الحالة السابقة مرئية.

  </Accordion>
</AccordionGroup>

## إدارة الملف الشخصي

حدث الملف الشخصي الذاتي في Matrix للحساب المحدد:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

يمكنك تمرير كلا الخيارين في استدعاء واحد. يقبل Matrix عناوين URL للصور الرمزية بصيغة `mxc://` مباشرة؛ وعند تمرير `http://` أو `https://`، يرفع OpenClaw الملف أولًا ويخزن عنوان URL المحلول بصيغة `mxc://` في `channels.matrix.avatarUrl` (أو التجاوز الخاص بكل حساب).

## السلاسل

يدعم Matrix سلاسل Matrix الأصلية لكل من الردود التلقائية وإرسالات أداة الرسائل. يتحكم خياران مستقلان في السلوك:

### توجيه الجلسات (`sessionScope`)

يحدد `dm.sessionScope` كيفية ربط غرف رسائل Matrix المباشرة بجلسات OpenClaw:

- `"per-user"` (الافتراضي): تشترك كل غرف الرسائل المباشرة التي لها النظير الموجّه نفسه في جلسة واحدة.
- `"per-room"`: تحصل كل غرفة رسائل مباشرة في Matrix على مفتاح جلسة خاص بها، حتى عندما يكون النظير هو نفسه.

تتقدم ربطات المحادثات الصريحة دائمًا على `sessionScope`، لذلك تحتفظ الغرف والسلاسل المربوطة بجلسة الهدف المختارة لها.

### تسلسل الردود (`threadReplies`)

يحدد `threadReplies` مكان نشر البوت لرده:

- `"off"`: تكون الردود على المستوى الأعلى. تبقى الرسائل الواردة ضمن سلاسل على جلسة الأصل.
- `"inbound"`: الرد داخل سلسلة فقط عندما تكون الرسالة الواردة موجودة أصلًا في تلك السلسلة.
- `"always"`: الرد داخل سلسلة جذرها الرسالة التي أدت إلى التشغيل؛ وتُوجّه تلك المحادثة عبر جلسة مطابقة ذات نطاق سلسلة من أول تشغيل فصاعدًا.

يتجاوز `dm.threadReplies` هذا للرسائل المباشرة فقط - على سبيل المثال، إبقاء سلاسل الغرف معزولة مع إبقاء الرسائل المباشرة مسطحة.

### وراثة السلاسل وأوامر الشرطة المائلة

- تتضمن الرسائل الواردة ضمن سلاسل رسالة جذر السلسلة كسياق إضافي للوكيل.
- ترث إرسالات أداة الرسائل سلسلة Matrix الحالية تلقائيًا عند استهداف الغرفة نفسها (أو هدف مستخدم الرسائل المباشرة نفسه)، ما لم يُقدَّم `threadId` صريح.
- لا يُفعَّل إعادة استخدام هدف مستخدم الرسائل المباشرة إلا عندما تثبت بيانات الجلسة الوصفية أنه نظير الرسائل المباشرة نفسه على حساب Matrix نفسه؛ وإلا يعود OpenClaw إلى التوجيه العادي ذي نطاق المستخدم.
- تعمل `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` و`/acp spawn` المرتبطة بسلسلة كلها في غرف Matrix والرسائل المباشرة.
- ينشئ `/focus` على المستوى الأعلى سلسلة Matrix جديدة ويربطها بجلسة الهدف عندما يكون `threadBindings.spawnSessions` مفعّلًا.
- يؤدي تشغيل `/focus` أو `/acp spawn --thread here` داخل سلسلة Matrix موجودة إلى ربط تلك السلسلة في مكانها.

عندما يكتشف OpenClaw غرفة رسائل مباشرة في Matrix تتصادم مع غرفة رسائل مباشرة أخرى على الجلسة المشتركة نفسها، ينشر `m.notice` لمرة واحدة في تلك الغرفة يشير إلى مخرج `/focus` ويقترح تغيير `dm.sessionScope`. لا يظهر الإشعار إلا عند تفعيل ربطات السلاسل.

## ربطات محادثات ACP

يمكن تحويل غرف Matrix والرسائل المباشرة وسلاسل Matrix الموجودة إلى مساحات عمل ACP دائمة دون تغيير سطح الدردشة.

تدفق سريع للمشغل:

- شغّل `/acp spawn codex --bind here` داخل رسالة Matrix المباشرة أو الغرفة أو السلسلة الموجودة التي تريد متابعة استخدامها.
- في رسالة مباشرة أو غرفة Matrix على المستوى الأعلى، تبقى الرسالة المباشرة/الغرفة الحالية هي سطح الدردشة وتُوجّه الرسائل المستقبلية إلى جلسة ACP المنشأة.
- داخل سلسلة Matrix موجودة، يربط `--bind here` تلك السلسلة الحالية في مكانها.
- يعيد `/new` و`/reset` ضبط جلسة ACP المربوطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الربط.

ملاحظات:

- لا ينشئ `--bind here` سلسلة Matrix فرعية.
- يتحكم `threadBindings.spawnSessions` في `/acp spawn --thread auto|here`، حيث يحتاج OpenClaw إلى إنشاء سلسلة Matrix فرعية أو ربطها.

### إعداد ربط السلاسل

يرث Matrix الافتراضات العامة من `session.threadBindings`، ويدعم أيضًا تجاوزات لكل قناة:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

تكون عمليات إنشاء الجلسات المرتبطة بسلاسل Matrix مفعّلة افتراضيًا:

- اضبط `threadBindings.spawnSessions: false` لمنع `/focus` على المستوى الأعلى و`/acp spawn --thread auto|here` من إنشاء/ربط سلاسل Matrix.
- اضبط `threadBindings.defaultSpawnContext: "isolated"` عندما لا ينبغي لعمليات إنشاء سلاسل الوكلاء الفرعيين الأصلية أن تتفرع من نص جلسة الأصل.

## التفاعلات

يدعم Matrix التفاعلات الصادرة، وإشعارات التفاعلات الواردة، وتفاعلات الإقرار.

تخضع أدوات التفاعل الصادر إلى `channels.matrix.actions.reactions`:

- يضيف `react` تفاعلًا إلى حدث Matrix.
- يسرد `reactions` ملخص التفاعلات الحالي لحدث Matrix.
- يزيل `emoji=""` تفاعلات البوت نفسه على ذلك الحدث.
- يزيل `remove: true` تفاعل الرمز التعبيري المحدد فقط من البوت.

**ترتيب الحل** (تفوز أول قيمة معرّفة):

| الإعداد                 | الترتيب                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | لكل حساب → القناة → `messages.ackReaction` → تراجع إلى الرمز التعبيري لهوية الوكيل   |
| `ackReactionScope`      | لكل حساب → القناة → `messages.ackReactionScope` → الافتراضي `"group-mentions"` |
| `reactionNotifications` | لكل حساب → القناة → الافتراضي `"own"`                                          |

يمرر `reactionNotifications: "own"` أحداث `m.reaction` المضافة عندما تستهدف رسائل Matrix التي كتبها البوت؛ وتعطّل `"off"` أحداث نظام التفاعل. لا تُنشأ أحداث نظام من عمليات إزالة التفاعل لأن Matrix يعرضها كتنقيحات، وليس كإزالات مستقلة من نوع `m.reaction`.

## سياق السجل

- يتحكم `channels.matrix.historyLimit` في عدد رسائل الغرفة الحديثة المضمنة كـ `InboundHistory` عندما تؤدي رسالة غرفة Matrix إلى تشغيل الوكيل. يعود إلى `messages.groupChat.historyLimit`؛ وإذا لم يُضبط كلاهما، فالافتراضي الفعلي هو `0`. اضبط `0` للتعطيل.
- سجل غرفة Matrix خاص بالغرفة فقط. تستمر الرسائل المباشرة في استخدام سجل الجلسة العادي.
- سجل غرفة Matrix معلّق فقط: يخزن OpenClaw مؤقتًا رسائل الغرفة التي لم تؤدِ إلى رد بعد، ثم يأخذ لقطة لتلك النافذة عندما تصل إشارة ذكر أو تشغيل أخرى.
- لا تُضمّن رسالة التشغيل الحالية في `InboundHistory`؛ بل تبقى في متن الوارد الرئيسي لتلك الدورة.
- تعيد محاولات حدث Matrix نفسه استخدام لقطة السجل الأصلية بدلًا من الانزياح للأمام إلى رسائل غرفة أحدث.

## رؤية السياق

يدعم Matrix عنصر التحكم المشترك `contextVisibility` لسياق الغرفة التكميلي مثل نص الرد المجلب، وجذور السلاسل، والسجل المعلّق.

- `contextVisibility: "all"` هو الافتراضي. يُحتفظ بالسياق التكميلي كما استُلم.
- يرشح `contextVisibility: "allowlist"` السياق التكميلي إلى المرسلين المسموح لهم بفحوصات قائمة السماح النشطة للغرفة/المستخدم.
- يتصرف `contextVisibility: "allowlist_quote"` مثل `allowlist`، لكنه يبقي ردًا مقتبسًا صريحًا واحدًا.

يؤثر هذا الإعداد في رؤية السياق التكميلي، لا في ما إذا كانت الرسالة الواردة نفسها يمكنها تشغيل رد.
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

راجع [المجموعات](/ar/channels/groups) للاطلاع على سلوك حراسة الذكر وقائمة السماح.

مثال الاقتران لرسائل Matrix المباشرة:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

إذا استمر مستخدم Matrix غير معتمد في مراسلتك قبل الموافقة، يعيد OpenClaw استخدام رمز الاقتران المعلّق نفسه وقد يرسل رد تذكير بعد فترة تهدئة قصيرة بدلًا من سك رمز جديد.

راجع [الاقتران](/ar/channels/pairing) لتدفق اقتران الرسائل المباشرة المشترك وتخطيط التخزين.

## إصلاح الغرفة المباشرة

إذا انحرفت حالة الرسائل المباشرة عن التزامن، فقد ينتهي الأمر بـ OpenClaw إلى تعيينات `m.direct` قديمة تشير إلى غرف فردية قديمة بدلًا من الرسالة المباشرة الحية. افحص التعيين الحالي لنظير:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

أصلحه:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

يقبل كلا الأمرين `--account <id>` لإعدادات الحسابات المتعددة. تدفق الإصلاح:

- يفضل رسالة مباشرة صارمة 1:1 معيّنة أصلًا في `m.direct`
- يعود إلى أي رسالة مباشرة صارمة 1:1 منضمة حاليًا مع ذلك المستخدم
- ينشئ غرفة مباشرة جديدة ويعيد كتابة `m.direct` إذا لم توجد رسالة مباشرة سليمة

لا يحذف الغرف القديمة تلقائيًا. يختار الرسالة المباشرة السليمة ويحدّث التعيين بحيث تستهدف إرسالات Matrix المستقبلية، وإشعارات التحقق، وتدفقات الرسائل المباشرة الأخرى الغرفة الصحيحة.

## موافقات exec

يمكن أن يعمل Matrix كعميل موافقة أصلي. اضبطه ضمن `channels.matrix.execApprovals` (أو `channels.matrix.accounts.<account>.execApprovals` لتجاوز خاص بكل حساب):

- `enabled`: تسليم الموافقات عبر مطالبات Matrix الأصلية. عند عدم الضبط أو عند `"auto"`، يفعّل Matrix نفسه تلقائيًا بمجرد إمكانية حلّ موافق واحد على الأقل. اضبط `false` للتعطيل صراحة.
- `approvers`: معرّفات مستخدمي Matrix (`@owner:example.org`) المسموح لهم بالموافقة على طلبات exec. اختياري - يعود إلى `channels.matrix.dm.allowFrom`.
- `target`: مكان إرسال المطالبات. ترسل `"dm"` (الافتراضي) إلى رسائل الموافقين المباشرة؛ وترسل `"channel"` إلى غرفة Matrix أو الرسالة المباشرة الأصلية؛ وترسل `"both"` إلى كليهما.
- `agentFilter` / `sessionFilter`: قوائم سماح اختيارية للوكلاء/الجلسات التي تشغّل تسليم Matrix.

يختلف التفويض قليلًا بين أنواع الموافقات:

- تستخدم **موافقات exec** `execApprovals.approvers`، مع الرجوع إلى `dm.allowFrom`.
- تفوض **موافقات Plugin** عبر `dm.allowFrom` فقط.

يشترك كلا النوعين في اختصارات تفاعلات Matrix وتحديثات الرسائل. يرى الموافقون اختصارات التفاعل على رسالة الموافقة الأساسية:

- `✅` السماح مرة واحدة
- `❌` الرفض
- `♾️` السماح دائمًا (عندما تسمح سياسة exec الفعالة بذلك)

أوامر الشرطة المائلة الاحتياطية: `/approve <id> allow-once`، و`/approve <id> allow-always`، و`/approve <id> deny`.

لا يمكن الموافقة أو الرفض إلا للموافقين الذين تم حلهم. يتضمن تسليم القناة لموافقات exec نص الأمر - لا تفعّل `channel` أو `both` إلا في غرف موثوقة.

ذو صلة: [موافقات exec](/ar/tools/exec-approvals).

## أوامر الشرطة المائلة

تعمل أوامر الشرطة المائلة (`/new` و`/reset` و`/model` و`/focus` و`/unfocus` و`/agents` و`/session` و`/acp` و`/approve` وما إلى ذلك) مباشرة في الرسائل المباشرة. في الغرف، يتعرف OpenClaw أيضًا على الأوامر التي تسبقها إشارة ذكر Matrix الخاصة بالبوت نفسه، لذا يشغّل `@bot:server /new` مسار الأمر دون تعبير نمطي مخصص للذكر. يحافظ هذا على استجابة البوت لمنشورات الغرف بنمط `@mention /command` التي يصدرها Element والعملاء المشابهون عندما يكمل المستخدم اسم البوت بالضغط على Tab قبل كتابة الأمر.

لا تزال قواعد التفويض منطبقة: يجب أن يستوفي مرسلو الأوامر سياسات قائمة السماح/المالك للرسائل المباشرة أو الغرف نفسها مثل الرسائل العادية.

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

- تعمل قيم `channels.matrix` على المستوى الأعلى كافتراضات للحسابات المسماة ما لم يتجاوزها حساب.
- احصر إدخال غرفة موروثًا في حساب محدد باستخدام `groups.<room>.account`. تُشارك الإدخالات التي لا تحتوي على `account` عبر الحسابات؛ ولا يزال `account: "default"` يعمل عندما يُضبط الحساب الافتراضي على المستوى الأعلى.

**اختيار الحساب الافتراضي:**

- اضبط `defaultAccount` لاختيار الحساب المسمى الذي تفضله التوجيهات الضمنية والفحص وأوامر CLI.
- إذا كانت لديك حسابات متعددة وكان أحدها مسمى حرفيا `default`، فسيستخدمه OpenClaw ضمنيا حتى عندما لا يكون `defaultAccount` مضبوطا.
- إذا كانت لديك حسابات مسماة متعددة ولم يتم اختيار حساب افتراضي، فسترفض أوامر CLI التخمين - اضبط `defaultAccount` أو مرر `--account <id>`.
- لا تتم معاملة الكتلة العليا `channels.matrix.*` كحساب `default` الضمني إلا عندما تكون مصادقتها مكتملة (`homeserver` + `accessToken`، أو `homeserver` + `userId` + `password`). تظل الحسابات المسماة قابلة للاكتشاف من `homeserver` + `userId` بمجرد أن تغطي بيانات الاعتماد المخزنة مؤقتا المصادقة.

**الترقية:**

- عندما يرقي OpenClaw إعداد حساب واحد إلى إعداد متعدد الحسابات أثناء الإصلاح أو الإعداد، فإنه يحافظ على الحساب المسمى الموجود إذا كان موجودا أو كان `defaultAccount` يشير بالفعل إلى أحد الحسابات. تنتقل مفاتيح مصادقة/تمهيد Matrix فقط إلى الحساب المرقى؛ وتبقى مفاتيح سياسة التسليم المشتركة في المستوى الأعلى.

راجع [مرجع الإعدادات](/ar/gateway/config-channels#multi-account-all-channels) لنمط تعدد الحسابات المشترك.

## خوادم homeserver الخاصة/LAN

افتراضيا، يحظر OpenClaw خوادم homeserver الخاصة/الداخلية لـ Matrix للحماية من SSRF ما لم
توافق صراحة لكل حساب.

إذا كان خادم homeserver يعمل على localhost أو عنوان IP على LAN/Tailscale أو اسم مضيف داخلي، ففعل
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

تسمح هذه الموافقة الصريحة بالأهداف الخاصة/الداخلية الموثوقة فقط. تظل خوادم homeserver العامة غير المشفرة مثل
`http://matrix.example.org:8008` محظورة. فضل `https://` كلما أمكن.

## تمرير زيارات Matrix عبر وكيل

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

يمكن للحسابات المسماة تجاوز الإعداد الافتراضي الأعلى باستخدام `channels.matrix.accounts.<id>.proxy`.
يستخدم OpenClaw إعداد الوكيل نفسه لزيارات Matrix وقت التشغيل وعمليات فحص حالة الحساب.

## حل الهدف

يقبل Matrix صيغ الأهداف هذه في أي مكان يطلب فيه OpenClaw هدف غرفة أو مستخدم:

- المستخدمون: `@user:server`، أو `user:@user:server`، أو `matrix:user:@user:server`
- الغرف: `!room:server`، أو `room:!room:server`، أو `matrix:room:!room:server`
- الأسماء المستعارة: `#alias:server`، أو `channel:#alias:server`، أو `matrix:channel:#alias:server`

معرفات غرف Matrix حساسة لحالة الأحرف. استخدم حالة الأحرف الدقيقة لمعرف الغرفة من Matrix
عند إعداد أهداف التسليم الصريحة أو مهام Cron أو الارتباطات أو قوائم السماح.
يحافظ OpenClaw على مفاتيح الجلسات الداخلية بصيغة معيارية للتخزين، لذلك لا تعد هذه المفاتيح المكتوبة بأحرف صغيرة
مصدرا موثوقا لمعرفات تسليم Matrix.

يستخدم بحث الدليل الحي حساب Matrix المسجل دخوله:

- تستعلم عمليات بحث المستخدمين دليل مستخدمي Matrix على خادم homeserver ذلك.
- تقبل عمليات بحث الغرف معرفات الغرف الصريحة والأسماء المستعارة مباشرة. يكون بحث اسم الغرفة المنضم إليها بأفضل جهد ولا ينطبق إلا على قوائم سماح الغرف وقت التشغيل عند ضبط `dangerouslyAllowNameMatching: true`.
- إذا تعذر حل اسم غرفة إلى معرف أو اسم مستعار، فسيتم تجاهله عند حل قائمة السماح وقت التشغيل.

## مرجع الإعدادات

تقبل حقول المستخدمين بنمط قائمة السماح (`groupAllowFrom`، و`dm.allowFrom`، و`groups.<room>.users`) معرفات مستخدمي Matrix كاملة (الأكثر أمانا). يتم تجاهل إدخالات المستخدمين غير المعرفية افتراضيا. إذا ضبطت `dangerouslyAllowNameMatching: true`، فسيتم حل مطابقات أسماء العرض الدقيقة في دليل Matrix عند بدء التشغيل وكلما تغيرت قائمة السماح أثناء تشغيل المراقب؛ ويتم تجاهل الإدخالات التي لا يمكن حلها وقت التشغيل.

ينبغي أن تكون مفاتيح قائمة سماح الغرف (`groups`، و`rooms` القديم) معرفات غرف أو أسماء مستعارة. يتم تجاهل مفاتيح أسماء الغرف العادية افتراضيا؛ ويعيد `dangerouslyAllowNameMatching: true` تفعيل البحث بأفضل جهد مقابل أسماء الغرف المنضم إليها.

### الحساب والاتصال

- `enabled`: تفعيل القناة أو تعطيلها.
- `name`: تسمية عرض اختيارية للحساب.
- `defaultAccount`: معرف الحساب المفضل عند إعداد حسابات Matrix متعددة.
- `accounts`: تجاوزات مسماة لكل حساب. يتم توريث قيم `channels.matrix` العليا كإعدادات افتراضية.
- `homeserver`: عنوان URL لخادم homeserver، مثلا `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: السماح لهذا الحساب بالاتصال بـ `localhost` أو عناوين IP على LAN/Tailscale أو أسماء مضيفين داخلية.
- `proxy`: عنوان URL اختياري لوكيل HTTP(S) لزيارات Matrix. يدعم التجاوز لكل حساب.
- `userId`: معرف مستخدم Matrix كامل (`@bot:example.org`).
- `accessToken`: رمز وصول للمصادقة القائمة على الرمز. القيم النصية الصريحة وقيم SecretRef مدعومة عبر مزودي env/file/exec ([إدارة الأسرار](/ar/gateway/secrets)).
- `password`: كلمة مرور لتسجيل الدخول القائم على كلمة المرور. القيم النصية الصريحة وقيم SecretRef مدعومة.
- `deviceId`: معرف جهاز Matrix صريح.
- `deviceName`: اسم عرض الجهاز المستخدم عند تسجيل الدخول بكلمة المرور.
- `avatarUrl`: عنوان URL محفوظ للصورة الرمزية الذاتية لمزامنة الملف الشخصي وتحديثات `profile set`.
- `initialSyncLimit`: الحد الأقصى لعدد الأحداث التي يتم جلبها أثناء مزامنة بدء التشغيل.

### التشفير

- `encryption`: تفعيل E2EE. الافتراضي: `false`.
- `startupVerification`: `"if-unverified"` (الافتراضي عند تشغيل E2EE) أو `"off"`. يطلب التحقق الذاتي تلقائيا عند بدء التشغيل عندما يكون هذا الجهاز غير موثق.
- `startupVerificationCooldownHours`: فترة التهدئة قبل طلب بدء التشغيل التلقائي التالي. الافتراضي: `24`.

### الوصول والسياسة

- `groupPolicy`: `"open"`، أو `"allowlist"`، أو `"disabled"`. الافتراضي: `"allowlist"`.
- `groupAllowFrom`: قائمة سماح لمعرفات المستخدمين لزيارات الغرف.
- `dm.enabled`: عند `false`، تجاهل جميع الرسائل المباشرة. الافتراضي: `true`.
- `dm.policy`: `"pairing"` (الافتراضي)، أو `"allowlist"`، أو `"open"`، أو `"disabled"`. ينطبق بعد انضمام البوت وتصنيف الغرفة كرسالة مباشرة؛ ولا يؤثر في التعامل مع الدعوات.
- `dm.allowFrom`: قائمة سماح لمعرفات المستخدمين لزيارات الرسائل المباشرة.
- `dm.sessionScope`: `"per-user"` (الافتراضي) أو `"per-room"`.
- `dm.threadReplies`: تجاوز خاص بالرسائل المباشرة لترابط الردود (`"off"`، أو `"inbound"`، أو `"always"`).
- `allowBots`: قبول الرسائل من حسابات بوت Matrix الأخرى المعدة (`true` أو `"mentions"`).
- `allowlistOnly`: عند `true`، يفرض تحويل جميع سياسات الرسائل المباشرة النشطة (باستثناء `"disabled"`) وسياسات المجموعات `"open"` إلى `"allowlist"`. لا يغير سياسات `"disabled"`.
- `dangerouslyAllowNameMatching`: عند `true`، يسمح ببحث دليل أسماء عرض Matrix لإدخالات قائمة سماح المستخدمين وبحث أسماء الغرف المنضم إليها لمفاتيح قائمة سماح الغرف. فضل معرفات `@user:server` الكاملة ومعرفات الغرف أو الأسماء المستعارة.
- `autoJoin`: `"always"`، أو `"allowlist"`، أو `"off"`. الافتراضي: `"off"`. ينطبق على كل دعوة Matrix، بما في ذلك الدعوات ذات نمط الرسائل المباشرة.
- `autoJoinAllowlist`: الغرف/الأسماء المستعارة المسموح بها عندما يكون `autoJoin` مضبوطا على `"allowlist"`. يتم حل إدخالات الأسماء المستعارة مقابل خادم homeserver، وليس مقابل الحالة التي تدعيها الغرفة الداعية.
- `contextVisibility`: رؤية سياق تكميلية (الافتراضي `"all"`، أو `"allowlist"`، أو `"allowlist_quote"`).

### سلوك الرد

- `replyToMode`: `"off"`، أو `"first"`، أو `"all"`، أو `"batched"`.
- `threadReplies`: `"off"`، أو `"inbound"`، أو `"always"`.
- `threadBindings`: تجاوزات لكل قناة لتوجيه الجلسات المرتبطة بالسلاسل ودورة حياتها.
- `streaming`: `"off"` (الافتراضي)، أو `"partial"`، أو `"quiet"`، أو صيغة كائن `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`، و`false` ↔ `"off"`.
- `blockStreaming`: عند `true`، تبقى كتل المساعد المكتملة كرسائل تقدم منفصلة.
- `markdown`: إعداد تصيير Markdown اختياري للنص الصادر.
- `responsePrefix`: سلسلة اختيارية تضاف في بداية الردود الصادرة.
- `textChunkLimit`: حجم المقطع الصادر بالأحرف عندما يكون `chunkMode: "length"`. الافتراضي: `4000`.
- `chunkMode`: `"length"` (الافتراضي، يقسم حسب عدد الأحرف) أو `"newline"` (يقسم عند حدود الأسطر).
- `historyLimit`: عدد رسائل الغرفة الحديثة المضمنة كـ `InboundHistory` عندما تؤدي رسالة غرفة إلى تشغيل الوكيل. يعود إلى `messages.groupChat.historyLimit`؛ الافتراضي الفعلي `0` (معطل).
- `mediaMaxMb`: حد حجم الوسائط بالميغابايت للإرسال الصادر والمعالجة الواردة.

### إعدادات التفاعل

- `ackReaction`: تجاوز تفاعل الإقرار لهذه القناة/الحساب.
- `ackReactionScope`: تجاوز النطاق (الافتراضي `"group-mentions"`، أو `"group-all"`، أو `"direct"`، أو `"all"`، أو `"none"`، أو `"off"`).
- `reactionNotifications`: وضع إشعارات التفاعل الواردة (الافتراضي `"own"`، أو `"off"`).

### الأدوات والتجاوزات لكل غرفة

- `actions`: تقييد الأدوات لكل إجراء (`messages`، و`reactions`، و`pins`، و`profile`، و`memberInfo`، و`channelInfo`، و`verification`).
- `groups`: خريطة سياسة لكل غرفة. تستخدم هوية الجلسة معرف الغرفة المستقر بعد الحل. (`rooms` اسم مستعار قديم.)
  - `groups.<room>.account`: تقييد إدخال غرفة موروث واحد بحساب محدد.
  - `groups.<room>.allowBots`: تجاوز لكل غرفة لإعداد مستوى القناة (`true` أو `"mentions"`).
  - `groups.<room>.users`: قائمة سماح مرسلين لكل غرفة.
  - `groups.<room>.tools`: تجاوزات سماح/رفض الأدوات لكل غرفة.
  - `groups.<room>.autoReply`: تجاوز تقييد الإشارات لكل غرفة. يعطل `true` متطلبات الإشارة لتلك الغرفة؛ ويجبرها `false` على العودة.
  - `groups.<room>.skills`: مرشح Skills لكل غرفة.
  - `groups.<room>.systemPrompt`: مقتطف موجه نظام لكل غرفة.

### إعدادات موافقات exec

- `execApprovals.enabled`: تسليم موافقات exec عبر مطالبات Matrix الأصلية.
- `execApprovals.approvers`: معرفات مستخدمي Matrix المسموح لهم بالموافقة. يعود إلى `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (الافتراضي)، أو `"channel"`، أو `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: قوائم سماح اختيارية للوكلاء/الجلسات للتسليم.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) - كل القنوات المدعومة
- [الاقتران](/ar/channels/pairing) - مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) - سلوك دردشة المجموعات وتقييد الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) - توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) - نموذج الوصول والتقوية
