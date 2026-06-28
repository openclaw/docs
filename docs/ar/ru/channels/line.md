---
read_when:
    - تريد توصيل OpenClaw بـ LINE
    - تحتاج إلى إعداد Webhook LINE وبيانات الاعتماد
    - تحتاج إلى معلمات رسائل خاصة بـ LINE
summary: إعداد Plugin LINE Messaging API وتكوينه واستخدامه
title: LINE
x-i18n:
    generated_at: "2026-06-28T20:46:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6c76ea64b92b76dd2f6ab0d9fff7eb316e1940ba660d65262307796b5a6abc
    source_path: ru/channels/line.md
    workflow: 16
---

يتصل LINE بـ OpenClaw عبر LINE Messaging API. يعمل Plugin كمستقبل Webhook
على Gateway ويستخدم channel access token + channel secret الخاصين بك من أجل
المصادقة.

الحالة: Plugin قابل للتحميل. تُدعم الرسائل الخاصة، ودردشات المجموعات، والوسائط، والمواقع، ورسائل Flex
messages، ورسائل template messages، والردود السريعة. التفاعلات والخيوط
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
2. أنشئ Provider (أو اختره) وأضف قناة **Messaging API**.
3. انسخ **Channel access token** و**Channel secret** من إعدادات القناة.
4. فعّل **Use webhook** في إعدادات Messaging API.
5. عيّن URL Webhook لنقطة نهاية Gateway لديك (يتطلب HTTPS):

```
https://gateway-host/line/webhook
```

يرد Gateway على تحقق Webhook من LINE (GET) ويؤكد الأحداث الواردة الموقعة
(POST) فورًا بعد التحقق من التوقيع والحمولة؛ وتستمر معالجة
الوكيل بشكل غير متزامن.
إذا كنت تحتاج إلى مسار مخصص، فعيّن `channels.line.webhookPath` أو
`channels.line.accounts.<id>.webhookPath` وحدّث URL وفقًا لذلك.

ملاحظة أمنية:

- يعتمد التحقق من توقيع LINE على جسم الطلب (HMAC على الجسم الخام)، لذلك يطبق OpenClaw قيودًا صارمة على حجم الجسم ومهلة قبل المصادقة وقبل التحقق.
- يعالج OpenClaw أحداث Webhook من بايتات الطلب الخام المتحقق منها. يتم تجاهل قيم `req.body` التي حوّلتها البرمجيات الوسيطة في المراحل السابقة للحفاظ على سلامة التوقيع.

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

متغيرات البيئة (للحساب الافتراضي فقط):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

ملفات الرمز/السر:

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

يجب أن يشير `tokenFile` و`secretFile` إلى ملفات عادية. تُرفض الروابط الرمزية.

عدة حسابات:

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

تتطلب الرسائل الخاصة الاقتران افتراضيًا. يحصل المرسلون غير المعروفين على رمز اقتران، ويتم
تجاهل رسائلهم حتى الموافقة.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

قوائم السماح والسياسات:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: معرّفات مستخدمي LINE المسموح بها للرسائل الخاصة؛ يتطلب `dmPolicy: "open"` القيمة `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: معرّفات مستخدمي LINE المسموح بها للمجموعات
- تجاوزات لمجموعات فردية: `channels.line.groups.<groupId>.allowFrom`
- يمكن الإشارة إلى مجموعات وصول المرسلين الثابتة من `allowFrom` و`groupAllowFrom` و`allowFrom` الخاصة بالمجموعة عبر `accessGroup:<name>`.
- ملاحظة عن runtime: إذا كان `channels.line` غائبًا بالكامل، يعود runtime إلى `groupPolicy="allowlist"` لفحوصات المجموعات (حتى إذا تم تعيين `channels.defaults.groupPolicy`).

معرّفات LINE حساسة لحالة الأحرف. تبدو المعرّفات الصالحة كما يلي:

- المستخدم: `U` + 32 رمزًا سداسيًا عشريًا
- المجموعة: `C` + 32 رمزًا سداسيًا عشريًا
- الغرفة: `R` + 32 رمزًا سداسيًا عشريًا

## سلوك الرسائل

- يُقسّم النص إلى أجزاء من 5000 حرف.
- تُزال تنسيقات Markdown؛ وتُحوّل كتل التعليمات البرمجية والجداول إلى بطاقات Flex
  cards عند الإمكان.
- تُخزّن الردود المتدفقة مؤقتًا؛ يتلقى LINE أجزاء كاملة مع رسوم تحميل متحركة
  أثناء عمل الوكيل.
- يقتصر تنزيل الوسائط على `channels.line.mediaMaxMb` (الافتراضي 10).
- تُحفظ الوسائط الواردة في `~/.openclaw/media/inbound/` قبل تمريرها
  إلى الوكيل، بما يتوافق مع مخزن الوسائط المشترك الذي تستخدمه قنوات Plugin
  المضمنة الأخرى.

## بيانات القناة (الرسائل الموسعة)

استخدم `channelData.line` لإرسال ردود سريعة، أو مواقع، أو بطاقات Flex cards، أو رسائل template
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

يوفر Plugin LINE أيضًا الأمر `/card` لإعدادات Flex messages المسبقة:

```
/card info "Welcome" "Thanks for joining!"
```

## دعم ACP

يدعم LINE ربط محادثات ACP (Agent Communication Protocol):

- يربط `/acp spawn <agent> --bind here` دردشة LINE الحالية بجلسة ACP من دون إنشاء خيط فرعي.
- تعمل روابط ACP المكوّنة وجلسات ACP النشطة المرتبطة بمحادثة في LINE كما تعمل في قنوات المحادثة الأخرى.

راجع [وكلاء ACP](/ar/tools/acp-agents) لمزيد من التفاصيل.

## الوسائط الصادرة

يدعم Plugin LINE إرسال الصور ومقاطع الفيديو والملفات الصوتية عبر أداة رسائل الوكيل. تُرسل الوسائط عبر مسار تسليم خاص بـ LINE مع معالجة مناسبة للمعاينة والتتبع:

- **الصور**: تُرسل كرسائل صور LINE مع إنشاء معاينة تلقائي.
- **الفيديو**: يُرسل مع معالجة صريحة للمعاينة ونوع المحتوى.
- **الصوت**: يُرسل كرسائل صوتية LINE.

يجب أن تكون عناوين URL للوسائط الصادرة عناوين HTTPS عامة. يتحقق OpenClaw من اسم المضيف الهدف قبل تمرير URL إلى LINE ويرفض local loopback وأهداف link-local والشبكات الخاصة.

تعود عمليات إرسال الوسائط العامة إلى المسار الحالي للصور فقط عندما لا يكون المسار الخاص بـ LINE متاحًا.

## استكشاف الأخطاء وإصلاحها

- **فشل تحقق Webhook:** تأكد من أن URL Webhook يستخدم HTTPS وأن
  `channelSecret` يطابق LINE console.
- **لا توجد أحداث واردة:** تحقق من أن مسار Webhook يطابق `channels.line.webhookPath`
  وأن Gateway يمكن الوصول إليه من LINE.
- **أخطاء تنزيل الوسائط:** زد `channels.line.mediaMaxMb` إذا كانت الوسائط تتجاوز
  الحد الافتراضي.

## انظر أيضًا

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل الخاصة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشات المجموعات والتقييد حسب الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول وتعزيز الحماية
