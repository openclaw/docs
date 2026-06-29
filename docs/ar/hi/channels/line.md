---
read_when:
    - تريد توصيل OpenClaw بـ LINE
    - تحتاج إلى إعداد LINE Webhook + بيانات الاعتماد
    - تريد خيارات رسائل خاصة بـ LINE
summary: إعداد LINE Messaging API Plugin وتكوينه واستخدامه
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:33:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE يتصل بـ OpenClaw عبر LINE Messaging API. يعمل Plugin كمستقبِل Webhook على Gateway ويستخدم channel access token + channel secret الخاصين بك للمصادقة.

الحالة: Plugin قابل للتنزيل. تُدعم الرسائل المباشرة، ومحادثات المجموعات، والوسائط، والمواقع، ورسائل Flex، ورسائل القوالب، والردود السريعة. لا تُدعم Reactions ولا threads.

## التثبيت

ثبّت LINE قبل تكوين القناة:

```bash
openclaw plugins install @openclaw/line
```

النسخة المحلية (عند التشغيل من git repo):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## الإعداد

1. أنشئ حساب LINE Developers وافتح Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. أنشئ Provider (أو اختر واحدًا) وأضف قناة **Messaging API**.
3. انسخ **Channel access token** و**Channel secret** من إعدادات القناة.
4. فعّل **Use webhook** في إعدادات Messaging API.
5. اضبط Webhook URL على نقطة نهاية Gateway لديك (HTTPS مطلوب):

```
https://gateway-host/line/webhook
```

يرد Gateway على Webhook verification (GET) من LINE ويقبل أحداث inbound الموقّعة (POST) مباشرة بعد التحقق من signature وpayload؛ وتستمر معالجة agent بشكل غير متزامن.
إذا كنت تحتاج إلى مسار مخصص، فاضبط `channels.line.webhookPath` أو `channels.line.accounts.<id>.webhookPath` وحدّث URL وفقًا لذلك.

ملاحظة أمنية:

- يعتمد LINE signature verification على body (HMAC على raw body)، لذلك يطبق OpenClaw حدود body صارمة قبل المصادقة وtimeout قبل verification.
- يعالج OpenClaw أحداث Webhook من raw request bytes التي تم التحقق منها. تُتجاهل قيم `req.body` التي حوّلتها upstream middleware حفاظًا على سلامة signature-integrity.

## التكوين

الحد الأدنى من config:

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

Config للرسائل المباشرة العامة:

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

ملفات Token/secret:

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

يجب أن يشير `tokenFile` و`secretFile` إلى ملفات عادية. تُرفض Symlinks.

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

تكون الرسائل المباشرة افتراضيًا على pairing. يحصل المرسلون غير المعروفين على pairing code وتُتجاهل رسائلهم حتى تتم الموافقة عليهم.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

قوائم السماح والسياسات:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: معرفات مستخدمي LINE المسموح بها للرسائل المباشرة؛ يتطلب `dmPolicy: "open"` القيمة `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: معرفات مستخدمي LINE المسموح بها للمجموعات
- التجاوزات لكل مجموعة: `channels.line.groups.<groupId>.allowFrom`
- يمكن الإشارة إلى مجموعات وصول المرسل الثابتة من `allowFrom` و`groupAllowFrom` و`allowFrom` لكل مجموعة باستخدام `accessGroup:<name>`.
- ملاحظة وقت التشغيل: إذا كان `channels.line` مفقودًا بالكامل، فإن runtime يعود إلى `groupPolicy="allowlist"` لفحوصات المجموعة (حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا).

معرفات LINE حساسة لحالة الأحرف. تبدو المعرفات الصالحة هكذا:

- المستخدم: `U` + 32 حرفًا سداسيًا
- المجموعة: `C` + 32 حرفًا سداسيًا
- الغرفة: `R` + 32 حرفًا سداسيًا

## سلوك الرسائل

- يُقسّم النص إلى أجزاء عند 5000 حرف.
- تُزال صياغة Markdown؛ وتُحوّل code blocks والجداول إلى بطاقات Flex عندما يكون ذلك ممكنًا.
- تكون ردود البث مخزّنة مؤقتًا؛ يتلقى LINE الأجزاء الكاملة مع loading animation أثناء عمل agent.
- تنزيلات الوسائط محدودة بواسطة `channels.line.mediaMaxMb` (القيمة الافتراضية 10).
- تُحفظ الوسائط الواردة ضمن `~/.openclaw/media/inbound/` قبل تمريرها إلى agent، بما يطابق مخزن الوسائط المشترك الذي تستخدمه plugins القنوات المضمنة الأخرى.

## بيانات القناة (الرسائل الغنية)

استخدم `channelData.line` لإرسال الردود السريعة، أو المواقع، أو بطاقات Flex، أو رسائل القوالب.

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

يشحن LINE Plugin أيضًا أمر `/card` لإعدادات رسائل Flex الجاهزة:

```
/card info "Welcome" "Thanks for joining!"
```

## دعم ACP

يدعم LINE روابط محادثات ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` يربط دردشة LINE الحالية بجلسة ACP دون إنشاء child thread.
- تعمل روابط ACP المكوّنة وجلسات ACP النشطة المرتبطة بالمحادثات على LINE مثل قنوات المحادثة الأخرى.

راجع [وكلاء ACP](/ar/tools/acp-agents) للتفاصيل.

## الوسائط الصادرة

يدعم LINE Plugin إرسال الصور، ومقاطع الفيديو، وملفات الصوت عبر أداة رسائل agent. تُرسل الوسائط عبر مسار تسليم خاص بـ LINE مع preview مناسب ومعالجة tracking:

- **الصور**: تُرسل كرسائل صور LINE مع إنشاء preview تلقائي.
- **مقاطع الفيديو**: تُرسل مع معالجة explicit preview وcontent-type.
- **الصوت**: يُرسل كرسائل صوت LINE.

يجب أن تكون عناوين URL للوسائط الصادرة عناوين HTTPS عامة. يتحقق OpenClaw من target hostname قبل تسليم URL إلى LINE ويرفض أهداف loopback وlink-local وprivate-network.

تعود عمليات إرسال الوسائط العامة إلى مسار الصور فقط الموجود عندما لا يكون المسار الخاص بـ LINE متاحًا.

## استكشاف الأخطاء وإصلاحها

- **فشل Webhook verification:** تأكد من أن Webhook URL يستخدم HTTPS وأن `channelSecret` يطابق LINE console.
- **لا توجد أحداث واردة:** تحقق من أن مسار Webhook يطابق `channels.line.webhookPath` وأن Gateway قابل للوصول من LINE.
- **أخطاء تنزيل الوسائط:** إذا تجاوزت الوسائط الحد الافتراضي، فزِد `channels.line.mediaMaxMb`.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [Pairing](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق pairing
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعة وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
