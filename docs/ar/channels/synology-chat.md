---
read_when:
    - إعداد Synology Chat مع OpenClaw
    - تصحيح أخطاء توجيه Webhook في Synology Chat
summary: إعداد Webhook لـ Synology Chat وتهيئة OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-07-12T05:35:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7829bb1464c4f5546adf086a96b7f3478e6f03e35ed2443bd92c160fa3d2bb8b
    source_path: channels/synology-chat.md
    workflow: 16
---

يتصل Synology Chat بـ OpenClaw من خلال زوج من Webhook: يرسل Webhook صادر من Synology Chat الرسائل المباشرة الواردة إلى Gateway، وتعود الردود من خلال Webhook وارد إلى Synology Chat.

الحالة: Plugin رسمي، يُثبَّت بشكل منفصل. الرسائل المباشرة فقط؛ إرسال النصوص والملفات المستند إلى عناوين URL مدعوم.

## التثبيت

```bash
openclaw plugins install @openclaw/synology-chat
```

نسخة العمل المحلية (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

التفاصيل: [Plugins](/ar/tools/plugin)

## الإعداد السريع

1. ثبّت Plugin (أعلاه).
2. في عمليات تكامل Synology Chat:
   - أنشئ Webhook واردًا وانسخ عنوان URL الخاص به.
   - أنشئ Webhook صادرًا باستخدام الرمز المميز السري الخاص بك.
3. وجّه عنوان URL للـ Webhook الصادر إلى Gateway الخاص بـ OpenClaw:
   - `https://gateway-host/webhook/synology` افتراضيًا.
   - أو `channels.synology-chat.webhookPath` المخصص.
4. أكمل الإعداد في OpenClaw. يظهر Synology Chat في قائمة إعداد القنوات نفسها في كلا المسارين:
   - الموجّه: `openclaw onboard` أو `openclaw channels add`
   - المباشر: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. أعد تشغيل Gateway وأرسل رسالة مباشرة إلى بوت Synology Chat.

تفاصيل مصادقة Webhook:

- يقبل OpenClaw الرمز المميز للـ Webhook الصادر من `body.token`، ثم
  `?token=...`، ثم الترويسات.
- صيغ الترويسات المقبولة:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- تؤدي الرموز المميزة الفارغة أو المفقودة إلى الرفض الآمن.
- يمكن أن تكون الحمولات من النوع `application/x-www-form-urlencoded` أو `application/json`؛ والحقول `token` و`user_id` و`text` مطلوبة.

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

بالنسبة إلى الحساب الافتراضي، يمكنك استخدام متغيرات البيئة:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (مفصولة بفواصل)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

تتجاوز قيم الإعداد متغيرات البيئة.

لا يمكن تعيين `SYNOLOGY_CHAT_INCOMING_URL` و`SYNOLOGY_NAS_HOST` من ملف `.env` في مساحة العمل؛ راجع [ملفات `.env` في مساحة العمل](/ar/gateway/security#workspace-env-files).

## سياسة الرسائل المباشرة والتحكم في الوصول

- قيم `dmPolicy` المدعومة: `allowlist` (الافتراضية) و`open` و`disabled`. لا يوفّر Synology Chat مسار إقران؛ وافق على المرسلين بإضافة معرّفات مستخدمي Synology الرقمية الخاصة بهم إلى `allowedUserIds`.
- يقبل `allowedUserIds` قائمة (أو سلسلة مفصولة بفواصل) من معرّفات مستخدمي Synology.
- في وضع `allowlist`، تُعامل قائمة `allowedUserIds` الفارغة على أنها إعداد خاطئ، ولن يبدأ مسار Webhook.
- يسمح `dmPolicy: "open"` بالرسائل المباشرة العامة فقط عندما تتضمن `allowedUserIds` القيمة `"*"`؛ ومع الإدخالات التقييدية، لا يمكن إلا للمستخدمين المطابقين إجراء المحادثة. كما يرفض `open` مع قائمة `allowedUserIds` فارغة بدء المسار.
- يحظر `dmPolicy: "disabled"` الرسائل المباشرة.
- يظل ربط مستلم الرد قائمًا افتراضيًا على `user_id` الرقمي الثابت. يمثّل `channels.synology-chat.dangerouslyAllowNameMatching: true` وضع توافق للاستخدام في حالات الطوارئ، ويعيد تمكين البحث باستخدام اسم المستخدم/الاسم المستعار القابل للتغيير لتسليم الردود.

## التسليم الصادر

استخدم معرّفات مستخدمي Synology Chat الرقمية كأهداف. تُقبل البادئات `synology-chat:` و`synology_chat:` و`synology:`.

أمثلة:

```bash
openclaw message send --channel synology-chat --target 123456 --message "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --message "Short prefix"
```

يُقسَّم النص الصادر عند 2000 حرف. يُدعم إرسال الوسائط من خلال تسليم الملفات المستند إلى عناوين URL: ينزّل جهاز NAS الملف ويرفقه (بحد أقصى 32 ميغابايت). يجب أن تستخدم عناوين URL للملفات الصادرة `http` أو `https`، وتُرفض أهداف الشبكة الخاصة أو المحظورة بأي شكل آخر قبل أن يمرّر OpenClaw عنوان URL إلى Webhook الخاص بجهاز NAS.

## تعدد الحسابات

تُدعم حسابات Synology Chat المتعددة ضمن `channels.synology-chat.accounts`.
يمكن لكل حساب تجاوز الرمز المميز وعنوان URL الوارد ومسار Webhook وسياسة الرسائل المباشرة والحدود.
تُعزل جلسات الرسائل المباشرة لكل حساب ومستخدم، ولذلك فإن `user_id` الرقمي نفسه
في حسابين مختلفين على Synology لا يتشارك حالة سجل المحادثة.
امنح كل حساب مفعّل `webhookPath` مميزًا. يرفض OpenClaw المسارات المتطابقة المكررة
ويرفض بدء الحسابات المسماة التي لا تفعل سوى وراثة مسار Webhook مشترك في إعدادات تعدد الحسابات.
إذا كنت تحتاج عمدًا إلى الوراثة القديمة لحساب مسمى، فعيّن
`dangerouslyAllowInheritedWebhookPath: true` في ذلك الحساب أو في `channels.synology-chat`،
لكن تظل المسارات المتطابقة المكررة مرفوضة رفضًا آمنًا. يُفضّل تحديد مسارات صريحة لكل حساب.

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

## ملاحظات أمنية

- حافظ على سرية `token` ودوّره إذا تسرّب.
- أبقِ `allowInsecureSsl: false` ما لم تكن تثق صراحةً بشهادة محلية موقعة ذاتيًا لجهاز NAS.
- تُتحقق طلبات Webhook الواردة باستخدام الرمز المميز، ويُطبَّق عليها حد للمعدل لكل مرسل (`rateLimitPerMinute`، والقيمة الافتراضية 30).
- تستخدم عمليات التحقق من الرموز المميزة غير الصالحة مقارنة أسرار ثابتة الزمن وتؤدي إلى الرفض الآمن؛ وتؤدي المحاولات المتكررة باستخدام رمز مميز غير صالح إلى حظر عنوان IP المصدر مؤقتًا.
- يُنقّى نص الرسالة الواردة من أنماط حقن الموجّهات المعروفة ويُقتطع عند 4000 حرف.
- يُفضّل استخدام `dmPolicy: "allowlist"` في بيئة الإنتاج.
- أبقِ `dangerouslyAllowNameMatching` معطّلًا ما لم تكن تحتاج صراحةً إلى تسليم الردود القديم المستند إلى اسم المستخدم.
- أبقِ `dangerouslyAllowInheritedWebhookPath` معطّلًا ما لم تكن تقبل صراحةً مخاطر التوجيه عبر مسار مشترك في إعداد متعدد الحسابات.

## استكشاف الأخطاء وإصلاحها

- `Missing required fields (token, user_id, text)`:
  - تفتقد حمولة Webhook الصادر أحد الحقول المطلوبة
  - إذا كان Synology يرسل الرمز المميز في الترويسات، فتأكد من أن Gateway/الوكيل يحافظ على تلك الترويسات
- `Invalid token`:
  - سر Webhook الصادر لا يطابق `channels.synology-chat.token`
  - يصل الطلب إلى الحساب/مسار Webhook الخطأ
  - أزال وكيل عكسي ترويسة الرمز المميز قبل وصول الطلب إلى OpenClaw
- `Rate limit exceeded`:
  - يمكن أن تؤدي كثرة محاولات استخدام رمز مميز غير صالح من المصدر نفسه إلى حظر ذلك المصدر مؤقتًا
  - يخضع المرسلون المصادق عليهم أيضًا لحد منفصل لمعدل الرسائل لكل مستخدم
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - تم تمكين `dmPolicy="allowlist"` لكن لم تتم تهيئة أي مستخدمين
- `User not authorized`:
  - `user_id` الرقمي للمرسل غير موجود في `allowedUserIds`

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [المجموعات](/ar/channels/groups) — سلوك المحادثات الجماعية واشتراط الإشارة
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه جلسات الرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
