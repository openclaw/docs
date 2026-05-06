---
read_when:
    - استدعاء الأدوات دون تشغيل دورة وكيل كاملة
    - بناء عمليات أتمتة تحتاج إلى إنفاذ سياسة الأدوات
summary: استدعِ أداة واحدة مباشرةً عبر نقطة نهاية HTTP الخاصة بـ Gateway
title: واجهة برمجة تطبيقات استدعاء الأدوات
x-i18n:
    generated_at: "2026-05-06T07:57:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fcd490d4eaa63f23b0d502e537c4094ade88afcdd04e2b7df1a5f0484a11c57
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

يعرض Gateway في OpenClaw نقطة نهاية HTTP بسيطة لاستدعاء أداة واحدة مباشرة. وهي مفعّلة دائمًا وتستخدم مصادقة Gateway مع سياسة الأدوات. وكما هو الحال مع سطح `/v1/*` المتوافق مع OpenAI، تُعامل مصادقة الحامل بالسر المشترك بوصفها وصول مشغّل موثوقًا إلى Gateway بالكامل.

- `POST /tools/invoke`
- المنفذ نفسه مثل Gateway (تعدد إرسال WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

الحجم الأقصى الافتراضي للحمولة هو 2 ميغابايت.

## المصادقة

تستخدم إعدادات مصادقة Gateway.

مسارات مصادقة HTTP الشائعة:

- مصادقة السر المشترك (`gateway.auth.mode="token"` أو `"password"`):
  `Authorization: Bearer <token-or-password>`
- مصادقة HTTP موثوقة حاملة للهوية (`gateway.auth.mode="trusted-proxy"`):
  مرّر الطلب عبر الوكيل المهيأ والمدرك للهوية ودعه يحقن
  ترويسات الهوية المطلوبة
- مصادقة مفتوحة للدخول الخاص (`gateway.auth.mode="none"`):
  لا يلزم وجود ترويسة مصادقة

ملاحظات:

- عند `gateway.auth.mode="token"`، استخدم `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`).
- عند `gateway.auth.mode="password"`، استخدم `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`).
- عند `gateway.auth.mode="trusted-proxy"`، يجب أن يأتي طلب HTTP من
  مصدر وكيل موثوق مهيأ؛ وتتطلب وكلاء loopback على المضيف نفسه تفعيلًا صريحًا
  لـ `gateway.auth.trustedProxy.allowLoopback = true`.
- إذا كان `gateway.auth.rateLimit` مهيأً وحدثت إخفاقات مصادقة كثيرة جدًا، فتعيد نقطة النهاية `429` مع `Retry-After`.

## حد الأمان (مهم)

تعامل مع نقطة النهاية هذه كسطح **وصول كامل للمشغّل** لمثيل Gateway.

- مصادقة حامل HTTP هنا ليست نموذج نطاق ضيق لكل مستخدم.
- يجب التعامل مع رمز/كلمة مرور Gateway صالحة لنقطة النهاية هذه كبيان اعتماد مالك/مشغّل.
- في أوضاع مصادقة السر المشترك (`token` و`password`)، تستعيد نقطة النهاية افتراضيات المشغّل الكاملة المعتادة حتى إذا أرسل المستدعي ترويسة `x-openclaw-scopes` أضيق.
- تعامل مصادقة السر المشترك أيضًا استدعاءات الأدوات المباشرة على نقطة النهاية هذه كدورات مُرسِل مالك.
- تحترم أوضاع HTTP الموثوقة الحاملة للهوية (مثل مصادقة الوكيل الموثوق أو `gateway.auth.mode="none"` على دخول خاص) ترويسة `x-openclaw-scopes` عند وجودها، وإلا فتعود إلى مجموعة النطاقات الافتراضية المعتادة للمشغّل.
- أبقِ نقطة النهاية هذه على loopback/tailnet/دخول خاص فقط؛ لا تعرضها مباشرة على الإنترنت العام.

مصفوفة المصادقة:

- `gateway.auth.mode="token"` أو `"password"` + `Authorization: Bearer ...`
  - يثبت امتلاك سر مشغّل Gateway المشترك
  - يتجاهل `x-openclaw-scopes` الأضيق
  - يستعيد مجموعة نطاقات المشغّل الافتراضية الكاملة:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - يعامل استدعاءات الأدوات المباشرة على نقطة النهاية هذه كدورات مُرسِل مالك
- أوضاع HTTP الموثوقة الحاملة للهوية (مثل مصادقة الوكيل الموثوق، أو `gateway.auth.mode="none"` على دخول خاص)
  - تصادق هوية خارجية موثوقة أو حد نشر معين
  - تحترم `x-openclaw-scopes` عند وجود الترويسة
  - تعود إلى مجموعة نطاقات المشغّل الافتراضية المعتادة عند غياب الترويسة
  - لا تفقد دلالات المالك إلا عندما يضيّق المستدعي النطاقات صراحةً ويحذف `operator.admin`

## جسم الطلب

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

الحقول:

- `tool` (سلسلة نصية، مطلوب): اسم الأداة المراد استدعاؤها.
- `action` (سلسلة نصية، اختياري): يُربط ضمن args إذا كان مخطط الأداة يدعم `action` وكانت حمولة args قد حذفته.
- `args` (كائن، اختياري): وسيطات خاصة بالأداة.
- `sessionKey` (سلسلة نصية، اختياري): مفتاح الجلسة الهدف. إذا حُذف أو كان `"main"`، يستخدم Gateway مفتاح الجلسة الرئيسية المهيأ (يحترم `session.mainKey` والوكيل الافتراضي، أو `global` في النطاق العام).
- `dryRun` (قيمة منطقية، اختياري): محجوز للاستخدام المستقبلي؛ يتم تجاهله حاليًا.

## سلوك السياسة والتوجيه

تُرشّح إتاحة الأدوات عبر سلسلة السياسة نفسها المستخدمة بواسطة وكلاء Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- سياسات المجموعات (إذا كان مفتاح الجلسة يطابق مجموعة أو قناة)
- سياسة الوكيل الفرعي (عند الاستدعاء بمفتاح جلسة وكيل فرعي)

إذا لم تكن الأداة مسموحة بموجب السياسة، تعيد نقطة النهاية **404**.

ملاحظات مهمة حول الحدود:

- موافقات التنفيذ هي ضوابط حماية للمشغّل، وليست حد تفويض منفصلًا لنقطة نهاية HTTP هذه. إذا كان الوصول إلى أداة متاحًا هنا عبر مصادقة Gateway + سياسة الأدوات، فإن `/tools/invoke` لا تضيف مطالبة موافقة إضافية لكل استدعاء.
- لا تشارك بيانات اعتماد حامل Gateway مع مستدعين غير موثوقين. إذا كنت تحتاج إلى فصل عبر حدود الثقة، فشغّل Gateways منفصلة (ومن الأفضل مستخدمين/مضيفين منفصلين لنظام التشغيل).

يطبق HTTP في Gateway أيضًا قائمة منع صارمة افتراضيًا (حتى إذا كانت سياسة الجلسة تسمح بالأداة):

- `exec` - تنفيذ أوامر مباشر (سطح RCE)
- `spawn` - إنشاء عملية فرعية عشوائية (سطح RCE)
- `shell` - تنفيذ أوامر shell (سطح RCE)
- `fs_write` - تعديل ملفات عشوائي على المضيف
- `fs_delete` - حذف ملفات عشوائي على المضيف
- `fs_move` - نقل/إعادة تسمية ملفات عشوائية على المضيف
- `apply_patch` - يمكن لتطبيق الرقع إعادة كتابة ملفات عشوائية
- `sessions_spawn` - تنسيق الجلسات؛ إنشاء الوكلاء عن بُعد هو RCE
- `sessions_send` - حقن رسائل عبر الجلسات
- `cron` - مستوى تحكم للأتمتة المستمرة
- `gateway` - مستوى تحكم Gateway؛ يمنع إعادة التهيئة عبر HTTP
- `nodes` - يمكن لترحيل أوامر العقد الوصول إلى system.run على المضيفين المقترنين
- `whatsapp_login` - إعداد تفاعلي يتطلب مسح QR عبر الطرفية؛ يتوقف على HTTP

يمكنك تخصيص قائمة المنع هذه عبر `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list
      allow: ["gateway"],
    },
  },
}
```

لمساعدة سياسات المجموعات على حل السياق، يمكنك اختياريًا تعيين:

- `x-openclaw-message-channel: <channel>` (مثال: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (عند وجود عدة حسابات)

## الاستجابات

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (طلب غير صالح أو خطأ في إدخال الأداة)
- `401` → غير مصرح
- `429` → المصادقة محدودة المعدل (`Retry-After` معيّن)
- `404` → الأداة غير متاحة (غير موجودة أو غير مدرجة في قائمة السماح)
- `405` → الطريقة غير مسموحة
- `500` → `{ ok: false, error: { type, message } }` (خطأ غير متوقع في تنفيذ الأداة؛ رسالة منقحة)

## مثال

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```

## ذو صلة

- [بروتوكول Gateway](/ar/gateway/protocol)
- [الأدوات وPlugins](/ar/tools)
