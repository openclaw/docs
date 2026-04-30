---
read_when:
    - العمل على ميزات قناة Nextcloud Talk
summary: حالة دعم Nextcloud Talk وإمكاناته وتكوينه
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-30T07:42:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: fcbe8a65adfddc95d2b4944af88f9982e23a1676752efec2bbf40cfc4dd846d2
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

الحالة: Plugin مُضمَّن (روبوت Webhook). الرسائل المباشرة، والغرف، والتفاعلات، ورسائل Markdown مدعومة.

## Plugin مُضمَّن

يأتي Nextcloud Talk بوصفه Plugin مُضمَّنًا في إصدارات OpenClaw الحالية، لذلك
لا تحتاج البُنى المعبأة العادية إلى تثبيت منفصل.

إذا كنت تستخدم بناءً أقدم أو تثبيتًا مخصصًا يستبعد Nextcloud Talk،
فثبّت حزمة npm حالية عند نشرها:

التثبيت عبر CLI (سجل npm، عند وجود حزمة حالية):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

إذا أبلغ npm أن الحزمة المملوكة لـ OpenClaw مهملة، فاستخدم بناء OpenClaw
معبأً حاليًا أو مسار النسخة المحلية إلى أن تُنشر حزمة npm أحدث.

نسخة محلية (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

التفاصيل: [Plugins](/ar/tools/plugin)

## إعداد سريع (للمبتدئين)

1. تأكد من توفر Plugin الخاص بـ Nextcloud Talk.
   - إصدارات OpenClaw المعبأة الحالية تتضمنه بالفعل.
   - يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا بالأوامر أعلاه.
2. على خادم Nextcloud لديك، أنشئ روبوتًا:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. فعّل الروبوت في إعدادات الغرفة المستهدفة.
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

   سر مدعوم بملف:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. أعد تشغيل Gateway (أو أكمل الإعداد).

إعداد أدنى:

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

- لا تستطيع الروبوتات بدء الرسائل المباشرة. يجب أن يراسل المستخدم الروبوت أولًا.
- يجب أن يكون عنوان Webhook URL قابلًا للوصول بواسطة Gateway؛ عيّن `webhookPublicUrl` إذا كان خلف وكيل.
- رفع الوسائط غير مدعوم بواسطة واجهة API الخاصة بالروبوت؛ تُرسل الوسائط على شكل عناوين URL.
- لا تميّز حمولة Webhook بين الرسائل المباشرة والغرف؛ عيّن `apiUser` + `apiPassword` لتمكين الاستعلام عن نوع الغرفة (وإلا فستُعامل الرسائل المباشرة كغرف).

## التحكم في الوصول (الرسائل المباشرة)

- الافتراضي: `channels.nextcloud-talk.dmPolicy = "pairing"`. يحصل المرسلون غير المعروفين على رمز إقران.
- الموافقة عبر:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- الرسائل المباشرة العامة: `channels.nextcloud-talk.dmPolicy="open"` بالإضافة إلى `channels.nextcloud-talk.allowFrom=["*"]`.
- يطابق `allowFrom` معرّفات مستخدمي Nextcloud فقط؛ تُتجاهل أسماء العرض.

## الغرف (المجموعات)

- الافتراضي: `channels.nextcloud-talk.groupPolicy = "allowlist"` (مقيّد بالإشارة).
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

- لعدم السماح بأي غرف، أبقِ قائمة السماح فارغة أو عيّن `channels.nextcloud-talk.groupPolicy="disabled"`.

## القدرات

| الميزة             | الحالة        |
| ------------------ | ------------- |
| الرسائل المباشرة   | مدعومة        |
| الغرف              | مدعومة        |
| سلاسل المحادثات    | غير مدعومة    |
| الوسائط            | عناوين URL فقط |
| التفاعلات          | مدعومة        |
| الأوامر الأصلية    | غير مدعومة    |

## مرجع الإعداد (Nextcloud Talk)

الإعداد الكامل: [الإعداد](/ar/gateway/configuration)

خيارات المزوّد:

- `channels.nextcloud-talk.enabled`: تمكين/تعطيل بدء تشغيل القناة.
- `channels.nextcloud-talk.baseUrl`: عنوان URL لمثيل Nextcloud.
- `channels.nextcloud-talk.botSecret`: السر المشترك للروبوت.
- `channels.nextcloud-talk.botSecretFile`: مسار سر في ملف عادي. تُرفض الروابط الرمزية.
- `channels.nextcloud-talk.apiUser`: مستخدم API للاستعلام عن الغرف (اكتشاف الرسائل المباشرة).
- `channels.nextcloud-talk.apiPassword`: كلمة مرور API/التطبيق للاستعلام عن الغرف.
- `channels.nextcloud-talk.apiPasswordFile`: مسار ملف كلمة مرور API.
- `channels.nextcloud-talk.webhookPort`: منفذ مستمع Webhook (الافتراضي: 8788).
- `channels.nextcloud-talk.webhookHost`: مضيف Webhook (الافتراضي: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: مسار Webhook (الافتراضي: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: عنوان URL لـ Webhook يمكن الوصول إليه خارجيًا.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: قائمة سماح الرسائل المباشرة (معرّفات المستخدمين). يتطلب `open` وجود `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: قائمة سماح المجموعات (معرّفات المستخدمين).
- `channels.nextcloud-talk.rooms`: إعدادات وقائمة سماح لكل غرفة.
- `channels.nextcloud-talk.historyLimit`: حد سجل المجموعات (0 يعطّله).
- `channels.nextcloud-talk.dmHistoryLimit`: حد سجل الرسائل المباشرة (0 يعطّله).
- `channels.nextcloud-talk.dms`: تجاوزات لكل رسالة مباشرة (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: حجم مقطع النص الصادر (أحرف).
- `channels.nextcloud-talk.chunkMode`: `length` (الافتراضي) أو `newline` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.nextcloud-talk.blockStreaming`: تعطيل بث الكتل لهذه القناة.
- `channels.nextcloud-talk.blockStreamingCoalesce`: ضبط تجميع بث الكتل.
- `channels.nextcloud-talk.mediaMaxMb`: حد الوسائط الواردة (MB).

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [الإقران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الإقران
- [المجموعات](/ar/channels/groups) — سلوك محادثات المجموعات والتقييد بالإشارة
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه جلسات الرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
