---
read_when:
    - العمل على ميزات Zalo أو Webhook
summary: حالة دعم روبوت Zalo وإمكاناته وتكوينه
title: Zalo
x-i18n:
    generated_at: "2026-04-30T07:45:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: e79a4a27accc7f460bd3ae9c01e8f5f80e21a285af5d89b94bb9c89244a4438f
    source_path: channels/zalo.md
    workflow: 16
---

الحالة: تجريبية. الرسائل المباشرة مدعومة. يعكس قسم [الإمكانات](#capabilities) أدناه سلوك روبوت Marketplace الحالي.

## Plugin مضمّن

يأتي Zalo بوصفه Plugin مضمّنًا في إصدارات OpenClaw الحالية، لذلك لا تحتاج
البُنى المعبأة العادية إلى تثبيت منفصل.

إذا كنت تستخدم بنية أقدم أو تثبيتًا مخصصًا يستبعد Zalo، فثبّت حزمة npm
حالية عند نشر واحدة:

- التثبيت عبر CLI: `openclaw plugins install @openclaw/zalo`
- أو من نسخة مصدر محلية: `openclaw plugins install ./path/to/local/zalo-plugin`
- التفاصيل: [Plugins](/ar/tools/plugin)

إذا أبلغ npm أن الحزمة المملوكة لـ OpenClaw مهملة، فاستخدم بنية OpenClaw
معبأة حديثة أو مسار نسخة المصدر المحلية إلى أن تُنشر حزمة npm أحدث.

## إعداد سريع (للمبتدئين)

1. تأكد من توفر Plugin الخاص بـ Zalo.
   - إصدارات OpenClaw المعبأة الحالية تتضمنه بالفعل.
   - يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا بالأوامر أعلاه.
2. اضبط الرمز:
   - Env: `ZALO_BOT_TOKEN=...`
   - أو الإعداد: `channels.zalo.accounts.default.botToken: "..."`.
3. أعد تشغيل Gateway (أو أكمل الإعداد).
4. يكون الوصول عبر الرسائل المباشرة بالاقتران افتراضيًا؛ وافق على رمز الاقتران عند أول تواصل.

إعداد أدنى:

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

Zalo هو تطبيق مراسلة موجه إلى فيتنام؛ تتيح Bot API الخاصة به لـ Gateway تشغيل روبوت للمحادثات الفردية.
وهو مناسب للدعم أو الإشعارات عندما تريد توجيهًا حتميًا عائدًا إلى Zalo.

تعكس هذه الصفحة سلوك OpenClaw الحالي لـ **روبوتات Zalo Bot Creator / Marketplace**.
**روبوتات Zalo Official Account (OA)** هي سطح منتج Zalo مختلف وقد تتصرف بشكل مختلف.

- قناة Zalo Bot API مملوكة بواسطة Gateway.
- توجيه حتمي: تعود الردود إلى Zalo؛ ولا يختار النموذج القنوات مطلقًا.
- تشارك الرسائل المباشرة الجلسة الرئيسية للوكيل.
- يوضح قسم [الإمكانات](#capabilities) أدناه دعم روبوت Marketplace الحالي.

## الإعداد (المسار السريع)

### 1) إنشاء رمز روبوت (Zalo Bot Platform)

1. انتقل إلى [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) وسجل الدخول.
2. أنشئ روبوتًا جديدًا واضبط إعداداته.
3. انسخ رمز الروبوت كاملًا (عادة `numeric_id:secret`). بالنسبة إلى روبوتات Marketplace، قد يظهر رمز التشغيل القابل للاستخدام في رسالة الترحيب الخاصة بالروبوت بعد إنشائه.

### 2) ضبط الرمز (env أو config)

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

إذا انتقلت لاحقًا إلى سطح روبوت Zalo تتوفر فيه المجموعات، يمكنك إضافة إعدادات خاصة بالمجموعات مثل `groupPolicy` و`groupAllowFrom` صراحةً. لسلوك روبوت Marketplace الحالي، راجع [الإمكانات](#capabilities).

خيار Env: `ZALO_BOT_TOKEN=...` (يعمل للحساب الافتراضي فقط).

دعم الحسابات المتعددة: استخدم `channels.zalo.accounts` مع رموز لكل حساب و`name` اختياري.

3. أعد تشغيل Gateway. يبدأ Zalo عند حل رمز (env أو config).
4. يكون الوصول عبر الرسائل المباشرة مقترنًا افتراضيًا. وافق على الرمز عند التواصل مع الروبوت لأول مرة.

## كيف يعمل (السلوك)

- تُطبَّع الرسائل الواردة إلى مغلف القناة المشترك مع عناصر نائبة للوسائط.
- تعود الردود دائمًا إلى دردشة Zalo نفسها.
- الاقتراع الطويل هو الافتراضي؛ يتوفر وضع Webhook باستخدام `channels.zalo.webhookUrl`.

## الحدود

- يُجزّأ النص الصادر إلى 2000 حرف (حد Zalo API).
- تُحدد تنزيلات/تحميلات الوسائط بواسطة `channels.zalo.mediaMaxMb` (الافتراضي 5).
- يُحظر البث افتراضيًا لأن حد 2000 حرف يجعل البث أقل فائدة.

## التحكم في الوصول (الرسائل المباشرة)

### الوصول عبر الرسائل المباشرة

- الافتراضي: `channels.zalo.dmPolicy = "pairing"`. يتلقى المرسلون غير المعروفين رمز اقتران؛ وتُتجاهل الرسائل حتى الموافقة (تنتهي صلاحية الرموز بعد ساعة واحدة).
- الموافقة عبر:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- الاقتران هو تبادل الرمز الافتراضي. التفاصيل: [الاقتران](/ar/channels/pairing)
- يقبل `channels.zalo.allowFrom` معرّفات مستخدمين رقمية (لا يتوفر بحث باسم المستخدم).

## التحكم في الوصول (المجموعات)

بالنسبة إلى **روبوتات Zalo Bot Creator / Marketplace**، لم يكن دعم المجموعات متاحًا عمليًا لأن الروبوت لم يكن قابلًا للإضافة إلى مجموعة أصلًا.

يعني ذلك أن مفاتيح الإعداد المرتبطة بالمجموعات أدناه موجودة في المخطط، لكنها لم تكن قابلة للاستخدام مع روبوتات Marketplace:

- يتحكم `channels.zalo.groupPolicy` في معالجة الوارد من المجموعات: `open | allowlist | disabled`.
- يقيّد `channels.zalo.groupAllowFrom` معرّفات المرسلين التي يمكنها تشغيل الروبوت في المجموعات.
- إذا لم يُضبط `groupAllowFrom`، يعود Zalo إلى `allowFrom` لفحوصات المرسل.
- ملاحظة وقت التشغيل: إذا كان `channels.zalo` مفقودًا بالكامل، يظل وقت التشغيل يعود إلى `groupPolicy="allowlist"` للسلامة.

قيم سياسة المجموعة (عندما يكون الوصول إلى المجموعات متاحًا على سطح الروبوت لديك) هي:

- `groupPolicy: "disabled"` — يحظر جميع رسائل المجموعة.
- `groupPolicy: "open"` — يسمح لأي عضو في المجموعة (مقيّد بالإشارة).
- `groupPolicy: "allowlist"` — افتراضي مغلق عند الفشل؛ لا يُقبل إلا المرسلون المسموح لهم.

إذا كنت تستخدم سطح منتج روبوت Zalo مختلفًا وتحققت من عمل سلوك المجموعات، فوثّق ذلك بشكل منفصل بدلًا من افتراض مطابقته لتدفق روبوت Marketplace.

## الاقتراع الطويل مقابل Webhook

- الافتراضي: الاقتراع الطويل (لا يتطلب URL عامًا).
- وضع Webhook: اضبط `channels.zalo.webhookUrl` و`channels.zalo.webhookSecret`.
  - يجب أن يكون سر Webhook بين 8 و256 حرفًا.
  - يجب أن يستخدم URL الخاص بـ Webhook بروتوكول HTTPS.
  - يرسل Zalo الأحداث مع ترويسة `X-Bot-Api-Secret-Token` للتحقق.
  - يتعامل HTTP الخاص بـ Gateway مع طلبات Webhook عند `channels.zalo.webhookPath` (يكون الافتراضي مسار URL الخاص بـ Webhook).
  - يجب أن تستخدم الطلبات `Content-Type: application/json` (أو أنواع وسائط `+json`).
  - تُتجاهل الأحداث المكررة (`event_name + message_id`) ضمن نافذة إعادة قصيرة.
  - تُحدَّد حركة المرور الاندفاعية بمعدل لكل مسار/مصدر وقد تعيد HTTP 429.

**ملاحظة:** getUpdates (الاقتراع) وWebhook متنافيان لكل Zalo API docs.

## أنواع الرسائل المدعومة

للحصول على لقطة دعم سريعة، راجع [الإمكانات](#capabilities). تضيف الملاحظات أدناه تفاصيل حيث يحتاج السلوك إلى سياق إضافي.

- **الرسائل النصية**: دعم كامل مع تجزئة عند 2000 حرف.
- **عناوين URL الصريحة في النص**: تتصرف مثل إدخال نص عادي.
- **معاينات الروابط / بطاقات الروابط الغنية**: راجع حالة روبوت Marketplace في [الإمكانات](#capabilities)؛ لم تكن تؤدي إلى رد بشكل موثوق.
- **رسائل الصور**: راجع حالة روبوت Marketplace في [الإمكانات](#capabilities)؛ كانت معالجة الصور الواردة غير موثوقة (مؤشر كتابة دون رد نهائي).
- **الملصقات**: راجع حالة روبوت Marketplace في [الإمكانات](#capabilities).
- **الملاحظات الصوتية / ملفات الصوت / الفيديو / مرفقات الملفات العامة**: راجع حالة روبوت Marketplace في [الإمكانات](#capabilities).
- **الأنواع غير المدعومة**: تُسجَّل (على سبيل المثال، الرسائل من مستخدمين محميين).

## الإمكانات

يلخص هذا الجدول سلوك **روبوت Zalo Bot Creator / Marketplace** الحالي في OpenClaw.

| الميزة                      | الحالة                                       |
| --------------------------- | -------------------------------------------- |
| الرسائل المباشرة            | ✅ مدعومة                                    |
| المجموعات                   | ❌ غير متاحة لروبوتات Marketplace            |
| الوسائط (الصور الواردة)     | ⚠️ محدودة / تحقق في بيئتك                    |
| الوسائط (الصور الصادرة)     | ⚠️ لم تُعد اختبارها لروبوتات Marketplace     |
| عناوين URL الصريحة في النص  | ✅ مدعومة                                    |
| معاينات الروابط             | ⚠️ غير موثوقة لروبوتات Marketplace           |
| التفاعلات                   | ❌ غير مدعومة                                |
| الملصقات                    | ⚠️ لا رد من الوكيل لروبوتات Marketplace      |
| الملاحظات الصوتية / الصوت / الفيديو | ⚠️ لا رد من الوكيل لروبوتات Marketplace |
| مرفقات الملفات              | ⚠️ لا رد من الوكيل لروبوتات Marketplace      |
| السلاسل                     | ❌ غير مدعومة                                |
| الاستطلاعات                 | ❌ غير مدعومة                                |
| الأوامر الأصلية             | ❌ غير مدعومة                                |
| البث                        | ⚠️ محظور (حد 2000 حرف)                       |

## أهداف التسليم (CLI/Cron)

- استخدم معرف دردشة بوصفه الهدف.
- مثال: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## استكشاف الأخطاء وإصلاحها

**الروبوت لا يستجيب:**

- تحقق من أن الرمز صالح: `openclaw channels status --probe`
- تحقق من الموافقة على المرسل (الاقتران أو allowFrom)
- تحقق من سجلات Gateway: `openclaw logs --follow`

**Webhook لا يتلقى الأحداث:**

- تأكد من أن URL الخاص بـ Webhook يستخدم HTTPS
- تحقق من أن الرمز السري بين 8 و256 حرفًا
- تأكد من إمكانية الوصول إلى نقطة نهاية HTTP الخاصة بـ Gateway على المسار المضبوط
- تحقق من أن اقتراع getUpdates لا يعمل (فهما متنافيان)

## مرجع الإعدادات (Zalo)

الإعداد الكامل: [الإعدادات](/ar/gateway/configuration)

المفاتيح المسطحة في المستوى الأعلى (`channels.zalo.botToken` و`channels.zalo.dmPolicy` وما شابهها) هي اختصار قديم لحساب واحد. فضّل `channels.zalo.accounts.<id>.*` للإعدادات الجديدة. لا يزال كلا الشكلين موثقين هنا لأنهما موجودان في المخطط.

خيارات المزوّد:

- `channels.zalo.enabled`: تمكين/تعطيل بدء القناة.
- `channels.zalo.botToken`: رمز الروبوت من Zalo Bot Platform.
- `channels.zalo.tokenFile`: قراءة الرمز من مسار ملف عادي. تُرفض الروابط الرمزية.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (الافتراضي: pairing).
- `channels.zalo.allowFrom`: قائمة السماح للرسائل المباشرة (معرّفات المستخدمين). يتطلب `open` القيمة `"*"`. سيطلب المعالج معرّفات رقمية.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (الافتراضي: allowlist). موجود في الإعداد؛ راجع [الإمكانات](#capabilities) و[التحكم في الوصول (المجموعات)](#access-control-groups) لسلوك روبوت Marketplace الحالي.
- `channels.zalo.groupAllowFrom`: قائمة السماح لمرسلي المجموعة (معرّفات المستخدمين). تعود إلى `allowFrom` عند عدم ضبطها.
- `channels.zalo.mediaMaxMb`: حد الوسائط الواردة/الصادرة (بالميغابايت، الافتراضي 5).
- `channels.zalo.webhookUrl`: تمكين وضع Webhook (يتطلب HTTPS).
- `channels.zalo.webhookSecret`: سر Webhook (8-256 حرفًا).
- `channels.zalo.webhookPath`: مسار Webhook على خادم HTTP الخاص بـ Gateway.
- `channels.zalo.proxy`: URL الوكيل لطلبات API.

خيارات الحسابات المتعددة:

- `channels.zalo.accounts.<id>.botToken`: رمز لكل حساب.
- `channels.zalo.accounts.<id>.tokenFile`: ملف رمز عادي لكل حساب. تُرفض الروابط الرمزية.
- `channels.zalo.accounts.<id>.name`: اسم العرض.
- `channels.zalo.accounts.<id>.enabled`: تمكين/تعطيل الحساب.
- `channels.zalo.accounts.<id>.dmPolicy`: سياسة الرسائل المباشرة لكل حساب.
- `channels.zalo.accounts.<id>.allowFrom`: قائمة سماح لكل حساب.
- `channels.zalo.accounts.<id>.groupPolicy`: سياسة المجموعة لكل حساب. موجودة في الإعداد؛ راجع [الإمكانات](#capabilities) و[التحكم في الوصول (المجموعات)](#access-control-groups) لسلوك روبوت Marketplace الحالي.
- `channels.zalo.accounts.<id>.groupAllowFrom`: قائمة سماح مرسلي المجموعة لكل حساب.
- `channels.zalo.accounts.<id>.webhookUrl`: URL الخاص بـ Webhook لكل حساب.
- `channels.zalo.accounts.<id>.webhookSecret`: سر Webhook لكل حساب.
- `channels.zalo.accounts.<id>.webhookPath`: مسار Webhook لكل حساب.
- `channels.zalo.accounts.<id>.proxy`: URL الوكيل لكل حساب.

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعة والتقييد بالإشارة
- [توجيه القناة](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
