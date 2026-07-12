---
read_when:
    - العمل على ميزات قناة Nextcloud Talk
summary: حالة دعم Nextcloud Talk وإمكاناته وإعداداته
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-12T05:34:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 234981d21df12eafabfef60822f2a145d37257689511efc6104451a735346d09
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk هو Plugin قناة قابل للتنزيل (`@openclaw/nextcloud-talk`) يربط OpenClaw بمثيل Nextcloud مستضاف ذاتيًا من خلال روبوت Webhook في Talk. تُدعَم الرسائل المباشرة والغرف والتفاعلات ورسائل Markdown؛ وتُرسل الوسائط على هيئة عناوين URL.

## التثبيت

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

استخدم مواصفة الحزمة المجردة لمتابعة وسم الإصدار الرسمي الحالي. ثبّت إصدارًا محددًا بدقة فقط عندما تحتاج إلى تثبيت قابل لإعادة الإنتاج.

من نسخة محلية من المستودع (سير عمل التطوير):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

أعد تشغيل Gateway بعد التثبيت. التفاصيل: [Plugins](/ar/tools/plugin)

## الإعداد السريع (للمبتدئين)

1. ثبّت Plugin (كما هو موضح أعلاه).
2. أنشئ روبوتًا على خادم Nextcloud:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   احتفظ بالخيار `--feature response`: فبدونه تفشل الردود الصادرة بالرمز 401. أصلح روبوتًا موجودًا باستخدام `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1`.

3. فعّل الروبوت في إعدادات الغرفة المستهدفة.
4. اضبط OpenClaw:
   - الإعداد: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - أو متغير البيئة: `NEXTCLOUD_TALK_BOT_SECRET` (للحساب الافتراضي فقط)

   إعداد CLI (الخياران `--url` و`--token` اسمان بديلان للحقول الصريحة؛ ويعمل `nc-talk` و`nc` كاسمين بديلين للقناة):

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   الحقول الصريحة المكافئة:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   سر مخزّن في ملف:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. أعد تشغيل Gateway (أو أكمل الإعداد).

الحد الأدنى من الإعداد:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## ملاحظات

- لا يمكن للروبوتات بدء رسائل مباشرة. يجب أن يرسل المستخدم رسالة إلى الروبوت أولًا.
- يجب أن يكون عنوان URL الخاص بـ Webhook قابلًا للوصول من خادم Nextcloud؛ اضبط `webhookPublicUrl` عندما يكون Gateway خلف وكيل. تُوقَّع طلبات Webhook باستخدام HMAC-SHA256 وسر الروبوت؛ وتُرفض التوقيعات غير الصالحة وتخضع لتحديد المعدل.
- لا تدعم واجهة API الخاصة بالروبوت رفع الوسائط؛ وتُضاف الوسائط الصادرة كسطر `Attachment: <url>`.
- لا تميّز حمولة Webhook بين الرسائل المباشرة والغرف؛ اضبط `apiUser` + `apiPassword` لتمكين البحث عن نوع الغرفة (مع تخزين مؤقت لنحو 5 دقائق). وبدونهما، تُعامل كل محادثة على أنها غرفة.
- تمر الطلبات الصادرة عبر آلية الحماية من SSRF. بالنسبة إلى مضيف Nextcloud على شبكة خاصة/داخلية موثوقة، فعّل ذلك باستخدام `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true`.
- عند ضبط `apiUser`/`apiPassword` و`webhookPublicUrl`، يفحص `openclaw channels status` الروبوت ويحذّر عند غياب ميزة `response`.

## التحكم في الوصول (الرسائل المباشرة)

- القيمة الافتراضية: `channels.nextcloud-talk.dmPolicy = "pairing"`. يحصل المرسلون غير المعروفين على رمز إقران.
- وافق باستخدام:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- الرسائل المباشرة العامة: `channels.nextcloud-talk.dmPolicy="open"` بالإضافة إلى `channels.nextcloud-talk.allowFrom=["*"]`.
- يطابق `allowFrom` معرّفات مستخدمي Nextcloud فقط (بعد تحويلها إلى أحرف صغيرة)؛ وتُتجاهل أسماء العرض.

## الغرف (المجموعات)

- القيمة الافتراضية: `channels.nextcloud-talk.groupPolicy = "allowlist"` (مشروطة بالإشارة).
- أدرج الغرف المسموح بها باستخدام `channels.nextcloud-talk.rooms`، مع استخدام رمز الغرفة كمفتاح؛ وتضبط `"*"` قيمة افتراضية شاملة:

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- مفاتيح كل غرفة: `requireMention` (القيمة الافتراضية true)، و`enabled` (تؤدي القيمة false إلى تعطيل الغرفة)، و`allowFrom` (قائمة المرسلين المسموح بهم لكل غرفة)، و`tools` (تجاوزات السماح بالأدوات أو رفضها)، و`skills` (تقييد Skills المحمّلة)، و`systemPrompt`.
- لعدم السماح بأي غرف، أبقِ قائمة السماح فارغة أو اضبط `channels.nextcloud-talk.groupPolicy="disabled"`.

## الإمكانات

| الميزة            | الحالة              |
| ----------------- | ------------------- |
| الرسائل المباشرة  | مدعومة              |
| الغرف             | مدعومة              |
| سلاسل المحادثات   | غير مدعومة          |
| الوسائط           | عبر URL فقط         |
| التفاعلات         | مدعومة              |
| الأوامر الأصلية   | غير مدعومة          |

## مرجع الإعداد (Nextcloud Talk)

الإعداد الكامل: [الإعداد](/ar/gateway/configuration)

خيارات المزوّد:

- `channels.nextcloud-talk.enabled`: تمكين/تعطيل بدء تشغيل القناة.
- `channels.nextcloud-talk.baseUrl`: عنوان URL لمثيل Nextcloud.
- `channels.nextcloud-talk.botSecret`: السر المشترك للروبوت (سلسلة نصية أو مرجع سر).
- `channels.nextcloud-talk.botSecretFile`: مسار ملف عادي يحتوي على السر. تُرفض الروابط الرمزية.
- `channels.nextcloud-talk.apiUser`: مستخدم API لعمليات البحث عن الغرف (اكتشاف الرسائل المباشرة) وفحص الحالة.
- `channels.nextcloud-talk.apiPassword`: كلمة مرور API/التطبيق لعمليات البحث عن الغرف.
- `channels.nextcloud-talk.apiPasswordFile`: مسار ملف كلمة مرور API.
- `channels.nextcloud-talk.webhookPort`: منفذ مستمع Webhook (الافتراضي: 8788).
- `channels.nextcloud-talk.webhookHost`: مضيف Webhook (الافتراضي: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: مسار Webhook (الافتراضي: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: عنوان URL لـ Webhook يمكن الوصول إليه خارجيًا.
- `channels.nextcloud-talk.dmPolicy`: ‏`pairing | allowlist | open | disabled` (الافتراضي: pairing). تتطلب `open` ضبط `allowFrom=["*"]`.
- `channels.nextcloud-talk.allowFrom`: قائمة السماح للرسائل المباشرة (معرّفات المستخدمين).
- `channels.nextcloud-talk.groupPolicy`: ‏`allowlist | open | disabled` (الافتراضي: allowlist).
- `channels.nextcloud-talk.groupAllowFrom`: قائمة مرسلي الغرف المسموح بهم (معرّفات المستخدمين)؛ وتعود إلى `allowFrom` عند عدم ضبطها.
- `channels.nextcloud-talk.rooms`: إعدادات كل غرفة وقائمة السماح (انظر أعلاه).
- يمكن الإشارة إلى مجموعات وصول ثابتة للمرسلين من `allowFrom` و`groupAllowFrom` باستخدام `accessGroup:<name>`.
- `channels.nextcloud-talk.historyLimit`: حد سجل المجموعات (تعطّله القيمة 0).
- `channels.nextcloud-talk.dmHistoryLimit`: حد سجل الرسائل المباشرة (تعطّله القيمة 0).
- `channels.nextcloud-talk.dms`: تجاوزات لكل رسالة مباشرة، مفهرسة حسب معرّف المستخدم (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: حجم مقطع النص الصادر بالأحرف (الافتراضي: 4000).
- `channels.nextcloud-talk.chunkMode`: ‏`length` (الافتراضي) أو `newline` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.nextcloud-talk.blockStreaming`: تعطيل البث الكتلي لهذه القناة.
- `channels.nextcloud-talk.blockStreamingCoalesce`: ضبط دمج البث الكتلي.
- `channels.nextcloud-talk.responsePrefix`: بادئة الردود الصادرة.
- `channels.nextcloud-talk.markdown.tables`: وضع عرض جداول Markdown ‏(`off | bullets | code | block`).
- `channels.nextcloud-talk.mediaMaxMb`: الحد الأقصى للوسائط الواردة (بالميغابايت).
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`: السماح لمضيفي Nextcloud على الشبكات الخاصة/الداخلية بتجاوز آلية الحماية من SSRF.
- `channels.nextcloud-talk.accounts.<id>`: تجاوزات لكل حساب (المفاتيح نفسها)؛ ويختار `defaultAccount` الحساب الافتراضي. ينطبق متغيرا البيئة `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` على الحساب الافتراضي فقط.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الإقران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الإقران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية والاشتراط بالإشارة
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه جلسات الرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
