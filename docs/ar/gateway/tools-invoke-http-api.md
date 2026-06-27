---
read_when:
    - استدعاء الأدوات دون تشغيل دورة كاملة للوكيل
    - بناء أتمتات تحتاج إلى فرض سياسات الأدوات
summary: استدعِ أداة واحدة مباشرةً عبر نقطة نهاية HTTP الخاصة بـ Gateway
title: واجهة API لاستدعاء الأدوات
x-i18n:
    generated_at: "2026-06-27T17:44:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2023505f5a705b62e2fd685d64d3f9bd7788d09adfe89ac99604e6660c78ad8a
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

تعرض Gateway في OpenClaw نقطة نهاية HTTP بسيطة لاستدعاء أداة واحدة مباشرة. تكون مفعلة دائمًا وتستخدم مصادقة Gateway إضافة إلى سياسة الأدوات. وكما هو الحال مع سطح `/v1/*` المتوافق مع OpenAI، تُعامل مصادقة Bearer بالسر المشترك بوصفها وصول مشغّل موثوقًا إلى Gateway بالكامل.

- `POST /tools/invoke`
- المنفذ نفسه مثل Gateway (تعدد إرسال WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

الحد الأقصى الافتراضي لحجم الحمولة هو 2 MB.

## المصادقة

تستخدم إعدادات مصادقة Gateway.

مسارات مصادقة HTTP الشائعة:

- مصادقة السر المشترك (`gateway.auth.mode="token"` أو `"password"`):
  `Authorization: Bearer <token-or-password>`
- مصادقة HTTP موثوقة تحمل هوية (`gateway.auth.mode="trusted-proxy"`):
  وجّه الطلب عبر الوكيل المهيأ والواعي بالهوية ودعه يحقن
  ترويسات الهوية المطلوبة
- مصادقة مفتوحة عبر مدخل خاص (`gateway.auth.mode="none"`):
  لا يلزم ترويسة مصادقة

ملاحظات:

- عند استخدام `gateway.auth.mode="token"`، استخدم `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`).
- عند استخدام `gateway.auth.mode="password"`، استخدم `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`).
- عند استخدام `gateway.auth.mode="trusted-proxy"`، يجب أن يأتي طلب HTTP من
  مصدر وكيل موثوق مهيأ؛ وتتطلب وكلاء loopback على المضيف نفسه ضبط
  `gateway.auth.trustedProxy.allowLoopback = true` صراحة.
- يمكن للمتصلين الداخليين من المضيف نفسه الذين يتجاوزون الوكيل استخدام
  `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` كبديل محلي مباشر.
  أي دليل من ترويسات `Forwarded` أو `X-Forwarded-*` أو `X-Real-IP`
  يُبقي الطلب بدلًا من ذلك على مسار الوكيل الموثوق.
- إذا كان `gateway.auth.rateLimit` مهيأ وحدث عدد كبير جدًا من إخفاقات المصادقة، فستُرجع نقطة النهاية `429` مع `Retry-After`.

## حد الأمان (مهم)

تعامل مع نقطة النهاية هذه كسطح **وصول مشغّل كامل** لمثيل Gateway.

- مصادقة HTTP Bearer هنا ليست نموذج نطاق ضيقًا لكل مستخدم.
- يجب التعامل مع رمز/كلمة مرور Gateway صالحة لنقطة النهاية هذه كما لو كانت بيانات اعتماد مالك/مشغّل.
- في أوضاع مصادقة السر المشترك (`token` و`password`)، تستعيد نقطة النهاية افتراضيات المشغّل الكاملة المعتادة حتى إذا أرسل المتصل ترويسة `x-openclaw-scopes` أضيق.
- تتعامل مصادقة السر المشترك أيضًا مع استدعاءات الأدوات المباشرة على نقطة النهاية هذه كدورات مرسِل مالك.
- تحترم أوضاع HTTP التي تحمل هوية موثوقة (مثل مصادقة الوكيل الموثوق أو `gateway.auth.mode="none"` على مدخل خاص) الترويسة `x-openclaw-scopes` عند وجودها، وإلا فترجع إلى مجموعة النطاقات الافتراضية المعتادة للمشغّل.
- أبقِ نقطة النهاية هذه على loopback/tailnet/مدخل خاص فقط؛ لا تعرضها مباشرة للإنترنت العام.

مصفوفة المصادقة:

- `gateway.auth.mode="token"` أو `"password"` + `Authorization: Bearer ...`
  - يثبت امتلاك سر مشغّل Gateway المشترك
  - يتجاهل `x-openclaw-scopes` الأضيق
  - يستعيد مجموعة نطاقات المشغّل الافتراضية الكاملة:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - يتعامل مع استدعاءات الأدوات المباشرة على نقطة النهاية هذه كدورات مرسِل مالك
- أوضاع HTTP التي تحمل هوية موثوقة (مثل مصادقة الوكيل الموثوق، أو `gateway.auth.mode="none"` على مدخل خاص)
  - تصادق هوية خارجية موثوقة أو حد نشر موثوق
  - تحترم `x-openclaw-scopes` عندما تكون الترويسة موجودة
  - ترجع إلى مجموعة نطاقات المشغّل الافتراضية المعتادة عندما تكون الترويسة غائبة
  - تفقد دلالات المالك فقط عندما يضيّق المتصل النطاقات صراحة ويحذف `operator.admin`

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

- `tool` (سلسلة نصية، مطلوب): اسم الأداة المطلوب استدعاؤها.
- `action` (سلسلة نصية، اختياري): يُعيَّن ضمن args إذا كان مخطط الأداة يدعم `action` وكانت حمولة args قد حذفته.
- `args` (كائن، اختياري): وسائط خاصة بالأداة.
- `sessionKey` (سلسلة نصية، اختياري): مفتاح الجلسة الهدف. إذا حُذف أو كان `"main"`، تستخدم Gateway مفتاح الجلسة الرئيسي المهيأ (مع احترام `session.mainKey` والوكيل الافتراضي، أو `global` في النطاق العام).
- `dryRun` (منطقي، اختياري): محجوز للاستخدام المستقبلي؛ يتم تجاهله حاليًا.

## سلوك السياسة والتوجيه

تُرشَّح إتاحة الأدوات عبر سلسلة السياسة نفسها المستخدمة بواسطة وكلاء Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- سياسات المجموعة (إذا كان مفتاح الجلسة يرتبط بمجموعة أو قناة)
- سياسة الوكيل الفرعي (عند الاستدعاء بمفتاح جلسة وكيل فرعي)

إذا لم تكن الأداة مسموحًا بها من السياسة، فستُرجع نقطة النهاية **404**.

ملاحظات مهمة على الحد:

- موافقات exec هي حواجز أمان للمشغّل، وليست حد تفويض منفصلًا لنقطة نهاية HTTP هذه. إذا كانت أداة قابلة للوصول هنا عبر مصادقة Gateway + سياسة الأدوات، فإن `/tools/invoke` لا يضيف مطالبة موافقة إضافية لكل استدعاء.
- إذا كان `exec` قابلًا للوصول هنا، فتعامل معه كسطح صدفة قادر على التغيير. إن رفض `write` أو `edit` أو `apply_patch` أو أدوات HTTP التي تكتب إلى نظام الملفات لا يجعل تنفيذ الصدفة للقراءة فقط.
- لا تشارك بيانات اعتماد Gateway Bearer مع متصلين غير موثوقين. إذا كنت تحتاج إلى فصل عبر حدود الثقة، فشغّل Gateways منفصلة (ويُفضّل أيضًا مستخدمين/مضيفين منفصلين على نظام التشغيل).

تطبق Gateway HTTP أيضًا قائمة منع صارمة افتراضيًا (حتى إذا سمحت سياسة الجلسة بالأداة):

- `exec` - تنفيذ أوامر مباشر (سطح RCE)
- `spawn` - إنشاء عمليات فرعية عشوائية (سطح RCE)
- `shell` - تنفيذ أوامر الصدفة (سطح RCE)
- `fs_write` - تعديل عشوائي للملفات على المضيف
- `fs_delete` - حذف عشوائي للملفات على المضيف
- `fs_move` - نقل/إعادة تسمية عشوائية للملفات على المضيف
- `apply_patch` - يمكن لتطبيق الرقع إعادة كتابة ملفات عشوائية
- `sessions_spawn` - تنسيق الجلسات؛ إنشاء وكلاء عن بُعد هو RCE
- `sessions_send` - حقن رسائل عبر الجلسات
- `cron` - مستوى تحكم للأتمتة المستمرة
- `gateway` - مستوى تحكم Gateway؛ يمنع إعادة التهيئة عبر HTTP
- `nodes` - يمكن لترحيل أوامر العقد الوصول إلى system.run على المضيفين المقترنين
- `whatsapp_login` - إعداد تفاعلي يتطلب مسح QR من الطرفية؛ يتوقف على HTTP

يمكنك تخصيص قائمة المنع هذه عبر `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list for owner/admin callers
      allow: ["gateway"],
    },
  },
}
```

`gateway.tools.allow` هو تجاوز للتعرّض، وليس ترقية للنطاق. في
أوضاع HTTP التي تحمل هوية، تظل `cron` و`gateway` و`nodes` غير متاحة
للمتصلين الذين لا يملكون هوية مالك/مسؤول (`operator.admin`) حتى عندما
تكون مدرجة في `gateway.tools.allow`. لا تزال مصادقة Bearer بالسر المشترك
تتبع قاعدة المشغّل الموثوق الكاملة أعلاه.

لمساعدة سياسات المجموعة على حل السياق، يمكنك اختياريًا ضبط:

- `x-openclaw-message-channel: <channel>` (مثال: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (عند وجود حسابات متعددة)

## الاستجابات

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (طلب غير صالح أو خطأ في إدخال الأداة)
- `401` → غير مخوّل
- `429` → محدد المعدل بسبب المصادقة (`Retry-After` مضبوط)
- `404` → الأداة غير متاحة (غير موجودة أو غير مدرجة في قائمة السماح)
- `405` → الطريقة غير مسموح بها
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
