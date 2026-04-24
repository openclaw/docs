---
read_when:
    - تريد ربط OpenClaw بـ LINE
    - تحتاج إلى إعداد Webhook وبيانات الاعتماد الخاصة بـ LINE
    - تريد خيارات رسائل خاصة بـ LINE
summary: إعداد Plugin لـ LINE Messaging API وتهيئته واستخدامه
title: LINE
x-i18n:
    generated_at: "2026-04-24T07:30:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8c3187486033ab01c243f1d44518cad2b28f744a9d0cde1de9117bd26452ed4
    source_path: channels/line.md
    workflow: 15
---

يتصل LINE بـ OpenClaw عبر LINE Messaging API. يعمل Plugin كمستقبل
Webhook على Gateway ويستخدم رمز وصول القناة + السر الخاص بالقناة من أجل
المصادقة.

الحالة: Plugin مضمّن. الرسائل المباشرة، ودردشات المجموعات، والوسائط، والمواقع، ورسائل Flex،
ورسائل القوالب، والردود السريعة مدعومة. أما التفاعلات والخيوط
فغير مدعومة.

## Plugin مضمّن

يأتي LINE كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك فإن
الإصدارات المعبأة العادية لا تحتاج إلى تثبيت منفصل.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا يستبعد LINE، فقم بتثبيته
يدويًا:

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
2. أنشئ Provider (أو اختر واحدًا) وأضف قناة **Messaging API**.
3. انسخ **Channel access token** و**Channel secret** من إعدادات القناة.
4. فعّل **Use webhook** في إعدادات Messaging API.
5. اضبط عنوان Webhook URL على نقطة نهاية Gateway الخاصة بك (مطلوب HTTPS):

```
https://gateway-host/line/webhook
```

يرد Gateway على التحقق من Webhook الخاص بـ LINE ‏(GET) وعلى الأحداث الواردة ‏(POST).
إذا كنت بحاجة إلى مسار مخصص، فاضبط `channels.line.webhookPath` أو
`channels.line.accounts.<id>.webhookPath` وحدّث عنوان URL وفقًا لذلك.

ملاحظة أمان:

- يعتمد التحقق من توقيع LINE على جسم الطلب (HMAC فوق الجسم الخام)، لذلك يطبق OpenClaw حدودًا صارمة على حجم الجسم قبل المصادقة ومهلة زمنية قبل التحقق.
- يعالج OpenClaw أحداث Webhook انطلاقًا من البايتات الخام للطلب المتحقق منه. ويتم تجاهل قيم `req.body` التي حوّلتها برمجيات وسيطة في الأعلى حفاظًا على سلامة التوقيع.

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

تستخدم الرسائل المباشرة الاقتران افتراضيًا. يحصل المرسلون غير المعروفين على رمز
اقتران ويتم تجاهل رسائلهم حتى تتم الموافقة عليهم.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

قوائم السماح والسياسات:

- `channels.line.dmPolicy`: ‏`pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: معرّفات مستخدمي LINE المسموح لهم في الرسائل المباشرة
- `channels.line.groupPolicy`: ‏`allowlist | open | disabled`
- `channels.line.groupAllowFrom`: معرّفات مستخدمي LINE المسموح لهم في المجموعات
- تجاوزات لكل مجموعة: `channels.line.groups.<groupId>.allowFrom`
- ملاحظة وقت التشغيل: إذا كان `channels.line` مفقودًا بالكامل، يعود وقت التشغيل إلى `groupPolicy="allowlist"` لفحوصات المجموعات (حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا).

مُعرّفات LINE حساسة لحالة الأحرف. وتبدو المعرّفات الصالحة على النحو التالي:

- مستخدم: `U` + 32 حرفًا سداسيًا عشريًا
- مجموعة: `C` + 32 حرفًا سداسيًا عشريًا
- غرفة: `R` + 32 حرفًا سداسيًا عشريًا

## سلوك الرسائل

- يُقسَّم النص إلى أجزاء عند 5000 حرف.
- تُزال تنسيقات Markdown؛ وتُحوَّل كتل الشيفرة والجداول إلى بطاقات Flex
  عند الإمكان.
- تُخزَّن الاستجابات المتدفقة مؤقتًا؛ ويتلقى LINE أجزاء كاملة مع رسم
  متحرك للتحميل أثناء عمل الوكيل.
- تُقيَّد تنزيلات الوسائط بواسطة `channels.line.mediaMaxMb` (الافتراضي 10).

## بيانات القناة (الرسائل الغنية)

استخدم `channelData.line` لإرسال ردود سريعة أو مواقع أو بطاقات Flex أو رسائل
قوالب.

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

يشحن Plugin الخاص بـ LINE أيضًا أمر `/card` لإعدادات Flex message المسبقة:

```
/card info "Welcome" "Thanks for joining!"
```

## دعم ACP

يدعم LINE روابط محادثة ACP ‏(Agent Communication Protocol):

- يربط `/acp spawn <agent> --bind here` دردشة LINE الحالية بجلسة ACP من دون إنشاء خيط فرعي.
- تعمل روابط ACP المهيأة وجلسات ACP النشطة المرتبطة بالمحادثة على LINE مثل قنوات المحادثة الأخرى.

راجع [وكلاء ACP](/ar/tools/acp-agents) لمزيد من التفاصيل.

## الوسائط الصادرة

يدعم Plugin الخاص بـ LINE إرسال الصور ومقاطع الفيديو والملفات الصوتية عبر أداة رسائل الوكيل. تُرسل الوسائط عبر مسار التسليم الخاص بـ LINE مع المعاينة المناسبة ومعالجة التتبع:

- **الصور**: تُرسل كرسائل صور LINE مع توليد تلقائي للمعاينة.
- **مقاطع الفيديو**: تُرسل مع معالجة صريحة للمعاينة ونوع المحتوى.
- **الصوت**: يُرسل كرسائل صوت LINE.

يجب أن تكون عناوين URL للوسائط الصادرة عناوين HTTPS عامة. يتحقق OpenClaw من اسم المضيف الهدف قبل تسليم عنوان URL إلى LINE ويرفض الأهداف المحلية loopback وأهداف link-local وأهداف الشبكات الخاصة.

تعود عمليات إرسال الوسائط العامة إلى مسار الصور فقط الحالي عندما لا يتوفر مسار خاص بـ LINE.

## استكشاف الأخطاء وإصلاحها

- **فشل التحقق من Webhook:** تأكد من أن عنوان Webhook URL يستخدم HTTPS وأن
  `channelSecret` يطابق ما هو موجود في Console الخاصة بـ LINE.
- **لا توجد أحداث واردة:** تأكد من أن مسار Webhook يطابق `channels.line.webhookPath`
  وأن Gateway يمكن الوصول إليه من LINE.
- **أخطاء تنزيل الوسائط:** ارفع قيمة `channels.line.mediaMaxMb` إذا تجاوزت الوسائط
  الحد الافتراضي.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وتقييد الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
