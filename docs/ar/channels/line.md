---
read_when:
    - تريد ربط OpenClaw بـ LINE
    - تحتاج إلى إعداد Webhook وبيانات الاعتماد لـ LINE
    - تريد خيارات رسائل خاصة بـ LINE
summary: إعداد Plugin لواجهة LINE Messaging API وتهيئته واستخدامه
title: LINE
x-i18n:
    generated_at: "2026-07-12T05:34:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee5931c2bfca4a67a8b390f300907cd31a074988b10c6c0540444cff0bfde334
    source_path: channels/line.md
    workflow: 16
---

يتصل LINE بـ OpenClaw عبر LINE Messaging API. يعمل الـ Plugin كمستقبِل Webhook
على Gateway، ويستخدم رمز وصول القناة + سر القناة الخاصين بك للمصادقة.

الحالة: Plugin رسمي، يُثبَّت بشكل منفصل. تُدعَم الرسائل المباشرة، والمحادثات الجماعية، والوسائط،
والمواقع، ورسائل Flex، ورسائل القوالب، والردود السريعة.
أما التفاعلات وسلاسل المحادثات فغير مدعومة.

## التثبيت

ثبّت LINE قبل إعداد القناة:

```bash
openclaw plugins install @openclaw/line
```

نسخة العمل المحلية (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## الإعداد

1. أنشئ حساب LINE Developers وافتح Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. أنشئ Provider (أو اختر واحدًا) وأضف قناة **Messaging API**.
3. انسخ **Channel access token** و**Channel secret** من إعدادات القناة.
4. فعّل **Use webhook** في إعدادات Messaging API.
5. عيّن عنوان URL الخاص بـ Webhook إلى نقطة نهاية Gateway لديك (يتطلب HTTPS):

```text
https://gateway-host/line/webhook
```

يستجيب Gateway لعملية تحقق Webhook الخاصة بـ LINE (GET)، ويؤكد فورًا استلام
الأحداث الواردة الموقّعة (POST) بعد التحقق من التوقيع والحمولة؛ وتستمر معالجة الوكيل
بشكل غير متزامن.
إذا كنت بحاجة إلى مسار مخصص، فعيّن `channels.line.webhookPath` أو
`channels.line.accounts.<id>.webhookPath` وحدّث عنوان URL وفقًا لذلك.

ملاحظات أمنية:

- يعتمد التحقق من توقيع LINE على جسم الطلب (HMAC على الجسم الخام)، لذلك يطبّق OpenClaw حدًا صارمًا لحجم الجسم قبل المصادقة (64 كيلوبايت) ومهلة للقراءة قبل التحقق.
- يعالج OpenClaw أحداث Webhook من وحدات بايت الطلب الخام المتحقق منها. تُتجاهل قيم `req.body` التي غيّرتها البرمجيات الوسيطة السابقة حفاظًا على سلامة التوقيع.

## الضبط

الحد الأدنى للضبط:

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

ضبط الرسائل المباشرة العامة:

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
تكون لقيم الضبط المضمّنة أولوية على الملفات؛ ومتغيرات البيئة هي خيار الرجوع الأخير للحساب الافتراضي.

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

تستخدم الرسائل المباشرة الاقتران افتراضيًا. يحصل المرسلون غير المعروفين على رمز اقتران، وتُتجاهل
رسائلهم حتى تتم الموافقة عليهم:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

قوائم السماح والسياسات:

- `channels.line.dmPolicy`:‏ `pairing | allowlist | open | disabled` (الافتراضي `pairing`)
- `channels.line.allowFrom`: معرّفات مستخدمي LINE المسموح بها للرسائل المباشرة؛ يتطلب `dmPolicy: "open"` القيمة `["*"]`
- `channels.line.groupPolicy`:‏ `allowlist | open | disabled` (الافتراضي `allowlist`)
- `channels.line.groupAllowFrom`: معرّفات مستخدمي LINE المسموح بها للمجموعات
- تجاوزات لكل مجموعة: `channels.line.groups.<groupId>.allowFrom` (بالإضافة إلى `enabled` و`requireMention` و`systemPrompt` و`skills`)
- يمكن الإشارة إلى مجموعات وصول المرسلين الثابتة من `allowFrom` و`groupAllowFrom` و`allowFrom` لكل مجموعة باستخدام `accessGroup:<name>`؛ راجع [مجموعات الوصول](/ar/channels/access-groups).
- ملاحظة وقت التشغيل: إذا كان `channels.line` مفقودًا بالكامل، يعود وقت التشغيل إلى `groupPolicy="allowlist"` لعمليات التحقق من المجموعات (حتى إذا عُيّن `channels.defaults.groupPolicy`).

معرّفات LINE حساسة لحالة الأحرف. تبدو المعرّفات الصالحة كما يلي:

- المستخدم: `U` + ‏32 محرفًا سداسيًا عشريًا
- المجموعة: `C` + ‏32 محرفًا سداسيًا عشريًا
- الغرفة: `R` + ‏32 محرفًا سداسيًا عشريًا

## سلوك الرسائل

- يُقسَّم النص إلى أجزاء بطول 5000 محرف.
- تُزال تنسيقات Markdown؛ وتُحوّل كتل التعليمات البرمجية والجداول إلى بطاقات Flex
  عندما يكون ذلك ممكنًا.
- تُخزّن الاستجابات المتدفقة مؤقتًا؛ ويتلقى LINE أجزاءً كاملة مع رسم متحرك
  للتحميل أثناء عمل الوكيل.
- يحدّد `channels.line.mediaMaxMb` الحجم الأقصى لتنزيلات الوسائط (الافتراضي 10).
- تُحفظ الوسائط الواردة ضمن `~/.openclaw/media/inbound/` قبل تمريرها
  إلى الوكيل، بما يتوافق مع مخزن الوسائط المشترك الذي تستخدمه Plugins القنوات الأخرى.

## بيانات القناة (الرسائل الغنية)

استخدم `channelData.line` لإرسال ردود سريعة، أو مواقع، أو بطاقات Flex، أو رسائل
قوالب.

```json5
{
  text: "تفضل",
  channelData: {
    line: {
      quickReplies: ["الحالة", "المساعدة"],
      location: {
        title: "المكتب",
        address: "123 الشارع الرئيسي",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "بطاقة الحالة",
        contents: {/* حمولة Flex */},
      },
      templateMessage: {
        type: "confirm",
        text: "هل تريد المتابعة؟",
        confirmLabel: "نعم",
        confirmData: "yes",
        cancelLabel: "لا",
        cancelData: "no",
      },
    },
  },
}
```

يأتي Plugin الخاص بـ LINE أيضًا مع أمر `/card` لإعدادات رسائل Flex المسبقة:

```text
/card info "مرحبًا" "شكرًا لانضمامك!"
```

## دعم ACP

يدعم LINE ارتباطات محادثات ACP (بروتوكول اتصال الوكلاء):

- يربط `/acp spawn <agent> --bind here` محادثة LINE الحالية بجلسة ACP من دون إنشاء سلسلة محادثة فرعية.
- تعمل ارتباطات ACP المضبوطة وجلسات ACP النشطة المرتبطة بالمحادثات على LINE كما تعمل في قنوات المحادثات الأخرى.

راجع [وكلاء ACP](/ar/tools/acp-agents) للحصول على التفاصيل.

## الوسائط الصادرة

يرسل Plugin الخاص بـ LINE الصور ومقاطع الفيديو والصوت عبر أداة رسائل الوكيل:

- **الصور**: تُرسل كرسائل صور في LINE؛ وتستخدم صورة المعاينة عنوان URL للوسائط افتراضيًا.
- **مقاطع الفيديو**: تتطلب صورة معاينة؛ عيّن `channelData.line.previewImageUrl` إلى عنوان URL لصورة.
- **الصوت**: يُرسل كرسائل صوتية في LINE؛ وتكون المدة الافتراضية 60 ثانية ما لم يُعيّن `channelData.line.durationMs`.

يُؤخذ نوع الوسائط من `channelData.line.mediaKind` عند تعيينه، وإلا فيُستدل عليه
من خيارات LINE الأخرى أو لاحقة ملف عنوان URL، مع استخدام الصورة كخيار رجوع.

يجب أن تكون عناوين URL للوسائط الصادرة عناوين HTTPS عامة بطول لا يتجاوز 2000 محرف. يتحقق OpenClaw
من اسم مضيف الوجهة قبل تمرير عنوان URL إلى LINE، ويرفض أهداف local loopback،
والشبكة المحلية للرابط، والشبكات الخاصة.

تستخدم عمليات إرسال الوسائط العامة التي لا تتضمن خيارات خاصة بـ LINE مسار الصور.

## استكشاف الأخطاء وإصلاحها

- **فشل التحقق من Webhook:** تأكد من أن عنوان URL الخاص بـ Webhook يستخدم HTTPS وأن
  `channelSecret` يطابق LINE Console.
- **لا توجد أحداث واردة:** تأكد من أن مسار Webhook يطابق `channels.line.webhookPath`
  وأن LINE يستطيع الوصول إلى Gateway.
- **أخطاء تنزيل الوسائط:** ارفع قيمة `channels.line.mediaMaxMb` إذا تجاوزت الوسائط
  الحد الافتراضي.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك المحادثات الجماعية واشتراط الإشارة
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه جلسات الرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
