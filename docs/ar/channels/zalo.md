---
read_when:
    - العمل على ميزات Zalo أو Webhook
summary: حالة دعم روبوت Zalo وقدراته وتكوينه
title: Zalo
x-i18n:
    generated_at: "2026-05-02T22:16:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6226af1217e1e8b03b485df99f6375872b487f7040c091f2bb2d85e18dec75d0
    source_path: channels/zalo.md
    workflow: 16
---

الحالة: تجريبية. الرسائل المباشرة مدعومة. يعكس قسم [القدرات](#capabilities) أدناه سلوك بوت Marketplace الحالي.

## Plugin مضمّن

يأتي Zalo كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا تحتاج البُنى المعبأة العادية إلى تثبيت منفصل.

إذا كنت تستخدم بنية أقدم أو تثبيتًا مخصصًا يستبعد Zalo، فثبّت حزمة npm مباشرة:

- التثبيت عبر CLI: `openclaw plugins install @openclaw/zalo`
- إصدار مثبّت: `openclaw plugins install @openclaw/zalo@2026.5.2`
- أو من نسخة مصدرية محلية: `openclaw plugins install ./path/to/local/zalo-plugin`
- التفاصيل: [Plugins](/ar/tools/plugin)

## الإعداد السريع (للمبتدئين)

1. تأكد من توفر Zalo Plugin.
   - إصدارات OpenClaw المعبأة الحالية تضمنه بالفعل.
   - يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
2. اضبط الرمز:
   - Env: `ZALO_BOT_TOKEN=...`
   - أو config: `channels.zalo.accounts.default.botToken: "..."`.
3. أعد تشغيل Gateway (أو أنهِ الإعداد).
4. الوصول عبر الرسائل المباشرة يستخدم الاقتران افتراضيًا؛ وافق على رمز الاقتران عند أول تواصل.

الحد الأدنى من الإعداد:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## ما هو

Zalo هو تطبيق مراسلة يركز على فيتنام؛ تتيح Bot API الخاصة به لـ Gateway تشغيل بوت للمحادثات الفردية.
وهو مناسب للدعم أو الإشعارات عندما تريد توجيهًا حتميًا عائدًا إلى Zalo.

تعكس هذه الصفحة سلوك OpenClaw الحالي لـ **Zalo Bot Creator / بوتات Marketplace**.
**بوتات Zalo Official Account (OA)** هي سطح منتج Zalo مختلف وقد تتصرف بشكل مختلف.

- قناة Zalo Bot API يملكها Gateway.
- توجيه حتمي: تعود الردود إلى Zalo؛ لا يختار النموذج القنوات.
- تشارك الرسائل المباشرة جلسة الوكيل الرئيسية.
- يوضح قسم [القدرات](#capabilities) أدناه دعم بوت Marketplace الحالي.

## الإعداد (المسار السريع)

### 1) أنشئ رمز بوت (Zalo Bot Platform)

1. انتقل إلى [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) وسجّل الدخول.
2. أنشئ بوتًا جديدًا واضبط إعداداته.
3. انسخ رمز البوت الكامل (عادةً `numeric_id:secret`). بالنسبة إلى بوتات Marketplace، قد يظهر رمز التشغيل القابل للاستخدام في رسالة ترحيب البوت بعد الإنشاء.

### 2) اضبط الرمز (env أو config)

مثال:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

إذا انتقلت لاحقًا إلى سطح بوت Zalo تتوفر فيه المجموعات، يمكنك إضافة إعدادات مخصصة للمجموعات مثل `groupPolicy` و`groupAllowFrom` صراحةً. لسلوك بوت Marketplace الحالي، راجع [القدرات](#capabilities).

خيار Env: `ZALO_BOT_TOKEN=...` (يعمل للحساب الافتراضي فقط).

دعم الحسابات المتعددة: استخدم `channels.zalo.accounts` مع رموز لكل حساب و`name` اختياري.

3. أعد تشغيل Gateway. يبدأ Zalo عندما يتم حل الرمز (env أو config).
4. يستخدم الوصول عبر الرسائل المباشرة الاقتران افتراضيًا. وافق على الرمز عند التواصل مع البوت لأول مرة.

## كيف يعمل (السلوك)

- تُطبَّع الرسائل الواردة إلى غلاف القناة المشترك مع عناصر نائبة للوسائط.
- تعود الردود دائمًا إلى نفس محادثة Zalo.
- الاقتراع الطويل افتراضيًا؛ يتوفر وضع Webhook باستخدام `channels.zalo.webhookUrl`.

## الحدود

- يُقسَّم النص الصادر إلى أجزاء من 2000 حرف (حد Zalo API).
- تنزيلات/تحميلات الوسائط محددة بواسطة `channels.zalo.mediaMaxMb` (الافتراضي 5).
- Streaming محظور افتراضيًا لأن حد 2000 حرف يجعل Streaming أقل فائدة.

## التحكم في الوصول (الرسائل المباشرة)

### الوصول عبر الرسائل المباشرة

- الافتراضي: `channels.zalo.dmPolicy = "pairing"`. يتلقى المرسلون غير المعروفين رمز اقتران؛ يتم تجاهل الرسائل حتى الموافقة (تنتهي صلاحية الرموز بعد ساعة واحدة).
- الموافقة عبر:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- الاقتران هو تبادل الرمز الافتراضي. التفاصيل: [الاقتران](/ar/channels/pairing)
- يقبل `channels.zalo.allowFrom` معرّفات مستخدم رقمية (لا يتوفر بحث باسم المستخدم).

## التحكم في الوصول (المجموعات)

بالنسبة إلى **Zalo Bot Creator / بوتات Marketplace**، لم يكن دعم المجموعات متاحًا عمليًا لأن البوت لم يكن ممكنًا إضافته إلى مجموعة أصلًا.

يعني ذلك أن مفاتيح الإعداد المتعلقة بالمجموعات أدناه موجودة في المخطط، لكنها لم تكن قابلة للاستخدام لبوتات Marketplace:

- يتحكم `channels.zalo.groupPolicy` في التعامل مع الوارد من المجموعات: `open | allowlist | disabled`.
- يقيّد `channels.zalo.groupAllowFrom` معرّفات المرسلين التي يمكنها تشغيل البوت في المجموعات.
- إذا لم يتم ضبط `groupAllowFrom`، يعود Zalo إلى `allowFrom` لفحوصات المرسل.
- ملاحظة وقت التشغيل: إذا كان `channels.zalo` مفقودًا بالكامل، يظل وقت التشغيل يعود إلى `groupPolicy="allowlist"` لأجل السلامة.

قيم سياسة المجموعة (عندما يكون الوصول إلى المجموعات متاحًا على سطح البوت لديك) هي:

- `groupPolicy: "disabled"` — يحظر جميع رسائل المجموعات.
- `groupPolicy: "open"` — يسمح لأي عضو في المجموعة (مشروط بالإشارة).
- `groupPolicy: "allowlist"` — الافتراضي المغلق عند الفشل؛ لا تُقبل إلا المرسلون المسموح بهم.

إذا كنت تستخدم سطح منتج بوت Zalo مختلفًا وتحققت من عمل سلوك المجموعات، فوثّق ذلك بشكل منفصل بدلًا من افتراض أنه يطابق تدفق بوت Marketplace.

## الاقتراع الطويل مقابل Webhook

- الافتراضي: الاقتراع الطويل (لا يتطلب عنوان URL عامًا).
- وضع Webhook: اضبط `channels.zalo.webhookUrl` و`channels.zalo.webhookSecret`.
  - يجب أن يكون سر Webhook بين 8 و256 حرفًا.
  - يجب أن يستخدم عنوان URL الخاص بـ Webhook بروتوكول HTTPS.
  - يرسل Zalo الأحداث مع ترويسة `X-Bot-Api-Secret-Token` للتحقق.
  - يعالج HTTP الخاص بـ Gateway طلبات Webhook عند `channels.zalo.webhookPath` (يفترض مسار عنوان URL الخاص بـ Webhook افتراضيًا).
  - يجب أن تستخدم الطلبات `Content-Type: application/json` (أو أنواع وسائط `+json`).
  - يتم تجاهل الأحداث المكررة (`event_name + message_id`) خلال نافذة إعادة تشغيل قصيرة.
  - يتم تحديد معدل حركة المرور الاندفاعية لكل مسار/مصدر وقد تُرجع HTTP 429.

**ملاحظة:** getUpdates (الاقتراع) وWebhook متنافيان حسب وثائق Zalo API.

## أنواع الرسائل المدعومة

للقطة دعم سريعة، راجع [القدرات](#capabilities). تضيف الملاحظات أدناه تفاصيل عندما يحتاج السلوك إلى سياق إضافي.

- **الرسائل النصية**: دعم كامل مع تقسيم عند 2000 حرف.
- **عناوين URL العادية في النص**: تتصرف مثل إدخال النص العادي.
- **معاينات الروابط / بطاقات الروابط الغنية**: راجع حالة بوت Marketplace في [القدرات](#capabilities)؛ لم تكن تؤدي إلى رد بشكل موثوق.
- **رسائل الصور**: راجع حالة بوت Marketplace في [القدرات](#capabilities)؛ كان التعامل مع الصور الواردة غير موثوق (مؤشر كتابة بلا رد نهائي).
- **الملصقات**: راجع حالة بوت Marketplace في [القدرات](#capabilities).
- **الملاحظات الصوتية / ملفات الصوت / الفيديو / مرفقات الملفات العامة**: راجع حالة بوت Marketplace في [القدرات](#capabilities).
- **الأنواع غير المدعومة**: تُسجّل (على سبيل المثال، رسائل من مستخدمين محميين).

## القدرات

يلخص هذا الجدول سلوك **Zalo Bot Creator / بوت Marketplace** الحالي في OpenClaw.

| الميزة                      | الحالة                                  |
| --------------------------- | --------------------------------------- |
| الرسائل المباشرة            | ✅ مدعومة                               |
| المجموعات                   | ❌ غير متاحة لبوتات Marketplace        |
| الوسائط (الصور الواردة)     | ⚠️ محدود / تحقق في بيئتك               |
| الوسائط (الصور الصادرة)     | ⚠️ لم يُعاد اختباره لبوتات Marketplace |
| عناوين URL العادية في النص  | ✅ مدعومة                               |
| معاينات الروابط             | ⚠️ غير موثوقة لبوتات Marketplace       |
| التفاعلات                   | ❌ غير مدعومة                           |
| الملصقات                    | ⚠️ لا يوجد رد وكيل لبوتات Marketplace  |
| الملاحظات الصوتية / الصوت / الفيديو | ⚠️ لا يوجد رد وكيل لبوتات Marketplace  |
| مرفقات الملفات              | ⚠️ لا يوجد رد وكيل لبوتات Marketplace  |
| Threads                     | ❌ غير مدعومة                           |
| الاستطلاعات                 | ❌ غير مدعومة                           |
| الأوامر الأصلية             | ❌ غير مدعومة                           |
| Streaming                   | ⚠️ محظور (حد 2000 حرف)                 |

## أهداف التسليم (CLI/Cron)

- استخدم معرّف محادثة كهدف.
- مثال: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## استكشاف الأخطاء وإصلاحها

**البوت لا يستجيب:**

- تحقق من أن الرمز صالح: `openclaw channels status --probe`
- تحقق من الموافقة على المرسل (اقتران أو allowFrom)
- تحقق من سجلات Gateway: `openclaw logs --follow`

**Webhook لا يتلقى أحداثًا:**

- تأكد من أن عنوان URL الخاص بـ Webhook يستخدم HTTPS
- تحقق من أن رمز السر يتكون من 8 إلى 256 حرفًا
- تأكد من إمكانية الوصول إلى نقطة نهاية HTTP الخاصة بـ Gateway على المسار المضبوط
- تحقق من أن اقتراع getUpdates لا يعمل (هما متنافيان)

## مرجع الإعداد (Zalo)

الإعداد الكامل: [الإعداد](/ar/gateway/configuration)

المفاتيح المسطحة على المستوى الأعلى (`channels.zalo.botToken` و`channels.zalo.dmPolicy` وما شابه) هي اختصار قديم لحساب واحد. فضّل `channels.zalo.accounts.<id>.*` للإعدادات الجديدة. لا يزال كلا الشكلين موثقين هنا لأنهما موجودان في المخطط.

خيارات الموفر:

- `channels.zalo.enabled`: تفعيل/تعطيل بدء تشغيل القناة.
- `channels.zalo.botToken`: رمز البوت من Zalo Bot Platform.
- `channels.zalo.tokenFile`: قراءة الرمز من مسار ملف عادي. تُرفض الروابط الرمزية.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: pairing).
- `channels.zalo.allowFrom`: قائمة سماح للرسائل المباشرة (معرّفات المستخدمين). يتطلب `open` القيمة `"*"`. سيطلب المعالج معرّفات رقمية.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (الافتراضي: allowlist). موجود في الإعداد؛ راجع [القدرات](#capabilities) و[التحكم في الوصول (المجموعات)](#access-control-groups) لسلوك بوت Marketplace الحالي.
- `channels.zalo.groupAllowFrom`: قائمة سماح لمرسلي المجموعة (معرّفات المستخدمين). تعود إلى `allowFrom` عند عدم الضبط.
- `channels.zalo.mediaMaxMb`: حد الوسائط الواردة/الصادرة (MB، الافتراضي 5).
- `channels.zalo.webhookUrl`: تفعيل وضع Webhook (يتطلب HTTPS).
- `channels.zalo.webhookSecret`: سر Webhook (8-256 حرفًا).
- `channels.zalo.webhookPath`: مسار Webhook على خادم HTTP الخاص بـ Gateway.
- `channels.zalo.proxy`: عنوان URL للوكيل لطلبات API.

خيارات الحسابات المتعددة:

- `channels.zalo.accounts.<id>.botToken`: رمز لكل حساب.
- `channels.zalo.accounts.<id>.tokenFile`: ملف رمز عادي لكل حساب. تُرفض الروابط الرمزية.
- `channels.zalo.accounts.<id>.name`: اسم العرض.
- `channels.zalo.accounts.<id>.enabled`: تفعيل/تعطيل الحساب.
- `channels.zalo.accounts.<id>.dmPolicy`: سياسة الرسائل المباشرة لكل حساب.
- `channels.zalo.accounts.<id>.allowFrom`: قائمة سماح لكل حساب.
- `channels.zalo.accounts.<id>.groupPolicy`: سياسة المجموعة لكل حساب. موجودة في الإعداد؛ راجع [القدرات](#capabilities) و[التحكم في الوصول (المجموعات)](#access-control-groups) لسلوك بوت Marketplace الحالي.
- `channels.zalo.accounts.<id>.groupAllowFrom`: قائمة سماح لمرسلي المجموعة لكل حساب.
- `channels.zalo.accounts.<id>.webhookUrl`: عنوان URL الخاص بـ Webhook لكل حساب.
- `channels.zalo.accounts.<id>.webhookSecret`: سر Webhook لكل حساب.
- `channels.zalo.accounts.<id>.webhookPath`: مسار Webhook لكل حساب.
- `channels.zalo.accounts.<id>.proxy`: عنوان URL للوكيل لكل حساب.

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك محادثات المجموعة والتقييد بالإشارة
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسة للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
