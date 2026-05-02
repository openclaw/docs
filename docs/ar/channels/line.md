---
read_when:
    - تريد ربط OpenClaw بـ LINE
    - تحتاج إلى إعداد Webhook وبيانات اعتماد LINE
    - تريد خيارات رسائل خاصة بـ LINE
summary: إعداد LINE Messaging API Plugin وتكوينه واستخدامه
title: سطر
x-i18n:
    generated_at: "2026-05-02T07:18:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a42afc437140185415347f66a8c0b8eaf7d623a6cc08aedf274121e89cdc3b7
    source_path: channels/line.md
    workflow: 16
---

يتصل LINE بـ OpenClaw عبر LINE Messaging API. يعمل Plugin كمستقبِل Webhook
على Gateway ويستخدم رمز الوصول إلى القناة + سر القناة للمصادقة.

الحالة: Plugin قابل للتنزيل. الرسائل المباشرة، ومحادثات المجموعات، والوسائط، والمواقع، ورسائل Flex
ورسائل القوالب والردود السريعة مدعومة. التفاعلات والسلاسل
غير مدعومة.

## التثبيت

ثبّت LINE قبل إعداد القناة:

```bash
openclaw plugins install @openclaw/line
```

نسخة محلية من المستودع (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## الإعداد

1. أنشئ حساب LINE Developers وافتح وحدة التحكم:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. أنشئ (أو اختر) موفّرًا وأضف قناة **Messaging API**.
3. انسخ **رمز الوصول إلى القناة** و**سر القناة** من إعدادات القناة.
4. فعّل **Use webhook** في إعدادات Messaging API.
5. عيّن عنوان URL الخاص بالـ Webhook إلى نقطة نهاية Gateway لديك (يتطلب HTTPS):

```
https://gateway-host/line/webhook
```

يستجيب Gateway لتحقق Webhook من LINE (GET) والأحداث الواردة (POST).
إذا احتجت إلى مسار مخصص، فاضبط `channels.line.webhookPath` أو
`channels.line.accounts.<id>.webhookPath` وحدّث عنوان URL وفقًا لذلك.

ملاحظة أمنية:

- يعتمد تحقق توقيع LINE على النص الأساسي (HMAC على النص الأساسي الخام)، لذلك يطبّق OpenClaw حدودًا صارمة على النص الأساسي قبل المصادقة ومهلة زمنية قبل التحقق.
- يعالج OpenClaw أحداث Webhook من بايتات الطلب الخام المتحقق منها. يتم تجاهل قيم `req.body` المحوّلة بواسطة الوسيط العلوي حفاظًا على سلامة التوقيع.

## الإعدادات

إعدادات دنيا:

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

تستخدم الرسائل المباشرة الاقتران افتراضيًا. يتلقى المرسلون غير المعروفين رمز اقتران وتُتجاهل
رسائلهم حتى تتم الموافقة عليهم.

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

- المستخدم: `U` + 32 محرفًا سداسيًا عشريًا
- المجموعة: `C` + 32 محرفًا سداسيًا عشريًا
- الغرفة: `R` + 32 محرفًا سداسيًا عشريًا

## سلوك الرسائل

- يُقسّم النص إلى أجزاء عند 5000 محرف.
- تُزال تنسيقات Markdown؛ وتُحوّل كتل التعليمات البرمجية والجداول إلى بطاقات Flex
  عندما يكون ذلك ممكنًا.
- تُخزّن استجابات البث مؤقتًا؛ يتلقى LINE أجزاء كاملة مع حركة تحميل
  بينما يعمل الوكيل.
- تُقيّد تنزيلات الوسائط بواسطة `channels.line.mediaMaxMb` (الافتراضي 10).
- تُحفظ الوسائط الواردة ضمن `~/.openclaw/media/inbound/` قبل تمريرها
  إلى الوكيل، بما يطابق مخزن الوسائط المشترك الذي تستخدمه Plugins القنوات المضمنة الأخرى.

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

يوفر LINE Plugin أيضًا أمر `/card` لإعدادات رسائل Flex المسبقة:

```
/card info "Welcome" "Thanks for joining!"
```

## دعم ACP

يدعم LINE ارتباطات محادثات ACP (Agent Communication Protocol):

- يربط `/acp spawn <agent> --bind here` محادثة LINE الحالية بجلسة ACP دون إنشاء سلسلة فرعية.
- تعمل ارتباطات ACP المضبوطة وجلسات ACP النشطة المرتبطة بالمحادثات على LINE مثل قنوات المحادثات الأخرى.

راجع [وكلاء ACP](/ar/tools/acp-agents) للحصول على التفاصيل.

## الوسائط الصادرة

يدعم LINE Plugin إرسال الصور ومقاطع الفيديو وملفات الصوت عبر أداة رسائل الوكيل. تُرسل الوسائط عبر مسار التسليم الخاص بـ LINE مع التعامل المناسب مع المعاينة والتتبع:

- **الصور**: تُرسل كرسائل صور LINE مع إنشاء معاينة تلقائي.
- **مقاطع الفيديو**: تُرسل مع تعامل صريح مع المعاينة ونوع المحتوى.
- **الصوت**: يُرسل كرسائل صوت LINE.

يجب أن تكون عناوين URL للوسائط الصادرة عناوين HTTPS عامة. يتحقق OpenClaw من اسم مضيف الهدف قبل تسليم عنوان URL إلى LINE ويرفض أهداف local loopback وlink-local والشبكات الخاصة.

تعود عمليات إرسال الوسائط العامة إلى مسار الصور فقط الموجود عندما لا يكون المسار الخاص بـ LINE متاحًا.

## استكشاف الأخطاء وإصلاحها

- **يفشل تحقق Webhook:** تأكد من أن عنوان URL الخاص بالـ Webhook يستخدم HTTPS وأن
  `channelSecret` يطابق وحدة تحكم LINE.
- **لا توجد أحداث واردة:** تأكد من أن مسار Webhook يطابق `channels.line.webhookPath`
  وأن Gateway قابل للوصول من LINE.
- **أخطاء تنزيل الوسائط:** ارفع `channels.line.mediaMaxMb` إذا تجاوزت الوسائط
  الحد الافتراضي.

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك محادثات المجموعات وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
