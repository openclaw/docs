---
read_when:
    - العمل على ميزات قناة Tlon/Urbit
summary: حالة دعم Tlon/Urbit وإمكاناته وتكوينه
title: Tlon
x-i18n:
    generated_at: "2026-05-02T22:16:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30915170786fc1ee8b84fb8be2ea42280262923064cfa9ca7107036096a13add
    source_path: channels/tlon.md
    workflow: 16
---

Tlon هو تطبيق مراسلة لامركزي مبني على Urbit. يتصل OpenClaw بسفينة Urbit الخاصة بك ويمكنه
الرد على الرسائل المباشرة ورسائل المحادثات الجماعية. تتطلب ردود المجموعات إشارة @ افتراضيًا، ويمكن
تقييدها أكثر عبر قوائم السماح.

الحالة: Plugin مضمن. الرسائل المباشرة، وإشارات المجموعات، وردود السلاسل، وتنسيق النص المنسق، وعمليات
رفع الصور مدعومة. التفاعلات والاستطلاعات غير مدعومة حتى الآن.

## Plugin مضمن

يأتي Tlon كـ Plugin مضمن في إصدارات OpenClaw الحالية، لذا لا تحتاج الإصدارات المعبأة
العادية إلى تثبيت منفصل.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا يستثني Tlon، فثبّت حزمة npm
حالية:

التثبيت عبر CLI (سجل npm):

```bash
openclaw plugins install @openclaw/tlon
```

استخدم الحزمة المجردة لمتابعة وسم الإصدار الرسمي الحالي. ثبّت إصدارًا دقيقًا
فقط عندما تحتاج إلى تثبيت قابل لإعادة الإنتاج.

نسخة محلية (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

التفاصيل: [Plugins](/ar/tools/plugin)

## الإعداد

1. تأكد من توفر Plugin Tlon.
   - إصدارات OpenClaw المعبأة الحالية تضمنه بالفعل.
   - يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
2. اجمع عنوان URL الخاص بسفينتك ورمز تسجيل الدخول.
3. اضبط `channels.tlon`.
4. أعد تشغيل Gateway.
5. أرسل رسالة مباشرة إلى البوت أو أشر إليه في قناة جماعية.

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

افتراضيًا، يحظر OpenClaw أسماء المضيفين ونطاقات IP الخاصة/الداخلية للحماية من SSRF.
إذا كانت سفينتك تعمل على شبكة خاصة (localhost أو عنوان IP على LAN أو اسم مضيف داخلي)،
فيجب عليك الاشتراك صراحةً:

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

## القنوات الجماعية

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

## المالك ونظام الموافقة

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

سفينة المالك **مصرح لها تلقائيًا في كل مكان** — تُقبل دعوات الرسائل المباشرة تلقائيًا، وتكون
رسائل القنوات مسموحًا بها دائمًا. لا تحتاج إلى إضافة المالك إلى `dmAllowlist` أو
`defaultAuthorizedShips`.

عند تعيينها، يتلقى المالك إشعارات عبر الرسائل المباشرة بشأن:

- طلبات الرسائل المباشرة من سفن غير موجودة في قائمة السماح
- الإشارات في القنوات بدون تفويض
- طلبات دعوة المجموعات

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

## أهداف التسليم (CLI/Cron)

استخدم هذه مع `openclaw message send` أو تسليم Cron:

- رسالة مباشرة: `~sampel-palnet` أو `dm/~sampel-palnet`
- مجموعة: `chat/~host-ship/channel` أو `group:~host-ship/channel`

## Skill مضمنة

يتضمن Plugin Tlon مهارة مضمنة ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
توفر وصول CLI إلى عمليات Tlon:

- **جهات الاتصال**: جلب/تحديث الملفات الشخصية، سرد جهات الاتصال
- **القنوات**: السرد، الإنشاء، نشر الرسائل، جلب السجل
- **المجموعات**: السرد، الإنشاء، إدارة الأعضاء
- **الرسائل المباشرة**: إرسال الرسائل، التفاعل مع الرسائل
- **التفاعلات**: إضافة/إزالة تفاعلات الرموز التعبيرية إلى المنشورات والرسائل المباشرة
- **الإعدادات**: إدارة أذونات Plugin عبر أوامر الشرطة المائلة

تكون Skill متاحة تلقائيًا عند تثبيت Plugin.

## القدرات

| الميزة          | الحالة                                  |
| --------------- | --------------------------------------- |
| الرسائل المباشرة | ✅ مدعومة                               |
| المجموعات/القنوات | ✅ مدعومة (محكومة بالإشارة افتراضيًا) |
| السلاسل         | ✅ مدعومة (ردود تلقائية داخل السلسلة)   |
| النص المنسق     | ✅ تحويل Markdown إلى تنسيق Tlon        |
| الصور           | ✅ تُرفع إلى تخزين Tlon                 |
| التفاعلات       | ✅ عبر [Skill المضمنة](#bundled-skill)  |
| الاستطلاعات     | ❌ غير مدعومة حتى الآن                  |
| الأوامر الأصلية | ✅ مدعومة (للمالك فقط افتراضيًا)        |

## استكشاف الأخطاء وإصلاحها

شغّل هذا التسلسل أولًا:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

الأعطال الشائعة:

- **تجاهل الرسائل المباشرة**: المرسل غير موجود في `dmAllowlist` ولم يتم ضبط `ownerShip` لتدفق الموافقة.
- **تجاهل رسائل المجموعات**: لم تُكتشف القناة أو المرسل غير مصرح له.
- **أخطاء الاتصال**: تحقق من إمكانية الوصول إلى عنوان URL الخاص بالسفينة؛ فعّل `allowPrivateNetwork` للسفن المحلية.
- **أخطاء المصادقة**: تحقق من أن رمز تسجيل الدخول حالي (تتغير الرموز دوريًا).

## مرجع الإعدادات

الإعدادات الكاملة: [الإعدادات](/ar/gateway/configuration)

خيارات المزوّد:

- `channels.tlon.enabled`: تفعيل/تعطيل بدء تشغيل القناة.
- `channels.tlon.ship`: اسم سفينة Urbit الخاصة بالبوت (مثل `~sampel-palnet`).
- `channels.tlon.url`: عنوان URL الخاص بالسفينة (مثل `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: رمز تسجيل الدخول إلى السفينة.
- `channels.tlon.allowPrivateNetwork`: السماح بعناوين URL الخاصة بـ localhost/LAN (تجاوز SSRF).
- `channels.tlon.ownerShip`: سفينة المالك لنظام الموافقة (مصرح لها دائمًا).
- `channels.tlon.dmAllowlist`: السفن المسموح لها بإرسال رسائل مباشرة (فارغة = لا شيء).
- `channels.tlon.autoAcceptDmInvites`: قبول الرسائل المباشرة تلقائيًا من السفن الموجودة في قائمة السماح.
- `channels.tlon.autoAcceptGroupInvites`: قبول كل دعوات المجموعات تلقائيًا.
- `channels.tlon.autoDiscoverChannels`: اكتشاف القنوات الجماعية تلقائيًا (الافتراضي: true).
- `channels.tlon.groupChannels`: مجموعات القنوات المثبتة يدويًا.
- `channels.tlon.defaultAuthorizedShips`: السفن المصرح لها لكل القنوات.
- `channels.tlon.authorization.channelRules`: قواعد المصادقة لكل قناة.
- `channels.tlon.showModelSignature`: إلحاق اسم النموذج بالرسائل.

## ملاحظات

- تتطلب ردود المجموعات إشارة (مثل `~your-bot-ship`) للرد.
- ردود السلاسل: إذا كانت الرسالة الواردة ضمن سلسلة، يرد OpenClaw داخل السلسلة.
- النص المنسق: يُحوَّل تنسيق Markdown (غامق، مائل، كود، عناوين، قوائم) إلى تنسيق Tlon الأصلي.
- الصور: تُرفع عناوين URL إلى تخزين Tlon وتُضمّن ككتل صور.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [الإقران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الإقران
- [المجموعات](/ar/channels/groups) — سلوك المحادثات الجماعية وحوكمة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
