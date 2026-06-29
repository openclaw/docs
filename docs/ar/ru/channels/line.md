---
read_when:
    - تريد توصيل OpenClaw بـ LINE
    - تحتاج إلى إعداد Webhook LINE وبيانات الاعتماد
    - تحتاج إلى معلمات رسائل خاصة بـ LINE
summary: إعداد Plugin LINE Messaging API وتكوينه واستخدامه
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:33:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6c76ea64b92b76dd2f6ab0d9fff7eb316e1940ba660d65262307796b5a6abc
    source_path: ru/channels/line.md
    workflow: 16
---

LINE يتصل بـ OpenClaw عبر LINE Messaging API. يعمل Plugin كمستقبل webhook
على gateway ويستخدم channel access token + channel secret الخاصين بك
للمصادقة.

الحالة: Plugin قابل للتحميل. تُدعم الرسائل الخاصة، والدردشات الجماعية، والوسائط، والمواقع، وFlex
messages، وtemplate messages، والردود السريعة. التفاعلات والخيوط
غير مدعومة.

## التثبيت

ثبّت LINE قبل إعداد القناة:

```bash
openclaw plugins install @openclaw/line
```

نسخة عمل محلية (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## الإعداد

1. أنشئ حساب LINE Developers وافتح Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. أنشئ (أو اختر) Provider وأضف قناة **Messaging API**.
3. انسخ **Channel access token** و**Channel secret** من إعدادات القناة.
4. فعّل **Use webhook** في إعدادات Messaging API.
5. عيّن عنوان URL الخاص بـ webhook لنقطة نهاية gateway الخاصة بك (يتطلب HTTPS):

```
https://gateway-host/line/webhook
```

يرد Gateway على تحقق webhook من LINE (GET) ويؤكد الأحداث الواردة الموقعة (POST)
مباشرة بعد التحقق من التوقيع والحمولة؛ تستمر معالجة
الوكيل بشكل غير متزامن.
إذا كنت تحتاج إلى مسار مخصص، فعيّن `channels.line.webhookPath` أو
`channels.line.accounts.<id>.webhookPath` وحدّث عنوان URL وفقًا لذلك.

ملاحظة أمنية:

- يعتمد التحقق من توقيع LINE على جسم الطلب (HMAC على الجسم الخام)، لذلك يطبّق OpenClaw حدودًا صارمة لحجم الجسم ومهلة ما قبل المصادقة قبل التحقق.
- يعالج OpenClaw أحداث webhook من بايتات الطلب الخام التي تم التحقق منها. يتم تجاهل قيم `req.body` التي حوّلتها البرمجيات الوسيطة الأعلى في السلسلة للحفاظ على سلامة التوقيع.

## التكوين

الحد الأدنى من التكوين:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

تكوين الرسائل الخاصة المفتوحة:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

متغيرات البيئة (الحساب الافتراضي فقط):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

ملفات الرمز السري/السر:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

يجب أن يشير `tokenFile` و`secretFile` إلى ملفات عادية. يتم رفض الروابط الرمزية.

حسابات متعددة:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## التحكم في الوصول

تتطلب الرسائل الخاصة الاقتران افتراضيًا. يتلقى المرسلون غير المعروفين رمز اقتران، ويتم تجاهل
رسائلهم إلى أن تتم الموافقة.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

قوائم السماح والسياسات:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: معرّفات مستخدمي LINE المسموح بها للرسائل الخاصة؛ يتطلب `dmPolicy: "open"` القيمة `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: معرّفات مستخدمي LINE المسموح بها للمجموعات
- تجاوزات لكل مجموعة: `channels.line.groups.<groupId>.allowFrom`
- يمكن الإشارة إلى مجموعات الوصول الثابتة للمرسلين من `allowFrom` و`groupAllowFrom` و`allowFrom` الخاص بالمجموعة عبر `accessGroup:<name>`.
- ملاحظة حول runtime: إذا كان `channels.line` غائبًا تمامًا، يعود runtime إلى `groupPolicy="allowlist"` لفحوصات المجموعات (حتى إذا تم تعيين `channels.defaults.groupPolicy`).

معرّفات LINE حساسة لحالة الأحرف. تبدو المعرّفات الصالحة كما يلي:

- المستخدم: `U` + 32 رمزًا سداسيًا عشريًا
- المجموعة: `C` + 32 رمزًا سداسيًا عشريًا
- الغرفة: `R` + 32 رمزًا سداسيًا عشريًا

## سلوك الرسائل

- يُقسّم النص إلى أجزاء من 5000 حرف.
- تتم إزالة تنسيق Markdown؛ وتُحوّل كتل التعليمات البرمجية والجداول إلى Flex
  cards حيثما أمكن.
- تُخزَّن الردود المتدفقة مؤقتًا؛ يتلقى LINE أجزاء مكتملة مع حركة تحميل
  أثناء عمل الوكيل.
- يقتصر تنزيل الوسائط على `channels.line.mediaMaxMb` (الافتراضي 10).
- تُحفظ الوسائط الواردة في `~/.openclaw/media/inbound/` قبل تمريرها
  إلى الوكيل، بما يتوافق مع مخزن الوسائط المشترك الذي تستخدمه Plugins
  القنوات المدمجة الأخرى.

## بيانات القناة (الرسائل الموسّعة)

استخدم `channelData.line` لإرسال الردود السريعة، أو المواقع، أو Flex cards، أو template
messages.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

يأتي Plugin LINE أيضًا مع الأمر `/card` لإعدادات Flex messages المسبقة:

```
/card info "Welcome" "Thanks for joining!"
```

## دعم ACP

يدعم LINE روابط محادثات ACP (Agent Communication Protocol):

- يربط `/acp spawn <agent> --bind here` دردشة LINE الحالية بجلسة ACP دون إنشاء خيط فرعي.
- تعمل روابط ACP المكوّنة وجلسات ACP النشطة المرتبطة بالمحادثة في LINE كما تعمل في قنوات المحادثة الأخرى.

راجع [وكلاء ACP](/ar/tools/acp-agents) للحصول على التفاصيل.

## الوسائط الصادرة

يدعم Plugin LINE إرسال الصور، والفيديوهات، وملفات الصوت عبر أداة رسائل الوكيل. تُرسل الوسائط عبر مسار تسليم خاص بـ LINE مع معالجة مناسبة للمعاينة والتتبع:

- **الصور**: تُرسل كرسائل صور LINE مع إنشاء معاينة تلقائي.
- **الفيديوهات**: تُرسل مع معالجة صريحة للمعاينة ونوع المحتوى.
- **الصوت**: يُرسل كرسائل صوت LINE.

يجب أن تكون عناوين URL للوسائط الصادرة عناوين HTTPS عامة. يتحقق OpenClaw من اسم المضيف الهدف قبل تمرير عنوان URL إلى LINE ويرفض local loopback، وlink-local، والأهداف في الشبكات الخاصة.

تعود عمليات إرسال الوسائط العامة إلى المسار الحالي للصور فقط عندما يكون المسار الخاص بـ LINE غير متاح.

## استكشاف الأخطاء وإصلاحها

- **فشل تحقق webhook:** تأكد من أن عنوان URL الخاص بـ webhook يستخدم HTTPS وأن
  `channelSecret` يطابق LINE console.
- **لا توجد أحداث واردة:** تأكد من أن مسار webhook يطابق `channels.line.webhookPath`
  وأن gateway متاح من LINE.
- **أخطاء تنزيل الوسائط:** زِد `channels.line.mediaMaxMb` إذا تجاوزت الوسائط
  الحد الافتراضي.

## انظر أيضًا

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل الخاصة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشات الجماعية والتقييد بالإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول وتعزيز الحماية
