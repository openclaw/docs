---
read_when:
    - العمل على ميزات قناة Tlon/Urbit
summary: حالة دعم Tlon/Urbit، والإمكانات، والتكوين
title: Tlon
x-i18n:
    generated_at: "2026-04-24T07:32:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ff92473a958a4cba355351a686431748ea801b1c640cc5873e8bdac8f37a53f
    source_path: channels/tlon.md
    workflow: 15
---

Tlon هو تطبيق مراسلة لامركزي مبني على Urbit. يتصل OpenClaw بسفينتك على Urbit ويمكنه
الرد على الرسائل الخاصة ورسائل الدردشة الجماعية. تتطلب الردود في المجموعات إشارة @ افتراضيًا، ويمكن
تقييدها بشكل إضافي عبر قوائم السماح.

الحالة: Plugin مضمّن. الرسائل الخاصة، والإشارات في المجموعات، والردود ضمن سلاسل المحادثات، وتنسيق النص المنسق،
ورفع الصور مدعومة. التفاعلات واستطلاعات الرأي غير مدعومة بعد.

## Plugin المضمّن

يأتي Tlon كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا تحتاج البنيات المعبأة العادية
إلى تثبيت منفصل.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا لا يتضمن Tlon، فقم بتثبيته
يدويًا:

التثبيت عبر CLI (سجل npm):

```bash
openclaw plugins install @openclaw/tlon
```

نسخة محلية (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

التفاصيل: [Plugins](/ar/tools/plugin)

## الإعداد

1. تأكد من أن Plugin ‏Tlon متاح.
   - إصدارات OpenClaw المعبأة الحالية تتضمنه بالفعل.
   - يمكن للإصدارات الأقدم/التثبيتات المخصصة إضافته يدويًا بالأوامر أعلاه.
2. اجمع عنوان URL الخاص بالسفينة ورمز تسجيل الدخول.
3. قم بتكوين `channels.tlon`.
4. أعد تشغيل Gateway.
5. أرسل رسالة خاصة إلى البوت أو اذكره في قناة مجموعة.

الحد الأدنى من التكوين (حساب واحد):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // مستحسن: سفينتك، ومسموح بها دائمًا
    },
  },
}
```

## السفن الخاصة/سفن LAN

افتراضيًا، يحظر OpenClaw أسماء المضيفين الخاصة/الداخلية ونطاقات IP لحماية SSRF.
إذا كانت سفينتك تعمل على شبكة خاصة (localhost أو عنوان IP على LAN أو اسم مضيف داخلي)،
فيجب عليك التفعيل الصريح:

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

⚠️ فعّل هذا فقط إذا كنت تثق في شبكتك المحلية. يعطّل هذا الإعداد وسائل حماية SSRF
للطلبات المرسلة إلى عنوان URL الخاص بسفينتك.

## قنوات المجموعات

يكون الاكتشاف التلقائي مفعّلًا افتراضيًا. ويمكنك أيضًا تثبيت القنوات يدويًا:

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

قائمة السماح للرسائل الخاصة (فارغة = لا يُسمح بأي رسائل خاصة، استخدم `ownerShip` لتدفق الموافقة):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

تفويض المجموعات (مقيّد افتراضيًا):

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

اضبط سفينة مالك لتلقي طلبات الموافقة عندما يحاول مستخدمون غير مخولين التفاعل:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

تكون سفينة المالك **مخوّلة تلقائيًا في كل مكان** — تُقبل دعوات الرسائل الخاصة تلقائيًا
وتُسمح رسائل القنوات دائمًا. لا تحتاج إلى إضافة المالك إلى `dmAllowlist` أو
`defaultAuthorizedShips`.

عند ضبطها، يتلقى المالك إشعارات برسائل خاصة من أجل:

- طلبات الرسائل الخاصة من سفن غير موجودة في قائمة السماح
- الإشارات في القنوات من دون تفويض
- طلبات دعوات المجموعات

## إعدادات القبول التلقائي

القبول التلقائي لدعوات الرسائل الخاصة (للسفن الموجودة في `dmAllowlist`):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

القبول التلقائي لدعوات المجموعات:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## أهداف التسليم (CLI/Cron)

استخدم هذه مع `openclaw message send` أو تسليم Cron:

- رسالة خاصة: `~sampel-palnet` أو `dm/~sampel-palnet`
- مجموعة: `chat/~host-ship/channel` أو `group:~host-ship/channel`

## Skill مضمّنة

يتضمن Plugin ‏Tlon Skill مضمّنة ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
توفر وصول CLI إلى عمليات Tlon:

- **جهات الاتصال**: جلب/تحديث الملفات الشخصية، وإدراج جهات الاتصال
- **القنوات**: الإدراج، والإنشاء، ونشر الرسائل، وجلب السجل
- **المجموعات**: الإدراج، والإنشاء، وإدارة الأعضاء
- **الرسائل الخاصة**: إرسال الرسائل، وإضافة تفاعلات إلى الرسائل
- **التفاعلات**: إضافة/إزالة تفاعلات emoji إلى المنشورات والرسائل الخاصة
- **الإعدادات**: إدارة أذونات Plugin عبر أوامر slash

تصبح Skill متاحة تلقائيًا عند تثبيت Plugin.

## الإمكانات

| الميزة           | الحالة                                 |
| ---------------- | -------------------------------------- |
| الرسائل الخاصة   | ✅ مدعومة                              |
| المجموعات/القنوات | ✅ مدعومة (مقيّدة بالإشارات افتراضيًا) |
| سلاسل المحادثات  | ✅ مدعومة (ردود تلقائية داخل السلسلة)  |
| النص المنسق      | ✅ يتم تحويل Markdown إلى تنسيق Tlon   |
| الصور            | ✅ تُرفع إلى تخزين Tlon                |
| التفاعلات        | ✅ عبر [Skill المضمّنة](#skill-مضمّنة) |
| استطلاعات الرأي  | ❌ غير مدعومة بعد                      |
| الأوامر الأصلية  | ✅ مدعومة (للمالك فقط افتراضيًا)       |

## استكشاف الأخطاء وإصلاحها

شغّل هذا التسلسل أولًا:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

الإخفاقات الشائعة:

- **يتم تجاهل الرسائل الخاصة**: المرسِل ليس ضمن `dmAllowlist` ولم يتم تكوين `ownerShip` لتدفق الموافقة.
- **يتم تجاهل رسائل المجموعات**: لم يتم اكتشاف القناة أو أن المرسِل غير مخوّل.
- **أخطاء الاتصال**: تحقق من أن عنوان URL الخاص بالسفينة قابل للوصول؛ فعّل `allowPrivateNetwork` للسفن المحلية.
- **أخطاء المصادقة**: تحقق من أن رمز تسجيل الدخول ما زال صالحًا (تتناوب الرموز).

## مرجع التكوين

التكوين الكامل: [التكوين](/ar/gateway/configuration)

خيارات المزوّد:

- `channels.tlon.enabled`: تفعيل/تعطيل بدء تشغيل القناة.
- `channels.tlon.ship`: اسم سفينة Urbit الخاصة بالبوت (مثل `~sampel-palnet`).
- `channels.tlon.url`: عنوان URL الخاص بالسفينة (مثل `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: رمز تسجيل الدخول الخاص بالسفينة.
- `channels.tlon.allowPrivateNetwork`: السماح بعناوين localhost/LAN URL (تجاوز SSRF).
- `channels.tlon.ownerShip`: سفينة المالك لنظام الموافقة (مخوّلة دائمًا).
- `channels.tlon.dmAllowlist`: السفن المسموح لها بإرسال رسائل خاصة (فارغة = لا شيء).
- `channels.tlon.autoAcceptDmInvites`: القبول التلقائي للرسائل الخاصة من السفن الموجودة في قائمة السماح.
- `channels.tlon.autoAcceptGroupInvites`: القبول التلقائي لجميع دعوات المجموعات.
- `channels.tlon.autoDiscoverChannels`: الاكتشاف التلقائي لقنوات المجموعات (الافتراضي: true).
- `channels.tlon.groupChannels`: أعشاش القنوات المثبّتة يدويًا.
- `channels.tlon.defaultAuthorizedShips`: السفن المخوّلة لجميع القنوات.
- `channels.tlon.authorization.channelRules`: قواعد تفويض لكل قناة.
- `channels.tlon.showModelSignature`: إلحاق اسم النموذج بالرسائل.

## ملاحظات

- تتطلب الردود في المجموعات إشارة (مثل `~your-bot-ship`) لكي يتم الرد.
- الردود ضمن سلاسل المحادثات: إذا كانت الرسالة الواردة ضمن سلسلة محادثة، يرد OpenClaw داخل السلسلة.
- النص المنسق: يتم تحويل تنسيق Markdown (غامق، ومائل، وشيفرة، وعناوين، وقوائم) إلى التنسيق الأصلي لـ Tlon.
- الصور: تُرفع عناوين URL إلى تخزين Tlon وتُضمَّن ككتل صور.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل الخاصة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وتقييد الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
