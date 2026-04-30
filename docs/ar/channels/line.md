---
read_when:
    - تريد ربط OpenClaw بـ LINE
    - تحتاج إلى إعداد Webhook وبيانات الاعتماد لـ LINE
    - تريد خيارات رسائل خاصة بـ LINE
summary: إعداد Plugin LINE Messaging API وتكوينه واستخدامه
title: سطر
x-i18n:
    generated_at: "2026-04-30T07:41:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f06d882f1e8d2a758e50459fadefd77796a68c28f63bef5790eb1b540c17d1
    source_path: channels/line.md
    workflow: 16
---

يتصل LINE بـ OpenClaw عبر LINE Messaging API. يعمل Plugin كمستقبِل Webhook
على Gateway ويستخدم رمز وصول القناة + سر القناة الخاصين بك
للمصادقة.

الحالة: Plugin مضمّن. الرسائل المباشرة، ومحادثات المجموعات، والوسائط، والمواقع، ورسائل Flex،
ورسائل القوالب، والردود السريعة مدعومة. التفاعلات وسلاسل المحادثات
غير مدعومة.

## Plugin مضمّن

يأتي LINE كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا تحتاج
البُنى المحزّمة العادية إلى تثبيت منفصل.

إذا كنت تستخدم بنية أقدم أو تثبيتًا مخصصًا يستبعد LINE، فثبّت
حزمة npm الحالية عند نشرها:

```bash
openclaw plugins install @openclaw/line
```

إذا أبلغ npm أن الحزمة المملوكة لـ OpenClaw مهملة أو مفقودة، فاستخدم
بنية OpenClaw محزّمة حديثة أو نسخة محلية من المستودع إلى أن يلحق مسار حزم npm
بالركب.

نسخة محلية من المستودع (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## الإعداد

1. أنشئ حساب LINE Developers وافتح Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. أنشئ Provider (أو اختر واحدًا) وأضف قناة **Messaging API**.
3. انسخ **Channel access token** و**Channel secret** من إعدادات القناة.
4. فعّل **Use webhook** في إعدادات Messaging API.
5. اضبط عنوان URL للـ Webhook على نقطة نهاية Gateway الخاصة بك (يتطلب HTTPS):

```
https://gateway-host/line/webhook
```

يستجيب Gateway للتحقق من Webhook الخاص بـ LINE (GET) وللأحداث الواردة (POST).
إذا كنت تحتاج إلى مسار مخصص، فاضبط `channels.line.webhookPath` أو
`channels.line.accounts.<id>.webhookPath` وحدّث عنوان URL وفقًا لذلك.

ملاحظة أمنية:

- يعتمد التحقق من توقيع LINE على جسم الطلب (HMAC فوق الجسم الخام)، لذلك يطبّق OpenClaw حدودًا صارمة للجسم قبل المصادقة ومهلة قبل التحقق.
- يعالج OpenClaw أحداث Webhook من بايتات الطلب الخام التي تم التحقق منها. يتم تجاهل قيم `req.body` المحوّلة بواسطة الوسيط العلوي حفاظًا على سلامة التوقيع.

## التكوين

الحد الأدنى للتكوين:

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

يجب أن يشير `tokenFile` و`secretFile` إلى ملفات عادية. تُرفض الروابط الرمزية.

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

الرسائل المباشرة تستخدم الاقتران افتراضيًا. يحصل المرسلون غير المعروفين على رمز اقتران ويتم
تجاهل رسائلهم إلى أن تتم الموافقة عليهم.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

قوائم السماح والسياسات:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: معرّفات مستخدمي LINE المسموح بها للرسائل المباشرة
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: معرّفات مستخدمي LINE المسموح بها للمجموعات
- التجاوزات لكل مجموعة: `channels.line.groups.<groupId>.allowFrom`
- ملاحظة وقت التشغيل: إذا كان `channels.line` مفقودًا بالكامل، يعود وقت التشغيل إلى `groupPolicy="allowlist"` لفحوصات المجموعات (حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا).

معرّفات LINE حساسة لحالة الأحرف. تبدو المعرّفات الصالحة كما يلي:

- المستخدم: `U` + 32 حرفًا سداسيًا
- المجموعة: `C` + 32 حرفًا سداسيًا
- الغرفة: `R` + 32 حرفًا سداسيًا

## سلوك الرسائل

- يُقسّم النص عند 5000 حرف.
- تُزال تنسيقات Markdown؛ وتُحوّل كتل الكود والجداول إلى بطاقات Flex
  عند الإمكان.
- تُخزّن الاستجابات المتدفقة مؤقتًا؛ يتلقى LINE مقاطع كاملة مع رسوم تحميل
  أثناء عمل الوكيل.
- تنزيلات الوسائط محددة بواسطة `channels.line.mediaMaxMb` (الافتراضي 10).
- تُحفظ الوسائط الواردة ضمن `~/.openclaw/media/inbound/` قبل تمريرها
  إلى الوكيل، بما يطابق مخزن الوسائط المشترك الذي تستخدمه Plugins القنوات
  المضمّنة الأخرى.

## بيانات القناة (رسائل غنية)

استخدم `channelData.line` لإرسال ردود سريعة، أو مواقع، أو بطاقات Flex، أو رسائل قوالب.

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

يوفّر LINE Plugin أيضًا أمر `/card` لإعدادات رسائل Flex الجاهزة:

```
/card info "Welcome" "Thanks for joining!"
```

## دعم ACP

يدعم LINE ارتباطات محادثات ACP (Agent Communication Protocol):

- يربط `/acp spawn <agent> --bind here` محادثة LINE الحالية بجلسة ACP دون إنشاء سلسلة فرعية.
- تعمل ارتباطات ACP المكوّنة وجلسات ACP النشطة المرتبطة بالمحادثات على LINE كما تعمل في قنوات المحادثة الأخرى.

راجع [وكلاء ACP](/ar/tools/acp-agents) للتفاصيل.

## الوسائط الصادرة

يدعم LINE Plugin إرسال الصور ومقاطع الفيديو وملفات الصوت عبر أداة رسائل الوكيل. تُرسل الوسائط عبر مسار التسليم الخاص بـ LINE مع معالجة مناسبة للمعاينة والتتبع:

- **الصور**: تُرسل كرسائل صور LINE مع إنشاء معاينة تلقائي.
- **مقاطع الفيديو**: تُرسل مع معالجة صريحة للمعاينة ونوع المحتوى.
- **الصوت**: يُرسل كرسائل صوت LINE.

يجب أن تكون عناوين URL للوسائط الصادرة عناوين HTTPS عامة. يتحقق OpenClaw من اسم مضيف الهدف قبل تمرير عنوان URL إلى LINE ويرفض أهداف local loopback، وlink-local، والشبكات الخاصة.

تعود عمليات إرسال الوسائط العامة إلى مسار الصور فقط الموجود عندما لا يتوفر مسار خاص بـ LINE.

## استكشاف الأخطاء وإصلاحها

- **فشل التحقق من Webhook:** تأكد من أن عنوان URL للـ Webhook يستخدم HTTPS وأن
  `channelSecret` يطابق LINE console.
- **لا توجد أحداث واردة:** تأكد من أن مسار Webhook يطابق `channels.line.webhookPath`
  وأن Gateway يمكن الوصول إليه من LINE.
- **أخطاء تنزيل الوسائط:** ارفع `channels.line.mediaMaxMb` إذا تجاوزت الوسائط
  الحد الافتراضي.

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك محادثات المجموعات وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
