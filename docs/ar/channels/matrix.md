---
read_when:
    - إعداد Matrix في OpenClaw
    - إعداد التشفير من طرف إلى طرف والتحقق في Matrix
summary: حالة دعم Matrix وإعداده وأمثلة تهيئته
title: مصفوفة
x-i18n:
    generated_at: "2026-07-12T05:34:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42f1775d1f92198d1eafdd8f3e07fcb6921bdc4a5c095ce3e793c260e037e06f
    source_path: channels/matrix.md
    workflow: 16
---

Matrix هو Plugin قناة قابل للتنزيل (`@openclaw/matrix`) مبني على حزمة `matrix-js-sdk` الرسمية. وهو يدعم الرسائل المباشرة والغرف وسلاسل المحادثات والوسائط والتفاعلات والاستطلاعات والموقع والتشفير من طرف إلى طرف (E2EE).

## التثبيت

```bash
openclaw plugins install @openclaw/matrix
```

تحاول مواصفات Plugin المجرّدة استخدام ClawHub أولًا، ثم تلجأ إلى npm. لفرض مصدر، استخدم `openclaw plugins install clawhub:@openclaw/matrix` أو `npm:@openclaw/matrix`. ومن نسخة محلية من المستودع: `openclaw plugins install ./path/to/local/matrix-plugin`.

يسجّل `plugins install` Plugin ويفعّله؛ ولا حاجة إلى خطوة `enable` منفصلة. ومع ذلك، لن تفعل القناة شيئًا حتى تُضبط كما هو موضح أدناه. راجع [Plugins](/ar/tools/plugin) للاطلاع على قواعد التثبيت العامة.

## الإعداد

1. أنشئ حساب Matrix على خادمك المنزلي.
2. اضبط `channels.matrix` باستخدام `homeserver` + `accessToken`، أو `homeserver` + `userId` + `password`.
3. أعد تشغيل Gateway.
4. ابدأ رسالة مباشرة مع الروبوت، أو ادعه إلى غرفة. لا تُقبل الدعوات الجديدة إلا عندما يسمح بها [`autoJoin`](#auto-join).

### الإعداد التفاعلي

```bash
openclaw channels add
openclaw configure --section channels
```

يطلب المعالج عنوان URL للخادم المنزلي، وطريقة المصادقة (رمز وصول أو كلمة مرور)، ومعرّف المستخدم (لمصادقة كلمة المرور فقط)، واسم جهاز اختياريًا، وما إذا كان ينبغي تمكين E2EE، وإعدادات الوصول إلى الغرف والانضمام التلقائي. إذا كانت متغيرات البيئة المطابقة `MATRIX_*` موجودة بالفعل ولم يكن الحساب يحتوي على بيانات مصادقة محفوظة، يعرض المعالج اختصارًا لاستخدام متغيرات البيئة. حوّل أسماء الغرف إلى معرّفات قبل حفظ قائمة السماح باستخدام `openclaw channels resolve --channel matrix "Project Room"`. يؤدي تمكين E2EE في المعالج إلى تشغيل عملية التمهيد نفسها التي يشغّلها [`openclaw matrix encryption setup`](#encryption-and-verification).

### الحد الأدنى من الإعداد

بالاعتماد على رمز وصول:

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

بالاعتماد على كلمة مرور (يُخزّن رمز الوصول مؤقتًا بعد تسجيل الدخول الأول):

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

القيمة الافتراضية لـ `channels.matrix.autoJoin` هي `"off"`: لن يظهر الروبوت في الغرف أو الرسائل المباشرة الجديدة الناتجة عن دعوات جديدة حتى تنضم يدويًا. لا يستطيع OpenClaw تحديد ما إذا كانت الدعوة إلى رسالة مباشرة أم إلى مجموعة وقت وصولها، لذا تمر كل دعوة أولًا عبر `autoJoin`؛ ولا تُطبّق `dm.policy` إلا لاحقًا، بعد انضمام الروبوت وتصنيف الغرفة.

<Warning>
اضبط `autoJoin: "allowlist"` مع `autoJoinAllowlist` لتقييد الدعوات المقبولة، أو اضبط `autoJoin: "always"` لقبول كل دعوة.

لا تقبل `autoJoinAllowlist` سوى `!roomId:server` أو `#alias:server` أو `*`. تُرفض أسماء الغرف العادية؛ وتُحل الأسماء المستعارة بالرجوع إلى الخادم المنزلي، لا إلى الحالة التي تدّعيها الغرفة الداعية.
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

### تنسيقات أهداف قائمة السماح

- الرسائل المباشرة (`dm.allowFrom` و`groupAllowFrom` و`groups.<room>.users`): استخدم `@user:server`. تُتجاهل أسماء العرض افتراضيًا لأنها قابلة للتغيير؛ اضبط `dangerouslyAllowNameMatching: true` فقط لتحقيق توافق صريح يعتمد على اسم العرض.
- مفاتيح قائمة سماح الغرف (`groups` والاسم المستعار القديم `rooms`): استخدم `!room:server` أو `#alias:server`. تُتجاهل الأسماء العادية ما لم يُضبط `dangerouslyAllowNameMatching: true`.
- قوائم سماح الدعوات (`autoJoinAllowlist`): استخدم `!room:server` أو `#alias:server` أو `*`. تُرفض الأسماء العادية دائمًا.

### توحيد معرّف الحساب

يحوّل المعالج الاسم السهل القراءة إلى معرّف حساب موحّد (`Ops Bot` -> `ops-bot`). تُرمّز علامات الترقيم بالنظام الست عشري في أسماء متغيرات البيئة محددة النطاق لمنع تعارض الحسابات: يتحول `-` (0x2D) إلى `_X2D_`، لذا يُطابق `ops-prod` بادئة البيئة `MATRIX_OPS_X2D_PROD_`.

### بيانات الاعتماد المخزّنة مؤقتًا

يخزّن Matrix بيانات الاعتماد مؤقتًا ضمن `~/.openclaw/credentials/matrix/`: الملف `credentials.json` للحساب الافتراضي، والملف `credentials-<account>.json` للحسابات المسماة. عند وجود بيانات اعتماد مخزّنة مؤقتًا، يعامل OpenClaw قناة Matrix على أنها مضبوطة حتى من دون وجود `accessToken` في ملف الإعداد؛ ويشمل ذلك الإعداد و`openclaw doctor` وعمليات التحقق من حالة القناة.

### متغيرات البيئة

تُستخدم متغيرات البيئة المرتبطة بمفاتيح الإعداد عندما لا يكون مفتاح الإعداد المكافئ مضبوطًا. يستخدم الحساب الافتراضي أسماء بلا بادئة؛ وتُدرج الحسابات المسماة رمز الحساب قبل اللاحقة (راجع [التوحيد](#account-id-normalization)).

| الحساب الافتراضي       | الحساب المسمى (`<ID>` = رمز الحساب) |
| --------------------- | -------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`               |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`             |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                  |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                 |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`              |

بالنسبة إلى الحساب `ops`، تصبح الأسماء `MATRIX_OPS_HOMESERVER` و`MATRIX_OPS_ACCESS_TOKEN` وهكذا. لا يمكن ضبط `MATRIX_HOMESERVER` (ولا أي صيغة محددة النطاق من `*_HOMESERVER`) من ملف `.env` لمساحة العمل؛ راجع [ملفات `.env` لمساحة العمل](/ar/gateway/security).

<Note>
مفتاح الاسترداد ليس متغير بيئة مدعومًا بمفتاح إعداد: لا يقرأه OpenClaw مطلقًا من البيئة نفسها. يقترح النص الإرشادي في CLI تمريره عبر متغير صدفة باسم `MATRIX_RECOVERY_KEY` للحساب الافتراضي، أو `MATRIX_RECOVERY_KEY_<ID>` لحساب مسمى (معرّف الحساب بأحرف كبيرة عادية، من دون ترميز ست عشري)؛ راجع [التحقق من هذا الجهاز باستخدام مفتاح استرداد](#verify-this-device-with-a-recovery-key).
</Note>

## مثال على الإعداد

خط أساس عملي يتضمن إقران الرسائل المباشرة وقائمة سماح للغرف وE2EE:

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

## المعاينات المتدفقة

يكون تدفق ردود Matrix اختياريًا. يتحكم `streaming` في كيفية تسليم OpenClaw رد المساعد الجاري إنشاؤه؛ بينما يتحكم `blockStreaming` في إبقاء كل كتلة مكتملة كرسالة Matrix مستقلة.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

للاحتفاظ بمعاينات مباشرة للإجابة مع إخفاء سطور الأدوات والتقدم المؤقتة، استخدم صيغة الكائن:

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

- `progress.label`: تسمية مخصصة، أو `"auto"`/غير مضبوطة لاختيار تسمية مضبوطة أو مضمّنة، أو `false` لإخفائها.
- `progress.labels`: خيارات تُستخدم فقط عندما تكون `label` هي `"auto"` أو غير مضبوطة.
- `progress.maxLines`: أقصى عدد من سطور التقدم المتجددة المحفوظة في المسودة؛ وتُزال السطور الأقدم عند تجاوز هذا الحد.
- `progress.maxLineChars`: أقصى عدد من المحارف في كل سطر تقدم موجز قبل اقتطاعه.
- `progress.toolProgress`: عندما تكون `true` (الافتراضي)، يظهر نشاط الأدوات والتقدم المباشر في المسودة.

| `streaming`       | السلوك                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (الافتراضي) | ينتظر الرد الكامل ويرسله مرة واحدة. `true` <-> `"partial"`، و`false` <-> `"off"`.                                                                         |
| `"partial"`       | يعدّل رسالة نصية عادية واحدة في موضعها أثناء كتابة النموذج للكتلة الحالية. قد ترسل التطبيقات القياسية إشعارًا عند المعاينة الأولى، لا عند التعديل النهائي.          |
| `"quiet"`         | مماثل لـ `"partial"`، لكن الرسالة إشعار غير مولّد لتنبيه. يُخطَر المستلمون مرة واحدة عندما تطابق قاعدة دفع خاصة بالمستخدم التعديل النهائي (راجع أدناه). |
| `"progress"`      | يرسل سطور تقدم موجزة منفردة باستخدام مسودة تقدم.                                                                                          |

يعمل `blockStreaming` (الافتراضي `false`) بصورة مستقلة عن `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (الافتراضي)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | مسودة مباشرة للكتلة الحالية، مع إبقاء الكتل المكتملة كرسائل | مسودة مباشرة للكتلة الحالية، تُعتمد نهائيًا في موضعها |
| `"off"`                 | رسالة Matrix واحدة مولّدة لتنبيه لكل كتلة مكتملة                     | رسالة Matrix واحدة مولّدة لتنبيه للرد الكامل      |

ملاحظات:

- إذا تجاوز حجم المعاينة الحد الأقصى لحجم الحدث في Matrix، يوقف OpenClaw تدفق المعاينة ويلجأ إلى التسليم النهائي فقط.
- ترسل ردود الوسائط المرفقات بالطريقة المعتادة دائمًا؛ وإذا تعذّر إعادة استخدام معاينة قديمة بأمان، يحذفها OpenClaw قبل إرسال رد الوسائط النهائي.
- تكون تحديثات معاينة تقدم الأدوات مفعّلة افتراضيًا عند تفعيل تدفق المعاينة. اضبط `streaming.preview.toolProgress: false` للاحتفاظ بتعديلات معاينة نص الإجابة مع إبقاء تقدم الأدوات ضمن مسار التسليم العادي.
- تتطلب تعديلات المعاينة استدعاءات إضافية لـ Matrix API. اترك `streaming: "off"` للحصول على أكثر أنماط حدود المعدل تحفظًا.

## الرسائل الصوتية

تُنسخ الملاحظات الصوتية الواردة من Matrix قبل بوابة الإشارة في الغرفة، لذا يمكن لملاحظة صوتية تذكر اسم الروبوت تشغيل الوكيل في غرفة مضبوطة على `requireMention: true`، ويتلقى الوكيل النص المنسوخ بدلًا من تلقي عنصر نائب لمرفق صوتي فقط.

يستخدم Matrix موفّر الوسائط الصوتية المشترك ضمن `tools.media.audio`، مثل OpenAI `gpt-4o-mini-transcribe`. راجع [نظرة عامة على أدوات الوسائط](/ar/tools/media-overview) لإعداد الموفّر وحدوده.

- تكون أحداث `m.audio` وأحداث `m.file` ذات نوع MIME من النمط `audio/*` مؤهلة.
- في الغرف المشفرة، يفك OpenClaw تشفير المرفق عبر مسار وسائط Matrix الحالي قبل نسخه.
- يُوسم النص المنسوخ بأنه مولّد آليًا وغير موثوق به في مطالبة الوكيل.
- يُوسم المرفق بأنه نُسخ بالفعل حتى لا تنسخه أدوات الوسائط اللاحقة مرة أخرى.
- اضبط `tools.media.audio.enabled: false` لتعطيل نسخ الصوت عالميًا.

## بيانات اعتماد الموافقة الوصفية

مطالبات الموافقة الأصلية في Matrix هي أحداث `m.room.message` عادية تتضمن محتوى خاصًا بـ OpenClaw ضمن المفتاح `com.openclaw.approval`. تظل التطبيقات القياسية تعرض النص؛ ويمكن للتطبيقات المتوافقة مع OpenClaw قراءة معرّف الموافقة ونوعها وحالتها وقراراتها وتفاصيل التنفيذ أو Plugin المنظمة.

عندما تكون المطالبة أطول من أن تتسع في حدث Matrix واحد، يقسّم OpenClaw النص المرئي إلى أجزاء ويرفق `com.openclaw.approval` بالجزء الأول فقط. ترتبط تفاعلات السماح والرفض بذلك الحدث الأول، لذا تحتفظ المطالبات الطويلة بهدف الموافقة نفسه المستخدم في المطالبات ذات الحدث الواحد.

### قواعد الدفع ذاتي الاستضافة للمعاينات النهائية الهادئة

لا يُشعِر `streaming: "quiet"` المستلمين إلا بعد إنهاء كتلة أو دورة - ويجب أن تتطابق قاعدة دفع خاصة بكل مستخدم مع علامة المعاينة النهائية. راجع [قواعد دفع Matrix للمعاينات الهادئة](/ar/channels/matrix-push-rules) للاطلاع على الوصفة الكاملة.

## الغرف بين الروبوتات

افتراضيًا، تُتجاهل رسائل Matrix الواردة من حسابات Matrix أخرى مُهيأة في OpenClaw. استخدم `allowBots` للسماح عمدًا بحركة البيانات بين الوكلاء:

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

- يقبل `allowBots: true` الرسائل الواردة من حسابات روبوتات Matrix المُهيأة الأخرى في الغرف والرسائل المباشرة المسموح بها.
- يقبل `allowBots: "mentions"` تلك الرسائل فقط عندما تذكر هذا الروبوت بوضوح في الغرف؛ وتظل الرسائل المباشرة مسموحًا بها في جميع الأحوال.
- يتجاوز `groups.<room>.allowBots` الإعداد على مستوى الحساب لغرفة واحدة.
- تستخدم رسائل الروبوتات المُهيأة المقبولة [الحماية المشتركة من حلقات الروبوتات](/ar/channels/bot-loop-protection). هيّئ `channels.defaults.botLoopProtection`، ثم تجاوزه لكل حساب باستخدام `channels.matrix.botLoopProtection` أو لكل غرفة باستخدام `channels.matrix.groups.<room>.botLoopProtection`.
- يظل OpenClaw يتجاهل الرسائل الواردة من معرّف مستخدم Matrix نفسه لتجنب حلقات الرد الذاتي.
- لا يوفّر Matrix علامة أصلية للروبوت؛ ويعدّ OpenClaw الرسالة "من إنشاء روبوت" إذا "أرسلها حساب Matrix آخر مُهيأ على Gateway OpenClaw هذا".

استخدم قوائم سماح صارمة للغرف ومتطلبات الإشارة عند تمكين حركة البيانات بين الروبوتات في الغرف المشتركة.

## التشفير والتحقق

في الغرف المشفرة (E2EE)، تستخدم أحداث الصور الصادرة `thumbnail_file` بحيث تُشفّر معاينات الصور إلى جانب المرفق الكامل؛ أما الغرف غير المشفرة فتستخدم `thumbnail_url` العادي. لا يلزم أي إعداد - يكتشف Plugin حالة E2EE تلقائيًا.

تقبل جميع أوامر `openclaw matrix` الخيار `--verbose` (تشخيصات كاملة)، والخيار `--json` (مخرجات قابلة للقراءة آليًا)، والخيار `--account <id>` (إعدادات متعددة الحسابات). تكون المخرجات موجزة افتراضيًا.

### تمكين التشفير

```bash
openclaw matrix encryption setup
```

يُمهّد التخزين السري والتوقيع المتبادل، وينشئ نسخة احتياطية لمفاتيح الغرف عند الحاجة، ثم يطبع الحالة والخطوات التالية. خيارات مفيدة:

- يطبّق `--recovery-key <key>` مفتاح استرداد قبل التمهيد (يُفضّل نموذج الإدخال القياسي أدناه)
- يتخلص `--force-reset-cross-signing` من هوية التوقيع المتبادل الحالية وينشئ هوية جديدة (للاستخدام المتعمد فقط)

لحساب جديد، مكّن E2EE عند الإنشاء:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

الخيار `--encryption` اسم بديل للخيار `--enable-e2ee`. الإعداد اليدوي المكافئ:

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

- `Locally trusted`: موثوق به لدى هذا العميل فقط
- `Cross-signing verified`: تفيد SDK بأن التحقق تم عبر التوقيع المتبادل
- `Signed by owner`: موقّع بمفتاح التوقيع الذاتي الخاص بك (للتشخيص فقط)

تكون قيمة `Verified by owner` هي `yes` فقط عندما تكون قيمة `Cross-signing verified` هي `yes`؛ ولا تكفي الثقة المحلية أو توقيع المالك وحده.

يعيد `--allow-degraded-local-state` أفضل تشخيصات ممكنة دون تجهيز حساب Matrix أولًا؛ وهو مفيد لعمليات الفحص دون اتصال أو ذات الإعداد الجزئي.

### التحقق من هذا الجهاز باستخدام مفتاح استرداد

مرّر مفتاح الاسترداد عبر الإدخال القياسي بدلًا من تمريره في سطر الأوامر:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

يعرض الأمر ثلاث حالات:

- `Recovery key accepted`: قبل Matrix المفتاح للتخزين السري أو للوثوق بالجهاز.
- `Backup usable`: يمكن تحميل النسخة الاحتياطية لمفاتيح الغرف باستخدام مواد الاسترداد الموثوقة.
- `Device verified by owner`: يحظى هذا الجهاز بثقة كاملة في هوية التوقيع المتبادل في Matrix.

ينتهي الأمر برمز خروج غير صفري عندما تكون ثقة الهوية الكاملة غير مكتملة، حتى إذا أتاح مفتاح الاسترداد الوصول إلى مواد النسخة الاحتياطية. في هذه الحالة، أكمل التحقق الذاتي من عميل Matrix آخر:

```bash
openclaw matrix verify self
```

ينتظر `verify self` ظهور `Cross-signing verified: yes` قبل أن ينتهي بنجاح. استخدم `--timeout-ms <ms>` لضبط مدة الانتظار.

يعمل أيضًا النموذج الذي يتضمن المفتاح حرفيًا `openclaw matrix verify device "<recovery-key>"`، لكن المفتاح سيُحفظ في سجل الصدفة.

### تمهيد التوقيع المتبادل أو إصلاحه

```bash
openclaw matrix verify bootstrap
```

هذا هو أمر الإصلاح/الإعداد للحسابات المشفرة. وينفّذ بالترتيب ما يلي:

- يُمهّد التخزين السري، مع إعادة استخدام مفتاح استرداد موجود متى أمكن
- يُمهّد التوقيع المتبادل ويرفع المفاتيح العامة المفقودة
- يضع علامة على الجهاز الحالي ويوقّعه توقيعًا متبادلًا
- ينشئ نسخة احتياطية لمفاتيح الغرف على الخادم إذا لم تكن موجودة بالفعل

إذا كان الخادم المنزلي يتطلب UIA لرفع مفاتيح التوقيع المتبادل، يحاول OpenClaw أولًا دون مصادقة، ثم `m.login.dummy`، ثم `m.login.password` (يتطلب `channels.matrix.password`).

خيارات مفيدة:

- `--recovery-key-stdin` (استخدمه مع `printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...`) أو `--recovery-key <key>`
- الخيار `--force-reset-cross-signing` للتخلص من هوية التوقيع المتبادل الحالية (للاستخدام المتعمد فقط؛ ويتطلب تخزين مفتاح الاسترداد النشط أو توفيره باستخدام `--recovery-key-stdin`)

### النسخة الاحتياطية لمفاتيح الغرف

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

يعرض `backup status` ما إذا كانت هناك نسخة احتياطية على الخادم وما إذا كان هذا الجهاز يستطيع فك تشفيرها. يستورد `backup restore` مفاتيح الغرف المنسوخة احتياطيًا إلى مخزن التشفير المحلي؛ احذف `--recovery-key-stdin` إذا كان مفتاح الاسترداد موجودًا بالفعل على القرص.

لاستبدال نسخة احتياطية معطلة بخط أساس جديد (مع قبول فقدان السجل القديم غير القابل للاسترداد؛ ويمكنه أيضًا إعادة إنشاء التخزين السري إذا تعذر تحميل سر النسخة الاحتياطية الحالية):

```bash
openclaw matrix verify backup reset --yes
```

أضف `--rotate-recovery-key` فقط عندما ينبغي تعمد منع مفتاح الاسترداد السابق من فتح خط أساس النسخة الاحتياطية الجديد.

### عرض عمليات التحقق وطلبها والاستجابة لها

```bash
openclaw matrix verify list
```

يعرض طلبات التحقق المعلقة للحساب المحدد.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

يرسل طلب تحقق من هذا الحساب. يطلب `--own-user` تحققًا ذاتيًا (اقبل المطالبة في عميل Matrix آخر للمستخدم نفسه)؛ بينما تستهدف الخيارات `--user-id`/`--device-id`/`--room-id` شخصًا آخر. لا يمكن دمج `--own-user` مع خيارات الاستهداف الأخرى.

لمعالجة دورة الحياة على مستوى أدنى - عادةً أثناء متابعة الطلبات الواردة من عميل آخر - تعمل هذه الأوامر على طلب محدد `<id>` (يطبعه `verify list` و`verify request`):

| الأمر                                      | الغرض                                                               |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | قبول طلب وارد                                                       |
| `openclaw matrix verify start <id>`        | بدء تدفق SAS                                                        |
| `openclaw matrix verify sas <id>`          | طباعة رموز SAS التعبيرية أو الأرقام العشرية                         |
| `openclaw matrix verify confirm-sas <id>`  | تأكيد تطابق SAS مع ما يعرضه العميل الآخر                            |
| `openclaw matrix verify mismatch-sas <id>` | رفض SAS عندما لا تتطابق الرموز التعبيرية أو الأرقام العشرية         |
| `openclaw matrix verify cancel <id>`       | الإلغاء؛ ويقبل اختياريًا `--reason <text>` و`--code <matrix-code>` |

تقبل جميع أوامر `accept` و`start` و`sas` و`confirm-sas` و`mismatch-sas` و`cancel` الخيارين `--user-id` و`--room-id` كتلميحات متابعة للرسائل المباشرة عندما يكون التحقق مرتبطًا بغرفة رسائل مباشرة محددة.

### ملاحظات حول تعدد الحسابات

من دون `--account <id>`، تستخدم أوامر Matrix في CLI الحساب الافتراضي الضمني. عند وجود عدة حسابات مسماة وعدم وجود `channels.matrix.defaultAccount`، ترفض الأوامر التخمين وتطلب منك الاختيار. عندما يكون E2EE معطلًا أو غير متاح لحساب مسمى، تشير الأخطاء إلى مفتاح إعداد ذلك الحساب، مثل `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    عند استخدام `encryption: true`، تكون القيمة الافتراضية لـ `startupVerification` هي `"if-unverified"`. عند بدء التشغيل، يطلب الجهاز غير المتحقق منه تحققًا ذاتيًا في عميل Matrix آخر، مع تخطي الطلبات المكررة وتطبيق فترة تهدئة (24 ساعة افتراضيًا). اضبطها باستخدام `startupVerificationCooldownHours` أو عطّلها باستخدام `startupVerification: "off"`.

    ينفّذ بدء التشغيل أيضًا عملية تمهيد تشفير متحفظة تعيد استخدام التخزين السري وهوية التوقيع المتبادل الحاليين. إذا كانت حالة التمهيد معطلة، يحاول OpenClaw إجراء إصلاح محكوم حتى دون `channels.matrix.password`؛ وإذا كان الخادم المنزلي يتطلب UIA بكلمة مرور، يسجّل بدء التشغيل تحذيرًا ويظل الخطأ غير فادح. تُحفظ الأجهزة التي وقّعها المالك بالفعل.

    راجع [ترحيل Matrix](/ar/channels/matrix-migration) للاطلاع على مسار الترقية الكامل.

  </Accordion>

  <Accordion title="Verification notices">
    ينشر Matrix إشعارات دورة حياة التحقق في غرفة الرسائل المباشرة الصارمة المخصصة للتحقق على هيئة رسائل `m.notice`: الطلب، والجاهزية (مع إرشادات "التحقق باستخدام الرموز التعبيرية")، والبدء/الإكمال، وتفاصيل SAS (الرموز التعبيرية/الأرقام العشرية) عند توفرها.

    تُتتبّع الطلبات الواردة من عميل Matrix آخر وتُقبل تلقائيًا. بالنسبة إلى التحقق الذاتي، يبدأ OpenClaw تدفق SAS تلقائيًا ويؤكد جانبه بمجرد توفر التحقق بالرموز التعبيرية - ولا يزال عليك المقارنة وتأكيد "إنها متطابقة" في عميل Matrix لديك.

    لا تُعاد توجيه إشعارات نظام التحقق إلى مسار محادثة الوكيل.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    إذا أفاد `verify status` بأن الجهاز الحالي لم يعد مدرجًا على الخادم المنزلي، فأنشئ جهاز Matrix جديدًا لـ OpenClaw. لتسجيل الدخول بكلمة مرور:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    للمصادقة باستخدام رمز مميز، أنشئ رمز وصول جديدًا في عميل Matrix أو واجهة الإدارة، ثم حدّث OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    استبدل `assistant` بمعرّف الحساب الوارد في الأمر الذي فشل، أو احذف `--account` لاستخدام الحساب الافتراضي.

  </Accordion>

  <Accordion title="Device hygiene">
    قد تتراكم الأجهزة القديمة التي يديرها OpenClaw. اعرضها واحذف المتقادمة منها:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    يستخدم E2EE في Matrix مسار تشفير Rust الرسمي في `matrix-js-sdk` مع `fake-indexeddb` كطبقة توافق لـ IndexedDB. تستمر حالة التشفير في `crypto-idb-snapshot.json` (بأذونات ملفات مقيّدة).

    توجد حالة وقت التشغيل المشفرة ضمن `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`، وتشمل مخزن المزامنة، ومخزن التشفير، ومفتاح الاسترداد، ولقطة IDB، وروابط سلاسل المحادثات، وحالة التحقق عند بدء التشغيل. عندما يتغير الرمز المميز مع بقاء هوية الحساب نفسها، يعيد OpenClaw استخدام أفضل جذر موجود بحيث تظل الحالة السابقة ظاهرة.

    يمكن أن يكون جذر تجزئة رمز مميز قديم واحد مسار استمرارية طبيعيًا لتدوير الرمز المميز. إذا سجّل OpenClaw الرسالة `matrix: multiple populated token-hash storage roots detected`، فافحص دليل الحساب، ولا تؤرشف الجذور الشقيقة القديمة إلا بعد التأكد من سلامة الجذر النشط المحدد. يُفضّل نقل الجذور القديمة إلى دليل `_archive/` بدلًا من حذفها فورًا.

  </Accordion>
</AccordionGroup>

## إدارة الملف الشخصي

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

مرّر كلا الخيارين في استدعاء واحد. تقبل Matrix عناوين URL للصور الرمزية بصيغة `mxc://` مباشرةً؛ أما تمرير `http://`/`https://` فيؤدي أولًا إلى رفع الملف وتخزين عنوان URL المحلول بصيغة `mxc://` في `channels.matrix.avatarUrl` (أو في التجاوز الخاص بالحساب).

## سلاسل المحادثات

تدعم Matrix سلاسل المحادثات الأصلية لكل من الردود التلقائية وعمليات الإرسال عبر أداة الرسائل. يتحكم إعدادان مستقلان في السلوك:

### توجيه الجلسة (`sessionScope`)

يحدد `dm.sessionScope` كيفية ربط غرف الرسائل المباشرة في Matrix بجلسات OpenClaw:

- `"per-user"` (الافتراضي): تشترك جميع غرف الرسائل المباشرة مع النظير الموجَّه نفسه في جلسة واحدة.
- `"per-room"`: تحصل كل غرفة رسائل مباشرة في Matrix على مفتاح جلسة خاص بها، حتى للنظير نفسه.

تكون لارتباطات المحادثة الصريحة الأولوية دائمًا على `sessionScope`؛ إذ تحتفظ الغرف وسلاسل المحادثات المرتبطة بالجلسة الهدف التي اختيرت لها.

### تسلسل الردود (`threadReplies`)

يحدد `threadReplies` المكان الذي ينشر فيه الروبوت رده:

- `"off"`: تكون الردود في المستوى الأعلى. وتظل الرسائل الواردة ضمن سلسلة محادثة في جلسة الأصل.
- `"inbound"`: يُنشر الرد داخل سلسلة محادثة فقط عندما تكون الرسالة الواردة موجودة بالفعل ضمن تلك السلسلة.
- `"always"`: يُنشر الرد داخل سلسلة محادثة جذرها الرسالة المحفِّزة؛ وتُوجَّه تلك المحادثة عبر جلسة مطابقة ذات نطاق سلسلة المحادثة بدءًا من أول محفّز.

يتجاوز `dm.threadReplies` هذا الإعداد للرسائل المباشرة فقط؛ فعلى سبيل المثال، يمكن إبقاء سلاسل محادثات الغرف معزولة مع إبقاء الرسائل المباشرة دون تسلسل.

### وراثة سلسلة المحادثة وأوامر الشرطة المائلة

- تتضمن الرسائل الواردة ضمن سلسلة محادثة رسالة جذر السلسلة كسياق إضافي للوكيل.
- ترث عمليات الإرسال عبر أداة الرسائل سلسلة محادثة Matrix الحالية تلقائيًا عند استهداف الغرفة نفسها (أو هدف مستخدم الرسائل المباشرة نفسه)، ما لم يُقدَّم `threadId` صريح.
- لا تُفعَّل إعادة استخدام هدف مستخدم الرسائل المباشرة إلا عندما تثبت بيانات الجلسة الوصفية أنه النظير نفسه للرسائل المباشرة في حساب Matrix نفسه؛ وإلا يعود OpenClaw إلى التوجيه العادي ذي نطاق المستخدم.
- تعمل `/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age` و`/acp spawn` المرتبطة بسلسلة محادثة في غرف Matrix ورسائلها المباشرة.
- ينشئ `/focus` في المستوى الأعلى سلسلة محادثة جديدة في Matrix ويربطها بالجلسة الهدف عند تمكين `threadBindings.spawnSessions`.
- يؤدي تشغيل `/focus` أو `/acp spawn --thread here` داخل سلسلة محادثة موجودة في Matrix إلى ربط تلك السلسلة في موضعها.

عندما يكتشف OpenClaw تعارض غرفة رسائل مباشرة في Matrix مع غرفة رسائل مباشرة أخرى ضمن الجلسة المشتركة نفسها، ينشر إشعار `m.notice` لمرة واحدة يشير إلى مخرج `/focus` ويقترح تغيير `dm.sessionScope`. لا يظهر الإشعار إلا عند تمكين ارتباطات سلاسل المحادثات.

## ارتباطات محادثات ACP

يمكن أن تصبح غرف Matrix ورسائلها المباشرة وسلاسل محادثاتها الموجودة مساحات عمل ACP دائمة دون تغيير واجهة المحادثة.

مسار سريع للمشغّل:

- شغّل `/acp spawn codex --bind here` داخل رسالة Matrix المباشرة أو الغرفة أو سلسلة المحادثة الموجودة التي تريد مواصلة استخدامها.
- في رسالة مباشرة أو غرفة من المستوى الأعلى، تظل الرسالة المباشرة أو الغرفة الحالية واجهة المحادثة، وتُوجَّه الرسائل المستقبلية إلى جلسة ACP المنشأة.
- داخل سلسلة محادثة موجودة، يربط `--bind here` سلسلة المحادثة الحالية في موضعها.
- يعيد `/new` و`/reset` ضبط جلسة ACP المرتبطة نفسها في موضعها.
- يغلق `/acp close` جلسة ACP ويزيل الارتباط.

لا ينشئ `--bind here` سلسلة محادثة فرعية في Matrix. يتحكم `threadBindings.spawnSessions` في `/acp spawn --thread auto|here` عندما يحتاج OpenClaw إلى إنشاء سلسلة محادثة فرعية أو ربطها.

### إعداد ارتباط سلسلة المحادثة

ترث Matrix الإعدادات الافتراضية العامة من `session.threadBindings` وتدعم تجاوزات خاصة بالقناة:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`: يتحكم في إنشاء سلاسل المحادثات لكل من الوكلاء الفرعيين وACP.
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions`: تجاوزات أضيق لعمليات الإنشاء الخاصة بالوكلاء الفرعيين فقط أو ACP فقط.
- `threadBindings.defaultSpawnContext`

تكون عمليات إنشاء الجلسات المرتبطة بسلاسل محادثات Matrix مفعّلة افتراضيًا. اضبط `threadBindings.spawnSessions: false` لمنع `/focus` في المستوى الأعلى و`/acp spawn --thread auto|here` من إنشاء سلاسل محادثات Matrix أو ربطها. اضبط `threadBindings.defaultSpawnContext: "isolated"` عندما يجب ألا تنسخ عمليات إنشاء سلاسل محادثات الوكلاء الفرعيين الأصلية نص جلسة الأصل.

## التفاعلات

تدعم Matrix التفاعلات الصادرة وإشعارات التفاعلات الواردة وتفاعلات الإقرار.

تخضع أدوات التفاعلات الصادرة لإعداد `channels.matrix.actions.reactions`:

- يضيف `react` تفاعلًا إلى حدث Matrix.
- يسرد `reactions` ملخص التفاعلات الحالي لحدث Matrix.
- يزيل `emoji=""` تفاعلات الروبوت الخاصة من ذلك الحدث.
- يزيل `remove: true` تفاعل الرمز التعبيري المحدد فقط من الروبوت.

**ترتيب الحل** (أول قيمة معرّفة لها الأولوية):

| الإعداد                  | الترتيب                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `ackReaction`           | لكل حساب -> القناة -> `messages.ackReaction` -> احتياطي الرمز التعبيري لهوية الوكيل |
| `ackReactionScope`      | لكل حساب -> القناة -> `messages.ackReactionScope` -> الافتراضي `"group-mentions"` |
| `reactionNotifications` | لكل حساب -> القناة -> الافتراضي `"own"`                                            |

يمرر `reactionNotifications: "own"` أحداث `m.reaction` المضافة عندما تستهدف رسائل Matrix التي كتبها الروبوت؛ وتعطّل `"off"` أحداث نظام التفاعلات. لا تُنشأ أحداث نظام اصطناعية لإزالة التفاعلات؛ إذ تعرضها Matrix كعمليات حجب، لا كعمليات إزالة مستقلة من نوع `m.reaction`.

## سياق السجل

- يتحكم `channels.matrix.historyLimit` في عدد رسائل الغرفة الأخيرة المضمّنة بوصفها `InboundHistory` عندما تؤدي رسالة في الغرفة إلى تشغيل الوكيل. ويعود إلى `messages.groupChat.historyLimit`؛ وتكون القيمة الافتراضية الفعلية `0` إذا لم يُضبط أي منهما (معطّل).
- يقتصر سجل غرف Matrix على الغرفة فقط؛ وتواصل الرسائل المباشرة استخدام سجل الجلسة العادي.
- سجل الغرفة للمعلّق فقط: يخزّن OpenClaw رسائل الغرفة التي لم تُحفّز ردًا بعد، ثم يأخذ لقطة لتلك النافذة عند وصول إشارة أو محفّز آخر.
- لا تُدرج رسالة التحفيز الحالية في `InboundHistory`؛ بل تظل في نص الرسالة الواردة الرئيسي لتلك الدورة.
- تعيد محاولات حدث Matrix نفسه استخدام لقطة السجل الأصلية بدلًا من الانزلاق إلى رسائل أحدث في الغرفة.

## ظهور السياق

تدعم Matrix عنصر التحكم المشترك `contextVisibility` للسياق الإضافي للغرفة، مثل نص الرد المسترجع وجذور سلاسل المحادثات والسجل المعلّق.

- `contextVisibility: "all"` هو الإعداد الافتراضي. يُحتفظ بالسياق الإضافي كما ورد.
- يرشّح `contextVisibility: "allowlist"` السياق الإضافي ليقتصر على المرسلين المسموح لهم وفق عمليات التحقق النشطة لقائمة سماح الغرفة أو المستخدم.
- يعمل `contextVisibility: "allowlist_quote"` مثل `allowlist`، لكنه يحتفظ أيضًا برد مقتبس صريح واحد.

يؤثر هذا في ظهور السياق الإضافي فقط، لا في إمكانية أن تحفّز الرسالة الواردة نفسها ردًا. يظل تخويل التحفيز مستمدًا من `groupPolicy` و`groups` و`groupAllowFrom` وإعدادات سياسة الرسائل المباشرة.

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

لكتم الرسائل المباشرة تمامًا مع إبقاء الغرف عاملة، اضبط `dm.enabled: false`:

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

راجع [المجموعات](/ar/channels/groups) لمعرفة سلوك اشتراط الإشارة وقائمة السماح.

مثال على الإقران لرسائل Matrix المباشرة:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

إذا واصل مستخدم Matrix غير المعتمد إرسال الرسائل قبل الموافقة، يعيد OpenClaw استخدام رمز الإقران المعلّق نفسه، وقد يرسل ردًا تذكيريًا بعد فترة تهدئة قصيرة بدلًا من إصدار رمز جديد.

راجع [الإقران](/ar/channels/pairing) لمعرفة مسار إقران الرسائل المباشرة المشترك وتخطيط التخزين.

## إصلاح الغرفة المباشرة

إذا انحرفت حالة الرسائل المباشرة، فقد ينتهي الأمر بـ OpenClaw مع تعيينات `m.direct` قديمة تشير إلى غرف فردية قديمة بدلًا من غرفة الرسائل المباشرة النشطة. افحص التعيين الحالي لنظير:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

أصلحه:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

يقبل كلا الأمرين `--account <id>` للإعدادات متعددة الحسابات. مسار الإصلاح:

- يفضّل غرفة رسائل مباشرة صارمة بنسبة 1:1 معيّنة بالفعل في `m.direct`
- يعود إلى أي غرفة رسائل مباشرة صارمة بنسبة 1:1 منضم إليها حاليًا مع ذلك المستخدم
- ينشئ غرفة مباشرة جديدة ويعيد كتابة `m.direct` إذا لم توجد غرفة رسائل مباشرة سليمة

لا يحذف الغرف القديمة تلقائيًا. بل يختار غرفة الرسائل المباشرة السليمة ويحدّث التعيين بحيث تستهدف عمليات إرسال Matrix المستقبلية وإشعارات التحقق ومسارات الرسائل المباشرة الأخرى الغرفة الصحيحة.

## موافقات التنفيذ

يمكن أن تعمل Matrix كعميل موافقة أصلي. اضبطها ضمن `channels.matrix.execApprovals` (أو `channels.matrix.accounts.<account>.execApprovals` لتجاوز خاص بالحساب):

- `enabled`: يسلّم الموافقات عبر مطالبات Matrix الأصلية. يؤدي عدم الضبط أو `"auto"` إلى التمكين التلقائي بمجرد إمكانية تحديد موافِق واحد على الأقل؛ اضبط `false` للتعطيل الصريح.
- `approvers`: معرّفات مستخدمي Matrix (`@owner:example.org`) المسموح لهم بالموافقة على طلبات التنفيذ. يعود إلى `channels.matrix.dm.allowFrom`.
- `target`: الوجهة التي تُرسل إليها المطالبات. ترسل `"dm"` (الافتراضي) إلى الرسائل المباشرة للموافقين؛ وترسل `"channel"` إلى الغرفة أو الرسالة المباشرة المنشئة للطلب؛ وترسل `"both"` إلى كليهما.
- `agentFilter` / `sessionFilter`: قوائم سماح اختيارية تحدد الوكلاء أو الجلسات التي تؤدي إلى التسليم عبر Matrix.

يختلف التخويل قليلًا بين أنواع الموافقات:

- تستخدم **موافقات التنفيذ** `execApprovals.approvers`، مع الرجوع إلى `dm.allowFrom`.
- تُخوَّل **موافقات Plugin** عبر `dm.allowFrom` فقط.

يتشارك النوعان اختصارات تفاعلات Matrix وتحديثات الرسائل. يرى الموافقون اختصارات التفاعل على رسالة الموافقة الأساسية:

- ✅ السماح مرة واحدة
- ❌ الرفض
- ♾️ السماح دائمًا (عندما تسمح بذلك سياسة التنفيذ الفعلية)

أوامر الشرطة المائلة الاحتياطية: `/approve <id> allow-once` و`/approve <id> allow-always` و`/approve <id> deny`.

لا يمكن الموافقة أو الرفض إلا للموافقين الذين تم تحديدهم. يتضمن تسليم موافقات التنفيذ إلى القناة نص الأمر؛ لا تمكّن `channel` أو `both` إلا في الغرف الموثوقة.

ذو صلة: [موافقات التنفيذ](/ar/tools/exec-approvals).

## أوامر الشرطة المائلة

تعمل أوامر الشرطة المائلة (`/new` و`/reset` و`/model` و`/focus` و`/unfocus` و`/agents` و`/session` و`/acp` و`/approve` وغيرها) مباشرةً في الرسائل المباشرة. وفي الغرف، يتعرف OpenClaw أيضًا على الأوامر المسبوقة بإشارة Matrix الخاصة بالروبوت، لذا يؤدي `@bot:server /new` إلى تشغيل مسار الأمر دون تعبير نمطي مخصص للإشارات؛ وهذا يُبقي الروبوت مستجيبًا لمنشورات الغرف بصيغة `@mention /command` التي يصدرها Element والعملاء المشابهون عندما يُكمل المستخدم اسم الروبوت بمفتاح الجدولة قبل كتابة الأمر.

تظل قواعد التخويل سارية: يجب أن يستوفي مرسلو الأوامر سياسات قائمة السماح أو المالك نفسها المطبقة على الرسائل العادية في الرسائل المباشرة أو الغرف.

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

- تعمل قيم `channels.matrix` ذات المستوى الأعلى بوصفها قيمًا افتراضية للحسابات المسماة، ما لم يتجاوزها أحد الحسابات.
- احصر إدخال الغرفة الموروث في حساب محدد باستخدام `groups.<room>.account`. تكون الإدخالات التي لا تحتوي على `account` مشتركة بين الحسابات؛ ويظل `account: "default"` صالحًا عندما يكون الحساب الافتراضي مضبوطًا في المستوى الأعلى.

**اختيار الحساب الافتراضي:**

- اضبط `defaultAccount` لاختيار الحساب المسمى الذي تفضله عمليات التوجيه الضمنية والفحص وأوامر CLI.
- إذا كانت لديك حسابات متعددة وكان أحدها يحمل حرفيًا الاسم `default`، فسيستخدمه OpenClaw ضمنيًا حتى عندما لا يكون `defaultAccount` مضبوطًا.
- عند وجود حسابات مسماة متعددة من دون تحديد حساب افتراضي، ترفض أوامر CLI التخمين؛ اضبط `defaultAccount` أو مرّر `--account <id>`.
- لا تُعامل كتلة `channels.matrix.*` ذات المستوى الأعلى بوصفها حساب `default` الضمني إلا عندما تكون مصادقتها مكتملة (`homeserver` + `accessToken`، أو `homeserver` + `userId` + `password`). تظل الحسابات المسماة قابلة للاكتشاف باستخدام `homeserver` + `userId` بعد أن تغطي بيانات الاعتماد المخزنة مؤقتًا المصادقة.

**الترقية:**

- عندما يرقّي OpenClaw إعداد حساب واحد إلى حسابات متعددة أثناء الإصلاح أو الإعداد، فإنه يحتفظ بالحساب المسمى الحالي إن وُجد، أو إذا كان `defaultAccount` يشير بالفعل إلى حساب. لا تُنقل إلى الحساب المُرقّى إلا مفاتيح مصادقة Matrix وتهيئته الأولية؛ بينما تبقى مفاتيح سياسة التسليم المشتركة في المستوى الأعلى.

راجع [مرجع الإعدادات](/ar/gateway/config-channels#multi-account-all-channels) للاطلاع على النمط المشترك للحسابات المتعددة.

## خوادم المنازل الخاصة/المحلية

يحظر OpenClaw افتراضيًا خوادم منازل Matrix الخاصة/الداخلية للحماية من SSRF، ما لم تفعّل السماح بها لكل حساب على حدة.

إذا كان خادم منزلك يعمل على المضيف المحلي، أو عنوان IP ضمن شبكة LAN/Tailscale، أو اسم مضيف داخلي، ففعّل `network.dangerouslyAllowPrivateNetwork` لذلك الحساب:

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

مثال لإعداد CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

لا يسمح هذا التفعيل إلا بالوجهات الخاصة/الداخلية الموثوقة. وتظل خوادم المنازل العامة غير المشفرة، مثل `http://matrix.example.org:8008`، محظورة. فضّل استخدام `https://` كلما أمكن.

## تمرير حركة مرور Matrix عبر وكيل

إذا كان نشر Matrix لديك يحتاج إلى وكيل HTTP(S) صريح للاتصالات الصادرة، فاضبط `channels.matrix.proxy`:

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

يمكن للحسابات المسماة تجاوز القيمة الافتراضية ذات المستوى الأعلى باستخدام `channels.matrix.accounts.<id>.proxy`. يستخدم OpenClaw إعداد الوكيل نفسه لحركة مرور Matrix وقت التشغيل وفحوصات حالة الحساب.

## تحليل الوجهة

تقبل Matrix صيغ الوجهات التالية في أي موضع يطلب فيه OpenClaw وجهة غرفة أو مستخدم:

- المستخدمون: `@user:server` أو `user:@user:server` أو `matrix:user:@user:server`
- الغرف: `!room:server` أو `room:!room:server` أو `matrix:room:!room:server`
- الأسماء المستعارة: `#alias:server` أو `channel:#alias:server` أو `matrix:channel:#alias:server`

معرّفات غرف Matrix حساسة لحالة الأحرف. استخدم حالة الأحرف الدقيقة لمعرّف الغرفة كما تظهر في Matrix عند إعداد أهداف التسليم الصريحة أو مهام cron أو الارتباطات أو قوائم السماح. يحتفظ OpenClaw بمفاتيح الجلسات الداخلية بصيغة موحّدة لأغراض التخزين، ولذلك لا تُعد هذه المفاتيح ذات الأحرف الصغيرة مصدرًا موثوقًا لمعرّفات تسليم Matrix.

يستخدم البحث المباشر في الدليل حساب Matrix المسجّل دخوله:

- تستعلم عمليات البحث عن المستخدمين من دليل مستخدمي Matrix على خادمهم المنزلي.
- تقبل عمليات البحث عن الغرف معرّفات الغرف والأسماء المستعارة الصريحة مباشرةً. ويجري البحث باسم الغرفة المنضم إليها بأفضل جهد، ولا ينطبق إلا على قوائم سماح الغرف في وقت التشغيل عند ضبط `dangerouslyAllowNameMatching: true`.
- إذا تعذّر تحليل اسم غرفة إلى معرّف أو اسم مستعار، فيُتجاهل أثناء تحليل قائمة السماح في وقت التشغيل.

## مرجع الإعداد

تقبل حقول المستخدمين على نمط قائمة السماح (`groupAllowFrom` و`dm.allowFrom` و`groups.<room>.users`) معرّفات مستخدمي Matrix الكاملة، وهي الخيار الأكثر أمانًا. تُتجاهل الإدخالات التي ليست معرّفات افتراضيًا. إذا ضُبط `dangerouslyAllowNameMatching: true`، فتُحل المطابقات التامة لأسماء العرض في دليل Matrix عند بدء التشغيل وكلما تغيّرت قائمة السماح أثناء تشغيل المراقب؛ وتُتجاهل الإدخالات التي يتعذّر تحليلها في وقت التشغيل.

ينبغي أن تكون مفاتيح قائمة سماح الغرف (`groups` و`rooms` القديم) معرّفات غرف أو أسماء مستعارة. تُتجاهل مفاتيح أسماء الغرف العادية افتراضيًا؛ ويعيد `dangerouslyAllowNameMatching: true` تفعيل البحث بأفضل جهد في أسماء الغرف المنضم إليها.

### الحساب والاتصال

- `enabled`: تفعيل القناة أو تعطيلها.
- `name`: تسمية عرض اختيارية للحساب.
- `defaultAccount`: معرّف الحساب المفضّل عند إعداد عدة حسابات Matrix.
- `accounts`: تجاوزات مسمّاة لكل حساب. تُورث قيم `channels.matrix` ذات المستوى الأعلى بوصفها قيمًا افتراضية.
- `homeserver`: عنوان URL للخادم المنزلي، مثل `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: السماح لهذا الحساب بالاتصال بـ`localhost` أو عناوين IP للشبكة المحلية/Tailscale أو أسماء المضيفين الداخلية.
- `proxy`: عنوان URL اختياري لوكيل HTTP(S) لحركة مرور Matrix. يدعم التجاوز لكل حساب.
- `userId`: معرّف مستخدم Matrix الكامل (`@bot:example.org`).
- `accessToken`: رمز وصول للمصادقة المستندة إلى الرموز. تُدعم قيم النص الصريح وSecretRef عبر موفّري env/file/exec ([إدارة الأسرار](/ar/gateway/secrets)).
- `password`: كلمة مرور لتسجيل الدخول المستند إلى كلمة المرور. تُدعم قيم النص الصريح وSecretRef.
- `deviceId`: معرّف جهاز Matrix صريح.
- `deviceName`: اسم عرض الجهاز المستخدم عند تسجيل الدخول بكلمة المرور.
- `avatarUrl`: عنوان URL المخزّن للصورة الرمزية الذاتية لمزامنة الملف الشخصي وتحديثات `profile set`.
- `initialSyncLimit`: الحد الأقصى لعدد الأحداث التي تُجلب أثناء مزامنة بدء التشغيل.

### التشفير

- `encryption`: تفعيل E2EE. القيمة الافتراضية: `false`.
- `startupVerification`: `"if-unverified"` (القيمة الافتراضية عند تفعيل E2EE) أو `"off"`. يطلب تلقائيًا التحقق الذاتي عند بدء التشغيل إذا كان هذا الجهاز غير موثّق.
- `startupVerificationCooldownHours`: فترة الانتظار قبل طلب بدء التشغيل التلقائي التالي. القيمة الافتراضية: `24`.

### الوصول والسياسة

- `groupPolicy`: `"open"` أو `"allowlist"` أو `"disabled"`. القيمة الافتراضية: `"allowlist"`.
- `groupAllowFrom`: قائمة سماح لمعرّفات المستخدمين الخاصة بحركة مرور الغرف.
- `mentionPatterns`: أنماط تعبيرات نمطية محددة النطاق لإشارات الغرف. كائن بالصيغة `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. يتحكم في ما إذا كانت `agents.list[].groupChat.mentionPatterns` المعدّة تنطبق على كل غرفة.
- `dm.enabled`: عند ضبطه على `false`، تُتجاهل جميع الرسائل المباشرة. القيمة الافتراضية: `true`.
- `dm.policy`: `"pairing"` (القيمة الافتراضية) أو `"allowlist"` أو `"open"` أو `"disabled"`. تُطبّق بعد انضمام البوت وتصنيفه الغرفة على أنها رسالة مباشرة؛ ولا تؤثر في معالجة الدعوات.
- `dm.allowFrom`: قائمة سماح لمعرّفات المستخدمين الخاصة بحركة مرور الرسائل المباشرة.
- `dm.sessionScope`: `"per-user"` (القيمة الافتراضية) أو `"per-room"`.
- `dm.threadReplies`: تجاوز خاص بالرسائل المباشرة لتنظيم الردود ضمن سلاسل (`"off"` أو `"inbound"` أو `"always"`).
- `allowBots`: قبول الرسائل من حسابات بوت Matrix الأخرى المعدّة (`true` أو `"mentions"`).
- `allowlistOnly`: عند ضبطه على `true`، يفرض `"allowlist"` على جميع سياسات الرسائل المباشرة النشطة (باستثناء `"disabled"`) وعلى سياسات المجموعات `"open"`. لا يغيّر السياسات `"disabled"`.
- `dangerouslyAllowNameMatching`: عند ضبطه على `true`، يسمح بالبحث في دليل أسماء عرض Matrix لإدخالات قائمة سماح المستخدمين، والبحث بأسماء الغرف المنضم إليها لمفاتيح قائمة سماح الغرف. يُفضّل استخدام معرّفات `@user:server` الكاملة ومعرّفات الغرف أو أسمائها المستعارة.
- `autoJoin`: `"always"` أو `"allowlist"` أو `"off"`. القيمة الافتراضية: `"off"`. ينطبق على كل دعوة Matrix، بما في ذلك الدعوات الشبيهة بالرسائل المباشرة.
- `autoJoinAllowlist`: الغرف/الأسماء المستعارة المسموح بها عندما تكون قيمة `autoJoin` هي `"allowlist"`. تُحل إدخالات الأسماء المستعارة بالرجوع إلى الخادم المنزلي، وليس إلى الحالة التي تدّعيها الغرفة المدعو إليها.
- `contextVisibility`: مستوى رؤية السياق الإضافي (`"all"` افتراضيًا أو `"allowlist"` أو `"allowlist_quote"`).

### سلوك الرد

- `replyToMode`: `"off"` (القيمة الافتراضية) أو `"first"` أو `"all"` أو `"batched"`.
- `threadReplies`: `"off"` (تُحل القيمة الافتراضية ذات المستوى الأعلى إلى `"inbound"` ما لم تُضبط صراحةً) أو `"inbound"` أو `"always"`.
- `threadBindings`: تجاوزات لكل قناة لتوجيه الجلسات المرتبطة بالسلاسل ودورة حياتها.
- `streaming`: `"off"` (القيمة الافتراضية) أو `"partial"` أو `"quiet"` أو `"progress"`، أو صيغة كائن `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. ‏`true` <-> `"partial"`، و`false` <-> `"off"`.
- `blockStreaming`: عند ضبطه على `true`، يُحتفظ بكتل المساعد المكتملة كرسائل تقدم منفصلة. القيمة الافتراضية: `false`.
- `markdown`: إعداد اختياري لعرض Markdown للنص الصادر.
- `responsePrefix`: سلسلة اختيارية تُضاف في بداية الردود الصادرة.
- `textChunkLimit`: حجم الجزء الصادر بالأحرف عندما تكون قيمة `chunkMode` هي `"length"`. القيمة الافتراضية: `4000`.
- `chunkMode`: `"length"` (القيمة الافتراضية، تقسّم حسب عدد الأحرف) أو `"newline"` (تقسّم عند حدود الأسطر).
- `historyLimit`: عدد رسائل الغرفة الحديثة المضمّنة بوصفها `InboundHistory` عندما تؤدي رسالة في الغرفة إلى تشغيل الوكيل. يرجع إلى `messages.groupChat.historyLimit`؛ والقيمة الافتراضية الفعلية هي `0` (معطّل).
- `mediaMaxMb`: الحد الأقصى لحجم الوسائط بالميغابايت لعمليات الإرسال الصادرة والمعالجة الواردة. القيمة الافتراضية: `20`.

### إعدادات التفاعلات

- `ackReaction`: تجاوز تفاعل الإقرار لهذه القناة/الحساب.
- `ackReactionScope`: تجاوز النطاق (`"group-mentions"` افتراضيًا أو `"group-all"` أو `"direct"` أو `"all"` أو `"none"` أو `"off"`).
- `reactionNotifications`: وضع إشعارات التفاعلات الواردة (`"own"` افتراضيًا أو `"off"`).

### الأدوات والتجاوزات لكل غرفة

- `actions`: تقييد الأدوات لكل إجراء (`messages` و`reactions` و`pins` و`profile` و`memberInfo` و`channelInfo` و`verification`).
- `groups`: خريطة السياسات لكل غرفة. تستخدم هوية الجلسة معرّف الغرفة الثابت بعد التحليل. (`rooms` اسم مستعار قديم.)
  - `groups.<room>.account`: تقييد إدخال غرفة موروث واحد بحساب محدد.
  - `groups.<room>.enabled`: مفتاح تبديل لكل غرفة. عند ضبطه على `false`، تُتجاهل الغرفة كما لو لم تكن موجودة في الخريطة.
  - `groups.<room>.requireMention`: تجاوز متطلب الإشارة على مستوى القناة لكل غرفة.
  - `groups.<room>.allowBots`: تجاوز الإعداد على مستوى القناة لكل غرفة (`true` أو `"mentions"`).
  - `groups.<room>.botLoopProtection`: تجاوز ميزانية الحماية من حلقات البوتات المتبادلة لكل غرفة.
  - `groups.<room>.users`: قائمة سماح للمرسلين لكل غرفة.
  - `groups.<room>.tools`: تجاوزات السماح بالأدوات أو منعها لكل غرفة.
  - `groups.<room>.autoReply`: تجاوز بوابة الإشارات لكل غرفة. تعطّل القيمة `true` متطلبات الإشارة لتلك الغرفة؛ بينما تفرضها القيمة `false` مجددًا.
  - `groups.<room>.skills`: مرشّح Skills لكل غرفة.
  - `groups.<room>.systemPrompt`: مقتطف موجّه النظام لكل غرفة.

### إعدادات موافقات التنفيذ

- `execApprovals.enabled`: تسليم موافقات التنفيذ عبر مطالبات Matrix الأصلية.
- `execApprovals.approvers`: معرّفات مستخدمي Matrix المسموح لها بالموافقة. يرجع إلى `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (القيمة الافتراضية) أو `"channel"` أو `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: قوائم سماح اختيارية للوكلاء/الجلسات لأغراض التسليم.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) - جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) - مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) - سلوك الدردشة الجماعية وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) - توجيه جلسات الرسائل
- [الأمان](/ar/gateway/security) - نموذج الوصول والتقوية
