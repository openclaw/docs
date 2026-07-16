---
read_when:
    - العمل على ميزات قناة Nextcloud Talk
summary: حالة دعم Nextcloud Talk وإمكاناته وإعداداته
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-16T13:24:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 59f4fe51555bcb13d630140866307b1a49ba077059818ec116ee50ef0c877b2b
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk هو plugin قناة قابل للتنزيل (`@openclaw/nextcloud-talk`) يربط OpenClaw بمثيل Nextcloud مستضاف ذاتيًا عبر روبوت Webhook في Talk. تُدعم الرسائل المباشرة والغرف والتفاعلات ورسائل Markdown؛ وتُرسل الوسائط على هيئة عناوين URL.

## التثبيت

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

استخدم محدد الحزمة المجرّد لمتابعة وسم الإصدار الرسمي الحالي. ثبّت إصدارًا محددًا بدقة فقط عندما تحتاج إلى تثبيت قابل لإعادة الإنتاج.

من نسخة محلية من المستودع (مسارات عمل التطوير):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

أعد تشغيل Gateway بعد التثبيت. التفاصيل: [Plugins](/ar/tools/plugin)

## الإعداد السريع (للمبتدئين)

1. ثبّت plugin (أعلاه).
2. أنشئ روبوتًا على خادم Nextcloud:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   احتفظ بـ `--feature response`: من دونه، تفشل الردود الصادرة بالخطأ 401. أصلح روبوتًا موجودًا باستخدام `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1`.

3. فعّل الروبوت في إعدادات الغرفة المستهدفة.
4. اضبط OpenClaw:
   - الإعداد: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - أو متغيرات البيئة: `NEXTCLOUD_TALK_BOT_SECRET` (للحساب الافتراضي فقط)

   إعداد CLI (يُعدّ `--url`/`--token` اسمين بديلين للحقول الصريحة؛ ويعمل `nc-talk` و`nc` كاسمين بديلين للقناة):

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

- لا يمكن للروبوتات بدء رسائل مباشرة. يجب أن يراسل المستخدم الروبوت أولًا.
- يجب أن يكون عنوان URL الخاص بـ Webhook قابلًا للوصول من خادم Nextcloud؛ اضبط `webhookPublicUrl` عندما يكون Gateway خلف وكيل. تُوقّع طلبات Webhook باستخدام HMAC-SHA256 وسر الروبوت؛ وتُرفض التوقيعات غير الصالحة ويُطبّق عليها حد لمعدل الطلبات.
- لا تدعم API الروبوت رفع الوسائط؛ وتُلحق الوسائط الصادرة كسطر `Attachment: <url>`.
- لا تميّز حمولة Webhook بين الرسائل المباشرة والغرف؛ اضبط `apiUser` + `apiPassword` لتمكين عمليات البحث عن نوع الغرفة (تُخزّن مؤقتًا لنحو 5 دقائق). من دونهما، تُعامل كل محادثة على أنها غرفة.
- تمر الطلبات الصادرة عبر أداة الحماية من SSRF. بالنسبة إلى مضيف Nextcloud على شبكة خاصة/داخلية موثوقة، اشترك صراحةً باستخدام `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true`.
- عند ضبط `apiUser`/`apiPassword` و`webhookPublicUrl`، يفحص `openclaw channels status` الروبوت ويحذّر عند غياب ميزة `response`.

## التحكم في الوصول (الرسائل المباشرة)

- الافتراضي: `channels.nextcloud-talk.dmPolicy = "pairing"`. يحصل المرسلون غير المعروفين على رمز إقران.
- الموافقة عبر:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- الرسائل المباشرة العامة: `channels.nextcloud-talk.dmPolicy="open"` مع `channels.nextcloud-talk.allowFrom=["*"]`.
- يطابق `allowFrom` معرّفات مستخدمي Nextcloud فقط (بأحرف صغيرة)؛ وتُتجاهل أسماء العرض.

## الغرف (المجموعات)

- الافتراضي: `channels.nextcloud-talk.groupPolicy = "allowlist"` (يتطلب الإشارة).
- اسمح بالغرف عبر قائمة السماح `channels.nextcloud-talk.rooms`، والمفهرسة برمز الغرفة؛ ويضبط `"*"` قيمة افتراضية عامة:

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

- المفاتيح الخاصة بكل غرفة: `requireMention` (الافتراضي true)، و`enabled` (تعطّل القيمة false الغرفة)، و`allowFrom` (قائمة السماح بالمرسلين لكل غرفة)، و`tools` (تجاوزات السماح بالأدوات/منعها)، و`skills` (تقييد Skills المحمّلة)، و`systemPrompt`.
- لعدم السماح بأي غرف، أبقِ قائمة السماح فارغة أو اضبط `channels.nextcloud-talk.groupPolicy="disabled"`.

## الإمكانات

| الميزة           | الحالة        |
| --------------- | ------------- |
| الرسائل المباشرة | مدعومة        |
| الغرف            | مدعومة        |
| سلاسل المحادثات  | غير مدعومة    |
| الوسائط          | عناوين URL فقط |
| التفاعلات        | مدعومة        |
| الأوامر الأصلية  | غير مدعومة    |

## مرجع الإعداد (Nextcloud Talk)

الإعداد الكامل: [الإعداد](/ar/gateway/configuration)

خيارات المزوّد:

- `channels.nextcloud-talk.enabled`: تمكين/تعطيل بدء تشغيل القناة.
- `channels.nextcloud-talk.baseUrl`: عنوان URL لمثيل Nextcloud.
- `channels.nextcloud-talk.botSecret`: السر المشترك للروبوت (سلسلة نصية أو مرجع سر).
- `channels.nextcloud-talk.botSecretFile`: مسار سر في ملف عادي. تُرفض الروابط الرمزية.
- `channels.nextcloud-talk.apiUser`: مستخدم API لعمليات البحث عن الغرف (اكتشاف الرسائل المباشرة) وفحص الحالة.
- `channels.nextcloud-talk.apiPassword`: كلمة مرور API/التطبيق لعمليات البحث عن الغرف.
- `channels.nextcloud-talk.apiPasswordFile`: مسار ملف كلمة مرور API.
- `channels.nextcloud-talk.webhookPort`: منفذ مستمع Webhook (الافتراضي: 8788).
- `channels.nextcloud-talk.webhookHost`: مضيف Webhook (الافتراضي: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: مسار Webhook (الافتراضي: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: عنوان URL لـ Webhook يمكن الوصول إليه خارجيًا.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: الإقران). يتطلب `open` ضبط `allowFrom=["*"]`.
- `channels.nextcloud-talk.allowFrom`: قائمة السماح بالرسائل المباشرة (معرّفات المستخدمين).
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled` (الافتراضي: قائمة السماح).
- `channels.nextcloud-talk.groupAllowFrom`: قائمة السماح بمرسلي الغرف (معرّفات المستخدمين)؛ وتعود إلى `allowFrom` عند عدم ضبطها.
- `channels.nextcloud-talk.rooms`: إعدادات كل غرفة وقائمة السماح (راجع أعلاه).
- يمكن الإشارة إلى مجموعات وصول المرسلين الثابتة من `allowFrom` و`groupAllowFrom` باستخدام `accessGroup:<name>`.
- `channels.nextcloud-talk.historyLimit`: حد سجل المجموعة (تعطّله القيمة 0).
- `channels.nextcloud-talk.dmHistoryLimit`: حد سجل الرسائل المباشرة (تعطّله القيمة 0).
- `channels.nextcloud-talk.dms`: تجاوزات لكل رسالة مباشرة مفهرسة بمعرّف المستخدم (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: حجم مقطع النص الصادر بالأحرف (الافتراضي: 4000).
- `channels.nextcloud-talk.streaming.chunkMode`: `length` (الافتراضي) أو `newline` للتقسيم عند الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.nextcloud-talk.streaming.block.enabled`: تمكين أو تعطيل البث الكتلي لهذه القناة.
- `channels.nextcloud-talk.streaming.block.coalesce`: ضبط دمج البث الكتلي.
- `channels.nextcloud-talk.responsePrefix`: بادئة الرد الصادر.
- `channels.nextcloud-talk.markdown.tables`: وضع عرض جداول Markdown (`off | bullets | code | block`).
- `channels.nextcloud-talk.mediaMaxMb`: الحد الأقصى للوسائط الواردة (MB).
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`: السماح لمضيفي Nextcloud الخاصين/الداخليين بتجاوز أداة الحماية من SSRF.
- `channels.nextcloud-talk.accounts.<id>`: تجاوزات لكل حساب (المفاتيح نفسها)؛ ويختار `defaultAccount` الحساب الافتراضي. تنطبق متغيرات البيئة `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` على الحساب الافتراضي فقط.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الإقران](/ar/channels/pairing) — مصادقة الرسائل المباشرة ومسار الإقران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية واشتراط الإشارة
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه جلسات الرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
