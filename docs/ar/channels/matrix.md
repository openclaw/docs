---
read_when:
    - إعداد Matrix في OpenClaw
    - تكوين E2EE في Matrix والتحقق
summary: حالة دعم Matrix، والإعداد، وأمثلة التكوين
title: المصفوفة
x-i18n:
    generated_at: "2026-06-28T20:41:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1291273746e364fb0ca7eafbde3d717ee555c3edfa576eab4fdd3d0048ceedd
    source_path: channels/matrix.md
    workflow: 16
---

Matrix هو Plugin قناة قابل للتنزيل لـ OpenClaw.
يستخدم `matrix-js-sdk` الرسمي ويدعم الرسائل الخاصة، والغرف، والسلاسل، والوسائط، والتفاعلات، والاستطلاعات، والموقع، وE2EE.

## التثبيت

ثبّت Matrix من ClawHub قبل تهيئة القناة:

```bash
openclaw plugins install @openclaw/matrix
```

تحاول مواصفات Plugin المجردة استخدام ClawHub أولًا، ثم تعود إلى npm. لفرض مصدر السجل، استخدم `openclaw plugins install clawhub:@openclaw/matrix` أو `openclaw plugins install npm:@openclaw/matrix`.

من نسخة محلية:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

يسجّل `plugins install` الـ Plugin ويفعّله، لذلك لا حاجة إلى خطوة منفصلة مثل `openclaw plugins enable matrix`. لا يزال الـ Plugin لا يفعل شيئًا حتى تهيئ القناة أدناه. راجع [Plugins](/ar/tools/plugin) لمعرفة سلوك Plugin العام وقواعد التثبيت.

## الإعداد

1. أنشئ حساب Matrix على خادمك المنزلي.
2. هيّئ `channels.matrix` باستخدام `homeserver` + `accessToken`، أو `homeserver` + `userId` + `password`.
3. أعد تشغيل Gateway.
4. ابدأ رسالة خاصة مع البوت، أو ادعه إلى غرفة (راجع [الانضمام التلقائي](#auto-join) - الدعوات الجديدة لا تصل إلا عندما يسمح بها `autoJoin`).

### الإعداد التفاعلي

```bash
openclaw channels add
openclaw configure --section channels
```

يسأل المعالج عن: عنوان URL للخادم المنزلي، وطريقة المصادقة (رمز وصول أو كلمة مرور)، ومعرّف المستخدم (لمصادقة كلمة المرور فقط)، واسم جهاز اختياري، وما إذا كان يجب تمكين E2EE، وما إذا كان يجب تهيئة وصول الغرف والانضمام التلقائي.

إذا كانت متغيرات البيئة المطابقة `MATRIX_*` موجودة بالفعل ولا توجد مصادقة محفوظة للحساب المحدد، يعرض المعالج اختصارًا عبر متغير بيئة. لحل أسماء الغرف قبل حفظ قائمة السماح، شغّل `openclaw channels resolve --channel matrix "Project Room"`. عند تمكين E2EE، يكتب المعالج التهيئة ويشغّل نفس تمهيد [`openclaw matrix encryption setup`](#encryption-and-verification).

### تهيئة بسيطة

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

القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`. مع القيمة الافتراضية، لن يظهر البوت في الغرف الجديدة أو الرسائل الخاصة الناتجة عن دعوات جديدة حتى تنضم يدويًا.

لا يستطيع OpenClaw معرفة وقت الدعوة ما إذا كانت الغرفة المدعو إليها رسالة خاصة أم مجموعة، لذلك تمر كل الدعوات - بما فيها الدعوات ذات نمط الرسائل الخاصة - عبر `autoJoin` أولًا. لا تُطبَّق `dm.policy` إلا لاحقًا، بعد أن ينضم البوت وتُصنَّف الغرفة.

<Warning>
اضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` لتقييد الدعوات التي يقبلها البوت، أو `autoJoin: "always"` لقبول كل دعوة.

لا يقبل `autoJoinAllowlist` إلا أهدافًا مستقرة: `!roomId:server` أو `#alias:server` أو `*`. تُرفض أسماء الغرف العادية؛ وتُحل إدخالات الأسماء المستعارة عبر الخادم المنزلي، لا عبر الحالة التي تدّعيها الغرفة المدعو إليها.
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

من الأفضل ملء قوائم سماح الرسائل الخاصة والغرف بمعرّفات مستقرة:

- الرسائل الخاصة (`dm.allowFrom` و`groupAllowFrom` و`groups.<room>.users`): استخدم `@user:server`. تُتجاهل أسماء العرض افتراضيًا لأنها قابلة للتغيير؛ اضبط `dangerouslyAllowNameMatching: true` فقط عندما تحتاج صراحةً إلى التوافق مع إدخالات أسماء العرض.
- مفاتيح قائمة سماح الغرف (`groups` و`rooms` القديمة): استخدم `!room:server` أو `#alias:server`. تُتجاهل أسماء الغرف العادية افتراضيًا؛ اضبط `dangerouslyAllowNameMatching: true` فقط عندما تحتاج صراحةً إلى التوافق مع البحث باسم الغرفة المنضم إليها.
- قوائم سماح الدعوات (`autoJoinAllowlist`): استخدم `!room:server` أو `#alias:server` أو `*`. تُرفض أسماء الغرف العادية.

### تطبيع معرّف الحساب

يحوّل المعالج الاسم الودي إلى معرّف حساب مطبّع. على سبيل المثال، يصبح `Ops Bot` هو `ops-bot`. تُهرَّب علامات الترقيم في أسماء متغيرات البيئة ذات النطاق بحيث لا يمكن أن يتصادم حسابان: `-` → `_X2D_`، لذلك يُربط `ops-prod` بـ `MATRIX_OPS_X2D_PROD_*`.

### بيانات الاعتماد المخزنة مؤقتًا

يخزّن Matrix بيانات الاعتماد المؤقتة تحت `~/.openclaw/credentials/matrix/`:

- الحساب الافتراضي: `credentials.json`
- الحسابات المسماة: `credentials-<account>.json`

عند وجود بيانات اعتماد مخزنة مؤقتًا هناك، يتعامل OpenClaw مع Matrix على أنه مهيأ حتى إن لم يكن رمز الوصول في ملف التهيئة - وهذا يغطي الإعداد و`openclaw doctor` وفحوص حالة القناة.

### متغيرات البيئة

تُستخدم عندما لا يكون مفتاح التهيئة المكافئ مضبوطًا. يستخدم الحساب الافتراضي أسماء بلا بادئة؛ وتستخدم الحسابات المسماة معرّف الحساب المُدرج قبل اللاحقة.

| الحساب الافتراضي       | الحساب المسمى (`<ID>` هو معرّف الحساب المطبّع) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

بالنسبة إلى الحساب `ops`، تصبح الأسماء `MATRIX_OPS_HOMESERVER` و`MATRIX_OPS_ACCESS_TOKEN` وما إلى ذلك. تقرأ تدفقات CLI الواعية بالاسترداد (`verify backup restore` و`verify device` و`verify bootstrap`) متغيرات بيئة مفتاح الاسترداد عندما تمرر المفتاح عبر `--recovery-key-stdin`.

لا يمكن ضبط `MATRIX_HOMESERVER` من ملف `.env` خاص بمساحة العمل؛ راجع [ملفات `.env` الخاصة بمساحة العمل](/ar/gateway/security).

## مثال تهيئة

خط أساس عملي مع اقتران الرسائل الخاصة، وقائمة سماح الغرف، وE2EE:

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

بث ردود Matrix اختياري. يتحكم `streaming` في كيفية تسليم OpenClaw لرد المساعد قيد التنفيذ؛ ويتحكم `blockStreaming` في ما إذا كان كل مقطع مكتمل يُحفظ كرسالة Matrix مستقلة.

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
| `"off"` (الافتراضي) | انتظر الرد الكامل، ثم أرسله مرة واحدة. `true` ↔ `"partial"`، و`false` ↔ `"off"`.                                                                                        |
| `"partial"`       | عدّل رسالة نصية عادية واحدة في مكانها بينما يكتب النموذج المقطع الحالي. قد ترسل عملاء Matrix القياسية إشعارًا عند أول معاينة، لا عند التعديل النهائي.              |
| `"quiet"`         | مثل `"partial"` لكن الرسالة إشعار صامت لا يرسل تنبيهًا. لا يتلقى المستلمون إشعارًا إلا عندما تطابق قاعدة دفع لكل مستخدم التعديل النهائي (انظر أدناه). |

`blockStreaming` مستقل عن `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (الافتراضي)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | مسودة مباشرة للمقطع الحالي، مع الاحتفاظ بالمقاطع المكتملة كرسائل | مسودة مباشرة للمقطع الحالي، تُنهى في مكانها |
| `"off"`                 | رسالة Matrix واحدة مُشعِرة لكل مقطع منتهٍ                     | رسالة Matrix واحدة مُشعِرة للرد الكامل      |

ملاحظات:

- إذا تجاوزت المعاينة حد حجم الحدث الواحد في Matrix، يوقف OpenClaw بث المعاينة ويعود إلى التسليم النهائي فقط.
- تُرسل ردود الوسائط دائمًا المرفقات بشكل طبيعي. إذا لم تعد معاينة قديمة قابلة لإعادة الاستخدام بأمان، يحجبها OpenClaw قبل إرسال رد الوسائط النهائي.
- تكون تحديثات معاينة تقدم الأدوات مفعّلة افتراضيًا عندما يكون بث معاينة Matrix نشطًا. اضبط `streaming.preview.toolProgress: false` للاحتفاظ بتعديلات المعاينة لنص الإجابة مع ترك تقدم الأدوات على مسار التسليم العادي.
- تكلف تعديلات المعاينة استدعاءات إضافية لـ API الخاصة بـ Matrix. اترك `streaming: "off"` إذا كنت تريد ملفًا أكثر تحفظًا لحدود المعدل.

## الرسائل الصوتية

تُفرّغ ملاحظات Matrix الصوتية الواردة قبل بوابة ذكر الغرفة. يتيح هذا لملاحظة صوتية تقول اسم البوت أن تشغّل الوكيل في غرفة `requireMention: true`، ويمنح الوكيل التفريغ بدلًا من مجرد عنصر نائب لمرفق صوتي.

يستخدم Matrix مزود وسائط الصوت المشترك المهيأ تحت `tools.media.audio`، مثل OpenAI `gpt-4o-mini-transcribe`. راجع [نظرة عامة على أدوات الوسائط](/ar/tools/media-overview) لإعداد المزود والحدود.

تفاصيل السلوك:

- أحداث `m.audio` وأحداث `m.file` ذات نوع MIME يطابق `audio/*` مؤهلة.
- في الغرف المشفرة، يفك OpenClaw تشفير المرفق عبر مسار وسائط Matrix الحالي قبل التفريغ.
- يُعلَّم التفريغ في مطالبة الوكيل على أنه مولّد آليًا وغير موثوق.
- يُعلَّم المرفق على أنه فُرّغ بالفعل حتى لا تفرّغ أدوات الوسائط اللاحقة الملاحظة الصوتية نفسها مرة أخرى.
- اضبط `tools.media.audio.enabled: false` لتعطيل تفريغ الصوت عالميًا.

## بيانات الموافقة الوصفية

مطالبات الموافقة الأصلية في Matrix هي أحداث `m.room.message` عادية تحتوي على محتوى حدث مخصص خاص بـ OpenClaw تحت `com.openclaw.approval`. يسمح Matrix بمفاتيح محتوى أحداث مخصصة، لذلك لا يزال العملاء القياسيون يعرضون متن النص بينما يستطيع العملاء الواعون بـ OpenClaw قراءة معرّف الموافقة المنظم، والنوع، والحالة، والقرارات المتاحة، وتفاصيل التنفيذ/Plugin.

عندما تكون مطالبة الموافقة طويلة جدًا لحدث Matrix واحد، يقسم OpenClaw النص المرئي إلى أجزاء ويرفق `com.openclaw.approval` بالجزء الأول فقط. تُربط تفاعلات قرارات السماح/الرفض بذلك الحدث الأول، لذلك تحتفظ المطالبات الطويلة بهدف الموافقة نفسه مثل المطالبات ذات الحدث الواحد.

### قواعد الدفع ذاتية الاستضافة للمعاينات النهائية الهادئة

يرسل `streaming: "quiet"` إشعارًا إلى المستلمين فقط عند انتهاء مقطع أو دورة - ويجب أن تطابق قاعدة دفع لكل مستخدم علامة المعاينة النهائية. راجع [قواعد دفع Matrix للمعاينات الهادئة](/ar/channels/matrix-push-rules) للوصفة الكاملة (رمز المستلم، وفحص الدافع، وتثبيت القاعدة، وملاحظات لكل خادم منزلي).

## غرف البوتات

افتراضيًا، تُتجاهل رسائل Matrix الواردة من حسابات Matrix أخرى مهيأة في OpenClaw.

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

- يقبل `allowBots: true` الرسائل من حسابات بوت Matrix المهيأة الأخرى في الغرف والرسائل المباشرة المسموح بها.
- يقبل `allowBots: "mentions"` تلك الرسائل فقط عندما تذكر هذا البوت بوضوح في الغرف. تظل الرسائل المباشرة مسموحة.
- يتجاوز `groups.<room>.allowBots` إعداد مستوى الحساب لغرفة واحدة.
- تستخدم رسائل البوتات المهيأة المقبولة [الحماية من حلقات البوت](/ar/channels/bot-loop-protection) المشتركة. اضبط `channels.defaults.botLoopProtection`، ثم تجاوزه باستخدام `channels.matrix.botLoopProtection` أو `channels.matrix.groups.<room>.botLoopProtection` عندما تحتاج غرفة واحدة إلى ميزانية مختلفة.
- لا يزال OpenClaw يتجاهل الرسائل من معرف مستخدم Matrix نفسه لتجنب حلقات الرد الذاتي.
- لا يوفر Matrix علامة بوت أصلية هنا؛ يتعامل OpenClaw مع "منشور بواسطة بوت" على أنه "مرسل بواسطة حساب Matrix مهيأ آخر على Gateway OpenClaw هذا".

استخدم قوائم سماح صارمة للغرف ومتطلبات الذكر عند تمكين حركة المرور بين البوتات في الغرف المشتركة.

## التشفير والتحقق

في الغرف المشفرة (E2EE)، تستخدم أحداث الصور الصادرة `thumbnail_file` بحيث تكون معاينات الصور مشفرة مع المرفق الكامل. لا تزال الغرف غير المشفرة تستخدم `thumbnail_url` عاديًا. لا يلزم أي إعداد - يكتشف Plugin حالة E2EE تلقائيًا.

تقبل جميع أوامر `openclaw matrix` الخيارات `--verbose` (تشخيصات كاملة)، و`--json` (إخراج قابل للقراءة آليًا)، و`--account <id>` (إعدادات متعددة الحسابات). يكون الإخراج موجزًا افتراضيًا مع تسجيل داخلي هادئ من SDK. تعرض الأمثلة أدناه الصيغة القياسية؛ أضف الأعلام حسب الحاجة.

### تمكين التشفير

```bash
openclaw matrix encryption setup
```

يمهد تخزين الأسرار والتوقيع المتقاطع، وينشئ نسخة احتياطية لمفاتيح الغرف إذا لزم الأمر، ثم يطبع الحالة والخطوات التالية. أعلام مفيدة:

- `--recovery-key <key>` طبّق مفتاح استرداد قبل التمهيد (يفضل استخدام صيغة stdin الموثقة أدناه)
- `--force-reset-cross-signing` تجاهل هوية التوقيع المتقاطع الحالية وأنشئ هوية جديدة (استخدمه عمدًا فقط)

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

### إشارات الحالة والثقة

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

يعرض `verify status` ثلاث إشارات ثقة مستقلة (يعرض `--verbose` جميعها):

- `Locally trusted`: موثوق به من هذا العميل فقط
- `Cross-signing verified`: يفيد SDK بأن التحقق تم عبر التوقيع المتقاطع
- `Signed by owner`: موقع بمفتاح التوقيع الذاتي الخاص بك (تشخيصي فقط)

تصبح `Verified by owner` بالقيمة `yes` فقط عندما تكون `Cross-signing verified` بالقيمة `yes`. الثقة المحلية أو توقيع المالك وحده ليس كافيًا.

يعيد `--allow-degraded-local-state` تشخيصات بأفضل جهد دون تجهيز حساب Matrix أولًا؛ مفيد للفحوصات غير المتصلة أو المهيأة جزئيًا.

### تحقق من هذا الجهاز باستخدام مفتاح استرداد

مفتاح الاسترداد حساس - مرره عبر stdin بدلًا من تمريره في سطر الأوامر. اضبط `MATRIX_RECOVERY_KEY` (أو `MATRIX_<ID>_RECOVERY_KEY` لحساب مسمى):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

يعرض الأمر ثلاث حالات:

- `Recovery key accepted`: قبل Matrix المفتاح لتخزين الأسرار أو ثقة الجهاز.
- `Backup usable`: يمكن تحميل نسخة مفاتيح الغرف الاحتياطية باستخدام مادة الاسترداد الموثوقة.
- `Device verified by owner`: لدى هذا الجهاز ثقة كاملة بهوية التوقيع المتقاطع في Matrix.

يخرج برمز غير صفري عندما تكون ثقة الهوية الكاملة غير مكتملة، حتى إذا فتح مفتاح الاسترداد مادة النسخة الاحتياطية. في هذه الحالة، أكمل التحقق الذاتي من عميل Matrix آخر:

```bash
openclaw matrix verify self
```

ينتظر `verify self` ظهور `Cross-signing verified: yes` قبل أن يخرج بنجاح. استخدم `--timeout-ms <ms>` لضبط مدة الانتظار.

تُقبل أيضًا صيغة المفتاح الحرفية `openclaw matrix verify device "<recovery-key>"`، لكن المفتاح سينتهي في سجل shell لديك.

### تمهيد التوقيع المتقاطع أو إصلاحه

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` هو أمر الإصلاح والإعداد للحسابات المشفرة. بالترتيب، يقوم بما يلي:

- يمهد تخزين الأسرار، مع إعادة استخدام مفتاح استرداد موجود عند الإمكان
- يمهد التوقيع المتقاطع ويرفع المفاتيح العامة الناقصة
- يعلّم الجهاز الحالي ويوقعه توقيعًا متقاطعًا
- ينشئ نسخة احتياطية لمفاتيح الغرف على جانب الخادم إذا لم تكن موجودة بالفعل

إذا كان homeserver يتطلب UIA لرفع مفاتيح التوقيع المتقاطع، يحاول OpenClaw أولًا دون مصادقة، ثم `m.login.dummy`، ثم `m.login.password` (يتطلب `channels.matrix.password`).

أعلام مفيدة:

- `--recovery-key-stdin` (اقرنه مع `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) أو `--recovery-key <key>`
- `--force-reset-cross-signing` لتجاهل هوية التوقيع المتقاطع الحالية (عمدًا فقط؛ يتطلب أن يكون مفتاح الاسترداد النشط مخزنًا أو مقدمًا باستخدام `--recovery-key-stdin`)

### نسخة مفاتيح الغرف الاحتياطية

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

يعرض `backup status` ما إذا كانت نسخة احتياطية على جانب الخادم موجودة وما إذا كان هذا الجهاز يستطيع فك تشفيرها. يستورد `backup restore` مفاتيح الغرف المنسوخة احتياطيًا إلى مخزن التشفير المحلي؛ إذا كان مفتاح الاسترداد موجودًا بالفعل على القرص، يمكنك حذف `--recovery-key-stdin`.

لاستبدال نسخة احتياطية معطلة بخط أساس جديد (يقبل فقدان السجل القديم غير القابل للاسترداد؛ ويمكنه أيضًا إعادة إنشاء تخزين الأسرار إذا كان سر النسخة الاحتياطية الحالي غير قابل للتحميل):

```bash
openclaw matrix verify backup reset --yes
```

أضف `--rotate-recovery-key` فقط عندما تريد عمدًا إيقاف مفتاح الاسترداد السابق عن فتح خط أساس النسخة الاحتياطية الجديد.

### سرد عمليات التحقق وطلبها والرد عليها

```bash
openclaw matrix verify list
```

يسرد طلبات التحقق المعلقة للحساب المحدد.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

يرسل طلب تحقق من حساب OpenClaw هذا. يطلب `--own-user` تحققًا ذاتيًا (تقبل المطالبة في عميل Matrix آخر للمستخدم نفسه)؛ وتستهدف `--user-id`/`--device-id`/`--room-id` شخصًا آخر. لا يمكن دمج `--own-user` مع أعلام الاستهداف الأخرى.

للتعامل مع دورة حياة أدنى مستوى - عادةً أثناء متابعة الطلبات الواردة من عميل آخر - تعمل هذه الأوامر على طلب محدد `<id>` (يطبع بواسطة `verify list` و`verify request`):

| الأمر                                      | الغرض                                                              |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | قبول طلب وارد                                                       |
| `openclaw matrix verify start <id>`        | بدء تدفق SAS                                                        |
| `openclaw matrix verify sas <id>`          | طباعة رموز SAS التعبيرية أو الأرقام العشرية                         |
| `openclaw matrix verify confirm-sas <id>`  | تأكيد أن SAS يطابق ما يعرضه العميل الآخر                           |
| `openclaw matrix verify mismatch-sas <id>` | رفض SAS عندما لا تتطابق الرموز التعبيرية أو الأرقام العشرية         |
| `openclaw matrix verify cancel <id>`       | إلغاء؛ يأخذ اختياريًا `--reason <text>` و`--code <matrix-code>`     |

تقبل `accept` و`start` و`sas` و`confirm-sas` و`mismatch-sas` و`cancel` جميعها `--user-id` و`--room-id` كتلميحات متابعة للرسائل المباشرة عندما يكون التحقق مرتبطًا بغرفة رسالة مباشرة محددة.

### ملاحظات الحسابات المتعددة

بدون `--account <id>`، تستخدم أوامر CLI الخاصة بـ Matrix الحساب الافتراضي الضمني. إذا كانت لديك حسابات مسماة متعددة ولم تضبط `channels.matrix.defaultAccount`، فسيرفض التخمين وسيطلب منك الاختيار. عندما تكون E2EE معطلة أو غير متاحة لحساب مسمى، تشير الأخطاء إلى مفتاح إعداد ذلك الحساب، مثل `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="سلوك بدء التشغيل">
    مع `encryption: true`، تكون القيمة الافتراضية لـ `startupVerification` هي `"if-unverified"`. عند بدء التشغيل، يطلب الجهاز غير المتحقق منه التحقق الذاتي في عميل Matrix آخر، مع تخطي التكرارات وتطبيق فترة تهدئة (24 ساعة افتراضيًا). اضبط ذلك باستخدام `startupVerificationCooldownHours` أو عطله باستخدام `startupVerification: "off"`.

    يشغل بدء التشغيل أيضًا تمريرة تمهيد تشفير محافظة تعيد استخدام تخزين الأسرار الحالي وهوية التوقيع المتقاطع. إذا كانت حالة التمهيد معطلة، يحاول OpenClaw إصلاحًا محروسًا حتى دون `channels.matrix.password`؛ وإذا كان homeserver يتطلب UIA بكلمة مرور، يسجل بدء التشغيل تحذيرًا ويبقى غير قاتل. يتم الحفاظ على الأجهزة الموقعة مسبقًا من المالك.

    راجع [ترحيل Matrix](/ar/channels/matrix-migration) للاطلاع على تدفق الترقية الكامل.

  </Accordion>

  <Accordion title="إشعارات التحقق">
    ينشر Matrix إشعارات دورة حياة التحقق في غرفة التحقق الصارمة للرسائل المباشرة كرسائل `m.notice`: الطلب، الجاهزية (مع إرشادات "تحقق بالرموز التعبيرية")، البدء/الإكمال، وتفاصيل SAS (رموز تعبيرية/عشرية) عندما تكون متاحة.

    يتم تتبع الطلبات الواردة من عميل Matrix آخر وقبولها تلقائيًا. بالنسبة للتحقق الذاتي، يبدأ OpenClaw تدفق SAS تلقائيًا ويؤكد جانبه بمجرد توفر التحقق بالرموز التعبيرية - لا يزال عليك المقارنة وتأكيد "إنها متطابقة" في عميل Matrix لديك.

    لا تتم إعادة توجيه إشعارات نظام التحقق إلى خط أنابيب محادثة الوكيل.

  </Accordion>

  <Accordion title="جهاز Matrix محذوف أو غير صالح">
    إذا قال `verify status` إن الجهاز الحالي لم يعد مدرجًا على homeserver، فأنشئ جهاز OpenClaw Matrix جديدًا. لتسجيل الدخول بكلمة مرور:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    لمصادقة الرمز، أنشئ رمز وصول جديدًا في عميل Matrix لديك أو واجهة الإدارة، ثم حدّث OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    استبدل `assistant` بمعرف الحساب من الأمر الفاشل، أو احذف `--account` للحساب الافتراضي.

  </Accordion>

  <Accordion title="نظافة الأجهزة">
    يمكن أن تتراكم الأجهزة القديمة التي يديرها OpenClaw. اسردها ونظفها:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="مخزن التشفير">
    تستخدم E2EE في Matrix مسار التشفير Rust الرسمي من `matrix-js-sdk` مع `fake-indexeddb` كطبقة توافق IndexedDB. تستمر حالة التشفير في `crypto-idb-snapshot.json` (أذونات ملفات مقيدة).

    تعيش حالة التشغيل المشفرة تحت `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` وتتضمن مخزن المزامنة، ومخزن التشفير، ومفتاح الاسترداد، ولقطة IDB، وروابط سلاسل المحادثة، وحالة تحقق بدء التشغيل. عندما يتغير الرمز وتبقى هوية الحساب كما هي، يعيد OpenClaw استخدام أفضل جذر موجود بحيث تظل الحالة السابقة مرئية.

    يمكن أن يكون جذر token-hash أقدم واحد مسار استمرارية طبيعيًا لتدوير الرمز. إذا سجل OpenClaw الرسالة `matrix: multiple populated token-hash storage roots detected`، فافحص دليل الحساب وأرشف الجذور الشقيقة القديمة فقط بعد التأكد من أن الجذر النشط المحدد سليم. يفضل نقل الجذور القديمة إلى دليل `_archive/` بدلًا من حذفها فورًا.

  </Accordion>
</AccordionGroup>

## إدارة الملف الشخصي

حدّث ملف Matrix الشخصي الذاتي للحساب المحدد:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

يمكنك تمرير كلا الخيارين في استدعاء واحد. يقبل Matrix عناوين URL للصور الرمزية بصيغة `mxc://` مباشرة؛ عند تمرير `http://` أو `https://`، يرفع OpenClaw الملف أولاً ويخزّن عنوان URL المحلول بصيغة `mxc://` في `channels.matrix.avatarUrl` (أو التجاوز الخاص بكل حساب).

## الخيوط

يدعم Matrix خيوط Matrix الأصلية لكل من الردود التلقائية وإرسالات أداة الرسائل. يتحكم خياران مستقلان في السلوك:

### توجيه الجلسة (`sessionScope`)

يقرر `dm.sessionScope` كيف تُطابق غرف رسائل Matrix المباشرة مع جلسات OpenClaw:

- `"per-user"` (الافتراضي): تشترك كل غرف الرسائل المباشرة ذات النظير الموجّه نفسه في جلسة واحدة.
- `"per-room"`: تحصل كل غرفة رسائل مباشرة في Matrix على مفتاح جلسة خاص بها، حتى عندما يكون النظير هو نفسه.

تتغلب ارتباطات المحادثات الصريحة دائماً على `sessionScope`، لذلك تحتفظ الغرف والخيوط المرتبطة بجلسة الهدف المختارة.

### خيوط الرد (`threadReplies`)

يقرر `threadReplies` أين ينشر البوت رده:

- `"off"`: تكون الردود على المستوى الأعلى. تبقى الرسائل الواردة ضمن خيط في جلسة الأصل.
- `"inbound"`: الرد داخل خيط فقط عندما تكون الرسالة الواردة موجودة أصلاً في ذلك الخيط.
- `"always"`: الرد داخل خيط متجذر عند الرسالة المشغّلة؛ تُوجّه تلك المحادثة عبر جلسة مطابقة محددة النطاق بالخيط من أول تشغيل فصاعداً.

يتجاوز `dm.threadReplies` هذا للرسائل المباشرة فقط - على سبيل المثال، إبقاء خيوط الغرف معزولة مع إبقاء الرسائل المباشرة مسطحة.

### وراثة الخيوط وأوامر الشرطة المائلة

- تتضمن الرسائل الواردة ضمن خيط رسالة جذر الخيط كسياق إضافي للوكيل.
- ترث إرسالات أداة الرسائل خيط Matrix الحالي تلقائياً عند استهداف الغرفة نفسها (أو هدف مستخدم الرسائل المباشرة نفسه)، ما لم يُوفَّر `threadId` صريح.
- لا يُفعّل إعادة استخدام هدف مستخدم الرسائل المباشرة إلا عندما تثبت بيانات الجلسة الوصفية نظير الرسائل المباشرة نفسه على حساب Matrix نفسه؛ وإلا يعود OpenClaw إلى التوجيه الطبيعي محدد النطاق بالمستخدم.
- تعمل `/focus`، و`/unfocus`، و`/agents`، و`/session idle`، و`/session max-age`، و`/acp spawn` المرتبط بخيط كلها في غرف Matrix ورسائله المباشرة.
- تنشئ `/focus` على المستوى الأعلى خيط Matrix جديداً وتربطه بالجلسة الهدف عندما يكون `threadBindings.spawnSessions` مفعلاً.
- يؤدي تشغيل `/focus` أو `/acp spawn --thread here` داخل خيط Matrix موجود إلى ربط ذلك الخيط في مكانه.

عندما يكتشف OpenClaw أن غرفة رسائل Matrix مباشرة تتصادم مع غرفة رسائل مباشرة أخرى على الجلسة المشتركة نفسها، ينشر `m.notice` لمرة واحدة في تلك الغرفة يشير إلى مخرج `/focus` ويقترح تغيير `dm.sessionScope`. لا يظهر الإشعار إلا عندما تكون ارتباطات الخيوط مفعلة.

## ارتباطات محادثات ACP

يمكن تحويل غرف Matrix والرسائل المباشرة وخيوط Matrix الموجودة إلى مساحات عمل ACP دائمة من دون تغيير سطح الدردشة.

تدفق المشغّل السريع:

- شغّل `/acp spawn codex --bind here` داخل رسالة Matrix المباشرة أو الغرفة أو الخيط الموجود الذي تريد مواصلة استخدامه.
- في رسالة Matrix مباشرة أو غرفة على المستوى الأعلى، يبقى سطح الدردشة هو الرسالة المباشرة/الغرفة الحالية وتُوجّه الرسائل المستقبلية إلى جلسة ACP المنشأة.
- داخل خيط Matrix موجود، يربط `--bind here` ذلك الخيط الحالي في مكانه.
- يعيد `/new` و`/reset` ضبط جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الارتباط.

ملاحظات:

- لا ينشئ `--bind here` خيط Matrix فرعياً.
- يتحكم `threadBindings.spawnSessions` في `/acp spawn --thread auto|here`، حيث يحتاج OpenClaw إلى إنشاء خيط Matrix فرعي أو ربطه.

### إعداد ارتباط الخيوط

يرث Matrix الإعدادات الافتراضية العامة من `session.threadBindings`، ويدعم أيضاً التجاوزات لكل قناة:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

تكون عمليات إنشاء الجلسات المرتبطة بخيط Matrix مفعلة افتراضياً:

- عيّن `threadBindings.spawnSessions: false` لمنع `/focus` على المستوى الأعلى و`/acp spawn --thread auto|here` من إنشاء/ربط خيوط Matrix.
- عيّن `threadBindings.defaultSpawnContext: "isolated"` عندما يجب ألا تنسخ عمليات إنشاء خيوط الوكلاء الفرعيين الأصلية نص جلسة الأصل.

## التفاعلات

يدعم Matrix التفاعلات الصادرة، وإشعارات التفاعلات الواردة، وتفاعلات الإقرار.

تخضع أدوات التفاعل الصادر لـ `channels.matrix.actions.reactions`:

- يضيف `react` تفاعلاً إلى حدث Matrix.
- يسرد `reactions` ملخص التفاعلات الحالي لحدث Matrix.
- يزيل `emoji=""` تفاعلات البوت نفسه على ذلك الحدث.
- يزيل `remove: true` تفاعل الرمز التعبيري المحدد فقط من البوت.

**ترتيب الحل** (أول قيمة معرّفة تفوز):

| الإعداد                 | الترتيب                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | لكل حساب → القناة → `messages.ackReaction` → رجوع إلى رمز تعبيري لهوية الوكيل   |
| `ackReactionScope`      | لكل حساب → القناة → `messages.ackReactionScope` → الافتراضي `"group-mentions"` |
| `reactionNotifications` | لكل حساب → القناة → الافتراضي `"own"`                                          |

يوجّه `reactionNotifications: "own"` أحداث `m.reaction` المضافة عندما تستهدف رسائل Matrix التي ألّفها البوت؛ يعطل `"off"` أحداث نظام التفاعل. لا تُركّب عمليات إزالة التفاعل في أحداث نظام لأن Matrix يعرضها كتنقيحات، لا كعمليات إزالة `m.reaction` مستقلة.

## سياق السجل

- يتحكم `channels.matrix.historyLimit` في عدد رسائل الغرفة الحديثة المضمّنة كـ `InboundHistory` عندما تشغّل رسالة غرفة Matrix الوكيل. يعود إلى `messages.groupChat.historyLimit`؛ إذا لم يُعيّن كلاهما، يكون الافتراضي الفعلي `0`. عيّن `0` للتعطيل.
- سجل غرفة Matrix خاص بالغرفة فقط. تستمر الرسائل المباشرة في استخدام سجل الجلسة الطبيعي.
- سجل غرفة Matrix معلّق فقط: يخزّن OpenClaw رسائل الغرفة التي لم تشغّل رداً بعد، ثم يلتقط نافذة السجل تلك عند وصول إشارة ذكر أو مشغّل آخر.
- لا تُضمّن رسالة التشغيل الحالية في `InboundHistory`؛ تبقى في متن الوارد الرئيسي لتلك الدورة.
- تعيد محاولات حدث Matrix نفسه استخدام لقطة السجل الأصلية بدلاً من الانزياح إلى رسائل غرفة أحدث.

## رؤية السياق

يدعم Matrix تحكم `contextVisibility` المشترك لسياق الغرفة التكميلي مثل نص الرد المجلب، وجذور الخيوط، والسجل المعلّق.

- `contextVisibility: "all"` هو الافتراضي. يُحفظ السياق التكميلي كما استُلم.
- يرشّح `contextVisibility: "allowlist"` السياق التكميلي إلى المرسلين المسموحين بفحوصات قائمة السماح النشطة للغرفة/المستخدم.
- يتصرف `contextVisibility: "allowlist_quote"` مثل `allowlist`، لكنه لا يزال يحتفظ برد مقتبس صريح واحد.

يؤثر هذا الإعداد في رؤية السياق التكميلي، لا في ما إذا كان يمكن للرسالة الواردة نفسها تشغيل رد.
لا يزال تفويض التشغيل يأتي من `groupPolicy`، و`groups`، و`groupAllowFrom`، وإعدادات سياسة الرسائل المباشرة.

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

لإسكات الرسائل المباشرة بالكامل مع إبقاء الغرف تعمل، عيّن `dm.enabled: false`:

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

راجع [المجموعات](/ar/channels/groups) لسلوك بوابة الذكر وقائمة السماح.

مثال إقران لرسائل Matrix المباشرة:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

إذا واصل مستخدم Matrix غير معتمد مراسلتك قبل الاعتماد، يعيد OpenClaw استخدام رمز الإقران المعلّق نفسه وقد يرسل رد تذكير بعد فترة تهدئة قصيرة بدلاً من سك رمز جديد.

راجع [الإقران](/ar/channels/pairing) لتدفق إقران الرسائل المباشرة المشترك وتخطيط التخزين.

## إصلاح الغرف المباشرة

إذا انحرفت حالة الرسائل المباشرة عن التزامن، قد ينتهي OpenClaw بتعيينات `m.direct` قديمة تشير إلى غرف فردية قديمة بدلاً من الرسالة المباشرة الحية. افحص التعيين الحالي لنظير:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

أصلحه:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

يقبل كلا الأمرين `--account <id>` لإعدادات الحسابات المتعددة. تدفق الإصلاح:

- يفضّل رسالة مباشرة 1:1 صارمة معيّنة بالفعل في `m.direct`
- يعود إلى أي رسالة مباشرة 1:1 صارمة منضمة حالياً مع ذلك المستخدم
- ينشئ غرفة مباشرة جديدة ويعيد كتابة `m.direct` إذا لم توجد رسالة مباشرة سليمة

لا يحذف الغرف القديمة تلقائياً. يختار الرسالة المباشرة السليمة ويحدّث التعيين بحيث تستهدف إرسالات Matrix المستقبلية، وإشعارات التحقق، وتدفقات الرسائل المباشرة الأخرى الغرفة الصحيحة.

## موافقات التنفيذ

يمكن أن يعمل Matrix كعميل موافقات أصلي. اضبطه ضمن `channels.matrix.execApprovals` (أو `channels.matrix.accounts.<account>.execApprovals` لتجاوز لكل حساب):

- `enabled`: يسلّم الموافقات عبر مطالبات Matrix الأصلية. عند عدم التعيين أو عند `"auto"`، يفعّل Matrix نفسه تلقائياً عندما يمكن حل معتمد واحد على الأقل. عيّن `false` للتعطيل صراحة.
- `approvers`: معرّفات مستخدمي Matrix (`@owner:example.org`) المسموح لهم باعتماد طلبات التنفيذ. اختياري - يعود إلى `channels.matrix.dm.allowFrom`.
- `target`: مكان إرسال المطالبات. يرسل `"dm"` (الافتراضي) إلى الرسائل المباشرة للمعتمدين؛ يرسل `"channel"` إلى غرفة Matrix أو الرسالة المباشرة الأصلية؛ يرسل `"both"` إلى كليهما.
- `agentFilter` / `sessionFilter`: قوائم سماح اختيارية للوكلاء/الجلسات التي تشغّل تسليم Matrix.

يختلف التفويض قليلاً بين أنواع الموافقة:

- تستخدم **موافقات التنفيذ** `execApprovals.approvers`، مع الرجوع إلى `dm.allowFrom`.
- تفوّض **موافقات Plugin** عبر `dm.allowFrom` فقط.

يشترك كلا النوعين في اختصارات تفاعلات Matrix وتحديثات الرسائل. يرى المعتمدون اختصارات التفاعل على رسالة الموافقة الرئيسية:

- `✅` السماح مرة واحدة
- `❌` الرفض
- `♾️` السماح دائماً (عندما تسمح سياسة التنفيذ الفعالة بذلك)

أوامر الشرطة المائلة الاحتياطية: `/approve <id> allow-once`، و`/approve <id> allow-always`، و`/approve <id> deny`.

يمكن للمعتمدين المحلولين فقط الاعتماد أو الرفض. يتضمن تسليم القناة لموافقات التنفيذ نص الأمر - لا تفعّل `channel` أو `both` إلا في الغرف الموثوقة.

ذو صلة: [موافقات التنفيذ](/ar/tools/exec-approvals).

## أوامر الشرطة المائلة

تعمل أوامر الشرطة المائلة (`/new`، و`/reset`، و`/model`، و`/focus`، و`/unfocus`، و`/agents`، و`/session`، و`/acp`، و`/approve`، وما إلى ذلك) مباشرة في الرسائل المباشرة. في الغرف، يتعرف OpenClaw أيضاً على الأوامر المسبوقة بذكر Matrix الخاص بالبوت نفسه، لذلك يشغّل `@bot:server /new` مسار الأمر من دون تعبير منتظم مخصص للذكر. يبقي هذا البوت مستجيباً لمنشورات نمط الغرفة `@mention /command` التي يرسلها Element والعملاء المشابهون عندما يُكمل المستخدم اسم البوت بالتبويب قبل كتابة الأمر.

لا تزال قواعد التفويض مطبقة: يجب أن يستوفي مرسلو الأوامر سياسات قائمة السماح/المالك نفسها للرسائل المباشرة أو الغرف كما في الرسائل العادية.

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

- تعمل قيم `channels.matrix` ذات المستوى الأعلى كقيم افتراضية للحسابات المسماة ما لم يتجاوزها حساب.
- حدّد نطاق إدخال غرفة موروث إلى حساب محدد باستخدام `groups.<room>.account`. الإدخالات التي لا تحتوي على `account` تكون مشتركة بين الحسابات؛ وما زال `account: "default"` يعمل عندما يكون الحساب الافتراضي مضبوطا في المستوى الأعلى.

**اختيار الحساب الافتراضي:**

- اضبط `defaultAccount` لاختيار الحساب المسمى الذي تفضله عمليات التوجيه الضمني، والفحص، وأوامر CLI.
- إذا كانت لديك عدة حسابات وكان أحدها مسمى حرفيا `default`، فسيستخدمه OpenClaw ضمنيا حتى عندما يكون `defaultAccount` غير مضبوط.
- إذا كانت لديك عدة حسابات مسماة ولم يتم تحديد حساب افتراضي، ترفض أوامر CLI التخمين - اضبط `defaultAccount` أو مرر `--account <id>`.
- لا تُعامل كتلة `channels.matrix.*` ذات المستوى الأعلى كحساب `default` الضمني إلا عندما تكون مصادقتها مكتملة (`homeserver` + `accessToken`، أو `homeserver` + `userId` + `password`). تبقى الحسابات المسماة قابلة للاكتشاف من `homeserver` + `userId` بمجرد أن تغطي بيانات الاعتماد المخزنة مؤقتا المصادقة.

**الترقية:**

- عندما يرقّي OpenClaw إعدادا ذا حساب واحد إلى إعداد متعدد الحسابات أثناء الإصلاح أو الإعداد، فإنه يحافظ على الحساب المسمى الموجود إذا كان موجودا أو كان `defaultAccount` يشير بالفعل إلى أحد الحسابات. تنتقل فقط مفاتيح مصادقة/تمهيد Matrix إلى الحساب المرقّى؛ وتبقى مفاتيح سياسة التسليم المشتركة في المستوى الأعلى.

راجع [مرجع الإعدادات](/ar/gateway/config-channels#multi-account-all-channels) لمعرفة النمط المشترك متعدد الحسابات.

## خوادم homeserver الخاصة/الشبكات المحلية

افتراضيا، يحظر OpenClaw خوادم Matrix homeserver الخاصة/الداخلية للحماية من SSRF ما لم
تفعّل ذلك صراحة لكل حساب.

إذا كان خادم homeserver لديك يعمل على localhost، أو عنوان IP على LAN/Tailscale، أو اسم مضيف داخلي، ففعّل
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

لا يسمح هذا التفعيل إلا بالأهداف الخاصة/الداخلية الموثوقة. تظل خوادم homeserver العامة غير المشفرة مثل
`http://matrix.example.org:8008` محظورة. فضّل `https://` كلما أمكن.

## تمرير حركة Matrix عبر وكيل

إذا كان نشر Matrix لديك يحتاج إلى وكيل HTTP(S) صادر صريح، فاضبط `channels.matrix.proxy`:

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

يمكن للحسابات المسماة تجاوز القيمة الافتراضية ذات المستوى الأعلى باستخدام `channels.matrix.accounts.<id>.proxy`.
يستخدم OpenClaw إعداد الوكيل نفسه لحركة Matrix وقت التشغيل وعمليات فحص حالة الحساب.

## حل الهدف

يقبل Matrix صيغ الأهداف هذه في أي مكان يطلب فيه OpenClaw هدف غرفة أو مستخدم:

- المستخدمون: `@user:server`، أو `user:@user:server`، أو `matrix:user:@user:server`
- الغرف: `!room:server`، أو `room:!room:server`، أو `matrix:room:!room:server`
- الأسماء المستعارة: `#alias:server`، أو `channel:#alias:server`، أو `matrix:channel:#alias:server`

معرّفات غرف Matrix حساسة لحالة الأحرف. استخدم حالة الأحرف الدقيقة لمعرّف الغرفة من Matrix
عند ضبط أهداف التسليم الصريحة، أو مهام cron، أو الارتباطات، أو قوائم السماح.
يحافظ OpenClaw على مفاتيح الجلسات الداخلية بصيغة معيارية للتخزين، لذلك لا تكون تلك المفاتيح
الصغيرة مصدرا موثوقا لمعرّفات تسليم Matrix.

يستخدم البحث المباشر في الدليل حساب Matrix الذي تم تسجيل الدخول به:

- تستعلم عمليات البحث عن المستخدمين من دليل مستخدمي Matrix على ذلك الخادم homeserver.
- تقبل عمليات البحث عن الغرف معرّفات الغرف الصريحة والأسماء المستعارة مباشرة. البحث عن اسم غرفة منضمة يتم على أساس أفضل جهد، ولا ينطبق إلا على قوائم السماح للغرف وقت التشغيل عندما يكون `dangerouslyAllowNameMatching: true` مضبوطا.
- إذا تعذر حل اسم غرفة إلى معرّف أو اسم مستعار، يتم تجاهله في حل قائمة السماح وقت التشغيل.

## مرجع الإعدادات

تقبل حقول المستخدمين بنمط قائمة السماح (`groupAllowFrom`، و`dm.allowFrom`، و`groups.<room>.users`) معرّفات مستخدمي Matrix الكاملة (الأكثر أمانا). يتم تجاهل إدخالات المستخدمين غير المعرّفة افتراضيا. إذا ضبطت `dangerouslyAllowNameMatching: true`، فسيتم حل التطابقات الدقيقة لأسماء العرض في دليل Matrix عند بدء التشغيل وكلما تغيرت قائمة السماح أثناء تشغيل المراقب؛ ويتم تجاهل الإدخالات التي لا يمكن حلها وقت التشغيل.

ينبغي أن تكون مفاتيح قائمة السماح للغرف (`groups`، و`rooms` القديم) معرّفات غرف أو أسماء مستعارة. يتم تجاهل مفاتيح أسماء الغرف الصريحة افتراضيا؛ يعيد `dangerouslyAllowNameMatching: true` تمكين البحث بأفضل جهد مقابل أسماء الغرف المنضمة.

### الحساب والاتصال

- `enabled`: تمكين القناة أو تعطيلها.
- `name`: تسمية عرض اختيارية للحساب.
- `defaultAccount`: معرّف الحساب المفضل عندما يتم ضبط عدة حسابات Matrix.
- `accounts`: تجاوزات مسماة لكل حساب. تُورث قيم `channels.matrix` ذات المستوى الأعلى كقيم افتراضية.
- `homeserver`: عنوان URL لخادم homeserver، على سبيل المثال `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: السماح لهذا الحساب بالاتصال بـ `localhost`، أو عناوين IP على LAN/Tailscale، أو أسماء المضيفين الداخلية.
- `proxy`: عنوان URL اختياري لوكيل HTTP(S) لحركة Matrix. يدعم التجاوز لكل حساب.
- `userId`: معرّف مستخدم Matrix الكامل (`@bot:example.org`).
- `accessToken`: رمز وصول للمصادقة المعتمدة على الرمز. القيم النصية الصريحة وقيم SecretRef مدعومة عبر مزودي env/file/exec ([إدارة الأسرار](/ar/gateway/secrets)).
- `password`: كلمة مرور لتسجيل الدخول المعتمد على كلمة المرور. القيم النصية الصريحة وقيم SecretRef مدعومة.
- `deviceId`: معرّف جهاز Matrix صريح.
- `deviceName`: اسم عرض الجهاز المستخدم وقت تسجيل الدخول بكلمة المرور.
- `avatarUrl`: عنوان URL لصورة الملف الشخصي الذاتية المخزنة لمزامنة الملف الشخصي وتحديثات `profile set`.
- `initialSyncLimit`: الحد الأقصى لعدد الأحداث التي يتم جلبها أثناء مزامنة بدء التشغيل.

### التشفير

- `encryption`: تمكين E2EE. الافتراضي: `false`.
- `startupVerification`: `"if-unverified"` (الافتراضي عند تشغيل E2EE) أو `"off"`. يطلب التحقق الذاتي تلقائيا عند بدء التشغيل عندما يكون هذا الجهاز غير موثق.
- `startupVerificationCooldownHours`: فترة التهدئة قبل طلب بدء التشغيل التلقائي التالي. الافتراضي: `24`.

### الوصول والسياسة

- `groupPolicy`: `"open"`، أو `"allowlist"`، أو `"disabled"`. الافتراضي: `"allowlist"`.
- `groupAllowFrom`: قائمة سماح لمعرّفات المستخدمين لحركة الغرف.
- `dm.enabled`: عندما تكون `false`، تجاهل جميع الرسائل المباشرة. الافتراضي: `true`.
- `dm.policy`: `"pairing"` (الافتراضي)، أو `"allowlist"`، أو `"open"`، أو `"disabled"`. تُطبق بعد أن ينضم البوت ويصنف الغرفة كرسالة مباشرة؛ ولا تؤثر في معالجة الدعوات.
- `dm.allowFrom`: قائمة سماح لمعرّفات المستخدمين لحركة الرسائل المباشرة.
- `dm.sessionScope`: `"per-user"` (الافتراضي) أو `"per-room"`.
- `dm.threadReplies`: تجاوز خاص بالرسائل المباشرة لتسلسل الردود (`"off"`، أو `"inbound"`، أو `"always"`).
- `allowBots`: قبول الرسائل من حسابات بوت Matrix الأخرى المضبوطة (`true` أو `"mentions"`).
- `allowlistOnly`: عندما تكون `true`، تفرض على جميع سياسات الرسائل المباشرة النشطة (باستثناء `"disabled"`) وسياسات المجموعات `"open"` أن تصبح `"allowlist"`. لا تغير سياسات `"disabled"`.
- `dangerouslyAllowNameMatching`: عندما تكون `true`، تسمح بالبحث في دليل أسماء عرض Matrix لإدخالات قائمة سماح المستخدمين، وبالبحث عن أسماء الغرف المنضمة لمفاتيح قائمة سماح الغرف. فضّل معرّفات `@user:server` الكاملة ومعرّفات الغرف أو الأسماء المستعارة.
- `autoJoin`: `"always"`، أو `"allowlist"`، أو `"off"`. الافتراضي: `"off"`. ينطبق على كل دعوة Matrix، بما في ذلك الدعوات ذات نمط الرسائل المباشرة.
- `autoJoinAllowlist`: الغرف/الأسماء المستعارة المسموح بها عندما يكون `autoJoin` هو `"allowlist"`. يتم حل إدخالات الأسماء المستعارة مقابل خادم homeserver، وليس مقابل الحالة التي تدعيها الغرفة الداعية.
- `contextVisibility`: رؤية سياق تكميلية (الافتراضي `"all"`، أو `"allowlist"`، أو `"allowlist_quote"`).

### سلوك الرد

- `replyToMode`: `"off"`، أو `"first"`، أو `"all"`، أو `"batched"`.
- `threadReplies`: `"off"`، أو `"inbound"`، أو `"always"`.
- `threadBindings`: تجاوزات لكل قناة لتوجيه الجلسات المرتبطة بالسلاسل ودورة حياتها.
- `streaming`: `"off"` (الافتراضي)، أو `"partial"`، أو `"quiet"`، أو صيغة كائن `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`، و`false` ↔ `"off"`.
- `blockStreaming`: عندما تكون `true`، يتم الاحتفاظ بكتل المساعد المكتملة كرسائل تقدم منفصلة.
- `markdown`: إعداد عرض Markdown اختياري للنص الصادر.
- `responsePrefix`: سلسلة اختيارية تضاف إلى بداية الردود الصادرة.
- `textChunkLimit`: حجم الجزء الصادر بالأحرف عندما يكون `chunkMode: "length"`. الافتراضي: `4000`.
- `chunkMode`: `"length"` (الافتراضي، يقسم حسب عدد الأحرف) أو `"newline"` (يقسم عند حدود الأسطر).
- `historyLimit`: عدد رسائل الغرفة الحديثة المضمنة كـ `InboundHistory` عندما تؤدي رسالة غرفة إلى تشغيل الوكيل. يرجع إلى `messages.groupChat.historyLimit`؛ الافتراضي الفعلي `0` (معطل).
- `mediaMaxMb`: حد حجم الوسائط بالميغابايت للإرسال الصادر والمعالجة الواردة.

### إعدادات التفاعلات

- `ackReaction`: تجاوز تفاعل الإقرار لهذه القناة/الحساب.
- `ackReactionScope`: تجاوز النطاق (الافتراضي `"group-mentions"`، أو `"group-all"`، أو `"direct"`، أو `"all"`، أو `"none"`، أو `"off"`).
- `reactionNotifications`: وضع إشعارات التفاعلات الواردة (الافتراضي `"own"`، أو `"off"`).

### الأدوات والتجاوزات لكل غرفة

- `actions`: حوكمة الأدوات لكل إجراء (`messages`، و`reactions`، و`pins`، و`profile`، و`memberInfo`، و`channelInfo`، و`verification`).
- `groups`: خريطة سياسات لكل غرفة. تستخدم هوية الجلسة معرّف الغرفة المستقر بعد الحل. (`rooms` اسم مستعار قديم.)
  - `groups.<room>.account`: تقييد إدخال غرفة موروث واحد إلى حساب محدد.
  - `groups.<room>.allowBots`: تجاوز لكل غرفة لإعداد مستوى القناة (`true` أو `"mentions"`).
  - `groups.<room>.users`: قائمة سماح لمرسلي الغرفة.
  - `groups.<room>.tools`: تجاوزات السماح/الرفض للأدوات لكل غرفة.
  - `groups.<room>.autoReply`: تجاوز لكل غرفة لحوكمة الإشارات. يعطل `true` متطلبات الإشارة لتلك الغرفة؛ ويجبرها `false` على العمل مجددا.
  - `groups.<room>.skills`: مرشح Skill لكل غرفة.
  - `groups.<room>.systemPrompt`: مقتطف موجّه نظام لكل غرفة.

### إعدادات موافقة exec

- `execApprovals.enabled`: تسليم موافقات exec عبر مطالبات Matrix الأصلية.
- `execApprovals.approvers`: معرّفات مستخدمي Matrix المسموح لهم بالموافقة. يرجع إلى `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (الافتراضي)، أو `"channel"`، أو `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: قوائم سماح اختيارية للوكيل/الجلسة من أجل التسليم.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) - كل القنوات المدعومة
- [الاقتران](/ar/channels/pairing) - مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) - سلوك محادثات المجموعات وحوكمة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) - توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) - نموذج الوصول والتقوية
