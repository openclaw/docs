---
read_when:
    - إعداد Matrix في OpenClaw
    - تكوين التشفير التام بين الطرفين والتحقّق في Matrix
summary: حالة دعم Matrix وإعداده وأمثلة التكوين
title: Matrix
x-i18n:
    generated_at: "2026-04-30T07:42:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261b0eaae452cff7bb9ddf8dc67ddda45fb27b6468e95450b19207348d0b577a
    source_path: channels/matrix.md
    workflow: 16
---

Matrix هو Plugin قناة مضمن في OpenClaw.
يستخدم `matrix-js-sdk` الرسمي ويدعم الرسائل المباشرة، والغرف، والسلاسل، والوسائط، والتفاعلات، والاستطلاعات، والموقع، وE2EE.

## Plugin المضمن

تأتي إصدارات OpenClaw الحالية المعبأة مع Plugin Matrix مضمنا. لا تحتاج إلى تثبيت أي شيء؛ تهيئة `channels.matrix.*` (راجع [الإعداد](#setup)) هي ما يفعله.

بالنسبة إلى الإصدارات الأقدم أو التثبيتات المخصصة التي تستثني Matrix، ثبّت حزمة npm حالية
عند نشر واحدة:

```bash
openclaw plugins install @openclaw/matrix
```

إذا أفاد npm بأن الحزمة المملوكة لـ OpenClaw مهملة، فاستخدم إصدار OpenClaw
معبأ حاليا أو نسخة محلية إلى أن يتم نشر حزمة npm أحدث.

من نسخة محلية:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

يسجل `plugins install` الـ Plugin ويفعله، لذلك لا حاجة إلى خطوة `openclaw plugins enable matrix` منفصلة. لا يزال الـ Plugin لا يفعل شيئا حتى تهيئ القناة أدناه. راجع [Plugins](/ar/tools/plugin) لمعرفة سلوك الـ Plugin العام وقواعد التثبيت.

## الإعداد

1. أنشئ حساب Matrix على خادمك المنزلي.
2. هيئ `channels.matrix` إما باستخدام `homeserver` + `accessToken`، أو `homeserver` + `userId` + `password`.
3. أعد تشغيل الـ Gateway.
4. ابدأ رسالة مباشرة مع البوت، أو ادعه إلى غرفة (راجع [الانضمام التلقائي](#auto-join) — الدعوات الجديدة لا تصل إلا عندما يسمح بها `autoJoin`).

### الإعداد التفاعلي

```bash
openclaw channels add
openclaw configure --section channels
```

يسأل المعالج عن: عنوان URL للخادم المنزلي، وطريقة المصادقة (رمز وصول أو كلمة مرور)، ومعرف المستخدم (لمصادقة كلمة المرور فقط)، واسم جهاز اختياري، وما إذا كان يجب تفعيل E2EE، وما إذا كان يجب تهيئة الوصول إلى الغرف والانضمام التلقائي.

إذا كانت متغيرات البيئة المطابقة `MATRIX_*` موجودة مسبقا ولم يكن للحساب المحدد مصادقة محفوظة، يعرض المعالج اختصارا عبر متغيرات البيئة. لحل أسماء الغرف قبل حفظ قائمة السماح، شغّل `openclaw channels resolve --channel matrix "Project Room"`. عند تفعيل E2EE، يكتب المعالج التهيئة ويشغّل نفس التمهيد مثل [`openclaw matrix encryption setup`](#encryption-and-verification).

### تهيئة دنيا

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

باستخدام كلمة المرور (يتم تخزين الرمز مؤقتا بعد أول تسجيل دخول):

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

القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`. مع القيمة الافتراضية، لن يظهر البوت في غرف أو رسائل مباشرة جديدة من دعوات حديثة حتى تنضم يدويا.

لا يستطيع OpenClaw أن يعرف وقت الدعوة ما إذا كانت الغرفة المدعو إليها رسالة مباشرة أم مجموعة، لذلك تمر كل الدعوات — بما في ذلك الدعوات ذات نمط الرسائل المباشرة — عبر `autoJoin` أولا. لا يطبق `dm.policy` إلا لاحقا، بعد أن ينضم البوت وتتم تصنيف الغرفة.

<Warning>
عيّن `autoJoin: "allowlist"` مع `autoJoinAllowlist` لتقييد الدعوات التي يقبلها البوت، أو `autoJoin: "always"` لقبول كل دعوة.

لا يقبل `autoJoinAllowlist` إلا أهدافا مستقرة: `!roomId:server`، أو `#alias:server`، أو `*`. يتم رفض أسماء الغرف النصية العادية؛ ويتم حل إدخالات الاسم البديل مقابل الخادم المنزلي، لا مقابل الحالة التي تدعيها الغرفة المدعو إليها.
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

من الأفضل ملء قوائم السماح للرسائل المباشرة والغرف بمعرفات مستقرة:

- الرسائل المباشرة (`dm.allowFrom`، `groupAllowFrom`، `groups.<room>.users`): استخدم `@user:server`. لا يتم حل أسماء العرض إلا عندما يعيد دليل الخادم المنزلي تطابقا واحدا بالضبط.
- الغرف (`groups`، `autoJoinAllowlist`): استخدم `!room:server` أو `#alias:server`. يتم حل الأسماء بأفضل جهد مقابل الغرف التي تم الانضمام إليها؛ ويتم تجاهل الإدخالات غير المحلولة في وقت التشغيل.

### تطبيع معرف الحساب

يحوّل المعالج اسما ودودا إلى معرف حساب مطبع. على سبيل المثال، يصبح `Ops Bot` هو `ops-bot`. يتم تهريب علامات الترقيم في أسماء متغيرات البيئة ذات النطاق بحيث لا يمكن أن يتصادم حسابان: `-` ← `_X2D_`، لذلك يتم تعيين `ops-prod` إلى `MATRIX_OPS_X2D_PROD_*`.

### بيانات الاعتماد المخزنة مؤقتا

يخزن Matrix بيانات الاعتماد المخزنة مؤقتا تحت `~/.openclaw/credentials/matrix/`:

- الحساب الافتراضي: `credentials.json`
- الحسابات المسماة: `credentials-<account>.json`

عند وجود بيانات اعتماد مخزنة مؤقتا هناك، يتعامل OpenClaw مع Matrix على أنه مهيأ حتى إذا لم يكن رمز الوصول في ملف التهيئة — ويغطي ذلك الإعداد، و`openclaw doctor`، وفحوصات حالة القناة.

### متغيرات البيئة

تستخدم عندما لا يكون مفتاح التهيئة المكافئ مضبوطا. يستخدم الحساب الافتراضي أسماء غير مسبوقة؛ وتستخدم الحسابات المسماة معرف الحساب مدرجا قبل اللاحقة.

| الحساب الافتراضي       | الحساب المسمى (`<ID>` هو معرف الحساب المطبع) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

للحساب `ops`، تصبح الأسماء `MATRIX_OPS_HOMESERVER`، و`MATRIX_OPS_ACCESS_TOKEN`، وهكذا. تقرأ تدفقات CLI المدركة للاسترداد (`verify backup restore`، و`verify device`، و`verify bootstrap`) متغيرات بيئة مفتاح الاسترداد عندما تمرر المفتاح عبر `--recovery-key-stdin`.

لا يمكن ضبط `MATRIX_HOMESERVER` من ملف `.env` لمساحة العمل؛ راجع [ملفات `.env` لمساحة العمل](/ar/gateway/security).

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

بث ردود Matrix اختياري. يتحكم `streaming` في كيفية تسليم OpenClaw لرد المساعد قيد التنفيذ؛ ويتحكم `blockStreaming` في ما إذا كان يتم الحفاظ على كل كتلة مكتملة كرسالة Matrix خاصة بها.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

للاحتفاظ بمعاينات الإجابة الحية مع إخفاء أسطر الأدوات/التقدم المؤقتة، استخدم صيغة
الكائن:

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
| `"off"` (افتراضي) | انتظر الرد الكامل، ثم أرسله مرة واحدة. `true` ↔ `"partial"`، و`false` ↔ `"off"`.                                                                                        |
| `"partial"`       | عدّل رسالة نصية عادية واحدة في مكانها بينما يكتب النموذج الكتلة الحالية. قد تنبه عملاء Matrix الافتراضيون عند المعاينة الأولى، لا عند التعديل النهائي.              |
| `"quiet"`         | مثل `"partial"` لكن الرسالة إشعار غير منبه. لا يتلقى المستلمون إشعارا إلا عندما تطابق قاعدة دفع لكل مستخدم التعديل النهائي (راجع أدناه). |

`blockStreaming` مستقل عن `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (افتراضي)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | مسودة حية للكتلة الحالية، مع إبقاء الكتل المكتملة كرسائل | مسودة حية للكتلة الحالية، ويتم إنهاؤها في مكانها |
| `"off"`                 | رسالة Matrix منبهة واحدة لكل كتلة مكتملة                     | رسالة Matrix منبهة واحدة للرد الكامل      |

ملاحظات:

- إذا تجاوزت معاينة حد حجم الحدث الواحد في Matrix، يوقف OpenClaw بث المعاينة ويتراجع إلى التسليم النهائي فقط.
- ترسل ردود الوسائط المرفقات بشكل طبيعي دائما. إذا لم تعد معاينة قديمة قابلة لإعادة الاستخدام بأمان، ينقحها OpenClaw قبل إرسال رد الوسائط النهائي.
- يتم تفعيل تحديثات معاينة تقدم الأدوات افتراضيا عندما يكون بث معاينة Matrix نشطا. عيّن `streaming.preview.toolProgress: false` للاحتفاظ بتعديلات المعاينة لنص الإجابة مع ترك تقدم الأدوات على مسار التسليم العادي.
- تكلف تعديلات المعاينة استدعاءات Matrix API إضافية. اترك `streaming: "off"` إذا كنت تريد ملف حدود معدل الاستخدام الأكثر تحفظا.

## بيانات تعريف الموافقة

مطالبات الموافقة الأصلية في Matrix هي أحداث `m.room.message` عادية مع محتوى حدث مخصص خاص بـ OpenClaw تحت `com.openclaw.approval`. يسمح Matrix بمفاتيح محتوى حدث مخصصة، لذلك لا يزال العملاء الافتراضيون يعرضون متن النص بينما يمكن للعملاء المدركين لـ OpenClaw قراءة معرف الموافقة المنظم، والنوع، والحالة، والقرارات المتاحة، وتفاصيل التنفيذ/Plugin.

عندما تكون مطالبة الموافقة طويلة جدا لحدث Matrix واحد، يجزئ OpenClaw النص المرئي ويرفق `com.openclaw.approval` بالجزء الأول فقط. تكون تفاعلات قرارات السماح/الرفض مرتبطة بذلك الحدث الأول، لذلك تحتفظ المطالبات الطويلة بنفس هدف الموافقة مثل المطالبات ذات الحدث الواحد.

### قواعد الدفع ذاتية الاستضافة للمعاينات النهائية الهادئة

لا يرسل `streaming: "quiet"` إشعارا إلى المستلمين إلا بعد إنهاء كتلة أو دورة — يجب أن تطابق قاعدة دفع لكل مستخدم علامة المعاينة النهائية. راجع [قواعد دفع Matrix للمعاينات الهادئة](/ar/channels/matrix-push-rules) للوصفة الكاملة (رمز المستلم، وفحص الدافع، وتثبيت القاعدة، وملاحظات لكل خادم منزلي).

## غرف من بوت إلى بوت

افتراضيا، يتم تجاهل رسائل Matrix الواردة من حسابات OpenClaw Matrix الأخرى المهيأة.

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

- يقبل `allowBots: true` الرسائل من حسابات بوت Matrix مهيأة أخرى في الغرف والرسائل المباشرة المسموح بها.
- يقبل `allowBots: "mentions"` تلك الرسائل فقط عندما تذكر هذا البوت بوضوح في الغرف. تظل الرسائل المباشرة مسموحة.
- يتجاوز `groups.<room>.allowBots` إعداد مستوى الحساب لغرفة واحدة.
- لا يزال OpenClaw يتجاهل الرسائل من نفس معرف مستخدم Matrix لتجنب حلقات الرد الذاتي.
- لا يكشف Matrix هنا عن علامة بوت أصلية؛ يتعامل OpenClaw مع "المؤلف بواسطة بوت" على أنه "مرسل بواسطة حساب Matrix مهيأ آخر على OpenClaw gateway هذا".

استخدم قوائم سماح صارمة للغرف ومتطلبات الذكر عند تفعيل حركة البوت إلى البوت في الغرف المشتركة.

## التشفير والتحقق

في الغرف المشفّرة (E2EE)، تستخدم أحداث الصور الصادرة `thumbnail_file` لكي تُشفَّر معاينات الصور مع المرفق الكامل. أما الغرف غير المشفّرة فما زالت تستخدم `thumbnail_url` العادي. لا يلزم أي إعداد — يكتشف Plugin حالة E2EE تلقائيًا.

تقبل جميع أوامر `openclaw matrix` الخيارات `--verbose` (تشخيصات كاملة)، و`--json` (مخرجات قابلة للقراءة آليًا)، و`--account <id>` (إعدادات متعددة الحسابات). تكون المخرجات موجزة افتراضيًا مع تسجيل SDK داخلي هادئ. توضّح الأمثلة أدناه الصيغة المعتمدة؛ أضف العلامات حسب الحاجة.

### تفعيل التشفير

```bash
openclaw matrix encryption setup
```

يمهّد تخزين الأسرار والتوقيع المتبادل، وينشئ نسخة احتياطية لمفاتيح الغرف إذا لزم الأمر، ثم يطبع الحالة والخطوات التالية. علامات مفيدة:

- `--recovery-key <key>` طبّق مفتاح استرداد قبل التمهيد (يفضّل استخدام صيغة stdin الموثّقة أدناه)
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

### إشارات الحالة والثقة

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

يعرض `verify status` ثلاث إشارات ثقة مستقلة (`--verbose` يعرضها كلها):

- `Locally trusted`: موثوق به من هذا العميل فقط
- `Cross-signing verified`: يبلّغ SDK عن التحقق عبر التوقيع المتبادل
- `Signed by owner`: موقّع بمفتاح التوقيع الذاتي الخاص بك (للتشخيص فقط)

تصبح `Verified by owner` بقيمة `yes` فقط عندما تكون `Cross-signing verified` بقيمة `yes`. الثقة المحلية أو توقيع المالك وحده لا يكفي.

يعيد `--allow-degraded-local-state` تشخيصات بأفضل جهد دون تجهيز حساب Matrix أولًا؛ مفيد للفحوصات دون اتصال أو المهيأة جزئيًا.

### التحقق من هذا الجهاز باستخدام مفتاح استرداد

مفتاح الاسترداد حساس — مرّره عبر stdin بدلًا من تمريره في سطر الأوامر. اضبط `MATRIX_RECOVERY_KEY` (أو `MATRIX_<ID>_RECOVERY_KEY` لحساب مسمّى):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

يعرض الأمر ثلاث حالات:

- `Recovery key accepted`: قبل Matrix المفتاح لتخزين الأسرار أو ثقة الجهاز.
- `Backup usable`: يمكن تحميل النسخة الاحتياطية لمفاتيح الغرف باستخدام مادة الاسترداد الموثوقة.
- `Device verified by owner`: لدى هذا الجهاز ثقة كاملة بهوية التوقيع المتبادل في Matrix.

يخرج برمز غير صفري عندما تكون ثقة الهوية الكاملة غير مكتملة، حتى إذا فتح مفتاح الاسترداد مواد النسخ الاحتياطي. في هذه الحالة، أكمِل التحقق الذاتي من عميل Matrix آخر:

```bash
openclaw matrix verify self
```

ينتظر `verify self` ظهور `Cross-signing verified: yes` قبل أن يخرج بنجاح. استخدم `--timeout-ms <ms>` لضبط مدة الانتظار.

صيغة المفتاح الحرفية `openclaw matrix verify device "<recovery-key>"` مقبولة أيضًا، لكن المفتاح سينتهي به الأمر في سجل الصدفة لديك.

### تمهيد التوقيع المتبادل أو إصلاحه

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` هو أمر الإصلاح والإعداد للحسابات المشفّرة. بالترتيب، يقوم بما يلي:

- يمهّد تخزين الأسرار، مع إعادة استخدام مفتاح استرداد موجود عند الإمكان
- يمهّد التوقيع المتبادل ويرفع المفاتيح العامة الناقصة
- يعلّم الجهاز الحالي ويوقّعه توقيعًا متبادلًا
- ينشئ نسخة احتياطية لمفاتيح الغرف على الخادم إذا لم تكن موجودة بالفعل

إذا كان خادم المنازل يتطلب UIA لرفع مفاتيح التوقيع المتبادل، يحاول OpenClaw أولًا بلا مصادقة، ثم `m.login.dummy`، ثم `m.login.password` (يتطلب `channels.matrix.password`).

علامات مفيدة:

- `--recovery-key-stdin` (استخدمها مع `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) أو `--recovery-key <key>`
- `--force-reset-cross-signing` لتجاهل هوية التوقيع المتبادل الحالية (عمدًا فقط)

### النسخ الاحتياطي لمفاتيح الغرف

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

يعرض `backup status` ما إذا كانت نسخة احتياطية على الخادم موجودة وما إذا كان هذا الجهاز يستطيع فك تشفيرها. يستورد `backup restore` مفاتيح الغرف المنسوخة احتياطيًا إلى مخزن التشفير المحلي؛ إذا كان مفتاح الاسترداد موجودًا بالفعل على القرص، يمكنك حذف `--recovery-key-stdin`.

لاستبدال نسخة احتياطية معطوبة بخط أساس جديد (يقبل فقدان السجل القديم غير القابل للاسترداد؛ ويمكنه أيضًا إعادة إنشاء تخزين الأسرار إذا كان سر النسخة الاحتياطية الحالي غير قابل للتحميل):

```bash
openclaw matrix verify backup reset --yes
```

أضف `--rotate-recovery-key` فقط عندما تريد عمدًا أن يتوقف مفتاح الاسترداد السابق عن فتح خط أساس النسخة الاحتياطية الجديد.

### سرد عمليات التحقق وطلبها والرد عليها

```bash
openclaw matrix verify list
```

يسرد طلبات التحقق المعلّقة للحساب المحدد.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

يرسل طلب تحقق من حساب OpenClaw هذا. يطلب `--own-user` التحقق الذاتي (تقبل المطالبة في عميل Matrix آخر للمستخدم نفسه)؛ بينما تستهدف `--user-id`/`--device-id`/`--room-id` شخصًا آخر. لا يمكن دمج `--own-user` مع علامات الاستهداف الأخرى.

لمعالجة دورة الحياة على مستوى أدنى — عادةً أثناء متابعة الطلبات الواردة من عميل آخر — تعمل هذه الأوامر على طلب محدد `<id>` (يطبعها `verify list` و`verify request`):

| الأمر                                      | الغرض                                                               |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | قبول طلب وارد                                                       |
| `openclaw matrix verify start <id>`        | بدء تدفق SAS                                                        |
| `openclaw matrix verify sas <id>`          | طباعة رموز SAS التعبيرية أو الأرقام العشرية                         |
| `openclaw matrix verify confirm-sas <id>`  | تأكيد أن SAS يطابق ما يعرضه العميل الآخر                            |
| `openclaw matrix verify mismatch-sas <id>` | رفض SAS عندما لا تتطابق الرموز التعبيرية أو الأرقام العشرية          |
| `openclaw matrix verify cancel <id>`       | إلغاء؛ يقبل اختياريًا `--reason <text>` و`--code <matrix-code>`      |

تقبل كل من `accept`، و`start`، و`sas`، و`confirm-sas`، و`mismatch-sas`، و`cancel` الخيارين `--user-id` و`--room-id` كتلميحات متابعة DM عندما يكون التحقق مرتبطًا بغرفة رسائل مباشرة محددة.

### ملاحظات الحسابات المتعددة

دون `--account <id>`، تستخدم أوامر Matrix CLI الحساب الافتراضي الضمني. إذا كانت لديك عدة حسابات مسماة ولم تضبط `channels.matrix.defaultAccount`، فسترفض التخمين وتطلب منك الاختيار. عندما يكون E2EE معطلًا أو غير متاح لحساب مسمّى، تشير الأخطاء إلى مفتاح إعداد ذلك الحساب، مثل `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="سلوك بدء التشغيل">
    مع `encryption: true`، تكون القيمة الافتراضية لـ `startupVerification` هي `"if-unverified"`. عند بدء التشغيل، يطلب جهاز غير متحقق منه التحقق الذاتي في عميل Matrix آخر، مع تخطي التكرارات وتطبيق فترة تهدئة (24 ساعة افتراضيًا). اضبط ذلك باستخدام `startupVerificationCooldownHours` أو عطّله باستخدام `startupVerification: "off"`.

    يشغّل بدء التشغيل أيضًا تمريرة تمهيد تشفير محافظة تعيد استخدام تخزين الأسرار الحالي وهوية التوقيع المتبادل الحالية. إذا كانت حالة التمهيد معطوبة، يحاول OpenClaw إصلاحًا محروسًا حتى دون `channels.matrix.password`؛ وإذا كان خادم المنازل يتطلب UIA بكلمة مرور، يسجل بدء التشغيل تحذيرًا ويبقى غير قاتل. يتم الحفاظ على الأجهزة الموقّعة مسبقًا من المالك.

    راجع [ترحيل Matrix](/ar/channels/matrix-migration) لتدفق الترقية الكامل.

  </Accordion>

  <Accordion title="إشعارات التحقق">
    ينشر Matrix إشعارات دورة حياة التحقق في غرفة تحقق DM الصارمة كرسائل `m.notice`: الطلب، الجاهزية (مع إرشادات "التحقق بالرموز التعبيرية")، البدء/الإكمال، وتفاصيل SAS (الرموز التعبيرية/العشرية) عند توفرها.

    يتم تتبع الطلبات الواردة من عميل Matrix آخر وقبولها تلقائيًا. بالنسبة إلى التحقق الذاتي، يبدأ OpenClaw تدفق SAS تلقائيًا ويؤكد جانبه بمجرد توفر التحقق بالرموز التعبيرية — ما زلت بحاجة إلى المقارنة وتأكيد "إنها متطابقة" في عميل Matrix لديك.

    لا تُمرَّر إشعارات نظام التحقق إلى مسار محادثة الوكيل.

  </Accordion>

  <Accordion title="جهاز Matrix محذوف أو غير صالح">
    إذا قال `verify status` إن الجهاز الحالي لم يعد مدرجًا على خادم المنازل، فأنشئ جهاز OpenClaw Matrix جديدًا. لتسجيل الدخول بكلمة مرور:

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

  <Accordion title="نظافة الأجهزة">
    يمكن أن تتراكم الأجهزة القديمة المُدارة بواسطة OpenClaw. اسردها ونظّفها:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="مخزن التشفير">
    يستخدم Matrix E2EE مسار تشفير Rust الرسمي من `matrix-js-sdk` مع `fake-indexeddb` كطبقة توافق IndexedDB. تستمر حالة التشفير في `crypto-idb-snapshot.json` (بأذونات ملف مقيّدة).

    توجد حالة وقت التشغيل المشفّرة ضمن `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` وتشمل مخزن المزامنة، ومخزن التشفير، ومفتاح الاسترداد، ولقطة IDB، وروابط الخيوط، وحالة تحقق بدء التشغيل. عندما يتغير الرمز وتبقى هوية الحساب كما هي، يعيد OpenClaw استخدام أفضل جذر موجود لكي تبقى الحالة السابقة مرئية.

  </Accordion>
</AccordionGroup>

## إدارة الملف الشخصي

حدّث الملف الشخصي الذاتي في Matrix للحساب المحدد:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

يمكنك تمرير الخيارين في استدعاء واحد. يقبل Matrix عناوين URL للصور الرمزية بصيغة `mxc://` مباشرة؛ وعندما تمرر `http://` أو `https://`، يرفع OpenClaw الملف أولًا ويخزّن عنوان URL المحلول بصيغة `mxc://` في `channels.matrix.avatarUrl` (أو التجاوز الخاص بكل حساب).

## الخيوط

يدعم Matrix خيوط Matrix الأصلية لكل من الردود التلقائية وإرسالات أداة الرسائل. يتحكم مفتاحان مستقلان في السلوك:

### توجيه الجلسة (`sessionScope`)

يقرر `dm.sessionScope` كيف تُربط غرف DM في Matrix بجلسات OpenClaw:

- `"per-user"` (افتراضي): تشترك جميع غرف DM مع النظير الموجّه نفسه في جلسة واحدة.
- `"per-room"`: تحصل كل غرفة DM في Matrix على مفتاح جلستها الخاص، حتى عندما يكون النظير نفسه.

تتقدم روابط المحادثة الصريحة دائمًا على `sessionScope`، لذلك تحتفظ الغرف والخيوط المرتبطة بجلسة الهدف المختارة.

### الردود ضمن الخيوط (`threadReplies`)

يقرر `threadReplies` أين ينشر الروبوت رده:

- `"off"`: الردود على المستوى الأعلى. تبقى الرسائل الواردة ضمن الخيوط على الجلسة الأصلية.
- `"inbound"`: الرد داخل خيط فقط عندما تكون الرسالة الواردة موجودة بالفعل في ذلك الخيط.
- `"always"`: الرد داخل خيط متجذر عند الرسالة المشغّلة؛ وتُوجَّه تلك المحادثة عبر جلسة مطابقة مقيّدة بالخيط من أول تشغيل فصاعدًا.

يتجاوز `dm.threadReplies` هذا للرسائل المباشرة فقط — مثلًا، إبقاء خيوط الغرف معزولة مع إبقاء الرسائل المباشرة مسطحة.

### وراثة الخيوط وأوامر الشرطة المائلة

- تتضمن الرسائل الواردة ذات السلاسل رسالة جذر السلسلة كسياق إضافي للوكيل.
- ترث عمليات الإرسال عبر أداة الرسائل سلسلة Matrix الحالية تلقائيًا عند استهداف الغرفة نفسها (أو هدف مستخدم الرسالة المباشرة نفسه)، ما لم يتم توفير `threadId` صريح.
- لا تبدأ إعادة استخدام هدف مستخدم الرسائل المباشرة إلا عندما تثبت بيانات الجلسة الوصفية الحالية وجود الطرف نفسه في الرسائل المباشرة على حساب Matrix نفسه؛ وإلا يعود OpenClaw إلى التوجيه العادي ضمن نطاق المستخدم.
- تعمل أوامر `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` و`/acp spawn` المرتبط بسلسلة في غرف Matrix والرسائل المباشرة.
- ينشئ `/focus` على المستوى الأعلى سلسلة Matrix جديدة ويربطها بالجلسة المستهدفة عندما تكون `threadBindings.spawnSubagentSessions: true`.
- يؤدي تشغيل `/focus` أو `/acp spawn --thread here` داخل سلسلة Matrix موجودة إلى ربط تلك السلسلة في مكانها.

عندما يكتشف OpenClaw أن غرفة رسالة مباشرة في Matrix تتعارض مع غرفة رسالة مباشرة أخرى على الجلسة المشتركة نفسها، ينشر `m.notice` لمرة واحدة في تلك الغرفة يشير إلى مخرج `/focus` ويقترح تغيير `dm.sessionScope`. لا يظهر الإشعار إلا عند تمكين ارتباطات السلاسل.

## ارتباطات محادثات ACP

يمكن تحويل غرف Matrix والرسائل المباشرة وسلاسل Matrix الموجودة إلى مساحات عمل ACP دائمة من دون تغيير واجهة الدردشة.

مسار المشغّل السريع:

- شغّل `/acp spawn codex --bind here` داخل رسالة Matrix المباشرة أو الغرفة أو السلسلة الموجودة التي تريد مواصلة استخدامها.
- في رسالة Matrix مباشرة أو غرفة على المستوى الأعلى، تبقى الرسالة المباشرة/الغرفة الحالية واجهة الدردشة وتُوجَّه الرسائل المستقبلية إلى جلسة ACP المنشأة.
- داخل سلسلة Matrix موجودة، يربط `--bind here` تلك السلسلة الحالية في مكانها.
- يعيد `/new` و`/reset` ضبط جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الارتباط.

ملاحظات:

- لا ينشئ `--bind here` سلسلة Matrix فرعية.
- لا يكون `threadBindings.spawnAcpSessions` مطلوبًا إلا من أجل `/acp spawn --thread auto|here`، حيث يحتاج OpenClaw إلى إنشاء سلسلة Matrix فرعية أو ربطها.

### إعداد ارتباط السلاسل

يرث Matrix الإعدادات الافتراضية العامة من `session.threadBindings`، ويدعم أيضًا التجاوزات لكل قناة:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

علامات الإنشاء المرتبطة بسلاسل Matrix اختيارية التمكين:

- اضبط `threadBindings.spawnSubagentSessions: true` للسماح لـ`/focus` على المستوى الأعلى بإنشاء سلاسل Matrix جديدة وربطها.
- اضبط `threadBindings.spawnAcpSessions: true` للسماح لـ`/acp spawn --thread auto|here` بربط جلسات ACP بسلاسل Matrix.

## التفاعلات

يدعم Matrix التفاعلات الصادرة وإشعارات التفاعلات الواردة وتفاعلات الإقرار.

تتحكم `channels.matrix.actions.reactions` في أدوات التفاعل الصادرة:

- يضيف `react` تفاعلًا إلى حدث Matrix.
- يسرد `reactions` ملخص التفاعلات الحالي لحدث Matrix.
- يزيل `emoji=""` تفاعلات الروبوت نفسه على ذلك الحدث.
- يزيل `remove: true` تفاعل الرمز التعبيري المحدد فقط من الروبوت.

**ترتيب التحديد** (تفوز أول قيمة معرّفة):

| الإعداد                 | الترتيب                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | لكل حساب → القناة → `messages.ackReaction` → رجوع احتياطي إلى رمز تعبيري لهوية الوكيل   |
| `ackReactionScope`      | لكل حساب → القناة → `messages.ackReactionScope` → الافتراضي `"group-mentions"` |
| `reactionNotifications` | لكل حساب → القناة → الافتراضي `"own"`                                          |

يعيد `reactionNotifications: "own"` توجيه أحداث `m.reaction` المضافة عندما تستهدف رسائل Matrix كتبها الروبوت؛ ويعطّل `"off"` أحداث نظام التفاعل. لا تُنشأ أحداث نظام من عمليات إزالة التفاعل لأن Matrix يعرضها كتنقيحات، وليس كإزالات مستقلة لـ`m.reaction`.

## سياق السجل

- يتحكم `channels.matrix.historyLimit` في عدد رسائل الغرفة الحديثة التي تُضمّن كـ`InboundHistory` عندما تشغّل رسالة غرفة Matrix الوكيل. يعود إلى `messages.groupChat.historyLimit`؛ وإذا لم يُضبط أي منهما، فالقيمة الافتراضية الفعلية هي `0`. اضبطه على `0` للتعطيل.
- سجل غرف Matrix خاص بالغرف فقط. تواصل الرسائل المباشرة استخدام سجل الجلسة العادي.
- سجل غرف Matrix معلّق فقط: يخزن OpenClaw رسائل الغرفة التي لم تشغّل ردًا بعد، ثم يلتقط لقطة لتلك النافذة عند وصول إشارة ذكر أو مشغّل آخر.
- لا تُضمّن رسالة المشغّل الحالية في `InboundHistory`؛ بل تبقى في متن الوارد الرئيسي لذلك الدور.
- تعيد محاولات حدث Matrix نفسه استخدام لقطة السجل الأصلية بدل الانزياح إلى رسائل غرفة أحدث.

## رؤية السياق

يدعم Matrix عنصر التحكم المشترك `contextVisibility` لسياق الغرفة التكميلي مثل نص الرد المجلب وجذور السلاسل والسجل المعلّق.

- `contextVisibility: "all"` هو الافتراضي. يُحفظ السياق التكميلي كما ورد.
- يرشّح `contextVisibility: "allowlist"` السياق التكميلي إلى المرسلين المسموح بهم من خلال فحوصات قائمة السماح النشطة للغرفة/المستخدم.
- يتصرف `contextVisibility: "allowlist_quote"` مثل `allowlist`، لكنه يبقي مع ذلك ردًا مقتبسًا صريحًا واحدًا.

يؤثر هذا الإعداد في رؤية السياق التكميلي، وليس في ما إذا كان يمكن للرسالة الواردة نفسها تشغيل رد.
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

راجع [المجموعات](/ar/channels/groups) لمعرفة سلوك حصر التشغيل بالذكر وقائمة السماح.

مثال إقران لرسائل Matrix المباشرة:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

إذا واصل مستخدم Matrix غير معتمد مراسلتك قبل الموافقة، يعيد OpenClaw استخدام رمز الإقران المعلّق نفسه وقد يرسل رد تذكير بعد فترة تهدئة قصيرة بدل إصدار رمز جديد.

راجع [الإقران](/ar/channels/pairing) لمعرفة مسار إقران الرسائل المباشرة المشترك وتخطيط التخزين.

## إصلاح الغرفة المباشرة

إذا انحرفت حالة الرسائل المباشرة عن التزامن، يمكن أن ينتهي OpenClaw بتعيينات `m.direct` قديمة تشير إلى غرف فردية قديمة بدل الرسالة المباشرة النشطة. افحص التعيين الحالي لطرف:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

أصلحه:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

يقبل كلا الأمرين `--account <id>` لإعدادات الحسابات المتعددة. مسار الإصلاح:

- يفضّل رسالة مباشرة صارمة 1:1 معينة مسبقًا في `m.direct`
- يعود إلى أي رسالة مباشرة صارمة 1:1 منضمة حاليًا مع ذلك المستخدم
- ينشئ غرفة مباشرة جديدة ويعيد كتابة `m.direct` إذا لم توجد رسالة مباشرة سليمة

لا يحذف الغرف القديمة تلقائيًا. يختار الرسالة المباشرة السليمة ويحدّث التعيين حتى تستهدف عمليات إرسال Matrix المستقبلية وإشعارات التحقق ومسارات الرسائل المباشرة الأخرى الغرفة الصحيحة.

## موافقات التنفيذ

يمكن لـMatrix أن يعمل كعميل موافقة أصلي. اضبطه ضمن `channels.matrix.execApprovals` (أو `channels.matrix.accounts.<account>.execApprovals` لتجاوز لكل حساب):

- `enabled`: يسلّم الموافقات عبر مطالبات Matrix الأصلية. عند عدم ضبطه أو عند ضبطه على `"auto"`، يفعّل Matrix نفسه تلقائيًا بمجرد إمكانية حلّ موافق واحد على الأقل. اضبطه على `false` للتعطيل صراحة.
- `approvers`: معرّفات مستخدمي Matrix (`@owner:example.org`) المسموح لهم بالموافقة على طلبات التنفيذ. اختياري — يعود إلى `channels.matrix.dm.allowFrom`.
- `target`: المكان الذي تذهب إليه المطالبات. يرسل `"dm"` (الافتراضي) إلى الرسائل المباشرة للموافقين؛ ويرسل `"channel"` إلى غرفة Matrix أو الرسالة المباشرة المنشئة؛ ويرسل `"both"` إلى الاثنين.
- `agentFilter` / `sessionFilter`: قوائم سماح اختيارية للوكلاء/الجلسات التي تشغّل التسليم عبر Matrix.

يختلف التفويض قليلًا بين أنواع الموافقة:

- تستخدم **موافقات التنفيذ** `execApprovals.approvers`، مع الرجوع إلى `dm.allowFrom`.
- تفوّض **موافقات Plugin** عبر `dm.allowFrom` فقط.

يشترك النوعان في اختصارات تفاعلات Matrix وتحديثات الرسائل. يرى الموافقون اختصارات التفاعل على رسالة الموافقة الأساسية:

- `✅` السماح مرة واحدة
- `❌` الرفض
- `♾️` السماح دائمًا (عندما تسمح سياسة التنفيذ الفعلية بذلك)

أوامر الشرطة المائلة الاحتياطية: `/approve <id> allow-once` و`/approve <id> allow-always` و`/approve <id> deny`.

يمكن للموافقين المحلولين فقط الموافقة أو الرفض. يتضمن التسليم إلى القناة لموافقات التنفيذ نص الأمر — لا تفعّل `channel` أو `both` إلا في الغرف الموثوقة.

ذو صلة: [موافقات التنفيذ](/ar/tools/exec-approvals).

## أوامر الشرطة المائلة

تعمل أوامر الشرطة المائلة (`/new` و`/reset` و`/model` و`/focus` و`/unfocus` و`/agents` و`/session` و`/acp` و`/approve` وغيرها) مباشرة في الرسائل المباشرة. في الغرف، يتعرف OpenClaw أيضًا على الأوامر المسبوقة بذكر Matrix الخاص بالروبوت نفسه، لذلك يشغّل `@bot:server /new` مسار الأمر من دون تعبير نمطي مخصص للذكر. يحافظ هذا على استجابة الروبوت للمنشورات بأسلوب الغرف `@mention /command` التي يصدرها Element والعملاء المشابهون عندما يكمل المستخدم اسم الروبوت عبر المفتاح Tab قبل كتابة الأمر.

ما زالت قواعد التفويض تنطبق: يجب أن يستوفي مرسلو الأوامر سياسات قائمة السماح/المالك نفسها الخاصة بالرسائل المباشرة أو الغرف مثل الرسائل العادية.

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
- اجعل إدخال غرفة موروثًا ضمن نطاق حساب محدد باستخدام `groups.<room>.account`. تُشارك الإدخالات التي لا تحتوي على `account` عبر الحسابات؛ وما زال `account: "default"` يعمل عندما يكون الحساب الافتراضي مضبوطًا على المستوى الأعلى.

**اختيار الحساب الافتراضي:**

- اضبط `defaultAccount` لاختيار الحساب المسمى الذي يفضله التوجيه والفحص وأوامر CLI الضمنية.
- إذا كانت لديك حسابات متعددة وكان أحدها اسمه حرفيًا `default`، يستخدمه OpenClaw ضمنيًا حتى عندما لا يكون `defaultAccount` مضبوطًا.
- إذا كانت لديك عدة حسابات مسماة ولم يتم اختيار افتراضي، ترفض أوامر CLI التخمين — اضبط `defaultAccount` أو مرر `--account <id>`.
- لا تُعامل كتلة `channels.matrix.*` على المستوى الأعلى كحساب `default` ضمني إلا عندما يكتمل تفويضها (`homeserver` + `accessToken`، أو `homeserver` + `userId` + `password`). تبقى الحسابات المسماة قابلة للاكتشاف من `homeserver` + `userId` بمجرد أن تغطي بيانات الاعتماد المخزنة مؤقتًا التفويض.

**الترقية:**

- عندما يرقّي OpenClaw إعداد حساب واحد إلى حسابات متعددة أثناء الإصلاح أو الإعداد، يحافظ على الحساب المسمى الموجود إذا وُجد أو كان `defaultAccount` يشير إلى حساب بالفعل. تنتقل مفاتيح تفويض/تمهيد Matrix فقط إلى الحساب المرقّى؛ وتبقى مفاتيح سياسة التسليم المشتركة على المستوى الأعلى.

راجع [مرجع الإعداد](/ar/gateway/config-channels#multi-account-all-channels) لمعرفة نمط الحسابات المتعددة المشترك.

## خوادم المنزل الخاصة/شبكة LAN

افتراضيًا، يحظر OpenClaw خوادم Matrix المنزلية الخاصة/الداخلية للحماية من SSRF ما لم
توافق صراحة لكل حساب.

إذا كان خادمك المنزلي يعمل على localhost أو عنوان IP على LAN/Tailscale أو اسم مضيف داخلي، فمكّن
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

يسمح هذا الاشتراك الاختياري فقط بالأهداف الخاصة/الداخلية الموثوقة. تظل خوادم Matrix المنزلية العامة غير المشفرة مثل
`http://matrix.example.org:8008` محظورة. يُفضّل استخدام `https://` كلما أمكن.

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

يمكن للحسابات المسمّاة تجاوز الإعداد الافتراضي الأعلى مستوى باستخدام `channels.matrix.accounts.<id>.proxy`.
يستخدم OpenClaw إعداد الوكيل نفسه لحركة Matrix وقت التشغيل وفحوصات حالة الحساب.

## حلّ الأهداف

يقبل Matrix صيغ الأهداف هذه في أي مكان يطلب فيه OpenClaw هدف غرفة أو مستخدم:

- المستخدمون: `@user:server`، أو `user:@user:server`، أو `matrix:user:@user:server`
- الغرف: `!room:server`، أو `room:!room:server`، أو `matrix:room:!room:server`
- الأسماء البديلة: `#alias:server`، أو `channel:#alias:server`، أو `matrix:channel:#alias:server`

معرّفات غرف Matrix حساسة لحالة الأحرف. استخدم حالة الأحرف الدقيقة لمعرّف الغرفة من Matrix
عند تكوين أهداف التسليم الصريحة أو مهام cron أو الارتباطات أو قوائم السماح.
يبقي OpenClaw مفاتيح الجلسات الداخلية معيارية للتخزين، لذلك لا تُعد هذه المفاتيح المكتوبة بأحرف صغيرة
مصدرًا موثوقًا لمعرّفات التسليم في Matrix.

يستخدم البحث المباشر في الدليل حساب Matrix المسجّل دخوله:

- تستعلم عمليات البحث عن المستخدمين دليل مستخدمي Matrix على ذلك الخادم المنزلي.
- تقبل عمليات البحث عن الغرف معرّفات الغرف والأسماء البديلة الصريحة مباشرة، ثم تعود إلى البحث في أسماء الغرف المنضم إليها لذلك الحساب.
- البحث باسم الغرفة المنضم إليها هو أفضل جهد. إذا تعذر حل اسم غرفة إلى معرّف أو اسم بديل، فسيتم تجاهله أثناء حل قائمة السماح وقت التشغيل.

## مرجع التكوين

تقبل الحقول ذات نمط قائمة السماح (`groupAllowFrom`، و`dm.allowFrom`، و`groups.<room>.users`) معرّفات مستخدمي Matrix كاملة (الأكثر أمانًا). تُحل المطابقات الدقيقة في الدليل عند بدء التشغيل وكلما تغيّرت قائمة السماح أثناء تشغيل المراقب؛ وتُتجاهل الإدخالات التي لا يمكن حلها وقت التشغيل. تفضّل قوائم سماح الغرف معرّفات الغرف أو الأسماء البديلة للسبب نفسه.

### الحساب والاتصال

- `enabled`: تفعيل القناة أو تعطيلها.
- `name`: تسمية عرض اختيارية للحساب.
- `defaultAccount`: معرّف الحساب المفضّل عند تكوين عدة حسابات Matrix.
- `accounts`: تجاوزات مسمّاة لكل حساب. تُورّث قيم `channels.matrix` الأعلى مستوى كإعدادات افتراضية.
- `homeserver`: عنوان URL للخادم المنزلي، مثل `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: السماح لهذا الحساب بالاتصال بـ `localhost` أو عناوين IP على LAN/Tailscale أو أسماء المضيفات الداخلية.
- `proxy`: عنوان URL اختياري لوكيل HTTP(S) لحركة Matrix. تجاوز لكل حساب مدعوم.
- `userId`: معرّف مستخدم Matrix كامل (`@bot:example.org`).
- `accessToken`: رمز وصول للمصادقة المعتمدة على الرموز. قيم النص الصريح وSecretRef مدعومة عبر مزوّدي env/file/exec ([إدارة الأسرار](/ar/gateway/secrets)).
- `password`: كلمة مرور لتسجيل الدخول المعتمد على كلمة المرور. قيم النص الصريح وSecretRef مدعومة.
- `deviceId`: معرّف جهاز Matrix صريح.
- `deviceName`: اسم عرض الجهاز المستخدم وقت تسجيل الدخول بكلمة المرور.
- `avatarUrl`: عنوان URL للصورة الذاتية المخزّنة لمزامنة الملف الشخصي وتحديثات `profile set`.
- `initialSyncLimit`: الحد الأقصى لعدد الأحداث المجلبة أثناء مزامنة بدء التشغيل.

### التشفير

- `encryption`: تفعيل E2EE. الافتراضي: `false`.
- `startupVerification`: `"if-unverified"` (الافتراضي عند تشغيل E2EE) أو `"off"`. يطلب التحقق الذاتي تلقائيًا عند بدء التشغيل عندما يكون هذا الجهاز غير موثّق.
- `startupVerificationCooldownHours`: فترة التهدئة قبل طلب بدء التشغيل التلقائي التالي. الافتراضي: `24`.

### الوصول والسياسة

- `groupPolicy`: `"open"`، أو `"allowlist"`، أو `"disabled"`. الافتراضي: `"allowlist"`.
- `groupAllowFrom`: قائمة سماح بمعرّفات المستخدمين لحركة الغرف.
- `dm.enabled`: عند `false`، تجاهل جميع الرسائل المباشرة. الافتراضي: `true`.
- `dm.policy`: `"pairing"` (الافتراضي)، أو `"allowlist"`، أو `"open"`، أو `"disabled"`. تُطبّق بعد انضمام البوت وتصنيف الغرفة كرسالة مباشرة؛ ولا تؤثر في معالجة الدعوات.
- `dm.allowFrom`: قائمة سماح بمعرّفات المستخدمين لحركة الرسائل المباشرة.
- `dm.sessionScope`: `"per-user"` (الافتراضي) أو `"per-room"`.
- `dm.threadReplies`: تجاوز خاص بالرسائل المباشرة لتفريع الردود (`"off"`، أو `"inbound"`، أو `"always"`).
- `allowBots`: قبول الرسائل من حسابات بوت Matrix الأخرى المكوّنة (`true` أو `"mentions"`).
- `allowlistOnly`: عند `true`، يفرض كل سياسات الرسائل المباشرة النشطة (باستثناء `"disabled"`) وسياسات المجموعات `"open"` على `"allowlist"`. لا يغيّر سياسات `"disabled"`.
- `autoJoin`: `"always"`، أو `"allowlist"`، أو `"off"`. الافتراضي: `"off"`. ينطبق على كل دعوة Matrix، بما في ذلك الدعوات ذات نمط الرسائل المباشرة.
- `autoJoinAllowlist`: الغرف/الأسماء البديلة المسموح بها عندما يكون `autoJoin` هو `"allowlist"`. تُحل إدخالات الأسماء البديلة مقابل الخادم المنزلي، وليس مقابل الحالة التي تدّعيها الغرفة المدعو إليها.
- `contextVisibility`: رؤية سياق تكميلية (`"all"` افتراضيًا، أو `"allowlist"`، أو `"allowlist_quote"`).

### سلوك الرد

- `replyToMode`: `"off"`، أو `"first"`، أو `"all"`، أو `"batched"`.
- `threadReplies`: `"off"`، أو `"inbound"`، أو `"always"`.
- `threadBindings`: تجاوزات لكل قناة لتوجيه الجلسات المرتبطة بالسلاسل ودورة حياتها.
- `streaming`: `"off"` (الافتراضي)، أو `"partial"`، أو `"quiet"`، أو صيغة كائن `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`، و`false` ↔ `"off"`.
- `blockStreaming`: عند `true`، تُحفظ كتل المساعد المكتملة كرسائل تقدم منفصلة.
- `markdown`: تكوين اختياري لعرض Markdown للنص الصادر.
- `responsePrefix`: سلسلة اختيارية تُضاف قبل الردود الصادرة.
- `textChunkLimit`: حجم الجزء الصادر بالأحرف عندما يكون `chunkMode: "length"`. الافتراضي: `4000`.
- `chunkMode`: `"length"` (الافتراضي، يقسم حسب عدد الأحرف) أو `"newline"` (يقسم عند حدود الأسطر).
- `historyLimit`: عدد رسائل الغرفة الحديثة المضمّنة كـ `InboundHistory` عندما تؤدي رسالة غرفة إلى تشغيل الوكيل. يعود إلى `messages.groupChat.historyLimit`؛ الافتراضي الفعلي `0` (معطّل).
- `mediaMaxMb`: حد حجم الوسائط بالميغابايت للإرسال الصادر والمعالجة الواردة.

### إعدادات التفاعل

- `ackReaction`: تجاوز تفاعل الإقرار لهذه القناة/الحساب.
- `ackReactionScope`: تجاوز النطاق (`"group-mentions"` افتراضيًا، أو `"group-all"`، أو `"direct"`، أو `"all"`، أو `"none"`، أو `"off"`).
- `reactionNotifications`: وضع إشعار التفاعلات الواردة (`"own"` افتراضيًا، أو `"off"`).

### الأدوات والتجاوزات لكل غرفة

- `actions`: ضبط بوابات الأدوات لكل إجراء (`messages`، و`reactions`، و`pins`، و`profile`، و`memberInfo`، و`channelInfo`، و`verification`).
- `groups`: خريطة سياسات لكل غرفة. تستخدم هوية الجلسة معرّف الغرفة الثابت بعد الحل. (`rooms` اسم بديل قديم.)
  - `groups.<room>.account`: تقييد إدخال غرفة موروث واحد بحساب محدد.
  - `groups.<room>.allowBots`: تجاوز لكل غرفة لإعداد مستوى القناة (`true` أو `"mentions"`).
  - `groups.<room>.users`: قائمة سماح للمرسلين لكل غرفة.
  - `groups.<room>.tools`: تجاوزات السماح/الرفض للأدوات لكل غرفة.
  - `groups.<room>.autoReply`: تجاوز تقييد الإشارات لكل غرفة. `true` يعطل متطلبات الإشارة لتلك الغرفة؛ و`false` يفرضها مرة أخرى.
  - `groups.<room>.skills`: مرشح Skills لكل غرفة.
  - `groups.<room>.systemPrompt`: مقتطف موجه النظام لكل غرفة.

### إعدادات موافقة exec

- `execApprovals.enabled`: تسليم موافقات exec عبر مطالبات Matrix الأصلية.
- `execApprovals.approvers`: معرّفات مستخدمي Matrix المسموح لهم بالموافقة. يعود إلى `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (الافتراضي)، أو `"channel"`، أو `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: قوائم سماح اختيارية للوكيل/الجلسة للتسليم.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الإقران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الإقران
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات وتقييد الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
