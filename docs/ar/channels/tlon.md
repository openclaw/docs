---
read_when:
    - العمل على ميزات قناة Tlon/Urbit
summary: حالة دعم Tlon/Urbit وإمكاناته وتكوينه
title: Tlon
x-i18n:
    generated_at: "2026-04-30T07:44:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: bec632f946796a0ea4bceb5ad26f1ff1825c4304bf7252e9d2fd4d3889d36b52
    source_path: channels/tlon.md
    workflow: 16
---

Tlon هو برنامج مراسلة لامركزي مبني على Urbit. يتصل OpenClaw بسفينة Urbit الخاصة بك ويمكنه
الرد على الرسائل المباشرة ورسائل محادثات المجموعات. تتطلب ردود المجموعات إشارة @ افتراضيًا ويمكن
تقييدها أكثر عبر قوائم السماح.

الحالة: Plugin مضمن. الرسائل المباشرة، وإشارات المجموعات، وردود الخيوط، وتنسيق النص الغني، وعمليات
رفع الصور مدعومة. التفاعلات والاستطلاعات غير مدعومة بعد.

## Plugin مضمن

يأتي Tlon بصفته Plugin مضمنًا في إصدارات OpenClaw الحالية، لذلك لا تحتاج الإصدارات
المعبأة العادية إلى تثبيت منفصل.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا يستبعد Tlon، فثبّت حزمة npm
حالية عند نشر واحدة:

التثبيت عبر CLI (سجل npm، عند وجود حزمة حالية):

```bash
openclaw plugins install @openclaw/tlon
```

إذا أبلغ npm أن الحزمة المملوكة لـ OpenClaw مهملة، فاستخدم إصدار OpenClaw معبأً حاليًا
أو مسار checkout المحلي إلى أن تُنشر حزمة npm أحدث.

checkout محلي (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

التفاصيل: [Plugins](/ar/tools/plugin)

## الإعداد

1. تأكد من أن Plugin الخاص بـ Tlon متاح.
   - إصدارات OpenClaw المعبأة الحالية تتضمنه بالفعل.
   - يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
2. اجمع عنوان URL الخاص بسفينتك ورمز تسجيل الدخول.
3. اضبط `channels.tlon`.
4. أعد تشغيل Gateway.
5. أرسل رسالة مباشرة إلى البوت أو أشر إليه في قناة مجموعة.

الحد الأدنى من الإعدادات (حساب واحد):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always allowed
    },
  },
}
```

## السفن الخاصة/شبكة LAN

افتراضيًا، يحظر OpenClaw أسماء المضيفين الداخلية/الخاصة ونطاقات عناوين IP للحماية من SSRF.
إذا كانت سفينتك تعمل على شبكة خاصة (localhost أو عنوان IP على LAN أو اسم مضيف داخلي)،
فيجب عليك تفعيل ذلك صراحةً:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

ينطبق هذا على عناوين URL مثل:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ فعّل هذا فقط إذا كنت تثق بشبكتك المحلية. يعطل هذا الإعداد وسائل الحماية من SSRF
للطلبات إلى عنوان URL الخاص بسفينتك.

## قنوات المجموعات

الاكتشاف التلقائي مفعّل افتراضيًا. يمكنك أيضًا تثبيت القنوات يدويًا:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

تعطيل الاكتشاف التلقائي:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## التحكم في الوصول

قائمة السماح للرسائل المباشرة (فارغة = لا يُسمح بأي رسائل مباشرة، استخدم `ownerShip` لتدفق الموافقة):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

تفويض المجموعة (مقيّد افتراضيًا):

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

## نظام المالك والموافقة

عيّن سفينة مالك لتلقي طلبات الموافقة عندما يحاول مستخدمون غير مصرح لهم التفاعل:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

سفينة المالك **مصرح لها تلقائيًا في كل مكان** — تُقبل دعوات الرسائل المباشرة تلقائيًا
وتُسمح رسائل القنوات دائمًا. لا تحتاج إلى إضافة المالك إلى `dmAllowlist` أو
`defaultAuthorizedShips`.

عند تعيين ذلك، يتلقى المالك إشعارات رسائل مباشرة من أجل:

- طلبات الرسائل المباشرة من سفن غير موجودة في قائمة السماح
- الإشارات في القنوات دون تفويض
- طلبات دعوات المجموعات

## إعدادات القبول التلقائي

قبول دعوات الرسائل المباشرة تلقائيًا (للسفن الموجودة في dmAllowlist):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

قبول دعوات المجموعات تلقائيًا:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## أهداف التسليم (CLI/cron)

استخدم هذه مع `openclaw message send` أو تسليم cron:

- رسالة مباشرة: `~sampel-palnet` أو `dm/~sampel-palnet`
- مجموعة: `chat/~host-ship/channel` أو `group:~host-ship/channel`

## Skill مضمنة

يتضمن Plugin الخاص بـ Tlon مهارة مضمنة ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
توفر وصول CLI إلى عمليات Tlon:

- **جهات الاتصال**: جلب/تحديث الملفات الشخصية، سرد جهات الاتصال
- **القنوات**: السرد، والإنشاء، ونشر الرسائل، وجلب السجل
- **المجموعات**: السرد، والإنشاء، وإدارة الأعضاء
- **الرسائل المباشرة**: إرسال الرسائل، والتفاعل مع الرسائل
- **التفاعلات**: إضافة/إزالة تفاعلات الرموز التعبيرية إلى المنشورات والرسائل المباشرة
- **الإعدادات**: إدارة أذونات Plugin عبر أوامر slash

تكون المهارة متاحة تلقائيًا عند تثبيت Plugin.

## القدرات

| الميزة           | الحالة                                      |
| --------------- | ------------------------------------------- |
| الرسائل المباشرة | ✅ مدعومة                                    |
| المجموعات/القنوات | ✅ مدعومة (محكومة بالإشارة افتراضيًا)        |
| الخيوط           | ✅ مدعومة (ردود تلقائية داخل الخيط)          |
| النص الغني       | ✅ يُحوّل Markdown إلى تنسيق Tlon            |
| الصور            | ✅ تُرفع إلى تخزين Tlon                      |
| التفاعلات        | ✅ عبر [المهارة المضمنة](#bundled-skill)     |
| الاستطلاعات      | ❌ غير مدعومة بعد                            |
| الأوامر الأصلية  | ✅ مدعومة (للمالك فقط افتراضيًا)             |

## استكشاف الأخطاء وإصلاحها

شغّل هذا التسلسل أولًا:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

الأعطال الشائعة:

- **يتم تجاهل الرسائل المباشرة**: المرسل غير موجود في `dmAllowlist` ولم يتم ضبط `ownerShip` لتدفق الموافقة.
- **يتم تجاهل رسائل المجموعات**: لم تُكتشف القناة أو المرسل غير مصرح له.
- **أخطاء الاتصال**: تحقق من إمكانية الوصول إلى عنوان URL الخاص بالسفينة؛ فعّل `allowPrivateNetwork` للسفن المحلية.
- **أخطاء المصادقة**: تحقق من أن رمز تسجيل الدخول حالي (تتغير الرموز دوريًا).

## مرجع التهيئة

التهيئة الكاملة: [التهيئة](/ar/gateway/configuration)

خيارات المزوّد:

- `channels.tlon.enabled`: تفعيل/تعطيل بدء تشغيل القناة.
- `channels.tlon.ship`: اسم سفينة Urbit للبوت (مثل `~sampel-palnet`).
- `channels.tlon.url`: عنوان URL الخاص بالسفينة (مثل `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: رمز تسجيل الدخول إلى السفينة.
- `channels.tlon.allowPrivateNetwork`: السماح بعناوين URL الخاصة بـ localhost/LAN (تجاوز SSRF).
- `channels.tlon.ownerShip`: سفينة المالك لنظام الموافقة (مصرح لها دائمًا).
- `channels.tlon.dmAllowlist`: السفن المسموح لها بإرسال رسائل مباشرة (فارغة = لا شيء).
- `channels.tlon.autoAcceptDmInvites`: قبول الرسائل المباشرة تلقائيًا من السفن الموجودة في قائمة السماح.
- `channels.tlon.autoAcceptGroupInvites`: قبول كل دعوات المجموعات تلقائيًا.
- `channels.tlon.autoDiscoverChannels`: اكتشاف قنوات المجموعات تلقائيًا (الافتراضي: true).
- `channels.tlon.groupChannels`: أعشاش القنوات المثبتة يدويًا.
- `channels.tlon.defaultAuthorizedShips`: السفن المصرح لها لكل القنوات.
- `channels.tlon.authorization.channelRules`: قواعد المصادقة لكل قناة.
- `channels.tlon.showModelSignature`: إلحاق اسم النموذج بالرسائل.

## ملاحظات

- تتطلب ردود المجموعات إشارة (مثل `~your-bot-ship`) للرد.
- ردود الخيوط: إذا كانت الرسالة الواردة ضمن خيط، يرد OpenClaw داخل الخيط.
- النص الغني: يُحوّل تنسيق Markdown (غامق، مائل، كود، عناوين، قوائم) إلى تنسيق Tlon الأصلي.
- الصور: تُرفع عناوين URL إلى تخزين Tlon وتُضمّن ككتل صور.

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك محادثات المجموعات والتحكم عبر الإشارة
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
