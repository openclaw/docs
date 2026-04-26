---
read_when:
    - إعداد Matrix في OpenClaw
    - تهيئة التشفير من الطرف إلى الطرف في Matrix والتحقق منه
summary: حالة دعم Matrix، والإعداد، وأمثلة على التهيئة
title: Matrix
x-i18n:
    generated_at: "2026-04-26T11:23:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1850d51aba7279a3d495c346809b4df26d7da4b7611c5a8c9ab70f9a2b3c827d
    source_path: channels/matrix.md
    workflow: 15
---

Matrix هو Plugin قناة مضمّن في OpenClaw.
وهو يستخدم `matrix-js-sdk` الرسمي ويدعم الرسائل المباشرة، والغرف، والخيوط، والوسائط، والتفاعلات، والاستطلاعات، والموقع، والتشفير من الطرف إلى الطرف.

## Plugin المضمّن

يأتي Matrix كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا تحتاج الإصدارات المعبأة العادية إلى تثبيت منفصل.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا لا يتضمن Matrix، فثبّته يدويًا:

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

1. تأكد من توفر Plugin Matrix.
   - إصدارات OpenClaw المعبأة الحالية تتضمنه بالفعل.
   - يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا بالأوامر أعلاه.
2. أنشئ حساب Matrix على homeserver الخاص بك.
3. اضبط `channels.matrix` باستخدام أحد الخيارين التاليين:
   - `homeserver` + `accessToken`، أو
   - `homeserver` + `userId` + `password`.
4. أعد تشغيل Gateway.
5. ابدأ رسالة مباشرة مع البوت أو ادعه إلى غرفة.
   - لا تعمل دعوات Matrix الجديدة إلا عندما يسمح بها `channels.matrix.autoJoin`.

مسارات الإعداد التفاعلية:

```bash
openclaw channels add
openclaw configure --section channels
```

يطلب معالج Matrix ما يلي:

- عنوان URL لـ homeserver
- طريقة المصادقة: access token أو كلمة مرور
- معرّف المستخدم (لمصادقة كلمة المرور فقط)
- اسم الجهاز الاختياري
- ما إذا كان يجب تفعيل التشفير من الطرف إلى الطرف
- ما إذا كان يجب ضبط وصول الغرف والانضمام التلقائي للدعوات

السلوكيات الأساسية للمعالج:

- إذا كانت متغيرات بيئة مصادقة Matrix موجودة بالفعل ولم يكن لهذا الحساب مصادقة محفوظة في الإعدادات، فسيعرض المعالج اختصارًا لاستخدام متغيرات البيئة للإبقاء على المصادقة فيها.
- يتم تطبيع أسماء الحسابات إلى معرّف الحساب. على سبيل المثال، يتحول `Ops Bot` إلى `ops-bot`.
- تقبل إدخالات قائمة السماح للرسائل المباشرة `@user:server` مباشرة؛ ولا تعمل أسماء العرض إلا عندما يجد البحث الحي في الدليل تطابقًا واحدًا دقيقًا.
- تقبل إدخالات قائمة السماح للغرف معرّفات الغرف والأسماء المستعارة مباشرة. يُفضَّل استخدام `!room:server` أو `#alias:server`؛ ويتم تجاهل الأسماء غير المحلولة وقت التشغيل عند تحليل قائمة السماح.
- في وضع قائمة السماح للانضمام التلقائي للدعوات، استخدم فقط أهداف الدعوات الثابتة: `!roomId:server` أو `#alias:server` أو `*`. تُرفض أسماء الغرف العادية.
- لحل أسماء الغرف قبل الحفظ، استخدم `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `off`.

إذا تركته بدون تعيين، فلن ينضم البوت إلى الغرف المدعو إليها أو الدعوات الجديدة بنمط الرسائل المباشرة، لذلك لن يظهر في المجموعات الجديدة أو الرسائل المباشرة المدعو إليها إلا إذا انضممت يدويًا أولًا.

عيّن `autoJoin: "allowlist"` مع `autoJoinAllowlist` لتقييد الدعوات التي يقبلها، أو عيّن `autoJoin: "always"` إذا كنت تريده أن ينضم إلى كل دعوة.

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

إعداد بسيط يعتمد على token:

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
عند وجود بيانات اعتماد مؤقتة هناك، يتعامل OpenClaw مع Matrix على أنه مُعدّ للإعداد، وdoctor، واكتشاف حالة القناة حتى إذا لم تكن المصادقة الحالية مضبوطة مباشرة في الإعدادات.

المكافئات في متغيرات البيئة (تُستخدم عندما لا يكون مفتاح الإعداد مضبوطًا):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

للحسابات غير الافتراضية، استخدم متغيرات بيئة خاصة بالحساب:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

مثال للحساب `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

وبالنسبة إلى معرّف الحساب المطبع `ops-bot`، استخدم:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

يهرب Matrix علامات الترقيم في معرّفات الحسابات للحفاظ على خلو متغيرات البيئة الخاصة من التعارضات.
على سبيل المثال، يتحول `-` إلى `_X2D_`، لذلك تتحول `ops-prod` إلى `MATRIX_OPS_X2D_PROD_*`.

لا يعرض المعالج التفاعلي اختصار متغيرات البيئة إلا عندما تكون متغيرات بيئة المصادقة هذه موجودة بالفعل ولم يكن الحساب المحدد يحتوي بالفعل على مصادقة Matrix محفوظة في الإعدادات.

لا يمكن تعيين `MATRIX_HOMESERVER` من ملف `.env` الخاص بمساحة العمل؛ راجع [ملفات `.env` الخاصة بمساحة العمل](/ar/gateway/security).

## مثال على التهيئة

هذا إعداد أساسي عملي مع pairing للرسائل المباشرة، وقائمة سماح للغرف، وتفعيل التشفير من الطرف إلى الطرف:

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

ينطبق `autoJoin` على جميع دعوات Matrix، بما في ذلك الدعوات بنمط الرسائل المباشرة. لا يستطيع OpenClaw
تصنيف الغرفة المدعو إليها بشكل موثوق على أنها رسالة مباشرة أو مجموعة وقت الدعوة، لذلك تمر جميع الدعوات عبر `autoJoin`
أولًا. ويُطبَّق `dm.policy` بعد انضمام البوت وتصنيف الغرفة على أنها رسالة مباشرة.

## معاينات البث

بث الردود في Matrix اختياري.

عيّن `channels.matrix.streaming` إلى `"partial"` عندما تريد أن يرسل OpenClaw رد معاينة حي واحد،
ويعدّل هذه المعاينة في مكانها أثناء توليد النموذج للنص، ثم ينهيها عند اكتمال
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

- `streaming: "off"` هو الافتراضي. ينتظر OpenClaw الرد النهائي ويرسله مرة واحدة.
- ينشئ `streaming: "partial"` رسالة معاينة واحدة قابلة للتعديل لكتلة المساعد الحالية باستخدام رسائل Matrix النصية العادية. يحافظ هذا على سلوك الإشعارات القديم في Matrix الذي يعتمد على المعاينة أولًا، لذلك قد تُرسل التطبيقات القياسية إشعارًا عند أول نص معاينة متدفق بدلًا من الكتلة النهائية المكتملة.
- ينشئ `streaming: "quiet"` إشعار معاينة هادئًا واحدًا قابلًا للتعديل لكتلة المساعد الحالية. استخدم هذا فقط عندما تضبط أيضًا قواعد push لدى المستلمين لتعديلات المعاينة النهائية.
- يفعّل `blockStreaming: true` رسائل تقدم Matrix منفصلة. وعند تفعيل بث المعاينة، يحتفظ Matrix بالمسودة الحية للكتلة الحالية ويحافظ على الكتل المكتملة كرسائل منفصلة.
- عند تفعيل بث المعاينة وتعطيل `blockStreaming`، يعدّل Matrix المسودة الحية في مكانها وينهي الحدث نفسه عند اكتمال الكتلة أو الدور.
- إذا لم تعد المعاينة تتسع في حدث Matrix واحد، يوقف OpenClaw بث المعاينة ويعود إلى التسليم النهائي العادي.
- تظل ردود الوسائط ترسل المرفقات بشكل طبيعي. وإذا تعذر إعادة استخدام معاينة قديمة بأمان، يحذف OpenClaw تنقيحها قبل إرسال رد الوسائط النهائي.
- تتطلب تعديلات المعاينة استدعاءات إضافية إلى Matrix API. اترك البث معطلًا إذا أردت السلوك الأكثر تحفظًا فيما يخص حدود المعدل.

لا يفعّل `blockStreaming` معاينات المسودة بمفرده.
استخدم `streaming: "partial"` أو `streaming: "quiet"` لتعديلات المعاينة؛ ثم أضف `blockStreaming: true` فقط إذا كنت تريد أيضًا بقاء كتل المساعد المكتملة مرئية كرسائل تقدم منفصلة.

إذا كنت بحاجة إلى إشعارات Matrix القياسية دون قواعد push مخصصة، فاستخدم `streaming: "partial"` لسلوك المعاينة أولًا أو اترك `streaming` معطلًا للتسليم النهائي فقط. عند استخدام `streaming: "off"`:

- يرسل `blockStreaming: true` كل كتلة مكتملة كرسالة Matrix عادية تُرسل إشعارًا.
- يرسل `blockStreaming: false` الرد النهائي المكتمل فقط كرسالة Matrix عادية تُرسل إشعارًا.

### قواعد push مستضافة ذاتيًا للمعاينات النهائية الهادئة

لا يرسل البث الهادئ (`streaming: "quiet"`) إشعارًا إلى المستلمين إلا عند إنهاء كتلة أو دور — ويجب أن تطابق قاعدة push لكل مستخدم علامة المعاينة النهائية. راجع [قواعد push في Matrix للمعاينات الهادئة](/ar/channels/matrix-push-rules) للإعداد الكامل (token المستلم، والتحقق من pusher، وتثبيت القاعدة، والملاحظات الخاصة بكل homeserver).

## غرف البوت إلى البوت

افتراضيًا، يتم تجاهل رسائل Matrix الواردة من حسابات OpenClaw Matrix الأخرى المُعدّة.

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

- يقبل `allowBots: true` الرسائل من حسابات Matrix bot الأخرى المُعدّة في الغرف والرسائل المباشرة المسموح بها.
- يقبل `allowBots: "mentions"` هذه الرسائل فقط عندما تذكر هذا البوت صراحة في الغرف. ولا تزال الرسائل المباشرة مسموحًا بها.
- يتجاوز `groups.<room>.allowBots` الإعداد على مستوى الحساب لغرفة واحدة.
- لا يزال OpenClaw يتجاهل الرسائل الواردة من معرّف مستخدم Matrix نفسه لتجنب حلقات الرد الذاتي.
- لا يكشف Matrix عن علامة bot أصلية هنا؛ ويتعامل OpenClaw مع "مكتوب بواسطة bot" على أنه "مُرسل من حساب Matrix مُعدّ آخر على Gateway OpenClaw هذا".

استخدم قوائم سماح صارمة للغرف ومتطلبات الذكر عند تفعيل حركة البوت إلى البوت في الغرف المشتركة.

## التشفير والتحقق

في الغرف المشفرة بالتشفير من الطرف إلى الطرف، تستخدم أحداث الصور الصادرة `thumbnail_file` بحيث تكون معاينات الصور مشفرة إلى جانب المرفق الكامل. أما الغرف غير المشفرة فلا تزال تستخدم `thumbnail_url` العادي. لا يلزم أي إعداد — يكتشف Plugin حالة التشفير من الطرف إلى الطرف تلقائيًا.

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

أوامر التحقق (كلها تقبل `--verbose` للتشخيصات و`--json` لإخراج قابل للقراءة آليًا):

```bash
openclaw matrix verify status
```

حالة مفصلة (تشخيصات كاملة):

```bash
openclaw matrix verify status --verbose
```

تضمين recovery key المخزن في إخراج قابل للقراءة آليًا:

```bash
openclaw matrix verify status --include-recovery-key --json
```

تهيئة bootstrap لحالة cross-signing والتحقق:

```bash
openclaw matrix verify bootstrap
```

تشخيصات bootstrap المفصلة:

```bash
openclaw matrix verify bootstrap --verbose
```

فرض إعادة تعيين جديدة لهوية cross-signing قبل bootstrap:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

التحقق من هذا الجهاز باستخدام recovery key:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

يعرض هذا الأمر ثلاث حالات منفصلة:

- `Recovery key accepted`: قبل Matrix recovery key للتخزين السري أو موثوقية الجهاز.
- `Backup usable`: يمكن تحميل النسخ الاحتياطي لمفاتيح الغرف باستخدام مادة استرداد موثوق بها.
- `Device verified by owner`: يملك جهاز OpenClaw الحالي ثقة كاملة بهوية Matrix عبر cross-signing.

يُعد `Signed by owner` في الإخراج المفصل أو إخراج JSON تشخيصيًا فقط. لا يتعامل OpenClaw
مع ذلك على أنه كافٍ ما لم يكن `Cross-signing verified` أيضًا `yes`.

يظل الأمر يُنهي التنفيذ برمز خروج غير صفري عندما تكون الثقة الكاملة بهوية Matrix غير مكتملة،
حتى إذا كان recovery key قادرًا على فتح مادة النسخ الاحتياطي. في هذه الحالة، أكمل
التحقق الذاتي من عميل Matrix آخر:

```bash
openclaw matrix verify self
```

اقبل الطلب في عميل Matrix آخر، وقارن رموز SAS التعبيرية أو القيم العشرية،
واكتب `yes` فقط عندما تتطابق. ينتظر الأمر حتى يبلّغ Matrix عن
`Cross-signing verified: yes` قبل أن ينتهي بنجاح.

استخدم `verify bootstrap --force-reset-cross-signing` فقط عندما تريد عمدًا
استبدال هوية cross-signing الحالية.

تفاصيل التحقق المفصلة من الجهاز:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

تحقق من سلامة النسخ الاحتياطي لمفاتيح الغرف:

```bash
openclaw matrix verify backup status
```

تشخيصات سلامة النسخ الاحتياطي المفصلة:

```bash
openclaw matrix verify backup status --verbose
```

استعد مفاتيح الغرف من النسخة الاحتياطية على الخادم:

```bash
openclaw matrix verify backup restore
```

إذا لم يكن مفتاح النسخة الاحتياطية محمّلًا بالفعل على القرص، فمرّر Matrix recovery key:

```bash
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
```

تدفق التحقق الذاتي التفاعلي:

```bash
openclaw matrix verify self
```

للطلبات ذات المستوى الأدنى أو طلبات التحقق الواردة، استخدم:

```bash
openclaw matrix verify accept <id>
openclaw matrix verify start <id>
openclaw matrix verify sas <id>
openclaw matrix verify confirm-sas <id>
```

استخدم `openclaw matrix verify cancel <id>` لإلغاء طلب.

تشخيصات الاستعادة المفصلة:

```bash
openclaw matrix verify backup restore --verbose
```

احذف النسخة الاحتياطية الحالية على الخادم وأنشئ خط أساس جديدًا للنسخة الاحتياطية. إذا تعذر
تحميل مفتاح النسخة الاحتياطية المخزن بشكل سليم، فقد تعيد عملية إعادة التعيين هذه أيضًا إنشاء التخزين السري حتى
تتمكن بدايات التشغيل الباردة المستقبلية من تحميل مفتاح النسخة الاحتياطية الجديد:

```bash
openclaw matrix verify backup reset --yes
```

تكون جميع أوامر `verify` موجزة افتراضيًا (بما في ذلك تسجيل SDK الداخلي الهادئ) ولا تعرض تشخيصات مفصلة إلا مع `--verbose`.
استخدم `--json` للحصول على إخراج كامل قابل للقراءة آليًا عند كتابة السكربتات.

في إعدادات الحسابات المتعددة، تستخدم أوامر Matrix CLI حساب Matrix الافتراضي الضمني ما لم تمرر `--account <id>`.
إذا قمت بتهيئة عدة حسابات مسماة، فاضبط أولًا `channels.matrix.defaultAccount` وإلا ستتوقف عمليات CLI الضمنية تلك وتطلب منك اختيار حساب صراحة.
استخدم `--account` كلما أردت أن تستهدف عمليات التحقق أو الجهاز حسابًا مسمى بشكل صريح:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

عندما يكون التشفير معطلًا أو غير متاح لحساب مسمى، تشير تحذيرات Matrix وأخطاء التحقق إلى مفتاح إعدادات ذلك الحساب، مثل `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="ما معنى موثّق">
    يتعامل OpenClaw مع الجهاز على أنه موثّق فقط عندما توقّعه هوية cross-signing الخاصة بك. يعرض `verify status --verbose` ثلاث إشارات ثقة:

    - `Locally trusted`: موثوق به من هذا العميل فقط
    - `Cross-signing verified`: يبلّغ SDK أن التحقق تم عبر cross-signing
    - `Signed by owner`: موقّع بواسطة مفتاح self-signing الخاص بك

    تصبح `Verified by owner` مساوية لـ `yes` فقط عند وجود تحقق عبر cross-signing.
    لا تكفي الثقة المحلية أو توقيع المالك وحده لكي يتعامل OpenClaw مع
    الجهاز على أنه موثّق بالكامل.

  </Accordion>

  <Accordion title="ما الذي يفعله bootstrap">
    يُعد `verify bootstrap` أمر الإصلاح والإعداد للحسابات المشفرة. وبالترتيب، فإنه:

    - يهيّئ التخزين السري، مع إعادة استخدام recovery key موجود عند الإمكان
    - يهيّئ cross-signing ويرفع مفاتيح cross-signing العامة المفقودة
    - يعلّم الجهاز الحالي ويوقّعه عبر cross-signing
    - ينشئ نسخة احتياطية لمفاتيح الغرف على جهة الخادم إذا لم تكن موجودة بالفعل

    إذا كان homeserver يتطلب UIA لرفع مفاتيح cross-signing، فسيحاول OpenClaw أولًا بدون مصادقة، ثم `m.login.dummy`، ثم `m.login.password` (يتطلب `channels.matrix.password`). استخدم `--force-reset-cross-signing` فقط عند الرغبة عمدًا في تجاهل الهوية الحالية.

  </Accordion>

  <Accordion title="خط أساس جديد للنسخة الاحتياطية">
    إذا كنت تريد الإبقاء على الرسائل المشفرة المستقبلية تعمل وتقبل فقدان السجل القديم غير القابل للاسترداد:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    أضف `--account <id>` لاستهداف حساب مسمى. يمكن لهذا أيضًا إعادة إنشاء التخزين السري إذا تعذر تحميل سر النسخة الاحتياطية الحالي بأمان.
    أضف `--rotate-recovery-key` فقط عندما تريد عمدًا أن يتوقف recovery
    key القديم عن فتح خط الأساس الجديد للنسخة الاحتياطية.

  </Accordion>

  <Accordion title="سلوك بدء التشغيل">
    مع `encryption: true`، تكون القيمة الافتراضية لـ `startupVerification` هي `"if-unverified"`. عند بدء التشغيل، يطلب الجهاز غير الموثق التحقق الذاتي في عميل Matrix آخر، مع تخطي الطلبات المكررة وتطبيق فترة تهدئة. اضبط السلوك باستخدام `startupVerificationCooldownHours` أو عطّله باستخدام `startupVerification: "off"`.

    يشغّل بدء التشغيل أيضًا تمريرة bootstrap محافظة للتشفير تعيد استخدام التخزين السري الحالي وهوية cross-signing الحالية. إذا كانت حالة bootstrap معطوبة، يحاول OpenClaw إجراء إصلاح محروس حتى بدون `channels.matrix.password`؛ وإذا كان homeserver يتطلب UIA عبر كلمة المرور، يسجل بدء التشغيل تحذيرًا ويظل غير قاتل. يتم الحفاظ على الأجهزة الموقعة بالفعل من المالك.

    راجع [ترحيل Matrix](/ar/install/migrating-matrix) للحصول على تدفق الترقية الكامل.

  </Accordion>

  <Accordion title="إشعارات التحقق">
    ينشر Matrix إشعارات دورة حياة التحقق في غرفة التحقق ذات الرسائل المباشرة الصارمة كرسائل `m.notice`: الطلب، والجاهزية (مع إرشادات "التحقق عبر الرموز التعبيرية")، والبدء/الاكتمال، وتفاصيل SAS (الرموز التعبيرية/العشرية) عندما تكون متاحة.

    يتم تتبع الطلبات الواردة من عميل Matrix آخر وقبولها تلقائيًا. وللتحقق الذاتي، يبدأ OpenClaw تدفق SAS تلقائيًا ويؤكد جانبه تلقائيًا بمجرد توفر التحقق عبر الرموز التعبيرية — لكن ما زلت بحاجة إلى المقارنة والتأكيد على "They match" في عميل Matrix الخاص بك.

    لا يتم تمرير إشعارات نظام التحقق إلى مسار محادثة الوكيل.

  </Accordion>

  <Accordion title="جهاز Matrix محذوف أو غير صالح">
    إذا أشار `verify status` إلى أن الجهاز الحالي لم يعد مدرجًا على
    homeserver، فأنشئ جهاز Matrix جديدًا لـ OpenClaw. لتسجيل الدخول بكلمة المرور:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    ولمصادقة token، أنشئ access token جديدًا في عميل Matrix أو واجهة الإدارة،
    ثم حدّث OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    استبدل `assistant` بمعرّف الحساب من الأمر الفاشل، أو احذف
    `--account` للحساب الافتراضي.

  </Accordion>

  <Accordion title="نظافة الأجهزة">
    قد تتراكم الأجهزة القديمة التي يديرها OpenClaw. اعرضها ونظّفها:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="مخزن التشفير">
    يستخدم التشفير من الطرف إلى الطرف في Matrix مسار التشفير Rust الرسمي في `matrix-js-sdk` مع `fake-indexeddb` كطبقة IndexedDB بديلة. وتُحفَظ حالة التشفير في `crypto-idb-snapshot.json` (مع أذونات ملفات مقيّدة).

    تعيش حالة التشغيل المشفرة ضمن `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` وتشمل مخزن المزامنة، ومخزن التشفير، وrecovery key، ولقطة IDB، وروابط الخيوط، وحالة التحقق عند بدء التشغيل. وعندما يتغير token مع بقاء هوية الحساب نفسها، يعيد OpenClaw استخدام أفضل جذر موجود حتى تظل الحالة السابقة مرئية.

  </Accordion>
</AccordionGroup>

## إدارة الملف الشخصي

حدّث الملف الشخصي الذاتي في Matrix للحساب المحدد باستخدام:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

أضف `--account <id>` عندما تريد استهداف حساب Matrix مسمى بشكل صريح.

يقبل Matrix عناوين URL للصورة الرمزية من نوع `mxc://` مباشرة. وعندما تمرر عنوان URL للصورة الرمزية من نوع `http://` أو `https://`، يرفع OpenClaw الصورة أولًا إلى Matrix ثم يخزن عنوان `mxc://` الناتج مرة أخرى في `channels.matrix.avatarUrl` (أو في تجاوز الحساب المحدد).

## الخيوط

يدعم Matrix خيوط Matrix الأصلية لكل من الردود التلقائية وعمليات الإرسال عبر أداة الرسائل.

- يبقي `dm.sessionScope: "per-user"` (الافتراضي) توجيه الرسائل المباشرة في Matrix ضمن نطاق المرسل، بحيث يمكن لعدة غرف رسائل مباشرة مشاركة جلسة واحدة عندما تُحل إلى النظير نفسه.
- يعزل `dm.sessionScope: "per-room"` كل غرفة رسائل مباشرة في Matrix ضمن مفتاح جلسة خاص بها مع الاستمرار في استخدام فحوصات المصادقة وقائمة السماح العادية للرسائل المباشرة.
- لا تزال روابط محادثات Matrix الصريحة تتغلب على `dm.sessionScope`، لذلك تحتفظ الغرف والخيوط المرتبطة بالجلسة الهدف التي اختارتها.
- يجعل `threadReplies: "off"` الردود في المستوى الأعلى ويبقي الرسائل الواردة ضمن الخيوط على الجلسة الأصلية.
- يرد `threadReplies: "inbound"` داخل خيط فقط عندما تكون الرسالة الواردة موجودة أصلًا في ذلك الخيط.
- يبقي `threadReplies: "always"` ردود الغرف داخل خيط متجذر في الرسالة المحفزة ويوجه تلك المحادثة عبر الجلسة المطابقة ضمن نطاق الخيط من أول رسالة محفزة.
- يتجاوز `dm.threadReplies` الإعداد الأعلى مستوى للرسائل المباشرة فقط. على سبيل المثال، يمكنك إبقاء خيوط الغرف معزولة مع إبقاء الرسائل المباشرة مسطحة.
- تتضمن الرسائل الواردة ضمن الخيوط رسالة جذر الخيط كسياق إضافي للوكيل.
- ترث عمليات الإرسال عبر أداة الرسائل خيط Matrix الحالي تلقائيًا عندما يكون الهدف هو الغرفة نفسها، أو هدف مستخدم الرسائل المباشرة نفسه، ما لم يتم توفير `threadId` صراحة.
- لا يعمل إعادة استخدام الهدف نفسه ضمن الجلسة نفسها لمستخدم الرسائل المباشرة إلا عندما تثبت بيانات تعريف الجلسة الحالية النظير نفسه في الرسائل المباشرة وعلى حساب Matrix نفسه؛ وإلا يعود OpenClaw إلى التوجيه العادي ضمن نطاق المستخدم.
- عندما يلاحظ OpenClaw أن غرفة رسائل مباشرة في Matrix تتصادم مع غرفة رسائل مباشرة أخرى على جلسة Matrix DM المشتركة نفسها، فإنه ينشر إشعار `m.notice` لمرة واحدة في تلك الغرفة مع منفذ الهروب `/focus` عندما تكون روابط الخيوط مفعلة ومع تلميح `dm.sessionScope`.
- روابط الخيوط وقت التشغيل مدعومة في Matrix. تعمل الأوامر `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` و`/acp spawn` المرتبط بالخيط في غرف Matrix والرسائل المباشرة.
- ينشئ `/focus` على مستوى الغرفة/الرسائل المباشرة في Matrix خيط Matrix جديدًا ويربطه بالجلسة الهدف عندما يكون `threadBindings.spawnSubagentSessions=true`.
- يؤدي تشغيل `/focus` أو `/acp spawn --thread here` داخل خيط Matrix موجود إلى ربط هذا الخيط الحالي بدلًا من ذلك.

## روابط محادثات ACP

يمكن تحويل غرف Matrix والرسائل المباشرة وخيوط Matrix الموجودة إلى مساحات عمل ACP دائمة دون تغيير سطح المحادثة.

تدفق تشغيل سريع:

- شغّل `/acp spawn codex --bind here` داخل الرسالة المباشرة أو الغرفة أو الخيط الموجود في Matrix الذي تريد الاستمرار في استخدامه.
- في رسالة Matrix مباشرة أو غرفة من المستوى الأعلى، يظل سطح المحادثة هو الرسائل المباشرة/الغرفة الحالية وتُوجَّه الرسائل المستقبلية إلى جلسة ACP التي تم إنشاؤها.
- داخل خيط Matrix موجود، يربط `--bind here` ذلك الخيط الحالي في مكانه.
- يعيد `/new` و`/reset` تعيين جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الربط.

ملاحظات:

- لا ينشئ `--bind here` خيط Matrix فرعيًا.
- لا يكون `threadBindings.spawnAcpSessions` مطلوبًا إلا لـ `/acp spawn --thread auto|here`، حيث يحتاج OpenClaw إلى إنشاء خيط Matrix فرعي أو ربطه.

### تهيئة ربط الخيوط

يرث Matrix القيم الافتراضية العامة من `session.threadBindings`، ويدعم أيضًا تجاوزات لكل قناة:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

علامات الإنشاء المرتبط بالخيط في Matrix اختيارية:

- عيّن `threadBindings.spawnSubagentSessions: true` للسماح لـ `/focus` على المستوى الأعلى بإنشاء خيوط Matrix جديدة وربطها.
- عيّن `threadBindings.spawnAcpSessions: true` للسماح لـ `/acp spawn --thread auto|here` بربط جلسات ACP بخيوط Matrix.

## التفاعلات

يدعم Matrix إجراءات التفاعل الصادرة، وإشعارات التفاعل الواردة، وتفاعلات الإقرار الواردة.

- تكون أدوات التفاعل الصادرة محكومة بواسطة `channels["matrix"].actions.reactions`.
- يضيف `react` تفاعلًا إلى حدث Matrix محدد.
- يعرض `reactions` الملخص الحالي للتفاعلات لحدث Matrix محدد.
- يزيل `emoji=""` تفاعلات حساب البوت نفسه على ذلك الحدث.
- يزيل `remove: true` تفاعل الرمز التعبيري المحدد فقط من حساب البوت.

يستخدم نطاق تفاعلات الإقرار ترتيب الحل القياسي في OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- الرمز التعبيري الاحتياطي لهوية الوكيل

يُحل نطاق تفاعل الإقرار بهذا الترتيب:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

يُحل وضع إشعارات التفاعل بهذا الترتيب:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- الافتراضي: `own`

السلوك:

- يمرر `reactionNotifications: "own"` أحداث `m.reaction` المضافة عندما تستهدف رسائل Matrix المكتوبة بواسطة البوت.
- يعطّل `reactionNotifications: "off"` أحداث نظام التفاعل.
- لا يتم توليف عمليات إزالة التفاعل إلى أحداث نظام لأن Matrix يعرضها كعمليات تنقيح، وليس كعمليات إزالة مستقلة لـ `m.reaction`.

## سياق السجل

- يحدد `channels.matrix.historyLimit` عدد رسائل الغرفة الأخيرة التي تُضمَّن كـ `InboundHistory` عندما تؤدي رسالة غرفة Matrix إلى تشغيل الوكيل. ويعود إلى `messages.groupChat.historyLimit`؛ وإذا لم يكن أي منهما مضبوطًا، فالقيمة الافتراضية الفعلية هي `0`. اضبطه على `0` للتعطيل.
- يقتصر سجل غرف Matrix على الغرفة فقط. وتستمر الرسائل المباشرة في استخدام سجل الجلسة العادي.
- يكون سجل غرف Matrix من النوع pending-only: يخزن OpenClaw رسائل الغرفة التي لم تؤدِّ إلى رد بعد، ثم يلتقط لقطة لتلك النافذة عند وصول ذكر أو مُشغّل آخر.
- لا تُضمَّن رسالة المُشغّل الحالية في `InboundHistory`؛ بل تبقى في متن الرسالة الواردة الرئيسي لتلك الدورة.
- تعيد محاولات الحدث نفسه في Matrix استخدام لقطة السجل الأصلية بدلًا من الانجراف إلى رسائل غرفة أحدث.

## ظهور السياق

يدعم Matrix عنصر التحكم المشترك `contextVisibility` للسياق الإضافي للغرفة مثل نص الرد المسترجع، وجذور الخيوط، والسجل المعلّق.

- `contextVisibility: "all"` هو الافتراضي. يتم الاحتفاظ بالسياق الإضافي كما تم استلامه.
- يرشح `contextVisibility: "allowlist"` السياق الإضافي ليقتصر على المرسلين المسموح لهم بحسب فحوصات قائمة السماح النشطة للغرفة/المستخدم.
- يعمل `contextVisibility: "allowlist_quote"` مثل `allowlist`، لكنه يحتفظ أيضًا برد مقتبس صريح واحد.

يؤثر هذا الإعداد في ظهور السياق الإضافي، وليس في ما إذا كانت الرسالة الواردة نفسها يمكن أن تؤدي إلى رد.
ولا يزال تفويض المُشغّل يأتي من إعدادات `groupPolicy` و`groups` و`groupAllowFrom` وسياسة الرسائل المباشرة.

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

راجع [Groups](/ar/channels/groups) لمعرفة سلوك تقييد الذكر وقائمة السماح.

مثال pairing لرسائل Matrix المباشرة:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

إذا استمر مستخدم Matrix غير المعتمد في مراسلتك قبل الموافقة، يعيد OpenClaw استخدام رمز pairing المعلّق نفسه وقد يرسل رد تذكير مرة أخرى بعد فترة تهدئة قصيرة بدلًا من إصدار رمز جديد.

راجع [Pairing](/ar/channels/pairing) لمعرفة تدفق pairing المشترك للرسائل المباشرة وتخطيط التخزين.

## إصلاح الغرفة المباشرة

إذا أصبحت حالة الرسائل المباشرة غير متزامنة، فقد ينتهي الأمر بـ OpenClaw إلى وجود تعيينات `m.direct` قديمة تشير إلى غرف فردية قديمة بدلًا من الرسالة المباشرة الحية. افحص التعيين الحالي لنظير باستخدام:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

وأصلحه باستخدام:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

تدفق الإصلاح:

- يفضّل رسالة مباشرة صارمة 1:1 تكون معيّنة بالفعل في `m.direct`
- يعود إلى أي رسالة مباشرة صارمة 1:1 منضم إليها حاليًا مع ذلك المستخدم
- ينشئ غرفة مباشرة جديدة ويعيد كتابة `m.direct` إذا لم توجد رسالة مباشرة سليمة

لا يحذف تدفق الإصلاح الغرف القديمة تلقائيًا. بل يختار فقط الرسالة المباشرة السليمة ويحدّث التعيين بحيث تستهدف عمليات الإرسال الجديدة في Matrix، وإشعارات التحقق، وغيرها من تدفقات الرسائل المباشرة الغرفة الصحيحة مرة أخرى.

## موافقات exec

يمكن أن يعمل Matrix كعميل موافقة أصلي لحساب Matrix. وتظل
عناصر التحكم الأصلية لتوجيه الرسائل المباشرة/القنوات ضمن إعدادات موافقة exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (اختياري؛ يعود إلى `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

يجب أن يكون الموافقون معرّفات مستخدمي Matrix مثل `@owner:example.org`. يفعّل Matrix الموافقات الأصلية تلقائيًا عندما تكون `enabled` غير مضبوطة أو مساوية لـ `"auto"` ويمكن حلّ موافق واحد على الأقل. تستخدم موافقات exec أولًا `execApprovals.approvers` ويمكن أن تعود إلى `channels.matrix.dm.allowFrom`. وتفوض موافقات Plugin من خلال `channels.matrix.dm.allowFrom`. عيّن `enabled: false` لتعطيل Matrix كعميل موافقة أصلي بشكل صريح. وإلا تعود طلبات الموافقة إلى مسارات الموافقة الأخرى المضبوطة أو إلى سياسة الموافقة الاحتياطية.

يدعم التوجيه الأصلي في Matrix نوعي الموافقات معًا:

- تتحكم `channels.matrix.execApprovals.*` في وضع التوزيع الأصلي للرسائل المباشرة/القنوات لمطالبات الموافقة في Matrix.
- تستخدم موافقات exec مجموعة الموافقين الخاصة بـ exec من `execApprovals.approvers` أو `channels.matrix.dm.allowFrom`.
- تستخدم موافقات Plugin قائمة السماح للرسائل المباشرة في Matrix من `channels.matrix.dm.allowFrom`.
- تنطبق اختصارات التفاعل في Matrix وتحديثات الرسائل على موافقات exec وPlugin معًا.

قواعد التسليم:

- يرسل `target: "dm"` مطالبات الموافقة إلى الرسائل المباشرة للموافقين
- يرسل `target: "channel"` المطالبة مرة أخرى إلى غرفة أو رسالة Matrix المباشرة الأصلية
- يرسل `target: "both"` إلى الرسائل المباشرة للموافقين وإلى غرفة أو رسالة Matrix المباشرة الأصلية

تزرع مطالبات الموافقة في Matrix اختصارات التفاعل على رسالة الموافقة الأساسية:

- `✅` = السماح مرة واحدة
- `❌` = الرفض
- `♾️` = السماح دائمًا عندما يكون هذا القرار مسموحًا به وفق سياسة exec الفعلية

يمكن للموافقين التفاعل على تلك الرسالة أو استخدام أوامر slash الاحتياطية: `/approve <id> allow-once` أو `/approve <id> allow-always` أو `/approve <id> deny`.

لا يمكن إلا للموافقين الذين تم حلهم الموافقة أو الرفض. وبالنسبة إلى موافقات exec، يتضمن التسليم عبر القناة نص الأمر، لذا لا تفعّل `channel` أو `both` إلا في الغرف الموثوق بها.

تجاوز لكل حساب:

- `channels.matrix.accounts.<account>.execApprovals`

المستندات ذات الصلة: [Exec approvals](/ar/tools/exec-approvals)

## أوامر slash

تعمل أوامر slash في Matrix (مثل `/new` و`/reset` و`/model`) مباشرة في الرسائل المباشرة. وفي الغرف، يتعرف OpenClaw أيضًا على أوامر slash التي تسبقها إشارة Matrix الخاصة بالبوت نفسه، لذلك يؤدي `@bot:server /new` إلى تشغيل مسار الأمر من دون الحاجة إلى تعبير منتظم مخصص للإشارة. وهذا يحافظ على استجابة البوت لمنشورات `@mention /command` على نمط الغرف التي يصدرها Element والعملاء المشابهون عندما يكمل المستخدم اسم البوت قبل كتابة الأمر.

لا تزال قواعد التفويض سارية: يجب أن يستوفي مرسلو الأوامر سياسات قائمة السماح/المالك الخاصة بالرسائل المباشرة أو الغرف تمامًا مثل الرسائل العادية.

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

تعمل قيم `channels.matrix` ذات المستوى الأعلى كقيم افتراضية للحسابات المسماة ما لم يتجاوزها أحد الحسابات.
يمكنك تقييد إدخالات الغرف الموروثة إلى حساب Matrix واحد باستخدام `groups.<room>.account`.
وتظل الإدخالات التي لا تحتوي على `account` مشتركة بين جميع حسابات Matrix، كما تظل الإدخالات التي تحتوي على `account: "default"` تعمل عندما يكون الحساب الافتراضي مضبوطًا مباشرة على المستوى الأعلى في `channels.matrix.*`.
لا تؤدي القيم الافتراضية الجزئية المشتركة للمصادقة إلى إنشاء حساب افتراضي ضمني منفصل بمفردها. لا يُنشئ OpenClaw حساب `default` على المستوى الأعلى إلا عندما تكون لهذا الحساب الافتراضي مصادقة حديثة (`homeserver` مع `accessToken`، أو `homeserver` مع `userId` و`password`)؛ ويمكن للحسابات المسماة أن تظل قابلة للاكتشاف من `homeserver` مع `userId` عندما تفي بيانات الاعتماد المخزنة مؤقتًا بالمصادقة لاحقًا.
إذا كان لدى Matrix بالفعل حساب مسمى واحد بالضبط، أو كان `defaultAccount` يشير إلى مفتاح حساب مسمى موجود، فإن ترقية الإصلاح/الإعداد من حساب واحد إلى حسابات متعددة تحافظ على ذلك الحساب بدلًا من إنشاء إدخال `accounts.default` جديد. ولا تُنقل إلى ذلك الحساب المُرقّى إلا مفاتيح مصادقة/Bootstrap الخاصة بـ Matrix؛ بينما تبقى مفاتيح سياسة التسليم المشتركة في المستوى الأعلى.
عيّن `defaultAccount` عندما تريد أن يفضّل OpenClaw حساب Matrix مسمى واحدًا للتوجيه الضمني، والفحص، وعمليات CLI.
إذا كانت هناك عدة حسابات Matrix مضبوطة وكان أحد معرّفات الحسابات هو `default`، يستخدم OpenClaw ذلك الحساب ضمنيًا حتى إذا كانت `defaultAccount` غير مضبوطة.
إذا قمت بتهيئة عدة حسابات مسماة، فاضبط `defaultAccount` أو مرّر `--account <id>` لأوامر CLI التي تعتمد على التحديد الضمني للحساب.
مرّر `--account <id>` إلى `openclaw matrix verify ...` و`openclaw matrix devices ...` عندما تريد تجاوز هذا التحديد الضمني لأمر واحد.

راجع [المرجع الخاص بالإعداد](/ar/gateway/config-channels#multi-account-all-channels) لمعرفة النمط المشترك للحسابات المتعددة.

## homeservers الخاصة/على الشبكة المحلية

افتراضيًا، يحظر OpenClaw homeservers الخاصة/الداخلية في Matrix للحماية من SSRF ما لم
تشترك صراحة لكل حساب.

إذا كان homeserver يعمل على localhost أو عنوان IP على LAN/Tailscale أو اسم مضيف داخلي، ففعّل
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

يسمح هذا الاشتراك فقط بالأهداف الخاصة/الداخلية الموثوق بها. أما homeservers العامة ذات النص الصريح مثل
`http://matrix.example.org:8008` فتبقى محظورة. ويُفضَّل استخدام `https://` متى أمكن.

## تمرير حركة Matrix عبر Proxy

إذا كان نشر Matrix لديك يحتاج إلى Proxy HTTP(S) صادر صريح، فاضبط `channels.matrix.proxy`:

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

يمكن للحسابات المسماة تجاوز القيمة الافتراضية في المستوى الأعلى باستخدام `channels.matrix.accounts.<id>.proxy`.
ويستخدم OpenClaw إعداد Proxy نفسه لحركة Matrix وقت التشغيل وعمليات فحص حالة الحساب.

## حل الهدف

يقبل Matrix صيغ الأهداف التالية في أي مكان يطلب منك فيه OpenClaw هدف غرفة أو مستخدم:

- المستخدمون: `@user:server` أو `user:@user:server` أو `matrix:user:@user:server`
- الغرف: `!room:server` أو `room:!room:server` أو `matrix:room:!room:server`
- الأسماء المستعارة: `#alias:server` أو `channel:#alias:server` أو `matrix:channel:#alias:server`

تكون معرّفات غرف Matrix حساسة لحالة الأحرف. استخدم الحالة الدقيقة لمعرّف الغرفة من Matrix
عند تهيئة أهداف التسليم الصريحة، أو وظائف Cron، أو الروابط، أو قوائم السماح.
ويحتفظ OpenClaw بمفاتيح الجلسات الداخلية بصيغة معيارية للتخزين، لذا فإن هذه المفاتيح
المكتوبة بأحرف صغيرة ليست مصدرًا موثوقًا لمعرّفات التسليم في Matrix.

يستخدم البحث الحي في الدليل حساب Matrix الذي تم تسجيل الدخول به:

- تستعلم عمليات البحث عن المستخدمين من دليل مستخدمي Matrix على ذلك الـ homeserver.
- تقبل عمليات البحث عن الغرف معرّفات الغرف والأسماء المستعارة الصريحة مباشرة، ثم تعود إلى البحث في أسماء الغرف المنضم إليها لذلك الحساب.
- يكون البحث عن أسماء الغرف المنضم إليها من نوع best-effort. وإذا تعذر حل اسم الغرفة إلى معرّف أو اسم مستعار، فسيتم تجاهله عند حل قائمة السماح وقت التشغيل.

## مرجع التهيئة

- `enabled`: تفعيل القناة أو تعطيلها.
- `name`: تسمية اختيارية للحساب.
- `defaultAccount`: معرّف الحساب المفضل عند تهيئة عدة حسابات Matrix.
- `homeserver`: عنوان URL لـ homeserver، مثل `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: السماح لهذا الحساب في Matrix بالاتصال بـ homeservers الخاصة/الداخلية. فعّل هذا عندما يُحل الـ homeserver إلى `localhost` أو عنوان IP على LAN/Tailscale أو مضيف داخلي مثل `matrix-synapse`.
- `proxy`: عنوان URL اختياري لـ Proxy ‏HTTP(S) لحركة Matrix. يمكن للحسابات المسماة تجاوز القيمة الافتراضية في المستوى الأعلى باستخدام `proxy` الخاص بها.
- `userId`: معرّف مستخدم Matrix الكامل، مثل `@bot:example.org`.
- `accessToken`: access token للمصادقة المعتمدة على token. تُدعَم القيم النصية الصريحة وقيم SecretRef لكلٍّ من `channels.matrix.accessToken` و`channels.matrix.accounts.<id>.accessToken` عبر موفري env/file/exec. راجع [Secrets Management](/ar/gateway/secrets).
- `password`: كلمة المرور لتسجيل الدخول المعتمد على كلمة المرور. تُدعَم القيم النصية الصريحة وقيم SecretRef.
- `deviceId`: معرّف جهاز Matrix صريح.
- `deviceName`: اسم عرض الجهاز لتسجيل الدخول بكلمة المرور.
- `avatarUrl`: عنوان URL المخزن للصورة الرمزية الذاتية لمزامنة الملف الشخصي وتحديثات `profile set`.
- `initialSyncLimit`: الحد الأقصى لعدد الأحداث التي يتم جلبها أثناء مزامنة بدء التشغيل.
- `encryption`: تفعيل التشفير من الطرف إلى الطرف.
- `allowlistOnly`: عندما تكون قيمته `true`، فإنه يرقّي سياسة الغرف `open` إلى `allowlist`، ويفرض جميع سياسات الرسائل المباشرة النشطة باستثناء `disabled` (بما في ذلك `pairing` و`open`) لتصبح `allowlist`. ولا يؤثر في سياسات `disabled`.
- `allowBots`: السماح بالرسائل من حسابات OpenClaw Matrix الأخرى المُعدّة (`true` أو `"mentions"`).
- `groupPolicy`: `open` أو `allowlist` أو `disabled`.
- `contextVisibility`: وضع ظهور سياق الغرفة الإضافي (`all` أو `allowlist` أو `allowlist_quote`).
- `groupAllowFrom`: قائمة سماح لمعرّفات المستخدمين لحركة الغرف. تكون معرّفات مستخدمي Matrix الكاملة هي الأكثر أمانًا؛ ويتم حل تطابقات الدليل الدقيقة عند بدء التشغيل وعند تغير قائمة السماح أثناء عمل المراقب. ويتم تجاهل الأسماء غير المحلولة.
- `historyLimit`: الحد الأقصى لرسائل الغرف التي تُضمَّن كسياق سجل المجموعة. ويعود إلى `messages.groupChat.historyLimit`؛ وإذا لم يكن أي منهما مضبوطًا، فالقيمة الافتراضية الفعلية هي `0`. اضبطه على `0` للتعطيل.
- `replyToMode`: `off` أو `first` أو `all` أو `batched`.
- `markdown`: إعداد اختياري لتصيير Markdown للنص الصادر في Matrix.
- `streaming`: `off` (الافتراضي) أو `"partial"` أو `"quiet"` أو `true` أو `false`. يؤدي `"partial"` و`true` إلى تفعيل تحديثات المسودة بأسلوب المعاينة أولًا باستخدام رسائل Matrix النصية العادية. ويستخدم `"quiet"` إشعارات معاينة غير مُبلِّغة لإعدادات قواعد push المستضافة ذاتيًا. ويكافئ `false` القيمة `"off"`.
- `blockStreaming`: يؤدي `true` إلى تفعيل رسائل تقدم منفصلة لكتل المساعد المكتملة أثناء نشاط بث معاينة المسودة.
- `threadReplies`: `off` أو `inbound` أو `always`.
- `threadBindings`: تجاوزات لكل قناة لتوجيه الجلسات المرتبطة بالخيوط ودورة حياتها.
- `startupVerification`: وضع طلب التحقق الذاتي التلقائي عند بدء التشغيل (`if-unverified` أو `off`).
- `startupVerificationCooldownHours`: فترة التهدئة قبل إعادة محاولة طلبات التحقق التلقائي عند بدء التشغيل.
- `textChunkLimit`: حجم تقسيم الرسالة الصادرة بالأحرف (يُطبَّق عندما تكون `chunkMode` هي `length`).
- `chunkMode`: تقوم `length` بتقسيم الرسائل حسب عدد الأحرف؛ وتقوم `newline` بالتقسيم عند حدود الأسطر.
- `responsePrefix`: سلسلة اختيارية تُضاف في بداية كل الردود الصادرة لهذه القناة.
- `ackReaction`: تجاوز اختياري لتفاعل الإقرار لهذه القناة/الحساب.
- `ackReactionScope`: تجاوز اختياري لنطاق تفاعل الإقرار (`group-mentions` أو `group-all` أو `direct` أو `all` أو `none` أو `off`).
- `reactionNotifications`: وضع إشعارات التفاعل الواردة (`own` أو `off`).
- `mediaMaxMb`: الحد الأقصى لحجم الوسائط بالميغابايت لعمليات الإرسال الصادرة ومعالجة الوسائط الواردة.
- `autoJoin`: سياسة الانضمام التلقائي للدعوات (`always` أو `allowlist` أو `off`). الافتراضي: `off`. ينطبق على جميع دعوات Matrix، بما في ذلك الدعوات بنمط الرسائل المباشرة.
- `autoJoinAllowlist`: الغرف/الأسماء المستعارة المسموح بها عندما تكون `autoJoin` مساوية لـ `allowlist`. يتم حل إدخالات الأسماء المستعارة إلى معرّفات غرف أثناء معالجة الدعوات؛ ولا يثق OpenClaw في حالة الاسم المستعار التي تدّعيها الغرفة المدعو إليها.
- `dm`: كتلة سياسة الرسائل المباشرة (`enabled` و`policy` و`allowFrom` و`sessionScope` و`threadReplies`).
- `dm.policy`: يتحكم في الوصول إلى الرسائل المباشرة بعد انضمام OpenClaw إلى الغرفة وتصنيفها كرسالة مباشرة. ولا يغير ما إذا كانت الدعوة ستنضم تلقائيًا.
- `dm.allowFrom`: قائمة سماح لمعرّفات المستخدمين لحركة الرسائل المباشرة. تكون معرّفات مستخدمي Matrix الكاملة هي الأكثر أمانًا؛ ويتم حل تطابقات الدليل الدقيقة عند بدء التشغيل وعند تغير قائمة السماح أثناء عمل المراقب. ويتم تجاهل الأسماء غير المحلولة.
- `dm.sessionScope`: `per-user` (الافتراضي) أو `per-room`. استخدم `per-room` عندما تريد أن يحتفظ كل غرفة رسائل مباشرة في Matrix بسياق منفصل حتى إذا كان النظير هو نفسه.
- `dm.threadReplies`: تجاوز لسياسة الخيوط خاص بالرسائل المباشرة (`off` أو `inbound` أو `always`). ويتجاوز إعداد `threadReplies` في المستوى الأعلى لكل من موضع الرد وعزل الجلسة في الرسائل المباشرة.
- `execApprovals`: تسليم موافقات exec الأصلي في Matrix (`enabled` و`approvers` و`target` و`agentFilter` و`sessionFilter`).
- `execApprovals.approvers`: معرّفات مستخدمي Matrix المسموح لهم بالموافقة على طلبات exec. وهو اختياري عندما تكون `dm.allowFrom` تحدد الموافقين بالفعل.
- `execApprovals.target`: `dm | channel | both` (الافتراضي: `dm`).
- `accounts`: تجاوزات مسماة لكل حساب. وتعمل قيم `channels.matrix` في المستوى الأعلى كقيم افتراضية لهذه الإدخالات.
- `groups`: خريطة سياسات لكل غرفة. يُفضَّل استخدام معرّفات الغرف أو الأسماء المستعارة؛ ويتم تجاهل أسماء الغرف غير المحلولة وقت التشغيل. وتستخدم هوية الجلسة/المجموعة معرّف الغرفة الثابت بعد الحل.
- `groups.<room>.account`: يقيّد إدخال غرفة موروثًا واحدًا إلى حساب Matrix محدد في إعدادات الحسابات المتعددة.
- `groups.<room>.allowBots`: تجاوز على مستوى الغرفة للمرسلين من البوتات المُعدّة (`true` أو `"mentions"`).
- `groups.<room>.users`: قائمة سماح للمرسلين لكل غرفة.
- `groups.<room>.tools`: تجاوزات السماح/المنع للأدوات لكل غرفة.
- `groups.<room>.autoReply`: تجاوز على مستوى الغرفة لتقييد الذكر. تؤدي `true` إلى تعطيل متطلبات الذكر لتلك الغرفة؛ وتؤدي `false` إلى فرضها مجددًا.
- `groups.<room>.skills`: عامل تصفية اختياري للـ Skills على مستوى الغرفة.
- `groups.<room>.systemPrompt`: مقطع اختياري من system prompt على مستوى الغرفة.
- `rooms`: اسم مستعار قديم لـ `groups`.
- `actions`: تقييد الأدوات لكل إجراء (`messages` و`reactions` و`pins` و`profile` و`memberInfo` و`channelInfo` و`verification`).

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [Pairing](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق pairing
- [Groups](/ar/channels/groups) — سلوك محادثات المجموعات وتقييد الذكر
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
