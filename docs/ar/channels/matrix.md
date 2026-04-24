---
read_when:
    - إعداد Matrix في OpenClaw
    - إعداد التشفير من الطرف إلى الطرف والتحقق في Matrix
summary: حالة دعم Matrix وإعداده وأمثلة الإعدادات
title: Matrix
x-i18n:
    generated_at: "2026-04-24T07:30:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf25a6f64ed310f33b72517ccd1526876e27caae240e9fa837a86ca2c392ab25
    source_path: channels/matrix.md
    workflow: 15
---

Matrix هو Plugin قناة مضمّن لـ OpenClaw.
يستخدم `matrix-js-sdk` الرسمي ويدعم الرسائل المباشرة، والغرف، وسلاسل الرسائل، والوسائط، والتفاعلات، والاستطلاعات، والموقع، والتشفير من الطرف إلى الطرف.

## Plugin مضمّن

يأتي Matrix كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا تحتاج الإصدارات المعبأة المعتادة إلى تثبيت منفصل.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا لا يتضمن Matrix، فقم بتثبيته يدويًا:

التثبيت من npm:

```bash
openclaw plugins install @openclaw/matrix
```

التثبيت من نسخة محلية:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

راجع [Plugins](/ar/tools/plugin) لمعرفة سلوك Plugin وقواعد التثبيت.

## الإعداد

1. تأكد من توفر Plugin الخاص بـ Matrix.
   - إصدارات OpenClaw المعبأة الحالية تتضمنه بالفعل.
   - يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
2. أنشئ حساب Matrix على الخادم المنزلي الخاص بك.
3. اضبط `channels.matrix` باستخدام أحد الخيارين:
   - `homeserver` + `accessToken`، أو
   - `homeserver` + `userId` + `password`.
4. أعد تشغيل Gateway.
5. ابدأ رسالة مباشرة مع الروبوت أو ادعه إلى غرفة.
   - لا تعمل دعوات Matrix الجديدة إلا عندما يسمح `channels.matrix.autoJoin` بها.

مسارات الإعداد التفاعلي:

```bash
openclaw channels add
openclaw configure --section channels
```

يطلب معالج Matrix ما يلي:

- عنوان URL للخادم المنزلي
- طريقة المصادقة: access token أو كلمة مرور
- معرّف المستخدم (لمصادقة كلمة المرور فقط)
- اسم الجهاز الاختياري
- ما إذا كان يجب تفعيل التشفير من الطرف إلى الطرف
- ما إذا كان يجب إعداد وصول الغرف والانضمام التلقائي للدعوات

السلوكيات الأساسية للمعالج:

- إذا كانت متغيرات بيئة مصادقة Matrix موجودة بالفعل ولم يكن لهذا الحساب اعتماد مصادقة محفوظ بالفعل في الإعدادات، فسيعرض المعالج اختصارًا لاستخدام env للإبقاء على المصادقة في متغيرات البيئة.
- تتم تسوية أسماء الحسابات إلى معرّف الحساب. على سبيل المثال، يصبح `Ops Bot` هو `ops-bot`.
- تقبل إدخالات قائمة السماح للرسائل المباشرة `@user:server` مباشرة؛ ولا تعمل أسماء العرض إلا عندما يعثر البحث الحي في الدليل على تطابق دقيق واحد.
- تقبل إدخالات قائمة السماح للغرف معرّفات الغرف والأسماء المستعارة مباشرة. يُفضّل استخدام `!room:server` أو `#alias:server`؛ ويتم تجاهل الأسماء غير المحلولة أثناء التشغيل عند حل قائمة السماح.
- في وضع قائمة السماح للانضمام التلقائي للدعوات، استخدم فقط أهداف الدعوة الثابتة: `!roomId:server` أو `#alias:server` أو `*`. تُرفض أسماء الغرف العادية.
- لحل أسماء الغرف قبل الحفظ، استخدم `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`.

إذا تركته بدون ضبط، فلن ينضم الروبوت إلى الغرف المدعو إليها أو الدعوات الجديدة بأسلوب الرسائل المباشرة، لذلك لن يظهر في المجموعات الجديدة أو الرسائل المباشرة المدعو إليها ما لم تنضم يدويًا أولًا.

اضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` لتقييد الدعوات التي يقبلها، أو اضبط `autoJoin: "always"` إذا كنت تريد منه الانضمام إلى كل دعوة.

في وضع `allowlist`، لا يقبل `autoJoinAllowlist` إلا `!roomId:server` أو `#alias:server` أو `*`.
</Warning>

مثال على قائمة السماح:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

الانضمام إلى كل دعوة:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

إعداد أدنى باستخدام token:

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

إعداد يعتمد على كلمة المرور (يتم تخزين token مؤقتًا بعد تسجيل الدخول):

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

يخزن Matrix بيانات الاعتماد المؤقتة في `~/.openclaw/credentials/matrix/`.
يستخدم الحساب الافتراضي `credentials.json`؛ وتستخدم الحسابات المسماة `credentials-<account>.json`.
عند وجود بيانات اعتماد مؤقتة هناك، يعتبر OpenClaw أن Matrix مهيأ لأغراض الإعداد، وdoctor، واكتشاف حالة القناة، حتى لو لم يتم ضبط المصادقة الحالية مباشرة في الإعدادات.

مكافئات متغيرات البيئة (تُستخدم عندما لا يكون مفتاح الإعداد مضبوطًا):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

للحسابات غير الافتراضية، استخدم متغيرات بيئة مقيّدة بالحساب:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

مثال للحساب `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

ولمعرّف الحساب الموحّد `ops-bot`، استخدم:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

يهرب Matrix علامات الترقيم في معرّفات الحسابات للحفاظ على خلو متغيرات البيئة المقيّدة من التعارضات.
على سبيل المثال، تتحول `-` إلى `_X2D_`، لذلك يتم تحويل `ops-prod` إلى `MATRIX_OPS_X2D_PROD_*`.

لا يعرض المعالج التفاعلي اختصار متغيرات البيئة إلا عندما تكون متغيرات بيئة المصادقة هذه موجودة بالفعل ولم يكن الحساب المحدد يحتوي بالفعل على مصادقة Matrix محفوظة في الإعدادات.

لا يمكن ضبط `MATRIX_HOMESERVER` من ملف `.env` لمساحة العمل؛ راجع [ملفات `.env` لمساحة العمل](/ar/gateway/security).

## مثال على الإعدادات

هذا إعداد أساسي عملي يتضمن اقتران الرسائل المباشرة، وقائمة سماح للغرف، وتفعيل التشفير من الطرف إلى الطرف:

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
        "!roomid:example.org": {
          requireMention: true,
        },
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

ينطبق `autoJoin` على جميع دعوات Matrix، بما في ذلك الدعوات بأسلوب الرسائل المباشرة. لا يستطيع OpenClaw
تصنيف الغرفة المدعو إليها بشكل موثوق على أنها رسالة مباشرة أو مجموعة في وقت الدعوة، لذلك تمر جميع الدعوات عبر `autoJoin`
أولًا. يتم تطبيق `dm.policy` بعد انضمام الروبوت وتصنيف الغرفة كرسالة مباشرة.

## معاينات البث

بث الردود في Matrix يعتمد على الاشتراك الاختياري.

اضبط `channels.matrix.streaming` على `"partial"` عندما تريد من OpenClaw إرسال معاينة مباشرة واحدة
للرد، وتعديل تلك المعاينة في مكانها بينما يولد النموذج النص، ثم إنهاءها عند اكتمال
الرد:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` هو الوضع الافتراضي. ينتظر OpenClaw الرد النهائي ويرسله مرة واحدة.
- ينشئ `streaming: "partial"` رسالة معاينة واحدة قابلة للتعديل لكتلة المساعد الحالية باستخدام رسائل Matrix النصية العادية. يحافظ ذلك على سلوك الإشعارات القديم في Matrix الذي يعتمد على المعاينة أولًا، لذلك قد تُظهر العملاء القياسيون إشعارًا عند أول نص معاينة متدفق بدلًا من الكتلة المكتملة.
- ينشئ `streaming: "quiet"` إشعار معاينة هادئًا واحدًا قابلًا للتعديل لكتلة المساعد الحالية. استخدم هذا فقط عندما تضبط أيضًا قواعد push لدى المستلمين لتعديلات المعاينة النهائية.
- يفعّل `blockStreaming: true` رسائل تقدم منفصلة في Matrix. عند تفعيل بث المعاينة، يحتفظ Matrix بالمسودة الحية للكتلة الحالية ويحتفظ بالكتل المكتملة كرسائل منفصلة.
- عند تشغيل بث المعاينة وإيقاف `blockStreaming`، يعدّل Matrix المسودة الحية في مكانها وينهي نفس الحدث عند انتهاء الكتلة أو الدور.
- إذا لم تعد المعاينة تتسع في حدث Matrix واحد، يوقف OpenClaw بث المعاينة ويعود إلى الإرسال النهائي العادي.
- لا تزال ردود الوسائط ترسل المرفقات بشكل طبيعي. إذا لم يعد من الآمن إعادة استخدام معاينة قديمة، فسيقوم OpenClaw بحذفها قبل إرسال رد الوسائط النهائي.
- تتطلب تعديلات المعاينة طلبات إضافية إلى Matrix API. اترك البث معطلاً إذا كنت تريد أكثر سلوك تحفظًا فيما يتعلق بحدود المعدل.

لا يفعّل `blockStreaming` معاينات المسودة بمفرده.
استخدم `streaming: "partial"` أو `streaming: "quiet"` لتعديلات المعاينة؛ ثم أضف `blockStreaming: true` فقط إذا كنت تريد أيضًا أن تظل كتل المساعد المكتملة مرئية كرسائل تقدم منفصلة.

إذا كنت تحتاج إلى إشعارات Matrix القياسية من دون قواعد push مخصصة، فاستخدم `streaming: "partial"` لسلوك المعاينة أولًا أو اترك `streaming` معطلاً للإرسال النهائي فقط. مع `streaming: "off"`:

- يرسل `blockStreaming: true` كل كتلة مكتملة كرسالة Matrix عادية تولد إشعارًا.
- يرسل `blockStreaming: false` الرد النهائي المكتمل فقط كرسالة Matrix عادية تولد إشعارًا.

### قواعد push ذاتية الاستضافة للمعاينات النهائية الهادئة

لا يرسل البث الهادئ (`streaming: "quiet"`) إشعارات للمستلمين إلا بعد إنهاء الكتلة أو الدور — يجب أن تطابق قاعدة push لكل مستخدم علامة المعاينة النهائية. راجع [قواعد push في Matrix للمعاينات الهادئة](/ar/channels/matrix-push-rules) للاطلاع على الإعداد الكامل (token المستلم، والتحقق من pusher، وتثبيت القاعدة، والملاحظات الخاصة بكل homeserver).

## غرف الروبوت إلى الروبوت

افتراضيًا، يتم تجاهل رسائل Matrix القادمة من حسابات Matrix أخرى مهيأة في OpenClaw.

استخدم `allowBots` عندما تريد عمدًا حركة مرور Matrix بين الوكلاء:

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

- يقبل `allowBots: true` الرسائل الواردة من حسابات روبوت Matrix أخرى مهيأة في الغرف والرسائل المباشرة المسموح بها.
- يقبل `allowBots: "mentions"` هذه الرسائل فقط عندما تتضمن إشارة مرئية إلى هذا الروبوت داخل الغرف. أما الرسائل المباشرة فتبقى مسموحًا بها.
- يتجاوز `groups.<room>.allowBots` الإعداد على مستوى الحساب لغرفة واحدة.
- لا يزال OpenClaw يتجاهل الرسائل الواردة من نفس معرّف مستخدم Matrix لتجنب حلقات الرد الذاتي.
- لا يوفّر Matrix هنا علامة روبوت أصلية؛ يتعامل OpenClaw مع "bot-authored" على أنه "مرسل من حساب Matrix مهيأ آخر على Gateway الخاصة بـ OpenClaw".

استخدم قوائم سماح صارمة للغرف ومتطلبات الإشارة عند تفعيل حركة المرور بين الروبوتات في الغرف المشتركة.

## التشفير والتحقق

في الغرف المشفرة من الطرف إلى الطرف، تستخدم أحداث الصور الصادرة `thumbnail_file` بحيث تكون معاينات الصور مشفرة إلى جانب المرفق الكامل. أما الغرف غير المشفرة فلا تزال تستخدم `thumbnail_url` العادي. لا حاجة إلى أي إعداد — يكتشف Plugin حالة التشفير من الطرف إلى الطرف تلقائيًا.

تفعيل التشفير:

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

أوامر التحقق (تقبل جميعها `--verbose` للتشخيص و`--json` لإخراج قابل للقراءة الآلية):

| الأمر | الغرض |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `openclaw matrix verify status` | التحقق من حالة التوقيع المتبادل والتحقق من الجهاز |
| `openclaw matrix verify status --include-recovery-key --json` | تضمين مفتاح الاسترداد المخزّن |
| `openclaw matrix verify bootstrap` | تهيئة التوقيع المتبادل والتحقق (انظر أدناه) |
| `openclaw matrix verify bootstrap --force-reset-cross-signing` | تجاهل هوية التوقيع المتبادل الحالية وإنشاء هوية جديدة |
| `openclaw matrix verify device "<recovery-key>"` | التحقق من هذا الجهاز باستخدام مفتاح استرداد |
| `openclaw matrix verify backup status` | التحقق من سلامة النسخ الاحتياطي لمفاتيح الغرف |
| `openclaw matrix verify backup restore` | استعادة مفاتيح الغرف من النسخة الاحتياطية على الخادم |
| `openclaw matrix verify backup reset --yes` | حذف النسخة الاحتياطية الحالية وإنشاء أساس جديد (قد يؤدي إلى إعادة إنشاء التخزين السري) |

في الإعدادات متعددة الحسابات، تستخدم أوامر Matrix CLI الحساب الافتراضي الضمني لـ Matrix ما لم تمرر `--account <id>`.
إذا قمت بإعداد عدة حسابات مسماة، فاضبط `channels.matrix.defaultAccount` أولًا وإلا ستتوقف عمليات CLI الضمنية هذه وتطلب منك اختيار حساب صراحةً.
استخدم `--account` كلما أردت أن تستهدف عمليات التحقق أو الجهاز حسابًا مسمىً بشكل صريح:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

عندما يكون التشفير معطلًا أو غير متاح لحساب مسمى، تشير تحذيرات Matrix وأخطاء التحقق إلى مفتاح إعدادات ذلك الحساب، مثل `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="ما الذي يعنيه verified">
    يعتبر OpenClaw الجهاز verified فقط عندما توقّعه هوية التوقيع المتبادل الخاصة بك. يكشف `verify status --verbose` عن ثلاث إشارات ثقة:

    - `Locally trusted`: موثوق من هذا العميل فقط
    - `Cross-signing verified`: تُبلغ SDK عن التحقق عبر التوقيع المتبادل
    - `Signed by owner`: موقّع بواسطة مفتاح التوقيع الذاتي الخاص بك

    تصبح `Verified by owner` هي `yes` فقط عند وجود توقيع متبادل أو توقيع من المالك. لا تكفي الثقة المحلية وحدها.

  </Accordion>

  <Accordion title="ما الذي يفعله bootstrap">
    الأمر `verify bootstrap` هو أمر الإصلاح والإعداد للحسابات المشفرة. وبالترتيب، فإنه:

    - يهيئ التخزين السري، مع إعادة استخدام مفتاح استرداد موجود عندما يكون ذلك ممكنًا
    - يهيئ التوقيع المتبادل ويرفع مفاتيح التوقيع المتبادل العامة الناقصة
    - يعلّم الجهاز الحالي ويوقّعه عبر التوقيع المتبادل
    - ينشئ نسخة احتياطية لمفاتيح الغرف على الخادم إذا لم تكن موجودة بالفعل

    إذا كان homeserver يتطلب UIA لرفع مفاتيح التوقيع المتبادل، فسيحاول OpenClaw أولًا بدون مصادقة، ثم `m.login.dummy`، ثم `m.login.password` (يتطلب `channels.matrix.password`). استخدم `--force-reset-cross-signing` فقط عندما تريد عمدًا تجاهل الهوية الحالية.

  </Accordion>

  <Accordion title="أساس نسخة احتياطية جديدة">
    إذا كنت تريد الإبقاء على عمل الرسائل المشفرة المستقبلية مع قبول فقدان السجل القديم غير القابل للاسترداد:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    أضف `--account <id>` لاستهداف حساب مسمى. يمكن أن يؤدي هذا أيضًا إلى إعادة إنشاء التخزين السري إذا تعذر تحميل سر النسخة الاحتياطية الحالية بأمان.

  </Accordion>

  <Accordion title="سلوك بدء التشغيل">
    مع `encryption: true`، تكون القيمة الافتراضية لـ `startupVerification` هي `"if-unverified"`. عند بدء التشغيل، يطلب الجهاز غير المتحقق منه التحقق الذاتي في عميل Matrix آخر، مع تخطي التكرارات وتطبيق فترة تهدئة. اضبط ذلك باستخدام `startupVerificationCooldownHours` أو عطّله باستخدام `startupVerification: "off"`.

    يشغّل بدء التشغيل أيضًا تمريرة تهيئة حذرة للتشفير تعيد استخدام التخزين السري الحالي وهوية التوقيع المتبادل الحالية. إذا كانت حالة التهيئة معطلة، يحاول OpenClaw إصلاحًا محميًا حتى بدون `channels.matrix.password`؛ وإذا كان homeserver يتطلب UIA بكلمة مرور، يسجل بدء التشغيل تحذيرًا ويبقى غير قاتل. يتم الحفاظ على الأجهزة الموقعة بالفعل من المالك.

    راجع [ترحيل Matrix](/ar/install/migrating-matrix) للاطلاع على تدفق الترقية الكامل.

  </Accordion>

  <Accordion title="إشعارات التحقق">
    ينشر Matrix إشعارات دورة حياة التحقق في غرفة التحقق الصارمة للرسائل المباشرة كرسائل `m.notice`: الطلب، والجاهزية (مع إرشادات "Verify by emoji")، والبدء/الاكتمال، وتفاصيل SAS (emoji/decimal) عند توفرها.

    يتم تتبع الطلبات الواردة من عميل Matrix آخر وقبولها تلقائيًا. للتحقق الذاتي، يبدأ OpenClaw تدفق SAS تلقائيًا ويؤكد جانبه الخاص بمجرد توفر التحقق عبر emoji — ولا يزال يتعين عليك المقارنة والتأكيد على "They match" في عميل Matrix لديك.

    لا يتم تمرير إشعارات نظام التحقق إلى مسار دردشة الوكيل.

  </Accordion>

  <Accordion title="نظافة الأجهزة">
    يمكن أن تتراكم الأجهزة القديمة التي يديرها OpenClaw. اعرضها ونظّفها:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="مخزن التشفير">
    يستخدم التشفير من الطرف إلى الطرف في Matrix مسار التشفير Rust الرسمي في `matrix-js-sdk` مع `fake-indexeddb` باعتباره طبقة IndexedDB البديلة. تستمر حالة التشفير في `crypto-idb-snapshot.json` (مع أذونات ملفات مقيّدة).

    توجد حالة التشغيل المشفرة ضمن `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` وتتضمن مخزن المزامنة، ومخزن التشفير، ومفتاح الاسترداد، ولقطة IDB، وروابط سلاسل الرسائل، وحالة التحقق عند بدء التشغيل. عندما يتغير token لكن تبقى هوية الحساب نفسها، يعيد OpenClaw استخدام أفضل جذر موجود بحيث تظل الحالة السابقة مرئية.

  </Accordion>
</AccordionGroup>

## إدارة الملف الشخصي

حدّث الملف الشخصي الذاتي لـ Matrix للحساب المحدد باستخدام:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

أضف `--account <id>` عندما تريد استهداف حساب Matrix مسمى بشكل صريح.

يقبل Matrix عناوين URL للصورة الرمزية من نوع `mxc://` مباشرة. عند تمرير عنوان URL للصورة الرمزية من نوع `http://` أو `https://`، يقوم OpenClaw أولًا برفعه إلى Matrix ثم يخزن عنوان `mxc://` الناتج مرة أخرى في `channels.matrix.avatarUrl` (أو في تجاوز الحساب المحدد).

## سلاسل الرسائل

يدعم Matrix سلاسل Matrix الأصلية لكل من الردود التلقائية وعمليات إرسال أداة الرسائل.

- يحافظ `dm.sessionScope: "per-user"` (الافتراضي) على توجيه الرسائل المباشرة في Matrix ضمن نطاق المرسل، بحيث يمكن لعدة غرف رسائل مباشرة مشاركة جلسة واحدة عندما تُحل إلى النظير نفسه.
- يعزل `dm.sessionScope: "per-room"` كل غرفة رسائل مباشرة في Matrix في مفتاح جلسة خاص بها مع الاستمرار في استخدام فحوصات المصادقة وقائمة السماح العادية للرسائل المباشرة.
- لا تزال روابط محادثات Matrix الصريحة تتغلب على `dm.sessionScope`، لذلك تحتفظ الغرف وسلاسل الرسائل المرتبطة بالجلسة الهدف المختارة لها.
- يبقي `threadReplies: "off"` الردود في المستوى الأعلى، ويحافظ على الرسائل الواردة ضمن سلاسل الرسائل على جلسة الأصل.
- يرسل `threadReplies: "inbound"` الرد داخل سلسلة رسائل فقط عندما تكون الرسالة الواردة بالفعل ضمن تلك السلسلة.
- يحافظ `threadReplies: "always"` على ردود الغرف داخل سلسلة رسائل متجذرة في الرسالة المُشغِّلة ويوجه تلك المحادثة عبر الجلسة المطابقة ذات نطاق السلسلة ابتداءً من أول رسالة مُشغِّلة.
- يتجاوز `dm.threadReplies` الإعداد الأعلى مستوى للرسائل المباشرة فقط. على سبيل المثال، يمكنك إبقاء سلاسل الغرف معزولة مع إبقاء الرسائل المباشرة مسطحة.
- تتضمن الرسائل الواردة ضمن سلاسل الرسائل رسالة جذر السلسلة كسياق إضافي للوكيل.
- ترث عمليات إرسال أداة الرسائل تلقائيًا سلسلة Matrix الحالية عندما يكون الهدف هو الغرفة نفسها، أو هدف مستخدم الرسائل المباشرة نفسه، ما لم يتم توفير `threadId` صراحةً.
- لا يبدأ إعادة استخدام هدف مستخدم الرسائل المباشرة للجلسة نفسها إلا عندما تثبت بيانات تعريف الجلسة الحالية النظير نفسه للرسائل المباشرة على حساب Matrix نفسه؛ وإلا يعود OpenClaw إلى التوجيه العادي ضمن نطاق المستخدم.
- عندما يرى OpenClaw أن غرفة رسائل مباشرة في Matrix تتصادم مع غرفة رسائل مباشرة أخرى على جلسة Matrix مشتركة للرسائل المباشرة نفسها، فإنه ينشر `m.notice` لمرة واحدة في تلك الغرفة يتضمن منفذ الهروب `/focus` عند تفعيل روابط سلاسل الرسائل وتلميح `dm.sessionScope`.
- يتم دعم روابط سلاسل الرسائل أثناء التشغيل في Matrix. تعمل الأوامر `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` و`/acp spawn` المرتبط بسلسلة الرسائل في غرف Matrix ورسائله المباشرة.
- ينشئ `/focus` في المستوى الأعلى لغرفة/رسالة مباشرة في Matrix سلسلة Matrix جديدة ويربطها بالجلسة الهدف عندما تكون `threadBindings.spawnSubagentSessions=true`.
- يؤدي تشغيل `/focus` أو `/acp spawn --thread here` داخل سلسلة Matrix موجودة إلى ربط تلك السلسلة الحالية بدلًا من ذلك.

## روابط محادثة ACP

يمكن تحويل غرف Matrix والرسائل المباشرة وسلاسل Matrix الموجودة إلى مساحات عمل ACP دائمة من دون تغيير سطح الدردشة.

تدفق المشغّل السريع:

- شغّل `/acp spawn codex --bind here` داخل الرسالة المباشرة أو الغرفة أو سلسلة الرسائل الموجودة في Matrix التي تريد الاستمرار في استخدامها.
- في رسالة مباشرة أو غرفة Matrix من المستوى الأعلى، تبقى الرسالة المباشرة/الغرفة الحالية هي سطح الدردشة وتُوجَّه الرسائل المستقبلية إلى جلسة ACP التي تم إنشاؤها.
- داخل سلسلة Matrix موجودة، يربط `--bind here` تلك السلسلة الحالية في مكانها.
- يعيد `/new` و`/reset` تعيين جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الربط.

ملاحظات:

- لا ينشئ `--bind here` سلسلة Matrix فرعية.
- لا تكون `threadBindings.spawnAcpSessions` مطلوبة إلا لـ `/acp spawn --thread auto|here`، حيث يحتاج OpenClaw إلى إنشاء سلسلة Matrix فرعية أو ربطها.

### إعداد روابط سلاسل الرسائل

يرث Matrix القيم الافتراضية العامة من `session.threadBindings`، ويدعم أيضًا تجاوزات لكل قناة:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

علامات الإنشاء المرتبطة بسلاسل الرسائل في Matrix تتطلب الاشتراك الاختياري:

- اضبط `threadBindings.spawnSubagentSessions: true` للسماح للأمر `/focus` في المستوى الأعلى بإنشاء سلاسل Matrix جديدة وربطها.
- اضبط `threadBindings.spawnAcpSessions: true` للسماح للأمر `/acp spawn --thread auto|here` بربط جلسات ACP بسلاسل Matrix.

## التفاعلات

يدعم Matrix إجراءات التفاعل الصادرة، وإشعارات التفاعل الواردة، وتفاعلات الإقرار الواردة.

- يتم التحكم في أدوات التفاعل الصادرة عبر `channels["matrix"].actions.reactions`.
- يضيف `react` تفاعلًا إلى حدث Matrix محدد.
- يسرد `reactions` ملخص التفاعلات الحالي لحدث Matrix محدد.
- تؤدي `emoji=""` إلى إزالة تفاعلات حساب الروبوت نفسه على ذلك الحدث.
- تؤدي `remove: true` إلى إزالة تفاعل emoji المحدد فقط من حساب الروبوت.

يتم حل نطاق تفاعلات الإقرار وفق ترتيب OpenClaw القياسي:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- الرجوع إلى emoji هوية الوكيل

يتم حل نطاق تفاعل الإقرار بهذا الترتيب:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

يتم حل وضع إشعارات التفاعل بهذا الترتيب:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- الافتراضي: `own`

السلوك:

- يقوم `reactionNotifications: "own"` بتمرير أحداث `m.reaction` المضافة عندما تستهدف رسائل Matrix التي أنشأها الروبوت.
- يعطل `reactionNotifications: "off"` أحداث نظام التفاعل.
- لا يتم تركيب عمليات إزالة التفاعل في أحداث نظام لأن Matrix يعرضها كعمليات حذف redactions، وليس كعمليات إزالة مستقلة لـ `m.reaction`.

## سياق السجل

- يتحكم `channels.matrix.historyLimit` في عدد رسائل الغرفة الأخيرة التي تُضمَّن كـ `InboundHistory` عندما تؤدي رسالة غرفة Matrix إلى تشغيل الوكيل. ويعود إلى `messages.groupChat.historyLimit`؛ وإذا لم يتم ضبط أيٍّ منهما، فالقيمة الافتراضية الفعلية هي `0`. اضبط `0` للتعطيل.
- يقتصر سجل غرف Matrix على الغرف فقط. وتستمر الرسائل المباشرة في استخدام سجل الجلسة العادي.
- يكون سجل غرف Matrix في وضع pending-only: يخزن OpenClaw رسائل الغرفة التي لم تؤدِّ إلى رد بعد، ثم يلتقط لقطة لهذه النافذة عندما تصل إشارة @ أو مُشغِّل آخر.
- لا يتم تضمين رسالة المُشغِّل الحالية في `InboundHistory`؛ بل تبقى في نص الرسالة الواردة الرئيسي لذلك الدور.
- تعيد محاولات نفس حدث Matrix استخدام لقطة السجل الأصلية بدلًا من الانجراف إلى رسائل أحدث في الغرفة.

## ظهور السياق

يدعم Matrix عنصر التحكم المشترك `contextVisibility` لسياق الغرفة الإضافي مثل نص الرد المجتلب، وجذور سلاسل الرسائل، والسجل المعلّق.

- `contextVisibility: "all"` هو الإعداد الافتراضي. يتم الاحتفاظ بالسياق الإضافي كما تم استلامه.
- يقوم `contextVisibility: "allowlist"` بتصفية السياق الإضافي إلى المرسلين المسموح لهم وفق فحوصات قائمة السماح النشطة للغرفة/المستخدم.
- يتصرف `contextVisibility: "allowlist_quote"` مثل `allowlist`، لكنه يحتفظ مع ذلك برد مقتبس صريح واحد.

يؤثر هذا الإعداد على ظهور السياق الإضافي، وليس على ما إذا كانت الرسالة الواردة نفسها يمكنها تشغيل رد.
ولا يزال تفويض التشغيل يأتي من إعدادات `groupPolicy` و`groups` و`groupAllowFrom` وسياسات الرسائل المباشرة.

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
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

راجع [المجموعات](/ar/channels/groups) لمعرفة سلوك بوابة الإشارات وقائمة السماح.

مثال على الاقتران لرسائل Matrix المباشرة:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

إذا استمر مستخدم Matrix غير المعتمد في مراسلتك قبل الموافقة، يعيد OpenClaw استخدام رمز الاقتران المعلّق نفسه وقد يرسل رد تذكير مرة أخرى بعد فترة تهدئة قصيرة بدلًا من إنشاء رمز جديد.

راجع [الاقتران](/ar/channels/pairing) لمعرفة تدفق اقتران الرسائل المباشرة المشترك وتخطيط التخزين.

## إصلاح الغرف المباشرة

إذا خرجت حالة الرسائل المباشرة عن المزامنة، فقد ينتهي الأمر بـ OpenClaw إلى تعيينات `m.direct` قديمة تشير إلى غرف فردية قديمة بدلًا من الرسالة المباشرة الحية. افحص التعيين الحالي لنظير باستخدام:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

وأصلحه باستخدام:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

تدفق الإصلاح:

- يفضّل رسالة مباشرة صارمة 1:1 تم تعيينها بالفعل في `m.direct`
- يعود إلى أي رسالة مباشرة صارمة 1:1 منضم إليها حاليًا مع ذلك المستخدم
- ينشئ غرفة مباشرة جديدة ويعيد كتابة `m.direct` إذا لم توجد رسالة مباشرة سليمة

لا يحذف تدفق الإصلاح الغرف القديمة تلقائيًا. بل يختار فقط الرسالة المباشرة السليمة ويحدّث التعيين بحيث تستهدف عمليات الإرسال الجديدة في Matrix، وإشعارات التحقق، وتدفقات الرسائل المباشرة الأخرى الغرفة الصحيحة مرة أخرى.

## موافقات Exec

يمكن لـ Matrix أن يعمل كعميل موافقة أصلي لحساب Matrix. ولا تزال عناصر توجيه الرسائل المباشرة/القنوات الأصلية موجودة ضمن إعدادات موافقة exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (اختياري؛ يعود إلى `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

يجب أن يكون الموافقون معرّفات مستخدمي Matrix مثل `@owner:example.org`. يقوم Matrix بتفعيل الموافقات الأصلية تلقائيًا عندما تكون `enabled` غير مضبوطة أو مضبوطة على `"auto"` ويمكن حلّ موافق واحد على الأقل. تستخدم موافقات Exec أولًا `execApprovals.approvers` ويمكنها الرجوع إلى `channels.matrix.dm.allowFrom`. وتفوض موافقات Plugin عبر `channels.matrix.dm.allowFrom`. اضبط `enabled: false` لتعطيل Matrix كعميل موافقة أصلي صراحةً. وخلاف ذلك، تعود طلبات الموافقة إلى مسارات الموافقة الأخرى المهيأة أو إلى سياسة الرجوع الاحتياطي للموافقة.

يدعم التوجيه الأصلي في Matrix كلا نوعي الموافقات:

- يتحكم `channels.matrix.execApprovals.*` في وضع التوزيع الأصلي عبر الرسائل المباشرة/القنوات لطلبات موافقة Matrix.
- تستخدم موافقات Exec مجموعة الموافقين الخاصة بـ exec من `execApprovals.approvers` أو `channels.matrix.dm.allowFrom`.
- تستخدم موافقات Plugin قائمة سماح الرسائل المباشرة في Matrix من `channels.matrix.dm.allowFrom`.
- تنطبق اختصارات تفاعلات Matrix وتحديثات الرسائل على كلٍّ من موافقات exec وPlugin.

قواعد الإرسال:

- يرسل `target: "dm"` طلبات الموافقة إلى الرسائل المباشرة للموافقين
- يرسل `target: "channel"` الطلب مرة أخرى إلى غرفة Matrix أو الرسالة المباشرة الأصلية
- يرسل `target: "both"` إلى الرسائل المباشرة للموافقين وإلى غرفة Matrix أو الرسالة المباشرة الأصلية

تزرع طلبات الموافقة في Matrix اختصارات التفاعل على رسالة الموافقة الأساسية:

- `✅` = السماح مرة واحدة
- `❌` = الرفض
- `♾️` = السماح دائمًا عندما يكون هذا القرار مسموحًا به وفق سياسة exec الفعلية

يمكن للموافقين التفاعل على تلك الرسالة أو استخدام أوامر الشرطة المائلة الاحتياطية: `/approve <id> allow-once` أو `/approve <id> allow-always` أو `/approve <id> deny`.

لا يمكن سوى للموافقين الذين تم حلهم الموافقة أو الرفض. بالنسبة إلى موافقات exec، يتضمن الإرسال عبر القناة نص الأمر، لذا فعّل `channel` أو `both` فقط في الغرف الموثوقة.

تجاوز لكل حساب:

- `channels.matrix.accounts.<account>.execApprovals`

الوثائق ذات الصلة: [موافقات Exec](/ar/tools/exec-approvals)

## أوامر الشرطة المائلة

تعمل أوامر الشرطة المائلة في Matrix (مثل `/new` و`/reset` و`/model`) مباشرة في الرسائل المباشرة. وفي الغرف، يتعرّف OpenClaw أيضًا على أوامر الشرطة المائلة التي تسبقها إشارة Matrix الخاصة بالروبوت نفسه، لذا فإن `@bot:server /new` يشغّل مسار الأوامر من دون الحاجة إلى تعبير نمطي مخصص للإشارة. وهذا يبقي الروبوت مستجيبًا لمنشورات الغرف بأسلوب `@mention /command` التي يصدرها Element والعملاء المشابهون عندما يكمل المستخدم اسم الروبوت قبل كتابة الأمر.

لا تزال قواعد التفويض سارية: يجب أن يستوفي مرسلو الأوامر سياسات قائمة السماح/المالك للرسائل المباشرة أو الغرف تمامًا مثل الرسائل العادية.

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

تعمل القيم العليا في `channels.matrix` كقيم افتراضية للحسابات المسماة ما لم يتجاوزها حساب معيّن.
يمكنك تقييد إدخالات الغرف الموروثة بحساب Matrix واحد باستخدام `groups.<room>.account`.
وتظل الإدخالات من دون `account` مشتركة بين جميع حسابات Matrix، كما أن الإدخالات ذات `account: "default"` تظل تعمل عندما يُضبط الحساب الافتراضي مباشرة في المستوى الأعلى `channels.matrix.*`.
لا تنشئ القيم الافتراضية الجزئية المشتركة للمصادقة حسابًا افتراضيًا ضمنيًا منفصلًا بمفردها. لا يقوم OpenClaw بتركيب حساب `default` الأعلى مستوى إلا عندما يكون لذلك الافتراضي مصادقة حديثة (`homeserver` مع `accessToken`، أو `homeserver` مع `userId` و`password`)؛ ويمكن للحسابات المسماة أن تظل قابلة للاكتشاف من `homeserver` مع `userId` عندما تلبّي بيانات الاعتماد المؤقتة المصادقة لاحقًا.
إذا كان Matrix يحتوي بالفعل على حساب مسمى واحد بالضبط، أو كان `defaultAccount` يشير إلى مفتاح حساب مسمى موجود، فإن ترقية الإصلاح/الإعداد من حساب واحد إلى عدة حسابات تحافظ على ذلك الحساب بدلًا من إنشاء إدخال `accounts.default` جديد. ولا تنتقل إلى ذلك الحساب المرقّى إلا مفاتيح مصادقة/تهيئة Matrix؛ أما مفاتيح سياسة الإرسال المشتركة فتبقى في المستوى الأعلى.
اضبط `defaultAccount` عندما تريد من OpenClaw تفضيل حساب Matrix مسمى واحد للتوجيه الضمني، والتحقق، وعمليات CLI.
إذا كانت هناك عدة حسابات Matrix مهيأة وكان أحد معرّفات الحساب هو `default`، فسيستخدم OpenClaw ذلك الحساب ضمنيًا حتى عندما لا تكون `defaultAccount` مضبوطة.
إذا قمت بإعداد عدة حسابات مسماة، فاضبط `defaultAccount` أو مرّر `--account <id>` لأوامر CLI التي تعتمد على اختيار الحساب الضمني.
مرّر `--account <id>` إلى `openclaw matrix verify ...` و`openclaw matrix devices ...` عندما تريد تجاوز هذا الاختيار الضمني لأمر واحد.

راجع [مرجع الإعدادات](/ar/gateway/config-channels#multi-account-all-channels) لمعرفة النمط المشترك للحسابات المتعددة.

## خوادم homeserver الخاصة/الشبكة المحلية

افتراضيًا، يمنع OpenClaw خوادم homeserver الخاصة/الداخلية الخاصة بـ Matrix كحماية من SSRF ما لم
تفعّل ذلك صراحةً لكل حساب.

إذا كان homeserver لديك يعمل على localhost، أو عنوان LAN/Tailscale IP، أو اسم مضيف داخلي، ففعّل
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

مثال على الإعداد عبر CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

يسمح هذا الاشتراك الاختياري فقط بالأهداف الخاصة/الداخلية الموثوقة. أما خوادم homeserver العامة غير المشفرة مثل
`http://matrix.example.org:8008` فتظل محظورة. ويفضَّل استخدام `https://` كلما أمكن.

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

يمكن للحسابات المسماة تجاوز الافتراضي الأعلى مستوى باستخدام `channels.matrix.accounts.<id>.proxy`.
ويستخدم OpenClaw إعداد الوكيل نفسه لكل من حركة Matrix أثناء التشغيل وعمليات التحقق من حالة الحساب.

## حلّ الأهداف

يقبل Matrix صيغ الأهداف التالية أينما طلب منك OpenClaw هدف غرفة أو مستخدم:

- المستخدمون: `@user:server` أو `user:@user:server` أو `matrix:user:@user:server`
- الغرف: `!room:server` أو `room:!room:server` أو `matrix:room:!room:server`
- الأسماء المستعارة: `#alias:server` أو `channel:#alias:server` أو `matrix:channel:#alias:server`

يستخدم البحث الحي في الدليل حساب Matrix المسجل الدخول:

- تستعلم عمليات البحث عن المستخدمين في دليل مستخدمي Matrix على ذلك homeserver.
- تقبل عمليات البحث عن الغرف معرّفات الغرف والأسماء المستعارة الصريحة مباشرة، ثم تعود إلى البحث في أسماء الغرف المنضم إليها لذلك الحساب.
- يكون البحث في أسماء الغرف المنضم إليها على أساس أفضل جهد. إذا تعذر حل اسم غرفة إلى معرّف أو اسم مستعار، فسيتم تجاهله بواسطة حل قائمة السماح أثناء التشغيل.

## مرجع الإعدادات

- `enabled`: تفعيل القناة أو تعطيلها.
- `name`: تسمية اختيارية للحساب.
- `defaultAccount`: معرّف الحساب المفضل عند إعداد عدة حسابات Matrix.
- `homeserver`: عنوان URL لـ homeserver، مثل `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: السماح لحساب Matrix هذا بالاتصال بخوادم homeserver الخاصة/الداخلية. فعّل هذا عندما يتم حلّ homeserver إلى `localhost` أو عنوان LAN/Tailscale IP أو مضيف داخلي مثل `matrix-synapse`.
- `proxy`: عنوان URL اختياري لوكيل HTTP(S) لحركة Matrix. يمكن للحسابات المسماة تجاوز الافتراضي الأعلى مستوى باستخدام `proxy` الخاص بها.
- `userId`: معرّف مستخدم Matrix الكامل، مثل `@bot:example.org`.
- `accessToken`: رمز الوصول لمصادقة token. القيم النصية الصريحة وقيم SecretRef مدعومة لكل من `channels.matrix.accessToken` و`channels.matrix.accounts.<id>.accessToken` عبر مزوّدي env/file/exec. راجع [إدارة الأسرار](/ar/gateway/secrets).
- `password`: كلمة المرور لتسجيل الدخول المعتمد على كلمة المرور. القيم النصية الصريحة وقيم SecretRef مدعومة.
- `deviceId`: معرّف جهاز Matrix صريح.
- `deviceName`: اسم عرض الجهاز لتسجيل الدخول بكلمة المرور.
- `avatarUrl`: عنوان URL للصورة الرمزية الذاتية المخزنة لمزامنة الملف الشخصي وتحديثات `profile set`.
- `initialSyncLimit`: الحد الأقصى لعدد الأحداث التي يتم جلبها أثناء مزامنة بدء التشغيل.
- `encryption`: تفعيل التشفير من الطرف إلى الطرف.
- `allowlistOnly`: عند ضبطه على `true`، يرقّي سياسة الغرفة `open` إلى `allowlist`، ويفرض على جميع سياسات الرسائل المباشرة النشطة باستثناء `disabled` (بما في ذلك `pairing` و`open`) أن تصبح `allowlist`. لا يؤثر في سياسات `disabled`.
- `allowBots`: السماح بالرسائل من حسابات Matrix الأخرى المهيأة في OpenClaw (`true` أو `"mentions"`).
- `groupPolicy`: `open` أو `allowlist` أو `disabled`.
- `contextVisibility`: وضع ظهور سياق الغرفة الإضافي (`all` أو `allowlist` أو `allowlist_quote`).
- `groupAllowFrom`: قائمة سماح لمعرّفات المستخدمين لحركة الغرف. معرّفات مستخدمي Matrix الكاملة هي الأكثر أمانًا؛ ويتم حلّ التطابقات الدقيقة في الدليل عند بدء التشغيل وعندما تتغير قائمة السماح أثناء تشغيل المراقب. ويتم تجاهل الأسماء غير المحلولة.
- `historyLimit`: الحد الأقصى لرسائل الغرفة التي يتم تضمينها كسياق سجل للمجموعة. يعود إلى `messages.groupChat.historyLimit`؛ وإذا لم يتم ضبط أي منهما، فالقيمة الافتراضية الفعلية هي `0`. اضبط `0` للتعطيل.
- `replyToMode`: `off` أو `first` أو `all` أو `batched`.
- `markdown`: إعداد اختياري لتصيير Markdown لنص Matrix الصادر.
- `streaming`: `off` (الافتراضي)، أو `"partial"`، أو `"quiet"`، أو `true`، أو `false`. يفعّل `"partial"` و`true` تحديثات المسودة بأسلوب المعاينة أولًا باستخدام رسائل Matrix النصية العادية. ويستخدم `"quiet"` إشعارات معاينة غير مُنبِّهة لإعدادات قواعد push ذاتية الاستضافة. وتعادل `false` القيمة `"off"`.
- `blockStreaming`: يؤدي `true` إلى تفعيل رسائل تقدم منفصلة لكتل المساعد المكتملة أثناء نشاط بث معاينة المسودة.
- `threadReplies`: `off` أو `inbound` أو `always`.
- `threadBindings`: تجاوزات لكل قناة لتوجيه الجلسات المرتبط بسلاسل الرسائل ودورة حياتها.
- `startupVerification`: وضع طلب التحقق الذاتي التلقائي عند بدء التشغيل (`if-unverified` أو `off`).
- `startupVerificationCooldownHours`: فترة التهدئة قبل إعادة محاولة طلبات التحقق التلقائي عند بدء التشغيل.
- `textChunkLimit`: حجم مقطع الرسالة الصادرة بالأحرف (يُطبّق عندما يكون `chunkMode` هو `length`).
- `chunkMode`: يقوم `length` بتقسيم الرسائل حسب عدد الأحرف؛ ويقوم `newline` بالتقسيم عند حدود الأسطر.
- `responsePrefix`: سلسلة اختيارية تُسبق بها جميع الردود الصادرة لهذه القناة.
- `ackReaction`: تجاوز اختياري لتفاعل الإقرار لهذه القناة/الحساب.
- `ackReactionScope`: تجاوز اختياري لنطاق تفاعل الإقرار (`group-mentions` أو `group-all` أو `direct` أو `all` أو `none` أو `off`).
- `reactionNotifications`: وضع إشعارات التفاعل الوارد (`own` أو `off`).
- `mediaMaxMb`: الحد الأقصى لحجم الوسائط بالميغابايت لعمليات الإرسال الصادرة ومعالجة الوسائط الواردة.
- `autoJoin`: سياسة الانضمام التلقائي للدعوات (`always` أو `allowlist` أو `off`). الافتراضي: `off`. ينطبق على جميع دعوات Matrix، بما في ذلك الدعوات بأسلوب الرسائل المباشرة.
- `autoJoinAllowlist`: الغرف/الأسماء المستعارة المسموح بها عندما تكون `autoJoin` هي `allowlist`. يتم حلّ إدخالات الأسماء المستعارة إلى معرّفات غرف أثناء معالجة الدعوة؛ ولا يثق OpenClaw بحالة الاسم المستعار التي تدّعيها الغرفة المدعو إليها.
- `dm`: كتلة سياسة الرسائل المباشرة (`enabled` و`policy` و`allowFrom` و`sessionScope` و`threadReplies`).
- `dm.policy`: يتحكم في وصول الرسائل المباشرة بعد انضمام OpenClaw إلى الغرفة وتصنيفها كرسالة مباشرة. ولا يغيّر ما إذا كانت الدعوة ستتم معالجتها بالانضمام التلقائي.
- `dm.allowFrom`: قائمة سماح لمعرّفات المستخدمين لحركة الرسائل المباشرة. معرّفات مستخدمي Matrix الكاملة هي الأكثر أمانًا؛ ويتم حلّ التطابقات الدقيقة في الدليل عند بدء التشغيل وعندما تتغير قائمة السماح أثناء تشغيل المراقب. ويتم تجاهل الأسماء غير المحلولة.
- `dm.sessionScope`: `per-user` (الافتراضي) أو `per-room`. استخدم `per-room` عندما تريد أن يحتفظ كل غرفة رسائل مباشرة في Matrix بسياق منفصل حتى لو كان النظير هو نفسه.
- `dm.threadReplies`: تجاوز لسياسة سلاسل الرسائل للرسائل المباشرة فقط (`off` أو `inbound` أو `always`). وهو يتجاوز إعداد `threadReplies` الأعلى مستوى لكلٍّ من موضع الرد وعزل الجلسة في الرسائل المباشرة.
- `execApprovals`: تسليم موافقات exec الأصلية في Matrix (`enabled` و`approvers` و`target` و`agentFilter` و`sessionFilter`).
- `execApprovals.approvers`: معرّفات مستخدمي Matrix المسموح لهم بالموافقة على طلبات exec. وهو اختياري عندما يكون `dm.allowFrom` يحدد الموافقين بالفعل.
- `execApprovals.target`: ‏`dm | channel | both` (الافتراضي: `dm`).
- `accounts`: تجاوزات مسماة لكل حساب. تعمل القيم العليا في `channels.matrix` كقيم افتراضية لهذه الإدخالات.
- `groups`: خريطة سياسات لكل غرفة. يُفضَّل استخدام معرّفات الغرف أو الأسماء المستعارة؛ ويتم تجاهل أسماء الغرف غير المحلولة أثناء التشغيل. وتستخدم هوية الجلسة/المجموعة معرّف الغرفة الثابت بعد الحل.
- `groups.<room>.account`: قصر إدخال غرفة موروث واحد على حساب Matrix محدد في إعدادات الحسابات المتعددة.
- `groups.<room>.allowBots`: تجاوز على مستوى الغرفة للمرسلين من الروبوتات المهيأة (`true` أو `"mentions"`).
- `groups.<room>.users`: قائمة سماح للمرسلين لكل غرفة.
- `groups.<room>.tools`: تجاوزات السماح/المنع للأدوات لكل غرفة.
- `groups.<room>.autoReply`: تجاوز على مستوى الغرفة لبوابة الإشارات. يؤدي `true` إلى تعطيل متطلبات الإشارة لتلك الغرفة؛ ويؤدي `false` إلى فرضها مجددًا.
- `groups.<room>.skills`: عامل تصفية اختياري لـ Skills على مستوى الغرفة.
- `groups.<room>.systemPrompt`: مقتطف system prompt اختياري على مستوى الغرفة.
- `rooms`: اسم بديل قديم لـ `groups`.
- `actions`: تقييد الأدوات لكل إجراء (`messages` و`reactions` و`pins` و`profile` و`memberInfo` و`channelInfo` و`verification`).

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
