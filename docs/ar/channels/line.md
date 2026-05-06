---
read_when:
    - تريد ربط OpenClaw بـ LINE
    - تحتاج إلى إعداد Webhook وبيانات الاعتماد لـ LINE
    - تريد خيارات رسائل خاصة بـ LINE
summary: إعداد Plugin LINE Messaging API وتكوينه واستخدامه
title: سطر
x-i18n:
    generated_at: "2026-05-06T07:43:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9d2880bd27e11b72b51ad8a1e8c9e9d41adb51622edf890554594b90d24cd8d
    source_path: channels/line.md
    workflow: 16
---

يتصل LINE بـ OpenClaw عبر LINE Messaging API. يعمل Plugin كمستقبِل Webhook
على Gateway ويستخدم رمز وصول القناة + سر القناة لديك من أجل
المصادقة.

الحالة: Plugin قابل للتنزيل. الرسائل المباشرة، ودردشات المجموعات، والوسائط، والمواقع، ورسائل Flex،
ورسائل القوالب، والردود السريعة مدعومة. التفاعلات والسلاسل
غير مدعومة.

## التثبيت

ثبّت LINE قبل تهيئة القناة:

```bash
openclaw plugins install @openclaw/line
```

نسخة محلية (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## الإعداد

1. أنشئ حساب LINE Developers وافتح Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. أنشئ (أو اختر) Provider وأضف قناة **Messaging API**.
3. انسخ **Channel access token** و **Channel secret** من إعدادات القناة.
4. فعّل **Use webhook** في إعدادات Messaging API.
5. اضبط عنوان URL للـ Webhook على نقطة نهاية Gateway لديك (يلزم HTTPS):

```
https://gateway-host/line/webhook
```

يستجيب Gateway للتحقق من Webhook الخاص بـ LINE (GET) والأحداث الواردة (POST).
إذا كنت تحتاج إلى مسار مخصص، فاضبط `channels.line.webhookPath` أو
`channels.line.accounts.<id>.webhookPath` وحدّث عنوان URL وفقًا لذلك.

ملاحظة أمنية:

- يعتمد التحقق من توقيع LINE على جسم الطلب (HMAC على الجسم الخام)، لذلك يطبّق OpenClaw حدودًا صارمة لجسم الطلب قبل المصادقة ومهلة زمنية قبل التحقق.
- يعالج OpenClaw أحداث Webhook من بايتات الطلب الخام المتحقق منها. يتم تجاهل قيم `req.body` التي حوّلتها برمجيات وسيطة علوية حفاظًا على سلامة التوقيع.

## التهيئة

الحد الأدنى من التهيئة:

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

تهيئة الرسائل المباشرة العامة:

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

يجب أن يشير `tokenFile` و `secretFile` إلى ملفات عادية. يتم رفض الروابط الرمزية.

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

تستخدم الرسائل المباشرة الاقتران افتراضيًا. يتلقى المرسلون غير المعروفين رمز اقتران ويتم
تجاهل رسائلهم إلى أن تتم الموافقة عليهم.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

قوائم السماح والسياسات:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: معرّفات مستخدمي LINE المسموح بها للرسائل المباشرة؛ يتطلب `dmPolicy: "open"` القيمة `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: معرّفات مستخدمي LINE المسموح بها للمجموعات
- التجاوزات لكل مجموعة: `channels.line.groups.<groupId>.allowFrom`
- ملاحظة وقت التشغيل: إذا كانت `channels.line` مفقودة بالكامل، يعود وقت التشغيل إلى `groupPolicy="allowlist"` لفحوصات المجموعات (حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا).

معرّفات LINE حساسة لحالة الأحرف. تبدو المعرّفات الصالحة كما يلي:

- المستخدم: `U` + 32 حرفًا سداسيًا عشريًا
- المجموعة: `C` + 32 حرفًا سداسيًا عشريًا
- الغرفة: `R` + 32 حرفًا سداسيًا عشريًا

## سلوك الرسائل

- يتم تقسيم النص إلى أجزاء عند 5000 حرف.
- تتم إزالة تنسيق Markdown؛ ويتم تحويل كتل التعليمات البرمجية والجداول إلى بطاقات Flex
  عند الإمكان.
- تتم موازنة الاستجابات المتدفقة؛ يتلقى LINE أجزاء كاملة مع رسوم تحميل
  متحركة بينما يعمل الوكيل.
- يتم تقييد تنزيلات الوسائط بواسطة `channels.line.mediaMaxMb` (الافتراضي 10).
- يتم حفظ الوسائط الواردة ضمن `~/.openclaw/media/inbound/` قبل تمريرها
  إلى الوكيل، بما يطابق مخزن الوسائط المشترك الذي تستخدمه Plugins القنوات
  المضمنة الأخرى.

## بيانات القناة (الرسائل الغنية)

استخدم `channelData.line` لإرسال ردود سريعة أو مواقع أو بطاقات Flex أو رسائل قوالب.

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

يوفّر Plugin الخاص بـ LINE أيضًا أمر `/card` لإعدادات رسائل Flex المسبقة:

```
/card info "Welcome" "Thanks for joining!"
```

## دعم ACP

يدعم LINE روابط محادثات ACP (Agent Communication Protocol):

- يربط `/acp spawn <agent> --bind here` دردشة LINE الحالية بجلسة ACP دون إنشاء سلسلة فرعية.
- تعمل روابط ACP المهيأة وجلسات ACP النشطة المرتبطة بالمحادثة على LINE مثل قنوات المحادثة الأخرى.

راجع [وكلاء ACP](/ar/tools/acp-agents) للتفاصيل.

## الوسائط الصادرة

يدعم Plugin الخاص بـ LINE إرسال الصور ومقاطع الفيديو وملفات الصوت عبر أداة رسائل الوكيل. تُرسل الوسائط عبر مسار التسليم الخاص بـ LINE مع معالجة مناسبة للمعاينة والتتبع:

- **الصور**: تُرسل كرسائل صور LINE مع إنشاء معاينة تلقائي.
- **مقاطع الفيديو**: تُرسل مع معالجة صريحة للمعاينة ونوع المحتوى.
- **الصوت**: يُرسل كرسائل صوت LINE.

يجب أن تكون عناوين URL للوسائط الصادرة عناوين HTTPS عامة. يتحقق OpenClaw من اسم مضيف الهدف قبل تسليم عنوان URL إلى LINE ويرفض أهداف local loopback وlink-local والشبكات الخاصة.

تعود عمليات إرسال الوسائط العامة إلى مسار الصور فقط الحالي عندما لا يتوفر مسار خاص بـ LINE.

## استكشاف الأخطاء وإصلاحها

- **فشل التحقق من Webhook:** تأكد من أن عنوان URL للـ Webhook يستخدم HTTPS وأن
  `channelSecret` يطابق Console الخاص بـ LINE.
- **لا توجد أحداث واردة:** تأكد من أن مسار Webhook يطابق `channels.line.webhookPath`
  وأن Gateway يمكن الوصول إليه من LINE.
- **أخطاء تنزيل الوسائط:** ارفع `channels.line.mediaMaxMb` إذا تجاوزت الوسائط
  الحد الافتراضي.

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
