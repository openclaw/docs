---
read_when:
    - إعداد Synology Chat مع OpenClaw
    - تصحيح أخطاء توجيه Webhook في Synology Chat
summary: إعداد Webhook لـ Synology Chat وإعداد OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-24T07:31:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5135e9aa1fd86437a635378dfbbde321bbd2e5f6fef7a3cc740ea54ebf4b76d5
    source_path: channels/synology-chat.md
    workflow: 15
---

الحالة: Plugin مضمّن لقناة رسائل خاصة يستخدم Webhooks الخاصة بـ Synology Chat.
يقبل الـ Plugin الرسائل الواردة من Synology Chat outgoing webhooks ويرسل الردود
عبر incoming Webhook في Synology Chat.

## Plugin المضمّن

يأتي Synology Chat كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا تحتاج
الإصدارات المعبأة العادية إلى تثبيت منفصل.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا يستثني Synology Chat،
فثبّته يدويًا:

التثبيت من نسخة محلية:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

التفاصيل: [Plugins](/ar/tools/plugin)

## إعداد سريع

1. تأكد من أن Plugin Synology Chat متاح.
   - تتضمنه بالفعل إصدارات OpenClaw المعبأة الحالية.
   - يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا من نسخة مصدر محلية باستخدام الأمر أعلاه.
   - يعرض `openclaw onboard` الآن Synology Chat في قائمة إعداد القنوات نفسها التي يستخدمها `openclaw channels add`.
   - إعداد غير تفاعلي: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. في تكاملات Synology Chat:
   - أنشئ incoming Webhook وانسخ عنوان URL الخاص به.
   - أنشئ outgoing Webhook باستخدام رمزك السري.
3. وجّه عنوان URL الخاص بـ outgoing Webhook إلى OpenClaw gateway:
   - `https://gateway-host/webhook/synology` افتراضيًا.
   - أو قيمة `channels.synology-chat.webhookPath` المخصصة لديك.
4. أكمل الإعداد في OpenClaw.
   - إرشادي: `openclaw onboard`
   - مباشر: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. أعد تشغيل gateway وأرسل رسالة خاصة إلى بوت Synology Chat.

تفاصيل مصادقة Webhook:

- يقبل OpenClaw رمز outgoing Webhook من `body.token`، ثم
  `?token=...`، ثم من الرؤوس.
- صيغ الرؤوس المقبولة:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- تفشل الرموز الفارغة أو المفقودة بشكل مغلق.

إعداد أدنى:

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

لا يمكن ضبط `SYNOLOGY_CHAT_INCOMING_URL` من ملف `.env` الخاص بمساحة العمل؛ راجع [ملفات `.env` لمساحة العمل](/ar/gateway/security).

## سياسة الرسائل الخاصة والتحكم في الوصول

- `dmPolicy: "allowlist"` هو الإعداد الافتراضي الموصى به.
- يقبل `allowedUserIds` قائمة (أو سلسلة مفصولة بفواصل) من معرّفات مستخدمي Synology.
- في وضع `allowlist`، تُعامل قائمة `allowedUserIds` الفارغة على أنها إعداد غير صحيح ولن يبدأ مسار Webhook (استخدم `dmPolicy: "open"` إذا أردت السماح للجميع).
- `dmPolicy: "open"` يسمح لأي مرسل.
- `dmPolicy: "disabled"` يحظر الرسائل الخاصة.
- يبقى ربط مستلم الرد معتمدًا افتراضيًا على `user_id` الرقمي الثابت. تمثل `channels.synology-chat.dangerouslyAllowNameMatching: true` وضع توافق طارئ يعيد تمكين البحث باسم المستخدم/الاسم المستعار القابل للتغيير من أجل تسليم الرد.
- تعمل موافقات الاقتران مع:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## التسليم الصادر

استخدم معرّفات مستخدمي Synology Chat الرقمية كأهداف.

أمثلة:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

إرسال الوسائط مدعوم عبر تسليم الملفات المعتمد على URL.
يجب أن تستخدم عناوين URL للملفات الصادرة `http` أو `https`، ويتم رفض أهداف الشبكة الخاصة أو المحظورة بأي شكل آخر قبل أن يمرر OpenClaw عنوان URL إلى Webhook الخاص بـ NAS.

## حسابات متعددة

تدعم حسابات Synology Chat المتعددة تحت `channels.synology-chat.accounts`.
يمكن لكل حساب تجاوز الرمز وincoming URL ومسار Webhook وسياسة الرسائل الخاصة والحدود.
تُعزل جلسات الرسائل الخاصة لكل حساب ولكل مستخدم، لذلك لا يشارك `user_id` الرقمي نفسه
على حسابين مختلفين في Synology حالة السجل.
امنح كل حساب مفعّل قيمة `webhookPath` مميزة. يرفض OpenClaw الآن المسارات المتطابقة تمامًا
ويرفض تشغيل الحسابات المسماة التي ترث فقط مسار Webhook مشتركًا في إعدادات الحسابات المتعددة.
إذا كنت تحتاج عمدًا إلى هذا الإرث القديم لحساب مسمى، فاضبط
`dangerouslyAllowInheritedWebhookPath: true` على ذلك الحساب أو على `channels.synology-chat`,
لكن المسارات المتطابقة تمامًا تظل مرفوضة بشكل مغلق. من الأفضل استخدام مسارات صريحة لكل حساب.

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

- حافظ على سرية `token` وبدّله إذا تسرّب.
- أبقِ `allowInsecureSsl: false` ما لم تكن تثق صراحةً في شهادة NAS محلية موقعة ذاتيًا.
- يتم التحقق من رموز طلبات Webhook الواردة وتطبيق تحديد المعدل عليها لكل مرسل.
- تستخدم فحوصات الرموز غير الصالحة مقارنة أسرار بزمن ثابت وتفشل بشكل مغلق.
- فضّل `dmPolicy: "allowlist"` في بيئات الإنتاج.
- اترك `dangerouslyAllowNameMatching` معطّلًا ما لم تكن تحتاج صراحةً إلى تسليم الردود القديم المعتمد على اسم المستخدم.
- اترك `dangerouslyAllowInheritedWebhookPath` معطّلًا ما لم تكن تقبل صراحةً مخاطر التوجيه عبر مسار مشترك في إعداد متعدد الحسابات.

## استكشاف الأخطاء وإصلاحها

- `Missing required fields (token, user_id, text)`:
  - حمولة outgoing Webhook تفتقد أحد الحقول المطلوبة
  - إذا كان Synology يرسل الرمز في الرؤوس، فتأكد من أن gateway/proxy يحافظ على تلك الرؤوس
- `Invalid token`:
  - سر outgoing Webhook لا يطابق `channels.synology-chat.token`
  - الطلب يصل إلى الحساب/مسار Webhook الخطأ
  - أزال reverse proxy رأس الرمز قبل وصول الطلب إلى OpenClaw
- `Rate limit exceeded`:
  - قد تؤدي كثرة محاولات الرمز غير الصالح من المصدر نفسه إلى حظر هذا المصدر مؤقتًا
  - يملك المرسلون المصادق عليهم أيضًا حد معدل منفصل لكل مستخدم للرسائل
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - تم تفعيل `dmPolicy="allowlist"` ولكن لم يتم إعداد أي مستخدمين
- `User not authorized`:
  - `user_id` الرقمي الخاص بالمرسل غير موجود في `allowedUserIds`

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل الخاصة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وضبط الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتدعيم
