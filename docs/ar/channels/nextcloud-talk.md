---
read_when:
    - العمل على ميزات قناة Nextcloud Talk
summary: حالة دعم Nextcloud Talk وإمكاناته وتكوينه
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-05-02T22:16:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4956586ae8622118dcf136f4279c6ed1c2895fd4bb4576a7f5799de600a95740
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

الحالة: Plugin مضمّن (بوت Webhook). الرسائل المباشرة، والغرف، والتفاعلات، ورسائل Markdown مدعومة.

## Plugin مضمّن

يأتي Nextcloud Talk بصفته Plugin مضمّناً في إصدارات OpenClaw الحالية، لذلك لا تحتاج
البُنى المعبّأة العادية إلى تثبيت منفصل.

إذا كنت تستخدم بنية أقدم أو تثبيتاً مخصصاً يستثني Nextcloud Talk،
فثبّت حزمة npm مباشرة:

التثبيت عبر CLI (سجل npm):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

استخدم الحزمة المجرّدة لمتابعة وسم الإصدار الرسمي الحالي. ثبّت إصداراً دقيقاً
فقط عندما تحتاج إلى تثبيت قابل لإعادة الإنتاج.

نسخة محلية (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

التفاصيل: [Plugins](/ar/tools/plugin)

## إعداد سريع (للمبتدئين)

1. تأكد من توفر Plugin الخاص بـ Nextcloud Talk.
   - إصدارات OpenClaw المعبّأة الحالية تضمنه بالفعل.
   - يمكن للتثبيتات الأقدم/المخصصة إضافته يدوياً باستخدام الأوامر أعلاه.
2. على خادم Nextcloud لديك، أنشئ بوتاً:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. فعّل البوت في إعدادات الغرفة المستهدفة.
4. اضبط OpenClaw:
   - الإعداد: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - أو متغير البيئة: `NEXTCLOUD_TALK_BOT_SECRET` (الحساب الافتراضي فقط)

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

   سر مستند إلى ملف:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. أعد تشغيل Gateway (أو أنهِ الإعداد).

إعداد بسيط:

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

- لا تستطيع البوتات بدء رسائل مباشرة. يجب أن يرسل المستخدم رسالة إلى البوت أولاً.
- يجب أن يكون عنوان Webhook URL قابلاً للوصول بواسطة Gateway؛ اضبط `webhookPublicUrl` إذا كان خلف وكيل.
- تحميلات الوسائط غير مدعومة من Bot API؛ تُرسل الوسائط على هيئة URLs.
- حمولة Webhook لا تميّز بين الرسائل المباشرة والغرف؛ اضبط `apiUser` + `apiPassword` لتمكين عمليات البحث عن نوع الغرفة (وإلا تُعامل الرسائل المباشرة كغرف).

## التحكم في الوصول (الرسائل المباشرة)

- الافتراضي: `channels.nextcloud-talk.dmPolicy = "pairing"`. يحصل المرسلون غير المعروفين على رمز إقران.
- الموافقة عبر:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- الرسائل المباشرة العامة: `channels.nextcloud-talk.dmPolicy="open"` بالإضافة إلى `channels.nextcloud-talk.allowFrom=["*"]`.
- يطابق `allowFrom` معرّفات مستخدمي Nextcloud فقط؛ يتم تجاهل أسماء العرض.

## الغرف (المجموعات)

- الافتراضي: `channels.nextcloud-talk.groupPolicy = "allowlist"` (مقيّد بالإشارة).
- أدرج الغرف في قائمة السماح باستخدام `channels.nextcloud-talk.rooms`:

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

## القدرات

| الميزة           | الحالة       |
| --------------- | ------------ |
| الرسائل المباشرة | مدعومة       |
| الغرف            | مدعومة       |
| الخيوط           | غير مدعومة   |
| الوسائط          | URL فقط      |
| التفاعلات        | مدعومة       |
| الأوامر الأصلية  | غير مدعومة   |

## مرجع الإعداد (Nextcloud Talk)

الإعداد الكامل: [الإعدادات](/ar/gateway/configuration)

خيارات المزوّد:

- `channels.nextcloud-talk.enabled`: تمكين/تعطيل بدء القناة.
- `channels.nextcloud-talk.baseUrl`: عنوان URL لمثيل Nextcloud.
- `channels.nextcloud-talk.botSecret`: السر المشترك للبوت.
- `channels.nextcloud-talk.botSecretFile`: مسار سر في ملف عادي. تُرفض الروابط الرمزية.
- `channels.nextcloud-talk.apiUser`: مستخدم API لعمليات البحث عن الغرف (اكتشاف الرسائل المباشرة).
- `channels.nextcloud-talk.apiPassword`: كلمة مرور API/التطبيق لعمليات البحث عن الغرف.
- `channels.nextcloud-talk.apiPasswordFile`: مسار ملف كلمة مرور API.
- `channels.nextcloud-talk.webhookPort`: منفذ مستمع Webhook (الافتراضي: 8788).
- `channels.nextcloud-talk.webhookHost`: مضيف Webhook (الافتراضي: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: مسار Webhook (الافتراضي: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: عنوان URL خارجي قابل للوصول لـ Webhook.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: قائمة سماح الرسائل المباشرة (معرّفات المستخدمين). يتطلب `open` القيمة `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: قائمة سماح المجموعات (معرّفات المستخدمين).
- `channels.nextcloud-talk.rooms`: إعدادات وقائمة سماح لكل غرفة.
- `channels.nextcloud-talk.historyLimit`: حد سجل المجموعات (0 يعطّله).
- `channels.nextcloud-talk.dmHistoryLimit`: حد سجل الرسائل المباشرة (0 يعطّله).
- `channels.nextcloud-talk.dms`: تجاوزات لكل رسالة مباشرة (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: حجم جزء النص الصادر (أحرف).
- `channels.nextcloud-talk.chunkMode`: `length` (الافتراضي) أو `newline` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.nextcloud-talk.blockStreaming`: تعطيل بث الكتل لهذه القناة.
- `channels.nextcloud-talk.blockStreamingCoalesce`: ضبط دمج بث الكتل.
- `channels.nextcloud-talk.mediaMaxMb`: حد الوسائط الواردة (MB).

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الإقران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الإقران
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات والتقييد بالإشارة
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتحصين
