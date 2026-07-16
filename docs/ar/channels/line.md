---
read_when:
    - تريد ربط OpenClaw بـ LINE
    - تحتاج إلى إعداد Webhook وبيانات الاعتماد لـ LINE
    - تريد خيارات رسائل خاصة بـ LINE
summary: إعداد Plugin ‏LINE Messaging API وتهيئته واستخدامه
title: LINE
x-i18n:
    generated_at: "2026-07-16T13:41:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 31004467bc227b3a4e18168d1aa8b7f60d59e58994aeb890ac257beb2dbe8449
    source_path: channels/line.md
    workflow: 16
---

يرتبط LINE بـ OpenClaw عبر LINE Messaging API. يعمل الـ plugin كمستقبِل Webhook
على Gateway ويستخدم رمز وصول القناة + سر القناة الخاصين بك
للمصادقة.

الحالة: plugin رسمي، يُثبَّت بشكل منفصل. تُدعم الرسائل المباشرة، والمحادثات الجماعية، والوسائط،
والمواقع، ورسائل Flex، ورسائل القوالب، والردود السريعة.
لا تُدعم التفاعلات وسلاسل المحادثات.

## التثبيت

ثبّت LINE قبل تهيئة القناة:

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
5. عيّن عنوان URL للـ webhook إلى نقطة نهاية Gateway الخاصة بك (يلزم HTTPS):

```text
https://gateway-host/line/webhook
```

يستجيب Gateway لعملية تحقق LINE من الـ webhook ‏(GET)، ويقرّ فورًا بالأحداث
الواردة الموقّعة (POST) بعد التحقق من التوقيع والحمولة؛ وتستمر معالجة
الوكيل بشكل غير متزامن.
إذا كنت بحاجة إلى مسار مخصص، فعيّن `channels.line.webhookPath` أو
`channels.line.accounts.<id>.webhookPath` وحدّث عنوان URL وفقًا لذلك.

ملاحظات أمنية:

- يعتمد التحقق من توقيع LINE على المتن (HMAC على المتن الخام)، ولذلك يطبّق OpenClaw حدًا صارمًا لحجم المتن قبل المصادقة (64 KB) ومهلة للقراءة قبل التحقق.
- يعالج OpenClaw أحداث الـ webhook من بايتات الطلب الخام التي تم التحقق منها. تُتجاهل قيم `req.body` التي حوّلتها البرمجيات الوسيطة السابقة حفاظًا على سلامة التوقيع.

## التهيئة

أدنى تهيئة:

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

يجب أن يشير `tokenFile` و`secretFile` إلى ملفات عادية. تُرفض الروابط الرمزية.
تتغلب قيم التهيئة المضمّنة على الملفات؛ ومتغيرات البيئة هي خيار الرجوع الأخير للحساب الافتراضي.

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

- `channels.line.dmPolicy`: ‏`pairing | allowlist | open | disabled` (الافتراضي `pairing`)
- `channels.line.allowFrom`: معرّفات مستخدمي LINE المسموح بها للرسائل المباشرة؛ يتطلب `dmPolicy: "open"` القيمة `["*"]`
- `channels.line.groupPolicy`: ‏`allowlist | open | disabled` (الافتراضي `allowlist`)
- `channels.line.groupAllowFrom`: معرّفات مستخدمي LINE المسموح بها للمجموعات؛ لا تسمح إدخالات `allowFrom` الخاصة بالرسائل المباشرة لمرسلي المجموعات بالدخول
- تجاوزات خاصة بكل مجموعة: `channels.line.groups.<groupId>.allowFrom` (بالإضافة إلى `enabled` و`requireMention` و`systemPrompt` و`skills`). مع
  `groupPolicy: "allowlist"`، عيّن `groupAllowFrom` أو `allowFrom` الخاص بكل مجموعة؛ تحظر قائمة سماح المجموعات الفارغة رسائل المجموعات حتى عندما تكون الرسائل المباشرة مفتوحة.
- يمكن الإشارة إلى مجموعات وصول المرسلين الثابتة من `allowFrom` و`groupAllowFrom` و`allowFrom` الخاص بكل مجموعة باستخدام `accessGroup:<name>`؛ راجع [مجموعات الوصول](/ar/channels/access-groups).
- ملاحظة وقت التشغيل: إذا كان `channels.line` مفقودًا تمامًا، يرجع وقت التشغيل إلى `groupPolicy="allowlist"` لإجراء عمليات التحقق الخاصة بالمجموعات (حتى إذا عُيّن `channels.defaults.groupPolicy`).

معرّفات LINE حساسة لحالة الأحرف. تبدو المعرّفات الصالحة كما يلي:

- المستخدم: `U` + 32 محرفًا سداسيًا عشريًا
- المجموعة: `C` + 32 محرفًا سداسيًا عشريًا
- الغرفة: `R` + 32 محرفًا سداسيًا عشريًا

## سلوك الرسائل

- يُقسَّم النص إلى أجزاء بطول 5000 محرف.
- تُزال تنسيقات Markdown؛ وتُحوَّل كتل الشيفرة والجداول إلى بطاقات Flex
  متى أمكن.
- تُخزَّن الاستجابات المتدفقة مؤقتًا؛ ويتلقى LINE أجزاءً كاملة مع رسم متحرك
  للتحميل أثناء عمل الوكيل.
- تُقيَّد تنزيلات الوسائط بواسطة `channels.line.mediaMaxMb` (الافتراضي 10).
- تُحفظ الوسائط الواردة ضمن `~/.openclaw/media/inbound/` قبل تمريرها
  إلى الوكيل، بما يتوافق مع مخزن الوسائط المشترك الذي تستخدمه plugins القنوات الأخرى.

## بيانات القناة (الرسائل الغنية)

استخدم `channelData.line` لإرسال ردود سريعة أو مواقع أو بطاقات Flex أو رسائل
قوالب.

```json5
{
  text: "إليك ما طلبت",
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

يتضمن plugin ‏LINE أيضًا أمر `/card` لإعدادات رسائل Flex المسبقة:

```text
/card info "مرحبًا" "شكرًا لانضمامك!"
```

## دعم ACP

يدعم LINE ارتباطات محادثات ACP (بروتوكول تواصل الوكلاء):

- يربط `/acp spawn <agent> --bind here` محادثة LINE الحالية بجلسة ACP دون إنشاء سلسلة محادثة فرعية.
- تعمل ارتباطات ACP المُهيأة وجلسات ACP النشطة المرتبطة بالمحادثات على LINE كما في قنوات المحادثة الأخرى.

راجع [وكلاء ACP](/ar/tools/acp-agents) لمزيد من التفاصيل.

## الوسائط الصادرة

يرسل plugin ‏LINE الصور ومقاطع الفيديو والصوت عبر أداة رسائل الوكيل:

- **الصور**: تُرسل كرسائل صور في LINE؛ وتستخدم صورة المعاينة عنوان URL للوسائط افتراضيًا.
- **مقاطع الفيديو**: تتطلب صورة معاينة؛ عيّن `channelData.line.previewImageUrl` إلى عنوان URL لصورة.
- **الصوت**: يُرسل كرسائل صوتية في LINE؛ وتكون المدة الافتراضية 60 ثانية ما لم يُعيَّن `channelData.line.durationMs`.

يُؤخذ نوع الوسائط من `channelData.line.mediaKind` عند تعيينه، وإلا فيُستنتج
من خيارات LINE الأخرى أو لاحقة ملف عنوان URL، مع استخدام الصورة كخيار رجوع.

يجب أن تكون عناوين URL للوسائط الصادرة عناوين HTTPS عامة لا يزيد طولها عن 2000 محرف. يتحقق OpenClaw
من اسم المضيف المستهدف قبل تسليم عنوان URL إلى LINE، ويرفض أهداف الاسترجاع المحلي
والشبكة المحلية للرابط والشبكات الخاصة.

تستخدم عمليات إرسال الوسائط العامة دون خيارات خاصة بـ LINE مسار الصور.

## استكشاف الأخطاء وإصلاحها

- **فشل التحقق من الـ webhook:** تأكد من أن عنوان URL للـ webhook يستخدم HTTPS وأن
  `channelSecret` يطابق LINE console.
- **لا توجد أحداث واردة:** تأكد من أن مسار الـ webhook يطابق `channels.line.webhookPath`
  وأن LINE يمكنه الوصول إلى Gateway.
- **أخطاء تنزيل الوسائط:** ارفع `channels.line.mediaMaxMb` إذا تجاوزت الوسائط
  الحد الافتراضي.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك المحادثات الجماعية والتحكم عبر الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه جلسات الرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
