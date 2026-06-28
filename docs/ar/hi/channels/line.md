---
read_when:
    - تريد توصيل OpenClaw بـ LINE
    - تحتاج إلى إعداد LINE Webhook + بيانات الاعتماد
    - تريد خيارات رسائل خاصة بـ LINE
summary: إعداد Plugin واجهة برمجة تطبيقات المراسلة LINE وتكوينه واستخدامه
title: LINE
x-i18n:
    generated_at: "2026-06-28T20:44:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

يتصل LINE بـ OpenClaw عبر LINE Messaging API. يعمل Plugin كمستقبل Webhook
على Gateway ويستخدم channel access token + channel secret للمصادقة.

الحالة: Plugin قابل للتنزيل. الرسائل المباشرة، محادثات المجموعات، الوسائط، المواقع، رسائل Flex،
رسائل القوالب، والردود السريعة مدعومة. التفاعلات وthreads
غير مدعومة.

## التثبيت

ثبّت LINE قبل تكوين channel:

```bash
openclaw plugins install @openclaw/line
```

نسخة checkout محلية (عند التشغيل من git repo):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## الإعداد

1. أنشئ حساب LINE Developers وافتح Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. أنشئ Provider (أو اختر واحدًا) وأضف channel من نوع **Messaging API**.
3. انسخ **Channel access token** و**Channel secret** من إعدادات channel.
4. فعّل **Use webhook** في إعدادات Messaging API.
5. اضبط Webhook URL على نقطة نهاية Gateway الخاصة بك (HTTPS مطلوب):

```
https://gateway-host/line/webhook
```

يرد Gateway على Webhook verification (GET) من LINE ويقبل signed
inbound events (POST) مباشرة بعد التحقق من signature وpayload validation؛ وتستمر معالجة agent
بشكل غير متزامن.
إذا كنت تحتاج إلى مسار مخصص، فاضبط `channels.line.webhookPath` أو
`channels.line.accounts.<id>.webhookPath` وحدّث URL وفقًا لذلك.

ملاحظة أمنية:

- يعتمد LINE signature verification على body (HMAC على raw body)، لذلك يطبق OpenClaw حدود body صارمة قبل المصادقة وtimeout قبل verification.
- يعالج OpenClaw أحداث Webhook من bytes الطلب الخام التي تم التحقق منها. يتم تجاهل قيم `req.body` التي غيّرها upstream middleware للحفاظ على أمان signature-integrity.

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

تكوين Public DM:

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

Env vars (للحساب default فقط):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

ملفات token/secret:

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

يجب أن يشير `tokenFile` و`secretFile` إلى ملفات regular. يتم رفض Symlinks.

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

تكون الرسائل المباشرة على pairing افتراضيًا. يحصل المرسلون غير المعروفين على pairing code ويتم
تجاهل رسائلهم حتى تتم الموافقة عليهم.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlists والسياسات:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: LINE user IDs المدرجة في allowlist للرسائل المباشرة؛ يلزم `["*"]` عند `dmPolicy: "open"`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: LINE user IDs المدرجة في allowlist للمجموعات
- تجاوزات لكل مجموعة: `channels.line.groups.<groupId>.allowFrom`
- يمكن الإشارة إلى static sender access groups من `allowFrom` و`groupAllowFrom` و`allowFrom` لكل مجموعة باستخدام `accessGroup:<name>`.
- ملاحظة وقت التشغيل: إذا كان `channels.line` مفقودًا بالكامل، فإن runtime يعود إلى `groupPolicy="allowlist"` لفحوصات المجموعة (حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا).

LINE IDs حساسة لحالة الأحرف. تبدو IDs الصالحة هكذا:

- المستخدم: `U` + 32 hex chars
- المجموعة: `C` + 32 hex chars
- الغرفة: `R` + 32 hex chars

## سلوك الرسائل

- يتم تقسيم النص إلى chunks عند 5000 حرف.
- تتم إزالة تنسيق Markdown؛ ويتم تحويل code blocks والجداول إلى Flex
  cards عندما يكون ذلك ممكنًا.
- يتم تخزين Streaming responses مؤقتًا؛ يتلقى LINE chunks كاملة مع loading
  animation أثناء عمل agent.
- تنزيلات الوسائط محدودة بواسطة `channels.line.mediaMaxMb` (default 10).
- يتم حفظ الوسائط الواردة تحت `~/.openclaw/media/inbound/` قبل تمريرها إلى agent،
  بما يطابق shared media store الذي تستخدمه channel
  plugins المجمّعة الأخرى.

## بيانات Channel (الرسائل الغنية)

استخدم `channelData.line` لإرسال quick replies أو locations أو Flex cards أو template
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

يوفّر LINE Plugin أيضًا الأمر `/card` لإعدادات Flex message presets:

```
/card info "Welcome" "Thanks for joining!"
```

## دعم ACP

يدعم LINE روابط محادثات ACP (Agent Communication Protocol):

- يربط `/acp spawn <agent> --bind here` محادثة LINE الحالية بجلسة ACP من دون إنشاء child thread.
- تعمل روابط ACP المكوّنة وجلسات ACP النشطة المرتبطة بالمحادثة على LINE مثل channels المحادثة الأخرى.

للتفاصيل، راجع [وكلاء ACP](/ar/tools/acp-agents).

## الوسائط الصادرة

يدعم LINE Plugin إرسال الصور ومقاطع الفيديو وملفات الصوت عبر أداة رسائل agent. تُرسل الوسائط عبر مسار تسليم خاص بـ LINE مع preview مناسب ومعالجة tracking:

- **الصور**: تُرسل كرسائل صور LINE مع إنشاء preview تلقائي.
- **مقاطع الفيديو**: تُرسل مع preview صريح ومعالجة content-type.
- **الصوت**: يُرسل كرسائل صوت LINE.

يجب أن تكون Outbound media URLs عناوين HTTPS عامة. يتحقق OpenClaw من target hostname قبل تسليم URL إلى LINE ويرفض أهداف loopback وlink-local وprivate-network.

تعود عمليات إرسال الوسائط العامة إلى مسار image-only الحالي عندما لا يتوفر مسار LINE-specific.

## استكشاف الأخطاء وإصلاحها

- **يفشل Webhook verification:** تأكد من أن Webhook URL يستخدم HTTPS وأن
  `channelSecret` يطابق LINE console.
- **لا توجد inbound events:** تأكد من أن مسار Webhook يطابق `channels.line.webhookPath`
  وأن Gateway يمكن الوصول إليه من LINE.
- **أخطاء تنزيل الوسائط:** إذا تجاوزت الوسائط الحد default، فزِد `channels.line.mediaMaxMb`.

## ذات صلة

- [نظرة عامة على Channels](/ar/channels) — جميع channels المدعومة
- [Pairing](/ar/channels/pairing) — مصادقة DM وتدفق pairing
- [المجموعات](/ar/channels/groups) — سلوك محادثة المجموعة وبوابة mention
- [توجيه Channel](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول وhardening
