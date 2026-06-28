---
read_when:
    - إعداد Synology Chat مع OpenClaw
    - استكشاف أخطاء توجيه Webhook في Synology Chat وإصلاحها
summary: إعداد Webhook لـ Synology Chat وتكوين OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-05-02T07:19:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1946425fa6e7a071b03d212854476dc2c0af98097f38da93d3711e5a5c7e96
    source_path: channels/synology-chat.md
    workflow: 16
    postprocess_version: locale-links-v1
---

الحالة: قناة رسائل مباشرة عبر Plugin مضمّن يستخدم Webhook الخاصة بـ Synology Chat.
يقبل Plugin الرسائل الواردة من Webhook الصادرة في Synology Chat ويرسل الردود
عبر Webhook وارد في Synology Chat.

## Plugin مضمّن

يأتي Synology Chat كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا تحتاج
البُنى المعبأة العادية إلى تثبيت منفصل.

إذا كنت تستخدم بنية أقدم أو تثبيتًا مخصصًا يستبعد Synology Chat،
فثبّته يدويًا:

التثبيت من نسخة محلية:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

التفاصيل: [Plugins](/ar/tools/plugin)

## الإعداد السريع

1. تأكد من توفر Plugin الخاص بـ Synology Chat.
   - إصدارات OpenClaw المعبأة الحالية تضمنه بالفعل.
   - يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا من نسخة مصدرية باستخدام الأمر أعلاه.
   - يعرض `openclaw onboard` الآن Synology Chat في قائمة إعداد القنوات نفسها مثل `openclaw channels add`.
   - إعداد غير تفاعلي: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. في تكاملات Synology Chat:
   - أنشئ Webhook واردًا وانسخ عنوان URL الخاص به.
   - أنشئ Webhook صادرًا مع الرمز السري الخاص بك.
3. وجّه عنوان URL الخاص بالـ Webhook الصادر إلى Gateway الخاص بـ OpenClaw:
   - `https://gateway-host/webhook/synology` افتراضيًا.
   - أو `channels.synology-chat.webhookPath` المخصص لديك.
4. أكمل الإعداد في OpenClaw.
   - موجّه: `openclaw onboard`
   - مباشر: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. أعد تشغيل Gateway وأرسل رسالة مباشرة إلى بوت Synology Chat.

تفاصيل مصادقة Webhook:

- يقبل OpenClaw رمز Webhook الصادر من `body.token`، ثم
  `?token=...`، ثم الترويسات.
- صيغ الترويسات المقبولة:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- الرموز الفارغة أو المفقودة تفشل بإغلاق آمن.

الحد الأدنى من الإعداد:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## متغيرات البيئة

للحساب الافتراضي، يمكنك استخدام متغيرات البيئة:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (مفصولة بفواصل)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

تتجاوز قيم الإعداد متغيرات البيئة.

لا يمكن تعيين `SYNOLOGY_CHAT_INCOMING_URL` من ملف `.env` في مساحة العمل؛ راجع [ملفات `.env` في مساحة العمل](/ar/gateway/security).

## سياسة الرسائل المباشرة والتحكم في الوصول

- `dmPolicy: "allowlist"` هو الخيار الافتراضي الموصى به.
- يقبل `allowedUserIds` قائمة (أو سلسلة مفصولة بفواصل) من معرّفات مستخدمي Synology.
- في وضع `allowlist`، تُعامل قائمة `allowedUserIds` الفارغة كخطأ في الإعداد ولن يبدأ مسار Webhook (استخدم `dmPolicy: "open"` مع `allowedUserIds: ["*"]` للسماح للجميع).
- يتيح `dmPolicy: "open"` الرسائل المباشرة العامة فقط عندما يتضمن `allowedUserIds` القيمة `"*"`؛ ومع الإدخالات التقييدية، يمكن للمستخدمين المطابقين فقط الدردشة.
- يحظر `dmPolicy: "disabled"` الرسائل المباشرة.
- يبقى ربط مستلم الرد على `user_id` الرقمي المستقر افتراضيًا. يُعد `channels.synology-chat.dangerouslyAllowNameMatching: true` وضع توافق للطوارئ يعيد تمكين البحث باسم المستخدم/اللقب القابل للتغيير لتسليم الرد.
- تعمل موافقات الاقتران مع:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## التسليم الصادر

استخدم معرّفات مستخدمي Synology Chat الرقمية كأهداف.

أمثلة:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --text "Short prefix"
```

إرسال الوسائط مدعوم عبر تسليم الملفات المستند إلى URL.
يجب أن تستخدم عناوين URL للملفات الصادرة `http` أو `https`، ويتم رفض أهداف الشبكات الخاصة أو المحظورة بطريقة أخرى قبل أن يمرر OpenClaw عنوان URL إلى Webhook الخاص بـ NAS.

## الحسابات المتعددة

تُدعم حسابات Synology Chat المتعددة ضمن `channels.synology-chat.accounts`.
يمكن لكل حساب تجاوز الرمز، وعنوان URL الوارد، ومسار Webhook، وسياسة الرسائل المباشرة، والحدود.
تُعزل جلسات الرسائل المباشرة لكل حساب ومستخدم، لذلك لا يشارك `user_id`
الرقمي نفسه على حسابين مختلفين في Synology حالة النص المنسوخ.
امنح كل حساب مفعّل `webhookPath` مميزًا. يرفض OpenClaw الآن المسارات الدقيقة المكررة
ويرفض بدء الحسابات المسماة التي لا تفعل سوى وراثة مسار Webhook مشترك في إعدادات الحسابات المتعددة.
إذا كنت تحتاج عمدًا إلى الوراثة القديمة لحساب مسمى، فعيّن
`dangerouslyAllowInheritedWebhookPath: true` على ذلك الحساب أو عند `channels.synology-chat`،
لكن المسارات الدقيقة المكررة تظل مرفوضة بإغلاق آمن. فضّل المسارات الصريحة لكل حساب.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## ملاحظات الأمان

- أبقِ `token` سريًا ودوّره إذا تسرّب.
- أبقِ `allowInsecureSsl: false` ما لم تكن تثق صراحةً بشهادة NAS محلية موقعة ذاتيًا.
- يتم التحقق من طلبات Webhook الواردة بالرمز وتقييد معدلها لكل مرسل.
- تستخدم فحوصات الرمز غير الصالح مقارنة أسرار بزمن ثابت وتفشل بإغلاق آمن.
- فضّل `dmPolicy: "allowlist"` للإنتاج.
- أبقِ `dangerouslyAllowNameMatching` معطلًا ما لم تكن تحتاج صراحةً إلى تسليم الردود القديم المستند إلى اسم المستخدم.
- أبقِ `dangerouslyAllowInheritedWebhookPath` معطلًا ما لم تكن تقبل صراحةً خطر التوجيه عبر مسار مشترك في إعداد حسابات متعددة.

## استكشاف الأخطاء وإصلاحها

- `Missing required fields (token, user_id, text)`:
  - تفتقد حمولة Webhook الصادر أحد الحقول المطلوبة
  - إذا كان Synology يرسل الرمز في الترويسات، فتأكد من أن Gateway/الوكيل يحافظ على تلك الترويسات
- `Invalid token`:
  - سر Webhook الصادر لا يطابق `channels.synology-chat.token`
  - الطلب يصل إلى الحساب/مسار Webhook الخطأ
  - أزال وكيل عكسي ترويسة الرمز قبل وصول الطلب إلى OpenClaw
- `Rate limit exceeded`:
  - قد تؤدي محاولات الرمز غير الصالح الكثيرة جدًا من المصدر نفسه إلى قفل ذلك المصدر مؤقتًا
  - لدى المرسلين المصادق عليهم أيضًا حد معدل رسائل منفصل لكل مستخدم
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - تم تمكين `dmPolicy="allowlist"` لكن لم يتم إعداد أي مستخدمين
- `User not authorized`:
  - `user_id` الرقمي للمرسل غير موجود في `allowedUserIds`

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
