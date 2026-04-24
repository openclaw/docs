---
read_when:
    - العمل على ميزات قناة Nextcloud Talk
summary: حالة دعم Nextcloud Talk وإمكاناته وإعداده
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-24T07:31:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a3af391ffa445ef1ebc7877a1158c3c6aa7ecc71ceadcb0e783a80b040fe062
    source_path: channels/nextcloud-talk.md
    workflow: 15
---

الحالة: Plugin مضمّن (بوت Webhook). الرسائل المباشرة والغرف والتفاعلات ورسائل Markdown مدعومة.

## Plugin مضمّن

يأتي Nextcloud Talk كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا تحتاج الإصدارات المعبأة العادية إلى تثبيت منفصل.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا يستثني Nextcloud Talk،
فقم بتثبيته يدويًا:

التثبيت عبر CLI (سجل npm):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

نسخة محلية من المستودع (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

التفاصيل: [Plugins](/ar/tools/plugin)

## الإعداد السريع (للمبتدئين)

1. تأكد من أن Plugin الخاص بـ Nextcloud Talk متاح.
   - تتضمن إصدارات OpenClaw المعبأة الحالية هذا Plugin بالفعل.
   - يمكن لعمليات التثبيت الأقدم/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
2. على خادم Nextcloud الخاص بك، أنشئ بوتًا:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. فعّل البوت في إعدادات الغرفة المستهدفة.
4. قم بإعداد OpenClaw:
   - الإعدادات: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - أو متغير البيئة: `NEXTCLOUD_TALK_BOT_SECRET` (للحساب الافتراضي فقط)

   إعداد CLI:

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

   سر مدعوم بملف:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. أعد تشغيل Gateway (أو أكمل الإعداد).

الحد الأدنى من الإعدادات:

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

- لا يمكن للبوتات بدء الرسائل المباشرة. يجب على المستخدم مراسلة البوت أولًا.
- يجب أن يكون عنوان Webhook URL قابلًا للوصول بواسطة Gateway؛ اضبط `webhookPublicUrl` إذا كنت خلف وكيل.
- رفع الوسائط غير مدعوم بواسطة Bot API؛ تُرسل الوسائط كروابط URL.
- لا تميّز حمولة Webhook بين الرسائل المباشرة والغرف؛ اضبط `apiUser` + `apiPassword` لتمكين عمليات البحث عن نوع الغرفة (وإلا فستُعامل الرسائل المباشرة على أنها غرف).

## التحكم في الوصول (الرسائل المباشرة)

- الافتراضي: `channels.nextcloud-talk.dmPolicy = "pairing"`. يحصل المرسلون غير المعروفين على رمز اقتران.
- وافق عبر:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- الرسائل المباشرة العامة: `channels.nextcloud-talk.dmPolicy="open"` مع `channels.nextcloud-talk.allowFrom=["*"]`.
- يطابق `allowFrom` معرّفات مستخدمي Nextcloud فقط؛ وتُتجاهل أسماء العرض.

## الغرف (المجموعات)

- الافتراضي: `channels.nextcloud-talk.groupPolicy = "allowlist"` (مع اشتراط الإشارة).
- أضف الغرف إلى قائمة السماح باستخدام `channels.nextcloud-talk.rooms`:

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

- لعدم السماح بأي غرف، اترك قائمة السماح فارغة أو اضبط `channels.nextcloud-talk.groupPolicy="disabled"`.

## الإمكانات

| الميزة          | الحالة       |
| --------------- | ------------ |
| الرسائل المباشرة | مدعومة       |
| الغرف           | مدعومة       |
| سلاسل الرسائل   | غير مدعومة   |
| الوسائط         | روابط URL فقط |
| التفاعلات       | مدعومة       |
| الأوامر الأصلية | غير مدعومة   |

## مرجع الإعدادات (Nextcloud Talk)

الإعداد الكامل: [الإعدادات](/ar/gateway/configuration)

خيارات المزوّد:

- `channels.nextcloud-talk.enabled`: تفعيل/تعطيل بدء تشغيل القناة.
- `channels.nextcloud-talk.baseUrl`: عنوان URL لمثيل Nextcloud.
- `channels.nextcloud-talk.botSecret`: السر المشترك للبوت.
- `channels.nextcloud-talk.botSecretFile`: مسار السر كملف عادي. الروابط الرمزية مرفوضة.
- `channels.nextcloud-talk.apiUser`: مستخدم API لعمليات البحث عن الغرف (اكتشاف الرسائل المباشرة).
- `channels.nextcloud-talk.apiPassword`: كلمة مرور API/التطبيق لعمليات البحث عن الغرف.
- `channels.nextcloud-talk.apiPasswordFile`: مسار ملف كلمة مرور API.
- `channels.nextcloud-talk.webhookPort`: منفذ مستمع Webhook (الافتراضي: 8788).
- `channels.nextcloud-talk.webhookHost`: مضيف Webhook (الافتراضي: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: مسار Webhook (الافتراضي: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: عنوان Webhook URL القابل للوصول خارجيًا.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: قائمة السماح للرسائل المباشرة (معرّفات المستخدمين). يتطلب `open` القيمة `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: قائمة السماح للمجموعات (معرّفات المستخدمين).
- `channels.nextcloud-talk.rooms`: إعدادات لكل غرفة وقائمة السماح.
- `channels.nextcloud-talk.historyLimit`: حد سجل المجموعات (يعطل عند 0).
- `channels.nextcloud-talk.dmHistoryLimit`: حد سجل الرسائل المباشرة (يعطل عند 0).
- `channels.nextcloud-talk.dms`: تجاوزات لكل رسالة مباشرة (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: حجم مقطع النص الصادر (أحرف).
- `channels.nextcloud-talk.chunkMode`: `length` (الافتراضي) أو `newline` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.nextcloud-talk.blockStreaming`: تعطيل البث على مستوى الكتلة لهذه القناة.
- `channels.nextcloud-talk.blockStreamingCoalesce`: ضبط دمج البث على مستوى الكتلة.
- `channels.nextcloud-talk.mediaMaxMb`: الحد الأقصى للوسائط الواردة (ميجابايت).

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشات المجموعات وضبط اشتراط الإشارة
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
