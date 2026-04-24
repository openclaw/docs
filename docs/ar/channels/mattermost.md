---
read_when:
    - إعداد Mattermost
    - تصحيح توجيه Mattermost
summary: إعداد بوت Mattermost وتكوين OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-24T07:31:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 09c91790a2ea0149c179031b6c08e06358cb4efa5a027778cec87b38444d7718
    source_path: channels/mattermost.md
    workflow: 15
---

الحالة: Plugin مضمّن (رمز مميز للبوت + أحداث WebSocket). القنوات والمجموعات والرسائل الخاصة مدعومة.
Mattermost هي منصة مراسلة جماعية قابلة للاستضافة الذاتية؛ راجع الموقع الرسمي على
[mattermost.com](https://mattermost.com) للحصول على تفاصيل المنتج والتنزيلات.

## Plugin المضمّن

يأتي Mattermost كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا تحتاج
البنيات المعبأة العادية إلى تثبيت منفصل.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا لا يتضمن Mattermost،
فقم بتثبيته يدويًا:

التثبيت عبر CLI (سجل npm):

```bash
openclaw plugins install @openclaw/mattermost
```

نسخة محلية (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

التفاصيل: [Plugins](/ar/tools/plugin)

## الإعداد السريع

1. تأكد من أن Plugin ‏Mattermost متاح.
   - إصدارات OpenClaw المعبأة الحالية تتضمنه بالفعل.
   - يمكن للإصدارات الأقدم/التثبيتات المخصصة إضافته يدويًا بالأوامر أعلاه.
2. أنشئ حساب بوت Mattermost وانسخ **رمز البوت المميز**.
3. انسخ **عنوان URL الأساسي** لـ Mattermost (مثل `https://chat.example.com`).
4. قم بتكوين OpenClaw وابدأ Gateway.

الحد الأدنى من التكوين:

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
    },
  },
}
```

## أوامر slash الأصلية

أوامر slash الأصلية اختيارية. عند تفعيلها، يسجل OpenClaw أوامر slash باسم `oc_*` عبر
واجهة Mattermost API ويتلقى طلبات POST الراجعة على خادم HTTP الخاص بـ Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // يُستخدم عندما لا يتمكن Mattermost من الوصول مباشرة إلى Gateway (وكيل عكسي/عنوان URL عام).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

ملاحظات:

- تكون القيمة الافتراضية لـ `native: "auto"` معطلة في Mattermost. اضبط `native: true` لتفعيلها.
- إذا تم حذف `callbackUrl`، فإن OpenClaw يشتقه من مضيف/منفذ Gateway + `callbackPath`.
- في إعدادات الحسابات المتعددة، يمكن ضبط `commands` على المستوى الأعلى أو تحت
  `channels.mattermost.accounts.<id>.commands` (قيم الحساب تتجاوز الحقول ذات المستوى الأعلى).
- يتم التحقق من عمليات الاستدعاء الراجعة للأوامر باستخدام الرموز المميزة الخاصة بكل أمر التي يعيدها
  Mattermost عندما يسجل OpenClaw أوامر `oc_*`.
- تُغلق عمليات الاستدعاء الراجعة لأوامر slash افتراضيًا عند الفشل عندما يفشل التسجيل أو يكون بدء التشغيل جزئيًا أو
  لا يطابق رمز الاستدعاء الراجع أيًا من الأوامر المسجلة.
- متطلب قابلية الوصول: يجب أن تكون نقطة نهاية الاستدعاء الراجع قابلة للوصول من خادم Mattermost.
  - لا تضبط `callbackUrl` على `localhost` إلا إذا كان Mattermost يعمل على المضيف/حيز الشبكة نفسه الذي يعمل عليه OpenClaw.
  - لا تضبط `callbackUrl` على عنوان URL الأساسي لـ Mattermost إلا إذا كان ذلك العنوان يمرر عكسيًا `/api/channels/mattermost/command` إلى OpenClaw.
  - فحص سريع هو `curl https://<gateway-host>/api/channels/mattermost/command`; يجب أن يعيد طلب GET الاستجابة `405 Method Not Allowed` من OpenClaw، وليس `404`.
- متطلب قائمة السماح للاتصال الخارجي في Mattermost:
  - إذا كانت عملية الاستدعاء الراجع تستهدف عناوين خاصة/داخلية/tailnet، فاضبط
    `ServiceSettings.AllowedUntrustedInternalConnections` في Mattermost ليشمل مضيف/نطاق الاستدعاء الراجع.
  - استخدم إدخالات مضيف/نطاق، وليس عناوين URL كاملة.
    - جيد: `gateway.tailnet-name.ts.net`
    - سيئ: `https://gateway.tailnet-name.ts.net`

## متغيرات البيئة (الحساب الافتراضي)

اضبط هذه على مضيف Gateway إذا كنت تفضل متغيرات البيئة:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

تنطبق متغيرات البيئة فقط على الحساب **الافتراضي** (`default`). يجب أن تستخدم الحسابات الأخرى قيم التكوين.

لا يمكن ضبط `MATTERMOST_URL` من ملف `.env` لمساحة العمل؛ راجع [ملفات `.env` الخاصة بمساحة العمل](/ar/gateway/security).

## أوضاع الدردشة

يرد Mattermost على الرسائل الخاصة تلقائيًا. يتحكم `chatmode` في سلوك القنوات:

- `oncall` (الافتراضي): الرد فقط عند الإشارة باستخدام @ داخل القنوات.
- `onmessage`: الرد على كل رسالة في القناة.
- `onchar`: الرد عندما تبدأ الرسالة ببادئة تشغيل.

مثال على التكوين:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

ملاحظات:

- لا يزال `onchar` يرد على إشارات @ الصريحة.
- يتم احترام `channels.mattermost.requireMention` في التكوينات القديمة لكن يفضَّل `chatmode`.

## سلاسل المحادثات والجلسات

استخدم `channels.mattermost.replyToMode` للتحكم في ما إذا كانت الردود في القنوات والمجموعات تبقى في
القناة الرئيسية أو تبدأ سلسلة محادثة تحت المنشور الذي فعّلها.

- `off` (الافتراضي): الرد ضمن سلسلة محادثة فقط إذا كان المنشور الوارد موجودًا فيها بالفعل.
- `first`: بالنسبة إلى منشورات القنوات/المجموعات ذات المستوى الأعلى، ابدأ سلسلة محادثة تحت ذلك المنشور ووجّه
  المحادثة إلى جلسة بنطاق سلسلة المحادثة.
- `all`: السلوك نفسه مثل `first` في Mattermost حاليًا.
- تتجاهل الرسائل الخاصة هذا الإعداد وتبقى بلا سلاسل محادثة.

مثال على التكوين:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

ملاحظات:

- تستخدم الجلسات بنطاق سلسلة المحادثة معرّف المنشور المُفعِّل كجذر لسلسلة المحادثة.
- `first` و`all` متكافئان حاليًا لأن Mattermost، بمجرد أن يمتلك جذر سلسلة محادثة،
  يواصل إرسال الأجزاء اللاحقة والوسائط ضمن تلك السلسلة نفسها.

## التحكم في الوصول (الرسائل الخاصة)

- الافتراضي: `channels.mattermost.dmPolicy = "pairing"` (يرسل المرسلون غير المعروفين رمز اقتران).
- الموافقة عبر:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- الرسائل الخاصة العامة: `channels.mattermost.dmPolicy="open"` مع `channels.mattermost.allowFrom=["*"]`.

## القنوات (المجموعات)

- الافتراضي: `channels.mattermost.groupPolicy = "allowlist"` (مقيّد بالإشارات).
- اسمح للمرسلين عبر `channels.mattermost.groupAllowFrom` (ويُوصى باستخدام معرّفات المستخدمين).
- توجد تجاوزات الإشارة لكل قناة تحت `channels.mattermost.groups.<channelId>.requireMention`
  أو `channels.mattermost.groups["*"].requireMention` كقيمة افتراضية.
- تكون مطابقة `@username` قابلة للتغيير ولا تُفعّل إلا عندما تكون `channels.mattermost.dangerouslyAllowNameMatching: true`.
- القنوات المفتوحة: `channels.mattermost.groupPolicy="open"` (مقيّدة بالإشارات).
- ملاحظة وقت التشغيل: إذا كان `channels.mattermost` مفقودًا بالكامل، يعود وقت التشغيل إلى `groupPolicy="allowlist"` لفحوصات المجموعات (حتى لو كان `channels.defaults.groupPolicy` مضبوطًا).

مثال:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## الأهداف للتسليم الصادر

استخدم تنسيقات الأهداف هذه مع `openclaw message send` أو Cron/Webhooks:

- `channel:<id>` للقناة
- `user:<id>` للرسالة الخاصة
- `@username` للرسالة الخاصة (يتم تحليلها عبر Mattermost API)

المعرّفات المعتمة المجردة (مثل `64ifufp...`) **ملتبسة** في Mattermost (معرّف مستخدم أم معرّف قناة).

يقوم OpenClaw بتحليلها **بتفضيل المستخدم أولًا**:

- إذا كان المعرّف موجودًا كمستخدم (`GET /api/v4/users/<id>` ينجح)، يرسل OpenClaw **رسالة خاصة** من خلال تحليل القناة المباشرة عبر `/api/v4/channels/direct`.
- وإلا يُعامل المعرّف على أنه **معرّف قناة**.

إذا كنت بحاجة إلى سلوك حتمي، فاستخدم دائمًا البادئات الصريحة (`user:<id>` / `channel:<id>`).

## إعادة محاولة قناة الرسائل الخاصة

عندما يرسل OpenClaw إلى هدف رسالة خاصة في Mattermost ويحتاج إلى تحليل القناة المباشرة أولًا، فإنه
يعيد محاولة حالات الفشل العابرة في إنشاء القناة المباشرة افتراضيًا.

استخدم `channels.mattermost.dmChannelRetry` لضبط هذا السلوك على مستوى Plugin ‏Mattermost عالميًا،
أو `channels.mattermost.accounts.<id>.dmChannelRetry` لحساب واحد.

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

ملاحظات:

- ينطبق هذا فقط على إنشاء قناة الرسائل الخاصة (`/api/v4/channels/direct`)، وليس على كل استدعاء لـ Mattermost API.
- تُطبَّق إعادة المحاولة على الإخفاقات العابرة مثل حدود المعدل، واستجابات 5xx، وأخطاء الشبكة أو المهلات.
- تُعامَل أخطاء العميل 4xx بخلاف `429` على أنها دائمة ولا تتم إعادة محاولتها.

## بث المعاينة

يبث Mattermost التفكير ونشاط الأدوات ونص الرد الجزئي في **منشور معاينة مسودة** واحد يتم إنهاؤه في مكانه عندما تصبح الإجابة النهائية آمنة للإرسال. تُحدَّث المعاينة على معرّف المنشور نفسه بدلًا من إغراق القناة برسائل لكل جزء. تُلغي النهايات الخاصة بالوسائط/الأخطاء تعديلات المعاينة المعلقة وتستخدم التسليم العادي بدلًا من تفريغ منشور معاينة مؤقت.

فعّل ذلك عبر `channels.mattermost.streaming`:

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

ملاحظات:

- `partial` هو الخيار المعتاد: منشور معاينة واحد يتم تعديله مع نمو الرد، ثم يُنهى بالإجابة الكاملة.
- يستخدم `block` أجزاء مسودة بأسلوب الإلحاق داخل منشور المعاينة.
- يعرض `progress` معاينة للحالة أثناء التوليد ثم ينشر الإجابة النهائية فقط عند الاكتمال.
- يعطّل `off` بث المعاينة.
- إذا تعذر إنهاء البث في مكانه (مثلًا إذا حُذف المنشور أثناء البث)، يعود OpenClaw إلى إرسال منشور نهائي جديد حتى لا تضيع الإجابة أبدًا.
- يتم حجب الحمولات الخاصة بالتفكير فقط من منشورات القنوات، بما في ذلك النص الذي يصل على هيئة blockquote يبدأ بـ `> Reasoning:`. اضبط `/reasoning on` لرؤية التفكير على أسطح أخرى؛ ويحافظ المنشور النهائي في Mattermost على الإجابة فقط.
- راجع [البث](/ar/concepts/streaming#preview-streaming-modes) للاطلاع على مصفوفة الربط بين القنوات.

## التفاعلات (أداة الرسائل)

- استخدم `message action=react` مع `channel=mattermost`.
- `messageId` هو معرّف منشور Mattermost.
- يقبل `emoji` أسماء مثل `thumbsup` أو `:+1:` (وجود النقطتين اختياري).
- اضبط `remove=true` (قيمة منطقية) لإزالة تفاعل.
- يتم تمرير أحداث إضافة/إزالة التفاعلات كأحداث نظام إلى جلسة الوكيل الموجّهة.

أمثلة:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

التكوين:

- `channels.mattermost.actions.reactions`: تفعيل/تعطيل إجراءات التفاعلات (الافتراضي true).
- تجاوز لكل حساب: `channels.mattermost.accounts.<id>.actions.reactions`.

## الأزرار التفاعلية (أداة الرسائل)

أرسل رسائل تحتوي على أزرار قابلة للنقر. عندما ينقر المستخدم زرًا، يتلقى الوكيل
الاختيار ويمكنه الرد.

فعّل الأزرار بإضافة `inlineButtons` إلى إمكانات القناة:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

استخدم `message action=send` مع معامل `buttons`. الأزرار مصفوفة ثنائية الأبعاد (صفوف من الأزرار):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

حقول الزر:

- `text` (مطلوب): تسمية العرض.
- `callback_data` (مطلوب): القيمة التي تُعاد عند النقر (تُستخدم كمعرّف الإجراء).
- `style` (اختياري): `"default"` أو `"primary"` أو `"danger"`.

عندما ينقر المستخدم زرًا:

1. تُستبدل جميع الأزرار بسطر تأكيد (مثل: "✓ **Yes** selected by @user").
2. يتلقى الوكيل الاختيار كرسالة واردة ويرد.

ملاحظات:

- تستخدم عمليات الاستدعاء الراجع للأزرار تحقق HMAC-SHA256 (تلقائي، ولا يحتاج إلى إعداد).
- يزيل Mattermost بيانات الاستدعاء الراجع من استجابات API الخاصة به (ميزة أمان)، لذلك
  تتم إزالة جميع الأزرار عند النقر — ولا يمكن الإزالة الجزئية.
- تُنقّى معرّفات الإجراءات التي تحتوي على شرطات أو شرطات سفلية تلقائيًا
  (بسبب قيد في توجيه Mattermost).

التكوين:

- `channels.mattermost.capabilities`: مصفوفة من سلاسل الإمكانات. أضف `"inlineButtons"` إلى
  تفعيل وصف أداة الأزرار في مطالبة النظام الخاصة بالوكيل.
- `channels.mattermost.interactions.callbackBaseUrl`: عنوان URL أساسي خارجي اختياري لعمليات الاستدعاء الراجعة
  الخاصة بالأزرار (على سبيل المثال `https://gateway.example.com`). استخدمه عندما لا يتمكن Mattermost
  من الوصول إلى Gateway عند مضيف الربط الخاص به مباشرة.
- في إعدادات الحسابات المتعددة، يمكنك أيضًا ضبط الحقل نفسه تحت
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- إذا تم حذف `interactions.callbackBaseUrl`، فإن OpenClaw يشتق عنوان URL الخاص بالاستدعاء الراجع من
  `gateway.customBindHost` + `gateway.port`، ثم يعود إلى `http://localhost:<port>`.
- قاعدة قابلية الوصول: يجب أن يكون عنوان URL الخاص بالاستدعاء الراجع للأزرار قابلاً للوصول من خادم Mattermost.
  لا يعمل `localhost` إلا عندما يعمل Mattermost وOpenClaw على المضيف/حيز الشبكة نفسه.
- إذا كان هدف الاستدعاء الراجع خاصًا/داخليًا/tailnet، فأضف مضيفه/نطاقه إلى
  `ServiceSettings.AllowedUntrustedInternalConnections` في Mattermost.

### تكامل مباشر مع API (سكربتات خارجية)

يمكن للسكربتات الخارجية وWebhooks نشر الأزرار مباشرة عبر Mattermost REST API
بدلًا من المرور عبر أداة `message` الخاصة بالوكيل. استخدم `buildButtonAttachments()` من
الـ Plugin كلما أمكن؛ وإذا كنت سترسل JSON خامًا، فاتبع هذه القواعد:

**بنية الحمولة:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // أحرف وأرقام فقط — انظر أدناه
            type: "button", // مطلوب، وإلا فسيتم تجاهل النقرات بصمت
            name: "Approve", // تسمية العرض
            style: "primary", // اختياري: "default" أو "primary" أو "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // يجب أن يطابق معرّف الزر (لاستخدامه في البحث عن الاسم)
                action: "approve",
                // ... أي حقول مخصصة ...
                _token: "<hmac>", // انظر قسم HMAC أدناه
              },
            },
          },
        ],
      },
    ],
  },
}
```

**قواعد حرجة:**

1. يجب وضع المرفقات في `props.attachments`، وليس في `attachments` على المستوى الأعلى (وإلا فسيتم تجاهلها بصمت).
2. يحتاج كل إجراء إلى `type: "button"` — وبدونه يتم ابتلاع النقرات بصمت.
3. يحتاج كل إجراء إلى حقل `id` — يتجاهل Mattermost الإجراءات التي لا تحتوي على معرّفات.
4. يجب أن يكون `id` الخاص بالإجراء **مكوّنًا من أحرف وأرقام فقط** (`[a-zA-Z0-9]`). تؤدي الشرطات والشرطات السفلية إلى تعطيل
   توجيه الإجراءات على جانب خادم Mattermost (ويُرجع 404). أزلها قبل الاستخدام.
5. يجب أن يطابق `context.action_id` قيمة `id` الخاصة بالزر حتى تُظهر رسالة التأكيد
   اسم الزر (مثل "Approve") بدلًا من معرّف خام.
6. إن `context.action_id` مطلوب — يعيد معالج التفاعل 400 بدونه.

**توليد رمز HMAC المميز:**

يتحقق Gateway من نقرات الأزرار باستخدام HMAC-SHA256. يجب على السكربتات الخارجية توليد رموز
تتطابق مع منطق التحقق في Gateway:

1. اشتق السر من رمز البوت المميز:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. أنشئ كائن السياق بجميع الحقول **باستثناء** `_token`.
3. نفّذ التسلسل باستخدام **مفاتيح مرتبة** و**من دون مسافات** (يستخدم Gateway الدالة `JSON.stringify`
   مع مفاتيح مرتبة، ما ينتج مخرجات مضغوطة).
4. وقّع: `HMAC-SHA256(key=secret, data=serializedContext)`
5. أضف ناتج hex digest الناتج على هيئة `_token` داخل السياق.

مثال Python:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

أخطاء HMAC الشائعة:

- تضيف `json.dumps` في Python مسافات افتراضيًا (`{"key": "val"}`). استخدم
  `separators=(",", ":")` لمطابقة المخرجات المضغوطة في JavaScript (`{"key":"val"}`).
- وقّع دائمًا **جميع** حقول السياق (من دون `_token`). يزيل Gateway الحقل `_token` ثم
  يوقّع كل ما تبقى. يؤدي توقيع مجموعة فرعية إلى فشل صامت في التحقق.
- استخدم `sort_keys=True` — يرتب Gateway المفاتيح قبل التوقيع، وقد يعيد Mattermost
  ترتيب حقول السياق عند تخزين الحمولة.
- اشتق السر من رمز البوت المميز (بشكل حتمي)، وليس من بايتات عشوائية. يجب أن يكون السر
  هو نفسه عبر العملية التي تنشئ الأزرار وGateway الذي يتحقق منها.

## مهايئ الدليل

يتضمن Plugin ‏Mattermost مهايئ دليل يحلل أسماء القنوات والمستخدمين
عبر Mattermost API. يتيح ذلك استخدام الأهداف `#channel-name` و`@username` في
`openclaw message send` وعمليات التسليم الخاصة بـ Cron/Webhooks.

لا يلزم أي تكوين — يستخدم المهايئ رمز البوت المميز من تكوين الحساب.

## حسابات متعددة

يدعم Mattermost حسابات متعددة تحت `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## استكشاف الأخطاء وإصلاحها

- لا توجد ردود في القنوات: تأكد من أن البوت موجود في القناة واذكره (oncall)، أو استخدم بادئة تشغيل (onchar)، أو اضبط `chatmode: "onmessage"`.
- أخطاء المصادقة: تحقق من رمز البوت المميز، وعنوان URL الأساسي، وما إذا كان الحساب مفعّلًا.
- مشكلات الحسابات المتعددة: تنطبق متغيرات البيئة فقط على الحساب `default`.
- تُرجع أوامر slash الأصلية `Unauthorized: invalid command token.`: لم
  يقبل OpenClaw رمز الاستدعاء الراجع. من الأسباب المعتادة:
  - فشل تسجيل أوامر slash أو لم يكتمل إلا جزئيًا عند بدء التشغيل
  - يصل الاستدعاء الراجع إلى Gateway/الحساب الخطأ
  - لا يزال Mattermost يحتوي على أوامر قديمة تشير إلى هدف استدعاء راجع سابق
  - أُعيد تشغيل Gateway من دون إعادة تفعيل أوامر slash
- إذا توقفت أوامر slash الأصلية عن العمل، فتحقق من السجلات بحثًا عن
  `mattermost: failed to register slash commands` أو
  `mattermost: native slash commands enabled but no commands could be registered`.
- إذا تم حذف `callbackUrl` وكانت السجلات تحذر من أن الاستدعاء الراجع تحلل إلى
  `http://127.0.0.1:18789/...`، فمن المحتمل أن يكون عنوان URL هذا قابلاً للوصول فقط عندما
  يعمل Mattermost على المضيف/حيز الشبكة نفسه الذي يعمل عليه OpenClaw. اضبط
  `commands.callbackUrl` صريحًا وقابلاً للوصول خارجيًا بدلًا من ذلك.
- تظهر الأزرار على هيئة مربعات بيضاء: قد يكون الوكيل يرسل بيانات أزرار غير صحيحة. تحقق من أن كل زر يحتوي على الحقلين `text` و`callback_data`.
- تُعرض الأزرار لكن النقرات لا تفعل شيئًا: تحقق من أن `AllowedUntrustedInternalConnections` في إعدادات خادم Mattermost يتضمن `127.0.0.1 localhost`، وأن `EnablePostActionIntegration` يساوي `true` في `ServiceSettings`.
- تُرجع الأزرار 404 عند النقر: من المرجح أن `id` الخاص بالزر يحتوي على شرطات أو شرطات سفلية. يتعطل موجه إجراءات Mattermost مع المعرّفات غير الأبجدية الرقمية. استخدم `[a-zA-Z0-9]` فقط.
- يسجل Gateway الرسالة `invalid _token`: يوجد عدم تطابق في HMAC. تحقق من أنك توقّع جميع حقول السياق (وليس مجموعة فرعية)، وتستخدم مفاتيح مرتبة، وتستخدم JSON مضغوطًا (من دون مسافات). راجع قسم HMAC أعلاه.
- يسجل Gateway الرسالة `missing _token in context`: الحقل `_token` غير موجود في سياق الزر. تأكد من تضمينه عند إنشاء حمولة التكامل.
- يعرض التأكيد معرّفًا خامًا بدلًا من اسم الزر: لا تطابق `context.action_id` قيمة `id` الخاصة بالزر. اضبط كليهما على القيمة المنقّاة نفسها.
- الوكيل لا يعرف الأزرار: أضف `capabilities: ["inlineButtons"]` إلى تكوين قناة Mattermost.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل الخاصة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وتقييد الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
