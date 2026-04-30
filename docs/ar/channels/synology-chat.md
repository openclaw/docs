---
read_when:
    - إعداد Synology Chat مع OpenClaw
    - تصحيح أخطاء توجيه Webhook في Synology Chat
summary: إعداد Webhook في Synology Chat وتهيئة OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-30T07:43:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3d6d7a56bd15d29de38c6ae29ae496b491c2e75df5e0a0a15410b0fbdc55a00
    source_path: channels/synology-chat.md
    workflow: 16
---

الحالة: قناة رسائل مباشرة من Plugin مضمّن تستخدم Synology Chat webhooks.
يقبل Plugin الرسائل الواردة من Synology Chat outgoing webhooks ويرسل الردود
عبر Synology Chat incoming webhook.

## Plugin مضمّن

يأتي Synology Chat كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا تحتاج
الإصدارات المعبأة العادية إلى تثبيت منفصل.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا يستبعد Synology Chat،
فثبّته يدويًا:

التثبيت من نسخة محلية:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

التفاصيل: [Plugins](/ar/tools/plugin)

## الإعداد السريع

1. تأكد من توفر Synology Chat Plugin.
   - إصدارات OpenClaw المعبأة الحالية تتضمنه بالفعل.
   - يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا من نسخة مصدر باستخدام الأمر أعلاه.
   - يعرض `openclaw onboard` الآن Synology Chat في قائمة إعداد القنوات نفسها مثل `openclaw channels add`.
   - الإعداد غير التفاعلي: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. في تكاملات Synology Chat:
   - أنشئ incoming webhook وانسخ عنوان URL الخاص به.
   - أنشئ outgoing webhook باستخدام رمزك السري.
3. وجّه عنوان URL الخاص بـ outgoing webhook إلى OpenClaw gateway:
   - `https://gateway-host/webhook/synology` افتراضيًا.
   - أو `channels.synology-chat.webhookPath` المخصص لديك.
4. أكمل الإعداد في OpenClaw.
   - موجه: `openclaw onboard`
   - مباشر: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. أعد تشغيل Gateway وأرسل DM إلى Synology Chat bot.

تفاصيل مصادقة Webhook:

- يقبل OpenClaw رمز outgoing webhook من `body.token`، ثم
  `?token=...`، ثم الترويسات.
- صيغ الترويسات المقبولة:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- تفشل الرموز الفارغة أو المفقودة بإغلاق آمن.

الحد الأدنى للإعداد:

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

لا يمكن تعيين `SYNOLOGY_CHAT_INCOMING_URL` من ملف `.env` لمساحة العمل؛ راجع [ملفات `.env` لمساحة العمل](/ar/gateway/security).

## سياسة DM والتحكم في الوصول

- `dmPolicy: "allowlist"` هو الإعداد الافتراضي الموصى به.
- يقبل `allowedUserIds` قائمة (أو سلسلة مفصولة بفواصل) من معرفات مستخدمي Synology.
- في وضع `allowlist`، تُعامل قائمة `allowedUserIds` الفارغة كخطأ في الإعداد ولن يبدأ مسار Webhook (استخدم `dmPolicy: "open"` مع `allowedUserIds: ["*"]` للسماح للجميع).
- يسمح `dmPolicy: "open"` برسائل DM العامة فقط عندما يتضمن `allowedUserIds` القيمة `"*"`؛ ومع الإدخالات المقيّدة، لا يمكن الدردشة إلا للمستخدمين المطابقين.
- يحظر `dmPolicy: "disabled"` رسائل DM.
- يبقى ربط مستلم الرد على `user_id` الرقمي المستقر افتراضيًا. `channels.synology-chat.dangerouslyAllowNameMatching: true` هو وضع توافق لكسر الزجاج يعيد تمكين البحث باسم المستخدم/اللقب القابل للتغيير لتسليم الردود.
- تعمل موافقات الاقتران مع:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## التسليم الصادر

استخدم معرفات مستخدمي Synology Chat الرقمية كأهداف.

أمثلة:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

إرسال الوسائط مدعوم عبر تسليم الملفات المستند إلى URL.
يجب أن تستخدم عناوين URL للملفات الصادرة `http` أو `https`، ويتم رفض الأهداف الشبكية الخاصة أو المحظورة بطريقة أخرى قبل أن يمرر OpenClaw عنوان URL إلى NAS webhook.

## الحسابات المتعددة

تُدعم حسابات Synology Chat متعددة ضمن `channels.synology-chat.accounts`.
يمكن لكل حساب تجاوز الرمز، وعنوان URL الوارد، ومسار Webhook، وسياسة DM، والحدود.
تُعزل جلسات الرسائل المباشرة لكل حساب ومستخدم، لذلك فإن `user_id`
الرقمي نفسه على حسابي Synology مختلفين لا يشارك حالة النص.
امنح كل حساب مفعّل `webhookPath` مميزًا. يرفض OpenClaw الآن المسارات الدقيقة المكررة
ويرفض بدء الحسابات المسماة التي ترث فقط مسار Webhook مشتركًا في إعدادات متعددة الحسابات.
إذا كنت تحتاج عمدًا إلى الوراثة القديمة لحساب مسمى، فاضبط
`dangerouslyAllowInheritedWebhookPath: true` على ذلك الحساب أو في `channels.synology-chat`،
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
- أبقِ `allowInsecureSsl: false` ما لم تكن تثق صراحةً بشهادة NAS محلية ذاتية التوقيع.
- يتم التحقق من طلبات Webhook الواردة بالرمز وتحديد معدلها لكل مرسل.
- تستخدم فحوصات الرمز غير الصالح مقارنة أسرار بزمن ثابت وتفشل بإغلاق آمن.
- فضّل `dmPolicy: "allowlist"` للإنتاج.
- أبقِ `dangerouslyAllowNameMatching` معطلًا ما لم تكن تحتاج صراحةً إلى تسليم الردود القديم المستند إلى اسم المستخدم.
- أبقِ `dangerouslyAllowInheritedWebhookPath` معطلًا ما لم تكن تقبل صراحةً مخاطر التوجيه عبر مسار مشترك في إعداد متعدد الحسابات.

## استكشاف الأخطاء وإصلاحها

- `Missing required fields (token, user_id, text)`:
  - حمولة outgoing webhook تفتقد أحد الحقول المطلوبة
  - إذا كان Synology يرسل الرمز في الترويسات، فتأكد من أن Gateway/الوكيل يحافظ على تلك الترويسات
- `Invalid token`:
  - سر outgoing webhook لا يطابق `channels.synology-chat.token`
  - يصل الطلب إلى الحساب/مسار Webhook الخطأ
  - أزال وكيل عكسي ترويسة الرمز قبل وصول الطلب إلى OpenClaw
- `Rate limit exceeded`:
  - قد تؤدي محاولات الرمز غير الصالح الكثيرة جدًا من المصدر نفسه إلى قفل ذلك المصدر مؤقتًا
  - لدى المرسلين المصادق عليهم أيضًا حد معدل رسائل منفصل لكل مستخدم
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` مفعّل لكن لم يتم إعداد أي مستخدمين
- `User not authorized`:
  - `user_id` الرقمي للمرسل غير موجود في `allowedUserIds`

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة DM وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
