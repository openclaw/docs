---
read_when:
    - إعداد التحكم في الوصول إلى الرسائل المباشرة
    - إقران Node جديدة بنظام iOS/Android
    - مراجعة الوضع الأمني لـ OpenClaw
summary: 'نظرة عامة على الاقتران: الموافقة على من يمكنه مراسلتك مباشرةً + أي Node يمكنها الانضمام'
title: الاقتران
x-i18n:
    generated_at: "2026-04-24T07:31:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 373eaa02865995ada0c906df9bad4e8328f085a8bb3679b0a5820dc397130137
    source_path: channels/pairing.md
    workflow: 15
---

يشير "الاقتران" في OpenClaw إلى خطوة **موافقة المالك** الصريحة.
ويُستخدم في موضعين:

1. **اقتران الرسائل المباشرة** (من المسموح له بالتحدث إلى البوت)
2. **اقتران Node** (أي الأجهزة/العُقد المسموح لها بالانضمام إلى شبكة gateway)

السياق الأمني: [الأمان](/ar/gateway/security)

## 1) اقتران الرسائل المباشرة (الوصول إلى الدردشة الواردة)

عندما تُضبط قناة بسياسة رسائل مباشرة `pairing`، يحصل المرسلون غير المعروفين على رمز قصير ولا تتم **معالجة** رسالتهم حتى توافق عليها.

سياسات الرسائل المباشرة الافتراضية موثقة في: [الأمان](/ar/gateway/security)

رموز الاقتران:

- 8 أحرف، بأحرف كبيرة، ومن دون أحرف ملتبسة (`0O1I`).
- **تنتهي صلاحيتها بعد ساعة واحدة**. لا يرسل البوت رسالة الاقتران إلا عند إنشاء طلب جديد (تقريبًا مرة واحدة كل ساعة لكل مرسل).
- يكون الحد الأقصى لطلبات اقتران الرسائل المباشرة المعلقة **3 لكل قناة** افتراضيًا؛ ويتم تجاهل الطلبات الإضافية حتى تنتهي صلاحية أحدها أو تتم الموافقة عليه.

### الموافقة على مرسل

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

القنوات المدعومة: `bluebubbles` و`discord` و`feishu` و`googlechat` و`imessage` و`irc` و`line` و`matrix` و`mattermost` و`msteams` و`nextcloud-talk` و`nostr` و`openclaw-weixin` و`signal` و`slack` و`synology-chat` و`telegram` و`twitch` و`whatsapp` و`zalo` و`zalouser`.

### مكان وجود الحالة

تُخزَّن ضمن `~/.openclaw/credentials/`:

- الطلبات المعلقة: `<channel>-pairing.json`
- مخزن allowlist المعتمد:
  - الحساب الافتراضي: `<channel>-allowFrom.json`
  - الحساب غير الافتراضي: `<channel>-<accountId>-allowFrom.json`

سلوك نطاق الحساب:

- تقرأ الحسابات غير الافتراضية وتكتب فقط إلى ملف allowlist ذي النطاق الخاص بها.
- يستخدم الحساب الافتراضي ملف allowlist غير المقيّد بالنطاق على مستوى القناة.

تعامل مع هذه الملفات على أنها حساسة (فهي تتحكم في الوصول إلى مساعدك).

مهم: هذا المخزن مخصص لوصول الرسائل المباشرة. أما التفويض للمجموعات فهو منفصل.
لا تؤدي الموافقة على رمز اقتران الرسائل المباشرة تلقائيًا إلى السماح لذلك المرسل بتشغيل أوامر المجموعات أو التحكم في البوت داخل المجموعات. وللوصول إلى المجموعات، اضبط allowlists الصريحة الخاصة بالمجموعات في القناة (مثل `groupAllowFrom` أو `groups` أو عمليات التجاوز لكل مجموعة/لكل topic بحسب القناة).

## 2) اقتران أجهزة Node ‏(عُقد iOS/Android/macOS/headless)

تتصل Node بـ Gateway على أنها **أجهزة** مع `role: node`. وينشئ Gateway طلب اقتران جهاز يجب الموافقة عليه.

### الاقتران عبر Telegram (موصى به لنظام iOS)

إذا كنت تستخدم Plugin ‏`device-pair`، فيمكنك إجراء اقتران الجهاز لأول مرة بالكامل من خلال Telegram:

1. في Telegram، أرسل إلى البوت: `/pair`
2. يرد البوت برسالتين: رسالة تعليمات ورسالة **رمز إعداد** منفصلة (تكون سهلة النسخ/اللصق في Telegram).
3. على هاتفك، افتح تطبيق OpenClaw على iOS ← Settings ← Gateway.
4. الصق رمز الإعداد واتصل.
5. بالعودة إلى Telegram: `/pair pending` (راجع معرّفات الطلبات، والدور، والنطاقات)، ثم وافق.

رمز الإعداد هو حمولة JSON مرمزة بـ base64 تحتوي على:

- `url`: عنوان WebSocket الخاص بـ Gateway (`ws://...` أو `wss://...`)
- `bootstrapToken`: رمز bootstrap قصير العمر لجهاز واحد يُستخدم في مصافحة الاقتران الأولية

يحمل رمز bootstrap هذا ملف تعريف bootstrap المدمج الخاص بالاقتران:

- يبقى رمز `node` الأساسي الذي تم تسليمه `scopes: []`
- يبقى أي رمز `operator` تم تسليمه مقيّدًا إلى allowlist الخاصة بالـ bootstrap:
  `operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`
- تكون فحوصات النطاق في bootstrap مسبوقة بالدور، وليست مجموعة نطاقات مسطحة واحدة:
  إدخالات نطاق operator لا تلبّي إلا طلبات operator، ويجب على الأدوار غير operator
  أن تطلب النطاقات تحت بادئة دورها الخاص

تعامل مع رمز الإعداد على أنه كلمة مرور ما دام صالحًا.

### الموافقة على جهاز Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

إذا أعاد الجهاز نفسه المحاولة بتفاصيل مصادقة مختلفة (مثل
دور/نطاقات/مفتاح عام مختلف)، فسيتم استبدال الطلب المعلق السابق وإنشاء
`requestId` جديد.

مهم: لا يحصل الجهاز المقترن بالفعل على وصول أوسع بشكل صامت. إذا
أعاد الاتصال طالبًا نطاقات إضافية أو دورًا أوسع، فإن OpenClaw يُبقي
الموافقة الحالية كما هي وينشئ طلب ترقية جديدًا معلقًا. استخدم
`openclaw devices list` لمقارنة الوصول الموافق عليه حاليًا مع الوصول
المطلوب حديثًا قبل أن توافق.

### تخزين حالة اقتران Node

تُخزَّن ضمن `~/.openclaw/devices/`:

- `pending.json` (قصير العمر؛ تنتهي صلاحية الطلبات المعلقة)
- `paired.json` (الأجهزة المقترنة + الرموز)

### ملاحظات

- إن واجهة API القديمة `node.pair.*` ‏(CLI: ‏`openclaw nodes pending|approve|reject|rename`) هي
  مخزن اقتران منفصل يملكه gateway. ولا تزال WS Nodes تتطلب اقتران الأجهزة.
- سجل الاقتران هو مصدر الحقيقة الدائم للأدوار الموافق عليها. وتظل
  رموز الأجهزة النشطة مقيّدة بمجموعة الأدوار الموافق عليها؛ ولا يؤدي إدخال رمز
  شارد خارج الأدوار الموافق عليها إلى إنشاء وصول جديد.

## مستندات ذات صلة

- نموذج الأمان + حقن الموجّهات: [الأمان](/ar/gateway/security)
- التحديث بأمان (تشغيل doctor): [التحديث](/ar/install/updating)
- إعدادات القنوات:
  - Telegram: [Telegram](/ar/channels/telegram)
  - WhatsApp: [WhatsApp](/ar/channels/whatsapp)
  - Signal: [Signal](/ar/channels/signal)
  - BlueBubbles ‏(iMessage): [BlueBubbles](/ar/channels/bluebubbles)
  - iMessage ‏(قديم): [iMessage](/ar/channels/imessage)
  - Discord: [Discord](/ar/channels/discord)
  - Slack: [Slack](/ar/channels/slack)
