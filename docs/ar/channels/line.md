---
read_when:
    - تريد توصيل OpenClaw بـ LINE
    - تحتاج إلى إعداد Webhook وبيانات الاعتماد لـ LINE
    - تريد خيارات رسائل خاصة بـ LINE
summary: إعداد Plugin LINE Messaging API وتكوينه واستخدامه
title: LINE
x-i18n:
    generated_at: "2026-06-27T17:11:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c27572d1db71d1f46b4e6ee68aa03bdbec8f90ed7fb0884f0185ea4aa877468a
    source_path: channels/line.md
    workflow: 16
---

LINE يتصل بـ OpenClaw عبر LINE Messaging API. يعمل الـ Plugin كمستقبِل Webhook
على الـ Gateway ويستخدم رمز وصول القناة + سر القناة لديك للمصادقة.

الحالة: Plugin قابل للتنزيل. الرسائل المباشرة، دردشات المجموعات، الوسائط، المواقع، رسائل Flex،
رسائل القوالب، والردود السريعة مدعومة. التفاعلات والسلاسل
غير مدعومة.

## التثبيت

ثبّت LINE قبل إعداد القناة:

```bash
openclaw plugins install @openclaw/line
```

نسخة محلية (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## الإعداد

1. أنشئ حساب LINE Developers وافتح وحدة التحكم:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. أنشئ (أو اختر) موفّرًا وأضف قناة **Messaging API**.
3. انسخ **Channel access token** و**Channel secret** من إعدادات القناة.
4. فعّل **Use webhook** في إعدادات Messaging API.
5. اضبط عنوان Webhook URL على نقطة نهاية الـ Gateway لديك (يتطلب HTTPS):

```
https://gateway-host/line/webhook
```

يستجيب الـ Gateway للتحقق من Webhook الخاص بـ LINE ‏(GET) ويقرّ بالأحداث الواردة
الموقّعة (POST) فورًا بعد التحقق من التوقيع والحمولة؛ وتستمر معالجة الوكيل
بشكل غير متزامن.
إذا كنت تحتاج إلى مسار مخصص، فاضبط `channels.line.webhookPath` أو
`channels.line.accounts.<id>.webhookPath` وحدّث عنوان URL وفقًا لذلك.

ملاحظة أمنية:

- يعتمد تحقق توقيع LINE على النص الأساسي (HMAC على النص الخام)، لذلك يطبق OpenClaw حدودًا صارمة على النص قبل المصادقة ومهلة زمنية قبل التحقق.
- يعالج OpenClaw أحداث Webhook من بايتات الطلب الخام المتحقق منها. يتم تجاهل قيم `req.body` المحوّلة بواسطة البرمجيات الوسيطة upstream حفاظًا على سلامة التوقيع.

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

تكوين الرسائل المباشرة العامة:

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

الرسائل المباشرة افتراضيًا تستخدم الاقتران. يحصل المرسلون غير المعروفين على رمز اقتران ويتم تجاهل
رسائلهم حتى تتم الموافقة عليهم.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

قوائم السماح والسياسات:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: معرّفات مستخدمي LINE المسموح بها للرسائل المباشرة؛ يتطلب `dmPolicy: "open"` القيمة `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: معرّفات مستخدمي LINE المسموح بها للمجموعات
- تجاوزات لكل مجموعة: `channels.line.groups.<groupId>.allowFrom`
- يمكن الرجوع إلى مجموعات وصول المرسلين الثابتة من `allowFrom` و`groupAllowFrom` و`allowFrom` الخاصة بكل مجموعة باستخدام `accessGroup:<name>`.
- ملاحظة وقت التشغيل: إذا كان `channels.line` مفقودًا بالكامل، يعود وقت التشغيل إلى `groupPolicy="allowlist"` لفحوصات المجموعات (حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا).

معرّفات LINE حساسة لحالة الأحرف. تبدو المعرّفات الصالحة كالتالي:

- المستخدم: `U` + 32 حرفًا سداسيًا
- المجموعة: `C` + 32 حرفًا سداسيًا
- الغرفة: `R` + 32 حرفًا سداسيًا

## سلوك الرسائل

- يُقسّم النص عند 5000 حرف.
- تُزال تنسيقات Markdown؛ وتُحوّل كتل الكود والجداول إلى بطاقات Flex
  عندما يكون ذلك ممكنًا.
- تُخزّن الاستجابات المتدفقة مؤقتًا؛ يتلقى LINE أجزاء كاملة مع رسم تحميل
  أثناء عمل الوكيل.
- تنزيلات الوسائط محدودة بواسطة `channels.line.mediaMaxMb` (الافتراضي 10).
- تُحفظ الوسائط الواردة تحت `~/.openclaw/media/inbound/` قبل تمريرها
  إلى الوكيل، بما يطابق مخزن الوسائط المشترك المستخدم بواسطة Plugins القنوات
  المجمعة الأخرى.

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

يشحن Plugin ‏LINE أيضًا أمر `/card` لإعدادات رسائل Flex المسبقة:

```
/card info "Welcome" "Thanks for joining!"
```

## دعم ACP

يدعم LINE ارتباطات محادثات ACP (Agent Communication Protocol):

- يربط `/acp spawn <agent> --bind here` دردشة LINE الحالية بجلسة ACP دون إنشاء سلسلة فرعية.
- تعمل ارتباطات ACP المكوّنة وجلسات ACP النشطة المرتبطة بالمحادثة على LINE كما تعمل في قنوات المحادثة الأخرى.

راجع [وكلاء ACP](/ar/tools/acp-agents) للتفاصيل.

## الوسائط الصادرة

يدعم Plugin ‏LINE إرسال الصور والفيديوهات وملفات الصوت عبر أداة رسائل الوكيل. تُرسل الوسائط عبر مسار التسليم الخاص بـ LINE مع معالجة مناسبة للمعاينة والتتبع:

- **الصور**: تُرسل كرسائل صور LINE مع إنشاء معاينة تلقائي.
- **الفيديوهات**: تُرسل مع معالجة صريحة للمعاينة ونوع المحتوى.
- **الصوت**: يُرسل كرسائل صوت LINE.

يجب أن تكون عناوين URL للوسائط الصادرة عناوين HTTPS عامة. يتحقق OpenClaw من اسم مضيف الهدف قبل تسليم عنوان URL إلى LINE ويرفض أهداف loopback المحلية، وlink-local، والشبكات الخاصة.

تعود عمليات إرسال الوسائط العامة إلى مسار الصور فقط الحالي عندما لا يتوفر مسار خاص بـ LINE.

## استكشاف الأخطاء وإصلاحها

- **فشل التحقق من Webhook:** تأكد من أن عنوان Webhook URL يستخدم HTTPS وأن
  `channelSecret` يطابق وحدة تحكم LINE.
- **لا توجد أحداث واردة:** تأكد من أن مسار Webhook يطابق `channels.line.webhookPath`
  وأن الـ Gateway يمكن الوصول إليه من LINE.
- **أخطاء تنزيل الوسائط:** ارفع `channels.line.mediaMaxMb` إذا تجاوزت الوسائط
  الحد الافتراضي.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
